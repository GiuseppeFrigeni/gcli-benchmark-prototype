#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { GeminiCliAgent } from "./gemini-adapter";
import { GoldPatchAgent, NoopAgent } from "./mock-agents";
import {
  buildSuiteCoverageSummary,
  buildTaskKindCoverageSummary,
  buildTaxonomyCoverageSummary,
} from "./task-metrics";
import { loadTaskFromDirectory, loadTasks, validateTaskDirectory } from "./task-loader";
import {
  attachBaselineContext,
  detectRegressions,
  loadBaselineIfExists,
  makeBaseline,
  saveBaseline,
} from "./regression";
import { saveReports } from "./report";
import {
  AgentMode,
  EvaluationRun,
  RunConfig,
  RunMetadata,
  TaskAgent,
  TaskSuite,
  WorkspaceTask,
} from "./types";
import { ensureDir, readJsonFile, readTextFile, timestampForFile, writeJsonFile, writeTextFile } from "./utils";
import { runTasks, validateTaskPreflight } from "./workspace-runner";

type Command = "run" | "list" | "gaps" | "compare" | "draft-task" | "validate-task";

interface CliOptions {
  command: Command;
  agentMode: AgentMode;
  tasksDir: string;
  reportsDir: string;
  baselinePath: string;
  resultsPath: string;
  updateBaseline: boolean;
  geminiBin: string;
  geminiArgs: string[];
  model?: string;
  approvalMode?: string;
  defaultTimeoutMs: number;
  maxTasks?: number;
  liveOutput: boolean;
  json: boolean;
  selectedSuites: TaskSuite[];
  selectedTaskIds: string[];
  workspaceRoot: string;
  keepWorkspaces: boolean;
  dynamicValidation: boolean;
  taskDir?: string;
  draftTaskId?: string;
  draftTaskKind?: WorkspaceTask["taskKind"];
  draftCategory?: WorkspaceTask["category"];
  draftDifficulty?: WorkspaceTask["difficulty"];
  draftLanguage?: string;
  draftPolicy?: WorkspaceTask["policy"];
  draftOutDir?: string;
  draftChatLogPath?: string;
  explicitGeminiBin: boolean;
  explicitGeminiArgs: boolean;
  explicitModel: boolean;
  explicitLiveOutput: boolean;
  explicitApprovalMode: boolean;
}

interface CliDependencies {
  createAgent?: (
    options: Pick<
      CliOptions,
      "agentMode" | "geminiBin" | "geminiArgs" | "model" | "approvalMode" | "liveOutput"
    >,
  ) => TaskAgent;
  now?: () => Date;
}

const defaults: CliOptions = {
  command: "run",
  agentMode: "gemini-cli",
  tasksDir: "./tasks",
  reportsDir: "./reports",
  baselinePath: "./baseline/baseline.json",
  resultsPath: "./reports/latest-results.json",
  updateBaseline: false,
  geminiBin: "gemini",
  geminiArgs: [],
  defaultTimeoutMs: 120000,
  liveOutput: false,
  json: false,
  selectedSuites: [],
  selectedTaskIds: [],
  workspaceRoot: join(tmpdir(), "gcli-benchmark-workspaces"),
  keepWorkspaces: false,
  dynamicValidation: false,
  explicitGeminiBin: false,
  explicitGeminiArgs: false,
  explicitModel: false,
  explicitLiveOutput: false,
  explicitApprovalMode: false,
};

function usage(): string {
  return [
    "Usage:",
    "  npm run dev:list -- [--tasks ./tasks] [--json]",
    "  npm run dev:gaps -- [--tasks ./tasks] [--json]",
    "  npm run dev:compare -- [--results ./reports/latest-results.json] [--baseline ./baseline/baseline.json] [--json]",
    "  npm run dev:draft-task -- --chat-log ./chat.json --task-id my-task --task-kind tool-use --category debugging --language text --out ./drafts/my-task [--difficulty medium] [--policy always]",
    "  npm run dev:validate-task -- --task-dir ./tasks/my-task [--dynamic] [--json]",
    "  npm run dev:run -- [options]",
    "",
    "Options:",
    "  --agent-mode <mode>         Agent mode: gemini-cli | gold-patch | noop",
    "  --tasks <path>              Tasks directory (default: ./tasks)",
    "  --reports <path>            Output report directory (default: ./reports)",
    "  --baseline <path>           Baseline file path (default: ./baseline/baseline.json)",
    "  --results <path>            Results file path for compare (default: ./reports/latest-results.json)",
    "  --update-baseline           Overwrite baseline using current run",
    "  --suite <id>                Filter tasks by suite (repeatable)",
    "  --task <id>                 Run a specific task id (repeatable)",
    "  --gemini-bin <command>      Gemini CLI binary name/path (default: gemini)",
    "  --model <name>              Gemini model to use (ex: gemini-2.5-pro)",
    "  --approval-mode <mode>      Harness approval policy for Gemini CLI (default: env or yolo)",
    "  --gemini-arg <arg>          Extra gemini arg (repeatable)",
    "  --timeout-ms <number>       Default per-task timeout (default: 120000)",
    "  --max-tasks <number>        Limit loaded tasks",
    "  --workspace-root <path>     Root directory for temp workspaces",
    "  --keep-workspaces           Keep generated task workspaces after the run",
    "  --live-output               Stream Gemini output to terminal during evaluation",
    "  --json                      Emit JSON output for list/gaps/compare/validate-task",
    "  --dynamic                   Execute setup and preflight checks in a temp workspace during validate-task",
    "  --task-dir <path>           Task directory for validate-task",
    "  --chat-log <path>           Structured chat log JSON for draft-task",
    "  --task-id <id>              Draft task id for draft-task",
    "  --task-kind <kind>          Draft task kind for draft-task",
    "  --category <name>           Draft task category for draft-task",
    "  --difficulty <name>         Draft task difficulty for draft-task (default: medium)",
    "  --language <name>           Draft task language for draft-task",
    "  --policy <name>             Draft task policy for draft-task (default: always)",
    "  --out <path>                Output directory for draft-task",
  ].join("\n");
}

