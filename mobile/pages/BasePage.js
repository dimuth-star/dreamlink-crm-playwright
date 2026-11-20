// Shared base for the Field Officer app screens (WebdriverIO + Appium UiAutomator2).
// Uses the WebdriverIO globals `driver` and `$$` provided by the test runner.
const { MOBILE, MOBILE_TIMEOUTS, KEYCODES } = require("../../common/mobileSelectors");

class BasePage {
  // Existence by match count: WebdriverIO's `$` is strict and throws when a selector matches twice.
  async exists(selector) {
    return (await $$(selector)).length > 0;
  }

  async first(selector, timeout = MOBILE_TIMEOUTS.default) {
    await driver.waitUntil(async () => this.exists(selector), {
      timeout,
      interval: 500,
      timeoutMsg: `not found: ${selector}`,
    });
    return (await $$(selector))[0];
  }

  async tap(selector, timeout = MOBILE_TIMEOUTS.default) {
    const el = await this.first(selector, timeout);
    await el.click();
  }

  // Tap a dialog button and make sure the dialog actually closed. A tap that lands while the dialog
  // is still animating in is ignored by the app, so re-tap (bounded) until `dialogMarker` is gone.
  async tapUntilGone(buttonSelector, dialogMarker, attempts = 3) {
    for (let i = 1; i <= attempts; i++) {
      if (await this.exists(buttonSelector)) await this.tap(buttonSelector);
      const closed = await driver
        .waitUntil(async () => !(await this.exists(dialogMarker)), { timeout: 4000, interval: 400 })
        .then(() => true)
        .catch(() => false);
      if (closed) return;
    }
    throw new Error(`dialog did not close after tapping ${buttonSelector}`);
  }

  async waitForGone(selector, timeout = MOBILE_TIMEOUTS.default) {
    await driver.waitUntil(async () => !(await this.exists(selector)), {
      timeout,
      interval: 500,
      timeoutMsg: `still present: ${selector}`,
    });
  }

  async waitForAny(selectors, timeout = MOBILE_TIMEOUTS.default) {
    let found = null;
    await driver.waitUntil(
      async () => {
        for (const s of selectors) if (await this.exists(s)) return (found = s);
        return false;
      },
      { timeout, interval: 700, timeoutMsg: `none of: ${selectors.join(" | ")}` },
    );
    return found;
  }

  async expectToast(text, timeout = MOBILE_TIMEOUTS.long) {
    await this.first(MOBILE.toastText(text), timeout);
  }

  // Element-based scroll into view (UiScrollable). No coordinates involved.
  scrollIntoViewSelector(uiSelector, maxSwipes = 30) {
    return `android=new UiScrollable(new UiSelector().scrollable(true)).setMaxSearchSwipes(${maxSwipes}).scrollIntoView(${uiSelector})`;
  }

  // UiScrollable stops as soon as an element is barely on screen; at the bottom edge it sits under the
  // app's bottom tab bar, where taps land on the bar. Nudge it into the comfortable middle band.
  async settleIntoView(el, selector) {
    const sc = await this.firstScrollable();
    if (!sc) return el;
    for (let i = 0; i < 3; i++) {
      const s = await driver.getElementRect(sc.elementId);
      const r = await driver.getElementRect(el.elementId);
      if (r.y + Math.min(r.height, s.height * 0.3) > s.y + s.height * 0.8) await this.scrollPage("down", 0.3);
      else if (r.y < s.y + s.height * 0.08) await this.scrollPage("up", 0.2);
      else break;
      el = await $(selector);
    }
    return el;
  }

  async scrollToResourceId(id) {
    const selector = this.scrollIntoViewSelector(`new UiSelector().resourceId("${id}")`);
    const el = await $(selector);
    await el.waitForExist({ timeout: MOBILE_TIMEOUTS.default });
    return this.settleIntoView(el, `//*[@resource-id="${id}"]`);
  }

