// ===== lm22/civic: wave-3 upgrades of the Civic District landmarks — Raffles Hotel, National Gallery Singapore,
// Victoria Theatre and Concert Hall, St Andrew's Cathedral, Parliament House, Raffles City. Block-scoped: only LANDMARKS
// and SG_PLACES are touched. Real dimensions in metres; y = 0 is the ground (the app puts it 0.6 m above the highest ground
// within r); every plan follows the real OSM footprint in the model's local axes (see SG_PLACES at the end).
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

// ===== Raffles Hotel (1887 / 1899, Swan & Maclaren): the white three-storey Main Building with verandahs, angled corner
// pavilions, the cast-iron porte-cochere and red-tiled hipped roofs; the wings round the Palm Court, the Lawn and the
// courtyards (Palm Court Wing, Bras Basah Wing, Bar & Billiard Room) and the 1991 arcade along North Bridge Road and Seah Street.
// Plans are drawn in the Main Building's axes (+x = bearing 56.5 deg along Beach Road, +z = front towards Beach Road),
// then shifted so that the origin of the landmark is the middle of the hotel block.
LANDMARKS.raffleshotel = {zh:'莱佛士酒店', en:'Raffles Hotel', cat:'old', r:130, h:25,
  lt:{m:0, c:'#ffdcae', k:1.0, e:0.55, anim:'breathe'},
  build(){
    const g = new THREE.Group(), h = new THREE.Group(); h.position.set(-35, 0, 12); g.add(h);
    const B = mkB(), rng = LMCTX.rng;
    const W = '#f4f1e9', T = '#fbfaf6', D = '#2c3237', L = {c:'#3d362c', glow:'#ffcd8a', gk:0.6}, RT = {c:'#984a31', lk:0.35}, RC = {c:'#743623', lk:0.3}, PL = '#c9c2b4',
      CI = '#e6dfcf', GLR = {c:'#7f939b', glow:'#ffe0a8', gk:0.35}, TT = '#6b5a45', TL = {c:'#56803f', lk:0.2};
    const w = B.p(W), t = B.p(T), dk = B.p(D), lit = B.p(L), rt = B.p(RT), ci = B.p(CI), glr = B.p(GLR), tt = B.p(TT), tl = B.p(TL);
    const P = {w, t, dk, lit, rf:rt, rc:B.p(RC), tl:B.p(RC), rng};
    const Y0 = 0.6;
    // ---- foundations: the hotel buildings' footprints ----
    const FPS = [
      [[-17.3,45.6],[-17.3,-8.1],[-14.3,-8.0],[-14.3,-59.5],[-4.4,-59.6],[-4.0,-67.7],[4.5,-67.6],[4.5,-59.0],[15.2,-59.0],[15.1,-8.8],[16.8,-9.2],[16.5,46.2],[21.5,51.5],[15.5,57.5],[11.8,52.9],[-13.2,52.9],[-17.0,56.8],[-23.1,50.9]],
      [[-46.1,-74.2],[-45.0,-95.0],[-36.9,-103.3],[20.2,-101.0],[27.6,-90.9],[36.6,-91.1],[37.1,-100.1],[58.7,-98.6],[58.4,-89.7],[66.7,-89.6],[66.7,-91.8],[74.7,-99.2],[116.5,-97.5],[123.5,-89.0],[122.8,-77.1],[104.5,-77.8],[104.0,-62.6],[109.6,-62.7],[109.1,-49.5],[103.5,-49.2],[102.9,-37.5],[119.0,-36.8],[118.0,-18.7],[71.5,-21.0],[72.4,-38.9],[86.4,-38.3],[86.5,-46.7],[64.9,-47.3],[64.6,-37.9],[23.8,-39.5],[24.7,-78.8],[-25.2,-81.4],[-25.8,-72.5]],
      [[-32.1,66.1],[-53.7,64.7],[-51.7,31.1],[-30.1,32.6]],
      [[115.6,35.7],[88.8,34.0],[90.8,-5.9],[95.7,-6.2],[99.9,-10.5],[100.1,-13.5],[118.7,-12.2]],
      [[110.1,65.0],[101.3,72.3],[84.4,71.4],[84.7,43.9],[113.0,43.8]],
      [[16.7,-10.7],[79.4,-10.7],[79.4,10.9],[78.6,10.9],[78.6,68.7],[57.9,68.7],[57.9,11.5],[16.7,11.5]],
      [[-51.1,-9.8],[-47.8,-9.8],[-47.8,-71.1],[-25.5,-71.1],[-25.5,-15.4],[-17.1,-15.4],[-17.1,10.4],[-51.1,10.4]],
      [[-49.2,26.5],[-32.6,27.8],[-33.1,32.5],[-51.7,31.6],[-51.7,8.5],[-47.3,8.9]]];
    for (const F of FPS) LPoly(h, F, -5, 5.6, PL);
    // ======== the Main Building ========
    colRange(P, -17.3, 16.8, -8.0, 52.9, {H:16.4, nf:3, ver:'flr', vd:3.0, bay:3.8, rise:0});
    hipR(rt, -17.3, 16.8, -8.0, 52.9, 16.4, 5.4, 1.3, P.rc, t, P.tl);
    bx(w, -3.6, 2.6, 20.6, 22.8, 14.0, 32.0); hipR(rt, -3.6, 2.6, 14.0, 32.0, 22.8, 1.9, 0.7, P.rc, t, P.tl);       // lantern over the lobby atrium
    // front: projecting centre bay with a pediment, parapet balustrades, porte-cochere
    { const Ff = fc(-13.2, 52.9, 11.8, 52.9), L0 = Ff.L, uc = L0/2;
      fbx(w, Ff, uc - 5.2, uc + 5.2, Y0, 16.4, -3.0, 0.6);
      fbx(t, Ff, uc - 5.5, uc + 5.5, 16.0, 17.0, -3.0, 0.9);
      fped(w, t, Ff, uc - 5.4, uc + 5.4, 17.0, 3.6, -1.0, 0.8);
      fbx(w, Ff, uc - 5.4, uc + 5.4, 17.0, 18.0, -3.0, -1.0);
      for (const u of [uc - 4.6, uc + 4.6]) fbx(t, Ff, u - 0.4, u + 0.4, Y0, 16.0, 0.6, 1.0);
      for (const y of [6.2, 11.4]) fbx(t, Ff, uc - 5.2, uc + 5.2, y - 0.3, y + 0.15, 0.6, 1.0);
      for (const y0 of [6.6, 11.8]) for (const u of [uc - 2.4, uc, uc + 2.4]) farch(rng() < 0.5 ? lit : dk, Ff, u, y0, 1.3, y0 + 3.0, 0.65, 6);
      farch(dk, Ff, uc, Y0, 3.0, 4.2, 0.65, 8);
      fbal(t, Ff, 0.3, uc - 5.6, 16.4, 1.0, 0.1); fbal(t, Ff, uc + 5.6, L0 - 0.3, 16.4, 1.0, 0.1);
      // the cast-iron porte-cochere (reproduction of the 1913 Walter MacFarlane portico)
      const px0 = uc - 5.7, px1 = uc + 5.7, pz0 = 0.6, pz1 = 11.0, ph = 6.8;
      for (const u of [px0 + 0.4, px1 - 0.4]) for (const d of [pz0 + 2.0, pz0 + 5.0, pz0 + 8.0, pz1 - 0.3]){ const c = fp(Ff, u, 0, d); segP(ci, [c[0], Y0, c[2]], [c[0], ph, c[2]], 0.17, 6); bx(ci, c[0] - 0.3, c[0] + 0.3, ph - 0.5, ph, c[2] - 0.3, c[2] + 0.3); }
      fbx(ci, Ff, px0, px1, ph, ph + 0.9, pz0, pz1); fbx(dk, Ff, px0 + 0.3, px1 - 0.3, ph - 0.05, ph + 0.05, pz0, pz1 - 0.3);
      for (let k = 0; k < 9; k++){ const d = pz0 + 0.6 + k*(pz1 - pz0 - 1.2)/8; for (const u of [px0, px1]){ const a = fp(Ff, u, ph, d), b = fp(Ff, u + (u === px0 ? 0.9 : -0.9), ph - 0.9, d); segP(ci, a, b, 0.06, 3); } }
      const r0 = fp(Ff, px0 - 0.3, ph + 0.9, pz0), r1 = fp(Ff, px1 + 0.3, ph + 0.9, pz0), r2 = fp(Ff, px1 + 0.3, ph + 0.9, pz1 + 0.3), r3 = fp(Ff, px0 - 0.3, ph + 0.9, pz1 + 0.3), rm0 = fp(Ff, uc, ph + 3.0, pz0), rm1 = fp(Ff, uc, ph + 3.0, pz1 + 0.3);
      Q(glr, r0, rm0, rm1, r3); Q(glr, rm0, r1, r2, rm1); T3(ci, r3, rm1, r2);
      for (let k = 0; k <= 6; k++){ const d = pz0 + k*(pz1 - pz0 + 0.3)/6; segP(ci, fp(Ff, px0 - 0.3, ph + 0.95, d), fp(Ff, uc, ph + 3.05, d), 0.06, 3); segP(ci, fp(Ff, px1 + 0.3, ph + 0.95, d), fp(Ff, uc, ph + 3.05, d), 0.06, 3); }
    }
    // angled corner pavilions of the front
    polyBlock(P, [[16.4,46.4],[21.8,51.8],[16.4,57.2],[11.0,51.8]], {H:17.2, nf:3, rise:4.4, bay:3.2, ov:0.9});
    polyBlock(P, [[-17.9,45.9],[-12.5,51.3],[-17.9,56.7],[-23.3,51.3]], {H:17.2, nf:3, rise:4.4, bay:3.2, ov:0.9});
    // rear block of the Main Building (dining rooms, the old ballroom) and the stair link
    colRange(P, -14.3, 15.2, -59.2, -8.0, {H:14.8, nf:3, ver:'', bay:3.8, rise:4.6, ov:1.0, pil:true});
    colRange(P, -4.4, 4.5, -67.7, -59.2, {H:9.8, nf:2, ver:'', bay:3.2, rise:2.4, ov:0.6});
    // ======== wings round the Palm Court (east) ========
    colRange(P, 16.8, 58.9, -10.6, 11.4, {H:13.8, nf:3, ver:'f', vd:2.8, bay:3.6, rise:3.8, ov:1.0});
    colRange(P, 58.9, 79.4, -10.4, 10.8, {H:13.8, nf:3, ver:'f', vd:2.8, bay:3.6, rise:3.8, ov:1.0});
    colRange(P, 58.0, 78.6, 10.8, 68.7, {H:13.8, nf:3, ver:'lf', vd:2.8, bay:3.6, rise:3.8, ov:1.0});
    polyBlock(P, [[49.4,40.1],[50.0,31.2],[58.5,31.2],[62.8,35.5],[58.5,39.8]], {H:13.8, nf:3, rise:3.2, bay:3.0});
    colRange(P, 37.1, 54.6, 19.8, 30.1, {H:5.6, nf:1, ver:'fblr', vd:1.6, bay:3.4, rise:2.4, ov:0.6});     // Palm Court pavilion
    // ======== wings round the Lawn and the Bras Basah courtyard (west) ========
    colRange(P, -51.1, -17.3, -9.8, 10.4, {H:13.8, nf:3, ver:'f', vd:2.8, bay:3.6, rise:3.8, ov:1.0});
    colRange(P, -47.8, -25.5, -71.1, -9.8, {H:13.8, nf:3, ver:'r', vd:2.8, bay:3.6, rise:3.8, ov:1.0});
    colRange(P, -52.6, -31.2, 31.9, 65.4, {H:10.8, nf:2, ver:'fr', vd:2.8, bay:3.6, rise:4.4, ov:1.0});     // Bar & Billiard Room
    colRange(P, -49.2, -32.8, 26.5, 31.9, {H:4.6, nf:1, ver:'fb', vd:1.5, bay:3.2, rise:1.4, ov:0.5});      // covered walks
    colRange(P, -51.7, -47.4, 8.6, 26.5, {H:4.6, nf:1, ver:'lr', vd:1.3, bay:3.2, rise:1.4, ov:0.5});
    // small pavilions and kiosks in the courts
    for (const [x0, x1, z0, z1] of [[55.7, 64.5, -29.9, -17.9], [-20.2, -14.6, -78.7, -68.4], [16.4, 22.6, -77.1, -66.7], [-33.8, -27.8, -15.8, -9.8], [-48.2, -44.8, -16.6, -9.8]])
      colRange(P, x0, x1, z0, z1, {H:5.0, nf:1, ver:'', bay:2.8, rise:1.8, ov:0.5});
    // ======== the arcade (1991) along North Bridge Road and Seah Street, round its courtyard ========
    const AR = {H:14.6, nf:3, vd:2.6, bay:3.6, rise:3.8, ov:0.9};
    colRange(P, -45.6, -25.5, -100.5, -73.6, Object.assign({ver:'b'}, AR));
    colRange(P, -25.5, 24.0, -101.0, -80.6, Object.assign({ver:'fb'}, AR));
    colRange(P, 24.0, 104.0, -99.2, -87.0, Object.assign({ver:'b'}, AR));
    colRange(P, 24.0, 36.0, -87.0, -39.4, Object.assign({ver:'lr'}, AR));
    colRange(P, 92.0, 104.0, -87.0, -38.4, Object.assign({ver:'l'}, AR));
    colRange(P, 36.0, 92.0, -50.0, -38.4, Object.assign({ver:'fb'}, AR));
    colRange(P, 71.8, 118.6, -37.4, -19.6, Object.assign({ver:'fr'}, AR));
    colRange(P, 104.0, 122.8, -97.4, -77.6, Object.assign({ver:'fr'}, AR));
    colRange(P, 104.0, 109.4, -62.6, -49.5, Object.assign({ver:''}, AR, {rise:2.4}));
    bx(w, 64.9, 72.0, Y0, 14.6, -47.0, -38.4);
    // ======== Seah Street blocks (four storeys) ========
    colRange(P, 90.4, 117.6, -12.6, 35.0, {H:16.6, nf:4, ver:'l', vd:2.6, bay:3.6, rise:4.0, ov:0.9});
    colRange(P, 84.6, 112.6, 43.9, 71.6, {H:16.6, nf:4, ver:'lf', vd:2.6, bay:3.6, rise:4.0, ov:0.9});
    // ======== gardens: lawns of the Palm Court, the front garden on Beach Road, the Lawn and the Fern Court; palms, traveller's
    // palms and rain trees; the cast-iron fountain in the Palm Court; lamp standards along the front drive ========
    { const gr = B.p({c:'#5d8744', lk:0.12}), ln = B.p({c:'#fff3d8', glow:'#ffd9a0', gk:1.4});
      for (const P2 of [[[19,13],[57,13],[57,47],[19,47]], [[22,52],[57,52],[57,84],[17,84],[12,72],[12,62]], [[-12,62],[-12,72],[-17,84],[-50,84],[-50,67],[-24,67]],
        [[-46,12],[-19,12],[-19,25],[-46,25]], [[17,-37],[55,-37],[55,-12],[17,-12]], [[-25,-57],[-15.5,-57],[-15.5,-17],[-25,-17]]]) lawnP(gr, P2, 0.12);
      // palms (the old list) plus more round the Palm Court and the front garden
      for (const [x, z, hh] of [[-30, 74, 11], [-20, 80, 12], [30, 74, 11], [40, 80, 12], [-34, 84, 10], [46, 70, 10], [24, 30, 12], [30, 50, 13], [44, 46, 11], [26, 62, 12], [48, 60, 12], [-40, 16, 10], [-28, 20, 11], [-6, -74, 9],
        [21, 16, 13], [34, 15, 12], [52, 16, 11], [20, 40, 12], [55, 44, 12], [36, 40, 10], [-44, 22, 9], [-22, 14, 10], [53, 80, 11], [-46, 78, 11], [20, -30, 10], [40, -16, 11], [50, -34, 9]])
        palmP(tt, tl, x, z, hh, 1.0, rng);
      // traveller's palms (fans) flanking the porte-cochere and along the front
      for (const [x, z, a] of [[-9, 63, 0.2], [9, 63, -0.2], [-12, 70, 0.1], [12, 70, -0.1], [-26, 70, 0.4], [26, 69, -0.3], [-40, 70, 0.0], [36, 64, 0.2], [-30, 20, 1.2], [44, 22, 0.9]])
        travP(tt, tl, x, z, 8.5, 1.0, a, rng);
      // rain trees on the Beach Road front and in the Fern Court
      for (const [x, z, sc] of [[-38, 79, 1.1], [50, 76, 1.05], [33, -25, 0.95], [-20, -40, 0.6]]) rainP(tt, tl, x, z, sc, rng);
      // the Palm Court fountain (cast iron, two basins on a fluted stem)
      { const fx = 28, fz = 31; latheP(ci, [[0.01, 0.12], [3.0, 0.12], [3.0, 0.75], [2.7, 0.75], [2.7, 0.35], [0.01, 0.35]], fx, fz, 16);
        latheP(B.p({c:'#7fa8b4', lk:0.3}), [[2.75, 0.62], [0.01, 0.62]], fx, fz, 16);
        latheP(ci, [[0.35, 0.6], [0.28, 2.0], [1.6, 2.3], [1.6, 2.5], [0.3, 2.45], [0.22, 3.6], [0.8, 3.75], [0.8, 3.9], [0.2, 3.9], [0.12, 4.8], [0.01, 5.0]], fx, fz, 12); }
      // lamp standards with lantern globes along the front drive and at the porte-cochere
      for (const [x, z] of [[-7.4, 66], [6.0, 66], [-8.4, 76], [7.0, 76], [-20, 66], [20, 66]]){
        segP(tt, [x, -1, z], [x, 3.6, z], 0.09, 6, 0.06); segP(tt, [x, -1, z], [x, 0.9, z], 0.18, 6, 0.1);
        latheP(ln, [[0.01, 3.55], [0.26, 3.7], [0.3, 4.05], [0.2, 4.3], [0.01, 4.4]], x, z, 8); }
    }
    B.flush(h); return g; }};

