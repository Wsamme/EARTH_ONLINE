// ---------- Window of the World 世界之窗 (1993/94; 48 ha, ~130 reproductions; the Eiffel Tower replica 108 m) ----------
// Placed from the real data: the park outline (w236402460, grown round the Louvre-pyramid entrance w264194869), the OSM footprints
// of the Eiffel Tower, Arc de Triomphe, Colosseum, Taj Mahal, the three Giza pyramids, Katsura and the halls, and the OSM points
// of ~35 named miniatures. Miniatures without a footprint are built at about 1:15 (estimated); no signage, no characters.
const WOTW = {
  stone:'#e8e1d2', marble:'#f3f1ec', sand:'#d8c49a', brick:'#a8644a', slate:'#5f6670', copper:'#7fa896', gold:'#d9b25a', wood:'#6b4a34',
  roofT:'#a75b3e', white:'#f2f0ea', grey:'#9fa3a3', glass:'#a9bcc6', green:'#6f8a5a', red:'#a8473a', dark:'#2c2f33', rock:'#8d8478', snow:'#f4f6f8'};
// Eiffel Tower at 1:3: 108 m; base 41.7 m square; floors at 57.6 / 115.7 / 276 m real -> 19.2 / 38.6 / 92 m
function eiffel(B, S, cx, cz, ang, y0){
  const sc = 1/3, F = Fr(cx, cz, ang, y0), BR = RGB('#7b5e46'), BRd = RGB('#5e4636'), K = S.gold;
  const HW = [[0, 62.5], [20, 52], [40, 43], [57.6, 36.5], [80, 29], [100, 23.5], [115.7, 20.5], [150, 15.5], [180, 12.6], [210, 10.6], [240, 9.0], [276, 7.6], [290, 5.5], [300, 3.0]];
  const LW = [[0, 25], [57.6, 17.5], [115.7, 13.5], [180, 12.6]];
  const it = (T, y) => { for (let i = 1; i < T.length; i++) if (y <= T[i][0]) { const f = (y - T[i-1][0])/(T[i][0] - T[i-1][0]); return lerp(T[i-1][1], T[i][1], f); } return T[T.length - 1][1]; };
  const hw = y => it(HW, y/sc)*sc, lw = y => Math.min(hw(y), it(LW, Math.min(y/sc, 180))*sc);
  const P = (u, y, v) => F(u, y, v);
  const lv = []; for (let y = 0; y < 60; y += 3.2) lv.push(y); lv.push(60);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]){
    for (let i = 0; i < lv.length - 1; i++){ const ya = lv[i], yb = lv[i+1];
      const C = y => { const o = hw(y), n = o - lw(y); return [[sx*o, sz*o], [sx*n, sz*o], [sx*n, sz*n], [sx*o, sz*n]]; };
      const a = C(ya), b = C(yb);
      for (let k = 0; k < 4; k++){ bar(B, K, BR, P(a[k][0], ya, a[k][1]), P(b[k][0], yb, b[k][1]), 0.55);
        const k2 = (k + 1) % 4; if (lw(ya) < 0.3) continue;
        bar(B, K, BRd, P(a[k][0], ya, a[k][1]), P(b[k2][0], yb, b[k2][1]), 0.2); bar(B, K, BRd, P(a[k2][0], ya, a[k2][1]), P(b[k][0], yb, b[k][1]), 0.2);
        if (i % 2 === 0) bar(B, K, BRd, P(b[k][0], yb, b[k][1]), P(b[k2][0], yb, b[k2][1]), 0.18); } } }
  // the shaft above the merge (60 m): four corner chords and X bracing
  const sv = []; for (let y = 60; y < 92; y += 3.4) sv.push(y); sv.push(92);
  for (let i = 0; i < sv.length - 1; i++){ const ya = sv[i], yb = sv[i+1], ra = hw(ya), rb = hw(yb), cs = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
    for (let k = 0; k < 4; k++){ const q = cs[k], q2 = cs[(k + 1) % 4];
      bar(B, K, BR, P(q[0]*ra, ya, q[1]*ra), P(q[0]*rb, yb, q[1]*rb), 0.42);
      bar(B, K, BRd, P(q[0]*ra, ya, q[1]*ra), P(q2[0]*rb, yb, q2[1]*rb), 0.16); bar(B, K, BRd, P(q2[0]*ra, ya, q2[1]*ra), P(q[0]*rb, yb, q[1]*rb), 0.16); } }
  // the four great arches between the pillars under the first floor
  for (let f = 0; f < 4; f++){ const A = f*HP, FA = Fr(cx, cz, ang + A, y0); const o = 62.5*sc, n = (62.5 - 25)*sc, top = 39*sc;
    let prev = null; for (let i = 0; i <= 16; i++){ const t = i/16, u = lerp(-n, n, t), y = top*Math.sin(t*PI)*0.92 + 0.2, v = o - (o - hw(y))*0.6, p = FA(u, y, v); if (prev) bar(B, K, BR, prev, p, 0.35); prev = p; }
    for (let i = 1; i < 8; i++){ const t = i/8, u = lerp(-n, n, t), y = top*Math.sin(t*PI)*0.92; bar(B, K, BRd, FA(u, y, o - (o - hw(y))*0.6), FA(u, 19.2, hw(19.2)), 0.16); } }
  // platforms: first floor (girder ring with arcade frieze), second floor, third-floor cabin, the top
  const ring = (y, w, hh, col) => { const r = hw(y) + 0.6; for (let f = 0; f < 4; f++){ const FA = Fr(cx, cz, ang + f*HP, y0); fbox(B, FA, K, col, 0, r - w/2, 2*r, w, y, hh); } };
  ring(19.2, 4.2, 1.0, BR); ring(19.2 + 1.0, 0.4, 1.6, BRd); ring(38.6, 3.2, 0.8, BR); fbox(B, F, K, BR, 0, 0, 2*hw(38.6), 2*hw(38.6), 38.6, 0.5);
  fbox(B, F, K, BRd, 0, 0, 5.6, 5.6, 92, 2.4); fbox(B, F, K, BR, 0, 0, 6.2, 6.2, 94.4, 0.4); fbox(B, F, K, BRd, 0, 0, 3.2, 3.2, 94.8, 3.4);
  fcyl(B, F, K, BR, 0, 0, 0.9, 98.2, 2.6, 8, 0.6); fcyl(B, F, S.steel, RGB('#c8c8c8'), 0, 0, 0.22, 100.8, 7.2, 6, 0.08);
  fbox(B, F, S.glow, [1, 1, 1], 0, 0, 1.5, 1.5, 95.4, 1.6); fbox(B, F, S.red, [1, 1, 1], 0, 0, 0.5, 0.5, 107.6, 0.5);
}
// the Louvre pyramid: 35.4 m base, 21.6 m high (ratio 0.61); here on its 14.7 m footprint
function louvre(B, S, P, gy){
  const F0 = obb(P), [lo] = groundSpan(gy, P), side = Math.min(F0.L, F0.W), h = side*0.61, F = Fr(F0.cx, F0.cz, F0.ang, lo), GL = RGB('#b9c9d2'), M = RGB('#8b9399');
  fbox(B, F, S.flood, RGB('#d8d4ca'), 0, 0, side + 8, side + 8, -1.2, 1.5);
  fpyr(B, F, S.glass, GL, 0, 0, side, side, 0.3, h, 0);
  for (let f = 0; f < 4; f++){ const FA = Fr(F0.cx, F0.cz, F0.ang + f*HP, lo + 0.3);
    for (let i = 1; i < 7; i++){ const t = i/7, a = FA(-side/2 + side*t, 0, -side/2), b = FA(0, h, 0); bar(B, S.steel, M, a, [lerp(a[0], b[0], 0.97), lerp(a[1], b[1], 0.97), lerp(a[2], b[2], 0.97)], 0.07); }
    bar(B, S.steel, M, FA(-side/2, 0, -side/2), FA(0, h, 0), 0.14); }
  fbox(B, F, S.glow, [1, 1, 1], 0, 0, side*0.5, side*0.5, 0.3, 0.6);
}
// a stepped/plain pyramid on its footprint (Giza: Khufu 146/230, Khafre 143.5/215, Menkaure 65/103 -> height = ratio x base)
function pyramid(B, S, P, gy, ratio, col){ const F0 = obb(P), [lo] = groundSpan(gy, P), s = Math.sqrt(parea(P)), F = Fr(F0.cx, F0.cz, F0.ang, lo - 0.5);
  fpyr(B, F, S.flood, RGB(col || WOTW.sand), 0, 0, s, s, 0, s*ratio + 0.5, 0); return {F0, s, lo}; }
