// ===== lm26/sgcivic: new Civic District / Beach Road landmarks for the Singapore 1:1 map (City Brush v29) =====
// Civilian War Memorial, The Cenotaph + Lim Bo Seng Memorial, Tan Kim Seng Fountain, Singapore Cricket Club, Singapore
// Recreation Club, The Concourse, St Joseph's Church (Victoria Street). Block-scoped: only LANDMARKS and SG_PLACES are
// touched. Real dimensions in metres; y = 0 is the ground (the app puts it 0.6 m above the highest ground within r); every
// plan follows the real OSM footprint in the model's local axes (see SG_PLACES at the end). Helpers copied from lm22/civic.
{
const PI = Math.PI, HP = PI/2, TAU = PI*2;
// ---------- triangle batches: many small parts of one colour spec become one LTris call ----------
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const Q = (o, a, b, c, d) => o.push(...a, ...b, ...c, ...a, ...c, ...d);
const T3 = (o, a, b, c) => o.push(...a, ...b, ...c);
// axis-aligned box from min/max corners (no bottom face)
const bx = function(o, x0, x1, y0, y1, z0, z1){
  const P = [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]];
  Q(o, P[4], P[7], P[6], P[5]); Q(o, P[0], P[4], P[5], P[1]); Q(o, P[1], P[5], P[6], P[2]); Q(o, P[2], P[6], P[7], P[3]); Q(o, P[3], P[7], P[4], P[0]);
};
// n-sided prism round a segment (columns, rails, members)
const segP = function(o, a, b, r, n, r1){
  n = n || 6; const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2], L = Math.hypot(dx, dy, dz); if (L < 1e-4) return;
  const d = [dx/L, dy/L, dz/L], up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let ux = d[1]*up[2]-d[2]*up[1], uy = d[2]*up[0]-d[0]*up[2], uz = d[0]*up[1]-d[1]*up[0]; const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
  const vx = d[1]*uz-d[2]*uy, vy = d[2]*ux-d[0]*uz, vz = d[0]*uy-d[1]*ux;
  const ring = (p, rr) => { const R = []; for (let i = 0; i < n; i++){ const t = (i + 0.5)/n*TAU, c = Math.cos(t)*rr, s = Math.sin(t)*rr; R.push([p[0]+ux*c+vx*s, p[1]+uy*c+vy*s, p[2]+uz*c+vz*s]); } return R; };
  const A = ring(a, r), B = ring(b, r1 === undefined ? r : r1);
  for (let i = 0; i < n; i++){ const j = (i+1) % n; Q(o, A[i], A[j], B[j], B[i]); }
};
// solid of revolution into a batch: profile [[r, y], ...] around (cx, cz), n sides
const barP = function(o, a, b, w, th){
  const dx = b[0]-a[0], dz = b[2]-a[2], l = Math.hypot(dx, dz) || 1, px = -dz/l*w/2, pz = dx/l*w/2;
  const P = (p, s, t) => [p[0] + px*s, p[1] + t, p[2] + pz*s];
  Q(o, P(a, -1, th/2), P(b, -1, th/2), P(b, 1, th/2), P(a, 1, th/2)); Q(o, P(a, -1, -th/2), P(a, 1, -th/2), P(b, 1, -th/2), P(b, -1, -th/2));
  Q(o, P(a, 1, -th/2), P(a, 1, th/2), P(b, 1, th/2), P(b, 1, -th/2)); Q(o, P(a, -1, th/2), P(a, -1, -th/2), P(b, -1, -th/2), P(b, -1, th/2));
};
// solid of revolution into a batch: profile [[r, y], ...] around (cx, cz), n sides
const latheP = function(o, prof, cx, cz, n, a0, a1){
  a0 = a0 || 0; const span = a1 === undefined ? TAU : a1 - a0, closed = a1 === undefined, m = closed ? n : n + 1;
  const R = prof.map(([r, y]) => { const ring = []; for (let i = 0; i < m; i++){ const t = a0 + i/n*span; ring.push([cx + Math.cos(t)*r, y, cz + Math.sin(t)*r]); } return ring; });
  for (let k = 0; k < R.length - 1; k++) for (let i = 0; i < n; i++){ const j = closed ? (i+1) % n : i + 1; Q(o, R[k][i], R[k][j], R[k+1][j], R[k+1][i]); }
};
// plan polygon ([x, z]) walls between y0 and y1, and a flat cap (fan from the centroid: use for convex or star-shaped plans)
const wallsP = (o, P, y0, y1) => { for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; Q(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); } };
const capP = (o, P, y) => { let cx = 0, cz = 0; for (const p of P){ cx += p[0]/P.length; cz += p[1]/P.length; } for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; T3(o, [cx, y, cz], [a[0], y, a[1]], [b[0], y, b[1]]); } };
const capT = function(o, P, y){ const tri = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
  for (const t of tri) T3(o, [P[t[0]][0], y, P[t[0]][1]], [P[t[1]][0], y, P[t[1]][1]], [P[t[2]][0], y, P[t[2]][1]]); };
const prismP = (o, P, y0, y1, oc) => { wallsP(o, P, y0, y1); capT(oc || o, P, y1); };
const areaS = P => { let s = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; s += a[0]*b[1] - b[0]*a[1]; } return s; };
// polygon offset (positive d = inwards), mitred; insetE: a different offset per edge (edge i runs from P[i] to P[i+1])
const insetE = (P, D) => { const sg = areaS(P) > 0 ? 1 : -1, n = P.length;
  return P.map((b, i) => { const a = P[(i+n-1) % n], c = P[(i+1) % n], l1 = Math.hypot(b[0]-a[0], b[1]-a[1]) || 1, l2 = Math.hypot(c[0]-b[0], c[1]-b[1]) || 1;
    const n1 = [-sg*(b[1]-a[1])/l1, sg*(b[0]-a[0])/l1], n2 = [-sg*(c[1]-b[1])/l2, sg*(c[0]-b[0])/l2], d1 = D[(i+n-1) % n], d2 = D[i];
    const det = n1[0]*n2[1] - n1[1]*n2[0];
    if (Math.abs(det) < 0.25){ let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml; const k = Math.max(0.35, mx*n1[0] + mz*n1[1]), d = (d1 + d2)/2; return [b[0] + mx*d/k, b[1] + mz*d/k]; }
    return [b[0] + (d1*n2[1] - d2*n1[1])/det, b[1] + (n1[0]*d2 - n2[0]*d1)/det]; }); };
const inset = (P, d) => insetE(P, P.map(() => d));
// horizontal ring (soffit / ledge) between two polygons with matching vertices
const ringP = (o, A, Bp, y) => { for (let i = 0; i < A.length; i++){ const j = (i+1) % A.length; Q(o, [A[i][0], y, A[i][1]], [A[j][0], y, A[j][1]], [Bp[j][0], y, Bp[j][1]], [Bp[i][0], y, Bp[i][1]]); } };
const circ3 = (a, b, c) => { const d = 2*(a[0]*(b[1]-c[1]) + b[0]*(c[1]-a[1]) + c[0]*(a[1]-b[1])), A = a[0]*a[0] + a[1]*a[1], Bq = b[0]*b[0] + b[1]*b[1], C = c[0]*c[0] + c[1]*c[1];
  const ux = (A*(b[1]-c[1]) + Bq*(c[1]-a[1]) + C*(a[1]-b[1]))/d, uz = (A*(c[0]-b[0]) + Bq*(a[0]-c[0]) + C*(b[0]-a[0]))/d; return [ux, uz, Math.hypot(a[0]-ux, a[1]-uz)]; };
