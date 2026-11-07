// ================= Masjid Malabar (A. H. Siddique; built 1956-62, opened 1963), 471 Victoria Street =================
// Verified: Indo-Saracenic reinforced-concrete mosque at the corner of Victoria Street and Jalan Sultan, dramatising the corner with
// domes, projecting balconies, parapets and chatris (URA); golden onion domes - a big central one, a smaller one on a platform over
// the south-eastern section, an octagonal minaret to the right of the main dome capped by a smaller dome, each with a crescent and
// star (Wikipedia / Infopedia); facade covered in blue and white tiles (retiled 1995); prayer hall on the first floor with verandahs
// on three sides; external staircases between the levels; windows with interlocking-coin latticework. Real footprint w531916524.
// Heights (parapet 12 m, main dome 25 m, minaret 29 m) and the tile grid are estimates.
LANDMARKS.sgmalabar = {zh:'马拉巴回教堂', en:'Masjid Malabar', cat:'old', r:35, h:29,
  lt:{m:0, c:'#fff1d6', k:0.85, e:0.6},
  build(){
    const g = new THREE.Group(), B = mkB(), Fr = frm(-38.3*PI/180);
    const P = [[19.8,-3.0],[19.8,1.1],[-6.5,21.9],[-21.4,2.3],[-12.5,-4.2],[-11.9,-8.9],[-7.1,-14.3],[0.6,-13.1],[0.6,-17.2],[5.4,-23.2]];
    const M = {BLUE:'#2350a0', BLUE2:'#1c4189', WHITE:'#eef0f2', GOLD:{c:'#d9a93a', lc:'#ffe09a', lk:1.1}, DARK:'#1d2430', WIN:'#22262c', BASE:'#8f9399', LAMP:{c:'#fff3d0', glow:'#ffe4a8', gk:1.2}, GRN:'#2e7a4a'};
    const Y1 = 4.6, Y2 = 12.0;
    prismP(B.p(M.BASE), P, -5, 0.6, false);
    prismP(B.p(M.BLUE), P, 0.6, Y2, false); capP(B.p(M.BLUE2), P, Y2);
    // white tile grid on the blue walls (every ~1.2 m), cornices, the parapet
    for (const E of edgesF(P)){ if (E.L < 1.5) continue; const nu = Math.max(1, Math.round(E.L/1.2));
      for (let j = 1; j < nu; j++){ const u = j*E.L/nu; shapeP(B.p(M.WHITE), rectO(u - 0.04, u + 0.04, 0.6, Y2), E.F, 0.02); }
      for (let v = 1.8; v < Y2; v += 1.2) shapeP(B.p(M.WHITE), rectO(0, E.L, v - 0.04, v + 0.04), E.F, 0.02);
      slabP(B.p(M.WHITE), rectO(-0.05, E.L + 0.05, Y1 - 0.2, Y1 + 0.3), E.F, 0, 0.35);
      slabP(B.p(M.WHITE), rectO(-0.05, E.L + 0.05, Y2 - 0.1, Y2 + 0.45), E.F, 0, 0.5); }
    parP(B.p(M.BLUE), P, Y2, Y2 + 1.3, 0.35); bandP(B.p(M.WHITE), offP(P, -0.05), Y2 + 1.3, 0.2, 0.1);
    // ground floor: rectangular windows with lattice infill; first floor: verandah arcades of pointed arches on three sides
    for (const E of edgesF(P)){ if (E.L < 5) continue; const k = Math.max(1, Math.round(E.L/3.4));
      for (let j = 0; j < k; j++){ const u = (j + 0.5)*E.L/k;
        shapeP(B.p(M.WIN), rectO(u - 0.7, u + 0.7, 1.4, 3.6), E.F, 0.06);
        for (let i = 0; i < 4; i++) shapeP(B.p(M.WHITE), rectO(u - 0.7, u + 0.7, 1.5 + i*0.55, 1.58 + i*0.55), E.F, 0.08);
        shapeP(B.p(M.DARK), mv(pArchO(1.05, 5.6, 5), u, Y1 + 0.8), E.F, 0.06);
        slabP(B.p(M.WHITE), mv(pArchO(1.3, 6.0, 5), u, Y1 + 0.6).concat(), E.F, 0.0, 0.04);
        shapeP(B.p(M.DARK), mv(pArchO(1.05, 5.6, 5), u, Y1 + 0.8), E.F, 0.07);
        { const q = E.F(j*E.L/k + 0.01, 0, 0.15); if (j > 0) boxP(B.p(M.WHITE), 0.45, 6.6, 0.45, q[0], Y1 + 0.3, q[2], -E.ang); } } }
    // projecting balconies on the two street fronts (Victoria Street SE, Jalan Sultan NE)
    for (const [u0, u1, v, s] of [[-12, -4, 13.2, 1], [4, 12, 13.2, 1]]){ const Q = Fr.rect(u0, u1, v, v + 1.4*s); prismP(B.p(M.WHITE), Q, Y1 + 0.3, Y1 + 0.7, true); parP(B.p(M.WHITE), Q, Y1 + 0.7, Y1 + 1.8, 0.15); }
    // chatris at the parapet corners: four slender columns and a small golden dome
    const chat = (u, v, r) => { const c = Fr.X(u, v); for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) LBox(g, 0.25, 2.2, 0.25, c[0] + a*r*0.7, Y2 + 1.3, c[1] + b*r*0.7, M.WHITE);
      LCyl(g, r, r, 0.3, c[0], Y2 + 3.5, c[1], M.WHITE, 8); LLathe(g, onion(r*0.85).map(p => [p[0], p[1]]), c[0], Y2 + 3.8, c[1], M.GOLD, 10); }
    for (const [u, v] of [[-17.5, 12.0], [-17.5, -10.5], [0, 12.5], [-6, -13.5]]) chat(u, v, 0.9);
    // main dome: blue-tiled drum with arched lights, golden onion dome, crescent and star
    const C0 = Fr.X(-1.5, -0.5);
    LCyl(g, 5.2, 5.4, 1.0, C0[0], Y2, C0[1], M.WHITE, 16);
    LCyl(g, 4.6, 4.6, 3.6, C0[0], Y2 + 1.0, C0[1], M.BLUE, 16);
    for (let i = 0; i < 12; i++){ const a = i/12*TAU, F = fA(C0[0] + Math.cos(a)*4.62, C0[1] + Math.sin(a)*4.62, a + HP); shapeP(B.p(M.DARK), pArchO(0.45, 2.2, 4).map(p => [p[0], p[1] + Y2 + 1.6]), F, 0); }
    LCyl(g, 4.9, 4.9, 0.4, C0[0], Y2 + 4.6, C0[1], M.WHITE, 16);
    LLathe(g, onion(4.0), C0[0], Y2 + 5.0, C0[1], M.GOLD, 24);
    const fin = (x, y, z, s) => { LCyl(g, 0.08*s, 0.12*s, 1.6*s, x, y, z, M.GOLD, 6); LSph(g, 0.22*s, x, y + 1.0*s, z, M.GOLD, 1, 8);
      LShape(g, CRES.map(p => [p[0]*s, p[1]*s]), 0.1, x, y + 1.9*s, z, M.GOLD); }
    fin(C0[0], Y2 + 5.0 + 9.4, C0[1], 1.3);
    // smaller dome on a platform over the south-eastern section (left of the main dome seen from Victoria Street)
    const C1 = Fr.X(-12, 7.5);
    LBox(g, 6, 1.6, 6, C1[0], Y2, C1[1], M.BLUE, 38.3*PI/180); LBox(g, 6.4, 0.3, 6.4, C1[0], Y2 + 1.6, C1[1], M.WHITE, 38.3*PI/180);
    LCyl(g, 2.3, 2.3, 1.4, C1[0], Y2 + 1.9, C1[1], M.BLUE, 12);
    LLathe(g, onion(2.1), C1[0], Y2 + 3.3, C1[1], M.GOLD, 16); fin(C1[0], Y2 + 3.3 + 4.9, C1[1], 0.8);
    // octagonal minaret to the right of the main dome, at the street corner: tiered shaft, balconies, golden cap
    const C2 = Fr.X(13.5, 9.0);
    const oct = (r, y0, h, col) => LCyl(g, r, r, h, C2[0], y0, C2[1], col, 8);
    oct(2.2, 0.6, Y2 + 1.3 - 0.6, M.BLUE); oct(2.5, Y2 + 1.3, 0.4, M.WHITE);
    oct(1.75, Y2 + 1.7, 6.0, M.BLUE); oct(2.3, Y2 + 7.7, 0.35, M.WHITE);
    for (let i = 0; i < 8; i++){ const a = i/8*TAU + PI/8; LBox(g, 0.2, 1.0, 0.2, C2[0] + Math.cos(a)*2.15, Y2 + 8.05, C2[1] + Math.sin(a)*2.15, M.WHITE); }
    oct(2.3, Y2 + 9.05, 0.25, M.WHITE);
    oct(1.35, Y2 + 9.3, 3.4, M.BLUE);
    for (let i = 0; i < 8; i++){ const a = i/8*TAU + PI/8, F = fA(C2[0] + Math.cos(a)*1.3, C2[1] + Math.sin(a)*1.3, a + HP); shapeP(B.p(M.DARK), pArchO(0.3, 1.8, 4).map(p => [p[0], p[1] + Y2 + 10.0]), F, 0.02); }
    oct(1.6, Y2 + 12.7, 0.3, M.WHITE);
    LLathe(g, onion(1.45), C2[0], Y2 + 13.0, C2[1], M.GOLD, 12); fin(C2[0], Y2 + 13.0 + 3.4, C2[1], 0.65);
    // external staircase up to the first floor on the Victoria Street front
    { for (let i = 0; i < 12; i++){ const u = 2 - i*0.55; rectPrism(B.p(M.WHITE), Fr, u - 0.55, u, 13.3, 15.6, 0.6, 0.6 + (i + 1)*Y1/12); } parP(B.p(M.WHITE), Fr.rect(-4.6, 2, 13.3, 15.6), 0.6, 1.4, 0.1); }
    // lamps along the parapet for the night look
    for (const [x, z] of alongP(P, 4)) boxP(B.p(M.LAMP), 0.25, 0.35, 0.25, x, Y2 + 1.5, z);
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'sgmalabar', lat:1.305114, lon:103.859789, rot:0});
