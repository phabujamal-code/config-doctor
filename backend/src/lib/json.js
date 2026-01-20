const { jsonrepair } = require('jsonrepair');
const { makeBaseReport } = require('./report');

function safeStringify(obj) {
  return JSON.stringify(obj, null, 2) + '\n';
}

function analyzeJson(content) {
  const report = makeBaseReport('JSON');
  const errors = [];
  const warnings = [];
  const fixedIssues = [];

  let parsed = null;
  let fixedContent = null;

  try {
    parsed = JSON.parse(content);
    fixedContent = safeStringify(parsed);
  } catch (e) {
    errors.push({
      severity: 'error',
      message: 'JSON syntax error: unable to parse JSON',
      suggestion: 'Fix trailing commas, missing quotes, or invalid characters',
    });

    // Attempt repair using jsonrepair (handles trailing commas, single quotes, unquoted keys, etc.)
    try {
      const repaired = jsonrepair(content);
      parsed = JSON.parse(repaired);
      fixedContent = safeStringify(parsed);
      fixedIssues.push('Applied automatic JSON repair (jsonrepair)');
    } catch (repairErr) {
      // Not fixable automatically
      fixedContent = null;
    }
  }

  // Heuristics on parsed content
  if (parsed && typeof parsed === 'object') {
    // Warn on duplicate keys not detectable post-parse; but warn if content contains likely duplicates by regex
    const duplicateKeyHints = findLikelyDuplicateKeys(content);
    if (duplicateKeyHints.length > 0) {
      warnings.push({
        severity: 'warning',
        message: `Potential duplicate keys detected (JSON keeps last value): ${duplicateKeyHints.slice(0, 5).join(', ')}`,
        suggestion: 'Remove duplicates to avoid unexpected overrides',
      });
      report.warnings.push('Potential duplicate keys detected');
    }

    // Warn if top-level is array and very large
    if (Array.isArray(parsed) && parsed.length > 5000) {
      warnings.push({
        severity: 'warning',
        message: 'Large top-level array detected; consider splitting for readability and performance',
        suggestion: 'Consider pagination or chunking',
      });
    }
  }

  report.errorCount = errors.length;
  report.fixedIssues = fixedIssues;
  report.warnings = [...(report.warnings || []), ...warnings.map((w) => w.message)];

  const explanation =
    errors.length === 0
      ? 'Valid JSON. Output is normalized with 2-space indentation.'
      : fixedContent
        ? 'Invalid JSON detected. Automatically repaired and normalized output generated.'
        : 'Invalid JSON detected. Automatic repair was not possible; review the error and fix manually.';

  return {
    errors: [...errors, ...warnings],
    fixedContent,
    explanation,
    report,
  };
}

function findLikelyDuplicateKeys(raw) {
  // Quick heuristic: captures keys in objects: "key": or 'key': or key:
  // Not perfect; for diagnostics only.
  const keyRegex = /[\{,]\s*(?:"([^"]+)"|'([^']+)'|([A-Za-z_][A-Za-z0-9_\-]*))\s*:/g;
  const counts = new Map();
  let match;
  while ((match = keyRegex.exec(raw)) !== null) {
    const key = match[1] || match[2] || match[3];
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].filter(([, c]) => c > 1).map(([k]) => k);
}

module.exports = { analyzeJson };
