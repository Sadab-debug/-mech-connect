---
name: MistriVai project stack
description: Tech stack, proxy setup, known bugs and fixes for the MistriVai mechanics booking platform
---

# MistriVai Stack

Flask+SQLAlchemy backend in `artifacts/mistrivai/backend/app.py`.
Vite+React frontend in `artifacts/mistrivai/src/`.
Node.js API Server in `artifacts/api-server/` proxies `/api/*` to Flask.

## Dev Setup
- Flask runs on port 5001 via "MistriVai Flask Backend" workflow
- Vite proxies `/flask` prefix to Flask port 5001
- Node.js API Server runs on port assigned by PORT env var

## Production Setup
- API Server spawns Flask subprocess using `/home/runner/workspace/.pythonlibs/bin/python3`
- workspaceRoot = join(__dirname, '..', '..', '..') from dist/
- flaskDir = workspaceRoot/artifacts/mistrivai/backend
- FLASK_PORT = 5001

## Session / Auth
- Flask sessions use SESSION_SECRET_KEY env var
- Sessions work because browser always hits Node.js proxy (same-origin), not Flask directly
- CORS not an issue in production (proxy handles it)

## Booking Flow
- User creates booking → status='requested'
- Mechanic can: accept (→confirmed), reject (→rejected), or send counter_offer
- When mechanic sends counter: user sees amber banner in MyBookings with Accept/Decline
  - Accept: POST /bookings/<id>/counter-accept → offer=counter_offer, status=confirmed
  - Decline: POST /bookings/<id>/counter-reject → status=rejected, clears counter fields
- User marks confirmed booking as complete: POST /bookings/<id>/complete

## Chat
- IDs use prefixed format: "user_1", "mechanic_5"
- Conversations grouped by peer in /chat/conversations
- Read marking in get_messages MUST filter by sender_id=conversation_id (not all unread)
- Chat.tsx has searchable user-picker modal (+New Chat button) not blind users[0]

## Known remaining issues
- No real-time Pusher listener in frontend (messages require refresh)
- Migration backup workflows in .migration-backup/ all fail — expected/ignore
