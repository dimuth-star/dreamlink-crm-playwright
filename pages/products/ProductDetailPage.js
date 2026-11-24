const { expect } = require("@playwright/test");
const { SELECTORS, TIMEOUTS } = require("../../common/constants");

class ProductDetailPage {
  constructor(page) {
    this.page = page;
    this.productNameField = page.locator(SELECTORS.productNameInput);
    this.productCodeField = page.locator(SELECTORS.productCodeInput);
    this.autoApprovalField = page.locator(SELECTORS.productAutoApprovalInput);
    this.groupTypeRow = page.locator(SELECTORS.productGroupTypeRow);
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/dl-product\//, {
      timeout: TIMEOUTS.navigation,
    });
    await this.productNameField.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
  }

  async expectProductName(expectedName) {
    await expect(this.productNameField).toHaveValue(expectedName, {
      timeout: TIMEOUTS.default,
    });
  }

  async expectProductCode(expectedCode) {
    await expect(this.productCodeField).toHaveValue(expectedCode, {
      timeout: TIMEOUTS.default,
    });
  }

  async expectAutoApprovalThreshold(expectedPercent) {
    await expect(this.autoApprovalField).toHaveValue(expectedPercent, {
      timeout: TIMEOUTS.default,
    });
  }

  // { "<group type>": "<criteria set name>" }: each Group Types row shows its saved set.
  async expectCriteriaSets(setsByGroupType) {
    for (const [groupType, setName] of Object.entries(setsByGroupType)) {
      const row = this.groupTypeRow.filter({
        has: this.page
          .locator(SELECTORS.productGroupTypeCell)
          .and(this.page.getByText(groupType, { exact: true })),
      });
      await expect(
        row.locator(SELECTORS.productCriteriaSetValue),
        `criteria set for ${groupType}`,
      ).toHaveText(setName, { timeout: TIMEOUTS.default });
    }
  }
}

module.exports = { ProductDetailPage };
