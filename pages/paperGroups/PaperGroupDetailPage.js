const { expect } = require("@playwright/test");
const { SELECTORS, TIMEOUTS } = require("../../common/constants");
const { BasePage } = require("../BasePage");

class PaperGroupDetailPage extends BasePage {
  constructor(page) {
    super(page);
    this.villageInput = page.locator(SELECTORS.paperGroupVillageInput);
    this.villageField = page.locator(SELECTORS.paperGroupVillageField);
    this.villageValue = page.locator(SELECTORS.paperGroupVillageValue);
    this.saveBtn = page.locator(SELECTORS.paperGroupSaveBtn);
    this.deleteBtn = page.locator(SELECTORS.paperGroupDeleteBtn);
    this.deleteConfirmBtn = page.locator(SELECTORS.paperGroupDeleteConfirmBtn);
    this.unsavedIndicator = page
      .locator(SELECTORS.paperGroupUnsavedIndicator)
      .filter({ hasText: "Not Saved" });
    this.toasts = page.locator(SELECTORS.paperGroupToast);
    this.dreamLinkNumber = page.locator(SELECTORS.paperGroupDreamLinkNumber);
  }

  async fillVillage(village) {
    await this.villageInput.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.villageInput.fill(village);
    // Frappe registers the change on blur
    await this.villageInput.press("Tab");
  }

  async save() {
    await this.saveBtn.waitFor({ state: "visible", timeout: TIMEOUTS.default });
    await this.saveBtn.click();
  }

  async reload() {
    await this.page.reload();
    await this.page.waitForLoadState("domcontentloaded");
  }

  async deleteGroup() {
    await this.deleteBtn.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.deleteBtn.click();
    await this.deleteConfirmBtn.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.deleteConfirmBtn.click();
  }

  // Assertions
  async expectLoaded() {
    await expect(this.page).toHaveURL(/dl-non-dreamsave-group\//, {
      timeout: TIMEOUTS.navigation,
    });
    // the field, not its input: a locked (assessed) group shows Village as a read-only value
    await expect(this.villageField).toBeVisible({ timeout: TIMEOUTS.default });
  }

  // The DreamLink number is written by a background job after Start Assessment and can lag behind the
  // "Assessment sent" dialog. The open form does not refresh by itself, so reload until the number shows.
  async expectDreamLinkNumber(pattern, timeout = TIMEOUTS.backgroundJob) {
    const numberPattern = new RegExp(pattern);
    await expect
      .poll(
        async () => {
          await this.dreamLinkNumber.waitFor({
            state: "visible",
            timeout: TIMEOUTS.default,
          });
          const text = await this.dreamLinkNumber.innerText();
          if (!numberPattern.test(text)) await this.reload();
          return text;
        },
        { timeout, intervals: [TIMEOUTS.shortWait] },
      )
      .toMatch(numberPattern);
  }

  async expectLocked(lockedMessage) {
    await expect(this.page.getByText(lockedMessage)).toBeVisible({
      timeout: TIMEOUTS.default,
    });
  }

  async expectSaved() {
    await expect(this.unsavedIndicator).toBeHidden({
      timeout: TIMEOUTS.default,
    });
  }

  // The saved value, whether Village is still an input or shown read-only:
  // after a reload a freshly imported group can be locked again as a draft, and the lock
  // can arrive after the form first renders editable, so re-read whichever is showing.
  // Each read is bounded (shortWait): if the lock hides the input mid-read, that attempt gives up and
  // the next one reads the read-only value, instead of one read waiting out the whole poll.
  async expectVillage(village) {
    const read = { timeout: TIMEOUTS.shortWait };
    await expect
      .poll(
        async () => {
          if (await this.villageInput.isVisible()) {
            return this.villageInput.inputValue(read).catch(() => null);
          }
          if (await this.villageValue.isVisible()) {
            const shown = await this.villageValue
              .innerText(read)
              .catch(() => null);
            return shown === null ? null : shown.trim();
          }
          return null;
        },
        { message: "saved Village value", timeout: TIMEOUTS.default },
      )
      .toBe(village);
  }

  async expectDeletedToast(groupName, messageSuffix) {
    await expect(
      this.toasts.filter({ hasText: `${groupName} ${messageSuffix}` }).first(),
    ).toBeVisible({ timeout: TIMEOUTS.default });
  }
}

module.exports = { PaperGroupDetailPage };
