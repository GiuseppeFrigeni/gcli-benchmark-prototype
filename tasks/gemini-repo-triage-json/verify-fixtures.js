const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");

const [, , commandPath, storePath, testPath] = process.argv;
const commandSource = readFileSync(commandPath, "utf8");
const storeSource = readFileSync(storePath, "utf8");
const testSource = readFileSync(testPath, "utf8");

assert.match(commandSource, /persistRefreshToken/, "expected login command to persist refresh tokens");
assert.match(storeSource, /scope/, "expected token store scope handling fixture");
assert.match(testSource, /extensions login/, "expected extensions login regression coverage");
