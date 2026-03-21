import { spawn } from "node:child_process";
import { join } from "node:path";
import { AgentRunRequest, AgentRunResult, TaskAgent } from "./types";
import { ensureDir, readTextFile, writeTextFile } from "./utils";

interface ProcessResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
}

async function writeAgentArtifacts(
  request: AgentRunRequest,
  stdout: string,
  stderr: string,
  activity: Record<string, unknown>,
): Promise<Pick<AgentRunResult, "stdoutPath" | "stderrPath" | "activityLogPath">> {
  await ensureDir(request.artifactDir);
  const stdoutPath = join(request.artifactDir, "agent-stdout.txt");
  const stderrPath = join(request.artifactDir, "agent-stderr.txt");
  const activityLogPath = join(request.artifactDir, "activity.jsonl");
  await writeTextFile(stdoutPath, stdout);
  await writeTextFile(stderrPath, stderr);
  await writeTextFile(activityLogPath, `${JSON.stringify(activity)}\n`);
  return {
    stdoutPath,
    stderrPath,
    activityLogPath,
  };
}

async function runProcess(command: string, args: string[], cwd: string): Promise<ProcessResult> {
  return await new Promise<ProcessResult>((resolve) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      stderr += error.message;
      resolve({
        exitCode: null,
        stdout,
        stderr,
      });
    });
    child.on("close", (exitCode) => {
      resolve({
        exitCode,
        stdout,
        stderr,
      });
    });
  });
}

export class NoopAgent implements TaskAgent {
  async runTask(request: AgentRunRequest): Promise<AgentRunResult> {
    const startedAt = Date.now();
    const artifacts = await writeAgentArtifacts(
      request,
      `No-op agent for ${request.task.id}\n`,
      "",
      { taskId: request.task.id, mode: "noop" },
    );
    return {
      exitCode: 0,
      durationMs: Date.now() - startedAt,
      timedOut: false,
      ...artifacts,
    };
  }
}

export class GoldPatchAgent implements TaskAgent {
  async runTask(request: AgentRunRequest): Promise<AgentRunResult> {
    const startedAt = Date.now();
    if (request.task.taskKind === "workspace-edit") {
      const result = await runProcess(
        "git",
        [
          "apply",
          "--whitespace=nowarn",
          "--ignore-space-change",
          "--ignore-whitespace",
          request.task.goldPatchPath ?? "",
        ],
        request.workspaceDir,
      );
      const artifacts = await writeAgentArtifacts(
        request,
        result.stdout,
        result.stderr,
        { taskId: request.task.id, mode: "gold-patch", taskKind: request.task.taskKind },
      );
      return {
        exitCode: result.exitCode,
        durationMs: Date.now() - startedAt,
        timedOut: false,
        error: result.exitCode === 0 ? undefined : `git apply exited with ${String(result.exitCode)}`,
        ...artifacts,
      };
    }

    const stdout = request.task.goldStdoutPath
      ? await readTextFile(request.task.goldStdoutPath)
      : `Gold mock agent completed ${request.task.id}.\n`;
    const stderr = request.task.goldStderrPath
      ? await readTextFile(request.task.goldStderrPath)
      : "";
    const activity =
      request.task.goldActivityLogPath
        ? await readTextFile(request.task.goldActivityLogPath)
        : `${JSON.stringify({ taskId: request.task.id, mode: "gold-patch", taskKind: request.task.taskKind })}\n`;

    await ensureDir(request.artifactDir);
    const stdoutPath = join(request.artifactDir, "agent-stdout.txt");
    const stderrPath = join(request.artifactDir, "agent-stderr.txt");
    const activityLogPath = join(request.artifactDir, "activity.jsonl");
    await writeTextFile(stdoutPath, stdout);
    await writeTextFile(stderrPath, stderr);
    await writeTextFile(activityLogPath, activity);

    return {
      exitCode: 0,
      durationMs: Date.now() - startedAt,
      timedOut: false,
      stdoutPath,
      stderrPath,
      activityLogPath,
    };
  }
}
