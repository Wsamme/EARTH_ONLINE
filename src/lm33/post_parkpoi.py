# v37: no map POI / place labels inside the theme-park sites (Disney resorts, Ocean Park, USS): OSM names the rides, lands and
# characters there (trademarked names); the sites are brand-free, so only the site's own label stays. A POSTS file (all cities).
A = "  if (showPoi) for (const p of B.pois){ if (onLm(p.x, p.y) || siteDup(p) || subLab(p.x, p.y)) continue;"
B = ("  // v37 lm33/post_parkpoi.py: theme-park sites carry no OSM POI / place names\n"
     "  const PARKS = []; try { for (const [k, S] of Object.entries(SITES)) if (/disney|oceanpark|^uss$/i.test(k)){ const P = siteKeep(S); if (P && P.length > 2) PARKS.push({P, bb:bboxOf(P)}); } } catch (e){ /* none */ }\n"
     "  const inPark = (x, y) => { for (const Q of PARKS){ const b = Q.bb; if (x < b[0] || x > b[2] || y < b[1] || y > b[3]) continue; if (pip(Q.P, x, y)) return true; } return false; };\n"
     "  if (showPoi) for (const p of B.pois){ if (onLm(p.x, p.y) || siteDup(p) || subLab(p.x, p.y) || inPark(p.x, p.y)) continue;")
C = "    for (const p of B.places){ const key = String(p.en).toLowerCase(); if (seen.has(key)) continue;"
D = "    for (const p of B.places){ const key = String(p.en).toLowerCase(); if (seen.has(key) || (typeof inParkPlace === 'function' && inParkPlace(p.x, p.y))) continue;"
JS = r'''
/* v37 lm33/post_parkpoi.py: place labels inside the theme-park sites are dropped too */
function inParkPlace(x, y){
  try { for (const [k, S] of Object.entries(SITES)) if (/disney|oceanpark|^uss$/i.test(k)){ const P = siteKeep(S); if (!P || P.length < 3) continue;
    const b = bboxOf(P); if (x < b[0] || x > b[2] || y < b[1] || y > b[3]) continue; if (pip(P, x, y)) return true; } } catch (e){ /* none */ }
  return false;
}
'''
def apply(src, city):
    for a, b in ((A, B), (C, D)):
        n = src.count(a); assert n == 1, ('parkpoi', a[:40], n); src = src.replace(a, b)
    e = "s.key === 'uss' ? '🎢'"   # theme-park sites get the ride icon, not the campus cap
    assert src.count(e) == 1, ('parkpoi icon', src.count(e)); src = src.replace(e, "/^uss$|disney|oceanpark/i.test(s.key) ? '🎢'")
    m = '/* ================= loop ================= */'; assert src.count(m) == 1
    return src.replace(m, JS + m)
