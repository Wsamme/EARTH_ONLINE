#!/usr/bin/env bash
# Run inside browser.sh so the local HTTP server's lifetime matches the render.
set -euo pipefail
cd "$(dirname "$0")/.."
python3 -m http.server 8061 --directory site >/tmp/li_heritage_http.log 2>&1 &
heritage_http_pid=$!
trap 'kill "$heritage_http_pid" 2>/dev/null || true' EXIT
export URL=http://127.0.0.1:8061/ LI_OUT=/workspace/eo_li_out/heritage
heritage_slugs="${3:-veeramakaliamman,srinivasa_perumal,abdul_gafoor,angullia_mosque,tan_teng_niah,indian_heritage_centre}"
node tools/li_compare.mjs "$heritage_slugs" --round "${1:-r2}" --hero
if [[ "${2:-}" == --details ]]; then node tools/li_heritage_views.mjs "$heritage_slugs"; fi
