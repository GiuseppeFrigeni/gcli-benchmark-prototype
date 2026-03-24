const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");

const [, , stdoutPath, expectedPath] = process.argv;
const actual = readFileSync(stdoutPath, "utf8").trim();
const expected = readFileSync(expectedPath, "utf8").trim();

assert.equal(actual, expected);
