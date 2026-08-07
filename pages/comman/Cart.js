const {SELECTORS} = require('../../common/constants');
const { BasePage } = require('../BasePage');



class Cart extends BasePage {
constructor(page) {
    super(page);
    this.catalog = page.locator(SELECTORS.catalog);
    this.addToCard = page.getByRole('button', { name: SELECTORS.addToCart });
    this.cartBadgeCount = page.locator(SELECTORS.cartBadgeCount);
    this.productList = page.locator(SELECTORS.productList);
    this.cartIcon = page.locator(SELECTORS.cartIcon);
    this.cartItem = page.locator(SELECTORS.cartItem).first();
    this.deleteBtn = page.locator(SELECTORS.deleteBtn); 
    this.confirmBtn = page.locator(SELECTORS.confirmRemoveBtn)  
    .filter({ hasText: 'REMOVE' });
       this.selectAllCheckbox = page.locator(SELECTORS.selectAllCheckbox);
    this.headerDeleteBtn = page.locator(SELECTORS.headerDeleteBtn);
    this.confirmClearBtn = page.locator(SELECTORS.confirmClearBtn);

    

                  
}

async clickFirstProduct() {
  await this.productList.first().waitFor({ state: 'visible', timeout: 10000 });
  await this.productList.first().click();
  await this.page.waitForLoadState('load');
}

async clickAddToCart(){

    await this.addToCard.click();
    await this.closePopup();

}

async getCartCount() {
  return await this.cartBadgeCount.textContent();
}

async getBeforeCount() {
  const text = await this.cartBadgeCount.textContent();
  return parseInt(text) || 0;  // if empty/null returns 0
}

async navigateToCart() {
  // Get the cart URL directly from the href attribute
  const cartUrl = await this.cartIcon.getAttribute('href');
  await this.page.goto(cartUrl);
  await this.page.waitForLoadState('load');
}

/*async removeItem() {
  await this.cartItem.first().waitFor({ state: 'visible', timeout: 10000 });
    console.log('[INFO] Cart item visible');

  // Scope delete button to first cart item specifically
  await this.cartItem.first()
    .locator(SELECTORS.deleteBtn)
    .click();
      console.log('[INFO] Delete clicked');

  await this.confirmBtn
    .waitFor({ state: 'visible', timeout: 5000 });
  await this.confirmBtn.click();
    console.log('[INFO] REMOVE confirmed');

  await this.page.waitForLoadState('load');
}*/

async removeItem(searchKey) {
  const matchingItems = this.page.locator(SELECTORS.cartItem)
    .filter({ hasText: searchKey });

  const count = await matchingItems.count();
  console.log(`[INFO] Found ${count} matching item(s) for "${searchKey}"`);

  for (let i = 0; i < count; i++) {
    // Always target index 0 since list shrinks after each removal
    const item = matchingItems.first();
    await item.waitFor({ state: 'visible', timeout: 10000 });
    await item.locator(SELECTORS.deleteBtn).click();
    console.log(`[INFO] Delete clicked (${i + 1}/${count})`);

    await this.confirmBtn.waitFor({ state: 'visible', timeout: 5000 });
    await this.confirmBtn.click();
    console.log('[INFO] REMOVE confirmed');

    await this.page.waitForLoadState('domcontentloaded');
  }
}

async clearCart() {
  await this.navigateToCart();

  const hasItems = await this.cartItem.isVisible().catch(() => false);

  if (!hasItems) {
    console.log('[INFO] Cart already empty');
    return;
  }

  await this.selectAllCheckbox.click();
  console.log('[INFO] All items selected');

  await this.headerDeleteBtn.click();
  console.log('[INFO] Header delete clicked');

  await this.confirmClearBtn.waitFor({ state: 'visible', timeout: 5000 });
  await this.confirmClearBtn.click();

  await this.page.waitForLoadState('domcontentloaded');
  console.log('[INFO] Cart cleared');
}






}

module.exports = {Cart}