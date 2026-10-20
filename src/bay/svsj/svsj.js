// ===== bay/svsj: Silicon Valley and San José landmarks for the San Francisco Bay Area 1:1 map (City Brush v29) =====
// Hangar One (+ Hangar 2) at Moffett Field, Computer History Museum, the Santa Clara NFL stadium, the Stanford Dish,
// San José City Hall, Winchester Mystery House, Rosicrucian Egyptian Museum (Rosicrucian Park), Cathedral Basilica of St. Joseph.
// Each model is built in a frame aligned with its real OSM footprint (the plans below are in that frame, metres;
// the SG_PLACES rot turns the frame onto the map). Block-scoped: only LANDMARKS and SG_PLACES are touched.
{
const PI = Math.PI, HP = PI/2, TAU = PI*2;
// ---------- triangle batches: every part of one colour spec goes into one LTris call ----------
function MB(){
  const L = [];
  const get = sp => { for (const e of L) if (e[0] === sp) return e[1]; const a = []; L.push([sp, a]); return a; };
  const M = {
    t(sp, p, q, r){ get(sp).push(p[0], p[1], p[2], q[0], q[1], q[2], r[0], r[1], r[2]); },
    q(sp, p, q, r, s){ get(sp).push(p[0], p[1], p[2], q[0], q[1], q[2], r[0], r[1], r[2], p[0], p[1], p[2], r[0], r[1], r[2], s[0], s[1], s[2]); },
    // box w (x) * h (y) * d (z), bottom centre x, y, z, turned ry about y
    box(sp, w, h, d, x, y, z, ry){
      const c = Math.cos(ry || 0), s = Math.sin(ry || 0), P = (u, v, t) => [x + u*c + t*s, y + v, z - u*s + t*c];
      const hw = w/2, hd = d/2, A = P(-hw, 0, -hd), B = P(hw, 0, -hd), C = P(hw, 0, hd), D = P(-hw, 0, hd), E = P(-hw, h, -hd), F = P(hw, h, -hd), G = P(hw, h, hd), H = P(-hw, h, hd);
      M.q(sp, E, H, G, F); M.q(sp, A, B, C, D); M.q(sp, D, C, G, H); M.q(sp, B, A, E, F); M.q(sp, C, B, F, G); M.q(sp, A, D, H, E);
    },
    // wall slab along the plan segment a -> b ([x, z]), thickness th (centred), y0 .. y1
    wall(sp, a, b, th, y0, y1){ const L2 = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L2 < 1e-3) return; M.box(sp, L2, y1 - y0, th, (a[0] + b[0])/2, y0, (a[1] + b[1])/2, -Math.atan2(b[1] - a[1], b[0] - a[0])); },
    // vertical quad on the segment a -> b from y0 to y1, pushed out by off along the normal n
    vq(sp, a, b, n, off, y0, y1){ const ox = n[0]*off, oz = n[1]*off; M.q(sp, [a[0] + ox, y0, a[1] + oz], [b[0] + ox, y0, b[1] + oz], [b[0] + ox, y1, b[1] + oz], [a[0] + ox, y1, a[1] + oz]); },
    // flat polygon (plan [x, z]) at height y, optional holes
    cap(sp, P, y, holes){
      const v2 = Q => Q.map(p => new THREE.Vector2(p[0], p[1])), H = holes || [];
      const tri = THREE.ShapeUtils.triangulateShape(v2(P), H.map(v2)), all = P.concat(...H), a = get(sp);
      for (const f of tri) for (const i of f) a.push(all[i][0], y, all[i][1]);
    },
    // prism: polygon P from y0 to y1 (walls + top cap, optional bottom)
    prism(sp, P, y0, y1, top, bot){
      for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length]; M.q(sp, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); }
      if (top !== false) M.cap(sp, P, y1); if (bot) M.cap(sp, P, y0);
    },
    // surface of revolution: profile [[r, y], ...], centre cx, cz, n segments from angle a0 to a1, radial scale sx (x) / sz (z)
    rev(sp, prof, cx, cz, n, a0, a1, sx, sz){
      a0 = a0 || 0; a1 = a1 === undefined ? TAU : a1; sx = sx || 1; sz = sz || 1;
      for (let i = 0; i < n; i++){ const t0 = a0 + (a1 - a0)*i/n, t1 = a0 + (a1 - a0)*(i + 1)/n, c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
        for (let j = 0; j < prof.length - 1; j++){ const [r0, y0] = prof[j], [r1, y1] = prof[j + 1];
          M.q(sp, [cx + c0*r0*sx, y0, cz + s0*r0*sz], [cx + c1*r0*sx, y0, cz + s1*r0*sz], [cx + c1*r1*sx, y1, cz + s1*r1*sz], [cx + c0*r1*sx, y1, cz + s0*r1*sz]); } }
    },
    cyl(sp, r, y0, y1, cx, cz, n, top){ M.rev(sp, top ? [[r, y0], [r, y1], [0, y1]] : [[r, y0], [r, y1]], cx, cz, n); },
    // square-section beam between two 3-D points (half-size r)
    beam(sp, a, b, r){
      const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L2 = Math.hypot(d[0], d[1], d[2]); if (L2 < 1e-3) return;
      const u = [d[0]/L2, d[1]/L2, d[2]/L2], ref = Math.abs(u[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      let p = [u[1]*ref[2] - u[2]*ref[1], u[2]*ref[0] - u[0]*ref[2], u[0]*ref[1] - u[1]*ref[0]]; const pl = Math.hypot(...p); p = p.map(v => v/pl*r);
      const q = [u[1]*p[2] - u[2]*p[1], u[2]*p[0] - u[0]*p[2], u[0]*p[1] - u[1]*p[0]];
      const C = (o, s1, s2) => [o[0] + p[0]*s1 + q[0]*s2, o[1] + p[1]*s1 + q[1]*s2, o[2] + p[2]*s1 + q[2]*s2];
      const k = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
      for (let i = 0; i < 4; i++){ const [s1, s2] = k[i], [t1, t2] = k[(i + 1) % 4]; M.q(sp, C(a, s1, s2), C(a, t1, t2), C(b, t1, t2), C(b, s1, s2)); }
    },
    // gable roof over a rectangle (centre cx, cz, length L along the local x turned by ry, width W), eaves at y, ridge h above
    gable(sp, cx, cz, L, W, y, h, ry, over, wallSp){
      const c = Math.cos(ry || 0), s = Math.sin(ry || 0), o = over || 0, P = (u, v, t) => [cx + u*c + t*s, y + v, cz - u*s + t*c];
      const hl = L/2, hw = W/2 + o;
      M.q(sp, P(-hl, 0, -hw), P(hl, 0, -hw), P(hl, h, 0), P(-hl, h, 0)); M.q(sp, P(hl, 0, hw), P(-hl, 0, hw), P(-hl, h, 0), P(hl, h, 0));
      const ws = wallSp || sp; M.t(ws, P(-hl, 0, -W/2), P(-hl, 0, W/2), P(-hl, h*(1 - o/hw), 0)); M.t(ws, P(hl, 0, W/2), P(hl, 0, -W/2), P(hl, h*(1 - o/hw), 0));
    },
    hip(sp, cx, cz, L, W, y, h, ry, over){
      const c = Math.cos(ry || 0), s = Math.sin(ry || 0), P = (u, v, t) => [cx + u*c + t*s, y + v, cz - u*s + t*c];
      const hl = L/2 + (over || 0), hw = W/2 + (over || 0), k = Math.max(0, hl - hw);
      const A = P(-hl, 0, -hw), B = P(hl, 0, -hw), C = P(hl, 0, hw), D = P(-hl, 0, hw), r1 = P(-k, h, 0), r2 = P(k, h, 0);
      M.q(sp, A, B, r2, r1); M.q(sp, C, D, r1, r2); M.t(sp, D, A, r1); M.t(sp, B, C, r2);
    },
    pyr(sp, cx, cz, w, d, y, h, ry, tw){ // pyramid / frustum roof (top size tw)
      const c = Math.cos(ry || 0), s = Math.sin(ry || 0), P = (u, v, t) => [cx + u*c + t*s, y + v, cz - u*s + t*c], k = tw || 0;
      const b = [P(-w/2, 0, -d/2), P(w/2, 0, -d/2), P(w/2, 0, d/2), P(-w/2, 0, d/2)], t = [P(-k/2, h, -k/2), P(k/2, h, -k/2), P(k/2, h, k/2), P(-k/2, h, k/2)];
      for (let i = 0; i < 4; i++) M.q(sp, b[i], b[(i + 1) % 4], t[(i + 1) % 4], t[i]);
      if (k > 0) M.q(sp, t[0], t[1], t[2], t[3]);
    },
    out(g){ for (const [sp, a] of L) if (a.length) LTris(g, a, sp); L.length = 0; }
  };
  return M;
}
// plan helpers
const pcen = P => { let a = 0, cx = 0, cz = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const f = P[j][0]*P[i][1] - P[i][0]*P[j][1]; a += f; cx += (P[j][0] + P[i][0])*f; cz += (P[j][1] + P[i][1])*f; } return a ? [cx/(3*a), cz/(3*a)] : [0, 0]; };
const onrm = (P, i) => { const a = P[i], b = P[(i + 1) % P.length], c = pcen(P); let nx = b[1] - a[1], nz = -(b[0] - a[0]); const L = Math.hypot(nx, nz) || 1; nx /= L; nz /= L;
  const mx = (a[0] + b[0])/2 - c[0], mz = (a[1] + b[1])/2 - c[1]; if (nx*mx + nz*mz < 0){ nx = -nx; nz = -nz; } return [nx, nz]; };
const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t];
// windows along every edge of a polygon (outward normal from the centroid): floors y0 + k*fh, window ww x wh every bay bw
function winPoly(M, sp, P, y0, fh, nf, bw, ww, wh, off, skip){
  for (let i = 0; i < P.length; i++){
    if (skip && skip(i)) continue;
    const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < bw*0.7) continue;
    const n = onrm(P, i), nb = Math.max(1, Math.floor(L/bw)), hu = ww/L/2;
    for (let f = 0; f < nf; f++) for (let k = 0; k < nb; k++){ const u = (k + 0.5)/nb, p0 = lerp2(a, b, u - hu), p1 = lerp2(a, b, u + hu);
      M.vq(sp, p0, p1, n, off || 0.08, y0 + f*fh, y0 + f*fh + wh); }
  }
}
// latitude / longitude of a model origin given as an offset (east ox, south oz) from a ref anchor
const llOff = (lat, lon, ox, oz) => ({lat:+(lat - oz/110989).toFixed(7), lon:+(lon + ox/88300).toFixed(7)});

