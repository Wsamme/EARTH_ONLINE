// ================================================================ sites: shared bits
const gyMin = (ctx, ring) => { let m = 1e9; for (const p of ring) m = Math.min(m, ctx.gy(p[0], p[1])); const c = cen2(ring); return Math.min(m, ctx.gy(c[0], c[1])); };
const rMax = P => Math.ceil(Math.max(...P.map(p => Math.hypot(p[0], p[1]))));

// ================================================================ SUTD (2015, UNStudio + DP Architects): the campus buildings on their real footprints
Object.assign(SITES, {sgsutd:{zh:'新加坡科技设计大学', en:'Singapore University of Technology and Design', lat:1.341, lon:103.9635,
  r:rMax(D.sutd.keep), keep:D.sutd.keep, keepRoads:[11], h:42,
  lt:{m:1, c:'#e8eef4', k:0.5, fh:3.6, cw:3.0},
  build(ctx){
    const g = new THREE.Group(), T = mkT(), S = D.sutd;
    for (const a of S.a){ ctx.paint(a[1], a[0] === 'pitch' ? [92, 146, 78] : [120, 160, 96]); }
    for (const p of S.p) if (p.length > 1) ctx.line(p, 2.6, [196, 192, 182]);
    const occ = [];
    for (const [ring, h, fl, name] of S.b){
      const y0 = gyMin(ctx, ring) - 1.5, gnd = y0 + 1.5, top = gnd + Math.max(4, h || 8), house = /Housing/.test(name), big = /Sport/.test(name);
      occ.push(ring);
      if (house){
        // residential towers: white walls, balcony slab bands each floor, window strips
        T.prism('wh', ring, y0, top, 'rf'); facade(T, ring, gnd + 3.0, top, {band:'bl', fh:3.4, bh:0.35, bd:0.9});
        facade(T, ring, gnd + 1, top - 1, {fin:'gr', step:3.2, d:0.12, w:0.25});
        T.walls('wh', offR(ring, -0.05), top, top + 1.2);
      } else if (big){
        T.prism('cl', ring, y0, top - 2, 'mr'); facade(T, ring, gnd, top - 2, {fin:'gr', step:6, d:0.3, w:0.3}); const b = obb(ring); T.gab('mr', b.cx, b.cz, b.ux, b.uz, b.L/2 + 0.5, b.W/2 + 0.5, top - 2, 3.0, 'cl');
      } else {
        // academic blocks: dark glazing behind white horizontal sunshade louvres at every floor, a deep roof edge
        T.prism('gl', ring, y0, top, 'rf');
        facade(T, ring, gnd, top, {band:'wh', fh:3.6, b0:1.2, bh:0.45, bd:1.1});
        facade(T, ring, gnd, top, {band:'lv', fh:3.6, b0:2.6, bh:0.12, bd:0.6});
        facade(T, ring, gnd, top, {fin:'wh', step:8.5, d:1.1, w:0.35});
        T.walls('wh', offR(ring, 0.6), top - 0.2, top + 1.0);
      }
    }
    // trees along the footpaths, kept off the buildings
    const free = (x, z) => !occ.some(r => inPoly(offR(r, 4), x, z));
    let nt = 0;
    for (const p of S.p){ const L = plen(p); for (let s = 8; s < L; s += 22){ const q = pAt(p, s), side = ctx.rng() < 0.5 ? -1 : 1, x = q[0] - q[3]*4*side, z = q[1] + q[2]*4*side;
      if (inPoly(S.keep, x, z) && free(x, z)){ ctx.tree(x, z, 2.6 + ctx.rng()*1.4, ctx.rng() < 0.7 ? 'raintree' : 'd'); nt++; }
      if (s % 44 < 22) ctx.lamp(q[0], ctx.gy(q[0], q[1]) + 4.5, q[1], [255, 226, 180]); } }
    T.flush(g, {wh:'#eeeeea', rf:'#9ea3a6', bl:'#dcdcd6', gr:'#7d868c', cl:'#cfd3d4', mr:'#b8bec2', gl:{c:'#4f6573', m:1}, lv:'#c9cdcf'});
    return g;
  }}});

