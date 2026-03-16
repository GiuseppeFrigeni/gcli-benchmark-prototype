function articlePath(category, title) {
  const normalizedCategory = category.toLowerCase().trim().replace(/\s+/g, "-");
  const normalizedTitle = title.toLowerCase().replace(/\s+/g, "-");
  return `/${normalizedCategory}/${normalizedTitle}`;
}

function previewPath(title) {
  const normalizedTitle = title.toLowerCase().trim().replace(/\s+/g, "-");
  return `/preview/${normalizedTitle}`;
}

module.exports = { articlePath, previewPath };
