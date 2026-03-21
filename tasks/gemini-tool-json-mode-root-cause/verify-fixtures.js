const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");

const [, , renderPath, testPath] = process.argv;
const renderSource = readFileSync(renderPath, "utf8");
const testSource = readFileSync(testPath, "utf8");

assert.match(renderSource, /Rendering result\.\.\./, "expected progress log fixture");
assert.match(renderSource, /JSON\.stringify/, "expected JSON serialization fixture");
assert.match(testSource, /--json/, "expected json mode coverage");
