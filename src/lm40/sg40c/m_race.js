// ================= Sakya Muni Buddha Gaya Temple (founded 1927 by the Thai monk Vutthisara), 366 Race Course Road =================
// Verified: the "Temple of 1,000 Lights", the 15 m, ~300 t Buddha inside surrounded by lights (roots.gov.sg); a chedi (stupa)
// style roofline (Frommer's); a bulbous dome with a spire rising behind it (Travelfish); two guardian figures. Footprint: the hall
// is taken as w454182411 (the POIs sit on it and on w455155911 beside it; neither is named in the data) - anchor uncertain.
// Wall and roof colours, the roof tiers and all heights (walls 11 m, dome 24 m, spire 31 m) are estimates.
LANDMARKS.sgsakyamuni = {zh:'释迦牟尼菩提迦耶寺（千灯寺）', en:'Sakya Muni Buddha Gaya Temple', cat:'old', r:35, h:31,
  lt:{m:0, c:'#ffe6b8', k:0.6, e:0.5, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), Fr = frm(-50.2*PI/180);
    const P1 = [[18.1,-1.6],[6.7,12.0],[-14.2,-5.1],[-2.8,-18.8]], P2 = [[3.7,9.7],[-4.0,18.6],[-14.8,9.7],[-7.0,0.2]];
    const M = {WALL:'#efe3c2', WALL2:'#e2d2a8', TRIM:'#f7f1e1', ROOF:'#b5462e', ROOF2:'#2f6e4a', GOLD:{c:'#d8aa3c', lc:'#ffe3a0', lk:1.2}, DARK:'#2b2622', BASE:'#9d968a', LAMP:{c:'#fff1cc', glow:'#ffd890', gk:1.3}, RED:'#9c2a22'};
    // hall (u = along Race Course Road -5..12.7, v = depth, road at v = -14.2) and the annex beside it
    prismP(B.p(M.BASE), P1, -5, 0.8, false); prismP(B.p(M.BASE), P2, -5, 0.6, false);
    const U0 = -5.0, U1 = 12.7, V0 = -14.2, V1 = 12.9, YW = 11;
    rectPrism(B.p(M.WALL), Fr, U0, U1, V0, V1, 0.8, YW);
    bandP(B.p(M.TRIM), Fr.rect(U0, U1, V0, V1), YW - 0.6, 0.6, 0.2);
    prismP(B.p(M.WALL2), P2, 0.6, 8.2, false); capP(B.p(M.TRIM), P2, 8.2); parP(B.p(M.TRIM), P2, 8.2, 9.0, 0.2);
    winP(B.p(M.DARK), P2, 0.6, 2, 3.8, 3.5, 1.2, 2.0, 1.0, 0.05, 4);
    // two-tier roof over the hall, steep and swept up at the eaves, green border tiles
    const cu = (U0 + U1)/2, cv = (V0 + V1)/2, cxz = Fr.X(cu, cv), ry = 50.2*PI/180;
    roofP(B.p(M.ROOF), cxz[0], cxz[1], (U1 - U0)/2 + 1.2, (V1 - V0)/2 + 1.2, (U1 - U0)/2 - 2.5, (V1 - V0)/2 - 3.5, YW, 3.2, {ry:ry, pw:1.3, lift:0.7, fas:0.5, fo:B.p(M.ROOF2), n:4});
    rectPrism(B.p(M.WALL), Fr, U0 + 2.6, U1 - 2.6, V0 + 3.6, V1 - 3.6, YW + 3.0, YW + 5.0);
    roofP(B.p(M.ROOF), cxz[0], cxz[1], (U1 - U0)/2 - 1.6, (V1 - V0)/2 - 2.6, 1.2, (V1 - V0)/2 - 8, YW + 5.0, 3.6, {ry:ry, pw:1.25, lift:0.6, fas:0.4, fo:B.p(M.ROOF2), n:4});
    // the chedi: square base, bell-shaped (bulbous) dome, rings, and the spire behind it
    const C0 = Fr.X(cu, V0 + 9);
    LBox(g, 5.2, 1.2, 5.2, C0[0], YW + 7.5, C0[1], M.TRIM, -ry + PI/4*0);
    LLathe(g, [[2.6, 0], [2.9, 0.4], [3.1, 1.6], [2.8, 3.0], [2.2, 4.0], [1.3, 4.6], [0.8, 4.9]], C0[0], YW + 8.7, C0[1], M.GOLD, 20);
    for (let i = 0; i < 6; i++) LCyl(g, 0.8 - i*0.1, 0.85 - i*0.1, 0.32, C0[0], YW + 13.6 + i*0.34, C0[1], M.GOLD, 12);
    LCone(g, 0.45, 3.0, C0[0], YW + 15.6, C0[1], M.GOLD, 10);
    const C1 = Fr.X(cu, V1 - 6);
    LBox(g, 3.4, 2.0, 3.4, C1[0], YW + 7.0, C1[1], M.WALL, -ry);
    LLathe(g, [[1.7, 0], [1.6, 1.0], [1.3, 3.0], [1.1, 4.8], [0.7, 7.0], [0.35, 9.5], [0.12, 11.4], [0.02, 13.0]], C1[0], YW + 9.0, C1[1], M.GOLD, 12);
    // ridge finials (chofa-like horns) at the gable ends of the upper roof
    for (const s of [-1, 1]){ const p = Fr.R(cu + s*1.2, YW + 8.6, cv); LCone(g, 0.18, 1.4, p[0], p[1], p[2], M.GOLD, 6); }
    // road front: portico with columns and the doorway, guardian plinths either side
    { const F = (uu, vv, w) => Fr.R(uu, vv, V0 - (w || 0));
      shapeP(B.p(M.DARK), rectO(cu - 1.8, cu + 1.8, 0.8, 4.8), F, 0.05);
      for (const k of [-6.5, -3.5, 3.5, 6.5]) shapeP(B.p(M.DARK), rectO(cu + k - 0.7, cu + k + 0.7, 2.2, 5.4), F, 0.05);
      rectPrism(B.p(M.TRIM), Fr, cu - 4, cu + 4, V0 - 3, V0, 5.6, 6.2);
      for (const k of [-3.6, -1.2, 1.2, 3.6]){ const p = Fr.R(cu + k, 0, V0 - 2.7); LCyl(g, 0.28, 0.3, 4.8, p[0], 0.8, p[2], M.TRIM, 8); }
      roofP(B.p(M.ROOF), ...Fr.X(cu, V0 - 1.5), 4.6, 2.0, 2.2, 0.2, 6.2, 2.0, {ry:ry, pw:1.2, lift:0.4, n:3});
      rectPrism(B.p(M.BASE), Fr, cu - 4.4, cu + 4.4, V0 - 3.6, V0, 0, 0.8);
      for (const s of [-1, 1]){ const p = Fr.R(cu + s*5.6, 0, V0 - 2.2); LBox(g, 1.2, 1.4, 1.2, p[0], 0.8, p[2], M.TRIM, -ry); } }
    winP(B.p(M.DARK), Fr.rect(U0, U1, V0 + 3, V1), 0.8, 2, 4.6, 4.2, 1.1, 2.6, 1.4, 0.05, 6);
    for (const [x, z] of alongP(Fr.rect(U0 - 1.2, U1 + 1.2, V0 - 1.2, V1 + 1.2), 3.2)) boxP(B.p(M.LAMP), 0.22, 0.4, 0.22, x, YW - 0.9, z);
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'sgsakyamuni', lat:1.314839, lon:103.857052, rot:0});

