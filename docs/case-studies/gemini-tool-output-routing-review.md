# Case Study: `gemini-tool-output-routing-review`

This is the shortest end-to-end example of the repo's intended value for the Agent Intelligence quality area: the harness catches a review workflow miss, preserves enough artifacts to inspect it, and turns that miss into a maintainer-ready investigation packet plus a fresh rerun.

## Why This Task Matters

The task is a `tool-use` review scenario. It does not only care about the final sentence; it also checks that the agent inspected the right evidence in the right order:

1. `test/models-json.test.js`
2. `src/commands/models.js`
3. `src/renderers/output.js`

That makes it a good proxy for real contributor quality work, where an answer can sound plausible while still skipping the decisive file.

## Archived March 24, 2026 Live Failure

The archived suite run is the front-half of the story:

- suite run: [`reports/live-gemini-core/report-20260324-125017.md`](../../reports/live-gemini-core/report-20260324-125017.md)

What the harness surfaced:

- the task failed
- the failure reason was `tool-expectation-failed`
- the first observed call was `list_directory -> .`
- the required inspection of `test/models-json.test.js` never happened before the answer

That is exactly the kind of reviewer-facing miss this benchmark should preserve instead of flattening into a generic "bad answer" bucket.

## Expected Contributor Investigation Path

The task fixture shows the intended path clearly:

- the test file says JSON mode should produce a JSON payload
- `src/commands/models.js` always calls `renderTextOutput`
- `src/renderers/output.js` already has a JSON rendering branch available

The gold answer encodes the likely maintainer conclusion:

> `src/commands/models.js` always calls `renderTextOutput`, so `--json` responses never reach the JSON branch in `src/renderers/output.js`.

The likely upstream fix location is therefore `src/commands/models.js`.

## Fresh Single-Task Rerun

The case-study rerun keeps the scope tight to one task:

```bash
npm run dev:run -- --agent-mode=gemini-cli --task=gemini-tool-output-routing-review --reports reports/case-study-tool-output-routing-review
```

In this Windows environment the archived rerun was executed with an explicit Gemini binary path, but the task itself does not require any CLI changes.

Fresh rerun outcome on 2026-03-24 18:23 UTC:

- run id: `20260324-182325`
- status: `infra_failed`
- harness classification: `agent-error`
- first observed tool call: `read_file -> package.json`
- comparison against baseline: `passed -> regressed`

What changed relative to the archived March 24 suite failure:

- the rerun no longer failed on missing required inspections before scoring
- the trace shows that Gemini reached `src/commands/models.js`, `src/renderers/output.js`, and `test/models-json.test.js`
- the trace also shows repeated `node --test test/models-json.test.js` runs and temp-workspace edits before the run timed out

Current rerun artifacts:

- latest report: [`reports/case-study-tool-output-routing-review/latest-report.md`](../../reports/case-study-tool-output-routing-review/latest-report.md)
- latest results: [`reports/case-study-tool-output-routing-review/latest-results.json`](../../reports/case-study-tool-output-routing-review/latest-results.json)
- latest baseline comparison: [`reports/case-study-tool-output-routing-review/latest-compare.md`](../../reports/case-study-tool-output-routing-review/latest-compare.md)
- latest trace summary: [`reports/case-study-tool-output-routing-review/latest-trace-summary.md`](../../reports/case-study-tool-output-routing-review/latest-trace-summary.md)
- archived report: [`reports/case-study-tool-output-routing-review/report-20260324-182325.md`](../../reports/case-study-tool-output-routing-review/report-20260324-182325.md)
- archived results: [`reports/case-study-tool-output-routing-review/results-20260324-182325.json`](../../reports/case-study-tool-output-routing-review/results-20260324-182325.json)
- archived comparison: [`reports/case-study-tool-output-routing-review/compare-20260324-182325.md`](../../reports/case-study-tool-output-routing-review/compare-20260324-182325.md)
- archived trace summary: [`reports/case-study-tool-output-routing-review/trace-summary-20260324-182325.md`](../../reports/case-study-tool-output-routing-review/trace-summary-20260324-182325.md)

These links should be refreshed together whenever the case study is rerun.

## Why This Is Useful Even If The Task Still Fails

The success condition for this case study is not "Gemini CLI passes now." The success condition is that an outside contributor can follow one benchmark failure from:

1. archived live evidence
2. expected inspection order
3. likely upstream fix location
4. fresh rerun artifacts
5. baseline comparison output

That is the closed loop this GSOC proposal needs to prove.
