// TC-FO-02: Field Officer completes the 6 assessment tasks of this run's group in the mobile app.
// Step 2 of `npm run test:e2e:fo`; reads the group name written by TC-FO-01 (Playwright setup).
const { LoginScreen } = require("../pages/LoginScreen");
const { TaskListScreen } = require("../pages/TaskListScreen");
const { TaskDetailScreen } = require("../pages/TaskDetailScreen");
const { SurveyFormScreen } = require("../pages/SurveyFormScreen");
const { readRunState } = require("../../util/runState");
const { getFoApp, getFoCredentials } = require("../../util/helpers");
const foData = require("../../data/foEndToEnd.json");

describe("DreamLink FO App - Task completion", () => {
  const { groupName } = readRunState();
  const loginScreen = new LoginScreen({ appPackage: getFoApp().appPackage });
  const taskList = new TaskListScreen();
  const taskDetail = new TaskDetailScreen({ toasts: foData.mobile.toasts });
  const formScreen = new SurveyFormScreen({ formAnswers: foData.formAnswers, client: foData.client });

  before(async () => {
    await loginScreen.ensureLoggedIn(getFoCredentials());
    await loginScreen.expectOnTaskList();
    // Wait for background sync to deliver this run's tasks (no refresh taps)
    await taskList.waitForGroupTasks(groupName, foData.assessment.taskCount, {
      timeout: foData.mobile.syncTimeoutMs,
      interval: foData.mobile.syncPollIntervalMs,
    });
    await taskList.expectGroupTaskCount(groupName, foData.assessment.taskCount);
  });

  // Fixture order is the execution order; "Complete Insurance Registration" is always last.
  for (const task of foData.mobile.tasks) {
    it(`TC-FO-02 | ${task.title}: scheduled for today, started, forms completed and task completed`, async () => {
      // Resumed after an automatic retry: already found in the Completed section by the initial scan
      if (taskList.isKnownCompleted(task.title)) return taskList.expectKnownCompleted(task.title);
      await taskList.openTask(task.title, groupName);
      await taskDetail.scheduleToday();
      await taskDetail.markInProgress();
      await taskDetail.completeAllForms(formScreen, { prefilled: !!task.prefilled });
      await taskDetail.markCompleted();
      await taskDetail.expectStatus(foData.assessment.completedStatus);
    });
  }
});
