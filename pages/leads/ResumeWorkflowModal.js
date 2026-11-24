const { expect } = require("@playwright/test");
const { SELECTORS, TIMEOUTS } = require("../../common/constants");
const { BasePage } = require("../BasePage");

// Confirmation dialog opened by "Resume Workflow" on a Paused lead.
class ResumeWorkflowModal extends BasePage {
  constructor(page) {
    super(page);
    this.modal = page.locator(SELECTORS.resumeWorkflowModal);
    this.confirmBtn = page.locator(SELECTORS.resumeWorkflowConfirmBtn);
  }

  async confirm() {
    await this.confirmBtn.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.confirmBtn.click();
    await this.modal.waitFor({ state: "hidden", timeout: TIMEOUTS.default });
  }

  // --- assertions ---
  // The body names the lead ("…on lead LEAD-00222. Do you want to continue?"), so the right one is confirmed.
  async expectOpenFor(title, leadNumber) {
    await expect(this.modal).toContainText(title, {
      timeout: TIMEOUTS.default,
    });
    await expect(this.modal).toContainText(leadNumber, {
      timeout: TIMEOUTS.default,
    });
  }
}

module.exports = { ResumeWorkflowModal };
