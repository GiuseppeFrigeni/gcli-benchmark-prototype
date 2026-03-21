const test = require("node:test");
const assert = require("node:assert/strict");
const { hasTag } = require("../src");

test("case-insensitive tag lookup keeps working", () => {
  assert.equal(hasTag(" Alpha, Beta , gamma ", "beta"), true);
  assert.equal(hasTag(" Alpha, Beta , gamma ", "delta"), false);
});
