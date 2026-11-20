// Generic filler for the app's SurveyJS forms (rendered in a WebView; questions are exposed as
// sq_N / sq_N_ariaTitle / sq_Ni nodes). Answers come from fixture rules matched on the question title.
const { MOBILE, MOBILE_TIMEOUTS } = require("../../common/mobileSelectors");
const { resolveDateToken, toZambianIntl } = require("../../util/clientDataGenerator");
const { BasePage } = require("./BasePage");
const { NativeDatePicker } = require("./components/NativeDatePicker");
const { GalleryPicker } = require("./components/GalleryPicker");
const { parseUiXml, walk, descendants, idOf, parseBounds } = require("../../util/uiTree");

const ANSWER_KEYS_BY_KIND = {
  input: ["text", "number"],
  date: ["date"],
  dropdown: ["option"],
  boolean: ["bool"],
};

class SurveyFormScreen extends BasePage {
  constructor({ formAnswers, client, log = (line) => console.log(line) }) {
    super();
    this.client = client;
    this.defaults = formAnswers.defaults;
    this.tokens = {
      "{{members}}": client.members,
      "{{mobileIntl}}": toZambianIntl(client.mobileLocal),
      "{{idNumber}}": client.idNumber,
      "{{idType}}": client.idType,
    };
    this.rules = formAnswers.rules.map((r) => ({ re: new RegExp(r.pattern, "i"), answer: r.answer }));
    this.unique = (formAnswers.uniquePerForm || []).map((p) => new RegExp(p, "i"));
    this.datePicker = new NativeDatePicker();
    this.gallery = new GalleryPicker();
    this.log = log;
  }

  resolve(value) {
    return typeof value === "string" ? this.tokens[value] ?? value : value;
  }

