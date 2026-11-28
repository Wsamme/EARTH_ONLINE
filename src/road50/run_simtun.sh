#!/bin/bash
# road50: the traffic run on the tunnel stage only (after the restart of 28 Nov)
cd "$(dirname "$0")"
ST=/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/road50/stage_tun
declare -A DIRS=([sg]=sgdata [hk]=hkdata [nyc]=nycdata [tyo]=tyodata [bay]=baydata [gba]=gbadata)
declare -A V=([hk]='[["central",22.2830,114.1650],["kowloon",22.3061,114.1855],["harbour_east",22.2900,114.2200]]'
  [gba]='[["futian",22.5400,114.0550],["hk_central",22.2830,114.1650],["repairs",22.4461,114.0302]]'
  [sg]='[["cbd",1.2840,103.8510],["kpe_mce",1.2950,103.8700]]' [tyo]='[["chiyoda",35.6810,139.7600],["haneda",35.5500,139.7800]]' [nyc]='[["midtown",40.7550,-73.9850],["holland",40.7270,-74.0300]]')
for c in ${CITIES:-hk nyc tyo gba}; do
  node --max-old-space-size=2500 simtest.js $c out/simt_${c}_tun.json "${V[$c]}" --dir $ST/${DIRS[$c]} > out/simt_${c}_tun.log 2>&1; echo "$c sim $?"
done
