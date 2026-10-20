/* ================= v25: New York City 1:1 — the five boroughs, Jersey City / Newark (OSM roads, 1.65 million real building footprints, coastline, terrain) ================= */
// Data (sgdata/): sg_base.txt (terrain, rasters, places, rail, planning areas), sg_roads.txt, sg_bld.txt, sg_water.txt (gzip as base64), ground.webp.
// The map square is 56 × 56 km (HALF 28 km, 25 m zoning cells, 70 m terrain grid); everything outside Singapore is muted context.
Object.assign(SGR, {base:null, H:null, lines:null, bldData:null, water:null, img:null, loading:null,
  tiles:new Map(), queue:[], off:null, group:new THREE.Group(), waterGroup:new THREE.Group(), keeps:[], hulls:new Map(), discs:[],
  baseCv:null, ovCv:null, ovImg:null, stats:null, od:[], graphSegs:[], roadLabels:[], planes:null, mono:[], built:0, total:0, t0:0, dirty:new Set()});
scene.add(SGR.group); scene.add(SGR.waterGroup);
const SGR_PATH = 'nycdata/', SGR_TEX = 4096;
const SGR_US = true; const SGR_NYC = true;
const SGR_LRT = {has:c => c[0] === 'H' || c[0] === 'W'};
// trains per system: speed m/s, car spacing, car size [length, height, width], track offset, height, cars per train, line metres per train
// (subway: IRT 51 ft cars x 10, BMT/IND 60 ft x 10, SIR 75 ft x 4; PATH 51 ft x 7; AirTrain JFK 2-car; light rail 1 LRV; commuter rail 85 ft x 10)
const SGR_TRAIN = c => /^S[1-7]$/.test(c) ? {sp:13, gap:15.9, sc:[15.6, 3.6, 2.7], side:1.65, y:2.0, cars:10, per:3200} :
  c === 'SI' ? {sp:16, gap:23.2, sc:[22.9, 3.7, 3.05], side:1.75, y:2.1, cars:4, per:4200} :
  /^SS/.test(c) ? {sp:10, gap:23.2, sc:[22.9, 3.7, 3.05], side:1.75, y:2.1, cars:3, per:2600} :
  c[0] === 'S' ? {sp:13, gap:18.7, sc:[18.4, 3.7, 3.05], side:1.75, y:2.1, cars:10, per:3400} :
  c[0] === 'P' ? {sp:14, gap:15.9, sc:[15.6, 3.6, 2.8], side:1.7, y:2.0, cars:7, per:3600} :
  c[0] === 'A' ? {sp:12, gap:17.9, sc:[17.6, 3.6, 2.9], side:1.6, y:2.0, cars:2, per:2200} :
  c[0] === 'H' || c[0] === 'W' ? {sp:10, gap:27.6, sc:[27.1, 3.6, 2.65], side:1.25, y:1.95, cars:1, per:2400} :
  {sp:24, gap:26.2, sc:[25.9, 4.4, 3.2], side:1.9, y:2.4, cars:10, per:9000};

/* ---------- loading ---------- */
async function sgrFetch(name){
  // the data files are gzip, stored as base64 text (artifact hosting serves text, not raw binary)
  const r = await fetch(SGR_PATH + name); if (!r.ok) throw new Error(name + ' ' + r.status);
  const b64 = (await r.text()).trim(), bin = atob(b64), bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  let buf = bytes.buffer; const u = bytes;
  if (u[0] === 0x1f && u[1] === 0x8b){
    if (typeof DecompressionStream === 'undefined') throw new Error('this browser cannot unpack the map data (DecompressionStream)');
    buf = await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  }
  return buf;
}
function sgrLoad(){
  if (SGR.loading) return SGR.loading;
  SGR.loading = (async () => {
    const img = new Image(); img.decoding = 'async'; img.src = SGR_PATH + 'ground.webp';
    let done = 0; const step = p => p.then(v => { done++; showBusy(`正在载入真实纽约地图 ${done}/5 · Loading the real map of New York City`); return v; });
    const [b, r, wb, bl] = await Promise.all([step(sgrFetch('nyc_base.txt')), step(sgrFetch('nyc_roads.txt')), step(sgrFetch('nyc_water.txt')), step(sgrFetch('nyc_bld0.txt')), step(img.decode())]);
    const base = JSON.parse(new TextDecoder().decode(b));
    const hb = atob(base.H), h16 = new Int16Array(hb.length >> 1);
    for (let i = 0; i < h16.length; i++) h16[i] = (hb.charCodeAt(2*i) | (hb.charCodeAt(2*i + 1) << 8)) << 16 >> 16;
    SGR.H = new Float32Array(h16.length); for (let i = 0; i < h16.length; i++) SGR.H[i] = h16[i]/10;
    base.H = null; SGR.base = base; SGR.img = img;
    SG.lon0 = base.lon0; SG.lat0 = base.lat0; SG.MX = base.MX; SG.MY = base.MY;
    SGD = {pas:base.PAS, regs:base.REGS, mrt:base.mrt, stations:base.stations, f1:base.f1};
    SGR.lines = SGRoads.decode(r, base.names, base.refs);
    SGR.bldData = SGBld.decode(bl);
    sgrLoadParts(base.bldParts || 0);
    SGR.water = sgrReadWater(wb);
  })();
  return SGR.loading;
}
// the small buildings (houses, row houses, garages: ~1.6 million) come in part files after the start; tiles near the camera that wanted
// them are rebuilt as each part arrives
function sgrLoadParts(n){
  if (SGR.partsLoading) return; SGR.partsLoading = true; SGR.partsDone = 0;
  (async () => {
    for (let k = 1; k <= n; k++){
      let buf = null;
      for (let a = 0; a < 3 && !buf; a++){ try { buf = await sgrFetch('nyc_bld' + k + '.txt'); } catch (e){ console.warn('part ' + k, e); await new Promise(r => setTimeout(r, 1500)); } }
      if (!buf) continue;
      SGR.bldData.addPart(k, buf); SGR.partsDone = k;
      const set = new Set(); for (const T of SGR.tiles.values()) if (T.lvl === -1 && SGR.bldData.partOf(T.ti) === k) set.add(T.ti);
      if (set.size) sgrQueueTiles(set);
    }
  })();
}
function sgrReadWater(buf){
  const dv = new DataView(buf); let o = 4;
  const vu = () => { let v = 0, s = 0, b; do { b = dv.getUint8(o++); v += (b & 127)*Math.pow(2, s); s += 7; } while (b & 128); return v; };
  const mesh = () => { const nv = vu(), ni = vu(); const V = new Int32Array(buf.slice(o, o + nv*8)); o += nv*8; const I = new Uint32Array(buf.slice(o, o + ni*4)); o += ni*4; return {V, I}; };
  const sea = mesh(), nb = vu(), bodies = [];
  for (let k = 0; k < nb; k++){ const lv = dv.getFloat32(o, true); o += 4; bodies.push({lv, m:mesh()}); }
  const nf = vu(), flat = [];
  for (let k = 0; k < nf; k++){ const kind = dv.getUint8(o++); flat.push({kind, m:mesh()}); }
  return {sea, bodies, flat};
}

/* ---------- world size: Singapore uses a 56 km square with 25 m cells; the generated islands keep 24 km and 10 m ---------- */
function allocWorld(half, cell, ts){
  const tex = SGR.on ? SGR_TEX : 0;
  if (half === HALF && cell === CELL && ts === TS && allocWorld.tex === tex) return;
  allocWorld.tex = tex;
  HALF = half; CELL = cell; N = Math.round(2*half/cell); TS = ts; TN = Math.round(2*half/ts) + 1;
  zones = new Uint8Array(N*N); resv = new Uint8Array(N*N); arch = new Uint8Array(N*N); dens = new Uint8Array(N*N); nat = new Uint8Array(N*N);
  slope = new Float32Array(N*N); distSea = new Uint16Array(N*N); distFresh = new Uint16Array(N*N); baseRGB = new Uint8Array(N*N*3); contour = new Uint8Array(N*N);
  H = new Float32Array(TN*TN); siteMask = new Uint8Array(N*N); siteRGB = new Uint8Array(N*N*3);
  satB = new Int32Array((N+1)*(N+1)); satG = new Int32Array((N+1)*(N+1)); satZ = new Int32Array((N+1)*(N+1)); sbOf = new Int32Array(N*N).fill(-1);
  TRN = Math.ceil(2*HALF/TR); trev = new Uint16Array(TRN*TRN); touched = new Uint8Array(N*N); RN = Math.ceil(2*HALF/RG);
  const S = tex || N; texCv.width = texCv.height = S; imgData = texCtx.createImageData(N, N);
  terrTex.dispose(); terrTex.generateMipmaps = !!tex; terrTex.minFilter = tex ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter; terrTex.anisotropy = tex ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 1;
  skeleton = []; sbDist = new Int32Array(0); undoStack.length = 0;
  scene.fog.near = SGR.on ? 36000 : 22000; scene.fog.far = SGR.on ? 115000 : 68000; controls.maxDistance = SGR.on ? 72000 : 50000;
  sea.position.y = SGR.on ? -1.6 : 0;
}

