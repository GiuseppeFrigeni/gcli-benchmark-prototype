const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");

const [, , stdoutPath, summaryPath] = process.argv;
const actual = readFileSync(stdoutPath, "utf8").trim();
const summary = JSON.parse(readFileSync(summaryPath, "utf8"));

assert.equal(
  actual,
  "Root cause: The JSON renderer logs `Rendering result...` before serializing the payload, so `--json` mode mixes human progress text into machine-readable output (src/commands/render.js).",
);
assert.ok((summary.counts.read_file ?? 0) >= 2, "expected at least two read_file calls");
assert.ok(
  summary.calls.some((call) => call.name === "read_file" && String(call.target).includes("src/commands/render.js")),
  "expected render source inspection",
);
assert.ok(
  summary.calls.some((call) => call.name === "read_file" && String(call.target).includes("test/json-mode.test.js")),
  "expected json-mode test inspection",
);
