const test = require("node:test");
const assert = require("node:assert/strict");
const { Router } = require("../src/router");

test("trailing slash lookup should match the normalized route", () => {
  const router = new Router({
    "/docs": "docs-route",
  });

  assert.equal(router.match("/docs/"), "docs-route");
});