// =====================================================================================================================
// Hangar One, Moffett Field (1933): 345 m x 94 m x 60 m, steel three-hinged parabolic arch trusses 72 ft (22 m) apart
// on 17 m A-frames; corrugated metal skin painted silver, flat panels marking each truss, four bands of ribbon windows per
// bay on the long sides, black built-up roof along the crest, and at both ends the "orange peel" doors: two curved leaves
// per end rolling on semicircular tracks (two levels of windows). Navigation beacon on the roof. Restored and re-skinned
// 2025. Frame: x along the hangar (local +x = SSE), z across; origin = footprint centre.
// Hangar 2 (1943, timber, 328 m x 91 m x 52 m) is the secondary key svhangartwo (label:false). Hangar 3 was demolished
// in 2024-25 and is not modelled.
// =====================================================================================================================
const H1 = {L:134.5, E:39.5, W:47, H:60};
const h1w = y => H1.W*Math.pow(Math.max(0, 1 - Math.pow(y/H1.H, 1.6)), 0.62);   // half-width of the arch at height y
const H1Y = [0, 2.5, 5.5, 9, 13, 16, 20, 24, 27, 31, 35, 38, 42, 46, 49.5, 52.5, 55, 57, 58.6, 59.5, 60];
function hangarShell(M, S, L, E, wf, H, Y, opts){
  // straight barrel x in [-L, L] + two half "orange peel" caps of depth E; wf(y) = half-width; S = colour specs
  const yTop = opts.roofY;
  const sk = y => y >= yTop ? S.roof : S.skin;
  for (let j = 0; j < Y.length - 1; j++){
    const y0 = Y[j], y1 = Y[j + 1], w0 = wf(y0), w1 = wf(y1), sp = sk((y0 + y1)/2);
    for (const s of [-1, 1]) M.q(sp, [-L, y0, s*w0], [L, y0, s*w0], [L, y1, s*w1], [-L, y1, s*w1]);
    // caps: elliptic revolution (depth E along x, half-width W across)
    const n = 18;
    for (const e of [-1, 1]) for (let i = 0; i < n; i++){
      const a0 = -HP + PI*i/n, a1 = -HP + PI*(i + 1)/n, f0 = w0/wf(0), f1 = w1/wf(0);
      const P = (a, f, y) => [e*(L + Math.cos(a)*E*f), y, Math.sin(a)*wf(0)*f];
      M.q(sp, P(a0, f0, y0), P(a1, f0, y0), P(a1, f1, y1), P(a0, f1, y1));
    }
  }
}
LANDMARKS.svhangarone = {zh:'一号机库（莫菲特机场）', en:'Hangar One, Moffett Field', cat:'old', r:182, h:62,
  lt:{m:0, c:'#dfe7f0', k:0.24, e:0.65},
  build(){
    const g = new THREE.Group(), M = MB(), L = H1.L, E = H1.E, W = H1.W;
    const S = {skin:'#a9aeb4', rib:'#c4c8cc', roof:'#46484c', win:{c:'#47515c', glow:'#ffe2b0', gk:0.25}, base:'#9a978f',
      door:'#bcc1c7', dark:'#2f3236', red:{c:'#7a1a14', glow:'#ff2a1a', gk:2.2}, bea:{c:'#d8dcd0', glow:'#d8ffe0', gk:2.0}, apron:'#8d8b86'};
    hangarShell(M, S, L, E, h1w, H1.H, H1Y, {roofY:55});
    // concrete plinth / door tracks round the base
    const ring = []; for (let i = 0; i <= 24; i++){ const a = -HP + PI*i/24; ring.push([L + Math.cos(a)*(E + 1.5), Math.sin(a)*(W + 1.5)]); }
    const plan = ring.concat(ring.map(p => [-p[0], -p[1]]));
    M.prism(S.base, plan, -5, 0.6, true);
    // apron slabs in front of both doors (aircraft move in and out along the axis)

    // truss lines: 12 bays of 72 ft along the straight barrel, flat panels standing proud of the skin
    const nb = 12, bay = 2*L/nb;
    for (let k = 0; k <= nb; k++){ const x = -L + k*bay;
      for (let j = 0; j < H1Y.length - 1; j++){ const y0 = H1Y[j], y1 = H1Y[j + 1], w0 = h1w(y0) + 0.35, w1 = h1w(y1) + 0.35;
        for (const s of [-1, 1]) M.q(S.rib, [x - 1.3, y0, s*w0], [x + 1.3, y0, s*w0], [x + 1.3, y1, s*w1], [x - 1.3, y1, s*w1]); }
      // the truss shoe / A-frame foot
      for (const s of [-1, 1]) M.box(S.base, 3.2, 3.5, 2.4, x, 0, s*(W + 0.6));
    }
    // four bands of steel ribbon windows in every bay (flush in the skin): base, two in the wall, one at the wall-roof junction
    const bands = [[1.6, 4.4], [12.2, 15.2], [23.4, 26.4], [34.8, 37.6]];
    for (let k = 0; k < nb; k++){ const x0 = -L + k*bay + 2.4, x1 = -L + (k + 1)*bay - 2.4;
      for (const [y0, y1] of bands){ const w0 = h1w(y0) + 0.18, w1 = h1w(y1) + 0.18;
        for (const s of [-1, 1]) M.q(S.win, [x0, y0, s*w0], [x1, y0, s*w0], [x1, y1, s*w1], [x0, y1, s*w1]);
        // mullions every 2.6 m
        for (let x = x0 + 2.6; x < x1 - 0.5; x += 2.6) for (const s of [-1, 1]) M.q(S.rib, [x - 0.12, y0, s*(w0 + 0.05)], [x + 0.12, y0, s*(w0 + 0.05)], [x + 0.12, y1, s*(w1 + 0.05)], [x - 0.12, y1, s*(w1 + 0.05)]);
      }
    }
    // orange-peel doors: each end two leaves meeting on the axis; leaf edges as ribs, two levels of windows
    const capP = (e, a, y, off) => { const f = h1w(y)/W; return [e*(L + Math.cos(a)*(E*f + off)), y, Math.sin(a)*(W*f + off)]; };
    for (const e of [-1, 1]){
      for (const a of [0, -HP, HP]) for (let j = 0; j < H1Y.length - 1; j++){ const y0 = H1Y[j], y1 = H1Y[j + 1];
        const da = a === 0 ? 0.035 : 0.02, a0 = a === -HP ? a : a - da, a1 = a === HP ? a : a + da;
        M.q(S.rib, capP(e, a0, y0, 0.45), capP(e, a1, y0, 0.45), capP(e, a1, y1, 0.45), capP(e, a0, y1, 0.45)); }
      // leaf panel ribs (four per leaf)
      for (const a of [-1.2, -0.8, -0.4, 0.4, 0.8, 1.2]) for (let j = 0; j < H1Y.length - 2; j++){ const y0 = H1Y[j], y1 = H1Y[j + 1];
        M.q(S.door, capP(e, a - 0.012, y0, 0.3), capP(e, a + 0.012, y0, 0.3), capP(e, a + 0.012, y1, 0.3), capP(e, a - 0.012, y1, 0.3)); }
      // two levels of windows on each leaf
      for (const [y0, y1] of [[8, 11], [20, 23]]) for (const s of [-1, 1]){ const n = 6;
        for (let i = 0; i < n; i++){ const a0 = s*(0.12 + 1.3*i/n), a1 = s*(0.12 + 1.3*(i + 0.8)/n);
          M.q(S.win, capP(e, a0, y0, 0.25), capP(e, a1, y0, 0.25), capP(e, a1, y1, 0.25), capP(e, a0, y1, 0.25)); } }
      // door truck housings on the track at the foot of each leaf
      for (const a of [-1.0, -0.35, 0.35, 1.0]){ const p = capP(e, a, 0, 1.2); M.box(S.dark, 3, 2.2, 3, p[0], 0.6, p[2], -a*e); }
    }
    // crest: black built-up roof walkway, the navigation beacon at mid-length, red obstruction lights at both ends
    M.box(S.roof, 2*L + 10, 0.6, 4, 0, H1.H - 0.3, 0);
    M.box(S.dark, 3, 3.2, 3, 0, H1.H, 0); M.cyl(S.bea, 0.9, H1.H + 3.2, H1.H + 4.6, 0, 0, 10, true);
    for (const e of [-1, 1]){ M.box(S.dark, 0.6, 1.8, 0.6, e*(L + 4), H1.H - 0.6, 0); M.box(S.red, 0.9, 0.7, 0.9, e*(L + 4), H1.H + 1.2, 0); }
    for (const e of [-1, 1]) for (const s of [-1, 1]) M.box(S.red, 0.8, 0.6, 0.8, e*(L - 20), h1w(48) - 3, s*(h1w(48) + 0.4));
    M.out(g); return g;
  }};
SG_PLACES.push(Object.assign({type:'svhangarone'}, llOff(37.413, -122.054, 3.1, 5.5), {rot:-1.1759}));

// ---------- Hangar 2 (1943, timber trusses, weathered grey shingled skin, concrete door towers and six-leaf doors) ----------
const H2 = {L:164.2, W:45.4, H:52};
const h2w = y => H2.W*Math.pow(Math.max(0, 1 - Math.pow(y/H2.H, 1.45)), 0.58);
const H2Y = [0, 3, 7, 12, 17, 22, 27, 32, 36, 40, 43.5, 46.5, 49, 50.6, 51.6, 52];
LANDMARKS.svhangartwo = {zh:'二号机库（莫菲特机场）', en:'Hangar 2, Moffett Field', cat:'old', r:180, h:54, label:false,
  lt:{m:0, c:'#e2e6ea', k:0.18, e:0.6},
  build(){
    const g = new THREE.Group(), M = MB(), L = H2.L, W = H2.W;
    const S = {skin:'#a29d93', rib:'#8c877e', roof:'#5b5751', con:'#c3beb3', door:'#8e8a82', win:{c:'#434a52', glow:'#ffdcae', gk:0.2}, red:{c:'#7a1a14', glow:'#ff2a1a', gk:2.2}};
    // barrel (stops 6 m short of each end where the concrete door frames stand)
    const Lb = L - 6;
    for (let j = 0; j < H2Y.length - 1; j++){ const y0 = H2Y[j], y1 = H2Y[j + 1], w0 = h2w(y0), w1 = h2w(y1), sp = (y0 + y1)/2 > 47 ? S.roof : S.skin;
      for (const s of [-1, 1]) M.q(sp, [-Lb, y0, s*w0], [Lb, y0, s*w0], [Lb, y1, s*w1], [-Lb, y1, s*w1]); }
    // timber arch lines every ~20 m (shallow ribs) and a continuous clerestory window band low on each side
    for (let k = 0; k <= 16; k++){ const x = -Lb + k*(2*Lb/16);
      for (let j = 0; j < H2Y.length - 1; j++){ const y0 = H2Y[j], y1 = H2Y[j + 1], w0 = h2w(y0) + 0.3, w1 = h2w(y1) + 0.3;
        for (const s of [-1, 1]) M.q(S.rib, [x - 0.8, y0, s*w0], [x + 0.8, y0, s*w0], [x + 0.8, y1, s*w1], [x - 0.8, y1, s*w1]); } }
    for (const [y0, y1] of [[5, 7.5], [27, 29]]){ const w0 = h2w(y0) + 0.15, w1 = h2w(y1) + 0.15;
      for (const s of [-1, 1]) M.q(S.win, [-Lb + 3, y0, s*w0], [Lb - 3, y0, s*w0], [Lb - 3, y1, s*w1], [-Lb + 3, y1, s*w1]); }
    // end frames: concrete arch portal (6 m deep) + tall door towers at the corners; six door leaves (three a side)
    for (const e of [-1, 1]){
      const x0 = e*Lb, x1 = e*L;
      for (let j = 0; j < H2Y.length - 1; j++){ const y0 = H2Y[j], y1 = H2Y[j + 1], wo0 = h2w(y0) + 0.8, wo1 = h2w(y1) + 0.8, wi0 = Math.max(0, h2w(y0) - 4), wi1 = Math.max(0, h2w(y1) - 4);
        for (const s of [-1, 1]){
          M.q(S.con, [x0, y0, s*wo0], [x1, y0, s*wo0], [x1, y1, s*wo1], [x0, y1, s*wo1]);
          M.q(S.con, [x1, y0, s*wo0], [x1, y0, s*wi0], [x1, y1, s*wi1], [x1, y1, s*wo1]);
        } }
      M.q(S.con, [x0, H2.H, -2], [x1, H2.H, -2], [x1, H2.H, 2], [x0, H2.H, 2]);
      // corner door towers (the leaves roll out between them)
      for (const s of [-1, 1]){ M.box(S.con, 9, 30, 7, x1 + e*2.5, 0, s*(W - 1.5)); M.pyr(S.con, x1 + e*2.5, s*(W - 1.5), 9, 7, 30, 6, 0, 3); }
      // six door leaves closing the opening (flat, following the inner arch), seams and rails as ribs, a window band
      const hz = z => { let lo = 0, hi = H2.H; for (let it = 0; it < 18; it++){ const m = (lo + hi)/2; if (h2w(m) - 4 > Math.abs(z)) lo = m; else hi = m; } return lo; };
      const xs = x1 - e*0.8, nz = 24, Wi = W - 4;
      for (let i = 0; i < nz; i++){ const z0 = -Wi + 2*Wi*i/nz, z1 = -Wi + 2*Wi*(i + 1)/nz, y0 = hz(z0), y1 = hz(z1);
        M.q(S.door, [xs, 0, z0], [xs, 0, z1], [xs, y1, z1], [xs, y0, z0]); }
      for (let k = 1; k < 6; k++){ const z = -Wi + 2*Wi*k/6; M.q(S.rib, [xs + e*0.15, 0, z - 0.3], [xs + e*0.15, 0, z + 0.3], [xs + e*0.15, hz(z), z + 0.3], [xs + e*0.15, hz(z), z - 0.3]); }
      for (let y = 6; y < 46; y += 7){ const zz = h2w(y) - 4.2; M.q(S.rib, [xs + e*0.12, y, -zz], [xs + e*0.12, y, zz], [xs + e*0.12, y + 0.5, zz], [xs + e*0.12, y + 0.5, -zz]); }
      M.box(S.red, 0.9, 0.7, 0.9, x1, H2.H + 0.3, 0);
    }
    M.prism(S.con, [[-L - 2, -W - 2], [L + 2, -W - 2], [L + 2, W + 2], [-L - 2, W + 2]], -5, 0.5, true);
    M.out(g); return g;
  }};
SG_PLACES.push(Object.assign({type:'svhangartwo'}, llOff(37.41628, -122.04379, 0.2, 0.5), {rot:-1.1826}));

