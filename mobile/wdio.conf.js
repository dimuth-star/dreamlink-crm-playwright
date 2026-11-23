// WebdriverIO config for the Field Officer app (step 2 of `npm run test:e2e:fo`).
// Device, app and FO credentials come from env/<TEST_ENV>.env (git-ignored).
const path = require("path");
const { execSync, spawnSync } = require("child_process");
const { loadEnvFile, getFoApp, missingFoEnv } = require("../util/helpers");
const { MOBILE_TIMEOUTS } = require("../common/mobileSelectors");

loadEnvFile(process.env.TEST_ENV || "qa");

const APPIUM_PORT = Number(process.env.APPIUM_PORT || 4723);
const FO_APP = getFoApp();
const FO_PERMISSIONS = ["CAMERA", "RECORD_AUDIO", "ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"];

// Reuse an Appium server that is already running; otherwise let the appium service start one.
function appiumAlreadyRunning() {
  const probe = `require("http").get("http://127.0.0.1:${APPIUM_PORT}/status",r=>process.exit(r.statusCode===200?0:1))` +
    `.on("error",()=>process.exit(1)).setTimeout(2000,()=>process.exit(1))`;
  return spawnSync(process.execPath, ["-e", probe]).status === 0;
}

exports.config = {
  runner: "local",
  hostname: "127.0.0.1",
  port: APPIUM_PORT,
  specs: [path.join(__dirname, "specs", "**", "*.e2e.js")],
  maxInstances: 1,
  capabilities: [
    {
      platformName: "Android",
      "appium:automationName": "UiAutomator2",
      "appium:udid": FO_APP.udid,
      "appium:appPackage": FO_APP.appPackage,
      "appium:appActivity": FO_APP.appActivity,
      "appium:noReset": true, // keep the signed-in session, PIN and permissions between runs
      "appium:newCommandTimeout": 600,
      // The app's WebView is rarely "idle"; waiting for idle before every action costs seconds and its
      // timeouts precede the UiAutomation connection dropping. All waits in the suite are explicit instead.
      "appium:waitForIdleTimeout": 0,
      "appium:disableWindowAnimation": true,
    },
  ],
  // If the UiAutomator2 instrumentation drops mid-run, start a fresh session and rerun the spec.
  // Every step is idempotent (completed tasks are skipped, answered fields kept), so a retry resumes.
  specFileRetries: 2,
  specFileRetriesDelay: 5,
  logLevel: "warn",
  waitforTimeout: MOBILE_TIMEOUTS.default,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 2,
  services: appiumAlreadyRunning() ? [] : [["appium", { command: "appium", args: { port: APPIUM_PORT } }]],
  framework: "mocha",
  mochaOpts: {
    ui: "bdd",
    timeout: 60 * 60 * 1000, // safety limit per task; the 3-leader KYC task is the longest
    bail: true, // tasks run in a fixed order; Insurance Registration must stay last
  },
  reporters: ["spec", ["allure", { outputDir: path.join(__dirname, "..", "allure-results") }]],

  // Fail fast on a missing env key, then pre-grant runtime permissions so no system dialog interrupts the flow.
  onPrepare() {
    const missing = missingFoEnv();
    if (missing.length) throw new Error(`Missing in env/${process.env.TEST_ENV || "qa"}.env: ${missing.join(", ")}`);
    for (const p of FO_PERMISSIONS) {
      execSync(`adb -s ${FO_APP.udid} shell pm grant ${FO_APP.appPackage} android.permission.${p}`, { stdio: "ignore" });
    }
  },
};
