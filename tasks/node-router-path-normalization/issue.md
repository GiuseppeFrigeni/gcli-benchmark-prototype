Users can register routes without trailing slashes, but route matching currently fails when a request path includes one.

Examples like `/users/` and `/users/profile/` should match the same handlers as `/users` and `/users/profile`.

Please fix the path normalization logic while preserving exact behavior for `/`, unknown routes, and existing static matches.
