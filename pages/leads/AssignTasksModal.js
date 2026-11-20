const { expect } = require("@playwright/test");
const { SELECTORS, TIMEOUTS } = require("../../common/constants");
const { BasePage } = require("../BasePage");

class AssignTasksModal extends BasePage {
  constructor(page) {
    super(page);
    this.modal = page
      .locator(SELECTORS.paperGroupUploadModal)
      .filter({ hasText: SELECTORS.assignTasksModalTitle });
    this.userInput = page.locator(SELECTORS.assignTasksUserInput);
    this.assignBtn = this.modal.locator("button.btn-modal-primary");
    this.options = page.locator(
      `${SELECTORS.autocompleteListbox} ${SELECTORS.autocompleteDropdownOption}`,
    );
    this.confirmModal = page
      .locator(SELECTORS.paperGroupUploadModal)
      .filter({ hasText: SELECTORS.assignTasksConfirmText });
    this.confirmBtn = this.confirmModal.locator("button.btn-modal-primary");
    this.toasts = page.locator(SELECTORS.paperGroupToast);
  }

  // Selected with the keyboard, then wait for the Link field to validate the user. Clicking Assign
  // before that answers "No task in this stage can be moved to <user>" even for an eligible user.
  async selectUser(searchTerm) {
    await this.userInput.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.userInput.click();
    await this.userInput.pressSequentially(searchTerm);
    await expect(this.options).toHaveCount(1, { timeout: TIMEOUTS.default });
    const validated = this.page.waitForResponse(
      (response) => response.url().includes("validate_link_and_fetch"),
      { timeout: TIMEOUTS.default },
    );
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");
    await validated;
  }

  async clickAssign() {
    await this.assignBtn.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.assignBtn.click();
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

  async expectConfirmationFor(userName) {
    await expect(this.confirmModal).toBeVisible({ timeout: TIMEOUTS.default });
    await expect(this.confirmModal).toContainText(`to ${userName}?`, {
      timeout: TIMEOUTS.default,
    });
  }

  async expectAssignedToast(successMessage) {
    await expect(
      this.toasts.filter({ hasText: successMessage }).first(),
    ).toBeVisible({ timeout: TIMEOUTS.default });
  }
}

module.exports = { AssignTasksModal };
