import {
  CategorySummary,
  EvaluationSummary,
  Scenario,
  ScenarioEvaluation,
} from "./types";
import { AgentAdapter } from "./gemini-adapter";
import { clamp, roundTo } from "./utils";

function includesTerm(text: string, term: string): boolean {
  return text.includes(term.toLowerCase());
}

function scoreScenario(scenario: Scenario, output: string): Omit<
  ScenarioEvaluation,
  | "scenarioId"
  | "title"
  | "category"
  | "difficulty"
  | "weight"
  | "tags"
  | "detectedModel"
  | "durationMs"
> {
  const normalized = output.toLowerCase();
  const expectedHits = scenario.expectedKeywords.filter((keyword) =>
    includesTerm(normalized, keyword.toLowerCase()),
  );
  const missingExpected = scenario.expectedKeywords.filter(
    (keyword) => !expectedHits.includes(keyword),
  );
  const forbiddenKeywords = scenario.forbiddenKeywords ?? [];
  const forbiddenHits = forbiddenKeywords.filter((keyword) =>
    includesTerm(normalized, keyword.toLowerCase()),
  );

  const expectedRatio =
    scenario.expectedKeywords.length > 0
      ? expectedHits.length / scenario.expectedKeywords.length
      : 0;
  const forbiddenRatio =
    forbiddenKeywords.length > 0 ? forbiddenHits.length / forbiddenKeywords.length : 0;

  const coverageScore = expectedRatio * 90;
  const verbosityBonus = output.length >= 140 ? 10 : 5;
  const forbiddenPenalty = forbiddenRatio * 35;
  const finalScore = clamp(Math.round(coverageScore + verbosityBonus - forbiddenPenalty), 0, 100);
  const passed = finalScore >= 65 && forbiddenHits.length === 0;

  const notes: string[] = [];
  if (missingExpected.length > 0) {
    notes.push(`Missing expected signals: ${missingExpected.join(", ")}`);
  }
  if (forbiddenHits.length > 0) {
    notes.push(`Forbidden signals found: ${forbiddenHits.join(", ")}`);
  }
  if (notes.length === 0) {
    notes.push("All expected behavioral signals found.");
  }

  return {
    passed,
    score: finalScore,
    maxScore: 100,
    expectedHits,
    missingExpected,
    forbiddenHits,
    notes,
  };
}

function buildCategorySummaries(results: ScenarioEvaluation[]): CategorySummary[] {
  const grouped = new Map<string, ScenarioEvaluation[]>();
  for (const result of results) {
    const list = grouped.get(result.category) ?? [];
    list.push(result);
    grouped.set(result.category, list);
  }

  return [...grouped.entries()]
    .map(([category, entries]) => {
      const total = entries.length;
      const passed = entries.filter((entry) => entry.passed).length;
      const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
      const passedWeight = entries.reduce(
        (sum, entry) => sum + (entry.passed ? entry.weight : 0),
        0,
      );
      const weightedScore = entries.reduce(
        (sum, entry) => sum + entry.score * entry.weight,
        0,
      );
      return {
        category: category as CategorySummary["category"],
        total,
        passed,
        successRate: roundTo(totalWeight === 0 ? 0 : passedWeight / totalWeight, 4),
        averageScore: roundTo(totalWeight === 0 ? 0 : weightedScore / totalWeight, 2),
      };
    })
    .sort((a, b) => a.category.localeCompare(b.category));
}

export async function evaluateScenarios(
  scenarios: Scenario[],
  agent: AgentAdapter,
): Promise<{ summary: EvaluationSummary; scenarios: ScenarioEvaluation[] }> {
  const scenarioResults: ScenarioEvaluation[] = [];

  for (const scenario of scenarios) {
    try {
      const runResult = await agent.runScenario(scenario);
      const scored = scoreScenario(scenario, runResult.output);

      scenarioResults.push({
        scenarioId: scenario.id,
        title: scenario.title,
        category: scenario.category,
        difficulty: scenario.difficulty,
        weight: scenario.weight ?? 1,
        tags: scenario.tags,
        detectedModel: runResult.detectedModel,
        durationMs: runResult.durationMs,
        ...scored,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      scenarioResults.push({
        scenarioId: scenario.id,
        title: scenario.title,
        category: scenario.category,
        difficulty: scenario.difficulty,
        weight: scenario.weight ?? 1,
        tags: scenario.tags,
        detectedModel: undefined,
        passed: false,
        score: 0,
        maxScore: 100,
        expectedHits: [],
        missingExpected: scenario.expectedKeywords,
        forbiddenHits: [],
        durationMs: scenario.timeoutMs ?? 0,
        notes: [`Execution error: ${message}`],
      });
    }
  }

  const total = scenarioResults.length;
  const passed = scenarioResults.filter((result) => result.passed).length;
  const totalWeight = scenarioResults.reduce((sum, result) => sum + result.weight, 0);
  const passedWeight = scenarioResults.reduce(
    (sum, result) => sum + (result.passed ? result.weight : 0),
    0,
  );
  const weightedScore = scenarioResults.reduce(
    (sum, result) => sum + result.score * result.weight,
    0,
  );
  const averageDurationMs =
    total === 0
      ? 0
      : scenarioResults.reduce((sum, result) => sum + result.durationMs, 0) / total;
  const categories = buildCategorySummaries(scenarioResults);

  const summary: EvaluationSummary = {
    generatedAt: new Date().toISOString(),
    total,
    passed,
    successRate: roundTo(totalWeight === 0 ? 0 : passedWeight / totalWeight, 4),
    averageScore: roundTo(totalWeight === 0 ? 0 : weightedScore / totalWeight, 2),
    averageDurationMs: roundTo(averageDurationMs, 2),
    categories,
  };

  return { summary, scenarios: scenarioResults };
}
