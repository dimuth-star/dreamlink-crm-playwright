const { expect } = require("@playwright/test");
const { SELECTORS, TIMEOUTS } = require("../../common/constants");
const { BasePage } = require("../BasePage");

class AddProductPage extends BasePage {
  constructor(page) {
    super(page);
    this.addProductBtn = page.getByRole("button", { name: /add product/i });
    this.productNameInput = page.locator(SELECTORS.productNameInput);
    this.productCodeInput = page.locator(SELECTORS.productCodeInput);
    this.productTypeValue = page.locator(SELECTORS.productTypeValue);
    this.productDescriptionInput = page.locator(
      SELECTORS.productDescriptionInput,
    );
    this.creditRuleSetSelect = page.locator(
      SELECTORS.productCreditRuleSetSelect,
    );
    this.autoApprovalInput = page.locator(SELECTORS.productAutoApprovalInput);
    this.groupTypeRow = page.locator(SELECTORS.productGroupTypeRow);
    this.productSaveBtn = page.locator(SELECTORS.productSaveBtn);
    this.statusIndicator = page.locator(SELECTORS.productStatusIndicator);
    this.confirmDialog = page.locator(SELECTORS.productConfirmDialog);
    this.confirmDialogBtn = page.locator(SELECTORS.productConfirmDialogBtn);
  }

  async clickAddProduct() {
    await this.addProductBtn.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.addProductBtn.click();
    await this.page.waitForLoadState("domcontentloaded");
  }

  async fillProductName(name) {
    await this.productNameInput.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.productNameInput.fill(name);
  }

  async fillProductCode(code) {
    await this.productCodeInput.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.productCodeInput.fill(code);
  }

  async fillProductDescription(description) {
    await this.productDescriptionInput.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.productDescriptionInput.fill(description);
  }

  async selectCreditRuleSet(ruleSetName) {
    await this.creditRuleSetSelect.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.creditRuleSetSelect.selectOption({ label: ruleSetName });
  }

  async fillAutoApprovalThreshold(percent) {
    await this.autoApprovalInput.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.autoApprovalInput.fill(percent);
  }

  // { "<group type>": "<criteria set name>" }, one per row of the Group Types table.
  // Each row's link field only offers sets of that row's group type.
  async selectCriteriaSets(setsByGroupType) {
    for (const [groupType, setName] of Object.entries(setsByGroupType)) {
      const row = this.groupTypeRow.filter({
        has: this.page
          .locator(SELECTORS.productGroupTypeCell)
          .and(this.page.getByText(groupType, { exact: true })),
      });
      await row
        .locator(SELECTORS.productCriteriaSetCell)
        .click({ timeout: TIMEOUTS.default });
      await this.searchByAutocomplete(
        row.locator(SELECTORS.productCriteriaSetInput),
        setName,
      );
    }
  }

  async clickSaveProduct() {
    await this.productSaveBtn.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.productSaveBtn.click();
  }

  // Saving a non-zero Auto-Approval Threshold opens a confirmation dialog first.
  async confirmAutoApprovalThreshold(dialogTitle) {
    await expect(this.confirmDialog).toContainText(dialogTitle, {
      timeout: TIMEOUTS.default,
    });
    await this.confirmDialogBtn.click();
    await this.confirmDialog.waitFor({
      state: "hidden",
      timeout: TIMEOUTS.default,
    });
  }

  // --- assertions ---
  async expectProductType(productType) {
    await expect(this.productTypeValue).toHaveText(productType, {
      timeout: TIMEOUTS.default,
    });
  }

  // Saved: the URL leaves /new-dl-product-... and the unsaved pill clears.
  async expectSaved(unsavedIndicatorText) {
    await expect(this.page).not.toHaveURL(/new-dl-product/, {
      timeout: TIMEOUTS.navigation,
    });
    await expect(
      this.statusIndicator.filter({ hasText: unsavedIndicatorText }),
    ).toHaveCount(0, { timeout: TIMEOUTS.default });
  }
}

module.exports = { AddProductPage };
