#!/bin/bash
# concatenates src/*.js into sg50a.js (one block)
D=/home/claude/earth_online/src/lm50/sg50a
{ echo "// ===== lm50/sg50a: Singapore CBD - Raffles Place, Battery Road, Collyer Quay, Robinson Road, Cecil Street, Shenton Way (City Brush lm50, real Singapore 1:1)"
  echo "// Built in the map frame (local +x = east, +z = south, rot 0) on the real OSM footprints of R/lm50/ref_sg50a.json."
  echo "// Only LANDMARKS and SG_PLACES are touched; helpers live inside this block."
  echo "{"; cat $D/src/*.js; echo "}"; } > $D/sg50a.js
node -e "new Function(require('fs').readFileSync('$D/sg50a.js','utf8'))" && echo built $(wc -c < $D/sg50a.js)