// ---------- a "face": a vertical wall plane, u along it (from point A), d outwards, y up ----------
// fc(ax, az, bx, bz): wall from A to B; outward normal = the right-hand side when walking A->B seen from above (+y)
const fc = function(ax, az, bx_, bz){ const L = Math.hypot(bx_ - ax, bz - az), tx = (bx_ - ax)/L, tz = (bz - az)/L; return {ax, az, tx, tz, nx:-tz, nz:tx, L}; };
// faces of an axis-aligned rectangle, each with the outside to the right: front (+z), right (+x), back (-z), left (-x)
const rectF = (x0, x1, z0, z1) => ({f:fc(x0, z1, x1, z1), r:fc(x1, z1, x1, z0), b:fc(x1, z0, x0, z0), l:fc(x0, z0, x0, z1)});
const fp = (F, u, y, d) => [F.ax + F.tx*u + F.nx*d, y, F.az + F.tz*u + F.nz*d];
// box in face coordinates
const fbx = function(o, F, u0, u1, y0, y1, d0, d1){
  const P = [fp(F,u0,y0,d0), fp(F,u1,y0,d0), fp(F,u1,y0,d1), fp(F,u0,y0,d1), fp(F,u0,y1,d0), fp(F,u1,y1,d0), fp(F,u1,y1,d1), fp(F,u0,y1,d1)];
  Q(o, P[4], P[7], P[6], P[5]); Q(o, P[0], P[4], P[5], P[1]); Q(o, P[1], P[5], P[6], P[2]); Q(o, P[2], P[6], P[7], P[3]); Q(o, P[3], P[7], P[4], P[0]); Q(o, P[0], P[1], P[2], P[3]);
};
// flat panel on the face (window glass, doors, clock faces) at depth d
const frect = (o, F, u0, u1, y0, y1, d) => Q(o, fp(F,u0,y0,d), fp(F,u1,y0,d), fp(F,u1,y1,d), fp(F,u0,y1,d));
// round-headed opening: rectangle up to the springing ys, half circle above (total height ys + w/2)
const farch = function(o, F, uc, y0, w, ys, d, n){
  n = n || 6; const r = w/2; frect(o, F, uc - r, uc + r, y0, ys, d);
  for (let i = 0; i < n; i++){ const a = PI*i/n, b = PI*(i+1)/n; T3(o, fp(F, uc, ys, d), fp(F, uc + Math.cos(a)*r, ys + Math.sin(a)*r, d), fp(F, uc + Math.cos(b)*r, ys + Math.sin(b)*r, d)); }
};
// pointed (lancet) opening: rectangle up to ys, equilateral pointed head above (apex ys + 0.866 w)
const flancet = function(o, F, uc, y0, w, ys, d, n){
  n = n || 4; const r = w/2; frect(o, F, uc - r, uc + r, y0, ys, d);
  // left arc: centre at the right springing point; right arc mirrored
  for (let i = 0; i < n; i++){ const a0 = PI - PI/3*i/n, a1 = PI - PI/3*(i+1)/n;
    T3(o, fp(F, uc, ys, d), fp(F, uc + r + w*Math.cos(a0), ys + w*Math.sin(a0), d), fp(F, uc + r + w*Math.cos(a1), ys + w*Math.sin(a1), d));
    T3(o, fp(F, uc, ys, d), fp(F, uc - r - w*Math.cos(a1), ys + w*Math.sin(a1), d), fp(F, uc - r - w*Math.cos(a0), ys + w*Math.sin(a0), d)); }
};
// open arcade: n round arches between u0 and u1 on piers of width pw, springing at ys, wall up to yt, thickness d0..d1
const farcade = function(o, F, u0, u1, n, y0, ys, yt, pw, d0, d1, seg){
  seg = seg || 6; const bw = (u1 - u0)/n, r = (bw - pw)/2;
  for (let k = 0; k <= n; k++){ const u = u0 + k*bw; fbx(o, F, u - pw/2, u + pw/2, y0, yt, d0, d1); }
  for (let k = 0; k < n; k++){ const uc = u0 + (k + 0.5)*bw;
    for (let i = 0; i < seg; i++){ const a = PI - PI*i/seg, b = PI - PI*(i+1)/seg, ua = uc + Math.cos(a)*r, ub = uc + Math.cos(b)*r, ya = ys + Math.sin(a)*r, yb = ys + Math.sin(b)*r;
      for (const d of [d0, d1]) Q(o, fp(F, ua, ya, d), fp(F, ub, yb, d), fp(F, ub, yt, d), fp(F, ua, yt, d));
      Q(o, fp(F, ua, ya, d0), fp(F, ub, yb, d0), fp(F, ub, yb, d1), fp(F, ua, ya, d1)); }
  }
  fbx(o, F, u0 - pw/2, u1 + pw/2, yt - 0.01, yt + 0.02, d0, d1);
};
// round column at (u, d) on the face, with square base and capital blocks
const fcol = function(o, oc, F, u, d, y0, y1, r, n){
  const c = fp(F, u, 0, d); segP(o, [c[0], y0 + r*0.9, c[2]], [c[0], y1 - r*1.1, c[2]], r, n || 8, r*0.88);
  fbx(oc, F, u - r*1.25, u + r*1.25, y0, y0 + r*0.9, d - r*1.25, d + r*1.25);
  fbx(oc, F, u - r*1.35, u + r*1.35, y1 - r*1.1, y1, d - r*1.35, d + r*1.35);
};
// balustrade: rails and balusters along the face between u0 and u1 at depth d
const fbal = function(o, F, u0, u1, y, h, d, w){
  w = w || 0.3; fbx(o, F, u0, u1, y, y + h*0.18, d - w/2, d + w/2); fbx(o, F, u0, u1, y + h*0.82, y + h, d - w*0.6, d + w*0.6);
  const n = Math.max(1, Math.round((u1 - u0)/0.42)); for (let i = 0; i < n; i++){ const u = u0 + (i + 0.5)*(u1 - u0)/n; fbx(o, F, u - 0.07, u + 0.07, y + h*0.18, y + h*0.82, d - 0.07, d + 0.07); }
};
// ---------- roofs (into batches) ----------
// tile courses on a roof plane (eaves E0-E1, top T0-T1; T0 = T1 for a hip triangle): thin strips every `step` m up the slope
const lerp3 = (a, b, f) => [a[0] + (b[0] - a[0])*f, a[1] + (b[1] - a[1])*f, a[2] + (b[2] - a[2])*f];
const tileC = function(o, E0, E1, T0, T1, step){
  if (!o) return; const m = lerp3(lerp3(E0, E1, 0.5), lerp3(T0, T1, 0.5), 0), s = Math.hypot(...[0, 1, 2].map(i => (T0[i] + T1[i])/2 - m[i])); if (s < 1) return;
  const n = Math.max(2, Math.round(s/(step || 1.1))), df = 0.11/s;
  for (let k = 1; k < n; k++){ const f = k/n, up = p => [p[0], p[1] + 0.045, p[2]];
    const A = up(lerp3(E0, T0, f)), B = up(lerp3(E1, T1, f)), A2 = up(lerp3(E0, T0, f + df)), B2 = up(lerp3(E1, T1, f + df)); Q(o, A, B, B2, A2); }
};
// hipped roof on the rectangle x0..x1, z0..z1 at eaves height y, rise h, overhang ov; tl: batch for tile courses
const hipR = function(o, x0, x1, z0, z1, y, h, ov, oc, of, tl){
  ov = ov || 0; x0 -= ov; x1 += ov; z0 -= ov; z1 += ov; const L = x1 - x0, W = z1 - z0, cx = (x0 + x1)/2, cz = (z0 + z1)/2;
  // the eaves drop a little below y so the overhang reads as a sloping roof edge
  const ye = y - ov*h/Math.max(1, Math.min(L, W)/2 - ov);
  let a, b;
  if (L >= W){ const k = (L - W)/2; a = [cx - k, y + h, cz]; b = [cx + k, y + h, cz];
    Q(o, [x0, ye, z1], [x1, ye, z1], b, a); Q(o, [x1, ye, z0], [x0, ye, z0], a, b); T3(o, [x0, ye, z0], [x0, ye, z1], a); T3(o, [x1, ye, z1], [x1, ye, z0], b);
    if (tl){ tileC(tl, [x0, ye, z1], [x1, ye, z1], a, b); tileC(tl, [x1, ye, z0], [x0, ye, z0], b, a); tileC(tl, [x0, ye, z0], [x0, ye, z1], a, a); tileC(tl, [x1, ye, z1], [x1, ye, z0], b, b); } }
  else { const k = (W - L)/2; a = [cx, y + h, cz - k]; b = [cx, y + h, cz + k];
    Q(o, [x1, ye, z1], [x1, ye, z0], a, b); Q(o, [x0, ye, z0], [x0, ye, z1], b, a); T3(o, [x0, ye, z1], [x1, ye, z1], b); T3(o, [x1, ye, z0], [x0, ye, z0], a);
    if (tl){ tileC(tl, [x1, ye, z1], [x1, ye, z0], b, a); tileC(tl, [x0, ye, z0], [x0, ye, z1], a, b); tileC(tl, [x0, ye, z1], [x1, ye, z1], b, b); tileC(tl, [x1, ye, z0], [x0, ye, z0], a, a); } }
  if (oc){ const r = 0.13, lift = (p) => [p[0], p[1] + 0.08, p[2]];
    segP(oc, lift(a), lift(b), r, 4);
    if (L >= W){ for (const [c, e] of [[[x0, ye, z0], a], [[x0, ye, z1], a], [[x1, ye, z0], b], [[x1, ye, z1], b]]) segP(oc, lift(c), lift(e), r, 4); }
    else { for (const [c, e] of [[[x0, ye, z0], a], [[x1, ye, z0], a], [[x0, ye, z1], b], [[x1, ye, z1], b]]) segP(oc, lift(c), lift(e), r, 4); }
  }
  if (of) for (const [p, q] of [[[x0, ye, z0], [x1, ye, z0]], [[x1, ye, z0], [x1, ye, z1]], [[x1, ye, z1], [x0, ye, z1]], [[x0, ye, z1], [x0, ye, z0]]]) Q(of, p, q, [q[0], q[1] - 0.32, q[2]], [p[0], p[1] - 0.32, p[2]]);
};
// gabled roof, ridge along x (ax = 'x') or z; gable-end triangles go to ow (the wall batch); ov = eaves overhang
const gabR = function(o, ow, x0, x1, z0, z1, y, h, ax, ov, tl){
  ov = ov || 0;
  if (ax === 'x'){ const cz = (z0 + z1)/2; Q(o, [x0, y, z1 + ov], [x1, y, z1 + ov], [x1, y + h, cz], [x0, y + h, cz]); Q(o, [x1, y, z0 - ov], [x0, y, z0 - ov], [x0, y + h, cz], [x1, y + h, cz]);
    if (tl){ tileC(tl, [x0, y, z1 + ov], [x1, y, z1 + ov], [x0, y + h, cz], [x1, y + h, cz]); tileC(tl, [x1, y, z0 - ov], [x0, y, z0 - ov], [x1, y + h, cz], [x0, y + h, cz]); }
    if (ow){ T3(ow, [x0, y, z0], [x0, y, z1], [x0, y + h, cz]); T3(ow, [x1, y, z1], [x1, y, z0], [x1, y + h, cz]); } }
  else { const cx = (x0 + x1)/2; Q(o, [x1 + ov, y, z1], [x1 + ov, y, z0], [cx, y + h, z0], [cx, y + h, z1]); Q(o, [x0 - ov, y, z0], [x0 - ov, y, z1], [cx, y + h, z1], [cx, y + h, z0]);
    if (tl){ tileC(tl, [x1 + ov, y, z1], [x1 + ov, y, z0], [cx, y + h, z1], [cx, y + h, z0]); tileC(tl, [x0 - ov, y, z0], [x0 - ov, y, z1], [cx, y + h, z0], [cx, y + h, z1]); }
    if (ow){ T3(ow, [x0, y, z1], [x1, y, z1], [cx, y + h, z1]); T3(ow, [x1, y, z0], [x0, y, z0], [cx, y + h, z0]); } }
};
// gable with a hipped back end: ridge along z from the gable at z1 back to a hip at z0
const gabHipZ = function(o, ow, x0, x1, z0, z1, y, h, ov, tl){
  ov = ov || 0; const cx = (x0 + x1)/2, hw = (x1 - x0)/2, zr = z0 + hw;
  Q(o, [x1 + ov, y, z1], [x1 + ov, y, z0 - ov], [cx, y + h, zr], [cx, y + h, z1]); Q(o, [x0 - ov, y, z0 - ov], [x0 - ov, y, z1], [cx, y + h, z1], [cx, y + h, zr]);
  T3(o, [x1 + ov, y, z0 - ov], [x0 - ov, y, z0 - ov], [cx, y + h, zr]);
  if (tl){ tileC(tl, [x1 + ov, y, z1], [x1 + ov, y, z0 - ov], [cx, y + h, z1], [cx, y + h, zr]); tileC(tl, [x0 - ov, y, z0 - ov], [x0 - ov, y, z1], [cx, y + h, zr], [cx, y + h, z1]); tileC(tl, [x1 + ov, y, z0 - ov], [x0 - ov, y, z0 - ov], [cx, y + h, zr], [cx, y + h, zr]); }
  if (ow) T3(ow, [x0, y, z1], [x1, y, z1], [cx, y + h, z1]);
};
// triangular pediment on a face: base u0..u1 at y, apex height h, depth d0..d1 (solid), raking cornice into oc
const fped = function(o, oc, F, u0, u1, y, h, d0, d1){
  const um = (u0 + u1)/2;
  for (const d of [d0, d1]) T3(o, fp(F, u0, y, d), fp(F, u1, y, d), fp(F, um, y + h, d));
  Q(o, fp(F, u0, y, d0), fp(F, um, y + h, d0), fp(F, um, y + h, d1), fp(F, u0, y, d1)); Q(o, fp(F, um, y + h, d0), fp(F, u1, y, d0), fp(F, u1, y, d1), fp(F, um, y + h, d1));
  if (oc){ const t = 0.45, e = 0.35; Q(oc, fp(F, u0 - e, y, d1 + 0.25), fp(F, um, y + h + t, d1 + 0.25), fp(F, um, y + h + t, d0), fp(F, u0 - e, y, d0)); Q(oc, fp(F, um, y + h + t, d1 + 0.25), fp(F, u1 + e, y, d1 + 0.25), fp(F, u1 + e, y, d0), fp(F, um, y + h + t, d0));
    Q(oc, fp(F, u0 - e, y, d1 + 0.25), fp(F, u0 - e, y - 0.5, d1 + 0.25), fp(F, um, y + h + t - 0.5, d1 + 0.25), fp(F, um, y + h + t, d1 + 0.25)); Q(oc, fp(F, um, y + h + t, d1 + 0.25), fp(F, um, y + h + t - 0.5, d1 + 0.25), fp(F, u1 + e, y - 0.5, d1 + 0.25), fp(F, u1 + e, y, d1 + 0.25)); }
};
// cornice band all round a rectangle (projecting p, height h at y)
const corniceR = (o, x0, x1, z0, z1, y, h, p, wi) => { const q = wi || 0.6;
  bx(o, x0 - p, x1 + p, y, y + h, z0 - p, z0 + q); bx(o, x0 - p, x1 + p, y, y + h, z1 - q, z1 + p); bx(o, x0 - p, x0 + q, y, y + h, z0 + q, z1 - q); bx(o, x1 - q, x1 + p, y, y + h, z0 + q, z1 - q); };
