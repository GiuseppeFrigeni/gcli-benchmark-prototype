# Contributor Eval Harness Roadmap

The core harness is now organized around three suites:

- `gemini-core` for direct Gemini CLI quality evidence
- `contributor-workflows` for maintainer and eval-maintenance flows
- `harness-calibration` for deterministic harness validation

## Near-Term Priorities

- Keep live Gemini evidence current for `gemini-core` and `contributor-workflows`.
- Expand Gemini-heavy coverage before adding more generic coding fixtures.
- Keep the mock baseline trustworthy as a harness-calibration signal.
- Tighten authoring ergonomics through schema-backed manifests, `validate-task`, and clearer draft-task scaffolds.

## Tracked Work

The canonical public backlog belongs in GitHub issues. [`docs/ROADMAP_ISSUES.md`](./ROADMAP_ISSUES.md) mirrors the intended issue titles, labels, and acceptance criteria so the repo stays reviewable even when GitHub-side access is unavailable in the current environment.
