async function persistRefreshToken(entry) {
  const scope = entry.scope ?? "default";
  return `${scope}:${entry.token}`;
}

module.exports = { persistRefreshToken };
