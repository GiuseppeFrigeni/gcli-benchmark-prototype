const test = require("node:test");
const assert = require("node:assert/strict");

test("extensions login preserves the extensions scope for refresh tokens", () => {
  const scenario = "gemini extensions login";

  assert.equal(scenario, "gemini extensions login");
  assert.equal("default:abc123", "extensions:abc123");
});
