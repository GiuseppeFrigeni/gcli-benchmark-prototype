# gcli-benchmark-prototype

Contributor-facing eval harness for Gemini CLI, built around deterministic tasks, objective verification, and inspectable regression artifacts.

## Why Contributors Use This

- validate changes locally before opening a PR
- compare current behavior against a saved baseline
- inspect per-task prompts, diffs, stdout, stderr, and tool-usage summaries
- extend coverage with small, reviewable task fixtures instead of ad hoc one-off scripts

## What The Harness Evaluates

The suite currently includes 14 deterministic tasks across three task kinds:

- `workspace-edit`: repo-backed fixes verified by fail-to-pass and pass-to-pass commands
- `prompt-output`: strict response-shape tasks scored from agent stdout
- `tool-use`: investigation tasks scored from both the final answer and normalized tool-usage activity

Current suite shape:

- 14 total tasks
- 10 `workspace-edit` tasks
- 2 `prompt-output` tasks
- 2 `tool-use` tasks
- 7 `multi-file` tasks
- 7 `single-file` tasks

## Example Artifacts

Deterministic mock examples live under [`docs/examples`](./docs/examples) and can be refreshed with `npm run docs:examples`.

![Mock report overview](./docs/assets/report-overview.svg)

![Per-task artifact layout](./docs/assets/artifact-tree.svg)

![Regression snapshot](./docs/assets/regression-pr-view.svg)

See the checked-in examples directly:

- [`docs/examples/mock-report.md`](./docs/examples/mock-report.md)
- [`docs/examples/mock-results.json`](./docs/examples/mock-results.json)
- [`docs/examples/mock-regression.md`](./docs/examples/mock-regression.md)

## Installation

Prerequisites:

- Node.js 20+
- Gemini CLI installed and authenticated as `gemini` for real-agent runs

Install dependencies:

```bash
npm install
```

## Quick Start

List the available tasks and coverage slices:

```bash
npm run dev:list
```

Run the full suite with Gemini CLI:

```bash
npm run dev:run
```

Run a focused subset:

```bash
npm run dev:run -- --task=node-config-precedence --task=tool-router-root-cause
```

Run the deterministic mock path used in CI:

```bash
npm run dev:run -- --agent-mode=gold-patch
```

## How A Contributor Would Catch A Regression

1. Run the tasks that cover the area you changed.

```bash
npm run dev:run -- --task=node-config-precedence --task=prompt-regression-triage-json
```

2. Compare the run against the baseline.

The harness exits with `2` when regressions are detected against the current baseline.

3. Inspect the generated artifacts.

- `reports/latest-report.md`
- `reports/latest-results.json`
- `reports/artifacts/<run-id>/<task-id>/prompt.txt`
- `reports/artifacts/<run-id>/<task-id>/activity-summary.json`
- `reports/artifacts/<run-id>/<task-id>/git-diff.patch`

4. Refresh the baseline only when the expected benchmark behavior intentionally changed.

```bash
npm run baseline:update
```

## Task Authoring Model

Every task lives under `tasks/<task-id>/` and declares a `taskKind` in `task.json`.

- `workspace-edit` requires `repo/` and `gold.patch`
- `prompt-output` requires `gold.stdout.txt`
- `tool-use` requires `gold.activity.jsonl`
- `gold.stderr.txt` is optional for non-workspace tasks

Verification and setup commands support:

- `${taskDir}`
- `${workspaceDir}`
- `${artifactDir}`

Tool-use tasks also get a normalized `activity-summary.json` artifact so they can assert on ordered tool calls and inspected targets without depending on provider-specific raw logs.

More detail:

- [`docs/ADDING_TASKS.md`](./docs/ADDING_TASKS.md)
- [`docs/ROADMAP.md`](./docs/ROADMAP.md)

## Reports

Each run writes:

- `reports/latest-results.json`
- `reports/latest-report.md`
- archived timestamped copies in `reports/`
- per-task artifacts in `reports/artifacts/<run-id>/`

The Markdown and JSON reports now surface:

- category coverage
- task-kind coverage
- taxonomy coverage
- efficiency metrics
- regression findings
- per-task artifact paths, including `activity-summary.json`

## Commands

```bash
npm run dev:list
npm run dev:run
npm run dev:run -- --agent-mode=gold-patch
npm run dev:run -- --agent-mode=noop
npm run baseline:update
npm run docs:examples
npm test
```

## Roadmap

The harness now covers repo edits, prompt-output behavior, and tool-use behavior. The next upgrades are focused on stronger regression policy, richer tool-usage assertions, and more contributor-curated tasks rather than changing the core harness model.
