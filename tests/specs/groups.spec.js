const { test, expect } = require("@playwright/test");
const { LoginPage } = require("../../pages/user/LoginPage");
const { GroupsPage } = require("../../pages/groups/GroupsPage");
const { GroupDetailPage } = require("../../pages/groups/GroupDetailPage");
const { GroupsSearchBar } = require("../../pages/groups/GroupsSearchBar");
const { getCredentials } = require("../../util/helpers");
const { noMatchKeyword } = require("../../util/searchKeywords");
const groupsData = require("../../data/groups.json");

test.describe("DreamLink CRM - DreamSave Groups", () => {
  let loginPage;
  let groupsPage;
  let groupDetailPage;
  let groupsSearchBar;
  const userData = getCredentials();

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    groupsPage = new GroupsPage(page);
    groupDetailPage = new GroupDetailPage(page);
    groupsSearchBar = new GroupsSearchBar(page);
    await loginPage.open();
    await loginPage.login(userData.username, userData.password);
    await groupsPage.open();
    await groupsPage.expectLoaded();
  });

  test("TC-DS-01 | DreamSave Groups list displays 20 records by default", async ({
    page,
  }) => {
    await groupsPage.expectDefaultPageSize(20);
  });

  test("TC-DS-02 | Clicking the first group navigates to its detail page with correct group name", async ({
    page,
  }) => {
    const selectedGroupName = await groupsPage.clickFirstGroup();
    await groupDetailPage.expectLoaded();
    await groupDetailPage.expectGroupDetailName(selectedGroupName);
  });

  test("TC-DS-03 | Searching a group name read from the list returns that group and only matching rows", async ({
    page,
  }) => {
    const keyword = await groupsPage.readFirstGroupName();
    await groupsSearchBar.searchByGroupName(keyword);
    await groupsSearchBar.expectAllResultsContain(keyword);
    await groupsSearchBar.expectGroupVisible(keyword);
  });

  test("TC-DS-04 | Search with a word shared by several listed groups returns multiple matching results", async ({
    page,
  }) => {
    const keyword = await groupsPage.readBroadKeyword();
    await groupsSearchBar.searchByGroupName(keyword);
    await groupsSearchBar.expectAllResultsContain(keyword);
    await groupsSearchBar.expectMultipleResults();
  });

  test("TC-DS-05 | Invalid search displays no results message", async ({
    page,
  }) => {
    const keyword = noMatchKeyword(groupsData.invalidSearch.keywordPrefix);
    await groupsSearchBar.searchByGroupName(keyword);
    await groupsSearchBar.expectNoResults(groupsData.noResultsMessage);
  });

  test("TC-DS-06 | Searching a group number read from the list returns exactly that group", async ({
    page,
  }) => {
    const groupNumber = await groupsPage.readFirstGroupNumber();
    await groupsSearchBar.searchByGroupNumber(groupNumber);
    await groupsSearchBar.expectGroupNumberListedOnce(groupNumber);
  });

  test("TC-DS-07 | Searching a meeting location read from the list returns only groups meeting there", async ({
    page,
  }) => {
    const meetingLocation = await groupsPage.readFirstMeetingLocation();
    await groupsSearchBar.searchByMeetingLocation(meetingLocation);
    await groupsSearchBar.expectAllMeetingLocationsContain(meetingLocation);
  });

  test("TC-DS-08 | Searching a partner read from the list returns only that partner's groups", async ({
    page,
  }) => {
    const partner = await groupsPage.readFirstPartner();
    await groupsSearchBar.searchByPartner(partner);
    await groupsSearchBar.expectAllPartnersContain(partner);
  });

  test("TC-DS-09 | Filtering by a product read from the list returns only groups listing that product", async ({
    page,
  }) => {
    const { productName } = await groupsPage.readFirstProductEligibility();
    await groupsSearchBar.searchByProduct(productName);
    await groupsSearchBar.expectAllRowsListProduct(productName);
  });

  test("TC-DS-10 | Filtering by an eligibility score read from the list returns only groups with a product at that score", async ({
    page,
  }) => {
    const { scoreBadge } = await groupsPage.readFirstProductEligibility();
    const score = scoreBadge.split("/")[0];
    await groupsPage.filterByEligibilityScore(score, scoreBadge);
    await groupsSearchBar.expectAllRowsHaveScore(scoreBadge);
  });

  test("TC-DS-11 | Filtering by a status read from the list returns only groups with a product in that status", async ({
    page,
  }) => {
    const { status } = await groupsPage.readFirstProductEligibility();
    await groupsSearchBar.filterByStatus(status);
    await groupsSearchBar.expectAllRowsHaveStatus(status);
  });

  // Region has no positive case: the list has no Region column and QA groups have no region.
  test("TC-DS-12 | A non-existent value in each text filter (group number, meeting location, region, partner) displays the no results message", async ({
    page,
  }) => {
    const { keywordPrefix, textFilters } = groupsData.invalidSearch;
    for (const filterKey of textFilters) {
      // fresh list each time: the previous empty state would satisfy the check
      await groupsPage.open();
      await groupsPage.expectLoaded();
      await groupsSearchBar.searchByTextFilter(
        filterKey,
        noMatchKeyword(keywordPrefix),
      );
      await groupsSearchBar.expectNoResults(groupsData.noResultsMessage);
    }
  });

  test("TC-DS-13 | Combining partner and status read from the same group returns only groups matching both", async ({
    page,
  }) => {
    const { partner, status } = await groupsPage.readFirstProductEligibility();
    await groupsSearchBar.searchByPartner(partner);
    await groupsSearchBar.filterByStatus(status);
    await groupsSearchBar.expectAllPartnersContain(partner);
    await groupsSearchBar.expectAllRowsHaveStatus(status);
  });

  test("TC-DS-14 | Clear All Filters after a search restores the full group list", async ({
    page,
  }) => {
    const totalCount = await groupsPage.readTotalCount();
    await groupsSearchBar.searchByGroupNumber(
      noMatchKeyword(groupsData.invalidSearch.keywordPrefix),
    );
    await groupsSearchBar.expectNoResults(groupsData.noResultsMessage);
    await groupsSearchBar.clearAllFilters();
    await groupsSearchBar.expectFullListRestored(totalCount);
  });
});
