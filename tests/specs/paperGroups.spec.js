const { test } = require("@playwright/test");
const { LoginPage } = require("../../pages/user/LoginPage");
const { PaperGroupsPage } = require("../../pages/paperGroups/PaperGroupsPage");
const {
  PaperGroupsSearchBar,
} = require("../../pages/paperGroups/PaperGroupsSearchBar");
const {
  PaperGroupUploadModal,
} = require("../../pages/paperGroups/PaperGroupUploadModal");
const {
  PaperGroupImportReviewModal,
} = require("../../pages/paperGroups/PaperGroupImportReviewModal");
const {
  PaperGroupDetailPage,
} = require("../../pages/paperGroups/PaperGroupDetailPage");
const {
  PaperGroupAssessmentModal,
} = require("../../pages/paperGroups/PaperGroupAssessmentModal");
const { LeadsPage } = require("../../pages/leads/LeadsPage");
const { LeadsSearchBar } = require("../../pages/leads/LeadsSearchBar");
const { LeadDetailPage } = require("../../pages/leads/LeadDetailPage");
const { AssignTasksModal } = require("../../pages/leads/AssignTasksModal");
const { getCredentials } = require("../../util/helpers");
const { noMatchKeyword } = require("../../util/searchKeywords");
const {
  buildPaperGroupRows,
  writePaperGroupsFile,
} = require("../../util/paperGroupFile");
const paperGroupsData = require("../../data/paperGroups.json");

