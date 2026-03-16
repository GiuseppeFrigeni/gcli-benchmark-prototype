Review feedback on the cache helper:

- The generated cache key should be stable regardless of object property insertion order.
- Equivalent parameter objects should produce the same key so cache hits are reliable.
- Please keep the current base-key formatting when there are no params.

Please update the implementation to address that feedback.
