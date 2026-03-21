function renderModels(models, options = {}) {
  if (options.json) {
    const payload = JSON.stringify({ models }, null, 2);
    return options.announce ? `Loaded ${models.length} models\n${payload}` : payload;
  }

  return [
    `Loaded ${models.length} models`,
    ...models.map((model) => `- ${model}`),
  ].join("\n");
}

module.exports = {
  renderModels,
};
