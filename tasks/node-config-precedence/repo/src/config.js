function resolveConfig({ env = process.env, args = {} } = {}) {
  return {
    host: env.APP_HOST || args.host || "127.0.0.1",
    port: Number(env.APP_PORT || args.port || 3000),
    mode: env.APP_MODE || args.mode || "development",
  };
}

module.exports = { resolveConfig };
