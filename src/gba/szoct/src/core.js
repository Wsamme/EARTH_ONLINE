// ===== Shenzhen · OCT, Xili and University Town (City Brush, Greater Bay map, group szoct) =====
// Landmarks: OCT Tower (★), He Xiangning Art Museum. Sites: Window of the World (★), Splendid China Folk Village, Happy Valley,
// OCT Harbour, OCT-LOFT, Shenzhen Safari Park, SUSTech, HIT Shenzhen. Theme parks are architecture, landscape and lighting only:
// no characters, mascots, brand imagery or signage; no text or logos anywhere.
// Real data (site outlines, footprints, water, woods, paths, named features) is in D (tools/gendata.py + tools/mk.py), in local
// metres round each target anchor (+x east, +z south). Sites stand on ctx.gy (absolute height); landmarks on y = 0.
{
const D = /*@DATA@*/null;
const PI = Math.PI, TAU = PI*2, HP = PI/2;
const lerp = (a, b, t) => a + (b - a)*t, clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const RGB = h => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const pip = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0])*(z - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; };
const parea = P => { let a = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) a += (P[j][0] + P[i][0])*(P[j][1] - P[i][1]); return Math.abs(a/2); };
const pcent = P => { let x = 0, z = 0; for (const p of P){ x += p[0]; z += p[1]; } return [x/P.length, z/P.length]; };
const pbb = P => { let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity; for (const p of P){ x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); } return [x0, z0, x1, z1]; };
// oriented bounding box from the longest edge: centre, length L along ang, width W
const obb = P => { let best = 0, ang = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L > best){ best = L; ang = Math.atan2(b[1] - a[1], b[0] - a[0]); } }
  const ux = Math.cos(ang), uz = Math.sin(ang); let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
  for (const p of P){ const a = p[0]*ux + p[1]*uz, b = -p[0]*uz + p[1]*ux; a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, b); b1 = Math.max(b1, b); }
  const ca = (a0 + a1)/2, cb = (b0 + b1)/2; return {cx:ca*ux - cb*uz, cz:ca*uz + cb*ux, L:a1 - a0, W:b1 - b0, ang}; };
const rectness = P => { const F = obb(P); return parea(P)/(F.L*F.W || 1); };
// ---------- vertex-coloured triangle batches: one LTris per material spec ----------
function VB(){ const m = new Map();
  const get = s => { let A = m.get(s); if (!A){ A = {p:[], c:[]}; m.set(s, A); } return A; };
  const B = {
    tri(s, k, a, b, c){ const A = get(s); A.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); A.c.push(k[0], k[1], k[2], k[0], k[1], k[2], k[0], k[1], k[2]); },
    quad(s, k, a, b, c, d){ B.tri(s, k, a, b, c); B.tri(s, k, a, c, d); },
    flush(g){ for (const [s, A] of m){ if (!A.p.length) continue; const me = LTris(g, A.p, s); me.geometry.setAttribute('color', new THREE.Float32BufferAttribute(A.c, 3)); } m.clear(); },
    count(){ let n = 0; for (const A of m.values()) n += A.p.length/9; return n; } };
  return B; }
