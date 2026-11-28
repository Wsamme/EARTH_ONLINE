// ================= Church Street / Cecil Street / Robinson Road / Raffles Quay / Central Boulevard group =================
// ---- Samsung Hub, 3 Church Street (sgsamsunghub): 172 m, 30 floors, 2005 (Wikipedia list); 30-storey office building with a
// 6-storey podium (Wikipedia article). OSM w146335667 (height 172; app 145 m). Look (photo, Commons): white grid frame over glass,
// a glazed corner, a tall blade on the roof. Modelled: podium on the footprint to 27 m, tower on the footprint scaled 0.8 to the
// app roof (145 m), the blade to 172 m (OSM height) - the split between roof and blade is an estimate.
{
const A0 = [1.283292, 103.849629];
const F0 = [[0.1,-38.1],[-7.7,-32.6],[-8.9,-29.1],[-30.9,-10.1],[-32.2,-7.1],[-30.4,-1.8],[-0.7,33.2],[10.8,24.4],[14.8,30.2],[33.3,15.4],[21.6,-0.6],[21.6,-4.8]];
const C0 = pcen(F0), [F] = shAll([F0], C0), T = scP(F, 0.8);
K50('sgsamsunghub', '三星中心', 'Samsung Hub', A0, C0, {r:43, h:172, lt:{m:1, c:'#eef4ff', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB();
  const GL = {c:'#4d6878', m:1, fh:4.4, cw:1.6}, WH = {c:'#e8e8e4', m:0, lk:0.3}, BL = {c:'#dfe3e4', m:0, lk:0.5};
  baseP(B, F, 6);
  tw50(B, F, 6, 27, {sty:'cw', gl:GL, mul:WH, band:WH, fh:4.2, bay:3.2, fd:0.5, fw:0.3, bh:0.9});
  tw50(B, T, 27, 145, {sty:'cw', gl:GL, mul:WH, band:WH, fh:4.4, bay:3.2, fd:0.6, fw:0.32, bh:0.9, par:2});
  // the blade: a thin fin standing on the north-east corner of the tower
  const p = T.reduce((a, b) => (b[0] - b[1] > a[0] - a[1] ? b : a)), q = pcen(T), ang = Math.atan2(q[1] - p[1], q[0] - p[0]);
  slabP(B.p(BL), [[0, 120], [9, 120], [9, 150], [1.5, 172], [0, 172]], fA(p[0], p[1], ang), -0.4, 0.4);
  blkP(B, scP(T, 0.45), 145, 149, MECH50, ROOF50); boxP(B.p(LAV50), 0.5, 0.6, 0.5, p[0] + Math.cos(ang)*0.8, 172, p[1] + Math.sin(ang)*0.8);
  B.flush(g); return g; }});
}
// ---- Prudential Tower, 30 Cecil Street (sgprudential): 30 storeys, 1996 (penang-traveltips; OSM w171999306 30 levels). Height not
// verified: the app's 145 m (OSM-derived) is used. Plan from the OSM part w326926563 (0-12 m podium, 12-145 m tower) with its
// curved east side. Facade colours not verified: blue-green glass with light mullions.
{
const A0 = [1.282814, 103.849898];
const T0 = [[-26.4,16.6],[-1.9,29.6],[11.4,12.3],[16.6,1.6],[20.9,-7.7],[-5.4,-21.9]];
const SITE0 = [[3.6,-37.7],[22.7,-5.0],[23.9,-1.4],[24.0,3.7],[22.6,7.9],[19.7,13.2],[13.3,16.4],[8.6,21.4],[4.0,26.6],[0.3,32.7],[-27.7,16.8],[-9.5,-15.8],[-14.7,-22.9]];
const C0 = pcen(T0), [T, SITE] = shAll([T0, SITE0], C0);
K50('sgprudential', '保诚大厦', 'Prudential Tower', A0, C0, {r:43, h:145, lt:{m:1, c:'#e4eeff', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB();
  const GL = {c:'#456c84', m:1, fh:4.3, cw:1.8}, MUL = {c:'#b9c5cc', m:0, lk:0.15}, CL = {c:'#cfccc5', m:0, lk:0.3};
  foundP(B.p(FOUND50), SITE); capP(B.p(PAVE50), SITE, 0.3); baseP(B, T, 6);
  tw50(B, T, 6, 12, {sty:'punch', fr:CL, gl:GL, fh:3, bay:3, ww:2.4, wh:2});
  tw50(B, T, 12, 140, {sty:'cw', gl:GL, mul:MUL, band:MUL, fh:4.3, bay:1.8, fd:0.2, fw:0.06, bh:0.3});
  tw50(B, offP(T, 1.2), 140, 145, {sty:'rib', gl:GL, fr:CL, fh:2.5, sh:1.2, bay:3, mul:null, par:1});
  blkP(B, scP(T, 0.45), 145, 148, MECH50, ROOF50); lavP(B.p(LAV50), [T[0], T[2], T[5]], 145);
  B.flush(g); return g; }});
}
// ---- AIA Tower, 1 Robinson Road (sgaia): 26 storeys, 120 m, 1993 (penang-traveltips - a secondary source, not verified further).
// OSM w47345003: part w580003486 (0-120 m) and an octagonal part w325834251 (69-110 m) inside it; modelled as the tower to 110 m
// and the octagon as a crown to 120 m. Colours not verified: grey-blue glass ribbons, light cladding.
{
const A0 = [1.281986, 103.851098];
const T0 = [[-0.4,-20.5],[-3.4,-19.2],[-18.9,5.0],[-16.6,15.0],[-5.1,22.3],[3.6,19.3],[19.1,-5.0],[15.6,-15.7],[1.9,-24.0]];
const O0 = [[-9.4,-8.7],[-11.9,-4.0],[-8.1,8.5],[-3.4,12.0],[9.1,8.5],[12.6,3.3],[8.4,-9.7],[3.6,-12.2]];
const C0 = pcen(T0), [T, O] = shAll([T0, O0], C0);
K50('sgaia', '友邦大厦', 'AIA Tower', A0, C0, {r:29, h:120, lt:{m:1, c:'#ffeccc', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB();
  const GL = {c:'#4a6273', m:1, fh:4.2, cw:2.0}, CL = {c:'#cdc8bd', m:0, lk:0.35};
  baseP(B, T, 6);
  tw50(B, T, 6, 110, {sty:'rib', gl:GL, fr:CL, fh:4.2, sh:1.5, bay:2.0, par:1.5});
  tw50(B, scP(O, 1.15), 110, 118, {sty:'rib', gl:GL, fr:CL, fh:2.7, sh:1.0, bay:2.4, mul:null});
  blkP(B, scP(O, 0.8), 118, 120, CL, ROOF50); lavP(B.p(LAV50), O.filter((p, i) => i % 2 === 0), 120);
  B.flush(g); return g; }});
}
// ---- 18 Robinson (sg18robinson): 180 m, 28 floors, 2019 (Wikipedia list). KPF: a faceted office tower (twenty office floors)
// raised over a crystalline retail podium, with an atrium garden and a roof garden between them, on a V-shaped site between
// Market Street and Robinson Road (KPF / ArchDaily). OSM w424896147 (app 68 m). Modelled: podium on the footprint to 52 m, an open
// garden level with the offset core to 62 m, the tower on the footprint grown 2 m (it overhangs the podium) to 180 m. Level
// heights are estimates.
{
const A0 = [1.281849, 103.850566];
const F0 = [[28.3,-7.6],[8.6,-19.6],[8.1,-30.4],[-18.2,-30.4],[-18.2,22.4],[-20.2,39.6],[-18.2,45.6],[-7.4,48.6]];
const C0 = pcen(F0), [F] = shAll([F0], C0);
K50('sg18robinson', '罗敏申路18号', '18 Robinson', A0, C0, {r:47, h:180, lt:{m:1, c:'#eaf3ff', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
  const GL = {c:'#5b7584', m:1, fh:4.4, cw:1.6}, GLP = {c:'#6a7f88', m:1, fh:5.2, cw:2.6}, PAN = {c:'#b7a690', m:0, lk:0.3}, MUL = {c:'#c8d0d3', m:0, lk:0.15}, CORE = '#9a9c9a';
  baseP(B, F, 6);
  tw50(B, F, 6, 52, {sty:'cw', gl:GLP, mul:PAN, band:PAN, fh:5.2, bay:2.6, fd:0.35, fw:0.18, bh:0.6});
  // podium facets: diagonal panel strips (abstract nod to the terracotta roof of Lau Pa Sat; no pattern copied)
  for (const e of edgesF(F)) if (e.L > 8){ for (let u = 2; u < e.L - 2; u += 6) slabP(B.p(PAN), [[u, 8], [u + 1.2, 8], [u + 3.2, 50], [u + 2, 50]], e.F, 0, 0.3); }
  capP(B.p('#7d8a74'), F, 52);
  const CO = scP(F, 0.3); blkP(B, CO, 52, 62, CORE);
  for (const p of offP(F, 6)) segP(B.p(CORE), [p[0], 52, p[1]], [p[0], 62, p[1]], 0.7, 8);
  for (const [x, z] of alongP(offP(F, 3.5), 6)) treeP(B.p('#5b4a3a'), B.p({c:'#4f7a3e', m:0, lk:0.1}), x, 52, z, 0.8, R);
  const T = offP(F, -2);
  capP(B.p(ROOF50), T, 62); tw50(B, T, 62, 176, {sty:'cw', gl:GL, mul:MUL, band:MUL, fh:4.4, bay:1.6, fd:0.2, fw:0.06, bh:0.3});
  // faceted crown: the top storeys lean in
  const S = [T.map(p => [p[0], 176, p[1]]), scP(T, 0.9).map(p => [p[0], 180, p[1]])]; loftP(B.p(GL), S, true);
  lavP(B.p(LAV50), [T[0], T[3], T[6]], 180);
  B.flush(g); return g; }});
}
// ---- Hong Leong Building, 16 Raffles Quay (sghongleong): 158 m, 45 floors, 1976 (Wikipedia list "Hong Leong Finance Building";
// Hong Leong Building article). Slab from the OSM part w560203760 (app 145.8 m) inside the site outline w47345013 (plaza).
// Look: 1970s concrete slab with continuous horizontal window ribbons (colours not verified: light grey concrete, dark glass).
{
const A0 = [1.281361, 103.850914];
const T0 = [[2.1,36.7],[23.6,2.4],[-3.2,-14.3],[-25.4,20.2]];
const C0 = pcen(T0), [T] = shAll([T0], C0);
K50('sghongleong', '丰隆大厦', 'Hong Leong Building', A0, C0, {r:30, h:158, lt:{m:1, c:'#ffe9c6', k:0.45}, build(){
  const g = new THREE.Group(), B = mkB();
  const GL = {c:'#38454f', m:1, fh:3.5, cw:2.2}, CO = {c:'#cfcdc6', m:0, lk:0.35}, CO2 = {c:'#bebcb5', m:0, lk:0.3};
  baseP(B, T, 7);
  for (const p of T) segP(B.p(CO), [p[0], 0.3, p[1]], [p[0], 7, p[1]], 0.9, 8);
  tw50(B, T, 7, 152, {sty:'rib', gl:GL, fr:CO, fh:3.22, sh:1.6, bay:3.6, mul:CO2, fd:0.1});
  // end walls: solid concrete bands on the short ends of the slab
  for (const e of edgesF(T)) if (e.L < 33) slabP(B.p(CO2), rectO(0, 3, 7, 152), e.F, 0, 0.3), slabP(B.p(CO2), rectO(e.L - 3, e.L, 7, 152), e.F, 0, 0.3);
  tw50(B, offP(T, 2), 152, 158, {sty:'punch', fr:CO, gl:GL, fh:3, bay:4, ww:2.5, wh:1.5});
  lavP(B.p(LAV50), T, 158);
  B.flush(g); return g; }});
}
// ---- One George Street (sgonegeorge): 153 m, 23 floors, 2005 (Wikipedia list). Massing from the OSM parts of w47300930: the
// 0-23.7 m base on the whole site (w699176990), the main block 23-121 m (w325793736), the top block 121-153 m (w406896271); the
// strip left open between them is the tall open atrium (frame of columns and the roof over it). Look (photo, Commons): bronze-tinted
// glass behind fine vertical fins, large open voids in the volume.
{
const A0 = [1.285739, 103.84779];
const POD0 = [[-4.8,-49.0],[-45.5,19.7],[4.7,48.7],[45.2,-19.5]];
const M0 = [[-4.8,-49.0],[-45.5,19.7],[-17.5,35.7],[22.5,-32.5]];
const TP0 = [[6.5,-42.0],[-34.0,26.2],[-17.5,35.7],[22.5,-32.5]];
const AT0 = [[22.5,-32.5],[45.2,-19.5],[4.7,48.7],[-17.5,35.7]];
const C0 = pcen(POD0), [POD, M, TP, AT] = shAll([POD0, M0, TP0, AT0], C0);
K50('sgonegeorge', '乔治街一号', 'One George Street', A0, C0, {r:54, h:153, lt:{m:1, c:'#ffe4bf', k:0.45}, build(){
  const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
  const GL = {c:'#5b5146', m:1, fh:5.5, cw:1.4}, FIN = {c:'#8a7660', m:0, lk:0.2}, FR = {c:'#6f6252', m:0, lk:0.2};
  baseP(B, POD, 6);
  tw50(B, POD, 6, 23.7, {sty:'fin', gl:GL, fr:FIN, fh:5.9, bay:1.4, fd:0.5, fw:0.12});
  tw50(B, M, 23.7, 121, {sty:'fin', gl:GL, fr:FIN, fh:5.4, bay:1.4, fd:0.55, fw:0.12});
  tw50(B, TP, 121, 153, {sty:'fin', gl:GL, fr:FIN, fh:5.4, bay:1.4, fd:0.55, fw:0.12, par:1});
  capP(B.p('#7d8a74'), AT, 23.8);
  // atrium frame: corner columns, beams every 32 m, a roof slab
  for (const p of [AT[1], AT[2]]) segP(B.p(FR), [p[0], 23.7, p[1]], [p[0], 153, p[1]], 0.9, 8);
  for (const y of [55, 88, 121]) for (const [a, b] of [[AT[0], AT[1]], [AT[1], AT[2]], [AT[2], AT[3]]]) segP(B.p(FR), [a[0], y, a[1]], [b[0], y, b[1]], 0.5, 4);
  wallP(B.p(FR), AT, 150, 153); capP(B.p(ROOF50), AT, 153);
  for (const [x, z] of alongP(offP(AT, 4), 7)) treeP(B.p('#5b4a3a'), B.p({c:'#4f7a3e', m:0, lk:0.1}), x, 23.8, z, 0.9, R);
  lavP(B.p(LAV50), TP, 153);
  B.flush(g); return g; }});
}
// ---- IOI Central Boulevard Towers (sgioi): West Tower 245 m, 2023 (Wikipedia list). Twin office towers by KPF on a shared podium.
// Plans from OSM w1206694672 parts: podium w1075230981 (20.4 m) + w1206694673 (13.8 m), West Tower w1075230983, East Tower
// w1075230982 (both start at 26.4 m; the app data stops at 166 / 60 m - mapped during construction). The East Tower's height is NOT
// verified: 200 m is an estimate. Facade, garden levels and crowns simplified (silver-blue glass with vertical fins, three recessed
// planted breaks per tower, stepped tops).
{
const A0 = [1.279769, 103.851516];
const POD0 = [[58.6,58.1],[83.1,21.4],[-12.9,-40.9],[-11.2,-43.1],[-32.2,-64.6],[-44.7,-75.9],[-57.2,-55.6],[-54.7,-49.9],[-78.2,-14.1],[-39.9,10.6],[-32.2,-0.6]];
const LOW0 = [[46.1,65.9],[53.8,54.6],[-32.2,-0.6],[-39.9,10.6]];
const WT0 = [[-12.4,-41.4],[-11.2,-43.1],[-38.2,-60.4],[-39.2,-58.6],[-44.7,-62.1],[-76.2,-14.9],[-70.2,-11.1],[-71.4,-9.4],[-44.7,7.1],[-43.9,5.9],[-38.7,8.9],[-6.9,-38.4]];
const ET0 = [[13.8,-19.6],[11.6,-20.6],[-9.4,10.6],[-6.9,12.6],[-8.2,14.9],[58.6,58.1],[83.1,21.4],[15.6,-21.9]];
// two small 2-storey pieces at the north-west corner of the podium (OSM w1075230984 and an unnamed piece; 8 m) belong to the complex
const PV0 = [[[11.3,-55.1],[4.1,-60.9],[-9.9,-39.6],[-6.9,-38.4],[-7.7,-37.4],[-2.2,-33.9]], [[-41.2,12.9],[-32.7,18.6],[-30.9,16.1],[-39.9,10.6]]];
const C0 = [0, 0], [POD, LOW, WT, ET] = shAll([POD0, LOW0, WT0, ET0], C0), PV = shAll(PV0, C0);
K50('sgioi', 'IOI中央林荫道大厦', 'IOI Central Boulevard Towers', A0, C0, {r:93, h:245, lt:{m:1, c:'#e8f2ff', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
  const GL = {c:'#62798a', m:1, fh:4.5, cw:1.5}, FIN = {c:'#cfd6d9', m:0, lk:0.2}, PODC = {c:'#c9c9c4', m:0, lk:0.3}, DARK = '#2d353b', LEAF = {c:'#4f7a3e', m:0, lk:0.1};
  foundP(B.p(FOUND50), POD); foundP(B.p(FOUND50), LOW);
  tw50(B, POD, 0.3, 20.4, {sty:'fin', gl:GL, fr:PODC, fh:5, bay:3, fd:0.8, fw:0.4}); capP(B.p('#7d8a74'), POD, 20.45);
  tw50(B, LOW, 0.3, 13.8, {sty:'fin', gl:GL, fr:PODC, fh:4.6, bay:3, fd:0.8, fw:0.4});
  for (const P of PV){ foundP(B.p(FOUND50), P); tw50(B, P, 0.3, 8, {sty:'fin', gl:GL, fr:PODC, fh:4, bay:2.5, fd:0.5, fw:0.3}); }
  for (const [x, z] of alongP(offP(POD, 4), 9)){ if ([WT, ET].some(Q => inPolyS(offP(Q, -2), x, z))) continue; treeP(B.p('#5b4a3a'), B.p(LEAF), x, 20.4, z, 0.9, R); }
  for (const [P, H] of [[WT, 245], [ET, 200]]){
    const brk = [0.3, 0.55, 0.8].map(f => 26.4 + (H - 26.4)*f);
    let y = 20.4;
    for (const b of brk.concat([H - 14])){ tw50(B, P, y, b, {sty:'fin', gl:GL, fr:FIN, fh:4.5, bay:1.5, fd:0.45, fw:0.14}); if (b < H - 14){ wallP(B.p(DARK), offP(P, 2.5), b, b + 9); for (const [x, z] of alongP(offP(P, 1.4), 6)) treeP(B.p('#5b4a3a'), B.p(LEAF), x, b, z, 0.7, R); y = b + 9; } else y = b; }
    const P2 = offP(P, 3.5); tw50(B, P2, H - 14, H - 4, {sty:'fin', gl:GL, fr:FIN, fh:4.5, bay:1.5, fd:0.45, fw:0.14});
    wallP(B.p(FIN), offP(P, 1), H - 14, H); blkP(B, scP(P, 0.5), H - 4, H - 1, MECH50, ROOF50); lavP(B.p(LAV50), P.filter((p, i) => i % 3 === 0), H);
  }
  B.flush(g); return g; }});
}
