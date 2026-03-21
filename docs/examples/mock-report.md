# Gemini CLI Contributor Eval Report

Generated at: 2026-03-21T09:00:00.000Z
Tasks: 26
Passed: 26 (100.00%)
Failed: 0
Infra Failed: 0
Invalid Tasks: 0
Average Duration: 1995.08ms

## Run Configuration

Mode: gold-patch
Tasks Dir: C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\tasks
Workspace Root: C:\Users\Giuseppe\Documents\GitHub\gcli-benchmark-prototype\docs\.tmp-examples\workspaces
Keep Workspaces: no

## Category Metrics

| Category | Passed / Total | Failed | Infra | Invalid | Pass Rate |
| --- | --- | --- | --- | --- | --- |
| code-review | 8/8 | 0 | 0 | 0 | 100.00% |
| debugging | 13/13 | 0 | 0 | 0 | 100.00% |
| new-feature | 2/2 | 0 | 0 | 0 | 100.00% |
| refactoring | 3/3 | 0 | 0 | 0 | 100.00% |

## Task Kind Coverage

Task Kinds: prompt-output=7, tool-use=7, workspace-edit=12

## Taxonomy Coverage

Tasks With Taxonomy: 26
Tasks Without Taxonomy: 0
Scopes: multi-file=17, single-file=9
Tags: api-compat=7, artifact-triage=9, behavior-preservation=7, config-precedence=2, filtering=1, flag-parsing=1, non-mutating-change=1, ordering=1, output-format=9, path-normalization=2, regression-reporting=6, repo-triage=2, review-feedback=8, shared-logic=3, strict-output=7, tool-use=7

## Efficiency Snapshot

Measured Tasks: 26
Average Agent Duration: 31.69ms
Average Files Changed: 0.62
Average Changed Lines: 3.54
Total Insertions: 62
Total Deletions: 30

## Failure Breakdown

Reasons: none
Task Kinds: none
Categories: none

## Regression Findings

No regressions detected.

## Task Results

| Task | Kind | Category | Language | Taxonomy | Policy | Status | Failure Reason | First Failure | First Tool | Baseline | Harness ms | Agent ms | Files | Changed Lines | Artifacts | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| eval-flaky-verifier-tighten-md | prompt-output | code-review | text | multi-file; review-feedback, strict-output, regression-reporting | always | passed | passed | - | - | new-task | 1674 | 3.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| eval-gap-inventory-json | prompt-output | debugging | text | multi-file; artifact-triage, strict-output, regression-reporting | always | passed | passed | - | - | new-task | 1632 | 3.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| gemini-auth-refresh-review | workspace-edit | debugging | javascript | multi-file; behavior-preservation, repo-triage, api-compat | always | passed | passed | - | - | new-task | 2534 | 61.00 | 2 | 11 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| gemini-maintainer-handoff-md | prompt-output | code-review | text | single-file; strict-output, review-feedback, regression-reporting | always | passed | passed | - | - | new-task | 1509 | 6.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| gemini-models-json-compat | workspace-edit | debugging | javascript | multi-file; api-compat, output-format, behavior-preservation | always | passed | passed | - | - | new-task | 2277 | 54.00 | 1 | 2 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| gemini-output-regression-summary | prompt-output | debugging | text | single-file; output-format, regression-reporting, strict-output | always | passed | passed | - | - | new-task | 1350 | 3.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| gemini-repo-triage-json | prompt-output | debugging | text | multi-file; repo-triage, strict-output, artifact-triage | always | passed | passed | - | - | new-task | 1902 | 3.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| gemini-tool-debug-workflow-command-choice | tool-use | debugging | text | multi-file; tool-use, artifact-triage, output-format | always | passed | passed | - | run_shell_command -> node --test test/repro-json.test.js | new-task | 1837 | 7.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| gemini-tool-first-inspection-root-cause | tool-use | debugging | text | multi-file; tool-use, artifact-triage, output-format | always | passed | passed | - | read_file -> test/run-json-output.test.js | new-task | 2085 | 3.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| gemini-tool-json-mode-root-cause | tool-use | debugging | text | multi-file; tool-use, output-format, artifact-triage | always | passed | passed | - | read_file -> src/commands/render.js | new-task | 1717 | 4.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| gemini-tool-maintainer-regression-handoff | tool-use | code-review | text | multi-file; tool-use, review-feedback, regression-reporting | always | passed | passed | - | read_file -> fixtures/run-report.md | new-task | 1333 | 5.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| gemini-tool-output-routing-review | tool-use | code-review | text | multi-file; tool-use, review-feedback, output-format | always | passed | passed | - | read_file -> test/models-json.test.js | new-task | 3099 | 3.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| node-cache-key-review | workspace-edit | code-review | javascript | single-file; ordering, output-format, review-feedback | always | passed | passed | - | - | new-task | 2080 | 63.00 | 1 | 4 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| node-cli-category-filter | workspace-edit | new-feature | javascript | multi-file; api-compat, output-format, filtering | always | passed | passed | - | - | new-task | 2357 | 61.00 | 2 | 10 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| node-cli-json-output | workspace-edit | new-feature | javascript | single-file; api-compat, output-format | always | passed | passed | - | - | new-task | 2212 | 52.00 | 1 | 10 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| node-config-precedence | workspace-edit | debugging | javascript | single-file; behavior-preservation, config-precedence | always | passed | passed | - | - | new-task | 2292 | 58.00 | 1 | 6 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| node-config-short-flags | workspace-edit | debugging | javascript | multi-file; api-compat, config-precedence, flag-parsing | always | passed | passed | - | - | new-task | 2418 | 78.00 | 2 | 8 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| node-header-merge-review | workspace-edit | code-review | javascript | single-file; behavior-preservation, non-mutating-change, review-feedback | always | passed | passed | - | - | new-task | 2204 | 60.00 | 1 | 2 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| node-keyword-normalizer-refactor | workspace-edit | refactoring | javascript | single-file; api-compat, shared-logic | always | passed | passed | - | - | new-task | 2330 | 90.00 | 1 | 10 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| node-router-path-normalization | workspace-edit | debugging | javascript | single-file; behavior-preservation, path-normalization | always | passed | passed | - | - | new-task | 2371 | 66.00 | 1 | 2 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| node-slug-shared-normalizer | workspace-edit | refactoring | javascript | single-file; behavior-preservation, shared-logic | always | passed | passed | - | - | new-task | 2390 | 59.00 | 1 | 10 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| node-summary-tag-normalizer | workspace-edit | refactoring | javascript | multi-file; shared-logic, behavior-preservation, api-compat | always | passed | passed | - | - | new-task | 2459 | 65.00 | 2 | 17 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| prompt-regression-triage-json | prompt-output | debugging | text | multi-file; artifact-triage, strict-output, regression-reporting | always | passed | passed | - | - | new-task | 1383 | 6.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| prompt-review-findings-markdown | prompt-output | code-review | text | multi-file; review-feedback, strict-output, artifact-triage | always | passed | passed | - | - | new-task | 1240 | 4.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| tool-regression-review | tool-use | code-review | text | multi-file; tool-use, review-feedback, artifact-triage | always | passed | passed | - | read_file -> fixtures/git-diff.patch | new-task | 1380 | 4.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |
| tool-router-root-cause | tool-use | debugging | text | multi-file; tool-use, artifact-triage, path-normalization | always | passed | passed | - | read_file -> src/router.js | new-task | 1807 | 3.00 | 0 | 0 | git-diff.patch, agent-stdout.txt, agent-stderr.txt, activity.jsonl, activity-summary.json | All verification commands passed. |

