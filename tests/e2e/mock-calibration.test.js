const test = require("node:test");
const assert = require("node:assert/strict");
const { existsSync } = require("node:fs");
const { join, resolve } = require("node:path");
const { loadTasks } = require("../../dist/task-loader.js");
const { GoldPatchAgent, NoopAgent } = require("../../dist/mock-agents.js");
const { runTasks } = require("../../dist/workspace-runner.js");
const { withTempDir } = require("../helpers/task-fixtures.js");

test("mock agents drive the full 32-task suite with suite coverage", async () => {
  const tasks = await loadTasks(resolve("tasks"));

  assert.equal(tasks.length, 32);
  assert.equal(tasks.filter((task) => task.taskKind === "workspace-edit").length, 12);
  assert.equal(tasks.filter((task) => task.taskKind === "prompt-output").length, 11);
  assert.equal(tasks.filter((task) => task.taskKind === "tool-use").length, 9);
  assert.equal(tasks.filter((task) => task.suite === "contributor-workflows").length, 10);
  assert.equal(tasks.filter((task) => task.suite === "gemini-core").length, 11);
  assert.equal(tasks.filter((task) => task.suite === "harness-calibration").length, 11);

  await withTempDir("gcli-runner", async (tempRoot) => {
    const passingRun = await runTasks(tasks, new GoldPatchAgent(), {
      generatedAt: "2026-03-24T04:00:00.000Z",
      runId: "gold-agent",
      artifactsRoot: join(tempRoot, "artifacts-gold"),
      workspaceRoot: join(tempRoot, "workspaces-gold"),
      keepWorkspaces: false,
      defaultTaskTimeoutMs: 10000,
    });
    assert.equal(passingRun.summary.passed, 32);
    assert.deepEqual(passingRun.summary.suites, [
      { suite: "contributor-workflows", count: 10 },
      { suite: "gemini-core", count: 11 },
      { suite: "harness-calibration", count: 11 },
    ]);
    assert.ok(
      passingRun.tasks.every((taskResult) => existsSync(taskResult.artifacts.activitySummaryPath)),
    );

    const failingRun = await runTasks(tasks, new NoopAgent(), {
      generatedAt: "2026-03-24T04:10:00.000Z",
      runId: "noop-agent",
      artifactsRoot: join(tempRoot, "artifacts-noop"),
      workspaceRoot: join(tempRoot, "workspaces-noop"),
      keepWorkspaces: false,
      defaultTaskTimeoutMs: 10000,
    });
    assert.equal(failingRun.summary.failed, 32);
    assert.equal(failingRun.summary.failureBreakdown.bySuite.length, 3);
    assert.ok(failingRun.tasks.every((taskResult) => taskResult.status === "failed"));
  });
});
