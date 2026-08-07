const { SELECTORS } = require('../../common/constants');

class SearchResultsPage {
  constructor(page) {
    this.page = page;
    this.minPriceInput = page.locator(SELECTORS.minPriceInput);
    this.maxPriceInput = page.locator(SELECTORS.maxPriceInput);
    this.priceApplyBtn = page.locator(SELECTORS.priceApplyBtn);
    this.priceFilterChip = page.locator(SELECTORS.priceFilterChip);
    this.brandFilterChip = page.locator(SELECTORS.brandFilterChip);
    this.noResultsTitle = page.locator(SELECTORS.noResultsTitle);
    this.noResultsMessage = page.locator(SELECTORS.noResultsMessage);
  }

  async filterByPrice(min, max) {
    await this.minPriceInput.fill(String(min));
    await this.maxPriceInput.fill(String(max));
    await this.priceApplyBtn.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async filterByBrand(brandName) {
    const brandCheckbox = this.page.locator(
      `input[businessvalue="${brandName.toLowerCase()}"][businesstype="brand"]`
    );
    await brandCheckbox.click();
    await this.page.waitForLoadState('domcontentloaded');
  }
}

module.exports = { SearchResultsPage };