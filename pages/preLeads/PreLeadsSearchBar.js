const { expect } = require("@playwright/test");
const { SELECTORS, TIMEOUTS } = require("../../common/constants");
const { BasePage } = require("../BasePage");
const preLeadsData = require("../../data/preLeads.json");

class PreLeadsSearchBar extends BasePage {
  constructor(page) {
    super(page);
    this.preLeadNumberInput = page.locator(SELECTORS.preLeadNumberSearchInput);
    this.savingGroupInput = page.locator(
      SELECTORS.preLeadSavingGroupSearchInput,
    );
    this.loadingIndicator = page.locator(SELECTORS.deskLoadingIndicator);
    this.preLeadListRow = page.locator(SELECTORS.deskListRow);
    this.noResultsMessage = page.locator(SELECTORS.deskNoResultsMessage);
  }

  async searchByPreLeadNumber(keyword) {
    await this.preLeadNumberInput.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.preLeadNumberInput.fill(keyword);
    await this.loadingIndicator.waitFor({
      state: "hidden",
      timeout: TIMEOUTS.default,
    });
  }

  async searchBySavingGroup(groupName) {
    await this.searchByAutocomplete(this.savingGroupInput, groupName);
    await this.loadingIndicator.waitFor({
      state: "hidden",
      timeout: TIMEOUTS.default,
    });
  }

  // number of rows the search returned
  async expectResultCount(expectedCount) {
    await expect(this.preLeadListRow).toHaveCount(expectedCount, {
      timeout: TIMEOUTS.default,
    });
  }

  async expectPreLeadVisible(keyword) {
    const preLeadLink = this.page.locator(SELECTORS.preLeadNameLink, {
      hasText: keyword,
    });
    await expect(preLeadLink).toBeVisible({ timeout: TIMEOUTS.default });
  }

  async expectNoResults() {
    await expect(this.noResultsMessage).toBeVisible({
      timeout: TIMEOUTS.default,
    });
    await expect(this.noResultsMessage).toHaveText(
      preLeadsData.noResultsMessage,
    );
  }
}

module.exports = { PreLeadsSearchBar };
