const assert = require("node:assert/strict");
const { existsSync } = require("node:fs");

for (const fixturePath of process.argv.slice(2)) {
  assert.equal(existsSync(fixturePath), true, `missing fixture: ${fixturePath}`);
}
