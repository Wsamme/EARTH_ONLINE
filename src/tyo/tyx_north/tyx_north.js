// City Brush v38 — Tokyo landmarks, group tyx_north: St. Mary's Cathedral, the National Art Center, the National Museum of
// Western Art, Takanawa Gateway Station, Sunshine 60, Ueno Tōshō-gū, Kiyomizu Kannon-dō, Yokohama Stadium, the Sankei-en pagoda.
// Block-scoped: only LANDMARKS and SG_PLACES are touched. Footprints (DN) are the real OSM outlines in local metres (+x along rot, +z south).
{
// ---------- shared batch helpers (from the v37 ueno module) ----------
// ---------- shared batch helpers (one LTris call per colour spec) ----------
const PI = Math.PI, TAU = 2*Math.PI, HP = Math.PI/2;
const mkB = function(){
  const M = new Map();
  const a = spec => { const k = typeof spec === 'string' ? spec : JSON.stringify(spec); let e = M.get(k); if (!e){ e = {spec, p:[]}; M.set(k, e); } return e.p; };
  a.flush = g => { for (const e of M.values()) if (e.p.length) LTris(g, e.p, e.spec); M.clear(); };
  return a;
}
const tri = (p, a, b, c) => { p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); };
const quad = (p, a, b, c, d) => { tri(p, a, b, c); tri(p, a, c, d); };
// frame: local (u along, w across) rotated by ry about y around (cx, cz); returns [x, y, z]
const FR = (cx, cz, ry) => { const c = Math.cos(ry || 0), s = Math.sin(ry || 0); return (u, y, w) => [cx + u*c + w*s, y, cz - u*s + w*c]; };
// box in a frame f: centre (u, w), size du x dw, from y0 to y1
const fbox = function(p, f, u, w, du, dw, y0, y1, top){
  const a = f(u - du/2, y0, w - dw/2), b = f(u + du/2, y0, w - dw/2), c = f(u + du/2, y0, w + dw/2), d = f(u - du/2, y0, w + dw/2);
  const A = f(u - du/2, y1, w - dw/2), B = f(u + du/2, y1, w - dw/2), C = f(u + du/2, y1, w + dw/2), D = f(u - du/2, y1, w + dw/2);
  quad(p, a, b, B, A); quad(p, b, c, C, B); quad(p, c, d, D, C); quad(p, d, a, A, D); if (top !== false) quad(p, A, B, C, D);
}
const box = (p, cx, cz, w, d, y0, y1, ry) => fbox(p, FR(cx, cz, ry), 0, 0, w, d, y0, y1);
// polygon prism [[x, z], ...] from y0 to y1 (walls + top cap, optional bottom)
const prism = function(p, P, y0, y1, top, bot){
  const n = P.length;
  for (let i = 0; i < n; i++){ const a = P[i], b = P[(i + 1) % n]; quad(p, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); }
  if (top !== false || bot){ const T = THREE.ShapeUtils.triangulateShape(P.map(q => new THREE.Vector2(q[0], q[1])), []);
    for (const t of T){ const A = P[t[0]], Bq = P[t[1]], C = P[t[2]]; if (top !== false) tri(p, [A[0], y1, A[1]], [Bq[0], y1, Bq[1]], [C[0], y1, C[1]]); if (bot) tri(p, [A[0], y0, A[1]], [Bq[0], y0, Bq[1]], [C[0], y0, C[1]]); } }
}
// flat polygon at height y
const flat = function(p, P, y){ const T = THREE.ShapeUtils.triangulateShape(P.map(q => new THREE.Vector2(q[0], q[1])), []); for (const t of T){ const A = P[t[0]], Bq = P[t[1]], C = P[t[2]]; tri(p, [A[0], y, A[1]], [Bq[0], y, Bq[1]], [C[0], y, C[1]]); } }
// square-section beam between two points (half-width r)
const beam = function(p, A, Bq, r){
  const d = [Bq[0] - A[0], Bq[1] - A[1], Bq[2] - A[2]], L = Math.hypot(...d); if (L < 1e-4) return;
  const t = [d[0]/L, d[1]/L, d[2]/L], up = Math.abs(t[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let u = [t[1]*up[2] - t[2]*up[1], t[2]*up[0] - t[0]*up[2], t[0]*up[1] - t[1]*up[0]]; const lu = Math.hypot(...u); u = u.map(q => q/lu*r);
  const v = [t[1]*u[2] - t[2]*u[1], t[2]*u[0] - t[0]*u[2], t[0]*u[1] - t[1]*u[0]];
  const C = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([a, b]) => [u[0]*a + v[0]*b, u[1]*a + v[1]*b, u[2]*a + v[2]*b]);
  for (let i = 0; i < 4; i++){ const c0 = C[i], c1 = C[(i + 1) % 4]; quad(p, [A[0] + c0[0], A[1] + c0[1], A[2] + c0[2]], [A[0] + c1[0], A[1] + c1[1], A[2] + c1[2]], [Bq[0] + c1[0], Bq[1] + c1[1], Bq[2] + c1[2]], [Bq[0] + c0[0], Bq[1] + c0[1], Bq[2] + c0[2]]); }
}
// loft through closed rings of [x, y, z] (same count), optional top cap
const loft = function(p, S, cap){
  const n = S[0].length;
  for (let s = 0; s < S.length - 1; s++) for (let i = 0; i < n; i++){ const j = (i + 1) % n; quad(p, S[s][i], S[s][j], S[s + 1][j], S[s + 1][i]); }
  if (cap){ const T = S[S.length - 1], c = [0, 0, 0]; for (const q of T){ c[0] += q[0]/n; c[1] += q[1]/n; c[2] += q[2]/n; } for (let i = 0; i < n; i++) tri(p, c, T[i], T[(i + 1) % n]); }
}
// surface of revolution: profile [[r, y], ...] around (cx, cz), n segments
const lathe = function(p, prof, n, cx, cz, a0, a1){
  a0 = a0 || 0; a1 = a1 === undefined ? TAU : a1; const full = Math.abs(a1 - a0 - TAU) < 1e-6;
  for (let i = 0; i < n; i++){ const t0 = a0 + (a1 - a0)*i/n, t1 = a0 + (a1 - a0)*(i + 1)/n;
    for (let k = 0; k < prof.length - 1; k++){ const [r0, y0] = prof[k], [r1, y1] = prof[k + 1];
      quad(p, [cx + Math.cos(t0)*r0, y0, cz - Math.sin(t0)*r0], [cx + Math.cos(t1)*r0, y0, cz - Math.sin(t1)*r0], [cx + Math.cos(t1)*r1, y1, cz - Math.sin(t1)*r1], [cx + Math.cos(t0)*r1, y1, cz - Math.sin(t0)*r1]); } }
  return full;
}
const cyl = (p, cx, cz, r0, r1, y0, y1, n, cap) => { lathe(p, cap ? [[0, y0], [r0, y0], [r1, y1], [0, y1]] : [[r0, y0], [r1, y1]], n, cx, cz); };
// offset a ring outward by d (convex-ish rings)
const offRing = function(P, d){ const n = P.length, out = []; let A = 0; for (let i = 0; i < n; i++){ const a = P[i], b = P[(i + 1) % n]; A += a[0]*b[1] - b[0]*a[1]; } const s = A > 0 ? 1 : -1;
  for (let i = 0; i < n; i++){ const a = P[(i + n - 1) % n], b = P[i], c = P[(i + 1) % n];
    const n1 = [(b[1] - a[1]), -(b[0] - a[0])], n2 = [(c[1] - b[1]), -(c[0] - b[0])], l1 = Math.hypot(...n1) || 1, l2 = Math.hypot(...n2) || 1;
    const m = [n1[0]/l1 + n2[0]/l2, n1[1]/l1 + n2[1]/l2], lm = Math.hypot(...m) || 1, cs = (n1[0]*n2[0] + n1[1]*n2[1])/(l1*l2), k = d/Math.max(0.35, Math.sqrt((1 + cs)/2));
    out.push([b[0] + s*m[0]/lm*k, b[1] + s*m[1]/lm*k]); }
  return out; }
const inPoly = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0])*(z - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; };
// East-Asian curved roof sheet over a rectangle (frame f, centre u0,w0, L x W at eave height y, rise h); irimoya when gab>0
const eaveRoof = function(B, f, o){
  const n = o.n || 6, nt = o.nt || 6, pw = o.pw || 1.7, lift = o.lift || 0, hl0 = o.L/2, hw0 = o.W/2, kk = o.k !== undefined ? o.k : Math.max(0, hl0 - hw0), gab = o.gab || 0;
  const ext = u => gab ? (u < gab ? hl0 + (kk - hl0)*u/gab : kk) : hl0 + (kk - hl0)*u;
  const ring = (u, dy) => { const a = ext(u), b = hw0*(1 - u), y = o.y + o.h*Math.pow(u, pw) + dy, P = [], C = [[-a, -b], [a, -b], [a, b], [-a, b]];
    for (let s = 0; s < 4; s++){ const A = C[s], Bq = C[(s + 1) % 4]; for (let i = 0; i < n; i++){ const t = i/n, cc = Math.pow(Math.abs(2*t - 1), 3), lu = lift*cc*Math.pow(1 - u, 2); P.push(f((o.u || 0) + A[0] + (Bq[0] - A[0])*t, y + lu, (o.w || 0) + A[1] + (Bq[1] - A[1])*t)); } }
    return P; };
  const S = []; if (o.fas) S.push(ring(0, -o.fas)); for (let i = 0; i <= nt; i++) S.push(ring(i/nt, 0));
  loft(B(o.col), S, !gab && kk < 0.01);
  const yt = o.y + o.h;
  if (gab){ const yg = o.y + o.h*Math.pow(gab, pw), bg = hw0*(1 - gab); for (const s of [-1, 1]){ const x = (o.u || 0) + s*kk; tri(B(o.gcol || o.col), f(x, yg, (o.w || 0) - bg), f(x, yg, (o.w || 0) + bg), f(x, yt, o.w || 0)); } }
  if (o.ridge && kk > 0.3){ fbox(B(o.rcol || o.col), f, o.u || 0, o.w || 0, 2*kk + o.ridge*2, o.ridge, yt - o.ridge*0.3, yt + o.ridge*1.1); }
  return yt;
}

