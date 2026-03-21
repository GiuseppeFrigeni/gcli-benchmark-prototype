const { parseArgs } = require("./argv");

function loadConfig(argv = [], env = process.env) {
  const args = parseArgs(argv);
  return {
    host: args.host || env.APP_HOST || "127.0.0.1",
    port: Number(args.port || env.APP_PORT || 3000),
  };
}

module.exports = { loadConfig };
