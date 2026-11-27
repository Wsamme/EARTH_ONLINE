#!/bin/bash
# v48 (lm50) release of the Guangzhou-wide Greater Bay map. Coordinator only, after the test page is accepted. Not run by the agent.
#   1. app: the three adaptive files (they also work with the October data); if R/gbareal/app/gbareal.js, gbstats.js or patch_gba.py
#      changed since 27 Nov 20:00, apply gz_release/app.diff by hand instead of copying.
#   2. data: site/gbadata <- SC/lm50/gz/gbadata (all gba_*.txt, ground.webp; the old 228 road chunks are replaced by 877).
#      The building / road merge read site/gbadata as of 27 Nov 2026: if site/gbadata changed since, rerun b7_encode, b7c_roads,
#      stage first (SC/lm50/gz/tools/chain.sh b7_encode b7c_roads stage b8_cover).
#   3. page: bash SC/gbabuild/build.sh (-> site/gba.html). Then the owner deploys.
set -e
S=/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad
R=/home/claude/earth_online/src/gbareal; SITE=/home/claude/earth_online/site
for f in app/gbareal.js app/gbstats.js patch_gba.py; do cp -p $R/$f $R/$f.v48.bak; cp $R/gz_release/$f $R/$f; done
mkdir -p $S/lm50/gz/gbadata_before; cp -p $SITE/gbadata/gba_*.txt $SITE/gbadata/ground.webp $S/lm50/gz/gbadata_before/
rm -f $SITE/gbadata/gba_*.txt
cp $S/lm50/gz/gbadata/gba_*.txt $S/lm50/gz/gbadata/ground.webp $SITE/gbadata/
bash $S/gbabuild/build.sh
du -sh $SITE/gbadata; ls -la $SITE/gba.html
