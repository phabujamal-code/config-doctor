# Config Doctor

Config Doctor is a production-ready local web application (frontend + backend) for **analyzing and safely fixing** developer configuration files:

- **.env**
- **JSON**
- **YAML**

It detects syntax and common mistakes, explains the issues clearly, generates a corrected/normalized version when possible, and produces a structured diagnostic report.

> **Stateless processing:** the backend does not store files or results.

---

## Tech Stack

- Frontend: **React + Vite**
- Backend: **Node.js + Express**
- No DB
- Monorepo with **npm workspaces**

---

## Quick Start (runs end-to-end)

### 1) Install

From the project root:

```bash
npm install
```

### 2) Configure env

Copy the example env files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3) Run

From the project root:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend:  http://localhost:5175
- Health check: http://localhost:5175/api/health

App routes (dev):
- Landing: http://localhost:5173/
- Tool:    http://localhost:5173/app
- Success: http://localhost:5173/success

App routes (prod example):
- Landing: https://configdoctor.com/
- Tool:    https://configdoctor.com/app
- Success: https://configdoctor.com/success

---

## API Documentation

Base URL (dev): `http://localhost:5175`

Base URL (prod example): `https://configdoctor.com`

In production, set `VITE_API_BASE_URL` and `CORS_ORIGIN` to your domain.

### `GET /api/health`
Returns service status.

### `POST /api/analyze/env`
### `POST /api/analyze/json`
### `POST /api/analyze/yaml`

Request body:

```json
{ "content": "...file content..." }
```

Response:

```json
{
  "ok": true,
  "errors": [
    {
      "severity": "error" | "warning",
      "message": "...",
      "line": 12,
      "suggestion": "..."
    }
  ],
  "fixedContent": "...normalized or repaired output (or null if not possible)...",
  "explanation": "...high-level summary...",
  "report": {
    "fileType": "ENV|JSON|YAML",
    "errorCount": 0,
    "fixedIssues": ["..."],
    "warnings": ["..."],
    "timestamp": "...ISO8601..."
  }
}
```

Notes:
- All processing is in-memory; no storage.
- `errors[]` includes both errors and warnings (distinguished by `severity`).

### `POST /api/track`
Lightweight telemetry endpoint (server logs only). Intended for launch debugging.

### `GET /api/premium/checkout`
Returns the configured Lemon Squeezy checkout URL:

```json
{ "ok": true, "checkoutUrl": "https://..." }
```

### `POST /api/webhooks/lemonsqueezy`
Lemon Squeezy webhook endpoint (raw body signature verification).

### `POST /api/premium/activate`
Temporary activation endpoint (lightweight) that issues a signed token after you paste a license key.

Request:
```json
{ "licenseKey": "..." }
```

Response:
```json
{ "ok": true, "token": "..." }
```

---

## Free vs Pro (Ready for Lemon Squeezy)

- **Free:** analysis + preview in the UI
- **Pro:** download fixed output + export reports

### What you need to configure

In `backend/.env` set:

```bash
LEMONSQUEEZY_CHECKOUT_URL=https://your-checkout-url
PREMIUM_JWT_SECRET=change_me
```

### How the Pro unlock works

1) User clicks **Buy Pro** -> backend returns `checkoutUrl` -> browser redirects.

2) After payment, user visits `/success` and pastes a license key to activate.

3) Backend issues a signed token; frontend stores it locally.

> You can later replace the activation step with webhook-based auto-unlock
> (no refactor needed). The analyzer endpoints stay unchanged.

---

## Project Structure

```
config-doctor/
  frontend/
  backend/
  README.md
```

---

## Production Notes

- Configure `backend/.env`:
  - `CORS_ORIGIN` should match your deployed frontend domain
- Configure `frontend/.env`:
  - `VITE_API_BASE_URL` should match your deployed backend

