// "My Tasks": group filter, horizontal status sections (Newly Assigned / To Do / In Progress / Completed),
// and task cards labelled "TASK-n · <title>, Client Assessment · <group>".
const {
  MOBILE,
  MOBILE_TIMEOUTS,
  MOBILE_TEXT,
} = require("../../common/mobileSelectors");
const { BasePage } = require("./BasePage");

// Status sections are horizontal pages in lifecycle order (same order as MOBILE_TEXT.taskSections).
// A task moves right as it progresses: Newly Assigned (not scheduled) -> To Do (scheduled) ->
// In Progress (started) -> Completed. The pager has one more page after Completed, with no header.
const SECTION = { newlyAssigned: 0, toDo: 1, inProgress: 2, completed: 3 };
// Where to look for a task, most likely first: fresh tasks are always in Newly Assigned; tasks left
// mid-way by an earlier run are found by following the lifecycle.
const SEARCH_ORDER = [
  SECTION.newlyAssigned,
  SECTION.inProgress,
  SECTION.toDo,
  SECTION.completed,
];
const MAX_SECTION_SWIPES = 8; // 5 pages: enough to cross the whole pager in either direction
// Task detail -> form -> nested dialog is the deepest the app can be left; 6 backs always reach the list.
const MAX_BACKS_TO_LIST = 6;
const MAX_BACKS_TO_CLOSE_FILTER = 3; // group dropdown, then the sheet

class TaskListScreen extends BasePage {
  constructor() {
    super();
    this.taskSections = new Map(); // task title -> section index, from the last scan
    this.lastScan = null;
  }

  // Back out of task detail / forms until the list is showing.
  async goToList() {
    for (
      let i = 0;
      i < MAX_BACKS_TO_LIST && !(await this.exists(MOBILE.myTasksTitle));
      i++
    ) {
      await driver.back();
      await this.firstToAppear([
        MOBILE.myTasksTitle,
        MOBILE.markCompletedBtn,
        MOBILE.surveyContainer,
      ]);
    }
    await this.first(MOBILE.myTasksTitle);
  }

  async sectionsStrip() {
    for (const s of await $$(MOBILE.sectionsStrip))
      if (await s.isDisplayed()) return s;
    throw new Error("task sections strip not found");
  }

  // The pager keeps only the page on screen in the tree, so its header tells where we are.
  // Returns the SECTION index, or null on the page after Completed (it has no header).
  async currentSection() {
    for (const [index, name] of MOBILE_TEXT.taskSections.entries()) {
      if (await this.exists(MOBILE.sectionHeader(name))) return index;
    }
    return null;
  }

  async swipeSection(direction, from) {
    const strip = await this.sectionsStrip();
    await driver.execute("mobile: scrollGesture", {
      elementId: strip.elementId,
      direction,
      percent: 1.0,
    });
    // let the pager settle on the next page; goToSection reads the header again either way
    await this.within(
      MOBILE_TIMEOUTS.short,
      async () => (await this.currentSection()) !== from,
    );
  }

  // Swipe until the section's own header is on screen: the position is read, never counted.
  async goToSection(index) {
    for (let i = 0; i < MAX_SECTION_SWIPES; i++) {
      const current = await this.currentSection();
      if (current === index) return;
      await this.swipeSection(
        current !== null && current < index ? "right" : "left",
        current,
      );
    }
    throw new Error(
      `could not reach the "${MOBILE_TEXT.taskSections[index]}" section`,
    );
  }

  // Returns false when the group is not offered yet (its tasks have not synced to the device).
  async applyGroupFilter(group) {
    await this.tap(MOBILE.filterBtn);
    await this.first(MOBILE.filterSheetTitle);
    await this.tap(MOBILE.filterGroupField);
    const search = await this.first(MOBILE.filterSearchInput);
    await search.setValue(group);
    if (await this.exists(MOBILE.filterOption(group))) {
      await this.tap(MOBILE.filterOption(group));
      await this.tap(MOBILE.filterApplyBtn);
      await this.waitForGone(MOBILE.filterSheetTitle);
      return true;
    }
    // close the dropdown and the sheet without applying anything
    for (
      let i = 0;
      i < MAX_BACKS_TO_CLOSE_FILTER &&
      (await this.exists(MOBILE.filterSheetTitle));
      i++
    ) {
      await driver.back();
    }
    return false;
  }

  // Records every card of the group on the section on screen: task number + which section it is in.
  async recordCardsOnScreen(group, found, section) {
    for (const c of await $$(MOBILE.groupTaskCards(group))) {
      const desc = await c.getAttribute("content-desc"); // "TASK-n · <title>, Client Assessment · <group>..."
      const number = desc.split(MOBILE_TEXT.cardSeparator)[0];
      const title = desc
        .slice(number.length + MOBILE_TEXT.cardSeparator.length)
        .split(`, ${MOBILE_TEXT.cardTaskType}`)[0];
      found.add(number);
      this.taskSections.set(title, section);
    }
  }

  // Distinct task numbers for the group. Fresh tasks are all in Newly Assigned, so the other sections
  // are only scanned when that is not enough (a group resumed after an interrupted run). The scan also
  // records each task's section, so openTask() goes straight there.
  async groupTaskNumbers(group, expected) {
    this.taskSections = new Map();
    const found = new Set();
    await this.goToSection(SECTION.newlyAssigned);
    await this.recordCardsOnScreen(group, found, SECTION.newlyAssigned);
    if (found.size >= expected) return found;
    for (const index of [SECTION.toDo, SECTION.inProgress, SECTION.completed]) {
      await this.goToSection(index);
      await this.recordCardsOnScreen(group, found, index);
    }
    await this.goToSection(SECTION.newlyAssigned);
    return found;
  }

  // Poll (no refresh taps) until background sync delivers `count` tasks for the group.
  async waitForGroupTasks(group, count, { timeout, interval }) {
    let filtered = false;
    await driver.waitUntil(
      async () => {
        if (!filtered) filtered = await this.applyGroupFilter(group);
        if (!filtered) return false;
        this.lastScan = await this.groupTaskNumbers(group, count);
        return this.lastScan.size >= count;
      },
      {
        timeout,
        interval,
        timeoutMsg: `${count} tasks for "${group}" did not sync to the app`,
      },
    );
  }

  async openTask(title, group) {
    await this.goToList();
    const cardSel = MOBILE.taskCard(title, group);
    let found = false;
    // go straight to the section recorded by the initial scan, then fall back to the lifecycle order
    const known = this.taskSections.get(title);
    const order =
      known === undefined
        ? SEARCH_ORDER
        : [known, ...SEARCH_ORDER.filter((i) => i !== known)];
    for (const index of order) {
      await this.goToSection(index);
      if ((found = await this.exists(cardSel))) break;
    }
    if (!found)
      throw new Error(`no card for "${title}" (${group}) in any section`);
    await this.tap(cardSel);
    await driver.waitUntil(
      async () =>
        !(await this.exists(MOBILE.myTasksTitle)) &&
        (await this.exists(MOBILE.taskTitleText(title))),
      {
        timeout: MOBILE_TIMEOUTS.default,
        interval: MOBILE_TIMEOUTS.poll,
        timeoutMsg: `task detail for "${title}" did not open`,
      },
    );
  }

  // --- assertions ---
  // Uses the scan made by waitForGroupTasks (no second pass through the sections).
  async expectGroupTaskCount(group, count) {
    const scan = this.lastScan || (await this.groupTaskNumbers(group, count));
    expect(scan.size).toBe(count);
  }
}

module.exports = { TaskListScreen };
