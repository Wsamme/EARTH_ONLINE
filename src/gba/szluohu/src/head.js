// ===== Shenzhen · Luohu and Huaqiangbei (City Brush, Greater Bay map, group szluohu) =====
// KK100 (upgrade of the v37 hkkingkey), Shun Hing Square (Diwang) with its annex, the Guomao Building, SEG Plaza, Citymark Centre,
// Baoneng Center, the Shenzhen Grand Theatre, Shenzhen Railway Station, Luohu Port, the old Shenzhen Museum, and the sites
// Dongmen Pedestrian Street and Huaqiangbei Road. Every model stands on its real OSM footprint (local metres round the anchor:
// +x east, +z south; rot 0 everywhere, the footprints are used as they are). Data in D (gen.py from the refs); sources in the
// report. No logos, wordmarks, signage or text anywhere.
{
const D = /*@DATA@*/;
const PI = Math.PI, TAU = PI*2;
// ---------- batching: triangles per colour spec, flushed into one LTris call each ----------
function Bt(){ const M = new Map();
  const arr = col => { const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; };
  return { arr,
    q(col, a, b, c, d){ const o = arr(col); o.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2]); },
    t(col, a, b, c){ arr(col).push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); },
    flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; }
// oriented box: centre (cx, cz), long axis (ux, uz) of length L, width W across, from y0 to y1
function obox(B, col, cx, cz, ux, uz, L, W, y0, y1, noBot){
  const l = Math.hypot(ux, uz) || 1; ux /= l; uz /= l; const vx = -uz, vz = ux, a = L/2, b = W/2;
  const P = (s, t, y) => [cx + ux*s + vx*t, y, cz + uz*s + vz*t];
  const c = [P(-a, -b, 0), P(a, -b, 0), P(a, b, 0), P(-a, b, 0)];
  const lo = c.map(p => [p[0], y0, p[2]]), hi = c.map(p => [p[0], y1, p[2]]);
  for (let i = 0; i < 4; i++){ const j = (i + 1)%4; B.q(col, lo[i], lo[j], hi[j], hi[i]); }
  B.q(col, hi[0], hi[1], hi[2], hi[3]); if (!noBot) B.q(col, lo[3], lo[2], lo[1], lo[0]);
}
// axis box
const abox = (B, col, x0, x1, y0, y1, z0, z1) => obox(B, col, (x0 + x1)/2, (z0 + z1)/2, 1, 0, x1 - x0, z1 - z0, y0, y1);
// triangulated polygon cap [[x, z], ...] at height y
function cap(B, col, ring, y, holes){
  const V = ring.map(p => new THREE.Vector2(p[0], p[1])), H = (holes || []).map(h => h.map(p => new THREE.Vector2(p[0], p[1])));
  const all = V.concat(...H), tr = THREE.ShapeUtils.triangulateShape(V, H);
  for (const [a, b, c] of tr) B.t(col, [all[a].x, y, all[a].y], [all[b].x, y, all[b].y], [all[c].x, y, all[c].y]);
}
// extruded polygon: walls + top (and optional bottom) cap
function ext(B, col, ring, y0, y1, topCol, bot){
  const n = ring.length;
  for (let i = 0; i < n; i++){ const a = ring[i], b = ring[(i + 1)%n]; B.q(col, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); }
  if (topCol !== null) cap(B, topCol || col, ring, y1);
  if (bot) cap(B, bot, ring, y0);
}
// skin through rings of [x, y, z] (same count), optional cap on the last ring
function loft(B, col, R, capLast, closed){
  for (let i = 0; i < R.length - 1; i++){ const a = R[i], b = R[i + 1], n = a.length, m = closed === false ? n - 1 : n;
    for (let k = 0; k < m; k++){ const k2 = (k + 1)%n; B.q(col, a[k], a[k2], b[k2], b[k]); } }
  if (capLast){ const r = R[R.length - 1], n = r.length, c = [0, 0, 0]; for (const p of r){ c[0] += p[0]/n; c[1] += p[1]/n; c[2] += p[2]/n; }
    for (let k = 0; k < n; k++) B.t(col, r[k], r[(k + 1)%n], c); }
}
// a fin (strip of boxes) following a polyline of [x, y, z] with outward directions outs[i] = [ox, oz]: depth d, half width w
function fin(B, col, pts, outs, d, w){
  const S = pts.map((p, i) => { const [ox, oz] = outs[i], l = Math.hypot(ox, oz) || 1, ux = ox/l, uz = oz/l, tx = -uz, tz = ux;
    return [[p[0] - tx*w, p[1], p[2] - tz*w], [p[0] - tx*w + ux*d, p[1], p[2] - tz*w + uz*d], [p[0] + tx*w + ux*d, p[1], p[2] + tz*w + uz*d], [p[0] + tx*w, p[1], p[2] + tz*w]]; });
  for (let i = 0; i < S.length - 1; i++){ const a = S[i], b = S[i + 1]; B.q(col, a[0], a[1], b[1], b[0]); B.q(col, a[1], a[2], b[2], b[1]); B.q(col, a[2], a[3], b[3], b[2]); }
}
// cylinder / frustum ring wall (n segments) centred (x, z)
function cylw(B, col, x, z, r0, r1, y0, y1, n, capTop){
  const P = (r, y, k) => [x + Math.cos(k/n*TAU)*r, y, z + Math.sin(k/n*TAU)*r];
  for (let k = 0; k < n; k++){ B.q(col, P(r0, y0, k), P(r0, y0, k + 1), P(r1, y1, k + 1), P(r1, y1, k)); if (capTop) B.t(capTop, P(r1, y1, k), P(r1, y1, k + 1), [x, y1, z]); }
}
// polygon helpers
const centroid = R => { let a = 0, cx = 0, cz = 0; for (let i = 0; i < R.length; i++){ const p = R[i], q = R[(i + 1)%R.length], f = p[0]*q[1] - q[0]*p[1]; a += f; cx += (p[0] + q[0])*f; cz += (p[1] + q[1])*f; } return a ? [cx/(3*a), cz/(3*a)] : R[0]; };
const shift = (R, dx, dz) => R.map(p => [p[0] + dx, p[1] + dz]);
// offset a convex-ish ring outward by d (miter, per vertex)
function grow(R, d){ const n = R.length; let s = 0; for (let i = 0; i < n; i++){ const p = R[i], q = R[(i + 1)%n]; s += p[0]*q[1] - q[0]*p[1]; } const o = s > 0 ? 1 : -1;
  return R.map((p, i) => { const a = R[(i + n - 1)%n], b = R[(i + 1)%n];
    const e1 = [p[0] - a[0], p[1] - a[1]], e2 = [b[0] - p[0], b[1] - p[1]], l1 = Math.hypot(...e1) || 1, l2 = Math.hypot(...e2) || 1;
    const n1 = [o*e1[1]/l1, -o*e1[0]/l1], n2 = [o*e2[1]/l2, -o*e2[0]/l2], m = [n1[0] + n2[0], n1[1] + n2[1]], ml = Math.hypot(...m) || 1, cs = (m[0]*n1[0] + m[1]*n1[1])/ml;
    const k = d/Math.max(0.35, cs); return [p[0] + m[0]/ml*k, p[1] + m[1]/ml*k]; }); }
