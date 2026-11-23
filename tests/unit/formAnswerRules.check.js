// Standalone check of util/formAnswerRules.js against the real fixture (no device, no browser).
// Run: npm run test:form-rules. Expected values are what the FO forms received in passing device runs.
const assert = require("node:assert/strict");
const { FormAnswerRules, isoDate } = require("../../util/formAnswerRules");
const foData = require("../../data/foEndToEnd.json");

const rules = new FormAnswerRules({
  formAnswers: foData.formAnswers,
  client: foData.client,
  group: foData.upload,
});
const daysFromToday = (date) => Math.round((date - new Date()) / 86400000);
const MOBILE_FORMAT = /^\+260(95|96|97|76|77)\d{7}$/;
const checks = [];
const check = (name, fn) => checks.push([name, fn]);

check("tokens come from the uploaded group and client", () => {
  assert.equal(rules.tokens["{{members}}"], String(foData.upload.memberCount));
  assert.equal(rules.tokens["{{mobileIntl}}"], "+260972583695");
  assert.equal(rules.tokens["{{idType}}"], "NRC");
});

check("number and text inputs", () => {
  assert.deepEqual(
    rules.inputValue("What's the requested loan term (in months) ?"),
    { value: "3", fromRule: true, kind: "number" },
  );
  assert.deepEqual(
    rules.inputValue("What is the group's requested loan amount?"),
    { value: "20000", fromRule: true, kind: "number" },
  );
  // a person's phone is a random Zambian mobile; the group contact keeps the uploaded number
  assert.match(rules.inputValue("Mobile number").value, MOBILE_FORMAT);
  assert.deepEqual(
    rules.inputValue("What is the phone number of the main contact person?"),
    { value: "+260972583695", fromRule: true, kind: "text" },
  );
  assert.deepEqual(rules.inputValue("How many members are present today?"), {
    value: "10",
    fromRule: true,
    kind: "number",
  });
  assert.deepEqual(rules.inputValue("What is the purpose of the loan?"), {
    value: "Expand the group's farming business",
    fromRule: true,
    kind: "text",
  });
  assert.equal(rules.inputValue("District").value, foData.upload.district);
  assert.equal(rules.inputValue("Street").value, "Plot 12, Cairo Road");
  assert.equal(
    rules.inputValue("Next of Kin Address").value,
    "Plot 12, Cairo Road",
  );
  assert.equal(rules.inputValue("Anything else to add?").value, "QA Test"); // default
});

check("booleans", () => {
  assert.equal(
    rules.booleanValue("Is the client a politically exposed person?"),
    "No",
  );
  assert.equal(rules.booleanValue("Does the group keep minutes?"), "Yes");
});

check("dates (rule wins, default otherwise)", () => {
  const { min, max } = foData.client.dobAgeYears;
  for (let i = 0; i < 20; i++) {
    const dob = rules.dateFor("Date of Birth");
    const age = new Date().getFullYear() - dob.date.getFullYear();
    assert.equal(dob.fromRule, true);
    assert.ok(age >= min && age <= max, `age ${age} outside ${min}-${max}`);
  }
  assert.equal(daysFromToday(rules.dateFor("ID Issued Date").date), -30);
  assert.equal(
    daysFromToday(rules.dateFor("When is the next share-out?").date),
    30,
  );
  // group opening date: 2 months before the run date (59-62 days, depending on the months)
  const opening = rules.dateFor("What is group opening date?");
  const openingDays = daysFromToday(opening.date);
  assert.equal(opening.fromRule, true);
  assert.ok(openingDays <= -59 && openingDays >= -62, `${openingDays} days`);
  assert.match(isoDate(new Date(2026, 9, 4)), /^2026-10-04$/);
});

check("dropdown choices seen in passing runs", () => {
  assert.equal(
    rules.dropdownChoice("How many times do they meet in a month?", [
      "Monthly",
      "Bi-Weekly",
      "Weekly",
    ]),
    "Monthly",
  );
  assert.equal(
    rules.dropdownChoice(
      "How well did the chairperson lead the group meeting?",
      ["1", "2", "3", "5", "6"],
    ),
    "5",
  );
  assert.equal(rules.dropdownChoice("Rating", ["1", "2", "3"]), "3"); // no "5": highest option
  assert.equal(
    rules.dropdownChoice("Type of ID used", ["NRC", "Driver's License"]),
    "NRC",
  );
  const provinces = ["Copperbelt", "Southern", "Central"];
  assert.equal(
    rules.dropdownChoice("What province is the group located in?", provinces, {
      popup: true,
    }),
    "Southern",
  );
  assert.equal(
    rules.dropdownChoice("What province is the group located in?", provinces),
    "Copperbelt",
  );
});

check("unique dropdowns give each leader a different position", () => {
  const used = new Set();
  const options = ["Chairperson", "Secretary", "Treasurer"];
  for (const expected of options) {
    const pick = rules.dropdownChoice("Position in the group", options, {
      used,
    });
    assert.equal(pick, expected);
    used.add(pick);
  }
});

check("name fields get a random name from the fixture lists", () => {
  const { first, last } = foData.client.names;
  const firstName = rules.inputValue("First Name");
  assert.equal(firstName.fromRule, true);
  assert.ok(first.includes(firstName.value), firstName.value);
  assert.ok(last.includes(rules.inputValue("Surname").value));
  for (const title of ["Next of Kin Name", "Facilitator"]) {
    const [f, l] = rules.inputValue(title).value.split(" ");
    assert.ok(first.includes(f) && last.includes(l), `${title}: ${f} ${l}`);
  }
  // other fields must not be caught by the name rules (a rule would overwrite a prefilled value)
  assert.equal(rules.inputValue("Group Name").fromRule, false);
  assert.equal(
    rules.inputValue("What is the name of the group's main contact person?")
      .fromRule,
    false,
  );
  assert.equal(rules.inputValue("Facilitating NGO").fromRule, false);
});

check("NRC, TPIN and phone are well formed and never repeat", () => {
  const nrcs = new Set();
  const tpins = new Set();
  const phones = new Set();
  for (let i = 0; i < 50; i++) {
    const nrc = rules.inputValue("Next of Kin ID Number").value;
    const tpin = rules.inputValue("TPIN").value;
    const phone = rules.inputValue("Telephone Number").value;
    assert.match(nrc, /^[1-9]\d{5}\/[1-9]\d\/1$/);
    assert.match(tpin, /^[1-9]\d{9}$/);
    assert.match(phone, MOBILE_FORMAT);
    assert.notEqual(phone, "+260972583695"); // the group contact's number is reserved
    nrcs.add(nrc);
    tpins.add(tpin);
    phones.add(phone);
  }
  assert.deepEqual([nrcs.size, tpins.size, phones.size], [50, 50, 50]);
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
