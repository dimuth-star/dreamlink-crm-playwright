const { expect } = require("@playwright/test");
const fs = require("fs");
const { SELECTORS, TIMEOUTS } = require("../../common/constants");
const { BasePage } = require("../BasePage");
const { readHeaderRow } = require("../../util/paperGroupFile");

class PaperGroupsPage extends BasePage {
  constructor(page) {
    super(page);
    this.pageTitle = page.locator(SELECTORS.paperGroupsPageTitle);
    this.downloadTemplateBtn = page.locator(
      SELECTORS.paperGroupDownloadTemplateBtn,
    );
    this.uploadGroupsBtn = page.locator(SELECTORS.paperGroupUploadBtn);
    this.bannerText = page.locator(SELECTORS.paperGroupBannerText).first();
    this.searchInput = page.locator(SELECTORS.paperGroupSearchInput);
    this.groupNameLinks = page.locator(SELECTORS.paperGroupNameLink);
    this.noResultsMessage = page.locator(SELECTORS.deskNoResultsMessage);
    this.loadingIndicator = page.locator(SELECTORS.deskLoadingIndicator);
    this.firstRow = page.locator(SELECTORS.deskListRow).first();
    this.listRow = page.locator(SELECTORS.deskListRow);
    this.recordCount = page.locator(SELECTORS.recordCount);
    this.partnerChip = page.locator(SELECTORS.paperGroupPartnerChip);
    this.firstRowCheckbox = page
      .locator(SELECTORS.paperGroupRowCheckbox)
      .first();
    this.actionsBtn = page.locator(SELECTORS.classificationActionsBtn);
    this.startAssessmentItem = page
      .locator(SELECTORS.paperGroupActionsMenuItem)
      .filter({ hasText: SELECTORS.paperGroupStartAssessmentText });
    this.assessmentConfirmModal = page
      .locator(SELECTORS.paperGroupUploadModal)
      .filter({ hasText: SELECTORS.paperGroupAssessmentModalTitle });
    this.invalidSelectionDialog = page
      .locator(SELECTORS.paperGroupUploadModal)
      .filter({ hasText: SELECTORS.paperGroupInvalidSelectionTitle });
  }