// ---------- temple parts ----------
// curved hip / hip-and-gable (irimoya) roof in frame f. o: {u, w, L, W, y (eave edge), h (rise), k (ridge half-length), gab (0..1:
// where the gable starts), pw (concavity), lift (corner upturn), col, und (underside colour), hip (hip-ridge colour), rw (ridge width)}
const tRoof = (B, f, o) => {
  const n = o.n || 6, nt = o.nt || 7, pw = o.pw || 1.7, lift = o.lift || 0, hl0 = o.L/2, hw0 = o.W/2, kk = o.k !== undefined ? o.k : 0, gab = o.gab || 0;
  const u0 = o.u || 0, w0 = o.w || 0;
  const ext = u => gab ? (u < gab ? hl0 + (kk - hl0)*u/gab : kk) : hl0 + (kk - hl0)*u;
  const yAt = u => o.y + o.h*Math.pow(u, pw);
  const ring = (u, dy, sc) => { const a = ext(u), b = hw0*(1 - u), y = yAt(u) + dy, P = [], C = [[-a, -b], [a, -b], [a, b], [-a, b]], cor = [];
    for (let s = 0; s < 4; s++){ const A = C[s], Bq = C[(s + 1) % 4]; for (let i = 0; i < n; i++){ const t = i/n, cc = Math.pow(Math.abs(2*t - 1), 3), lu = lift*cc*Math.pow(1 - u, 2.2);
      const q = f(u0 + (A[0] + (Bq[0] - A[0])*t)*(sc || 1), y + lu, w0 + (A[1] + (Bq[1] - A[1])*t)*(sc || 1)); P.push(q); if (i === 0) cor.push(q); } }
    return {P, cor}; };
  const top = gab ? Math.round(gab*nt) : nt, S = [], U = [], H = [[], [], [], []];
  for (let i = 0; i <= top; i++){ const r = ring(i/nt, 0); S.push(r.P); r.cor.forEach((q, s) => H[s].push(q)); if (o.und && i/nt <= 0.45) U.push(ring(i/nt, -0.35, 0.995).P); }
  if (o.fas){ const r = ring(0, -o.fas); S.unshift(r.P); }
  loft(B(o.col), S, false); if (o.und && U.length > 1) loft(B(o.und), U, false);
  const yt = o.y + o.h;
  if (gab){ // upper gable part: two sloped planes from the gable line up to the ridge + the gable triangles
    const ug = top/nt, yg = yAt(ug), bg = hw0*(1 - ug), N = 4;
    for (const s of [-1, 1]){ const S2 = []; for (let i = 0; i <= N; i++){ const t = i/N, w = s*bg*(1 - t), y = yg + (yt - yg)*Math.pow(t, 1.2); S2.push([f(u0 - kk - 0.6, y, w0 + w), f(u0 + kk + 0.6, y, w0 + w)]); }
      for (let i = 0; i < N; i++) quad(B(o.col), S2[i][0], S2[i][1], S2[i + 1][1], S2[i + 1][0]); }
    for (const s of [-1, 1]){ const x = u0 + s*(kk + 0.3); const pts = [f(x, yg, w0 - bg)]; for (let i = 1; i < 4; i++){ const t = i/4; pts.push(f(x, yg + (yt - yg)*Math.pow(t, 1.2), w0 - bg*(1 - t))); } pts.push(f(x, yt, w0));
      for (let i = 3; i >= 1; i--){ const t = i/4; pts.push(f(x, yg + (yt - yg)*Math.pow(t, 1.2), w0 + bg*(1 - t))); } pts.push(f(x, yg, w0 + bg));
      for (let i = 1; i < pts.length - 1; i++) tri(B(o.gcol || o.col), pts[0], pts[i], pts[i + 1]);
      for (let i = 0; i < pts.length - 1; i++) beam(B(o.hip || o.col), pts[i], pts[i + 1], 0.22); }
  }
  if (o.hip) for (const h of H) for (let i = 0; i < h.length - 1; i++) beam(B(o.hip), h[i], h[i + 1], o.rw ? o.rw*0.45 : 0.3);
  if (kk > 0.3) fbox(B(o.hip || o.col), f, u0, w0, 2*kk + 1.2, o.rw || 0.8, yt - 0.3, yt + (o.rw || 0.8)*1.1);
  return yt;
};
// straight-ridged gable roof (kirizuma), ridge along u; concave slopes
const gRoof = (B, f, o) => {
  const N = 6, pw = o.pw || 1.5, hl = o.L/2, hw = o.W/2, u0 = o.u || 0, w0 = o.w || 0;
  for (const s of [-1, 1]){ const S = [], U = []; for (let i = 0; i <= N; i++){ const t = i/N, w = s*hw*(1 - t), y = o.y + o.h*Math.pow(t, pw); S.push([f(u0 - hl, y, w0 + w), f(u0 + hl, y, w0 + w)]); U.push([f(u0 - hl + 0.2, y - 0.3, w0 + w*0.99), f(u0 + hl - 0.2, y - 0.3, w0 + w*0.99)]); }
    for (let i = 0; i < N; i++){ quad(B(o.col), S[i][0], S[i][1], S[i + 1][1], S[i + 1][0]); if (o.und && i < N/2) quad(B(o.und), U[i][0], U[i][1], U[i + 1][1], U[i + 1][0]); }
    for (const e of [0, 1]) for (let i = 0; i < N; i++) beam(B(o.hip || o.col), S[i][e], S[i + 1][e], 0.28); }
  for (const e of [-1, 1]){ const x = u0 + e*(hl - 0.6), pts = []; for (let i = 0; i <= N; i++){ const t = i/N; pts.push(f(x, o.y + o.h*Math.pow(t, pw) - 0.4, w0 - hw*(1 - t)*0.92)); } for (let i = N - 1; i >= 0; i--){ const t = i/N; pts.push(f(x, o.y + o.h*Math.pow(t, pw) - 0.4, w0 + hw*(1 - t)*0.92)); }
    for (let i = 1; i < pts.length - 1; i++) tri(B(o.gcol || o.col), pts[0], pts[i], pts[i + 1]); }
  const yt = o.y + o.h; fbox(B(o.hip || o.col), f, u0, w0, o.L + 0.4, o.rw || 0.7, yt - 0.25, yt + (o.rw || 0.7)*1.2);
  return yt;
};
// round column (8 sides) and a lantern (chōchin): red body with black rims, glowing at night
const col8 = (p, x, z, r, y0, y1) => cyl(p, x, z, r, r, y0, y1, 8);
const chochin = (B, c, r, y0, h, RED, BLK) => {
  const prof = []; for (let i = 0; i <= 8; i++){ const t = i/8, rr = r*(0.86 + 0.14*Math.sin(PI*t)); prof.push([rr, y0 + 0.28 + (h - 0.56)*t]); }
  lathe(B(RED), prof, 16, c[0], c[2]); cyl(B(BLK), c[0], c[2], r*0.9, r*0.9, y0, y0 + 0.3, 16, true); cyl(B(BLK), c[0], c[2], r*0.88, r*0.88, y0 + h - 0.3, y0 + h, 16, true);
};
// lattice screen (kōshi) in frame f along u at w, from u0..u1, y0..y1
const koshi = (p, f, u0, u1, w, y0, y1, step) => { for (let u = u0; u <= u1 + 1e-6; u += step) fbox(p, f, u, w, 0.13, 0.13, y0, y1); for (const y of [y0, y1]) fbox(p, f, (u0 + u1)/2, w, u1 - u0, 0.16, y - 0.09, y + 0.09); };
// the same across w (at u)
const koshiW = (p, f, w0, w1, u, y0, y1, step) => { for (let w = w0; w <= w1 + 1e-6; w += step) fbox(p, f, u, w, 0.13, 0.13, y0, y1); for (const y of [y0, y1]) fbox(p, f, u, (w0 + w1)/2, 0.16, w1 - w0, y - 0.09, y + 0.09); };
// a low footbridge deck with railings along a path line [[x, z], ...] (sites; y absolute from gy)
// ---------- tyx_north extras ----------
const ID = FR(0, 0, 0);
const RED = {c:'#c22', glow:'#ff2a1a', gk:2.2};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a)*t;
// bilinear point of a quad patch A(u0v0) B(u1v0) C(u1v1) D(u0v1)
const bil = (A, Bq, C, Dq, u, v) => [0, 1, 2].map(i => (1 - u)*(1 - v)*A[i] + u*(1 - v)*Bq[i] + u*v*C[i] + (1 - u)*v*Dq[i]);
const patch = (p, A, Bq, C, Dq, nu, nv) => { for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++){
  quad(p, bil(A, Bq, C, Dq, i/nu, j/nv), bil(A, Bq, C, Dq, (i + 1)/nu, j/nv), bil(A, Bq, C, Dq, (i + 1)/nu, (j + 1)/nv), bil(A, Bq, C, Dq, i/nu, (j + 1)/nv)); } };
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul = (a, s) => [a[0]*s, a[1]*s, a[2]*s];
const cross3 = (a, b) => [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
const nrm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0]/l, a[1]/l, a[2]/l]; };
// ray from (ox, oz) along (dx, dz) against polygon P [[x, z], ...]: farthest hit distance (0 if none)
const rayFar = (P, ox, oz, dx, dz) => { let best = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], ex = b[0] - a[0], ez = b[1] - a[1], den = dx*ez - dz*ex;
  if (Math.abs(den) < 1e-9) continue; const t = ((a[0] - ox)*ez - (a[1] - oz)*ex)/den, s = ((a[0] - ox)*dz - (a[1] - oz)*dx)/den; if (s >= -1e-6 && s <= 1 + 1e-6 && t > best) best = t; } return best; };
// densify an open polyline to a max step
const dens = (P, step) => { const out = [P[0]]; for (let i = 1; i < P.length; i++){ const a = P[i - 1], b = P[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L/step));
  for (let k = 1; k <= n; k++) out.push([a[0] + (b[0] - a[0])*k/n, a[1] + (b[1] - a[1])*k/n]); } return out; };
