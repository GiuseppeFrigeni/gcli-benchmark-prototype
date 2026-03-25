import { access, readdir } from "node:fs/promises";
import { constants } from "node:fs";
import { join, resolve } from "node:path";
import { type ErrorObject, type ValidateFunction } from "ajv";
import Ajv2020 from "ajv/dist/2020";
import {
  DRAFT_PROMPT_OUTPUT_PLACEHOLDER,
  DRAFT_TASK_PROMPT_ADDENDUM,
  DRAFT_TASK_TAXONOMY,
  DRAFT_TASK_VERIFICATION,
  DRAFT_TOOL_USE_PLACEHOLDER,
  DRAFT_WORKSPACE_README,
} from "./draft-scaffold";
import {
  TaskCategory,
  TaskDifficulty,
  TaskKind,
  TaskPolicy,
  TaskScope,
  TaskSuite,
  TaskTaxonomy,
  ToolExpectationCall,
  ToolExpectations,
  WorkspaceTask,
} from "./types";
import { readJsonFile, readTextFile } from "./utils";

interface TaskManifest {
  id: unknown;
  title: unknown;
  draft?: unknown;
  taskKind: unknown;
  suite: unknown;
  category: unknown;
  difficulty: unknown;
  language: unknown;
  taxonomy?: unknown;
  timeoutMs?: unknown;
  problemStatementFile: unknown;
  promptAddendum?: unknown;
  setupCommands?: unknown;
  toolExpectations?: unknown;
  verification: unknown;
  policy: unknown;
}

export interface TaskValidationResult {
  taskDir: string;
  valid: boolean;
  taskId?: string;
  issues: string[];
}

const VALID_CATEGORIES: TaskCategory[] = [
  "debugging",
  "refactoring",
  "new-feature",
  "code-review",
];
const VALID_TASK_KINDS: TaskKind[] = ["workspace-edit", "prompt-output", "tool-use"];
const VALID_SUITES: TaskSuite[] = [
  "contributor-workflows",
  "gemini-core",
  "harness-calibration",
];
const VALID_SCOPES: TaskScope[] = ["single-file", "multi-file"];
const VALID_DIFFICULTIES: TaskDifficulty[] = ["easy", "medium", "hard"];
const VALID_POLICIES: TaskPolicy[] = ["always", "usually"];
const TASK_SCHEMA_PATH = resolve(__dirname, "..", "docs", "task.schema.json");