test.describe("DreamLink CRM - Paper Groups", () => {
  let loginPage;
  let paperGroupsPage;
  let paperGroupsSearchBar;
  let uploadModal;
  let reviewModal;
  let detailPage;
  let assessmentModal;
  let leadsPage;
  let leadsSearchBar;
  let leadDetailPage;
  let assignTasksModal;
  const userData = getCredentials();

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    paperGroupsPage = new PaperGroupsPage(page);
    paperGroupsSearchBar = new PaperGroupsSearchBar(page);
    uploadModal = new PaperGroupUploadModal(page);
    reviewModal = new PaperGroupImportReviewModal(page);
    detailPage = new PaperGroupDetailPage(page);
    assessmentModal = new PaperGroupAssessmentModal(page);
    leadsPage = new LeadsPage(page);
    leadsSearchBar = new LeadsSearchBar(page);
    leadDetailPage = new LeadDetailPage(page);
    assignTasksModal = new AssignTasksModal(page);
    await loginPage.open();
    await loginPage.login(userData.username, userData.password);
    await paperGroupsPage.open();
    await paperGroupsPage.expectLoaded();
  });

  test("TC-PG-01 | Download template saves the Paper Groups .xlsx template file with the expected columns", async ({
    page,
  }) => {
    const download = await paperGroupsPage.downloadTemplate();
    await paperGroupsPage.expectTemplateDownloaded(
      download,
      paperGroupsData.template.fileName,
    );
    await paperGroupsPage.expectTemplateHeaders(
      download,
      paperGroupsData.template.headers,
    );
  });

  test("TC-PG-02 | Uploading a file whose columns do not match the template is rejected with a column mismatch message", async ({
    page,
  }) => {
    const { filePath, rejectionMessage } =
      paperGroupsData.invalidUpload.wrongColumns;
    await paperGroupsPage.clickUploadGroups();
    await uploadModal.uploadFile(paperGroupsData.partner, filePath);
    await paperGroupsPage.expectImportRejected(rejectionMessage);
  });

  // TC-PG-03..05 share one uploaded batch, so they run in order: create -> edit -> delete.
  test("TC-PG-09 | Searching a group name read from the list returns that group and only matching rows", async ({
    page,
  }) => {
    const groupName = await paperGroupsPage.getFirstGroupName();
    await paperGroupsPage.searchByGroupName(groupName);
    await paperGroupsSearchBar.expectAllGroupNamesContain(groupName);
    await paperGroupsSearchBar.expectGroupListed(groupName);
  });

  test("TC-PG-10 | Searching a region read from the list returns only groups in that region", async ({
    page,
  }) => {
    const region = await paperGroupsPage.readFirstRegion();
    await paperGroupsSearchBar.searchByRegion(region);
    await paperGroupsSearchBar.expectAllRegionsContain(region);
  });

  test("TC-PG-11 | Searching a village read from the list returns only groups in that village", async ({
    page,
  }) => {
    const village = await paperGroupsPage.readFirstVillage();
    await paperGroupsSearchBar.searchByVillage(village);
    await paperGroupsSearchBar.expectAllVillagesContain(village);
  });

  test("TC-PG-12 | Searching a district read from the list returns only groups in that district", async ({
    page,
  }) => {
    const district = await paperGroupsPage.readFirstDistrict();
    await paperGroupsSearchBar.searchByDistrict(district);
    await paperGroupsSearchBar.expectAllDistrictsContain(district);
  });

  test("TC-PG-13 | Filtering by a classification read from the list returns only groups with that classification", async ({
    page,
  }) => {
    const classification = await paperGroupsPage.readFirstClassification();
    await paperGroupsSearchBar.filterByClassification(classification);
    await paperGroupsSearchBar.expectAllClassifications(classification);
  });

  test("TC-PG-14 | Filtering by the imported batch of a listed group returns only groups from that file", async ({
    page,
  }) => {
    const fileName = await paperGroupsPage.readFirstImportedList();
    await paperGroupsSearchBar.searchByImportedList(fileName);
    await paperGroupsSearchBar.expectAllImportedLists(fileName);
  });

  test("TC-PG-15 | Filtering by Duplicate Warning returns only groups marked Duplicate", async ({
    page,
  }) => {
    await paperGroupsSearchBar.showDuplicatesOnly();
    await paperGroupsSearchBar.expectAllMarkedDuplicate(
      paperGroupsData.duplicateLabel,
    );
  });

  test("TC-PG-16 | Selecting a partner chip lists as many groups as the chip's imported count", async ({
    page,
  }) => {
    const { partner, count } = await paperGroupsPage.readFirstPartnerChip();
    await paperGroupsSearchBar.selectPartnerChip(partner);
    await paperGroupsSearchBar.expectTotalCount(count);
  });

  test("TC-PG-17 | A non-existent value in each text filter (group name, region, village, district) displays the no results message", async ({
    page,
  }) => {
    const { keywordPrefix, textFilters } = paperGroupsData.invalidSearch;
    for (const filterKey of textFilters) {
      // fresh list each time: the previous empty state would satisfy the check
      await paperGroupsPage.open();
      await paperGroupsPage.expectLoaded();
      await paperGroupsSearchBar.searchByTextFilter(
        filterKey,
        noMatchKeyword(keywordPrefix),
      );
      await paperGroupsPage.expectNoResults(paperGroupsData.noResultsMessage);
    }
  });

  test("TC-PG-18 | Combining region, village and district read from the same group returns only groups matching all three", async ({
    page,
  }) => {
    const { region, village, district } =
      await paperGroupsPage.readFirstLocation();
    await paperGroupsSearchBar.searchByRegion(region);
    await paperGroupsSearchBar.searchByVillage(village);
    await paperGroupsSearchBar.searchByDistrict(district);
    await paperGroupsSearchBar.expectAllRegionsContain(region);
    await paperGroupsSearchBar.expectAllVillagesContain(village);
    await paperGroupsSearchBar.expectAllDistrictsContain(district);
  });

  test("TC-PG-19 | Clear All Filters after a combined search restores the full Paper Groups list", async ({
    page,
  }) => {
    const totalCount = await paperGroupsPage.readTotalCount();
    const { region, village } = await paperGroupsPage.readFirstLocation();
    await paperGroupsSearchBar.searchByRegion(region);
    await paperGroupsSearchBar.searchByVillage(village);
    await paperGroupsSearchBar.expectAllVillagesContain(village);
    await paperGroupsSearchBar.clearAllFilters();
    await paperGroupsSearchBar.expectFullListRestored(totalCount);
  });

  test.describe.serial("Paper Group lifecycle", () => {
    let runPrefix;
    let groupNames = [];

    // Safety net: removes any group of this run that a failed test left behind.
    test.afterAll(async ({ browser }) => {
      if (!runPrefix) return;
      const context = await browser.newContext({
        baseURL: process.env.BASE_URL,
        viewport: { width: 1920, height: 1080 },
      });
      try {
        const page = await context.newPage();
        const cleanupLogin = new LoginPage(page);
        const cleanupList = new PaperGroupsPage(page);
        const cleanupDetail = new PaperGroupDetailPage(page);
        await cleanupLogin.open();
        await cleanupLogin.login(userData.username, userData.password);
        await cleanupList.open();
        await cleanupList.expectLoaded();
        await cleanupList.searchByGroupName(runPrefix);
        while ((await cleanupList.getVisibleGroupCount()) > 0) {
          const groupName = await cleanupList.getFirstGroupName();
          await cleanupList.clickFirstGroup();
          await cleanupDetail.deleteGroup();
          await cleanupList.expectLoaded();
          // Wait for the queued deletion to finish before looking at the next group
          await cleanupList.expectGroupRemoved(
            groupName,
            paperGroupsData.noResultsMessage,
          );
          // Fresh load so the previous search's "no results" message cannot look like a result
          await cleanupList.open();
          await cleanupList.expectLoaded();
          await cleanupList.searchByGroupName(runPrefix);
        }
      } finally {
        await context.close();
      }
    });

    test(
      "TC-PG-03 | Uploading a valid template with 3 groups, reviewing and confirming the import lists all 3 groups",
      { retries: 0 },
      async ({ page }, testInfo) => {
        const data = paperGroupsData.validUpload;
        const stamp = Date.now();
        runPrefix = `${data.baseName} ${stamp}`;
        const { names, rows } = buildPaperGroupRows({
          baseName: data.baseName,
          stamp,
          count: data.groupCount,
          defaults: data,
        });
        groupNames = names;
        const filePath = await writePaperGroupsFile(
          testInfo.outputPath("paperGroups.xlsx"),
          paperGroupsData.template.headers,
          rows,
        );

        // Upload and validate
        await paperGroupsPage.clickUploadGroups();
        await uploadModal.uploadFile(paperGroupsData.partner, filePath);

        // Review and confirm
        await reviewModal.expectOpen();
        await reviewModal.expectSummary(data.reviewSummaryMessage);
        await reviewModal.proceedWithImport();
        await reviewModal.expectImportedToast(
          data.groupCount,
          data.importedMessageSuffix,
        );
        await paperGroupsPage.expectImportFinished();

        // Assert all groups are listed
        await paperGroupsPage.open();
        await paperGroupsPage.expectLoaded();
        await paperGroupsPage.searchByGroupName(runPrefix);
        await paperGroupsPage.expectResultCount(data.groupCount);
      },
    );

    test("TC-PG-04 | Editing a paper group's village and saving persists the change", async ({
      page,
    }) => {
      const { village } = paperGroupsData.editGroup;
      await paperGroupsPage.searchByGroupName(groupNames[0]);
      await paperGroupsPage.expectResultCount(1);
      await paperGroupsPage.clickFirstGroup();
      await detailPage.expectLoaded();
      await detailPage.fillVillage(village);
      await detailPage.save();
      await detailPage.expectSaved();
      await detailPage.reload();
      await detailPage.expectVillage(village);
    });

    test("TC-PG-05 | Deleting a paper group removes it from the Paper Groups list", async ({
      page,
    }) => {
      const { successMessageSuffix } = paperGroupsData.deleteGroup;
      await paperGroupsPage.searchByGroupName(groupNames[0]);
      await paperGroupsPage.expectResultCount(1);
      await paperGroupsPage.clickFirstGroup();
      await detailPage.expectLoaded();
      await detailPage.deleteGroup();
      await detailPage.expectDeletedToast(groupNames[0], successMessageSuffix);
      await paperGroupsPage.expectLoaded();
      await paperGroupsPage.expectGroupRemoved(
        groupNames[0],
        paperGroupsData.noResultsMessage,
      );
    });
  });

  // TC-PG-06..08 use their own group (never the TC-PG-03..05 ones): once the assessment starts or tasks are
  // assigned, the group is locked and can no longer be edited or deleted, so this data stays on QA by design.
  // The group is named "QA ASM <timestamp>-1" to make it easy to find.
  test.describe.serial("Paper Group assessment and task assignment", () => {
    let assessedGroupName;

    test(
      "TC-PG-06 | Running an assessment on an uploaded Verification Ready paper group generates its DreamLink number",
      { retries: 0 },
      async ({ page }, testInfo) => {
        const data = paperGroupsData.assessment;
        const upload = paperGroupsData.validUpload;
        const { names, rows } = buildPaperGroupRows({
          baseName: data.baseName,
          stamp: Date.now(),
          count: data.groupCount,
          defaults: { ...upload, cycleNumber: data.cycleNumber },
        });
        assessedGroupName = names[0];
        const filePath = await writePaperGroupsFile(
          testInfo.outputPath("paperGroupsAssessment.xlsx"),
          paperGroupsData.template.headers,
          rows,
        );

        // Upload, review and confirm the import
        await paperGroupsPage.clickUploadGroups();
        await uploadModal.uploadFile(paperGroupsData.partner, filePath);
        await reviewModal.expectOpen();
        await reviewModal.expectSummary(upload.reviewSummaryMessage);
        await reviewModal.proceedWithImport();
        await reviewModal.expectImportedToast(
          data.groupCount,
          upload.importedMessageSuffix,
        );
        await paperGroupsPage.expectImportFinished();

        // The group is Verification Ready
        await paperGroupsPage.open();
        await paperGroupsPage.expectLoaded();
        await paperGroupsPage.searchByGroupName(assessedGroupName);
        await paperGroupsPage.expectResultCount(1);
        await paperGroupsPage.expectFirstRowContains(data.classification);

        // Start the assessment
        await paperGroupsPage.selectFirstGroup();
        await paperGroupsPage.startAssessment();
        await assessmentModal.expectOpen();
        await assessmentModal.selectProduct(data.product);
        await assessmentModal.confirm();
        await assessmentModal.expectAssessmentInitiated(data.resultMessage);

        // DreamLink number is generated and the group is locked
        await paperGroupsPage.open();
        await paperGroupsPage.expectLoaded();
        await paperGroupsPage.searchByGroupName(assessedGroupName);
        await paperGroupsPage.clickFirstGroup();
        await detailPage.expectLoaded();
        await detailPage.expectDreamLinkNumber(data.dreamLinkPattern);
        await detailPage.expectLocked(data.lockedMessage);
      },
    );

    test("TC-PG-07 | A lead is created for the assessed group with 6 unassigned tasks", async ({
      page,
    }) => {
      const data = paperGroupsData.assessment;
      await leadsPage.open();
      await leadsSearchBar.searchBySavingGroup(assessedGroupName);
      await leadsPage.expectLeadRowVisible();
      await leadsPage.clickFirstLead();
      await leadDetailPage.expectLoaded();
      await leadDetailPage.expectLeadSavingGroup(assessedGroupName);
      await leadDetailPage.expectTaskCount(data.leadTaskCount);
      await leadDetailPage.expectAllTasksStatus(
        data.leadTaskCount,
        data.unassignedStatus,
      );
    });

    test("TC-PG-08 | Assigning the lead's 6 tasks to fo.zambia marks every task Assigned to FO Zambia", async ({
      page,
    }) => {
      const data = paperGroupsData.assessment;
      const { searchTerm, userName, successMessage } =
        paperGroupsData.assignment;
      await leadsPage.open();
      await leadsSearchBar.searchBySavingGroup(assessedGroupName);
      await leadsPage.expectLeadRowVisible();
      await leadsPage.clickFirstLead();
      await leadDetailPage.expectLoaded();

      await leadDetailPage.clickAssignTasks();
      await assignTasksModal.expectOpen();
      await assignTasksModal.selectUser(searchTerm);
      await assignTasksModal.clickAssign();
      await assignTasksModal.expectConfirmationFor(userName);
      await assignTasksModal.confirm();
      await assignTasksModal.expectAssignedToast(successMessage);

      await leadDetailPage.reload();
      await leadDetailPage.expectTaskCount(data.leadTaskCount);
      await leadDetailPage.expectAllTasksStatus(
        data.leadTaskCount,
        data.assignedStatus,
      );
      await leadDetailPage.expectAllTasksAssignedTo(
        data.leadTaskCount,
        userName,
      );
    });
  });
});
