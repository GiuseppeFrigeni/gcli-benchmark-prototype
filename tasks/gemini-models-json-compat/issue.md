# Fix Models JSON Compatibility

`gemini models --json` started breaking script consumers because the command prints a human banner ahead of the serialized payload.

Fix the implementation so JSON mode stays machine-readable.

Constraints:

- keep the existing default text output unchanged
- keep the JSON payload shape unchanged
