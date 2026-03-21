import { spawn } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { createActivitySummary } from "./activity-summary";
import {
  buildEfficiencySummary,
  buildTaskKindCoverageSummary,
  buildTaxonomyCoverageSummary,
} from "./task-metrics";
import {
  CategorySummary,
  EvaluationSummary,
  TaskAgent,
  TaskEfficiency,
  TaskRunResult,
  VerificationCommandResult,
  VerificationSnapshot,
  WorkspaceTask,
} from "./types";
import {
  copyDir,
  ensureDir,
  readTextFile,
  removeDir,
  roundTo,
  sanitizeFileName,
  writeJsonFile,
  writeTextFile,
} from "./utils";

interface RawCommandResult {
  exitCode: number | null;
  durationMs: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  error?: string;
}

interface TaskCommandContext {
  task?: WorkspaceTask;
  workspaceDir: string;
  artifactDir: string;
}

export interface RunTasksOptions {
  generatedAt: string;
  runId: string;
  artifactsRoot: string;
  workspaceRoot: string;
  keepWorkspaces: boolean;
  defaultTaskTimeoutMs: number;
}

function terminateChildProcess(pid: number | undefined): void {
  if (!pid || pid <= 0) {
    return;
  }

  if (process.platform === "win32") {
    try {
      const killer = spawn("taskkill", ["/PID", String(pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      });
      killer.unref();
    } catch {
      // Best effort.
    }
    return;
  }

  try {
    process.kill(pid, "SIGTERM");
  } catch {
    // Best effort.
  }
}

async function runShellCommand(
  command: string,
  cwd: string,
  timeoutMs: number,
): Promise<RawCommandResult> {
  return await new Promise<RawCommandResult>((resolve) => {
    const startedAt = Date.now();
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let settled = false;

    const child = spawn(command, {
      cwd,
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });

    const finish = (exitCode: number | null, error?: string): void => {
      if (settled) {
        return;
      }
      settled = true;
      resolve({
        exitCode,
        durationMs: Date.now() - startedAt,
        stdout,
        stderr,
        timedOut,
        error,
      });
    };

    const timeout = setTimeout(() => {
      timedOut = true;
      terminateChildProcess(child.pid);
    }, timeoutMs);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      finish(null, error.message);
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      const error = timedOut ? `Command timed out after ${timeoutMs}ms` : undefined;
      finish(code, error);
    });
  });
}

function interpolateTaskVariables(command: string, context: TaskCommandContext): string {
  return command
    .replaceAll("${taskDir}", context.task?.taskDir ?? "")
    .replaceAll("${workspaceDir}", context.workspaceDir)
    .replaceAll("${artifactDir}", context.artifactDir);
}

async function commandWithArtifacts(
  command: string,
  cwd: string,
  timeoutMs: number,
  artifactPrefix: string,
): Promise<VerificationCommandResult> {
  const stdoutPath = `${artifactPrefix}.stdout.txt`;
  const stderrPath = `${artifactPrefix}.stderr.txt`;
  const result = await runShellCommand(command, cwd, timeoutMs);
  await writeTextFile(stdoutPath, result.stdout);
  await writeTextFile(stderrPath, result.stderr);

  return {
    command,
    passed: result.exitCode === 0 && !result.error && !result.timedOut,
    exitCode: result.exitCode,
    durationMs: result.durationMs,
    timedOut: result.timedOut,
    error: result.error,
    stdoutPath,
    stderrPath,
  };
}

async function runCommandList(
  commands: string[],
  phaseLabel: string,
  context: TaskCommandContext,
  timeoutMs: number,
): Promise<VerificationCommandResult[]> {
  const results: VerificationCommandResult[] = [];
  for (let i = 0; i < commands.length; i += 1) {
    const resolvedCommand = interpolateTaskVariables(commands[i], context);
    const prefix = join(
      context.artifactDir,
      `${phaseLabel}-${String(i + 1).padStart(2, "0")}-${sanitizeFileName(resolvedCommand.slice(0, 48))}`,
    );
    results.push(await commandWithArtifacts(resolvedCommand, context.workspaceDir, timeoutMs, prefix));
  }
  return results;
}

