
// ---------- street furniture shared by the two sites ----------
function lampPost(B, ctx, x, z, h, twin){
  const y = ctx.gy(x, z); obox(B, '#4a4f53', x, z, 1, 0, 0.28, 0.28, y - 0.5, y + h, true);
  const heads = twin ? [[-0.9, 0], [0.9, 0]] : [[0, 0]];
  for (const [dx, dz] of heads){ abox(B, {c:'#f4ecd8', glow:'#ffe3ae', gk:1.6}, x + dx - 0.35, x + dx + 0.35, y + h - 0.2, y + h + 0.25, z + dz - 0.35, z + dz + 0.35);
    if (twin) abox(B, '#4a4f53', x - 0.9, x + 0.9, y + h + 0.25, y + h + 0.4, z - 0.08, z + 0.08); }
  ctx.lamp(x, y + h, z, [255, 214, 160]);
}
function planter(B, ctx, x, z, r){ const y = ctx.gy(x, z); cylw(B, '#bdb6a8', x, z, r, r, y - 0.3, y + 0.55, 10, '#5d6b4a'); }

// ================= Dongmen Pedestrian Street (site) =================
// The old market town of Shenzhen (sz.gov.cn: "the earliest commercial district"); the pedestrian district of shopping streets
// between Dongmen Middle Road, Jiefang Road, Renmin North Road, Nantang Street and Xinyuan Road; the first renewal finished in
// October 1999 with granite-paved streets and "Lingnan character"; the second (traffic and landscape) opened in June 2018
// (maigoo, sz.gov.cn). Siyue Academy (思月书院), a former clan hall moved here from a couple of streets away, stands on Renmin
// Road's second cross street, with the model of an ancient bell (bianzhong) on the plaza nearby (eyeshenzhen); the plazas are
// planted with king palms (maigoo). The site keeps the OSM area w1238852261 and rebuilds its 50 buildings on their footprints
// at their mapped / estimated heights, with lit shopfronts and canopies but no signs; the lanes stay the app's paths.
const DM = D.dm;
Object.assign(SITES, {szdongmen:{zh:'东门商业步行街', en:'Dongmen Pedestrian Street', lat:DM.lat, lon:DM.lon, r:420, keep:DM.keep, keepRoads:[11, 12], h:160,
  lt:{m:1, c:'#ffe2b8', k:0.55}, build(ctx){
  const g = new THREE.Group(), B = Bt(), gy = ctx.gy, rng = ctx.rng;
  const WALLS = [{c:'#cfc6b5', m:1, fh:4.2, cw:3.4}, {c:'#b9b4aa', m:1, fh:4.0, cw:3.2}, {c:'#9fadb6', m:1, fh:4.2, cw:3.0}];
  const WINB = {c:'#5a666d', m:1, fh:3.8, cw:2.6}, SHOP = {c:'#3f3b37', glow:'#ffd9a2', gk:1.0}, CAN = {c:'#cdc8be', glow:'#ffe6bc', gk:0.35}, ROOF = '#8d8f8c', PARA = '#bdb6a8', PLANT = PARA;
  const BRICK = {c:'#8f8d87', m:0, lk:0.45}, TILE = '#5c5d5a', RIDGE = '#4a4f53', TIMB = {c:'#6e3b2a', m:0, lk:0.4}, GRAN = PARA;
  // granite paving over the whole district (the buildings stand on it)
  ctx.paint(DM.keep, [196, 190, 180]);
  for (const p of DM.paths) ctx.line(p.p, p.c === 12 ? 6 : 8, [186, 180, 170]);
  for (const b of DM.b){
    const R = b.r; let lo = 1e9, hi = -1e9; for (const p of R){ const y = gy(p[0], p[1]); lo = Math.min(lo, y); hi = Math.max(hi, y); }
    if (b.id === 'w487800417'){ siyue(B, R, lo, hi); continue; }
    const W = WALLS[Math.floor(rng()*WALLS.length)], y0 = hi, top = hi + b.h;
    ext(B, W, R, lo - 1.5, top, ROOF);
    // upper floors: a dark glazed window band per storey and pale mullions (podium storeys 4.5 m, then 3.8 m)
    const G = grow(R, 0.1);
    for (let yf = y0 + 4.6; yf < top - 2.2; yf += 3.8) ext(B, WINB, G, yf + 0.9, yf + 2.9, null);
    mullions(B, PARA, G, 3.6, 0.25, 0.3, y0 + 4.6, top - 1.0, true);
    // the shopfronts: a lit glazed band at street level, canopies over them on the longer faces
    ext(B, SHOP, grow(R, 0.12), y0 + 0.2, y0 + 4.3, null);
    const o = ringArea(R) > 0 ? 1 : -1;
    for (let i = 0; i < R.length; i++){ const e = edgeOf(R, i); if (e.L < 6) continue; const nx = o*e.uz, nz = -o*e.ux;
      obox(B, CAN, (e.a[0] + e.b[0])/2 + nx*1.0, (e.a[1] + e.b[1])/2 + nz*1.0, e.ux, e.uz, e.L - 0.6, 2.0, y0 + 4.5, y0 + 4.85); }
    // parapet, a podium line on the taller blocks, roof plant
    bands(B, PARA, R, [top - 0.4], 0.8, 0.2);
    if (b.h > 30) bands(B, PARA, R, [y0 + 22], 0.9, 0.3);
    if (b.h > 12){ const c = centroid(R); abox(B, PLANT, c[0] - 3, c[0] + 3, top, top + 2.6, c[1] - 2.5, c[1] + 2.5); }
  }
  // Siyue Academy: a Lingnan hall of grey brick under grey-tiled gabled roofs, front and rear halls round a small court
  function siyue(B, R, lo, hi){
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of R){ x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
    const cx = (x0 + x1)/2, w = (x1 - x0)*0.92, d = (z1 - z0)*0.92, cz = (z0 + z1)/2;
    ext(B, GRAN, R, lo - 1, hi + 0.5, GRAN);
    for (const [fz, dd] of [[-0.3, 0.36], [0.3, 0.36]]){ const zc = cz + fz*d, hd = dd*d/2, y0 = hi + 0.5, ye = y0 + 5.2, yr = ye + 3.0;
      abox(B, BRICK, cx - w/2, cx + w/2, y0, ye, zc - hd, zc + hd);
      // gabled roof along x (ridge along x), slightly concave, eaves overhanging 0.8 m
      const ex = w/2 + 0.6, ez = hd + 0.8;
      for (const s of [-1, 1]) for (let k = 0; k < 4; k++){ const f0 = k/4, f1 = (k + 1)/4, cv = f => yr - (yr - ye + 0.3)*(f*f*0.35 + f*0.65);
        B.q(TILE, [cx - ex, cv(f0), zc + s*ez*f0], [cx + ex, cv(f0), zc + s*ez*f0], [cx + ex, cv(f1), zc + s*ez*f1], [cx - ex, cv(f1), zc + s*ez*f1]); }
      for (const sx of [-1, 1]){ const x = cx + sx*w/2; B.t(BRICK, [x, ye, zc - hd], [x, ye, zc + hd], [x, yr, zc]); }
      abox(B, RIDGE, cx - ex, cx + ex, yr - 0.1, yr + 0.55, zc - 0.35, zc + 0.35);
      for (const sx of [-1, 1]) abox(B, RIDGE, cx + sx*ex - 0.5, cx + sx*ex + 0.5, yr - 0.1, yr + 1.1, zc - 0.4, zc + 0.4);
      // timber door frames on the court side, lanterns
      abox(B, TIMB, cx - 1.6, cx + 1.6, y0, y0 + 3.6, zc - fz/Math.abs(fz)*hd - 0.15, zc - fz/Math.abs(fz)*hd + 0.15);
      for (const sx of [-1, 1]) cylw(B, {c:'#c8321e', glow:'#ff7a3a', gk:1.2}, cx + sx*2.6, zc - fz/Math.abs(fz)*(hd + 0.6), 0.32, 0.32, y0 + 3.0, y0 + 3.7, 8, null);
    }
    // the side walls of the court
    for (const sx of [-1, 1]) abox(B, BRICK, cx + sx*w/2 - 0.3, cx + sx*w/2 + 0.3, hi + 0.5, hi + 4.0, cz - d*0.12, cz + d*0.12);
    ctx.lamp(cx, hi + 4, cz, [255, 190, 120]);
  }
  // the bell on the plaza near the academy (a bronze bianzhong on a low frame; position approximate)
  if (DM.bell){ const [x, z] = DM.bell, y = gy(x, z), BR = {c:'#7b5a34', m:0, lc:'#ffd9a0', lk:1.0};
    abox(B, GRAN, x - 2.4, x + 2.4, y - 0.5, y + 0.6, z - 1.8, z + 1.8);
    for (const sx of [-1, 1]) abox(B, BR, x + sx*1.8 - 0.2, x + sx*1.8 + 0.2, y + 0.6, y + 4.6, z - 0.2, z + 0.2);
    abox(B, BR, x - 2.2, x + 2.2, y + 4.4, y + 4.8, z - 0.25, z + 0.25);
    LLathe(g, [[0.15, 0], [0.9, -0.3], [1.15, -1.6], [1.35, -2.9], [0.0, -2.9]], x, y + 4.3, z, BR, 12);
    ctx.lamp(x, y + 1, z, [255, 210, 150]); }
  // lamps along the lanes, king palms where the lanes open out
  for (const [x, z] of DM.lamps) lampPost(B, ctx, x, z, 5.5, false);
  for (const [x, z] of DM.trees){ ctx.tree(x, z, 2.6 + rng()*0.8, 'palm'); planter(B, ctx, x, z, 1.3); }
  B.flush(g); return g; }}});
