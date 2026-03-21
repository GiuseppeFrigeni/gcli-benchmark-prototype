const { persistRefreshToken } = require("../session/token-store");

async function runExtensionsLogin(session) {
  await persistRefreshToken({
    scope: "default",
    token: session.refreshToken,
  });
}

module.exports = { runExtensionsLogin };
