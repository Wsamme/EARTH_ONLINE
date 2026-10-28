
// ---------------- site building kit (y absolute: stand on ctx.gy) ----------------
function gyRange(ctx, R){ let lo = 1e9, hi = -1e9; for (const p of R){ const y = ctx.gy(p[0], p[1]); lo = Math.min(lo, y); hi = Math.max(hi, y); } const c = cenP(R), yc = ctx.gy(c[0], c[1]); return [Math.min(lo, yc), Math.max(hi, yc)]; }
// window bands (dark glass strips lit at night) on every edge of R: storey fh, from y0 to y1, window ratio wr of the bay cw
function winBands(o, R, y0, y1, fh, cw, wr, off){
  off = off || 0.06;
  for (let i = 0; i < R.length; i++){ const [nx, nz, ux, uz, l] = edgeN(R, i), a = R[i]; if (l < 3) continue; const n = Math.max(1, Math.floor(l/cw)), st = l/n;
    for (let y = y0 + fh*0.35; y + fh*0.45 < y1; y += fh) for (let k = 0; k < n; k++){ const s0 = k*st + st*(1 - wr)/2, s1 = s0 + st*wr, x0 = a[0] + ux*s0 + nx*off, z0 = a[1] + uz*s0 + nz*off, x1 = a[0] + ux*s1 + nx*off, z1 = a[1] + uz*s1 + nz*off;
      q4(o, [x0, y, z0], [x1, y, z1], [x1, y + fh*0.5, z1], [x0, y + fh*0.5, z0]); } }
}
// recessed colonnade at the ground floor: piers along each edge every `st` m
function colonnade(o, R, y0, y1, st, w){ for (let i = 0; i < R.length; i++){ const [nx, nz, ux, uz, l] = edgeN(R, i), a = R[i]; if (l < st) continue; const n = Math.round(l/st);
  for (let k = 0; k <= n; k++){ const s = l*k/n, x = a[0] + ux*s, z = a[1] + uz*s; abox(o, x - w, x + w, y0, y1, z - w, z + w); } } }
function scatterTrees(ctx, P, n, size, kind){ const b = bbP(P); let k = 0, tries = 0; while (k < n && tries < n*8){ tries++; const x = lerp(b[0], b[2], ctx.rng()), z = lerp(b[1], b[3], ctx.rng()); if (pip(P, x, z)){ ctx.tree(x, z, size*(0.8 + 0.4*ctx.rng()), kind); k++; } } }

