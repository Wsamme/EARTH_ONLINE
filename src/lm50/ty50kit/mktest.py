# Make a patch17 page (t_<name>.html + t_<name>-app.js) headless-testable, like sgreal/mktest.py did for the old one-file pages:
# the window.__t hook (camera, controls, hC, sgXY, setTod, lodTick, SGR, LANDMARKS …), window.__budget build budgets, and
# ?near=lat,lon,radius (stream only the tiles within the radius). usage: python3 mktest.py <t_name.html>   (edits both files in place)
import sys, re, os
html = sys.argv[1]; s = open(html).read()
m = re.search(r'<script src="([^"]+-app\.js)" defer></script>', s); assert m, 'no -app.js script tag'
js = os.path.join(os.path.dirname(os.path.abspath(html)), m.group(1)); a = open(js).read()
hook = ("window.__t = {camera, controls, hAt, hC, setTod, scene, renderer, get landmarks(){return landmarks}, LANDMARKS, SGR, sgXY, "
        "setView, lodTick, ev:s => eval(s)};\n")
end = "requestAnimationFrame(loop);\n})();"
if 'window.__t = {' not in a:
    assert a.count(end) == 1, 'loop end marker'
    a = a.replace(end, hook + end)
    for x, y in [("while (queue.length && performance.now() - t < 22){", "while (queue.length && performance.now() - t < (window.__budget || 22)){"),
                 ("while (SGR.queue.length && performance.now() - t < 16){", "while (SGR.queue.length && performance.now() - t < (window.__budget || 16)){"),
                 ("const T = SGR.queue.shift(); if (T.done && !SGR.dirty.has(T.ti)) continue;", "const T = SGR.queue.shift(); if (T.done && !SGR.dirty.has(T.ti)) continue; if (window.__near){ const q = sgXY(__near[0], __near[1]); if (Math.hypot(T.cx - q[0], T.cy - q[1]) > __near[2]) continue; }")]:
        if a.count(x) == 1: a = a.replace(x, y)
        else: print('warning: marker not found once:', x[:60])
    open(js, 'w').write(a)
if 'window.__near' not in s:
    s = s.replace(m.group(0), '<script>{ const q = new URLSearchParams(location.search).get("near"); if (q) window.__near = q.split(",").map(Number); }</script>\n' + m.group(0), 1)
    open(html, 'w').write(s)
print('test hooks in', html, js)
