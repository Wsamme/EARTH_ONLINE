# Generates the Bay Area copies of the real-map app modules from the Singapore ones (sgreal/app/sgreal.js, sgstats.js):
#   bayreal/app/bayreal.js, bayreal/app/baystats.js
# Every replacement is asserted, so a change in the Singapore sources shows up here.
import re, sys
SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/'
src = open(SC + 'sgreal/app/sgreal.js').read()
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

R("/* ================= v17: Singapore 1:1 — the real island (OSM roads, real building footprints, coastline, reservoirs) ================= */",
  "/* ================= v22: San Francisco Bay Area 1:1 — the real bay (OSM roads, 1.3 million real building footprints, coastline, terrain) ================= */")
R("const SGR_PATH = 'sgdata/', SGR_TEX = 4096;", "const SGR_PATH = 'baydata/', SGR_TEX = 4096;\nconst SGR_BAY = true; const SGR_US = true;")
# ---------- loading: base, roads, water, the big buildings first; the small buildings (3 parts) stream in afterwards ----------
R("showBusy(`正在载入真实新加坡地图 ${done}/5 · Loading the real map of Singapore`)", "showBusy(`正在载入真实旧金山湾区地图 ${done}/5 · Loading the real map of the San Francisco Bay Area`)")
R("const [b, r, wb, bl] = await Promise.all([step(sgrFetch('sg_base.txt')), step(sgrFetch('sg_roads.txt')), step(sgrFetch('sg_water.txt')), step(sgrFetch('sg_bld.txt')), step(img.decode())]);",
  "const [b, r, wb, bl] = await Promise.all([step(sgrFetch('bay_base.txt')), step(sgrFetch('bay_roads.txt')), step(sgrFetch('bay_water.txt')), step(sgrFetch('bay_bld0.txt')), step(img.decode())]);")
R("    SGR.bldData = SGBld.decode(bl);\n", "    SGR.bldData = SGBld.decode(bl);\n    sgrLoadParts(base.bldParts || 0);\n")
R("function sgrReadWater(buf){", """// the small buildings (houses, sheds, garages: 1.27 million) come in part files after the start; tiles near the camera that wanted
// them are rebuilt as each part arrives
function sgrLoadParts(n){
  if (SGR.partsLoading) return; SGR.partsLoading = true; SGR.partsDone = 0;
  (async () => {
    for (let k = 1; k <= n; k++){
      let buf = null;
      for (let a = 0; a < 3 && !buf; a++){ try { buf = await sgrFetch('bay_bld' + k + '.txt'); } catch (e){ console.warn('part ' + k, e); await new Promise(r => setTimeout(r, 1500)); } }
      if (!buf) continue;
      SGR.bldData.addPart(k, buf); SGR.partsDone = k;
      const set = new Set(); for (const T of SGR.tiles.values()) if (T.lvl === -1 && SGR.bldData.partOf(T.ti) === k) set.add(T.ti);
      if (set.size) sgrQueueTiles(set);
    }
  })();
}
function sgrReadWater(buf){""")
# ---------- the world: the highest summit and the main river ----------
R("const pk = sgXY(1.3546, 103.7764); let best = pk, bh = -1;", "const pk = sgXY(37.8816, -121.9142); let best = pk, bh = -1;")
R("world = {peak:{p:best, h:bh, name:['武吉知马山', 'Bukit Timah Hill']}, river:{p:sgXY(1.2893, 103.8485), len:3200, name:['新加坡河', 'Singapore River']},\n    mouth:sgXY(1.2866, 103.8546),",
  "world = {peak:{p:best, h:bh, name:['暗黑山', 'Mount Diablo']}, river:{p:sgXY(37.3520, -121.9050), len:27000, name:['瓜达卢佩河', 'Guadalupe River']},\n    mouth:sgXY(37.4300, -121.9700),")
