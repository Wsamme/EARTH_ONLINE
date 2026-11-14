// ================= Vanke Center, Dameisha (Steven Holl Architects, 2006-2009) =================
// The "horizontal skyscraper": one long bent bar floating over a public tropical garden, raised on eight cores (up to 50 m
// apart, cantilevers ~25 m; Wikipedia, Structurae) under the site's 35 m height limit; glass curtain wall behind a second skin of
// perforated aluminium louvres (fixed, varied and sensor-moved; 26 faces); planted roof ~15 000 m2 with 1 400 m2 of photovoltaic
// panels; the underside is the main elevation with the sunken glass "Shenzhen windows"; the conference centre lies under a
// planted mound in the garden (OSM w995102896, amenity=conference_centre). The bar is the real OSM footprint w247777666 (16 100 m2,
// building "水平摩天楼"; the target's OSM area w1210907099 is the whole site, tagged school). Estimates: underside at 14 m, roof at
// 34.5 m; the eight core positions are spread along the wings (not surveyed). Night: lit glass behind the louvres.
LANDMARKS.szvanke = {zh:'万科中心', en:'Vanke Center (Dameisha)', cat:'new', r:210, h:36,
  lt:{m:1, c:'#ffe2b8', k:0.55, fh:4.2, cw:3.0},
  build(){
    const g = new THREE.Group(), B = mkB(), d = D.szvanke, gT = mkT(d.T), BASE = baseOf(gT, 210), gy = (x, z) => gT(x, z) - BASE, rng = LMCTX.rng;
    const P = d.ring, g0 = gy(0, 0);
    const YB = g0 + 14, YT = g0 + 34.5;
    const GLASS = {c:'#4d6470', m:1, fh:4.2, cw:3.0}, LOUV = {c:'#c4c7c4', ds:true}, CORE = '#9c9a94', UND = '#2f3c55', ROOF = '#6f8c52', PV = {c:'#2a3550', glow:'#000000', gk:0}, CUBE = {c:'#7fa0b2', op:0.75, glow:'#ffd49a', gk:0.5}, MOUND = '#6f9455', EDGE = '#d8d4c8', POOL = {c:'#5d8fa3', glow:'#203848', gk:0.2}, FR = '#7c7f80';
    // ---- the bar: glazed walls, slab edges, the underside, the planted roof
    wallP(B.p(GLASS), P, YB, YT);
    const E = edgesF(P);
    for (let y = YB; y <= YT + 0.01; y += 4.1) for (const e of E) quadP(B.p(FR), e.F(0, y - 0.35, 0.15), e.F(e.L, y - 0.35, 0.15), e.F(e.L, y + 0.15, 0.15), e.F(0, y + 0.15, 0.15));
    capP(B.p(UND), P, YB); capP(B.p(ROOF), P, YT);
    wallP(B.p(EDGE), offP(P, -0.3), YT, YT + 0.9); wallP(B.p(EDGE), offP(P, -0.3), YB - 0.6, YB);
    // louvre skin: perforated aluminium panels per storey and bay, some open at an angle
    for (const e of E){ const nb = Math.max(1, Math.round(e.L/1.5));
      for (let y = YB + 0.4; y < YT - 1; y += 4.1) for (let k = 0; k < nb; k++){ const u = (k + 0.5)*e.L/nb, open = rng(); if (open < 0.18) continue;
        const tw = open < 0.45 ? 0.6 : 0, p = e.F(u, y, 0.75), w = e.L/nb*0.92;
        boxP(B.p(LOUV), w, 3.5, 0.06, p[0], y, p[2], -(e.ang + tw)); } }
    // the "Shenzhen windows": glass boxes sunk below the underside
    { let k = 0; for (const e of E){ if (e.L < 20) continue; for (let u = 14; u < e.L - 10; u += 34){ const p = e.F(u, 0, -7); if (!pip(P, p[0], p[2])) continue;
        boxP(B.p(CUBE), 7, 3.2, 7, p[0], YB - 3.2, p[2], -e.ang); boxP(B.p(FR), 7.3, 0.3, 7.3, p[0], YB - 3.3, p[2], -e.ang); k++; } } }
    // photovoltaic arrays on the roof (1 400 m2) in rows
    { const rows = [[-120, 80], [-95, 40], [-70, 0], [30, -95], [60, -115], [75, -60]]; let area = 0;
      for (const [x, z] of rows){ for (let i = -3; i <= 3; i++){ const px = x + Math.cos(0.95)*i*3.2, pz = z + Math.sin(0.95)*i*3.2; if (!pip(offP(P, 2), px, pz) || area > 1400) continue; boxP(B.p(PV), 2.4, 0.5, 9, px, YT + 0.3, pz, -0.95 - HP); area += 21.6; } } }
    // ---- the eight cores (concrete) from the garden up to the bar, stair / lift shafts glazed in slots
    for (const [x, z] of [[60.0, -28.0], [90.3, -132.7], [-40.7, -41.2], [-48.0, 98.4], [-77.0, 20.4], [-110.0, 72.0], [-1.4, 76.1], [22.0, -72.0]]){
      const lo = Math.min(gy(x - 5, z - 5), gy(x + 5, z + 5), gy(x, z)) - 2; let ang = 0, db = 1e9;
      for (const e of E){ const dd = dSeg(x, z, e.a, e.b); if (dd < db){ db = dd; ang = e.ang; } }
      boxP(B.p(CORE), 10, YB - lo, 9, x, lo, z, -ang);
      for (const s of [-1, 1]){ const c = Math.cos(ang), sn = Math.sin(ang); boxP(B.p(GLASS), 0.4, YB - lo - 4, 2.2, x + c*s*5.05, lo + 3, z + sn*s*5.05, -ang); }
    }
    // ---- the garden: the conference-centre mound (real footprint) with its glazed edge, pools beside it
    { const Q = d.sq, [lo] = groundSpan(gy, Q), M = offP(Q, -2.5);
      wallP(B.p(CUBE), Q, lo - 1, lo + 2.6); capP(B.p(EDGE), Q, lo + 2.6);
      const C = ctr(Q); for (let i = 0; i < M.length; i++){ const a = M[i], b = M[(i+1) % M.length]; quadP(B.p(MOUND), [a[0], lo + 2.6, a[1]], [b[0], lo + 2.6, b[1]], [C[0], lo + 6.5, C[1]], [C[0], lo + 6.5, C[1]]); }
    }
    B.flush(g);
    return g;
  }};
SG_PLACES.push({type:'szvanke', lat:22.600693, lon:114.299829, rot:0});
