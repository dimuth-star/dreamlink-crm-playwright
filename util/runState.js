// Hand-off between the three steps of a Field Officer end-to-end run
// (Playwright setup -> WebdriverIO mobile -> Playwright verify).
// Lives outside test-results/, which Playwright clears at the start of every run.
// Each flow has its own file: the happy path (`npm run test:e2e:fo`) uses the default runState.json,
// other flows pass their own file name (e.g. foUnableToContinue.json).
const fs = require("fs");
const path = require("path");

const RUN_DIR = path.resolve(__dirname, "../e2e-run");
const DEFAULT_FILE = "runState.json";

function statePath(fileName = DEFAULT_FILE) {
  return path.join(RUN_DIR, fileName);
}

function writeRunState(state, fileName) {
  const file = statePath(fileName);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(
    file,
    JSON.stringify({ ...state, writtenAt: new Date().toISOString() }, null, 2),
  );
  return file;
}

function readRunState(fileName) {
  const file = statePath(fileName);
  if (!fs.existsSync(file)) {
    throw new Error(
      `No run state at ${file}. Run the setup step of this flow (@fo-setup / @fu-setup) first.`,
    );
  }
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

// Shallow merge into the existing state (e.g. the mobile step adding what it chose).
function updateRunState(patch, fileName) {
  const file = statePath(fileName);
  const current = fs.existsSync(file)
    ? JSON.parse(fs.readFileSync(file, "utf-8"))
    : {};
  return writeRunState({ ...current, ...patch }, fileName);
}

function clearRunState(fileName) {
  const file = statePath(fileName);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

module.exports = {
  writeRunState,
  readRunState,
  updateRunState,
  clearRunState,
};
