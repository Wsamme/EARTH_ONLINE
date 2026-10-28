# Generates the Greater Bay engine modules gbareal/app/gbareal.js, gbstats.js: hkreal/mkengine.py's Hong Kong transformations of
# sgreal/app/sgreal.js (run here on a copy, writing only into gbareal/app), then the gba changes:
#   - data paths gbadata/gba_*.txt, titles
#   - the district raster is 16-bit (base.pa16: Shenzhen subdistricts + Dongguan towns + the Hong Kong neighbourhoods > 254)
#   - tile streaming over 63 x 63 tiles: levels by distance (near < 4.3 km: everything; far < 16 km: big buildings + roads without
#     service roads / paths; sky < 60 km: buildings >= 45 m and motorways / trunk roads; beyond: nothing, the ground texture's baked
#     roofs only). Tiles are built when they come into range and disposed when they leave it (Hong Kong built all 784 at the start).
#   - the terrain as 18 x 18 chunks (100 x 100 segments of 70 m) with distance LOD (steps 1, 2, 4, 10, 20) and skirts, normals from
#     the height grid (one material: the ground shader patches still apply); refreshTerrain (sculpt tools) rebuilds the chunks it touches
#   - fog / camera distance for the 126 km square
import re, sys
SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/'
hk = open(SC + 'hkreal/mkengine.py').read()
for a, b in [("open(SC + 'hkreal/app/hkreal.js', 'w')", "open(SC + 'gbareal/app/gbareal.js', 'w')"), ("open(SC + 'hkreal/app/hkstats.js', 'w')", "open(SC + 'gbareal/app/gbstats.js', 'w')"), ("print('ok')", "")]:
    assert hk.count(a) == 1, a; hk = hk.replace(a, b)
exec(compile(hk, 'hkreal/mkengine.py (gba copy)', 'exec'))
src = open(SC + 'gbareal/app/gbareal.js').read()
def R(a, b, count=1):
    global src
    n = src.count(a); assert n == count, (n, a[:140]); src = src.replace(a, b)
def func_span(name):
    m = re.search(r'\n(function\*? ' + re.escape(name) + r'\()', src); assert m, name
    s = m.start() + 1; i = src.index('{', s); d = 0
    while True:
        c = src[i]
        if c == '{': d += 1
        elif c == '}':
            d -= 1
            if d == 0: return s, i + 1
        i += 1
def replace_func(name, code):
    global src
    s, e = func_span(name); src = src[:s] + code.strip('\n') + src[e:]

R("/* ================= v37: Hong Kong 1:1 — Hong Kong Island, Kowloon, the New Territories, Lantau and the islands; Shenzhen as context (OSM roads, real building footprints, coastline, terrain) ================= */",
  "/* ================= gba: the Greater Bay 1:1 — Dongguan, Shenzhen and Hong Kong in one 126 km square (OSM roads, real building footprints, coastline, terrain); the delta around as context ================= */")
R("const SGR_PATH = 'hkdata/', SGR_TEX = 4096;", "const SGR_PATH = 'gbadata/', SGR_TEX = 4096;\nconst SGR_GBA = true;")
R("showBusy(`正在载入真实香港地图 ${done}/5 · Loading the real map of Hong Kong`)", "showBusy(`正在载入大湾区地图 ${done}/5 · Loading the Greater Bay map`)")
R("step(sgrFetch('hk_base.txt')), step(sgrFetch('hk_roads.txt')), step(sgrFetch('hk_water.txt')), step(sgrFetch('hk_bld0.txt'))",
  "step(sgrFetch('gba_base.txt')), step(sgrFetch('gba_roads.txt')), step(sgrFetch('gba_water.txt')), step(sgrFetch('gba_bld0.txt'))")
R("buf = await sgrFetch('hk_bld' + k + '.txt');", "buf = await sgrFetch('gba_bld' + k + '.txt');")
# ---------- 16-bit districts ----------
R("  SG.lu = sgRLE(B.lu, N); SG.pa = sgRLE(B.pa, N);", "  SG.lu = sgRLE(B.lu, N); SG.pa = B.pa16 ? sgrRLE16(B.pa, N) : sgRLE(B.pa, N);")
R("function sgZoning(){", """function sgrRLE16(b64, n){
  const s = atob(b64), out = new Uint16Array(n*n); let o = 0;
  for (let i = 0; i + 3 < s.length; i += 4){ const v = s.charCodeAt(i) | (s.charCodeAt(i+1) << 8), c = s.charCodeAt(i+2) | (s.charCodeAt(i+3) << 8); if (v) out.fill(v, o, Math.min(n*n, o + c)); o += c; }
  return out;
}
function sgZoning(){""")
# ---------- the world: fog, camera distance ----------
R("scene.fog.near = SGR.on ? 36000 : 22000; scene.fog.far = SGR.on ? 115000 : 68000; controls.maxDistance = SGR.on ? 72000 : 50000;",
  "scene.fog.near = SGR.on ? 60000 : 22000; scene.fog.far = SGR.on ? 210000 : 68000; controls.maxDistance = SGR.on ? 150000 : 50000;")
