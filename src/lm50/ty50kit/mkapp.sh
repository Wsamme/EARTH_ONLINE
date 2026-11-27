#!/bin/bash
# Build a Tokyo test page from this checkout (src/sgreal/patch17.py, CITY=tyo) into a folder you own, beside a link to the real data.
# usage: bash mkapp.sh <outdir> <name> "<TYOLM: Tokyo module folders a,b | 'all'>" [EXTRA_MODS: module paths relative to src/, comma-separated]
#   -> <outdir>/t_<name>.html + <outdir>/t_<name>-app.js (+ <outdir>/tyodata -> site/tyodata symlink). Delete both files after the run.
# Example (group ty50a, its neighbours marunouchi / ginza / palace / tyx_central):
#   bash mkapp.sh SC/lm50/ty50a/app ty50a ty50a,marunouchi,ginza,palace,tyx_central
set -e
OUT=$(mkdir -p "$1" && cd "$1" && pwd); NAME=$2; LM=$3; EXTRA=$4
SRC=$(cd "$(dirname "$0")/../.." && pwd)
[ -e "$OUT/tyodata" ] || ln -s "$SRC/../site/tyodata" "$OUT/tyodata"
cd "$SRC"
if [ "$LM" = "all" ]; then unset TYOLM; else export TYOLM="$LM"; fi
CITY=tyo APPJS="t_$NAME-app.js" EXTRA_MODS="$EXTRA" python3 sgreal/patch17.py city-brush-v16.html "$OUT/t_$NAME.html" | grep -v '^post' | grep -v '^ok' | sed 's/^modules /modules: /' | tr -d '[]' | cut -c1-2000
python3 "$SRC/lm50/ty50kit/mktest.py" "$OUT/t_$NAME.html"
node --check "$OUT/t_$NAME-app.js"
ls -la "$OUT/t_$NAME.html" "$OUT/t_$NAME-app.js"
