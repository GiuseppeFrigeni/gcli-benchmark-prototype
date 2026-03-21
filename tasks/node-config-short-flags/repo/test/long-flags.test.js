const test = require("node:test");
const assert = require("node:assert/strict");
const { loadConfig } = require("../src/config");

test("long flags and env fallback keep working", () => {
  const config = loadConfig(["--host", "cli.local"], {
    APP_HOST: "env.local",
    APP_PORT: "9000",
  });

  assert.deepEqual(config, {
    host: "cli.local",
    port: 9000,
  });
});
