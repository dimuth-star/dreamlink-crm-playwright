// WebdriverIO config for the Field Officer app (step 2 of `npm run test:e2e:fo`).
// Device, app and FO credentials come from env/<TEST_ENV>.env (git-ignored).
const path = require("path");
const { execSync, spawnSync } = require("child_process");
const { loadEnvFile } = require("../util/helpers");

loadEnvFile(process.env.TEST_ENV || "qa");

const APPIUM_PORT = Number(process.env.APPIUM_PORT || 4723);
const UDID = process.env.ANDROID_UDID;

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
      "appium:udid": UDID,
      "appium:appPackage": process.env.FO_APP_PACKAGE,
      "appium:appActivity": process.env.FO_APP_ACTIVITY,
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
  waitforTimeout: 20000,
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

  // Pre-grant runtime permissions so no system dialog interrupts the flow.
  onPrepare() {
    if (!UDID || !process.env.FO_APP_PACKAGE) throw new Error("ANDROID_UDID / FO_APP_PACKAGE missing in env file");
    for (const p of ["CAMERA", "RECORD_AUDIO", "ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"]) {
      execSync(`adb -s ${UDID} shell pm grant ${process.env.FO_APP_PACKAGE} android.permission.${p}`, { stdio: "ignore" });
    }
  },
};
