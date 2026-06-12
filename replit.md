# MistriVai (EasyMistri)

A platform connecting users with mechanics for vehicle repairs, bookings, and emergency services. Users can browse mechanics, book appointments, chat, and request emergency help. Mechanics can manage their schedules and bookings. Admins have a dashboard for oversight.

## Run & Operate

- **Start app**: Run the `MistriVai Flask Backend` workflow (starts both Flask + Vite dev server)
- Flask backend: `http://localhost:5001` — REST API
- Vite dev frontend: `http://localhost:25062` — React UI (webview)

### Build for production
```
pnpm --filter @workspace/mistrivai run build
gunicorn --bind 0.0.0.0:5000 --reuse-port main:app
```

## Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, shadcn/ui (Radix UI), Wouter (routing), TanStack Query, Framer Motion
- **Backend**: Flask (Python 3.11), Flask-SQLAlchemy, Flask-CORS, Pusher (optional real-time)
- **Database**: PostgreSQL via `DATABASE_URL` env var (falls back to SQLite `easymistri.db`)
- **Auth**: Custom session-based auth (Flask sessions) — roles: `user`, `mechanic`, `admin`

## Where things live

- `artifacts/mistrivai/src/` — React frontend source
- `artifacts/mistrivai/backend/app.py` — All Flask routes (1000+ lines)
- `artifacts/mistrivai/backend/models.py` — SQLAlchemy models
- `artifacts/mistrivai/backend/run.py` — Flask entry point (runs on port 5001 in dev)
- `artifacts/mistrivai/dist/public/` — Built frontend (served by Flask in production)
- `main.py` — Production entry point (imports Flask app, served via gunicorn on port 5000)
- `scripts/start-all.sh` — Dev startup script (starts Flask + Vite in parallel)

## Architecture decisions

- **Dev**: Vite dev server (port 25062) proxies API calls to Flask (port 5001) directly
- **Production**: gunicorn runs Flask on port 5000, which also serves the built React dist as static files
- **API base URL**: Frontend uses relative paths (no `/flask` or `/api` prefix) — routes map directly to Flask
- **No Node.js wrapper in production**: The `artifacts/api-server` Express wrapper is not used; Flask handles everything directly

## Seeded admin account

- Email: `admin@easymistri.login`
- Password: `Admin@1234`
- (Configured via `DEFAULT_ADMIN_EMAIL` / `DEFAULT_ADMIN_PASSWORD` env vars)

## Required env vars

- `DATABASE_URL` — PostgreSQL connection string (optional; SQLite fallback used if absent)
- `SESSION_SECRET_KEY` — Flask session signing key (auto-generated if absent, but sessions won't survive restarts)
- `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER` — optional, for real-time features

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Python packages are in `.pythonlibs/` — the startup script explicitly uses `.pythonlibs/bin/python3`
- The `PrefixMiddleware` in `run.py` was removed; Flask now handles routes without any path prefix
- Vite proxy entries in `vite.config.ts` must cover all Flask route prefixes for dev to work correctly
