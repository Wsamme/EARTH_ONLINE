/* ================= v36 lm32/detail: sharp ground near the camera and in the big map (window.SGDetail) =================
   The real-map ground is one 4096 px texture for the whole map square (Singapore 13.7 m, New York 13.7 m, Bay Area 17.6 m per pixel),
   so up close parks, beaches, pitches, ponds and streams had soft, smeared edges, and the big map's ground was blurry when zoomed in.
   - <city>_cover.txt (lm32/cover/mkcover.py): the land-cover polygons and waterways that were baked into ground.webp, as vectors
     (0.5 m), loaded after the city (no delay to the start); a 500 m grid index.
   - SGDetail.paint(ctx, x0, y1, wm, dx, dy, dpx, opt): draws a world square crisply: the old texture as the background (it keeps the
     smooth things: sea depth, hill colours, the roof grain of the Bay / New York), the cover polygons and waterways sharp on top,
     the ground painted by campus sites (replayed from their sgrPaintPoly / sgrPaintLine calls) and the zone overlay (drawTex);
     opt.sea: the sea from the water mesh as a flat colour (the big map's coast).
   - 3D: two detail textures that follow the camera (a clipmap): L1 1 m/px over ~2 km, L2 4 m/px over ~8 km (smaller on phones),
     each a ring buffer of tiles (toroidal addressing: moving only redraws the tiles that came into the window, nearest first, in a
     few ms per frame; uploaded with texSubImage2D) plus a tiny mask texture saying which tile each slot holds. The terrain shader
     (lm32/detail/post_detail.py edits the v33 ground-detail block) blends L2 then L1 over the old texture, fading out over the outer
     tile of each window; the procedural grass / tree / sand detail of v33 then works on the sharp colours.
   Cost: idle 0 (nothing to redraw); moving: ≤ 3 ms of tile drawing per frame. Test handle: SGDetail.stats(). */