// =====================================================================================================================
// The Stanford Dish (SRI, 1961): 150 ft (46 m) steerable parabolic radio antenna in the Stanford foothills. Azimuth-
// elevation wheel-and-track mount: the blue steel alidade rides on a circular rail, two A-frame towers carry the
// elevation axle; white dish with its radial backup trusses and a tripod feed support. Shown tilted to 52 degrees,
// looking south-south-east. Real position: the OSM telescope outline (no building in the refs). Origin = dish centre.
// =====================================================================================================================
LANDMARKS.svdish = {zh:'斯坦福射电望远镜“大碟”', en:'The Stanford Dish', cat:'old', r:34, h:47,
  lt:{m:0, c:'#e8eef4', k:0.16, e:0.7},
  build(){
    const g = new THREE.Group(), M = MB();
    const S = {dish:'#eef0ec', back:'#d4d8d4', blue:'#2c4f85', con:'#a8a49b', dark:'#3b3e42', feed:'#f4f4f0', red:{c:'#7a1a14', glow:'#ff2a1a', gk:1.6}};
    const R = 23, F = 18.4, YA = -4.2, HP0 = 21.5, EL = 52*PI/180, AZ = 0.35, tau = HP - EL;
    const ct = Math.cos(tau), st = Math.sin(tau), ca = Math.cos(AZ), sa = Math.sin(AZ);
    const T = p => { const y = p[1] - YA, z = p[2], y2 = y*ct - z*st, z2 = y*st + z*ct, x = p[0]; return [x*ca + z2*sa, HP0 + y2, -x*sa + z2*ca]; };
    const AzP = (x, y, z) => [x*ca + z*sa, y, -x*sa + z*ca];   // mount parts turn with the azimuth only
    const par = r => r*r/(4*F);
    // reflector surface (front white, the back slightly greyer just behind it)
    const rs = [0, 2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, 21.6, 23], na = 40;
    for (let j = 0; j < rs.length - 1; j++) for (let i = 0; i < na; i++){
      const a0 = TAU*i/na, a1 = TAU*(i + 1)/na, r0 = rs[j], r1 = rs[j + 1];
      const P = (r, a, o) => T([Math.cos(a)*r, par(r) - o, Math.sin(a)*r]);
      M.q(S.dish, P(r0, a0, 0), P(r0, a1, 0), P(r1, a1, 0), P(r1, a0, 0));
      M.q(S.back, P(r0, a1, 0.25), P(r0, a0, 0.25), P(r1, a0, 0.25), P(r1, a1, 0.25));
    }
    // rim band
    for (let i = 0; i < na; i++){ const a0 = TAU*i/na, a1 = TAU*(i + 1)/na, P = (a, o) => T([Math.cos(a)*R, par(R) - o, Math.sin(a)*R]); M.q(S.back, P(a0, 0), P(a1, 0), P(a1, 0.9), P(a0, 0.9)); }
    // backup structure: hub, 20 radial trusses (top + bottom chord and verticals), two ring girders
    const hubR = 3.2;
    for (let i = 0; i < 12; i++){ const a0 = TAU*i/12, a1 = TAU*(i + 1)/12; M.q(S.back, T([Math.cos(a0)*hubR, -6, Math.sin(a0)*hubR]), T([Math.cos(a1)*hubR, -6, Math.sin(a1)*hubR]), T([Math.cos(a1)*hubR, 0.2, Math.sin(a1)*hubR]), T([Math.cos(a0)*hubR, 0.2, Math.sin(a0)*hubR])); }
    for (let i = 0; i < 20; i++){ const a = TAU*i/20, c = Math.cos(a), s = Math.sin(a);
      const top = r => T([c*r, par(r) - 0.7, s*r]), bot = r => T([c*r, par(r)*0.55 - 3.6*(1 - r/R) - 0.6, s*r]);
      { const rr = [hubR, 6, 9, 12, 15, 18, 21, R - 0.6]; for (let k = 0; k < rr.length - 1; k++) M.beam(S.back, top(rr[k]), top(rr[k + 1]), 0.16); } M.beam(S.back, bot(hubR), bot(R - 0.6), 0.16);
      for (const r of [7, 12, 17, 21]) M.beam(S.back, top(r), bot(r), 0.1);
      M.beam(S.back, bot(hubR), top(7), 0.08); M.beam(S.back, bot(7), top(12), 0.08); M.beam(S.back, bot(12), top(17), 0.08);
    }
    for (const r of [11, 18]) for (let i = 0; i < 20; i++){ const a0 = TAU*i/20, a1 = TAU*(i + 1)/20, y = r => par(r)*0.55 - 3.6*(1 - r/R) - 0.6;
      M.beam(S.back, T([Math.cos(a0)*r, y(r), Math.sin(a0)*r]), T([Math.cos(a1)*r, y(r), Math.sin(a1)*r]), 0.14); }
    // tripod feed support and the feed housing at the focus
    const apex = T([0, F, 0]);
    for (const a of [HP, HP + TAU/3, HP + 2*TAU/3]) M.beam(S.feed, T([Math.cos(a)*(R - 1), par(R - 1), Math.sin(a)*(R - 1)]), apex, 0.32);
    { const c0 = T([0, F - 1.6, 0]), c1 = T([0, F + 1.0, 0]); M.beam(S.feed, c0, c1, 1.0); M.beam(S.dark, T([0, F - 2.2, 0]), c0, 0.55); }
    // elevation axle and the counterweight sector behind the hub
    M.beam(S.blue, AzP(-12.5, HP0, 0), AzP(12.5, HP0, 0), 0.7);
    for (const s of [-1, 1]){ const a = T([s*3.6, -5.5, -2.5]), b = T([s*3.6, -5.5, 6.5]); M.beam(S.blue, a, b, 0.5); M.beam(S.blue, T([s*3.6, 0, -1]), a, 0.4); M.beam(S.blue, T([s*3.6, 0, 5]), b, 0.4); }
    { const p = T([0, -7.5, 2]); M.box(S.dark, 6.4, 3.6, 3.6, p[0], p[1] - 1.8, p[2], -AZ); }
    // alidade: two A-frame towers on a triangulated base frame riding the azimuth track
    for (const s of [-1, 1]){
      const top = AzP(s*12.5, HP0, 0);
      for (const zz of [-8, 8]) M.beam(S.blue, AzP(s*11.5, 1.6, zz), top, 0.55);
      M.beam(S.blue, AzP(s*11.5, 1.6, -8), AzP(s*11.5, 1.6, 8), 0.5);
      for (const y of [7, 13]){ const k = (y - 1.6)/(HP0 - 1.6), zz = 8*(1 - k); M.beam(S.blue, AzP(s*(11.5 + k), y, -zz), AzP(s*(11.5 + k), y, zz), 0.3); }
      M.beam(S.blue, AzP(s*11.5, 1.6, -8), AzP(s*(11.5 + 0.6), 10, 3.6), 0.25); M.beam(S.blue, AzP(s*11.5, 1.6, 8), AzP(s*(11.5 + 0.6), 10, -3.6), 0.25);
      { const p = AzP(s*12.5, HP0 - 1.4, 0); M.box(S.dark, 2.4, 2.8, 3, p[0], p[1], p[2], -AZ); }
      // trucks on the rail
      for (const zz of [-8, 8]){ const p = AzP(s*11.5, 0.5, zz); M.box(S.dark, 2.2, 1.3, 3.2, p[0], p[1], p[2], -AZ); }
    }
    M.beam(S.blue, AzP(-11.5, 1.8, -8), AzP(11.5, 1.8, -8), 0.45); M.beam(S.blue, AzP(-11.5, 1.8, 8), AzP(11.5, 1.8, 8), 0.45);
    M.beam(S.blue, AzP(-11.5, 1.8, -8), AzP(11.5, 1.8, 8), 0.3); M.beam(S.blue, AzP(-11.5, 1.8, 8), AzP(11.5, 1.8, -8), 0.3);
    // concrete ring foundation with the rail, central pintle pier, stair tower
    M.rev(S.con, [[15.2, -6], [15.2, 0.5], [12.6, 0.5], [12.6, -6]], 0, 0, 48);
    M.rev(S.dark, [[14.2, 0.5], [14.2, 0.75], [13.6, 0.75], [13.6, 0.5]], 0, 0, 48);
    M.cyl(S.con, 2.6, -6, 1.6, 0, 0, 16, true);
    M.box(S.blue, 2.4, HP0 - 2, 2.4, AzP(0, 0, -9)[0], 0, AzP(0, 0, -9)[2], -AZ);
    { const p = T([0, F + 1.2, 0]); M.box(S.red, 0.5, 0.5, 0.5, p[0], p[1], p[2]); }
    M.out(g); return g;
  }};
SG_PLACES.push({type:'svdish', lat:37.408553, lon:-122.179594, rot:0});

// =====================================================================================================================
// The NFL stadium in Santa Clara (2014, open bowl): field on a NNW-SSE axis; lower bowl all round; a mid deck on the
// north, east and south; the high east upper deck wrapping both east corners with the long LED light canopy (56-59 m)
// on sloped perimeter columns; the nine-level suite tower on the west sideline (stepped suite fronts, glass west face,
// green roof with solar panels and a light rack); two big video boards above the end-zone platforms, set off towards
// the west as built. Seats in a muted maroon, no team or sponsor names, screens show an abstract colour field.
// Frame: x across the field (+x = the east stands), z along it (+z = south); origin = centre of the field.
// Plan dimensions from the OSM building parts (bowl tiers, tower, decks, boards, canopy).
// =====================================================================================================================
const SV_RING = [[-103.3, -115.8], [-93.9, -125.1], [-87.8, -118.9], [-79.5, -127.1], [-85.7, -133.2], [-76.3, -142.5], [-58.4, -124.4], [-52.1, -130.6], [-52.0, -146.5], [52.7, -145.8], [56.2, -143.2], [62.9, -151.6], [77.9, -139.8], [71.2, -131.3], [85.4, -120.0], [92.1, -128.5], [107.0, -116.7], [100.4, -108.2], [104.7, -104.8], [121.9, -47.0], [121.2, 51.7], [104.3, 105.7], [102.3, 108.7], [86.7, 120.8], [92.6, 128.1], [76.4, 141.1], [70.3, 133.4], [53.1, 146.7], [49.5, 146.7], [49.5, 163.1], [-48.0, 162.5], [-48.0, 147.1], [-53.3, 147.1], [-53.3, 132.8], [-59.6, 126.5], [-77.8, 144.4], [-87.0, 135.1], [-80.7, 129.0], [-88.9, 120.7], [-95.2, 126.8], [-104.3, 117.6], [-86.2, 99.7], [-92.4, 93.2], [-110.0, 93.2], [-109.2, -91.6], [-91.6, -91.5], [-85.4, -97.8]];
const SV = {FX:39.5, FZ:64.5, RC:20};
SV.CX = SV.FX - SV.RC; SV.CZ = SV.FZ - SV.RC;
// rounded-rectangle loops around the field: d = offset from the bowl's inner edge, t in [0, 8) runs east side (0), SE
// corner (1), south (2), SW (3), west (4), NW (5), north (6), NE (7)
function svRR(d, t){
  t = ((t % 8) + 8) % 8; const k = Math.min(7, Math.floor(t)), f = t - k, R = SV.RC + d, CX = SV.CX, CZ = SV.CZ;
  if (k === 0) return [CX + R, -CZ + 2*CZ*f];
  if (k === 1){ const a = HP*f; return [CX + R*Math.cos(a), CZ + R*Math.sin(a)]; }
  if (k === 2) return [CX - 2*CX*f, CZ + R];
  if (k === 3){ const a = HP + HP*f; return [-CX + R*Math.cos(a), CZ + R*Math.sin(a)]; }
  if (k === 4) return [-CX - R, CZ - 2*CZ*f];
  if (k === 5){ const a = PI + HP*f; return [-CX + R*Math.cos(a), -CZ + R*Math.sin(a)]; }
  if (k === 6) return [-CX + 2*CX*f, -CZ - R];
  const a = 1.5*PI + HP*f; return [CX + R*Math.cos(a), -CZ + R*Math.sin(a)];
}
const SV_NS = [7, 8, 3, 8, 7, 8, 3, 8];
function svTs(t0, t1){   // sample parameters from t0 to t1 (t1 may exceed 8)
  const out = [t0];
  for (let k = Math.floor(t0); k < Math.ceil(t1); k++){ const n = SV_NS[((k % 8) + 8) % 8]; for (let i = 1; i <= n; i++){ const t = k + i/n; if (t > t0 + 1e-6 && t < t1 - 1e-6) out.push(t); } }
  out.push(t1); return out;
}
LANDMARKS.svstadium = {zh:'李维斯体育场', en:'Levi\u2019s Stadium', cat:'new', r:190, h:60,
  lt:{m:0, c:'#f1eee6', k:0.42, e:0.5},
  build(){
    const g = new THREE.Group(), M = MB();
    const S = {seat:'#76383c', riser:'#c8c4bb', white:'#ebebe7', dark:'#3a3e44', glass:{c:'#7a909f', m:1, fh:4.6, cw:3.2}, turf:'#4c8a3a', turf2:'#3e7830',
      frame:'#2b2e33', screen:{c:'#1a2734', glow:'#3f7fd6', gk:1.0}, ribbon:{c:'#22262c', glow:'#b8ccff', gk:0.55}, lamp:{c:'#e6eaee', glow:'#fff3d8', gk:2.4},
      green:'#5c7b43', solar:'#29374e', pod:'#b8b3a9', open:'#62676e'};
    const P3 = (p, y) => [p[0], y, p[1]];
    // ---- a raked tier: rows of treads (seats) and risers (concrete) between offsets d0 .. d1, heights y0 .. y1
    function tier(t0, t1, d0, d1, y0, y1, n, aisleEvery){
      const ts = svTs(t0, t1);
      for (let i = 0; i < n; i++){ const dA = d0 + (d1 - d0)*i/n, dB = d0 + (d1 - d0)*(i + 1)/n, yA = y0 + (y1 - y0)*i/n, yB = y0 + (y1 - y0)*(i + 1)/n;
        for (let j = 0; j < ts.length - 1; j++){ const a0 = svRR(dA, ts[j]), a1 = svRR(dA, ts[j + 1]), b0 = svRR(dB, ts[j]), b1 = svRR(dB, ts[j + 1]);
          M.q(S.riser, P3(a0, yA), P3(a1, yA), P3(a1, yB), P3(a0, yB));
          M.q(S.seat, P3(a0, yB), P3(a1, yB), P3(b1, yB), P3(b0, yB)); } }
      // stair aisles: light strips up the rake
      if (aisleEvery) for (let j = 1; j < ts.length - 1; j += aisleEvery){ const t = ts[j];
        for (let i = 0; i < n; i++){ const dA = d0 + (d1 - d0)*i/n, dB = d0 + (d1 - d0)*(i + 1)/n, yB = y0 + (y1 - y0)*(i + 1)/n + 0.03;
          const a = svRR(dA, t), b = svRR(dB, t), e1 = svRR(dA, t + 0.01), tx = e1[0] - a[0], tz = e1[1] - a[1], tl = Math.hypot(tx, tz) || 1, ox = tx/tl*0.7, oz = tz/tl*0.7;
          M.q(S.riser, [a[0] - ox, yB, a[1] - oz], [a[0] + ox, yB, a[1] + oz], [b[0] + ox, yB, b[1] + oz], [b[0] - ox, yB, b[1] - oz]); } }
      return ts;
    }
    // vertical band along a loop at offset d (from t0 to t1), y0 .. y1
    const band = (sp, t0, t1, d, y0, y1) => { const ts = svTs(t0, t1); for (let j = 0; j < ts.length - 1; j++){ const a = svRR(d, ts[j]), b = svRR(d, ts[j + 1]); M.q(sp, P3(a, y0), P3(b, y0), P3(b, y1), P3(a, y1)); } };
    // horizontal ring slab between d0 and d1 at y
    const slab = (sp, t0, t1, d0, d1, y) => { const ts = svTs(t0, t1); for (let j = 0; j < ts.length - 1; j++){ const a0 = svRR(d0, ts[j]), a1 = svRR(d0, ts[j + 1]), b0 = svRR(d1, ts[j]), b1 = svRR(d1, ts[j + 1]); M.q(sp, P3(a0, y), P3(a1, y), P3(b1, y), P3(b0, y)); } };

    // ---- field: turf, end zones, lines (no logos or lettering)
    const inner = svTs(0, 8).slice(0, -1).map(t => svRR(0, t));
    M.cap(S.turf, inner, 0.12);
    for (const s of [-1, 1]) M.q(S.turf2, [-24.4, 0.16, s*45.7], [24.4, 0.16, s*45.7], [24.4, 0.16, s*54.9], [-24.4, 0.16, s*54.9]);
    const ln = (x0, z0, x1, z1) => M.q(S.white, [x0, 0.2, z0], [x1, 0.2, z0], [x1, 0.2, z1], [x0, 0.2, z1]);
    ln(-24.6, -54.9, -24.2, 54.9); ln(24.2, -54.9, 24.6, 54.9); ln(-24.4, -55.1, 24.4, -54.7); ln(-24.4, 54.7, 24.4, 55.1);
    for (let k = -10; k <= 10; k++){ const z = k*4.572; ln(-24.4, z - 0.08, 24.4, z + 0.08); }
    for (const s of [-1, 1]) for (const x of [-2.8, 2.8]) M.box(S.white, 0.25, 9, 0.25, x, 0, s*55.4);   // goal post uprights
    for (const s of [-1, 1]) M.box(S.white, 5.9, 0.25, 0.25, 0, 3.05, s*55.4);
    // ---- lower bowl all round (field wall, 18 rows), concourse openings behind it
    band(S.dark, 0, 8, 0, 0, 1.1);
    tier(0, 8, 0.4, 31, 1.1, 11, 18, 2);
    // ---- podium (plaza-level concourse building) with its deck round the bowl
    M.prism(S.pod, SV_RING, -5, 11, false);
    const outer31 = svTs(0, 8).slice(0, -1).map(t => svRR(31, t));
    M.cap(S.white, SV_RING, 11, [outer31]);
    // podium openings: dark glazing bands and white columns on the outer walls
    for (let i = 0; i < SV_RING.length; i++){ const a = SV_RING[i], b = SV_RING[(i + 1) % SV_RING.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 8) continue;
      const n = onrm(SV_RING, i); M.vq(S.open, a, b, n, 0.1, 2.2, 8.6);
      const k = Math.max(1, Math.round(L/9.75)); for (let j = 0; j <= k; j++){ const p = lerp2(a, b, j/k); M.box(S.white, 1.1, 11, 1.1, p[0] + n[0]*0.6, 0, p[1] + n[1]*0.6); } }
    // ---- mid deck: north, east, south (16 -> 28 m), fascia + ribbon boards, the concourse gap below
    const MID0 = 5.82, MID1 = 11.18;
    band(S.dark, MID0, MID1, 31, 11, 14.2);
    band(S.white, MID0, MID1, 30.6, 14.2, 16.6); band(S.ribbon, MID0, MID1, 30.5, 14.6, 15.8);
    tier(MID0, MID1, 31, 47, 16.6, 28, 10, 3);
    band(S.white, MID0, MID1, 47, 28, 29.6);
    // west: club seats in front of the suite tower (14 -> 20 m)
    band(S.dark, 3.72, 5.28, 31, 11, 13); band(S.white, 3.72, 5.28, 30.7, 13, 14.2);
    tier(3.72, 5.28, 31, 41, 14.2, 20, 7, 3);
    // ---- 32-33 m concourse platform round the north, east and south
    slab(S.white, MID0, MID1, 47, 51, 32.6); band(S.white, MID0, MID1, 51, 31.6, 33);
    // back wall of the mid deck concourse where no upper deck stands (ends), up to the platform
    band(S.pod, MID0, 7.19, 47, 11, 32.6); band(S.pod, 9.81, MID1, 47, 11, 32.6);
    // end-zone platform buildings (to the video boards): d 47 -> 76, 11 -> 33 m
    for (const [t0, t1] of [[MID0, 7.19], [9.81, MID1]]){
      slab(S.white, t0, t1, 51, 76, 33); band(S.pod, t0, t1, 76, 0, 33);
      band(S.open, t0, t1, 76.15, 13.5, 18.5); band(S.open, t0, t1, 76.15, 23.5, 28.5); band(S.white, t0, t1, 76.3, 32, 34.2);
      const a = svRR(47, t0), b = svRR(76, t0), c = svRR(47, t1), d = svRR(76, t1);
      M.q(S.pod, P3(a, 11), P3(b, 11), P3(b, 33), P3(a, 33)); M.q(S.pod, P3(c, 11), P3(d, 11), P3(d, 33), P3(c, 33));
    }
    // ---- east upper deck (34.5 -> 51 m), wrapping both east corners
    const UP0 = 7.19, UP1 = 9.81;
    band(S.white, UP0, UP1, 50.6, 32.6, 35.8); band(S.ribbon, UP0, UP1, 50.5, 33.2, 34.6);
    tier(UP0, UP1, 51, 77, 35.8, 51, 16, 3);
    band(S.white, UP0, UP1, 77, 51, 53.2);
    // its outer facade: open concourses (dark) behind white slab edges, every level
    band(S.pod, UP0, UP1, 77.2, 11, 13.5);
    for (const [y0, y1] of [[13.5, 21], [23, 31], [34, 42], [44, 50.5]]) band(S.open, UP0, UP1, 77.2, y0, y1);
    for (const y of [21, 31, 42]) band(S.white, UP0, UP1, 77.6, y, y + 2.2);
    band(S.pod, UP0, UP1, 77.3, 50.5, 53.2);
    for (const t of [UP0, UP1]){ const a = svRR(47, t), b = svRR(77, t); M.q(S.pod, P3(a, 33), P3(b, 33), P3(b, 53.2), P3(a, 53.2)); M.q(S.pod, P3(a, 11), P3(b, 11), P3(b, 33), P3(a, 33)); }
    // sloped perimeter box columns: 64 ft bays along the east facade, rising to the light canopy
    { const ts = []; for (let t = UP0 + 0.05; t <= UP1 - 0.04; t += 0.16) ts.push(t);
      for (const t of ts){ const a = svRR(82.5, t), b = svRR(78.5, t), inC = t > 7.58 && t < 9.42; M.beam(S.white, P3(a, 0), P3(b, inC ? 59.4 : 53.5), 0.6); } }
    // the light canopy along the top of the east side (56-59 m): truss band, LED field lights facing the field
    { const t0 = 7.58, t1 = 9.42; slab(S.white, t0, t1, 72.5, 80, 59.4); slab(S.frame, t0, t1, 72.5, 80, 55.6); band(S.frame, t0, t1, 72.5, 55.6, 59.4); band(S.white, t0, t1, 80, 55.6, 59.4);
      band(S.lamp, t0, t1, 72.35, 56.2, 58.6);
      const ts = svTs(t0, t1); for (let j = 0; j < ts.length; j++){ const a = svRR(77.5, ts[j]), b = svRR(74, ts[j]); M.beam(S.frame, P3(a, 53.2), P3(b, 55.6), 0.3); } }
    // ---- suite tower on the west sideline: back slab (52 m), stepped suite levels (20 -> 44 m), glazed west face
    const ZT0 = -81, ZT1 = 85;
    M.box(S.pod, 13.5, 57, ZT1 - ZT0, -96.25, -5, (ZT0 + ZT1)/2);
    for (let y = 1; y < 51; y += 4.6) M.q(S.glass, [-103.35, y, ZT0 + 1], [-103.35, y, ZT1 - 1], [-103.35, y + 3.4, ZT1 - 1], [-103.35, y + 3.4, ZT0 + 1]);
    for (const z of [ZT0 - 0.3, ZT1 + 0.3]) for (let y = 13; y < 51; y += 4.6) M.q(S.glass, [-102, y, z], [-90.5, y, z], [-90.5, y + 3.2, z], [-102, y + 3.2, z]);
    const lv = [[-80.5, 20, 25], [-82.5, 25, 30], [-84.5, 30, 35], [-86.5, 35, 40], [-88.2, 40, 44.5], [-89.5, 44.5, 52]];
    for (let i = 0; i < lv.length; i++){ const [xf, y0, y1] = lv[i], ch = 6 + i*1.5, w = -89.5 - xf;
      if (w > 0.2) M.box(S.white, w, y1 - y0, ZT1 - ZT0 - 2*ch, (xf - 89.5)/2, y0, (ZT0 + ZT1)/2);
      M.q(S.glass, [xf - 0.05, y0 + 0.8, ZT0 + ch + 1], [xf - 0.05, y0 + 0.8, ZT1 - ch - 1], [xf - 0.05, y1 - 0.4, ZT1 - ch - 1], [xf - 0.05, y1 - 0.4, ZT0 + ch + 1]);
      M.q(S.white, [xf + 0.6, y0 + 0.02, ZT0 + ch], [xf + 0.6, y0 + 0.02, ZT1 - ch], [xf - 0.3, y0 + 0.02, ZT1 - ch], [xf - 0.3, y0 + 0.02, ZT0 + ch]);
      // a few rows of balcony seats in front of each suite level
      if (i < 5){ const xs = xf + 2.4; M.q(S.seat, [xs, y0 + 0.4, ZT0 + ch], [xs, y0 + 0.4, ZT1 - ch], [xf, y0 + 1.6, ZT1 - ch], [xf, y0 + 1.6, ZT0 + ch]); }
      for (let z = ZT0 + ch + 8; z < ZT1 - ch - 4; z += 8) M.box(S.white, 0.4, y1 - y0 - 1, 0.4, xf - 0.2, y0 + 0.5, z);
    }
    // tower roof: green roof terrace, solar arrays, the light rack along the field edge
    M.box(S.white, 14.4, 1.2, ZT1 - ZT0 + 1, -96.25, 51.6, (ZT0 + ZT1)/2);
    for (let z = ZT0 + 4; z < ZT1 - 10; z += 22){ M.box(S.green, 9, 0.5, 14, -97.5, 52.8, z + 7); M.box(S.solar, 9.5, 0.4, 5.5, -97.5, 53.4, z + 18); }
    M.box(S.frame, 1.2, 3.4, ZT1 - ZT0 - 20, -89.6, 52.8, (ZT0 + ZT1)/2); M.q(S.lamp, [-88.95, 53.4, ZT0 + 12], [-88.95, 53.4, ZT1 - 12], [-88.95, 55.8, ZT1 - 12], [-88.95, 55.8, ZT0 + 12]);
    // ---- the two video boards above the end-zone platforms (abstract colour field), on four tall posts each
    for (const s of [-1, 1]){
      const zf = s*133.6, zb = s*137.2;
      M.box(S.frame, 80, 4, 6.5, 1.4, 33, s*137.1);                         // base structure
      M.box(S.frame, 59.5, 17.4, Math.abs(zb - zf), -17.75, 36.8, (zf + zb)/2);
      M.q(S.screen, [-47.2, 37.6, zf - s*0.06], [11.7, 37.6, zf - s*0.06], [11.7, 53.6, zf - s*0.06], [-47.2, 53.6, zf - s*0.06]);
      for (const x of [-47.5, -27.5, -8.5, 10.5]) M.box(S.white, 1.8, 26, 9, x, 33, s*141);
      M.box(S.white, 61, 1.2, 9, -18.5, 57.8, s*141);
      M.q(S.dark, [-47.5, 37, zb + s*0.05], [12, 37, zb + s*0.05], [12, 54, zb + s*0.05], [-47.5, 54, zb + s*0.05]);
    }
    // ---- light masts at the two east corners (53 m) and the south ramps' stair towers
    for (const tm of [7.38, 9.62]){ const p = svRR(86, tm); M.box(S.white, 2.2, 53, 2.2, p[0], 0, p[1]); M.box(S.lamp, 6, 2.2, 1.2, p[0], 50.8, p[1]); }
    M.out(g); return g;
  }};