  async open() {
    await this.goto("/desk/dl-non-dreamsave-group");
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/dl-non-dreamsave-group/, {
      timeout: TIMEOUTS.navigation,
    });
    await expect(this.pageTitle).toContainText(
      SELECTORS.paperGroupsPageTitleText,
      { timeout: TIMEOUTS.default },
    );
    await expect(this.uploadGroupsBtn).toBeVisible({
      timeout: TIMEOUTS.default,
    });
  }

  async downloadTemplate() {
    await this.downloadTemplateBtn.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.downloadTemplateBtn.click(),
    ]);
    return download;
  }

  async clickUploadGroups() {
    await this.uploadGroupsBtn.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    // Disabled while another import is pending ("An import is already in progress")
    await expect(this.uploadGroupsBtn).toBeEnabled({
      timeout: TIMEOUTS.default,
    });
    await this.uploadGroupsBtn.click();
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
    // Settled once the list only shows matches for the keyword (or the empty state)
    await expect(async () => {
      if (await this.noResultsMessage.isVisible()) return;
      const names = await this.groupNameLinks.allInnerTexts();
      expect(names.length).toBeGreaterThan(0);
      names.forEach((name) => expect(name).toContain(keyword));
    }).toPass({ timeout: TIMEOUTS.default });
  }

  async clickFirstGroup() {
    await this.groupNameLinks.first().waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.groupNameLinks.first().click();
    await this.page.waitForLoadState("domcontentloaded");
  }

  async selectFirstGroup() {
    await this.firstRowCheckbox.waitFor({
      state: "attached",
      timeout: TIMEOUTS.default,
    });
    await this.firstRowCheckbox.check();
  }

  async startAssessment() {
    await this.actionsBtn.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.actionsBtn.click();
    await this.startAssessmentItem.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.startAssessmentItem.click();
  }

  // For a few seconds after an import the backend still flags the new group as a draft, and Start
  // Assessment answers with "Invalid Selection" instead of the confirmation. Reload, reselect and
  // retry until the confirmation opens.
  async startAssessmentWhenReady(groupName) {
    await expect(async () => {
      await this.selectFirstGroup();
      await this.startAssessment();
      await expect(
        this.assessmentConfirmModal.or(this.invalidSelectionDialog),
      ).toBeVisible({ timeout: TIMEOUTS.default });
      if (await this.invalidSelectionDialog.isVisible()) {
        await this.open();
        await this.searchByGroupName(groupName);
        throw new Error(`"${groupName}" is still flagged as a draft`);
      }
    }).toPass({
      timeout: TIMEOUTS.backgroundJob,
      intervals: [TIMEOUTS.shortWait],
    });
  }

  async getVisibleGroupCount() {
    return this.groupNameLinks.count();
  }

  // A non-empty value of this column from the first listed row that has one.
  async readFirstCellValue(cellSelector, label) {
    const cell = this.listRow
      .locator(cellSelector)
      .filter({ hasText: /\S/ })
      .first();
    await expect(
      cell,
      `Paper Groups list shows no ${label}: nothing to search for`,
    ).toBeVisible({ timeout: TIMEOUTS.default });
    return (await cell.innerText()).trim();
  }

  async readFirstRegion() {
    return this.readFirstCellValue(SELECTORS.paperGroupRegionCell, "region");
  }

  async readFirstVillage() {
    return this.readFirstCellValue(SELECTORS.paperGroupVillageCell, "village");
  }

  async readFirstDistrict() {
    return this.readFirstCellValue(
      SELECTORS.paperGroupDistrictCell,
      "district",
    );
  }

  async readFirstClassification() {
    return this.readFirstCellValue(
      SELECTORS.paperGroupClassificationCell,
      "classification",
    );
  }

  async readFirstImportedList() {
    return this.readFirstCellValue(
      SELECTORS.paperGroupImportedListCell,
      "imported list",
    );
  }

  // Region, village and district of the first row that has all three.
  async readFirstLocation() {
    const nonEmpty = (cellSelector) => ({
      has: this.page.locator(cellSelector).filter({ hasText: /\S/ }),
    });
    const row = this.listRow
      .filter(nonEmpty(SELECTORS.paperGroupRegionCell))
      .filter(nonEmpty(SELECTORS.paperGroupVillageCell))
      .filter(nonEmpty(SELECTORS.paperGroupDistrictCell))
      .first();
    await expect(
      row,
      "Paper Groups list shows no row with region, village and district",
    ).toBeVisible({ timeout: TIMEOUTS.default });
    const text = async (cellSelector) =>
      (await row.locator(cellSelector).innerText()).trim();
    return {
      region: await text(SELECTORS.paperGroupRegionCell),
      village: await text(SELECTORS.paperGroupVillageCell),
      district: await text(SELECTORS.paperGroupDistrictCell),
    };
  }

  // The first partner chip after "All partners": its label and "<n> imported" count.
  async readFirstPartnerChip() {
    const chip = this.partnerChip.nth(1);
    await expect(
      chip,
      "Paper Groups shows no partner chip: no partner has imported groups",
    ).toBeVisible({ timeout: TIMEOUTS.default });
    const label = await chip
      .locator(SELECTORS.paperGroupPartnerChipLabel)
      .innerText();
    const count = await chip
      .locator(SELECTORS.paperGroupPartnerChipCount)
      .innerText();
    return {
      partner: label.trim(),
      count: Number(count.replace(/\D/g, "")),
    };
  }

  // The list total from the pager ("1–20 of 18,160" -> "18,160").
  async readTotalCount() {
    await this.listRow.first().waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await expect(this.recordCount).toContainText(" of ", {
      timeout: TIMEOUTS.default,
    });
    return (await this.recordCount.innerText()).split(" of ").pop().trim();
  }

  async getFirstGroupName() {
    await this.groupNameLinks.first().waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    return (await this.groupNameLinks.first().innerText()).trim();
  }

  // Assertions
  async expectTemplateDownloaded(download, expectedFileName) {
    expect(download.suggestedFilename()).toBe(expectedFileName);
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    const bytes = fs.readFileSync(downloadPath);
    expect(bytes.length).toBeGreaterThan(0);
    // .xlsx is a zip container, which always starts with "PK"
    expect(bytes.subarray(0, 2).toString()).toBe("PK");
  }

  async expectTemplateHeaders(download, expectedHeaders) {
    const headers = await readHeaderRow(await download.path());
    expect(headers).toEqual(expectedHeaders);
  }

  async expectImportRejected(rejectionMessage) {
    await expect(this.bannerText).toContainText("rejected", {
      timeout: TIMEOUTS.default,
    });
    await expect(this.bannerText).toContainText(rejectionMessage, {
      timeout: TIMEOUTS.default,
    });
  }

  async expectImportFinished() {
    // Banner shows "Syncing x of N groups…" after the import is confirmed, then disappears
    await expect(this.bannerText).toBeHidden({ timeout: TIMEOUTS.navigation });
  }

  async expectFirstRowContains(text) {
    await expect(this.firstRow).toContainText(text, {
      timeout: TIMEOUTS.default,
    });
  }

  async expectResultCount(expectedCount) {
    await expect(this.groupNameLinks).toHaveCount(expectedCount, {
      timeout: TIMEOUTS.default,
    });
  }

  // Deleting is asynchronous: the group stays listed (locked, "queued for deletion")
  // until the background job finishes, so reload and search until it is gone.
  async expectGroupRemoved(groupName, expectedMessage) {
    await expect(async () => {
      await this.open();
      await this.expectLoaded();
      await this.searchByGroupName(groupName);
      await expect(this.noResultsMessage).toHaveText(expectedMessage, {
        timeout: 2000,
      });
    }).toPass({ timeout: TIMEOUTS.navigation });
  }

  async expectNoResults(expectedMessage) {
    await expect(this.noResultsMessage).toBeVisible({
      timeout: TIMEOUTS.default,
    });
    await expect(this.noResultsMessage).toHaveText(expectedMessage);
  }
}

module.exports = { PaperGroupsPage };
