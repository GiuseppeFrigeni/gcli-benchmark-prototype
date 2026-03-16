# gcli-benchmark-prototype

Prototype local workspace benchmark for Gemini CLI agents, implemented in TypeScript + Node.js.

## Why this project

- Run repo-backed coding tasks against Gemini CLI
- Judge success with objective verification commands, not keyword heuristics
- Detect regressions against a baseline
- Generate JSON + Markdown reports with per-task artifacts

## What this is

This project is intentionally `SWE-bench Verified-like`, not a full reproduction of the official Docker-based benchmark. It uses local fixture repositories that run on Node 20+ without network access or per-task installs.

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

## Roadmap

Short-term roadmap for growing this into a stronger GSoC-ready framework:

1. Expand from 7 seed tasks to 15-20 deterministic fixtures covering more languages and failure modes.
2. Add richer regression policies such as per-category thresholds, flake tracking, and model-to-model comparisons.
3. Publish PR-friendly reports or artifacts from CI so contributors can inspect regressions quickly.
4. Grow toward a 50+ task suite with contributor templates and documented baseline refreshes.

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
