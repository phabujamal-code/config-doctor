function makeBaseReport(fileType) {
  return {
    fileType,
    errorCount: 0,
    fixedIssues: [],
    warnings: [],
    timestamp: new Date().toISOString(),
  };
}

module.exports = { makeBaseReport };
