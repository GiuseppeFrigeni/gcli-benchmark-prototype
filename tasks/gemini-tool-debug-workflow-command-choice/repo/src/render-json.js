function renderJson(payload, options = {}) {
  const body = JSON.stringify(payload);
  if (options.machine) {
    return `Preview:${body}`;
  }
  return `Preview:\n${body}`;
}

module.exports = {
  renderJson,
};
