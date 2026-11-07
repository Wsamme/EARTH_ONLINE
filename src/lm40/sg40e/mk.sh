#!/bin/bash
# concatenate the sections into the module
cd "$(dirname "$0")"
{ cat head.js; for f in s_*.js; do cat "$f"; done; echo; echo '}'; } > sg40e.js
node -e "new Function(require('fs').readFileSync('sg40e.js','utf8'))" && echo syntax ok
