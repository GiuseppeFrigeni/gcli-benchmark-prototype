const { readFileSync } = require("node:fs");
const { join } = require("node:path");

process.stdout.write(readFileSync(join(__dirname, "fixtures", "trace.txt"), "utf8"));
