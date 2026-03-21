The summary helper and the lookup helper normalize tags differently today.

Please refactor them to share the same normalization logic so the tag list output matches the lookup behavior, without changing the public exports or silently deduplicating tags.
