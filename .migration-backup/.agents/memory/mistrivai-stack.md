---
name: MistriVai stack
description: Key architectural decisions for the MistriVai Bangladesh mechanics platform
---

## Flask prefix middleware
`run.py` has a `PrefixMiddleware` WSGI class that strips `/flask` prefix from incoming requests. This is required because the Replit path-based proxy routes `/flask/*` to Flask but does NOT strip the prefix before forwarding.

**Why:** Replit's artifact proxy sends requests with the full path including the prefix. `before_request` does NOT work for this — must be a WSGI middleware wrapping `app.wsgi_app`.

**How to apply:** Any new Flask service behind a path prefix in artifact.toml needs the same WSGI middleware pattern in its run.py.

## Vite config PORT/BASE_PATH
Both `artifacts/mistrivai/vite.config.ts` and `artifacts/mockup-sandbox/vite.config.ts` must NOT throw if PORT/BASE_PATH are missing — build pipeline runs without these env vars. Use `?? fallback` instead of throwing.

**Why:** `pnpm run build` runs vite build without PORT set, causing the build to fail if the config throws.

## DB
SQLite at `artifacts/mistrivai/backend/mistrivai.db` (dev). Default admin seeded only when DEFAULT_ADMIN_EMAIL/PASSWORD env vars are set in production. See env-secrets skill before deploying.

## Frontend API calls
All API calls use `/flask` prefix (configured in `src/lib/api.ts`). Vite dev proxy forwards `/flask` → `localhost:5001` with prefix stripped.
