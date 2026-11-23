// Hand-off between the three steps of the Field Officer end-to-end run
// (Playwright setup -> WebdriverIO mobile -> Playwright verify).
// Lives outside test-results/, which Playwright clears at the start of every run.
const fs = require("fs");
const path = require("path");

const STATE_FILE = path.resolve(__dirname, "../e2e-run/runState.json");

function writeRunState(state) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify({ ...state, writtenAt: new Date().toISOString() }, null, 2));
  return STATE_FILE;
}

function readRunState() {
  if (!fs.existsSync(STATE_FILE)) {
    throw new Error(`No run state at ${STATE_FILE}. Run the setup step (TC-FO-01, @fo-setup) first.`);
  }
  return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
}

function clearRunState() {
  if (fs.existsSync(STATE_FILE)) fs.unlinkSync(STATE_FILE);
}

module.exports = { writeRunState, readRunState, clearRunState };
