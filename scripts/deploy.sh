#!/usr/bin/env bash
# Publish lexly to Cloudflare Pages (project `lexly-heyitsmejosh`).
#
# The Pages project is NOT git-connected, so `git push` deploys nothing —
# the site silently went 2 weeks stale that way. Run this instead.
#
# We stage into a temp dir rather than deploying the repo root because
# `ios/build*` blows past the Pages file-count limit.
set -euo pipefail
cd "$(dirname "$0")/.."

PUBLISH=(app css js content assets school functions
         index.html privacy.html support.html manifest.json _headers)

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

for path in "${PUBLISH[@]}"; do
  rsync -aL --exclude '.DS_Store' "$path" "$STAGE/"
done

npx wrangler pages deploy "$STAGE" --project-name lexly-heyitsmejosh --branch main

# Confirm the deploy actually landed. A silent no-op here is how the site went
# 2 weeks stale, which made three already-fixed bugs look unfixed for weeks.
# Check one file per asset class — a content-only canary would pass while a
# CSS or JS change sat stale, which is the same failure wearing a new hat.
# Edge propagation lags a few seconds, so retry rather than failing instantly.
# Images are their own asset class: the marketing screenshots went stale on
# 2026-08-19 and passed verify because only json/css/js were checked.
for asset in content/catalog.json css/lingo.css js/lingo-app.js assets/marketing/catalog.png assets/marketing/course.png; do
  LOCAL="$(md5 -q "$asset")"
  for attempt in 1 2 3 4 5 6; do
    # Cache-bust: /assets/* carries a 300s edge TTL (see _headers), far longer
    # than this retry window, so an uncached URL would compare against the edge's
    # stale copy — a false failure now, and a false pass before images were checked.
    LIVE="$(curl -fsS "https://lexly.heyitsmejosh.com/$asset?deployverify=$$-$attempt" | md5 -q)" || LIVE=""
    [ "$LIVE" = "$LOCAL" ] && break
    sleep 5
  done
  if [ "$LIVE" != "$LOCAL" ]; then
    echo "DEPLOY VERIFY FAILED: live $asset ($LIVE) != local ($LOCAL)" >&2
    exit 1
  fi
done
echo "deploy verified: live catalog.json, lingo.css, lingo-app.js, marketing screenshots all match local"
