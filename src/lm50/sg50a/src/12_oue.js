// ================= OUE Downtown (former DBS Building Towers), 6 Shenton Way (sgoue, hero) =================
// Wikipedia: Tower 1, 50 storeys, 201 m (1975, Architects Team 3; tallest in Singapore 1975-86), aluminium cladding replaced by a
// glass curtain wall in the 2017 conversion (Oakwood serviced apartments); Tower 2, 36 storeys, 150 m (1994, offices); the
// Downtown Gallery mall runs the full length of the podium. Plans from OSM: Tower 1 w172915340 with its floor parts w510804033
// (39-80, 84-123, 127-166, 170-183 m: the three recessed breaks between them) and the core w510804763 (to 201 m); Tower 2
// w172915341; Downtown Gallery w510901696 (39 m). Look (photos, Commons): Tower 1 dark-grey glass divided by deep vertical fins
// (four bays a face), dark recessed breaks, an open-grid crown; Tower 2 light grey cladding with a regular grid of small windows;
// the Gallery glass behind slender light fins. Night: lit apartment / office windows, a softly lit crown on Tower 1.
{
const A0 = [1.277402, 103.848671];
const T1F0 = [[-42.5,44.4],[-33.0,52.6],[-20.5,57.9],[-6.3,34.1],[-17.5,24.6],[-28.3,20.6]];
const CORE0 = [[-33.5,42.6],[-21.0,50.1],[-13.3,37.1],[-25.8,30.1]];
const T2_0 = [[25.5,-68.4],[-10.3,-9.1],[13.5,5.1],[49.2,-53.6]];
const GAL0 = [[-11.6,-9.1],[13.5,6.1],[-56.2,119.3],[-81.3,104.1],[-61.0,71.1]];
const C0 = [0, 0], [T1F, CORE, T2, GAL] = shAll([T1F0, CORE0, T2_0, GAL0], C0);
LANDMARKS.sgoue = {zh:'华联海湾大厦', en:'OUE Downtown', cat:'new', r:137, h:201,
  lt:{m:1, c:'#ffe7c4', k:0.45}, build(){
  const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
  const GL1 = {c:'#3a444d', m:1, fh:3.9, cw:1.8}, FIN = {c:'#555b61', m:0, lk:0.2}, MUL1 = {c:'#4c535a', m:0, lk:0.15}, DARK = '#23282d',
    CL2 = {c:'#cfccc4', m:0, lk:0.3}, WIN2 = {c:'#34414c', m:1, fh:4.0, cw:2.2}, ROOF = '#8b8e90', MECH = '#6e7376', FOUND = '#bdb7ab', PAVE = '#c4beb2',
    GLG = {c:'#4a5660', m:1, fh:5.5, cw:3.2}, FING = {c:'#dcdcd6', m:0, lk:0.3}, LOB = {c:'#b4c2c6', m:0, glow:'#ffe6c0', gk:0.8}, GRID = '#5d6368', LEAF = {c:'#4f7a3e', m:0, lk:0.1};
  // ---- Downtown Gallery podium (39 m): glass behind light vertical fins, recessed glazed ground floor, roof garden ----
  const YG = 39;
  foundP(B.p(FOUND), GAL); foundP(B.p(FOUND), T2);
  wallP(B.p(GLG), GAL, 0.3, YG); capP(B.p(ROOF), GAL, YG);
  finsP(B.p(FING), GAL, 6, YG, 2.6, 0.9, 0.35);
  ribP(B.p(FING), GAL, 6, YG, 5.5, 0.5, 0.06); bandAtP(B.p(LOB), GAL, 0.3, 5.7, 0.04);
  bandAtP(B.p(FING), GAL, YG - 1.2, 1.2, 0.3);
  for (const [x, z] of alongP(offP(GAL, 5), 9)){ if (inPolyS(offP(T1F, -3), x, z)) continue; treeP(B.p('#5b4a3a'), B.p(LEAF), x, YG, z, 0.9, R); }
  // ---- Tower 1: four glass blocks between the recessed breaks, deep fins, open-grid crown ----
  const blocks = [[YG, 80], [84, 123], [127, 166], [170, 192]];
  for (const [a, b] of blocks){
    wallP(B.p(GL1), T1F, a, b); capP(B.p(ROOF), T1F, b); capP(B.p(ROOF), T1F, a);
    facadeP(B, T1F, a, b, {mul:MUL1, bay:1.55, fd:0.12, fw:0.05, fh:3.9, band:MUL1, bh:0.18});
    // four bays a face: three deep fins + corner fins
    for (const e of edgesF(T1F)){ if (e.L < 6) continue; for (let k = 0; k <= 4; k++) slabP(B.p(FIN), rectO(k*e.L/4 - 0.35, k*e.L/4 + 0.35, a - 0.4, b + 0.4), e.F, 0, k % 4 ? 1.3 : 0.6); }
    bandAtP(B.p(FIN), T1F, b - 0.9, 0.9, 0.35);
  }
  // breaks: the core and the structural frame show through
  for (const [a, b] of [[80, 84], [123, 127], [166, 170]]){ blkP(B, CORE, a, b, DARK); for (const p of offP(T1F, 1.2)) segP(B.p(FIN), [p[0], a, p[1]], [p[0], b, p[1]], 0.6, 6); }
  // crown 192-201: open grid screen round the core
  blkP(B, CORE, 192, 201, MECH, ROOF);
  for (const e of edgesF(T1F)){ if (e.L < 2) continue; const n = Math.max(1, Math.round(e.L/2.2));
    for (let k = 0; k <= n; k++) slabP(B.p(GRID), rectO(k*e.L/n - 0.12, k*e.L/n + 0.12, 192, 201), e.F, -0.2, 0.2);
    for (let y = 192; y <= 201.01; y += 3) slabP(B.p(GRID), rectO(0, e.L, y - 0.15, y + 0.15), e.F, -0.2, 0.2); }
  lavP(B.p(LAV50), T1F, 201);
  // ---- Tower 2 (150 m): light grey cladding with a grid of small windows, recessed glazed base ----
  wallP(B.p(LOB), offP(T2, 1.5), 0.3, 6); wallP(B.p(CL2), T2, 6, 150); capP(B.p(ROOF), T2, 150);
  for (const p of T2) segP(B.p(CL2), [p[0], 0.3, p[1]], [p[0], 6, p[1]], 0.8, 8);
  winP(B, T2, 8, 146, 4.0, 2.2, 1.3, 2.0, WIN2, {minL:5});
  bandAtP(B.p(CL2), T2, 146, 4, 0.15);
  blkP(B, scP(T2, 0.6), 150, 155, MECH, ROOF); lavP(B.p(LAV50), T2, 150);
  B.flush(g); return g; }};
const PL = LL40(A0[0], A0[1], C0[0], C0[1]);
SG_PLACES.push({type:'sgoue', lat:PL.lat, lon:PL.lon, rot:0});
}
