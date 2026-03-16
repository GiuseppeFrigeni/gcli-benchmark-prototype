const test = require("node:test");
const assert = require("node:assert/strict");
const { mergeHeaders } = require("../src/headers");

test("mergeHeaders keeps defaults when overrides are nullish", () => {
  assert.deepEqual(
    mergeHeaders({ accept: "application/json" }, { Authorization: null, "X-Trace": undefined }),
    { accept: "application/json" },
  );
});
