
// ================= Huaqiangbei Road (site) =================
// Huaqiang North Road, the electronics market street: closed for four years for the Metro Line 7 works between Hongli Road and
// Shennan Road and reopened as a pedestrian street on 14 January 2017; the district is "over 900 m long" (PingWest). The site is
// the OSM pedestrian mall w588249188 (Huaqiang Road Pedestrian Mall, ~910 m from Shennan Road to Hongli Road); the malls on
// both sides stay the app's buildings. Drawn: the paved street, rows of trees in planters, twin-head lamps, the canopies along
// the shop fronts (no signs or screens); the cross streets stay the app's roads.
const HQ = D.hqb;
Object.assign(SITES, {szhuaqiangbei:{zh:'华强北', en:'Huaqiangbei Road', lat:HQ.lat, lon:HQ.lon, r:480, keep:HQ.keep, keepRoads:[11, 12], h:12,
  lt:{m:0, c:'#ffe6c0', k:0.4}, build(ctx){
  const g = new THREE.Group(), B = Bt(), gy = ctx.gy, rng = ctx.rng;
  const CAN = {c:'#c9ccca', glow:'#fff0d4', gk:0.45}, CANE = {c:'#d9dcda', m:0, lk:0.4}, POST = '#5a6064', BENCH = '#8a7a66';
  // paving: light granite, a darker band down the middle of the street
  ctx.paint(HQ.keep, [192, 188, 180]);
  const mid = HQ.axis.map(([a, b, z]) => [(a + b)/2, z]);
  for (let i = 0; i < mid.length - 1; i++) ctx.line([mid[i], mid[i + 1]], 6, [168, 164, 158]);
  // canopies along the shop fronts: 3 m deep at 5.2 m, posts every other segment
  let k = 0;
  for (const [ax, az, bx, bz, nx, nz] of HQ.cans){
    const cx = (ax + bx)/2 + nx*1.5, cz = (az + bz)/2 + nz*1.5, L = Math.hypot(bx - ax, bz - az), y = gy(cx, cz);
    obox(B, CAN, cx, cz, bx - ax, bz - az, L + 0.05, 3.0, y + 5.0, y + 5.35);
    obox(B, CANE, cx + nx*1.5, cz + nz*1.5, bx - ax, bz - az, L + 0.05, 0.2, y + 4.8, y + 5.5, true);
    if (k++ % 2 === 0) obox(B, POST, cx + nx*1.3, cz + nz*1.3, 1, 0, 0.22, 0.22, y - 0.3, y + 5.0, true);
  }
  // trees in round planters with benches; lamps
  for (const [x, z] of HQ.trees){ ctx.tree(x, z, 3.2 + rng()*0.9, rng() < 0.5 ? 'raintree' : 'd'); planter(B, ctx, x, z, 1.8);
    const y = gy(x, z); if (rng() < 0.5) obox(B, BENCH, x + 2.6, z, 0, 1, 2.4, 0.6, y, y + 0.48, true); }
  for (const [x, z] of HQ.lamps) lampPost(B, ctx, x, z, 8, true);
  B.flush(g); return g; }}});
