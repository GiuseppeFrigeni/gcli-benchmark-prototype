# Gemini CLI Contributor Eval Report

Generated at: 2026-03-24T13:18:41.173Z
Tasks: 10
Passed: 0 (0.00%)
Failed: 6
Infra Failed: 4
Invalid Tasks: 0
Average Duration: 84955.30ms

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | 20260324-131841 |
| Mode | gemini-cli |
| Git Commit | 21f54ff |
| Gemini CLI Version | 0.32.1 |
| Model | Gemini CLI default |
| Approval Mode | yolo |
| Suites | contributor-workflows |
| Selected Task IDs | all tasks in selected suites |
| Environment | win32/x64; v20.19.0 |
| Working Directory | C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype |

## Run Configuration

Tasks Dir: C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks
Workspace Root: C:\Users\Giuseppe\AppData\Local\Temp\gcli-benchmark-workspaces
Keep Workspaces: no
Selected Suites: contributor-workflows
Gemini Binary: C:\nvm4w\nodejs\gemini.cmd
Model: Gemini CLI default

## Category Metrics

| Category | Passed / Total | Failed | Infra | Invalid | Pass Rate |
| --- | --- | --- | --- | --- | --- |
| code-review | 0/6 | 3 | 3 | 0 | 0.00% |
| debugging | 0/4 | 3 | 1 | 0 | 0.00% |

## Task Kind Coverage

Task Kinds: prompt-output=7, tool-use=3

## Suite Coverage

Suites: contributor-workflows=10

## Taxonomy Coverage

Tasks With Taxonomy: 10
Tasks Without Taxonomy: 0
Scopes: multi-file=9, single-file=1
Tags: artifact-triage=6, regression-reporting=8, review-feedback=6, strict-output=7, tool-use=3

## Efficiency Snapshot

Measured Tasks: 10
Average Agent Duration: 81335.00ms
Average Files Changed: 0.00
Average Changed Lines: 0.00
Total Insertions: 0
Total Deletions: 0

## Failure Breakdown

Reasons: verification-failed=5, agent-error=4, tool-expectation-failed=1
Suites: contributor-workflows=10
Task Kinds: prompt-output=7, tool-use=3
Categories: code-review=6, debugging=4

## Regression Findings

- [high] Overall pass rate regressed. (baseline=1.0000, current=0.0000, delta=-1.0000)
- [medium] Task 'eval-flaky-verifier-tighten-md' regressed from passed to infra_failed. (baseline=passed, current=infra_failed)
- [medium] Task 'eval-gap-inventory-json' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'gemini-flaky-eval-stabilization-json' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'gemini-maintainer-handoff-md' regressed from passed to infra_failed. (baseline=passed, current=infra_failed)
- [medium] Task 'gemini-maintainer-repro-reply-md' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'gemini-tool-debug-trace-repro-workflow' regressed from passed to infra_failed. (baseline=passed, current=infra_failed)
- [medium] Task 'gemini-tool-maintainer-regression-handoff' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'prompt-regression-triage-json' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'prompt-review-findings-markdown' regressed from passed to infra_failed. (baseline=passed, current=infra_failed)
- [medium] Task 'tool-regression-review' regressed from passed to failed. (baseline=passed, current=failed)

## Task Results

| Task | Suite | Kind | Category | Language | Taxonomy | Policy | Status | Failure Reason | First Failure | First Tool | Baseline | Harness ms | Agent ms | Files | Changed Lines | Artifacts | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| eval-flaky-verifier-tighten-md | contributor-workflows | prompt-output | code-review | text | multi-file; review-feedback, strict-output, regression-reporting | always | infra_failed | agent-error | - | list_directory -> . | passed -> regressed | 126646 | 120296.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | Gemini CLI timed out after 120000ms |
| eval-gap-inventory-json | contributor-workflows | prompt-output | debugging | text | multi-file; artifact-triage, strict-output, regression-reporting | always | failed | verification-failed | node "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\eval-gap-inventory-json/verify-json-output.js" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\reports\live-contributor-workflows\artifacts\20260324-131841\eval-gap-inventory-json/agent-stdout.txt" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\eval-gap-inventory-json/expected.json" | list_directory -> . | passed -> regressed | 49183 | 46122.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| gemini-flaky-eval-stabilization-json | contributor-workflows | prompt-output | debugging | text | multi-file; artifact-triage, strict-output, regression-reporting | always | failed | verification-failed | node "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-flaky-eval-stabilization-json/verify-json-output.js" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\reports\live-contributor-workflows\artifacts\20260324-131841\gemini-flaky-eval-stabilization-json/agent-stdout.txt" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-flaky-eval-stabilization-json/expected.json" | list_directory -> . | passed -> regressed | 45083 | 42286.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| gemini-maintainer-handoff-md | contributor-workflows | prompt-output | code-review | text | single-file; strict-output, review-feedback, regression-reporting | always | infra_failed | agent-error | - | list_directory -> . | passed -> regressed | 125057 | 120203.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | Gemini CLI timed out after 120000ms |
| gemini-maintainer-repro-reply-md | contributor-workflows | prompt-output | code-review | text | multi-file; review-feedback, strict-output, regression-reporting | always | failed | verification-failed | node "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-maintainer-repro-reply-md/verify-output.js" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\reports\live-contributor-workflows\artifacts\20260324-131841\gemini-maintainer-repro-reply-md/agent-stdout.txt" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-maintainer-repro-reply-md/expected.md" | list_directory -> . | passed -> regressed | 50111 | 47767.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| gemini-tool-debug-trace-repro-workflow | contributor-workflows | tool-use | debugging | text | multi-file; tool-use, artifact-triage, regression-reporting | always | infra_failed | agent-error | - | list_directory -> . | passed -> regressed | 126445 | 120263.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | Gemini CLI timed out after 120000ms |
| gemini-tool-maintainer-regression-handoff | contributor-workflows | tool-use | code-review | text | multi-file; tool-use, review-feedback, regression-reporting | always | failed | tool-expectation-failed | node "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-tool-maintainer-regression-handoff/verify-output.js" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\reports\live-contributor-workflows\artifacts\20260324-131841\gemini-tool-maintainer-regression-handoff/agent-stdout.txt" | list_directory -> . | passed -> regressed | 77467 | 75343.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| prompt-regression-triage-json | contributor-workflows | prompt-output | debugging | text | multi-file; artifact-triage, strict-output, regression-reporting | always | failed | verification-failed | node "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\prompt-regression-triage-json/verify-json-output.js" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\reports\live-contributor-workflows\artifacts\20260324-131841\prompt-regression-triage-json/agent-stdout.txt" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\prompt-regression-triage-json/expected.json" | list_directory -> . | passed -> regressed | 97738 | 94910.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| prompt-review-findings-markdown | contributor-workflows | prompt-output | code-review | text | multi-file; review-feedback, strict-output, artifact-triage | always | infra_failed | agent-error | - | list_directory -> . | passed -> regressed | 124196 | 120168.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | Gemini CLI timed out after 120000ms |
| tool-regression-review | contributor-workflows | tool-use | code-review | text | multi-file; tool-use, review-feedback, artifact-triage | always | failed | verification-failed | node "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\tool-regression-review/verify-review-investigation.js" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\reports\live-contributor-workflows\artifacts\20260324-131841\tool-regression-review/agent-stdout.txt" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\reports\live-contributor-workflows\artifacts\20260324-131841\tool-regression-review/activity-summary.json" | - | passed -> regressed | 27627 | 25992.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |

