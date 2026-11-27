#!/bin/bash
# road50: repair every city's live road data into a test stage, then run the diagnostics on the stage ("after").
# Run through the heavy lock:  bash SC/lm33/kit/heavy.sh src/road50/run_repair.sh
# Stage: $STAGE/<city>data/ (repaired road file(s) + symlinks to the unchanged live files), logs in src/road50/out/.
cd "$(dirname "$0")"
STAGE=${STAGE:-/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/road50/stage}
declare -A DIRS=([sg]=sgdata [hk]=hkdata [nyc]=nycdata [tyo]=tyodata [bay]=baydata [gba]=gbadata)
for c in ${CITIES:-sg hk nyc tyo bay gba}; do
  d=$STAGE/${DIRS[$c]}; rm -rf "$d"; mkdir -p "$d"
  node --max-old-space-size=2500 repair.js $c --out "$d" > out/${c}_repair.log 2>&1; echo "$c repair $?"
  OD=""; [ -f out/${c}_od_before.json ] && OD="--odin out/${c}_od_before.json"
  node --max-old-space-size=2500 diag.js $c --dir "$d" --png --tag after $OD > out/${c}_after.log 2>&1; echo "$c after $?"
done
