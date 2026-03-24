const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");

const [, , stdoutPath, expectedPath] = process.argv;
assert.deepEqual(
  JSON.parse(readFileSync(stdoutPath, "utf8")),
  JSON.parse(readFileSync(expectedPath, "utf8")),
);
