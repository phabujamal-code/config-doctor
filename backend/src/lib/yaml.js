const yaml = require('js-yaml');
const { makeBaseReport } = require('./report');

function analyzeYaml(content) {
  const report = makeBaseReport('YAML');
  const errors = [];
  const warnings = [];
  const fixedIssues = [];

  let doc;
  let fixedContent = null;

  const normalizedInput = normalizeYamlInput(content);

  try {
    doc = yaml.load(normalizedInput, { json: true });
    fixedContent = yaml.dump(doc, { indent: 2, lineWidth: 120, noRefs: true }) || '';
  } catch (e) {
    errors.push({
      severity: 'error',
      message: 'YAML syntax error: unable to parse YAML',
      suggestion: 'Check indentation, missing colons, and invalid characters',
    });

    // Attempt a basic fix: convert tabs to spaces and retry
    try {
      const tabFixed = normalizedInput.replace(/\t/g, '  ');
      doc = yaml.load(tabFixed, { json: true });
      fixedContent = yaml.dump(doc, { indent: 2, lineWidth: 120, noRefs: true }) || '';
      fixedIssues.push('Replaced tabs with spaces and normalized YAML output');
    } catch (e2) {
      fixedContent = null;
    }
  }

  // Heuristics
  if (typeof doc === 'string') {
    warnings.push({
      severity: 'warning',
      message: 'YAML parsed into a plain string; expected mapping/object in most config files',
      suggestion: 'Ensure the file uses key: value pairs',
    });
  }

  report.errorCount = errors.length;
  report.fixedIssues = fixedIssues;
  report.warnings = warnings.map((w) => w.message);

  const explanation =
    errors.length === 0
      ? 'Valid YAML. Output is normalized with consistent indentation.'
      : fixedContent
        ? 'Invalid YAML detected. Applied safe normalization and formatting.'
        : 'Invalid YAML detected. Automatic repair was not possible; fix indentation/structure and retry.';

  return {
    errors: [...errors, ...warnings],
    fixedContent,
    explanation,
    report,
  };
}

function normalizeYamlInput(str) {
  // Normalize line endings and strip BOM
  return str.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

module.exports = { analyzeYaml };
