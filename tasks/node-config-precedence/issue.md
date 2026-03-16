The config loader is using environment variables even when the caller passes explicit CLI values.

That is backwards for our CLI use case: explicit CLI values should win, environment variables should only act as defaults, and hard-coded values should remain the final fallback.

Please fix the config resolution logic without changing the existing option names or the default values.
