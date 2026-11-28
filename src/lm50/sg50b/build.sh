#!/bin/bash
# concatenates src/*.js into sg50b.js (one block)
D=/home/claude/earth_online/src/lm50/sg50b
{ echo "// ===== lm50/sg50b: Singapore - Tanjong Pagar (Anson Road, south Shenton Way), Chinatown, Outram (SGH campus), Tiong Bahru (City Brush lm50, real Singapore 1:1)"
  echo "// Built in the map frame (local +x = east, +z = south, rot 0) on the real OSM footprints of R/lm50/ref_sg50b.json (+ corrected refs in SC/lm50/sg50b/)."
  echo "// Only LANDMARKS and SG_PLACES are touched; helpers live inside this block (shared kit copied from lm50/sg50a)."
  echo "{"; cat $D/src/*.js; echo "}"; } > $D/sg50b.js
node -e "new Function(require('fs').readFileSync('$D/sg50b.js','utf8'))" && echo built $(wc -c < $D/sg50b.js)
