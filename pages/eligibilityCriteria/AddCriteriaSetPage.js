const { expect } = require("@playwright/test");
const { SELECTORS, TIMEOUTS } = require("../../common/constants");

class AddCriteriaSetPage {
  constructor(page) {
    this.page = page;
    this.nameInput = page.locator(SELECTORS.criteriaSetNameInput);
    this.descriptionInput = page.locator(SELECTORS.criteriaSetDescriptionInput);
    this.availableCriteria = page.locator(SELECTORS.criteriaSetAvailableList);
    this.availableItems = this.availableCriteria.locator(
      SELECTORS.criteriaSetAvailableItem,
    );
    this.saveBtn = page.locator(SELECTORS.saveCriteriaSetBtn);
    this.successToast = page.locator(SELECTORS.criteriaSetSuccessToast);
  }

  // The available criteria list is filtered by group type: after switching, wait until it has changed.
  async selectGroupType(groupType) {
    const radio = this.page.getByRole("radio", {
      name: groupType,
      exact: true,
    });
    await this.availableItems
      .first()
      .waitFor({ state: "visible", timeout: TIMEOUTS.default });
    if (await radio.isChecked()) return;
    const listBefore = await this.availableCriteria.innerText();
    await radio.click();
    await expect(radio).toBeChecked({ timeout: TIMEOUTS.default });
    await expect(this.availableCriteria).not.toHaveText(listBefore, {
      timeout: TIMEOUTS.default,
    });
  }

  async fillCriteriaSetName(name) {
    await this.nameInput.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.nameInput.fill(name);
  }

  async fillDescription(description) {
    await this.descriptionInput.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.descriptionInput.fill(description);
  }

  // Ticks the first `targetCount` selectable criteria and returns their names.
  async selectCriteria(targetCount) {
    await this.availableItems
      .first()
      .waitFor({ state: "visible", timeout: TIMEOUTS.default });
    const total = await this.availableItems.count();
    expect(
      total,
      `only ${total} criteria available, the set needs ${targetCount}`,
    ).toBeGreaterThanOrEqual(targetCount);

    const selectedNames = [];
    for (let i = 0; i < total && selectedNames.length < targetCount; i++) {
      const item = this.availableItems.nth(i);
      const checkbox = item.locator(SELECTORS.criteriaSetCheckbox);
      if (await checkbox.isDisabled()) continue;
      await checkbox.check();
      selectedNames.push(
        (await item.locator(SELECTORS.criteriaSetItemName).innerText()).trim(),
      );
    }

    expect(selectedNames, "selectable criteria").toHaveLength(targetCount);
    return selectedNames;
  }

  async saveCriteriaSet() {
    await this.saveBtn.waitFor({ state: "visible", timeout: TIMEOUTS.default });
    await this.saveBtn.scrollIntoViewIfNeeded();
    await this.saveBtn.click();
  }

  async expectSuccessToast() {
    await expect(this.successToast).toBeVisible({ timeout: TIMEOUTS.default });
  }
}

module.exports = { AddCriteriaSetPage };