// vertical wall along an open polyline
const wallLine = (p, P, y0, y1) => { for (let i = 0; i < P.length - 1; i++){ const a = P[i], b = P[i + 1]; quad(p, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); } };
// box along a segment (a -> b), width w, y0..y1
const segBox = (p, a, b, w, y0, y1) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.05) return; fbox(p, FR((a[0] + b[0])/2, (a[1] + b[1])/2, Math.atan2(-(b[1] - a[1]), b[0] - a[0])), 0, 0, L, w, y0, y1); };
// rectangle polygon
const rectP = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
// torus (vertical ring) in the plane spanned by e1 (unit, horizontal) and +y, centre c
const torusV = (p, c, e1, R, r, n, m) => { const P = (i, j) => { const a = TAU*i/n, b = TAU*j/m, rr = R + r*Math.cos(b), h = Math.cos(a)*rr, v = Math.sin(a)*rr, o = r*Math.sin(b), e2 = [-e1[2], 0, e1[0]];
    return [c[0] + e1[0]*h + e2[0]*o, c[1] + v, c[2] + e1[2]*h + e2[2]*o]; };
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) quad(p, P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)); };
// a 3-storey / n-storey pagoda in frame f (base at y0). T = [[body w, roof span, base y, wall h], ...]
const pagoda = (B, g, f, y0, T, C, fin) => {
  for (let k = 0; k < T.length; k++){ const [bw, rw, yb, wh] = T[k], yB = y0 + yb, yt = yB + wh, top = k === T.length - 1;
    fbox(B(C.wall), f, 0, 0, bw - 0.3, bw - 0.3, yB, yt);
    for (const s of [-1, 1]){ for (const t of [-0.5, -1/6, 1/6, 0.5]){ fbox(B(C.ver), f, t*(bw - 0.3), s*(bw/2 - 0.12), 0.32, 0.32, yB, yt); fbox(B(C.ver), f, s*(bw/2 - 0.12), t*(bw - 0.3), 0.32, 0.32, yB, yt); }
      fbox(B(C.door), f, 0, s*(bw/2 - 0.1), bw*0.28, 0.1, yB + 0.1, yt - 0.45); fbox(B(C.door), f, s*(bw/2 - 0.1), 0, 0.1, bw*0.28, yB + 0.1, yt - 0.45); }
    fbox(B(C.ver), f, 0, 0, bw + 0.1, bw + 0.1, yt - 0.35, yt);
    if (k > 0){ for (const s of [-1, 1]){ fbox(B(C.ver), f, 0, s*(bw/2 + 0.55), bw + 1.3, 0.1, yB + 0.55, yB + 0.68); fbox(B(C.ver), f, s*(bw/2 + 0.55), 0, 0.1, bw + 1.3, yB + 0.55, yB + 0.68); }
      fbox(B(C.und), f, 0, 0, bw + 1.3, bw + 1.3, yB - 0.1, yB + 0.05); }
    fbox(B(C.brk), f, 0, 0, bw + 0.8, bw + 0.8, yt, yt + 0.55); fbox(B(C.wall), f, 0, 0, bw + 1.5, bw + 1.5, yt + 0.55, yt + 0.8);
    tRoof(B, f, {L:rw, W:rw, y:yt + 0.7, h:top ? 2.3 : 1.1, k:0, pw:1.25, lift:0.5, col:C.roof, hip:C.rid, und:C.und, rw:0.3, nt:4, n:5}); }
  const tt = T[T.length - 1], ys = y0 + tt[2] + tt[3] + 0.7 + 2.3;
  fbox(B(C.rid), f, 0, 0, 1.2, 1.2, ys - 0.35, ys + 0.35);
  const c = f(0, 0, 0); cyl(B(C.fin), c[0], c[2], 0.13, 0.09, ys + 0.35, ys + fin, 6);
  for (let i = 0; i < 9; i++){ const y = ys + 1.0 + i*(fin - 2.6)/9; cyl(B(C.fin), c[0], c[2], 0.55 - i*0.02, 0.55 - i*0.02, y, y + 0.2, 10, true); }
  LSph(g, 0.26, c[0], ys + fin + 0.1, c[2], C.fin, 1.2, 8);
  return ys + fin;
};
const DN = {"tynact":{"lat":35.6651874,"lon":139.7263664,"rot":-0.0065,"ring":[[-79.5,25.72],[-73.1,25.78],[-66.8,26.44],[-60.77,30.3],[-56.24,35.47],[-52.44,36.35],[-49.24,36.03],[-44.72,38.1],[-41.41,40.78],[-36.97,46.65],[-32.56,48.02],[-28.77,47.0],[-22.89,43.56],[-18.39,42.63],[-14.19,43.1],[-9.77,46.17],[-0.01,55.01],[3.49,55.69],[7.29,55.46],[22.22,44.27],[25.61,42.95],[29.51,42.32],[39.02,44.16],[42.63,45.74],[42.25,48.74],[42.88,54.13],[45.11,58.22],[47.02,60.31],[51.84,62.48],[56.13,61.85],[58.92,60.03],[60.6,56.42],[61.18,53.42],[60.86,50.12],[59.03,46.03],[55.91,43.05],[51.9,40.98],[54.67,36.36],[62.83,30.41],[70.7,26.45],[73.4,25.94],[79.5,26.0],[79.41,12.5],[76.01,12.52],[75.93,-62.48],[-63.47,-62.48],[-61.46,16.31],[-79.46,16.42]]},"tysunshine60":{"lat":35.7294062,"lon":139.7181566,"rot":-0.5888,"ring":[[-36.61,21.47],[36.5,21.47],[36.61,-21.41],[-36.42,-21.47]],"pent":[[-32.02,8.54],[32.02,8.46],[32.01,-8.48],[-31.94,-8.46]]},"tystmary":{"lat":35.71428,"lon":139.7265067,"rot":-0.4303,"ring":[[-24.16,18.57],[-1.47,30.6],[1.97,24.18],[9.49,28.1],[13.09,20.84],[9.43,19.11],[11.34,15.37],[19.55,21.5],[23.19,21.04],[26.5,15.79],[34.87,7.65],[43.53,1.59],[43.36,-4.06],[38.21,-6.64],[33.63,-10.15],[29.14,-14.91],[22.46,-23.95],[18.96,-23.89],[15.23,-19.31],[11.73,-16.16],[9.41,-20.49],[12.97,-22.57],[9.05,-29.68],[4.72,-27.36],[2.45,-31.82],[-16.14,-21.97],[-17.19,-24.02],[-24.74,-20.11],[-23.14,-17.11],[-20.96,-18.33],[-18.85,-14.46],[-19.53,-14.03],[-15.78,-7.28],[-14.78,-7.74],[-13.81,-5.88],[-20.18,-3.94],[-20.22,1.25],[-13.74,4.11],[-14.7,6.09],[-15.85,5.51],[-19.31,12.82],[-18.34,13.26],[-20.21,17.09],[-22.81,15.75]],"cross":[[-20.22,1.25],[19.75,0.84],[19.55,21.5],[23.19,21.04],[22.88,0.94],[43.53,1.59],[43.36,-4.06],[22.13,-3.33],[22.46,-23.95],[18.96,-23.89],[19.65,-2.97],[-20.18,-3.94]],"bell":[[-37.69,11.73],[-39.17,17.39],[-34.92,17.02]]},"tywesternart":{"lat":35.7153643,"lon":139.7758791,"rot":-0.5076,"main":[[20.26,20.23],[-20.42,20.24],[-20.37,6.59],[-20.32,-5.05],[-20.26,-20.22],[20.43,-20.23]],"wing":[[-36.23,6.67],[-36.25,-36.64],[-29.95,-36.66],[-29.97,-66.6],[-20.4,-66.64],[-20.4,-69.31],[25.28,-69.53],[25.29,-59.92],[28.53,-59.93],[28.54,-28.96],[11.87,-28.88],[11.85,-59.1],[-6.8,-59.01],[-6.79,-52.95],[-13.24,-52.92],[-13.22,-28.33],[-23.29,-28.28],[-23.28,-5.03],[-20.32,-5.05],[-20.37,6.59]]},"tytoshogu":{"lat":35.7153733,"lon":139.7706585,"rot":-0.073,"ring":[[11.48,5.89],[10.01,5.9],[10.02,10.47],[-2.27,10.52],[-2.3,6.51],[-16.12,6.56],[-16.17,-5.97],[-7.0,-6.11],[-7.21,-10.42],[-14.12,-10.27],[-14.07,-15.7],[-2.58,-15.79],[-2.59,-10.33],[9.75,-10.27],[9.98,-4.82],[11.5,-4.82]],"wall":[[20.56,2.55],[20.53,18.02],[-20.57,17.98],[-20.51,-18.01],[20.57,-17.97],[20.54,-2.34]]},"tykiyomizu":{"lat":35.7127179,"lon":139.7735178,"rot":0.1496,"ring":[[-6.09,-19.8],[-6.08,-4.62],[-1.17,-4.61],[-1.16,2.04],[-6.14,2.03],[-6.14,4.38],[-10.78,4.38],[-10.76,21.08],[-6.78,21.09],[-6.78,21.95],[10.78,21.96],[10.76,2.89],[3.74,2.89],[3.73,-4.55],[8.18,-4.55],[8.16,-19.72],[6.71,-19.72],[6.71,-21.94],[-0.67,-21.96],[-0.67,-19.79]],"pine":[-15.27,10.82]},"tytakanawa":{"lat":35.6354616,"lon":139.7406533,"rot":1.2729,"ring":[[-78.96,-19.93],[-80.15,16.41],[78.66,22.26],[80.14,-19.93],[15.83,-22.26],[15.63,-16.44]],"rail0":[[-399.91,-11.46],[-287.66,-7.01],[-124.58,-14.51],[109.23,-5.96],[243.51,7.21],[406.16,8.53],[510.53,12.89]],"rail1":[[-423.14,-4.64],[-296.32,1.93],[-84.03,1.39],[104.8,9.94],[229.79,18.75]],"rail2":[[229.79,18.75],[251.44,19.42],[273.12,20.19],[294.87,20.84],[316.55,21.61],[338.32,22.35],[359.98,23.02],[381.66,23.79],[401.53,23.45],[421.4,23.1],[441.28,22.75],[462.67,21.2],[484.05,19.66],[507.05,17.2]]},"tyyokostadium":{"lat":35.443274,"lon":139.6400876,"rot":0.2643,"ring":[[-110.21,-43.89],[-114.35,-25.54],[-115.34,-13.06],[-114.19,-1.25],[-110.39,20.7],[-92.01,15.94],[-90.48,23.71],[-85.92,36.34],[-79.58,48.1],[-70.6,60.48],[-64.01,67.13],[-53.69,75.72],[-41.09,82.76],[-42.63,86.9],[-27.54,100.82],[-16.45,103.1],[-18.84,106.18],[-3.15,120.17],[3.31,120.05],[18.84,105.91],[17.0,103.14],[28.14,100.66],[43.87,86.17],[42.35,81.82],[54.05,75.35],[63.2,68.71],[70.58,62.11],[76.76,53.42],[85.88,35.79],[91.54,11.42],[111.58,15.5],[114.21,3.47],[115.45,-8.01],[115.65,-19.87],[114.12,-32.19],[111.53,-45.22],[108.67,-53.77],[102.23,-68.25],[94.14,-81.63],[88.48,-81.4],[81.64,-77.55],[66.73,-65.32],[59.01,-72.8],[47.54,-80.56],[26.33,-88.69],[11.91,-92.07],[-3.23,-92.02],[-17.6,-90.21],[-31.25,-86.45],[-46.27,-79.95],[-57.61,-72.13],[-65.09,-65.56],[-70.79,-59.02],[-76.52,-52.39],[-79.02,-47.37],[-94.19,-53.34],[-106.61,-54.52]],"bowl":[[-41.64,82.48],[-46.9,79.85],[-53.68,75.72],[-64.0,67.15],[-70.64,60.47],[-74.5,55.21],[-79.59,48.15],[-83.37,41.24],[-85.91,36.32],[-90.46,23.69],[-91.99,15.94],[-92.18,14.92],[-92.52,11.07],[-92.85,6.4],[-92.93,1.41],[-92.93,-3.49],[-92.48,-8.01],[-91.59,-13.08],[-90.53,-18.01],[-89.47,-22.47],[-88.19,-26.94],[-86.55,-31.67],[-84.26,-36.85],[-81.8,-41.93],[-79.06,-47.42],[-76.48,-52.4],[-72.52,-57.04],[-70.81,-59.07],[-68.87,-61.3],[-66.62,-63.9],[-65.09,-65.59],[-57.64,-72.16],[-46.24,-79.94],[-31.24,-86.43],[-17.61,-90.26],[-3.19,-91.97],[11.88,-92.04],[19.27,-90.6],[26.3,-88.69],[37.72,-84.7],[47.57,-80.6],[58.98,-72.82],[62.89,-69.37],[66.76,-65.34],[68.61,-63.02],[71.95,-58.69],[75.07,-53.65],[78.02,-48.27],[80.6,-43.52],[83.2,-37.88],[85.3,-32.75],[86.78,-28.23],[88.13,-23.62],[89.55,-18.88],[90.36,-14.31],[91.25,-9.1],[91.78,-4.55],[92.07,0.31],[92.02,5.56],[91.76,9.56],[91.52,11.37],[89.13,22.67],[85.86,35.79],[76.77,53.47],[70.6,62.12],[63.17,68.66],[54.07,75.37],[50.78,77.42],[43.76,81.12],[42.34,81.82],[39.45,83.26],[34.82,85.39],[29.82,87.36],[24.83,88.84],[19.64,90.14],[14.7,91.18],[9.61,92.07],[4.82,92.59],[-0.56,92.96],[-6.18,92.56],[-12.12,91.97],[-17.7,90.95],[-22.52,89.72],[-27.77,88.17],[-32.94,86.39],[-38.14,84.24],[-41.09,82.75]],"home":[[0.1,38.89]],"mound":[[0.1,21.28]],"pitch":[[-27.44,11.26],[-63.27,-24.31],[-60.82,-33.84],[-57.49,-40.84],[-53.45,-47.58],[-48.74,-52.87],[-43.76,-58.0],[-39.83,-61.5],[-34.98,-64.79],[-30.15,-67.65],[-25.53,-70.09],[-21.4,-71.89],[-16.77,-73.05],[-12.05,-73.98],[-7.45,-74.84],[-3.19,-75.21],[1.52,-75.12],[6.58,-74.47],[10.76,-73.96],[15.33,-73.03],[20.16,-71.72],[25.07,-69.73],[29.31,-67.75],[33.87,-65.04],[38.65,-61.79],[43.25,-57.93],[47.87,-53.76],[52.49,-47.48],[57.06,-39.68],[61.44,-30.6],[62.63,-24.91],[27.16,11.02],[26.24,8.14],[24.6,5.09],[22.12,1.66],[18.6,-1.47],[14.36,-4.87],[8.94,-6.84],[4.4,-8.07],[-0.3,-8.68],[-4.66,-8.42],[-8.2,-7.41],[-12.63,-5.78],[-16.06,-4.1],[-19.7,-1.17],[-24.84,4.98],[-26.7,8.9]],"infield":[[-4.01,36.82],[-28.37,14.25],[-27.59,11.73],[-27.44,11.26],[-26.7,8.9],[-24.84,4.98],[-19.7,-1.17],[-16.06,-4.1],[-12.63,-5.78],[-8.2,-7.41],[-4.66,-8.42],[-0.3,-8.68],[4.4,-8.07],[8.94,-6.84],[14.36,-4.87],[18.6,-1.47],[22.12,1.66],[24.6,5.09],[26.24,8.14],[27.16,11.02],[27.32,11.54],[28.09,13.94],[4.35,37.41],[3.99,36.59],[2.84,35.26],[16.02,22.05],[14.62,16.17],[2.36,4.07],[-2.44,4.08],[-14.6,16.24],[-14.91,21.96],[-2.78,35.28]],"p0":[[-18.84,106.18],[-3.15,120.17],[3.31,120.05],[18.84,105.91],[17.0,103.14],[-0.05,104.12],[-16.45,103.1]],"p1":[[-42.63,86.9],[-27.54,100.82],[-16.45,103.1],[-0.05,104.12],[17.0,103.14],[28.14,100.66],[43.87,86.17],[40.21,75.95],[30.43,79.94],[20.33,82.8],[5.59,84.82],[-4.39,85.33],[-19.64,83.49],[-29.82,80.52],[-38.87,76.83]],"p2":[[66.73,-65.32],[71.99,-58.72],[80.62,-43.54],[86.73,-28.21],[89.58,-18.84],[91.28,-9.06],[92.07,0.28],[91.54,11.42],[111.58,15.5],[114.21,3.47],[115.45,-8.01],[115.65,-19.87],[114.96,-26.48],[110.78,-47.81],[105.58,-61.13],[99.04,-74.09],[94.14,-81.63],[88.48,-81.4],[81.64,-77.55]],"p3":[[-110.21,-43.89],[-114.35,-25.54],[-115.34,-13.06],[-114.19,-1.25],[-110.39,20.7],[-92.01,15.94],[-92.84,6.39],[-92.97,-3.49],[-91.62,-13.07],[-89.5,-22.44],[-86.58,-31.7],[-79.02,-47.37],[-94.19,-53.34],[-106.61,-54.52]],"ph":[9.0,35.0,31.0,31.0]},"tysankeien":{"lat":35.4163586,"lon":139.6592448,"rot":-0.6541,"ring":[[-5.25,5.21],[-5.25,-5.19],[5.25,-5.21],[5.25,5.19]]}};
// ===== St. Mary's Cathedral, Tokyo (东京圣玛利亚主教座堂), Tange Kenzō, 1964. Facts used: shells 39.42 m, bell tower 61.68 m
// (structurae); building area 2,541 m², 8 reinforced-concrete HP shells, continuous stainless-steel cladding strips up to ~40 m long,
// ribs ~2 m apart, cross-shaped top light (nikkenren ACe 2012); rhomboid ground plan turning into a cross of light at roof level,
// the light band running down all four facades (archeyes); ~55 m long (japanvisitor). The cross arms follow the OSM building:part
// "cathedral" (40 m) of w120704384; the bell tower is OSM w120704385 (man_made=tower, bell_tower). Each of the 8 shells is a
// bilinear (= hyperbolic-paraboloid) patch from the tall glazed slit at an arm end, along the skylight to the crossing, down a fold
// to the ground line between two arm ends. Arm-end heights other than the 39.4 m one and the crossing height are estimates.
// Local +x = east arm (altar end, tallest), -x = the nave towards the west entrance and the bell tower.
LANDMARKS.tystmary = {zh:'东京圣玛利亚主教座堂', en:"St. Mary's Cathedral, Tokyo", cat:'new', r:46, h:61.7,
  lt:{m:0, c:'#e4eeff', k:0.95, e:0.55},
  build(){
    const g = new THREE.Group(), B = mkB(), D = DN.tystmary;
    const SS = {c:'#c4cad0', m:0, lc:'#eaf2ff', lk:1.0, ds:true}, RIB = {c:'#e2e6e9', m:0, lc:'#f2f7ff', lk:1.0}, GLs = {c:'#46525a', glow:'#ffdcae', gk:0.85, ds:true},
      CONC = {c:'#b6b2a9', m:0, lk:0.6}, BELL = {c:'#c9c6be', m:0, lc:'#eef3ff', lk:1.2}, CRS = {c:'#ece6d2', glow:'#fff2d2', gk:0.7}, DOOR = '#3a3632';
    const C = [21.2, -1.4], Hc = 21.0;
    // arms in angular order E, S, W, N (each +90° in x/z with z south)
    const arms = [{E:[43.5, -1.25], H:39.4, hw:2.7}, {E:[21.4, 21.5], H:31.0, hw:1.8}, {E:[-20.2, -1.35], H:35.5, hw:2.7}, {E:[21.0, -23.9], H:31.0, hw:1.8}];
    const push = [0.6, 0.0, 0.0, 3.0];   // E-S, S-W, W-N, N-E ground-line bulge (the S-W and W-N sides carry low annexes)
    for (const a of arms){ const d = [a.E[0] - C[0], a.E[1] - C[1]], l = Math.hypot(d[0], d[1]); a.d = [d[0]/l, d[1]/l]; }
    const P3 = (x, z, y) => [x, y, z];
    const K = [], M = [];
    for (let i = 0; i < 4; i++){ const a = arms[i], b = arms[(i + 1) % 4];
      K.push([C[0] + a.d[0]*b.hw + b.d[0]*a.hw, C[1] + a.d[1]*b.hw + b.d[1]*a.hw]);
      const m = [(a.E[0] + b.E[0])/2, (a.E[1] + b.E[1])/2], o = [m[0] - C[0], m[1] - C[1]], ol = Math.hypot(o[0], o[1]);
      M.push([m[0] + o[0]/ol*push[i], m[1] + o[1]/ol*push[i]]); }
    const shells = [];
    for (let i = 0; i < 4; i++){ const a = arms[i], b = arms[(i + 1) % 4], k = K[i], m = M[i];
      // shell of arm a on b's side, and of arm b on a's side
      const ea = [a.E[0] + b.d[0]*a.hw, a.E[1] + b.d[1]*a.hw], eb = [b.E[0] + a.d[0]*b.hw, b.E[1] + a.d[1]*b.hw];
      shells.push([P3(ea[0], ea[1], 0), P3(ea[0], ea[1], a.H), P3(k[0], k[1], Hc), P3(m[0], m[1], 0)]);
      shells.push([P3(eb[0], eb[1], 0), P3(eb[0], eb[1], b.H), P3(k[0], k[1], Hc), P3(m[0], m[1], 0)]); }
    for (const s of shells){ patch(B(SS), s[0], s[1], s[2], s[3], 12, 10);
      // standing-seam ribs (constant v lines, ground -> top), offset outward
      for (let j = 1; j < 14; j++){ const v = j/14, NU = 10; let prevL = null, prevR = null;
        for (let i = 0; i <= NU; i++){ const u = i/NU, P = bil(...s, u, v), du = sub(bil(...s, Math.min(1, u + 0.02), v), bil(...s, Math.max(0, u - 0.02), v)), dv = sub(bil(...s, u, Math.min(1, v + 0.02)), bil(...s, u, Math.max(0, v - 0.02)));
          let n = nrm(cross3(du, dv)); const cc = sub(P, [C[0], P[1], C[1]]); if (n[0]*cc[0] + n[2]*cc[2] < 0) n = mul(n, -1);
          const sd = mul(nrm(dv), 0.13), o = mul(n, 0.1), L = add(add(P, o), mul(sd, -1)), Rr = add(add(P, o), sd);
          if (prevL) quad(B(RIB), prevL, prevR, Rr, L); prevL = L; prevR = Rr; } } }
    // the glazed slits at the arm ends and the skylight cross
    for (let i = 0; i < 4; i++){ const a = arms[i], pa = [-a.d[1], a.d[0]], e = [a.E[0] - a.d[0]*0.4, a.E[1] - a.d[1]*0.4];
      const L = [e[0] + pa[0]*a.hw, e[1] + pa[1]*a.hw], Rr = [e[0] - pa[0]*a.hw, e[1] - pa[1]*a.hw];
      quad(B(GLs), P3(L[0], L[1], 0), P3(Rr[0], Rr[1], 0), P3(Rr[0], Rr[1], a.H - 0.3), P3(L[0], L[1], a.H - 0.3));
      fbox(B(DOOR), FR(e[0], e[1], Math.atan2(-a.d[1], a.d[0])), 0.3, 0, 0.3, a.hw*2 - 0.4, 0, 3.6);
      const kl = K[i], kr = K[(i + 3) % 4];  // corners on either side at the crossing
      const tl = [a.E[0] + pa[0]*a.hw, a.E[1] + pa[1]*a.hw], tr = [a.E[0] - pa[0]*a.hw, a.E[1] - pa[1]*a.hw];
      quad(B(GLs), P3(tl[0], tl[1], a.H + 0.15), P3(tr[0], tr[1], a.H + 0.15), P3(kr[0], kr[1], Hc + 0.15), P3(kl[0], kl[1], Hc + 0.15)); }
    quad(B(GLs), P3(K[0][0], K[0][1], Hc + 0.15), P3(K[1][0], K[1][1], Hc + 0.15), P3(K[2][0], K[2][1], Hc + 0.15), P3(K[3][0], K[3][1], Hc + 0.15));
    // low annexes on the S-W and W-N sides (OSM outline beyond the shells)
    const Rg = D.ring, SW = Rg.slice(37, 44).concat(Rg.slice(0, 7)), NW = Rg.slice(18, 35);
    prism(B(CONC), SW, 0, 5.2, true); prism(B(CONC), NW, 0, 5.2, true);
    prism(B('#8f8b83'), offRing(SW, 0.12), 4.8, 5.4, false); prism(B('#8f8b83'), offRing(NW, 0.12), 4.8, 5.4, false);
    // the free-standing bell tower: a slender tapering triangular shaft with the cross on top
    { const T = D.bell; let tx = 0, tz = 0; for (const q of T){ tx += q[0]/3; tz += q[1]/3; }
      const ring = (y, s) => T.map(q => [tx + (q[0] - tx)*s, y, tz + (q[1] - tz)*s]);
      loft(B(BELL), [ring(0, 1.0), ring(20, 0.86), ring(40, 0.72), ring(58.2, 0.58)], true);
      for (const y of [49.5, 53.5]){ const r0 = ring(y, 0.665); for (let i = 0; i < 3; i++){ const a = r0[i], b = r0[(i + 1) % 3]; segBox(B(DOOR), [a[0], a[2]], [b[0], b[2]], 0.12, y, y + 2.2); } }
      box(B(CRS), tx, tz, 0.4, 0.4, 58.2, 61.7, 0); box(B(CRS), tx, tz, 2.0, 0.4, 60.0, 60.4, 0); }
    B.flush(g); return g; }};
