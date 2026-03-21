# Restore Auth Refresh Fallback

A Gemini CLI auth cleanup regressed the fallback path used when a stored session has no refresh token.

Fix the implementation so:

- existing refresh-token behavior still wins when a refresh token exists
- the command can still fall back to a device code when the refresh token is missing
- the request shape stays stable
