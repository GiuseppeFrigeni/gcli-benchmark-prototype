import { access } from "node:fs/promises";
import { constants } from "node:fs";
import {
  BaselineMetrics,
  EvaluationSummary,
  RegressionFinding,
  ScenarioCategory,
} from "./types";
import { ensureDir, readJsonFile, writeJsonFile } from "./utils";
import { dirname } from "node:path";

export interface RegressionOptions {
  successRateTolerance: number;
  scoreTolerance: number;
}

export function makeBaseline(summary: EvaluationSummary): BaselineMetrics {
  const categorySuccessRate: Partial<Record<ScenarioCategory, number>> = {};
  for (const category of summary.categories) {
    categorySuccessRate[category.category] = category.successRate;
  }
  return {
    generatedAt: summary.generatedAt,
    sampleSize: summary.total,
    overallSuccessRate: summary.successRate,
    overallAverageScore: summary.averageScore,
    categorySuccessRate,
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
  baseline: BaselineMetrics | null,
  options: RegressionOptions,
): RegressionFinding[] {
  if (!baseline) {
    return [];
  }

  const findings: RegressionFinding[] = [];

  const successDelta = summary.successRate - baseline.overallSuccessRate;
  if (successDelta < -options.successRateTolerance) {
    findings.push({
      scope: "overall-success",
      severity: "high",
      message: "Overall success rate regressed beyond tolerance.",
      baselineValue: baseline.overallSuccessRate,
      currentValue: summary.successRate,
      delta: successDelta,
    });
  }

  const scoreDelta = summary.averageScore - baseline.overallAverageScore;
  if (scoreDelta < -options.scoreTolerance) {
    findings.push({
      scope: "overall-score",
      severity: "medium",
      message: "Overall average score regressed beyond tolerance.",
      baselineValue: baseline.overallAverageScore,
      currentValue: summary.averageScore,
      delta: scoreDelta,
    });
  }

  for (const category of summary.categories) {
    const baselineRate = baseline.categorySuccessRate[category.category];
    if (baselineRate === undefined) {
      continue;
    }
    const delta = category.successRate - baselineRate;
    if (delta < -options.successRateTolerance) {
      findings.push({
        scope: "category-success",
        severity: "medium",
        message: `Category '${category.category}' success rate regressed beyond tolerance.`,
        baselineValue: baselineRate,
        currentValue: category.successRate,
        delta,
        category: category.category,
      });
    }
  }

  return findings;
}
