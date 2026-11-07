// ================= International Plaza (1976, Ang Kheng Leng & Associates), 10 Anson Road =================
// 190 m, 50 storeys (Wikipedia): a seven-storey triangular podium (shops on levels 1-3, car park on 4-8) on the site between
// Anson Road and Choon Guan Street, and a 43-storey elongated-octagon tower: offices 9-35, a recreation floor on level 36
// (pool, health club), apartments 37-50 and a roof garden. Plans: OSM w117041257 (podium) and its 0-190 m part (tower).
// Facade (not documented in the sources; from the massing): continuous concrete floor bands and dark ribbon glazing (the 1985
// external glass wall). Night: lit floors, an LED facade (Wikipedia: installed under the city lighting plan) -> anim 'cycle'.
{
const A0 = [1.275887, 103.845959];
const POD0 = [[-51.8,-26.0],[32.9,-37.2],[52.6,-38.4],[59.2,-33.1],[61.6,-24.2],[58.6,-13.5],[55.6,-9.3],[4.9,48.8],[-4.7,38.7],[-44.7,42.8]];
const TWR0 = [[20.4,-23.0],[25.8,-18.8],[29.4,13.8],[25.2,18.5],[-33.9,25.6],[-35.1,15.0],[-44.1,15.6],[-47.7,-10.5],[-42.9,-16.5]];
const C0 = pcen(POD0), [POD, TWR] = shAll([POD0, TWR0], C0);
LANDMARKS.sgintlplaza = {zh:'国际广场', en:'International Plaza', cat:'new', r:70, h:190,
  lt:{m:1, c:'#ffe2b8', k:0.55, anim:'cycle', c2:'#7ac8ff'}, build(){
  const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
  const CON = {c:'#d9d2c2', m:0, lk:0.2}, CON2 = {c:'#c9c0ae', m:0, lk:0.2}, GLO = {c:'#3e4c52', m:1, fh:3.86, cw:2.8}, GLR = {c:'#4a5552', m:1, fh:3.7, cw:2.4},
    SHOP = {c:'#9fb0b0', m:0, glow:'#ffdcaa', gk:0.75}, PARK = '#5d5f5c', FOUND = '#bdb6a6', ROOF = '#9a978e', POOL = {c:'#5ab0c6', glow:'#4aa8c8', gk:0.5},
    LED = {c:'#e8e4da', m:0, lc:'#9fd8ff', lk:1.3, glow:'#8fd0ff', gk:0.45}, LAV = {c:'#c22', glow:'#ff2a1a', gk:2}, LEAF = {c:'#4d7a3d', m:0, lk:0.1}, TRK = '#5b4a3a', DARK = '#3d3f3e';
  const YP = 28.5, YO = 132.2, YR = 138.6, YT = 190;
  // ---- podium: shops (glass shopfronts behind a canopy band), car-park decks with open louvred bands, roof deck ----
  wallP(B.p(FOUND), POD, -5, 0.3); capP(B.p(FOUND), POD, 0.3);
  prismP(B.p(SHOP), offP(POD, 1.5), 0.3, 5.2); prismP(B.p(CON), POD, 5.2, 13.6);
  bandAtP(B.p(CON2), POD, 4.6, 0.9, 1.4);                                   // street canopy
  for (const y of [8.6]) bandAtP(B.p(GLO), POD, y, 3.2, 0.05);               // shop levels 2-3: glazing strip
  prismP(B.p(CON), POD, 13.6, YP);
  for (let y = 14.4; y < YP - 1; y += 3.0) bandAtP(B.p(PARK), POD, y, 1.6, 0.04);   // car-park openings
  for (const e of edgesF(POD)){ const n = Math.round(e.L/1.6); for (let k = 1; k < n; k++) for (let y = 14.4; y < YP - 1; y += 3.0) slabP(B.p(CON2), rectO(k*e.L/n - 0.12, k*e.L/n + 0.12, y, y + 1.6), e.F, 0, 0.18); }
  capP(B.p(ROOF), POD, YP + 0.02); parP(B.p(CON), POD, YP, YP + 1.1, 0.3);
  // ---- tower: concrete floor bands and dark ribbon glazing; deeper bands on the residential floors ----
  prismP(B.p(GLO), offP(TWR, 0.6), YP, YO);
  for (let y = YP; y < YO - 0.5; y += 3.86) bandAtP(B.p(CON), TWR, y, 1.25, 0.0);
  for (const e of edgesF(TWR)){ const n = Math.max(1, Math.round(e.L/7.2)); for (let k = 0; k <= n; k++) slabP(B.p(CON2), rectO(k*e.L/n - 0.35, k*e.L/n + 0.35, YP, YO), e.F, -0.6, 0.15); }
  // level 36: recreation floor, open-sided behind columns, pool
  prismP(B.p(CON), TWR, YO, YO + 1.2); prismP(B.p(DARK), offP(TWR, 4), YO + 1.2, YR - 0.8); capP(B.p(POOL), offP(TWR, 9), YO + 1.25);
  for (const [x, z] of alongP(offP(TWR, 0.8), 7.2)) segP(B.p(CON), [x, YO + 1.2, z], [x, YR - 0.8, z], 0.45, 6);
  prismP(B.p(CON), TWR, YR - 0.8, YR);
  prismP(B.p(GLR), offP(TWR, 0.9), YR, YT - 1.2);
  for (let y = YR; y < YT - 1.5; y += 3.7) bandAtP(B.p(CON), offP(TWR, -0.5), y, 1.0, 0.0);
  for (const e of edgesF(TWR)){ const n = Math.max(1, Math.round(e.L/4.8)); for (let k = 0; k <= n; k++) slabP(B.p(CON2), rectO(k*e.L/n - 0.25, k*e.L/n + 0.25, YR, YT - 1.2), e.F, -0.6, 0.6); }
  // roof garden, lift / plant room, LED edge lines, aviation lights
  prismP(B.p(CON), TWR, YT - 1.2, YT - 0.2); parP(B.p(CON2), TWR, YT - 0.2, YT + 1.0, 0.3); capP(B.p(LEAF), offP(TWR, 1.5), YT - 0.15);
  const C = pcen(TWR), a = Math.atan2(TWR[4][1] - TWR[3][1], TWR[4][0] - TWR[3][0]);
  prismP(B.p(CON2), rectA(C[0], C[1], 9, 6, a), YT - 0.2, YT + 6.5); capP(B.p(ROOF), rectA(C[0], C[1], 9, 6, a), YT + 6.5);
  for (let i = 0; i < 14; i++){ const u = (R() - 0.5)*50, v = (R() - 0.5)*24, x = C[0] + u*Math.cos(a) - v*Math.sin(a), z = C[1] + u*Math.sin(a) + v*Math.cos(a);
    if (inPolyS(offP(TWR, 3), x, z) && Math.abs(u) > 11) treeP(B.p(TRK), B.p(LEAF), x, YT - 0.2, z, 0.9, R); }
  for (const P of [TWR]) for (const y of [YP + 1.2, YO, YT - 0.4]) bandAtP(B.p(LED), P, y - 0.3, 0.3, 0.25);
  for (const e of edgesF(TWR)) if (e.L > 6) { const p = e.F(e.L/2, 0, 0.3); segP(B.p(LED), [p[0], YP + 1, p[2]], [p[0], YT - 0.4, p[2]], 0.18, 4); }
  boxP(B.p(LAV), 0.6, 0.6, 0.6, C[0], YT + 6.5, C[1]);
  B.flush(g); return g; }};
const PL = LL40(A0[0], A0[1], C0[0], C0[1]);
SG_PLACES.push({type:'sgintlplaza', lat:PL.lat, lon:PL.lon, rot:0});
}