let taskSchemaValidatorPromise: Promise<ValidateFunction<TaskManifest>> | undefined;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getTaskId(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

async function getTaskSchemaValidator(): Promise<ValidateFunction<TaskManifest>> {
  if (!taskSchemaValidatorPromise) {
    taskSchemaValidatorPromise = (async () => {
      const schema = await readJsonFile<object>(TASK_SCHEMA_PATH);
      const ajv = new Ajv2020({
        allErrors: true,
        strict: false,
      });
      return ajv.compile<TaskManifest>(schema);
    })();
  }

  return await taskSchemaValidatorPromise;
}

function formatSchemaIssues(errors: ErrorObject[] | null | undefined, location: string): string[] {
  return (errors ?? []).map((error) => {
    const missingProperty =
      error.keyword === "required" &&
      typeof (error.params as { missingProperty?: unknown }).missingProperty === "string"
        ? `/${(error.params as { missingProperty: string }).missingProperty}`
        : "";
    const instancePath = `${error.instancePath}${missingProperty}`;
    const pathLabel = instancePath === "" ? "" : ` at '${instancePath}'`;
    return `${location}: schema validation failed${pathLabel}: ${error.message ?? "invalid value"}`;
  });
}

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

function parseTaskKind(value: unknown, location: string): TaskKind {
  const taskKind = requireString(value, "taskKind", location);
  if (!VALID_TASK_KINDS.includes(taskKind as TaskKind)) {
    throw new Error(`${location}: field 'taskKind' must be one of ${VALID_TASK_KINDS.join(", ")}`);
  }
  return taskKind as TaskKind;
}

function parseSuite(value: unknown, location: string): TaskSuite {
  const suite = requireString(value, "suite", location);
  if (!VALID_SUITES.includes(suite as TaskSuite)) {
    throw new Error(`${location}: field 'suite' must be one of ${VALID_SUITES.join(", ")}`);
  }
  return suite as TaskSuite;
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

function parseDraft(value: unknown, location: string): true | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (value !== true) {
    throw new Error(`${location}: field 'draft' must be true when present`);
  }
  return true;
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

function parseToolExpectationCall(
  value: unknown,
  fieldName: string,
  location: string,
): ToolExpectationCall {
  if (typeof value !== "object" || value === null) {
    throw new Error(`${location}: field '${fieldName}' must be an object`);
  }

  const record = value as Record<string, unknown>;
  const name = requireString(record.name, `${fieldName}.name`, location);
  const targetIncludes = asOptionalString(
    record.targetIncludes,
    `${fieldName}.targetIncludes`,
    location,
  );

  return {
    name,
    targetIncludes,
  };
}

function parseToolExpectationList(
  value: unknown,
  fieldName: string,
  location: string,
): ToolExpectationCall[] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${location}: field '${fieldName}' must be a non-empty array`);
  }
  return value.map((entry, index) =>
    parseToolExpectationCall(entry, `${fieldName}[${index}]`, location),
  );
}

function parseToolExpectations(
  value: unknown,
  taskKind: TaskKind,
  location: string,
): ToolExpectations | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (taskKind !== "tool-use") {
    throw new Error(`${location}: field 'toolExpectations' is only valid for tool-use tasks`);
  }
  if (typeof value !== "object") {
    throw new Error(`${location}: field 'toolExpectations' must be an object`);
  }

  const expectations = value as Record<string, unknown>;
  const parsed: ToolExpectations = {
    requiredCalls: parseToolExpectationList(
      expectations.requiredCalls,
      "toolExpectations.requiredCalls",
      location,
    ),
    orderedCalls: parseToolExpectationList(
      expectations.orderedCalls,
      "toolExpectations.orderedCalls",
      location,
    ),
    firstCall:
      expectations.firstCall === undefined
        ? undefined
        : parseToolExpectationCall(
            expectations.firstCall,
            "toolExpectations.firstCall",
            location,
          ),
  };

  if (!parsed.requiredCalls && !parsed.orderedCalls && !parsed.firstCall) {
    throw new Error(
      `${location}: field 'toolExpectations' must include requiredCalls, orderedCalls, or firstCall`,
    );
  }

  return parsed;
}

async function assertExists(path: string, description: string, location: string): Promise<void> {
  try {
    await access(path, constants.F_OK);
  } catch {
    throw new Error(`${location}: missing ${description} at '${path}'`);
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function readTaskManifest(taskDir: string): Promise<{ manifestPath: string; raw: TaskManifest }> {
  const manifestPath = join(taskDir, "task.json");
  await assertExists(manifestPath, "task manifest", taskDir);
  const raw = await readJsonFile<TaskManifest>(manifestPath);
  return { manifestPath, raw };
}

async function parseTaskFromManifest(
  taskDir: string,
  manifestPath: string,
  raw: TaskManifest,
): Promise<WorkspaceTask> {
  const location = manifestPath;
  const id = requireString(raw.id, "id", location);
  const title = requireString(raw.title, "title", location);
  const taskKind = parseTaskKind(raw.taskKind, location);
  const language = requireString(raw.language, "language", location);
  const problemStatementFile = requireString(raw.problemStatementFile, "problemStatementFile", location);
  const promptAddendum = asOptionalString(raw.promptAddendum, "promptAddendum", location);
  const setupCommands = asStringArray(raw.setupCommands, "setupCommands", location, false);
  const timeoutMs = asOptionalNumber(raw.timeoutMs, "timeoutMs", location, 1);
  const issuePath = join(taskDir, problemStatementFile);
  const repoDir = join(taskDir, "repo");
  const goldPatchPath = join(taskDir, "gold.patch");
  const goldStdoutPath = join(taskDir, "gold.stdout.txt");
  const goldStderrPath = join(taskDir, "gold.stderr.txt");
  const goldActivityLogPath = join(taskDir, "gold.activity.jsonl");

  await assertExists(issuePath, "problem statement file", location);

  const hasRepoDir = await pathExists(repoDir);
  const hasGoldPatch = await pathExists(goldPatchPath);
  const hasGoldStdout = await pathExists(goldStdoutPath);
  const hasGoldStderr = await pathExists(goldStderrPath);
  const hasGoldActivityLog = await pathExists(goldActivityLogPath);

  if (taskKind === "workspace-edit") {
    await assertExists(repoDir, "repo directory", location);
    await assertExists(goldPatchPath, "gold patch", location);
  } else if (taskKind === "prompt-output") {
    await assertExists(goldStdoutPath, "gold stdout", location);
  } else if (taskKind === "tool-use") {
    await assertExists(goldActivityLogPath, "gold activity log", location);
  }

  return {
    id,
    title,
    draft: parseDraft(raw.draft, location),
    taskKind,
    suite: parseSuite(raw.suite, location),
    category: parseCategory(raw.category, location),
    difficulty: parseDifficulty(raw.difficulty, location),
    language,
    taxonomy: parseTaxonomy(raw.taxonomy, location),
    timeoutMs,
    problemStatementFile,
    promptAddendum,
    setupCommands: setupCommands.length > 0 ? setupCommands : undefined,
    toolExpectations: parseToolExpectations(raw.toolExpectations, taskKind, location),
    verification: parseVerification(raw.verification, location),
    policy: parsePolicy(raw.policy, location),
    taskDir,
    repoDir: hasRepoDir ? repoDir : undefined,
    issuePath,
    goldPatchPath: hasGoldPatch ? goldPatchPath : undefined,
    goldStdoutPath: hasGoldStdout ? goldStdoutPath : undefined,
    goldStderrPath: hasGoldStderr ? goldStderrPath : undefined,
    goldActivityLogPath: hasGoldActivityLog ? goldActivityLogPath : undefined,
  };
}

function stringArraysEqual(left: string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

async function collectDraftReadinessIssues(
  task: WorkspaceTask,
  manifestPath: string,
): Promise<string[]> {
  const issues: string[] = [];

  if (task.draft) {
    issues.push(
      `${manifestPath}: draft scaffold marker 'draft: true' is still present; remove it only after replacing the scaffold defaults.`,
    );
  }

  if (task.taxonomy && stringArraysEqual(task.taxonomy.tags, DRAFT_TASK_TAXONOMY.tags)) {
    issues.push(
      `${manifestPath}: scaffold taxonomy tags are still present; replace '${DRAFT_TASK_TAXONOMY.tags.join(", ")}' with task-specific tags.`,
    );
  }

  if (task.promptAddendum === DRAFT_TASK_PROMPT_ADDENDUM) {
    issues.push(
      `${manifestPath}: scaffold promptAddendum is still present; replace or remove the generated draft instructions before promotion.`,
    );
  }

  if (
    stringArraysEqual(task.verification.failToPass, DRAFT_TASK_VERIFICATION.failToPass) &&
    stringArraysEqual(task.verification.passToPass, DRAFT_TASK_VERIFICATION.passToPass)
  ) {
    issues.push(
      `${manifestPath}: scaffold verification commands are still present; replace the default failToPass/passToPass commands before promotion.`,
    );
  }

  if (task.taskKind === "workspace-edit") {
    const repoReadmePath = task.repoDir ? join(task.repoDir, "README.md") : undefined;
    if (repoReadmePath && (await pathExists(repoReadmePath))) {
      const repoReadme = await readTextFile(repoReadmePath);
      if (repoReadme === DRAFT_WORKSPACE_README) {
        issues.push(
          `${repoReadmePath}: workspace draft scaffold README is still present; replace the generated repo fixture with the real workspace files.`,
        );
      }
    }

    if (task.goldPatchPath) {
      const patch = await readTextFile(task.goldPatchPath);
      if (patch === "") {
        issues.push(
          `${task.goldPatchPath}: draft gold.patch is empty; replace it with the expected patch before promotion.`,
        );
      }
    }
  }

  if (task.taskKind === "prompt-output" && task.goldStdoutPath) {
    const goldStdout = await readTextFile(task.goldStdoutPath);
    if (goldStdout === DRAFT_PROMPT_OUTPUT_PLACEHOLDER) {
      issues.push(
        `${task.goldStdoutPath}: prompt-output draft placeholder is still present; replace gold.stdout.txt with the expected output before promotion.`,
      );
    }
  }

  if (task.taskKind === "tool-use") {
    if (task.goldStdoutPath) {
      const goldStdout = await readTextFile(task.goldStdoutPath);
      if (goldStdout === DRAFT_TOOL_USE_PLACEHOLDER) {
        issues.push(
          `${task.goldStdoutPath}: tool-use draft placeholder is still present; replace gold.stdout.txt with the expected answer or remove it deliberately before promotion.`,
        );
      }
    }

    if (task.goldActivityLogPath) {
      const goldActivityLog = await readTextFile(task.goldActivityLogPath);
      if (goldActivityLog === "") {
        issues.push(
          `${task.goldActivityLogPath}: tool-use draft activity log is empty; replace it with the expected activity trace before promotion.`,
        );
      }
    }
  }

  return issues;
}

export async function loadTaskFromDirectory(taskDir: string): Promise<WorkspaceTask> {
  const { manifestPath, raw } = await readTaskManifest(taskDir);
  return await parseTaskFromManifest(taskDir, manifestPath, raw);
}

export async function validateTaskDirectory(taskDir: string): Promise<TaskValidationResult> {
  const resolvedTaskDir = resolve(taskDir);

  let manifestPath = join(resolvedTaskDir, "task.json");
  let raw: TaskManifest | undefined;
  try {
    ({ manifestPath, raw } = await readTaskManifest(resolvedTaskDir));
  } catch (error) {
    return {
      taskDir: resolvedTaskDir,
      valid: false,
      issues: [errorMessage(error)],
    };
  }

  const issues: string[] = [];
  const taskId = getTaskId(raw.id);

  try {
    const validate = await getTaskSchemaValidator();
    if (!validate(raw)) {
      issues.push(...formatSchemaIssues(validate.errors, manifestPath));
    }
  } catch (error) {
    issues.push(`${TASK_SCHEMA_PATH}: failed to load schema validator: ${errorMessage(error)}`);
  }

  if (issues.length === 0) {
    try {
      const task = await parseTaskFromManifest(resolvedTaskDir, manifestPath, raw);
      issues.push(...(await collectDraftReadinessIssues(task, manifestPath)));
      if (issues.length > 0) {
        return {
          taskDir: resolvedTaskDir,
          valid: false,
          taskId: task.id,
          issues,
        };
      }
      return {
        taskDir: resolvedTaskDir,
        valid: true,
        taskId: task.id,
        issues: [],
      };
    } catch (error) {
      issues.push(errorMessage(error));
    }
  }

  return {
    taskDir: resolvedTaskDir,
    valid: false,
    taskId,
    issues,
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
    const task = await loadTaskFromDirectory(taskDir);
    if (seenIds.has(task.id)) {
      throw new Error(`Duplicate task id '${task.id}'`);
    }
    seenIds.add(task.id);
    tasks.push(task);
  }

  return tasks.sort((a, b) => a.id.localeCompare(b.id));
}
