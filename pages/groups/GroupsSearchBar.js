const { expect } = require("@playwright/test");
const { SELECTORS, TIMEOUTS } = require("../../common/constants");

class GroupsSearchBar {
  constructor(page) {
    this.page = page;
    this.searchInput = page.locator(SELECTORS.groupSearchInput);
    this.loadingIndicator = page.locator(SELECTORS.deskLoadingIndicator);
    this.recordCount = page.locator(SELECTORS.recordCount);
    this.noResultsMessage = page.locator(SELECTORS.deskNoResultsMessage);
    this.groupListRow = page.locator(SELECTORS.deskListRow);
  }

  async searchByGroupName(keyword) {
    await this.searchInput.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.searchInput.fill(keyword);
    await this.loadingIndicator.waitFor({
      state: "hidden",
      timeout: TIMEOUTS.default,
    });
  }

  // number of rows the search returned
  async expectResultCount(expectedCount) {
    await expect(this.groupListRow).toHaveCount(expectedCount, {
      timeout: TIMEOUTS.default,
    });
  }

  async expectAllResultsContain(keyword) {
    await expect(this.groupListRow.filter({ hasNotText: keyword })).toHaveCount(
      0,
      { timeout: TIMEOUTS.default },
    );
  }

  async expectGroupVisible(groupName) {
    const groupLink = this.page.locator(SELECTORS.groupNameLink, {
      hasText: groupName,
    });
    await expect(groupLink).toBeVisible({ timeout: TIMEOUTS.default });
  }

  async expectMultipleResults() {
    await expect(this.groupListRow.nth(1)).toBeVisible({
      timeout: TIMEOUTS.default,
    });
  }

  async expectNoResults(expectedMessage) {
    await expect(this.noResultsMessage).toBeVisible({
      timeout: TIMEOUTS.default,
    });
    await expect(this.noResultsMessage).toHaveText(expectedMessage);
  }
}

module.exports = { GroupsSearchBar };