SG_PLACES.push(Object.assign({type:'svstadium'}, llOff(37.4033, -121.9694, -35.9, 13.1), {rot:0.494}));

// =====================================================================================================================
// San José City Hall (2005, Richard Meier & Partners): the 18-storey office tower (21 x 78 m, 87 m to the top of its
// end towers) with the big aluminium brise-soleil on its plaza (west-south-west) face, glass curtain wall with white
// panels on the other face, white concrete shear-wall "bookends" and rooftop penthouses; the free-standing glass rotunda
// (30 m across, 34 m high, glass drum and glass dome on a white steel frame) on the 5th Street axis facing the Civic
// Plaza on Santa Clara Street; the curved three-storey Council Wing, the elevated walkways linking it all. Night: lit
// office windows; the rotunda and the tower crown in the colour-changing light used for special occasions (since 2017).
// Frame: x along the tower (+x = towards San Fernando St), z across (+z = towards 4th St / the plaza side); origin at
// ref (-45, +15) of sjcityhall.
// =====================================================================================================================
const CH_CW = [[-23.7, 95.3], [-23.6, 79.1], [-15.9, 79.1], [-15.8, 72.2], [-12.0, 69.0], [-5.7, 62.2], [-1.9, 57.3], [3.0, 50.0], [7.3, 42.2], [9.9, 36.1], [13.8, 24.3], [16.2, 12.0], [16.8, 0.3], [2.1, 0.4], [2.5, -2.3], [31.5, -2.4], [31.5, 0.1], [24.4, 0.1], [24.5, 4.1], [31.6, 4.1], [31.6, 0.6], [34.3, 0.6], [34.3, 41.3], [31.1, 41.3], [31.2, 88.7], [31.7, 88.7], [31.7, 95.2]];
const CH_CWF = [[-31.4, 77.1], [-31.8, 75.4], [-27.8, 73.8], [-22.7, 71.0], [-15.5, 65.4], [-7.9, 57.7], [-2.1, 50.1], [3.5, 39.7], [9.0, 24.5], [11.5, 12.1], [12.1, 0.3], [16.8, 0.3], [16.4, 9.1], [15.7, 14.9], [13.1, 27.1], [8.5, 39.5], [4.6, 47.4], [1.5, 52.4], [-5.7, 62.2], [-14.1, 71.0], [-15.8, 72.2], [-17.2, 69.1], [-24.3, 74.1]];
const CH_B40 = [[6.2, -2.4], [5.9, -8.2], [4.6, -13.9], [0.6, -25.0], [-0.8, -27.5], [-4.4, -32.2], [-9.0, -36.2], [-15.0, -39.4], [-24.0, -39.9], [-32.6, -38.0], [-39.6, -34.6], [-43.1, -39.8], [-37.9, -42.9], [-32.4, -45.1], [-22.8, -46.4], [-16.9, -46.0], [-11.1, -44.5], [-4.5, -40.4], [0.3, -35.8], [4.0, -31.1], [6.9, -25.8], [10.1, -16.9], [11.4, -11.2], [12.2, -2.3]];
const CH_B43 = [[-48.4, 78.9], [-48.0, 75.6], [-41.7, 76.0], [-41.7, 62.7], [-44.7, 62.6], [-47.5, 61.8], [-50.1, 60.5], [-50.9, 60.0], [-49.5, 57.8], [-45.8, 59.0], [-45.3, 56.0], [-42.4, 56.6], [-36.5, 56.7], [-33.5, 56.3], [-28.1, 54.5], [-26.2, 57.3], [-21.3, 54.1], [-14.5, 48.4], [-10.0, 43.6], [-4.7, 36.5], [-1.4, 30.7], [2.3, 22.3], [4.6, 13.9], [5.8, 5.3], [1.3, 3.5], [2.1, 0.4], [12.1, 0.3], [11.9, 9.2], [11.1, 15.1], [8.1, 27.3], [2.3, 42.3], [-4.2, 53.0], [-9.9, 59.9], [-17.7, 67.5], [-25.2, 72.4], [-31.8, 75.4], [-31.4, 77.1], [-38.7, 78.8]];
const CH_LOW = [[-45.5, -45.5], [-45.5, -55.9], [-2.6, -55.9], [-2.4, -41.4], [-6.5, -44.1], [-11.0, -46.3], [-15.7, -47.7], [-20.7, -48.4], [-25.6, -48.4], [-30.5, -47.6], [-35.2, -46.0], [-39.6, -43.8], [-39.7, -45.3]];
LANDMARKS.sjcityhall = {zh:'圣何塞市政厅', en:'San José City Hall', cat:'new', r:122, h:87,
  lt:{m:1, c:'#e8f0ff', k:0.6, anim:'cycle', c2:'#86aaff'},
  build(){
    const g = new THREE.Group(), M = MB();
    const S = {white:{c:'#f0f0ec', m:0, lk:0.35}, panel:{c:'#e4e6e4', m:0, lk:0.3}, glass:{c:'#8ea2b1', m:1, fh:4.2, cw:3.0}, dark:'#3a4048',
      rot:{c:'#a9c2cf', m:0, lk:1.15}, rib:{c:'#f4f4f0', m:0, lk:0.8}, stone:'#d9d4c8', lou:{c:'#dfe3e4', m:0, lk:0.45}, pave:'#c9c4b8', red:{c:'#7a1a14', glow:'#ff2a1a', gk:2}};
    // ---------------- tower ----------------
    const X0 = -63.7, X1 = 18.3, Z0 = -77.3, Z1 = -55.9, TOP = 76;
    M.box(S.glass, X1 - X0 - 1, TOP + 5, Z1 - Z0 - 1, (X0 + X1)/2, -5, (Z0 + Z1)/2);
    // ENE face: curtain wall with white spandrel bands and vertical mullions
    for (let y = 4.6; y < TOP - 1; y += 4.2) M.q(S.panel, [X0, y, Z0 - 0.05], [X1, y, Z0 - 0.05], [X1, y + 1.1, Z0 - 0.05], [X0, y + 1.1, Z0 - 0.05]);
    for (let x = X0 + 3; x < X1 - 1; x += 3) M.q(S.panel, [x - 0.12, 0, Z0 - 0.1], [x + 0.12, 0, Z0 - 0.1], [x + 0.12, TOP, Z0 - 0.1], [x - 0.12, TOP, Z0 - 0.1]);
    // WSW face: glazing behind the brise-soleil (vertical white fins + horizontal aluminium louvres 1.6 m out)
    for (let y = 4.6; y < TOP - 1; y += 4.2) M.q(S.panel, [X0, y, Z1 + 0.05], [X1, y, Z1 + 0.05], [X1, y + 0.9, Z1 + 0.05], [X0, y + 0.9, Z1 + 0.05]);
    const BX0 = -51.5, BX1 = 11.5;
    for (let x = BX0; x <= BX1 + 0.1; x += 9) M.box(S.white, 0.5, TOP - 8 + 3, 2.2, x, 8, Z1 + 1.1);
    for (let y = 9.2; y < TOP - 1.5; y += 1.05) M.q(S.lou, [BX0, y, Z1 + 0.6], [BX1, y, Z1 + 0.6], [BX1, y + 0.45, Z1 + 2.0], [BX0, y + 0.45, Z1 + 2.0]);
    M.box(S.white, BX1 - BX0 + 0.5, 0.8, 2.4, (BX0 + BX1)/2, TOP + 2.2, Z1 + 1.2);
    // bookends: white concrete shear walls at both ends, a slot of windows in each
    for (const [x, w] of [[X0 - 0.4, 1.4], [X1 + 0.4, 1.4]]){ M.box(S.white, w, TOP + 6, Z1 - Z0 + 0.8, x, -5, (Z0 + Z1)/2);
      for (let y = 5; y < TOP - 2; y += 4.2) M.q(S.glass, [x + Math.sign(x)*0.75, y, -68.5], [x + Math.sign(x)*0.75, y, -64.7], [x + Math.sign(x)*0.75, y + 2.6, -64.7], [x + Math.sign(x)*0.75, y + 2.6, -68.5]); }
    // roof: parapet, penthouses and the end towers (stairs / lifts) to 80-87 m, the thin west blade
    M.prism(S.white, [[X0, Z0], [X1, Z0], [X1, Z1], [X0, Z1]], TOP - 0.5, TOP + 1.2, true);
    M.box(S.panel, 21, 4.2, 13.3, -7.4, TOP, -67.35);
    M.box(S.white, 12.4, 85.7 + 5, 12, -51.7, -5, -47.2);                                   // west stair tower on the plaza side
    for (let y = 6; y < 82; y += 4.2) M.q(S.glass, [-51.7 - 4.5, y, -41.15], [-51.7 + 4.5, y, -41.15], [-51.7 + 4.5, y + 2.4, -41.15], [-51.7 - 4.5, y + 2.4, -41.15]);
    M.box(S.white, 1.9, 86.9 + 5, 12.2, -61.55, -5, -59.2);                                  // the blade
    M.box(S.white, 10.4, 82.5 + 5, 25.2, 17, -5, -71.2);                                     // east service tower
    for (let y = 6; y < 80; y += 4.2) M.q(S.glass, [22.25, y, -80], [22.25, y, -62], [22.25, y + 2.4, -62], [22.25, y + 2.4, -80]);
    M.box(S.white, 2.4, 74.8 + 5, 9, 23.4, -5, -73.6);
    M.box(S.red, 0.6, 0.6, 0.6, -61.55, 86.9, -59.2);
    // podium along 6th Street (14 m) and the low wing towards the rotunda (10 m, curved front)
    const POD = [[-46.1, -95.2], [13.4, -95.3], [13.4, -77.3], [-44.9, -77.2]];
    M.prism(S.panel, POD, -5, 14.2, true); winPoly(M, S.glass, POD, 1, 4.6, 3, 3.2, 2.6, 3, 0.1);
    M.prism(S.panel, CH_LOW, -5, 10, true); winPoly(M, S.glass, CH_LOW, 0.6, 4.6, 2, 2.6, 2.2, 3.1, 0.1);
    // ---------------- rotunda ----------------
    const RX = -14.15, RZ = -1.95, RR = 15.2, RY = 22.5, RT = 34;
    M.rev(S.stone, [[RR + 1.4, -5], [RR + 1.4, 0.6], [RR - 0.2, 0.6]], RX, RZ, 40);
    M.cyl(S.rot, RR, 0.6, RY, RX, RZ, 40, false);
    const domeR = (RR*RR + (RT - RY)*(RT - RY))/(2*(RT - RY)), dprof = [];
    for (let i = 0; i <= 8; i++){ const y = RY + (RT - RY)*i/8, r = i === 8 ? 0 : Math.sqrt(Math.max(0, domeR*domeR - Math.pow(y - (RT - domeR), 2))); dprof.push([r, y]); }
    M.rev(S.rot, dprof, RX, RZ, 40);
    for (let i = 0; i < 36; i++){ const a = TAU*i/36, c = Math.cos(a), s = Math.sin(a);
      M.box(S.rib, 0.35, RY - 0.6, 0.7, RX + c*(RR + 0.3), 0.6, RZ + s*(RR + 0.3), -a);
      if (i % 2 === 0) for (let j = 0; j < 8; j++){ const [r0, y0] = dprof[j], [r1, y1] = dprof[j + 1]; M.beam(S.rib, [RX + c*(r0 + 0.25), y0, RZ + s*(r0 + 0.25)], [RX + c*(r1 + 0.25), y1, RZ + s*(r1 + 0.25)], 0.18); } }
    for (const y of [6, 11.5, 17]) M.rev(S.rib, [[RR + 0.55, y], [RR + 0.55, y + 0.4]], RX, RZ, 40);
    M.rev(S.rib, [[RR + 0.9, RY - 0.5], [RR + 0.9, RY + 0.8], [RR - 0.5, RY + 0.8]], RX, RZ, 40);
    M.cyl(S.rib, 1.6, RT - 0.4, RT + 0.6, RX, RZ, 12, true);
    // entrance canopy towards the plaza (west, -x)
    M.box(S.white, 6, 0.5, 12, RX - RR - 2.6, 5.2, RZ); for (const s of [-1, 1]) M.box(S.white, 0.4, 5.2, 0.4, RX - RR - 5.2, 0, RZ + s*5.6);
    // ---------------- elevated walkways round the rotunda (curved, white, on columns) ----------------
    M.prism(S.white, CH_B40, 6.8, 9.8, true, true);
    winPoly(M, S.glass, CH_B40, 7.4, 3, 1, 2.6, 2.0, 1.8, 0.08);
    for (let i = 0; i < 11; i++){ const a = CH_B40[i], b = CH_B40[CH_B40.length - 1 - i], p = lerp2(a, b, 0.5); M.box(S.white, 0.7, 6.8, 0.7, p[0], 0, p[1]); }
    // ---------------- Council Wing: curved three-storey building, the chamber volume, stair towers ----------------
    M.prism(S.panel, CH_CW, -5, 14.4, true);
    winPoly(M, S.glass, CH_CW, 1.2, 4.4, 3, 3.0, 2.4, 3.0, 0.1);
    M.prism(S.glass, CH_CWF, 0, 12.2, false); M.prism(S.white, CH_CWF, 12.2, 13.0, true);
    for (let i = 0; i < 11; i++){ const p = CH_CWF[i]; M.box(S.white, 0.6, 12.2, 0.6, p[0], 0, p[1]); }
    M.prism(S.white, [[20.8, 79.4], [20.6, 46.2], [29.6, 46.1], [29.7, 79.3]], 14.4, 19.3, true);
    M.prism(S.white, [[-12.4, 79.1], [-12.4, 72.3], [-10.0, 72.2], [-10.0, 69.9], [-5.2, 70.0], [-5.2, 79.0]], 14.4, 18.8, true);
    M.prism(S.white, [[24.5, 4.1], [24.4, 0.1], [31.5, 0.1], [31.6, 4.1]], 14.4, 22, true);
    M.prism(S.white, [[20.8, 0.3], [20.8, 12], [31.5, 12], [31.5, 0.3]], 13, 14.6, true);   // walkway bridge to the rotunda level
    // curved terrace / planter walls along the plaza
    M.prism(S.stone, CH_B43, -4, 0.7, true);
    M.out(g); return g;
  }};