# ---------- airports: SFO, OAK, SJC (the simple movement model; stands at the three terminal areas) ----------
R("R = (SGR.base.runways || []).filter(r => r.len > 3500 && sgXY(1.30, 103.95)[0] < r.a[0]);", "R = (SGR.base.runways || []).filter(r => r.len > 2900);")
R("for (const p of [sgXY(1.2717, 103.8197), sgXY(1.2650, 103.8203), sgXY(1.2557, 103.8178)]) SGR.discs.push({x:p[0], y:p[1], r:22, t:-1});\n", "")
# ships at anchor in the bay (Anchorage 9 south of the Bay Bridge, and off Alameda)
R("// anchored ships in the Singapore Strait and the eastern anchorages (replaces the generic placement in sgPort)", "// anchored ships in San Francisco Bay: the anchorages south of the Bay Bridge and off Hunters Point")
R("const box = [sgXY(1.19, 103.70), sgXY(1.27, 104.06)];\n  for (let t = 0; t < 900 && k < 46; t++){", "const box = [sgXY(37.660, -122.360), sgXY(37.785, -122.305)];\n  for (let t = 0; t < 900 && k < 13; t++){")
# ---------- districts: cities, census places and San Francisco neighbourhoods; counties as regions ----------
R("cap:r.en === 'Central Region'", "cap:r.en === 'San Francisco'")
# ---------- statistics are precomputed (1.3 million buildings are not all decoded) ----------
replace_func('sgrStats', """
function sgrStats(){
  const B = SGR.base.stats;
  const S = {n:B.n, gfa:B.gfa, pop:B.pop, jobs:B.jobs, hdb:0, tall:B.tall, byPa:B.byPa.map(r => ({pop:r[0], jobs:r[1], n:r[2], gfa:r[3]})), byType:Float64Array.from(B.byType)};
  // origins and destinations for the traffic model (1 km cells); homes scaled so floor/40 = residents (the app's traffic convention)
  let res = 0; for (const o of B.od) if (o[0] === 1) res += o[1];
  const kr = res ? B.pop*40/res : 1;
  SGR.od = B.od.map(o => ({zone:o[0], floor:o[0] === 1 ? o[1]*kr : o[1]*0.6, c:[o[2], o[3]]}));
  SGR.stats = S; return S;
}""")
# ---------- tiles: two levels of detail. Far: the big buildings and the main roads. Near (< ~4 km): every building, service road and path ----------
R("""  sgrTileDispose(T, false);
  const list = SGR.bldData.tiles.get(T.ti);""", """  sgrTileDispose(T, false);
  const lvl = T.want || 0; T.lvl = lvl;
  let list = SGR.bldData.big(T.ti) || [];
  if (lvl){ const sm = SGR.bldData.small(T.ti); if (sm){ if (sm.length) list = list.concat(sm); } else T.lvl = -1; }      // -1: its part file is still loading
  else SGR.bldData.dropSmall(T.ti);""")
R("""  if (!T.road){
    const r = SGRoads.build(SGR.lines, {only:new Set([T.ti]), skipLine:sgrSkipLine}).tiles.get(T.ti);""", """  const rl = T.want ? 1 : 0;
  if (T.road && T.roadLvl !== rl){ for (const k of ['major', 'minor', 'paths']) if (T.road[k]){ SGR.group.remove(T.road[k]); T.road[k].traverse(q => { if (q.geometry) q.geometry.dispose(); }); } T.road = null; }
  if (!T.road){
    T.roadLvl = rl;
    const r = SGRoads.build(SGR.lines, {only:new Set([T.ti]), skipLine:rl ? sgrSkipLine : sgrSkipFar}).tiles.get(T.ti);""")
