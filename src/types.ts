export type ScenarioCategory =
  | "debugging"
  | "refactoring"
  | "new-feature"
  | "code-review";

export type ScenarioDifficulty = "easy" | "medium" | "hard";

export interface Scenario {
  id: string;
  title: string;
  category: ScenarioCategory;
  difficulty: ScenarioDifficulty;
  prompt: string;
  expectedKeywords: string[];
  forbiddenKeywords?: string[];
  tags?: string[];
  weight?: number;
  timeoutMs?: number;
}

export interface AgentRunResult {
  output: string;
  durationMs: number;
  detectedModel?: string;
}

export interface ScenarioEvaluation {
  scenarioId: string;
  title: string;
  category: ScenarioCategory;
  difficulty: ScenarioDifficulty;
  weight: number;
  tags?: string[];
  detectedModel?: string;
  passed: boolean;
  score: number;
  maxScore: number;
  expectedHits: string[];
  missingExpected: string[];
  forbiddenHits: string[];
  durationMs: number;
  notes: string[];
}

export interface CategorySummary {
  category: ScenarioCategory;
  total: number;
  passed: number;
  successRate: number;
  averageScore: number;
}

export interface EvaluationSummary {
  generatedAt: string;
  total: number;
  passed: number;
  successRate: number;
  averageScore: number;
  averageDurationMs: number;
  categories: CategorySummary[];
}

export interface BaselineMetrics {
  generatedAt: string;
  sampleSize: number;
  overallSuccessRate: number;
  overallAverageScore: number;
  categorySuccessRate: Partial<Record<ScenarioCategory, number>>;
}

export interface RegressionFinding {
  scope: "overall-success" | "overall-score" | "category-success";
  severity: "medium" | "high";
  message: string;
  baselineValue: number;
  currentValue: number;
  delta: number;
  category?: ScenarioCategory;
}

export interface RunConfig {
  mode: "gemini-cli";
  geminiBin?: string;
  geminiArgs?: string[];
  model?: string;
  modelSource?: "option" | "gemini-arg" | "cli-default";
  observedModels?: string[];
  liveOutput?: boolean;
}

export interface EvaluationRun {
  summary: EvaluationSummary;
  scenarios: ScenarioEvaluation[];
  regressions: RegressionFinding[];
  baselinePath?: string;
  config?: RunConfig;
}
