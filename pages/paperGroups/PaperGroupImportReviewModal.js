const { expect } = require("@playwright/test");
const { SELECTORS, TIMEOUTS } = require("../../common/constants");
const { BasePage } = require("../BasePage");

class PaperGroupImportReviewModal extends BasePage {
  constructor(page) {
    super(page);
    this.modal = page
      .locator(SELECTORS.paperGroupUploadModal)
      .filter({ hasText: SELECTORS.paperGroupReviewModalTitle });
    this.bannerReviewBtn = page.locator(SELECTORS.paperGroupBannerReviewBtn);
    this.proceedBtn = page.locator(SELECTORS.paperGroupReviewProceedBtn);
    this.toasts = page.locator(SELECTORS.paperGroupToast);
  }

  async proceedWithImport() {
    await this.proceedBtn.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.proceedBtn.click();
  }

  // Assertions
  async expectOpen() {
    // Processing is done once the banner offers "Review import". On a busy QA tenant the import can
    // sit "queued — processing will start shortly" for over 30 s, so allow a background job's time.
    await expect(this.bannerReviewBtn).toBeVisible({
      timeout: TIMEOUTS.backgroundJob,
    });
    // The summary usually opens by itself, but not always: open it from the banner if it did not
    const openedItself = await this.modal
      .waitFor({ state: "visible", timeout: TIMEOUTS.shortWait })
      .then(() => true)
      .catch(() => false);
    if (!openedItself) await this.bannerReviewBtn.click();
    await expect(this.modal).toBeVisible({ timeout: TIMEOUTS.default });
  }

  async expectSummary(summaryMessage) {
    await expect(this.modal).toContainText(summaryMessage, {
      timeout: TIMEOUTS.default,
    });
  }

  async expectImportedToast(rowCount, messageSuffix) {
    // The summary toast sits next to a short "Batch processed successfully" toast
    await expect(
      this.toasts.filter({ hasText: `${rowCount} ${messageSuffix}` }).first(),
    ).toBeVisible({ timeout: TIMEOUTS.default });
  }
}

module.exports = { PaperGroupImportReviewModal };
