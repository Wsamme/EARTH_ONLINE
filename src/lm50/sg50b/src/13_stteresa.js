// ================= Church of St Teresa, 510 Kampong Bahru Road (sgstteresa, hero) =================
// Roots.gov.sg / Wikipedia (national monument 2009): Romano-Byzantine church, opened 7 April 1929, sketches by Fr Jean Marie Ouillon
// after the Sacre-Coeur in Montmartre, final plans by Emile Brizay. "An imposing dome that caps the sanctuary"; "a pair of towers
// topped by twin cupolas" flanking the main entrance, the two belfries above the porch holding five bells; side windows set within
// triple arches with a cross-in-circle motif; clerestory windows. Plan: OSM w172092357 (52 x 24 m nave block, axis ENE-WSW, with the
// 7.5 x 8 m porch on the east end facing the driveway loop and Kampong Bahru Road; the sanctuary and dome at the west, uphill end).
// Heights are not published: walls, towers (~29 m to the crosses) and dome (~31 m) are estimates from the plan proportions.
// Colours (cream render, terracotta roofs, grey-green domes) are estimates. Night: warm floodlight, glowing windows.
{
const A0 = D.stt.A, C0 = [-1.2, 0.5], AX = -24.663*PI/180, [RING] = shAll([D.stt.r], C0);
K50('sgstteresa', '圣德肋撒堂', 'Church of St Teresa', A0, C0, {r:37, h:34, lt:{m:0, c:'#ffe7c4', k:0.6}, build(){
  const g = new THREE.Group(), B = mkB(), f = frame(0, 0, AX);
  const WALL = {c:'#ece3cf', m:0, lk:0.6}, TRIM = {c:'#f7f2e6', m:0, lk:0.6}, ROOF = '#a4553a', DOME = {c:'#9ba7a3', m:0, lk:0.35},
    WIN = {c:'#3a3f4a', m:0, glow:'#ffcf8a', gk:0.9}, DOOR = '#4a3426', STEP = '#cfc8b8', CROSS = {c:'#e9e2cf', m:0, lk:0.7}, BELL = '#2c2a28';
  const box = (o, u0, u1, y0, y1, v0, v1) => bxF(o, f, u0, u1, y0, y1, v0, v1);
  // facade frames: long walls (v = const, facing s), end walls (u = const, facing s): F(t, y, w) with t along the wall
  const FV = (v, s) => (t, y, w) => f(t, y, v + s*(w || 0));
  const FU = (u, s) => (t, y, w) => f(u + s*(w || 0), y, t);
  const UW = -25.9, UE = 26.2, UT = 20.6;            // west end, east facade, tower inner face
  // ---- base: foundations, raised floor and steps ----
  foundP(B.p(FOUND50), RING, 0.3); capP(B.p(STEP), RING, 1.2); wallP(B.p(STEP), RING, 0.3, 1.2);
  for (let i = 0; i < 3; i++) box(B.p(STEP), UE + 7.4, UE + 9.0 - i*0.5, 0.3, 0.6 + i*0.3, -5.5, 4.4);
  // ---- aisles (v 6..12 both sides): walls to 9 m, lean-to roofs against the nave ----
  for (const s of [-1, 1]){
    const vo = 12*s, vi = 6*s;
    box(B.p(WALL), -18, UT, 1.2, 9, Math.min(vo, vi), Math.max(vo, vi));
    sheetP(B.p(ROOF), [[f(-18.4, 8.9, vo + 0.6*s), f(UT, 8.9, vo + 0.6*s)], [f(-18.4, 11.6, vi), f(UT, 11.6, vi)]]);
    bandAtP(B.p(TRIM), polyF(f, rectO(-18, UT, Math.min(vo, vi), Math.max(vo, vi))), 8.3, 0.7, 0.18);
    // triple-arch window groups in each bay + cross-in-circle above, pilaster strips between bays
    const F = FV(vo, s);
    for (let k = 0; k < 7; k++){ const uc = -15.2 + k*5.4;
      for (const d of [-1.15, 0, 1.15]) shapeP(B.p(WIN), mv(rArchO(0.42, d === 0 ? 3.6 : 3.1, 6), uc + d, 3.4), F, 0.05);
      slabP(B.p(TRIM), mv(rArchO(1.9, 4.3, 8), uc, 3.0), F, 0.0, 0.03);
      shapeP(B.p(TRIM), ringPts(0, 0, 0.55, 10).map(p => [uc + p[0], 7.7 + p[1]]), F, 0.07);
      slabP(B.p(WALL), rectO(uc + 2.4, uc + 3.0, 1.2, 8.3), F, 0, 0.25); }
  }
  // ---- nave (v -6..6): clerestory walls to 15 m, gable roof to 19.5 m ----
  box(B.p(WALL), -18, UT, 9, 15, -6, 6);
  for (const s of [-1, 1]){ const F = FV(6*s, s); for (let k = 0; k < 7; k++){ const uc = -15.2 + k*5.4;
    for (const d of [-0.7, 0.7]) shapeP(B.p(WIN), mv(rArchO(0.4, 2.3, 6), uc + d, 11.8), F, 0.05); } }
  bandAtP(B.p(TRIM), polyF(f, rectO(-18, UT, -6, 6)), 14.4, 0.6, 0.2);
  hipF(B.p(ROOF), f, -18, UT + 0.6, -6, 6, 15, 4.5, 0.5, true);
  // ---- sanctuary (west, full width) with the dome: square base, drum with windows, dome, lantern, cross ----
  box(B.p(WALL), UW, -18, 1.2, 15, -12, 12);
  for (const s of [-1, 1]){ const F = FV(12*s, s); for (const uc of [-23.5, -20.3]) shapeP(B.p(WIN), mv(rArchO(0.5, 3.4, 6), uc, 4), F, 0.05); }
  { const F = FU(UW, -1); for (const t of [-6, 0, 6]) shapeP(B.p(WIN), mv(rArchO(0.55, 3.8, 6), t, 5), F, 0.05); }
  bandAtP(B.p(TRIM), polyF(f, rectO(UW, -18, -12, 12)), 14.3, 0.7, 0.2);
  capP(B.p(ROOF), polyF(f, rectO(UW, -18, -12, 12)), 15.02);
  const dc = f(-19.8, 0, 0);
  box(B.p(WALL), UW, -13.7, 15, 17.2, -6.6, 6.6);
  latheP(B.p(WALL), [[6.0, 17.2], [6.0, 21.2]], dc[0], dc[2], 24);
  for (let i = 0; i < 12; i++){ const a = i/12*TAU, F = fA(dc[0] + Math.cos(a)*6.02, dc[2] + Math.sin(a)*6.02, a + HP); shapeP(B.p(WIN), mv(rArchO(0.45, 2.4, 5), 0, 18.2), F, 0.02); }
  latheP(B.p(TRIM), [[6.4, 21.2], [6.4, 21.7], [6.1, 21.9]], dc[0], dc[2], 24);
  const dome = []; for (let i = 0; i <= 8; i++){ const a = i/8*HP; dome.push([6.1*Math.cos(a), 21.9 + 7.1*Math.sin(a)]); }
  latheP(B.p(DOME), dome, dc[0], dc[2], 24);
  latheP(B.p(TRIM), [[1.3, 28.7], [1.3, 30.3], [1.55, 30.5], [0.9, 31.3], [0.05, 31.9]], dc[0], dc[2], 10);
  for (let i = 0; i < 12; i++){ const a = i/12*TAU; segP(B.p(TRIM), [dc[0] + Math.cos(a)*6.05, 21.9, dc[2] + Math.sin(a)*6.05], [dc[0] + Math.cos(a)*1.5, 28.4, dc[2] + Math.sin(a)*1.6], 0.12, 4); }
  const cross = (x, y, z, s) => { boxP(B.p(CROSS), 0.22*s, 2.2*s, 0.22*s, x, y, z, -AX); boxP(B.p(CROSS), 1.2*s, 0.22*s, 0.22*s, x, y + 1.35*s, z, -AX); };
  cross(dc[0], 32.0, dc[2], 1);
  // ---- east front: twin towers with belfries and cupolas, central gable with the great arched window ----
  for (const s of [-1, 1]){
    const v0 = 6.6*s, v1 = 12*s, vm = 9.3*s, tv0 = Math.min(v0, v1), tv1 = Math.max(v0, v1);
    box(B.p(WALL), UT, UE, 1.2, 21.4, tv0, tv1);
    const P = polyF(f, rectO(UT, UE, tv0, tv1));
    for (const y of [9, 15]) bandAtP(B.p(TRIM), P, y, 0.5, 0.15);
    bandAtP(B.p(TRIM), P, 20.8, 0.8, 0.3);
    // belfry: two arched openings per face, louvres dark
    for (const e of edgesF(P)) for (const d of [-1.1, 1.1]) { shapeP(B.p(BELL), mv(rArchO(0.6, 3.8, 6), e.L/2 + d, 16.2), e.F, 0.04); slabP(B.p(TRIM), mv(rArchO(0.75, 4.0, 6), e.L/2 + d, 16.0), e.F, 0.0, 0.02); }
    for (const e of edgesF(P)) shapeP(B.p(WIN), mv(rArchO(0.45, 2.6, 5), e.L/2, 10.6), e.F, 0.04);
    // cupola: octagonal drum, dome, finial, cross
    const tc = f((UT + UE)/2, 0, vm);
    box(B.p(WALL), UT + 0.6, UE - 0.6, 21.4, 22.2, tv0 + 0.6, tv1 - 0.6);
    latheP(B.p(WALL), [[2.2, 22.2], [2.2, 24.4]], tc[0], tc[2], 8, PI/8);
    for (let i = 0; i < 8; i++){ const a = PI/8 + (i + 0.5)/8*TAU, F = fA(tc[0] + Math.cos(a)*2.05, tc[2] + Math.sin(a)*2.05, a + HP); shapeP(B.p(BELL), mv(rArchO(0.35, 1.6, 4), 0, 22.6), F, 0.02); }
    latheP(B.p(TRIM), [[2.45, 24.4], [2.45, 24.7]], tc[0], tc[2], 8, PI/8);
    const cd = []; for (let i = 0; i <= 6; i++){ const a = i/6*HP; cd.push([2.35*Math.cos(a), 24.7 + 2.6*Math.sin(a)]); }
    latheP(B.p(DOME), cd, tc[0], tc[2], 12);
    latheP(B.p(TRIM), [[0.4, 27.2], [0.45, 27.8], [0.05, 28.2]], tc[0], tc[2], 6);
    cross(tc[0], 28.1, tc[2], 0.6);
  }
  // central gable wall between the towers
  { const F = FU(UE, 1);
    slabP(B.p(WALL), [[-6.6, 1.2], [6.6, 1.2], [6.6, 15], [0, 19.6], [-6.6, 15]], F, -0.4, 0.1);
    slabP(B.p(TRIM), [[-7.1, 14.6], [7.1, 14.6], [0, 20.3], [-0.01, 20.3]], F, 0.1, 0.3);
    shapeP(B.p(WIN), mv(rArchO(2.1, 5.2, 10), 0, 8.8), F, 0.14);
    slabP(B.p(TRIM), mv(rArchO(2.6, 5.8, 10), 0, 8.5), F, 0.1, 0.13);
    for (const t of [-4.4, 4.4]) shapeP(B.p(WIN), mv(rArchO(0.4, 2.4, 5), t, 10.5), F, 0.14);
    cross(...(p => [p[0], 20.3, p[2]])(f(UE + 0.2, 0, 0)), 0.6);
  }
  // porch: three arches to the front, one each side, a flat roof with a low parapet
  { const u0 = UE, u1 = 33.5, v0 = -4.5, v1 = 3.5;
    box(B.p(WALL), u0, u1, 1.2, 7.6, v0, v1);
    const FF = FU(u1, 1); for (const t of [-2.7, -0.5, 1.7]) shapeP(B.p(DOOR), mv(rArchO(0.85, 4.6, 8), t, 1.2), FF, 0.03);
    for (const [v, s] of [[v0, -1], [v1, 1]]) shapeP(B.p(DOOR), mv(rArchO(1.0, 4.6, 8), (u0 + u1)/2, 1.2), FV(v, s), 0.03);
    box(B.p(TRIM), u0, u1 + 0.3, 7.0, 7.7, v0 - 0.3, v1 + 0.3); box(B.p(TRIM), u0, u1 + 0.3, 7.7, 8.4, v0 - 0.3, v1 + 0.3);
    capP(B.p(ROOF50), polyF(f, rectO(u0, u1, v0, v1)), 8.41);
    slabP(B.p(DOOR), rectO(-1.6, 1.6, 1.2, 5.4), FU(UE, 1), 0.12, 0.16);
  }
  B.flush(g); return g; }});
}
