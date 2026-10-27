#!/bin/bash
# Persistent Next.js HMR server — launchd KeepAlive / Terminal.
set -u
export PATH="/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:/opt/homebrew/opt/node@22/bin:${PATH:-}"
export AZZAM_LIVE=1
export WATCHPACK_POLLING=true
export CHOKIDAR_USEPOLLING=true
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-3456}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
LOG_DIR="$ROOT/.local-dev"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/dev.log"

exec >>"$LOG" 2>&1

echo ""
echo "======== $(date '+%Y-%m-%d %H:%M:%S') starting azzam-marin next-dev ========"
echo "URL http://${HOST}:${PORT}/dashboard"

if lsof -tiTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  lsof -tiTCP:"$PORT" -sTCP:LISTEN | xargs kill -9 2>/dev/null || true
  sleep 0.4
fi

rm -rf "$ROOT/.next/dev/lock" 2>/dev/null || true

# Unblock Next 16.4 initial watcher race
(
  sleep 5
  touch "$ROOT/src/app/layout.tsx" 2>/dev/null || true
) &

NEXT_BIN="$ROOT/node_modules/.bin/next"
exec "$NEXT_BIN" dev --hostname "$HOST" --port "$PORT"
