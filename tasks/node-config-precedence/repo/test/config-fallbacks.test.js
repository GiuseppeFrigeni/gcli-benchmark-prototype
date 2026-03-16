const test = require("node:test");
const assert = require("node:assert/strict");
const { resolveConfig } = require("../src/config");

test("environment values remain the fallback when args are absent", () => {
  const config = resolveConfig({
    env: {
      APP_HOST: "staging.internal",
      APP_PORT: "8080",
      APP_MODE: "staging",
    },
  });

  assert.equal(config.host, "staging.internal");
  assert.equal(config.port, 8080);
  assert.equal(config.mode, "staging");
});

test("hard-coded defaults still apply when nothing is provided", () => {
  const config = resolveConfig({
    env: {},
    args: {},
  });

  assert.equal(config.host, "127.0.0.1");
  assert.equal(config.port, 3000);
  assert.equal(config.mode, "development");
});
