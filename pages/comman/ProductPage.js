const {SELECTORS} = require('../../common/constants')

class ProductPage {

    constructor(page){
        this.page = page;
        this.productList = page.locator(SELECTORS.productList);;
        this.addToCard = this.addToCard = page.getByRole('button', { name: SELECTORS.addToCart });
        this.buyNow = page.getByRole('button', { name: SELECTORS.buyNow });
    }

async clickProduct() {
  await this.productList.first().waitFor({ state: 'visible', timeout: 10000 });
  await this.productList.first().click();
  await this.page.waitForLoadState('domcontentloaded'); 
}

async clickFirstProduct() {
  await this.productList.first().waitFor({ state: 'visible', timeout: 10000 });
  await this.productList.first().click();
  await this.page.waitForLoadState('domcontentloaded'); 
}





}

module.exports = {ProductPage}