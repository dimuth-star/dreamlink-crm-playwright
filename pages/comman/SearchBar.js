const {SELECTORS} = require('../../common/constants')



class SearchBar  {
constructor(page) {
    this.page = page;
    this.searchInput = page.locator(SELECTORS.searchInput);
    this.searchSuggestList = page.locator(SELECTORS.suggestList);
    

                  
}

async search(keyword) {

    await this.searchInput.fill(keyword);
    await this.searchInput.press('Enter');
    await this.page.waitForLoadState('load');

}


  async typeInSearch(keyword) {
    await this.searchInput.click();
    await this.searchInput.fill(keyword);
    await this.searchSuggestList.first().waitFor({ state: 'visible', timeout: 10000 });
  }

}

module.exports = {SearchBar}