# Gemini CLI Contributor Eval Report

Generated at: 2026-03-24T12:50:17.593Z
Tasks: 11
Passed: 0 (0.00%)
Failed: 7
Infra Failed: 4
Invalid Tasks: 0
Average Duration: 98734.27ms

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | 20260324-125017 |
| Mode | gemini-cli |
| Git Commit | 21f54ff |
| Gemini CLI Version | 0.32.1 |
| Model | Gemini CLI default |
| Approval Mode | yolo |
| Suites | gemini-core |
| Selected Task IDs | all tasks in selected suites |
| Environment | win32/x64; v20.19.0 |
| Working Directory | C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype |

## Run Configuration

Tasks Dir: C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks
Workspace Root: C:\Users\Giuseppe\AppData\Local\Temp\gcli-benchmark-workspaces
Keep Workspaces: no
Selected Suites: gemini-core
Gemini Binary: C:\nvm4w\nodejs\gemini.cmd
Model: Gemini CLI default

## Category Metrics

| Category | Passed / Total | Failed | Infra | Invalid | Pass Rate |
| --- | --- | --- | --- | --- | --- |
| code-review | 0/1 | 1 | 0 | 0 | 0.00% |
| debugging | 0/10 | 6 | 4 | 0 | 0.00% |

## Task Kind Coverage

Task Kinds: prompt-output=4, tool-use=5, workspace-edit=2

## Suite Coverage

Suites: gemini-core=11

## Taxonomy Coverage

Tasks With Taxonomy: 11
Tasks Without Taxonomy: 0
Scopes: multi-file=10, single-file=1
Tags: api-compat=2, artifact-triage=6, behavior-preservation=2, output-format=8, regression-reporting=2, repo-triage=3, review-feedback=1, strict-output=4, tool-use=5

## Efficiency Snapshot

Measured Tasks: 11
Average Agent Duration: 94772.36ms
Average Files Changed: 0.82
Average Changed Lines: 7.82
Total Insertions: 66
Total Deletions: 20

## Failure Breakdown

Reasons: agent-error=4, verification-failed=4, tool-expectation-failed=3
Suites: gemini-core=11
Task Kinds: tool-use=5, prompt-output=4, workspace-edit=2
Categories: debugging=10, code-review=1

## Regression Findings

- [high] Overall pass rate regressed. (baseline=1.0000, current=0.0000, delta=-1.0000)
- [medium] Task 'gemini-auth-refresh-review' regressed from passed to infra_failed. (baseline=passed, current=infra_failed)
- [medium] Task 'gemini-json-mode-regression-triage-json' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'gemini-models-json-compat' regressed from passed to infra_failed. (baseline=passed, current=infra_failed)
- [medium] Task 'gemini-output-regression-summary' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'gemini-repo-triage-json' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'gemini-repo-triage-owner-selection-json' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'gemini-tool-debug-workflow-command-choice' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'gemini-tool-first-inspection-root-cause' regressed from passed to infra_failed. (baseline=passed, current=infra_failed)
- [medium] Task 'gemini-tool-json-mode-log-order-root-cause' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'gemini-tool-json-mode-root-cause' regressed from passed to infra_failed. (baseline=passed, current=infra_failed)
- [medium] Task 'gemini-tool-output-routing-review' regressed from passed to failed. (baseline=passed, current=failed)

## Task Results

