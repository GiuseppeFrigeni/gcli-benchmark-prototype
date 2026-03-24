# Gemini CLI Contributor Eval Report

Generated at: 2026-03-21T09:00:00.000Z
Tasks: 32
Passed: 32 (100.00%)
Failed: 0
Infra Failed: 0
Invalid Tasks: 0
Average Duration: 2560.97ms

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | 20260321-090000 |
| Mode | gold-patch |
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
| code-review | 9/9 | 0 | 0 | 0 | 100.00% |
| debugging | 18/18 | 0 | 0 | 0 | 100.00% |
| new-feature | 2/2 | 0 | 0 | 0 | 100.00% |
| refactoring | 3/3 | 0 | 0 | 0 | 100.00% |

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
Average Agent Duration: 36.72ms
Average Files Changed: 0.50
Average Changed Lines: 2.88
Total Insertions: 62
Total Deletions: 30

## Failure Breakdown

Reasons: none
Suites: none
Task Kinds: none
Categories: none

## Regression Findings

No regressions detected.

## Task Results

| Task | Suite | Kind | Category | Language | Taxonomy | Policy | Status | Failure Reason | First Failure | First Tool | Baseline | Harness ms | Agent ms | Files | Changed Lines | Artifacts | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| eval-flaky-verifier-tighten-md | contributor-workflows | prompt-output | code-review | text | multi-file; review-feedback, strict-output, regression-reporting | always | passed | passed | - | - | new-task | 1747 | 5.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| eval-gap-inventory-json | contributor-workflows | prompt-output | debugging | text | multi-file; artifact-triage, strict-output, regression-reporting | always | passed | passed | - | - | new-task | 1668 | 4.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| gemini-auth-refresh-review | gemini-core | workspace-edit | debugging | javascript | multi-file; behavior-preservation, repo-triage, api-compat | always | passed | passed | - | - | new-task | 3243 | 104.00 | 2 | 11 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| gemini-flaky-eval-stabilization-json | contributor-workflows | prompt-output | debugging | text | multi-file; artifact-triage, strict-output, regression-reporting | always | passed | passed | - | - | new-task | 2029 | 3.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| gemini-json-mode-regression-triage-json | gemini-core | prompt-output | debugging | text | multi-file; output-format, strict-output, regression-reporting | always | passed | passed | - | - | new-task | 2570 | 22.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| gemini-maintainer-handoff-md | contributor-workflows | prompt-output | code-review | text | single-file; strict-output, review-feedback, regression-reporting | always | passed | passed | - | - | new-task | 2108 | 7.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| gemini-maintainer-repro-reply-md | contributor-workflows | prompt-output | code-review | text | multi-file; review-feedback, strict-output, regression-reporting | always | passed | passed | - | - | new-task | 2361 | 4.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| gemini-models-json-compat | gemini-core | workspace-edit | debugging | javascript | multi-file; api-compat, output-format, behavior-preservation | always | passed | passed | - | - | new-task | 3099 | 71.00 | 1 | 2 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| gemini-output-regression-summary | gemini-core | prompt-output | debugging | text | single-file; output-format, regression-reporting, strict-output | always | passed | passed | - | - | new-task | 1842 | 2.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| gemini-repo-triage-json | gemini-core | prompt-output | debugging | text | multi-file; repo-triage, strict-output, artifact-triage | always | passed | passed | - | - | new-task | 2397 | 4.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| gemini-repo-triage-owner-selection-json | gemini-core | prompt-output | debugging | text | multi-file; repo-triage, strict-output, artifact-triage | always | passed | passed | - | - | new-task | 1781 | 6.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| gemini-tool-debug-trace-repro-workflow | contributor-workflows | tool-use | debugging | text | multi-file; tool-use, artifact-triage, regression-reporting | always | passed | passed | - | run_shell_command -> node print-trace.js | new-task | 2266 | 6.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| gemini-tool-debug-workflow-command-choice | gemini-core | tool-use | debugging | text | multi-file; tool-use, artifact-triage, output-format | always | passed | passed | - | run_shell_command -> node --test test/repro-json.test.js | new-task | 2299 | 4.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| gemini-tool-first-inspection-root-cause | gemini-core | tool-use | debugging | text | multi-file; tool-use, artifact-triage, output-format | always | passed | passed | - | read_file -> test/run-json-output.test.js | new-task | 2439 | 7.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| gemini-tool-json-mode-log-order-root-cause | gemini-core | tool-use | debugging | text | multi-file; tool-use, output-format, artifact-triage | always | passed | passed | - | read_file -> fixtures/run-json-output.txt | new-task | 1913 | 7.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| gemini-tool-json-mode-root-cause | gemini-core | tool-use | debugging | text | multi-file; tool-use, output-format, artifact-triage | always | passed | passed | - | read_file -> src/commands/render.js | new-task | 2220 | 5.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| gemini-tool-maintainer-regression-handoff | contributor-workflows | tool-use | code-review | text | multi-file; tool-use, review-feedback, regression-reporting | always | passed | passed | - | read_file -> fixtures/run-report.md | new-task | 2278 | 6.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| gemini-tool-output-routing-review | gemini-core | tool-use | code-review | text | multi-file; tool-use, review-feedback, output-format | always | passed | passed | - | read_file -> test/models-json.test.js | new-task | 2689 | 19.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| node-cache-key-review | harness-calibration | workspace-edit | code-review | javascript | single-file; ordering, output-format, review-feedback | always | passed | passed | - | - | new-task | 4308 | 102.00 | 1 | 4 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| node-cli-category-filter | harness-calibration | workspace-edit | new-feature | javascript | multi-file; api-compat, output-format, filtering | always | passed | passed | - | - | new-task | 3077 | 86.00 | 2 | 10 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| node-cli-json-output | harness-calibration | workspace-edit | new-feature | javascript | single-file; api-compat, output-format | always | passed | passed | - | - | new-task | 2913 | 87.00 | 1 | 10 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| node-config-precedence | harness-calibration | workspace-edit | debugging | javascript | single-file; behavior-preservation, config-precedence | always | passed | passed | - | - | new-task | 3275 | 88.00 | 1 | 6 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| node-config-short-flags | harness-calibration | workspace-edit | debugging | javascript | multi-file; api-compat, config-precedence, flag-parsing | always | passed | passed | - | - | new-task | 3122 | 87.00 | 2 | 8 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| node-header-merge-review | harness-calibration | workspace-edit | code-review | javascript | single-file; behavior-preservation, non-mutating-change, review-feedback | always | passed | passed | - | - | new-task | 2703 | 72.00 | 1 | 2 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| node-keyword-normalizer-refactor | harness-calibration | workspace-edit | refactoring | javascript | single-file; api-compat, shared-logic | always | passed | passed | - | - | new-task | 3091 | 81.00 | 1 | 10 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| node-router-path-normalization | harness-calibration | workspace-edit | debugging | javascript | single-file; behavior-preservation, path-normalization | always | passed | passed | - | - | new-task | 3036 | 79.00 | 1 | 2 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| node-slug-shared-normalizer | harness-calibration | workspace-edit | refactoring | javascript | single-file; behavior-preservation, shared-logic | always | passed | passed | - | - | new-task | 3162 | 78.00 | 1 | 10 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| node-summary-tag-normalizer | harness-calibration | workspace-edit | refactoring | javascript | multi-file; shared-logic, behavior-preservation, api-compat | always | passed | passed | - | - | new-task | 4247 | 98.00 | 2 | 17 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| prompt-regression-triage-json | contributor-workflows | prompt-output | debugging | text | multi-file; artifact-triage, strict-output, regression-reporting | always | passed | passed | - | - | new-task | 2013 | 4.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| prompt-review-findings-markdown | contributor-workflows | prompt-output | code-review | text | multi-file; review-feedback, strict-output, artifact-triage | always | passed | passed | - | - | new-task | 1980 | 3.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| tool-regression-review | contributor-workflows | tool-use | code-review | text | multi-file; tool-use, review-feedback, artifact-triage | always | passed | passed | - | read_file -> fixtures/git-diff.patch | new-task | 1936 | 21.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| tool-router-root-cause | harness-calibration | tool-use | debugging | text | multi-file; tool-use, artifact-triage, path-normalization | always | passed | passed | - | read_file -> src/router.js | new-task | 2139 | 3.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |

