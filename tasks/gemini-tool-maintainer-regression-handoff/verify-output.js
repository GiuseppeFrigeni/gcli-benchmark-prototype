const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");

const [, , stdoutPath] = process.argv;
assert.equal(
  readFileSync(stdoutPath, "utf8").trim(),
  [
    "Severity: medium",
    "Owner: src/commands/models.js",
    "Next step: Block the change until `--json` output stops emitting the `Loaded 7 models` banner ahead of the serialized payload.",
  ].join("\n"),
);
