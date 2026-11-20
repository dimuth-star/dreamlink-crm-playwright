const { expect } = require("@playwright/test");
const path = require("path");
const { SELECTORS, TIMEOUTS } = require("../../common/constants");
const { BasePage } = require("../BasePage");

class PaperGroupUploadModal extends BasePage {
  constructor(page) {
    super(page);
    this.modal = page.locator(SELECTORS.paperGroupUploadModal);
    this.partnerSelect = page.locator(SELECTORS.paperGroupPartnerSelect);
    this.fileInput = page.locator(SELECTORS.paperGroupFileInput);
    this.submitBtn = page.locator(SELECTORS.paperGroupUploadSubmitBtn);
  }

  async selectPartner(partnerName) {
    await this.partnerSelect.waitFor({
      state: "attached",
      timeout: TIMEOUTS.default,
    });
    await this.partnerSelect.selectOption({ label: partnerName });
  }

  // filePath is relative to the repository root, e.g. "data/uploads/x.xlsx"
  async chooseFile(filePath) {
    await this.fileInput.setInputFiles(path.resolve(__dirname, "../..", filePath));
  }

  async clickUploadAndValidate() {
    await this.submitBtn.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.submitBtn.click();
  }

  async uploadFile(partnerName, filePath) {
    await this.expectOpen();
    await this.selectPartner(partnerName);
    await this.chooseFile(filePath);
    await this.clickUploadAndValidate();
  }

  // Assertions
  async expectOpen() {
    await expect(this.modal).toBeVisible({ timeout: TIMEOUTS.default });
    await expect(this.submitBtn).toBeVisible({ timeout: TIMEOUTS.default });
  }
}

module.exports = { PaperGroupUploadModal };
