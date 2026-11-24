const { expect } = require("@playwright/test");
const { SELECTORS, TIMEOUTS } = require("../../common/constants");
const { BasePage } = require("../BasePage");

class FormsPage extends BasePage {
  constructor(page) {
    super(page);
    this.pageTitle = page.locator(SELECTORS.formsPageTitle);
    this.formsListRow = page.locator(SELECTORS.formsListRow);
    this.formsResultCount = page.locator(SELECTORS.formsResultCount);
    this.formsSearchInput = page.locator(SELECTORS.formsSearchInput);
    this.formsNoResultsMessage = page.locator(SELECTORS.formsNoResultsMessage);
    this.formsItemName = page.locator(SELECTORS.formsItemName);
    this.createFormBtn = page.locator(SELECTORS.formsCreateBtn);
  }

  async open() {
    await this.goto("/forms");
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/\/forms/, {
      timeout: TIMEOUTS.navigation,
    });
    await expect(this.pageTitle).toBeVisible({ timeout: TIMEOUTS.default });
    await expect(this.createFormBtn).toBeVisible({ timeout: TIMEOUTS.default });
  }

  async clickFirstForm() {
    const firstRow = this.formsListRow.first();
    await firstRow.waitFor({ state: "visible", timeout: TIMEOUTS.default });
    await firstRow.click();
    await this.page.waitForLoadState("domcontentloaded");
  }

  async clickCreateForm() {
    await this.createFormBtn.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.createFormBtn.click();
    await this.page.waitForLoadState("domcontentloaded");
  }

  // A form name to search for, read from the loaded list (no fixed record needed).
  async readFirstFormName() {
    const firstName = this.formsListRow
      .first()
      .locator(SELECTORS.formsItemName);
    await expect(
      firstName,
      "Forms list is empty: nothing to search for",
    ).toBeVisible({
      timeout: TIMEOUTS.default,
    });
    return (await firstName.innerText()).trim();
  }

  async searchByKeyword(keyword) {
    await this.formsSearchInput.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.formsSearchInput.fill(keyword);
    await this.formsResultCount.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
  }

  // Assertions
  async expectFormsListNotEmpty() {
    await expect(this.formsListRow.first()).toBeVisible({
      timeout: TIMEOUTS.default,
    });
    await expect(this.formsResultCount).toBeVisible({
      timeout: TIMEOUTS.default,
    });
  }

  async expectResultCount(expectedCount) {
    await expect(this.formsResultCount).toContainText(expectedCount, {
      timeout: TIMEOUTS.default,
    });
  }

  async expectResultContainsKeyword(keyword) {
    await expect(this.formsItemName.first()).toContainText(keyword, {
      ignoreCase: true,
      timeout: TIMEOUTS.default,
    });
  }

  async expectFormListed(name) {
    await expect(
      this.formsItemName.and(this.page.getByText(name, { exact: true })),
    ).toBeVisible({ timeout: TIMEOUTS.default });
  }

  // a result can match on its description, so check the whole row (name + description)
  async expectAllResultsContain(keyword) {
    await expect(this.formsListRow.filter({ hasNotText: keyword })).toHaveCount(
      0,
      {
        timeout: TIMEOUTS.default,
      },
    );
  }

  async expectNoResultsMessage(expectedMessage) {
    await expect(this.formsNoResultsMessage).toBeVisible({
      timeout: TIMEOUTS.default,
    });
    await expect(this.formsNoResultsMessage).toContainText(expectedMessage);
  }

  async expectExactResultCount(count) {
    await expect(this.formsListRow).toHaveCount(count, {
      timeout: TIMEOUTS.default,
    });
  }
}

module.exports = { FormsPage };