  async scrollToResourceIdMatching(regex) {
    const el = await $(this.scrollIntoViewSelector(`new UiSelector().resourceIdMatches("${regex}")`));
    await el.waitForDisplayed({ timeout: MOBILE_TIMEOUTS.default });
    return this.settleIntoView(el, `android=new UiSelector().resourceIdMatches("${regex}")`);
  }

  async scrollToText(text, maxSwipes = 30) {
    return $(this.scrollIntoViewSelector(`new UiSelector().text("${text}")`, maxSwipes));
  }

  async firstScrollable() {
    return (await $$(MOBILE.scrollable))[0];
  }

  // Scroll the current page. Starting a gesture on a signature pad draws on it instead of scrolling,
  // so when a pad is on screen the swipe runs inside the tallest band of the page clear of every pad.
  // Returns true only when the screen actually changed: on this app's WebView the scroll gesture
  // reports "can scroll more" even at the end of the page, so its return value cannot be trusted.
  // opts.before: a page source the caller already has; opts.noPads: caller knows no signature pad is on screen
  async scrollPage(direction = "down", percent = 0.5, opts = {}) {
    const sc = await this.firstScrollable();
    if (!sc) return false;
    const pads = opts.noPads ? [] : await $$(MOBILE.signaturePads);
    if (!pads.length) {
      const before = opts.before || (await driver.getPageSource());
      await driver.execute("mobile: scrollGesture", { elementId: sc.elementId, direction, percent });
      return (await driver.getPageSource()) !== before;
    }
    const r = await driver.getElementRect(sc.elementId);
    const blocked = [];
    for (const p of pads) {
      const pr = await driver.getElementRect(p.elementId);
      blocked.push([Math.max(pr.y, r.y), Math.min(pr.y + pr.height, r.y + r.height)]);
    }
    blocked.sort((a, b) => a[0] - b[0]);
    const bands = [];
    let cursor = r.y;
    for (const [s, e] of blocked) {
      if (s > cursor) bands.push([cursor, s]);
      cursor = Math.max(cursor, e);
    }
    if (cursor < r.y + r.height) bands.push([cursor, r.y + r.height]);
    const best = bands.sort((a, b) => b[1] - b[0] - (a[1] - a[0]))[0];
    if (!best || best[1] - best[0] < 120) return false;
    // intentional stabilization: a signature pad is on screen, so swipe inside the pad-free band.
    // Points are derived at runtime from the scroll container's and pads' own rects (no fixed coordinates).
    const before = await driver.getPageSource();
    const x = Math.round(r.x + r.width / 2);
    const span = Math.round((best[1] - best[0]) * 0.8 * Math.min(1, percent + 0.2));
    const mid = Math.round((best[0] + best[1]) / 2);
    const [y1, y2] = direction === "down" ? [mid + span / 2, mid - span / 2] : [mid - span / 2, mid + span / 2];
    await driver
      .action("pointer", { parameters: { pointerType: "touch" } })
      .move({ x, y: Math.round(y1) })
      .down()
      .move({ x, y: Math.round(y2), duration: 400 })
      .up()
      .perform();
    return (await driver.getPageSource()) !== before;
  }

  async scrollToTop(maxScrolls = 25) {
    for (let i = 0; i < maxScrolls; i++) if (!(await this.scrollPage("up", 1.0))) break;
  }

  async hideKeyboard() {
    if (await driver.isKeyboardShown()) await driver.hideKeyboard();
  }

  async pressKey(code, times = 1) {
    for (let i = 0; i < times; i++) await driver.pressKeyCode(code);
  }

  // Digits as individual key events: bulk typing drops characters in WebView/PIN inputs, and
  // HTML number inputs reject setValue.
  async typeDigits(el, digits, clear = true) {
    await el.click();
    if (clear) {
      await this.pressKey(KEYCODES.moveEnd);
      await this.pressKey(KEYCODES.del, 16);
    }
    for (const ch of String(digits)) await this.pressKey(KEYCODES.digit0 + Number(ch));
    await this.hideKeyboard();
  }

  async currentPackage() {
    return driver.getCurrentPackage();
  }
}

module.exports = { BasePage };
