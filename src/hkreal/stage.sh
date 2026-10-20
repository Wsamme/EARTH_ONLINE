#!/bin/bash
# stage the encoded data for the app: hkreal/out/hk_*.gz -> sgreal/site/hkdata/hk_*.txt (gzip as base64 text) + ground.webp
set -e
cd /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad
mkdir -p sgreal/site/hkdata
rm -f sgreal/site/hkdata/hk_bld*.txt
for f in hkreal/out/hk_*.gz; do b=$(basename $f); n=${b%%.*}; base64 -w0 $f > sgreal/site/hkdata/$n.txt; done
cp hkreal/out/ground.webp sgreal/site/hkdata/ground.webp
ls -la sgreal/site/hkdata
python3 - <<'PY'
import os
d = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/sgreal/site/hkdata/'
fs = sorted(os.listdir(d)); tot = sum(os.path.getsize(d + f) for f in fs); big = max(os.path.getsize(d + f) for f in fs)
print('total %.1f MB, largest %.2f MB' % (tot/1e6, big/1e6)); assert big <= 15e6, 'a staged file exceeds 15 MB'
PY
