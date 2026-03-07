import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  Scenario,
  ScenarioCategory,
  ScenarioDifficulty,
} from "./types";

const VALID_CATEGORIES: ScenarioCategory[] = [
  "debugging",
  "refactoring",
  "new-feature",
  "code-review",
];

const VALID_DIFFICULTIES: ScenarioDifficulty[] = ["easy", "medium", "hard"];

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
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
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
    throw new Error(
      `${location}: field '${fieldName}' must be >= ${minimumInclusive}`,
    );
  }
  return value;
}

function parseScenario(raw: unknown, location: string): Scenario {
  if (typeof raw !== "object" || raw === null) {
    throw new Error(`${location}: scenario must be an object`);
  }

  const obj = raw as Record<string, unknown>;
  const id = obj.id;
  const title = obj.title;
  const category = obj.category;
  const difficulty = obj.difficulty;
  const prompt = obj.prompt;
  const expectedKeywords = asStringArray(
    obj.expectedKeywords,
    "expectedKeywords",
    location,
    true,
  );

  if (typeof id !== "string" || id.trim() === "") {
    throw new Error(`${location}: field 'id' must be a non-empty string`);
  }
  if (typeof title !== "string" || title.trim() === "") {
    throw new Error(`${location}: field 'title' must be a non-empty string`);
  }
  if (typeof prompt !== "string" || prompt.trim() === "") {
    throw new Error(`${location}: field 'prompt' must be a non-empty string`);
  }
  if (typeof category !== "string" || !VALID_CATEGORIES.includes(category as ScenarioCategory)) {
    throw new Error(
      `${location}: field 'category' must be one of ${VALID_CATEGORIES.join(", ")}`,
    );
  }
  if (
    typeof difficulty !== "string" ||
    !VALID_DIFFICULTIES.includes(difficulty as ScenarioDifficulty)
  ) {
    throw new Error(
      `${location}: field 'difficulty' must be one of ${VALID_DIFFICULTIES.join(", ")}`,
    );
  }
  if (expectedKeywords.length === 0) {
    throw new Error(`${location}: field 'expectedKeywords' cannot be empty`);
  }

  const forbiddenKeywords = asStringArray(
    obj.forbiddenKeywords,
    "forbiddenKeywords",
    location,
    false,
  );
  const tags = asStringArray(obj.tags, "tags", location, false);
  const weight = asOptionalNumber(obj.weight, "weight", location, 0.1);
  const timeoutMs = asOptionalNumber(obj.timeoutMs, "timeoutMs", location, 1);

  return {
    id,
    title,
    category: category as ScenarioCategory,
    difficulty: difficulty as ScenarioDifficulty,
    prompt,
    expectedKeywords,
    forbiddenKeywords: forbiddenKeywords.length > 0 ? forbiddenKeywords : undefined,
    tags: tags.length > 0 ? tags : undefined,
    weight,
    timeoutMs,
  };
}

export async function loadScenarios(directory: string): Promise<Scenario[]> {
  const files = (await readdir(directory))
    .filter((file) => file.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b));

  if (files.length === 0) {
    throw new Error(`No scenario JSON files found in '${directory}'`);
  }

  const scenarios: Scenario[] = [];
  const seenIds = new Set<string>();

  for (const fileName of files) {
    const fullPath = join(directory, fileName);
    const raw = JSON.parse(await readFile(fullPath, "utf8")) as unknown;
    const location = `${fileName}`;
    const parsed = Array.isArray(raw)
      ? raw.map((entry, idx) => parseScenario(entry, `${location}[${idx}]`))
      : [parseScenario(raw, location)];

    for (const scenario of parsed) {
      if (seenIds.has(scenario.id)) {
        throw new Error(`Duplicate scenario id '${scenario.id}' (file ${fileName})`);
      }
      seenIds.add(scenario.id);
      scenarios.push(scenario);
    }
  }

  return scenarios.sort((a, b) => a.id.localeCompare(b.id));
}
