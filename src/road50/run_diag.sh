#!/bin/bash
# road50: diagnostics only, live data ("before") and the test stage ("after") with the same OD points
cd "$(dirname "$0")"
STAGE=${STAGE:-/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/road50/stage}
declare -A DIRS=([sg]=sgdata [hk]=hkdata [nyc]=nycdata [tyo]=tyodata [bay]=baydata [gba]=gbadata)
for c in ${CITIES:-sg hk nyc tyo bay gba}; do
  node --max-old-space-size=2500 diag.js $c --png --tag before > out/${c}_before.log 2>&1; echo "$c before $?"
  node --max-old-space-size=2500 diag.js $c --dir $STAGE/${DIRS[$c]} --png --tag after --odin out/${c}_od_before.json > out/${c}_after.log 2>&1; echo "$c after $?"
done
