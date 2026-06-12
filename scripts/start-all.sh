#!/bin/bash
# Start Flask backend in background
cd "$(dirname "$0")/.." 
(cd artifacts/mistrivai && FLASK_PORT=5001 python3 backend/run.py) &
FLASK_PID=$!

# Start Vite frontend (foreground - this is the main web output)
PORT=25062 BASE_PATH=/ pnpm --filter @workspace/mistrivai run dev

# Cleanup background processes on exit
kill $FLASK_PID 2>/dev/null
