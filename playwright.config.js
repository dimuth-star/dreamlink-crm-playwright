// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const { loadEnvFile } = require('./util/helpers');

const envName = process.env.TEST_ENV || 'qa';
loadEnvFile(envName);

const baseURL = process.env.BASE_URL || 'https://www.daraz.lk';
const AUTH_FILE = 'playwright/.auth/user.json';

/** @type {import('@playwright/test').PlaywrightTestConfig['use']} */
const sharedUse = {
  baseURL,
  locale: 'en-US',
  timezoneId: 'Asia/Colombo',
  viewport: null,
  launchOptions: {
    args: ['--start-maximized'],
  },
  trace: 'retain-on-failure',
  screenshot: 'on',
  video: 'retain-on-failure',
};

const ignoredTests = [/auth\.setup\.js/, /NotAGoodPractice\.spec\.js/,/cart\.spec\.js/,];

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined,
  timeout: 60000,
  reporter: [['html'], ['list']],
  use: sharedUse,
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.js/,
    },
    {
      name: 'chromium',
      testIgnore: ignoredTests,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'cart',
      testMatch: /cart\.spec\.js/,
      fullyParallel: false,
      workers: 1,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
