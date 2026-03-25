const test = require("node:test");
const assert = require("node:assert/strict");
const { existsSync } = require("node:fs");
const { resolve } = require("node:path");

test("checked-in docs assets, schema, and minimal examples exist", () => {
  const requiredPaths = [
    resolve(".gemini/skills/eval-authoring-helper/SKILL.md"),
    resolve(".gemini/skills/live-failure-triage-helper/SKILL.md"),
    resolve("docs/assets/report-overview.svg"),
    resolve("docs/assets/artifact-tree.svg"),
    resolve("docs/assets/regression-pr-view.svg"),
    resolve("docs/assets/architecture-flow.svg"),
    resolve("docs/assets/architecture-flow.mmd"),
    resolve("docs/case-studies/README.md"),
    resolve("docs/case-studies/gemini-tool-output-routing-review.md"),
    resolve("docs/case-studies/live-failure-report-to-issue-packet.md"),
    resolve("docs/examples/mock-report.md"),
    resolve("docs/examples/mock-results.json"),
    resolve("docs/examples/mock-regression.md"),
    resolve("docs/examples/chat-log.json"),
    resolve("docs/issue-packets/README.md"),
    resolve("docs/issue-packets/01-archive-fresh-live-gemini-suite-runs.md"),
    resolve("docs/issue-packets/02-add-more-gemini-json-mode-regressions.md"),
    resolve("docs/issue-packets/03-publish-hosted-github-issue-backlog.md"),
    resolve("docs/issue-packets/04-add-dynamic-validate-task-preflight.md"),
    resolve("docs/issue-packets/05-live-run-dashboard-summary.md"),
    resolve("docs/issue-packets/06-expand-contributor-helper-workflows.md"),
    resolve("docs/REVIEWER_GUIDE.md"),
    resolve("docs/task.schema.json"),
    resolve("docs/minimal-task-examples/README.md"),
    resolve("docs/minimal-task-examples/workspace-edit/task.json"),
    resolve("docs/minimal-task-examples/prompt-output/task.json"),
    resolve("docs/minimal-task-examples/tool-use/task.json"),
    resolve("reports/case-study-tool-output-routing-review/latest-report.md"),
    resolve("reports/case-study-tool-output-routing-review/latest-results.json"),
    resolve("reports/case-study-tool-output-routing-review/latest-compare.md"),
    resolve("reports/case-study-tool-output-routing-review/latest-trace-summary.md"),
  ];

  for (const filePath of requiredPaths) {
    assert.equal(existsSync(filePath), true, `missing docs artifact: ${filePath}`);
  }
});
