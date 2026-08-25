const { expect } = require('@playwright/test');
const { SELECTORS, TIMEOUTS } = require('../../common/constants');

class CriteriaSetsPage {
  constructor(page) {
    this.page = page;
    this.createCriteriaSetBtn = page.locator(SELECTORS.createCriteriaSetBtn);
    this.criteriaSetRow = page.locator(SELECTORS.criteriaSetRow);
    this.searchInput = page.locator(SELECTORS.criteriaSetSearchInput);
    this.noResultsMessage = page.locator(SELECTORS.criteriaSetNoResultsMessage);
  }

  async clickCreateCriteriaSet() {
    await this.createCriteriaSetBtn.waitFor({ state: 'visible', timeout: TIMEOUTS.default });
    await this.createCriteriaSetBtn.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async expectCriteriaSetListPopulated() {
    await this.criteriaSetRow.first().waitFor({ state: 'visible', timeout: TIMEOUTS.default });
    const count = await this.criteriaSetRow.count();
    expect(count).toBeGreaterThan(0);
  }

  async searchBySetName(keyword) {
    await this.searchInput.waitFor({ state: 'visible', timeout: TIMEOUTS.default });
    await this.searchInput.fill(keyword);
    await expect(this.criteriaSetRow).not.toHaveCount(20, { timeout: TIMEOUTS.default });
  }

  async expectExactRowCount(expectedCount) {
    const count = await this.criteriaSetRow.count();
    expect(count).toBe(expectedCount);
  }

  async expectNoResults() {
    await expect(this.noResultsMessage).toBeVisible({ timeout: TIMEOUTS.default });
    await expect(this.noResultsMessage).toHaveText('No matching eligibility criteria sets.');
  }
}

module.exports = { CriteriaSetsPage };