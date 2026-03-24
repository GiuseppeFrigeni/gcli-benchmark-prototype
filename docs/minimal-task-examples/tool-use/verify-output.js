const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");

const [, , stdoutPath] = process.argv;
assert.equal(readFileSync(stdoutPath, "utf8").trim(), "Finding: local note inspected.");
