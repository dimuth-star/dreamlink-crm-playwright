const { test } = require('@playwright/test');
const { LoginPage } = require('../../pages/user/LoginPage');
const { GroupsPage } = require('../../pages/groups/GroupsPage');
const { GroupsSearchBar } = require('../../pages/groups/GroupsSearchBar');
const { ClassificationPage } = require('../../pages/groups/ClassificationPage');
const { LeadsPage } = require('../../pages/leads/LeadsPage');
const { LeadsSearchBar } = require('../../pages/leads/LeadsSearchBar');
const { LeadDetailPage } = require('../../pages/leads/LeadDetailPage');
const { getCredentials } = require('../../util/helpers');
const groupsData = require('../../data/groups.json');

test.describe('DreamLink CRM - Run Classification', () => {
  let loginPage;
  let groupsPage;
  let groupsSearchBar;
  let classificationPage;
  let leadsPage;
  let leadsSearchBar;
  let leadDetailPage;
  const userData = getCredentials();

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    groupsPage = new GroupsPage(page);
    groupsSearchBar = new GroupsSearchBar(page);
    classificationPage = new ClassificationPage(page);
    leadsPage = new LeadsPage(page);
    leadsSearchBar = new LeadsSearchBar(page);
    leadDetailPage = new LeadDetailPage(page);
    await loginPage.open();
    await loginPage.login(userData.username, userData.password);
    await groupsPage.open();
    await groupsPage.expectLoaded();
  });

  test('TC-CL-01 | Running classification on a group with an active workflow shows "No Groups Classified" summary', async ({ page }) => {
    const { keyword, expectedCount } = groupsData.classificationSearch;

    // Search for the target group
    await groupsSearchBar.searchByGroupName(keyword);
    await groupsSearchBar.expectResultCount(expectedCount);

    // Select the group via its checkbox
    await classificationPage.selectFirstGroupCheckbox();

    // Open Actions dropdown and trigger Run Classification
    await classificationPage.openActionsDropdown();
    await classificationPage.clickRunClassificationMenuItem();

    // Confirm in the Run Classification modal
    await classificationPage.confirmRunClassification();

    // Assert Classification Summary modal shows "No Groups Classified"
    await classificationPage.expectSummaryPillText();

    // Close the summary modal
    await classificationPage.closeSummaryModal();

    // Assert modal is fully dismissed
    await classificationPage.expectModalDismissed();
  });

  // PRE-CONDITION: Reset "Karoo Transport Collective 01D0F8E1-0240" to Not Classified on zm-qa before running
  test('TC-CL-02 | Running classification on a fully eligible group creates a lead with 6 assigned tasks',
    { retries: 0 },
    async ({ page }) => {
      const { keyword, expectedCount, groupName } = groupsData.fullyEligibleSearch;

      // Search and select the group
      await groupsSearchBar.searchByGroupName(keyword);
      await groupsSearchBar.expectResultCount(expectedCount);
      await classificationPage.selectFirstGroupCheckbox();

      // Open Actions dropdown and trigger Run Classification
      await classificationPage.openActionsDropdown();
      await classificationPage.clickRunClassificationMenuItem();

      // Confirm in the Run Classification modal
      await classificationPage.confirmRunClassification();

      // Assert Classification Summary modal shows green fully eligible pill
      await classificationPage.expectFullyEligibleSummaryPill();

      // Close the summary modal
      await classificationPage.closeSummaryModal();

      // Assert modal is dismissed
      await classificationPage.expectModalDismissed();

      // Assert Fully Eligible badge is visible on the groups list row
      await classificationPage.expectFullyEligibleBadgeVisible();

      // Navigate to Leads page
      await leadsPage.open();
      await leadsPage.expectLoaded();

      // Search for the lead by saving group name
      await leadsSearchBar.searchBySavingGroup(groupName);
      await leadsPage.expectLeadRowVisible();

      // Open the Active lead
      await leadsPage.clickActiveLead();
      await leadDetailPage.expectLoaded();

      // Assert lead number is not empty
      await leadDetailPage.expectLeadNumberNotEmpty();

      // Assert saving group name matches
      await leadDetailPage.expectLeadSavingGroup(groupName);

      // Assert generated date is today
      await leadDetailPage.expectGeneratedDateIsToday();

      // Assert 6 tasks are present and all have Assigned status
      await leadDetailPage.expectSixTasksAllAssigned();
    }
  );
});