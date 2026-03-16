const test = require("node:test");
const assert = require("node:assert/strict");
const { run } = require("../src/cli");

test("json mode returns a machine-readable summary", () => {
  const output = run(["--json"], {
    completed: 2,
    total: 5,
  });

  const parsed = JSON.parse(output);
  assert.deepEqual(parsed, {
    completed: 2,
    total: 5,
    remaining: 3,
  });
});
