// ================= Battery Road / Collyer Quay / Raffles Place group =================
// ---- Maybank Tower, 2 Battery Road (sgmaybank): 32 storeys, 175 m (Wikipedia list; article 175.26 m). OSM parts of w106193386:
// podium w1075240989 (17.1 m), lower tower w1075240988 (16.5-42.9 m), upper tower split in a west strip w325793730 and an east
// piece w1075553558 (42.9-175 m). Look (photos): beige stone bands alternating with blue glass on the vertical part; the east face
// a blue glass facet leaning in so the tower narrows towards the top; white podium. No bank sign.
{
const A0 = [1.285884, 103.852534];
const POD0 = [[-20.0,-16.5],[-0.2,23.8],[0.8,25.0],[5.8,26.3],[8.0,24.5],[17.0,13.8],[17.5,11.5],[-0.2,-26.0]];
const LOW0 = [[9.8,-4.5],[6.3,-13.5],[-10.0,-21.2],[-20.0,-16.5],[-3.2,17.3],[6.8,12.5]];
const W0 = [[6.8,12.5],[-10.0,-21.2],[-20.0,-16.5],[-3.2,17.3]], E0 = [[6.8,12.5],[9.8,-4.5],[6.3,-13.5],[-10.0,-21.2]];
const C0 = pcen(LOW0), [POD, LOW, W, E] = shAll([POD0, LOW0, W0, E0], C0);
K50('sgmaybank', '马来亚银行大厦', 'Maybank Tower', A0, C0, {r:32, h:175, lt:{m:1, c:'#dfeaff', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB();
  const ST = {c:'#d8ccb4', m:0, lk:0.35}, GL = {c:'#3f6c9a', m:1, fh:4.1, cw:2.0}, WH = {c:'#e7e4dc', m:0, lk:0.35}, MUL = {c:'#9fb3c4', m:0, lk:0.15};
  const YT = 175, YL = 42.9;
  foundP(B.p(FOUND50), POD); wallP(B.p(WH), POD, 0.3, 17.1); capP(B.p(ROOF50), POD, 17.1); bandAtP(B.p(LOB50), POD, 0.3, 5, 0.04);
  finsP(B.p(ST), POD, 5, 17.1, 2.4, 0.4, 0.4);
  tw50(B, LOW, 17.1, YL, {sty:'rib', gl:GL, fr:ST, fh:4.1, sh:1.9, bay:1.6, mul:MUL});
  tw50(B, W, YL, YT, {sty:'rib', gl:GL, fr:ST, fh:4.1, sh:1.9, bay:1.6, mul:MUL, par:2.5});
  // the leaning east facet: loft E, its two outer corners drawn in towards the shared edge W-E as it rises
  const S1 = E[0], S2 = E[3], dx = S2[0] - S1[0], dz = S2[1] - S1[1], L2 = dx*dx + dz*dz;
  const sec = t => E.map((p, i) => { if (i === 0 || i === 3) return p; const k = ((p[0] - S1[0])*dx + (p[1] - S1[1])*dz)/L2, q = [S1[0] + dx*k, S1[1] + dz*k]; return [q[0] + (p[0] - q[0])*(1 - 0.82*t), q[1] + (p[1] - q[1])*(1 - 0.82*t)]; });
  const S = []; for (let i = 0; i <= 8; i++){ const t = i/8; S.push(sec(t).map(p => [p[0], YL + (YT - YL)*t, p[1]])); }
  loftP(B.p(GL), S, true);
  for (let y = YL + 4.1; y < YT - 1; y += 4.1){ const t = (y - YL)/(YT - YL), P = sec(t); bandAtP(B.p(MUL), P, y, 0.25, 0.04); }
  blkP(B, scP(W, 0.6), YT, YT + 3, MECH50, ROOF50); lavP(B.p(LAV50), W, YT + 2.5);
  B.flush(g); return g; }});
}
// ---- Straits Trading Building, 9 Battery Road (sgstraitstrading): 157 m, 29 floors, 2010 (Wikipedia list); 28-storey Grade A
// tower by Team Design Architects with two double-storey open-air gardens (property news, Jan 2008). OSM footprint w171999283
// (named "MYP Centre" in OSM); the app has only its 22 m podium. The tower outline is not in the data: modelled on the main body
// of the footprint scaled to 72 % (about 1,000 m2, in line with the ~8,300 sq ft floors quoted) - an estimate.
{
const A0 = [1.285042, 103.852358];
const FP0 = [[15.7,-31.6],[-32.6,-8.6],[-34.3,8.3],[2.6,10.6],[-1.4,47.0],[3.4,47.0],[5.2,47.4],[18.1,7.9],[21.3,7.7],[23.6,-24.2],[24.0,-30.3]];
const BODY0 = [[15.7,-31.6],[-32.6,-8.6],[-34.3,8.3],[2.6,10.6],[18.1,7.9],[21.3,7.7],[23.6,-24.2],[24.0,-30.3]];
const C0 = pcen(BODY0), [FP, BODY] = shAll([FP0, BODY0], C0), TW = scP(BODY, 0.72);
K50('sgstraitstrading', '海峡贸易大厦', 'Straits Trading Building', A0, C0, {r:64, h:157, lt:{m:1, c:'#e4f2ff', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
  const GL = {c:'#4f7684', m:1, fh:4.3, cw:1.8}, FIN = {c:'#c3cbcd', m:0, lk:0.2}, POD = {c:'#c9c7c0', m:0, lk:0.3}, DARK = '#2c3338';
  foundP(B.p(FOUND50), FP); wallP(B.p(POD), FP, 5, 22); capP(B.p(ROOF50), FP, 22); wallP(B.p(LOB50), offP(FP, 1), 0.3, 5); capP(B.p(ROOF50), FP, 5.2);
  winP(B, FP, 6, 21, 4, 3, 2.2, 2.6, GL, {minL:6});
  tw50(B, TW, 22, 157, {sty:'fin', gl:GL, fr:FIN, fh:4.3, bay:1.8, fd:0.5, fw:0.18, par:3});
  // the two double-height open-air gardens (recessed, planted)
  for (const yb of [70, 114]){ wallP(B.p(DARK), offP(TW, 2.5), yb, yb + 8.6); for (const [x, z] of alongP(offP(TW, 1.4), 5)) treeP(B.p('#5b4a3a'), B.p({c:'#4f7a3e', m:0, lk:0.1}), x, yb, z, 0.7, R); }
  capP(B.p('#3d4a57'), offP(TW, 2), 156.5); lavP(B.p(LAV50), TW.filter((p, i) => i % 2 === 0), 160);
  B.flush(g); return g; }});
}
// ---- 30 Raffles Place (sg30raffles): 152 m, 33 floors, 1993 (Wikipedia list; OSM w106193388 "Chevron House", 33 levels, 152 m,
// tower parts from 16 m). Rounded west end from the OSM outline. Facade materials not verified: neutral warm-grey stone ribbons
// and blue-green glass, a glazed base. No signs.
{
const A0 = [1.284169, 103.85197];
const T0 = [[-15.2,-15.6],[-15.7,-13.9],[-19.4,-13.9],[-24.2,-12.1],[-27.7,-8.6],[-29.9,-1.6],[-29.9,2.6],[-26.4,8.6],[-21.2,12.6],[15.8,16.4],[16.6,11.6],[27.8,12.1],[29.6,-8.6],[28.6,-10.4],[26.6,-11.6]];
const C0 = pcen(T0), [T] = shAll([T0], C0);
K50('sg30raffles', '莱佛士坊30号', '30 Raffles Place', A0, C0, {r:36, h:152, lt:{m:1, c:'#ffe9cc', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB();
  const GL = {c:'#46707a', m:1, fh:4.3, cw:2.2}, ST = {c:'#b9aa9a', m:0, lk:0.35}, ST2 = {c:'#a79888', m:0, lk:0.3};
  foundP(B.p(FOUND50), T); wallP(B.p(ST), T, 0.3, 16); bandAtP(B.p(LOB50), T, 0.3, 5.5, 0.05); winP(B, T, 6, 15.5, 4.8, 3.2, 2.2, 3, GL, {minL:3});
  tw50(B, T, 16, 146, {sty:'rib', gl:GL, fr:ST, fh:4.3, sh:1.6, bay:2.2, mul:ST2});
  bandAtP(B.p(ST2), T, 16, 1.2, 0.2);
  const T2 = offP(T, 1.5); tw50(B, T2, 146, 152, {sty:'punch', fr:ST, gl:GL, fh:3, bay:3, ww:2, wh:1.6});
  blkP(B, scP(T, 0.5), 152, 155, MECH50, ROOF50); lavP(B.p(LAV50), [T[5], T[11]], 152);
  B.flush(g); return g; }});
}
// ---- 16 Collyer Quay (sg16collyer): 179 m, 33 floors, 1993 (Wikipedia list); the Wikipedia article (Collyer Quay Centre, former
// Hitachi Tower / Caltex House) gives 37 storeys and 166 m - modelled as a 166 m roof with the mast to 179 m. OSM w407926393 with
// a rounded south end (parts w172915353 / w172915363). Look (photo, Commons 2005): blue-green glass with white floor spandrels,
// stepped vertical set-backs, a mast on top.
{
const A0 = [1.284177, 103.852571];
const T0 = [[-4.9,-21.8],[-8.1,-11.8],[-10.3,-4.4],[-13.5,5.4],[-14.3,9.6],[-13.5,14.2],[-11.0,17.8],[-7.3,20.4],[-3.1,21.3],[1.5,20.4],[4.9,18.0],[7.8,14.3],[13.2,-5.3],[16.3,-15.3]];
const RND0 = [[8.2,10],[7.4,6],[4.4,1.8],[1.7,-0.7],[-10.3,-4.2],[-14.3,9.5],[-13.3,14.3],[-11.1,17.8],[-7.3,20.3],[-3.3,21.3],[1.7,20.3],[5.2,17.8],[7.4,14.3]];
const C0 = pcen(T0), [T, RND] = shAll([T0, RND0], C0);
K50('sg16collyer', '哥烈码头16号', '16 Collyer Quay', A0, C0, {r:27, h:179, lt:{m:1, c:'#e6f4ff', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB();
  const GL = {c:'#4b7d88', m:1, fh:4.3, cw:1.8}, WH = {c:'#e3e6e4', m:0, lk:0.3}, MAST = '#c9cccd';
  baseP(B, T, 5.5);
  tw50(B, T, 5.5, 140, {sty:'rib', gl:GL, fr:WH, fh:4.3, sh:1.0, bay:1.8, mul:{c:'#a9bcc0', m:0, lk:0.1}});
  const R1 = offP(RND, 1.2); tw50(B, R1, 140, 154, {sty:'rib', gl:GL, fr:WH, fh:4.3, sh:1.0, bay:1.8, mul:null});
  const R2 = scP(R1, 0.7); tw50(B, R2, 154, 166, {sty:'rib', gl:GL, fr:WH, fh:4.3, sh:1.0, bay:1.8, mul:null, par:1.2});
  const c = pcen(R2); segP(B.p(MAST), [c[0], 166, c[1]], [c[0], 179, c[1]], 0.35, 6); segP(B.p(MAST), [c[0], 166, c[1]], [c[0], 172, c[1]], 0.8, 6);
  boxP(B.p(LAV50), 0.5, 0.6, 0.5, c[0], 179, c[1]); lavP(B.p(LAV50), [T[0], T[13]], 140);
  B.flush(g); return g; }});
}
// ---- The Arcade, 11 Collyer Quay (sgthearcade): 20 storeys (OSM w171999284, 20 levels); the height is the app's 65 m (OSM-derived,
// not verified). Block from the OSM part w1566589603 (0-15 m podium, 15-65 m). Facade not verified: plain light cladding with
// window ribbons. (The 1909 Moorish Arcade on this site is long gone; nothing of it is modelled.)
{
const A0 = [1.283611, 103.852069];
const T0 = [[-1.7,-11.1],[-7.0,7.9],[42.5,21.7],[47.8,2.7]];
const C0 = pcen(T0), [T] = shAll([T0], C0);
K50('sgthearcade', '拱廊大厦', 'The Arcade', A0, C0, {r:30, h:65, lt:{m:1, c:'#ffe9cc', k:0.4}, build(){
  const g = new THREE.Group(), B = mkB();
  const GL = {c:'#47606c', m:1, fh:3.25, cw:2.0}, CL = {c:'#d6d0c3', m:0, lk:0.35};
  baseP(B, T, 5);
  wallP(B.p(CL), T, 5, 15); winP(B, T, 5.5, 15, 3.3, 2.6, 2.0, 2.0, GL, {minL:4}); bandAtP(B.p(CL), T, 14.6, 0.8, 0.3);
  tw50(B, T, 15, 65, {sty:'rib', gl:GL, fr:CL, fh:3.25, sh:1.3, bay:2.0, par:1.2});
  blkP(B, scP(T, 0.45), 65, 68, MECH50, ROOF50);
  B.flush(g); return g; }});
}
// ---- One Marina Boulevard / NTUC Centre (sgntuc): 163 m, 32 floors, 2004 (Wikipedia list; OSM w172915350 31 levels, 163 m; the
// Wikipedia article's 110 m disagrees and is not used). Plan from OSM parts w463857957 (tower) and w463857955 (27 m wing). Look
// (photo, Commons): green glass curtain wall with fine vertical mullions, flat top. No union logo.
{
const A0 = [1.282282, 103.852673];
const T0 = [[-16.9,7.0],[-1.4,17.0],[-2.7,18.7],[15.3,30.7],[38.1,-4.3],[33.1,-7.3],[34.3,-8.5],[20.6,-17.5],[20.1,-15.5],[18.8,-16.3],[10.6,-3.3],[-4.4,-12.8],[-0.2,-19.3],[-18.7,-31.0],[-34.2,-8.5],[-33.7,-8.0],[-37.2,-3.3],[-18.2,9.2]];
const WG0 = [[-19.9,11.7],[-4.4,21.2],[-1.4,17.0],[-16.9,7.0]];
const C0 = pcen(T0), [T, WG] = shAll([T0, WG0], C0);
K50('sgntuc', '职总中心', 'One Marina Boulevard (NTUC Centre)', A0, C0, {r:43, h:163, lt:{m:1, c:'#dff7ee', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB();
  const GL = {c:'#3d7067', m:1, fh:4.3, cw:1.5}, MUL = {c:'#9fbdb6', m:0, lk:0.12}, CL = {c:'#c8ccc9', m:0, lk:0.3};
  baseP(B, T, 6); foundP(B.p(FOUND50), WG);
  tw50(B, T, 6, 160, {sty:'cw', gl:GL, mul:MUL, band:MUL, fh:4.3, bay:1.5, fd:0.18, fw:0.05, bh:0.25, par:3});
  tw50(B, WG, 0.3, 27, {sty:'cw', gl:GL, mul:MUL, band:MUL, fh:4.3, bay:1.5, fd:0.18, fw:0.05, bh:0.25});
  blkP(B, scP(T, 0.45), 160, 164, MECH50, ROOF50); lavP(B.p(LAV50), [T[3], T[4], T[13], T[14]], 163);
  B.flush(g); return g; }});
}
