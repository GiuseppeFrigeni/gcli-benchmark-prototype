# Gemini CLI Contributor Eval Report

Generated at: 2026-03-24T18:23:25.182Z
Tasks: 1
Passed: 0 (0.00%)
Failed: 0
Infra Failed: 1
Invalid Tasks: 0
Average Duration: 125487.00ms

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | 20260324-182325 |
| Mode | gemini-cli |
| Git Commit | 2f8d363 |
| Gemini CLI Version | 0.32.1 |
| Model | Gemini CLI default |
| Approval Mode | yolo |
| Suites | gemini-core |
| Selected Task IDs | gemini-tool-output-routing-review |
| Environment | win32/x64; v20.19.0 |
| Working Directory | C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype |

## Run Configuration

Tasks Dir: C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks
Workspace Root: C:\Users\Giuseppe\AppData\Local\Temp\gcli-benchmark-workspaces
Keep Workspaces: no
Selected Tasks: gemini-tool-output-routing-review
Gemini Binary: C:\nvm4w\nodejs\gemini.cmd
Model: Gemini CLI default

## Category Metrics

| Category | Passed / Total | Failed | Infra | Invalid | Pass Rate |
| --- | --- | --- | --- | --- | --- |
| code-review | 0/1 | 0 | 1 | 0 | 0.00% |

## Task Kind Coverage

Task Kinds: tool-use=1

## Suite Coverage

Suites: gemini-core=1

## Taxonomy Coverage

Tasks With Taxonomy: 1
Tasks Without Taxonomy: 0
Scopes: multi-file=1
Tags: output-format=1, review-feedback=1, tool-use=1

## Efficiency Snapshot

Measured Tasks: 1
Average Agent Duration: 120639.00ms
Average Files Changed: 2.00
Average Changed Lines: 8.00
Total Insertions: 6
Total Deletions: 2

## Failure Breakdown

Reasons: agent-error=1
Suites: gemini-core=1
Task Kinds: tool-use=1
Categories: code-review=1

## Regression Findings

- [high] Overall pass rate regressed. (baseline=1.0000, current=0.0000, delta=-1.0000)
- [medium] Task 'gemini-tool-output-routing-review' regressed from passed to infra_failed. (baseline=passed, current=infra_failed)

## Task Results

| Task | Suite | Kind | Category | Language | Taxonomy | Policy | Status | Failure Reason | First Failure | First Tool | Baseline | Harness ms | Agent ms | Files | Changed Lines | Artifacts | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| gemini-tool-output-routing-review | gemini-core | tool-use | code-review | text | multi-file; tool-use, review-feedback, output-format | always | infra_failed | agent-error | - | read_file -> package.json | passed -> regressed | 125487 | 120639.00 | 2 | 8 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | Gemini CLI timed out after 120000ms |

