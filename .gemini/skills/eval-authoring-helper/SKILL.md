# Eval Authoring Helper

Use this helper when you want to turn a contributor report, chat log, or maintainer workflow into a benchmark task for this repo without inventing a new CLI surface.

## Goal

Guide contributors through the repo's fixed task-authoring loop:

1. classify the task kind
2. scaffold with `draft-task`
3. replace placeholder gold artifacts and generated draft markers
4. validate with `validate-task`
5. inspect coverage gaps with `gaps`
6. promote the finished task into `tasks/`

## Choose The Task Kind First

- `workspace-edit`: use when success is judged by code edits plus `failToPass` / `passToPass` verification commands
- `prompt-output`: use when the final answer itself is the scored output
- `tool-use`: use when the inspection path matters and the task should verify required or ordered calls

If the answer and the investigation path are both important, default to `tool-use`.

## Workflow

### 1. Draft the task

Use the structured chat-log scaffold first:

```bash
npm run dev:draft-task -- --chat-log <chat-log.json> --task-id <task-id> --task-kind <workspace-edit|prompt-output|tool-use> --category <debugging|refactoring|new-feature|code-review> --language <language> --out ./drafts/<task-id>
```

### 2. Replace placeholders

Tighten the generated draft before promotion:

- rewrite `issue.md` so the success condition is explicit
- replace placeholder gold artifacts with real expected output, patch, or activity
- add or tighten fixture files so the task is deterministic
- remove `draft: true`
- replace the generated verification commands
- set `suite`, `taxonomy`, and `promptAddendum` deliberately

### 3. Validate the task shape

Run the fast static validation loop:

```bash
npm run dev:validate-task -- --task-dir ./drafts/<task-id>
```

This catches schema issues, missing assets, task-kind mismatches, and untouched draft scaffolds. Fresh `draft-task` output is expected to fail here until you replace the generated scaffold defaults. It does not execute verification commands.

### 4. Check coverage gaps

Use the draft corpus to decide whether the task belongs in `gemini-core`, `contributor-workflows`, or `harness-calibration`, and to see which taxonomy tags are currently under-covered:

```bash
npm run dev:gaps -- --tasks ./drafts --json
```

If you are promoting a single draft, compare the draft intent with the existing suite definitions in `README.md` and `docs/ADDING_TASKS.md`.

### 5. Promote the task

Move the finished task into `tasks/<task-id>/` only after:

- placeholders are gone
- `draft: true` is gone
- `task.json` includes `suite` and `taxonomy`
- the gold artifacts are readable in code review
- the verification contract is stable

## Worked Example

This repo already ships a structured chat log at `docs/examples/chat-log.json`.

Draft it as a `tool-use` task:

```bash
npm run dev:draft-task -- --chat-log docs/examples/chat-log.json --task-id draft-chat-log-tool-use --task-kind tool-use --category debugging --language text --out ./drafts/draft-chat-log-tool-use
```

Then tighten it with this exact loop:

```bash
npm run dev:validate-task -- --task-dir ./drafts/draft-chat-log-tool-use
npm run dev:gaps -- --tasks ./drafts --json
```

For that example, the likely promotion path is:

- keep it in `contributor-workflows`
- preserve `tool-use` as the task kind
- remove `draft: true`
- replace the placeholder `gold.stdout.txt` and `gold.activity.jsonl`
- replace the generated verification commands
- replace the generated taxonomy tags with task-specific ones

## When Not To Use This Helper

- Do not use it to auto-promote a draft directly into `tasks/`
- Do not treat `draft-task` output as finished eval coverage
- Do not use it to redesign the CLI; this helper packages the current workflow around existing commands
