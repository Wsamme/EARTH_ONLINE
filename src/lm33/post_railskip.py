# v37: the elevated rail's generic piers (drawMRT, every second vertex) are skipped under landmark models that bring their own
# structure (Tsing Ma, Kap Shui Mun ... — the same hull test the road module uses for its piers via SGRoads.setStructSkip).
# The rail is built before the app's own hull pass, so the hulls are computed once on first use. A POSTS file (all cities).
JS = r'''
/* v37 lm33/post_railskip.py: no generic rail piers inside a landmark's ground plan */
function sgrRailSkip(x, y){
  if (typeof SGR === 'undefined' || !SGR.on || !SGR.hulls) return false;
  if (!sgrRailSkip.init){ sgrRailSkip.init = true; try { if (typeof sgrLandmarkHulls === 'function') sgrLandmarkHulls(); } catch (e){ /* none yet */ } }
  for (const H of SGR.hulls.values()){ const b = H.bb; if (!b || x < b[0] || x > b[2] || y < b[1] || y > b[3]) continue; if (pip(H.P, x, y)) return true; }
  return false;
}
'''
def apply(src, city):
    a = "if (yR[i] - gg > 2.5){"
    assert src.count(a) == 1, ('railskip', src.count(a))
    src = src.replace(a, "if (yR[i] - gg > 2.5 && !sgrRailSkip(p0[0], p0[1])){")
    m = '/* ================= loop ================= */'
    assert src.count(m) == 1
    return src.replace(m, JS + m)
