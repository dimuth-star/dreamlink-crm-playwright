const { expect } = require('@playwright/test');
const { SELECTORS, TIMEOUTS } = require('../../common/constants');
const { BasePage } = require('../BasePage');

class ProductsPage extends BasePage {
  constructor(page) {
    super(page);
    this.pageTitle = page.locator(SELECTORS.productsPageTitle);
    this.productsNavLink = page.locator(SELECTORS.productsNavLink);
    this.productListRow = page.locator(SELECTORS.deskListRow);
    this.loadingIndicator = page.locator(SELECTORS.deskLoadingIndicator);
  }

  async open() {
    await this.goto('/desk/dl-product');
  }

  async clickProductsNav() {
    await this.productsNavLink.waitFor({ state: 'visible', timeout: TIMEOUTS.default });
    await this.productsNavLink.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/dl-product/, { timeout: TIMEOUTS.navigation });
    await this.expectVisible(this.pageTitle);
  }

  async expectProductListPopulated() {
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout: TIMEOUTS.default });
    const count = await this.productListRow.count();
    expect(count).toBeGreaterThan(0);
  }
}

module.exports = { ProductsPage };