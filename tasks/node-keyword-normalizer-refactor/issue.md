The keyword utilities are duplicating normalization rules in two places.

Please refactor them to share one normalization helper so parsing and lookup stay aligned.

As part of that cleanup, parsed keywords should not keep surrounding whitespace, and the existing case-insensitive lookup behavior should remain unchanged.