/* ---------- terrain, water and land cover from the data ---------- */
function genSingapore(){
  const B = SGR.base;
  H.set(SGR.H);
  const codes = sgRLE(B.codes, N);
  for (let k = 0; k < N*N; k++) nat[k] = codes[k];             // 0 land, 1 sea, 2 reservoir / river, 3 forest, 4 beach, 5 Johor / Batam
  waterDistances(); slopeRegion(0, 0, N-1, N-1); contour.fill(0);
  SG.lu = sgRLE(B.lu, N); SG.pa = sgRLE(B.pa, N);
  const pk = sgXY(40.5975, -74.1009); let best = pk, bh = -1;
  for (let y = pk[1] - 700; y <= pk[1] + 700; y += 15) for (let x = pk[0] - 700; x <= pk[0] + 700; x += 15){ const h = hAt(x, y); if (h > bh){ bh = h; best = [x, y]; } }
  let landN = 0, forest = 0; for (let k = 0; k < N*N; k++){ const v = nat[k]; if (v === 0 || v === 3 || v === 4){ landN++; if (v === 3) forest++; } }
  world = {peak:{p:best, h:bh, name:['托德山', 'Todt Hill']}, river:{p:sgXY(40.8000, -73.9700), len:25000, name:['哈德逊河', 'Hudson River']},
    mouth:sgXY(40.7000, -74.0250), landKm2:landN*CELL*CELL/1e6, forestPct:forest/Math.max(1, landN), sg:true};
}
function sgZoning(){
  zones.fill(0); dens.fill(0); arch.fill(0); resv.fill(0); roads = [];
  for (let k = 0; k < N*N; k++) if (nat[k] === 5) resv[k] = 8;     // foreign land is context only
  SG.regMap = {}; cityDefs = [];
  SGD.regs.forEach((r, i) => { SG.regMap[i + 1] = cityDefs.length; cityDefs.push({x:r.x, y:r.y, r:r.r, cap:r.en === 'Manhattan', name:r.zh, en:r.en, style:0, custom:false}); });
}
const sgrTexPx = (x, y) => [(x + HALF)/(2*HALF)*SGR_TEX, (HALF - y)/(2*HALF)*SGR_TEX];
function sgrGroundInit(){
  if (!SGR.baseCv){ SGR.baseCv = document.createElement('canvas'); SGR.baseCv.width = SGR.baseCv.height = SGR_TEX; }
  SGR.baseCv.getContext('2d').drawImage(SGR.img, 0, 0, SGR_TEX, SGR_TEX);
  if (!SGR.ovCv || SGR.ovCv.width !== N){ SGR.ovCv = document.createElement('canvas'); SGR.ovCv.width = SGR.ovCv.height = N; SGR.ovImg = SGR.ovCv.getContext('2d').createImageData(N, N); }
}
function sgrPath(c, P){ c.beginPath(); P.forEach((p, i) => { const q = sgrTexPx(p[0], p[1]); if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); }
function sgrPaintPoly(P, rgb){ const c = SGR.baseCv.getContext('2d'); c.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`; sgrPath(c, P); c.closePath(); c.fill(); }
function sgrPaintLine(P, w, rgb){ const c = SGR.baseCv.getContext('2d'); c.strokeStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`; c.lineWidth = Math.max(0.7, w/(2*HALF)*SGR_TEX); c.lineCap = c.lineJoin = 'round'; sgrPath(c, P); c.stroke(); }
function sgrDrawTex(bb){
  const f = SGR_TEX/N, ctx = texCtx;
  const i0 = bb ? Math.max(0, bb[0] - 1) : 0, j0 = bb ? Math.max(0, bb[1] - 1) : 0, i1 = bb ? Math.min(N-1, bb[2] + 1) : N-1, j1 = bb ? Math.min(N-1, bb[3] + 1) : N-1;
  const sx = Math.floor(i0*f), sy = Math.floor((N-1-j1)*f), sw = Math.min(SGR_TEX - sx, Math.ceil((i1 - i0 + 1)*f) + 1), sh = Math.min(SGR_TEX - sy, Math.ceil((j1 - j0 + 1)*f) + 1);
  ctx.drawImage(SGR.baseCv, sx, sy, sw, sh, sx, sy, sw, sh);
  const D = SGR.ovImg.data, dc = DCOL.map(hexRGB); let any = false;
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++){
    const k = j*N + i, o = ((N-1-j)*N + i)*4, z = zones[k]; let r = 0, g = 0, b = 0, a = 0;
    if (groundMode === 'dist'){ const p = SG.pa[k], v = nat[k]; if (p && (v === 0 || v === 3 || v === 4)){ const c = dc[(p*5) % dc.length]; r = c[0]; g = c[1]; b = c[2]; a = 0.32; } }
    if (groundMode === 'zone' && z){ const c = ZINFO[z].paint, dv = z === 4 ? 2 : (dens[k] || 2); r = c[0]; g = c[1]; b = c[2]; a = [0, 0.4, 0.55, 0.7][dv]; }
    else if (groundMode === 'arch' && arch[k]){ const c = ARCH[arch[k]].ui; r = c[0]; g = c[1]; b = c[2]; a = z ? 0.55 : 0.3; }
    else if (z && groundMode !== 'dist'){ r = 222; g = 216; b = 202; a = 0.6; }     // repainted ground under generated blocks
    D[o] = r; D[o+1] = g; D[o+2] = b; D[o+3] = Math.round(a*255); if (a) any = true;
  }
  if (any){
    const oc = SGR.ovCv.getContext('2d'); oc.putImageData(SGR.ovImg, 0, 0, i0, N-1-j1, i1 - i0 + 1, j1 - j0 + 1);
    ctx.imageSmoothingEnabled = true; ctx.drawImage(SGR.ovCv, i0, N-1-j1, i1 - i0 + 1, j1 - j0 + 1, i0*f, (N-1-j1)*f, (i1 - i0 + 1)*f, (j1 - j0 + 1)*f);
  }
  terrTex.needsUpdate = true;
}
const matSgrPond = new THREE.MeshLambertMaterial({color:0x86b3c9, polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-4});
const matSgrPool = new THREE.MeshLambertMaterial({color:0x7cc4e2, emissive:0x000000, polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-4});
const matSgrPier = new THREE.MeshLambertMaterial({color:0xbdb4a4});
function sgrWaterGeo(m, yf){
  const n = m.V.length/2, pos = new Float32Array(n*3), nor = new Float32Array(n*3);
  for (let i = 0; i < n; i++){ const x = m.V[i*2]/4, y = m.V[i*2+1]/4; pos[i*3] = x; pos[i*3+1] = yf(x, y); pos[i*3+2] = -y; nor[i*3+1] = 1; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setIndex(new THREE.BufferAttribute(m.I, 1));
  g.computeBoundingSphere(); return g;
}
function sgrWater(){
  sgrDisposeGroup(SGR.waterGroup);
  const Wd = SGR.water;
  const s = new THREE.Mesh(sgrWaterGeo(Wd.sea, () => -0.05), sea.material); s.renderOrder = 1; SGR.waterGroup.add(s);
  for (const b of Wd.bodies){ const m = new THREE.Mesh(sgrWaterGeo(b.m, () => b.lv - 0.05), sea.material); m.renderOrder = 1; SGR.waterGroup.add(m); }
  for (const f of Wd.flat){
    const pier = f.kind === 3, m = new THREE.Mesh(sgrWaterGeo(f.m, pier ? (x, y) => Math.max(1.7, hC(x, y) + 0.35) : (x, y) => hC(x, y) + 0.12), pier ? matSgrPier : f.kind === 2 ? matSgrPool : matSgrPond);
    m.receiveShadow = true; SGR.waterGroup.add(m);
  }
}
function sgrDisposeGroup(g){ for (const ch of [...g.children]){ g.remove(ch); ch.traverse(o => { if (o.geometry && o.geometry !== treeGeo && o.geometry !== PLANE_GEO) o.geometry.dispose(); }); } }

/* ---------- what the real city hides: landmark models, campus sites, repainted areas ---------- */
function sgrHull(pts){
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (pts.length < 3) return pts;
  const cr = (o, a, b) => (a[0] - o[0])*(b[1] - o[1]) - (a[1] - o[1])*(b[0] - o[0]), lo = [], up = [];
  for (const p of pts){ while (lo.length >= 2 && cr(lo[lo.length-2], lo[lo.length-1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = pts.length - 1; i >= 0; i--){ const p = pts[i]; while (up.length >= 2 && cr(up[up.length-2], up[up.length-1], p) <= 0) up.pop(); up.push(p); }
  up.pop(); lo.pop(); return lo.concat(up);
}
function sgrLandmarkHulls(){
  // the ground plan of every placed landmark (its lower 25 m), as a convex hull grown by 3 m
  const live = new Set(), changed = [];
  for (const L of landmarks){
    live.add(L.id); if (SGR.hulls.has(L.id)) continue;
    const g = lmMeshes.get(L.id); if (!g) continue;
    g.updateMatrixWorld(true); const pts = [], v = new THREE.Vector3(), base = L.top || 0;
    g.traverse(o => { if (!o.isMesh || !o.geometry.attributes.position) return; const a = o.geometry.attributes.position; const st = Math.max(1, Math.floor(a.count/6000));
      for (let i = 0; i < a.count; i += st){ v.fromBufferAttribute(a, i).applyMatrix4(o.matrixWorld); if (v.y - base < 25) pts.push([v.x, -v.z]); } });
    let P = sgrHull(pts); if (P.length < 3) continue;
    const c = centroidP(P); P = P.map(p => { const dx = p[0] - c[0], dy = p[1] - c[1], d = Math.hypot(dx, dy) || 1; return [p[0] + dx/d*3, p[1] + dy/d*3]; });
    const H = {P, bb:bboxOf(P)}; SGR.hulls.set(L.id, H); changed.push(H);
  }
  for (const [id, H] of [...SGR.hulls]) if (!live.has(id)){ SGR.hulls.delete(id); changed.push(H); }
  return changed;
}
function sgrSkipB(B){
  if (B.foreign) return false;
  const k = cx2i(B.cy)*N + cx2i(B.cx);
  if (SGR.off[k] || resv[k] === 7) return true;
  for (const H of SGR.hulls.values()){ const b = H.bb; if (B.cx < b[0] || B.cx > b[2] || B.cy < b[1] || B.cy > b[3]) continue;
    if (pip(H.P, B.cx, B.cy)) return true;
    const R = B.rings[0], n = R.length/2; let inn = 0; for (let i = 0; i < n; i++) if (pip(H.P, R[2*i], R[2*i+1])) inn++; if (inn*2 > n) return true; }
  for (const d of SGR.discs){ if ((d.t < 0 || d.t === B.t) && Math.abs(B.cx - d.x) < d.r && Math.abs(B.cy - d.y) < d.r && Math.hypot(B.cx - d.x, B.cy - d.y) < d.r && B.h < (d.h || 1e9)) return true; }
  return false;
}
// far tiles: no service roads, paths or piers (they are sub-pixel from there and there are 36 000 km of them)
function sgrSkipFar(i){ const c = SGR.lines[i].c; return c === 11 || c === 12 || c === 17 || sgrSkipLine(i); }
function sgrSkipLine(i){
  // small roads, paths, piers and people movers inside a campus site or under a landmark model are part of the model
  const l = SGR.lines[i]; if (l.c < 10 || (l.c > 12 && l.c !== 16 && l.c !== 17)) return false;
  const P = l.P, m = (P.length >> 2) << 1, x = P[m], y = P[m+1];
  // v20: footpaths and dead-end lanes inside a repainted block belong to the old layout
  if ((l.c === 12 || (l.c >= 10 && l.c <= 11 && SGR.dangle && SGR.dangle.has(i))) && SGR.off && SGR.off[cx2i(y)*N + cx2i(x)]) return true;
  if (l.c !== 10 && resv[cx2i(y)*N + cx2i(x)] === 7){
    // v20: sites built from the real footprints keep the real service roads and paths (S.keepRoads, optionally only some classes: S.keepRoads = [11, 12])
    if (!SGR.siteKR){ SGR.siteKR = []; for (const S of Object.values(SITES)) if (S.keepRoads){ const P = siteKeep(S); SGR.siteKR.push({P, bb:bboxOf(P), cls:Array.isArray(S.keepRoads) ? S.keepRoads : null}); } }
    let keep = false; for (const K of SGR.siteKR){ const b = K.bb; if (x < b[0] || x > b[2] || y < b[1] || y > b[3] || (K.cls && !K.cls.includes(l.c))) continue; if (pip(K.P, x, y)){ keep = true; break; } }
    if (!keep) return true;
  }
  for (const H of SGR.hulls.values()){ const b = H.bb; if (x < b[0] || x > b[2] || y < b[1] || y > b[3]) continue; if (pip(H.P, x, y)) return true; }
  return false;
}

/* ---------- streaming tiles (2 km): real roads, real buildings, trees ---------- */
// geometry arrays are dropped once they are on the GPU (picking uses the terrain function, not the meshes)
function sgrFreeArr(){ this.array = null; }
function sgrRelease(obj){ obj.traverse(o => { const g = o.geometry; if (!g || o.isPoints) return; if (!g.boundingSphere) g.computeBoundingSphere(); for (const k in g.attributes){ const a = g.attributes[k]; if (a.isInterleavedBufferAttribute) a.data.onUpload(sgrFreeArr); else a.onUpload(sgrFreeArr); } if (g.index) g.index.onUpload(sgrFreeArr); }); }
const sgrTileC = ti => { const T = SGR.base.TILE, TX = Math.round(2*HALF/T), tx = ti % TX, ty = (ti - tx)/TX; return [-HALF + (tx + 0.5)*T, -HALF + (ty + 0.5)*T]; };
function sgrTilesClear(){
  for (const T of SGR.tiles.values()) sgrTileDispose(T, true);
  SGR.tiles.clear(); SGR.queue = []; SGR.built = 0; SGR.total = 0;
}
function sgrTileDispose(T, all){
  const kill = o => { if (!o) return; SGR.group.remove(o); o.traverse(q => { if (q.geometry && q.geometry !== treeGeo) q.geometry.dispose(); }); };
  kill(T.bld && T.bld.group); T.bld = null;
  if (T.extra){ for (const o of T.extra){ kill(o); if (o.userData.dispose) o.userData.dispose(); } T.extra = null; }
  if (all){ for (const k of ['major', 'minor', 'paths']) kill(T.road && T.road[k]); T.road = null; kill(T.trees); T.trees = null; T.treesDone = false; }
}
function sgrTilesInit(){
  sgrTilesClear();
  const T = SGR.base.TILE, TX = Math.round(2*HALF/T);
  for (let ti = 0; ti < TX*TX; ti++){ const c = sgrTileC(ti); SGR.tiles.set(ti, {ti, cx:c[0], cy:c[1], road:null, bld:null, trees:null, treesDone:false, done:false}); }
  SGR.queue = [...SGR.tiles.values()]; SGR.total = SGR.queue.length; SGR.t0 = performance.now(); sgrSortQueue();
  for (const T of SGR.tiles.values()) T.want = sgrTileDist(T) < SGR_NEAR_IN ? 1 : 0;
}
function sgrSortQueue(){ const tx = controls.target.x, ty = -controls.target.z; SGR.queue.sort((a, b) => Math.hypot(a.cx - tx, a.cy - ty) - Math.hypot(b.cx - tx, b.cy - ty)); }
function sgrBuildTile(T){
  const rl = T.want ? 1 : 0;
  if (T.road && T.roadLvl !== rl){ for (const k of ['major', 'minor', 'paths']) if (T.road[k]){ SGR.group.remove(T.road[k]); T.road[k].traverse(q => { if (q.geometry) q.geometry.dispose(); }); } T.road = null; }
  if (!T.road){
    T.roadLvl = rl;
    const r = SGRoads.build(SGR.lines, {only:new Set([T.ti]), skipLine:rl ? sgrSkipLine : sgrSkipFar}).tiles.get(T.ti);
    T.road = r || {major:null, minor:null, paths:null};
    for (const k of ['major', 'minor', 'paths']) if (T.road[k]){ sgrRelease(T.road[k]); SGR.group.add(T.road[k]); }
  }
  sgrTileDispose(T, false);
  const lvl = T.want || 0; T.lvl = lvl;
  let list = SGR.bldData.big(T.ti) || [];
  if (lvl){ const sm = SGR.bldData.small(T.ti); if (sm){ if (sm.length) list = list.concat(sm); } else T.lvl = -1; }      // -1: its part file is still loading
  else SGR.bldData.dropSmall(T.ti);
  if (list && list.length){ const b = SGBld.buildTile(T.ti, list, {skip:sgrSkipB, release:true}); if (b.group.children.length){ T.bld = b; SGR.group.add(b.group); } }
  // add-on modules (signs, ads, lights ...) decorate the tile's real buildings: HOOKS.tile(T, list, skip) returns an Object3D or null
  if (list && list.length) for (const f of HOOKS.tile){ let o = null; try { o = f(T, list, sgrSkipB); } catch (e){ console.error('tile hook', e); } if (o){ SGR.group.add(o); (T.extra || (T.extra = [])).push(o); } }
  T.done = true; sgrLodTile(T);
}
function sgrStep(){
  if (!SGR.on) return;
  if (SGR.lodQ){ SGR.lodQ = false; sgrSortQueue(); }
  if (SGR.queue.length){
    if ((sgrStep.n = (sgrStep.n || 0) + 1) % 40 === 0) sgrSortQueue();
    const t = performance.now();
    while (SGR.queue.length && performance.now() - t < 16){ const T = SGR.queue.shift(); if (T.done && !SGR.dirty.has(T.ti)) continue; SGR.dirty.delete(T.ti); sgrBuildTile(T); SGR.built++; }
    if (SGR.total && SGR.built <= SGR.total && !sgrAfterBuild.done) showBusy(`真实城市 ${Math.min(SGR.built, SGR.total)}/${SGR.total} · Building the real city`);
    if (!SGR.queue.length){ SGR.total = 0; hideBusy(); sgrAfterBuild(); }
  }
}
function sgrQueueTiles(set){ for (const ti of set){ const T = SGR.tiles.get(ti); if (!T) continue; SGR.dirty.add(ti); if (!SGR.queue.includes(T)) SGR.queue.push(T); } sgrSortQueue(); }
function sgrTilesOfBB(bb, pad){ const T = SGR.base.TILE, TX = Math.round(2*HALF/T), out = new Set(), p = pad || 0;
  for (let ty = Math.max(0, Math.floor((bb[1] - p + HALF)/T)); ty <= Math.min(TX-1, Math.floor((bb[3] + p + HALF)/T)); ty++) for (let tx = Math.max(0, Math.floor((bb[0] - p + HALF)/T)); tx <= Math.min(TX-1, Math.floor((bb[2] + p + HALF)/T)); tx++) out.add(ty*TX + tx); return out; }
function sgrAfterBuild(){ if (!sgrAfterBuild.done){ sgrAfterBuild.done = true; computeDistrictsSG(); renderStats(); renderIslandStats(); } }
// level of detail: small buildings, service roads, paths and trees only near the camera
const SGR_NEAR_IN = 4300, SGR_NEAR_OUT = 6200;
function sgrTileDist(T){ const c = camera.position, h2 = Math.max(0, c.y - 20), half = SGR.base.TILE/2;
  const dx = Math.max(0, Math.abs(c.x - T.cx) - half), dz = Math.max(0, Math.abs(-c.z - T.cy) - half); return Math.hypot(dx, dz, h2*0.9); }
function sgrLodTile(T){
  const d = sgrTileDist(T);
  // level of detail of the tile (rebuilt when it changes)
  const want = d < (T.want ? SGR_NEAR_OUT : SGR_NEAR_IN) ? 1 : 0;
  if (want !== (T.want || 0)){ T.want = want; if (T.done){ SGR.dirty.add(T.ti); if (!SGR.queue.includes(T)){ SGR.queue.push(T); SGR.lodQ = true; } } }
  if (T.road){ if (T.road.minor) T.road.minor.visible = d < 5200; if (T.road.paths) T.road.paths.visible = d < 2600;
    const M = T.road.major; if (M) for (const ch of M.children){ if (ch.name === 'mark') ch.visible = d < 6500; else if (ch.name === 'lamps') ch.visible = d < 12000; else if (ch.name === 'struct') ch.visible = d < 18000; } }
  if (T.bld && T.bld.small) T.bld.small.visible = d < 5600;
  if (T.extra) for (const o of T.extra){ if (o.userData.lod) o.userData.lod(d); else o.visible = d < (o.userData.lodMax || 6000); }
  if (d < 4200 && !T.treesDone && T.done) sgrTrees(T);
  if (T.trees) T.trees.visible = d < 4600 && showForest;
}
function lodTick(){
  for (const c of cache.values()){ const cx = camera.position.x, cz = camera.position.z, cy = camera.position.y, R = 4600, R2 = R*R - cy*cy; const dx = c.cx - cx, dz = -c.cy - cz, near = R2 > 0 && dx*dx + dz*dz < R2; for (const ch of c.group.children) if (ch.userData.tree) ch.visible = near; }
  if (SGR.on) for (const T of SGR.tiles.values()) if (T.done) sgrLodTile(T);
}
// trees: forest canopy, park trees and street trees (rain trees) along the roads, built when a tile first comes near
function sgrTrees(T){
  T.treesDone = true;
  const half = SGR.base.TILE/2, x0 = T.cx - half, y0 = T.cy - half, rng = mulberry32(T.ti*7919 + 3); let pts = [];
  const i0 = cx2i(x0), i1 = cx2i(x0 + 2*half - 1), j0 = cx2i(y0), j1 = cx2i(y0 + 2*half - 1);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++){
    const k = j*N + i; if (zones[k] || resv[k] || SGR.off[k]) continue;
    const v = nat[k], lu = SG.lu[k];
    if (v === 3){ const n = rng() < 0.6 ? 2 : 1; for (let q = 0; q < n; q++) pts.push([cellX(i) + (rng() - 0.5)*CELL, cellX(j) + (rng() - 0.5)*CELL, 4.5 + rng()*3.5, rng(), 'f']); }
    else if (v === 0 && lu === 4 && rng() < 0.3) pts.push([cellX(i) + (rng() - 0.5)*CELL, cellX(j) + (rng() - 0.5)*CELL, 3.5 + rng()*2.5, rng(), 'p']);
  }
  // street trees: both verges of arterials and local roads at ground level
  const W = {2:20, 4:15, 6:12, 8:9.5, 10:7}, Wo = {2:11, 4:10, 6:8, 8:7, 10:5.5};
  if (!SGR.treeIdx){ SGR.treeIdx = new Map(); const TT = SGR.base.TILE, TXn = Math.round(2*HALF/TT);
    SGR.lines.forEach((l, i) => { if (!(l.c in W)) return; const P = l.P, seen = new Set(); for (let k = 0; k < P.length; k += 2){ const t = Math.min(TXn - 1, Math.max(0, Math.floor((P[k+1] + HALF)/TT)))*TXn + Math.min(TXn - 1, Math.max(0, Math.floor((P[k] + HALF)/TT))); if (!seen.has(t)){ seen.add(t); let a = SGR.treeIdx.get(t); if (!a) SGR.treeIdx.set(t, a = []); a.push(i); } } }); }
  for (const li of SGR.treeIdx.get(T.ti) || []){
    const l = SGR.lines[li];
    if (!(l.c in W) || (l.flags & 8)) continue;
    const P = l.P; if (P[0] < x0 - 400 || P[0] > x0 + 2*half + 400 || P[1] < y0 - 400 || P[1] > y0 + 2*half + 400) continue;
    const off = (l.flags & 1 ? Wo[l.c] : W[l.c])/2 + 2.6, sp = l.c === 10 ? 19 : 15;
    let carry = rng()*sp;
    for (let s = 0; s + 3 < P.length; s += 2){
      const ax = P[s], ay = P[s+1], bx = P[s+2], by = P[s+3], L = Math.hypot(bx - ax, by - ay); if (L < 0.5) continue;
      const ux = (bx - ax)/L, uy = (by - ay)/L, e0 = l.E ? l.E[s >> 1] : 0, e1 = l.E ? l.E[(s >> 1) + 1] : 0;
      for (let t = carry; t < L; t += sp){
        if (e0 + (e1 - e0)*t/L > 0.8) continue;
        const px = ax + ux*t, py = ay + uy*t; if (px < x0 || px >= x0 + 2*half || py < y0 || py >= y0 + 2*half) continue;
        for (const sd of l.flags & 1 ? [1] : [-1, 1]){
          const x = px - uy*off*sd, y = py + ux*off*sd, k = cx2i(y)*N + cx2i(x);
          if (nat[k] === 1 || nat[k] === 2 || zones[k] || resv[k] === 7 || rng() < 0.12) continue;
          pts.push([x, y, 3.6 + rng()*2.2, rng(), 'r']);
        }
      }
      carry = (carry - L % sp + sp) % sp;
    }
  }
  // v20: no app trees inside a landmark model's ground plan (the models plant their own) or on a repainted block
  { const half = SGR.base.TILE/2 + 40, Hs = [...SGR.hulls.values()].filter(H => H.bb[2] > T.cx - half && H.bb[0] < T.cx + half && H.bb[3] > T.cy - half && H.bb[1] < T.cy + half);
    if (Hs.length) pts = pts.filter(t => { for (const H of Hs){ const b = H.bb; if (t[0] < b[0] - 4 || t[0] > b[2] + 4 || t[1] < b[1] - 4 || t[1] > b[3] + 4) continue; if (pip(H.P, t[0], t[1])) return false; } return true; });
    pts = pts.filter(t => !SGR.off[cx2i(t[1])*N + cx2i(t[0])]); }
  // v22: no tree trunk on a road, a path, a pier, under a flyover deck, or inside a building
  pts = sgrTreeFree(T, pts);
  if (!pts.length) return;
  const im = new THREE.InstancedMesh(treeGeo, matTree, pts.length), m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color();
  // v22: trees have trunks (one instanced mesh per tile, a child of the crowns: same visibility and lifetime)
  const tg = SGR_TRUNK.clone(), tk = new THREE.InstancedMesh(tg, matTrunk, pts.length);
  pts.forEach((t, i) => {
    const r = t[2], flat = t[4] === 'r' ? 0.62 : t[4] === 'f' ? 0.9 : 0.75, g = hC(t[0], t[1]), cy = g + r*flat + (t[4] === 'r' ? 3.2 : 1.4);
    p.set(t[0], cy, -t[1]); sc.set(r*1.15, r*flat, r*1.15); m.compose(p, q, sc); im.setMatrixAt(i, m);
    const v = t[3]; if (t[4] === 'f') c.setRGB(0.27 + v*0.08, 0.42 + v*0.1, 0.25 + v*0.05); else c.setRGB(0.36 + v*0.1, 0.52 + v*0.1, 0.3 + v*0.06);
    im.setColorAt(i, c);
    const tw = Math.max(0.16, r*(t[4] === 'r' ? 0.085 : 0.06));
    p.set(t[0], g - 0.3, -t[1]); sc.set(tw, cy - g + 0.3, tw); m.compose(p, q, sc); tk.setMatrixAt(i, m);
  });
  tk.castShadow = true; im.add(tk); im.addEventListener('dispose', () => tg.dispose());
  im.castShadow = true; im.receiveShadow = false; T.trees = im; SGR.group.add(im);
}
// a slightly tapered five-sided trunk from y = 0 to 1 (scaled per tree), bark brown
const SGR_TRUNK = (() => { const g = new THREE.CylinderGeometry(0.72, 1, 1, 5, 1, true); g.translate(0, 0.5, 0); return g; })();
const matTrunk = new THREE.MeshLambertMaterial({color:0x5d4c3c});
// where a tree cannot stand in tile T: on any road / path / runway / pier / rail line (its width + kerb), under an elevated deck,
// inside a real building of the tile. Exact distances through a 20 m hash of the segments and the building outlines.
const SGR_LW = [[26,13],[6.5,6.5],[20,11],[6.5,6.5],[15,10],[6,6],[12,8],[5.5,5.5],[9.5,7],[5,5],[7,5.5],[4.5,4],[2.5,2.5],[60,60],[23,23],[4,4],[3,3],[4,4],[12,12]];
function sgrTreeFree(T, pts){
  if (!pts.length) return pts;
  const TT = SGR.base.TILE, TXn = Math.round(2*HALF/TT), tileOf = (x, y) => Math.min(TXn - 1, Math.max(0, Math.floor((y + HALF)/TT)))*TXn + Math.min(TXn - 1, Math.max(0, Math.floor((x + HALF)/TT)));
  if (!SGR.allIdx){ SGR.allIdx = new Map();
    SGR.lines.forEach((l, i) => { const P = l.P, seen = new Set(); for (let k = 0; k < P.length; k += 2){ const t = tileOf(P[k], P[k+1]); if (!seen.has(t)){ seen.add(t); let a = SGR.allIdx.get(t); if (!a) SGR.allIdx.set(t, a = []); a.push(i); } } }); }
  const C = 20, x0 = T.cx - TT/2 - 40, y0 = T.cy - TT/2 - 40, n = Math.ceil((TT + 80)/C), segs = [], H = new Map();
  const put = (bx0, by0, bx1, by1, v) => { for (let j = Math.max(0, Math.floor((by0 - y0)/C)); j <= Math.min(n - 1, Math.floor((by1 - y0)/C)); j++) for (let i = Math.max(0, Math.floor((bx0 - x0)/C)); i <= Math.min(n - 1, Math.floor((bx1 - x0)/C)); i++){ const k = j*n + i; let a = H.get(k); if (!a) H.set(k, a = []); a.push(v); } };
  const near = new Set(); for (const dx of [-1, 0, 1]) for (const dy of [-1, 0, 1]){ const t = T.ti + dy*TXn + dx; if (t >= 0 && t < TXn*TXn) near.add(t); }
  const done = new Set();
  for (const t of near) for (const li of SGR.allIdx.get(t) || []){
    if (done.has(li)) continue; done.add(li);
    const l = SGR.lines[li], P = l.P, E = l.E, W = SGR_LW[l.c] || SGR_LW[10], w0 = (l.flags & 1 ? W[1] : W[0])/2;
    for (let k = 0; k + 3 < P.length; k += 2){
      const ax = P[k], ay = P[k+1], bx = P[k+2], by = P[k+3];
      const up = E && (E[k >> 1] > 3.5 || E[(k >> 1) + 1] > 3.5), hw = up ? w0 + 2.5 : l.c === 12 ? 0.8 : w0 + 0.9;
      if (Math.max(ax, bx) + hw < x0 || Math.min(ax, bx) - hw > x0 + n*C || Math.max(ay, by) + hw < y0 || Math.min(ay, by) - hw > y0 + n*C) continue;
      const v = segs.length; segs.push(ax, ay, bx, by, hw); put(Math.min(ax, bx) - hw, Math.min(ay, by) - hw, Math.max(ax, bx) + hw, Math.max(ay, by) + hw, v);
    }
  }
  const BL = [], list = (T.bld && T.bld.list) || [];
  for (const B of list){ const R = B.rings[0]; if (!R || R.length < 6) continue; let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9; for (let k = 0; k < R.length; k += 2){ if (R[k] < bx0) bx0 = R[k]; if (R[k] > bx1) bx1 = R[k]; if (R[k+1] < by0) by0 = R[k+1]; if (R[k+1] > by1) by1 = R[k+1]; }
    BL.push([R, bx0 - 0.8, by0 - 0.8, bx1 + 0.8, by1 + 0.8]); put(bx0 - 0.8, by0 - 0.8, bx1 + 0.8, by1 + 0.8, -BL.length); }
  const inRing = (R, x, y) => { let c = false; for (let a = 0, b = (R.length >> 1) - 1, m = R.length >> 1; a < m; b = a++){ const ya = R[a*2+1], yb = R[b*2+1]; if ((ya > y) !== (yb > y) && x < (R[b*2] - R[a*2])*(y - ya)/(yb - ya) + R[a*2]) c = !c; } return c; };
  const out = pts.filter(t => {
    const i = Math.floor((t[0] - x0)/C), j = Math.floor((t[1] - y0)/C); if (i < 0 || j < 0 || i >= n || j >= n) return true;
    const a = H.get(j*n + i); if (!a) return true;
    for (const v of a){
      if (v >= 0){ const o = v*5, ax = segs[o], ay = segs[o+1], dx = segs[o+2] - ax, dy = segs[o+3] - ay, L2 = dx*dx + dy*dy; let u = L2 > 0 ? ((t[0] - ax)*dx + (t[1] - ay)*dy)/L2 : 0; u = u < 0 ? 0 : u > 1 ? 1 : u;
        const ex = ax + dx*u - t[0], ey = ay + dy*u - t[1], hw = segs[o+4]; if (ex*ex + ey*ey < hw*hw) return false; }
      else { const b = BL[-v - 1]; if (t[0] >= b[1] && t[0] <= b[3] && t[1] >= b[2] && t[1] <= b[4] && inRing(b[0], t[0], t[1])) return false; }
    }
    return true;
  });
  const st = SGR.treeStat || (SGR.treeStat = {in:0, out:0, r:0, rOut:0}); st.in += pts.length; st.out += out.length; st.r += pts.filter(t => t[4] === 'r').length; st.rOut += out.filter(t => t[4] === 'r').length;
  return out;
}
function sgrMarkOff(p, r){
  for (let j = cx2i(p[1] - r); j <= cx2i(p[1] + r); j++) for (let i = cx2i(p[0] - r); i <= cx2i(p[0] + r); i++){ const x = cellX(i), y = cellX(j); if ((x - p[0])*(x - p[0]) + (y - p[1])*(y - p[1]) <= r*r && nat[j*N + i] !== 5) SGR.off[j*N + i] = 1; }
  const b = [p[0] - r, p[1] - r, p[0] + r, p[1] + r]; SGR.stroke = SGR.stroke ? [Math.min(SGR.stroke[0], b[0]), Math.min(SGR.stroke[1], b[1]), Math.max(SGR.stroke[2], b[2]), Math.max(SGR.stroke[3], b[3])] : b;
}
function sgrStrokeEnd(){
  if (!SGR.on || !SGR.stroke) return;
  // v20: snap the stroke to the real blocks, then rebuild the tiles with their roads (paths and dead-end lanes of a repainted block go)
  let bb = SGR.stroke; SGR.stroke = null;
  try { bb = sgrSnapStroke(bb); } catch (e){ console.error('snap', e); }
  sgrRebuildArea(bb, true);
}
function sgrRebuildArea(bb, roadsToo){
  const set = sgrTilesOfBB(bb, 80);
  for (const ti of set){ const T = SGR.tiles.get(ti); if (!T) continue; if (roadsToo){ for (const k of ['major', 'minor', 'paths']) if (T.road && T.road[k]){ SGR.group.remove(T.road[k]); T.road[k].traverse(q => { if (q.geometry) q.geometry.dispose(); }); } T.road = null; } if (T.trees){ SGR.group.remove(T.trees); T.trees.dispose(); T.trees = null; } T.treesDone = false; }
  sgrQueueTiles(set);
}
function sgrLandmarksChanged(){
  if (!SGR.on || !SGR.tiles.size) return;
  const ch = sgrLandmarkHulls(); const set = new Set();
  for (const H of ch) for (const ti of sgrTilesOfBB(H.bb, 10)) set.add(ti);
  if (set.size) sgrQueueTiles(set);
}

/* ---------- campuses and gardens: models on top of the real map; their ground is painted onto the texture ---------- */
function placeSites(){
  for (const ch of [...sgGroup.children]){ sgGroup.remove(ch); ch.traverse(o => { if (o.geometry && o.geometry !== treeGeo) o.geometry.dispose(); }); }
  siteMask.fill(0); sgSites = [];
  sgReserveSites();
  let salt = 1;
  for (const [key, S] of Object.entries(SITES)){
    const [ax, ay] = sgXY(S.lat, S.lon), toW = p => [ax + p[0], ay - p[1]], keepW = siteKeep(S);
    const rng = mulberry32(0x5173 + 977*(salt++)), trees = [], lamps = [], lampC = [];
    const ctx = {gy:(x, z) => hC(ax + x, ay - z), paint:(poly, rgb) => sgrPaintPoly(poly.map(toW), rgb), line:(pts, w, rgb) => sgrPaintLine(pts.map(toW), w, rgb),
      tree:(x, z, s, kind) => { trees.push([ax + x, ay - z, s || 3, rng(), kind || 'd']); }, lamp:(x, y, z, rgb) => { lamps.push(ax + x, y, z - ay); lampC.push(rgb[0]/255, rgb[1]/255, rgb[2]/255); }, rng};
    let lo = Infinity, hi = -Infinity; for (const p of [...keepW, [ax, ay]]){ const h = hC(p[0], p[1]); lo = Math.min(lo, h); hi = Math.max(hi, h); }
    const lt = S.lt || {m:1, c:'#dfe8f5', k:0.6};
    LMCTX = {mats:new Map(), fx:[], rng, u:{base:{value:lo}, top:{value:hi + (S.h || 60)}, col:{value:new THREE.Color(lt.c)}, k:{value:lt.k}, mode:{value:lt.m}, even:{value:lt.e || 0}, anim:{value:lt.anim !== undefined ? lmAnimOf(lt) : 0}, col2:{value:new THREE.Color(lt.c2 || '#8fd8ff')}, ph:{value:(salt*0.618) % 1}}};
    let g = null;
    try { g = S.build(ctx); } catch (e){ console.error('site ' + key, e); }
    LMCTX = null;
    if (!g) continue;
    const labs = g.userData && g.userData.labels;   // v32: a site may label its own buildings ({x, z, y, zh, en, ic, near} in site metres)
    lmMerge(g); g.position.set(ax, 0, -ay); sgGroup.add(g);
    if (trees.length) sgGroup.add(treeMesh(trees));
    if (lamps.length) sgGroup.add(pointsMesh(lamps, lampC));
    sgSites.push({key, x:ax, y:ay, zh:S.zh, en:S.en, top:hi + (S.h || 60), labels:labs ? labs.map(L => ({x:ax + L.x, y:ay - L.z, abs:L.y, zh:L.zh, en:L.en, ic:L.ic, near:L.near})) : null});
  }
}

/* ---------- MRT and LRT on the real alignments: viaducts, tunnels and at-grade runs from the OSM rail data ---------- */
function sgMRT(B){
  const lines = [];
  for (const Ld of SGD.mrt){
    const P = Ld.pts.map(p => [p[0], p[1]]), n = P.length; if (n < 3) continue;
    const lrt = SGR_LRT.has(Ld.code), H0 = lrt ? 7.5 : 12.0, Z = Ld.z || null;
    const g = new Float32Array(n), sm = new Float32Array(n), wat = new Uint8Array(n), tgt = new Float32Array(n), el = new Uint8Array(n);
    for (let i = 0; i < n; i++){ g[i] = hAt(P[i][0], P[i][1]); const k = cx2i(P[i][1])*N + cx2i(P[i][0]); wat[i] = nat[k] === 1 ? 1 : nat[k] === 2 ? 2 : 0; el[i] = +Ld.el[i] || 0; }
    for (let i = 0; i < n; i++){ let s = 0, c = 0; for (let k = Math.max(0, i - 8); k <= Math.min(n - 1, i + 8); k++){ s += Math.max(0, g[k]); c++; } sm[i] = s/c; }
    for (let i = 0; i < n; i++) tgt[i] = Z && Z[i] > 0 ? Math.max(-0.3, g[i]) + Z[i] + 0.5 : el[i] === 2 ? sm[i] - 16 : el[i] === 1 ? sm[i] + H0 : Math.max(0, g[i]) + 0.5;
    // ramps between levels: a 3 % grade where a viaduct comes down to grade or a tunnel portal opens
    const e = Float32Array.from(tgt);
    for (let pass = 0; pass < 2; pass++){ for (let i = 1; i < n; i++) e[i] = el[i] === 2 ? Math.min(e[i], e[i-1] + 0.7) : Math.max(Math.min(e[i], e[i-1] + 0.7), Math.max(e[i], e[i-1] - 0.7)); for (let i = n - 2; i >= 0; i--) e[i] = el[i] === 2 ? Math.min(e[i], e[i+1] + 0.7) : Math.max(Math.min(e[i], e[i+1] + 0.7), Math.max(e[i], e[i+1] - 0.7)); }
    const cls = new Uint8Array(n), yR = new Float32Array(n), cum = new Float32Array(n); let L = 0;
    for (let i = 0; i < n; i++){
      if (i) L += Math.hypot(P[i][0] - P[i-1][0], P[i][1] - P[i-1][1]); cum[i] = L;
      const gg = Math.max(0, g[i]);
      cls[i] = lrt && el[i] === 0 ? 0 : e[i] < gg - 1.5 ? 2 : e[i] - gg > 4 ? 1 : 0; if (wat[i] && cls[i] !== 2){ cls[i] = 1; e[i] = Math.max(e[i], 7); }
      yR[i] = cls[i] === 0 ? hC(P[i][0], P[i][1]) + 0.5 : e[i];
    }
    const R = {P, g, e, cls, yR, wat, cum, L, kind:'mrt', line:Ld, lrt, street:lrt, col:hexRGB(Ld.col).map(v => v/255)};
    drawMRT(R, B); lines.push(R);
  }
  net.mrt = lines;
  sgStations(B, lines);
  const rr = mulberry32(77); net.trains = [];
  for (const R of lines){ if (!R.cls.some(c => c !== 2)) continue; const k = Math.max(1, Math.round(R.L/2600)); const Tq = SGR_TRAIN(R.line.code), k2 = Math.max(1, Math.round(R.L/Tq.per)); for (let t = 0; t < k2; t++) net.trains.push({R, ph:(t/k2)*2*R.L + rr()*300, sp:Tq.sp, gap:Tq.gap, sc:Tq.sc, side:Tq.side, y:Tq.y, cars:Tq.cars, col:R.col, cc:R.line.code[0] === 'K'}); }
  const total = net.trains.reduce((s, T) => s + T.cars, 0);
  if (total){
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({color:0xffffff, emissive:0x000000}), total), cc = new THREE.Color(); im.castShadow = true;
    let i = 0; for (const T of net.trains) for (let k = 0; k < T.cars; k++){ const f = T.cc ? 0.92 : k === 0 || k === T.cars - 1 ? 0.55 : 0.22; cc.setRGB(0.93*(1 - f) + T.col[0]*f, 0.93*(1 - f) + T.col[1]*f, 0.94*(1 - f) + T.col[2]*f); im.setColorAt(i++, cc); }
    moverGroup.add(im); net.trainMesh = im; net.nCars = 6;
  }
}

/* ---------- Changi: aircraft at the gates, landings and take-offs on the real runways ---------- */
const matSgrPlane = new THREE.MeshLambertMaterial({vertexColors:true});
function sgrPlanes(){
  if (SGR.airMod){ SGR.planes = null; return; }      // v20: the aircraft module (HOOKS.net / HOOKS.frame) owns the airport traffic
  const S = SGR.base.stands || [], R = (SGR.base.runways || []).filter(r => r.len > 2000 && r.ap);
  const n = S.length + 4, im = new THREE.InstancedMesh(PLANE_GEO, matSgrPlane, n), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3(1, 1, 1), c = new THREE.Color();
  const rng = mulberry32(1981), LIV = [[0.95, 0.95, 0.96], [0.95, 0.95, 0.96], [0.9, 0.92, 0.95], [0.97, 0.96, 0.92]];
  S.forEach((s, i) => { const k = 0.82 + rng()*0.25; p.set(s[0], hC(s[0], s[1]) + 4.5*k, -s[1]); e.set(0, s[2], 0); q.setFromEuler(e); sc.set(k, k, k); m.compose(p, q, sc); im.setMatrixAt(i, m); const L = LIV[i % LIV.length]; c.setRGB(L[0], L[1], L[2]); im.setColorAt(i, c); });
  im.castShadow = true; moverGroup.add(im);
  SGR.planes = {im, base:S.length, rw:R};
}
function sgrStepPlanes(t){
  const P = SGR.planes; if (!P || !P.rw.length) return;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), zero = new THREE.Vector3(1e-4, 1e-4, 1e-4);
  for (let k = 0; k < 4; k++){
    const R = P.rw[k % P.rw.length], dir = k % 2 ? -1 : 1;    // Changi lands and departs in the same direction; alternate per runway
    const a = dir > 0 ? R.a : R.b, b = dir > 0 ? R.b : R.a, L = Math.hypot(b[0] - a[0], b[1] - a[1]), u = [(b[0] - a[0])/L, (b[1] - a[1])/L];
    const T = 140, tt = (t + k*37) % T; let s, h, pitch = 0, vis = true;
    if (k < 2){ if (tt < 70){ const f = tt/70; s = -13000*(1 - f) + 300*f; h = 690*(1 - f) + 4.5; pitch = -0.05; } else if (tt < 98){ const tau = tt - 70; s = 300 + 68*tau - 1.15*tau*tau; h = 4.5; } else vis = false; }
    else { if (tt < 34){ s = 250 + 1.05*tt*tt; h = 4.5; } else if (tt < 110){ const tau = tt - 34; s = 250 + 1214 + 78*tau; h = 4.5 + Math.min(1700, tau*tau*0.9 + tau*6); pitch = h < 1600 ? 0.16 : 0.03; } else vis = false; }
    const x = a[0] + u[0]*s, y = a[1] + u[1]*s;
    p.set(x, Math.max(0, hC(x, y)) + h, -y); e.set(0, Math.atan2(u[1], u[0]), pitch); q.setFromEuler(e); m.compose(p, q, vis && showNet ? one : zero); P.im.setMatrixAt(P.base + k, m);
  }
  P.im.instanceMatrix.needsUpdate = true;
}
// Sentosa Express and the Changi Skytrain: two-car trains shuttling on the monorail beams
function sgrMonorail(){
  SGR.mono = [];
  const mono = SGR.lines.filter(l => l.c === 16);
  if (!mono.length) return;
  // join the pieces of each system into long runs
  const runs = [];
  for (const l of mono){ const P = []; for (let i = 0; i < l.P.length; i += 2) P.push([l.P[i], l.P[i+1], l.E ? l.E[i >> 1] : 0]); runs.push(P); }
  const join = () => { for (let a = 0; a < runs.length; a++) for (let b = 0; b < runs.length; b++){ if (a === b) continue; const A = runs[a], Bq = runs[b], ea = A[A.length-1];
    const d0 = Math.hypot(ea[0] - Bq[0][0], ea[1] - Bq[0][1]), d1 = Math.hypot(ea[0] - Bq[Bq.length-1][0], ea[1] - Bq[Bq.length-1][1]);
    if (d0 < 6){ runs[a] = A.concat(Bq.slice(1)); runs.splice(b, 1); return true; } if (d1 < 6){ runs[a] = A.concat(Bq.slice().reverse().slice(1)); runs.splice(b, 1); return true; } } return false; };
  while (join());
  const good = runs.filter(P => { let L = 0; for (let i = 1; i < P.length; i++) L += Math.hypot(P[i][0] - P[i-1][0], P[i][1] - P[i-1][1]); return L > 600; });
  if (!good.length) return;
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({color:0xffffff}), good.length*2), c = new THREE.Color();
  good.forEach((P, i) => { const cum = [0]; for (let k = 1; k < P.length; k++) cum.push(cum[k-1] + Math.hypot(P[k][0] - P[k-1][0], P[k][1] - P[k-1][1])); SGR.mono.push({P, cum, L:cum[cum.length-1], k:i}); c.setRGB(0.95, 0.7, 0.2); im.setColorAt(i*2, c); im.setColorAt(i*2 + 1, c); });
  im.castShadow = true; moverGroup.add(im); SGR.monoMesh = im;
}
function sgrStepMono(t){
  const im = SGR.monoMesh; if (!im) return;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(11, 3.2, 2.8);
  for (const M of SGR.mono){
    const per = 2*M.L/9 + 60, ph = (t + M.k*40) % per; let d = ph < per/2 ? Math.min(M.L, ph*9) : Math.max(0, M.L - (ph - per/2)*9);
    for (let car = 0; car < 2; car++){
      const dd = Math.max(0, Math.min(M.L, d - car*11.5)); let i = 1; while (i < M.cum.length - 1 && M.cum[i] < dd) i++;
      const a = M.P[i-1], b = M.P[i], f = (dd - M.cum[i-1])/Math.max(1e-6, M.cum[i] - M.cum[i-1]), x = a[0] + (b[0] - a[0])*f, y = a[1] + (b[1] - a[1])*f, z = Math.max(8, a[2] + (b[2] - a[2])*f);
      p.set(x, hC(x, y) + z + 2.3, -y); e.set(0, Math.atan2(b[1] - a[1], b[0] - a[0]), 0); q.setFromEuler(e); m.compose(p, q, s); im.setMatrixAt(M.k*2 + car, m);
    }
  }
  im.instanceMatrix.needsUpdate = true;
}

