// ================= Altez, 16 Enggor Street (sgaltez, hero) =================
// Wikipedia / CTBUH: residential tower by RSP Architects for Far East Organization, 2014, 62 storeys, 250 m (architectural top),
// all-concrete; Woh Hup: one 62-storey 280-unit tower with commercial space on the first storey. OSM: tower part w393100852
// (62 levels, glass #525b60, from 10 m to 250 m) on the 10 m podium w172023443 (metal #5d6166). The neighbour to the east is
// Skysuites@Anson (w393100851 / w172023451, not modelled) - the plan stays on Altez's own footprint.
// The facade composition, crown and podium-roof layout could not be checked against a readable source (photos only): modelled as a
// dark glass curtain wall with light slab edges, a glazed shop base, a plain parapet crown with roof plant - generic, estimated.
{
const A0 = D.altez.A, T0 = D.altez.p[0].r, P0 = D.altez.p[1].r, C0 = pcen(T0), [TW, POD] = shAll([T0, P0], C0);
K50('sgaltez', 'Altez', 'Altez', A0, C0, {r:47, h:250, lt:{m:1, c:'#e8f0ff', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
  const GL = GLs('#4f5a62', 3.87, 1.5), MET = {c:'#5d6166', m:0, lk:0.25}, EDGE = {c:'#c9cdd0', m:0, lk:0.3}, MUL = {c:'#7d878d', m:0, lk:0.2},
    DECK = {c:'#7b8f6a', m:0, lk:0.1}, SHOP = {c:'#b6c4c8', m:0, glow:'#ffe6c0', gk:0.85};
  const Y0 = 10, YR = 246, YT = 250;
  // podium: dark metal cladding, glazed shopfronts on the first storey, planted deck
  foundP(B.p(FOUND50), POD); wallP(B.p(MET), POD, 4.6, Y0); wallP(B.p(SHOP), offP(POD, 0.8), 0.3, 4.6); capP(B.p(ROOF50), offP(POD, 0.8), 4.6);
  bandAtP(B.p(MET), POD, 4.4, 0.6, 0.25); capP(B.p(DECK), POD, Y0); wallP(B.p(MET), offP(POD, -0.15), Y0, Y0 + 1.1);
  finsP(B.p(MUL), POD, 5, Y0, 1.6, 0.15, 0.12);
  for (const [x, z] of alongP(offP(POD, 2.5), 7)) if (!inPolyS(offP(TW, -1.5), x, z)) treeP(B.p('#5b4a3a'), B.p({c:'#4f7a3e', m:0, lk:0.1}), x, Y0, z, 0.8, R);
  // tower: glass with mullions and light slab edges every storey
  wallP(B.p(GL), TW, Y0, YR);
  facadeP(B, TW, Y0, YR, {mul:MUL, bay:1.5, fd:0.18, fw:0.05, bands:false});
  ribP(B.p(EDGE), TW, Y0 + 3.87, YR, 3.87, 0.35, 0.12);
  bandAtP(B.p(EDGE), TW, Y0, 0.8, 0.2);
  // crown: parapet screen and roof plant
  capP(B.p(ROOF50), TW, YR); wallP(B.p(MUL), offP(TW, -0.1), YR, YT);
  finsP(B.p(EDGE), offP(TW, -0.1), YR, YT, 1.5, 0.2, 0.1);
  blkP(B, scP(TW, 0.55), YR, YR + 3, MECH50, ROOF50);
  lavP(B.p(LAV50), TW, YT);
  B.flush(g); return g; }});
}
