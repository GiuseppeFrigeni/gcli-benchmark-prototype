function renderItems(items, options = {}) {
  const visibleItems = items;
  if (options.json) {
    return JSON.stringify(visibleItems);
  }

  return visibleItems.map((item) => `${item.category}: ${item.name}`).join("\n");
}

module.exports = { renderItems };
