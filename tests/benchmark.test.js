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

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function makeTerminalSvg(title, lines, accent) {
  const rowHeight = 22;
  const width = 980;
  const height = 120 + lines.length * rowHeight;
  const text = lines
    .map(
      (line, index) =>
        `<text x="36" y="${96 + index * rowHeight}" fill="#d8dee9" font-family="Consolas, 'Courier New', monospace" font-size="16">${escapeXml(line)}</text>`,
    )
    .join("");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    '<rect width="100%" height="100%" rx="24" fill="#0f172a"/>',
    `<rect x="16" y="16" width="${width - 32}" height="${height - 32}" rx="18" fill="#111827" stroke="${accent}" stroke-width="2"/>`,
    `<circle cx="42" cy="44" r="8" fill="${accent}"/>`,
    '<circle cx="66" cy="44" r="8" fill="#f59e0b"/>',
    '<circle cx="90" cy="44" r="8" fill="#10b981"/>',
    `<text x="120" y="50" fill="#f8fafc" font-family="Consolas, 'Courier New', monospace" font-size="20">${escapeXml(title)}</text>`,
    text,
    "</svg>",
  ].join("");
}

async function listTaskArtifacts(artifactRoot) {
  const taskDirs = (await require("node:fs/promises").readdir(artifactRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))
    .slice(0, 5);

  const lines = ["reports/artifacts/<run-id>/"];
  for (const taskId of taskDirs) {
    lines.push(`  ${taskId}/`);
    lines.push("    prompt.txt");
    lines.push("    agent-stdout.txt");
    lines.push("    activity-summary.json");
  }
  return lines;
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

  await withTempDir("gcli-loader-tool-expectations", async (root) => {
    await createTaskFixture(root, "task-a", {
      manifest: {
        id: "tool-expectations",
        title: "Tool task",
        taskKind: "tool-use",
        category: "debugging",
        difficulty: "hard",
        language: "text",
        problemStatementFile: "issue.md",
        toolExpectations: {
          firstCall: { name: "read_file", targetIncludes: "notes.txt" },
          requiredCalls: [{ name: "read_file", targetIncludes: "notes.txt" }],
          orderedCalls: [{ name: "read_file", targetIncludes: "notes.txt" }],
        },
        verification: {
          failToPass: ["node -e \"process.exit(1)\""],
          passToPass: ["node -e \"process.exit(0)\""],
        },
        policy: "always",
      },
      goldStdout: "ok\n",
      goldActivity: "{\"functionCall\":{\"name\":\"read_file\",\"args\":{\"file_path\":\"notes.txt\"}}}\n",
    });
    const tasks = await loadTasks(root);
    assert.deepEqual(tasks[0].toolExpectations.firstCall, {
      name: "read_file",
      targetIncludes: "notes.txt",
    });
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
    const goldToolTask = goldRun.tasks.find((taskResult) => taskResult.taskId === "tool-task");
    assert.equal(goldToolTask.failureAnalysis.reason, "passed");
    assert.equal(goldToolTask.failureAnalysis.toolExpectationFailures.length, 0);

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
    const noopToolTask = noopRun.tasks.find((taskResult) => taskResult.taskId === "tool-task");
    assert.equal(noopToolTask.failureAnalysis.reason, "tool-expectation-failed");
    assert.equal(noopToolTask.failureAnalysis.missingExpectedInspections.length, 2);
  });
}

