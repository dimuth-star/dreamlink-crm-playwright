const { expect } = require("@playwright/test");
const { SELECTORS, TIMEOUTS } = require("../../common/constants");
const { BasePage } = require("../BasePage");

class CriteriaSetsPage extends BasePage {
  constructor(page) {
    super(page);
    this.createCriteriaSetBtn = page.locator(SELECTORS.createCriteriaSetBtn);
    this.criteriaSetRow = page.locator(SELECTORS.criteriaSetRow);
    this.searchInput = page.locator(SELECTORS.criteriaSetSearchInput);
    this.noResultsMessage = page.locator(SELECTORS.criteriaSetNoResultsMessage);
  }

  async clickCreateCriteriaSet() {
    await this.createCriteriaSetBtn.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.createCriteriaSetBtn.click();
    await this.page.waitForLoadState("domcontentloaded");
  }

  async expectCriteriaSetListPopulated() {
    await expect(this.criteriaSetRow.first()).toBeVisible({
      timeout: TIMEOUTS.default,
    });
  }

  // A set name to search for, read from the loaded list (no fixed record needed).
  async readFirstSetName() {
    const firstName = this.criteriaSetRow
      .first()
      .locator(SELECTORS.criterionNameLink);
    await expect(
      firstName,
      "Criteria Sets list is empty: nothing to search for",
    ).toBeVisible({ timeout: TIMEOUTS.default });
    return (await firstName.innerText()).trim();
  }

  async searchBySetName(keyword) {
    await this.searchInput.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.searchInput.clear();
    await this.searchInput.fill(keyword);
    await expect(this.searchInput).toHaveValue(keyword, {
      timeout: TIMEOUTS.default,
    });
  }

  setRow(name) {
    return this.criteriaSetRow.filter({
      has: this.page.getByRole("link", { name, exact: true }),
    });
  }

  async expectExactRowCount(expectedCount) {
    await expect(this.criteriaSetRow).toHaveCount(expectedCount, {
      timeout: TIMEOUTS.default,
    });
  }

  async expectSetListed(name) {
    await expect(this.setRow(name)).toBeVisible({ timeout: TIMEOUTS.default });
  }

  async expectAllResultsContain(keyword) {
    await expect(
      this.criteriaSetRow.filter({ hasNotText: keyword }),
    ).toHaveCount(0, { timeout: TIMEOUTS.default });
  }

  // The row's cells, one per line: name, group type, criteria (comma separated), count, dates.
  async expectSetRow(name, groupType, criteriaNames) {
    const row = this.setRow(name);
    await expect(row).toBeVisible({ timeout: TIMEOUTS.default });
    const cells = (await row.innerText())
      .split("\n")
      .map((cell) => cell.trim());
    expect(cells, `group type of set "${name}"`).toContain(groupType);
    expect(cells, `criteria count of set "${name}"`).toContain(
      String(criteriaNames.length),
    );
    for (const criterion of criteriaNames) {
      await expect(row, `set "${name}" lists "${criterion}"`).toContainText(
        criterion,
      );
    }
  }

  async expectNoResults(expectedMessage) {
    await expect(this.noResultsMessage).toBeVisible({
      timeout: TIMEOUTS.default,
    });
    await expect(this.noResultsMessage).toHaveText(expectedMessage);
  }
}

module.exports = { CriteriaSetsPage };
