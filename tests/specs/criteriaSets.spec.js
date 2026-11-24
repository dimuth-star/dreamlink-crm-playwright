const { test } = require("@playwright/test");
const { LoginPage } = require("../../pages/user/LoginPage");
const {
  EligibilityCriteriaPage,
} = require("../../pages/eligibilityCriteria/EligibilityCriteriaPage");
const {
  CriteriaSetsPage,
} = require("../../pages/eligibilityCriteria/CriteriaSetsPage");
const {
  AddCriteriaSetPage,
} = require("../../pages/eligibilityCriteria/AddCriteriaSetPage");
const { getCredentials } = require("../../util/helpers");
const { noMatchKeyword } = require("../../util/searchKeywords");
const criteriaSetData = require("../../data/criteriaSet.json");

test.describe("DreamLink CRM - Eligibility Criteria Sets", () => {
  let loginPage;
  let eligibilityCriteriaPage;
  let criteriaSetsPage;
  let addCriteriaSetPage;
  const userData = getCredentials();

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    eligibilityCriteriaPage = new EligibilityCriteriaPage(page);
    criteriaSetsPage = new CriteriaSetsPage(page);
    addCriteriaSetPage = new AddCriteriaSetPage(page);
    await loginPage.open();
    await loginPage.login(userData.username, userData.password);
    await eligibilityCriteriaPage.open();
    await eligibilityCriteriaPage.expectLoaded();
    await eligibilityCriteriaPage.clickCriteriaSetsTab();
  });

  // Creates data, so it is never retried (a retry could create it twice). Test-level options cannot
  // set retries; test.describe.configure can.
  test.describe("Creates data (never retried)", () => {
    test.describe.configure({ retries: 0 });
    test("TC-ECS-01 | New DreamSave criteria set can be created with 7 criteria and is listed with them", async ({
      page,
    }) => {
      const set = criteriaSetData.dreamSaveSet;
      const uniqueName = `${set.baseName}_${Date.now()}`;

      await criteriaSetsPage.clickCreateCriteriaSet();
      await addCriteriaSetPage.selectGroupType(set.groupType);
      await addCriteriaSetPage.fillCriteriaSetName(uniqueName);
      await addCriteriaSetPage.fillDescription(set.description);
      const criteriaNames = await addCriteriaSetPage.selectCriteria(
        set.criteriaCount,
      );
      await addCriteriaSetPage.saveCriteriaSet();
      await addCriteriaSetPage.expectSuccessToast();

      // the new set is searchable and shows what was saved
      await criteriaSetsPage.expectCriteriaSetListPopulated();
      await criteriaSetsPage.searchBySetName(uniqueName);
      await criteriaSetsPage.expectExactRowCount(1);
      await criteriaSetsPage.expectSetRow(
        uniqueName,
        set.groupType,
        criteriaNames,
      );
    });
  });

  test("TC-ECS-02 | Criteria Sets list is populated after navigating via tab", async ({
    page,
  }) => {
    await criteriaSetsPage.expectCriteriaSetListPopulated();
  });

  test("TC-ECS-03 | Searching a set name read from the list returns that set and only matching rows", async ({
    page,
  }) => {
    const keyword = await criteriaSetsPage.readFirstSetName();
    await criteriaSetsPage.searchBySetName(keyword);
    await criteriaSetsPage.expectSetListed(keyword);
    await criteriaSetsPage.expectAllResultsContain(keyword);
  });

  test("TC-ECS-04 | Invalid search displays no matching criteria sets message", async ({
    page,
  }) => {
    const keyword = noMatchKeyword(criteriaSetData.invalidSearch.keywordPrefix);
    await criteriaSetsPage.searchBySetName(keyword);
    await criteriaSetsPage.expectNoResults(criteriaSetData.noResultsMessage);
  });

  // Creates data, so it is never retried (a retry could create it twice). Test-level options cannot
  // set retries; test.describe.configure can.
  test.describe("Creates data (never retried)", () => {
    test.describe.configure({ retries: 0 });
    test("TC-ECS-05 | New Non-DreamSave criteria set can be created with 5 Non-DreamSave criteria and is listed with them", async ({
      page,
    }) => {
      const set = criteriaSetData.nonDreamSaveSet;
      const uniqueName = `${set.baseName}_${Date.now()}`;

      await criteriaSetsPage.clickCreateCriteriaSet();
      await addCriteriaSetPage.selectGroupType(set.groupType);
      await addCriteriaSetPage.fillCriteriaSetName(uniqueName);
      await addCriteriaSetPage.fillDescription(set.description);
      const criteriaNames = await addCriteriaSetPage.selectCriteria(
        set.criteriaCount,
      );
      await addCriteriaSetPage.saveCriteriaSet();
      await addCriteriaSetPage.expectSuccessToast();

      // the new set is searchable and shows what was saved
      await criteriaSetsPage.expectCriteriaSetListPopulated();
      await criteriaSetsPage.searchBySetName(uniqueName);
      await criteriaSetsPage.expectExactRowCount(1);
      await criteriaSetsPage.expectSetRow(
        uniqueName,
        set.groupType,
        criteriaNames,
      );
    });
  });
});
