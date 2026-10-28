// ================= Jiaochangwei (较场尾), Dapeng Bay (site) =================
// The guesthouse village on the beach south of Dapeng Fortress: colourful low houses, the beach. Built on the village area
// (OSM w523210525, minus the fortress) and its 262 real footprints (heights: this build's estimates, 3-4 storeys, capped at 15 m),
// painted in a palette of pastel guesthouse colours, roof terraces with railings; the beach (OSM w523210518) as sand, palms
// on the beach front, lamps. Night: lit windows, warm terrace lamps.
Object.assign(SITES, {szjiaochangwei:{zh:'较场尾', en:'Jiaochangwei', lat:22.591558, lon:114.505544, r:720, keep:D.szjiaochangwei.keep, keepRoads:[11, 12], h:16,
  lt:{m:1, c:'#ffd9a8', k:0.65},
  build(ctx){
    const g = new THREE.Group(), B = mkB(), d = D.szjiaochangwei, gy = ctx.gy, rng = ctx.rng;
    const PAL = ['#f2efe6', '#a9d3df', '#f2c6c2', '#f5e2a0', '#bfe0c8', '#e9e3d6', '#9cc1e6', '#f0b98d', '#ffffff', '#d7c9ea'];
    ctx.paint(d.beach, [226, 212, 176]);
    for (const L of d.lanes){ ctx.line(L.p, 3.2, [178, 172, 160]); ribbonP(B.p('#b8b1a4'), L.p, 3.0, gy, 0.2, 3); }
    for (const b of d.b){
      const h = cl(b.h > 14 ? 13.5 : b.h, 6.5, 15), col = PAL[Math.floor(rng()*PAL.length)];
      const r = townBld(B, b.r, gy, {wall:{c:col, m:1, fh:3.1, cw:2.6}, roof:'#b9b5ad', trim:'#f7f5ef', shop:rng() < 0.5 ? {c:'#4f5a5e', glow:'#ffd8a0', gk:0.7} : null, band:null, h, par:true, sheds:true, rng});
      // terrace umbrellas / pergolas on some roofs
      if (Math.abs(sArea(b.r)) > 80 && rng() < 0.3){ const c = ctr(b.r); if (pip(b.r, c[0], c[1])){ segP(B.p('#6b5a48'), [c[0], r.yt, c[1]], [c[0], r.yt + 2.3, c[1]], 0.05, 4); LCone(g, 1.6, 0.6, c[0], r.yt + 2.1, c[1], ['#e8e2d2', '#3d7ea6', '#c85a3c'][Math.floor(rng()*3)], 8); ctx.lamp(c[0], r.yt + 1.2, c[1], [255, 205, 150]); } }
    }
    // palms along the beach front (the seaward edge of the village area)
    const V = d.village, B2 = d.beach;
    for (let i = 0; i < V.length; i++){ const a = V[i], b = V[(i+1) % V.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      for (let t = 6; t < L; t += 13){ const x = a[0] + (b[0] - a[0])*t/L, z = a[1] + (b[1] - a[1])*t/L; if (dPoly(B2, x, z) < 14 && !d.b.some(q => pip(offP(q.r, -2), x, z))) ctx.tree(x, z, 2.6 + rng(), 'palm'); } }
    B.flush(g);
    return g;
  }}});

// ================= Dameisha Beach (大梅沙海滨公园), Yantian (site) =================
// The public beach of Yantian, about 1.4 km of sand (eastchinatrip guide), the beach park (OSM w730043029) with its paths and
// palms, the seven colourful winged-figure sculptures on the east side (guide; OSM maps eight artwork points there, one of them
// "幸福·生存" by 米丘 - all eight placed), the two-level Wish Tower observation tower (OSM w995114198; ~24 m is an estimate).
// Figure size estimated (~9 m). Night: promenade lamps, the sculptures lit.
Object.assign(SITES, {szdameisha:{zh:'大梅沙海滨公园', en:'Dameisha Beach', lat:22.595178, lon:114.302903, r:680, keep:D.szdameisha.keep, keepRoads:[11, 12], h:26,
  lt:{m:0, c:'#ffe0b8', k:1.0, e:0.5},
  build(ctx){
    const g = new THREE.Group(), B = mkB(), d = D.szdameisha, gy = ctx.gy, rng = ctx.rng;
    ctx.paint(d.sand, [230, 216, 182]);
    for (const L of d.paths){ ctx.line(L.p, L.c === 11 ? 4 : 3, [196, 186, 168]); ribbonP(B.p('#c9bfae'), L.p, L.c === 11 ? 4 : 3, gy, 0.2, 3); }
    // palms through the park lawns, along the paths
    { const nearP = lineMask(d.paths.map(L => L.p), 3); treesIn(ctx, d.park, 260, 2.4, 3.6, ['palm', 'palm', 'raintree'], (x, z) => nearP(x, z) || pip(d.sand, x, z)); }
    for (const L of d.paths) if (L.c === 12) lampsAlong(ctx, L.p, 22, 4, [255, 222, 180], 2.2);
    // the winged figures: colourful standing figures with raised wings on low plinths
    const COLS = ['#d8402e', '#f0b62c', '#2f78c4', '#3aa56a', '#e2732e', '#8a4fc0', '#e05a8a', '#2fb0b8'];
    d.sculpt.forEach(([x, z], i) => { const y = gy(x, z), col = {c:COLS[i % COLS.length], lc:'#fff0d8', lk:1.4}, s = 1.0, ry = rng()*TAU;
      boxP(B.p('#c8c2b4'), 2.2, 0.8, 2.2, x, y - 0.2, z, ry);
      const yb = y + 0.6, c = Math.cos(ry), sn = Math.sin(ry), R = (u, v, w) => [x + u*c + w*sn, v, z - u*sn + w*c];
      for (const sx of [-0.35, 0.35]) segP(B.p(col), R(sx, yb, 0), R(sx*0.8, yb + 3.6*s, 0), 0.32, 6);
      latheP(B.p(col), [[0.6, yb + 3.4], [0.85, yb + 4.4], [0.8, yb + 5.6], [0.55, yb + 6.3], [0.2, yb + 6.5]], R(0, 0, 0)[0], R(0, 0, 0)[2], 8);
      LSph(g, 0.5, R(0, 0, 0)[0], yb + 7.0, R(0, 0, 0)[2], col, 1.1, 8);
      for (const sx of [-1, 1]){ const W = [[0, 0], [1.2, 0.8], [2.8, 2.6], [3.4, 4.2], [2.2, 3.4], [1.0, 2.0]].map(([u, v]) => [sx*(0.5 + u), v]);
        for (let k = 1; k < W.length - 1; k++) triP(B.p(Object.assign({ds:true}, col)), R(W[0][0], yb + 5.2 + W[0][1], -0.25), R(W[k][0], yb + 5.2 + W[k][1], -0.25 - 0.15*k), R(W[k+1][0], yb + 5.2 + W[k+1][1], -0.25 - 0.15*(k + 1))); }
      ctx.lamp(x + 2, y + 1, z + 2, [255, 230, 200]);
    });
    // the Wish Tower: a round observation tower, two levels at the top
    { const P = d.wish, [x, z] = ctr(P), y = gy(x, z), r = Math.max(2.4, Math.sqrt(Math.abs(sArea(P))/PI));
      latheP(B.p({c:'#e8e6df', lc:'#e6f0ff', lk:1.2}), [[r + 0.6, y - 1], [r, y + 0.5], [r*0.8, y + 18]], x, z, 16);
      latheP(B.p({c:'#5d7c8c', glow:'#cfe6ff', gk:0.6}), [[r*0.8 + 1.6, y + 18], [r*0.8 + 2.2, y + 21.5], [r*0.8 + 1.8, y + 22]], x, z, 16);
      latheP(B.p('#e8e6df'), [[r*0.8 + 2.4, y + 22], [r*0.8 + 2.4, y + 22.6], [0.4, y + 23.6], [0.1, y + 24.5]], x, z, 16);
      LSph(g, 0.3, x, y + 24.6, z, AVI, 1, 6);
    }
    B.flush(g);
    return g;
  }}});

// ================= OCT East, Interlaken Town (东部华侨城茵特拉根小镇) (site) =================
// The Swiss-style mountain resort town above Dameisha: built on the town area (OSM r9079150), its lake (natural=water, drawn by
// the app) and its three mapped buildings: the castle hotel (茵特拉根城堡酒店), the large Interlaken hotel (茵特拉根华侨城酒店)
// and a lakeside pavilion; architecture only (Alpine steep roofs, half-timber gables, dormers; the castle hotel slate-grey), no signage.
// Storey heights are estimates. Night: lit windows, lamps round the lake.
Object.assign(SITES, {szocteast:{zh:'东部华侨城茵特拉根小镇', en:'OCT East (Interlaken Town)', lat:22.634551, lon:114.269203, r:300, keep:D.szocteast.keep, keepRoads:[11, 12], h:34,
  lt:{m:1, c:'#ffdcae', k:0.7},
  build(ctx){
    const g = new THREE.Group(), B = mkB(), d = D.szocteast, gy = ctx.gy, rng = ctx.rng;
    const WALL = {c:'#efe6d2', m:1, fh:3.3, cw:2.8}, TIMB = '#6a4630', ROOF = '#8a3e2e', ROOF2 = '#5d5f62', STONE = '#a9a194';
    for (const L of d.paths){ ctx.line(L.p, 3.4, [190, 182, 168]); ribbonP(B.p('#bdb4a4'), L.p, 3.2, gy, 0.2, 3); }
    const alpine = (P, w, rh, col) => { const [lo, hi] = groundSpan(gy, P), O0 = obb(P);
      // long wings: cut across into house-sized pieces (a row of chalets of varied height), then into strips if still irregular
      let parts = [P];
      if (O0.a > 30){ parts = []; const n = Math.ceil(2*O0.a/24), uc = O0.cx*Math.cos(O0.ang) + O0.cz*Math.sin(O0.ang); for (let i = 0; i < n; i++){ const Q = clipStrip(P, O0.ang + HP, -(uc - O0.a + 2*O0.a*(i + 1)/n), -(uc - O0.a + 2*O0.a*i/n)); if (Q.length >= 3 && Math.abs(sArea(Q)) > 20) parts.push(Q); } }
      parts = parts.flatMap(Q => { const O = obb(Q); return (O.fill < 0.72 || O.b > 13) && Math.abs(sArea(Q)) > 60 ? strips(Q, 20) : [Q]; });
      for (const Q of parts){ const O = obb(Q), yw = hi + w*(parts.length > 2 ? 0.75 + rng()*0.5 : 1); wallP(B.p(STONE), Q, lo - 1.5, hi + 1.2); wallP(B.p(WALL), Q, hi + 1.2, yw);
        const ov = 1.2, rr = Math.min(rh, O.b*1.1);
        roofP(B.p(col), O.cx, O.cz, O.a + ov, O.b + ov, O.a + ov, 0, yw, rr, {ry:-O.ang, pw:1.0, nt:2, n:2});
        const c = Math.cos(O.ang), s = Math.sin(O.ang);
        for (const sx of [-1, 1]){ const X = v => [O.cx + c*sx*O.a - s*v, O.cz + s*sx*O.a + c*v], p0 = X(-O.b), p1 = X(O.b), p2 = X(0), ht = yw + rr*O.b/(O.b + ov);
          triP(B.p(WALL), [p0[0], yw, p0[1]], [p1[0], yw, p1[1]], [p2[0], ht, p2[1]]);
          // half-timbering on the gable: posts and a cross beam
          for (const v of [-O.b*0.5, 0, O.b*0.5]){ const q = X(v), qy = yw + (ht - yw)*(1 - Math.abs(v)/O.b); segP(B.p(TIMB), [q[0] + c*sx*0.08, yw - 3, q[1] + s*sx*0.08], [q[0] + c*sx*0.08, qy - 0.2, q[1] + s*sx*0.08], 0.12, 4); }
          segP(B.p(TIMB), [p0[0] + c*sx*0.1, yw + 0.2, p0[1] + s*sx*0.1], [p1[0] + c*sx*0.1, yw + 0.2, p1[1] + s*sx*0.1], 0.12, 4); }
        // dormers along the long sides
        for (let u = -O.a + 4; u < O.a - 3; u += 11){ for (const sv of [-1, 1]){ const x = O.cx + c*u - s*sv*O.b*0.55, z = O.cz + s*u + c*sv*O.b*0.55; boxP(B.p(WALL), 1.8, 1.8, 1.8, x, yw + rr*0.25, z, -O.ang); roofP(B.p(col), x, z, 1.3, 1.3, 1.3, 0, yw + rr*0.25 + 1.8, 1.1, {ry:-O.ang + HP, pw:1, nt:1, n:1}); } }
      }
      return [lo, hi]; };
    for (const b of d.b){ const nm = b.nm || '';
      if (/城堡/.test(nm)) alpine(b.r, 13, 9, ROOF2);
      else if (Math.abs(sArea(b.r)) > 3000) alpine(b.r, 12, 8, ROOF);
      else alpine(b.r, 6.5, 4.5, ROOF);
    }
    // lake promenade lamps and conifers round the lake
    lampsAlong(ctx, d.lake.concat([d.lake[0]]), 16, 3.6, [255, 214, 160], -4);
    { const Lk = d.lake; for (let i = 0; i < Lk.length; i += 3){ const a = Lk[i], b = Lk[(i+1) % Lk.length], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1;
      for (const sg of [-1, 1]){ const x = a[0] + sg*dz/l*9, z = a[1] - sg*dx/l*9;
        if (!pip(Lk, x, z) && pip(d.town, x, z) && !d.b.some(q => pip(offP(q.r, -3), x, z))) ctx.tree(x, z, 2.4 + rng(), rng() < 0.6 ? 'pine' : 'd'); } } }
    B.flush(g);
    return g;
  }}});
