#!/bin/bash
set -e

WORKSPACE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PYTHON="$WORKSPACE_ROOT/.pythonlibs/bin/python3"

if [ ! -f "$PYTHON" ]; then
  PYTHON="$(which python3)"
fi

echo "[MistriVai] Starting Flask backend on port 5001..."
cd "$WORKSPACE_ROOT"
FLASK_PORT=5001 PYTHONPATH="$WORKSPACE_ROOT/.pythonlibs/lib/python3.11/site-packages:${PYTHONPATH:-}" \
  "$PYTHON" artifacts/mistrivai/backend/run.py &
FLASK_PID=$!

echo "[MistriVai] Starting Vite dev server on port 25062..."
PORT=25062 BASE_PATH=/ pnpm --filter @workspace/mistrivai run dev &
VITE_PID=$!

wait_for_port() {
  local port=$1
  local name=$2
  for i in $(seq 1 30); do
    if curl -s "http://localhost:$port" > /dev/null 2>&1; then
      echo "[MistriVai] $name is ready on port $port"
      return 0
    fi
    sleep 1
  done
  echo "[MistriVai] Warning: $name did not respond on port $port"
}

wait $VITE_PID

kill $FLASK_PID 2>/dev/null