// ===== National Gallery Singapore: former Supreme Court (1939, dome + Corinthian portico) and former City Hall (1929,
// 18-column Corinthian colonnade over the steps to the Padang), linked by studioMilou's 2015 gold filigree roof canopy.
// Local axes: +x = bearing 60.3 deg (NNE along St Andrew's Road), +z = front (ESE, the Padang).
// Old Supreme Court x -107..-24, link x -24..-10.7, City Hall x -10.7..106.4.
LANDMARKS.natgallery = {zh:'新加坡国家美术馆', en:'National Gallery Singapore', cat:'old', r:120, h:42,
  lt:{m:0, c:'#ffdcae', k:1.05, e:0.5, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
    const S = '#dcd6c8', TR = '#eeeae0', D = '#2b3036', L = {c:'#3b352c', glow:'#ffd08f', gk:0.5}, RF = {c:'#7a766f', lk:0.25},
      DM = {c:'#7fa596', lk:0.7}, GD = {c:'#b39254', glow:'#ffcd78', gk:0.3}, GL = '#7d939e', STL = '#8a8e92', GDF = {c:'#8c7243', glow:'#ffcd78', gk:0.25}, PL = '#c3bcad';
    const s = B.p(S), t = B.p(TR), dk = B.p(D), lit = B.p(L), rf = B.p(RF), dm = B.p(DM), gd = B.p(GD), gl = B.p(GL), stl = B.p(STL);
    const Y0 = 0.6;
    // foundations under both buildings and the link
    const FP_OSC = [[-24.1,11.2],[-23.9,33.1],[-47.9,32.9],[-47.7,35.6],[-49.9,35.5],[-50.0,37.6],[-76.6,37.7],[-77.4,37.5],[-77.5,36.1],[-79.6,36.0],[-80.1,32.8],[-105.0,33.3],[-105.3,11.5],[-107.3,11.3],[-100.5,-30.5],[-23.8,-30.3],[-24.5,-18.1],[-28.4,-18.0],[-28.9,11.2]];
    LPoly(g, [[-107.3,11.3],[-100.5,-30.5],[106.0,-30.6],[106.4,32.9],[-105.0,33.3],[-105.3,11.5]], -5, 5.6, PL);
    LPoly(g, [[-76.6,33.0],[-51.4,33.0],[-51.4,37.7],[-76.6,37.7]], -5, 5.6, PL);
    // ======== former Supreme Court ========
    const OH = 20;
    // ranges round the courtyard (front, back, right, left (slanted))
    const ranges = [[-105.2, -24.0, 11.2, 33.1], [-101.2, -24.0, -30.4, -17.9], [-37.2, -28.4, -17.9, 11.2]];
    for (const [x0, x1, z0, z1] of ranges){ bx(s, x0, x1, Y0, OH, z0, z1); corniceR(t, x0, x1, z0, z1, OH - 2.4, 1.2, 0.4); bx(rf, x0 + 0.3, x1 - 0.3, OH, OH + 0.05, z0 + 0.3, z1 - 0.3); }
    LPoly(g, [[-102.2,-17.9],[-94.6,-17.9],[-99.6,11.2],[-107.3,11.2]], Y0, OH - Y0, S);
    bx(rf, -104, -97, OH, OH + 0.05, -16, 9);
    // parapet balustrades on the outer edges
    { const Fb = fc(-24.0, -30.4, -100.5, -30.4); fbal(t, Fb, 0.5, Fb.L - 0.5, OH, 1.1, 0.1); }
    // centre block behind the portico (higher attic) and the portico itself
    bx(s, -73.9, -54.2, Y0, 22.2, 11.2, 33.1); corniceR(t, -73.9, -54.2, 11.2, 33.1, 21.4, 0.8, 0.35);
    { const Fp = fc(-76.6, 37.7, -51.4, 37.7), Lp = Fp.L;
      bx(s, -76.6, -51.4, Y0, 5.2, 33.0, 37.7);                                  // podium
      for (let k = 0; k < 7; k++) bx(s, -74.5, -53.5, -3.0, 5.2 - k*0.65, 37.7, 37.7 + 0.45*(k + 1));      // steps
      for (let k = 0; k < 8; k++) fcol(t, t, Fp, 1.6 + k*(Lp - 3.2)/7, -1.1, 5.2, 17.8, 0.62, 10);
      for (const k of [0, 7]) fcol(t, t, Fp, 1.6 + k*(Lp - 3.2)/7, -3.6, 5.2, 17.8, 0.62, 10);
      bx(t, -76.9, -51.1, 17.8, 19.9, 32.9, 37.9);                                // entablature
      fped(s, t, Fp, -0.3, Lp + 0.3, 19.9, 4.4, -4.9, 0.2);                      // pediment (Justice group in the tympanum)
      // the sculpture group in the tympanum (Justice enthroned with the figures either side, in relief)
      for (const [u, hh, ww] of [[Lp/2, 3.0, 1.6], [Lp/2 - 2.6, 2.2, 1.3], [Lp/2 + 2.6, 2.2, 1.3], [Lp/2 - 5.2, 1.5, 1.4], [Lp/2 + 5.2, 1.5, 1.4], [Lp/2 - 7.8, 0.8, 1.6], [Lp/2 + 7.8, 0.8, 1.6]]){
        fbx(t, Fp, u - ww/2, u + ww/2, 20.15, 20.15 + hh*0.62, 0.15, 0.55); fbx(t, Fp, u - ww*0.3, u + ww*0.3, 20.15 + hh*0.62, 20.15 + hh, 0.15, 0.5); }
      frect(dk, Fp, 2.8, Lp - 2.8, 5.4, 15.6, -4.5);                               // dark doors behind the columns
      for (const u of [Lp*0.3, Lp*0.5, Lp*0.7]) frect(dk, Fp, u - 0.9, u + 0.9, 20.6, 22.2, 0.25);
    }
    // the front facade of the wings: rusticated base, giant Ionic colonnades in antis, end pavilions with pilasters
    for (const [u0, u1] of [[0, 28.6], [53.4, 81.2]]){
      const F = fc(-105.2, 33.1, -24.0, 33.1);
      for (let y = Y0 + 1.0; y < 6.4; y += 1.0) fbx(s, F, u0, u1, y, y + 0.14, -0.02, 0.12);
      fwins(dk, lit, F, u0 + 0.6, u1 - 0.6, 3.4, [[2.0, 2.8, 'r', 1.3]], 0.13, rng, 0.15);
      fbx(t, F, u0, u1, 6.2, 6.9, -0.02, 0.45);
      const left = u0 === 0, cu0 = left ? u0 + 7.2 : u0 + 2.6, cu1 = left ? u1 - 2.6 : u1 - 7.2;
      for (let k = 0; k <= 5; k++) fcol(t, t, F, cu0 + 0.8 + k*(cu1 - cu0 - 1.6)/5, 0.9, 6.9, 17.6, 0.52, 8);
      fwins(dk, lit, F, cu0 + 0.4, cu1 - 0.4, (cu1 - cu0)/5, [[7.6, 3.4, 'r', 1.5], [12.6, 3.6, 'a', 1.5]], 0.03, rng, 0.25);
      for (const [p0, p1] of left ? [[u0, cu0], [cu1, u1]] : [[u0, cu0], [cu1, u1]]){
        fpil(t, F, p0 + 0.4, p1 - 0.4, 1, 6.9, 17.6, 0.8, 0.35);
        if (p1 - p0 > 4) { frect(dk, F, (p0 + p1)/2 - 0.8, (p0 + p1)/2 + 0.8, 7.8, 11.0, 0.05); farch(dk, F, (p0 + p1)/2, 12.6, 1.6, 15.6, 0.05); }
      }
      fbx(t, F, u0, u1, 17.6, 19.0, -0.02, 1.4);                                    // entablature over the columns
      fbal(t, F, u0 + 0.5, u1 - 0.5, OH, 1.1, 0.2);
    }
    // side and back facades and the courtyard walls: three tiers of windows between pilasters
    { const F = rectF(-105.2, -24.0, -30.4, 33.1);
      for (const fa of [fc(-24.0, -30.4, -100.5, -30.4), fc(-24.0, -17.9, -24.0, -30.4), fc(-24.0, 33.1, -24.0, 11.2)]){
        fwins(dk, lit, fa, 0.8, fa.L - 0.8, 3.6, [[2.0, 2.6, 'r', 1.3], [7.6, 3.4, 'r', 1.4], [12.6, 3.4, 'a', 1.4]], 0.05, rng, 0.2);
        fbx(t, fa, -0.1, fa.L + 0.1, 6.3, 6.9, -0.02, 0.3); fpil(t, fa, 0.3, fa.L - 0.3, Math.max(1, Math.round(fa.L/7.2)), 6.9, 17.4, 0.6, 0.25); }
      const Fw = fc(-100.5, -30.5, -107.3, 11.3);
      fwins(dk, lit, Fw, 1, Fw.L - 1, 3.6, [[2.0, 2.6, 'r', 1.3], [7.6, 3.4, 'r', 1.4], [12.6, 3.4, 'a', 1.4]], 0.05, rng, 0.2);
      fbx(t, Fw, -0.1, Fw.L + 0.1, 6.3, 6.9, -0.02, 0.3); fbal(t, Fw, 0.5, Fw.L - 0.5, OH, 1.1, 0.1);
      fwins(dk, lit, fc(-105.3, 11.5, -105.2, 33.1), 0.8, 20.8, 3.6, [[2.0, 2.6, 'r', 1.3], [7.6, 3.4, 'r', 1.4], [12.6, 3.4, 'a', 1.4]], 0.05, rng, 0.2);
      // courtyard walls (faces turned into the courtyard)
      for (const fa of [fc(-37.2, 11.2, -99.6, 11.2), fc(-94.6, -17.9, -37.2, -17.9), fc(-37.2, -17.9, -37.2, 11.2), fc(-99.6, 11.2, -94.6, -17.9)])
        fwins(dk, lit, fa, 0.6, fa.L - 0.6, 3.4, [[2.0, 2.6, 'r', 1.2], [7.6, 3.2, 'r', 1.2], [12.6, 3.2, 'r', 1.2]], 0.05, rng, 0.2);
    }
    // the dome: drum with pilasters and windows, verdigris copper dome with ribs, lantern
    { const cx = -64.2, cz = 22.2;
      latheP(s, [[9.7, 21.9], [9.7, 26.0]], cx, cz, 32); latheP(t, [[10.15, 26.0], [10.15, 26.9], [9.4, 27.2]], cx, cz, 32); capP(t, (() => { const P = []; for (let i = 0; i < 32; i++){ const a = i/32*TAU; P.push([cx + Math.cos(a)*9.7, cz + Math.sin(a)*9.7]); } return P; })(), 21.9);
      for (let i = 0; i < 16; i++){ const a = (i + 0.5)/16*TAU, F = fc(cx + Math.cos(a - 0.1)*9.7, cz + Math.sin(a - 0.1)*9.7, cx + Math.cos(a + 0.1)*9.7, cz + Math.sin(a + 0.1)*9.7);
        // fc's outward normal points right of A->B; going clockwise seen from +y keeps it outwards
        const Fo = fc(cx + Math.cos(a + 0.1)*9.7, cz + Math.sin(a + 0.1)*9.7, cx + Math.cos(a - 0.1)*9.7, cz + Math.sin(a - 0.1)*9.7);
        farch(i % 2 ? dk : lit, Fo, Fo.L/2, 22.8, 1.1, 24.6, 0.06, 5);
        const b = i/16*TAU; segP(t, [cx + Math.cos(b)*9.85, 22.0, cz + Math.sin(b)*9.85], [cx + Math.cos(b)*9.85, 26.0, cz + Math.sin(b)*9.85], 0.3, 4); }
      const prof = []; for (let i = 0; i <= 10; i++){ const a = i/10*HP; prof.push([Math.max(0.01, Math.cos(a)*9.0), 27.0 + Math.sin(a)*9.2]); }
      latheP(dm, prof, cx, cz, 32);
      for (let i = 0; i < 16; i++){ const a = i/16*TAU; const P = prof.slice(0, 9).map(([r, y]) => [cx + Math.cos(a)*(r + 0.12), y + 0.05, cz + Math.sin(a)*(r + 0.12)]); for (let k = 0; k < P.length - 1; k++) segP(t, P[k], P[k + 1], 0.12, 3); }
      latheP(t, [[1.9, 35.6], [1.9, 36.2], [1.5, 36.3], [1.5, 39.0], [1.9, 39.2], [1.9, 39.6], [0.9, 40.6], [0.25, 41.4], [0.12, 42.0], [0.01, 42.1]], cx, cz, 10);
      for (let i = 0; i < 6; i++){ const a = i/6*TAU; frect(dk, fc(cx + Math.cos(a + 0.25)*1.52, cz + Math.sin(a + 0.25)*1.52, cx + Math.cos(a - 0.25)*1.52, cz + Math.sin(a - 0.25)*1.52), 0.15, 0.6, 36.6, 38.6, 0.02); }
    }
    // ======== former City Hall ========
    { const x0 = -10.7, x1 = 106.4, z0 = -30.6, z1 = 33.0, H = 23.0;
      // perimeter ranges round two courtyards
      const parts = [[x0, x1, 17.0, 27.6], [x0, x1, z0, -16.2], [x0, 4.2, -16.2, 17.0], [91.5, x1, -16.2, 17.0], [41.0, 55.0, -16.2, 17.0]];
      for (const [a0, a1, b0, b1] of parts){ bx(s, a0, a1, Y0, H, b0, b1); bx(rf, a0, a1, H, H + 0.05, b0, b1); }
      bx(s, x0, 7.1, Y0, H, 27.6, z1); bx(s, 88.6, x1, Y0, H, 27.6, z1); bx(rf, x0, 7.1, H, H + 0.05, 27.6, z1); bx(rf, 88.6, x1, H, H + 0.05, 27.6, z1);
      bx(s, 7.1, 88.6, 19.4, H, 27.6, 31.4); bx(rf, 7.1, 88.6, H, H + 0.05, 27.6, 31.4);  // attic over the colonnade
      corniceR(t, x0, x1, z0, z1, H, 0.9, 0.5); bx(t, 7.1, 88.6, H, H + 0.9, 30.9, 31.9);
      bx(t, x0 - 0.3, x1 + 0.3, 17.6, 19.4, z1 - 5.6, z1 + 0.4);                      // main entablature
      // loggia: podium, colonnade of 18 Corinthian columns, dark doors and windows behind
      bx(s, 7.1, 88.6, Y0, 5.0, 27.6, 31.2);
      const Fc = fc(7.1, 31.2, 88.6, 31.2);
      for (let k = 0; k < 18; k++) fcol(t, t, Fc, 2.2 + k*(Fc.L - 4.4)/17, -0.9, 5.0, 17.6, 0.66, 10);
      frect(B.p('#b8b1a3'), fc(7.1, 27.6, 88.6, 27.6), 0, 81.5, 5.0, 17.4, 0.03);                 // shaded back wall of the loggia
      fwins(dk, lit, fc(7.1, 27.6, 88.6, 27.6), 0.5, 81, 4.5, [[5.6, 5.4, 'a', 2.0], [12.4, 3.6, 'r', 1.8]], 0.06, rng, 0.35);
      bx(s, 7.1, 88.6, 17.4, 17.6, 27.6, 31.3);
      // the City Hall steps across the whole colonnade
      for (let k = 0; k < 9; k++) bx(s, 9.0, 86.7, -3.0, 5.0 - k*0.49, 31.2, 31.2 + 0.95*(k + 1));
      // attic windows over the colonnade
      fwins(dk, lit, fc(7.1, 31.4, 88.6, 31.4), 1, 80.5, 4.5, [[20.2, 1.8, 'r', 1.4]], 0.05, rng, 0.2);
      // end pavilions and the other facades: rusticated base, giant pilasters, three tiers of windows, attic windows
      const tiers = [[1.6, 2.6, 'r', 1.3], [6.8, 4.0, 'a', 1.5], [12.4, 3.6, 'r', 1.5], [20.0, 1.9, 'r', 1.3]];
      const Fa = [fc(x0, z1, 7.1, z1), fc(88.6, z1, x1, z1), fc(x1, z1, x1, z0), fc(x1, z0, x0, z0), fc(x0, z0, x0, z1), fc(7.1, z1, 7.1, 27.6), fc(88.6, 27.6, 88.6, z1)];
      for (const F of Fa){ if (F.L < 4) continue;
        fwins(dk, lit, F, 0.8, F.L - 0.8, F.L > 30 ? 4.2 : 3.6, tiers, 0.05, rng, 0.2);
        for (let y = Y0 + 1.0; y < 5.2; y += 1.0) fbx(s, F, -0.05, F.L + 0.05, y, y + 0.14, -0.02, 0.12);
        fbx(t, F, -0.1, F.L + 0.1, 5.2, 5.8, -0.02, 0.35);
        fpil(t, F, 0.5, F.L - 0.5, Math.max(1, Math.round(F.L/8.4)), 5.8, 17.6, 0.8, 0.35); }
      // courtyard walls
      for (const [a0, a1] of [[4.2, 41.0], [55.0, 91.5]]){ const C = rectF(a0, a1, -16.2, 17.0); for (const F of [C.f, C.b, C.l, C.r]) fwins(dk, lit, F, 0.5, F.L - 0.5, 3.6, [[2, 2.6, 'r', 1.2], [7.4, 3, 'r', 1.2], [12.6, 3, 'r', 1.2], [18, 2.4, 'r', 1.2]], -0.05, rng, 0.25);
        // the gallery's filigree roofs over the two courtyards
        bx(B.p(GDF), a0, a1, H + 0.6, H + 0.75, -16.2, 17.0);
        for (let x = a0 + 2.5; x < a1 - 1; x += 2.5) bx(stl, x - 0.1, x + 0.1, H + 0.75, H + 1.0, -16.2, 17.0);
        for (let z = -14; z < 16; z += 3) bx(stl, a0, a1, H + 0.75, H + 0.95, z - 0.08, z + 0.08); }
    }
    // ======== the rooftop: the Padang Deck (timber deck with planters and shade trees) on the City Hall roof facing the Padang ========
    { const H = 23.0, dk2 = B.p({c:'#9b7b58', lk:0.3}), gn = B.p({c:'#6a8f4a', lk:0.15});
      bx(dk2, 8.0, 87.6, H, H + 0.35, 19.0, 27.2);
      for (let x = 11; x < 86; x += 7.5){ bx(t, x - 1.2, x + 1.2, H + 0.35, H + 1.0, 25.3, 26.9); latheP(gn, [[0.01, H + 1.0], [1.4, H + 1.3], [1.5, H + 2.0], [0.9, H + 2.6], [0.01, H + 2.8]], x, 26.1, 7); }
      for (const x of [16, 38, 60, 80]) treeP(dk2, gn, x, 21.5, 0.55, rng); }
    // ======== the link: atrium between the two buildings, bridges, tree columns and the gold "veil" canopy ========
    { const xa = -24.0, xb = -10.7;
      bx(gl, -23.6, -11.1, Y0, 9.0, 25.2, 25.5);                                    // glazed entrance screen
      for (let x = -23.6; x <= -11.0; x += 2.1) bx(stl, x - 0.08, x + 0.08, Y0, 9.0, 25.1, 25.6);
      for (const [y, z] of [[10.0, -6.0], [14.6, 6.0], [6.4, 14.0]]){ bx(stl, xa, xb, y - 0.5, y, z - 1.6, z + 1.6); bx(gl, xa, xb, y, y + 1.1, z - 1.6, z - 1.5); bx(gl, xa, xb, y, y + 1.1, z + 1.5, z + 1.6); }
      // canopy: a translucent gold veil (glass + perforated gold screens) flat at ~27 m over the link and the inner roof edges,
      // sagging over the entrance towards the Padang, on a fine gold lattice
      const X0 = -28.5, X1 = -7.0, Z0 = -31.0, Z1 = 34.5, NX = 14, NZ = 33;
      const yAt = (u, v) => { const x = X0 + (X1 - X0)*u, z = Z0 + (Z1 - Z0)*v, s1 = Math.sin(PI*u); let y = 27.4 - 0.8*Math.sin(PI*v)*s1; if (z > 23) { const k = (z - 23)/(Z1 - 23); y -= (1.4 + 9.5*s1)*k*k; } return [x, y, z]; };
      const G = []; for (let j = 0; j <= NZ; j++){ const row = []; for (let i = 0; i <= NX; i++) row.push(yAt(i/NX, j/NZ)); G.push(row); }
      const gv = B.p({c:'#c7a666', glow:'#ffcf80', gk:0.35, op:0.62});
      for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) Q(gv, G[j][i], G[j][i + 1], G[j + 1][i + 1], G[j + 1][i]);
      for (let j = 0; j <= NZ; j++) for (let i = 0; i < NX; i++) segP(gd, G[j][i], G[j][i + 1], 0.07, 3);
      for (let i = 0; i <= NX; i++) for (let j = 0; j < NZ; j++) segP(gd, G[j][i], G[j + 1][i], 0.07, 3);
      for (let j = 0; j < NZ; j += 3) for (let i = 0; i < NX; i += 2) segP(gd, G[j][i], G[j + 3 < NZ ? j + 3 : NZ][Math.min(NX, i + 2)], 0.05, 3);
      for (let i = 0; i <= NX; i++) segP(stl, [G[NZ][i][0], G[NZ][i][1] - 0.1, G[NZ][i][2]], [G[NZ][Math.min(NX, i + 1)][0], G[NZ][Math.min(NX, i + 1)][1] - 0.1, G[NZ][Math.min(NX, i + 1)][2]], 0.18, 4);
      // tree-like steel columns
      for (const z of [-20, -5, 10]){ const x = -17.4, top = 15.5; segP(stl, [x, Y0, z], [x, top, z], 0.45, 8, 0.38);
        for (let k = 0; k < 5; k++){ const a = k/5*TAU + 0.3, ex = x + Math.cos(a)*4.6, ez = z + Math.sin(a)*6.0, ey = yAt((ex - X0)/(X1 - X0), (ez - Z0)/(Z1 - Z0))[1] - 0.3;
          segP(stl, [x, top, z], [x + Math.cos(a)*2.2, top + 4.5, z + Math.sin(a)*2.6], 0.25, 5); segP(stl, [x + Math.cos(a)*2.2, top + 4.5, z + Math.sin(a)*2.6], [ex, ey, ez], 0.18, 5); } }
    }
    B.flush(g); return g; }};

