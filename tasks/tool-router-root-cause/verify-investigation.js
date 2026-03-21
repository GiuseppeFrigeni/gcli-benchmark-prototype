const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");

const [, , stdoutPath, summaryPath] = process.argv;
const actual = readFileSync(stdoutPath, "utf8").trim();
const summary = JSON.parse(readFileSync(summaryPath, "utf8"));

assert.equal(
  actual,
  "Root cause: Router.match looks up the raw incoming path instead of normalizing it first, so `/docs/` misses the `/docs` route (src/router.js).",
);
assert.ok((summary.counts.read_file ?? 0) >= 2, "expected at least two read_file calls");
assert.ok(
  summary.calls.some((call) => call.name === "read_file" && String(call.target).includes("src/router.js")),
  "expected router source inspection",
);
assert.ok(
  summary.calls.some((call) => call.name === "read_file" && String(call.target).includes("test/trailing-slash.test.js")),
  "expected failing test inspection",
);