// horizontal bands round a ring (proud by d) at the heights ys, thickness th
function bands(B, col, R, ys, th, d){ const G = grow(R, d); for (const y of ys) ext(B, col, G, y - th/2, y + th/2, null); }
// vertical mullions round a ring: every ~step m along each edge, depth d, width w, y0..y1
function mullions(B, col, R, step, d, w, y0, y1, corners){
  const n = R.length; let s = 0; for (let i = 0; i < n; i++){ const p = R[i], q = R[(i + 1)%n]; s += p[0]*q[1] - q[0]*p[1]; } const o = s > 0 ? 1 : -1;
  for (let i = 0; i < n; i++){ const a = R[i], b = R[(i + 1)%n], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.5) continue;
    const ux = (b[0] - a[0])/L, uz = (b[1] - a[1])/L, nx = o*uz, nz = -o*ux, k = Math.max(1, Math.round(L/step));
    for (let j = corners ? 0 : 1; j < k; j++){ const f = j/k, x = a[0] + (b[0] - a[0])*f + nx*d/2, z = a[1] + (b[1] - a[1])*f + nz*d/2; obox(B, col, x, z, nx, nz, d, w, y0, y1, true); } }
}
// aviation / beacon lights: glowing point sprites (only at night)
function beacons(g, pts, rgb, size){
  if (!pts.length) return;
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const col = new Float32Array(pts.length); for (let i = 0; i < col.length; i += 3){ col[i] = rgb[0]; col[i + 1] = rgb[1]; col[i + 2] = rgb[2]; }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({size, map:typeof lampTex !== 'undefined' ? lampTex : null, vertexColors:true, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending, sizeAttenuation:true});
  const p = new THREE.Points(geo, mat); p.renderOrder = 6;
  p.onBeforeRender = () => { mat.opacity = typeof matLamp !== 'undefined' ? Math.min(1, matLamp.opacity*1.1) : (NIGHT.uNight.value > 0.5 ? 1 : 0); };
  g.add(p);
}
const RED = {c:'#a81010', glow:'#ff2a14', gk:2.4};
function redLight(B, x, y, z, s){ abox(B, RED, x - s, x + s, y, y + 2*s, z - s, z + s); }
// local metres -> lat / lon for sub-keys
const LL = (lat, lon, x, z) => [lat - z/110734.9, lon + x/103014.2];
