import { resolve } from "node:path";
import { loadScenarios } from "./scenario-loader";
import { GeminiCliAdapter } from "./gemini-adapter";
import { evaluateScenarios } from "./evaluator";
import { RunConfig } from "./types";
import {
  detectRegressions,
  loadBaselineIfExists,
  makeBaseline,
  saveBaseline,
} from "./regression";
import { saveReports } from "./report";

type Command = "run" | "list";

interface CliOptions {
  command: Command;
  scenariosDir: string;
  reportsDir: string;
  baselinePath: string;
  updateBaseline: boolean;
  successRateTolerance: number;
  scoreTolerance: number;
  geminiBin: string;
  geminiArgs: string[];
  model?: string;
  defaultTimeoutMs: number;
  maxScenarios?: number;
  liveOutput: boolean;
}

const defaults: CliOptions = {
  command: "run",
  scenariosDir: "./scenarios",
  reportsDir: "./reports",
  baselinePath: "./baseline/baseline.json",
  updateBaseline: false,
  successRateTolerance: 0.05,
  scoreTolerance: 8,
  geminiBin: "gemini",
  geminiArgs: [],
  defaultTimeoutMs: 120000,
  liveOutput: false,
};

function usage(): string {
  return [
    "Usage:",
    "  npm run dev:list -- [--scenarios ./scenarios]",
    "  npm run dev:run -- [options]",
    "",
    "Options:",
    "  --scenarios <path>          Scenarios directory (default: ./scenarios)",
    "  --reports <path>            Output report directory (default: ./reports)",
    "  --baseline <path>           Baseline file path (default: ./baseline/baseline.json)",
    "  --update-baseline           Overwrite baseline using current run",
    "  --success-tol <number>      Regression tolerance for success rate (default: 0.05)",
    "  --score-tol <number>        Regression tolerance for average score (default: 8)",
    "  --gemini-bin <command>      Gemini CLI binary name/path (default: gemini)",
    "  --model <name>              Gemini model to use (ex: gemini-2.5-pro)",
    "  --gemini-arg <arg>          Extra gemini arg (repeatable)",
    "  --timeout-ms <number>       Default per-scenario timeout (default: 120000)",
    "  --max-scenarios <number>    Limit loaded scenarios",
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

function parseModelFromGeminiArgs(args: string[]): string | undefined {
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "-m" || arg === "--model") {
      const next = args[i + 1];
      if (next !== undefined) {
        return next;
      }
      continue;
    }
    if (arg.startsWith("--model=")) {
      const value = arg.slice("--model=".length);
      if (value.length > 0) {
        return value;
      }
    }
  }
  return undefined;
}

function resolveRunConfig(options: CliOptions): RunConfig {
  const modelFromArg = parseModelFromGeminiArgs(options.geminiArgs);
  const model = options.model ?? modelFromArg;
  const modelSource: RunConfig["modelSource"] = options.model
    ? "option"
    : modelFromArg
      ? "gemini-arg"
      : "cli-default";

  return {
    mode: "gemini-cli",
    geminiBin: options.geminiBin,
    geminiArgs: options.geminiArgs,
    model,
    modelSource,
    liveOutput: options.liveOutput,
  };
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

  // Support shorthand: `run 2` -> `run --max-scenarios 2`
  if (options.command === "run" && args.length > 0 && !args[0].startsWith("--")) {
    const maybeMax = Number(args[0]);
    if (!Number.isNaN(maybeMax)) {
      options.maxScenarios = maybeMax;
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
      continue;
    }

    if (!arg.startsWith("--")) {
      const maybeMax = Number(arg);
      if (
        options.command === "run" &&
        !Number.isNaN(maybeMax) &&
        options.maxScenarios === undefined
      ) {
        options.maxScenarios = maybeMax;
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
        "--scenarios",
        "--reports",
        "--baseline",
        "--success-tol",
        "--score-tol",
        "--gemini-bin",
        "--model",
        "--gemini-arg",
        "--timeout-ms",
        "--max-scenarios",
      ].includes(flag) &&
      value === undefined
    ) {
      throw new Error(`Flag '${flag}' requires a value`);
    }
    const requiredValue = value ?? "";

    switch (flag) {
      case "--scenarios":
        options.scenariosDir = requiredValue;
        break;
      case "--reports":
        options.reportsDir = requiredValue;
        break;
      case "--baseline":
        options.baselinePath = requiredValue;
        break;
      case "--success-tol":
        options.successRateTolerance = parseNumber(requiredValue, flag);
        break;
      case "--score-tol":
        options.scoreTolerance = parseNumber(requiredValue, flag);
        break;
      case "--gemini-bin":
        options.geminiBin = requiredValue;
        break;
      case "--model":
        options.model = requiredValue;
        break;
      case "--gemini-arg":
        options.geminiArgs.push(requiredValue);
        break;
      case "--timeout-ms":
        options.defaultTimeoutMs = parseNumber(requiredValue, flag);
        break;
      case "--max-scenarios":
        options.maxScenarios = parseNumber(requiredValue, flag);
        break;
      default:
        throw new Error(`Unknown flag '${flag}'`);
    }

    if (consumeNext) {
      i += 1;
    }
  }

  return options;
}

