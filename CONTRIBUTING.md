# Contributing

Thanks for helping improve the Gemini CLI contributor eval harness.

## What To Read First

- [`docs/REVIEWER_GUIDE.md`](./docs/REVIEWER_GUIDE.md) for the shortest explanation of what this prototype proves today
- [`README.md`](./README.md) for suite layout, current live evidence, and benchmark goals
- [`docs/case-studies/gemini-tool-output-routing-review.md`](./docs/case-studies/gemini-tool-output-routing-review.md) for the failure-to-rerun workflow
- [`docs/case-studies/live-failure-report-to-issue-packet.md`](./docs/case-studies/live-failure-report-to-issue-packet.md) for the report-to-follow-up workflow
- [`docs/ADDING_TASKS.md`](./docs/ADDING_TASKS.md) for the task contract
- [`docs/task.schema.json`](./docs/task.schema.json) for manifest validation
- [`docs/issue-packets/README.md`](./docs/issue-packets/README.md) for publishable backlog packets and direct GitHub issue-editor links

## Suite Taxonomy

- `gemini-core`: direct evidence about Gemini CLI quality work
- `contributor-workflows`: maintainer replies, regression triage, eval maintenance, and contributor-facing reporting flows
- `harness-calibration`: deterministic support fixtures that validate the harness itself

Every task must choose one primary `suite`. Cross-cutting behavior belongs in taxonomy tags, not multiple suites.

## Local Commands

```bash
npm install
npm run build
npm run test:unit
npm run test:integration
npm run test:e2e
npm run dev:validate-task -- --task-dir ./tasks/<task-id>
npm run dev:validate-task -- --task-dir ./tasks/<task-id> --dynamic
npm run dev:list -- --json
npm run dev:gaps -- --json
npm run dev:run -- --agent-mode=gold-patch
```

For live-agent runs, use the suite filters so results stay inspectable:

```bash
npm run dev:run -- --agent-mode=gemini-cli --suite=gemini-core
npm run dev:run -- --agent-mode=gemini-cli --suite=contributor-workflows
```

## Two Contributor Entry Paths

### 1. I have a chat log or maintainer report

- Start with [`.gemini/skills/eval-authoring-helper/SKILL.md`](./.gemini/skills/eval-authoring-helper/SKILL.md).
- The helper packages the current repo flow: classify task kind, run `draft-task`, replace placeholders, run `validate-task --dynamic`, inspect `gaps`, then promote into `tasks/`.
- The worked example input lives at [`docs/examples/chat-log.json`](./docs/examples/chat-log.json).

### 2. I have a failed run or report artifact

- Start with [`.gemini/skills/live-failure-triage-helper/SKILL.md`](./.gemini/skills/live-failure-triage-helper/SKILL.md).
- Use it when you already have a checked-in report, results JSON, or task artifact directory and need to decide whether the right follow-up is a draft task or an issue packet.
- The worked example lives at [`docs/case-studies/live-failure-report-to-issue-packet.md`](./docs/case-studies/live-failure-report-to-issue-packet.md).

## Review Checklist

- The task has one clear success condition and one primary suite.
- `verification.failToPass` fails before the agent runs and passes after the expected behavior.
- `verification.passToPass` stays green on the pristine fixture.
- `tool-use` tasks assert both the answer and the inspection path.
- `validate-task --dynamic` passes before a new task is promoted.
- The README, roadmap docs, and case-study links still match the current repo state.