R("function sgrSkipLine(i){", """// far tiles: no service roads, paths or piers (they are sub-pixel from there and there are 36 000 km of them)
function sgrSkipFar(i){ const c = SGR.lines[i].c; return c === 11 || c === 12 || c === 17 || sgrSkipLine(i); }
function sgrSkipLine(i){""")
R("""function sgrLodTile(T){
  const c = camera.position, h2 = Math.max(0, c.y - 20), half = SGR.base.TILE/2;
  const dx = Math.max(0, Math.abs(c.x - T.cx) - half), dz = Math.max(0, Math.abs(-c.z - T.cy) - half), d = Math.hypot(dx, dz, h2*0.9);""",
"""const SGR_NEAR_IN = 4300, SGR_NEAR_OUT = 6200;
function sgrTileDist(T){ const c = camera.position, h2 = Math.max(0, c.y - 20), half = SGR.base.TILE/2;
  const dx = Math.max(0, Math.abs(c.x - T.cx) - half), dz = Math.max(0, Math.abs(-c.z - T.cy) - half); return Math.hypot(dx, dz, h2*0.9); }
function sgrLodTile(T){
  const d = sgrTileDist(T);
  // level of detail of the tile (rebuilt when it changes)
  const want = d < (T.want ? SGR_NEAR_OUT : SGR_NEAR_IN) ? 1 : 0;
  if (want !== (T.want || 0)){ T.want = want; if (T.done){ SGR.dirty.add(T.ti); if (!SGR.queue.includes(T)){ SGR.queue.push(T); SGR.lodQ = true; } } }""")
R("""function sgrStep(){
  if (!SGR.on) return;
  if (SGR.queue.length){""", """function sgrStep(){
  if (!SGR.on) return;
  if (SGR.lodQ){ SGR.lodQ = false; sgrSortQueue(); }
  if (SGR.queue.length){""")
R("""  SGR.queue = [...SGR.tiles.values()]; SGR.total = SGR.queue.length; SGR.t0 = performance.now(); sgrSortQueue();""",
  """  SGR.queue = [...SGR.tiles.values()]; SGR.total = SGR.queue.length; SGR.t0 = performance.now(); sgrSortQueue();
  for (const T of SGR.tiles.values()) T.want = sgrTileDist(T) < SGR_NEAR_IN ? 1 : 0;""")
# the near queue should not show the start-up progress bar again
R("    if (SGR.total && SGR.built <= SGR.total) showBusy(", "    if (SGR.total && SGR.built <= SGR.total && !sgrAfterBuild.done) showBusy(")
# trees: street trees from a per-tile index of the lines (375 000 lines)
R("""  const W = {2:20, 4:15, 6:12, 8:9.5, 10:7}, Wo = {2:11, 4:10, 6:8, 8:7, 10:5.5};
  for (const l of SGR.lines){
    if (!(l.c in W) || (l.flags & 8)) continue;""", """  const W = {2:20, 4:15, 6:12, 8:9.5, 10:7}, Wo = {2:11, 4:10, 6:8, 8:7, 10:5.5};
  if (!SGR.treeIdx){ SGR.treeIdx = new Map(); const TT = SGR.base.TILE, TXn = Math.round(2*HALF/TT);
    SGR.lines.forEach((l, i) => { if (!(l.c in W)) return; const P = l.P, seen = new Set(); for (let k = 0; k < P.length; k += 2){ const t = Math.min(TXn - 1, Math.max(0, Math.floor((P[k+1] + HALF)/TT)))*TXn + Math.min(TXn - 1, Math.max(0, Math.floor((P[k] + HALF)/TT))); if (!seen.has(t)){ seen.add(t); let a = SGR.treeIdx.get(t); if (!a) SGR.treeIdx.set(t, a = []); a.push(i); } } }); }
  for (const li of SGR.treeIdx.get(T.ti) || []){
    const l = SGR.lines[li];
    if (!(l.c in W) || (l.flags & 8)) continue;""")
