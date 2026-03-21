const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");

const [, , diffPath] = process.argv;
const diff = readFileSync(diffPath, "utf8");

assert.match(diff, /Expected output/, "expected comparison header");
assert.match(diff, /Current output/, "expected current output header");
assert.match(diff, /gemini-2\.5-pro/, "expected model id fixture");