async function testMockAgentsDriveRealTasks() {
  const tasksDir = resolve("tasks");
  const tasks = await loadTasks(tasksDir);
  assert.equal(tasks.length, 26);
  assert.ok(tasks.every((task) => task.taxonomy));
  assert.equal(tasks.filter((task) => task.taskKind === "workspace-edit").length, 12);
  assert.equal(tasks.filter((task) => task.taskKind === "prompt-output").length, 7);
  assert.equal(tasks.filter((task) => task.taskKind === "tool-use").length, 7);

  await withTempDir("gcli-runner-tests", async (tempRoot) => {
    const passingRun = await runTasks(tasks, new GoldPatchAgent(), {
      generatedAt: "2026-03-15T01:00:00.000Z",
      runId: "gold-agent",
      artifactsRoot: join(tempRoot, "artifacts-gold"),
      workspaceRoot: join(tempRoot, "workspaces-gold"),
      keepWorkspaces: false,
      defaultTaskTimeoutMs: 10000,
    });
    assert.equal(passingRun.summary.passed, 26);
    assert.ok(passingRun.tasks.every((taskResult) => taskResult.status === "passed"));
    assert.deepEqual(passingRun.summary.taskKinds, [
      { taskKind: "prompt-output", count: 7 },
      { taskKind: "tool-use", count: 7 },
      { taskKind: "workspace-edit", count: 12 },
    ]);
    assert.deepEqual(passingRun.summary.taxonomyCoverage.scopes, [
      { scope: "multi-file", count: 17 },
      { scope: "single-file", count: 9 },
    ]);
    assert.equal(passingRun.summary.efficiency.measuredTasks, 26);
    assert.deepEqual(passingRun.summary.failureBreakdown.byReason, []);
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
    assert.equal(failingRun.summary.failed, 26);
    assert.ok(failingRun.tasks.every((taskResult) => taskResult.status === "failed"));
    assert.equal(failingRun.summary.efficiency.measuredTasks, 26);
    assert.equal(failingRun.summary.efficiency.averageChangedLines, 0);
    assert.ok(failingRun.summary.failureBreakdown.byReason.length >= 1);
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
    const workspaceRoot = join(tempRoot, "workspaces");

    const listResult = await captureCliLogs(["list", "--tasks", tasksDir]);
    assert.equal(listResult.exitCode, 0);
    assert.match(listResult.output, /Task kinds:/);
    assert.match(listResult.output, /- prompt-output: 7/);
    assert.match(listResult.output, /- tool-use: 7/);
    assert.match(listResult.output, /- workspace-edit: 12/);
    assert.match(listResult.output, /- hard: 4/);
    assert.match(listResult.output, /- multi-file: 17/);
    assert.match(listResult.output, /Tasks missing taxonomy: 0/);

    const gapsResult = await captureCliLogs(["gaps", "--tasks", tasksDir]);
    assert.equal(gapsResult.exitCode, 0);
    assert.match(gapsResult.output, /Recommended template family:/);

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
        "--workspace-root",
        workspaceRoot,
        "--update-baseline",
      ],
      { now: () => new Date("2026-03-15T02:00:00.000Z") },
    );
    assert.equal(updateCode, 0);

    const baseline = await readJsonFile(baselinePath);
    assert.equal(baseline.overallPassRate, 1);
    assert.equal(Object.keys(baseline.taskStatuses).length, 26);
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
        "--workspace-root",
        workspaceRoot,
      ],
      { now: () => new Date("2026-03-15T02:10:00.000Z") },
    );
    assert.equal(regressionCode, 2);

    const latestResults = await readJsonFile(join(reportsDir, "latest-results.json"));
    assert.equal(latestResults.summary.failed, 26);
    assert.deepEqual(latestResults.summary.taskKinds, [
      { taskKind: "prompt-output", count: 7 },
      { taskKind: "tool-use", count: 7 },
      { taskKind: "workspace-edit", count: 12 },
    ]);
    assert.ok(latestResults.tasks.every((taskResult) => taskResult.taskKind));
    assert.ok(latestResults.tasks.every((taskResult) => taskResult.artifacts.activitySummaryPath));
    assert.ok(latestResults.tasks.every((taskResult) => taskResult.failureAnalysis));
    assert.ok(latestResults.summary.failureBreakdown.byReason.length >= 1);

    const latestReport = await readFile(join(reportsDir, "latest-report.md"), "utf8");
    assert.match(latestReport, /# Gemini CLI Contributor Eval Report/);
    assert.match(latestReport, /## Failure Breakdown/);
    assert.match(latestReport, /## Task Kind Coverage/);
    assert.match(latestReport, /prompt-output=7, tool-use=7, workspace-edit=12/);
    assert.match(latestReport, /activity-summary.json/);
    assert.match(latestReport, /Task 'node-config-precedence' regressed from passed to failed/);

    const compareResult = await captureCliLogs([
      "compare",
      "--results",
      join(reportsDir, "latest-results.json"),
      "--baseline",
      baselinePath,
    ]);
    assert.equal(compareResult.exitCode, 0);
    assert.match(compareResult.output, /Most regressed task kinds/);
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

async function testCliApprovalModeAndContributorCommands() {
  const tasksDir = resolve("tasks");

  await withTempDir("gcli-contributor-tests", async (tempRoot) => {
    const reportsDir = join(tempRoot, "reports");
    const workspaceRoot = join(tempRoot, "workspaces");
    const baselinePath = join(tempRoot, "baseline.json");
    const chatLogPath = join(tempRoot, "chat-log.json");
    await writeJsonFile(chatLogPath, {
      title: "Draft task from chat log",
      summary: "Turn this conversation into a task skeleton.",
      acceptanceCriteria: ["Capture the issue summary", "Keep strict output requirements obvious"],
      relevantFiles: ["src/cli.ts", "docs/ADDING_TASKS.md"],
      conversation: [
        { role: "user", content: "Please turn this bug report into a draft eval." },
        { role: "assistant", content: "Use a tool-use template and preserve the maintainer wording." },
      ],
    });

    const listJson = await captureCliLogs(["list", "--tasks", tasksDir, "--json"]);
    assert.equal(listJson.exitCode, 0);
    const listSummary = JSON.parse(listJson.output);
    assert.equal(listSummary.total, 26);
    assert.equal(listSummary.taskKinds.find((entry) => entry[0] === "tool-use")[1], 7);

    const gapsJson = await captureCliLogs(["gaps", "--tasks", tasksDir, "--json"]);
    assert.equal(gapsJson.exitCode, 0);
    const gapsSummary = JSON.parse(gapsJson.output);
    assert.equal(typeof gapsSummary.recommendedTemplateFamily, "string");

    const draftResult = await captureCliLogs([
      "draft-task",
      "--chat-log",
      chatLogPath,
      "--task-id",
      "draft-chat-task",
      "--task-kind",
      "tool-use",
      "--category",
      "debugging",
      "--language",
      "text",
      "--out",
      join(tempRoot, "draft-chat-task"),
    ]);
    assert.equal(draftResult.exitCode, 0);
    const draftManifest = await readJsonFile(join(tempRoot, "draft-chat-task", "task.json"));
    assert.equal(draftManifest.id, "draft-chat-task");
    assert.equal(draftManifest.taskKind, "tool-use");
    assert.equal(existsSync(join(tempRoot, "draft-chat-task", "issue.md")), true);
    assert.equal(existsSync(join(tempRoot, "draft-chat-task", "chat-log.json")), true);

    let capturedOptions;
    const approvalExitCode = await runCli(
      [
        "run",
        "--tasks",
        tasksDir,
        "--task",
        "eval-gap-inventory-json",
        "--agent-mode",
        "gemini-cli",
        "--approval-mode",
        "strict-test",
        "--reports",
        reportsDir,
        "--baseline",
        baselinePath,
        "--workspace-root",
        workspaceRoot,
      ],
      {
        now: () => new Date("2026-03-15T03:00:00.000Z"),
        createAgent: (options) => {
          capturedOptions = options;
          return new NoopAgent();
        },
      },
    );
    assert.equal(approvalExitCode, 0);
    assert.equal(capturedOptions.approvalMode, "strict-test");
  });
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

async function refreshCheckedInArtifacts() {
  const generatedRoot = resolve("docs/.tmp-examples");
  const passReports = join(generatedRoot, "pass");
  const regressionReports = join(generatedRoot, "regression");
  const docsBaselinePath = join(generatedRoot, "baseline.json");
  const docsWorkspaceRoot = join(generatedRoot, "workspaces");
  const repoBaselinePath = resolve("baseline/baseline.json");
  const repoWorkspaceRoot = join(generatedRoot, "baseline-workspaces");
  const docsExamplesDir = resolve("docs/examples");
  const docsAssetsDir = resolve("docs/assets");

  await removeDir(generatedRoot);
  await mkdir(passReports, { recursive: true });
  await mkdir(regressionReports, { recursive: true });
  await mkdir(docsExamplesDir, { recursive: true });
  await mkdir(docsAssetsDir, { recursive: true });

  const baselineCode = await runCli(
    [
      "run",
      "--agent-mode",
      "gold-patch",
      "--reports",
      resolve("reports"),
      "--baseline",
      repoBaselinePath,
      "--workspace-root",
      repoWorkspaceRoot,
      "--update-baseline",
    ],
    { now: () => new Date("2026-03-21T08:45:00.000Z") },
  );
  assert.equal(baselineCode, 0);

  const passCode = await runCli(
    [
      "run",
      "--agent-mode",
      "gold-patch",
      "--reports",
      passReports,
      "--baseline",
      docsBaselinePath,
      "--workspace-root",
      docsWorkspaceRoot,
      "--update-baseline",
    ],
    { now: () => new Date("2026-03-21T09:00:00.000Z") },
  );
  assert.equal(passCode, 0);

  const regressionCode = await runCli(
    [
      "run",
      "--agent-mode",
      "noop",
      "--reports",
      regressionReports,
      "--baseline",
      docsBaselinePath,
      "--workspace-root",
      docsWorkspaceRoot,
    ],
    { now: () => new Date("2026-03-21T09:10:00.000Z") },
  );
  assert.equal(regressionCode, 2);

  const passReport = await readFile(join(passReports, "latest-report.md"), "utf8");
  const regressionReport = await readFile(join(regressionReports, "latest-report.md"), "utf8");
  const regressionResults = await readJsonFile(join(regressionReports, "latest-results.json"));
  const artifactRunId = (await require("node:fs/promises").readdir(join(regressionReports, "artifacts")))[0];
  const artifactTreeLines = await listTaskArtifacts(join(regressionReports, "artifacts", artifactRunId));

  await writeTextFile(join(docsExamplesDir, "mock-report.md"), passReport);
  await writeJsonFile(join(docsExamplesDir, "mock-results.json"), regressionResults);
  await writeTextFile(join(docsExamplesDir, "mock-regression.md"), regressionReport);
  await writeTextFile(
    join(docsAssetsDir, "report-overview.svg"),
    makeTerminalSvg("Mock Report Overview", passReport.split(/\r?\n/).slice(0, 20), "#38bdf8"),
  );
  await writeTextFile(
    join(docsAssetsDir, "artifact-tree.svg"),
    makeTerminalSvg("Per-Task Artifact Layout", artifactTreeLines, "#22c55e"),
  );
  await writeTextFile(
    join(docsAssetsDir, "regression-pr-view.svg"),
    makeTerminalSvg("Regression Snapshot", regressionReport.split(/\r?\n/).slice(0, 20), "#f97316"),
  );

  await removeDir(generatedRoot);
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
  if (process.argv.includes("--refresh-artifacts") || process.env.REFRESH_ARTIFACTS === "1") {
    await refreshCheckedInArtifacts();
    console.log("Refreshed checked-in artifacts.");
    return;
  }

  const cases = [
    ["task loader validation", testTaskLoaderValidation],
    ["preflight invalidation", testPreflightInvalidation],
    ["activity summary normalization", testActivitySummaryNormalization],
    ["non-workspace task kinds and interpolation", testNonWorkspaceTaskKindsAndInterpolation],
    ["mock agent task execution", testMockAgentsDriveRealTasks],
    ["cli agent mode validation", testCliAgentModeValidation],
    ["cli baseline and reports", testCliBaselineAndReports],
    ["cli approval mode and contributor commands", testCliApprovalModeAndContributorCommands],
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
