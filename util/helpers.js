const path = require("path");
const fs = require("fs");

function loadEnvFile(envName = "qa") {
  const envPath = path.resolve(__dirname, `../env/${envName}.env`);
  if (!fs.existsSync(envPath)) {
    console.warn(`Env file not found: ${envPath}`);
    return;
  }
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (key && rest.length) {
      process.env[key.trim()] = rest.join("=").trim();
    }
  }
}

function getCredentials() {
  return {
    username: process.env.TEST_USERNAME,
    password: process.env.TEST_PASSWORD,
    displayName: process.env.TEST_DISPLAY_NAME,
  };
}

// Field Officer app (mobile/): device, app and FO login, all from env/<TEST_ENV>.env.
const FO_REQUIRED_ENV = [
  "ANDROID_UDID",
  "FO_APP_PACKAGE",
  "FO_APP_ACTIVITY",
  "FO_USERNAME",
  "FO_PASSWORD",
  "FO_PIN",
];

function getFoApp() {
  return {
    udid: process.env.ANDROID_UDID,
    appPackage: process.env.FO_APP_PACKAGE,
    appActivity: process.env.FO_APP_ACTIVITY,
  };
}

function getFoCredentials() {
  return {
    username: process.env.FO_USERNAME,
    password: process.env.FO_PASSWORD,
    pin: process.env.FO_PIN,
  };
}

// The Field Officer tasks are assigned to in CRM: the user who signs in to the app (FO_USERNAME,
// also the assignee search term) and the name CRM shows for them (FO_DISPLAY_NAME).
function getFoAssignee() {
  const username = process.env.FO_USERNAME;
  const displayName = process.env.FO_DISPLAY_NAME;
  if (!username || !displayName) {
    throw new Error(
      `FO_USERNAME and FO_DISPLAY_NAME must be set in env/${process.env.TEST_ENV || "qa"}.env`,
    );
  }
  return { username, displayName };
}

// TC-CL-02/03 classify a real DreamSave group, which creates a lead / pre lead and cannot be undone.
// An environment whose groups must not be changed sets CLASSIFY_GROUPS=false in its env file.
function classificationAllowed() {
  return process.env.CLASSIFY_GROUPS !== "false";
}

function missingFoEnv() {
  return FO_REQUIRED_ENV.filter((key) => !process.env[key]);
}

module.exports = {
  loadEnvFile,
  getCredentials,
  getFoApp,
  getFoCredentials,
  getFoAssignee,
  classificationAllowed,
  missingFoEnv,
};
