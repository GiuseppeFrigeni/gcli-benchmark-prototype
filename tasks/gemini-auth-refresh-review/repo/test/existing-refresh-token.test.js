const test = require("node:test");
const assert = require("node:assert/strict");
const { planRefresh } = require("../src/commands/login");

test("refresh token continues to take precedence", () => {
  assert.deepEqual(
    planRefresh(
      {
        refreshToken: "refresh-token",
        deviceCode: "session-device-code",
      },
      { deviceCode: "env-device-code" },
    ),
    {
      grantType: "refresh_token",
      refreshToken: "refresh-token",
    },
  );
});
