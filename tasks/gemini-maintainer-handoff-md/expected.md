## Scope
- JSON-mode output formatting regressed in the Gemini CLI renderer used for command responses.

## Evidence
- The run summary shows a human progress line is emitted before the JSON payload, which breaks machine-readable consumers.

## Next Step
- Patch `src/commands/render.js` first and rerun `node --test test/json-mode.test.js`.
