// ================= Chung Ying Street (中英街), Sha Tau Kok (site) =================
// The border street laid out by the 1899 Sino-British survey: about 250 m long and under 4 m wide (sz.gov.cn Shenzhen Story
// 2023-03), the centreline is the Shenzhen - Hong Kong boundary, marked by eight boundary stones along the middle (eyeshenzhen;
// OSM maps four of them: stones No. 2, 3, 6 and the one at the north end, placed here); shops line it (89 gold shops at its peak).
// Built on: the centreline (OSM w333856692 + w1553756750), the stones, the warning-bell tower (OSM n6944601612, bell_tower;
// the anchor), and the 34 real footprints within 15 m of the street, rebuilt as the low shop houses (heights: OSM where tagged,
// else 2-4 storeys; three large footprints with estimated 88-94 m in this build are capped at 4 storeys). No signage.
// keep = 15 m either side of the street + the bell plaza. Night: shop windows and fronts lit, street lamps.
Object.assign(SITES, {szchungying:{zh:'中英街', en:'Chung Ying Street', lat:22.544452, lon:114.226097, r:400, keep:D.szchungying.keep, keepRoads:[11, 12], h:20,
  lt:{m:1, c:'#ffdcae', k:0.6},
  build(ctx){
    const g = new THREE.Group(), B = mkB(), d = D.szchungying, gy = ctx.gy, rng = ctx.rng;
    const WALLS = [{c:'#e8e2d4', m:1, fh:3.2, cw:2.6}, {c:'#d9cdb6', m:1, fh:3.2, cw:2.6}, {c:'#cfd3d0', m:1, fh:3.2, cw:2.6}, {c:'#e6d7c0', m:1, fh:3.2, cw:2.6}, {c:'#bfc6c9', m:1, fh:3.2, cw:2.6}];
    const ROOF = '#9b9a94', TRIM = '#efece4', SHOP = {c:'#5a4a3c', glow:'#ffd08a', gk:0.9}, AWN = ['#8d3a2e', '#3f5f6e', '#7a6a3e'], GRAN = {c:'#c9c3b6', lc:'#ffe2b8', lk:1.0}, BRONZE = {c:'#6e5a36', lc:'#ffd890', lk:1.4}, WOOD = '#6b3b28', TILE = '#5b5f5c';
    // ---- the street: granite paving 4 m wide on the boundary line, a thin centre strip
    ribbonP(B.p('#b3aca0'), d.st, 4.0, gy, 0.22, 2); ribbonP(B.p('#8f877c'), d.st, 0.35, gy, 0.26, 2);
    ribbonP(B.p('#b3aca0'), [d.st[0], d.bell], 5, gy, 0.22, 2);
    // ---- shop houses on their real footprints
    for (const b of d.shops){
      const A = Math.abs(sArea(b.r)), h = b.lv ? b.lv*3.2 + 0.5 : (b.h > 20 ? 13.5 : cl(b.h, 6.5, 16));
      townBld(B, b.r, gy, {wall:WALLS[Math.floor(rng()*WALLS.length)], roof:ROOF, trim:TRIM, shop:SHOP, awn:A > 30 && rng() < 0.6 ? AWN[Math.floor(rng()*AWN.length)] : null, band:TRIM, fh:3.2, h, sheds:true, rng});
    }
    // ---- the boundary stones: granite posts on the centreline
    for (const nm in d.stones){ const [x, z] = d.stones[nm], y = gy(x, z); let ang = 0, db = 1e9;
      for (let i = 1; i < d.st.length; i++){ const dd = dSeg(x, z, d.st[i-1], d.st[i]); if (dd < db){ db = dd; ang = Math.atan2(d.st[i][1] - d.st[i-1][1], d.st[i][0] - d.st[i-1][0]); } }
      boxP(B.p(GRAN), 0.9, 0.25, 0.6, x, y - 0.1, z, -ang); boxP(B.p(GRAN), 0.55, 1.25, 0.3, x, y + 0.15, z, -ang); boxP(B.p(GRAN), 0.62, 0.1, 0.36, x, y + 1.4, z, -ang); }
    // ---- the warning bell: a bronze bell hung in a granite-and-timber bell frame on a stepped platform
    { const [x, z] = d.bell, y = gy(x, z);
      for (let i = 0; i < 3; i++) boxP(B.p(GRAN), 9 - i*1.6, 0.35, 9 - i*1.6, x, y - 0.3 + i*0.35, z, 0);
      const yp = y + 0.75;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) boxP(B.p(GRAN), 0.7, 5.6, 0.7, x + sx*2.4, yp, z + sz*1.6, 0);
      for (const sz of [-1, 1]) boxP(B.p(WOOD), 5.6, 0.5, 0.6, x, yp + 5.2, z + sz*1.6, 0);
      boxP(B.p(WOOD), 0.5, 0.6, 3.8, x, yp + 5.2, z, 0);
      roofP(B.p(TILE), x, z, 3.6, 2.8, 2.0, 0, yp + 5.7, 1.6, {lift:0.4, pw:1.4, nt:3});
      segP(B.p(WOOD), [x, yp + 5.2, z], [x, yp + 4.4, z], 0.12, 4);
      latheP(B.p(BRONZE), [[0.25, yp + 4.4], [0.7, yp + 4.3], [0.95, yp + 3.6], [1.05, yp + 2.6], [1.3, yp + 2.1], [1.32, yp + 2.0], [0, yp + 2.0]], x, z, 14);
    }
    // ---- street lamps along both kerbs, warm
    lampsAlong(ctx, d.st, 14, 3.6, [255, 214, 160], 2.6); lampsAlong(ctx, d.st, 14, 3.6, [255, 214, 160], -2.6);
    for (let t = 7; t < plen(d.st); t += 14){ const p = along(d.st, t); for (const s of [-1, 1]){ const x = p[0] - Math.sin(p[2])*2.6*s, z = p[1] + Math.cos(p[2])*2.6*s, y = gy(x, z); segP(B.p('#3d3f40'), [x, y, z], [x, y + 3.6, z], 0.07, 4); latheP(B.p({c:'#efe7d2', glow:'#ffd9a0', gk:1.6}), [[0.05, y + 3.4], [0.22, y + 3.55], [0.22, y + 3.95], [0.05, y + 4.05]], x, z, 6); } }
    B.flush(g);
    return g;
  }}});
