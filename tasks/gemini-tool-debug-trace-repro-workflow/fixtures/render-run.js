function renderRun(result, options) {
  if (options.json) {
    console.log("spinner-line-before-json");
    process.stdout.write(JSON.stringify(result));
    return;
  }

  startSpinner();
  console.log(formatText(result));
}