// ================= The Chinese University of Hong Kong, Shenzhen (Longgang; campus plan Wang Weijen / Rocco Yim / Frank Yu) =================
// Facts (chinese-architects.com campus planning; gooood, the library by Wang Weijen Architecture): academic programmes in one
// continuous "mega-block", pavilions (library, student centre, administration, dormitories, conference hall) along the foothills
// across a central green with a square sunken plaza; the library: two interlocking three-storey C-shaped volumes, the lower in
// stone and grey (blue) brick with recessed colonnades, the upper a slightly bent aluminium-panel box, 22 080 m2. Every building
// here stands on its OSM footprint (heights: OSM levels where mapped, else this build's estimate). The lower campus (OSM w533650675)
// is szcuhksz; the upper campus (w544063816, the newer colleges) is the unlabelled sub-key szcuhksz_upper. Materials of the other
// buildings follow the library's palette (grey brick, stone base, colonnades): an interpretation, not surveyed building by building.
function cuhkBuild(ctx, C, upper){
  const g = new THREE.Group(), B = mkB();
  const BR = {c:'#7f878d', m:1, fh:3.6, cw:3.0}, BR2 = {c:'#8c9398', m:1, fh:3.6, cw:3.0}, STN = {c:'#cfc8b8', m:0, lk:0.4}, WIN = {c:'#3b4650', glow:'#ffe3b5', gk:0.35},
    AL = {c:'#b9bfc3', m:1, fh:3.8, cw:3.0}, ROOF = '#6d7175', DORM = {c:'#d8d6cf', m:1, fh:3.0, cw:2.4}, LAMP = {c:'#f3ead6', glow:'#ffdca0', gk:1.2};
  for (const b of C.b){
    const R = b.r, [lo, hi] = gyRange(ctx, R), H = Math.max(6, b.h), top = hi + H, nm = b.n || '';
    const dorm = /书院|宿舍|公寓|明园/.test(nm), lib = /图书馆/.test(nm), tower = /钟楼/.test(nm), gym = /体育馆|运动馆/.test(nm);
    prism(B.p(STN), R, lo - 2, hi + (dorm ? 1.0 : 4.2), false);
    if (lib){ // lower three storeys stone / grey brick with a colonnade, the upper aluminium box slightly larger
      const IN = offP(R, 2.2); prism(B.p(WIN), IN, hi, hi + 4.2, false); colonnade(B.p(STN), R, hi, hi + 4.2, 4.5, 0.45);
      prism(B.p(BR), R, hi + 4.2, hi + H*0.5, false); const UP = offP(R, -1.2); prism(B.p(AL), UP, hi + H*0.5, top, true, true); }
    else if (tower){ prism(B.p(BR2), R, hi, top - 6, false); const IN = offP(R, 0.6); prism(B.p({c:'#c9c2b0', glow:'#ffe1a8', gk:0.8}), IN, top - 6, top - 0.6, false);
      prism(B.p(STN), offP(R, -0.4), top - 0.6, top, true); const c = cenP(R); LCyl(g, 0.3, 0.3, 4, c[0], top, c[1], '#8a8f94', 6); }
    else if (dorm){ prism(B.p(DORM), R, hi + 1.0, top, false); flat(B.p(ROOF), R, top); prism(B.p('#bdbab2'), offP(R, -0.3), top, top + 1.1, false); }
    else { // academic / pavilion: stone base with colonnade, grey brick body, flat roof with parapet
      if (gym){ prism(B.p(BR2), R, hi + 4.2, top, false); const f = oframe(R); hipF(B.p('#8d9397'), f, top, Math.min(5, f.W*0.12), 0.5); }
      else { prism(B.p(BR), R, hi + 4.2, top, false); flat(B.p(ROOF), R, top); prism(B.p(STN), offP(R, -0.3), top, top + 1.0, false); }
      const IN = offP(R, 2.0); if (area2(IN)*area2(R) > 0) prism(B.p(WIN), IN, hi, hi + 4.2, false); colonnade(B.p(STN), R, hi, hi + 4.2, 4.5, 0.4); }
  }
  // ground: lawns, pitches, tracks, water (paint), trees on the greens
  for (const a of C.ar){
    if (a.k === 'g'){ ctx.paint(a.r, [104, 142, 78]); scatterTrees(ctx, a.r, Math.min(40, Math.round(Math.abs(area2(a.r))/450)), 3.2, 'd'); }
    else if (a.k === 'p') ctx.paint(a.r, /basketball|tennis|volleyball/.test(a.s) ? [86, 118, 150] : [86, 138, 72]);
    else if (a.k === 't') ctx.paint(a.r, [166, 88, 64]);
    else if (a.k === 'w') ctx.paint(a.r, [143, 181, 202]);
  }
  // street lamps along the keep boundary (campus edge road)
  const K = C.keep; for (let i = 0; i < K.length; i++){ const a = K[i], b = K[(i + 1) % K.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let s = 10; s < l; s += 40){ const x = lerp(a[0], b[0], s/l), z = lerp(a[1], b[1], s/l); ctx.lamp(x, ctx.gy(x, z) + 6, z, [255, 220, 170]); } }
  B.flush(g); return g;
}
Object.assign(SITES, {
  szcuhksz:{zh:'香港中文大学（深圳）', en:'The Chinese University of Hong Kong, Shenzhen', lat:PLC.cu.lat, lon:PLC.cu.lon, r:530, keep:S.cu.keep, h:55, keepRoads:[11, 12],
    lt:{m:1, c:'#e6ecf5', k:0.55}, build(ctx){ return cuhkBuild(ctx, S.cu, false); }},
  szcuhksz_upper:{zh:'香港中文大学（深圳）上园', en:'CUHK-Shenzhen Upper Campus', lat:PLC.cuU.lat, lon:PLC.cuU.lon, r:375, keep:S.cuU.keep, h:40, keepRoads:[11, 12],
    lt:{m:1, c:'#e6ecf5', k:0.55}, build(ctx){ return cuhkBuild(ctx, S.cuU, true); }}
});

