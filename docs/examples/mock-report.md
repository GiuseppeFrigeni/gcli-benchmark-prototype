# Gemini CLI Contributor Eval Report

Generated at: 2026-03-21T09:00:00.000Z
Tasks: 14
Passed: 14 (100.00%)
Failed: 0
Infra Failed: 0
Invalid Tasks: 0
Average Duration: 94.12ms

## Task Kind Coverage

Task Kinds: prompt-output=2, tool-use=2, workspace-edit=10

## Taxonomy Coverage

Tasks With Taxonomy: 14
Tasks Without Taxonomy: 0
Scopes: multi-file=7, single-file=7
Tags: review-feedback=4, shared-logic=3, tool-use=2

## Task Results

| Task | Kind | Category | Status | Artifacts |
| --- | --- | --- | --- | --- |
| node-config-precedence | workspace-edit | debugging | passed | git-diff.patch, agent-stdout.txt, activity-summary.json |
| prompt-regression-triage-json | prompt-output | debugging | passed | agent-stdout.txt, activity-summary.json |
| tool-router-root-cause | tool-use | debugging | passed | agent-stdout.txt, activity-summary.json |
