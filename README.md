# gcli-benchmark-prototype

Prototype contributor-facing eval harness for Gemini CLI, built around deterministic repo-backed tasks, objective verification, and regression reporting.

## Why this matters for contributors

- repeatable local validation before PRs
- inspectable artifacts for debugging failures
- a path to expand quality coverage with deterministic fixtures

See the [contributor eval roadmap](./docs/ROADMAP.md) for the planned growth path.

## What this harness does

- Runs repo-backed coding tasks against Gemini CLI
- Judges success with objective verification commands instead of keyword heuristics
- Compares pass/fail outcomes against a saved baseline
- Produces JSON, Markdown, and per-task artifacts contributors can inspect locally or in CI

## Mapping the prototype to current Gemini CLI gaps

- seed support for debugging and code-review eval-style tasks
- a starter taxonomy for slicing coverage quality
- regression artifacts contributors can inspect locally and in CI

This is intentionally a seed framework contributors can extend, not a complete eval solution. Today it includes 7 seed tasks, mostly easy JavaScript fixtures, they are currently single-file in scope, and efficiency tracking is informational only with no efficiency gating yet.

## Installation

Prerequisites:

- Node.js 20+
- Gemini CLI installed and authenticated (`gemini`) for real-agent runs

Install dependencies:

```bash
npm install
```

## Quick Start

List available tasks:

```bash
npm run dev:list
```

Run all tasks with Gemini CLI:

```bash
npm run dev:run
```

Run a single task:

```bash
npm run dev:run -- --task=node-config-precedence
```

Run the deterministic mock path used by CI:

```bash
npm run dev:run -- --agent-mode=gold-patch
```

## Model Selection

Set an explicit model:

```bash
npm run dev:run -- --model=gemini-2.5-pro
```

Use Gemini CLI defaults:

```bash
npm run dev:run
```

## Real-Time Output

Stream Gemini output while tasks run:

```bash
npm run dev:run -- --live-output
```

## Baseline + Regression Checks

Create or update baseline:

```bash
npm run baseline:update
```

Create a fully passing mock baseline:

```bash
npm run dev:run -- --agent-mode=gold-patch --update-baseline
```

Validate regression reporting with the no-op mock agent:

```bash
npm run dev:run -- --agent-mode=noop
```

The checked-in baseline is intended to come from a real Gemini CLI run on the current task suite. Regenerate it after a successful run instead of editing it manually.

Current checked-in baseline:

- Run date: `2026-03-15T18:10:02.028Z`
- Overall pass rate: `5/7` (`71.43%`)
- Infra failures: `2`

Keep generated workspaces for inspection:

```bash
npm run dev:run -- --keep-workspaces
```

## Tests

Run the deterministic harness tests and mock-agent smoke coverage:

```bash
npm test
```

GitHub Actions also runs a mocked end-to-end benchmark flow on pull requests and manual dispatches. That workflow:

- creates a passing baseline with `--agent-mode=gold-patch`
- runs a regression check with `--agent-mode=noop`
- expects exit code `2` from the regression pass
- uploads the generated reports and artifacts from both runs

## Reports

Output files:

- `reports/latest-results.json`
- `reports/latest-report.md`
- archived timestamped copies in `reports/`
- per-task artifacts in `reports/artifacts/<run-id>/`

The JSON output includes per-task taxonomy and efficiency details plus summary-level taxonomy coverage and efficiency aggregates. The Markdown report mirrors that with compact contributor-facing sections.

## Included Tasks

- `node-config-precedence`
- `node-router-path-normalization`
- `node-cli-json-output`
- `node-slug-shared-normalizer`
- `node-keyword-normalizer-refactor`
- `node-header-merge-review`
- `node-cache-key-review`

Current category coverage:

- `debugging`: 2 tasks
- `new-feature`: 1 task
- `refactoring`: 2 tasks
- `code-review`: 2 tasks

Current taxonomy scope coverage:

- `single-file`: 7 tasks

## Roadmap

Short-term roadmap for growing this into a stronger contributor eval harness:

1. Expand from 7 seed tasks to 15-20 deterministic fixtures, especially more debugging and code-review tasks.
2. Add harder multi-file reasoning tasks and richer taxonomy slicing.
3. Strengthen efficiency tracking and PR-facing regression visibility.
4. Grow toward a 50+ task suite with contributor templates and repeatable baseline refreshes.

See [docs/ROADMAP.md](./docs/ROADMAP.md) for the fuller milestone plan.

## Project Layout

```text
src/
  cli.ts
  gemini-adapter.ts
  task-loader.ts
  workspace-runner.ts
  regression.ts
  report.ts
tasks/
  <task-id>/
    task.json
    issue.md
    gold.patch
    repo/
baseline/
  baseline.json
docs/
  ADDING_TASKS.md
tests/
  benchmark.test.js
```
