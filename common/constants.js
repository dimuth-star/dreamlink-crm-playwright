const BASE_URL = process.env.BASE_URL || 'https://www.daraz.lk';

const SELECTORS = {
  loginTrigger: '#anonLogin',
  accountTrigger: '#myAccountTrigger',
  languageSwitch: '#topActionSwitchLang',
  dialogClose: '.next-dialog-close',
  loginError: '.nextera-feedback-error, .next-feedback-error, [class*="error"]',
  searchInput: 'input[placeholder*="Search"]',
  suggestList: 'div[class*="suggest-list"], [class="search-box"] [class*="suggest"]',
  cartBadgeCount: '#topActionCartNumber',
  siteLogo: 'Online Shopping Daraz Logo',
  catalog:'/shop all products/i',
  categories :'Categories',
  logout: 'Logout',
  //productList: 'div[class*="item-list-content"] a[class*="flash-unit-a"]',
  addToCart: 'Add to Cart',
  buyNow: 'Buy Now',
  catalog: '[data-qa-locator="product-item"]',
  cartBadge: '#topActionCartNumber',
  productList: '[data-qa-locator="product-item"]',
  cartIcon: '[data-spm="dcart"]',
  cartItem: '.cart-item',
  deleteBtn: '.automation-btn-delete',
 confirmRemoveBtn: '.next-btn-primary',
 minPriceInput: 'input[placeholder="Min"]',
maxPriceInput: 'input[placeholder="Max"]',
priceApplyBtn: 'button.ant-btn-primary.ant-btn-icon-only',
priceFilterChip: '.ant-tag',
brandCheckbox: 'input.ant-checkbox-input',
brandFilterChip: '.ant-tag',
noResultsTitle: '.jG0xV',
noResultsMessage: '.ERtv3',
selectAllCheckbox: '.next-checkbox.list-header-checkbox',
headerDeleteBtn: '.btn-wrap.automation-btn-delete',
confirmClearBtn: 'button:has-text("REMOVE")',



  
};

const ROUTES = {
  home: '/',
  catalog: '/catalog/',
};

const TIMEOUTS = {
  default: 15000,
  navigation: 30000,
};

module.exports = { BASE_URL, SELECTORS, TIMEOUTS };
