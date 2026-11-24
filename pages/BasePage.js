const { expect } = require("@playwright/test");
const { SELECTORS, TIMEOUTS } = require("../common/constants");
const { logInfo } = require("../util/loggers");

class BasePage {
  constructor(page) {
    this.page = page;
  }

  async goto(path = "/") {
    await this.page.goto(path);
    await this.page.waitForLoadState("domcontentloaded");
  }

  async waitForPageReady() {
    await this.page.waitForLoadState("load");
  }

  async closePopup() {
    try {
      const closeBtn = this.page
        .locator(".popup-close, .close-btn, .next-dialog-close")
        .first();
      await closeBtn.waitFor({ state: "visible", timeout: 5000 });
      await closeBtn.click();
      logInfo("Popup dismissed");
    } catch (error) {
      logInfo("No popup to dismiss");
    }
  }

  // Selects the <option> of a native <select> by its label. Fails within TIMEOUTS.default, listing the
  // labels on offer, instead of retrying until the test timeout (selectOption's own behaviour when the
  // label is missing). `ignoreCase` is for labels whose capitalisation differs between environments.
  async selectOptionByLabel(selectLocator, label, { ignoreCase = false } = {}) {
    const wanted = ignoreCase ? label.toLowerCase() : label;
    let match;
    await expect
      .poll(
        async () => {
          const labels = (
            await selectLocator.locator("option").allInnerTexts()
          ).map((text) => text.trim());
          match = labels.find(
            (text) => (ignoreCase ? text.toLowerCase() : text) === wanted,
          );
          return match
            ? "offered"
            : `"${label}" not offered; options: ${labels.join(" | ")}`;
        },
        { timeout: TIMEOUTS.default },
      )
      .toBe("offered");
    await selectLocator.selectOption({ label: match });
  }

  async expectVisible(locator, options = {}) {
    await expect(locator).toBeVisible({
      timeout: TIMEOUTS.default,
      ...options,
    });
  }

  async searchByAutocomplete(inputLocator, groupName) {
    const searchTerm = groupName.split(" ").pop();

    await inputLocator.waitFor({ state: "visible", timeout: TIMEOUTS.default });
    await inputLocator.clear();
    await inputLocator.fill(searchTerm);

    const listbox = this.page.locator(SELECTORS.autocompleteListbox);
    await listbox.waitFor({ state: "visible", timeout: TIMEOUTS.default });

    const dropdownOption = listbox
      .locator(SELECTORS.autocompleteDropdownOption)
      .filter({ hasText: groupName })
      .first();
    await dropdownOption.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await dropdownOption.click();

    await expect(inputLocator).toHaveValue(groupName, {
      timeout: TIMEOUTS.default,
    });
  }
}

module.exports = { BasePage, SELECTORS, TIMEOUTS };
