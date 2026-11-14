p='mkengine.py'; s=open(p).read()
a="open(SC + 'gbareal/app/gbareal.js', 'w').write(src)"
assert s.count(a)==1
s=s.replace(a, r'''# ---------- memory: the app's traffic graph (gravity assignment, the generic cars) keeps Hong Kong's road classes (0-9) inside Hong
# Kong; in Shenzhen, Dongguan and the context only the main roads (0-5: motorways, trunk and primary roads and their links) ----------
R("  if (!SGR.graphSegs.length) SGR.graphSegs = SGRoads.graph(SGR.lines).filter(s => s[4] >= 1);", "  if (!SGR.graphSegs.length) SGR.graphSegs = sgrGraphSegs();")
R("function sgZoning(){", """// the regions raster: districts (SG.pa) -> region (SGD.pas[].reg); the first 18 regions are Hong Kong's districts (b6 order)
function sgrInHK(x, y){ const pi = SG.pa ? SG.pa[cx2i(y)*N + cx2i(x)] : 0, P = pi ? SGD.pas[pi - 1] : null; return !!P && P.reg >= 1 && P.reg <= 18; }
function sgrGraphSegs(){
  const out = [], lines = SGR.lines;
  for (let i = 0; i < lines.length; i++){
    const L = lines[i], c = L.c; if (c > 9) continue;
    const P = L.P, E = L.E, np = P.length >> 1, m = (np >> 1) << 1;
    if (c > 5 && !sgrInHK(P[m], P[m+1])) continue;
    const gc = c <= 1 ? 2 : 1;
    for (let k = 0; k < np - 1; k++){ const x0 = P[k*2], y0 = P[k*2+1], x1 = P[k*2+2], y1 = P[k*2+3]; if (x0 === x1 && y0 === y1) continue; out.push([x0, y0, x1, y1, gc, E ? E[k] : 0, E ? E[k+1] : 0]); }
  }
  return out;
}
function sgZoning(){""")
open(SC + 'gbareal/app/gbareal.js', 'w').write(src)''')
open(p,'w').write(s)
print('ok')
