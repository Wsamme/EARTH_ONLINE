#!/bin/bash
# assemble ../szshekou.js from the sources and data.json
cd "$(dirname "$0")"
OUT=../szshekou.js
{ awk 'NR==1,/^\{$/' src_core.js; printf 'const D = '; cat data.json; echo ';'; awk 'f;/^\{$/{f=1}' src_core.js; for f in $(cat order.txt); do cat $f; done; echo '}'; } > $OUT
node -e "new Function(require('fs').readFileSync('$OUT','utf8'))" && echo "ok $(wc -c < $OUT) bytes"
