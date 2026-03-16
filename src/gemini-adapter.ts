import { spawn } from "node:child_process";
import { join } from "node:path";
import { AgentRunRequest, AgentRunResult, TaskAgent } from "./types";
import { ensureDir, writeTextFile } from "./utils";

export interface GeminiCliAgentOptions {
  geminiBin: string;
  geminiArgs: string[];
  model?: string;
  liveOutput: boolean;
}

export class GeminiCliAgent implements TaskAgent {
  private readonly geminiBin: string;
  private readonly geminiArgs: string[];
  private readonly model?: string;
  private readonly liveOutput: boolean;

  constructor(options: GeminiCliAgentOptions) {
    this.geminiBin = options.geminiBin;
    this.geminiArgs = options.geminiArgs;
    this.model = options.model;
    this.liveOutput = options.liveOutput;
  }

  async runTask(request: AgentRunRequest): Promise<AgentRunResult> {
    await ensureDir(request.artifactDir);
    const stdoutPath = join(request.artifactDir, "agent-stdout.txt");
    const stderrPath = join(request.artifactDir, "agent-stderr.txt");
    const activityLogPath = join(request.artifactDir, "activity.jsonl");
    const args = this.buildInvocationArgs(request.prompt);

    return await new Promise<AgentRunResult>((resolve) => {
      const startedAt = Date.now();
      let stdout = "";
      let stderr = "";
      let timedOut = false;
      let settled = false;

      const finish = async (
        exitCode: number | null,
        error?: string,
      ): Promise<void> => {
        if (settled) {
          return;
        }
        settled = true;
        await writeTextFile(stdoutPath, stdout);
        await writeTextFile(stderrPath, stderr);
        if (!error && exitCode !== 0) {
          error = `Gemini CLI exited with code ${String(exitCode)}`;
        }
        resolve({
          exitCode,
          durationMs: Date.now() - startedAt,
          timedOut,
          error,
          stdoutPath,
          stderrPath,
          activityLogPath,
        });
      };

      if (this.liveOutput) {
        process.stdout.write(`\n=== Task ${request.task.id} ===\n`);
        process.stdout.write(`[gemini] ${this.geminiBin} ${args.join(" ")}\n`);
      }

      const child = spawn(this.geminiBin, args, {
        cwd: request.workspaceDir,
        env: {
          ...process.env,
          GEMINI_CLI_ACTIVITY_LOG_TARGET: activityLogPath,
        },
        stdio: ["ignore", "pipe", "pipe"],
        shell: process.platform === "win32",
        windowsHide: true,
      });

      const timeout = setTimeout(() => {
        timedOut = true;
        this.terminateChildProcess(child.pid);
      }, request.timeoutMs);

      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk) => {
        stdout += chunk;
        if (this.liveOutput) {
          process.stdout.write(chunk);
        }
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk;
        if (this.liveOutput) {
          process.stderr.write(chunk);
        }
      });

      child.on("error", (error) => {
        clearTimeout(timeout);
        void finish(null, `Failed to start Gemini CLI ('${this.geminiBin}'): ${error.message}`);
      });

      child.on("close", (code) => {
        clearTimeout(timeout);
        if (this.liveOutput) {
          process.stdout.write(`\n=== End Task ${request.task.id} (exit ${String(code)}) ===\n`);
        }
        const error = timedOut ? `Gemini CLI timed out after ${request.timeoutMs}ms` : undefined;
        void finish(code, error);
      });
    });
  }

  private terminateChildProcess(pid: number | undefined): void {
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

  private buildInvocationArgs(prompt: string): string[] {
    const args: string[] = [];
    let modelFromArgs: string | undefined;

    for (let i = 0; i < this.geminiArgs.length; i += 1) {
      const arg = this.geminiArgs[i];
      if (arg === "-p" || arg === "--prompt" || arg === "-i" || arg === "--prompt-interactive") {
        if (i + 1 < this.geminiArgs.length) {
          i += 1;
        }
        continue;
      }
      if (
        arg.startsWith("--prompt=") ||
        arg.startsWith("--prompt-interactive=") ||
        arg === "--approval-mode" ||
        arg === "-y" ||
        arg === "--yolo"
      ) {
        if (arg === "--approval-mode" && i + 1 < this.geminiArgs.length) {
          i += 1;
        }
        continue;
      }
      if (arg.startsWith("--approval-mode=")) {
        continue;
      }
      if (arg === "-m" || arg === "--model") {
        const next = this.geminiArgs[i + 1];
        if (next !== undefined) {
          modelFromArgs = next;
          i += 1;
        }
        continue;
      }
      if (arg.startsWith("--model=")) {
        modelFromArgs = arg.slice("--model=".length);
        continue;
      }
      args.push(arg);
    }

    const resolvedModel = this.model ?? modelFromArgs;
    if (resolvedModel && resolvedModel.trim().length > 0) {
      args.push(`--model=${resolvedModel}`);
    }

    args.push("--approval-mode=yolo");
    args.push(prompt);
    return args;
  }
}
