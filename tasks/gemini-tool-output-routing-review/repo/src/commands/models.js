const { renderTextOutput, renderJsonOutput } = require("../renderers/output");

function runModelsCommand(models, options = {}) {
  if (options.json) {
    return renderTextOutput(models);
  }
  return renderTextOutput(models) || renderJsonOutput(models);
}

module.exports = {
  runModelsCommand,
};
