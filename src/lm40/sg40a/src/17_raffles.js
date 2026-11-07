// ================= Six Battery Road (1984, P&T Architects & Engineers + RSP), Raffles Place =================
// Wikipedia: 174 m roof, 44 floors, modernist, brown granite finish, concrete structure; on the river side of Raffles Place.
// The 174 m tower is the elongated-hexagon building:part of OSM w172916311 (the named footprint is the 12 m podium round it).
// Facade rhythm (granite piers / spandrels round strip windows) and the podium height are estimates. Night: lit windows.
{
const A0 = [1.285480, 103.851811];
// podium trimmed on the east to the tower face: the neighbouring block (Bank of China side) reaches the tower in the app data
const POD0 = [[-10.0,30.2],[-32.1,39.7],[-36.8,37.3],[-33.3,-13.1],[18.1,-36.8],[27.6,-30.8],[24.0,14.8]];
const TWR0 = [[-2.2,-27.9],[18.1,-36.8],[28.2,-30.3],[24.0,14.8],[3.1,24.3],[-6.4,17.8]];
const C0 = pcen([[-10.0,30.2],[-32.1,39.7],[-36.8,37.3],[-33.3,-13.1],[24.0,-39.8],[44.3,5.3]]), [POD, TWR] = shAll([POD0, TWR0], C0);
LANDMARKS.sgsixbattery = {zh:'炮台路六号大厦', en:'Six Battery Road', cat:'new', r:54, h:174,
  lt:{m:1, c:'#ffe0b8', k:0.55}, build(){
  const g = new THREE.Group(), B = mkB();
  const GRN = {c:'#7c5f4e', m:0, lk:0.2}, GRD = {c:'#6a5042', m:0, lk:0.2}, WIN = {c:'#3c4447', m:1, fh:3.95, cw:2.6}, LOB = {c:'#a9b6b4', m:0, glow:'#ffdcae', gk:0.8},
    FOUND = '#a99c8e', PAVE = '#bdb3a5', ROOF = '#8c867f', LAV = {c:'#c22', glow:'#ff2a1a', gk:2};
  const YP = 12, YT = 174, FH = 3.95;
  wallP(B.p(FOUND), POD, -5, 0.3); capP(B.p(PAVE), POD, 0.3);
  // podium: glazed shopfronts and banking hall behind granite piers
  prismP(B.p(LOB), offP(POD, 1.0), 0.3, YP - 1.2); prismP(B.p(GRN), POD, YP - 1.2, YP); capP(B.p(ROOF), POD, YP + 0.01);
  for (const [x, z] of alongP(POD, 6)) boxP(B.p(GRN), 1.0, YP - 1.2, 1.0, x, 0.3, z);
  // tower: granite skin with strip windows
  prismP(B.p(WIN), offP(TWR, 0.5), YP, YT - 3);
  for (let y = YP; y < YT - 4; y += FH) bandAtP(B.p(GRN), TWR, y, 1.55, 0.0);
  for (const e of edgesF(TWR)){ const n = Math.max(1, Math.round(e.L/4.6)); for (let k = 0; k <= n; k++){ const w = k === 0 || k === n ? 0.9 : 0.32; slabP(B.p(GRD), rectO(Math.max(0, k*e.L/n - w), Math.min(e.L, k*e.L/n + w), YP, YT - 3), e.F, -0.5, 0.18); } }
  // crown: solid granite band round the roof plant
  prismP(B.p(GRN), TWR, YT - 3, YT); capP(B.p(ROOF), offP(TWR, 0.4), YT - 0.6);
  const c = pcen(TWR); boxP(B.p(GRD), 14, 5, 9, c[0], YT, c[1], 1.36); boxP(B.p(LAV), 0.5, 0.5, 0.5, c[0], YT + 5, c[1]);
  B.flush(g); return g; }};
const PL = LL40(A0[0], A0[1], C0[0], C0[1]);
SG_PLACES.push({type:'sgsixbattery', lat:PL.lat, lon:PL.lon, rot:0});
}
// ================= Singapore Land Tower (1980, P&T + Architects 61; regeneration 2025 by Maki and Associates), 50 Raffles Place =================
// Wikipedia: 190 m roof, 48 floors. Maki and Associates (2025): reclad in white-fritted low-e double glazing in a new curtain wall,
// an extra amenity floor (49 storeys); Singapore Land: a new roof crown to raise its skyline presence, a rooftop gallery and
// viewing deck on the 49th storey, a podium roof garden. Plans: tower OSM w46595418 (40 m square), podium w939684168 (14.4 m).
// The crown's form (an open frame of white fins round the deck) is an estimate. Night: lit floors, the crown glowing white.
{
const A0 = [1.284714, 103.852019];
const POD0 = [[-28.4,-3.5],[3.3,-27.8],[40.3,-25.4],[35.5,22.6],[28.4,22.6],[26.0,39.8],[-33.1,29.7],[-30.1,-3.5]];
const TWR0 = [[-28.4,-3.5],[3.3,-27.8],[28.4,3.0],[-3.3,27.9]];
const C0 = pcen(TWR0), [POD, TWR] = shAll([POD0, TWR0], C0);
LANDMARKS.sgsltower = {zh:'新置地大厦', en:'Singapore Land Tower', cat:'new', r:52, h:198,
  lt:{m:1, c:'#f2f6ff', k:0.6}, build(){
  const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
  const GLW = {c:'#c9d2d6', m:1, fh:3.8, cw:2.8}, FIN = {c:'#eef0ef', m:0, lk:0.3}, BAND = {c:'#dfe3e2', m:0, lk:0.2}, LOB = {c:'#b7c5c6', m:0, glow:'#ffe6c4', gk:0.85},
    PODC = {c:'#d3d6d3', m:0}, FOUND = '#b0aca2', PAVE = '#c1bbaf', CROWN = {c:'#f4f5f2', m:0, lc:'#eaf2ff', lk:1.4, glow:'#e8f0ff', gk:0.35}, DECK = '#9a9690',
    LEAF = {c:'#4c7a3c', m:0, lk:0.1}, TRK = '#5b4a3a', LAV = {c:'#c22', glow:'#ff2a1a', gk:2};
  const YP = 14.4, YL = 18, YR = 190, YC = 198;
  wallP(B.p(FOUND), POD, -5, 0.3); capP(B.p(PAVE), POD, 0.3);
  // podium with roof garden
  prismP(B.p(LOB), offP(POD, 1.0), 0.3, 6.5); prismP(B.p(PODC), POD, 6.5, YP); bandAtP(B.p(BAND), POD, 9.5, 0.6, 0.1);
  capP(B.p(LEAF), offP(POD, 1.2), YP + 0.02); parP(B.p(PODC), POD, YP, YP + 1.1, 0.3);
  for (let i = 0; i < 18; i++){ const x = (R() - 0.5)*70, z = (R() - 0.5)*70; if (inPolyS(offP(POD, 3), x, z) && !inPolyS(offP(TWR, -3), x, z)) treeP(B.p(TRK), B.p(LEAF), x, YP, z, 1.0, R); }
  // tower: white-fritted curtain wall, fine vertical fins, floor lines; glazed lobby base
  prismP(B.p(LOB), offP(TWR, 1.5), YP, YL); prismP(B.p(GLW), TWR, YL, YR);
  facadeP(B, TWR, YL, YR, {mul:FIN, band:BAND, bay:1.5, fd:0.3, fw:0.07, fh:3.8, bh:0.35});
  for (const p of TWR) segP(B.p(FIN), [p[0], YP, p[1]], [p[0], YR, p[1]], 0.6, 6);
  // 49th-storey gallery / viewing deck and the crown frame
  capP(B.p(DECK), TWR, YR + 0.02);
  prismP(B.p(LOB), offP(TWR, 5), YR, YR + 5);
  for (const e of edgesF(TWR)){ const n = Math.round(e.L/2.5); for (let k = 0; k <= n; k++) slabP(B.p(CROWN), rectO(k*e.L/n - 0.12, k*e.L/n + 0.12, YR, YC), e.F, -0.2, 0.25);
    shapeP(B.p(CROWN), rectO(0, e.L, YC - 0.8, YC), e.F, 0.26); shapeP(B.p(CROWN), rectO(0, e.L, YR + 1.0, YR + 1.6), e.F, 0.26); }
  for (const p of TWR) boxP(B.p(LAV), 0.5, 0.5, 0.5, p[0]*0.97, YC, p[1]*0.97);
  B.flush(g); return g; }};
const PL = LL40(A0[0], A0[1], C0[0], C0[1]);
SG_PLACES.push({type:'sgsltower', lat:PL.lat, lon:PL.lon, rot:0});
}
// ================= One Raffles Quay (2006, Kohn Pedersen Fox with Architects 61), 1 Raffles Quay =================
// North Tower 245 m / 50 storeys, South Tower 140 m / 29 storeys (Meinhardt, Wikipedia list) on a shared multi-level base; a covered
// plaza with bamboo and water bridges the two towers (architects61); transparent glass curtain wall with a slight green tint,
// prefabricated unitised glass-and-metal units (Heintges). Plans: OSM w47345006 (site), w172915345 (North), w172915347 (South).
// Mullion spacing, the base height (12 m) and the plaza canopy are estimates. Night: lit floors, lit crown edges.
{
const A0 = [1.281186, 103.851898];
const SITE0 = [[25.1,-76.3],[71.1,-47.3],[-18.5,87.3],[-38.2,67.2],[-68.0,41.1],[-16.7,-39.0],[18.5,-81.1]];
const NT0 = [[11.4,-2.8],[-5.9,-31.9],[-4.7,-33.0],[-9.5,-36.6],[37.6,-66.2],[39.4,-60.3],[41.2,-61.5],[59.1,-32.4]];
const ST0 = [[-17.3,67.2],[-57.3,38.1],[-31.6,-3.4],[8.4,22.7]];
const C0 = pcen(SITE0), [SITE, NT, ST] = shAll([SITE0, NT0, ST0], C0);
LANDMARKS.sgorq = {zh:'莱佛士码头一号', en:'One Raffles Quay', cat:'new', r:90, h:245,
  lt:{m:1, c:'#e0f2ff', k:0.6}, build(){
  const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
  const GL = {c:'#6f9a92', m:1, fh:4.3, cw:3.0}, MUL = {c:'#c8d2cf', m:0, lk:0.15}, BAND = {c:'#96aaa5', m:0, lk:0.15}, LOB = {c:'#b4c6c2', m:0, glow:'#ffe4be', gk:0.85},
    BASE = {c:'#cfd2cd', m:0}, CAN = {c:'#dfe4e2', m:0, op:0.75}, FOUND = '#aaa69c', PAVE = '#c0baae', ROOF = '#8b9190', LED = {c:'#e4ecea', m:0, lc:'#cfeaff', lk:1.3, glow:'#cfeaff', gk:0.3},
    LEAF = {c:'#5c8a3e', m:0, lk:0.1}, TRK = '#6b5a3a', WAT = {c:'#5f8fa0', glow:'#3f7fa0', gk:0.3}, LAV = {c:'#c22', glow:'#ff2a1a', gk:2};
  const YB = 12, YN = 245, YS = 140;
  wallP(B.p(FOUND), SITE, -5, 0.3); capP(B.p(PAVE), SITE, 0.3);
  // base: podium blocks under both towers, the covered plaza between with bamboo and water
  for (const P of [offP(NT, -6), offP(ST, -6)]){ prismP(B.p(LOB), offP(P, 1.2), 0.3, 6.0); prismP(B.p(BASE), P, 6.0, YB); capP(B.p(ROOF), P, YB + 0.01); }
  const PZ = offP(SITE, 4);
  for (let i = 0; i < 40; i++){ const x = (R() - 0.5)*120, z = (R() - 0.5)*150; if (!inPolyS(PZ, x, z) || inPolyS(offP(NT, -7), x, z) || inPolyS(offP(ST, -7), x, z)) continue;
    segP(B.p(LEAF), [x, 0.3, z], [x + (R() - 0.5), 6 + R()*3, z + (R() - 0.5)], 0.35, 4); }
  const nc = pcen(NT), sc = pcen(ST), mc = [(nc[0] + sc[0])/2, (nc[1] + sc[1])/2], ang = Math.atan2(sc[1] - nc[1], sc[0] - nc[0]);
  const CANP = rectA(mc[0], mc[1], 18, 22, ang); capP(B.p(CAN), CANP, YB + 3); for (const p of CANP) segP(B.p(MUL), [p[0], 0.3, p[1]], [p[0], YB + 3, p[1]], 0.3, 6);
  capP(B.p(WAT), rectA(mc[0], mc[1], 10, 4, ang), 0.35);
  // towers: tinted glass, unitised mullions, floor lines; crown band and recessed plant screen
  for (const [P, YT] of [[NT, YN], [ST, YS]]){
    prismP(B.p(GL), P, YB, YT - 6); facadeP(B, P, YB, YT - 6, {mul:MUL, band:BAND, bay:1.5, fd:0.25, fw:0.06, fh:4.3, bh:0.3});
    for (const p of P) segP(B.p(MUL), [p[0], YB, p[1]], [p[0], YT - 6, p[1]], 0.35, 6);
    wallP(B.p(MUL), P, YT - 6, YT); capP(B.p(ROOF), offP(P, 0.3), YT - 5);
    for (const e of edgesF(P)){ const n = Math.round(e.L/1.2); for (let k = 0; k < n; k++) shapeP(B.p(BAND), rectO((k + 0.15)*e.L/n, (k + 0.85)*e.L/n, YT - 5.5, YT - 0.6), e.F, 0.04); }
    bandAtP(B.p(LED), P, YT - 0.5, 0.5, 0.1); bandAtP(B.p(LED), P, YT - 6.5, 0.4, 0.1);
    const c = pcen(P); boxP(B.p(LAV), 0.5, 0.5, 0.5, c[0], YT, c[1]);
  }
  B.flush(g); return g; }};
const PL = LL40(A0[0], A0[1], C0[0], C0[1]);
SG_PLACES.push({type:'sgorq', lat:PL.lat, lon:PL.lon, rot:0});
}
