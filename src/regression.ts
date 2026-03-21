import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname } from "node:path";
import {
  BaselineMetrics,
  EvaluationSummary,
  RegressionFinding,
  TaskRunResult,
  TaskStatus,
} from "./types";
import { ensureDir, readJsonFile, writeJsonFile } from "./utils";

export function makeBaseline(
  summary: EvaluationSummary,
  tasks: TaskRunResult[],
): BaselineMetrics {
  const taskStatuses: Record<string, TaskStatus> = {};
  for (const task of tasks) {
    taskStatuses[task.taskId] = task.status;
  }

  return {
    generatedAt: summary.generatedAt,
    total: summary.total,
    overallPassRate: summary.passRate,
    taskStatuses,
  };
}

export async function loadBaselineIfExists(
  path: string,
): Promise<BaselineMetrics | null> {
  try {
    await access(path, constants.F_OK);
    return await readJsonFile<BaselineMetrics>(path);
  } catch {
    return null;
  }
}

export async function saveBaseline(
  path: string,
  baseline: BaselineMetrics,
): Promise<void> {
  await ensureDir(dirname(path));
  await writeJsonFile(path, baseline);
}

export function detectRegressions(
  summary: EvaluationSummary,
  tasks: TaskRunResult[],
  baseline: BaselineMetrics | null,
): RegressionFinding[] {
  if (!baseline) {
    return [];
  }

  const findings: RegressionFinding[] = [];
  const passRateDelta = summary.passRate - baseline.overallPassRate;
  if (passRateDelta < 0) {
    findings.push({
      scope: "overall-pass-rate",
      severity: "high",
      message: "Overall pass rate regressed.",
      baselineValue: baseline.overallPassRate,
      currentValue: summary.passRate,
      delta: passRateDelta,
    });
  }

  for (const task of tasks) {
    const previousStatus = baseline.taskStatuses[task.taskId];
    if (previousStatus !== "passed") {
      continue;
    }
    if (task.status !== "passed") {
      findings.push({
        scope: "task-status",
        severity: "medium",
        message: `Task '${task.taskId}' regressed from passed to ${task.status}.`,
        baselineValue: previousStatus,
        currentValue: task.status,
        taskId: task.taskId,
      });
    }
  }

  return findings;
}

export function attachBaselineContext(
  tasks: TaskRunResult[],
  baseline: BaselineMetrics | null,
): TaskRunResult[] {
  if (!baseline) {
    return tasks.map((task) => ({
      ...task,
      failureAnalysis: {
        ...task.failureAnalysis,
        baselineDelta: "new-task",
      },
    }));
  }

  return tasks.map((task) => {
    const previousStatus = baseline.taskStatuses[task.taskId];
    let baselineDelta: TaskRunResult["failureAnalysis"]["baselineDelta"];
    if (previousStatus === undefined) {
      baselineDelta = "new-task";
    } else if (previousStatus === task.status) {
      baselineDelta = "unchanged";
    } else if (previousStatus === "passed" && task.status !== "passed") {
      baselineDelta = "regressed";
    } else if (previousStatus !== "passed" && task.status === "passed") {
      baselineDelta = "improved";
    } else {
      baselineDelta = "changed";
    }

    return {
      ...task,
      failureAnalysis: {
        ...task.failureAnalysis,
        baselineStatus: previousStatus,
        baselineDelta,
      },
    };
  });
}
