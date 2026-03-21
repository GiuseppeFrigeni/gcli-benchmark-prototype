const assert = require("node:assert/strict");
const { mkdir, mkdtemp, readFile } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const { join, resolve } = require("node:path");
const { runCli } = require("../dist/cli.js");
const { GoldPatchAgent, NoopAgent } = require("../dist/mock-agents.js");
const { loadTasks } = require("../dist/task-loader.js");
const { readJsonFile, removeDir, writeJsonFile, writeTextFile } = require("../dist/utils.js");
const { runTasks } = require("../dist/workspace-runner.js");

async function createTempDir(prefix) {
  return await mkdtemp(join(tmpdir(), `${prefix}-`));
}

async function createBasicTask(root, directoryName, manifest, files) {
  const taskDir = join(root, directoryName);
  await mkdir(join(taskDir, "repo", "src"), { recursive: true });
  await mkdir(join(taskDir, "repo", "test"), { recursive: true });
  await writeJsonFile(join(taskDir, "task.json"), manifest);
  await writeTextFile(join(taskDir, "issue.md"), "Fix the local bug.");
  await writeTextFile(join(taskDir, "gold.patch"), "");

  for (const [relativePath, content] of Object.entries(files)) {
    await writeTextFile(join(taskDir, "repo", relativePath), content);
  }
}

async function withTempDir(prefix, fn) {
  const dir = await createTempDir(prefix);
  try {
    return await fn(dir);
  } finally {
    await removeDir(dir);
  }
}

async function testTaskLoaderValidation() {
  const baseManifest = {
    id: "duplicate-task",
    title: "Duplicate task",
    category: "debugging",
    difficulty: "easy",
    language: "javascript",
    problemStatementFile: "issue.md",
    verification: {
      failToPass: ["node --test test/fail.test.js"],
      passToPass: ["node --test test/pass.test.js"],
    },
    policy: "always",
  };
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

  await withTempDir("gcli-loader-tests", async (root) => {
    await createBasicTask(root, "task-a", baseManifest, repoFiles);
    await createBasicTask(root, "task-b", baseManifest, repoFiles);
    await assert.rejects(() => loadTasks(root), /Duplicate task id/);
  });

  await withTempDir("gcli-loader-missing-issue", async (root) => {
    await createBasicTask(
      root,
      "task-a",
      {
        ...baseManifest,
        id: "missing-issue",
        problemStatementFile: "missing.md",
      },
      repoFiles,
    );
    await assert.rejects(() => loadTasks(root), /missing problem statement file/);
  });

  await withTempDir("gcli-loader-valid-taxonomy", async (root) => {
    await createBasicTask(
      root,
      "task-a",
      {
        ...baseManifest,
        id: "valid-taxonomy",
        taxonomy: {
          scope: "single-file",
          tags: ["behavior-preservation", "shared-logic"],
        },
      },
      repoFiles,
    );
    const tasks = await loadTasks(root);
    assert.deepEqual(tasks[0].taxonomy, {
      scope: "single-file",
      tags: ["behavior-preservation", "shared-logic"],
    });
  });

  await withTempDir("gcli-loader-invalid-taxonomy-scope", async (root) => {
    await createBasicTask(
      root,
      "task-a",
      {
        ...baseManifest,
        id: "invalid-taxonomy-scope",
        taxonomy: {
          scope: "repo-wide",
          tags: ["behavior-preservation"],
        },
      },
      repoFiles,
    );
    await assert.rejects(() => loadTasks(root), /taxonomy.scope/);
  });

  await withTempDir("gcli-loader-empty-taxonomy-tags", async (root) => {
    await createBasicTask(
      root,
      "task-a",
      {
        ...baseManifest,
        id: "empty-taxonomy-tags",
        taxonomy: {
          scope: "single-file",
          tags: [],
        },
      },
      repoFiles,
    );
    await assert.rejects(() => loadTasks(root), /taxonomy.tags/);
  });

  await withTempDir("gcli-loader-nonstring-taxonomy-tags", async (root) => {
    await createBasicTask(
      root,
      "task-a",
      {
        ...baseManifest,
        id: "nonstring-taxonomy-tags",
        taxonomy: {
          scope: "single-file",
          tags: ["behavior-preservation", 42],
        },
      },
      repoFiles,
    );
    await assert.rejects(() => loadTasks(root), /must be a string\[\]/);
  });

  await withTempDir("gcli-loader-empty-verification", async (root) => {
    await createBasicTask(
      root,
      "task-a",
      {
        ...baseManifest,
        id: "empty-verification",
        verification: {
          failToPass: [],
          passToPass: ["node --test test/pass.test.js"],
        },
      },
      repoFiles,
    );
    await assert.rejects(() => loadTasks(root), /verification.failToPass/);
  });

  await withTempDir("gcli-loader-malformed-command", async (root) => {
    await createBasicTask(
      root,
      "task-a",
      {
        ...baseManifest,
        id: "malformed-command",
        verification: {
          failToPass: [123],
          passToPass: ["node --test test/pass.test.js"],
        },
      },
      repoFiles,
    );
    await assert.rejects(() => loadTasks(root), /must be a string\[\]/);
  });
}

