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
function dobForAge(years = 18, extraDays = 30) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return addDays(d, -extraDays);
}

const daysAgo = (n) => addDays(new Date(), -n);
const daysAhead = (n) => addDays(new Date(), n);
const monthsAhead = (n) => addMonths(new Date(), n);

// "0972583695" -> "+260972583695" (mobile forms require the +260 format)
function toZambianIntl(localNumber) {
  const digits = String(localNumber).replace(/\D/g, "");
  if (digits.startsWith("260")) return `+${digits}`;
  return `+260${digits.replace(/^0/, "")}`;
}

// Resolve a date token from the fixture: "dob", "daysAgo:30", "daysAhead:30", "monthsAhead:5", "today"
function resolveDateToken(token, client) {
  if (token === "today") return new Date();
  if (token === "dob")
    return dobForAge(client.dobAgeYears, client.dobExtraDays);
  const [kind, n] = token.split(":");
  const num = Number(n);
  if (kind === "daysAgo") return daysAgo(num);
  if (kind === "daysAhead") return daysAhead(num);
  if (kind === "monthsAhead") return monthsAhead(num);
  throw new Error(`Unknown date token "${token}"`);
}

module.exports = { toZambianIntl, resolveDateToken };
