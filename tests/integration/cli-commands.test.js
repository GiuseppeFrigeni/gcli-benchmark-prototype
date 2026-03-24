const test = require("node:test");
const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const { join, resolve } = require("node:path");
const { runCli } = require("../../dist/cli.js");
const { NoopAgent } = require("../../dist/mock-agents.js");
const { readJsonFile, writeJsonFile } = require("../../dist/utils.js");
const {
  createTaskFixture,
  makeWorkspaceManifest,
  withTempDir,
} = require("../helpers/task-fixtures.js");

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

test("list and gaps support suite-aware summaries", async () => {
  const tasksDir = resolve("tasks");

  const listAll = await captureCliLogs(["list", "--tasks", tasksDir, "--json"]);
  assert.equal(listAll.exitCode, 0);
  const allSummary = JSON.parse(listAll.output);
  assert.equal(allSummary.total, 32);
  assert.deepEqual(allSummary.suites, [
    ["contributor-workflows", 10],
    ["gemini-core", 11],
    ["harness-calibration", 11],
  ]);

  const listGemini = await captureCliLogs(["list", "--tasks", tasksDir, "--suite", "gemini-core", "--json"]);
  assert.equal(listGemini.exitCode, 0);
  const geminiSummary = JSON.parse(listGemini.output);
  assert.equal(geminiSummary.total, 11);
  assert.ok(geminiSummary.tasks.every((task) => task.suite === "gemini-core"));

  const gapsContributor = await captureCliLogs([
    "gaps",
    "--tasks",
    tasksDir,
    "--suite",
    "contributor-workflows",
    "--json",
  ]);
  assert.equal(gapsContributor.exitCode, 0);
  const gapsSummary = JSON.parse(gapsContributor.output);
  assert.equal(gapsSummary.total, 10);
  assert.equal(typeof gapsSummary.recommendedTemplateFamily, "string");
});

test("validate-task supports human output, JSON output, and invalid paths", async () => {
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

  await withTempDir("gcli-validate-task", async (tempRoot) => {
    const validTaskDir = join(tempRoot, "valid-task");
    await createTaskFixture(tempRoot, "valid-task", {
      manifest: makeWorkspaceManifest({ id: "valid-cli-task" }),
      repoFiles,
      goldPatch: "",
    });

    const validResult = await captureCliLogs([
      "validate-task",
      "--task-dir",
      validTaskDir,
    ]);
    assert.equal(validResult.exitCode, 0);
    assert.match(validResult.output, /Task is valid:/);
    assert.match(validResult.output, /valid-cli-task/);

    const invalidTaskDir = join(tempRoot, "invalid-task");
    await createTaskFixture(tempRoot, "invalid-task", {
      manifest: {
        $schema: "../../docs/task.schema.json",
        id: "invalid-cli-task",
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

    const invalidJsonResult = await captureCliLogs([
      "validate-task",
      "--task-dir",
      invalidTaskDir,
      "--json",
    ]);
    assert.equal(invalidJsonResult.exitCode, 1);
    const invalidReport = JSON.parse(invalidJsonResult.output);
    assert.equal(invalidReport.valid, false);
    assert.equal(invalidReport.taskId, "invalid-cli-task");
    assert.match(invalidReport.issues[0], /missing gold stdout/);

    const missingPathResult = await captureCliLogs([
      "validate-task",
      "--task-dir",
      join(tempRoot, "does-not-exist"),
    ]);
    assert.equal(missingPathResult.exitCode, 1);
    assert.match(missingPathResult.output, /missing task manifest/);
  });
});

test("cli commands emit suite-aware reports and draft tasks", async () => {
  const tasksDir = resolve("tasks");

  await withTempDir("gcli-cli", async (tempRoot) => {
    const reportsDir = join(tempRoot, "reports");
    const baselinePath = join(tempRoot, "baseline.json");
    const workspaceRoot = join(tempRoot, "workspaces");
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
    assert.equal(draftManifest.suite, "contributor-workflows");

    const baselineCode = await runCli(
      [
        "run",
        "--tasks",
        tasksDir,
        "--suite",
        "contributor-workflows",
        "--max-tasks",
        "2",
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
      { now: () => new Date("2026-03-24T02:00:00.000Z") },
    );
    assert.equal(baselineCode, 0);

    const regressionCode = await runCli(
      [
        "run",
        "--tasks",
        tasksDir,
        "--suite",
        "contributor-workflows",
        "--max-tasks",
        "2",
        "--agent-mode",
        "noop",
        "--reports",
        reportsDir,
        "--baseline",
        baselinePath,
        "--workspace-root",
        workspaceRoot,
      ],
      { now: () => new Date("2026-03-24T02:10:00.000Z") },
    );
    assert.equal(regressionCode, 2);

    const latestResults = await readJsonFile(join(reportsDir, "latest-results.json"));
    assert.equal(latestResults.summary.total, 2);
    assert.deepEqual(latestResults.summary.suites, [{ suite: "contributor-workflows", count: 2 }]);
    assert.deepEqual(latestResults.metadata.suites, ["contributor-workflows"]);
    assert.equal(latestResults.tasks.every((task) => task.suite === "contributor-workflows"), true);

    const latestReport = readFileSync(join(reportsDir, "latest-report.md"), "utf8");
    assert.match(latestReport, /## Run Metadata/);
    assert.match(latestReport, /## Suite Coverage/);
    assert.match(latestReport, /Selected Suites: contributor-workflows/);

    const compareResult = await captureCliLogs([
      "compare",
      "--results",
      join(reportsDir, "latest-results.json"),
      "--baseline",
      baselinePath,
    ]);
    assert.equal(compareResult.exitCode, 0);
    assert.match(compareResult.output, /Most regressed suites/);
  });
});

test("cli agent mode validation still rejects incompatible flags", async () => {
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

  const missingTaskDir = await captureCliErrors(["validate-task"]);
  assert.equal(missingTaskDir.exitCode, 1);
  assert.match(missingTaskDir.output, /validate-task requires --task-dir/);
});

test("approval mode still reaches injected Gemini agents", async () => {
  const tasksDir = resolve("tasks");

  await withTempDir("gcli-approval", async (tempRoot) => {
    const reportsDir = join(tempRoot, "reports");
    const workspaceRoot = join(tempRoot, "workspaces");
    const baselinePath = join(tempRoot, "baseline.json");
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
        now: () => new Date("2026-03-24T03:00:00.000Z"),
        createAgent: (options) => {
          capturedOptions = options;
          return new NoopAgent();
        },
      },
    );

    assert.equal(approvalExitCode, 0);
    assert.equal(capturedOptions.approvalMode, "strict-test");
    assert.equal(existsSync(join(reportsDir, "latest-results.json")), true);
  });
});
