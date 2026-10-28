const PI = Math.PI, TAU = PI*2;
const lerp = (a, b, t) => a + (b - a)*t, clamp = (v, a, b) => v < a ? a : v > b ? b : v;
// piecewise-linear profile [[y, v], ...] -> v(y)
const prof = T => y => { if (y <= T[0][0]) return T[0][1]; for (let i = 1; i < T.length; i++) if (y <= T[i][0]){ const a = T[i-1], b = T[i]; return lerp(a[1], b[1], (y - a[0])/(b[0] - a[0])); } return T[T.length - 1][1]; };
const dec = (A, q) => { q = q || 0.5; const P = []; for (let i = 0; i < A.length; i += 2) P.push([A[i]*q, A[i+1]*q]); return P; };
// ---------- triangle batches (one LTris call per colour spec object) ----------
function Bt(){ const m = new Map(); const arr = s => { let A = m.get(s); if (!A){ A = []; m.set(s, A); } return A; };
  return {
    q(s, a, b, c, d){ arr(s).push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2]); },
    t(s, a, b, c){ arr(s).push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); },
    flush(g){ for (const [s, A] of m) if (A.length) LTris(g, A, s); m.clear(); } }; }
const area2 = P => { let a = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) a += (P[j][0] + P[i][0])*(P[j][1] - P[i][1]); return a/2; };
const cen = P => { let x = 0, z = 0; for (const p of P){ x += p[0]; z += p[1]; } return [x/P.length, z/P.length]; };
const pip = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0])*(z - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; };
// offset a ring by d (positive = outward), vertex-normal offset with a mitre limit
function off(P, d){
  const n = P.length, s = area2(P) > 0 ? 1 : -1, o = [];
  for (let i = 0; i < n; i++){ const a = P[(i + n - 1) % n], b = P[i], c = P[(i + 1) % n];
    const e1 = [b[0] - a[0], b[1] - a[1]], e2 = [c[0] - b[0], c[1] - b[1]], l1 = Math.hypot(e1[0], e1[1]) || 1, l2 = Math.hypot(e2[0], e2[1]) || 1;
    const n1 = [-e1[1]/l1*s, e1[0]/l1*s], n2 = [-e2[1]/l2*s, e2[0]/l2*s]; let m = [n1[0] + n2[0], n1[1] + n2[1]]; const lm = Math.hypot(m[0], m[1]) || 1; m = [m[0]/lm, m[1]/lm];
    const k = 1/Math.max(0.4, m[0]*n1[0] + m[1]*n1[1]); o.push([b[0] + m[0]*d*k, b[1] + m[1]*d*k]); }
  return o;
}
// is the ring's outward side to the left or right of a->b? returns the unit outward normal of edge a->b
const outN = (P, a, b) => { const s = area2(P) > 0 ? 1 : -1, dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [-dz/l*s, dx/l*s]; };
// vertical prism over a plan ring: walls (spec) + top cap (topSpec or spec); y0 / y1 numbers
function prism(B, s, P, y0, y1, top, bot){
  for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[j], b = P[i]; B.q(s, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); }
  if (top !== false) cap(B, top || s, P, y1);
  if (bot) cap(B, bot, P, y0);
}
// cap a (possibly concave) ring with an ear-clipping triangulation
function cap(B, s, P, y){
  const T = tri2(P); for (const [i, j, k] of T) B.t(s, [P[i][0], y, P[i][1]], [P[j][0], y, P[j][1]], [P[k][0], y, P[k][1]]);
}
function tri2(P){
  const n = P.length; if (n < 3) return []; const idx = []; for (let i = 0; i < n; i++) idx.push(i);
  if (area2(P) < 0) idx.reverse();
  const out = []; let guard = 0;
  const cr = (a, b, c) => (b[0] - a[0])*(c[1] - a[1]) - (b[1] - a[1])*(c[0] - a[0]);
  while (idx.length > 3 && guard++ < 5000){ let found = false;
    for (let i = 0; i < idx.length; i++){ const ia = idx[(i + idx.length - 1) % idx.length], ib = idx[i], ic = idx[(i + 1) % idx.length], a = P[ia], b = P[ib], c = P[ic];
      if (cr(a, b, c) <= 1e-9) continue; let ok = true;
      for (const k of idx){ if (k === ia || k === ib || k === ic) continue; const p = P[k]; if (cr(a, b, p) >= 0 && cr(b, c, p) >= 0 && cr(c, a, p) >= 0){ ok = false; break; } }
      if (!ok) continue; out.push([ia, ib, ic]); idx.splice(i, 1); found = true; break; }
    if (!found) break; }
  if (idx.length === 3) out.push([idx[0], idx[1], idx[2]]);
  else for (let i = 1; i < idx.length - 1; i++) out.push([idx[0], idx[i], idx[i + 1]]);
  return out;
}
// loft through rings of [x, y, z] (same count), closed around; optional apex cap
function loft(B, s, R, apex){
  for (let i = 0; i < R.length - 1; i++){ const a = R[i], b = R[i + 1], n = a.length; for (let k = 0; k < n; k++){ const k2 = (k + 1) % n; B.q(s, a[k], a[k2], b[k2], b[k]); } }
  if (apex){ const r = R[R.length - 1], n = r.length; for (let k = 0; k < n; k++) B.t(s, r[k], r[(k + 1) % n], apex); }
}
// axis-aligned box and oriented box (centre cx, cz; unit axis ux, uz along L; width W across)
function box(B, s, x0, x1, y0, y1, z0, z1){ const P = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]; prism(B, s, P, y0, y1, s, s); }
function obox(B, s, cx, cz, ux, uz, L, W, y0, y1){ const vx = -uz, vz = ux, hl = L/2, hw = W/2;
  const P = [[cx - ux*hl - vx*hw, cz - uz*hl - vz*hw], [cx + ux*hl - vx*hw, cz + uz*hl - vz*hw], [cx + ux*hl + vx*hw, cz + uz*hl + vz*hw], [cx - ux*hl + vx*hw, cz - uz*hl + vz*hw]];
  prism(B, s, P, y0, y1, s, s); }