async function testPreflightInvalidation() {
  await withTempDir("gcli-preflight-tests", async (root) => {
    await createBasicTask(
      root,
      "fail-to-pass-already-green",
      {
        id: "fail-to-pass-already-green",
        title: "Fail-to-pass already green",
        category: "debugging",
        difficulty: "easy",
        language: "javascript",
        problemStatementFile: "issue.md",
        verification: {
          failToPass: ["node --test test/fail.test.js"],
          passToPass: ["node --test test/pass.test.js"],
        },
        policy: "always",
      },
      {
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
    );

    await createBasicTask(
      root,
      "pass-to-pass-already-red",
      {
        id: "pass-to-pass-already-red",
        title: "Pass-to-pass already red",
        category: "debugging",
        difficulty: "easy",
        language: "javascript",
        problemStatementFile: "issue.md",
        verification: {
          failToPass: ["node --test test/fail.test.js"],
          passToPass: ["node --test test/pass.test.js"],
        },
        policy: "always",
      },
      {
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
    );

    const tasks = await loadTasks(root);
    const results = await runTasks(tasks, new NoopAgent(), {
      generatedAt: "2026-03-15T00:00:00.000Z",
      runId: "preflight-check",
      artifactsRoot: join(root, "artifacts"),
      workspaceRoot: join(root, "workspaces"),
      keepWorkspaces: false,
      defaultTaskTimeoutMs: 10000,
    });

    assert.equal(results.summary.invalidTasks, 2);
    assert.deepEqual(
      results.tasks.map((taskResult) => taskResult.status),
      ["invalid_task", "invalid_task"],
    );
    assert.ok(results.tasks.every((taskResult) => taskResult.efficiency === undefined));
    assert.equal(results.summary.efficiency.measuredTasks, 0);
  });
}

async function testMockAgentsDriveRealTasks() {
  const tasksDir = resolve("tasks");
  const tasks = await loadTasks(tasksDir);
  assert.equal(tasks.length, 7);
  assert.ok(tasks.every((task) => task.taxonomy));
  assert.ok(tasks.every((task) => task.taxonomy.scope === "single-file"));

  await withTempDir("gcli-runner-tests", async (tempRoot) => {
    const passingRun = await runTasks(tasks, new GoldPatchAgent(), {
      generatedAt: "2026-03-15T01:00:00.000Z",
      runId: "gold-agent",
      artifactsRoot: join(tempRoot, "artifacts-gold"),
      workspaceRoot: join(tempRoot, "workspaces-gold"),
      keepWorkspaces: false,
      defaultTaskTimeoutMs: 10000,
    });
    assert.equal(passingRun.summary.passed, 7);
    assert.deepEqual(
      passingRun.tasks.map((taskResult) => taskResult.status),
      ["passed", "passed", "passed", "passed", "passed", "passed", "passed"],
    );
    assert.ok(passingRun.tasks.every((taskResult) => taskResult.taxonomy));
    assert.ok(
      passingRun.tasks.every(
        (taskResult) =>
          taskResult.efficiency &&
          taskResult.efficiency.filesChanged > 0 &&
          taskResult.efficiency.changedLines > 0,
      ),
    );
    assert.equal(passingRun.summary.taxonomyCoverage.tasksWithTaxonomy, 7);
    assert.equal(passingRun.summary.taxonomyCoverage.tasksWithoutTaxonomy, 0);
    assert.deepEqual(passingRun.summary.taxonomyCoverage.scopes, [
      { scope: "single-file", count: 7 },
    ]);
    assert.equal(passingRun.summary.efficiency.measuredTasks, 7);
    assert.ok(passingRun.summary.efficiency.totalInsertions > 0);
    assert.ok(passingRun.summary.efficiency.totalDeletions >= 0);

    const failingRun = await runTasks(tasks, new NoopAgent(), {
      generatedAt: "2026-03-15T01:10:00.000Z",
      runId: "noop-agent",
      artifactsRoot: join(tempRoot, "artifacts-noop"),
      workspaceRoot: join(tempRoot, "workspaces-noop"),
      keepWorkspaces: false,
      defaultTaskTimeoutMs: 10000,
    });
    assert.equal(failingRun.summary.failed, 7);
    assert.deepEqual(
      failingRun.tasks.map((taskResult) => taskResult.status),
      ["failed", "failed", "failed", "failed", "failed", "failed", "failed"],
    );
    assert.ok(
      failingRun.tasks.every(
        (taskResult) =>
          taskResult.efficiency &&
          taskResult.efficiency.filesChanged === 0 &&
          taskResult.efficiency.changedLines === 0 &&
          taskResult.efficiency.agentDurationMs >= 0,
      ),
    );
    assert.equal(failingRun.summary.efficiency.measuredTasks, 7);
    assert.equal(failingRun.summary.efficiency.averageFilesChanged, 0);
    assert.equal(failingRun.summary.efficiency.averageChangedLines, 0);
  });
}

async function captureCliLogs(argv, deps) {
  const logs = [];
  const originalLog = console.log;
  console.log = (...args) => {
    logs.push(args.map(String).join(" "));
  };
  try {
    const exitCode = await runCli(argv, deps);
    return { exitCode, output: logs.join("\n") };
  } finally {
    console.log = originalLog;
  }
}

async function testCliBaselineAndReports() {
  const tasksDir = resolve("tasks");

  await withTempDir("gcli-cli-tests", async (tempRoot) => {
    const reportsDir = join(tempRoot, "reports");
    const baselinePath = join(tempRoot, "baseline.json");

    const listResult = await captureCliLogs(["list", "--tasks", tasksDir]);
    assert.equal(listResult.exitCode, 0);
    assert.match(listResult.output, /Taxonomy scopes:/);
    assert.match(listResult.output, /- single-file: 7/);
    assert.match(listResult.output, /Taxonomy tags:/);
    assert.match(listResult.output, /- review-feedback: 2/);
    assert.match(listResult.output, /Tasks missing taxonomy: 0/);

    const updateCode = await runCli(
      [
        "run",
        "--tasks",
        tasksDir,
        "--agent-mode",
        "gold-patch",
        "--reports",
        reportsDir,
        "--baseline",
        baselinePath,
        "--update-baseline",
      ],
      { now: () => new Date("2026-03-15T02:00:00.000Z") },
    );
    assert.equal(updateCode, 0);

    const baseline = await readJsonFile(baselinePath);
    assert.equal(baseline.overallPassRate, 1);
    assert.equal(Object.keys(baseline.taskStatuses).length, 7);
    assert.ok(Object.values(baseline.taskStatuses).every((status) => status === "passed"));

    const regressionCode = await runCli(
      [
        "run",
        "--tasks",
        tasksDir,
        "--agent-mode",
        "noop",
        "--reports",
        reportsDir,
        "--baseline",
        baselinePath,
      ],
      { now: () => new Date("2026-03-15T02:10:00.000Z") },
    );
    assert.equal(regressionCode, 2);

    const latestResults = await readJsonFile(join(reportsDir, "latest-results.json"));
    assert.equal(latestResults.summary.failed, 7);
    assert.equal(latestResults.summary.infraFailed, 0);
    assert.ok(latestResults.tasks.every((taskResult) => taskResult.status === "failed"));
    assert.ok(latestResults.tasks.every((taskResult) => taskResult.taxonomy));
    assert.ok(latestResults.tasks.every((taskResult) => taskResult.efficiency));
    assert.equal(latestResults.config.mode, "noop");
    assert.equal(latestResults.summary.taxonomyCoverage.tasksWithTaxonomy, 7);
    assert.equal(latestResults.summary.taxonomyCoverage.tasksWithoutTaxonomy, 0);
    assert.equal(latestResults.summary.efficiency.measuredTasks, 7);
    assert.equal(latestResults.summary.efficiency.averageFilesChanged, 0);
    assert.equal(latestResults.summary.efficiency.averageChangedLines, 0);

    const latestReport = await readFile(join(reportsDir, "latest-report.md"), "utf8");
    assert.match(latestReport, /# Gemini CLI Contributor Eval Report/);
    assert.match(latestReport, /## Taxonomy Coverage/);
    assert.match(latestReport, /## Efficiency Snapshot/);
    assert.match(latestReport, /Task 'node-config-precedence' regressed from passed to failed/);
    assert.match(latestReport, /Mode: noop/);
  });
}

async function captureCliErrors(argv) {
  const errors = [];
  const originalError = console.error;
  console.error = (...args) => {
    errors.push(args.map(String).join(" "));
  };
  try {
    const exitCode = await runCli(argv);
    return { exitCode, output: errors.join("\n") };
  } finally {
    console.error = originalError;
  }
}

async function testCliAgentModeValidation() {
  const invalidMode = await captureCliErrors(["run", "--agent-mode", "invalid-mode"]);
  assert.equal(invalidMode.exitCode, 1);
  assert.match(invalidMode.output, /Invalid value for --agent-mode/);

  const invalidGeminiFlag = await captureCliErrors([
    "run",
    "--agent-mode",
    "noop",
    "--model",
    "gemini-2.5-pro",
  ]);
  assert.equal(invalidGeminiFlag.exitCode, 1);
  assert.match(invalidGeminiFlag.output, /--model can only be used with --agent-mode=gemini-cli/);

  const invalidLiveOutput = await captureCliErrors([
    "run",
    "--agent-mode",
    "gold-patch",
    "--live-output",
  ]);
  assert.equal(invalidLiveOutput.exitCode, 1);
  assert.match(invalidLiveOutput.output, /--live-output can only be used with --agent-mode=gemini-cli/);
}

async function runCase(name, fn) {
  try {
    await fn();
    console.log(`ok - ${name}`);
    return 0;
  } catch (error) {
    console.error(`not ok - ${name}`);
    console.error(error);
    return 1;
  }
}

async function main() {
  const cases = [
    ["task loader validation", testTaskLoaderValidation],
    ["preflight invalidation", testPreflightInvalidation],
    ["mock agent task execution", testMockAgentsDriveRealTasks],
    ["cli agent mode validation", testCliAgentModeValidation],
    ["cli baseline and reports", testCliBaselineAndReports],
  ];

  let failures = 0;
  for (const [name, fn] of cases) {
    failures += await runCase(name, fn);
  }

  if (failures > 0) {
    console.error(`\n${failures} test case(s) failed.`);
    process.exitCode = 1;
    return;
  }

  console.log(`\nAll ${cases.length} test case(s) passed.`);
}

void main();