// ================= Dafen Oil Painting Village, Buji, Longgang =================
// Facts: Dafen Art Museum by Urbanus, 2007 (Wikipedia; architecturalrecord): three storeys against a hillside, the ground floor open
// to a plaza with artists' sales spaces, 8 000 m2 of galleries on level 2, studios and outdoor courts on the top level echoing the
// village grid with box skylights; the village grid is angled over the grey-painted concrete envelope as recessed alcoves left for
// artists to paint. The village itself: every OSM footprint inside the Dafen area (OSM w248181066, 228 buildings incl. the museum
// w248181064) is rebuilt at this build's height as the dense "handshake" blocks with ground-floor galleries; the paintings hung on
// the shop fronts and walls are abstract colour fields (no copies of real artworks). Museum height ~16 m is an estimate.
Object.assign(SITES, {szdafen:{zh:'大芬油画村', en:'Dafen Oil Painting Village', lat:PLC.szdafen.lat, lon:PLC.szdafen.lon, r:283, keep:S.daf.keep, h:42, keepRoads:[10, 11, 12],
  lt:{m:1, c:'#ffe6c4', k:0.6},
  build(ctx){
    const rng = () => ctx.rng();
    const g = new THREE.Group(), B = mkB(), V = vcB(), F = S.daf;
    const TILE = [{c:'#e3ddd1', m:1, fh:3.0, cw:2.4}, {c:'#d6cfc0', m:1, fh:3.0, cw:2.4}, {c:'#e8e3da', m:1, fh:3.0, cw:2.4}, {c:'#cfc2ad', m:1, fh:3.0, cw:2.4}, {c:'#d9d2c9', m:1, fh:3.0, cw:2.4}],
      SHOP = {c:'#3c3a36', glow:'#ffd9a0', gk:0.85}, ROOF = '#8b8c88', TANK = '#cfd3d4', AWN = ['#8e3b32', '#2f5d73', '#6d7b3a', '#7a5a2e'],
      MUS = {c:'#8f9294', m:0, lk:0.45}, MUS2 = {c:'#7b7f82', m:0, lk:0.4}, SKY = {c:'#cfd8dc', glow:'#fff0d0', gk:0.45};
    const pal = ['#c0392b', '#e67e22', '#f1c40f', '#27ae60', '#2980b9', '#8e44ad', '#16a085', '#d35400', '#2c3e50', '#e8d8b0', '#6a89cc', '#b33771'].map(hexRGB);
    const paint = (x0, z0, x1, z1, y0, y1, nx, nz, dense) => {   // a grid of canvases on a wall strip
      const l = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0)/l, uz = (z1 - z0)/l; let s = 0.4;
      while (s < l - 0.6){ const w = 0.6 + rng()*1.4, h = 0.6 + rng()*1.3; if (s + w > l - 0.3) break; const yb = y0 + rng()*Math.max(0.1, y1 - y0 - h);
        const c1 = pal[(rng()*pal.length) | 0], c2 = pal[(rng()*pal.length) | 0], xa = x0 + ux*s + nx*0.12, za = z0 + uz*s + nz*0.12, xb = xa + ux*w, zb = za + uz*w;
        V.q([xa, yb, za], [xb, yb, zb], [xb, yb + h*0.55, zb], [xa, yb + h*0.55, za], c1); V.q([xa, yb + h*0.55, za], [xb, yb + h*0.55, zb], [xb, yb + h, zb], [xa, yb + h, za], c2);
        s += w + (dense ? 0.25 : 0.8 + rng()*2); } };
    for (const b of F.b){
      const R = b.r, [lo, hi] = gyRange(ctx, R);
      if (b.m){ // the art museum: three grey storeys, angled grid of recessed alcoves (some painted), skylight boxes on the roof court
        const top = hi + 16; prism(B.p(MUS), R, lo - 2, top, true);
        for (let i = 0; i < R.length; i++){ const [nx, nz, ux, uz, l] = edgeN(R, i), a = R[i];
          for (let s = 2; s < l - 3; s += 4.2) for (let y = lo + 4; y < top - 3; y += 3.6){ const sk = ((s/4.2 | 0) + (y/3.6 | 0)) % 3; const x = a[0] + ux*(s + 0.4*(y - lo)/3.6 % 1.2), z = a[1] + uz*(s + 0.4*(y - lo)/3.6 % 1.2);
            if (sk === 0) V.q([x + nx*0.05, y, z + nz*0.05], [x + ux*2.6 + nx*0.05, y, z + uz*2.6 + nz*0.05], [x + ux*2.6 + nx*0.05, y + 2.2, z + uz*2.6 + nz*0.05], [x + nx*0.05, y + 2.2, z + nz*0.05], pal[(rng()*pal.length) | 0]);
            else q4(B.p(MUS2), [x + nx*0.05, y, z + nz*0.05], [x + ux*2.6 + nx*0.05, y, z + uz*2.6 + nz*0.05], [x + ux*2.6 + nx*0.05, y + 2.2, z + uz*2.6 + nz*0.05], [x + nx*0.05, y + 2.2, z + nz*0.05]); } }
        const c = cenP(R); for (let k = 0; k < 9; k++){ const x = c[0] + ((k % 3) - 1)*12, z = c[1] + (((k/3) | 0) - 1)*12; if (pip(R, x, z)) abox(B.p(SKY), x - 2.5, x + 2.5, top, top + 2.4, z - 2.5, z + 2.5); }
        const IN = offP(R, 3); if (area2(IN)*area2(R) > 0) prism(B.p(SHOP), IN, lo, lo + 4, false);
        continue; }
      const H = Math.max(4, b.h), top = hi + H, T = TILE[(rng()*TILE.length) | 0];
      prism(B.p('#8c867c'), R, lo - 2, hi, false);
      prism(B.p(SHOP), offP(R, 0.25), hi, hi + 3.6, false);          // ground-floor galleries, lit inside at night
      prism(B.p(T), R, hi + 3.6, top, false); flat(B.p(ROOF), R, top); prism(B.p('#b8b2a6'), offP(R, -0.2), top, top + 0.9, false);
      const c = cenP(R); if (H > 9 && rng() < 0.5) abox(B.p(TANK), c[0] - 1, c[0] + 1, top, top + 1.8, c[1] - 1, c[1] + 1);
      for (let i = 0; i < R.length; i++){ const [nx, nz, ux, uz, l] = edgeN(R, i), a = R[i], bq = R[(i + 1) % R.length]; if (l < 3) continue;
        // paintings stacked on the shop front, an awning above it
        paint(a[0], a[1], bq[0], bq[1], hi + 0.3, hi + 3.2, nx, nz, true);
        const ac = AWN[(rng()*AWN.length) | 0]; q4(B.p(ac), [a[0] + nx*0.2, hi + 3.5, a[1] + nz*0.2], [bq[0] + nx*0.2, hi + 3.5, bq[1] + nz*0.2], [bq[0] + nx*1.4, hi + 3.1, bq[1] + nz*1.4], [a[0] + nx*1.4, hi + 3.1, a[1] + nz*1.4]);
        // now and then a whole wall hung with canvases up the first floors
        if (rng() < 0.18 && H > 7) paint(a[0], a[1], bq[0], bq[1], hi + 3.9, Math.min(top - 0.5, hi + 9), nx, nz, false); }
    }
    V.flush(g, {m:0, lk:0.35, lc:'#ffe8c8'}); B.flush(g); return g;
  }}});

