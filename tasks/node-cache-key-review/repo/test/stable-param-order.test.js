const test = require("node:test");
const assert = require("node:assert/strict");
const { buildCacheKey } = require("../src/cache-key");

test("buildCacheKey is stable across param insertion order", () => {
  const first = buildCacheKey("search", { page: 2, query: "gemini" });
  const second = buildCacheKey("search", { query: "gemini", page: 2 });

  assert.equal(first, "search?page=2&query=gemini");
  assert.equal(second, "search?page=2&query=gemini");
});
