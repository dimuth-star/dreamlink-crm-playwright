const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/user/LoginPage');
const { EligibilityCriteriaPage } = require('../../pages/eligibilityCriteria/EligibilityCriteriaPage');
const { CriteriaSetsPage } = require('../../pages/eligibilityCriteria/CriteriaSetsPage');
const { AddCriteriaSetPage } = require('../../pages/eligibilityCriteria/AddCriteriaSetPage');
const users = require('../../data/users.json');
const criteriaSetData = require('../../data/criteriaSet.json');

test.describe('DreamLink CRM - Eligibility Criteria Sets', () => {
  let loginPage;
  let eligibilityCriteriaPage;
  let criteriaSetsPage;
  let addCriteriaSetPage;
  const userData = users.valid;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    eligibilityCriteriaPage = new EligibilityCriteriaPage(page);
    criteriaSetsPage = new CriteriaSetsPage(page);
    addCriteriaSetPage = new AddCriteriaSetPage(page);
    await loginPage.open();
    await loginPage.login(userData.username, userData.password);
    await eligibilityCriteriaPage.open();
    await eligibilityCriteriaPage.expectLoaded();
  });

  test('TC-ECS-01 | New criteria set can be created with 7 selected criteria and shows success toast', async ({ page }) => {
    const uniqueName = `${criteriaSetData.newCriteriaSet.baseName}_${Date.now()}`;

    await eligibilityCriteriaPage.clickCriteriaSetsTab();
    await criteriaSetsPage.clickCreateCriteriaSet();
    await addCriteriaSetPage.fillCriteriaSetName(uniqueName);
    await addCriteriaSetPage.selectCriteria(7);
    await addCriteriaSetPage.saveCriteriaSet();
    await addCriteriaSetPage.expectSuccessToast();
  });

});