// ================================================================================================ sites: Xiwan Mangrove Park, Waterlands
// Both on their OSM areas (keep = the area ring), with the real paths kept (keepRoads 11, 12): planting along the paths, lamps, the
// park buildings rebuilt low on their footprints (heights estimated). Xiwan: the seawall promenade and a mangrove fringe along the
// edges of the park that face the estuary (found from the map's water outside the ring, not drawn by hand).
function siteTrees(ctx, paths, step, off, kinds, sz){
  const rng = ctx.rng; let n = 0;
  for (const P of paths) for (let i = 0; i < P.length - 1; i++){
    const a = P[i], b = P[i + 1], d = Math.hypot(b[0] - a[0], b[1] - a[1]); if (d < 1) continue; const nx = -(b[1] - a[1])/d, nz = (b[0] - a[0])/d;
    for (let s = step*rng(); s < d; s += step){ const sd = rng() < 0.5 ? -1 : 1, o = off + rng()*2.5, x = a[0] + (b[0] - a[0])*s/d + nx*sd*o, z = a[1] + (b[1] - a[1])*s/d + nz*sd*o;
      ctx.tree(x, z, sz[0] + rng()*(sz[1] - sz[0]), kinds[Math.floor(rng()*kinds.length)]); n++; }
  }
  return n;
}
function siteLamps(ctx, paths, step, col){
  for (const P of paths){ let acc = step*0.5;
    for (let i = 0; i < P.length - 1; i++){ const a = P[i], b = P[i + 1], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      while (acc < d){ const x = a[0] + (b[0] - a[0])*acc/d, z = a[1] + (b[1] - a[1])*acc/d; ctx.lamp(x + 1.2, ctx.gy(x, z) + 4.0, z, col); acc += step; }
      acc -= d; } }
}
function siteBlds(g, ctx, blds, hmax, col, roof){
  const B = new Bat();
  for (const [R, h] of blds){ let gmin = 1e9, gmax = -1e9; for (const q of R){ const y = ctx.gy(q[0], q[1]); gmin = Math.min(gmin, y); gmax = Math.max(gmax, y); }
    const H = Math.min(h, hmax); wallsT(B.a(col), R, gmin - 1.5, gmax + H); flatT(B.a(roof), R, gmax + H); wallsT(B.a(roof), R, gmax + H, gmax + H + 0.8); }
  B.flush(g);
}
const XIW = @XIWAN@;
Object.assign(SITES, {szxiwan:{zh:'西湾红树林公园', en:'Xiwan Mangrove Park', lat:22.594511, lon:113.830256, r:900, keep:XIW.keep, keepRoads:[11, 12], h:12,
  lt:{m:0, c:'#ffe2b4', k:0.45},
  build(ctx){
    const g = new THREE.Group(), rng = ctx.rng, gy = ctx.gy;
    for (const R of XIW.rings) ctx.paint(R, [172, 200, 138]);
    // edges facing the water (the map's water 20 m outside the ring): seawall promenade, lamps, mangroves outside
    for (const R of XIW.rings){
      let A = 0; for (let i = 0; i < R.length; i++){ const p = R[i], q = R[(i + 1) % R.length]; A += p[0]*q[1] - q[0]*p[1]; }
      const sgn = A > 0 ? 1 : -1;              // outward normal side
      for (let i = 0; i < R.length; i++){
        const a = R[i], b = R[(i + 1) % R.length], d = Math.hypot(b[0] - a[0], b[1] - a[1]); if (d < 2) continue;
        const nx = sgn*(b[1] - a[1])/d, nz = -sgn*(b[0] - a[0])/d, mx = (a[0] + b[0])/2, mz = (a[1] + b[1])/2;
        if (!(gy(mx + nx*22, mz + nz*22) < -0.2 && gy(mx + nx*40, mz + nz*40) < -0.2)) continue;
        ctx.line([[a[0] - nx*5, a[1] - nz*5], [b[0] - nx*5, b[1] - nz*5]], 7, [206, 200, 186]);
        ctx.line([[a[0] - nx*1.2, a[1] - nz*1.2], [b[0] - nx*1.2, b[1] - nz*1.2]], 1.6, [168, 160, 146]);
        for (let s = 15*rng(); s < d; s += 30){ const x = a[0] + (b[0] - a[0])*s/d - nx*2, z = a[1] + (b[1] - a[1])*s/d - nz*2; ctx.lamp(x, gy(x, z) + 4.5, z, [255, 226, 176]); }
        for (let s = 0; s < d; s += 4.5) for (let k = 0; k < 3; k++){ const o = 7 + k*7 + rng()*5, x = a[0] + (b[0] - a[0])*s/d + nx*o, z = a[1] + (b[1] - a[1])*s/d + nz*o;
          if (rng() < 0.75) ctx.tree(x, z, 1.8 + rng()*1.6, 'd'); }
      }
    }
    siteTrees(ctx, XIW.paths, 13, 3.5, ['raintree', 'd', 'palm', 'd'], [2.4, 4.2]);
    siteLamps(ctx, XIW.paths, 34, [255, 222, 170]);
    siteBlds(g, ctx, XIW.blds, 7.5, {c:'#d9d3c4', m:1, fh:3.4, cw:2.6}, '#9a8f7e');
    return g;
  }}});
const WTL = @WATER@;
Object.assign(SITES, {szwaterlands:{zh:'海上田园', en:'Shenzhen Waterlands Resort', lat:22.728665, lon:113.766585, r:800, keep:WTL.keep, keepRoads:[11, 12], h:10,
  lt:{m:0, c:'#ffe2b4', k:0.45},
  build(ctx){
    const g = new THREE.Group();
    siteTrees(ctx, WTL.paths, 12, 3.2, ['raintree', 'd', 'willow', 'palm'], [2.4, 4.0]);
    siteLamps(ctx, WTL.paths, 36, [255, 222, 170]);
    siteBlds(g, ctx, WTL.blds, 8, {c:'#d8d2c2', m:1, fh:3.4, cw:2.6}, '#8f8576');
    return g;
  }}});