// regular window grid on a face: bays of width bw from u0..u1, each floor [y0, height, kind ('r' rect, 'a' arch, 'l' lancet), width]
const fwins = function(oD, oL, F, u0, u1, bw, floors, d, rng, pLit){
  const n = Math.max(1, Math.round((u1 - u0)/bw)), w = (u1 - u0)/n;
  for (let i = 0; i < n; i++){ const uc = u0 + (i + 0.5)*w;
    for (const [y0, h, kind, ww] of floors){ const o = rng && rng() < (pLit || 0) ? oL : oD, wi = ww || w*0.45;
      if (kind === 'a') farch(o, F, uc, y0, wi, y0 + h - wi/2, d); else if (kind === 'l') flancet(o, F, uc, y0, wi, y0 + h - wi*0.866, d); else frect(o, F, uc - wi/2, uc + wi/2, y0, y0 + h, d); } }
  return n;
};
// pilasters (flat strips) at bay boundaries
const fpil = function(o, F, u0, u1, n, y0, y1, w, p){ for (let i = 0; i <= n; i++){ const u = u0 + i*(u1 - u0)/n; fbx(o, F, u - w/2, u + w/2, y0, y1, -0.02, p); } };
// simple tree (trunk + two-lobed crown), batched
const treeP = function(oT, oC, x, z, s, rng){
  segP(oT, [x, -4, z], [x, 3.2*s, z], 0.28*s, 5, 0.2*s);
  const n = 7, R = 3.0*s, y = 4.6*s; latheP(oC, [[0.01, y - 1.6*s], [R*0.85, y - 0.9*s], [R, y + 0.2*s], [R*0.7, y + 1.4*s], [0.01, y + 2.0*s]], x + (rng() - 0.5)*s, z + (rng() - 0.5)*s, n, rng()*3);
};
// ---------- colonial range: walls, verandah fronts on the faces listed in o.ver ('f','r','b','l'), windows elsewhere,
// string courses, cornice and a hipped roof. P = {w, t, dk, lit, rf, rng}; o = {y0, H, nf, vd, ver, bay, rise, ov, pl, arch}
const colRange = function(P, x0, x1, z0, z1, o){
  const y0 = o.y0 === undefined ? 0.6 : o.y0, H = o.H, nf = o.nf || 2, fh = (H - y0)/nf, vd = o.vd || 2.6, ver = o.ver || '', bay = o.bay || 3.6,
    pl = o.pl === undefined ? 0.25 : o.pl, rng = P.rng;
  const ix0 = x0 + (ver.includes('l') ? vd : 0), ix1 = x1 - (ver.includes('r') ? vd : 0), iz0 = z0 + (ver.includes('b') ? vd : 0), iz1 = z1 - (ver.includes('f') ? vd : 0);
  bx(P.w, ix0, ix1, y0, H, iz0, iz1); bx(P.w, x0, x1, -4, y0, z0, z1);                 // walls; foundation down into the ground
  const Fo = rectF(x0, x1, z0, z1), Fi = rectF(ix0, ix1, iz0, iz1);
  for (const s of ['f', 'r', 'b', 'l']){
    const fo = Fo[s], fi = Fi[s];
    if (fo.L < 2) continue;
    if (ver.includes(s)){
      const n = Math.max(1, Math.round(fo.L/bay));
      fwins(P.dk, P.lit, fi, 0.4, fi.L - 0.4, bay, Array.from({length:nf}, (_, k) => [y0 + k*fh + 0.25, fh*0.68, k ? 'r' : 'a', Math.min(1.7, bay*0.45)]), 0.05, rng, pl*1.4);
      if (o.arch !== false) farcade(P.w, fo, 0, fo.L, n, y0, y0 + fh*0.55, y0 + fh, 0.75, -0.65, 0.05);
      else for (let i = 0; i <= n; i++) fcol(P.t, P.t, fo, i*fo.L/n, -0.35, y0, y0 + fh, 0.3, 6);
      for (let k = 1; k < nf; k++){ const yb = y0 + k*fh;
        fbx(P.t, fo, 0, fo.L, yb - 0.4, yb, -vd, 0.12);
        for (let i = 0; i <= n; i++) fcol(P.t, P.t, fo, i*fo.L/n, -0.35, yb, yb + fh - 0.45, 0.22, 6);
        fbal(P.t, fo, 0.25, fo.L - 0.25, yb, 1.0, -0.35, 0.16); }
      fbx(P.t, fo, -0.05, fo.L + 0.05, H - 0.5, H, -vd, 0.2);
    } else {
      // plain wall on the inner line (it is the outer line unless the neighbours have verandahs)
      const n = fwins(P.dk, P.lit, fi, 0.6, fi.L - 0.6, bay, Array.from({length:nf}, (_, k) => [y0 + k*fh + (k ? 0.7 : 0.5), fh*(k ? 0.55 : 0.6), k || o.arch === false ? 'r' : 'a', Math.min(1.5, bay*0.4)]), 0.05, rng, pl);
      for (let k = 1; k < nf; k++) fbx(P.t, fi, -0.05, fi.L + 0.05, y0 + k*fh - 0.3, y0 + k*fh + 0.1, -0.02, 0.22);
      if (o.pil) fpil(P.t, fi, 0.2, fi.L - 0.2, n, y0, H - 0.4, 0.45, 0.18);
    }
  }
  bx(P.t, x0 - 0.25, x1 + 0.25, H - 0.45, H, z0 - 0.25, z1 + 0.25);
  if (ver) bx(P.t, x0, x1, H - 0.02, H, z0, z1);                        // verandah ceilings
  if (o.rise !== 0) hipR(P.rf, x0, x1, z0, z1, H, o.rise || 3.4, o.ov === undefined ? 0.9 : o.ov, P.rc, P.t, P.tl);
};
// block on a convex plan polygon: walls, windows on every face, string courses, cornice and a pyramid roof
const polyBlock = function(P, poly, o){
  const y0 = o.y0 === undefined ? 0.6 : o.y0, H = o.H, nf = o.nf || 2, fh = (H - y0)/nf, rise = o.rise === undefined ? 3 : o.rise, bay = o.bay || 3.4, ov = o.ov === undefined ? 0.8 : o.ov;
  let cx = 0, cz = 0; for (const p of poly){ cx += p[0]/poly.length; cz += p[1]/poly.length; }
  wallsP(P.w, poly, -4, H); capP(P.w, poly, H - 0.02);
  for (let i = 0; i < poly.length; i++){
    const a = poly[i], b = poly[(i + 1) % poly.length]; let F = fc(a[0], a[1], b[0], b[1]);
    if (F.nx*((a[0] + b[0])/2 - cx) + F.nz*((a[1] + b[1])/2 - cz) < 0) F = fc(b[0], b[1], a[0], a[1]);
    if (F.L > 2.4) fwins(P.dk, P.lit, F, 0.4, F.L - 0.4, bay, Array.from({length:nf}, (_, k) => [y0 + k*fh + (k ? 0.7 : 0.5), fh*0.58, k ? 'r' : 'a', Math.min(1.5, bay*0.42)]), 0.05, P.rng, o.pl === undefined ? 0.25 : o.pl);
    for (let k = 1; k < nf; k++) fbx(P.t, F, -0.05, F.L + 0.05, y0 + k*fh - 0.3, y0 + k*fh + 0.1, -0.02, 0.22);
    fbx(P.t, F, -0.3, F.L + 0.3, H - 0.5, H, -0.02, 0.35);
    if (rise > 0){ const ea = [a[0] + (a[0] - cx)/Math.hypot(a[0] - cx, a[1] - cz)*ov*1.4, a[1] + (a[1] - cz)/Math.hypot(a[0] - cx, a[1] - cz)*ov*1.4], eb = [b[0] + (b[0] - cx)/Math.hypot(b[0] - cx, b[1] - cz)*ov*1.4, b[1] + (b[1] - cz)/Math.hypot(b[0] - cx, b[1] - cz)*ov*1.4];
      T3(P.rf, [cx, H + rise, cz], [ea[0], H, ea[1]], [eb[0], H, eb[1]]); if (P.rc) segP(P.rc, [ea[0], H + 0.08, ea[1]], [cx, H + rise + 0.08, cz], 0.13, 4);
      if (P.tl) tileC(P.tl, [eb[0], H, eb[1]], [ea[0], H, ea[1]], [cx, H + rise, cz], [cx, H + rise, cz]); }
  }
};
// fan palm / traveller's palm: trunk and radiating fronds
const palmP = function(oT, oL, x, z, h, s, rng){
  segP(oT, [x, -4, z], [x + (rng() - 0.5)*0.6, h, z + (rng() - 0.5)*0.6], 0.22*s, 5, 0.16*s);
  const n = 9, a0 = rng()*TAU;
  for (let i = 0; i < n; i++){ const a = a0 + i/n*TAU, L = 3.6*s, ca = Math.cos(a), sa = Math.sin(a), tip = [x + ca*L, h - 1.2*s, z + sa*L], mid = [x + ca*L*0.5, h + 0.5*s, z + sa*L*0.5];
    const px = -sa*0.45*s, pz = ca*0.45*s;
    T3(oL, [x, h, z], [mid[0] + px, mid[1], mid[2] + pz], [mid[0] - px, mid[1], mid[2] - pz]); T3(oL, [mid[0] + px, mid[1], mid[2] + pz], tip, [mid[0] - px, mid[1], mid[2] - pz]); }
};
// lawn / planted ground: a thin plate on the plan polygon P with its top at y (sinks 0.7 m into the ground)
const lawnP = (o, P, y) => { wallsP(o, P, y - 0.7, y); capT(o, P, y); };
// traveller's palm (Ravenala): short trunk and a flat fan of paddle leaves in the vertical plane at bearing a
const travP = function(oT, oL, x, z, h, s, a, rng){
  const top = h*0.55, ca = Math.cos(a), sa = Math.sin(a); segP(oT, [x, -2, z], [x, top, z], 0.2*s, 5, 0.16*s);
  const n = 13, pt = (u, dx, dy, v) => [x + ca*(dx*u - dy*v), top + dy*u + dx*v, z + sa*(dx*u - dy*v)];
  for (let i = 0; i < n; i++){ const t = PI*(0.08 + 0.84*i/(n - 1)) + (rng() - 0.5)*0.08, L = h*0.5*(0.75 + 0.25*Math.sin(t)), dx = Math.cos(t), dy = Math.sin(t), w = 0.55*s;
    segP(oT, [x, top, z], pt(L*0.45, dx, dy, 0), 0.05*s, 3);
    const B0 = pt(L*0.45, dx, dy, 0), B1 = pt(L, dx, dy, 0), M0 = pt(L*0.72, dx, dy, w), M1 = pt(L*0.72, dx, dy, -w);
    T3(oL, B0, M0, B1); T3(oL, B0, B1, M1); }
};
// rain tree / angsana: a short trunk splitting into limbs and a broad, flattened umbrella crown
const rainP = function(oT, oC, x, z, s, rng){
  const h0 = 4.0*s; segP(oT, [x, -2, z], [x, h0, z], 0.45*s, 6, 0.38*s);
  for (let k = 0; k < 3; k++){ const a = rng()*TAU; segP(oT, [x, h0 - 0.3, z], [x + Math.cos(a)*2.4*s, h0 + 2.6*s, z + Math.sin(a)*2.4*s], 0.25*s, 5, 0.16*s); }
  // three overlapping rounded lobes make the broad, domed crown
  for (let k = 0; k < 3; k++){ const a = rng()*TAU + k*2.1, d = k ? 2.6*s : 0, R = (k ? 4.6 : 5.6)*s, y = h0 + (k ? 2.2 : 2.6)*s, cx = x + Math.cos(a)*d, cz = z + Math.sin(a)*d;
    latheP(oC, [[0.01, y - 0.4*s], [R*0.7, y], [R, y + 1.2*s], [R*0.85, y + 2.5*s], [R*0.5, y + 3.4*s], [0.01, y + 3.7*s]], cx, cz, 8, rng()*3); }
};
// outward faces of every edge of a plan polygon
const edgesOut = P => { const s = areaS(P); return P.map((a, i) => { const b = P[(i+1) % P.length]; return s > 0 ? fc(b[0], b[1], a[0], a[1]) : fc(a[0], a[1], b[0], b[1]); }); };
// pyramid / hipped roof over any convex plan polygon (apex over its centroid), eaves overhang ov
const pyrR = function(o, P, y, h, ov){ let cx = 0, cz = 0; for (const p of P){ cx += p[0]/P.length; cz += p[1]/P.length; }
  const E = P.map(p => { const dx = p[0] - cx, dz = p[1] - cz, l = Math.hypot(dx, dz) || 1; return [p[0] + dx/l*(ov || 0), p[1] + dz/l*(ov || 0)]; });
  for (let i = 0; i < E.length; i++){ const a = E[i], b = E[(i+1) % E.length]; T3(o, [a[0], y, a[1]], [b[0], y, b[1]], [cx, y + h, cz]); } };
// segmental (curved) pediment: base u0..u1 at y, rise h, depth d0..d1
const fsegped = function(o, oc, F, u0, u1, y, h, d0, d1, n){
  n = n || 10; const um = (u0 + u1)/2, hw = (u1 - u0)/2, R = (hw*hw + h*h)/(2*h), yc = y + h - R;
  const pt = i => { const a = Math.asin(hw/R)*(1 - 2*i/n); return [um - Math.sin(a)*R, yc + Math.cos(a)*R]; };
  for (let i = 0; i < n; i++){ const p = pt(i), q = pt(i + 1);
    for (const d of [d0, d1]) T3(o, fp(F, um, y, d), fp(F, p[0], p[1], d), fp(F, q[0], q[1], d));
    Q(o, fp(F, p[0], p[1], d0), fp(F, q[0], q[1], d0), fp(F, q[0], q[1], d1), fp(F, p[0], p[1], d1));
    if (oc) Q(oc, fp(F, p[0], p[1] + 0.45, d1 + 0.25), fp(F, q[0], q[1] + 0.45, d1 + 0.25), fp(F, q[0], q[1] + 0.45, d0), fp(F, p[0], p[1] + 0.45, d0)); }
};
// window grid on every edge of a plan polygon (curtain-wall / punched-window towers): floors fh from y0 to y1
const gridWins = function(o, P, y0, y1, fh, bw, ww, wh, sill, d){
  const nf = Math.floor((y1 - y0)/fh + 0.01);
  for (const F of edgesOut(P)){ if (F.L < ww + 0.4) continue; const nb = Math.max(1, Math.round(F.L/bw)), w = F.L/nb, wi = Math.min(ww, w*0.82);
    for (let i = 0; i < nb; i++){ const uc = (i + 0.5)*w; for (let k = 0; k < nf; k++){ const y = y0 + k*fh + sill; frect(o, F, uc - wi/2, uc + wi/2, y, y + wh, d); } } }
};
// horizontal band round a plan polygon (cornices, spandrel lines): projecting p, from y to y + h
const bandP = (o, P, y, h, p) => { const E = inset(P, -p); wallsP(o, E, y, y + h); capT(o, E, y + h); };
// a vertical slab whose side outline [[u, y], ...] (u along dir) is extruded th across: fins, blades, gussets
const slabP = function(o, x0, z0, dx, dz, outline, th){
  const l = Math.hypot(dx, dz), ux = dx/l, uz = dz/l, px = -uz*th/2, pz = ux*th/2;
  const P = (q, s) => [x0 + ux*q[0] + px*s, q[1], z0 + uz*q[0] + pz*s];
  const tri = THREE.ShapeUtils.triangulateShape(outline.map(q => new THREE.Vector2(q[0], q[1])), []);
  for (const t of tri) for (const s of [-1, 1]) T3(o, P(outline[t[0]], s), P(outline[t[1]], s), P(outline[t[2]], s));
  for (let i = 0; i < outline.length; i++){ const a = outline[i], b = outline[(i+1) % outline.length]; Q(o, P(a, -1), P(b, -1), P(b, 1), P(a, 1)); }
};

