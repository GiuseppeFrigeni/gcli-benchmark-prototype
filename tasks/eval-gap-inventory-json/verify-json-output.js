const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");

const [, , stdoutPath, expectedPath] = process.argv;
const actual = JSON.parse(readFileSync(stdoutPath, "utf8"));
const expected = JSON.parse(readFileSync(expectedPath, "utf8"));
assert.deepEqual(actual, expected);
