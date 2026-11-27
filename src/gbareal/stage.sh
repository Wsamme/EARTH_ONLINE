#!/bin/bash
# stage the encoded data for the app: gbareal/out/gba_*.gz -> sgreal/site/gbadata/gba_*.txt (gzip as base64 text) + ground.webp
set -e
cd /tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad
# v48: GBA_FRAME=gz stages lm50/gz/out -> lm50/gz/gbadata (test data); GBA_STAGE / GBA_OUT override (relative to the scratchpad)
if [ "$GBA_FRAME" = gz ]; then D0=lm50/gz/gbadata; O0=lm50/gz/out; else D0=sgreal/site/gbadata; O0=gbareal/out; fi
D=${GBA_STAGE:-$D0}; O=${GBA_OUT:-$O0}
mkdir -p $D
rm -f $D/gba_bld*.txt $D/gba_roads*.txt $D/gba_rc*.txt
for f in $O/gba_*.gz; do b=$(basename $f); n=${b%%.*}; base64 -w0 $f > $D/$n.txt; done
cp $O/ground.webp $D/ground.webp
if [ -f $O/ground8k.webp ]; then cp $O/ground8k.webp $D/ground8k.webp; fi
ls -la $D | grep -v gba_rc
python3 - "$D" <<'PY'
import os, sys
d = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/' + sys.argv[1].rstrip('/') + '/'
fs = sorted(os.listdir(d)); tot = sum(os.path.getsize(d + f) for f in fs); big = max(os.path.getsize(d + f) for f in fs)
print('total %.1f MB, largest %.2f MB' % (tot/1e6, big/1e6)); assert big <= 15e6, 'a staged file exceeds 15 MB'
PY
