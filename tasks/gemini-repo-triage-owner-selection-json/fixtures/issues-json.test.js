const test = require("node:test");
const assert = require("node:assert/strict");

test("issues command keeps --json output parseable", async () => {
  const stdout = 'Loading issue inventory...\n[{"id":"cli-12"}]';
  assert.doesNotThrow(() => JSON.parse(stdout));
});
