#!/bin/bash
# road50: one short headless traffic check per city, live data ("before") and the repaired stage ("after") in one browser session.
# Each city goes through the browser lock on its own:  bash src/road50/run_probe.sh [cities]
cd "$(dirname "$0")"
SC=/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad
STAGE=${STAGE:-$SC/road50/stage}
declare -A PAGE=([sg]=index.html [hk]=hk.html [nyc]=nyc.html [tyo]=tyo.html [bay]=bay.html [gba]=gba.html)
declare -A DIRS=([sg]=sgdata [hk]=hkdata [nyc]=nycdata [tyo]=tyodata [bay]=baydata [gba]=gbadata)
declare -A VIEWS=(
  [sg]='[["cbd",1.2840,103.8510],["repairs",1.3489,103.6361]]'
  [hk]='[["kowloon",22.3061,114.1855],["central",22.2830,114.1650]]'
  [nyc]='[["midtown",40.7550,-73.9850],["repairs",40.7473,-74.1841]]'
  [tyo]='[["chiyoda",35.6810,139.7600],["repairs",35.5721,139.6589]]'
  [bay]='[["sf",37.7804,-122.4023],["oakland",37.8050,-122.2700]]'
  [gba]='[["futian",22.5400,114.0550],["repairs",22.4461,114.0302]]')
# all requested cities in ONE browser-lock session (the lock is shared by every agent: one wait, one run)
CMD=""
for c in ${@:-sg hk gba}; do
  V=${VIEWS[$c]}; [ -n "$ONEVIEW" ] && V=$(python3 -c "import json,sys; print(json.dumps(json.loads(sys.argv[1])[-1:]))" "$V")
  CMD="$CMD node probe.js ${PAGE[$c]} $c out/probe_$c.json '$V' --data $STAGE/${DIRS[$c]} > out/probe_$c.log 2>&1; echo $c probe \$?;"
done
bash $SC/lm33/kit/browser.sh bash -c "$CMD"
