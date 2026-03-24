const test = require("node:test");
const assert = require("node:assert/strict");
const { loadTasks } = require("../../dist/task-loader.js");
const {
  createTaskFixture,
  makeWorkspaceManifest,
  withTempDir,
} = require("../helpers/task-fixtures.js");

const repoFiles = {
  "src/value.js": "module.exports = { value: 1 };\n",
  "test/fail.test.js": [
    "const test = require('node:test');",
    "const assert = require('node:assert/strict');",
    "const { value } = require('../src/value');",
    "test('fails until fixed', () => {",
    "  assert.equal(value, 2);",
    "});",
    "",
  ].join("\n"),
  "test/pass.test.js": [
    "const test = require('node:test');",
    "const assert = require('node:assert/strict');",
    "const { value } = require('../src/value');",
    "test('already passing', () => {",
    "  assert.equal(value, 1);",
    "});",
    "",
  ].join("\n"),
};

test("task loader rejects duplicate ids", async () => {
  await withTempDir("gcli-loader-dup", async (root) => {
    const manifest = makeWorkspaceManifest({ id: "duplicate-task" });
    await createTaskFixture(root, "task-a", { manifest, repoFiles, goldPatch: "" });
    await createTaskFixture(root, "task-b", { manifest, repoFiles, goldPatch: "" });
    await assert.rejects(() => loadTasks(root), /Duplicate task id/);
  });
});

test("task loader requires suite", async () => {
  await withTempDir("gcli-loader-suite", async (root) => {
    const manifest = makeWorkspaceManifest();
    delete manifest.suite;
    await createTaskFixture(root, "task-a", { manifest, repoFiles, goldPatch: "" });
    await assert.rejects(() => loadTasks(root), /field 'suite'/);
  });
});

test("task loader preserves suite and taxonomy", async () => {
  await withTempDir("gcli-loader-valid", async (root) => {
    await createTaskFixture(root, "task-a", {
      manifest: makeWorkspaceManifest({
        id: "valid-taxonomy",
        suite: "gemini-core",
        taxonomy: {
          scope: "single-file",
          tags: ["behavior-preservation", "shared-logic"],
        },
      }),
      repoFiles,
      goldPatch: "",
    });
    const tasks = await loadTasks(root);
    assert.equal(tasks[0].suite, "gemini-core");
    assert.deepEqual(tasks[0].taxonomy, {
      scope: "single-file",
      tags: ["behavior-preservation", "shared-logic"],
    });
  });
});

test("prompt-output tasks can load without repo fixtures", async () => {
  await withTempDir("gcli-loader-prompt", async (root) => {
    await createTaskFixture(root, "task-a", {
      manifest: {
        $schema: "../../docs/task.schema.json",
        id: "prompt-no-repo",
        title: "Prompt task",
        taskKind: "prompt-output",
        suite: "contributor-workflows",
        category: "debugging",
        difficulty: "medium",
        language: "text",
        problemStatementFile: "issue.md",
        verification: {
          failToPass: ["node \"${taskDir}/verify.js\" \"${artifactDir}/agent-stdout.txt\""],
          passToPass: ["node \"${taskDir}/fixtures.js\""],
        },
        policy: "always",
      },
      goldStdout: "{\"ok\":true}\n",
      extraFiles: {
        "verify.js": [
          "const assert = require('node:assert/strict');",
          "const { readFileSync } = require('node:fs');",
          "assert.notEqual(readFileSync(process.argv[2], 'utf8').trim(), '');",
          "",
        ].join("\n"),
        "fixtures.js": "",
      },
    });
    const tasks = await loadTasks(root);
    assert.equal(tasks.length, 1);
    assert.equal(tasks[0].repoDir, undefined);
    assert.equal(tasks[0].suite, "contributor-workflows");
  });
});

test("tool-use tasks require a gold activity log", async () => {
  await withTempDir("gcli-loader-tool", async (root) => {
    await createTaskFixture(root, "task-a", {
      manifest: {
        $schema: "../../docs/task.schema.json",
        id: "tool-missing-activity",
        title: "Tool task",
        taskKind: "tool-use",
        suite: "gemini-core",
        category: "code-review",
        difficulty: "medium",
        language: "text",
        problemStatementFile: "issue.md",
        verification: {
          failToPass: ["node -e \"process.exit(1)\""],
          passToPass: ["node -e \"process.exit(0)\""],
        },
        policy: "always",
      },
    });
    await assert.rejects(() => loadTasks(root), /missing gold activity log/);
  });
});
