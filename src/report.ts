import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { EvaluationRun } from "./types";
import { ensureDir, relativePath, timestampForFile, writeJsonFile } from "./utils";

function formatPct(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function formatDecimal(value: number): string {
  return value.toFixed(2);
}

function formatTaxonomy(task: EvaluationRun["tasks"][number]): string {
  if (!task.taxonomy) {
    return "-";
  }
  return `${task.taxonomy.scope}; ${task.taxonomy.tags.join(", ")}`;
}

function formatTaskKinds(run: EvaluationRun): string {
  return run.summary.taskKinds.length === 0
    ? "none"
    : run.summary.taskKinds.map((entry) => `${entry.taskKind}=${entry.count}`).join(", ");
}

function formatSuites(run: EvaluationRun): string {
  return run.summary.suites.length === 0
    ? "none"
    : run.summary.suites.map((entry) => `${entry.suite}=${entry.count}`).join(", ");
}

function formatFailureBreakdown(
  entries: EvaluationRun["summary"]["failureBreakdown"]["byReason"],
): string {
  return entries.length === 0 ? "none" : entries.map((entry) => `${entry.label}=${entry.count}`).join(", ");
}

function formatToolCall(
  call: EvaluationRun["tasks"][number]["failureAnalysis"]["firstObservedToolCall"],
): string {
  if (!call) {
    return "-";
  }
  return call.target ? `${call.name} -> ${call.target}` : call.name;
}

function formatFirstFailure(task: EvaluationRun["tasks"][number]): string {
  if (task.failureAnalysis.firstFailedVerification) {
    return task.failureAnalysis.firstFailedVerification.command;
  }
  if (task.failureAnalysis.toolExpectationFailures.length > 0) {
    return task.failureAnalysis.toolExpectationFailures[0].message;
  }
  return "-";
}

export function renderMarkdownReport(run: EvaluationRun): string {
  const lines: string[] = [];
  lines.push("# Gemini CLI Contributor Eval Report");
  lines.push("");
  lines.push(`Generated at: ${run.summary.generatedAt}`);
  lines.push(`Tasks: ${run.summary.total}`);
  lines.push(`Passed: ${run.summary.passed} (${formatPct(run.summary.passRate)})`);
  lines.push(`Failed: ${run.summary.failed}`);
  lines.push(`Infra Failed: ${run.summary.infraFailed}`);
  lines.push(`Invalid Tasks: ${run.summary.invalidTasks}`);
  lines.push(`Average Duration: ${run.summary.averageDurationMs.toFixed(2)}ms`);
  lines.push("");

  lines.push("## Run Metadata");
  lines.push("");
  lines.push("| Field | Value |");
  lines.push("| --- | --- |");
  lines.push(`| Run ID | ${run.metadata.runId} |`);
  lines.push(`| Mode | ${run.metadata.mode} |`);
  lines.push(`| Git Commit | ${run.metadata.gitCommitSha ?? "unknown"} |`);
  lines.push(`| Gemini CLI Version | ${run.metadata.geminiCliVersion ?? "n/a"} |`);
  lines.push(`| Model | ${run.metadata.model ?? "n/a"} |`);
  lines.push(`| Approval Mode | ${run.metadata.approvalMode ?? "n/a"} |`);
  lines.push(`| Suites | ${run.metadata.suites.join(", ") || "none"} |`);
  lines.push(
    `| Selected Task IDs | ${run.metadata.selectedTaskIds?.join(", ") ?? "all tasks in selected suites"} |`,
  );
  lines.push(
    `| Environment | ${run.metadata.environment.platform}/${run.metadata.environment.arch}; ${run.metadata.environment.nodeVersion} |`,
  );
  lines.push(`| Working Directory | ${run.metadata.environment.workingDirectory} |`);
  lines.push("");

  if (run.config) {
    lines.push("## Run Configuration");
    lines.push("");
    lines.push(`Tasks Dir: ${run.config.tasksDir}`);
    lines.push(`Workspace Root: ${run.config.workspaceRoot}`);
    lines.push(`Keep Workspaces: ${run.config.keepWorkspaces ? "yes" : "no"}`);
    if (run.config.selectedSuites && run.config.selectedSuites.length > 0) {
      lines.push(`Selected Suites: ${run.config.selectedSuites.join(", ")}`);
    }
    if (run.config.selectedTaskIds && run.config.selectedTaskIds.length > 0) {
      lines.push(`Selected Tasks: ${run.config.selectedTaskIds.join(", ")}`);
    }
    if (run.config.mode === "gemini-cli") {
      lines.push(`Gemini Binary: ${run.config.geminiBin}`);
      lines.push(`Model: ${run.config.model ?? "Gemini CLI default"}`);
    }
    if (run.config.geminiArgs && run.config.geminiArgs.length > 0) {
      lines.push(`Gemini Args: \`${run.config.geminiArgs.join(" ")}\``);
    }
    lines.push("");
  }

  lines.push("## Category Metrics");
  lines.push("");
  lines.push("| Category | Passed / Total | Failed | Infra | Invalid | Pass Rate |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const category of run.summary.categories) {
    lines.push(
      `| ${category.category} | ${category.passed}/${category.total} | ${category.failed} | ${category.infraFailed} | ${category.invalidTasks} | ${formatPct(category.passRate)} |`,
    );
  }
  lines.push("");

  lines.push("## Task Kind Coverage");
  lines.push("");
  lines.push(`Task Kinds: ${formatTaskKinds(run)}`);
  lines.push("");

  lines.push("## Suite Coverage");
  lines.push("");
  lines.push(`Suites: ${formatSuites(run)}`);
  lines.push("");

  lines.push("## Taxonomy Coverage");
  lines.push("");
  lines.push(`Tasks With Taxonomy: ${run.summary.taxonomyCoverage.tasksWithTaxonomy}`);
  lines.push(`Tasks Without Taxonomy: ${run.summary.taxonomyCoverage.tasksWithoutTaxonomy}`);
  lines.push(
    `Scopes: ${
      run.summary.taxonomyCoverage.scopes.length === 0
        ? "none"
        : run.summary.taxonomyCoverage.scopes
            .map((entry) => `${entry.scope}=${entry.count}`)
            .join(", ")
    }`,
  );
  lines.push(
    `Tags: ${
      run.summary.taxonomyCoverage.tags.length === 0
        ? "none"
        : run.summary.taxonomyCoverage.tags.map((entry) => `${entry.tag}=${entry.count}`).join(", ")
    }`,
  );
  lines.push("");

  lines.push("## Efficiency Snapshot");
  lines.push("");
  lines.push(`Measured Tasks: ${run.summary.efficiency.measuredTasks}`);
  lines.push(
    `Average Agent Duration: ${formatDecimal(run.summary.efficiency.averageAgentDurationMs)}ms`,
  );
  lines.push(
    `Average Files Changed: ${formatDecimal(run.summary.efficiency.averageFilesChanged)}`,
  );
  lines.push(
    `Average Changed Lines: ${formatDecimal(run.summary.efficiency.averageChangedLines)}`,
  );
  lines.push(`Total Insertions: ${run.summary.efficiency.totalInsertions}`);
  lines.push(`Total Deletions: ${run.summary.efficiency.totalDeletions}`);
  lines.push("");

  lines.push("## Failure Breakdown");
  lines.push("");
  lines.push(`Reasons: ${formatFailureBreakdown(run.summary.failureBreakdown.byReason)}`);
  lines.push(`Suites: ${formatFailureBreakdown(run.summary.failureBreakdown.bySuite)}`);
  lines.push(
    `Task Kinds: ${formatFailureBreakdown(run.summary.failureBreakdown.byTaskKind)}`,
  );
  lines.push(
    `Categories: ${formatFailureBreakdown(run.summary.failureBreakdown.byCategory)}`,
  );
  lines.push("");

  lines.push("## Regression Findings");
  lines.push("");
  if (run.regressions.length === 0) {
    lines.push("No regressions detected.");
  } else {
    for (const finding of run.regressions) {
      const baseline = typeof finding.baselineValue === "number"
        ? finding.baselineValue.toFixed(4)
        : finding.baselineValue;
      const current = typeof finding.currentValue === "number"
        ? finding.currentValue.toFixed(4)
        : finding.currentValue;
      const delta =
        finding.delta === undefined ? "" : `, delta=${finding.delta.toFixed(4)}`;
      lines.push(
        `- [${finding.severity}] ${finding.message} (baseline=${baseline}, current=${current}${delta})`,
      );
    }
  }
  lines.push("");

  lines.push("## Task Results");
  lines.push("");
  lines.push("| Task | Suite | Kind | Category | Language | Taxonomy | Policy | Status | Failure Reason | First Failure | First Tool | Baseline | Harness ms | Agent ms | Files | Changed Lines | Artifacts | Notes |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const task of run.tasks) {
    const artifacts = [
      task.artifacts.diffPath,
      task.artifacts.agentStdoutPath,
      task.artifacts.agentStderrPath,
      task.artifacts.activityLogPath,
      task.artifacts.activitySummaryPath,
    ]
      .filter((value, idx, all) => value && all.indexOf(value) === idx)
      .map((value) => relativePath(task.artifacts.artifactDir, value))
      .join(", ");
    const agentDuration = task.efficiency ? formatDecimal(task.efficiency.agentDurationMs) : "-";
    const filesChanged = task.efficiency ? String(task.efficiency.filesChanged) : "-";
    const changedLines = task.efficiency ? String(task.efficiency.changedLines) : "-";
    const baseline =
      task.failureAnalysis.baselineStatus === undefined
        ? task.failureAnalysis.baselineDelta ?? "-"
        : `${task.failureAnalysis.baselineStatus} -> ${task.failureAnalysis.baselineDelta ?? "unchanged"}`;
    lines.push(
      `| ${task.taskId} | ${task.suite} | ${task.taskKind} | ${task.category} | ${task.language} | ${formatTaxonomy(task)} | ${task.policy} | ${task.status} | ${task.failureAnalysis.reason} | ${formatFirstFailure(task)} | ${formatToolCall(task.failureAnalysis.firstObservedToolCall)} | ${baseline} | ${task.durationMs} | ${agentDuration} | ${filesChanged} | ${changedLines} | ${artifacts || "-"} | ${task.notes.join("; ") || "-"} |`,
    );
  }
  lines.push("");

  return lines.join("\n");
}

export async function saveReports(
  run: EvaluationRun,
  reportDirectory: string,
): Promise<{ jsonPath: string; markdownPath: string }> {
  await ensureDir(reportDirectory);

  const stamp = timestampForFile(run.summary.generatedAt);
  const latestJsonPath = join(reportDirectory, "latest-results.json");
  const latestMarkdownPath = join(reportDirectory, "latest-report.md");
  const archivedJsonPath = join(reportDirectory, `results-${stamp}.json`);
  const archivedMarkdownPath = join(reportDirectory, `report-${stamp}.md`);
  const markdown = renderMarkdownReport(run);

  await writeJsonFile(latestJsonPath, run);
  await writeJsonFile(archivedJsonPath, run);
  await writeFile(latestMarkdownPath, `${markdown}\n`, "utf8");
  await writeFile(archivedMarkdownPath, `${markdown}\n`, "utf8");

  return {
    jsonPath: latestJsonPath,
    markdownPath: latestMarkdownPath,
  };
}