// ---------- extra helpers for this group ----------
// tapered box: base rectangle b0 = [x0, x1, z0, z1] at y0, top rectangle b1 at y1 (four sides + top cap)
const frust4 = function(o, b0, b1, y0, y1, cap){
  const A = [[b0[0], y0, b0[2]], [b0[1], y0, b0[2]], [b0[1], y0, b0[3]], [b0[0], y0, b0[3]]];
  const Bq = [[b1[0], y1, b1[2]], [b1[1], y1, b1[2]], [b1[1], y1, b1[3]], [b1[0], y1, b1[3]]];
  for (let i = 0; i < 4; i++){ const j = (i + 1) % 4; Q(o, A[i], A[j], Bq[j], Bq[i]); }
  if (cap !== false) Q(o, Bq[0], Bq[3], Bq[2], Bq[1]);
};
// regular n-gon plan points (first vertex at angle a0)
const ngon = (n, r, a0, cx, cz) => { const P = []; for (let i = 0; i < n; i++){ const a = (a0 || 0) + i/n*TAU; P.push([(cx || 0) + Math.cos(a)*r, (cz || 0) + Math.sin(a)*r]); } return P; };
// flat disc / ring on a face (medallions, clock-like roundels): centre (uc, yc), radius r (inner radius ri for a ring), depth d
const fdisc = function(o, F, uc, yc, r, d, n, ri){
  n = n || 14;
  for (let i = 0; i < n; i++){ const a = i/n*TAU, b = (i + 1)/n*TAU;
    if (ri) Q(o, fp(F, uc + Math.cos(a)*ri, yc + Math.sin(a)*ri, d), fp(F, uc + Math.cos(a)*r, yc + Math.sin(a)*r, d), fp(F, uc + Math.cos(b)*r, yc + Math.sin(b)*r, d), fp(F, uc + Math.cos(b)*ri, yc + Math.sin(b)*ri, d));
    else T3(o, fp(F, uc, yc, d), fp(F, uc + Math.cos(a)*r, yc + Math.sin(a)*r, d), fp(F, uc + Math.cos(b)*r, yc + Math.sin(b)*r, d)); }
};
// octagonal flared (Chinese) roof tier round (cx, cz): eave radius R at y, rising to radius rIn at the top
const roofTier = (o, cx, cz, y, R, rIn, rise) => latheP(o, [[rIn*0.92, y - 0.04], [R*0.9, y - 0.02], [R*1.04, y + 0.2], [R*0.9, y + 0.16], [R*0.62, y + rise*0.45], [rIn, y + rise]], cx, cz, 8, PI/8);
// seated guardian lion (stylised), facing direction a, on a small plinth at (x, y, z)
const lionP = function(o, op, x, y, z, a, s){
  const R = rotP(x, z, -a), P = (u, v, w) => { const q = R(u*s, 0, w*s); return [q[0], y + v*s, q[2]]; };
  const box = (oo, u0, u1, v0, v1, w0, w1) => { const p = [P(u0, v0, w0), P(u1, v0, w0), P(u1, v0, w1), P(u0, v0, w1), P(u0, v1, w0), P(u1, v1, w0), P(u1, v1, w1), P(u0, v1, w1)];
    Q(oo, p[4], p[7], p[6], p[5]); Q(oo, p[0], p[4], p[5], p[1]); Q(oo, p[1], p[5], p[6], p[2]); Q(oo, p[2], p[6], p[7], p[3]); Q(oo, p[3], p[7], p[4], p[0]); };
  box(op, -0.55, 0.55, 0, 0.35, -0.38, 0.38);                 // plinth
  box(o, -0.45, 0.15, 0.35, 0.85, -0.3, 0.3);                  // haunches
  box(o, 0.0, 0.42, 0.35, 1.25, -0.24, 0.24);                  // chest and forelegs
  box(o, 0.2, 0.5, 0.35, 0.5, -0.26, 0.26);                    // paws
  box(o, 0.05, 0.52, 1.1, 1.62, -0.3, 0.3);                    // head and mane
  box(o, 0.45, 0.62, 1.18, 1.42, -0.16, 0.16);                 // muzzle
};

// =====================================================================================================================
// ===== Civilian War Memorial (1967, Swan & Maclaren / Leong Swee Lim): four identical white tapering concrete pillars,
// about 68 m tall ("the chopsticks", one for each of the Chinese, Malay, Indian and Eurasian communities), standing close
// together round a cross-shaped gap over the bronze urn on its pedestal, on a square podium above the burial vault,
// ringed by a shallow pool, in War Memorial Park on Beach Road. Local axes: +x = bearing 121.8 deg (ESE, the park's
// axis path through the memorial), +z = SSW.
LANDMARKS.sgwarmem = {zh:'日本占领时期死难人民纪念碑', en:'Civilian War Memorial', cat:'old', r:26, h:68,
  lt:{m:0, c:'#fff4e4', k:1.15, e:0.85},
  build(){
    const g = new THREE.Group(), B = mkB();
    const W = B.p('#f6f5f0'), GR = B.p('#cdcac2'), GD = B.p('#a19d95'), WA = B.p({c:'#4b6870', lk:0.1}), BR = B.p({c:'#6d5836', lk:0.5});
    const S = h => [[-h, -h], [h, -h], [h, h], [-h, h]];
    // paved rim round the square reflecting pool (down into the ground), granite coping, water, causeways on the axis
    prismP(GR, S(17.6), -5, 0.06);
    wallsP(GD, S(17.0), 0.06, 0.5); ringP(GD, S(17.0), S(16.4), 0.5); wallsP(GD, S(16.4), 0.3, 0.5);
    ringP(WA, S(16.4), S(7.4), 0.3);
    for (const s of [-1, 1]) bx(GR, s > 0 ? 7.4 : -17.0, s > 0 ? 17.0 : -7.4, 0.06, 0.95, -1.9, 1.9);
    // the axis walk continues to the park's square path as a gentle ramp down to the lawn
    for (const s of [-1, 1]){ const a = s*17.6, b = s*18.6; frust4(GR, [Math.min(a, b), Math.max(a, b), -1.7, 1.7], [Math.min(a, b), Math.max(a, b), -1.7, 1.7], -1.2, -1.2, false);
      Q(GR, [a, 0.06, -1.7], [b, -0.75, -1.7], [b, -0.75, 1.7], [a, 0.06, 1.7]); Q(GD, [a, 0.06, -1.7], [a, -1.2, -1.7], [b, -1.2, -1.7], [b, -0.75, -1.7]); Q(GD, [a, 0.06, 1.7], [b, -0.75, 1.7], [b, -1.2, 1.7], [a, -1.2, 1.7]); }
    // podium over the vault: two steps
    prismP(GR, S(7.4), -1, 0.95); prismP(GR, S(6.7), 0.95, 1.5);
    // the four pillars: each tapers about its own axis (3.1 m square at the foot, 1.3 m at the top), so the cross-shaped gap
    // between them widens from 1.3 m to 3.1 m towards the sky
    const pc = 2.2, wb = 3.1, wt = 1.3, Y = 1.5, H = 68;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]){
      const cx = sx*pc, cz = sz*pc, yb = Y + 1.25, wm = wb + (wt - wb)*(yb - Y)/(H - Y);
      bx(GD, cx - wb/2 - 0.12, cx + wb/2 + 0.12, Y, yb, cz - wb/2 - 0.12, cz + wb/2 + 0.12);       // inscribed pedestal block
      frust4(W, [cx - wm/2, cx + wm/2, cz - wm/2, cz + wm/2], [cx - wt/2, cx + wt/2, cz - wt/2, cz + wt/2], yb, H);
    }
    // bronze urn on its pedestal in the middle of the pillars
    bx(GD, -0.6, 0.6, Y, Y + 1.0, -0.6, 0.6); bx(GR, -0.7, 0.7, Y + 1.0, Y + 1.15, -0.7, 0.7);
    latheP(BR, [[0.01, Y + 1.15], [0.32, Y + 1.15], [0.24, Y + 1.3], [0.46, Y + 1.6], [0.56, Y + 1.95], [0.45, Y + 2.25], [0.3, Y + 2.4], [0.36, Y + 2.5], [0.01, Y + 2.55]], 0, 0, 12);
    B.flush(g); return g; }};

// =====================================================================================================================
// ===== The Cenotaph (1922 / 1929, Denis Santry of Swan & Maclaren; WW II additions 1950), Esplanade Park: white granite
// pylon after Lutyens' Whitehall Cenotaph, the tomb chest on the top, bronze laurel-wreath medallions, the two low wings
// with their pylons and bronze name plates, on a flight of five steps; and, 212 m further south-south-west along the same
// line in the park, the Lim Bo Seng Memorial (1954, Ng Keng Siang): an octagonal white marble pagoda with three bronze roof
// tiers on a stepped octagonal pedestal guarded by four bronze lions. The park kiosk that stands on the line between them
// is included (the app hides the real buildings under the model's hull). Local axes: +x = bearing 24.8 deg (NNE, the
// Cenotaph's long axis), +z = WNW (towards the Padang); the Cenotaph is at the origin.
LANDMARKS.sgcenotaph = {zh:'和平纪念碑', en:'The Cenotaph', cat:'old', r:225, h:17.5,
  lt:{m:0, c:'#fff1dc', k:1.05, e:0.6},
  build(){
    // the app puts y = 0 at the highest ground within r (+0.6 m): the Cenotaph's lawn is ~0.9 m lower, and the Lim Bo Seng
    // Memorial and the kiosk stand by the water about 3.8 m lower still, so each piece sits in its own offset group
    const g = new THREE.Group(), gC = new THREE.Group(), gL = new THREE.Group(); gC.position.y = -0.8; gL.position.y = -3.75; g.add(gC, gL);
    const B = mkB(), BL = mkB();
    const W = B.p('#ebe8df'), GR = B.p('#d2cec4'), GD = B.p('#a7a39a'), BR = B.p({c:'#6a5634', lk:0.45}),
      MW = BL.p('#f1f0ec'), RB = BL.p({c:'#4f5a4a', lk:0.35}), KW = BL.p('#e3ded2'), KR = BL.p({c:'#5b5e60', lk:0.2}), KD = BL.p('#3a3f42'), PV = BL.p('#bdb8ae'),
      GRL = BL.p('#d2cec4'), GDL = BL.p('#a7a39a'), BRL = BL.p({c:'#6a5634', lk:0.45});
    // ---- five steps (24.1 x 14.5 m at the foot) ----
    for (let k = 0; k < 5; k++){ const hl = 12.05 - 0.55*k, hw = 7.25 - 0.55*k; prismP(k ? GR : GD, [[-hl, -hw], [hl, -hw], [hl, hw], [-hl, hw]], k ? k*0.3 : -5, (k + 1)*0.3); }
    const Y = 1.5;
    // ---- central pylon: plinth, slightly tapering shaft, cornice, upper stage, tomb chest ----
    bx(W, -2.8, 2.8, Y, Y + 0.9, -1.85, 1.85);
    frust4(W, [-2.5, 2.5, -1.55, 1.55], [-2.25, 2.25, -1.35, 1.35], Y + 0.9, 14.6);
    bx(W, -2.4, 2.4, 14.6, 15.15, -1.5, 1.5); bx(W, -2.0, 2.0, 15.15, 16.6, -1.15, 1.15);
    frust4(W, [-1.6, 1.6, -0.82, 0.82], [-1.45, 1.45, -0.7, 0.7], 16.6, 17.75); frust4(W, [-1.55, 1.55, -0.78, 0.78], [-1.2, 1.2, -0.42, 0.42], 17.75, 18.3);
    // bronze wreath medallions on both faces, a recessed panel below
    for (const F of [fc(-2.3, 1.38, 2.3, 1.38), fc(2.3, -1.38, -2.3, -1.38)]){
      fdisc(BR, F, F.L/2, 12.6, 0.95, 0.06, 18, 0.66); fdisc(BR, F, F.L/2, 12.6, 0.34, 0.06, 10); }
    for (const F of [fc(-2.8, 1.85, 2.8, 1.85), fc(2.8, -1.85, -2.8, -1.85)]) fbx(BR, F, F.L/2 - 1.6, F.L/2 + 1.6, Y + 0.25, Y + 0.65, 0, 0.04);
    // bronze handles (lions' heads) on the tomb chest ends
    for (const s of [-1, 1]) bx(BR, s*1.62 - 0.08, s*1.62 + 0.08, 17.1, 17.45, -0.2, 0.2);
    // ---- the wings: low walls with pylons (a large one at each end, five small between) and bronze name plates ----
    for (const s of [-1, 1]){
      const x0 = s*2.6, x1 = s*8.3, xa = Math.min(x0, x1), xb = Math.max(x0, x1);
      bx(W, xa, xb, Y, Y + 2.6, -0.75, 0.75); bx(GR, xa - 0.05, xb + 0.05, Y + 2.6, Y + 2.85, -0.9, 0.9);
      for (const xe of [s*3.2, s*7.7]){ bx(W, xe - 0.75, xe + 0.75, Y, Y + 3.9, -1.15, 1.15); bx(GR, xe - 0.85, xe + 0.85, Y + 3.9, Y + 4.2, -1.25, 1.25); frust4(W, [xe - 0.6, xe + 0.6, -0.9, 0.9], [xe - 0.3, xe + 0.3, -0.5, 0.5], Y + 4.2, Y + 4.7); }
      for (let i = 1; i <= 5; i++){ const xm = s*(3.95 + i*0.5); bx(W, xm - 0.17, xm + 0.17, Y, Y + 3.1, -0.92, 0.92); }
      for (const zs of [-1, 1]) bx(BR, xa + 0.95, xb - 0.95, Y + 0.7, Y + 2.1, zs*0.76 - 0.02, zs*0.76 + 0.02);
    }
    // ---- Lim Bo Seng Memorial (local -212.1, 8.2) ----
    { const lx = -212.1, lz = 8.2;
      prismP(PV, ngon(8, 9.6, PI/8, lx, lz), -5, 0.06);                      // paved octagon inside the path ring
      prismP(GDL, ngon(8, 6.4, PI/8, lx, lz), 0.06, 0.4); prismP(GRL, ngon(8, 5.3, PI/8, lx, lz), 0.4, 0.75);
      const ped = ngon(8, 2.45, PI/8, lx, lz); prismP(MW, ped, 0.75, 2.35);
      bandP(GRL, ped, 2.25, 0.2, 0.15); bandP(GRL, ped, 0.75, 0.25, 0.12);
      edgesOut(ped).forEach((F, i) => { if (i % 2 === 0) fbx(BRL, F, F.L*0.18, F.L*0.82, 1.15, 1.95, 0, 0.04); });
      // pagoda: three marble storeys under three bronze roof tiers, finial
      const body = (r, y0, y1) => { const P = ngon(8, r, PI/8, lx, lz); prismP(MW, P, y0, y1);
        edgesOut(P).forEach(F => fbx(GDL, F, F.L*0.3, F.L*0.7, y0 + 0.12, y1 - 0.12, -0.02, 0.01)); };
      body(1.3, 2.45, 3.35); roofTier(RB, lx, lz, 3.35, 2.0, 0.95, 0.5);
      body(0.95, 3.8, 4.45); roofTier(RB, lx, lz, 4.45, 1.55, 0.7, 0.42);
      body(0.7, 4.85, 5.3); roofTier(RB, lx, lz, 5.3, 1.2, 0.08, 0.6);
      latheP(RB, [[0.01, 5.8], [0.14, 5.85], [0.1, 6.1], [0.17, 6.25], [0.06, 6.55], [0.01, 6.7]], lx, lz, 8);
      prismP(MW, ngon(8, 1.45, PI/8, lx, lz), 2.35, 2.45);
      // four bronze guardian lions on the lower terrace, facing outwards on the diagonals
      for (let k = 0; k < 4; k++){ const a = PI/4 + k*HP; lionP(BRL, GRL, lx + Math.cos(a)*3.9, 0.75, lz + Math.sin(a)*3.9, a, 0.85); }
    }
    // ---- the park kiosk on the line between the two memorials (real footprint, 6.5 m) ----
    { const x0 = -123.2, x1 = -106.8, z0 = 0.4, z1 = 5.8;
      bx(KW, x0, x1, -4, 3.4, z0, z1); const F = rectF(x0, x1, z0, z1);
      for (const s of ['f', 'b']) fwins(KD, KD, F[s], 0.8, F[s].L - 0.8, 2.6, [[0.7, 2.0, 'r', 1.6]], 0.05, LMCTX.rng, 0);
      hipR(KR, x0, x1, z0, z1, 3.4, 2.9, 0.9, KR, null, null); }
    B.flush(gC); BL.flush(gL); return g; }};

