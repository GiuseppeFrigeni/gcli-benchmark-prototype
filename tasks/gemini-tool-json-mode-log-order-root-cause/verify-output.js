const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");

const [, , stdoutPath, summaryPath] = process.argv;
const actual = readFileSync(stdoutPath, "utf8").trim();
const summary = JSON.parse(readFileSync(summaryPath, "utf8"));

assert.equal(
  actual,
  "Root cause: src/commands/run.js prints `Starting task execution...` before the JSON payload, so `gemini run --json` mixes human progress text into machine-readable stdout (src/commands/run.js).",
);
assert.ok(
  summary.calls.some((call) => call.name === "read_file" && String(call.target).includes("fixtures/run-json-output.txt")),
  "expected output log inspection",
);
assert.ok(
  summary.calls.some((call) => call.name === "read_file" && String(call.target).includes("fixtures/src-commands-run.js")),
  "expected run source inspection",
);
