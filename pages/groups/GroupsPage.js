const { expect } = require("@playwright/test");
const { SELECTORS, TIMEOUTS } = require("../../common/constants");
const { BasePage } = require("../BasePage");
const { sharedWord } = require("../../util/searchKeywords");
const { GroupDetailPage } = require("./GroupDetailPage");
const { LeadsPage } = require("../leads/LeadsPage");
const { LeadsSearchBar } = require("../leads/LeadsSearchBar");
const { PreLeadsPage } = require("../preLeads/PreLeadsPage");
const { PreLeadsSearchBar } = require("../preLeads/PreLeadsSearchBar");

class GroupsPage extends BasePage {
  constructor(page) {
    super(page);
    this.pageTitle = page.locator(SELECTORS.groupsPageTitle);
    this.groupListRow = page.locator(SELECTORS.deskListRow);
    this.loggedInUser = page.locator(SELECTORS.loggedInUser);
    this.recordCount = page.locator(SELECTORS.recordCount);
    this.searchInput = page.locator(SELECTORS.groupSearchInput);
    this.eligibilityScoreFilter = page.locator(
      SELECTORS.groupEligibilityScoreFilter,
    );
  }

  async open() {
    await this.goto("/desk/dl-dreamsave-group");
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/dl-dreamsave-group/, {
      timeout: TIMEOUTS.navigation,
    });
    await this.expectVisible(this.pageTitle);
  }

  async expectLoggedInUser(displayName) {
    await expect(this.loggedInUser).toContainText(displayName, {
      ignoreCase: true,
    });
  }

  async expectGroupListVisible() {
    await expect(this.groupListRow.first()).toBeVisible({
      timeout: TIMEOUTS.default,
    });
  }

  async expectDefaultPageSize(expectedCount) {
    // Wait for loading indicator to be hidden
    await this.page
      .locator(SELECTORS.deskLoadingIndicator)
      .waitFor({ state: "hidden", timeout: TIMEOUTS.default });

    // Assert count text
    await expect(this.recordCount).toContainText("20 of", {
      timeout: TIMEOUTS.default,
    });

    // Assert rendered row count
    const rows = await this.groupListRow.count();
    expect(rows).toBe(expectedCount);
  }

  // A group name to search for, read from the loaded list (no fixed record needed).
  async readFirstGroupName() {
    const firstName = this.groupListRow
      .first()
      .locator(SELECTORS.groupNameLink);
    await expect(
      firstName,
      "DreamSave Groups list is empty: nothing to search for",
    ).toBeVisible({ timeout: TIMEOUTS.default });
    return (await firstName.innerText()).trim();
  }

  // A word shared by at least two group names on the loaded page, for a search expected to match several.
  async readBroadKeyword() {
    const names = this.groupListRow.locator(SELECTORS.groupNameLink);
    await expect(
      names.first(),
      "DreamSave Groups list is empty: nothing to search for",
    ).toBeVisible({ timeout: TIMEOUTS.default });
    const keyword = sharedWord(await names.allInnerTexts());
    expect(
      keyword,
      "no word is shared by two group names on the first page",
    ).not.toBeNull();
    return keyword;
  }

  async clickFirstGroup() {
    const firstGroupLink = this.groupListRow
      .first()
      .locator(SELECTORS.groupNameLink);
    await firstGroupLink.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    const groupName = await firstGroupLink.innerText();
    await firstGroupLink.click();
    await this.page.waitForLoadState("domcontentloaded");
    return groupName.trim();
  }
  // A group to classify, chosen at run time: one of its products is still "Not Classified"
  // with a score in `rule.scores`, has no workflow started, and fails only criteria listed
  // in `rule.allowedFailedCriteria`; the group has no lead or pre lead yet.
  // Returns { groupName, productName }, or null if none.
  async findClassificationCandidate(rule, candidate) {
    const groupDetail = new GroupDetailPage(this.page);
    for (const score of rule.scores) {
      const scoreBadge = `${score}/${candidate.criteriaCount}`;
      await this.open();
      await this.filterByEligibilityScore(score, scoreBadge);
      const products = await this.readNotClassifiedProducts(
        scoreBadge,
        candidate.notClassifiedLabel,
      );
      for (const { groupName, productName } of products) {
        await this.openGroup(groupName);
        await groupDetail.openProductsTab();
        const { failedCriteria, hasWorkflow } =
          await groupDetail.readProductEligibility(
            productName,
            candidate.noWorkflowMessage,
          );
        const failsOnlyAllowed =
          failedCriteria.length === candidate.criteriaCount - score &&
          failedCriteria.every((name) =>
            rule.allowedFailedCriteria.includes(name),
          );
        if (
          !hasWorkflow &&
          failsOnlyAllowed &&
          (await this.hasNoLeadOrPreLead(groupName))
        ) {
          return { groupName, productName };
        }
      }
    }
    return null;
  }

  // The first of `groupNames` whose products all have a workflow already, so classifying it
  // has nothing left to classify. Returns null if none.
  async findGroupWithAllProductsInWorkflow(groupNames, noWorkflowMessage) {
    const groupDetail = new GroupDetailPage(this.page);
    for (const groupName of groupNames) {
      await this.openGroup(groupName);
      await groupDetail.openProductsTab();
      if (await groupDetail.allProductsHaveWorkflow(noWorkflowMessage)) {
        return groupName;
      }
    }
    return null;
  }

  // A pre lead blocks classification too ("workflow already in progress"), though the
  // group's Products tab does not count it as a workflow, so both lists are checked.
  async hasNoLeadOrPreLead(groupName) {
    await new LeadsPage(this.page).open();
    const leads = await new LeadsSearchBar(this.page).countBySavingGroup(
      groupName,
    );
    if (leads > 0) return false;
    await new PreLeadsPage(this.page).open();
    const preLeads = await new PreLeadsSearchBar(this.page).countBySavingGroup(
      groupName,
    );
    return preLeads === 0;
  }

  async filterByEligibilityScore(score, scoreBadge) {
    await this.eligibilityScoreFilter.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.eligibilityScoreFilter.fill(String(score));
    // settled once every listed row shows the score (an empty result has no rows)
    await expect(
      this.groupListRow.filter({ hasNotText: scoreBadge }),
    ).toHaveCount(0, { timeout: TIMEOUTS.default });
  }

  // Product lines on the loaded page with this score badge and status badge.
  async readNotClassifiedProducts(scoreBadge, statusLabel) {
    const found = [];
    for (const row of await this.groupListRow.all()) {
      const groupName = (
        await row.locator(SELECTORS.groupNameLink).innerText()
      ).trim();
      for (const line of await row.locator(SELECTORS.groupProductLine).all()) {
        const score = await line
          .locator(SELECTORS.groupProductScoreBadge)
          .innerText();
        const status = await line
          .locator(SELECTORS.groupProductStatusBadge)
          .innerText();
        if (score.trim() === scoreBadge && status.trim() === statusLabel) {
          // the product name is the line's leading text, before the badges
          const productName = await line.evaluate((el) =>
            el.firstChild.textContent.trim(),
          );
          found.push({ groupName, productName });
        }
      }
    }
    return found;
  }

  async openGroup(groupName) {
    await this.open();
    await this.searchInput.waitFor({
      state: "visible",
      timeout: TIMEOUTS.default,
    });
    await this.searchInput.fill(groupName);
    const groupLink = this.groupListRow
      .locator(SELECTORS.groupNameLink)
      .and(this.page.getByText(groupName, { exact: true }));
    await groupLink.waitFor({ state: "visible", timeout: TIMEOUTS.default });
    await groupLink.click();
    await this.page.waitForLoadState("domcontentloaded");
  }
}

module.exports = { GroupsPage };
