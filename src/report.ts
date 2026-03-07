import { join } from "node:path";
import { writeFile } from "node:fs/promises";
import { EvaluationRun } from "./types";
import { ensureDir, timestampForFile, writeJsonFile } from "./utils";

function formatPct(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export function renderMarkdownReport(run: EvaluationRun): string {
  const lines: string[] = [];
  lines.push("# Gemini CLI Behavioral Evaluation Report");
  lines.push("");
  lines.push(`Generated at: ${run.summary.generatedAt}`);
  lines.push(`Scenarios: ${run.summary.total}`);
  lines.push(`Passed: ${run.summary.passed} (${formatPct(run.summary.successRate)})`);
  lines.push(`Average Score: ${run.summary.averageScore.toFixed(2)}/100`);
  lines.push(`Average Duration: ${run.summary.averageDurationMs.toFixed(2)}ms`);
  lines.push("");

  if (run.config) {
    lines.push("## Run Configuration");
    lines.push("");
    lines.push(`Mode: ${run.config.mode}`);
    lines.push(`Gemini Binary: ${run.config.geminiBin ?? "gemini"}`);
    lines.push(`Model: ${run.config.model ?? "Gemini CLI default"}`);
    lines.push(`Model Source: ${run.config.modelSource ?? "cli-default"}`);
    lines.push(
      `Observed Models: ${run.config.observedModels && run.config.observedModels.length > 0 ? run.config.observedModels.join(", ") : "none-detected"}`,
    );
    if (run.config.geminiArgs && run.config.geminiArgs.length > 0) {
      lines.push(`Gemini Args: \`${run.config.geminiArgs.join(" ")}\``);
    }
    lines.push("");
  }

  lines.push("## Category Metrics");
  lines.push("");
  lines.push("| Category | Passed / Total | Success Rate | Avg Score |");
  lines.push("| --- | --- | --- | --- |");
  for (const category of run.summary.categories) {
    lines.push(
      `| ${category.category} | ${category.passed}/${category.total} | ${formatPct(category.successRate)} | ${category.averageScore.toFixed(2)} |`,
    );
  }
  lines.push("");

  lines.push("## Regression Findings");
  lines.push("");
  if (run.regressions.length === 0) {
    lines.push("No regressions detected.");
  } else {
    for (const finding of run.regressions) {
      lines.push(
        `- [${finding.severity}] ${finding.message} (baseline=${finding.baselineValue.toFixed(4)}, current=${finding.currentValue.toFixed(4)}, delta=${finding.delta.toFixed(4)})`,
      );
    }
  }
  lines.push("");

  lines.push("## Scenario Results");
  lines.push("");
  lines.push(
    "| Scenario | Category | Model | Weight | Passed | Score | Duration (ms) | Tags | Notes |",
  );
  lines.push("| --- | --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const scenario of run.scenarios) {
    lines.push(
      `| ${scenario.scenarioId} | ${scenario.category} | ${scenario.detectedModel ?? "-"} | ${scenario.weight.toFixed(2)} | ${scenario.passed ? "yes" : "no"} | ${scenario.score}/${scenario.maxScore} | ${scenario.durationMs} | ${(scenario.tags ?? []).join(", ") || "-"} | ${scenario.notes.join("; ")} |`,
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
