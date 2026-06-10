---
name: MistriVai project stack
description: Key facts about the MistriVai mechanics booking app architecture and constraints
---

# MistriVai Stack

## Architecture
- **Frontend**: Vite + React + wouter, served at `/`, port 25062 via `pnpm --filter @workspace/mistrivai run dev`
- **Backend**: Flask Python app at `artifacts/mistrivai/backend/`, served at `/flask` path on port 5001
- **Mobile**: Expo app exists in `.migration-backup/artifacts/mistrivai-mobile/` but could NOT be created as an artifact (hit 7-artifact limit during migration)

## Flask Backend
- Uses SQLite by default; switches to PostgreSQL when `DATABASE_URL` env var is set
- `SESSION_SECRET_KEY` env var needed for persistent sessions (random key used otherwise)
- Pusher integration optional (PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER)
- Flask workflow: "MistriVai Flask Backend" running `cd artifacts/mistrivai && FLASK_PORT=5001 python3 backend/run.py`

## Theme
- Color palette: purple primary (#7e57c2 / HSL 262 52% 56%) + teal accent (#20c997 / HSL 161 69% 44%)
- Font: Poppins (primary) + Inter (fallback)
- Target market: Bangladesh vehicle repair marketplace

**Why:** Migration backup artifacts counted toward artifact limit, preventing mobile app creation. Flask registered as standalone workflow instead of artifact.toml service due to duplicate preview path conflict from backup artifacts.
