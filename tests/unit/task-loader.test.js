const test = require("node:test");
const assert = require("node:assert/strict");
const { writeFile } = require("node:fs/promises");
const { join } = require("node:path");
const { loadTasks, validateTaskDirectory } = require("../../dist/task-loader.js");
const { readJsonFile } = require("../../dist/utils.js");
const {
  createTaskFixture,
  makeWorkspaceManifest,
  withTempDir,
} = require("../helpers/task-fixtures.js");

const nonEmptyGoldPatch = "diff --git a/src/value.js b/src/value.js\n";

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

test("readJsonFile accepts a UTF-8 BOM", async () => {
  await withTempDir("gcli-json-bom", async (root) => {
    const filePath = join(root, "chat-log.json");
    await writeFile(filePath, "\uFEFF{\"title\":\"Draft from Windows\"}\n", "utf8");

    const parsed = await readJsonFile(filePath);
    assert.deepEqual(parsed, { title: "Draft from Windows" });
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

test("validateTaskDirectory reports untouched draft scaffolds", async () => {
  await withTempDir("gcli-validate-draft", async (root) => {
    await createTaskFixture(root, "task-a", {
      manifest: {
        $schema: "../../docs/task.schema.json",
        id: "draft-task",
        title: "Draft task",
        draft: true,
        taskKind: "tool-use",
        suite: "contributor-workflows",
        category: "debugging",
        difficulty: "medium",
        language: "text",
        taxonomy: {
          scope: "multi-file",
          tags: ["draft-task", "chat-log-derived"],
        },
        problemStatementFile: "issue.md",
        promptAddendum:
          "Generated from chat-log.json. Tighten instructions, fixtures, and verification before adding to the suite.",
        verification: {
          failToPass: ['node -e "process.exit(1)"'],
          passToPass: ['node -e "process.exit(0)"'],
        },
        policy: "always",
      },
      goldStdout: "TODO: replace with expected tool-use answer\n",
      goldActivity: "",
    });

    const result = await validateTaskDirectory(join(root, "task-a"));
    assert.equal(result.valid, false);
    assert.equal(result.taskId, "draft-task");
    assert.equal(result.issues.some((issue) => issue.includes("draft scaffold marker")), true);
    assert.equal(result.issues.some((issue) => issue.includes("scaffold verification commands")), true);
    assert.equal(result.issues.some((issue) => issue.includes("tool-use draft placeholder")), true);
    assert.equal(result.issues.some((issue) => issue.includes("activity log is empty")), true);
  });
});

test("validateTaskDirectory accepts a valid workspace task", async () => {
  await withTempDir("gcli-validate-ok", async (root) => {
    await createTaskFixture(root, "task-a", {
      manifest: makeWorkspaceManifest({ id: "valid-task" }),
      repoFiles,
      goldPatch: nonEmptyGoldPatch,
    });

    const result = await validateTaskDirectory(join(root, "task-a"));
    assert.equal(result.valid, true);
    assert.equal(result.taskId, "valid-task");
    assert.deepEqual(result.issues, []);
  });
});

test("validateTaskDirectory reports schema failures", async () => {
  await withTempDir("gcli-validate-schema", async (root) => {
    const manifest = makeWorkspaceManifest({ id: "schema-invalid" });
    delete manifest.title;
    await createTaskFixture(root, "task-a", {
      manifest,
      repoFiles,
      goldPatch: "",
    });

    const result = await validateTaskDirectory(join(root, "task-a"));
    assert.equal(result.valid, false);
    assert.equal(result.taskId, "schema-invalid");
    assert.match(result.issues[0], /schema validation failed/);
  });
});

test("validateTaskDirectory reports missing required assets", async () => {
  await withTempDir("gcli-validate-assets", async (root) => {
    await createTaskFixture(root, "task-a", {
      manifest: {
        $schema: "../../docs/task.schema.json",
        id: "missing-gold-stdout",
        title: "Prompt task",
        taskKind: "prompt-output",
        suite: "contributor-workflows",
        category: "debugging",
        difficulty: "easy",
        language: "text",
        problemStatementFile: "issue.md",
        verification: {
          failToPass: ["node -e \"process.exit(1)\""],
          passToPass: ["node -e \"process.exit(0)\""],
        },
        policy: "always",
      },
    });

    const result = await validateTaskDirectory(join(root, "task-a"));
    assert.equal(result.valid, false);
    assert.equal(result.taskId, "missing-gold-stdout");
    assert.match(result.issues[0], /missing gold stdout/);
  });
});

test("validateTaskDirectory reports semantic task-kind issues", async () => {
  await withTempDir("gcli-validate-semantic", async (root) => {
    await createTaskFixture(root, "task-a", {
      manifest: {
        $schema: "../../docs/task.schema.json",
        id: "semantic-invalid",
        title: "Prompt task with tool expectations",
        taskKind: "prompt-output",
        suite: "contributor-workflows",
        category: "debugging",
        difficulty: "easy",
        language: "text",
        problemStatementFile: "issue.md",
        toolExpectations: {
          requiredCalls: [{ name: "read_file" }],
        },
        verification: {
          failToPass: ["node -e \"process.exit(1)\""],
          passToPass: ["node -e \"process.exit(0)\""],
        },
        policy: "always",
      },
      goldStdout: "{\"ok\":true}\n",
    });

    const result = await validateTaskDirectory(join(root, "task-a"));
    assert.equal(result.valid, false);
    assert.equal(result.taskId, "semantic-invalid");
    assert.match(result.issues[0], /only valid for tool-use tasks/);
  });
});
