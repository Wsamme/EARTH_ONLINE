#!/bin/bash
# Build lm50mech/mech/mech.js from src/*.js (in name order) and check its syntax.   bash lm50mech/mech/mk.sh
set -e
D=$(cd "$(dirname "$0")" && pwd)
cat "$D"/src/*.js > "$D/mech.js.tmp" && mv "$D/mech.js.tmp" "$D/mech.js"
node --check "$D/mech.js" && echo "ok $(wc -c < "$D/mech.js") bytes -> $D/mech.js"
