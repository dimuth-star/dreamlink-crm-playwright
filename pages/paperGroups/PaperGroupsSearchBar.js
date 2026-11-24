const { expect } = require("@playwright/test");
const { SELECTORS, TIMEOUTS } = require("../../common/constants");
const { BasePage } = require("../BasePage");

// The Paper Groups list filters: partner chips, the standard filter bar and Clear All Filters.
// Searching by group name alone stays on PaperGroupsPage.searchByGroupName (used by the lifecycle tests).
class PaperGroupsSearchBar extends BasePage {
  constructor(page) {
    super(page);
    this.listRow = page.locator(SELECTORS.deskListRow);
    this.loadingIndicator = page.locator(SELECTORS.deskLoadingIndicator);
    this.recordCount = page.locator(SELECTORS.recordCount);
    // text filters by fixture key (see paperGroups.json invalidSearch.textFilters)
    this.textFilters = {
      groupName: page.locator(SELECTORS.paperGroupSearchInput),
      region: page.locator(SELECTORS.paperGroupRegionFilter),
      village: page.locator(SELECTORS.paperGroupVillageFilter),
      district: page.locator(SELECTORS.paperGroupDistrictFilter),
    };
    this.classificationFilter = page.locator(
      SELECTORS.paperGroupClassificationFilter,
    );
    this.importBatchFilter = page.locator(
      SELECTORS.paperGroupImportBatchFilter,
    );
    this.duplicateFilter = page.locator(SELECTORS.paperGroupDuplicateFilter);
    this.partnerChip = page.locator(SELECTORS.paperGroupPartnerChip);
    this.clearAllFiltersBtn = page.locator(SELECTORS.deskClearAllFiltersBtn);
  }

  async waitForList() {
    await this.loadingIndicator.waitFor({
      state: "hidden",
      timeout: TIMEOUTS.default,
    });
  }

  async searchByTextFilter(filterKey, value) {
    const input = this.textFilters[filterKey];
    await input.waitFor({ state: "visible", timeout: TIMEOUTS.default });
    await input.fill(value);
    await this.waitForList();
  }

  async searchByRegion(region) {
    await this.searchByTextFilter("region", region);
  }

  async searchByVillage(village) {
    await this.searchByTextFilter("village", village);
  }

  async searchByDistrict(district) {
    await this.searchByTextFilter("district", district);
  }

  async filterByClassification(classification) {
    await this.classificationFilter.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.classificationFilter.selectOption({ label: classification });
    await this.waitForList();
  }

  // Imported Batch is a Link to the import batch (PG-<year>-<code>); its options show the
  // uploaded file name, which is what the "Imported List" column displays.
  async searchByImportedList(fileName) {
    await this.importBatchFilter.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.importBatchFilter.fill(fileName);
    const option = this.page
      .locator(SELECTORS.autocompleteListbox)
      .locator(SELECTORS.autocompleteDropdownOption)
      .filter({ hasText: fileName })
      .first();
    await option.waitFor({ state: "visible", timeout: TIMEOUTS.default });
    await option.click();
    await this.waitForList();
  }

  async showDuplicatesOnly() {
    await this.duplicateFilter.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.duplicateFilter.check();
    await this.waitForList();
  }

  async selectPartnerChip(partner) {
    const chip = this.partnerChip.filter({
      has: this.page
        .locator(SELECTORS.paperGroupPartnerChipLabel)
        .and(this.page.getByText(partner, { exact: true })),
    });
    await chip.waitFor({ state: "visible", timeout: TIMEOUTS.default });
    await chip.click();
    await this.waitForList();
  }

  async clearAllFilters() {
    await this.clearAllFiltersBtn.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.clearAllFiltersBtn.click();
    await this.waitForList();
  }

  // --- assertions ---

  // Settled once no listed row lacks `cell`; then at least one row must be listed.
  async expectEveryRowHas(cell) {
    await expect(this.listRow.filter({ hasNot: cell })).toHaveCount(0, {
      timeout: TIMEOUTS.default,
    });
    await expect(this.listRow.first()).toBeVisible({
      timeout: TIMEOUTS.default,
    });
  }

  async expectAllGroupNamesContain(keyword) {
    await this.expectEveryRowHas(
      this.page.locator(SELECTORS.paperGroupNameLink, { hasText: keyword }),
    );
  }

  async expectGroupListed(groupName) {
    await expect(
      this.page
        .locator(SELECTORS.paperGroupNameLink)
        .and(this.page.getByText(groupName, { exact: true })),
    ).toBeVisible({ timeout: TIMEOUTS.default });
  }

  async expectAllRegionsContain(region) {
    await this.expectEveryRowHas(
      this.page.locator(SELECTORS.paperGroupRegionCell, { hasText: region }),
    );
  }

  async expectAllVillagesContain(village) {
    await this.expectEveryRowHas(
      this.page.locator(SELECTORS.paperGroupVillageCell, { hasText: village }),
    );
  }

  async expectAllDistrictsContain(district) {
    await this.expectEveryRowHas(
      this.page.locator(SELECTORS.paperGroupDistrictCell, {
        hasText: district,
      }),
    );
  }

  async expectAllClassifications(classification) {
    await this.expectEveryRowHas(
      this.page.locator(SELECTORS.paperGroupClassificationCell, {
        hasText: classification,
      }),
    );
  }

  async expectAllImportedLists(fileName) {
    await this.expectEveryRowHas(
      this.page.locator(SELECTORS.paperGroupImportedListCell, {
        hasText: fileName,
      }),
    );
  }

  async expectAllMarkedDuplicate(duplicateLabel) {
    await this.expectEveryRowHas(
      this.page.locator(SELECTORS.paperGroupDuplicateBadge, {
        hasText: duplicateLabel,
      }),
    );
  }

  // The pager total ("1–20 of 5,100") equals the chip's "<n> imported".
  async expectTotalCount(count) {
    await expect(this.recordCount).toContainText(
      `of ${count.toLocaleString("en-US")}`,
      { timeout: TIMEOUTS.default },
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
}

module.exports = { PaperGroupsSearchBar };
