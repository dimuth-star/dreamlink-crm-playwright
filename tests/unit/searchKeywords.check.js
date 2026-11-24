// Standalone check of util/searchKeywords.js (no browser). Run: npm run test:search-keywords.
const assert = require("node:assert/strict");
const { noMatchKeyword, sharedWord } = require("../../util/searchKeywords");

const checks = [];
const check = (name, fn) => checks.push([name, fn]);

check("no-match keyword keeps the prefix and adds the time", () => {
  assert.match(noMatchKeyword("zz-no-match-"), /^zz-no-match-\d{13}$/);
});

check("shared word is the one found in the most names", () => {
  const names = [
    "ZM Lusaka Region",
    "Lusaka Branch",
    "Lusaka FO",
    "Kabwe region",
  ];
  assert.equal(sharedWord(names), "lusaka");
});

check("a word counts once per name and short words are ignored", () => {
  assert.equal(
    sharedWord(["Test test group", "Other group", "FO FO"]),
    "group",
  );
});

check("no shared word gives null", () => {
  assert.equal(sharedWord(["Alpha", "Beta", "Gamma"]), null);
  assert.equal(sharedWord([]), null);
});

let failed = 0;
for (const [name, fn] of checks) {
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (e) {
    failed++;
    console.log(
      `  FAIL ${name}\n       ${e.message.split("\n").join("\n       ")}`,
    );
  }
}
console.log(
  failed
    ? `\n${failed} of ${checks.length} checks failed`
    : `\nall ${checks.length} checks passed`,
);
process.exit(failed ? 1 : 0);
