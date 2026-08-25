const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/user/LoginPage');
const { ProductsPage } = require('../../pages/products/ProductsPage');
const users = require('../../data/users.json');

test.describe('DreamLink CRM - Products', () => {
  let loginPage;
  let productsPage;
  const userData = users.valid;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    productsPage = new ProductsPage(page);
    await loginPage.open();
    await loginPage.login(userData.username, userData.password);
    await productsPage.open();
    await productsPage.expectLoaded();
  });

  test('TC-PR-01 | Manage Products page loads via sidebar navigation and list is populated', async ({ page }) => {
    await productsPage.clickProductsNav();
    await productsPage.expectLoaded();
    await productsPage.expectProductListPopulated();
  });

});