// ===== Victoria Theatre (1862) and Victoria Memorial Hall (1905), linked by the 54 m clock tower (1906) =====
// Plan in local axes: +x = bearing 55 deg (NE, towards the Padang), +z = front (SE, Empress Place).
// Theatre = west half (x < 0), Concert Hall = east half; the clock tower stands in the recessed centre of the front.
LANDMARKS.victoria = {zh:'维多利亚剧院及音乐会堂', en:'Victoria Theatre and Concert Hall', cat:'old', r:56, h:54,
  lt:{m:0, c:'#ffdcae', k:1.05, e:0.5, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
    const W = '#f5f2ea', T = '#fdfcf8', D = '#2c3238', L = {c:'#3b352c', glow:'#ffcf8e', gk:0.55}, R = {c:'#62666b', lk:0.35}, P = '#c8c1b2',
      K = {c:'#f6f2e6', glow:'#fff3d6', gk:1.1}, KD = '#23262a', CU = {c:'#c9c7c0', lk:0.6};
    const w = B.p(W), t = B.p(T), dk = B.p(D), lit = B.p(L), rf = B.p(R), kc = B.p(K), kd = B.p(KD), cu = B.p(CU), sl = B.p({c:'#50555b', lk:0.25});
    // quoins: alternating long and short blocks up a corner of face F at u (side = +1 the block runs towards +u)
    const quoin = (F, u, sd, y0, y1) => { let k = 0; for (let y = y0; y < y1 - 0.2; y += 0.62, k++){ const wq = k % 2 ? 0.55 : 0.95; fbx(t, F, sd > 0 ? u : u - wq, sd > 0 ? u + wq : u, y, Math.min(y1, y + 0.52), -0.02, 0.1); } };
    // keystone and voussoir band over a round arch on face F (centre u, springing ys, width wa)
    const keyArch = (F, uc, ys, wa) => { const r = wa/2 + 0.25; for (let i = 0; i < 7; i++){ const a0 = PI*i/7, a1 = PI*(i + 1)/7; segP(t, fp(F, uc + Math.cos(a0)*r, ys + Math.sin(a0)*r, 0.12), fp(F, uc + Math.cos(a1)*r, ys + Math.sin(a1)*r, 0.12), 0.16, 4); }
      fbx(t, F, uc - 0.3, uc + 0.3, ys + wa/2 - 0.1, ys + wa/2 + 0.75, -0.02, 0.24); };
    // foundation / plinth: the traced footprint
    const FP = [[31.6,15.6],[38.1,15.5],[37.8,24.4],[29.7,24.3],[29.8,31.5],[13.9,31.7],[13.9,24.4],[-13.0,24.3],[-13.0,31.5],[-28.3,31.4],[-28.4,24.9],[-36.5,24.7],[-37.1,15.6],[-34.2,15.7],[-34.2,-23.5],[-28.2,-23.4],[-28.3,-30.6],[-9.5,-30.6],[-9.6,-24.7],[-4.1,-25.0],[-4.2,-22.0],[4.5,-22.2],[4.4,-24.3],[11.7,-24.3],[11.8,-30.2],[31.4,-30.2],[31.4,-25.0],[37.8,-25.1],[37.8,-12.8],[31.1,-13.1]];
    LPoly(g, FP, -5, 5.6, P);
    const Y0 = 0.6, EH = 17, RH = 6.4;
    // --- the two halls: tall gabled boxes, hipped at the back ---
    for (const [x0, x1] of [[-28.3, -9.5], [11.8, 31.3]]){
      const z0 = -30.4, z1 = 24.4; bx(w, x0, x1, Y0, EH, z0, z1);
      corniceR(t, x0, x1, z0, z1, EH - 1.0, 1.0, 0.45);
      gabHipZ(rf, w, x0, x1, z0, z1, EH, RH, 0.6, sl);
      bx(t, (x0 + x1)/2 - 0.25, (x0 + x1)/2 + 0.25, EH + RH - 0.1, EH + RH + 0.35, z0 + (x1 - x0)/2, z1);    // ridge
      const F = rectF(x0, x1, z0, z1);
      // clerestory windows above the aisles / link
      for (const s of ['l', 'r']) fwins(dk, lit, F[s], 3, F[s].L - 3, 4.6, [[12.0, 3.8, 'a', 1.7]], 0.05, rng, 0.3);
      fpil(t, F.l, 0.5, F.l.L - 0.5, 12, 11.2, EH - 1, 0.55, 0.25); fpil(t, F.r, 0.5, F.r.L - 0.5, 12, 11.2, EH - 1, 0.55, 0.25);
      // back elevation: two tiers of arched windows between pilasters, rusticated base band
      fwins(dk, lit, F.b, 1.5, F.b.L - 1.5, 3.8, [[2.0, 3.6, 'a', 1.5], [8.6, 5.2, 'a', 1.7]], 0.05, rng, 0.25);
      fpil(t, F.b, 0.4, F.b.L - 0.4, 5, Y0, EH - 1, 0.7, 0.3);
      fbx(t, F.b, -0.3, F.b.L + 0.3, 7.3, 7.9, -0.02, 0.3);
      if (x0 > 0){ const Fr = F.r; fwins(dk, lit, Fr, 9.4, 36.7, 3.9, [[2.0, 3.6, 'a', 1.5], [7.0, 3.8, 'a', 1.6]], 0.05, rng, 0.3);
        fpil(t, Fr, 9.2, 36.9, 7, Y0, 11.2, 0.6, 0.28); fbx(t, Fr, 9.0, 37.1, 6.3, 6.8, -0.02, 0.32); for (let y = Y0 + 0.8; y < 6.2; y += 0.8) fbx(w, Fr, 9.0, 37.1, y, y + 0.1, -0.02, 0.1); }
    }
    // --- pedimented frontispieces of the two halls ---
    for (const [x0, x1] of [[-28.3, -13.0], [13.9, 29.8]]){
      const z0 = 24.4, z1 = 31.6; bx(w, x0, x1, Y0, EH, z0, z1);
      gabR(rf, null, x0 - 0.3, x1 + 0.3, z0, z1 + 0.2, EH, 5.2, 'z', 0, sl);
      const F = rectF(x0, x1, z0, z1), Lf = F.f.L;
      // rusticated ground storey with three arched doors
      for (let y = Y0 + 0.9; y < 6.6; y += 0.9) fbx(w, F.f, -0.1, Lf + 0.1, y, y + 0.12, -0.02, 0.12);
      for (const u of [Lf*0.22, Lf*0.5, Lf*0.78]){ farch(dk, F.f, u, Y0 + 0.2, 2.4, 4.6, 0.14, 8); keyArch(F.f, u, 4.6, 2.4); }
      quoin(F.f, 0, 1, Y0, 15.4); quoin(F.f, Lf, -1, Y0, 15.4);
      fbx(t, F.f, -0.4, Lf + 0.4, 6.6, 7.3, -0.02, 0.45);           // string course
      // upper storey: four engaged Corinthian columns, three arched windows (the middle one larger)
      for (const u of [1.0, Lf*0.36, Lf*0.64, Lf - 1.0]) fcol(t, t, F.f, u, 0.55, 7.3, 15.4, 0.42, 8);
      farch(lit, F.f, Lf*0.5, 8.6, 2.8, 12.6, 0.05, 8); farch(dk, F.f, Lf*0.18, 9.0, 1.6, 12.4, 0.05); farch(dk, F.f, Lf*0.82, 9.0, 1.6, 12.4, 0.05);
      fbx(t, F.f, -0.5, Lf + 0.5, 15.4, EH, -0.02, 0.9);              // entablature
      fped(w, t, F.f, -0.4, Lf + 0.4, EH, 5.0, 0.0, 0.85);            // pediment
      // flanks of the frontispiece
      for (const s of ['l', 'r']){ farch(dk, F[s], F[s].L*0.5, 2.0, 1.4, 4.6, 0.05); farch(dk, F[s], F[s].L*0.5, 8.8, 1.6, 12.6, 0.05); }
    }
    // --- two-storey side wings (lower), hipped roofs and balustraded cornices ---
    const wings = [[31.3, 37.8, 15.5, 24.4], [31.3, 37.8, -25.0, -12.8], [-36.8, -28.3, 15.6, 24.8], [-34.2, -28.3, -23.5, 15.6]];
    for (const [x0, x1, z0, z1] of wings){
      const H = 11; bx(w, x0, x1, Y0, H, z0, z1); corniceR(t, x0, x1, z0, z1, H - 0.7, 0.7, 0.35);
      hipR(rf, x0, x1, z0, z1, H, 2.6, 0.4, null, null, sl);
      const F = rectF(x0, x1, z0, z1);
      for (const s of ['f', 'r', 'b', 'l']){ if (F[s].L < 3) continue;
        fwins(dk, lit, F[s], 0.8, F[s].L - 0.8, 3.9, [[1.8, 3.4, 'a', 1.4], [6.4, 2.9, 'r', 1.3]], 0.05, rng, 0.2);
        fbx(t, F[s], -0.2, F[s].L + 0.2, 5.4, 5.9, -0.02, 0.22); }
    }
    // --- centre link between the halls (loggia front, flat roof with balustrade) ---
    { const x0 = -9.5, x1 = 11.8, z0 = -24.6, z1 = 24.3, H = 14;
      bx(w, x0, x1, Y0, H, z0, z1); bx(rf, x0 + 0.4, x1 - 0.4, H, H + 0.06, z0 + 0.4, z1 - 0.4); corniceR(t, x0, x1, z0, z1, H - 0.8, 0.8, 0.4);
      const Ff = fc(-13.0, 24.3, 13.9, 24.3);
      // front: loggia arches either side of the tower, upper windows
      farcade(w, Ff, 0.4, 9.2, 2, Y0, 4.4, 7.6, 1.2, 0, 0.7); farcade(w, Ff, 18.0, 26.5, 2, Y0, 4.4, 7.6, 1.2, 0, 0.7);
      frect(dk, Ff, 0.4, 26.5, Y0, 7.0, -0.05);
      for (const u of [2.6, 7.0, 20.2, 24.4]) farch(rng() < 0.4 ? lit : dk, Ff, u, 8.6, 1.5, 11.6, 0.05);
      fbx(t, Ff, -0.2, 27.1, 13.2, 14.0, -0.02, 0.45); fbal(t, Ff, 0, 26.9, 14.0, 1.1, 0.1);
      const Fb = fc(11.8, -24.6, -9.5, -24.6); fwins(dk, lit, Fb, 1, Fb.L - 1, 4, [[2, 3.5, 'a', 1.4], [7.6, 3.6, 'a', 1.4]], 0.05, rng, 0.25);
      fbal(t, Fb, 0, Fb.L, 14.0, 1.1, 0.1);
    }
    // --- the clock tower ---
    { const cx = 0.6, cz = 20.6, s0 = 8.6;
      const sq = (s, y0, y1, o) => bx(o || w, cx - s/2, cx + s/2, y0, y1, cz - s/2, cz + s/2);
      const faces = s => { const R2 = rectF(cx - s/2, cx + s/2, cz - s/2, cz + s/2); return [R2.f, R2.r, R2.b, R2.l]; };
      sq(s0, Y0, 33.6);
      // ground-floor entrance arch and rustication on the front, corner pilasters up the shaft
      const Ft = faces(s0)[0]; farch(dk, Ft, s0/2, Y0 + 0.2, 3.0, 5.6, 0.06, 8); keyArch(Ft, s0/2, 5.6, 3.0);
      for (const F of faces(s0)){ quoin(F, 0, 1, Y0, 14); quoin(F, s0, -1, Y0, 14); } fbx(t, Ft, 1.2, s0 - 1.2, 7.4, 8.0, -0.02, 0.35);
      for (let y = Y0 + 0.9; y < 7.2; y += 0.9){ fbx(w, Ft, -0.1, 1.2, y, y + 0.12, -0.02, 0.1); fbx(w, Ft, s0 - 1.2, s0 + 0.1, y, y + 0.12, -0.02, 0.1); }
      for (const F of faces(s0)){
        fbx(t, F, -0.15, 0.85, 14, 33.6, -0.02, 0.3); fbx(t, F, s0 - 0.85, s0 + 0.15, 14, 33.6, -0.02, 0.3);
        farch(dk, F, s0/2, 22.5, 1.3, 29.6, 0.05, 6); farch(dk, F, s0/2, 15.8, 1.1, 19.6, 0.05, 6);
        fbx(t, F, -0.2, s0 + 0.2, 21.2, 21.8, -0.02, 0.32);
      }
      sq(s0 + 0.9, 33.6, 34.7, t);                                  // cornice
      const s1 = 8.0; sq(s1, 34.7, 41.6);                           // clock stage
      for (const F of faces(s1)){
        fbx(t, F, -0.1, 0.9, 34.7, 41.6, -0.02, 0.35); fbx(t, F, s1 - 0.9, s1 + 0.1, 34.7, 41.6, -0.02, 0.35);
        // clock face: a 16-gon disc with a dark rim and two hands
        const u = s1/2, yc = 38.2, rr = 1.65;
        for (let i = 0; i < 16; i++){ const a = i/16*TAU, b = (i + 1)/16*TAU;
          T3(kc, fp(F, u, yc, 0.12), fp(F, u + Math.cos(a)*rr, yc + Math.sin(a)*rr, 0.12), fp(F, u + Math.cos(b)*rr, yc + Math.sin(b)*rr, 0.12));
          Q(kd, fp(F, u + Math.cos(a)*rr, yc + Math.sin(a)*rr, 0.13), fp(F, u + Math.cos(b)*rr, yc + Math.sin(b)*rr, 0.13), fp(F, u + Math.cos(b)*(rr + 0.25), yc + Math.sin(b)*(rr + 0.25), 0.13), fp(F, u + Math.cos(a)*(rr + 0.25), yc + Math.sin(a)*(rr + 0.25), 0.13)); }
        fbx(kd, F, u - 0.06, u + 0.06, yc, yc + 1.25, 0.12, 0.2); fbx(kd, F, u, u + 0.9, yc - 0.05, yc + 0.07, 0.12, 0.2);
        fped(w, t, F, 0.4, s1 - 0.4, 42.4, 1.5, 0.0, 0.4);            // small pediment over each clock
      }
      sq(s1 + 0.8, 41.6, 42.4, t);
      // belvedere: arched openings, corner columns, balustrade, cornice
      const s2 = 5.8; sq(s2, 42.4, 47.6);
      for (const F of faces(s2)){ farch(dk, F, s2/2, 43.0, 2.0, 45.8, 0.05, 6); }
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) segP(t, [cx + sx*(s2/2 + 0.35), 42.6, cz + sz*(s2/2 + 0.35)], [cx + sx*(s2/2 + 0.35), 47.4, cz + sz*(s2/2 + 0.35)], 0.3, 6);
      for (const F of faces(7.6)) fbal(t, F, 0.2, 7.4, 42.4, 0.9, 0.0, 0.25);
      sq(s2 + 1.2, 47.6, 48.5, t);
      latheP(cu, [[3.0, 48.5], [3.0, 49.0], [2.7, 50.3], [2.0, 51.4], [1.0, 52.3], [0.35, 52.7], [0.22, 53.1], [0.01, 53.2]], cx, cz, 12, PI/12);
      segP(kd, [cx, 52.9, cz], [cx, 54.0, cz], 0.07, 4);
    }
    B.flush(g); return g; }};