SG_PLACES.push({type:'sjcityhall', lat:37.3375649, lon:-121.8859096, rot:-1.038});

// =====================================================================================================================
// Cathedral Basilica of St. Joseph, San José (1877; portico 1884, dome 1885): Greek-cross plan with a west narthex;
// pedimented portico of four giant Corinthian columns between two square bell towers with octagonal belfries and
// small domes; the big ribbed ("pumpkin") dome over the crossing with drum, lantern and cross; four small domes over
// the shrines; coffered barrel-vaulted arms under gabled roofs ending in pediments; cream walls, white trim, domes in
// the silver "aluminized" copper. Floodlit warm at night. Frame: +x = towards the facade (west-south-west, Market St),
// z across the nave; origin = centre of the OSM footprint.
// =====================================================================================================================
// arched window on a wall segment a -> b (normal n), centred at u (0-1), width w, sill y0, springing y1
function archWin(M, sp, a, b, n, off, u, w, y0, y1){
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), du = w/2/L, p0 = lerp2(a, b, u - du), p1 = lerp2(a, b, u + du), ox = n[0]*off, oz = n[1]*off;
  M.q(sp, [p0[0] + ox, y0, p0[1] + oz], [p1[0] + ox, y0, p1[1] + oz], [p1[0] + ox, y1, p1[1] + oz], [p0[0] + ox, y1, p0[1] + oz]);
  const c = lerp2(a, b, u), tx = (b[0] - a[0])/L, tz = (b[1] - a[1])/L, k = 6;
  for (let i = 0; i < k; i++){ const t0 = PI*i/k, t1 = PI*(i + 1)/k, r = w/2;
    M.t(sp, [c[0] + ox, y1, c[1] + oz], [c[0] + ox + tx*Math.cos(t0)*r, y1 + Math.sin(t0)*r, c[1] + oz + tz*Math.cos(t0)*r], [c[0] + ox + tx*Math.cos(t1)*r, y1 + Math.sin(t1)*r, c[1] + oz + tz*Math.cos(t1)*r]); }
}
LANDMARKS.sjcathedral = {zh:'圣约瑟夫主教座堂', en:'Cathedral Basilica of St. Joseph', cat:'old', r:40, h:38,
  lt:{m:0, c:'#ffe0b4', k:0.85, e:0.35, anim:'breathe'},
  build(){
    const g = new THREE.Group(), M = MB();
    const S = {wall:'#e5d6b6', trim:'#f3ece0', roof:'#a7abb0', dome:'#c4c8cc', glass:{c:'#3d4352', glow:'#ffc98a', gk:0.35}, door:'#4c3a2b', step:'#cfc8b8', cross:'#d8c690', dark:'#5a5e66'};
    const WH = 14;                          // wall / cornice height
    // the cross plan (OSM): east arm, transept with crossing, west arm, tower block, portico
    const arms = [[-28, -16.6, -9.6, 10.3], [-16.6, 2.9, -21.1, 22.1], [2.9, 10.7, -9.6, 10.1], [10.7, 19.4, -15.4, 16.2]];
    M.prism(S.step, [[-29, -11], [20.4, -11], [20.4, -16.4], [26.5, -16.4], [26.5, 17.2], [20.4, 17.2], [20.4, 11.2], [-29, 11.2]], -5, 0.9, true);
    M.prism(S.step, [[-17.6, -22.1], [3.9, -22.1], [3.9, 23.1], [-17.6, 23.1]], -5, 0.9, true);
    for (const [x0, x1, z0, z1] of arms){ const P = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]; M.prism(S.wall, P, 0.9, WH, true);
      M.prism(S.trim, [[x0 - 0.5, z0 - 0.5], [x1 + 0.5, z0 - 0.5], [x1 + 0.5, z1 + 0.5], [x0 - 0.5, z1 + 0.5]], WH - 1.3, WH, true);   // cornice
      M.prism(S.trim, [[x0 - 0.3, z0 - 0.3], [x1 + 0.3, z0 - 0.3], [x1 + 0.3, z1 + 0.3], [x0 - 0.3, z1 + 0.3]], 0.9, 2.2, false); }
    // pilasters at the corners of every arm
    for (const [x0, x1, z0, z1] of arms) for (const x of [x0, x1]) for (const z of [z0, z1]) M.box(S.trim, 1.2, WH - 2.2, 1.2, x, 0.9, z);
    // gabled roofs and pediments: east and west arms along x, the transept arms along z
    M.gable(S.roof, -22.3, 0.35, 11.4, 19.9, WH, 5.2, 0, 0.4, S.trim);
    M.gable(S.roof, 6.8, 0.25, 7.8, 19.7, WH, 5.2, 0, 0.4, S.trim);
    M.gable(S.roof, -6.85, -15.6, 11, 19.5, WH, 5.2, HP, 0.4, S.trim); M.gable(S.roof, -6.85, 16.6, 11, 19.5, WH, 5.2, HP, 0.4, S.trim);
    M.box(S.roof, 19.5, 2.2, 20, -6.85, WH, 0.5);                                   // crossing roof under the drum
    // arched windows (stained glass) on the arms
    const wins = [[[-28, 10.3], [-28, -9.6], [-1, 0], [0.5]], [[-16.6, 22.1], [-16.6, 10.3], [-1, 0], [0.5]], [[2.9, 10.1], [2.9, 22.1], [1, 0], [0.5]],
      [[-16.6, -9.6], [-16.6, -21.1], [-1, 0], [0.5]], [[2.9, -21.1], [2.9, -9.6], [1, 0], [0.5]], [[-16.6, 22.1], [2.9, 22.1], [0, 1], [0.25, 0.75]],
      [[2.9, -21.1], [-16.6, -21.1], [0, -1], [0.25, 0.75]], [[-28, 10.3], [-16.6, 10.3], [0, 1], [0.5]], [[-16.6, -9.6], [-28, -9.6], [0, -1], [0.5]],
      [[2.9, 10.1], [10.7, 10.1], [0, 1], [0.5]], [[10.7, -9.6], [2.9, -9.6], [0, -1], [0.5]]];
    for (const [a, b, n, us] of wins) for (const u of us) archWin(M, S.glass, a, b, n, 0.08, u, 2.6, 4.2, 9.6);
    // rose / oculus windows in the transept pediments
    for (const s of [-1, 1]) M.rev(S.glass, [[0, 0], [1.4, 0]], -6.85, s*22.2, 12);
    // ---------------- facade: portico of four Corinthian columns, entablature, pediment ----------------
    const PX = 24.4, CY0 = 1.4, CH = 12.3;
    M.box(S.step, 6, 0.5, 19.6, 21.9, 0.9, 0.2);
    for (const z of [-7.6, -2.55, 2.55, 7.6]){ M.box(S.trim, 1.9, 0.6, 1.9, 23.2, CY0 - 0.5, z); M.cyl(S.trim, 0.62, CY0, CY0 + CH - 1.4, 23.2, z, 14, false);
      M.rev(S.trim, [[0.62, CY0 + CH - 1.4], [0.95, CY0 + CH - 0.4], [1.0, CY0 + CH]], 23.2, z, 10); }
    for (const z of [-7.6, 7.6]) M.box(S.trim, 1.4, CH, 1.4, 19.9, CY0, z);           // responding pilasters
    M.box(S.trim, 6.2, 2, 20.4, 21.6, CY0 + CH, 0.2);                                   // entablature
    M.gable(S.roof, 21.6, 0.2, 6.2, 20.4, CY0 + CH + 2, 4.3, 0, 0, S.trim);
    for (const s of [-1, 1]) M.beam(S.trim, [24.75, CY0 + CH + 2, s*10.4 + 0.2], [24.75, CY0 + CH + 6.3, 0.2], 0.35);
    M.box(S.trim, 0.6, 0.4, 20.8, 24.6, CY0 + CH + 1.7, 0.2);
    // doors: three under the portico
    for (const z of [-5, 0.2, 5.4]) M.q(S.door, [19.45, 0.9, z - 1.4], [19.45, 0.9, z + 1.4], [19.45, z === 0.2 ? 6.4 : 5, z + 1.4], [19.45, z === 0.2 ? 6.4 : 5, z - 1.4]);
    // ---------------- twin bell towers ----------------
    for (const zc of [-11.1, 11.9]){
      const xc = 15.05, hw = 4.35;
      M.prism(S.wall, [[xc - hw, zc - hw], [xc + hw, zc - hw], [xc + hw, zc + hw], [xc - hw, zc + hw]], WH, 21.5, true);
      M.prism(S.trim, [[xc - hw - 0.4, zc - hw - 0.4], [xc + hw + 0.4, zc - hw - 0.4], [xc + hw + 0.4, zc + hw + 0.4], [xc - hw - 0.4, zc + hw + 0.4]], 20.6, 21.6, true);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) M.box(S.trim, 1.0, 21.5 - 1, 1.0, xc + sx*hw, 0.9, zc + sz*hw);
      // clock-stage windows
      for (const [a, b, n] of [[[xc + hw, zc - hw], [xc + hw, zc + hw], [1, 0]], [[xc - hw, zc + hw], [xc - hw, zc - hw], [-1, 0]], [[xc + hw, zc + hw], [xc - hw, zc + hw], [0, 1]], [[xc - hw, zc - hw], [xc + hw, zc - hw], [0, -1]]]){
        archWin(M, S.glass, a, b, n, 0.08, 0.5, 1.8, 15.6, 18.4); archWin(M, S.glass, a, b, n, 0.08, 0.5, 1.6, 6.5, 10.5); }
      // octagonal belfry with arched openings, small dome, lantern and cross
      const oct = []; for (let i = 0; i < 8; i++){ const a = PI/8 + i*PI/4; oct.push([xc + Math.cos(a)*3.6, zc + Math.sin(a)*3.6]); }
      M.prism(S.wall, oct, 21.6, 27.6, false);
      for (let i = 0; i < 8; i++){ const a = oct[i], b = oct[(i + 1) % 8], n = [Math.cos(PI/4*(i + 1)), Math.sin(PI/4*(i + 1))]; archWin(M, S.dark, a, b, n, 0.06, 0.5, 1.5, 22.6, 25.4); }
      const oct2 = oct.map(p => [xc + (p[0] - xc)*1.12, zc + (p[1] - zc)*1.12]); M.prism(S.trim, oct2, 27.4, 28.2, true);
      M.rev(S.dome, [[3.5, 28.2], [3.4, 29.3], [3.0, 30.4], [2.2, 31.3], [1.0, 31.9], [0, 32.05]], xc, zc, 16);
      M.cyl(S.trim, 0.6, 32, 33.4, xc, zc, 8, true); M.rev(S.dome, [[0.75, 33.4], [0.5, 34.0], [0, 34.3]], xc, zc, 8);
      M.box(S.cross, 0.22, 2.3, 0.22, xc, 34.3, zc); M.box(S.cross, 0.22, 0.22, 1.2, xc, 35.6, zc);
    }
    // ---------------- crossing: drum, ribbed dome, lantern, cross; four small shrine domes ----------------
    const DX = -6.85, DZ = 0.5;
    M.cyl(S.wall, 8.4, WH + 2, 20.3, DX, DZ, 24, false);
    M.rev(S.trim, [[8.9, 20.0], [8.9, 21.0], [8.3, 21.0]], DX, DZ, 24);
    for (let i = 0; i < 12; i++){ const a = TAU*(i + 0.5)/12, p0 = [DX + Math.cos(a)*8.45, DZ + Math.sin(a)*8.45];
      M.box(S.trim, 0.7, 6.2, 0.6, p0[0], WH + 2, p0[1], -a);
      const a2 = TAU*i/12, c = [DX + Math.cos(a2)*8.45, DZ + Math.sin(a2)*8.45], t = [-Math.sin(a2), Math.cos(a2)];
      archWin(M, S.glass, [c[0] - t[0]*1.5, c[1] - t[1]*1.5], [c[0] + t[0]*1.5, c[1] + t[1]*1.5], [Math.cos(a2), Math.sin(a2)], 0.08, 0.5, 1.5, 16.8, 18.9); }
    const dp = [[8.6, 21], [8.75, 22.6], [8.5, 24.3], [7.8, 26], [6.6, 27.6], [5.0, 28.9], [3.1, 29.9], [1.7, 30.4]];
    M.rev(S.dome, dp, DX, DZ, 32);
    for (let i = 0; i < 16; i++){ const a = TAU*i/16, c = Math.cos(a), s = Math.sin(a);
      for (let j = 0; j < dp.length - 1; j++) M.beam(S.trim, [DX + c*(dp[j][0] + 0.12), dp[j][1], DZ + s*(dp[j][0] + 0.12)], [DX + c*(dp[j + 1][0] + 0.12), dp[j + 1][1], DZ + s*(dp[j + 1][0] + 0.12)], 0.12); }
    M.cyl(S.trim, 1.7, 30.3, 33.4, DX, DZ, 12, false);
    for (let i = 0; i < 8; i++){ const a = TAU*i/8; M.q(S.dark, [DX + Math.cos(a - 0.2)*1.75, 31, DZ + Math.sin(a - 0.2)*1.75], [DX + Math.cos(a + 0.2)*1.75, 31, DZ + Math.sin(a + 0.2)*1.75], [DX + Math.cos(a + 0.2)*1.75, 32.8, DZ + Math.sin(a + 0.2)*1.75], [DX + Math.cos(a - 0.2)*1.75, 32.8, DZ + Math.sin(a - 0.2)*1.75]); }
    M.rev(S.dome, [[2.0, 33.4], [1.9, 34.1], [1.2, 34.9], [0, 35.3]], DX, DZ, 12);
    M.box(S.cross, 0.25, 2.8, 0.25, DX, 35.3, DZ); M.box(S.cross, 0.25, 0.25, 1.5, DX, 36.9, DZ);
    for (const [x, z] of [[-16.6, -9.6], [-16.6, 10.3], [2.9, -9.6], [2.9, 10.1]]){
      M.cyl(S.wall, 2.3, WH, 16, x, z, 12, false); M.rev(S.dome, [[2.5, 16], [2.3, 17.2], [1.5, 18.2], [0, 18.6]], x, z, 12); M.box(S.cross, 0.15, 1, 0.15, x, 18.6, z); }
    M.out(g); return g;
  }};
