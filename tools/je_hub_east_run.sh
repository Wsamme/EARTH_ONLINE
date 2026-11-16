#!/usr/bin/env bash
# Start this worker's local server only after acquiring the shared browser lock.
set -euo pipefail
cd "$(dirname "$0")/.."
export JE_OUT="${JE_OUT:-/workspace/eo_je_out/hub_east}"
exec bash src/lm33/kit/browser.sh bash -c '
  set -euo pipefail
  python3 -m http.server 8052 --directory site > /tmp/je_hub_east_http.log 2>&1 &
  task_http_pid=$!
  trap '\''kill "$task_http_pid" 2>/dev/null || true'\'' EXIT
  sleep 1
  export URL=http://127.0.0.1:8052/
  node "$@"
  if [[ "${JE_VERIFY:-0}" == 1 ]]; then node tools/je_hub_east_verify.mjs; fi
' -- "$@"
