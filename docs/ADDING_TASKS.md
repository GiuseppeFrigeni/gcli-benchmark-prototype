# Adding Workspace Tasks

Each task lives in its own directory under `tasks/`:

```text
tasks/<task-id>/
  task.json
  issue.md
  gold.patch
  repo/
```

## `task.json`

Required fields:

- `id`
- `title`
- `category`
- `difficulty`
- `language`
- `problemStatementFile`
- `verification.failToPass`
- `verification.passToPass`
- `policy`

Optional fields:

- `timeoutMs`
- `promptAddendum`
- `setupCommands`

## Verification Contract

- Every command in `verification.failToPass` must fail before the agent runs and pass after the fix.
- Every command in `verification.passToPass` must already pass before the agent runs and remain passing after the fix.
- If that contract is broken on the pristine repo, the task is marked `invalid_task`.

## Authoring Tips

- Keep each repo fixture small and deterministic.
- Use only checked-in files and built-in runtimes when possible.
- Prefer one targeted failing command and one or two stability commands.
- Record the intended solution in `gold.patch` so the mock-agent smoke tests can apply it.
