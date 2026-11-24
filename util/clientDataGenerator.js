// Dynamic client data for the Field Officer end-to-end flow.
// Dates are always computed from "now", so the rules hold on any run date.

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

// Exactly `years` old: the birthday passed `extraDays` ago, so the age is `years` (never years-1 / years+1).
function dobForAge(years, extraDays = 30) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return addDays(d, -extraDays);
}

const daysAgo = (n) => addDays(new Date(), -n);
const daysAhead = (n) => addDays(new Date(), n);
const monthsAgo = (n) => addMonths(new Date(), -n);
const monthsAhead = (n) => addMonths(new Date(), n);

const randomInt = (min, max) =>
  min + Math.floor(Math.random() * (max - min + 1));
const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];
// n random digits, never starting with 0 (number inputs drop a leading zero)
const randomDigits = (n) =>
  String(randomInt(1, 9)) +
  Array.from({ length: n - 1 }, () => randomInt(0, 9)).join("");

// IDs and phones must not repeat within a run (3 leaders + their next of kin), so every value handed out
// is remembered. reserveId() marks a fixed value (e.g. the group's own phone) so it is never generated.
const issuedIds = new Set();
const reserveId = (id) => issuedIds.add(id);
function uniqueId(make) {
  let id = make();
  while (issuedIds.has(id)) id = make();
  issuedIds.add(id);
  return id;
}

// Zambian NRC format: ######/##/#
const randomNrc = () =>
  uniqueId(() => `${randomDigits(6)}/${randomDigits(2)}/1`);
// ZRA taxpayer identification number: 10 digits
const randomTpin = () => uniqueId(() => randomDigits(10));
// Zambian mobile in the +260 format the forms require: +260, an operator prefix, then 7 digits.
// The forms validate the prefix and the accepted set differs per environment (VF Dev: 97, 77, 96, 67),
// so the prefixes come from the fixture (client.mobilePrefixes): only ones every environment accepts.
const randomMobile = (prefixes) =>
  uniqueId(
    () =>
      `+260${pickRandom(prefixes)}${Array.from({ length: 7 }, () => randomInt(0, 9)).join("")}`,
  );

// A random first name, surname or "First Last" from the fixture's name lists (client.names).
function randomName(names, part) {
  if (part === "first") return pickRandom(names.first);
  if (part === "last") return pickRandom(names.last);
  return `${pickRandom(names.first)} ${pickRandom(names.last)}`;
}

// "0972583695" -> "+260972583695" (mobile forms require the +260 format)
function toZambianIntl(localNumber) {
  const digits = String(localNumber).replace(/\D/g, "");
  if (digits.startsWith("260")) return `+${digits}`;
  return `+260${digits.replace(/^0/, "")}`;
}

// Resolve a date token from the fixture: "dob", "daysAgo:30", "daysAhead:30", "monthsAgo:2", "monthsAhead:5",
// "today". "dob" gives a random age within client.dobAgeYears ({ min, max }) each time it is used.
function resolveDateToken(token, client) {
  if (token === "today") return new Date();
  if (token === "dob") {
    const { min, max } = client.dobAgeYears;
    return dobForAge(randomInt(min, max), client.dobExtraDays);
  }
  const [kind, n] = token.split(":");
  const num = Number(n);
  if (kind === "daysAgo") return daysAgo(num);
  if (kind === "daysAhead") return daysAhead(num);
  if (kind === "monthsAgo") return monthsAgo(num);
  if (kind === "monthsAhead") return monthsAhead(num);
  throw new Error(`Unknown date token "${token}"`);
}

module.exports = {
  toZambianIntl,
  resolveDateToken,
  randomName,
  randomNrc,
  randomTpin,
  randomMobile,
  reserveId,
};
