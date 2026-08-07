const {test, expect} = require('@playwright/test');
const {HomePage} = require('../../pages/home/HomePage');
const {SearchBar} = require('../../pages/comman/SearchBar');
const { ProductPage } = require('../../pages/comman/ProductPage');
const { SearchResultsPage } = require('../../pages/comman/SearchResultsPage');
const productsList = require('../../data/products.json');
const priceFilters = require('../../data/priceFilters.json');



test.describe('Search Functionality', () => {
  let homePage;
  let searchBar;  
   let productPage;
   let searchResultsPage; 
  const products = productsList

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    searchBar = new SearchBar(page);
    productPage = new ProductPage(page);
    searchResultsPage = new SearchResultsPage(page); 
    await homePage.open();

  });

  test('TC-03: Verify search functionality with valid product name', async ({ page }) => {
    let phone = products.phones;
    await searchBar.search(phone.search_key);
    await expect(page.locator('body')).toContainText(`items found for "${phone.search_key}"`, { ignoreCase: true });
  });

  test('TC-04: Verify search auto-suggestion', async ({ page }) => {
    let suggest = products.suggest;
   await searchBar.typeInSearch(suggest.search_key);
   await expect(searchBar.searchSuggestList.first()).toBeVisible();
   
  });

    test('TC-18: Verify search URL contains query parameter', async ({ page }) => {
    let phone = products.phones;
    await searchBar.search(phone.search_key);
    await expect(page).toHaveURL(/[?&]q=/);
   
  });

  test('TC-22: Run consecutive searches with different keywords', async ({ page }) => {
  let phone = products.phones;
  let headphones = products.headphones;

  // First search
  await searchBar.search(phone.search_key);
  await expect(page.locator('body')).toContainText(
    `items found for "${phone.search_key}"`, { ignoreCase: true }
  );
  await expect(page).toHaveURL(/[?&]q=/);

  // Second search - different keyword
  await searchBar.search(headphones.search_key);
  await expect(page.locator('body')).toContainText(
    `items found for "${headphones.search_key}"`, { ignoreCase: true }
  );
  await expect(page).toHaveURL(/[?&]q=/);
});
  
test('TC-21: Verify suggestion list includes typed keyword', async ({ page }) => {
  let suggest = products.suggest; // "Samsung"

  await searchBar.typeInSearch(suggest.search_key);

  const suggestionsCount = await searchBar.searchSuggestList.count();
  expect(suggestionsCount).toBeGreaterThan(0);

  // Every visible suggestion should contain the typed keyword
  for (let i = 0; i < suggestionsCount; i++) {
    const text = await searchBar.searchSuggestList.nth(i).textContent();
    expect(text.toLowerCase()).toContain(suggest.search_key.toLowerCase());
  }
});

test('TC-19: Verify search results display product listing items', async ({ page }) => {
  let phone = products.phones;
  await searchBar.search(phone.search_key);

  await productPage.productList.first().waitFor({ state: 'visible', timeout: 10000 });

  const count = await productPage.productList.count();
  expect(count).toBeGreaterThan(0);
});

test('TC-05: Verify price range filter (Min/Max)', async ({ page }) => {
  let phone = products.phones;
  let range = priceFilters.validRange;

  await searchBar.search(phone.search_key);

  await searchResultsPage.filterByPrice(range.min, range.max);

  // Assert URL reflects the price filter
  await expect(page).toHaveURL(new RegExp(`price=${range.min}-${range.max}`));

  // Assert filter chip shows applied price range
  await expect(searchResultsPage.priceFilterChip.first())
    .toContainText(`${range.min}-${range.max}`);

  // Assert at least one product is displayed
  await productPage.productList.first().waitFor({ state: 'visible', timeout: 10000 });
  const count = await productPage.productList.count();
  expect(count).toBeGreaterThan(0);
});

test('TC-06: Verify brand filter on search results', async ({ page }) => {
  let phone = products.phones;

  await searchBar.search(phone.search_key);
  await searchResultsPage.filterByBrand(phone.brand);

  // Assert filter chip shows applied brand
  await expect(searchResultsPage.brandFilterChip.first())
    .toContainText(phone.brand);

  // Assert URL reflects the brand filter
  await expect(page).toHaveURL(/Samsung/i);

  // Assert results are displayed
  await productPage.productList.first().waitFor({ state: 'visible', timeout: 10000 });
  const count = await productPage.productList.count();
  expect(count).toBeGreaterThan(0);
});

test('TC-20: Verify invalid search shows zero results', async ({ page }) => {
  let invalidSearch = products.invalidSearch;

  await searchBar.search(invalidSearch.search_key);

  // Assert zero results message
  await expect(searchResultsPage.noResultsTitle)
    .toHaveText('Search No Result');
  await expect(searchResultsPage.noResultsMessage)
    .toContainText("We're sorry. We cannot find any matches");

  // Assert "0 items found" text on page
  await expect(page.locator('body')).toContainText(
    `0 items found for "${invalidSearch.search_key}"`, { ignoreCase: true }
  );
});
  

});
