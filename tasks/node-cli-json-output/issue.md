We need a machine-readable mode for the tiny summary CLI.

When the user passes `--json`, the CLI should return a JSON document that includes:

- `completed`
- `total`
- `remaining`

The existing text output must stay unchanged when `--json` is not present.
