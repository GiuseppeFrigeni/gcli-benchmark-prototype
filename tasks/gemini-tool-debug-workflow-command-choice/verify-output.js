const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");

const [, , stdoutPath, summaryPath] = process.argv;
const actual = readFileSync(stdoutPath, "utf8").trim();
const summary = JSON.parse(readFileSync(summaryPath, "utf8"));

assert.equal(
  actual,
  "Workflow: Start with `node --test test/repro-json.test.js`; it reproduces that src/render-json.js prepends `Preview:` ahead of the JSON payload in machine mode.",
);
assert.ok((summary.counts.run_shell_command ?? 0) >= 1, "expected a reproduction command");
