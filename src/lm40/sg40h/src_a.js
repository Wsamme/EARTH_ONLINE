// ---------------------------------------------------------------- sg40h helpers (all inside the block)
const TAU = Math.PI*2;
const LL40 = (lat, lon, x, z) => [+(lat - z/110574).toFixed(7), +(lon + x/111290.5).toFixed(7)];
const sarea = r => { let s = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) s += r[j][0]*r[i][1] - r[i][0]*r[j][1]; return s/2; };
const cen2 = r => { let a = 0, x = 0, z = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++){ const c = r[j][0]*r[i][1] - r[i][0]*r[j][1]; a += c; x += (r[j][0] + r[i][0])*c; z += (r[j][1] + r[i][1])*c; } a /= 2; return [x/(6*a), z/(6*a)]; };
const shift = (r, o) => r.map(p => [p[0] - o[0], p[1] - o[1]]);
const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t];
// minimum-area oriented box of a ring: {cx, cz, ux, uz, L (along u), W}
function obb(r){
  let best = null;
  for (let i = 0; i < r.length; i++){
    const a = r[i], b = r[(i + 1) % r.length], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); if (l < 0.5) continue;
    const ux = dx/l, uz = dz/l; let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
    for (const p of r){ const u = p[0]*ux + p[1]*uz, v = -p[0]*uz + p[1]*ux; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
    const A = (u1 - u0)*(v1 - v0);
    if (!best || A < best.A){ const um = (u0 + u1)/2, vm = (v0 + v1)/2; best = {A, cx:um*ux - vm*uz, cz:um*uz + vm*ux, ux, uz, L:u1 - u0, W:v1 - v0}; }
  }
  if (best.W > best.L){ const t = best.L; best.L = best.W; best.W = t; const ux = best.ux; best.ux = -best.uz; best.uz = ux; }
  return best;
}
const inPoly = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0])*(z - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; };
const plen = P => { let s = 0; for (let i = 1; i < P.length; i++) s += Math.hypot(P[i][0] - P[i-1][0], P[i][1] - P[i-1][1]); return s; };
// point + unit tangent at arc length s of a polyline
function pAt(P, s){
  let acc = 0;
  for (let i = 1; i < P.length; i++){
    const dx = P[i][0] - P[i-1][0], dz = P[i][1] - P[i-1][1], l = Math.hypot(dx, dz);
    if (acc + l >= s || i === P.length - 1){ const t = l > 0 ? Math.min(1, Math.max(0, (s - acc)/l)) : 0; return [P[i-1][0] + dx*t, P[i-1][1] + dz*t, dx/(l || 1), dz/(l || 1)]; }
    acc += l;
  }
}
function nearOn(P, x, z){ let best = [1e9, 0, 0]; for (let i = 1; i < P.length; i++){ const a = P[i-1], b = P[i], dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx*dx + dz*dz || 1; let u = ((x - a[0])*dx + (z - a[1])*dz)/L2; u = Math.max(0, Math.min(1, u)); const px = a[0] + dx*u, pz = a[1] + dz*u, d = Math.hypot(x - px, z - pz); if (d < best[0]) best = [d, px, pz]; } return best; }
// triangle batches per colour key, flushed into one LTris call each
function mkT(){
  const M = {};
  const T = {
    M,
    a(c){ return M[c] || (M[c] = []); },
    tri(c, A, B, C){ M[c] || (M[c] = []); M[c].push(A[0], A[1], A[2], B[0], B[1], B[2], C[0], C[1], C[2]); },
    q(c, A, B, C, D){ T.tri(c, A, B, C); T.tri(c, A, C, D); },
    ob(c, cx, cz, ux, uz, hl, hw, y0, y1, notop, bot){
      const vx = -uz, vz = ux, P = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([s, t]) => [cx + ux*hl*s + vx*hw*t, cz + uz*hl*s + vz*hw*t]);
      for (let i = 0; i < 4; i++){ const p = P[i], r = P[(i + 1) % 4]; T.q(c, [p[0], y0, p[1]], [r[0], y0, r[1]], [r[0], y1, r[1]], [p[0], y1, p[1]]); }
      if (!notop) T.q(c, [P[0][0], y1, P[0][1]], [P[1][0], y1, P[1][1]], [P[2][0], y1, P[2][1]], [P[3][0], y1, P[3][1]]);
      if (bot) T.q(c, [P[0][0], y0, P[0][1]], [P[3][0], y0, P[3][1]], [P[2][0], y0, P[2][1]], [P[1][0], y0, P[1][1]]);
    },
    box(c, x, y0, z, w, h, d){ T.ob(c, x, z, 1, 0, w/2, d/2, y0, y0 + h); },
    seg(c, a, b, ht, y0, y1, notop){ const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1; T.ob(c, (a[0] + b[0])/2, (a[1] + b[1])/2, dx/L, dz/L, L/2, ht, y0, y1, notop); },
    // square beam between 3-D points
    beam(c, A, B, r){
      const d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], L = Math.hypot(...d) || 1, u = d.map(v => v/L);
      let p = Math.abs(u[1]) < 0.9 ? [u[2], 0, -u[0]] : [1, 0, 0]; const lp = Math.hypot(...p); p = p.map(v => v/lp*r);
      const q = [u[1]*p[2] - u[2]*p[1], u[2]*p[0] - u[0]*p[2], u[0]*p[1] - u[1]*p[0]];
      const C = (P, s, t) => [P[0] + p[0]*s + q[0]*t, P[1] + p[1]*s + q[1]*t, P[2] + p[2]*s + q[2]*t];
      const K = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
      for (let i = 0; i < 4; i++){ const k0 = K[i], k1 = K[(i + 1) % 4]; T.q(c, C(A, ...k0), C(B, ...k0), C(B, ...k1), C(A, ...k1)); }
    },
    walls(c, ring, y0, y1){ for (let i = 0; i < ring.length; i++){ const a = ring[i], b = ring[(i + 1) % ring.length]; T.q(c, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); } },
    cap(c, ring, y){ const v = ring.map(p => new THREE.Vector2(p[0], p[1])), f = THREE.ShapeUtils.triangulateShape(v, []); for (const t of f) T.tri(c, [ring[t[0]][0], y, ring[t[0]][1]], [ring[t[1]][0], y, ring[t[1]][1]], [ring[t[2]][0], y, ring[t[2]][1]]); },
    prism(c, ring, y0, y1, ctop){ T.walls(c, ring, y0, y1); T.cap(ctop || c, ring, y1); },
    cyl(c, x, z, y0, y1, r0, r1, n){ n = n || 8; for (let i = 0; i < n; i++){ const a = i/n*TAU, b = (i + 1)/n*TAU; T.q(c, [x + Math.cos(a)*r0, y0, z + Math.sin(a)*r0], [x + Math.cos(b)*r0, y0, z + Math.sin(b)*r0], [x + Math.cos(b)*r1, y1, z + Math.sin(b)*r1], [x + Math.cos(a)*r1, y1, z + Math.sin(a)*r1]); } },
    // hipped roof over an oriented rectangle (u axis = ridge)
    hip(c, cx, cz, ux, uz, hl, hw, y, h){
      const vx = -uz, vz = ux, k = Math.max(0, hl - hw), P = (s, t, yy) => [cx + ux*s + vx*t, yy, cz + uz*s + vz*t];
      const A = P(-hl, -hw, y), B = P(hl, -hw, y), C = P(hl, hw, y), Dd = P(-hl, hw, y), r1 = P(-k, 0, y + h), r2 = P(k, 0, y + h);
      T.q(c, A, B, r2, r1); T.q(c, C, Dd, r1, r2); T.tri(c, Dd, A, r1); T.tri(c, B, C, r2);
    },
    // gable roof (ridge along u); gable ends filled with colour cg if given
    gab(c, cx, cz, ux, uz, hl, hw, y, h, cg){
      const vx = -uz, vz = ux, P = (s, t, yy) => [cx + ux*s + vx*t, yy, cz + uz*s + vz*t];
      const A = P(-hl, -hw, y), B = P(hl, -hw, y), C = P(hl, hw, y), Dd = P(-hl, hw, y), r1 = P(-hl, 0, y + h), r2 = P(hl, 0, y + h);
      T.q(c, A, B, r2, r1); T.q(c, C, Dd, r1, r2); if (cg){ T.tri(cg, Dd, A, r1); T.tri(cg, B, C, r2); }
    },
    flush(g, S){ for (const k in M) if (M[k].length) LTris(g, M[k], S[k] || k); }
  };
  return T;
}
// outward unit normal of edge i of a ring
const outN = (ring, i) => { const a = ring[i], b = ring[(i + 1) % ring.length], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, s = sarea(ring) > 0 ? 1 : -1; return [s*dz/l, -s*dx/l]; };
// facade fins / bands on every edge of a ring: vertical fins every `step` m (depth d, width w), horizontal bands every fh (height bh)
function facade(T, ring, y0, y1, o){
  for (let i = 0; i < ring.length; i++){
    const a = ring[i], b = ring[(i + 1) % ring.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 2) continue;
    const [nx, nz] = outN(ring, i), ux = (b[0] - a[0])/L, uz = (b[1] - a[1])/L;
    if (o.fin){ const n = Math.max(1, Math.round(L/o.step)); for (let k = 0; k <= n; k++){ const t = k/n, x = a[0] + (b[0] - a[0])*t + nx*o.d/2, z = a[1] + (b[1] - a[1])*t + nz*o.d/2;
      const ht = o.finH ? o.finH(k, i) : 1; if (ht <= 0) continue; T.ob(o.fin, x, z, nx, nz, o.d/2, o.w/2, y0 + (o.f0 || 0), y0 + (y1 - y0)*ht, true); } }
    if (o.band){ for (let y = y0 + (o.b0 || o.fh); y < y1 - 0.5; y += o.fh){ const e = o.bd || 0.15;
      T.q(o.band, [a[0] + nx*e, y, a[1] + nz*e], [b[0] + nx*e, y, b[1] + nz*e], [b[0] + nx*e, y + o.bh, b[1] + nz*e], [a[0] + nx*e, y + o.bh, a[1] + nz*e]);
      if (o.bd > 0.3) T.q(o.band, [a[0], y + o.bh, a[1]], [b[0], y + o.bh, b[1]], [b[0] + nx*e, y + o.bh, b[1] + nz*e], [a[0] + nx*e, y + o.bh, a[1] + nz*e]); } }
  }
}
// offset a ring outward (+d) or inward (-d) (simple miter)
function offR(ring, d){
  const n = ring.length, out = [];
  for (let i = 0; i < n; i++){
    const p = ring[(i + n - 1) % n], c = ring[i], q = ring[(i + 1) % n];
    const n1 = outN(ring, (i + n - 1) % n), n2 = outN(ring, i); let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
    const cs = Math.max(0.35, mx*n2[0] + mz*n2[1]); out.push([c[0] + mx*d/cs, c[1] + mz*d/cs]);
  }
  return out;
}
// real buildings that a hull unavoidably covers, re-created as plain blocks at their data height (as the app draws them)
function keepers(T, key, off){ for (const [ring, h] of (D.keepers[key] || [])){ T.prism('kp', off ? shift(ring, off) : ring, -3, h || 6, 'kr'); } }
