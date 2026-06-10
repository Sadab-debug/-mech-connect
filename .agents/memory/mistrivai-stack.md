---
name: MistriVai project stack
description: Architecture, deployment setup, and key decisions for the MistriVai mechanics booking app
---

## Stack
- Frontend: Vite + React + Wouter + shadcn/ui at artifact `artifacts/mistrivai` (path `/`)
- Backend: Flask + SQLAlchemy at `artifacts/mistrivai/backend/`
- DB: PostgreSQL (DATABASE_URL env var), tables auto-created via `db.create_all()` on startup
- API Server: Node.js/Express at `artifacts/api-server` (path `/api`)

## Production Architecture (critical)
In production only the API Server artifact runs — the Flask workflow does NOT run separately.
Fix: `artifacts/api-server/src/index.ts` spawns Flask as a subprocess (`python3 run.py` in `../../mistrivai/backend/`).
`artifacts/api-server/src/app.ts` proxies all `/api/*` requests (except `/api/healthz`) to `http://127.0.0.1:5001/flask`.

**Why:** Replit deployment only runs registered artifacts, not dev-only workflows. Flask must be started by the API Server subprocess.

## Dev vs Production API routing
- `artifacts/mistrivai/src/lib/api.ts`: `FLASK_BASE = DEV ? '/flask' : '/api'`
- In dev: Vite proxies `/flask` → Flask on port 5001 (via `MistriVai Flask Backend` workflow)
- In prod: Node.js API Server at `/api` proxies to Flask subprocess on 5001

## Admin Seeding
Flask `app.py` reads `DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PASSWORD`, `DEFAULT_ADMIN_USERNAME`, `DEFAULT_ADMIN_FULL_NAME` env vars on startup and creates admin if not exists.
Admin: admin@mistrivai.connect / Admin@1234 (set as env vars)

## Flask prefix middleware
`run.py` wraps Flask with `PrefixMiddleware(prefix='/flask')` — strips `/flask` from paths so Flask routes are plain (e.g. `/signup` not `/flask/signup`).
Port: `FLASK_PORT` env var, default 5001.

## Required secrets
- `SESSION_SECRET_KEY` — Flask session secret
- `DATABASE_URL` — PostgreSQL (auto-provisioned by Replit)
- `DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PASSWORD` — admin seeding
