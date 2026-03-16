Please refactor the slug formatting logic so the article and preview helpers share the same normalization behavior.

Right now the preview path trims surrounding whitespace correctly, but the article path does not do that consistently for the title segment.

Please introduce a shared normalizer and keep the existing URL shape and exported API unchanged.
