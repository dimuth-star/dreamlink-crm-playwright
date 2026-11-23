const { expect } = require("@playwright/test");
const { SELECTORS, TIMEOUTS } = require("../../common/constants");

class PreLeadsPage {
  constructor(page) {
    this.page = page;
    this.pageTitle = page.locator(SELECTORS.preLeadsPageTitle);
    this.preLeadNameLink = page.locator(SELECTORS.preLeadNameLink);
    this.preLeadListRow = page.locator(SELECTORS.deskListRow);
    this.loadingIndicator = page.locator(SELECTORS.deskLoadingIndicator);
  }

  async open() {
    await this.page.goto("/desk/dl-pre-lead");
    await this.page.waitForLoadState("domcontentloaded");
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/dl-pre-lead/, {
      timeout: TIMEOUTS.navigation,
    });
    await expect(this.pageTitle).toBeVisible({ timeout: TIMEOUTS.default });
  }

  async expectPreLeadListNotEmpty() {
    await this.loadingIndicator.waitFor({
      state: "hidden",
      timeout: TIMEOUTS.default,
    });
    await expect(this.preLeadNameLink.first()).toBeVisible({
      timeout: TIMEOUTS.default,
    });
    const rowCount = await this.preLeadNameLink.count();
    expect(rowCount).toBeGreaterThan(0);
  }

  // A pre lead number to search for, read from the loaded list (no fixed record needed).
  async readFirstPreLeadNumber() {
    const firstNumber = this.preLeadListRow
      .first()
      .locator(SELECTORS.preLeadNameLink);
    await expect(
      firstNumber,
      "Pre leads list is empty: nothing to search for",
    ).toBeVisible({ timeout: TIMEOUTS.default });
    return (await firstNumber.innerText()).trim();
  }

  async clickFirstPreLead() {
    await this.loadingIndicator.waitFor({
      state: "hidden",
      timeout: TIMEOUTS.default,
    });
    const firstRow = this.preLeadNameLink.first();
    await firstRow.waitFor({ state: "visible", timeout: TIMEOUTS.default });
    await firstRow.click();
    await this.page.waitForLoadState("domcontentloaded");
  }

  async expectPreLeadRowVisible() {
    await expect(this.preLeadNameLink.first()).toBeVisible({
      timeout: TIMEOUTS.default,
    });
  }
}

module.exports = { PreLeadsPage };