// ===== St Andrew's Cathedral (1856-61, Ronald MacPherson): white Madras-chunam Early English Gothic, 63 m spire over
// the west porch, buttressed nave with clerestory, transepts (extended as halls in 1952 / 1983), polygonal apse.
// Local axes: +x = bearing 61.5 deg along the nave (west tower at -x, apse at +x), +z = bearing -28.5 deg (towards
// St Andrew's Road); the main (west) door faces -x.
LANDMARKS.standrews = {zh:'圣安德烈座堂', en:"St Andrew's Cathedral", cat:'old', r:60, h:63,
  lt:{m:0, c:'#ffe6c4', k:1.1, e:0.6, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
    const W = '#f8f7f3', T = '#ecebe5', D = '#2a3038', L = {c:'#3b342d', glow:'#ffc77d', gk:0.6}, R = {c:'#5d6168', lk:0.25}, PL = '#c8c1b3',
      TT = '#5b4b3b', TC = {c:'#507545', lk:0.2};
    const w = B.p(W), t = B.p(T), dk = B.p(D), lit = B.p(L), rf = B.p(R), sl = B.p({c:'#4a4e55', lk:0.2});
    const FP = [[4.5,-20.4],[9.8,-20.5],[9.5,-19.7],[11.7,-19.5],[11.4,-18.7],[9.6,-18.3],[9.9,-10.3],[13.3,-10.1],[13.3,-11.5],[16.0,-11.6],[16.0,-10.2],[19.5,-10.2],[19.4,-11.4],[21.3,-11.7],[20.7,-10.2],[22.6,-10.5],[22.6,-9.2],[20.8,-8.8],[21.0,-6.2],[23.8,-5.7],[25.1,-7.1],[25.7,-6.0],[24.9,-4.9],[26.6,-3.1],[28.5,-3.5],[29.0,-2.4],[27.2,-2.1],[26.5,0.4],[28.4,1.4],[28.1,2.2],[26.2,1.2],[24.8,3.3],[25.6,4.9],[24.6,5.5],[23.7,3.9],[21.0,4.0],[20.9,7.5],[22.7,7.2],[22.3,8.8],[20.9,8.8],[21.1,10.1],[18.9,9.9],[18.9,8.6],[15.6,9.0],[15.4,9.8],[13.5,10.1],[13.5,8.8],[10.1,8.6],[9.5,16.4],[11.4,17.3],[10.1,17.3],[9.6,19.0],[4.4,19.2],[4.4,29.3],[5.4,28.7],[5.5,30.1],[-6.0,30.2],[-5.2,29.1],[-4.4,29.3],[-4.7,18.7],[-10.3,18.3],[-10.4,17.0],[-9.1,16.9],[-9.0,9.4],[-12.5,9.3],[-13.5,11.2],[-13.9,9.3],[-17.3,9.2],[-17.0,11.0],[-18.3,11.0],[-17.9,9.5],[-21.8,9.6],[-21.7,11.0],[-22.6,10.7],[-22.6,9.4],[-26.1,9.2],[-25.8,11.1],[-26.6,10.8],[-26.6,9.5],[-32.7,9.4],[-32.3,6.4],[-41.9,6.2],[-43.7,7.8],[-44.8,5.7],[-43.2,4.9],[-43.4,-5.2],[-44.8,-7.8],[-43.5,-9.2],[-42.1,-6.6],[-32.5,-6.3],[-32.6,-10.3],[-26.8,-10.8],[-26.9,-12.1],[-26.0,-11.9],[-26.0,-10.5],[-22.6,-10.5],[-22.5,-11.7],[-21.5,-12.3],[-21.7,-10.2],[-17.8,-10.3],[-18.1,-12.2],[-17.3,-11.9],[-17.3,-10.6],[-13.8,-10.4],[-13.3,-12.1],[-12.5,-11.8],[-12.4,-10.5],[-9.0,-10.3],[-9.3,-18.2],[-10.6,-18.2],[-10.6,-19.5],[-9.3,-19.6],[-9.3,-20.9],[-4.6,-20.8],[-4.4,-31.8],[-5.8,-31.7],[-5.5,-32.6],[5.9,-32.6],[5.2,-31.5],[4.3,-31.8]];
    LPoly(g, FP, -5, 5.6, PL);
    const Y0 = 0.6, AW = 8.6, CW = 15.6, NR = 6.6;            // aisle eaves, clerestory eaves, nave roof rise
    const zc0 = -6.0, zc1 = 5.8, za0 = -10.4, za1 = 9.4;      // clerestory and aisle walls
    // buttress with a sloped cap and a little pinnacle, standing on face F at u, projecting p
    const butt = (F, u, h, p, pin) => { fbx(t, F, u - 0.45, u + 0.45, Y0, h - 1.2, 0, p); fbx(t, F, u - 0.45, u + 0.45, h - 1.2, h, 0, p*0.55);
      if (pin){ const c = fp(F, u, 0, p*0.3); bx(t, c[0] - 0.3, c[0] + 0.3, h, h + 0.9, c[2] - 0.3, c[2] + 0.3); latheP(w, [[0.36, h + 0.9], [0.05, h + 3.0], [0.01, h + 3.2]], c[0], c[2], 4, PI/4); } };
    // lancet with a hood mould (drip moulding following the pointed head) and a sill
    const fl = (o, F, uc, y0, wd, ys, d, n) => { flancet(o, F, uc, y0, wd, ys, d, n); const r = wd/2, R2 = wd + 0.24, am = Math.acos(-r/R2), m = 5;
      for (const sg of [1, -1]) for (let i = 0; i < m; i++){ const a0 = PI - (PI - am)*i/m, a1 = PI - (PI - am)*(i + 1)/m;
        const p0 = fp(F, uc + sg*(r + R2*Math.cos(a0)), ys + R2*Math.sin(a0), d + 0.12), p1 = fp(F, uc + sg*(r + R2*Math.cos(a1)), ys + R2*Math.sin(a1), d + 0.12); segP(t, p0, p1, 0.1, 4); }
      fbx(t, F, uc - r - 0.3, uc - r - 0.05, ys - 0.5, ys, d - 0.02, d + 0.2); fbx(t, F, uc + r + 0.05, uc + r + 0.3, ys - 0.5, ys, d - 0.02, d + 0.2);
      fbx(t, F, uc - r - 0.15, uc + r + 0.15, y0 - 0.22, y0, -0.02, d + 0.22); };
    // ---- nave: clerestory, aisles with lean-to roofs, buttresses, lancets ----
    { const x0 = -31.4, x1 = -9.2;
      bx(w, x0, x1, Y0, CW, zc0, zc1); bx(w, -32.6, x1, Y0, AW, za0, zc0); bx(w, -32.6, x1, Y0, AW, zc1, za1);
      for (const [zo, zi] of [[za0, zc0], [za1, zc1]]) Q(rf, [-32.8, AW, zo + Math.sign(zo)*0.4], [x1, AW, zo + Math.sign(zo)*0.4], [x1, AW + 2.6, zi], [-32.8, AW + 2.6, zi]);
      const Fs = [fc(-32.6, za1, x1, za1), fc(x1, za0, -32.6, za0)];
      for (const F of Fs){ for (let k = 0; k < 5; k++){ const u = 1.6 + k*(F.L - 3.2)/4; butt(F, u, AW + 0.4, 1.5, true); }
        for (let k = 0; k < 4; k++){ const u = 1.6 + (k + 0.5)*(F.L - 3.2)/4; fl(rng() < 0.55 ? lit : dk, F, u, 2.2, 1.3, 6.2, 0.05); }
        fbx(t, F, -0.1, F.L + 0.1, AW - 0.5, AW, -0.02, 0.3); }
      for (const F of [fc(-31.4, zc1, x1, zc1), fc(x1, zc0, -31.4, zc0)]) for (let k = 0; k < 5; k++){ const u = 2.0 + k*(F.L - 4)/4; fl(lit, F, u - 0.6, 11.6, 0.8, 13.6, 0.05); fl(dk, F, u + 0.6, 11.6, 0.8, 13.6, 0.05); }
      corniceR(t, x0, x1, zc0, zc1, CW - 0.5, 0.5, 0.25); corniceR(t, -32.6, x1, za0, za1, Y0, 0.8, 0.22);
    }
    // ---- chancel (aisled) and the polygonal apse ----
    { const x0 = 9.9, x1 = 21.0;
      bx(w, x0, x1, Y0, CW, zc0, zc1); bx(w, x0, x1, Y0, AW, za0 + 0.2, zc0); bx(w, x0, x1, Y0, AW, zc1, za1 + 0.6);
      for (const [zo, zi] of [[za0 + 0.2, zc0], [za1 + 0.6, zc1]]) Q(rf, [x0, AW, zo + Math.sign(zo)*0.4], [x1 + 0.4, AW, zo + Math.sign(zo)*0.4], [x1 + 0.4, AW + 2.6, zi], [x0, AW + 2.6, zi]);
      for (const F of [fc(x0, za1 + 0.6, x1, za1 + 0.6), fc(x1, za0 + 0.2, x0, za0 + 0.2)]){ butt(F, 3.4, AW + 0.4, 1.4, true); butt(F, 6.4, AW + 0.4, 1.4, true); butt(F, 9.6, AW + 0.4, 1.4, true);
        fl(dk, F, 1.8, 2.2, 1.3, 6.2, 0.05); fl(lit, F, 4.9, 2.2, 1.3, 6.2, 0.05); fl(dk, F, 8.0, 2.2, 1.3, 6.2, 0.05); }
      for (const F of [fc(x0, zc1, x1, zc1), fc(x1, zc0, x0, zc0)]){ fl(lit, F, 3.0, 11.6, 0.8, 13.6, 0.05); fl(dk, F, 7.6, 11.6, 0.8, 13.6, 0.05); }
      corniceR(t, x0, x1, zc0, zc1, CW - 0.5, 0.5, 0.25);
      // apse: half octagon round (21, -0.1), walls to 14 m, polygonal roof, buttresses at the angles, tall lancets
      const ax = 21.0, az = -0.1, ar = 6.1, n = 4, AH = 14.0, P = [];
      for (let i = 0; i <= n; i++){ const a = -HP + PI*i/n; P.push([ax + Math.cos(a)*ar, az + Math.sin(a)*ar]); }
      for (let i = 0; i < n; i++){ const a = P[i], b = P[i + 1]; Q(w, [a[0], Y0, a[1]], [b[0], Y0, b[1]], [b[0], AH, b[1]], [a[0], AH, a[1]]);
        T3(w, [ax, AH, az], [a[0], AH, a[1]], [b[0], AH, b[1]]);
        T3(rf, [ax, AH + 6.2, az], [b[0] + (b[0] - ax)*0.06, AH - 0.1, b[1] + (b[1] - az)*0.06], [a[0] + (a[0] - ax)*0.06, AH - 0.1, a[1] + (a[1] - az)*0.06]);
        const F = fc(b[0], b[1], a[0], a[1]); fl(lit, F, F.L/2, 3.0, 1.5, 10.6, 0.05, 5); }
      for (let i = 1; i < n; i++){ const a = -HP + PI*i/n, c = [ax + Math.cos(a)*(ar + 0.6), az + Math.sin(a)*(ar + 0.6)], F = fc(c[0] - Math.sin(a)*0.5, c[1] + Math.cos(a)*0.5, c[0] + Math.sin(a)*0.5, c[1] - Math.cos(a)*0.5);
        fbx(t, F, 0, 1.0, Y0, AH - 2, -0.6, 1.4); fbx(t, F, 0, 1.0, AH - 2, AH - 0.6, -0.6, 0.6); }
    }
    // ---- nave + chancel roof (one ridge from the tower to the apse), crossing ----
    gabR(rf, w, -31.6, 21.05, zc0, zc1, CW, NR, 'x', 0.5, sl);
    bx(w, -9.2, 9.9, Y0, CW, zc0, zc1);
    // ---- transepts: inner arms (19 m wide) to the nave height, then the lower 1952 / 1983 hall extensions ----
    for (const sg of [-1, 1]){
      const zi = sg > 0 ? za1 : za0, zo = sg > 0 ? 19.1 : -20.8, ze = sg > 0 ? 30.0 : -32.4, xa = -9.2, xb = 9.8;
      const [lo, hi] = sg > 0 ? [zc1, zo] : [zo, zc0];
      bx(w, xa, xb, Y0, CW - 1.0, Math.min(lo, hi), Math.max(lo, hi));
      gabR(rf, w, xa - 0.4, xb + 0.4, Math.min(lo, hi), Math.max(lo, hi), CW - 1.0, 7.4, 'z', 0, sl);
      const Fe = sg > 0 ? fc(xa, zo, xb, zo) : fc(xb, zo, xa, zo);
      fl(dk, Fe, Fe.L/2 - 6.6, 3.0, 1.4, 9.6, 0.05); fl(dk, Fe, Fe.L/2 + 6.6, 3.0, 1.4, 9.6, 0.05);
      fl(lit, Fe, Fe.L/2 - 1.3, 13.6, 1.0, 16.4, 0.05); fl(lit, Fe, Fe.L/2 + 1.3, 13.6, 1.0, 16.4, 0.05); farch(dk, Fe, Fe.L/2, 17.6, 1.5, 18.2, 0.05, 8);
      butt(Fe, 0.5, CW - 1.0, 1.6, true); butt(Fe, Fe.L - 0.5, CW - 1.0, 1.6, true);
      for (const F of [fc(xb, Math.max(zi, zo), xb, Math.min(zi, zo)), fc(xa, Math.min(zi, zo), xa, Math.max(zi, zo))]){ fl(dk, F, F.L*0.5, 2.4, 1.3, 9.0, 0.05); butt(F, F.L*0.9, CW - 2, 1.2, false); }
      // the hall extension: 9.3 m wide, lower gabled range out to the ends of the cross
      const ya = 8.6, xc = -4.6, xd = 4.6, [e0, e1] = sg > 0 ? [zo, ze] : [ze, zo];
      bx(w, xc, xd, Y0, ya, e0, e1); gabR(rf, w, xc - 0.3, xd + 0.3, e0, e1, ya, 4.6, 'z', 0, sl);
      const Fx = sg > 0 ? fc(xc, ze, xd, ze) : fc(xd, ze, xc, ze); fl(dk, Fx, Fx.L/2 - 1.6, 2.2, 1.2, 7.0, 0.05); fl(dk, Fx, Fx.L/2 + 1.6, 2.2, 1.2, 7.0, 0.05); fl(lit, Fx, Fx.L/2, 9.4, 0.9, 10.6, 0.05);
      for (const F of [fc(xd, e1, xd, e0), fc(xc, e0, xc, e1)]) fwins(dk, lit, F, 0.6, F.L - 0.6, 3.0, [[2.2, 4.4, 'l', 1.1]], 0.05, rng, 0.25);
    }
    // ---- the west tower, belfry, corner pinnacles and the octagonal spire ----
    { const cx = -37.15, cz = -0.05, s = 11.6, TH = 25.8;
      const Rt = rectF(cx - s/2, cx + s/2, cz - s/2, cz + s/2), FA = [Rt.f, Rt.r, Rt.b, Rt.l];
      bx(w, cx - s/2, cx + s/2, Y0, TH, cz - s/2, cz + s/2);
      for (const F of FA){
        if (F !== Rt.r){ fl(dk, F, s/2, Y0, 4.0, 6.4, 0.06, 6); fbx(t, F, s/2 - 2.6, s/2 - 2.0, Y0, 6.6, -0.02, 0.4); fbx(t, F, s/2 + 2.0, s/2 + 2.6, Y0, 6.6, -0.02, 0.4); }
        fbx(t, F, -0.1, s + 0.1, 10.0, 10.5, -0.02, 0.3); fbx(t, F, -0.1, s + 0.1, 17.6, 18.1, -0.02, 0.3);
        fl(dk, F, s/2, 11.6, 1.4, 15.2, 0.05);
        fl(dk, F, s/2 - 1.3, 19.0, 1.5, 22.8, 0.05); fl(dk, F, s/2 + 1.3, 19.0, 1.5, 22.8, 0.05);
        fbx(t, F, -0.2, s + 0.2, TH - 0.4, TH + 0.5, -0.02, 0.45);
        for (let u = 0.6; u < s - 0.2; u += 1.0) fbx(w, F, u, u + 0.55, TH + 0.5, TH + 1.4, -0.3, 0.15);   // battlement
      }
      // angled corner buttresses rising in three set-offs
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]){
        const px = cx + sx*s/2, pz = cz + sz*s/2, dx = sx*0.7071, dz = sz*0.7071, F = fc(px + dz*0.6, pz - dx*0.6, px - dz*0.6, pz + dx*0.6);
        const Fo = (dx*F.nx + dz*F.nz) > 0 ? F : fc(px - dz*0.6, pz + dx*0.6, px + dz*0.6, pz - dx*0.6);
        fbx(t, Fo, 0, 1.2, Y0, 9.6, -0.3, 2.0); fbx(t, Fo, 0, 1.2, 9.6, 17.6, -0.3, 1.3); fbx(t, Fo, 0, 1.2, 17.6, TH, -0.3, 0.6);
        // corner pinnacle
        const c = [px - sx*0.6, 0, pz - sz*0.6]; bx(w, c[0] - 0.7, c[0] + 0.7, TH, TH + 2.6, c[2] - 0.7, c[2] + 0.7);
        latheP(w, [[0.95, TH + 2.6], [0.2, TH + 7.2], [0.01, TH + 7.4]], c[0], c[2], 8, PI/8);
      }
      // spire: octagon from the tower top to the tip, banded, with four gabled lucarnes at the base
      const r0 = 4.7, y0 = TH + 0.4, tip = 61.9;
      latheP(w, [[r0, y0], [r0*0.93, y0 + 3.0], [0.55, tip - 0.6], [0.01, tip]], cx, cz, 8, PI/8);
      for (let i = 0; i < 8; i++){ const an = PI/8 + i*PI/4; for (let y = y0 + 5.0; y < tip - 3; y += 2.3){ const rb = r0*0.93 - (r0*0.93 - 0.55)*(y - y0 - 3)/(tip - 0.6 - y0 - 3) + 0.14, qx = cx + Math.cos(an)*rb, qz = cz + Math.sin(an)*rb;
        bx(t, qx - 0.17, qx + 0.17, y, y + 0.42, qz - 0.17, qz + 0.17); } }
      for (const yb of [y0 + 3.0, y0 + 12, y0 + 21]){ const rb = r0*0.93 - (r0*0.93 - 0.55)*(yb - y0 - 3)/(tip - 0.6 - y0 - 3); latheP(t, [[rb + 0.18, yb], [rb + 0.18, yb + 0.5]], cx, cz, 8, PI/8); }
      for (let i = 0; i < 4; i++){ const a = i*HP, ux = Math.cos(a), uz = Math.sin(a), bxp = cx + ux*(r0 - 0.4), bzp = cz + uz*(r0 - 0.4);
        const F = fc(bxp - uz*1.1, bzp + ux*1.1, bxp + uz*1.1, bzp - ux*1.1), Fo = (ux*F.nx + uz*F.nz) > 0 ? F : fc(bxp + uz*1.1, bzp - ux*1.1, bxp - uz*1.1, bzp + ux*1.1);
        fbx(w, Fo, 0, 2.2, y0 + 2.6, y0 + 5.4, -0.8, 1.0); fped(w, t, Fo, -0.05, 2.25, y0 + 5.4, 1.6, -0.8, 1.0); fl(dk, Fo, 1.1, y0 + 2.9, 0.8, y0 + 4.6, 1.05, 3); }
      // finial cross
      segP(t, [cx, tip - 0.3, cz], [cx, 63.0, cz], 0.09, 4); segP(t, [cx - 0.45, 62.35, cz], [cx + 0.45, 62.35, cz], 0.08, 4);
    }
    // ---- the cathedral grounds: big rain trees on the lawns round the church (the app's ground is the lawn) ----
    { const tt = B.p(TT), tc = B.p(TC);
      for (const [x, z, sc] of [[-47, 15, 1.15], [-48, -16, 1.1], [-22, 21, 1.05], [-24, -21, 1.1], [20, 19, 1.0], [24, -18, 0.95]]) rainP(tt, tc, x, z, sc, rng); }
    B.flush(g); return g; }};

