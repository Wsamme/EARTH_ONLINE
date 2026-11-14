
// ================= shared: Chinese halls, pavilions, archways =================
// skirt between an outer rectangle at yo and an inner one at yi (lower eaves of a double roof, plinth batter)
function skirt(B, s, O, Lo, Wo, yo, Li, Wi, yi){
  const P = (a, b, y) => [O.cx + O.ux*a - O.uz*b, y, O.cz + O.uz*a + O.ux*b];
  const o = [P(-Lo/2, -Wo/2, yo), P(Lo/2, -Wo/2, yo), P(Lo/2, Wo/2, yo), P(-Lo/2, Wo/2, yo)], i = [P(-Li/2, -Wi/2, yi), P(Li/2, -Wi/2, yi), P(Li/2, Wi/2, yi), P(-Li/2, Wi/2, yi)];
  for (let k = 0; k < 4; k++){ const j = (k + 1) & 3; B.q(s, o[k], o[j], i[j], i[k]); }
}
// a hall on oriented rectangle O: plinth top y0, top of roof yt; o = {dbl, pav, cols, roof, wall, ...} specs in S
function cnHall(B, S, O, y0, yt, o){
  o = o || {}; const H = yt - y0, L = O.L, W = O.W, ov = Math.min(1.6, 0.12*W + 0.4);
  const wall = o.wall || S.wall, roof = o.roof || S.roof;
  const colsAlong = (yb, ye, inset) => { const n = Math.max(2, Math.round((L - 2*inset)/3.6)); for (let k = 0; k <= n; k++){ const a = -L/2 + inset + (L - 2*inset)*k/n;
    for (const b of [-W/2 + inset, W/2 - inset]){ const x = O.cx + O.ux*a - O.uz*b, z = O.cz + O.uz*a + O.ux*b; obox(B, S.col, x, z, O.ux, O.uz, 0.55, 0.55, yb, ye); } } };
  if (o.dbl){
    const eL = y0 + H*0.42, eU = y0 + H*0.68;
    obox(B, wall, O.cx, O.cz, O.ux, O.uz, L - 2.6, W - 2.6, y0, eL + 0.4); colsAlong(y0, eL, 0.7);
    skirt(B, roof, O, L + 2*ov, W + 2*ov, eL - 0.2, L - 3.0, W - 3.0, eL + 1.9);
    obox(B, S.beam, O.cx, O.cz, O.ux, O.uz, L - 0.4, W - 0.4, eL - 0.9, eL);
    obox(B, wall, O.cx, O.cz, O.ux, O.uz, L - 3.4, W - 3.4, eL + 1.0, eU + 0.3);
    obox(B, S.beam, O.cx, O.cz, O.ux, O.uz, L - 3.0, W - 3.0, eU - 0.6, eU + 0.2);
    hipRoof2(B, roof, O.cx, O.cz, O.ux, O.uz, L - 3.4 + 2*ov, W - 3.4 + 2*ov, eU, yt - eU, 0.6, o.pav ? 0.9 : 0.55);
    ridge(B, S, O, L - 3.4 + 2*ov, W - 3.4 + 2*ov, yt, o.pav ? 0.9 : 0.55);
  } else {
    const e = y0 + H*(o.pav ? 0.5 : 0.56);
    obox(B, wall, O.cx, O.cz, O.ux, O.uz, L - (o.open ? 0.4 : 2.0), W - 2.0, y0, e + 0.3); if (o.cols !== false) colsAlong(y0, e, 0.5);
    obox(B, S.beam, O.cx, O.cz, O.ux, O.uz, L - 0.2, W - 0.2, e - 0.6, e + 0.1);
    hipRoof2(B, roof, O.cx, O.cz, O.ux, O.uz, L + 2*ov, W + 2*ov, e, yt - e, 0.5, o.pav ? 1 : 0.6);
    ridge(B, S, O, L + 2*ov, W + 2*ov, yt, o.pav ? 1 : 0.6);
  }
}
function ridge(B, S, O, L, W, yt, rf){
  const rl = Math.max(0.4, L/2 - W/2*rf);
  obox(B, S.ridge, O.cx, O.cz, O.ux, O.uz, 2*rl + 0.6, 0.55, yt - 0.25, yt + 0.45);
  for (const sg of [-1, 1]){ const x = O.cx + O.ux*sg*(rl + 0.1), z = O.cz + O.uz*sg*(rl + 0.1); obox(B, S.ridge, x, z, O.ux, O.uz, 0.7, 0.6, yt, yt + 1.3); }
}
// ground helpers over a ring: min / max of gl
const ringG = (R, gl) => { let lo = Infinity, hi = -Infinity; for (const p of R){ const v = gl(p[0], p[1]); lo = Math.min(lo, v); hi = Math.max(hi, v); } const c = centroid(R), v = gl(c[0], c[1]); return [Math.min(lo, v), Math.max(hi, v)]; };
// terrain-following paving: square tiles of size d inside polygon P (top 0.08 m over the ground)
function pave(B, s, P, gl, d, inset){
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity; for (const p of P){ x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
  const Q = inset ? grow(P, -inset) : P;
  for (let x = x0; x < x1; x += d) for (let z = z0; z < z1; z += d){ const cx = x + d/2, cz = z + d/2; if (!pip(Q, cx, cz)) continue;
    const Y = (a, b) => gl(a, b) + 0.1; B.q(s, [x, Y(x, z), z], [x, Y(x, z + d), z + d], [x + d, Y(x + d, z + d), z + d], [x + d, Y(x + d, z), z]); }
}
// stone archway (paifang) across direction (ux, uz) at (cx, cz): 3 bays, 4 pillars; heights of the side / middle / top roofs
function paifang(B, S, cx, cz, ux, uz, Wd, y0, hs, hm, ht){
  const O = (w, d) => ({cx, cz, ux, uz, L:w, W:d}), bays = [-Wd/2, -Wd*0.2, Wd*0.2, Wd/2];
  for (const a of bays){ const x = cx + ux*a, z = cz + uz*a; obox(B, S.stone, x, z, ux, uz, 0.9, 0.9, y0 - 0.6, hs - 0.4); obox(B, S.stone, x, z, ux, uz, 1.4, 2.2, y0 - 0.6, y0 + 1.2); }
  obox(B, S.stone, cx, cz, ux, uz, Wd + 0.6, 0.8, hs - 2.6, hs - 0.6);
  hipRoof2(B, S.sroof, cx, cz, ux, uz, Wd + 2.4, 2.6, hs - 0.6, 1.2, 0.35, 0.9);
  obox(B, S.stone, cx, cz, ux, uz, Wd*0.4 + 0.4, 0.7, hs, hm - 0.6); obox(B, S.panel, cx, cz, ux, uz, Wd*0.32, 0.8, hs + 0.5, hm - 1.2);
  hipRoof2(B, S.sroof, cx, cz, ux, uz, Wd*0.4 + 2.4, 2.4, hm - 0.6, 1.1, 0.35, 0.9);
  if (ht > hm + 0.5){ obox(B, S.stone, cx, cz, ux, uz, Wd*0.18, 0.6, hm + 0.4, ht - 1.4); hipRoof2(B, S.sroof, cx, cz, ux, uz, Wd*0.18 + 2.0, 2.2, ht - 1.4, 1.4, 0.35, 0.9); }
}
// standing figure (statue): lathe profile scaled to height h at (x, y, z)
function statue(g, spec, x, y, z, h, robe){
  const k = h/6, P = (robe ? [[0.0, 0], [1.05, 0], [0.95, 1.2], [0.8, 2.6], [0.72, 3.6], [0.62, 4.2], [0.5, 4.45], [0.28, 4.6], [0.32, 5.0], [0.34, 5.4], [0.2, 5.75], [0.25, 5.85], [0.0, 6.0]]
    : [[0.0, 0], [0.7, 0], [0.62, 1.6], [0.66, 2.9], [0.8, 3.5], [0.86, 4.2], [0.6, 4.55], [0.28, 4.7], [0.33, 5.1], [0.33, 5.5], [0.0, 6.0]]).map(p => [p[0]*k, p[1]*k]);
  LLathe(g, P, x, y, z, spec, 10);
}

// ================= Chiwan Tin Hau Temple (赤湾天后宫) =================
// The temple axis: archway (OSM 天后古庙, three stacked parts 8.6 / 11.7 / 14.5 m) -> the moon pond and stone bridge -> the bell and
// drum towers -> the front hall -> the main hall (24 x 16 m: sz.gov.cn; 13.7 m in OSM) with the side halls; corridors along the
// north-west wall. Founded in the Song (date unknown), expanded in the Ming / Qing, mostly destroyed in the 1950s, restored from
// May 1992, main hall completed 1 Nov 1995 (sz.gov.cn Shenzhen Story; Shenzhen Government Online). Footprints and heights: OSM
// religious buildings w1097915484-542. Roof colours (yellow glazed main roofs, red walls) and the Tianhou statue's size are estimates.
const THS = {
  wall:{c:'#a73a2c', m:0, lc:'#ffd8a8', lk:1.0, e:0.6}, beam:'#5f6e4e', roof:{c:'#d3a13a', m:0, lc:'#ffd090', lk:0.85, e:0.6}, roofG:{c:'#4f7a5a', m:0, lc:'#ffd090', lk:0.8, e:0.6},
  plinth:'#c9c3b5', stone:{c:'#d9d4c8', m:0, lc:'#ffe1b8', lk:0.55, e:0.6}, sroof:'#9fa1a0', pave:'#cfc8b9', water:{c:'#6f97a8'}, cope:'#5d7060',
  bronze:'#5b4a33', lant:{c:'#d84a2a', glow:'#ff9a50', gk:1.6}, marble:{c:'#efece4', m:0, lc:'#fff0d8', lk:0.8, e:0.7}, cr:'#4e7a3c'
};
THS.col = THS.wall; THS.ridge = THS.roof; THS.panel = THS.stone; THS.cwall = THS.wall; THS.bal = THS.marble; THS.tr = THS.bronze;
LANDMARKS.szchiwantinhau = {zh:'赤湾天后宫', en:'Chiwan Tin Hau Temple', cat:'old', r:129, h:20,
  lt:{m:0, c:'#ffd8a8', k:0.8, e:0.6, anim:'breathe'},
  build(){
    const T = D.szchiwantinhau, g = new THREE.Group(), B = Batch(), bs = baseOf(T, 129), gl = bs.gl;
    const AX = [0.8, -0.6], A0 = [-1, 5];                    // axis direction (front faces south-west) and the towers' mid-point
    const along = p => (p[0] - A0[0])*AX[0] + (p[1] - A0[1])*AX[1], across = p => -(p[0] - A0[0])*AX[1] + (p[1] - A0[1])*AX[0];
    const AP = (s, t) => [A0[0] + AX[0]*s - AX[1]*t, A0[1] + AX[1]*s + AX[0]*t];
    // courtyard paving and the compound wall (gap where the axis enters)
    pave(B, THS.pave, T.wall, gl, 6, 1.5);
    const Wp = T.wall;
    for (let i = 0; i < Wp.length; i++){ const a = Wp[i], b = Wp[(i + 1) % Wp.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 0.5) continue;
      const n = Math.ceil(l/4); for (let k = 0; k < n; k++){ const p = [a[0] + (b[0] - a[0])*k/n, a[1] + (b[1] - a[1])*k/n], q = [a[0] + (b[0] - a[0])*(k + 1)/n, a[1] + (b[1] - a[1])*(k + 1)/n], m = [(p[0] + q[0])/2, (p[1] + q[1])/2];
        if (Math.abs(across(m)) < 7 && along(m) < -60) continue;
        const y = gl(m[0], m[1]); sbox(B, THS.cwall, p, q, 0.7, y - 1, y + 3.0); sbox(B, THS.cope, p, q, 1.1, y + 3.0, y + 3.4); } }
    // the halls on their OSM footprints
    for (const [R, h, osm, typ] of T.b){
      const c = centroid(R), [lo, hi] = ringG(R, gl), area = Math.abs(polyArea(R)); let O = orect(R);
      if (Math.hypot(c[0] + 76.3, c[1] - 61.3) < 8) continue;     // the archway, built below
      const onAxis = Math.abs(across(c)) < 6;
      if (onAxis && Math.abs(O.ux*AX[0] + O.uz*AX[1]) > 0.7) O = {cx:O.cx, cz:O.cz, ux:-O.uz, uz:O.ux, L:O.W, W:O.L};
      if (typ === 'shed'){   // incense burners / small offering pavilions
        const y = hi; LCyl(g, 1.0, 1.3, 1.6, c[0], y, c[1], THS.bronze, 10); LCyl(g, 1.4, 1.0, 0.5, c[0], y + 1.6, c[1], THS.bronze, 10); LCone(g, 1.3, 1.4, c[0], y + 2.3, c[1], THS.bronze, 8); continue; }
      if (h < 5 && area > 150){  // raised stone terrace (moon terrace) with a balustrade
        prism(B, THS.plinth, R, lo - 0.5, hi + 1.4, {top:THS.pave});
        const G = grow(R, -0.3); for (let i = 0; i < G.length; i++){ const a = G[i], b = G[(i + 1) % G.length]; sbox(B, THS.bal, a, b, 0.3, hi + 1.4, hi + 2.3); } continue; }
      const pl = area > 400 ? 1.6 : 0.8, y0 = hi + pl, yt = lo + h;
      prism(B, THS.plinth, grow(R, 0.6), lo - 0.6, y0, {top:THS.pave});
      if (area > 400) { const G = grow(R, 0.4); for (let i = 0; i < G.length; i++){ const a = G[i], b = G[(i + 1) % G.length]; sbox(B, THS.bal, a, b, 0.28, y0, y0 + 0.9); } }
      const pav = area < 90 && O.L/O.W < 1.6;
      cnHall(B, THS, O, y0, Math.max(yt, y0 + 4.5), {dbl:area > 400 || pav, pav, roof:area < 260 && !onAxis && !pav ? THS.roofG : THS.roof});
      // red lanterns under the eaves of the halls on the axis
      if (onAxis) for (const s of [-1, 1]){ const x = O.cx + O.ux*s*O.L*0.3 + O.uz*(O.W/2 + 0.3)*(along([O.cx - O.uz, O.cz + O.ux]) < along([O.cx, O.cz]) ? 1 : -1), z = O.cz + O.uz*s*O.L*0.3 - O.ux*(O.W/2 + 0.3)*(along([O.cx - O.uz, O.cz + O.ux]) < along([O.cx, O.cz]) ? 1 : -1);
        LSph(g, 0.45, x, y0 + (yt - y0)*0.4, z, THS.lant, 1.2, 8); }
    }
    // ponds (moon pond on the axis with its stone bridge)
    for (const P of T.ponds){ const [lo, hi] = ringG(P, gl); prism(B, THS.plinth, grow(P, 0.5), lo - 0.5, hi + 0.35, {noTop:true}); cap(B, THS.water, P, lo + 0.05);
      const c = centroid(P); if (Math.abs(across(c)) < 4){ const s0 = along(c); for (let k = -4; k < 4; k++){ const sa = s0 + k*1.5, sb = sa + 1.5, ya = 1.1*Math.cos(k/4.5*HP), yb = 1.1*Math.cos((k + 1)/4.5*HP);
        sbox(B, THS.bal, AP(sa, 0), AP(sb, 0), 3.2, lo + 0.1, hi + 0.35 + Math.max(ya, yb)); } } }
    // the archway on the axis (from the three OSM parts: 8.6 / 11.7 / 14.5 m)
    { const pts = T.b.filter(b => Math.hypot(centroid(b[0])[0] + 76.3, centroid(b[0])[1] - 61.3) < 8);
      if (pts.length){ const big = pts.reduce((a, b) => Math.abs(polyArea(b[0])) > Math.abs(polyArea(a[0])) ? b : a), O = orect(big[0]), [lo] = ringG(big[0], gl);
        const hs = pts.map(b => b[1]).sort((a, b) => a - b);
        paifang(B, THS, O.cx, O.cz, -AX[1], AX[0], O.L, lo, lo + hs[0], lo + (hs[1] || hs[0] + 3), lo + (hs[2] || hs[0] + 6)); } }
    // the Tianhou statue in the forecourt, facing the towers (size estimated)
    { const p = AP(-46, 0), y = gl(p[0], p[1]); prism(B, THS.plinth, [[p[0] - 2.2, p[1] - 2.2], [p[0] + 2.2, p[1] - 2.2], [p[0] + 2.2, p[1] + 2.2], [p[0] - 2.2, p[1] + 2.2]], y - 0.5, y + 1.4, {top:THS.pave});
      obox(B, THS.marble, p[0], p[1], AX[0], AX[1], 2.6, 2.6, y + 1.4, y + 3.0); statue(g, THS.marble, p[0], y + 3.0, p[1], 7.0, true); }
    // old trees in the courtyards
    const rng = LMCTX.rng, TS = {tr:THS.tr, cr:THS.cr};
    for (const [s, t] of [[-15, -22], [-12, 24], [40, -30], [40, 32], [-70, -14], [-70, 16], [-30, -30], [-32, 30]]){ const p = AP(s, t); if (!pip(T.wall, p[0], p[1])) continue; lmTree(B, TS, p[0], gl(p[0], p[1]), p[1], 9 + rng()*4, 4 + rng()*1.5); }
    B.flush(g); return g; }};
SG_PLACES.push({type:'szchiwantinhau', lat:D.szchiwantinhau.lat, lon:D.szchiwantinhau.lon, rot:0});

// ================= Tomb of the Last Song Emperor (宋少帝陵) =================
// Tomb of Zhao Bing (Emperor Bing, the boy emperor, d. 1279) at the foot of Xiaonanshan, facing the Lingding sea to the south: a burial
// mound and a central tombstone (gilded inscription, dragon / phoenix / cloud carving: eyeshenzhen), a 4 m stone statue of Lu Xiufu
// carrying the emperor west of the tomb and a stone tablet east of it (Shenzhen Government Online). Plan: OSM r16115644 (precinct),
// the grave node, the statue node, the paifang gate node, the wall w249003126 and the loop path. Terrace heights are estimates.
const STS = {stone:{c:'#cfc9bb', m:0, lc:'#ffe2bb', lk:0.6, e:0.6}, dark:'#a49d8e', mound:'#6f8a4e', stele:{c:'#8d8a82', m:0, lc:'#ffe2bb', lk:0.7}, gold:{c:'#c9a24a', glow:'#ffcf70', gk:0.4},
  wall:{c:'#d8d1c1', m:0, lc:'#ffe2bb', lk:0.45}, cope:'#7d8580', sroof:'#8f9290', panel:'#bdb6a6', pave:'#cbc4b4', tr:'#6b553f', cr:'#4e7a3c', lamp:{c:'#fff1d6', glow:'#ffd9a0', gk:1.4}};
LANDMARKS.szsongtomb = {zh:'宋少帝陵', en:'Tomb of the Last Song Emperor', cat:'old', r:37, h:10,
  lt:{m:0, c:'#ffe2bb', k:0.6, e:0.6, anim:'breathe'},
  build(){
    const T = D.szsongtomb, g = new THREE.Group(), B = Batch(), bs = baseOf(T, 37), gl = bs.gl;
    const S = {stone:STS.stone, sroof:STS.sroof, panel:STS.panel};
    const gv = T.grave, ys = gl(gv[0], gv[1]);
    // terraces stepping up the slope to the north: forecourt -> stele terrace -> mound
    pave(B, STS.pave, T.out, gl, 3, 1.0);
    const terr = (z0, z1, x0, x1) => { let hi = -Infinity, lo = Infinity; for (const x of [x0, x1]) for (const z of [z0, z1]){ hi = Math.max(hi, gl(x, z)); lo = Math.min(lo, gl(x, z)); } abox(B, STS.stone, x0, x1, lo - 0.6, hi + 0.3, z0, z1, {top:STS.pave}); return hi + 0.3; };
    const yT1 = terr(gv[1] + 2, gv[1] + 9, gv[0] - 10, gv[0] + 10);                  // front terrace
    const yT2 = Math.max(yT1 + 0.9, terr(gv[1] - 14, gv[1] + 2, gv[0] - 12, gv[0] + 12));  // stele / mound terrace
    for (let k = 0; k < 5; k++) abox(B, STS.stone, gv[0] - 3, gv[0] + 3, yT1 - 0.2, yT1 + (yT2 - yT1)*(k + 1)/5, gv[1] + 2 - k*0.4, gv[1] + 2.4 - k*0.4);
    // horseshoe (armchair) wall round the mound
    const mc = [gv[0], gv[1] - 6.5];
    for (let i = 0; i <= 18; i++){ const a0 = PI*(1 + i/18*0.999) - 0.25, a1 = PI*(1 + (i + 1)/18*0.999) - 0.25; if (i === 18) break;
      const p = [mc[0] + Math.cos(a0)*8, mc[1] + Math.sin(a0)*7], q = [mc[0] + Math.cos(a1)*8, mc[1] + Math.sin(a1)*7]; sbox(B, STS.stone, p, q, 0.8, yT2 - 0.5, yT2 + 1.4 - 0.6*Math.abs(Math.cos((a0 + a1)/2))); }
    // the mound (grassed, stone ring)
    LCyl(g, 5.2, 5.4, 0.8, mc[0], yT2 - 0.3, mc[1], STS.stone, 20); LDome(g, 5.0, mc[0], yT2 + 0.5, mc[1], STS.mound, 0.45, 20);
    // the tombstone with its carved surround, an altar table in front
    obox(B, STS.stone, gv[0], gv[1] - 1.2, 1, 0, 3.6, 0.9, yT2, yT2 + 0.5);
    obox(B, STS.stele, gv[0], gv[1] - 1.3, 1, 0, 1.5, 0.45, yT2 + 0.5, yT2 + 3.0); obox(B, STS.stone, gv[0] - 1.25, gv[1] - 1.3, 1, 0, 0.6, 0.55, yT2 + 0.5, yT2 + 2.6); obox(B, STS.stone, gv[0] + 1.25, gv[1] - 1.3, 1, 0, 0.6, 0.55, yT2 + 0.5, yT2 + 2.6);
    hipRoof2(B, STS.dark, gv[0], gv[1] - 1.3, 1, 0, 3.6, 1.4, yT2 + 3.0, 0.6, 0.15, 0.9);
    obox(B, STS.gold, gv[0], gv[1] - 1.05, 1, 0, 0.35, 0.05, yT2 + 0.9, yT2 + 2.6);
    obox(B, STS.stone, gv[0], gv[1] + 1.2, 1, 0, 2.2, 0.9, yT2, yT2 + 0.9);
    // the stone tablet east of the tomb
    { const x = gv[0] + 9.5, z = gv[1] + 1; obox(B, STS.stone, x, z, 1, 0, 2.0, 0.9, yT2, yT2 + 0.5); obox(B, STS.stele, x, z, 1, 0, 1.6, 0.35, yT2 + 0.5, yT2 + 2.8); }
    // the 4 m statue (Lu Xiufu with the boy emperor on his back) west of the tomb (OSM node), on a pedestal
    { const [x, z] = T.statue, y = gl(x, z); abox(B, STS.stone, x - 1.6, x + 1.6, y - 0.6, y + 1.2, z - 1.6, z + 1.6); statue(g, STS.stone, x, y + 1.2, z, 4.0, true); LSph(g, 0.45, x + 0.05, y + 1.2 + 3.45, z + 0.45, STS.stone, 1, 8); }
    // the gate (stone paifang) at the precinct entrance, facing south
    { const [x, z] = T.gate, y = gl(x, z); paifang(B, S, x, z, 1, 0, 7.5, y, y + 4.6, y + 5.8, y + 5.8); }
    // the precinct wall
    const W = T.wall; for (let i = 0; i + 1 < W.length; i++){ const a = W[i], b = W[i + 1], m = [(a[0] + b[0])/2, (a[1] + b[1])/2], y = gl(m[0], m[1]); if (Math.hypot(m[0] - T.gate[0], m[1] - T.gate[1]) < 4.5) continue;
      sbox(B, STS.wall, a, b, 0.5, y - 0.8, y + 1.9); sbox(B, STS.cope, a, b, 0.75, y + 1.9, y + 2.15); }
    // banyans and lamps
    const TS = {tr:STS.tr, cr:STS.cr};
    for (const [dx, dz, h] of [[-14, -14, 10], [15, -16, 9], [-20, 6, 8], [20, 4, 8]]){ const x = gv[0] + dx, z = gv[1] + dz; if (!pip(grow(T.out, 3), x, z)) continue; lmTree(B, TS, x, gl(x, z), z, h, 4.2); }
    for (const dx of [-5, 5]){ const x = gv[0] + dx, z = gv[1] + 6, y = gl(x, z); abox(B, STS.stone, x - 0.35, x + 0.35, y, y + 1.6, z - 0.35, z + 0.35); lampBox(B, STS.lamp, x, y + 1.6, z, 0.5); }
    B.flush(g); return g; }};
SG_PLACES.push({type:'szsongtomb', lat:D.szsongtomb.lat, lon:D.szsongtomb.lon, rot:0});

// ================= Chiwan Left Fort (赤湾左炮台) =================
// Qing coastal battery on Yingzui Hill above Chiwan (1717: Wikipedia, gwulo; 1669: Shenzhen Government Online - the date is not
// settled, so none is shown): granite-block walls over 3 m high, the entrance on the north side, two soldiers' quarters (ruins)
// on the east and west sides, a raised southern gun platform about 8 m wide (Trip.com visitor notes), one cannon on the sea-view
// platform, a bronze statue of Lin Zexu, two banyans about 130 years old (Shenzhen Government Online). Positions: the OSM fort and
// statue nodes. The enclosure's size (30 x 24 m) and the statue's size are estimates.
const LFS = {gran:{c:'#bdb3a0', m:0, lc:'#ffe0b4', lk:0.6, e:0.55}, granD:'#9c9381', pave:'#b5ad9c', iron:'#2e2d2b', wood:'#6a4b32', bronze:{c:'#5a4a35', m:0, lc:'#ffe0b4', lk:0.9},
  ruin:'#a89f8c', tr:'#6b553f', cr:'#4a7539', lamp:{c:'#fff1d6', glow:'#ffd9a0', gk:1.4}};
LANDMARKS.szleftfort = {zh:'赤湾左炮台', en:'Chiwan Left Fort', cat:'old', r:52, h:8,
  lt:{m:0, c:'#ffe0b4', k:0.6, e:0.55, anim:'breathe'},
  build(){
    const T = D.szleftfort, g = new THREE.Group(), B = Batch(), bs = baseOf(T, 52), gl = bs.gl;
    const [fx, fz] = T.fort, HL = 11.5, HW = 9.5;              // enclosure half-length (E-W), half-width (N-S)
    let lo = Infinity, hi = -Infinity; for (const x of [fx - HL, fx, fx + HL]) for (const z of [fz - HW, fz, fz + HW]){ const v = gl(x, z); lo = Math.min(lo, v); hi = Math.max(hi, v); }
    const yf = hi - 0.3*(hi - lo);                            // the fort's floor: a levelled terrace cut into the slope, retaining walls on the low side
    abox(B, LFS.granD, fx - HL - 0.8, fx + HL + 0.8, lo - 1.5, yf, fz - HW - 0.8, fz + HW + 0.8, {top:LFS.pave});
    abox(B, LFS.granD, fx - HL - 2.2, fx + HL + 2.2, lo - 1.5, Math.min(yf - 1.6, lo + (yf - lo)*0.5), fz - HW - 2.2, fz + HW + 2.2);
    // the walls: 1.2 m thick, 3.4 m over the floor, the gate gap in the north wall
    const wl = (x0, x1, z0, z1) => abox(B, LFS.gran, x0, x1, yf - 0.2, yf + 3.4, z0, z1);
    wl(fx - HL, fx - 2.0, fz - HW, fz - HW + 1.2); wl(fx + 2.0, fx + HL, fz - HW, fz - HW + 1.2);
    wl(fx - HL, fx - HL + 1.2, fz - HW, fz + HW); wl(fx + HL - 1.2, fx + HL, fz - HW, fz + HW);
    // the south side: raised gun platform 8 m wide with a low parapet and embrasures
    abox(B, LFS.gran, fx - HL + 1.2, fx + HL - 1.2, yf - 0.2, yf + 1.6, fz + HW - 8, fz + HW, {top:LFS.pave});
    for (let x = fx - HL; x < fx + HL - 0.1; x += 3){ if (Math.abs(x + 1.5 - fx) < 1.5) continue; abox(B, LFS.gran, x, x + 2.0, yf + 1.4, yf + 2.8, fz + HW - 1.0, fz + HW); }
    abox(B, LFS.gran, fx - HL, fx + HL, yf + 1.4, yf + 2.0, fz + HW - 1.0, fz + HW);
    // the cannon on its carriage, pointing south-west to the sea
    { const cx = fx, cz = fz + HW - 3.4, y = yf + 1.6, ux = -0.5, uz = 0.866;
      obox(B, LFS.wood, cx, cz, ux, uz, 2.0, 1.2, y, y + 0.6); for (const s of [-0.5, 0.5]) LCyl(g, 0.45, 0.45, 0.2, cx - uz*s*1.4, y + 0.45, cz + ux*s*1.4, LFS.wood, 10);
      beam(B, LFS.iron, [cx - ux*1.5, y + 0.95, cz - uz*1.5], [cx + ux*1.7, y + 1.05, cz + uz*1.7], 0.32); beam(B, LFS.iron, [cx - ux*1.6, y + 0.95, cz - uz*1.6], [cx - ux*1.2, y + 0.95, cz - uz*1.2], 0.45); }
    // soldiers' quarters (ruined walls) on the east and west sides
    for (const sg of [-1, 1]){ const x0 = fx + sg*(HL - 1.2), x1 = fx + sg*(HL - 6.2);
      abox(B, LFS.ruin, Math.min(x0, x1), Math.max(x0, x1), yf, yf + 1.7, fz - HW + 4, fz - HW + 4.7); abox(B, LFS.ruin, Math.min(x0, x1), Math.max(x0, x1), yf, yf + 1.1, fz + 2, fz + 2.7);
      abox(B, LFS.ruin, x1 - 0.35, x1 + 0.35, yf, yf + 1.4, fz - HW + 4, fz + 2.7); }
    // the stone steps up to the gate from the north
    for (let k = 0; k < 14; k++){ const z = fz - HW - 2.2 - k*0.9, yt = yf - k*0.42; if (yt < gl(fx, z) - 0.2) break; abox(B, LFS.granD, fx - 2.2, fx + 2.2, gl(fx, z) - 1.5, yt, z - 0.9, z); }
    // two old banyans by the fort
    const TS = {tr:LFS.tr, cr:LFS.cr};
    for (const [dx, dz] of [[-HL - 6, -2], [HL + 6, -6]]){ const x = fx + dx, z = fz + dz, y = gl(x, z); LCyl(g, 0.7, 1.1, 5, x, y - 0.5, z, LFS.tr, 8); LSph(g, 7.5, x, y + 8, z, LFS.cr, 0.55, 12); }
    // Lin Zexu's bronze statue on its granite pedestal (OSM node), facing the sea to the west
    { const [x, z] = T.lin, y = gl(x, z); abox(B, LFS.granD, x - 3, x + 3, y - 0.8, y + 0.6, z - 3, z + 3); abox(B, LFS.gran, x - 1.4, x + 1.4, y + 0.6, y + 3.4, z - 1.4, z + 1.4);
      statue(g, LFS.bronze, x, y + 3.4, z, 3.6, true); LSph(g, 0.4, x - 0.15, y + 3.4 + 3.35, z, LFS.bronze, 1, 8);
      for (const [dx, dz] of [[-3.5, 3.5], [3.5, 3.5]]) { abox(B, LFS.granD, x + dx - 0.25, x + dx + 0.25, y, y + 1.2, z + dz - 0.25, z + dz + 0.25); lampBox(B, LFS.lamp, x + dx, y + 1.2, z + dz, 0.4); } }
    B.flush(g); return g; }};
SG_PLACES.push({type:'szleftfort', lat:D.szleftfort.lat, lon:D.szleftfort.lon, rot:0});
