#!/usr/bin/env bash
# Regenerate the production Singapore page, plus the optional appshot test page.
set -euo pipefail
TASK_ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$TASK_ROOT"
CITY=sg python3 src/sgreal/patch17.py src/city-brush-v16.html site/index.html
python3 - <<'PYCODE'
import re
from pathlib import Path
s = Path('site/index.html').read_text()
Path('/tmp/earth-online-bv-app.js').write_text(max(re.findall(r'<script>(.*?)</script>', s, re.S), key=len))
PYCODE
node --check /tmp/earth-online-bv-app.js
if [[ "${1:-}" == "--test" ]]; then
  BV_VENDOR="${BV_VENDOR:-${TMPDIR:-/tmp}/earth-online-vendor}"
  mkdir -p "$BV_VENDOR/package/build" "$BV_VENDOR/package/examples/js/controls"
  [[ -s "$BV_VENDOR/package/build/three.min.js" ]] || curl -fsSL https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js -o "$BV_VENDOR/package/build/three.min.js"
  [[ -s "$BV_VENDOR/package/examples/js/controls/OrbitControls.js" ]] || curl -fsSL https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js -o "$BV_VENDOR/package/examples/js/controls/OrbitControls.js"
  if [[ ! -e site/vend ]]; then ln -s "$BV_VENDOR" site/vend; fi
  python3 src/sgreal/mktest.py site/index.html site/t_bv.html
fi
