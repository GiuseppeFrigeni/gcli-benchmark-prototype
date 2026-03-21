function renderResult(result, options = {}) {
  const { json = false, logger = console } = options;

  if (json) {
    logger.log("Rendering result...");
    process.stdout.write(`${JSON.stringify(result)}\n`);
    return;
  }

  logger.log(`Result: ${result.id}`);
}

module.exports = { renderResult };
