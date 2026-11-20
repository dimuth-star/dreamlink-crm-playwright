const { expect } = require("@playwright/test");
const { SELECTORS, TIMEOUTS } = require("../../common/constants");
const { BasePage } = require("../BasePage");

class PaperGroupAssessmentModal extends BasePage {
  constructor(page) {
    super(page);
    this.modal = page
      .locator(SELECTORS.paperGroupUploadModal)
      .filter({ hasText: SELECTORS.paperGroupAssessmentModalTitle });
    this.productSelect = page.locator(SELECTORS.paperGroupAssessmentProductSelect);
    this.confirmBtn = this.modal.locator("button.btn-modal-primary");
    this.resultModal = page
      .locator(SELECTORS.paperGroupUploadModal)
      .filter({ hasText: SELECTORS.paperGroupAssessmentResultTitle });
  }

  async selectProduct(productName) {
    await this.productSelect.waitFor({
      state: "attached",
      timeout: TIMEOUTS.default,
    });
    await this.productSelect.selectOption({ label: productName });
  }

  async confirm() {
    await this.confirmBtn.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.confirmBtn.click();
  }

  // Assertions
  async expectOpen() {
    await expect(this.modal).toBeVisible({ timeout: TIMEOUTS.default });
  }

  // The result is shown in a "Start Assessment Initiated" dialog, not a toast
  async expectAssessmentInitiated(resultMessage) {
    await expect(this.resultModal).toBeVisible({ timeout: TIMEOUTS.default });
    await expect(this.resultModal).toContainText(resultMessage, {
      timeout: TIMEOUTS.default,
    });
  }
}

module.exports = { PaperGroupAssessmentModal };
