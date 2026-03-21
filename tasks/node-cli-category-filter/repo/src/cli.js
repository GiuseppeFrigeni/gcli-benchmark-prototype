const { parseArgs } = require("./parse-args");
const { renderItems } = require("./render");

const DEFAULT_ITEMS = [
  { category: "docs", name: "README" },
  { category: "docs", name: "CHANGELOG" },
  { category: "tests", name: "benchmark.test.js" },
];

function run(argv = []) {
  const options = parseArgs(argv);
  return renderItems(DEFAULT_ITEMS, options);
}

module.exports = { run };
