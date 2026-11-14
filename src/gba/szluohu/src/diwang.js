
// ================= Shun Hing Square / Diwang Tower (K.Y. Cheung Design Associates, 1996) =================
// 384 m to the tips, roof 325 m, top floor (observation deck) 298 m, 69 floors (Wikipedia / CTBUH). A rectangular slab
// (height : width 1 : 8, CTBUH) with a drum at the middle of each short end and twin spires on top: "circular, semi-circular and
// rectangular shapes", "the twin towers on the top" (sz.gov.cn), "a pair of syringes" (CTBUH). Green glass with earthen browns,
// "simple horizontal and vertical patterns" from afar (CTBUH). Volumes from the OSM parts of w64601041: slab 0-302 m, the two
// drums (r 12 m) 0-310 m, the two inner drums (r 4.2 m) to 325 m; the spires from 325 m to 384 m.
// Local frame: u along the slab (NNW -> SSE), v across it; centre between the drum centres.
const DW = {c:[-0.05, 0.1], u:[0.3283, 0.9446], S:23.7, T:19.5, R:12.05, r2:4.2};
const dwP = (s, t) => [DW.c[0] + DW.u[0]*s - DW.u[1]*t, DW.c[1] + DW.u[1]*s + DW.u[0]*t];
LANDMARKS.szdiwang = {zh:'地王大厦', en:'Shun Hing Square (Diwang Tower)', cat:'new', r:42, h:384, lt:{m:1, c:'#e2f2e8', k:0.75, anim:'cycle', c2:'#a8ffd8'},
  build(){
    const g = new THREE.Group(), B = Bt(), {S, T, R, r2, u} = DW, ux = u[0], uz = u[1], vx = -uz, vz = ux;
    const GL = {c:'#5d8f88', m:1, fh:4.32, cw:4.4}, GLD = {c:'#5a8b86', m:1, fh:4.32, cw:3.2}, FR = '#9c8b74', FR2 = '#b3a48c',
      TOPC = {c:'#c7bfae', m:0, lc:'#d8fff0', lk:1.1}, MAST = {c:'#d8dcd8', m:0, lc:'#eafff6', lk:1.2, glow:'#c8ffe8', gk:0.35},
      ROOF = '#8a8f8c', PLINTH = '#a59a88', LOB = {c:'#4a5a58', glow:'#ffe6c0', gk:0.55};
    const HS = 302, HD = 310, FH = 4.32;
    // slab
    const slab = [dwP(-S, -T), dwP(S, -T), dwP(S, T), dwP(-S, T)];
    ext(B, GL, slab, 6, HS, ROOF);
    ext(B, LOB, slab.map(p => p), 0, 6, null);
    // the drums at both ends, with the slab's short faces either side
    for (const sg of [-1, 1]){ const [x, z] = dwP(sg*S, 0); cylw(B, GLD, x, z, R, R, 0, HD, 28, ROOF);
      // drum crown: a lit ring, the step in to the inner drum, the inner drum to 325 m, the needle hub, the spire to 384 m
      cylw(B, TOPC, x, z, R + 0.4, R + 0.4, HD - 3.2, HD + 0.6, 28, null);
      cylw(B, TOPC, x, z, R - 1, 7.2, HD + 0.6, 315, 24, ROOF);
      cylw(B, TOPC, x, z, r2 + 1.2, r2 + 1.2, 315, 316.2, 16, null);
      cylw(B, GLD, x, z, r2, r2, 315, 323.4, 16, null);
      cylw(B, TOPC, x, z, r2 + 0.4, r2 + 0.4, 323.4, 325, 16, ROOF);
      cylw(B, MAST, x, z, 3.0, 1.5, 325, 334, 12, null);
      cylw(B, MAST, x, z, 1.5, 0.9, 334, 360, 8, null);
      cylw(B, MAST, x, z, 0.9, 0.18, 360, 384, 8, null);
      for (const y of [338, 350, 362]) cylw(B, MAST, x, z, 1.9 - (y - 338)*0.03, 1.9 - (y - 338)*0.03, y, y + 0.8, 10, MAST);
      redLight(B, x, 384, z, 0.35); redLight(B, x + 4.4, 325, z, 0.3); redLight(B, x - 4.4, 325, z, 0.3);
      // drum floor bands
      for (let y = 6 + FH; y < HD - 4; y += FH) cylw(B, FR, x, z, R + 0.25, R + 0.25, y - 0.45, y + 0.45, 28, null);
    }
    // slab facade: brown spandrel bands at every floor, stone-coloured piers every ~4.4 m, heavier piers at the slab corners
    const G = grow(slab, 0.3); for (let y = 6 + FH; y < HS - 2; y += FH) ext(B, FR, G, y - 0.5, y + 0.4, null);
    mullions(B, FR2, slab, 4.4, 0.55, 0.9, 6, HS, false);
    for (const [s, t] of [[-S, -T], [S, -T], [S, T], [-S, T]]){ const [x, z] = dwP(s, t); obox(B, FR2, x, z, ux, uz, 2.0, 2.0, 0, HS + 1.5); }
    // the top of the slab: a stepped parapet and the plant storeys set back between the drums
    ext(B, TOPC, grow(slab, 0.4), HS - 3, HS + 1.2, null);
    const pent = [dwP(-S + 9, -T + 4), dwP(S - 9, -T + 4), dwP(S - 9, T - 4), dwP(-S + 9, T - 4)];
    ext(B, TOPC, pent, HS, HS + 5.5, ROOF);
    const pent2 = [dwP(-S + 14, -T + 8), dwP(S - 14, -T + 8), dwP(S - 14, T - 8), dwP(-S + 14, T - 8)];
    ext(B, TOPC, pent2, HS + 5.5, HS + 9, ROOF);
    // base: stone plinth, entrance canopies on both long faces
    ext(B, PLINTH, grow(slab, 0.6), -3, 1.2, null);
    for (const sg of [-1, 1]){ const [x, z] = dwP(0, sg*(T + 3.5)); obox(B, FR2, x, z, ux, uz, 18, 7, 7.0, 7.8); }
    B.flush(g);
    const bp = []; for (const sg of [-1, 1]){ const [x, z] = dwP(sg*S, 0); bp.push(x, 385, z); }
    beacons(g, bp, [1, 0.18, 0.1], 12);
    return g;
  }};
