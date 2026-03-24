# Roadmap Issue Mirror

The canonical public backlog belongs in GitHub issues. This file mirrors the intended issue titles, labels, and acceptance criteria so the repo can still be reviewed or synced from an offline/local-only environment. Two items are intentionally sized as `good first task` candidates.

## 1. Archive Fresh Live Gemini Suite Runs

- Labels: `evaluation`, `reporting`
- Goal: check in one current `gemini-core` live run and one current `contributor-workflows` live run with run metadata, per-task outcome tables, and README links
- Done when: README tables and archived report/result artifacts are refreshed together

## 2. Add More Gemini JSON-Mode Regressions

- Labels: `evaluation`, `gemini-core`
- Goal: add at least four more deterministic tasks around JSON mode regressions, repo triage, and debugging workflow sequencing
- Done when: `gemini-core` coverage expands without increasing generic calibration fixtures first

## 3. Publish Package Dry-Run Guardrail

- Labels: `packaging`, `good first task`
- Goal: add a CI smoke check that validates npm package contents and documents which runtime assets must ship
- Done when: `npm pack --dry-run` is part of CI and unexpected files are caught before release

## 4. Task Authoring Validation Command

- Labels: `authoring`, `good first task`
- Goal: add a dedicated CLI command for validating one task directory against the schema plus loader checks
- Done when: contributors can validate a new task without loading the whole corpus

## 5. Live Run Dashboard Summary

- Labels: `reporting`, `documentation`
- Goal: generate a compact machine-readable summary for archived live Gemini runs so README evidence tables stay easy to refresh
- Done when: archived runs can be summarized without hand-editing README tables

## 6. Contributor Helper Skill Or Subagent For Eval Work

- Labels: `authoring`, `evaluation`
- Goal: add one concrete contributor helper focused on eval authoring, prompt changes, or investigation workflows so the repo covers the deferred skills/subagents angle directly
- Done when: contributors have one tracked helper workflow that materially reduces setup or diagnosis friction for agent-intelligence quality work
