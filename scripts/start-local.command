#!/bin/bash
set -u
export PATH="/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:/opt/homebrew/opt/node@22/bin:$PATH"
export AZZAM_LIVE=1
cd "$(dirname "$0")/.."
echo "=============================================="
echo " AZZAM MARINE — local server (auto-refresh)"
echo " http://127.0.0.1:3456/dashboard"
echo " Keep this Terminal window OPEN."
echo " Save any file under src/ → rebuild → browser reloads."
echo "=============================================="
echo
while true; do
  if lsof -tiTCP:3456 -sTCP:LISTEN >/dev/null 2>&1; then
    lsof -tiTCP:3456 -sTCP:LISTEN | xargs kill -9 2>/dev/null || true
    sleep 0.3
  fi
  node scripts/live-server.mjs
  echo "[azzam] live-server exited — restarting in 1s…"
  sleep 1
done