async function initializeGitRepo(
  workspaceDir: string,
  artifactDir: string,
): Promise<VerificationCommandResult[]> {
  const commands = [
    "git init",
    'git config user.email "benchmark@example.com"',
    'git config user.name "Benchmark Runner"',
    'git config core.editor "true"',
    'git config core.pager "cat"',
    "git config commit.gpgsign false",
    "git add .",
    'git commit --allow-empty -m "Initial commit"',
  ];
  return await runCommandList(
    commands,
    "workspace-setup",
    { workspaceDir, artifactDir },
    30000,
  );
}

async function captureDiff(workspaceDir: string, artifactDir: string): Promise<string> {
  const diffPath = join(artifactDir, "git-diff.patch");
  const result = await runShellCommand("git diff --binary --no-ext-diff", workspaceDir, 30000);
  await writeTextFile(diffPath, result.stdout);
  return diffPath;
}

function parseDiffStatValue(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function captureEfficiency(
  workspaceDir: string,
  agentDurationMs: number,
): Promise<TaskEfficiency> {
  const result = await runShellCommand("git diff --numstat --no-ext-diff", workspaceDir, 30000);
  let filesChanged = 0;
  let insertions = 0;
  let deletions = 0;

  for (const line of result.stdout.split(/\r?\n/)) {
    if (line.trim() === "") {
      continue;
    }
    filesChanged += 1;
    const [added = "", removed = ""] = line.split("\t");
    insertions += parseDiffStatValue(added);
    deletions += parseDiffStatValue(removed);
  }

  return {
    agentDurationMs,
    filesChanged,
    insertions,
    deletions,
    changedLines: insertions + deletions,
  };
}

function buildPrompt(task: WorkspaceTask, problemStatement: string, context: TaskCommandContext): string {
  const issueText = interpolateTaskVariables(problemStatement, context);
  const kindInstruction =
    task.taskKind === "workspace-edit"
      ? "Fix the issue described below by editing the workspace so the verification commands pass."
      : task.taskKind === "prompt-output"
        ? "Read the provided materials and respond in stdout with exactly the requested output. File edits are optional and are not the scoring target."
        : "Investigate the provided materials with local tools before answering. Both your final answer and your tool usage will be evaluated.";
  const sections = [
    "You are working inside a local git repository.",
    kindInstruction,
    "You may inspect files and run local commands, but do not use network access and do not install dependencies.",
    task.taskKind === "workspace-edit"
      ? "Make only the targeted changes needed for the fix."
      : "Keep any workspace changes minimal and focused on the task.",
    "",
    `Task ID: ${task.id}`,
    `Task Kind: ${task.taskKind}`,
    `Category: ${task.category}`,
    `Language: ${task.language}`,
    `Task Directory: ${context.task?.taskDir ?? ""}`,
    `Workspace Directory: ${context.workspaceDir}`,
    `Artifact Directory: ${context.artifactDir}`,
    "",
    "Issue:",
    issueText.trim(),
  ];

  if (task.promptAddendum) {
    sections.push(
      "",
      "Additional instructions:",
      interpolateTaskVariables(task.promptAddendum, context).trim(),
    );
  }

  return sections.join("\n");
}

function makeResult(
  task: WorkspaceTask,
  status: TaskRunResult["status"],
  durationMs: number,
  notes: string[],
  artifactDir: string,
  promptPath: string,
  diffPath: string,
  preflight: VerificationSnapshot,
  agent: TaskRunResult["agent"],
  efficiency?: TaskEfficiency,
  verification?: VerificationSnapshot,
  workspacePath?: string,
): TaskRunResult {
  return {
    taskId: task.id,
    title: task.title,
    taskKind: task.taskKind,
    category: task.category,
    difficulty: task.difficulty,
    language: task.language,
    taxonomy: task.taxonomy,
    policy: task.policy,
    status,
    durationMs,
    efficiency,
    notes,
    preflight,
    verification,
    artifacts: {
      artifactDir,
      promptPath,
      diffPath,
      agentStdoutPath: join(artifactDir, "agent-stdout.txt"),
      agentStderrPath: join(artifactDir, "agent-stderr.txt"),
      activityLogPath: join(artifactDir, "activity.jsonl"),
      activitySummaryPath: join(artifactDir, "activity-summary.json"),
      workspacePath,
    },
    agent,
  };
}

async function runTask(
  task: WorkspaceTask,
  agent: TaskAgent,
  options: RunTasksOptions,
): Promise<TaskRunResult> {
  const startedAt = Date.now();
  const artifactDir = join(options.artifactsRoot, task.id);
  await ensureDir(artifactDir);
  const workspaceParent = join(options.workspaceRoot, options.runId);
  await ensureDir(workspaceParent);
  const workspaceDir = await mkdtemp(join(workspaceParent, `${sanitizeFileName(task.id)}-`));
  if (task.repoDir) {
    await copyDir(task.repoDir, workspaceDir);
  }

  const commandContext: TaskCommandContext = {
    task,
    workspaceDir,
    artifactDir,
  };

  const problemStatement = await readTextFile(task.issuePath);
  const prompt = buildPrompt(task, problemStatement, commandContext);
  const promptPath = join(artifactDir, "prompt.txt");
  await writeTextFile(promptPath, `${prompt}\n`);
  await writeTextFile(join(artifactDir, "agent-stdout.txt"), "");
  await writeTextFile(join(artifactDir, "agent-stderr.txt"), "");
  await writeTextFile(join(artifactDir, "activity.jsonl"), "");
  await writeJsonFile(join(artifactDir, "activity-summary.json"), {
    rawEvents: 0,
    parsedEmbeddedEvents: 0,
    calls: [],
    counts: {},
  });

  const setupResults = await initializeGitRepo(workspaceDir, artifactDir);
  const failedSetup = setupResults.find((result) => !result.passed);
  if (failedSetup) {
    const diffPath = await captureDiff(workspaceDir, artifactDir);
    const result = makeResult(
      task,
      "infra_failed",
      Date.now() - startedAt,
      [`Workspace setup failed: ${failedSetup.command}`],
      artifactDir,
      promptPath,
      diffPath,
      { failToPass: setupResults, passToPass: [] },
      { exitCode: null, timedOut: false },
      undefined,
      undefined,
      options.keepWorkspaces ? workspaceDir : undefined,
    );
    if (!options.keepWorkspaces) {
      await removeDir(workspaceDir);
    }
    return result;
  }

  if (task.setupCommands && task.setupCommands.length > 0) {
    const taskSetup = await runCommandList(task.setupCommands, "task-setup", commandContext, 30000);
    const failedTaskSetup = taskSetup.find((result) => !result.passed);
    if (failedTaskSetup) {
      const diffPath = await captureDiff(workspaceDir, artifactDir);
      const result = makeResult(
        task,
        "invalid_task",
        Date.now() - startedAt,
        [`Task setup failed: ${failedTaskSetup.command}`],
        artifactDir,
        promptPath,
        diffPath,
        { failToPass: taskSetup, passToPass: [] },
        { exitCode: null, timedOut: false },
        undefined,
        undefined,
        options.keepWorkspaces ? workspaceDir : undefined,
      );
      if (!options.keepWorkspaces) {
        await removeDir(workspaceDir);
      }
      return result;
    }
  }

  const preflight: VerificationSnapshot = {
    failToPass: await runCommandList(
      task.verification.failToPass,
      "preflight-fail-to-pass",
      commandContext,
      30000,
    ),
    passToPass: await runCommandList(
      task.verification.passToPass,
      "preflight-pass-to-pass",
      commandContext,
      30000,
    ),
  };

  const failToPassAlreadyPassing = preflight.failToPass.filter((result) => result.passed);
  const passToPassAlreadyFailing = preflight.passToPass.filter((result) => !result.passed);
  if (failToPassAlreadyPassing.length > 0 || passToPassAlreadyFailing.length > 0) {
    const notes: string[] = [];
    if (failToPassAlreadyPassing.length > 0) {
      notes.push(
        `Expected failing checks already pass: ${failToPassAlreadyPassing.map((result) => result.command).join(", ")}`,
      );
    }
    if (passToPassAlreadyFailing.length > 0) {
      notes.push(
        `Expected stable checks already fail: ${passToPassAlreadyFailing.map((result) => result.command).join(", ")}`,
      );
    }
    const diffPath = await captureDiff(workspaceDir, artifactDir);
    const result = makeResult(
      task,
      "invalid_task",
      Date.now() - startedAt,
      notes,
      artifactDir,
      promptPath,
      diffPath,
      preflight,
      { exitCode: null, timedOut: false },
      undefined,
      undefined,
      options.keepWorkspaces ? workspaceDir : undefined,
    );
    if (!options.keepWorkspaces) {
      await removeDir(workspaceDir);
    }
    return result;
  }

  const agentResult = await agent.runTask({
    task,
    workspaceDir,
    prompt,
    artifactDir,
    timeoutMs: task.timeoutMs ?? options.defaultTaskTimeoutMs,
  });
  const diffPath = await captureDiff(workspaceDir, artifactDir);
  await createActivitySummary(
    join(artifactDir, "activity.jsonl"),
    join(artifactDir, "activity-summary.json"),
  );
  const efficiency = await captureEfficiency(workspaceDir, agentResult.durationMs);

  if (agentResult.error || agentResult.exitCode !== 0 || agentResult.timedOut) {
    const result = makeResult(
      task,
      "infra_failed",
      Date.now() - startedAt,
      [agentResult.error ?? `Agent exited with code ${String(agentResult.exitCode)}`],
      artifactDir,
      promptPath,
      diffPath,
      preflight,
      {
        exitCode: agentResult.exitCode,
        timedOut: agentResult.timedOut,
        error: agentResult.error,
      },
      efficiency,
      undefined,
      options.keepWorkspaces ? workspaceDir : undefined,
    );
    if (!options.keepWorkspaces) {
      await removeDir(workspaceDir);
    }
    return result;
  }

  const verification: VerificationSnapshot = {
    failToPass: await runCommandList(
      task.verification.failToPass,
      "post-run-fail-to-pass",
      commandContext,
      30000,
    ),
    passToPass: await runCommandList(
      task.verification.passToPass,
      "post-run-pass-to-pass",
      commandContext,
      30000,
    ),
  };
  const allPassed = [...verification.failToPass, ...verification.passToPass].every(
    (result) => result.passed,
  );
  const result = makeResult(
    task,
    allPassed ? "passed" : "failed",
    Date.now() - startedAt,
    allPassed
      ? ["All verification commands passed."]
      : ["One or more verification commands failed after the agent run."],
    artifactDir,
    promptPath,
    diffPath,
    preflight,
    {
      exitCode: agentResult.exitCode,
      timedOut: agentResult.timedOut,
      error: agentResult.error,
    },
    efficiency,
    verification,
    options.keepWorkspaces ? workspaceDir : undefined,
  );
  if (!options.keepWorkspaces) {
    await removeDir(workspaceDir);
  }
  return result;
}

function buildCategorySummaries(results: TaskRunResult[]): CategorySummary[] {
  const grouped = new Map<string, TaskRunResult[]>();
  for (const result of results) {
    const list = grouped.get(result.category) ?? [];
    list.push(result);
    grouped.set(result.category, list);
  }

  return [...grouped.entries()]
    .map(([category, entries]) => {
      const total = entries.length;
      const passed = entries.filter((entry) => entry.status === "passed").length;
      const failed = entries.filter((entry) => entry.status === "failed").length;
      const infraFailed = entries.filter((entry) => entry.status === "infra_failed").length;
      const invalidTasks = entries.filter((entry) => entry.status === "invalid_task").length;
      return {
        category: category as CategorySummary["category"],
        total,
        passed,
        failed,
        infraFailed,
        invalidTasks,
        passRate: roundTo(total === 0 ? 0 : passed / total, 4),
      };
    })
    .sort((a, b) => a.category.localeCompare(b.category));
}

export async function runTasks(
  tasks: WorkspaceTask[],
  agent: TaskAgent,
  options: RunTasksOptions,
): Promise<{ summary: EvaluationSummary; tasks: TaskRunResult[] }> {
  const results: TaskRunResult[] = [];
  await ensureDir(options.artifactsRoot);
  await ensureDir(options.workspaceRoot);

  for (const task of tasks) {
    results.push(await runTask(task, agent, options));
  }

  const total = results.length;
  const passed = results.filter((result) => result.status === "passed").length;
  const failed = results.filter((result) => result.status === "failed").length;
  const infraFailed = results.filter((result) => result.status === "infra_failed").length;
  const invalidTasks = results.filter((result) => result.status === "invalid_task").length;
  const averageDurationMs =
    total === 0
      ? 0
      : results.reduce((sum, result) => sum + result.durationMs, 0) / total;

  const summary: EvaluationSummary = {
    generatedAt: options.generatedAt,
    total,
    passed,
    failed,
    infraFailed,
    invalidTasks,
    passRate: roundTo(total === 0 ? 0 : passed / total, 4),
    averageDurationMs: roundTo(averageDurationMs, 2),
    categories: buildCategorySummaries(results),
    taskKinds: buildTaskKindCoverageSummary(results),
    taxonomyCoverage: buildTaxonomyCoverageSummary(results),
    efficiency: buildEfficiencySummary(results),
  };

  return { summary, tasks: results };
}
