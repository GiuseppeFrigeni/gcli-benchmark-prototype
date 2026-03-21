const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");

const [, , stdoutPath, expectedPath] = process.argv;
const rawOutput = readFileSync(stdoutPath, "utf8").trim();
assert.notEqual(rawOutput, "", "agent stdout was empty");

const actual = JSON.parse(rawOutput);
const expected = JSON.parse(readFileSync(expectedPath, "utf8"));
assert.deepEqual(actual, expected);
