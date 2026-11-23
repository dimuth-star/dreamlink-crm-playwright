// Field Officer app login and first-login onboarding. Idempotent: does nothing when already signed in.
const {
  MOBILE,
  MOBILE_TIMEOUTS,
  KEYCODES,
} = require("../../common/mobileSelectors");
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
  MOBILE.keycloakUsernameInput,
];
// A dialog left open by an interrupted run (date picker, schedule / start / complete confirmation),
// or a Keycloak browser tab left on top of the app by an interrupted login: Back closes each of them.
const LEFTOVER_DIALOGS = [
  MOBILE.datePickerYearHeader,
  MOBILE.confirmCompleteText,
  MOBILE.confirmStartText,
  MOBILE.scheduleDialogTitle,
  MOBILE.keycloakUsernameInput,
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

  // The app opens Keycloak in a Chrome custom tab; Chrome exposes the form, so its fields are used directly.
  async signInWithKeycloak(username, password) {
    await this.first(MOBILE.loginUsernameInput).then((el) =>
      el.setValue(username),
    );
    await this.hideKeyboard();
    await this.tap(MOBILE.loginContinueBtn);
    // the app pre-fills the username; set it only if Keycloak shows something else
    const usernameField = await this.first(
      MOBILE.keycloakUsernameInput,
      MOBILE_TIMEOUTS.long,
    );
    if ((await usernameField.getText()) !== username) {
      await usernameField.clearValue();
      await usernameField.setValue(username);
    }
    await this.tap(MOBILE.keycloakPasswordInput);
    await driver.execute("mobile: type", { text: password });
    // Enter in the password field submits the form. Do not hide the keyboard first: Android may do that
    // with Back, which closes the browser tab (and with it the form).
    await this.pressKey(KEYCODES.enter);
    await driver.waitUntil(
      async () => (await driver.getCurrentPackage()) === this.appPackage,
      {
        timeout: MOBILE_TIMEOUTS.long,
        interval: MOBILE_TIMEOUTS.pollSlow,
        timeoutMsg: "app did not return after Keycloak sign-in",
      },
    );
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
    const next = await this.waitForAny([
      MOBILE.permissionAllowWhileUsing,
      MOBILE.myTasksTitle,
      MOBILE.pinTitle,
    ]);
    if (next === MOBILE.permissionAllowWhileUsing)
      await this.tap(MOBILE.permissionAllowWhileUsing);
  }

  // Works from whatever screen the app is on (fresh install, signed out, or left mid-task by an
  // interrupted run) until My Tasks shows with nothing on top of it.
  // The loop re-reads the screen after every step, so a back that did not land yet is simply seen again.
  async ensureLoggedIn(credentials) {
    this.signedIn = false;
    for (let step = 0; step < MAX_START_STEPS; step++) {
      // Bring the app to the front (or launch it) before every step: a new session does not do that for
      // an app left in the background, and Back on a leftover Keycloak tab can leave the app altogether.
      // When the app is already in front this does nothing.
      await driver.activateApp(this.appPackage);
      const screen = await this.waitForAny(START_SCREENS, MOBILE_TIMEOUTS.long);
      if (
        screen === MOBILE.myTasksTitle &&
        !(await this.exists(MOBILE.filterSheetTitle))
      )
        return;
      if (LEFTOVER_DIALOGS.includes(screen)) {
        // cancel it: the task step that opened it is idempotent and opens it again
        await driver.back();
        await this.disappearsWithin(screen, MOBILE_TIMEOUTS.default);
      } else if (OTHER_SIGNED_IN_SCREENS.includes(screen)) {
        await driver.back();
        await this.firstToAppear([
          MOBILE.myTasksTitle,
          MOBILE.appTasksTab,
          MOBILE.surveyContainer,
        ]);
      } else {
        await this.completeOnboardingStep(screen, credentials);
      }
    }
    throw new Error("Could not reach My Tasks after login/onboarding");
  }

  async completeOnboardingStep(screen, { username, password, pin }) {
    if (screen === MOBILE.loginTitle) {
      // sign in at most once per run: repeated failed logins can lock the Field Officer account
      if (this.signedIn) {
        throw new Error(
          "the app asked to log in again after signing in; check FO_USERNAME / FO_PASSWORD (not retrying)",
        );
      }
      this.signedIn = true;
      await this.signInWithKeycloak(username, password);
    } else if (screen === MOBILE.settingUpText)
      await this.waitForGone(MOBILE.settingUpText, MOBILE_TIMEOUTS.long);
    else if (screen === MOBILE.pinTitle) await this.createOfflinePin(pin);
    else if (screen === MOBILE.enableLocationTitle) await this.enableLocation();
  }

  // --- assertions ---
  async expectOnTaskList() {
    await expect($(MOBILE.myTasksTitle)).toBeExisting({
      wait: MOBILE_TIMEOUTS.long,
    });
  }
}

module.exports = { LoginScreen };
