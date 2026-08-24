const { expect } = require('@playwright/test');
const { SELECTORS, TIMEOUTS } = require('../../common/constants');

class UsersPage {
  constructor(page) {
    this.page = page;
    this.pageTitle = page.locator(SELECTORS.usersPageTitle);
    this.userListRow = page.locator(SELECTORS.userListRow);
    this.loadingIndicator = page.locator(SELECTORS.userListLoading);
    this.usersNavLink = page.locator(SELECTORS.usersNavLink);
  }

  async open() {
    await this.page.goto('/desk/dl-user');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async clickUsersNav() {
    await this.usersNavLink.waitFor({ state: 'visible', timeout: TIMEOUTS.default });
    await this.usersNavLink.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/dl-user/, { timeout: TIMEOUTS.navigation });
    await expect(this.pageTitle).toBeVisible({ timeout: TIMEOUTS.default });
  }

  async expectUserListPopulated() {
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout: TIMEOUTS.default });
    const count = await this.userListRow.count();
    expect(count).toBeGreaterThan(0);
  }

  async clickFirstUser() {
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout: TIMEOUTS.default });
    await this.userListRow.first().waitFor({ state: 'visible', timeout: TIMEOUTS.default });
    await this.userListRow.first().locator(SELECTORS.userNameLink).click();
    await this.page.waitForLoadState('domcontentloaded');
  }
}

module.exports = { UsersPage };