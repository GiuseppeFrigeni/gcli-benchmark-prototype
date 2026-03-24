# Implementation Log

Updated: 2026-03-24

This file tracks what was implemented from the README-first repositioning and external-readiness plan, plus what is still incomplete.

## Status Summary

| # | Point | Status | What was implemented | What is still not implemented |
| --- | --- | --- | --- | --- |
| 1 | Real Gemini CLI results as centerpiece | Implemented | README now opens with fresh March 24, 2026 live Gemini CLI suite runs, suite-level summary, per-task outcome tables, and exact archived artifacts in [`reports/live-gemini-core/`](../reports/live-gemini-core/) and [`reports/live-contributor-workflows/`](../reports/live-contributor-workflows/). | The live runs currently show `0` passed tasks; improving live quality is future benchmark work, not a documentation gap. |
| 2 | Explicit GSoC mapping | Implemented | README now includes a one-to-one "How This Maps To The GSoC Project" section covering standardized harness, benchmark suite, automated scoring, regression detection, report generation, authoring docs, and baseline metrics. | Nothing repo-local remains for this point. |
| 3 | Expand Gemini-specific tasks first | Implemented | Added 6 Gemini-heavy tasks: JSON mode regressions, repo triage, maintainer reply, flaky-eval stabilization, and debugging workflow/tool-use coverage. Total corpus grew from 26 to 32 tasks. | Additional Gemini-heavy tasks are still roadmap work. |
| 4 | Clear suite split | Implemented | Added required `suite` to every task, classified the corpus into `gemini-core`, `contributor-workflows`, and `harness-calibration`, and added suite-aware list/gaps/run/report behavior. | Nothing repo-local remains for this point. |
| 5 | Stronger testing story | Implemented | Replaced the monolithic benchmark test with split unit, integration, e2e, and docs-asset coverage. Added a Node 20/22 matrix workflow and kept mock calibration in its own workflow. | Nothing repo-local remains for this point. |
| 6 | OSS basics | Implemented | Added [`LICENSE`](../LICENSE), [`CONTRIBUTING.md`](../CONTRIBUTING.md), and [`CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md). | Nothing repo-local remains for this point. |
| 7 | Packaging and publishability | Implemented | Removed `private: true`, added package metadata, `bin`, `files`, `engines`, and CI package-content validation with `npm pack --dry-run`. | Package is publishable in shape, but not actually published to npm yet. |
| 8 | Reproducible benchmark snapshot | Implemented | Added run metadata to JSON/Markdown reports and surfaced run ID, date, Git SHA, Gemini CLI version, model/default-model marker, approval mode, suites, Node version, and platform in the README summary table. Refreshed the deterministic gold baseline and archived fresh live suite runs. | If future runs should pin a non-default Gemini model explicitly, that is follow-up benchmark policy work. |
| 9 | Better task authoring ergonomics | Implemented | Added [`docs/task.schema.json`](./task.schema.json), refreshed [`docs/ADDING_TASKS.md`](./ADDING_TASKS.md), and added minimal example tasks under [`docs/minimal-task-examples/`](./minimal-task-examples/). | Nothing repo-local remains for this point. |
| 10 | More trust / visible roadmap | Partially implemented | Added actionable roadmap docs in [`docs/ROADMAP.md`](./ROADMAP.md) and issue-ready seeds in [`docs/ROADMAP_ISSUES.md`](./ROADMAP_ISSUES.md). | Actual GitHub issues and `good first task` labels were not opened from this local-only implementation pass. |
| 11 | Architecture diagram | Implemented | Added [`docs/assets/architecture-flow.mmd`](./assets/architecture-flow.mmd) and [`docs/assets/architecture-flow.svg`](./assets/architecture-flow.svg), and embedded the diagram in the README. | Nothing repo-local remains for this point. |
| 12 | Tighter claim language | Implemented | README now consistently distinguishes live Gemini CLI evidence from "gold-patch harness calibration" and avoids implying that Gemini CLI scored 32/32. | Nothing repo-local remains for this point. |

## Refreshed Artifacts

### Deterministic harness calibration

- Baseline: [`baseline/baseline.json`](../baseline/baseline.json)
- Latest report: [`reports/latest-report.md`](../reports/latest-report.md)
- Latest results: [`reports/latest-results.json`](../reports/latest-results.json)
- Archived report: [`reports/report-20260324-123859.md`](../reports/report-20260324-123859.md)
- Archived results: [`reports/results-20260324-123859.json`](../reports/results-20260324-123859.json)

### Live Gemini CLI evidence

- `gemini-core` report: [`reports/live-gemini-core/report-20260324-125017.md`](../reports/live-gemini-core/report-20260324-125017.md)
- `gemini-core` results: [`reports/live-gemini-core/results-20260324-125017.json`](../reports/live-gemini-core/results-20260324-125017.json)
- `contributor-workflows` report: [`reports/live-contributor-workflows/report-20260324-131841.md`](../reports/live-contributor-workflows/report-20260324-131841.md)
- `contributor-workflows` results: [`reports/live-contributor-workflows/results-20260324-131841.json`](../reports/live-contributor-workflows/results-20260324-131841.json)

### Refreshed docs examples

- [`docs/examples/mock-report.md`](../docs/examples/mock-report.md)
- [`docs/examples/mock-results.json`](../docs/examples/mock-results.json)
- [`docs/examples/mock-regression.md`](../docs/examples/mock-regression.md)

## Notes

- The deterministic gold-patch path now calibrates 32 tasks and passes 32/32.
- The fresh live Gemini runs are intentionally kept even though they failed; the useful signal is that the harness classified strict-output mismatches, tool-path misses, and 120000ms timeouts cleanly.
- A small runner issue showed up during artifact refresh: `npm run baseline:update` orphaned child processes in this environment, while the direct `tsx` entry worked correctly. The checked-in artifacts were refreshed from the successful direct runs.
