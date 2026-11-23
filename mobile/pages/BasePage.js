// Shared base for the Field Officer app screens (WebdriverIO + Appium UiAutomator2).
// Uses the WebdriverIO globals `driver` and `$$` provided by the test runner.
const { MOBILE, MOBILE_TIMEOUTS, KEYCODES } = require("../../common/mobileSelectors");

// The comfortable middle band of a scroll view, as shares of its height: below `bottom` an element sits
// under the bottom tab bar, above `top` it is clipped. Tall elements only need `maxShare` of the view visible.
const COMFORT_BAND = { top: 0.08, bottom: 0.8, maxShare: 0.3 };
// Smallest pad-free band (share of the scroll view's height) a swipe can run in without touching a pad.
const MIN_SWIPE_BAND = 0.07;
// A tap that lands while a dialog is still animating in is ignored; the second tap always worked.
const DIALOG_TAP_ATTEMPTS = 3;
// One nudge is normally enough to move an element out from under the tab bar; three covers tall ones.
const MAX_SETTLE_NUDGES = 3;
const SEARCH_SWIPES = 30; // UiScrollable swipes before giving up on finding an element
const MAX_SCROLLS_TO_TOP = 25;
const FIELD_CLEAR_KEYS = 16; // Delete presses that empty any value these forms hold

// The tallest stretch of [top, bottom] that no `blocked` [start, end] range covers, or null.
function widestFreeBand(top, bottom, blocked) {
  const bands = [];
  let cursor = top;
  for (const [start, end] of [...blocked].sort((a, b) => a[0] - b[0])) {
    if (start > cursor) bands.push([cursor, start]);
    cursor = Math.max(cursor, end);
  }
  if (cursor < bottom) bands.push([cursor, bottom]);
  return bands.sort((a, b) => b[1] - b[0] - (a[1] - a[0]))[0] || null;
}

class BasePage {
  // Existence by match count: WebdriverIO's `$` is strict and throws when a selector matches twice.
  async exists(selector) {
    return (await $$(selector)).length > 0;
  }

  // True when `condition` holds within `timeout`, false when it does not (never throws on timeout).
  async within(timeout, condition, interval = MOBILE_TIMEOUTS.poll) {
    return driver.waitUntil(condition, { timeout, interval }).then(
      () => true,
      () => false,
    );
  }

  async appearsWithin(selector, timeout) {
    return this.within(timeout, () => this.exists(selector));
  }

  async disappearsWithin(selector, timeout) {
    return this.within(timeout, async () => !(await this.exists(selector)));
  }

  // The first of `selectors` to appear within `timeout`, or null.
  async firstToAppear(selectors, timeout = MOBILE_TIMEOUTS.default) {
    let found = null;
    await this.within(timeout, async () => {
      for (const s of selectors) {
        if (await this.exists(s)) {
          found = s;
          return true;
        }
      }
      return false;
    });
    return found;
  }

  async first(selector, timeout = MOBILE_TIMEOUTS.default) {
    if (!(await this.appearsWithin(selector, timeout))) throw new Error(`not found: ${selector}`);
    return (await $$(selector))[0];
  }

  async tap(selector, timeout = MOBILE_TIMEOUTS.default) {
    const el = await this.first(selector, timeout);
    await el.click();
  }

  // Tap a dialog button and make sure the dialog actually closed (re-tap if the first tap was ignored).
  async tapUntilGone(buttonSelector, dialogMarker) {
    for (let i = 0; i < DIALOG_TAP_ATTEMPTS; i++) {
      if (await this.exists(buttonSelector)) await this.tap(buttonSelector);
      if (await this.disappearsWithin(dialogMarker, MOBILE_TIMEOUTS.short)) return;
    }
    throw new Error(`dialog did not close after tapping ${buttonSelector}`);
  }

  async waitForGone(selector, timeout = MOBILE_TIMEOUTS.default) {
    if (!(await this.disappearsWithin(selector, timeout))) throw new Error(`still present: ${selector}`);
  }

  async waitForAny(selectors, timeout = MOBILE_TIMEOUTS.default) {
    const found = await this.firstToAppear(selectors, timeout);
    if (!found) throw new Error(`none of: ${selectors.join(" | ")}`);
    return found;
  }

  async expectToast(text, timeout = MOBILE_TIMEOUTS.long) {
    await this.first(MOBILE.toastText(text), timeout);
  }

  // Element-based scroll into view (UiScrollable). No coordinates involved.
  scrollIntoViewSelector(uiSelector, maxSwipes = SEARCH_SWIPES) {
    return `android=new UiScrollable(new UiSelector().scrollable(true)).setMaxSearchSwipes(${maxSwipes}).scrollIntoView(${uiSelector})`;
  }

  // "below" | "above" | "inside" the comfortable middle band (COMFORT_BAND) of a scroll view.
  bandPosition(top, height, viewTop, viewHeight) {
    const visiblePart = Math.min(height, viewHeight * COMFORT_BAND.maxShare);
    if (top + visiblePart > viewTop + viewHeight * COMFORT_BAND.bottom) return "below";
    if (top < viewTop + viewHeight * COMFORT_BAND.top) return "above";
    return "inside";
  }

  // UiScrollable stops as soon as an element is barely on screen; at the bottom edge it sits under the
  // app's bottom tab bar, where taps land on the bar. Nudge it into the comfortable middle band.
  async settleIntoView(el, selector) {
    const sc = await this.firstScrollable();
    if (!sc) return el;
    for (let i = 0; i < MAX_SETTLE_NUDGES; i++) {
      const s = await driver.getElementRect(sc.elementId);
      const r = await driver.getElementRect(el.elementId);
      const position = this.bandPosition(r.y, r.height, s.y, s.height);
      if (position === "below") await this.scrollPage("down", 0.3);
      else if (position === "above") await this.scrollPage("up", 0.2);
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

  async scrollToText(text, maxSwipes = SEARCH_SWIPES) {
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
    return this.swipeClearOfPads(sc, pads, direction, percent);
  }

  // A signature pad is on screen: swipe inside the tallest band of the scroll view that no pad covers.
  async swipeClearOfPads(sc, pads, direction, percent) {
    const r = await driver.getElementRect(sc.elementId);
    const blocked = [];
    for (const p of pads) {
      const pr = await driver.getElementRect(p.elementId);
      blocked.push([Math.max(pr.y, r.y), Math.min(pr.y + pr.height, r.y + r.height)]);
    }
    const best = widestFreeBand(r.y, r.y + r.height, blocked);
    if (!best || best[1] - best[0] < r.height * MIN_SWIPE_BAND) return false;
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

  async scrollToTop() {
    for (let i = 0; i < MAX_SCROLLS_TO_TOP; i++) if (!(await this.scrollPage("up", 1.0))) break;
  }

  async hideKeyboard() {
    if (await driver.isKeyboardShown()) await driver.hideKeyboard();
  }

  async pressKey(code, times = 1) {
    for (let i = 0; i < times; i++) await driver.pressKeyCode(code);
  }

  // Digits as individual key events: bulk typing drops characters in WebView/PIN inputs, and
  // HTML number inputs reject setValue.
  async pressDigits(digits) {
    for (const ch of String(digits)) await this.pressKey(KEYCODES.digit0 + Number(ch));
  }

  async typeDigits(el, digits) {
    await el.click();
    await this.pressKey(KEYCODES.moveEnd);
    await this.pressKey(KEYCODES.del, FIELD_CLEAR_KEYS);
    await this.pressDigits(digits);
    await this.hideKeyboard();
  }
}

module.exports = { BasePage, widestFreeBand };
