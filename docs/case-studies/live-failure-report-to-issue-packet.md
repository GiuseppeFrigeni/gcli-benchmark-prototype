# Case Study: `live-failure-report-to-issue-packet`

This example covers the second contributor entry path in the repo: starting from a checked-in live failure report and turning it into a concrete follow-up artifact without needing a full new benchmark implementation first.

## Starting Artifact

Use the archived `gemini-core` live report:

- `reports/live-gemini-core/latest-report.md`
- `reports/live-gemini-core/latest-results.json`

That run shows several strict-output and JSON-mode failures across the direct Gemini suite.

## Why This Becomes An Issue Packet

This is not best handled as one new task.

- the misses are repeated across multiple Gemini-facing tasks
- the problem is broader than one fixture
- the next contributor step is to grow or rebalance coverage, not just patch one draft

That means the right output is a backlog item, not a new draft task.

## Helper Workflow

Use:

- `.gemini/skills/live-failure-triage-helper/SKILL.md`

The triage decision is:

1. read the live report
2. identify the repeated JSON-mode gap
3. choose the issue-packet path
4. link the exact report and results

## Resulting Follow-Up Artifact

The matched follow-up is:

- `docs/issue-packets/02-add-more-gemini-json-mode-regressions.md`

That packet is the contributor-ready output because it:

- scopes the gap
- names the concrete repo artifact inputs
- gives a publishable backlog entry instead of a loose note

## Why This Matters For The GSoC Proposal

The repo now shows both contributor loops:

1. failure to rerun and baseline comparison
2. failure report to backlog item

That is stronger than a README-only claim because a reviewer can start from a checked-in artifact and end at a specific contributor follow-up without inventing the workflow.
