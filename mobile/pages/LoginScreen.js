// Field Officer app login and first-login onboarding. Idempotent: does nothing when already signed in.
const { MOBILE, MOBILE_TIMEOUTS, KEYCODES } = require("../../common/mobileSelectors");
const { BasePage } = require("./BasePage");

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
    await driver.waitUntil(async () => (await this.currentPackage()) !== this.appPackage, {
      timeout: MOBILE_TIMEOUTS.long,
      interval: 1000,
      timeoutMsg: "Keycloak custom tab did not open",
    });
    // page fully loaded once the custom tab's progress bar is gone
    await this.waitForGone(MOBILE.customTabProgress, MOBILE_TIMEOUTS.long);
    await this.pressKey(KEYCODES.tab);
    await driver.execute("mobile: type", { text: password });
    await this.pressKey(KEYCODES.enter);
    await driver.waitUntil(async () => (await this.currentPackage()) === this.appPackage, {
      timeout: MOBILE_TIMEOUTS.long,
      interval: 1000,
      timeoutMsg: "app did not return after Keycloak sign-in",
    });
  }

  async enterPin(box, pin) {
    const el = await this.first(box);
    await el.click();
    await this.pressKey(KEYCODES.del, 8);
    for (const ch of String(pin)) await this.pressKey(KEYCODES.digit0 + Number(ch));
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

  async ensureLoggedIn({ username, password, pin }) {
    for (let step = 0; step < 8; step++) {
      const screen = await this.waitForAny(
        [
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
        ],
        MOBILE_TIMEOUTS.long,
      );
      if (screen === MOBILE.myTasksTitle && !(await this.exists(MOBILE.filterSheetTitle))) return;
      // A dialog left open by an interrupted run (date picker, schedule / start / complete confirmation):
      // cancel it; the task step that opened it is idempotent and will redo it.
      if ([MOBILE.datePickerYearHeader, MOBILE.confirmCompleteText, MOBILE.confirmStartText, MOBILE.scheduleDialogTitle].includes(screen)) {
        await driver.back();
        await this.waitForGone(screen).catch(() => {});
        continue;
      }
      // Signed in but resumed on another screen (task detail, a form, an open filter sheet): back to the list
      if ([MOBILE.myTasksTitle, MOBILE.appTasksTab, MOBILE.surveyContainer, MOBILE.filterSheetTitle].includes(screen)) {
        await driver.back();
        await this.waitForAny([MOBILE.myTasksTitle, MOBILE.appTasksTab, MOBILE.surveyContainer]).catch(() => {});
        continue;
      }
      if (screen === MOBILE.loginTitle) await this.signInWithKeycloak(username, password);
      else if (screen === MOBILE.settingUpText) await this.waitForGone(MOBILE.settingUpText, MOBILE_TIMEOUTS.long);
      else if (screen === MOBILE.pinTitle) await this.createOfflinePin(pin);
      else if (screen === MOBILE.enableLocationTitle) await this.enableLocation();
    }
    throw new Error("Could not reach My Tasks after login/onboarding");
  }

  // --- assertions ---
  async expectOnTaskList() {
    await expect($(MOBILE.myTasksTitle)).toBeExisting({ wait: MOBILE_TIMEOUTS.long });
  }
}

module.exports = { LoginScreen };
