
// ---------- shared site helpers: generic blocks on real footprints, standing on ctx.gy ----------
// lowest / highest ground under a ring
const gyR = (gy, P) => { let lo = 1e9, hi = -1e9; for (const p of P){ const y = gy(p[0], p[1]); lo = Math.min(lo, y); hi = Math.max(hi, y); } return [lo, hi]; };
// a block: walls from below the lowest corner to (highest corner + h), storey window bands (lit at night), roof + plant box
function block(B, S, P, gy, h, fh, b0){
  const [lo, hi] = gyR(gy, P), y0 = b0 ? hi + b0 : lo - 2, y1 = hi + h;
  if (y1 - y0 < 0.5) return;
  prism(B, S.wall, P, y0, y1, S.roof);
  const O = off(P, 0.12);
  for (let y = Math.max(y0, lo) + fh*0.5; y < y1 - 1.2; y += fh) for (let i = 0; i < O.length; i++){ const a = O[i], e = O[(i + 1) % O.length]; if (Math.hypot(e[0] - a[0], e[1] - a[1]) < 2.5) continue;
    B.q(S.band, [a[0], y, a[1]], [e[0], y, e[1]], [e[0], y + fh*0.42, e[1]], [a[0], y + fh*0.42, a[1]]); }
  const A = Math.abs(area2(P));
  if (A > 500 && h > 10){ const I = off(P, -Math.min(6, Math.sqrt(A)*0.2)); if (Math.abs(area2(I)) > 40) prism(B, S.plant, I, y1, y1 + 2.6, S.plant); }
}
const distSeg = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx*dx + dz*dz || 1, t = clamp(((x - a[0])*dx + (z - a[1])*dz)/L2, 0, 1); return Math.hypot(x - a[0] - dx*t, z - a[1] - dz*t); };
// a grid index of road segments for "is (x, z) within w of a road" tests
function roadIdx(rd){ const G = new Map(), C = 40, key = (i, j) => i*100003 + j;
  for (const [cls, A] of rd){ const P = dec(A, 1); for (let i = 0; i < P.length - 1; i++){ const a = P[i], b = P[i + 1], hw = cls <= 6 ? 14 : cls <= 10 ? 8 : 4;
    const i0 = Math.floor((Math.min(a[0], b[0]) - hw)/C), i1 = Math.floor((Math.max(a[0], b[0]) + hw)/C), j0 = Math.floor((Math.min(a[1], b[1]) - hw)/C), j1 = Math.floor((Math.max(a[1], b[1]) + hw)/C);
    for (let ii = i0; ii <= i1; ii++) for (let jj = j0; jj <= j1; jj++){ const k = key(ii, jj); if (!G.has(k)) G.set(k, []); G.get(k).push([a, b, hw]); } } }
  return (x, z, m) => { const L = G.get(key(Math.floor(x/C), Math.floor(z/C))); if (!L) return false; for (const [a, b, hw] of L) if (distSeg(x, z, a, b) < hw + (m || 0)) return true; return false; }; }
// a lamp post (pole + lantern) into the batch, and its night light
function post(B, S, ctx, x, z, h, rgb){ const y = ctx.gy(x, z); box(B, S.pole, x - 0.09, x + 0.09, y - 0.3, y + h, z - 0.09, z + 0.09); box(B, S.lant, x - 0.25, x + 0.25, y + h, y + h + 0.45, z - 0.25, z + 0.25); ctx.lamp(x, y + h + 0.3, z, rgb); }
const PAINT = {grass:[124, 160, 92], wood:[86, 120, 70], plaza:[208, 200, 184], park:[150, 150, 148], pitch:[96, 150, 84], track:[176, 92, 70], shingle:[196, 186, 160], play:[190, 120, 96], water:[143, 181, 202]};

