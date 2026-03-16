const test = require("node:test");
const assert = require("node:assert/strict");
const { buildCacheKey } = require("../src/cache-key");

test("buildCacheKey keeps the base key when params are empty", () => {
  assert.equal(buildCacheKey("search"), "search");
});

test("buildCacheKey keeps the existing shape for a single param", () => {
  assert.equal(buildCacheKey("search", { query: "gemini" }), "search?query=gemini");
});
