import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, relative } from "node:path";

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

export async function ensureParentDir(path: string): Promise<void> {
  await ensureDir(dirname(path));
}

export async function copyDir(source: string, target: string): Promise<void> {
  await cp(source, target, { recursive: true, force: true });
}

export async function removeDir(path: string): Promise<void> {
  await rm(path, { recursive: true, force: true });
}

export async function readTextFile(path: string): Promise<string> {
  return await readFile(path, "utf8");
}

function stripLeadingBom(content: string): string {
  return content.startsWith("\uFEFF") ? content.slice(1) : content;
}

export async function readJsonFile<T>(path: string): Promise<T> {
  const content = await readTextFile(path);
  return JSON.parse(stripLeadingBom(content)) as T;
}

export async function writeTextFile(path: string, content: string): Promise<void> {
  await ensureParentDir(path);
  await writeFile(path, content, "utf8");
}

export async function writeJsonFile(
  path: string,
  data: unknown,
  pretty = true,
): Promise<void> {
  const spacing = pretty ? 2 : 0;
  await writeTextFile(path, `${JSON.stringify(data, null, spacing)}\n`);
}

export function timestampForFile(dateIso: string): string {
  return dateIso.replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
}

export function sanitizeFileName(value: string): string {
  const cleaned = value.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned.length > 0 ? cleaned : "artifact";
}

export function relativePath(from: string, to: string): string {
  return relative(from, to).split("\\").join("/");
}
