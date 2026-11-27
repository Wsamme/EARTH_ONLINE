
// ---- 10_model.js ----
/* ================= the mech's model: skeleton, a small hard-surface mesh builder, the parts, LODs, lamps =================
   Model space: metres, y up, z forward, x = the mech's LEFT, origin on the ground between the feet (as the creature's model).
   Placed in the world by the group: position (X, ground, -Y), rotation.y = PI - hdg (hdg = compass heading). Rest pose: standing,
   arms hanging. Every bone rests at the identity rotation; geometry is authored in rest model space and bound rigidly (one bone per
   vertex) to a THREE.Skeleton shared by the three LOD meshes and the lamp mesh. */
const MK = (() => {
  // ---- the skeleton: [name, parent, rest x, y, z]
  const BS = [['root', null, 0, 37, 0], ['waist', 'root', 0, 41.5, 0], ['chest', 'waist', 0, 50, 0.5], ['head', 'chest', 0, 62.6, 2.2]];
  for (const [s, n] of [[1, 'L'], [-1, 'R']]){
    BS.push(['clav' + n, 'chest', s*9, 58, 0], ['uarm' + n, 'clav' + n, s*15.5, 57.5, 0], ['farm' + n, 'uarm' + n, s*16.5, 42.5, 0.3], ['hand' + n, 'farm' + n, s*17, 29.8, 0.8],
      ['fing' + n, 'hand' + n, s*17.6, 25.3, 0.9], ['thumb' + n, 'hand' + n, s*16.2, 28.6, 2.6]);
  }
  for (const [s, n] of [[1, 'L'], [-1, 'R']]) BS.push(['thigh' + n, 'root', s*7.5, 35, 0], ['shin' + n, 'thigh' + n, s*8, 20, 0.6], ['foot' + n, 'shin' + n, s*8.5, 5.5, -1], ['toe' + n, 'foot' + n, s*8.5, 2.2, 6.2]);
  const BI = {}; BS.forEach((b, i) => { BI[b[0]] = i; });
  const NB = BS.length, PAR = BS.map(b => b[1] === null ? -1 : BI[b[1]]), REST = BS.map(b => [b[2], b[3], b[4]]);
  const OFF = REST.map((r, i) => PAR[i] < 0 ? r.slice() : [r[0] - REST[PAR[i]][0], r[1] - REST[PAR[i]][1], r[2] - REST[PAR[i]][2]]);
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], len = a => Math.hypot(a[0], a[1], a[2]);
  const L_TH = len(sub(REST[BI.shinL], REST[BI.thighL])), L_SH = len(sub(REST[BI.footL], REST[BI.shinL]));
  const L_UA = len(sub(REST[BI.farmL], REST[BI.uarmL])), L_FA = len(sub(REST[BI.handL], REST[BI.farmL]));
  const ANK = REST[BI.footL][1];          // ankle height above the sole
  // ---- colours (linear-ish sRGB 0-1); lamps
  const C = {WHITE:[0.80, 0.78, 0.72], WHITE2:[0.70, 0.68, 0.62], DARK:[0.13, 0.14, 0.15], GUN:[0.30, 0.31, 0.33], STEEL:[0.52, 0.53, 0.54], ORANGE:[0.90, 0.40, 0.09], GLASS:[0.05, 0.10, 0.12], RUB:[0.07, 0.07, 0.07]};
  const LC = {LAMP:[1.0, 0.96, 0.86], CYAN:[0.55, 0.95, 1.0], AMBER:[1.0, 0.62, 0.18], RED:[1.0, 0.2, 0.14], VENT:[1.0, 0.42, 0.12]};
  // ---------------- the mesh builder ----------------
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _u = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3();
  function mat(x, y, z, rx, ry, rz){ _e.set(rx || 0, ry || 0, rz || 0, 'XYZ'); _q.setFromEuler(_e); _p.set(x, y, z); _s.set(1, 1, 1); return _m.compose(_p, _q, _s).elements.slice(); }
  function matAB(p, q){ _d.set(q[0] - p[0], q[1] - p[1], q[2] - p[2]); const L = _d.length(); _d.normalize(); _q.setFromUnitVectors(_u, _d); _p.set((p[0] + q[0])/2, (p[1] + q[1])/2, (p[2] + q[2])/2); _s.set(1, 1, 1); return {M:_m.compose(_p, _q, _s).elements.slice(), L}; }
  const tp = (e, v) => [e[0]*v[0] + e[4]*v[1] + e[8]*v[2] + e[12], e[1]*v[0] + e[5]*v[1] + e[9]*v[2] + e[13], e[2]*v[0] + e[6]*v[1] + e[10]*v[2] + e[14]];
  const tn = (e, v) => { const x = e[0]*v[0] + e[4]*v[1] + e[8]*v[2], y = e[1]*v[0] + e[5]*v[1] + e[9]*v[2], z = e[2]*v[0] + e[6]*v[1] + e[10]*v[2], l = Math.hypot(x, y, z) || 1; return [x/l, y/l, z/l]; };
  function Bld(seed){ return {p:[], n:[], c:[], s:[], tris:0, rng:mulb(seed)}; }
  // convex faces [{v:[[x,y,z]...], n:[[...]] | null}] -> triangles (outward by the centroid test; flat normals unless given)
  function add(B, faces, e, col, bone, lit){
    let cx = 0, cy = 0, cz = 0, cn = 0; for (const f of faces) for (const v of f.v){ cx += v[0]; cy += v[1]; cz += v[2]; cn++; }
    const Cw = tp(e, [cx/cn, cy/cn, cz/cn]), jit = lit ? 1 : 1 + (B.rng() - 0.5)*0.07;
    for (const f of faces){
      const V = f.v.map(v => tp(e, v)), n = V.length; let nx = 0, ny = 0, nz = 0, fx = 0, fy = 0, fz = 0;
      for (let i = 0; i < n; i++){ const a = V[i], b = V[(i + 1) % n]; nx += (a[1] - b[1])*(a[2] + b[2]); ny += (a[2] - b[2])*(a[0] + b[0]); nz += (a[0] - b[0])*(a[1] + b[1]); fx += a[0]; fy += a[1]; fz += a[2]; }
      const l = Math.hypot(nx, ny, nz); if (l < 1e-9) continue; nx /= l; ny /= l; nz /= l;
      let N = f.n ? f.n.map(q => tn(e, q)) : null;
      if ((fx/n - Cw[0])*nx + (fy/n - Cw[1])*ny + (fz/n - Cw[2])*nz < 0){ V.reverse(); if (N) N.reverse(); nx = -nx; ny = -ny; nz = -nz; }
      for (let i = 1; i + 1 < n; i++) for (const k of [0, i, i + 1]){ const v = V[k]; B.p.push(v[0], v[1], v[2]);
        if (N) B.n.push(N[k][0], N[k][1], N[k][2]); else B.n.push(nx, ny, nz);
        const g = lit ? 1 : (0.74 + 0.26*sstep(0, 24, v[1]))*jit; B.c.push(Math.min(255, col[0]*g*255) | 0, Math.min(255, col[1]*g*255) | 0, Math.min(255, col[2]*g*255) | 0); B.s.push(bone); }
      B.tris += n - 2;
    }
  }
  // shapes (local space)
  function boxF(hx, hy, hz, b, tx, tz, zo){
    tx = tx || 1; tz = tz || 1; zo = zo || 0; b = Math.min(b || 0, hx*0.9, hy*0.9, hz*0.9);
    const T = (x, y, z) => { const f = (y + hy)/(2*hy); return [x*lerp(1, tx, f), y, z*lerp(1, tz, f) + zo*f]; };
    const F = [];
    if (b <= 1e-4){ const c = (sx, sy, sz) => T(sx*hx, sy*hy, sz*hz);
      for (const s of [-1, 1]){ F.push({v:[c(s, -1, -1), c(s, 1, -1), c(s, 1, 1), c(s, -1, 1)]}, {v:[c(-1, s, -1), c(1, s, -1), c(1, s, 1), c(-1, s, 1)]}, {v:[c(-1, -1, s), c(1, -1, s), c(1, 1, s), c(-1, 1, s)]}); }
      return F; }
    const V = (sx, sy, sz, a) => a === 0 ? T(sx*hx, sy*(hy - b), sz*(hz - b)) : a === 1 ? T(sx*(hx - b), sy*hy, sz*(hz - b)) : T(sx*(hx - b), sy*(hy - b), sz*hz);
    for (const s of [-1, 1]){
      F.push({v:[V(s, -1, -1, 0), V(s, 1, -1, 0), V(s, 1, 1, 0), V(s, -1, 1, 0)]}, {v:[V(-1, s, -1, 1), V(1, s, -1, 1), V(1, s, 1, 1), V(-1, s, 1, 1)]}, {v:[V(-1, -1, s, 2), V(1, -1, s, 2), V(1, 1, s, 2), V(-1, 1, s, 2)]});
    }
    // edges: along z (x/y signs), along y (x/z signs), along x (y/z signs)
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) F.push({v:[V(sx, sy, -1, 0), V(sx, sy, 1, 0), V(sx, sy, 1, 1), V(sx, sy, -1, 1)]});
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) F.push({v:[V(sx, -1, sz, 0), V(sx, 1, sz, 0), V(sx, 1, sz, 2), V(sx, -1, sz, 2)]});
    for (const sy of [-1, 1]) for (const sz of [-1, 1]) F.push({v:[V(-1, sy, sz, 1), V(1, sy, sz, 1), V(1, sy, sz, 2), V(-1, sy, sz, 2)]});
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) F.push({v:[V(sx, sy, sz, 0), V(sx, sy, sz, 1), V(sx, sy, sz, 2)]});
    return F;
  }
  function cylF(r0, r1, h, seg, smooth, caps){
    const F = [], sl = (r0 - r1)/h, P = (r, y, a) => [Math.cos(a)*r, y, Math.sin(a)*r], Nn = a => { const l = Math.hypot(1, sl); return [Math.cos(a)/l, sl/l, Math.sin(a)/l]; };
    const bot = [], top = [];
    for (let i = 0; i < seg; i++){ const a0 = i/seg*TAU, a1 = (i + 1)/seg*TAU;
      F.push({v:[P(r0, -h/2, a0), P(r0, -h/2, a1), P(r1, h/2, a1), P(r1, h/2, a0)], n:smooth ? [Nn(a0), Nn(a1), Nn(a1), Nn(a0)] : null});
      bot.push(P(r0, -h/2, a0)); top.push(P(r1, h/2, a0)); }
    if (caps !== false){ if (r0 > 1e-3) F.push({v:bot}); if (r1 > 1e-3) F.push({v:top}); }
    return F;
  }
  function sphF(r, seg){
    const F = [], rs = Math.max(3, seg >> 1), P = (i, j) => { const th = j/rs*PI, ph = i/seg*TAU; return [Math.sin(th)*Math.cos(ph), Math.cos(th), Math.sin(th)*Math.sin(ph)]; };
    for (let j = 0; j < rs; j++) for (let i = 0; i < seg; i++){
      const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1), sc = v => [v[0]*r, v[1]*r, v[2]*r];
      if (j === 0) F.push({v:[sc(a), sc(c), sc(d)], n:[a, c, d]}); else if (j === rs - 1) F.push({v:[sc(a), sc(b), sc(c)], n:[a, b, c]}); else F.push({v:[sc(a), sc(b), sc(c), sc(d)], n:[a, b, c, d]}); }
    return F;
  }
  // ---------------- the parts ----------------
  // L: level of detail 0 (full) / 1 / 2. Returns {B (body), LB (lamps), lamps: [{bone, p:[x,y,z], col, s}] (glow sprites, rest space)}
  function parts(L){
    const B = Bld(7), LB = Bld(9), lamps = [];
    const sg = n => L === 0 ? n : L === 1 ? Math.max(6, Math.round(n*0.5)) : Math.max(5, Math.round(n*0.3));
    const bv = b => L === 2 ? 0 : b;
    const box = (bn, col, x, y, z, hx, hy, hz, o, T) => { o = o || {}; add(T || B, boxF(hx, hy, hz, bv(o.b || 0), o.tx, o.tz, o.zo), mat(x, y, z, o.rx, o.ry, o.rz), col, BI[bn], T === LB); };
    const cyl = (bn, col, x, y, z, r0, r1, h, seg, o, T) => { o = o || {}; add(T || B, cylF(r0, r1, h, sg(seg), !!o.sm, o.caps), mat(x, y, z, o.rx, o.ry, o.rz), col, BI[bn], T === LB); };
    const cab = (bn, col, p, q, r0, r1, seg, sm) => { const m = matAB(p, q); add(B, cylF(r0, r1, m.L, sg(seg), !!sm), m.M, col, BI[bn]); };
    const sph = (bn, col, x, y, z, r, seg) => add(B, sphF(r, sg(seg)), mat(x, y, z), col, BI[bn]);
    const lamp = (bn, col, x, y, z, hx, hy, hz, s, o) => { box(bn, col, x, y, z, hx, hy, hz, o, LB); lamps.push({bone:BI[bn], p:[x, y, z], col, s:s || 4}); };
    const D0 = L === 0, D1 = L <= 1;
    const rivets = (bn, pts, ax) => { if (!D0) return; for (const p of pts) cyl(bn, C.STEEL, p[0], p[1], p[2], 0.22, 0.22, 0.3, 6, ax === 'x' ? {rz:PI/2} : ax === 'y' ? {} : {rx:PI/2}); };
    // ===== pelvis (root) and waist
    box('root', C.GUN, 0, 36.6, 0, 7.4, 3.0, 5.4, {b:1.0});
    box('root', C.WHITE, 0, 34.6, 4.7, 3.2, 3.4, 1.3, {b:0.5, tx:1.3});
    for (const s of [1, -1]){ box('root', C.WHITE, s*5.2, 35.2, 5.5, 2.4, 3.2, 0.7, {b:0.35, rx:-0.14}); if (D1) box('root', C.ORANGE, s*5.2, 37.6, 6.05, 2.0, 0.28, 0.12, {rx:-0.14}); }
    box('root', C.WHITE2, 0, 36.2, -5.7, 5.6, 2.8, 0.9, {b:0.4, rx:0.12});
    if (D0) for (let i = 0; i < 4; i++) box('root', C.DARK, -3 + i*2, 33.4, -5.2, 0.35, 0.8, 0.5);
    cyl('waist', C.GUN, 0, 40.6, 0, 5.3, 5.7, 4.6, 28, {sm:true});
    if (D1) for (const y of [39.0, 42.3]) cyl('waist', C.DARK, 0, y, 0, 5.95, 5.95, 0.5, 20, {sm:true});
    for (let i = 0; i < 3; i++) box('waist', C.WHITE, 0, 39.0 + i*1.75, 5.2 - i*0.05, 3.4 - i*0.2, 0.75, 0.9, {b:0.3});
    if (D0) for (const s of [1, -1]){ cab('waist', C.STEEL, [s*4.2, 38.0, 3.2], [s*4.6, 44.5, 3.4], 0.35, 0.35, 8); cab('waist', C.DARK, [s*4.2, 38.0, 3.2], [s*4.35, 41.0, 3.3], 0.6, 0.6, 8); cab('waist', C.STEEL, [s*4.0, 38.2, -3.6], [s*4.4, 44.5, -3.8], 0.35, 0.35, 8); }
    // ===== chest
    box('chest', C.WHITE, 0, 51.2, -0.2, 10.4, 6.4, 6.8, {b:1.4, tx:1.14, zo:0.6});
    box('chest', C.GUN, 0, 45.3, 0.2, 8.7, 1.5, 6.0, {b:0.6});
    box('chest', C.WHITE, 0, 51.6, 6.4, 8.2, 5.0, 1.3, {b:0.6, tx:1.1, rx:-0.12});
    box('chest', C.WHITE2, 0, 50.0, 7.5, 1.0, 3.6, 0.5, {b:0.2, rx:-0.12});
    for (const s of [1, -1]){ box('chest', C.ORANGE, s*7.3, 55.4, 6.75, 1.5, 0.22, 0.14, {rz:s*0.5, rx:-0.12}); box('chest', C.ORANGE, s*8.1, 54.5, 6.85, 1.2, 0.22, 0.14, {rz:s*0.5, rx:-0.12}); }
    box('chest', C.DARK, 0, 53.7, 7.75, 3.6, 1.9, 0.45, {b:0.3, rx:-0.12});
    lamp('chest', LC.CYAN, 0, 54.25, 8.2, 2.7, 0.32, 0.1, 3, {rx:-0.12});
    if (D0) for (const x of [-3.0, 3.0]) for (const y of [52.2, 55.2]) cyl('chest', C.STEEL, x, y, 8.15, 0.3, 0.3, 0.35, 8, {rx:PI/2 - 0.12});
    // heat vents (grilles; glow at night)
    for (const s of [1, -1]){
      box('chest', C.DARK, s*7.9, 48.6, 6.35, 1.9, 2.8, 0.5, {b:0.2, rx:-0.1});
      lamp('chest', LC.VENT, s*7.9, 48.6, 6.55, 1.5, 2.4, 0.08, 0, {rx:-0.1});
      if (D1) for (let i = 0; i < (D0 ? 6 : 3); i++){ const n = D0 ? 6 : 3; box('chest', C.GUN, s*7.9, 46.4 + (i + 0.5)*4.4/n, 6.85 - (i/n)*0.4, 1.8, 0.16, 0.25, {rx:-0.55}); }
      // chest floodlights
      box('chest', C.DARK, s*7.0, 55.9, 7.0, 1.2, 0.8, 0.6, {b:0.2});
      lamp('chest', LC.LAMP, s*7.0, 55.9, 7.62, 0.95, 0.55, 0.06, 5);
    }
    // collar, shoulder sockets
    cyl('chest', C.GUN, 0, 58.2, 0.6, 4.3, 3.9, 1.8, 18, {sm:true});
    box('chest', C.WHITE, 0, 58.6, 4.3, 5.0, 1.5, 1.2, {b:0.5, rx:-0.2});
    for (const s of [1, -1]){ box('chest', C.WHITE, s*5.7, 59.2, 1.0, 1.0, 2.2, 3.5, {b:0.4, rz:-s*0.12}); cyl('chest', C.GUN, s*12.4, 57.5, 0, 3.4, 3.4, 3.2, 24, {rz:PI/2, sm:true}); }
    // power pack with radiator fins and two exhaust stacks
    box('chest', C.GUN, 0, 52.2, -8.4, 7.4, 6.4, 2.4, {b:0.8});
    box('chest', C.WHITE2, 0, 57.0, -6.4, 6.0, 1.8, 2.0, {b:0.5});
    if (D1) for (let i = 0; i < (D0 ? 9 : 4); i++){ const n = D0 ? 9 : 4; box('chest', C.DARK, -6 + (i + 0.5)*12/n, 51.6, -11.2, 0.22, 4.6, 0.85); }
    for (const s of [1, -1]){ cyl('chest', C.GUN, s*4.6, 57.8, -9.3, 1.9, 1.7, 3.0, 12); cyl('chest', C.STEEL, s*4.6, 62.6, -9.6, 1.05, 1.0, 7.6, 14, {sm:true}); if (D1) cyl('chest', C.DARK, s*4.6, 66.5, -9.6, 1.25, 1.25, 0.45, 14); if (D0) box('chest', C.DARK, s*4.6, 66.95, -9.95, 0.9, 0.08, 0.75, {rx:-0.4}); }
    lamp('chest', LC.AMBER, 0, 59.2, -10.6, 0.55, 0.45, 0.4, 4);
    if (D0){ const pts = []; for (const x of [-8.6, -4.3, 0, 4.3, 8.6]) pts.push([x, 56.4, 6.85]); for (const x of [-7.6, 7.6]) for (const y of [47.0, 50.0, 53.0]) pts.push([x*0.94, y, 7.5 - (y - 47)*0.12]); rivets('chest', pts, 'z');
      for (const s of [1, -1]) box('chest', C.DARK, s*10.6, 51.2, 0, 0.08, 4.8, 5.4); box('chest', C.DARK, 0, 46.9, 6.95, 7.0, 0.1, 0.12); }
    // ===== head
    cyl('head', C.DARK, 0, 61.4, 1.6, 1.9, 1.9, 2.6, 12);
    box('head', C.WHITE, 0, 64.4, 2.4, 3.6, 2.2, 3.4, {b:0.6, tx:0.86, tz:0.9, zo:-0.4});
    box('head', C.DARK, 0, 64.6, 5.65, 3.05, 0.92, 0.4, {b:0.15});
    box('head', C.GLASS, 0, 64.6, 5.95, 2.8, 0.62, 0.16);
    for (const x of [-1.7, 0, 1.7]) lamp('head', LC.CYAN, x, 64.6, 6.12, x ? 0.42 : 0.6, 0.28, 0.06, x ? 3 : 4);
    box('head', C.GUN, 0, 62.9, 5.2, 2.6, 0.7, 0.9, {b:0.25, tx:0.8});
    box('head', C.WHITE2, 0, 65.85, 5.2, 3.3, 0.45, 1.0, {b:0.2});
    cyl('head', C.GUN, 0, 66.75, 0.9, 1.4, 1.2, 0.55, 12);
    for (const s of [1, -1]){ cyl('head', C.GUN, s*3.75, 64.2, 2.2, 1.1, 1.1, 1.2, 12, {rz:PI/2}); lamp('head', LC.AMBER, s*4.38, 64.2, 2.2, 0.06, 0.3, 0.3, 2); }
    cyl('head', C.DARK, 2.8, 68.6, 0.0, 0.12, 0.08, 4.6, 4); if (D1) cyl('head', C.DARK, 3.3, 67.7, -0.6, 0.1, 0.07, 3.0, 4);
    if (D1){ cyl('head', C.DARK, -3.6, 66.6, 1.0, 0.18, 0.18, 1.6, 6); cyl('head', C.GUN, -3.9, 67.6, 1.3, 0.2, 1.5, 0.55, 14, {rx:-0.6, rz:0.35}); }
    // ===== arms (s = +1 left, -1 right)
    for (const [s, n] of [[1, 'L'], [-1, 'R']]){
      const cl = 'clav' + n, ua = 'uarm' + n, fa = 'farm' + n, ha = 'hand' + n, fi = 'fing' + n, th = 'thumb' + n;
      // shoulder block with the missile pod and a floodlight
      box(cl, C.WHITE, s*16.4, 61.0, 0, 4.8, 3.3, 5.5, {b:1.2, tx:0.84, tz:0.86, rz:s*0.1});
      box(cl, C.WHITE2, s*20.9, 58.4, 0, 0.9, 3.7, 5.0, {b:0.4, rz:s*0.22});
      if (D1) for (const z of [-2.2, 2.2]) box(cl, C.ORANGE, s*16.4, 64.32, z, 3.9, 0.08, 0.45, {rz:s*0.1});
      box(cl, C.GUN, s*15.2, 65.4, -2.0, 3.0, 1.6, 3.2, {b:0.4});
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) cyl(cl, C.DARK, s*15.2 + (j - 0.5)*2.6, 67.05, -2.0 + (i - 1)*2.05, 0.82, 0.82, 0.3, 6);
      lamp(cl, LC.RED, s*17.9, 65.9, 1.0, 0.18, 0.18, 0.18, 1.5);
      box(cl, C.DARK, s*17.3, 59.3, 5.7, 1.3, 0.9, 0.6, {b:0.2});
      lamp(cl, LC.LAMP, s*17.3, 59.3, 6.32, 1.0, 0.62, 0.06, 6);
      if (D0) rivets(cl, [[s*13.0, 63.0, 4.7], [s*16.4, 63.4, 4.65], [s*19.6, 62.6, 4.4]], 'z');
      // upper arm
      sph(ua, C.GUN, s*15.5, 57.5, 0, 3.3, 22);
      box(ua, C.GUN, s*16.0, 50.0, 0, 2.6, 6.0, 2.7, {b:0.5});
      box(ua, C.WHITE, s*16.3, 50.8, 0.5, 3.0, 4.6, 3.2, {b:0.9, tx:1.12, tz:1.08});
      if (D0){ cab(ua, C.STEEL, [s*16.0, 54.5, -3.0], [s*16.4, 44.5, -2.6], 0.4, 0.4, 8); cab(ua, C.DARK, [s*16.0, 54.5, -3.0], [s*16.2, 49.5, -2.8], 0.7, 0.7, 8); }
      cyl(ua, C.GUN, s*16.5, 42.5, 0.3, 2.6, 2.6, 5.4, 24, {rz:PI/2, sm:true});
      if (D0) for (const sx of [1, -1]) cyl(ua, C.STEEL, s*16.5 + sx*2.75, 42.5, 0.3, 1.0, 1.0, 0.3, 6, {rz:PI/2});
      // forearm (gauntlet: wider at the wrist)
      box(fa, C.WHITE2, s*16.5, 43.0, -2.6, 2.4, 2.3, 0.7, {b:0.3});
      box(fa, C.WHITE, s*16.8, 35.8, 0.6, 3.3, 6.0, 3.5, {b:0.9, tx:0.84, tz:0.88});
      box(fa, C.GUN, s*16.8, 30.6, 0.8, 3.65, 0.7, 3.85, {b:0.25});
      if (D1) box(fa, C.ORANGE, s*16.8, 33.6, 4.2, 2.2, 0.28, 0.12);
      if (D0){ cab(fa, C.STEEL, [s*14.0, 41.0, 2.2], [s*14.1, 32.0, 2.6], 0.42, 0.42, 8); cab(fa, C.DARK, [s*14.0, 41.0, 2.2], [s*14.05, 36.5, 2.4], 0.75, 0.75, 8); }
      if (s < 0){
        // the beam emitter (right forearm): barrel, coils, muzzle; glow strips
        cyl(fa, C.DARK, s*16.8, 34.6, 4.75, 1.3, 1.3, 9.0, 16, {sm:true});
        for (let i = 0; i < (D0 ? 4 : D1 ? 2 : 0); i++) cyl(fa, C.GUN, s*16.8, 37.6 - i*(D0 ? 2.0 : 4.0), 4.75, 1.65, 1.65, 0.55, 16);
        cyl(fa, C.STEEL, s*16.8, 29.7, 4.75, 1.15, 1.5, 1.2, 16);
        lamp(fa, LC.CYAN, s*16.8, 29.05, 4.75, 0.75, 0.08, 0.75, 5);
        lamp(fa, LC.CYAN, s*16.8, 35.0, 6.08, 0.14, 3.0, 0.06, 0);
        box(fa, C.GUN, s*16.8, 39.6, 3.4, 1.5, 1.0, 1.4, {b:0.2});
      } else {
        // the armour plate (left forearm) with marker lamps
        box(fa, C.WHITE2, s*20.6, 36.4, 0.6, 0.7, 7.2, 4.5, {b:0.4});
        if (D1) box(fa, C.ORANGE, s*21.32, 36.4, 4.75, 0.08, 6.6, 0.3);
        lamp(fa, LC.AMBER, s*21.36, 42.0, 3.6, 0.06, 0.32, 0.32, 2); lamp(fa, LC.AMBER, s*21.36, 31.0, 3.6, 0.06, 0.32, 0.32, 2);
      }
      // hand: palm, back plate, the finger block (a closed fist; opens for a grab), thumb
      box(ha, C.GUN, s*17.0, 27.6, 0.9, 2.9, 2.3, 2.5, {b:0.5});
      box(ha, C.WHITE2, s*19.85, 27.8, 0.9, 0.5, 2.1, 2.4, {b:0.2});
      box(fi, C.GUN, s*15.9, 25.0, 0.9, 1.7, 1.8, 2.45, {b:0.45});
      if (D1) for (const z of [-0.75, 0.9, 2.55]) box(fi, C.DARK, s*15.15, 25.0, z, 0.95, 1.85, 0.12);
      if (D0) for (const z of [-0.75, 0.9, 2.55]) box(fi, C.STEEL, s*17.1, 23.35, z, 0.55, 0.3, 0.55, {b:0.1});
      box(th, C.GUN, s*15.7, 27.5, 3.0, 0.75, 1.6, 0.75, {b:0.2, rz:-s*0.3});
    }
    // ===== legs
    for (const [s, n] of [[1, 'L'], [-1, 'R']]){
      const tg = 'thigh' + n, sh = 'shin' + n, ft = 'foot' + n, to = 'toe' + n;
      sph(tg, C.GUN, s*7.5, 35, 0, 3.3, 22);
      box(tg, C.GUN, s*7.8, 28.0, 0.2, 3.3, 6.4, 3.5, {b:0.7, tx:1.1, tz:1.08});
      box(tg, C.WHITE, s*7.9, 28.6, 2.4, 3.5, 5.4, 1.9, {b:0.8, tx:1.08});
      box(tg, C.WHITE2, s*11.4, 29.4, 0.3, 0.8, 4.8, 3.3, {b:0.3});
      if (D1) box(tg, C.ORANGE, s*12.22, 29.4, 0.3, 0.08, 3.8, 0.4);
      box(tg, C.WHITE, s*11.7, 35.4, 0, 1.1, 2.9, 4.0, {b:0.4, rz:s*0.1});
      if (D0){ cab(tg, C.STEEL, [s*7.4, 33.0, -3.2], [s*7.9, 22.0, -2.6], 0.5, 0.5, 8); cab(tg, C.DARK, [s*7.4, 33.0, -3.2], [s*7.6, 28.0, -2.9], 0.85, 0.85, 8); rivets(tg, [[s*6.0, 33.0, 4.0], [s*9.8, 33.0, 4.0], [s*6.2, 24.5, 4.1], [s*9.6, 24.5, 4.1]], 'z'); }
      cyl(sh, C.GUN, s*8.0, 20.0, 0.6, 2.7, 2.7, 6.3, 24, {rz:PI/2, sm:true});
      if (D0) for (const sx of [1, -1]) cyl(sh, C.STEEL, s*8.0 + sx*3.2, 20.0, 0.6, 1.1, 1.1, 0.3, 6, {rz:PI/2});
      box(sh, C.ORANGE, s*8.0, 21.0, 3.6, 3.0, 2.7, 1.4, {b:0.7, tx:0.8});
      box(sh, C.GUN, s*8.3, 13.0, -0.2, 3.3, 6.9, 3.4, {b:0.7, tx:0.95});
      box(sh, C.WHITE, s*8.3, 13.6, 2.55, 3.5, 5.9, 1.5, {b:0.6, tx:1.08});
      box(sh, C.WHITE2, s*8.3, 14.6, -3.4, 2.8, 4.4, 1.5, {b:0.6, tx:1.1});
      for (const dx of [1.4, -1.4]){ cab(sh, C.STEEL, [s*8.3 + dx, 18.5, -2.4], [s*8.4 + dx, 8.2, -3.2], 0.55, 0.55, 8); if (D1) cab(sh, C.DARK, [s*8.3 + dx, 18.5, -2.4], [s*8.35 + dx, 13.0, -2.8], 0.85, 0.85, 8); }
      lamp(sh, LC.AMBER, s*8.3, 17.6, 4.12, 0.5, 0.22, 0.06, 2);
      if (D0) rivets(sh, [[s*6.0, 18.8, 4.05], [s*10.6, 18.8, 4.05], [s*6.2, 8.4, 3.9], [s*10.4, 8.4, 3.9]], 'z');
      // ankle, foot, toe
      cyl(ft, C.DARK, s*8.5, 5.5, -1, 2.3, 2.3, 5.2, 14, {rz:PI/2, sm:true});
      for (const dx of [3.05, -3.05]) box(ft, C.WHITE2, s*8.5 + dx, 6.0, -1, 0.55, 2.2, 2.6, {b:0.25});
      box(ft, C.WHITE, s*8.5, 2.6, 0.0, 4.4, 2.2, 5.6, {b:0.7, tx:0.78, tz:0.82, zo:-0.6});
      box(ft, C.RUB, s*8.5, 0.4, 0.2, 4.7, 0.4, 6.0, {b:0.15});
      box(ft, C.GUN, s*8.5, 1.6, -6.3, 2.6, 1.6, 1.4, {b:0.4, tz:0.7});
      box(to, C.WHITE2, s*8.5, 1.65, 8.3, 4.3, 1.55, 2.1, {b:0.5, tx:0.86, tz:0.8, zo:-0.4});
      if (D1) box(to, C.ORANGE, s*8.5, 3.18, 7.7, 3.4, 0.08, 0.45);
      box(to, C.RUB, s*8.5, 0.4, 8.4, 4.5, 0.4, 2.3, {b:0.12});
      if (D0) for (const dx of [-2.6, 0, 2.6]) box(to, C.DARK, s*8.5 + dx, 1.0, 10.45, 0.7, 0.6, 0.25, {b:0.1});
    }
    // ===== detail pass (LOD 0, some LOD 1): panel grooves, bolt rows and rings, hoses, pipes, handles, louvres
    if (D1){
      const groove = (bn, x, y, z, hx, hy, hz, o) => box(bn, C.DARK, x, y, z, hx, hy, hz, o);
      const row = (bn, p0, p1, n, ax) => { const pts = []; for (let i = 0; i < n; i++){ const t = n > 1 ? i/(n - 1) : 0.5; pts.push([lerp(p0[0], p1[0], t), lerp(p0[1], p1[1], t), lerp(p0[2], p1[2], t)]); } rivets(bn, pts, ax); };
      const ring = (bn, c, r, n, ax) => { const pts = []; for (let i = 0; i < n; i++){ const a = i/n*TAU; pts.push(ax === 'x' ? [c[0], c[1] + Math.cos(a)*r, c[2] + Math.sin(a)*r] : ax === 'y' ? [c[0] + Math.cos(a)*r, c[1], c[2] + Math.sin(a)*r] : [c[0] + Math.cos(a)*r, c[1] + Math.sin(a)*r, c[2]]); } rivets(bn, pts, ax); };
      const hose = (bn, p, q, sag, r, n) => { if (!D0) return; n = n || 6; let prev = p; for (let i = 1; i <= n; i++){ const t = i/n, m = [lerp(p[0], q[0], t) + sag[0]*4*t*(1 - t), lerp(p[1], q[1], t) + sag[1]*4*t*(1 - t), lerp(p[2], q[2], t) + sag[2]*4*t*(1 - t)]; cab(bn, C.RUB, prev, m, r, r, 6); prev = m; } };
      // chest: grooves across the plate, side seams, louvres on the pack, pipes to the stacks, handles, a small mast
      for (const y of [48.2, 53.0]) groove('chest', 0, y, 7.95 - (y - 51.6)*0.12, 7.6, 0.09, 0.1, {rx:-0.12});
      for (const s of [1, -1]){ groove('chest', s*4.2, 50.6, 7.85, 0.09, 4.2, 0.1, {rx:-0.12}); groove('chest', s*11.5, 54.5, 2.0, 0.1, 2.4, 3.2, {rz:-s*0.14}); }
      if (D0){
        for (const s of [1, -1]){ for (let i = 0; i < 5; i++) box('chest', C.DARK, s*7.45, 49.0 + i*1.3, -8.4, 0.12, 0.35, 1.8, {rz:s*0.6});
          cab('chest', C.STEEL, [s*2.2, 57.4, -10.2], [s*4.0, 58.9, -9.6], 0.45, 0.45, 8); cab('chest', C.STEEL, [s*6.2, 47.0, -10.6], [s*6.2, 56.5, -10.6], 0.35, 0.35, 8);
          cab('chest', C.GUN, [s*9.6, 46.6, 3.8], [s*9.6, 46.6, 6.0], 0.22, 0.22, 6); cab('chest', C.GUN, [s*9.6, 46.6, 6.0], [s*9.6, 49.0, 6.0], 0.22, 0.22, 6); cab('chest', C.GUN, [s*9.6, 49.0, 6.0], [s*9.6, 49.0, 3.8], 0.22, 0.22, 6);
          hose('chest', [s*3.0, 45.5, -6.4], [s*5.6, 57.2, -8.3], [s*1.5, 0, -1.2], 0.38, 7); }
        row('chest', [-7.2, 57.2, 6.9], [7.2, 57.2, 6.9], 9, 'z'); row('chest', [-6.8, 45.9, 6.5], [6.8, 45.9, 6.5], 9, 'z');
        row('chest', [-6.4, 58.0, -10.85], [6.4, 58.0, -10.85], 8, 'z'); row('chest', [-6.4, 46.0, -10.85], [6.4, 46.0, -10.85], 8, 'z');
        cyl('chest', C.DARK, -6.6, 61.5, -9.8, 0.1, 0.06, 6.5, 4); cyl('chest', C.GUN, -6.6, 58.6, -9.8, 0.45, 0.45, 0.9, 8);
        // waist: bolt ring, belt plates
        ring('waist', [0, 42.6, 0], 5.9, 16, 'y'); for (const s of [1, -1]) box('waist', C.WHITE2, s*5.6, 40.4, 0, 0.6, 1.8, 2.4, {b:0.2});
        row('root', [-6.2, 38.9, 5.45], [6.2, 38.9, 5.45], 7, 'z'); row('root', [-4.5, 36.3, -6.65], [4.5, 36.3, -6.65], 5, 'z');
        // head: brow bolts, vents on the cheeks
        row('head', [-2.6, 66.35, 5.9], [2.6, 66.35, 5.9], 5, 'z'); for (const s of [1, -1]) for (let i = 0; i < 3; i++) box('head', C.DARK, s*3.15, 63.5 + i*0.55, 4.2, 0.1, 0.12, 1.2, {rz:-s*0.14});
      }
      for (const [s, n] of [[1, 'L'], [-1, 'R']]){
        const cl = 'clav' + n, ua = 'uarm' + n, fa = 'farm' + n, ha = 'hand' + n, tg = 'thigh' + n, sh = 'shin' + n, ft = 'foot' + n, to = 'toe' + n;
        // shoulder block: seams, a vent, the pod's hatch rails
        groove(cl, s*16.4, 61.2, 5.0, 4.0, 0.09, 0.1, {rz:s*0.1}); groove(cl, s*12.2, 61.0, 0, 0.1, 2.6, 4.6);
        if (D0){ for (let i = 0; i < 4; i++) box(cl, C.DARK, s*19.4, 60.3 - i*0.8, -3.6, 0.6, 0.12, 1.4, {rz:s*0.22});
          for (const x of [-1.9, 1.9]) box(cl, C.STEEL, s*15.2 + x, 67.15, -2.0, 0.12, 0.08, 3.1); row(cl, [s*12.6, 63.1, -3.4], [s*12.6, 63.1, 3.4], 4, 'x');
          ring(cl, [s*12.4 - s*1.7, 57.5, 0], 2.7, 10, 'x'); }
        // upper arm: seams, elbow hoses, the elbow's bolt circles
        groove(ua, s*16.3, 51.0, 3.85, 2.6, 0.09, 0.1); groove(ua, s*19.45, 51.0, 0.5, 0.1, 4.0, 2.6);
        if (D0){ ring(ua, [s*16.5 + s*2.8, 42.5, 0.3], 1.8, 8, 'x'); ring(ua, [s*16.5 - s*2.8, 42.5, 0.3], 1.8, 8, 'x');
          hose(ua, [s*14.2, 46.0, -2.4], [s*14.6, 39.0, -1.6], [-s*0.6, -0.6, -2.2], 0.32, 6); row(ua, [s*13.6, 54.6, 3.6], [s*19.0, 54.6, 3.6], 4, 'z'); }
        // forearm: seams, wrist ring, knuckle studs
        groove(fa, s*16.8, 36.0, 4.05, 2.7, 0.09, 0.1); groove(fa, s*16.8, 38.5, 3.9, 0.09, 2.2, 0.1);
        if (D0){ ring(fa, [s*16.9, 31.3, 0.8], 3.9, 12, 'y'); row(fa, [s*14.0, 40.6, 3.6], [s*19.6, 40.6, 3.6], 4, 'z'); hose(fa, [s*19.0, 41.0, -1.8], [s*19.6, 31.4, -1.2], [s*1.0, 0, -0.8], 0.3, 6);
          for (const z of [-0.75, 0.9, 2.55]) cyl('fing' + n, C.STEEL, s*14.25, 25.3, z, 0.35, 0.35, 0.3, 6, {rz:PI/2}); row(ha, [s*20.4, 26.6, -0.6], [s*20.4, 26.6, 2.4], 3, 'x'); }
        // thigh: seams, the hip's bolt ring, knee hoses
        groove(tg, s*7.9, 28.6, 4.35, 3.0, 0.09, 0.1); groove(tg, s*7.9, 31.4, 4.3, 0.09, 2.4, 0.1); groove(tg, s*12.25, 29.4, -2.0, 0.1, 4.2, 0.08);
        if (D0){ hose(tg, [s*5.2, 24.0, -3.0], [s*5.4, 17.0, -2.6], [-s*0.8, -0.2, -1.6], 0.36, 6); hose(tg, [s*10.8, 24.0, -2.6], [s*10.9, 17.0, -2.4], [s*0.8, -0.2, -1.6], 0.36, 6);
          ring(sh, [s*8.0 + s*3.2, 20.0, 0.6], 2.0, 8, 'x'); ring(sh, [s*8.0 - s*3.2, 20.0, 0.6], 2.0, 8, 'x'); }
        // shin: side plates, seams, ankle pistons; foot: side panels, toe claws, heel bolts
        box(sh, C.WHITE2, s*11.85, 12.0, -0.4, 0.45, 4.6, 2.6, {b:0.2}); box(sh, C.WHITE2, s*4.75, 12.0, -0.4, 0.45, 4.6, 2.6, {b:0.2});
        groove(sh, s*8.3, 15.4, 4.1, 3.1, 0.09, 0.1); groove(sh, s*8.3, 11.0, 4.05, 0.09, 3.2, 0.1);
        if (D0){ row(sh, [s*12.35, 15.5, -2.4], [s*12.35, 8.5, -2.4], 4, 'x'); row(sh, [s*4.25, 15.5, -2.4], [s*4.25, 8.5, -2.4], 4, 'x');
          for (const dx of [2.2, -2.2]){ cab(sh, C.STEEL, [s*8.3 + dx, 9.5, 3.4], [s*8.4 + dx, 6.6, 2.4], 0.4, 0.4, 8); cab(sh, C.DARK, [s*8.3 + dx, 9.5, 3.4], [s*8.35 + dx, 8.3, 3.0], 0.6, 0.6, 8); }
          for (const sx of [1, -1]) box(ft, C.WHITE2, s*8.5 + sx*4.05, 2.4, 0.6, 0.35, 1.4, 3.6, {b:0.15}); row(ft, [s*8.5 - 2.0, 1.6, -7.75], [s*8.5 + 2.0, 1.6, -7.75], 3, 'z');
          for (const dx of [-2.6, 0, 2.6]) box(to, C.GUN, s*8.5 + dx, 0.9, 11.0, 0.55, 0.45, 0.6, {b:0.15, tz:0.5}); groove(to, s*8.5, 2.2, 10.3, 3.2, 0.08, 0.1, {rx:-0.6}); }
      }
    }
    return {B, LB, lamps};
  }
  // ---------------- the THREE objects ----------------
  function geo(B, smoothSkin){
    const n = B.s.length, g = new THREE.BufferGeometry(), si = new Uint8Array(n*4), sw = new Uint8Array(n*4);
    for (let i = 0; i < n; i++){ si[i*4] = B.s[i]; sw[i*4] = 255; }
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(B.p), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(B.n), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Uint8Array(B.c), 3, true));
    g.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4));
    g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4, true));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 36, 0), 62); g.boundingBox = new THREE.Box3(new THREE.Vector3(-40, -10, -40), new THREE.Vector3(40, 80, 40));
    void smoothSkin; return g;
  }
  const GLOW_VS = 'attribute vec3 col; attribute float sz; uniform float uK; uniform float uScale; varying vec3 vC; void main(){ vC = col; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = clamp(sz * uK * uScale / max(1.0, -mv.z), 0.0, 96.0); gl_Position = projectionMatrix * mv; }';
  const GLOW_FS = 'uniform float uA; varying vec3 vC; void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d) * 2.0; float a = pow(max(0.0, 1.0 - r), 2.2); gl_FragColor = vec4(vC * a * uA, a * uA); }';
  const POOL_VS = 'varying vec2 vP; void main(){ vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
  const POOL_FS = 'uniform float uA; varying vec2 vP; void main(){ vec2 q = vec2(vP.x * 1.4, vP.y); float r = length(q); float a = (1.0 - smoothstep(0.15, 1.0, r)) * uA; gl_FragColor = vec4(vec3(1.0, 0.93, 0.8) * a, a); }';
  let MOD = null;
  function build(){
    if (MOD) return MOD;
    const t0 = performance.now(), root = new THREE.Group(); root.name = 'sgmech'; root.visible = false;
    const bones = BS.map((b, i) => { const o = new THREE.Bone(); o.name = 'mech_' + b[0]; o.position.set(OFF[i][0], OFF[i][1], OFF[i][2]); return o; });
    BS.forEach((b, i) => { if (PAR[i] >= 0) bones[PAR[i]].add(bones[i]); });
    root.add(bones[0]); root.updateMatrixWorld(true);
    const skel = new THREE.Skeleton(bones);
    const mat = new THREE.MeshLambertMaterial({vertexColors:true, skinning:true});
    const matL = new THREE.MeshBasicMaterial({vertexColors:true, skinning:true, color:0xffffff});
    const lods = [], tris = [];
    let lampsRest = null, litMesh = null;
    for (let L = 0; L < 3; L++){
      const P = parts(L), m = new THREE.SkinnedMesh(geo(P.B), mat); m.name = 'mech_lod' + L; m.castShadow = true; m.receiveShadow = true; m.visible = L === 0; root.add(m); m.bind(skel); lods.push(m); tris.push(P.B.tris);
      if (L === 0){ lampsRest = P.lamps; litMesh = new THREE.SkinnedMesh(geo(P.LB), matL); litMesh.name = 'mech_lamps'; root.add(litMesh); litMesh.bind(skel); litMesh.trisN = P.LB.tris; }
    }
    // glow sprites at the lamps (world positions written every frame), the floodlight pools on the ground
    const gl = lampsRest.filter(l => l.s > 0), gg = new THREE.BufferGeometry(), gp = new Float32Array(gl.length*3), gc = new Float32Array(gl.length*3), gs = new Float32Array(gl.length);
    gl.forEach((l, i) => { gc.set(l.col, i*3); gs[i] = l.s; });
    gg.setAttribute('position', new THREE.BufferAttribute(gp, 3)); gg.setAttribute('col', new THREE.BufferAttribute(gc, 3)); gg.setAttribute('sz', new THREE.BufferAttribute(gs, 1));
    const gm = new THREE.ShaderMaterial({uniforms:{uK:{value:1}, uA:{value:0.4}, uScale:{value:600}}, vertexShader:GLOW_VS, fragmentShader:GLOW_FS, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending});
    const glow = new THREE.Points(gg, gm); glow.frustumCulled = false; glow.name = 'mech_glow'; glow.renderOrder = 9;
    const pg = new THREE.PlaneGeometry(2, 2); pg.rotateX(-PI/2);
    const pm = new THREE.ShaderMaterial({uniforms:{uA:{value:0}}, vertexShader:POOL_VS, fragmentShader:POOL_FS, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, polygonOffset:true, polygonOffsetFactor:-4});
    const pools = [0, 1].map(i => { const q = new THREE.Mesh(pg, pm); q.name = 'mech_pool' + i; q.visible = false; q.renderOrder = 5; return q; });
    tris.push(litMesh.trisN);     // [LOD 0, LOD 1, LOD 2, lamps]
    MOD = {root, bones, skel, lods, lit:litMesh, tris, glow, glowL:gl, pools, mat, matL, ms:performance.now() - t0, lod:0};
    return MOD;
  }
  function attach(){ const M = build(); if (M.root.parent !== scene){ scene.add(M.root); scene.add(M.glow); for (const q of M.pools) scene.add(q); } return M; }
  function detach(){ if (!MOD) return; MOD.root.visible = false; MOD.glow.visible = false; for (const q of MOD.pools) q.visible = false; }
  // the pose: Q (NB quaternions [x,y,z,w], bone-local) and the root bone's position; group placement; level of detail by distance
  function setPose(Q, rootP, X, Y, Z, hdg, tilt){
    const M = MOD; if (!M) return;
    M.root.position.set(X, Z, -Y); M.root.rotation.set(tilt || 0, PI - hdg, 0, 'YXZ');     // (tilt: a fall forward about the feet)
    for (let i = 0; i < NB; i++){ const q = Q[i]; M.bones[i].quaternion.set(q[0], q[1], q[2], q[3]); }
    M.bones[0].position.set(rootP[0], rootP[1], rootP[2]);
    M.root.visible = true; M.root.updateMatrixWorld(true);
    const c = camera.position, d = Math.hypot(c.x - X, c.y - Z - 35, c.z + Y), L = d < 520 ? 0 : d < 1700 ? 1 : 2;
    if (L !== M.lod){ M.lods[M.lod].visible = false; M.lods[L].visible = true; M.lod = L; }
    M.lit.visible = L < 2;
  }
  // world position of a rest-space point carried by bone b (after setPose): out [x east, y north, z up]
  const _v = new THREE.Vector3(), _mi = new THREE.Matrix4();
  function boneW(b, p, out){ const M = MOD; _v.set(p[0] - REST[b][0], p[1] - REST[b][1], p[2] - REST[b][2]).applyMatrix4(M.bones[b].matrixWorld); out = out || [0, 0, 0]; out[0] = _v.x; out[1] = -_v.z; out[2] = _v.y; return out; }
  // lamps: glow sprites (brighter at night), floodlight pools ahead of the shoulders at night, the lamp mesh's brightness
  const _w = [0, 0, 0];
  function lights(nt, hdg, X, Y, beamK){
    const M = MOD; if (!M) return; const L = M.glowL, a = M.glow.geometry.attributes.position, A = a.array;
    for (let i = 0; i < L.length; i++){ boneW(L[i].bone, L[i].p, _w); A[i*3] = _w[0]; A[i*3 + 1] = _w[2]; A[i*3 + 2] = -_w[1]; }
    a.needsUpdate = true; M.glow.visible = M.root.visible;
    M.glow.material.uniforms.uA.value = 0.18 + 0.95*nt; M.glow.material.uniforms.uK.value = (0.7 + 0.8*nt)*(1 + 0.6*(beamK || 0));
    M.glow.material.uniforms.uScale.value = (renderer.domElement.height || 800)*0.9;
    const k = 0.55 + 1.1*nt; M.matL.color.setRGB(k, k, k);
    const on = nt > 0.15 && M.root.visible;
    for (let i = 0; i < 2; i++){ const q = M.pools[i]; q.visible = on; if (!on) continue; const s = i ? -1 : 1, fx = Math.sin(hdg), fy = Math.cos(hdg), rx = Math.cos(hdg), ry = -Math.sin(hdg);
      const px = X + fx*58 - rx*s*14, py = Y + fy*58 - ry*s*14; q.position.set(px, gnd(px, py) + 0.6, -py); q.rotation.set(0, PI - hdg, 0); q.scale.set(26, 1, 40); }
    M.pools[0].material.uniforms.uA.value = 0.22*sstep(0.15, 0.6, nt);
  }
  return {BS, BI, NB, PAR, REST, OFF, L_TH, L_SH, L_UA, L_FA, ANK, C, build, attach, detach, setPose, boneW, lights, parts, get M(){ return MOD; }};
})();
