const { expect } = require('@playwright/test');
const { SELECTORS, TIMEOUTS } = require('../../common/constants');

class CriteriaSetsPage {
  constructor(page) {
    this.page = page;
    this.createCriteriaSetBtn = page.locator(SELECTORS.createCriteriaSetBtn);
  }

  async clickCreateCriteriaSet() {
    await this.createCriteriaSetBtn.waitFor({ state: 'visible', timeout: TIMEOUTS.default });
    await this.createCriteriaSetBtn.click();
    await this.page.waitForLoadState('domcontentloaded');
  }
}

module.exports = { CriteriaSetsPage };