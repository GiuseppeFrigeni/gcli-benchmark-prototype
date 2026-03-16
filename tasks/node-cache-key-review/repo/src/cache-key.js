function buildCacheKey(baseKey, params = {}) {
  const serialized = Object.entries(params).map(([key, value]) => `${key}=${value}`).join("&");
  return serialized ? `${baseKey}?${serialized}` : baseKey;
}

module.exports = { buildCacheKey };
