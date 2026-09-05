const { expect } = require('@playwright/test');
const { SELECTORS, TIMEOUTS } = require('../../common/constants');

class LeadsPage {
  constructor(page) {
    this.page = page;
    this.pageTitle = page.locator(SELECTORS.leadsPageTitle);
    this.leadListRow = page.locator(SELECTORS.deskListRow);
    this.leadNameLink = page.locator(SELECTORS.leadNameLink);
  }

  async open() {
    await this.page.goto('/desk/dl-lead');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/dl-lead/, { timeout: TIMEOUTS.navigation });
    await expect(this.pageTitle).toBeVisible({ timeout: TIMEOUTS.default });
  }

  async clickActiveLead() {
    const activeRow = this.page
      .locator(SELECTORS.deskListRow)
      .filter({ has: this.page.locator(SELECTORS.leadActiveStatusPill) })
      .first();
    await activeRow.waitFor({ state: 'visible', timeout: TIMEOUTS.default });
    const leadLink = activeRow.locator(SELECTORS.leadNameLink);
    await leadLink.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async expectLeadListNotEmpty() {
    await this.page.locator(SELECTORS.deskLoadingIndicator)
      .waitFor({ state: 'hidden', timeout: TIMEOUTS.default });
    await expect(this.leadNameLink.first()).toBeVisible({ timeout: TIMEOUTS.default });
  }

  async expectLeadRowVisible() {
    await expect(this.leadNameLink.first()).toBeVisible({ timeout: TIMEOUTS.default });
  }
}

module.exports = { LeadsPage };