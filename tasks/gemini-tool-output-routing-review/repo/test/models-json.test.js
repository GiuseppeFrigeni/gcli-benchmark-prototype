const test = require("node:test");
const assert = require("node:assert/strict");
const { runModelsCommand } = require("../src/commands/models");

test("json mode uses the json renderer", () => {
  assert.deepEqual(JSON.parse(runModelsCommand(["pro", "flash"], { json: true })), {
    models: ["pro", "flash"],
  });
});
