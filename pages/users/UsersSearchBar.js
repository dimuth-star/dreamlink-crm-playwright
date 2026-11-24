const { expect } = require("@playwright/test");
const { SELECTORS, TIMEOUTS } = require("../../common/constants");

class UsersSearchBar {
  constructor(page) {
    this.page = page;
    this.searchInput = page.locator(SELECTORS.userSearchInput);
    this.loadingIndicator = page.locator(SELECTORS.deskLoadingIndicator);
    this.noResultsMessage = page.locator(SELECTORS.deskNoResultsMessage);
    this.userListRow = page.locator(SELECTORS.deskListRow);
  }

  async searchByEmail(keyword) {
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

  async expectExactRowCount(expectedCount) {
    await expect(this.userListRow).toHaveCount(expectedCount, {
      timeout: TIMEOUTS.default,
    });
  }

  async expectAllResultsContain(keyword) {
    await expect(this.userListRow.filter({ hasNotText: keyword })).toHaveCount(
      0,
      { timeout: TIMEOUTS.default },
    );
  }

  async expectNoResults(expectedMessage) {
    await expect(this.noResultsMessage).toBeVisible({
      timeout: TIMEOUTS.default,
    });
    await expect(this.noResultsMessage).toHaveText(expectedMessage);
  }
}

module.exports = { UsersSearchBar };
