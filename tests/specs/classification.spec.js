const { test } = require("@playwright/test");
const { LoginPage } = require("../../pages/user/LoginPage");
const { GroupsPage } = require("../../pages/groups/GroupsPage");
const { GroupsSearchBar } = require("../../pages/groups/GroupsSearchBar");
const { ClassificationPage } = require("../../pages/groups/ClassificationPage");
const { LeadsPage } = require("../../pages/leads/LeadsPage");
const { LeadsSearchBar } = require("../../pages/leads/LeadsSearchBar");
const { LeadDetailPage } = require("../../pages/leads/LeadDetailPage");
const { PreLeadsPage } = require("../../pages/preLeads/PreLeadsPage");
const { PreLeadsSearchBar } = require("../../pages/preLeads/PreLeadsSearchBar");
const { PreLeadDetailPage } = require("../../pages/preLeads/PreLeadDetailPage");
const { getCredentials, classificationAllowed } = require("../../util/helpers");
const groupsData = require("../../data/groups.json");
const preLeadsData = require("../../data/preLeads.json");

test.describe("DreamLink CRM - Run Classification", () => {
  let loginPage;
  let groupsPage;
  let groupsSearchBar;
  let classificationPage;
  let leadsPage;
  let leadsSearchBar;
  let leadDetailPage;
  let preLeadsPage;
  let preLeadsSearchBar;
  let preLeadDetailPage;
  const userData = getCredentials();

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    groupsPage = new GroupsPage(page);
    groupsSearchBar = new GroupsSearchBar(page);
    classificationPage = new ClassificationPage(page);
    leadsPage = new LeadsPage(page);
    leadsSearchBar = new LeadsSearchBar(page);
    leadDetailPage = new LeadDetailPage(page);
    preLeadsPage = new PreLeadsPage(page);
    preLeadsSearchBar = new PreLeadsSearchBar(page);
    preLeadDetailPage = new PreLeadDetailPage(page);
    await loginPage.open();
    await loginPage.login(userData.username, userData.password);
    await groupsPage.open();
    await groupsPage.expectLoaded();
  });

  test('TC-CL-01 | Running classification on a group with an active workflow shows "No Groups Classified" summary', async ({
    page,
  }) => {
    // a group with an active DreamSave lead whose products all have a workflow already
    await leadsPage.openFiltered(groupsData.activeWorkflowSearch.leadFilters);
    const savingGroups = await leadsPage.readSavingGroups();
    const groupName = await groupsPage.findGroupWithAllProductsInWorkflow(
      savingGroups,
      groupsData.classificationCandidate.noWorkflowMessage,
    );
    test.skip(
      !groupName,
      "No group with an active DreamSave lead has a workflow for every product",
    );

    await groupsPage.open();
    await groupsSearchBar.searchByGroupName(groupName);
    await classificationPage.selectGroupCheckbox(groupName);
    await classificationPage.openActionsDropdown();
    await classificationPage.clickRunClassificationMenuItem();
    await classificationPage.confirmRunClassification();
    await classificationPage.expectSummaryPillText();
    await classificationPage.closeSummaryModal();
    await classificationPage.expectModalDismissed();
  });

  // The group is chosen at run time (a 7/7 product still "Not Classified"); skipped when QA has none.
  // Classifying it creates a lead, so each run uses up one group.
  test(
    "TC-CL-02 | Running classification on a fully eligible group creates a lead with 6 assigned tasks",
    { retries: 0 },
    async ({ page }) => {
      test.skip(
        !classificationAllowed(),
        "Classification is turned off for this environment (CLASSIFY_GROUPS=false): it changes real groups",
      );
      const candidate = await groupsPage.findClassificationCandidate(
        groupsData.fullyEligibleSearch,
        groupsData.classificationCandidate,
      );
      test.skip(
        !candidate,
        "No DreamSave group on QA has a 7/7 product that is still Not Classified, with no workflow, lead or pre lead",
      );
      const { groupName } = candidate;

      await groupsPage.open();
      await groupsSearchBar.searchByGroupName(groupName);
      await classificationPage.selectGroupCheckbox(groupName);
      await classificationPage.openActionsDropdown();
      await classificationPage.clickRunClassificationMenuItem();
      await classificationPage.confirmRunClassification();
      await classificationPage.expectFullyEligibleSummaryPill();
      await classificationPage.closeSummaryModal();
      await classificationPage.expectModalDismissed();
      await classificationPage.expectProductStatus(
        groupName,
        candidate.productName,
        groupsData.fullyEligibleSearch.expectedStatus,
      );

      await leadsPage.open();
      await leadsPage.expectLoaded();
      await leadsSearchBar.searchBySavingGroup(groupName);
      await leadsPage.expectLeadRowVisible();
      await leadsPage.clickActiveLead();
      await leadDetailPage.expectLoaded();
      await leadDetailPage.expectLeadNumberNotEmpty();
      await leadDetailPage.expectLeadSavingGroup(groupName);
      await leadDetailPage.expectGeneratedDateIsToday();
      await leadDetailPage.expectSixTasksAllAssigned();
    },
  );

  // The group is chosen at run time (a 5/7 or 6/7 product still "Not Classified" that fails only
  // Backup Status / Members with Images); skipped when QA has none. Each run uses up one group.
  test(
    "TC-CL-03 | Running classification on a data correction group creates a pre lead with correct group information task assigned",
    { retries: 0 },
    async ({ page }) => {
      test.skip(
        !classificationAllowed(),
        "Classification is turned off for this environment (CLASSIFY_GROUPS=false): it changes real groups",
      );
      const candidate = await groupsPage.findClassificationCandidate(
        groupsData.dataCorrectionSearch,
        groupsData.classificationCandidate,
      );
      test.skip(
        !candidate,
        "No DreamSave group on QA has a 5/7 or 6/7 product, still Not Classified, with no workflow, lead or pre lead, failing only the allowed criteria",
      );
      const { groupName } = candidate;
      const { expectedCount } = preLeadsData.dataCorrectSearch;

      // Search and select the group
      await groupsPage.open();
      await groupsSearchBar.searchByGroupName(groupName);
      await classificationPage.selectGroupCheckbox(groupName);

      // Run classification — reusing existing methods
      await classificationPage.openActionsDropdown();
      await classificationPage.clickRunClassificationMenuItem();
      await classificationPage.confirmRunClassification();

      // Assert green summary pill
      await classificationPage.expectFullyEligibleSummaryPill();
      await classificationPage.closeSummaryModal();
      await classificationPage.expectModalDismissed();

      // Assert Data Correction Required badge on groups list
      await classificationPage.expectProductStatus(
        groupName,
        candidate.productName,
        groupsData.dataCorrectionSearch.expectedStatus,
      );

      // Navigate to Pre Leads and search by saving group name
      await preLeadsPage.open();
      await preLeadsPage.expectLoaded();
      await preLeadsSearchBar.searchBySavingGroup(groupName);
      await preLeadsSearchBar.expectResultCount(expectedCount);
      await preLeadsPage.expectPreLeadRowVisible();

      // Open the pre lead
      await preLeadsPage.clickFirstPreLead();
      await preLeadDetailPage.expectLoaded();

      // Assert pre lead details
      await preLeadDetailPage.expectPreLeadNumberNotEmpty();
      await preLeadDetailPage.expectSavingGroup(groupName);
      await preLeadDetailPage.expectGeneratedDateIsToday();

      // Assert tasks section
      await preLeadDetailPage.expectClientIdentificationStage();
      await preLeadDetailPage.expectCorrectGroupInformationTaskAssigned();
    },
  );
});
