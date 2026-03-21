const test = require("node:test");
const assert = require("node:assert/strict");
const { renderJson } = require("../src/render-json");

test("machine mode returns raw json", () => {
  const output = renderJson({ ok: true }, { machine: true });
  assert.deepEqual(JSON.parse(output), { ok: true });
});
