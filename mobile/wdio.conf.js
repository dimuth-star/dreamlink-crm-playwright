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

// FO_STRICT=1: no spec retries, so a run only passes if it is clean (use it for stability runs).
const STRICT = process.env.FO_STRICT === "1";
const SPEC_FILE_RETRIES = STRICT ? 0 : 2;
// Each finished worker is one attempt at the spec: more than one attempt means a retry was needed.
const attempts = [];

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
  // Every step is idempotent (done steps are skipped, answered fields kept), so a retry resumes.
  // A pass that needed a retry is reported as such by onComplete (see below).
  specFileRetries: SPEC_FILE_RETRIES,
  specFileRetriesDelay: 5,
  logLevel: "warn",
  waitforTimeout: MOBILE_TIMEOUTS.default,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 2,
  services: appiumAlreadyRunning() ? [] : [["appium", { command: "appium", args: { port: APPIUM_PORT } }]],
  framework: "mocha",
  mochaOpts: {
    ui: "bdd",
    timeout: MOBILE_TIMEOUTS.task,
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

  onWorkerEnd(cid, exitCode) {
    attempts.push(exitCode);
  },

  // One summary line, so a green run that needed a retry is never mistaken for a clean one.
  onComplete(exitCode) {
    const retries = Math.max(0, attempts.length - 1);
    const mode = STRICT ? "FO_STRICT=1, retries off" : `retries allowed: ${SPEC_FILE_RETRIES}`;
    let result;
    if (exitCode !== 0) result = `FAILED after ${attempts.length} attempt(s)`;
    else if (retries) result = `PASSED AFTER ${retries} RETR${retries > 1 ? "IES" : "Y"} - not a clean run`;
    else result = "PASSED cleanly, no retries";
    console.log(`\n=== FO mobile summary: ${result} [${mode}]\n`);
  },
};
