const test = require("node:test");
const assert = require("node:assert/strict");
const { hasKeyword } = require("../src/keywords");

test("hasKeyword stays case-insensitive", () => {
  assert.equal(hasKeyword("bug,feature request", "FEATURE REQUEST"), true);
});

test("hasKeyword ignores empty segments", () => {
  assert.equal(hasKeyword("bug,,docs", "docs"), true);
});
