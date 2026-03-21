import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { runCli } from "./cli";
import { ensureDir, readJsonFile, readTextFile, removeDir, writeJsonFile, writeTextFile } from "./utils";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function makeTerminalSvg(title: string, lines: string[], accent: string): string {
  const rowHeight = 22;
  const width = 980;
  const height = 120 + lines.length * rowHeight;
  const text = lines
    .map(
      (line, index) =>
        `<text x="36" y="${96 + index * rowHeight}" fill="#d8dee9" font-family="Consolas, 'Courier New', monospace" font-size="16">${escapeXml(line)}</text>`,
    )
    .join("");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    '<rect width="100%" height="100%" rx="24" fill="#0f172a"/>',
    `<rect x="16" y="16" width="${width - 32}" height="${height - 32}" rx="18" fill="#111827" stroke="${accent}" stroke-width="2"/>`,
    `<circle cx="42" cy="44" r="8" fill="${accent}"/>`,
    '<circle cx="66" cy="44" r="8" fill="#f59e0b"/>',
    '<circle cx="90" cy="44" r="8" fill="#10b981"/>',
    `<text x="120" y="50" fill="#f8fafc" font-family="Consolas, 'Courier New', monospace" font-size="20">${escapeXml(title)}</text>`,
    text,
    "</svg>",
  ].join("");
}

async function listTaskArtifacts(artifactRoot: string): Promise<string[]> {
  const taskDirs = (await readdir(artifactRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))
    .slice(0, 5);

  const lines = ["reports/artifacts/<run-id>/"];
  for (const taskId of taskDirs) {
    lines.push(`  ${taskId}/`);
    lines.push("    prompt.txt");
    lines.push("    agent-stdout.txt");
    lines.push("    activity-summary.json");
  }
  return lines;
}

async function main(): Promise<void> {
  const generatedRoot = resolve("docs/.tmp-examples");
  const passReports = join(generatedRoot, "pass");
  const regressionReports = join(generatedRoot, "regression");
  const baselinePath = join(generatedRoot, "baseline.json");
  const docsExamplesDir = resolve("docs/examples");
  const docsAssetsDir = resolve("docs/assets");

  await removeDir(generatedRoot);
  await ensureDir(passReports);
  await ensureDir(regressionReports);
  await ensureDir(docsExamplesDir);
  await ensureDir(docsAssetsDir);

  const baselineCode = await runCli(
    [
      "run",
      "--agent-mode",
      "gold-patch",
      "--reports",
      passReports,
      "--baseline",
      baselinePath,
      "--update-baseline",
    ],
    { now: () => new Date("2026-03-21T09:00:00.000Z") },
  );
  if (baselineCode !== 0) {
    throw new Error(`Failed to generate pass examples (exit ${baselineCode})`);
  }

  const regressionCode = await runCli(
    [
      "run",
      "--agent-mode",
      "noop",
      "--reports",
      regressionReports,
      "--baseline",
      baselinePath,
    ],
    { now: () => new Date("2026-03-21T09:10:00.000Z") },
  );
  if (regressionCode !== 2) {
    throw new Error(`Expected regression example run to exit 2, got ${regressionCode}`);
  }

  const passReport = await readTextFile(join(passReports, "latest-report.md"));
  const regressionReport = await readTextFile(join(regressionReports, "latest-report.md"));
  const regressionResults = await readJsonFile(join(regressionReports, "latest-results.json"));
  const artifactRunId = (await readdir(join(regressionReports, "artifacts")))[0];
  const artifactTreeLines = await listTaskArtifacts(join(regressionReports, "artifacts", artifactRunId));

  await writeTextFile(join(docsExamplesDir, "mock-report.md"), passReport);
  await writeJsonFile(join(docsExamplesDir, "mock-results.json"), regressionResults);
  await writeTextFile(join(docsExamplesDir, "mock-regression.md"), regressionReport);
  await writeTextFile(
    join(docsAssetsDir, "report-overview.svg"),
    makeTerminalSvg(
      "Mock Report Overview",
      passReport.split(/\r?\n/).slice(0, 18),
      "#38bdf8",
    ),
  );
  await writeTextFile(
    join(docsAssetsDir, "artifact-tree.svg"),
    makeTerminalSvg("Per-Task Artifact Layout", artifactTreeLines, "#22c55e"),
  );
  await writeTextFile(
    join(docsAssetsDir, "regression-pr-view.svg"),
    makeTerminalSvg(
      "Regression Snapshot",
      regressionReport.split(/\r?\n/).slice(0, 18),
      "#f97316",
    ),
  );

  await removeDir(generatedRoot);
}

void main();