function parseNumber(value: string, flag: string): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid number for ${flag}: '${value}'`);
  }
  return parsed;
}

function parseAgentMode(value: string): AgentMode {
  if (value === "gemini-cli" || value === "gold-patch" || value === "noop") {
    return value;
  }
  throw new Error(`Invalid value for --agent-mode: '${value}'`);
}

function parseTaskKindValue(value: string): WorkspaceTask["taskKind"] {
  if (value === "workspace-edit" || value === "prompt-output" || value === "tool-use") {
    return value;
  }
  throw new Error(`Invalid value for --task-kind: '${value}'`);
}

function parseSuiteValue(value: string): TaskSuite {
  if (
    value === "gemini-core" ||
    value === "contributor-workflows" ||
    value === "harness-calibration"
  ) {
    return value;
  }
  throw new Error(`Invalid value for --suite: '${value}'`);
}

function parseCategoryValue(value: string): WorkspaceTask["category"] {
  if (value === "debugging" || value === "refactoring" || value === "new-feature" || value === "code-review") {
    return value;
  }
  throw new Error(`Invalid value for --category: '${value}'`);
}

function parseDifficultyValue(value: string): WorkspaceTask["difficulty"] {
  if (value === "easy" || value === "medium" || value === "hard") {
    return value;
  }
  throw new Error(`Invalid value for --difficulty: '${value}'`);
}

function parsePolicyValue(value: string): WorkspaceTask["policy"] {
  if (value === "always" || value === "usually") {
    return value;
  }
  throw new Error(`Invalid value for --policy: '${value}'`);
}

function validateAgentModeOptions(options: CliOptions): void {
  if (options.command !== "run" || options.agentMode === "gemini-cli") {
    return;
  }

  const rejectedFlags: string[] = [];
  if (options.explicitGeminiBin) {
    rejectedFlags.push("--gemini-bin");
  }
  if (options.explicitGeminiArgs) {
    rejectedFlags.push("--gemini-arg");
  }
  if (options.explicitModel) {
    rejectedFlags.push("--model");
  }
  if (options.explicitApprovalMode) {
    rejectedFlags.push("--approval-mode");
  }
  if (options.explicitLiveOutput) {
    rejectedFlags.push("--live-output");
  }

  if (rejectedFlags.length > 0) {
    throw new Error(
      `${rejectedFlags.join(", ")} can only be used with --agent-mode=gemini-cli`,
    );
  }
}

function parseArgs(argv: string[]): CliOptions {
  const args = [...argv];
  const options: CliOptions = {
    ...defaults,
    geminiArgs: [...defaults.geminiArgs],
    selectedSuites: [...defaults.selectedSuites],
    selectedTaskIds: [...defaults.selectedTaskIds],
  };

  if (args.length > 0 && !args[0].startsWith("--")) {
    const command = args.shift();
    if (
      command !== "run" &&
      command !== "list" &&
      command !== "gaps" &&
      command !== "compare" &&
      command !== "draft-task" &&
      command !== "validate-task"
    ) {
      throw new Error(`Unknown command '${command}'`);
    }
    options.command = command;
  }

  if (options.command === "run" && args.length > 0 && !args[0].startsWith("--")) {
    const maybeMax = Number(args[0]);
    if (!Number.isNaN(maybeMax)) {
      options.maxTasks = maybeMax;
      args.shift();
    }
  }

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--update-baseline") {
      options.updateBaseline = true;
      continue;
    }
    if (arg === "--live-output") {
      options.liveOutput = true;
      options.explicitLiveOutput = true;
      continue;
    }
    if (arg === "--json") {
      options.json = true;
      continue;
    }
    if (arg === "--dynamic") {
      options.dynamicValidation = true;
      continue;
    }
    if (arg === "--keep-workspaces") {
      options.keepWorkspaces = true;
      continue;
    }

    if (!arg.startsWith("--")) {
      const maybeMax = Number(arg);
      if (
        options.command === "run" &&
        !Number.isNaN(maybeMax) &&
        options.maxTasks === undefined
      ) {
        options.maxTasks = maybeMax;
        continue;
      }
      throw new Error(`Unknown argument '${arg}'`);
    }

    const [flag, inlineValue] = arg.includes("=")
      ? (arg.split(/=(.*)/, 2) as [string, string])
      : [arg, ""];
    const needsValue = inlineValue.length === 0;
    const value = needsValue ? args[i + 1] : inlineValue;
    const consumeNext = needsValue;

    if (
      [
        "--tasks",
        "--agent-mode",
        "--reports",
        "--baseline",
        "--results",
        "--suite",
        "--task",
        "--gemini-bin",
        "--model",
        "--approval-mode",
        "--gemini-arg",
        "--timeout-ms",
        "--max-tasks",
        "--workspace-root",
        "--task-dir",
        "--chat-log",
        "--task-id",
        "--task-kind",
        "--category",
        "--difficulty",
        "--language",
        "--policy",
        "--out",
      ].includes(flag) &&
      value === undefined
    ) {
      throw new Error(`Flag '${flag}' requires a value`);
    }

    const requiredValue = value ?? "";
    switch (flag) {
      case "--tasks":
        options.tasksDir = requiredValue;
        break;
      case "--agent-mode":
        options.agentMode = parseAgentMode(requiredValue);
        break;
      case "--reports":
        options.reportsDir = requiredValue;
        break;
      case "--baseline":
        options.baselinePath = requiredValue;
        break;
      case "--results":
        options.resultsPath = requiredValue;
        break;
      case "--suite":
        options.selectedSuites.push(parseSuiteValue(requiredValue));
        break;
      case "--task":
        options.selectedTaskIds.push(requiredValue);
        break;
      case "--gemini-bin":
        options.geminiBin = requiredValue;
        options.explicitGeminiBin = true;
        break;
      case "--model":
        options.model = requiredValue;
        options.explicitModel = true;
        break;
      case "--approval-mode":
        options.approvalMode = requiredValue;
        options.explicitApprovalMode = true;
        break;
      case "--gemini-arg":
        options.geminiArgs.push(requiredValue);
        options.explicitGeminiArgs = true;
        break;
      case "--timeout-ms":
        options.defaultTimeoutMs = parseNumber(requiredValue, flag);
        break;
      case "--max-tasks":
        options.maxTasks = parseNumber(requiredValue, flag);
        break;
      case "--workspace-root":
        options.workspaceRoot = requiredValue;
        break;
      case "--task-dir":
        options.taskDir = requiredValue;
        break;
      case "--chat-log":
        options.draftChatLogPath = requiredValue;
        break;
      case "--task-id":
        options.draftTaskId = requiredValue;
        break;
      case "--task-kind":
        options.draftTaskKind = parseTaskKindValue(requiredValue);
        break;
      case "--category":
        options.draftCategory = parseCategoryValue(requiredValue);
        break;
      case "--difficulty":
        options.draftDifficulty = parseDifficultyValue(requiredValue);
        break;
      case "--language":
        options.draftLanguage = requiredValue;
        break;
      case "--policy":
        options.draftPolicy = parsePolicyValue(requiredValue);
        break;
      case "--out":
        options.draftOutDir = requiredValue;
        break;
      default:
        throw new Error(`Unknown flag '${flag}'`);
    }

    if (consumeNext) {
      i += 1;
    }
  }

  validateAgentModeOptions(options);
  return options;
}

function filterTasks(tasks: WorkspaceTask[], options: CliOptions): WorkspaceTask[] {
  let filtered = [...tasks];
  if (options.selectedSuites.length > 0) {
    const wantedSuites = new Set(options.selectedSuites);
    filtered = filtered.filter((task) => wantedSuites.has(task.suite));
  }
  if (options.selectedTaskIds.length > 0) {
    const wanted = new Set(options.selectedTaskIds);
    filtered = filtered.filter((task) => wanted.has(task.id));
    const missing = options.selectedTaskIds.filter((taskId) =>
      filtered.every((task) => task.id !== taskId),
    );
    if (missing.length > 0) {
      throw new Error(`Unknown task ids: ${missing.join(", ")}`);
    }
  }
  if (options.maxTasks !== undefined) {
    filtered = filtered.slice(0, options.maxTasks);
  }
  if (filtered.length === 0) {
    throw new Error("No tasks selected.");
  }
  return filtered;
}

function resolveRunConfig(options: CliOptions): RunConfig {
  const config: RunConfig = {
    mode: options.agentMode,
    tasksDir: resolve(options.tasksDir),
    workspaceRoot: resolve(options.workspaceRoot),
    keepWorkspaces: options.keepWorkspaces,
    maxTasks: options.maxTasks,
    selectedSuites:
      options.selectedSuites.length > 0 ? [...options.selectedSuites] : undefined,
    selectedTaskIds:
      options.selectedTaskIds.length > 0 ? [...options.selectedTaskIds] : undefined,
  };
  if (options.agentMode === "gemini-cli") {
    config.geminiBin = options.geminiBin;
    config.geminiArgs = options.geminiArgs;
    config.model = options.model;
    config.approvalMode = options.approvalMode ?? process.env.GCLI_BENCHMARK_APPROVAL_MODE;
    config.liveOutput = options.liveOutput;
  }
  return config;
}

function defaultCreateAgent(
  options: Pick<
    CliOptions,
    "agentMode" | "geminiBin" | "geminiArgs" | "model" | "approvalMode" | "liveOutput"
  >,
): TaskAgent {
  if (options.agentMode === "gold-patch") {
    return new GoldPatchAgent();
  }
  if (options.agentMode === "noop") {
    return new NoopAgent();
  }
  return new GeminiCliAgent({
    geminiBin: options.geminiBin,
    geminiArgs: options.geminiArgs,
    model: options.model,
    approvalMode: options.approvalMode,
    liveOutput: options.liveOutput,
  });
}

function captureCommandText(command: string, args: string[]): string | undefined {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    windowsHide: true,
    shell: process.platform === "win32",
  });
  if (result.error || result.status !== 0) {
    return undefined;
  }
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
  return output === "" ? undefined : output.split(/\r?\n/)[0].trim();
}

function buildRunMetadata(
  config: RunConfig,
  tasks: WorkspaceTask[],
  generatedAt: string,
  runId: string,
): RunMetadata {
  const isGeminiRun = config.mode === "gemini-cli";
  return {
    runId,
    generatedAt,
    mode: config.mode,
    gitCommitSha: captureCommandText("git", ["rev-parse", "--short", "HEAD"]),
    geminiCliVersion:
      isGeminiRun && config.geminiBin
        ? captureCommandText(config.geminiBin, ["--version"])
        : undefined,
    model: isGeminiRun ? config.model ?? "Gemini CLI default" : undefined,
    approvalMode: isGeminiRun ? config.approvalMode ?? "yolo" : undefined,
    suites: buildSuiteCoverageSummary(tasks).map((entry) => entry.suite),
    selectedTaskIds: config.selectedTaskIds,
    environment: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      workingDirectory: process.cwd(),
    },
  };
}

function printSummary(summary: EvaluationRun["summary"], config: RunConfig, regressionsCount: number): void {
  console.log(`Run completed at ${summary.generatedAt}`);
  console.log(`Execution mode: ${config.mode}`);
  if (config.mode === "gemini-cli") {
    console.log(`Gemini binary: ${config.geminiBin}`);
    console.log(`Model: ${config.model ?? "Gemini CLI default"}`);
    console.log(`Approval mode: ${config.approvalMode ?? "yolo"}`);
  }
  console.log(`Overall: ${summary.passed}/${summary.total} passed (${(summary.passRate * 100).toFixed(2)}%)`);
  console.log(`Failed: ${summary.failed}`);
  console.log(`Infra failed: ${summary.infraFailed}`);
  console.log(`Invalid tasks: ${summary.invalidTasks}`);
  console.log(`Average duration: ${summary.averageDurationMs.toFixed(2)} ms`);
  if (summary.suites.length > 0) {
    console.log(`Suites: ${summary.suites.map((entry) => `${entry.suite}=${entry.count}`).join(", ")}`);
  }
  for (const category of summary.categories) {
    console.log(
      `- ${category.category}: ${category.passed}/${category.total} (${(category.passRate * 100).toFixed(2)}%), failed ${category.failed}, infra ${category.infraFailed}, invalid ${category.invalidTasks}`,
    );
  }
  if (summary.taskKinds.length > 0) {
    console.log(
      `Task kinds: ${summary.taskKinds.map((entry) => `${entry.taskKind}=${entry.count}`).join(", ")}`,
    );
  }
  console.log(`Regression findings: ${regressionsCount}`);
}

function printCounts(title: string, entries: Array<[string, number]>): void {
  console.log(`${title}:`);
  if (entries.length === 0) {
    console.log("- none");
    return;
  }
  for (const [label, count] of entries) {
    console.log(`- ${label}: ${count}`);
  }
}

function sortEntries(map: Map<string, number>): Array<[string, number]> {
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function buildSuiteSummary(tasks: WorkspaceTask[]) {
  const categories = new Map<string, number>();
  const languages = new Map<string, number>();
  const difficulties = new Map<string, number>();
  for (const task of tasks) {
    categories.set(task.category, (categories.get(task.category) ?? 0) + 1);
    languages.set(task.language, (languages.get(task.language) ?? 0) + 1);
    difficulties.set(task.difficulty, (difficulties.get(task.difficulty) ?? 0) + 1);
  }

  return {
    total: tasks.length,
    categories: sortEntries(categories),
    languages: sortEntries(languages),
    difficulties: sortEntries(difficulties),
    suites: buildSuiteCoverageSummary(tasks).map((entry) => [entry.suite, entry.count] as [string, number]),
    taskKinds: buildTaskKindCoverageSummary(tasks).map((entry) => [entry.taskKind, entry.count] as [string, number]),
    taxonomyCoverage: buildTaxonomyCoverageSummary(tasks),
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      taskKind: task.taskKind,
      suite: task.suite,
      category: task.category,
      difficulty: task.difficulty,
      language: task.language,
      taxonomy: task.taxonomy,
    })),
  };
}

function recommendTemplateFamily(tasks: WorkspaceTask[]): string {
  const summary = buildSuiteSummary(tasks);
  const lowestTaskKind = [...summary.taskKinds].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))[0]?.[0];
  const lowestDifficulty = [...summary.difficulties].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))[0]?.[0];

  if (lowestDifficulty === "hard") {
    return "hard-debugging-investigation";
  }
  if (lowestTaskKind === "tool-use") {
    return "gemini-tool-investigation";
  }
  if (lowestTaskKind === "prompt-output") {
    return "maintainer-prompt-response";
  }
  return "repo-edit-debugging";
}

function buildGapsReport(tasks: WorkspaceTask[]) {
  const summary = buildSuiteSummary(tasks);
  const taxonomyTags = summary.taxonomyCoverage.tags
    .map((entry) => [entry.tag, entry.count] as [string, number])
    .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));

  return {
    total: summary.total,
    underCovered: {
      suites: [...summary.suites].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0])),
      taskKinds: [...summary.taskKinds].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0])).slice(0, 3),
      categories: [...summary.categories].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0])).slice(0, 3),
      difficulties: [...summary.difficulties].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0])).slice(0, 3),
      tags: taxonomyTags.slice(0, 5),
    },
    recommendedTemplateFamily: recommendTemplateFamily(tasks),
    templateFamilies: {
      "gemini-tool-investigation": "Tool-use task that verifies required inspections and ordered evidence gathering.",
      "maintainer-prompt-response": "Prompt-output task with strict JSON or Markdown maintainer-facing output.",
      "repo-edit-debugging": "Workspace-edit task with one fail-to-pass check and preserved baseline behavior.",
      "hard-debugging-investigation": "Multi-step debugging task with ambiguous ownership and explicit evidence requirements.",
    },
  };
}

function readJsonOrThrow<T>(path: string): Promise<T> {
  return readJsonFile<T>(resolve(path));
}

async function listTasks(options: CliOptions): Promise<void> {
  const tasks = filterTasks(await loadTasks(resolve(options.tasksDir)), options);
  const summary = buildSuiteSummary(tasks);
  if (options.json) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  console.log(`Loaded ${summary.total} tasks from ${resolve(options.tasksDir)}`);
  printCounts("Suites", summary.suites);
  printCounts("Categories", summary.categories);
  printCounts("Languages", summary.languages);
  printCounts("Difficulties", summary.difficulties);
  printCounts(
    "Task kinds",
    summary.taskKinds,
  );
  printCounts(
    "Taxonomy scopes",
    summary.taxonomyCoverage.scopes.map((entry): [string, number] => [entry.scope, entry.count]),
  );
  printCounts(
    "Taxonomy tags",
    summary.taxonomyCoverage.tags.map((entry): [string, number] => [entry.tag, entry.count]),
  );
  console.log(`Tasks missing taxonomy: ${summary.taxonomyCoverage.tasksWithoutTaxonomy}`);
}

async function printCoverageGaps(options: CliOptions): Promise<void> {
  const tasks = filterTasks(await loadTasks(resolve(options.tasksDir)), options);
  const report = buildGapsReport(tasks);
  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`Loaded ${report.total} tasks from ${resolve(options.tasksDir)}`);
  printCounts("Suites", report.underCovered.suites);
  printCounts("Under-covered task kinds", report.underCovered.taskKinds);
  printCounts("Under-covered categories", report.underCovered.categories);
  printCounts("Under-covered difficulties", report.underCovered.difficulties);
  printCounts("Under-covered tags", report.underCovered.tags);
  console.log(`Recommended template family: ${report.recommendedTemplateFamily}`);
  console.log(
    `Template guidance: ${report.templateFamilies[report.recommendedTemplateFamily as keyof typeof report.templateFamilies]}`,
  );
}

async function compareResults(options: CliOptions): Promise<void> {
  const results = await readJsonOrThrow<EvaluationRun>(options.resultsPath);
  const baselinePath = results.baselinePath ?? options.baselinePath;
  const baseline = await loadBaselineIfExists(resolve(baselinePath));
  if (!baseline) {
    throw new Error(`No baseline found at '${resolve(baselinePath)}'`);
  }

  const annotatedTasks = attachBaselineContext(results.tasks, baseline);
  const regressedTasks = annotatedTasks.filter(
    (task) => task.failureAnalysis.baselineDelta === "regressed",
  );
  const bySuite = new Map<string, number>();
  const byTaskKind = new Map<string, number>();
  const byCategory = new Map<string, number>();
  for (const task of regressedTasks) {
    const suite = task.suite ?? "unknown";
    bySuite.set(suite, (bySuite.get(suite) ?? 0) + 1);
    byTaskKind.set(task.taskKind, (byTaskKind.get(task.taskKind) ?? 0) + 1);
    byCategory.set(task.category, (byCategory.get(task.category) ?? 0) + 1);
  }

  const report = {
    resultsPath: resolve(options.resultsPath),
    baselinePath: resolve(baselinePath),
    regressions: results.regressions,
    regressedTasks: regressedTasks.map((task) => ({
      taskId: task.taskId,
      suite: task.suite ?? "unknown",
      taskKind: task.taskKind,
      category: task.category,
      status: task.status,
      failureReason: task.failureAnalysis.reason,
      firstFailure:
        task.failureAnalysis.firstFailedVerification?.command ??
        task.failureAnalysis.toolExpectationFailures[0]?.message ??
        null,
      artifactDir: task.artifacts.artifactDir,
    })),
    regressedSuites: sortEntries(bySuite),
    regressedTaskKinds: sortEntries(byTaskKind),
    regressedCategories: sortEntries(byCategory),
  };

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`Results: ${report.resultsPath}`);
  console.log(`Baseline: ${report.baselinePath}`);
  console.log(`Regression findings: ${report.regressions.length}`);
  printCounts("Most regressed suites", report.regressedSuites);
  printCounts("Most regressed task kinds", report.regressedTaskKinds);
  printCounts("Most regressed categories", report.regressedCategories);
  if (report.regressedTasks.length === 0) {
    console.log("No task regressions found.");
    return;
  }
  console.log("Regressed tasks:");
  for (const task of report.regressedTasks) {
    console.log(
      `- ${task.taskId}: suite=${task.suite}, ${task.status}, ${task.failureReason}, first failure=${task.firstFailure ?? "none"}, artifacts=${task.artifactDir}`,
    );
  }
}

async function validateTask(options: CliOptions, deps: CliDependencies): Promise<number> {
  if (!options.taskDir) {
    throw new Error("validate-task requires --task-dir");
  }

  const staticResult = await validateTaskDirectory(resolve(options.taskDir));
  if (!options.dynamicValidation) {
    const report = {
      taskDir: staticResult.taskDir,
      valid: staticResult.valid,
      taskId: staticResult.taskId,
      issues: staticResult.issues,
    };

    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
      return staticResult.valid ? 0 : 1;
    }

    if (staticResult.valid) {
      console.log(
        `Task is valid: ${staticResult.taskId ?? "unknown-id"} (${staticResult.taskDir})`,
      );
      return 0;
    }

    console.log(`Task is invalid: ${staticResult.taskDir}`);
    if (staticResult.taskId) {
      console.log(`Task ID: ${staticResult.taskId}`);
    }
    for (const issue of staticResult.issues) {
      console.log(`- ${issue}`);
    }
    return 1;
  }

  let dynamicReport:
    | {
        attempted: boolean;
        valid: boolean;
        status: "passed" | "failed" | "skipped";
        reason?: string;
        issues: string[];
        artifactDir?: string;
        promptPath?: string;
        diffPath?: string;
        workspacePath?: string;
        preflight?: Awaited<ReturnType<typeof validateTaskPreflight>>["preflight"];
        failedVerificationCommands?: Awaited<ReturnType<typeof validateTaskPreflight>>["failureAnalysis"]["failedVerificationCommands"];
        firstFailedVerification?: Awaited<ReturnType<typeof validateTaskPreflight>>["failureAnalysis"]["firstFailedVerification"];
      }
    | undefined;

  if (staticResult.valid) {
    const generatedAt = (deps.now ?? (() => new Date()))().toISOString();
    const runId = `validate-task-${timestampForFile(generatedAt)}`;
    const task = await loadTaskFromDirectory(staticResult.taskDir);
    const dynamicResult = await validateTaskPreflight(task, {
      runId,
      artifactsRoot: join(resolve(options.workspaceRoot), "validate-task-artifacts", runId),
      workspaceRoot: resolve(options.workspaceRoot),
      keepWorkspaces: options.keepWorkspaces,
    });
    dynamicReport = {
      attempted: true,
      valid: dynamicResult.valid,
      status: dynamicResult.valid ? "passed" : "failed",
      reason: dynamicResult.failureAnalysis.reason,
      issues: dynamicResult.valid ? [] : dynamicResult.notes,
      artifactDir: dynamicResult.artifacts.artifactDir,
      promptPath: dynamicResult.artifacts.promptPath,
      diffPath: dynamicResult.artifacts.diffPath,
      workspacePath: dynamicResult.artifacts.workspacePath,
      preflight: dynamicResult.preflight,
      failedVerificationCommands: dynamicResult.failureAnalysis.failedVerificationCommands,
      firstFailedVerification: dynamicResult.failureAnalysis.firstFailedVerification,
    };
  } else {
    dynamicReport = {
      attempted: false,
      valid: false,
      status: "skipped",
      reason: "skipped",
      issues: ["Dynamic validation skipped because static validation failed."],
    };
  }

  const overallValid = staticResult.valid && dynamicReport.valid;
  const report = {
    taskDir: staticResult.taskDir,
    valid: overallValid,
    taskId: staticResult.taskId,
    issues: [...staticResult.issues, ...dynamicReport.issues],
    static: {
      valid: staticResult.valid,
      issues: staticResult.issues,
    },
    dynamic: dynamicReport,
  };

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
    return overallValid ? 0 : 1;
  }

  console.log(`Task: ${staticResult.taskId ?? "unknown-id"} (${staticResult.taskDir})`);
  console.log(`Static validation: ${staticResult.valid ? "passed" : "failed"}`);
  if (staticResult.issues.length > 0) {
    for (const issue of staticResult.issues) {
      console.log(`- ${issue}`);
    }
  }
  console.log(
    `Dynamic validation: ${
      dynamicReport.status === "passed"
        ? "passed"
        : dynamicReport.status === "skipped"
          ? "skipped"
          : `failed (${dynamicReport.reason ?? "unknown"})`
    }`,
  );
  if (dynamicReport.issues.length > 0) {
    for (const issue of dynamicReport.issues) {
      console.log(`- ${issue}`);
    }
  }
  if (dynamicReport.attempted && dynamicReport.artifactDir) {
    console.log(`Dynamic artifacts: ${dynamicReport.artifactDir}`);
  }
  if (overallValid) {
    console.log("Task is valid.");
    return 0;
  }
  console.log("Task is invalid.");
  return 1;
}

interface DraftChatLog {
  title?: string;
  summary?: string;
  taskDescription?: string;
  acceptanceCriteria?: string[];
  relevantFiles?: string[];
  conversation?: Array<{ role?: string; content?: string }>;
}

function buildDraftIssue(chatLog: DraftChatLog): string {
  const lines = [
    `# ${chatLog.title ?? "Draft Eval Task"}`,
    "",
    chatLog.summary ?? chatLog.taskDescription ?? "Drafted from a structured chat log artifact.",
  ];

  if (chatLog.acceptanceCriteria && chatLog.acceptanceCriteria.length > 0) {
    lines.push("", "## Acceptance Criteria");
    for (const item of chatLog.acceptanceCriteria) {
      lines.push(`- ${item}`);
    }
  }

  if (chatLog.relevantFiles && chatLog.relevantFiles.length > 0) {
    lines.push("", "## Candidate Files");
    for (const item of chatLog.relevantFiles) {
      lines.push(`- ${item}`);
    }
  }

  if (chatLog.conversation && chatLog.conversation.length > 0) {
    lines.push("", "## Conversation Excerpt");
    for (const entry of chatLog.conversation.slice(0, 4)) {
      lines.push(`- ${entry.role ?? "unknown"}: ${(entry.content ?? "").trim()}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

async function draftTaskFromChatLog(options: CliOptions): Promise<void> {
  if (!options.draftChatLogPath || !options.draftTaskId || !options.draftTaskKind || !options.draftCategory || !options.draftLanguage || !options.draftOutDir) {
    throw new Error("draft-task requires --chat-log, --task-id, --task-kind, --category, --language, and --out");
  }

  const chatLog = await readJsonOrThrow<DraftChatLog>(options.draftChatLogPath);
  const outDir = resolve(options.draftOutDir);
  await ensureDir(outDir);
  await writeTextFile(join(outDir, "issue.md"), buildDraftIssue(chatLog));
  await writeTextFile(
    join(outDir, "chat-log.json"),
    `${await readTextFile(resolve(options.draftChatLogPath))}\n`,
  );

  if (options.draftTaskKind === "workspace-edit") {
    await ensureDir(join(outDir, "repo"));
    await writeTextFile(join(outDir, "repo", "README.md"), "# Draft workspace fixture\n");
    await writeTextFile(join(outDir, "gold.patch"), "");
  } else if (options.draftTaskKind === "prompt-output") {
    await writeTextFile(join(outDir, "gold.stdout.txt"), "TODO: replace with expected output\n");
  } else {
    await writeTextFile(join(outDir, "gold.activity.jsonl"), "");
    await writeTextFile(join(outDir, "gold.stdout.txt"), "TODO: replace with expected tool-use answer\n");
  }

  const manifest = {
    id: options.draftTaskId,
    title: chatLog.title ?? `Draft ${options.draftTaskId}`,
    taskKind: options.draftTaskKind,
    suite: "contributor-workflows",
    category: options.draftCategory,
    difficulty: options.draftDifficulty ?? "medium",
    language: options.draftLanguage,
    taxonomy: {
      scope: "multi-file",
      tags: ["draft-task", "chat-log-derived"],
    },
    problemStatementFile: "issue.md",
    promptAddendum: "Generated from chat-log.json. Tighten instructions, fixtures, and verification before adding to the suite.",
    verification: {
      failToPass: ['node -e "process.exit(1)"'],
      passToPass: ['node -e "process.exit(0)"'],
    },
    policy: options.draftPolicy ?? "always",
  };

  await writeJsonFile(join(outDir, "task.json"), manifest);

  console.log(`Draft task created at ${outDir}`);
}

async function runEvaluation(options: CliOptions, deps: CliDependencies): Promise<number> {
  const tasks = filterTasks(await loadTasks(resolve(options.tasksDir)), options);
  const agentFactory = deps.createAgent ?? defaultCreateAgent;
  const agent = agentFactory(options);
  const runConfig = resolveRunConfig(options);
  const generatedAt = (deps.now ?? (() => new Date()))().toISOString();
  const runId = timestampForFile(generatedAt);
  const metadata = buildRunMetadata(runConfig, tasks, generatedAt, runId);
  const reportsDir = resolve(options.reportsDir);
  const evaluation = await runTasks(tasks, agent, {
    generatedAt,
    runId,
    artifactsRoot: join(reportsDir, "artifacts", runId),
    workspaceRoot: resolve(options.workspaceRoot),
    keepWorkspaces: options.keepWorkspaces,
    defaultTaskTimeoutMs: options.defaultTimeoutMs,
  });
  const baselinePath = resolve(options.baselinePath);
  const baseline = await loadBaselineIfExists(baselinePath);
  const tasksWithBaseline = attachBaselineContext(evaluation.tasks, baseline);
  const regressions = detectRegressions(evaluation.summary, tasksWithBaseline, baseline);

  const run: EvaluationRun = {
    metadata,
    summary: evaluation.summary,
    tasks: tasksWithBaseline,
    regressions,
    baselinePath,
    config: runConfig,
  };

  const reportPaths = await saveReports(run, reportsDir);
  console.log(`Saved report JSON: ${reportPaths.jsonPath}`);
  console.log(`Saved report Markdown: ${reportPaths.markdownPath}`);

  if (options.updateBaseline) {
    const newBaseline = makeBaseline(evaluation.summary, tasksWithBaseline, metadata);
    await saveBaseline(baselinePath, newBaseline);
    console.log(`Updated baseline: ${baselinePath}`);
  } else if (!baseline) {
    console.log(`No baseline found at ${baselinePath}. Run with --update-baseline to create one.`);
  }

  printSummary(evaluation.summary, runConfig, regressions.length);
  if (regressions.length > 0 && !options.updateBaseline) {
    return 2;
  }
  return 0;
}

export async function runCli(argv: string[], deps: CliDependencies = {}): Promise<number> {
  try {
    const options = parseArgs(argv);
    if (options.command === "list") {
      await listTasks(options);
      return 0;
    }
    if (options.command === "gaps") {
      await printCoverageGaps(options);
      return 0;
    }
    if (options.command === "compare") {
      await compareResults(options);
      return 0;
    }
    if (options.command === "validate-task") {
      return await validateTask(options, deps);
    }
    if (options.command === "draft-task") {
      await draftTaskFromChatLog(options);
      return 0;
    }
    return await runEvaluation(options, deps);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    console.error("");
    console.error(usage());
    return 1;
  }
}

async function main(): Promise<void> {
  process.exitCode = await runCli(process.argv.slice(2));
}

if (require.main === module) {
  void main();
}