/* ---------- the network: rail, F1, cable car, port, ships, airport (the roads are the real ones, in the tiles) ---------- */
function buildNetworkSG(){
  clearNetwork(false); sgReserveSites();
  for (let k = 0; k < N*N; k++) if (nat[k] === 5) resv[k] = 8;
  buildSAT();
  net.ropes = []; net.erp = 0;
  const B = {flat:mk(), deck:mk(), bld:mk(), lamps:[], lampC:[], wire:[], trees:[]}; B.bld.uv = []; B.bld.gl = [];
  sgMRT(B);
  sgF1(B);
  sgCableCar(B);
  sgPort(B);
  buildSAT();
  if (B.flat.pos.length){ const m = toMesh(B.flat, matFlat); m.receiveShadow = true; regionGroup.add(m); }
  if (B.deck.pos.length){ const m = toMesh(B.deck, matBld); m.castShadow = true; m.receiveShadow = true; regionGroup.add(m); }
  if (B.bld.pos.length){ const m = toMesh(B.bld, matBld); m.castShadow = true; m.receiveShadow = true; regionGroup.add(m); }
  if (B.wire.length){ const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(B.wire, 3)); regionGroup.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({color:0x55585a, transparent:true, opacity:0.55}))); }
  if (B.lamps.length) regionGroup.add(pointsMesh(B.lamps, B.lampC));
  sgrPlanes(); sgrMonorail();
  // real buildings that the network models replace: elevated stations, the F1 pit building, the cable-car stations
  SGR.discs = [];
  for (const S of net.stations) if (S.mrt && S.elev) SGR.discs.push({x:S.p[0], y:S.p[1], r:48, t:10}, {x:S.p[0], y:S.p[1], r:26, t:-1, h:30});
  for (const q of net.extras) if (q.t === 'pits') SGR.discs.push({x:q.x, y:q.y, r:70, t:-1, h:40});
    sgMakeCuts();
  regionGroup.visible = moverGroup.visible = showNet;
  buildUserRoutes();
  runHooks('net');
  syncLabels();
}
function sgMakeCuts(){ sgCuts = []; }
// anchored ships in New York Harbor: the Gravesend Bay and Stapleton anchorages, the Lower Bay
function sgrShips(){
  const r = mulberry32(1819); let k = 0;
  const box = [sgXY(40.545, -74.065), sgXY(40.625, -74.000)];
  for (let t = 0; t < 900 && k < 14; t++){
    const x = box[0][0] + r()*(box[1][0] - box[0][0]), y = box[0][1] + r()*(box[1][1] - box[0][1]), ang = r()*Math.PI*2, u = [Math.cos(ang), Math.sin(ang)];
    let ok = true; for (let s = -170; s <= 170 && ok; s += 34) for (const o of [-60, 0, 60]){ const q = [x + u[0]*s - u[1]*o, y + u[1]*s + u[0]*o], kk = cx2i(q[1])*N + cx2i(q[0]); if (nat[kk] !== 1 || hAt(q[0], q[1]) > -6 || distSea[kk]*CELL < 0) ok = false; }
    if (!ok) continue;
    const m = new THREE.Mesh(shipGeo(r), matShip); m.position.set(x, 0, -y); m.rotation.y = ang; m.castShadow = true; regionGroup.add(m); k++;
  }
}