// =====================================================================================================================
// ===== Tan Kim Seng Fountain (1882, cast iron by Andrew Handyside & Co., Derby; in Esplanade Park since 1925): three
// tiers about 7 m high in a round pool, the four Muses (Calliope, Clio, Erato, Melpomene) round the stem in the lower
// bowl, four Poseidon masks spouting into the pool below them, cherubs under the upper bowl and the vase on the top.
LANDMARKS.sgtankimseng = {zh:'陈金声喷泉', en:'Tan Kim Seng Fountain', cat:'old', r:5, h:7,
  lt:{m:0, c:'#ffe9c6', k:1.15, e:0.7},
  build(){
    const g = new THREE.Group(), B = mkB();
    const FB = B.p('#e6dfcb'), GD = B.p({c:'#c19a45', lk:0.6}), CR = B.p('#cbc5b8'), PV = B.p('#8f9a9a'),
      WA = B.p({c:'#5b8a9a', glow:'#2f6f8f', gk:0.35}), WS = B.p({c:'#dcecf2', op:0.38, lk:0.3});
    const n = 20;
    // paved apron and the pool
    // the pool (kept within 4 m so the park path that ends at the fountain's paved circle stays visible)
    latheP(CR, [[3.85, -3], [3.85, 0.55], [4.0, 0.6], [4.0, 0.75], [3.5, 0.75], [3.5, 0.3]], 0, 0, 28);
    latheP(PV, [[3.52, 0.05], [0.01, 0.05]], 0, 0, 24); latheP(WA, [[3.51, 0.42], [0.01, 0.42]], 0, 0, 24);
    // octagonal pedestal with the four Poseidon masks, stem
    latheP(FB, [[1.2, 0.3], [1.2, 0.55], [1.02, 0.66], [0.96, 1.25], [1.12, 1.33], [1.12, 1.47], [0.72, 1.56]], 0, 0, 8, PI/8);
    latheP(FB, [[0.72, 1.56], [0.46, 1.76], [0.4, 2.02]], 0, 0, n);
    const P8 = ngon(8, 0.99, PI/8);
    edgesOut(P8).forEach((F, i) => { if (i % 2 === 0){ fdisc(GD, F, F.L/2, 0.98, 0.2, 0.04, 10);
      const c = fp(F, F.L/2, 0.9, 0.1), d = [F.nx, F.nz]; let p0 = c;
      for (let k = 1; k <= 5; k++){ const t = k/5, p1 = [c[0] + d[0]*1.9*t, 0.9 + 0.35*Math.sin(t*PI*0.7) - 0.55*t*t, c[2] + d[1]*1.9*t]; segP(WS, p0, p1, 0.04, 3); p0 = p1; } } });
    // lower bowl (gilt rim), central column, the four Muses
    latheP(FB, [[0.4, 2.02], [1.15, 2.1], [1.9, 2.34], [2.3, 2.58], [2.38, 2.74], [2.2, 2.74], [1.85, 2.56], [0.5, 2.46]], 0, 0, n);
    latheP(GD, [[2.41, 2.62], [2.41, 2.72]], 0, 0, n);
    latheP(FB, [[0.4, 2.46], [0.31, 2.8], [0.27, 3.55], [0.36, 3.78], [0.3, 3.96]], 0, 0, 10);
    for (let k = 0; k < 4; k++){ const a = PI/4 + k*HP, x = Math.cos(a)*0.98, z = Math.sin(a)*0.98;
      latheP(FB, [[0.01, 2.46], [0.33, 2.46], [0.31, 2.7], [0.25, 3.15], [0.2, 3.42], [0.16, 3.56], [0.09, 3.6], [0.12, 3.72], [0.1, 3.84], [0.01, 3.88]], x, z, 8);
      latheP(GD, [[0.01, 3.55], [0.16, 3.57], [0.1, 3.62], [0.01, 3.63]], x, z, 6); }
    // middle bowl, upper stem with cherubs, upper bowl, vase
    latheP(FB, [[0.3, 3.96], [0.8, 4.06], [1.34, 4.3], [1.46, 4.46], [1.3, 4.46], [0.36, 4.36]], 0, 0, n);
    latheP(GD, [[1.48, 4.36], [1.48, 4.44]], 0, 0, n);
    latheP(FB, [[0.3, 4.36], [0.22, 4.6], [0.2, 5.2], [0.28, 5.36]], 0, 0, 10);
    for (let k = 0; k < 3; k++){ const a = k*TAU/3, x = Math.cos(a)*0.3, z = Math.sin(a)*0.3; latheP(GD, [[0.01, 4.55], [0.14, 4.62], [0.15, 4.8], [0.1, 4.93], [0.13, 5.0], [0.01, 5.08]], x, z, 6); }
    latheP(FB, [[0.28, 5.36], [0.55, 5.46], [0.75, 5.6], [0.79, 5.71], [0.65, 5.71], [0.25, 5.63]], 0, 0, 14);
    latheP(GD, [[0.2, 5.63], [0.12, 5.8], [0.22, 6.0], [0.29, 6.3], [0.2, 6.55], [0.12, 6.6], [0.16, 6.76], [0.05, 6.95], [0.01, 7.0]], 0, 0, 10);
    // water trickling from the bowl rims in thin streams
    for (const [r0, y0, y1, nS] of [[2.42, 2.62, 0.44, 20], [1.5, 4.38, 2.6, 14], [0.8, 5.66, 4.42, 9]])
      for (let i = 0; i < nS; i++){ const a = (i + 0.5)/nS*TAU, c = Math.cos(a), sn = Math.sin(a);
        segP(WS, [c*r0, y0, sn*r0], [c*(r0 + 0.14), y0 - (y0 - y1)*0.35, sn*(r0 + 0.14)], 0.045, 3, 0.04); segP(WS, [c*(r0 + 0.14), y0 - (y0 - y1)*0.35, sn*(r0 + 0.14)], [c*(r0 + 0.24), y1, sn*(r0 + 0.24)], 0.04, 3, 0.03); }
    B.flush(g); return g; }};

// verandah screen on a face F (two-storey colonial verandah: arcade below, columns + balustrade above), as in colRange
const verScreen = function(P, F, y0, H, nf, vd, bay, arch){
  const fh = (H - y0)/nf, n = Math.max(1, Math.round(F.L/bay));
  if (arch !== false) farcade(P.w, F, 0, F.L, n, y0, y0 + fh*0.55, y0 + fh, 0.75, -0.65, 0.05);
  else for (let i = 0; i <= n; i++) fcol(P.t, P.t, F, i*F.L/n, -0.35, y0, y0 + fh, 0.3, 6);
  for (let k = 1; k < nf; k++){ const yb = y0 + k*fh;
    fbx(P.t, F, 0, F.L, yb - 0.4, yb, -vd, 0.12);
    for (let i = 0; i <= n; i++) fcol(P.t, P.t, F, i*F.L/n, -0.35, yb, yb + fh - 0.45, 0.22, 6);
    fbal(P.t, F, 0.25, F.L - 0.25, yb, 1.0, -0.35, 0.16); }
  fbx(P.t, F, -0.05, F.L + 0.05, H - 0.5, H, -vd, 0.2);
};
// block on a convex plan polygon with verandahs on the edges listed in ver (edge i runs P[i] -> P[i+1]); pyramid roof
const polyVer = function(P, poly, ver, o){
  const vd = o.vd || 2.6, inner = insetE(poly, poly.map((_, i) => ver.includes(i) ? vd : 0));
  polyBlock(P, inner, Object.assign({}, o, {rise:0}));
  const E = edgesOut(poly); for (const i of ver) verScreen(P, E[i], o.y0 === undefined ? 0.6 : o.y0, o.H, o.nf || 2, vd, o.bay || 3.6, o.arch);
  capP(P.t, poly, o.H - 0.02);
  if (o.rise) pyrR(P.rf, poly, o.H, o.rise, o.ov === undefined ? 0.9 : o.ov);
};

