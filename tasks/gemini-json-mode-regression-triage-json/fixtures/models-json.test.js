const test = require("node:test");
const assert = require("node:assert/strict");

test("models --json keeps stdout machine readable", async () => {
  const stdout = 'Rendering alias table...\n[{"id":"gemini-2.5-pro"}]';
  assert.equal(stdout.trim().startsWith("["), true);
});
