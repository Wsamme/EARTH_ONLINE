#!/bin/bash
# stage the encoded data for the app: nycreal/out/nyc_*.gz -> sgreal/site/nycdata/nyc_*.txt (gzip as base64 text) + ground.webp
set -e
cd /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad
mkdir -p sgreal/site/nycdata
rm -f sgreal/site/nycdata/nyc_bld*.txt
for f in nycreal/out/nyc_*.gz; do b=$(basename $f); n=${b%%.*}; base64 -w0 $f > sgreal/site/nycdata/$n.txt; done
cp nycreal/out/ground.webp sgreal/site/nycdata/ground.webp
ls -la sgreal/site/nycdata
python3 - <<'PY'
import os
d = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/sgreal/site/nycdata/'
fs = sorted(os.listdir(d)); tot = sum(os.path.getsize(d + f) for f in fs); big = max(os.path.getsize(d + f) for f in fs)
print('total %.1f MB, largest %.2f MB' % (tot/1e6, big/1e6)); assert big <= 15e6, 'a staged file exceeds 15 MB'
PY
