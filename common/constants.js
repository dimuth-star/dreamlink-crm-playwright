const BASE_URL = 'https://lk-qa.dreamstartlabs.com';

const SELECTORS = {
  // Landing page
  proceedToLogin: 'a.btn-keycloak',

  // Keycloak login form
  usernameInput: 'input#username',
  passwordInput: 'input#password',
  signInBtn: 'button#kc-login',
  loginError: 'p#input-error-username',

  // Desk page
  dreamLinkApp: 'a[data-id="DreamLink"]',

// DreamSave Groups list page
  loggedInUser: 'span.d-block.text-truncate:not(.text-secondary)',
  groupsPageTitle: 'a.title-text[title="DreamSave Groups"]',
  groupListRow: '.list-row-container[tabindex="1"]',
  recordCount: '.list-count span',
  groupNameLink: 'a.ellipsis[data-doctype="DL DreamSave Group"]',
  groupSearchInput: 'input[data-fieldname="group_name"]',
  groupListLoading: '.freeze.flex.justify-center.align-center.text-muted',
  groupNoResultsMessage: 'div.no-result.text-muted p',

  // DreamSave Group detail page
  groupNameDetail: '[data-fieldname="group_name"] .control-value.like-disabled-input',

  // Logout
logoutMenuTrigger: 'a.sidebar-header',
logoutMenuItem: 'span.menu-item-title',
logoutConfirmBtn: 'button.btn.btn-primary.btn-sm.btn-modal-primary',


  // Users list page
  usersPageTitle: 'a.title-text[title="Users"]',
  usersNavLink: 'a.item-anchor[href="/desk/dl-user"]',
  userListRow: '.list-row-container[tabindex="1"]',
  userListLoading: '.freeze.flex.justify-center.align-center.text-muted',
  userNameLink: 'a.ellipsis[data-doctype="DL User"]',
  userSearchInput: 'input[data-fieldname="name"]',
  userNoResultsMessage: 'div.no-result.text-muted p',

  // User detail page
  userFullName: '[data-fieldname="full_name"] .control-value.like-disabled-input',

  // User Profile page
userProfileMenuBtn: '[aria-label="User Menu"]',
userProfilePageTitle: '#page-DL\\ User\\ Profile .title-text-form',
userProfileFullName: '#body',
userProfileBreadcrumb: 'li',

// Eligibility Criteria page
eligibilityCriteriaPageTitle: 'a.title-text[title="Eligibility Criteria"]',
eligibilityCriteriaNavLink: 'a.item-anchor[href="/desk/eligibility-criteria"]',
eligibilityCriteriaRow: 'div[class*="border-row-border"]',

// Criterion detail page
criterionAttribute: 'section.pt-5 dd.text-foreground',
criterionGroupType: 'section.border-border dd.text-foreground',
criterionNameLink: 'a[data-discover="true"]',
criteriaSearchInput: 'input[placeholder="Search by criterion name"]',
criteriaNoResultsMessage: 'p.text-foreground.text-base',

// Add Criterion form
createCriterionBtn: 'button[data-label="Create Criterion"]',
criterionNameInput: 'Criterion name *',
criterionDescriptionInput: 'Description *',
saveCriterionBtn: 'Save criterion',
criterionSuccessToast: 'div.alert.desk-alert.green .alert-message',

// Eligibility Criteria Sets
criteriaSetRow: 'div[class*="border-row-border"][class*="text-muted-foreground"]',
criteriaSetsTab: 'a[href="/sets"][data-discover="true"]',
createCriteriaSetBtn: 'button[data-label="Create Criteria Set"]',
criteriaSetNameInput: 'input#criteria-set-name',
criteriaSetCheckbox: 'input.dl-checkbox',
saveCriteriaSetBtn: 'button:has-text("Save criteria set")',
criteriaSetSuccessToast: 'div.alert.desk-alert.green .alert-message-container',
criteriaSetSearchInput: 'input[placeholder="Search by set name"]',
criteriaSetNoResultsMessage: 'p.text-foreground.text-base',
};

const TIMEOUTS = {
  default: 20000,
  navigation: 30000,
};

module.exports = { BASE_URL, SELECTORS, TIMEOUTS };