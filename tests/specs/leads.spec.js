const { test } = require('@playwright/test');
const { LoginPage } = require('../../pages/user/LoginPage');
const { LeadsPage } = require('../../pages/leads/LeadsPage');
const { LeadsSearchBar } = require('../../pages/leads/LeadsSearchBar');
const { getCredentials } = require('../../util/helpers');
const leadsData = require('../../data/leads.json');

test.describe('DreamLink CRM - Leads', () => {
  let loginPage;
  let leadsPage;
  let leadsSearchBar;
  const userData = getCredentials();

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    leadsPage = new LeadsPage(page);
    leadsSearchBar = new LeadsSearchBar(page);
    await loginPage.open();
    await loginPage.login(userData.username, userData.password);
    await leadsPage.open();
    await leadsPage.expectLoaded();
  });

  test('TC-LD-01 | Leads list is not empty on page load', async ({ page }) => {
    await leadsPage.expectLeadListNotEmpty();
  });

  test('TC-LD-02 | Valid lead number search returns exact matching lead', async ({ page }) => {
    const { keyword, expectedCount } = leadsData.validSearch;
    await leadsSearchBar.searchByLeadNumber(keyword);
    await leadsSearchBar.expectResultCount(expectedCount);
    await leadsSearchBar.expectLeadVisible(keyword);
  });

  test('TC-LD-03 | Invalid lead number search displays no results message', async ({ page }) => {
    const { keyword } = leadsData.invalidSearch;
    await leadsSearchBar.searchByLeadNumber(keyword);
    await leadsSearchBar.expectNoResults();
  });
});