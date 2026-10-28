// City Brush — Greater Bay map, group szbaoan (Bao'an: airport T3, satellite concourse, control tower, Shenzhen World, Bao'an Stadium,
// Bay Glory, Eyes of the GBA, the Lingdingyang Bridge of the Shenzhen-Zhongshan Link, Xiwan Mangrove Park, Waterlands).
// Local metres around each anchor, +x east / +z south before rotation (rot 0 unless stated). Sources in gba/szbaoan/REPORT (handback).
{
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
// ================================================================================================ Lingdingyang Bridge (szszlink)
// The suspension bridge of the Shenzhen-Zhongshan Link (opened 30 June 2024; renamed 深中大桥 in 2024). Verified: spans 580 + 1666 +
// 580 m, two H-shaped portal towers 270 m high, a streamlined integral steel box girder 49.7 m wide and 4 m deep, road 91 m above
// the sea at mid-span, navigation clearance 76.5 m, white main cables 1.06 m across, sag ratio 1/9.65, hangers 5-183.5 m long,
// anchorages on figure-8 diaphragm walls of 2 x 65 m diameter built as islands in the sea. Estimated: leg sections, crossbeam levels,
// anchorage block height, girder segment / hanger spacing 12.8 m (the girder segments' length), approach piers every 110 m.
// Frame: x along the bridge toward Shenzhen (= t, metres from the main-span centre), z across (+ = right looking east). Towers on
// the OSM bridge:support islets (w1022190925-28; centred on the carriageways, the islets sit 2.3 m north of them), east anchorage on
// r13688120 (note 锚碇), west anchorage mirrored (not mapped). The road decks are the app's (OSM ways 1298785019 / 1298785020 at the
// profile of szlink_deck_fix.py = lkRoad below); everything else is here. Three keys: szszlink (towers, cables, girder, anchorages),
// szszlink_w / szszlink_e (the approach viaducts, unlabelled), all on the same rot.
const LKD = [[[-3746.1,-3725.5,-182.7],[-3721.1,-3701.7,-175.2],[-3696.1,-3677.8,-167.7],[-3671.1,-3654.0,-160.2],[-3646.1,-3630.1,-152.7],[-3621.1,-3606.2,-145.4],[-3596.1,-3582.2,-138.5],[-3571.1,-3558.1,-131.6],[-3546.0,-3534.1,-124.7],[-3521.0,-3510.1,-117.8],[-3496.0,-3485.9,-111.5],[-3471.0,-3461.7,-105.3],[-3446.0,-3437.4,-99.0],[-3421.0,-3413.2,-92.7],[-3396.0,-3388.9,-87.1],[-3371.0,-3364.5,-81.6],[-3346.0,-3340.1,-76.1],[-3321.0,-3315.7,-70.7],[-3296.0,-3291.3,-65.2],[-3271.0,-3266.7,-60.7],[-3246.0,-3242.1,-56.2],[-3221.0,-3217.5,-51.6],[-3196.0,-3192.9,-47.1],[-3171.0,-3168.3,-42.8],[-3146.0,-3143.6,-38.8],[-3121.0,-3118.9,-34.8],[-3096.0,-3094.2,-30.8],[-3071.0,-3069.6,-26.8],[-3046.0,-3044.7,-23.8],[-3020.9,-3019.9,-21.1],[-2995.9,-2995.0,-18.4],[-2970.9,-2970.2,-15.6],[-2945.9,-2945.3,-13.0],[-2920.9,-2920.4,-10.9],[-2895.9,-2895.5,-8.8],[-2870.9,-2870.6,-6.7],[-2845.9,-2845.6,-4.6],[-2820.9,-2820.7,-3.1],[-2795.9,-2795.7,-1.7],[-2770.9,-2770.7,-0.3],[-2745.9,-2745.8,1.1],[-2720.9,-2720.8,2.5],[-2695.9,-2695.8,3.3],[-2670.9,-2670.8,4.1],[-2645.9,-2645.8,4.8],[-2620.9,-2620.8,5.6],[-2595.9,-2595.8,6.4],[-2570.9,-2570.9,6.7],[-2545.9,-2545.8,6.6],[-2520.8,-2520.8,6.4],[-2495.8,-2495.8,6.3],[-2470.8,-2470.8,6.1],[-2445.8,-2445.8,6.0],[-2420.8,-2420.8,5.9],[-2395.8,-2395.8,6.0],[-2370.8,-2370.8,6.0],[-2345.8,-2345.8,6.1],[-2320.8,-2320.8,6.2],[-2295.8,-2295.8,6.3],[-2270.8,-2270.8,6.3],[-2245.8,-2245.8,6.4],[-2220.8,-2220.8,6.5],[-2195.8,-2195.8,6.6],[-2170.8,-2170.8,6.7],[-2145.8,-2145.8,6.7],[-2120.8,-2120.8,6.8],[-2095.8,-2095.8,6.9],[-2070.8,-2070.8,7.0],[-2045.8,-2045.8,7.0],[-2020.7,-2020.7,7.1],[-1995.7,-1995.7,7.2],[-1970.7,-1970.7,7.3],[-1945.7,-1945.7,7.3],[-1920.7,-1920.7,7.4],[-1895.7,-1895.7,7.5],[-1870.7,-1870.7,7.6],[-1845.7,-1845.7,7.7],[-1820.7,-1820.7,7.7],[-1795.7,-1795.7,7.8],[-1770.7,-1770.7,7.9],[-1745.7,-1745.7,8.0],[-1720.7,-1720.7,8.0],[-1695.7,-1695.7,8.1],[-1670.7,-1670.7,8.2],[-1645.7,-1645.7,8.3],[-1620.7,-1620.7,8.3],[-1595.7,-1595.7,8.4],[-1570.7,-1570.7,8.5],[-1545.7,-1545.7,8.6],[-1520.7,-1520.7,8.7],[-1495.6,-1495.6,8.7],[-1470.6,-1470.6,8.7],[-1445.6,-1445.6,8.7],[-1420.6,-1420.6,8.7],[-1395.6,-1395.6,8.7],[-1370.6,-1370.6,8.7],[-1345.6,-1345.6,8.8],[-1320.6,-1320.6,8.8],[-1295.6,-1295.6,8.8],[-1270.6,-1270.6,8.8],[-1245.6,-1245.6,8.8],[-1220.6,-1220.6,8.8],[-1195.6,-1195.6,8.8],[-1170.6,-1170.6,8.8],[-1145.6,-1145.6,8.8],[-1120.6,-1120.6,8.8],[-1095.6,-1095.6,8.8],[-1070.6,-1070.6,8.9],[-1045.6,-1045.6,8.9],[-1020.6,-1020.6,8.9],[-995.5,-995.5,8.9],[-970.5,-970.5,8.9],[-945.5,-945.5,8.9],[-920.5,-920.5,8.9],[-895.5,-895.5,8.9],[-870.5,-870.5,8.9],[-845.5,-845.5,8.9],[-820.5,-820.5,8.9],[-795.5,-795.5,8.9],[-770.5,-770.5,9.0],[-745.5,-745.5,9.0],[-720.5,-720.5,9.0],[-695.5,-695.5,9.0],[-670.5,-670.5,9.0],[-645.5,-645.5,9.0],[-620.5,-620.5,9.0],[-595.5,-595.5,9.0],[-570.5,-570.5,9.0],[-545.5,-545.5,9.0],[-520.5,-520.5,9.0],[-495.4,-495.4,9.1],[-470.4,-470.4,9.1],[-445.4,-445.4,9.1],[-420.4,-420.4,9.1],[-395.4,-395.4,9.1],[-370.4,-370.4,9.1],[-345.4,-345.4,9.1],[-320.4,-320.4,9.1],[-295.4,-295.4,9.1],[-270.4,-270.4,9.1],[-245.4,-245.4,9.1],[-220.4,-220.4,9.1],[-195.4,-195.4,9.2],[-170.4,-170.4,9.2],[-145.4,-145.4,9.2],[-120.4,-120.4,9.2],[-95.4,-95.4,9.2],[-70.4,-70.4,9.2],[-45.4,-45.4,9.2],[-20.4,-20.4,9.2],[4.6,4.6,9.2],[29.7,29.7,9.2],[54.7,54.7,9.2],[79.7,79.7,9.2],[104.7,104.7,9.3],[129.7,129.7,9.3],[154.7,154.7,9.3],[179.7,179.7,9.3],[204.7,204.7,9.3],[229.7,229.7,9.3],[254.7,254.7,9.3],[279.7,279.7,9.3],[304.7,304.7,9.3],[329.7,329.7,9.3],[354.7,354.7,9.3],[379.7,379.7,9.4],[404.7,404.7,9.4],[429.7,429.7,9.4],[454.7,454.7,9.4],[479.7,479.7,9.4],[504.7,504.7,9.4],[529.8,529.8,9.4],[554.8,554.8,9.4],[579.8,579.8,9.4],[604.8,604.8,9.4],[629.8,629.8,9.4],[654.8,654.8,9.4],[679.8,679.8,9.5],[704.8,704.8,9.5],[729.8,729.8,9.5],[754.8,754.8,9.5],[779.8,779.8,9.5],[804.8,804.8,9.5],[829.8,829.8,9.5],[854.8,854.8,9.5],[879.8,879.8,9.5],[904.8,904.8,9.5],[929.8,929.8,9.5],[954.8,954.8,9.6],[979.8,979.8,9.6],[1004.8,1004.8,9.6],[1029.9,1029.9,9.6],[1054.9,1054.9,9.6],[1079.9,1079.9,9.6],[1104.9,1104.9,9.6],[1129.9,1129.9,9.6],[1154.9,1154.9,9.6],[1179.9,1179.9,9.6],[1204.9,1204.9,9.6],[1229.9,1229.9,9.6],[1254.9,1254.9,9.7],[1279.9,1279.9,9.7],[1304.9,1304.9,9.7],[1329.9,1329.9,9.7],[1354.9,1354.9,9.8],[1379.9,1379.9,10.0],[1404.9,1404.9,10.1],[1429.9,1429.9,10.3],[1454.9,1454.9,10.5],[1479.9,1479.9,10.6],[1504.9,1504.9,10.8],[1529.9,1529.9,11.0],[1555.0,1554.9,11.2],[1580.0,1580.0,11.3],[1605.0,1605.0,11.5],[1630.0,1630.0,11.1],[1655.0,1655.0,10.6],[1680.0,1680.0,10.2],[1705.0,1705.0,9.7],[1730.0,1730.0,9.3],[1755.0,1755.0,8.8],[1780.0,1780.0,8.4],[1805.0,1805.0,8.0],[1830.0,1830.0,7.5],[1855.0,1854.9,6.5],[1880.0,1879.9,5.0],[1905.0,1904.9,3.6],[1930.0,1929.8,2.1],[1955.0,1954.8,0.6],[1980.0,1979.8,-0.8],[2005.0,2004.7,-2.3],[2030.0,2029.7,-3.8],[2055.1,2054.6,-5.5],[2080.1,2079.6,-7.4],[2105.1,2104.5,-9.2],[2130.1,2129.4,-11.1],[2155.1,2154.3,-13.2],[2180.1,2179.2,-15.5],[2205.1,2204.1,-17.9],[2230.1,2229.0,-20.3],[2255.1,2253.9,-22.7],[2280.1,2278.8,-25.1],[2305.1,2303.7,-27.5],[2330.1,2328.6,-29.9],[2355.1,2353.5,-32.4],[2380.1,2378.2,-35.9],[2405.1,2403.0,-39.4],[2430.1,2427.7,-42.8],[2455.1,2452.5,-46.3],[2480.1,2477.2,-50.1],[2505.1,2501.9,-54.1],[2530.1,2526.6,-58.1],[2555.2,2551.3,-62.1],[2580.2,2576.0,-65.9],[2605.2,2600.7,-69.6],[2630.2,2625.4,-73.2],[2655.2,2650.2,-76.9],[2680.2,2674.8,-81.1],[2705.2,2699.4,-86.0],[2730.2,2723.9,-90.8],[2755.2,2748.4,-95.7],[2780.2,2772.9,-100.6],[2805.2,2797.4,-105.5],[2830.2,2822.0,-110.4],[2855.2,2846.5,-115.3],[2880.2,2871.0,-120.2],[2905.2,2895.5,-125.3],[2930.2,2919.9,-130.6],[2955.2,2944.3,-136.0],[2980.2,2968.8,-141.3],[3005.2,2993.2,-146.7],[3030.2,3017.5,-152.5],[3055.2,3041.8,-158.3],[3080.3,3066.1,-164.2],[3105.3,3090.5,-170.0],[3130.3,3114.6,-176.4],[3155.3,3138.8,-182.8],[3180.3,3163.0,-189.2],[3205.3,3187.1,-195.7],[3230.3,3211.3,-202.1],[3255.3,3235.4,-208.5],[3280.3,3259.6,-215.0],[3305.3,3283.8,-221.4],[3330.3,3307.9,-227.9],[3355.3,3332.1,-234.3],[3380.3,3356.3,-240.7],[3405.3,3380.4,-247.2],[3430.3,3404.6,-253.6],[3455.3,3428.7,-260.1],[3480.3,3452.9,-266.5],[3505.3,3477.1,-272.9],[3530.3,3501.2,-279.4],[3555.3,3525.4,-285.8],[3580.4,3549.5,-292.3],[3605.4,3573.7,-298.7],[3630.4,3597.9,-305.1],[3655.4,3622.0,-311.6],[3680.4,3646.2,-318.0],[3705.4,3670.4,-324.4],[3730.4,3694.6,-330.8],[3755.4,3718.7,-337.1],[3780.4,3742.9,-343.4],[3805.4,3767.1,-349.7],[3830.4,3791.3,-356.0],[3855.4,3815.5,-362.3],[3880.4,3839.7,-368.6],[3905.4,3863.9,-374.9],[3930.4,3888.1,-381.2],[3955.4,3912.3,-387.6],[3980.4,3936.5,-393.9],[4005.4,3960.7,-400.2],[4030.4,3984.9,-406.5],[4055.4,4009.1,-412.8],[4080.5,4033.3,-419.1],[4105.5,4057.4,-425.6],[4130.5,4081.6,-432.1],[4155.5,4105.7,-438.7],[4180.5,4129.9,-445.2]],[[-3745.3,-3724.1,-202.9],[-3720.3,-3700.2,-195.4],[-3695.2,-3676.3,-187.8],[-3670.1,-3652.4,-180.3],[-3645.1,-3628.5,-172.8],[-3620.0,-3604.6,-165.3],[-3594.9,-3580.6,-157.8],[-3569.9,-3556.7,-150.3],[-3544.8,-3532.8,-142.8],[-3519.8,-3508.9,-135.3],[-3494.7,-3484.7,-128.7],[-3469.6,-3460.4,-122.7],[-3444.6,-3436.1,-116.6],[-3419.5,-3411.8,-110.5],[-3394.4,-3387.3,-104.9],[-3369.4,-3362.8,-99.7],[-3344.3,-3338.3,-94.5],[-3319.2,-3313.8,-89.3],[-3294.2,-3289.3,-84.1],[-3269.1,-3264.6,-79.5],[-3244.0,-3239.9,-75.1],[-3219.0,-3215.3,-70.8],[-3193.9,-3190.6,-66.4],[-3168.8,-3165.9,-62.2],[-3143.8,-3141.1,-58.4],[-3118.7,-3116.3,-54.5],[-3093.6,-3091.6,-50.7],[-3068.6,-3066.8,-46.9],[-3043.5,-3041.9,-43.6],[-3018.4,-3017.1,-40.6],[-2993.4,-2992.2,-37.6],[-2968.3,-2967.3,-34.5],[-2943.3,-2942.4,-31.6],[-2918.2,-2917.4,-29.3],[-2893.1,-2892.5,-27.0],[-2868.1,-2867.5,-24.7],[-2843.0,-2842.6,-22.4],[-2817.9,-2817.6,-20.5],[-2792.9,-2792.6,-18.5],[-2767.8,-2767.6,-16.5],[-2742.7,-2742.6,-14.5],[-2717.7,-2717.6,-13.1],[-2692.6,-2692.5,-12.3],[-2667.5,-2667.5,-11.5],[-2642.5,-2642.4,-10.7],[-2617.4,-2617.4,-9.9],[-2592.3,-2592.3,-9.1],[-2567.3,-2567.3,-8.8],[-2542.2,-2542.2,-8.7],[-2517.1,-2517.1,-8.6],[-2492.1,-2492.1,-8.4],[-2467.0,-2467.0,-8.3],[-2441.9,-2441.9,-8.2],[-2416.9,-2416.9,-8.2],[-2391.8,-2391.8,-8.2],[-2366.8,-2366.7,-8.2],[-2341.7,-2341.7,-8.2],[-2316.6,-2316.6,-8.2],[-2291.6,-2291.6,-8.3],[-2266.5,-2266.5,-8.3],[-2241.4,-2241.4,-8.3],[-2216.4,-2216.4,-8.3],[-2191.3,-2191.3,-8.3],[-2166.2,-2166.2,-8.4],[-2141.2,-2141.2,-8.4],[-2116.1,-2116.1,-8.4],[-2091.0,-2091.0,-8.4],[-2066.0,-2066.0,-8.5],[-2040.9,-2040.9,-8.5],[-2015.8,-2015.8,-8.5],[-1990.8,-1990.8,-8.5],[-1965.7,-1965.7,-8.5],[-1940.6,-1940.6,-8.6],[-1915.6,-1915.6,-8.6],[-1890.5,-1890.5,-8.6],[-1865.4,-1865.4,-8.6],[-1840.4,-1840.4,-8.8],[-1815.3,-1815.3,-8.9],[-1790.3,-1790.2,-9.0],[-1765.2,-1765.2,-9.1],[-1740.1,-1740.1,-9.2],[-1715.1,-1715.1,-9.4],[-1690.0,-1690.0,-9.5],[-1664.9,-1664.9,-9.6],[-1639.9,-1639.9,-9.7],[-1614.8,-1614.8,-9.9],[-1589.7,-1589.7,-10.0],[-1564.7,-1564.7,-10.1],[-1539.6,-1539.6,-10.2],[-1514.5,-1514.5,-10.4],[-1489.5,-1489.5,-10.4],[-1464.4,-1464.4,-10.3],[-1439.3,-1439.3,-10.3],[-1414.3,-1414.3,-10.3],[-1389.2,-1389.2,-10.3],[-1364.1,-1364.1,-10.3],[-1339.1,-1339.1,-10.2],[-1314.0,-1314.0,-10.2],[-1288.9,-1288.9,-10.2],[-1263.9,-1263.9,-10.2],[-1238.8,-1238.8,-10.2],[-1213.8,-1213.8,-10.1],[-1188.7,-1188.7,-10.1],[-1163.6,-1163.6,-10.1],[-1138.6,-1138.6,-10.1],[-1113.5,-1113.5,-10.1],[-1088.4,-1088.4,-10.0],[-1063.4,-1063.4,-10.0],[-1038.3,-1038.3,-10.0],[-1013.2,-1013.2,-10.0],[-988.2,-988.2,-10.0],[-963.1,-963.1,-10.0],[-938.0,-938.0,-9.9],[-913.0,-913.0,-9.9],[-887.9,-887.9,-9.9],[-862.8,-862.8,-9.9],[-837.8,-837.8,-9.9],[-812.7,-812.7,-9.8],[-787.6,-787.6,-9.8],[-762.6,-762.6,-9.8],[-737.5,-737.5,-9.8],[-712.5,-712.5,-9.8],[-687.4,-687.4,-9.7],[-662.3,-662.3,-9.7],[-637.3,-637.3,-9.7],[-612.2,-612.2,-9.7],[-587.1,-587.1,-9.7],[-562.1,-562.1,-9.6],[-537.0,-537.0,-9.6],[-511.9,-511.9,-9.6],[-486.9,-486.9,-9.6],[-461.8,-461.8,-9.6],[-436.7,-436.7,-9.5],[-411.7,-411.7,-9.5],[-386.6,-386.6,-9.5],[-361.5,-361.5,-9.5],[-336.5,-336.5,-9.5],[-311.4,-311.4,-9.4],[-286.3,-286.3,-9.4],[-261.3,-261.3,-9.4],[-236.2,-236.2,-9.4],[-211.1,-211.1,-9.4],[-186.1,-186.1,-9.3],[-161.0,-161.0,-9.3],[-136.0,-136.0,-9.3],[-110.9,-110.9,-9.3],[-85.8,-85.8,-9.3],[-60.8,-60.8,-9.2],[-35.7,-35.7,-9.2],[-10.6,-10.6,-9.2],[14.4,14.4,-9.2],[39.5,39.5,-9.2],[64.6,64.6,-9.1],[89.6,89.6,-9.1],[114.7,114.7,-9.1],[139.8,139.8,-9.1],[164.8,164.8,-9.1],[189.9,189.9,-9.0],[215.0,215.0,-9.0],[240.0,240.0,-9.0],[265.1,265.1,-9.0],[290.2,290.2,-9.0],[315.2,315.2,-8.9],[340.3,340.3,-8.9],[365.4,365.4,-8.9],[390.4,390.4,-8.9],[415.5,415.5,-8.9],[440.5,440.5,-8.8],[465.6,465.6,-8.8],[490.7,490.7,-8.8],[515.7,515.7,-8.8],[540.8,540.8,-8.8],[565.9,565.9,-8.8],[590.9,590.9,-8.8],[616.0,616.0,-8.8],[641.1,641.1,-8.8],[666.1,666.1,-8.9],[691.2,691.2,-8.9],[716.3,716.3,-8.9],[741.3,741.3,-8.9],[766.4,766.4,-9.0],[791.5,791.5,-9.0],[816.5,816.5,-9.0],[841.6,841.6,-9.0],[866.7,866.7,-9.1],[891.7,891.7,-9.1],[916.8,916.8,-9.1],[941.9,941.9,-9.1],[966.9,966.9,-9.2],[992.0,992.0,-9.2],[1017.0,1017.0,-9.2],[1042.1,1042.1,-9.2],[1067.2,1067.2,-9.3],[1092.2,1092.2,-9.3],[1117.3,1117.3,-9.3],[1142.4,1142.4,-9.3],[1167.4,1167.4,-9.4],[1192.5,1192.5,-9.4],[1217.6,1217.6,-9.4],[1242.6,1242.6,-9.5],[1267.7,1267.7,-9.5],[1292.8,1292.8,-9.5],[1317.8,1317.8,-9.5],[1342.9,1342.9,-9.6],[1368.0,1368.0,-9.6],[1393.0,1393.0,-9.6],[1418.1,1418.1,-9.6],[1443.2,1443.2,-9.7],[1468.2,1468.2,-9.7],[1493.3,1493.3,-9.7],[1518.4,1518.3,-9.7],[1543.4,1543.4,-9.8],[1568.5,1568.5,-9.8],[1593.5,1593.5,-9.8],[1618.6,1618.6,-9.8],[1643.7,1643.7,-9.9],[1668.7,1668.7,-9.9],[1693.8,1693.8,-9.9],[1718.9,1718.9,-9.9],[1743.9,1743.9,-10.0],[1769.0,1769.0,-10.0],[1794.1,1794.1,-10.5],[1819.1,1819.1,-11.6],[1844.2,1844.1,-12.6],[1869.3,1869.2,-13.7],[1894.3,1894.2,-14.8],[1919.4,1919.3,-15.9],[1944.5,1944.3,-17.0],[1969.5,1969.3,-18.1],[1994.6,1994.3,-19.8],[2019.7,2019.3,-22.0],[2044.7,2044.3,-24.3],[2069.8,2069.2,-26.5],[2094.8,2094.2,-28.8],[2119.9,2119.2,-31.0],[2145.0,2144.1,-33.3],[2170.0,2169.1,-35.8],[2195.1,2194.0,-38.2],[2220.2,2219.0,-40.7],[2245.2,2243.9,-43.1],[2270.3,2268.9,-45.6],[2295.4,2293.8,-48.1],[2320.4,2318.7,-50.5],[2345.5,2343.7,-53.0],[2370.6,2368.6,-55.4],[2395.6,2393.4,-59.1],[2420.7,2418.2,-63.0],[2445.8,2443.0,-66.8],[2470.8,2467.7,-70.7],[2495.9,2492.5,-74.5],[2521.0,2517.3,-78.4],[2546.0,2542.0,-82.3],[2571.1,2566.8,-86.2],[2596.2,2591.5,-90.3],[2621.2,2616.2,-94.4],[2646.3,2641.0,-98.5],[2671.3,2665.7,-102.5],[2696.4,2690.3,-107.4],[2721.5,2714.8,-112.4],[2746.5,2739.4,-117.4],[2771.6,2764.0,-122.3],[2796.7,2788.5,-127.3],[2821.7,2813.1,-132.3],[2846.8,2837.7,-137.3],[2871.9,2862.2,-142.2],[2896.9,2886.8,-147.4],[2922.0,2911.2,-153.1],[2947.1,2935.6,-158.8],[2972.1,2960.0,-164.5],[2997.2,2984.4,-170.2],[3022.3,3008.7,-176.3],[3047.3,3033.0,-182.4],[3072.4,3057.3,-188.6],[3097.5,3081.6,-194.7],[3122.5,3105.9,-200.8],[3147.6,3130.2,-206.9],[3172.7,3154.5,-213.1],[3197.7,3178.9,-219.2],[3222.8,3203.2,-225.3],[3247.8,3227.5,-231.4],[3272.9,3251.8,-237.5],[3298.0,3276.1,-243.7],[3323.0,3300.4,-249.8],[3348.1,3324.6,-256.2],[3373.2,3348.8,-262.6],[3398.2,3373.1,-269.0],[3423.3,3397.3,-275.5],[3448.4,3421.5,-281.9],[3473.4,3445.8,-288.3],[3498.5,3470.0,-294.7],[3523.6,3494.2,-301.1],[3548.6,3518.4,-307.5],[3573.7,3542.7,-314.0],[3598.8,3566.9,-320.4],[3623.8,3591.1,-326.8],[3648.9,3615.4,-333.2],[3674.0,3639.6,-339.6],[3699.0,3663.8,-346.0],[3724.1,3688.1,-352.4],[3749.2,3712.3,-358.9],[3774.2,3736.5,-365.3],[3799.3,3760.8,-371.7],[3824.3,3785.0,-378.1],[3849.4,3809.2,-384.5],[3874.5,3833.4,-390.9],[3899.5,3857.7,-397.4],[3924.6,3881.9,-403.8],[3949.7,3906.1,-410.2],[3974.7,3930.4,-416.6],[3999.8,3954.6,-423.0],[4024.9,3978.8,-429.4],[4049.9,4003.1,-435.6],[4075.0,4027.4,-441.7],[4100.1,4051.8,-447.8],[4125.1,4076.1,-453.8],[4150.2,4100.4,-459.9],[4175.3,4124.7,-466.0]]];
const LKB = 0.3;                                    // the app's base height here (local y = height above the sea - LKB): highest ground -0.3 + 0.6
const LZ = {mid:91.0, R:33320, T:833, G:0.025, base:13.68};
function lkRoad(t){            // road surface above the sea (same as szlink_deck_fix.py)
  const a = Math.abs(t), zp = a <= LZ.T ? LZ.mid - a*a/(2*LZ.R) : LZ.mid - LZ.T*LZ.T/(2*LZ.R) - LZ.G*(a - LZ.T);
  if (a <= LZ.T) return zp; const d = Math.abs(zp - LZ.base), e = 8; return Math.max(zp, LZ.base) + (d < e ? (e - d)*(e - d)/(4*e) : 0);
}
const LK = {tw:833.85, sad:271, low:98.5, cz:21.5, ip:1408, ipy:57, ipz:24, anc:1425.5, top:273, legB:31, legT:21.5};
const LKC = {conc:'#cdc9c0', cap:'#b9b3a8', gird:'#d2d5d7', cab:'#f0f1ee', hang:'#8f969c', rail:'#aeb2b5', pole:'#80858b',
  lamp:{c:'#fff2d0', glow:'#ffdca8', gk:3.0}, avi:AVI};
const lkY = abs => abs - LKB;
function lkCable(t){                                 // main cable centre (abs height, |z|) at t
  const a = Math.abs(t);
  if (a <= LK.tw) return [LK.low + (LK.sad - LK.low)*(a/LK.tw)*(a/LK.tw), LK.cz];
  const s = Math.min(1, (a - LK.tw)/(LK.ip - LK.tw)), lin = LK.sad + (LK.ipy - LK.sad)*s;
  return [lin - 4*11*s*(1 - s), LK.cz + (LK.ipz - LK.cz)*s];
}
function lkLamp(B, x, yTop, z){ const p = B.a(LKC.pole); bar(p, [x, yTop, z], [x, yTop + 9.5, z], 0.28, 0.28); boxT(B.a(LKC.lamp), x, yTop + 9.2, z, 1.8, 0.6, 1.0); }
function linkMain(){
  const g = new THREE.Group(), B = new Bat();
  const pc = B.a(LKC.conc), pcap = B.a(LKC.cap), pg = B.a(LKC.gird), pcab = B.a(LKC.cab), ph = B.a(LKC.hang), pr = B.a(LKC.rail);
  // --- girder (main + side spans, over both anchorages), streamlined box; railings; lamps
  const ts = []; for (let t = -1458; t <= 1458.01; t += 12.8) ts.push(t); if (ts[ts.length - 1] < 1458) ts.push(1458);
  const pts = ts.map(t => [t, lkY(lkRoad(t)), 0]);
  const SEC = [[-24.85, -1.5], [-20, -4.3], [20, -4.3], [24.85, -1.5], [23, -0.3], [-23, -0.3]];
  const R = sweep(pg, pts, SEC); capT(pg, R[0]); capT(pg, R[R.length - 1].slice().reverse());
  for (const sd of [-1, 1]) sweep(pr, pts, [[sd*24.0, -0.3], [sd*24.35, -0.3], [sd*24.35, 1.1], [sd*24.0, 1.1]]);
  for (let t = -1440; t <= 1440; t += 38.4) for (const sd of [-1, 1]) lkLamp(B, t, lkY(lkRoad(t)) - 0.3, sd*23.4);
  // --- towers
  for (const tx of [-LK.tw, LK.tw]){
    const zc = y => LK.legB + (LK.legT - LK.legB)*(y - 3)/(268 - 3);
    const sec = (y, sd) => { const f = (y - 3)/265, a = 15 - 6*f, b = 11 - 4*f, c = 1.5, z = sd*zc(y);
      return [[-a/2 + c, -b/2], [a/2 - c, -b/2], [a/2, -b/2 + c], [a/2, b/2 - c], [a/2 - c, b/2], [-a/2 + c, b/2], [-a/2, b/2 - c], [-a/2, -b/2 + c]].map(([u, v]) => [tx + u, lkY(y), z + v]); };
    for (const sd of [-1, 1]){
      const S = [3, 40, 80, 120, 160, 200, 240, 268].map(y => sec(y, sd));
      for (let i = 0; i < S.length - 1; i++) for (let k = 0; k < 8; k++){ const k2 = (k + 1) % 8; quad(pc, S[i][k], S[i][k2], S[i + 1][k2], S[i + 1][k]); }
      capT(pc, S[S.length - 1]);
      boxT(pc, tx, lkY(268), sd*LK.legT, 9, 4.2, 7.5);                         // saddle housing
      boxT(pc, tx, lkY(272.2), sd*LK.legT, 7.6, 0.8, 6.2);
      boxT(B.a(LKC.avi), tx, lkY(273), sd*LK.legT, 1.2, 0.9, 1.2);
      boxT(B.a(LKC.avi), tx, lkY(160), sd*(zc(160) + 5.2), 1.0, 0.8, 0.6);
      // pile cap (the islets ~39 m across)
      const cp = []; for (let k = 0; k < 24; k++){ const a = k/24*TAU; cp.push([tx + Math.cos(a)*19.5, sd*LK.legB + Math.sin(a)*19.5]); }
      wallsT(pcap, cp, lkY(-3), lkY(3.5)); flatT(pcap, cp, lkY(3.5));
    }
    // crossbeams: below the (floating) girder and the upper one of the H
    const beam = (y0, y1, w) => { const zi = zc((y0 + y1)/2) - 4.2; boxT(pc, tx, lkY(y0), 0, w, y1 - y0, 2*zi); };
    beam(65.5, 73.5, 9); beam(230, 247, 7.5);
    boxT(B.a(LKC.avi), tx, lkY(247), 0, 1, 0.8, 1);
  }
  // --- main cables (white, 1.06 m) and hangers every 12.8 m (main and side spans)
  for (const sd of [-1, 1]){
    let prev = null;
    for (let t = -LK.ip; t <= LK.ip + 0.01; t += Math.abs(t) < LK.tw ? 8 : 10){
      const tt = Math.abs(Math.abs(t) - LK.tw) < 5 ? Math.sign(t)*LK.tw : t, [y, z] = lkCable(tt), P = [tt, lkY(y), sd*z];
      if (prev) tube(pcab, prev, P, 0.53, 8); prev = P;
    }
    for (let k = -130; k <= 130; k++){
      const t = k*12.8 + 6.4; if (Math.abs(t) > LK.ip - 14 || Math.abs(Math.abs(t) - LK.tw) < 10) continue;
      const [y, z] = lkCable(t), yg = lkRoad(t) - 0.3; if (y - yg < 1.2) continue;
      bar(ph, [t, lkY(y) - 0.4, sd*z], [t, lkY(yg), sd*z], 0.24, 0.24);
    }
  }
  // --- anchorages: figure-8 island (OSM ring), the sloped anchor block, the cables' splay into it
  const ANC = [[-32.4,-29.6],[-33.6,-22.2],[-33.2,-14.7],[-31.2,-7.4],[-27.6,-0.8],[-31.7,5.6],[-34.1,13.0],[-34.8,19.9],[-34.0,27.6],[-31.3,35.0],[-27.1,41.5],[-21.6,47.0],[-14.9,51.0],[-7.5,53.5],[0.3,54.2],[8.0,53.2],[15.3,50.4],[21.8,46.1],[27.1,40.5],[31.0,33.8],[33.2,26.3],[33.7,18.6],[32.0,9.3],[27.7,1.1],[31.6,-5.2],[34.1,-12.3],[34.9,-19.8],[34.1,-27.2],[31.7,-34.3],[27.8,-40.8],[22.5,-46.2],[16.2,-50.3],[9.2,-53.0],[1.7,-54.1],[-5.8,-53.6],[-13.0,-51.4],[-19.6,-47.7],[-25.2,-42.6],[-29.5,-36.5]];
  for (const sd of [-1, 1]){
    const cx = sd*LK.anc, cz = sd > 0 ? 1.4 : 0, ring = ANC.map(([x, z]) => [cx + sd*x, cz + z]);
    wallsT(pcap, ring, lkY(-3), lkY(7)); flatT(pcap, ring, lkY(7));
    // block profile along x (front toward the tower), extruded across z
    const X = [sd*1398, sd*1408.5, sd*1452, sd*1460], Y = [7, 60.5, 60.5, 7].map(lkY), Z0 = -44 + cz, Z1 = 44 + cz;
    const pf = [[X[0], Y[0]], [X[1], Y[1]], [X[2], Y[2]], [X[3], Y[3]]];
    for (let i = 0; i < 3; i++) quad(pc, [pf[i][0], pf[i][1], Z0], [pf[i + 1][0], pf[i + 1][1], Z0], [pf[i + 1][0], pf[i + 1][1], Z1], [pf[i][0], pf[i][1], Z1]);
    for (const Z of [Z0, Z1]){ tri(pc, [pf[0][0], pf[0][1], Z], [pf[1][0], pf[1][1], Z], [pf[2][0], pf[2][1], Z]); tri(pc, [pf[0][0], pf[0][1], Z], [pf[2][0], pf[2][1], Z], [pf[3][0], pf[3][1], Z]); }
    for (const zs of [-1, 1]) boxT(pc, sd*1404, lkY(48), zs*LK.ipz, 9, 12, 9);           // splay saddle housings at the cables' entry
  }
  B.flush(g); return g;
}
// approach viaducts: a box girder under each carriageway (following the real OSM ways), piers every 110 m, lamps
function linkApproach(t0, t1, X0, Z0){
  const g = new THREE.Group(), B = new Bat(), pg = B.a(LKC.gird), pc = B.a(LKC.conc), pcap = B.a(LKC.cap), pr = B.a(LKC.rail);
  for (const L of LKD){
    const S = L.filter(q => q[0] >= t0 - 0.1 && q[0] <= t1 + 0.1);
    if (S.length < 2) continue;
    const pts = S.map(([t, x, z]) => [x - X0, lkY(lkRoad(t)), z - Z0]);
    const R = sweep(pg, pts, [[-9.4, -0.3], [-9.4, -1.2], [-6.0, -3.8], [6.0, -3.8], [9.4, -1.2], [9.4, -0.3]]);
    capT(pg, R[0]); capT(pg, R[R.length - 1].slice().reverse());
    for (const sd of [-1, 1]) sweep(pr, pts, [[sd*9.0, -0.3], [sd*9.35, -0.3], [sd*9.35, 1.1], [sd*9.0, 1.1]]);
    // piers (twin-leg pier under each girder) and lamps on the outer edge
    const side = (S[0][2] + S[S.length - 1][2])/2 > (LKD[0][0][2] + LKD[1][0][2])/2 ? 1 : -1;
    const at = t => { let i = 0; while (i < S.length - 2 && S[i + 1][0] < t) i++; const a = S[i], b = S[i + 1], f = (t - a[0])/((b[0] - a[0]) || 1); return [a[1] + (b[1] - a[1])*f - X0, a[2] + (b[2] - a[2])*f - Z0, Math.atan2(-(b[2] - a[2]), b[1] - a[1])]; };
    for (const t of [t0 < 0 ? t1 - 12 : t0 + 12].concat(Array.from({length:40}, (_, i) => Math.ceil((t0 + 60)/110)*110 + i*110).filter(t => t < t1 - 30))){
      const [x, z, ry] = at(t), yb = lkY(lkRoad(t)) - 3.8;
      if (yb < 1.5) continue;
      boxT(pcap, x, lkY(-2.5), z, 9, 4.5, 14, ry);
      for (const s of [-1, 1]){ const c = Math.cos(ry), sn = Math.sin(ry), ox = s*3.6*sn, oz = s*3.6*c; boxT(pc, x + ox, lkY(2), z + oz, 3.4, yb - lkY(2) - 1.6, 3.0, ry); }
      boxT(pc, x, yb - 1.6, z, 4.2, 1.6, 12.5, ry);
    }
    for (let t = Math.ceil(t0/38.4)*38.4; t < t1; t += 38.4){
      const [x, z, ry] = at(t), c = Math.cos(ry), sn = Math.sin(ry), y = lkY(lkRoad(t)) - 0.3;
      for (const s of [-1, 1]) lkLamp(B, x + s*8.6*sn, y, z + s*8.6*c);
    }
  }
  B.flush(g); return g;
}
LANDMARKS.szszlink = {zh:'深中通道伶仃洋大桥', en:'Lingdingyang Bridge (Shenzhen-Zhongshan Link)', cat:'new', r:1560, h:273,
  lt:{m:0, c:'#fff1dc', k:0.95, e:0.75}, build(){ return linkMain(); }};
LANDMARKS.szszlink_w = {zh:'深中通道伶仃洋大桥西引桥', en:'Lingdingyang Bridge west approach', cat:'new', r:1250, h:70,
  lt:{m:0, c:'#fff1dc', k:0.45, e:0.6}, build(){ return linkApproach(-3746, -1458, -2631.6, -2.5); }};
LANDMARKS.szszlink_e = {zh:'深中通道伶仃洋大桥东引桥', en:'Lingdingyang Bridge east approach', cat:'new', r:1400, h:70,
  lt:{m:0, c:'#fff1dc', k:0.45, e:0.6}, build(){ return linkApproach(1458, 4060, 2780.7, -113.9); }};
SG_PLACES.push({type:'szszlink', lat:22.5553435, lon:113.7255956, rot:0.32976});
SG_PLACES.push({type:'szszlink_w', lat:22.5476699, lon:113.7014180, rot:0.32976});
SG_PLACES.push({type:'szszlink_e', lat:22.5644486, lon:113.7507763, rot:0.32976});
// ================================================================================================ Shenzhen Bao'an Airport T3 (szt3)
// Studio Fuksas, opened 28 Nov 2013: about 1.5 km long, ~500 000 m2, roof spans up to 80 m; a double skin of white honeycomb panels
// with hexagonal glazed openings wrapping roof and walls ("manta ray"). Built on its OSM footprint w222145025 (the main hall, the
// 1 km concourse and the cross-shaped pier) as a vaulted pillow roof: the concourse vault rises to ~26 m, the main hall to ~41 m
// (heights estimated: not published), honeycomb glazing on the whole skin, glowing at night (lit from inside).
const T3R = [[-446.4,-217.3],[-269.3,-307.6],[-258.3,-313.7],[-242.8,-324.2],[-236.6,-329.2],[-230.6,-335.6],[-226.7,-340.8],[-223.7,-345.8],[-220.7,-353.1],[-219.6,-357.7],[-219.7,-362.6],[-222.4,-370.0],[-259.3,-441.3],[-343.6,-607.0],[-286.4,-635.0],[-190.1,-445.9],[-163.7,-394.9],[-160.0,-391.9],[-155.7,-389.5],[-148.8,-387.1],[-137.1,-385.7],[-131.7,-385.8],[-125.0,-386.7],[-116.4,-388.5],[-102.3,-393.5],[-86.5,-399.8],[90.4,-489.6],[116.2,-439.9],[-56.6,-351.9],[-73.1,-342.3],[-86.1,-333.6],[-97.5,-322.8],[-103.2,-315.6],[-108.8,-304.5],[-110.2,-296.7],[-110.1,-293.6],[-109.8,-290.6],[-108.1,-286.3],[-38.5,-149.2],[-17.3,-109.5],[11.8,-57.6],[36.3,-18.7],[60.8,15.9],[81.4,38.2],[87.3,42.9],[103.9,52.5],[112.5,55.9],[122.7,58.1],[132.8,58.3],[150.1,56.4],[215.5,46.7],[291.8,37.7],[308.8,35.2],[359.1,26.0],[364.0,26.2],[368.4,27.2],[372.4,29.7],[376.5,34.0],[380.5,39.5],[390.4,62.4],[391.9,67.8],[392.5,72.6],[391.1,78.2],[388.2,82.4],[383.9,86.1],[375.4,92.1],[315.9,125.6],[307.7,131.3],[304.6,134.9],[302.4,139.3],[301.9,143.6],[302.2,149.9],[309.7,186.9],[311.8,204.5],[312.0,213.2],[310.8,219.8],[307.1,225.5],[300.1,231.7],[284.3,242.5],[206.5,291.7],[200.0,297.8],[196.3,305.4],[193.6,317.2],[192.8,327.6],[193.3,337.8],[196.2,351.2],[210.3,395.2],[209.7,400.0],[208.7,402.3],[207.0,404.6],[205.2,406.0],[203.2,406.6],[200.5,406.8],[197.5,406.4],[192.7,404.0],[191.0,402.0],[182.2,388.0],[172.6,374.8],[164.6,364.7],[155.1,354.2],[148.0,348.0],[138.5,341.5],[131.3,338.1],[124.7,335.5],[115.7,333.8],[107.8,334.3],[97.9,336.6],[87.4,341.4],[77.0,347.7],[34.0,376.0],[15.3,389.3],[6.3,395.0],[1.0,397.2],[-2.3,397.6],[-6.2,397.5],[-9.4,396.6],[-12.9,394.8],[-15.9,392.4],[-20.4,387.1],[-26.9,374.2],[-44.4,329.8],[-48.5,321.1],[-51.8,316.3],[-56.0,314.5],[-58.6,314.3],[-64.5,315.3],[-71.0,318.0],[-77.0,321.4],[-125.2,354.2],[-130.9,357.4],[-136.3,358.8],[-141.9,358.7],[-149.4,357.5],[-160.6,353.4],[-177.9,346.1],[-187.5,340.9],[-190.9,338.4],[-193.1,335.3],[-194.5,330.1],[-194.6,325.0],[-193.8,319.8],[-190.6,311.9],[-183.3,300.4],[-171.0,284.8],[-150.8,261.4],[-86.2,192.6],[-72.2,180.1],[-42.3,154.8],[-33.4,145.3],[-26.8,136.7],[-20.4,125.9],[-15.9,114.1],[-14.3,108.5],[-13.6,102.8],[-13.6,97.2],[-14.3,89.6],[-15.6,78.6],[-18.5,65.9],[-22.6,50.9],[-34.1,16.0],[-42.7,-7.5],[-64.7,-56.3],[-94.6,-118.7],[-164.7,-257.0],[-167.6,-261.8],[-172.7,-266.3],[-178.6,-269.4],[-187.0,-270.9],[-192.1,-271.2],[-200.9,-270.3],[-217.3,-267.0],[-227.3,-263.4],[-243.4,-256.1],[-420.6,-167.0]];
const t3h = (x, z, d) => 4.5 + 21*Math.sqrt(Math.max(0, 1 - Math.pow(1 - Math.min(1, d/34), 2))) + 16*Math.pow(Math.min(1, d/125), 2);
// One continuous skin, split over three keys so that each key's ground hull (the app hides real buildings inside the convex hull)
// stays tight: szt3 = the main hall (z > 20), szt3_c = the concourse spine, szt3_p = the cross-shaped pier (z < -285).
function t3Part(pred){
  const g = new THREE.Group(), B = new Bat();
  const roof = B.a({c:'#eef0ee'}), wall = B.a({c:'#9fb1bd', m:1, fh:4.4, cw:3.2});
  const {Dg} = pillow(roof, wall, T3R, 7, t3h, -1);
  panels(B.a({c:'#7f96a6', glow:'#ffe1ae', gk:0.7}), T3R, 9.5, 3.3, (x, z) => t3h(x, z, Math.max(0, Dg(x, z))), Dg, 1.2, 0.3);
  triFilter(B, pred); B.flush(g); return g;
}
const T3LT = {m:0, c:'#fff1dc', k:0.32, e:0.7};
// the convex ground hull of the main hall takes in the VIP building in its east notch (OSM w545101852, height not mapped): rebuilt
// here as a plain 3-storey block (12 m, estimated) so that it does not vanish
const T3VIP = [[305,147],[346,126],[348,129],[353,127],[372,164],[333,184],[332,182],[328,184],[327,181],[324,183]];
LANDMARKS.szt3 = {zh:'深圳宝安国际机场T3航站楼', en:"Shenzhen Bao'an Airport Terminal 3", cat:'new', r:460, h:42, lt:T3LT, build(){
  const g = t3Part((x, z) => z > 20), B = new Bat(); wallsT(B.a({c:'#c4c8cb', m:1, fh:4, cw:3}), T3VIP, -1, 12); flatT(B.a('#d6d7d5'), T3VIP, 12); B.flush(g); return g; }};
LANDMARKS.szt3_c = {zh:'深圳宝安国际机场T3航站楼指廊', en:"Shenzhen Bao'an Airport T3 concourse", cat:'new', r:500, h:30, lt:T3LT, build(){ return t3Part((x, z) => z <= 20 && z >= -285); }};
LANDMARKS.szt3_p = {zh:'深圳宝安国际机场T3航站楼十字指廊', en:"Shenzhen Bao'an Airport T3 cross pier", cat:'new', r:700, h:30, lt:T3LT, build(){ return t3Part((x, z) => z < -285); }};
SG_PLACES.push({type:'szt3', lat:22.629986, lon:113.806991, rot:0});
SG_PLACES.push({type:'szt3_c', lat:22.629986, lon:113.806991, rot:0});
SG_PLACES.push({type:'szt3_p', lat:22.629986, lon:113.806991, rot:0});

// ================================================================================================ Satellite Concourse (szsatellite)
// Opened Dec 2021 (Aedas) north of T3, linked by the people mover: an X of four glazed piers from a central hall (OSM w877295774).
// Vault height ~19 m and the skylight lattice are estimates.
const SATR = [[-354.4,-80.0],[-345.4,-96.7],[-336.4,-110.3],[-326.1,-123.0],[-171.4,-24.0],[-156.7,-16.3],[-143.9,-12.5],[-130.2,-11.0],[-115.8,-10.6],[-100.3,-11.9],[-86.2,-13.7],[-70.2,-16.5],[-54.7,-20.4],[-40.9,-25.3],[-28.0,-30.6],[-8.2,-40.6],[8.3,-50.6],[24.0,-62.3],[38.1,-74.2],[48.2,-83.9],[56.7,-93.3],[65.4,-104.1],[72.6,-114.2],[78.1,-123.7],[84.0,-139.4],[85.7,-148.7],[95.7,-334.2],[146.5,-331.9],[137.9,-147.9],[138.0,-132.2],[138.4,-120.4],[139.6,-111.8],[142.3,-101.0],[150.2,-80.7],[156.9,-68.0],[169.8,-50.2],[177.6,-42.0],[199.6,-23.5],[360.3,80.1],[334.3,120.8],[172.5,19.3],[159.3,13.1],[153.3,11.0],[147.7,9.4],[141.6,8.5],[132.7,7.9],[110.3,8.0],[98.0,9.1],[75.9,13.0],[53.1,19.3],[40.1,23.9],[27.7,29.5],[4.7,41.8],[-7.3,49.7],[-19.1,58.4],[-39.5,76.7],[-50.5,87.7],[-59.5,98.1],[-69.8,113.5],[-73.8,120.3],[-76.9,127.6],[-79.8,137.4],[-81.8,146.5],[-90.7,337.4],[-142.5,334.9],[-133.4,148.0],[-133.9,133.2],[-135.3,120.5],[-137.4,109.3],[-140.3,98.6],[-144.3,87.1],[-148.9,76.6],[-154.9,65.4],[-167.7,46.7],[-174.8,38.8],[-186.6,28.9]];
const sath = (x, z, d) => 5 + 14*Math.sqrt(Math.max(0, 1 - Math.pow(1 - Math.min(1, d/24), 2))) + 6*Math.pow(Math.min(1, d/80), 2);
LANDMARKS.szsatellite = {zh:'深圳机场卫星厅', en:'Shenzhen Airport Satellite Concourse', cat:'new', r:372, h:26,
  lt:{m:0, c:'#fff1dc', k:0.3, e:0.7},
  build(){
    const g = new THREE.Group(), B = new Bat();
    const {Dg} = pillow(B.a({c:'#e7e9ea'}), B.a({c:'#93a9b8', m:1, fh:4.4, cw:3.0}), SATR, 6, sath, -1);
    panels(B.a({c:'#7d93a2', glow:'#ffe6bd', gk:0.6}), SATR, 11, 3.0, (x, z) => sath(x, z, Math.max(0, Dg(x, z))), Dg, 9, 0.25, 4, PI/4, false);
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'szsatellite', lat:22.64311, lon:113.799793, rot:0});

// ================================================================================================ Control tower (szatctower)
// The airfield's control tower (OSM w478460848, a 19 m round footprint; OSM height 98 m, not verified) and its base building
// (w478460850). Slim round shaft, flared neck, glazed octagonal cab, roof and mast; the shape is generic (no published drawings).
LANDMARKS.szatctower = {zh:'深圳机场塔台', en:'Shenzhen Airport Control Tower', cat:'new', r:30, h:98,
  lt:{m:0, c:'#eef3ff', k:0.55, e:0.4},
  build(){
    const g = new THREE.Group(), B = new Bat(), c = '#e9e9e5';
    const base = [[-18.2,-1.2],[10.1,-15.7],[22.9,8.8],[-5.4,23.3]];
    wallsT(B.a({c:'#c9ccd0', m:1, fh:3.4, cw:2.6}), base, -1, 6.8); flatT(B.a('#d5d6d4'), base, 6.8);
    B.flush(g);
    LLathe(g, [[0, -1], [9.4, -1], [9.4, 4], [7.2, 8], [6.4, 30], [5.6, 60], [5.4, 74], [7.6, 79], [9.6, 82]], 0, 0, 0, c, 24);
    LLathe(g, [[9.6, 82], [9.9, 82.6], [9.0, 89.2], [9.2, 89.4]], 0, 0, 0, {c:'#5d7f95', glow:'#cfe6ff', gk:0.9}, 8);
    LLathe(g, [[9.4, 89.3], [10.4, 89.8], [9.2, 91.4], [3.0, 92.4], [0, 92.6]], 0, 0, 0, c, 16);
    LCyl(g, 0.35, 0.5, 5.5, 0, 92.4, 0, '#bfc2c4', 6);
    LBox(g, 0.8, 0.8, 0.8, 0, 97.6, 0, AVI);
    for (let k = 0; k < 8; k++){ const a = k/8*TAU; LBox(g, 0.5, 0.4, 0.5, Math.cos(a)*9.3, 91.2, Math.sin(a)*9.3, AVI); }
    return g;
  }};
SG_PLACES.push({type:'szatctower', lat:22.636853, lon:113.803817, rot:0});
// ================================================================================================ Shenzhen World (szworld)
// Shenzhen World Exhibition & Convention Center (opened Nov 2019): 16 standard 20 000 m2 halls and 2 multi-function halls in two
// rows along a 1.75 km central corridor, one 50 000 m2 super hall, entrance / conference halls; hall spans 99 m, 42 m between halls;
// curved single-curvature truss roofs with undulating forms (CUG structural paper). Built from this build's 40 OSM building:parts of
// w785606096: H = standard hall, X = the super hall, S = the service blocks between paired halls, C = the central corridor (glazed
// roof, glowing at night), E = the four oval halls, L = the low link between them, K = small end blocks / canopies.
// Valode & Pistre (Paris) with Aube: a fishbone plan under an indigo, wave-like roof 19 m high, thinned to a "wing" at its edges
// (Architecture Prize / ducks.fr). Halls 19 m at the crest with a gentle wave; corridor, ovals and super hall heights estimated.
const SZW = [["H",[[-199.2,324.0],[18.6,293.3],[33.9,400.2],[-183.9,430.9],[-186.8,415.9],[-193.6,393.0],[-195.6,383.2],[-196.6,373.0],[-196.2,352.9],[-196.5,345.5],[-197.0,338.9]]],["E",[[-231.1,250.0],[-230.6,244.5],[-228.9,236.2],[-225.9,224.7],[-224.1,215.6],[-224.1,211.9],[-225.9,200.0],[-225.9,196.6],[-224.6,194.1],[-222.9,192.1],[-219.4,190.4],[-86.8,171.8],[-79.9,171.8],[-73.0,172.9],[-68.5,175.6],[-63.8,179.5],[-60.0,185.2],[-53.9,198.8],[-48.5,215.2],[-44.9,229.7],[-43.0,245.9],[-43.5,260.9],[-45.6,276.4],[-48.8,285.1],[-51.3,289.2],[-54.7,293.0],[-58.6,295.8],[-63.0,297.4],[-68.7,298.7],[-201.2,317.6],[-203.8,316.9],[-205.7,315.6],[-207.2,314.3],[-208.6,311.9],[-209.4,309.2],[-209.9,303.0],[-211.4,295.6],[-213.0,291.5],[-226.0,270.6],[-228.5,264.8],[-229.9,260.3],[-230.9,255.2]]],["L",[[-115.5,239.7],[-115.2,231.7],[-112.7,223.0],[-106.1,213.7],[-93.7,202.5],[-75.7,191.8],[-60.0,185.2],[-38.7,178.8],[-19.6,174.3],[23.3,166.3],[44.8,163.8],[67.8,162.3],[88.6,161.5],[113.0,161.5],[135.1,163.6],[150.6,167.1],[163.2,171.8],[171.9,176.4],[178.6,181.9],[184.0,189.3],[187.3,197.8],[186.8,207.1],[183.2,216.5],[177.4,224.4],[170.1,232.1],[159.1,239.7],[146.4,245.5],[125.9,253.2],[105.0,258.9],[83.4,263.8],[59.7,268.2],[38.1,271.5],[-7.2,276.2],[-29.6,277.0],[-45.6,276.4],[-69.4,273.2],[-86.5,268.5],[-98.6,263.3],[-107.2,256.5],[-112.2,249.2]]],["C",[[-150.0,-885.2],[-149.4,-888.7],[-148.3,-892.0],[-146.7,-895.1],[-144.6,-898.0],[-142.1,-900.4],[-139.0,-902.6],[-135.5,-904.3],[-131.8,-905.2],[-128.0,-905.6],[-124.1,-905.3],[-120.4,-904.3],[-116.9,-902.8],[-113.8,-900.6],[-111.0,-898.0],[-108.8,-894.9],[-107.1,-891.5],[-106.0,-887.9],[-101.4,-861.1],[-87.5,-761.2],[-49.1,-492.8],[-32.4,-378.9],[-18.4,-278.1],[137.7,812.9],[138.9,815.1],[140.9,815.7],[240.1,801.9],[226.4,804.5],[215.8,806.9],[208.2,809.6],[197.5,815.3],[188.1,824.0],[184.2,828.5],[180.3,834.0],[169.0,852.7],[163.5,859.3],[156.9,865.7],[150.4,870.3],[143.2,874.4],[135.5,877.1],[127.6,878.8],[120.2,879.3],[112.5,879.0],[105.0,877.9],[98.1,875.9],[90.6,872.7],[83.4,868.9],[69.9,859.1],[57.5,849.4],[50.3,845.0],[43.1,841.4],[35.7,838.8],[27.1,836.6],[17.7,835.8],[6.7,835.6],[-6.2,837.1],[91.8,822.9],[93.5,821.7],[93.9,819.3],[-62.3,-272.0],[-76.2,-372.2],[-110.9,-612.0],[-144.9,-852.6],[-149.9,-881.7]]],["E",[[110.1,190.7],[110.9,174.7],[113.0,161.5],[115.2,154.3],[118.7,149.3],[122.1,145.4],[128.4,142.4],[135.1,140.5],[267.6,121.3],[271.4,121.9],[273.7,123.4],[275.6,125.4],[276.6,128.7],[278.2,140.6],[279.3,144.2],[293.7,170.1],[295.8,175.2],[297.0,180.3],[297.5,185.4],[297.5,190.1],[296.7,196.3],[290.2,220.1],[289.8,224.5],[290.5,232.0],[291.8,238.0],[291.8,240.9],[291.1,243.5],[288.6,247.0],[286.2,248.4],[153.8,267.3],[148.0,267.7],[143.3,267.3],[138.8,265.8],[134.4,263.1],[130.8,259.8],[125.9,253.2],[119.6,239.6],[114.7,223.3],[111.5,207.0]]],["H",[[-178.9,467.6],[39.1,437.0],[54.4,543.7],[-163.6,574.5],[-165.8,559.6],[-167.1,553.1],[-168.9,545.9],[-174.9,526.7],[-176.9,516.6],[-177.6,506.6],[-177.6,482.7]]],["S",[[-183.9,430.9],[33.9,400.2],[39.1,437.0],[-178.9,467.6]]],["E",[[-339.6,-510.8],[-339.1,-516.3],[-337.4,-524.7],[-334.4,-536.2],[-332.6,-545.2],[-332.6,-548.9],[-334.4,-560.8],[-334.4,-564.3],[-333.1,-566.7],[-331.3,-568.8],[-327.9,-570.4],[-195.2,-589.1],[-188.3,-589.1],[-181.4,-588.0],[-177.0,-585.2],[-172.3,-581.4],[-168.4,-575.6],[-162.4,-562.0],[-157.0,-545.7],[-153.4,-531.1],[-151.4,-514.9],[-152.0,-499.9],[-154.1,-484.4],[-157.3,-475.8],[-159.7,-471.7],[-163.2,-467.8],[-167.1,-465.1],[-171.5,-463.4],[-177.1,-462.2],[-309.6,-443.3],[-312.3,-444.0],[-314.2,-445.2],[-315.7,-446.6],[-317.1,-448.9],[-317.9,-451.7],[-318.3,-457.8],[-319.9,-465.2],[-321.5,-469.3],[-334.5,-490.3],[-337.0,-496.0],[-338.4,-500.6],[-339.3,-505.6]]],["L",[[-224.0,-521.1],[-223.7,-529.2],[-221.2,-537.8],[-214.6,-547.1],[-202.1,-558.4],[-184.2,-569.1],[-168.4,-575.6],[-147.2,-582.1],[-128.1,-586.6],[-107.8,-590.8],[-86.0,-594.5],[-64.0,-597.3],[-19.9,-599.3],[4.5,-599.3],[26.6,-597.3],[42.1,-593.7],[54.7,-589.1],[63.4,-584.4],[70.2,-578.9],[75.5,-571.5],[78.9,-563.0],[78.3,-553.7],[74.7,-544.4],[68.9,-536.5],[61.6,-528.8],[50.7,-521.1],[38.0,-515.4],[17.4,-507.6],[-3.5,-501.9],[-25.0,-497.0],[-70.3,-489.3],[-92.9,-486.6],[-115.7,-484.7],[-138.0,-483.8],[-154.1,-484.4],[-177.8,-487.7],[-195.0,-492.3],[-207.1,-497.5],[-215.7,-504.4],[-220.7,-511.7]]],["E",[[1.6,-570.1],[2.4,-586.2],[4.5,-599.3],[6.8,-606.6],[10.2,-611.6],[13.6,-615.4],[20.0,-618.4],[26.6,-620.4],[159.1,-639.5],[162.9,-638.9],[165.2,-637.5],[167.1,-635.5],[168.7,-628.6],[169.7,-620.2],[170.8,-616.7],[185.3,-590.8],[187.3,-585.7],[188.6,-580.6],[189.1,-575.4],[189.0,-570.7],[188.3,-564.5],[181.8,-540.8],[181.4,-536.4],[182.0,-528.8],[183.4,-522.8],[183.3,-520.0],[182.7,-517.3],[180.1,-513.9],[177.8,-512.5],[45.3,-493.6],[39.5,-493.2],[34.8,-493.5],[30.3,-495.1],[25.9,-497.8],[22.3,-501.0],[17.4,-507.6],[11.1,-521.3],[6.2,-537.5],[3.1,-553.9]]],["H",[[62.4,287.2],[280.5,256.4],[282.7,271.3],[284.0,277.8],[285.8,285.0],[291.8,304.2],[293.8,314.2],[294.5,324.3],[294.4,348.1],[295.8,363.3],[77.7,394.0]]],["H",[[83.0,431.0],[301.4,399.9],[304.3,414.9],[311.1,437.7],[313.2,447.6],[314.1,457.8],[313.7,477.9],[314.0,485.3],[314.6,491.9],[316.7,506.8],[98.2,537.3]]],["S",[[77.7,394.0],[295.8,363.3],[301.4,399.9],[83.0,431.0]]],["H",[[122.9,709.8],[341.4,678.8],[344.3,693.7],[351.1,716.6],[353.1,726.5],[354.1,736.7],[353.7,756.8],[354.0,764.1],[354.5,770.8],[356.7,783.1],[356.4,784.7],[355.5,785.7],[353.8,786.1],[140.9,815.7],[138.9,815.1],[137.7,812.9]]],["S",[[117.6,672.7],[335.8,642.2],[341.4,678.8],[122.9,709.8]]],["H",[[102.3,565.7],[320.5,535.3],[322.6,550.2],[323.9,556.7],[325.8,563.9],[331.8,583.0],[333.7,593.1],[334.5,603.2],[334.4,627.0],[335.8,642.2],[117.6,672.7]]],["H",[[-159.2,602.9],[58.5,572.3],[73.8,679.1],[-143.9,709.7],[-146.8,694.8],[-153.6,671.9],[-155.7,662.1],[-156.6,651.8],[-156.2,631.8],[-156.5,624.4],[-157.1,617.8]]],["S",[[-143.9,709.7],[73.8,679.1],[79.0,715.8],[-139.0,746.4]]],["H",[[-139.0,746.4],[79.0,715.8],[93.9,819.3],[93.5,821.7],[91.8,822.9],[-118.9,853.0],[-121.0,852.9],[-122.8,852.0],[-123.8,850.0],[-127.1,831.9],[-128.9,824.7],[-135.0,805.6],[-136.9,795.5],[-137.7,785.5],[-137.6,761.6]]],["H",[[-293.7,-341.8],[-76.2,-372.2],[-62.3,-272.0],[-279.7,-241.3],[-282.6,-256.2],[-289.4,-279.1],[-291.5,-289.0],[-292.4,-299.2],[-292.0,-319.3],[-292.3,-326.7]]],["S",[[-279.7,-241.3],[-62.3,-272.0],[-57.0,-235.2],[-274.8,-204.6]]],["H",[[-274.8,-204.6],[-57.0,-235.2],[-41.8,-128.7],[-259.5,-97.7],[-261.6,-112.6],[-262.9,-119.1],[-264.7,-126.3],[-270.8,-145.5],[-272.7,-155.5],[-273.5,-165.6],[-273.4,-189.4]]],["S",[[-18.4,-278.1],[200.0,-308.9],[205.6,-272.3],[-13.1,-241.5]]],["H",[[-13.1,-241.5],[205.6,-272.3],[208.5,-257.3],[215.3,-234.4],[217.3,-224.6],[218.3,-214.3],[217.9,-194.3],[218.2,-186.9],[218.7,-180.3],[220.9,-165.4],[2.1,-134.9]]],["H",[[-32.4,-378.9],[186.0,-409.4],[186.8,-400.8],[188.1,-394.3],[189.9,-387.2],[196.0,-368.0],[197.9,-357.9],[198.7,-347.9],[198.6,-324.0],[200.0,-308.9],[-18.4,-278.1]]],["H",[[-255.0,-69.3],[-37.6,-99.9],[-22.4,7.0],[-239.7,37.6],[-242.7,22.6],[-249.4,-0.3],[-251.5,-10.1],[-252.5,-20.3],[-252.1,-40.4],[-252.3,-47.8],[-252.9,-54.4]]],["S",[[-239.7,37.6],[-22.4,7.0],[-17.1,43.6],[-234.8,74.3]]],["H",[[-234.8,74.3],[-17.1,43.6],[-1.8,150.4],[-219.5,181.2],[-221.6,166.3],[-223.0,159.7],[-224.8,152.6],[-230.8,133.4],[-232.7,123.3],[-233.5,113.3],[-233.4,89.4]]],["H",[[6.2,-106.5],[224.7,-136.9],[226.8,-122.0],[228.1,-115.5],[229.9,-108.3],[235.9,-89.1],[237.9,-79.1],[238.7,-69.0],[238.6,-45.2],[240.0,-30.0],[21.5,0.6]]],["S",[[21.5,0.6],[240.0,-30.0],[245.5,6.6],[26.7,37.4]]],["K",[[-118.9,853.0],[-6.2,837.1],[-23.9,840.5],[-45.3,847.9],[-60.4,851.7],[-74.5,852.9],[-106.2,852.5]]],["K",[[240.1,801.9],[353.8,786.1],[339.3,789.7],[309.0,798.9],[295.1,801.7],[279.6,802.2],[257.0,801.0]]],["K",[[-293.7,-341.8],[-265.7,-349.0],[-251.2,-353.8],[-237.9,-357.0],[-231.0,-358.2],[-223.7,-358.8],[-200.3,-358.2],[-184.0,-359.2],[-177.1,-360.4],[-169.3,-362.5],[-147.1,-369.7],[-131.9,-372.6],[-115.8,-373.5],[-84.8,-372.0],[-76.2,-372.2]]],["K",[[-32.4,-378.9],[-13.5,-384.0],[8.7,-391.3],[24.4,-394.9],[39.8,-396.3],[63.1,-395.4],[71.2,-395.5],[78.2,-396.3],[86.1,-397.8],[94.1,-399.8],[116.8,-406.8],[124.0,-408.3],[130.5,-409.0],[144.2,-409.5],[168.6,-408.4],[186.0,-409.4]]],["K",[[-101.4,-861.1],[-93.2,-869.2],[-85.4,-871.4],[-63.2,-878.6],[-47.5,-882.2],[-32.1,-883.6],[-8.7,-882.7],[-0.7,-882.8],[6.3,-883.6],[22.2,-887.1],[44.9,-894.1],[52.2,-895.6],[65.8,-896.8],[72.4,-896.9],[87.7,-896.2],[96.6,-896.4],[116.7,-891.5]]],["H",[[-101.4,-861.1],[116.7,-891.5],[117.6,-883.0],[118.9,-876.5],[120.7,-869.3],[126.7,-850.2],[128.7,-840.1],[129.4,-830.0],[129.4,-806.2],[130.7,-791.0],[-87.5,-761.2]]],["S",[[-87.5,-761.2],[130.7,-791.0],[136.3,-754.4],[-82.0,-723.1]]],["H",[[-82.0,-723.1],[136.3,-754.4],[139.2,-739.5],[146.0,-716.6],[148.1,-706.7],[149.1,-696.5],[148.6,-676.4],[148.9,-669.0],[149.5,-662.4],[151.6,-647.5],[-66.9,-617.5]]],["X",[[-361.5,-822.6],[-144.9,-852.6],[-110.9,-612.0],[-327.7,-579.9],[-332.1,-606.8],[-346.0,-682.4],[-351.6,-721.3],[-353.3,-738.7],[-354.5,-760.6],[-356.6,-785.8],[-360.6,-814.1]]],["K",[[-361.5,-822.6],[-344.7,-832.7],[-336.1,-835.0],[-321.5,-839.8],[-315.2,-841.5],[-301.3,-844.2],[-294.1,-844.8],[-270.6,-844.2],[-262.4,-844.4],[-254.4,-845.2],[-247.4,-846.3],[-239.7,-848.5],[-217.5,-855.7],[-202.3,-858.6],[-186.2,-859.4],[-162.8,-858.5],[-154.7,-858.6],[-144.9,-852.6]]]];
const circ = u => Math.sqrt(Math.max(0, 1 - Math.pow(1 - Math.min(1, u), 2)));
LANDMARKS.szworld = {zh:'深圳国际会展中心', en:'Shenzhen World Exhibition & Convention Center', cat:'new', r:920, h:24,
  lt:{m:1, c:'#e8eef6', k:0.4, fh:5.5, cw:3.5},
  build(){
    const g = new THREE.Group(), B = new Bat();
    const roof = B.a({c:'#42508c'}), wall = B.a({c:'#c5cdd2', m:1, fh:5.5, cw:3.5}), glass = B.a({c:'#a3bccb', glow:'#fff0d2', gk:0.45}),
      flat = B.a({c:'#c6cacc'}), wsolid = B.a({c:'#cfd2d2', m:0}), oval = B.a({c:'#b9cad4', glow:'#fff2da', gk:0.25});
    const HF = {
      H:(x, z, d) => 12.5 + 5.5*circ(d/40) + 1.0*Math.sin(x*0.045 + z*0.012)*circ(d/30),
      X:(x, z, d) => 13 + 7*circ(d/60) + 1.0*Math.sin(x*0.04 + z*0.012)*circ(d/30),
      C:(x, z, d) => 14 + 4.5*circ(d/11),
      E:(x, z, d) => 10 + 12*circ(d/70),
      L:() => 8, S:() => 12, K:() => 11};
    for (const [t, R] of SZW){
      const hf = HF[t];
      if (t === 'L' || t === 'S' || t === 'K'){ const y = hf(); wallsT(t === 'S' ? wsolid : wall, R, -1, y); flatT(flat, R, y); continue; }
      // the corridor bridges the local road at z -413 / -455 (OSM, at grade): open underneath there, soffit at 8 m
      const over = (x, z) => t === 'C' && z > -476 && z < -394;
      pillow(t === 'C' ? glass : t === 'E' ? oval : roof, wall, R, t === 'C' ? 5 : 9, hf, (x, z) => over(x, z) ? 8 : -1);
      if (t === 'C'){ const S = clipSq(R, -1e4, -476, 1e4, -394); if (S.length > 2) flatT(flat, S, 8); }
    }
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'szworld', lat:22.701069, lon:113.769362, rot:0});
// ================================================================================================ Bao'an Stadium (szbaoanstadium)
// gmp (von Gerkan, Marg and Partners), 2011, 40 050 seats: 245.8 x 245.8 m, 39.65 m high. A double row of slim green steel tubes
// ("bamboo forest", up to 32 m long, 55-80 cm across) rings the stands; a membrane roof 230 m across, cantilevered 54 m, stretched
// over arched supports into a bubbled surface and hung from 36 pairs of cables gathered by a double tension ring above the pitch;
// a lower tier and an undulating concrete upper tier (dezeen / gmp text). OSM r9249893: a 243 m round footprint.
// Estimated: the 6 m podium (the 32 m tubes reach the 38 m roof ring from it), tier levels, column count (2 x 96).
LANDMARKS.szbaoanstadium = {zh:'宝安体育场', en:"Bao'an Stadium", cat:'new', r:128, h:39.65,
  lt:{m:0, c:'#f1f8ff', k:0.65, e:0.55},
  build(){
    const g = new THREE.Group(), B = new Bat(), rng = LMCTX.rng;
    const conc = B.a({c:'#cdcac2'}), seat = B.a({c:'#8e9aa6'}), seat2 = B.a({c:'#a6b0b8'}), memb = B.a({c:'#f4f3ee'}), steel = B.a({c:'#d9dcdc'}),
      green = B.a({c:'#5f9a3a'}), cable = B.a({c:'#b4b8ba'}), pod = B.a({c:'#bdb9b0'}), grass = B.a({c:'#5b8f45'}), apron = B.a({c:'#7d8c72'});
    const N = 72, ri = t => { const a = 71, b = 57, c = Math.cos(t), s = Math.sin(t); return a*b/Math.sqrt((b*c)*(b*c) + (a*s)*(a*s)); };
    const P = (t, r, y) => [Math.cos(t)*r, y, Math.sin(t)*r];
    // pitch and apron
    const ell = []; for (let k = 0; k < N; k++){ const t = k/N*TAU; ell.push([Math.cos(t)*ri(t), Math.sin(t)*ri(t)]); }
    flatT(apron, ell, 0.25); flatT(grass, [[-52.5, -34], [52.5, -34], [52.5, 34], [-52.5, 34]], 0.32);
    // bowl: lower tier, gallery wall, undulating upper tier, back wall (r 106)
    const upTop = t => 31 + 2.6*Math.cos(2*t);
    for (let k = 0; k < N; k++){
      const t0 = k/N*TAU, t1 = (k + 1)/N*TAU;
      const S = (t) => { const r0 = ri(t), u = upTop(t); return [[r0, 1.0], [r0 + 0.30*(106 - r0), 13.5], [r0 + 0.30*(106 - r0), 16.2], [r0 + 0.36*(106 - r0), 17], [106, u], [106, u + 1.2]]; };
      const A = S(t0), C = S(t1);
      for (let i = 0; i < A.length - 1; i++) quad(i < 2 ? seat : i === 3 ? seat2 : conc, P(t0, A[i][0], A[i][1]), P(t1, C[i][0], C[i][1]), P(t1, C[i + 1][0], C[i + 1][1]), P(t0, A[i + 1][0], A[i + 1][1]));
      quad(conc, P(t0, 106, 6), P(t1, 106, 6), P(t1, 106, upTop(t1) + 1.2), P(t0, 106, upTop(t0) + 1.2));
      // podium ring r 99-121.5 at 6 m
      quad(pod, P(t0, 99, 6), P(t1, 99, 6), P(t1, 121.5, 6), P(t0, 121.5, 6)); quad(pod, P(t0, 121.5, 0), P(t1, 121.5, 0), P(t1, 121.5, 6), P(t0, 121.5, 6));
      quad(pod, P(t0, ri(t0) - 0.2, 0), P(t1, ri(t1) - 0.2, 0), P(t1, ri(t1) - 0.2, 1.0), P(t0, ri(t0) - 0.2, 1.0));
    }
    // roof: membrane bays between 36 radial cable pairs, bulging between them; outer ring (r 115) and inner tension ring (r 61)
    const NB = 36, RI = 61, RO = 115, yI = 32.6, yO = 37.6;
    const ym = (t, r) => { const f = (r - RI)/(RO - RI), ph = (t/TAU*NB) % 1; return yI + (yO - yI)*f + 2.4*Math.sin(PI*ph)*Math.sin(PI*f); };
    for (let k = 0; k < NB*4; k++){
      const t0 = k/(NB*4)*TAU, t1 = (k + 1)/(NB*4)*TAU;
      for (let j = 0; j < 6; j++){ const r0 = RI + (RO - RI)*j/6, r1 = RI + (RO - RI)*(j + 1)/6;
        quad(memb, P(t0, r0, ym(t0, r0)), P(t0, r1, ym(t0, r1)), P(t1, r1, ym(t1, r1)), P(t1, r0, ym(t1, r0))); }
    }
    const ringT = (r, y, w, h, col) => { for (let k = 0; k < 96; k++){ const t0 = k/96*TAU, t1 = (k + 1)/96*TAU; bar(col, P(t0, r, y), P(t1, r, y), w, h); } };
    ringT(RO, 38.5, 2.2, 2.3, steel); ringT(RO - 2, 36.2, 1.2, 1.2, steel);
    ringT(RI, yI, 0.8, 0.8, cable); ringT(RI, yI - 3.2, 0.8, 0.8, cable);
    for (let k = 0; k < NB; k++){ const t = k/NB*TAU; bar(cable, P(t, RO, 39.4), P(t, RI, yI + 0.2), 0.3, 0.3); bar(cable, P(t, RO - 2, 35.6), P(t, RI, yI - 3.2), 0.3, 0.3);
      bar(steel, P(t, RI + 2, yI + 0.4), P(t, RO - 1, yO + 0.4), 0.35, 0.9); }
    // the bamboo forest: two rows of slim green tubes from the podium to the roof ring, slightly out of plumb
    for (const [r, n, top] of [[110.5, 96, 37.4], [117.8, 96, 39.4]]) for (let k = 0; k < n; k++){
      const t = (k + (r > 115 ? 0.5 : 0) + (rng() - 0.5)*0.35)/n*TAU, lean = (rng() - 0.5)*0.06, d = 0.55 + rng()*0.25;
      const b = P(t, r + (rng() - 0.5)*1.5, 6), tp = P(t + lean*0.3, r + lean*8, top - rng()*1.5);
      tube(green, b, tp, d/2, 6);
    }
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'szbaoanstadium', lat:22.560972, lon:113.876322, rot:0});
// ================================================================================================ Bay Glory (szbayglory)
// Opened 18 Apr 2021 at OH Bay: 128 m high, a 113.3 m wheel with 28 ellipsoid all-glass gondolas (16.8 m2, up to 25 people),
// cantilevered from a fish-fin shaped frame (鱼鳍状异形大立架); pure white, multicoloured LED lights at night (Wikipedia; ourchinastory).
// The fin stands on its OSM footprint w914175455 (a 37 m teardrop, blunt end east); the wheel turns in the fin's plane (x-y), hung
// on its north side (the side is not verified), hub at 66.5 m so that the top gondola reaches 128 m.
LANDMARKS.szbayglory = {zh:'湾区之光摩天轮', en:'Bay Glory Ferris Wheel', cat:'new', r:70, h:128,
  lt:{m:0, c:'#f2f6ff', k:0.5, e:0.6, anim:'cycle', c2:'#9fd6ff'},
  build(){
    const g = new THREE.Group(), B = new Bat();
    const white = B.a({c:'#f3f3f1'}), rimc = B.a({c:'#f1f1ef', m:2, lk:1.25}), cab = B.a({c:'#cfe2ee', glow:'#eaf4ff', gk:0.55}), wire = B.a({c:'#c9cccc'}), dark = B.a({c:'#9aa3aa'});
    const FP = [[-22.7,7.9],[-20.9,5.4],[-10.5,-3.3],[-1.0,-10.1],[7.1,-15.1],[9.7,-16.1],[11.8,-16.4],[13.2,-15.4],[14.3,-11.3],[14.4,-0.3],[13.7,4.7],[12.4,9.3],[11.4,10.0],[-20.8,10.3],[-22.0,9.8]];
    const HUB = 66.5, ZW = -24, R = 56.65, zc = -3;
    // fin: lofted through shrinking copies of the footprint, its back edge sweeping up and forward to the hub
    const lev = [0, 10, 22, 34, 46, 56, 64, 72];
    const secs = lev.map(y => { const f = y/72, xb = -22.7 + 21*Math.pow(f, 1.25), xf = 14.4 - 11*f*f, th = 1 - 0.72*f;
      return FP.map(([x, z]) => [xb + (x + 22.7)/37.1*(xf - xb), y, zc + (z - zc)*th]); });
    for (let i = 0; i < secs.length - 1; i++) for (let k = 0; k < FP.length; k++){ const k2 = (k + 1) % FP.length; quad(white, secs[i][k], secs[i][k2], secs[i + 1][k2], secs[i + 1][k]); }
    capT(white, secs[secs.length - 1]);
    // axle from the fin to the hub, hub
    tube(white, [-1, HUB, zc], [-1, HUB, ZW - 7], 3.2, 12);
    tube(dark, [-1, HUB, ZW - 7], [-1, HUB, ZW - 8.5], 2.4, 12);
    // rim: two box rings 3.2 m apart (z), laced; LED on the rim
    const P = (a, r, z) => [-1 + Math.cos(a)*r, HUB + Math.sin(a)*r, z];
    const NS = 112;
    for (let k = 0; k < NS; k++){ const a0 = k/NS*TAU, a1 = (k + 1)/NS*TAU;
      for (const z of [ZW - 1.6, ZW + 1.6]){ bar(rimc, P(a0, R, z), P(a1, R, z), 0.9, 1.4); bar(white, P(a0, R - 3.2, z), P(a1, R - 3.2, z), 0.6, 0.8); }
      bar(white, P(a0, R, ZW - 1.6), P(a1, R - 3.2, ZW + 1.6), 0.25, 0.25); bar(white, P(a0, R - 3.2, ZW - 1.6), P(a0, R, ZW - 1.6), 0.3, 0.3);
    }
    // spoke cables from both hub ends
    for (let k = 0; k < 56; k++){ const a = k/56*TAU; bar(wire, [-1, HUB, ZW - 6], P(a, R - 3.2, ZW - 1.6), 0.12, 0.12); bar(wire, [-1, HUB, ZW + 3], P(a, R - 3.2, ZW + 1.6), 0.12, 0.12); }
    // gondolas outside the rim
    for (let k = 0; k < 28; k++){ const a = k/28*TAU + 0.05, p = P(a, R + 3.3, ZW); LSph(g, 2.5, p[0], p[1], p[2], {c:'#d6e6f0', glow:'#eef6ff', gk:0.6}, 0.84, 10);
      bar(white, P(a, R + 0.6, ZW), P(a, R + 1.2, ZW), 0.6, 0.6); }
    // boarding platform under the wheel
    boxT(dark, -1, 0, ZW, 30, 3.8, 14); boxT(white, -1, 3.8, ZW, 32, 0.6, 16);
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'szbayglory', lat:22.54425, lon:113.883072, rot:0});

// ================================================================================================ Eyes of the GBA (szbayeye)
// Bay Area Book City at OH Bay: two low halls (OSM w1362742673 north, w1362742674 south), each with a C-shaped court opening east
// ("the eyes", seen from the air), and the link block between them (w1362742675). Two storeys above ground (two below), opened
// 26 Sep 2025, a rooftop garden of over 20 000 m2 open day and night (ourchinastory). Storey height estimated (roof ~12-14 m).
LANDMARKS.szbayeye = {zh:'湾区之眼（深圳书城湾区城）', en:'Eyes of the GBA (Bay Area Book City)', cat:'new', r:200, h:14,
  lt:{m:1, c:'#ffe9c8', k:0.45, fh:5, cw:3},
  build(){
    const g = new THREE.Group(), B = new Bat();
    const N = [[-55.1,-50.4],[-54.0,-101.5],[-47.2,-101.2],[-40.6,-92.8],[-31.4,-85.1],[-20.9,-79.4],[-11.7,-77.0],[-0.6,-75.7],[9.5,-76.8],[18.5,-79.5],[22.7,-81.4],[23.6,-82.8],[23.8,-84.7],[23.0,-86.4],[21.2,-87.2],[19.4,-87.1],[14.0,-85.1],[6.3,-83.7],[-0.7,-83.9],[-8.3,-85.5],[-14.3,-88.0],[-19.9,-91.4],[-24.8,-95.7],[-28.9,-100.7],[-32.1,-106.3],[-34.4,-112.4],[-35.6,-118.7],[-35.7,-125.2],[-34.8,-131.6],[-32.8,-137.8],[-29.9,-143.5],[-26.0,-148.7],[-21.3,-153.2],[-15.9,-156.9],[-7.1,-160.5],[2.3,-162.0],[11.8,-161.2],[20.8,-158.1],[23.6,-157.9],[25.3,-158.8],[25.9,-160.9],[25.2,-163.0],[23.4,-164.4],[13.6,-167.4],[2.9,-168.9],[-9.2,-168.3],[-19.5,-165.6],[-27.4,-162.4],[-34.5,-157.9],[-42.4,-150.0],[-46.9,-142.2],[-53.1,-142.4],[-52.1,-190.3],[55.4,-188.0],[52.3,-48.1]], S = [[-63.2,147.0],[-62.1,104.4],[-46.1,104.7],[-39.4,115.9],[-34.6,121.2],[-29.0,125.6],[-22.8,129.2],[-16.0,131.6],[-4.9,133.2],[6.3,131.9],[14.8,128.6],[15.5,126.3],[15.0,124.3],[14.0,123.3],[12.2,123.0],[7.1,124.2],[-0.2,124.5],[-7.4,123.4],[-14.2,120.8],[-20.4,117.0],[-25.6,112.0],[-29.8,106.0],[-32.7,99.4],[-34.1,92.3],[-34.1,85.1],[-32.7,78.0],[-29.9,71.3],[-25.0,64.5],[-18.6,59.0],[-11.2,55.1],[-3.0,53.0],[5.4,52.8],[11.7,54.0],[15.8,55.3],[17.8,53.8],[18.2,52.3],[17.9,51.0],[14.7,48.7],[9.4,47.1],[1.2,46.1],[-9.1,46.6],[-18.8,49.3],[-27.3,52.5],[-34.4,57.4],[-39.2,62.7],[-43.1,68.7],[-45.7,74.1],[-61.3,73.7],[-60.2,30.5],[50.6,33.3],[47.6,149.8]], L = [[-40.0,31.1],[-38.1,-50.1],[-4.8,-49.3],[-6.7,31.8]];
    const roof = B.a({c:'#86a56c'}), wall = B.a({c:'#a8bac6', m:1, fh:5, cw:3}), edge = B.a({c:'#d8d6cf'});
    const hf = (x, z, d) => 10.5 + 3.2*circ(d/22);
    for (const R of [N, S]){ pillow(roof, wall, R, 4, hf, -1); }
    wallsT(wall, L, -1, 11.5); flatT(roof, L, 11.5);
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'szbayeye', lat:22.550556, lon:113.879393, rot:0});
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
const XIW = {"keep":[[-457.4,-680.1],[-451.1,-665.7],[-452.5,-653.1],[-454.0,-643.7],[-452.9,-633.9],[-447.8,-625.1],[-437.8,-618.9],[-428.2,-616.0],[-419.9,-609.7],[-407.4,-588.8],[-400.0,-572.6],[-374.0,-515.7],[-371.7,-506.1],[-370.7,-497.1],[-371.4,-486.4],[-385.8,-480.0],[-371.2,-445.2],[-368.3,-438.3],[-362.2,-423.4],[-359.7,-405.8],[-374.6,-399.5],[-372.4,-394.5],[-357.6,-400.7],[-355.6,-396.2],[-353.6,-392.4],[-360.3,-387.3],[-358.1,-382.3],[-359.5,-370.7],[-351.4,-367.1],[-339.7,-378.4],[-332.7,-376.9],[-330.8,-361.9],[-331.5,-345.9],[-331.4,-332.5],[-328.6,-318.7],[-321.5,-304.9],[-310.1,-294.8],[-297.1,-287.9],[-282.2,-283.9],[-34.6,164.0],[90.7,391.6],[191.4,555.3],[289.9,719.0],[295.0,738.6],[294.9,754.2],[292.5,774.9],[283.9,814.1],[271.3,851.6],[80.1,1145.8],[45.3,1194.7],[32.5,1224.0],[35.7,1256.3],[45.6,1276.0],[56.9,1264.6],[58.7,1264.8],[61.3,1265.0],[62.5,1249.5],[69.5,1212.6],[75.0,1190.9],[83.8,1170.3],[95.9,1147.6],[112.1,1123.2],[280.7,877.1],[290.9,861.2],[299.0,845.5],[305.7,831.6],[314.4,809.9],[320.6,791.6],[326.5,769.8],[331.4,736.9],[331.6,709.4],[328.9,686.1],[326.2,667.9],[320.2,642.5],[313.7,623.8],[304.1,600.4],[282.9,562.7],[251.4,513.9],[244.2,504.9],[216.9,474.5],[171.6,418.2],[152.7,383.1],[139.1,363.0],[127.8,347.8],[115.0,327.8],[67.6,251.1],[48.1,217.0],[38.5,177.4],[7.3,98.5],[-8.9,53.0],[-26.0,-2.7],[-36.9,-47.0],[-43.7,-85.3],[-54.9,-168.1],[-60.9,-219.2],[-93.6,-495.5],[-109.4,-611.4],[-119.0,-662.6],[-129.7,-708.0],[-139.6,-742.2],[-146.0,-773.1],[-164.5,-806.5],[-178.1,-802.5],[-457.4,-680.1]],"rings":[[[-457.4,-680.1],[-451.1,-665.7],[-452.5,-653.1],[-454.0,-643.7],[-452.9,-633.9],[-447.8,-625.1],[-437.8,-618.9],[-428.2,-616.0],[-419.9,-609.7],[-407.4,-588.8],[-400.0,-572.6],[-374.0,-515.7],[-371.7,-506.1],[-370.7,-497.1],[-371.4,-486.4],[-385.8,-480.0],[-371.2,-445.2],[-368.3,-438.3],[-362.2,-423.4],[-359.7,-405.8],[-374.6,-399.5],[-372.4,-394.5],[-357.6,-400.7],[-355.6,-396.2],[-353.6,-392.4],[-360.3,-387.3],[-358.1,-382.3],[-359.5,-370.7],[-351.4,-367.1],[-339.7,-378.4],[-332.7,-376.9],[-330.8,-361.9],[-331.5,-345.9],[-331.4,-332.5],[-328.6,-318.7],[-321.5,-304.9],[-310.1,-294.8],[-297.1,-287.9],[-282.2,-283.9],[-34.6,164.0],[90.7,391.6],[191.4,555.3],[289.9,719.0],[295.0,738.6],[294.9,754.2],[292.5,774.9],[283.9,814.1],[271.3,851.6],[80.1,1145.8],[45.3,1194.7],[32.5,1224.0],[35.7,1256.3],[45.6,1276.0],[56.9,1264.6],[58.7,1264.8],[61.3,1265.0],[62.5,1249.5],[69.5,1212.6],[75.0,1190.9],[83.8,1170.3],[95.9,1147.6],[112.1,1123.2],[280.7,877.1],[290.9,861.2],[299.0,845.5],[305.7,831.6],[314.4,809.9],[320.6,791.6],[326.5,769.8],[331.4,736.9],[331.6,709.4],[328.9,686.1],[326.2,667.9],[320.2,642.5],[313.7,623.8],[304.1,600.4],[282.9,562.7],[251.4,513.9],[244.2,504.9],[216.9,474.5],[171.6,418.2],[152.7,383.1],[139.1,363.0],[127.8,347.8],[115.0,327.8],[67.6,251.1],[48.1,217.0],[38.5,177.4],[7.3,98.5],[-8.9,53.0],[-26.0,-2.7],[-36.9,-47.0],[-43.7,-85.3],[-54.9,-168.1],[-60.9,-219.2],[-93.6,-495.5],[-109.4,-611.4],[-119.0,-662.6],[-129.7,-708.0],[-139.6,-742.2],[-146.0,-773.1],[-164.5,-806.5],[-178.1,-802.5],[-457.4,-680.1]],[[207.0,371.4],[214.1,382.1],[297.9,503.9],[312.3,524.3],[325.3,544.9],[335.8,564.6],[343.1,579.9],[350.7,598.7],[357.5,617.4],[362.4,635.0],[365.5,649.3],[369.0,669.2],[370.9,674.1],[375.4,684.6],[377.1,690.1],[377.5,708.4],[377.4,713.5],[378.6,717.9],[382.5,721.8],[387.8,723.0],[394.1,723.1],[399.5,720.4],[409.2,713.9],[423.4,703.4],[439.8,689.8],[461.3,667.6],[479.8,645.5],[416.7,596.0],[467.0,528.0],[321.2,419.5],[294.4,398.8],[253.1,366.6],[234.1,353.9],[207.0,371.4]],[[361.5,770.9],[362.5,777.1],[370.7,794.8],[483.4,980.9],[488.0,984.3],[493.8,983.4],[557.4,906.2],[464.6,830.7],[605.0,640.6],[537.2,590.1],[484.9,664.9],[469.9,684.6],[453.5,701.3],[436.3,716.1],[422.2,725.8],[398.1,740.2],[375.5,752.3],[371.4,754.6],[364.9,759.0],[362.9,762.6],[361.5,766.6],[361.5,770.9]]],"paths":[[[249.7,910.0],[274.8,873.6],[297.9,832.2],[307.4,807.0],[308.9,797.3]],[[289.1,697.9],[282.0,702.3]],[[317.0,743.1],[309.8,728.2],[299.4,713.1],[289.1,697.9],[277.3,678.7],[265.5,659.5],[253.7,640.3],[241.9,621.0],[230.2,601.8],[218.4,582.6],[206.6,563.4],[194.8,544.1],[183.0,524.9],[171.2,505.7],[162.9,496.1],[157.1,483.5],[146.5,466.3],[135.9,449.2],[125.2,432.0],[114.6,414.8],[105.7,404.3],[96.8,393.8],[88.6,370.6],[79.4,353.3],[70.3,336.0],[58.4,314.5],[46.4,293.0],[34.5,271.4],[22.6,249.9],[10.7,228.4],[-1.2,206.9],[-13.1,185.4],[-25.0,163.9],[-36.9,142.4],[-48.8,120.8],[-60.8,99.3],[-72.7,77.8],[-84.6,56.3],[-96.5,34.8],[-108.4,13.3],[-120.3,-8.2],[-132.2,-29.8],[-144.1,-51.3],[-156.0,-72.8],[-168.0,-94.3],[-179.9,-115.8],[-190.7,-136.4],[-201.6,-157.0],[-212.4,-177.7],[-223.3,-198.3],[-234.1,-218.9],[-245.0,-239.5],[-255.8,-260.1],[-265.8,-275.2],[-275.7,-290.3],[-291.0,-298.6],[-306.4,-307.0],[-317.3,-321.6],[-320.4,-338.7],[-317.1,-360.2],[-319.4,-372.6],[-327.9,-393.9],[-336.3,-415.2],[-344.7,-436.5]],[[-22.2,168.8],[1.2,186.8],[3.9,214.7]],[[-99.9,28.6],[-67.3,58.4],[-59.2,102.5]],[[-189.6,-165.9],[-179.9,-115.8]],[[-189.6,-165.9],[-225.4,-200.0]],[[114.6,414.8],[109.5,386.6],[88.6,370.6]],[[267.5,640.0],[279.6,641.8],[297.3,638.3],[301.6,635.2],[303.5,627.3],[301.6,617.9],[292.1,608.0],[271.1,598.2],[272.5,565.1],[270.0,554.8],[265.9,549.8],[259.5,546.1],[249.6,543.6],[243.4,539.9],[231.1,529.5],[227.4,521.5],[225.5,499.7],[221.9,495.9],[208.3,490.2],[201.2,484.6],[197.4,462.6],[193.7,457.0],[180.2,450.7],[173.7,436.6],[170.4,433.4],[156.4,428.8],[153.3,426.2],[150.2,411.3]],[[201.2,484.6],[179.9,498.9]],[[239.2,536.8],[241.2,550.6],[238.2,568.1],[239.8,578.9],[249.2,590.0],[255.0,593.5],[271.1,598.2]],[[240.2,560.7],[243.2,554.2],[248.1,549.3],[259.5,546.1]],[[-273.9,-319.7],[-273.5,-307.1],[-257.7,-272.6],[-255.8,-260.1]],[[-291.5,-354.3],[-301.8,-360.3],[-317.8,-385.2],[-325.3,-390.0]],[[-352.8,-457.5],[-357.7,-470.9],[-362.6,-484.3],[-364.6,-497.4],[-366.6,-510.5],[-376.9,-533.2],[-387.3,-555.9],[-392.5,-567.2],[-393.5,-569.6],[-397.6,-578.6],[-408.0,-601.3],[-416.2,-613.5],[-424.4,-625.7],[-430.2,-642.5],[-436.0,-659.2],[-441.8,-675.9]],[[-415.3,-646.3],[-408.0,-601.3]],[[-151.5,-397.6],[-209.8,-404.1],[-219.7,-401.2],[-227.1,-393.3],[-230.0,-383.5],[-230.1,-375.1],[-223.3,-353.5],[-218.7,-306.7],[-223.1,-303.0],[-224.4,-296.6],[-218.8,-277.8],[-213.8,-268.4],[-198.7,-256.3],[-195.0,-248.9],[-183.0,-217.0],[-170.8,-197.7],[-168.2,-179.4],[-164.1,-169.4],[-158.8,-163.8],[-129.7,-145.5],[-123.7,-136.5],[-112.7,-102.9],[-116.8,-89.7],[-115.9,-83.8]],[[-53.4,12.5],[-44.1,37.8],[-27.2,61.7],[-20.5,82.0],[-19.0,95.5],[-20.2,103.0],[-25.3,116.0],[-31.8,126.2]],[[-125.9,-318.2],[-147.0,-300.8],[-151.0,-295.0],[-154.2,-280.4],[-153.6,-271.9],[-149.3,-259.8],[-128.9,-227.0],[-130.2,-217.8],[-145.8,-180.8],[-138.0,-150.5],[-138.5,-130.3],[-137.1,-125.1],[-131.0,-118.4],[-115.1,-113.6]],[[-94.2,-184.9],[-106.6,-177.8],[-114.4,-175.4],[-189.6,-165.9]],[[-75.7,-37.2],[-65.7,-39.3]],[[-112.7,-102.9],[-89.4,-109.4],[-84.1,-112.6],[-79.2,-120.6],[-80.7,-127.6],[-89.4,-138.5],[-88.0,-146.7],[-59.8,-162.5]],[[-128.9,-227.0],[-99.4,-219.9]],[[-151.0,-295.0],[-160.1,-302.2],[-162.8,-313.9],[-162.2,-319.6],[-151.8,-334.6],[-150.9,-338.6],[-153.7,-353.2],[-152.1,-361.1],[-147.3,-365.8],[-134.1,-370.2]],[[-162.8,-313.9],[-186.0,-311.6]],[[-191.2,-309.7],[-218.7,-306.7]],[[-41.0,-38.0],[-47.7,-54.0]],[[-36.2,-2.1],[-31.3,-3.2],[-28.3,10.0],[-25.2,23.3],[-27.9,36.7],[-35.1,48.8]],[[-44.1,37.8],[-69.8,53.6]],[[-265.9,-447.2],[-261.2,-433.7],[-251.3,-419.2],[-239.7,-409.3],[-219.7,-401.2]],[[-160.6,-113.5],[-137.1,-125.1]],[[-67.4,-81.0],[-88.4,-79.2],[-103.1,-71.8]],[[-267.0,-523.3],[-267.3,-509.5],[-267.6,-495.7]],[[-351.4,-612.1],[-333.9,-616.5],[-313.8,-631.4],[-295.9,-630.9],[-286.5,-634.2],[-273.0,-646.3],[-259.4,-663.5],[-240.0,-669.1],[-224.2,-687.5],[-214.8,-693.7],[-202.5,-696.5],[-195.4,-696.1],[-187.2,-694.3],[-176.7,-689.0],[-166.7,-676.9],[-150.1,-643.3],[-138.9,-611.6],[-130.5,-576.4],[-113.1,-546.2],[-97.7,-392.5]],[[-376.5,-657.2],[-415.3,-646.3]],[[-324.7,-529.4],[-351.6,-513.9]],[[-115.9,-83.8],[-80.5,-48.8],[-75.7,-37.2],[-72.8,-10.3],[-64.6,3.1],[-53.4,12.5]],[[-198.7,-256.3],[-188.8,-264.4],[-173.2,-270.7],[-151.7,-265.6]],[[-115.9,-83.8],[-138.0,-72.2]],[[-303.9,-328.3],[-228.8,-367.2],[-186.5,-385.2],[-132.3,-404.5]],[[-87.7,-391.4],[-118.2,-395.6],[-125.1,-398.1],[-132.3,-404.5],[-133.8,-409.2],[-131.7,-419.4],[-125.0,-427.4],[-111.0,-436.0],[-93.6,-443.0]],[[-125.1,-398.1],[-134.1,-370.2],[-136.1,-356.1],[-134.2,-341.3],[-129.8,-325.5],[-106.5,-288.2],[-96.9,-254.5],[-96.5,-234.6],[-101.0,-210.5],[-97.8,-192.5],[-74.5,-155.0],[-71.2,-145.0],[-66.6,-117.8],[-67.0,-47.5],[-63.8,-34.3],[-53.1,-14.6],[-50.7,-5.5],[-53.4,12.5]],[[-160.2,-560.0],[-172.7,-551.8],[-192.0,-552.9],[-219.0,-538.6],[-245.5,-537.9],[-269.2,-544.9],[-280.3,-540.7],[-284.9,-533.8]],[[-284.9,-533.8],[-310.9,-525.4],[-320.8,-526.1],[-324.7,-529.4],[-325.5,-544.8],[-330.6,-555.6],[-331.8,-569.7],[-337.0,-579.9],[-346.0,-588.2],[-349.4,-608.1],[-368.2,-632.2],[-374.7,-648.7],[-376.5,-657.2],[-367.2,-682.0],[-359.6,-691.8],[-351.6,-698.4],[-331.4,-706.8],[-283.5,-709.8],[-266.1,-716.4],[-246.4,-728.3],[-219.2,-751.8],[-205.8,-757.8],[-186.3,-760.1],[-146.5,-752.0]],[[-150.1,-643.3],[-165.7,-632.1],[-181.8,-625.1],[-196.6,-622.1],[-211.3,-622.9],[-231.6,-631.9],[-244.5,-643.1],[-246.7,-649.1],[-246.9,-666.4]],[[-273.0,-646.3],[-261.9,-634.0],[-252.6,-610.3],[-249.5,-606.2],[-239.5,-600.5],[-229.4,-599.8],[-202.0,-602.8],[-185.0,-599.5],[-175.3,-600.4],[-172.8,-602.7],[-171.1,-609.3],[-173.4,-628.0]],[[-216.4,-624.2],[-219.4,-602.0]],[[-196.6,-622.1],[-197.4,-602.4]],[[-430.1,-684.3],[-408.1,-693.9],[-386.1,-703.5],[-364.1,-713.0],[-342.0,-722.6],[-320.1,-732.2],[-320.0,-732.2],[-298.0,-741.8],[-275.9,-751.3],[-253.9,-760.9],[-231.9,-770.5],[-209.9,-780.1],[-187.8,-789.6],[-165.8,-799.2]],[[-383.9,-704.4],[-379.8,-683.9],[-373.5,-678.4],[-369.6,-677.8]],[[-254.9,-722.5],[-255.8,-735.5],[-263.0,-757.1]],[[-346.0,-588.2],[-359.8,-579.8],[-378.5,-573.3]],[[-79.2,-120.6],[-66.6,-117.8]],[[-87.9,-134.7],[-102.1,-131.2],[-121.2,-130.8]],[[-96.9,-132.0],[-100.3,-106.8]],[[316.3,748.4],[309.7,792.8]],[[-313.8,-631.4],[-322.2,-641.5],[-323.7,-653.9],[-319.9,-663.8],[-307.8,-675.6],[-301.0,-687.2],[-300.3,-707.9]],[[-283.5,-709.8],[-277.5,-695.9]],[[-316.8,-667.0],[-309.6,-660.4],[-305.6,-653.1],[-302.0,-630.2]],[[-119.4,-558.8],[-136.4,-553.7],[-148.6,-554.8],[-160.2,-560.0],[-167.2,-567.8],[-180.4,-576.2],[-189.7,-579.0],[-203.8,-579.5],[-220.3,-573.7],[-230.1,-565.6],[-248.2,-534.0],[-259.1,-524.3],[-262.8,-523.1],[-271.0,-524.5],[-284.9,-533.8]],[[-189.9,-238.1],[-177.4,-240.2]],[[325.7,760.1],[322.4,774.6],[319.1,789.2],[312.3,809.2],[304.1,830.4],[296.5,845.3],[288.9,860.1],[275.2,880.0],[261.5,899.9]],[[316.5,741.2],[319.8,741.7],[318.3,755.2],[326.2,757.3]],[[319.1,789.2],[316.0,788.3],[309.9,805.2],[307.4,807.0]],[[-415.3,-646.3],[-439.1,-668.7]],[[-74.8,-21.0],[-102.1,-6.7]],[[-70.8,-247.3],[-67.6,-223.5]],[[-117.2,-633.2],[-111.3,-597.7],[-75.3,-282.4]],[[-142.0,-649.6],[-122.9,-662.4]],[[-153.6,-678.0],[-130.8,-692.0]],[[-140.1,-725.6],[-166.8,-710.2]],[[254.1,618.1],[243.9,624.7]],[[1.2,186.8],[-8.9,192.5]],[[-67.3,58.4],[-79.5,66.1]],[[-189.6,-165.9],[-202.9,-158.2]],[[96.8,393.8],[109.5,386.6]],[[173.4,489.0],[162.9,496.1]],[[-303.9,-328.3],[-317.3,-321.6]],[[-415.3,-646.3],[-430.0,-640.0]],[[-186.0,-311.6],[-186.6,-319.3],[-192.0,-318.9],[-191.2,-309.7]],[[-229.4,-599.8],[-230.1,-565.6]],[[-185.0,-599.5],[-189.7,-579.0]],[[319.1,722.6],[309.8,728.2]],[[323.9,771.4],[313.0,769.1]],[[-149.6,-805.2],[-148.2,-767.4],[-146.5,-752.0],[-140.1,-725.6],[-125.5,-673.7],[-117.2,-633.2],[-92.0,-580.1]],[[-53.8,-249.4],[-70.8,-247.3],[-75.3,-282.4],[-91.4,-280.2]],[[-83.5,-221.7],[-67.6,-223.5],[-62.8,-179.3],[-59.8,-162.5],[-36.9,-113.3]],[[-5.9,137.6],[13.2,166.0],[60.6,254.8],[107.3,333.4],[111.9,337.8],[144.7,357.6]],[[307.2,685.7],[303.5,679.9],[295.8,685.3]],[[-338.8,-464.4],[-343.0,-480.9],[-347.3,-497.4],[-351.6,-513.9],[-360.6,-533.7],[-369.6,-553.5],[-378.5,-573.3],[-380.9,-578.1],[-387.7,-591.6],[-396.9,-609.8],[-406.1,-628.1],[-415.3,-646.3],[-423.3,-666.6],[-431.3,-686.9]],[[295.8,685.3],[283.1,664.9],[270.4,644.4],[257.6,624.0],[250.6,612.7],[244.9,603.5],[232.2,583.1],[219.5,562.6],[206.8,542.1],[194.1,521.7],[181.3,501.2],[168.6,480.8],[155.9,460.3],[143.2,439.9],[130.5,419.4],[117.8,399.0],[105.0,378.5],[93.5,357.1],[82.0,335.7],[70.5,314.3],[59.0,292.9],[47.5,271.5],[36.0,250.1],[24.5,228.7],[13.0,207.3],[1.5,185.9],[-10.0,164.5],[-21.5,143.1],[-33.1,121.7],[-44.6,100.3],[-56.1,78.9],[-67.6,57.5],[-79.1,36.1],[-90.6,14.7],[-102.1,-6.7],[-113.6,-27.5],[-125.0,-48.4],[-136.5,-69.3],[-147.9,-90.1],[-159.4,-111.0],[-170.8,-131.9],[-182.3,-152.8],[-193.7,-173.6],[-205.2,-194.5],[-216.6,-215.4],[-228.1,-236.2],[-239.6,-257.1],[-251.0,-278.0],[-262.5,-298.9],[-273.9,-319.7],[-284.6,-341.4],[-295.3,-363.1],[-306.0,-384.8],[-314.1,-404.3],[-322.2,-423.8],[-330.3,-443.3]],[[325.7,760.1],[327.0,744.9],[325.0,732.1],[315.2,716.5],[305.5,700.9],[295.8,685.3]]],"blds":[[[[-212.4,-342.4],[-208.3,-342.8],[-209.0,-348.5],[-199.4,-349.6],[-199.0,-346.1],[-188.0,-347.3],[-188.4,-351.4],[-177.4,-352.6],[-175.7,-337.0],[-196.1,-334.7],[-193.9,-314.4],[-196.9,-314.1],[-195.5,-301.4],[-187.4,-302.2],[-185.6,-285.6],[-197.7,-284.3],[-201.5,-319.0],[-205.2,-318.6],[-207.1,-335.9],[-211.6,-335.5]],15.0,"w570014403"],[[[-311.3,-606.3],[-292.0,-614.2],[-295.3,-622.3],[-285.1,-626.4],[-278.7,-610.8],[-274.9,-612.4],[-272.3,-606.0],[-275.2,-603.8],[-268.0,-586.3],[-257.4,-590.5],[-249.6,-571.8],[-261.7,-566.8],[-263.6,-571.4],[-287.6,-561.7],[-289.2,-565.6],[-294.3,-563.5],[-298.9,-574.8],[-293.0,-577.3],[-301.4,-597.8],[-306.9,-595.6]],15.0,"w570014404"],[[[-306.6,-662.6],[-296.1,-666.6],[-289.9,-650.5],[-300.4,-646.5]],13.4,"w570014405"],[[[-174.9,-248.5],[-162.4,-249.9],[-160.6,-234.0],[-173.2,-232.6]],13.4,"w570014406"],[[[-88.3,-75.1],[-75.8,-76.4],[-74.7,-66.9],[-87.3,-65.5]],3.7,"w570014407"],[[[-144.4,-289.5],[-139.9,-292.5],[-136.0,-292.0],[-131.3,-294.2],[-129.6,-299.6],[-125.9,-302.3],[-124.3,-305.6],[-121.5,-304.6],[-120.4,-306.1],[-117.8,-304.6],[-121.5,-297.7],[-126.7,-295.9],[-127.2,-290.4],[-134.0,-287.1],[-139.7,-289.2],[-144.1,-286.9]],13.4,"w737405227"]]};
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
const WTL = {"keep":[[-579.2,-280.7],[-557.1,-52.8],[-526.2,279.2],[-509.2,423.1],[-493.2,558.3],[-466.7,548.4],[-346.0,505.0],[-210.3,446.5],[-71.0,395.0],[13.0,367.6],[59.4,357.7],[110.4,351.6],[156.7,351.2],[207.5,354.5],[259.6,361.4],[303.8,368.0],[374.4,381.8],[409.3,388.4],[470.1,372.1],[607.3,314.2],[679.2,277.7],[710.7,239.6],[694.9,198.8],[472.9,-323.6],[400.3,-296.2],[387.7,-310.4],[378.6,-320.6],[360.5,-340.8],[305.9,-320.1],[293.8,-315.5],[255.7,-453.7],[225.2,-539.7],[205.3,-537.5],[143.4,-526.6],[114.7,-527.7],[83.9,-520.7],[62.7,-511.2],[-74.3,-484.9],[-126.3,-475.1],[-217.8,-448.4],[-281.9,-425.4],[-318.6,-404.9],[-356.2,-394.0],[-503.0,-348.7],[-550.7,-333.7],[-568.2,-322.4],[-576.1,-310.7],[-579.2,-280.7]],"rings":[[[-579.2,-280.7],[-557.1,-52.8],[-526.2,279.2],[-509.2,423.1],[-493.2,558.3],[-466.7,548.4],[-346.0,505.0],[-210.3,446.5],[-71.0,395.0],[13.0,367.6],[59.4,357.7],[110.4,351.6],[156.7,351.2],[207.5,354.5],[259.6,361.4],[303.8,368.0],[374.4,381.8],[409.3,388.4],[470.1,372.1],[607.3,314.2],[679.2,277.7],[710.7,239.6],[694.9,198.8],[472.9,-323.6],[400.3,-296.2],[387.7,-310.4],[378.6,-320.6],[360.5,-340.8],[305.9,-320.1],[293.8,-315.5],[255.7,-453.7],[225.2,-539.7],[205.3,-537.5],[143.4,-526.6],[114.7,-527.7],[83.9,-520.7],[62.7,-511.2],[-74.3,-484.9],[-126.3,-475.1],[-217.8,-448.4],[-281.9,-425.4],[-318.6,-404.9],[-356.2,-394.0],[-503.0,-348.7],[-550.7,-333.7],[-568.2,-322.4],[-576.1,-310.7],[-579.2,-280.7]]],"paths":[[[192.7,124.0],[205.7,123.3],[209.7,123.1],[218.8,122.7],[234.7,118.9],[250.6,115.2],[258.1,119.2],[266.1,128.4],[273.1,131.0],[282.7,132.3],[304.5,127.9]],[[231.1,-127.4],[234.0,-135.9],[239.5,-140.3],[254.6,-142.2]],[[266.3,-146.0],[281.3,-160.9],[278.9,-171.4],[266.8,-185.2]],[[253.0,-154.8],[259.2,-160.9],[278.9,-171.4]],[[166.8,-90.3],[157.3,-77.9]],[[333.3,122.7],[355.2,118.5],[377.2,114.3],[399.2,110.2],[421.2,106.0],[428.7,109.5],[430.8,113.0],[436.9,123.3],[445.1,137.1],[448.2,139.8],[456.2,139.8],[480.4,134.7],[504.6,129.7],[528.8,124.6],[553.0,119.6],[575.4,113.7],[597.8,107.8],[620.3,101.9],[642.7,95.9]],[[257.6,-144.7],[243.5,-168.8]],[[328.7,-196.6],[318.5,-206.8],[308.2,-217.0]],[[-438.0,435.2],[-448.4,422.7],[-449.5,415.7],[-448.4,408.0],[-444.8,402.3],[-437.3,397.5],[-416.3,391.4],[-400.8,389.2],[-347.1,385.5]],[[-247.2,291.7],[-229.1,300.2]],[[29.1,-170.8],[27.3,-186.8],[12.6,-255.4]],[[-380.9,440.2],[-382.7,413.3],[-389.6,404.3],[-390.4,396.9],[-385.8,387.2]],[[-258.4,360.7],[-261.6,350.8],[-264.0,324.5],[-275.3,315.1],[-280.6,306.8]],[[-244.3,393.3],[-249.9,384.4],[-253.0,371.0]],[[-493.2,420.4],[-463.8,417.2]],[[34.2,-494.3],[19.8,-493.4],[-40.5,-481.8],[-100.9,-473.2],[-132.7,-465.3],[-181.1,-448.7],[-276.6,-411.6],[-359.1,-387.5]],[[-7.0,-319.1],[1.2,-320.2],[5.1,-324.4],[5.6,-332.0],[3.5,-335.6],[-2.2,-338.8],[-10.5,-336.8],[-14.3,-329.9],[-12.7,-323.4],[-7.0,-319.1]],[[-386.2,374.5],[-391.2,332.8]],[[-219.2,419.5],[-237.3,402.8]],[[-389.1,349.0],[-354.2,348.0],[-308.9,327.6],[-288.1,322.3],[-275.3,315.1]],[[3.4,-293.0],[-3.1,-318.7]],[[-449.5,415.7],[-435.1,413.5]],[[-48.9,-160.7],[-28.4,-171.7],[-13.6,-176.3],[18.0,-174.5],[29.1,-170.8],[64.9,-143.4],[75.1,-132.4],[79.9,-115.0]],[[-276.6,-411.6],[-266.7,-316.7],[-246.5,-168.2],[-244.5,-142.1]],[[-132.7,-465.3],[-99.1,-314.1],[-81.6,-226.0],[-72.0,-164.9]],[[-181.1,-448.7],[-163.4,-389.7],[-159.5,-365.4],[-114.4,-163.4]],[[-267.1,-75.7],[-280.8,-87.3],[-290.3,-100.6],[-303.8,-142.3],[-340.5,-344.6],[-342.9,-391.2]],[[-306.2,340.3],[-314.0,312.5]],[[-7.9,-338.3],[-40.5,-481.8]],[[-378.5,482.2],[-380.3,451.6]],[[471.6,-297.7],[489.3,-265.2],[521.6,-190.7],[556.9,-112.7],[636.5,76.2],[642.7,95.9],[691.3,201.1],[692.7,209.0],[671.0,247.2],[659.5,257.2],[647.1,264.3],[571.5,278.3],[546.3,280.5],[514.9,280.5],[443.3,278.3],[319.1,267.3],[302.7,270.4],[266.5,281.8],[228.5,287.9],[217.4,288.6],[208.1,285.7],[199.7,279.2],[187.6,266.7],[178.7,262.1]],[[278.9,-171.4],[312.3,-199.3],[328.4,-225.1],[337.9,-249.9]],[[-184.4,-132.2],[-219.1,-141.2],[-244.5,-142.1],[-270.2,-134.0],[-285.5,-124.1],[-321.3,-73.9],[-347.6,-46.5],[-348.7,-39.9],[-345.6,-27.2]]],"blds":[[[[368.8,-322.9],[375.9,-329.3],[399.1,-304.4],[392.1,-298.0]],15.0,"w325768505"]]};
Object.assign(SITES, {szwaterlands:{zh:'海上田园', en:'Shenzhen Waterlands Resort', lat:22.728665, lon:113.766585, r:800, keep:WTL.keep, keepRoads:[11, 12], h:10,
  lt:{m:0, c:'#ffe2b4', k:0.45},
  build(ctx){
    const g = new THREE.Group();
    siteTrees(ctx, WTL.paths, 12, 3.2, ['raintree', 'd', 'willow', 'palm'], [2.4, 4.0]);
    siteLamps(ctx, WTL.paths, 36, [255, 222, 170]);
    siteBlds(g, ctx, WTL.blds, 8, {c:'#d8d2c2', m:1, fh:3.4, cw:2.6}, '#8f8576');
    return g;
  }}});
}
