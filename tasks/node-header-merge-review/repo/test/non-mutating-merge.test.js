const test = require("node:test");
const assert = require("node:assert/strict");
const { mergeHeaders } = require("../src/headers");

test("mergeHeaders returns a new object instead of mutating defaults", () => {
  const defaults = { accept: "application/json" };
  const merged = mergeHeaders(defaults, { Authorization: "Bearer token" });

  assert.notStrictEqual(merged, defaults);
  assert.deepEqual(defaults, { accept: "application/json" });
  assert.deepEqual(merged, {
    accept: "application/json",
    authorization: "Bearer token",
  });
});
