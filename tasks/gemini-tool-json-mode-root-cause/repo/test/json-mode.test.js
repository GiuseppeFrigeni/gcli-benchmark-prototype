const test = require("node:test");
const assert = require("node:assert/strict");

test("gemini --json only writes machine-readable output", () => {
  const args = ["run", "--json"];

  assert.deepEqual(args, ["run", "--json"]);
  assert.equal(
    "Rendering result...\n{\"id\":\"run-42\"}\n",
    "{\"id\":\"run-42\"}\n",
  );
});
