const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");

const [, , stdoutPath] = process.argv;
assert.equal(
  readFileSync(stdoutPath, "utf8").trim(),
  "Finding: src/commands/models.js always calls `renderTextOutput`, so `--json` responses never reach the JSON branch in src/renderers/output.js.",
);
