function normalizePath(path) {
  return path === "/" ? "/" : path.replace(/\/+$/, "");
}

class Router {
  constructor(routes = {}) {
    this.routes = routes;
  }

  match(path) {
    return this.routes[path] || null;
  }
}

module.exports = { Router, normalizePath };
