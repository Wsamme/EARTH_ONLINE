// ---------- OCT Harbour 欢乐海岸 (2011, ~1.25 km²: the lake, canals, the shopping streets, hotels, the lakeside villas) ----------
// All buildings on their OSM footprints (the villas of the west islands, the mall and the 曲水湾 lanes of the east, the lake-island
// club), the water-show stand facing its OSM basin, lamps along the waterfront walks, palms on the lawns and the beach.
Object.assign(SITES, {szocth:{zh:'欢乐海岸', en:'OCT Harbour', lat:22.526317, lon:113.982973, r:616, keep:D.szocth.keep, keepRoads:[11, 12], h:30,
  lt:{m:1, c:'#ffe2b8', k:0.6, e:0.5}, build(ctx){
  const g = new THREE.Group(), B = VB(), S = mkSpecs(), gy = ctx.gy, rng = ctx.rng, d = D.szocth, busy = [];
  for (const b of d.b){ const c = pcent(b.r), villa = c[0] < -150 && b.t === 'apartment';
    const st = villa ? {spec:'res', wall:['#f2efe8', '#ece4d6', '#e6ddd0'], roof:['#5b6168', '#6b6660', '#7a6c62'], kind:'hip', hmax:14}
      : {spec:'wall', wall:['#f1ece2', '#e4dccf', '#d8d0c2', '#c9d0d3', '#eae6de'], roof:['#9a9c98', '#8f9296', '#a39c90'], kind:b.a < 700 ? 'auto' : 'flat', hmax:26};
    const r = genBld(B, S, gy, rng, b, st); busy.push([c[0], c[1], Math.sqrt(b.a)*0.7]);
    if (!villa && b.a > 300 && b.a < 2500 && rectness(b.r) > 0.7 && r.F.L < 45){ // timber shade canopy on the waterfront side of the shop pavilions
      fbox(B, Fr(r.F.cx, r.F.cz, r.F.ang, r.hi), S.plain, RGB('#8a6a4c'), 0, r.F.W/2 + 1.4, r.F.L*0.9, 2.8, 3.6, 0.35); } }
  // the water-show stand: semicircular tiers facing the show basin (OSM w549197452), a light canopy
  { const cx = 231, cz = 172, y0 = gy(cx, cz), F = Fr(cx, cz, 0, y0);
    for (let k = 0; k < 8; k++){ const r0 = 14 + k*2.4; for (let i = 0; i < 18; i++){ const a0 = PI*0.08 + i/18*PI*0.84, a1 = PI*0.08 + (i + 1)/18*PI*0.84;
      const p = (a, r, y) => F(Math.cos(a)*r, y, Math.sin(a)*r - 0); B.quad(S.plain, RGB('#cfc9bd'), p(a0, r0, k*0.9 + 0.9), p(a1, r0, k*0.9 + 0.9), p(a1, r0 + 2.4, k*0.9 + 0.9), p(a0, r0 + 2.4, k*0.9 + 0.9));
      B.quad(S.plain, RGB('#bdb6a8'), p(a0, r0, k*0.9), p(a1, r0, k*0.9), p(a1, r0, k*0.9 + 0.9), p(a0, r0, k*0.9 + 0.9)); } }
    for (let i = 0; i <= 8; i++){ const a = PI*0.1 + i/8*PI*0.8; bar(B, S.steel, RGB('#e9ecef'), F(Math.cos(a)*34, 0, Math.sin(a)*34), F(Math.cos(a)*30, 13, Math.sin(a)*30), 0.4); bar(B, S.steel, RGB('#e9ecef'), F(Math.cos(a)*30, 13, Math.sin(a)*30), F(Math.cos(a)*14, 11, Math.sin(a)*14), 0.3); }
    for (let i = 0; i < 12; i++){ const a = PI*0.1 + i/12*PI*0.8; ctx.lamp(cx + Math.cos(a)*16, y0 + 11, cz + Math.sin(a)*16, [190, 220, 255]); }
    busy.push([cx, cz, 40]); }
  const onW = (x, z) => d.w.some(P => pip(P, x, z));
  const avoid = (x, z) => onW(x, z) || busy.some(q => Math.hypot(q[0] - x, q[1] - z) < q[2]);
  scatter(ctx, d.grass, 70, 500, ['palm', 'palm', 'd', 'raintree'], 2.2, 3.8, avoid);
  scatter(ctx, d.wood, 40, 500, ['d', 'raintree', 'palm'], 2.4, 4.2, avoid);
  lampsAlong(ctx, d.p, 16, 4.2, [255, 206, 150], 900, (x, z) => onW(x, z));
  B.flush(g); return g; }}});
