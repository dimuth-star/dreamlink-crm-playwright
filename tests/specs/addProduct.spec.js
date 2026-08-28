const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/user/LoginPage');
const { ProductsPage } = require('../../pages/products/ProductsPage');
const { AddProductPage } = require('../../pages/products/AddProductPage');
const { getCredentials } = require('../../util/helpers');
const addProductData = require('../../data/addProduct.json');

test.describe('DreamLink CRM - Add Product', () => {
    let loginPage;
    let productsPage;
    let addProductPage;
    const userData = getCredentials();

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        productsPage = new ProductsPage(page);
        addProductPage = new AddProductPage(page);
        await loginPage.open();
        await loginPage.login(userData.username, userData.password);
        await productsPage.open();
        await productsPage.expectLoaded();
    });

    test('TC-PR-02 | Open the Add Product page and verify the page title', async ({ page }) => {
        await productsPage.open();
        await addProductPage.clickAddProduct();
        await addProductPage.productPageTitle.waitFor({ state: 'visible', timeout: 5000 });
        const pageTitle = await addProductPage.productPageTitle.textContent();
        expect(pageTitle.trim()).toBe('Product Details');
    });

    test('TC-PR-03 | Filling valid data and create a new Product', async ({ page }) => {
        const productData = addProductData.newProduct;
        await productsPage.open();
        await addProductPage.clickAddProduct();
        await addProductPage.fillProductName(productData.productName);
        await addProductPage.fillProductDescription(productData.productDescription);
        await addProductPage.selectEligibilityCriteriaSet();
        await addProductPage.clickSaveProduct();
    });

    test('TC-PR-04 | Verify that the new Product appears in the product list', async ({ page }) => {
        const productData = addProductData.newProduct;
        await productsPage.open();
        await addProductPage.searchProductByName(productData.productName);
    });

})
