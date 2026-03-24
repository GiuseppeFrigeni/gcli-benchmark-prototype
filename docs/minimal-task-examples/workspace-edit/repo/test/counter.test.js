const test = require("node:test");
const assert = require("node:assert/strict");
const { increment } = require("../src/counter");

test("increment adds one", () => {
  assert.equal(increment(2), 3);
});
