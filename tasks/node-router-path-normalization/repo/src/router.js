function normalizePath(path) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized;
}

class Router {
  constructor() {
    this.routes = new Map();
  }

  register(path, handlerName) {
    this.routes.set(normalizePath(path), handlerName);
  }

  match(path) {
    return this.routes.get(normalizePath(path)) ?? null;
  }
}

module.exports = { Router };
