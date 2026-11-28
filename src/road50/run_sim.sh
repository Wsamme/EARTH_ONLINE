#!/bin/bash
# road50: the traffic system run headless in node (simtest.js) on the live data and on the test stage, two views per city
cd "$(dirname "$0")"
STAGE=${STAGE:-/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/road50/stage}
declare -A DIRS=([sg]=sgdata [hk]=hkdata [nyc]=nycdata [tyo]=tyodata [bay]=baydata [gba]=gbadata)
declare -A VIEWS=(
  [sg]='[["cbd",1.2840,103.8510],["repairs",1.3489,103.6361]]'
  [hk]='[["kowloon",22.3061,114.1855],["central",22.2830,114.1650]]'
  [nyc]='[["midtown",40.7550,-73.9850],["repairs",40.7473,-74.1841]]'
  [tyo]='[["chiyoda",35.6810,139.7600],["repairs",35.5721,139.6589]]'
  [bay]='[["sf",37.7804,-122.4023],["oakland",37.8050,-122.2700]]'
  [gba]='[["futian",22.5400,114.0550],["repairs",22.4461,114.0302]]')
for c in ${CITIES:-sg hk nyc tyo bay gba}; do
  node --max-old-space-size=2500 simtest.js $c out/sim_${c}_before.json "${VIEWS[$c]}" > out/sim_${c}_before.log 2>&1; echo "$c before $?"
  node --max-old-space-size=2500 simtest.js $c out/sim_${c}_after.json "${VIEWS[$c]}" --dir $STAGE/${DIRS[$c]} > out/sim_${c}_after.log 2>&1; echo "$c after $?"
done
