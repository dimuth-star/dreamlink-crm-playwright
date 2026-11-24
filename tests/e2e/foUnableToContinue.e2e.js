// Field Officer "Unable to Continue" end-to-end flow, CRM side. Run through `npm run test:e2e:fo:utc`:
//   1. TC-FO-04 (@fu-setup)        — this file: two groups assessed, each lead's 6 tasks assigned to fo.zambia
//   2. TC-FO-05 / TC-FO-06         — mobile/specs/foUnableToContinue.e2e.js (WebdriverIO)
//   3. TC-FO-07..09 (@fu-verify)   — this file: CRM shows the outcome of each reason
// Scenario 1 = "Incorrect information" (TC-FO-05, TC-FO-07), Scenario 2 = Resume Workflow on that lead
// (TC-FO-08), Scenario 3 = "Group does not exist" (TC-FO-06, TC-FO-09).
// Own state file (foUnableToContinue.json) and tags, so the happy path (`npm run test:e2e:fo`) is unaffected.
const { test } = require("@playwright/test");
const { LoginPage } = require("../../pages/user/LoginPage");
const { PaperGroupsPage } = require("../../pages/paperGroups/PaperGroupsPage");
const {
  PaperGroupUploadModal,
} = require("../../pages/paperGroups/PaperGroupUploadModal");
const {
  PaperGroupImportReviewModal,
} = require("../../pages/paperGroups/PaperGroupImportReviewModal");
const {
  PaperGroupAssessmentModal,
} = require("../../pages/paperGroups/PaperGroupAssessmentModal");
const {
  PaperGroupDetailPage,
} = require("../../pages/paperGroups/PaperGroupDetailPage");
const { LeadsPage } = require("../../pages/leads/LeadsPage");
const { LeadsSearchBar } = require("../../pages/leads/LeadsSearchBar");
const { LeadDetailPage } = require("../../pages/leads/LeadDetailPage");
const { AssignTasksModal } = require("../../pages/leads/AssignTasksModal");
const {
  ResumeWorkflowModal,
} = require("../../pages/leads/ResumeWorkflowModal");
const { getCredentials } = require("../../util/helpers");
const {
  buildPaperGroupRows,
  writePaperGroupsFile,
} = require("../../util/paperGroupFile");
const {
  writeRunState,
  readRunState,
  clearRunState,
} = require("../../util/runState");
const paperGroupsData = require("../../data/paperGroups.json");
const foData = require("../../data/foEndToEnd.json");
const utcData = require("../../data/foUnableToContinue.json");

const TASK_TITLES = foData.mobile.tasks.map((task) => task.title);
// { "<task title>": status } for the lead's 6 Field Officer tasks
const statusOfAll = (status) =>
  Object.fromEntries(TASK_TITLES.map((title) => [title, status]));