// Taj Mahal on its footprint read as the plinth (95 m square real): mausoleum 57 m, outer dome to 73 m, minarets 40 m
function taj(B, S, P, gy){ const F0 = obb(P), [lo] = groundSpan(gy, P), side = Math.min(F0.L, F0.W), k = side/95, F = Fr(F0.cx, F0.cz, F0.ang, lo), W = RGB(WOTW.marble), Wd = RGB('#e3dfd6'), Dk = RGB('#5d6066');
  fbox(B, F, S.flood, Wd, 0, 0, side, side, -1, 1 + 6.7*k);
  const y1 = 6.7*k, m = 57*k, ch = 12*k;
  const oct = []; for (let i = 0; i < 8; i++){ const a = PI/8 + i*PI/4, r = m/2/Math.cos(PI/8); oct.push([Math.cos(a)*r, Math.sin(a)*r]); }
  const sq = [[-m/2 + ch, -m/2], [m/2 - ch, -m/2], [m/2, -m/2 + ch], [m/2, m/2 - ch], [m/2 - ch, m/2], [-m/2 + ch, m/2], [-m/2, m/2 - ch], [-m/2, -m/2 + ch]].map(p => F(p[0], 0, p[1]).filter((_, i) => i !== 1));
  prism(B, S.flood, W, sq.map(p => [p[0], p[1]]), lo + y1, lo + y1 + 33*k, W);
  for (let f = 0; f < 4; f++){ const FA = Fr(F0.cx, F0.cz, F0.ang + f*HP, lo + y1); fshape(B, FA, S.dark, Dk, ptArch(8*k, 26*k, 4).map(p => [p[0], p[1] + 2*k]), m/2 + 0.02, m/2 + 0.08, false); }
  flathe(B, F, S.flood, W, 0, 0, lo + y1 + 33*k, [[0, 0], [11.5*k, 0], [11.5*k, 6*k], [13.5*k, 10*k], [14*k, 15*k], [12*k, 21*k], [7.5*k, 26.5*k], [2*k, 29.5*k], [0, 30.5*k]], 14);
  fcyl(B, F, S.gold, RGB(WOTW.gold), 0, 0, 0.5*k, lo + y1 + 63.5*k, 9*k, 6, 0.2*k);
  for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]){ fcyl(B, F, S.flood, W, u*m*0.36, v*m*0.36, 5.2*k, y1 + 33*k, 4*k, 8);
    flathe(B, F, S.flood, W, u*m*0.36, v*m*0.36, lo + y1 + 37*k, domeP(5.8*k, 1.2, 4), 8);
    fcyl(B, F, S.flood, W, u*(side/2 - 3*k), v*(side/2 - 3*k), 3.2*k, y1, 37*k, 10, 2.6*k);
    flathe(B, F, S.flood, W, u*(side/2 - 3*k), v*(side/2 - 3*k), lo + y1 + 37*k, domeP(3.4*k, 1.3, 3), 8); }
}
// Colosseum (189 x 156 m, 48 m) on its 15 x 12.6 m footprint; the outer ring broken on one side as on the real one
function colosseum(B, S, P, gy){ const F0 = obb(P), [lo] = groundSpan(gy, P), a = F0.L/2, b = F0.W/2, k = F0.L/189, h = 48*k, F = Fr(F0.cx, F0.cz, F0.ang, lo), T = RGB('#cdb894'), Td = RGB('#8f7a5c'), Ar = RGB('#5a4a3a');
  const n = 40, pt = (r, t, y) => F(Math.cos(t)*a*r, y, Math.sin(t)*b*r);
  for (let i = 0; i < n; i++){ const t0 = i/n*TAU, t1 = (i + 1)/n*TAU, hh = (i > 24 && i < 33) ? h*0.62 : h;
    B.quad(S.flood, T, pt(1, t0, -0.5), pt(1, t1, -0.5), pt(1, t1, hh), pt(1, t0, hh)); B.quad(S.flood, Td, pt(0.7, t0, -0.5), pt(0.7, t1, -0.5), pt(0.7, t1, h*0.8), pt(0.7, t0, h*0.8));
    B.quad(S.flood, Td, pt(0.7, t0, h*0.8), pt(1, t0, hh*0.98), pt(1, t1, hh*0.98), pt(0.7, t1, h*0.8));
    for (let tier = 0; tier < 3; tier++){ const ya = h*(0.06 + tier*0.25), yb = ya + h*0.16; if (yb > hh) continue; const tm = (t0 + t1)/2, dt = (t1 - t0)*0.28;
      B.quad(S.dark, Ar, pt(1.005, tm - dt, ya), pt(1.005, tm + dt, ya), pt(1.005, tm + dt, yb), pt(1.005, tm - dt, yb)); } }
  flathe(B, F, S.plain, RGB('#bfae8d'), 0, 0, lo, [[0, 0.3], [1, 0.3]], 20, a*0.52, b*0.52);
}
// Arc de Triomphe (45 x 22 m, 50 m high; main arch 29 m high, 14.6 m wide) on its footprint
function arc(B, S, P, gy){ const F0 = obb(P), [lo] = groundSpan(gy, P), k = F0.L/45, F = Fr(F0.cx, F0.cz, F0.ang, lo), C = RGB('#e2d8c3'), Cd = RGB('#c9bea6');
  const w = 45*k, d = F0.W, H = 50*k, aw = 14.6*k/2, ah = 29.2*k;
  const out = [[-w/2, 0], [-aw, 0]].concat(archTop(aw, ah - aw, 10)).concat([[aw, 0], [w/2, 0], [w/2, H*0.82], [-w/2, H*0.82]]);
  fshape(B, F, S.flood, C, out, -d/2, d/2);
  fbox(B, F, S.flood, Cd, 0, 0, w + 0.4, d + 0.4, H*0.66, H*0.04); fbox(B, F, S.flood, C, 0, 0, w, d, H*0.82, H*0.18); fbox(B, F, S.flood, Cd, 0, 0, w + 0.3, d + 0.3, H*0.98, H*0.02);
  for (const s of [-1, 1]){ const FA = Fr(F0.cx, F0.cz, F0.ang + HP, lo); fbox(B, FA, S.dark, RGB('#3c3a36'), 0, s*(w/2 + 0.02), 8.5*k, 0.05, 0, 18.7*k); }
}
// Japanese villa (Katsura) on its stepped footprint: dark timber and white panels, low shingle roofs
function katsura(B, S, P, gy){ const [lo, hi] = groundSpan(gy, P);
  prism(B, S.flood, RGB('#cfc8b8'), inset(P, -0.8), lo - 1, hi + 0.9, RGB('#cfc8b8'));
  prism(B, S.wall, RGB('#efe9dc'), P, hi + 0.9, hi + 4.4, null); prism(B, S.plain, RGB('#4a4642'), inset(P, -1.4), hi + 4.4, hi + 4.8, RGB('#6b6862'));
  const I = inset(P, 2.6); prism(B, S.plain, RGB('#5e5b56'), I, hi + 4.8, hi + 6.4, RGB('#6b6862')); }
