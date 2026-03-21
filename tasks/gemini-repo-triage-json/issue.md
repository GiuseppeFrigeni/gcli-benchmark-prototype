You are triaging a Gemini CLI contributor issue:

> "After the extensions-login refactor, refresh tokens stop working only for `gemini extensions login`, while the normal login flow still passes."

Return exactly one JSON object with these keys:

- `area`
- `firstFiles`
- `owner`
- `nextCommand`

Rules:

- Output raw JSON only, with no Markdown fences.
- `area` must be one of `auth`, `config`, `output`, or `tooling`.
- `firstFiles` must be a sorted array with exactly two repo-relative file paths.
- `owner` must be one of `cli-runtime`, `auth-flow`, or `release`.
- `nextCommand` must be exactly one shell command to run from the repo root.
