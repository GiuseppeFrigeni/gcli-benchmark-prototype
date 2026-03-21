const { buildRefreshRequest } = require("../auth/refresh");

function planRefresh(session = {}, env = {}) {
  const request = buildRefreshRequest(session);
  if (!request) {
    throw new Error("No refresh credentials available");
  }
  return request;
}

module.exports = {
  planRefresh,
};
