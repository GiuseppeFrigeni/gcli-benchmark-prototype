const test = require("node:test");
const assert = require("node:assert/strict");
const { articlePath } = require("../src/slug");

test("articlePath trims surrounding whitespace in both segments", () => {
  assert.equal(articlePath(" Guides ", "  Hello World  "), "/guides/hello-world");
});
