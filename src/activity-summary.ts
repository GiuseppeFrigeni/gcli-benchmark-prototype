import { readTextFile, writeJsonFile } from "./utils";

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

const TARGET_KEYS = [
  "file_path",
  "dir_path",
  "command",
  "pattern",
  "path",
  "url",
  "prompt",
] as const;

function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 3)}...`;
}

function summarizeArgs(args: Record<string, unknown> | undefined): string | undefined {
  if (!args) {
    return undefined;
  }

  for (const key of TARGET_KEYS) {
    const value = args[key];
    if (typeof value === "string" && value.trim() !== "") {
      return truncate(value.trim(), 120);
    }
  }

  return undefined;
}

function addCall(
  calls: ActivityCallSummary[],
  counts: Map<string, number>,
  name: unknown,
  args: unknown,
): void {
  if (typeof name !== "string" || name.trim() === "") {
    return;
  }

  const normalizedName = name.trim();
  const target =
    typeof args === "object" && args !== null
      ? summarizeArgs(args as Record<string, unknown>)
      : undefined;

  calls.push({
    index: calls.length + 1,
    name: normalizedName,
    target,
  });
  counts.set(normalizedName, (counts.get(normalizedName) ?? 0) + 1);
}

function tryParseJson(value: string): unknown | undefined {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function extractEmbeddedJson(value: string): unknown[] {
  const entries: unknown[] = [];
  const direct = tryParseJson(value);
  if (direct !== undefined) {
    entries.push(direct);
  }

  for (const line of value.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data: ")) {
      continue;
    }
    const parsed = tryParseJson(trimmed.slice("data: ".length));
    if (parsed !== undefined) {
      entries.push(parsed);
    }
  }

  return entries;
}

function walkValue(
  value: unknown,
  calls: ActivityCallSummary[],
  counts: Map<string, number>,
): number {
  let embeddedEvents = 0;

  if (Array.isArray(value)) {
    for (const entry of value) {
      embeddedEvents += walkValue(entry, calls, counts);
    }
    return embeddedEvents;
  }

  if (typeof value === "string") {
    const embedded = extractEmbeddedJson(value);
    if (embedded.length > 0) {
      embeddedEvents += embedded.length;
      for (const entry of embedded) {
        embeddedEvents += walkValue(entry, calls, counts);
      }
    }
    return embeddedEvents;
  }

  if (typeof value !== "object" || value === null) {
    return embeddedEvents;
  }

  const record = value as Record<string, unknown>;
  const hasNestedFunctionCall = typeof record.functionCall === "object" && record.functionCall !== null;
  if (!hasNestedFunctionCall && typeof record.name === "string" && "args" in record && Object.keys(record).length <= 3) {
    addCall(calls, counts, record.name, record.args);
  }

  if (hasNestedFunctionCall) {
    const functionCall = record.functionCall as Record<string, unknown>;
    addCall(calls, counts, functionCall.name, functionCall.args);
  }

  for (const [key, nested] of Object.entries(record)) {
    if (hasNestedFunctionCall && key === "functionCall") {
      continue;
    }
    embeddedEvents += walkValue(nested, calls, counts);
  }

  return embeddedEvents;
}

export function summarizeActivityText(content: string): ActivitySummary {
  const calls: ActivityCallSummary[] = [];
  const counts = new Map<string, number>();
  const rawLines = content.split(/\r?\n/).filter((line) => line.trim() !== "");

  let parsedEmbeddedEvents = 0;
  for (const line of rawLines) {
    const parsed = tryParseJson(line);
    if (parsed !== undefined) {
      parsedEmbeddedEvents += walkValue(parsed, calls, counts);
    }
  }

  return {
    rawEvents: rawLines.length,
    parsedEmbeddedEvents,
    calls,
    counts: Object.fromEntries([...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))),
  };
}

export async function createActivitySummary(
  activityLogPath: string,
  outputPath: string,
): Promise<ActivitySummary> {
  const content = await readTextFile(activityLogPath);
  const summary = summarizeActivityText(content);
  await writeJsonFile(outputPath, summary);
  return summary;
}
