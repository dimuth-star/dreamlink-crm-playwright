// Fills the app's SurveyJS forms (rendered in a WebView). Which kind a question is comes from
// util/surveyQuestions.js; which value it gets comes from util/formAnswerRules.js (fixture rules).
const { MOBILE, MOBILE_TIMEOUTS, MOBILE_TEXT, KEYCODES } = require("../../common/mobileSelectors");
const { FormAnswerRules, isoDate, isNumeric } = require("../../util/formAnswerRules");
const { readSurveySnapshot, questionIdsIn } = require("../../util/surveyQuestions");
const { logInfo, logError } = require("../../util/loggers");
const { BasePage } = require("./BasePage");
const { NativeDatePicker } = require("./components/NativeDatePicker");
const { GalleryPicker } = require("./components/GalleryPicker");

// After answering one of these the layout below can move, so the next question needs a fresh snapshot.
const LAYOUT_CHANGING = new Set(["file", "date", "dropdown", "signature", "unknown"]);
const MAX_SNAPSHOTS_PER_PAGE = 120;

class SurveyFormScreen extends BasePage {
  // group: the uploaded group's fixture block, so member count and phone always match what CRM holds
  constructor({ formAnswers, client, group, log = logInfo }) {
    super();
    this.answers = new FormAnswerRules({ formAnswers, client, group });
    this.datePicker = new NativeDatePicker();
    this.gallery = new GalleryPicker();
    this.log = log;
  }

  note(qid, kind, title, value) {
    this.log(`  [${qid}] ${kind.padEnd(9)} ${title.slice(0, 70)} => ${value}`);
  }

  async titleOf(qid) {
    const t = await $$(MOBILE.questionTitle(qid));
    return t.length ? (await t[0].getText()).trim() : `(untitled ${qid})`;
  }

  // ---------- question handlers ----------

  async answerLocation(qid, title) {
    if (!(await this.exists(MOBILE.locationEmpty(qid)))) return this.note(qid, "location", title, "already captured");
    await this.tap(MOBILE.locationBtn(qid));
    await this.waitForGone(MOBILE.locationEmpty(qid), MOBILE_TIMEOUTS.long);
    this.note(qid, "location", title, "captured");
  }

  async answerFile(qid, title) {
    const selectBtn = MOBILE.fileSelectBtn(qid);
    for (let k = 0; k < 4 && !(await this.exists(selectBtn)) && !(await this.exists(MOBILE.fileUploaded(qid))); k++) {
      await this.scrollPage("down", 0.2);
    }
    if (await this.exists(MOBILE.fileUploaded(qid))) return this.note(qid, "file", title, "already uploaded");
    await this.tap(selectBtn);
    await this.gallery.pickFirstImage();
    await driver.waitUntil(
      async () => (await this.exists(MOBILE.surveyContainer)) && (await this.exists(MOBILE.fileUploaded(qid))),
      { timeout: MOBILE_TIMEOUTS.form, interval: MOBILE_TIMEOUTS.pollSlow, timeoutMsg: `image not attached to ${qid}` },
    );
    this.note(qid, "file", title, "gallery image attached");
  }

  async answerBoolean(qid, title, force) {
    const value = this.answers.booleanValue(title);
    // option labels are the last matches; an answered question also shows its value as text
    await this.tap(MOBILE.booleanOption(qid, value));
    this.note(qid, "boolean", title, value + (force ? " (fix)" : ""));
  }

  async answerDate(qid, title, force) {
    const input = await this.first(MOBILE.questionInput(qid));
    const current = ((await input.getText()) || "").trim();
    const { date, fromRule } = this.answers.dateFor(title);
    // A prefilled date is kept only when no rule covers it; a rule always wins (e.g. the share-out date
    // must sit after the loan term, whatever was carried over from another form).
    if (current && !force && (!fromRule || current === isoDate(date))) {
      return this.note(qid, "date", title, `kept "${current}"`);
    }
    for (let attempt = 1; attempt <= 2; attempt++) {
      await this.hideKeyboard();
      await input.click();
      // the first tap can be swallowed (it only moves focus off another field)
      if (!(await this.appearsWithin(MOBILE.datePickerYearHeader, MOBILE_TIMEOUTS.short))) await input.click();
      await this.datePicker.pick(date);
      // commit: move focus off the date input (its own title), then read the value back
      const t = await $$(MOBILE.questionTitle(qid));
      if (t.length) await t[0].click();
      const value = (await (await this.first(MOBILE.questionInput(qid))).getText()) || "";
      if (value.trim()) return this.note(qid, "date", title, `${date.toDateString()} (shows "${value}")`);
    }
    throw new Error(`date did not stick on ${qid} (${title})`);
  }

