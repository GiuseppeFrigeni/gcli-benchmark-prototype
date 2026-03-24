function renderModels(models, options) {
  if (!options.json) {
    console.log("Rendering alias table...");
  } else {
    console.log("Rendering alias table...");
  }
  process.stdout.write(JSON.stringify(models));
}

module.exports = { renderModels };
