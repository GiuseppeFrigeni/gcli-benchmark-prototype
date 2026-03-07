import { mkdir, readFile, writeFile } from "node:fs/promises";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

export async function readJsonFile<T>(path: string): Promise<T> {
  const content = await readFile(path, "utf8");
  return JSON.parse(content) as T;
}

export async function writeJsonFile(
  path: string,
  data: unknown,
  pretty = true,
): Promise<void> {
  const spacing = pretty ? 2 : 0;
  await writeFile(path, `${JSON.stringify(data, null, spacing)}\n`, "utf8");
}

export function timestampForFile(dateIso: string): string {
  return dateIso.replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
}
