#!/usr/bin/env bash
# Atomically regenerate the production Singapore page and optional appshot copy.
set -euo pipefail
TASK_ROOT=$(cd "$(dirname "$0")/.." && pwd)
TASK_BUILD=$(mktemp -d "${TMPDIR:-/tmp}/earth-online-bv.XXXXXX")
trap 'rm -rf "$TASK_BUILD"' EXIT
cd "$TASK_ROOT"
CITY=sg python3 src/sgreal/patch17.py src/city-brush-v16.html "$TASK_BUILD/index.html"
python3 - "$TASK_BUILD" <<'PY'
import re, sys
from pathlib import Path
p = Path(sys.argv[1])
s = (p/'index.html').read_text()
(p/'app.js').write_text(max(re.findall(r'<script>(.*?)</script>', s, re.S), key=len))
PY
node --check "$TASK_BUILD/app.js"
cp "$TASK_BUILD/index.html" site/index.html
if [[ "${1:-}" == "--test" ]]; then
  BV_VENDOR="${BV_VENDOR:-${TMPDIR:-/tmp}/earth-online-vendor}"
  mkdir -p "$BV_VENDOR/package/build" "$BV_VENDOR/package/examples/js/controls"
  [[ -s "$BV_VENDOR/package/build/three.min.js" ]] || curl -fsSL https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js -o "$BV_VENDOR/package/build/three.min.js"
  [[ -s "$BV_VENDOR/package/examples/js/controls/OrbitControls.js" ]] || curl -fsSL https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js -o "$BV_VENDOR/package/examples/js/controls/OrbitControls.js"
  if [[ ! -e site/vend ]]; then ln -s "$BV_VENDOR" site/vend; fi
  python3 src/sgreal/mktest.py site/index.html site/t_bv.html
fi
