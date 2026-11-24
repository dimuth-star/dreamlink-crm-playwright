const { test } = require("@playwright/test");
const { LoginPage } = require("../../pages/user/LoginPage");
const { ProductsPage } = require("../../pages/products/ProductsPage");
const { AddProductPage } = require("../../pages/products/AddProductPage");
const { ProductDetailPage } = require("../../pages/products/ProductDetailPage");
const { getCredentials } = require("../../util/helpers");
const { noMatchKeyword } = require("../../util/searchKeywords");
const addProductData = require("../../data/addProduct.json");

test.describe("DreamLink CRM - Products", () => {
  let loginPage;
  let productsPage;
  let addProductPage;
  let productDetailPage;
  const userData = getCredentials();

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    productsPage = new ProductsPage(page);
    addProductPage = new AddProductPage(page);
    productDetailPage = new ProductDetailPage(page);
    await loginPage.open();
    await loginPage.login(userData.username, userData.password);
    await productsPage.open();
    await productsPage.expectLoaded();
  });

  test("TC-PR-01 | Manage Products page loads via sidebar navigation and list is populated", async ({
    page,
  }) => {
    await productsPage.clickProductsNav();
    await productsPage.expectLoaded();
    await productsPage.expectProductListPopulated();
  });

  // Creates data, so it is never retried (a retry could create it twice). Test-level options cannot
  // set retries; test.describe.configure can.
  test.describe("Creates data (never retried)", () => {
    test.describe.configure({ retries: 0 });
    test("TC-PR-02 | New product can be created with every field and both group-type criteria sets, and is searchable", async ({
      page,
    }) => {
      const product = addProductData.newProduct;
      const uniqueName = `${product.baseName}_${Date.now()}`;
      const productCode = `${product.codePrefix}${Date.now()}`;

      // fill every field of the new-product form
      await addProductPage.clickAddProduct();
      await addProductPage.fillProductName(uniqueName);
      await addProductPage.fillProductCode(productCode);
      await addProductPage.expectProductType(product.productType);
      await addProductPage.fillProductDescription(product.description);
      await addProductPage.selectCreditRuleSet(product.creditRuleSet);
      await addProductPage.fillAutoApprovalThreshold(
        product.autoApprovalThreshold,
      );
      const criteriaSets = await addProductPage.selectFirstOfferedCriteriaSets(
        product.groupTypes,
      );
      await addProductPage.clickSaveProduct();
      await addProductPage.confirmAutoApprovalThreshold(
        addProductData.thresholdConfirmTitle,
      );
      await addProductPage.expectSaved(addProductData.unsavedIndicator);

      // the product is searchable by its name
      await productsPage.open();
      await productsPage.searchByProductName(uniqueName);
      await productsPage.expectExactRowCount(1);
      await productsPage.expectProductListed(uniqueName);

      // and kept what was entered
      await productsPage.openProduct(uniqueName);
      await productDetailPage.expectLoaded();
      await productDetailPage.expectProductName(uniqueName);
      await productDetailPage.expectProductCode(productCode);
      await productDetailPage.expectAutoApprovalThreshold(
        product.autoApprovalThreshold,
      );
      await productDetailPage.expectCriteriaSets(criteriaSets);
    });
  });

  test("TC-PR-03 | View the details of an existing Product and verify the displayed Product name verification", async ({
    page,
  }) => {
    const selectedProductName = await productsPage.clickFirstProduct();
    await productDetailPage.expectLoaded();
    await productDetailPage.expectProductName(selectedProductName);
  });

  test("TC-PR-04 | Searching a product name read from the list returns that product and only matching rows", async ({
    page,
  }) => {
    const keyword = await productsPage.readFirstProductName();
    await productsPage.searchByProductName(keyword);
    await productsPage.expectProductListed(keyword);
    await productsPage.expectAllResultsContain(keyword);
  });

  test("TC-PR-05 | Invalid product name search displays the no results message", async ({
    page,
  }) => {
    const keyword = noMatchKeyword(addProductData.invalidSearch.keywordPrefix);
    await productsPage.searchByProductName(keyword);
    await productsPage.expectNoResults(addProductData.noResultsMessage);
  });
});
