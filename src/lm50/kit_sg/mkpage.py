# lm50 (Singapore): headless-testable copy of a patch17 build (replaces the lost lm20/kit/mkapp.sh + sgreal/mktest.py flow for
# the split index.html + app.js build).  Used by mkapp50.sh; usage: python3 mkpage.py <t_name.html> <t_name-app.js>
# - three.js / OrbitControls / GLTFLoader from SC/vend (no CDN), fonts link dropped
# - window.__t test hook (camera, controls, scene, renderer, SGR, sgXY, hC, setTod, lodTick, LANDMARKS, landmarks, SG_PLACES, SITES, ev)
# - window.__budget raises the per-frame streaming budget; ?near=lat,lon,radius_m streams only the tiles near a point
import sys, re
html, js = sys.argv[1], sys.argv[2]
s = open(html).read()
for a, b in [('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', '/vend/package/build/three.min.js'),
             ('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js', '/vend/package/examples/js/controls/OrbitControls.js'),
             ('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js', '/vend/package/examples/js/loaders/GLTFLoader.js')]:
    s = s.replace(a, b)
s = re.sub(r'<link[^>]*fonts[^>]*>', '', s)
s = s.replace('<script>', '<script>{ const q = new URLSearchParams(location.search).get("near"); if (q) window.__near = q.split(",").map(Number); }</script><script>', 1)
open(html, 'w').write(s)
j = open(js).read()
hook = ("window.__t = {camera, controls, hAt, hC, setTod, scene, renderer, get landmarks(){return landmarks}, LANDMARKS, SG_PLACES, SITES, SG, SGR, sgXY, "
        "lodTick, ev:s => eval(s)};\n")
a = "requestAnimationFrame(loop);\n})();"
assert j.count(a) == 1, 'hook anchor'
j = j.replace(a, hook + a)
for a, b in [("drain(SGR.queue, window.CB_MOBILE ? 12 : 16);", "drain(SGR.queue, window.__budget || (window.CB_MOBILE ? 12 : 16));"),
             ("      const T = q.shift();\n      if (T.done && !SGR.dirty.has(T.ti) && T.lod === sgrWantLod(T)) continue;",
              "      const T = q.shift();\n      if (window.__near){ const c = sgXY(__near[0], __near[1]); if (Math.hypot(T.cx - c[0], T.cy - c[1]) > __near[2]) continue; }\n      if (T.done && !SGR.dirty.has(T.ti) && T.lod === sgrWantLod(T)) continue;")]:
    if j.count(a) == 1: j = j.replace(a, b)
    else: print('WARN: anchor not found (budget/near disabled):', a[:60])
open(js, 'w').write(j)
print('test page ->', html, '+', js)