SG_PLACES.push(Object.assign({type:'sjcathedral'}, llOff(37.3335, -121.8895, -85.75, -63.79), {rot:-2.602}));

// =====================================================================================================================
// Winchester Mystery House, San José (built 1886-1922 without a master plan): the sprawling Queen Anne mansion, built
// exactly on its real footprint (OSM, 190 corners): two storeys over most of it, three plus attics in the front part
// towards Winchester Boulevard, a jumble of steep red gabled and hipped roofs, many chimneys, the octagonal spire tower
// and the round turret with its conical roof on the front corners, a square observation tower, bay windows, the front
// veranda; buttery-yellow walls, cream trim, red roofs. Two small outbuildings inside its outline are rebuilt too.
// Frame: +x = east (front, Winchester Blvd), +z = south; origin = footprint centroid.
// =====================================================================================================================
const WM_RING = [[-50.4, -21.9], [-50.4, -32.3], [-39.3, -32.2], [-39.3, -30.1], [-38.6, -30.1], [-38.6, -32.7], [-31.5, -32.6], [-31.6, -30.0], [-27.5, -30.0], [-27.5, -30.8], [-24.3, -30.8], [-24.3, -29.3], [-22.7, -29.3], [-22.7, -41.6], [-16.2, -41.5], [-16.1, -44.4], [-10.0, -44.3], [-10.1, -42.1], [-5.9, -42.1], [-5.9, -39.0], [9.7, -38.9], [9.7, -34.8], [17.9, -34.7], [17.8, -26.5], [9.7, -26.5], [8.9, -25.6], [9.5, -22.1], [3.7, -22.0], [3.8, -13.6], [4.9, -13.7], [4.9, -10.2], [9.6, -10.3], [9.6, -12.3], [14.8, -12.4], [15.8, -13.5], [15.3, -14.0], [15.6, -15.4], [16.3, -15.8], [17.2, -15.5], [18.1, -16.2], [17.7, -16.7], [17.9, -17.4], [18.6, -17.8], [19.6, -17.2], [21.8, -19.8], [26.3, -15.3], [28.7, -17.5], [30.4, -17.1], [31.7, -16.3], [31.9, -14.3], [30.2, -12.6], [30.1, -8.9], [35.4, -8.8], [35.4, -8.1], [39.8, -8.1], [39.8, -4.9], [41.0, -3.9], [40.9, -3.0], [39.7, -1.9], [39.6, 3.8], [40.5, 4.7], [40.6, 5.6], [39.6, 6.5], [39.5, 10.6], [35.1, 10.9], [30.8, 10.5], [30.8, 13.0], [31.4, 13.0], [31.4, 14.8], [32.8, 15.6], [33.7, 16.8], [34.0, 18.5], [33.5, 19.9], [31.8, 21.4], [24.3, 21.6], [24.3, 23.7], [20.0, 23.7], [20.1, 21.5], [19.5, 21.5], [19.5, 16.3], [17.5, 16.2], [17.5, 16.9], [12.9, 16.9], [12.9, 18.0], [13.2, 18.0], [13.2, 25.6], [18.3, 25.7], [18.2, 32.7], [23.2, 32.7], [23.1, 38.6], [19.7, 38.5], [19.6, 44.0], [24.0, 44.0], [23.9, 50.5], [9.6, 50.4], [9.6, 53.6], [3.9, 53.5], [3.9, 54.0], [0.5, 54.0], [0.5, 56.3], [-5.3, 56.3], [-5.3, 53.9], [-6.0, 53.9], [-5.9, 40.4], [4.0, 40.4], [3.9, 49.3], [8.3, 49.3], [8.3, 43.9], [13.0, 43.9], [13.0, 38.5], [9.3, 38.4], [9.4, 30.3], [4.0, 30.2], [4.0, 31.9], [0.9, 31.8], [0.9, 31.2], [-3.3, 31.2], [-3.2, 26.3], [-2.5, 26.3], [-2.5, 25.1], [1.1, 25.1], [1.1, 26.3], [1.7, 26.3], [1.7, 28.4], [9.7, 28.5], [9.8, 18.5], [7.7, 18.5], [7.7, 16.1], [8.2, 16.1], [8.3, 10.9], [1.6, 10.9], [1.8, 12.6], [0.7, 12.6], [0.7, 13.5], [-3.7, 13.4], [-3.7, 14.2], [-7.7, 14.2], [-7.7, 13.4], [-10.0, 13.4], [-10.0, 14.6], [-20.2, 14.5], [-20.2, 15.0], [-17.5, 15.0], [-17.5, 23.0], [-16.8, 23.2], [-16.5, 24.1], [-17.5, 25.4], [-17.6, 37.1], [-26.7, 37.0], [-26.7, 33.6], [-27.2, 33.6], [-27.2, 28.7], [-27.9, 28.7], [-27.9, 22.9], [-30.0, 22.9], [-29.9, 15.8], [-30.8, 15.8], [-30.7, 9.6], [-26.6, 9.7], [-26.6, 5.0], [-24.9, 5.0], [-24.9, 3.1], [-23.4, 3.1], [-23.4, 2.5], [-17.7, 2.5], [-17.7, -0.7], [-26.7, -0.2], [-26.7, -2.7], [-29.1, -2.8], [-29.1, -8.8], [-22.6, -8.8], [-22.6, -6.7], [-22.0, -6.7], [-22.0, -8.4], [-17.9, -8.4], [-17.9, -6.7], [-15.5, -6.7], [-15.6, -4.6], [-11.5, -4.5], [-11.5, -11.8], [-7.6, -11.8], [-7.5, -15.6], [-9.4, -15.7], [-9.3, -21.3], [-15.7, -21.3], [-15.7, -22.0], [-27.3, -22.1], [-27.3, -20.9], [-40.4, -21.0], [-40.4, -21.8]];
const WM_RECT = [[-11.4, -7.4, 39.6, 10.6], [-22.4, -38.4, 8.6, -22.4], [-50.4, -29.4, -22.4, -22.4], [-26.4, 5.6, -20.4, 36.6], [-7.4, -22.4, 3.6, -7.4], [-5.4, 40.6, 3.6, 53.6], [-17.4, -4.4, -11.4, 14.6], [15.6, -15.4, 29.6, -7.4], [8.6, 10.6, 30.6, 15.6], [13.6, 32.6, 19.6, 49.6], [8.6, -34.4, 17.6, -26.4], [19.6, 15.6, 32.6, 20.6], [9.6, 25.6, 17.6, 32.6], [-22.4, -41.4, -6.4, -38.4], [-26.4, -6.4, -17.4, -1.4], [-20.4, 15.6, -17.4, 30.6], [-29.4, 9.6, -26.4, 22.6], [-20.4, 2.6, -17.4, 14.6], [9.6, -12.4, 15.6, -7.4], [-11.4, 10.6, 1.6, 12.6], [8.6, 44.6, 13.6, 49.6], [19.6, 44.6, 23.6, 50.6], [3.6, 49.6, 9.6, 53.6], [9.6, 32.6, 13.6, 37.6], [19.6, 32.6, 22.6, 38.6], [-2.4, 26.6, 1.6, 30.6], [-15.4, -44.4, -10.4, -41.4], [3.6, -9.4, 9.6, -7.4], [-5.4, 53.6, 0.6, 55.6]];
LANDMARKS.sjwinchester = {zh:'温彻斯特神秘屋', en:'Winchester Mystery House', cat:'old', r:66, h:23,
  lt:{m:0, c:'#ffd9a0', k:0.55, e:0.3},
  build(){
    const g = new THREE.Group(), M = MB(), rng = LMCTX.rng;
    const S = {wall:'#d9c486', trim:'#f2ead8', roof:'#a63b2e', red:'#6d2a22', brick:'#8b4b3b', glass:'#3a3d45', lit:{c:'#3a3d45', glow:'#ffcd80', gk:0.7}, base:'#978c7c', spire:'#8e3328'};
    const E1 = 7.4;                                                     // two-storey eaves
    M.prism(S.base, WM_RING, -5, 0.8, false);
    M.prism(S.wall, WM_RING, 0.8, E1, true);
    // belt courses and eave fascia all round, two floors of tall narrow windows (a few lit at night)
    for (let i = 0; i < WM_RING.length; i++){ const a = WM_RING[i], b = WM_RING[(i + 1) % WM_RING.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.8) continue;
      const n = onrm(WM_RING, i); M.vq(S.trim, a, b, n, 0.06, 3.9, 4.3); M.vq(S.trim, a, b, n, 0.06, E1 - 0.5, E1);
      if (L < 2.4) continue; const nb = Math.floor(L/2.7);
      for (let f = 0; f < 2; f++) for (let k = 0; k < nb; k++){ const u = (k + 0.5)/nb, hu = 0.5/L, p0 = lerp2(a, b, u - hu), p1 = lerp2(a, b, u + hu), y0 = 1.6 + f*3.5;
        M.vq(rng() < 0.18 ? S.lit : S.glass, p0, p1, n, 0.08, y0, y0 + 1.9);
        const q0 = lerp2(a, b, u - hu - 0.12/L), q1 = lerp2(a, b, u + hu + 0.12/L); M.vq(S.trim, q0, q1, n, 0.07, y0 + 1.9, y0 + 2.2); } }
    // upper storeys of the front part (towards the boulevard) and roofs over every wing
    const front = r => r[0] > 6, mid = r => !front(r) && r[2] > -14 && r[1] > -24;
    for (const r of WM_RECT){
      const [x0, z0, x1, z1] = r, w = x1 - x0, d = z1 - z0, cx = (x0 + x1)/2, cz = (z0 + z1)/2;
      let ey = E1; if (front(r)) ey = 11; else if (mid(r)) ey = 9.4;
      if (ey > E1){ const P = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]; M.prism(S.wall, P, E1, ey, false); M.prism(S.trim, P, ey - 0.45, ey, false);
        winPoly(M, S.glass, P, E1 + 0.9, 3.5, 1, 2.8, 1.0, 1.8, 0.08); }
      const along = w >= d, L = along ? w : d, W = along ? d : w, h = Math.min(6.5, W*0.62), ry = along ? 0 : HP;
      if (L > 2.2*W || rng() < 0.55) M.gable(S.roof, cx, cz, L, W, ey, h, ry, 0.45, S.wall); else M.hip(S.roof, cx, cz, L, W, ey, h, ry, 0.45);
      // cross gables / dormers on long roofs
      if (L > 9 && W > 4) for (let k = 1; k < Math.floor(L/7); k++){ const u = -L/2 + k*L/Math.floor(L/7), s = rng() < 0.5 ? -1 : 1, dw = Math.min(3.4, W*0.5);
        const p = along ? [cx + u, cz + s*W*0.3] : [cx + s*W*0.3, cz + u];
        M.gable(S.roof, p[0], p[1], W*0.55, dw, ey, h*0.75, along ? HP : 0, 0.2, S.trim); }
      // chimneys (the house has dozens)
      if (L*W > 60 && rng() < 0.75){ const k = (rng() - 0.5)*L*0.6, p = along ? [cx + k, cz] : [cx, cz + k]; M.box(S.brick, 1.1, h + 1.6, 1.1, p[0], ey + 0.5, p[1]); M.box(S.brick, 1.5, 0.4, 1.5, p[0], ey + h + 2.1, p[1]); }
    }
    // towers: octagonal spire tower (NE front corner), round turret (SE front corner), small corner turret, square observation tower
    const octT = (x, z, r, y1, hs, sp) => { const P = []; for (let i = 0; i < 8; i++){ const a = PI/8 + i*PI/4; P.push([x + Math.cos(a)*r, z + Math.sin(a)*r]); }
      M.prism(S.wall, P, E1, y1, false); M.prism(S.trim, P.map(p => [x + (p[0] - x)*1.12, z + (p[1] - z)*1.12]), y1 - 0.5, y1, true);
      winPoly(M, S.glass, P, E1 + 1, 3.3, Math.floor((y1 - E1 - 1)/3.3), r*0.6, 0.8, 1.7, 0.07);
      M.rev(sp, [[r*1.15, y1], [r*0.55, y1 + hs*0.55], [0.15, y1 + hs], [0, y1 + hs + 0.8]], x, z, 8); };
    octT(29.8, -15.3, 2.5, 15.2, 6.5, S.spire);
    M.cyl(S.wall, 2.9, E1, 12.6, 31.2, 18.3, 16, false); M.rev(S.trim, [[3.2, 12.1], [3.2, 12.6]], 31.2, 18.3, 16);
    winPoly(M, S.glass, Array.from({length:10}, (_, i) => [31.2 + Math.cos(TAU*i/10)*2.9, 18.3 + Math.sin(TAU*i/10)*2.9]), E1 + 1, 3.3, 1, 1.7, 0.8, 1.7, 0.07);
    M.rev(S.spire, [[3.35, 12.6], [1.7, 15.6], [0.2, 18.6], [0, 19.4]], 31.2, 18.3, 16);
    octT(17.4, -16.6, 1.6, 12.4, 4, S.spire);
    M.prism(S.wall, [[9.5, -2.5], [14.5, -2.5], [14.5, 2.5], [9.5, 2.5]], 11, 16.2, false);
    winPoly(M, S.glass, [[9.5, -2.5], [14.5, -2.5], [14.5, 2.5], [9.5, 2.5]], 12.2, 3.3, 1, 2.4, 1.0, 1.9, 0.07);
    M.prism(S.trim, [[9.1, -2.9], [14.9, -2.9], [14.9, 2.9], [9.1, 2.9]], 15.7, 16.2, true);
    M.pyr(S.spire, 12, 0, 6.2, 6.2, 16.2, 5.2, 0, 0.6); M.box(S.trim, 0.25, 1.4, 0.25, 12, 21.4, 0);
    // bay windows on the front, the veranda along the boulevard front
    for (const z of [-3.4, 5.1]){ M.box(S.wall, 1.8, 6.6, 3.2, 40.4, 0.8, z); M.hip(S.roof, 40.4, z, 3.2, 1.8, 7.4, 1.0, HP, 0.2); M.box(S.glass, 0.1, 1.9, 2.4, 41.35, 1.6, z); M.box(S.glass, 0.1, 1.9, 2.4, 41.35, 5.1, z); }
    M.box(S.trim, 2.8, 0.3, 17, 41.2, 3.7, 1.6); M.hip(S.roof, 41.2, 1.6, 17, 2.8, 4.0, 0.8, HP, 0.3);
    for (let z = -6.6; z <= 9.9; z += 2.75) M.box(S.trim, 0.25, 2.9, 0.25, 42.4, 0.8, z);
    for (const zz of [-6.6, 9.9]) M.box(S.red, 0.12, 0.9, 16.5, 42.4, 0.8, 1.65);
    // outbuildings inside the outline: the small tall tank tower (north) and two sheds (west)
    M.prism(S.wall, [[22.2, -32.4], [26.3, -32.4], [26.3, -29.2], [22.2, -29.2]], -5, 11, true); M.pyr(S.roof, 24.25, -30.8, 4.8, 4, 11, 3.4, 0, 0.3);
    winPoly(M, S.glass, [[22.2, -32.4], [26.3, -32.4], [26.3, -29.2], [22.2, -29.2]], 2, 3.3, 3, 2.6, 0.8, 1.6, 0.07);
    M.prism(S.wall, [[-52.4, -13.5], [-52.2, -21.0], [-45.7, -20.8], [-45.9, -13.4]], -5, 4.6, true); M.gable(S.roof, -49, -17.2, 7.4, 6.4, 4.6, 2.5, HP, 0.3, S.wall);
    M.prism(S.wall, [[-40.9, -4.4], [-40.8, -11.2], [-34.2, -11.1], [-34.3, -4.3]], -5, 3.2, true); M.gable(S.roof, -37.5, -7.7, 6.6, 6.6, 3.2, 1.6, 0, 0.3, S.wall);
    M.out(g); return g;
  }};