// =====================================================================================================================
// ===== Singapore Cricket Club (pavilion of 1884, extended 1907, north and south wings 1922): the white two-storey
// clubhouse at the south-west end of the Padang with deep two-storey verandahs towards the pitch (arcade below, columns
// and balustrades above), green shutters and red Marseille-tiled hipped roofs; the 1884 core in the middle with its
// pedimented gable, the angled inner ends of the wings looking diagonally onto the pitch, the projecting end bays and the
// lower rear ranges. Local axes: +x = bearing 119 deg (along the Padang edge towards Connaught Drive / the river), -z =
// the Padang (NNE).
LANDMARKS.sgcricket = {zh:'新加坡板球俱乐部', en:'Singapore Cricket Club', cat:'old', r:46, h:15.5,
  lt:{m:0, c:'#ffe0b4', k:0.95, e:0.55, anim:'breathe'},
  build(){
    // the map's ground falls from 4.0 m (west end) to 1.2 m (east end) under the club: the whole model sits 1.6 m lower
    const g0 = new THREE.Group(), g = new THREE.Group(); g.position.y = -1.6; g0.add(g);
    const B = mkB(), rng = LMCTX.rng;
    const w = B.p('#f4f2eb'), t = B.p('#e3ded1'), dk = B.p('#344d3d'), lit = B.p({c:'#3d3a2e', glow:'#ffcf8f', gk:0.6}),
      rt = B.p({c:'#a9583a', lk:0.3}), rc = B.p({c:'#7c3b25', lk:0.25});
    const P = {w, t, dk, lit, rf:rt, rc, tl:rc, rng};
    const FP = [[-13.2,-14.6],[-5.9,-6.4],[7.9,-6.0],[13.0,-12.9],[38.6,-12.1],[38.6,-7.4],[41.2,-7.5],[40.8,1.5],[38.4,0.9],[38.5,4.9],[20.1,4.9],[20.5,0.7],[16.1,5.1],[16.0,16.0],[9.6,15.5],[8.9,18.0],[3.3,17.6],[3.5,24.3],[-2.6,24.3],[-2.9,17.6],[-7.4,18.1],[-7.0,15.2],[-15.0,15.6],[-14.4,4.3],[-19.4,-1.0],[-19.4,3.8],[-37.0,4.1],[-38.0,-0.2],[-41.0,-0.6],[-40.3,-10.4],[-38.4,-10.8],[-38.5,-13.4]];
    LPoly(g, FP, -5, 5.6, '#cfc8ba');
    const WH = 11.2, VR = {H:WH, nf:2, vd:2.8, bay:3.7, rise:3.4, ov:0.9};
    // the wings (1922): long ranges with the pitch verandah, angled inner ends, projecting end bays
    colRange(P, -38.5, -13.2, -14.0, 4.0, Object.assign({ver:'b'}, VR));
    colRange(P, 13.0, 38.6, -12.5, 4.9, Object.assign({ver:'b'}, VR));
    polyVer(P, [[-13.2,-14.0],[-5.9,-6.2],[-5.9,4.9],[-13.2,4.9]], [0], {H:WH, nf:2, vd:2.6, bay:3.5, rise:2.9, ov:0.9});
    polyVer(P, [[7.9,-6.2],[13.0,-12.5],[13.0,4.9],[7.9,4.9]], [0], {H:WH, nf:2, vd:2.6, bay:3.5, rise:2.9, ov:0.9});
    for (const [x0, x1, z0, z1, s] of [[-41.0, -38.3, -10.6, -0.4, -1], [38.4, 41.1, -7.5, 1.3, 1]]){
      colRange(P, x0, x1, z0, z1, {H:WH, nf:2, ver:'', bay:3.2, rise:0});
      gabR(rt, w, x0 - (s < 0 ? 0.5 : 2.0), x1 + (s > 0 ? 0.5 : 2.0), z0, z1, WH, 3.0, 'x', 0.45, rc);
      const F = s < 0 ? rectF(x0, x1, z0, z1).l : rectF(x0, x1, z0, z1).r; farch(dk, F, F.L/2, WH + 0.2, 1.1, WH + 1.3, 0.05, 6); }
    // the 1884 core: verandah front, pedimented gable towards the pitch, taller roof
    colRange(P, -5.9, 7.9, -6.2, 4.9, {H:12.2, nf:2, ver:'b', vd:2.8, bay:3.45, rise:0});
    gabR(rt, w, -6.4, 8.4, -6.9, 4.9, 12.2, 4.6, 'z', 0, rc);
    { const F = rectF(-5.9, 7.9, -6.2, 4.9).b; fped(w, t, F, -0.5, F.L + 0.5, 12.2, 4.4, -0.05, 0.75); fdisc(dk, F, F.L/2, 14.0, 0.9, 0.8, 16); fdisc(t, F, F.L/2, 14.0, 1.1, 0.78, 16, 0.9); }
    // rear ranges (bars, dining rooms, kitchens)
    colRange(P, -15.0, 16.0, 4.9, 15.8, {H:10.4, nf:2, ver:'', bay:3.6, rise:3.0, ov:0.8});
    colRange(P, -2.8, 3.4, 15.8, 24.3, {H:8.2, nf:2, ver:'', bay:3.0, rise:2.2, ov:0.6});
    colRange(P, 3.4, 9.4, 15.8, 17.9, {H:7.0, nf:2, ver:'', bay:3.0, rise:1.2, ov:0.4});
    colRange(P, -7.3, -2.8, 15.8, 17.9, {H:7.0, nf:2, ver:'', bay:3.0, rise:1.2, ov:0.4});
    // the members' spectator stand in front of the pavilion (real footprint, 7 m): raked seating under a tiled roof on
    // slender cast-iron columns, open towards the pitch
    { const x0 = -16.3, x1 = 13.6, z0 = -21.6, z1 = -16.6, Fs = fc(x1, z0, x0, z0);
      bx(t, x0, x1, -5, 0.6, z0, z1); for (let k = 0; k < 5; k++) bx(w, x0 + 0.3, x1 - 0.3, 0.6, 1.0 + k*0.45, z0 + 0.6 + k*0.85, z1);
      bx(w, x0, x1, 0.6, 4.4, z1 - 0.3, z1); bx(w, x0, x0 + 0.3, 0.6, 4.4, z0, z1); bx(w, x1 - 0.3, x1, 0.6, 4.4, z0, z1);
      for (let i = 0; i <= 10; i++){ const c = fp(Fs, i*Fs.L/10, 0, -0.35); segP(t, [c[0], 0.6, c[2]], [c[0], 4.4, c[2]], 0.13, 6); }
      fbal(t, Fs, 0.2, Fs.L - 0.2, 0.6, 0.9, -0.35, 0.12); bx(t, x0 - 0.2, x1 + 0.2, 4.2, 4.5, z0 - 0.2, z1 + 0.2);
      hipR(rt, x0, x1, z0, z1, 4.5, 2.4, 0.7, rc, t, rc); }
    B.flush(g); return g0; }};

// =====================================================================================================================
// ===== Singapore Recreation Club (clubhouse of 1997 on the site of the 1884 pavilion, north-east end of the Padang): a
// long white three-storey neo-colonial range facing the Padang with a two-storey verandah (arcade and columned loggia),
// a taller central pavilion with a pediment, lower two-storey end pavilions and a stepped rear towards Stamford Road /
// Raffles City under hipped roofs. Local axes: +x = bearing 116 deg (along the Padang edge), +z = the Padang (SSW).
LANDMARKS.sgsrc = {zh:'新加坡康乐俱乐部', en:'Singapore Recreation Club', cat:'new', r:52, h:18.3,
  lt:{m:0, c:'#ffe6c2', k:0.85, e:0.5},
  build(){
    const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
    const w = B.p('#f2f1ec'), t = B.p('#dcd9d0'), dk = B.p('#2e3438'), lit = B.p({c:'#3a3832', glow:'#ffd49a', gk:0.6}),
      rt = B.p({c:'#67737d', lk:0.25}), rc = B.p({c:'#4f5960', lk:0.2});
    const P = {w, t, dk, lit, rf:rt, rc, tl:rc, rng};
    const FP = [[-37.6,3.5],[-37.3,-9.2],[-21.8,-9.0],[-22.2,-12.2],[-14.7,-11.8],[-14.0,-17.4],[-2.9,-17.6],[-3.1,-24.8],[5.5,-25.1],[5.9,-17.4],[16.6,-17.3],[17.1,-11.0],[23.7,-10.9],[23.7,-8.2],[39.7,-8.2],[39.3,7.2],[46.5,6.9],[46.5,13.6],[-46.1,13.6],[-45.7,3.5]];
    LPoly(g, FP, -5, 5.6, '#cdc8bd');
    const MR = {H:11.6, nf:3, vd:2.8, bay:3.8, rise:3.0, ov:0.9, pil:true};
    // main range (Padang front verandah) either side of the central pavilion
    colRange(P, -37.4, -3.0, -8.8, 13.6, Object.assign({ver:'f'}, MR));
    colRange(P, 5.7, 39.5, -8.2, 13.6, Object.assign({ver:'f'}, MR));
    // central pavilion: taller, deeper, pediment over the front
    colRange(P, -3.0, 5.7, -8.8, 13.6, {H:14.4, nf:3, ver:'f', vd:2.8, bay:2.9, rise:0});
    gabR(rt, w, -3.5, 6.2, -9.3, 14.1, 14.4, 3.6, 'z', 0, rc);
    colRange(P, -3.0, 5.7, -25.0, -8.8, {H:12.2, nf:3, ver:'', bay:2.9, rise:0, pil:true}); bx(t, -3.2, 5.9, 12.2, 13.0, -25.2, -24.7);
    { const F = rectF(-3.0, 5.7, -25.0, 13.6).f; fped(w, t, F, -0.4, F.L + 0.4, 14.4, 3.4, -0.05, 0.6); fdisc(dk, F, F.L/2, 15.6, 0.7, 0.62, 14); }
    // lower end pavilions
    colRange(P, -46.1, -37.4, 3.5, 13.6, {H:8.8, nf:2, ver:'f', vd:2.6, bay:3.2, rise:2.6, ov:0.8});
    colRange(P, 39.5, 46.5, 7.0, 13.6, {H:8.8, nf:2, ver:'f', vd:2.6, bay:3.2, rise:2.4, ov:0.8});
    // the stepped rear (flat roofs with a parapet)
    for (const [x0, x1, z0] of [[-21.9, -14.5, -12.1], [-14.5, -3.0, -17.5], [5.7, 16.8, -17.4], [16.8, 23.7, -11.0]]){
      colRange(P, x0, x1, z0, -8.6, {H:11.2, nf:3, ver:'', bay:3.6, rise:0, pil:true}); bx(t, x0 - 0.2, x1 + 0.2, 11.2, 12.0, z0 - 0.2, z0 + 0.3); }
    // the Padang-side pavilion (real footprint, 6.3 m): glazed sports bar under a hipped roof, columns round a deck
    { const x0 = -17.6, x1 = 2.4, z0 = 18.7, z1 = 22.7, gl = B.p({c:'#3d4a50', glow:'#ffd9a0', gk:0.5});
      bx(t, x0, x1, -5, 0.6, z0, z1); bx(gl, x0 + 1.2, x1 - 1.2, 0.6, 3.8, z0 + 0.6, z1 - 1.0);
      const Fp = fc(x0, z1, x1, z1); for (let i = 0; i <= 8; i++){ const c = fp(Fp, i*Fp.L/8, 0, -0.4); segP(w, [c[0], 0.6, c[2]], [c[0], 3.9, c[2]], 0.18, 8); }
      const Fb = fc(x1, z0, x0, z0); for (let i = 0; i <= 8; i++){ const c = fp(Fb, i*Fb.L/8, 0, -0.4); segP(w, [c[0], 0.6, c[2]], [c[0], 3.9, c[2]], 0.18, 8); }
      bx(w, x0 - 0.2, x1 + 0.2, 3.9, 4.3, z0 - 0.2, z1 + 0.2); hipR(rt, x0, x1, z0, z1, 4.3, 2.0, 0.6, rc, t, rc); }
    B.flush(g); return g; }};

