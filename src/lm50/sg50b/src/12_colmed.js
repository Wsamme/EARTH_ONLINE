// ================= College of Medicine Building, 16 College Road (sgcolmed, hero) =================
// Wonderwall.sg / NHB and the Annals of the Academy of Medicine (Teo 2005): neoclassical, Major P. H. Keys (Keys & Dowdeswell),
// built 1923-26, opened 15 Feb 1926, restored 1985-87, national monument 2002. A row of colossal fluted Doric columns across the
// front; 11 sculptured timber doors behind the colonnade; a bas-relief Roman eagle over the central doorway; allegorical friezes of
// the teaching and practice of medicine on both sides of the front; three floors (with a mezzanine); courtyards behind the front.
// Plan: OSM w172092367 / part w463204784 (3 levels, concrete #b9c2c7, hipped tiled roof #b49695): a 77 x 17 m front range facing
// College Road and two rear wings round an open court. Column count (12, one more than the doors), storey heights and the roof
// pitch are estimates. Night: warm floodlit colonnade and glowing windows.
{
const A0 = D.comb.A, C0 = [20.35, 11.55], AX = -59.6*PI/180;
K50('sgcolmed', '医药学院大厦', 'College of Medicine Building', A0, C0, {r:63, h:24, lt:{m:0, c:'#ffe9c8', k:0.55}, build(){
  const g = new THREE.Group(), B = mkB(), f = frame(0, 0, AX), R = LMCTX.rng;
  const WALL = {c:'#d2d7d6', m:0, lk:0.55}, COL = {c:'#e4e6e2', m:0, lk:0.6}, TRIM = {c:'#e9eae6', m:0, lk:0.55}, RELIEF = {c:'#f2f1ea', m:0, lk:0.6},
    ROOF = '#ab8a82', WIN = {c:'#3a4650', m:0, glow:'#ffd9a0', gk:0.8}, DOOR = '#5a3f2b', STEP = '#c9c5bb', LOG = {c:'#bfc5c4', m:0, lk:0.5};
  const box = (o, u0, u1, y0, y1, v0, v1) => bxF(o, f, u0, u1, y0, y1, v0, v1);
  const FV = (v, s) => (t, y, w) => f(t, y, v + s*(w || 0));
  const FU = (u, s) => (t, y, w) => f(u + s*(w || 0), y, t);
  const FRONT = rectO(-38.4, 38.4, -16.8, 0), WN = rectO(-38.7, -22.8, -47.3, -16.8), WS = rectO(24.0, 38.3, -46.3, -16.8);
  const YE = 14.6, YT = 18.2, YP = 19.4, YW = 16.0;   // column top, entablature top, parapet top, wing eaves
  for (const P of [FRONT, WN, WS]) foundP(B.p(FOUND50), polyF(f, P), 0.3);
  // ---- front range: end pavilions solid, centre recessed behind the colonnade ----
  box(B.p(WALL), -38.4, -24.4, 0.3, YT, -16.8, 0); box(B.p(WALL), 24.4, 38.4, 0.3, YT, -16.8, 0);
  box(B.p(WALL), -24.4, 24.4, 0.3, YT, -16.8, -3.6);
  box(B.p(LOG), -24.4, 24.4, 0.3, 1.5, -3.6, 0.4);                                  // colonnade floor
  for (let i = 0; i < 4; i++) box(B.p(STEP), -12 + i*0.0, 12, 0.3, 1.5 - i*0.3, 0.4, 0.4 + (i + 1)*0.45);
  box(B.p(TRIM), -24.4, 24.4, YE, YT, -3.6, 0.2);                                   // entablature over the loggia
  bandAtP(B.p(TRIM), polyF(f, FRONT), YE, 0.9, 0.3);                                // architrave line round the front range
  bandAtP(B.p(TRIM), polyF(f, FRONT), YT - 1.0, 1.0, 0.45);                         // cornice
  box(B.p(TRIM), -38.6, 38.6, YT, YP, -17.0, 0.25);                                 // parapet / attic
  // colossal fluted Doric columns (12), with abacus and echinus; triglyph rhythm on the frieze
  const NC = 12, cu = i => -22.6 + i*45.2/(NC - 1);
  for (let i = 0; i < NC; i++){ const p = f(cu(i), 0, -0.9);
    latheP(B.p(COL), [[0.78, 1.5], [0.78, 1.9], [0.7, 2.0], [0.62, YE - 1.0], [0.75, YE - 0.6], [0.82, YE - 0.4]], p[0], p[2], 16);
    boxP(B.p(COL), 1.9, 0.4, 1.9, p[0], YE - 0.4, p[2], -AX); }
  { const F = FV(0.2, 1); for (let u = -24; u <= 24; u += 1.5) shapeP(B.p(RELIEF), rectO(u - 0.25, u + 0.25, YE + 1.2, YE + 2.6), F, 0.03); }
  // 11 timber doors between the columns, upper windows on the recessed wall, the Roman eagle over the central door
  { const F = FV(-3.6, 1);
    for (let i = 0; i < NC - 1; i++){ const u = (cu(i) + cu(i + 1))/2; shapeP(B.p(DOOR), rectO(u - 0.9, u + 0.9, 1.5, 5.0), F, 0.04); slabP(B.p(TRIM), rectO(u - 1.15, u + 1.15, 4.9, 5.4), F, 0.0, 0.12);
      for (const y of [7.0, 10.8]) shapeP(B.p(WIN), rectO(u - 0.75, u + 0.75, y, y + 2.4), F, 0.04); }
    const E = [[-2.2, 0.6], [-1.3, 0.2], [-0.4, 0.5], [-0.35, -0.6], [0, -0.9], [0.35, -0.6], [0.4, 0.5], [1.3, 0.2], [2.2, 0.6], [1.5, -0.2], [0.5, -0.1], [0.3, 0.9], [0, 1.1], [-0.3, 0.9], [-0.5, -0.1], [-1.5, -0.2]];
    shapeP(B.p(RELIEF), mv(E, 0, 6.3), F, 0.1); }
  // end pavilions: pilasters, three tiers of windows, the allegorical frieze panels
  for (const [u0, u1] of [[-38.4, -24.4], [24.4, 38.4]]){ const F = FV(0, 1);
    for (const u of [u0 + 0.6, u1 - 0.6]) slabP(B.p(TRIM), rectO(u - 0.6, u + 0.6, 1.5, YE), F, 0, 0.35);
    for (let k = 0; k < 3; k++){ const u = u0 + 3.5 + k*3.5;
      shapeP(B.p(WIN), rectO(u - 0.8, u + 0.8, 2.2, 4.6), F, 0.05); shapeP(B.p(WIN), rectO(u - 0.8, u + 0.8, 6.8, 9.6), F, 0.05); shapeP(B.p(WIN), rectO(u - 0.7, u + 0.7, 10.8, 12.8), F, 0.05); }
    slabP(B.p(RELIEF), rectO(u0 + 1.8, u1 - 1.8, YE + 0.9, YT - 1.1), F, 0.3, 0.38);
    slabP(B.p(WALL), rectO(u0, u1, 1.5, 2.0), F, 0, 0.3); }
  // ends and back of the front range
  for (const [u, s] of [[-38.4, -1], [38.4, 1]]){ const F = FU(u, s); for (let k = 0; k < 4; k++){ const t = -14.5 + k*3.8; for (const y of [2.2, 6.8, 10.8]) shapeP(B.p(WIN), rectO(t - 0.75, t + 0.75, y, y + 2.3), F, 0.05); } }
  { const F = FV(-16.8, -1); for (let u = -21; u <= 21; u += 3.6) for (const y of [2.2, 6.8, 10.8]) shapeP(B.p(WIN), rectO(u - 0.75, u + 0.75, y, y + 2.3), F, 0.05); }
  hipF(B.p(ROOF), f, -38.4, 38.4, -16.8, 0, YP, 5.2, 0.7);
  // ---- rear wings round the court ----
  for (const P of [WN, WS]){ const [u0, , v0] = [P[0][0], 0, P[0][1]], u1 = P[1][0], v1 = P[2][1];
    box(B.p(WALL), u0, u1, 0.3, YW, Math.min(v0, v1), -16.8);
    const Q = polyF(f, rectO(u0, u1, Math.min(v0, v1), -16.8));
    bandAtP(B.p(TRIM), Q, YW - 0.8, 0.8, 0.3); bandAtP(B.p(TRIM), Q, 5.6, 0.5, 0.15);
    winP(B, Q, 1.8, YW - 1.2, 4.6, 3.4, 1.5, 2.4, WIN, {minL:6});
    hipF(B.p(ROOF), f, u0, u1, Math.min(v0, v1), -16.4, YW, 4.0, 0.7); }
  // court: lawn and a few trees
  capP(B.p({c:'#6f8f55', m:0, lk:0.1}), polyF(f, rectO(-22.6, 23.8, -45.0, -17.0)), 0.35);
  for (const [u, v] of [[-14, -30], [0, -38], [14, -30], [-6, -24], [8, -42]]){ const p = f(u, 0, v); treeP(B.p('#5b4a3a'), B.p({c:'#4f7a3e', m:0, lk:0.1}), p[0], 0.3, p[2], 1.2, R); }
  B.flush(g); return g; }});
}
