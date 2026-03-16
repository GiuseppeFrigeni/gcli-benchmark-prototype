const test = require("node:test");
const assert = require("node:assert/strict");
const { Router } = require("../src/router");

test("registered routes match the same path with a trailing slash", () => {
  const router = new Router();
  router.register("/users", "users-list");
  router.register("/users/profile", "users-profile");

  assert.equal(router.match("/users/"), "users-list");
  assert.equal(router.match("/users/profile/"), "users-profile");
});