| Task | Suite | Kind | Category | Language | Taxonomy | Policy | Status | Failure Reason | First Failure | First Tool | Baseline | Harness ms | Agent ms | Files | Changed Lines | Artifacts | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| gemini-auth-refresh-review | gemini-core | workspace-edit | debugging | javascript | multi-file; behavior-preservation, repo-triage, api-compat | always | infra_failed | agent-error | - | run_shell_command -> dir /s /b /a-d | passed -> regressed | 127564 | 120441.00 | 2 | 25 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | Gemini CLI timed out after 120000ms |
| gemini-json-mode-regression-triage-json | gemini-core | prompt-output | debugging | text | multi-file; output-format, strict-output, regression-reporting | always | failed | verification-failed | node "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-json-mode-regression-triage-json/verify-json-output.js" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\reports\live-gemini-core\artifacts\20260324-125017\gemini-json-mode-regression-triage-json/agent-stdout.txt" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-json-mode-regression-triage-json/expected.json" | list_directory -> . | passed -> regressed | 37097 | 34596.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| gemini-models-json-compat | gemini-core | workspace-edit | debugging | javascript | multi-file; api-compat, output-format, behavior-preservation | always | infra_failed | agent-error | - | list_directory -> . | passed -> regressed | 125690 | 120464.00 | 1 | 2 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | Gemini CLI timed out after 120000ms |
| gemini-output-regression-summary | gemini-core | prompt-output | debugging | text | single-file; output-format, regression-reporting, strict-output | always | failed | verification-failed | node "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-output-regression-summary/verify-output.js" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\reports\live-gemini-core\artifacts\20260324-125017\gemini-output-regression-summary/agent-stdout.txt" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-output-regression-summary/expected.txt" | list_directory -> . | passed -> regressed | 67584 | 65612.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| gemini-repo-triage-json | gemini-core | prompt-output | debugging | text | multi-file; repo-triage, strict-output, artifact-triage | always | failed | verification-failed | node "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-repo-triage-json/verify-json-output.js" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\reports\live-gemini-core\artifacts\20260324-125017\gemini-repo-triage-json/agent-stdout.txt" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-repo-triage-json/expected.json" | list_directory -> . | passed -> regressed | 98792 | 95018.00 | 2 | 13 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| gemini-repo-triage-owner-selection-json | gemini-core | prompt-output | debugging | text | multi-file; repo-triage, strict-output, artifact-triage | always | failed | verification-failed | node "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-repo-triage-owner-selection-json/verify-json-output.js" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\reports\live-gemini-core\artifacts\20260324-125017\gemini-repo-triage-owner-selection-json/agent-stdout.txt" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-repo-triage-owner-selection-json/expected.json" | list_directory -> . | passed -> regressed | 59643 | 56856.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| gemini-tool-debug-workflow-command-choice | gemini-core | tool-use | debugging | text | multi-file; tool-use, artifact-triage, output-format | always | failed | tool-expectation-failed | node "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-tool-debug-workflow-command-choice/verify-output.js" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\reports\live-gemini-core\artifacts\20260324-125017\gemini-tool-debug-workflow-command-choice/agent-stdout.txt" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\reports\live-gemini-core\artifacts\20260324-125017\gemini-tool-debug-workflow-command-choice/activity-summary.json" | run_shell_command -> cat package.json | passed -> regressed | 101024 | 98025.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| gemini-tool-first-inspection-root-cause | gemini-core | tool-use | debugging | text | multi-file; tool-use, artifact-triage, output-format | always | infra_failed | agent-error | - | codebase_investigator | passed -> regressed | 124862 | 120499.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | Gemini CLI timed out after 120000ms |
| gemini-tool-json-mode-log-order-root-cause | gemini-core | tool-use | debugging | text | multi-file; tool-use, output-format, artifact-triage | always | failed | tool-expectation-failed | node "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-tool-json-mode-log-order-root-cause/verify-output.js" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\reports\live-gemini-core\artifacts\20260324-125017\gemini-tool-json-mode-log-order-root-cause/agent-stdout.txt" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\reports\live-gemini-core\artifacts\20260324-125017\gemini-tool-json-mode-log-order-root-cause/activity-summary.json" | list_directory -> . | passed -> regressed | 105166 | 102066.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| gemini-tool-json-mode-root-cause | gemini-core | tool-use | debugging | text | multi-file; tool-use, output-format, artifact-triage | always | infra_failed | agent-error | - | read_file -> package.json | passed -> regressed | 124527 | 120255.00 | 2 | 38 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | Gemini CLI timed out after 120000ms |
| gemini-tool-output-routing-review | gemini-core | tool-use | code-review | text | multi-file; tool-use, review-feedback, output-format | always | failed | tool-expectation-failed | node "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-tool-output-routing-review/verify-output.js" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\reports\live-gemini-core\artifacts\20260324-125017\gemini-tool-output-routing-review/agent-stdout.txt" | list_directory -> . | passed -> regressed | 114128 | 108664.00 | 2 | 8 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |

