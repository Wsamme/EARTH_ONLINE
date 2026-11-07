

// ======================================================================================================
// Faber Peak — the Mount Faber station of the Singapore Cable Car (wikipedia: track 93 m above sea level; remontees-mecaniques:
// the line's drive station, Doppelmayr Uni-G; the 2005 "Jewel Box" refurbishment, thesmartlocal: its exterior façade lit by
// twinkling lights and changing colour washes at night) with its restaurants on the summit. Plan = OSM w184389542 split into its
// wings: the north block and the middle block (two storeys), the station hall at the south end whose mouth faces the harbour
// (the ropes leave south-south-west for the Seah Im Road tower, 80 m asl, 300 m away), the long south-east arm, the west
// wing (Arbora restaurant POI) and its small annex w176204468, all stepping with the real slope of the hill (the app terrain is baked in). Glazed walls in
// white frames, roof terraces with glass balustrades, a shallow barrel roof over the station hall with the bull-wheel inside.
// Night: lit glazing and the façade wash cycling (anim 'cycle').
// ======================================================================================================
{
const LAT = 1.271214, LON = 103.819462, RR = 76;
const TER = {X0:-2842.14, Y0:-4841.59, i0:357, j0:328, nx:6, ny:6, H:[501,562,584,563,507,431,614,701,742,727,664,568,691,808,877,882,821,709,719,864,966,997,947,827,701,865,992,1048,1011,890,650,815,952,1021,994,879]};
const NB = [[-28.3,-18.4],[-26.5,-28.5],[8.7,-23.2],[6.9,-7.8],[-24.1,-6.6]];
const MB = [[-24.1,-6.6],[6.9,-7.8],[11.1,-6.0],[11.7,-1.2],[4.5,10.6],[-14.6,8.8],[-25.9,7.1]];
const SH = [[-14.6,8.8],[4.5,10.6],[2.7,26.0],[-16.4,23.7]];
const WW = [[-53.4,-16.7],[-35.5,-19.0],[-28.3,-18.4],[-24.1,-6.6],[-45.6,-9.5],[-53.4,-13.1],[-54.0,-14.9]];
const FX = [[-39.7,-23.2],[-40.3,-18.4],[-50.4,-17.3],[-58.8,-17.8],[-57.6,-25.0]];   // OSM w176204468 (h 6, est), the annex north of the west wing
const SE = [[11.7,-1.2],[21.8,6.5],[24.2,3.5],[61.2,13.6],[52.9,24.9],[12.3,14.8],[7.5,11.2],[4.5,10.6]];
LANDMARKS.sgfaberpeak = {zh:'花柏山顶（缆车站）', en:'Faber Peak (Mount Faber Cable Car Station)', cat:'new', r:RR, h:9, lt:{m:0, c:"#fff0da", k:0.7, e:0.6, anim:'cycle', c2:'#b896ff'}, build(){
  const g = new THREE.Group(), B = mkB(), {gl} = groundK(TER, LAT, LON, RR);
  const WH = {c:'#eeeeea', m:0, lk:0.55}, GLS = {c:'#86a9b6', glow:'#ffe4bd', gk:0.32}, RF = {c:'#a9aba6', m:0, lk:0.1}, BASE = {c:'#b6ad9c', m:0, lk:0.2};
  const RAIL = {c:'#cfe3e8', op:0.45, ds:true}, STL = {c:'#5f6266', m:0, lk:0.15}, DECK = {c:'#c9c3b6', m:0, lk:0.1};
  const CC = {rope:'#3b3d41', body:{c:'#26282c', m:0, lk:0}, win:{c:'#9aa7b0', glow:'#ffe2b0', gk:0.35}, hang:{c:'#b9bdc1', m:0, lk:0.2}};
  // a glazed wing: white base course and slab edges, glass between, flat roof with a terrace balustrade
  const wing = (P, yg, H, fl, terr) => {
    const yb = minG(gl, P) - 1.5;
    wallP(B.p(BASE), P, yb, yg + 0.6);
    wallP(B.p(GLS), P, yg + 0.6, yg + H);
    flatPoly(B.p(RF), P, yg + H);
    for (let k = 1; k < fl; k++) edgeBands(B.p(WH), P, yg + k*H/fl - 0.45, yg + k*H/fl + 0.3, 0.12);
    edgeBands(B.p(WH), P, yg + H - 0.8, yg + H + 0.25, 0.14);
    edgeFins(B.p(WH), P, yg + 0.6, yg + H, 3.6, 0.22, 0.25);
    if (terr){ edgeBands(B.p(RAIL), P, yg + H + 0.25, yg + H + 1.3, -0.3); flatPoly(B.p(DECK), offRing(P, -0.4), yg + H + 0.05); }
  };
  const yN = gl(-10, -17), yM = gl(-6, 1), yS = gl(-6, 17), yW = gl(-40, -14), yE = gl(32, 12);
  wing(NB, yN, 9.6, 2, true);
  wing(MB, Math.min(yM, yN - 1.2), 9.6, 2, true);
  wing(WW, yW, 5.2, 1, true);
  wing(SE, yE, 6.0, 1, true);
  wing(FX, gl(-49, -21), 5.0, 1, false);
  // ---- station hall: lower level (arrivals, shops), the platform level and a shallow barrel roof over the cabin loop
  { const yb = minG(gl, SH) - 2, y0 = Math.min(yS, yM - 1), yP = y0 + 5.2, yR = y0 + 13.2;
    wallP(B.p(BASE), SH, yb, y0 + 0.6); wallP(B.p(GLS), SH, y0 + 0.6, yP); edgeBands(B.p(WH), SH, yP - 0.6, yP + 0.3, 0.14);
    flatPoly(B.p(RF), SH, yP);
    // the hall: posts and glazed sides on the long edges, open mouth at the south end
    const ax = [(-16.4 + 2.7)/2 - (-14.6 + 4.5)/2, (23.7 + 26.0)/2 - (8.8 + 10.6)/2], L = Math.hypot(ax[0], ax[1]), d = [ax[0]/L, ax[1]/L], n = [-d[1], d[0]];
    const c = cen(SH), hu = L/2 + 1.2, hv = 10.2, nb = 14;
    const gls = B.p(GLS), wh = B.p(WH), rf = B.p(RF);
    for (let i = 0; i < nb; i++){
      const t0 = i/nb, t1 = (i+1)/nb, th0 = lerp(-1, 1, t0), th1 = lerp(-1, 1, t1);
      const P = (u, th) => { const v = hv*th, y = yR - 3.0*th*th; return [c[0] + d[0]*u + n[0]*v, y, c[1] + d[1]*u + n[1]*v]; };
      quadP(rf, P(-hu, th0), P(hu, th0), P(hu, th1), P(-hu, th1));
    }
    for (const s of [-1, 1]){ const a = [c[0] - d[0]*hu + n[0]*hv*s, c[1] - d[1]*hu + n[1]*hv*s], b = [c[0] + d[0]*hu + n[0]*hv*s, c[1] + d[1]*hu + n[1]*hv*s];
      quadP(gls, [a[0], yP, a[1]], [b[0], yP, b[1]], [b[0], yR - 3.2, b[1]], [a[0], yR - 3.2, a[1]]);
      for (let k = 0; k <= 5; k++){ const t = k/5, p = [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]; boxP(wh, 0.4, yR - 3 - yP, 0.4, p[0], yP, p[1], 0); }
      barP(wh, a, b, 0.5, 0.6, yR - 3.4); }
    // barrel ribs
    for (let k = 0; k <= 6; k++){ const u = lerp(-hu, hu, k/6), pts = []; for (let j = 0; j <= 8; j++){ const th = lerp(-1, 1, j/8); pts.push([c[0] + d[0]*u + n[0]*hv*th, yR - 3.0*th*th + 0.25, c[1] + d[1]*u + n[1]*hv*th]); } polyP(wh, pts, 0.22, 4); }
    // the bull-wheel (drive) at the back of the hall and the rope loop round it, platforms either side
    const yc = yP + 4.4, back = [c[0] - d[0]*(hu - 3), yc, c[1] - d[1]*(hu - 3)];
    { const st = B.p(STL), k = 20, R = 2.8; const ring = []; for (let i = 0; i <= k; i++){ const a = i/k*TAU; ring.push([back[0] + n[0]*Math.cos(a)*R + d[0]*Math.sin(a)*R, yc, back[2] + n[1]*Math.cos(a)*R + d[1]*Math.sin(a)*R]); }
      polyP(st, ring, 0.18, 4); segP(st, [back[0], yP, back[2]], [back[0], yc, back[2]], 0.5, 6); }
    for (const s of [-1, 1]){ flatPoly(B.p(DECK), rectR([c[0] + n[0]*s*4.6, c[1] + n[1]*s*4.6], d, hu - 1, 1.6), yP + 0.05); }
    // ropes out of the mouth towards HarbourFront, cabins in the hall and on the ropes
    const dd = dirTo(STN.faber, STN.hf), mouth = [c[0] + d[0]*hu, yc, c[1] + d[1]*hu];
    cableStub(B, [back[0], yc, back[2]], d, 2*hu - 3, 0, 5.6, CC, [[0.35, -1], [0.7, 1], [0.5, 1]]);
    cableStub(B, mouth, dd, 26, -0.043, 5.6, CC, [[0.7, -1]]);
  }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'sgfaberpeak', lat:1.271214, lon:103.819462, rot:0});
}

// ======================================================================================================
// Sentosa Station of the Mount Faber Line on Imbiah hill (wikipedia: track 47 m asl; remontees-mecaniques: the bottom station,
// hydraulic tension station, with the cabin garage and the cable car museum). Plan = OSM w159637725: the long hall (51 x 18 m)
// on the line's axis, which the ropes enter at its north mouth from the Sentosa tower (88 m asl, 450 m away), the south block,
// and the attached two-storey shop block w159637728 (OSM 2 floors). Lower level in buff render with glazed openings, the
// platform hall above under a shallow pitched metal roof on white posts, the tension carriage at the south end.
// ======================================================================================================
{
const LAT = 1.255436, LON = 103.817702, RR = 57;
const TER = {X0:-3038.01, Y0:-6586.23, i0:354, j0:304, nx:6, ny:5, H:[400,465,481,442,364,268,442,510,525,482,396,292,438,502,516,475,391,291,394,449,462,427,355,268,321,364,376,351,297,228]};
const HALL = [[-12.1,17.8],[-6.8,-33.2],[-5.0,-33.2],[-4.4,-36.2],[5.2,-35.0],[4.6,-32.0],[11.7,-30.9],[6.4,19.0]];
const SOUTH = [[6.4,19.0],[11.1,20.1],[14.7,23.1],[15.9,27.3],[14.7,37.9],[9.3,37.3],[10.5,27.8],[-18.1,24.9],[-17.5,17.2],[-12.1,17.8]];
const SHOP = [[-16.3,8.3],[-18.1,24.9],[10.5,27.8],[9.3,37.3],[0.4,36.7],[-0.2,39.7],[-10.4,39.1],[-9.8,35.0],[-30.1,33.2],[-28.3,15.4],[-25.9,15.4],[-24.7,7.7]];
LANDMARKS.sgsentosastn = {zh:'圣淘沙缆车站', en:'Sentosa Cable Car Station (Imbiah)', cat:'new', r:RR, h:11, lt:{m:0, c:"#fff0da", k:0.6, e:0.6}, build(){
  const g = new THREE.Group(), B = mkB(), {gl} = groundK(TER, LAT, LON, RR);
  const WH = {c:'#efefea', m:0, lk:0.45}, REN = {c:'#d9cfb8', m:0, lk:0.35}, GLS = {c:'#86a9b6', glow:'#ffe4bd', gk:0.32}, RF = {c:'#8f9497', m:0, lk:0.1};
  const BASE = {c:'#b6ad9c', m:0, lk:0.1}, STL = {c:'#5f6266', m:0, lk:0.15}, DECK = {c:'#b39a78', m:0, lk:0.1};
  const CC = {rope:'#3b3d41', body:{c:'#26282c', m:0, lk:0}, win:{c:'#9aa7b0', glow:'#ffe2b0', gk:0.35}, hang:{c:'#b9bdc1', m:0, lk:0.2}};
  const block = (P, y0, H, fl, glazeFrom) => {
    const yb = minG(gl, P) - 1.5; wallP(B.p(BASE), P, yb, y0 + 0.3); wallP(B.p(REN), P, y0 + 0.3, y0 + H); flatPoly(B.p(RF), P, y0 + H);
    for (let k = 0; k < fl; k++){ const ya = y0 + k*H/fl; edgeBands(B.p(GLS), P, ya + 1.0, ya + H/fl - 0.8, 0.05); edgeFins(B.p(REN), P, ya + 1.0, ya + H/fl - 0.8, 4.0, 0.7, 0.12); }
    edgeBands(B.p(WH), P, y0 + H - 0.7, y0 + H + 0.5, 0.1);
  };
  const yH = gl(0, -8), yS = gl(0, 26);
  block(SHOP, Math.min(gl(-12, 25), yS), 7.0, 2);
  block(SOUTH, yS, 8.0, 2);
  // the hall: lower storey (garage / museum) and the platform level above
  { const y0 = yH, yP = y0 + 5.0, yE = y0 + 11.4, yR = y0 + 13.4;
    const yb = minG(gl, HALL) - 1.5; wallP(B.p(BASE), HALL, yb, y0 + 0.3); wallP(B.p(REN), HALL, y0 + 0.3, yP); flatPoly(B.p(RF), HALL, yP);
    edgeBands(B.p(GLS), HALL, y0 + 1.2, yP - 1.0, 0.05); edgeFins(B.p(REN), HALL, y0 + 1.2, yP - 1.0, 4.2, 0.8, 0.12); edgeBands(B.p(WH), HALL, yP - 0.5, yP + 0.4, 0.12);
    const ax = [-6.8 - (-12.1), -33.2 - 17.8], L = Math.hypot(ax[0], ax[1]), d = [ax[0]/L, ax[1]/L], n = [-d[1], d[0]];
    const c = [(-12.1 + 6.4 - 6.8 + 11.7)/4, (17.8 + 19.0 - 33.2 - 30.9)/4], hu = 26.2, hv = 9.0;
    const wh = B.p(WH), gls = B.p(GLS), rf = B.p(RF);
    // posts, eaves beams, glazed side screens (upper half), pitched roof with ridge on the axis
    for (const s of [-1, 1]){ const a = [c[0] - d[0]*hu + n[0]*hv*s, c[1] - d[1]*hu + n[1]*hv*s], b = [c[0] + d[0]*hu + n[0]*hv*s, c[1] + d[1]*hu + n[1]*hv*s];
      for (let k = 0; k <= 8; k++){ const t = k/8; boxP(wh, 0.45, yE - yP, 0.45, lerp(a[0], b[0], t), yP, lerp(a[1], b[1], t), 0); }
      barP(wh, a, b, 0.5, 0.7, yE - 0.7);
      quadP(gls, [a[0], yP + 1.1, a[1]], [b[0], yP + 1.1, b[1]], [b[0], yE - 0.7, b[1]], [a[0], yE - 0.7, a[1]]);
      const ov = 1.4, A = [c[0] - d[0]*(hu + ov) + n[0]*(hv + ov)*s, yE - 0.3, c[1] - d[1]*(hu + ov) + n[1]*(hv + ov)*s], Bp = [c[0] + d[0]*(hu + ov) + n[0]*(hv + ov)*s, yE - 0.3, c[1] + d[1]*(hu + ov) + n[1]*(hv + ov)*s];
      quadP(rf, A, Bp, [c[0] + d[0]*(hu + ov), yR, c[1] + d[1]*(hu + ov)], [c[0] - d[0]*(hu + ov), yR, c[1] - d[1]*(hu + ov)]); }
    // gable ends (south closed, north open mouth)
    { const P = (u, s, y) => [c[0] + d[0]*u + n[0]*hv*s, y, c[1] + d[1]*u + n[1]*hv*s];
      triP(B.p(REN), P(-hu, -1, yE), P(-hu, 1, yE), [c[0] - d[0]*hu, yR, c[1] - d[1]*hu]); quadP(B.p(REN), P(-hu, -1, yP), P(-hu, 1, yP), P(-hu, 1, yE), P(-hu, -1, yE));
      barP(wh, [P(hu, -1, 0)[0], P(hu, -1, 0)[2]], [P(hu, 1, 0)[0], P(hu, 1, 0)[2]], 0.6, 1.0, yE - 1.0); }
    // the rope loop round the hydraulic tension carriage at the south end, platforms, cabins parked in the hall
    const yc = yP + 4.4, back = [c[0] - d[0]*(hu - 4), yc, c[1] - d[1]*(hu - 4)];
    { const st = B.p(STL), k = 20, R = 2.8, ring = []; for (let i = 0; i <= k; i++){ const a = i/k*TAU; ring.push([back[0] + n[0]*Math.cos(a)*R + d[0]*Math.sin(a)*R, yc, back[2] + n[1]*Math.cos(a)*R + d[1]*Math.sin(a)*R]); }
      polyP(st, ring, 0.18, 4); boxP(st, 4.2, 1.6, 4.2, back[0], yc - 0.8, back[2], Math.atan2(-d[1], d[0])); segP(st, [back[0], yP, back[2]], [back[0], yc - 0.8, back[2]], 0.4, 6); }
    for (const s of [-1, 1]) flatPoly(B.p(DECK), rectR([c[0] + n[0]*s*4.6, c[1] + n[1]*s*4.6], d, hu - 2, 1.6), yP + 0.05);
    const dd = dirTo(STN.sentosa, STN.hf), mouth = [c[0] + d[0]*hu, yc, c[1] + d[1]*hu];
    cableStub(B, back, d, 2*hu - 4, 0, 5.6, CC, [[0.25, 1], [0.55, -1], [0.8, 1]]);
    cableStub(B, mouth, dd, 22, 0.09, 5.6, CC, [[0.6, -1]]);
  }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'sgsentosastn', lat:1.255436, lon:103.817702, rot:0});
}

// ======================================================================================================
// SkyHelix Sentosa (Dec 2021; Aerophile "Aerobar": brochure — tower diameter 11 m, overall height 40 m, passengers rise to
// 35 m, 12 helices crossing clockwise and counter-clockwise, 3 masts carrying the rails, 16 passengers in a rotating gondola,
// 3 winches hidden under pit covers; Mount Faber Leisure: an open-air gondola, guests seated with feet dangling, LED-lit after
// sundown, apex 79 m above sea level). OSM w176839464 = the 11 m octagonal base. The gondola is shown part-way up (21 m).
// ======================================================================================================
{
const LAT = 1.254958, LON = 103.817613, RR = 25;
const TER = {X0:-3047.91, Y0:-6639.08, i0:355, j0:304, nx:4, ny:4, H:[465,481,442,364,510,525,482,396,502,516,475,391,449,462,427,355]};
const BASEP = [[-5.8,-1.3],[-3.4,-5.4],[1.3,-6.0],[4.9,-3.1],[6.1,1.7],[3.1,5.2],[-1.6,5.8],[-5.2,2.9]];
LANDMARKS.sgskyhelix = {zh:'圣淘沙天空螺旋', en:'SkyHelix Sentosa', cat:'new', r:RR, h:40, lt:{m:0, c:'#e4eeff', k:0.9, e:0.8, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB(), {gl} = groundK(TER, LAT, LON, RR);
  const WH = {c:'#f1f2f0', m:0, lk:0.8}, STL = {c:'#8a8e92', m:0, lk:0.3}, LED = {c:'#dfe8f5', glow:'#cfe2ff', gk:0.9}, DECK = {c:'#8d8a84', m:0, lk:0.1};
  const GON = {c:'#e9e9e6', m:0, lk:0.4}, SEAT = {c:'#33363a', m:0, lk:0}, BASE = {c:'#b6ad9c', m:0, lk:0.1};
  const y0 = gl(0, 0), yb = minG(gl, BASEP) - 1.5, R = 5.5, H = 40;
  // pit cover and the boarding ring
  wallP(B.p(BASE), BASEP, yb, y0 + 0.5); flatPoly(B.p(DECK), BASEP, y0 + 0.5);
  { const o = B.p(DECK), n = 24; for (let i = 0; i < n; i++){ const a0 = i/n*TAU, a1 = (i+1)/n*TAU, r0 = 6.2, r1 = 8.6;
      quadP(o, [Math.cos(a0)*r0, y0 + 0.35, Math.sin(a0)*r0], [Math.cos(a1)*r0, y0 + 0.35, Math.sin(a1)*r0], [Math.cos(a1)*r1, y0 + 0.35, Math.sin(a1)*r1], [Math.cos(a0)*r1, y0 + 0.35, Math.sin(a0)*r1]);
      quadP(B.p(BASE), [Math.cos(a0)*r1, yb, Math.sin(a0)*r1], [Math.cos(a1)*r1, yb, Math.sin(a1)*r1], [Math.cos(a1)*r1, y0 + 0.35, Math.sin(a1)*r1], [Math.cos(a0)*r1, y0 + 0.35, Math.sin(a0)*r1]); } }
  // 12 helices (6 each way), half a turn over the height, white tubes with an LED strip on every other one
  { const wh = B.p(WH), ld = B.p(LED), N = 40;
    for (let k = 0; k < 12; k++){ const sg = k < 6 ? 1 : -1, a0 = (k % 6)/6*TAU + (sg < 0 ? PI/6 : 0), pts = [], pl = [];
      for (let i = 0; i <= N; i++){ const t = i/N, a = a0 + sg*t*PI, y = y0 + 0.5 + t*(H - 2.5);
        pts.push([Math.cos(a)*R, y, Math.sin(a)*R]); pl.push([Math.cos(a)*(R + 0.16), y, Math.sin(a)*(R + 0.16)]); }
      polyP(wh, pts, 0.17, 5); if (k % 2 === 0) polyP(ld, pl, 0.05, 3); }
    // ring beams
    for (const y of [y0 + 0.6, y0 + 13, y0 + 26, y0 + H - 2]){ const pts = []; for (let i = 0; i <= 36; i++){ const a = i/36*TAU; pts.push([Math.cos(a)*R, y, Math.sin(a)*R]); } polyP(wh, pts, 0.2, 4); } }
  // three masts with the rails, the head frame at the top
  { const st = B.p(STL), wh = B.p(WH);
    for (let k = 0; k < 3; k++){ const a = k/3*TAU + PI/2, x = Math.cos(a)*(R - 0.7), z = Math.sin(a)*(R - 0.7);
      segP(st, [x, y0 + 0.5, z], [x, y0 + H, z], 0.38, 6); boxP(st, 1.2, 1.4, 1.2, x, y0 + H - 0.4, z, a); }
    const top = []; for (let i = 0; i <= 36; i++){ const a = i/36*TAU; top.push([Math.cos(a)*(R - 0.5), y0 + H, Math.sin(a)*(R - 0.5)]); } polyP(wh, top, 0.32, 5);
    for (let k = 0; k < 3; k++){ const a = k/3*TAU + PI/2; segP(wh, [Math.cos(a)*(R - 0.7), y0 + H, Math.sin(a)*(R - 0.7)], [0, y0 + H + 0.4, 0], 0.22, 4); } }
  // the open-air gondola: a ring round the tower, 16 outward-facing seats, rail and LED underside; carriages on the masts
  { const yg = y0 + 21, ri = 6.0, ro = 8.4, n = 32, gn = B.p(GON), ld = B.p(LED), st = B.p(STL), se = B.p(SEAT);
    for (let i = 0; i < n; i++){ const a0 = i/n*TAU, a1 = (i+1)/n*TAU, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      quadP(gn, [c0*ri, yg, s0*ri], [c1*ri, yg, s1*ri], [c1*ro, yg, s1*ro], [c0*ro, yg, s0*ro]);
      quadP(gn, [c0*ri, yg - 0.7, s0*ri], [c1*ri, yg - 0.7, s1*ri], [c1*ro, yg - 0.7, s1*ro], [c0*ro, yg - 0.7, s0*ro]);
      quadP(gn, [c0*ro, yg - 0.7, s0*ro], [c1*ro, yg - 0.7, s1*ro], [c1*ro, yg, s1*ro], [c0*ro, yg, s0*ro]);
      quadP(gn, [c0*ri, yg - 0.7, s0*ri], [c1*ri, yg - 0.7, s1*ri], [c1*ri, yg + 1.1, s1*ri], [c0*ri, yg + 1.1, s0*ri]);
      quadP(ld, [c0*(ro - 0.3), yg - 0.72, s0*(ro - 0.3)], [c1*(ro - 0.3), yg - 0.72, s1*(ro - 0.3)], [c1*(ro - 1.2), yg - 0.72, s1*(ro - 1.2)], [c0*(ro - 1.2), yg - 0.72, s0*(ro - 1.2)]); }
    for (let i = 0; i < 16; i++){ const a = (i + 0.5)/16*TAU, c = Math.cos(a), s = Math.sin(a), ry = Math.atan2(-s, c);
      boxP(se, 0.55, 0.45, 0.55, c*7.4, yg, s*7.4, ry); boxP(se, 0.12, 0.9, 0.55, c*7.05, yg + 0.45, s*7.05, ry); }
    const rail = []; for (let i = 0; i <= 36; i++){ const a = i/36*TAU; rail.push([Math.cos(a)*6.3, yg + 1.15, Math.sin(a)*6.3]); } polyP(st, rail, 0.06, 3);
    for (let k = 0; k < 3; k++){ const a = k/3*TAU + PI/2; boxP(st, 1.0, 2.4, 1.0, Math.cos(a)*(R - 0.7), yg - 0.9, Math.sin(a)*(R - 0.7), a); segP(st, [Math.cos(a)*(R - 0.7), yg - 0.3, Math.sin(a)*(R - 0.7)], [Math.cos(a)*ri, yg - 0.3, Math.sin(a)*ri], 0.2, 4); } }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'sgskyhelix', lat:1.254958, lon:103.817613, rot:0});
}
