// ================= Tanjong Pagar: Shenton Way / Anson Road towers (medium detail on the real OSM plans) =================
// Heights: meta.h from Wikipedia's List of tallest buildings in Singapore where given (Springleaf 165, 76 Shenton 158, Lippo 150,
// Keppel South Central 207); otherwise the app / OSM data heights (MAS 102, Twenty Anson 68 = OSM 20 levels) - not verified.
// Colours and materials from the OSM building:colour / building:material tags; facade rhythms are generic (estimates).

// ---- MAS Building, 10 Shenton Way (sgmasbldg): OSM w43755573 (1985); tower part w172915371 (37 levels, stone #B6A89F, 102 m in
// the data) on the 13.8 m podium filling the footprint. Anchor confirmed by the OSM name.
{
const d0 = D.mas, C0 = pcen(d0.p[6].r), d = PREP(d0, C0);
K50('sgmasbldg', '金融管理局大厦', 'MAS Building', d0.A, C0, {r:58, h:102, lt:{m:1, c:'#ffeccc', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB();
  const ST = STs('#b9ab9f'), ST2 = STs('#a99b8f', 0.3), GL = GLs('#3d4c56', 3.6, 2.2);
  foundP(B.p(FOUND50), d.r); lobby50(B, d.r, 0.3, 5.5, 1.5); wallP(B.p(ST), d.r, 5.5, 13.8); capP(B.p(ROOF50), d.r, 13.8); capP(B.p(ROOF50), offP(d.r, 1.5), 5.5);
  bandAtP(B.p(ST2), d.r, 13.0, 0.8, 0.2); winP(B, d.r, 6.2, 13, 3.6, 3.2, 2.2, 2.2, GL, {minL:4});
  for (const q of [d.p[6]]) tw50(B, q.r, 13.8, 102, {sty:'rib', gl:GL, fr:ST, fh:3.6, sh:1.5, bay:1.8, mul:ST2, par:2.2});
  blkP(B, scP(d.p[6].r, 0.45), 102, 106, MECH50, ROOF50); lavP(B.p(LAV50), d.p[6].r.filter((p, i) => i % 4 === 0), 104.2);
  B.flush(g); return g; }});
}
// ---- Springleaf Tower, 3 Anson Road (sgspringleaf): 165 m, 37 floors, 2002 (Wikipedia list). OSM w47345217 (stone #534d4d,
// height 27 = the podium over the whole footprint) with parts w172915354 (round tower, metal #a0a09e, 165 m) and w172915357
// (pointed slab, 130 m).
{
const d0 = D.spring, C0 = pcen(d0.r), d = PREP(d0, C0);
K50('sgspringleaf', '春叶大厦', 'Springleaf Tower', d0.A, C0, {r:60, h:165, lt:{m:1, c:'#e6f0ff', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB();
  const POD = STs('#5a5352', 0.3), MET = STs('#a6a7a4', 0.3), GL = GLs('#56707c', 4.2, 1.8);
  foundP(B.p(FOUND50), d.r); lobby50(B, d.r, 0.3, 5.5, 1.0); wallP(B.p(POD), d.r, 5.5, 27); capP(B.p(ROOF50), d.r, 27); capP(B.p(ROOF50), offP(d.r, 1), 5.5);
  ribP(B.p(STs('#6b6463', 0.3)), d.r, 8.5, 27, 3.2, 1.0, 0.05);
  tw50(B, d.p[0].r, 27, 130, {sty:'cw', gl:GL, fr:MET, fh:4.2, bay:1.8, par:2});
  tw50(B, d.p[1].r, 27, 165, {sty:'cw', gl:GL, fr:MET, fh:4.2, bay:1.8, par:2.5});
  blkP(B, scP(d.p[1].r, 0.5), 165, 168, MECH50, ROOF50); lavP(B.p(LAV50), d.p[1].r.filter((p, i) => i % 4 === 0), 167.5);
  B.flush(g); return g; }});
}
// ---- 76 Shenton (sg76shenton): 158 m, 40 floors, 2014 (Wikipedia list); OSM w172915342 (DP Architects, 5-level podium over the
// footprint) and tower part w172915356 (39 levels, glass #6c786f, from the 16.5 m podium roof).
{
const d0 = D.s76, C0 = pcen(d0.r), d = PREP(d0, C0);
K50('sg76shenton', '珊顿道76号', '76 Shenton', d0.A, C0, {r:47, h:158, lt:{m:1, c:'#ffeed6', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB();
  const POD = STs('#c7c9c4', 0.3), GL = GLs('#5f6f68', 3.5, 2.0), LED = STs('#e3e5e0', 0.35), T = d.p[1].r;
  foundP(B.p(FOUND50), d.r); lobby50(B, d.r, 0.3, 4.5, 1.0); capP(B.p(ROOF50), offP(d.r, 1), 4.5);
  wallP(B.p(POD), d.r, 4.5, 16.5); capP(B.p({c:'#7b8f6a', m:0, lk:0.1}), d.r, 16.5); winP(B, d.r, 5.5, 16, 3.6, 3.4, 2.4, 1.8, GL, {minL:4});
  wallP(B.p(GL), T, 16.5, 158); capP(B.p(ROOF50), T, 158);
  ledgeP(B.p(LED), T, 16.5 + 3.5, 158, 3.5, 0.9, 0.3); facadeP(B, T, 16.5, 158, {mul:LED, bay:2.4, fd:0.15, fw:0.05, bands:false});
  wallP(B.p(LED), offP(T, -0.2), 158, 161); lavP(B.p(LAV50), T.filter((p, i) => i % 3 === 0), 160.5);
  B.flush(g); return g; }});
}
// ---- Lippo Centre, 78 Shenton Way (sglippo): 150 m, 34 floors, 1990 (Wikipedia list). OSM w172915343: tower part w172915355
// (34 levels, stone #565254, 150 m) with the saw-tooth north face from the OSM plan; low parts w439006025 (metal, 3 levels),
// w439006024 (stone, 3 levels) and the glass block w439006026 (to 40.2 m).
{
const d0 = D.lippo, C0 = pcen(d0.r), d = PREP(d0, C0);
K50('sglippo', '力宝中心', 'Lippo Centre', d0.A, C0, {r:68, h:150, lt:{m:1, c:'#ffeccc', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB();
  const ST = STs('#5e5a5c', 0.3), ST2 = STs('#4c4849', 0.25), GL = GLs('#41505a', 4.2, 2.0), MET = STs('#b8babb', 0.3), GB = GLs('#5c6774', 3.6, 2.2);
  for (const q of d.p) foundP(B.p(FOUND50), q.r);
  tw50(B, d.p[2].r, 0.3, 150, {sty:'rib', gl:GL, fr:ST, fh:4.2, sh:1.6, bay:2.0, mul:ST2, par:2.5});
  lobby50(B, d.p[2].r, 0.3, 6, -0.05);
  low50(B, d.p[0].r, 0.3, 10.5, {wall:MET, gl:GB, fh:3.5, par:0.8}); low50(B, d.p[3].r, 0.3, 10.5, {wall:ST, gl:GB, fh:3.5, par:0.8});
  tw50(B, d.p[1].r, 9.9, 40.2, {sty:'cw', gl:GB, fr:MET, fh:3.6, bay:2.2, par:1.2});
  blkP(B, scP(d.p[2].r, 0.5), 150, 153, MECH50, ROOF50); lavP(B.p(LAV50), d.p[2].r.filter((p, i) => i % 5 === 0), 152.5);
  B.flush(g); return g; }});
}
// ---- Keppel South Central, 1 Hoe Chiang Road (sgkeppelsouth): 207 m, 33 floors, 2025 (Wikipedia list). OSM w1228196509: tower
// part w1228196512 (33 levels, glass, cyan, height 207) plus the second tall part on its north side; low parts w1228196511 / -10
// (2-3 levels, grass roofs). The data tower stops at 109.5 m: raised to the listed 207 m; the top 7 m modelled as a parapet screen
// (the crown form is not verified).
{
const d0 = D.keppel, C0 = pcen(d0.r), d = PREP(d0, C0);
K50('sgkeppelsouth', '吉宝南中心', 'Keppel South Central', d0.A, C0, {r:76, h:207, lt:{m:1, c:'#e2f4ff', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB();
  const GL = GLs('#5d8e98', 4.5, 1.5), MUL = STs('#c9d3d6', 0.25), GRN = {c:'#6f8f55', m:0, lk:0.1}, LOW = STs('#d4d6d2', 0.3), LG = GLs('#6e8c93', 3.5, 2);
  for (const q of d.p) foundP(B.p(FOUND50), q.r);
  for (const q of [d.p[3], d.p[0]]){ tw50(B, q.r, 0.3, 200, {sty:'cw', gl:GL, fr:MUL, fh:4.5, bay:1.5, fd:0.2}); lobby50(B, q.r, 0.3, 7, -0.05);
    wallP(B.p(MUL), offP(q.r, -0.1), 200, 207); finsP(B.p(GL), offP(q.r, -0.1), 200, 207, 1.5, 0.3, 0.12); }
  for (const i of [1, 2, 4, 6]){ const q = d.p[i]; low50(B, q.r, 0.3, q.t, {wall:LOW, gl:LG, fh:3.5}); capP(B.p(GRN), q.r, q.t + 0.02); }
  { const q = d.p[5]; wallP(B.p(LG), q.r, q.b, q.t); capP(B.p(GRN), q.r, q.t); }
  blkP(B, scP(d.p[3].r, 0.45), 200, 203, MECH50, ROOF50); lavP(B.p(LAV50), d.p[3].r.filter((p, i) => i % 2 === 0), 207);
  B.flush(g); return g; }});
}
// ---- Twenty Anson, 20 Anson Road (sgtwentyanson): OSM w172269374 (20 levels, 2009); tower part w172269372 (68 m in the data -
// height not verified, kept). Glass with light frames (estimate).
{
const d0 = D.anson, C0 = pcen(d0.p[0].r), d = PREP(d0, C0);
K50('sgtwentyanson', '安顺路20号', 'Twenty Anson', d0.A, C0, {r:45, h:68, lt:{m:1, c:'#e8f2ff', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB();
  const GL = GLs('#58717d', 3.4, 1.6), FR = STs('#dcdfdd', 0.3), T = d.p[0].r;
  foundP(B.p(FOUND50), T); lobby50(B, T, 0.3, 6, 1.2); capP(B.p(ROOF50), offP(T, 1.2), 6);
  tw50(B, T, 6, 68, {sty:'fin', gl:GL, fr:FR, fh:3.4, bay:1.6, fd:0.45, fw:0.14, par:2.5});
  blkP(B, scP(T, 0.5), 68, 71, MECH50, ROOF50);
  B.flush(g); return g; }});
}
