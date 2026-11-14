#!/bin/bash
# assemble dgcity.js from data.json + body.js
cd /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/wipsrc/src/gba/dgcity
{ echo "// ===== Dongguan city centre (City Brush, Greater Bay map, group dgcity) ====="
  echo "// Minying T2, the TBA Tower, the Administrative Center, the Central Square (site), the Yulan Grand Theatre, the Library, Keyuan"
  echo "// Garden (site), the Ying'en Gate, the Exhibition Hall and Qifeng Park (site). Every model stands on its real OSM footprint (local"
  echo "// metres round the anchor: +x east, +z south; rot 0, footprints used as they are). Data D from src/gen.py (ref_dgcity.json +"
  echo "// tools/areas.json). Heights: targets.json (verified) or the data (OSM storeys / class estimates, said so per key). No logos or text."
  echo "{"; echo -n "const D = "; cat src/data.json; echo ";"; cat src/body.js; echo "}"; } > dgcity.js
node src/nodetest.js dgcity.js
