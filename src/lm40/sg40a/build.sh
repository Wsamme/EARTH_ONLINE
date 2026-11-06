#!/bin/bash
# concatenates src/*.js into sg40a.js (one block)
D=/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/lm40/sg40a
{ echo "// ===== lm40/sg40a: twelve new landmarks in Singapore's CBD & Marina (City Brush lm40, real Singapore 1:1)"
  echo "// Built in the map frame (local +x = east, +z = south, rot 0) on the real OSM footprints of SC/lm40/ref_sg40a*.json."
  echo "// Only LANDMARKS and SG_PLACES are touched; helpers live inside this block."
  echo "{"; cat $D/src/*.js; echo "}"; } > $D/sg40a.js
node -e "new Function(require('fs').readFileSync('$D/sg40a.js','utf8'))" && echo built $(wc -c < $D/sg40a.js)