// =====================================================================================================================
// ===== Parliament House (1999, Public Works Department): slate-grey Front Block with the colonnade of square pillars
// and President Ong Teng Cheong's prism-shaped pinnacle over the ceremonial entrance hall, the Chamber Block towards
// the river with its raised chamber roof, the Public Block linking to the restored 1839 Court House Annexe (Parliament
// Secretariat Office, two-storey colonial range with verandahs) and the pergola along the courtyard.
// Local axes: +x = bearing 54.5 deg (NE, Parliament Place), +z = SE (towards The Arts House); North Bridge Road and
// the ceremonial driveway are at -z, the Singapore River at -x.
LANDMARKS.parliament = {zh:'新加坡国会大厦', en:'Parliament House', cat:'new', r:88, h:40,
  lt:{m:0, c:'#ffe2bc', k:0.95, e:0.5, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
    const GY = '#8e9399', CL = '#aeb2b5', D = '#252b31', L = {c:'#38342e', glow:'#ffd9a0', gk:0.55}, RF = {c:'#5d6268', lk:0.25},
      PR = {c:'#7c95a0', glow:'#ffdcae', gk:0.6, lk:0.4}, RIB = '#6c7278', CW = '#ece8de', CT = '#f7f4ec', CR = {c:'#626670', lk:0.3}, PL = '#7f8388',
      WT = {c:'#5f8797', lk:0.3}, TT = '#6b5a45', TL = {c:'#56803f', lk:0.2};
    const gy = B.p(GY), cl = B.p(CL), dk = B.p(D), lit = B.p(L), rf = B.p(RF), pr = B.p(PR), rib = B.p(RIB), cw = B.p(CW), ct = B.p(CT), cr = B.p(CR), wt = B.p(WT);
    const Y0 = 0.6, win = () => rng() < 0.3 ? lit : dk;
    // grey block: walls on plan P (inset by the colonnade depth on the faces listed), giant square pillars, entablature
    const greyBlock = (P, H, colFaces, cd) => {
      const Pw = insetE(P, P.map((_, i) => colFaces.includes(i) ? cd : 0)), FP = edgesOut(P), FW = edgesOut(Pw);
      LPoly(g, P, -5, 5.6, PL);
      wallsP(gy, Pw, Y0, 15.0); wallsP(gy, P, 15.0, H); ringP(gy, P, Pw, 15.0); capT(rf, inset(P, 0.2), H - 0.1);
      FP.forEach((F, i) => { if (F.L < 3) return;
        const colon = colFaces.includes(i), n = Math.max(1, Math.round(F.L/4.6)), bw = F.L/n;
        if (colon){
          // a colonnade of square pillars in front of the glazed, recessed wall
          const Fw = FW[i]; frect(win(), Fw, 0.3, Fw.L - 0.3, Y0, 4.8, 0.03);
          for (let k = 0; k < n; k++){ const uc = (k + 0.5)*Fw.L/n; for (const y of [5.6, 10.2]) frect(win(), Fw, uc - 1.3, uc + 1.3, y, y + 3.2, 0.03); }
          for (let k = 0; k <= n; k++){ const u = Math.min(F.L - 0.7, Math.max(0.7, k*bw)); fbx(cl, F, u - 0.7, u + 0.7, Y0, 15.0, -cd + 0.1, 0); fbx(cl, F, u - 0.85, u + 0.85, Y0, 1.2, -cd + 0.1, 0.15);
            fbx(cl, F, u - 0.92, u + 0.92, 13.9, 14.5, -cd + 0.0, 0.22); fbx(gy, F, u - 0.8, u + 0.8, 13.4, 13.9, -cd + 0.05, 0.1);    // capital and necking
            fbx(gy, F, u - 0.25, u + 0.25, 1.6, 13.0, 0.0, 0.06); }                                                                  // flute down the face
          for (let k = 0; k < n; k++){ const uc = (k + 0.5)*Fw.L/n; for (const y of [5.6, 10.2]) fbx(cl, Fw, uc - 1.5, uc + 1.5, y - 0.35, y, -0.02, 0.25); }   // sills behind the columns
          fbx(cl, F, -0.1, F.L + 0.1, 15.0, 16.6, -0.02, 0.3);
        } else {
          for (let k = 0; k < n; k++){ const uc = (k + 0.5)*bw; for (const y of [1.4, 5.8, 10.2]){ frect(win(), F, uc - 1.0, uc + 1.0, y, y + 2.6, 0.04);
            fbx(cl, F, uc - 1.25, uc + 1.25, y - 0.3, y, -0.02, 0.22); fbx(cl, F, uc - 1.2, uc + 1.2, y + 2.6, y + 2.95, -0.02, 0.16);
            fbx(cl, F, uc - 1.2, uc - 1.0, y, y + 2.6, -0.02, 0.12); fbx(cl, F, uc + 1.0, uc + 1.2, y, y + 2.6, -0.02, 0.12); } }
          for (let k = 0; k <= n; k++) fbx(cl, F, k*bw - 0.45, k*bw + 0.45, Y0, 15.0, -0.02, 0.35);
          fbx(cl, F, -0.2, F.L + 0.2, 15.0, 16.4, -0.02, 0.55);
        }
        frect(win(), F, 0.6, F.L - 0.6, 17.0, 19.2, 0.04);
        for (let k = 1; k < Math.round(F.L/2.3); k++){ const u = k*F.L/Math.round(F.L/2.3); fbx(cl, F, u - 0.12, u + 0.12, 16.9, 19.3, -0.02, 0.1); }   // attic mullions
        fbx(cl, F, -0.3, F.L + 0.3, H - 0.8, H, -0.02, 0.5); fbx(cl, F, -0.3, F.L + 0.3, H, H + 0.9, -0.3, 0.1);                      // cornice and parapet
      });
    };
    // ---- Front Block (ceremonial entrance hall under the prism) ----
    const FB = [[58.3,-14.0],[30.7,-14.0],[30.8,-6.7],[2.0,-6.1],[-1.7,-11.4],[-19.9,-10.3],[-19.9,-15.4],[-59.4,-15.7],[-59.3,-34.9],[-45.2,-34.7],[-44.8,-37.2],[-8.8,-38.7],[-9.1,-44.3],[-5.4,-44.1],[-6.0,-48.0],[20.1,-48.3],[20.1,-38.0],[15.3,-37.6],[15.7,-31.9],[57.6,-32.5]];
    greyBlock(FB, 20.4, [7, 8, 10, 14, 18], 2.4);
    // ---- Chamber Block ----
    const CH = [[-24.8,37.9],[-30.0,38.7],[-29.6,44.4],[-35.6,44.2],[-34.9,48.1],[-49.0,47.9],[-48.7,44.1],[-52.2,44.4],[-52.2,33.3],[-59.4,33.4],[-59.4,-15.7],[-25.8,-15.5]];
    greyBlock(CH, 20.4, [4, 9], 2.4);
    // the raised chamber: clerestory drum and hipped roof over the debating chamber
    { const cx0 = -55, cx1 = -30, cz0 = -2, cz1 = 26; bx(gy, cx0, cx1, 20.4, 25.4, cz0, cz1);
      const F = rectF(cx0, cx1, cz0, cz1); for (const s of ['f', 'r', 'b', 'l']){ fwins(dk, lit, F[s], 0.6, F[s].L - 0.6, 3.0, [[21.4, 2.8, 'r', 1.6]], 0.05, rng, 0.5); fbx(cl, F[s], -0.3, F[s].L + 0.3, 24.8, 25.4, -0.02, 0.5); fpil(cl, F[s], 0.3, F[s].L - 0.3, Math.round(F[s].L/3), 20.4, 24.8, 0.4, 0.2); }
      hipR(rf, cx0, cx1, cz0, cz1, 25.4, 4.6, 0.8, null, cl); }
    // ---- the prism: a modernist take on the dome over the ceremonial entrance hall ----
    { const px = 3.0, pz = -27.0, s = 10.5, y0 = 20.4, y1 = 23.2, apex = 38.6;
      bx(cl, px - s - 0.8, px + s + 0.8, y0, y1, pz - s - 0.8, pz + s + 0.8);
      const C = [[px - s, pz - s], [px + s, pz - s], [px + s, pz + s], [px - s, pz + s]];
      for (let i = 0; i < 4; i++){ const a = C[i], b = C[(i+1) % 4]; T3(pr, [a[0], y1, a[1]], [b[0], y1, b[1]], [px, apex, pz]);
        segP(rib, [a[0], y1, a[1]], [px, apex, pz], 0.28, 4);
        for (let k = 1; k < 4; k++){ const f = k/4, m = [a[0] + (b[0] - a[0])*f, y1, a[1] + (b[1] - a[1])*f]; segP(rib, m, [px, apex, pz], 0.1, 3); }
        for (let k = 1; k < 4; k++){ const f = k/4, ya = y1 + (apex - y1)*f, pa = [a[0] + (px - a[0])*f, ya, a[1] + (pz - a[1])*f], pb = [b[0] + (px - b[0])*f, ya, b[1] + (pz - b[1])*f]; segP(rib, pa, pb, 0.1, 3); } }
      segP(rib, [px, apex, pz], [px, apex + 0.9, pz], 0.12, 4);
      // the entrance porch under the prism: tall pillars carrying a deep canopy over the drop-off
      const Fe = fc(20.1, -48.3, -6.0, -48.0); for (const u of [1.5, 8.5, 17.6, 24.6]) fbx(cl, Fe, u - 0.8, u + 0.8, Y0, 15.6, 0, 5.2);
      fbx(cl, Fe, 0.6, 25.5, 15.6, 17.2, -0.02, 5.6); fbx(gy, Fe, 0.6, 25.5, 17.2, 17.5, 0, 5.6);
      frect(lit, Fe, 10.0, 16.1, Y0, 6.4, 0.05);
    }
    // ---- the Public Block (link round the courtyard) and the pergola on the forecourt ----
    { const PBk = [[52.8,-13.7],[52.6,8.4],[30.5,8.1],[30.7,-14.0]]; LPoly(g, PBk, -5, 5.6, PL);
      bx(gy, 31.0, 52.4, Y0, 9.6, -13.6, 8.0); bx(rf, 31.0, 52.4, 9.6, 9.75, -13.6, 8.0);
      const F = rectF(31.0, 52.4, -13.6, 8.0); for (const s of ['l', 'r']){ fwins(dk, lit, F[s], 0.5, F[s].L - 0.5, 4.0, [[1.4, 3.0, 'r', 2.4], [5.6, 2.6, 'r', 2.4]], 0.05, rng, 0.3); fbx(cl, F[s], -0.2, F[s].L + 0.2, 8.8, 9.8, -0.02, 0.4); }
      bx(cl, 35.2, 53.8, 7.0, 7.7, -41.0, -36.2);
      for (let x = 35.6; x <= 53.5; x += 2.95) for (const z of [-40.5, -36.7]) bx(cl, x - 0.3, x + 0.3, Y0, 7.0, z - 0.3, z + 0.3);
    }
    // ---- Parliament Secretariat Office: the restored 1839 Court House Annexe ----
    { const x0 = -16.0, x1 = 59.2, z0 = 8.3, z1 = 34.2, H = 12.6, fh = (H - Y0)/2;
      LPoly(g, [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], -5, 5.6, PL);
      bx(cw, x0 + 2.4, x1 - 2.4, Y0, H, z0 + 2.4, z1 - 2.4); bx(cw, x0, x1, H - 0.02, H, z0, z1);
      const Fo = rectF(x0, x1, z0, z1), Fi = rectF(x0 + 2.4, x1 - 2.4, z0 + 2.4, z1 - 2.4);
      for (const s of ['f', 'r', 'b', 'l']){ const fo = Fo[s], fi = Fi[s], n = Math.max(1, Math.round(fo.L/3.8));
        fwins(dk, lit, fi, 0.4, fi.L - 0.4, fi.L/n, [[Y0 + 0.3, fh*0.68, 'a', 1.5], [Y0 + fh + 0.3, fh*0.68, 'r', 1.5]], 0.05, rng, 0.35);
        farcade(cw, fo, 0, fo.L, n, Y0, Y0 + fh*0.55, Y0 + fh, 0.75, -0.65, 0.05);
        fbx(ct, fo, 0, fo.L, Y0 + fh - 0.4, Y0 + fh, -2.4, 0.12);
        for (let i = 0; i <= n; i++) fcol(ct, ct, fo, i*fo.L/n, -0.35, Y0 + fh, H - 0.45, 0.22, 6);
        fbal(ct, fo, 0.25, fo.L - 0.25, Y0 + fh, 1.0, -0.35, 0.16);
        fbx(ct, fo, -0.05, fo.L + 0.05, H - 0.5, H, -2.4, 0.2); }
      hipR(cr, x0, x1, z0, z1, H, 4.2, 0.9, null, ct);
    }
    // ---- fountain pools and palms flanking the ceremonial driveway from North Bridge Road ----
    { const tt = B.p(TT), tl = B.p(TL);
      for (const [x0, x1] of [[-17, -4], [17, 30]]){ bx(cl, x0, x1, -1, Y0 + 0.45, -78, -60); bx(wt, x0 + 0.5, x1 - 0.5, Y0 + 0.45, Y0 + 0.5, -77.5, -60.5);
        for (let z = -74; z <= -64; z += 5) segP(wt, [(x0 + x1)/2, Y0 + 0.5, z], [(x0 + x1)/2, Y0 + 2.2, z], 0.12, 5, 0.03); }
      for (const x of [-1.5, 14.5]) for (const z of [-62, -70, -78]) palmP(tt, tl, x, z, 9.5, 1.0, rng); }
    // ---- the garden court between the blocks: lawn and shade trees ----
    { const tt = B.p(TT), tl = B.p(TL);
      lawnP(tl, [[-25, -10], [31, -10], [31, 8.4], [-16, 8.4], [-16, 34], [-24.5, 37.5]], 0.15);
      for (const [x, z, sc] of [[-8, -1, 0.75], [16, -1, 0.7], [-20.5, 18, 0.6]]) rainP(tt, tl, x, z, sc, rng); }
    B.flush(g); return g; }};

