// ================= V on Shenton, 5 Shenton Way (sgvshenton, hero) =================
// UNStudio with Architects 61 (e-architect / Wikipedia): a 53/54-storey residential tower of 237 m and a 23-storey office tower of
// 123 m on a shared plinth (car park, sky garden over the whole 8th storey); facades on a hexagon pattern (office: curtain-wall
// hexagon module; residential: balconies, bay windows and planters stacked into the pattern); sky lobbies on the 24th and 34th
// floors; a chamfer line frames each tower and the plinth and lights up as a continuous line at night. Plans from OSM: plinth parts
// (26.4 m) over the site w448084975; residential shafts w560229133 + w560229131 with the link w560229135; office tower w560229136.
// Look (photo, Commons 2025): residential tower of two joined shafts with white balcony bands and open lattice crowns; office tower
// silver glass with white hexagon lines; grey plinth with a large hexagon panel pattern.
{
const A0 = [1.277411, 103.849369];
const SITE0 = [[31.4,-80.1],[-58.5,61.7],[-30.2,79.4],[50.9,-50.7],[53.9,-55.4],[55.9,-58.4],[58.6,-62.9]];
const RA0 = [[-48.7,54.9],[-43.2,57.9],[-47.0,63.1],[-30.2,73.1],[-14.7,47.6],[-36.2,34.6]];
const RB0 = [[1.5,21.6],[-20.0,8.6],[-33.7,31.1],[-12.2,44.1]];
const LK0 = [[-33.7,31.1],[-36.2,34.6],[-14.7,47.6],[-12.2,44.1]];
const OF0 = [[-7.0,-15.9],[18.3,-0.4],[52.3,-56.6],[51.0,-61.4],[29.0,-74.4]];
const C0 = pcen(SITE0), [SITE, RA, RB, LK, OF] = shAll([SITE0, RA0, RB0, LK0, OF0], C0);
// honeycomb lines (pointy-top hexagons, flat-to-flat width cw) on facade frame F over u0..u1, v0..v1, strips of width t at offset w
function hexF(o, F, u0, u1, v0, v1, cw, t, w){
  const hh = cw/Math.sqrt(3), rs = 1.5*hh; // hexagon circumradius, row step
  const seg = (a, b) => { // clip to the face box, then a thin strip
    let [ua, va] = a, [ub, vb] = b; if ((ua < u0 && ub < u0) || (ua > u1 && ub > u1) || (va < v0 && vb < v0) || (va > v1 && vb > v1)) return;
    const cu = x => Math.max(u0, Math.min(u1, x)), cv = x => Math.max(v0, Math.min(v1, x)); ua = cu(ua); ub = cu(ub); va = cv(va); vb = cv(vb);
    const L = Math.hypot(ub - ua, vb - va); if (L < 0.2) return; const nu = -(vb - va)/L*t/2, nv = (ub - ua)/L*t/2;
    shapeP(o, [[ua + nu, va + nv], [ub + nu, vb + nv], [ub - nu, vb - nv], [ua - nu, va - nv]], F, w); };
  for (let r = 0, v = v0; v < v1 + hh; r++, v += rs) for (let u = u0 + (r % 2 ? cw/2 : 0); u < u1 + cw; u += cw){
    const P = []; for (let k = 0; k < 6; k++){ const a = PI/6 + k*PI/3; P.push([u + Math.cos(a)*hh, v + Math.sin(a)*hh]); }
    seg(P[5], P[0]); seg(P[0], P[1]); seg(P[1], P[2]); }
}
LANDMARKS.sgvshenton = {zh:'V on Shenton', en:'V on Shenton', cat:'new', r:91, h:237,
  lt:{m:1, c:'#eaf2ff', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
  const GLR = {c:'#56636d', m:1, fh:3.9, cw:2.4}, LEDGE = {c:'#e3e5e3', m:0, lk:0.25}, GLO = {c:'#6f8290', m:1, fh:4.2, cw:3.0}, HEX = {c:'#e6e9ea', m:0, lk:0.3},
    POD = {c:'#9c9e9d', m:0, lk:0.25}, PODG = {c:'#4f5a62', m:1, fh:3.3, cw:3}, ROOF = '#8b8e90', FOUND = '#bdb7ab', PAVE = '#c4beb2', DARK = '#2b3238',
    CH = {c:'#f2f4f4', m:0, glow:'#e8f4ff', gk:1.1}, LAT = '#d7dadb', LOB = {c:'#b4c2c6', m:0, glow:'#ffe6c0', gk:0.8}, LEAF = {c:'#4f7a3e', m:0, lk:0.1};
  const YP = 26.4, YR = 226, YRT = 237, YO = 123;
  // ---- plinth: grey hexagon panels, a glazed base, the sky-garden deck on top ----
  foundP(B.p(FOUND), SITE); wallP(B.p(POD), SITE, 6, YP); capP(B.p('#7d8a74'), SITE, YP);
  wallP(B.p(LOB), offP(SITE, 1.2), 0.3, 6); capP(B.p(PAVE), SITE, 0.3);
  for (const e of edgesF(SITE)) if (e.L > 8){ hexF(B.p(HEX), e.F, 0, e.L, 6.5, YP - 0.5, 6.5, 0.22, 0.06); slabP(B.p(ROOF), rectO(0, e.L, 5.6, 6.4), e.F, 0, 1.6); }
  for (const p of SITE) segP(B.p(CH), [p[0], YP + 0.05, p[1]], [p[0], 6.4, p[1]], 0.18, 4);
  bandAtP(B.p(CH), SITE, YP - 0.25, 0.25, 0.1);
  for (const [x, z] of alongP(offP(SITE, 4), 10)){ if ([RA, RB, LK, OF].some(Q => inPolyS(offP(Q, -2), x, z))) continue; treeP(B.p('#5b4a3a'), B.p(LEAF), x, YP, z, 0.8, R); }
  // ---- residential tower: two shafts and the recessed link, balcony bands, sky-lobby breaks, lattice crowns ----
  for (const P of [RA, RB]){
    wallP(B.p(GLR), P, YP, YR); capP(B.p(ROOF), P, YR);
    ledgeP(B.p(LEDGE), P, YP + 3.9, YR - 1, 3.9, 0.9, 0.35);
    // irregular bay windows / planters: short white fins at varying places on each floor (fixed pattern from the rng)
    for (const e of edgesF(P)) if (e.L > 6) for (let y = YP + 3.9; y < YR - 4; y += 3.9){ const n = 1 + (R()*3 | 0); for (let k = 0; k < n; k++){ const u = 1 + R()*(e.L - 2); slabP(B.p(LEDGE), rectO(u - 0.15, u + 0.15, y, y + 3.9), e.F, 0, 0.9); } }
    for (const yb of [88.8, 127.8]) wallP(B.p(DARK), offP(P, 1.0), yb, yb + 3.9);
    for (const p of P) segP(B.p(CH), [p[0], YP, p[1]], [p[0], YR, p[1]], 0.16, 4);
    latticeP(B.p(LAT), offP(P, 0.3), YR, YRT, 3.2, 0.18, 3, true);
    capP(B.p(ROOF), offP(P, 3), YR + 1.5); lavP(B.p(LAV50), [P[0], P[2]], YRT);
  }
  wallP(B.p(GLR), offP(LK, 0.8), YP, YR - 4); ledgeP(B.p(LEDGE), offP(LK, 0.8), YP + 3.9, YR - 5, 3.9, 0.5, 0.3);
  // ---- office tower: silver glass with white hexagon lines, chamfer-line edges ----
  wallP(B.p(GLO), OF, YP, YO); capP(B.p(ROOF), OF, YO);
  for (const e of edgesF(OF)) if (e.L > 4) hexF(B.p(HEX), e.F, 0, e.L, YP, YO, 6.0, 0.28, 0.08);
  for (const p of OF) segP(B.p(CH), [p[0], YP, p[1]], [p[0], YO, p[1]], 0.18, 4);
  bandAtP(B.p(CH), OF, YO - 0.3, 0.3, 0.12);
  blkP(B, scP(OF, 0.55), YO, YO + 4, '#767b7e', ROOF); lavP(B.p(LAV50), [OF[0], OF[2]], YO);
  B.flush(g); return g; }};
const PL = LL40(A0[0], A0[1], C0[0], C0[1]);
SG_PLACES.push({type:'sgvshenton', lat:PL.lat, lon:PL.lon, rot:0});
}
