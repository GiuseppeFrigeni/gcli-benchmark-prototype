function parseArgs(argv = []) {
  const options = {
    json: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (current === "--json") {
      options.json = true;
      continue;
    }
  }

  return options;
}

module.exports = { parseArgs };
