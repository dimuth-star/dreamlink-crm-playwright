const { expect } = require('@playwright/test');
const { BasePage } = require('../BasePage');
const { SELECTORS } = require('../../common/constants');

class HomePage extends BasePage {
  constructor(page) {
    super(page);
    this.searchInput = page.locator(SELECTORS.searchInput);
    this.loginTrigger = page.locator(SELECTORS.loginTrigger);
    this.cartBadge = page.locator(SELECTORS.cartBadge);
    this.siteLogo = page.getByRole('link', { name: SELECTORS.siteLogo });
    this.language = page.locator(SELECTORS.languageSwitch);
    this.cartBadgeCount = page.locator(SELECTORS.cartBadgeCount);
    this.catalog = page.locator('a.shopMoreBtn');
    this.categories = page.getByText(SELECTORS.categories);
  }

  async open() {
    await this.goto('/');
    await this.waitForPageReady();
  }

  async expectHomeLoaded() {
    await expect(this.page).toHaveURL(/daraz\.lk/);
    await expect(this.page).toHaveTitle(/Daraz/i);
  }

  async expectHeaderVisible() {
    await expect(this.searchInput).toBeVisible();
    await expect(this.loginTrigger).toBeVisible();
    await expect(this.cartBadge).toBeAttached();
    await expect(this.language).toBeVisible();
  }

  async navigateHomeViaLogo() {
    await this.siteLogo.click();
    await this.waitForPageReady();
  }

  async navigatetoCatalog() {
     await this.catalog.scrollIntoViewIfNeeded();
    await this.catalog.click();
    await this.waitForPageReady();
  }
}

module.exports = { HomePage };
