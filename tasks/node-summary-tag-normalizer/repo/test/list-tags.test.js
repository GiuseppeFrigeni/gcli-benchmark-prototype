const test = require("node:test");
const assert = require("node:assert/strict");
const { listTags } = require("../src/summary");

test("tag listing matches lookup normalization", () => {
  assert.deepEqual(listTags("  Alpha, beta ,ALPHA , ,Gamma "), [
    "alpha",
    "beta",
    "alpha",
    "gamma",
  ]);
});
