

// ======================================================================================================
// HarbourFront Tower One (18 storeys, mapletreelogisticstrust.com) and HarbourFront Tower Two (16 storeys, the refurbished
// former Singapore cable car tower that still houses the HarbourFront station of the Mount Faber Line; wikipedia: track 69 m
// above sea level). Plans and heights = the OSM building parts of w47418847 (Tower One: slab 60 m, west strip 53.4 m, podiums
// 13.8 / 17.1 m) and w469423301 (Tower Two: side strips 53.4 m, central shaft 59 m). The glazed towers (architizer: "glazed
// facades used extensively") carry floor bands and mullions; Tower Two keeps the four round corner shafts of the old tower
// (the rounded corners of its footprint) and the glazed station box on top, with the rope pairs leaving north (Mount Faber)
// and south (Sentosa) along the straight line, two cabins on each side. Night: lit office windows, the lit station, red beacons.
// ======================================================================================================
{
const LAT = 1.2646, LON = 103.81895, RR = 112;
const TER = {X0:-2899.12, Y0:-5572.93, i0:356, j0:318, nx:6, ny:6, H:[-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,45,10,-3,-3,50,51,52,10,-3,-3,11,64,65,63,-3,-3,11,88,89,85]};
const T2W = [[-41.8,25.3],[-44.2,25.3],[-43.0,14.6],[-40.6,15.2],[-37.0,-14.4],[-36.4,-15.6],[-34.6,-16.2],[-33.4,-15.6],[-32.8,-13.8],[-38.2,37.8],[-40.6,39.5],[-42.4,38.9],[-43.0,37.2]];
const T2E = [[-17.9,33.6],[-19.1,40.1],[-20.3,41.3],[-22.1,41.3],[-23.3,38.9],[-17.9,-12.1],[-17.3,-13.8],[-15.5,-14.4],[-13.7,-12.7],[-13.7,-5.5],[-10.7,-5.5],[-12.5,9.9],[-13.7,9.3],[-14.9,21.2],[-13.1,21.2],[-14.3,34.2]];
const T2M = [[-32.8,-13.8],[-17.9,-12.1],[-23.3,38.9],[-38.2,37.8]];
const T1A = [[-0.6,10.5],[7.2,-67.2],[28.7,-64.8],[20.9,12.3],[14.9,12.3],[14.9,15.8],[4.2,14.6],[4.2,11.1]];
const T1B = [[28.1,7.5],[21.5,6.9],[28.1,-60.1],[34.6,-59.5]];
const T1C = [[0.0,5.1],[-7.2,4.5],[0.0,-62.5],[6.6,-61.9]];
const T1P1 = [[31.1,-20.4],[39.4,-19.8],[35.8,11.7],[57.9,14.0],[56.1,29.5],[-8.9,22.9],[-7.2,4.5],[0.0,5.1],[-0.6,10.5],[4.2,11.1],[4.2,14.6],[14.9,15.8],[14.9,12.3],[20.9,12.3],[21.5,6.9],[28.1,7.5]];
const T1P2 = [[41.8,-49.4],[51.3,-48.8],[50.8,-42.3],[63.3,-41.1],[57.9,14.0],[35.8,11.7],[39.4,-19.8],[31.1,-20.4],[31.6,-28.7],[39.4,-28.1]];
const T1N = [[42.4,-54.8],[64.5,-52.4],[63.3,-41.1],[50.8,-42.3],[51.3,-48.8],[41.8,-49.4]];   // north-east strip of the ring not in any part (podium height assumed)
LANDMARKS.sghftowers = {zh:'港湾大厦（缆车港湾站）', en:'HarbourFront Tower One & Two (Cable Car HarbourFront Station)', cat:'new', r:RR, h:68, lt:{m:1, c:'#e6efff', k:0.6}, build(){
  const g = new THREE.Group(), B = mkB(), {gl} = groundK(TER, LAT, LON, RR);
  const GL = {c:'#7f9cac', m:1, fh:3.3, cw:3.0, lc:'#e6efff', lk:0.55}, FR = {c:'#d3d8da', m:0, lk:0.15}, CORE = {c:'#e7e4dc', m:0, lc:'#fff3df', lk:0.4};
  const RF = '#8c8f93', BASE = {c:'#9b998f', m:0, lk:0}, STG = {c:'#a6c2cf', glow:'#d6ecff', gk:0.55, ds:true}, BEAC = {c:'#c22', glow:'#ff2a1a', gk:2};
  const CC = {rope:'#3b3d41', body:{c:'#26282c', m:0, lk:0}, win:{c:'#9aa7b0', glow:'#ffe2b0', gk:0.35}, hang:{c:'#b9bdc1', m:0, lk:0.2}};
  // ---- Tower Two: the old cable car tower, refurbished
  const g2 = minG(gl, [...T2W, ...T2E]), y2 = gl(-28, 13);
  glassBlock(B, T2W, g2 - 1.2, y2, y2 + 53.4, {gl:GL, fr:FR, rf:RF, base:BASE, fh:3.3, y1st:4.6, mull:1.6});
  glassBlock(B, T2E, g2 - 1.2, y2, y2 + 53.4, {gl:GL, fr:FR, rf:RF, base:BASE, fh:3.3, y1st:4.6, mull:1.6});
  // central shaft: solid lift / stair core faced in white panels with narrow glazed slots, up to the station floor at 59 m
  { const w = B.p(CORE); wallP(w, T2M, g2 - 1.2, y2 + 59); flatPoly(B.p(RF), T2M, y2 + 59);
    edgeFins(B.p(GL), T2M, y2 + 4, y2 + 58, 4.2, 0.9, 0.08); }
  // the four round corner shafts of the old tower
  for (const [x, z] of [[-34.9,-14.6],[-15.6,-12.7],[-21.0,39.9],[-40.9,38.3]]){ const c = B.p(CORE);
    const n = 12, r = 2.0; for (let i = 0; i < n; i++){ const a0 = i/n*TAU, a1 = (i+1)/n*TAU; quadP(c, [x + Math.cos(a0)*r, g2 - 1.2, z + Math.sin(a0)*r], [x + Math.cos(a1)*r, g2 - 1.2, z + Math.sin(a1)*r], [x + Math.cos(a1)*r, y2 + 59.6, z + Math.sin(a1)*r], [x + Math.cos(a0)*r, y2 + 59.6, z + Math.sin(a0)*r]); } }
  // station box on the roof: a glazed hall over the shaft, open at both ends where the ropes enter; roof slab and plant
  const ax = [(-23.3 + -38.2)/2 - (-32.8 + -17.9)/2, 38.35 - (-12.95)], L = Math.hypot(ax[0], ax[1]), d = [ax[0]/L, ax[1]/L];
  const sc = [(-32.8 - 17.9 - 23.3 - 38.2)/4, (-13.8 - 12.1 + 38.9 + 37.8)/4];
  const SB = rectR(sc, d, 27.5, 10.2), y5 = y2 + 59.6, y6 = y2 + 68;
  { const st = B.p(STG), fr = B.p(FR);
    for (let i = 0; i < 4; i++){ const a = SB[i], b = SB[(i+1) % 4]; if (i % 2 === 1) continue;     // long sides glazed; ends open
      quadP(st, [a[0], y5, a[1]], [b[0], y5, b[1]], [b[0], y6 - 1.2, b[1]], [a[0], y6 - 1.2, a[1]]); }
    flatPoly(B.p(RF), SB, y5); flatPoly(B.p(FR), SB, y6);
    edgeBands(fr, SB, y6 - 1.2, y6, 0.05); edgeBands(fr, SB, y5, y5 + 1.0, 0.06);
    edgeFins(fr, SB, y5, y6, 3.0, 0.22, 0.3);
    // gable frames over the two open ends
    for (const s of [-1, 1]){ const a = SB[s < 0 ? 0 : 2], b = SB[s < 0 ? 3 : 1]; barP(fr, a, b, 0.5, 1.4, y6 - 1.4); }
    // plant box and the bull-wheel housing (the line's drive is at Mount Faber; HarbourFront is an intermediate station)
    boxP(B.p(CORE), 10, 2.6, 18, sc[0], y6, sc[1], Math.atan2(-d[1], d[0]) + HP);
    for (const s of [-1, 1]) boxP(B.p(BEAC), 0.4, 0.5, 0.4, sc[0] + d[0]*s*24, y6 + 0.2, sc[1] + d[1]*s*24, 0); }
  // rope pairs: north to Seah Im Road tower (80 m asl, rope rising), south to the Sentosa tower (88 m asl)
  { const yc = y2 + 64, nN = dirTo(STN.hf, STN.faber), nS = dirTo(STN.hf, STN.sentosa);
    const aN = [sc[0] - d[0]*27.5, yc, sc[1] - d[1]*27.5], aS = [sc[0] + d[0]*27.5, yc, sc[1] + d[1]*27.5];
    // ropes inside the hall (deck to deck), then out
    cableStub(B, [sc[0] - d[0]*27.5, yc, sc[1] - d[1]*27.5], d, 55, 0, 5.6, CC, [[0.3, -1], [0.62, 1]]);
    cableStub(B, aN, nN, 60, 0.0275, 5.6, CC, [[0.55, 1]]);
    cableStub(B, aS, nS, 60, 0.038, 5.6, CC, [[0.45, -1]]);
    // the station platforms inside
    for (const s of [-1, 1]){ const p = rectR([sc[0] + s*(-d[1])*4.8, sc[1] + s*d[0]*4.8], d, 26, 1.6); flatPoly(B.p(FR), p, yc - 4.7); } }
  // ---- Tower One: the 18-storey slab, its lower west strip and the podiums
  const g1 = minG(gl, [...T1A, ...T1P1, ...T1P2]), y1 = gl(22, -20);
  glassBlock(B, T1A, g1 - 1.2, y1, y1 + 60, {gl:GL, fr:FR, rf:RF, base:BASE, fh:3.25, y1st:4.5, mull:1.5});
  glassBlock(B, T1B, g1 - 1.2, y1, y1 + 60, {gl:GL, fr:FR, rf:RF, base:BASE, fh:3.25, y1st:4.5});
  glassBlock(B, T1C, g1 - 1.2, y1, y1 + 53.4, {gl:GL, fr:FR, rf:RF, base:BASE, fh:3.25, y1st:4.5, mull:1.5});
  glassBlock(B, T1P1, g1 - 1.2, y1, y1 + 13.8, {gl:GL, fr:FR, rf:RF, base:BASE, fh:4.5, mull:3.0, par:0.9});
  glassBlock(B, T1P2, g1 - 1.2, y1, y1 + 17.1, {gl:GL, fr:FR, rf:RF, base:BASE, fh:4.2, mull:3.0, par:0.9});
  glassBlock(B, T1N, g1 - 1.2, y1, y1 + 13.8, {gl:GL, fr:FR, rf:RF, base:BASE, fh:4.5, par:0.9});
  // roof plant and the white frame of the roof crown on the slab
  { const ax1 = [7.2 - (-0.6), -67.2 - 10.5], L1 = Math.hypot(ax1[0], ax1[1]), d1 = [ax1[0]/L1, ax1[1]/L1], c1 = [(7.2 + 28.7 + 20.9 - 0.6)/4, (-67.2 - 64.8 + 12.3 + 10.5)/4];
    const PL = rectR(c1, d1, 26, 7); prismP(B.p(CORE), B.p(RF), PL, y1 + 60, y1 + 64.5);
    const CR = rectR(c1, d1, 38.5, 10.4); edgeBands(B.p(FR), CR, y1 + 60.2, y1 + 62.4, 0.15);
    boxP(B.p(BEAC), 0.4, 0.5, 0.4, c1[0], y1 + 64.5, c1[1], 0); }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'sghftowers', lat:1.2646, lon:103.81895, rot:0});
}

