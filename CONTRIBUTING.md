# Contributing

Thanks for helping improve the Gemini CLI contributor eval harness.

## What To Read First

- [`README.md`](./README.md) for suite layout, current evidence, and benchmark goals
- [`docs/ADDING_TASKS.md`](./docs/ADDING_TASKS.md) for the task contract
- [`docs/task.schema.json`](./docs/task.schema.json) for manifest validation
- [`docs/minimal-task-examples/README.md`](./docs/minimal-task-examples/README.md) for copyable starter fixtures
- [`docs/ROADMAP_ISSUES.md`](./docs/ROADMAP_ISSUES.md) for issue-ready follow-up work

## Suite Taxonomy

- `gemini-core`: direct evidence about Gemini CLI quality work, especially JSON mode, repo triage, and debugging tasks
- `contributor-workflows`: maintainer replies, regression triage, eval maintenance, and contributor-facing reporting flows
- `harness-calibration`: generic deterministic fixtures that validate the harness itself

Every task must choose one primary `suite`. Cross-cutting behavior belongs in taxonomy tags, not multiple suites.

## Local Commands

```bash
npm install
npm run build
npm run test:unit
npm run test:integration
npm run test:e2e
npm run dev:list -- --json
npm run dev:gaps -- --json
npm run dev:run -- --agent-mode=gold-patch
```

For live-agent runs, use the suite filters so results stay inspectable:

```bash
npm run dev:run -- --agent-mode=gemini-cli --suite=gemini-core
npm run dev:run -- --agent-mode=gemini-cli --suite=contributor-workflows
```

## Adding Or Updating Tasks

- Start from the schema-backed examples under `docs/minimal-task-examples/`.
- Keep fixtures small, deterministic, and reviewable.
- Add `$schema` and `suite` to every `task.json`.
- Prefer exact stdout assertions for `prompt-output`.
- Prefer both exact-answer checks and `toolExpectations` for `tool-use`.
- Keep gold artifacts readable enough that a reviewer can understand the expected path at a glance.
- Use `npm run dev:list -- --tasks <dir>` as a fast validation pass while authoring.

## Review Checklist

- The task has one clear success condition and one primary suite.
- `verification.failToPass` fails before the agent runs and passes after the expected behavior.
- `verification.passToPass` stays green on the pristine fixture.
- `tool-use` tasks assert both the answer and the inspection path.
- The README, roadmap log, and implementation log still match the current repo state.

## Artifacts And Baselines

- Do not present `gold-patch` results as live Gemini quality.
- Refresh the checked-in baseline only when the deterministic harness expectation changed intentionally.
- Keep archived live Gemini runs separate from the mock baseline and include run metadata.
