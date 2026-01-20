import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { activatePremium, trackEvent } from '../lib/api.js';
import { setPremiumToken } from '../lib/premium.js';

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

export default function SuccessPage() {
  const q = useQuery();
  const navigate = useNavigate();
  const [licenseKey, setLicenseKey] = useState(q.get('license_key') || '');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    trackEvent('checkout_return');
  }, []);

  async function onActivate(e) {
    e.preventDefault();
    setErr('');
    const key = String(licenseKey || '').trim();
    if (!key) {
      setErr('Please paste your license key.');
      return;
    }
    setLoading(true);
    try {
      const data = await activatePremium(key);
      if (!data.token) throw new Error('Activation did not return a token');
      setPremiumToken(data.token);
      trackEvent('premium_activated');
      navigate('/app');
    } catch (e2) {
      setErr(e2?.message || 'Activation failed');
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
            <div className="subtitle">Payment completed. Activate Pro to unlock downloads.</div>
          </div>
        </div>
        <div className="right">
          <Link className="btn secondary" to="/">Home</Link>
          <Link className="btn" to="/app">Open Tool</Link>
        </div>
      </header>

      <main className="landingMain">
        <section className="card">
          <div className="sectionTitle">Activate Pro</div>
          <p className="muted">
            If Lemon Squeezy provided you a license key, paste it below. (You can replace this activation flow later with webhook-based auto-unlock.)
          </p>
          <form onSubmit={onActivate}>
            <input
              className="input"
              placeholder="Paste license key"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              autoComplete="off"
            />
            <div className="ctaRow">
              <button className="btn" type="submit" disabled={loading}>{loading ? 'Activating…' : 'Activate'}</button>
              <Link className="btn secondary" to="/app">Skip</Link>
            </div>
            {err ? <div className="alert danger">{err}</div> : null}
          </form>
        </section>
      </main>

      <footer className="footer">
        <div className="muted">Need help? Check README for payment wiring details.</div>
      </footer>
    </div>
  );
}
