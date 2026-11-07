// ================= Millenia Tower (1996, Kevin Roche John Dinkeloo), 1 Temasek Avenue =================
// 41 storeys, 223 m (Wikipedia tallest list; OSM height 223; Wikipedia article: roof 218 m). Stone-clad square tower (OSM w48035153,
// 40.8 m square) whose square base rests on four illuminated cylinders that frame a five-storey glass lobby; a massive pyramidal
// roof. The stone grid (piers and spandrels round punched windows) and the 40 m pyramid proportions are estimates. Night: the
// four cylinders glow, lit office windows, the pyramid floodlit warm.
{
const A0 = [1.292629, 103.860299];
const SQ0 = [[28.1,-8.3],[9.0,27.8],[-28.1,8.3],[-9.0,-27.9]];
const C0 = pcen(SQ0), [SQ] = shAll([SQ0], C0);
LANDMARKS.sgmillenia = {zh:'美年大厦', en:'Millenia Tower', cat:'new', r:45, h:223,
  lt:{m:1, c:'#ffe6c4', k:0.6}, build(){
  const g = new THREE.Group(), B = mkB();
  const STONE = {c:'#bdb4a6', m:0, lk:0.25}, STD = {c:'#a89f92', m:0, lk:0.2}, WIN = {c:'#4b5558', m:1, fh:4.2, cw:2.6}, LOB = {c:'#b8c6c8', m:0, glow:'#ffe6c0', gk:0.9},
    CYL = {c:'#e6e1d6', m:0, glow:'#fff0d4', gk:0.85}, PYR = {c:'#c9c6bd', m:0, lc:'#ffe2b0', lk:1.3}, PYRG = {c:'#8ea0a4', m:0, lc:'#ffe2b0', lk:1.0}, PAVE = '#c4bdb0', FOUND = '#b9b2a5',
    LAV = {c:'#c22', glow:'#ff2a1a', gk:2};
  const ang = Math.atan2(SQ[1][1] - SQ[0][1], SQ[1][0] - SQ[0][0]), HS = Math.hypot(SQ[1][0] - SQ[0][0], SQ[1][1] - SQ[0][1])/2;
  const F = frame(0, 0, ang - HP), YL = 24, YB = 186, YT = 223, FH = 3.95;
  const SQP = polyF(F, [[-HS, -HS], [HS, -HS], [HS, HS], [-HS, HS]]);
  // ---- plaza, foundations ----
  const PLZ = polyF(F, [[-HS - 4, -HS - 4], [HS + 4, -HS - 4], [HS + 4, HS + 4], [-HS - 4, HS + 4]]);
  wallP(B.p(FOUND), PLZ, -5, 0.3); capP(B.p(PAVE), PLZ, 0.3);
  // ---- five-storey glass lobby between the four cylinders ----
  const CR = 5.2, CI = HS - CR + 0.4;
  prismP(B.p(LOB), polyF(F, [[-HS + 3, -HS + 3], [HS - 3, -HS + 3], [HS - 3, HS - 3], [-HS + 3, HS - 3]]), 0.3, YL);
  for (const [su, sv] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]){ const p = F.P(su*CI, sv*CI); latheP(B.p(CYL), [[CR, 0.3], [CR, YL - 1.5], [CR + 0.3, YL - 1.5], [CR + 0.3, YL]], p[0], p[1], 24); }
  // lobby mullions
  for (const e of edgesF(polyF(F, [[-HS + 3, -HS + 3], [HS - 3, -HS + 3], [HS - 3, HS - 3], [-HS + 3, HS - 3]]))){ const n = Math.round(e.L/2.2); for (let k = 1; k < n; k++) slabP(B.p(STD), rectO(k*e.L/n - 0.07, k*e.L/n + 0.07, 0.3, YL), e.F, 0, 0.25); }
  // ---- tower: stone body with a grid of piers and spandrels; windows behind ----
  prismP(B.p(WIN), offP(SQP, 0.5), YL, YB);
  prismP(B.p(STONE), SQP, YL, YL + 2.4);
  for (const e of edgesF(SQP)){
    const nb = 12, bw = e.L/nb;
    for (let k = 0; k <= nb; k++){ const w = k === 0 || k === nb ? 1.3 : 0.55; slabP(B.p(STONE), rectO(Math.max(0, k*bw - w), Math.min(e.L, k*bw + w), YL + 2.4, YB), e.F, -0.5, 0.3); }
    for (let y = YL + 2.4 + FH; y < YB - 1; y += FH) slabP(B.p(STONE), rectO(0, e.L, y - 1.05, y), e.F, -0.5, 0.12);
    // corner reveals: a slight double step down each corner
    for (const u of [0.0, e.L - 1.3]) slabP(B.p(STD), rectO(u, u + 1.3, YL + 2.4, YB), e.F, 0.3, 0.6);
  }
  // ---- cornice, then the pyramid with ribbed metal / glass faces ----
  prismP(B.p(STONE), offP(SQP, -0.8), YB, YB + 2.2);
  const PT = [], PH = YT - YB - 2.2;
  const base = polyF(F, [[-HS - 0.4, -HS - 0.4], [HS + 0.4, -HS - 0.4], [HS + 0.4, HS + 0.4], [-HS - 0.4, HS + 0.4]]);
  for (let i = 0; i < 4; i++){ const a = base[i], b = base[(i + 1) % 4]; triP(B.p(PYR), [a[0], YB + 2.2, a[1]], [b[0], YB + 2.2, b[1]], [0, YT - 3, 0]); }
  // ribs on each face (batched), and recessed glazed panels
  for (let i = 0; i < 4; i++){ const a = base[i], b = base[(i + 1) % 4];
    for (let k = 1; k < 10; k++){ const t = k/10, p = [a[0] + (b[0] - a[0])*t, YB + 2.2, a[1] + (b[1] - a[1])*t]; segP(B.p(PYRG), p, [p[0]*0.0 + (p[0])*0.02, YT - 3.5, p[2]*0.02], 0.22, 4); }
    for (let k = 1; k < 5; k++){ const f = k/5, y = YB + 2.2 + PH*f*0.93, s = 1 - f*0.93;
      segP(B.p(PYRG), [a[0]*s, y, a[1]*s], [b[0]*s, y, b[1]*s], 0.25, 4); } }
  segP(B.p(PYR), [0, YT - 3.5, 0], [0, YT, 0], 0.3, 6); boxP(B.p(LAV), 0.5, 0.5, 0.5, 0, YT, 0);
  B.flush(g); return g; }};
const PL = LL40(A0[0], A0[1], C0[0], C0[1]);
SG_PLACES.push({type:'sgmillenia', lat:PL.lat, lon:PL.lon, rot:0});
}
