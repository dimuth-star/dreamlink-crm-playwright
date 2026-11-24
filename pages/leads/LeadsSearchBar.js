const { expect } = require("@playwright/test");
const { SELECTORS, TIMEOUTS } = require("../../common/constants");
const { BasePage } = require("../BasePage");
const leadsData = require("../../data/leads.json");

class LeadsSearchBar extends BasePage {
  constructor(page) {
    super(page);
    this.leadNumberInput = page.locator(SELECTORS.leadNumberSearchInput);
    this.savingGroupInput = page.locator(SELECTORS.leadSavingGroupSearchInput);
    this.loadingIndicator = page.locator(SELECTORS.deskLoadingIndicator);
    this.leadListRow = page.locator(SELECTORS.deskListRow);
    this.noResultsMessage = page.locator(SELECTORS.leadsNoResultsMessage);
  }

  async searchByLeadNumber(keyword) {
    await this.leadNumberInput.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.leadNumberInput.fill(keyword);
    await this.loadingIndicator.waitFor({
      state: "hidden",
      timeout: TIMEOUTS.default,
    });
  }

  // The full group name is the search term: a last word such as "Sg" matches too many groups to
  // bring the one wanted into the dropdown (seen on VF Dev).
  async searchBySavingGroup(groupName) {
    await this.searchByAutocomplete(this.savingGroupInput, groupName, {
      searchTerm: groupName,
    });
    await this.loadingIndicator.waitFor({
      state: "hidden",
      timeout: TIMEOUTS.default,
    });
  }

  // Rows listed for this saving group (0 when it has none).
  async countBySavingGroup(groupName) {
    await this.searchBySavingGroup(groupName);
    // settled once no listed row belongs to another group (an empty result has no rows)
    await expect(
      this.leadListRow.filter({ hasNotText: groupName }),
    ).toHaveCount(0, { timeout: TIMEOUTS.default });
    return this.leadListRow.count();
  }

  // number of rows the search returned
  async expectResultCount(expectedCount) {
    await expect(this.leadListRow).toHaveCount(expectedCount, {
      timeout: TIMEOUTS.default,
    });
  }

  async expectLeadVisible(keyword) {
    const leadLink = this.page.locator(SELECTORS.leadNameLink, {
      hasText: keyword,
    });
    await expect(leadLink).toBeVisible({ timeout: TIMEOUTS.default });
  }

  async expectNoResults() {
    await expect(this.noResultsMessage).toBeVisible({
      timeout: TIMEOUTS.default,
    });
    await expect(this.noResultsMessage).toHaveText(leadsData.noResultsMessage);
  }
}

module.exports = { LeadsSearchBar };
