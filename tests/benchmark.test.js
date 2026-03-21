const assert = require("node:assert/strict");
const { existsSync } = require("node:fs");
const { mkdir, mkdtemp, readFile } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const { join, resolve } = require("node:path");
const { runCli } = require("../dist/cli.js");
const { GoldPatchAgent, NoopAgent } = require("../dist/mock-agents.js");
const { summarizeActivityText } = require("../dist/activity-summary.js");
const { loadTasks } = require("../dist/task-loader.js");
const { readJsonFile, removeDir, writeJsonFile, writeTextFile } = require("../dist/utils.js");
const { runTasks } = require("../dist/workspace-runner.js");

async function createTempDir(prefix) {
  return await mkdtemp(join(tmpdir(), `${prefix}-`));
}

async function writeRepoFiles(taskDir, files) {
  for (const [relativePath, content] of Object.entries(files)) {
    await writeTextFile(join(taskDir, "repo", relativePath), content);
  }
}

async function createTaskFixture(
  root,
  directoryName,
  {
    manifest,
    issue = "Fix the local bug.",
    skipIssueWrite = false,
    repoFiles,
    goldPatch,
    goldStdout,
    goldStderr,
    goldActivity,
    extraFiles = {},
  },
) {
  const taskDir = join(root, directoryName);
  await mkdir(taskDir, { recursive: true });
  await writeJsonFile(join(taskDir, "task.json"), manifest);
  if (!skipIssueWrite) {
    await writeTextFile(join(taskDir, manifest.problemStatementFile ?? "issue.md"), issue);
  }

  if (repoFiles) {
    await mkdir(join(taskDir, "repo"), { recursive: true });
    await writeRepoFiles(taskDir, repoFiles);
  }

  if (goldPatch !== undefined) {
    await writeTextFile(join(taskDir, "gold.patch"), goldPatch);
  }
  if (goldStdout !== undefined) {
    await writeTextFile(join(taskDir, "gold.stdout.txt"), goldStdout);
  }
  if (goldStderr !== undefined) {
    await writeTextFile(join(taskDir, "gold.stderr.txt"), goldStderr);
  }
  if (goldActivity !== undefined) {
    await writeTextFile(join(taskDir, "gold.activity.jsonl"), goldActivity);
  }

  for (const [relativePath, content] of Object.entries(extraFiles)) {
    await writeTextFile(join(taskDir, relativePath), content);
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

function makeWorkspaceManifest(overrides = {}) {
  return {
    id: "sample-workspace-task",
    title: "Sample workspace task",
    taskKind: "workspace-edit",
    category: "debugging",
    difficulty: "easy",
    language: "javascript",
    problemStatementFile: "issue.md",
    verification: {
      failToPass: ["node --test test/fail.test.js"],
      passToPass: ["node --test test/pass.test.js"],
    },
    policy: "always",
    ...overrides,
  };
}

async function testTaskLoaderValidation() {
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
    const manifest = makeWorkspaceManifest({ id: "duplicate-task" });
    await createTaskFixture(root, "task-a", {
      manifest,
      repoFiles,
      goldPatch: "",
    });
    await createTaskFixture(root, "task-b", {
      manifest,
      repoFiles,
      goldPatch: "",
    });
    await assert.rejects(() => loadTasks(root), /Duplicate task id/);
  });

  await withTempDir("gcli-loader-missing-issue", async (root) => {
    await createTaskFixture(root, "task-a", {
      manifest: makeWorkspaceManifest({
        id: "missing-issue",
        problemStatementFile: "missing.md",
      }),
      skipIssueWrite: true,
      repoFiles,
      goldPatch: "",
    });
    await assert.rejects(() => loadTasks(root), /missing problem statement file/);
  });

  await withTempDir("gcli-loader-valid-taxonomy", async (root) => {
    await createTaskFixture(root, "task-a", {
      manifest: makeWorkspaceManifest({
        id: "valid-taxonomy",
        taxonomy: {
          scope: "single-file",
          tags: ["behavior-preservation", "shared-logic"],
        },
      }),
      repoFiles,
      goldPatch: "",
    });
    const tasks = await loadTasks(root);
    assert.deepEqual(tasks[0].taxonomy, {
      scope: "single-file",
      tags: ["behavior-preservation", "shared-logic"],
    });
  });

  await withTempDir("gcli-loader-invalid-task-kind", async (root) => {
    await createTaskFixture(root, "task-a", {
      manifest: makeWorkspaceManifest({
        id: "invalid-task-kind",
        taskKind: "chat-only",
      }),
      repoFiles,
      goldPatch: "",
    });
    await assert.rejects(() => loadTasks(root), /taskKind/);
  });

  await withTempDir("gcli-loader-prompt-no-repo", async (root) => {
    await createTaskFixture(root, "task-a", {
      manifest: {
        id: "prompt-no-repo",
        title: "Prompt task",
        taskKind: "prompt-output",
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
    assert.equal(tasks[0].goldStdoutPath.endsWith("gold.stdout.txt"), true);
  });

  await withTempDir("gcli-loader-prompt-missing-gold", async (root) => {
    await createTaskFixture(root, "task-a", {
      manifest: {
        id: "prompt-missing-gold",
        title: "Prompt task",
        taskKind: "prompt-output",
        category: "debugging",
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
    await assert.rejects(() => loadTasks(root), /missing gold stdout/);
  });

  await withTempDir("gcli-loader-tool-missing-activity", async (root) => {
    await createTaskFixture(root, "task-a", {
      manifest: {
        id: "tool-missing-activity",
        title: "Tool task",
        taskKind: "tool-use",
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

  await withTempDir("gcli-loader-empty-verification", async (root) => {
    await createTaskFixture(root, "task-a", {
      manifest: makeWorkspaceManifest({
        id: "empty-verification",
        verification: {
          failToPass: [],
          passToPass: ["node --test test/pass.test.js"],
        },
      }),
      repoFiles,
      goldPatch: "",
    });
    await assert.rejects(() => loadTasks(root), /verification.failToPass/);
  });
}

async function testPreflightInvalidation() {
  await withTempDir("gcli-preflight-tests", async (root) => {
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

async function testActivitySummaryNormalization() {
  const summary = summarizeActivityText(
    [
      JSON.stringify({
        type: "network",
        payload: {
          body: 'data: {"response":{"candidates":[{"content":{"parts":[{"functionCall":{"name":"read_file","args":{"file_path":"src/router.js"}}}]}}]}}',
        },
      }),
      JSON.stringify({
        functionCall: {
          name: "run_shell_command",
          args: {
            command: "node --test test/fail.test.js",
          },
        },
      }),
    ].join("\n"),
  );

  assert.equal(summary.calls.length, 2);
  assert.deepEqual(summary.calls.map((call) => call.name), ["read_file", "run_shell_command"]);
  assert.equal(summary.calls[0].target, "src/router.js");
  assert.match(summary.calls[1].target, /node --test/);
}

async function testNonWorkspaceTaskKindsAndInterpolation() {
  await withTempDir("gcli-nonworkspace-tests", async (root) => {
    await createTaskFixture(root, "prompt-task", {
      manifest: {
        id: "prompt-task",
        title: "Prompt task",
        taskKind: "prompt-output",
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
        id: "tool-task",
        title: "Tool task",
        taskKind: "tool-use",
        category: "code-review",
        difficulty: "medium",
        language: "text",
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
      generatedAt: "2026-03-15T01:00:00.000Z",
      runId: "gold-nonworkspace",
      artifactsRoot: join(root, "artifacts-gold"),
      workspaceRoot: join(root, "workspaces-gold"),
      keepWorkspaces: false,
      defaultTaskTimeoutMs: 10000,
    });
    assert.deepEqual(
      goldRun.tasks.map((taskResult) => taskResult.status),
      ["passed", "passed"],
    );
    assert.ok(
      goldRun.tasks.every((taskResult) => existsSync(taskResult.artifacts.activitySummaryPath)),
    );

    const noopRun = await runTasks(tasks, new NoopAgent(), {
      generatedAt: "2026-03-15T01:10:00.000Z",
      runId: "noop-nonworkspace",
      artifactsRoot: join(root, "artifacts-noop"),
      workspaceRoot: join(root, "workspaces-noop"),
      keepWorkspaces: false,
      defaultTaskTimeoutMs: 10000,
    });
    assert.deepEqual(
      noopRun.tasks.map((taskResult) => taskResult.status),
      ["failed", "failed"],
    );
  });
}

async function testMockAgentsDriveRealTasks() {
  const tasksDir = resolve("tasks");
  const tasks = await loadTasks(tasksDir);
  assert.equal(tasks.length, 18);
  assert.ok(tasks.every((task) => task.taxonomy));
  assert.equal(tasks.filter((task) => task.taskKind === "workspace-edit").length, 10);
  assert.equal(tasks.filter((task) => task.taskKind === "prompt-output").length, 5);
  assert.equal(tasks.filter((task) => task.taskKind === "tool-use").length, 3);

  await withTempDir("gcli-runner-tests", async (tempRoot) => {
    const passingRun = await runTasks(tasks, new GoldPatchAgent(), {
      generatedAt: "2026-03-15T01:00:00.000Z",
      runId: "gold-agent",
      artifactsRoot: join(tempRoot, "artifacts-gold"),
      workspaceRoot: join(tempRoot, "workspaces-gold"),
      keepWorkspaces: false,
      defaultTaskTimeoutMs: 10000,
    });
    assert.equal(passingRun.summary.passed, 18);
    assert.ok(passingRun.tasks.every((taskResult) => taskResult.status === "passed"));
    assert.deepEqual(passingRun.summary.taskKinds, [
      { taskKind: "prompt-output", count: 5 },
      { taskKind: "tool-use", count: 3 },
      { taskKind: "workspace-edit", count: 10 },
    ]);
    assert.deepEqual(passingRun.summary.taxonomyCoverage.scopes, [
      { scope: "multi-file", count: 9 },
      { scope: "single-file", count: 9 },
    ]);
    assert.equal(passingRun.summary.efficiency.measuredTasks, 18);
    assert.ok(
      passingRun.tasks.every((taskResult) => existsSync(taskResult.artifacts.activitySummaryPath)),
    );

    const failingRun = await runTasks(tasks, new NoopAgent(), {
      generatedAt: "2026-03-15T01:10:00.000Z",
      runId: "noop-agent",
      artifactsRoot: join(tempRoot, "artifacts-noop"),
      workspaceRoot: join(tempRoot, "workspaces-noop"),
      keepWorkspaces: false,
      defaultTaskTimeoutMs: 10000,
    });
    assert.equal(failingRun.summary.failed, 18);
    assert.ok(failingRun.tasks.every((taskResult) => taskResult.status === "failed"));
    assert.equal(failingRun.summary.efficiency.measuredTasks, 18);
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
    assert.match(listResult.output, /Task kinds:/);
    assert.match(listResult.output, /- prompt-output: 5/);
    assert.match(listResult.output, /- tool-use: 3/);
    assert.match(listResult.output, /- workspace-edit: 10/);
    assert.match(listResult.output, /- multi-file: 9/);
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
    assert.equal(Object.keys(baseline.taskStatuses).length, 18);
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
    assert.equal(latestResults.summary.failed, 18);
    assert.deepEqual(latestResults.summary.taskKinds, [
      { taskKind: "prompt-output", count: 5 },
      { taskKind: "tool-use", count: 3 },
      { taskKind: "workspace-edit", count: 10 },
    ]);
    assert.ok(latestResults.tasks.every((taskResult) => taskResult.taskKind));
    assert.ok(latestResults.tasks.every((taskResult) => taskResult.artifacts.activitySummaryPath));

    const latestReport = await readFile(join(reportsDir, "latest-report.md"), "utf8");
    assert.match(latestReport, /# Gemini CLI Contributor Eval Report/);
    assert.match(latestReport, /## Task Kind Coverage/);
    assert.match(latestReport, /prompt-output=5, tool-use=3, workspace-edit=10/);
    assert.match(latestReport, /activity-summary.json/);
    assert.match(latestReport, /Task 'node-config-precedence' regressed from passed to failed/);
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

async function testDocsExampleArtifactsExist() {
  const requiredPaths = [
    resolve("docs/assets/report-overview.svg"),
    resolve("docs/assets/artifact-tree.svg"),
    resolve("docs/assets/regression-pr-view.svg"),
    resolve("docs/examples/mock-report.md"),
    resolve("docs/examples/mock-results.json"),
    resolve("docs/examples/mock-regression.md"),
  ];

  for (const filePath of requiredPaths) {
    assert.equal(existsSync(filePath), true, `missing docs example artifact: ${filePath}`);
  }
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
    ["activity summary normalization", testActivitySummaryNormalization],
    ["non-workspace task kinds and interpolation", testNonWorkspaceTaskKindsAndInterpolation],
    ["mock agent task execution", testMockAgentsDriveRealTasks],
    ["cli agent mode validation", testCliAgentModeValidation],
    ["cli baseline and reports", testCliBaselineAndReports],
    ["docs example artifacts", testDocsExampleArtifactsExist],
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
