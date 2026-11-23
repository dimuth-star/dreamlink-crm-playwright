const { test, expect } = require("@playwright/test");
const { LoginPage } = require("../../pages/user/LoginPage");
const {
  EligibilityCriteriaPage,
} = require("../../pages/eligibilityCriteria/EligibilityCriteriaPage");
const {
  CriterionDetailPage,
} = require("../../pages/eligibilityCriteria/CriterionDetailPage");
const {
  CriteriaSearchBar,
} = require("../../pages/eligibilityCriteria/CriteriaSearchBar");
const {
  AddCriterionPage,
} = require("../../pages/eligibilityCriteria/AddCriterionPage");
const { getCredentials } = require("../../util/helpers");
const { noMatchKeyword } = require("../../util/searchKeywords");
const criteriaData = require("../../data/criteria.json");
const addCriterionData = require("../../data/addCriterion.json");

test.describe("DreamLink CRM - Eligibility Criteria", () => {
  let loginPage;
  let eligibilityCriteriaPage;
  let criterionDetailPage;
  let criteriaSearchBar;
  let addCriterionPage;
  const userData = getCredentials();

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    eligibilityCriteriaPage = new EligibilityCriteriaPage(page);
    criterionDetailPage = new CriterionDetailPage(page);
    criteriaSearchBar = new CriteriaSearchBar(page);
    addCriterionPage = new AddCriterionPage(page);
    await loginPage.open();
    await loginPage.login(userData.username, userData.password);
    await eligibilityCriteriaPage.open();
    await eligibilityCriteriaPage.expectLoaded();
  });

  test("TC-EC-01 | Eligibility Criteria page loads via sidebar navigation and list is populated", async ({
    page,
  }) => {
    await eligibilityCriteriaPage.clickEligibilityCriteriaNav();
    await eligibilityCriteriaPage.expectLoaded();
    await eligibilityCriteriaPage.expectCriteriaListPopulated();
  });

  test("TC-EC-02 | Clicking the first criterion navigates to its detail page with non-empty Attribute and Group Type", async ({
    page,
  }) => {
    await eligibilityCriteriaPage.clickFirstCriterion();
    await criterionDetailPage.expectLoaded();
    await criterionDetailPage.expectAttributeNotEmpty();
    await criterionDetailPage.expectGroupTypeNotEmpty();
  });

  test("TC-EC-03 | Searching a criterion name read from the list returns that criterion and only matching rows", async ({
    page,
  }) => {
    const keyword = await eligibilityCriteriaPage.readFirstCriterionName();
    await criteriaSearchBar.searchByCriterionName(keyword);
    await criteriaSearchBar.expectCriterionListed(keyword);
    await criteriaSearchBar.expectAllResultsContain(keyword);
  });

  test("TC-EC-04 | Invalid search displays no matching criteria message", async ({
    page,
  }) => {
    const keyword = noMatchKeyword(criteriaData.invalidSearch.keywordPrefix);
    await criteriaSearchBar.searchByCriterionName(keyword);
    await criteriaSearchBar.expectNoResults(criteriaData.noResultsMessage);
  });

  test(
    "TC-EC-05 | New DreamSave criterion can be created and is listed with its group type and logic",
    { retries: 0 },
    async ({ page }) => {
      const criterion = addCriterionData.dreamSaveCriterion;
      const uniqueName = `${criterion.baseName}_${Date.now()}`;

      await addCriterionPage.clickCreateCriterion();
      await addCriterionPage.fillCriterionName(uniqueName);
      await addCriterionPage.fillDescription(criterion.description);
      await addCriterionPage.selectGroupType(criterion.groupType);
      await addCriterionPage.defineLogic(criterion);
      await addCriterionPage.saveCriterion();
      await addCriterionPage.expectSuccessToast(uniqueName);

      // the new criterion is searchable and shows what was saved
      await eligibilityCriteriaPage.expectLoaded();
      await criteriaSearchBar.searchByCriterionName(uniqueName);
      await criteriaSearchBar.expectExactRowCount(1);
      await criteriaSearchBar.expectCriterionRow(
        uniqueName,
        criterion.groupType,
        criterion.logicText,
      );
    },
  );

  test(
    "TC-EC-06 | New Non-DreamSave criterion can be created and is listed with its group type and logic",
    { retries: 0 },
    async ({ page }) => {
      const criterion = addCriterionData.nonDreamSaveCriterion;
      const uniqueName = `${criterion.baseName}_${Date.now()}`;

      await addCriterionPage.clickCreateCriterion();
      await addCriterionPage.fillCriterionName(uniqueName);
      await addCriterionPage.fillDescription(criterion.description);
      await addCriterionPage.selectGroupType(criterion.groupType);
      await addCriterionPage.defineLogic(criterion);
      await addCriterionPage.saveCriterion();
      await addCriterionPage.expectSuccessToast(uniqueName);

      // the new criterion is searchable and shows what was saved
      await eligibilityCriteriaPage.expectLoaded();
      await criteriaSearchBar.searchByCriterionName(uniqueName);
      await criteriaSearchBar.expectExactRowCount(1);
      await criteriaSearchBar.expectCriterionRow(
        uniqueName,
        criterion.groupType,
        criterion.logicText,
      );
    },
  );
});