SG_PLACES.push({type:'tystmary', lat:DN.tystmary.lat, lon:DN.tystmary.lon, rot:DN.tystmary.rot});
// ===== The National Art Center, Tokyo (国立新美术馆), Kurokawa Kishō, completed 2006 / opened 2007. Facts used (nact.jp
// architecture page; weblio): 4 storeys + 1 basement, steel (part SRC), building area 12,990 m², max height 32.5 m, lobby atrium
// ceiling 21.6 m; the south side is an undulating glass curtain wall ("waves") of horizontal glass louvres; a conical main entrance;
// two inverted concrete cones in the atrium carry the restaurant (top of the big cone) and a café. Plan = the real OSM outline
// w136048451 (rot -0.4°): exhibition block 139 x 75 m behind the wave, the entrance cone (Ø 19 m) in front of the wave's east part.
// Box / wave heights other than 21.6 / 32.5 are estimates. +z (local) = south = the wave front.
LANDMARKS.tynact = {zh:'国立新美术馆', en:'The National Art Center, Tokyo', cat:'new', r:100, h:32.5,
  lt:{m:0, c:'#fff0da', k:0.55, e:0.7},
  build(){
    const g = new THREE.Group(), B = mkB(), R = DN.tynact.ring;
    const GL = {c:'#6f97a0', glow:'#ffe2b8', gk:0.55, ds:true}, LV = {c:'#b9cecd', glow:'#fff1d8', gk:0.35, ds:true}, MUL = '#5f686b',
      BOXC = {c:'#a6aba9', m:0, lc:'#fff0da', lk:0.5}, BAND = {c:'#38434a', glow:'#ffe6c4', gk:0.3}, ROOF = '#8d9291', CON = {c:'#bcb6aa', m:0, lc:'#ffe4c0', lk:1.1},
      FLR = '#cdc5b4', PEN = '#9b9f9d', DARK = '#2e3438';
    const HW = 22.0, HB = 25.0, ZB = 12.5, XW = -63.0, XE = 75.9;
    // --- the wave: ring 0..22 (west end to the cone) + 37..41 (behind the cone to the east end)
    const W0 = R.slice(0, 23).concat(R.slice(37, 42)), W = dens(W0, 2.6), n = W.length;
    const cone = R.slice(23, 37); let cx = 0, cz = 0; for (const q of cone){ cx += q[0]/cone.length; cz += q[1]/cone.length; }
    let cr = 0; for (const q of cone) cr += Math.hypot(q[0] - cx, q[1] - cz)/cone.length;
    // arc length, local mean z (for the lean: bulges lean out at the top, hollows lean in)
    const S = [0]; for (let i = 1; i < n; i++) S.push(S[i - 1] + Math.hypot(W[i][0] - W[i - 1][0], W[i][1] - W[i - 1][1]));
    const top = [], nor = [];
    for (let i = 0; i < n; i++){ let sz = 0, c = 0; for (let j = 0; j < n; j++) if (Math.abs(S[j] - S[i]) < 16){ sz += W[j][1]; c++; }
      const a = W[Math.max(0, i - 1)], b = W[Math.min(n - 1, i + 1)], tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1])/tl, nz = (b[0] - a[0])/tl;
      const end = Math.min(S[i], S[n - 1] - S[i]), fade = clamp(end/10, 0, 1), lean = clamp((W[i][1] - sz/c)/4.5, -1, 1)*2.6*fade;
      nor.push([nx, nz]); top.push([W[i][0] + nx*lean, W[i][1] + nz*lean]); }
    const at = (i, t) => [lerp(W[i][0], top[i][0], t), HW*t, lerp(W[i][1], top[i][1], t)];
    const NL = 22;
    for (let i = 0; i < n - 1; i++){
      quad(B(GL), at(i, 0), at(i + 1, 0), at(i + 1, 1), at(i, 1));
      // horizontal glass louvres (a little proud of the glass line)
      for (let k = 1; k < NL; k++){ const t0 = k/NL, t1 = t0 + 0.012, o = 0.35;
        const a0 = at(i, t0), b0 = at(i + 1, t0), a1 = at(i, t1 + 0.02), b1 = at(i + 1, t1 + 0.02);
        const oa = [nor[i][0]*o, 0, nor[i][1]*o], ob = [nor[i + 1][0]*o, 0, nor[i + 1][1]*o];
        quad(B(LV), add(a0, oa), add(b0, ob), add(b1, ob), add(a1, oa)); }
      if (i % 3 === 0){ const a = at(i, 0), b = at(i, 1); beam(B(MUL), a, b, 0.12); } }
    // returns at the two ends (west annex face, east face of the atrium)
    for (const [a, b] of [[R[0], R[47]], [R[41], R[42]], [R[42], R[43]]]){ quad(B(GL), [a[0], 0, a[1]], [b[0], 0, b[1]], [b[0], HW, b[1]], [a[0], HW, a[1]]);
      for (let k = 1; k < NL; k++){ const y = HW*k/NL; segBox(B(LV), a, b, 0.5, y, y + 0.3); } }
    // atrium roof + fascia
    const AR = top.slice().concat([R[42], R[43], [XW + 1.5, ZB], R[46], R[47]]);
    prism(B(ROOF), AR, HW, HW + 0.9, true);
    // atrium floor, gallery slabs along the block, the two inverted cones
    flat(B(FLR), W.concat([R[42], R[43], [XW + 1.5, ZB], R[46], R[47]]), 0.06);
    for (const y of [7.2, 14.4]) box(B(FLR), (XW + XE)/2 + 1, ZB - 2.5, XE - XW - 4, 5, y - 0.5, y);
    lathe(B(CON), [[0, 0], [3.4, 0], [3.4, 1.2], [11.5, 16.0], [11.8, 16.0], [11.8, 17.2], [0, 17.2]], 28, -2, 30);
    cyl(B(LV), -2, 30, 11.6, 11.6, 17.2, 18.3, 28);
    lathe(B(CON), [[0, 0], [2.6, 0], [2.6, 1.0], [7.6, 9.6], [7.8, 9.6], [7.8, 10.6], [0, 10.6]], 24, -40, 27.5);
    cyl(B(LV), -40, 27.5, 7.7, 7.7, 10.6, 11.6, 24);
    // --- exhibition block: box + floor bands on the side and rear faces + plant on the roof
    const BX = rectP(XW, -62.5, XE, ZB);
    prism(B(BOXC), BX, 0, HB, true);
    // the side and rear faces: straight glass-louvre walls like the wave (louvre lines every ~1 m)
    { const E = [[XW - 0.2, ZB - 0.3], [XW - 0.2, -62.7], [XE + 0.2, -62.7], [XE + 0.2, ZB - 0.3]];
      wallLine(B(GL), E, 0, HB - 0.6);
      for (let k = 1; k < 24; k++){ const y = (HB - 0.6)*k/24; for (let i = 0; i < 3; i++) segBox(B(LV), E[i], E[i + 1], 0.55, y, y + 0.3); }
      for (let i = 0; i < 3; i++){ const a = E[i], b = E[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), nn = Math.round(L/7.5); for (let k = 0; k <= nn; k++){ const x = lerp(a[0], b[0], k/nn), z = lerp(a[1], b[1], k/nn); box(B(MUL), x, z, 0.3, 0.3, 0, HB - 0.6, 0); } } }
    prism(B(DARK), [[XW - 0.2, -62.7], [XE + 0.2, -62.7], [XE + 0.2, ZB - 0.3], [XW - 0.2, ZB - 0.3]], HB - 0.6, HB + 0.4, false);
    box(B(PEN), 6, -30, 62, 30, HB, 32.5, 0); box(B(DARK), 6, -30, 62.4, 30.4, 30.4, 31.2, 0);
    box(B(PEN), -40, -40, 16, 14, HB, 29.5, 0); box(B(PEN), 52, -42, 14, 16, HB, 29.5, 0);
    // --- the conical main entrance in front of the wave (glass base, concrete cone, oblique top)
    cyl(B(GL), cx, cz, cr - 0.3, cr - 0.3, 0, 4.2, 28, false);
    { lathe(B(CON), [[cr, 4.2], [cr*0.82, 9.5], [cr*0.72, 12.2], [0, 12.2]], 28, cx, cz); cyl(B(DARK), cx, cz, cr + 0.15, cr + 0.15, 4.0, 4.4, 28); }
    // west entrance annex (low box behind the glass)
    prism(B(BOXC), rectP(-78.5, 16.9, -62.0, 24.0), 0, 7.5, true);
    B.flush(g); return g; }};
