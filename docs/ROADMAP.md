# Contributor Eval Harness Roadmap

This repository already supports the core contributor loop:

- load validated task manifests
- run deterministic workspace, prompt-output, and tool-use tasks
- score the run with objective verification commands
- compare current behavior against a baseline
- emit inspectable reports and per-task artifacts

The roadmap from here is about growing coverage and tightening regression policy, not reinventing the harness shape.

## Near Term

- Expand beyond the current 26-task suite with more medium and hard fixtures.
- Add more tool-use tasks that verify inspected targets, first-inspection choices, and debug workflow commands.
- Add more prompt-output tasks for maintainer workflows like summarization, triage, review replies, and eval maintenance.
- Keep the mocked gold/noop flow reliable so contributors can trust CI artifacts and draft-task outputs.

## Next Quality Bar

- Add per-category and per-task-kind regression thresholds.
- Surface richer baseline drift reporting when behavior changes intentionally.
- Track stronger efficiency signals for large edits and investigative tasks.
- Improve artifact summaries for PR reviews, manual triage, and contributor-authored eval drafts.

## Contributor Scale

- Reach 30+ curated tasks with balanced category, difficulty, and task-kind coverage.
- Add contributor templates for each task kind and stronger authoring helpers for eval maintenance work.
- Document a lightweight checklist for proposing new tasks, drafting from chat logs, and refreshing examples.
- Keep checked-in examples and screenshot assets refreshed from deterministic mock runs.
