// ===== lm20/w1: Capitol Singapore, Raffles City, The Arts House, Parliament House, Cavenagh Bridge, Anderson Bridge.
// Block-scoped: only LANDMARKS and SG_PLACES are touched. Real dimensions in metres; y = 0 is the ground (the app puts it
// 0.6 m above the highest ground within r); every plan was traced from the real OSM footprint in the model's local axes
// (see SG_PLACES at the end for each origin and turn: rot = bearing of local +x, counter-clockwise from east).
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
// n-sided prism round a segment (columns, rails, members, chains)
const segP = function(o, a, b, r, n, r1){
  n = n || 6; const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2], L = Math.hypot(dx, dy, dz); if (L < 1e-4) return;
  const d = [dx/L, dy/L, dz/L], up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let ux = d[1]*up[2]-d[2]*up[1], uy = d[2]*up[0]-d[0]*up[2], uz = d[0]*up[1]-d[1]*up[0]; const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
  const vx = d[1]*uz-d[2]*uy, vy = d[2]*ux-d[0]*uz, vz = d[0]*uy-d[1]*ux;
  const ring = (p, rr) => { const R = []; for (let i = 0; i < n; i++){ const t = (i + 0.5)/n*TAU, c = Math.cos(t)*rr, s = Math.sin(t)*rr; R.push([p[0]+ux*c+vx*s, p[1]+uy*c+vy*s, p[2]+uz*c+vz*s]); } return R; };
  const A = ring(a, r), B = ring(b, r1 === undefined ? r : r1);
  for (let i = 0; i < n; i++){ const j = (i+1) % n; Q(o, A[i], A[j], B[j], B[i]); }
};
// flat bar between two points: width w across (horizontal, perpendicular to the bar), thickness th vertical-ish
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
// plan polygon ([x, z]) walls between y0 and y1; caps: fan (convex) or triangulated (any simple polygon)
const wallsP = (o, P, y0, y1) => { for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; Q(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); } };
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
const fc = function(ax, az, bx_, bz){ const L = Math.hypot(bx_ - ax, bz - az), tx = (bx_ - ax)/L, tz = (bz - az)/L; return {ax, az, tx, tz, nx:-tz, nz:tx, L}; };
const rectF = (x0, x1, z0, z1) => ({f:fc(x0, z1, x1, z1), r:fc(x1, z1, x1, z0), b:fc(x1, z0, x0, z0), l:fc(x0, z0, x0, z1)});
// outward faces of every edge of a plan polygon
const edgesOut = P => { const s = areaS(P); return P.map((a, i) => { const b = P[(i+1) % P.length]; return s > 0 ? fc(b[0], b[1], a[0], a[1]) : fc(a[0], a[1], b[0], b[1]); }); };
const fp = (F, u, y, d) => [F.ax + F.tx*u + F.nx*d, y, F.az + F.tz*u + F.nz*d];
const fbx = function(o, F, u0, u1, y0, y1, d0, d1){
  const P = [fp(F,u0,y0,d0), fp(F,u1,y0,d0), fp(F,u1,y0,d1), fp(F,u0,y0,d1), fp(F,u0,y1,d0), fp(F,u1,y1,d0), fp(F,u1,y1,d1), fp(F,u0,y1,d1)];
  Q(o, P[4], P[7], P[6], P[5]); Q(o, P[0], P[4], P[5], P[1]); Q(o, P[1], P[5], P[6], P[2]); Q(o, P[2], P[6], P[7], P[3]); Q(o, P[3], P[7], P[4], P[0]); Q(o, P[0], P[1], P[2], P[3]);
};
const frect = (o, F, u0, u1, y0, y1, d) => Q(o, fp(F,u0,y0,d), fp(F,u1,y0,d), fp(F,u1,y1,d), fp(F,u0,y1,d));
const farch = function(o, F, uc, y0, w, ys, d, n){
  n = n || 6; const r = w/2; frect(o, F, uc - r, uc + r, y0, ys, d);
  for (let i = 0; i < n; i++){ const a = PI*i/n, b = PI*(i+1)/n; T3(o, fp(F, uc, ys, d), fp(F, uc + Math.cos(a)*r, ys + Math.sin(a)*r, d), fp(F, uc + Math.cos(b)*r, ys + Math.sin(b)*r, d)); }
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
};
// round column at (u, d) on the face, with square base and capital blocks
const fcol = function(o, oc, F, u, d, y0, y1, r, n){
  const c = fp(F, u, 0, d); segP(o, [c[0], y0 + r*0.9, c[2]], [c[0], y1 - r*1.1, c[2]], r, n || 8, r*0.88);
  fbx(oc, F, u - r*1.25, u + r*1.25, y0, y0 + r*0.9, d - r*1.25, d + r*1.25);
  fbx(oc, F, u - r*1.35, u + r*1.35, y1 - r*1.1, y1, d - r*1.35, d + r*1.35);
};
// balustrade along the face between u0 and u1 at depth d
const fbal = function(o, F, u0, u1, y, h, d, w){
  w = w || 0.3; fbx(o, F, u0, u1, y, y + h*0.18, d - w/2, d + w/2); fbx(o, F, u0, u1, y + h*0.82, y + h, d - w*0.6, d + w*0.6);
  const n = Math.max(1, Math.round((u1 - u0)/0.5)); for (let i = 0; i < n; i++){ const u = u0 + (i + 0.5)*(u1 - u0)/n; fbx(o, F, u - 0.08, u + 0.08, y + h*0.18, y + h*0.82, d - 0.08, d + 0.08); }
};
// hipped roof on the rectangle x0..x1, z0..z1 at eaves height y, rise h, overhang ov
const hipR = function(o, x0, x1, z0, z1, y, h, ov, oc, of){
  ov = ov || 0; x0 -= ov; x1 += ov; z0 -= ov; z1 += ov; const L = x1 - x0, W = z1 - z0, cx = (x0 + x1)/2, cz = (z0 + z1)/2;
  const ye = y - ov*h/Math.max(1, Math.min(L, W)/2 - ov);
  let a, b;
  if (L >= W){ const k = (L - W)/2; a = [cx - k, y + h, cz]; b = [cx + k, y + h, cz];
    Q(o, [x0, ye, z1], [x1, ye, z1], b, a); Q(o, [x1, ye, z0], [x0, ye, z0], a, b); T3(o, [x0, ye, z0], [x0, ye, z1], a); T3(o, [x1, ye, z1], [x1, ye, z0], b); }
  else { const k = (W - L)/2; a = [cx, y + h, cz - k]; b = [cx, y + h, cz + k];
    Q(o, [x1, ye, z1], [x1, ye, z0], a, b); Q(o, [x0, ye, z0], [x0, ye, z1], b, a); T3(o, [x0, ye, z1], [x1, ye, z1], b); T3(o, [x1, ye, z0], [x0, ye, z0], a); }
  if (oc){ const r = 0.13, lift = p => [p[0], p[1] + 0.08, p[2]];
    segP(oc, lift(a), lift(b), r, 4);
    if (L >= W){ for (const [c, e] of [[[x0, ye, z0], a], [[x0, ye, z1], a], [[x1, ye, z0], b], [[x1, ye, z1], b]]) segP(oc, lift(c), lift(e), r, 4); }
    else { for (const [c, e] of [[[x0, ye, z0], a], [[x1, ye, z0], a], [[x0, ye, z1], b], [[x1, ye, z1], b]]) segP(oc, lift(c), lift(e), r, 4); }
  }
  if (of) for (const [p, q] of [[[x0, ye, z0], [x1, ye, z0]], [[x1, ye, z0], [x1, ye, z1]], [[x1, ye, z1], [x0, ye, z1]], [[x0, ye, z1], [x0, ye, z0]]]) Q(of, p, q, [q[0], q[1] - 0.32, q[2]], [p[0], p[1] - 0.32, p[2]]);
};
// gabled roof, ridge along x (ax = 'x') or z; gable-end triangles go to ow (the wall batch); ov = eaves overhang
const gabR = function(o, ow, x0, x1, z0, z1, y, h, ax, ov){
  ov = ov || 0;
  if (ax === 'x'){ const cz = (z0 + z1)/2; Q(o, [x0, y, z1 + ov], [x1, y, z1 + ov], [x1, y + h, cz], [x0, y + h, cz]); Q(o, [x1, y, z0 - ov], [x0, y, z0 - ov], [x0, y + h, cz], [x1, y + h, cz]);
    if (ow){ T3(ow, [x0, y, z0], [x0, y, z1], [x0, y + h, cz]); T3(ow, [x1, y, z1], [x1, y, z0], [x1, y + h, cz]); } }
  else { const cx = (x0 + x1)/2; Q(o, [x1 + ov, y, z1], [x1 + ov, y, z0], [cx, y + h, z0], [cx, y + h, z1]); Q(o, [x0 - ov, y, z0], [x0 - ov, y, z1], [cx, y + h, z1], [cx, y + h, z0]);
    if (ow){ T3(ow, [x0, y, z1], [x1, y, z1], [cx, y + h, z1]); T3(ow, [x1, y, z0], [x0, y, z0], [cx, y + h, z0]); } }
};
// pyramid / hipped roof over any convex plan polygon (apex over its centroid), eaves overhang ov
const pyrR = function(o, P, y, h, ov){ let cx = 0, cz = 0; for (const p of P){ cx += p[0]/P.length; cz += p[1]/P.length; }
  const E = P.map(p => { const dx = p[0] - cx, dz = p[1] - cz, l = Math.hypot(dx, dz) || 1; return [p[0] + dx/l*(ov || 0), p[1] + dz/l*(ov || 0)]; });
  for (let i = 0; i < E.length; i++){ const a = E[i], b = E[(i+1) % E.length]; T3(o, [a[0], y, a[1]], [b[0], y, b[1]], [cx, y + h, cz]); } };
