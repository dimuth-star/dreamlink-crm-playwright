// Playwright config for the Field Officer end-to-end flow (steps 1 and 3 of `npm run test:e2e:fo`).
// Reuses the main config (env loading, baseURL, Chromium project, Allure) and only narrows the scope
// to tests/e2e/*.e2e.js with timeouts long enough for upload/assessment and mobile->CRM sync polling.
const { defineConfig } = require("@playwright/test");
const base = require("./playwright.config");

module.exports = defineConfig({
  ...base,
  testDir: "./tests/e2e",
  testMatch: "**/*.e2e.js",
  timeout: 15 * 60 * 1000,
  retries: 0,
  workers: 1,
  fullyParallel: false,
});
