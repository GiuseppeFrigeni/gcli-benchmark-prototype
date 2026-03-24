const test = require("node:test");
const assert = require("node:assert/strict");
const { join } = require("node:path");
const { loadTasks } = require("../../dist/task-loader.js");
const { GoldPatchAgent, NoopAgent } = require("../../dist/mock-agents.js");
const { runTasks } = require("../../dist/workspace-runner.js");
const {
  createTaskFixture,
  makeWorkspaceManifest,
  withTempDir,
} = require("../helpers/task-fixtures.js");

test("preflight invalidation marks broken fixtures as invalid tasks", async () => {
  await withTempDir("gcli-preflight", async (root) => {
    await createTaskFixture(root, "fail-to-pass-already-green", {
      manifest: makeWorkspaceManifest({ id: "fail-to-pass-already-green" }),
      repoFiles: {
        "src/value.js": "module.exports = { value: 2 };\n",
        "test/fail.test.js": [
          "const test = require('node:test');",
          "const assert = require('node:assert/strict');",
          "const { value } = require('../src/value');",
          "test('already green', () => {",
          "  assert.equal(value, 2);",
          "});",
          "",
        ].join("\n"),
        "test/pass.test.js": [
          "const test = require('node:test');",
          "const assert = require('node:assert/strict');",
          "const { value } = require('../src/value');",
          "test('stable pass', () => {",
          "  assert.equal(value, 2);",
          "});",
          "",
        ].join("\n"),
      },
      goldPatch: "",
    });

    await createTaskFixture(root, "pass-to-pass-already-red", {
      manifest: makeWorkspaceManifest({ id: "pass-to-pass-already-red" }),
      repoFiles: {
        "src/value.js": "module.exports = { value: 1 };\n",
        "test/fail.test.js": [
          "const test = require('node:test');",
          "const assert = require('node:assert/strict');",
          "const { value } = require('../src/value');",
          "test('still failing', () => {",
          "  assert.equal(value, 2);",
          "});",
          "",
        ].join("\n"),
        "test/pass.test.js": [
          "const test = require('node:test');",
          "const assert = require('node:assert/strict');",
          "const { value } = require('../src/value');",
          "test('unexpected failure', () => {",
          "  assert.equal(value, 3);",
          "});",
          "",
        ].join("\n"),
      },
      goldPatch: "",
    });

    const tasks = await loadTasks(root);
    const results = await runTasks(tasks, new NoopAgent(), {
      generatedAt: "2026-03-24T00:00:00.000Z",
      runId: "preflight-check",
      artifactsRoot: join(root, "artifacts"),
      workspaceRoot: join(root, "workspaces"),
      keepWorkspaces: false,
      defaultTaskTimeoutMs: 10000,
    });

    assert.equal(results.summary.invalidTasks, 2);
    assert.deepEqual(results.tasks.map((taskResult) => taskResult.status), [
      "invalid_task",
      "invalid_task",
    ]);
  });
});

