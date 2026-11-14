const PI = Math.PI, TAU = Math.PI*2;
// ------------------------------------------------------------------------------------------------ batching / geometry helpers
class Bat {
  constructor(){ this.m = new Map(); }
  a(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = this.m.get(k); if (!e){ e = {col, p:[]}; this.m.set(k, e); } return e.p; }
  flush(g){ for (const e of this.m.values()) if (e.p.length) LTris(g, e.p, e.col); }
}
const tri = (p, a, b, c) => p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
const quad = (p, a, b, c, d) => { tri(p, a, b, c); tri(p, a, c, d); };
// box: centre (cx, cz), bottom y0, size w (x) h (y) d (z), turned by ry about +y
function boxT(p, cx, y0, cz, w, h, d, ry){
  const c = Math.cos(ry || 0), s = Math.sin(ry || 0), P = (x, y, z) => [cx + x*c + z*s, y, cz - x*s + z*c];
  const X = w/2, Z = d/2, y1 = y0 + h;
  const A = P(-X, y0, -Z), B = P(X, y0, -Z), C = P(X, y0, Z), D = P(-X, y0, Z), E = P(-X, y1, -Z), F = P(X, y1, -Z), G = P(X, y1, Z), H = P(-X, y1, Z);
  quad(p, E, H, G, F); quad(p, A, B, F, E); quad(p, B, C, G, F); quad(p, C, D, H, G); quad(p, D, A, E, H); quad(p, A, D, C, B);
}
// prism of a convex/concave section (array of [u, v] in the plane normal to A->B; u = horizontal side, v = up-ish) from A to B
function frame(A, B){
  const d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], L = Math.hypot(...d) || 1; d[0] /= L; d[1] /= L; d[2] /= L;
  let s = [-d[2], 0, d[0]]; let sl = Math.hypot(...s); if (sl < 1e-6){ s = [1, 0, 0]; sl = 1; } s = s.map(v => v/sl);
  const u = [s[1]*d[2] - s[2]*d[1], s[2]*d[0] - s[0]*d[2], s[0]*d[1] - s[1]*d[0]];
  return {d, s, u};
}
function bar(p, A, B, w, h){       // rectangular member w (side) x h (up), no end caps
  const {s, u} = frame(A, B), o = (P, a, b) => [P[0] + s[0]*a + u[0]*b, P[1] + s[1]*a + u[1]*b, P[2] + s[2]*a + u[2]*b];
  const sec = [[-w/2, -h/2], [w/2, -h/2], [w/2, h/2], [-w/2, h/2]];
  for (let i = 0; i < 4; i++){ const a = sec[i], b = sec[(i + 1) % 4]; quad(p, o(A, a[0], a[1]), o(A, b[0], b[1]), o(B, b[0], b[1]), o(B, a[0], a[1])); }
}
function tube(p, A, B, r, n){
  const {s, u} = frame(A, B); n = n || 6;
  for (let i = 0; i < n; i++){
    const a0 = i/n*TAU, a1 = (i + 1)/n*TAU, c0 = Math.cos(a0)*r, s0 = Math.sin(a0)*r, c1 = Math.cos(a1)*r, s1 = Math.sin(a1)*r;
    const o = (P, a, b) => [P[0] + s[0]*a + u[0]*b, P[1] + s[1]*a + u[1]*b, P[2] + s[2]*a + u[2]*b];
    quad(p, o(A, c0, s0), o(A, c1, s1), o(B, c1, s1), o(B, c0, s0));
  }
}
// sweep a closed section along a polyline of frames: pts [[x, y, z]], sections in (side, up) with side = horizontal normal
function sweep(p, pts, sec, closed){
  const F = pts.map((P, i) => { const A = pts[Math.max(0, i - 1)], B = pts[Math.min(pts.length - 1, i + 1)]; let dx = B[0] - A[0], dz = B[2] - A[2]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; return [-dz, dx]; });
  const R = pts.map((P, i) => sec.map(([a, b]) => [P[0] + F[i][0]*a, P[1] + b, P[2] + F[i][1]*a]));
  const n = sec.length;
  for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < (closed === false ? n - 1 : n); k++){ const k2 = (k + 1) % n; quad(p, R[i][k], R[i][k2], R[i + 1][k2], R[i + 1][k]); }
  return R;
}
function capT(p, ring){ const c = [0, 0, 0]; for (const q of ring){ c[0] += q[0]/ring.length; c[1] += q[1]/ring.length; c[2] += q[2]/ring.length; } for (let i = 0; i < ring.length; i++) tri(p, c, ring[i], ring[(i + 1) % ring.length]); }
const pip = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0])*(z - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; };
function segD(px, pz, ax, az, bx, bz){ const dx = bx - ax, dz = bz - az, l = dx*dx + dz*dz; let t = l ? ((px - ax)*dx + (pz - az)*dz)/l : 0; t = t < 0 ? 0 : t > 1 ? 1 : t; return Math.hypot(px - ax - dx*t, pz - az - dz*t); }
function ringD(R, cap){        // distance to the outline (capped at cap), edges bucketed on a 20 m grid, ring search
  cap = cap || 130; const BS = 20; let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
  for (const q of R){ x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); z0 = Math.min(z0, q[1]); z1 = Math.max(z1, q[1]); }
  const NX = Math.ceil((x1 - x0)/BS) + 1, NZ = Math.ceil((z1 - z0)/BS) + 1, G = Array.from({length:NX*NZ}, () => []);
  for (let i = 0, j = R.length - 1; i < R.length; j = i++){ const a = R[j], b = R[i];
    const i0 = Math.floor((Math.min(a[0], b[0]) - x0)/BS), i1 = Math.floor((Math.max(a[0], b[0]) - x0)/BS), j0 = Math.floor((Math.min(a[1], b[1]) - z0)/BS), j1 = Math.floor((Math.max(a[1], b[1]) - z0)/BS);
    for (let v = j0; v <= j1; v++) for (let u = i0; u <= i1; u++) G[v*NX + u].push(j, i); }
  return (x, z) => {
    const ci = Math.max(0, Math.min(NX - 1, Math.floor((x - x0)/BS))), cj = Math.max(0, Math.min(NZ - 1, Math.floor((z - z0)/BS)));
    const ox = Math.max(0, x0 - x, x - (x0 + NX*BS)), oz = Math.max(0, z0 - z, z - (z0 + NZ*BS)), off = Math.hypot(ox, oz);
    let m = 1e9;
    for (let k = 0; k < NX + NZ; k++){
      for (let v = cj - k; v <= cj + k; v++){ if (v < 0 || v >= NZ) continue; const edge = v === cj - k || v === cj + k;
        for (let u = ci - k; u <= ci + k; u += (edge || k === 0) ? 1 : 2*k){ if (u < 0 || u >= NX) continue;
          const L = G[v*NX + u]; for (let e = 0; e < L.length; e += 2){ const a = R[L[e]], b = R[L[e + 1]], d = segD(x, z, a[0], a[1], b[0], b[1]); if (d < m) m = d; } } }
      if (m <= k*BS + off || k*BS > cap + off) break;
    }
    return Math.min(m, cap);
  };
}
function triangulate(pts){ const v = pts.map(q => new THREE.Vector2(q[0], q[1])); if (THREE.ShapeUtils.isClockWise(v)) v.reverse(), pts = pts.slice().reverse(); return {pts, f:THREE.ShapeUtils.triangulateShape(v, [])}; }
// flat polygon at height y (both sides)
function flatT(p, ring, y){ const {pts, f} = triangulate(ring); for (const [a, b, c] of f) tri(p, [pts[a][0], y, pts[a][1]], [pts[b][0], y, pts[b][1]], [pts[c][0], y, pts[c][1]]); }
function wallsT(p, ring, y0, y1){ for (let i = 0; i < ring.length; i++){ const a = ring[i], b = ring[(i + 1) % ring.length]; quad(p, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); } }
// "pillow" roof over a footprint ring: a height field h(x, z, d) (d = distance to the outline) on a grid of cells clipped exactly to the
// ring, plus vertical walls from y0 up to the roof edge (conforming: the walls split at the same grid crossings).
function clipSq(R, x0, z0, x1, z1){
  let P = R;
  const cl = (P, inside, cut) => { const o = []; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], ia = inside(a), ib = inside(b); if (ia) o.push(a); if (ia !== ib) o.push(cut(a, b)); } return o; };
  const cx = X => (a, b) => { const t = (X - a[0])/(b[0] - a[0]); return [X, a[1] + (b[1] - a[1])*t]; }, cz = Z => (a, b) => { const t = (Z - a[1])/(b[1] - a[1]); return [a[0] + (b[0] - a[0])*t, Z]; };
  P = cl(P, q => q[0] >= x0, cx(x0)); if (P.length < 3) return P; P = cl(P, q => q[0] <= x1, cx(x1)); if (P.length < 3) return P;
  P = cl(P, q => q[1] >= z0, cz(z0)); if (P.length < 3) return P; P = cl(P, q => q[1] <= z1, cz(z1)); return P;
}
function pillow(pr, pw, ring, cell, hf, y0){
  const D = ringD(ring); let bx0 = 1e9, bz0 = 1e9, bx1 = -1e9, bz1 = -1e9;
  for (const q of ring){ bx0 = Math.min(bx0, q[0]); bx1 = Math.max(bx1, q[0]); bz0 = Math.min(bz0, q[1]); bz1 = Math.max(bz1, q[1]); }
  const gx0 = Math.floor(bx0/cell)*cell, gz0 = Math.floor(bz0/cell)*cell, NX = Math.ceil((bx1 - gx0)/cell), NZ = Math.ceil((bz1 - gz0)/cell);
  const mark = new Uint8Array(NX*NZ);
  for (let i = 0; i < ring.length; i++){ const a = ring[i], b = ring[(i + 1) % ring.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(L/(cell*0.2)) + 1;
    for (let k = 0; k <= n; k++){ const x = a[0] + (b[0] - a[0])*k/n, z = a[1] + (b[1] - a[1])*k/n, ix = Math.floor((x - gx0)/cell), iz = Math.floor((z - gz0)/cell);
      for (const [dx, dz] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]){ const u = ix + dx, v = iz + dz; if (u >= 0 && v >= 0 && u < NX && v < NZ) mark[v*NX + u] = 1; } } }
  // exact distance / height on every grid node (used by the cells, and bilinear samplers for panels)
  const GD = new Float32Array((NX + 1)*(NZ + 1)), GH = new Float32Array((NX + 1)*(NZ + 1));
  const use = new Uint8Array(NX*NZ), need = new Uint8Array((NX + 1)*(NZ + 1));
  for (let iz = 0; iz < NZ; iz++) for (let ix = 0; ix < NX; ix++){ const o = iz*NX + ix; if (mark[o] || pip(ring, gx0 + (ix + 0.5)*cell, gz0 + (iz + 0.5)*cell)){ use[o] = 1; const q = iz*(NX + 1) + ix; need[q] = need[q + 1] = need[q + NX + 1] = need[q + NX + 2] = 1; } }
  const h0 = hf(0, 0, 0);
  for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++){ const q = j*(NX + 1) + i; if (!need[q]){ GD[q] = -2*cell; GH[q] = h0; continue; }
    const x = gx0 + i*cell, z = gz0 + j*cell, d = D(x, z), sd = pip(ring, x, z) ? d : -d; GD[q] = sd; GH[q] = hf(x, z, Math.max(0, sd)); }
  const bil = A => (x, z) => { let fx = (x - gx0)/cell, fz = (z - gz0)/cell; fx = Math.max(0, Math.min(NX - 1e-4, fx)); fz = Math.max(0, Math.min(NZ - 1e-4, fz));
    const i = fx | 0, j = fz | 0, u = fx - i, v = fz - j, o = j*(NX + 1) + i; return (A[o]*(1 - u) + A[o + 1]*u)*(1 - v) + (A[o + NX + 1]*(1 - u) + A[o + NX + 2]*u)*v; };
  const H = new Map(), hv = (x, z) => {
    const fi = (x - gx0)/cell, fj = (z - gz0)/cell, i = Math.round(fi), j = Math.round(fj);
    if (Math.abs(fi - i) < 1e-6 && Math.abs(fj - j) < 1e-6) return GH[j*(NX + 1) + i];
    const k = Math.round(x*100)*4194304 + Math.round(z*100); let v = H.get(k); if (v === undefined){ v = hf(x, z, D(x, z)); H.set(k, v); } return v; };
  const V = q => [q[0], hv(q[0], q[1]), q[1]];
  for (let iz = 0; iz < NZ; iz++) for (let ix = 0; ix < NX; ix++){
    const x0 = gx0 + ix*cell, z0 = gz0 + iz*cell, x1 = x0 + cell, z1 = z0 + cell;
    if (!use[iz*NX + ix]) continue;
    if (!mark[iz*NX + ix]){ const a = V([x0, z0]), b = V([x1, z0]), c = V([x1, z1]), d = V([x0, z1]); quad(pr, a, d, c, b); continue; }
    const P = clipSq(ring, x0, z0, x1, z1); if (P.length < 3) continue;
    const {pts, f} = triangulate(P); for (const [a, b, c] of f) tri(pr, V(pts[a]), V(pts[c]), V(pts[b]));
  }
  if (pw) for (let i = 0; i < ring.length; i++){
    const a = ring[i], b = ring[(i + 1) % ring.length], T = [0, 1];
    for (const [ax, bx] of [[a[0], b[0]], [a[1], b[1]]]){ const g0 = ax === a[0] ? gx0 : gz0; if (Math.abs(bx - ax) < 1e-9) continue; const lo = Math.min(ax, bx), hi = Math.max(ax, bx);
      for (let X = Math.ceil((lo - g0)/cell)*cell + g0; X < hi; X += cell) T.push((X - ax)/(bx - ax)); }
    T.sort((u, v) => u - v);
    for (let k = 0; k < T.length - 1; k++){ const t0 = T[k], t1 = T[k + 1]; if (t1 - t0 < 1e-6) continue;
      const p0 = [a[0] + (b[0] - a[0])*t0, a[1] + (b[1] - a[1])*t0], p1 = [a[0] + (b[0] - a[0])*t1, a[1] + (b[1] - a[1])*t1];
      const ya = typeof y0 === 'function' ? y0(p0[0], p0[1]) : y0, yb = typeof y0 === 'function' ? y0(p1[0], p1[1]) : y0;
      quad(pw, [p0[0], ya, p0[1]], [p1[0], yb, p1[1]], [p1[0], hv(p1[0], p1[1]), p1[1]], [p0[0], hv(p0[0], p0[1]), p0[1]]); }
  }
  return {D, hv, Dg:bil(GD), Hg:bil(GH)};
}
// polygonal panels (hexagons: honeycomb skins; squares: skylights) lying on a height field hfD(x, z), on a lattice of spacing S
function panels(p, ring, S, r, hfD, D, dmin, lift, ns, rot0, rowOff){
  let bx0 = 1e9, bz0 = 1e9, bx1 = -1e9, bz1 = -1e9; ns = ns || 6; rot0 = rot0 === undefined ? PI/6 : rot0;
  for (const q of ring){ bx0 = Math.min(bx0, q[0]); bx1 = Math.max(bx1, q[0]); bz0 = Math.min(bz0, q[1]); bz1 = Math.max(bz1, q[1]); }
  const dz = ns === 6 ? S*0.866 : S; let n = 0;
  for (let j = 0, z = bz0; z <= bz1; j++, z += dz) for (let x = bx0 + (j % 2 && rowOff !== false ? S/2 : 0); x <= bx1; x += S){
    if (!pip(ring, x, z)) continue; const d = D(x, z); if (d < dmin) continue;
    const h = hfD(x, z), hx = (hfD(x + 1, z) - hfD(x - 1, z))/2, hz = (hfD(x, z + 1) - hfD(x, z - 1))/2;
    const nl = Math.hypot(hx, 1, hz), N = [-hx/nl, 1/nl, -hz/nl], l1 = Math.hypot(1, hx);
    const e1 = [1/l1, hx/l1, 0], e2 = [N[1]*e1[2] - N[2]*e1[1], N[2]*e1[0] - N[0]*e1[2], N[0]*e1[1] - N[1]*e1[0]];
    const C = [x + N[0]*lift, h + N[1]*lift, z + N[2]*lift], K = [];
    for (let k = 0; k < ns; k++){ const a = k/ns*TAU + rot0, c = Math.cos(a)*r, s = Math.sin(a)*r; K.push([C[0] + e1[0]*c + e2[0]*s, C[1] + e1[1]*c + e2[1]*s, C[2] + e1[2]*c + e2[2]*s]); }
    for (let k = 0; k < ns; k++) tri(p, C, K[(k + 1) % ns], K[k]);
    n++;
  }
  return n;
}
// keep only the triangles whose centroid passes pred(x, z) (splitting one continuous skin over several keys)
function triFilter(B, pred){ for (const e of B.m.values()){ const p = e.p, q = []; for (let i = 0; i < p.length; i += 9){ if (pred((p[i] + p[i + 3] + p[i + 6])/3, (p[i + 2] + p[i + 5] + p[i + 8])/3)) for (let k = 0; k < 9; k++) q.push(p[i + k]); } e.p = q; } }
const AVI = {c:'#c42a20', glow:'#ff2a1a', gk:2.2};          // aviation obstruction lights

