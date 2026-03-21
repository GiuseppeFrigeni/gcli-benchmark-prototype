const test = require("node:test");
const assert = require("node:assert/strict");
const { renderRunResult } = require("../src/commands/run");

test("json mode stays machine readable", () => {
  const output = renderRunResult({ summary: "done", ok: true }, { json: true });
  assert.equal(output.startsWith("Running Gemini task..."), false);
  assert.deepEqual(JSON.parse(output), {
    summary: "done",
    ok: true,
  });
});