const SGDetail = (() => {
const D = {on:true, st:'idle', err:null, gen:0, cls:null, P:null, pc:null, ps:null, pbb:null, lc:null, lw:null, ls:null, lbb:null,
  ix:null, lix:null, ops:[], ovUsed:false, sea:null, seaCol:'#7fa5bf', L:[], ms:0, tiles:0, tileMs:0, tileMax:0, uploads:0, fails:0};
const GS = 500;      // index cell, metres

/* ---------- the cover file ---------- */
function decode(buf){
  const u = new Uint8Array(buf); let o = 4;
  if (u[0] !== 67 || u[1] !== 86 || u[2] !== 82 || (u[3] !== 49 && u[3] !== 50)) throw new Error('cover: bad header');
  const v2 = u[3] === 50, nc = u[o++], cls = [];
  for (let i = 0; i < nc; i++){ cls.push({fill:`rgb(${u[o]},${u[o+1]},${u[o+2]})`, cas:(u[o+3] | u[o+4] | u[o+5]) ? `rgb(${u[o+3]},${u[o+4]},${u[o+5]})` : null, cw:u[o+6]/4, map:v2 && !!(u[o+7] & 1), land:v2 && !!(u[o+7] & 2)}); o += v2 ? 8 : 7; }
  D.speckle = cls.some(C => C.map);       // Bay / New York: the urban classes are big-map only (the 3D keeps the texture's roof grain)
  const vu = () => { let v = 0, s = 1, b; do { b = u[o++]; v += (b & 127)*s; s *= 128; } while (b & 128); return v; };
  let P = new Float32Array(1 << 20), n = 0, lx = 0, ly = 0;
  const grow = k => { if (n + k > P.length){ const Q = new Float32Array(Math.max(P.length*2, n + k)); Q.set(P.subarray(0, n)); P = Q; } };
  const pts = k => { grow(2*k); for (let j = 0; j < k; j++){ let a = vu(), b = vu(); lx += (a & 1) ? -(a + 1)/2 : a/2; ly += (b & 1) ? -(b + 1)/2 : b/2; P[n++] = lx/2; P[n++] = ly/2; } };
  const np = vu(), pc = new Uint8Array(np), ps = new Uint32Array(np + 1);
  for (let i = 0; i < np; i++){ pc[i] = vu(); const k = vu(); ps[i] = n >> 1; pts(k); }
  ps[np] = n >> 1;
  const nl = vu(), lc = new Uint8Array(nl), lw = new Float32Array(nl), ls = new Uint32Array(nl + 1);
  for (let i = 0; i < nl; i++){ lc[i] = vu(); lw[i] = vu()/4; const k = vu(); ls[i] = n >> 1; pts(k); }
  ls[nl] = n >> 1;
  D.cls = cls; D.P = P.subarray(0, n); D.pc = pc; D.ps = ps; D.lc = lc; D.lw = lw; D.ls = ls;
  D.pbb = bbs(ps, np); D.lbb = bbs(ls, nl);
}
function bbs(S, m){ const B = new Float32Array(m*4), P = D.P;
  for (let i = 0; i < m; i++){ let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let q = S[i]*2; q < S[i + 1]*2; q += 2){ const x = P[q], y = P[q + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    B[i*4] = x0; B[i*4 + 1] = y0; B[i*4 + 2] = x1; B[i*4 + 3] = y1; }
  return B; }
// grid index (CSR) of items by bounding box; lists stay in item (= drawing) order
function index(B, m, cs){
  const H = HALF, G = Math.ceil(2*H/cs), cl = v => Math.min(G - 1, Math.max(0, Math.floor((v + H)/cs))), C = new Uint32Array(G*G + 1);
  for (let pass = 0; pass < 2; pass++){
    var I = pass ? new Uint32Array(C[G*G]) : null, F = pass ? C.slice(0, G*G) : null;
    for (let i = 0; i < m; i++){ const b = i*4, i0 = cl(B[b]), i1 = cl(B[b + 2]), j0 = cl(B[b + 1]), j1 = cl(B[b + 3]);
      for (let j = j0; j <= j1; j++) for (let k = i0; k <= i1; k++){ if (pass) I[F[j*G + k]++] = i; else C[j*G + k + 1]++; } }
    if (!pass) for (let c = 0; c < G*G; c++) C[c + 1] += C[c];
  }
  return {G, cs, C, I, stamp:new Uint32Array(m), gen:0};
}
function query(X, B, x0, y0, x1, y1){
  const H = HALF, cl = v => Math.min(X.G - 1, Math.max(0, Math.floor((v + H)/X.cs))), out = [], g = ++X.gen;
  for (let j = cl(y0); j <= cl(y1); j++) for (let k = cl(x0); k <= cl(x1); k++){ const c = j*X.G + k;
    for (let q = X.C[c]; q < X.C[c + 1]; q++){ const i = X.I[q]; if (X.stamp[i] === g) continue; X.stamp[i] = g; const b = i*4;
      if (B[b] > x1 || B[b + 2] < x0 || B[b + 1] > y1 || B[b + 3] < y0) continue; out.push(i); } }
  return out.sort((a, b) => a - b);
}
// the sea of the water mesh (big map coast): triangles by a 1 km grid
function seaPrep(){
  const W = SGR.water; if (!W || !W.sea) return;
  // the sea and the water bodies with a level (reservoirs such as Marina Bay are bodies, not sea): one triangle set
  const Ms = [W.sea].concat((W.bodies || []).map(b => b.m)); let nv = 0, ni = 0; for (const M of Ms){ nv += M.V.length; ni += M.I.length; }
  const V = new Int32Array(nv), I = new Uint32Array(ni); let ov = 0, oi = 0;
  for (const M of Ms){ V.set(M.V, ov); for (let q = 0; q < M.I.length; q++) I[oi + q] = M.I[q] + ov/2; ov += M.V.length; oi += M.I.length; }
  const m = I.length/3, B = new Float32Array(m*4);
  for (let t = 0; t < m; t++){ let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let e = 0; e < 3; e++){ const v = I[t*3 + e]*2, x = V[v]/4, y = V[v + 1]/4; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    B[t*4] = x0; B[t*4 + 1] = y0; B[t*4 + 2] = x1; B[t*4 + 3] = y1; }
  D.sea = {V, I, B, X:index(B, m, 1000)};
  // its colour: the old texture under a sample of sea triangles (the median), so the big map keeps the city's sea tone
  try { const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d'); c.drawImage(SGR.img, 0, 0, S, S);
    const d = c.getImageData(0, 0, S, S).data, R = [], Gc = [], Bc = []; let s = 7;
    for (let k = 0; k < 600 && m; k++){ s = (s*1103515245 + 12345) % 2147483648; const t = s % m, x = (B[t*4] + B[t*4 + 2])/2, y = (B[t*4 + 1] + B[t*4 + 3])/2;
      const px = Math.floor((x + HALF)/(2*HALF)*S), py = Math.floor((HALF - y)/(2*HALF)*S); if (px < 0 || py < 0 || px >= S || py >= S) continue; const o = (py*S + px)*4; R.push(d[o]); Gc.push(d[o + 1]); Bc.push(d[o + 2]); }
    const med = A => A.sort((a, b) => a - b)[A.length >> 1];
    if (R.length > 20) D.seaCol = `rgb(${med(R)},${med(Gc)},${med(Bc)})`; } catch (e){}
}

/* ---------- drawing a world square ---------- */
function paint(c, x0, y1, wm, dx, dy, dpx, opt){
  opt = opt || {};
  const k = dpx/wm, x1 = x0 + wm, y0 = y1 - wm, P = D.P, tol = 0.45;
  c.save(); c.beginPath(); c.rect(dx, dy, dpx, dpx); c.clip(); c.lineCap = 'round'; c.lineJoin = 'round';
  // the old texture: smooth things (sea depth, hills, roof grain)
  const img = SGR.baseCv || SGR.img;
  if (img && opt.base !== false){ const H = HALF, ipm = (img.width || 4096)/(2*H);
    const ax = Math.max(-H, x0), bx = Math.min(H, x1), ay = Math.min(H, y1), by = Math.max(-H, y0);
    if (bx > ax && ay > by){ c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
      c.drawImage(img, (ax + H)*ipm, (H - ay)*ipm, (bx - ax)*ipm, (ay - by)*ipm, dx + (ax - x0)*k, dy + (y1 - ay)*k, (bx - ax)*k, (ay - by)*k); } }
  if (opt.pre){ c.fillStyle = `rgba(238,235,228,${opt.pre})`; c.fillRect(dx, dy, dpx, dpx); }
  const path = (S, i, close) => { let lx = 1e9, ly = 1e9; const a = S[i]*2, b = S[i + 1]*2;
    for (let q = a; q < b; q += 2){ const sx = dx + (P[q] - x0)*k, sy = dy + (y1 - P[q + 1])*k;
      if (q > a && q < b - 2 && Math.abs(sx - lx) + Math.abs(sy - ly) < tol) continue;
      if (q === a) c.moveTo(sx, sy); else c.lineTo(sx, sy); lx = sx; ly = sy; }
    if (close) c.closePath(); };
  // land cover: in file order, consecutive polygons of one colour in one path (pieces of a cut polygon join without a seam);
  // the land itself (flag 2) first, then the sea (big map), then the rest
  const ids = D.ix ? query(D.ix, D.pbb, x0, y0, x1, y1) : [];
  const polys = land => { const B = D.pbb; let cur = -1, any = false;
    for (const i of ids){ const C = D.cls[D.pc[i]]; if (C.land !== land || (!opt.map && C.map)) continue;
      const b = i*4; if ((B[b + 2] - B[b])*k < 0.5 && (B[b + 3] - B[b + 1])*k < 0.5) continue;
      if (D.pc[i] !== cur){ if (any){ c.fillStyle = D.cls[cur].fill; c.fill(); } c.beginPath(); cur = D.pc[i]; any = false; }
      path(D.ps, i, true); any = true; }
    if (any){ c.fillStyle = D.cls[cur].fill; c.fill(); } };
  polys(true);
  // the sea (big map): one path of triangles, so no seams
  if (opt.sea && D.sea){ const S = D.sea, V = S.V, I = S.I, ids = query(S.X, S.B, x0, y0, x1, y1);
    if (ids.length){ c.fillStyle = D.seaCol; c.beginPath();
      for (const t of ids){ for (let e = 0; e < 3; e++){ const v = I[t*3 + e]*2, sx = dx + (V[v]/4 - x0)*k, sy = dy + (y1 - V[v + 1]/4)*k; if (e) c.lineTo(sx, sy); else c.moveTo(sx, sy); } c.closePath(); }
      c.fill(); } }
  if (D.ix){ polys(false);
    // waterways: casings, then the water
    const L = query(D.lix, D.lbb, x0 - 20, y0 - 20, x1 + 20, y1 + 20);
    if (L.length){ for (const pass of [0, 1]) for (const i of L){ const C = D.cls[D.lc[i]]; if (!pass && !C.cas) continue;
        c.strokeStyle = pass ? C.fill : C.cas; c.lineWidth = Math.max(pass ? 0.8 : 1.3, (D.lw[i] + (pass ? 0 : C.cw))*k); c.beginPath(); path(D.ls, i, false); c.stroke(); } }
  }
  // the ground painted by the campus sites (as on the old texture, crisp)
  if (opt.ops !== false) for (const op of D.ops){ const b = op.bb; if (b[0] > x1 + 10 || b[2] < x0 - 10 || b[1] > y1 + 10 || b[3] < y0 - 10) continue;
    c.beginPath(); op.P.forEach((p, q) => { const sx = dx + (p[0] - x0)*k, sy = dy + (y1 - p[1])*k; if (q) c.lineTo(sx, sy); else c.moveTo(sx, sy); });
    if (op.t === 'p'){ c.closePath(); c.fillStyle = op.col; c.fill(); } else { c.strokeStyle = op.col; c.lineWidth = Math.max(0.7, op.w*k); c.stroke(); } }
  // building footprints (big map, zoomed in): the city's building data, one path (outer rings CCW, courtyards CW: non-zero)
  if (opt.bld){ const L = bldLists(x0 - 60, y0 - 60, x1 + 60, y1 + 60); let n = 0;
    c.beginPath();
    for (const list of L) for (const Bd of list){ if (Bd.cx < x0 - 150 || Bd.cx > x1 + 150 || Bd.cy < y0 - 150 || Bd.cy > y1 + 150 || Bd.area*k*k < 0.6) continue;
      for (const R of Bd.rings){ for (let q = 0; q < R.length; q += 2){ const sx = dx + (R[q] - x0)*k, sy = dy + (y1 - R[q + 1])*k; if (q) c.lineTo(sx, sy); else c.moveTo(sx, sy); } c.closePath(); } n++; }
    if (n){ c.fillStyle = 'rgb(206,198,187)'; c.fill(); c.strokeStyle = 'rgba(120,110,96,0.45)'; c.lineWidth = Math.min(1, 0.35 + k*0.3); c.stroke(); } }
  // the zone / district overlay of the brush tools (25 m cells, smooth)
  if (opt.ov && D.ovUsed && SGR.ovCv){ const cs = 2*HALF/SGR.ovCv.width, H = HALF;
    const ax = Math.max(-H, x0), bx = Math.min(H, x1), ay = Math.min(H, y1), by = Math.max(-H, y0);
    if (bx > ax && ay > by){ c.imageSmoothingEnabled = true; c.drawImage(SGR.ovCv, (ax + H)/cs, (H - ay)/cs, (bx - ax)/cs, (ay - by)/cs, dx + (ax - x0)*k, dy + (y1 - ay)*k, (bx - ax)*k, (ay - by)*k); } }
  c.restore();
}

// the building lists of the 2 km building tiles over a rectangle; the small buildings of a tile whose part file is loaded are decoded
// for the map but not left in the building store (the 3D drops them far from the camera to save memory): a small cache of 6 tiles
const BLC = new Map();
function bldLists(x0, y0, x1, y1){
  const B = SGR.bldData; if (!B) return [];
  const T = B.TILE, TX = B.TX, H0 = T*TX/2, out = [], cl = v => Math.max(0, Math.min(TX - 1, Math.floor((v + H0)/T)));
  for (let j = cl(y0); j <= cl(y1); j++) for (let i = cl(x0); i <= cl(x1); i++){ const ti = j*TX + i;
    if (B.v !== 2){ const L = B.tiles.get(ti); if (L) out.push(L); continue; }
    const e = B.idx.get(ti); if (!e) continue;
    const b = B.big(ti); if (b && b.length) out.push(b);
    let sm = e.small;
    if (!sm){ sm = BLC.get(ti); if (sm){ BLC.delete(ti); BLC.set(ti, sm); }
      else if (!e.nS || B.hasPart(e.part)){ try { sm = B.small(ti); if (sm){ B.dropSmall(ti); BLC.set(ti, sm); if (BLC.size > 6) BLC.delete(BLC.keys().next().value); } } catch (err){ sm = null; } } }
    if (sm && sm.length) out.push(sm);
  }
  return out;
}

/* ---------- the 3D detail textures (clipmap levels) ---------- */
function mkLevel(name, n, tp, T){
  const S = n*tp, tex = new THREE.DataTexture(new Uint8Array(S*S*4), S, S, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true;
  tex.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy()); tex.needsUpdate = true;
  try { if (typeof terrTex !== 'undefined' && terrTex.encoding !== undefined) tex.encoding = terrTex.encoding; } catch (e){}
  renderer.initTexture(tex); tex.image = {data:null, width:S, height:S};        // the pixels live on the GPU only
  const md = new Uint8Array(n*n*4), mask = new THREE.DataTexture(md, n, n, THREE.RGBAFormat);
  mask.magFilter = mask.minFilter = THREE.NearestFilter; mask.generateMipmaps = false; mask.needsUpdate = true;
  const cv = document.createElement('canvas'); cv.width = cv.height = tp;
  return {name, n, tp, T, S, tex, mask, md, cv, ctx:cv.getContext('2d', {alpha:false}), src:new THREE.Texture(cv), slot:new Float64Array(n*n).fill(-1), dirty:new Uint8Array(n*n),
    ox:null, oy:null, A:new THREE.Vector4(T, n, 0, 0), ready:0, made:0};
}
const kOf = (tx, ty) => (ty + 16384)*32768 + (tx + 16384);
function levelTick(L, fx, fy, t0, budget){
  const n = L.n, ox = Math.round(fx/L.T - n/2), oy = Math.round(-fy/L.T - n/2);
  L.ox = ox; L.oy = oy; L.A.set(L.T, n, ox, oy);
  // the tiles of the window whose slot holds another tile (or is dirty), nearest the focus first
  const want = [], cx = fx/L.T, cy = -fy/L.T; let ready = 0;
  for (let ty = oy; ty < oy + n; ty++) for (let tx = ox; tx < ox + n; tx++){
    const s = (((ty % n) + n) % n)*n + (((tx % n) + n) % n);
    if (L.slot[s] === kOf(tx, ty) && !L.dirty[s]){ ready++; continue; }
    want.push([(tx + 0.5 - cx)**2 + (ty + 0.5 - cy)**2, tx, ty, s]);
  }
  L.ready = ready;
  if (!want.length) return 0;
  want.sort((a, b) => a[0] - b[0]);
  let made = 0, maskCh = false;
  for (const [, tx, ty, s] of want){
    if (made && performance.now() - t0 > budget) break;
    const a = performance.now();
    paint(L.ctx, tx*L.T, -ty*L.T, L.T, 0, 0, L.tp, {ov:true});
    L.tex.generateMipmaps = false;           // one mipmap pass after the batch (genMips)
    renderer.copyTextureToTexture(new THREE.Vector2((s % n)*L.tp, Math.floor(s/n)*L.tp), L.src, L.tex);
    L.tex.generateMipmaps = true; D.uploads++;
    L.slot[s] = kOf(tx, ty); L.dirty[s] = 0;
    const m = s*4; L.md[m] = ((tx % 256) + 256) % 256; L.md[m + 1] = ((ty % 256) + 256) % 256; L.md[m + 3] = 255; maskCh = true;
    const dt = performance.now() - a; D.tiles++; L.made++; D.tileMs = D.tileMs*0.9 + dt*0.1; D.tileMax = Math.max(D.tileMax*0.995, dt); made++;
  }
  if (made) genMips(L.tex);
  if (maskCh) L.mask.needsUpdate = true;
  return made;
}
function genMips(tex){
  const gl = renderer.getContext(), p = renderer.properties.get(tex); if (!p || !p.__webglTexture) return;
  renderer.state.activeTexture(gl.TEXTURE0); renderer.state.bindTexture(gl.TEXTURE_2D, p.__webglTexture); gl.generateMipmap(gl.TEXTURE_2D); renderer.state.unbindTexture();
}
function focus(){
  const p = camera.position, v = new THREE.Vector3(); camera.getWorldDirection(v);
  let g = 0; try { g = hAt(p.x, -p.z) || 0; } catch (e){}
  const h = Math.max(2, p.y - Math.max(0, g)), hl = Math.hypot(v.x, v.z);
  if (hl < 1e-3) return [p.x, -p.z, Infinity];
  const dist = v.y < -0.01 ? h*hl/(-v.y) : Infinity;
  return [p.x, -p.z, dist, v.x/hl, -v.z/hl];
}
function cfg(){
  const small = Math.min(innerWidth, innerHeight) < 700 || (navigator.deviceMemory && navigator.deviceMemory <= 4);
  return small ? [['L1', 8, 128, 192], ['L2', 8, 128, 768]] : [['L1', 16, 128, 128], ['L2', 16, 128, 512]];
}
function frame(){
  if (D.st !== 'ready' || !D.on || !SGR.on || !window.SGGround || !SGGround.U || !SGGround.U.gdDetA1) { if (window.SGGround && SGGround.U && SGGround.U.gdDetOn) SGGround.U.gdDetOn.value = 0; return; }
  const t0 = performance.now(), U = SGGround.U;
  if (!D.L.length){ try { for (const c of cfg()) D.L.push(mkLevel(...c)); } catch (e){ D.err = 'levels: ' + e.message; D.st = 'error'; console.warn('SGDetail', e); return; }
    U.gdDet1.value = D.L[0].tex; U.gdDetM1.value = D.L[0].mask; U.gdDetA1.value = D.L[0].A; U.gdDet2.value = D.L[1].tex; U.gdDetM2.value = D.L[1].mask; U.gdDetA2.value = D.L[1].A; }
  U.gdDetOn.value = 1;
  const [cx, cy, dist, ux, uy] = focus();
  let made = 0;
  for (const L of D.L){ const win = L.n*L.T, reach = ux === undefined ? 0 : Math.min(dist*0.55, win*0.3);
    made += levelTick(L, cx + (ux || 0)*reach, cy + (uy || 0)*reach, t0, made ? 1.5 : 3); if (performance.now() - t0 > 3.5) break; }
  D.ms = D.ms*0.95 + (performance.now() - t0)*0.05;
}
HOOKS.frame.push(frame);

/* ---------- hooks into the city: what the old texture gets, the detail gets too ---------- */
function markDirty(bb){
  if (!D.L.length) return;
  let x0 = -1e9, y0 = -1e9, x1 = 1e9, y1 = 1e9;
  if (bb){ const cs = 2*HALF/N; x0 = -HALF + (bb[0] - 1)*cs; x1 = -HALF + (bb[2] + 2)*cs; y0 = -HALF + (bb[1] - 1)*cs; y1 = -HALF + (bb[3] + 2)*cs; }
  for (const L of D.L){ const n = L.n; for (let s = 0; s < n*n; s++){ const key = L.slot[s]; if (key < 0) continue;
    const tx = (key % 32768) - 16384, ty = Math.floor(key/32768) - 16384, wx0 = tx*L.T, wy1 = -ty*L.T;
    if (wx0 > x1 || wx0 + L.T < x0 || wy1 < y0 || wy1 - L.T > y1) continue; L.dirty[s] = 1; } }
}
function wrap(){
  if (typeof sgrDrawTex !== 'function' || wrap.done) return; wrap.done = true;
  const oInit = sgrGroundInit, oPoly = sgrPaintPoly, oLine = sgrPaintLine, oDraw = sgrDrawTex;
  sgrGroundInit = function(){ D.ops.length = 0; return oInit.apply(this, arguments); };
  const bbOf = P => { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const p of P){ if (p[0] < a) a = p[0]; if (p[0] > c) c = p[0]; if (p[1] < b) b = p[1]; if (p[1] > d) d = p[1]; } return [a, b, c, d]; };
  sgrPaintPoly = function(P, rgb){ D.ops.push({t:'p', P:P.map(p => [p[0], p[1]]), col:`rgb(${rgb[0]},${rgb[1]},${rgb[2]})`, bb:bbOf(P)}); return oPoly.apply(this, arguments); };
  sgrPaintLine = function(P, w, rgb){ D.ops.push({t:'l', P:P.map(p => [p[0], p[1]]), w, col:`rgb(${rgb[0]},${rgb[1]},${rgb[2]})`, bb:bbOf(P)}); return oLine.apply(this, arguments); };
  sgrDrawTex = function(bb){
    const r = oDraw.apply(this, arguments);
    // keep the overlay canvas equal to the overlay pixels of the region (the original only copies regions that have some)
    try { const i0 = bb ? Math.max(0, bb[0] - 1) : 0, j0 = bb ? Math.max(0, bb[1] - 1) : 0, i1 = bb ? Math.min(N-1, bb[2] + 1) : N-1, j1 = bb ? Math.min(N-1, bb[3] + 1) : N-1;
      if (SGR.ovCv && SGR.ovImg){ SGR.ovCv.getContext('2d').putImageData(SGR.ovImg, 0, 0, i0, N-1-j1, i1 - i0 + 1, j1 - j0 + 1);
        if (!D.ovUsed){ const A = SGR.ovImg.data; for (let j = j0; j <= j1 && !D.ovUsed; j++) for (let i = i0; i <= i1; i++) if (A[((N-1-j)*N + i)*4 + 3]){ D.ovUsed = true; break; } } } } catch (e){}
    markDirty(bb); return r;
  };
}
wrap();

/* ---------- loading ---------- */
async function load(){
  if (D.st !== 'idle') return; D.st = 'loading';
  try {
    const name = SGR_PATH.replace(/data\/$/, '') + '_cover.txt', t0 = performance.now();
    const buf = await sgrFetch(name);
    decode(buf);
    D.ix = index(D.pbb, D.pc.length, GS); D.lix = index(D.lbb, D.lc.length, GS);
    seaPrep();
    D.loadMs = Math.round(performance.now() - t0); D.st = 'ready'; D.gen++;
  } catch (e){ D.err = e.message; D.st = 'error'; console.warn('SGDetail: no sharp ground', e); }
}
// after the city has loaded and settled (the cover is not needed for the first frames)
let waitT = 0;
HOOKS.frame.push(function(t){ if (D.st !== 'idle' || !SGR.on || !SGR.base || !SGR.baseCv || !SGR.water) return; if (!waitT) waitT = performance.now(); if (performance.now() - waitT > 1500) load(); });

return {
  get on(){ return D.on; }, set on(v){ D.on = !!v; if (window.SGGround && SGGround.U && SGGround.U.gdDetOn) SGGround.U.gdDetOn.value = 0; },
  get ready(){ return D.st === 'ready'; }, get gen(){ return D.gen; }, get speckle(){ return !!D.speckle; }, paint, load,
  dirty:markDirty,
  stats:() => ({st:D.st, err:D.err, loadMs:D.loadMs, polys:D.pc ? D.pc.length : 0, lines:D.lc ? D.lc.length : 0, verts:D.P ? D.P.length/2 : 0, seaTris:D.sea ? D.sea.I.length/3 : 0, seaCol:D.seaCol,
    ops:D.ops.length, ovUsed:D.ovUsed, ms:+D.ms.toFixed(3), tiles:D.tiles, tileMs:+D.tileMs.toFixed(2), tileMax:+D.tileMax.toFixed(1), uploads:D.uploads,
    levels:D.L.map(L => ({name:L.name, n:L.n, T:L.T, px:L.S, ready:L.ready, of:L.n*L.n, ox:L.ox, oy:L.oy}))}),
  _D:D
};
})();
window.SGDetail = SGDetail;