// =====================================================================================================================
// ===== The Concourse (1994, Paul Rudolph with Architects 61), 300 Beach Road: the 41-storey, 175 m octagonal office
// tower ("an inverted pagoda"). It stands on twelve giant pilotis round a five-storey tapering glass reception hall;
// every floor is a ribbon of inclined glazing under a protruding white aluminium eave, and the floor clusters (four floors
// each) cantilever out on alternate faces, the projections rotating round the tower cluster by cluster. The top ends in
// a spiral: one sector of the octagon stops every floor, each capped by a sloping white sun-shade roof, round a core that
// carries the final pyramid roof. The low entrance block and its canopy fill the real footprint towards Beach Road.
// Local axes: +x = bearing 103.3 deg (ESE), +z = SSW; the origin is the middle of the tower.
LANDMARKS.sgconcourse = {zh:'鸿福中心', en:'The Concourse', cat:'new', r:66, h:175,
  lt:{m:1, c:'#ffe9c8', k:0.85, e:0.9},
  build(){
    const g = new THREE.Group(), B = mkB();
    const W = B.p({c:'#eceeeb', m:0, lc:'#eef3ff', lk:0.5}), WS = B.p({c:'#cfd3d2', m:0, lc:'#eef3ff', lk:0.35}),
      GL = B.p({c:'#3c5763', m:1, fh:4.0, cw:3.0}), MU = B.p({c:'#c4c9c9', m:0, lk:0.25}),
      RF = B.p({c:'#f2f1eb', m:0, lc:'#fff1d6', lk:1.15}), PL = B.p({c:'#e4e5e1', m:0, lk:0.55}),
      LB = B.p({c:'#4f6c77', glow:'#ffe2b0', gk:0.55}), PG = B.p({c:'#48606a', m:1, fh:5.0, cw:3.4}), BC = B.p({c:'#c9302a', glow:'#ff2a1a', gk:2.2});
    const C22 = Math.cos(PI/8), oct = a => ngon(8, a/C22, PI/8);
    const A0 = 25.6, OCT = oct(A0), Y0 = 25.6, FH = 4.0, NF = 28, YT = Y0 + NF*FH, SP = 1.75;
    // ---- floors: eave lip, spandrel, inclined ribbon glazing with mullions; clusters of four floors cantilever on two
    // opposite faces, rotating by 45 deg from cluster to cluster ----
    const offs = c => OCT.map((_, k) => (((k - c) % 4) + 4) % 4 === 0 ? -2.0 : 0);
    const band = (Pf, y0, fh, faces) => {
      const Pe = inset(Pf, -0.7), Pg = inset(Pf, -0.45), n = Pf.length;
      for (let k = 0; k < n; k++){ if (faces && !faces.includes(k)) continue; const j = (k + 1) % n, a = Pf[k], b = Pf[j], ea = Pe[k], eb = Pe[j], ga = Pg[k], gb = Pg[j];
        Q(W, [ea[0], y0, ea[1]], [eb[0], y0, eb[1]], [eb[0], y0 + 0.45, eb[1]], [ea[0], y0 + 0.45, ea[1]]);
        Q(W, [ea[0], y0 + 0.45, ea[1]], [eb[0], y0 + 0.45, eb[1]], [b[0], y0 + 0.45, b[1]], [a[0], y0 + 0.45, a[1]]);
        Q(WS, [ea[0], y0, ea[1]], [a[0], y0, a[1]], [b[0], y0, b[1]], [eb[0], y0, eb[1]]);
        Q(W, [a[0], y0 + 0.45, a[1]], [b[0], y0 + 0.45, b[1]], [b[0], y0 + SP, b[1]], [a[0], y0 + SP, a[1]]);
        Q(GL, [a[0], y0 + SP, a[1]], [b[0], y0 + SP, b[1]], [gb[0], y0 + fh, gb[1]], [ga[0], y0 + fh, ga[1]]);
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.max(1, Math.round(L/1.6)), nx = (gb[1] - ga[1]), nz = -(gb[0] - ga[0]);
        for (let i = 1; i < m; i++){ const f = i/m, f0 = f - 0.06/L, f1 = f + 0.06/L, P0 = (A, Bq, t) => [A[0] + (Bq[0] - A[0])*t, A[1] + (Bq[1] - A[1])*t];
          const p0 = P0(a, b, f0), p1 = P0(a, b, f1), q0 = P0(ga, gb, f0), q1 = P0(ga, gb, f1), e = 0.04/Math.hypot(nx, nz) || 0, sx = nx*e, sz = nz*e;
          Q(MU, [p0[0] - sx, y0 + SP, p0[1] - sz], [p1[0] - sx, y0 + SP, p1[1] - sz], [q1[0] - sx, y0 + fh, q1[1] - sz], [q0[0] - sx, y0 + fh, q0[1] - sz]); } }
    };
    let prev = null;
    for (let f = 0; f < NF; f++){
      const c = Math.floor(f/4), Pf = insetE(OCT, offs(c)), y0 = Y0 + f*FH;
      band(Pf, y0, FH);
      if (f % 4 === 0 && prev){ ringP(WS, inset(Pf, -0.7), prev, y0 - 0.005); ringP(W, inset(prev, -0.45), Pf, y0 + 0.455); }
      // white sunshade blades at both ends of each cantilevered face, the full height of the cluster
      if (f % 4 === 0){ const D = offs(c), Pe = inset(Pf, -0.9);
        for (let k = 0; k < 8; k++) if (D[k] < 0){ const j = (k + 1) % 8, yt = Math.min(Y0 + (f + 4)*FH, YT);
          for (const [a, b] of [[Pf[k], Pe[k]], [Pf[j], Pe[j]]]) Q(W, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], yt, b[1]], [a[0], yt, a[1]]); } }
      prev = Pf;
    }
    // exposed structure: white piers at the eight corners of the octagon
    for (const v of oct(A0 - 0.8)) bx(PL, v[0] - 0.75, v[0] + 0.75, 22.2, YT, v[1] - 0.75, v[1] + 0.75);
    // ---- base: twelve pilotis, the tapering five-storey glass reception hall, the transfer storey ----
    const LBot = oct(17.5), LTop = oct(22.0);
    for (let k = 0; k < 8; k++){ const j = (k + 1) % 8; Q(LB, [LBot[k][0], 0.6, LBot[k][1]], [LBot[j][0], 0.6, LBot[j][1]], [LTop[j][0], 22.2, LTop[j][1]], [LTop[k][0], 22.2, LTop[k][1]]);
      for (let i = 0; i <= 6; i++){ const f = i/6, b0 = [LBot[k][0] + (LBot[j][0] - LBot[k][0])*f, LBot[k][1] + (LBot[j][1] - LBot[k][1])*f], t0 = [LTop[k][0] + (LTop[j][0] - LTop[k][0])*f, LTop[k][1] + (LTop[j][1] - LTop[k][1])*f];
        segP(MU, [b0[0], 0.6, b0[1]], [t0[0], 22.2, t0[1]], 0.09, 4); }
      for (let y = 4.4; y < 22; y += 4.4){ const f = (y - 0.6)/21.6, p = [LBot[k][0] + (LTop[k][0] - LBot[k][0])*f, LBot[k][1] + (LTop[k][1] - LBot[k][1])*f], q = [LBot[j][0] + (LTop[j][0] - LBot[j][0])*f, LBot[j][1] + (LTop[j][1] - LBot[j][1])*f];
        segP(MU, [p[0], y, p[1]], [q[0], y, q[1]], 0.1, 4); } }
    capP(WS, oct(17.5), 0.62); wallsP(PL, oct(A0 + 0.4), -4, 0.6); ringP(PL, oct(A0 + 0.4), oct(17.5), 0.6);
    const OC1 = oct(A0 - 1.6);
    for (let k = 0; k < 8; k++){ const v = OC1[k], w2 = OC1[(k + 1) % 8], cols = k % 2 === 0 ? [v, [(v[0] + w2[0])/2, (v[1] + w2[1])/2]] : [v];
      for (const q of cols){ segP(PL, [q[0], -1, q[1]], [q[0], 20.4, q[1]], 1.2, 12); latheP(PL, [[1.2, 20.3], [1.75, 22.25]], q[0], q[1], 12); } }
    wallsP(W, OCT, 22.2, Y0); ringP(WS, OCT, LTop, 22.2); bandP(W, OCT, Y0 - 0.5, 0.5, 0.5);
    // ---- the spiral top: sector k stops k floors (3.3 m) above the last full floor, each under a sloping sun-shade roof ----
    const RC = 9.5, CI = oct(RC), SH = 3.3, Ys = k => YT + k*SH, YC = YT + 7*SH + 1.0;
    for (let k = 0; k < 8; k++){
      const j = (k + 1) % 8, nfk = k;
      for (let f = 0; f < nfk; f++) band(OCT, YT + f*SH, SH, [k]);
      // radial side wall between sector k-1 and k
      const kp = (k + 7) % 8, lo = Math.min(Ys(kp), Ys(k)), hi = Math.max(Ys(kp), Ys(k)), a = CI[k], b = OCT[k];
      for (let y = lo; y < hi - 0.1; y += SH){ const y1 = Math.min(hi, y + SH);
        Q(W, [a[0], y, a[1]], [b[0], y, b[1]], [b[0], y + 1.0, b[1]], [a[0], y + 1.0, a[1]]); Q(GL, [a[0], y + 1.0, a[1]], [b[0], y + 1.0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); }
      // sloping roof: eave pushed out 1.8 m beyond the face, rising to the core wall
      const nx = Math.cos(PI/4*(k + 1)), nz = Math.sin(PI/4*(k + 1)), y = Ys(k);
      const e0 = [OCT[k][0] + nx*1.8, y - 0.35, OCT[k][1] + nz*1.8], e1 = [OCT[j][0] + nx*1.8, y - 0.35, OCT[j][1] + nz*1.8];
      Q(RF, e0, e1, [CI[j][0], y + 4.6, CI[j][1]], [CI[k][0], y + 4.6, CI[k][1]]);
      Q(WS, e0, [OCT[k][0], y, OCT[k][1]], [OCT[j][0], y, OCT[j][1]], e1);
      Q(RF, [e0[0], y - 0.35, e0[2]], [e1[0], y - 0.35, e1[2]], [e1[0], y - 0.05, e1[2]], [e0[0], y - 0.05, e0[2]]);
    }
    // the core: banded walls up to the pyramid roof, a short finial with the aviation light
    for (let y = YT; y < YC - 0.1; y += SH) band(CI, y, SH);
    const YA = 174.0; pyrR(RF, inset(CI, -1.8), YC - 0.3, YA - YC + 0.3, 0); latheP(RF, [[0.45, YA - 1.0], [0.12, YA + 0.8], [0.01, YA + 0.9]], 0, 0, 8);
    bx(BC, -0.18, 0.18, YA + 0.6, YA + 0.95, -0.18, 0.18);
    // ---- entrance block and its canopy towards Beach Road (real footprint) ----
    const LO = [[-12.9,-25.6],[-13.2,-39.4],[-15.7,-39.4],[-19.0,-42.9],[-19.2,-46.5],[-7.2,-57.9],[-3.5,-58.1],[38.7,-14.6],[38.5,-10.2],[25.6,2.55],[25.6,-10.6],[10.6,-25.6]];
    wallsP(PL, LO, -4, 0.6); capT(PL, LO, 0.6);
    for (let i = 0; i < 9; i++){ const a = LO[i], b = LO[i + 1];
      Q(PG, [a[0], 0.6, a[1]], [b[0], 0.6, b[1]], [b[0], 9.6, b[1]], [a[0], 9.6, a[1]]);
      Q(W, [a[0], 4.6, a[1]], [b[0], 4.6, b[1]], [b[0], 5.4, b[1]], [a[0], 5.4, a[1]]); }
    wallsP(W, inset(LO, -0.15), 9.6, 10.5); capT(W, LO, 10.5);
    const CA = insetE(LO, LO.map((_, i) => i >= 9 ? 0 : -1.4));
    wallsP(W, CA, 13.2, 14.0); capT(W, CA, 14.0); capT(WS, CA, 13.2);
    for (let i = 1; i < 10; i++){ const q = CA[i]; segP(PL, [q[0], -1, q[1]], [q[0], 13.2, q[1]], 0.38, 8); }
    B.flush(g); return g; }};

// pointed (two-centred, radius 0.75 x span) arch opening between u0 and u1 springing at ys: the spandrels up to yt are
// filled solid between depths d0 and d1, with the arch soffit; an arch moulding into oT
const fpoint = function(o, oT, F, u0, u1, ys, yt, d0, d1){
  const wd = u1 - u0, R = 0.75*wd, n = 6;
  // left half: centre at u0 + R; right half mirrored
  const L = []; for (let i = 0; i <= n; i++){ const am = Math.acos((R - wd/2)/R), a = PI - (PI - am)*i/n; L.push([u0 + R + R*Math.cos(a), ys + R*Math.sin(a)]); }
  const Rr = L.map(q => [u0 + u1 - q[0], q[1]]).reverse(), C = L.concat(Rr.slice(1));
  for (let i = 0; i < C.length - 1; i++){ const a = C[i], b = C[i + 1];
    for (const d of [d0, d1]) Q(o, fp(F, a[0], a[1], d), fp(F, b[0], b[1], d), fp(F, b[0], yt, d), fp(F, a[0], yt, d));
    Q(o, fp(F, a[0], a[1], d0), fp(F, b[0], b[1], d0), fp(F, b[0], b[1], d1), fp(F, a[0], a[1], d1));
    if (oT) segP(oT, fp(F, a[0], a[1], d1 + 0.08), fp(F, b[0], b[1], d1 + 0.08), 0.12, 4); }
  for (const d of [d0, d1]){ Q(o, fp(F, u0, ys, d), fp(F, u0, yt, d), fp(F, u0 - 0.01, yt, d), fp(F, u0 - 0.01, ys, d)); }
};
// lancet with a hood mould (drip moulding following the pointed head) and a sill, mouldings into batch oT
const flh = function(o, oT, F, uc, y0, wd, ys, d, n){ flancet(o, F, uc, y0, wd, ys, d, n); const r = wd/2, R2 = wd + 0.24, am = Math.acos(-r/R2), m = 5;
  for (const sg of [1, -1]) for (let i = 0; i < m; i++){ const a0 = PI - (PI - am)*i/m, a1 = PI - (PI - am)*(i + 1)/m;
    segP(oT, fp(F, uc + sg*(r + R2*Math.cos(a0)), ys + R2*Math.sin(a0), d + 0.12), fp(F, uc + sg*(r + R2*Math.cos(a1)), ys + R2*Math.sin(a1), d + 0.12), 0.1, 4); }
  fbx(oT, F, uc - r - 0.15, uc + r + 0.15, y0 - 0.22, y0, -0.02, d + 0.22); };
// slender Gothic pinnacle (square shaft, gablets suggested by a band, pyramid spire) at (x, y, z)
const pinP = (oS, x, y, z, s, h) => { bx(oS, x - s/2, x + s/2, y, y + h*0.35, z - s/2, z + s/2); bx(oS, x - s*0.6, x + s*0.6, y + h*0.35, y + h*0.42, z - s*0.6, z + s*0.6);
  latheP(oS, [[s*0.62, y + h*0.42], [0.04, y + h], [0.01, y + h + 0.05]], x, z, 4, PI/4); };

