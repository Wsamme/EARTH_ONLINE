#!/usr/bin/env bash
# Build and review a fixed commerce revision while holding the shared browser lock.
set -euo pipefail
commerce_round=${1:-r2}
export LI_ROUND="$commerce_round" LI_OUT=/workspace/eo_li_out/commerce URL=http://127.0.0.1:8062/
exec bash src/lm33/kit/browser.sh bash -c '
 set -euo pipefail
 bash tools/bv_build.sh --test
 python3 -m http.server 8062 --directory site >/tmp/li_commerce_http.log 2>&1 &
 commerce_http_pid=$!
 trap '\''kill "$commerce_http_pid" 2>/dev/null || true'\'' EXIT
 node tools/li_commerce_audit.cjs
 python3 tools/li_commerce_roads.py
 node tools/li_commerce_review.mjs
'
