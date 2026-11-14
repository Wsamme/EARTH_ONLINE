// ================= Dapeng Fortress (大鹏所城), 1394 (site) =================
// Ming coastal garrison town against pirates (Wikipedia), Qing naval camp; ~100 000-110 000 m2 (People's Daily 2024-03-18,
// bendibao); grey walls and dark tiles, blue-stone lanes (黛瓦灰墙, 青石板), the south gate with its gate tower, more than ten Qing
// generals' mansions (Lai Enjue's the largest), the Tianhou, Zhaogong, Huaguang temples. Built on: the walled outline (OSM
// w404249608) as the city wall, the four mapped gates (北门 / 东门 / 南门 / 西门), the 79 footprints inside (the mansions, temples,
// museum and houses as mapped) and the mapped lanes; the parts of the town OSM does not map are left as open ground and trees.
// Wall height (6 m) and house heights are estimates. Night: warm floodlit walls and gate, lanterns, lamps along the lanes.
Object.assign(SITES, {szdapeng:{zh:'大鹏所城', en:'Dapeng Fortress', lat:22.598037, lon:114.507793, r:252, keep:D.szdapeng.keep, keepRoads:[11, 12], h:16,
  lt:{m:0, c:'#ffcf98', k:1.0, e:0.6, anim:'breathe'},
  build(ctx){
    const g = new THREE.Group(), B = mkB(), d = D.szdapeng, gy = ctx.gy, rng = ctx.rng;
    const STONE = {c:'#8f8b82', lc:'#ffd6a4', lk:1.1}, STONE2 = {c:'#7c786f', lc:'#ffd6a4', lk:1.0}, BRICK = {c:'#8c8880', m:1, fh:3.6, cw:3.2}, TILE = '#4a4c4b', RIDGE = '#3a3c3b',
      WHITE = '#d8d4ca', RED = '#8e3428', TEMPLE = {c:'#b8a990', lc:'#ffd6a4', lk:1.0}, GATEDK = '#262421', WOOD = '#5d3a26', LANT = {c:'#d8382a', glow:'#ff5a2a', gk:2.2}, GREEN = '#476a50';
    const W = d.wall, WH = 6.0;
    // ---- lanes paved in blue stone, the ground inside dusty paving / gardens
    ctx.paint(offP(W, 3), [168, 160, 146]);
    for (const L of d.lanes){ ctx.line(L.p, L.c === 12 ? 2.4 : 3.6, [126, 130, 132]); ribbonP(B.p('#7f8486'), L.p, L.c === 12 ? 2.2 : 3.4, gy, 0.2, 3); }
    // ---- the city wall: rammed core faced with stone, crenellated parapet, walkway; gaps where the gates stand
    const gateO = {}; for (const nm in d.gates) gateO[nm] = obb(d.gates[nm]);
    const inGate = (x, z) => Object.values(gateO).some(O => { const c = Math.cos(O.ang), s = Math.sin(O.ang), u = (x - O.cx)*c + (z - O.cz)*s, v = -(x - O.cx)*s + (z - O.cz)*c; return Math.abs(u) < O.a + 0.5 && Math.abs(v) < O.b + 4; });
    for (const e of edgesF(W)){ const n = Math.max(1, Math.round(e.L/4));
      for (let k = 0; k < n; k++){ const u0 = e.L*k/n, u1 = e.L*(k + 1)/n, p0 = e.F(u0, 0, 0), p1 = e.F(u1, 0, 0), m = e.F((u0 + u1)/2, 0, 0); if (inGate(m[0], m[2])) continue;
        const y0 = Math.min(gy(p0[0], p0[2]), gy(p1[0], p1[2])) - 1.5, yt = Math.max(gy(p0[0], p0[2]), gy(p1[0], p1[2])) + WH;
        // wall body 5 m thick outwards from the outline (battered outer face)
        const o0 = e.F(u0, 0, 5), o1 = e.F(u1, 0, 5), i0 = e.F(u0, 0, 0), i1 = e.F(u1, 0, 0), ot0 = e.F(u0, 0, 4.4), ot1 = e.F(u1, 0, 4.4);
        quadP(B.p(STONE), [o0[0], y0, o0[2]], [o1[0], y0, o1[2]], [ot1[0], yt, ot1[2]], [ot0[0], yt, ot0[2]]);
        quadP(B.p(STONE2), [i1[0], y0, i1[2]], [i0[0], y0, i0[2]], [i0[0], yt, i0[2]], [i1[0], yt, i1[2]]);
        quadP(B.p(STONE2), [i0[0], yt, i0[2]], [ot0[0], yt, ot0[2]], [ot1[0], yt, ot1[2]], [i1[0], yt, i1[2]]);
        // merlons on the outer edge
        for (let u = u0 + 0.8; u < u1 - 0.4; u += 2.0){ const p = e.F(u, 0, 4.1); boxP(B.p(STONE), 1.1, 1.3, 0.6, p[0], yt, p[2], -e.ang); }
        boxP(B.p(STONE), u1 - u0, 0.9, 0.4, (i0[0] + i1[0])/2 + e.nx*0.2, yt, (i0[2] + i1[2])/2 + e.nz*0.2, -e.ang);
      } }
    // ---- the four gates: masonry gate blocks with the arched passage; the south gate carries its two-storey gate tower
    for (const nm in d.gates){ const P = d.gates[nm], O = gateO[nm], [lo, hi] = groundSpan(gy, P), yt = hi + WH + 1.2;
      const R = rectR(O.cx, O.cz, O.a, O.b + 0.8, O.ang); wallP(B.p(STONE), R, lo - 1.5, yt); capP(B.p(STONE2), R, yt);
      for (const e of edgesF(R)){ if (e.L < O.a*1.5) continue; shapeP(B.p(GATEDK), mv(rArchO(1.9, 4.6, 8), e.L/2, hi), e.F, 0.05);
        for (let u = 0.8; u < e.L - 0.4; u += 2.0){ const p = e.F(u, 0, -0.3); boxP(B.p(STONE), 1.1, 1.2, 0.6, p[0], yt, p[2], -e.ang); } }
      if (nm === '南门'){ const a = Math.min(O.a - 1.2, 7), b = Math.min(O.b, 4.5), Rt = rectR(O.cx, O.cz, a, b, O.ang);
        wallP(B.p(RED), Rt, yt, yt + 3.6); capP(B.p(WOOD), Rt, yt + 3.6);
        for (const e of edgesF(Rt)){ const n = Math.max(2, Math.round(e.L/1.8)); for (let k = 0; k <= n; k++){ const p = e.F(e.L*k/n, 0, 0.6); segP(B.p(WOOD), [p[0], yt, p[2]], [p[0], yt + 3.6, p[2]], 0.16, 6); } }
        const y2 = roofP(B.p(TILE), O.cx, O.cz, a + 1.6, b + 1.6, a - 0.2, b - 0.2, yt + 3.4, 1.0, {ry:-O.ang, lift:0.5, nt:3, pw:1.3});
        wallP(B.p(RED), rectR(O.cx, O.cz, a - 0.8, b - 0.8, O.ang), y2 - 0.2, y2 + 2.4);
        roofP(B.p(TILE), O.cx, O.cz, a + 0.8, b + 0.8, a*0.5, 0, y2 + 2.4, 2.6, {ry:-O.ang, gab:0.4, gcol:B.p(WHITE), lift:0.7, hips:B.p(RIDGE), ridge:B.p(RIDGE), nt:5, pw:1.5});
        for (const sx of [-1, 1]){ const c = Math.cos(O.ang), s = Math.sin(O.ang); latheP(B.p(LANT), [[0.05, yt + 2.2], [0.35, yt + 2.35], [0.4, yt + 2.75], [0.35, yt + 3.1], [0.05, yt + 3.2]], O.cx + c*sx*(a + 0.9) - s*(b + 0.9), O.cz + s*sx*(a + 0.9) + c*(b + 0.9), 8); }
      }
      for (const sx of [-1, 1]){ const c = Math.cos(O.ang), s = Math.sin(O.ang); ctx.lamp(O.cx + c*sx*(O.a + 1) - s*(O.b + 3), hi + 4.5, O.cz + s*sx*(O.a + 1) + c*(O.b + 3), [255, 190, 120]); }
    }
    // ---- the houses, mansions and temples on their mapped footprints
    const temple = nm => /庙|宫|祠/.test(nm), mansion = nm => /将军|大夫|大屋|府|楼/.test(nm);
    for (const b of d.b){ const nm = b.nm || '', A = Math.abs(sArea(b.r)); if (/门$/.test(nm) || Object.values(gateO).some(O => Math.hypot(ctr(b.r)[0] - O.cx, ctr(b.r)[1] - O.cz) < 4)) continue;
      if (/博物馆/.test(nm)){ tileHouse(B, b.r, gy, {wall:BRICK, tile:TILE, ridge:RIDGE, gable:WHITE, w:5.5, rh:3.2, hip:false, ov:0.6}); continue; }
      if (temple(nm)){ const r = tileHouse(B, b.r, gy, {wall:TEMPLE, tile:'#4d5a52', ridge:'#3c6a58', gable:WHITE, w:4.6, rh:2.8, ov:0.7, sag:0.3});
        const O = obb(b.r); for (const sx of [-1, 1]){ const c = Math.cos(O.ang), s = Math.sin(O.ang); latheP(B.p(LANT), [[0.05, r.yw - 1.4], [0.3, r.yw - 1.3], [0.34, r.yw - 0.95], [0.3, r.yw - 0.65], [0.05, r.yw - 0.55]], O.cx + c*sx*O.a*0.4 - s*(O.b + 0.4), O.cz + s*sx*O.a*0.4 + c*(O.b + 0.4), 8); }
        continue; }
      const big = mansion(nm) || A > 300;
      tileHouse(B, b.r, gy, {wall:big ? BRICK : (rng() < 0.5 ? BRICK : {c:'#97938a', m:1, fh:3.6, cw:3.2}), tile:TILE, ridge:big ? RIDGE : null, gable:WHITE, w:big ? 5.2 : cl(3.6 + A/120, 3.6, 5.0), rh:big ? 2.8 : 2.2, ov:0.5, hip:false});
    }
    // ---- trees in the open ground of the town and along the wall foot
    { const nearL = lineMask(d.lanes.map(L => L.p), 3), BO = d.b.map(b => offP(b.r, -2)); treesIn(ctx, offP(W, 8), 140, 2.4, 4.2, ['d', 'raintree', 'd'], (x, z) => nearL(x, z) || BO.some(P => pip(P, x, z))); }
    for (const L of d.lanes) lampsAlong(ctx, L.p, 18, 3.2, [255, 200, 140], 1.6);
    B.flush(g);
    return g;
  }}});