// ================================================================ Changi Village: the hawker centre, the Changi Point ferry terminal and jetty, Changi Point Bridge
Object.assign(SITES, {sgchangivillage:{zh:'樟宜村', en:'Changi Village', lat:1.3895, lon:103.9878,
  r:rMax(D.cv.keep), keep:D.cv.keep, keepRoads:[11], h:14,
  lt:{m:0, c:'#ffe4bc', k:0.35, e:0.7},
  build(ctx){
    const g = new THREE.Group(), T = mkT(), C = D.cv, K = C.keep;
    for (const p of C.paths){ const q = p.filter(v => inPoly(K, v[0], v[1])); if (q.length > 1) ctx.line(q, 2.4, [200, 194, 180]); }
    // Changi Village Market & Hawker Centre (1975, upgraded 2012): open-sided hall under a broad pitched roof with a raised clerestory
    { const r = C.hc, y0 = gyMin(ctx, r), b = obb(r);
      T.prism('pl', r, y0 - 1.5, y0 + 0.5); T.prism('dk', offR(r, -2.5), y0 + 0.5, y0 + 4.6, 'pl');
      for (let i = 0; i < r.length; i++){ const a = r[i], c = r[(i + 1) % r.length], L = Math.hypot(c[0] - a[0], c[1] - a[1]); const n = Math.max(1, Math.round(L/6)); for (let k = 0; k <= n; k++){ const p = lerp2(a, c, k/n); T.box('co', p[0], y0 + 0.5, p[1], 0.5, 4.4, 0.5); } }
      T.walls('fa', offR(r, 0.8), y0 + 4.6, y0 + 5.3);
      T.gab('rf', b.cx, b.cz, b.ux, b.uz, b.L/2 + 1.2, b.W/2 + 1.8, y0 + 5.3, 3.2, 'fa');
      T.ob('gr', b.cx, b.cz, b.ux, b.uz, b.L/2 - 6, 2.6, y0 + 8.0, y0 + 9.2); T.gab('rf', b.cx, b.cz, b.ux, b.uz, b.L/2 - 5.5, 3.6, y0 + 9.2, 1.3, 'fa'); }
    // Changi Point Ferry Terminal: single-storey waiting hall, gangway and pontoon for the Pulau Ubin bumboats
    { const r = C.ft, y0 = gyMin(ctx, r), b = obb(r);
      T.prism('pl', r, y0 - 1.5, y0 + 0.5); T.prism('wa', offR(r, -1.2), y0 + 0.5, y0 + 4.0, 'pl');
      for (let i = 0; i < r.length; i++){ const p = r[i]; T.box('co', p[0], y0 + 0.5, p[1], 0.4, 3.9, 0.4); }
      T.hip('rb', b.cx, b.cz, b.ux, b.uz, b.L/2 + 1.5, b.W/2 + 1.5, y0 + 4.4, 2.6);
      const pc = [-22.3, -182.1], ce = cen2(r), dx = pc[0] - ce[0], dz = pc[1] - ce[1], L = Math.hypot(dx, dz), ux = dx/L, uz = dz/L;
      const e0 = [ce[0] + ux*b.W/2, ce[1] + uz*b.W/2];
      T.seg('dk2', e0, [pc[0] - ux*4, pc[1] - uz*4], 1.4, 1.3, 1.7);
      for (const sg of [-1, 1]) T.seg('ra', [e0[0] - uz*sg*1.35, e0[1] + ux*sg*1.35], [pc[0] - ux*4 - uz*sg*1.35, pc[1] - uz*4 + ux*sg*1.35], 0.04, 1.7, 2.7);
      T.ob('pn', pc[0], pc[1], -uz, ux, 9, 3.5, -0.4, 0.8, false, true); T.ob('ra', pc[0], pc[1], -uz, ux, 9.1, 3.6, 0.8, 0.95, true); }
    for (const s of C.sheds){ const y0 = gyMin(ctx, s), b = obb(s); T.prism('wa', s, y0 - 1, y0 + 2.8, 'rb'); T.hip('rb', b.cx, b.cz, b.ux, b.uz, b.L/2 + 0.6, b.W/2 + 0.6, y0 + 2.8, 1.2); }
    // Changi Point Bridge: footbridge over the creek with a gentle camber, railings and lamps
    { const [a, c] = C.br, dx = c[0] - a[0], dz = c[1] - a[1], L = Math.hypot(dx, dz), ux = dx/L, uz = dz/L, vx = -uz, vz = ux, ga = ctx.gy(a[0], a[1]), gc = ctx.gy(c[0], c[1]);
      const n = 10, y = k => ga + (gc - ga)*k/n + 0.6 + Math.sin(Math.PI*k/n)*1.8, p = k => [a[0] + dx*k/n, a[1] + dz*k/n];
      for (let k = 0; k < n; k++){ const p0 = p(k), p1 = p(k + 1), y0 = y(k), y1 = y(k + 1);
        const S = (q, yy, w) => [q[0] + vx*w, yy, q[1] + vz*w];
        T.q('dk2', S(p0, y0, -1.6), S(p1, y1, -1.6), S(p1, y1, 1.6), S(p0, y0, 1.6)); T.q('be', S(p0, y0 - 0.7, -1.2), S(p1, y1 - 0.7, -1.2), S(p1, y1 - 0.7, 1.2), S(p0, y0 - 0.7, 1.2));
        for (const w of [-1.6, 1.6]){ T.q('be', S(p0, y0, w), S(p1, y1, w), S(p1, y1 - 0.7, w*0.75), S(p0, y0 - 0.7, w*0.75)); T.beam('ra', S(p0, y0 + 1.1, w), S(p1, y1 + 1.1, w), 0.05); T.beam('ra', S(p0, y0, w), S(p0, y0 + 1.1, w), 0.03); } }
      for (const k of [0, n]){ const q = p(k); T.cyl('be', q[0], q[1], Math.min(ga, gc) - 2, y(k) - 0.6, 1.2, 1.2, 8); }
      for (const k of [2, 5, 8]){ const q = p(k), x = q[0] + vx*1.5, z = q[1] + vz*1.5; T.cyl('po', x, z, y(k), y(k) + 4, 0.07, 0.06, 6); ctx.lamp(x, y(k) + 4, z, [255, 225, 175]); } }
    // a few coastal trees inside the site
    for (let i = 0; i < 160; i++){ const x = -60 + ctx.rng()*200, z = -230 + ctx.rng()*260; if (!inPoly(K, x, z) || inPoly(offR(C.hc, 4), x, z) || inPoly(offR(C.ft, 4), x, z) || nearOn(C.br, x, z)[0] < 6) continue; ctx.tree(x, z, 2.4 + ctx.rng()*1.6, ctx.rng() < 0.4 ? 'palm' : 'raintree'); }
    T.flush(g, {pl:'#b3ada2', dk:'#5a5048', co:'#ece8df', fa:'#e6e0d2', rf:'#7f4636', gr:'#3a3833', wa:'#e8e2d4', rb:'#4f6b78', dk2:'#9c8f7c', ra:'#d7dad6', pn:'#6d6e6a', be:'#a7a197', po:'#666b70'});
    return g;
  }}});

