import { spawn } from "node:child_process";
import { Scenario, AgentRunResult } from "./types";

export interface AgentAdapter {
  runScenario(scenario: Scenario): Promise<AgentRunResult>;
}

export interface GeminiCliAdapterOptions {
  geminiBin: string;
  geminiArgs: string[];
  model?: string;
  defaultTimeoutMs: number;
  liveOutput: boolean;
}

export class GeminiCliAdapter implements AgentAdapter {
  private readonly geminiBin: string;
  private readonly geminiArgs: string[];
  private readonly model?: string;
  private readonly defaultTimeoutMs: number;
  private readonly liveOutput: boolean;

  constructor(options: GeminiCliAdapterOptions) {
    this.geminiBin = options.geminiBin;
    this.geminiArgs = options.geminiArgs;
    this.model = options.model;
    this.defaultTimeoutMs = options.defaultTimeoutMs;
    this.liveOutput = options.liveOutput;
  }

  async runScenario(scenario: Scenario): Promise<AgentRunResult> {
    const prompt = [
      "You are being evaluated for software engineering behavior.",
      "Respond concisely but include concrete technical details.",
      "",
      `Scenario ID: ${scenario.id}`,
      `Category: ${scenario.category}`,
      `Task: ${scenario.prompt}`,
    ].join("\n");

    const timeoutMs = scenario.timeoutMs ?? this.defaultTimeoutMs;
    const args = this.buildInvocationArgs();
    return this.invokeGemini(prompt, timeoutMs, scenario.id, args, this.liveOutput);
  }

