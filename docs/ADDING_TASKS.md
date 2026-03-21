# Adding Tasks

Each task lives in its own directory under `tasks/`:

```text
tasks/<task-id>/
  task.json
  issue.md
  repo/                     # required for workspace-edit, optional otherwise
  gold.patch                # required for workspace-edit
  gold.stdout.txt           # required for prompt-output
  gold.activity.jsonl       # required for tool-use
  gold.stderr.txt           # optional for prompt-output/tool-use
```

## `task.json`

Required fields:

- `id`
- `title`
- `taskKind`
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

## Task Kinds

### `workspace-edit`

Use this for repo-backed coding tasks where success is judged by verification commands after the agent edits the workspace.

Required assets:

- `repo/`
- `gold.patch`

### `prompt-output`

Use this when the benchmark is the agent response itself rather than a code diff.

Required assets:

- `gold.stdout.txt`

Typical verification:

- compare `agent-stdout.txt` with an expected JSON or Markdown output
- optionally inspect `activity-summary.json` if the response should come after some local investigation

### `tool-use`

Use this when the benchmark cares that the agent inspected the right local materials before answering.

Required assets:

- `gold.activity.jsonl`

Optional assets:

- `repo/` if you want a workspace to inspect
- `gold.stdout.txt` if the gold mock should also supply a final answer
- `gold.stderr.txt`

Typical verification:

- compare `agent-stdout.txt` with an expected conclusion
- assert on `activity-summary.json` to confirm required tools and targets were used

## Variable Interpolation

`setupCommands`, `verification.failToPass`, `verification.passToPass`, and `promptAddendum` support:

- `${taskDir}`
- `${workspaceDir}`
- `${artifactDir}`

This keeps tasks shell-based and inspectable without adding a custom verification DSL.

## Activity Summary

Every run writes `activity-summary.json` beside the raw `activity.jsonl`.

`activity-summary.json` is the stable verification surface for tool-use tasks. It includes:

- ordered tool/function calls
- per-tool counts
- a compact target string when the call arguments include a file path, command, pattern, or prompt

Prefer asserting on `activity-summary.json` instead of the raw provider log.

## Taxonomy

New tasks should include taxonomy:

```json
{
  "taxonomy": {
    "scope": "multi-file",
    "tags": ["tool-use", "artifact-triage"]
  }
}
```

Rules:

- `taxonomy.scope` must be `single-file` or `multi-file`
- `taxonomy.tags` must be a non-empty `string[]`

Starter shared vocabulary:

- `api-compat`
- `artifact-triage`
- `behavior-preservation`
- `config-precedence`
- `filtering`
- `output-format`
- `path-normalization`
- `regression-reporting`
- `review-feedback`
- `shared-logic`
- `strict-output`
- `tool-use`

## Verification Contract

- Every command in `verification.failToPass` must fail before the agent runs and pass after the expected fix or response.
- Every command in `verification.passToPass` must already pass before the agent runs and remain passing after the run.
- If that contract is broken on the pristine task, the harness marks the task as `invalid_task`.

## Authoring Tips

- Keep fixtures small and deterministic.
- Prefer one targeted fail-to-pass check and one or two stability checks.
- For `prompt-output`, score the exact response shape.
- For `tool-use`, score both the conclusion and the required inspection path.
- Keep mock gold artifacts reviewable so contributors can understand what "good" looks like at a glance.
