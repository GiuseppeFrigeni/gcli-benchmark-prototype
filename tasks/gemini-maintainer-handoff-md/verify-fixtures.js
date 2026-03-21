const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");

const [, , summaryPath] = process.argv;
const summary = readFileSync(summaryPath, "utf8");

assert.match(summary, /infra_failed/, "expected infra failure summary");
assert.match(summary, /Rendering result\.\.\./, "expected leaked progress line evidence");
assert.match(summary, /test\/json-mode\.test\.js/, "expected rerun target");
