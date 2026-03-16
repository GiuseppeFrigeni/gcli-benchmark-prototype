import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { GeminiCliAgent } from "./gemini-adapter";
import { GoldPatchAgent, NoopAgent } from "./mock-agents";
import { loadTasks } from "./task-loader";
import { detectRegressions, loadBaselineIfExists, makeBaseline, saveBaseline } from "./regression";
import { saveReports } from "./report";
import { AgentMode, EvaluationRun, RunConfig, TaskAgent, WorkspaceTask } from "./types";
import { timestampForFile } from "./utils";
import { runTasks } from "./workspace-runner";

type Command = "run" | "list";

interface CliOptions {
  command: Command;
  agentMode: AgentMode;
  tasksDir: string;
  reportsDir: string;
  baselinePath: string;
  updateBaseline: boolean;
  geminiBin: string;
  geminiArgs: string[];
  model?: string;
  defaultTimeoutMs: number;
  maxTasks?: number;
  liveOutput: boolean;
  selectedTaskIds: string[];
  workspaceRoot: string;
  keepWorkspaces: boolean;
  explicitGeminiBin: boolean;
  explicitGeminiArgs: boolean;
  explicitModel: boolean;
  explicitLiveOutput: boolean;
}

interface CliDependencies {
  createAgent?: (
    options: Pick<CliOptions, "agentMode" | "geminiBin" | "geminiArgs" | "model" | "liveOutput">,
  ) => TaskAgent;
  now?: () => Date;
}

const defaults: CliOptions = {
  command: "run",
  agentMode: "gemini-cli",
  tasksDir: "./tasks",
  reportsDir: "./reports",
  baselinePath: "./baseline/baseline.json",
  updateBaseline: false,
  geminiBin: "gemini",
  geminiArgs: [],
  defaultTimeoutMs: 120000,
  liveOutput: false,
  selectedTaskIds: [],
  workspaceRoot: join(tmpdir(), "gcli-benchmark-workspaces"),
  keepWorkspaces: false,
  explicitGeminiBin: false,
  explicitGeminiArgs: false,
  explicitModel: false,
  explicitLiveOutput: false,
};

function usage(): string {
  return [
    "Usage:",
    "  npm run dev:list -- [--tasks ./tasks]",
    "  npm run dev:run -- [options]",
    "",
    "Options:",
    "  --agent-mode <mode>         Agent mode: gemini-cli | gold-patch | noop",
    "  --tasks <path>              Tasks directory (default: ./tasks)",
    "  --reports <path>            Output report directory (default: ./reports)",
    "  --baseline <path>           Baseline file path (default: ./baseline/baseline.json)",
    "  --update-baseline           Overwrite baseline using current run",
    "  --task <id>                 Run a specific task id (repeatable)",
    "  --gemini-bin <command>      Gemini CLI binary name/path (default: gemini)",
    "  --model <name>              Gemini model to use (ex: gemini-2.5-pro)",
    "  --gemini-arg <arg>          Extra gemini arg (repeatable)",
    "  --timeout-ms <number>       Default per-task timeout (default: 120000)",
    "  --max-tasks <number>        Limit loaded tasks",
    "  --workspace-root <path>     Root directory for temp workspaces",
    "  --keep-workspaces           Keep generated task workspaces after the run",
    "  --live-output               Stream Gemini output to terminal during evaluation",
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
  const options: CliOptions = { ...defaults, geminiArgs: [...defaults.geminiArgs] };

  if (args.length > 0 && !args[0].startsWith("--")) {
    const command = args.shift();
    if (command !== "run" && command !== "list") {
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
        "--task",
        "--gemini-bin",
        "--model",
        "--gemini-arg",
        "--timeout-ms",
        "--max-tasks",
        "--workspace-root",
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
    selectedTaskIds:
      options.selectedTaskIds.length > 0 ? [...options.selectedTaskIds] : undefined,
  };
  if (options.agentMode === "gemini-cli") {
    config.geminiBin = options.geminiBin;
    config.geminiArgs = options.geminiArgs;
    config.model = options.model;
    config.liveOutput = options.liveOutput;
  }
  return config;
}

function defaultCreateAgent(
  options: Pick<CliOptions, "agentMode" | "geminiBin" | "geminiArgs" | "model" | "liveOutput">,
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
    liveOutput: options.liveOutput,
  });
}

function printSummary(summary: EvaluationRun["summary"], config: RunConfig, regressionsCount: number): void {
  console.log(`Run completed at ${summary.generatedAt}`);
  console.log(`Execution mode: ${config.mode}`);
  if (config.mode === "gemini-cli") {
    console.log(`Gemini binary: ${config.geminiBin}`);
    console.log(`Model: ${config.model ?? "Gemini CLI default"}`);
  }
  console.log(`Overall: ${summary.passed}/${summary.total} passed (${(summary.passRate * 100).toFixed(2)}%)`);
  console.log(`Failed: ${summary.failed}`);
  console.log(`Infra failed: ${summary.infraFailed}`);
  console.log(`Invalid tasks: ${summary.invalidTasks}`);
  console.log(`Average duration: ${summary.averageDurationMs.toFixed(2)} ms`);
  for (const category of summary.categories) {
    console.log(
      `- ${category.category}: ${category.passed}/${category.total} (${(category.passRate * 100).toFixed(2)}%), failed ${category.failed}, infra ${category.infraFailed}, invalid ${category.invalidTasks}`,
    );
  }
  console.log(`Regression findings: ${regressionsCount}`);
}

async function listTasks(options: CliOptions): Promise<void> {
  const tasks = await loadTasks(resolve(options.tasksDir));
  console.log(`Loaded ${tasks.length} tasks from ${resolve(options.tasksDir)}`);

  const categories = new Map<string, number>();
  const languages = new Map<string, number>();
  for (const task of tasks) {
    categories.set(task.category, (categories.get(task.category) ?? 0) + 1);
    languages.set(task.language, (languages.get(task.language) ?? 0) + 1);
  }
  for (const [category, count] of [...categories.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    console.log(`- ${category}: ${count}`);
  }
  if (languages.size > 0) {
    console.log("Languages:");
    for (const [language, count] of [...languages.entries()].sort((a, b) =>
      a[0].localeCompare(b[0]),
    )) {
      console.log(`- ${language}: ${count}`);
    }
  }
}

async function runEvaluation(options: CliOptions, deps: CliDependencies): Promise<number> {
  const tasks = filterTasks(await loadTasks(resolve(options.tasksDir)), options);
  const agentFactory = deps.createAgent ?? defaultCreateAgent;
  const agent = agentFactory(options);
  const runConfig = resolveRunConfig(options);
  const generatedAt = (deps.now ?? (() => new Date()))().toISOString();
  const runId = timestampForFile(generatedAt);
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
  const regressions = detectRegressions(evaluation.summary, evaluation.tasks, baseline);

  const run: EvaluationRun = {
    summary: evaluation.summary,
    tasks: evaluation.tasks,
    regressions,
    baselinePath,
    config: runConfig,
  };

  const reportPaths = await saveReports(run, reportsDir);
  console.log(`Saved report JSON: ${reportPaths.jsonPath}`);
  console.log(`Saved report Markdown: ${reportPaths.markdownPath}`);

  if (options.updateBaseline) {
    const newBaseline = makeBaseline(evaluation.summary, evaluation.tasks);
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