SG_PLACES.push(Object.assign({type:'sjwinchester'}, llOff(37.3184, -121.951, -13.2, 5.7), {rot:0}));

// =====================================================================================================================
// Rosicrucian Park, San José: the Rosicrucian Egyptian Museum (1966, facade after the Temple of Amun at Karnak: battered
// sandstone walls with cavetto cornices, a deep portico of papyrus columns with painted capitals, the winged-disc lintel,
// the avenue of ram-headed sphinxes from Park Avenue), the domed Planetarium (1936), the Grand Temple with its pylon
// front and lotus columns, the Francis Bacon Auditorium, the Akhenaten Shrine, the library / university range, the
// administration building and the small garden pavilions, each on its real footprint. Frame: x along Park Avenue
// (+x towards Randol Ave), +z towards Park Avenue; origin at ref (55, 10) of sjrosicrucian.
// =====================================================================================================================
const RP_PLAN = [[-40.6, 49.8], [-40.8, 43.9], [-46.0, 43.3], [-45.7, 37.1], [-40.9, 37.9], [-40.8, 37.4], [-38.9, 37.5], [-38.9, 32.0], [-34.5, 27.4], [-28.0, 27.5], [-23.4, 33.7], [-23.2, 39.8], [-21.7, 39.9], [-21.7, 43.8], [-14.3, 43.9], [-14.3, 49.2], [-20.3, 49.1], [-20.3, 50.3], [-25.1, 50.3], [-25.1, 50.8], [-27.5, 50.7], [-29.2, 52.7], [-33.9, 52.7], [-35.1, 50.6], [-37.2, 50.7], [-37.2, 49.8]];
const RP_LIB = [[-9.9, 10.0], [-9.4, -19.3], [-7.1, -19.2], [-7.1, -18.4], [-3.1, -18.3], [-3.1, -21.3], [2.0, -21.2], [2.0, -18.2], [3.7, -18.2], [3.7, -19.0], [5.9, -19.0], [5.8, -13.7], [6.7, -13.7], [6.7, -15.8], [11.3, -15.7], [11.2, -11.3], [11.5, -14.6], [34.5, -14.1], [34.5, -14.8], [40.5, -14.7], [40.4, -11.0], [40.9, -11.0], [40.3, -1.8], [11.3, -2.1], [11.4, -8.3], [7.5, -8.4], [7.4, 0.5], [10.5, 0.6], [10.4, 3.8], [5.5, 3.7], [5.4, 6.8], [6.3, 6.9], [6.3, 9.3], [-2.7, 9.2], [-2.6, 10.1]];
const RP_ADM = [[-60.4, -24.3], [-60.4, -34.6], [-63.1, -34.7], [-63.1, -46.8], [-63.5, -46.8], [-63.5, -49.8], [-63.0, -49.8], [-63.0, -61.9], [-60.2, -61.9], [-60.1, -72.4], [-46.1, -72.4], [-46.4, -24.2]];
const RP_AUD = [[-77.7, 11.9], [-77.4, 9.6], [-77.7, 9.6], [-77.7, 7.3], [-76.4, 7.3], [-76.4, 1.9], [-77.6, 1.6], [-77.6, -0.6], [-77.2, -0.6], [-77.5, -3.3], [-45.1, -2.7], [-45.4, 14.8], [-52.6, 14.3], [-52.5, 12.4]];
LANDMARKS.sjrosicrucian = {zh:'玫瑰十字埃及博物馆', en:'Rosicrucian Egyptian Museum', cat:'old', r:110, h:20,
  lt:{m:0, c:'#ffd6a0', k:0.75, e:0.4},
  build(){
    const g = new THREE.Group(), M = MB();
    const S = {sand:'#d8c39a', sand2:'#c6ad82', corn:'#e7d7b3', teal:'#3e7f8a', ochre:'#b5702f', blue:'#2f4f86', gold:'#c9a54a', door:'#4a3b2c', dome:'#ebe4d4', sph:'#8b7d69', glass:'#3b3d44', roof:'#bfae8f'};
    // Egyptian block: battered walls (inset bat at the top), cavetto cornice flaring out, torus roll at the corners
    function eg(x0, z0, x1, z1, y0, h, bat, sp){
      const b = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]; if (y0 <= 0.7) M.prism(S.sand2, b, -5, y0, false); const t = [[x0 + bat, z0 + bat], [x1 - bat, z0 + bat], [x1 - bat, z1 - bat], [x0 + bat, z1 - bat]];
      for (let i = 0; i < 4; i++){ const a = b[i], c = b[(i + 1) % 4], d = t[(i + 1) % 4], e = t[i]; M.q(sp || S.sand, [a[0], y0, a[1]], [c[0], y0, c[1]], [d[0], y0 + h - 1.3, d[1]], [e[0], y0 + h - 1.3, e[1]]); }
      const o = [[x0 + bat - 0.9, z0 + bat - 0.9], [x1 - bat + 0.9, z0 + bat - 0.9], [x1 - bat + 0.9, z1 - bat + 0.9], [x0 + bat - 0.9, z1 - bat + 0.9]];
      for (let i = 0; i < 4; i++){ const e = t[i], d = t[(i + 1) % 4], p = o[i], q = o[(i + 1) % 4];
        M.q(S.corn, [e[0], y0 + h - 1.3, e[1]], [d[0], y0 + h - 1.3, d[1]], [q[0], y0 + h - 0.2, q[1]], [p[0], y0 + h - 0.2, p[1]]);
        M.q(S.corn, [p[0], y0 + h - 0.2, p[1]], [q[0], y0 + h - 0.2, q[1]], [q[0], y0 + h, q[1]], [p[0], y0 + h, p[1]]);
        M.q(S.ochre, [e[0], y0 + h - 1.65, e[1]], [d[0], y0 + h - 1.65, d[1]], [d[0], y0 + h - 1.3, d[1]], [e[0], y0 + h - 1.3, e[1]]); }
      M.cap(S.roof, o, y0 + h);
      for (const p of b) M.cyl(S.corn, 0.25, y0, y0 + h - 1.3, p[0], p[1], 6, false);
    }
    // papyrus column (painted bands, open bell capital)
    function col(x, z, y0, h, r){ M.cyl(S.sand, r, y0, y0 + h*0.78, x, z, 10, false);
      M.rev(S.teal, [[r, y0 + h*0.78], [r*1.05, y0 + h*0.82]], x, z, 10); M.rev(S.ochre, [[r*1.05, y0 + h*0.82], [r*1.05, y0 + h*0.84]], x, z, 10);
      M.rev(S.teal, [[r*1.05, y0 + h*0.84], [r*1.5, y0 + h*0.93], [r*1.75, y0 + h*0.97], [0, y0 + h*0.97]], x, z, 10);
      M.box(S.sand2, r*2.4, h*0.03, r*2.4, x, y0 + h*0.97, z); M.cyl(S.sand2, r*1.2, y0 - 0.4, y0, x, z, 10, false); }
    // ---------------- museum: two wings either side of the deep columned portico, facing Park Avenue (+z) ----------------
    const MX0 = -0.6, MX1 = 40.5, MZ0 = 18.1, MZ1 = 44.7, MC = (MX0 + MX1)/2;
    M.prism(S.sand2, [[MX0 - 0.8, MZ0 - 0.8], [MX1 + 0.8, MZ0 - 0.8], [MX1 + 0.8, MZ1 + 1.6], [MX0 - 0.8, MZ1 + 1.6]], -5, 0.6, true);
    eg(MX0, MZ0, MX1, MZ1 - 9, 0.6, 9.5, 0.6);                          // the hall behind
    eg(MX0, MZ1 - 9.5, MC - 8.5, MZ1, 0.6, 10.5, 0.7);                 // west pylon wing
    eg(MC + 8.5, MZ1 - 9.5, MX1, MZ1, 0.6, 10.5, 0.7);                 // east pylon wing
    for (const x of [MC - 6.4, MC - 2.1, MC + 2.1, MC + 6.4]) for (const z of [MZ1 - 1.2, MZ1 - 6]) col(x, z, 0.6, 10.2, 0.85);
    M.box(S.sand2, 17.4, 1.6, 9.8, MC, 10.8, MZ1 - 4.9);                // architrave over the portico
    M.box(S.corn, 18.6, 0.9, 10.8, MC, 12.4, MZ1 - 4.9);
    M.q(S.blue, [MC - 4, 11.0, MZ1 + 0.06], [MC + 4, 11.0, MZ1 + 0.06], [MC + 4, 12.2, MZ1 + 0.06], [MC - 4, 12.2, MZ1 + 0.06]);   // winged sun disc band
    M.cyl(S.gold, 0.55, 11.05, 12.15, MC, MZ1 + 0.3, 12, false);
    M.q(S.door, [MC - 2.2, 0.6, MZ1 - 9.4], [MC + 2.2, 0.6, MZ1 - 9.4], [MC + 2.2, 6.4, MZ1 - 9.4], [MC - 2.2, 6.4, MZ1 - 9.4]);
    // painted reliefs (abstract bands, no lettering) on the pylon wings
    for (const x of [MX0 + 2, MC + 10.5]) for (const y of [3.2, 6]) M.q(S.ochre, [x, y, MZ1 + 0.05], [x + 6.3, y, MZ1 + 0.05], [x + 6.3, y + 0.35, MZ1 + 0.05], [x, y + 0.35, MZ1 + 0.05]);
    // avenue of ram-headed sphinxes from the street to the portico
    for (let k = 0; k < 4; k++) for (const s of [-1, 1]){ const x = MC + s*5.2, z = MZ1 + 3.6 + k*3.5;
      M.box(S.sand2, 1.4, 1.1, 3.0, x, -0.5, z); M.box(S.sph, 1.0, 1.1, 2.4, x, 0.6, z + 0.1); M.box(S.sph, 0.8, 0.9, 0.9, x, 1.3, z - 1.05); M.box(S.sph, 1.0, 0.25, 0.6, x, 1.9, z - 1.1); }
    M.box(S.sand2, 6, 0.25, 14, MC, 0.35, MZ1 + 8.6);
    // ---------------- planetarium: domed rotunda with entrance porticos ----------------
    M.prism(S.sand, RP_PLAN, -5, 7.2, true); M.prism(S.corn, RP_PLAN, 6.4, 7.2, false);
    M.cyl(S.sand, 9.2, 7.2, 9.6, -31, 40, 24, false); M.rev(S.corn, [[9.8, 9.4], [9.8, 10.1], [9, 10.1]], -31, 40, 24);
    M.rev(S.dome, [[9, 10.1], [8.6, 12.6], [7.4, 15], [5.4, 16.9], [2.8, 18.1], [0, 18.5]], -31, 40, 24);
    M.cyl(S.corn, 0.8, 18.4, 19.6, -31, 40, 8, true);
    for (const x of [-27.6, -34.4]) col(x, 51.4, 0, 6.3, 0.55);
    M.box(S.corn, 9.2, 0.8, 2.6, -31, 6.3, 51.4); M.q(S.door, [-32.6, 0, 52.75], [-29.4, 0, 52.75], [-29.4, 4.6, 52.75], [-32.6, 4.6, 52.75]);
    // ---------------- Grand Temple: hall with a pylon front and lotus-column portico (towards the gardens, -x) ----------------
    eg(22, -39.4, 68.6, -22, 0, 8.2, 0.5);
    eg(14.7, -41.2, 22.5, -34.6, 0, 11.6, 0.9); eg(14.7, -26.8, 22.5, -20.2, 0, 11.6, 0.9);   // pylon towers
    for (const z of [-32.6, -28.8]) col(16, z, 0, 8.6, 0.7);
    M.box(S.corn, 7.8, 1.6, 8.2, 18.6, 8.6, -30.7); M.cyl(S.gold, 0.45, 8.75, 9.95, 14.6, -30.7, 10, false);
    M.q(S.door, [22.05, 0, -32.2], [22.05, 0, -29.2], [22.05, 5.6, -29.2], [22.05, 5.6, -32.2]);
    // ---------------- Francis Bacon Auditorium (portico towards Naglee Avenue, -x) ----------------
    M.prism(S.sand, RP_AUD, -5, 6.6, true); M.prism(S.corn, RP_AUD.map(p => [p[0], p[1]]), 5.8, 6.6, false);
    for (const z of [0.6, 4.4, 8.2]) col(-79.4, z, 0, 6.0, 0.5);
    M.box(S.corn, 3.4, 0.8, 11, -78.6, 6.0, 4.4);
    // ---------------- library / university range, administration, the shrine, garden pavilions ----------------
    M.prism(S.sand, RP_LIB, -5, 5.2, true); M.prism(S.corn, RP_LIB, 4.5, 5.4, false);
    winPoly(M, S.glass, RP_LIB, 1.4, 3.5, 1, 4, 1.4, 2.0, 0.08);
    M.prism(S.sand, RP_ADM, -5, 8.5, true); M.prism(S.corn, RP_ADM, 7.6, 8.6, false); M.prism(S.ochre, RP_ADM, 7.2, 7.6, false);
    winPoly(M, S.glass, RP_ADM, 1.5, 3.4, 2, 3.4, 1.4, 2.0, 0.08);
    eg(-43.3, -16.7, -31.2, -11.6, 0, 6.2, 0.4);                         // Akhenaten Shrine
    for (const x of [-41, -37.2, -33.4]) col(x, -11, 0, 5.4, 0.42);
    eg(-38.6, -15.6, -35.8, -12.6, 6.2, 3.6, 0.3);
    for (const [x0, z0, x1, z1, h] of [[-37.1, -49, -31.5, -40.8, 3.5], [-14.4, -39.2, -9.9, -31.6, 3.2], [-14.9, -60.4, -8.5, -51.9, 3.6], [44.6, 15.7, 51.7, 22.9, 4.6]]) eg(x0, z0, x1, z1, 0, h, 0.25);
    M.out(g); return g;
  }};
