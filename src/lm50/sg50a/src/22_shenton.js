// ================= Robinson Road / Shenton Way / McCallum Street group =================
// ---- Robinson 77 (former SIA Building), 77 Robinson Road (sgrobinson77): 176 m, 40 floors, 1998 (Wikipedia list). Tower from the
// OSM part w325793733 (the rest of the site outline w47345028 has no building part in the data: left as a planted forecourt).
// Look (photo, Commons): dark blue reflective glass, notched corners, the top stepping in.
{
const A0 = [1.277787, 103.848471];
const SITE0 = [[-8.0,43.7],[0.3,29.8],[8.3,16.2],[34.2,-24.5],[5.1,-42.1],[-18.5,-3.7],[-16.6,1.7],[-32.9,29.2]];
const T0 = notchR(-12.3, 22.6, 14.4, 15.9, 29.6*PI/180, 2.5);
const C0 = pcen(T0), [SITE, T] = shAll([SITE0, T0], C0);
K50('sgrobinson77', '罗敏申77', 'Robinson 77', A0, C0, {r:68, h:176, lt:{m:1, c:'#e2ecff', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
  const GL = {c:'#2f4f74', m:1, fh:4.1, cw:1.6}, MUL = {c:'#5c7894', m:0, lk:0.12};
  foundP(B.p(FOUND50), SITE); capP(B.p(PAVE50), SITE, 0.3); baseP(B, T, 6);
  for (const [x, z] of alongP(offP(SITE, 3), 9)){ if (inPolyS(offP(T, -3), x, z)) continue; treeP(B.p('#5b4a3a'), B.p({c:'#4f7a3e', m:0, lk:0.1}), x, 0.3, z, 1.0, R); }
  tw50(B, T, 6, 160, {sty:'cw', gl:GL, mul:MUL, band:MUL, fh:4.1, bay:1.6, fd:0.12, fw:0.05, bh:0.2});
  const T2 = scP(T, 0.82), T3 = scP(T, 0.6);
  tw50(B, T2, 160, 169, {sty:'cw', gl:GL, mul:MUL, band:MUL, fh:4.1, bay:1.6, fd:0.12, fw:0.05, bh:0.2});
  tw50(B, T3, 169, 176, {sty:'cw', gl:GL, mul:MUL, band:MUL, fh:3.5, bay:1.6, fd:0.12, fw:0.05, bh:0.2});
  lavP(B.p(LAV50), T3.filter((p, i) => i % 3 === 0), 176);
  B.flush(g); return g; }});
}
// ---- CapitaSky, 79 Robinson Road (sgcapitasky): 185 m, 29 floors, 2022 (Wikipedia list). Tower from the OSM parts of w45098519:
// w986968492 (from 6.6 m, a break at 66.6-72.6 m - a sky terrace) on the 7.2 m base w986968491. Facade simplified: pale blue glass
// with vertical fins.
{
const A0 = [1.277032, 103.847987];
const SITE0 = [[10.8,-50.4],[39.4,-33.5],[2.9,27.6],[-0.5,33.4],[-8.7,47.0],[-10.7,50.5],[-39.3,33.6],[-29.1,16.5]];
const T0 = [[-0.4,33.7],[39.6,-33.3],[10.8,-50.5],[-29.2,16.5]];
const C0 = pcen(SITE0), [SITE, T] = shAll([SITE0, T0], C0);
K50('sgcapitasky', '凯德天空', 'CapitaSky', A0, C0, {r:57, h:185, lt:{m:1, c:'#e8f4ff', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
  const GL = {c:'#5f8197', m:1, fh:4.5, cw:1.5}, FIN = {c:'#d4dbde', m:0, lk:0.2}, DARK = '#2d353b';
  foundP(B.p(FOUND50), SITE); wallP(B.p(LOB50), SITE, 0.3, 7.2); capP(B.p('#7d8a74'), SITE, 7.2);
  tw50(B, T, 7.2, 66.6, {sty:'fin', gl:GL, fr:FIN, fh:4.5, bay:1.5, fd:0.5, fw:0.14});
  wallP(B.p(DARK), offP(T, 3), 66.6, 72.6); capP(B.p('#7d8a74'), T, 66.65);
  for (const [x, z] of alongP(offP(T, 1.6), 6)) treeP(B.p('#5b4a3a'), B.p({c:'#4f7a3e', m:0, lk:0.1}), x, 66.6, z, 0.8, R);
  for (const p of T) segP(B.p(FIN), [p[0], 66.6, p[1]], [p[0], 72.6, p[1]], 0.6, 6);
  tw50(B, T, 72.6, 180, {sty:'fin', gl:GL, fr:FIN, fh:4.5, bay:1.5, fd:0.5, fw:0.14});
  wallP(B.p(FIN), T, 180, 185); blkP(B, scP(T, 0.5), 180, 183, MECH50, ROOF50); lavP(B.p(LAV50), T, 185);
  B.flush(g); return g; }});
}
// ---- Oxley Tower, 138 Robinson Road (sgoxley): 174 m, 33 floors, 2017 (Wikipedia list). OSM footprint w172270395 (app 92 m).
// Look (photo, Commons Jul 2026): a rounded (elliptical) glass tower with a domed top and a dark band below it, on a curving
// glass podium. Modelled: podium on the footprint (corners rounded) to 20 m (estimate), the elliptical shaft inside it.
{
const A0 = [1.278686, 103.848407];
const F0 = [[-22.2,7.9],[4.1,23.9],[30.3,-18.9],[4.1,-35.4]];
const C0 = pcen(F0), [F] = shAll([F0], C0);
const ANG = Math.atan2(-18.9 - 23.9, 30.3 - 4.1); // long axis
const ell = (a, b, n) => { const P = []; for (let i = 0; i < n; i++){ const t = i/n*TAU, x = Math.cos(t)*a, z = Math.sin(t)*b; P.push([x*Math.cos(ANG) - z*Math.sin(ANG), x*Math.sin(ANG) + z*Math.cos(ANG)]); } return P; };
K50('sgoxley', '奥斯利大厦', 'Oxley Tower', A0, C0, {r:34, h:174, lt:{m:1, c:'#e8f2ff', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB();
  const GL = {c:'#577a8f', m:1, fh:4.4, cw:1.6}, MUL = {c:'#b8c8d0', m:0, lk:0.12}, DARK = {c:'#2c343b', m:0, lk:0.2};
  const PODP = ell(25.0, 15.2, 40), TP = ell(21.0, 12.5, 40);
  foundP(B.p(FOUND50), PODP); wallP(B.p(LOB50), offP(PODP, 1), 0.3, 6);
  tw50(B, PODP, 6, 20, {sty:'cw', gl:GL, mul:MUL, band:MUL, fh:4.6, bay:2, fd:0.15, fw:0.05});
  slabP(B.p(MUL), PODP.map(p => [p[0]*1.06, p[1]*1.06]).reverse(), (u, v, w) => [u, 20 + (w || 0), v], -0.3, 0.3);
  tw50(B, TP, 20, 150, {sty:'cw', gl:GL, mul:MUL, band:MUL, fh:4.4, bay:2, fd:0.12, fw:0.05, bh:0.18, cap:false});
  wallP(B.p(DARK), TP, 150, 154);
  // domed top: the ellipse narrows to a rounded cap at 174 m
  const S = []; for (let i = 0; i <= 8; i++){ const t = i/8, k = Math.cos(t*HP*0.92); S.push(TP.map(p => [p[0]*(0.25 + 0.75*k), 154 + 20*Math.sin(t*HP), p[1]*(0.25 + 0.75*k)])); }
  loftP(B.p(GL), S, true);
  boxP(B.p(LAV50), 0.5, 0.6, 0.5, 0, 174, 0);
  B.flush(g); return g; }});
}
// ---- One Shenton, 1 Shenton Way (sgoneshenton): two residential towers, 214 m and 178 m, 2011 (Wikipedia list; article: 341
// apartments, the taller tower 50 storeys; two sides of each tower clad in gold and two in blue glass). Plans from the OSM parts of
// w47345021: w325793774 (214 m tower, north) and w325793778 (178 m tower, south; app 169 m), on the site outline (OSM 9 levels:
// podium modelled to 30 m, estimate). Look (photo, Commons): open lattice crowns - pointed on the taller tower, rounded on the lower.
// Which two sides are gold is not verified (here: the north- and west-facing ones).
{
const A0 = [1.279292, 103.850553];
const SITE0 = [[-38.7,34.0],[-35.5,28.9],[12.8,-49.7],[38.7,-34.0],[8.9,14.6],[3.4,23.4],[-9.3,44.2],[-12.7,49.7]];
const TA0 = [[23.8,-11.9],[29.8,-21.4],[28.5,-21.9],[30.3,-24.9],[23.3,-30.9],[15.5,-35.6],[7.8,-38.4],[2.3,-30.1],[5.8,-27.9],[3.5,-23.1]];
const TB0 = [[5.3,15.1],[4.3,14.4],[4.0,13.4],[4.0,12.4],[5.8,8.9],[5.3,8.4],[8.3,3.6],[-8.5,-5.9],[-18.7,8.9],[-22.2,15.4],[-20.5,16.6],[-22.7,20.9],[-19.2,24.9],[-13.7,28.6],[-5.5,30.4],[-0.7,26.1]];
const C0 = pcen(SITE0), [SITE, TA, TB] = shAll([SITE0, TA0, TB0], C0);
K50('sgoneshenton', '珊顿道一号', 'One Shenton', A0, C0, {r:57, h:214, lt:{m:1, c:'#fff0d0', k:0.55}, build(){
  const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
  const GO = {c:'#c4a25a', m:1, fh:3.6, cw:2.2}, BL = {c:'#3d6c99', m:1, fh:3.6, cw:2.2}, LED = {c:'#e6e2d6', m:0, lk:0.3}, POD = {c:'#b9b6ae', m:0, lk:0.3}, LAT = '#cfc39b';
  const YP = 30;
  foundP(B.p(FOUND50), SITE); wallP(B.p(LOB50), offP(SITE, 1), 0.3, 5);
  wallP(B.p(POD), SITE, 5, YP); capP(B.p('#7d8a74'), SITE, YP); finsP(B.p(LED), SITE, 5, YP, 1.8, 0.5, 0.3);
  for (const [x, z] of alongP(offP(SITE, 4), 9)){ if ([TA, TB].some(Q => inPolyS(offP(Q, -2), x, z))) continue; treeP(B.p('#5b4a3a'), B.p({c:'#4f7a3e', m:0, lk:0.1}), x, YP, z, 0.8, R); }
  const gold = e => (e.nz < -0.3 || e.nx < -0.3); // outward normal facing north or west
  for (const [P, Y1, YT, pointed] of [[TA, 200, 214, true], [TB, 168, 178, false]]){
    wallsByEdge(B, P, YP, Y1, BL, e => gold(e) ? GO : null); capP(B.p(ROOF50), P, Y1);
    ledgeP(B.p(LED), P, YP + 3.6, Y1 - 1, 3.6, 0.7, 0.3);
    for (const yb of [YP + (Y1 - YP)*0.45, YP + (Y1 - YP)*0.75]) wallP(B.p('#2c343a'), offP(P, 1), yb, yb + 3.6);
    // lattice crown
    const Pc = offP(P, 0.3), c = pcen(Pc), H = YT - Y1, N = 5;
    for (let k = 0; k < N; k++){ const s0 = pointed ? 1 - k/N*0.9 : Math.cos(k/N*HP*0.9), s1 = pointed ? 1 - (k + 1)/N*0.9 : Math.cos((k + 1)/N*HP*0.9);
      const y0 = Y1 + H*k/N, y1 = Y1 + H*(k + 1)/N, A = Pc.map(p => [c[0] + (p[0] - c[0])*s0, c[1] + (p[1] - c[1])*s0]), Bq = Pc.map(p => [c[0] + (p[0] - c[0])*s1, c[1] + (p[1] - c[1])*s1]);
      for (let i = 0; i < A.length; i += 2){ segP(B.p(LAT), [A[i][0], y0, A[i][1]], [Bq[i][0], y1, Bq[i][1]], 0.22, 4); const j = (i + 2) % A.length; segP(B.p(LAT), [A[i][0], y0, A[i][1]], [A[j][0], y0, A[j][1]], 0.18, 4); } }
    boxP(B.p(LAV50), 0.5, 0.6, 0.5, c[0], YT, c[1]);
  }
  B.flush(g); return g; }});
}
// ---- SBF Center, 160 Robinson Road (sgsbf): 187 m, 31 floors, 2016 (Wikipedia list). Massing from the OSM parts (outline unmatched):
// podium w48948265 (30 m), middle block w393385346 (30-60 m), tower w393385345 (60-190 m in OSM; list height 187 m used). Look
// (photo, Commons): dark glass with horizontal bands and flowing light lines, a planted terrace on the podium.
{
const A0 = [1.278132, 103.847859];
const POD0 = [[-37.7,3.4],[20.8,40.1],[38.8,12.4],[-1.2,-12.6],[12.6,-35.6],[-4.7,-46.4]];
const MID0 = [[-5.4,-43.4],[-33.9,2.4],[19.6,34.9],[29.8,18.9],[-4.2,-4.9],[-9.7,-4.9],[8.8,-34.4]];
const TW0 = [[-5.4,-43.4],[-33.9,2.4],[-19.7,11.1],[8.8,-34.4]];
const C0 = pcen(POD0), [PODP, MID, TW] = shAll([POD0, MID0, TW0], C0);
K50('sgsbf', '新加坡工商联合总会大厦', 'SBF Center', A0, C0, {r:51, h:187, lt:{m:1, c:'#e6efff', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
  const GL = {c:'#33424e', m:1, fh:4.2, cw:1.6}, WL = {c:'#dfe3e4', m:0, lk:0.35}, PODC = {c:'#c6c4bd', m:0, lk:0.3};
  baseP(B, PODP, 6);
  tw50(B, PODP, 6, 30, {sty:'fin', gl:GL, fr:PODC, fh:4.5, bay:2.2, fd:0.6, fw:0.5});
  capP(B.p('#7d8a74'), PODP, 30.05);
  for (const [x, z] of alongP(offP(PODP, 3), 7)){ if (inPolyS(offP(MID, -2), x, z)) continue; treeP(B.p('#5b4a3a'), B.p({c:'#4f7a3e', m:0, lk:0.1}), x, 30, z, 0.8, R); }
  tw50(B, MID, 30, 60, {sty:'rib', gl:GL, fr:WL, fh:4.2, sh:0.6, bay:1.6, mul:null});
  tw50(B, TW, 60, 183, {sty:'rib', gl:GL, fr:WL, fh:4.2, sh:0.6, bay:1.6, mul:null});
  // flowing light lines: gentle waves across the long faces
  for (const e of edgesF(TW)) if (e.L > 30) for (let y0 = 72; y0 < 175; y0 += 26){ const N = 16; for (let k = 0; k < N; k++){ const u0 = e.L*k/N, u1 = e.L*(k + 1)/N, v0 = y0 + 5*Math.sin(k/N*TAU), v1 = y0 + 5*Math.sin((k + 1)/N*TAU); shapeP(B.p(WL), [[u0, v0 - 0.35], [u1, v1 - 0.35], [u1, v1 + 0.35], [u0, v0 + 0.35]], e.F, 0.12); } }
  wallP(B.p(WL), TW, 183, 187); blkP(B, scP(TW, 0.5), 183, 186, MECH50, ROOF50); lavP(B.p(LAV50), TW, 187);
  B.flush(g); return g; }});
}
// ---- The Clift, 21 McCallum Street (sgclift): 151 m, 43 floors, 2010 (Wikipedia list). Residential slab from the OSM part
// w326926550 inside the site outline w171995553 (plaza). Facade not verified: grey glass with white floor slabs, a roof frame.
{
const A0 = [1.279424, 103.847354];
const SITE0 = [[32.3,-6.3],[10.5,30.2],[-32.0,5.0],[-11.4,-29.3]];
const T0 = [[-23.2,-7.8],[17.3,17.0],[25.8,2.7],[-14.2,-22.0]];
const C0 = pcen(T0), [SITE, T] = shAll([SITE0, T0], C0);
K50('sgclift', 'The Clift', 'The Clift', A0, C0, {r:38, h:151, lt:{m:1, c:'#fff0d8', k:0.45}, build(){
  const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
  const GL = {c:'#4c5d68', m:1, fh:3.3, cw:2.0}, WH = {c:'#e4e5e2', m:0, lk:0.3};
  foundP(B.p(FOUND50), SITE); capP(B.p(PAVE50), SITE, 0.3); baseP(B, T, 6);
  for (const [x, z] of alongP(offP(SITE, 3), 8)){ if (inPolyS(offP(T, -3), x, z)) continue; treeP(B.p('#5b4a3a'), B.p({c:'#4f7a3e', m:0, lk:0.1}), x, 0.3, z, 0.9, R); }
  tw50(B, T, 6, 145, {sty:'rib', gl:GL, fr:WH, fh:3.3, sh:0.45, bay:3.3, mul:WH, fd:0.3, fw:0.1});
  for (const e of edgesF(T)) if (e.L > 30) for (const f of [0.25, 0.5, 0.75]) slabP(B.p(WH), rectO(e.L*f - 0.5, e.L*f + 0.5, 6, 145), e.F, 0, 0.6);
  latticeP(B.p(WH), offP(T, 0.2), 145, 151, 3.3, 0.2, 2, false); blkP(B, scP(T, 0.6), 145, 148, MECH50, ROOF50);
  lavP(B.p(LAV50), [T[0], T[2]], 151);
  B.flush(g); return g; }});
}
// ---- Robinson Point, 39 Robinson Road (sgrobinsonpoint): 21 storeys (OSM w47345018); height not verified - the app's 71 m. Plan
// from the OSM part w172915351 (stepped cross) inside the site outline. A Commons photo of July 2026 shows the tower under
// refurbishment (scaffolding, new glass); modelled as a plain light-grey tower with glass ribbons.
{
const A0 = [1.279586, 103.849547];
const SITE0 = [[-25.1,8.9],[3.0,26.2],[25.1,-8.9],[-2.9,-26.2]];
const T0 = [[-1.5,9.4],[5.5,14.1],[9.7,7.1],[8.0,6.4],[14.0,-3.6],[1.5,-10.6],[2.0,-11.9],[-4.5,-15.4],[-8.8,-8.9],[-7.5,-8.4],[-13.5,1.1],[-1.0,8.4]];
const C0 = pcen(T0), [SITE, T] = shAll([SITE0, T0], C0);
K50('sgrobinsonpoint', '罗敏申点', 'Robinson Point', A0, C0, {r:32, h:71, lt:{m:1, c:'#ffecd0', k:0.4}, build(){
  const g = new THREE.Group(), B = mkB();
  const GL = {c:'#4d6470', m:1, fh:3.3, cw:2.0}, CL = {c:'#cfccc6', m:0, lk:0.35};
  foundP(B.p(FOUND50), SITE); capP(B.p(PAVE50), SITE, 0.3); baseP(B, T, 5);
  tw50(B, T, 5, 68, {sty:'rib', gl:GL, fr:CL, fh:3.0, sh:1.1, bay:2.2, par:1.2});
  blkP(B, scP(T, 0.5), 68, 71, MECH50, ROOF50);
  B.flush(g); return g; }});
}
