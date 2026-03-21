function renderRunResult(payload, options = {}) {
  const body = JSON.stringify(payload, null, 2);
  if (options.json) {
    return `Running Gemini task...\n${body}`;
  }
  return `Running Gemini task...\n${payload.summary}`;
}

module.exports = {
  renderRunResult,
};
