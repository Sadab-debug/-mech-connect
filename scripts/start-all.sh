#!/bin/bash
# Start Flask backend in background
cd "$(dirname "$0")/.." 
(cd artifacts/mistrivai && FLASK_PORT=5001 python3 backend/run.py) &
FLASK_PID=$!

# Start API Server in background
pnpm --filter @workspace/api-server run dev &
API_PID=$!

# Start Vite frontend (foreground - this is the main web output)
pnpm --filter @workspace/mistrivai run dev

# Cleanup background processes on exit
kill $FLASK_PID $API_PID 2>/dev/null
