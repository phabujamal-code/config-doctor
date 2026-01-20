const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const analyzeRoutes = require('./routes/analyze');
const lemonSqueezyWebhookRoutes = require('./routes/lemonsqueezy');
const jwt = require('jsonwebtoken');

const app = express();

const PORT = Number(process.env.PORT || 5174);

// ---------- Webhooks (MUST be raw body for signature verification) ----------
// NOTE: This route is mounted BEFORE express.json() to preserve the raw payload.
app.use(
  '/api/webhooks/lemonsqueezy',
  express.raw({ type: 'application/json', limit: '2mb' })
);
app.use('/api/webhooks/lemonsqueezy', lemonSqueezyWebhookRoutes);

// ---------- Standard JSON API ----------
app.use(express.json({ limit: '2mb' }));

const rawOrigins = process.env.CORS_ORIGIN || 'http://localhost:5173';
const ALLOWED_ORIGINS = rawOrigins
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // allow non-browser tools (curl/postman) that have no origin
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ---------- HEALTH CHECK (REQUIRED FOR PROD) ----------
app.get('/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'Config Doctor API',
    timestamp: new Date().toISOString(),
  });
});

// ---------- API ROUTES ----------
app.use('/api/analyze', analyzeRoutes);

// Minimal telemetry endpoint (server logs only)
app.post('/api/track', (req, res) => {
  const body = req.body || {};
  const event = String(body.event || '').trim();
  const ts = body.ts || new Date().toISOString();
  if (event) console.log(`[track] ${ts} ${event}`, body.props || {});
  res.json({ ok: true });
});

// Premium (minimal MVP)
app.get('/api/premium/checkout', (_req, res) => {
  const checkoutUrl = process.env.LEMONSQUEEZY_CHECKOUT_URL || '';
  res.json({ ok: true, checkoutUrl });
});

// NOTE: Temporary license activation flow (MVP)
app.post('/api/premium/activate', (req, res, next) => {
  try {
    const key = String(req.body?.licenseKey || '').trim();
    if (!key) {
      const err = new Error('Missing license key');
      err.statusCode = 400;
      throw err;
    }
    if (key.length < 8) {
      const err = new Error('License key looks invalid');
      err.statusCode = 400;
      throw err;
    }

    const secret = process.env.PREMIUM_JWT_SECRET;
    if (!secret || secret.length < 24) {
      const err = new Error('PREMIUM_JWT_SECRET is not set or too weak');
      err.statusCode = 500;
      throw err;
    }

    const token = jwt.sign(
      { premium: true, keyHash: Buffer.from(key).toString('base64').slice(0, 16) },
      secret,
      { expiresIn: '365d' }
    );

    res.json({ ok: true, token });
  } catch (e) {
    next(e);
  }
});

// ---------- ERROR HANDLER ----------
app.use((err, _req, res, _next) => {
  const status = err.statusCode || 500;
  const message = status === 500 ? 'Internal server error' : err.message;
  res.status(status).json({
    ok: false,
    error: { message, details: err.details || undefined },
  });
});

// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`Config Doctor API listening on http://localhost:${PORT}`);
});
