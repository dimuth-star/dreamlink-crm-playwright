const { expect } = require('@playwright/test');
const { SELECTORS, TIMEOUTS } = require('../../common/constants');

class GroupsPage {
  constructor(page) {
    this.page = page;
    this.pageTitle = page.locator(SELECTORS.groupsPageTitle);
    this.groupListRow = page.locator(SELECTORS.groupListRow);
    this.loggedInUser = page.locator(SELECTORS.loggedInUser);
    this.recordCount = page.locator(SELECTORS.recordCount);
  }

  async open() {
  await this.page.goto('/desk/dl-dreamsave-group');
  await this.page.waitForLoadState('domcontentloaded');
}

  async expectLoaded() {
    await expect(this.page).toHaveURL(/dl-dreamsave-group/, { timeout: TIMEOUTS.navigation });
    await expect(this.pageTitle).toBeVisible({ timeout: TIMEOUTS.default });
  }

  async expectLoggedInUser(displayName) {
    await expect(this.loggedInUser).toContainText(displayName, { ignoreCase: true });
  }

  async expectGroupListVisible() {
    await expect(this.groupListRow.first()).toBeVisible({ timeout: TIMEOUTS.default });
  }

    async expectDefaultPageSize(expectedCount) {
  // Wait for loading indicator to be hidden
  await this.page
    .locator('.freeze.flex.justify-center.align-center')
    .waitFor({ state: 'hidden', timeout: TIMEOUTS.default });

  // Assert count text
  await expect(this.recordCount).toContainText('20 of', { timeout: TIMEOUTS.default });

  // Assert rendered row count
  const rows = await this.groupListRow.count();
  expect(rows).toBe(expectedCount);
}

async clickFirstGroup() {
    const firstGroupLink = this.groupListRow
      .first()
      .locator(SELECTORS.groupNameLink);
    await firstGroupLink.waitFor({ state: 'visible', timeout: TIMEOUTS.default });
    const groupName = await firstGroupLink.innerText();
    await firstGroupLink.click();
    await this.page.waitForLoadState('domcontentloaded');
    return groupName.trim();
  }
}

module.exports = { GroupsPage };