// ---------- campuses: SUSTech 南方科技大学 (founded 2010/11, ~194 ha in Xili) and HIT Shenzhen 哈尔滨工业大学（深圳） (University Town, 2002) ----------
// Every OSM building on its footprint at its OSM height (teaching and research blocks with lit window grids, the halls of residence
// as residential grids), sports pitches and tracks painted from OSM, the lawns and woods planted, lamps along the walks.
function campusSite(ctx, d, opt){
  const g = new THREE.Group(), B = VB(), S = mkSpecs(), gy = ctx.gy, rng = ctx.rng, busy = [];
  for (const P of d.track){ ctx.paint(P, [176, 96, 74]); ctx.paint(inset(P, 7.5), [104, 156, 92]); }
  for (const P of d.pitch) ctx.paint(P, [108, 160, 96]);
  for (const b of d.b){ const dorm = /宿舍|园|公寓|荔园\d|Lychee/.test(b.n) && !/食堂|图书/.test(b.n);
    const st = dorm ? {spec:'res', wall:opt.dorm, roof:['#9a9c98', '#8c8f8c'], kind:'flat', hmin:9} : {spec:'wall', wall:opt.teach, roof:['#9a9c98', '#a3a5a2', '#8c8f8c'], kind:'flat', hmin:6};
    const r = genBld(B, S, gy, rng, b, st);
    if (!dorm && b.a > 1500 && r.top - r.hi > 14){ // horizontal sun-shade bands on the larger teaching / research blocks
      const P = inset(b.r, -0.25); for (let y = r.hi + 4; y < r.top - 1; y += 4.2) prism(B, S.plain, RGB(opt.band), P, y, y + 0.35, null); }
    busy.push([...pcent(b.r), Math.sqrt(b.a)*0.7]); }
  const onW = (x, z) => d.w.some(P => pip(P, x, z));
  const avoid = (x, z) => onW(x, z) || busy.some(q => Math.hypot(q[0] - x, q[1] - z) < q[2]) || d.pitch.some(P => pip(P, x, z)) || d.track.some(P => pip(P, x, z));
  scatter(ctx, d.wood, 45, opt.woodCap, ['d', 'raintree', 'd', 'palm'], 2.4, 4.6, avoid);
  scatter(ctx, d.grass, 120, opt.grassCap, ['raintree', 'palm', 'd'], 2.2, 4.0, avoid);
  lampsAlong(ctx, d.p, 26, 4.5, [255, 222, 180], opt.lampCap, avoid);
  B.flush(g); return g;
}
Object.assign(SITES, {
  szsustech:{zh:'南方科技大学', en:'Southern University of Science and Technology', lat:22.60182, lon:113.996496, r:1159, keep:D.szsustech.keep, keepRoads:[11, 12], h:80,
    lt:{m:1, c:'#e6eeff', k:0.6}, build(ctx){ return campusSite(ctx, D.szsustech, {teach:['#f2f2ef', '#e8e8e4', '#dfe2e3', '#ecebe6'], dorm:['#efe9de', '#e6e1d8', '#f1ede6'], band:'#d6d8d8', woodCap:2200, grassCap:1200, lampCap:900}); }},
  szhitsz:{zh:'哈尔滨工业大学（深圳）', en:'Harbin Institute of Technology, Shenzhen (University Town)', lat:22.589734, lon:113.965917, r:600, keep:D.szhitsz.keep, keepRoads:[11, 12], h:66,
    lt:{m:1, c:'#e6eeff', k:0.6}, build(ctx){ return campusSite(ctx, D.szhitsz, {teach:['#e9e5dc', '#dcd8cf', '#e3e1dc', '#cfd3d6'], dorm:['#efe9de', '#e6dccd'], band:'#c9c6be', woodCap:500, grassCap:500, lampCap:300}); }}});
