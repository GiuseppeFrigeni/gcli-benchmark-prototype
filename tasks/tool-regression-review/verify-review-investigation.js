const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");

const [, , stdoutPath, summaryPath] = process.argv;
const actual = readFileSync(stdoutPath, "utf8").trim();
const summary = JSON.parse(readFileSync(summaryPath, "utf8"));

assert.equal(
  actual,
  "Finding: The patch changes header precedence but still mutates caller defaults, so this regression should stay blocked until src/headers.js preserves a non-mutating merge.",
);
assert.ok((summary.counts.read_file ?? 0) >= 2, "expected at least two read_file calls");
assert.ok(
  summary.calls.some((call) => call.name === "read_file" && String(call.target).includes("fixtures/git-diff.patch")),
  "expected diff inspection",
);
assert.ok(
  summary.calls.some((call) => call.name === "read_file" && String(call.target).includes("fixtures/failing-command.stderr.txt")),
  "expected failure artifact inspection",
);
