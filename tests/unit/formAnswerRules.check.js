// Standalone check of util/formAnswerRules.js against the real fixture (no device, no browser).
// Run: npm run test:form-rules. Expected values are what the FO forms received in passing device runs.
const assert = require("node:assert/strict");
const { FormAnswerRules, isoDate } = require("../../util/formAnswerRules");
const foData = require("../../data/foEndToEnd.json");

const rules = new FormAnswerRules({ formAnswers: foData.formAnswers, client: foData.client, group: foData.upload });
const daysFromToday = (date) => Math.round((date - new Date()) / 86400000);
const checks = [];
const check = (name, fn) => checks.push([name, fn]);

check("tokens come from the uploaded group and client", () => {
  assert.equal(rules.tokens["{{members}}"], String(foData.upload.memberCount));
  assert.equal(rules.tokens["{{mobileIntl}}"], "+260972583695");
  assert.equal(rules.tokens["{{idType}}"], "NRC");
});

check("number and text inputs", () => {
  assert.deepEqual(rules.inputValue("What's the requested loan term (in months) ?"), { value: "3", fromRule: true, kind: "number" });
  assert.deepEqual(rules.inputValue("What is the group's requested loan amount?"), { value: "20000", fromRule: true, kind: "number" });
  assert.deepEqual(rules.inputValue("Mobile number"), { value: "+260972583695", fromRule: true, kind: "text" });
  assert.deepEqual(rules.inputValue("How many members are present today?"), { value: "10", fromRule: true, kind: "number" });
  assert.deepEqual(rules.inputValue("What is the purpose of the loan?"), { value: "QA Test", fromRule: false, kind: "text" });
});

check("booleans", () => {
  assert.equal(rules.booleanValue("Is the client a politically exposed person?"), "No");
  assert.equal(rules.booleanValue("Does the group keep minutes?"), "Yes");
});

check("dates (rule wins, default otherwise)", () => {
  const dob = rules.dateFor("Date of Birth");
  assert.equal(dob.fromRule, true);
  assert.equal(new Date().getFullYear() - dob.date.getFullYear(), foData.client.dobAgeYears);
  assert.equal(daysFromToday(rules.dateFor("ID Issued Date").date), -30);
  assert.equal(daysFromToday(rules.dateFor("When is the next share-out?").date), 30);
  assert.deepEqual([rules.dateFor("What is group opening date?").fromRule, daysFromToday(rules.dateFor("What is group opening date?").date)], [false, -30]);
  assert.match(isoDate(new Date(2026, 9, 4)), /^2026-10-04$/);
});

check("dropdown choices seen in passing runs", () => {
  assert.equal(rules.dropdownChoice("How many times do they meet in a month?", ["Monthly", "Bi-Weekly", "Weekly"]), "Monthly");
  assert.equal(rules.dropdownChoice("How well did the chairperson lead the group meeting?", ["1", "2", "3", "5", "6"]), "5");
  assert.equal(rules.dropdownChoice("Rating", ["1", "2", "3"]), "3"); // no "5": highest option
  assert.equal(rules.dropdownChoice("Type of ID used", ["NRC", "Driver's License"]), "NRC");
  const provinces = ["Copperbelt", "Southern", "Central"];
  assert.equal(rules.dropdownChoice("What province is the group located in?", provinces, { popup: true }), "Southern");
  assert.equal(rules.dropdownChoice("What province is the group located in?", provinces), "Copperbelt");
});

check("unique dropdowns give each leader a different position", () => {
  const used = new Set();
  const options = ["Chairperson", "Secretary", "Treasurer"];
  for (const expected of options) {
    const pick = rules.dropdownChoice("Position in the group", options, { used });
    assert.equal(pick, expected);
    used.add(pick);
  }
});

let failed = 0;
for (const [name, fn] of checks) {
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (e) {
    failed++;
    console.log(`  FAIL ${name}\n       ${e.message.split("\n").join("\n       ")}`);
  }
}
console.log(failed ? `\n${failed} of ${checks.length} checks failed` : `\nall ${checks.length} checks passed`);
process.exit(failed ? 1 : 0);
