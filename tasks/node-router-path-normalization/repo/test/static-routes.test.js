const test = require("node:test");
const assert = require("node:assert/strict");
const { Router } = require("../src/router");

test("root path and exact static routes still match", () => {
  const router = new Router();
  router.register("/", "root");
  router.register("/health", "health");

  assert.equal(router.match("/"), "root");
  assert.equal(router.match("/health"), "health");
});

test("unknown paths still return null", () => {
  const router = new Router();
  router.register("/health", "health");

  assert.equal(router.match("/missing"), null);
});
