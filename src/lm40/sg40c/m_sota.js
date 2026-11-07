// ================= School of the Arts Singapore (WOHA, 2010), 1 Zubir Said Drive =================
// Verified: 56 m, 10 floors (skyscrapercenter); three long rectangular 6-storey blocks span the "Backdrop" podium (e-architect,
// gooood); podium holds concert hall / drama theatre / black box; faceted sculptural podium in off-form coloured concrete;
// living creeper screens on the facades ("inspired by a musical score"); breezeways between the blocks with facilities suspended
// between them; the roof is a park with a 400 m running track (gooood) and bridges at the highest roof level (architectureau);
// shops along an external covered walkway. Real footprint w107937797. Block orientation (parallel to Prinsep Street) and the
// exact podium height are estimates.
LANDMARKS.sgsota = {zh:'新加坡艺术学院', en:'School of the Arts Singapore', cat:'new', r:72, h:56,
  lt:{m:0, c:'#ffe7c4', k:0.45, e:0.4},
  build(){
    const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
    const P = [[-6.6,57.1],[-2.4,52.3],[-20.9,45.2],[-25.1,51.2],[-26.9,50.0],[-28.1,51.2],[-35.9,45.2],[-35.3,43.4],[-36.5,42.3],[-31.7,35.7],[-37.6,16.2],[-41.8,20.3],[-49.0,14.4],[-39.4,1.9],[-53.2,-30.7],[-2.4,-47.3],[5.3,-51.4],[17.9,-45.5],[61.5,-12.9],[1.2,63.6]];
    const M = {CON:'#a39b8f', CON2:'#8d8478', DECK:'#6f6a62', GLS:{c:'#2f3a3f', m:1, fh:5.4, cw:4.5}, SHOP:{c:'#3a4446', glow:'#ffd9a0', gk:0.9},
      GRN:'#4f7a38', GRN2:'#5f8f45', TRK:'#a8553e', WHT:'#d9d6cf', RAIL:'#5a5f60', ROOF:'#7f8a6a', DARK:'#3a3936'};
    const d = [-0.619, 0.785], n = [0.785, 0.619], ST = (s, t) => [s*d[0] + t*n[0], s*d[1] + t*n[1]];
    const YP = 23.5, FH = 5.4, YT = YP + 6*FH;           // podium top, storey height, block roof (= 55.9)
    // podium: ground floor set back behind columns (covered walkway), a faceted chamfer band, the upper podium on the full plan
    const P0 = offP(P, 2.6);
    prismP(B.p(M.CON2), P0, -5, 6.2, false);
    for (const E of edgesF(P0)){ if (E.L < 4) continue; const k = Math.max(1, Math.round(E.L/9));
      for (let j = 0; j < k; j++){ const u0 = (j + 0.12)*E.L/k, u1 = (j + 0.88)*E.L/k; shapeP(B.p(M.SHOP), rectO(u0, u1, 0.3, 4.6), E.F, 0.04); } }
    for (const [x, z] of alongP(P, 9)) boxP(B.p(M.CON), 0.8, 6.2, 0.8, x, 0, z);
    { const A = offP(P, 2.6), Bq = P, secs = [A.map(p => [p[0], 6.2, p[1]]), Bq.map(p => [p[0], 10.5, p[1]])];
      LLoft(g, secs, M.CON, false); }
    prismP(B.p(M.CON), P, 10.5, YP, false); capP(B.p(M.DECK), P, YP);
    // podium facade: long horizontal slots and a few faceted glazed openings
    for (const E of edgesF(P)){ if (E.L < 6) continue;
      shapeP(B.p(M.GLS), rectO(1, E.L - 1, 13.0, 14.6), E.F, 0.05); shapeP(B.p(M.GLS), rectO(1, E.L - 1, 18.4, 20.0), E.F, 0.05);
      slabP(B.p(M.CON2), rectO(0, E.L, YP - 0.2, YP + 1.1), E.F, 0, 0.25); }
    // three 6-storey blocks across the podium, parallel to Prinsep Street; breezeways between them
    const PI_ = offP(P, 1.5), BL = [[21.5, 39.5, -46, 46], [-5, 13, -46, 46], [-31.5, -13.5, -46, 46]], BP = [];
    for (const [t0, t1, s0, s1] of BL){
      const Q = clipST(PI_, d, n, s0, s1, t0, t1); if (Q.length < 3) continue; BP.push(Q);
      prismP(B.p(M.CON), Q, YP, YT, false);
      for (const E of edgesF(Q)){ if (E.L < 3) continue; const k = Math.max(1, Math.round(E.L/4.5));
        for (let f = 0; f < 6; f++){ const v = YP + f*FH; slabP(B.p(M.WHT), rectO(0, E.L, v, v + 0.5), E.F, 0, 0.35);
          for (let j = 0; j < k; j++){ const u = (j + 0.5)*E.L/k; shapeP(B.p(M.GLS), rectO(u - E.L/k/2 + 0.25, u + E.L/k/2 - 0.25, v + 0.9, v + 4.6), E.F, 0.06); } }
        // creeper screens: vertical green strips of varying height and width, like the bars of a score
        if (E.L > 15){ let u = 1.5; while (u < E.L - 2){ const w = 0.8 + R()*2.4, v0 = YP + 0.5 + Math.floor(R()*3)*FH, v1 = Math.min(YT - 0.4, v0 + FH*(1.5 + R()*3.5));
          if (R() < 0.72) slabP(B.p(R() < 0.5 ? M.GRN : M.GRN2), rectO(u, Math.min(E.L - 1, u + w), v0, v1), E.F, 0.7, 1.05);
          u += w + 0.6 + R()*2.2; } } }
      // roof: parapet, roof garden, the running track lane round the edge
      parP(B.p(M.RAIL), Q, YT, YT + 1.1, 0.25);
      const Q1 = offP(Q, 1.0), Q2 = offP(Q, 4.2);
      prismP(B.p(M.TRK), Q1, YT, YT + 0.12, false); prismP(B.p(M.ROOF), Q2, YT, YT + 0.2, false);
      for (const E of edgesF(Q2)){ if (E.L < 12) continue; const k = Math.floor(E.L/12); for (let j = 0; j < k; j++){ const p = E.F((j + 0.5)*E.L/k, 0, -2.5); LCyl(g, 0.25, 0.3, 3, p[0], YT, p[2], '#5b4a3a', 5); LSph(g, 2.4, p[0], YT + 4, p[2], M.GRN2, 0.8, 7); } }
    }
    // bridges at the top roof level link the blocks (the track crosses them) + suspended volumes in the breezeways
    for (const s of [-34, 0, 30]) for (let i = 0; i < 2; i++){ const ta = BL[i][2 - 2] , tb = BL[i+1][1];
      const t0 = BL[i+1][1] - 0.5, t1 = BL[i][0] + 0.5, a = ST(s - 3, t0), b = ST(s + 3, t0), c = ST(s + 3, t1), e = ST(s - 3, t1);
      prismP(B.p(M.CON), [a, b, c, e], YT - 1.2, YT, true); prismP(B.p(M.TRK), [a, b, c, e], YT, YT + 0.12, false);
      for (const sg of [-3, 3]){ const p = ST(s + sg, t0), q = ST(s + sg, t1); segP(B.p(M.RAIL), [p[0], YT + 1.1, p[1]], [q[0], YT + 1.1, q[1]], 0.06, 4); } }
    for (const [i, s, f0, nf] of [[0, -18, 2, 2], [0, 22, 1, 2], [1, -10, 3, 2], [1, 24, 1, 1]]){
      const t0 = BL[i+1][1] - 0.3, t1 = BL[i][0] + 0.3, Q = [ST(s - 9, t0), ST(s + 9, t0), ST(s + 9, t1), ST(s - 9, t1)];
      prismP(B.p(M.CON2), Q, YP + f0*FH, YP + (f0 + nf)*FH, true);
      for (const E of edgesF(Q)) if (E.L > 10) shapeP(B.p(M.GLS), rectO(1, E.L - 1, YP + f0*FH + 1, YP + (f0 + nf)*FH - 0.8), E.F, 0.05); }
    // podium roof decks in the breezeways are planted
    for (const Q of [clipST(offP(P, 3), d, n, -46, 46, 13.5, 21), clipST(offP(P, 3), d, n, -46, 46, -13, -5.5)]) if (Q.length > 2) prismP(B.p(M.GRN), Q, YP, YP + 0.3, false);
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'sgsota', lat:1.299372, lon:103.848739, rot:0});
