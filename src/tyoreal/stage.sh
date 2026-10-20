#!/bin/bash
# stage the encoded data for the app: tyoreal/out/tyo_*.gz -> sgreal/site/tyodata/tyo_*.txt (gzip as base64 text) + ground.webp
# (+ tyo_cover.txt from mkcover_tyo.py). The tyo_far* files in the same folder belong to the fuji agent and are left alone.
set -e
cd /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad
mkdir -p sgreal/site/tyodata
rm -f sgreal/site/tyodata/tyo_bld*.txt
for f in tyoreal/out/tyo_*.gz; do b=$(basename $f); n=${b%%.*}; base64 -w0 $f > sgreal/site/tyodata/$n.txt; done
cp tyoreal/out/ground.webp sgreal/site/tyodata/ground.webp
python3 tyoreal/mkcover_tyo.py tyo
ls -la sgreal/site/tyodata
python3 - <<'PY'
import os
d = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/sgreal/site/tyodata/'
fs = sorted(f for f in os.listdir(d) if not f.startswith('tyo_far')); tot = sum(os.path.getsize(d + f) for f in fs); big = max(os.path.getsize(d + f) for f in fs)
print('total %.1f MB (without tyo_far*), largest %.2f MB' % (tot/1e6, big/1e6)); assert big <= 15e6, 'a staged file exceeds 15 MB'
PY
