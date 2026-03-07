# Adding Benchmark Scenarios

1. Add or edit a `.json` file in `scenarios/`.
2. Each scenario must include:
   - `id`, `title`, `category`, `difficulty`, `prompt`, `expectedKeywords`
3. Optional fields:
   - `forbiddenKeywords`, `tags`, `weight`, `timeoutMs`
   - `weight` must be `>= 0.1` (default `1`)
   - `timeoutMs` must be `>= 1`
4. Categories must be one of:
   - `debugging`, `refactoring`, `new-feature`, `code-review`
5. Validate by running:
   - `npm run dev:list`

Tips:
- Keep prompts realistic and specific.
- Use 3-6 `expectedKeywords` that capture desired behavior.
- Add `forbiddenKeywords` for clearly wrong behaviors.
- Use `tags` for slice/filter analysis in scenario listing.
- Use `weight` when some scenarios should count more in overall metrics.
