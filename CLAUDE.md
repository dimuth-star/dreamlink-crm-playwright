# CLAUDE.md

Guidance for Claude Code when working in this repository.

## 1. Project Overview & Tech Stack

End-to-end UI automation for **DreamLink CRM** (a Frappe/ERPNext-style "desk" app plus newer
React/Tailwind modules), running against the Zambia QA tenant.

| Aspect | Choice |
| --- | --- |
| Runner | `@playwright/test` ^1.44 |
| Language | Plain JavaScript (`.js`), **CommonJS** — `require()` / `module.exports`. No TypeScript, no ESM, no `import`. |
| Pattern | Page Object Model, one class per page/widget |
| Browser | Chromium only (single project), viewport 1920x1080 |
| Reporting | `allure-playwright` + `list` reporter; `allure-commandline` for the HTML report |
| Env handling | Hand-rolled `.env` loader in `util/helpers.js`, selected by `TEST_ENV` |
| Formatting | Prettier 3 (see the caveat in §6) |
| Auth | Keycloak SSO via UI login in every `beforeEach` (no `storageState` reuse) |

Config lives in `playwright.config.js`:

- `testDir: "./tests"`, `timeout: 60000`, `trace`/`video: retain-on-failure`, `screenshot: "on"`
- `retries: 1` locally, `2` on CI
- `fullyParallel: true` and `workers: undefined` locally — **but every npm script passes
  `--workers=1`**, because concurrent Keycloak logins invalidate each other. Always run through
  the npm scripts or pass `--workers=1` explicitly.

### Environments

`playwright.config.js` calls `loadEnvFile(process.env.TEST_ENV || "qa")`, which reads
`env/<name>.env` and copies the keys into `process.env`. `baseURL` then comes from
`process.env.BASE_URL`.

- `env/qa.env` — the default. `BASE_URL=https://zm-qa.dreamstartlabs.com`, plus `TEST_USERNAME`,
  `TEST_PASSWORD`, `TEST_DISPLAY_NAME` and the Field Officer keys (§4a), including `FO_DISPLAY_NAME`.
- `env/vfdev.env` — **VF Dev** (`BASE_URL=https://crm-zambia.dev.vfconnect.org`, SA `sa2.test@vfconnect.org`
  shown as "sa2 test", FO `fo.test@vfconnect.org` shown as "fo test", dev app `com.dreamlink.agent.dev`
  from `C:/crm_automation/apps/dreamlink-agent-dev.apk`, installed next to the QA app). Select it with
  `TEST_ENV=vfdev`; Playwright and WebdriverIO both honour it. Its CRM runs v0.2.0-alpha builds.
- `env/stag.env` — **placeholder only** (`BASE_URL=https://www.daraz.lk`). Do not target it
  until it points at a real staging tenant.
- `env/` is git-ignored, so these files exist locally only. Never commit credentials and never
  inline a username or password into a spec or JSON fixture.
- Credentials are read through `getCredentials()` from `util/helpers.js`, never from
  `data/users.json` (whose `valid` block is the literal string `"loaded_from_env"`).

### Keeping tests portable between environments

The same specs run on QA and VF Dev, whose data differs. Rules that keep it that way:

- **Anything tied to a user of the environment lives in the env file.** The Field Officer tasks are assigned
  to is the one who signs in to the app: `getFoAssignee()` returns `FO_USERNAME` (also the assignee search
  term) and `FO_DISPLAY_NAME` (the name CRM shows), and fails clearly if either is missing.
- **Fixtures hold only values that exist everywhere**, e.g. partner "World Vision". Where a value is the same
  thing spelt differently ("FAST Loan" on QA, "Fast Loan" on VF Dev), match it ignoring case
  (`BasePage.selectOptionByLabel(..., { ignoreCase: true })`) instead of keeping one value per environment.
- **Otherwise read it from the app** (see *Search tests never pin a record*): TC-PR-02 takes the first criteria
  set each Group Types row offers.
- **Native `<select>`: use `BasePage.selectOptionByLabel`**. It fails in `TIMEOUTS.default` listing the labels
  on offer; a bare `selectOption` with a missing label retries until the test timeout (15 min in the e2e config).
- **Open the record you are checking by its name**, never "the first row": a list can re-render unfiltered
  after the search (VF Dev returns to the Products list after a save).
- **Scope lead task checks to their stage.** A lead's tasks are grouped by workflow stage and a lead can have
  several (VF Dev: Loan Assessment + Client Assessment); `LeadDetailPage` scopes the FO task checks to the
  Client Assessment group by the stage pill's text (its colour differs per stage).

## 2. Directory & File Structure