/* ---------- districts = the 55 URA planning areas; statistics from the real buildings ---------- */
const SGR_FH = t => (t === 1 || t === 2 || t === 3 || t === 11) ? 3 : (t === 5 || t === 12) ? 4.2 : (t === 6 || t === 10) ? 5 : 3.8;
const SGR_JOBS = {0:1/130, 4:1/30, 5:1/18, 6:1/70, 7:1/60, 8:1/220, 9:1/45, 10:1/110, 11:0, 12:1/75};
function sgrStats(){
  const B = SGR.base.stats;
  const S = {n:B.n, gfa:B.gfa, pop:B.pop, jobs:B.jobs, hdb:0, tall:B.tall, byPa:B.byPa.map(r => ({pop:r[0], jobs:r[1], n:r[2], gfa:r[3]})), byType:Float64Array.from(B.byType)};
  // origins and destinations for the traffic model (1 km cells); homes scaled so floor/40 = residents (the app's traffic convention)
  let res = 0; for (const o of B.od) if (o[0] === 1) res += o[1];
  const kr = res ? B.pop*40/res : 1;
  SGR.od = B.od.map(o => ({zone:o[0], floor:o[0] === 1 ? o[1]*kr : o[1]*0.6, c:[o[2], o[3]]}));
  SGR.stats = S; return S;
}
function computeDistrictsSG(full){
  if (!SGR.bldData) return;
  const S = sgrStats();
  const dev = []; for (const sb of skeleton){ const c = cache.get(sb.key); if (c && c.dev) dev.push({sb, c, x:c.cx, y:c.cy, w:c.st.devArea}); }
  sbDist = new Int32Array(skeleton.length).fill(-1);
  const old = new Map(districts.filter(d => d.pa).map(d => [d.pa, d])); districts = [];
  const area = new Float64Array(SGD.pas.length + 1); for (let k = 0; k < N*N; k++){ const v = nat[k]; if (v === 0 || v === 3 || v === 4) area[SG.pa[k]] += CELL*CELL; }
  SGD.pas.forEach((A, i) => {
    const pi = i + 1, o = old.get(pi), P = S.byPa[pi], ci = SG.regMap[A.reg];
    districts.push({id:districts.length, pa:pi, city:ci === undefined ? -1 : ci, x:A.x, y:A.y, lx:A.x, ly:A.y, color:DCOL[(pi*5) % DCOL.length], name:o && o.custom ? o.name : A.zh, en:o && o.custom ? o.en : A.en, custom:!!(o && o.custom),
      area:area[pi], pop:P.pop, jobs:P.jobs, z:[0,0,0,0,0,0,0], coast:0, river:0, hsum:0, cells:0, nBld:P.n});
  });
  for (const p of dev){ const pi = sgPA(p.x, p.y); if (!pi) continue; const d = districts[pi - 1]; d.pop += p.c.st.floor[1]/40; d.jobs += jobsOf(p.c.st.floor); sbDist[p.sb.id] = d.id; }
  cityDefs.forEach((c, ci) => { const live = districts.filter(d => d.city === ci && d.area > 0), W = live.reduce((s, d) => s + d.area, 0); if (W){ c.labelPos = [live.reduce((s, d) => s + d.lx*d.area, 0)/W, live.reduce((s, d) => s + d.ly*d.area, 0)/W]; c.pop = live.reduce((s, d) => s + d.pop, 0); } });
  drawBounds(); renderDistrictList(); syncLabels();
}
function sgrDrawBounds(){
  for (const ch of [...boundGroup.children, ...fillGroup.children]){ ch.parent.remove(ch); ch.geometry.dispose(); }
  const L = SGR.base.palines || [], pos = [];
  for (const P of L) for (let i = 0; i < P.length - 1; i++){
    const a = P[i], b = P[i+1], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1])/60));
    for (let s = 0; s < n; s++){ const x0 = a[0] + (b[0] - a[0])*s/n, y0 = a[1] + (b[1] - a[1])*s/n, x1 = a[0] + (b[0] - a[0])*(s + 1)/n, y1 = a[1] + (b[1] - a[1])*(s + 1)/n; const wv = nat[cx2i((y0 + y1)/2)*N + cx2i((x0 + x1)/2)]; if (wv === 1 || wv === 2) continue; pos.push(x0, hC(x0, y0) + 3, -y0, x1, hC(x1, y1) + 3, -y1); }
  }
  if (pos.length){ const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); boundGroup.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({color:0x3a3f3c, transparent:true, opacity:0.55}))); }
  boundGroup.visible = showBounds; fillGroup.visible = false;
}

