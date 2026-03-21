function listTags(input = "") {
  return input
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

module.exports = { listTags };
