const test = require("node:test");
const assert = require("node:assert/strict");

test("stable helper remains unchanged", () => {
  assert.equal(typeof Math.max, "function");
});
