p='mkengine.py'; s=open(p).read()
def R(a,b):
    global s; assert s.count(a)==1,a[:80]; s=s.replace(a,b)
R("""// sky level: only the tall buildings and the motorways / trunk roads
function sgrSkipSky(i){ const c = SGR.lines[i].c; return c > 3 || sgrSkipLine(i); }""",
"""// sky level: only the tall buildings (>= SGR_SKY_H), merged per block of 4 x 4 tiles (8 km): one building mesh set per block instead of
// per tile (draw calls); a block is rebuilt when one of its tiles enters or leaves the sky level. No roads at the sky level.
function sgrSkipSky(i){ const c = SGR.lines[i].c; return c > 3 || sgrSkipLine(i); }
const SGR_SKYB = 4;
function sgrSkyKey(ti){ const TX = Math.round(2*HALF/SGR.base.TILE), tx = ti % TX, ty = (ti - tx)/TX; return Math.floor(ty/SGR_SKYB)*1000 + Math.floor(tx/SGR_SKYB); }
function sgrSkyDirty(ti){ if (!SGR.skyB) SGR.skyB = new Map(); const k = sgrSkyKey(ti); let B = SGR.skyB.get(k); if (!B) SGR.skyB.set(k, B = {k, group:null, dirty:false}); B.dirty = true; SGR.skyDirty = true; }
function sgrSkyStep(budget){
  if (!SGR.skyDirty || !SGR.skyB) return; SGR.skyDirty = false; const t = performance.now(), TX = Math.round(2*HALF/SGR.base.TILE);
  for (const B of SGR.skyB.values()){
    if (!B.dirty) continue; if (performance.now() - t > budget){ SGR.skyDirty = true; break; }
    B.dirty = false; if (B.group){ SGR.group.remove(B.group); B.group.traverse(q => { if (q.geometry) q.geometry.dispose(); }); B.group = null; }
    const bx = B.k % 1000, by = (B.k - bx)/1000, list = [];
    for (let ty = by*SGR_SKYB; ty < Math.min(TX, (by + 1)*SGR_SKYB); ty++) for (let tx = bx*SGR_SKYB; tx < Math.min(TX, (bx + 1)*SGR_SKYB); tx++){
      const T = SGR.tiles.get(ty*TX + tx); if (!T || T.lv !== 1) continue; const L = SGR.bldData.big(T.ti); if (L) for (const b of L) if (b.h >= SGR_SKY_H) list.push(b); }
    if (list.length){ const ci = Math.min(TX - 1, by*SGR_SKYB + 2)*TX + Math.min(TX - 1, bx*SGR_SKYB + 2), r = SGBld.buildTile(ci, list, {skip:sgrSkipB, release:true}); if (r.group.children.length){ B.group = r.group; B.n = list.length; SGR.group.add(r.group); } }
  }
}""")
R("""  const lv = T.lv || 0;
  if (!lv){ sgrTileDispose(T, true); T.done = false; return; }""",
"""  const lv = T.lv || 0;
  if (!lv){ sgrTileDispose(T, true); T.done = false; return; }
  if (lv === 1){ sgrTileDispose(T, true); SGR.bldData.dropSmall(T.ti); T.done = true; T.builtLv = 1; T.lvl = 0; sgrSkyDirty(T.ti); return; }     // drawn by its sky block""")
R("""  const want = d < (T.want ? SGR_NEAR_OUT : SGR_NEAR_IN) ? 1 : 0, cur = T.lv || 0, lv = d < (cur >= 2 ? SGR_FAR_OUT : SGR_FAR_IN) ? 2 : d < (cur >= 1 ? SGR_SKY_OUT : SGR_SKY_IN) ? 1 : 0;
  if (want !== (T.want || 0) || lv !== cur){ T.want = want; T.lv = lv;
    if (!lv){ if (T.done){ sgrTileDispose(T, true); T.done = false; } return; }""",
"""  const c_ = camera.position, hw_ = SGR.base.TILE/2, ds = Math.hypot(Math.max(0, Math.abs(c_.x - T.cx) - hw_), Math.max(0, Math.abs(-c_.z - T.cy) - hw_), Math.max(0, c_.y - 20)*0.45);
  const want = d < (T.want ? SGR_NEAR_OUT : SGR_NEAR_IN) ? 1 : 0, cur = T.lv || 0, lv = d < (cur >= 2 ? SGR_FAR_OUT : SGR_FAR_IN) ? 2 : ds < (cur >= 1 ? SGR_SKY_OUT : SGR_SKY_IN) ? 1 : 0;
  if (want !== (T.want || 0) || lv !== cur){ T.want = want; T.lv = lv;
    if (cur === 1 || lv === 1) sgrSkyDirty(T.ti);
    if (!lv){ if (T.done){ sgrTileDispose(T, true); T.done = false; } return; }""")
R("SGR_SKY_IN = 60000, SGR_SKY_OUT = 66000, SGR_SKY_H = 45;", "SGR_SKY_IN = 70000, SGR_SKY_OUT = 76000, SGR_SKY_H = 45;")
R("  for (const Tl of SGR.tiles.values()){ const d = sgrTileDist(Tl); Tl.want = d < SGR_NEAR_IN ? 1 : 0; Tl.lv = d < SGR_FAR_IN ? 2 : d < SGR_SKY_IN ? 1 : 0; if (Tl.lv) sgrEnq(Tl); }",
  "  for (const Tl of SGR.tiles.values()){ Tl.lv = 0; Tl.want = 0; sgrLodTile(Tl); }")
R("function sgrTilesClear(){\n  for (const T of SGR.tiles.values()) sgrTileDispose(T, true);",
  "function sgrTilesClear(){\n  for (const T of SGR.tiles.values()) sgrTileDispose(T, true);\n  if (SGR.skyB){ for (const B of SGR.skyB.values()) if (B.group){ SGR.group.remove(B.group); B.group.traverse(q => { if (q.geometry) q.geometry.dispose(); }); } SGR.skyB.clear(); }")
R("open(SC + 'gbareal/app/gbareal.js', 'w').write(src)", """# sky blocks are rebuilt in the frame step
R("  if (SGR.lodQ){ SGR.lodQ = false; sgrSortQueue(); }", "  if (SGR.lodQ){ SGR.lodQ = false; sgrSortQueue(); }\\n  sgrSkyStep(window.__budget || 8);")
open(SC + 'gbareal/app/gbareal.js', 'w').write(src)""")
W = open('tools/water_merge.js').read()
R("/* ---------- gba: the terrain in chunks", W + "\n/* ---------- gba: the terrain in chunks")
open(p,'w').write(s)
p='patch_gba.py'; s=open(p).read()
R("    # ---------- the clock / sun: Hong Kong's zone ----------", """    # ---------- the administrative stars (lm24/admin): no data here (as Hong Kong): not the Singapore ones ----------
    R("if (typeof SGR_PATH === 'string' && SGR_PATH.startsWith('hk')) return 'hk';", "if (typeof SGR_PATH === 'string' && (SGR_PATH.startsWith('hk') || SGR_PATH.startsWith('gba'))) return 'hk';")
    # ---------- the clock / sun: Hong Kong's zone ----------""")
open(p,'w').write(s)
print('edited')
