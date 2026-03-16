import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { EvaluationRun } from "./types";
import { ensureDir, relativePath, timestampForFile, writeJsonFile } from "./utils";

function formatPct(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export function renderMarkdownReport(run: EvaluationRun): string {
  const lines: string[] = [];
  lines.push("# Workspace Task Evaluation Report");
  lines.push("");
  lines.push(`Generated at: ${run.summary.generatedAt}`);
  lines.push(`Tasks: ${run.summary.total}`);
  lines.push(`Passed: ${run.summary.passed} (${formatPct(run.summary.passRate)})`);
  lines.push(`Failed: ${run.summary.failed}`);
  lines.push(`Infra Failed: ${run.summary.infraFailed}`);
  lines.push(`Invalid Tasks: ${run.summary.invalidTasks}`);
  lines.push(`Average Duration: ${run.summary.averageDurationMs.toFixed(2)}ms`);
  lines.push("");

  if (run.config) {
    lines.push("## Run Configuration");
    lines.push("");
    lines.push(`Mode: ${run.config.mode}`);
    if (run.config.mode === "gemini-cli") {
      lines.push(`Gemini Binary: ${run.config.geminiBin}`);
      lines.push(`Model: ${run.config.model ?? "Gemini CLI default"}`);
    }
    lines.push(`Tasks Dir: ${run.config.tasksDir}`);
    lines.push(`Workspace Root: ${run.config.workspaceRoot}`);
    lines.push(`Keep Workspaces: ${run.config.keepWorkspaces ? "yes" : "no"}`);
    if (run.config.selectedTaskIds && run.config.selectedTaskIds.length > 0) {
      lines.push(`Selected Tasks: ${run.config.selectedTaskIds.join(", ")}`);
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
  lines.push("| Task | Category | Language | Policy | Status | Duration (ms) | Artifacts | Notes |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const task of run.tasks) {
    const artifacts = [
      task.artifacts.diffPath,
      task.artifacts.agentStdoutPath,
      task.artifacts.agentStderrPath,
      task.artifacts.activityLogPath,
    ]
      .filter((value, idx, all) => value && all.indexOf(value) === idx)
      .map((value) => relativePath(task.artifacts.artifactDir, value))
      .join(", ");
    lines.push(
      `| ${task.taskId} | ${task.category} | ${task.language} | ${task.policy} | ${task.status} | ${task.durationMs} | ${artifacts || "-"} | ${task.notes.join("; ") || "-"} |`,
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
