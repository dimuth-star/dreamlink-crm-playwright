const { expect } = require("@playwright/test");
const { SELECTORS, TIMEOUTS } = require("../../common/constants");

class AddCriterionPage {
  constructor(page) {
    this.page = page;
    this.createCriterionBtn = page.locator(SELECTORS.createCriterionBtn);
    this.nameInput = page.getByRole("textbox", {
      name: SELECTORS.criterionNameInput,
    });
    this.descriptionInput = page.getByRole("textbox", {
      name: SELECTORS.criterionDescriptionInput,
    });
    this.saveBtn = page.getByRole("button", {
      name: SELECTORS.saveCriterionBtn,
    });
    this.successToast = page.locator(SELECTORS.criterionSuccessToast);
    this.attributeSelect = page.getByRole("combobox", {
      name: SELECTORS.criterionAttributeSelect,
    });
    this.conditionSelect = page.getByRole("combobox", {
      name: SELECTORS.criterionConditionSelect,
    });
    this.valueNumberInput = page.getByRole("spinbutton", {
      name: SELECTORS.criterionValueControl,
    });
    this.valueSelect = page.getByRole("combobox", {
      name: SELECTORS.criterionValueControl,
    });
  }

  async clickCreateCriterion() {
    await this.createCriterionBtn.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.createCriterionBtn.click();
    await this.page.waitForLoadState("domcontentloaded");
  }

  async fillCriterionName(name) {
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

  async selectGroupType(groupType) {
    const radio = this.page.getByRole("radio", {
      name: groupType,
      exact: true,
    });
    await radio.click();
    await expect(radio).toBeChecked({ timeout: TIMEOUTS.default });
  }

  // Attribute, condition and value. The attribute list depends on the group type, so pick that first.
  async defineLogic({ attribute, condition, value }) {
    await this.chooseOption(this.attributeSelect, attribute);
    await this.chooseOption(this.conditionSelect, condition);
    // numeric attributes take a number, True/False attributes a dropdown
    await this.valueNumberInput.or(this.valueSelect).waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    if (await this.valueNumberInput.isVisible()) {
      await this.valueNumberInput.fill(value);
      await expect(this.valueNumberInput).toHaveValue(value, {
        timeout: TIMEOUTS.default,
      });
    } else {
      await this.chooseOption(this.valueSelect, value);
    }
  }

  async chooseOption(select, optionName) {
    await select.waitFor({ state: "visible", timeout: TIMEOUTS.default });
    await select.click();
    await this.page
      .getByRole("option", { name: optionName, exact: true })
      .click();
    await expect(select).toHaveText(optionName, { timeout: TIMEOUTS.default });
  }

  async saveCriterion() {
    await this.saveBtn.waitFor({ state: "visible", timeout: TIMEOUTS.default });
    await this.saveBtn.click();
  }

  async expectSuccessToast(criterionName) {
    await expect(this.successToast).toBeVisible({ timeout: TIMEOUTS.default });
    await expect(this.successToast).toContainText(criterionName);
  }
}

module.exports = { AddCriterionPage };