// box between two plan points (a wall / beam of width W from a to b), y0..y1
function seg(B, s, a, b, W, y0, y1){ const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz); if (L < 0.05) return; obox(B, s, (a[0] + b[0])/2, (a[1] + b[1])/2, dx/L, dz/L, L, W, y0, y1); }
// square-section beam between two 3-D points
function beam(B, s, a, b, r){
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(d[0], d[1], d[2]); if (L < 1e-3) return;
  const u = [d[0]/L, d[1]/L, d[2]/L], p = Math.abs(u[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let v = [u[1]*p[2] - u[2]*p[1], u[2]*p[0] - u[0]*p[2], u[0]*p[1] - u[1]*p[0]]; const lv = Math.hypot(v[0], v[1], v[2]); v = v.map(x => x/lv);
  const w = [u[1]*v[2] - u[2]*v[1], u[2]*v[0] - u[0]*v[2], u[0]*v[1] - u[1]*v[0]];
  const C = (o, i) => { const sx = (i === 0 || i === 3) ? -r : r, sy = i < 2 ? -r : r; return [o[0] + v[0]*sx + w[0]*sy, o[1] + v[1]*sx + w[1]*sy, o[2] + v[2]*sx + w[2]*sy]; };
  for (let i = 0; i < 4; i++){ const j = (i + 1) & 3; B.q(s, C(a, i), C(a, j), C(b, j), C(b, i)); }
}
// a rib on a surface: polyline pts [[x, y, z]...] with outward unit normals outs [[nx, nz]...]: front face at the points, sides back by d
function rib(B, s, pts, outs, d, w){
  const S = pts.map((p, i) => { const ux = outs[i][0], uz = outs[i][1], tx = -uz, tz = ux, hw = Array.isArray(w) ? w[i] : w;
    return [[p[0] - tx*hw - ux*d, p[1], p[2] - tz*hw - uz*d], [p[0] - tx*hw, p[1], p[2] - tz*hw], [p[0] + tx*hw, p[1], p[2] + tz*hw], [p[0] + tx*hw - ux*d, p[1], p[2] + tz*hw - uz*d]]; });
  for (let i = 0; i < S.length - 1; i++){ const a = S[i], b = S[i + 1]; B.q(s, a[0], a[1], b[1], b[0]); B.q(s, a[1], a[2], b[2], b[1]); B.q(s, a[2], a[3], b[3], b[2]); }
}
// facade detail on a ring between y0 and y1: vertical fins every cw (depth fd, width fw) and floor ledges every fh (depth ld, height lh)
function facade(B, sFin, sLed, P, y0, y1, o){
  const n = P.length;
  for (let i = 0; i < n; i++){ const a = P[i], b = P[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 1.5) continue; const N = outN(P, a, b), ux = (b[0] - a[0])/L, uz = (b[1] - a[1])/L;
    if (sFin && o.cw){ const k = Math.max(1, Math.round(L/o.cw)); for (let j = (o.ends ? 0 : 1); j <= (o.ends ? k : k - 1); j++){ const t = j/k, x = a[0] + (b[0] - a[0])*t + N[0]*o.fd/2, z = a[1] + (b[1] - a[1])*t + N[1]*o.fd/2; obox(B, sFin, x, z, N[0], N[1], o.fd, o.fw, y0, y1); } }
    if (sLed && o.fh){ for (let y = y0 + o.fh; y < y1 - 0.5; y += o.fh){ const A = [a[0] + N[0]*o.ld, a[1] + N[1]*o.ld], Bq = [b[0] + N[0]*o.ld, b[1] + N[1]*o.ld];
      B.q(sLed, [a[0], y + o.lh, a[1]], [b[0], y + o.lh, b[1]], [Bq[0], y + o.lh, Bq[1]], [A[0], y + o.lh, A[1]]);
      B.q(sLed, [A[0], y, A[1]], [Bq[0], y, Bq[1]], [Bq[0], y + o.lh, Bq[1]], [A[0], y + o.lh, A[1]]); } } }
}
// night light points (aviation lights, lamps): additive sprites that only show at night
function lights(g, pts, rgb, size){
  if (!pts.length) return;
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const col = new Float32Array(pts.length); for (let i = 0; i < col.length; i += 3){ col[i] = rgb[0]; col[i + 1] = rgb[1]; col[i + 2] = rgb[2]; }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({size, map:typeof lampTex !== 'undefined' ? lampTex : null, vertexColors:true, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending, sizeAttenuation:true});
  const p = new THREE.Points(geo, mat); p.renderOrder = 6;
  p.onBeforeRender = () => { const nv = typeof NIGHT !== 'undefined' && NIGHT.uNight ? NIGHT.uNight.value : 0; mat.opacity = typeof matLamp !== 'undefined' && matLamp ? Math.min(1, matLamp.opacity*1.1) : (nv > 0.5 ? 1 : 0); };
  g.add(p);
}
const RED = {c:'#a81010', glow:'#ff2a14', gk:2.4};
// aviation lights: a red box + sprite at each point
function avia(B, g, pts, size){ const P = []; for (const p of pts){ box(B, RED, p[0] - 0.4, p[0] + 0.4, p[1], p[1] + 0.8, p[2] - 0.4, p[2] + 0.4); P.push(p[0], p[1] + 1, p[2]); } return P; }
