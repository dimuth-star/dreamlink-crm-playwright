// Selectors for the DreamLink Field Officer Android app (com.dreamlink.agent.qa), used by mobile/pages.
// Kept separate from common/constants.js, which is web-only.
// Parameterised selectors are small functions so callers never build selector strings themselves.

const MOBILE_TIMEOUTS = {
  default: 20000,
  long: 60000,
  form: 30000,
};

const MOBILE = {
  // App login screen + Keycloak custom tab
  loginTitle: '//*[@text="Log in to DreamLink Field App"]',
  loginUsernameInput: "//android.widget.EditText",
  loginContinueBtn: '//*[@content-desc="Continue"]',
  customTabProgress: '//*[contains(@resource-id,"custom_tab_toolbar_progressbar")]',
  settingUpText: '//*[contains(@text,"Setting up your account")]',

  // First-login onboarding
  pinTitle: '//*[contains(@text,"offline access PIN")]',
  pinCreateBox: '(//*[contains(@text,"Create a 6-digit PIN")]/following-sibling::android.view.ViewGroup)[1]',
  pinConfirmBox: '(//*[contains(@text,"Enter PIN again to confirm")]/following-sibling::android.view.ViewGroup)[1]',
  pinSaveBtn: '//*[@content-desc="Save PIN"]',
  enableLocationTitle: '//*[@text="Enable location access"]',
  enableLocationBtn: '//*[@content-desc="Enable location"]',
  permissionAllowWhileUsing: '//*[@text="While using the app"]',

  // App shell (bottom tab bar is present on every signed-in screen)
  // the tab label starts with an (invisible) icon glyph, so match on ", Tasks" rather than exact text
  appTasksTab: '//android.view.View[contains(@content-desc,", Tasks")]',

  // My Tasks list
  myTasksTitle: '//*[@text="My Tasks"]',
  filterBtn: '//*[@content-desc="Sync status"]/following-sibling::android.view.ViewGroup[1]',
  filterSheetTitle: '//*[@text="Filter tasks"]',
  filterGroupField: '//*[@text="Filter by group name"]/following-sibling::*[1]',
  // the group field is an editable combobox: empty it shows "Search...", after a previous filter it holds that
  // group's name, so target the sheet's input regardless of its current text
  filterSearchInput: '(//*[@text="Filter tasks"]/following::android.widget.EditText)[1]',
  filterOption: (group) => `//*[@content-desc="${group}"]`,
  filterApplyBtn: '//*[@content-desc="Apply"]',
  sectionsStrip: "//android.widget.HorizontalScrollView",
  sectionHeader: (name) => `//android.widget.TextView[@text="${name}"]`,
  taskCard: (title, group) => `//*[contains(@content-desc,"${title}, Client Assessment · ${group}")]`,
  groupTaskCards: (group) => `//*[starts-with(@content-desc,"TASK-") and contains(@content-desc,"· ${group}")]`,

  // Task detail
  taskTitleText: (title) => `//*[@text="${title}"]`,
  scheduleBtn: '//android.widget.Button[@content-desc="Schedule"]',
  scheduledDateField: '//*[starts-with(@content-desc,"Scheduled date")]',
  scheduleSaveBtn: '//*[@content-desc="Save"]',
  markInProgressBtn: '//*[@content-desc="Mark as in progress"]',
  markCompletedBtn: '//*[@content-desc="Mark as completed"]',
  dialogYesBtn: '//*[@content-desc="Yes"]',
  cannotCompleteTitle: '//*[@text="Can not complete this task yet!"]',
  cannotCompleteOkBtn: '//*[@content-desc="Ok, got it"]',
  confirmCompleteText: '//*[@text="Are you sure you want to complete this task?"]',
  confirmStartText: '//*[@text="Are you sure you want to start this task?"]',
  scheduleDialogTitle: '//*[@text="Schedule a task completion date"]',
  detailBottomAnchorText: "Assigned by:",
  pendingFormRow: '//*[contains(@content-desc,", To Do") or contains(@content-desc,", In progress")]',
  formRowViewBtn: '//*[@content-desc="View"]',
  statusText: (status) => `//*[@text="${status}"]`,
  toastText: (text) => `//*[contains(@text,"${text}")]`,

  // SurveyJS form (rendered in a WebView, exposed through the accessibility tree)
  surveyContainer: '//*[@resource-id="surveyContainer"]',
  pageTitle: '//*[starts-with(@resource-id,"sp_") and contains(@resource-id,"_ariaTitle")]',
  formNextBtn: '//android.widget.Button[@text="Next"]',
  formCompleteBtn: '//android.widget.Button[@text="Complete"]',
  formErrorTexts: '//*[contains(@resource-id,"_errors")]/android.widget.TextView[@text!=""]',
  formErrorContainers: '//*[contains(@resource-id,"_errors")][android.widget.TextView[@text!=""]]',
  question: (qid) => `//*[@resource-id="${qid}"]`,
  questionTitle: (qid) => `//*[@resource-id="${qid}_ariaTitle"]`,
  questionInput: (qid) => `//*[@resource-id="${qid}i"]`,
  questionInputOfClass: (qid, cls) => `//*[@resource-id="${qid}i"][@class="${cls}"]`,
  questionInputOrDropdown: (qid) => `//*[@resource-id="${qid}i" or @resource-id="${qid}i_0"]`,
  questionChild: (qid, xp) => `//*[@resource-id="${qid}"]${xp}`,
  questionIsContainer: (qid) =>
    `//*[@resource-id="${qid}"]//*[starts-with(@resource-id,"sp_") or (starts-with(@resource-id,"sq_") and not(starts-with(@resource-id,"${qid}")))]`,
  dropdownList: (qid) => `//*[@resource-id="${qid}i_list"]`,
  dropdownOptions: (qid) => `//*[@resource-id="${qid}i_list"]/*[starts-with(@resource-id,"${qid}i_list")]`,
  dropdownOption: (qid, text) => `(//*[@resource-id="${qid}i_list"]//*[@text="${text}"])[1]`,
  dropdownShownValue: (qid) => `//*[@resource-id="${qid}i"]//android.widget.TextView[@text!=""]`,
  dropdownPopupOkBtn: '(//android.widget.Button[@text="OK"])[last()]',
  booleanOption: (qid, text) => `(//*[@resource-id="${qid}"]//*[@text="${text}"])[last()]`,
  fileUploaded: (qid) => `//*[@resource-id="${qid}"]//*[@content-desc="File preview" or @text="Clear"]`,
  fileSelectBtn: (qid) => `//*[@resource-id="${qid}"]//*[@text="Select File"]`,
  fileNoFileChosen: (qid) => `//*[@resource-id="${qid}i"][@text="No file chosen"]`,
  locationBtn: (qid) => `//*[@resource-id="${qid}"]//android.widget.Button[contains(@text,"Get Current Location")]`,
  locationInline: (qid) => `//*[@resource-id="${qid}"][contains(@text,"Get Current Location")]`,
  locationEmpty: (qid) => `//*[@resource-id="${qid}"]//*[@text="No location selected"]`,
  signaturePads: '//android.widget.EditText[starts-with(@text,"Signature")]',

  // Android native date picker
  datePickerYearHeader: '//*[@resource-id="android:id/date_picker_header_year"]',
  datePickerYearList: '//*[@resource-id="android:id/date_picker_year_picker"]',
  datePickerYearItems: '//*[@resource-id="android:id/date_picker_year_picker"]/*[@text]',
  datePickerYear: (year) => `//*[@resource-id="android:id/date_picker_year_picker"]/*[@text="${year}"]`,
  datePickerDay: (label) => `//*[@content-desc="${label}"]`,
  datePickerShownDay: '//android.view.View[contains(@content-desc," ")]',
  datePickerPrev: '//*[@resource-id="android:id/prev"]',
  datePickerNext: '//*[@resource-id="android:id/next"]',
  datePickerConfirm: '//*[@resource-id="android:id/button1"]',

  // Image pickers (OS chooser -> Files picker or system Photo Picker)
  chooserGallery: '//*[@text="Photos & videos"]/..',
  filesPickerFirstItem: '(//*[contains(@resource-id,"item_root")])[1]',
  photoPickerFirstItem: '(//*[starts-with(@content-desc,"Photo taken on")]/..)[1]',
  pickerConfirmBtns: ['//*[@text="Add"]', '//*[@text="Done"]', '//*[@content-desc="Add"]'],

  // generic scrollables
  scrollable: "android=new UiSelector().scrollable(true)",
};

const KEYCODES = { tab: 61, enter: 66, del: 67, down: 20, moveEnd: 123, digit0: 7 };

module.exports = { MOBILE, MOBILE_TIMEOUTS, KEYCODES };
