const { expect } = require('@playwright/test');
const { SELECTORS, TIMEOUTS } = require('../../common/constants');
const { BasePage } = require('../BasePage');

class AddProductPage extends BasePage {
  constructor(page) {
    super(page);
    this.page = page;
    this.addProductBtn = page.getByRole('button', { name: SELECTORS.addProductBtnName });
    this.productPageTitle = page.locator(SELECTORS.addProductPageTitle);
    this.productNameInput = page.getByRole('textbox', { name: SELECTORS.productNameInput});
    this.productDescriptionInput = page.getByRole('textbox', { name: SELECTORS.productDescriptionInput});
    this.productEligibilityCriteriaSet = page.getByRole('combobox', { name: SELECTORS.productDSCriteriaSetSelect});
    this.productSaveBtn = page.getByRole('button', { name: SELECTORS.productSaveBtn});
  }

  async open() {
    await this.goto('/desk/dl-product');
  }

  async clickAddProduct() {
    await this.addProductBtn.waitFor({ state: 'visible', timeout: TIMEOUTS.default });
    await this.addProductBtn.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async fillProductName(name) {
    await this.productNameInput.waitFor({ state: 'visible', timeout: TIMEOUTS.default });
    await this.productNameInput.fill(name);
  }

  async fillProductDescription(description) {
    await this.productDescriptionInput.waitFor({ state: 'visible', timeout: TIMEOUTS.default });
    await this.productDescriptionInput.fill(description);
  }

  async selectEligibilityCriteriaSet() {
    await this.productDSCriteriaSetSelect.waitFor({ state: 'visible', timeout: TIMEOUTS.default }).click();
    await this.productDSSelectedCriteria.click();
  }
   
  async clickSaveProduct() {
    await this.productSaveBtn.waitFor({ state: 'visible', timeout: TIMEOUTS.default });
    await this.productSaveBtn.click();
  } 

  async searchProductByName(name) {
    const productSearchField = this.page.locator(SELECTORS.productSearchField);
    await productSearchField.fill(name);
    const count = await this.productListRow.count();
    expect(count).toBeGreaterThan(0);

  }
}  

module.exports = { AddProductPage };