/* ---------- labels: places, landmarks of the map (POIs), reservoirs, roads, stations, campuses ---------- */
const SGR_POI_ICON = {theme_park:'🎢', zoo:'🦒', aquarium:'🐠', attraction:'📍', museum:'🏛', mall:'🛍', stadium:'🏟', university:'🎓', college:'🎓', hospital:'🏥', hotel:'🏨', viewpoint:'👁', aerodrome:'✈',
  ferry_terminal:'⛴', place_of_worship:'⛩', marketplace:'🍜', park:'🌳', nature_reserve:'🌿', golf_course:'⛳', beach:'🏖', castle:'🏰', monument:'🗿', memorial:'🗿', library:'📚', theatre:'🎭', arts_centre:'🎭',
  garden:'🌺', sports_centre:'🏸', terminal:'✈', bus_station:'🚌', convention_centre:'🏢', casino:'🎰', fort:'🏰', lighthouse:'🗼', planetarium:'🔭', water_park:'💦', national_park:'🌿', peak:'▲', cinema:'🎬', swimming_pool:'🏊'};
function sgLabels(){
  const esc = t => String(t).replace(/[&<>"]/g, ch => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'}[ch]));
  const mk2 = (cls, html, it) => { const el = document.createElement('div'); el.className = cls; el.innerHTML = html; labelsEl.appendChild(el); labelItems.push(Object.assign({el}, it)); };
  const nm = (zh, en) => `${esc(zh || en)}${zh && en && zh !== en ? `<small>${esc(en)}</small>` : ''}`;
  for (const s of sgSites) mk2('lbl n lm', `${s.key === 'gardens' ? '🌿' : s.key === 'uss' ? '🎢' : s.key.startsWith('changi') ? '✈' : '🎓'} ${esc(s.zh)}<small>${esc(s.en)}</small>`, {x:s.x, y:s.y, abs:s.top + 20, maxD:16000});
  for (const s of sgSites) if (s.labels) for (const L of s.labels) mk2('lbl n poi', `${L.ic || '🏛'} ${esc(L.zh || L.en)}${L.zh && L.en && L.zh !== L.en ? `<small>${esc(L.en)}</small>` : ''}`, {x:L.x, y:L.y, abs:L.abs + 6, near:L.near || 1500});
  const B = SGR.base; if (!B) return;
  if (showNatLabels){
    const seen = new Set(SGD.pas.map(p => p.en.toLowerCase()));
    for (const p of B.places){ const key = String(p.en).toLowerCase(); if (seen.has(key)) continue; seen.add(key); const big = p.k === 'suburb' || p.k === 'town' || p.k === 'city'; mk2('lbl n' + (big ? ' place' : ''), nm(p.zh, p.en), {x:p.x, y:p.y, lift:big ? 40 : 22, near:big ? 8000 : p.k === 'quarter' ? 3200 : 1800}); }
    for (const w of B.waters){ if (!w.k || w.mz > 15) continue; const key = 'w' + String(w.en).toLowerCase(); if (seen.has(key)) continue; seen.add(key); const big = !!w.b || /Reservoir|Strait|Harbor/.test(w.en); mk2('lbl n', '〰 ' + nm(w.zh, w.en), {x:w.x, y:w.y, lift:10, near:big ? 9000 : 2600}); }
  }
  // landmark models carry their own labels: drop map POIs on or right next to them
  const onLm = (x, y) => { for (const H of SGR.hulls.values()){ const b = H.bb; if (x < b[0] - 30 || x > b[2] + 30 || y < b[1] - 30 || y > b[3] + 30) continue; if (pip(H.P, x, y)) return true; } for (const L of landmarks) if (Math.hypot(L.x - x, L.y - y) < 45) return true; return false; };
  // v20: a campus/airport site already carries its own label
  const siteDup = p => { const e = (p.en || '').toLowerCase(); if (!e) return false; for (const S of sgSites){ const se = (S.en || '').toLowerCase(); if (Math.hypot(S.x - p.x, S.y - p.y) < 3000 && (se.includes(e) || e.includes(se.split(' –')[0].split(',')[0]))) return true; } return false; };
  const subLab = (x, y) => { for (const S of sgSites) if (S.labels && Math.hypot(S.x - x, S.y - y) < 3000) for (const L of S.labels) if (Math.hypot(L.x - x, L.y - y) < 60) return true; return false; };
  if (showPoi) for (const p of B.pois){ if (onLm(p.x, p.y) || siteDup(p) || subLab(p.x, p.y)) continue; const ic = SGR_POI_ICON[p.k] || '•', near = p.pr <= 1 ? 9000 : p.pr === 2 ? 1900 : 900; mk2('lbl n poi' + (p.pr <= 1 ? ' big' : ''), `${ic} ${nm(p.zh, p.en)}`, {x:p.x, y:p.y, lift:18, near}); }
  if (showNet){
    for (const r of SGR.roadLabels){ const hw = r.cls <= 1; mk2('lbl n road' + (hw ? ' hw' : ''), `${esc(r.zh || r.en)}${r.ref ? ` <b class="ref">${esc(r.ref)}</b>` : ''}${r.zh && r.en ? `<small>${esc(r.en)}</small>` : ''}`, {x:r.x, y:r.y, abs:r.z + (hw ? 9 : 5), near:hw ? 3000 : r.cls <= 4 ? 1500 : 750}); }
    for (const S of net.stations) if (S.mrt) mk2('lbl n tr', `🚇 ${esc(S.name[0])}<small>${esc(S.name[1])}</small>`, {x:S.p[0], y:S.p[1], lift:S.elev ? 26 : 10, near:3200});
  }
}

/* ---------- entering and leaving Singapore ---------- */
const SG_SUB = 'City Brush · 纽约 New York City 1:1 · 真实地图 Real map · © OpenStreetMap', ISL_SUB = 'City Brush · 地图 24 × 24 km';
function sgView(){ const t = sgXY(40.7330, -73.9930), y = 10; controls.target.set(t[0], y, -t[1]); camera.position.set(t[0] + 1900, y + 2500, -t[1] + 4700); }
function sgFly(){ const t = sgXY(40.7540, -73.9840); flyTo(new THREE.Vector3(t[0] + 1500, 1250, -t[1] + 2300), new THREE.Vector3(t[0], 20, -t[1])); }
function sgBuild(){
  SG.on = true; SGR.on = true; styleKey = 'manhattan'; islandSeed = 1624;
  allocWorld(SGR.base.HALF, SGR.base.CELL, SGR.base.TS);
  SGR.off = new Uint8Array(N*N); SGR.hulls.clear(); sgrAfterBuild.done = false;
  for (const c of cache.values()) disposeGroup(c.group); cache.clear(); queue = [];
  clearNetwork(false); userRoutes = []; landmarks = []; rebuildLandmarks();
  genSingapore(); buildTerrainMesh(); sgSkirt(); sgrGroundInit(); sgrWater();
  sgZoning(); placeSites(); sgPlaceLandmarks(); buildNetworkSG(); sgrShips();
  sgrLandmarkHulls();
  SGRoads.setStructSkip((x, y) => { for (const H of SGR.hulls.values()){ const b = H.bb; if (x < b[0] || x > b[2] || y < b[1] || y > b[3]) continue; if (pip(H.P, x, y)) return true; } return false; });
  if (!SGR.roadLabels.length) SGR.roadLabels = SGRoads.labels(SGR.lines).filter(r => !r.foreign && (r.cls <= 8 || r.en)).slice(0, 4200);
  if (!SGR.graphSegs.length) SGR.graphSegs = SGRoads.graph(SGR.lines).filter(s => s[4] >= 1);
  SGRoads.prepare(SGR.lines);
  sgrTilesInit();
  roads = []; undoStack.length = 0; drawUserRoads();
  sgNames(true);
}
function sgExit(){
  if (!SG.on) return;
  SG.on = false; SGR.on = false; styleKey = 'tokyo';
  for (const c of cache.values()) disposeGroup(c.group); cache.clear(); queue = [];
  for (const ch of [...sgGroup.children]){ sgGroup.remove(ch); ch.traverse(o => { if (o.geometry && o.geometry !== treeGeo) o.geometry.dispose(); }); }
  sgrTilesClear(); sgrDisposeGroup(SGR.waterGroup); SGR.hulls.clear(); SGR.planes = null; SGR.monoMesh = null; SGR.mono = [];
  clearNetwork(false); landmarks = []; rebuildLandmarks();
  siteMask.fill(0); sgSites = []; SG.lu = SG.pa = null; SG.resMask = null;
  if (sgSkirtMesh){ scene.remove(sgSkirtMesh); sgSkirtMesh.geometry.dispose(); sgSkirtMesh = null; }
  allocWorld(12000, 10, 30);
  sgNames(false);
}
function sgReset(){
  zones.fill(0); dens.fill(0); arch.fill(0); SGR.off.fill(0);
  for (const c of cache.values()) disposeGroup(c.group); cache.clear(); queue = [];
  sgZoning(); placeSites(); buildNetworkSG(); sgrShips(); drawUserRoads();
  for (const T of SGR.tiles.values()){ if (T.trees){ SGR.group.remove(T.trees); T.trees.dispose(); T.trees = null; } T.treesDone = false; }
  sgrQueueTiles(new Set(SGR.tiles.keys()));
  forceDivide = true; buildSkeleton(); drawTex(); renderStats(); requestRegen(); sgFly(); hideBusy();
}
function sgEnter(){
  showBusy('正在载入纽约… Loading New York City');
  sgrLoad().then(() => setTimeout(() => {
    sgBuild(); renderStyle();
    tRes = null; buildFlow(); buildCars(); trafficRan = true; renderTrafficStats();
    forceDivide = true; buildSkeleton(); drawTex(); renderIslandStats(); renderStats(); syncLabels(); requestRegen(); sgFly();
  }, 30)).catch(e => { console.error(e); showToast('纽约地图载入失败 · Could not load the New York map'); });
}
function sgrBoot(){
  showFlow = false; { const f = $('#showFlow'); if (f) f.checked = false; } flowGroup.visible = false;   // the real roads read better without the flow overlay; it is one click away
  showBusy('正在载入真实纽约地图… Loading the real map of New York City');
  sgrLoad().then(() => {
    sgView(); sgBuild();
    setTool('R'); renderStyle(); renderIslandStats(); syncLabels();
    buildSkeleton(); drawTex(); renderStats();
    sgView(); applyTime(); syncLabels();
    trafficRan = true; requestRegen();
  }).catch(e => {
    console.error(e);
    newIsland(true); applyTime();
    showToast('无法载入纽约地图数据，已改为生成岛屿 · Could not load the New York data; showing a generated island');
  });
}

/* ---------- v20: the real streets are the block grid when repainting (no invented streets) ----------
   A superblock of the painting lattice is cut into the faces of the real road network (classes 0-11, at grade) inside it;
   faces are split into convex pieces (no road on the cuts) and big faces into lots. Painting snaps to whole pieces. */
const SGR_WID = [[26,13],[6.5,6.5],[20,11],[6.5,6.5],[15,10],[6,6],[12,8],[5.5,5.5],[9.5,7],[5,5],[7,5.5],[4.5,4]];
const SGR_CUT = {w:0, k:'cut'};
function sgrLineIndex(){
  if (SGR.lineIdx) return SGR.lineIdx;
  const G = 400, n = Math.ceil(2*HALF/G), cells = new Map(), gi = v => Math.min(n - 1, Math.max(0, Math.floor((v + HALF)/G)));
  SGR.lines.forEach((l, i) => {
    if (l.c > 11 || (l.flags & 8)) return;
    const P = l.P; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let k = 0; k < P.length; k += 2){ x0 = Math.min(x0, P[k]); x1 = Math.max(x1, P[k]); y0 = Math.min(y0, P[k+1]); y1 = Math.max(y1, P[k+1]); }
    for (let j = gi(y0); j <= gi(y1); j++) for (let q = gi(x0); q <= gi(x1); q++){ const key = j*n + q; let L = cells.get(key); if (!L) cells.set(key, L = []); L.push(i); }
  });
  return SGR.lineIdx = {G, n, cells, gi};
}
// clip segment a-b to the convex CCW polygon P (Cyrus-Beck): returns [t0, t1] or null
function sgrClipSeg(P, ax, ay, bx, by){
  let t0 = 0, t1 = 1; const dx = bx - ax, dy = by - ay;
  for (let i = 0, n = P.length; i < n; i++){
    const p = P[i], q = P[(i+1) % n], ex = q[0] - p[0], ey = q[1] - p[1];
    const num = ex*(ay - p[1]) - ey*(ax - p[0]), den = ex*dy - ey*dx;   // inside: ex*(y-py) - ey*(x-px) >= 0
    if (Math.abs(den) < 1e-12){ if (num < 0) return null; continue; }
    const t = -num/den; if (den > 0){ if (t > t0) t0 = t; } else { if (t < t1) t1 = t; }
    if (t0 > t1) return null;
  }
  return [t0, t1];
}
function sgrFacePieces(sb){
  if (!SGR.faceCache) SGR.faceCache = new Map();
  const hit = SGR.faceCache.get(sb.key); if (hit) return hit;
  const P = sb.poly.p, A = sb.poly.a, IX = sgrLineIndex(), seen = new Set(), S = [];
  // 1. segments: real roads clipped to the superblock, plus its own boundary (user roads keep their width)
  for (let j = IX.gi(sb.bb[1]); j <= IX.gi(sb.bb[3]); j++) for (let q = IX.gi(sb.bb[0]); q <= IX.gi(sb.bb[2]); q++){
    const L = IX.cells.get(j*IX.n + q); if (!L) continue;
    for (const li of L){
      if (seen.has(li)) continue; seen.add(li);
      const l = SGR.lines[li], LP = l.P, w = SGR_WID[l.c][l.flags & 1 ? 1 : 0];
      for (let k = 0; k + 3 < LP.length; k += 2){
        if (l.E && Math.min(l.E[k >> 1], l.E[(k >> 1) + 1]) > 2.5) continue;      // viaducts don't cut the ground
        const ax = LP[k], ay = LP[k+1], bx = LP[k+2], by = LP[k+3];
        if (Math.max(ax, bx) < sb.bb[0] || Math.min(ax, bx) > sb.bb[2] || Math.max(ay, by) < sb.bb[1] || Math.min(ay, by) > sb.bb[3]) continue;
        const c = sgrClipSeg(P, ax, ay, bx, by); if (!c || c[1] - c[0] < 1e-6) continue;
        const a = [ax + (bx - ax)*c[0], ay + (by - ay)*c[0]], b = [ax + (bx - ax)*c[1], ay + (by - ay)*c[1]];
        if (Math.hypot(b[0] - a[0], b[1] - a[1]) > 0.3) S.push({a, b, w, li});
      }
    }
  }
  for (let i = 0; i < P.length; i++) S.push({a:P[i], b:P[(i+1) % P.length], w:A[i] && A[i].user ? A[i].w : 0, li:-1, user:!!(A[i] && A[i].user)});
  // 2. node the segments (proper crossings and T-junctions), sharing exact split points
  const GC = 30, grid = new Map(), sp = S.map(() => []);
  S.forEach((s, i) => { const x0 = Math.floor(Math.min(s.a[0], s.b[0])/GC), x1 = Math.floor(Math.max(s.a[0], s.b[0])/GC), y0 = Math.floor(Math.min(s.a[1], s.b[1])/GC), y1 = Math.floor(Math.max(s.a[1], s.b[1])/GC);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++){ const k = x + ',' + y; let L = grid.get(k); if (!L) grid.set(k, L = []); L.push(i); } });
  const done = new Set(), E = 0.15;
  const touch = (s, p, i) => { const dx = s.b[0] - s.a[0], dy = s.b[1] - s.a[1], L2 = dx*dx + dy*dy, t = ((p[0] - s.a[0])*dx + (p[1] - s.a[1])*dy)/L2;
    if (t <= 1e-4 || t >= 1 - 1e-4) return; const qx = s.a[0] + dx*t - p[0], qy = s.a[1] + dy*t - p[1]; if (qx*qx + qy*qy < E*E) sp[i].push([t, p]); };
  for (const L of grid.values()) for (let x = 0; x < L.length; x++) for (let y = x + 1; y < L.length; y++){
    const i = L[x], j = L[y], key = i < j ? i*1e6 + j : j*1e6 + i; if (done.has(key)) continue; done.add(key);
    const s = S[i], r = S[j], dx = s.b[0] - s.a[0], dy = s.b[1] - s.a[1], ex = r.b[0] - r.a[0], ey = r.b[1] - r.a[1], den = dx*ey - dy*ex;
    if (Math.abs(den) > 1e-9){
      const t = ((r.a[0] - s.a[0])*ey - (r.a[1] - s.a[1])*ex)/den, u = ((r.a[0] - s.a[0])*dy - (r.a[1] - s.a[1])*dx)/den;
      if (t > 1e-4 && t < 1 - 1e-4 && u > 1e-4 && u < 1 - 1e-4){ const p = [s.a[0] + dx*t, s.a[1] + dy*t]; sp[i].push([t, p]); sp[j].push([u, p]); continue; }
    }
    touch(s, r.a, i); touch(s, r.b, i); touch(r, s.a, j); touch(r, s.b, j);
  }
  // 3. planar graph
  const nodes = [], nodeOf = new Map(), nid = p => { const k = Math.round(p[0]*8) + ',' + Math.round(p[1]*8); let v = nodeOf.get(k); if (v === undefined){ v = nodes.length; nodes.push(p); nodeOf.set(k, v); } return v; };
  const edges = [], ekey = new Map();
  S.forEach((s, i) => {
    const pts = [[0, s.a], ...sp[i].sort((a, b) => a[0] - b[0]), [1, s.b]];
    for (let k = 1; k < pts.length; k++){
      const u = nid(pts[k-1][1]), v = nid(pts[k][1]); if (u === v) continue;
      const kk = u < v ? u + '_' + v : v + '_' + u, e0 = ekey.get(kk);
      if (e0 !== undefined){ const e = edges[e0]; if (s.w > e.w){ e.w = s.w; e.li = s.li; e.user = s.user; } continue; }
      ekey.set(kk, edges.length); edges.push({u, v, w:s.w, li:s.li, user:s.user, dead:false});
    }
  });
  const deg = new Int32Array(nodes.length), adj = nodes.map(() => []);
  edges.forEach((e, i) => { deg[e.u]++; deg[e.v]++; adj[e.u].push(i); adj[e.v].push(i); });
  // dead ends (cul-de-sacs, driveways) don't bound blocks; remember their lines so a repainted block can drop them
  const stack = []; for (let v = 0; v < nodes.length; v++) if (deg[v] === 1) stack.push(v);
  while (stack.length){ const v = stack.pop(); if (deg[v] !== 1) continue;
    for (const ei of adj[v]){ const e = edges[ei]; if (e.dead) continue; e.dead = true; if (e.li >= 0){ (SGR.dangle || (SGR.dangle = new Set())).add(e.li); } const o = e.u === v ? e.v : e.u; deg[v]--; deg[o]--; if (deg[o] === 1) stack.push(o); break; } }
  // 4. faces: walk with the face on the left
  const out = nodes.map(() => []);
  edges.forEach((e, i) => { if (e.dead) return; const a = nodes[e.u], b = nodes[e.v]; out[e.u].push({h:2*i, ang:Math.atan2(b[1] - a[1], b[0] - a[0])}); out[e.v].push({h:2*i + 1, ang:Math.atan2(a[1] - b[1], a[0] - b[0])}); });
  const pos = new Int32Array(edges.length*2);
  out.forEach(L => { L.sort((a, b) => a.ang - b.ang); L.forEach((o, k) => { pos[o.h] = k; }); });
  const from = h => h & 1 ? edges[h >> 1].v : edges[h >> 1].u, to = h => h & 1 ? edges[h >> 1].u : edges[h >> 1].v;
  const used = new Uint8Array(edges.length*2), faces = [];
  for (let h0 = 0; h0 < edges.length*2; h0++){
    if (used[h0] || edges[h0 >> 1].dead) continue;
    const ring = [], ws = []; let h = h0, guard = 0;
    while (!used[h] && guard++ < 20000){ used[h] = 1; ring.push(nodes[from(h)]); const e = edges[h >> 1]; ws.push(e.w > 0 ? {w:e.w, k:e.user ? 'art' : 'real', user:e.user} : SGR_CUT);
      const v = to(h), L = out[v], tw = h ^ 1, k = pos[tw]; h = L[(k - 1 + L.length) % L.length].h; }
    if (ring.length < 3) continue;
    let ar = 0; for (let i = 0; i < ring.length; i++){ const a = ring[i], b = ring[(i+1) % ring.length]; ar += a[0]*b[1] - b[0]*a[1]; } ar /= 2;
    if (ar > 120) faces.push({p:ring, a:ws, area:ar});
  }
  // 5. simplify, convex pieces, lots
  const pieces = []; let unit = 0;
  for (const F of faces){
    const q = sgrSimplifyRing(F); if (!q) continue;
    const conv = sgrConvexPieces(q), big = F.area > 30000, lots = [];
    for (const c of conv){ if (big) sgrLots(c, lots); else lots.push(c); }
    const u0 = unit; if (!big) unit++;
    for (const c of lots){ const ar = Math.abs(areaP(c.p)); if (ar < 60) continue; c.u = big ? unit++ : u0; c.face = F.area; pieces.push(c); }
  }
  if (SGR.faceCache.size > 4000) SGR.faceCache.delete(SGR.faceCache.keys().next().value);
  SGR.faceCache.set(sb.key, pieces);
  return pieces;
}
// drop vertices that lie within 0.6 m of the chord from the last kept vertex (same edge kind), and tiny edges
function sgrSimplifyRing(F){
  const p = F.p, a = F.a, n = p.length;
  // start at a vertex where the edge kind changes (or a sharp corner) so the walk can't swallow it
  let s0 = 0; for (let i = 0; i < n; i++) if ((a[(i - 1 + n) % n].w || 0) !== (a[i].w || 0)){ s0 = i; break; }
  const np = [p[s0]], na = [a[s0]];
  for (let k = 1; k < n; k++){
    const i = (s0 + k) % n, c = p[i], nx = p[(i + 1) % n], L = np[np.length - 1];
    const same = (na[na.length - 1].w || 0) === (a[i].w || 0);
    if (same){
      const dx = nx[0] - L[0], dy = nx[1] - L[1], d2 = dx*dx + dy*dy;
      if (d2 < 1e-6) continue;
      const t = ((c[0] - L[0])*dx + (c[1] - L[1])*dy)/d2, qx = L[0] + dx*t - c[0], qy = L[1] + dy*t - c[1];
      if (t > 0 && t < 1 && qx*qx + qy*qy < 0.36) continue;
      if (Math.hypot(c[0] - L[0], c[1] - L[1]) < 0.4) continue;
    }
    np.push(c); na.push(a[i]);
  }
  return np.length >= 3 ? {p:np, a:na} : null;
}
// convex pieces: shallow dents (a road bending into the block) are bridged by chords (≤ 1.8 m), the remaining reflex
// corners are cut along the extension of one of their edges (the cut carries no road), recursively
function sgrCross(o, a, b){ return (a[0] - o[0])*(b[1] - o[1]) - (a[1] - o[1])*(b[0] - o[0]); }
function sgrBridgeDents(q){
  const P = q.p, A = q.a, n = P.length; if (n < 4) return q;
  const refl = i => { const u = P[(i - 1 + n) % n], v = P[i], w = P[(i + 1) % n], lu = Math.hypot(v[0] - u[0], v[1] - u[1]), lw = Math.hypot(w[0] - v[0], w[1] - v[1]); return sgrCross(u, v, w) < -1e-4*lu*lw; };
  let s0 = -1; for (let i = 0; i < n; i++) if (!refl(i)){ s0 = i; break; }
  if (s0 < 0) return q;
  const np = [P[s0]], na = [A[s0]]; let skipped = [];
  for (let k = 1; k <= n; k++){
    const i = (s0 + k) % n; if (k === n) break;
    const c = P[i], nx = P[(i + 1) % n], L = np[np.length - 1];
    if (refl(i) && (na[na.length - 1].w || 0) === (A[i].w || 0)){
      const dx = nx[0] - L[0], dy = nx[1] - L[1], d2 = dx*dx + dy*dy; let ok = d2 > 1e-6;
      for (const t of ok ? [...skipped, c] : []){ const tt = ((t[0] - L[0])*dx + (t[1] - L[1])*dy)/d2, qx = L[0] + dx*tt - t[0], qy = L[1] + dy*tt - t[1]; if (tt < 0 || tt > 1 || qx*qx + qy*qy > 3.24){ ok = false; break; } }
      if (ok){ skipped.push(c); continue; }
    }
    np.push(c); na.push(A[i]); skipped = [];
  }
  return np.length >= 3 ? {p:np, a:na} : q;
}
function sgrRayCut(q, vi, d){
  const P = q.p, A = q.a, n = P.length, v = P[vi];
  let best = Infinity, bi = -1, bp = null;
  for (let i = 0; i < n; i++){
    if (i === vi || (i + 1) % n === vi) continue;
    const a = P[i], b = P[(i + 1) % n], ex = b[0] - a[0], ey = b[1] - a[1], den = d[0]*ey - d[1]*ex; if (Math.abs(den) < 1e-12) continue;
    const t = ((a[0] - v[0])*ey - (a[1] - v[1])*ex)/den, s = ((a[0] - v[0])*d[1] - (a[1] - v[1])*d[0])/den;
    if (t > 1e-6 && s >= -1e-9 && s <= 1 + 1e-9 && t < best){ best = t; bi = i; bp = [v[0] + d[0]*t, v[1] + d[1]*t]; }
  }
  if (bi < 0) return null;
  const r1 = {p:[], a:[]}, r2 = {p:[], a:[]};
  for (let k = vi; ; k = (k + 1) % n){ r1.p.push(P[k]); r1.a.push(A[k]); if (k === bi) break; }
  r1.p.push(bp); r1.a.push(SGR_CUT);
  r2.p.push(bp); r2.a.push(A[bi]);
  for (let k = (bi + 1) % n; ; k = (k + 1) % n){ r2.p.push(P[k]); r2.a.push(k === vi ? SGR_CUT : A[k]); if (k === vi) break; }
  const c1 = clean(r1), c2 = clean(r2); if (!c1 || !c2) return null;
  return {parts:[c1, c2], len:best};
}
function sgrConvexPieces(q0, depth, out){
  out = out || []; depth = depth || 0;
  const q = depth ? q0 : sgrBridgeDents(q0), P = q.p, n = P.length;
  let worst = -1, wv = 0;
  for (let i = 0; i < n; i++){ const u = P[(i - 1 + n) % n], v = P[i], w = P[(i + 1) % n], lu = Math.hypot(v[0] - u[0], v[1] - u[1]), lw = Math.hypot(w[0] - v[0], w[1] - v[1]); if (lu < 1e-6 || lw < 1e-6) continue;
    const c = -sgrCross(u, v, w)/(lu*lw); if (c > 1e-4 && c > wv){ wv = c; worst = i; } }
  if (worst < 0 || depth > 24){ if (Math.abs(areaP(P)) > 40) out.push(q); return out; }
  const u = P[(worst - 1 + n) % n], v = P[worst], w = P[(worst + 1) % n];
  const d1 = [v[0] - u[0], v[1] - u[1]], d2 = [v[0] - w[0], v[1] - w[1]], nm = d => { const L = Math.hypot(d[0], d[1]); return [d[0]/L, d[1]/L]; };
  let best = null, bs = -Infinity;
  for (const d of [nm(d1), nm(d2)]){
    const r = sgrRayCut(q, worst, d); if (!r) continue;
    const a1 = Math.abs(areaP(r.parts[0].p)), a2 = Math.abs(areaP(r.parts[1].p)), sc = Math.min(a1, a2)/Math.max(a1, a2) - 0.004*r.len;
    if (sc > bs){ bs = sc; best = r; }
  }
  if (!best){ if (Math.abs(areaP(P)) > 40) out.push(q); return out; }
  for (const pt of best.parts) sgrConvexPieces(pt, depth + 1, out);
  return out;
}
// big faces are cut into lots of at most ~30 000 m² (no road on the cuts)
function sgrLots(c, out, depth){
  depth = depth || 0;
  if (depth > 6 || Math.abs(areaP(c.p)) <= 30000){ out.push(c); return; }
  const o = obb(c.p), r = split(c, o.c[0], o.c[1], -o.u[1], o.u[0], SGR_CUT);
  if (!r){ out.push(c); return; }
  sgrLots(r[0], out, depth + 1); sgrLots(r[1], out, depth + 1);
}
// cells (25 m) whose centre lies in a convex piece
function sgrPieceCells(c){
  if (c.cells) return c.cells;
  const bb = bboxOf(c.p), out = [];
  for (let j = cx2i(bb[1]); j <= cx2i(bb[3]); j++){ const y = cellX(j); for (let i = cx2i(bb[0]); i <= cx2i(bb[2]); i++) if (insideConvex(c.p, cellX(i), y)) out.push(j*N + i); }
  return c.cells = out;
}
// after a brush stroke: whole blocks (or lots of big blocks) follow the brush, or not at all
function sgrSnapStroke(bb){
  const U = undoStack[undoStack.length - 1]; if (!U || !U.off || !U.z) return bb;
  let gb = bb.slice();
  for (const sb of skeleton){
    const b = sb.bb; if (b[2] < bb[0] || b[0] > bb[2] || b[3] < bb[1] || b[1] > bb[3]) continue;
    const units = new Map();
    for (const c of sgrFacePieces(sb)){ let G = units.get(c.u); if (!G) units.set(c.u, G = {cells:[], bb:null}); for (const k of sgrPieceCells(c)) G.cells.push(k); }
    for (const G of units.values()){
      let t = 0; const zc = new Map();
      for (const k of G.cells){ if (zones[k] !== U.z[k] || SGR.off[k] !== U.off[k] || dens[k] !== U.d[k]){ t++; const key = zones[k] + '|' + dens[k]; zc.set(key, (zc.get(key) || 0) + 1); } }
      if (!t) continue;
      if (t >= 0.25*G.cells.length){
        let best = null, bn = -1; for (const [k, v] of zc) if (v > bn){ bn = v; best = k; }
        const [z, d] = best.split('|').map(Number);
        for (const k of G.cells){ if (nat[k] === 5) continue; if (z === 0 || allowed(k)){ zones[k] = z; dens[k] = d; } SGR.off[k] = 1; }
      } else for (const k of G.cells){ zones[k] = U.z[k]; dens[k] = U.d[k]; arch[k] = U.ar[k]; SGR.off[k] = U.off[k]; }
      for (const k of G.cells){ const x = cellX(k % N), y = cellX((k - k % N)/N); gb[0] = Math.min(gb[0], x - CELL); gb[1] = Math.min(gb[1], y - CELL); gb[2] = Math.max(gb[2], x + CELL); gb[3] = Math.max(gb[3], y + CELL); }
    }
  }
  texBB = texBB ? [Math.min(texBB[0], cx2i(gb[0])), Math.min(texBB[1], cx2i(gb[1])), Math.max(texBB[2], cx2i(gb[2])), Math.max(texBB[3], cx2i(gb[3]))] : [cx2i(gb[0]), cx2i(gb[1]), cx2i(gb[2]), cx2i(gb[3])]; texDirty = true;
  return gb;
}
