// Search keywords built at run time, so search tests do not depend on records that a QA data reset removes.

// A keyword no record can match: the fixture prefix plus the current time.
function noMatchKeyword(prefix) {
  return `${prefix}${Date.now()}`;
}

// The word (3+ letters) found in the most names, if at least two names share it; otherwise null.
// Used by "broad keyword" searches that must return more than one result.
function sharedWord(names) {
  const counts = new Map();
  for (const name of names) {
    const words = new Set(name.toLowerCase().match(/[a-z]{3,}/g) || []);
    for (const word of words) counts.set(word, (counts.get(word) || 0) + 1);
  }
  let best = null;
  for (const [word, count] of counts) {
    if (count >= 2 && (!best || count > counts.get(best))) best = word;
  }
  return best;
}

module.exports = { noMatchKeyword, sharedWord };
