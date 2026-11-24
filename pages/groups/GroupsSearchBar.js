const { expect } = require("@playwright/test");
const { SELECTORS, TIMEOUTS } = require("../../common/constants");
const { BasePage } = require("../BasePage");

class GroupsSearchBar {
  constructor(page) {
    this.page = page;
    this.searchInput = page.locator(SELECTORS.groupSearchInput);
    this.loadingIndicator = page.locator(SELECTORS.deskLoadingIndicator);
    this.recordCount = page.locator(SELECTORS.recordCount);
    this.noResultsMessage = page.locator(SELECTORS.deskNoResultsMessage);
    this.groupListRow = page.locator(SELECTORS.deskListRow);
    // text filters by fixture key (see groups.json invalidSearch.textFilters)
    this.textFilters = {
      groupNumber: page.locator(SELECTORS.groupNumberFilter),
      meetingLocation: page.locator(SELECTORS.groupMeetingLocationFilter),
      region: page.locator(SELECTORS.groupRegionFilter),
      partner: page.locator(SELECTORS.groupPartnerFilter),
    };
    this.productFilter = page.locator(SELECTORS.groupProductFilter);
    this.statusFilter = page.locator(SELECTORS.groupStatusFilter);
    this.clearAllFiltersBtn = page.locator(SELECTORS.deskClearAllFiltersBtn);
  }

  async searchByTextFilter(filterKey, value) {
    const input = this.textFilters[filterKey];
    await input.waitFor({ state: "visible", timeout: TIMEOUTS.default });
    await input.fill(value);
    await this.loadingIndicator.waitFor({
      state: "hidden",
      timeout: TIMEOUTS.default,
    });
  }

  async searchByGroupNumber(groupNumber) {
    await this.searchByTextFilter("groupNumber", groupNumber);
  }

  async searchByMeetingLocation(meetingLocation) {
    await this.searchByTextFilter("meetingLocation", meetingLocation);
  }

  async searchByPartner(partner) {
    await this.searchByTextFilter("partner", partner);
  }

  // Product is a Link filter: pick the product from its autocomplete.
  async searchByProduct(productName) {
    await new BasePage(this.page).searchByAutocomplete(
      this.productFilter,
      productName,
    );
    await this.loadingIndicator.waitFor({
      state: "hidden",
      timeout: TIMEOUTS.default,
    });
  }

  async filterByStatus(status) {
    await this.statusFilter.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.statusFilter.selectOption({ label: status });
    await this.loadingIndicator.waitFor({
      state: "hidden",
      timeout: TIMEOUTS.default,
    });
  }

  async clearAllFilters() {
    await this.clearAllFiltersBtn.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.clearAllFiltersBtn.click();
    await this.loadingIndicator.waitFor({
      state: "hidden",
      timeout: TIMEOUTS.default,
    });
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

  // Settled once no listed row lacks `cell`; then at least one row must be listed.
  async expectEveryRowHas(cell) {
    await expect(this.groupListRow.filter({ hasNot: cell })).toHaveCount(0, {
      timeout: TIMEOUTS.default,
    });
    await expect(this.groupListRow.first()).toBeVisible({
      timeout: TIMEOUTS.default,
    });
  }

  async expectGroupNumberListedOnce(groupNumber) {
    await expect(this.groupListRow).toHaveCount(1, {
      timeout: TIMEOUTS.default,
    });
    await expect(
      this.groupListRow.locator(SELECTORS.groupNumberCell),
    ).toHaveText(groupNumber, { timeout: TIMEOUTS.default });
  }

  async expectAllMeetingLocationsContain(meetingLocation) {
    await this.expectEveryRowHas(
      this.page.locator(SELECTORS.groupMeetingLocationCell, {
        hasText: meetingLocation,
      }),
    );
  }

  async expectAllPartnersContain(partner) {
    await this.expectEveryRowHas(
      this.page.locator(SELECTORS.groupPartnerCell, { hasText: partner }),
    );
  }

  async expectAllRowsListProduct(productName) {
    await this.expectEveryRowHas(
      this.page.locator(SELECTORS.groupProductLine, { hasText: productName }),
    );
  }

  // scoreBadge as shown in the Products and Eligibility column, e.g. "7/7"
  async expectAllRowsHaveScore(scoreBadge) {
    await this.expectEveryRowHas(
      this.page.locator(SELECTORS.groupProductScoreBadge, {
        hasText: scoreBadge,
      }),
    );
  }

  async expectAllRowsHaveStatus(status) {
    await this.expectEveryRowHas(
      this.page.locator(SELECTORS.groupProductStatusBadge, { hasText: status }),
    );
  }

  // After Clear All Filters: the pager total is back and every text filter is empty.
  async expectFullListRestored(totalCount) {
    await expect(this.recordCount).toContainText(`of ${totalCount}`, {
      timeout: TIMEOUTS.default,
    });
    for (const input of Object.values(this.textFilters)) {
      await expect(input).toHaveValue("", { timeout: TIMEOUTS.default });
    }
  }

  async expectNoResults(expectedMessage) {
    await expect(this.noResultsMessage).toBeVisible({
      timeout: TIMEOUTS.default,
    });
    await expect(this.noResultsMessage).toHaveText(expectedMessage);
  }
}

module.exports = { GroupsSearchBar };