function printSummary(
  summary: Awaited<ReturnType<typeof evaluateScenarios>>["summary"],
  config: RunConfig,
  regressionsCount: number,
): void {
  const modelLabel = config.model ?? "Gemini CLI default";
  console.log(`Run completed at ${summary.generatedAt}`);
  console.log(`Execution mode: ${config.mode}`);
  console.log(`Gemini binary: ${config.geminiBin}`);
  console.log(`Model: ${modelLabel} (${config.modelSource})`);
  if (config.observedModels && config.observedModels.length > 0) {
    console.log(`Observed models: ${config.observedModels.join(", ")}`);
  } else {
    console.log("Observed models: none-detected");
  }
  console.log(
    `Overall: ${summary.passed}/${summary.total} passed (${(summary.successRate * 100).toFixed(2)}%)`,
  );
  console.log(`Average score: ${summary.averageScore.toFixed(2)} / 100`);
  console.log(`Average duration: ${summary.averageDurationMs.toFixed(2)} ms`);
  for (const category of summary.categories) {
    console.log(
      `- ${category.category}: ${category.passed}/${category.total} (${(category.successRate * 100).toFixed(2)}%), avg score ${category.averageScore.toFixed(2)}`,
    );
  }
  console.log(`Regression findings: ${regressionsCount}`);
}

async function listScenarios(options: CliOptions): Promise<void> {
  const scenarios = await loadScenarios(resolve(options.scenariosDir));
  console.log(`Loaded ${scenarios.length} scenarios from ${resolve(options.scenariosDir)}`);

  const categories = new Map<string, number>();
  const tags = new Map<string, number>();
  let weightedCount = 0;
  for (const scenario of scenarios) {
    categories.set(scenario.category, (categories.get(scenario.category) ?? 0) + 1);
    weightedCount += scenario.weight ?? 1;
    for (const tag of scenario.tags ?? []) {
      tags.set(tag, (tags.get(tag) ?? 0) + 1);
    }
  }
  for (const [category, count] of [...categories.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    console.log(`- ${category}: ${count}`);
  }
  console.log(`Weighted scenario count: ${weightedCount.toFixed(2)}`);

  if (tags.size > 0) {
    console.log("Tags:");
    for (const [tag, count] of [...tags.entries()].sort((a, b) =>
      a[0].localeCompare(b[0]),
    )) {
      console.log(`- ${tag}: ${count}`);
    }
  }
}

async function runEvaluation(options: CliOptions): Promise<void> {
  let scenarios = await loadScenarios(resolve(options.scenariosDir));
  if (options.maxScenarios !== undefined) {
    scenarios = scenarios.slice(0, options.maxScenarios);
  }

  const adapter = new GeminiCliAdapter({
    geminiBin: options.geminiBin,
    geminiArgs: options.geminiArgs,
    model: options.model,
    defaultTimeoutMs: options.defaultTimeoutMs,
    liveOutput: options.liveOutput,
  });

  const runConfig = resolveRunConfig(options);

  const evaluation = await evaluateScenarios(scenarios, adapter);
  runConfig.observedModels = [
    ...new Set(
      evaluation.scenarios
        .map((scenario) => scenario.detectedModel)
        .filter((model): model is string => typeof model === "string" && model.trim().length > 0),
    ),
  ];
  const baselinePath = resolve(options.baselinePath);
  const baseline = await loadBaselineIfExists(baselinePath);
  const regressions = detectRegressions(evaluation.summary, baseline, {
    successRateTolerance: options.successRateTolerance,
    scoreTolerance: options.scoreTolerance,
  });

  const run = {
    summary: evaluation.summary,
    scenarios: evaluation.scenarios,
    regressions,
    baselinePath,
    config: runConfig,
  };

  const reportPaths = await saveReports(run, resolve(options.reportsDir));
  console.log(`Saved report JSON: ${reportPaths.jsonPath}`);
  console.log(`Saved report Markdown: ${reportPaths.markdownPath}`);

  if (options.updateBaseline) {
    const newBaseline = makeBaseline(evaluation.summary);
    await saveBaseline(baselinePath, newBaseline);
    console.log(`Updated baseline: ${baselinePath}`);
  } else if (!baseline) {
    console.log(
      `No baseline found at ${baselinePath}. Run with --update-baseline to create one.`,
    );
  }

  printSummary(evaluation.summary, runConfig, regressions.length);

  if (regressions.length > 0 && !options.updateBaseline) {
    process.exitCode = 2;
  }
}

async function main(): Promise<void> {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.command === "list") {
      await listScenarios(options);
      return;
    }
    await runEvaluation(options);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    console.error("");
    console.error(usage());
    process.exitCode = 1;
  }
}

void main();
