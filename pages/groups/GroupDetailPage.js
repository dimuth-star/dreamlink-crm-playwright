const { expect } = require("@playwright/test");
const { SELECTORS, TIMEOUTS } = require("../../common/constants");

class GroupDetailPage {
  constructor(page) {
    this.page = page;
    this.groupNameField = page.locator(SELECTORS.groupNameDetail);
    this.productsTab = page.locator(SELECTORS.groupProductsTab);
    this.productCard = page.locator(SELECTORS.groupProductCard);
  }

  async openProductsTab() {
    await this.productsTab.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.productsTab.click();
    await this.productCard.first().waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
  }

  // True when every product card has a workflow (none shows `noWorkflowMessage`).
  async allProductsHaveWorkflow(noWorkflowMessage) {
    return (await this.productCard.getByText(noWorkflowMessage).count()) === 0;
  }

  // From the product's card: the "Current Eligibility" criteria it fails, and whether a
  // workflow has started for it (the card shows `noWorkflowMessage` while none has).
  async readProductEligibility(productName, noWorkflowMessage) {
    const card = this.productCard.filter({
      has: this.page
        .locator(SELECTORS.groupProductCardName)
        .and(this.page.getByText(productName, { exact: true })),
    });
    await card.waitFor({ state: "visible", timeout: TIMEOUTS.default });
    const failed = await card
      .locator(SELECTORS.groupFailedCriterionName)
      .allTextContents();
    const noWorkflow = await card.getByText(noWorkflowMessage).count();
    return {
      failedCriteria: failed.map((name) => name.trim()),
      hasWorkflow: noWorkflow === 0,
    };
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/dl-dreamsave-group\//, {
      timeout: TIMEOUTS.navigation,
    });
    await this.groupNameField.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
  }

  async expectGroupDetailName(expectedName) {
    await expect(this.groupNameField).toHaveText(expectedName, {
      timeout: TIMEOUTS.default,
    });
  }
}

module.exports = { GroupDetailPage };
