const { test, expect } = require('@playwright/test');
const { HomePage } = require('../../pages/home/HomePage');
const { ProductPage } = require('../../pages/comman/ProductPage');
const { SearchBar } = require('../../pages/comman/SearchBar');
const productsList = require('../../data/products.json');
const users = require('../../data/users.json');

test.describe('prodcut Functionality', () => {
  let homePage;
  let productPage;  
  let searchBar;
  const products = productsList; 


  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    productPage = new ProductPage(page);
    searchBar = new SearchBar(page);
    await homePage.open();

  });

  test('TC-23 | Product page shows Add to Cart button', async ({ page }) => {
    let phone = products.phones;
    await searchBar.search(phone.search_key);
    await expect(page.locator('body')).toContainText(`items found for "${phone.search_key}"`, { ignoreCase: true });
    await productPage.clickProduct();
    await expect(productPage.addToCard).toBeVisible();
  });

  test('Navigating to product updates URL to `/products/`', async ({ page }) => {
    let phone = products.phones;
    await searchBar.search(phone.search_key);
    await expect(page.locator('body')).toContainText(`items found for "${phone.search_key}"`, { ignoreCase: true });
    await productPage.clickProduct();
    await expect(productPage.addToCard).toBeVisible();
    await expect(page).toHaveURL(/\/products\//);

   });

   test('TC-25 | Product page shows Buy Now button', async ({ page }) => {
    let phone = products.phones;
    await searchBar.search(phone.search_key);
    await expect(page.locator('body')).toContainText(`items found for "${phone.search_key}"`, { ignoreCase: true });
    await productPage.clickProduct();
    await expect(productPage.buyNow).toBeVisible();
   
  });
  
  

});
