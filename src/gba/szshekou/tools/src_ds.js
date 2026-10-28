
// ================= Sea World Culture and Arts Center (Design Society) =================
// Maki and Associates, opened 1-2 Dec 2017; 73 918 m2 on a 26 162 m2 site; a sculptural podium in white and green granite with a roof
// park (folded grass planes, two big stairs from the city and from Shekou Bay), and three cantilevered volumes in white aluminium
// panels (theatre: louvred double skin; restaurant: two-storey facade; multi-purpose hall: glazed double skin facing the sea)
// (archiposition, Azure, e-architect). Plan: the OSM building w740022003 and its parts (podium 2 levels, grass roof; three
// 4-level boxes with 2-level cantilevers; two skillion lawns). Heights are estimates: podium roof 14 m, boxes 31 m.
const DSS = {
  gran:{c:'#e6e3dc', m:0, lc:'#fff1dc', lk:0.45, e:0.6}, granG:'#b9c2b3', box:{c:'#f5f6f5', m:0, lc:'#f4f6ff', lk:0.55, e:0.75}, roof:'#e9eae8',
  glass:{c:'#566a78', glow:'#ffd7a0', gk:0.7}, glassD:{c:'#44535e', glow:'#ffc98a', gk:0.55}, mull:'#eef0ef', lawn:'#7d9a56', step:'#d7d2c6', louv:'#dfe1df',
  tr:'#6b553f', cr:'#55803f', lamp:{c:'#fff4dc', glow:'#ffe0ac', gk:1.5}
};
LANDMARKS.szdesignsociety = {zh:'海上世界文化艺术中心', en:'Sea World Culture and Arts Center (Design Society)', cat:'new', r:134, h:31,
  lt:{m:0, c:'#fff1dc', k:0.5, e:0.6},
  build(){
    const T = D.szdesignsociety, g = new THREE.Group(), B = Batch(), bs = baseOf(T, 134), gl = bs.gl;
    const PH = 14, BH = 31, CU = 14.6;
    const part = id => T.parts.find(p => p.id === id);
    let low = 0; for (const p of T.out) low = Math.min(low, gl(p[0], p[1]));
    const y0 = low - 0.8;
    // podium: granite walls with a glazed ground-floor band, the grass roof park
    const pod = part('w783232515').r;
    prism(B, DSS.gran, pod, y0, PH, {top:DSS.lawn});
    const G = grow(pod, 0.08);
    for (let i = 0; i < G.length; i++){ const a = G[i], b = G[(i + 1) % G.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 6) continue;
      const ex = (b[0] - a[0])/l, ez = (b[1] - a[1])/l;
      for (let d = 1.5; d < l - 1.5; d += 6){ const e = Math.min(l - 1.5, d + 4.6), A = [a[0] + ex*d, a[1] + ez*d], C = [a[0] + ex*e, a[1] + ez*e];
        B.q(DSS.glassD, [A[0], 0.4, A[1]], [C[0], 0.4, C[1]], [C[0], 5.6, C[1]], [A[0], 5.6, A[1]]);
        if (i % 3 === 1) B.q(DSS.glass, [A[0], 6.6, A[1]], [C[0], 6.6, C[1]], [C[0], 12.4, C[1]], [A[0], 12.4, A[1]]); }
      B.q(DSS.granG, [a[0], PH - 0.9, a[1]], [b[0], PH - 0.9, b[1]], [b[0], PH + 0.9, b[1]], [a[0], PH + 0.9, a[1]]);   // parapet band
    }
    // the folded lawns: skillion planes from the ground up to the roof park (roof:direction = the downhill side)
    for (const id of ['w783232516', 'w783232520']){
      const p = part(id), P = p.r, a = p.rd*PI/180, dx = Math.sin(a), dz = -Math.cos(a);
      let mn = Infinity, mx = -Infinity; for (const q of P){ const t = q[0]*dx + q[1]*dz; mn = Math.min(mn, t); mx = Math.max(mx, t); }
      const Y = (x, z) => 0.2 + (PH - 0.2)*(1 - (x*dx + z*dz - mn)/(mx - mn));
      prism(B, DSS.gran, P, y0, Y, {top:DSS.lawn});
      // a broad stair down the middle of the slope
      const c = centroid(P), wx = -dz, wz = dx; let w0 = Infinity, w1 = -Infinity; for (const q of P){ const t = (q[0] - c[0])*wx + (q[1] - c[1])*wz; w0 = Math.min(w0, t); w1 = Math.max(w1, t); }
      const sw = Math.min(14, (w1 - w0)*0.35), n = Math.round(PH/0.5);
      for (let k = 0; k < n; k++){ const t0 = mx - (mx - mn)*k/n, t1 = mx - (mx - mn)*(k + 1)/n, tm = (t0 + t1)/2, ys = 0.2 + (PH - 0.2)*(k + 1)/n;
        const cx = c[0] + dx*(tm - (c[0]*dx + c[1]*dz)), cz = c[1] + dz*(tm - (c[0]*dx + c[1]*dz));
        obox(B, DSS.step, cx, cz, dx, dz, Math.abs(t1 - t0) + 0.02, sw, ys - 0.5 - 0.6, ys + 0.05); }
    }
    // the small pavilion
    prism(B, DSS.glassD, part('w783232517').r, y0, 4.6, {top:DSS.roof});
    // three volumes: white body up to BH, cantilever (glass end faces with white mullions, louvres on the theatre)
    const boxes = [['w783232511', 'w783232512', 'louv'], ['w783232513', 'w783232514', 'rest'], ['w783232518', 'w783232519', 'sea']];
    for (const [bid, cid, kind] of boxes){
      const Pb = part(bid).r, Pc = part(cid).r;
      prism(B, DSS.box, Pb, PH - 0.2, BH, {top:DSS.roof});
      prism(B, DSS.roof, grow(Pb, -0.6), BH, BH + 1.1, {top:DSS.roof});
      // strip windows on the body
      const Gb = grow(Pb, 0.07);
      for (let i = 0; i < Gb.length; i++){ const a = Gb[i], b = Gb[(i + 1) % Gb.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 8) continue;
        for (const [ya, yb] of [[18.2, 20.0], [24.6, 26.4]]) B.q(DSS.glassD, [a[0], ya, a[1]], [b[0], ya, b[1]], [b[0], yb, b[1]], [a[0], yb, a[1]]); }
      // cantilever: soffit, glazed walls, white frame
      prism(B, kind === 'sea' ? DSS.glass : DSS.glassD, Pc, CU, BH - 0.6, {top:DSS.roof});
      cap(B, DSS.box, Pc, CU, true);
      prism(B, DSS.box, grow(Pc, 0.12), BH - 2.0, BH, {noTop:true});
      prism(B, DSS.box, grow(Pc, 0.12), CU, CU + 1.0, {noTop:true});
      const Gc = grow(Pc, 0.1);
      for (let i = 0; i < Gc.length; i++){ const a = Gc[i], b = Gc[(i + 1) % Gc.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]), ex = (b[0] - a[0])/l, ez = (b[1] - a[1])/l;
        const st = kind === 'louv' ? 0.9 : 3.0;
        for (let d = st; d < l; d += st){ const x = a[0] + ex*d, z = a[1] + ez*d, w = kind === 'louv' ? 0.18 : 0.12;
          B.q(kind === 'louv' ? DSS.louv : DSS.mull, [x - ex*w, CU + 1, z - ez*w], [x + ex*w, CU + 1, z + ez*w], [x + ex*w, BH - 2, z + ez*w], [x - ex*w, BH - 2, z - ez*w]); }
        if (kind === 'rest'){ for (const y of [CU + 1 + (BH - 3 - CU)/2]) B.q(DSS.mull, [a[0], y - 0.3, a[1]], [b[0], y - 0.3, b[1]], [b[0], y + 0.3, b[1]], [a[0], y + 0.3, a[1]]); }
      }
    }
    // the V-shaped aluminium element on the restaurant face (the cantilever's outer edge)
    { const Pc = part('w783232514').r; let best = null; for (let i = 0; i < Pc.length; i++){ const a = Pc[i], b = Pc[(i + 1) % Pc.length], m = [(a[0] + b[0])/2, (a[1] + b[1])/2], dd = Math.hypot(m[0], m[1]); if (!best || dd > best.d) best = {a, b, m, d:dd}; }
      const {a, b, m} = best, n = Math.hypot(m[0], m[1]), ox = m[0]/n*0.3, oz = m[1]/n*0.3, y1 = BH - 2, y0b = CU + 1;
      beam(B, DSS.mull, [a[0] + ox, y1, a[1] + oz], [m[0] + ox, y0b, m[1] + oz], 0.35); beam(B, DSS.mull, [b[0] + ox, y1, b[1] + oz], [m[0] + ox, y0b, m[1] + oz], 0.35); }
    // tree groups on the roof park and the lawns
    const P2in = grow(pod, -4), P6in = grow(pod, -6), rng = LMCTX.rng, TS = {tr:DSS.tr, cr:DSS.cr}, boxesP = boxes.map(b => grow(part(b[0]).r, 3));
    for (let k = 0, n = 0; k < 400 && n < 34; k++){ const x = -78 + rng()*156, z = -66 + rng()*136; if (!pip(pod, x, z) || boxesP.some(P => pip(P, x, z))) continue;
      if (!pip(P2in, x, z)) continue; lmTree(B, TS, x, PH, z, 5 + rng()*3, 2.2 + rng()*1.2); n++; }
    // lamps on the roof-park paths
    for (let k = 0, n = 0; k < 200 && n < 16; k++){ const x = -70 + rng()*140, z = -60 + rng()*120; if (!pip(P6in, x, z) || boxesP.some(P => pip(P, x, z))) continue; lampBox(B, DSS.lamp, x, PH + 3, z, 0.35); B.q(DSS.mull, [x, PH, z], [x + 0.1, PH, z], [x + 0.1, PH + 3, z], [x, PH + 3, z]); n++; }
    B.flush(g); return g; }};
