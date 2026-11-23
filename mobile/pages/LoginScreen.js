// Field Officer app login and first-login onboarding. Idempotent: does nothing when already signed in.
const { MOBILE, MOBILE_TIMEOUTS, KEYCODES } = require("../../common/mobileSelectors");
const { BasePage } = require("./BasePage");

// Every screen the app can be found on at start, in the order they are checked (first match wins).
const START_SCREENS = [
  MOBILE.myTasksTitle,
  MOBILE.loginTitle,
  MOBILE.settingUpText,
  MOBILE.pinTitle,
  MOBILE.enableLocationTitle,
  MOBILE.appTasksTab,
  MOBILE.surveyContainer,
  MOBILE.filterSheetTitle,
  MOBILE.datePickerYearHeader,
  MOBILE.confirmCompleteText,
  MOBILE.confirmStartText,
  MOBILE.scheduleDialogTitle,
];
// A dialog left open by an interrupted run (date picker, schedule / start / complete confirmation).
const LEFTOVER_DIALOGS = [
  MOBILE.datePickerYearHeader,
  MOBILE.confirmCompleteText,
  MOBILE.confirmStartText,
  MOBILE.scheduleDialogTitle,
];
// Signed in but resumed on another screen (task detail, a form, an open filter sheet).
const OTHER_SIGNED_IN_SCREENS = [
  MOBILE.myTasksTitle,
  MOBILE.appTasksTab,
  MOBILE.surveyContainer,
  MOBILE.filterSheetTitle,
];
// Worst case from a fresh install: login, setting up, PIN, location, plus a few backs out of a form.
const MAX_START_STEPS = 8;
const PIN_CLEAR_KEYS = 8; // the PIN is 6 digits

class LoginScreen extends BasePage {
  constructor({ appPackage }) {
    super();
    this.appPackage = appPackage;
  }

  // Keycloak opens in the browser's custom tab, whose web content is not in the accessibility tree,
  // so the password is entered with the keyboard: focus moves username -> password with Tab.
  async signInWithKeycloak(username, password) {
    await this.first(MOBILE.loginUsernameInput).then((el) => el.setValue(username));
    await this.tap(MOBILE.loginContinueBtn);
    await driver.waitUntil(async () => (await driver.getCurrentPackage()) !== this.appPackage, {
      timeout: MOBILE_TIMEOUTS.long,
      interval: MOBILE_TIMEOUTS.pollSlow,
      timeoutMsg: "Keycloak custom tab did not open",
    });
    // page fully loaded once the custom tab's progress bar is gone
    await this.waitForGone(MOBILE.customTabProgress, MOBILE_TIMEOUTS.long);
    await this.pressKey(KEYCODES.tab);
    await driver.execute("mobile: type", { text: password });
    await this.pressKey(KEYCODES.enter);
    await driver.waitUntil(async () => (await driver.getCurrentPackage()) === this.appPackage, {
      timeout: MOBILE_TIMEOUTS.long,
      interval: MOBILE_TIMEOUTS.pollSlow,
      timeoutMsg: "app did not return after Keycloak sign-in",
    });
  }

  async enterPin(box, pin) {
    const el = await this.first(box);
    await el.click();
    await this.pressKey(KEYCODES.del, PIN_CLEAR_KEYS);
    await this.pressDigits(pin);
  }

  async createOfflinePin(pin) {
    await this.enterPin(MOBILE.pinCreateBox, pin);
    await this.enterPin(MOBILE.pinConfirmBox, pin);
    await this.tap(MOBILE.pinSaveBtn);
    await this.waitForGone(MOBILE.pinTitle);
  }

  async enableLocation() {
    await this.tap(MOBILE.enableLocationBtn);
    const next = await this.waitForAny([MOBILE.permissionAllowWhileUsing, MOBILE.myTasksTitle, MOBILE.pinTitle]);
    if (next === MOBILE.permissionAllowWhileUsing) await this.tap(MOBILE.permissionAllowWhileUsing);
  }

  // Works from whatever screen the app is on (fresh install, signed out, or left mid-task by an
  // interrupted run) until My Tasks shows with nothing on top of it.
  // The loop re-reads the screen after every step, so a back that did not land yet is simply seen again.
  async ensureLoggedIn(credentials) {
    for (let step = 0; step < MAX_START_STEPS; step++) {
      const screen = await this.waitForAny(START_SCREENS, MOBILE_TIMEOUTS.long);
      if (screen === MOBILE.myTasksTitle && !(await this.exists(MOBILE.filterSheetTitle))) return;
      if (LEFTOVER_DIALOGS.includes(screen)) {
        // cancel it: the task step that opened it is idempotent and opens it again
        await driver.back();
        await this.disappearsWithin(screen, MOBILE_TIMEOUTS.default);
      } else if (OTHER_SIGNED_IN_SCREENS.includes(screen)) {
        await driver.back();
        await this.firstToAppear([MOBILE.myTasksTitle, MOBILE.appTasksTab, MOBILE.surveyContainer]);
      } else {
        await this.completeOnboardingStep(screen, credentials);
      }
    }
    throw new Error("Could not reach My Tasks after login/onboarding");
  }

  async completeOnboardingStep(screen, { username, password, pin }) {
    if (screen === MOBILE.loginTitle) await this.signInWithKeycloak(username, password);
    else if (screen === MOBILE.settingUpText) await this.waitForGone(MOBILE.settingUpText, MOBILE_TIMEOUTS.long);
    else if (screen === MOBILE.pinTitle) await this.createOfflinePin(pin);
    else if (screen === MOBILE.enableLocationTitle) await this.enableLocation();
  }

  // --- assertions ---
  async expectOnTaskList() {
    await expect($(MOBILE.myTasksTitle)).toBeExisting({ wait: MOBILE_TIMEOUTS.long });
  }
}

module.exports = { LoginScreen };
