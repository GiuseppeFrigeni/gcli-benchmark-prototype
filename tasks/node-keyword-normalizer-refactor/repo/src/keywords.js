function parseKeywords(input = "") {
  return input
    .split(",")
    .filter(Boolean)
    .map((part) => part.toLowerCase());
}

function hasKeyword(input, expected) {
  return parseKeywords(input).map((part) => part.trim()).includes(expected.trim().toLowerCase());
}

module.exports = { parseKeywords, hasKeyword };
