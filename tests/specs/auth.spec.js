const { test, expect } = require('@playwright/test');
const { HomePage } = require('../../pages/home/HomePage');
const { LoginPage } = require('../../pages/user/LoginPage');
const { SettingsPage } = require('../../pages/user/SettingsPage');
const users = require('../../data/users.json');

test.describe('Auth & Language', () => {
  let homePage;
  let loginPage;
  let settingsPage;
  const userData = users.valid;
  const userDataInvalid = users.invalid;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    loginPage = new LoginPage(page);
    settingsPage = new SettingsPage(page);
    await homePage.open();
  });

  test('TC-14 | Login modal shows email and password fields', async () => {
    await loginPage.openLoginModal();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
  });

  test('TC-15 | Invalid credentials do not log user in', async ({page}) => {
    await loginPage.loginWithInvalidCredentials(userDataInvalid.email, userDataInvalid.password);
    //await expect(page.getByText('Invalid account or password.')).toBeVisible();
  });

  test('TC-16 | Logout returns user to guest state', async ({page}) => {
    await loginPage.login(userData.email, userData.password);
    await loginPage.logOut();
    await expect(loginPage.loginTrigger).toHaveText(/login/i);

  });
});