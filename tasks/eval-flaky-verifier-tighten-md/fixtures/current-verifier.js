const summary = require(process.argv[2]);
const stdout = require("node:fs").readFileSync(process.argv[3], "utf8");

if (
  stdout.includes("models output routing") ||
  stdout.includes("src/commands/models.js")
) {
  process.exit(0);
}

process.exit(1);
