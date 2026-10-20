# v37 fuji (lm33/fuji): small main-code / module patches for the far terrain around the Tokyo square — a POSTS / EXTRA_POSTS file for
# sgreal/patch17.py (apply(src, city) -> src; only the Tokyo build is changed). Each replacement is asserted to match exactly once.
#  1. keyboard panning (navStep, WASD / arrows) clamped the view target to the square (HALF*1.05): it may go out to the far terrain
#     (SGFar.bounds) once it is loaded, so the view can be walked to Mount Fuji
#  3. lm30/nav: the big map shows the far terrain (SGFar.mapDraw) and zooms out to it
#  2. lm24/fly: wetF / waterLevel outside the square read the far terrain (Sagami Bay, Suruga Bay, the outer Tokyo Bay: the sea plane
#     at -1.6 m; the Fuji Five Lakes and Lake Ashi at their levels), so aircraft ditch / land on the far water instead of a "ground" at -0.3 m
import os
def apply(src, city):
    if city != 'tyo' and not os.environ.get('FAR_POST_ANY'): return src
    def R(a, b, need=True):
        nonlocal src
        n = src.count(a)
        if not need and n == 0: return False
        assert n == 1, ('post_far', n, a[:100]); src = src.replace(a, b); return True
    R("const lim = HALF*1.05; controls.target.x = Math.max(-lim, Math.min(lim, controls.target.x)); controls.target.z = Math.max(-lim, Math.min(lim, controls.target.z));",
      "const lim = HALF*1.05, FB = window.SGFar && SGFar.on ? SGFar.bounds : null; controls.target.x = FB ? Math.max(FB[0], Math.min(FB[2], controls.target.x)) : Math.max(-lim, Math.min(lim, controls.target.x)); controls.target.z = FB ? Math.max(-FB[3], Math.min(-FB[1], controls.target.z)) : Math.max(-lim, Math.min(lim, controls.target.z));")
    R("function wetF(x, y){\n", "function wetF(x, y){\n  if ((x < -HALF || x > HALF || y < -HALF || y > HALF) && window.SGFar && SGFar.on) return SGFar.wet(x, y);\n", need=False)
    R("function waterLevel(x, y){ const k = cx2i(y)*N + cx2i(x);", "function waterLevel(x, y){ if ((x < -HALF || x > HALF || y < -HALF || y > HALF) && window.SGFar && SGFar.on) return SGFar.wl(x, y); const k = cx2i(y)*N + cx2i(x);", need=False)
    # 3. lm30/nav big map: the far terrain (a shaded relief drawn by SGFar.mapDraw under the city's tiles) and zooming out to all of it
    R("x.setTransform(dpr, 0, 0, dpr, 0, 0); x.fillStyle = '#9fbccb'; x.fillRect(0, 0, W, H);",
      "x.setTransform(dpr, 0, 0, dpr, 0, 0); x.fillStyle = '#9fbccb'; x.fillRect(0, 0, W, H); if (window.SGFar && SGFar.on && SGFar.mapDraw) SGFar.mapDraw(x, bmSX, bmSY, BM.sc);", need=False)
    R("function bmMinSc(){ return Math.min(BM.W, BM.H)/(2*bmHalf())*1.02; }",
      "function bmMinSc(){ const F = window.SGFar && SGFar.on ? SGFar.bounds : null; if (F) return Math.min(BM.W/(2*Math.max(-F[0], F[2])), BM.H/(2*Math.max(-F[1], F[3])))*1.02; return Math.min(BM.W, BM.H)/(2*bmHalf())*1.02; }", need=False)
    return src