SG_PLACES.push({type:'tynact', lat:DN.tynact.lat, lon:DN.tynact.lon, rot:DN.tynact.rot});
// ===== The National Museum of Western Art (国立西洋美术馆), Ueno. Main building: Le Corbusier, 1959 (World Heritage 2016) - a
// square on a 6 x 6 grid of posts raised on pilotis, the entrance between the pilotis, the top-lit "Nineteenth Century Hall" in the
// centre, galleries wrapping round it on the first floor with raised clerestory "lighting galleries", reinforced concrete clad in
// precast pebble-faced panels on brackets (Fondation Le Corbusier; mlit.go.jp; archjourney). OSM w145344184 (40.8 x 40.4 m, 12.1 m).
// New Wing: Maekawa Kunio, 1979, brown-tiled, OSM w145344123 (14.4 m). The forecourt holds Rodin bronzes (generic dark forms).
// Panel module, pilotis height and the roof-light heights are estimates. Local +z = SSW = the forecourt / main entrance.
LANDMARKS.tywesternart = {zh:'国立西洋美术馆', en:'The National Museum of Western Art', cat:'new', r:80, h:14.4,
  lt:{m:0, c:'#ffe9c8', k:0.7, e:0.6},
  build(){
    const g = new THREE.Group(), B = mkB(), D = DN.tywesternart;
    const PEB = {c:'#9aa18c', m:0, lk:0.6}, JNT = '#7b816f', COLc = {c:'#d1ccc1', m:0, lk:0.8}, GLs = {c:'#3a454c', glow:'#ffe0b4', gk:0.55}, SLAB = '#d6d1c6',
      ROOF = '#a2a49c', SKY = {c:'#a5bac0', glow:'#fff0d0', gk:0.45, ds:true}, TILE = {c:'#8a5a44', m:0, lk:0.55}, TILE2 = '#653f31', PAVE = '#cbc4b4', BRZ = '#3f3f35', STN = '#9d978a';
    const X0 = -20.4, X1 = 20.4, Z0 = -20.2, Z1 = 20.2, HP = 4.6, HT = 11.0;
    // pilotis (7 x 7 grid) and the recessed ground floor (glass to the forecourt, concrete behind)
    for (let i = 0; i <= 6; i++) for (let j = 0; j <= 6; j++){ const x = X0 + 0.5 + (X1 - X0 - 1)*i/6, z = Z0 + 0.5 + (Z1 - Z0 - 1)*j/6; cyl(B(COLc), x, z, 0.36, 0.36, 0, HP, 10); }
    box(B(GLs), 0, 10.2, 34.0, 6.6, 0, HP - 0.3, 0);
    box(B(SLAB), -1.5, -4.0, 31.0, 22.0, 0, HP - 0.3, 0);
    box(B(GLs), 15.2, -4.0, 4.6, 22.0, 0, HP - 0.3, 0);
    // the closed box on the pilotis: soffit, pebble panels with joints, roof slab
    flat(B(SLAB), rectP(X0, Z0, X1, Z1), HP - 0.02);
    box(B(PEB), 0, 0, X1 - X0, Z1 - Z0, HP, HT, 0);
    for (let y = HP + 1.6; y < HT - 0.2; y += 1.6) prism(B(JNT), rectP(X0 - 0.05, Z0 - 0.05, X1 + 0.05, Z1 + 0.05), y, y + 0.06, false);
    for (let t = -18.7; t <= 18.8; t += 1.7){ for (const s of [-1, 1]){ box(B(JNT), t, s*(Z1 + 0.03), 0.06, 0.08, HP, HT, 0); box(B(JNT), s*(X1 + 0.03), t, 0.08, 0.06, HP, HT, 0); } }
    box(B(ROOF), 0, 0, X1 - X0 + 0.3, Z1 - Z0 + 0.3, HT, HT + 0.35, 0);
    // the first-floor terrace door on the forecourt side and the long window band above the entrance
    box(B(GLs), -6.8, Z1 + 0.02, 13.6, 0.1, 6.4, 8.0, 0);
    // roof: the hall's ridge top light in the centre and the four lighting galleries in a pinwheel
    { const y0 = HT + 0.35, h = 2.4, w = 6.6; for (const s of [-1, 1]) quad(B(SKY), [-w, y0, s*w], [w, y0, s*w], [w, y0 + h, 0], [-w, y0 + h, 0]);
      for (const s of [-1, 1]) tri(B(SKY), [s*w, y0, -w], [s*w, y0, w], [s*w, y0 + h, 0]); beam(B(JNT), [-w, y0 + h, 0], [w, y0 + h, 0], 0.12); }
    const PW = [rectP(-13.6, -10.2, 6.8, -6.8), rectP(6.8, -13.6, 10.2, 6.8), rectP(-6.8, 6.8, 13.6, 10.2), rectP(-10.2, -6.8, -6.8, 13.6)];
    for (const P of PW){ prism(B(PEB), P, HT + 0.35, HT + 1.9, true); prism(B(SKY), offRing(P, 0.05), HT + 1.2, HT + 1.75, false); }
    // forecourt paving with the bronzes (the Gates of Hell, the Thinker, the Burghers of Calais as generic dark forms)
    flat(B(PAVE), [[X0 - 2, Z1], [X1 + 6, Z1], [X1 + 6, Z1 + 26], [X0 - 2, Z1 + 26]], 0.05);
    box(B(STN), 14.5, 34.0, 6.2, 2.2, 0, 0.6, 0); box(B(BRZ), 14.5, 34.0, 5.0, 1.2, 0.6, 6.9, 0); box(B(BRZ), 14.5, 34.0, 6.0, 1.6, 6.9, 7.5, 0);
    box(B(STN), -6.0, 36.0, 1.6, 1.6, 0, 2.6, 0); box(B(BRZ), -6.0, 36.0, 1.1, 1.3, 2.6, 4.4, 0);
    box(B(STN), -14.0, 28.0, 3.6, 3.0, 0, 0.5, 0); for (const [x, z] of [[-15.2, 27.2], [-13.8, 27.0], [-12.6, 27.6], [-15.0, 28.8], [-13.4, 29.0], [-12.5, 28.7]]) box(B(BRZ), x, z, 0.55, 0.55, 0.5, 2.6, 0);
    // New Wing (1979): brown tile, darker coping
    prism(B(TILE), D.wing, 0, 13.6, true); prism(B(TILE2), offRing(D.wing, 0.12), 13.4, 14.4, true);
    prism(B(TILE2), offRing(D.wing, 0.1), 0, 0.9, false);
    B.flush(g); return g; }};
SG_PLACES.push({type:'tywesternart', lat:DN.tywesternart.lat, lon:DN.tywesternart.lon, rot:DN.tywesternart.rot});
// ===== Takanawa Gateway Station (高轮Gateway站), JR East, opened 2020, design architect Kuma Kengo. Facts used: steel structure,
// 1 basement + 3 floors, 7,600 m² (Japan Elevator Association journal 29); the roof = four parallel ribbons ~120 m long of
// translucent PTFE-coated glass-fibre membrane creased in origami mountain / valley folds on a hybrid timber (laminated cedar) and
// steel frame, transparent ETFE where the ribbons' folds do not meet, an upper-level concourse over 4 tracks, floor-to-ceiling glass
// walls with wood-clad steel columns and a ~2 m ventilation gap under the roof, eight tree-shaped columns in the concourse, the
// station office at the north end, the roof opening to the station square on the west, glowing like a paper lantern at night
// (Architectural Record; archiposition; Shinkenchiku). Plan = OSM w781446220 (160 x 36-44 m, the "Takanawa Gateway" station
// building) - the target anchor point was 120 m east of it. Heights are estimates (concourse floor ~7.4 m, roof 18-26 m).
// Local +x = NNE along the tracks, -z = west (the station square). The tracks themselves are the app's rail lines (Yamanote line at
// z ~ -10, Keihin-Tōhoku line at z ~ +5): platforms are built beside them, nothing on them.
LANDMARKS.tytakanawa = {zh:'高轮Gateway站', en:'Takanawa Gateway Station', cat:'new', r:92, h:26.2,
  lt:{m:0, c:'#fff2dc', k:0.55, e:0.7},
  build(){
    const g = new THREE.Group(), B = mkB(), D = DN.tytakanawa;
    const MEM = {c:'#f2f1eb', glow:'#fff0d2', gk:0.55, ds:true}, WOODU = {c:'#c79a68', glow:'#ffcf94', gk:0.3, ds:true}, ETFE = {c:'#e6eef0', glow:'#fff4de', gk:0.45, ds:true},
      GLs = {c:'#5b717c', glow:'#ffe2b8', gk:0.55, ds:true}, TIM = '#b88a5c', TIMD = '#8f6a45', STL = '#8b9195', PLAT = '#a3a19b', DECK = '#cbc5b9', YEL = '#e2bf3a', WOODC = {c:'#b98d60', m:0, lk:0.7};
    const zW = x => x < 15.7 ? lerp(-19.9, -16.4, (x + 79)/94.7) : lerp(-22.3, -19.9, (x - 15.8)/64.3);
    const zE = x => lerp(16.4, 22.3, (x + 80.2)/158.9);
    const railZ = (P, x) => { for (let i = 0; i < P.length - 1; i++){ const a = P[i], b = P[i + 1]; if ((x - a[0])*(x - b[0]) <= 0 && Math.abs(b[0] - a[0]) > 1e-6) return lerp(a[1], b[1], (x - a[0])/(b[0] - a[0])); } return P[0][1]; };
    const rY = x => railZ(D.rail0, x), rK = x => railZ(D.rail1, x);
    const X0 = -75, X1 = 78, CX0 = -48, CX1 = 58, YC = 7.4, YG = 16.2;
    const RX0 = -76.5, RX1 = 80.5, NK = 14, base = [24.6, 22.9, 21.3, 19.7], A = 1.55;
    const rzW = x => zW(x) - 2.2, rzE = x => zE(x) + 1.5;
    // roof top surface height at (x, z) (linear across W-M-E and along x between fold nodes)
    const roofAt = (x, z) => { const t = clamp((z - rzW(x))/(rzE(x) - rzW(x)), 0, 0.9999), i = Math.floor(t*4), s = t*4 - i, kf = clamp((x - RX0)/(RX1 - RX0)*NK, 0, NK - 1e-4), k = Math.floor(kf), u = kf - k;
      const h = kk => { const up = ((kk + i) % 2) ? 1 : -1, e = base[i] + A*up, m = base[i] - A*0.55*up; return s < 0.5 ? lerp(e, m, s*2) : lerp(m, e, (s - 0.5)*2); };
      return lerp(h(k), h(k + 1), u); };
    // --- platforms beside the two lines (y 0..1.1), with yellow edge lines
    const bands = [[x => zW(x) + 1.2, x => rY(x) - 1.75], [x => rY(x) + 1.75, x => rK(x) - 1.75], [x => rK(x) + 1.75, x => zE(x) - 1.2]];
    for (const [za, zb] of bands){ for (let x = X0; x < X1 - 0.1; x += 6){ const x2 = Math.min(X1, x + 6);
      const P = [[x, za(x)], [x2, za(x2)], [x2, zb(x2)], [x, zb(x)]]; prism(B(PLAT), P, 0, 1.1, true);
      for (const zf of [za, zb]){ const s = zf === za ? 1 : -1; quad(B(YEL), [x, 1.12, zf(x) + s*0.6], [x2, 1.12, zf(x2) + s*0.6], [x2, 1.12, zf(x2) + s*0.9], [x, 1.12, zf(x) + s*0.9]); } } }
    // --- columns under the concourse / roof (timber-clad), on the platforms
    const colZ = x => [lerp(zW(x), rY(x), 0.5), lerp(rY(x), rK(x), 0.5), lerp(rK(x), zE(x), 0.5)];
    for (let x = X0 + 4; x <= X1 - 4; x += 12) for (const z of colZ(x)){ const top = (x >= CX0 && x <= CX1) ? YC : roofAt(x, z) - 0.5; box(B(TIM), x, z, 0.9, 0.9, 1.1, top, 0); }
    // --- concourse deck over the tracks, glass walls with timber mullions, the tree columns
    { const P = [[CX0, zW(CX0)], [CX1, zW(CX1)], [CX1, zE(CX1)], [CX0, zE(CX0)]];
      if (CX0 < 15.7 && CX1 > 15.8){ P.splice(1, 0, [15.7, zW(15.7)], [15.8, -22.3]); }
      prism(B(DECK), P, YC, YC + 1.0, true); flat(B('#b9b2a4'), P, YC - 0.02);
      for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length]; const ga = roofAt(a[0], a[1]) - 2.6, gb = roofAt(b[0], b[1]) - 2.6; quad(B(GLs), [a[0], YC + 1.0, a[1]], [b[0], YC + 1.0, b[1]], [b[0], gb, b[1]], [a[0], ga, a[1]]);
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L/3.0));
        for (let k = 0; k <= n; k++){ const t = k/n, x = lerp(a[0], b[0], t), z = lerp(a[1], b[1], t); box(B(TIM), x, z, 0.32, 0.32, YC + 1.0, roofAt(x, z) - 0.5, 0); }
        segBox(B(TIMD), a, b, 0.4, YC + 3.6, YC + 3.85); }
      for (const x of [-34, -14, 6, 26]) for (const zf of [0.3, 0.7]){ const z = lerp(zW(x), zE(x), zf);
        box(B(TIM), x, z, 1.5, 1.5, YC + 1.0, 14.0, 0);
        for (const [dx, dz] of [[-3.2, -2.4], [3.2, -2.4], [-3.2, 2.4], [3.2, 2.4]]) beam(B(STL), [x, 14.0, z], [x + dx, roofAt(x + dx, z + dz) - 0.5, z + dz], 0.12); } }
    // --- north-end block (station office): cedar-clad, Yamato-bari boards
    { const xa = CX1, xb = 77.5, P = [[xa, zW(xa) + 0.5], [xb, zW(xb) + 0.5], [xb, zE(xb) - 0.5], [xa, zE(xa) - 0.5]];
      prism(B(WOODC), P, YC, YG, true);
      for (let x = xa + 0.6; x < xb; x += 0.9){ const o = ((x - xa)/0.9 | 0) % 2 ? 0.25 : 0.05; box(B(TIMD), x, zW(x) + 0.5 - o, 0.3, 0.2, YC, YG, 0); box(B(TIMD), x, zE(x) - 0.5 + o, 0.3, 0.2, YC, YG, 0); }
      for (const z of [-10, 0, 10]) box(B(GLs), xb + 0.05, z, 0.1, 5.0, YC + 1.5, YG - 1.0, 0); }
    // --- the roof: four folded membrane ribbons along the tracks, rising towards the station square
    const node = (i, k) => { const x = lerp(RX0, RX1, k/NK), up = ((k + i) % 2) ? 1 : -1;
      const za = lerp(rzW(x), rzE(x), i/4), zb = lerp(rzW(x), rzE(x), (i + 1)/4);
      return {W:[x, base[i] + A*up, za], M:[x, base[i] - A*0.55*up, (za + zb)/2], E:[x, base[i] + A*up, zb]}; };
    const dn = (p, d) => [p[0], p[1] - d, p[2]];
    for (let i = 0; i < 4; i++) for (let k = 0; k < NK; k++){ const a = node(i, k), b = node(i, k + 1);
      const T = (k % 2) ? [[a.W, b.W, a.M], [b.W, b.M, a.M], [a.M, b.M, b.E], [a.M, b.E, a.E]] : [[a.W, b.W, b.M], [a.W, b.M, a.M], [a.M, b.M, a.E], [b.M, b.E, a.E]];
      for (const t of T){ tri(B(MEM), t[0], t[1], t[2]); tri(B(WOODU), dn(t[0], 0.55), dn(t[1], 0.55), dn(t[2], 0.55)); }
      // ETFE between this ribbon's east edge and the next ribbon's west edge
      if (i < 3){ const c = node(i + 1, k), d = node(i + 1, k + 1); quad(B(ETFE), a.E, b.E, d.W, c.W); }
      // fascia at the long edges
      if (i === 0) quad(B(MEM), a.W, b.W, dn(b.W, 0.55), dn(a.W, 0.55));
      if (i === 3) quad(B(MEM), a.E, b.E, dn(b.E, 0.55), dn(a.E, 0.55)); }
    for (const k of [0, NK]) for (let i = 0; i < 4; i++){ const a = node(i, k); quad(B(MEM), a.W, a.M, dn(a.M, 0.55), dn(a.W, 0.55)); quad(B(MEM), a.M, a.E, dn(a.E, 0.55), dn(a.M, 0.55)); }
    // roof posts at the perimeter (wood-clad steel) from the platforms / ground to the roof edge
    for (let x = RX0 + 6; x <= RX1 - 6; x += 12){ for (const z of [zW(x) + 0.6, zE(x) - 0.6]){ box(B(TIM), x, z, 0.6, 0.6, 0, roofAt(x, z) - 0.5, 0); } }
    B.flush(g); return g; }};
