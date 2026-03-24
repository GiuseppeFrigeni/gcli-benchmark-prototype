const test = require("node:test");
const assert = require("node:assert/strict");
const { summarizeActivityText } = require("../../dist/activity-summary.js");
const { renderMarkdownReport } = require("../../dist/report.js");
const { makeBaseline } = require("../../dist/regression.js");

test("activity summary normalizes embedded tool calls", () => {
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
});

test("report rendering includes run metadata and suite coverage", () => {
  const run = {
    metadata: {
      runId: "report-test",
      generatedAt: "2026-03-24T10:00:00.000Z",
      mode: "gold-patch",
      gitCommitSha: "21f54ff",
      suites: ["gemini-core", "contributor-workflows"],
      environment: {
        platform: "win32",
        arch: "x64",
        nodeVersion: "v20.19.0",
        workingDirectory: "C:/repo",
      },
    },
    summary: {
      generatedAt: "2026-03-24T10:00:00.000Z",
      total: 1,
      passed: 1,
      failed: 0,
      infraFailed: 0,
      invalidTasks: 0,
      passRate: 1,
      averageDurationMs: 10,
      categories: [
        {
          category: "debugging",
          total: 1,
          passed: 1,
          failed: 0,
          infraFailed: 0,
          invalidTasks: 0,
          passRate: 1,
        },
      ],
      suites: [{ suite: "gemini-core", count: 1 }],
      taskKinds: [{ taskKind: "prompt-output", count: 1 }],
      taxonomyCoverage: {
        tasksWithTaxonomy: 1,
        tasksWithoutTaxonomy: 0,
        scopes: [{ scope: "single-file", count: 1 }],
        tags: [{ tag: "strict-output", count: 1 }],
      },
      efficiency: {
        measuredTasks: 1,
        averageAgentDurationMs: 5,
        averageFilesChanged: 0,
        averageChangedLines: 0,
        totalInsertions: 0,
        totalDeletions: 0,
      },
      failureBreakdown: {
        byReason: [],
        bySuite: [],
        byTaskKind: [],
        byCategory: [],
      },
    },
    tasks: [
      {
        taskId: "sample-task",
        title: "Sample task",
        taskKind: "prompt-output",
        suite: "gemini-core",
        category: "debugging",
        difficulty: "easy",
        language: "text",
        taxonomy: {
          scope: "single-file",
          tags: ["strict-output"],
        },
        policy: "always",
        status: "passed",
        durationMs: 10,
        efficiency: {
          agentDurationMs: 5,
          filesChanged: 0,
          insertions: 0,
          deletions: 0,
          changedLines: 0,
        },
        notes: ["All verification commands passed."],
        failureAnalysis: {
          reason: "passed",
          failedVerificationCommands: [],
          missingExpectedInspections: [],
          toolExpectationFailures: [],
          baselineDelta: "unchanged",
        },
        preflight: {
          failToPass: [],
          passToPass: [],
        },
        artifacts: {
          artifactDir: "C:/repo/reports/artifacts/report-test/sample-task",
          promptPath: "C:/repo/reports/artifacts/report-test/sample-task/prompt.txt",
          diffPath: "C:/repo/reports/artifacts/report-test/sample-task/git-diff.patch",
          agentStdoutPath: "C:/repo/reports/artifacts/report-test/sample-task/agent-stdout.txt",
          agentStderrPath: "C:/repo/reports/artifacts/report-test/sample-task/agent-stderr.txt",
          activityLogPath: "C:/repo/reports/artifacts/report-test/sample-task/activity.jsonl",
          activitySummaryPath: "C:/repo/reports/artifacts/report-test/sample-task/activity-summary.json",
        },
        agent: {
          exitCode: 0,
          timedOut: false,
        },
      },
    ],
    regressions: [],
    baselinePath: "C:/repo/baseline/baseline.json",
    config: {
      mode: "gold-patch",
      tasksDir: "C:/repo/tasks",
      workspaceRoot: "C:/repo/tmp",
      keepWorkspaces: false,
      selectedSuites: ["gemini-core"],
    },
  };

  const markdown = renderMarkdownReport(run);
  assert.match(markdown, /## Run Metadata/);
  assert.match(markdown, /Git Commit \| 21f54ff/);
  assert.match(markdown, /## Suite Coverage/);
  assert.match(markdown, /gemini-core=1/);
  assert.match(markdown, /\| sample-task \| gemini-core \| prompt-output \|/);
});

test("baseline creation preserves run metadata", () => {
  const baseline = makeBaseline(
    {
      generatedAt: "2026-03-24T10:00:00.000Z",
      total: 1,
      passed: 1,
      failed: 0,
      infraFailed: 0,
      invalidTasks: 0,
      passRate: 1,
      averageDurationMs: 10,
      categories: [],
      suites: [],
      taskKinds: [],
      taxonomyCoverage: {
        tasksWithTaxonomy: 0,
        tasksWithoutTaxonomy: 0,
        scopes: [],
        tags: [],
      },
      efficiency: {
        measuredTasks: 0,
        averageAgentDurationMs: 0,
        averageFilesChanged: 0,
        averageChangedLines: 0,
        totalInsertions: 0,
        totalDeletions: 0,
      },
      failureBreakdown: {
        byReason: [],
        bySuite: [],
        byTaskKind: [],
        byCategory: [],
      },
    },
    [{ taskId: "sample-task", status: "passed" }],
    {
      runId: "baseline-test",
      generatedAt: "2026-03-24T10:00:00.000Z",
      mode: "gold-patch",
      gitCommitSha: "21f54ff",
      suites: ["harness-calibration"],
      environment: {
        platform: "linux",
        arch: "x64",
        nodeVersion: "v22.0.0",
        workingDirectory: "/tmp/repo",
      },
    },
  );

  assert.equal(baseline.metadata.runId, "baseline-test");
  assert.equal(baseline.metadata.gitCommitSha, "21f54ff");
});
