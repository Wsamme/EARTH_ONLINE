// ================= Marina South Pier (2006), 31 Marina Coastal Drive =================
// MPA launch release (30 Jun 2006): ~5,000 m2 ferry terminal for the Southern Islands with a "striking wave-like roof shelter", a
// waiting hall on the first floor for 3,000 people, an open roof deck with a viewing gallery. OSM w155110820 (2 floors, 7 m) with
// its serrated landward edge; the two covered gangways to the floating pontoons follow the OSM footways that run out to sea.
// Roof wave count / height and the pontoon size are estimates. Night: lit hall, lit gangway canopies.
{
const A0 = [1.270903, 103.863192];
const PIER0 = [[-44.4,1.7],[-39.6,1.7],[-37.2,-2.4],[-31.8,-4.2],[-28.8,-7.8],[-23.5,-10.1],[-20.5,-14.3],[-15.7,-16.1],[-12.7,-20.2],[-7.9,-22.0],[-5.0,-25.5],[-0.2,-27.9],[2.8,-31.5],[7.0,-33.8],[8.8,-33.8],[11.8,-38.0],[17.1,-39.2],[20.7,-43.3],[42.2,-15.5],[33.3,-8.9],[39.8,0.5],[-18.7,42.1],[-27.0,30.8],[-35.4,36.7],[-40.2,30.2],[-29.4,22.5],[-44.4,2.9]];
const GW0 = [[[-18,50],[2,79]], [[16,25],[54,76]]];
const C0 = [0, 8];
const [PIER] = shAll([PIER0], C0), GW = GW0.map(L => shP(L, C0[0], C0[1]));
LANDMARKS.sgmsouthpier = {zh:'滨海南码头', en:'Marina South Pier', cat:'new', r:102, h:13,
  lt:{m:0, c:'#fff0d8', k:0.7, e:0.8}, build(){
  const g = new THREE.Group(), B = mkB();
  const WALL = {c:'#e2e0da', m:0}, GLS = {c:'#86a2a8', m:0, glow:'#ffe6c0', gk:0.7}, ROOF = {c:'#d8dcdc', m:0, lk:0.55}, STL = '#9aa3a6', FOUND = '#aaa59a',
    DECK = '#8f8b83', PONT = '#9a968c', CAN = {c:'#e7e9e6', m:0, glow:'#fff0d0', gk:0.25}, RAIL = '#59605f';
  wallP(B.p(FOUND), PIER, -5, 0.3); capP(B.p(FOUND), PIER, 0.3);
  // hall: glazed ground floor behind a solid base band, upper floor, roof deck
  prismP(B.p(GLS), offP(PIER, 1.2), 0.3, 6.6); bandAtP(B.p(WALL), offP(PIER, 1.2), 0.3, 0.9, 0.05);
  for (const e of edgesF(offP(PIER, 1.2))){ if (e.L < 3) continue; const n = Math.max(1, Math.round(e.L/3)); for (let k = 0; k <= n; k++) slabP(B.p(STL), rectO(k*e.L/n - 0.1, k*e.L/n + 0.1, 0.3, 6.6), e.F, 0, 0.15); }
  prismP(B.p(WALL), PIER, 6.6, 7.4); parP(B.p(STL), PIER, 7.4, 8.5, 0.12);
  // the wave roof shelter over the roof deck: a sheet rising and falling in three waves along the long axis
  const ax = Math.atan2(PIER[18][1] - PIER[20][1], PIER[18][0] - PIER[20][0]);  // along the long sea-side edge
  const F = frame(-2, -3, Math.atan2(PIER[20][1] - PIER[21][1], PIER[20][0] - PIER[21][0]));
  const LU = 34, LV = 15, NU = 24, NV = 6, S = [];
  for (let i = 0; i <= NU; i++){ const row = [], u = -LU + 2*LU*i/NU; for (let j = 0; j <= NV; j++){ const v = -LV + 2*LV*j/NV; row.push(F(u, 11.0 + 1.8*Math.sin(u/LU*PI*1.5) + 0.6*Math.cos(v/LV*HP), v)); } S.push(row); }
  sheetP(B.p(ROOF), S); sheetP(B.p(ROOF), S.map(r => r.map(p => [p[0], p[1] - 0.35, p[2]])));
  for (let i = 0; i <= NU; i += 4) for (const j of [0, NV]){ const p = S[i][j]; segP(B.p(STL), [p[0], 7.4, p[2]], [p[0], p[1] - 0.3, p[2]], 0.25, 6); }
  // covered gangways out to the pontoons
  for (const [a, b] of GW){
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = Math.hypot(b[0] - a[0], b[1] - a[1]), G = frame(a[0], a[1], ang);
    bxF(B.p(DECK), G, 0, L, 0.6, 1.0, -1.6, 1.6); for (const s of [-1, 1]) for (let u = 0; u <= L; u += 4) segP(B.p(STL), G(u, 1.0, s*1.6), G(u, 3.6, s*1.6), 0.08, 4);
    for (const s of [-1, 1]) segP(B.p(RAIL), G(0, 2.0, s*1.6), G(L, 2.0, s*1.6), 0.05, 4);
    const R = []; for (let i = 0; i <= 6; i++){ const t = i/6 - 0.5; R.push([G(0, 3.6 + 0.6*(1 - 4*t*t), t*4.0), G(L, 3.6 + 0.6*(1 - 4*t*t), t*4.0)]); }
    for (let i = 0; i < 6; i++) quadP(B.p(CAN), R[i][0], R[i][1], R[i+1][1], R[i+1][0]);
    bxF(B.p(PONT), G, L - 2, L + 14, -1.0, 0.6, -4.5, 4.5);
  }
  B.flush(g); return g; }};
const PL = LL40(A0[0], A0[1], C0[0], C0[1]);
SG_PLACES.push({type:'sgmsouthpier', lat:PL.lat, lon:PL.lon, rot:0});
}