SG_PLACES.push({type:'tytakanawa', lat:DN.tytakanawa.lat, lon:DN.tytakanawa.lon, rot:DN.tytakanawa.rot});
// ===== Sunshine 60 (阳光60大厦), Ikebukuro, 1978: 239.7 m, 60 floors (en.wikipedia; Mitsubishi Estate). The model follows the OSM
// building:parts of Sunshine City (w250938764): the shaft 73 x 43 m to 228 m with its pier rhythm taken from the detailed part
// outline (long faces: 1.6 m piers at a 3.25 m pitch, projecting 1.5 m; end faces: a blank 14.4 m core panel between 1.5 m piers at
// 3 m), ledges at 8.5-10 m and 222.5-224 m, a parapet 228-230 m and the roof plant 229-240 m. The 60th-floor observatory band
// (224-228 m) is glazed and lit. Local x = the long axis.
LANDMARKS.tysunshine60 = {zh:'阳光60大厦', en:'Sunshine 60', cat:'new', r:44, h:239.7,
  lt:{m:1, c:'#ffe6c2', k:0.95},
  build(){
    const g = new THREE.Group(), B = mkB(), D = DN.tysunshine60;
    const WIN = {c:'#646b70', m:1, fh:3.75, cw:1.62}, PIER = {c:'#d4cec1', m:0, lc:'#fff1dc', lk:0.55}, CAP = {c:'#e6e2d8', m:0, lc:'#ffffff', lk:0.9},
      OBS = {c:'#36404a', glow:'#ffe0ae', gk:0.95}, PEN = '#bfbaaf', LOB = {c:'#3c454c', glow:'#ffe6c2', gk:0.6}, BASE = '#8e897f';
    const HS = 222.5;
    box(B(WIN), 0, 0, 70.0, 40.0, 10.0, HS, 0);
    box(B(LOB), 0, 0, 69.6, 39.6, 0, 8.5, 0);
    box(B(BASE), 0, 0, 74.2, 44.2, 8.5, 10.0, 0);
    // long faces: 20 piers + the corner blocks
    for (let k = 0; k < 20; k++){ const x = -30.95 + k*61.7/19; for (const s of [-1, 1]) box(B(PIER), x, s*20.75, 1.6, 1.5, 0, HS, 0); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(B(PIER), sx*34.9, sz*20.7, 3.4, 1.6, 0, HS, 0);
    // end faces: the blank centre panel and four piers each side
    for (const sx of [-1, 1]){ box(B(PIER), sx*35.75, 0, 1.7, 14.4, 0, HS, 0);
      for (const z of [8.65, 11.65, 14.65, 17.65]) for (const sz of [-1, 1]) box(B(PIER), sx*35.75, sz*z, 1.5, 1.5, 0, HS, 0); }
    // crown: ledge, observatory glazing with mullions, parapet, roof plant
    box(B(CAP), 0, 0, 74.0, 44.0, HS, 224.0, 0);
    box(B(OBS), 0, 0, 72.4, 42.4, 224.0, 228.0, 0);
    for (let x = -34.5; x <= 34.6; x += 3.25) for (const s of [-1, 1]) box(B(PIER), x, s*21.3, 0.35, 0.5, 224.0, 228.0, 0);
    for (let z = -19.5; z <= 19.6; z += 3.0) for (const s of [-1, 1]) box(B(PIER), s*36.3, z, 0.5, 0.35, 224.0, 228.0, 0);
    box(B(CAP), 0, 0, 73.4, 43.4, 228.0, 230.0, 0);
    prism(B(PEN), D.pent, 229.5, 239.7, true);
    prism(B('#8d8981'), offRing(D.pent, 0.15), 236.8, 237.6, false);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]){ box(B(RED), sx*35.8, sz*20.8, 0.8, 0.8, 230.0, 230.8, 0); }
    for (const q of D.pent) box(B(RED), q[0]*0.97, q[1]*0.97, 0.7, 0.7, 239.7, 240.4, 0);
    B.flush(g); return g; }};
SG_PLACES.push({type:'tysunshine60', lat:DN.tysunshine60.lat, lon:DN.tysunshine60.lon, rot:DN.tysunshine60.rot});
// ===== Ueno Tōshō-gū (上野东照宫): the gilded shrine halls of 1651 (gongen-zukuri: worship hall, connecting hall, main hall) inside
// the lattice fence (sukibei), the gilded Karamon gate and the copper lanterns in front of it. Plan = OSM w145344085 (halls) and
// w145344190 (the fence, open where the gate stands, east side). Heights are estimates. Local +x = east = the gate / approach.
const SHR = {GOLD:{c:'#c9a240', m:0, lc:'#ffe2a6', lk:1.1}, GOLD2:{c:'#b48a2e', glow:'#ffcf7a', gk:0.18}, BLK:'#1f1d1b', ROOF:'#2d3133', RID:'#1c1f21',
  UND:'#5b2a1e', VER:'#a8362a', STN:'#a29c90', PAVE:'#bdb6a8', CU:{c:'#5b7a68', m:0, lk:0.6}, LGT:{c:'#e9d9a8', glow:'#ffd08a', gk:0.8}, WALL:'#efe8d8'};
const karaFront = (p, f, u, w0, halfW, yb, rise, th) => { // cusped (kara-hafu) gable board facing +u at u, spanning w0 +- halfW
  const N = 12, pts = []; for (let i = 0; i <= N; i++){ const t = i/N, w = -halfW + 2*halfW*t, c = Math.cos(PI*(t - 0.5)); pts.push([w, yb + rise*Math.pow(c, 1.6) - 0.25*rise*Math.pow(Math.abs(2*t - 1), 6)]); }
  for (let i = 0; i < N; i++){ const a = pts[i], b = pts[i + 1];
    quad(p, f(u, a[1] - th, w0 + a[0]), f(u, b[1] - th, w0 + b[0]), f(u, b[1], w0 + b[0]), f(u, a[1], w0 + a[0])); } };
