const test = require("node:test");
const assert = require("node:assert/strict");
const { planRefresh } = require("../src/commands/login");

test("falls back to the provided device code when refresh token is missing", () => {
  assert.deepEqual(planRefresh({}, { deviceCode: "device-code-from-env" }), {
    grantType: "device_code",
    deviceCode: "device-code-from-env",
  });
});
