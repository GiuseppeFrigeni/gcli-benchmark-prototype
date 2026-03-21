const test = require("node:test");
const assert = require("node:assert/strict");
const { run } = require("../src/cli");

test("text mode keeps the original banner and list output", () => {
  assert.equal(
    run([], ["gemini-2.5-pro", "gemini-2.5-flash"]),
    ["Loaded 2 models", "- gemini-2.5-pro", "- gemini-2.5-flash"].join("\n"),
  );
});
