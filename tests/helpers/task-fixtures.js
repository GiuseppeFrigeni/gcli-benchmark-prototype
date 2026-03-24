const { mkdir, mkdtemp } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { removeDir, writeJsonFile, writeTextFile } = require("../../dist/utils.js");

async function createTempDir(prefix) {
  return await mkdtemp(join(tmpdir(), `${prefix}-`));
}

async function writeRepoFiles(taskDir, files) {
  for (const [relativePath, content] of Object.entries(files)) {
    await writeTextFile(join(taskDir, "repo", relativePath), content);
  }
}

async function createTaskFixture(
  root,
  directoryName,
  {
    manifest,
    issue = "Fix the local bug.",
    skipIssueWrite = false,
    repoFiles,
    goldPatch,
    goldStdout,
    goldStderr,
    goldActivity,
    extraFiles = {},
  },
) {
  const taskDir = join(root, directoryName);
  await mkdir(taskDir, { recursive: true });
  await writeJsonFile(join(taskDir, "task.json"), manifest);
  if (!skipIssueWrite) {
    await writeTextFile(join(taskDir, manifest.problemStatementFile ?? "issue.md"), issue);
  }

  if (repoFiles) {
    await mkdir(join(taskDir, "repo"), { recursive: true });
    await writeRepoFiles(taskDir, repoFiles);
  }

  if (goldPatch !== undefined) {
    await writeTextFile(join(taskDir, "gold.patch"), goldPatch);
  }
  if (goldStdout !== undefined) {
    await writeTextFile(join(taskDir, "gold.stdout.txt"), goldStdout);
  }
  if (goldStderr !== undefined) {
    await writeTextFile(join(taskDir, "gold.stderr.txt"), goldStderr);
  }
  if (goldActivity !== undefined) {
    await writeTextFile(join(taskDir, "gold.activity.jsonl"), goldActivity);
  }

  for (const [relativePath, content] of Object.entries(extraFiles)) {
    await writeTextFile(join(taskDir, relativePath), content);
  }
}

async function withTempDir(prefix, fn) {
  const dir = await createTempDir(prefix);
  try {
    return await fn(dir);
  } finally {
    await removeDir(dir);
  }
}

function makeWorkspaceManifest(overrides = {}) {
  return {
    $schema: "../../docs/task.schema.json",
    id: "sample-workspace-task",
    title: "Sample workspace task",
    taskKind: "workspace-edit",
    suite: "harness-calibration",
    category: "debugging",
    difficulty: "easy",
    language: "javascript",
    problemStatementFile: "issue.md",
    verification: {
      failToPass: ["node --test test/fail.test.js"],
      passToPass: ["node --test test/pass.test.js"],
    },
    policy: "always",
    ...overrides,
  };
}

module.exports = {
  createTaskFixture,
  withTempDir,
  makeWorkspaceManifest,
};
