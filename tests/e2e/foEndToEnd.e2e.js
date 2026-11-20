// Field Officer end-to-end flow, CRM side. Run through `npm run test:e2e:fo`:
//   1. TC-FO-01 (@fo-setup)  — this file
//   2. TC-FO-02              — mobile/specs/foTaskCompletion.e2e.js (WebdriverIO)
//   3. TC-FO-03 (@fo-verify) — this file
// Named *.e2e.js so the main Playwright config (which matches *.spec.js) never picks it up:
// TC-FO-01 creates data that cannot be deleted and TC-FO-03 needs the mobile step to have run.
const { test } = require("@playwright/test");
const { LoginPage } = require("../../pages/user/LoginPage");
const { PaperGroupsPage } = require("../../pages/paperGroups/PaperGroupsPage");
const { PaperGroupUploadModal } = require("../../pages/paperGroups/PaperGroupUploadModal");
const { PaperGroupImportReviewModal } = require("../../pages/paperGroups/PaperGroupImportReviewModal");
const { PaperGroupAssessmentModal } = require("../../pages/paperGroups/PaperGroupAssessmentModal");
const { PaperGroupDetailPage } = require("../../pages/paperGroups/PaperGroupDetailPage");
const { LeadsPage } = require("../../pages/leads/LeadsPage");
const { LeadsSearchBar } = require("../../pages/leads/LeadsSearchBar");
const { LeadDetailPage } = require("../../pages/leads/LeadDetailPage");
const { AssignTasksModal } = require("../../pages/leads/AssignTasksModal");
const { getCredentials } = require("../../util/helpers");
const { buildPaperGroupRows, writePaperGroupsFile } = require("../../util/paperGroupFile");
const { writeRunState, readRunState, clearRunState } = require("../../util/runState");
const paperGroupsData = require("../../data/paperGroups.json");
const foData = require("../../data/foEndToEnd.json");

test.describe("DreamLink CRM - Field Officer end-to-end", () => {
  let loginPage;
  let paperGroupsPage;
  let uploadModal;
  let reviewModal;
  let assessmentModal;
  let groupDetailPage;
  let leadsPage;
  let leadsSearchBar;
  let leadDetailPage;
  let assignTasksModal;
  const userData = getCredentials();

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    paperGroupsPage = new PaperGroupsPage(page);
    uploadModal = new PaperGroupUploadModal(page);
    reviewModal = new PaperGroupImportReviewModal(page);
    assessmentModal = new PaperGroupAssessmentModal(page);
    groupDetailPage = new PaperGroupDetailPage(page);
    leadsPage = new LeadsPage(page);
    leadsSearchBar = new LeadsSearchBar(page);
    leadDetailPage = new LeadDetailPage(page);
    assignTasksModal = new AssignTasksModal(page);
    await loginPage.open();
    await loginPage.login(userData.username, userData.password);
  });

  // Leaves one locked group, its lead and 6 tasks on QA by design (assessed groups cannot be deleted).
  test(
    "TC-FO-01 | Verification Ready group is assessed, its lead gets 6 tasks and all are assigned to fo.zambia @fo-setup",
    { retries: 0 },
    async ({ page }, testInfo) => {
      const { upload, assessment, assignment } = foData;
      clearRunState();
      const { names, rows } = buildPaperGroupRows({
        baseName: upload.baseName,
        stamp: Date.now(),
        count: upload.groupCount,
        defaults: upload,
      });
      const groupName = names[0];
      const filePath = await writePaperGroupsFile(
        testInfo.outputPath("foEndToEnd.xlsx"),
        paperGroupsData.template.headers,
        rows,
      );

      // Upload, review and confirm the import (10 members, cycle 3 => Verification Ready)
      await paperGroupsPage.open();
      await paperGroupsPage.expectLoaded();
      await paperGroupsPage.clickUploadGroups();
      await uploadModal.uploadFile(paperGroupsData.partner, filePath);
      await reviewModal.expectOpen();
      await reviewModal.expectSummary(paperGroupsData.validUpload.reviewSummaryMessage);
      await reviewModal.proceedWithImport();
      await reviewModal.expectImportedToast(upload.groupCount, paperGroupsData.validUpload.importedMessageSuffix);
      await paperGroupsPage.expectImportFinished();

      // Start the assessment
      await paperGroupsPage.open();
      await paperGroupsPage.expectLoaded();
      await paperGroupsPage.searchByGroupName(groupName);
      await paperGroupsPage.expectResultCount(1);
      await paperGroupsPage.expectFirstRowContains(assessment.classification);
      await paperGroupsPage.selectFirstGroup();
      await paperGroupsPage.startAssessment();
      await assessmentModal.expectOpen();
      await assessmentModal.selectProduct(assessment.product);
      await assessmentModal.confirm();
      await assessmentModal.expectAssessmentInitiated(assessment.resultMessage);

      // DreamLink number generated
      await paperGroupsPage.open();
      await paperGroupsPage.expectLoaded();
      await paperGroupsPage.searchByGroupName(groupName);
      await paperGroupsPage.clickFirstGroup();
      await groupDetailPage.expectLoaded();
      await groupDetailPage.expectDreamLinkNumber(assessment.dreamLinkPattern);
      await groupDetailPage.expectLocked(assessment.lockedMessage);

      // Lead created with 6 unassigned tasks
      await leadsPage.open();
      await leadsSearchBar.searchBySavingGroup(groupName);
      await leadsPage.expectLeadRowVisible();
      await leadsPage.clickFirstLead();
      await leadDetailPage.expectLoaded();
      await leadDetailPage.expectLeadSavingGroup(groupName);
      await leadDetailPage.expectTaskCount(assessment.taskCount);
      await leadDetailPage.expectAllTasksStatus(assessment.taskCount, assessment.unassignedStatus);

      // Assign all tasks to fo.zambia
      await leadDetailPage.clickAssignTasks();
      await assignTasksModal.expectOpen();
      await assignTasksModal.selectUser(assignment.searchTerm);
      await assignTasksModal.clickAssign();
      await assignTasksModal.expectConfirmationFor(assignment.userName);
      await assignTasksModal.confirm();
      await assignTasksModal.expectAssignedToast(assignment.successMessage);
      await leadDetailPage.reload();
      await leadDetailPage.expectAllTasksStatus(assessment.taskCount, assessment.assignedStatus);
      await leadDetailPage.expectAllTasksAssignedTo(assessment.taskCount, assignment.userName);

      // Hand the group over to the mobile step
      writeRunState({ groupName });
    },
  );

  test("TC-FO-03 | All 6 tasks completed in the Field Officer app sync back to CRM as Completed @fo-verify", async () => {
    const { assessment, assignment } = foData;
    const { groupName } = readRunState();
    await leadsPage.open();
    await leadsSearchBar.searchBySavingGroup(groupName);
    await leadsPage.expectLeadRowVisible();
    await leadsPage.clickFirstLead();
    await leadDetailPage.expectLoaded();
    await leadDetailPage.expectLeadSavingGroup(groupName);
    // The 6 Field Officer tasks by title; follow-up tasks the workflow adds (e.g. "Review Loan Documents") are ignored
    const taskTitles = foData.mobile.tasks.map((t) => t.title);
    await leadDetailPage.expectTasksStatusEventually(taskTitles, assessment.completedStatus);
    await leadDetailPage.expectTasksStatusEventually(taskTitles, assignment.userName);
  });
});