test.describe("DreamLink CRM - Field Officer Unable to Continue", () => {
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
  let resumeWorkflowModal;
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
    resumeWorkflowModal = new ResumeWorkflowModal(page);
    await loginPage.open();
    await loginPage.login(userData.username, userData.password);
  });

  // Assess one imported group, check its lead and assign the 6 tasks to fo.zambia. Returns the lead number.
  async function assessAndAssign(groupName) {
    const { assessment, assignment } = foData;
    await paperGroupsPage.open();
    await paperGroupsPage.expectLoaded();
    await paperGroupsPage.searchByGroupName(groupName);
    await paperGroupsPage.expectResultCount(1);
    await paperGroupsPage.expectFirstRowContains(assessment.classification);
    await paperGroupsPage.startAssessmentWhenReady(groupName);
    await assessmentModal.expectOpen();
    await assessmentModal.selectProduct(assessment.product);
    await assessmentModal.confirm();
    await assessmentModal.expectAssessmentInitiated(assessment.resultMessage);

    // DreamLink number generated, group locked
    await paperGroupsPage.open();
    await paperGroupsPage.expectLoaded();
    await paperGroupsPage.searchByGroupName(groupName);
    await paperGroupsPage.clickFirstGroup();
    await groupDetailPage.expectLoaded();
    await groupDetailPage.expectDreamLinkNumber(assessment.dreamLinkPattern);
    await groupDetailPage.expectLocked(assessment.lockedMessage);

    // Lead with 6 unassigned tasks -> all assigned to fo.zambia
    await leadsPage.open();
    await leadsSearchBar.searchBySavingGroup(groupName);
    await leadsPage.expectLeadRowVisible();
    await leadsPage.clickFirstLead();
    await leadDetailPage.expectLoaded();
    await leadDetailPage.expectLeadSavingGroup(groupName);
    await leadDetailPage.expectTaskCount(assessment.taskCount);
    await leadDetailPage.expectAllTasksStatus(
      assessment.taskCount,
      assessment.unassignedStatus,
    );
    const leadNumber = await leadDetailPage.readLeadNumber();
    await leadDetailPage.clickAssignTasks();
    await assignTasksModal.expectOpen();
    await assignTasksModal.selectUser(assignment.searchTerm);
    await assignTasksModal.clickAssign();
    await assignTasksModal.expectConfirmationFor(assignment.userName);
    await assignTasksModal.confirm();
    await assignTasksModal.expectAssignedToast(assignment.successMessage);
    await leadDetailPage.reload();
    await leadDetailPage.expectAllTasksStatus(
      assessment.taskCount,
      assessment.assignedStatus,
    );
    await leadDetailPage.expectAllTasksAssignedTo(
      assessment.taskCount,
      assignment.userName,
    );
    return leadNumber;
  }

  async function openLead(leadNumber, groupName) {
    await leadsPage.open();
    await leadsSearchBar.searchByLeadNumber(leadNumber);
    // the newest leads are listed until the filter applies: wait for this lead's single row
    await leadsSearchBar.expectResultCount(1);
    await leadsSearchBar.expectLeadVisible(leadNumber);
    await leadsPage.clickFirstLead();
    await leadDetailPage.expectLoaded();
    await leadDetailPage.expectLeadSavingGroup(groupName);
  }

  // Leaves two locked groups, their leads and tasks on QA by design (assessed groups cannot be deleted).
  test(
    "TC-FO-04 | Two Verification Ready groups are assessed and each lead's 6 tasks are assigned to fo.zambia @fu-setup",
    { retries: 0 },
    async ({ page }, testInfo) => {
      const upload = { ...foData.upload, ...utcData.upload };
      clearRunState(utcData.stateFile);
      const { names, rows } = buildPaperGroupRows({
        baseName: upload.baseName,
        stamp: Date.now(),
        count: upload.groupCount,
        defaults: upload,
      });
      const filePath = await writePaperGroupsFile(
        testInfo.outputPath("foUnableToContinue.xlsx"),
        paperGroupsData.template.headers,
        rows,
      );

      // One import with both groups (10 members, cycle 3 => Verification Ready)
      await paperGroupsPage.open();
      await paperGroupsPage.expectLoaded();
      await paperGroupsPage.clickUploadGroups();
      await uploadModal.uploadFile(paperGroupsData.partner, filePath);
      await reviewModal.expectOpen();
      await reviewModal.expectSummary(
        paperGroupsData.validUpload.reviewSummaryMessage,
      );
      await reviewModal.proceedWithImport();
      await reviewModal.expectImportedToast(
        upload.groupCount,
        paperGroupsData.validUpload.importedMessageSuffix,
      );
      await paperGroupsPage.expectImportFinished();

      // Scenario 1 (Incorrect information) gets the first group, Scenario 3 (Group does not exist) the second
      const [incorrectGroup, notExistGroup] = names;
      const incorrectLead = await assessAndAssign(incorrectGroup);
      const notExistLead = await assessAndAssign(notExistGroup);

      writeRunState(
        {
          incorrectInformation: {
            groupName: incorrectGroup,
            leadNumber: incorrectLead,
          },
          groupDoesNotExist: {
            groupName: notExistGroup,
            leadNumber: notExistLead,
          },
        },
        utcData.stateFile,
      );
    },
  );

  test.describe.serial("Incorrect information, then Resume Workflow", () => {
    test("TC-FO-07 | Scenario 1: after one task is marked Unable to Continue (Incorrect information), all 6 tasks of the lead show Unable to Continue @fu-verify", async () => {
      const { groupName, leadNumber } = readRunState(
        utcData.stateFile,
      ).incorrectInformation;
      await openLead(leadNumber, groupName);
      await leadDetailPage.expectTaskStatusesEventually(
        statusOfAll(utcData.statuses.unableToContinue),
      );
    });

    test("TC-FO-08 | Scenario 2: Resume Workflow restores the task marked on mobile to In Progress (its status before) and the other 5 to Assigned @fu-verify", async () => {
      const { groupName, leadNumber, selectedTask } = readRunState(
        utcData.stateFile,
      ).incorrectInformation;
      await openLead(leadNumber, groupName);
      await leadDetailPage.clickResumeWorkflow();
      await resumeWorkflowModal.expectOpenFor(
        utcData.resumeDialog.title,
        leadNumber,
      );
      await resumeWorkflowModal.confirm();
      await leadDetailPage.expectTaskStatusesEventually({
        ...statusOfAll(utcData.statuses.assigned),
        [selectedTask]: utcData.statuses.inProgress,
      });
    });
  });

  test("TC-FO-09 | Scenario 3: after one task is marked Unable to Continue (Group does not exist), all 6 tasks show Unable to Continue and Resume Workflow is not offered @fu-verify", async () => {
    const { groupName, leadNumber } = readRunState(
      utcData.stateFile,
    ).groupDoesNotExist;
    await openLead(leadNumber, groupName);
    await leadDetailPage.expectTaskStatusesEventually(
      statusOfAll(utcData.statuses.unableToContinue),
    );
    await leadDetailPage.expectResumeWorkflowHidden();
  });
});
