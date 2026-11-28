#!/bin/bash
# road50 R6: repair (with tunnels) into the tunnel stage, then diagnostics with the region routes. Run through the heavy lock.
#   CITIES="hk gba" bash SC/lm33/kit/heavy.sh src/road50/run_tun.sh
cd "$(dirname "$0")"
SC=/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad
ST=${STAGE_TUN:-$SC/road50/stage_tun}; OLD=${STAGE:-$SC/road50/stage}
declare -A DIRS=([sg]=sgdata [hk]=hkdata [nyc]=nycdata [tyo]=tyodata [bay]=baydata [gba]=gbadata)
declare -A REGS=(
  [hk]='island:114.13,22.245,114.23,22.285;kowloon:114.15,22.30,114.23,22.34;lantau:113.90,22.27,114.00,22.32;newterr:114.00,22.36,114.25,22.45'
  [gba]='island:114.13,22.245,114.23,22.285;kowloon:114.15,22.30,114.23,22.34;lantau:113.90,22.27,114.00,22.32;newterr:114.00,22.36,114.25,22.45'
  [sg]='cbd:103.84,1.27,103.86,1.29;east:103.92,1.32,103.96,1.36;north:103.82,1.42,103.86,1.45;west:103.70,1.33,103.74,1.36'
  [tyo]='chiyoda:139.74,35.67,139.78,35.70;shinjuku:139.68,35.68,139.71,35.70;haneda:139.76,35.54,139.80,35.56;kawasaki:139.69,35.52,139.73,35.54'
  [nyc]='manhattan:-74.02,40.70,-73.93,40.80;jersey:-74.10,40.70,-74.03,40.78;queens:-73.95,40.70,-73.85,40.77;brooklyn:-74.00,40.63,-73.93,40.69'
  [bay]='sf:-122.45,37.74,-122.39,37.80;oakland:-122.29,37.79,-122.24,37.83;orinda:-122.20,37.86,-122.15,37.90;sanjose:-121.92,37.32,-121.86,37.36')
for c in ${CITIES:-hk gba}; do
  REG=${REGS[$c]}
  d=$ST/${DIRS[$c]}; mkdir -p "$d"
  node --max-old-space-size=2500 repair.js $c --out "$d" --log out/${c}_repair_tun.json > out/${c}_repair_tun.log 2>&1; echo "$c repair $?"
  node --max-old-space-size=2500 diag.js $c --dir "$d" --tag tun --odin out/${c}_od_before.json --regions "$REG" --png > out/${c}_tun.log 2>&1; echo "$c tun $?"
  [ -n "$REGIONS_ALSO" ] && { node --max-old-space-size=2500 diag.js $c --tag before_r --regions "$REG" > out/${c}_before_r.log 2>&1; node --max-old-space-size=2500 diag.js $c --dir $OLD/${DIRS[$c]} --tag after_r --odin out/${c}_od_before.json --regions "$REG" > out/${c}_after_r.log 2>&1; echo "$c regions $?"; }
done
# the traffic run (simtest.js) on the live data, the repaired stage and the tunnel stage, same views
[ -n "$SIM" ] && for c in ${CITIES:-hk gba}; do
  case $c in hk) V='[["central",22.2830,114.1650],["kowloon",22.3061,114.1855],["harbour_east",22.2900,114.2200]]';;
             gba) V='[["futian",22.5400,114.0550],["hk_central",22.2830,114.1650],["repairs",22.4461,114.0302]]';;
             sg) V='[["cbd",1.2840,103.8510],["kpe_mce",1.2950,103.8700]]';;
             tyo) V='[["chiyoda",35.6810,139.7600],["haneda",35.5500,139.7800]]';;
             nyc) V='[["midtown",40.7550,-73.9850],["holland",40.7270,-74.0300]]';;
             bay) V='[["sf",37.7804,-122.4023],["caldecott",37.8550,-122.2150]]';; esac
  node --max-old-space-size=2500 simtest.js $c out/simt_${c}_live.json "$V" > out/simt_${c}_live.log 2>&1
  node --max-old-space-size=2500 simtest.js $c out/simt_${c}_after.json "$V" --dir $OLD/${DIRS[$c]} > out/simt_${c}_after.log 2>&1
  node --max-old-space-size=2500 simtest.js $c out/simt_${c}_tun.json "$V" --dir $ST/${DIRS[$c]} > out/simt_${c}_tun.log 2>&1; echo "$c sim $?"
done
