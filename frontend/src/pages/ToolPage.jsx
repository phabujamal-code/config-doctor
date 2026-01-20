import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { analyze, createCheckout, healthCheck, trackEvent, API_BASE } from '../lib/api.js';
import { clearPremium, isPremiumUnlocked } from '../lib/premium.js';

const TABS = [
  { id: 'env', label: 'ENV (.env)' },
  { id: 'json', label: 'JSON' },
  { id: 'yaml', label: 'YAML' },
];

function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function severityMeta(sev) {
  if (sev === 'error') return { label: 'Error', className: 'badge danger' };
  return { label: 'Warning', className: 'badge warn' };
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modalBackdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <div className="sectionTitle">{title}</div>
          <button className="btn secondary" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function ToolPage() {
  const [active, setActive] = useState('env');
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState({ ok: null, message: '' });
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [premiumUnlocked, setPremiumUnlocked] = useState(isPremiumUnlocked());
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutErr, setCheckoutErr] = useState('');

  const placeholder = useMemo(() => {
    if (active === 'env') return '# Paste your .env content here\nAPI_KEY=...\nNODE_ENV=development\n';
    if (active === 'json') return '{\n  "name": "example",\n  "enabled": true\n}\n';
    return 'server:\n  port: 3000\n  host: localhost\n';
  }, [active]);

  useEffect(() => {
    trackEvent('tool_view');
    let mounted = true;
    healthCheck()
      .then((d) => mounted && setApiStatus({ ok: true, message: `API connected (${d.service})` }))
      .catch(() => mounted && setApiStatus({ ok: false, message: `API not reachable at ${API_BASE}` }));
    return () => {
      mounted = false;
    };
  }, []);

  async function onAnalyze() {
    setErrorMsg('');
    setResult(null);

    const trimmed = content.trim();
    if (!trimmed) {
      setErrorMsg('Please paste content or upload a file.');
      return;
    }

    setLoading(true);
    try {
      trackEvent('analyze_click', { type: active });
      const data = await analyze(active, content);
      setResult(data);
      trackEvent('analyze_success', { type: active, errors: (data.errors || []).length });
    } catch (e) {
      setErrorMsg(e?.message || 'Analysis failed');
      trackEvent('analyze_error', { type: active });
    } finally {
      setLoading(false);
    }
  }

  function onFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      setContent(text);
      trackEvent('file_upload', { name: file.name, size: file.size });
    };
    reader.readAsText(file);
  }

  async function onBuy() {
    setCheckoutErr('');
    setCheckoutLoading(true);
    try {
      const data = await createCheckout();
      if (!data.checkoutUrl) throw new Error('Checkout URL not configured');
      window.location.href = data.checkoutUrl;
    } catch (e) {
      setCheckoutErr(e?.message || 'Could not start checkout');
    } finally {
      setCheckoutLoading(false);
    }
  }

  function requirePremium(actionName, fn) {
    if (!premiumUnlocked) {
      trackEvent('locked_action', { action: actionName });
      setPaywallOpen(true);
      return;
    }
    fn();
  }

  const reportText = useMemo(() => {
    if (!result?.report) return '';
    const r = result.report;
    const lines = [];
    lines.push(`Config Doctor Diagnostic Report`);
    lines.push(`-----------------------------`);
    lines.push(`File Type: ${r.fileType}`);
    lines.push(`Timestamp: ${r.timestamp}`);
    lines.push(`Error Count: ${r.errorCount}`);
    lines.push('');
    if (Array.isArray(r.fixedIssues) && r.fixedIssues.length) {
      lines.push('Fixed Issues:');
      r.fixedIssues.forEach((x) => lines.push(`- ${x}`));
      lines.push('');
    }
    if (Array.isArray(r.warnings) && r.warnings.length) {
      lines.push('Warnings:');
      r.warnings.forEach((x) => lines.push(`- ${x}`));
      lines.push('');
    }
    lines.push('Explanation:');
    lines.push(result.explanation || '');
    return lines.join('\n');
  }, [result]);

  const errorCount = useMemo(() => {
    const list = result?.errors || [];
    return list.filter((e) => e.severity === 'error').length;
  }, [result]);

  const warningCount = useMemo(() => {
    const list = result?.errors || [];
    return list.filter((e) => e.severity === 'warning').length;
  }, [result]);

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div>
            <div className="title">Config Doctor</div>
            <div className="subtitle">Analyze, diagnose, and safely fix .env, JSON, and YAML configs.</div>
          </div>
        </div>

        <div className="right">
          <Link className="btn secondary" to="/">Home</Link>
          <span className={`badge ${apiStatus.ok ? 'ok' : apiStatus.ok === false ? 'danger' : ''}`}>
            {apiStatus.ok === null ? 'Checking API…' : apiStatus.message}
          </span>
          {premiumUnlocked ? (
            <button
              className="btn secondary"
              onClick={() => {
                clearPremium();
                setPremiumUnlocked(false);
                trackEvent('premium_cleared');
              }}
              title="For testing only"
            >
              Premium Active
            </button>
          ) : (
            <button className="btn" onClick={() => setPaywallOpen(true)}>Unlock Pro</button>
          )}
        </div>
      </header>

      <main className="layout">
        <section className="panel">
          <div className="tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`tab ${active === t.id ? 'active' : ''}`}
                onClick={() => {
                  setActive(t.id);
                  setResult(null);
                  setErrorMsg('');
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="inputRow">
            <div className="file">
              <input
                type="file"
                onChange={onFileUpload}
                accept={
                  active === 'env'
                    ? '.env,text/plain'
                    : active === 'json'
                      ? '.json,application/json,text/plain'
                      : '.yaml,.yml,text/yaml,text/plain'
                }
              />
              <div className="muted">{fileName ? `Loaded: ${fileName}` : 'Upload a file (optional)'} </div>
            </div>
            <button className="btn" onClick={onAnalyze} disabled={loading}>
              {loading ? 'Analyzing…' : 'Analyze & Fix'}
            </button>
          </div>

          {errorMsg ? <div className="alert danger">{errorMsg}</div> : null}

          <textarea
            className="editor"
            placeholder={placeholder}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={false}
          />

          <div className="hint">Processing is stateless. Nothing is stored permanently.</div>
        </section>

        <section className="panel">
          <div className="sectionTitle">Results</div>

          {!result ? (
            <div className="muted">Run “Analyze & Fix” to generate diagnostics and corrected output.</div>
          ) : (
            <>
              <div className="kv">
                <div className="item">
                  <div className="k">File type</div>
                  <div className="v">{result.report?.fileType || active.toUpperCase()}</div>
                </div>
                <div className="item">
                  <div className="k">Errors</div>
                  <div className="v">{errorCount}</div>
                </div>
                <div className="item">
                  <div className="k">Warnings</div>
                  <div className="v">{warningCount}</div>
                </div>
                <div className="item">
                  <div className="k">Timestamp</div>
                  <div className="v">{result.report?.timestamp || '-'}</div>
                </div>
              </div>

              <div className="section">
                <div className="row">
                  <div className="sectionTitle">Diagnostic Summary</div>
                  <div className="muted">{result.explanation}</div>
                </div>
              </div>

              <div className="section">
                <div className="row">
                  <div className="sectionTitle">Issues</div>
                  <span className={`badge ${errorCount ? 'danger' : 'ok'}`}>{errorCount ? 'Action required' : 'Looks good'}</span>
                </div>
                <div className="list">
                  {(result.errors || []).length === 0 ? (
                    <div className="muted">No issues detected.</div>
                  ) : (
                    (result.errors || []).map((e, i) => {
                      const meta = severityMeta(e.severity);
                      return (
                        <div key={i} className="listItem">
                          <div className="row">
                            <span className={meta.className}>{meta.label}</span>
                            {typeof e.line === 'number' ? <span className="badge">Line {e.line}</span> : null}
                          </div>
                          <div className="liTitle">{e.message}</div>
                          {e.suggestion ? <div className="muted">Suggestion: {e.suggestion}</div> : null}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="section">
                <div className="row">
                  <div className="sectionTitle">Fixed Output</div>
                  <div className="row">
                    <button
                      className="btn secondary"
                      onClick={() => {
                        if (!result.fixedContent) return;
                        navigator.clipboard.writeText(result.fixedContent);
                        trackEvent('copy_fixed');
                      }}
                      disabled={!result.fixedContent}
                    >
                      Copy
                    </button>
                    <button
                      className={`btn ${premiumUnlocked ? '' : 'locked'}`}
                      onClick={() =>
                        requirePremium('download_fixed', () => {
                          downloadText(`fixed.${active === 'env' ? 'env' : active}`, result.fixedContent || '');
                          trackEvent('download_fixed');
                        })
                      }
                      disabled={!result.fixedContent}
                      title={premiumUnlocked ? 'Download fixed file' : 'Locked: requires Pro'}
                    >
                      Download Fixed
                    </button>
                  </div>
                </div>
                <div className="codeBlock">{result.fixedContent || 'No fixed output available.'}</div>
              </div>

              <div className="section">
                <div className="row">
                  <div className="sectionTitle">Report Export</div>
                  <div className="row">
                    <button
                      className={`btn ${premiumUnlocked ? '' : 'locked'}`}
                      onClick={() =>
                        requirePremium('export_txt', () => {
                          downloadText('config-doctor-report.txt', reportText);
                          trackEvent('export_txt');
                        })
                      }
                      title={premiumUnlocked ? 'Export report as text' : 'Locked: requires Pro'}
                    >
                      Export TXT
                    </button>
                    <button
                      className={`btn ${premiumUnlocked ? '' : 'locked'}`}
                      onClick={() =>
                        requirePremium('export_json', () => {
                          downloadText('config-doctor-report.json', JSON.stringify(result.report || {}, null, 2));
                          trackEvent('export_json');
                        })
                      }
                      title={premiumUnlocked ? 'Export report as JSON' : 'Locked: requires Pro'}
                    >
                      Export JSON
                    </button>
                  </div>
                </div>
                <div className="codeBlock">{JSON.stringify(result.report || {}, null, 2)}</div>
              </div>
            </>
          )}
        </section>
      </main>

      <footer className="footer">
        <div className="muted">Config Doctor • No permanent storage • API: {API_BASE}</div>
      </footer>

      {paywallOpen ? (
        <Modal title="Unlock Pro" onClose={() => setPaywallOpen(false)}>
          <div className="muted">
            Pro unlocks downloads and report exports. Payment is handled by Lemon Squeezy (Merchant of Record).
          </div>
          <div className="section" style={{ marginTop: 12 }}>
            <div className="kv">
              <div className="item">
                <div className="k">Free</div>
                <div className="v">Analyze + preview</div>
              </div>
              <div className="item">
                <div className="k">Pro</div>
                <div className="v">Downloads + report export</div>
              </div>
            </div>
          </div>
          <div className="ctaRow">
            <button className="btn" onClick={onBuy} disabled={checkoutLoading}>
              {checkoutLoading ? 'Opening Checkout…' : 'Buy Pro'}
            </button>
            <Link className="btn secondary" to="/success">I have a license key</Link>
          </div>
          {checkoutErr ? <div className="alert danger">{checkoutErr}</div> : null}
          <div className="hint">You can replace this activation flow later with webhook auto-unlock.</div>
        </Modal>
      ) : null}
    </div>
  );
}
