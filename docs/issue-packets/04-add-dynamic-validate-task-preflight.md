# Add Dynamic `validate-task` Preflight Mode

Status: implemented in repo on 2026-03-25. Kept as an archived planning packet because it now maps directly to the shipped `validate-task --dynamic` flow.

Labels: `authoring`, `evaluation`

## Summary

This packet tracked the now-shipped opt-in validation mode that executes task setup and preflight verification in a temporary workspace so contributors can catch broken fixtures earlier.

## Acceptance Criteria

- Keep the current static validation behavior as the default.
- Add an opt-in path that runs setup and preflight checks without invoking a live agent.
- Surface fixture failures clearly in command output and JSON output.
- Document the new mode in README and `docs/ADDING_TASKS.md`.

## Repo Links

- [`src/cli.ts`](../../src/cli.ts)
- [`src/task-loader.ts`](../../src/task-loader.ts)
- [`src/workspace-runner.ts`](../../src/workspace-runner.ts)
- [`docs/ADDING_TASKS.md`](../ADDING_TASKS.md)