// a local frame in plan: origin (cx, y0, cz), +u along angle ang (from +x toward +z), +v = u turned 90° (front side)
const Fr = (cx, cz, ang, y0) => { const c = Math.cos(ang), s = Math.sin(ang); return (u, y, v) => [cx + u*c - v*s, y0 + y, cz + u*s + v*c]; };
// box in a frame: centre (u, v), size w (along u) x d (along v), from y0 to y0 + h
function fbox(B, F, s, k, u, v, w, d, y0, h, top){
  const a = F(u - w/2, y0, v - d/2), b = F(u + w/2, y0, v - d/2), c = F(u + w/2, y0, v + d/2), e = F(u - w/2, y0, v + d/2);
  const a2 = F(u - w/2, y0 + h, v - d/2), b2 = F(u + w/2, y0 + h, v - d/2), c2 = F(u + w/2, y0 + h, v + d/2), e2 = F(u - w/2, y0 + h, v + d/2);
  B.quad(s, k, a, b, b2, a2); B.quad(s, k, b, c, c2, b2); B.quad(s, k, c, e, e2, c2); B.quad(s, k, e, a, a2, e2); B.quad(s, top || k, a2, b2, c2, e2);
}
// frustum / pyramid: bottom w x d, top wt x dt (0 = apex)
function fpyr(B, F, s, k, u, v, w, d, y0, h, wt, dt){
  wt = wt || 0; dt = dt === undefined ? wt*d/(w || 1) : dt;
  const P = (x, z, y) => F(u + x, y, v + z), b = [P(-w/2, -d/2, y0), P(w/2, -d/2, y0), P(w/2, d/2, y0), P(-w/2, d/2, y0)], t = [P(-wt/2, -dt/2, y0 + h), P(wt/2, -dt/2, y0 + h), P(wt/2, dt/2, y0 + h), P(-wt/2, dt/2, y0 + h)];
  for (let i = 0; i < 4; i++){ const j = (i + 1) % 4; if (wt > 0.01) B.quad(s, k, b[i], b[j], t[j], t[i]); else B.tri(s, k, b[i], b[j], t[i]); }
  if (wt > 0.01) B.quad(s, k, t[0], t[1], t[2], t[3]);
}
// hip roof over a w x d rectangle (ridge along u when w > d)
function fhip(B, F, s, k, u, v, w, d, y0, h, over){
  over = over || 0; const hw = w/2 + over, hd = d/2 + over, r = Math.max(0, hw - hd);
  const a = F(u - hw, y0, v - hd), b = F(u + hw, y0, v - hd), c = F(u + hw, y0, v + hd), e = F(u - hw, y0, v + hd), r1 = F(u - r, y0 + h, v), r2 = F(u + r, y0 + h, v);
  B.quad(s, k, a, b, r2, r1); B.quad(s, k, c, e, r1, r2); B.tri(s, k, e, a, r1); B.tri(s, k, b, c, r2);
}
// Chinese hip roof with upturned eaves: two pitches (steep upper, flat lower), corners lifted
function fcnroof(B, F, s, k, u, v, w, d, y0, h, over, lift){
  over = over || 1; lift = lift || h*0.18; const hw = w/2 + over, hd = d/2 + over, mw = w/2 - Math.min(w, d)*0.12, md = d/2 - Math.min(w, d)*0.12, r = Math.max(0, w/2 - d/2)*0.9;
  const E = [F(u - hw, y0 + lift, v - hd), F(u + hw, y0 + lift, v - hd), F(u + hw, y0 + lift, v + hd), F(u - hw, y0 + lift, v + hd)];
  const M = [F(u - mw, y0 + h*0.42, v - md), F(u + mw, y0 + h*0.42, v - md), F(u + mw, y0 + h*0.42, v + md), F(u - mw, y0 + h*0.42, v + md)];
  const e2 = [F(u, y0, v - hd), F(u + hw, y0, v), F(u, y0, v + hd), F(u - hw, y0, v)];   // sagging mid-eaves
  for (let i = 0; i < 4; i++){ const j = (i + 1) % 4; B.tri(s, k, E[i], e2[i], M[i]); B.tri(s, k, e2[i], E[j], M[j]); B.tri(s, k, e2[i], M[j], M[i]); }
  const r1 = F(u - r, y0 + h, v), r2 = F(u + r, y0 + h, v);
  B.quad(s, k, M[0], M[1], r2, r1); B.quad(s, k, M[2], M[3], r1, r2); B.tri(s, k, M[3], M[0], r1); B.tri(s, k, M[1], M[2], r2);
}
// gable roof (ridge along u)
function fgable(B, F, s, k, u, v, w, d, y0, h, over){
  over = over || 0; const hw = w/2 + over, hd = d/2 + over;
  const a = F(u - hw, y0, v - hd), b = F(u + hw, y0, v - hd), c = F(u + hw, y0, v + hd), e = F(u - hw, y0, v + hd), r1 = F(u - hw, y0 + h, v), r2 = F(u + hw, y0 + h, v);
  B.quad(s, k, a, b, r2, r1); B.quad(s, k, c, e, r1, r2); B.tri(s, k, e, a, r1); B.tri(s, k, b, c, r2);
}
// surface of revolution [[r, y], ...] at (u, v), seg sides; sx/sz stretch the radius along u / v
function flathe(B, F, s, k, u, v, y0, prof, seg, sx, sz, a0){
  seg = seg || 12; sx = sx || 1; sz = sz || 1; a0 = a0 || 0;
  for (let i = 0; i < seg; i++){ const t0 = a0 + i/seg*TAU, t1 = a0 + (i + 1)/seg*TAU;
    for (let j = 0; j < prof.length - 1; j++){ const p = prof[j], q = prof[j + 1];
      const A = F(u + Math.cos(t0)*p[0]*sx, y0 + p[1], v + Math.sin(t0)*p[0]*sz), Bq = F(u + Math.cos(t1)*p[0]*sx, y0 + p[1], v + Math.sin(t1)*p[0]*sz),
            C = F(u + Math.cos(t1)*q[0]*sx, y0 + q[1], v + Math.sin(t1)*q[0]*sz), E = F(u + Math.cos(t0)*q[0]*sx, y0 + q[1], v + Math.sin(t0)*q[0]*sz);
      if (p[0] < 1e-4) B.tri(s, k, A, C, E); else if (q[0] < 1e-4) B.tri(s, k, A, Bq, C); else B.quad(s, k, A, Bq, C, E); } }
}
const fcyl = (B, F, s, k, u, v, r, y0, h, seg, rt) => flathe(B, F, s, k, u, v, y0, [[0, 0], [r, 0], [rt === undefined ? r : rt, h], [0, h]], seg);
const domeP = (r, sy, n) => { const P = []; n = n || 6; for (let i = 0; i <= n; i++){ const a = i/n*HP; P.push([Math.cos(a)*r, Math.sin(a)*r*(sy || 1)]); } P[n][0] = 0; return P; };
const onionP = (r, n) => [[r*0.9, 0], [r*1.15, r*0.5], [r*1.05, r*1.0], [r*0.6, r*1.5], [r*0.2, r*1.9], [0.04, r*2.3], [0, r*2.35]];
// square bar between two points a, b (3-D, already in world-local coords)
function bar(B, s, k, a, b, w){
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz); if (L < 1e-3) return;
  const d = [dx/L, dy/L, dz/L], up = Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  let u = [d[1]*up[2] - d[2]*up[1], d[2]*up[0] - d[0]*up[2], d[0]*up[1] - d[1]*up[0]]; const ul = Math.hypot(...u); u = u.map(x => x/ul*w/2);
  const v = [d[1]*u[2] - d[2]*u[1], d[2]*u[0] - d[0]*u[2], d[0]*u[1] - d[1]*u[0]];
  const o = (p, su, sv) => [p[0] + u[0]*su + v[0]*sv, p[1] + u[1]*su + v[1]*sv, p[2] + u[2]*su + v[2]*sv];
  const A = [o(a, 1, 1), o(a, -1, 1), o(a, -1, -1), o(a, 1, -1)], C = [o(b, 1, 1), o(b, -1, 1), o(b, -1, -1), o(b, 1, -1)];
  for (let i = 0; i < 4; i++){ const j = (i + 1) % 4; B.quad(s, k, A[i], A[j], C[j], C[i]); }
}
// outline in the (u, y) plane of a frame, extruded along v from v0 to v1 (arches, gables, shells)
function fshape(B, F, s, k, pts, v0, v1, sides){
  const tri = THREE.ShapeUtils.triangulateShape(pts.map(p => new THREE.Vector2(p[0], p[1])), []);
  for (const vv of [v0, v1]) for (const t of tri) B.tri(s, k, F(pts[t[0]][0], pts[t[0]][1], vv), F(pts[t[1]][0], pts[t[1]][1], vv), F(pts[t[2]][0], pts[t[2]][1], vv));
  if (sides !== false) for (let i = 0; i < pts.length; i++){ const p = pts[i], q = pts[(i + 1) % pts.length]; B.quad(s, k, F(p[0], p[1], v0), F(q[0], q[1], v0), F(q[0], q[1], v1), F(p[0], p[1], v1)); }
}
// plan polygon prism [[x, z], ...] from y0 to y1 (absolute in the group), with a top cap (cap colour kc)
function prism(B, s, k, P, y0, y1, kc, sTop){
  for (let i = 0; i < P.length; i++){ const p = P[i], q = P[(i + 1) % P.length]; B.quad(s, k, [p[0], y0, p[1]], [q[0], y0, q[1]], [q[0], y1, q[1]], [p[0], y1, p[1]]); }
  if (kc === null) return;
  const tri = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
  for (const t of tri) B.tri(sTop || s, kc || k, [P[t[0]][0], y1, P[t[0]][1]], [P[t[1]][0], y1, P[t[1]][1]], [P[t[2]][0], y1, P[t[2]][1]]);
}
// polygon offset inwards (d > 0) by moving each vertex along the bisector (good enough for convex-ish footprints)
function inset(P, d){
  const n = P.length, s = parea(P) > 0 ? 1 : 1; let A = 0; for (let i = 0, j = n - 1; i < n; j = i++) A += (P[j][0] - P[i][0])*(P[j][1] + P[i][1]); const sg = A > 0 ? 1 : -1;
  return P.map((p, i) => { const a = P[(i + n - 1) % n], b = P[(i + 1) % n];
    let e1 = [p[0] - a[0], p[1] - a[1]], e2 = [b[0] - p[0], b[1] - p[1]]; const l1 = Math.hypot(...e1) || 1, l2 = Math.hypot(...e2) || 1; e1 = [e1[0]/l1, e1[1]/l1]; e2 = [e2[0]/l2, e2[1]/l2];
    const n1 = [-e1[1]*sg, e1[0]*sg], n2 = [-e2[1]*sg, e2[0]*sg], m = [n1[0] + n2[0], n1[1] + n2[1]], ml = Math.hypot(...m) || 1, cs = Math.max(0.35, (n1[0]*m[0] + n1[1]*m[1])/ml);
    return [p[0] + m[0]/ml*d/cs, p[1] + m[1]/ml*d/cs]; });
}
// arch outlines: archTop = the round crown from (-hw, ys) over to (hw, ys); ptArch = a pointed (Mughal / Gothic) opening of height ht
const archTop = (hw, ys, n) => { const P = []; for (let i = 0; i <= n; i++){ const t = PI - PI*i/n; P.push([Math.cos(t)*hw, ys + Math.sin(t)*hw]); } return P; };
const ptArch = (hw, ht, n) => { const hs = ht - 1.732*hw, P = [[-hw, 0], [hw, 0], [hw, hs]]; for (let i = 1; i <= n; i++){ const a = PI/3*i/n; P.push([-hw + 2*hw*Math.cos(a), hs + 2*hw*Math.sin(a)]); } for (let i = n - 1; i >= 1; i--){ const a = PI/3*i/n; P.push([hw - 2*hw*Math.cos(a), hs + 2*hw*Math.sin(a)]); } P.push([-hw, hs]); return P; };
// point along a polyline at arc length t, and the total length
const plen = L => { let s = 0; for (let i = 1; i < L.length; i++) s += Math.hypot(L[i][0] - L[i-1][0], L[i][1] - L[i-1][1]); return s; };
function along(L, t){ for (let i = 1; i < L.length; i++){ const d = Math.hypot(L[i][0] - L[i-1][0], L[i][1] - L[i-1][1]); if (t <= d || i === L.length - 1){ const f = d ? clamp(t/d, 0, 1) : 0; return [lerp(L[i-1][0], L[i][0], f), lerp(L[i-1][1], L[i][1], f), Math.atan2(L[i][1] - L[i-1][1], L[i][0] - L[i-1][0])]; } t -= d; } return [L[0][0], L[0][1], 0]; }
// nearest path point (to turn a miniature's front toward the visitors' walk)
function faceTo(paths, x, z){ let best = 1e9, bx = x, bz = z + 1; for (const L of paths) for (let i = 1; i < L.length; i++){ const a = L[i-1], b = L[i], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx*dx + dz*dz || 1, t = clamp(((x - a[0])*dx + (z - a[1])*dz)/l2, 0, 1), px = a[0] + dx*t, pz = a[1] + dz*t, d = Math.hypot(px - x, pz - z); if (d < best){ best = d; bx = px; bz = pz; } }
  return Math.atan2(bz - z, bx - x) - HP; }   // frame angle so that +v points at the path
