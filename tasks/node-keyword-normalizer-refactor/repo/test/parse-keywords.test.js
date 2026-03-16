const test = require("node:test");
const assert = require("node:assert/strict");
const { parseKeywords } = require("../src/keywords");

test("parseKeywords trims whitespace while keeping lowercase output", () => {
  assert.deepEqual(parseKeywords("bug, Feature Request , docs "), [
    "bug",
    "feature request",
    "docs",
  ]);
});
