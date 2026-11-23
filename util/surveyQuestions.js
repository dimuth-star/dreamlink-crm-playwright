// Reads the FO app's SurveyJS questions out of ONE UiAutomator2 page-source snapshot, so a whole screen
// is classified locally instead of with many round-trips to the device. Questions are exposed as
// sq_N (question), sq_N_ariaTitle (title) and sq_Ni (its input); sp_N are panels.
const { MOBILE_TEXT, ANDROID_CLASS } = require("../common/mobileSelectors");
const {
  parseUiXml,
  walk,
  descendants,
  idOf,
  parseBounds,
} = require("./uiTree");

const QUESTION_ID = /^sq_\d+$/;

// The single place that decides a question's kind. "unknown" means its controls are not in the
// snapshot yet (below the fold); "container" is a dynamic panel whose child questions are answered one by one.
function classifyQuestion(qid, node, byId, title) {
  const inner = descendants(node);
  const has = (pred) => inner.some(pred);
  const input = byId.get(`${qid}i`);
  const cls = input ? input.cls : "";
  const hasLocation = (n) => (n.a.text || "").includes(MOBILE_TEXT.getLocation);
  if (
    has(
      (n) =>
        /^sp_/.test(idOf(n)) || (QUESTION_ID.test(idOf(n)) && idOf(n) !== qid),
    )
  )
    return "container";
  if (hasLocation(node) || has(hasLocation)) return "location";
  if (
    has(
      (n) =>
        n.a.text === MOBILE_TEXT.selectFile ||
        n.a["content-desc"] === MOBILE_TEXT.filePreview,
    ) ||
    (input && input.a.text === MOBILE_TEXT.noFileChosen)
  )
    return "file";
  if (cls === ANDROID_CLASS.switch) return "boolean";
  if (cls === ANDROID_CLASS.datePicker) return "date";
  if (
    has(
      (n) =>
        n.cls.endsWith("Button") && n.a.text === MOBILE_TEXT.dropdownSelect,
    )
  )
    return "dropdown";
  if (cls === ANDROID_CLASS.editText) return "input";
  if (/signature/i.test(title)) return "signature";
  return "unknown";
}

// { viewport, questions: [{ qid, title, kind, box, displayed }] } in document order.
// title is "(untitled sq_N)" when the title node is not in the snapshot; box is the on-screen
// position of the control (its input if present, else the question).
function readSurveySnapshot(xml) {
  const tree = parseUiXml(xml);
  let viewport = null;
  const byId = new Map();
  walk(tree, (n) => {
    if (!viewport && n.a.scrollable === "true")
      viewport = parseBounds(n.a.bounds);
    const id = idOf(n);
    if (id && !byId.has(id)) byId.set(id, n);
  });
  const questions = [];
  for (const [qid, node] of byId) {
    if (!QUESTION_ID.test(qid)) continue;
    const titleNode = byId.get(`${qid}_ariaTitle`);
    const title = titleNode
      ? (titleNode.a.text || "").trim()
      : `(untitled ${qid})`;
    const anchor = byId.get(`${qid}i`) || node;
    questions.push({
      qid,
      title,
      kind: classifyQuestion(qid, node, byId, title),
      box: parseBounds(anchor.a.bounds),
      displayed: node.a.displayed !== "false",
    });
  }
  return { viewport, questions };
}

// Question ids on screen, in numeric order (used to detect that the form moved to another page).
function questionIdsIn(xml) {
  return [
    ...new Set([...xml.matchAll(/resource-id="(sq_\d+)"/g)].map((m) => m[1])),
  ].sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)));
}

module.exports = { readSurveySnapshot, questionIdsIn };