// triangular pediment on a face: base u0..u1 at y, apex height h, depth d0..d1, raking cornice into oc
const fped = function(o, oc, F, u0, u1, y, h, d0, d1){
  const um = (u0 + u1)/2;
  for (const d of [d0, d1]) T3(o, fp(F, u0, y, d), fp(F, u1, y, d), fp(F, um, y + h, d));
  Q(o, fp(F, u0, y, d0), fp(F, um, y + h, d0), fp(F, um, y + h, d1), fp(F, u0, y, d1)); Q(o, fp(F, um, y + h, d0), fp(F, u1, y, d0), fp(F, u1, y, d1), fp(F, um, y + h, d1));
  if (oc){ const e = 0.35; Q(oc, fp(F, u0 - e, y, d1 + 0.25), fp(F, um, y + h + 0.45, d1 + 0.25), fp(F, um, y + h + 0.45, d0), fp(F, u0 - e, y, d0)); Q(oc, fp(F, um, y + h + 0.45, d1 + 0.25), fp(F, u1 + e, y, d1 + 0.25), fp(F, u1 + e, y, d0), fp(F, um, y + h + 0.45, d0)); }
};
// segmental (curved) pediment: base u0..u1 at y, rise h, depth d0..d1
const fsegped = function(o, oc, F, u0, u1, y, h, d0, d1, n){
  n = n || 10; const um = (u0 + u1)/2, hw = (u1 - u0)/2, R = (hw*hw + h*h)/(2*h), yc = y + h - R;
  const pt = i => { const a = Math.asin(hw/R)*(1 - 2*i/n); return [um - Math.sin(a)*R, yc + Math.cos(a)*R]; };
  for (let i = 0; i < n; i++){ const p = pt(i), q = pt(i + 1);
    for (const d of [d0, d1]) T3(o, fp(F, um, y, d), fp(F, p[0], p[1], d), fp(F, q[0], q[1], d));
    Q(o, fp(F, p[0], p[1], d0), fp(F, q[0], q[1], d0), fp(F, q[0], q[1], d1), fp(F, p[0], p[1], d1));
    if (oc) Q(oc, fp(F, p[0], p[1] + 0.45, d1 + 0.25), fp(F, q[0], q[1] + 0.45, d1 + 0.25), fp(F, q[0], q[1] + 0.45, d0), fp(F, p[0], p[1] + 0.45, d0)); }
};
// regular window grid on a face: bays of width bw from u0..u1, each floor [y0, height, kind ('r' rect, 'a' arch), width]
const fwins = function(oD, oL, F, u0, u1, bw, floors, d, rng, pLit){
  const n = Math.max(1, Math.round((u1 - u0)/bw)), w = (u1 - u0)/n;
  for (let i = 0; i < n; i++){ const uc = u0 + (i + 0.5)*w;
    for (const [y0, h, kind, ww] of floors){ const o = rng && rng() < (pLit || 0) ? oL : oD, wi = ww || w*0.45;
      if (kind === 'a') farch(o, F, uc, y0, wi, y0 + h - wi/2, d); else frect(o, F, uc - wi/2, uc + wi/2, y0, y0 + h, d); } }
  return n;
};
const fpil = function(o, F, u0, u1, n, y0, y1, w, p){ for (let i = 0; i <= n; i++){ const u = u0 + i*(u1 - u0)/n; fbx(o, F, u - w/2, u + w/2, y0, y1, -0.02, p); } };
// window grid on every edge of a plan polygon (curtain-wall / punched-window towers): floors fh from y0 to y1
const gridWins = function(o, P, y0, y1, fh, bw, ww, wh, sill, d){
  const nf = Math.floor((y1 - y0)/fh + 0.01);
  for (const F of edgesOut(P)){ if (F.L < ww + 0.4) continue; const nb = Math.max(1, Math.round(F.L/bw)), w = F.L/nb, wi = Math.min(ww, w*0.82);
    for (let i = 0; i < nb; i++){ const uc = (i + 0.5)*w; for (let k = 0; k < nf; k++){ const y = y0 + k*fh + sill; frect(o, F, uc - wi/2, uc + wi/2, y, y + wh, d); } } }
};
// horizontal band round a plan polygon (cornices, spandrel lines): projecting p, from y to y + h
const bandP = (o, P, y, h, p) => { const E = inset(P, -p); wallsP(o, E, y, y + h); capT(o, E, y + h); };
// simple tree (trunk + crown), batched
const treeP = function(oT, oC, x, z, s, rng){
  segP(oT, [x, -2, z], [x, 3.2*s, z], 0.28*s, 5, 0.2*s);
  const R = 3.0*s, y = 4.6*s; latheP(oC, [[0.01, y - 1.6*s], [R*0.85, y - 0.9*s], [R, y + 0.2*s], [R*0.7, y + 1.4*s], [0.01, y + 2.0*s]], x + (rng() - 0.5)*s, z + (rng() - 0.5)*s, 7, rng()*3);
};
const palmP = function(oT, oL, x, z, h, s, rng){
  segP(oT, [x, -2, z], [x + (rng() - 0.5)*0.6, h, z + (rng() - 0.5)*0.6], 0.22*s, 5, 0.16*s);
  const n = 9, a0 = rng()*TAU;
  for (let i = 0; i < n; i++){ const a = a0 + i/n*TAU, L = 3.6*s, ca = Math.cos(a), sa = Math.sin(a), tip = [x + ca*L, h - 1.2*s, z + sa*L], mid = [x + ca*L*0.5, h + 0.5*s, z + sa*L*0.5];
    const px = -sa*0.45*s, pz = ca*0.45*s;
    T3(oL, [x, h, z], [mid[0] + px, mid[1], mid[2] + pz], [mid[0] - px, mid[1], mid[2] - pz]); T3(oL, [mid[0] + px, mid[1], mid[2] + pz], tip, [mid[0] - px, mid[1], mid[2] - pz]); }
};
// a vertical slab whose side outline [[u, y], ...] (u along dir) is extruded th across: fins, blades, gussets
const slabP = function(o, x0, z0, dx, dz, outline, th){
  const l = Math.hypot(dx, dz), ux = dx/l, uz = dz/l, px = -uz*th/2, pz = ux*th/2;
  const P = (q, s) => [x0 + ux*q[0] + px*s, q[1], z0 + uz*q[0] + pz*s];
  const tri = THREE.ShapeUtils.triangulateShape(outline.map(q => new THREE.Vector2(q[0], q[1])), []);
  for (const t of tri) for (const s of [-1, 1]) T3(o, P(outline[t[0]], s), P(outline[t[1]], s), P(outline[t[2]], s));
  for (let i = 0; i < outline.length; i++){ const a = outline[i], b = outline[(i+1) % outline.length]; Q(o, P(a, -1), P(b, -1), P(b, 1), P(a, 1)); }
};

