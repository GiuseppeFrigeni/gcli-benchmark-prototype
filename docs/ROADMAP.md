# Contributor Eval Harness Roadmap

This repo is a seed contributor framework for deterministic behavioral/evals-style benchmarking of Gemini CLI on repo-backed tasks. It already proves the core evaluation loop:

- load validated task manifests
- copy a fixture repo into an isolated workspace
- run preflight checks
- execute Gemini CLI against the issue
- score the result with objective verification commands
- compare the run against a saved baseline

The growth plan from here is to make that seed framework more useful for contributors, not to claim the harness is already complete.

## Phase 1: Harden the harness

- Keep the task manifest contract small and deterministic.
- Maintain mock-agent smoke tests so harness refactors stay safe.
- Keep CI focused on build, task validation, and deterministic harness checks.

## Phase 2: Broaden contributor-facing task coverage

- Grow from the current seed suite to 15-20 tasks.
- Bias growth toward more debugging and code-review tasks.
- Balance debugging, refactoring, new-feature, and code-review coverage.
- Add harder multi-file tasks that preserve important invariants.

## Phase 3: Improve evaluation quality

- Add richer taxonomy slicing beyond the first-pass scope and tag model.
- Strengthen efficiency tracking so contributors can inspect solution cost, not just pass/fail.
- Add richer regression policies such as per-category thresholds and baseline drift reporting.
- Improve PR-facing regression visibility through clearer reports and CI artifacts.

## Phase 4: Reach GSoC target scale

- Expand to 50+ curated scenarios.
- Add contributor templates and task-authoring checklists.
- Establish a repeatable process for refreshing baselines for new Gemini CLI versions.
- Document how contributors can run focused subsets locally before opening a pull request.
