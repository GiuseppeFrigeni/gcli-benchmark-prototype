const test = require("node:test");
const assert = require("node:assert/strict");
const { parseArgs, run } = require("../src/cli");

test("text mode stays unchanged by default", () => {
  const output = run([], {
    completed: 3,
    total: 4,
  });

  assert.equal(output, "3/4 tasks completed");
});

test("argument parsing keeps json disabled by default", () => {
  assert.deepEqual(parseArgs([]), { json: false });
});