  // The value a dropdown currently shows ("" when empty). `timeout` waits for a value to render first.
  async shownDropdownValue(qid, timeout = 0) {
    if (timeout) await this.appearsWithin(MOBILE.dropdownShownValue(qid), timeout);
    const shown = await $$(MOBILE.dropdownShownValue(qid));
    return shown.length ? shown[0].getText() : "";
  }

  // A prefilled value is kept unless the fix pass forces a new one or it repeats a unique answer.
  // Returns true when the value was kept.
  async keepPrefilledDropdown(qid, title, force, used) {
    if (!(await this.exists(MOBILE.dropdownClearBtn(qid)))) return false;
    const current = await this.shownDropdownValue(qid);
    const duplicate = this.answers.isUnique(title) && current && used.has(current);
    if (!duplicate && !force) {
      if (current) used.add(current);
      this.note(qid, "dropdown", title, `kept "${current}"`);
      return true;
    }
    await this.tap(MOBILE.dropdownClearBtn(qid));
    return false;
  }

  // Focus + Arrow Down opens the list; the first tap can be swallowed while focus leaves the previous field.
  async openDropdownList(qid, title) {
    const input = await this.scrollToResourceIdMatching(`^${qid}i_(0|undefined)$`);
    await this.hideKeyboard();
    for (let attempt = 1; attempt <= 3; attempt++) {
      await input.click();
      await this.pressKey(KEYCODES.down);
      if (await this.appearsWithin(MOBILE.dropdownList(qid), MOBILE_TIMEOUTS.short)) return;
    }
    throw new Error(`dropdown list for ${qid} (${title}) did not open`);
  }

  async dropdownOptions(qid) {
    const texts = [];
    for (const o of await $$(MOBILE.dropdownOptions(qid))) texts.push(await o.getText());
    return texts;
  }

  async selectDropdownOption(qid, title, want, options, popup) {
    if (popup) {
      // popup variant: tapping an option does not commit; navigate with the keyboard, Enter, then OK.
      // Focus starts on the first option and Enter there does not commit, so N presses select option N.
      const index = options.indexOf(want);
      if (index < 1) throw new Error(`popup dropdown ${qid} (${title}) cannot select its first option "${want}"`);
      await this.pressKey(KEYCODES.down, index);
      await this.pressKey(KEYCODES.enter);
      await this.tap(MOBILE.dropdownPopupOkBtn);
    } else {
      await this.tap(MOBILE.dropdownOption(qid, want));
    }
    await this.waitForGone(MOBILE.dropdownList(qid), MOBILE_TIMEOUTS.default).catch(() => {});
  }

  async answerDropdown(qid, title, force, used) {
    used[title] = used[title] || new Set();
    if (await this.keepPrefilledDropdown(qid, title, force, used[title])) return;
    await this.openDropdownList(qid, title);
    const options = await this.dropdownOptions(qid);
    const popup = await this.exists(MOBILE.dropdownPopupOkBtn);
    const want = this.answers.dropdownChoice(title, options, { used: used[title], popup });
    await this.selectDropdownOption(qid, title, want, options, popup);
    // read back what the form actually holds, so a wrong selection fails here instead of being submitted
    const shown = await this.shownDropdownValue(qid, MOBILE_TIMEOUTS.short);
    if (shown !== want) throw new Error(`dropdown ${qid} (${title}) shows "${shown}" after choosing "${want}"`);
    used[title].add(want);
    this.note(qid, "dropdown", title, `${want}${popup ? " (popup)" : ""} (options: ${options.join(" | ")})`);
  }

  async answerInput(qid, title, force) {
    const input = (await $$(MOBILE.questionEditText(qid)))[0];
    const current = (await input.getText()) || "";
    const { value, fromRule, kind } = this.answers.inputValue(title);
    if (current.trim() && !fromRule && !force) return this.note(qid, "text", title, `kept "${current}"`);
    if (isNumeric(value)) {
      await this.typeDigits(input, value);
    } else {
      try {
        await input.setValue(value);
      } catch (e) {
        // an unmatched title on a numeric input: HTML number inputs reject text
        if (!/convert .* to float|SET_PROGRESS/i.test(e.message)) throw e;
        await this.typeDigits(input, this.answers.defaults.number);
        await this.hideKeyboard();
        return this.note(qid, "number", title, `${this.answers.defaults.number} (numeric default)`);
      }
    }
    await this.hideKeyboard();
    this.note(qid, kind, title, value);
  }

