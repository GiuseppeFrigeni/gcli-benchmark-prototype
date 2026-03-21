const test = require("node:test");
const assert = require("node:assert/strict");
const { run } = require("../src/cli");

test("json mode returns only structured output", () => {
  const output = run(["--json"], ["gemini-2.5-pro", "gemini-2.5-flash"]);
  assert.deepEqual(JSON.parse(output), {
    models: ["gemini-2.5-pro", "gemini-2.5-flash"],
  });
});