SG_PLACES.push({type:'sjrosicrucian', lat:37.3338099, lon:-121.9227771, rot:-0.7974});

// =====================================================================================================================
// Computer History Museum, Mountain View (1995, STUDIOS Architecture, built as an office headquarters; museum since
// 2002): two-storey white-panelled building on its real footprint with ribbon windows, the big glazed west "bay window"
// towards Shoreline Boulevard, the glass-walled circulation spine with its raised clerestory, the curved glazed
// south-west corner, the long pointed north wing, entrance canopy and rooftop plant screens. No signs or lettering.
// Frame: +x = south, +z = west (Shoreline Blvd side); origin = footprint centroid.
// =====================================================================================================================
const CHM_RING = [[-7.0, 39.3], [-10.1, 31.5], [-21.8, 30.9], [-22.8, 27.6], [-27.2, 29.1], [-30.7, 20.9], [-26.5, 19.4], [-28.4, 13.9], [-66.5, 28.6], [-68.7, 25.0], [-70.2, 20.9], [-55.1, 16.1], [-54.3, 5.0], [-58.5, 4.9], [-58.3, 0.7], [-54.2, 0.4], [-52.6, -31.4], [-33.9, -30.3], [-34.5, -32.0], [-28.8, -34.5], [-27.0, -30.1], [-16.9, -29.5], [-9.2, -11.2], [3.3, -9.0], [5.3, -3.9], [10.5, -4.1], [12.2, -35.6], [51.4, -33.4], [50.1, -5.6], [64.8, -6.5], [61.6, 1.8], [57.0, 9.5], [51.6, 15.4], [43.5, 22.1], [36.7, 25.9], [37.0, 23.1], [28.3, 22.7], [27.9, 28.9], [10.6, 32.4]];
LANDMARKS.svchm = {zh:'计算机历史博物馆', en:'Computer History Museum', cat:'new', r:76, h:16,
  lt:{m:1, c:'#e2ebff', k:0.5},
  build(){
    const g = new THREE.Group(), M = MB();
    const S = {panel:{c:'#e1e1dc', m:0, lk:0.3}, glass:{c:'#5d7383', m:1, fh:4.4, cw:3.2}, dark:'#383d43', roof:'#a8a9a5', base:'#9d9a93', white:{c:'#f1f1ed', m:0, lk:0.4}};
    const H = 10.2, wing = p => p[0] < -54.5 && p[1] > 12;
    M.prism(S.base, CHM_RING, -5, 0.4, false);
    M.prism(S.panel, CHM_RING, 0.4, H, true);
    M.prism(S.white, CHM_RING, H - 0.6, H + 0.9, false);                   // parapet band
    // two floors of ribbon windows on every long wall (not on the north wing's blind walls)
    winPoly(M, S.glass, CHM_RING, 1.2, 4.4, 2, 4.0, 3.4, 2.5, 0.08, i => wing(CHM_RING[i]) || wing(CHM_RING[(i + 1) % CHM_RING.length]));
    // the west bay window: a tall leaning glass wall in a dark frame
    { const a = [-10.1, 31.5], b = [-7.0, 39.3], c = [10.6, 32.4], top = 13.2, lean = 1.6;
      for (const [p, q] of [[a, b], [b, c]]){ const n = [q[1] - p[1], -(q[0] - p[0])], L = Math.hypot(n[0], n[1]); n[0] /= L; n[1] /= L; if (n[1] < 0){ n[0] = -n[0]; n[1] = -n[1]; }
        M.q(S.glass, [p[0], 0.4, p[1]], [q[0], 0.4, q[1]], [q[0] + n[0]*lean, top, q[1] + n[1]*lean], [p[0] + n[0]*lean, top, p[1] + n[1]*lean]);
        const Lq = Math.hypot(q[0] - p[0], q[1] - p[1]), k = Math.round(Lq/2.4);
        for (let i = 0; i <= k; i++){ const u = i/k, s = lerp2(p, q, u); M.beam(S.dark, [s[0] + n[0]*0.15, 0.4, s[1] + n[1]*0.15], [s[0] + n[0]*(lean + 0.15), top, s[1] + n[1]*(lean + 0.15)], 0.12); }
        for (const y of [4.6, 9]) { const f = (y - 0.4)/(top - 0.4)*lean + 0.15; M.q(S.dark, [p[0] + n[0]*f, y, p[1] + n[1]*f], [q[0] + n[0]*f, y, q[1] + n[1]*f], [q[0] + n[0]*f, y + 0.3, q[1] + n[1]*f], [p[0] + n[0]*f, y + 0.3, p[1] + n[1]*f]); } }
      M.q(S.dark, [a[0], top, a[1]], [b[0] + 1.4, top, b[1] + 1.1], [c[0], top, c[1] + 1.6], [c[0], top, c[1] - 6]); M.cap(S.roof, [[a[0] - 1, a[1] - 7], a, [b[0] + 1.4, b[1] + 1.1], [c[0], c[1] + 1.6], [c[0], c[1] - 7]], top + 0.05); }
    // the spine: glass-walled clerestory along the building, white roof slab
    M.prism(S.glass, [[-50, -5], [48, -5], [48, 3], [-50, 3]], H, H + 3.4, false);
    M.box(S.white, 100, 0.6, 10, -1, H + 3.4, -1);
    // the curved south-west corner: glazed, with a thin roof edge
    { const C = [[50.1, -5.6], [64.8, -6.5], [61.6, 1.8], [57.0, 9.5], [51.6, 15.4], [43.5, 22.1], [36.7, 25.9]];
      for (let i = 1; i < C.length - 1; i++){ const n = onrm(CHM_RING, CHM_RING.findIndex(p => p[0] === C[i][0] && p[1] === C[i][1])); M.vq(S.glass, C[i], C[i + 1], n, 0.12, 0.6, H - 0.8); } }
    // north wing: a pointed blade, roof rising towards the tip
    M.q(S.white, [-55.1, H + 0.9, 16.1], [-70.2, H + 3.2, 20.9], [-68.7, H + 3.2, 25.0], [-66.5, H + 2.6, 28.6]);
    M.t(S.white, [-55.1, H + 0.9, 16.1], [-66.5, H + 2.6, 28.6], [-28.4, H + 0.9, 13.9]);
    // entrance canopy on the south-west plaza and rooftop plant screens
    M.box(S.white, 12, 0.6, 7, 30, 4.4, 28.5); for (const x of [25, 35]) M.box(S.dark, 0.35, 4.4, 0.35, x, 0, 31.4);
    M.box(S.roof, 14, 2.6, 9, -38, H + 0.4, -18); M.box(S.roof, 12, 2.6, 8, 30, H + 0.4, -22);
    M.out(g); return g;
  }};
SG_PLACES.push(Object.assign({type:'svchm'}, llOff(37.4143, -122.0774, 9.6, 1.1), {rot:-1.5236}));

}
