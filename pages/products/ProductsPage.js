const { expect } = require("@playwright/test");
const { SELECTORS, TIMEOUTS } = require("../../common/constants");
const { BasePage } = require("../BasePage");

class ProductsPage extends BasePage {
  constructor(page) {
    super(page);
    this.pageTitle = page.locator(SELECTORS.productsPageTitle);
    this.productsNavLink = page.locator(SELECTORS.productsNavLink);
    this.productListRow = page
      .locator('[id="page-List/DL Product/List"]')
      .locator(SELECTORS.deskListRow);
    this.loadingIndicator = page.locator(SELECTORS.deskLoadingIndicator);
    this.searchInput = page.locator(SELECTORS.productSearchInput);
    this.noResultsMessage = page
      .locator(SELECTORS.deskNoResultsMessage)
      .first();
  }

  async open() {
    await this.goto("/desk/dl-product");
  }

  async clickProductsNav() {
    await this.productsNavLink.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.productsNavLink.click();
    await this.page.waitForLoadState("domcontentloaded");
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/dl-product/, {
      timeout: TIMEOUTS.navigation,
    });
    await this.expectVisible(this.pageTitle);
  }

  async expectProductListPopulated() {
    await this.loadingIndicator.waitFor({
      state: "hidden",
      timeout: TIMEOUTS.default,
    });
    const count = await this.productListRow.count();
    expect(count).toBeGreaterThan(0);
  }

  async clickFirstProduct() {
    const firstProductLink = this.productListRow
      .first()
      .locator(SELECTORS.productNameLink);
    await firstProductLink.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    const productName = await firstProductLink.innerText();
    await firstProductLink.click();
    await this.page.waitForLoadState("domcontentloaded");
    return productName.trim();
  }

  // Opens the product with exactly this name. Clicking "the first row" is not enough: the list can
  // re-render unfiltered after the search (seen on VF Dev, where saving a product returns to the list).
  async openProduct(productName) {
    const productLink = this.productListRow
      .locator(SELECTORS.productNameLink)
      .and(this.page.getByText(productName, { exact: true }));
    await productLink.waitFor({ state: "visible", timeout: TIMEOUTS.default });
    await productLink.click();
    await this.page.waitForLoadState("domcontentloaded");
  }

  // A product name to search for, read from the loaded list (no fixed record needed).
  async readFirstProductName() {
    const firstName = this.productListRow
      .first()
      .locator(SELECTORS.productNameLink);
    await expect(
      firstName,
      "Products list is empty: nothing to search for",
    ).toBeVisible({ timeout: TIMEOUTS.default });
    return (await firstName.innerText()).trim();
  }

  async searchByProductName(keyword) {
    await this.searchInput.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.searchInput.fill(keyword);
    await this.loadingIndicator.waitFor({
      state: "hidden",
      timeout: TIMEOUTS.default,
    });
  }

  // --- search assertions ---
  async expectExactRowCount(expectedCount) {
    await expect(this.productListRow).toHaveCount(expectedCount, {
      timeout: TIMEOUTS.default,
    });
  }

  async expectProductListed(name) {
    await expect(
      this.productListRow.getByRole("link", { name, exact: true }),
    ).toBeVisible({ timeout: TIMEOUTS.default });
  }

  async expectAllResultsContain(keyword) {
    await expect(
      this.productListRow.filter({ hasNotText: keyword }),
    ).toHaveCount(0, { timeout: TIMEOUTS.default });
  }

  async expectNoResults(expectedMessage) {
    await expect(this.noResultsMessage).toHaveText(expectedMessage, {
      timeout: TIMEOUTS.default,
    });
  }
}

module.exports = { ProductsPage };
