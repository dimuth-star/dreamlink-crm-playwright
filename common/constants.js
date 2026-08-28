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

// Shared desk list-view selectors
  deskListRow: '.list-row-container[tabindex="1"]',
  deskLoadingIndicator: '.freeze.flex.justify-center.align-center.text-muted',
  deskNoResultsMessage: 'div.no-result.text-muted p',

// DreamSave Groups list page
  loggedInUser: 'span.d-block.text-truncate:not(.text-secondary)',
  groupsPageTitle: 'a.title-text[title="DreamSave Groups"]',
  recordCount: '.list-count span',
  groupNameLink: 'a.ellipsis[data-doctype="DL DreamSave Group"]',
  groupSearchInput: 'input[data-fieldname="group_name"]',

  // DreamSave Group detail page
  groupNameDetail: '[data-fieldname="group_name"] .control-value.like-disabled-input',

  // Logout
logoutMenuTrigger: 'a.sidebar-header',
logoutMenuItem: 'span.menu-item-title',
logoutConfirmBtn: 'button.btn.btn-primary.btn-sm.btn-modal-primary',


  // Users list page
  usersPageTitle: 'a.title-text[title="Users"]',
  usersNavLink: 'a.item-anchor[href="/desk/dl-user"]',
  userNameLink: 'a.ellipsis[data-doctype="DL User"]',
  userSearchInput: 'input[data-fieldname="name"]',

  // User detail page
  userFullName: '[data-fieldname="full_name"] .control-value.like-disabled-input',

  // User Profile page
userProfileMenuBtn: '[aria-label="User Menu"]',
userProfilePageTitle: '#page-DL\\ User\\ Profile .title-text-form',
userProfileFullName: '#body',

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

// Products list page
productsPageTitle: 'a.title-text[title="Product"]',
productsNavLink: 'a.item-anchor[href="/desk/dl-product"]',


// Add Product page
addProductPageTitle: '//div[normalize-space()="Product Details"]',
productNameInput: 'input[data-fieldname="product_name"]',
productTypeSelect: 'div[data-fieldname="product_type"] .select2-selection',
productDescriptionInput: 'textarea[data-fieldname="product_description"]',
productRulesTitle: '//div[normalize-space()="Rules Settings"]',
productRulesDropdown: '//button[@title="FAST Credit Rule Set"]',
productEligibilityCriteriaTitle: '//div[@class="section-head"][normalize-space()="Eligibility Criteria"]',
productGroupsTypesTitle: '//label[normalize-space()="Group Types"]',
productDSCriteriaSetSelect: '//div[@class="col grid-static-col col-xs-3"]//input[@placeholder="Eligibility Criteria Set"]',


};

const TIMEOUTS = {
  default: 20000,
  navigation: 30000,
};

const DEFAULTS = {
  pageSize: 20,
};

module.exports = { SELECTORS, TIMEOUTS, DEFAULTS };