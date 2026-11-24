// WebdriverIO config for the Field Officer "Unable to Continue" flow (step 2 of `npm run test:e2e:fo:utc`).
// Same device, app, retries / FO_STRICT and summary line as the happy path (wdio.conf.js); only the spec differs.
const path = require("path");
const { config } = require("./wdio.conf");

exports.config = {
  ...config,
  specs: [path.join(__dirname, "specs", "foUnableToContinue.e2e.js")],
  // the two scenarios use different groups, so a failure in one does not stop the other
  mochaOpts: { ...config.mochaOpts, bail: false },
};