// ================================================================ Chek Jawa Wetlands (Pulau Ubin): House No. 1, Jejawi Tower, the coastal and mangrove boardwalks
Object.assign(SITES, {sgchekjawa:{zh:'仄爪哇湿地', en:'Chek Jawa Wetlands (Pulau Ubin)', lat:1.408688, lon:103.990767,
  r:rMax(D.cj.keep), keep:D.cj.keep, h:24,
  lt:{m:0, c:'#ffe7c4', k:0.3, e:0.7},
  build(ctx){
    const g = new THREE.Group(), T = mkT(), C = D.cj;
    for (const p of C.paths){ const q = p.filter(v => inPoly(C.keep, v[0], v[1])); if (q.length > 1) ctx.line(q, 2.2, [176, 160, 128]); }
    // boardwalks (aluminium railings) on posts, low over the mud flats / mangrove; the floating pontoon at water level
    for (const [pts, el] of C.bw){
      if (pts.length < 2) continue;
      const pont = pts.length === 4 && Math.abs(pts[0][0] - 220.6) < 1, L = plen(pts), n = Math.max(1, Math.ceil(L/4));
      let prev = null;
      for (let k = 0; k <= n; k++){
        const q = pAt(pts, L*k/n), gyv = ctx.gy(q[0], q[1]), y = pont ? Math.max(gyv, 0) + 0.5 : Math.max(gyv, 0.3) + 1.6, vx = -q[3], vz = q[2], w = pont ? 2.4 : 1.25;
        const sec = [[q[0] + vx*w, y, q[1] + vz*w], [q[0] - vx*w, y, q[1] - vz*w]];
        if (prev){ T.q('bw', prev[0], sec[0], sec[1], prev[1]); T.q('bb', [prev[0][0], prev[0][1] - 0.3, prev[0][2]], [sec[0][0], sec[0][1] - 0.3, sec[0][2]], sec[0], prev[0]); T.q('bb', [prev[1][0], prev[1][1] - 0.3, prev[1][2]], [sec[1][0], sec[1][1] - 0.3, sec[1][2]], sec[1], prev[1]);
          for (const j of [0, 1]){ const a = prev[j], b = sec[j]; T.beam('al', [a[0], a[1] + 1.0, a[2]], [b[0], b[1] + 1.0, b[2]], 0.035); T.beam('al', [a[0], a[1] + 0.5, a[2]], [b[0], b[1] + 0.5, b[2]], 0.025); } }
        for (const j of [0, 1]){ const a = sec[j]; T.beam('al', [a[0], a[1], a[2]], [a[0], a[1] + 1.0, a[2]], 0.03); if (!pont && k % 2 === 0) T.cyl('pp', a[0], a[2], Math.min(gyv, 0) - 2, y - 0.3, 0.12, 0.12, 5); }
        prev = sec;
      }
    }
    // Jejawi Tower: 21 m, seven storeys of platforms with stairs, beside its Malayan banyan
    { const [x, z] = C.tower, y0 = ctx.gy(x, z), s = 2.6;
      for (const [a, b] of [[-s, -s], [s, -s], [s, s], [-s, s]]) T.cyl('st', x + a, z + b, y0 - 1.5, y0 + 21, 0.2, 0.2, 6);
      for (let k = 1; k <= 7; k++){ const y = y0 + k*2.85; T.box('bw', x, y - 0.25, z, 2*s + 0.6, 0.25, 2*s + 0.6);
        for (const [dx, dz, L, W] of [[0, -s - 0.3, 2*s + 0.6, 0.06], [0, s + 0.3, 2*s + 0.6, 0.06], [-s - 0.3, 0, 0.06, 2*s + 0.6], [s + 0.3, 0, 0.06, 2*s + 0.6]]) T.box('al', x + dx, y + 0.95, z + dz, L, 0.08, W);
        const sg = k % 2 ? 1 : -1; T.beam('st', [x - s*0.8*sg, y - 2.85, z - s + 0.6], [x + s*0.8*sg, y - 0.3, z - s + 0.6], 0.35); }
      T.hip('rt', x, z, 1, 0, s + 1.1, s + 1.1, y0 + 21, 2.2);
      ctx.tree(x + 9, z + 4, 6.5, 'raintree'); }
    // House No. 1 (1930s, Tudor style): rendered ground floor with granite quoins, half-timbered upper floor and steep gables, chimney
    { const r = C.vc, y0 = gyMin(ctx, r), b = obb(r), ux = b.ux, uz = b.uz, vx = -uz, vz = ux, P = (s, w) => [b.cx + ux*s + vx*w, b.cz + uz*s + vz*w], hl = b.L/2, hw = b.W/2;
      T.prism('gs', r, y0 - 1.5, y0 + 3.6); T.prism('wh', r, y0 + 3.6, y0 + 6.8);
      for (const [s, w] of [[-hl, -hw], [hl, -hw], [hl, hw], [-hl, hw]]){ const p = P(s*0.995, w*0.99); for (let k = 0; k < 6; k++) T.ob('gs', p[0], p[1], ux, uz, k % 2 ? 0.35 : 0.55, k % 2 ? 0.55 : 0.35, y0 + k*0.6, y0 + k*0.6 + 0.55); }
      facade(T, r, y0 + 3.6, y0 + 6.8, {fin:'tb', step:1.1, d:0.08, w:0.16}); facade(T, r, y0 + 3.6, y0 + 6.8, {band:'tb', fh:100, b0:0, bh:0.2, bd:0.08});
      facade(T, r, y0 + 0.9, y0 + 2.6, {fin:'wn', step:2.6, d:0.06, w:1.1});
      T.gab('rf', b.cx, b.cz, ux, uz, hl + 0.5, hw + 0.6, y0 + 6.8, 5.2, 'tb');
      for (const s of [-hl*0.45, hl*0.4]){ const p = P(s, hw*0.4); T.gab('rf', p[0], p[1], vx, vz, hw*0.95, 2.6, y0 + 6.2, 3.9, 'tb'); }
      const ch = P(-hl + 2.0, -hw*0.3); T.ob('ck', ch[0], ch[1], ux, uz, 0.6, 0.8, y0 + 5, y0 + 13.4); }
    { const r = C.rs, y0 = gyMin(ctx, r), b = obb(r); T.prism('wh', r, y0 - 1, y0 + 3.2); T.hip('rt', b.cx, b.cz, b.ux, b.uz, b.L/2 + 0.6, b.W/2 + 0.6, y0 + 3.2, 1.6); }
    for (const [pts] of C.bw) if (pts.length > 10) for (let k = 0; k < 8; k++){ const q = pAt(pts, plen(pts)*(k + 0.5)/8); ctx.lamp(q[0], Math.max(ctx.gy(q[0], q[1]), 0.3) + 2.8, q[1], [255, 222, 170]); }
    T.flush(g, {bw:'#8a7660', bb:'#6d5d4c', al:'#d2d6d8', pp:'#5d5448', st:'#7c766c', rt:'#5a5f63', gs:'#bfb6a6', wh:'#efe9dc', tb:'#2c2622', wn:{c:'#26282a', glow:'#ffd08a', gk:0.4}, rf:'#6b4a3c', ck:'#8a4a36'});
    return g;
  }}});
