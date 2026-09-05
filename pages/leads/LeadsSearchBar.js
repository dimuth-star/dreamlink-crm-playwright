const { expect } = require('@playwright/test');
const { SELECTORS, TIMEOUTS } = require('../../common/constants');
const leadsData = require('../../data/leads.json');

class LeadsSearchBar {
  constructor(page) {
    this.page = page;
    this.leadNumberInput = page.locator(SELECTORS.leadNumberSearchInput);
    this.savingGroupInput = page.locator(SELECTORS.leadSavingGroupSearchInput);
    this.loadingIndicator = page.locator(SELECTORS.deskLoadingIndicator);
    this.recordCount = page.locator(SELECTORS.recordCount);
    this.noResultsMessage = page.locator(SELECTORS.leadsNoResultsMessage);
  }

  async searchByLeadNumber(keyword) {
    await this.leadNumberInput.waitFor({ state: 'visible', timeout: TIMEOUTS.default });
    await this.leadNumberInput.fill(keyword);
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout: TIMEOUTS.default });
  }

  async searchBySavingGroup(groupName) {
    await this.savingGroupInput.waitFor({ state: 'visible', timeout: TIMEOUTS.default });
    await this.savingGroupInput.fill(groupName);
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout: TIMEOUTS.default });
  }

  async expectResultCount(expectedCount) {
    await expect(this.recordCount).toContainText(expectedCount, { timeout: TIMEOUTS.default });
  }

  async expectLeadVisible(keyword) {
    const leadLink = this.page.locator(SELECTORS.leadNameLink, { hasText: keyword });
    await expect(leadLink).toBeVisible({ timeout: TIMEOUTS.default });
  }

  async expectNoResults() {
    await expect(this.noResultsMessage).toBeVisible({ timeout: TIMEOUTS.default });
    await expect(this.noResultsMessage).toHaveText(leadsData.noResultsMessage);
  }
}

module.exports = { LeadsSearchBar };