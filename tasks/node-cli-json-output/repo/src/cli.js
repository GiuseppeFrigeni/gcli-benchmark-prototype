function formatSummary(summary) {
  return `${summary.completed}/${summary.total} tasks completed`;
}

function renderOutput(summary, options = {}) {
  return formatSummary(summary);
}

function parseArgs(argv = []) {
  return {
    json: argv.includes("--json"),
  };
}

function run(argv = [], summary = { completed: 0, total: 0 }) {
  return renderOutput(summary, parseArgs(argv));
}

module.exports = {
  formatSummary,
  renderOutput,
  parseArgs,
  run,
};