# ---------- rail: BART, Caltrain, Muni Metro LRVs, the F-line streetcars, cable cars, VTA light rail ----------
R("const SGR_LRT = new Set(['BP', 'SE', 'SW', 'PE', 'PW']);", """const SGR_LRT = {has:c => /^[MKV]/.test(c)};
// trains per system: speed m/s, car spacing, car size [length, height, width], track offset, height, cars per train, line metres per train
const SGR_TRAIN = c => c[0] === 'K' ? {sp:4.2, gap:9.5, sc:[8.4, 3.3, 2.5], side:0.95, y:1.75, cars:1, per:1300} :
  c === 'MF' ? {sp:6.5, gap:15, sc:[14.5, 3.4, 2.6], side:1.15, y:1.85, cars:1, per:1600} :
  c[0] === 'M' ? {sp:9, gap:23.4, sc:[23, 3.4, 2.7], side:1.2, y:1.9, cars:2, per:1900} :
  c[0] === 'V' ? {sp:12, gap:27.6, sc:[27, 3.6, 2.65], side:1.25, y:1.95, cars:2, per:2600} :
  c === 'CT' ? {sp:24, gap:26.4, sc:[25.9, 4.9, 3.2], side:1.9, y:2.6, cars:6, per:9000} :
  {sp:22, gap:21.8, sc:[21.3, 3.3, 3.2], side:1.9, y:2.1, cars:8, per:4200};""")
R("const R = {P, g, e, cls, yR, wat, cum, L, kind:'mrt', line:Ld, lrt, col:hexRGB(Ld.col).map(v => v/255)};",
  "const R = {P, g, e, cls, yR, wat, cum, L, kind:'mrt', line:Ld, lrt, street:lrt, col:hexRGB(Ld.col).map(v => v/255)};")
R("for (let t = 0; t < k; t++) net.trains.push({R, ph:(t/k)*2*R.L + rr()*300, sp:R.lrt ? 11 : 18, gap:R.lrt ? 11.5 : 23, sc:R.lrt ? [10.6, 3.1, 2.6] : [22.4, 3.7, 3.2], side:R.lrt ? 1.15 : 1.9, y:R.lrt ? 1.9 : 2.1, cars:R.lrt ? 2 : 6, col:R.col}); }",
  "const Tq = SGR_TRAIN(R.line.code), k2 = Math.max(1, Math.round(R.L/Tq.per)); for (let t = 0; t < k2; t++) net.trains.push({R, ph:(t/k2)*2*R.L + rr()*300, sp:Tq.sp, gap:Tq.gap, sc:Tq.sc, side:Tq.side, y:Tq.y, cars:Tq.cars, col:R.col, cc:R.line.code[0] === 'K'}); }")
R("for (let k = 0; k < T.cars; k++){ const f = k === 0 || k === T.cars - 1 ? 0.55 : 0.22;", "for (let k = 0; k < T.cars; k++){ const f = T.cc ? 0.92 : k === 0 || k === T.cars - 1 ? 0.55 : 0.22;")
# street-running lines follow the street, however steep (Nob Hill, Russian Hill: up to 30 %)
R("cls[i] = e[i] < gg - 1.5 ? 2 : e[i] - gg > 4 ? 1 : 0;", "cls[i] = lrt && el[i] === 0 ? 0 : e[i] < gg - 1.5 ? 2 : e[i] - gg > 4 ? 1 : 0;")
# landmark bridges bring their own piers and lamps: the road module skips its generic ones inside a landmark's ground plan
R("  sgrLandmarkHulls();\n  if (!SGR.roadLabels.length)", "  sgrLandmarkHulls();\n  SGRoads.setStructSkip((x, y) => { for (const H of SGR.hulls.values()){ const b = H.bb; if (x < b[0] || x > b[2] || y < b[1] || y > b[3]) continue; if (pip(H.P, x, y)) return true; } return false; });\n  if (!SGR.roadLabels.length)")
# (v22: trees under decks, on roads and in buildings are filtered by sgrTreeFree in the shared module)
# ---------- labels ----------
R("const big = /Reservoir|Lake|Strait|Selat|Harbour/.test(w.en);", "const big = !!w.b || /Reservoir|Strait|Harbor/.test(w.en);")
# ---------- entering ----------
R("const SG_SUB = 'City Brush · 新加坡 Singapore 1:1 · 真实地图 Real map · © OpenStreetMap', ISL_SUB = 'City Brush · 地图 24 × 24 km';",
  "const SG_SUB = 'City Brush · 旧金山湾区 San Francisco Bay Area 1:1 · 真实地图 Real map · © OpenStreetMap', ISL_SUB = 'City Brush · 地图 24 × 24 km';")