// =====================================================================================================================
// ===== St Joseph's Church (1906-1912, Swan & Maclaren for the Portuguese Mission), Victoria Street: a Latin-cross
// Gothic Revival / Neo-Manueline church, beige with grey dressings. The liturgical west front (here towards Victoria
// Street, +x) has three towers: the central octagonal belfry capped by a ribbed dome, lantern and cross, flanked by two
// smaller octagonal towers with cupolas; a portico on four clustered piers with pinnacles; blue-and-white azulejo panels
// (the Fatima apparitions, 1950) beside the doors; buttressed nave and transepts with paired lancets, the polygonal apse,
// and the three-storey parish house beside the chancel. Local axes: +x = bearing 128.7 deg (SE, the front), +z = SW.
LANDMARKS.sgstjoseph = {zh:'圣约瑟教堂', en:"St Joseph's Church", cat:'old', r:44, h:35.6,
  lt:{m:0, c:'#ffe4bd', k:1.0, e:0.55, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
    const w = B.p('#dccfae'), t = B.p('#8e9192'), tl = B.p('#c3bfb4'), dk = B.p('#2a3039'), lit = B.p({c:'#3a3040', glow:'#ffb873', gk:0.55}),
      li2 = B.p({c:'#2b3450', glow:'#86a8ff', gk:0.45}), rf = B.p({c:'#91604b', lk:0.25}), rc = B.p({c:'#6c4434', lk:0.2}), dm = B.p({c:'#868b90', lk:0.6}),
      az = B.p({c:'#3a62aa', lk:0.3}), azw = B.p('#eef0f3');
    const FP = [[26.6,-8.5],[29.1,-8.2],[29.2,9.1],[26.6,8.9],[26.3,12.2],[21.6,12.1],[21.3,10.8],[-1.5,10.9],[-1.4,21.5],[-15.0,20.9],[-15.0,10.3],[-20.9,10.6],[-27.1,4.9],[-26.9,-4.5],[-20.8,-10.2],[-14.8,-10.4],[-14.2,-22.2],[-1.2,-22.0],[-1.6,-10.3],[21.2,-10.4],[21.5,-12.0],[26.9,-11.8]];
    LPoly(g, FP, -5, 5.6, '#c4bba6');
    const Y0 = 0.6, NW = 11.5, RR = 7.4, ZN = 10.6, win = () => rng() < 0.5 ? (rng() < 0.6 ? lit : li2) : dk;
    const butt = (F, u, h, p, pin) => { fbx(t, F, u - 0.42, u + 0.42, Y0, h - 1.4, 0, p); fbx(t, F, u - 0.42, u + 0.42, h - 1.4, h - 0.2, 0, p*0.55);
      if (pin){ const c = fp(F, u, 0, p*0.3); pinP(t, c[0], h - 0.2, c[2], 0.55, 3.0); } };
    // ---- nave and chancel (one roof from the front to the apse) ----
    bx(w, -20.9, 21.6, Y0, NW, -ZN, ZN);
    gabR(rf, w, -20.9, 21.6, -ZN, ZN, NW, RR, 'x', 0.55, rc);
    for (const F of [fc(-1.5, ZN, 21.3, ZN), fc(21.3, -ZN, -1.5, -ZN)]){
      for (let k = 0; k <= 6; k++) butt(F, 0.6 + k*(F.L - 1.2)/6, NW + 0.2, 1.3, true);
      for (let k = 0; k < 6; k++){ const u = 0.6 + (k + 0.5)*(F.L - 1.2)/6; flh(win(), tl, F, u - 0.75, 2.6, 1.0, 8.4, 0.05); flh(win(), tl, F, u + 0.75, 2.6, 1.0, 8.4, 0.05); }
      fbx(tl, F, -0.1, F.L + 0.1, NW - 0.55, NW, -0.02, 0.32); fbx(tl, F, -0.1, F.L + 0.1, Y0, Y0 + 0.9, -0.02, 0.18); }
    for (const F of [fc(-20.9, ZN, -15.0, ZN), fc(-15.0, -ZN, -20.9, -ZN)]){ flh(win(), tl, F, F.L/2, 2.6, 1.1, 8.4, 0.05); fbx(tl, F, -0.1, F.L + 0.1, NW - 0.55, NW, -0.02, 0.32); }
    // ---- transepts ----
    bx(w, -15.0, -1.5, Y0, NW, -22.1, 21.6);
    gabR(rf, w, -15.0, -1.5, -22.6, 22.1, NW, RR, 'z', 0, rc);
    for (const [z, s] of [[21.6, 1], [-22.1, -1]]){
      const Fe = s > 0 ? fc(-15.0, z, -1.5, z) : fc(-1.5, z, -15.0, z), um = Fe.L/2;
      flh(lit, tl, Fe, um, 2.8, 2.6, 9.4, 0.05, 6); fdisc(li2, Fe, um, 14.0, 1.5, 0.05, 16); fdisc(tl, Fe, um, 14.0, 1.85, 0.06, 18, 1.5);
      for (const u of [0.4, Fe.L - 0.4]){ const c = fp(Fe, u, 0, 0.4); bx(t, c[0] - 0.6, c[0] + 0.6, Y0, NW + 1.2, c[2] - 0.6, c[2] + 0.6); pinP(t, c[0], NW + 1.2, c[2], 0.75, 4.2); }
      for (const F of [fc(-1.5, s > 0 ? z : ZN, -1.5, s > 0 ? ZN : z), fc(-15.0, s > 0 ? ZN : z, -15.0, s > 0 ? z : ZN)]){
        const Fo = (F.nx > 0) === (F.ax > -8) ? F : fc(F.ax + F.tx*F.L, F.az + F.tz*F.L, F.ax, F.az);
        flh(win(), tl, Fo, Fo.L*0.5 - 1.6, 2.6, 1.1, 8.4, 0.05); flh(win(), tl, Fo, Fo.L*0.5 + 1.6, 2.6, 1.1, 8.4, 0.05); butt(Fo, Fo.L*0.5, NW + 0.2, 1.2, true);
        fbx(tl, Fo, -0.1, Fo.L + 0.1, NW - 0.55, NW, -0.02, 0.32); } }
    // ---- polygonal apse ----
    { const AP = [[-20.9, ZN - 0.2], [-27.0, 4.8], [-27.0, -4.6], [-20.9, -ZN + 0.2]], top = [-20.9, NW + RR, 0];
      for (let i = 0; i < 3; i++){ const a = AP[i], b = AP[i + 1]; Q(w, [a[0], Y0, a[1]], [b[0], Y0, b[1]], [b[0], NW, b[1]], [a[0], NW, a[1]]);
        const ea = [a[0] + (a[0] + 20.9)*0.08 - 0.3, NW - 0.2, a[1]*1.06], eb = [b[0] + (b[0] + 20.9)*0.08 - 0.3, NW - 0.2, b[1]*1.06]; T3(rf, ea, eb, top);
        const F = fc(b[0], b[1], a[0], a[1]); flh(i === 1 ? li2 : lit, tl, F, F.L/2, 2.6, 1.3, 8.6, 0.05); fbx(tl, F, -0.1, F.L + 0.1, NW - 0.55, NW, -0.02, 0.32); }
      for (const v of [AP[1], AP[2]]){ bx(t, v[0] - 0.55, v[0] + 0.55, Y0, NW - 0.8, v[1] - 0.55, v[1] + 0.55); pinP(t, v[0], NW - 0.8, v[1], 0.6, 3.4); } }
    // ---- the front: facade wall, porch, central octagonal belfry with the ribbed dome, flanking towers with cupolas ----
    const XF = 26.6;
    bx(w, 21.3, XF, Y0, 13.4, -7.2, 7.2);
    { const F = fc(XF, 7.2, XF, -7.2);
      for (const u of [1.2, F.L - 1.2]){ fbx(azw, F, u - 0.95, u + 0.95, 2.6, 6.6, 0, 0.05); fbx(az, F, u - 1.05, u + 1.05, 2.5, 2.7, 0, 0.07); fbx(az, F, u - 1.05, u + 1.05, 6.5, 6.7, 0, 0.07);
        fbx(az, F, u - 1.05, u - 0.85, 2.5, 6.7, 0, 0.07); fbx(az, F, u + 0.85, u + 1.05, 2.5, 6.7, 0, 0.07); fbx(az, F, u - 0.6, u + 0.6, 3.6, 5.6, 0, 0.06); }
      for (let u = 0.3; u < F.L - 0.2; u += 0.9) fbx(tl, F, u, u + 0.5, 13.4, 14.1, -0.4, 0.1); }
    // porch: four clustered piers, pointed arches, pierced parapet, pinnacles
    { const x0 = XF, x1 = 29.2, Fp = fc(x1, 8.9, x1, -8.6), H = 9.0, yb = H - 1.3;
      bx(w, x0, x1, yb, H, -8.6, 8.9); bx(tl, x0, x1 + 0.2, H, H + 0.35, -8.8, 9.1);
      for (let u = 0.2; u < Fp.L - 0.2; u += 0.7) fbx(tl, Fp, u, u + 0.35, H + 0.35, H + 1.2, -0.2, 0.1);
      const piers = [0.4, 5.6, Fp.L - 5.6, Fp.L - 0.4];
      for (const u of piers){ const c = fp(Fp, u, 0, -1.3); bx(tl, c[0] - 1.25, c[0] + 1.25, Y0, yb, c[2] - 0.45, c[2] + 0.45); pinP(t, c[0] + 0.9, H + 0.35, c[2], 0.6, 3.2); }
      for (let i = 0; i < 3; i++){ const u0 = piers[i] + 0.45, u1 = piers[i + 1] - 0.45, wd = u1 - u0; fpoint(w, tl, Fp, u0, u1, yb - 0.72*wd - 0.15, yb, -2.55, 0.0); }
      bx(dk, XF - 0.05, XF + 0.02, Y0, 6.6, -1.6, 1.6); bx(dk, XF - 0.05, XF + 0.02, Y0, 5.2, -6.2, -4.4); bx(dk, XF - 0.05, XF + 0.02, Y0, 5.2, 4.6, 6.4); }
    // central belfry: square base, octagonal stage with lancets and pinnacles, ribbed dome, lantern, cross
    { const cx = 23.9, b0 = 17.6, ap8 = 3.9, oc = ngon(8, ap8/Math.cos(PI/8), PI/8, cx, 0);
      bx(w, 21.0, XF + 0.05, Y0, b0, -4.5, 4.5); bx(tl, 20.8, XF + 0.25, b0 - 0.6, b0, -4.7, 4.7);
      { const F = fc(XF + 0.05, 4.5, XF + 0.05, -4.5); flh(lit, tl, F, F.L/2, 8.6, 2.6, 13.6, 0.05, 6); fbx(tl, F, 0.6, F.L - 0.6, 15.2, 15.5, -0.02, 0.2);
        for (const u of [0.25, F.L - 0.25]){ const c = fp(F, u, 0, 0.3); bx(t, c[0] - 0.45, c[0] + 0.45, Y0, b0, c[2] - 0.45, c[2] + 0.45); } }
      prismP(w, oc, b0, 26.0); bandP(tl, oc, 25.4, 0.6, 0.25); bandP(tl, oc, b0, 0.5, 0.2);
      edgesOut(oc).forEach(F => { flh(dk, tl, F, F.L/2, 19.4, 1.15, 23.4, 0.05); });
      for (const v of oc){ pinP(t, v[0], 26.0, v[1], 0.5, 2.6); }
      latheP(dm, [[3.75, 26.0], [3.78, 26.8], [3.5, 28.2], [2.85, 29.5], [1.85, 30.6], [0.75, 31.4], [0.2, 31.6]], cx, 0, 8, PI/8);
      for (const v of ngon(8, 3.8/Math.cos(PI/8), PI/8, cx, 0)){ const dx = v[0] - cx, dz = v[1]; let p0 = [v[0], 26.0, dz];
        for (const [f, y] of [[0.99, 26.8], [0.92, 28.2], [0.75, 29.5], [0.49, 30.6], [0.2, 31.4], [0.05, 31.65]]){ const p1 = [cx + dx*f, y + 0.06, dz*f]; segP(tl, p0, p1, 0.12, 4); p0 = p1; } }
      latheP(w, [[0.75, 31.5], [0.75, 32.9], [0.95, 33.0], [0.5, 33.6], [0.15, 33.8]], cx, 0, 8, PI/8);
      segP(tl, [cx, 33.7, 0], [cx, 35.6, 0], 0.08, 4); segP(tl, [cx, 34.95, -0.45], [cx, 34.95, 0.45], 0.07, 4); }
    // flanking towers with octagonal stages and cupolas
    for (const s of [-1, 1]){
      const z0 = s > 0 ? 7.2 : -12.2, z1 = s > 0 ? 12.2 : -7.2, cz = (z0 + z1)/2, cx = 24.1, ht = 15.6;
      bx(w, 21.6, XF, Y0, ht, z0, z1); bx(tl, 21.4, XF + 0.2, ht - 0.5, ht, z0 - 0.2, z1 + 0.2);
      const Fo = s > 0 ? fc(21.6, z1, XF, z1) : fc(XF, z0, 21.6, z0); flh(win(), tl, Fo, Fo.L/2, 3.4, 0.9, 7.4, 0.05); flh(dk, tl, Fo, Fo.L/2, 9.4, 0.9, 12.6, 0.05);
      const Ff = fc(XF, z1, XF, z0); flh(win(), tl, Ff, Ff.L/2, 3.4, 0.9, 7.4, 0.05); flh(dk, tl, Ff, Ff.L/2, 9.4, 0.9, 12.6, 0.05);
      for (const [x, z] of [[XF, s > 0 ? z1 : z0], [21.6, s > 0 ? z1 : z0], [XF, s > 0 ? z0 : z1]]){ bx(t, x - 0.4, x + 0.4, Y0, ht - 0.6, z - 0.4, z + 0.4); pinP(t, x, ht, z, 0.5, 2.4); }
      const o8 = ngon(8, 1.95/Math.cos(PI/8), PI/8, cx, cz); prismP(w, o8, ht, 19.2); bandP(tl, o8, 18.8, 0.4, 0.18);
      edgesOut(o8).forEach((F, i) => { if (i % 2 === 0) flh(dk, tl, F, F.L/2, 16.2, 0.6, 18.1, 0.05, 3); });
      latheP(dm, [[2.05, 19.2], [2.2, 19.8], [1.95, 20.6], [1.3, 21.3], [0.5, 21.75], [0.12, 21.85]], cx, cz, 8, PI/8);
      latheP(tl, [[0.16, 21.8], [0.09, 22.9], [0.01, 23.0]], cx, cz, 6);
    }
    // ---- the parish house beside the chancel (real footprint, three storeys) ----
    colRange({w, t:tl, dk, lit, rf, rc, tl:rc, rng}, -25.8, -15.1, 10.5, 23.8, {H:9.8, nf:3, ver:'', bay:3.2, rise:2.4, ov:0.6});
    B.flush(g); return g; }};

SG_PLACES.push(
  {type:'sgwarmem',     lat:1.292902, lon:103.854711, rot:-0.5550},
  {type:'sgcenotaph',   lat:1.290283, lon:103.853816, rot:1.1365},
  {type:'sgtankimseng', lat:1.291121, lon:103.854198, rot:0},
  {type:'sgcricket',    lat:1.288970, lon:103.852105, rot:-0.5061},
  {type:'sgsrc',        lat:1.292083, lon:103.853750, rot:-0.4578},
  {type:'sgconcourse',  lat:1.300959, lon:103.862586, rot:-0.2321},
  {type:'sgstjoseph',   lat:1.298393, lon:103.853102, rot:-0.6754}
);
}
