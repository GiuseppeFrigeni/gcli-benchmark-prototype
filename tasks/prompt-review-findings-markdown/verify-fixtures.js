const assert = require("node:assert/strict");
const { existsSync } = require("node:fs");

for (const filePath of process.argv.slice(2)) {
  assert.equal(existsSync(filePath), true, `missing fixture: ${filePath}`);
}