R("function sgView(){ const t = sgXY(1.2868, 103.8560), y = 4; controls.target.set(t[0], y, -t[1]); camera.position.set(t[0] + 2300, y + 2600, -t[1] + 4300); }",
  "function sgView(){ const t = sgXY(37.7905, -122.3990), y = 20; controls.target.set(t[0], y, -t[1]); camera.position.set(t[0] + 2600, y + 2300, -t[1] + 3600); }")
R("function sgFly(){ const t = sgXY(1.2868, 103.8560); flyTo(new THREE.Vector3(t[0] + 1500, 1050, -t[1] + 1900), new THREE.Vector3(t[0], 4, -t[1])); }",
  "function sgFly(){ const t = sgXY(37.7905, -122.3990); flyTo(new THREE.Vector3(t[0] + 1700, 1150, -t[1] + 2100), new THREE.Vector3(t[0], 20, -t[1])); }")
R("SG.on = true; SGR.on = true; styleKey = 'singapore'; islandSeed = 1965; FLAVOR.singapore.park = 'sgpark';", "SG.on = true; SGR.on = true; styleKey = 'manhattan'; islandSeed = 1776;")
R("SG.on = false; SGR.on = false; styleKey = 'tokyo'; FLAVOR.singapore.park = 'supertree';", "SG.on = false; SGR.on = false; styleKey = 'tokyo';")
R("showBusy('正在载入新加坡… Loading Singapore');", "showBusy('正在载入旧金山湾区… Loading the San Francisco Bay Area');")
R("showToast('新加坡地图载入失败 · Could not load the Singapore map');", "showToast('湾区地图载入失败 · Could not load the Bay Area map');")
R("showBusy('正在载入真实新加坡地图… Loading the real map of Singapore');\n  sgrLoad().then(() => {\n    sgBuild();",
  "showBusy('正在载入真实旧金山湾区地图… Loading the real map of the San Francisco Bay Area');\n  sgrLoad().then(() => {\n    sgView(); sgBuild();")
R("showToast('无法载入新加坡地图数据，已改为生成岛屿 · Could not load the Singapore data; showing a generated island');",
  "showToast('无法载入湾区地图数据，已改为生成岛屿 · Could not load the Bay Area data; showing a generated island');")
# world size: a 72 km square
R("scene.fog.near = SGR.on ? 36000 : 22000; scene.fog.far = SGR.on ? 115000 : 68000; controls.maxDistance = SGR.on ? 72000 : 50000;",
  "scene.fog.near = SGR.on ? 46000 : 22000; scene.fog.far = SGR.on ? 150000 : 68000; controls.maxDistance = SGR.on ? 92000 : 50000;")
open(SC + 'bayreal/app/bayreal.js', 'w').write(src)
# ---------------- statistics panels ----------------
src = open(SC + 'sgreal/app/sgstats.js').read()
R("    ['组屋', 'HDB blocks', S.hdb.toLocaleString()],\n", "")
R("['行政区', 'Planning areas', String(SGD.pas.length)],", "['城市与社区', 'Cities & districts', String(SGD.pas.length)],")
R("['快速公路', 'Expressways',", "['高速公路', 'Freeways',")
R("['地铁 / 轻轨', 'MRT / LRT',", "['轨道交通', 'Rail transit',")
R("['离岛', 'Islands', '圣淘沙 · 乌敏 · 德光'],", "['岛屿', 'Islands', '恶魔岛 · 天使岛 · 金银岛 · 阿拉米达'],")
R("['地图', 'Map', '1:1 · 56 × 56 km'], ['数据', 'Data', 'OpenStreetMap · Overture · HDB3D']", "['地图', 'Map', '1:1 · 72 × 72 km'], ['数据', 'Data', 'OpenStreetMap · Terrain Tiles (AWS)']")
open(SC + 'bayreal/app/baystats.js', 'w').write(src)
print('ok')