  // intentional stabilization: a signature pad is a canvas with no inner elements, so the only way to sign
  // is a pointer stroke. Offsets are derived from the question element's own rect at runtime.
  async answerSignature(qid, title) {
    const el = await this.first(MOBILE.question(qid));
    const { x, y, width, height } = await driver.getElementRect(el.elementId);
    const pts = [
      [0.2, 0.55],
      [0.4, 0.75],
      [0.6, 0.55],
      [0.8, 0.75],
    ].map(([fx, fy]) => ({ x: Math.round(x + fx * width), y: Math.round(y + fy * height) }));
    await driver
      .action("pointer", { parameters: { pointerType: "touch" } })
      .move(pts[0])
      .down()
      .move({ ...pts[1], duration: 150 })
      .move({ ...pts[2], duration: 150 })
      .move({ ...pts[3], duration: 150 })
      .up()
      .perform();
    this.note(qid, "signature", title, "signed");
  }

  // Answers one classified question (kinds: util/surveyQuestions.js).
  async answerAs({ qid, title, kind }, { force = false, used }) {
    if (kind === "container") return undefined; // dynamic panel: its child questions are answered one by one
    // the title was outside the snapshot: read it now that the question is in view
    if (title.startsWith("(untitled")) title = await this.titleOf(qid);
    if (kind === "location") return this.answerLocation(qid, title);
    if (kind === "file") return this.answerFile(qid, title);
    if (kind === "boolean") return this.answerBoolean(qid, title, force);
    if (kind === "date") return this.answerDate(qid, title, force);
    if (kind === "dropdown") return this.answerDropdown(qid, title, force, used);
    if (kind === "input") return this.answerInput(qid, title, force);
    if (kind === "signature") return this.answerSignature(qid, title);
    // left to the form's own validation (a required question then comes back in the fix pass)
    logError(`  [${qid}] question type not recognised, left unanswered: ${title}`);
  }

  // ---------- reading the screen ----------

  // Questions on screen from ONE page-source read; also keeps the source for scrollPage's "moved" check.
  async snapshot() {
    const xml = await driver.getPageSource();
    this.lastSource = xml;
    const { viewport, questions } = readSurveySnapshot(xml);
    this.viewport = viewport;
    return questions;
  }

  // True when the control sits in the comfortable middle band of the viewport (not under the bottom
  // tab bar, not clipped at the top), so it can be used without any scroll-into-view search.
  comfortablyVisible(box) {
    const v = this.viewport;
    if (!box || !v) return false;
    return this.bandPosition(box.y1, box.y2 - box.y1, v.y1, v.y2 - v.y1) === "inside";
  }

  // Slow path for one question (fix pass, end of page, controls below the fold): bring it into view,
  // classify it from a fresh snapshot and answer it.
  async answer(qid, { force = false, used = {} } = {}) {
    await this.scrollToResourceId(qid);
    let question = await this.questionOnScreen(qid);
    if (question.kind === "unknown") {
      // its controls are still below the fold
      await this.scrollPage("down", 0.3);
      question = await this.questionOnScreen(qid);
    }
    return this.answerAs(question, { force, used });
  }

  async questionOnScreen(qid) {
    const question = (await this.snapshot()).find((q) => q.qid === qid);
    return question || { qid, title: `(untitled ${qid})`, kind: "unknown" };
  }

  // Fast path: the snapshot already says what the question is and where its control sits.
  async answerFromSnapshot(question, { used }) {
    if (question.kind === "container") return undefined;
    if (question.kind === "unknown") return this.answer(question.qid, { used });
    // only search/scroll when the snapshot says the control is not comfortably on screen
    if (!this.comfortablyVisible(question.box)) await this.scrollToResourceId(question.qid);
    return this.answerAs(question, { used });
  }

  // ---------- page / form flow ----------

  // One top-to-bottom pass: answer every question as soon as it appears in the visible tree.
  // Required questions a pass might miss are caught by the form's own validation and the fix pass.
  async fillCurrentPage(seen, used) {
    await this.scrollToTop();
    for (let s = 0; s < MAX_SNAPSHOTS_PER_PAGE; s++) {
      const lastChance = s === MAX_SNAPSHOTS_PER_PAGE - 1;
      if (await this.answerVisible(seen, used, lastChance)) continue; // layout moved: take a fresh snapshot
      const hasPads = MOBILE.signaturePadInSource.test(this.lastSource || "");
      if (!(await this.scrollPage("down", 0.6, { before: this.lastSource, noPads: !hasPads }))) {
        return this.answerRemaining(seen, used); // end of page
      }
    }
  }

