// Which answer each Field Officer form question gets. Pure logic (no device calls), driven by
// data/foEndToEnd.json -> formAnswers; checked by `npm run test:form-rules`.
const { resolveDateToken, toZambianIntl } = require("./clientDataGenerator");

// The answer keys a rule may use for each kind of question.
const ANSWER_KEYS_BY_KIND = {
  input: ["text", "number"],
  date: ["date"],
  dropdown: ["option"],
  boolean: ["bool"],
};

const isNumeric = (text) => /^\d+$/.test(text);
const pad = (n) => String(n).padStart(2, "0");
// The app shows dates as YYYY-MM-DD.
const isoDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

class FormAnswerRules {
  // group: the uploaded group's fixture block, so member count and phone always match what CRM holds
  constructor({ formAnswers, client, group }) {
    this.client = client;
    this.defaults = formAnswers.defaults;
    this.tokens = {
      "{{members}}": String(group.memberCount),
      "{{mobileIntl}}": toZambianIntl(group.phoneNumber),
      "{{idNumber}}": client.idNumber,
      "{{idType}}": client.idType,
    };
    this.rules = formAnswers.rules.map((r) => ({ re: new RegExp(r.pattern, "i"), answer: r.answer }));
    this.unique = (formAnswers.uniquePerForm || []).map((p) => new RegExp(p, "i"));
  }

  resolve(value) {
    return typeof value === "string" ? this.tokens[value] ?? value : value;
  }

  // First rule whose pattern matches the title AND whose answer fits the question kind.
  ruleFor(title, kind) {
    const keys = ANSWER_KEYS_BY_KIND[kind] || [];
    for (const { re, answer } of this.rules) {
      if (!re.test(title)) continue;
      const key = keys.find((k) => answer[k] !== undefined);
      if (key) return { key, value: this.resolve(answer[key]) };
    }
    return null;
  }

  // Questions whose answer must differ within one form (e.g. each leader's "Position in the group").
  isUnique(title) {
    return this.unique.some((re) => re.test(title));
  }

  booleanValue(title) {
    const rule = this.ruleFor(title, "boolean");
    return rule ? rule.value : this.defaults.bool;
  }

  // { date, fromRule }: a prefilled date is kept only when no rule covers the question.
  dateFor(title) {
    const rule = this.ruleFor(title, "date");
    return { date: resolveDateToken(rule ? rule.value : this.defaults.date, this.client), fromRule: !!rule };
  }

  // { value, fromRule, kind }: kind is "number" only for a number rule (used for the log line).
  inputValue(title) {
    const rule = this.ruleFor(title, "input");
    if (!rule) return { value: this.defaults.text, fromRule: false, kind: "text" };
    return { value: String(rule.value), fromRule: true, kind: rule.key === "number" ? "number" : "text" };
  }

  // The option to pick from `options`. `used`: options already picked for this title in this form.
  dropdownChoice(title, options, { used = new Set(), popup = false } = {}) {
    const rule = this.ruleFor(title, "dropdown");
    if (rule && options.includes(rule.value)) return rule.value;
    if (this.isUnique(title)) return options.find((o) => !used.has(o)) || options[0];
    if (options.length && options.every(isNumeric)) {
      return options.includes(this.defaults.rating) ? this.defaults.rating : options[options.length - 1];
    }
    if (options.includes(this.defaults.bool)) return this.defaults.bool;
    // popup variant: Enter on the first option does not commit, so prefer the second option
    return popup && options.length > 1 ? options[1] : options[0];
  }
}

module.exports = { FormAnswerRules, isoDate, isNumeric };