// =====================================================================================================================
// ===== Raffles City (1986, I. M. Pei): the shopping / convention podium with its glazed atrium, Swissotel The Stamford
// (226 m, 73 storeys, rounded on the Padang side), Raffles City Tower (42 storeys) and the Fairmont twin towers, all in
// the same light aluminium skin punched with a grid of small square windows; the towers stand at 45 deg to the podium.
// Local axes: +x = bearing 54.5 deg (NE, towards Bras Basah Road), +z = SE (Beach Road); Stamford Road at -x,
// North Bridge Road at -z.
LANDMARKS.rafflescity = {zh:'莱佛士城', en:'Raffles City', cat:'new', r:108, h:226,
  lt:{m:1, c:'#fff0d8', k:0.5},
  build(){
    const g = new THREE.Group(), B = mkB();
    const AL = {c:'#cdd0cd', m:0, lk:0.12}, ALD = {c:'#b9bcba', m:0, lk:0.1}, WIN = {c:'#3c4852', m:1, fh:3.1, cw:2.05}, WINO = {c:'#3c4852', m:1, fh:3.75, cw:2.05},
      SHP = {c:'#3a4650', glow:'#ffd9a8', gk:0.7, m:0, lk:0}, SKY = {c:'#a6bfc9', op:0.55, m:0, lk:0.4}, RF = {c:'#8e9295', m:0, lk:0.05},
      CRN = {c:'#33404a', glow:'#ffcf96', gk:0.55, m:0, lk:0}, RED = {c:'#b02020', glow:'#ff2a1a', gk:2.0, m:0, lk:0}, PL = {c:'#b8b5ad', m:0, lk:0.1},
      STL = {c:'#9aa1a6', m:0, lk:0.2};
    const al = B.p(AL), ald = B.p(ALD), wn = B.p(WIN), wno = B.p(WINO), shp = B.p(SHP), sky = B.p(SKY), rf = B.p(RF), crn = B.p(CRN), red = B.p(RED), stl = B.p(STL);
    const Y0 = 0.6, HP_ = 24.6;
    // punched-window skin on every edge of the plan P: dark glass set back rec behind the aluminium, piers between the bays and
    // spandrels between the floors (with their reveals, window heads and sills), so the grid reads as a deep relief; returns
    // the height reached (a whole number of floors)
    const facade = (P, y0, y1, fh, bw, ww, wh, sill, rec, gm) => {
      const nf = Math.floor((y1 - y0)/fh + 0.01), yt = y0 + nf*fh;
      for (const F of edgesOut(P)){
        if (F.L < ww + 0.4){ frect(al, F, 0, F.L, y0, yt, 0); continue; }
        const nb = Math.max(1, Math.round(F.L/bw)), w = F.L/nb, wi = Math.min(ww, w*0.82), hw = (w - wi)/2;
        frect(gm, F, 0, F.L, y0, yt, -rec);
        for (let i = 0; i <= nb; i++){ const ua = Math.max(0, i*w - hw), ub = Math.min(F.L, i*w + hw);
          frect(al, F, ua, ub, y0, yt, 0);
          if (i > 0) Q(ald, fp(F, ua, y0, -rec), fp(F, ua, y0, 0), fp(F, ua, yt, 0), fp(F, ua, yt, -rec));
          if (i < nb) Q(ald, fp(F, ub, y0, 0), fp(F, ub, y0, -rec), fp(F, ub, yt, -rec), fp(F, ub, yt, 0)); }
        for (let k = 0; k <= nf; k++){ const ya = k ? y0 + (k - 1)*fh + sill + wh : y0, yb = k < nf ? y0 + k*fh + sill : yt; if (yb - ya < 0.05) continue;
          frect(al, F, 0, F.L, ya, yb, 0);
          if (k) Q(ald, fp(F, 0, ya, -rec), fp(F, F.L, ya, -rec), fp(F, F.L, ya, 0), fp(F, 0, ya, 0));
          if (k < nf) Q(al, fp(F, 0, yb, 0), fp(F, F.L, yb, 0), fp(F, F.L, yb, -rec), fp(F, 0, yb, -rec)); }
      }
      return yt;
    };
    // ---- the podium ----
    const PD = [[72.5,69.6],[56.8,77.3],[42.1,78.9],[33.8,69.5],[-46.7,71.9],[-48.1,75.1],[-61.1,73.3],[-70.3,67.5],[-78.3,56.2],[-79.6,38.1],[-73.4,26.4],[-74.3,-56.6],[-71.1,-68.4],[-64.5,-75.4],[-57.5,-78.9],[58.0,-78.3],[67.9,-73.7],[76.1,-61.2],[77.5,-49.0],[75.6,43.3],[79.5,47.8],[78.4,60.4]];
    LPoly(g, PD, -5, 5.6, PL);
    const PDi = inset(PD, 2.2);
    wallsP(shp, PDi, Y0, 6.2);                                             // recessed glazed ground floor
    for (const F of edgesOut(PD)){ const n = Math.max(1, Math.round(F.L/7.2)); for (let k = 0; k <= n; k++){ const u = k*F.L/n; fbx(al, F, u - 0.55, u + 0.55, Y0, 6.2, -2.2, 0); } }
    { const yt = facade(PD, 7.1, HP_ - 1.2, 3.6, 2.4, 1.45, 1.45, 0.9, 0.32, wn); wallsP(al, PD, 6.2, 7.1); wallsP(al, PD, yt, HP_); }
    capT(rf, PD, HP_);
    bandP(ald, PD, 6.2, 0.9, 0.25); bandP(ald, PD, HP_ - 0.2, 0.9, 0.3);
    capT(al, PDi, 6.2);
    // glass entrance canopies on steel posts at three of the rounded street corners (Stamford Rd / North Bridge Rd, Stamford Rd /
    // Beach Rd at the hotel, Bras Basah Rd / Beach Rd)
    { const Po = inset(PD, -5.2), Pm = inset(PD, -4.9);
      for (const [i0, i1] of [[11, 14], [5, 8], [20, 22]]) for (let i = i0; i < i1; i++){ const j = (i + 1) % PD.length;
        Q(sky, [PD[i][0], 5.4, PD[i][1]], [PD[j][0], 5.4, PD[j][1]], [Po[j][0], 5.4, Po[j][1]], [Po[i][0], 5.4, Po[i][1]]);
        segP(stl, [Po[i][0], 5.35, Po[i][1]], [Po[j][0], 5.35, Po[j][1]], 0.16, 4);
        for (const q of [Pm[i], Pm[j]]) segP(stl, [q[0], -1, q[1]], [q[0], 5.35, q[1]], 0.14, 6); } }
    // central glazed atrium roof (stepped pyramid) between the towers
    { const ax = 2, az = 8, s = 17; bx(al, ax - s - 0.6, ax + s + 0.6, HP_, HP_ + 1.2, az - s - 0.6, az + s + 0.6);
      for (let k = 0; k < 3; k++){ const a = s - k*5, b = s - (k + 1)*5, y0 = HP_ + 1.2 + k*2.6, y1 = y0 + 2.6;
        Q(sky, [ax - a, y0, az + a], [ax + a, y0, az + a], [ax + b, y1, az + b], [ax - b, y1, az + b]); Q(sky, [ax + a, y0, az - a], [ax - a, y0, az - a], [ax - b, y1, az - b], [ax + b, y1, az - b]);
        Q(sky, [ax + a, y0, az + a], [ax + a, y0, az - a], [ax + b, y1, az - b], [ax + b, y1, az + b]); Q(sky, [ax - a, y0, az - a], [ax - a, y0, az + a], [ax - b, y1, az + b], [ax - b, y1, az - b]);
        for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) segP(stl, [ax + sx*a, y0, az + sz*a], [ax + sx*b, y1, az + sz*b], 0.15, 4); }
      Q(sky, [ax - 2, HP_ + 9, az + 2], [ax + 2, HP_ + 9, az + 2], [ax + 2, HP_ + 9, az - 2], [ax - 2, HP_ + 9, az - 2]); }
    // the hotels' recreation deck on the podium roof between the Stamford and the Fairmont: timber deck, pool, palms
    { const dk2 = B.p({c:'#9a7d5c', m:0, lk:0.2}), wt = B.p({c:'#4fa3b4', m:0, lk:0.3, glow:'#5fd0e0', gk:0.25}), gn = B.p({c:'#5f8a45', m:0, lk:0.1}), tr = B.p({c:'#6b5a45', m:0, lk:0.1});
      bx(dk2, -14, 18, HP_, HP_ + 0.3, 33, 68); bx(al, -8, 14, HP_ + 0.3, HP_ + 0.9, 42, 58); bx(wt, -7.4, 13.4, HP_ + 0.9, HP_ + 0.95, 42.6, 57.4);
      for (const [x, z] of [[-11, 36], [-11, 46], [-11, 56], [-11, 65], [16, 36], [16, 62], [3, 65]]){ bx(gn, x - 1.3, x + 1.3, HP_ + 0.3, HP_ + 1.0, z - 1.3, z + 1.3); palmP(tr, gn, x, z, HP_ + 7.5, 0.9, LMCTX.rng); } }
    // ---- the towers ----
    const tower = (P, top, fh, wmat, crown) => {
      const yt = facade(P, HP_ + 1.0, top - (crown ? crown + 1.2 : 2.0), fh, 2.05, 1.5, 1.5, 0.85, 0.3, wmat);
      wallsP(al, P, HP_, HP_ + 1.0); wallsP(al, P, yt, top); capT(rf, P, top);
      for (let y = HP_ + 1.0 + fh*10; y < yt - 3; y += fh*10) bandP(ald, P, y - 0.25, 0.3, 0.06);
      bandP(ald, P, top - 0.9, 0.9, 0.12);
    };
    // Swissotel The Stamford: square on the north / east sides, rounded on the Padang side
    const ST = [[-44.2,17.3],[-20.0,41.0],[-20.0,46.2],[-43.9,69.9],[-50.6,69.5],[-57.3,68.4],[-65.0,63.7],[-70.4,57.2],[-74.3,47.6],[-73.8,39.1],[-72.3,32.1],[-65.4,24.3],[-59.2,19.9],[-52.4,18.0]];
    tower(ST, 223.0, 3.0, wn, 10);
    wallsP(crn, inset(ST, -0.08), 210.6, 221.6);                            // the glazed restaurant floors at the top
    for (const F of edgesOut(ST)){ const n = Math.max(1, Math.round(F.L/3.2)); for (let k = 0; k <= n; k++) fbx(al, F, k*F.L/n - 0.18, k*F.L/n + 0.18, 210.6, 221.6, -0.02, 0.2); }
    for (const y of [214.2, 217.9]) bandP(ald, ST, y, 0.35, 0.15);
    { const STi = inset(ST, 7); wallsP(ald, STi, 223.0, 225.6); capT(rf, STi, 225.6);
      for (const p of [STi[1], STi[3], STi[8]]) { segP(red, [p[0], 225.6, p[1]], [p[0], 226.0, p[1]], 0.25, 6); } }
    // Raffles City Tower (offices)
    const OT = [[26.7,-48.7],[4.4,-26.9],[-0.8,-26.1],[-23.3,-48.3],[-24.1,-53.6],[-0.8,-76.0],[3.2,-76.7],[26.2,-53.5]];
    tower(OT, 155.5, 3.75, wno, 0);
    { const OTi = inset(OT, 5); wallsP(ald, OTi, 155.5, 158.0); capT(rf, OTi, 158.0); segP(red, [OTi[0][0], 158, OTi[0][1]], [OTi[0][0], 158.4, OTi[0][1]], 0.25, 6); }
    // Fairmont Singapore twin towers
    const F1 = [[46.1,20.3],[22.8,-1.1],[22.4,-6.8],[45.2,-28.9],[49.2,-29.6],[72.3,-6.3],[73.2,-2.0],[50.0,19.7]];
    const F2 = [[46.1,23.3],[50.3,23.2],[72.6,45.3],[72.1,51.6],[69.7,61.5],[65.9,66.4],[60.9,70.7],[51.9,73.4],[43.5,72.8],[35.0,70.1],[28.7,64.3],[24.8,54.7],[23.7,45.1]];
    for (const P of [F1, F2]){ tower(P, 86.2, 3.1, wn, 0); const Pi = inset(P, 5); wallsP(ald, Pi, 86.2, 88.0); capT(rf, Pi, 88.0); }
    B.flush(g); return g; }};

SG_PLACES.push(
  {type:'raffleshotel', lat:1.295263, lon:103.854371, rot:0.9861},
  {type:'natgallery',   lat:1.290300, lon:103.851500, rot:1.0524},
  {type:'victoria',     lat:1.288346, lon:103.851583, rot:0.9599},
  {type:'standrews',    lat:1.292377, lon:103.852276, rot:1.0734},
  {type:'parliament',   lat:1.288946, lon:103.850575, rot:0.9512},
  {type:'rafflescity',  lat:1.293893, lon:103.853349, rot:0.9512}
);
}
