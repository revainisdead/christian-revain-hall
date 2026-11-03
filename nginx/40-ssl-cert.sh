#!/bin/sh
# Runs on nginx container start (nginx image /docker-entrypoint.d hook).
# Points /etc/nginx/certs at the Let's Encrypt certificate when it exists; otherwise creates a
# throwaway self-signed one so nginx can start and serve the ACME challenge that gets the real one.
set -e
DOMAIN=christian-revain-hall.com
LIVE=/etc/letsencrypt/live/$DOMAIN
CERTS=/etc/nginx/certs
mkdir -p "$CERTS"

if [ -f "$LIVE/fullchain.pem" ]; then
    ln -sf "$LIVE/fullchain.pem" "$CERTS/fullchain.pem"
    ln -sf "$LIVE/privkey.pem" "$CERTS/privkey.pem"
    echo "ssl-cert: using Let's Encrypt certificate for $DOMAIN"
else
    rm -f "$CERTS/fullchain.pem" "$CERTS/privkey.pem"
    openssl req -x509 -nodes -newkey rsa:2048 -days 7 -subj "/CN=$DOMAIN" \
        -keyout "$CERTS/privkey.pem" -out "$CERTS/fullchain.pem" 2>/dev/null
    echo "ssl-cert: no Let's Encrypt certificate yet; using a temporary self-signed one (run: make certs-issue)"
fi
