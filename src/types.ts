export type TaskCategory =
  | "debugging"
  | "refactoring"
  | "new-feature"
  | "code-review";

export type TaskDifficulty = "easy" | "medium" | "hard";

export type TaskPolicy = "always" | "usually";
export type TaskScope = "single-file" | "multi-file";
export type TaskKind = "workspace-edit" | "prompt-output" | "tool-use";

export type TaskStatus = "passed" | "failed" | "infra_failed" | "invalid_task";
export type AgentMode = "gemini-cli" | "gold-patch" | "noop";

export interface VerificationConfig {
  failToPass: string[];
  passToPass: string[];
}

export interface TaskTaxonomy {
  scope: TaskScope;
  tags: string[];
}

export interface TaskEfficiency {
  agentDurationMs: number;
  filesChanged: number;
  insertions: number;
  deletions: number;
  changedLines: number;
}

export interface WorkspaceTask {
  id: string;
  title: string;
  taskKind: TaskKind;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  language: string;
  taxonomy?: TaskTaxonomy;
  timeoutMs?: number;
  problemStatementFile: string;
  promptAddendum?: string;
  setupCommands?: string[];
  verification: VerificationConfig;
  policy: TaskPolicy;
  taskDir: string;
  repoDir?: string;
  issuePath: string;
  goldPatchPath?: string;
  goldStdoutPath?: string;
  goldStderrPath?: string;
  goldActivityLogPath?: string;
}

export interface AgentRunRequest {
  task: WorkspaceTask;
  workspaceDir: string;
  prompt: string;
  artifactDir: string;
  timeoutMs: number;
}

export interface AgentRunResult {
  exitCode: number | null;
  durationMs: number;
  timedOut: boolean;
  error?: string;
  stdoutPath: string;
  stderrPath: string;
  activityLogPath: string;
}

export interface TaskAgent {
  runTask(request: AgentRunRequest): Promise<AgentRunResult>;
}

export interface VerificationCommandResult {
  command: string;
  passed: boolean;
  exitCode: number | null;
  durationMs: number;
  timedOut: boolean;
  error?: string;
  stdoutPath: string;
  stderrPath: string;
}

export interface VerificationSnapshot {
  failToPass: VerificationCommandResult[];
  passToPass: VerificationCommandResult[];
}

export interface TaskArtifacts {
  artifactDir: string;
  promptPath: string;
  diffPath: string;
  agentStdoutPath: string;
  agentStderrPath: string;
  activityLogPath: string;
  activitySummaryPath: string;
  workspacePath?: string;
}

export interface TaskRunResult {
  taskId: string;
  title: string;
  taskKind: TaskKind;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  language: string;
  taxonomy?: TaskTaxonomy;
  policy: TaskPolicy;
  status: TaskStatus;
  durationMs: number;
  efficiency?: TaskEfficiency;
  notes: string[];
  preflight: VerificationSnapshot;
  verification?: VerificationSnapshot;
  artifacts: TaskArtifacts;
  agent: {
    exitCode: number | null;
    timedOut: boolean;
    error?: string;
  };
}

export interface CategorySummary {
  category: TaskCategory;
  total: number;
  passed: number;
  failed: number;
  infraFailed: number;
  invalidTasks: number;
  passRate: number;
}

export interface ScopeCoverageSummary {
  scope: TaskScope;
  count: number;
}

export interface TaskKindCoverageSummary {
  taskKind: TaskKind;
  count: number;
}

export interface TagCoverageSummary {
  tag: string;
  count: number;
}

export interface TaxonomyCoverageSummary {
  tasksWithTaxonomy: number;
  tasksWithoutTaxonomy: number;
  scopes: ScopeCoverageSummary[];
  tags: TagCoverageSummary[];
}

export interface EfficiencySummary {
  measuredTasks: number;
  averageAgentDurationMs: number;
  averageFilesChanged: number;
  averageChangedLines: number;
  totalInsertions: number;
  totalDeletions: number;
}

export interface EvaluationSummary {
  generatedAt: string;
  total: number;
  passed: number;
  failed: number;
  infraFailed: number;
  invalidTasks: number;
  passRate: number;
  averageDurationMs: number;
  categories: CategorySummary[];
  taskKinds: TaskKindCoverageSummary[];
  taxonomyCoverage: TaxonomyCoverageSummary;
  efficiency: EfficiencySummary;
}

export interface BaselineMetrics {
  generatedAt: string;
  total: number;
  overallPassRate: number;
  taskStatuses: Record<string, TaskStatus>;
}

export interface RegressionFinding {
  scope: "overall-pass-rate" | "task-status";
  severity: "medium" | "high";
  message: string;
  baselineValue: number | TaskStatus;
  currentValue: number | TaskStatus;
  delta?: number;
  taskId?: string;
}

export interface RunConfig {
  mode: AgentMode;
  geminiBin?: string;
  geminiArgs?: string[];
  model?: string;
  tasksDir: string;
  workspaceRoot: string;
  keepWorkspaces: boolean;
  liveOutput?: boolean;
  maxTasks?: number;
  selectedTaskIds?: string[];
}

export interface EvaluationRun {
  summary: EvaluationSummary;
  tasks: TaskRunResult[];
  regressions: RegressionFinding[];
  baselinePath?: string;
  config?: RunConfig;
}
