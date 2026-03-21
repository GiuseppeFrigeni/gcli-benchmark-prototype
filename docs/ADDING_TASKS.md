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

- `taxonomy`
- `timeoutMs`
- `promptAddendum`
- `setupCommands`

## Taxonomy

`taxonomy` is optional for backward compatibility, but new tasks should include it:

```json
{
  "taxonomy": {
    "scope": "single-file",
    "tags": ["behavior-preservation", "shared-logic"]
  }
}
```

Rules:

- `taxonomy.scope` is required when `taxonomy` is present and must be `single-file` or `multi-file`
- `taxonomy.tags` is required when `taxonomy` is present and must be a non-empty `string[]`

Starter shared vocabulary:

- `behavior-preservation`
- `api-compat`
- `output-format`
- `shared-logic`
- `review-feedback`
- `ordering`
- `non-mutating-change`
- `config-precedence`
- `path-normalization`

Prefer lowercase kebab-case tags and reuse the shared vocabulary when it materially fits the task.

## Verification Contract

- Every command in `verification.failToPass` must fail before the agent runs and pass after the fix.
- Every command in `verification.passToPass` must already pass before the agent runs and remain passing after the fix.
- If that contract is broken on the pristine repo, the task is marked `invalid_task`.

## Authoring Tips

- Keep each repo fixture small and deterministic.
- Use only checked-in files and built-in runtimes when possible.
- Prefer one targeted failing command and one or two stability commands.
- Add taxonomy so list/report output can show scope and tag coverage.
- Record the intended solution in `gold.patch` so the mock-agent smoke tests can apply it.
