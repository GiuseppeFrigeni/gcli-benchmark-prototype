const assert = require("node:assert/strict");

function verify(actual, expected) {
  assert.equal(actual.trim(), expected.trim());
}

module.exports = { verify };