// =====================================================================================================================
// ===== Capitol Singapore: the Capitol Building (1929-33, Keys & Dowdeswell; neoclassical, four storeys, an L along
// Stamford Road and North Bridge Road whose concave corner faces the junction, with a convex columned portico, the
// cantilevered curved canopy and the Art Deco blade that once carried the theatre sign), the Capitol Theatre behind it
// (1929, vault with the circular zodiac dome), Stamford House (1904, Swan & Maclaren, Venetian Renaissance: arcaded
// five-foot way, Venetian windows, curved centre pediment, triangular end pediments, balustrade, convex corner on Hill
// Street) and the 2015 glass-roofed galleria between them (Capitol Kempinski / Capitol Piazza redevelopment).
// The newer Capitol Piazza / Eden Residences block south of the theatre is NOT part of this model.
// Local axes: +x = bearing 146 deg (NW along Stamford Road), +z = towards Stamford Road (NE). The junction with North
// Bridge Road is at -x; Stamford House (Hill Street corner) at +x.
LANDMARKS.capitol = {zh:'首都大厦', en:'Capitol Singapore', cat:'old', r:90, h:36,
  lt:{m:0, c:'#ffdcae', k:1.0, e:0.5, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
    const W = '#ebe4d4', T = '#f7f3e9', D = '#2b3035', L = {c:'#3b352c', glow:'#ffd08f', gk:0.55}, RF = {c:'#7b7e80', lk:0.25},
      SHP = {c:'#3a434a', glow:'#ffd49a', gk:0.45}, GLS = {c:'#b8ced6', op:0.42, lk:0.3}, STL = '#8f979b', PL = '#c6bfb0',
      GD = {c:'#c7a25e', lk:1.1}, DM = {c:'#8f948f', lk:0.55}, FIN = {c:'#f3eee1', lk:1.25};
    const w = B.p(W), t = B.p(T), dk = B.p(D), lit = B.p(L), rf = B.p(RF), shp = B.p(SHP), gls = B.p(GLS), stl = B.p(STL),
      gd = B.p(GD), dm = B.p(DM), fin = B.p(FIN);
    const Y0 = 0.6, win = () => rng() < 0.32 ? lit : dk;
    // ---------------- the Capitol Building ----------------
    const E1 = [-63.5, 32.7], MID = [-69.1, 22.2], E2 = [-77.5, 17.2], [acx, acz, AR] = circ3(E1, MID, E2);
    const a1 = Math.atan2(E1[1] - acz, E1[0] - acx), a2 = Math.atan2(E2[1] - acz, E2[0] - acx), NA = 10;
    const ARC = [], ARCI = [];
    for (let i = 0; i <= NA; i++){ const a = a1 + (a2 - a1)*i/NA; ARC.push([acx + Math.cos(a)*AR, acz + Math.sin(a)*AR]); ARCI.push([acx + Math.cos(a)*(AR + 9), acz + Math.sin(a)*(AR + 9)]); }
    const CB = ARC.concat([[-80.8,-22.8],[-66.1,-23.4],[-63.9,4.4],[-52.8,15.5],[13.6,15.8],[15.8,32.9]]);
    LPoly(g, CB, -5, 5.6, PL);
    const HB = 22.2;
    wallsP(w, CB, Y0, HB); capT(rf, CB, HB);
    // corner block over the concave front: rises to 26.4 with a stepped attic
    const CK = ARC.concat(ARCI.slice().reverse());
    wallsP(w, CK, HB, 26.4); capT(rf, CK, 26.4); bandP(t, CK, 26.4, 0.5, 0.35);
    const FCB = edgesOut(CB);
    FCB.forEach((F, i) => {
      if (i < NA){
        // the concave corner: glazed entrance below, tall windows above (giant columns at the arc vertices: below)
        frect(shp, F, 0.3, F.L - 0.3, Y0 + 0.1, 6.0, 0.04);
        for (const y of [7.4, 11.6, 15.8]) frect(win(), F, 0.55, F.L - 0.55, y, y + 2.9, 0.05);
        frect(win(), F, 0.7, F.L - 0.7, 22.6, 25.0, 0.05);
        fbx(t, F, -0.05, F.L + 0.05, 20.8, 22.2, -0.02, 1.05);
        fbx(t, F, -0.05, F.L + 0.05, 6.0, 6.5, -0.02, 0.7);
        return;
      }
      const L0 = F.L, front = i === CB.length - 1 || i === NA, inner = i >= NA + 2 && i <= NA + 4;
      const bay = front ? 4.4 : 4.8, n = Math.max(1, Math.round(L0/bay)), bw = L0/n;
      for (let k = 0; k < n; k++){ const u0 = k*bw, uc = u0 + bw/2;
        if (inner) frect(shp, F, u0 + 0.6, u0 + bw - 0.6, Y0 + 0.1, 5.6, 0.04);
        else { frect(shp, F, u0 + 0.55, u0 + bw - 0.55, Y0 + 0.2, 5.0, 0.04); fbx(t, F, u0 + 0.4, u0 + bw - 0.4, 5.0, 5.35, -0.02, 0.12); }
        for (const y of [7.4, 11.6, 15.8]){ frect(win(), F, uc - 0.8, uc + 0.8, y, y + 2.6, 0.05); fbx(t, F, uc - 1.0, uc + 1.0, y - 0.28, y, -0.02, 0.16); }
        if (front){ fbx(t, F, uc - 1.0, uc + 1.0, 10.15, 10.55, -0.02, 0.25); frect(win(), F, uc - 0.7, uc + 0.7, 20.9, 21.8, 0.05); }
      }
      for (let k = 0; k <= n; k++){ const u = k*bw;
        fbx(t, F, u - 0.42, u + 0.42, Y0, 6.4, -0.02, 0.32);
        if (front && k > 0 && k < n) fcol(t, t, F, u, 0.5, 6.4, 18.8, 0.42, 8); else fbx(t, F, u - 0.45, u + 0.45, 6.4, 18.8, -0.02, 0.3); }
      fbx(t, F, -0.3, L0 + 0.3, 6.0, 6.6, -0.02, 0.55);
      fbx(t, F, -0.3, L0 + 0.3, 18.8, 20.4, -0.02, 0.8);
      fbx(t, F, -0.3, L0 + 0.3, HB - 0.4, HB + 0.15, -0.02, 0.45);
      if (front) fbal(t, F, 0.4, L0 - 0.4, HB + 0.15, 1.0, 0.1, 0.25);
    });
    for (const p of ARC){ const ux = (acx - p[0])/AR, uz = (acz - p[1])/AR, x = p[0] + ux*0.75, z = p[1] + uz*0.75;
      segP(t, [x, 7.0, z], [x, 20.1, z], 0.6, 10, 0.53); bx(t, x - 0.75, x + 0.75, 6.4, 7.0, z - 0.75, z + 0.75); bx(t, x - 0.8, x + 0.8, 20.1, 20.8, z - 0.8, z + 0.8); }
    // the convex portico in front of the concave corner: a semicircle of giant columns, curved entablature and terrace,
    // the cantilevered curved canopy over the entrance, and the soaring blade
    { const pc = [-71.7, 25.4], R = 6.4, dir = Math.atan2(acz - pc[1], acx - pc[0]);
      for (let k = 0; k <= 6; k++){ const a = dir - HP + k*PI/6, x = pc[0] + Math.cos(a)*R, z = pc[1] + Math.sin(a)*R;
        segP(t, [x, Y0 + 0.9, z], [x, 9.2, z], 0.42, 10, 0.37); bx(t, x - 0.55, x + 0.55, Y0, Y0 + 0.9, z - 0.55, z + 0.55); bx(t, x - 0.58, x + 0.58, 9.2, 9.8, z - 0.58, z + 0.58); }
      latheP(t, [[0.01, 9.8], [R + 0.9, 9.8], [R + 0.9, 11.1], [0.01, 11.1]], pc[0], pc[1], 24, dir - HP - 0.25, dir + HP + 0.25);
      for (let k = 0; k < 12; k++){ const a0 = dir - HP + k*PI/12, a1_ = a0 + PI/12, Fq = fc(pc[0] + Math.cos(a0)*(R + 0.6), pc[1] + Math.sin(a0)*(R + 0.6), pc[0] + Math.cos(a1_)*(R + 0.6), pc[1] + Math.sin(a1_)*(R + 0.6));
        fbal(t, Fq, 0, Fq.L, 11.1, 1.0, 0, 0.22); }
      latheP(t, [[0.01, 4.6], [R - 0.5, 4.6], [R - 0.5, 5.1], [0.01, 5.1]], pc[0], pc[1], 18, dir - HP, dir + HP);
      latheP(shp, [[R - 3.2, Y0 + 0.1], [R - 3.2, 4.6]], pc[0], pc[1], 12, dir - HP*0.8, dir + HP*0.8);
      // the blade: stepped Art Deco fin rising from the terrace against the corner, pointing at the junction
      const bxp = MID[0] + (acx - MID[0])/AR*0.2, bzp = MID[1] + (acz - MID[1])/AR*0.2;
      slabP(fin, bxp, bzp, acx - MID[0], acz - MID[1], [[0, 11.1], [5.2, 11.1], [5.2, 15.8], [4.6, 16.4], [4.6, 21.8], [3.9, 22.5], [3.9, 27.6], [3.0, 28.6], [2.1, 32.0], [1.2, 34.6], [0.5, 35.4], [0, 35.4]], 1.1);
      slabP(t, bxp, bzp, acx - MID[0], acz - MID[1], [[0, 11.1], [3.4, 11.1], [3.4, 31.0], [0, 31.0]], 1.8);
      for (const yb of [16.1, 22.2, 28.1]) slabP(t, bxp, bzp, acx - MID[0], acz - MID[1], [[0, yb - 0.3], [5.4 - (yb - 16.1)*0.1, yb - 0.3], [5.4 - (yb - 16.1)*0.1, yb + 0.3], [0, yb + 0.3]], 1.5);
    }
    // ---------------- the Capitol Theatre (rotated 4.4 deg to its own footprint) ----------------
    { const h = new THREE.Group(), TB = mkB(); h.position.set(-15.2, 0, -18.9); h.rotation.y = 0.0768; g.add(h);
      const tw = TB.p(W), tt = TB.p(T), tdk = TB.p(D), tlit = TB.p(L), trf = TB.p(RF), tdm = TB.p(DM), tgd = TB.p(GD);
      const x0 = -28.6, x1 = 28.6, z0 = -12.3, z1 = 12.3, H = 23.0;
      const TP = [[x0, z0], [x1, z0], [x1, z1], [x0 + 6.4, z1], [x0, z1 - 6.4]];
      wallsP(tw, TP, Y0, H); capT(trf, TP, H);
      for (const F of edgesOut(TP)){ if (F.L < 6) continue; const n = Math.max(1, Math.round(F.L/5.2));
        fpil(tt, F, 0.3, F.L - 0.3, n, Y0, H - 1.6, 0.8, 0.35);
        fwins(tdk, tlit, F, 0.3, F.L - 0.3, F.L/n, [[2.0, 4.0, 'a', 1.8], [9.0, 7.5, 'a', 2.2], [18.0, 2.2, 'r', 1.6]], 0.05, rng, 0.25);
        fbx(tt, F, -0.3, F.L + 0.3, H - 1.6, H - 0.2, -0.02, 0.6); fbx(tt, F, -0.2, F.L + 0.2, 7.6, 8.1, -0.02, 0.3); fbx(tgd, F, 0, F.L, H - 1.35, H - 1.0, 0.6, 0.62); }
      // barrel vault over the auditorium and the circular dome in its middle
      { const n = 14; for (let i = 0; i < n; i++){ const a = PI*i/n, b = PI*(i+1)/n, za = -Math.cos(a)*9.5, zb = -Math.cos(b)*9.5, ya = H + Math.sin(a)*3.0, yb = H + Math.sin(b)*3.0;
          Q(trf, [-22, ya, za], [17, ya, za], [17, yb, zb], [-22, yb, zb]); }
        for (const xe of [-22, 17]) for (let i = 0; i < n; i++){ const a = PI*i/n, b = PI*(i+1)/n; T3(tw, [xe, H, 0], [xe, H + Math.sin(a)*3.0, -Math.cos(a)*9.5], [xe, H + Math.sin(b)*3.0, -Math.cos(b)*9.5]); } }
      latheP(tw, [[8.6, H + 1.5], [8.6, H + 3.6], [9.0, H + 3.6], [9.0, H + 4.2]], -3, 0, 28);
      latheP(tdm, [[9.0, H + 4.2], [8.4, H + 5.6], [7.0, H + 6.9], [5.0, H + 7.9], [2.6, H + 8.5], [0.01, H + 8.7]], -3, 0, 28);
      latheP(tt, [[0.9, H + 8.6], [0.9, H + 9.4], [0.01, H + 10.2]], -3, 0, 10);
      TB.flush(h); }
    // ---------------- the galleria: ultra-light glass roof on a cable truss between the old buildings ----------------
    { const GP = [[13.6,15.8],[-52.8,15.5],[-63.9,4.4],[-66.1,-23.4],[-43.6,-28.6],[-42.2,-11.7],[-36.4,-4.9],[13.7,-8.6]], yg = 16.2;
      capT(gls, inset(GP, 0.4), yg);
      LPoly(g, GP, -5, 5.6, PL);
      for (let x = -48; x <= 12; x += 6) segP(stl, [x, yg - 0.15, 15.2], [x, yg - 0.15, -6.0 + (x + 48)*0.0], 0.12, 4);
      for (let z = -24; z <= 2; z += 6) segP(stl, [-64.5, yg - 0.15, z], [-43.6, yg - 0.15, z], 0.12, 4);
      for (const [x, z] of [[-30, 5], [-10, 5], [5, 5], [-55, -12], [-55, 3]]) segP(stl, [x, Y0, z], [x, yg, z], 0.16, 6);
      for (let x = -46; x <= 10; x += 6){ segP(stl, [x, yg - 0.2, 15.2], [x, yg - 1.6, 5.0], 0.04, 3); segP(stl, [x, yg - 1.6, 5.0], [x, yg - 0.2, -6.0], 0.04, 3); }
    }
    // ---------------- Stamford House ----------------
    { const SH = [[77.8,29.7],[22.4,32.0],[20.8,-5.6],[49.5,-7.0],[49.4,-4.9],[79.4,-6.4],[80.9,26.9]], H = 15.6;
      LPoly(g, SH, -5, 5.6, PL);
      // the street fronts stand on an arcaded five-foot way: the ground-floor wall is set back 2.6 m behind the arcade
      const SHg = insetE(SH, [2.6, 0, 0, 0, 0, 2.6, 2.6]);
      wallsP(w, SHg, Y0, 5.6); ringP(w, SH, SHg, 5.6); wallsP(w, SH, 5.6, H + 0.8); capT(rf, inset(SH, 0.3), H + 0.6);
      const FS = edgesOut(SH), FSg = edgesOut(SHg);
      FS.forEach((F, i) => {
        const L0 = F.L; if (L0 < 2.5) return;
        const street = i === 0 || i === 5 || i === 6, n = Math.max(1, Math.round(L0/(street ? 4.1 : 4.6))), bw = L0/n;
        if (street){
          // arcade with keystone arches; timber shopfronts behind
          farcade(w, F, 0, L0, n, Y0, 3.5, 5.6, 0.9, -0.55, 0.15, 6);
          for (let k = 0; k < n; k++) fbx(t, F, (k + 0.5)*bw - 0.25, (k + 0.5)*bw + 0.25, 4.6, 5.3, 0.1, 0.25);
          const Fg = FSg[i]; if (Fg.L > 1) frect(shp, Fg, 0.3, Fg.L - 0.3, Y0, 4.8, 0.04);
        } else fwins(dk, lit, F, 0.4, L0 - 0.4, bw, [[1.6, 3.0, 'a', 1.6]], 0.05, rng, 0.2);
        fbx(t, F, -0.2, L0 + 0.2, 5.6, 6.2, -0.02, 0.4);
        for (let k = 0; k < n; k++){ const uc = (k + 0.5)*bw;
          // Venetian windows on the second storey, hooded windows on the third
          if (street){ farch(win(), F, uc, 6.8, 1.3, 9.2, 0.05, 6); frect(win(), F, uc - 1.55, uc - 0.85, 6.8, 9.0, 0.05); frect(win(), F, uc + 0.85, uc + 1.55, 6.8, 9.0, 0.05);
            fbx(t, F, uc - 1.75, uc + 1.75, 6.6, 6.85, -0.02, 0.3); fbx(t, F, uc - 0.7, uc - 0.6, 6.8, 9.2, -0.02, 0.12); fbx(t, F, uc + 0.6, uc + 0.7, 6.8, 9.2, -0.02, 0.12); }
          else frect(win(), F, uc - 0.75, uc + 0.75, 6.8, 9.6, 0.05);
          frect(win(), F, uc - 0.75, uc + 0.75, 11.2, 13.6, 0.05); fbx(t, F, uc - 1.0, uc + 1.0, 13.7, 14.0, -0.02, 0.35);
          if (street) fbx(t, F, uc - 0.95, uc + 0.95, 10.95, 11.2, -0.02, 0.25);
        }
        if (street) fpil(t, F, 0, L0, n, 6.2, H - 0.6, 0.55, 0.22);
        fbx(t, F, -0.2, L0 + 0.2, 10.4, 10.9, -0.02, 0.35);
        fbx(t, F, -0.35, L0 + 0.35, H - 0.6, H + 0.6, -0.02, 0.7);       // elaborate entablature
        if (street) fbx(gd, F, 0, L0, H - 0.4, H - 0.1, 0.7, 0.72);      // gilded frieze line
        fbx(t, F, -0.35, L0 + 0.35, H + 0.6, H + 0.8, -0.02, 0.4);
        if (street) fbal(t, F, 0.3, L0 - 0.3, H + 0.8, 1.1, 0.1, 0.3);
        else fbx(t, F, -0.1, L0 + 0.1, H + 0.8, H + 1.6, -0.02, 0.25);
        if (i === 0){
          // the raised curved centre pediment and the triangular end pediments of the Stamford Road front
          const um = L0/2; fbx(w, F, um - 7.4, um + 7.4, H + 0.8, H + 2.6, -0.4, 0.3); fsegped(w, t, F, um - 7.4, um + 7.4, H + 2.6, 2.6, -0.4, 0.3, 12);
          fbx(t, F, um - 7.6, um + 7.6, H + 2.4, H + 2.7, -0.4, 0.5);
          for (const uc of [4.6, L0 - 4.6]){ fbx(w, F, uc - 4.2, uc + 4.2, H + 0.8, H + 2.2, -0.4, 0.3); fped(w, t, F, uc - 4.2, uc + 4.2, H + 2.2, 2.2, -0.4, 0.3); }
        }
        if (i === 6){ fbx(w, F, -0.2, L0 + 0.2, H + 0.8, H + 3.0, -0.4, 0.3); fped(w, t, F, -0.4, L0 + 0.4, H + 3.0, 1.6, -0.4, 0.3); }
      });
      // roof: low hipped roofs behind the balustrade
      hipR(rf, 26, 76, 4, 26, H + 0.6, 3.0, 0, null, null);
    }
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
    const AL = {c:'#cdd0cd', m:0, lk:0.12}, ALD = {c:'#b9bcba', m:0, lk:0.1}, WIN = {c:'#4a5661', m:1, fh:3.1, cw:1.8}, WINO = {c:'#4a5661', m:1, fh:3.75, cw:1.8},
      SHP = {c:'#3a4650', glow:'#ffd9a8', gk:0.45, m:0, lk:0}, SKY = {c:'#a6bfc9', op:0.55, m:0, lk:0.4}, RF = {c:'#8e9295', m:0, lk:0.05},
      CRN = {c:'#33404a', glow:'#ffcf96', gk:0.55, m:0, lk:0}, RED = {c:'#b02020', glow:'#ff2a1a', gk:2.0, m:0, lk:0}, PL = {c:'#b8b5ad', m:0, lk:0.1},
      STL = {c:'#9aa1a6', m:0, lk:0.2};
    const al = B.p(AL), ald = B.p(ALD), wn = B.p(WIN), wno = B.p(WINO), shp = B.p(SHP), sky = B.p(SKY), rf = B.p(RF), crn = B.p(CRN), red = B.p(RED), stl = B.p(STL);
    const Y0 = 0.6, HP_ = 24.6;
    // ---- the podium ----
    const PD = [[72.5,69.6],[56.8,77.3],[42.1,78.9],[33.8,69.5],[-46.7,71.9],[-48.1,75.1],[-61.1,73.3],[-70.3,67.5],[-78.3,56.2],[-79.6,38.1],[-73.4,26.4],[-74.3,-56.6],[-71.1,-68.4],[-64.5,-75.4],[-57.5,-78.9],[58.0,-78.3],[67.9,-73.7],[76.1,-61.2],[77.5,-49.0],[75.6,43.3],[79.5,47.8],[78.4,60.4]];
    LPoly(g, PD, -5, 5.6, PL);
    const PDi = inset(PD, 2.2);
    wallsP(shp, PDi, Y0, 6.2);                                             // recessed glazed ground floor
    for (const F of edgesOut(PD)){ const n = Math.max(1, Math.round(F.L/7.2)); for (let k = 0; k <= n; k++){ const u = k*F.L/n; fbx(al, F, u - 0.55, u + 0.55, Y0, 6.2, -2.2, 0); } }
    wallsP(al, PD, 6.2, HP_); capT(rf, PD, HP_);
    bandP(ald, PD, 6.2, 0.9, 0.25); bandP(ald, PD, HP_ - 0.2, 0.9, 0.3);
    capT(al, PDi, 6.2);
    gridWins(wn, PD, 8.0, HP_ - 1.5, 3.6, 2.4, 1.45, 1.45, 0.9, 0.05);
    // central glazed atrium roof (stepped pyramid) between the towers
    { const ax = 2, az = 8, s = 17; bx(al, ax - s - 0.6, ax + s + 0.6, HP_, HP_ + 1.2, az - s - 0.6, az + s + 0.6);
      for (let k = 0; k < 3; k++){ const a = s - k*5, b = s - (k + 1)*5, y0 = HP_ + 1.2 + k*2.6, y1 = y0 + 2.6;
        Q(sky, [ax - a, y0, az + a], [ax + a, y0, az + a], [ax + b, y1, az + b], [ax - b, y1, az + b]); Q(sky, [ax + a, y0, az - a], [ax - a, y0, az - a], [ax - b, y1, az - b], [ax + b, y1, az - b]);
        Q(sky, [ax + a, y0, az + a], [ax + a, y0, az - a], [ax + b, y1, az - b], [ax + b, y1, az + b]); Q(sky, [ax - a, y0, az - a], [ax - a, y0, az + a], [ax - b, y1, az + b], [ax - b, y1, az - b]);
        for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) segP(stl, [ax + sx*a, y0, az + sz*a], [ax + sx*b, y1, az + sz*b], 0.15, 4); }
      Q(sky, [ax - 2, HP_ + 9, az + 2], [ax + 2, HP_ + 9, az + 2], [ax + 2, HP_ + 9, az - 2], [ax - 2, HP_ + 9, az - 2]); }
    // ---- the towers ----
    const tower = (P, top, fh, wmat, crown) => {
      wallsP(al, P, HP_, top); capT(rf, P, top);
      gridWins(wmat, P, HP_ + 1.0, top - (crown ? crown + 1.2 : 2.0), fh, 2.05, 1.5, 1.5, 0.85, 0.05);
      for (let y = HP_ + 1.0; y < top - 3; y += fh*10) bandP(ald, P, y - 0.25, 0.3, 0.06);
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

// =====================================================================================================================
// ===== The Arts House at the Old Parliament (1827 G. D. Coleman, Neo-Palladian; enlarged 1875 / 1901 / 1909): white
// two-storey neoclassical house with the porch and the triangular-pedimented front towards the Padang side, Corinthian
// pilasters, Palladian windows, loggias along the sides, grey hipped roofs; the bronze elephant (1871, gift of King
// Chulalongkorn) on its pedestal in front. Local axes: +x = bearing 55.4 deg (NE, the front with the elephant),
// +z = SE (Old Parliament Lane / Victoria Theatre side); the 1901 river wing is at -x.
LANDMARKS.artshouse = {zh:'旧国会大厦艺术之家', en:'The Arts House (Old Parliament House)', cat:'old', r:48, h:18,
  lt:{m:0, c:'#ffdcae', k:1.0, e:0.5, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
    const W = '#f1eee6', T = '#fbfaf5', D = '#2c3238', L = {c:'#3b352c', glow:'#ffcf8e', gk:0.55}, R = {c:'#666a70', lk:0.3}, RC = {c:'#55595e', lk:0.25},
      PL = '#c6bfb0', BR = {c:'#4f3f2c', lk:0.5}, GR = '#9d978c', GN = {c:'#6f8a52', lk:0.2};
    const w = B.p(W), t = B.p(T), dk = B.p(D), lit = B.p(L), rf = B.p(R), rc = B.p(RC), br = B.p(BR), gr = B.p(GR), gn = B.p(GN);
    const FP = [[31.8,4.8],[24.9,4.4],[24.9,9.5],[13.0,9.0],[12.7,18.0],[5.1,17.4],[5.1,19.6],[-17.0,18.9],[-17.1,12.4],[-33.7,11.4],[-32.9,5.2],[-41.8,4.8],[-41.2,-8.0],[-33.2,-7.7],[-32.7,-10.2],[-17.4,-9.9],[-17.5,-16.4],[-9.9,-15.8],[-9.6,-19.6],[4.8,-18.6],[4.5,-14.9],[12.5,-14.6],[12.1,-9.9],[27.0,-9.3],[26.4,-8.1],[32.3,-7.9]];
    LPoly(g, FP, -5, 5.6, PL);
    const Y0 = 0.6, fl1 = 6.4, P = {w, t, dk, lit, rng};
    // two-storey block with arched ground-floor openings, upper windows, string course, cornice, hipped roof
    const block = (x0, x1, z0, z1, H, rise, o) => {
      o = o || {}; bx(w, x0, x1, Y0, H, z0, z1);
      const F = rectF(x0, x1, z0, z1);
      for (const s of ['f', 'r', 'b', 'l']){ const Fs = F[s]; if (Fs.L < 2.5 || (o.skip && o.skip.includes(s))) continue;
        const n = Math.max(1, Math.round(Fs.L/(o.bay || 3.9)));
        if (o.loggia && o.loggia.includes(s)){
          farcade(w, Fs, 0.3, Fs.L - 0.3, n, Y0, 3.8, fl1, 0.8, -0.05, 0.9, 6);
          frect(dk, Fs, 0.3, Fs.L - 0.3, Y0, 5.2, -0.02);
          fwins(dk, lit, Fs, 0.3, Fs.L - 0.3, (Fs.L - 0.6)/n, [[fl1 + 1.0, 3.6, 'a', 1.5]], 0.95, rng, 0.3);
          fpil(t, Fs, 0.3, Fs.L - 0.3, n, fl1, H - 1.0, 0.5, 1.2);
        } else {
          fwins(dk, lit, Fs, 0.4, Fs.L - 0.4, (Fs.L - 0.8)/n, [[1.6, 3.4, 'a', 1.4], [fl1 + 1.0, 3.2, 'r', 1.3]], 0.05, rng, 0.25);
          for (let i = 0; i < n; i++){ const uc = 0.4 + (i + 0.5)*(Fs.L - 0.8)/n; fbx(t, Fs, uc - 0.95, uc + 0.95, fl1 + 4.25, fl1 + 4.55, -0.02, 0.3); }
          if (o.pil) fpil(t, Fs, 0.3, Fs.L - 0.3, n, fl1, H - 1.0, 0.45, 0.22);
        }
        fbx(t, Fs, -0.15, Fs.L + 0.15, fl1 - 0.35, fl1 + 0.15, -0.02, 0.32);
        fbx(t, Fs, -0.35, Fs.L + 0.35, H - 0.9, H, -0.02, 0.55);
      }
      if (rise) hipR(rf, x0, x1, z0, z1, H, rise, 0.7, rc, t);
    };
    // the main house (Coleman's mansion with the old chamber), loggias on both long sides
    block(-17.4, 12.5, -16.0, 17.4, 13.6, 4.4, {loggia:'fb', pil:true, bay:4.2});
    block(-9.8, 4.8, 17.4, 19.4, 10.6, 0, {skip:'lr'}); block(-9.8, 4.8, -19.4, -16.0, 10.6, 0, {skip:'lr'});
    // the front range and its porch: the pedimented front with Corinthian pilasters and a Palladian window
    block(12.3, 25.0, -9.8, 9.2, 13.2, 3.6, {pil:true, bay:3.8, skip:'r'});
    block(-33.3, -17.4, -10.0, 11.8, 12.6, 3.4, {pil:true, bay:3.8, skip:'r'});
    block(-41.6, -33.3, -7.9, 5.0, 11.8, 2.8, {bay:3.6});
    { const x0 = 25.0, x1 = 32.2, z0 = -8.0, z1 = 4.7, H = 13.2, F = rectF(x0, x1, z0, z1), Fr = F.r;
      bx(w, x0, x1, H - 2.2, H, z0, z1);
      // carriage porch: three arches to the front, one to each side, open loggia above with paired columns
      farcade(w, Fr, 0, Fr.L, 3, Y0, 3.9, fl1, 1.0, -0.1, 0.6, 8);
      for (const s of ['f', 'b']) farcade(w, F[s], 0, F[s].L, 1, Y0, 3.9, fl1, 1.4, -0.1, 0.6, 8);
      bx(t, x0, x1 + 0.4, fl1 - 0.3, fl1 + 0.4, z0 - 0.3, z1 + 0.3); bx(w, x0, x1, fl1 + 0.4, fl1 + 0.6, z0, z1);
      for (const u of [0.6, 1.6, Fr.L*0.5 - 1.6, Fr.L*0.5 + 1.6, Fr.L - 1.6, Fr.L - 0.6]) fcol(t, t, Fr, u, 0.2, fl1 + 0.4, H - 2.2, 0.3, 8);
      farch(lit, Fr, Fr.L/2, fl1 + 1.0, 2.2, fl1 + 3.6, -2.0, 8); frect(dk, Fr, Fr.L/2 - 3.2, Fr.L/2 - 1.6, fl1 + 1.0, fl1 + 3.8, -2.0); frect(dk, Fr, Fr.L/2 + 1.6, Fr.L/2 + 3.2, fl1 + 1.0, fl1 + 3.8, -2.0);
      fbal(t, Fr, 0.3, Fr.L - 0.3, fl1 + 0.6, 1.0, 0.25, 0.22);
      fbx(t, Fr, -0.3, Fr.L + 0.3, H - 1.0, H, -0.02, 0.6);
      fped(w, t, Fr, -0.3, Fr.L + 0.3, H, 3.4, -0.4, 0.5);
      gabR(rf, null, x0 - 4, x1, z0 - 0.3, z1 + 0.3, H, 3.4, 'x', 0);
      bx(rf, x0 - 0.5, x0, Y0, H, z0, z1);
    }
    // the bronze elephant on its pedestal in front of the porch
    { const ex = 37.0, ez = 1.7; bx(gr, 32.6, 41.4, -2, 0.35, -5.1, 8.5); bx(gn, 33.0, 41.0, 0.35, 0.45, -4.7, 8.1);
      bx(gr, ex - 1.9, ex + 1.9, 0.45, 1.0, ez - 1.3, ez + 1.3); bx(gr, ex - 1.5, ex + 1.5, 1.0, 3.2, ez - 0.95, ez + 0.95); bx(gr, ex - 1.75, ex + 1.75, 3.2, 3.55, ez - 1.15, ez + 1.15);
      const y = 3.55, s = 1.25;
      const ell = (cx, cy, cz, rx, ry, rz) => { for (let i = 0; i < 10; i++) for (let k = 0; k < 6; k++){ const a0 = i/10*TAU, a1 = (i + 1)/10*TAU, b0 = -HP + k/6*PI, b1 = -HP + (k + 1)/6*PI;
        const P = (a, b) => [cx + Math.cos(b)*Math.cos(a)*rx, cy + Math.sin(b)*ry, cz + Math.cos(b)*Math.sin(a)*rz]; Q(br, P(a0, b0), P(a1, b0), P(a1, b1), P(a0, b1)); } };
      ell(ex, y + 1.25*s, ez, 0.85*s, 0.5*s, 0.45*s);                                   // body
      ell(ex + 0.95*s, y + 1.5*s, ez, 0.34*s, 0.36*s, 0.3*s);                          // head
      for (const [sx, sz] of [[-0.5, -0.25], [-0.5, 0.25], [0.5, -0.25], [0.5, 0.25]]) segP(br, [ex + sx*s, y, ez + sz*s], [ex + sx*s, y + 1.0*s, ez + sz*s], 0.14*s, 6, 0.15*s);
      segP(br, [ex + 1.2*s, y + 1.45*s, ez], [ex + 1.42*s, y + 0.9*s, ez], 0.12*s, 6, 0.09*s); segP(br, [ex + 1.42*s, y + 0.9*s, ez], [ex + 1.5*s, y + 0.4*s, ez], 0.09*s, 6, 0.07*s);
      for (const sz of [-1, 1]) Q(br, [ex + 0.85*s, y + 1.85*s, ez + sz*0.22*s], [ex + 0.75*s, y + 1.8*s, ez + sz*0.62*s], [ex + 0.72*s, y + 1.2*s, ez + sz*0.55*s], [ex + 0.85*s, y + 1.25*s, ez + sz*0.25*s]);
      for (const sz of [-1, 1]) segP(gr, [ex + 1.15*s, y + 1.3*s, ez + sz*0.18*s], [ex + 1.45*s, y + 1.25*s, ez + sz*0.24*s], 0.035*s, 3);
      segP(br, [ex - 0.82*s, y + 1.35*s, ez], [ex - 0.98*s, y + 0.8*s, ez], 0.03*s, 3);
    }
    B.flush(g); return g; }};

// =====================================================================================================================
// ===== Parliament House (1999, Public Works Department): slate-grey Front Block with the colonnade of square pillars
// and President Ong Teng Cheong's prism-shaped pinnacle over the ceremonial entrance hall, the Chamber Block towards
// the river with its raised chamber roof, the Public Block linking to the restored 1839 Court House Annexe (Parliament
// Secretariat Office, two-storey colonial range with verandahs) and the pergola along the courtyard.
// Local axes: +x = bearing 54.5 deg (NE, Parliament Place), +z = SE (towards The Arts House); North Bridge Road and
// the ceremonial driveway are at -z, the Singapore River at -x.
LANDMARKS.parliament = {zh:'新加坡国会大厦', en:'Parliament House', cat:'new', r:88, h:40,
  lt:{m:0, c:'#ffe2bc', k:0.85, e:0.5, anim:'breathe'},
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
          for (let k = 0; k <= n; k++){ const u = Math.min(F.L - 0.7, Math.max(0.7, k*bw)); fbx(cl, F, u - 0.7, u + 0.7, Y0, 15.0, -cd + 0.1, 0); fbx(cl, F, u - 0.85, u + 0.85, Y0, 1.2, -cd + 0.1, 0.15); }
          fbx(cl, F, -0.1, F.L + 0.1, 15.0, 16.6, -0.02, 0.3);
        } else {
          for (let k = 0; k < n; k++){ const uc = (k + 0.5)*bw; for (const y of [1.4, 5.8, 10.2]) frect(win(), F, uc - 1.0, uc + 1.0, y, y + 2.6, 0.04); }
          for (let k = 0; k <= n; k++) fbx(cl, F, k*bw - 0.45, k*bw + 0.45, Y0, 15.0, -0.02, 0.35);
          fbx(cl, F, -0.2, F.L + 0.2, 15.0, 16.4, -0.02, 0.55);
        }
        frect(win(), F, 0.6, F.L - 0.6, 17.0, 19.2, 0.04);
        fbx(cl, F, -0.3, F.L + 0.3, H - 0.8, H, -0.02, 0.5);
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
    B.flush(g); return g; }};

