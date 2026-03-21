function renderTextOutput(models) {
  return models.map((model) => `- ${model}`).join("\n");
}

function renderJsonOutput(models) {
  return JSON.stringify({ models });
}

module.exports = {
  renderTextOutput,
  renderJsonOutput,
};
