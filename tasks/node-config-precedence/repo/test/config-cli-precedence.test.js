const test = require("node:test");
const assert = require("node:assert/strict");
const { resolveConfig } = require("../src/config");

test("explicit CLI values override environment defaults", () => {
  const config = resolveConfig({
    env: {
      APP_HOST: "prod.internal",
      APP_PORT: "9000",
      APP_MODE: "production",
    },
    args: {
      host: "127.0.0.1",
      port: 4100,
      mode: "development",
    },
  });

  assert.equal(config.host, "127.0.0.1");
  assert.equal(config.port, 4100);
  assert.equal(config.mode, "development");
});
