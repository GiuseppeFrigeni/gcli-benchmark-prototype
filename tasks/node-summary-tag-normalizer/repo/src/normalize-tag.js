function normalizeTag(tag) {
  return String(tag)
    .trim()
    .toLowerCase();
}

module.exports = { normalizeTag };
