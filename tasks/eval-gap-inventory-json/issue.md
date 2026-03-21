# Eval Gap Inventory

Read the local contributor coverage materials and return strict JSON with this shape:

```json
{
  "headline": "...",
  "highestPriorityGap": {
    "dimension": "...",
    "value": "...",
    "count": 0
  },
  "secondaryGap": {
    "dimension": "...",
    "value": "...",
    "count": 0
  },
  "recommendedTemplateFamily": "..."
}
```

Do not include any extra keys.
