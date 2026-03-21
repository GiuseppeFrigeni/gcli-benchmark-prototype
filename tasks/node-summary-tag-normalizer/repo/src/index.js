function hasTag(input = "", wanted = "") {
  const normalizedWanted = wanted.trim().toLowerCase();
  return input
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .includes(normalizedWanted);
}

module.exports = { hasTag };
