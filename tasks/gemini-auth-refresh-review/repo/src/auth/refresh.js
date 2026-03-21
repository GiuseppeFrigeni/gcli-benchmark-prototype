function buildRefreshRequest(session = {}) {
  if (session.refreshToken) {
    return {
      grantType: "refresh_token",
      refreshToken: session.refreshToken,
    };
  }
  return null;
}

module.exports = {
  buildRefreshRequest,
};
