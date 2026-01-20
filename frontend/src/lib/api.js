const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5174';

export async function healthCheck() {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function analyze(type, content) {
  const endpoint = type === 'env' ? 'env' : type === 'json' ? 'json' : 'yaml';
  const res = await fetch(`${API_BASE}/api/analyze/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.error?.message || 'Request failed';
    throw new Error(msg);
  }
  return data;
}

export async function createCheckout() {
  const res = await fetch(`${API_BASE}/api/premium/checkout`);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.error?.message || 'Checkout request failed';
    throw new Error(msg);
  }
  return data;
}

export async function activatePremium(licenseKey) {
  const res = await fetch(`${API_BASE}/api/premium/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ licenseKey }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.error?.message || 'Activation failed';
    throw new Error(msg);
  }
  return data;
}

export async function trackEvent(event, props = {}) {
  // Non-blocking analytics; failures are ignored.
  try {
    await fetch(`${API_BASE}/api/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, props, ts: new Date().toISOString() }),
    });
  } catch (_) {
    // ignore
  }
}

export { API_BASE };
