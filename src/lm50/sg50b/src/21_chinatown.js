// ================= Chinatown, Pearl's Hill and Maxwell Road (medium detail on the real OSM plans) =================

// ---- One Pearl Bank (sgonepearlbank): twin curved residential towers, 178 m, 39 floors, 2024 (Wikipedia list). OSM r15649684
// (no name; inside landuse w295892200 "One Pearl Bank"): tower parts w1157560454 / w1157560455 (white concrete, 39 levels, height
// 178, grass roofs) and the two top-level links w1157560448 / -449 (levels 38-39). Anchor confirmed by the OSM landuse name and parts.
// Floor rhythm 178/39 m; balcony ledges and planting are generic.
{
const d0 = D.opb, C0 = pcen(d0.r), d = PREP(d0, C0);
K50('sgonepearlbank', '珍珠山一号', 'One Pearl Bank', d0.A, C0, {r:60, h:178, lt:{m:1, c:'#fff0da', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB();
  const WH = STs('#eeeeea', 0.4), GL = GLs('#647c86', 4.56, 2.2), GRN = {c:'#5f8a45', m:0, lk:0.1};
  for (const i of [0, 3]){ const T = d.p[i].r;
    foundP(B.p(FOUND50), T); wallP(B.p(GL), offP(T, 1.2), 0.3, 176); lobby50(B, T, 0.3, 5, 1.6);
    ledgeP(B.p(WH), offP(T, 0.4), 4.56, 176, 4.56, 0.8, 0.35);
    for (let y = 4.56*3; y < 176; y += 4.56*3) bandAtP(B.p(GRN), offP(T, -0.3), y + 0.35, 0.6, 0.05);
    wallP(B.p(WH), T, 176, 178); capP(B.p(GRN), T, 178); }
  for (const i of [1, 2]){ const P = d.p[i].r; wallP(B.p(GL), P, 172.5, 178); capP(B.p(GRN), P, 178); capP(B.p(WH), P, 172.5); bandAtP(B.p(WH), P, 172.3, 0.8, 0.1); }
  lavP(B.p(LAV50), [d.p[0].r[16], d.p[3].r[40]], 178.4);
  B.flush(g); return g; }});
}
// ---- Yue Hwa Building, 70 Eu Tong Sen Street (sgyuehwa): OSM w47298664 (alt name Nam Tin Building, 1927); part w462577213
// (concrete #bfbcb3, levels to 6 with a tiled mansard roof #965a2f) over the 3-level part w462577214 filling the corner plot.
// Window rhythm and trim are generic. No signs.
{
const d0 = D.yh1, C0 = pcen(D.yh2.r), d = PREP(d0, C0), d2 = PREP(D.yh2, C0);
K50('sgyuehwa', '裕华国货大厦', 'Yue Hwa Building', d0.A, C0, {r:30, h:20.4, lt:{m:0, c:'#ffe6c2', k:0.55}, build(){
  const g = new THREE.Group(), B = mkB();
  const WL = STs('#cdc9bf', 0.55), TR = STs('#e2ded4', 0.55), ROOF = '#965a2f', WIN = {c:'#3f4a52', m:0, glow:'#ffd9a0', gk:0.7}, SHOP = {c:'#b6c2c4', m:0, glow:'#ffe2b8', gk:0.85};
  const F = d2.r, M = d.p[1].r;
  foundP(B.p(FOUND50), F); wallP(B.p(SHOP), offP(F, 0.8), 0.3, 4.2); capP(B.p(ROOF50), offP(F, 0.8), 4.2);
  wallP(B.p(WL), F, 4.2, 10.5); capP(B.p(ROOF50), F, 10.5); bandAtP(B.p(TR), F, 4.0, 0.6, 0.25); bandAtP(B.p(TR), F, 9.8, 0.7, 0.25);
  winP(B, F, 4.6, 10, 2.9, 2.6, 1.2, 1.9, WIN, {minL:3});
  wallP(B.p(WL), M, 10.5, 16.5); bandAtP(B.p(TR), M, 15.8, 0.7, 0.3); winP(B, M, 10.8, 16, 2.9, 2.6, 1.2, 1.9, WIN, {minL:3});
  finsP(B.p(TR), M, 4.2, 16.5, 5.2, 0.25, 0.5);
  // mansard: the wall line drawn in 2 m as it rises 3.9 m, dormers
  const S0 = M.map(p => [p[0], 16.5, p[1]]), S1 = offP(M, 2.0).map(p => [p[0], 20.4, p[1]]);
  loftP(B.p(ROOF), [S0, S1]); capP(B.p(ROOF50), offP(M, 2.0), 20.4);
  for (const e of edgesF(offP(M, 0.9))) if (e.L > 5) for (let u = 2.2; u < e.L - 1.5; u += 4.4) slabP(B.p(TR), rectO(u - 0.6, u + 0.6, 17.0, 19.0), e.F, 0, 0.6);
  B.flush(g); return g; }});
}
// ---- Chinatown Point, 133 New Bridge Road (sgchinatownpoint): OSM w125836966 (5 levels, height 28, colour #6d6e66, 1990) with the
// tower part w326926547 (25 levels, min level 5, height 118, colour #9e9d99). The app drew only the tower part; the mall is added.
{
const d0 = D.ctp, C0 = pcen(d0.r), d = PREP(d0, C0);
K50('sgchinatownpoint', '唐城坊', 'Chinatown Point', d0.A, C0, {r:85, h:118, lt:{m:1, c:'#ffeccc', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB();
  const MALL = STs('#767870', 0.3), MALL2 = STs('#8b8d85', 0.3), GL = GLs('#4c5c64', 3.4, 2.2), TW = STs('#a6a5a1', 0.35), T = d.p[0].r;
  foundP(B.p(FOUND50), d.r); lobby50(B, d.r, 0.3, 5.5, 0.8); capP(B.p(ROOF50), offP(d.r, 0.8), 5.5);
  wallP(B.p(MALL), d.r, 5.5, 28); capP(B.p(ROOF50), d.r, 28); ribP(B.p(MALL2), d.r, 10, 28, 5.6, 1.4, 0.06);
  bandAtP(B.p(GL), d.r, 12, 2.2, 0.03); bandAtP(B.p(GL), d.r, 20.5, 2.2, 0.03);
  tw50(B, T, 28, 118, {sty:'punch', fr:TW, gl:GL, fh:3.4, bay:2.4, ww:1.6, wh:1.7, par:1.5});
  blkP(B, scP(T, 0.5), 118, 121, MECH50, ROOF50);
  B.flush(g); return g; }});
}
// ---- Hong Lim Complex, Upper Cross Street (sghonglim): OSM r2304417 "Hong Lim Complex" (4 levels / 16 m podium, 1978) with the four
// HDB slab blocks w326926571-574 (20 levels, from level 4, height 56). Podium plans from the app footprints inside the relation.
// The Chinatown MRT exit F canopy (w172596763) in the podium's re-entrant corner is modelled too (it falls under the hull).
// Colours (white render, grey corridor bands, red-brown accents) are estimates.
{
const C0 = pcen(D.hlrel.r), sh = q => shP(q.r, C0[0], C0[1]), PE = sh(D.hlpe), PW = sh(D.hlpw), SL = [D.hl571, D.hl572, D.hl573, D.hl574].map(sh),
  P14 = sh(D.hlp1401), PUP = [D.hlp510, D.hlp17, D.hlp33].map(sh), MRT = sh(D.hlmrt);
K50('sghonglim', '芳林苑', 'Hong Lim Complex', D.hlrel.A, C0, {r:93, h:56, lt:{m:1, c:'#fff2dc', k:0.45}, build(){
  const g = new THREE.Group(), B = mkB();
  const POD = STs('#d8d3c8', 0.35), WH = STs('#ecebe6', 0.4), COR = STs('#9da2a3', 0.3), ACC = STs('#a45a45', 0.3), GL = GLs('#55636a', 2.8, 1.8);
  for (const P of PUP){ wallP(B.p(POD), P, 4.2, 16); capP(B.p(ROOF50), P, 16); capP(B.p(POD), P, 4.2); }
  // the Chinatown MRT entrance (exit F) in the podium's corner (app footprint w172596763, 6 m): a plain canopy on columns
  { const T = offP(MRT, 0.3); capP(B.p(STs('#8d9496', 0.3)), T, 6); wallP(B.p(STs('#8d9496', 0.3)), T, 5.2, 6); for (const p of T) segP(B.p(COR), [p[0], 0.3, p[1]], [p[0], 5.2, p[1]], 0.2, 6); wallP(B.p(LOB50), offP(MRT, 2), 0.3, 3.2); }
  for (const P of [PE, PW, P14]){ foundP(B.p(FOUND50), P); lobby50(B, P, 0.3, 4.2, 1.0); capP(B.p(ROOF50), offP(P, 1), 4.2); wallP(B.p(POD), P, 4.2, 16); capP(B.p(ROOF50), P, 16);
    winP(B, P, 5, 15.5, 3.9, 3.4, 2.4, 1.8, GL, {minL:4}); bandAtP(B.p(ACC), P, 15.2, 0.8, 0.15); }
  for (const P of SL){ slab50(B, P, 16, 56, {wall:WH, gl:GL, ledge:COR, fh:2.8, ld:0.6}); finsP(B.p(ACC), P, 16, 57, 9, 0.4, 0.5); }
  B.flush(g); return g; }});
}
// ---- People's Park Centre, 101 Upper Cross Street (sgppcentre): OSM r16125339 (1976): podium part (0-17.1 m), the long slab
// (to 99 m in the data) and the office block w326926553 (levels 5-12, beige, red roof edge). Heights from the data (not verified).
{
const d0 = D.ppc, C0 = pcen(d0.r), d = PREP(d0, C0);
K50('sgppcentre', '珍珠坊', "People's Park Centre", d0.A, C0, {r:75, h:99, lt:{m:1, c:'#fff0d8', k:0.45}, build(){
  const g = new THREE.Group(), B = mkB();
  const POD = STs('#cfcac0', 0.35), WH = STs('#e6e4de', 0.4), COR = STs('#a3a7a7', 0.3), BEI = STs('#d9c9a8', 0.35), RED = STs('#a8483a', 0.3), GL = GLs('#4f5e66', 3.0, 1.8);
  const P = d.p[2].r, S = d.p[1].r, O = d.p[0].r;
  // the MRT exit canopy against the south-west side (app footprint w173132986, 5 m) falls under the hull: a plain canopy on posts
  { const T = shP(D.ppcmrt.r, C0[0], C0[1]); capP(B.p(STs('#8d9496', 0.3)), T, 5); wallP(B.p(STs('#8d9496', 0.3)), T, 4.3, 5); for (const p of T) segP(B.p(COR), [p[0], 0.3, p[1]], [p[0], 4.3, p[1]], 0.2, 6); }
  foundP(B.p(FOUND50), P); lobby50(B, P, 0.3, 4.5, 1.0); capP(B.p(ROOF50), offP(P, 1), 4.5); wallP(B.p(POD), P, 4.5, 17.1); capP(B.p(ROOF50), P, 17.1);
  winP(B, P, 5.5, 16.5, 3.8, 3.6, 2.6, 2.0, GL, {minL:4});
  slab50(B, S, 17.1, 99, {wall:WH, gl:GL, ledge:COR, fh:3.0, ld:0.7});
  tw50(B, O, 17.1, 40.2, {sty:'punch', fr:BEI, gl:GL, fh:3.6, bay:2.8, ww:2.0, wh:1.8}); wallP(B.p(RED), O, 40.2, 41.4);
  B.flush(g); return g; }});
}
// ---- Kreta Ayer People's Theatre, 30A Kreta Ayer Road (sgkretaayer): OSM w47298582 (1969, height 15, gabled tiled roof along the
// long axis). Wall height, colours and the entrance placement are estimates.
{
const d0 = D.kreta, C0 = pcen(d0.r), [RG] = shAll([d0.r], C0), AX = Math.atan2(24.2, 43.0);
K50('sgkretaayer', '牛车水人民剧场', "Kreta Ayer People's Theatre", d0.A, C0, {r:30, h:15, lt:{m:0, c:'#ffe6c2', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB(), f = frame(0, 0, AX);
  const WL = STs('#e3dccd', 0.5), TR = STs('#c9c1b0', 0.45), ROOF = '#9b5a3e', GL = {c:'#6f7d84', m:0, glow:'#ffe0b0', gk:0.8};
  foundP(B.p(FOUND50), RG); wallP(B.p(WL), RG, 0.3, 10.5); bandAtP(B.p(TR), RG, 10.0, 0.6, 0.2); bandAtP(B.p(TR), RG, 0.3, 1.0, 0.1);
  hipF(B.p(ROOF), f, -24.6, 24.6, -12.8, 12.8, 10.5, 4.5, 0.6, true);
  for (const s of [-1, 1]){ const F = (t, y, w) => f(24.65*s + s*(w || 0), y, t); slabP(B.p(WL), [[-13.4, 10.5], [13.4, 10.5], [0, 15.0]], F, -0.1, 0.05);
    shapeP(B.p(GL), rectO(-4.5, 4.5, 0.6, 3.6), F, 0.06); slabP(B.p(TR), rectO(-5.5, 5.5, 3.6, 4.2), F, 0, 1.6); }
  for (const s of [-1, 1]){ const F = (t, y, w) => f(t, y, 12.8*s + s*(w || 0)); for (let u = -20; u <= 20; u += 5) slabP(B.p(TR), rectO(u - 0.4, u + 0.4, 0.3, 10.2), F, 0, 0.3); }
  B.flush(g); return g; }});
}
// ---- Maxwell Chambers, 32 Maxwell Road (sgmaxwellch): OSM w393100846 (4 levels, start date 1932: the former Customs House).
// Height 14.4 m from the data; pale render with pilasters, cornice and parapet (estimates).
{
const d0 = D.maxch, C0 = pcen(d0.r), [RG] = shAll([d0.r], C0);
K50('sgmaxwellch', '麦士威仲裁中心', 'Maxwell Chambers', d0.A, C0, {r:42, h:15.6, lt:{m:0, c:'#ffe8c6', k:0.55}, build(){
  const g = new THREE.Group(), B = mkB();
  const WL = STs('#ece8de', 0.55), TR = STs('#d9d3c5', 0.5), WIN = {c:'#3c4851', m:0, glow:'#ffdcaa', gk:0.75};
  foundP(B.p(FOUND50), RG); wallP(B.p(WL), RG, 0.3, 14.4); capP(B.p(ROOF50), RG, 14.4); wallP(B.p(WL), RG, 14.4, 15.6);
  bandAtP(B.p(TR), RG, 0.3, 1.2, 0.15); bandAtP(B.p(TR), RG, 4.2, 0.4, 0.15); bandAtP(B.p(TR), RG, 13.4, 1.0, 0.35);
  winP(B, RG, 1.2, 13.2, 3.1, 3.0, 1.3, 2.0, WIN, {minL:3}); finsP(B.p(TR), RG, 1.5, 13.4, 6.0, 0.3, 0.7);
  B.flush(g); return g; }});
}
// ---- MND Building, 5 Maxwell Road (sgmnd): Nominatim / OSM put the "MND Complex" address and the Ministry of National Development
// POI on w47345222 (2-level podium, metal #949899, 1970) with its 20-level slab part w508994095 - the main block (66.6 m in the data,
// not verified); reref SC/lm50/sg50b/ref_sg50b_3.json. The target row's footprint w117058629 "MND Building (Annexe B)" (5 levels)
// is the secondary key sgmndannexb (label:false). Window ribbons and colours are generic.
{
const d0 = D.mnd, C0 = pcen(d0.r), d = PREP(d0, C0);
K50('sgmnd', '国家发展部大厦', 'MND Building', d0.A, C0, {r:56, h:66.6, lt:{m:1, c:'#fff0d8', k:0.45}, build(){
  const g = new THREE.Group(), B = mkB();
  const MET = STs('#9a9ea0', 0.35), BAND = STs('#7d8285', 0.3), GL = GLs('#46545c', 3.0, 2.0);
  foundP(B.p(FOUND50), d.r); lobby50(B, d.r, 0.3, 6.6, 1.2); capP(B.p(ROOF50), d.r, 6.6); wallP(B.p(MET), offP(d.r, -0.1), 5.6, 6.6);
  const T = d.p[0].r; wallP(B.p(MET), T, 6.6, 66.6); capP(B.p(ROOF50), T, 66.6); ribP(B.p(GL), T, 7.6, 66, 3.0, 1.5, 0.04); ribP(B.p(BAND), T, 6.6, 66.6, 3.0, 0.3, 0.12);
  wallP(B.p(MET), offP(T, -0.1), 66.6, 68); blkP(B, scP(T, 0.4), 66.6, 70, MECH50, ROOF50);
  B.flush(g); return g; }});
}
{
const d0 = D.mndb, C0 = pcen(d0.r), [RG] = shAll([d0.r], C0);
K50('sgmndannexb', '国家发展部大厦附楼B', 'MND Building (Annexe B)', d0.A, C0, {label:false, r:27, h:17.7, lt:{m:1, c:'#fff0d8', k:0.45}, build(){
  const g = new THREE.Group(), B = mkB();
  const WL = STs('#c9c9c2', 0.4), GL = GLs('#46545c', 3.4, 2.0);
  foundP(B.p(FOUND50), RG); lobby50(B, RG, 0.3, 4, 1.0); capP(B.p(ROOF50), offP(RG, 1), 4);
  wallP(B.p(WL), RG, 4, 17.7); capP(B.p(ROOF50), RG, 17.7); ribP(B.p(GL), RG, 4.8, 17.2, 3.4, 1.6, 0.04); wallP(B.p(WL), offP(RG, -0.1), 17.7, 18.6);
  B.flush(g); return g; }});
}