```
common/constants.js        Every selector string + TIMEOUTS + DEFAULTS. Single source of truth.
data/*.json                Test data fixtures, one file per domain.
env/qa.env, env/vfdev.env, env/stag.env   Per-environment BASE_URL, credentials, FO app + user (git-ignored).
pages/BasePage.js          Shared base class: goto, waits, popup dismissal, autocomplete helper.
pages/<domain>/*.js        Page objects, grouped by domain folder.
tests/specs/*.spec.js      The actual specs — one file per domain.
data/uploads/*.xlsx        Static upload fixtures (invalid-file cases only; valid files are generated at runtime).
util/helpers.js            loadEnvFile(), getCredentials(); FO app: getFoApp(), getFoCredentials(), missingFoEnv().
util/paperGroupFile.js     exceljs helpers: build/write/read Paper Groups .xlsx files (exceljs is a devDependency).
util/loggers.js            logStep / logInfo / logError console wrappers.
util/runState.js           Hand-off file between the three steps of an FO flow (e2e-run/<flow>.json, git-ignored).
util/clientDataGenerator.js  Run-date-relative dates and +260 phone formatting for the FO forms.
util/formAnswerRules.js    Pure: which answer each FO form question gets (fixture rules). `npm run test:form-rules`.
util/searchKeywords.js     Pure: run-time search keywords (noMatchKeyword, sharedWord). `npm run test:search-keywords`.
util/surveyQuestions.js    Pure: classifies the FO app's SurveyJS questions from one page-source snapshot.
util/uiTree.js             Minimal parser for the UiAutomator2 page-source XML.
common/mobileSelectors.js  FO app selectors (MOBILE), UI copy they match on (MOBILE_TEXT), MOBILE_TIMEOUTS, KEYCODES.
mobile/                    WebdriverIO + Appium side of TC-FO: wdio.conf.js, pages/*Screen.js, pages/components/, specs/.
tests/e2e/*.e2e.js         CRM side of TC-FO (run by playwright.e2e.config.js only).
tests/unit/*.check.js      Plain-Node checks of pure util modules (no browser, no device).
playwright.config.js       Single Chromium project, Allure + list reporters.
allure-results/            Raw Allure output (git-ignored).
allure-report/             Generated Allure HTML (git-ignored).
playwright-report/         HTML reporter output (git-ignored; that reporter is not enabled).
```

**Specs live in `tests/specs/`, not in `playwright/`.** The `playwright/` directory holds only
`playwright/.auth/user.json`, which nothing currently reads (there is no `storageState` in the
config).

Domain folders under `pages/`: `eligibilityCriteria`, `forms`, `geofences`, `groups`, `leads`,
`preLeads`, `products`, `tasks`, `user` (login only), `users`. There is no `home/` folder.

Specs and their test-case ID prefixes — reuse the prefix when extending a module and continue
numbering from the highest existing ID:

| Spec | Prefix | Existing IDs |
| --- | --- | --- |
| `login.spec.js` | `TC-DL` | 01–06 |
| `groups.spec.js` | `TC-DS` | 01–14 |
| `users.spec.js` | `TC-US` | 01–04 |
| `userProfile.spec.js` | `TC-UP` | 01 |
| `eligibilityCriteria.spec.js` | `TC-EC` | 01–06 |
| `criteriaSets.spec.js` | `TC-ECS` | 01–05 |
| `products.spec.js` | `TC-PR` | 01–05 |
| `geofence.spec.js` | `TC-GF` | 01–12 |
| `classification.spec.js` | `TC-CL` | 01–03 |
| `leads.spec.js` | `TC-LD` | 01–03 |
| `preLeads.spec.js` | `TC-PL` | 01–04 |
| `tasks.spec.js` | `TC-TK` | 01–03 |
| `forms.spec.js` | `TC-FM` | 01–05 |
| `paperGroups.spec.js` | `TC-PG` | 01–19 |
| `tests/e2e/foEndToEnd.e2e.js` + `mobile/specs/foTaskCompletion.e2e.js` | `TC-FO` | 01, 02.1–02.6 (one per task), 03 (see §4a) |
| `tests/e2e/foUnableToContinue.e2e.js` + `mobile/specs/foUnableToContinue.e2e.js` | `TC-FO` | 04–09 (see §4b) |

Known app routes (used by `open()` methods): `/`, `/desk/dl-dreamsave-group`, `/desk/dl-user`,
`/desk/dl-product`, `/desk/dl-lead`, `/desk/dl-pre-lead`, `/desk/dl-task`,
`/desk/eligibility-criteria`, `/desk/geofences`, `/forms`.

## 3. Coding & Page Object Model Conventions

### File and name conventions

- Page object files: `PascalCase.js`, matching the exported class (`LeadsPage.js` → `LeadsPage`).
- Suffixes by role: `...Page` (full page), `...DetailPage` (record view), `Add...Page` /
  `...CreatePage` (create form), `...SearchBar` (list filter widget).
- Export shape: `module.exports = { ClassName };` — always a named object, never a default.
- Specs: `camelCase.spec.js`, named after the domain.
- Methods: `camelCase`. Actions are verbs (`open`, `clickFirstLead`, `searchByLeadNumber`,
  `fillSurveyTitle`). **Every assertion method is prefixed `expect`** (`expectLoaded`,
  `expectLeadListNotEmpty`, `expectNoResults`).

### Class skeleton

```js
const { expect } = require("@playwright/test");
const { SELECTORS, TIMEOUTS } = require("../../common/constants");
const { BasePage } = require("../BasePage");

class LeadsPage extends BasePage {
  constructor(page) {
    super(page);
    // Locators are built once in the constructor, never inside methods.
    this.pageTitle = page.locator(SELECTORS.leadsPageTitle);
    this.leadListRow = page.locator(SELECTORS.deskListRow);
    this.loadingIndicator = page.locator(SELECTORS.deskLoadingIndicator);
  }

  async open() {
    await this.goto("/desk/dl-lead"); // BasePage.goto also waits for domcontentloaded
  }

  // --- actions ---
  async clickFirstLead() {
    /* ... */
  }

  // --- assertions ---
  async expectLoaded() {
    await expect(this.page).toHaveURL(/dl-lead/, { timeout: TIMEOUTS.navigation });
    await expect(this.pageTitle).toBeVisible({ timeout: TIMEOUTS.default });
  }
}

module.exports = { LeadsPage };
```

### `BasePage.js`

Provides `goto(path)`, `waitForPageReady()`, `closePopup()`, `expectVisible(locator, options)`
and `searchByAutocomplete(inputLocator, fullName)` (types the last word of the name, waits for
`ul[role="listbox"]`, picks the `[role="option"]` matching the full text, then asserts the input
value). It re-exports `SELECTORS` and `TIMEOUTS`.

