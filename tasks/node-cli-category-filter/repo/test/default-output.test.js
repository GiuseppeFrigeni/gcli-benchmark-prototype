const test = require("node:test");
const assert = require("node:assert/strict");
const { run } = require("../src/cli");

test("default output stays unchanged without a category filter", () => {
  assert.equal(
    run([]),
    "docs: README\ndocs: CHANGELOG\ntests: benchmark.test.js",
  );
});
