const { expect } = require('@playwright/test');
const { SELECTORS, TIMEOUTS } = require('../common/constants');
const { logInfo } = require('../util/loggers');

class BasePage {
  constructor(page) {
    this.page = page;
  }

  async goto(path = '/') {
    await this.page.goto(path);
    await this.closePopup();
  }

  async waitForPageReady() {
    await this.page.waitForLoadState('load');
  }

  /*async closePopup() {
    try {
      const closeBtn = this.page.locator('.popup-close, .close-btn,.next-dialog-close').first();
      
      if (await closeBtn.isVisible({ timeout: 5000 })) {
        await closeBtn.click();
        logInfo('Popup dismissed');
      } else {
        logInfo('No popup to dismiss');
      }
    } catch (error) {
      logInfo(`No popup to dismiss (${error.message})`);
    }
  }*/

    async closePopup() {
  try {
    const closeBtn = this.page
      .locator('.popup-close, .close-btn, .next-dialog-close')
      .first();

    // ✅ This actually WAITS up to 5 seconds
    await closeBtn.waitFor({ state: 'visible', timeout: 5000 });
    await closeBtn.click();
    logInfo('Popup dismissed');

  } catch (error) {
    // waitFor timed out = no popup appeared
    logInfo('No popup to dismiss');
  }
}

  async expectVisible(locator, options = {}) {
    await expect(locator).toBeVisible({ timeout: TIMEOUTS.default, ...options });
  }
}

module.exports = { BasePage, SELECTORS, TIMEOUTS };