# ---------- tile streaming: levels by distance ----------
R("const SGR_NEAR_IN = 4300, SGR_NEAR_OUT = 6200;",
  """const SGR_NEAR_IN = 4300, SGR_NEAR_OUT = 6200, SGR_FAR_IN = 16000, SGR_FAR_OUT = 19000, SGR_SKY_IN = 70000, SGR_SKY_OUT = 76000, SGR_SKY_H = 45;
// the tile queue clears a tile's queued flag when it is taken (so lodTick can enqueue 4 000 tiles cheaply)
class SgrQueue extends Array { shift(){ const T = super.shift(); if (T) T.inQ = false; return T; } }
function sgrEnq(T){ if (!T.inQ){ T.inQ = true; SGR.queue.push(T); } }
// sky level: only the tall buildings (>= SGR_SKY_H), merged per block of 4 x 4 tiles (8 km): one building mesh set per block instead of
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
replace_func('sgrTilesClear', """
function sgrTilesClear(){
  for (const T of SGR.tiles.values()) sgrTileDispose(T, true);
  if (SGR.skyB){ for (const B of SGR.skyB.values()) if (B.group){ SGR.group.remove(B.group); B.group.traverse(q => { if (q.geometry) q.geometry.dispose(); }); } SGR.skyB.clear(); }
  SGR.tiles.clear(); SGR.queue = new SgrQueue(); SGR.built = 0; SGR.total = 0;
}""")
replace_func('sgrTilesInit', """
function sgrTilesInit(){
  sgrTilesClear();
  const T = SGR.base.TILE, TX = Math.round(2*HALF/T);
  for (let ti = 0; ti < TX*TX; ti++){ const c = sgrTileC(ti); SGR.tiles.set(ti, {ti, cx:c[0], cy:c[1], road:null, bld:null, trees:null, treesDone:false, done:false, lv:0, want:0}); }
  for (const Tl of SGR.tiles.values()){ Tl.lv = 0; Tl.want = 0; sgrLodTile(Tl); }
  SGR.total = SGR.queue.length; SGR.t0 = performance.now(); sgrSortQueue();
}""")
replace_func('sgrBuildTile', """
function sgrBuildTile(T){
  const lv = T.lv || 0;
  if (!lv){ sgrTileDispose(T, true); T.done = false; return; }
  if (lv === 1){ sgrTileDispose(T, true); SGR.bldData.dropSmall(T.ti); T.done = true; T.builtLv = 1; T.lvl = 0; sgrSkyDirty(T.ti); return; }     // drawn by its sky block
  const rl = lv === 1 ? 2 : T.want ? 1 : 0;           // road level: 1 near, 0 far, 2 sky
  if (T.road && T.roadLvl !== rl){ for (const k of ['major', 'minor', 'paths']) if (T.road[k]){ SGR.group.remove(T.road[k]); T.road[k].traverse(q => { if (q.geometry) q.geometry.dispose(); }); } T.road = null; }
  if (!T.road){
    T.roadLvl = rl;
    const r = SGRoads.build(SGR.lines, {only:new Set([T.ti]), skipLine:rl === 1 ? sgrSkipLine : rl === 2 ? sgrSkipSky : sgrSkipFar}).tiles.get(T.ti);
    T.road = r || {major:null, minor:null, paths:null};
    for (const k of ['major', 'minor', 'paths']) if (T.road[k]){ sgrRelease(T.road[k]); SGR.group.add(T.road[k]); }
  }
  sgrTileDispose(T, false);
  const lvl = lv === 1 ? 0 : (T.want || 0); T.lvl = lvl;
  let list = SGR.bldData.big(T.ti) || [];
  if (lv === 1){ list = list.filter(B => B.h >= SGR_SKY_H); SGR.bldData.dropSmall(T.ti); }
  else if (lvl){ const sm = SGR.bldData.small(T.ti); if (sm){ if (sm.length) list = list.concat(sm); } else T.lvl = -1; }      // -1: its part file is still loading
  else SGR.bldData.dropSmall(T.ti);
  if (list && list.length){ const b = SGBld.buildTile(T.ti, list, {skip:sgrSkipB, release:true}); if (b.group.children.length){ T.bld = b; SGR.group.add(b.group); } }
  // add-on modules (signs, ads, lights ...) decorate the tile's real buildings (not at the sky level)
  if (lv >= 2 && list && list.length) for (const f of HOOKS.tile){ let o = null; try { o = f(T, list, sgrSkipB); } catch (e){ console.error('tile hook', e); } if (o){ SGR.group.add(o); (T.extra || (T.extra = [])).push(o); } }
  T.done = true; T.builtLv = lv; sgrLodTile(T);
}""")
R("""  const d = sgrTileDist(T);
  // level of detail of the tile (rebuilt when it changes)
  const want = d < (T.want ? SGR_NEAR_OUT : SGR_NEAR_IN) ? 1 : 0;
  if (want !== (T.want || 0)){ T.want = want; if (T.done){ SGR.dirty.add(T.ti); if (!SGR.queue.includes(T)){ SGR.queue.push(T); SGR.lodQ = true; } } }""",
  """  const d = sgrTileDist(T);
  // level of detail of the tile (rebuilt when it changes); out of range: disposed
  const c_ = camera.position, hw_ = SGR.base.TILE/2, ds = Math.hypot(Math.max(0, Math.abs(c_.x - T.cx) - hw_), Math.max(0, Math.abs(-c_.z - T.cy) - hw_), Math.max(0, c_.y - 20)*0.45);
  const want = d < (T.want ? SGR_NEAR_OUT : SGR_NEAR_IN) ? 1 : 0, cur = T.lv || 0, lv = d < (cur >= 2 ? SGR_FAR_OUT : SGR_FAR_IN) ? 2 : ds < (cur >= 1 ? SGR_SKY_OUT : SGR_SKY_IN) ? 1 : 0;
  if (want !== (T.want || 0) || lv !== cur){ T.want = want; T.lv = lv;
    if (cur === 1 || lv === 1) sgrSkyDirty(T.ti);
    if (!lv){ if (T.done){ sgrTileDispose(T, true); T.done = false; } return; }
    if (T.done) SGR.dirty.add(T.ti); sgrEnq(T); SGR.lodQ = true; }
  if (!T.done) return;""")
R("  if (SGR.on) for (const T of SGR.tiles.values()) if (T.done) sgrLodTile(T);\n}", "  if (SGR.on){ for (const T of SGR.tiles.values()) sgrLodTile(T); sgtUpdate(); }\n}")
R("    while (SGR.queue.length && performance.now() - t < 16){ const T = SGR.queue.shift(); if (T.done && !SGR.dirty.has(T.ti)) continue; SGR.dirty.delete(T.ti); sgrBuildTile(T); SGR.built++; }",
  "    while (SGR.queue.length && performance.now() - t < 16){ const T = SGR.queue.shift(); if (T.done && !SGR.dirty.has(T.ti)) continue; if (!T.lv && !T.done) continue; SGR.dirty.delete(T.ti); sgrBuildTile(T); SGR.built++; }")
# ---------- chunked terrain ----------
R("/* ---------- campuses and gardens: models on top of the real map; their ground is painted onto the texture ---------- */", r"""/* ---------- gba: the inland water bodies merged per 8 km cell (each body keeps its level as the vertices' height; 4 540 bodies were one mesh each) ---------- */
function sgrWater(){
  sgrDisposeGroup(SGR.waterGroup);
  const Wd = SGR.water;
  const s = new THREE.Mesh(sgrWaterGeo(Wd.sea, () => -0.05), sea.material); s.renderOrder = 1; SGR.waterGroup.add(s);
  const cells = new Map(), G = 8000;
  for (const b of Wd.bodies){ const m = b.m; if (!m.V.length) continue; const k = Math.floor((m.V[1]/4 + HALF)/G)*100 + Math.floor((m.V[0]/4 + HALF)/G); let L = cells.get(k); if (!L) cells.set(k, L = []); L.push(b); }
  for (const L of cells.values()){
    let nv = 0, ni = 0; for (const b of L){ nv += b.m.V.length/2; ni += b.m.I.length; }
    const pos = new Float32Array(nv*3), nor = new Float32Array(nv*3), idx = new Uint32Array(ni); let v = 0, o = 0;
    for (const b of L){ const V = b.m.V, I = b.m.I, n = V.length/2; for (let i = 0; i < n; i++){ pos[(v + i)*3] = V[i*2]/4; pos[(v + i)*3 + 1] = b.lv - 0.05; pos[(v + i)*3 + 2] = -V[i*2 + 1]/4; nor[(v + i)*3 + 1] = 1; } for (let i = 0; i < I.length; i++) idx[o++] = I[i] + v; v += n; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeBoundingSphere();
    const m = new THREE.Mesh(g, sea.material); m.renderOrder = 1; SGR.waterGroup.add(m);
  }
  for (const f of Wd.flat){
    const pier = f.kind === 3, m = new THREE.Mesh(sgrWaterGeo(f.m, pier ? (x, y) => Math.max(1.7, hC(x, y) + 0.35) : (x, y) => hC(x, y) + 0.12), pier ? matSgrPier : f.kind === 2 ? matSgrPool : matSgrPond);
    m.receiveShadow = true; SGR.waterGroup.add(m);
  }
}

/* ---------- gba: the terrain in chunks with distance LOD (the 126 km square has 3.2 M terrain vertices) ---------- */
// 18 x 18 chunks of 100 x 100 segments (7 km); each drawn at step 1, 2, 4, 10 or 20 grid cells by its distance from the camera;
// a skirt (hanging 12 m + 6 m per step) along each chunk's edge hides the cracks between different steps. Normals come from the
// height grid (central differences), so the chunks join without lighting seams. 'terrain' is a Group carrying the one material.
const SGT = {CH:100, steps:[1, 2, 4, 10, 20], chunks:[], mat:null, n:0, stats:{tris:0, rebuilt:0}};
function sgtStepFor(C){
  const c = camera.position, dx = Math.max(0, Math.abs(c.x - C.cx) - C.hw), dz = Math.max(0, Math.abs(c.z - C.cz) - C.hw), dy = Math.max(0, c.y - C.hmax);
  const d = Math.hypot(dx, dz, dy);
  return d < 4500 ? 1 : d < 11000 ? 2 : d < 24000 ? 4 : d < 55000 ? 10 : 20;
}
function sgtBuild(C, s){
  const CH = SGT.CH, i0 = C.ci*CH, j0 = C.cj*CH, m = CH/s + 1, nv = m*m + 4*m, pos = new Float32Array(nv*3), nor = new Float32Array(nv*3), uv = new Float32Array(nv*2);
  const put = (v, i, j, drop) => { const k = j*TN + i, h = H[k]; pos[v*3] = -HALF + i*TS; pos[v*3+1] = h - drop; pos[v*3+2] = HALF - j*TS;
    const hx = (H[j*TN + Math.min(TN-1, i+1)] - H[j*TN + Math.max(0, i-1)])/(TS*((i > 0 && i < TN-1) ? 2 : 1)), hy = (H[Math.min(TN-1, j+1)*TN + i] - H[Math.max(0, j-1)*TN + i])/(TS*((j > 0 && j < TN-1) ? 2 : 1));
    const L = Math.hypot(hx, 1, hy); nor[v*3] = -hx/L; nor[v*3+1] = 1/L; nor[v*3+2] = hy/L; uv[v*2] = i/(TN-1); uv[v*2+1] = j/(TN-1); };
  for (let b = 0; b < m; b++) for (let a = 0; a < m; a++) put(b*m + a, i0 + a*s, j0 + b*s, 0);
  const drop = 12 + 6*s, idx = new Uint32Array((m-1)*(m-1)*6 + 4*(m-1)*6); let o = 0;
  for (let b = 0; b < m-1; b++) for (let a = 0; a < m-1; a++){ const p = b*m + a, q = p + 1, r = p + m + 1, t = p + m; idx[o++] = p; idx[o++] = q; idx[o++] = r; idx[o++] = p; idx[o++] = r; idx[o++] = t; }
  // skirts: the four edges, each a strip from the edge vertices down by 'drop'
  const edges = [[a => a, () => 0], [a => a, () => m-1], [() => 0, a => a], [() => m-1, a => a]];
  let v = m*m;
  edges.forEach(([fa, fb], e) => { const base = v; for (let a = 0; a < m; a++){ const A = fa(a), B = fb(a); put(v++, i0 + A*s, j0 + B*s, drop); }
    for (let a = 0; a < m-1; a++){ const A0 = fa(a), B0 = fb(a), A1 = fa(a+1), B1 = fb(a+1), t0 = B0*m + A0, t1 = B1*m + A1, s0 = base + a, s1 = base + a + 1;
      if (e === 0 || e === 3){ idx[o++] = t0; idx[o++] = s0; idx[o++] = s1; idx[o++] = t0; idx[o++] = s1; idx[o++] = t1; } else { idx[o++] = t0; idx[o++] = s1; idx[o++] = s0; idx[o++] = t0; idx[o++] = t1; idx[o++] = s1; } } });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeBoundingSphere();
  if (C.mesh){ C.mesh.geometry.dispose(); C.mesh.geometry = g; } else { C.mesh = new THREE.Mesh(g, SGT.mat); C.mesh.receiveShadow = true; C.mesh.matrixAutoUpdate = false; terrain.add(C.mesh); }
  C.s = s; C.tris = idx.length/3; SGT.stats.rebuilt++;
}
function buildTerrainMesh(){
  if (terrain){ scene.remove(terrain); terrain.traverse(o => { if (o.isMesh) o.geometry.dispose(); }); }
  if (!SGT.mat) SGT.mat = new THREE.MeshLambertMaterial({map:terrTex});
  terrain = new THREE.Group(); terrain.material = SGT.mat; terrain.receiveShadow = true; terrain.geometry = {dispose(){}}; scene.add(terrain);
  const CH = SGT.CH, n = Math.round((TN - 1)/CH); SGT.n = n; SGT.chunks = [];
  if (n*CH !== TN - 1){ console.error('terrain chunks: TN-1 not a multiple of', CH); }
  for (let cj = 0; cj < n; cj++) for (let ci = 0; ci < n; ci++){
    let hmax = -1e9; for (let j = cj*CH; j <= (cj+1)*CH; j += 5) for (let i = ci*CH; i <= (ci+1)*CH; i += 5) hmax = Math.max(hmax, H[j*TN + i]);
    const C = {ci, cj, cx:-HALF + (ci + 0.5)*CH*TS, cz:HALF - (cj + 0.5)*CH*TS, hw:CH*TS/2, hmax, s:0, mesh:null, tris:0};
    SGT.chunks.push(C); sgtBuild(C, sgtStepFor(C));
  }
  sgtUpdate(true);
}
// re-step the chunks whose wanted step changed (at most 'all' or 10 per call; nearest first)
function sgtUpdate(all){
  if (!SGT.chunks.length) return;
  const todo = []; for (const C of SGT.chunks){ const s = sgtStepFor(C); if (s !== C.s) todo.push([s, C]); }
  todo.sort((a, b) => a[0] - b[0]);
  for (const [s, C] of all ? todo : todo.slice(0, 10)) sgtBuild(C, s);
  let t = 0; for (const C of SGT.chunks) t += C.tris; SGT.stats.tris = t;
}
// the sculpt tools changed H inside bb: rebuild the chunks there (then the engine's own work: nature layer, slope, colours ...)
function sgtRefreshChunks(bb){
  const CH = SGT.CH*TS; for (const C of SGT.chunks){ const x0 = -HALF + C.ci*CH, y0 = -HALF + C.cj*CH; if (bb[2] < x0 - TS || bb[0] > x0 + CH + TS || bb[3] < y0 - TS || bb[1] > y0 + CH + TS) continue; sgtBuild(C, C.s || 1); }
}

/* ---------- campuses and gardens: models on top of the real map; their ground is painted onto the texture ---------- */""")
R("const SG_SUB = 'City Brush · 香港 Hong Kong 1:1 · 真实地图 Real map · © OpenStreetMap', ISL_SUB = 'City Brush · 地图 24 × 24 km';",
  "const SG_SUB = 'City Brush · 大湾区 Greater Bay 1:1 · 东莞 深圳 香港 · 真实地图 Real map · © OpenStreetMap', ISL_SUB = 'City Brush · 地图 24 × 24 km';")
R("showBusy('正在载入真实香港地图… Loading the real map of Hong Kong');\n  sgrLoad().then(() => {", "showBusy('正在载入大湾区地图… Loading the Greater Bay map (Dongguan · Shenzhen · Hong Kong)');\n  sgrLoad().then(() => {")
R("showToast('无法载入香港地图数据，已改为生成岛屿 · Could not load the Hong Kong data; showing a generated island');", "showToast('无法载入大湾区地图数据，已改为生成岛屿 · Could not load the Greater Bay data; showing a generated island');")
# sky blocks are rebuilt in the frame step
R("  if (SGR.lodQ){ SGR.lodQ = false; sgrSortQueue(); }", "  if (SGR.lodQ){ SGR.lodQ = false; sgrSortQueue(); }\n  sgrSkyStep(window.__budget || 8);")
# ---------- memory: the app's traffic graph (gravity assignment, the generic cars) keeps Hong Kong's road classes (0-9) inside Hong
# Kong; in Shenzhen, Dongguan and the context only the motorways and trunk roads and their links (0-3) ----------
R("  if (!SGR.graphSegs.length) SGR.graphSegs = SGRoads.graph(SGR.lines).filter(s => s[4] >= 1);", "  if (!SGR.graphSegs.length) SGR.graphSegs = sgrGraphSegs();")
R("function sgZoning(){", """// the regions raster: districts (SG.pa) -> region (SGD.pas[].reg); the first 18 regions are Hong Kong's districts (b6 order)
function sgrInHK(x, y){ const pi = SG.pa ? SG.pa[cx2i(y)*N + cx2i(x)] : 0, P = pi ? SGD.pas[pi - 1] : null; return !!P && P.reg >= 1 && P.reg <= 18; }
function sgrGraphSegs(){
  const out = [], lines = SGR.lines;
  for (let i = 0; i < lines.length; i++){
    const L = lines[i], c = L.c; if (c > 9) continue;
    const P = L.P, E = L.E, np = P.length >> 1, m = (np >> 1) << 1;
    if (c > 3 && !sgrInHK(P[m], P[m+1])) continue;
    const gc = c <= 1 ? 2 : 1;
    for (let k = 0; k < np - 1; k++){ const x0 = P[k*2], y0 = P[k*2+1], x1 = P[k*2+2], y1 = P[k*2+3]; if (x0 === x1 && y0 === y1) continue; out.push([x0, y0, x1, y1, gc, E ? E[k] : 0, E ? E[k+1] : 0]); }
  }
  return out;
}
function sgZoning(){""")
# ---------- memory: road chunks loaded around the camera (tools/rc_app.js) ----------
R("step(sgrFetch('gba_base.txt')), step(sgrFetch('gba_roads.txt')), step(sgrFetch('gba_water.txt')), step(sgrFetch('gba_bld0.txt'))",
  "step(sgrFetch('gba_base.txt')), null, step(sgrFetch('gba_water.txt')), step(sgrFetch('gba_bld0.txt'))")
R("    SGR.lines = SGRoads.decode(r, base.names, base.refs);",
  "    SGR.rc = new Map(); SGR.rcMeta = null; { const p = window.__near ? sgXY(window.__near[0], window.__near[1]) : sgXY(22.2880, 114.1650); await sgrRcFetch(base.roadChunks.filter(C => sgrRcDist(C, p[0], p[1], 0) < SGR_RC_PRE)); }\n    SGR.lines = sgrRcJoin();")
R("/* ---------- gba: the terrain in chunks", open(SC + 'gbareal/tools/rc_app.js').read() + "\n/* ---------- gba: the terrain in chunks")
R("  if (SGR.on){ for (const T of SGR.tiles.values()) sgrLodTile(T); sgtUpdate(); }", "  if (SGR.on){ for (const T of SGR.tiles.values()) sgrLodTile(T); sgtUpdate(); sgrRcTick(); }")
# ---------- labels: places and POIs capped (Hong Kong had 2600 / 3000) ----------
R("    base.H = null; SGR.base = base; SGR.img = img;", "    base.H = null; base.places = base.places.slice(0, 3000); base.pois = base.pois.slice(0, 3500); SGR.base = base; SGR.img = img;")
# ---------- option: the 8192 px ground texture (15.4 m/px; b3c_ground8k.py) — GBA_TEX=8192 ----------
import os as _os
if _os.environ.get('GBA_TEX') == '8192':
    R("const SGR_PATH = 'gbadata/', SGR_TEX = 4096;", "const SGR_PATH = 'gbadata/', SGR_TEX = 8192;")
    R("img.src = SGR_PATH + 'ground.webp';", "img.src = SGR_PATH + 'ground8k.webp';")
open(SC + 'gbareal/app/gbareal.js', 'w').write(src)
s2 = open(SC + 'gbareal/app/gbstats.js').read()
a = "['地图', 'Map', '1:1 · 56 × 56 km']"; assert s2.count(a) == 1
s2 = s2.replace(a, "['地图', 'Map', '1:1 · 126 × 126 km']")
open(SC + 'gbareal/app/gbstats.js', 'w').write(s2)
print('ok')
