const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");

const [, , stdoutPath, summaryPath] = process.argv;
const actual = readFileSync(stdoutPath, "utf8").trim();
const summary = JSON.parse(readFileSync(summaryPath, "utf8"));

assert.equal(
  actual,
  "Root cause: src/commands/run.js prepends `Running Gemini task...` before the JSON payload, so `gemini run --json` is no longer machine-readable (src/commands/run.js).",
);
assert.ok((summary.counts.read_file ?? 0) >= 2, "expected at least two read_file calls");
