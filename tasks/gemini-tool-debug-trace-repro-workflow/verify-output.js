const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");

const [, , stdoutPath, summaryPath] = process.argv;
const actual = readFileSync(stdoutPath, "utf8").trim();
const summary = JSON.parse(readFileSync(summaryPath, "utf8"));

assert.equal(
  actual,
  "Next step: keep the trace repro command, then patch `fixtures/render-run.js` to skip the spinner log when JSON mode is enabled.",
);
assert.ok(
  summary.calls.some((call) => call.name === "run_shell_command" && String(call.target).includes("print-trace.js")),
  "expected repro command execution",
);
assert.ok(
  summary.calls.some((call) => call.name === "read_file" && String(call.target).includes("fixtures/render-run.js")),
  "expected render source inspection",
);
