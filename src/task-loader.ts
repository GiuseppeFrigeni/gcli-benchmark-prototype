import { access, readdir } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import {
  TaskCategory,
  TaskDifficulty,
  TaskPolicy,
  TaskScope,
  TaskTaxonomy,
  WorkspaceTask,
} from "./types";
import { readJsonFile } from "./utils";

interface TaskManifest {
  id: unknown;
  title: unknown;
  category: unknown;
  difficulty: unknown;
  language: unknown;
  taxonomy?: unknown;
  timeoutMs?: unknown;
  problemStatementFile: unknown;
  promptAddendum?: unknown;
  setupCommands?: unknown;
  verification: unknown;
  policy: unknown;
}

const VALID_CATEGORIES: TaskCategory[] = [
  "debugging",
  "refactoring",
  "new-feature",
  "code-review",
];
const VALID_SCOPES: TaskScope[] = ["single-file", "multi-file"];
const VALID_DIFFICULTIES: TaskDifficulty[] = ["easy", "medium", "hard"];
const VALID_POLICIES: TaskPolicy[] = ["always", "usually"];

function requireString(value: unknown, fieldName: string, location: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${location}: field '${fieldName}' must be a non-empty string`);
  }
  return value;
}

function asOptionalString(value: unknown, fieldName: string, location: string): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  return requireString(value, fieldName, location);
}

function asStringArray(
  value: unknown,
  fieldName: string,
  location: string,
  required: boolean,
): string[] {
  if (value === undefined || value === null) {
    if (required) {
      throw new Error(`${location}: missing required field '${fieldName}'`);
    }
    return [];
  }
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.trim() === "")) {
    throw new Error(`${location}: field '${fieldName}' must be a string[]`);
  }
  return value;
}

function asOptionalNumber(
  value: unknown,
  fieldName: string,
  location: string,
  minimumInclusive?: number,
): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${location}: field '${fieldName}' must be a number`);
  }
  if (minimumInclusive !== undefined && value < minimumInclusive) {
    throw new Error(`${location}: field '${fieldName}' must be >= ${minimumInclusive}`);
  }
  return value;
}

function parseCategory(value: unknown, location: string): TaskCategory {
  const category = requireString(value, "category", location);
  if (!VALID_CATEGORIES.includes(category as TaskCategory)) {
    throw new Error(`${location}: field 'category' must be one of ${VALID_CATEGORIES.join(", ")}`);
  }
  return category as TaskCategory;
}

function parseDifficulty(value: unknown, location: string): TaskDifficulty {
  const difficulty = requireString(value, "difficulty", location);
  if (!VALID_DIFFICULTIES.includes(difficulty as TaskDifficulty)) {
    throw new Error(
      `${location}: field 'difficulty' must be one of ${VALID_DIFFICULTIES.join(", ")}`,
    );
  }
  return difficulty as TaskDifficulty;
}

function parsePolicy(value: unknown, location: string): TaskPolicy {
  const policy = requireString(value, "policy", location);
  if (!VALID_POLICIES.includes(policy as TaskPolicy)) {
    throw new Error(`${location}: field 'policy' must be one of ${VALID_POLICIES.join(", ")}`);
  }
  return policy as TaskPolicy;
}

function parseVerification(
  value: unknown,
  location: string,
): { failToPass: string[]; passToPass: string[] } {
  if (typeof value !== "object" || value === null) {
    throw new Error(`${location}: field 'verification' must be an object`);
  }
  const verification = value as Record<string, unknown>;
  const failToPass = asStringArray(verification.failToPass, "verification.failToPass", location, true);
  const passToPass = asStringArray(verification.passToPass, "verification.passToPass", location, true);
  if (failToPass.length === 0) {
    throw new Error(`${location}: field 'verification.failToPass' cannot be empty`);
  }
  if (passToPass.length === 0) {
    throw new Error(`${location}: field 'verification.passToPass' cannot be empty`);
  }
  return { failToPass, passToPass };
}

function parseTaxonomy(value: unknown, location: string): TaskTaxonomy | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "object") {
    throw new Error(`${location}: field 'taxonomy' must be an object`);
  }

  const taxonomy = value as Record<string, unknown>;
  const scope = requireString(taxonomy.scope, "taxonomy.scope", location);
  if (!VALID_SCOPES.includes(scope as TaskScope)) {
    throw new Error(`${location}: field 'taxonomy.scope' must be one of ${VALID_SCOPES.join(", ")}`);
  }

  const tags = asStringArray(taxonomy.tags, "taxonomy.tags", location, true);
  if (tags.length === 0) {
    throw new Error(`${location}: field 'taxonomy.tags' cannot be empty`);
  }

  return {
    scope: scope as TaskScope,
    tags,
  };
}

async function assertExists(path: string, description: string, location: string): Promise<void> {
  try {
    await access(path, constants.F_OK);
  } catch {
    throw new Error(`${location}: missing ${description} at '${path}'`);
  }
}

async function parseTask(taskDir: string, manifestPath: string): Promise<WorkspaceTask> {
  const raw = await readJsonFile<TaskManifest>(manifestPath);
  const location = manifestPath;
  const id = requireString(raw.id, "id", location);
  const title = requireString(raw.title, "title", location);
  const language = requireString(raw.language, "language", location);
  const problemStatementFile = requireString(raw.problemStatementFile, "problemStatementFile", location);
  const promptAddendum = asOptionalString(raw.promptAddendum, "promptAddendum", location);
  const setupCommands = asStringArray(raw.setupCommands, "setupCommands", location, false);
  const timeoutMs = asOptionalNumber(raw.timeoutMs, "timeoutMs", location, 1);
  const issuePath = join(taskDir, problemStatementFile);
  const repoDir = join(taskDir, "repo");
  const goldPatchPath = join(taskDir, "gold.patch");

  await assertExists(issuePath, "problem statement file", location);
  await assertExists(repoDir, "repo directory", location);
  await assertExists(goldPatchPath, "gold patch", location);

  return {
    id,
    title,
    category: parseCategory(raw.category, location),
    difficulty: parseDifficulty(raw.difficulty, location),
    language,
    taxonomy: parseTaxonomy(raw.taxonomy, location),
    timeoutMs,
    problemStatementFile,
    promptAddendum,
    setupCommands: setupCommands.length > 0 ? setupCommands : undefined,
    verification: parseVerification(raw.verification, location),
    policy: parsePolicy(raw.policy, location),
    taskDir,
    repoDir,
    issuePath,
    goldPatchPath,
  };
}

export async function loadTasks(directory: string): Promise<WorkspaceTask[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const taskDirs = entries.filter((entry) => entry.isDirectory()).map((entry) => join(directory, entry.name));

  if (taskDirs.length === 0) {
    throw new Error(`No task directories found in '${directory}'`);
  }

  const tasks: WorkspaceTask[] = [];
  const seenIds = new Set<string>();

  for (const taskDir of taskDirs.sort((a, b) => a.localeCompare(b))) {
    const manifestPath = join(taskDir, "task.json");
    await assertExists(manifestPath, "task manifest", taskDir);
    const task = await parseTask(taskDir, manifestPath);
    if (seenIds.has(task.id)) {
      throw new Error(`Duplicate task id '${task.id}'`);
    }
    seenIds.add(task.id);
    tasks.push(task);
  }

  return tasks.sort((a, b) => a.id.localeCompare(b.id));
}
