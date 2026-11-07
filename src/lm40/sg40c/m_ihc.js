// ================= Indian Heritage Centre (2015, Robert Greg Shand Architects + URBNarc), 5 Campbell Lane =================
// Verified: four storeys on a tight triangular site (wallpaper*); transparent facade on Campbell Lane whose externalised
// criss-crossing double-flight stairs follow the Chand Baori stepwell (a 3-D jali), a large colourful mural on the gallery
// wall behind it, steel-framed curtain wall, palette of concrete, granite, glass, steel (theplan.it); lit at night. Real
// footprint w176326997; its SW edge is the pedestrian Campbell Lane. Overall height (19.5 m) is an estimate.
LANDMARKS.sgihc = {zh:'印度传统文化馆', en:'Indian Heritage Centre', cat:'new', r:35, h:19.5,
  lt:{m:0, c:'#ffdcb0', k:0.55, e:0.7},
  build(){
    const g = new THREE.Group(), B = mkB(), V = mkV(), R = LMCTX.rng;
    const P = [[-10.6,-8.1],[32.3,-6.3],[7.9,15.7],[4.3,16.3],[-32.1,-8.1],[-28.0,-14.0]];
    const M = {BODY:'#cbc6bd', GRAN:'#77736d', GLS:{c:'#a8c3c6', op:0.32, ds:true}, STEEL:'#2f3437', STAIR:'#d9d4ca', LED:{c:'#f4e3c4', glow:'#ffd38a', gk:1.4},
      WIN:{c:'#39434a', m:1, fh:4.6, cw:3}, ROOF:'#8c8780'};
    const H = 19.5, FH = 4.6, D = [4.3, 16.3], E = [-32.1, -8.1];
    const L = Math.hypot(E[0] - D[0], E[1] - D[1]), ex = (E[0] - D[0])/L, ez = (E[1] - D[1])/L;
    // outward normal of the Campbell Lane edge (points SW, away from the centroid)
    let nx = ez, nz = -ex; if (nx*(0 - D[0]) + nz*(0 - D[1]) > 0){ nx = -nx; nz = -nz; }
    const c0 = nx*D[0] + nz*D[1], DEP = 4.2;
    const body = clipH(P, nx, nz, c0 - DEP);
    prismP(B.p(M.GRAN), P, -5, 0.6, false);
    prismP(B.p(M.BODY), body, 0.6, H, false); capP(B.p(M.ROOF), body, H);
    parP(B.p(M.BODY), body, H, H + 1.0, 0.3);
    // the double-skin zone: floor slabs at each level, the stepwell stairs, the curtain wall
    const zone = clipH(P, -nx, -nz, -(c0 - DEP));
    for (let f = 1; f <= 4; f++) prismP(B.p(M.STAIR), offP(zone, 0.05), f*FH - 0.35, f*FH, true);
    prismP(B.p(M.STAIR), zone, 0.6, 0.8, false);
    // stair flights: on each level, pairs of opposed flights crossing in an X between landings (Chand Baori pattern)
    const FA = (u, y, w) => [D[0] + ex*u - nx*w, y, D[1] + ez*u - nz*w];   // u along the lane from the south tip, w = depth in from the glass
    const nb = 6, bw = (L - 4)/nb;
    for (let f = 0; f < 4; f++){ const y0 = f*FH + 0.8, y1 = (f + 1)*FH - 0.35;
      for (let j = 0; j < nb; j++){ const u0 = 2 + j*bw, u1 = u0 + bw, w = j % 2 ? 1.4 : 2.8;
        for (const [ua, ub] of [[u0, u1], [u1, u0]]){
          const p0 = FA(ua, y0, w), p1 = FA(ub, y1, w), q0 = FA(ua, y0, w + 1.2), q1 = FA(ub, y1, w + 1.2);
          quadP(B.p(M.STAIR), p0, p1, q1, q0);
          const k = 9; for (let s = 0; s < k; s++){ const t = s/k, a = FA(ua + (ub - ua)*t, y0 + (y1 - y0)*t, w), b2 = FA(ua + (ub - ua)*t, y0 + (y1 - y0)*t, w + 1.2), a2 = FA(ua + (ub - ua)*t, y0 + (y1 - y0)*(t + 1/k), w), b3 = FA(ua + (ub - ua)*t, y0 + (y1 - y0)*(t + 1/k), w + 1.2); quadP(B.p(M.STAIR), a, b2, b3, a2); }
          segP(B.p(M.LED), FA(ua, y0 + 1.0, w - 0.05), FA(ub, y1 + 1.0, w - 0.05), 0.05, 3); } } }
    // the mural on the gallery wall behind the stairs: an abstract collage of colour fields (no text, no figures)
    { const COL = ['#e2457a', '#f39a2b', '#2fb3a8', '#f2d23c', '#7b4fb8', '#3f7fd0', '#e86a3a', '#5dbb5a', '#c93a3a', '#f5efe2'];
      const FW = (u, v, w) => [D[0] + ex*u - nx*(DEP - (w || 0)), v, D[1] + ez*u - nz*(DEP - (w || 0))];
      for (let u = 0.5; u < L - 0.5; ){ const w = 1.2 + R()*3.2; for (let v = 0.8; v < H - 0.5; ){ const h = 1.0 + R()*3.4;
          vAdd(V, COL[Math.floor(R()*COL.length)], t => shapeP(t, rectO(u, Math.min(L - 0.5, u + w), v, Math.min(H - 0.3, v + h)), FW, 0.06)); v += h; } u += w; } }
    // steel-framed curtain wall on the lane: glass plane, mullion grid echoing the stairs, bracing diagonals
    { const Fg = (u, v, w) => [D[0] + ex*u + nx*(w || 0), v, D[1] + ez*u + nz*(w || 0)];
      shapeP(B.p(M.GLS), rectO(0.2, L - 0.2, 0.6, H + 0.6), Fg, 0);
      for (let u = 0.2; u <= L; u += L/12) segP(B.p(M.STEEL), Fg(u, 0.6, 0.05), Fg(u, H + 0.6, 0.05), 0.09, 4);
      for (let f = 0; f <= 4; f++) segP(B.p(M.STEEL), Fg(0.2, f*FH + 0.6, 0.06), Fg(L - 0.2, f*FH + 0.6, 0.06), 0.11, 4);
      for (let f = 0; f < 4; f++) for (let j = 0; j < 6; j++){ const ua = 0.2 + j*(L - 0.4)/6, ub = ua + (L - 0.4)/6;
        segP(B.p(M.STEEL), Fg(ua, f*FH + 0.6, 0.08), Fg(ub, (f + 1)*FH + 0.6, 0.08), 0.05, 3); segP(B.p(M.STEEL), Fg(ub, f*FH + 0.6, 0.08), Fg(ua, (f + 1)*FH + 0.6, 0.08), 0.05, 3); } }
    // the other faces: granite base course, narrow slot windows; open lobby at the south tip
    for (const E2 of edgesF(body)){ if (E2.L < 3) continue; slabP(B.p(M.GRAN), rectO(0, E2.L, 0.6, 1.4), E2.F, 0, 0.08);
      const k = Math.max(1, Math.round(E2.L/6)); for (let f = 1; f < 4; f++) for (let j = 0; j < k; j++){ const u = (j + 0.5)*E2.L/k; shapeP(B.p(M.WIN), rectO(u - 0.5, u + 0.5, f*FH + 1.4, f*FH + 3.8), E2.F, 0.05); } }
    B.flush(g); vFlush(g, V, {glow:'#ffffff', gk:0.35}); return g;
  }};
SG_PLACES.push({type:'sgihc', lat:1.305669, lon:103.852289, rot:0});
