// ---------- Shenzhen Safari Park 深圳野生动物园 (opened 28 Sept 1993, ~120 ha, by Xili Lake) ----------
// The zoo under the wooded hills: its OSM pavilions and animal houses (panda house, aquarium halls, penguin island ...) with green
// tiled roofs, fenced paddocks on its OSM lawns, dense woods, a few lamps on the main walks. No animals, no mascots, no signage.
Object.assign(SITES, {szsafari:{zh:'深圳野生动物园', en:'Shenzhen Safari Park', lat:22.599544, lon:113.967409, r:880, keep:D.szsafari.keep, keepRoads:[11, 12], h:20,
  lt:{m:0, c:'#ffd9a6', k:0.55, e:0.5}, build(ctx){
  const g = new THREE.Group(), B = VB(), S = mkSpecs(), gy = ctx.gy, rng = ctx.rng, d = D.szsafari, busy = [];
  for (const b of d.b){ const shed = b.t === 'shed';
    genBld(B, S, gy, rng, b, shed ? {spec:'plain', wall:['#b49a78', '#a58c6c', '#9c9484'], roof:['#6f7a6a', '#7d7f7a'], kind:'gable', hmax:8}
      : {spec:'flood', wall:['#efe6d4', '#e4d8c2', '#d9cdb6'], roof:b.a < 1600 ? ['#3f7a5a', '#4d8462', '#5d6662'] : ['#8f9296', '#9a9c98'], kind:b.a < 1600 ? 'cn' : 'flat', hmax:14});
    busy.push([...pcent(b.r), Math.sqrt(b.a)*0.7]); }
  // paddock fences round the OSM lawns
  const kF = RGB('#7a6448');
  for (const P of d.grass){ const L = P.concat([P[0]]); let acc = 0;
    for (let i = 1; i < L.length; i++){ const a = L[i-1], b = L[i], ya = gy(a[0], a[1]), yb = gy(b[0], b[1]); bar(B, S.plain, kF, [a[0], ya + 1.1, a[1]], [b[0], yb + 1.1, b[1]], 0.12); bar(B, S.plain, kF, [a[0], ya + 0.5, a[1]], [b[0], yb + 0.5, b[1]], 0.1);
      const seg = Math.hypot(b[0] - a[0], b[1] - a[1]); for (let t = 0; t < seg; t += 4){ const f = t/seg, x = lerp(a[0], b[0], f), z = lerp(a[1], b[1], f), y = gy(x, z); bar(B, S.plain, kF, [x, y - 0.3, z], [x, y + 1.4, z], 0.14); } } }
  const onW = (x, z) => d.w.some(P => pip(P, x, z));
  const avoid = (x, z) => onW(x, z) || busy.some(q => Math.hypot(q[0] - x, q[1] - z) < q[2]) || d.grass.some(P => pip(P, x, z));
  scatter(ctx, d.wood, 40, 2600, ['d', 'd', 'raintree', 'pine'], 2.6, 4.8, avoid);
  scatter(ctx, [d.keep], 160, 1200, ['d', 'raintree', 'palm'], 2.4, 4.4, avoid);
  lampsAlong(ctx, d.p, 34, 3.8, [255, 206, 150], 300, avoid);
  B.flush(g); return g; }}});
