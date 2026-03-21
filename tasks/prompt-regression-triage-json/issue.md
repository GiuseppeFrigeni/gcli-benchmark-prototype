Read the benchmark artifacts and return exactly one JSON object with these keys:

- `regression`
- `severity`
- `brokenTasks`
- `recommendation`

Rules:

- Output raw JSON only, with no Markdown fences.
- `regression` must be a boolean.
- `severity` must be one of `low`, `medium`, or `high`.
- `brokenTasks` must be a sorted array of task ids.
- `recommendation` must be a short kebab-case action string.