  private invokeGemini(
    prompt: string,
    timeoutMs: number,
    scenarioId: string,
    args: string[],
    liveOutput: boolean,
  ): Promise<AgentRunResult> {
    return new Promise<AgentRunResult>((resolve, reject) => {
      const startedAt = Date.now();
      let settled = false;
      const safeReject = (error: Error): void => {
        if (settled) {
          return;
        }
        settled = true;
        reject(error);
      };
      const safeResolve = (result: AgentRunResult): void => {
        if (settled) {
          return;
        }
        settled = true;
        resolve(result);
      };

      if (liveOutput) {
        process.stdout.write(`\n=== Scenario ${scenarioId} ===\n`);
        process.stdout.write(`[gemini] ${this.geminiBin} ${args.join(" ")}\n`);
      }

      const child = spawn(this.geminiBin, args, {
        stdio: ["pipe", "pipe", "pipe"],
        shell: process.platform === "win32",
        windowsHide: true,
      });

      let stdout = "";
      let stderr = "";
      let stdoutBuffer = "";
      let stderrBuffer = "";
      let timeoutTriggered = false;
      let detectedModel: string | undefined;

      const updateDetectedModel = (candidate: string | undefined): void => {
        if (!candidate) {
          return;
        }
        if (!detectedModel) {
          detectedModel = candidate;
        }
      };

      const consumeBufferLines = (buffer: string): { rest: string; lines: string[] } => {
        const lines: string[] = [];
        let rest = buffer;
        for (;;) {
          const idx = rest.indexOf("\n");
          if (idx < 0) {
            break;
          }
          lines.push(rest.slice(0, idx).trim());
          rest = rest.slice(idx + 1);
        }
        return { rest, lines };
      };

      const timeout = setTimeout(() => {
        timeoutTriggered = true;
        this.terminateChildProcess(child.pid);
        safeReject(new Error(`Gemini CLI timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk) => {
        stdout += chunk;
        stdoutBuffer += chunk;
        const consumed = consumeBufferLines(stdoutBuffer);
        stdoutBuffer = consumed.rest;
        for (const line of consumed.lines) {
          updateDetectedModel(this.extractModelFromLine(line));
        }
        if (liveOutput) {
          process.stdout.write(chunk);
        }
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk;
        stderrBuffer += chunk;
        const consumed = consumeBufferLines(stderrBuffer);
        stderrBuffer = consumed.rest;
        for (const line of consumed.lines) {
          updateDetectedModel(this.extractModelFromLine(line));
        }
        if (liveOutput) {
          process.stderr.write(chunk);
        }
      });

      child.stdin.setDefaultEncoding("utf8");
      child.stdin.write(prompt);
      child.stdin.end();

      child.on("error", (error) => {
        clearTimeout(timeout);
        safeReject(
          new Error(
            `Failed to start Gemini CLI ('${this.geminiBin}'): ${error.message}`,
          ),
        );
      });

      child.on("close", (code) => {
        clearTimeout(timeout);
        const durationMs = Date.now() - startedAt;
        const output = stdout.trim();
        const err = stderr.trim();

        updateDetectedModel(this.extractModelFromLine(stdoutBuffer.trim()));
        updateDetectedModel(this.extractModelFromLine(stderrBuffer.trim()));
        updateDetectedModel(this.extractModelFromText(output));
        updateDetectedModel(this.extractModelFromText(err));

        if (liveOutput) {
          process.stdout.write(`\n=== End Scenario ${scenarioId} (exit ${String(code)}) ===\n`);
        }

        if (timeoutTriggered || settled) {
          return;
        }

        if (code !== 0) {
          safeReject(
            new Error(
              `Gemini CLI exited with code ${String(code)}${err ? `: ${err}` : ""}`,
            ),
          );
          return;
        }

        safeResolve({
          output: output.length > 0 ? output : err,
          durationMs,
          detectedModel,
        });
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

  private buildInvocationArgs(): string[] {
    const args: string[] = [];
    let modelFromArgs: string | undefined;

    for (let i = 0; i < this.geminiArgs.length; i += 1) {
      const arg = this.geminiArgs[i];
      if (arg === "-p" || arg === "--prompt") {
        if (i + 1 < this.geminiArgs.length) {
          i += 1;
        }
        continue;
      }
      if (arg === "-i" || arg === "--prompt-interactive") {
        if (i + 1 < this.geminiArgs.length) {
          i += 1;
        }
        continue;
      }
      if (arg.startsWith("--prompt=") || arg.startsWith("--prompt-interactive=")) {
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

    args.push("--prompt=");
    return args;
  }

  private extractModelFromLine(line: string): string | undefined {
    if (!line) {
      return undefined;
    }

    try {
      const parsed = JSON.parse(line) as unknown;
      const fromJson = this.extractModelFromJson(parsed);
      if (fromJson) {
        return fromJson;
      }
    } catch {
      // Not JSON; fall through to plain-text extraction.
    }

    return this.extractModelFromText(line);
  }

  private extractModelFromText(text: string): string | undefined {
    if (!text) {
      return undefined;
    }

    const explicitGemini = text.match(/\b(gemini[-\w.]+)\b/i);
    if (explicitGemini && explicitGemini[1]) {
      return explicitGemini[1];
    }

    const modelPattern = text.match(
      /\bmodel(?:\s+name)?\s*[:=]\s*["']?([A-Za-z0-9._-]{3,})["']?/i,
    );
    if (modelPattern && modelPattern[1]) {
      return modelPattern[1];
    }

    return undefined;
  }

  private extractModelFromJson(value: unknown): string | undefined {
    if (typeof value === "string") {
      return this.extractModelFromText(value);
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const found = this.extractModelFromJson(item);
        if (found) {
          return found;
        }
      }
      return undefined;
    }

    if (value && typeof value === "object") {
      const obj = value as Record<string, unknown>;
      for (const [key, entry] of Object.entries(obj)) {
        const modelLikeKey = /(^model$|model[_-]?name|model[_-]?id|modelversion)/i.test(
          key,
        );
        if (modelLikeKey && typeof entry === "string") {
          const normalized = this.extractModelFromText(entry) ?? entry.trim();
          if (normalized) {
            return normalized;
          }
        }
        const nested = this.extractModelFromJson(entry);
        if (nested) {
          return nested;
        }
      }
    }

    return undefined;
  }
}


