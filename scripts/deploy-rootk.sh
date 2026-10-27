#!/usr/bin/env bash
# Deploy AZZAM MARINE ERP to rootk-prev VPS (azzam.rootk-eg.com).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export PATH="/usr/bin:/bin:/usr/sbin:/sbin:${PATH}"

HOST="${AZZAM_SSH_HOST:-rootk-prev-vps}"
REMOTE_ROOT="${AZZAM_REMOTE_PATH:-/var/www/azzam-marin}"
DOMAIN="${AZZAM_DOMAIN:-azzam.rootk-eg.com}"
APP_PORT="${AZZAM_PORT:-3050}"
PM2_NAME="${AZZAM_PM2_NAME:-azzam-marine-web}"

echo "==> Rsync -> ${HOST}:${REMOTE_ROOT}"
ssh -o BatchMode=yes "$HOST" "mkdir -p '${REMOTE_ROOT}'"
rsync -az --delete \
  --chmod=Du=rwx,Dgo=rx,Fu=rw,Fgo=r \
  --exclude '.git/' \
  --exclude 'node_modules/' \
  --exclude '.next/' \
  --exclude '.local-dev/' \
  --exclude '.cursor/' \
  --exclude '.env' \
  --exclude '.env.local' \
  --exclude '.env.production' \
  --exclude '.DS_Store' \
  --exclude 'public/dev-build.json' \
  -e 'ssh -o BatchMode=yes' \
  ./ "${HOST}:${REMOTE_ROOT}/"

echo "==> Install, build, nginx, pm2, SSL on ${HOST}"
ssh -o BatchMode=yes "$HOST" bash -s -- "$REMOTE_ROOT" "$DOMAIN" "$APP_PORT" "$PM2_NAME" <<'REMOTE'
set -euo pipefail
REMOTE_ROOT="$1"
DOMAIN="$2"
APP_PORT="$3"
PM2_NAME="$4"

cd "$REMOTE_ROOT"
echo ">>> npm ci"
npm ci --omit=dev=false
echo ">>> next build"
NODE_ENV=production npm run build

NGINX_AVAIL="/etc/nginx/sites-available/${DOMAIN}"
NGINX_ENABLED="/etc/nginx/sites-enabled/${DOMAIN}"

cat > "$NGINX_AVAIL" <<NGX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    location ^~ /.well-known/acme-challenge/ {
        root /var/www/certbot;
        allow all;
    }

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
    }
}
NGX

ln -sfn "$NGINX_AVAIL" "$NGINX_ENABLED"
nginx -t
systemctl reload nginx

echo ">>> pm2 ${PM2_NAME} on :${APP_PORT}"
pm2 delete "$PM2_NAME" 2>/dev/null || true
cd "$REMOTE_ROOT"
NODE_ENV=production pm2 start ./node_modules/next/dist/bin/next \
  --name "$PM2_NAME" \
  --cwd "$REMOTE_ROOT" \
  -- start -H 127.0.0.1 -p "$APP_PORT"
pm2 save

if ! command -v certbot >/dev/null 2>&1; then
  echo "certbot missing — HTTP only for now"
  exit 0
fi

echo ">>> certbot ${DOMAIN}"
certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos -m info@rootk-eg.com --redirect || {
  echo "WARN: certbot failed; site may still be reachable on HTTP"
}

nginx -t
systemctl reload nginx
echo ">>> remote deploy done"
REMOTE

echo "==> Done — https://${DOMAIN}"
