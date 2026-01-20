const { makeBaseReport } = require('./report');

function isLikelyKey(str) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(str);
}

function normalizeLine(line) {
  // Handle "export KEY=VALUE"
  const trimmed = line.trim();
  if (trimmed.startsWith('export ')) {
    return trimmed.slice(7).trim();
  }
  return trimmed;
}

function analyzeEnv(content) {
  const report = makeBaseReport('ENV');
  const errors = [];
  const warnings = [];
  const fixedIssues = [];

  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const out = [];

  lines.forEach((raw, idx) => {
    const lineNo = idx + 1;
    const original = raw;
    const trimmed = raw.trim();

    if (trimmed === '' || trimmed.startsWith('#')) {
      out.push(original); // preserve
      return;
    }

    const normalized = normalizeLine(original);

    // Support "KEY : VALUE" common mistake
    if (!normalized.includes('=') && normalized.includes(':')) {
      const parts = normalized.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join(':').trim();
        if (isLikelyKey(key)) {
          errors.push({
            severity: 'error',
            message: 'Invalid ENV assignment: used ":" instead of "="',
            line: lineNo,
            suggestion: `Replace ":" with "=" -> ${key}=${value}`,
          });
          fixedIssues.push(`Line ${lineNo}: Replaced ":" with "="`);
          out.push(`${key}=${value}`);
          return;
        }
      }
    }

    const eqIndex = normalized.indexOf('=');
    if (eqIndex === -1) {
      errors.push({
        severity: 'error',
        message: 'Invalid ENV line: missing "="',
        line: lineNo,
        suggestion: 'Use KEY=VALUE format',
      });
      // Cannot safely fix without guessing
      out.push(original);
      return;
    }

    const key = normalized.slice(0, eqIndex).trim();
    const value = normalized.slice(eqIndex + 1);

    if (key === '') {
      errors.push({
        severity: 'error',
        message: 'Invalid ENV assignment: empty key before "="',
        line: lineNo,
        suggestion: 'Provide a variable name before "="',
      });
      out.push(original);
      return;
    }

    if (!isLikelyKey(key)) {
      errors.push({
        severity: 'error',
        message: `Invalid ENV key: "${key}" (allowed: letters, numbers, underscore; cannot start with number)`,
        line: lineNo,
        suggestion: 'Rename the key to a valid identifier',
      });
      out.push(`${key}=${value}`);
      return;
    }

    // Detect suspicious whitespace around '=' that can break some parsers
    if (/\s=|=\s/.test(normalized.slice(0, eqIndex + 1))) {
      warnings.push({
        severity: 'warning',
        message: 'Whitespace around "=" may cause issues in strict parsers',
        line: lineNo,
        suggestion: `Normalize to ${key}=${value.trimStart()}`,
      });
      fixedIssues.push(`Line ${lineNo}: Trimmed whitespace around "="`);
    }

    // Remove spaces around '=' and preserve value as-is except left-trim when we normalized
    const fixedValue = value.replace(/^\s+/, '');
    out.push(`${key}=${fixedValue}`);

    // Warn on empty value
    if (fixedValue === '') {
      warnings.push({
        severity: 'warning',
        message: `Key "${key}" has an empty value`,
        line: lineNo,
        suggestion: 'Set a value or remove the variable if unused',
      });
    }
  });

  report.errorCount = errors.length;
  report.fixedIssues = fixedIssues;
  report.warnings = warnings.map((w) => w.message);

  const explanation =
    errors.length === 0
      ? 'No syntax errors detected. Normalization applied where safe.'
      : 'Errors detected. Fixed issues where safe, and returned normalized output.';

  return {
    errors: [...errors, ...warnings],
    fixedContent: out.join('\n'),
    explanation,
    report,
  };
}

module.exports = { analyzeEnv };