  // First rule whose pattern matches the title AND whose answer fits the question kind.
  ruleFor(title, kind) {
    const keys = ANSWER_KEYS_BY_KIND[kind] || [];
    for (const { re, answer } of this.rules) {
      if (!re.test(title)) continue;
      const key = keys.find((k) => answer[k] !== undefined);
      if (key) return { key, value: this.resolve(answer[key]) };
    }
    return null;
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
      { timeout: MOBILE_TIMEOUTS.form, interval: 1000, timeoutMsg: `image not attached to ${qid}` },
    );
    this.note(qid, "file", title, "gallery image attached");
  }

  async answerBoolean(qid, title, force) {
    const rule = this.ruleFor(title, "boolean");
    const value = rule ? rule.value : this.defaults.bool;
    // option labels are the last matches; an answered question also shows its value as text
    await this.tap(MOBILE.booleanOption(qid, value));
    this.note(qid, "boolean", title, value + (force ? " (fix)" : ""));
  }

  async answerDate(qid, title, force) {
    const input = await this.first(MOBILE.questionInput(qid));
    const current = ((await input.getText()) || "").trim();
    const rule = this.ruleFor(title, "date");
    const date = resolveDateToken(rule ? rule.value : this.defaults.date, this.client);
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    // A prefilled date is kept only when no rule covers it; a rule always wins (e.g. the share-out date
    // must sit after the loan term, whatever was carried over from another form).
    if (current && !force && (!rule || current === iso)) return this.note(qid, "date", title, `kept "${current}"`);
    for (let attempt = 1; attempt <= 2; attempt++) {
      await this.hideKeyboard();
      await input.click();
      // the first tap can be swallowed (it only moves focus off another field)
      if (!(await this.first(MOBILE.datePickerYearHeader, 5000).then(() => true).catch(() => false))) await input.click();
      await this.datePicker.pick(date);
      // commit: move focus off the date input (its own title), then read the value back
      const t = await $$(MOBILE.questionTitle(qid));
      if (t.length) await t[0].click();
      const value = (await (await this.first(MOBILE.questionInput(qid))).getText()) || "";
      if (value.trim()) return this.note(qid, "date", title, `${date.toDateString()} (shows "${value}")`);
    }
    throw new Error(`date did not stick on ${qid} (${title})`);
  }

  async answerDropdown(qid, title, force, used) {
    const isUnique = this.unique.some((re) => re.test(title));
    used[title] = used[title] || new Set();
    if (await this.exists(MOBILE.questionChild(qid, '//android.widget.Button[@text="Clear"]'))) {
      const shown = await $$(MOBILE.dropdownShownValue(qid));
      const current = shown.length ? await shown[0].getText() : "";
      const duplicate = isUnique && current && used[title].has(current);
      if (!duplicate && !force) {
        if (current) used[title].add(current);
        return this.note(qid, "dropdown", title, `kept "${current}"`);
      }
      await this.tap(MOBILE.questionChild(qid, '//android.widget.Button[@text="Clear"]'));
    }
    const input = await this.scrollToResourceIdMatching(`^${qid}i_(0|undefined)$`);
    await this.hideKeyboard();
    // open the list (focus + Arrow Down); the first tap can be swallowed while focus leaves the previous field
    for (let attempt = 1; attempt <= 3; attempt++) {
      await input.click();
      await this.pressKey(20);
      if (await this.first(MOBILE.dropdownList(qid), 4000).then(() => true).catch(() => false)) break;
      if (attempt === 3) throw new Error(`dropdown list for ${qid} (${title}) did not open`);
    }
    const texts = [];
    for (const o of await $$(MOBILE.dropdownOptions(qid))) texts.push(await o.getText());
    const rule = this.ruleFor(title, "dropdown");
    const popup = await this.exists(MOBILE.dropdownPopupOkBtn);
    let want;
    if (rule && texts.includes(rule.value)) want = rule.value;
    else if (isUnique) want = texts.find((t) => !used[title].has(t)) || texts[0];
    else if (texts.length && texts.every((t) => /^\d+$/.test(t))) want = texts.includes(this.defaults.rating) ? this.defaults.rating : texts[texts.length - 1];
    else if (texts.includes(this.defaults.bool)) want = this.defaults.bool;
    // popup variant: Enter on the first option does not commit, so prefer the second option
    else want = popup && texts.length > 1 ? texts[1] : texts[0];
    if (popup) {
      // popup variant: tapping an option does not commit; navigate with the keyboard, Enter, then OK
      await this.pressKey(20, Math.max(1, texts.indexOf(want)));
      await this.pressKey(66);
      await this.tap(MOBILE.dropdownPopupOkBtn);
    } else {
      await this.tap(MOBILE.dropdownOption(qid, want));
    }
    await this.waitForGone(MOBILE.dropdownList(qid), MOBILE_TIMEOUTS.default).catch(() => {});
    used[title].add(want);
    this.note(qid, "dropdown", title, `${want} (options: ${texts.join(" | ")})`);
  }

  async answerInput(qid, title, force) {
    const input = (await $$(MOBILE.questionInputOfClass(qid, "android.widget.EditText")))[0];
    const current = (await input.getText()) || "";
    const rule = this.ruleFor(title, "input");
    if (current.trim() && !rule && !force) return this.note(qid, "text", title, `kept "${current}"`);
    const value = rule ? String(rule.value) : this.defaults.text;
    if (/^\d+$/.test(value)) {
      await this.typeDigits(input, value);
    } else {
      try {
        await input.setValue(value);
      } catch (e) {
        // an unmatched title on a numeric input: HTML number inputs reject text
        if (!/convert .* to float|SET_PROGRESS/i.test(e.message)) throw e;
        await this.typeDigits(input, this.defaults.number);
        await this.hideKeyboard();
        return this.note(qid, "number", title, `${this.defaults.number} (numeric default)`);
      }
    }
    await this.hideKeyboard();
    this.note(qid, rule && rule.key === "number" ? "number" : "text", title, value);
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

  async answer(qid, { force = false, used = {}, retried = false } = {}) {
    await this.scrollToResourceId(qid);
    if (await this.exists(MOBILE.questionIsContainer(qid))) return; // dynamic panel: children answered individually
    if (!(await this.exists(MOBILE.questionInputOrDropdown(qid)))) await this.scrollPage("down", 0.25);
    const title = await this.titleOf(qid);
    const child = (xp) => this.exists(MOBILE.questionChild(qid, xp));

    if ((await this.exists(MOBILE.locationBtn(qid))) || (await this.exists(MOBILE.locationInline(qid)))) {
      return this.answerLocation(qid, title);
    }
    if ((await child('//*[@text="Select File"]')) || (await child('//*[@content-desc="File preview"]')) || (await this.exists(MOBILE.fileNoFileChosen(qid)))) {
      return this.answerFile(qid, title);
    }
    if (await this.exists(MOBILE.questionInputOfClass(qid, "android.widget.Switch"))) return this.answerBoolean(qid, title, force);
    if (await this.exists(MOBILE.questionInputOfClass(qid, "android.widget.DatePicker"))) return this.answerDate(qid, title, force);
    if (await child('//android.widget.Button[@text="Select"]')) return this.answerDropdown(qid, title, force, used);
    if (await this.exists(MOBILE.questionInputOfClass(qid, "android.widget.EditText"))) return this.answerInput(qid, title, force);
    if (/signature/i.test(title)) return this.answerSignature(qid, title);
    if (!retried) {
      await this.scrollPage("down", 0.3);
      return this.answer(qid, { force, used, retried: true });
    }
    this.note(qid, "UNKNOWN", title, "not handled");
  }

  // ---------- fast path: classify every visible question from ONE page-source snapshot ----------

  // Returns [{ qid, title, kind }] in document order; kind is "unknown" when the question's controls
  // are not in the snapshot yet (below the fold) — those fall back to answer(), which scrolls first.
  async snapshotQuestions() {
    const xml = await driver.getPageSource();
    this.lastSource = xml; // lets scrollPage detect "moved" with one read instead of two
    const tree = parseUiXml(xml);
    const scrollable = [];
    walk(tree, (n) => {
      if (n.a.scrollable === "true") scrollable.push(n);
    });
    this.viewport = scrollable.length ? parseBounds(scrollable[0].a.bounds) : null;
    const byId = new Map();
    walk(tree, (n) => {
      const id = idOf(n);
      if (id && !byId.has(id)) byId.set(id, n);
    });
    const out = [];
    for (const [qid, node] of byId) {
      if (!/^sq_\d+$/.test(qid) || node.a.displayed === "false") continue;
      const inner = descendants(node);
      const titleNode = byId.get(`${qid}_ariaTitle`);
      const title = titleNode ? (titleNode.a.text || "").trim() : `(untitled ${qid})`;
      const input = byId.get(`${qid}i`);
      const cls = input ? input.cls.split(".").pop() : "";
      const has = (pred) => inner.some(pred);
      let kind = "unknown";
      if (has((n) => /^sp_/.test(idOf(n)) || (/^sq_\d+$/.test(idOf(n)) && idOf(n) !== qid))) kind = "container";
      else if ((node.a.text || "").includes("Get Current Location") || has((n) => (n.a.text || "").includes("Get Current Location"))) kind = "location";
      else if (has((n) => n.a.text === "Select File" || n.a["content-desc"] === "File preview") || (input && input.a.text === "No file chosen")) kind = "file";
      else if (cls === "Switch") kind = "boolean";
      else if (cls === "DatePicker") kind = "date";
      else if (has((n) => n.cls.endsWith("Button") && n.a.text === "Select")) kind = "dropdown";
      else if (cls === "EditText") kind = "input";
      else if (/signature/i.test(title)) kind = "signature";
      // on-screen position of the control (input if present, else the question) for the comfort check
      const anchor = input || node;
      out.push({ qid, title, kind, box: parseBounds(anchor.a.bounds) });
    }
    return out;
  }

  // True when the control sits in the comfortable middle band of the viewport (not under the bottom
  // tab bar, not clipped at the top), so it can be used without any scroll-into-view search.
  comfortablyVisible(box) {
    const v = this.viewport;
    if (!box || !v) return false;
    const h = v.y2 - v.y1;
    return box.y1 >= v.y1 + h * 0.08 && box.y1 + Math.min(box.y2 - box.y1, h * 0.3) <= v.y1 + h * 0.8;
  }

  async answerKnown({ qid, title, kind, box }, { used }) {
    if (kind === "container") return undefined;
    if (kind === "unknown") return this.answer(qid, { used });
    // only search/scroll when the snapshot says the control is not comfortably on screen
    if (!this.comfortablyVisible(box)) await this.scrollToResourceId(qid);
    // the title was above the fold in the snapshot: read it now that the question is in view
    if (title.startsWith("(untitled")) title = await this.titleOf(qid);
    if (kind === "location") return this.answerLocation(qid, title);
    if (kind === "file") return this.answerFile(qid, title);
    if (kind === "boolean") return this.answerBoolean(qid, title, false);
    if (kind === "date") return this.answerDate(qid, title, false);
    if (kind === "dropdown") return this.answerDropdown(qid, title, false, used);
    if (kind === "input") return this.answerInput(qid, title, false);
    return this.answerSignature(qid, title);
  }

  // ---------- page / form flow ----------

  async questionIdsOnScreen() {
    const xml = await driver.getPageSource();
    return [...new Set([...xml.matchAll(/resource-id="(sq_\d+)"/g)].map((m) => m[1]))].sort(
      (a, b) => Number(a.slice(3)) - Number(b.slice(3)),
    );
  }

  // One top-to-bottom pass: answer every question as soon as it appears in the visible tree.
  // Required questions a pass might miss are caught by the form's own validation and the fix pass.
  async fillCurrentPage(seen, used) {
    await this.scrollToTop();
    const LAYOUT_CHANGING = new Set(["file", "date", "dropdown", "signature", "unknown"]);
    for (let s = 0; s < 120; s++) {
      const snapshot = await this.snapshotQuestions();
      let rescan = false;
      for (const q of snapshot) {
        if (seen.has(q.qid)) continue;
        // controls not on screen yet: leave it for the next snapshot after scrolling
        if (q.kind === "unknown" && s < 119) continue;
        seen.add(q.qid);
        await this.answerKnown(q, { used });
        // positions below may have moved: take a fresh snapshot before using them
        if (LAYOUT_CHANGING.has(q.kind)) {
          rescan = true;
          break;
        }
      }
      if (rescan) continue;
      const hasPads = /class="android\.widget\.EditText"[^>]*text="Signature/.test(this.lastSource || "");
      if (!(await this.scrollPage("down", 0.6, { before: this.lastSource, noPads: !hasPads }))) {
        // end of page: anything still unclassified gets the slower scrolling path
        for (const q of await this.snapshotQuestions()) {
          if (seen.has(q.qid)) continue;
          seen.add(q.qid);
          await this.answer(q.qid, { used });
        }
        return;
      }
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

  // Press Next/Complete and wait for: form closed, page changed, or validation errors.
  async advance() {
    const before = (await this.questionIdsOnScreen()).join(",");
    let pressed;
    if (await this.exists(MOBILE.formNextBtn)) pressed = MOBILE.formNextBtn;
    else if (await this.exists(MOBILE.formCompleteBtn)) pressed = MOBILE.formCompleteBtn;
    else {
      const btn = await this.scrollToText("Complete", 60);
      if (!(await btn.isExisting())) return "no navigation button";
      pressed = MOBILE.formCompleteBtn;
    }
    await this.tap(pressed);
    let outcome = "no change";
    await driver
      .waitUntil(
        async () => {
          if (await this.formClosed()) return (outcome = "closed");
          if (await this.exists(MOBILE.formErrorTexts)) return (outcome = "errors");
          const now = (await this.questionIdsOnScreen()).join(",");
          if (now && now !== before) return (outcome = "page changed");
          return false;
        },
        { timeout: MOBILE_TIMEOUTS.default, interval: 1000 },
      )
      .catch(() => {});
    return outcome;
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
      const sc = await this.firstScrollable();
      const moved = await driver.execute("mobile: scrollGesture", { elementId: sc.elementId, direction: "down", percent: 0.9 });
      await this.hideKeyboard(); // a gesture can focus a field; never type into it
      if (!moved) break;
    }
    await this.tap(MOBILE.formCompleteBtn);
    let outcome = "no change";
    await driver
      .waitUntil(
        async () => {
          if (await this.formClosed()) return (outcome = "closed");
          if (await this.exists(MOBILE.formErrorTexts)) return (outcome = "errors (prefilled form not touched)");
          return false;
        },
        { timeout: MOBILE_TIMEOUTS.form, interval: 1000 },
      )
      .catch(() => {});
    return outcome;
  }
}

module.exports = { SurveyFormScreen };
