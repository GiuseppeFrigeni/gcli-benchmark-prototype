const test = require("node:test");
const assert = require("node:assert/strict");
const { existsSync } = require("node:fs");
const { resolve } = require("node:path");

test("checked-in docs assets, schema, and minimal examples exist", () => {
  const requiredPaths = [
    resolve("docs/assets/report-overview.svg"),
    resolve("docs/assets/artifact-tree.svg"),
    resolve("docs/assets/regression-pr-view.svg"),
    resolve("docs/assets/architecture-flow.svg"),
    resolve("docs/assets/architecture-flow.mmd"),
    resolve("docs/examples/mock-report.md"),
    resolve("docs/examples/mock-results.json"),
    resolve("docs/examples/mock-regression.md"),
    resolve("docs/examples/chat-log.json"),
    resolve("docs/task.schema.json"),
    resolve("docs/minimal-task-examples/README.md"),
    resolve("docs/minimal-task-examples/workspace-edit/task.json"),
    resolve("docs/minimal-task-examples/prompt-output/task.json"),
    resolve("docs/minimal-task-examples/tool-use/task.json"),
  ];

  for (const filePath of requiredPaths) {
    assert.equal(existsSync(filePath), true, `missing docs artifact: ${filePath}`);
  }
});