// Alps Ice and Snow World: the oval hall under a rock-and-snow massif (the park's Alps / Matterhorn scene)
function alps(B, S, P, gy, rng){ const [lo, hi] = groundSpan(gy, P), c = pcent(P);
  prism(B, S.flood, RGB('#b9b4aa'), P, lo - 1.5, hi + 9, RGB('#a7a39b'));
  const F0 = obb(P), F = Fr(F0.cx, F0.cz, F0.ang, hi + 9), L = F0.L, W = F0.W, R = RGB(WOTW.rock), N = RGB(WOTW.snow);
  const pk = [[L*0.28, 0, 15], [-L*0.05, W*0.1, 10], [-L*0.3, -W*0.08, 8], [L*0.05, -W*0.12, 9]];
  for (const [u, v, h] of pk){ const r = W*0.42, seg = 7, pr = []; for (let i = 0; i < seg; i++){ const a = i/seg*TAU; pr.push([u + Math.cos(a)*r*(0.8 + 0.3*rng()), v + Math.sin(a)*r*(0.7 + 0.3*rng())]); }
    const apex = F(u + r*0.1, h, v), sn = 0.62;
    for (let i = 0; i < seg; i++){ const a = pr[i], b = pr[(i + 1) % seg], A = F(a[0], 0, a[1]), Bq = F(b[0], 0, b[1]);
      const mA = [lerp(A[0], apex[0], sn), lerp(A[1], apex[1], sn), lerp(A[2], apex[2], sn)], mB = [lerp(Bq[0], apex[0], sn), lerp(Bq[1], apex[1], sn), lerp(Bq[2], apex[2], sn)];
      B.quad(S.flood, R, A, Bq, mB, mA); B.tri(S.flood, N, mA, mB, apex); } } }
