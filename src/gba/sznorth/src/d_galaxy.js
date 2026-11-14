
// ================= Galaxy WORLD twin towers, Bantian (AECOM, completed 2023) =================
// Facts: two identical towers, 356 m architectural / to tip, occupied 329.1 m, 74 floors (CTBUH Skyscraper Center; OSM / gooood give
// 369 m / 73 floors); a smooth, jade-like body "like a spring shoot" that narrows slightly as the core steps in; the corner chamfers grow
// from mid-height up, so the plan is nearly square low down and nearly round high up; horizontal twisting metal ribbons wrap the towers
// and read as a double helix on the skyline, cut from eight mould sets per tower (gooood "Shenzhen Galaxy World Twin Towers / AECOM";
// AECOM project page); opened 31 Mar 2023 (Wikipedia). Footprints OSM w1190193566 (west) / w1190193567 (east): rounded squares
// ~65 m across, 118 m apart. The crown above the top floor and the ribbon pitch are interpretive. Night: lit offices, the crown glows
// (slow colour drift), red aviation lights.
LANDMARKS.szgalaxy = {zh:'星河WORLD', en:'Galaxy World Towers', cat:'new', r:105, h:356,
  lt:{m:1, c:'#dfe9ff', k:0.65, fh:4.45, anim:'cycle', c2:'#9fd2ff'},
  build(){
    const g = new THREE.Group(), B = mkB(), GD = D.gal;
    const GL = {c:'#8d9ca7', m:1, fh:4.45, cw:3.0}, RIB = {c:'#dcdedd', m:0, lk:0.4, lc:'#e6f0ff'},
      CROWN = {c:'#b9c3c9', m:0, lk:0.9, lc:'#e8f2ff', glow:'#a8c8f0', gk:0.35}, LOB = {c:'#4a5862', glow:'#ffe2b8', gk:0.75}, ROOF = '#7d858b', STONE = '#c9c3b6';
    const HT = 356, HO = 329.1, NP = 64;
    // plan: rounded square, half width a, corner radius rc (rc = a gives a circle), n points
    const plan = (cx, cz, a, rc, n) => { const P = [], q = n/4;
      for (let s = 0; s < 4; s++){ const ca = s*PI/2 + PI/4, ox = Math.cos(ca)*(a - rc)*Math.SQRT2, oz = Math.sin(ca)*(a - rc)*Math.SQRT2;
        for (let k = 0; k < q; k++){ const t = ca - PI/4 + PI/2*k/q; P.push([cx + ox + Math.cos(t)*rc, cz + oz + Math.sin(t)*rc]); } }
      return P; };
    const planPt = (cx, cz, a, rc, i, n) => { const q = n/4, s = (i/q) | 0, k = i - s*q, ca = s*PI/2 + PI/4, t = ca - PI/4 + PI/2*k/q;
      return [cx + Math.cos(ca)*(a - rc)*Math.SQRT2 + Math.cos(t)*rc, cz + Math.sin(ca)*(a - rc)*Math.SQRT2 + Math.sin(t)*rc]; };
    // the body narrows slightly; the chamfer grows from mid-height; above the top floor the crown closes in
    const A = y => y <= HO ? 32.4 - 3.0*Math.pow(y/HO, 1.6) : lerp(29.4, 24, Math.pow((y - HO)/(HT - HO), 1.3));
    const RC = y => { const a = A(y); if (y <= HO*0.45) return 16.5; const t = sm((y - HO*0.45)/(HO*0.55)); return lerp(16.5, a*0.96, t); };
    for (const [cx, cz] of [GD.cw, GD.ce]){
      const ys = []; for (let y = 0; y <= HO + 0.01; y += HO/48) ys.push(y);
      const rings = ys.map(y => plan(cx, cz, A(y), Math.min(RC(y), A(y)), NP).map(p => [p[0], y, p[1]]));
      loft(B.p(GL), rings.slice(1));
      prism(B.p(LOB), plan(cx, cz, A(0) - 2.5, 14, NP), 0, ys[1] + 0.4, false);
      prism(B.p(STONE), plan(cx, cz, A(0) + 4, 18, NP), -1.0, 0.25, true);
      // the double helix: two families of horizontal ribbons every two floors, rising and falling round the tower in opposite phase
      for (let y0 = 12; y0 < HO - 4; y0 += 8.9) for (const ph of [0, PI]){
        const pts = []; for (let i = 0; i <= NP; i++){ const th = i/NP*TAU, y = y0 + 2.6*Math.sin(2*th + ph + y0*0.021), a = A(y) + 0.15, rc = Math.min(RC(y), a), P = planPt(cx, cz, a, rc, i % NP, NP);
          const dx = P[0] - cx, dz = P[1] - cz, l = Math.hypot(dx, dz) || 1; pts.push([P[0], y, P[1], dx/l, dz/l]); }
        for (let i = 0; i < NP; i++){ const p = pts[i], q = pts[i + 1], d = 1.1, h = 0.55;
          q4(B.p(RIB), [p[0], p[1], p[2]], [q[0], q[1], q[2]], [q[0] + q[3]*d, q[1] + h*0.3, q[2] + q[4]*d], [p[0] + p[3]*d, p[1] + h*0.3, p[2] + p[4]*d]);
          q4(B.p(RIB), [p[0] + p[3]*d, p[1] + h*0.3, p[2] + p[4]*d], [q[0] + q[3]*d, q[1] + h*0.3, q[2] + q[4]*d], [q[0] + q[3]*d, q[1] + h, q[2] + q[4]*d], [p[0] + p[3]*d, p[1] + h, p[2] + p[4]*d]); } }
      // crown: the glazed body closes in above the top floor, a lit band, a slim mast ring
      const cy = []; for (let y = HO; y <= HT - 5 + 0.01; y += 3.0) cy.push(y);
      loft(B.p(CROWN), cy.map(y => plan(cx, cz, A(y), Math.min(RC(y), A(y)), NP).map(p => [p[0], y, p[1]])), false);
      flat(B.p(ROOF), plan(cx, cz, A(HT - 5) - 0.5, A(HT - 5) - 0.5, NP), HT - 5.2);
      seg(B.p(RIB), [cx, HT - 5, cz], [cx, HT, cz], 0.8, 8);
      abox(B.p(RED), cx - 0.6, cx + 0.6, HT, HT + 1.0, cz - 0.6, cz + 0.6);
      const RL = plan(cx, cz, A(HT - 5), A(HT - 5), 8); for (const p of RL) abox(B.p(RED), p[0] - 0.45, p[0] + 0.45, HT - 5, HT - 4.2, p[1] - 0.45, p[1] + 0.45);
      sprites(g, [cx, HT + 1.2, cz].concat(...RL.map(p => [p[0], HT - 4.2, p[1]])), [1, 0.12, 0.08], 7);
    }
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'szgalaxy', lat:PLC.szgalaxy.lat, lon:PLC.szgalaxy.lon, rot:PLC.szgalaxy.rot});
