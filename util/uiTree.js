// Minimal parser for the UiAutomator2 page-source XML, so screens can be classified locally from one
// snapshot instead of many round-trips to the device.

function parseAttrs(text) {
  const a = {};
  text.replace(/([\w-]+)="([^"]*)"/g, (_, k, v) => {
    a[k] = v;
    return "";
  });
  return a;
}

function parseUiXml(xml) {
  const root = { cls: "root", a: {}, children: [] };
  const stack = [root];
  const re = /<(\/?)([A-Za-z][\w.$]*)([^>]*?)(\/?)>/g;
  let m;
  while ((m = re.exec(xml))) {
    if (m[1] === "/") {
      if (stack.length > 1) stack.pop();
      continue;
    }
    const node = { cls: m[2], a: parseAttrs(m[3]), children: [] };
    stack[stack.length - 1].children.push(node);
    if (!m[4]) stack.push(node);
  }
  return root;
}

function walk(node, fn) {
  fn(node);
  for (const c of node.children) walk(c, fn);
}

function descendants(node) {
  const out = [];
  for (const c of node.children) walk(c, (n) => out.push(n));
  return out;
}

const idOf = (n) => (n.a["resource-id"] || "").split("/").pop();

// "[x1,y1][x2,y2]" -> { x1, y1, x2, y2 }
function parseBounds(bounds) {
  const m = /\[(\d+),(\d+)\]\[(\d+),(\d+)\]/.exec(bounds || "");
  return m ? { x1: +m[1], y1: +m[2], x2: +m[3], y2: +m[4] } : null;
}

module.exports = { parseUiXml, walk, descendants, idOf, parseBounds };
