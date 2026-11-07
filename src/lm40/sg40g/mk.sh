#!/bin/bash
# build sg40g.js from the sources
cd "$(dirname "$0")"
{ echo "// City Brush lm40 — group sg40g (North & Central): Mandai parks (Zoo, Night Safari, River Wonders, Bird Paradise), TreeTop Walk,"
  echo "// Sungei Buloh, the Causeway, Toa Payoh Dragon Playground, SkyVille@Dawson, Sun Yat Sen Nanyang Memorial Hall, Novena Church,"
  echo "// Burmese Buddhist Temple. One block; only LANDMARKS, SITES and SG_PLACES are touched. Real OSM footprints (see comments)."
  echo "{"; cat rings.js; [ -f sitedata.js ] && cat sitedata.js; cat src_a.js src_b.js; [ -f src_c.js ] && cat src_c.js; echo "}"; } > sg40g.js
node -e "new Function(require('fs').readFileSync('sg40g.js','utf8'))" && echo syntax-ok
