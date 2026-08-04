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
         index.html privacy.html support.html manifest.json)

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

for path in "${PUBLISH[@]}"; do
  rsync -aL --exclude '.DS_Store' "$path" "$STAGE/"
done

npx wrangler pages deploy "$STAGE" --project-name lexly-heyitsmejosh --branch main
