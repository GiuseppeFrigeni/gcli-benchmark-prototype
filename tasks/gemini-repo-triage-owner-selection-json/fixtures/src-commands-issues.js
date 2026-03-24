async function issuesCommand(argv, issues) {
  console.log("Loading issue inventory...");

  if (argv.json) {
    process.stdout.write(JSON.stringify(issues));
    return;
  }

  renderIssuesTable(issues);
}