  // Answers the unseen questions of one snapshot. Returns true when the layout below may have moved.
  async answerVisible(seen, used, lastChance) {
    for (const q of await this.snapshot()) {
      if (seen.has(q.qid) || !q.displayed) continue;
      // controls not on screen yet: leave it for the next snapshot after scrolling
      if (q.kind === "unknown" && !lastChance) continue;
      seen.add(q.qid);
      await this.answerFromSnapshot(q, { used });
      if (LAYOUT_CHANGING.has(q.kind)) return true;
    }
    return false;
  }

  // End of page: anything still unseen (its controls never showed in a snapshot) takes the slow path.
  async answerRemaining(seen, used) {
    for (const q of await this.snapshot()) {
      if (seen.has(q.qid) || !q.displayed) continue;
      seen.add(q.qid);
      await this.answer(q.qid, { used });
    }
  }

  async erroredQuestionIds() {
    const ids = new Set();
    await this.scrollToTop();
    for (let s = 0; s < 80; s++) {
      for (const c of await $$(MOBILE.formErrorContainers)) ids.add((await c.getAttribute("resource-id")).replace(/_errors$/, ""));
      if (!(await this.scrollPage("down", 0.7))) break;
    }
    return [...ids];
  }

  // The form container briefly drops out of the tree while the WebView redraws between pages, so
  // "closed" needs positive evidence: the container is gone AND the task detail screen is showing.
  async formClosed() {
    return !(await this.exists(MOBILE.surveyContainer)) && (await this.exists(MOBILE.markCompletedBtn));
  }

  // Polls the named checks in order until one is true; "no change" when none is within `timeout`.
  async firstOutcome(outcomes, timeout) {
    let outcome = "no change";
    await driver
      .waitUntil(
        async () => {
          for (const [name, happened] of outcomes) if (await happened()) return (outcome = name);
          return false;
        },
        { timeout, interval: MOBILE_TIMEOUTS.pollSlow },
      )
      .catch(() => {});
    return outcome;
  }

  async navigationButton() {
    if (await this.exists(MOBILE.formNextBtn)) return MOBILE.formNextBtn;
    if (await this.exists(MOBILE.formCompleteBtn)) return MOBILE.formCompleteBtn;
    const btn = await this.scrollToText(MOBILE_TEXT.formComplete, 60);
    return (await btn.isExisting()) ? MOBILE.formCompleteBtn : null;
  }

  // Press Next/Complete and wait for: form closed, page changed, or validation errors.
  async advance() {
    const before = questionIdsIn(await driver.getPageSource()).join(",");
    const button = await this.navigationButton();
    if (!button) return "no navigation button";
    await this.tap(button);
    return this.firstOutcome(
      [
        ["closed", () => this.formClosed()],
        ["errors", () => this.exists(MOBILE.formErrorTexts)],
        ["page changed", async () => {
          const now = questionIdsIn(await driver.getPageSource()).join(",");
          return Boolean(now) && now !== before;
        }],
      ],
      MOBILE_TIMEOUTS.default,
    );
  }

  async fillAndComplete({ maxPages = 8 } = {}) {
    const seen = new Set();
    const used = {};
    for (let page = 0; page < maxPages; page++) {
      const pt = await $$(MOBILE.pageTitle);
      this.log(`--- page ${page + 1}: ${pt.length ? await pt[0].getText() : "?"}`);
      await this.fillCurrentPage(seen, used);
      let outcome = await this.advance();
      // targeted fix pass: re-answer only the questions the form flagged
      for (let fix = 0; fix < 2 && outcome === "errors"; fix++) {
        const errored = await this.erroredQuestionIds();
        this.log(`--- fixing validation errors on: ${errored.join(", ")}`);
        for (const qid of errored) await this.answer(qid, { force: true, used });
        outcome = await this.advance();
      }
      this.log(`--- ${outcome}`);
      if (outcome !== "page changed") return outcome;
    }
    return "too many pages";
  }

  // Prefilled forms (e.g. FAST Insurance KYC): touch no field — scroll to Complete and press it.
  async completePrefilled() {
    await this.hideKeyboard();
    for (let i = 0; i < 60 && !(await this.exists(MOBILE.formCompleteBtn)); i++) {
      const moved = await this.scrollPage("down", 0.9);
      await this.hideKeyboard(); // a gesture can focus a field; never type into it
      if (!moved) break; // end of the page: try the Complete button as it is
    }
    await this.tap(MOBILE.formCompleteBtn);
    return this.firstOutcome(
      [
        ["closed", () => this.formClosed()],
        ["errors (prefilled form not touched)", () => this.exists(MOBILE.formErrorTexts)],
      ],
      MOBILE_TIMEOUTS.form,
    );
  }
}

module.exports = { SurveyFormScreen };