// ground under a footprint: lowest / highest of the vertices and the centre
function groundSpan(gy, P){ let lo = Infinity, hi = -Infinity; const c = pcent(P); for (const p of P.concat([c])){ const h = gy(p[0], p[1]); lo = Math.min(lo, h); hi = Math.max(hi, h); } return [lo, hi]; }
// trees scattered in polygons (ctx.tree), lamps along paths (ctx.lamp)
function scatter(ctx, polys, per, cap, kinds, smin, smax, avoid){
  let n = 0; const rng = ctx.rng, tot = polys.reduce((s, P) => s + parea(P), 0); per = Math.max(per, tot/cap);
  for (const P of polys){ const bb = pbb(P), want = Math.min(cap - n, Math.round(parea(P)/per)); let k = 0;
    for (let t = 0; t < want*4 && k < want; t++){ const x = lerp(bb[0], bb[2], rng()), z = lerp(bb[1], bb[3], rng()); if (!pip(P, x, z) || (avoid && avoid(x, z))) continue;
      ctx.tree(x, z, lerp(smin, smax, rng()), kinds[Math.floor(rng()*kinds.length)]); k++; }
    n += k; if (n >= cap) break; }
  return n;
}
function lampsAlong(ctx, paths, step, hgt, rgb, cap, avoid){
  let n = 0;
  for (const L of paths){ const len = plen(L); for (let t = step/2; t < len && n < cap; t += step){ const p = along(L, t), ox = -Math.sin(p[2])*2.2, oz = Math.cos(p[2])*2.2, x = p[0] + ox, z = p[1] + oz; if (avoid && avoid(x, z)) continue; ctx.lamp(x, ctx.gy(x, z) + hgt, z, rgb); n++; } }
  return n;
}