SG_PLACES.push({type:'szdesignsociety', lat:D.szdesignsociety.lat, lon:D.szdesignsociety.lon, rot:0});

// ================= Shekou Cruise Center (蛇口邮轮中心, Prince Bay) =================
// Opened Nov 2016, architect Denis Laming; a triangular terminal building; 12 ferry berths and 2 cruise berths (Wikipedia). Plan
// and heights: OSM r12528133 and its parts: the glass hall w493093174 (height 64 m, skillion roof facing 337 deg, silver metal roof),
// the low wings and the ferry piers (6.8 m), the raised gangway links (3.1-6.8 m).
const CRS = {
  glass:{c:'#7d93a3', m:1, lc:'#e3ecff', lk:0.5, fh:4.5, cw:3.0}, roof:{c:'#cfd3d6', m:0, lc:'#eef3ff', lk:0.35}, frame:'#e4e6e6', wing:{c:'#dcdedd', m:1, lc:'#ffe6c4', lk:0.45},
  glassW:{c:'#5b6e7b', glow:'#ffd6a0', gk:0.5}, deck:'#bdb8ad', pile:'#a9a59c', lamp:{c:'#fff4dc', glow:'#ffe0ac', gk:1.6}
};
LANDMARKS.szcruise = {zh:'蛇口邮轮中心', en:'Shekou Cruise Center (Prince Bay)', cat:'new', r:182, h:64,
  lt:{m:1, c:'#e3ecff', k:0.5},
  build(){
    const T = D.szcruise, g = new THREE.Group(), B = Batch(), bs = baseOf(T, 182), gl = bs.gl;
    // the glass hall: skillion from the low north-north-west edge up to 64 m at the far edge
    const P = T.glass, a = 337*PI/180, dx = Math.sin(a), dz = -Math.cos(a);
    let mn = Infinity, mx = -Infinity, low = 0; for (const q of P){ const t = q[0]*dx + q[1]*dz; mn = Math.min(mn, t); mx = Math.max(mx, t); low = Math.min(low, gl(q[0], q[1])); }
    const Y = (x, z) => 7 + (64 - 7)*(1 - (x*dx + z*dz - mn)/(mx - mn)), y0 = low - 0.6;
    prism(B, CRS.glass, P, y0, Y, {top:CRS.roof});
    // roof edge band and the glazing grid (vertical mullions every 6 m)
    for (let i = 0; i < P.length; i++){ const p = P[i], q = P[(i + 1) % P.length], l = Math.hypot(q[0] - p[0], q[1] - p[1]); if (l < 0.5) continue;
      const ex = (q[0] - p[0])/l, ez = (q[1] - p[1])/l, nx = ez, nz = -ex;
      B.q(CRS.frame, [p[0], Y(p[0], p[1]) - 0.8, p[1]], [q[0], Y(q[0], q[1]) - 0.8, q[1]], [q[0], Y(q[0], q[1]) + 0.3, q[1]], [p[0], Y(p[0], p[1]) + 0.3, p[1]]);
      for (let d = 0; d < l; d += 6){ const x = p[0] + ex*d, z = p[1] + ez*d, yt = Y(x, z) - 0.8; obox(B, CRS.frame, x, z, ex, ez, 0.35, 0.5, y0, yt); } }
    // roof ribs along the slope
    for (let s = -150; s <= 150; s += 12){ const wx = -dz, wz = dx, pts = [];
      for (let t = mn; t <= mx; t += 4){ const x = wx*s + dx*t, z = wz*s + dz*t; if (pip(P, x, z)) pts.push([x, z]); }
      if (pts.length > 1){ const A = pts[0], C = pts[pts.length - 1]; beam(B, CRS.frame, [A[0], Y(A[0], A[1]) + 0.25, A[1]], [C[0], Y(C[0], C[1]) + 0.25, C[1]], 0.3); } }
    // the other parts: wings, ferry piers, raised links
    for (const [b0, b1, R] of T.parts){
      if (b1 > 60 || R.some(q => Math.hypot(q[0], q[1]) > 175)) continue;
      const lo = b0 > 0 ? b0 : Math.min(y0, Math.min(...R.map(q => gl(q[0], q[1]))) - 1.5);
      if (b0 > 0){ prism(B, CRS.wing, R, b0, b1, {top:CRS.roof}); cap(B, CRS.deck, R, b0, true); }
      else {
        const wet = R.some(q => gl(q[0], q[1]) < -0.4);
        if (wet){ // pier building on piles
          prism(B, CRS.deck, R, 0.0, 1.2, {top:CRS.deck}); prism(B, CRS.wing, grow(R, -1.0), 1.2, b1, {top:CRS.roof});
          const O = orect(R); for (let s = -O.L/2 + 4; s < O.L/2; s += 10) for (const t of [-O.W/2 + 1, O.W/2 - 1]){ const x = O.cx + O.ux*s - O.uz*t, z = O.cz + O.uz*s + O.ux*t; abox(B, CRS.pile, x - 0.5, x + 0.5, lo - 2, 0.05, z - 0.5, z + 0.5); }
        } else prism(B, CRS.wing, R, lo, b1, {top:CRS.roof});
        // glazing band on the pier buildings
        const G = grow(R, 0.07); for (let i = 0; i < G.length; i++){ const p = G[i], q = G[(i + 1) % G.length]; if (Math.hypot(q[0] - p[0], q[1] - p[1]) < 4) continue; B.q(CRS.glassW, [p[0], 2.2, p[1]], [q[0], 2.2, q[1]], [q[0], b1 - 1.0, q[1]], [p[0], b1 - 1.0, p[1]]); }
      }
    }
    // apron lamps along the piers
    for (const [b0, b1, R] of T.parts){ if (b0 > 0 || b1 > 60 || R.some(q => Math.hypot(q[0], q[1]) > 175)) continue; const O = orect(R); if (O.L < 60) continue;
      for (let s = -O.L/2 + 6; s < O.L/2; s += 18){ const x = O.cx + O.ux*s - O.uz*(O.W/2 + 3), z = O.cz + O.uz*s + O.ux*(O.W/2 + 3); abox(B, CRS.frame, x - 0.12, x + 0.12, 0, 9, z - 0.12, z + 0.12); lampBox(B, CRS.lamp, x - 0.3, 9, z - 0.3, 0.6); } }
    B.flush(g); return g; }};
SG_PLACES.push({type:'szcruise', lat:D.szcruise.lat, lon:D.szcruise.lon, rot:0});
