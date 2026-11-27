#!/bin/bash
# lm50 New York test page (replaces nycreal/mknyc.sh + sgreal/mktest.py, which expect the old single-file page):
#   bash ny50page.sh <name> [nyc landmark folders a,b,... | omit for all R/nyc/*] [extra module paths relative to R, a,b]
# -> $NY50SITE (default SC/lm50/ny/site)/t_<name>.html + t_<name>-app.js (headless-testable: local three.js, window.__t hook, ?near=lat,lon,radius_m
#    streaming, window.__budget). Data: site/nycdata -> R/../site/nycdata (symlink, nothing copied). The NYC build takes every
#    R/nyc/<d>/<d>.js whose file name equals its folder (sgreal/patch17.py, CITY=nyc), sorted; NYCLM limits that list (in-situ runs);
#    EXTRA_MODS adds files after them. Delete the page when done: rm SC/lm50/ny/site/t_<name>*
set -e
R=/home/claude/earth_online/src; K=$(cd "$(dirname "$0")" && pwd); S=${NY50SITE:-/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/lm50/ny/site}
mkdir -p "$S"; [ -e "$S/nycdata" ] || ln -s /home/claude/earth_online/site/nycdata "$S/nycdata"
N=$1; [ -n "$N" ] || { echo "usage: ny50page.sh <name> [folders] [extra]"; exit 2; }
cd "$R"
if [ $# -ge 2 ] && [ "$2" != "all" ]; then export NYCLM="$2"; fi
if [ $# -ge 3 ]; then export EXTRA_MODS="$3"; fi
CITY=nyc APPJS=t_$N-app.js python3 sgreal/patch17.py city-brush-v16.html "$S/t_$N.html" | grep -v '^ok' | grep -v '^post ' | grep -v '^modules' || true
python3 - "$S/t_$N.html" "$S/t_$N-app.js" <<'PY'
import sys, re
h, j = sys.argv[1], sys.argv[2]
s = open(h).read()
s = s.replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', '/vend/package/build/three.min.js')
s = s.replace('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js', '/vend/package/examples/js/controls/OrbitControls.js')
s = re.sub(r'<link[^>]*fonts[^>]*>', '', s)
q = '<script>{ const q = new URLSearchParams(location.search).get("near"); if (q) window.__near = q.split(",").map(Number); }</script>'
i = s.find('<script'); s = s[:i] + q + s[i:]
open(h, 'w').write(s)
c = open(j).read()
hook = ("window.__t = {camera, controls, hAt, hC, setTod, scene, renderer, get cityDefs(){return cityDefs}, get net(){return net}, get landmarks(){return landmarks}, "
        "LANDMARKS, get cache(){return cache}, get zones(){return zones}, POI, get queue(){return queue}, SG, SGR, sgXY, get styleKey(){return styleKey}, "
        "addLandmark, requestRegen, buildSkeleton, setSeed, drawTex, get districts(){return districts}, setView, lodTick, get tRes(){return tRes}, ev:s => eval(s)};\n")
a = "requestAnimationFrame(loop);\n})();"
assert c.count(a) == 1, 'loop end not found'
c = c.replace(a, hook + a)
for a, b in [("while (queue.length && performance.now() - t < 22){", "while (queue.length && performance.now() - t < (window.__budget || 22)){"),
             ("drain(SGR.queue, window.CB_MOBILE ? 12 : 16);", "drain(SGR.queue, window.__budget || (window.CB_MOBILE ? 12 : 16));"),
             ("      const T = q.shift();\n      if (T.done && !SGR.dirty.has(T.ti) && T.lod === sgrWantLod(T)) continue;", "      const T = q.shift();\n      if (window.__near){ const nq = sgXY(__near[0], __near[1]); if (Math.hypot(T.cx - nq[0], T.cy - nq[1]) > __near[2]) continue; }\n      if (T.done && !SGR.dirty.has(T.ti) && T.lod === sgrWantLod(T)) continue;")]:
    if c.count(a) != 1: print('warning: test patch not applied:', a[:60])
    c = c.replace(a, b)
open(j, 'w').write(c)
PY
node --check "$S/t_$N-app.js"
echo "built $S/t_$N.html ($(du -ch "$S/t_$N.html" "$S/t_$N-app.js" | tail -1 | cut -f1)) modules: ${NYCLM:-all} ${EXTRA_MODS:++ $EXTRA_MODS}"
