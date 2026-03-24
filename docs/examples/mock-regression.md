# Gemini CLI Contributor Eval Report

Generated at: 2026-03-21T09:10:00.000Z
Tasks: 32
Passed: 0 (0.00%)
Failed: 32
Infra Failed: 0
Invalid Tasks: 0
Average Duration: 2547.66ms

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | 20260321-091000 |
| Mode | noop |
| Git Commit | 21f54ff |
| Gemini CLI Version | n/a |
| Model | n/a |
| Approval Mode | n/a |
| Suites | contributor-workflows, gemini-core, harness-calibration |
| Selected Task IDs | all tasks in selected suites |
| Environment | win32/x64; v20.19.0 |
| Working Directory | C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype |

## Run Configuration

Tasks Dir: C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks
Workspace Root: C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\docs\.tmp-examples\workspaces
Keep Workspaces: no

## Category Metrics

| Category | Passed / Total | Failed | Infra | Invalid | Pass Rate |
| --- | --- | --- | --- | --- | --- |
| code-review | 0/9 | 9 | 0 | 0 | 0.00% |
| debugging | 0/18 | 18 | 0 | 0 | 0.00% |
| new-feature | 0/2 | 2 | 0 | 0 | 0.00% |
| refactoring | 0/3 | 3 | 0 | 0 | 0.00% |

## Task Kind Coverage

Task Kinds: prompt-output=11, tool-use=9, workspace-edit=12

## Suite Coverage

Suites: contributor-workflows=10, gemini-core=11, harness-calibration=11

## Taxonomy Coverage

Tasks With Taxonomy: 32
Tasks Without Taxonomy: 0
Scopes: multi-file=23, single-file=9
Tags: api-compat=7, artifact-triage=13, behavior-preservation=7, config-precedence=2, filtering=1, flag-parsing=1, non-mutating-change=1, ordering=1, output-format=11, path-normalization=2, regression-reporting=10, repo-triage=3, review-feedback=9, shared-logic=3, strict-output=11, tool-use=9

## Efficiency Snapshot

Measured Tasks: 32
Average Agent Duration: 4.88ms
Average Files Changed: 0.00
Average Changed Lines: 0.00
Total Insertions: 0
Total Deletions: 0

## Failure Breakdown

Reasons: verification-failed=26, tool-expectation-failed=6
Suites: gemini-core=11, harness-calibration=11, contributor-workflows=10
Task Kinds: workspace-edit=12, prompt-output=11, tool-use=9
Categories: debugging=18, code-review=9, refactoring=3, new-feature=2

## Regression Findings

- [high] Overall pass rate regressed. (baseline=1.0000, current=0.0000, delta=-1.0000)
- [medium] Task 'eval-flaky-verifier-tighten-md' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'eval-gap-inventory-json' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'gemini-auth-refresh-review' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'gemini-flaky-eval-stabilization-json' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'gemini-json-mode-regression-triage-json' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'gemini-maintainer-handoff-md' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'gemini-maintainer-repro-reply-md' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'gemini-models-json-compat' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'gemini-output-regression-summary' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'gemini-repo-triage-json' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'gemini-repo-triage-owner-selection-json' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'gemini-tool-debug-trace-repro-workflow' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'gemini-tool-debug-workflow-command-choice' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'gemini-tool-first-inspection-root-cause' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'gemini-tool-json-mode-log-order-root-cause' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'gemini-tool-json-mode-root-cause' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'gemini-tool-maintainer-regression-handoff' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'gemini-tool-output-routing-review' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'node-cache-key-review' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'node-cli-category-filter' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'node-cli-json-output' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'node-config-precedence' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'node-config-short-flags' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'node-header-merge-review' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'node-keyword-normalizer-refactor' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'node-router-path-normalization' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'node-slug-shared-normalizer' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'node-summary-tag-normalizer' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'prompt-regression-triage-json' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'prompt-review-findings-markdown' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'tool-regression-review' regressed from passed to failed. (baseline=passed, current=failed)
- [medium] Task 'tool-router-root-cause' regressed from passed to failed. (baseline=passed, current=failed)

## Task Results

