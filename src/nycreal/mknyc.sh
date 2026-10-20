#!/bin/bash
# Build a test copy of the New York City app: bash nycreal/mknyc.sh <name> [nyc landmark folders a,b | omit for all]
# -> sgreal/site/t_<name>.html (data in sgreal/site/nycdata/)
set -e
cd /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad
python3 nycreal/mkengine.py > /dev/null
if [ $# -ge 2 ]; then export NYCLM="$2"; fi
CITY=nyc python3 sgreal/patch17.py city-brush-v16.html sgreal/site/t_$1.full.html | grep -v '^ok' | grep -v '^modules' || true
python3 - "sgreal/site/t_$1.full.html" <<'PY'
import sys, re
s = open(sys.argv[1]).read(); m = max(re.findall(r'<script>(.*?)</script>', s, re.S), key=len)
open(sys.argv[1] + '.js', 'w').write(m)
PY
node --check sgreal/site/t_$1.full.html.js
python3 sgreal/mktest.py sgreal/site/t_$1.full.html sgreal/site/t_$1.html
rm -f sgreal/site/t_$1.full.html sgreal/site/t_$1.full.html.js
echo built sgreal/site/t_$1.html
