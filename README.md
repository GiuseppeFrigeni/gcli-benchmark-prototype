# gcli-benchmark-prototype

Prototype behavioral evaluation framework for Gemini CLI agents, implemented in TypeScript + Node.js.

## Why this project

- Run coding-behavior scenarios against Gemini CLI
- Score outcomes with consistent rules
- Detect regressions against a baseline
- Generate JSON + Markdown reports

## Installation

Prerequisites:

- Node.js 20+
- Gemini CLI installed and authenticated (`gemini`)

Install dependencies:

```bash
npm install
```

## Quick Start

List scenarios:

```bash
npm run dev:list
```

Run with Gemini CLI:

```bash
npm run dev:run
```

## Model Selection

Set an explicit model:

```bash
npm run dev:run -- --model=gemini-2.5-pro
```

Use Gemini CLI defaults (no explicit model):

```bash
npm run dev:run
```

## Real-Time Output

Stream Gemini output while scenarios run:

```bash
npm run dev:run -- --live-output
```

For event-style traces:

```bash
npm run dev:run -- --live-output --gemini-arg=--output-format=stream-json
```

## Baseline + Regression Checks

Create or update baseline:

```bash
npm run baseline:update
```

Run with custom tolerances:

```bash
npm run dev:run -- --success-tol=0.05 --score-tol=8
```

## Reports

Output files:

- `reports/latest-results.json`
- `reports/latest-report.md`
- archived timestamped copies in `reports/`

## Project Layout

```text
src/
  cli.ts
  gemini-adapter.ts
  scenario-loader.ts
  evaluator.ts
  regression.ts
  report.ts
scenarios/
  core-scenarios.json
baseline/
  baseline.json
docs/
  ADDING_SCENARIOS.md
```
