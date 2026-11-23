// Android native date dialog (used by the app's schedule dialog and by SurveyJS date inputs).
const { MOBILE } = require("../../../common/mobileSelectors");
const { BasePage } = require("../BasePage");

const pad = (n) => String(n).padStart(2, "0");
// The year list can open far from the target (e.g. at 2400); one swipe moves it about a dozen years.
const MAX_YEAR_LIST_SWIPES = 150;
// Within the right year the target month is at most 11 Prev/Next taps away.
const MAX_MONTH_STEPS = 14;

class NativeDatePicker extends BasePage {
  // Accessibility label of a day cell, e.g. "21 October 2008"
  dayLabel(date) {
    return `${pad(date.getDate())} ${date.toLocaleString("en-GB", { month: "long" })} ${date.getFullYear()}`;
  }

  async selectYear(year) {
    const header = await this.first(MOBILE.datePickerYearHeader);
    if ((await header.getText()) === String(year)) return;
    await header.click();
    const list = await this.first(MOBILE.datePickerYearList);
    // scroll the list itself towards the year: "up" for earlier years, "down" for later ones
    for (
      let i = 0;
      i < MAX_YEAR_LIST_SWIPES &&
      !(await this.exists(MOBILE.datePickerYear(year)));
      i++
    ) {
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
    for (
      let i = 0;
      i < MAX_MONTH_STEPS && !(await this.exists(MOBILE.datePickerDay(label)));
      i++
    ) {
      const shown = await this.first(MOBILE.datePickerShownDay);
      const shownDate = new Date(await shown.getAttribute("content-desc"));
      await this.tap(
        shownDate > date ? MOBILE.datePickerPrev : MOBILE.datePickerNext,
      );
    }
    await this.tap(MOBILE.datePickerDay(label));
  }

  // The dialog must already be open.
  async pick(date) {
    await this.first(MOBILE.datePickerYearHeader);
    await this.selectYear(date.getFullYear());
    await this.selectMonthAndDay(date);
    await this.tapUntilGone(
      MOBILE.datePickerConfirm,
      MOBILE.datePickerYearHeader,
    );
  }
}

module.exports = { NativeDatePicker };
