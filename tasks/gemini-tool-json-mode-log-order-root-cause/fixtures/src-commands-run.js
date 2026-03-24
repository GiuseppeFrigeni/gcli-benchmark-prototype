async function runCommand(argv, result) {
  console.log("Starting task execution...");

  if (argv.json) {
    process.stdout.write(JSON.stringify(result));
    return;
  }

  console.log(renderTextSummary(result));
}