// ================= Leong San See Temple (est. 1917, present building 1926), 371 Race Course Road =================
// Verified (URA conservation portal): southern Chinese Fujian-style temple, the roof is the focal point - curved ridges ending
// in swallow's tails, decorated with ceramic dragons, chimeras, phoenixes and flowers in cut-and-paste porcelain, four large
// panels at the ends of the perpendicular ridges; lacquered columns on carved granite bases; entrance with two carved stone lions
// and round windows; glossy yellow roof tiles (a later addition). Footprint w871542048; front on Race Course Road (SE). Hall
// layout and heights are estimates.
LANDMARKS.sgleongsan = {zh:'龙山寺', en:'Leong San See Temple', cat:'old', r:35, h:12.5,
  lt:{m:0, c:'#ffd9a8', k:0.55, e:0.6},
  build(){
    const g = new THREE.Group(), B = mkB(), V = mkV(), Fr = frm(34.8*PI/180), ry = -34.8*PI/180;
    const P = [[-5.1,-17.7],[18.8,-1.1],[5.0,17.9],[-18.8,0.7]];
    const M = {WALL:'#d8cbb3', WALL2:'#c9b796', TILE:'#d9a92c', TILE2:'#b9851e', RIDGE:'#e8d9b0', RED:'#9b2a20', GRAN:'#9a958b', DARK:'#2a2420', STONE:'#bdb7aa', LANT:{c:'#c8352a', glow:'#ff6a3a', gk:1.4}, GOLD:'#d4a73c'};
    prismP(B.p(M.GRAN), P, -5, 0.6, false);
    // frame: u from the back (-14.6) to the Race Course Road front (+14.6); v across (-11.6..11.6)
    const HALLS = [[7.4, 14.6, -11.6, 11.6, 5.2, 3.0], [-9.8, 3.4, -11.6, 11.6, 6.2, 3.8], [-14.6, -9.8, -11.6, 11.6, 4.6, 2.4]];
    for (const [u0, u1, v0, v1, eh, rh] of HALLS){
      rectPrism(B.p(M.WALL), Fr, u0, u1, v0, v1, 0.6, eh);
      const c = Fr.X((u0 + u1)/2, (v0 + v1)/2), L = (v1 - v0)/2, W = (u1 - u0)/2;
      // curved ridge (sag), swept eaves: ridge along v
      roofP(B.p(M.TILE), c[0], c[1], L + 0.8, W + 1.0, L - 0.3, 0, eh, rh, {ry:ry - PI/2, pw:1.5, lift:0.5, sag:0.9, fas:0.35, fo:B.p(M.TILE2), n:5, ridge:B.p(M.RIDGE), rr:0.32, hips:B.p(M.RIDGE), hr:0.14});
      // swallow-tail ridge ends and ceramic dragons / phoenixes along the main ridge
      const yr = eh + rh + 0.9;
      for (const s of [-1, 1]){ const a = Fr.R((u0 + u1)/2, yr, s*(L - 0.1)), b1 = Fr.R((u0 + u1)/2 + 0.45, yr + 1.3, s*(L + 0.9)), b2 = Fr.R((u0 + u1)/2 - 0.45, yr + 1.3, s*(L + 0.9));
        segP(B.p(M.RIDGE), a, b1, 0.16, 4); segP(B.p(M.RIDGE), a, b2, 0.16, 4); }
      const nf = Math.round(L*2/3.2);
      for (let j = 0; j < nf; j++){ const vv = -L + 1 + (2*L - 2)*(j + 0.5)/nf, p = Fr.R((u0 + u1)/2, yr - 0.2, vv), col = ['#3f8f5a', '#2f6fb0', '#d24a32', '#e9c645'][j % 4];
        vAdd(V, col, t => { boxP(t, 0.45, 0.6, 1.4, p[0], yr - 0.4, p[2], ry); boxP(t, 0.35, 0.5, 0.5, p[0], yr + 0.1, p[2], ry); }); }
    }
    // side galleries joining the halls round the two courtyards (lower pent roofs)
    for (const s of [-1, 1]){ const v0 = s < 0 ? -11.6 : 8.4, v1 = s < 0 ? -8.4 : 11.6;
      rectPrism(B.p(M.WALL2), Fr, 3.4, 7.4, v0, v1, 0.6, 4.2); const c = Fr.X(5.4, (v0 + v1)/2);
      roofP(B.p(M.TILE), c[0], c[1], 2.4, 2.0, 1.6, 0, 4.2, 1.6, {ry:ry, pw:1.4, n:3, fas:0.25, fo:B.p(M.TILE2)}); }
    rectPrism(B.p(M.STONE), Fr, 3.4, 7.4, -8.4, 8.4, 0.6, 0.7);
    // front: lacquered columns on granite bases under the eave, the doorway, round windows, two stone lions, lanterns
    { const F = (uu, vv, w) => Fr.R(14.6 + (w || 0), vv, -uu);
      shapeP(B.p(M.RED), rectO(-2.2, 2.2, 0.6, 4.4), F, 0.04); shapeP(B.p(M.DARK), rectO(-1.8, 1.8, 0.6, 4.0), F, 0.06);
      for (const s of [-1, 1]){ shapeP(B.p(M.DARK), circ(1.0, 14).map(p => [p[0] + s*6.5, p[1] + 2.8]), F, 0.06); slabP(B.p(M.STONE), circ(1.25, 14).map(p => [p[0] + s*6.5, p[1] + 2.8]), F, 0, 0.03); }
      for (const vv of [-9.5, -4.5, 4.5, 9.5]){ const p = Fr.R(16.0, 0, vv); LBox(g, 0.6, 0.6, 0.6, p[0], 0.6, p[2], M.GRAN, ry); LCyl(g, 0.24, 0.24, 4.4, p[0], 1.2, p[2], M.RED, 8); }
      for (const vv of [-3.2, 3.2]){ const p = Fr.R(17.8, 0, vv); LBox(g, 1.0, 0.9, 1.3, p[0], 0, p[2], M.GRAN, ry); LBox(g, 0.8, 1.3, 1.0, p[0], 0.9, p[2], M.STONE, ry); LSph(g, 0.45, p[0], 2.5, p[2], M.STONE, 1, 8); }
      for (const vv of [-2.6, 2.6]){ const p = Fr.R(16.0, 0, vv); LSph(g, 0.4, p[0], 4.3, p[2], M.LANT, 1.25, 8); } }
    winP(B.p(M.DARK), Fr.rect(-14.6, 7.4, -11.6, 11.6), 0.6, 1, 4, 4.5, 1.0, 1.6, 1.4, 0.05, 6);
    B.flush(g); vFlush(g, V); return g;
  }};
SG_PLACES.push({type:'sgleongsan', lat:1.315235, lon:103.856842, rot:0});
