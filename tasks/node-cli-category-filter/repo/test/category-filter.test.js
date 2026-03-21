const test = require("node:test");
const assert = require("node:assert/strict");
const { run } = require("../src/cli");

test("category filtering limits the text report", () => {
  assert.equal(run(["--category", "docs"]), "docs: README\ndocs: CHANGELOG");
});
