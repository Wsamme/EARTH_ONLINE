#!/bin/bash
# Build a test copy of the Greater Bay app: bash gbareal/mkgba.sh <name> [gba landmark folders a,b | omit for all]
# -> sgreal/site/t_<name>.html (data in sgreal/site/gbadata/)
set -e
cd /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad
python3 gbareal/mkengine.py > /dev/null
python3 gbareal/tools/mkpatch17.py > /dev/null
python3 gbareal/tools/mkhklm.py > /dev/null
python3 gbareal/tools/mkswitch.py > /dev/null
if [ $# -ge 2 ]; then export GBALM="$2"; fi
CITY=gba python3 gbareal/tools/patch17_gba.py city-brush-v16.html sgreal/site/t_$1.full.html | grep -v '^ok' | grep -v '^modules' || true
python3 - "sgreal/site/t_$1.full.html" <<'PY'
import sys, re
s = open(sys.argv[1]).read(); m = max(re.findall(r'<script>(.*?)</script>', s, re.S), key=len)
open(sys.argv[1] + '.js', 'w').write(m)
PY
node --check sgreal/site/t_$1.full.html.js
python3 sgreal/mktest.py sgreal/site/t_$1.full.html sgreal/site/t_$1.html
rm -f sgreal/site/t_$1.full.html sgreal/site/t_$1.full.html.js
echo built sgreal/site/t_$1.html
