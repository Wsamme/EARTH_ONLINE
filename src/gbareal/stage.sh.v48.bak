#!/bin/bash
# stage the encoded data for the app: gbareal/out/gba_*.gz -> sgreal/site/gbadata/gba_*.txt (gzip as base64 text) + ground.webp
set -e
cd /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad
mkdir -p sgreal/site/gbadata
rm -f sgreal/site/gbadata/gba_bld*.txt sgreal/site/gbadata/gba_roads*.txt sgreal/site/gbadata/gba_rc*.txt
for f in gbareal/out/gba_*.gz; do b=$(basename $f); n=${b%%.*}; base64 -w0 $f > sgreal/site/gbadata/$n.txt; done
cp gbareal/out/ground.webp sgreal/site/gbadata/ground.webp
if [ -f gbareal/out/ground8k.webp ]; then cp gbareal/out/ground8k.webp sgreal/site/gbadata/ground8k.webp; fi
ls -la sgreal/site/gbadata
python3 - <<'PY'
import os
d = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/sgreal/site/gbadata/'
fs = sorted(os.listdir(d)); tot = sum(os.path.getsize(d + f) for f in fs); big = max(os.path.getsize(d + f) for f in fs)
print('total %.1f MB, largest %.2f MB' % (tot/1e6, big/1e6)); assert big <= 15e6, 'a staged file exceeds 15 MB'
PY
