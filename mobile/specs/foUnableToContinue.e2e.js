// TC-FO-05 / TC-FO-06: the Field Officer marks one task of each group "Unable to Continue" in the app.
// Step 2 of `npm run test:e2e:fo:utc` (config: mobile/wdio.unableToContinue.conf.js); reads the groups
// written by TC-FO-04 (Playwright setup) and records the task it picked for the CRM checks.
const { LoginScreen } = require("../pages/LoginScreen");
const { TaskListScreen } = require("../pages/TaskListScreen");
const { TaskDetailScreen } = require("../pages/TaskDetailScreen");
const { readRunState, updateRunState } = require("../../util/runState");
const { getFoApp, getFoCredentials } = require("../../util/helpers");
const foData = require("../../data/foEndToEnd.json");
const utcData = require("../../data/foUnableToContinue.json");

// One task of the group at random; a retried attempt keeps the task picked before (saved in the state).
function pickTask(scenarioKey) {
  const scenario = readRunState(utcData.stateFile)[scenarioKey];
  if (scenario.selectedTask) return scenario.selectedTask;
  const titles = foData.mobile.tasks.map((task) => task.title);
  const selectedTask = titles[Math.floor(Math.random() * titles.length)];
  updateRunState(
    { [scenarioKey]: { ...scenario, selectedTask } },
    utcData.stateFile,
  );
  return selectedTask;
}

describe("DreamLink FO App - Unable to Continue", () => {
  const state = readRunState(utcData.stateFile);
  const loginScreen = new LoginScreen({ appPackage: getFoApp().appPackage });
  const taskList = new TaskListScreen();
  const taskDetail = new TaskDetailScreen({ toasts: utcData.mobile.toasts });
  const sync = {
    timeout: foData.mobile.syncTimeoutMs,
    interval: foData.mobile.syncPollIntervalMs,
  };
  const { taskCount } = foData.assessment;

  before(async () => {
    await loginScreen.ensureLoggedIn(getFoCredentials());
    await loginScreen.expectOnTaskList();
  });

  it("TC-FO-05 | Scenario 1: a random task of the group is scheduled, started and marked Unable to Continue (Incorrect information)", async () => {
    const { groupName } = state.incorrectInformation;
    const { reason } = utcData.scenarios.incorrectInformation;
    await taskList.goToList(); // the app can be left on a task's detail screen
    await taskList.waitForGroupTasks(groupName, taskCount, sync);
    await taskList.expectGroupTaskCount(groupName, taskCount);
    const taskTitle = pickTask("incorrectInformation");
    await taskList.openTask(taskTitle, groupName);
    await taskDetail.scheduleToday();
    await taskDetail.markInProgress();
    await taskDetail.markUnableToContinue(reason);
    await taskDetail.expectStatus(utcData.mobile.unableToContinueStatus);
  });

  it("TC-FO-06 | Scenario 3: a random task of the group is scheduled, started and marked Unable to Continue (Group does not exist)", async () => {
    const { groupName } = state.groupDoesNotExist;
    const { reason } = utcData.scenarios.groupDoesNotExist;
    await taskList.goToList(); // the previous scenario ends on a task's detail screen
    await taskList.waitForGroupTasks(groupName, taskCount, sync);
    await taskList.expectGroupTaskCount(groupName, taskCount);
    const taskTitle = pickTask("groupDoesNotExist");
    await taskList.openTask(taskTitle, groupName);
    await taskDetail.scheduleToday();
    await taskDetail.markInProgress();
    await taskDetail.markUnableToContinue(reason);
    await taskDetail.expectStatus(utcData.mobile.unableToContinueStatus);
  });
});