LANDMARKS.tytoshogu = {zh:'上野东照宫', en:'Ueno Tōshō-gū', cat:'old', r:36, h:12.5,
  lt:{m:0, c:'#ffc98a', k:0.95, e:0.45},
  build(){
    const g = new THREE.Group(), B = mkB(), D = DN.tytoshogu, S = SHR;
    flat(B(S.PAVE), [[-20.4, -17.8], [20.4, -17.8], [20.4, 17.8], [-20.4, 17.8]], 0.04);
    // worship hall (haiden): X -2.5..10, Z -10.3..10.5 - ridge along z
    { const f = FR(3.75, 0.1, HP), L = 20.8, W = 12.5;
      fbox(B(S.BLK), f, 0, 0, L, W, 0, 0.9); fbox(B(S.GOLD), f, 0, 0, L - 1.0, W - 1.0, 0.9, 5.0);
      for (let u = -L/2 + 0.6; u <= L/2 - 0.5; u += 2.0) for (const s of [-1, 1]) fbox(B(S.BLK), f, u, s*(W/2 - 0.45), 0.26, 0.2, 0.9, 5.0);
      for (const y of [1.0, 3.2, 4.6]) fbox(B(S.BLK), f, 0, 0, L - 0.8, W - 0.8, y, y + 0.22, false);
      fbox(B(S.GOLD2), f, 0, 0, L - 0.4, W - 0.4, 5.0, 5.7);
      tRoof(B, f, {L:L + 2.8, W:W + 2.8, y:5.75, h:5.6, k:(L - W)/2 + 1.6, gab:0.55, pw:1.6, lift:0.5, col:S.ROOF, hip:S.RID, und:S.UND, gcol:S.GOLD, rw:0.55, nt:7}); }
    // front step canopy (kōhai) with a cusped gable
    { const f = FR(11.2, 0.55, HP);
      for (const s of [-1, 1]) cyl(B(S.GOLD), 12.0, 0.55 + s*4.9, 0.22, 0.22, 0, 4.8, 8);
      fbox(B(S.STN), f, 0, 0, 10.8, 2.6, 0, 0.5);
      tRoof(B, f, {L:12.0, W:4.4, y:4.9, h:1.9, k:4.6, gab:0, pw:1.4, lift:0.35, col:S.ROOF, hip:S.RID, und:S.UND, rw:0.4, nt:4});
      const fk = FR(0, 0, 0); karaFront(B(S.GOLD), fk, 13.25, 0.55, 3.0, 5.1, 1.5, 0.55); }
    // connecting hall (heiden) and main hall (honden)
    { const f = FR(-4.75, 0.3, 0); fbox(B(S.BLK), f, 0, 0, 4.6, 8.2, 0, 0.9); fbox(B(S.GOLD), f, 0, 0, 4.6, 7.4, 0.9, 4.3);
      gRoof(B, f, {L:5.0, W:9.6, y:4.4, h:2.9, pw:1.4, col:S.ROOF, hip:S.RID, und:S.UND, gcol:S.GOLD, rw:0.45}); }
    { const f = FR(-11.55, 0.3, HP), L = 12.6, W = 9.1;
      fbox(B(S.STN), f, 0, 0, L + 0.6, W + 0.6, 0, 1.4); fbox(B(S.GOLD), f, 0, 0, L - 1.0, W - 1.0, 1.4, 5.6);
      for (let u = -L/2 + 0.6; u <= L/2 - 0.5; u += 2.1) for (const s of [-1, 1]) fbox(B(S.BLK), f, u, s*(W/2 - 0.45), 0.26, 0.2, 1.4, 5.6);
      fbox(B(S.GOLD2), f, 0, 0, L - 0.4, W - 0.4, 5.6, 6.3);
      tRoof(B, f, {L:L + 2.6, W:W + 2.6, y:6.35, h:5.0, k:(L - W)/2 + 1.3, gab:0.55, pw:1.6, lift:0.5, col:S.ROOF, hip:S.RID, und:S.UND, gcol:S.GOLD, rw:0.5, nt:7}); }
    // the north-west annex
    { const f = FR(-8.35, -13.0, 0); fbox(B(S.BLK), f, 0, 0, 11.5, 5.4, 0, 0.6); fbox(B(S.VER), f, 0, 0, 11.0, 4.8, 0.6, 3.4);
      gRoof(B, f, {L:12.4, W:6.6, y:3.4, h:2.2, pw:1.4, col:S.ROOF, hip:S.RID, und:S.UND, gcol:S.WALL, rw:0.4}); }
    // the sukibei fence: red base, gilded lattice, tiled cap (open at the gate)
    { const P = D.wall;
      for (let i = 0; i < P.length - 1; i++){ const a = P[i], b = P[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), f = FR((a[0] + b[0])/2, (a[1] + b[1])/2, Math.atan2(-(b[1] - a[1]), b[0] - a[0]));
        fbox(B(S.VER), f, 0, 0, L, 0.5, 0, 0.95); fbox(B(S.VER), f, 0, 0, L, 0.42, 2.3, 2.65);
        koshi(B(S.GOLD2), f, -L/2 + 0.2, L/2 - 0.2, 0, 0.95, 2.3, 0.45);
        for (let u = -L/2; u <= L/2 + 0.01; u += 3.0) fbox(B(S.VER), f, u, 0, 0.32, 0.5, 0.95, 2.3);
        gRoof(B, f, {L:L + 0.3, W:1.3, y:2.65, h:0.55, pw:1.2, col:S.ROOF, hip:S.RID, rw:0.22}); } }
    // the Karamon gate (east side of the fence)
    { const f = FR(20.6, 0.1, HP);
      fbox(B(S.STN), f, 0, 0, 6.0, 4.0, 0, 0.35);
      for (const su of [-1, 1]) for (const sw of [-1, 1]) { const q = f(su*2.05, 0, sw*1.35); cyl(B(S.GOLD), q[0], q[2], 0.24, 0.24, 0.35, 4.5, 10); }
      for (const sw of [-1, 1]) fbox(B(S.GOLD2), f, 0, sw*1.35, 4.6, 0.3, 3.9, 4.6);
      for (const su of [-1, 1]) fbox(B(S.BLK), f, su*1.1, 0, 1.9, 0.12, 0.35, 3.6);
      fbox(B(S.GOLD2), f, 0, 0, 5.0, 3.4, 4.6, 5.2);
      tRoof(B, f, {L:6.6, W:5.0, y:5.25, h:2.4, k:1.3, gab:0.5, pw:1.5, lift:0.45, col:S.ROOF, hip:S.RID, und:S.UND, gcol:S.GOLD, rw:0.4, nt:5});
      const fk = FR(0, 0, 0); karaFront(B(S.GOLD), fk, 23.15, 0.1, 2.9, 5.4, 1.3, 0.5); karaFront(B(S.GOLD), fk, 18.05, 0.1, 2.9, 5.4, 1.3, 0.5); }
    // copper lanterns flanking the approach in front of the gate
    for (let x = 25; x <= 33.1; x += 4) for (const s of [-1, 1]){ const z = s*4.6;
      box(B(S.STN), x, z, 1.0, 1.0, 0, 0.4, 0); cyl(B(S.CU), x, z, 0.16, 0.2, 0.4, 1.7, 6); box(B(S.CU), x, z, 0.9, 0.9, 1.7, 1.85, 0);
      box(B(S.LGT), x, z, 0.6, 0.6, 1.85, 2.45, 0); LFrust(g, 1.05, 1.05, 0.2, 0.2, 0.5, x, 2.45, z, S.CU, 0); cyl(B(S.CU), x, z, 0.08, 0.04, 2.95, 3.25, 6); }
    B.flush(g); return g; }};
SG_PLACES.push({type:'tytoshogu', lat:DN.tytoshogu.lat, lon:DN.tytoshogu.lon, rot:DN.tytoshogu.rot});

// ===== Kiyomizu Kannon-dō (清水观音堂), Ueno, 1631 (Important Cultural Property): modelled on Kyoto's Kiyomizu-dera, its stage held up
// by long posts and tie beams (kake-zukuri) faces west over the slope towards Shinobazu Pond; the "Moon Pine" (月の松), whose branch
// is trained into a ring, stands in front of the stage (nippon.com; OSM node 月の松). Plan = OSM w138585452: the main hall + stage
// (south block), a corridor and the rear hall (north block). Heights are estimates. Local -x = west = the stage / pond side.
LANDMARKS.tykiyomizu = {zh:'清水观音堂', en:'Kiyomizu Kannon-dō', cat:'old', r:30, h:15.5,
  lt:{m:0, c:'#ffc98a', k:0.95, e:0.45},
  build(){
    const g = new THREE.Group(), B = mkB(), D = DN.tykiyomizu;
    const VER = {c:'#b03a2a', m:0, lk:0.9}, VER2 = '#8e2e22', WALL = '#ece4d2', ROOF = '#53585c', RID = '#3a3e41', UND = '#7e2e22', DARK = '#2b2522', WOOD = '#6e4a32', STN = '#a39d92', PINE = '#2f4a2c', BARK = '#5a4232';
    const YF = 2.2;   // hall floor above the local ground (the stage rides on posts)
    // stilts + tie beams under the south block and the stage
    for (let x = -10.4; x <= 10.5; x += 2.6) for (let z = 4.8; z <= 21.6; z += 2.4){ cyl(B(VER2), x, z, 0.2, 0.2, -4.0, YF, 6); }
    for (const y of [-1.5, 0.6]){ for (let z = 4.8; z <= 21.6; z += 2.4) box(B(VER2), 0, z, 21.0, 0.18, y, y + 0.25, 0); for (let x = -10.4; x <= 10.5; x += 2.6) box(B(VER2), x, 13.2, 0.18, 16.8, y + 0.4, y + 0.65, 0); }
    // stage deck + railing
    box(B(WOOD), -8.45, 12.75, 4.9, 16.9, YF - 0.3, YF, 0); box(B(WOOD), 2.4, 12.45, 16.8, 19.1, YF - 0.3, YF, 0);
    for (const z of [4.4, 21.1]) box(B(VER), -8.45, z, 4.9, 0.14, YF + 0.9, YF + 1.05, 0);
    box(B(VER), -10.85, 12.75, 0.14, 16.9, YF + 0.9, YF + 1.05, 0);
    for (let z = 4.4; z <= 21.2; z += 1.4) box(B(VER), -10.85, z, 0.14, 0.14, YF, YF + 1.0, 0);
    // main hall body: vermilion posts, white walls, lattice doors on the stage side
    { const f = FR(2.4, 12.45, HP), L = 19.1, W = 16.8;
      fbox(B(WALL), f, 0, 0, L - 1.4, W - 1.4, YF, YF + 5.0);
      for (let u = -L/2 + 0.7; u <= L/2 - 0.6; u += 2.95) for (const s of [-1, 1]) fbox(B(VER), f, u, s*(W/2 - 0.7), 0.36, 0.36, YF, YF + 5.0);
      for (const y of [YF + 0.1, YF + 3.6, YF + 4.6]) fbox(B(VER), f, 0, 0, L - 1.2, W - 1.2, y, y + 0.3, false);
      for (let u = -L/2 + 2.2; u <= L/2 - 2.0; u += 2.95) fbox(B(DARK), f, u, -(W/2 - 0.66), 2.1, 0.1, YF + 0.5, YF + 3.5);
      fbox(B(VER), f, 0, 0, L - 0.6, W - 0.6, YF + 5.0, YF + 5.6);
      tRoof(B, f, {L:L + 3.2, W:W + 3.0, y:YF + 5.65, h:6.4, k:(L - W)/2 + 2.4, gab:0.55, pw:1.65, lift:0.5, col:ROOF, hip:RID, und:UND, gcol:WALL, rw:0.55, nt:7}); }
    // corridor and the rear hall (north block)
    { const f = FR(1.25, -0.85, HP); fbox(B(VER), f, 0, 0, 7.5, 4.9, 0, 1.0); fbox(B(WALL), f, 0, 0, 7.5, 4.3, 1.0, 4.0);
      gRoof(B, f, {L:8.4, W:6.4, y:4.0, h:2.0, pw:1.3, col:ROOF, hip:RID, und:UND, gcol:WALL, rw:0.4}); }
    { const f = FR(1.05, -13.25, HP), L = 17.4, W = 14.3;
      fbox(B(STN), f, 0, 0, L + 0.4, W + 0.4, -1.0, 0.6); fbox(B(WALL), f, 0, 0, L - 1.2, W - 1.2, 0.6, 4.8);
      for (let u = -L/2 + 0.6; u <= L/2 - 0.5; u += 2.9) for (const s of [-1, 1]) fbox(B(VER), f, u, s*(W/2 - 0.6), 0.32, 0.32, 0.6, 4.8);
      fbox(B(VER), f, 0, 0, L - 0.6, W - 0.6, 4.8, 5.3);
      tRoof(B, f, {L:L + 2.6, W:W + 2.6, y:5.35, h:5.0, k:(L - W)/2 + 1.8, gab:0.55, pw:1.6, lift:0.45, col:ROOF, hip:RID, und:UND, gcol:WALL, rw:0.5, nt:6}); }
    // the Moon Pine in front of the stage: a leaning trunk, its branch trained into a ring framing the view west, crown on top
    { const [px, pz] = D.pine; beam(B(BARK), [px + 0.6, -0.5, pz + 0.3], [px, 3.6, pz], 0.22); beam(B(BARK), [px, 3.6, pz], [px - 0.2, 5.2, pz - 0.8], 0.16);
      torusV(B(BARK), [px, 2.55, pz - 1.55], [0, 0, 1], 1.15, 0.13, 18, 5);
      for (const [dx, dy, dz, r] of [[0, 5.4, -0.9, 1.5], [0.5, 4.9, 0.6, 1.1], [-0.6, 5.0, -2.2, 1.0], [0.2, 4.0, -2.9, 0.8]]) LSph(g, r, px + dx, dy, pz + dz, PINE, 0.55, 7); }
    B.flush(g); return g; }};
SG_PLACES.push({type:'tykiyomizu', lat:DN.tykiyomizu.lat, lon:DN.tykiyomizu.lon, rot:DN.tykiyomizu.rot});

// ===== Sankei-en Three-storied Pagoda (三溪园旧灯明寺三重塔), built 1457 for Tōmyō-ji (Kyoto), moved to Sankei-en in 1914; the
// oldest building of the garden, on its hill above the pond (sankeien.or.jp; city.yokohama.lg.jp; tabi-mag.jp). Plan = OSM
// w95639574 (10.4 m square = the eaves). No sourced height: ~24 m to the finial is an estimate from the plan, as are the storey
// sizes. Colours: vermilion posts and brackets, white walls, dark tiled roofs, bronze finial.
LANDMARKS.tysankeien = {zh:'三溪园三重塔', en:'Sankei-en Three-storied Pagoda', cat:'old', r:9, h:24,
  lt:{m:0, c:'#ffc98a', k:1.0, e:0.4},
  build(){
    const g = new THREE.Group(), B = mkB(), f = ID;
    const C = {wall:'#ece4d2', ver:{c:'#a8392a', m:0, lk:1.0}, door:'#3a2a22', brk:'#8e3326', roof:'#45494c', rid:'#2f3235', und:'#7a2c22', fin:'#5d5a4e'};
    LFrust(g, 11.0, 11.0, 7.6, 7.6, 5.0, 0, -5.0, 0, '#6d8a4c', 0);
    fbox(B('#9a948a'), f, 0, 0, 7.2, 7.2, -0.2, 0.9);
    for (const s of [-1, 1]) fbox(B('#9a948a'), f, 0, s*4.1, 2.0, 1.2, -0.3, 0.45);
    pagoda(B, g, f, 0.9, [[5.4, 10.4, 0, 3.4], [4.6, 9.2, 5.25, 2.6], [3.9, 8.1, 9.7, 2.4]], C, 8.0);
    B.flush(g); return g; }};