// ================= Shenzhen Talent Park (深圳人才公园, opened 1 Nov 2017; AUBE) — site =================
// OSM r18459537 (the park, 0.78 km2 round the Houhai inner lake r10175109). Park about 770 000 m2 with ~300 000-330 000 m2 of
// water; a 2.7 km lakeside running loop; the 222 m bridge; total built area only 4 939 m2 (ArchDaily / AUBE, Shenzhen
// government). The Talent Starlight Bridge carries 30 pillars lit blue at night; the pi Bridge spans ~171 m, its railing lights
// running in sequence after dark (travelofchina; the digits themselves are left out: no text). Here: the real lawns, woods,
// beaches and plazas painted from OSM, trees in the woods and along the lawns, lamp posts round the lake and on the paths, the
// two bridges as structures under the app's path decks (OSM paths at +6.6 m, kept), and the park's small pavilions rebuilt on
// their OSM footprints (Qiuxian Pavilion's glass reading room, the halls, kiosks). The pillar height (5 m) is an estimate.
// The lake water, the real paths (keepRoads) and the Houhai bridges stay the app's. No sculptures of people, no signage.
Object.assign(SITES, {sztalentpark:{zh:'深圳人才公园', en:'Shenzhen Talent Park', lat:22.513104, lon:113.94378, r:760, keep:dec(D.tp.keep), keepRoads:[11, 12], h:16,
  lt:{m:0, c:'#ffe4bc', k:0.55},
  build(ctx){
    const g = new THREE.Group(), B = Bt(), gy = ctx.gy, rng = ctx.rng, T = D.tp, keep = dec(T.keep);
    const S = {wall:{c:'#e7e3da', m:0, lk:0.45, lc:'#ffe2bf'}, band:{c:'#4b585f', m:1, fh:3.6, cw:2.6, lc:'#ffe2bf'}, roof:{c:'#a8a6a0'}, plant:{c:'#b3b0aa'},
      pole:{c:'#5a5f62'}, lant:{c:'#f2efe6', glow:'#ffe2b0', gk:1.2}, glass:{c:'#7d939f', m:1, fh:4, cw:2.2, lc:'#ffe2bf'}, white:{c:'#eeeeea', m:0, lk:0.6}};
    const DECK = {c:'#c9c6bf', m:0, lk:0.35}, GIR = {c:'#b6b8b6', m:0, lk:0.45, lc:'#cfe0ff'}, PIER = {c:'#a9a8a2'}, RAIL = {c:'#d8dcdc', m:0, lk:0.5},
      PIL = {c:'#d7e4ef', m:0, lk:0.6, lc:'#7fb0ff', glow:'#2f6dff', gk:1.35}, LINE = {c:'#e8f1ff', glow:'#bfe0ff', gk:1.1};
    // ground: the OSM lawns, woods, beaches, plazas and car parks
    for (const [k, A] of T.a) if (PAINT[k] && k !== 'water') ctx.paint(dec(A), PAINT[k]);
    const near = roadIdx(T.rd);
    // trees: dense in the woods, scattered on the lawns, never on paths or in the lake
    let nt = 0; const lake = dec(T.lake, 1);
    for (const [k, A] of T.a){ if (k !== 'wood' && k !== 'grass') continue; const P = dec(A), ar = Math.abs(area2(P)), n = Math.min(160, Math.round(ar/(k === 'wood' ? 70 : 520)));
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of P){ x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
      for (let t = 0, m = 0; t < n*6 && m < n && nt < 1500; t++){ const x = x0 + rng()*(x1 - x0), z = z0 + rng()*(z1 - z0); if (!pip(P, x, z) || pip(lake, x, z) || near(x, z, 1.5)) continue;
        ctx.tree(x, z, k === 'wood' ? 2.4 + rng()*1.8 : 2.8 + rng()*1.6, rng() < 0.3 ? 'palm' : rng() < 0.5 ? 'raintree' : 'd'); m++; nt++; } }
    // the lakeside promenade: lamp posts every ~24 m on the shore inside the park (the 2.7 km loop)
    const sh = off(lake, 3.5); let acc = 0;
    for (let i = 0; i < sh.length; i++){ const a = sh[i], b = sh[(i + 1) % sh.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      for (let s = (24 - acc) % 24; s < L; s += 24){ const x = lerp(a[0], b[0], s/L), z = lerp(a[1], b[1], s/L); if (pip(keep, x, z) && !pip(lake, x, z)) post(B, S, ctx, x, z, 4.2, [1, 0.86, 0.62]); }
      acc = (acc + L) % 24; }
    // lamps along the park paths, every ~50 m
    for (const A of T.paths){ const P = dec(A, 1); let c = 0; for (let i = 0; i < P.length - 1; i++){ const a = P[i], b = P[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), Nn = [-(b[1] - a[1])/L, (b[0] - a[0])/L];
      for (let s = 25 - c; s < L; s += 50){ const x = lerp(a[0], b[0], s/L) + Nn[0]*2.2, z = lerp(a[1], b[1], s/L) + Nn[1]*2.2; if (pip(keep, x, z) && !pip(lake, x, z)) post(B, S, ctx, x, z, 3.6, [1, 0.84, 0.6]); }
      c = (c + L) % 50; } }
    // ---- the Talent Starlight Bridge (OSM area w736632011, 222 m): deck girders under the app's path, piers, rails, 30 blue pillars ----
    const SP = dec(T.star), sa = [(SP[0][0] + SP[1][0])/2, (SP[0][1] + SP[1][1])/2], sb = [(SP[6][0] + SP[7][0])/2, (SP[6][1] + SP[7][1])/2];
    const bridge = (a, b, W, pillars, lineLit) => {
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0])/L, uz = (b[1] - a[1])/L, vx = -uz, vz = ux, n = Math.max(2, Math.round(L/6));
      const wat = s => { const x = a[0] + ux*s, z = a[1] + uz*s; return Math.max(0, gy(x, z)); };
      for (let i = 0; i < n; i++){ const s0 = i/n*L, s1 = (i + 1)/n*L, yd = Math.max(wat(s0), wat(s1)) + 6.45;
        const c = [a[0] + ux*(s0 + s1)/2, a[1] + uz*(s0 + s1)/2];
        obox(B, DECK, c[0], c[1], ux, uz, s1 - s0 + 0.05, W, yd - 0.35, yd);
        obox(B, GIR, c[0], c[1], ux, uz, s1 - s0 + 0.05, W - 2.5, yd - 1.6, yd - 0.35);
        for (const sd of [-1, 1]){ const ex = c[0] + vx*sd*(W/2 - 0.15), ez = c[1] + vz*sd*(W/2 - 0.15);
          obox(B, RAIL, ex, ez, ux, uz, s1 - s0 + 0.05, 0.12, yd + 1.0, yd + 1.12);
          if (lineLit) obox(B, LINE, ex - vx*sd*0.1, ez - vz*sd*0.1, ux, uz, s1 - s0 - 0.6, 0.08, yd + 0.85, yd + 0.95);
          obox(B, RAIL, ex, ez, ux, uz, 0.12, 0.12, yd, yd + 1.1); } }
      for (let s = 12; s < L - 6; s += 24){ const x = a[0] + ux*s, z = a[1] + uz*s, y0 = Math.min(gy(x, z), 0) - 2, yd = wat(s) + 6.45;
        for (const sd of [-1, 1]) obox(B, PIER, x + vx*sd*(W/2 - 2.2), z + vz*sd*(W/2 - 2.2), ux, uz, 1.4, 1.4, y0, yd - 1.6); }
      if (pillars) for (let i = 0; i < pillars; i++){ const s = (i + 0.5)/pillars*L, sd = i % 2 ? 1 : -1, x = a[0] + ux*s + vx*sd*(W/2 - 0.8), z = a[1] + uz*s + vz*sd*(W/2 - 0.8), yd = wat(s) + 6.45;
        obox(B, PIL, x, z, ux, uz, 0.7, 0.7, yd, yd + 5); }
      for (const [p, s] of [[a, -1], [b, 1]]){ const x = p[0], z = p[1], yg = gy(x, z); obox(B, PIER, x - ux*s*1.5, z - uz*s*1.5, ux, uz, 4, W, Math.min(yg, 0) - 1, Math.max(yg, 0) + 6.1); }
    };
    bridge(sa, sb, 11, 30, false);
    // ---- the pi Bridge (the OSM path "Pie Bridge", ~171 m): a slender deck with a running light line in each railing ----
    for (const A of T.pie){ const P = dec(A); for (let i = 0; i < P.length - 1; i++) bridge(P[i], P[i + 1], 5, 0, true); }
    // ---- the park's pavilions on their OSM footprints ----
    for (const b of T.b){ const P = dec(b.r); if (P.length < 3) continue; const h = Math.min(b.h || 6, 15);
      if (b.n === '求贤阁'){ const [lo, hi] = gyR(gy, P); prism(B, S.glass, P, lo - 1, hi + h - 1.2, false); prism(B, S.white, off(P, 1.2), hi + h - 1.2, hi + h, S.white, S.white); continue; }
      block(B, S, P, gy, h, 3.6); }
    B.flush(g);
    return g;
  }}});