// =====================================================================================================================
// ===== Cavenagh Bridge (1869, P. & W. MacLellan, Glasgow; Ordish-Lefeuvre chain-stayed suspension bridge, 79 m long,
// 61 m main span, 9.45 m wide; pedestrian): white wrought-iron plate girders and lattice parapets, four square pylons
// on the abutments, flat eyebar chains sagging between the pylon tops with hangers and inclined stays, backstay chains
// to the anchorages, lamp standards. Local axes: +x = bearing -60.7 deg (from Empress Place on the north bank to the
// Boat Quay / Fullerton side), +z = upstream (WSW). The deck replaces the app's path over the river.
LANDMARKS.cavenagh = {zh:'加文纳桥', en:'Cavenagh Bridge', cat:'old', r:44, h:10, water:true,
  lt:{m:0, c:'#ffe4b8', k:0.95, e:0.6},
  build(){
    const g = new THREE.Group(), B = mkB();
    const WH = '#eef0eb', PY = '#e8e3d6', DK = '#a39d91', ST = '#bdb6a8', LP = '#2a2e31', LN = {c:'#fff1d0', glow:'#ffd9a0', gk:1.6}, CH = '#e4e6e2';
    const wh = B.p(WH), py = B.p(PY), dk = B.p(DK), st = B.p(ST), lp = B.p(LP), ln = B.p(LN), ch = B.p(CH);
    const XE = 39.5, HW = 4.72, XP = 30.6;
    const yd = x => -0.55 + 3.25*(t => t*t*(3 - 2*t))(Math.min(1, Math.max(0, (XE - Math.abs(x))/22)));
    // deck, girders, lattice parapets
    const N = 40;
    for (let i = 0; i < N; i++){ const xa = -XE + 2*XE*i/N, xb = -XE + 2*XE*(i + 1)/N, ya = yd(xa), yb = yd(xb);
      Q(dk, [xa, ya, -HW + 0.35], [xa, ya, HW - 0.35], [xb, yb, HW - 0.35], [xb, yb, -HW + 0.35]);
      Q(wh, [xa, ya - 0.9, -HW + 0.35], [xb, yb - 0.9, -HW + 0.35], [xb, yb - 0.9, HW - 0.35], [xa, ya - 0.9, HW - 0.35]);
      for (const s of [-1, 1]){ const z0 = s*HW, z1 = s*(HW - 0.35);
        // plate girder rising 0.35 m above the deck, then the lattice parapet with handrail
        Q(wh, [xa, ya - 1.25, z0], [xb, yb - 1.25, z0], [xb, yb + 0.35, z0], [xa, ya + 0.35, z0]); Q(wh, [xa, ya - 1.25, z1], [xb, yb - 1.25, z1], [xb, yb + 0.35, z1], [xa, ya + 0.35, z1]);
        Q(wh, [xa, ya + 0.35, z0], [xb, yb + 0.35, z0], [xb, yb + 0.35, z1], [xa, ya + 0.35, z1]); Q(wh, [xa, ya - 1.25, z0], [xb, yb - 1.25, z0], [xb, yb - 1.25, z1], [xa, ya - 1.25, z1]);
        if (Math.abs(xa) < XP && Math.abs(xb) < XP + 0.1){ const zc = s*(HW - 0.18);
          segP(wh, [xa, ya + 1.2, zc], [xb, yb + 1.2, zc], 0.07, 4);
          segP(wh, [xa, ya + 0.35, zc], [xb, yb + 1.15, zc], 0.035, 3); segP(wh, [xa, ya + 1.15, zc], [xb, yb + 0.35, zc], 0.035, 3);
          segP(wh, [xa, ya + 0.35, zc], [xa, ya + 1.2, zc], 0.05, 4); }
      }
    }
    // cross girders under the deck
    for (let x = -XP + 2; x < XP; x += 3.4) bx(wh, x - 0.15, x + 0.15, yd(x) - 1.05, yd(x) - 0.1, -HW + 0.3, HW - 0.3);
    // abutments with steps down to the quays
    for (const s of [-1, 1]){ const x0 = s > 0 ? XP - 3.0 : -XE, x1 = s > 0 ? XE : -XP + 3.0;
      bx(st, x0, x1, -4, -0.3, -HW - 1.0, HW + 1.0);
      for (let i = 0; i < 10; i++){ const xa = s > 0 ? XP - 3 + i*(XE - XP + 3)/10 : -XE + i*(XE - XP + 3)/10, xb = xa + (XE - XP + 3)/10; bx(st, xa, xb, -0.6, Math.min(yd(xa), yd(xb)) - 0.05, -HW - 1.0, -HW + 0.02); bx(st, xa, xb, -0.6, Math.min(yd(xa), yd(xb)) - 0.05, HW - 0.02, HW + 1.0); }
    }
    // pylons, chains, hangers, stays, backstays
    const PT = 7.4;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]){ const x = sx*XP, z = sz*(HW + 0.25), y0 = yd(x), top = y0 + PT;
      bx(py, x - 0.85, x + 0.85, -2.0, top, z - 0.85, z + 0.85);
      bx(py, x - 1.05, x + 1.05, -2.0, y0 + 0.9, z - 1.05, z + 1.05);
      for (const y of [y0 + 3.6, top - 0.6]) bx(py, x - 1.0, x + 1.0, y, y + 0.35, z - 1.0, z + 1.0);
      latheP(py, [[1.0, top], [1.0, top + 0.25], [0.55, top + 0.9], [0.18, top + 1.5], [0.32, top + 1.75], [0.01, top + 2.1]], x, z, 4, PI/4);
      // backstay chain to the anchorage on the quay
      const ax = sx*(XE - 0.6), ay = yd(ax) + 0.2; barP(ch, [x, top - 0.5, z], [ax, ay, z], 0.32, 0.12); bx(st, ax - 0.9, ax + 0.9, -0.6, ay + 0.5, z - 0.6, z + 0.6);
    }
    for (const sz of [-1, 1]){ const z = sz*(HW + 0.25), zc = sz*(HW - 0.05);
      // main chain: from pylon top to pylon top, sagging to the girder at mid-span
      const top = yd(XP) + PT - 0.5, mid = yd(0) + 0.7, cy = x => mid + (top - mid)*(x/XP)*(x/XP);
      const n = 24; for (let i = 0; i < n; i++){ const xa = -XP + 2*XP*i/n, xb = -XP + 2*XP*(i + 1)/n, za = xa === -XP ? z : zc, zb = xb === XP ? z : zc;
        barP(ch, [xa, cy(xa), Math.abs(xa) > XP - 0.1 ? z : zc], [xb, cy(xb), Math.abs(xb) > XP - 0.1 ? z : zc], 0.34, 0.12); }
      for (let x = -XP + 2.5; x < XP - 1; x += 2.5){ if (cy(x) - yd(x) > 0.5) segP(ch, [x, yd(x) + 0.35, zc], [x, cy(x), zc], 0.035, 3); }
      // inclined straight stays (the Ordish-Lefeuvre principle)
      for (const sx of [-1, 1]) for (const f of [0.3, 0.55]){ const xs = sx*XP*(1 - f); barP(ch, [sx*XP, top, z], [xs, yd(xs) + 0.35, zc], 0.2, 0.1); }
    }
    // lamp standards on the parapets
    for (const x of [-22, -11, 0, 11, 22]) for (const s of [-1, 1]){ const z = s*(HW - 0.15), y = yd(x) + 0.35;
      segP(lp, [x, y, z], [x, y + 3.4, z], 0.07, 6, 0.05); segP(lp, [x, y, z], [x, y + 0.6, z], 0.14, 6, 0.08);
      latheP(ln, [[0.01, y + 3.3], [0.22, y + 3.35], [0.26, y + 3.75], [0.18, y + 3.95], [0.01, y + 4.05]], x, z, 6); }
    B.flush(g); return g; }};

