const SELECTORS = {
  // Landing page
  proceedToLogin: "a.btn-keycloak",

  // Keycloak login form
  usernameInput: "input#username",
  passwordInput: "input#password",
  signInBtn: "button#kc-login",
  loginError: "p#input-error-username",

  // Desk page
  dreamLinkApp: 'a[data-id="DreamLink"]',

  // Shared desk list-view selectors
  deskListRow: '.list-row-container[tabindex="1"]',
  deskLoadingIndicator: ".freeze.flex.justify-center.align-center.text-muted",
  deskNoResultsMessage: "div.no-result.text-muted p",
  deskClearAllFiltersBtn: 'button[aria-label="Clear All Filters"]',

  // DreamSave Groups list page
  loggedInUser: "span.d-block.text-truncate:not(.text-secondary)",
  groupsPageTitle: 'a.title-text[title="DreamSave Groups"]',
  // list paginator range, e.g. "1–20 of 148" (replaced the old ".list-count" label in the new build)
  recordCount: ".dl-pager-range span",
  groupNameLink: 'a.ellipsis[data-doctype="DL DreamSave Group"]',
  groupSearchInput: 'input[data-fieldname="group_name"]',
  groupEligibilityScoreFilter:
    '.standard-filter-section input[data-fieldname="dl_eligibility_score_filter"]',
  groupRowCheckbox: 'input[type="checkbox"]',
  // "Products and Eligibility" cell: one line per product, "<product><score badge><status badge>"
  groupProductLine: ".dl-products-cell > div",
  // the score badge has no title; the status badge carries its label as title (colour varies by status)
  groupProductScoreBadge: "span.badge:not([title])",
  groupProductStatusBadge: "span.badge[title]",
  // list filters (standard filter bar) and the matching table cells
  groupNumberFilter:
    '.standard-filter-section input[data-fieldname="group_number"]',
  groupMeetingLocationFilter:
    '.standard-filter-section input[data-fieldname="meeting_location"]',
  groupRegionFilter: '.standard-filter-section input[data-fieldname="region"]',
  groupPartnerFilter:
    '.standard-filter-section input[data-fieldname="partner"]',
  groupProductFilter:
    '.standard-filter-section input[data-fieldname="dl_requested_available_product_filter"]',
  groupStatusFilter:
    '.standard-filter-section select[data-fieldname="classification_status"]',
  groupNumberCell: '.list-row-col[data-fieldname="group_number"]',
  groupMeetingLocationCell: '.list-row-col[data-fieldname="meeting_location"]',
  groupPartnerCell: '.list-row-col[data-fieldname="partner"]',
  groupProductsCell: '.list-row-col[data-fieldname="products_and_eligibility"]',

  // DreamSave Group detail page
  groupNameDetail:
    '[data-fieldname="group_name"] .control-value.like-disabled-input',
  groupProductsTab: '[role="tab"][data-fieldname="products_tab"]',
  groupProductCard: "article.dl-product-card",
  groupProductCardName: ".dl-product-card__identity strong",
  // failed rows of the product's "Current Eligibility" criteria (present while the panel is collapsed)
  groupFailedCriterionName:
    ".dl-current-eligibility .dl-criterion-row--danger .dl-criterion-copy strong",

  // Logout
  logoutMenuTrigger: "a.sidebar-header",
  logoutMenuItem: "span.menu-item-title",
  logoutConfirmBtn: "button.btn.btn-primary.btn-sm.btn-modal-primary",

  // Users list page
  usersPageTitle: 'a.title-text[title="Users"]',
  usersNavLink: 'a.item-anchor[href="/desk/dl-user"]',
  userNameLink: 'a.ellipsis[data-doctype="DL User"]',
  userSearchInput: 'input[data-fieldname="name"]',

  // User detail page
  userFullName:
    '[data-fieldname="full_name"] .control-value.like-disabled-input',

  // User Profile page
  userProfileMenuBtn: '[aria-label="User Menu"]',
  userProfilePageTitle: "#page-DL\\ User\\ Profile .title-text-form",
  userProfileFullName: "#body",

  // Eligibility Criteria page
  eligibilityCriteriaPageTitle: 'a.title-text[title="Eligibility Criteria"]',
  eligibilityCriteriaNavLink:
    'a.item-anchor[href="/desk/eligibility-criteria"]',
  eligibilityCriteriaRow: 'div[class*="border-row-border"]',

  // Criterion detail page
  criterionAttribute: "section.pt-5 dd.text-foreground",
  criterionGroupType: "section.border-border dd.text-foreground",
  criterionNameLink: 'a[data-discover="true"]',
  criteriaSearchInput: 'input[placeholder="Search by criterion name"]',
  criteriaNoResultsMessage: "p.text-foreground.text-base",

  // Add Criterion form
  createCriterionBtn: 'button[data-label="Create Criterion"]',
  criterionNameInput: "Criterion name *",
  criterionDescriptionInput: "Description *",
  saveCriterionBtn: "Save criterion",
  criterionSuccessToast: "div.alert.desk-alert.green .alert-message",
  // criterion logic row (accessible names); the Value control is a number box or a True/False dropdown
  criterionAttributeSelect: "Eligibility attribute",
  criterionConditionSelect: "Condition",
  criterionValueControl: "Value",

  // Eligibility Criteria Sets
  criteriaSetRow:
    'div[class*="border-row-border"][class*="text-muted-foreground"]',
 criteriaSetsTab: 'a[href="/desk/eligibility-criteria/sets"][data-discover="true"]',
  createCriteriaSetBtn: 'button[data-label="Create Criteria Set"]',
  criteriaSetNameInput: "input#criteria-set-name",
  criteriaSetCheckbox: "input.dl-checkbox",
  criteriaSetDescriptionInput: "input#criteria-set-description",
  // "Available criteria" list: only criteria of the selected group type, each a label with checkbox + name
  criteriaSetAvailableList: '[role="region"][aria-label="Available criteria"]',
  criteriaSetAvailableItem: "label:has(input.dl-checkbox)",
  criteriaSetItemName: "span.font-medium",
  saveCriteriaSetBtn: 'button:has-text("Save criteria set")',
  criteriaSetSuccessToast:
    "div.alert.desk-alert.green .alert-message-container",
  criteriaSetSearchInput: 'input[placeholder="Search by set name"]',
  criteriaSetNoResultsMessage: "p.text-foreground.text-base",

  // Products list page
  productsPageTitle: 'a.title-text[title="Products"]',
  productsNavLink: 'a.item-anchor[href="/desk/dl-product"]',
  productNameLink: 'a.ellipsis[data-doctype="DL Product"]',
  productSearchInput:
    '.standard-filter-section input[data-fieldname="product_name"]',

  // Add Product page / Product detail (one Frappe control per data-fieldname)
  productNameInput: '.form-layout input[data-fieldname="product_name"]:visible',
  productCodeInput: '.form-layout input[data-fieldname="product_ds_code"]:visible',
  // Product Type is fixed to "Loan" and shown as a read-only value
  productTypeValue:
    '.form-layout [data-fieldname="product_type"] .control-value:visible',
  productDescriptionInput:
    '.form-layout textarea[data-fieldname="description"]:visible',
  productCreditRuleSetSelect:
    '.form-layout select[data-fieldname="credit_rule_set"]:visible',
  productAutoApprovalInput:
    '.form-layout input[data-fieldname="auto_approval_threshold"]:visible',
  // Group Types table: one fixed row per group type, each with an Eligibility Criteria Set link field
  productGroupTypeRow:
    '.form-layout [data-fieldname="group_types"] .grid-body .grid-row:visible',
  productGroupTypeCell:
    '.grid-static-col[data-fieldname="group_type"] .static-area',
  productCriteriaSetCell:
    '.grid-static-col[data-fieldname="eligibility_criteria_set"]',
  productCriteriaSetValue:
    '.grid-static-col[data-fieldname="eligibility_criteria_set"] .static-area',
  productCriteriaSetInput: 'input[data-fieldname="eligibility_criteria_set"]',
  productSaveBtn: 'button[data-label="Save"]:visible',
  productStatusIndicator: ".page-head .indicator-pill:visible",
  // a non-zero Auto-Approval Threshold asks for confirmation on Save
  productConfirmDialog: ".modal.fade.show",
  productConfirmDialogBtn: ".modal.fade.show button.btn-modal-primary",

  // Geofence List Page
  geofenceListPageTitle: '[data-slot="card-title"]',
  geofenceCreateBtn: '[data-slot="button"]:has-text("New Geofence")',
  geofenceNavLink: 'a.item-anchor[href="/desk/geofences"]',
  geofenceListRow: "ul.space-y-0 li",
  geofenceBranchSelect: '[data-slot="button"]:has-text("Branch")',
  geofenceHierarchySelect:
    '[type="button"]:has-text("Organizational Hierarchy")',
  geofenceOrgSummary: '[aria-label="Geofence summary"]',
  geofenceFoSelect: '[data-slot="button"]:has-text("FO Area")',
  geofenceSearchInput:
    'input[data-slot="input"][placeholder="Search geofences by name..."]',
  geofenceInvalidSearchMessage: '.space-y-0:has-text("No Geofences Found")',
  geofenceBranchFirstItem: ".space-y-0 li",
  geofenceExportBtn: '[data-slot="dropdown-menu-trigger"]',
  geofenceExportDownload: '[data-slot="dropdown-menu-item"]',
  geofenceResultsList: "ul.space-y-0",
  geofenceSelectedListItem: 'li[aria-selected="true"][data-focused="true"]',
  geofenceMapContainer: "div.gm-style",
  geofenceFocusOnMapBtn: 'button[aria-label^="Focus"][aria-label$="on map"]',

  // Add Geofence Page
  addGeofencePageTitle: '[data-slot="card-title"]',
  addGeofenceNameInput: '[data-slot="input"][name="name"]',
  geofenceTypeDropdown: '[type="button"][role="combobox"]',
  geofenceParentDropdown: '[type="button"][role="combobox"]',
  overlapPriorityInput: '[data-slot="input"][name="priority"]',
  geofenceDrawBtn: '[data-slot="button"][type="button"]',
  geofenceItemName:
    "span.text-foreground.flex.items-center.gap-2.text-sm.font-semibold",

  // Geofence Detail Page
  geofenceCountryCard: '[data-state="closed"][data-slot="collapsible"]',
  geofenceDetailPageSubtitle: ".min-w-0",
  geofenceDetailPageAssignUser: '[data-slot="tooltip-trigger"]',
  geofenceAssignUserModalTitle: "#radix-_r_7q_",
  geofenceAssignUserCancelBtn: '[data-slot="button"]',
  geofenceBranchTab: '[data-slot="button"]',
  geofenceBranchTitle: '.min-w-0:has-text("Branch")',
  geofenceAssignProductCancelBtn: '[data-slot="button"]',
  geofenceConfigureUsersBtn: 'button[aria-label="Configure user assignments"]',
  geofenceConfigureProductsBtn:
    'button[aria-label="Configure product assignments"]',

  geofenceAssignedItemName: "div.truncate.text-sm.font-medium",
  // list type filter "Branch" (exact: "Sub-branch" also contains the word)
  geofenceBranchFilter: '[data-slot="button"]:text-is("Branch")',
  // a geofence row that opens its detail panel (not the collapsible country header)
  geofenceSelectableRow: "ul.space-y-0 li[aria-selected]",
  // "No assigned users" / "No assigned products" in an empty assignment section
  geofenceAssignedEmpty: "div.text-muted-foreground.py-2.text-sm",
  geofenceDetailBackBtn: 'button:has-text("Back")',

  // Classification — list-view actions
  classificationActionsBtn:
    'div.actions-btn-group button[data-toggle="dropdown"]',
  classificationRunMenuItem:
    'span.menu-item-label[data-label="Run%20Classification"]',

  // Run Classification confirmation modal
  classificationConfirmBtn:
    ".modal.fade.show .modal-footer button.btn-modal-primary",

  // Classification Summary modal — skipped (orange)
  classificationSummaryPill: ".modal.fade.show span.indicator-pill.orange",
  classificationSummaryText: "No Groups Classified",
  classificationSummaryCloseBtn:
    ".modal.fade.show .modal-footer button.btn-modal-primary",
  classificationModalBackdrop: ".modal.fade.show",

  // Classification Summary modal — fully eligible (green)
  classificationSummaryPillGreen: ".modal.fade.show span.indicator-pill.green",
  classificationSummaryTextGreen:
    "Classification triggered for 1 group across 1 product",

  // Groups list — fully eligible badge
  fullyEligibleBadge: 'span.badge.badge-success[title="Fully Eligible"]',

  // Leads list page
  leadsPageTitle: 'a.title-text[title="Leads"]',
  leadSavingGroupSearchInput: 'input[data-fieldname="dl_saving_group"]',
  leadSavingGroupCell: '.list-row-col[data-fieldname="dl_saving_group"] a',
  leadNameLink: 'a.ellipsis[data-doctype="DL Lead"]',

  // Lead detail page
  leadNumber:
    '[data-fieldname="lead_number"] .control-value.like-disabled-input',
  leadGeneratedDate:
    '[data-fieldname="generated_date"] .control-value.like-disabled-input',
  leadSavingGroupValue:
    '[data-fieldname="dl_saving_group"] .control-value.like-disabled-input',
  leadTaskStatusPill: "span.indicator-pill.purple",

  // Lead detail — tasks section
  leadTasksGroupHead: "div.dl-tasks-group-head",
  leadTasksStagePill: "div.dl-tasks-group-head span.indicator-pill.cyan",
  leadTasksCountLabel: "div.dl-tasks-group-head span.text-muted.small",
  leadCurrentWorkflowStage:
    '[data-fieldname="current_workflow_stage"] .control-value.like-disabled-input',

  // Leads list — active status pill
  leadActiveStatusPill: "span.filterable.indicator-pill.green.ellipsis",

  // Leads list — number search
  leadNumberSearchInput: 'input[data-fieldname="lead_number"]',
  leadsNoResultsMessage: "div.no-result p",

  // Autocomplete dropdown
  autocompleteListbox: 'ul[role="listbox"]:not([hidden])',
  autocompleteDropdownOption: '[role="option"]',

  // Groups list — data correction badge
  dataCorrectionalBadge:
    'span.badge.badge-secondary[title="Data Correction Required"]',

  // Pre Leads list page
  preLeadsPageTitle: 'a.title-text[title="Pre Leads"]',
  preLeadsNavLink: 'a.item-anchor[href="/desk/dl-pre-lead"]',
  preLeadSavingGroupSearchInput: 'input[data-fieldname="dl_saving_group"]',
  preLeadNameLink: 'a.ellipsis[data-doctype="DL Pre Lead"]',
  preLeadNumberSearchInput: 'input[data-fieldname="pre_lead_number"]',

  // Pre Lead detail page
  preLeadNumber:
    '[data-fieldname="pre_lead_number"] .control-value.like-disabled-input',
  preLeadGeneratedDate:
    '[data-fieldname="generated_date"] .control-value.like-disabled-input',
  preLeadSavingGroupValue:
    '[data-fieldname="dl_saving_group"] .control-value.like-disabled-input',
  preLeadTasksStagePill: "div.dl-tasks-group-head span.indicator-pill.blue",
  preLeadTasksCountLabel: "div.dl-tasks-group-head span.text-muted.small",
  preLeadTaskStatusPill: "span.indicator-pill.purple",
  preLeadTasksGrid: "div.dl-tasks-group div.grid-row",
  preLeadStatus: '[data-fieldname="status"] .control-value.like-disabled-input',

  /// Forms list page
  formsPageTitle: "span.app-shell__breadcrumb-label--current",
  formsListRow: 'tr.forms-list-item[tabindex="0"]',
  // list pager range, e.g. "1–20 of 62" ("0–0 of 0" when nothing matches)
  formsResultCount: "div.list-pagination__results-count",
  formsSearchInput: "input#search",
  formsNoResultsMessage: "p.forms-list-page__empty-text",
  formsItemName: "span.forms-list-item__name",
  formsCreateBtn: 'a[href="/forms/new"]',

  // Create Form page
  formsSurveyTitleInput: 'span[role="textbox"][aria-label="Survey Title"]',
  formsAddQuestionText: "Add Question",
  formsQuestionNameInput: 'span[role="textbox"][aria-label="content editable"]',
  formsSaveAndPublishBtn: "button.form-create-page__primary-action",
  formsSuccessToast: 'li[data-sonner-toast][data-type="success"]',
  formsSuccessToastTitle:
    'li[data-sonner-toast][data-type="success"] div[data-title]',

  // Form detail/preview page
  formPreviewTitle: "h1.form-preview-page__title",
  formPreviewStatusBadge:
    'div.form-preview-page__summary-item span[data-slot="badge"]',
  formPreviewSummaryValue: "span.form-preview-page__summary-value",

  // Tasks list page
  tasksPageTitle: 'a.title-text[title="Tasks"]',
  tasksNavLink: 'a.item-anchor[href="/desk/dl-task"]',
  taskNameLink: 'a.ellipsis[data-doctype="DL Task"]',
  taskNumberCell: "div.list-row-col .level-item a",

  // Task detail page
  taskDetailNumber:
    '[data-fieldname="task_number"] .control-value.like-disabled-input',
  taskDetailTitle:
    '[data-fieldname="title"] .control-value.like-disabled-input.bold',
  taskDetailStatus:
    '[data-fieldname="status"] .control-value.like-disabled-input',
  taskDetailStage:
    '[data-fieldname="stage"] .control-value.like-disabled-input',
  taskDetailReference:
    '[data-fieldname="reference_doc"] .control-value.like-disabled-input',
  taskNumberSearchInput: 'input[data-fieldname="task_number"]',

  // Paper Groups list page
  // No [title] attribute: it is missing after the SPA redirect that follows a delete
  paperGroupsPageTitle: "a.title-text:visible",
  paperGroupsPageTitleText: "Paper Groups",
  paperGroupDownloadTemplateBtn: 'button[data-label="Download%20template"]',
  paperGroupUploadBtn: 'button[data-label="Upload%20groups"]',
  paperGroupBannerText: ".dl-pg-banner-text",
  paperGroupBannerReviewBtn: ".dl-pg-banner-review-btn",

  // Paper Groups — Upload Paper Groups modal
  paperGroupUploadModal: ".modal.fade.show",
  paperGroupPartnerSelect: '.modal.fade.show select[data-fieldname="partner"]',
  paperGroupFileInput: ".modal.fade.show input.dl-paper-group-file-input",
  paperGroupUploadSubmitBtn: ".modal.fade.show button.btn-modal-primary",

  // Paper Groups — Review import summary modal
  paperGroupReviewModalTitle: "Review import summary",
  paperGroupReviewProceedBtn: ".modal.fade.show button.btn-modal-primary",

  // Paper Groups — list search + toast
  paperGroupSearchInput:
    '.standard-filter-section input[data-fieldname="group_name"]',
  paperGroupNameLink: 'a.ellipsis[data-doctype="DL Non DreamSave Group"]',
  paperGroupRegionFilter:
    '.standard-filter-section input[data-fieldname="region"]',
  paperGroupVillageFilter:
    '.standard-filter-section input[data-fieldname="village"]',
  paperGroupDistrictFilter:
    '.standard-filter-section input[data-fieldname="district"]',
  paperGroupClassificationFilter:
    '.standard-filter-section select[data-fieldname="classification"]',
  paperGroupImportBatchFilter:
    '.standard-filter-section input[data-fieldname="import_batch"]',
  paperGroupDuplicateFilter:
    '.standard-filter-section input[data-fieldname="has_duplicate_warning"]',
  paperGroupRegionCell: '.list-row-col[data-fieldname="region"]',
  paperGroupVillageCell: '.list-row-col[data-fieldname="village"]',
  paperGroupDistrictCell: '.list-row-col[data-fieldname="district"]',
  paperGroupClassificationCell:
    '.list-row-col[data-fieldname="classification"]',
  paperGroupImportedListCell:
    '.list-row-col[data-fieldname="imported_list_name"]',
  paperGroupDuplicateBadge: "span.dl-duplicate-badge",
  // partner chips above the filters: "All partners" plus one per partner ("<n> imported")
  paperGroupPartnerChip: "button.dl-partner-filter-chip",
  paperGroupPartnerChipLabel: ".dl-partner-filter-chip-label",
  paperGroupPartnerChipCount: ".dl-partner-filter-chip-count",
  paperGroupToast: "div.alert.desk-alert",

  // Paper Group detail page
  paperGroupVillageInput: '.form-layout input[data-fieldname="village"]:visible',
  // the whole Village field: an input box, or a read-only value once the group is locked (assessed)
  paperGroupVillageField:
    '.form-layout .frappe-control[data-fieldname="village"]:visible',
  // the read-only Village value shown instead of the input while the group is locked (draft or assessed)
  paperGroupVillageValue:
    '.form-layout .frappe-control[data-fieldname="village"] .control-value:visible',
  paperGroupSaveBtn: 'button[data-label="Save"]:visible',
  paperGroupDeleteBtn: 'button[data-label="Delete"]:visible',
  paperGroupUnsavedIndicator: ".indicator-pill:visible",
  paperGroupDeleteConfirmBtn: ".modal.fade.show button.btn-modal-primary",

  // Paper Groups — Start Assessment (list-view action) and detail
  paperGroupRowCheckbox: '.list-row-container[tabindex="1"] input[type="checkbox"]',
  paperGroupActionsMenuItem: "div.actions-btn-group .dropdown-menu a",
  paperGroupStartAssessmentText: "Start Assessment",
  paperGroupAssessmentModalTitle: "Confirm Start Assessment",
  paperGroupAssessmentResultTitle: "Start Assessment Initiated",
  // shown instead of the confirmation while a just-imported group is still flagged as a draft
  paperGroupInvalidSelectionTitle: "Invalid Selection",
  paperGroupAssessmentProductSelect:
    '.modal.fade.show select[data-fieldname="product"]',
  paperGroupDreamLinkNumber:
    '.form-layout [data-fieldname="dreamlink_number"]:visible',

  // Lead detail — tasks section (assessment / assignment)
  leadTaskRows: "div.dl-tasks-group div.grid-row",
  leadTaskStatusPills: "span.dl-task-status-pill",
  leadAssignTasksBtn: 'button[data-action="assign-tasks"]',
  leadTaskTitleCell: ".dl-task-col-title",
  // header action on a Paused lead (tasks marked "Unable to Continue")
  leadResumeWorkflowBtn: 'button[data-label="Resume%20Workflow"]:visible',
  resumeWorkflowModal: ".modal.fade.show",
  resumeWorkflowConfirmBtn: ".modal.fade.show button.btn-modal-primary",

  // Assign Tasks modal (lead detail)
  assignTasksUserInput: '.modal.fade.show input[data-fieldname="dl_user"]',
  assignTasksModalTitle: "Assign Tasks - Client Assessment",
  assignTasksConfirmText: "Assign the following task(s)",
};

const TIMEOUTS = {
  default: 20000,
  navigation: 30000,
  shortWait: 5000,
  backgroundJob: 120000, // server-side jobs that finish after the UI confirms (e.g. DreamLink number after Start Assessment)
  sync: 600000, // mobile <-> CRM sync polling (Field Officer end-to-end)
};

const DEFAULTS = {
  pageSize: 20,
};

module.exports = { SELECTORS, TIMEOUTS, DEFAULTS };