SG_PLACES.push({type:'tysankeien', lat:DN.tysankeien.lat, lon:DN.tysankeien.lon, rot:DN.tysankeien.rot});
// ===== Yokohama Stadium (横滨球场), Yokohama Park, opened 1978. Facts used (ja.wikid.org mirror of ja.wikipedia; Travel Watch
// 2020-02): field 94.2 m to the foul poles, 111.4 m to the gaps, 117.7 m to centre, fence 5.0-5.3 m, 6 light towers with
// inverted-triangle lamp arrays (the "Y" of Yokohama), stands shaped as an inverted cone (wider at the top); 2020 expansion: wing
// stands on both outfield sides whose top row is 30 m above the ground, and the 600 m circulation deck 6 m up around the bowl.
// Plan = OSM r12293517 and its building:parts (bowl 24 m, wings 31 m, backstop block 35 m, the 9 m annex) + the OSM home plate /
// pitcher's mound / infield sand / outfield pitch. Foul-territory widths, light-tower and screen sizes are estimates; the screen
// shows only an abstract glow. Local +z = home plate side (SSE), -z = centre field.
LANDMARKS.tyyokostadium = {zh:'横滨球场', en:'Yokohama Stadium', cat:'new', r:126, h:50,
  lt:{m:0, c:'#eef3ff', k:0.65, e:0.6},
  build(){
    const g = new THREE.Group(), B = mkB(), D = DN.tyyokostadium;
    const TURF = '#3d8a47', DIRT = '#a06e48', LINE = '#f1f1ec', SEAT1 = {c:'#1e4f9e', m:0, lk:0.45}, SEAT2 = {c:'#2963b8', m:0, lk:0.45}, AISLE = '#c4c8cc',
      WALLC = {c:'#dadcd8', m:0, lc:'#f4f7ff', lk:0.8}, FENCE = '#1b3c78', CONC = '#bfc2be', GLs = {c:'#40505c', glow:'#ffe4bc', gk:0.6}, STEEL = '#9ba1a5',
      LAMP = {c:'#efefea', glow:'#ffffff', gk:1.9}, SCR = {c:'#16202c', glow:'#4f86d8', gk:0.55}, POLE = '#e6c337', DECK = '#9a9ea0';
    const H = D.home[0], MD = D.mound[0];
    const u1 = [Math.SQRT1_2, -Math.SQRT1_2], n1 = [Math.SQRT1_2, Math.SQRT1_2], u3 = [-Math.SQRT1_2, -Math.SQRT1_2], n3 = [-Math.SQRT1_2, Math.SQRT1_2];
    const wf = t => 19 - 6*t/94.2;
    const dist = phi => { const a = Math.abs(phi)*180/PI; return a <= 22.5 ? lerp(117.7, 111.4, Math.pow(a/22.5, 1.6)) : lerp(111.4, 94.2, Math.pow((a - 22.5)/22.5, 1.25)); };
    // the field boundary (front of the stands): backstop arc, third-base side, fence, first-base side
    const F = [], FEN = [];
    for (let i = 0; i <= 10; i++){ const a = PI/4 + PI/2*i/10; F.push([H[0] + 19*Math.cos(a), H[1] + 19*Math.sin(a)]); }
    for (let t = 6; t <= 94.2; t += 11) F.push([H[0] + u3[0]*t + n3[0]*wf(t), H[1] + u3[1]*t + n3[1]*wf(t)]);
    F.push([H[0] + u3[0]*94.2 + n3[0]*wf(94.2), H[1] + u3[1]*94.2 + n3[1]*wf(94.2)]);
    for (let i = 0; i <= 30; i++){ const phi = -PI/4 + PI/2*i/30, d = dist(phi), q = [H[0] + Math.sin(phi)*d, H[1] - Math.cos(phi)*d]; F.push(q); FEN.push(q); }
    F.push([H[0] + u1[0]*94.2 + n1[0]*wf(94.2), H[1] + u1[1]*94.2 + n1[1]*wf(94.2)]);
    for (let t = 94.2 - 11; t >= 6; t -= 11) F.push([H[0] + u1[0]*t + n1[0]*wf(t), H[1] + u1[1]*t + n1[1]*wf(t)]);
    // field: turf, the OSM infield sand, home / mound / bases, foul lines, fence
    flat(B(TURF), F, 0.1);
    flat(B(DIRT), D.infield, 0.16);
    cyl(B(DIRT), H[0], H[1], 4.2, 4.2, 0.1, 0.19, 20, true); cyl(B(DIRT), MD[0], MD[1], 2.8, 2.8, 0.1, 0.45, 18, true);
    box(B(LINE), H[0], H[1], 0.45, 0.45, 0.19, 0.24, PI/4);
    for (const q of [[H[0] + u1[0]*27.43, H[1] + u1[1]*27.43], [H[0], H[1] - 38.8], [H[0] + u3[0]*27.43, H[1] + u3[1]*27.43]]) box(B(LINE), q[0], q[1], 0.4, 0.4, 0.16, 0.3, PI/4);
    for (const u of [u1, u3]){ const e = [H[0] + u[0]*94.2, H[1] + u[1]*94.2]; segBox(B(LINE), H, e, 0.2, 0.2, 0.24);
      cyl(B(POLE), e[0] + u[0]*0.6, e[1] + u[1]*0.6, 0.25, 0.25, 0, 26, 8); }
    wallLine(B(FENCE), FEN, 0, 5.1);
    // stands: polar sweep about the bowl centre
    const parts = {p1:D.p1, p2:D.p2, p3:D.p3}, N = 160, NR = 16, rows = [];
    const sl = [];
    for (let k = 0; k < N; k++){ const th = TAU*k/N, ex = Math.cos(th), ez = Math.sin(th);
      const rin = rayFar(F, 0, 0, ex, ez), rb = rayFar(D.bowl, 0, 0, ex, ez), r1 = rayFar(D.p1, 0, 0, ex, ez), r2 = rayFar(D.p2, 0, 0, ex, ez), r3 = rayFar(D.p3, 0, 0, ex, ez);
      let ro = Math.max(rb, r1, r2, r3), ht = 24, kind = 0;
      if (r2 > rb + 1.5 || r3 > rb + 1.5){ ht = 31; kind = 2; } else if (r1 > rb + 1.5){ ht = 26; kind = 1; }
      const P = [ex*rin, ez*rin], phi = Math.atan2(P[0] - H[0], -(P[1] - H[1])), fence = Math.abs(phi) <= PI/4 + 0.02 && Math.hypot(P[0] - H[0], P[1] - H[1]) > 80;
      sl.push({ex, ez, rin, ro, ht, kind, hf:fence ? 5.1 : 2.2}); }
    const pt = (s, r, y) => [s.ex*r, y, s.ez*r];
    for (let k = 0; k < N; k++){ const a = sl[k], b = sl[(k + 1) % N], aisle = (k % 8) === 0;
      // front wall
      quad(B(a.hf > 3 ? FENCE : WALLC), pt(a, a.rin, 0), pt(b, b.rin, 0), pt(b, b.rin, b.hf), pt(a, a.rin, a.hf));
      // seating rows
      for (let j = 0; j < NR; j++){ const t0 = j/NR, t1 = (j + 1)/NR;
        const ra0 = lerp(a.rin + 0.4, a.ro - 3.0, t0), ra1 = lerp(a.rin + 0.4, a.ro - 3.0, t1), rb0 = lerp(b.rin + 0.4, b.ro - 3.0, t0), rb1 = lerp(b.rin + 0.4, b.ro - 3.0, t1);
        const ya0 = lerp(a.hf, a.ht - 1.2, Math.pow(t0, 0.92)), ya1 = lerp(a.hf, a.ht - 1.2, Math.pow(t1, 0.92)), yb0 = lerp(b.hf, b.ht - 1.2, Math.pow(t0, 0.92)), yb1 = lerp(b.hf, b.ht - 1.2, Math.pow(t1, 0.92));
        const col = j === 7 ? CONC : (j % 2 ? SEAT1 : SEAT2);
        quad(B(col), pt(a, ra0, ya0), pt(b, rb0, yb0), pt(b, rb1, yb1), pt(a, ra1, ya1)); }
      // a stair aisle on the slice edge
      if (aisle){ const r0a = a.rin + 0.4, r1a = a.ro - 3.0, px = -a.ez*0.6, pz = a.ex*0.6;
        quad(B(AISLE), [a.ex*r0a - px, a.hf + 0.08, a.ez*r0a - pz], [a.ex*r0a + px, a.hf + 0.08, a.ez*r0a + pz], [a.ex*r1a + px, a.ht - 1.12, a.ez*r1a + pz], [a.ex*r1a - px, a.ht - 1.12, a.ez*r1a - pz]); }
      // rim walkway, parapet and the outward-leaning outer wall down to the 6 m deck
      quad(B(CONC), pt(a, a.ro - 3.0, a.ht - 1.2), pt(b, b.ro - 3.0, b.ht - 1.2), pt(b, b.ro - 0.6, b.ht - 1.2), pt(a, a.ro - 0.6, a.ht - 1.2));
      quad(B(WALLC), pt(a, a.ro - 0.6, a.ht - 1.2), pt(b, b.ro - 0.6, b.ht - 1.2), pt(b, b.ro - 0.6, b.ht), pt(a, a.ro - 0.6, a.ht));
      quad(B(WALLC), pt(a, a.ro - 0.4, a.ht), pt(b, b.ro - 0.4, b.ht), pt(b, b.ro - 4.0, 6.6), pt(a, a.ro - 4.0, 6.6));
      if (k % 2 === 0) beam(B(CONC), pt(a, a.ro - 0.2, a.ht - 0.2), pt(a, a.ro - 4.0, 6.6), 0.3);
      quad(B(DECK), pt(a, a.ro - 6.0, 6.4), pt(b, b.ro - 6.0, 6.4), pt(b, b.ro, 6.4), pt(a, a.ro, 6.4));
      quad(B(STEEL), pt(a, a.ro, 6.4), pt(b, b.ro, 6.4), pt(b, b.ro, 7.5), pt(a, a.ro, 7.5));
      quad(B(GLs), pt(a, a.ro - 6.0, 0), pt(b, b.ro - 6.0, 0), pt(b, b.ro - 6.0, 6.4), pt(a, a.ro - 6.0, 6.4));
      if (k % 3 === 0) cyl(B(CONC), a.ex*(a.ro - 1.2), a.ez*(a.ro - 1.2), 0.35, 0.35, 0, 6.4, 6);
      // the backstop block (part 0-35 m): glass suites on top of the stands
      if (a.kind === 1 && b.kind === 1){ quad(B(GLs), pt(a, a.ro - 9, a.ht - 1.2), pt(b, b.ro - 9, b.ht - 1.2), pt(b, b.ro - 9, 34.2), pt(a, a.ro - 9, 34.2));
        quad(B(WALLC), pt(a, a.ro - 10, 35), pt(b, b.ro - 10, 35), pt(b, b.ro, 35), pt(a, a.ro, 35));
        quad(B(WALLC), pt(a, a.ro - 0.6, a.ht), pt(b, b.ro - 0.6, b.ht), pt(b, b.ro - 0.6, 35), pt(a, a.ro - 0.6, 35)); }
      if (a.kind === 2 && k % 2 === 0) beam(B(STEEL), pt(a, a.ro - 4.0, 6.6), pt(a, a.ro - 0.5, a.ht - 0.5), 0.18); }
    // the 9 m annex behind the backstop
    prism(B(WALLC), D.p0, 0, 9.0, true);
    // the six light towers on the rim (inverted-triangle lamp frames facing the field)
    for (const dl of [-125, -75, -35, 35, 75, 125]){ const th = -PI/2 + dl*PI/180, ex = Math.cos(th), ez = Math.sin(th);
      const rb = Math.max(rayFar(D.bowl, 0, 0, ex, ez), rayFar(D.p2, 0, 0, ex, ez), rayFar(D.p3, 0, 0, ex, ez), rayFar(D.p1, 0, 0, ex, ez)) - 2.0, base = (rayFar(D.p2, 0, 0, ex, ez) > rb + 3 || rayFar(D.p3, 0, 0, ex, ez) > rb + 3) ? 31 : 24;
      const c = [ex*rb, ez*rb], tx = -ez, tz = ex, yc = 44.5;
      box(B(STEEL), c[0], c[1], 1.4, 1.4, base - 1.0, yc - 5.0, 0);
      const T = [[c[0] - tx*9.0, yc + 5.0, c[1] - tz*9.0], [c[0] + tx*9.0, yc + 5.0, c[1] + tz*9.0], [c[0] - ex*0.4, yc - 6.0, c[1] - ez*0.4]];
      tri(B(LAMP), T[0], T[1], T[2]); for (let i = 0; i < 3; i++) beam(B(STEEL), T[i], T[(i + 1) % 3], 0.3);
      for (let i = 1; i < 4; i++){ const y = yc + 5.0 - i*2.7, w = 9.0*(1 - i*2.7/11); beam(B(STEEL), [c[0] - tx*w - ex*0.2, y, c[1] - tz*w - ez*0.2], [c[0] + tx*w - ex*0.2, y, c[1] + tz*w - ez*0.2], 0.12); }
      beam(B(STEEL), [c[0], yc - 4.0, c[1]], [c[0] + ex*2.5, yc + 3.5, c[1] + ez*2.5], 0.25); }
    // the centre-field screen (abstract glow only)
    { const ex = 0, ez = -1, rb = rayFar(D.bowl, 0, 0, ex, ez) - 3.0, c = [0, -rb];
      box(B(STEEL), c[0], c[1] - 1.0, 34.0, 2.2, 18.0, 37.0, 0); box(B(SCR), c[0], c[1] + 0.15, 31.0, 0.2, 20.0, 35.0, 0);
      for (const s of [-1, 1]) box(B(STEEL), c[0] + s*12, c[1] - 1.5, 1.4, 1.4, 0, 18.0, 0); }
    B.flush(g); return g; }};
SG_PLACES.push({type:'tyyokostadium', lat:DN.tyyokostadium.lat, lon:DN.tyyokostadium.lon, rot:DN.tyyokostadium.rot});
}