// =====================================================================================================================
// ===== Anderson Bridge (1910, Municipal Engineer R. Peirce; three steel bowstring arch girders 61 m span, 70 m long,
// 23 m wide, two roadways, footpaths on steel cantilevers outside; pedestrian since 2021): the three lattice arches,
// rusticated granite pedestrian archways at both ends of each footpath, a fluted granite pier at each end of the
// central girder, cast-iron railings, lamps on brackets. Local axes: +x = bearing -38.9 deg (from Esplanade Park on
// the north bank to the Fullerton side), +z = upstream (SW). The app's path lines over the bridge lie at z = +-5.9;
// the deck follows their height (about 2.9 m over the middle).
LANDMARKS.anderson = {zh:'安德逊桥', en:'Anderson Bridge', cat:'old', r:44, h:13, water:true,
  lt:{m:0, c:'#ffdcae', k:1.0, e:0.6},
  build(){
    const g = new THREE.Group(), B = mkB();
    const STL = '#dad8cf', STD = '#c4c2b8', GRN = '#b3ab9d', GRD = '#9d9588', RD = '#66686a', FW = '#aaa498', RL = '#3c4440', LN = {c:'#fff1d0', glow:'#ffd9a0', gk:1.6};
    const stl = B.p(STL), std = B.p(STD), grn = B.p(GRN), grd = B.p(GRD), rd = B.p(RD), fw = B.p(FW), rl = B.p(RL), ln = B.p(LN);
    const XE = 35.5, XB = 30.6, ZG = [-9.7, 0, 9.7], ZF = 12.0;
    const yd = x => Math.abs(x) > XE ? -0.55*Math.min(1, (Math.abs(x) - XE)/3) : 2.9*(t => t*t*(3 - 2*t))(Math.min(1, Math.max(0, (XE - Math.abs(x))/20)));
    const N = 44, X0 = -XE - 3, X1 = XE + 3;
    for (let i = 0; i < N; i++){ const xa = X0 + (X1 - X0)*i/N, xb = X0 + (X1 - X0)*(i + 1)/N, ya = yd(xa), yb = yd(xb);
      // two roadways, footpaths, deck slab underneath
      Q(rd, [xa, ya, -9.25], [xa, ya, 9.25], [xb, yb, 9.25], [xb, yb, -9.25]);
      for (const s of [-1, 1]){ Q(fw, [xa, ya + 0.15, s*10.15], [xa, ya + 0.15, s*ZF], [xb, yb + 0.15, s*ZF], [xb, yb + 0.15, s*10.15]);
        Q(std, [xa, ya + 0.15, s*ZF], [xb, yb + 0.15, s*ZF], [xb, yb - 0.75, s*ZF], [xa, ya - 0.75, s*ZF]); }
      Q(std, [xa, ya - 0.75, -ZF], [xb, yb - 0.75, -ZF], [xb, yb - 0.75, ZF], [xa, ya - 0.75, ZF]);
      // cast-iron railings on the outer edges of the footpaths
      if (Math.abs(xa) < XB && Math.abs(xb) < XB + 0.1) for (const s of [-1, 1]){ const z = s*(ZF - 0.1);
        segP(rl, [xa, ya + 1.25, z], [xb, yb + 1.25, z], 0.06, 4); segP(rl, [xa, ya + 0.3, z], [xb, yb + 0.3, z], 0.05, 4);
        for (let k = 0; k < 3; k++){ const f = k/3, x = xa + (xb - xa)*f, y = ya + (yb - ya)*f; segP(rl, [x, y + 0.15, z], [x, y + 1.25, z], 0.03, 3); }
        segP(rl, [xa, ya + 0.3, z], [xb, yb + 1.25, z], 0.025, 3); }
    }
    // cross girders and the deep edge girders under the deck
    for (let x = -XB + 1.5; x < XB; x += 3.05) bx(std, x - 0.2, x + 0.2, yd(x) - 1.6, yd(x) - 0.7, -ZF + 0.5, ZF - 0.5);
    // the three bowstring arch girders
    const RISE = 8.6, NP = 14;
    for (const zg of ZG){ const w = zg === 0 ? 0.62 : 0.5, bot = x => yd(x) + 0.95, top = x => bot(x) + RISE*(1 - (x/XB)*(x/XB));
      // bottom chord (plate girder standing above the deck)
      for (let i = 0; i < 28; i++){ const xa = -XB + 2*XB*i/28, xb = -XB + 2*XB*(i + 1)/28;
        for (const s of [-1, 1]) Q(stl, [xa, yd(xa) - 1.3, zg + s*w], [xb, yd(xb) - 1.3, zg + s*w], [xb, bot(xb), zg + s*w], [xa, bot(xa), zg + s*w]);
        Q(stl, [xa, bot(xa), zg - w], [xb, bot(xb), zg - w], [xb, bot(xb), zg + w], [xa, bot(xa), zg + w]); }
      // top chord (the arch)
      for (let i = 0; i < 28; i++){ const xa = -XB + 2*XB*i/28, xb = -XB + 2*XB*(i + 1)/28; segP(stl, [xa, top(xa) - 0.1, zg], [xb, top(xb) - 0.1, zg], 0.48, 4); }
      // verticals and crossed lattice diagonals in every panel
      for (let k = 0; k <= NP; k++){ const x = -XB + 2*XB*k/NP; if (k > 0 && k < NP) segP(stl, [x, bot(x), zg], [x, top(x) - 0.4, zg], 0.2, 4);
        if (k < NP){ const xn = -XB + 2*XB*(k + 1)/NP; if (top(x) - bot(x) > 1 || top(xn) - bot(xn) > 1){ segP(std, [x, bot(x), zg], [xn, top(xn) - 0.4, zg], 0.09, 4); segP(std, [x, top(x) - 0.4, zg], [xn, bot(xn), zg], 0.09, 4); } } }
      // bearings at the springings
      for (const s of [-1, 1]) bx(stl, s*XB - 1.0, s*XB + 1.0, yd(s*XB) - 1.3, bot(s*XB) + 0.6, zg - w - 0.1, zg + w + 0.1);
      // bronze lamps hanging on brackets from the outer arches
      if (zg !== 0) for (const x of [-15, 0, 15]){ const zo = zg + Math.sign(zg)*0.9, y = top(x) - 1.6; segP(rl, [x, y + 1.2, zg], [x, y + 1.2, zo], 0.05, 4); segP(rl, [x, y + 1.2, zo], [x, y + 0.6, zo], 0.03, 3);
        latheP(ln, [[0.01, y - 0.3], [0.2, y - 0.2], [0.26, y + 0.25], [0.12, y + 0.6], [0.01, y + 0.65]], x, zo, 6); }
    }
    // rusticated granite pedestrian archways at both ends of both footpaths, with moulded copings and lamp brackets
    for (const sx of [-1, 1]) for (const sz of [-1, 1]){
      const xa = sx > 0 ? XB : -XB - 2.7, xb = xa + 2.7, z0 = sz > 0 ? 9.0 : -13.5, z1 = z0 + 4.5, y0 = Math.min(yd(xa), yd(xb)) - 0.2, H = Math.max(yd(xa), yd(xb)) + 7.0;
      const F = fc(xa, sz > 0 ? z1 : z0, xa, sz > 0 ? z0 : z1);
      // two piers, the arch over the footpath and the solid attic, all rusticated
      const zi0 = sz > 0 ? z0 : z1 - 1.2, zo0 = sz > 0 ? z1 - 1.25 : z0;
      bx(grn, xa, xb, -2, H - 1.4, zi0, zi0 + 1.2); bx(grn, xa, xb, -2, H - 1.4, zo0, zo0 + 1.25);
      const Fa = fc(xa, z0, xa, z1), oz0 = (sz > 0 ? 10.2 : -12.3), oz1 = oz0 + 2.1, ys = yd(xa) + 2.9;
      for (const xf of [xa, xb]){ const Ff = fc(xf, oz0, xf, oz1); for (let i = 0; i < 8; i++){ const a = PI*i/8, b = PI*(i+1)/8, r = 1.05, uc = 1.05;
          Q(grn, fp(Ff, uc - Math.cos(a)*r, ys + Math.sin(a)*r, 0), fp(Ff, uc - Math.cos(b)*r, ys + Math.sin(b)*r, 0), fp(Ff, uc - Math.cos(b)*r, H - 1.4, 0), fp(Ff, uc - Math.cos(a)*r, H - 1.4, 0)); } }
      for (let i = 0; i < 8; i++){ const a = PI*i/8, b = PI*(i+1)/8, r = 1.05, zc = oz0 + 1.05; Q(grd, [xa, ys + Math.sin(a)*r, zc - Math.cos(a)*r], [xb, ys + Math.sin(a)*r, zc - Math.cos(a)*r], [xb, ys + Math.sin(b)*r, zc - Math.cos(b)*r], [xa, ys + Math.sin(b)*r, zc - Math.cos(b)*r]); }
      // rustication grooves: on the piers below the arch, across the whole portal above it
      for (let y = y0 + 0.9; y < H - 1.6; y += 0.75){ if (y > ys + 1.1) bx(grd, xa - 0.06, xb + 0.06, y, y + 0.09, z0 - 0.06, z1 + 0.06);
        else { bx(grd, xa - 0.06, xb + 0.06, y, y + 0.09, zi0 - 0.06, zi0 + 1.26); bx(grd, xa - 0.06, xb + 0.06, y, y + 0.09, zo0 - 0.06, zo0 + 1.31); } }
      bx(grn, xa - 0.25, xb + 0.25, H - 1.4, H - 0.6, z0 - 0.25, z1 + 0.25); bx(grd, xa - 0.4, xb + 0.4, H - 0.6, H - 0.35, z0 - 0.4, z1 + 0.4); bx(grn, xa - 0.1, xb + 0.1, H - 0.35, H, z0 - 0.1, z1 + 0.1);
      bx(grd, xa - 0.15, xb + 0.15, ys - 0.3, ys, z0 - 0.08, z1 + 0.08);
      // gas-lamp bracket on the outer face
      const lx = sx > 0 ? xb + 0.5 : xa - 0.5, lz = (z0 + z1)/2, ly = ys + 1.6; segP(rl, [sx > 0 ? xb : xa, ly, lz], [lx + sx*0.4, ly, lz], 0.05, 4);
      latheP(ln, [[0.01, ly - 0.75], [0.22, ly - 0.65], [0.26, ly - 0.2], [0.14, ly + 0.05], [0.01, ly + 0.1]], lx + sx*0.4, lz, 6);
    }
    // fluted granite piers at the ends of the central girder
    for (const sx of [-1, 1]){ const x = sx*(XB + 1.35), y = yd(x);
      bx(grn, x - 1.2, x + 1.2, -2, y + 1.0, -1.2, 1.2);
      for (let k = 0; k < 16; k++){ const a = k/16*TAU, r = 0.78; segP(grn, [x + Math.cos(a)*r, y + 1.0, Math.sin(a)*r], [x + Math.cos(a)*r, y + 5.6, Math.sin(a)*r], 0.13, 4); }
      latheP(grn, [[0.7, y + 1.0], [0.7, y + 5.6]], x, 0, 16);
      latheP(grd, [[0.95, y + 5.6], [1.05, y + 5.9], [1.15, y + 6.3], [0.01, y + 6.3]], x, 0, 16);
      latheP(grn, [[0.8, y + 6.3], [0.6, y + 7.0], [0.01, y + 7.2]], x, 0, 12);
      latheP(ln, [[0.01, y + 7.2], [0.3, y + 7.4], [0.34, y + 7.9], [0.2, y + 8.2], [0.01, y + 8.3]], x, 0, 8); }
    // abutments, wing walls into the water and the bank
    for (const sx of [-1, 1]){ const x0 = sx > 0 ? XB - 4.0 : -X1, x1 = sx > 0 ? X1 : -XB + 4.0;
      bx(grd, x0, x1, -4, -0.3, -ZF - 1.4, ZF + 1.4);
      for (const s of [-1, 1]) bx(grn, x0, x1, -0.6, 0.7, s > 0 ? ZF : -ZF - 1.4, s > 0 ? ZF + 1.4 : -ZF); }
    B.flush(g); return g; }};