// ======================================================================================================
// Keppel Bay Tower (keppel.com: 18 storeys, T.O.P. 2002; keppelreit: 18-storey office tower with a six-storey podium), the
// twin of HarbourFront Tower One (mapletree.com.sg: Keppel–PSA "HarbourFront twin office towers", 18 storeys each). Plan and
// heights = the OSM building parts of w47418846: the 60 m slab, its two 53.4 m side strips, the podium blocks of 13.8 / 17.1 /
// 7.2 m. Full-height glass (keppel.com). Night: lit office windows, lit crown frame, red beacon.
// ======================================================================================================
{
const LAT = 1.264828, LON = 103.818253, RR = 60;
const TER = {X0:-2976.69, Y0:-5547.72, i0:355, j0:319, nx:6, ny:5, H:[-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,45,-3,-3,-3,50,51,52,-3,-3,-3,11,64,65,-3,-3,-3,11,88,89]};
const KT = [[-3.0,19.7],[3.5,-46.1],[24.4,-43.8],[17.9,21.5],[13.1,20.9],[12.5,25.6],[1.2,24.4],[1.8,20.3]];
const KE = [[18.5,16.1],[23.8,-37.8],[31.6,-36.7],[26.2,17.3]];
const KW = [[-2.4,14.3],[-10.2,13.7],[-4.8,-40.8],[2.9,-40.2]];
const KP1 = [[-3.0,19.7],[1.8,20.3],[1.2,24.4],[12.5,25.6],[13.1,20.9],[17.9,21.5],[18.5,16.1],[26.2,17.3],[31.6,-36.7],[38.8,-36.1],[30.4,41.6],[-4.8,38.1]];
const KP2 = [[-17.9,0.1],[-28.1,-1.1],[-23.3,-43.2],[-13.8,-42.0]];
const KP3 = [[-19.7,12.6],[-13.8,-42.0],[-4.8,-40.8],[-10.2,13.7]];
const KP4 = [[-19.7,12.6],[-2.4,14.3],[-4.8,38.1],[-45.4,33.9],[-41.8,-2.3],[-17.9,0.1]];
LANDMARKS.sgkeppelbaytower = {zh:'吉宝湾大厦', en:'Keppel Bay Tower', cat:'new', r:RR, h:65, lt:{m:1, c:'#e6efff', k:0.6}, build(){
  const g = new THREE.Group(), B = mkB(), {gl} = groundK(TER, LAT, LON, RR);
  const GL = {c:'#7f9cac', m:1, fh:3.3, cw:3.0, lc:'#e6efff', lk:0.55}, FR = {c:'#d3d8da', m:0, lk:0.15}, CORE = {c:'#e7e4dc', m:0, lc:'#fff3df', lk:0.4};
  const RF = '#8c8f93', BASE = {c:'#9b998f', m:0, lk:0}, BEAC = {c:'#c22', glow:'#ff2a1a', gk:2}, GRN = {c:'#5f8a4b', m:0, lk:0};
  const g0 = minG(gl, [...KP1, ...KP4, ...KP2]), y0 = gl(5, -5);
  glassBlock(B, KT, g0 - 1.2, y0, y0 + 60, {gl:GL, fr:FR, rf:RF, base:BASE, fh:3.25, y1st:4.5, mull:1.5});
  glassBlock(B, KE, g0 - 1.2, y0, y0 + 53.4, {gl:GL, fr:FR, rf:RF, base:BASE, fh:3.25, y1st:4.5, mull:1.5});
  glassBlock(B, KW, g0 - 1.2, y0, y0 + 53.4, {gl:GL, fr:FR, rf:RF, base:BASE, fh:3.25, y1st:4.5, mull:1.5});
  glassBlock(B, KP1, g0 - 1.2, y0, y0 + 13.8, {gl:GL, fr:FR, rf:RF, base:BASE, fh:4.5, mull:3.0, par:0.9});
  glassBlock(B, KP2, g0 - 1.2, y0, y0 + 7.2, {gl:GL, fr:FR, rf:RF, base:BASE, fh:3.6, mull:3.0, par:0.9});
  glassBlock(B, KP3, g0 - 1.2, y0, y0 + 17.1, {gl:GL, fr:FR, rf:RF, base:BASE, fh:2.85, mull:3.0, par:0.9});
  glassBlock(B, KP4, g0 - 1.2, y0, y0 + 17.1, {gl:GL, fr:FR, rf:RF, base:BASE, fh:2.85, mull:3.0, par:0.9});
  // planted podium roof edge (courtyards and greenery, architizer) — a planter band along the podium roofs
  edgeBands(B.p(GRN), KP4, y0 + 17.1, y0 + 17.9, -0.6);
  { const ax = [3.5 - (-3.0), -46.1 - 19.7], L = Math.hypot(ax[0], ax[1]), d = [ax[0]/L, ax[1]/L], c = [(3.5 + 24.4 + 17.9 - 3.0)/4, (-46.1 - 43.8 + 21.5 + 19.7)/4];
    prismP(B.p(CORE), B.p(RF), rectR(c, d, 22, 6.5), y0 + 60, y0 + 64.5);
    edgeBands(B.p(FR), rectR(c, d, 33, 10.4), y0 + 60.2, y0 + 62.4, 0.15);
    boxP(B.p(BEAC), 0.4, 0.5, 0.4, c[0], y0 + 64.5, c[1], 0); }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'sgkeppelbaytower', lat:1.264828, lon:103.818253, rot:0});
}
