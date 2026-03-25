# Adding Tasks

Every benchmark task lives in its own directory under `tasks/`:

```text
tasks/<task-id>/
  task.json
  issue.md
  repo/                     # required for workspace-edit, optional otherwise
  gold.patch                # required for workspace-edit
  gold.stdout.txt           # required for prompt-output, recommended for tool-use
  gold.activity.jsonl       # required for tool-use
  gold.stderr.txt           # optional for prompt-output/tool-use
  fixtures/                 # optional local materials for prompt-output/tool-use tasks
```

For minimal starter fixtures, see [`docs/minimal-task-examples`](./minimal-task-examples/README.md).

## Manifest Schema

Every checked-in task should declare:

```json
{
  "$schema": "../../docs/task.schema.json"
}
```

The schema lives at [`docs/task.schema.json`](./task.schema.json).

Fast validation loops:

```bash
npm run dev:validate-task -- --task-dir ./tasks/<task-id>
npm run dev:validate-task -- --task-dir ./tasks/<task-id> --dynamic
npm run dev:list -- --tasks ./tasks
npm run dev:gaps -- --tasks ./tasks
```

Editor and external validator examples:

```bash
npx ajv-cli validate -s docs/task.schema.json -d tasks/<task-id>/task.json
```

## Required `task.json` Fields

- `id`
- `title`
- `taskKind`
- `suite`
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
- `toolExpectations` for `tool-use`

## Suites

Each task gets one primary suite:

- `gemini-core`: direct Gemini CLI quality evidence such as JSON mode regressions, repo triage, and debugging workflows
- `contributor-workflows`: maintainer replies, regression triage, eval maintenance, and contributor-facing summaries
- `harness-calibration`: generic deterministic fixtures that validate the harness itself as support infrastructure

Use taxonomy tags for cross-cutting behavior; do not multi-home one task across several suites.

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
- optionally inspect `activity-summary.json` if the response should follow local investigation

### `tool-use`

Use this when the benchmark cares that the agent inspected the right local materials before answering.

Required assets:

- `gold.activity.jsonl`

Recommended assets:

- `gold.stdout.txt`

Typical verification:

- compare `agent-stdout.txt` with an expected conclusion
- assert on `activity-summary.json` to confirm required tools and targets were used
- declare `toolExpectations` in `task.json` when order or first inspection matters

## Variable Interpolation

`setupCommands`, `verification.failToPass`, `verification.passToPass`, and `promptAddendum` support:

- `${taskDir}`
- `${workspaceDir}`
- `${artifactDir}`

This keeps tasks shell-based and inspectable without adding a custom verification DSL.

## Tool Expectations

`tool-use` tasks can add a `toolExpectations` block:

```json
{
  "toolExpectations": {
    "firstCall": { "name": "read_file", "targetIncludes": "test/failing.test.js" },
    "requiredCalls": [
      { "name": "read_file", "targetIncludes": "test/failing.test.js" },
      { "name": "read_file", "targetIncludes": "src/feature.js" }
    ],
    "orderedCalls": [
      { "name": "read_file", "targetIncludes": "test/failing.test.js" },
      { "name": "read_file", "targetIncludes": "src/feature.js" }
    ]
  }
}
```

Notes:

- `requiredCalls` checks presence anywhere in the tool trace
- `orderedCalls` checks the leading inspection path in order
- `firstCall` is the headline strict check for “wrong first file/tool choice” tasks
- this supplements normal shell verification; it does not replace exact-answer checks

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
- `repo-triage`
- `regression-reporting`
- `review-feedback`
- `shared-logic`
- `strict-output`
- `tool-use`

## Verification Contract

- Every command in `verification.failToPass` must fail before the agent runs and pass after the expected fix or response.
- Every command in `verification.passToPass` must already pass before the agent runs and remain passing after the run.
- If that contract is broken on the pristine task, the harness marks the task as `invalid_task`.
- Use `validate-task --dynamic` when you want to check that contract in a temp workspace without invoking a live agent.

## Smallest Acceptable Task

- One clear problem statement
- One primary suite
- One targeted fail-to-pass check
- One or two stable pass-to-pass checks
- One reviewable gold artifact
- Fixtures small enough to understand in a code review without opening ten files

## Drafting From Chat Logs

The harness supports a narrow draft flow:

```bash
npm run dev:draft-task -- --chat-log ./docs/examples/chat-log.json --task-id draft-task --task-kind tool-use --category debugging --language text --out ./drafts/draft-task
```

Drafts default to `suite: contributor-workflows` and include placeholder gold artifacts. Treat the output as a scaffold, not a finished eval: tighten the fixtures, suite assignment, verification commands, and taxonomy before promoting a draft into `tasks/`.
