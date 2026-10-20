# python3 mktest.py <app.html> <site/test.html>: headless-testable copy served over http (scratchpad root)
import sys, re
s = open(sys.argv[1]).read()
s = s.replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', '/vend/package/build/three.min.js')
s = s.replace('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js', '/vend/package/examples/js/controls/OrbitControls.js')
s = re.sub(r'<link[^>]*fonts[^>]*>', '', s)
hook = ("window.__t = {camera, controls, hAt, hC, setTod, scene, renderer, get cityDefs(){return cityDefs}, get net(){return net}, get landmarks(){return landmarks}, "
        "LANDMARKS, get cache(){return cache}, get zones(){return zones}, POI, get queue(){return queue}, SG, SGR, sgXY, get styleKey(){return styleKey}, "
        "addLandmark, requestRegen, buildSkeleton, setSeed, drawTex, get districts(){return districts}, setView, lodTick, get tRes(){return tRes}, ev:s => eval(s)};\n")
a = "requestAnimationFrame(loop);\n})();"
assert s.count(a) == 1
s = s.replace(a, hook + a)
for a, b in [("while (queue.length && performance.now() - t < 22){", "while (queue.length && performance.now() - t < (window.__budget || 22)){"),
             ("if (trafficJob){ const t = performance.now(); while (performance.now() - t < 14){", "if (trafficJob){ const t = performance.now(); while (performance.now() - t < (window.__budget ? window.__budget : 14)){"),
             ("while (SGR.queue.length && performance.now() - t < 16){", "while (SGR.queue.length && performance.now() - t < (window.__budget || 16)){"),
             # ?near=lat,lon,radius_m : stream only the tiles near a point (fast module tests)
             ("const T = SGR.queue.shift(); if (T.done && !SGR.dirty.has(T.ti)) continue;", "const T = SGR.queue.shift(); if (T.done && !SGR.dirty.has(T.ti)) continue; if (window.__near){ const q = sgXY(__near[0], __near[1]); if (Math.hypot(T.cx - q[0], T.cy - q[1]) > __near[2]) continue; }")]:
    assert s.count(a) == 1, a
    s = s.replace(a, b)
if not s.startswith('<!doctype'): s = '<!doctype html><meta charset="utf-8">' + s
s = s.replace('<script>', '<script>{ const q = new URLSearchParams(location.search).get("near"); if (q) window.__near = q.split(",").map(Number); }</script><script>', 1) if '<script>' in s else s
open(sys.argv[2], 'w').write(s)
print('test page ->', sys.argv[2])
