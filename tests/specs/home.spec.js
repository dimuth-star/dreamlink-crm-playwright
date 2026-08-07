const {test,expect}=require('@playwright/test');
const {HomePage}=require('../../pages/home/homePage');


test.describe('HomePage', () =>{
     let homePage;
    

    test.beforeEach(async({page}) =>{
         homePage = new HomePage(page);
         await homePage.open();
    });


test.afterEach(async({page})=>{
   console.log('Test completed');
});   

test('TC-10 Home page load successfully', async ({page})=>{

    await expect(homePage.page).toHaveURL(/daraz\.lk/);
    await expect(homePage.page).toHaveTitle(/Daraz/i);

})

test('TC-11 key header element are visible (search, login, cart, language)', async ({page})=>{

    await expect(homePage.searchInput).toBeVisible();
    await expect(homePage.loginTrigger).toBeVisible();
    await expect(homePage.cartBadge).toBeAttached();
    await expect(homePage.language).toBeVisible();

    
})

test('TC-12 Guest cart badge is empty or zero)', async ({page})=>{


    await expect(homePage.cartBadgeCount).toBeEmpty();
  

    
})

test('| TC-13 Logo navigates back to homepage from catalog |', async ({page})=>{


     await homePage.navigatetoCatalog();
     await expect(homePage.categories).toBeVisible();
     await homePage.navigateHomeViaLogo();
     await expect(homePage.page).toHaveURL(/daraz\.lk/);

  

    
})







})
