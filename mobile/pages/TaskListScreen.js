// "My Tasks": group filter, horizontal status sections (Newly Assigned / To Do / In Progress / Completed),
// and task cards labelled "TASK-n · <title>, Client Assessment · <group>".
const { MOBILE, MOBILE_TIMEOUTS } = require("../../common/mobileSelectors");
const { BasePage } = require("./BasePage");

// Status sections are horizontal pages in lifecycle order. A task moves right as it progresses:
// Newly Assigned (not scheduled) -> To Do (scheduled) -> In Progress (started) -> Completed.
const SECTION = { newlyAssigned: 0, toDo: 1, inProgress: 2, completed: 3 };
// Where to look for a task, most likely first: fresh tasks are always in Newly Assigned; tasks left
// mid-way by an earlier run are found by following the lifecycle.
const SEARCH_ORDER = [SECTION.newlyAssigned, SECTION.inProgress, SECTION.toDo, SECTION.completed];

class TaskListScreen extends BasePage {
  constructor() {
    super();
    this.section = null; // index of the section on screen, null when unknown
  }

  // Back out of task detail / forms until the list is showing.
  async goToList() {
    for (let i = 0; i < 6 && !(await this.exists(MOBILE.myTasksTitle)); i++) {
      await driver.back();
      await this.waitForAny([MOBILE.myTasksTitle, MOBILE.markCompletedBtn, MOBILE.surveyContainer], MOBILE_TIMEOUTS.default)
        .catch(() => {});
    }
    await this.first(MOBILE.myTasksTitle);
    this.section = (await this.exists(MOBILE.sectionHeader("Newly Assigned"))) ? SECTION.newlyAssigned : null;
  }

  async sectionsStrip() {
    for (const s of await $$(MOBILE.sectionsStrip)) if (await s.isDisplayed()) return s;
    throw new Error("task sections strip not found");
  }

  // One section swipe; returns false (and keeps the index) when the pager did not move.
  async swipeSection(direction) {
    const strip = await this.sectionsStrip();
    const before = await driver.getPageSource();
    await driver.execute("mobile: scrollGesture", { elementId: strip.elementId, direction, percent: 1.0 });
    const moved = (await driver.getPageSource()) !== before;
    if (moved && this.section !== null) this.section += direction === "right" ? 1 : -1;
    return moved;
  }

  async goToFirstSection() {
    if (await this.exists(MOBILE.sectionHeader("Newly Assigned"))) {
      this.section = SECTION.newlyAssigned;
      return;
    }
    for (let i = 0; i < 6 && (await this.swipeSection("left")); i++);
    this.section = SECTION.newlyAssigned;
  }

  // Swipe straight to a section from the known current one (no rewinding through every page).
  async goToSection(index) {
    if (this.section === null) await this.goToFirstSection();
    while (this.section < index) if (!(await this.swipeSection("right"))) break;
    while (this.section > index) if (!(await this.swipeSection("left"))) break;
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
    for (let i = 0; i < 3 && (await this.exists(MOBILE.filterSheetTitle)); i++) await driver.back();
    return false;
  }

  // Records every card of the group on the current section: task number + which section it is in.
  async recordCardsOnScreen(group, found) {
    for (const c of await $$(MOBILE.groupTaskCards(group))) {
      const desc = await c.getAttribute("content-desc"); // "TASK-n · <title>, Client Assessment · <group>..."
      const number = desc.split(" · ")[0];
      const title = desc.slice(number.length + 3).split(", Client Assessment")[0];
      found.add(number);
      this.taskSections.set(title, this.section);
    }
  }

  // Distinct task numbers for the group. Fresh tasks are all in Newly Assigned, so the other sections
  // are only scanned when that is not enough (a group resumed after an interrupted run). The scan also
  // records each task's section, so later lookups go straight there (or skip completed tasks).
  async groupTaskNumbers(group, expected) {
    this.taskSections = new Map();
    const found = new Set();
    await this.goToSection(SECTION.newlyAssigned);
    await this.recordCardsOnScreen(group, found);
    if (found.size >= expected) return found;
    for (const index of [SECTION.toDo, SECTION.inProgress, SECTION.completed]) {
      await this.goToSection(index);
      await this.recordCardsOnScreen(group, found);
    }
    await this.goToSection(SECTION.newlyAssigned);
    return found;
  }

  // Known from the initial scan: the task was already completed (resumed run), no need to open it.
  isKnownCompleted(title) {
    return this.taskSections && this.taskSections.get(title) === SECTION.completed;
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
      { timeout, interval, timeoutMsg: `${count} tasks for "${group}" did not sync to the app` },
    );
  }

  async openTask(title, group) {
    await this.goToList();
    const cardSel = MOBILE.taskCard(title, group);
    let found = false;
    // go straight to the section recorded by the initial scan, then fall back to the lifecycle order
    const known = this.taskSections ? this.taskSections.get(title) : undefined;
    const order = known === undefined ? SEARCH_ORDER : [known, ...SEARCH_ORDER.filter((i) => i !== known)];
    for (const index of order) {
      await this.goToSection(index);
      if ((found = await this.exists(cardSel))) break;
    }
    if (!found) throw new Error(`no card for "${title}" (${group}) in any section`);
    await this.tap(cardSel);
    await driver.waitUntil(
      async () => !(await this.exists(MOBILE.myTasksTitle)) && (await this.exists(MOBILE.taskTitleText(title))),
      { timeout: MOBILE_TIMEOUTS.default, interval: 700, timeoutMsg: `task detail for "${title}" did not open` },
    );
  }

  // --- assertions ---
  expectKnownCompleted(title) {
    expect(this.isKnownCompleted(title)).toBe(true);
  }

  // Uses the scan made by waitForGroupTasks (no second pass through the sections).
  async expectGroupTaskCount(group, count) {
    const scan = this.lastScan || (await this.groupTaskNumbers(group, count));
    expect(scan.size).toBe(count);
  }
}

module.exports = { TaskListScreen };
