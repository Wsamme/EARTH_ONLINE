// ================= Capital Tower (2000, RSP Architects Planners & Engineers), 168 Robinson Road =================
// 52 floors, 254 m roof (Wikipedia; CTBUH 255.4 m architectural, 231.7 m to the top occupied floor), glass curtain wall
// (Permasteelisa), composite perimeter columns round a central core. Massing from the OSM building:parts of w47345009: a
// pinwheel plan (each of the four ~42 m faces stepped forward at one end) rising to 190 m, then a 50.6 x 33.1 m block to 229 m
// and a 40.3 x 22.9 m top block to 254 m. Night: lit office floors and a colour-changing crown (Wikipedia: parts of the facade
// change colour every few seconds) -> anim 'cycle'.
{
const A0 = [1.277641, 103.847636];
const SITE0 = [[9.9,-31.3],[12.3,-34.8],[27.2,-25.3],[24.8,-21.2],[43.9,-9.3],[10.5,44.6],[-45.0,10.8],[-10.4,-43.7]];
const MAIN0 = [[27.8,-5.8],[26.0,-2.8],[33.8,1.9],[11.1,38.1],[3.3,33.4],[1.5,35.8],[-34.3,13.2],[-33.1,10.8],[-40.3,6.1],[-17.6,-29.5],[-10.4,-25.3],[-8.0,-28.3]];
const UP0 = [[-15.8,-23.0],[27.2,3.7],[9.3,31.6],[-33.7,4.9]], TOP0 = [[-14.6,-15.8],[20.0,4.9],[8.1,24.5],[-26.5,3.1]];
const C0 = pcen(MAIN0), [SITE, MAIN, UP, TOPB] = shAll([SITE0, MAIN0, UP0, TOP0], C0);
LANDMARKS.sgcapitaltower = {zh:'资本大厦', en:'Capital Tower', cat:'new', r:50, h:254,
  lt:{m:1, c:'#bfe6ff', k:0.6, anim:'cycle', c2:'#8f7dff'}, build(){
  const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
  const GL = {c:'#5d8d97', m:1, fh:4.4, cw:3.0}, GLU = {c:'#5a8992', m:1, fh:4.4, cw:3.0}, MUL = {c:'#c8d0d2', m:0, lk:0.15}, BAND = {c:'#8fa8ae', m:0, lk:0.15},
    LOB = {c:'#b9c7c6', m:0, glow:'#ffe2b8', gk:0.8}, COL = '#d8d6cf', PAVE = '#c2bcb0', FOUND = '#bdb7ab', ROOF = '#8d9294', MECH = '#6f7577',
    LED = {c:'#dfe8ea', m:0, lc:'#86e4ff', lk:1.5, glow:'#7fd8ff', gk:0.55}, LAV = {c:'#c22', glow:'#ff2a1a', gk:2}, TRK = '#5b4a3a', LEAF = {c:'#4f7a3e', m:0, lk:0.1};
  const Y0 = 12.5, Y1 = 190, Y2 = 229, Y3 = 254;
  // ---- plaza on the site, foundations ----
  wallP(B.p(FOUND), SITE, -5, 0.4); capP(B.p(PAVE), SITE, 0.4);
  wallP(B.p(FOUND), MAIN, -5, 0.4);
  for (const [x, z] of alongP(offP(SITE, 3.2), 9)){ if (inPolyS(offP(MAIN, -2.5), x, z)) continue; treeP(B.p(TRK), B.p(LEAF), x, 0.4, z, 1.15, R); }
  // ---- lobby: glass behind the composite perimeter columns ----
  prismP(B.p(LOB), offP(MAIN, 1.8), 0.4, Y0);
  for (const [x, z] of alongP(MAIN, 9)) segP(B.p(COL), [x, 0.4, z], [x, Y0, z], 0.55, 8);
  // ---- shaft to 190 m: glass, mullions, floor bands, a deeper spandrel at the 163 m break ----
  prismP(B.p(GL), MAIN, Y0, Y1);
  facadeP(B, MAIN, Y0, Y1, {mul:MUL, band:BAND, bay:3.0, fd:0.4, fh:4.4, bh:0.45});
  bandAtP(B.p(BAND), MAIN, Y0 - 1.2, 1.2, 0.12); bandAtP(B.p(BAND), MAIN, 162.4, 1.4, 0.14); bandAtP(B.p(BAND), MAIN, Y1 - 1.3, 1.3, 0.15);
  capP(B.p(ROOF), offP(MAIN, 0.3), Y1 - 0.01);
  // ---- upper blocks ----
  prismP(B.p(GLU), UP, Y1, Y2); facadeP(B, UP, Y1, Y2, {mul:MUL, band:BAND, bay:3.0, fd:0.4, fh:4.4, bh:0.45});
  bandAtP(B.p(BAND), UP, Y2 - 1.3, 1.3, 0.15); capP(B.p(ROOF), offP(UP, 0.3), Y2 - 0.01);
  prismP(B.p(GLU), TOPB, Y2, Y3 - 4); facadeP(B, TOPB, Y2, Y3 - 4, {mul:MUL, band:BAND, bay:3.0, fd:0.4, fh:4.4, bh:0.45});
  // crown: open screen round the roof plant, LED edges on every step
  wallP(B.p(MUL), offP(TOPB, 0.2), Y3 - 4, Y3); capP(B.p(ROOF), offP(TOPB, 0.4), Y3 - 3.5);
  for (const e of edgesF(TOPB)){ const n = Math.round(e.L/1.5); for (let k = 0; k < n; k++) shapeP(B.p(MECH), rectO((k + 0.2)*e.L/n, (k + 0.8)*e.L/n, Y3 - 3.6, Y3 - 0.6), e.F, 0.05); }
  for (const [P, y] of [[MAIN, Y1], [UP, Y2], [TOPB, Y3]]) bandAtP(B.p(LED), P, y - 0.5, 0.5, 0.2);
  for (const p of TOPB) boxP(B.p(LAV), 0.5, 0.6, 0.5, p[0]*0.97, Y3, p[1]*0.97);
  B.flush(g); return g; }};
const PL = LL40(A0[0], A0[1], C0[0], C0[1]);
SG_PLACES.push({type:'sgcapitaltower', lat:PL.lat, lon:PL.lon, rot:0});
}
