#!/bin/bash
# road50 R6: repair (with tunnels) into the tunnel stage, then diagnostics with the region routes. Run through the heavy lock.
#   CITIES="hk gba" bash SC/lm33/kit/heavy.sh src/road50/run_tun.sh
cd "$(dirname "$0")"
SC=/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad
ST=${STAGE_TUN:-$SC/road50/stage_tun}; OLD=${STAGE:-$SC/road50/stage}
declare -A DIRS=([sg]=sgdata [hk]=hkdata [nyc]=nycdata [tyo]=tyodata [bay]=baydata [gba]=gbadata)
REG='island:114.13,22.245,114.23,22.285;kowloon:114.15,22.30,114.23,22.34;lantau:113.90,22.27,114.00,22.32;newterr:114.00,22.36,114.25,22.45'
for c in ${CITIES:-hk gba}; do
  d=$ST/${DIRS[$c]}; mkdir -p "$d"
  node --max-old-space-size=2500 repair.js $c --out "$d" --log out/${c}_repair_tun.json > out/${c}_repair_tun.log 2>&1; echo "$c repair $?"
  node --max-old-space-size=2500 diag.js $c --dir "$d" --tag tun --odin out/${c}_od_before.json --regions "$REG" --png > out/${c}_tun.log 2>&1; echo "$c tun $?"
  [ -n "$REGIONS_ALSO" ] && { node --max-old-space-size=2500 diag.js $c --tag before_r --regions "$REG" > out/${c}_before_r.log 2>&1; node --max-old-space-size=2500 diag.js $c --dir $OLD/${DIRS[$c]} --tag after_r --odin out/${c}_od_before.json --regions "$REG" > out/${c}_after_r.log 2>&1; echo "$c regions $?"; }
done
# the traffic run (simtest.js) on the live data, the repaired stage and the tunnel stage, same views
[ -n "$SIM" ] && for c in ${CITIES:-hk gba}; do
  case $c in hk) V='[["central",22.2830,114.1650],["kowloon",22.3061,114.1855],["harbour_east",22.2900,114.2200]]';;
             gba) V='[["futian",22.5400,114.0550],["hk_central",22.2830,114.1650],["repairs",22.4461,114.0302]]';; esac
  node --max-old-space-size=2500 simtest.js $c out/simt_${c}_live.json "$V" > out/simt_${c}_live.log 2>&1
  node --max-old-space-size=2500 simtest.js $c out/simt_${c}_after.json "$V" --dir $OLD/${DIRS[$c]} > out/simt_${c}_after.log 2>&1
  node --max-old-space-size=2500 simtest.js $c out/simt_${c}_tun.json "$V" --dir $ST/${DIRS[$c]} > out/simt_${c}_tun.log 2>&1; echo "$c sim $?"
done
