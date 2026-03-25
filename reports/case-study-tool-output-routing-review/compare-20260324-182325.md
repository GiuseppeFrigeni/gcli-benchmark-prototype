# Gemini CLI Case Study Compare Summary

Command:

```bash
npm run dev:compare -- --results reports/case-study-tool-output-routing-review/latest-results.json --baseline baseline/baseline.json
```

Results: `reports/case-study-tool-output-routing-review/latest-results.json`

Baseline: `baseline/baseline.json`

Regression findings: `2`

## Regressed Suites

- `gemini-core`: 1

## Regressed Task Kinds

- `tool-use`: 1

## Regressed Categories

- `code-review`: 1

## Regressed Task

- `gemini-tool-output-routing-review`: suite=`gemini-core`, status=`infra_failed`, reason=`agent-error`, first failure=`none`, artifacts=`reports/case-study-tool-output-routing-review/artifacts/20260324-182325/gemini-tool-output-routing-review`
