# Live Failure Triage Helper

Use this helper when you already have a checked-in live report, result JSON, or task artifact directory and need to turn that failure into a contributor-ready next step.

## Goal

Guide contributors through the repo's fixed failure-triage loop:

1. identify the failing task or repeated failure class
2. decide whether the right follow-up is a draft task or an issue packet
3. capture the decisive artifact links
4. validate the follow-up path before promotion or publication

## Choose The Output First

- Use an issue packet when the failure points to a repeated workflow gap, missing coverage area, or repo-level follow-up.
- Use a draft task when the failure reveals a specific missing deterministic scenario that should be added to `tasks/`.

If the failure is broad or repeated across a suite, default to an issue packet first.

## Workflow

### 1. Read the failure artifact

Start from one of:

- `reports/<suite>/latest-report.md`
- `reports/<suite>/latest-results.json`
- `reports/<suite>/artifacts/<run-id>/<task-id>/`

Capture:

- task id or repeated failure class
- failure reason
- first decisive artifact or missing inspection
- exact report/result links

### 2. Decide the follow-up

- Issue packet path:
  use the existing packet set under `docs/issue-packets/` when the failure matches an open backlog item
- Draft-task path:
  use `draft-task` only when the failure should become a new deterministic eval

### 3. If the output is a draft task

Run:

```bash
npm run dev:draft-task -- --chat-log <chat-log.json> --task-id <task-id> --task-kind <workspace-edit|prompt-output|tool-use> --category <debugging|refactoring|new-feature|code-review> --language <language> --out ./drafts/<task-id>
```

Then tighten it with:

```bash
npm run dev:validate-task -- --task-dir ./drafts/<task-id> --dynamic
npm run dev:gaps -- --tasks ./drafts --json
```

### 4. If the output is an issue packet

- choose the matching packet under `docs/issue-packets/`
- copy in the exact report/result/task links
- open the direct GitHub issue-editor link from `docs/issue-packets/README.md`

## Worked Example

Use `reports/live-gemini-core/latest-report.md` as the starting artifact.

The repeated JSON-mode and strict-output misses in that report map cleanly to:

- `docs/issue-packets/02-add-more-gemini-json-mode-regressions.md`

That is an issue-packet path, not a draft-task path, because the gap is suite-level rather than one missing deterministic fixture.

## When Not To Use This Helper

- Do not use it to argue that Gemini CLI already performs well on the live suite.
- Do not use it to auto-promote a draft directly into `tasks/`.
- Do not use it when you only have a fresh chat log and no failure artifact; use the eval authoring helper instead.