// classical hall with a colonnade (Caesar's Palace, palaces): columns every ~4 m round the footprint's box, pediment at the front
function colonnade(B, S, P, gy, col, h, ped){ const F0 = obb(P), [lo, hi] = groundSpan(gy, P), F = Fr(F0.cx, F0.cz, F0.ang, hi), C = RGB(col || WOTW.stone), Cd = mixc(C, [0.5, 0.45, 0.4], 0.25);
  fbox(B, F, S.flood, Cd, 0, 0, F0.L, F0.W, lo - hi - 1.5, hi - lo + 2.3);
  fbox(B, F, S.wall, mixc(C, [0.85, 0.8, 0.7], 0.3), 0, 0, F0.L - 5, F0.W - 5, 0.8, h - 1.5);
  const nL = Math.round(F0.L/4), nW = Math.round(F0.W/4);
  for (let i = 0; i <= nL; i++) for (const s of [-1, 1]) fcyl(B, F, S.flood, C, -F0.L/2 + 1 + (F0.L - 2)*i/nL, s*(F0.W/2 - 1), 0.42, 0.8, h - 2.4, 8);
  for (let i = 1; i < nW; i++) for (const s of [-1, 1]) fcyl(B, F, S.flood, C, s*(F0.L/2 - 1), -F0.W/2 + 1 + (F0.W - 2)*i/nW, 0.42, 0.8, h - 2.4, 8);
  fbox(B, F, S.flood, C, 0, 0, F0.L, F0.W, h - 1.6, 1.6);
  if (ped) { const pw = Math.min(F0.L*0.4, 24); fshape(B, Fr(F0.cx, F0.cz, F0.ang, hi + h), S.flood, C, [[-pw/2, 0], [pw/2, 0], [0, pw*0.2]], F0.W/2 - 3, F0.W/2); }
  fgable(B, F, S.plain, RGB(WOTW.roofT), 0, 0, F0.L - 4, F0.W - 4, h, Math.min(4, F0.W*0.18), 0.3);
}
// ---- miniatures on their OSM points, about 1:15 (front +v toward the nearest walk) ----
const WMINI = [
  [/悉尼歌剧院/, (B, S, F) => { const W = RGB('#f4f2ec'), Pd = RGB('#b7a58c'); fbox(B, F, S.flood, Pd, 0, 0, 13, 7, -0.6, 1.6);
      for (const [u0, sz, n] of [[-3.6, 1, 3], [2.8, 0.75, 3]]) for (let i = 0; i < n; i++){ const u = u0 + i*1.4*sz, hh = (4.4 - i*1.0)*sz, len = 2.8*sz;
        const sh = [[0, 0], [len*0.9, 0]]; for (let j = 1; j <= 8; j++){ const t = j/8; sh.push([len*0.9*(1 - t) + len*0.25*Math.sin(t*PI), hh*Math.sin(t*HP)]); }
        const G = (a, y, b) => F(u + a, 1.0 + y, b);
        for (const sd of [-1, 1]){ for (let j = 0; j < sh.length - 1; j++){ const p = sh[j], q = sh[j + 1]; B.quad(S.flood, W, G(p[0] - len*0.45, p[1], sd*0.05), G(q[0] - len*0.45, q[1], sd*0.05), G(q[0] - len*0.45, q[1]*0.2, sd*1.6*sz), G(p[0] - len*0.45, p[1]*0.2, sd*1.6*sz)); } } } }],
  [/科隆主教座堂/, (B, S, F) => { const C = RGB('#6d6a66'); fbox(B, F, S.flood, C, 0, 0, 9.6, 3.2, 0, 3.0); fbox(B, F, S.flood, C, 0, 0, 2.6, 5.6, 0, 3.0);
      fgable(B, F, S.plain, RGB('#4f565c'), 0, 0, 9.6, 3.2, 3.0, 1.4); for (const s of [-1, 1]){ fbox(B, F, S.flood, C, -4.3, s*1.0, 1.6, 1.6, 0, 6.5); fpyr(B, F, S.flood, C, -4.3, s*1.0, 1.6, 1.6, 6.5, 4.0, 0); } }],
  [/巴黎圣母院/, (B, S, F) => { const C = RGB('#cfc3a8'); fbox(B, F, S.flood, C, 0, 0, 8.5, 3.2, 0, 2.6); fgable(B, F, S.plain, RGB('#5a6268'), 0, 0, 8.5, 3.2, 2.6, 1.2);
      for (const s of [-1, 1]) fbox(B, F, S.flood, C, -3.8, s*1.0, 1.5, 1.6, 0, 4.6); fbox(B, F, S.flood, C, -3.8, 0, 1.5, 0.6, 0, 3.6); fpyr(B, F, S.plain, RGB('#5a6268'), 0.8, 0, 0.5, 0.5, 3.6, 3.0, 0); }],
  [/比萨斜塔/, (B, S, F) => { const W = RGB('#efe9dc'), G = Fr(F(0, 0, 0)[0], F(0, 0, 0)[2], 0, F(0, 0, 0)[1]);
      for (let i = 0; i < 8; i++){ const y = i*0.47, dx = y*0.07; fcyl(B, G, S.flood, W, dx, 0, i === 7 ? 0.75 : 1.03, y, 0.47, 12, i === 7 ? 0.7 : 1.03); } }],
  [/凡尔赛宫/, (B, S, F) => { const C = RGB('#e7dcc6'), R = RGB('#53606a'); for (const [u, v, w, d] of [[0, -2, 14, 2.4], [-6, 1, 2.4, 6], [6, 1, 2.4, 6]]){ fbox(B, F, S.flood, C, u, v, w, d, 0, 1.6); fhip(B, F, S.plain, R, u, v, w, d, 1.6, 0.6); } }],
  [/阿尔罕布拉宫/, (B, S, F) => { const C = RGB('#d9bf98'); for (const s of [-1, 1]){ fbox(B, F, S.flood, C, 0, s*3, 7, 0.8, 0, 1.4); fbox(B, F, S.flood, C, s*3.1, 0, 0.8, 6.8, 0, 1.4); }
      fcyl(B, F, S.flood, RGB('#cfcac0'), 0, 0, 0.6, 0, 0.6, 8); }],
  [/斯顿亨治/, (B, S, F) => { const C = RGB('#9a958b'); for (let i = 0; i < 15; i++){ const a = i/15*TAU, x = Math.cos(a)*2.2, z = Math.sin(a)*2.2; fbox(B, Fr(F(x, 0, z)[0], F(x, 0, z)[2], a, F(0, 0, 0)[1]), S.flood, C, 0, 0, 0.35, 0.5, 0, 0.9); }
      for (let i = 0; i < 15; i += 2){ const a = (i + 0.5)/15*TAU; fbox(B, Fr(F(Math.cos(a)*2.2, 0, Math.sin(a)*2.2)[0], F(Math.cos(a)*2.2, 0, Math.sin(a)*2.2)[2], a + HP, F(0, 0, 0)[1]), S.flood, C, 0, 0, 1.0, 0.35, 0.9, 0.22); } }],
  [/科威特水塔/, (B, S, F) => { const W = RGB('#e9ecef'), Bl = RGB('#2f6f8f'); fcyl(B, F, S.flood, W, 0, 0, 0.25, 0, 12.5, 8, 0.12); flathe(B, F, S.flood, Bl, 0, 0, 6.5, [[0, 0], [1.6, 1.0], [1.9, 2.0], [1.4, 2.9], [0, 3.4]], 12); flathe(B, F, S.flood, Bl, 0, 0, 10.0, [[0, 0], [0.9, 0.6], [1.0, 1.0], [0.6, 1.6], [0, 1.8]], 10);
      fcyl(B, F, S.flood, W, 2.4, 0.5, 0.2, 0, 9.5, 8, 0.08); flathe(B, F, S.flood, Bl, 2.4, 0.5, 4.5, [[0, 0], [1.2, 0.8], [1.3, 1.6], [0.9, 2.3], [0, 2.6]], 10); fcyl(B, F, S.flood, W, -1.6, 0.8, 0.12, 0, 6.5, 6, 0.05); }],
  [/英国国会大厦/, (B, S, F) => { const C = RGB('#cdb98f'); fbox(B, F, S.flood, C, 0, 0, 18, 2.6, 0, 1.8); fgable(B, F, S.plain, RGB('#55606a'), 0, 0, 18, 2.6, 1.8, 0.8);
      fbox(B, F, S.flood, C, 8.6, 0, 1.2, 1.2, 0, 6.2); fpyr(B, F, S.flood, RGB('#6f6a5e'), 8.6, 0, 1.3, 1.3, 6.2, 1.8, 0); fbox(B, F, S.glow, [1, 1, 1], 8.6, 0, 1.24, 1.24, 4.9, 0.6);
      fbox(B, F, S.flood, C, -8.2, 0, 1.8, 1.8, 0, 6.6); for (let i = -3; i <= 3; i++) fpyr(B, F, S.flood, C, i*2.2, 1.3, 0.3, 0.3, 1.8, 1.0, 0); }],
  [/白金汉宫/, (B, S, F) => { const C = RGB('#e3dccd'); fbox(B, F, S.flood, C, 0, 0, 7.8, 1.8, 0, 1.6); fbox(B, F, S.flood, C, 0, -1.2, 1.6, 0.6, 0, 1.9); fbox(B, F, S.plain, RGB('#7e8479'), 0, 0, 7.8, 1.8, 1.6, 0.2); }],
  [/伊斯法罕/, (B, S, F) => { const T = RGB('#3f8ea6'), C = RGB('#d7c6a0'); fbox(B, F, S.flood, C, 0, 0, 8, 8, 0, 1.2); flathe(B, F, S.flood, T, 0, 0, 1.2, [[0, 0], [2.0, 0], [2.0, 1.0], [2.4, 2.0], [1.8, 3.4], [0.6, 4.2], [0, 4.4]], 12);
      fbox(B, F, S.flood, C, 0, 3.4, 3.6, 1.2, 0, 3.8); for (const s of [-1, 1]) fcyl(B, F, S.flood, T, s*1.9, 3.6, 0.28, 0, 6.2, 8, 0.24); }],
  [/伦敦塔桥/, (B, S, F) => { const C = RGB('#bfb6a2'), Bl = RGB('#6f9fc0'); for (const s of [-1, 1]){ fbox(B, F, S.flood, C, s*2.2, 0, 1.6, 1.6, -0.8, 4.8); fpyr(B, F, S.flood, RGB('#59606a'), s*2.2, 0, 1.6, 1.6, 4.0, 1.3, 0);
      fbox(B, F, S.flood, Bl, s*4.6, 0, 3.2, 1.2, 0.8, 0.3); } fbox(B, F, S.flood, Bl, 0, 0, 2.8, 1.2, 0.9, 0.25); fbox(B, F, S.flood, Bl, 0, 0, 2.8, 0.8, 3.3, 0.35); }],
  [/克里姆林宫/, (B, S, F) => { const R = RGB('#a74638'); fbox(B, F, S.flood, R, 0, 0, 16, 0.8, 0, 1.4); for (let i = -4; i <= 4; i++) fbox(B, F, S.flood, R, i*2, 0, 0.9, 1.1, 0, 2.0);
      fbox(B, F, S.flood, R, 0, 0, 1.6, 1.6, 0, 5.2); fpyr(B, F, S.flood, RGB('#5d7f63'), 0, 0, 1.4, 1.4, 5.2, 2.2, 0); fbox(B, F, S.lantern, [1, 1, 1], 0, 0, 0.3, 0.3, 7.4, 0.35); }],
  [/冬宫/, (B, S, F) => { const Gn = RGB('#7fb39a'), W = RGB('#f1eee6'); fbox(B, F, S.flood, Gn, 0, 0, 13, 2.6, 0, 1.8); for (let i = -6; i <= 6; i++) fbox(B, F, S.flood, W, i, 1.31, 0.18, 0.05, 0, 1.8); fbox(B, F, S.plain, RGB('#8c9a8a'), 0, 0, 13, 2.6, 1.8, 0.25); }],
  [/富士山/, (B, S, F) => { flathe(B, F, S.flood, RGB('#6e7f92'), 0, 0, -0.5, [[0, 0], [14, 0], [9, 2.8], [5, 5.4], [3.0, 6.8]], 14); flathe(B, F, S.flood, RGB(WOTW.snow), 0, 0, 6.3, [[3.25, 0], [1.8, 1.2], [0.9, 1.6], [0, 1.65]], 14); }],
  [/尼亚加拉/, (B, S, F) => { const R = RGB('#7e776b'), Wt = RGB('#e9f2f5'); for (let i = 0; i < 9; i++){ const a = -0.8 + i*0.2; fbox(B, Fr(F(Math.sin(a)*14, 0, -Math.cos(a)*6)[0], F(Math.sin(a)*14, 0, -Math.cos(a)*6)[2], a, F(0, 0, 0)[1]), S.flood, R, 0, 0, 3.4, 3.0, -0.5, 4.2);
      fbox(B, Fr(F(Math.sin(a)*14, 0, -Math.cos(a)*6 + 1.7)[0], F(Math.sin(a)*14, 0, -Math.cos(a)*6 + 1.7)[2], a, F(0, 0, 0)[1]), S.glow, [1, 1, 1], 0, 0, 3.2, 0.4, 0.2, 3.5); } fbox(B, F, S.water, RGB('#78b3c8'), 0, 2, 26, 9, 0, 0.15); }],
  [/狮头鱼身像/, (B, S, F) => { const W = RGB('#eeeeea'); fbox(B, F, S.flood, RGB('#a5a29a'), 0, 0, 2.4, 2.4, -0.4, 1.2); fcyl(B, F, S.flood, W, 0, 0, 0.55, 0.8, 2.0, 8, 0.7); flathe(B, F, S.flood, W, 0, 0.3, 2.8, [[0.75, 0], [0.85, 0.6], [0.6, 1.1], [0, 1.25]], 8); }],
  [/仰光大金塔/, (B, S, F) => { const G = RGB(WOTW.gold); fbox(B, F, S.flood, RGB('#e4dccd'), 0, 0, 7, 7, -0.5, 1.4); flathe(B, F, S.gold, G, 0, 0, 0.9, [[3.0, 0], [3.0, 0.6], [2.6, 1.1], [2.4, 2.6], [1.6, 4.0], [0.9, 5.2], [0.5, 6.6], [0.2, 8.4], [0, 9.6]], 14); }],
  [/吴哥窑/, (B, S, F) => { const C = RGB('#a59a83'); fpyr(B, F, S.flood, C, 0, 0, 14, 11, -0.5, 1.6, 11, 8.5); fpyr(B, F, S.flood, C, 0, 0, 10, 7.6, 1.1, 1.4, 8, 6);
      for (const [u, v, h] of [[0, 0, 5.0], [-3.2, -2.4, 3.4], [3.2, -2.4, 3.4], [-3.2, 2.4, 3.4], [3.2, 2.4, 3.4]]) flathe(B, F, S.flood, C, u, v, 2.5, [[0.8, 0], [0.8, 0.6], [0.65, h*0.5], [0.4, h*0.85], [0, h]], 8); }],
  [/婆罗浮屠/, (B, S, F) => { const C = RGB('#8f8a7e'); for (let i = 0; i < 6; i++) fpyr(B, F, S.flood, C, 0, 0, 12 - i*1.7, 12 - i*1.7, -0.4 + i*0.7, 0.7, 12 - i*1.7, 12 - i*1.7);
      for (let i = 0; i < 12; i++){ const a = i/12*TAU; flathe(B, F, S.flood, C, Math.cos(a)*2.4, Math.sin(a)*2.4, 3.8, [[0.32, 0], [0.34, 0.25], [0.2, 0.55], [0, 0.75]], 6); }
      flathe(B, F, S.flood, C, 0, 0, 3.8, [[1.0, 0], [1.05, 0.6], [0.6, 1.3], [0.12, 1.8], [0, 2.4]], 10); }],
  [/景福宫/, (B, S, F) => { fbox(B, F, S.flood, RGB('#cfc7b5'), 0, 0, 11, 6, -0.4, 1.0); fbox(B, F, S.flood, RGB('#a8473a'), 0, 0, 8, 3.8, 0.6, 1.8); fcnroof(B, F, S.plain, RGB('#4d5552'), 0, 0, 8, 3.8, 2.4, 2.2, 0.9);
      fbox(B, F, S.flood, RGB('#a8473a'), 0, 0, 6.5, 3.0, 3.1, 0.6); fcnroof(B, F, S.plain, RGB('#4d5552'), 0, 0, 6.5, 3.0, 3.7, 1.8, 0.8); }],
  [/泰王宫/, (B, S, F) => { const G = RGB(WOTW.gold), Rf = RGB('#b8533a'), Gn = RGB('#3e7c52'); fbox(B, F, S.flood, RGB('#f0ece2'), 0, 0, 9, 5, -0.4, 2.2);
      fgable(B, F, S.plain, Rf, 0, 0, 9, 5, 1.8, 2.0, 0.4); fgable(B, F, S.plain, Gn, 0, 0, 7.2, 3.6, 3.3, 1.6, 0.2); flathe(B, F, S.gold, G, 0, 0, 4.2, [[0.8, 0], [0.6, 1.0], [0.35, 2.4], [0.1, 3.6], [0, 4.2]], 8);
      flathe(B, F, S.gold, G, -5.6, 2, -0.4, [[1.1, 0], [1.0, 1.2], [0.55, 3.2], [0.15, 5.0], [0, 5.6]], 10); }],
  [/姬路城/, (B, S, F) => { const W = RGB('#f2f0ea'), Rf = RGB('#54606a'); fpyr(B, F, S.flood, RGB('#8f8a80'), 0, 0, 8, 7, -0.6, 2.6, 6.6, 5.6);
      for (let i = 0; i < 5; i++){ const w = 6.2 - i*0.95, d = 5.2 - i*0.8, y = 2.0 + i*1.55; fbox(B, F, S.flood, W, 0, 0, w, d, y, 1.2); fcnroof(B, F, S.plain, Rf, 0, 0, w, d, y + 1.2, 0.8, 0.6); } }],
  [/杰弗逊纪念堂/, (B, S, F) => { const W = RGB(WOTW.marble); fcyl(B, F, S.flood, W, 0, 0, 4.2, -0.4, 1.0, 16); for (let i = 0; i < 16; i++){ const a = i/16*TAU; fcyl(B, F, S.flood, W, Math.cos(a)*3.2, Math.sin(a)*3.2, 0.2, 0.6, 2.4, 6); }
      fcyl(B, F, S.flood, W, 0, 0, 3.5, 3.0, 0.6, 16); flathe(B, F, S.flood, W, 0, 0, 3.6, domeP(3.0, 0.8, 5), 16); }],
  [/林肯纪念堂/, (B, S, F) => { const W = RGB(WOTW.marble); fbox(B, F, S.flood, W, 0, 0, 13, 9, -0.4, 1.4); for (let i = 0; i < 12; i++) for (const s of [-1, 1]) fcyl(B, F, S.flood, W, -5.8 + i*10.6/11, s*3.6, 0.28, 1.0, 3.2, 8);
      fbox(B, F, S.flood, W, 0, 0, 11, 6.4, 1.0, 3.2); fbox(B, F, S.flood, W, 0, 0, 12.8, 8.4, 4.2, 1.0); fbox(B, F, S.flood, W, 0, 0, 10.6, 6.2, 5.2, 0.8); }],
  [/美国国会大厦/, (B, S, F) => { const W = RGB(WOTW.marble); fbox(B, F, S.flood, W, 0, 0, 16, 4, -0.4, 2.6); fbox(B, F, S.flood, W, 0, 0, 5, 6, -0.4, 3.0);
      fcyl(B, F, S.flood, W, 0, 0, 2.2, 3.0, 1.6, 16); fcyl(B, F, S.flood, W, 0, 0, 1.9, 4.6, 1.0, 16); flathe(B, F, S.flood, W, 0, 0, 5.6, [[1.9, 0], [1.85, 0.8], [1.4, 1.9], [0.7, 2.5], [0.35, 2.7], [0.35, 3.3], [0.1, 3.6], [0, 4.1]], 16); }],
  [/白宫/, (B, S, F) => { const W = RGB('#f6f5f1'); fbox(B, F, S.flood, W, 0, 0, 8.6, 4.4, -0.4, 2.4); fcyl(B, F, S.flood, W, 0, 2.4, 1.3, -0.4, 2.4, 12); fbox(B, F, S.plain, RGB('#c8c8c2'), 0, 0, 8.6, 4.4, 2.0, 0.4); }],
  [/总统山/, (B, S, F) => { const R = RGB('#9d968c'); flathe(B, F, S.flood, R, 0, -3, -0.5, [[0, 0], [11, 0], [9.5, 4], [7, 7.5], [4, 9.5], [0, 10.2]], 10, 1.0, 0.55); for (let i = 0; i < 4; i++) flathe(B, F, S.flood, RGB('#b2aca2'), -3.6 + i*2.4, 1.5, 4.2 + (i === 1 ? 0.6 : 0), [[0, 0], [0.9, 0.2], [1.0, 1.4], [0.7, 2.4], [0, 2.8]], 8, 1, 0.8); }],
  [/墨西哥凝神武士/, (B, S, F) => { const C = RGB('#a9a093'); fbox(B, F, S.flood, C, 0, 0, 7, 7, -0.4, 1.2); for (let i = 0; i < 4; i++) fcyl(B, F, S.flood, C, -2.4 + i*1.6, 0, 0.45, 0.8, 4.4, 8, 0.4); }],
  [/救世基督像/, (B, S, F) => { const W = RGB('#dcdad2'); flathe(B, F, S.flood, RGB('#7c7568'), 0, 0, -0.6, [[0, 0], [6, 0], [3.2, 3.0], [1.4, 4.6], [0, 5]], 9); fbox(B, F, S.flood, W, 0, 0, 1.0, 1.0, 4.6, 1.4);
      flathe(B, F, S.flood, W, 0, 0, 6.0, [[0.55, 0], [0.4, 2.6], [0.32, 3.4], [0.2, 3.9], [0, 4.0]], 8); fbox(B, F, S.flood, W, 0, 0, 5.6, 0.35, 8.7, 0.45); fbox(B, F, S.flood, W, 0, 0, 0.5, 0.5, 9.6, 0.7); }],
  [/复活节岛/, (B, S, F) => { const C = RGB('#6f6660'); fbox(B, F, S.flood, RGB('#8d877c'), 0, 0, 10, 2.4, -0.4, 0.9); for (let i = 0; i < 5; i++) fbox(B, F, S.flood, C, -4 + i*2, 0, 1.0, 0.9, 0.5, 2.6 + (i % 2)*0.4); }],
  [/曼哈顿/, (B, S, F, rng) => { for (let i = 0; i < 22; i++){ const u = (rng() - 0.5)*16, v = (rng() - 0.5)*7, h = 1.5 + rng()*rng()*9; fbox(B, F, S.wall, RGB(PICK(rng, ['#b8b2a4', '#9aa3ab', '#c9c2b2', '#8c939b'])), u, v, 1.2 + rng(), 1.2 + rng(), -0.4, h + 0.4); }
      fbox(B, F, S.flood, RGB('#cbc6ba'), 0, 0, 1.4, 1.4, -0.4, 10.4); fpyr(B, F, S.flood, RGB('#cbc6ba'), 0, 0, 0.9, 0.9, 10, 1.5, 0); }],
  [/自由女神像/, (B, S, F) => { const Gn = RGB('#7fb1a0'), St = RGB('#c9c0ae'); fpyr(B, F, S.flood, St, 0, 0, 5, 5, -0.5, 2.6, 3.4, 3.4); fbox(B, F, S.flood, St, 0, 0, 2.4, 2.4, 2.1, 2.8);
      flathe(B, F, S.flood, Gn, 0, 0, 4.9, [[0.9, 0], [0.75, 1.8], [0.55, 3.2], [0.35, 3.8], [0.3, 4.4], [0, 4.6]], 8); bar(B, S.flood, Gn, F(0.3, 8.3, 0), F(0.5, 10.4, 0.2), 0.2); fbox(B, F, S.gold, RGB(WOTW.gold), 0.5, 0.2, 0.32, 0.32, 10.4, 0.45); }],
  [/那斯卡/, (B, S, F) => { const C = RGB('#e6d6b8'); for (let i = 0; i < 9; i++) bar(B, S.plain, C, F(-7 + i*1.7, 0.08, -4), F(-6 + i*1.2, 0.08, 4), 0.25); }],
  [/四大洲喷泉|世界地图喷泉/, (B, S, F) => { fcyl(B, F, S.flood, RGB('#d7d0c0'), 0, 0, 7, -0.3, 0.7, 20); fcyl(B, F, S.water, RGB('#6faecb'), 0, 0, 6.4, 0.42, 0.1, 20); fcyl(B, F, S.flood, RGB('#d7d0c0'), 0, 0, 1.0, 0.4, 1.8, 10); fcyl(B, F, S.glow, [1, 1, 1], 0, 0, 0.5, 2.2, 1.2, 8, 0.05); }],
  [/埃及门/, (B, S, F) => { const C = RGB('#d6c28f'); for (const s of [-1, 1]) fpyr(B, F, S.flood, C, s*3.6, 0, 4.4, 2.6, -0.4, 8.4, 3.6, 2.0); fbox(B, F, S.flood, C, 0, 0, 3.0, 2.2, 5.4, 2.2); }],
  [/中华门/, (B, S, F) => { const R = RGB('#a8473a'); for (const s of [-1, 0.33, -0.33, 1]) fcyl(B, F, S.flood, R, s*4.4, 0, 0.32, 0, 6.2, 8); fbox(B, F, S.flood, R, 0, 0, 9.6, 0.7, 5.0, 0.8); fcnroof(B, F, S.plain, RGB('#3f6e5a'), 0, 0, 9.6, 1.6, 6.2, 1.4, 0.6); }],
];
Object.assign(SITES, {szwindow:{zh:'世界之窗', en:'Window of the World', lat:22.537418, lon:113.968028, r:681, keep:D.szwindow.keep, keepRoads:[11, 12], h:110,
  lt:{m:0, c:'#ffd9a6', k:0.75, e:0.6}, build(ctx){
  const g = new THREE.Group(), B = VB(), S = mkSpecs(), gy = ctx.gy, rng = ctx.rng, d = D.szwindow;
  const SPECIAL = {w264187661:1, w264194869:1, w1150884224:1, w1150884225:1, w1150884226:1, w1150884223:1, w1150884237:1, w264187657:1, w1150884236:1, w264350257:1, w245754224:1, r9653205:1};
  const busy = [];   // spots taken by special models (trees keep clear)
  // the Eiffel Tower: orientation from the four feet of its footprint
  const E = byId(d, 'w264187661'); if (E){ const c = pcent(E.r); let far = 0, fa = 0; for (const p of E.r){ const r = Math.hypot(p[0] - c[0], p[1] - c[1]); if (r > far){ far = r; fa = Math.atan2(p[1] - c[1], p[0] - c[0]); } }
    const [lo] = groundSpan(gy, E.r); fbox(B, Fr(c[0], c[1], fa - PI/4, lo), S.flood, RGB('#cfc8b6'), 0, 0, 46, 46, -1.2, 1.4); eiffel(B, S, c[0], c[1], fa - PI/4, lo + 0.2); busy.push([c[0], c[1], 32]);
    for (let i = 0; i < 4; i++){ const a = fa + i*HP; ctx.lamp(c[0] + Math.cos(a)*30, lo + 1.5, c[1] + Math.sin(a)*30, [255, 196, 120]); } }
  const L = byId(d, 'w264194869'); if (L){ louvre(B, S, L.r, gy); busy.push([...pcent(L.r), 16]); ctx.paint(inset(L.r, -9), [214, 208, 196]); }
  const GZ = [['w1150884224', 146/230], ['w1150884225', 143.5/215.25], ['w1150884226', 65/103.4]]; let gz = null;
  for (const [id, ratio] of GZ){ const b = byId(d, id); if (!b) continue; const r = pyramid(B, S, b.r, gy, ratio); busy.push([...pcent(b.r), 12]); if (id === 'w1150884225') gz = r; }
  const T = byId(d, 'w1150884223'); if (T){ taj(B, S, T.r, gy); busy.push([...pcent(T.r), 14]); }
  const C = byId(d, 'w1150884237'); if (C){ colosseum(B, S, C.r, gy); busy.push([...pcent(C.r), 12]); }
  const A = byId(d, 'w264187657'); if (A){ arc(B, S, A.r, gy); busy.push([...pcent(A.r), 14]); }
  const K = byId(d, 'w1150884236'); if (K){ katsura(B, S, K.r, gy); busy.push([...pcent(K.r), 25]); }
  const AL = byId(d, 'w264350257'); if (AL){ alps(B, S, AL.r, gy, rng); busy.push([...pcent(AL.r), 50]); }
  const CP = byId(d, 'w245754224'); if (CP){ colonnade(B, S, CP.r, gy, '#eadfca', 12, true); busy.push([...pcent(CP.r), 40]); }
  // World Square: the oval plaza with its ring of 108 columns (bendibao), the stage house kept as built
  const WS = byId(d, 'r9653205'); if (WS){ const F0 = obb(WS.r), [lo] = groundSpan(gy, WS.r); ctx.paint(WS.r, [222, 214, 198]); ctx.paint(inset(WS.r, 14), [204, 196, 180]);
    const n = 108, a = F0.L/2 - 3, bb = F0.W/2 - 3, F = Fr(F0.cx, F0.cz, F0.ang, lo);
    for (let i = 0; i < n; i++){ const t = i/n*TAU, u = Math.cos(t)*a, v = Math.sin(t)*bb; fcyl(B, F, S.flood, RGB(i % 3 ? WOTW.stone : '#d9cdb4'), u, v, 0.45, 0, 5.6 + (i % 4 === 0 ? 1.2 : 0), 8); fbox(B, F, S.flood, RGB('#cdbfa6'), u, v, 1.2, 1.2, 5.6 + (i % 4 === 0 ? 1.2 : 0), 0.5); }
    busy.push([F0.cx, F0.cz, Math.max(a, bb) + 4]); }
  // the other halls, shops and service buildings of the park, rebuilt on their footprints
  const ST = {spec:'flood', wall:['#efe6d6', '#e9dcc8', '#f1ece2', '#e4d7c2', '#ddd3c4'], roof:['#a75b3e', '#9a6a52', '#7c838a', '#8d5a44'], kind:'auto', hmax:16};
  for (const b of d.b){ if (SPECIAL[b.id]) continue; const ind = b.t === 'industrial' || b.t === 'shed'; genBld(B, S, gy, rng, b, ind ? {spec:'plain', wall:['#cfcfca', '#c4c6c2'], roof:['#8d9396'], kind:'flat', hmax:10} : ST); busy.push([...pcent(b.r), Math.sqrt(b.a)*0.7]); }
  // the miniatures on their OSM points
  const done = new Set();
  for (const [name, x, z] of d.poi){ for (const [re, fn] of WMINI){ if (!re.test(name) || done.has(name)) continue; done.add(name);
    const y = gy(x, z), F = Fr(x, z, faceTo(d.p, x, z), y); fn(B, S, F, rng); busy.push([x, z, 9]); ctx.lamp(x, y + 2.5, z + 3, [255, 214, 160]); break; } }
  // landscape: woods and lawns, palms by the entrance, lamps along the walks
  const avoid = (x, z) => nearAny(busy, x, z, 0) || busy.some(q => Math.hypot(q[0] - x, q[1] - z) < q[2]);
  scatter(ctx, d.wood, 55, 1700, ['d', 'd', 'raintree', 'palm'], 2.4, 4.6, avoid);
  scatter(ctx, d.grass, 260, 120, ['palm', 'd'], 2.2, 3.6, avoid);
  lampsAlong(ctx, d.p, 24, 4.2, [255, 210, 150], 700, avoid);
  B.flush(g); return g; }}});
