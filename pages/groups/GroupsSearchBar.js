const { expect } = require('@playwright/test');
const { SELECTORS, TIMEOUTS } = require('../../common/constants');

class GroupsSearchBar {
  constructor(page) {
    this.page = page;
    this.searchInput = page.locator(SELECTORS.groupSearchInput);
    this.loadingIndicator = page.locator(SELECTORS.groupListLoading);
    this.recordCount = page.locator(SELECTORS.recordCount);
    this.noResultsMessage = page.locator(SELECTORS.groupNoResultsMessage);
  }

  async searchByGroupName(keyword) {
    await this.searchInput.waitFor({ state: 'visible', timeout: TIMEOUTS.default });
    await this.searchInput.fill(keyword);
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout: TIMEOUTS.default });
  }

  async expectResultCount(expectedCount) {
    await expect(this.recordCount).toContainText(expectedCount, { timeout: TIMEOUTS.default });
  }

  async expectGroupVisible(groupName) {
    const groupLink = this.page.locator(SELECTORS.groupNameLink, { hasText: groupName });
    await expect(groupLink).toBeVisible({ timeout: TIMEOUTS.default });
  }

  async expectMultipleResults() {
    const rows = this.page.locator(SELECTORS.groupListRow);
    const count = await rows.count();
    expect(count).toBeGreaterThan(1);
  }

  async expectNoResults() {
    await expect(this.noResultsMessage).toBeVisible({ timeout: TIMEOUTS.default });
    await expect(this.noResultsMessage).toHaveText(
      'No DreamSave Groups found with matching filters. Clear filters to see all DreamSave Groups.'
    );
  }
}

module.exports = { GroupsSearchBar };