// ===== placements: WGS84 position of each local origin (traced from the real footprints) and rot = bearing of local +x (rad)
SG_PLACES.push(
  {type:'capitol',     lat:1.293708, lon:103.851175, rot:2.5482},   // +x NW along Stamford Road, +z towards Stamford Road; the North Bridge Road corner at -x, Stamford House (Hill St) at +x
  {type:'rafflescity', lat:1.293893, lon:103.853349, rot:0.9512},   // podium centre; +x NE (Bras Basah Rd), +z SE (Beach Rd); Swissotel at (-47, 44)
  {type:'artshouse',   lat:1.288691, lon:103.851105, rot:0.9669},   // +x NE: the porch front and the elephant; +z SE (Old Parliament Lane)
  {type:'parliament',  lat:1.288946, lon:103.850575, rot:0.9512},   // +x NE (Parliament Place), -z NW (North Bridge Road, entrance under the prism), river at -x
  {type:'cavenagh',    lat:1.286555, lon:103.852358, rot:-1.0594},  // mid-span; +x from the north bank (Empress Place) to the south bank (Boat Quay / Fullerton)
  {type:'anderson',    lat:1.287266, lon:103.852979, rot:-0.6789}   // mid-span; +x from Esplanade Park (north bank) to the Fullerton side
);
}
