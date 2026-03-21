function parseArgs(argv = []) {
  const parsed = {};

  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    const next = argv[i + 1];

    if (current === "--host") {
      parsed.host = next;
      i += 1;
      continue;
    }
    if (current === "--port") {
      parsed.port = next;
      i += 1;
      continue;
    }
    if (current === "-H") {
      parsed.hostname = next;
      i += 1;
      continue;
    }
    if (current === "-p") {
      parsed.listenPort = next;
      i += 1;
    }
  }

  return parsed;
}

module.exports = { parseArgs };