// ================= Guanlan Ancient Market (Guanlan Guxu), Longhua =================
// Facts (szlhq.gov.cn, Nov 2024): a Hakka market town of the mid / late Qing, 200+ years old; five streets (Guanlan, Xindong, Maibu,
// Dongmen, Longgangding), 213 old buildings incl. 177 shops, 12 watch towers in the core area; grey brick shophouses on a narrow
// lane, stone paving, a stone archway at the main entrance (nomadotravel). OSM maps the market area (w1284417908), its lanes and
// the old temple (w1430005827) but no single building: the shophouse rows here line the OSM lanes inside the area (positions of
// individual houses and their count are estimated); the 12 watch towers are left out because their positions are not mapped.
Object.assign(SITES, {szguanlan:{zh:'观澜古墟', en:'Guanlan Ancient Market', lat:PLC.szguanlan.lat, lon:PLC.szguanlan.lon, r:119, keep:S.gl.keep, h:14, keepRoads:[10, 11, 12],
  lt:{m:0, c:'#ffc98a', k:0.85, anim:'breathe'},
  build(ctx){
    const rng = () => ctx.rng();
    const g = new THREE.Group(), B = mkB(), GLX = S.gl, K = GLX.keep;
    const BRK = {c:'#8e8b84', m:0, lk:0.55}, BRK2 = {c:'#9b958a', m:0, lk:0.55}, PLAS = {c:'#d7d1c3', m:0, lk:0.6}, ROOF = '#55524d', COLM = '#c9c2b2', SHOP = {c:'#3b322a', glow:'#ffbf70', gk:0.7},
      LANT = {c:'#b93a2c', glow:'#ff7a3a', gk:1.6}, PAVE = [168, 160, 146];
    const occ = []; const free = (P) => { for (const Q of occ){ for (const p of P) if (pip(Q, p[0], p[1])) return false; for (const q of Q) if (pip(P, q[0], q[1])) return false; } return true; };
    const lampPts = [];
    // shophouse units along both sides of each lane: 4.8 m frontage, 11 m deep, 2 storeys, an arcade (qilou) on the street side
    for (const L of GLX.lanes){ const pts = L.p; for (let i = 0; i < pts.length - 1; i++){ const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); if (l < 5) continue;
      const ux = dx/l, uz = dz/l, nx = -uz, nz = ux, half = L.c === 12 ? 2.2 : 3.5;
      ctx.line([a, b], half*2, PAVE);
      for (const sd of [-1, 1]) for (let s = 1; s + 4.8 < l; s += 5.0){
        const o = half + 0.3, P = [[a[0] + ux*s + nx*sd*o, a[1] + uz*s + nz*sd*o], [a[0] + ux*(s + 4.8) + nx*sd*o, a[1] + uz*(s + 4.8) + nz*sd*o],
          [a[0] + ux*(s + 4.8) + nx*sd*(o + 11), a[1] + uz*(s + 4.8) + nz*sd*(o + 11)], [a[0] + ux*s + nx*sd*(o + 11), a[1] + uz*s + nz*sd*(o + 11)]];
        if (!P.every(p => pip(K, p[0], p[1])) || P.some(p => pip(GLX.temple, p[0], p[1])) || !free(P)) continue; occ.push(P);
        const [lo, hi] = gyRange(ctx, P), e = hi + 7.4 + (rng() < 0.3 ? 1.2 : 0);
        // arcade: front 2.5 m open under the upper floor, columns at the frontage corners
        const fr = (t) => [P[0][0] + (P[3][0] - P[0][0])*t, P[0][1] + (P[3][1] - P[0][1])*t], fr2 = (t) => [P[1][0] + (P[2][0] - P[1][0])*t, P[1][1] + (P[2][1] - P[1][1])*t];
        const back = [fr(2.5/11), fr2(2.5/11), P[2], P[3]];
        prism(B.p('#8a857b'), P, lo - 1.5, hi + 0.3, true);
        prism(B.p(SHOP), back, hi + 0.3, hi + 3.6, false);
        prism(B.p(rng() < 0.5 ? BRK : BRK2), P, hi + 3.6, e, false);
        for (const c of [P[0], P[1]]) abox(B.p(COLM), c[0] - 0.25, c[0] + 0.25, hi + 0.3, hi + 3.6, c[1] - 0.25, c[1] + 0.25);
        // the street front: a plastered parapet with a moulding, two windows
        const m0 = P[0], m1 = P[1]; q4(B.p(PLAS), [m0[0] + nx*sd*0.08, e - 1.6, m0[1] + nz*sd*0.08], [m1[0] + nx*sd*0.08, e - 1.6, m1[1] + nz*sd*0.08], [m1[0] + nx*sd*0.08, e + 0.9, m1[1] + nz*sd*0.08], [m0[0] + nx*sd*0.08, e + 0.9, m0[1] + nz*sd*0.08]);
        for (const t of [0.22, 0.62]){ const x = lerp(m0[0], m1[0], t) - nx*sd*0.06, z = lerp(m0[1], m1[1], t) - nz*sd*0.06; q4(B.p({c:'#2c2824', glow:'#ffb35a', gk:0.5}), [x, hi + 4.6, z], [x + ux*1.1, hi + 4.6, z + uz*1.1], [x + ux*1.1, hi + 6.2, z + uz*1.1], [x, hi + 6.2, z]); }
        // pitched tile roof falling to the back, ridge parallel to the street
        const f = oframe(P), Pp = (u, v, y) => [f.c[0] + u*f.ux - v*f.uz, y, f.c[1] + u*f.uz + v*f.ux];
        const along = Math.abs(f.ux*ux + f.uz*uz) > 0.7; const ff = along ? f : {c:f.c, ux:-f.uz, uz:f.ux, L:f.W, W:f.L};
        gableF(B.p(ROOF), B.p(BRK2), ff, e, 2.0, 0.3);
        if (rng() < 0.35){ const x = m0[0] + nx*sd*0.6 + ux*2.4, z = m0[1] + nz*sd*0.6 + uz*2.4; abox(B.p(LANT), x - 0.3, x + 0.3, hi + 2.6, hi + 3.3, z - 0.3, z + 0.3); lampPts.push(x, hi + 3.0, z); }
      } } }
    // the old temple on its OSM plot: a hall with a hip roof on a stone terrace
    const TP = GLX.temple, f = oframe(TP), [tl, th] = gyRange(ctx, TP);
    const hall = [[-f.L*0.3, -f.W*0.28], [f.L*0.3, -f.W*0.28], [f.L*0.3, f.W*0.28], [-f.L*0.3, f.W*0.28]].map(([u, v]) => [f.c[0] + u*f.ux - v*f.uz, f.c[1] + u*f.uz + v*f.ux]);
    prism(B.p('#a39d90'), offP(hall, -3), tl - 1.5, th + 1.0, true);
    prism(B.p({c:'#c9b48a', m:0, lk:0.6}), hall, th + 1.0, th + 7, false); colonnade(B.p('#8a3a2c'), hall, th + 1.0, th + 6.6, 3.6, 0.3);
    hipF(B.p('#5c5047'), oframe(hall), th + 7, 3.2, 1.4);
    ctx.paint(TP, [176, 168, 152]);
    sprites(g, lampPts, [1, 0.5, 0.22], 2.6);
    B.flush(g); return g;
  }}});
