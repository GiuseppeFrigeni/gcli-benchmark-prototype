# Implementation Log

Updated: 2026-03-25

This file tracks the repo changes that reposition the project as a stronger GSoC application prototype rather than only a benchmark README.

## Status Summary

| # | Point | Status | What was implemented | What is intentionally still not implemented |
| --- | --- | --- | --- | --- |
| 1 | Real Gemini CLI results as centerpiece | Implemented | README still opens with March 24, 2026 live Gemini CLI suite runs and exact archived artifacts. | Improving live Gemini quality remains future benchmark work, not a documentation claim. |
| 2 | Explicit prototype framing | Implemented | Added [`docs/REVIEWER_GUIDE.md`](./REVIEWER_GUIDE.md), a 5-minute reviewer path in the README, and clearer language that this repo is a prototype for the GSoC proposal rather than the full project. | Nothing repo-local remains for this point. |
| 3 | Strong contributor workflow proof | Implemented | The repo now has two contributor entry paths: failure-to-rerun and report-to-follow-up. Added a second case study at [`docs/case-studies/live-failure-report-to-issue-packet.md`](./case-studies/live-failure-report-to-issue-packet.md). | Nothing repo-local remains for this point. |
| 4 | Clear suite split | Implemented | Kept `gemini-core`, `contributor-workflows`, and `harness-calibration`, while documenting `harness-calibration` more clearly as support infrastructure. | Nothing repo-local remains for this point. |
| 5 | Dynamic task preflight validation | Implemented | `validate-task` now supports `--dynamic`, which creates a temp workspace, runs setup and preflight verification, and stops before any agent execution. | It still does not run a live agent; that remains the job of `run`. |
| 6 | Better contributor helpers | Implemented | Kept the eval authoring helper and added [`live-failure-triage-helper`](../.gemini/skills/live-failure-triage-helper/SKILL.md) for turning checked-in failure artifacts into a draft task or issue packet. | The repo still does not ship runtime subagents; these remain workflow helpers. |
| 7 | Public backlog actionability | Implemented | Replaced the old `gh` blocker wording with direct GitHub issue-editor links in [`docs/issue-packets/README.md`](./issue-packets/README.md) and [`docs/ROADMAP_ISSUES.md`](./ROADMAP_ISSUES.md). | Numbered hosted issues still need to be submitted from a browser by a maintainer with repo access. |
| 8 | Stronger testing story | Implemented | Added integration coverage for `validate-task --dynamic` across workspace, prompt-output, and tool-use task shapes. | Nothing repo-local remains for this point. |

## Refreshed Artifacts

### Reviewer and contributor docs

- Reviewer guide: [`docs/REVIEWER_GUIDE.md`](./REVIEWER_GUIDE.md)
- Contributor guide: [`CONTRIBUTING.md`](../CONTRIBUTING.md)
- Case-study index: [`docs/case-studies/README.md`](./case-studies/README.md)
- Issue-packet index: [`docs/issue-packets/README.md`](./issue-packets/README.md)

### Helper workflows

- Eval authoring helper: [`.gemini/skills/eval-authoring-helper/SKILL.md`](../.gemini/skills/eval-authoring-helper/SKILL.md)
- Live failure triage helper: [`.gemini/skills/live-failure-triage-helper/SKILL.md`](../.gemini/skills/live-failure-triage-helper/SKILL.md)

### Live evidence and case studies

- `gemini-core` report: [`reports/live-gemini-core/report-20260324-125017.md`](../reports/live-gemini-core/report-20260324-125017.md)
- `contributor-workflows` report: [`reports/live-contributor-workflows/report-20260324-131841.md`](../reports/live-contributor-workflows/report-20260324-131841.md)
- Failure-to-rerun case study: [`docs/case-studies/gemini-tool-output-routing-review.md`](./case-studies/gemini-tool-output-routing-review.md)
- Report-to-issue-packet case study: [`docs/case-studies/live-failure-report-to-issue-packet.md`](./case-studies/live-failure-report-to-issue-packet.md)

## Notes

- The prototype still intentionally distinguishes deterministic harness calibration from live Gemini quality evidence.
- `draft-task` remains a scaffold generator; contributors still need to tighten fixtures and verification before promotion.
- Direct GitHub issue-editor links removed the old local-tooling blocker, but actual issue publication still requires a maintainer to submit the browser draft.
