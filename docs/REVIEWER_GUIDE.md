# Reviewer Guide

This repo is a prototype for the Gemini CLI quality and contributor-workflow part of the proposed GSoC project. It is meant to prove that outside contributors can measure, classify, inspect, and extend behavior-focused eval coverage without needing the entire summer project to be finished first.

## What This Prototype Proves Today

- Live Gemini CLI failures can be captured as inspectable benchmark evidence instead of anecdotal bug reports.
- Contributors can follow a closed loop from failure artifact to rerun, comparison, draft task, or issue packet.
- Deterministic task fixtures, schema-backed manifests, and objective verification let maintainers review quality work with stable artifacts.

## Intentionally Out Of Scope Before GSoC

- Improving Gemini CLI's live pass rate is not the claim of this prototype.
- `draft-task` is still a scaffold generator, not full automatic eval generation.
- The repo proves contributor workflow and eval infrastructure first; prompt/tool changes inside Gemini CLI remain summer-project work.

## Three Strongest Proof Artifacts

1. Live Gemini evidence:
   - `reports/live-gemini-core/`
   - `reports/live-contributor-workflows/`
2. Worked failure-to-rerun case study:
   - `docs/case-studies/gemini-tool-output-routing-review.md`
3. Contributor authoring and triage workflow:
   - `.gemini/skills/eval-authoring-helper/SKILL.md`
   - `.gemini/skills/live-failure-triage-helper/SKILL.md`

## How This Maps To The GSoC Project

- Standardized evaluation framework:
  deterministic runner, task schema, artifact capture, reports, and regression comparison
- Contributor-facing quality workflows:
  maintainer replies, review investigations, flaky-eval triage, and task authoring support
- Skills or subagents for contributors:
  repo-local helper workflows for authoring new tasks and triaging live failures into follow-up work
- Public backlog and roadmap:
  issue packets plus direct GitHub issue-editor links so the backlog is actionable even without `gh`

## 5-Minute Reviewer Path

1. Read the live evidence summary in `README.md`.
2. Read `docs/case-studies/gemini-tool-output-routing-review.md`.
3. Read `docs/case-studies/live-failure-report-to-issue-packet.md`.
4. Skim the two helper workflows under `.gemini/skills/`.
5. Run:

```bash
npm run dev:validate-task -- --task-dir ./tasks/gemini-tool-output-routing-review --dynamic
```

That single command shows the static manifest check plus the dynamic fixture-contract check without running Gemini CLI.
