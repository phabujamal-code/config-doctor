import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createCheckout, trackEvent } from '../lib/api.js';
import { isPremiumUnlocked } from '../lib/premium.js';

export default function LandingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    trackEvent('landing_view');
  }, []);

  async function onBuy() {
    setErr('');
    setLoading(true);
    try {
      trackEvent('buy_click');
      const data = await createCheckout();
      if (!data.checkoutUrl) throw new Error('Checkout URL not configured');
      window.location.href = data.checkoutUrl;
    } catch (e) {
      setErr(e?.message || 'Could not start checkout');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="landing">
      <header className="header">
        <div className="brand">
          <div>
            <div className="title">Config Doctor</div>
            <div className="subtitle">Fix broken .env, JSON, and YAML files in seconds — with a shareable report.</div>
          </div>
        </div>
        <div className="right">
          <Link className="btn secondary" to="/app" onClick={() => trackEvent('open_app_click')}>Open Tool</Link>
          {isPremiumUnlocked() ? (
            <button className="btn" onClick={() => navigate('/app')}>Premium Active</button>
          ) : (
            <button className="btn" onClick={onBuy} disabled={loading}>{loading ? 'Opening Checkout…' : 'Buy Pro'}</button>
          )}
        </div>
      </header>

      <main className="landingMain">
        <section className="hero">
          <h1>Stop losing hours to config errors.</h1>
          <p className="muted">
            Paste or upload your configuration file. Config Doctor diagnoses the problem, fixes it when possible, and generates a clean report.
          </p>
          <div className="ctaRow">
            <Link className="btn" to="/app" onClick={() => trackEvent('hero_try_free')}>Try Free</Link>
            <button className="btn secondary" onClick={onBuy} disabled={loading}>Unlock Pro</button>
          </div>
          {err ? <div className="alert danger">{err}</div> : null}
        </section>

        <section className="grid3">
          <div className="card">
            <div className="sectionTitle">1) Analyze</div>
            <div className="muted">Instant syntax + common-mistake detection for ENV/JSON/YAML.</div>
          </div>
          <div className="card">
            <div className="sectionTitle">2) Fix</div>
            <div className="muted">Auto-fix safe issues and output a clean, corrected file you can copy.</div>
          </div>
          <div className="card">
            <div className="sectionTitle">3) Report</div>
            <div className="muted">Pro users export a report for teammates and for quick debugging context.</div>
          </div>
        </section>

        <section className="pricing">
          <div className="card">
            <div className="sectionTitle">Pricing</div>
            <div className="kv">
              <div className="item">
                <div className="k">Free</div>
                <div className="v">Analyze + preview output</div>
              </div>
              <div className="item">
                <div className="k">Pro</div>
                <div className="v">Download fixed output + export report</div>
              </div>
            </div>
            <div className="hint">Tip: Pro is intentionally positioned as a productivity tool. If it saves you 10 minutes once, it paid for itself.</div>
          </div>
        </section>

        <section className="trust">
          <div className="card">
            <div className="sectionTitle">Privacy & Security</div>
            <div className="muted">
              Files are processed statelessly. Nothing is stored permanently. Avoid pasting secrets you cannot rotate.
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="muted">Config Doctor • Built for developers • No permanent storage</div>
      </footer>
    </div>
  );
}
