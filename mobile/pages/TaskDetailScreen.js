// Task detail: schedule, start, open forms, complete.
const { MOBILE, MOBILE_TIMEOUTS } = require("../../common/mobileSelectors");
const { BasePage } = require("./BasePage");
const { NativeDatePicker } = require("./components/NativeDatePicker");

class TaskDetailScreen extends BasePage {
  constructor({ toasts }) {
    super();
    this.toasts = toasts;
    this.datePicker = new NativeDatePicker();
  }

  // Scheduled date is always today. Skipped when the task is already scheduled.
  async scheduleToday() {
    if (!(await this.exists(MOBILE.scheduleBtn))) return;
    await this.tap(MOBILE.scheduleBtn);
    await this.tap(MOBILE.scheduledDateField);
    await this.datePicker.pick(new Date());
    await this.tapUntilGone(MOBILE.scheduleSaveBtn, MOBILE.scheduleDialogTitle);
    await this.expectToast(this.toasts.scheduled);
  }

  async markInProgress() {
    if (!(await this.exists(MOBILE.markInProgressBtn))) return;
    await this.tap(MOBILE.markInProgressBtn);
    await this.first(MOBILE.confirmStartText);
    await this.tapUntilGone(MOBILE.dialogYesBtn, MOBILE.confirmStartText);
    await this.expectToast(this.toasts.inProgress);
  }

  // Bring the Forms list clear of the bottom action bar (which can cover the last form row).
  async revealForms() {
    await this.scrollToText(MOBILE.detailBottomAnchorText);
  }

  async nextPendingForm() {
    await this.revealForms();
    const rows = await $$(MOBILE.pendingFormRow);
    if (!rows.length) return null;
    return { row: rows[0], name: (await rows[0].getAttribute("content-desc")).split(", ")[0] };
  }

  async openForm(row) {
    await (await row.$(MOBILE.formRowViewBtn)).click();
    if (await this.appearsWithin(MOBILE.surveyContainer, MOBILE_TIMEOUTS.formOpen)) return;
    // the row sat behind the action bar: scroll it clear and tap View again
    await this.scrollPage("down", 0.5);
    const again = await this.nextPendingForm();
    if (!again) throw new Error("pending form row disappeared before it could be opened");
    await (await again.row.$(MOBILE.formRowViewBtn)).click();
    await this.first(MOBILE.surveyContainer, MOBILE_TIMEOUTS.form);
  }

  // Fill (or, for prefilled forms, just complete) every form that is not Completed yet.
  async completeAllForms(formScreen, { prefilled = false } = {}) {
    for (let i = 0; i < 8; i++) {
      const pending = await this.nextPendingForm();
      if (!pending) return;
      await this.openForm(pending.row);
      const outcome = prefilled ? await formScreen.completePrefilled() : await formScreen.fillAndComplete();
      if (outcome !== "closed") throw new Error(`form "${pending.name}" not completed: ${outcome}`);
      await this.waitForGone(MOBILE.surveyContainer, MOBILE_TIMEOUTS.form);
    }
    throw new Error("forms kept reappearing as pending");
  }

  async markCompleted() {
    if (!(await this.exists(MOBILE.markCompletedBtn))) return; // already completed (re-run safe)
    await this.tap(MOBILE.markCompletedBtn);
    const dialog = await this.waitForAny([MOBILE.cannotCompleteTitle, MOBILE.confirmCompleteText]);
    if (dialog === MOBILE.cannotCompleteTitle) {
      await this.tap(MOBILE.cannotCompleteOkBtn);
      throw new Error("App refused completion: not all forms are completed");
    }
    await this.tapUntilGone(MOBILE.dialogYesBtn, MOBILE.confirmCompleteText);
    await this.expectToast(this.toasts.completed);
  }

  // --- assertions ---
  // The status word can appear more than once (task status pill + form statuses), so assert on match count.
  async expectStatus(status) {
    await this.scrollToTop(); // the status pill sits at the top; the view may be scrolled to the forms
    await this.first(MOBILE.statusText(status), MOBILE_TIMEOUTS.default);
    expect(await this.exists(MOBILE.markCompletedBtn)).toBe(false);
  }
}

module.exports = { TaskDetailScreen };