SG_PLACES.push({type:'szdiwang', lat:22.545342, lon:114.105523, rot:0});

// ---- the annex: the 35-storey apartment block and the five-storey shopping podium (CTBUH / SkyscraperPage), volumes from the
// OSM parts of w239572518 (podium 0-16.1 m, the block 27.9-102.9 m with the high opening under its middle bridge, the crown
// 102.3-109.1 m). Unlabelled sub-key.
const DWB = {ring:[[-173.3, 57.5], [-173.0, 55.1], [-172.4, 54.0], [-170.4, 52.4], [-171.4, 49.5], [-144.1, 36.3], [-139.7, 30.6], [-135.8, 27.8], [-131.2, 26.1], [-122.2, 25.7], [-37.2, -15.7], [-20.0, 33.6], [-112.9, 53.4], [-118.3, 57.8], [-122.4, 59.7], [-124.8, 60.2], [-129.7, 60.3], [-136.9, 58.4], [-166.3, 64.7], [-167.2, 62.1], [-170.2, 61.8], [-171.5, 61.0], [-172.5, 59.9]],
  parts:[[12.4, 28.5, [[-171.4, 49.5], [-93.6, 11.7], [-81.3, 46.6], [-166.3, 64.7]]], [0.0, 16.1, [[-171.4, 49.5], [-37.2, -15.7], [-20.0, 33.6], [-166.3, 64.7]]], [49.6, 102.9, [[-144.1, 36.3], [-122.2, 25.7], [-112.9, 53.4], [-136.9, 58.4]]], [27.9, 102.9, [[-122.2, 25.7], [-93.6, 11.7], [-81.3, 46.6], [-112.9, 53.4]]], [27.9, 102.9, [[-171.4, 49.5], [-144.1, 36.3], [-136.9, 58.4], [-166.3, 64.7]]], [15.5, 99.8, [[-173.3, 57.5], [-173.0, 55.1], [-172.4, 54.0], [-170.4, 52.4], [-167.2, 62.1], [-170.2, 61.8], [-171.5, 61.0], [-172.5, 59.9]]], [24.8, 28.5, [[-144.1, 36.3], [-139.7, 30.6], [-135.8, 27.8], [-131.2, 26.1], [-126.9, 25.6], [-122.2, 25.7]]], [24.8, 28.5, [[-136.9, 58.4], [-112.9, 53.4], [-116.4, 56.6], [-118.3, 57.8], [-122.4, 59.7], [-124.8, 60.2], [-129.7, 60.3]]], [102.3, 109.1, [[-156.9, 47.9], [-89.0, 24.6], [-85.8, 33.9], [-153.7, 57.2]]], [46.5, 50.2, [[-141.9, 43.2], [-119.0, 35.3], [-116.1, 43.9], [-139.0, 51.8]]]]};
{ const c = centroid(DWB.ring); DWB.c = c; DWB.ll = LL(22.545342, 114.105523, c[0], c[1]); }
LANDMARKS.szdiwang_b = {zh:'地王大厦', en:'Shun Hing Square (Diwang Tower)', cat:'new', r:91, h:109, label:false, lt:{m:1, c:'#ffe6c4', k:0.6},
  build(){
    const g = new THREE.Group(), B = Bt(), [cx, cz] = DWB.c, sh = R => shift(R, -cx, -cz);
    const APT = {c:'#a9ab9e', m:1, fh:3.0, cw:2.6}, POD = {c:'#6f8f88', m:1, fh:5.2, cw:4.0}, FR = '#9c8b74', ROOF = '#8a8f8c',
      DECK = '#a7a091', POOL = {c:'#4f9fc0', glow:'#7fd4ff', gk:0.25}, TOP = {c:'#c7bfae', m:0, lk:0.7};
    for (const [y0, y1, ring] of DWB.parts){ const r = sh(ring);
      if (y1 <= 16.2) { ext(B, POD, r, -2, y1, ROOF); bands(B, FR, r, [5.4, 10.8, y1 - 0.4], 0.8, 0.2); }
      else if (y1 < 30) ext(B, POD, r, y0, y1, DECK);
      else if (y1 < 51) ext(B, APT, r, y0, y1, ROOF, ROOF);
      else if (y0 > 100) { ext(B, TOP, r, y0, y1, ROOF); }
      else { ext(B, APT, r, y0, y1, ROOF, y0 > 40 ? ROOF : null); bands(B, FR, r, [y0 + 0.4, y1 - 0.6], 1.0, 0.15); mullions(B, '#c2b8a5', r, 3.2, 0.35, 0.5, y0, y1, true); for (let y = y0 + 9; y < y1 - 3; y += 9) bands(B, '#c2b8a5', r, [y], 0.4, 0.12); }
    }
    // the pool on the deck in the opening under the bridge
    const pl = sh([[-139, 40], [-122, 33.5], [-118, 44], [-136, 50]]); ext(B, POOL, pl, 28.5, 28.7, POOL);
    redLight(B, ...(() => { const c = centroid(sh(DWB.parts[8][2])); return [c[0], 109.1, c[1]]; })(), 0.3);
    B.flush(g); return g; }};
SG_PLACES.push({type:'szdiwang_b', lat:DWB.ll[0], lon:DWB.ll[1], rot:0});