Only about half the existing classes extend `BasePage`; the rest set `this.page = page`
directly. **New page objects should extend `BasePage`.** Do not retrofit existing ones as a side
effect of unrelated work.

### Locator conventions

- All selector strings live in `common/constants.js` under `SELECTORS`, grouped by a `//`
  comment per screen. Nothing else in `pages/` or `tests/` holds a raw selector string — the two
  exception is `ProductsPage` (`'[id="page-List/DL Product/List"]'`).
- Prefer stable attribute CSS: `[data-fieldname="..."]`, `[data-doctype="..."]`,
  `[data-slot="..."]`, `[data-label="..."]`, `[aria-label="..."]`, `#id`.
- Desk list pages share generic selectors — reuse them instead of adding duplicates:
  `deskListRow`, `deskLoadingIndicator`, `deskNoResultsMessage`, `recordCount`,
  `autocompleteListbox`, `autocompleteDropdownOption`.
- Role and text locators (`getByRole`, `getByText`) are used where the DOM has no stable hook;
  the *name* string is still stored in `SELECTORS` (e.g. `criterionNameInput: "Criterion name *"`).
- A handful of XPath strings exist in the Products and Geofence sections. Treat XPath as legacy —
  write CSS for anything new.
- `.nth(n)` / `.first()` indexing appears in the Geofence pages (e.g.
  `geofenceAssignUserCancelBtn` resolved with `.nth(3)`) because several controls share
  `[data-slot="button"]`. This is brittle; prefer a distinguishing `aria-label` where one exists.

### Wait strategy — strict rules

- `await locator.waitFor({ state: "visible", timeout: TIMEOUTS.default })` before interacting.
- `await this.page.waitForLoadState("domcontentloaded")` after a navigation, or after a click
  that navigates.
- After filtering a desk list:
  `await this.loadingIndicator.waitFor({ state: "hidden", timeout: TIMEOUTS.default })`.
- Every `expect` and `waitFor` passes an explicit timeout from `TIMEOUTS` — `TIMEOUTS.default`
  (20 s) for elements, `TIMEOUTS.navigation` (30 s) for URL assertions.
- **There is not a single `waitForTimeout` or `setTimeout` in the suite. Keep it that way.**
- **No raw mouse coordinates, `page.mouse.*`, `boundingBox()` or `position:` clicks anywhere.
  Keep it that way** — including for the Google Maps geofence drawing flow, which is why
  `TC-GF-07` stops at clicking the draw button rather than tracing a polygon.

### Spec conventions

Specs orchestrate and nothing more:

```js
const { test } = require("@playwright/test"); // add `expect` only if used directly
const { LoginPage } = require("../../pages/user/LoginPage");
const { TasksPage } = require("../../pages/tasks/TasksPage");
const { getCredentials } = require("../../util/helpers");
const tasksData = require("../../data/tasks.json");

test.describe("DreamLink CRM - Tasks", () => {
  let loginPage;
  let tasksPage;
  const userData = getCredentials();

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    tasksPage = new TasksPage(page);
    await loginPage.open();
    await loginPage.login(userData.username, userData.password);
    await tasksPage.open();
    await tasksPage.expectLoaded();
  });

  test("TC-TK-03 | Search by task number returns exactly 1 result containing the searched keyword", async ({
    page,
  }) => {
    const { keyword, expectedCount } = tasksData.taskNumberSearch;
    await tasksSearchBar.searchByTaskNumber(keyword);
    await tasksSearchBar.expectResultCount(expectedCount);
    await tasksSearchBar.expectTaskVisible(keyword);
  });
});
```

- `test.describe` title: `"DreamLink CRM - <Module>"`.
- Test title: `"TC-XX-NN | <behaviour and expected outcome>"` — the `|` separator is required.
- Page objects are declared with `let` at describe scope and instantiated in `beforeEach`. A page
  object used by only one test may be constructed inside that test instead (see `forms.spec.js`).
- `beforeEach` does: construct → `loginPage.open()` → `login()` → `<module>Page.open()` →
  `expectLoaded()`.
- A spec body is a flat list of `await pageObject.someAction()` / `await
  pageObject.expectSomething()` calls. Raw `expect()` in a spec is rare and reserved for trivial
  visibility checks (`login.spec.js`). Put new assertion logic in an `expect*` method.
- No `page.locator(...)` in a spec, ever.
- Tests that create data pass `{ retries: 0 }` as the second argument, so a retry cannot create a
  duplicate record: `test("TC-FM-05 | ...", { retries: 0 }, async ({ page }) => { ... })`.
- Multi-step flows get short `//` comments marking the phases (see `classification.spec.js`).
- Manual pre-conditions are documented as a `// PRE-CONDITION: ...` comment immediately above
  the test. A test that needs a record in a given state finds it at run time and calls
  `test.skip(!found, "<why>")` when QA has none (see `TC-CL-02/03`).

### Mobile (Field Officer app) conventions

The same rules apply to `mobile/`, translated to WebdriverIO:

- Screen objects are `mobile/pages/<Name>Screen.js` (`...Screen`, not `...Page`); reusable widgets
  (`NativeDatePicker`, `GalleryPicker`) live in `mobile/pages/components/`. All extend the mobile
  `BasePage` (`mobile/pages/BasePage.js`, unrelated to the web one) and use the `driver` / `$$`
  globals; constructors take an options object, not a `page`.
