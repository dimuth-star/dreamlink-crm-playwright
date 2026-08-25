# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: specs\groups.spec.js >> DreamLink CRM - DreamSave Groups >> TC-DS-05 | Invalid search displays no results message
- Location: tests\specs\groups.spec.js:50:3

# Error details

```
ReferenceError: groupsData is not defined
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5] [cursor=pointer]:
      - img [ref=e8]
      - generic [ref=e10]: DreamLink
      - button [ref=e11]:
        - img [ref=e12]
    - generic [ref=e15]:
      - generic "Lead" [ref=e16]:
        - generic [ref=e18] [cursor=pointer]:
          - img [ref=e20]
          - generic [ref=e21]: Lead
          - button [ref=e23]:
            - img [ref=e24]
        - generic [ref=e25]:
          - generic "Pre Leads" [ref=e26]:
            - link "Pre Leads" [ref=e28] [cursor=pointer]:
              - /url: /desk/dl-pre-lead
              - img [ref=e30]
              - generic [ref=e31]: Pre Leads
          - generic "Leads" [ref=e32]:
            - link "Leads" [ref=e34] [cursor=pointer]:
              - /url: /desk/dl-lead
              - img [ref=e36]
              - generic [ref=e37]: Leads
      - generic "Tasks" [ref=e38]:
        - link "Tasks" [ref=e40] [cursor=pointer]:
          - /url: /desk/dl-task
          - img [ref=e42]
          - generic [ref=e43]: Tasks
      - generic "Groups" [ref=e44]:
        - generic [ref=e46] [cursor=pointer]:
          - img [ref=e48]
          - generic [ref=e49]: Groups
          - button [ref=e51]:
            - img [ref=e52]
        - generic "DreamSave Groups" [ref=e54]:
          - link "DreamSave Groups" [ref=e56] [cursor=pointer]:
            - /url: /desk/dl-dreamsave-group
            - img [ref=e58]
            - generic [ref=e59]: DreamSave Groups
      - generic "Users" [ref=e60]:
        - link "Users" [ref=e62] [cursor=pointer]:
          - /url: /desk/dl-user
          - img [ref=e64]
          - generic [ref=e65]: Users
      - generic "Products" [ref=e66]:
        - generic [ref=e68] [cursor=pointer]:
          - img [ref=e70]
          - generic [ref=e71]: Products
          - button [ref=e73]:
            - img [ref=e74]
        - generic [ref=e75]:
          - generic "Manage Products" [ref=e76]:
            - link "Manage Products" [ref=e78] [cursor=pointer]:
              - /url: /desk/dl-product
              - img [ref=e80]
              - generic [ref=e81]: Manage Products
          - generic "Eligibility Criteria" [ref=e82]:
            - link "Eligibility Criteria" [ref=e84] [cursor=pointer]:
              - /url: /desk/eligibility-criteria
              - img [ref=e86]
              - generic [ref=e87]: Eligibility Criteria
          - generic "Geofences" [ref=e88]:
            - link "Geofences" [ref=e90] [cursor=pointer]:
              - /url: /desk/geofences
              - img [ref=e92]
              - generic [ref=e93]: Geofences
    - generic [ref=e94]:
      - paragraph
      - generic "User Menu" [ref=e96] [cursor=pointer]:
        - generic "SA Global" [ref=e98]:
          - generic "SA Global" [ref=e99]: SG
        - generic [ref=e100]:
          - generic [ref=e101]: SA Global
          - generic [ref=e102]: sa.global@dreamstartlabs.com
  - generic [ref=e104]:
    - banner
    - generic [ref=e106]:
      - generic [ref=e109]:
        - list [ref=e112]:
          - listitem [ref=e113]:
            - link [ref=e114] [cursor=pointer]:
              - /url: /desk
              - img [ref=e115]
          - listitem [ref=e116]:
            - link "/ DreamSave Groups" [ref=e117] [cursor=pointer]:
              - /url: /desk/dl-dreamsave-group
        - generic [ref=e121]:
          - button [ref=e123] [cursor=pointer]
          - button "Actions" [ref=e125] [cursor=pointer]:
            - generic [ref=e126]:
              - generic [ref=e128]: Actions
              - img [ref=e129]
      - generic [ref=e135]:
        - generic [ref=e137]:
          - generic [ref=e138]:
            - generic [ref=e139]:
              - textbox "Group Name" [active] [ref=e140]: xyzinvalidgroupname123
              - button [ref=e142] [cursor=pointer]:
                - img [ref=e143]
            - generic: group_name
          - generic [ref=e144]:
            - generic [ref=e145]:
              - textbox "Group Number" [ref=e146]
              - button [ref=e148] [cursor=pointer]:
                - img [ref=e149]
            - generic: group_number
          - generic [ref=e150]:
            - generic [ref=e151]:
              - textbox "Partner" [ref=e152]
              - button [ref=e154] [cursor=pointer]:
                - img [ref=e155]
            - generic: partner
        - generic [ref=e156]:
          - generic [ref=e158]:
            - img [ref=e160]
            - paragraph [ref=e162]: No DreamSave Groups found with matching filters. Clear filters to see all DreamSave Groups.
          - text: Per page
    - contentinfo
```

# Test source

```ts
  1  | const { expect } = require('@playwright/test');
  2  | const { SELECTORS, TIMEOUTS } = require('../../common/constants');
  3  | 
  4  | class GroupsSearchBar {
  5  |   constructor(page) {
  6  |     this.page = page;
  7  |     this.searchInput = page.locator(SELECTORS.groupSearchInput);
  8  |     this.loadingIndicator = page.locator(SELECTORS.deskLoadingIndicator);
  9  |     this.recordCount = page.locator(SELECTORS.recordCount);
  10 |     this.noResultsMessage = page.locator(SELECTORS.deskNoResultsMessage);
  11 |   }
  12 | 
  13 |   async searchByGroupName(keyword) {
  14 |     await this.searchInput.waitFor({ state: 'visible', timeout: TIMEOUTS.default });
  15 |     await this.searchInput.fill(keyword);
  16 |     await this.loadingIndicator.waitFor({ state: 'hidden', timeout: TIMEOUTS.default });
  17 |   }
  18 | 
  19 |   async expectResultCount(expectedCount) {
  20 |     await expect(this.recordCount).toContainText(expectedCount, { timeout: TIMEOUTS.default });
  21 |   }
  22 | 
  23 |   async expectGroupVisible(groupName) {
  24 |     const groupLink = this.page.locator(SELECTORS.groupNameLink, { hasText: groupName });
  25 |     await expect(groupLink).toBeVisible({ timeout: TIMEOUTS.default });
  26 |   }
  27 | 
  28 |   async expectMultipleResults() {
  29 |     const rows = this.page.locator(SELECTORS.deskListRow);
  30 |     const count = await rows.count();
  31 |     expect(count).toBeGreaterThan(1);
  32 |   }
  33 | 
  34 |   async expectNoResults() {
  35 |     await expect(this.noResultsMessage).toBeVisible({ timeout: TIMEOUTS.default });
> 36 |     await expect(this.noResultsMessage).toHaveText(groupsData.noResultsMessage);
     |                                                    ^ ReferenceError: groupsData is not defined
  37 |   }
  38 | }
  39 | 
  40 | module.exports = { GroupsSearchBar };
```