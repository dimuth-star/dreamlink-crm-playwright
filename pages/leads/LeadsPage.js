const { expect } = require("@playwright/test");
const { SELECTORS, TIMEOUTS } = require("../../common/constants");

class LeadsPage {
  constructor(page) {
    this.page = page;
    this.pageTitle = page.locator(SELECTORS.leadsPageTitle);
    this.leadListRow = page.locator(SELECTORS.deskListRow);
    this.leadNameLink = page.locator(SELECTORS.leadNameLink);
    this.loadingIndicator = page.locator(SELECTORS.deskLoadingIndicator);
  }

  async open() {
    await this.page.goto("/desk/dl-lead");
    await this.page.waitForLoadState("domcontentloaded");
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/dl-lead/, {
      timeout: TIMEOUTS.navigation,
    });
    await expect(this.pageTitle).toBeVisible({ timeout: TIMEOUTS.default });
  }

  // The leads list narrowed by URL filters, e.g. { status: "Active" }.
  async openFiltered(filters) {
    const query = Object.entries(filters)
      .map(([field, value]) => `${field}=${encodeURIComponent(value)}`)
      .join("&");
    await this.page.goto(`/desk/dl-lead?${query}`);
    await this.page.waitForLoadState("domcontentloaded");
  }

  // The distinct saving groups of the listed leads.
  async readSavingGroups() {
    const savingGroups = this.leadListRow.locator(
      SELECTORS.leadSavingGroupCell,
    );
    await expect(
      savingGroups.first(),
      "No lead matches the filters: no saving group to read",
    ).toBeVisible({ timeout: TIMEOUTS.default });
    const names = await savingGroups.allInnerTexts();
    return [...new Set(names.map((name) => name.trim()))];
  }

  // A lead number to search for, read from the loaded list (no fixed record needed).
  async readFirstLeadNumber() {
    const firstNumber = this.leadListRow
      .first()
      .locator(SELECTORS.leadNameLink);
    await expect(
      firstNumber,
      "Leads list is empty: nothing to search for",
    ).toBeVisible({ timeout: TIMEOUTS.default });
    return (await firstNumber.innerText()).trim();
  }

  async clickFirstLead() {
    await this.loadingIndicator.waitFor({
      state: "hidden",
      timeout: TIMEOUTS.default,
    });
    const firstLeadLink = this.leadListRow
      .first()
      .locator(SELECTORS.leadNameLink);
    await firstLeadLink.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await firstLeadLink.click();
    await this.page.waitForLoadState("domcontentloaded");
  }

  async clickActiveLead() {
    const activeRow = this.page
      .locator(SELECTORS.deskListRow)
      .filter({ has: this.page.locator(SELECTORS.leadActiveStatusPill) })
      .first();
    await activeRow.waitFor({ state: "visible", timeout: TIMEOUTS.default });
    const leadLink = activeRow.locator(SELECTORS.leadNameLink);
    await leadLink.click();
    await this.page.waitForLoadState("domcontentloaded");
  }

  async expectLeadListNotEmpty() {
    await this.loadingIndicator.waitFor({
      state: "hidden",
      timeout: TIMEOUTS.default,
    });
    await expect(this.leadNameLink.first()).toBeVisible({
      timeout: TIMEOUTS.default,
    });
  }

  async expectLeadRowVisible() {
    await expect(this.leadNameLink.first()).toBeVisible({
      timeout: TIMEOUTS.default,
    });
  }
}

module.exports = { LeadsPage };
