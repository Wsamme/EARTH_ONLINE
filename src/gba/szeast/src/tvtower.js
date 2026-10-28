// ================= Wutong Shan TV Tower (深圳电视塔), Small Wutong, 2005-2010 =================
// 198 m tall on the Small Wutong summit (~640 m): hot-dip galvanised steel, concrete-filled steel tubes with high-strength bolted
// joints, "long mast, low tower body" (长桅杆低塔身); sections: tower body, tower building, shaft (Sina 2005-12-28, 2010-12-28;
// shenchuang 2019). On the round OSM footprint w275168893 (49 m across, read as its podium). The proportions of body, tower
// building and mast below follow that description; the lattice pattern and the podium height are estimates (no drawings found).
// Night: cool floodlight on the steel, glowing tower-building glass, red aviation lights.
LANDMARKS.szwutongtv = {zh:'梧桐山电视塔', en:'Wutong Shan TV Tower', cat:'new', r:30, h:200,
  lt:{m:0, c:'#d8e6ff', k:1.1, e:0.35},
  build(){
    const g = new THREE.Group(), B = mkB(), d = D.szwutongtv, gT = mkT(d.T), BASE = baseOf(gT, 30), gy = (x, z) => gT(x, z) - BASE;
    const STL = {c:'#aeb3b6', lc:'#dce8ff', lk:1.2}, STL2 = {c:'#8e9499', lc:'#dce8ff', lk:1.0}, GL = {c:'#5f7c8c', glow:'#bfe2ff', gk:0.55}, POD = '#d4d6d2', CON = '#b9b6ae';
    const R0 = d.ring, lo = Math.min(...R0.map(p => gy(p[0], p[1]))) - 3, YP = 0.3;
    // ---- podium: stone base to the slope, two glazed storeys, flat roof
    wallP(B.p(CON), offP(R0, -0.8), lo, YP); capP(B.p(CON), offP(R0, -0.8), YP);
    const R1 = offP(R0, 0.6); wallP(B.p(GL), R1, YP, YP + 8.6); capP(B.p(POD), R1, YP + 9.2); wallP(B.p(POD), R1, YP + 8.6, YP + 9.2);
    for (const e of edgesF(R1)) segP(B.p(POD), e.F(0, YP, 0.2), e.F(0, YP + 8.6, 0.2), 0.25, 4);
    wallP(B.p(POD), R1, YP + 4.1, YP + 4.6);
    // ---- tower body: four tubular legs tapering from 13 m off-centre at the podium roof to 4.5 m at 96 m, K-bracing, central shaft
    const Y0 = YP + 9.2, Y1 = 96, legR = y => lerp(13, 4.5, Math.pow((y - Y0)/(Y1 - Y0), 0.8));
    latheP(B.p(CON), [[3.0, Y0], [3.0, Y1 + 2]], 0, 0, 12);
    const lvl = []; for (let i = 0; i <= 12; i++) lvl.push(lerp(Y0, Y1, i/12));
    const leg = (k, y) => { const r = legR(y), a = PI/4 + k*HP; return [Math.cos(a)*r, y, Math.sin(a)*r]; };
    for (let k = 0; k < 4; k++){
      for (let i = 0; i < 12; i++) segP(B.p(STL), leg(k, lvl[i]), leg(k, lvl[i+1]), 0.75, 8);
      for (let i = 0; i <= 12; i++) segP(B.p(STL2), leg(k, lvl[i]), leg((k + 1) % 4, lvl[i]), 0.32, 6);
      for (let i = 0; i < 12; i++){ const a = leg(k, lvl[i]), b = leg((k + 1) % 4, lvl[i]), m = [(leg(k, lvl[i+1])[0] + leg((k + 1) % 4, lvl[i+1])[0])/2, lvl[i+1], (leg(k, lvl[i+1])[2] + leg((k + 1) % 4, lvl[i+1])[2])/2];
        segP(B.p(STL2), a, m, 0.26, 5); segP(B.p(STL2), b, m, 0.26, 5); }
      for (let i = 2; i <= 12; i += 3) segP(B.p(STL2), leg(k, lvl[i]), [0, lvl[i], 0], 0.22, 4);
    }
    // ---- tower building on top of the body: glazed drum with equipment storeys, gallery and roof deck
    { const y = Y1, r = 9.5;
      latheP(B.p(POD), [[4.5, y - 3], [r + 1.2, y], [r + 1.2, y + 0.8]], 0, 0, 24); capP(B.p(POD), ringPts(0, 0, r + 1.2, 24), y + 0.8);
      latheP(B.p(GL), [[r, y + 0.8], [r, y + 10.8]], 0, 0, 24);
      for (let k = 0; k < 24; k++){ const a = k/24*TAU; segP(B.p(POD), [Math.cos(a)*r*1.01, y + 0.8, Math.sin(a)*r*1.01], [Math.cos(a)*r*1.01, y + 10.8, Math.sin(a)*r*1.01], 0.15, 4); }
      for (const yy of [y + 4.2, y + 7.6]) latheP(B.p(POD), [[r + 0.9, yy], [r + 0.9, yy + 0.45]], 0, 0, 24);
      latheP(B.p(POD), [[r + 0.4, y + 10.8], [r + 0.4, y + 11.6], [r - 1.0, y + 12.4], [5.5, y + 12.6]], 0, 0, 24); capP(B.p(POD), ringPts(0, 0, 5.5, 24), y + 12.6);
    }
    // ---- the long mast: three tapering galvanised tube stages to 198 m, platforms and antenna panels
    { const y0 = Y1 + 12.6, stages = [[y0, 140, 2.6, 1.8], [140, 172, 1.6, 1.0], [172, 196.5, 0.8, 0.45]];
      for (const [ya, yb, ra, rb] of stages){
        const n = Math.round((yb - ya)/4);
        for (let i = 0; i < n; i++){ const t0 = i/n, t1 = (i + 1)/n, r0 = lerp(ra, rb, t0), r1 = lerp(ra, rb, t1), y = lerp(ya, yb, t0), yy = lerp(ya, yb, t1), band = Math.floor((y - y0)/8) % 2;
          latheP(B.p(band ? STL2 : STL), [[r0, y], [r1, yy]], 0, 0, 8); }
        latheP(B.p(STL2), [[ra + 1.4, ya], [ra + 1.4, ya + 0.5]], 0, 0, 12); capP(B.p(STL2), ringPts(0, 0, ra + 1.4, 12), ya + 0.5);
        for (let k = 0; k < 6; k++){ const a = k/6*TAU; for (let y = ya + 3; y < yb - 2; y += 6) boxP(B.p(STL), 0.5, 2.2, 0.25, Math.cos(a)*(lerp(ra, rb, (y - ya)/(yb - ya)) + 0.3), y, Math.sin(a)*(lerp(ra, rb, (y - ya)/(yb - ya)) + 0.3), -a); }
      }
      segP(B.p(STL), [0, 196.5, 0], [0, 198, 0], 0.12, 4);
      for (const y of [198, 172, 140, Y1 + 12.6]) LSph(g, 0.6, 0, y + 0.2, 0, AVI, 1, 6);
      for (let k = 0; k < 4; k++){ const a = PI/4 + k*HP; LSph(g, 0.5, Math.cos(a)*10.4, Y1 + 11.8, Math.sin(a)*10.4, AVI, 1, 6); }
    }
    B.flush(g);
    return g;
  }};
SG_PLACES.push({type:'szwutongtv', lat:22.570988, lon:114.188777, rot:0});
