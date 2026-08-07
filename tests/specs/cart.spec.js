const { test, expect } = require('@playwright/test');
const { HomePage } = require('../../pages/home/HomePage');
const { LoginPage } = require('../../pages/user/LoginPage');
const { SettingsPage } = require('../../pages/user/SettingsPage');
const { ProductPage } = require('../../pages/comman/ProductPage');
const { SearchBar } = require('../../pages/comman/SearchBar');
const { Cart } = require('../../pages/comman/Cart');
const users = require('../../data/users.json');
const productsList = require('../../data/products.json');

test.describe.configure({ mode: 'serial' });

test.describe('cart functionality', () => {
  let homePage;
  let loginPage;
  let cart;
  let searchBar;
  let productPage;
  const userData = users.valid;
  const products = productsList;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    loginPage = new LoginPage(page);
    productPage = new ProductPage(page);
    searchBar = new SearchBar(page);
    cart = new Cart(page);
    await homePage.open();
    await loginPage.login(userData.email, userData.password);
  });

  test.afterEach(async ({ page }) => {
  await cart.clearCart();
  await expect(cart.cartBadgeCount).toBeEmpty({ timeout: 15000 }); // ← assertion lives here
});

  test('TC-07 | Add to cart and badge update', async ({ page }) => {
    let phone = products.phones;
    await searchBar.search(phone.search_key);
    await expect(page.locator('body')).toContainText(
      `items found for "${phone.search_key}"`, { ignoreCase: true }
    );
    await productPage.clickProduct();
    const beforeCount = await cart.getBeforeCount();
    await cart.clickAddToCart();
    await expect(cart.cartBadgeCount).not.toHaveText('', { timeout: 10000 });
    await expect(cart.cartBadgeCount).toHaveText(String(beforeCount + 1));
  });

  test('TC-08 | Cart persistence after reload', async ({ page }) => {
    let phone = products.phones;

    await searchBar.search(phone.search_key);
    await productPage.clickProduct();

    const beforeCount = await cart.getBeforeCount();
    await cart.clickAddToCart();

    const expectedCount = String(beforeCount + 1);
    await expect(cart.cartBadgeCount).not.toHaveText('', { timeout: 10000 });
    await expect(cart.cartBadgeCount).toHaveText(expectedCount);

    await page.reload({ waitUntil: 'domcontentloaded' });

    // Badge briefly resets after reload — wait for it to re-populate before asserting
    await expect(cart.cartBadgeCount).not.toHaveText('', { timeout: 10000 });
    await expect(cart.cartBadgeCount).toHaveText(expectedCount);
  });

  test('TC-09 | Remove item and badge update', async ({ page }) => {
    let phone = products.phones;

    await searchBar.search(phone.search_key);
    await productPage.clickProduct();
    await cart.clickAddToCart();
    await cart.navigateToCart();
    await cart.removeItem(phone.search_key);

    await expect(page.getByText('There are no items in this cart'))
      .toBeVisible({ timeout: 10000 });
    await expect(cart.cartBadgeCount).toBeEmpty();
  });

  test('TC-26 | Cart badge increases after adding another product', async ({ page }) => {
    const baseCount = await cart.getBeforeCount();
    console.log(`[INFO] Base count: ${baseCount}`);

    await searchBar.search(products.phones.search_key);
    await productPage.clickProduct();
    await cart.clickAddToCart();

    const afterFirstAdd = String(baseCount + 1);
    await expect(cart.cartBadgeCount).not.toHaveText('', { timeout: 10000 });
    await expect(cart.cartBadgeCount).toHaveText(afterFirstAdd);
    console.log(`[INFO] After first add: ${afterFirstAdd}`);

    await searchBar.search(products.headphones.search_key);
    await productPage.clickProduct();
    await cart.clickAddToCart();

    const afterSecondAdd = String(baseCount + 2);
    await expect(cart.cartBadgeCount).not.toHaveText('', { timeout: 10000 });
    await expect(cart.cartBadgeCount).toHaveText(afterSecondAdd);
    console.log(`[INFO] After second add: ${afterSecondAdd}`);
  });

});