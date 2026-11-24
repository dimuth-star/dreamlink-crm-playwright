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

  // Types `searchTerm` (default: the last word of the name) and picks the option showing the full name.
  // Pass the full name as searchTerm where the last word is too common to bring the record up.
  async searchByAutocomplete(
    inputLocator,
    groupName,
    { searchTerm = groupName.split(" ").pop() } = {},
  ) {
    await inputLocator.waitFor({ state: "visible", timeout: TIMEOUTS.default });
    const listbox = this.page.locator(SELECTORS.autocompleteListbox);
    // A list page can re-render its filter bar while it is still loading, which drops what was typed
    // (seen on VF Dev): type again until the dropdown opens.
    await expect(async () => {
      await inputLocator.clear();
      await inputLocator.fill(searchTerm);
      await listbox.waitFor({ state: "visible", timeout: TIMEOUTS.shortWait });
    }).toPass({ timeout: TIMEOUTS.default });

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
