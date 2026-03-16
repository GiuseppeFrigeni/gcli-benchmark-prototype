function mergeHeaders(defaults, overrides = {}) {
  const result = defaults;
  for (const [key, value] of Object.entries(overrides)) {
    if (value == null) {
      continue;
    }
    result[key.toLowerCase()] = value;
  }
  return result;
}

module.exports = { mergeHeaders };
