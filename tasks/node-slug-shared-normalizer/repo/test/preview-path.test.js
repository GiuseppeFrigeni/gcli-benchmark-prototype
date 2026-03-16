const test = require("node:test");
const assert = require("node:assert/strict");
const { articlePath, previewPath } = require("../src/slug");

test("previewPath keeps existing preview URL formatting", () => {
  assert.equal(previewPath("  Release Notes  "), "/preview/release-notes");
});

test("articlePath still formats already-clean input", () => {
  assert.equal(articlePath("Docs", "Release Notes"), "/docs/release-notes");
});
