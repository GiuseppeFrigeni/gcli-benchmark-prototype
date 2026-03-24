## Summary
`gemini models --json` is prepending a progress banner before the JSON payload, so script consumers cannot parse stdout.

## Repro
Run `gemini models --json` and confirm stdout starts with `Rendering alias table...` before the JSON array.

## Next Step
Patch `src/render-models.js` so the banner is suppressed in JSON mode while leaving the text output unchanged.
