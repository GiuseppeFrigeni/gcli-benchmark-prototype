const { renderModels } = require("./render-models");

const DEFAULT_MODELS = ["gemini-2.5-pro", "gemini-2.5-flash"];

function parseArgs(argv = []) {
  return {
    json: argv.includes("--json"),
  };
}

function run(argv = [], models = DEFAULT_MODELS) {
  const flags = parseArgs(argv);
  return renderModels(models, {
    json: flags.json,
    announce: true,
  });
}

module.exports = {
  parseArgs,
  run,
};
