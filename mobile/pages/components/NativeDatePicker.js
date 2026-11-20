// Android native date dialog (used by the app's schedule dialog and by SurveyJS date inputs).
const { MOBILE, MOBILE_TIMEOUTS } = require("../../../common/mobileSelectors");
const { BasePage } = require("../BasePage");

const pad = (n) => String(n).padStart(2, "0");

class NativeDatePicker extends BasePage {
  // Accessibility label of a day cell, e.g. "21 October 2008"
  dayLabel(date) {
    return `${pad(date.getDate())} ${date.toLocaleString("en-GB", { month: "long" })} ${date.getFullYear()}`;
  }

  async waitOpen(timeout = MOBILE_TIMEOUTS.default) {
    await this.first(MOBILE.datePickerYearHeader, timeout);
  }

  async isOpen() {
    return this.exists(MOBILE.datePickerYearHeader);
  }

  async selectYear(year) {
    const header = await this.first(MOBILE.datePickerYearHeader);
    if ((await header.getText()) === String(year)) return;
    await header.click();
    const list = await this.first(MOBILE.datePickerYearList);
    // The year list can open far from the target (e.g. at 2400): scroll the list itself towards it,
    // "up" for earlier years and "down" for later ones, until the year is on screen.
    for (let i = 0; i < 150 && !(await this.exists(MOBILE.datePickerYear(year))); i++) {
      const shown = await $$(MOBILE.datePickerYearItems);
      const firstShown = Number(await shown[0].getText());
      await driver.execute("mobile: scrollGesture", {
        elementId: list.elementId,
        direction: firstShown > year ? "up" : "down",
        percent: 1.0,
      });
    }
    await this.tap(MOBILE.datePickerYear(year));
  }

  async selectMonthAndDay(date) {
    const label = this.dayLabel(date);
    for (let i = 0; i < 14 && !(await this.exists(MOBILE.datePickerDay(label))); i++) {
      const shown = await this.first(MOBILE.datePickerShownDay);
      const shownDate = new Date(await shown.getAttribute("content-desc"));
      await this.tap(shownDate > date ? MOBILE.datePickerPrev : MOBILE.datePickerNext);
    }
    await this.tap(MOBILE.datePickerDay(label));
  }

  // The dialog must already be open.
  async pick(date) {
    await this.waitOpen();
    await this.selectYear(date.getFullYear());
    await this.selectMonthAndDay(date);
    await this.tapUntilGone(MOBILE.datePickerConfirm, MOBILE.datePickerYearHeader);
  }
}

module.exports = { NativeDatePicker };
