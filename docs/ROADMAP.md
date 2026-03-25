# Contributor Eval Harness Roadmap

The core harness is organized around three suites:

- `gemini-core` for direct Gemini CLI quality evidence
- `contributor-workflows` for maintainer and eval-maintenance flows
- `harness-calibration` as support infrastructure for deterministic harness validation

## Near-Term Priorities

- Keep the live Gemini evidence current for `gemini-core` and `contributor-workflows`.
- Expand Gemini-heavy coverage before adding more generic calibration fixtures.
- Keep the mock baseline trustworthy as a harness-integrity signal.
- Tighten contributor ergonomics through schema-backed manifests, `validate-task --dynamic`, clearer draft workflows, and report-to-follow-up helper docs.

## Tracked Work

- Reviewable packet backlog: [`docs/issue-packets/README.md`](./issue-packets/README.md)
- Direct GitHub issue-editor links: [`docs/ROADMAP_ISSUES.md`](./ROADMAP_ISSUES.md)
- Reviewer overview: [`docs/REVIEWER_GUIDE.md`](./REVIEWER_GUIDE.md)
