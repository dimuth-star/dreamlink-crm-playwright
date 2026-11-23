const { expect } = require("@playwright/test");
const { SELECTORS, TIMEOUTS, DEFAULTS } = require("../../common/constants");

class CriteriaSearchBar {
  constructor(page) {
    this.page = page;
    this.searchInput = page.locator(SELECTORS.criteriaSearchInput);
    this.criteriaRow = page.locator(SELECTORS.eligibilityCriteriaRow);
    this.noResultsMessage = page.locator(SELECTORS.criteriaNoResultsMessage);
  }

  async searchByCriterionName(keyword) {
    await this.searchInput.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.searchInput.fill(keyword);
    await expect(this.criteriaRow).not.toHaveCount(DEFAULTS.pageSize, {
      timeout: TIMEOUTS.default,
    });
  }

  criterionRow(name) {
    return this.criteriaRow.filter({
      has: this.page.getByRole("link", { name, exact: true }),
    });
  }

  async expectExactRowCount(expectedCount) {
    await expect(this.criteriaRow).toHaveCount(expectedCount, {
      timeout: TIMEOUTS.default,
    });
  }

  async expectCriterionListed(name) {
    await expect(this.criterionRow(name)).toBeVisible({
      timeout: TIMEOUTS.default,
    });
  }

  async expectAllResultsContain(keyword) {
    await expect(this.criteriaRow.filter({ hasNotText: keyword })).toHaveCount(
      0,
      { timeout: TIMEOUTS.default },
    );
  }

  // The row's cells, one per line: name, group type, logic, dates, status.
  async expectCriterionRow(name, groupType, logicText) {
    const row = this.criterionRow(name);
    await expect(row).toBeVisible({ timeout: TIMEOUTS.default });
    const cells = (await row.innerText())
      .split("\n")
      .map((cell) => cell.trim());
    expect(cells, `group type of criterion "${name}"`).toContain(groupType);
    expect(cells, `logic of criterion "${name}"`).toContain(logicText);
  }

  async expectNoResults(expectedMessage) {
    await expect(this.noResultsMessage).toBeVisible({
      timeout: TIMEOUTS.default,
    });
    await expect(this.noResultsMessage).toHaveText(expectedMessage);
  }
}

module.exports = { CriteriaSearchBar };
