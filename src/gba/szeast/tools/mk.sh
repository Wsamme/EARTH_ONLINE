#!/bin/bash
# assemble ../szeast.js from src/ and tools/data.json
cd "$(dirname "$0")/.."
OUT=szeast.js
{ cat src/core.js; printf 'const D = '; cat tools/data.json; echo ';'; for f in $(cat src/order.txt); do cat src/$f; done; echo '}'; } > $OUT
node -e "new Function(require('fs').readFileSync('$OUT','utf8'))" && echo "ok $(wc -c < $OUT) bytes"
