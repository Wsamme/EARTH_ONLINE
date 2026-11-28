// ================= Outram (SGH campus) and Tiong Bahru (medium detail on the real OSM plans) =================
// Heights from the app / OSM levels data (not verified) unless noted; colours from the OSM building:colour tags.

// ---- Academia, 20 College Road (sgsghacademia): OSM w172268002 "Academia" with parts w1065816809 "Diagnostics Tower" and
// w1065816810 "Discovery Tower" (white, 13 levels, 43.5 m), the teal glass centre w1065816807 (5 levels at the base, to 39.6 m
// plus a 43.5 m roof piece), the white link w1065816808 (16.5-23.7 m), the orange 2-level link w1065816806. The east canopy w1065816805 is left out (its hull would hide a neighbour).
{
const d0 = D.acad, C0 = pcen(d0.r), d = PREP(d0, C0);
K50('sgsghacademia', '新加坡中央医院学术大楼', 'Academia (SGH Campus)', d0.A, C0, {r:68, h:43.5, lt:{m:1, c:'#f0f6ff', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB();
  const WH = STs('#eeefec', 0.4), GL = GLs('#5f7680', 3.3, 1.6), TEAL = GLs('#3f8a88', 3.3, 2.0), OR = STs('#d98a3d', 0.35), GR = STs('#9a9d9c', 0.3);
  for (const q of d.p) foundP(B.p(FOUND50), q.r);
  for (const i of [0, 8]){ const T = d.p[i].r; tw50(B, T, 0.3, 43.5, {sty:'fin', gl:GL, fr:WH, fh:3.3, bay:1.6, fd:0.6, fw:0.2, par:1.2}); lobby50(B, T, 0.3, 4.5, -0.05); }
  { const q = d.p[6]; tw50(B, q.r, 0.3, 39.6, {sty:'cw', gl:TEAL, fr:WH, fh:3.3, bay:2.4}); const q2 = d.p[4]; wallP(B.p(TEAL), q2.r, 39.6, 43.5); capP(B.p(ROOF50), q2.r, 43.5); }
  { const q = d.p[3]; wallP(B.p(WH), q.r, q.b, q.t); capP(B.p(ROOF50), q.r, q.t); capP(B.p(WH), q.r, q.b); ribP(B.p(GL), q.r, q.b + 1, q.t - 0.5, 3.6, 2.0, 0.04); }
  // the small campus block in the notch east of the towers (app footprint, 18.2 m in the data, unnamed) falls under the hull: plain block
  { const T = shP(D.acadx.r, C0[0], C0[1]); foundP(B.p(FOUND50), T); low50(B, T, 0.3, 18.2, {wall:STs('#d9d9d4', 0.35), gl:GL, fh:3.6, par:0.8}); }
  { const q = d.p[1]; wallP(B.p(OR), q.r, 3.3, 7.2); capP(B.p(ROOF50), q.r, 7.2); wallP(B.p(LOB50), d.p[2].r, 0.3, 3.3); }
  B.flush(g); return g; }});
}
// ---- National Heart Centre Singapore, 5 Hospital Drive (sgnhcs): OSM w463203749 with parts w463203746 (12 levels, metal,
// crimson, 40.2 m), the glazed slot between it and the north block, w463203747 (7 levels, concrete #bfbebb) and w463203748 (7 levels,
// glass #38474a), both 23.7 m.
{
const d0 = D.nhcs, C0 = pcen(d0.r), d = PREP(d0, C0);
K50('sgnhcs', '国家心脏中心', 'National Heart Centre Singapore', d0.A, C0, {r:66, h:40.2, lt:{m:1, c:'#fff0e0', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB();
  const RED = STs('#a3363b', 0.35), GL = GLs('#4f6068', 3.3, 1.8), CON = STs('#c2c1bd', 0.35), DG = GLs('#3a494c', 3.3, 2.0);
  for (const q of d.p) foundP(B.p(FOUND50), q.r);
  { const T = d.p[0].r; wallP(B.p(RED), T, 0.3, 40.2); capP(B.p(ROOF50), T, 40.2); ribP(B.p(GL), T, 4.6, 39.5, 3.3, 1.7, 0.05); lobby50(B, T, 0.3, 4.4, -0.05); wallP(B.p(RED), offP(T, -0.1), 40.2, 41.4); }
  for (const i of [1, 2]){ const q = d.p[i]; wallP(B.p(GLs('#7d939b', 3.3, 3)), q.r, q.b || 0.3, q.t); capP(B.p(ROOF50), q.r, q.t); }
  { const T = d.p[3].r; tw50(B, T, 0.3, 23.7, {sty:'punch', fr:CON, gl:GL, fh:3.3, bay:2.6, ww:1.8, wh:1.7, par:1}); }
  { const T = d.p[4].r; tw50(B, T, 0.3, 23.7, {sty:'cw', gl:DG, fr:STs('#5b6a6d', 0.3), fh:3.3, bay:2.0, par:1}); }
  B.flush(g); return g; }});
}
// ---- National Cancer Centre Singapore, 30 Hospital Boulevard (sgnccs): NCCS moved into its new 24-storey building in 2023
// (nccs.com.sg, 19 May 2023: "its new 24-storey home", "ample glass cladding"); the old six-storey building at 11 Hospital Crescent
// (the target row's w47415661) is not the current centre and is left to the app. Anchor: OSM w513237970 (Nominatim "National Cancer
// Centre Singapore, 30 Hospital Boulevard"; reref SC/lm50/sg50b/ref_sg50b_2.json) with parts w1065816882 (24 levels, metal, orange),
// w1065816881 (21 levels, glass, teal) and w1065816880 (11 levels, orange). Heights are the app's (79.8 / 69.9 / 36.9 m, from the
// OSM levels) - the real height is not published in the sources found (estimate).
{
const d0 = D.nccs, C0 = pcen(d0.r), d = PREP(d0, C0);
K50('sgnccs', '国家癌症中心', 'National Cancer Centre Singapore', d0.A, C0, {r:66, h:79.8, lt:{m:1, c:'#fff0e0', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB();
  const OR = STs('#cf7d3c', 0.35), OR2 = STs('#b86a30', 0.3), TEAL = GLs('#3d7f86', 3.3, 1.6), GL = GLs('#58707a', 3.3, 1.8);
  for (const q of d.p) foundP(B.p(FOUND50), q.r);
  for (const i of [1, 2]){ const q = d.p[i]; wallP(B.p(GL), q.r, Math.max(0.3, q.b), q.t); capP(B.p(ROOF50), q.r, q.t);
    finsP(B.p(OR), q.r, Math.max(4.2, q.b), q.t, 1.4, 0.7, 0.45); ribP(B.p(OR2), q.r, 4.2, q.t, 3.3, 0.5, 0.08); }
  lobby50(B, d.p[1].r, 0.3, 4.2, 0.8); wallP(B.p(OR), offP(d.p[1].r, -0.1), 79.8, 82);
  { const q = d.p[3]; tw50(B, q.r, 0.3, 69.9, {sty:'cw', gl:TEAL, fr:STs('#a8c4c6', 0.3), fh:3.3, bay:1.6, par:1.5}); lobby50(B, q.r, 0.3, 4.4, -0.05); }
  for (const i of [0, 4]){ const q = d.p[i]; wallP(B.p(GL), q.r, Math.max(0.3, q.b), q.t); capP(B.p({c:'#6f8f55', m:0, lk:0.1}), q.r, q.t); finsP(B.p(OR), q.r, Math.max(4.2, q.b), q.t, 1.6, 0.6, 0.4); }
  B.flush(g); return g; }});
}
// ---- Tiong Bahru Market, 30 Seng Poh Road (sgtbmarket): OSM r21297472 "Tiong Bahru Market" (building=retail, amenity=marketplace):
// outer w172241893 round an open inner court w172241921. The app has no footprint here (open ground) - nothing to hide. Two storeys
// (wet market below, food centre above); wall heights and the pitched roof ring are estimates.
{
const d0 = D.tbm, C0 = pcen(d0.r), [OUT, HOLE] = shAll([d0.r, d0.h], C0);
K50('sgtbmarket', '中峇鲁市场', 'Tiong Bahru Market', d0.A, C0, {r:68, h:13.5, lt:{m:0, c:'#ffe6c2', k:0.55}, build(){
  const g = new THREE.Group(), B = mkB();
  const WL = STs('#e6e2d8', 0.5), COL = STs('#d2cdc2', 0.45), DARK = {c:'#4a5157', m:0, glow:'#ffe0b0', gk:0.8}, ROOF = '#9e5a42', FL = STs('#bdb7ab', 0.4);
  foundP(B.p(FOUND50), OUT, 0.3); capHoleP(B.p(FL), OUT, [HOLE], 0.32);
  // ground floor: open market behind columns; upper floor: food centre with a parapet band; same on the court side
  for (const P of [OUT, HOLE]){ const Q = P === OUT ? offP(P, 1.8) : offP(P, -1.8);
    wallP(B.p(DARK), Q, 0.3, 9.6); for (const [x, z] of alongP(P, 5.5)) segP(B.p(COL), [x, 0.3, z], [x, 9.6, z], 0.3, 6);
    bandAtP(B.p(WL), P, 4.4, 1.3, 0.05); bandAtP(B.p(WL), P, 8.8, 0.9, 0.05); }
  capHoleP(B.p(FL), OUT, [HOLE], 4.4);
  // roof: pitched ring from both edges up to a flat crown strip
  const O2 = offP(OUT, 7), H2 = offP(HOLE, -5);
  loftP(B.p(ROOF), [offP(OUT, -0.8).map(p => [p[0], 9.4, p[1]]), O2.map(p => [p[0], 13.5, p[1]])]);
  loftP(B.p(ROOF), [offP(HOLE, 0.8).map(p => [p[0], 9.4, p[1]]), H2.map(p => [p[0], 13.5, p[1]])]);
  capHoleP(B.p(ROOF), O2, [H2], 13.5);
  B.flush(g); return g; }});
}
// ---- Tiong Bahru Plaza, 302 Tiong Bahru Road (sgtbplaza): OSM w172117296 with parts w509205036 (mall, 4 levels, stone #C4CED3,
// 13.8 m), w509205035 / w509205037 (2 levels, 7.2 m) and the office tower parts w509205039 (to 60 m) and w509205038 / w509210375
// (to 53.4 m; stone #958D82, levels 2-18) - heights from the data.
{
const d0 = D.tbp, C0 = pcen(d0.r), d = PREP(d0, C0);
K50('sgtbplaza', '中峇鲁广场', 'Tiong Bahru Plaza', d0.A, C0, {r:108, h:60, lt:{m:1, c:'#ffeccc', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB();
  const MALL = STs('#c9d1d5', 0.35), MALL2 = STs('#b3bcc1', 0.3), TW = STs('#9b9389', 0.35), GL = GLs('#4c5d66', 3.3, 2.0), GL2 = GLs('#5e7480', 3.6, 2.6);
  for (const q of d.p) foundP(B.p(FOUND50), q.r);
  for (const i of [5, 4, 1]){ const q = d.p[i]; lobby50(B, q.r, 0.3, 5, 0.8); capP(B.p(ROOF50), offP(q.r, 0.8), 5); wallP(B.p(i === 1 ? MALL2 : MALL), q.r, 5, q.t); capP(B.p(ROOF50), q.r, q.t);
    bandAtP(B.p(GL2), q.r, 6.5, 2.4, 0.03); }
  for (const i of [2, 0, 3]){ const q = d.p[i]; tw50(B, q.r, 7.2, q.t, {sty:'rib', gl:GL, fr:TW, fh:3.0, sh:1.1, bay:2.0, mul:STs('#857e75', 0.3), par:1.5}); }
  blkP(B, scP(d.p[2].r, 0.5), 60, 63, MECH50, ROOF50);
  B.flush(g); return g; }});
}
// ---- Qi Tian Gong (Monkey God) Temple, 44 Eng Hoon Street (sgqitiangong): Wikipedia / roots.gov.sg - founded 1920, at this address
// since 1938 in a shophouse unit bought by the trustees in 1985, renovated 1992-93. The OSM place_of_worship node lies in the rounded
// west end of the unnamed block w172241932, which is modelled as a whole: a plain three-storey Tiong Bahru block (storey count,
// height and colours are estimates; the neighbouring pre-war blocks are tagged 3 levels, #E6EBEB) with the temple front on the
// ground floor of the west end - red columns and doors, a tiled canopy, warm light. Kept simple and respectful; no figures, no text.
{
const d0 = D.qtg, C0 = pcen(d0.r), [RG] = shAll([d0.r], C0), POI = [-24.8 - C0[0], -10.5 - C0[1]];
K50('sgqitiangong', '齐天宫', 'Qi Tian Gong Temple', d0.A, C0, {r:36, h:12, lt:{m:0, c:'#ffdcae', k:0.55}, build(){
  const g = new THREE.Group(), B = mkB();
  const WL = STs('#e6ebeb', 0.5), TR = STs('#d3d8d8', 0.45), GL = {c:'#3e4a52', m:0, glow:'#ffdcaa', gk:0.7}, SHOP = {c:'#b8c3c5', m:0, glow:'#ffe2b8', gk:0.8},
    RED = {c:'#a3241e', m:0, lk:0.4}, GOLD = {c:'#c9a04a', m:0, lk:0.5}, TILE = '#8f3a28', DOORG = {c:'#8a2a20', m:0, glow:'#ffb870', gk:0.9};
  foundP(B.p(FOUND50), RG); wallP(B.p(WL), RG, 4.0, 11.2); capP(B.p(ROOF50), RG, 11.2); wallP(B.p(WL), offP(RG, -0.1), 11.2, 12.0);
  bandAtP(B.p(TR), RG, 3.8, 0.5, 0.25); bandAtP(B.p(TR), RG, 7.5, 0.25, 0.1); bandAtP(B.p(TR), RG, 11.0, 0.4, 0.15);
  ribP(B.p(GL), RG, 4.9, 11, 3.6, 1.3, 0.04);
  // ground floor: shop units, except the temple at the west end (points within 8 m of the POI)
  const nearT = (x, z) => Math.hypot(x - POI[0], z - POI[1]) < 8.5;
  wallP(B.p(SHOP), offP(RG, 1.0), 0.3, 3.8); capP(B.p(ROOF50), offP(RG, 1.0), 3.8);
  for (const [x, z, a] of alongP(RG, 3.2)) if (!nearT(x, z)) segP(B.p(TR), [x, 0.3, z], [x, 3.8, z], 0.18, 4);
  for (const [x, z, a] of alongP(RG, 1.6)) if (nearT(x, z)){
    const F = fA(x, z, a); slabP(B.p(DOORG), rectO(-0.7, 0.7, 0.3, 3.0), F, 0.95, 0.9);   // (fA's +w points into this ring)
    segP(B.p(RED), [x, 0.3, z], [x, 3.6, z], 0.16, 8); slabP(B.p(GOLD), rectO(-0.8, 0.8, 3.0, 3.35), F, 0.95, 0.85);
    // canopy: a short tiled lean-to from the recessed front out past the columns
    const p0 = F(-0.8, 3.75, 0.95), p1 = F(0.8, 3.75, 0.95), q0 = F(-0.8, 3.45, -0.9), q1 = F(0.8, 3.45, -0.9);
    quadP(B.p(TILE), p0, p1, q1, q0); }
  B.flush(g); return g; }});
}