| Task | Suite | Kind | Category | Language | Taxonomy | Policy | Status | Failure Reason | First Failure | First Tool | Baseline | Harness ms | Agent ms | Files | Changed Lines | Artifacts | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| eval-flaky-verifier-tighten-md | contributor-workflows | prompt-output | code-review | text | multi-file; review-feedback, strict-output, regression-reporting | always | failed | verification-failed | node "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\eval-flaky-verifier-tighten-md/verify-output.js" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\docs\.tmp-examples\regression\artifacts\20260321-091000\eval-flaky-verifier-tighten-md/agent-stdout.txt" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\eval-flaky-verifier-tighten-md/expected.md" | - | passed -> regressed | 2207 | 4.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| eval-gap-inventory-json | contributor-workflows | prompt-output | debugging | text | multi-file; artifact-triage, strict-output, regression-reporting | always | failed | verification-failed | node "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\eval-gap-inventory-json/verify-json-output.js" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\docs\.tmp-examples\regression\artifacts\20260321-091000\eval-gap-inventory-json/agent-stdout.txt" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\eval-gap-inventory-json/expected.json" | - | passed -> regressed | 1933 | 6.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| gemini-auth-refresh-review | gemini-core | workspace-edit | debugging | javascript | multi-file; behavior-preservation, repo-triage, api-compat | always | failed | verification-failed | node --test test/login-refresh-fallback.test.js | - | passed -> regressed | 2908 | 3.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| gemini-flaky-eval-stabilization-json | contributor-workflows | prompt-output | debugging | text | multi-file; artifact-triage, strict-output, regression-reporting | always | failed | verification-failed | node "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-flaky-eval-stabilization-json/verify-json-output.js" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\docs\.tmp-examples\regression\artifacts\20260321-091000\gemini-flaky-eval-stabilization-json/agent-stdout.txt" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-flaky-eval-stabilization-json/expected.json" | - | passed -> regressed | 1806 | 5.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| gemini-json-mode-regression-triage-json | gemini-core | prompt-output | debugging | text | multi-file; output-format, strict-output, regression-reporting | always | failed | verification-failed | node "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-json-mode-regression-triage-json/verify-json-output.js" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\docs\.tmp-examples\regression\artifacts\20260321-091000\gemini-json-mode-regression-triage-json/agent-stdout.txt" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-json-mode-regression-triage-json/expected.json" | - | passed -> regressed | 1911 | 5.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| gemini-maintainer-handoff-md | contributor-workflows | prompt-output | code-review | text | single-file; strict-output, review-feedback, regression-reporting | always | failed | verification-failed | node "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-maintainer-handoff-md/verify-output.js" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\docs\.tmp-examples\regression\artifacts\20260321-091000\gemini-maintainer-handoff-md/agent-stdout.txt" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-maintainer-handoff-md/expected.md" | - | passed -> regressed | 1921 | 4.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| gemini-maintainer-repro-reply-md | contributor-workflows | prompt-output | code-review | text | multi-file; review-feedback, strict-output, regression-reporting | always | failed | verification-failed | node "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-maintainer-repro-reply-md/verify-output.js" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\docs\.tmp-examples\regression\artifacts\20260321-091000\gemini-maintainer-repro-reply-md/agent-stdout.txt" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-maintainer-repro-reply-md/expected.md" | - | passed -> regressed | 1861 | 2.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| gemini-models-json-compat | gemini-core | workspace-edit | debugging | javascript | multi-file; api-compat, output-format, behavior-preservation | always | failed | verification-failed | node --test test/json-mode.test.js | - | passed -> regressed | 3120 | 5.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| gemini-output-regression-summary | gemini-core | prompt-output | debugging | text | single-file; output-format, regression-reporting, strict-output | always | failed | verification-failed | node "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-output-regression-summary/verify-output.js" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\docs\.tmp-examples\regression\artifacts\20260321-091000\gemini-output-regression-summary/agent-stdout.txt" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-output-regression-summary/expected.txt" | - | passed -> regressed | 2450 | 4.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| gemini-repo-triage-json | gemini-core | prompt-output | debugging | text | multi-file; repo-triage, strict-output, artifact-triage | always | failed | verification-failed | node "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-repo-triage-json/verify-json-output.js" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\docs\.tmp-examples\regression\artifacts\20260321-091000\gemini-repo-triage-json/agent-stdout.txt" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-repo-triage-json/expected.json" | - | passed -> regressed | 2639 | 3.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| gemini-repo-triage-owner-selection-json | gemini-core | prompt-output | debugging | text | multi-file; repo-triage, strict-output, artifact-triage | always | failed | verification-failed | node "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-repo-triage-owner-selection-json/verify-json-output.js" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\docs\.tmp-examples\regression\artifacts\20260321-091000\gemini-repo-triage-owner-selection-json/agent-stdout.txt" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-repo-triage-owner-selection-json/expected.json" | - | passed -> regressed | 1814 | 4.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| gemini-tool-debug-trace-repro-workflow | contributor-workflows | tool-use | debugging | text | multi-file; tool-use, artifact-triage, regression-reporting | always | failed | tool-expectation-failed | node "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-tool-debug-trace-repro-workflow/verify-output.js" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\docs\.tmp-examples\regression\artifacts\20260321-091000\gemini-tool-debug-trace-repro-workflow/agent-stdout.txt" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\docs\.tmp-examples\regression\artifacts\20260321-091000\gemini-tool-debug-trace-repro-workflow/activity-summary.json" | - | passed -> regressed | 2287 | 4.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| gemini-tool-debug-workflow-command-choice | gemini-core | tool-use | debugging | text | multi-file; tool-use, artifact-triage, output-format | always | failed | tool-expectation-failed | node "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-tool-debug-workflow-command-choice/verify-output.js" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\docs\.tmp-examples\regression\artifacts\20260321-091000\gemini-tool-debug-workflow-command-choice/agent-stdout.txt" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\docs\.tmp-examples\regression\artifacts\20260321-091000\gemini-tool-debug-workflow-command-choice/activity-summary.json" | - | passed -> regressed | 2225 | 2.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| gemini-tool-first-inspection-root-cause | gemini-core | tool-use | debugging | text | multi-file; tool-use, artifact-triage, output-format | always | failed | tool-expectation-failed | node "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-tool-first-inspection-root-cause/verify-investigation.js" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\docs\.tmp-examples\regression\artifacts\20260321-091000\gemini-tool-first-inspection-root-cause/agent-stdout.txt" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\docs\.tmp-examples\regression\artifacts\20260321-091000\gemini-tool-first-inspection-root-cause/activity-summary.json" | - | passed -> regressed | 2427 | 8.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| gemini-tool-json-mode-log-order-root-cause | gemini-core | tool-use | debugging | text | multi-file; tool-use, output-format, artifact-triage | always | failed | tool-expectation-failed | node "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-tool-json-mode-log-order-root-cause/verify-output.js" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\docs\.tmp-examples\regression\artifacts\20260321-091000\gemini-tool-json-mode-log-order-root-cause/agent-stdout.txt" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\docs\.tmp-examples\regression\artifacts\20260321-091000\gemini-tool-json-mode-log-order-root-cause/activity-summary.json" | - | passed -> regressed | 1691 | 2.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| gemini-tool-json-mode-root-cause | gemini-core | tool-use | debugging | text | multi-file; tool-use, output-format, artifact-triage | always | failed | verification-failed | node "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-tool-json-mode-root-cause/verify-investigation.js" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\docs\.tmp-examples\regression\artifacts\20260321-091000\gemini-tool-json-mode-root-cause/agent-stdout.txt" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\docs\.tmp-examples\regression\artifacts\20260321-091000\gemini-tool-json-mode-root-cause/activity-summary.json" | - | passed -> regressed | 2266 | 2.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| gemini-tool-maintainer-regression-handoff | contributor-workflows | tool-use | code-review | text | multi-file; tool-use, review-feedback, regression-reporting | always | failed | tool-expectation-failed | node "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-tool-maintainer-regression-handoff/verify-output.js" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\docs\.tmp-examples\regression\artifacts\20260321-091000\gemini-tool-maintainer-regression-handoff/agent-stdout.txt" | - | passed -> regressed | 1780 | 6.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| gemini-tool-output-routing-review | gemini-core | tool-use | code-review | text | multi-file; tool-use, review-feedback, output-format | always | failed | tool-expectation-failed | node "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\gemini-tool-output-routing-review/verify-output.js" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\docs\.tmp-examples\regression\artifacts\20260321-091000\gemini-tool-output-routing-review/agent-stdout.txt" | - | passed -> regressed | 2516 | 5.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| node-cache-key-review | harness-calibration | workspace-edit | code-review | javascript | single-file; ordering, output-format, review-feedback | always | failed | verification-failed | node --test test/stable-param-order.test.js | - | passed -> regressed | 3027 | 6.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| node-cli-category-filter | harness-calibration | workspace-edit | new-feature | javascript | multi-file; api-compat, output-format, filtering | always | failed | verification-failed | node --test test/category-filter.test.js | - | passed -> regressed | 2991 | 5.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| node-cli-json-output | harness-calibration | workspace-edit | new-feature | javascript | single-file; api-compat, output-format | always | failed | verification-failed | node --test test/json-output.test.js | - | passed -> regressed | 3229 | 13.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| node-config-precedence | harness-calibration | workspace-edit | debugging | javascript | single-file; behavior-preservation, config-precedence | always | failed | verification-failed | node --test test/config-cli-precedence.test.js | - | passed -> regressed | 3256 | 6.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| node-config-short-flags | harness-calibration | workspace-edit | debugging | javascript | multi-file; api-compat, config-precedence, flag-parsing | always | failed | verification-failed | node --test test/short-flags.test.js | - | passed -> regressed | 3045 | 5.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| node-header-merge-review | harness-calibration | workspace-edit | code-review | javascript | single-file; behavior-preservation, non-mutating-change, review-feedback | always | failed | verification-failed | node --test test/non-mutating-merge.test.js | - | passed -> regressed | 2901 | 6.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| node-keyword-normalizer-refactor | harness-calibration | workspace-edit | refactoring | javascript | single-file; api-compat, shared-logic | always | failed | verification-failed | node --test test/parse-keywords.test.js | - | passed -> regressed | 3070 | 7.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| node-router-path-normalization | harness-calibration | workspace-edit | debugging | javascript | single-file; behavior-preservation, path-normalization | always | failed | verification-failed | node --test test/trailing-slash.test.js | - | passed -> regressed | 3571 | 3.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| node-slug-shared-normalizer | harness-calibration | workspace-edit | refactoring | javascript | single-file; behavior-preservation, shared-logic | always | failed | verification-failed | node --test test/article-path-trimming.test.js | - | passed -> regressed | 3279 | 8.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| node-summary-tag-normalizer | harness-calibration | workspace-edit | refactoring | javascript | multi-file; shared-logic, behavior-preservation, api-compat | always | failed | verification-failed | node --test test/list-tags.test.js | - | passed -> regressed | 3274 | 6.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| prompt-regression-triage-json | contributor-workflows | prompt-output | debugging | text | multi-file; artifact-triage, strict-output, regression-reporting | always | failed | verification-failed | node "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\prompt-regression-triage-json/verify-json-output.js" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\docs\.tmp-examples\regression\artifacts\20260321-091000\prompt-regression-triage-json/agent-stdout.txt" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\prompt-regression-triage-json/expected.json" | - | passed -> regressed | 2097 | 6.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| prompt-review-findings-markdown | contributor-workflows | prompt-output | code-review | text | multi-file; review-feedback, strict-output, artifact-triage | always | failed | verification-failed | node "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\prompt-review-findings-markdown/verify-review-output.js" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\docs\.tmp-examples\regression\artifacts\20260321-091000\prompt-review-findings-markdown/agent-stdout.txt" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\prompt-review-findings-markdown/expected-review.md" | - | passed -> regressed | 2329 | 5.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| tool-regression-review | contributor-workflows | tool-use | code-review | text | multi-file; tool-use, review-feedback, artifact-triage | always | failed | verification-failed | node "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\tool-regression-review/verify-review-investigation.js" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\docs\.tmp-examples\regression\artifacts\20260321-091000\tool-regression-review/agent-stdout.txt" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\docs\.tmp-examples\regression\artifacts\20260321-091000\tool-regression-review/activity-summary.json" | - | passed -> regressed | 2856 | 3.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |
| tool-router-root-cause | harness-calibration | tool-use | debugging | text | multi-file; tool-use, artifact-triage, path-normalization | always | failed | verification-failed | node "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks\tool-router-root-cause/verify-investigation.js" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\docs\.tmp-examples\regression\artifacts\20260321-091000\tool-router-root-cause/agent-stdout.txt" "C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\docs\.tmp-examples\regression\artifacts\20260321-091000\tool-router-root-cause/activity-summary.json" | - | passed -> regressed | 2838 | 3.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | One or more verification commands failed after the agent run. |