// ================= Shenzhen University, Yuehai campus (深圳大学粤海校区) — site =================
// OSM r13900447 (1.11 km2 in Nanshan, west of the Houhai towers, Hanking Center outside its north edge). Every campus building
// whose OSM centroid lies inside the campus is rebuilt on its real footprint (and OSM parts: the Science and Technology Building
// 科技楼's 53.3 m block and 71.9 m tower on its two-storey base), standing on the real ground: walls in the campus's light tiles,
// dark window bands per storey (lit at night), roofs with plant rooms; heights from OSM levels / heights where mapped, otherwise
// the base map's estimate (most are estimates). The OSM sports pitches, the running track, the lawns, woods and plazas are painted;
// trees in the woods and the open ground away from the roads; the real campus roads and paths stay (keepRoads); lamps along the
// roads. Labels only for the larger named buildings. No signage.
Object.assign(SITES, {szszu:{zh:'深圳大学（粤海校区）', en:'Shenzhen University (Yuehai Campus)', lat:22.53634, lon:113.931418, r:1060, keep:dec(D.su.keep), keepRoads:[11, 12], h:75,
  lt:{m:1, c:'#ffe4c4', k:0.45},
  build(ctx){
    const g = new THREE.Group(), B = Bt(), gy = ctx.gy, rng = ctx.rng, T = D.su, keep = dec(T.keep);
    const W = [{c:'#e4e1d9', m:0, lk:0.12, lc:'#ffe4c4'}, {c:'#d6d6d0', m:0, lk:0.12, lc:'#ffe4c4'}, {c:'#cbcfd1', m:0, lk:0.12, lc:'#ffe4c4'}, {c:'#ddd5c6', m:0, lk:0.12, lc:'#ffe4c4'}];
    const band = {c:'#3e4a52', m:1, fh:3.6, cw:2.6, lc:'#ffe4c4', lk:0.1}, roof = {c:'#9b9a95'}, plant = {c:'#aaa8a2'}, S0 = {pole:{c:'#5a5f62'}, lant:{c:'#f2efe6', glow:'#ffe2b0', gk:1.2}};
    for (const [k, A] of T.a) if (PAINT[k] && k !== 'water') ctx.paint(dec(A), PAINT[k]);
    const labs = [], bx = [];
    for (const b of T.b){ const P = dec(b.r); if (P.length < 3) continue;
      const S = {wall:W[Math.abs(parseInt(b.o.slice(1))*7) % W.length], band, roof, plant}, c = cen(P);
      const h = b.f ? b.f*3.4 + 1.2 : Math.min(b.h || 12, 60);
      if (b.p && b.p.length){ block(B, S, P, gy, Math.max(4, Math.min(h, 10)), 3.6); for (const [b0, t1, A] of b.p) block(B, S, dec(A), gy, t1, 3.8); }
      else block(B, S, P, gy, h, 3.6);
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of P){ x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); } bx.push([x0, z0, x1, z1]);
      if (b.n && Math.abs(area2(P)) > 3000) labs.push({x:c[0], z:c[1], y:gy(c[0], c[1]) + h + 6, zh:b.n, en:b.n}); }
    const near = roadIdx(T.rd);
    const inB = (x, z) => { for (const b of bx) if (x > b[0] - 4 && x < b[2] + 4 && z > b[1] - 4 && z < b[3] + 4) return true; return false; };
    const bad = (x, z) => inB(x, z) || near(x, z, 2) || T.a.some(([k, A]) => (k === 'pitch' || k === 'track' || k === 'water' || k === 'park' || k === 'plaza') && pip(dec(A), x, z));
    // trees: the woods densely, then the open campus ground
    let nt = 0;
    for (const [k, A] of T.a){ if (k !== 'wood') continue; const P = dec(A), n = Math.min(200, Math.round(Math.abs(area2(P))/80));
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of P){ x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
      for (let t = 0, m = 0; t < n*5 && m < n; t++){ const x = x0 + rng()*(x1 - x0), z = z0 + rng()*(z1 - z0); if (!pip(P, x, z) || inB(x, z) || near(x, z, 1)) continue; ctx.tree(x, z, 2.4 + rng()*2, rng() < 0.4 ? 'raintree' : 'd'); m++; nt++; } }
    for (let t = 0; t < 9000 && nt < 1700; t++){ const x = -680 + rng()*1410, z = -660 + rng()*1420; if (!pip(keep, x, z) || bad(x, z)) continue; ctx.tree(x, z, 2.2 + rng()*2.2, rng() < 0.3 ? 'raintree' : rng() < 0.2 ? 'palm' : 'd'); nt++; }
    // lamps along the campus roads (classes up to 11), every ~40 m
    for (const [cls, A] of T.rd){ if (cls > 11) continue; const P = dec(A, 1); let c = 0;
      for (let i = 0; i < P.length - 1; i++){ const a = P[i], b = P[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.5) continue; const Nn = [-(b[1] - a[1])/L, (b[0] - a[0])/L];
        for (let s = 20 - c; s < L; s += 40){ const x = lerp(a[0], b[0], s/L) + Nn[0]*5, z = lerp(a[1], b[1], s/L) + Nn[1]*5; if (pip(keep, x, z) && !inB(x, z)) post(B, S0, ctx, x, z, 6, [1, 0.85, 0.62]); }
        c = (c + L) % 40; } }
    B.flush(g);
    if (labs.length) g.userData.labels = labs;
    return g;
  }}});