test("non-workspace tasks support interpolation, suites, and tool expectations", async () => {
  await withTempDir("gcli-nonworkspace", async (root) => {
    await createTaskFixture(root, "prompt-task", {
      manifest: {
        $schema: "../../docs/task.schema.json",
        id: "prompt-task",
        title: "Prompt task",
        taskKind: "prompt-output",
        suite: "contributor-workflows",
        category: "debugging",
        difficulty: "medium",
        language: "text",
        problemStatementFile: "issue.md",
        promptAddendum: "Use ${taskDir}/expected.json for the exact answer.",
        verification: {
          failToPass: [
            "node \"${taskDir}/verify-output.js\" \"${artifactDir}/agent-stdout.txt\" \"${taskDir}/expected.json\"",
          ],
          passToPass: [
            "node \"${taskDir}/verify-summary.js\" \"${artifactDir}/activity-summary.json\"",
          ],
        },
        policy: "always",
      },
      goldStdout: "{\"status\":\"ok\"}\n",
      extraFiles: {
        "expected.json": "{\n  \"status\": \"ok\"\n}\n",
        "verify-output.js": [
          "const assert = require('node:assert/strict');",
          "const { readFileSync } = require('node:fs');",
          "const actual = JSON.parse(readFileSync(process.argv[2], 'utf8'));",
          "const expected = JSON.parse(readFileSync(process.argv[3], 'utf8'));",
          "assert.deepEqual(actual, expected);",
          "",
        ].join("\n"),
        "verify-summary.js": [
          "const assert = require('node:assert/strict');",
          "const { readFileSync } = require('node:fs');",
          "const summary = JSON.parse(readFileSync(process.argv[2], 'utf8'));",
          "assert.equal(Array.isArray(summary.calls), true);",
          "",
        ].join("\n"),
      },
    });

    await createTaskFixture(root, "tool-task", {
      manifest: {
        $schema: "../../docs/task.schema.json",
        id: "tool-task",
        title: "Tool task",
        taskKind: "tool-use",
        suite: "gemini-core",
        category: "code-review",
        difficulty: "medium",
        language: "text",
        toolExpectations: {
          firstCall: {
            name: "read_file",
            targetIncludes: "notes.txt",
          },
          requiredCalls: [
            {
              name: "read_file",
              targetIncludes: "notes.txt",
            },
            {
              name: "read_file",
              targetIncludes: "expected.txt",
            },
          ],
          orderedCalls: [
            {
              name: "read_file",
              targetIncludes: "notes.txt",
            },
            {
              name: "read_file",
              targetIncludes: "expected.txt",
            },
          ],
        },
        problemStatementFile: "issue.md",
        verification: {
          failToPass: [
            "node \"${taskDir}/verify-tool.js\" \"${artifactDir}/agent-stdout.txt\" \"${artifactDir}/activity-summary.json\"",
          ],
          passToPass: [
            "node \"${taskDir}/verify-fixture.js\" \"${taskDir}/notes.txt\"",
          ],
        },
        policy: "always",
      },
      goldStdout: "Finding: inspected both artifacts before answering.\n",
      goldActivity: [
        "{\"functionCall\":{\"name\":\"read_file\",\"args\":{\"file_path\":\"notes.txt\"}}}",
        "{\"functionCall\":{\"name\":\"read_file\",\"args\":{\"file_path\":\"expected.txt\"}}}",
        "",
      ].join("\n"),
      extraFiles: {
        "notes.txt": "artifact one\n",
        "expected.txt": "artifact two\n",
        "verify-tool.js": [
          "const assert = require('node:assert/strict');",
          "const { readFileSync } = require('node:fs');",
          "const stdout = readFileSync(process.argv[2], 'utf8').trim();",
          "const summary = JSON.parse(readFileSync(process.argv[3], 'utf8'));",
          "assert.equal(stdout, 'Finding: inspected both artifacts before answering.');",
          "assert.ok(summary.calls.some((call) => String(call.target).includes('notes.txt')));",
          "assert.ok(summary.calls.some((call) => String(call.target).includes('expected.txt')));",
          "",
        ].join("\n"),
        "verify-fixture.js": [
          "const assert = require('node:assert/strict');",
          "const { existsSync } = require('node:fs');",
          "assert.equal(existsSync(process.argv[2]), true);",
          "",
        ].join("\n"),
      },
    });

    const tasks = await loadTasks(root);
    const goldRun = await runTasks(tasks, new GoldPatchAgent(), {
      generatedAt: "2026-03-24T01:00:00.000Z",
      runId: "gold-nonworkspace",
      artifactsRoot: join(root, "artifacts-gold"),
      workspaceRoot: join(root, "workspaces-gold"),
      keepWorkspaces: false,
      defaultTaskTimeoutMs: 10000,
    });
    assert.deepEqual(goldRun.tasks.map((taskResult) => taskResult.status), ["passed", "passed"]);
    assert.deepEqual(goldRun.summary.suites, [
      { suite: "contributor-workflows", count: 1 },
      { suite: "gemini-core", count: 1 },
    ]);

    const noopRun = await runTasks(tasks, new NoopAgent(), {
      generatedAt: "2026-03-24T01:10:00.000Z",
      runId: "noop-nonworkspace",
      artifactsRoot: join(root, "artifacts-noop"),
      workspaceRoot: join(root, "workspaces-noop"),
      keepWorkspaces: false,
      defaultTaskTimeoutMs: 10000,
    });
    assert.deepEqual(noopRun.tasks.map((taskResult) => taskResult.status), ["failed", "failed"]);
    const noopToolTask = noopRun.tasks.find((taskResult) => taskResult.taskId === "tool-task");
    assert.equal(noopToolTask.failureAnalysis.reason, "tool-expectation-failed");
  });
});
