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
const FO_REQUIRED_ENV = ["ANDROID_UDID", "FO_APP_PACKAGE", "FO_APP_ACTIVITY", "FO_USERNAME", "FO_PASSWORD", "FO_PIN"];

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

function missingFoEnv() {
  return FO_REQUIRED_ENV.filter((key) => !process.env[key]);
}

module.exports = { loadEnvFile, getCredentials, getFoApp, getFoCredentials, missingFoEnv };
