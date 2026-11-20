const { expect } = require("@playwright/test");
const { SELECTORS, TIMEOUTS } = require("../../common/constants");

class LeadDetailPage {
  constructor(page) {
    this.page = page;
    this.leadNumber = page.locator(SELECTORS.leadNumber);
    this.leadGeneratedDate = page.locator(SELECTORS.leadGeneratedDate);
    this.leadSavingGroupValue = page.locator(SELECTORS.leadSavingGroupValue);
    this.leadCurrentWorkflowStage = page.locator(
      SELECTORS.leadCurrentWorkflowStage,
    );
    this.tasksGroupHead = page.locator(SELECTORS.leadTasksGroupHead);
    this.tasksStagePill = page.locator(SELECTORS.leadTasksStagePill);
    this.tasksCountLabel = page.locator(SELECTORS.leadTasksCountLabel);
    this.leadTaskStatusPills = page.locator(SELECTORS.leadTaskStatusPill);
    this.taskRows = page.locator(SELECTORS.leadTaskRows);
    this.taskStatusPills = page.locator(SELECTORS.leadTaskStatusPills);
    this.assignTasksBtn = page.locator(SELECTORS.leadAssignTasksBtn);
  }

  async clickAssignTasks() {
    await this.assignTasksBtn.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.assignTasksBtn.click();
  }

  async reload() {
    await this.page.reload();
    await this.page.waitForLoadState("domcontentloaded");
  }

  async expectTaskCount(expectedCount) {
    await expect(this.tasksCountLabel).toContainText(`${expectedCount} tasks`, {
      timeout: TIMEOUTS.default,
    });
    await expect(this.taskStatusPills).toHaveCount(expectedCount, {
      timeout: TIMEOUTS.default,
    });
  }

  async expectAllTasksStatus(expectedCount, status) {
    await expect(this.taskStatusPills).toHaveText(
      Array(expectedCount).fill(status),
      { timeout: TIMEOUTS.default },
    );
  }

  async expectAllTasksAssignedTo(expectedCount, userName) {
    await expect(this.taskRows.filter({ hasText: userName })).toHaveCount(
      expectedCount,
      { timeout: TIMEOUTS.default },
    );
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/dl-lead\//, {
      timeout: TIMEOUTS.navigation,
    });
  }

  async expectLeadNumberNotEmpty() {
    await expect(this.leadNumber).toBeVisible({ timeout: TIMEOUTS.default });
    const value = await this.leadNumber.innerText();
    expect(value.trim()).not.toBe("");
  }

  async expectLeadSavingGroupNotEmpty() {
    await expect(this.leadSavingGroupValue).toBeVisible({
      timeout: TIMEOUTS.default,
    });
    const value = await this.leadSavingGroupValue.innerText();
    expect(value.trim()).not.toBe("");
  }

  async expectLeadSavingGroup(groupName) {
    await expect(this.leadSavingGroupValue).toBeVisible({
      timeout: TIMEOUTS.default,
    });
    await expect(this.leadSavingGroupValue).toContainText(groupName);
  }

  async expectCurrentWorkflowStageNotEmpty() {
    await expect(this.leadCurrentWorkflowStage).toBeVisible({
      timeout: TIMEOUTS.default,
    });
    const value = await this.leadCurrentWorkflowStage.innerText();
    expect(value.trim()).not.toBe("");
  }

  async expectTasksListNotEmpty() {
    await expect(this.tasksStagePill).toBeVisible({
      timeout: TIMEOUTS.default,
    });
    await expect(this.tasksCountLabel).toBeVisible({
      timeout: TIMEOUTS.default,
    });
    const countText = await this.tasksCountLabel.innerText();
    expect(countText.trim()).not.toBe("");
  }

  async expectGeneratedDateIsToday() {
    await expect(this.leadGeneratedDate).toBeVisible({
      timeout: TIMEOUTS.default,
    });
    const dateText = await this.leadGeneratedDate.innerText();
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    expect(dateText.trim()).toContain(`${dd}-${mm}-${yyyy}`);
  }

  async expectSixTasksAllAssigned() {
    await expect(this.tasksStagePill).toBeVisible({
      timeout: TIMEOUTS.default,
    });
    await expect(this.tasksStagePill).toContainText("Client Assessment");
    await expect(this.tasksCountLabel).toContainText("6 tasks");
    const pills = this.leadTaskStatusPills;
    await expect(pills).toHaveCount(6, { timeout: TIMEOUTS.default });
    for (let i = 0; i < 6; i++) {
      await expect(pills.nth(i)).toContainText("Assigned");
    }
  }

  // Polls (reloading the lead each time) until each named task's row shows `status`. Matching by title
  // ignores follow-up tasks the workflow adds afterwards (e.g. "Review Loan Documents").
  async expectTasksStatusEventually(taskTitles, status, timeout = TIMEOUTS.sync) {
    await expect
      .poll(
        async () => {
          await this.reload();
          await this.taskRows
            .first()
            .waitFor({ state: "visible", timeout: TIMEOUTS.default })
            .catch(() => {});
          const result = {};
          for (const title of taskTitles) {
            const row = this.taskRows.filter({ hasText: title });
            result[title] = (await row.count()) === 1 && (await row.innerText()).includes(status);
          }
          return result;
        },
        { timeout, intervals: [10000] },
      )
      .toEqual(Object.fromEntries(taskTitles.map((t) => [t, true])));
  }

}

module.exports = { LeadDetailPage };
