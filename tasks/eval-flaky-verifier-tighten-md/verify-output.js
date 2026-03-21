const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");

const [, , stdoutPath, expectedPath] = process.argv;
assert.equal(readFileSync(stdoutPath, "utf8").trim(), readFileSync(expectedPath, "utf8").trim());
