export type TaskCategory =
  | "debugging"
  | "refactoring"
  | "new-feature"
  | "code-review";

export type TaskDifficulty = "easy" | "medium" | "hard";

export type TaskPolicy = "always" | "usually";
export type TaskScope = "single-file" | "multi-file";
export type TaskKind = "workspace-edit" | "prompt-output" | "tool-use";
export type TaskSuite = "gemini-core" | "contributor-workflows" | "harness-calibration";

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

export interface ActivityCallSummary {
  index: number;
  name: string;
  target?: string;
}

export interface ActivitySummary {
  rawEvents: number;
  parsedEmbeddedEvents: number;
  calls: ActivityCallSummary[];
  counts: Record<string, number>;
}

export interface ToolExpectationCall {
  name: string;
  targetIncludes?: string;
}

export interface ToolExpectations {
  requiredCalls?: ToolExpectationCall[];
  orderedCalls?: ToolExpectationCall[];
  firstCall?: ToolExpectationCall;
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
  suite: TaskSuite;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  language: string;
  taxonomy?: TaskTaxonomy;
  timeoutMs?: number;
  problemStatementFile: string;
  promptAddendum?: string;
  setupCommands?: string[];
  toolExpectations?: ToolExpectations;
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

export interface FailedVerificationSummary {
  phase: "failToPass" | "passToPass";
  command: string;
  exitCode: number | null;
  error?: string;
  stdoutPath: string;
  stderrPath: string;
}

export interface ToolExpectationFailure {
  type: "first-call-mismatch" | "missing-required-call" | "ordered-call-mismatch";
  expected: ToolExpectationCall;
  actual?: ActivityCallSummary;
  message: string;
}

export interface TaskFailureAnalysis {
  reason:
    | "passed"
    | "verification-failed"
    | "tool-expectation-failed"
    | "agent-error"
    | "workspace-setup-failed"
    | "task-setup-failed"
    | "invalid-task";
  failedVerificationCommands: FailedVerificationSummary[];
  firstFailedVerification?: FailedVerificationSummary;
  firstObservedToolCall?: ActivityCallSummary;
  missingExpectedInspections: ToolExpectationCall[];
  toolExpectationFailures: ToolExpectationFailure[];
  firstUnexpectedInspection?: ActivityCallSummary;
  baselineStatus?: TaskStatus;
  baselineDelta?: "regressed" | "improved" | "changed" | "unchanged" | "new-task";
}

export interface TaskRunResult {
  taskId: string;
  title: string;
  taskKind: TaskKind;
  suite: TaskSuite;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  language: string;
  taxonomy?: TaskTaxonomy;
  policy: TaskPolicy;
  status: TaskStatus;
  durationMs: number;
  efficiency?: TaskEfficiency;
  notes: string[];
  failureAnalysis: TaskFailureAnalysis;
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

export interface SuiteCoverageSummary {
  suite: TaskSuite;
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

export interface FailureBreakdownEntry {
  label: string;
  count: number;
}

export interface FailureBreakdown {
  byReason: FailureBreakdownEntry[];
  bySuite: FailureBreakdownEntry[];
  byTaskKind: FailureBreakdownEntry[];
  byCategory: FailureBreakdownEntry[];
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
  suites: SuiteCoverageSummary[];
  taskKinds: TaskKindCoverageSummary[];
  taxonomyCoverage: TaxonomyCoverageSummary;
  efficiency: EfficiencySummary;
  failureBreakdown: FailureBreakdown;
}

export interface RunEnvironmentSummary {
  platform: string;
  arch: string;
  nodeVersion: string;
  workingDirectory: string;
}

export interface RunMetadata {
  runId: string;
  generatedAt: string;
  mode: AgentMode;
  gitCommitSha?: string;
  geminiCliVersion?: string;
  model?: string;
  approvalMode?: string;
  suites: TaskSuite[];
  selectedTaskIds?: string[];
  environment: RunEnvironmentSummary;
}

export interface BaselineMetrics {
  generatedAt: string;
  total: number;
  overallPassRate: number;
  taskStatuses: Record<string, TaskStatus>;
  metadata?: RunMetadata;
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
  approvalMode?: string;
  tasksDir: string;
  workspaceRoot: string;
  keepWorkspaces: boolean;
  liveOutput?: boolean;
  maxTasks?: number;
  selectedSuites?: TaskSuite[];
  selectedTaskIds?: string[];
}

export interface EvaluationRun {
  metadata: RunMetadata;
  summary: EvaluationSummary;
  tasks: TaskRunResult[];
  regressions: RegressionFinding[];
  baselinePath?: string;
  config?: RunConfig;
}