- Selectors live only in `common/mobileSelectors.js` (`MOBILE`); parameterised selectors are small
  functions (`MOBILE.taskCard(title, group)`). App UI text that selectors or the snapshot classifier
  match on goes in `MOBILE_TEXT`; expected messages (toasts) stay in `data/foEndToEnd.json`.
- Timeouts and poll intervals come from `MOBILE_TIMEOUTS`, key codes from `KEYCODES`. No
  `browser.pause()` / sleeps; the only pointer-coordinate actions are the two marked
  `// intentional stabilization:` (signature stroke, pad-free swipe), both derived from element rects.
- Assertions are `expect*` methods on the screen objects (WebdriverIO's global `expect`); the spec
  has no `$`, `driver` or selector calls. Env access goes through `util/helpers.js`.
- Decision logic that needs no device (answer rules, question classification) belongs in a pure
  `util/` module with a `tests/unit/*.check.js`, not in a screen object.

## 4. Test Data & Constants Conventions

### `common/constants.js`

Exports three objects:

- `SELECTORS` — flat map of `camelCase` key → selector string, grouped by `//` screen comments.
  Append new entries to the matching group, or add a new group at the end.
- `TIMEOUTS` — `default` 20 s (elements), `navigation` 30 s (URLs), `shortWait` 5 s (bounded
  probes / poll interval), `backgroundJob` 120 s (server jobs that finish after the UI confirms:
  DreamLink number, draft flag, queued imports), `sync` 600 s (mobile ↔ CRM). Use these; do not
  invent new numeric literals.
- `DEFAULTS` — `{ pageSize: 20 }`.

### `data/*.json`

One file per domain, consumed with a top-level `require("../../data/<file>.json")`. Current
files: `addCriterion.json`, `addProduct.json`, `criteria.json`, `criteriaSet.json`, `forms.json`,
`geofenceData.json`, `groups.json`, `leads.json`, `preLeads.json`, `tasks.json`, `users.json`.
(The actual filename is `geofenceData.json`, not `geofencedData.json`.)

Each file is an object of named **scenario blocks**, destructured in the spec:

```json
{
  "validSearch": { "expectedCount": 1 },
  "invalidSearch": { "keywordPrefix": "zz-no-match-" },
  "noResultsMessage": "No Leads found with matching filters. Clear filters to see all Leads."
}
```

Recurring block names: `validSearch`, `invalidSearch`, `noResultsMessage`, and `new<Entity>` /
`<groupType><Entity>` for create flows (`dreamSaveCriterion`, `nonDreamSaveSet`). Pick a descriptive
name when a module needs more (`activeWorkflowSearch`, `fullyEligibleSearch`, `dataCorrectionSearch`).

Counts are **numbers** asserted with `toHaveCount` against a row locator (`deskListRow` on desk
lists). The old `"1 of 1"` label is gone in the new build; `SELECTORS.recordCount` now points at the
list pager (`"1–20 of 148"`) and is only used for the page-size check.

Expected UI copy (no-results messages, toast text, dialog titles) belongs in the JSON fixture, not
in the page object.

### Search tests never pin a record (data-independent search)

QA data is cleared and the app redeployed regularly, so search fixtures hold **no record values**:

- **Create flows search what they created**: the create test searches its own `Date.now()`-unique
  name (TC-EC-05/06, TC-ECS-01/05, TC-PR-02, TC-FM-05).
- **Search-only tests read the keyword from the loaded list** with a `readFirst…()` / `readLast…()`
  method on the list page object (e.g. `LeadsPage.readFirstLeadNumber()`), which fails with
  "<Module> list is empty: nothing to search for" if there is nothing to read. Unique keys (lead,
  pre lead and task number, user email) expect **exactly 1 row**; names (which may repeat) expect
  the record listed and **every row containing the keyword** (`expectAllResultsContain`).
- **Broad-keyword searches** (TC-DS-04, TC-GF-12) use `readBroadKeyword()`: a word shared by at
  least two listed names (`sharedWord` in `util/searchKeywords.js`).
- **No-results searches** use `noMatchKeyword(prefix)` (prefix + `Date.now()`), which can never
  match. Only the prefix is in the fixture.
- Put the "every row contains" check **before** "record is listed": the discovered record is on
  screen before the filter applies, so only the first check proves the search ran.
- **Every list filter** (TC-DS-06..14, TC-PG-09..19) follows the same pattern: the value is read from
  a loaded row (`readFirst…()`), and the check is "no listed row lacks it" on that column
  (`expectEveryRowHas` in `GroupsSearchBar` / `PaperGroupsSearchBar`). No-match tests loop over the
  text filters named in the fixture (`invalidSearch.textFilters`), reopening the list each time.
  DreamSave **Region** is tested only negatively: the list has no Region column and QA groups have
  no region. Paper Groups filters live in `PaperGroupsSearchBar`; `PaperGroupsPage.searchByGroupName`
  stays the one the lifecycle tests and TC-FO-01 use.

Tests that need a record **in a given state** pick it at run time too:

- **TC-GF-11** filters the list to Branches (products can only be assigned to a Branch; users to any
  type) and opens the first with at least one assigned user and one assigned product.
- **TC-CL-01** takes the saving groups of Active DreamSave leads (Leads list URL filter) and uses the
  first whose products all have a workflow; classifying it reports "No Groups Classified".
- **TC-CL-02 / TC-CL-03** look for a product still *Not Classified* (groups list Eligibility Score
  filter + the "Products and Eligibility" badges): 7/7 for Fully Eligible; 5/7 or 6/7 failing only
  Backup Status / Members with Images for Data Correction. The product card (group → Products tab)
  must say "No workflows have started", and the group must have no lead **and no pre lead** (a pre
  lead blocks classification with "workflow already in progress" but the Products tab does not count
  it). When QA has no such group the test is **skipped** with a reason; each run that classifies uses
  up one group.
- **Classification is asynchronous** in the new build: the summary says "Classification triggered for
  N group across N product" and the list's product badge changes later, so the result is asserted on
  that product's line with `TIMEOUTS.backgroundJob` (`ClassificationPage.expectProductStatus`).

### Paper Groups (`TC-PG`) — module-specific gotchas

Sidebar label "Paper Groups" is the `DL Non DreamSave Group` doctype at `/desk/dl-non-dreamsave-group`.

- **Import is a multi-step flow:** Upload dialog (partner select + `.xlsx`) → banner "Processing… completed" →
  *Review import summary* modal **opens by itself** (do not click the banner button) → *Proceed with Import* →
  toast → banner "Syncing x of N groups" → banner disappears. **Wait for the banner to disappear before
  leaving the page.** Aborting mid-sync (e.g. a failing test) can leave a batch partially imported.
- **A pending import disables "Upload groups"** ("An import is already in progress"). Rejected files
  (wrong columns, no rows) do not; files that validate with row errors do, until *Cancel Import* is clicked.
- **Two toasts appear together:** a short "Batch processed successfully" and the detail one. Match by text
  with `.filter({ hasText })`, never `.first()` on the generic toast locator.
- **Deleting is asynchronous.** The record stays listed, locked ("queued for deletion", no Delete button) for a
  moment. After a delete, use `expectGroupRemoved()` (reload + search until gone) before acting on the list.
- **Stale "no results" message:** after a search that returned nothing, the message stays on screen when you
  type a new keyword. Reload the list (`open()`) before a search whose settle check could be fooled by it.
- **Back on the list via the SPA redirect** (after delete), `a.title-text` has no `title` attribute and
  `input[data-fieldname="group_name"]` matches two elements (list filter + form field). Use
  `a.title-text:visible` and scope inputs with `.standard-filter-section`.
- **Edit:** blur the field (`Tab`) then click Save. There is no success toast; assert the "Not Saved" pill
  clears and reload to verify the value persisted.
- **Cleanup pattern:** lifecycle tests (`TC-PG-03..05`) run in `test.describe.serial` with a `Date.now()`-unique
  name prefix and an `afterAll` that opens a fresh context and deletes any group still matching the prefix.
- Upload files are written to `testInfo.outputPath(...)` with 3 rows (enough to prove a multi-row import, and
  fast to sync). Partner is `World Vision` (see `data/paperGroups.json`; it exists on QA and VF Dev).
- **Review import dialog does not always open by itself.** Wait for the banner's "Review import" button
  (processing done), give the dialog a short bounded window, then click the button if it did not appear
  (`PaperGroupImportReviewModal.expectOpen`). Otherwise the import is left pending and blocks later uploads.
  On a busy tenant the import can sit "queued — processing will start shortly" for over 30 s, so that wait
  uses `TIMEOUTS.backgroundJob`. If a run dies there, the import is left pending: open Paper Groups, click
  *Review import*, check the summary and *Proceed* (or *Cancel Import*) before the next run.
- **Assessment flow (`TC-PG-06..08`):** a group is "Verification Ready" when its cycle number is 3 (cycle 1 =
  "Future Ready"). Select the row → Actions → Start Assessment → choose a Product → Confirm. The result is a
  **dialog** ("Start Assessment Initiated"), not a toast. A Lead is created for the group with **6 tasks** (all
  Unassigned) and the group is locked.
- **QA backend lag around assessment:** for a few seconds after an import the new group is still flagged as a
  draft, and Start Assessment answers "Invalid Selection — Draft groups cannot be selected"
  (`PaperGroupsPage.startAssessmentWhenReady` reloads and retries; used by TC-FO-01, TC-PG-06 still calls
  `selectFirstGroup` + `startAssessment`). The DreamLink number (`DLK-ZM-n-n`) is written by a background job
  and can take longer than 20 s; `PaperGroupDetailPage.expectDreamLinkNumber` reloads and polls for it.
- **Assessed groups cannot be deleted or edited**, nor can their lead or tasks (no Delete button anywhere; the Lead
  only offers "Reject Workflow"). `TC-PG-06..08` therefore use their **own** `QA ASM <timestamp>-1` group, never the
  `TC-PG-03..05` ones, and leave it on QA by design. Do not run Reject Workflow without being asked.
- **Assign Tasks (lead detail):** the Assign To field is a Link autocomplete. Select with the **keyboard**
  (ArrowDown + Enter) and **wait for the `validate_link_and_fetch` response before clicking Assign**; clicking
  early returns "No task in this stage can be moved to <user>" even for an eligible user. Then confirm in the
  follow-up "Assign the following task(s)…" dialog. Result toast: "Tasks successfully assigned to <FO_DISPLAY_NAME>.".
  The assignee is the env file's Field Officer (`getFoAssignee()`), never a name in a fixture.
- **`LeadsPage.expectLoaded()` can fail after navigating from another desk page** (the title link has no `title`
  attribute); the paper-group tests skip it and rely on the search box instead. Do not "fix" `LeadsPage` unasked.
- The lead task grid's `div.grid-row` includes the header row; count `span.dl-task-status-pill` instead.
- Phone numbers must be Zambian: `+260` or `0` followed by nine digits. Duplicate names inside one file import
  with a warning; rows missing required columns are skipped.

## 4a. Field Officer end-to-end (`TC-FO`, Web CRM → Android app → Web CRM)

Run with `npm run test:e2e:fo` (three steps chained with `&&`):

1. **TC-FO-01** (`@fo-setup`, Playwright, `playwright.e2e.config.js`): uploads `E2E FO <ts>-1` (10 members, cycle 3),
   assesses it, checks DreamLink number + lead + 6 tasks, assigns them to the env's Field Officer (`FO_USERNAME`),
   writes `e2e-run/runState.json`.
2. **TC-FO-02.1–02.6** (WebdriverIO + Appium, `mobile/wdio.conf.js`), one test per task: on the device, waits for the 6
   tasks to sync, then per task (fixture order, **Complete Insurance Registration always last**): schedule today → in
   progress → forms → complete → Completed status checked on the detail screen.
3. **TC-FO-03** (`@fo-verify`): polls the lead until the 6 task titles show Completed for the Field Officer.

- E2E files are named `*.e2e.js` so the main config (`*.spec.js`) never runs them; `playwright.config.js` is untouched.
- Each run leaves one locked group + lead + tasks on QA (assessed groups cannot be deleted). A run that dies before
  the assessment leaves an unlocked, deletable group instead.
- **Prerequisites:** Android device connected, QA app `com.dreamlink.agent.qa` installed (signed in or not: the run
  logs in if needed), **Chrome as the default browser** (see *Login* below), Appium 3 with UiAutomator2. `env/<TEST_ENV>.env` needs `ANDROID_UDID`, `FO_APP_PACKAGE`, `FO_APP_ACTIVITY`, `FO_USERNAME`,
  `FO_PASSWORD`, `FO_PIN` (`onPrepare` fails fast listing any that are missing), plus `FO_DISPLAY_NAME` for the CRM steps. `FO_APP_PATH` is in the env file but
  nothing reads it: the app is not installed by the run. An Appium server already on port 4723 is reused; otherwise
  the wdio appium service starts one.
- Mobile code: `mobile/pages/*Screen.js` (see §3 *Mobile conventions*), selectors in `common/mobileSelectors.js`,
  data + form answer rules in `data/foEndToEnd.json`. Which answer a question gets is decided by the pure
  `util/formAnswerRules.js` (check: `npm run test:form-rules`); which kind of question it is, by
  `util/surveyQuestions.js` (one classifier, one page-source read per screen). Form answers are rules matched on the
  question title **and** type; a rule overrides a prefilled value, prefilled values are kept only when no rule covers
  them. `{{members}}` / `{{mobileIntl}}` come from the `upload` block, so they always match the uploaded group.
  Person data is generated per question: names (First Name, Surname, Next of Kin Name, Facilitator) from
  `client.names`; NRC (`######/##/1`), TPIN (10 digits) and mobile (`+260` + a prefix from `client.mobilePrefixes` + 7 digits; 96/97/77, the ones every environment's form
  validator accepts: VF Dev only takes 97/77/96/67) are random and
  **unique within a run**; Date of Birth gives a random age in `client.dobAgeYears` (25–55). The group's own data
  stays fixed so it matches CRM: the main contact's phone (`{{mobileIntl}}`, never handed to a person) and the
  district (`{{district}}`). Group opening date = 2 months before the run date. Addresses use
  "Plot 12, Cairo Road"; any other unmatched free text gets `defaults.text` ("QA Test").
- **Form checks:** every dropdown choice is read back and a mismatch fails the task (list dropdowns hold the value on
  their `sq_Ni_0` input, rating/popup ones in a TextView). Popup dropdowns cannot select their first option by keyboard;
  a rule asking for it fails clearly. The loan-term number (`sq_68`) needs the validation fix pass in every run; that is
  expected. An unrecognised question type is logged at `[ERROR]` level and left to the form's own validation.
- **App/automation gotchas:** WebdriverIO `$` is strict (two matches throw) — use `BasePage.exists()` (match count).
  The scroll gesture reports "moved" even at the end of a WebView page — detect the end by "screen unchanged". Elements
  scrolled to the bottom edge sit under the bottom tab bar (`settleIntoView` nudges them up). Bottom-tab labels start with
  an invisible icon glyph (match with `contains`). Some dropdowns are popups that only commit via keyboard + OK. Dates must
  be committed by moving focus off the input. Signature pads draw on any gesture that starts on them (the only two
  pointer-coordinate actions are marked `// intentional stabilization:`). Mobile forms require phones as `+260…`.
- **Login (logged out):** `ensureLoggedIn` first brings the app to the front (`activateApp`: a new session does not
  do that for an app left in the background), then handles whatever screen it finds. Keycloak opens in the default
  browser's custom tab. **The phone's default browser must be Chrome**: Chrome exposes the form fields (`username`,
  `password`), so the test taps the password field, types, and submits with Enter. Never hide the keyboard there:
  Android may do it with Back, which closes the tab. Samsung Internet hides the page content from automation, which
  forces blind Tab typing that put the password in the wrong field. On Samsung phones Chrome can be disabled out of
  the box: Settings → Apps → Chrome → Enable, then Default apps → Browser app → Chrome. A Keycloak tab left on top
  of the app by an interrupted login is closed with Back at start-up. The run signs in **at most once**: if the app
  asks to log in again, it stops instead of retrying, so wrong credentials cannot lock the FO account.
- Completing tasks makes CRM add follow-up tasks (e.g. "Review Loan Documents"); assert the 6 FO tasks by title only.
- **Expected duration:** about 14–15 minutes end to end (setup 30–40 s, mobile 12½–14½ min, verify 10–20 s). The
  longest task, Complete Group Loan Application (3-leader KYC), takes 5–10 min. Stability was confirmed with 3
  consecutive clean runs (no retries) on the Samsung SM-A235M, and again in strict mode after the mobile refactor.
- **Retries and the summary line:** `specFileRetries: 2` by default. The UiAutomator2 automation service on the device
  occasionally drops ("instrumentation process is not running") with no app error; a retry starts a fresh session and
  resumes. Every run ends with `=== FO mobile summary: PASSED cleanly, no retries` / `PASSED AFTER n RETRIES - not a
  clean run` / `FAILED after n attempt(s)`; only the first counts as a clean pass. `FO_STRICT=1` turns retries off — use
  it for stability runs. Each task has a 15-min mocha limit (`MOBILE_TIMEOUTS.task`).
- **Resuming:** every step is idempotent (scheduled/started steps and answered fields are skipped). The task list reads
  the section on screen from its header (only the visible pager page is in the tree). The last page, "Unable to
  Continue", has a header only while it holds tasks, so `visitSection()` treats it as optional. A task completed by an
  interrupted run is opened and its Completed status checked, never assumed.
- **Device prep for clean runs:** keep the phone charging and awake, close floating overlays (screen recorders,
  mirroring), postpone system software updates (an update prompt covers the app and causes a retry), don't use the phone
  during a run. `waitForIdleTimeout: 0` is set deliberately: all waits are explicit, and dialog buttons use
  `tapUntilGone()` because a tap during a dialog's opening animation is ignored.

## 4b. Field Officer "Unable to Continue" (`TC-FO-04..09`)

Run with `npm run test:e2e:fo:utc` (same three-step shape as §4a, own tags `@fu-setup` / `@fu-verify`, own WebdriverIO
config `mobile/wdio.unableToContinue.conf.js`, own state file `e2e-run/foUnableToContinue.json`; `wdio.conf.js` lists
only the happy-path spec, so `npm run test:e2e:fo` never runs this one). Data: `data/foUnableToContinue.json`, plus the
upload / assessment / assignment / task list from `data/foEndToEnd.json`.

1. **TC-FO-04** (`@fu-setup`): one import with two groups (`E2E UTC <ts>-1`, `-2`), each assessed and its 6 tasks
   assigned to the env's Field Officer; writes both group names and lead numbers.
2. **TC-FO-05 / 06** (mobile): per group, pick one task at random (saved to the state file; a retry reuses it), schedule
   today, start, then **More actions** → `Mark Task as “Unable to Continue”` → reason (**Incorrect information** for
   group 1, **Group does not exist** for group 2) → `Yes, mark as “Unable to Continue”` → in-app toast "Task and 5
   related tasks marked as Unable to Continue successfully." → task status "Unable to Continue".
3. **TC-FO-07..09** (`@fu-verify`):
   - **TC-FO-07** Incorrect information: all 6 tasks show "Unable to Continue"; the lead is **Paused** (pause reason
     "Incorrect Information") with **Resume Workflow** / **Reject Workflow**.
   - **TC-FO-08** Resume Workflow → dialog "Resume Paused FAST Loan Request" (names the lead) → Confirm: the task marked on
     mobile returns to **In Progress** (the status it had before it was marked), the other 5 to **Assigned**; the lead is
     Active again.
   - **TC-FO-09** Group does not exist: the lead is **Rejected**, all 6 tasks "Unable to Continue", no Resume Workflow.

- Task statuses are checked exactly per title (`LeadDetailPage.expectTaskStatusesEventually`), so "Un Assigned" can never
  pass for "Assigned". `openLead` waits for the lead-number search to show its single row before clicking (until the
  filter applies, the newest lead is listed first).
- "More actions" (3 dots) only exists on a started task, and is gone once the task is marked, which is how a retry knows
  the step is done.
- Each run leaves two locked groups and their leads on QA; the resumed lead's tasks go back to the Field Officer's task list.
- **Expected duration:** about 4–5 minutes (setup ~1.5 min, mobile ~1–2 min, verify ~1 min). A status poll that never
  matches waits `TIMEOUTS.sync` (10 min) before failing.

### Dynamic / unique data

Create flows build a unique name in the **spec** from a `baseName` in the fixture:

```js
const uniqueName = `${criteriaSetData.newCriteriaSet.baseName}_${Date.now()}`; // criteriaSets
const uniqueName = `${formsData.createForm.baseName} ${Math.floor(Math.random() * 10000)}`; // forms
```

Follow the `Date.now()` variant for new create tests — it is collision-free and sorts.

New-build form details the create tests rely on:

- **Criteria / criteria sets** have a Group Type radio (DreamSave / Non-DreamSave). It filters the
  criterion attributes and the criteria a set can include, so pick it first. True/False attributes
  switch the Value control to a dropdown and the condition to `is`. Older Non-DreamSave criteria
  marked "Invalid" are not selectable in sets.
- **Products**: Product Type is fixed to Loan; Credit Rule Set has one option; the Group Types table
  has one fixed row per group type, each offering only sets of that type. A non-zero Auto-Approval
  Threshold opens an "Update Auto-Approval Threshold" confirmation on Save. Product Code is a
  DreamSave matching code, so tests use `QA` + timestamp, which no real request carries.

### Cleanup expectations

There is **no teardown anywhere** — no `afterEach`, no API cleanup. Records created by
`TC-EC-05/06`, `TC-ECS-01/05`, `TC-FM-05` and `TC-PR-02` persist in the QA tenant (products have no
Delete; each TC-PR-02 run leaves a `QA Test Product_<ts>` in the product dropdowns). Consequences to keep
in mind:

- Unique-name create tests are safely re-runnable but leave residue. That is the accepted
  trade-off; do not add a cleanup layer without asking.
- `TC-CL-02` / `TC-CL-03` classify a group for real (a lead or pre lead is created), so each run
  that is not skipped uses up one suitable group on QA.
- No fixture names a QA record any more; every search and every state-dependent test reads its
  record at run time (see *Search tests never pin a record*).

## 5. Running Tests

All commands run from the repository root.

```bash
npm ci
npx playwright install chromium

# Full suite (serial — required for Keycloak)
npm test

# Full suite, headed
npm run test:headed

# Pre-wired single specs
npm run test:papergroups
npm run test:login
npm run test:groups
npm run test:users
npm run test:profile
npm run test:eligibility
npm run test:criteriasets

# Any other spec (no npm script yet) — always pass --workers=1
npx playwright test tests/specs/leads.spec.js --workers=1
npx playwright test tests/specs/tasks.spec.js --headed --workers=1

# A single test case by ID
npx playwright test --grep "TC-LD-03" --workers=1

# Field Officer web -> Android -> web flow (device + Appium required, see §4a)
npm run test:e2e:fo
FO_STRICT=1 npm run test:e2e:fo                      # bash: no mobile retries (stability runs)
$env:FO_STRICT="1"; npm run test:e2e:fo              # PowerShell
npm run test:e2e:fo:utc                              # FO "Unable to Continue" flow (device + Appium, see §4b)
npm run test:form-rules                              # pure FO answer-rule check, no device
npm run test:search-keywords                         # pure search-keyword helper check, no browser

# Switch environment (default is qa)
TEST_ENV=qa npx playwright test --workers=1          # bash
$env:TEST_ENV="qa"; npx playwright test --workers=1  # PowerShell
TEST_ENV=vfdev npm test                              # VF Dev web suite
TEST_ENV=vfdev npm run test:e2e:fo                   # VF Dev FO flow (dev app on the device)
```

`qa` and `vfdev` are usable; see §1 on `env/stag.env`.

### Allure reports

`allure-playwright` writes to `allure-results/` on every run. There are **no npm scripts for
Allure**, so drive `allure-commandline` directly:

```bash
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report

# or, one-shot live server:
npx allure serve allure-results
```

`npm run report` opens the *Playwright* HTML report, which is not wired up as a reporter — prefer
Allure. `allure-results/` accumulates across runs; delete it before a run you intend to report on
cleanly.

### Formatting

```bash
npm run format        # prettier --write .
npm run format:check
```

## 6. Workflow Guardrails

Follow these when adding or changing test cases.

1. **Confirm the plan before editing working code.** State which spec, page objects, selectors
   and fixture keys you intend to touch, and get agreement first. Adding a new test is normal
   work; rewriting an existing passing test, page object or fixture is not — propose it.
2. **Keep diffs scoped.** One module per change. Do not reformat, re-order or "tidy" neighbouring
   code, and do not retrofit `extends BasePage` or convert XPath to CSS outside the lines you
   were asked to change.
3. **Reuse before adding.** Check `SELECTORS` for an existing `desk*` / `autocomplete*` entry and
   the target page object for an existing method before writing a new one. New selectors go in
   `common/constants.js` only.
4. **Never hardcode.** No selector strings, credentials, record IDs, UI copy or expected counts
   inside a spec or page object — selectors to `common/constants.js`, everything else to
   `data/*.json`, credentials to `env/*.env` via `getCredentials()`.
5. **No sleeps, no coordinates.** No `waitForTimeout`, `setTimeout`, `page.mouse.*`,
   `boundingBox()` or `position:` clicks. Wait on state: visible, hidden, URL, or value.
6. **Explicit timeouts everywhere**, drawn from `TIMEOUTS`.
7. **Assertions belong in `expect*` methods** on the page object; the spec orchestrates and reads
   the data fixture.
8. **Follow the ID scheme.** Next free IDs continue the table in §2 (e.g. the next Leads case is
   `TC-LD-04`). Keep the `"TC-XX-NN | description"` title format.
9. **Create tests get `{ retries: 0 }` and a `Date.now()`-unique name.** If a flow cannot clean up
   after itself, say so in the handover rather than inventing a teardown.
10. **Run serially.** Any command you run or document must pass `--workers=1`.
11. **Verify before claiming.** Run the spec you added and report the real result. If it fails
    because of QA tenant data rather than the code, say that explicitly instead of loosening the
    assertion.
12. **Do not commit `env/`, `allure-results/`, `allure-report/`, `test-results/` or
    `playwright-report/`** — all are git-ignored.

### Known rough edges (do not fix silently; raise them first)

- `..prettierrc` has a **leading double dot**, so Prettier never loads it and falls back to its
  defaults. That is why committed code uses double quotes and an 80-column wrap despite the file
  asking for `singleQuote: true` and `printWidth: 100`. Match the surrounding committed style
  (double quotes) and leave the filename alone unless asked.
- `playwright.config.js` falls back to `https://lk-qa.dreamstartlabs.com` when `BASE_URL` is
  unset, while `env/qa.env` targets `zm-qa.`. Always let the env file win.
- `README.md` is stale: wrong base URL, missing the forms / geofence / leads / preLeads / tasks /
  classification modules, and it lists an `addProducts.spec.js` that does not exist. Treat this
  file as the source of truth; update the README only when asked.
- `playwright/.auth/user.json` is dead weight — no `storageState` is configured.
- Uncommitted work in progress on `main` is a Sri Lanka → Zambia tenant migration
  (`criteriaSetsTab` href, `"Zambia - Mainland"`, fixed viewport, fixture IDs) plus a
  Prettier-formatting regression in `pages/forms/FormCreatePage.js`. Expect these files to be
  dirty.
