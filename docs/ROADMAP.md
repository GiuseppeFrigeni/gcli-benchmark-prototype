# Behavioral Benchmark Roadmap

This prototype already proves the core evaluation loop:

- load validated task manifests
- copy a fixture repo into an isolated workspace
- run preflight checks
- execute Gemini CLI against the issue
- score the result with objective verification commands
- compare the run against a saved baseline

The growth plan from here is straightforward.

## Phase 1: Harden the harness

- Keep the task manifest contract small and deterministic.
- Maintain mock-agent smoke tests so harness refactors stay safe.
- Keep CI focused on build, task validation, and deterministic harness checks.

## Phase 2: Broaden task coverage

- Grow from the current seed suite to 15-20 tasks.
- Balance debugging, refactoring, new-feature, and code-review coverage.
- Add medium-difficulty tasks that touch multiple files or preserve invariants.

## Phase 3: Improve evaluation quality

- Add richer regression policies such as per-category thresholds and baseline drift reporting.
- Record more run metadata, including observed model names and verification breakdowns.
- Publish PR-friendly reports or dashboard snapshots from CI artifacts.

## Phase 4: Reach GSoC target scale

- Expand to 50+ curated scenarios.
- Add contributor templates and task-authoring checklists.
- Establish a repeatable process for refreshing baselines for new Gemini CLI versions.
- Document how contributors can run focused subsets locally before opening a pull request.
