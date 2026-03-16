Review feedback on this helper:

- Please avoid mutating the caller's defaults object when applying overrides.
- This function is reused across requests, so mutation leaks state between calls.
- Keep null or undefined override values ignored, and keep lowercase keys for overrides.

Please update the implementation to satisfy that feedback without changing the exported API.
