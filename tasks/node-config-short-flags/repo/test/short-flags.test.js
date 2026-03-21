const test = require("node:test");
const assert = require("node:assert/strict");
const { loadConfig } = require("../src/config");

test("short flags override environment values", () => {
  const config = loadConfig(["-H", "cli.local", "-p", "4100"], {
    APP_HOST: "env.local",
    APP_PORT: "9000",
  });

  assert.deepEqual(config, {
    host: "cli.local",
    port: 4100,
  });
});
