// ===== lm26/sgriver: Clarke Quay, Boat Quay, Elgin Bridge, Coleman Bridge, Alkaff Bridge, Masjid Jamae (Chulia), Majestic Theatre.
// Block-scoped: only LANDMARKS and SG_PLACES are touched. Real dimensions in metres; y = 0 is the app base (highest ground
// within r + 0.6 m); footprints traced from the real OSM data; rot = bearing of local +x, counter-clockwise from east.
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
// ---------- vertex-coloured batches (one material, many colours): {pos, col} ----------
const mkV = () => ({pos:[], col:[]});
const VQ = (V, c, a, b, cc, d) => { V.pos.push(...a, ...b, ...cc, ...a, ...cc, ...d); for (let i = 0; i < 6; i++) V.col.push(c[0], c[1], c[2]); };
const VT = (V, c, a, b, cc) => { V.pos.push(...a, ...b, ...cc); for (let i = 0; i < 3; i++) V.col.push(c[0], c[1], c[2]); };
const vFlush = (g, V, spec) => { if (!V.pos.length) return; const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(V.pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(V.col, 3)); geo.computeVertexNormals(); lmAdd(g, geo, Object.assign({c:'#ffffff', vc:true, ds:true}, spec || {}), 0, 0, 0, 0); };
const rgb = h => [parseInt(h.slice(1, 3), 16)/255, parseInt(h.slice(3, 5), 16)/255, parseInt(h.slice(5, 7), 16)/255];
const jit = (c, rng, k) => c.map(v => Math.min(1, Math.max(0, v*(1 + (rng() - 0.5)*k))));
// box into a vertex-colour batch (no bottom)
const vbox = (V, c, x0, x1, y0, y1, z0, z1) => { const P = [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]];
  VQ(V, c, P[4], P[7], P[6], P[5]); VQ(V, c, P[0], P[4], P[5], P[1]); VQ(V, c, P[1], P[5], P[6], P[2]); VQ(V, c, P[2], P[6], P[7], P[3]); VQ(V, c, P[3], P[7], P[4], P[0]); };
// a quad on an edge face: e = {ax, az, tx, tz, nx, nz} (fc()), u0..u1 along, y0..y1, d out
const vfrect = (V, c, F, u0, u1, y0, y1, d) => VQ(V, c, fp(F, u0, y0, d), fp(F, u1, y0, d), fp(F, u1, y1, d), fp(F, u0, y1, d));
const vfbx = (V, c, F, u0, u1, y0, y1, d0, d1) => { const P = [fp(F,u0,y0,d0), fp(F,u1,y0,d0), fp(F,u1,y0,d1), fp(F,u0,y0,d1), fp(F,u0,y1,d0), fp(F,u1,y1,d0), fp(F,u1,y1,d1), fp(F,u0,y1,d1)];
  VQ(V, c, P[4], P[7], P[6], P[5]); VQ(V, c, P[0], P[4], P[5], P[1]); VQ(V, c, P[1], P[5], P[6], P[2]); VQ(V, c, P[2], P[6], P[7], P[3]); VQ(V, c, P[3], P[7], P[4], P[0]); VQ(V, c, P[0], P[1], P[2], P[3]); };

// ---------- polygon utilities ----------
// keep the part of polygon P with nx*x + nz*z <= c (Sutherland-Hodgman, one half-plane)
const clipHP = (P, nx, nz, c) => { const out = [];
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], da = nx*a[0] + nz*a[1] - c, db = nx*b[0] + nz*b[1] - c;
    if (da <= 0) out.push(a); if ((da <= 0) !== (db <= 0)){ const t = da/(da - db); out.push([a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t]); } }
  const r = []; for (const p of out){ const q = r[r.length - 1]; if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.02) r.push(p); }
  if (r.length > 2 && Math.hypot(r[0][0] - r[r.length - 1][0], r[0][1] - r[r.length - 1][1]) < 0.02) r.pop();
  return r.length >= 3 ? r : null; };
const triP = P => THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
const flat2 = A => { const P = []; for (let i = 0; i < A.length; i += 2) P.push([A[i], A[i + 1]]); return P; };
const centroidP = P => { let x = 0, z = 0; for (const p of P){ x += p[0]; z += p[1]; } return [x/P.length, z/P.length]; };
// main axis of a footprint: direction of its longest edge (unit [dx, dz])
const mainAxis = P => { let best = 0, d = [1, 0]; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l > best){ best = l; d = [(b[0] - a[0])/l, (b[1] - a[1])/l]; } } return d; };

// ---------- pitched-roof building from a real footprint ----------
// P plan polygon; D = [dx, dz] axis along which the roof strips follow each other (ridges run across D);
// nS strips (each: a ridge in its middle), y0 ground, eave height, rise; walls into W (vc), roof into R (vc);
// returns the outer edges with their wall heights: [{a, b, ha, hb, F}] for the facade decorator
function pitched(W, R, P, D, nS, y0, eave, rise, cw, cr, sink, span){
  const s = p => p[0]*D[0] + p[1]*D[1];
  let s0 = 1e9, s1 = -1e9; for (const p of P){ s0 = Math.min(s0, s(p)); s1 = Math.max(s1, s(p)); }
  if (span){ s0 = span[0]; s1 = span[1]; }
  const L = s1 - s0, n = Math.max(1, nS), w = L/n;
  const hAt = p => { const t = (s(p) - s0)/w, k = Math.min(n - 1, Math.floor(t)), f = t - k; return y0 + eave + rise*(1 - Math.abs(f - 0.5)*2); };
  const cuts = []; for (let i = 1; i < 2*n; i++) cuts.push(s0 + i*w/2);
  // roof pieces between consecutive cuts
  const bounds = [s0 - 1].concat(cuts, [s1 + 1]);
  for (let i = 0; i < bounds.length - 1; i++){
    let Q1 = clipHP(P, -D[0], -D[1], -bounds[i]); if (!Q1) continue; Q1 = clipHP(Q1, D[0], D[1], bounds[i + 1]); if (!Q1) continue;
    for (const t of triP(Q1)) VT(R, cr, [Q1[t[0]][0], hAt(Q1[t[0]]), Q1[t[0]][1]], [Q1[t[1]][0], hAt(Q1[t[1]]), Q1[t[1]][1]], [Q1[t[2]][0], hAt(Q1[t[2]]), Q1[t[2]][1]]);
  }
  // walls on the outline, following the roof line (gables on the edges that run along D); vertices added where cuts cross an edge
  const E = [], sg = areaS(P) > 0 ? 1 : -1;
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], sa = s(a), sb = s(b);
    const pts = [a]; const lo = Math.min(sa, sb), hi = Math.max(sa, sb);
    const cs = cuts.filter(c => c > lo + 0.05 && c < hi - 0.05); if (sb < sa) cs.reverse();
    for (const c of cs){ const t = (c - sa)/(sb - sa); pts.push([a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t]); }
    pts.push(b);
    for (let k = 0; k < pts.length - 1; k++){ const p = pts[k], q = pts[k + 1]; VQ(W, cw, [p[0], y0 - (sink || 5), p[1]], [q[0], y0 - (sink || 5), q[1]], [q[0], hAt(q), q[1]], [p[0], hAt(p), p[1]]); }
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 0.5) continue;
    const F = sg > 0 ? fc(b[0], b[1], a[0], a[1]) : fc(a[0], a[1], b[0], b[1]);
    E.push({a, b, l, F, rev:sg > 0, along:Math.abs(((b[0] - a[0])*D[0] + (b[1] - a[1])*D[1])/l), hmin:Math.min(hAt(a), hAt(b)) - y0});
  }
  return {E, hAt};
}
const BQ_DATA = {"B":[[[-4.1,40,-23.2,49.5,-25,44.1,-5.9,35.2],-2.4],[[-47.1,54.2,-30.9,46.5,-29.1,50.7,-45.3,58.4],-2.4],[[15,81.5,-1.1,92.8,-4.1,89.8,12.6,78.5],-2.4],[[44.3,116.5,32.3,101.1,35.3,98.7,47.9,113.5],-2.4],[[-62.6,-32.9,-44.1,-35.9,-44.1,-32.4,-63.2,-28.8],-2.4],[[-53,37.6,-35.7,31.7,-33.9,36.4,-51.2,42.4],-2.4],[[-37.5,-63.8,-18.4,-67.9,-19.6,-63.2,-38.1,-58.4],-2.4],[[-63.8,-67.9,-43.5,-72.1,-43.5,-67.3,-63.8,-62.6],-2.4],[[-17.8,-5.7,-38.1,0.3,-38.7,-5.1,-18.4,-11],-2.4],[[-37.5,78.5,-20.8,69,-19,73.8,-33.9,83.9],-2.4],[[16.8,118.9,34.1,105.8,37.7,110.6,20.4,123.6],-2.4],[[-56,-107.7,-54.8,-105.3,-53,-106.5,-53,-108.3,-51.8,-108.3,-50.6,-103.5,-65.8,-100.3,-65.8,-105.1],-2.4],[[-44.7,-18.1,-44.7,-11,-47.1,-10.4,-47.1,-8.6,-61.4,-3.9,-62,-13.4],-2.4],[[-45.3,58.4,-29.1,50.7,-27.4,55.4,-44.1,63.1],-2.4],[[-41.1,-88.7,-14.8,-95.2,-15.4,-89.9,-39.3,-82.8],-2.4],[[11.5,74.4,-6.5,85.7,-8.8,80.9,9.1,69.6],-2.4],[[5.5,112.9,9.1,118.3,-7.1,129.5,-10,124.2],-2.4],[[-38.1,-47.2,-20.2,-51.3,-20.2,-46,-38.7,-42.4],-2.4],[[2.5,56,-16,66.1,-18.4,61.3,0.7,50.7],-2.4],[[-2.3,102.3,1.9,108.2,-13.6,119.5,-17.8,113.5],-2.4],[[-55.4,31.1,-38.1,25.2,-35.7,31.7,-53,37.6],-2.4],[[-65.6,-77.4,-45.9,-82.2,-44.7,-77.4,-64.4,-72.1],-2.4],[[-38.1,-58.4,-19.6,-63.2,-19.6,-57.9,-38.1,-53.1],-2.4],[[-11.8,19.8,-31.5,28.1,-32.7,21.6,-13,14.5],-2.4],[[-64.4,-72.1,-44.7,-77.4,-43.5,-72.1,-63.8,-67.9],-2.4],[[-50.6,-103.5,-47.7,-86.9,-65.8,-82.4,-65.8,-100.3],-2.4],[[-63.8,-62.6,-43.5,-67.3,-44.1,-62.6,-62.6,-57.9],-2.4],[[12.6,78.5,-4.1,89.8,-6.5,85.7,11.5,74.4],-2.4],[[-63.2,-28.8,-44.1,-32.4,-44.7,-27,-63.2,-24.1],-2.4],[[6.7,65.5,-11.2,76.2,-13.6,71.4,4.3,60.7],-2.4],[[13.8,159.8,22.8,152.7,27,158.6,22.2,162.2,24,164.5,16.8,166.3],-2.4],[[13.2,114.1,30.6,101.1,34.1,105.8,16.8,118.9],-2.4],[[-42.3,67.9,-25,60.2,-23.2,64.3,-39.9,73.2],-2.4],[[-16.6,0.3,-36.3,6.8,-38.1,0.3,-17.8,-5.7],-2.4],[[-13,14.5,-32.7,21.6,-33.9,16.9,-14.2,9.7],-2.4],[[-5.9,35.2,-25,44.1,-27.4,39.4,-8.3,31.1],-2.4],[[25.8,142.6,28.8,147.9,13.8,159.8,9.7,153.9],-2.4],[[9.1,118.3,12.6,123,-3.5,134.3,-7.1,129.5],-2.4],[[15.6,127.8,19.2,132.5,3.7,144.4,0.1,139],-2.4],[[1.9,108.2,5.5,112.9,-10,124.2,-13.6,119.5],-2.4],[[-20.2,88,-16.6,93.4,-25,98.7,-28.5,93.4],-2.4],[[24,128.4,41.3,115.3,45.5,120,27.6,133.1],-2.4],[[-63.2,-24.1,-44.7,-27,-44.1,-22.9,-63.2,-19.3],-2.4],[[-62.6,-53.1,-44.1,-57.3,-44.1,-51.9,-62.6,-48.4],-2.4],[[-30.9,89.2,-16,79.7,-13,83.9,-28.5,93.4],-2.4],[[-1.7,45.9,-20.8,56,-23.2,49.5,-4.1,40],-2.4],[[6.1,104,23.4,91,27,96.3,9.7,108.8],-2.4],[[-38.7,-78.6,-16,-84.5,-17.2,-79.2,-37.5,-73.9],-2.4],[[-38.1,-53.1,-19.6,-57.9,-20.2,-51.3,-38.1,-47.2],-2.4],[[-62.6,-43,-44.1,-47.2,-43.5,-41.8,-62.6,-37.7],-2.4],[[-62.6,-37.7,-43.5,-41.8,-44.1,-35.9,-62.6,-32.9],-2.4],[[-61.4,-3.9,-47.1,-8.6,-47.1,-10.4,-44.7,-11,-44.7,-3.9,-61.4,0.9],-2.4],[[-61.4,0.9,-44.7,-3.9,-43.5,0.9,-60.8,6.2],-2.4],[[-62.6,-48.4,-44.1,-51.9,-44.1,-47.2,-62.6,-43],-2.4],[[-37.5,-69.1,-17.8,-73.3,-18.4,-67.9,-37.5,-63.8],-2.4],[[-44.1,63.1,-27.4,55.4,-25,60.2,-42.3,67.9],-2.4],[[-13,83.9,-5.3,95.7,-8.8,98.1,-16.6,85.7],-2.4],[[-39.9,73.2,-23.2,64.3,-20.8,69,-37.5,78.5],-2.4],[[-15.4,5,-35.1,11.5,-36.3,6.8,-16.6,0.3],-2.4],[[-19,-18.1,-38.7,-13.4,-38.7,-19.3,-19,-24.1],-2.4],[[-65.8,-82.4,-47.7,-86.9,-45.9,-82.2,-65.6,-77.4,-65.8,-78.2],-2.4],[[-43.5,-98.8,-17.2,-105.3,-16,-101.1,-42.3,-94.6],-2.4],[[-33.9,83.9,-19,73.8,-16,79.7,-30.9,89.2],-2.4],[[20.4,123.6,37.7,110.6,41.3,115.3,24,128.4],-2.4],[[-49.4,47.1,-32.7,41.8,-30.9,46.5,-47.1,54.2],-2.4],[[27.6,133.1,45.5,120,49.1,125.4,31.2,137.8],-2.4],[[27,158.6,28.2,160.4,59.2,136.1,62.2,140.8,35.3,161.6,24,164.5,22.2,162.2],-2.4],[[2.5,99.3,19.8,86.2,23.4,91,6.1,104],-2.4],[[35.3,161.6,62.2,140.8,65.8,145,51.5,156.2],-2.4],[[-8.3,31.1,-27.4,39.4,-29.1,34.1,-9.4,25.8],-2.4],[[-59.6,11.5,-42.3,6.2,-41.1,10.9,-58.4,16.3],-2.4],[[-38.1,-38.3,-20.2,-41.8,-19.6,-37.7,-38.1,-33.5],-2.4],[[22.8,152.7,52.6,129.5,59.2,136.1,28.2,160.4],-2.4],[[-18.4,-11,-38.7,-5.1,-38.7,-13.4,-19,-18.1],-2.4],[[-62.6,-57.9,-44.1,-62.6,-44.1,-57.3,-62.6,-53.1],-2.4],[[0.7,50.7,-18.4,61.3,-20.8,56,-1.7,45.9],-2.4],[[-58.4,16.3,-41.1,10.9,-40.5,15.7,-57.8,21],-2.4],[[-38.7,-42.4,-20.2,-46,-20.2,-41.8,-38.1,-38.3],-2.4],[[-42.3,-94.6,-16,-101.1,-14.8,-95.2,-41.1,-88.7],-2.4],[[22.8,137.8,25.8,142.6,9.7,153.9,6.7,149.1],-2.4],[[4.3,60.7,-13.6,71.4,-16,66.1,2.5,56],-2.4],[[12.6,123,15.6,127.8,0.1,139,-3.5,134.3],-2.4],[[-38.1,-33.5,-19.6,-37.7,-19.6,-32.9,-38.1,-28.2],-2.4],[[-19.6,-32.9,-19,-28.2,-38.1,-24.6,-38.1,-28.2],-2.4],[[-44.7,-104.1,-18.4,-110.6,-17.2,-105.3,-43.5,-98.8],-2.4],[[-37.5,-73.9,-17.2,-79.2,-17.8,-73.3,-37.5,-69.1],-2.4],[[-14.2,9.7,-33.9,16.9,-35.1,11.5,-15.4,5],-2.4],[[-60.8,6.2,-43.5,0.9,-42.3,6.2,-59.6,11.5],-2.4],[[-16.6,93.4,-11.8,100.5,-18.4,104.6,-22,104,-25,98.7],-2.4],[[9.1,69.6,-8.8,80.9,-11.2,76.2,6.7,65.5],-2.4],[[9.7,108.8,27,96.3,30.6,101.1,13.2,114.1],-2.4],[[-56.6,26.4,-39.9,20.4,-38.1,25.2,-55.4,31.1],-2.4],[[-57.8,21,-40.5,15.7,-39.9,20.4,-56.6,26.4],-2.4],[[-51.2,42.4,-33.9,36.4,-32.7,41.8,-49.4,47.1],-2.4],[[-39.3,-82.8,-15.4,-89.9,-16,-84.5,-38.7,-78.6],-2.4],[[-9.4,25.8,-29.1,34.1,-31.5,28.1,-11.8,19.8],-2.4],[[19.2,132.5,22.8,137.8,6.7,149.1,3.7,144.4],-2.4],[[-11.8,100.5,-20.2,88,-16.6,85.7,-8.8,98.1],-2.4],[[-51.3,-135.5,-26.2,-141.4,-25,-136.1,-50.1,-129.6],-2.4],[[-54.9,-108.8,-65.8,-105.5,-65.8,-112.9,-65,-114.1],-2.4],[[-53.7,-112.9,-53.7,-111.2,-52.5,-110.6,-53.1,-106.4,-54.9,-105.2,-56,-107.6,-54.9,-108.8,-65,-114.1,-62,-118.3],-2.4],[[-40.5,-153.9,-29.8,-156.2,-28.6,-151.5,-44.7,-147.3],-2.4],[[-38.1,-47.1,-20.2,-51.3,-20.2,-45.9,-38.7,-42.4],-2.4],[[-40.5,-153.9,-35.7,-162.8,-31.6,-163.9,-29.8,-156.2],-2.4],[[-54.3,-118.3,-53.7,-112.9,-62,-118.3,-60.2,-122.4],-2.4],[[-22.6,-147.9,-26.8,-147.3,-31,-165.7,-26.8,-166.3],-2.4],[[-50.1,-129.6,-25,-136.1,-23.2,-130.7,-48.9,-124.8],-2.4],[[-48.9,-140.8,-44.7,-147.3,-28.6,-151.5,-27.4,-146.8],-2.4],[[-45.9,-108.8,-19.6,-115.9,-18.4,-110.6,-44.7,-104.1],-2.4],[[-26.2,-141.4,-52.5,-134.9,-48.9,-140.8,-27.4,-146.8],-2.4],[[-48.9,-119.5,-22.6,-126,-20.8,-120.7,-47.1,-114.1],-2.4],[[-50.1,-124.2,-23.2,-130.7,-22.6,-126,-48.9,-119.5],-2.4],[[-39.3,-82.7,-15.5,-89.8,-16,-84.5,-38.7,-78.6],-2.4],[[-47.1,-114.1,-20.8,-120.7,-19.6,-115.9,-45.9,-108.8],-2.4]],"prom":[[-10.6,-102.6],[-10,-95.8],[-15.1,-50.7],[-14.8,-28.5],[-5.9,11.8],[7.9,44.7],[27,79.7],[77.7,148.5]]};
const CQ_DATA = {"B":[[[-31.2,-103.5,-26.5,-104.6,-11.6,-94.6,-8,-67.8,-37.2,-8,-60.5,1.5,-99,-15.6],-10.9,"The Foundry"],[[-107.7,-4.3,-58.7,16.9,-68.3,22.3,-62.9,36.4,-110.1,53.7,-112.5,37.7,-115.6,6],-10.9,"Merchants' Court"],[[-45,45.4,-21.7,36.4,21.9,54.9,-31.9,85.8,-64.7,99.9],-10.9,"Block D"],[[115.6,-5.7,114.4,18.8,92.9,18.2,92.3,25.9,44.5,34.8,41,18.2,101.3,6.8,110.8,-8],-10.9,""],[[113.2,-12.8,101.3,6.8,41,18.2,33.8,-9.2,39.2,-26.9,54.1,-50.6],-10.9,"Traders Market"],[[-88,67.4,-78.4,45.9,-62.3,38.9,-57.5,41.3,-82,103,-88.6,104.7,-98.7,95.2,-104.1,79.8],-10.9,""],[[36.2,34.2,25.4,44.8,-17.5,25.9,-26.5,7.5,2.2,-66.1,20.7,-73.2,41.6,-60.1,42.2,-55.4,23.1,-16.2],-10.9,"The Cannery"],[[-109.5,58.5,-91,50.7,-87.4,62,-89.2,66.2,-102.3,75.1,-104.7,75.7],-10.9,""],[[29.6,41.9,38,35.4,42.2,40.1,34.4,46.6],-10.9,""]],"ox":-76,"oz":16.9};
// ---------- shophouse / godown facade on one outer edge of a pitched() building ----------
// e: edge from pitched(); y0 ground; gf ground-floor height; fh upper storey height; nfl storeys; c: {wall, trim, shut}
// o: {gl, gll, shop} batches (B.p), W wall vc batch, R roof vc batch, rng; opt: {pLit, bay, ww, wh, eaveC, shopFront}
function facadeE(e, y0, gf, fh, nfl, c, o, W, R, rng, opt){
  const F = e.F, l = e.l, top = gf + (nfl - 1)*fh; if (l < 2.0 || e.hmin < gf + 0.5) return;
  const nf = Math.max(1, Math.min(nfl, 1 + Math.floor((e.hmin - gf + 0.3)/fh)));
  const yT = y0 + gf + (nf - 1)*fh;
  // end pilasters
  if (l > 3.2) for (const u of [0, l - 0.32]) vfbx(W, c.trim, F, u, u + 0.32, y0, yT, 0, 0.16);
  // ground floor: shop fronts / five-foot way opening (lit at night), a deep cornice above
  if (opt.shopFront !== false) frect(o.shop, F, 0.45, l - 0.45, y0 + 0.05, y0 + gf - 0.55, 0.05);
  vfbx(W, c.trim, F, 0, l, y0 + gf - 0.55, y0 + gf - 0.1, 0, 0.24);
  // upper floors: tall shuttered windows
  const bay = opt.bay || 2.3, nb = Math.max(1, Math.round((l - 0.6)/bay)), bw = (l - 0.6)/nb, ww = Math.min(opt.ww || 1.05, bw*0.42), wh = opt.wh || 2.0;
  for (let k = 1; k < nf; k++){ const y = y0 + gf + (k - 1)*fh;
    for (let i = 0; i < nb; i++){ const uc = 0.3 + (i + 0.5)*bw;
      frect(rng() < (opt.pLit || 0.3) ? o.gll : o.gl, F, uc - ww/2, uc + ww/2, y + 0.6, y + 0.6 + wh, 0.04);
      vfrect(W, c.shut, F, uc - ww/2 - ww*0.48, uc - ww/2, y + 0.6, y + 0.6 + wh, 0.07); vfrect(W, c.shut, F, uc + ww/2, uc + ww/2 + ww*0.48, y + 0.6, y + 0.6 + wh, 0.07);
      vfbx(W, c.trim, F, uc - ww/2 - 0.15, uc + ww/2 + 0.15, y + 0.42, y + 0.6, 0, 0.14);
      vfbx(W, c.trim, F, uc - ww/2 - 0.1, uc + ww/2 + 0.1, y + 0.6 + wh, y + 0.6 + wh + 0.22, 0, 0.1); }
    if (k < nf - 1) vfbx(W, c.trim, F, 0, l, y + fh - 0.18, y + fh, 0, 0.12); }
  // eaves: fascia and the tiled roof running out over it (only where the roof slopes down to this wall)
  if (e.along < 0.5 && Math.abs(e.hmin - top) < 0.6){ vfbx(W, c.trim, F, 0, l, y0 + top - 0.35, y0 + top, 0, 0.32);
    VQ(R, c.roof, fp(F, -0.15, y0 + top + 0.02, -0.2), fp(F, l + 0.15, y0 + top + 0.02, -0.2), fp(F, l + 0.15, y0 + top - 0.38, 0.85), fp(F, -0.15, y0 + top - 0.38, 0.85)); }
}
const PAL_WALL = ['#efe2c4', '#f2d68a', '#ecb3a2', '#f3caa0', '#bcdcc2', '#acc9de', '#d3bede', '#f1efe6', '#e6bb72', '#dc9566', '#c9dca4', '#f0c6c6'].map(rgb);
const PAL_SHUT = ['#3e6a53', '#3f7d86', '#6e4c33', '#e9e6dc', '#4a6c93', '#8a3b30', '#2f5546'].map(rgb);
const C_TRIM = rgb('#f5f2ea'), C_ROOF = rgb('#b45a3a');
// parasol (square market umbrella) into a vc batch
const parasol = (U, P, x, z, y, s, c, a) => { const ca = Math.cos(a)*s, sa = Math.sin(a)*s, top = [x, y + 2.9, z], co = [[ca - sa, ca + sa], [-ca - sa, ca - sa], [-ca + sa, -ca - sa], [ca + sa, -ca + sa]].map(q => [x + q[0], y + 2.25, z + q[1]]);
  for (let i = 0; i < 4; i++) VT(U, c, top, co[i], co[(i + 1) % 4]); segP(P, [x, y, z], [x, y + 2.9, z], 0.05, 4); };

// =====================================================================================================================
// ===== Boat Quay (south bank of the Singapore River, from Elgin Bridge to Bonham Street): the curved terrace of 1840s-
// 1900s shophouses (two and three storeys, conserved 1989) along the river promenade, back to back with the row on
// Circular Road. Built from the real OSM footprints (114 units): each unit gets its own pastel wall colour, shuttered
// timber windows, a lit shop front in the five-foot way, cornices and pitched terracotta roofs (two pitches front
// and back, ridges parallel to the street); riverside dining parasols and awnings on the promenade. Local axes:
// +x east, +z south (rot 0); y = 0 is the app base (the whole row sits at the real 0.9 m ground: offset per unit).
LANDMARKS.sgboatquay = {zh:'驳船码头', en:'Boat Quay', cat:'old', r:172, h:11,
  lt:{m:0, c:'#ffd6a0', k:0.6, e:0.6, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), W = mkV(), R = mkV(), U = mkV(), rng = LMCTX.rng;
    const o = {gl:B.p('#2a3236'), gll:B.p({c:'#ffe4b8', glow:'#ffcf8c', gk:0.85}), shop:B.p({c:'#4d3b2c', glow:'#ffc070', gk:1.05})};
    const pole = B.p('#3a3d3f');
    const prom = BQ_DATA.prom;
    const dProm = (x, z) => { let d = 1e9; for (let i = 0; i < prom.length - 1; i++){ const a = prom[i], b = prom[i + 1], vx = b[0] - a[0], vz = b[1] - a[1], L2 = vx*vx + vz*vz, t = Math.max(0, Math.min(1, ((x - a[0])*vx + (z - a[1])*vz)/L2)); d = Math.min(d, Math.hypot(x - a[0] - t*vx, z - a[1] - t*vz)); } return d; };
    const AWN = ['#8c2f2a', '#f0ead8', '#2f5a45', '#c8a050', '#7a2e4a', '#e8e2d0'].map(rgb);
    for (const [A, y0] of BQ_DATA.B){
      const P = flat2(A), D = mainAxis(P), area = Math.abs(areaS(P))/2;
      let dep = 0, wid = 1e9; { let s0 = 1e9, s1 = -1e9, t0 = 1e9, t1 = -1e9; for (const p of P){ const s = p[0]*D[0] + p[1]*D[1], t = -p[0]*D[1] + p[1]*D[0]; s0 = Math.min(s0, s); s1 = Math.max(s1, s); t0 = Math.min(t0, t); t1 = Math.max(t1, t); } dep = s1 - s0; wid = t1 - t0; }
      const cw = jit(PAL_WALL[Math.floor(rng()*PAL_WALL.length)], rng, 0.06), cs = PAL_SHUT[Math.floor(rng()*PAL_SHUT.length)], cr = jit(C_ROOF, rng, 0.16);
      const c = {wall:cw, trim:jit(C_TRIM, rng, 0.03), shut:cs, roof:cr};
      if (area < 60 || wid < 3.2){   // kiosks / sheds on the promenade: one storey, shallow roof
        const r = pitched(W, R, P, D, 1, y0, 3.4, 0.8, cw, cr);
        for (const e of r.E) if (e.l > 2.5) frect(o.shop, e.F, 0.3, e.l - 0.3, y0 + 0.1, y0 + 2.6, 0.04);
        continue; }
      const nfl = rng() < 0.42 ? 2 : 3, gf = 4.0, fh = 3.45, eave = gf + (nfl - 1)*fh;
      const nS = dep > 15 ? 2 : 1, rise = Math.min(2.6, dep/nS*0.5*0.5);
      // the ridges run across the depth (parallel to the street fronts): D is the depth axis
      const r = pitched(W, R, P, D, nS, y0, eave, rise, cw, cr);
      for (const e of r.E){ if (e.along > 0.5) continue;      // party walls (gables) stay plain
        facadeE(e, y0, gf, fh, nfl, c, o, W, R, rng, {pLit:0.45});
        // riverside: an awning over the five-foot way and parasols on the promenade
        const mx = (e.a[0] + e.b[0])/2, mz = (e.a[1] + e.b[1])/2, F = e.F;
        if (e.l > 3 && dProm(mx, mz) < 26 && dProm(mx + F.nx*6, mz + F.nz*6) < dProm(mx, mz) - 3){
          const ac = AWN[Math.floor(rng()*AWN.length)];
          VQ(U, ac, fp(F, 0.3, y0 + gf - 0.6, 0.1), fp(F, e.l - 0.3, y0 + gf - 0.6, 0.1), fp(F, e.l - 0.3, y0 + gf - 1.5, 2.6), fp(F, 0.3, y0 + gf - 1.5, 2.6));
          const n = e.l > 6.5 ? 2 : 1; for (let k = 0; k < n; k++){ const p = fp(F, e.l*(k + 0.5)/n, 0, 5.2 + rng()*1.4); parasol(U, pole, p[0], p[2], y0, 1.55, AWN[Math.floor(rng()*AWN.length)], Math.atan2(F.tz, F.tx)); }
        }
      }
    }
    vFlush(g, W, {c:'#ffffff'}); vFlush(g, R, {c:'#ffffff', m:0, lk:0.12}); vFlush(g, U, {c:'#ffffff', lk:0.3});
    B.flush(g); return g; }};

// =====================================================================================================================
// ===== Clarke Quay (north bank, between Read Bridge and Coleman Bridge): the five blocks of restored 19th-century
// godowns and shophouses (A-E: Traders Market, The Cannery, The Foundry, Merchants' Court, the riverside Block D),
// painted in bright colours, with pitched terracotta roofs; the streets between them (Read Street and its branches)
// covered by the 2006 ETFE "angsana" canopies - translucent umbrellas on white steel trunks that glow in changing
// colours at night - and the "bluebell" umbrellas over the riverside promenade; Read Bridge (1931, low steel girder
// bridge with four lamp standards, pedestrian) across the river at the south-west corner. Built from the real
// footprints. Local axes: +x east, +z south (rot 0); the blocks sit on the real 0.9 m ground (offset below the
// app base, which is lifted by the Fort Canning slope behind River Valley Road).
LANDMARKS.sgclarkequay = {zh:'克拉码头', en:'Clarke Quay', cat:'old', r:195, h:5,
  lt:{m:0, c:'#ffd2a8', k:0.62, e:0.6, anim:'cycle', c2:'#d98cff'},
  build(){
    const g = new THREE.Group(), B = mkB(), W = mkV(), R = mkV(), U = mkV(), rng = LMCTX.rng;
    const o = {gl:B.p('#2a3236'), gll:B.p({c:'#ffe4b8', glow:'#ffcf8c', gk:0.85}), shop:B.p({c:'#4d3b2c', glow:'#ffc070', gk:1.05})};
    const stl = B.p({c:'#eef0ee', m:0, lk:0.6}), pole = B.p('#3a3d3f');
    const G0 = CQ_DATA.B[0][1];                 // ground offset (0.9 m real ground below the app base)
    const PALQ = ['#f2c14e', '#e8743b', '#d8436e', '#4f9fd8', '#6cbf6a', '#f08a9c', '#9b7fd1', '#f4e3b2', '#3fb7b0', '#f2a65a'].map(rgb);
    for (const [A, y0, nm] of CQ_DATA.B){
      const P = flat2(A), area = Math.abs(areaS(P))/2;
      if (area < 100){ const D = mainAxis(P); pitched(W, R, P, D, 1, y0, 3.6, 0.9, jit(C_TRIM, rng, 0.04), C_ROOF); continue; }
      // split the block into godown units across its longest side; each unit its own colour and height
      const D = mainAxis(P), T = [-D[1], D[0]];
      let s0 = 1e9, s1 = -1e9; for (const p of P){ const s = p[0]*D[0] + p[1]*D[1]; s0 = Math.min(s0, s); s1 = Math.max(s1, s); }
      const nU = Math.max(1, Math.round((s1 - s0)/9.5)), uw = (s1 - s0)/nU;
      let bt0 = 1e9, bt1 = -1e9; for (const p of P){ const t = p[0]*T[0] + p[1]*T[1]; bt0 = Math.min(bt0, t); bt1 = Math.max(bt1, t); }
      for (let k = 0; k < nU; k++){
        let Q1 = clipHP(P, -D[0], -D[1], -(s0 + k*uw) + (k ? 0 : 1)); if (!Q1) continue; Q1 = clipHP(Q1, D[0], D[1], s0 + (k + 1)*uw + (k === nU - 1 ? 1 : 0)); if (!Q1) continue;
        const nfl = rng() < 0.55 ? 2 : 3, gf = 4.4, fh = 3.8, eave = gf + (nfl - 1)*fh;
        const nS = Math.max(1, Math.round((bt1 - bt0)/15)), rise = Math.min(2.1, (bt1 - bt0)/nS*0.5*0.3);
        const cw = jit(PALQ[Math.floor(rng()*PALQ.length)], rng, 0.05), c = {wall:cw, trim:jit(C_TRIM, rng, 0.03), shut:PAL_SHUT[Math.floor(rng()*PAL_SHUT.length)], roof:jit(C_ROOF, rng, 0.14)};
        // ridges run along D (gable ends on the long block sides are avoided: strips follow each other across T)
        const r = pitched(W, R, Q1, T, nS, y0, eave, rise, cw, c.roof, 5, [bt0, bt1]);
        for (const e of r.E){ // only the real outer walls get windows (not the cuts between units)
          const mx = (e.a[0] + e.b[0])/2, mz = (e.a[1] + e.b[1])/2; let onOut = false;
          for (let i = 0; i < P.length && !onOut; i++){ const a = P[i], b = P[(i + 1) % P.length], vx = b[0] - a[0], vz = b[1] - a[1], L2 = vx*vx + vz*vz, t = ((mx - a[0])*vx + (mz - a[1])*vz)/L2;
            if (t > -0.01 && t < 1.01 && Math.abs((mx - a[0])*vz - (mz - a[1])*vx)/Math.sqrt(L2) < 0.15) onOut = true; }
          if (onOut) facadeE(e, y0, gf, fh, nfl, c, o, W, R, rng, {pLit:0.45, bay:2.8, ww:1.2, wh:2.2}); }
      }
    }
    // ---- the ETFE "angsana" canopies over Read Street and its branches: trunk, branching struts, a translucent
    // petal-shaped cushion roof (glowing in colour at night)
    const ETFE = [B.p({c:'#e9eef2', op:0.78, ds:true, glow:'#ff7ad9', gk:0.8}), B.p({c:'#e9eef2', op:0.78, ds:true, glow:'#7ab8ff', gk:0.8}), B.p({c:'#e9eef2', op:0.78, ds:true, glow:'#b88cff', gk:0.8})];
    const ox = CQ_DATA.ox, oz = CQ_DATA.oz, L = (x, z) => [x - ox, z - oz];   // anchor coords -> model
    const streets = [[L(-72, -64), L(-116, 34)], [L(-118, 36), L(-150, 116)], [L(-128, 26), L(-176, 9)], [L(-104, 46), L(-54, 66)]];
    let ci = 0;
    const angsana = (x, z, R0, yC, a0) => {
      const et = ETFE[ci++ % 3], y = G0;
      segP(stl, [x, y - 1, z], [x, y + yC - 2.6, z], 0.42, 8, 0.36);
      const n = 6, rim = [];
      for (let i = 0; i < 2*n; i++){ const a = a0 + i/(2*n)*TAU, rr = R0*(i % 2 ? 0.78 : 1); rim.push([x + Math.cos(a)*rr, y + yC + (i % 2 ? 1.2 : 2.1), z + Math.sin(a)*rr]); }
      const mid = rim.map(p => [x + (p[0] - x)*0.5, y + yC + 0.35, z + (p[2] - z)*0.5]), c0 = [x, y + yC - 0.6, z];
      for (let i = 0; i < 2*n; i++){ const j = (i + 1) % (2*n); T3(et, c0, mid[i], mid[j]); Q(et, mid[i], rim[i], rim[j], mid[j]); }
      for (let i = 0; i < n; i++){ const p = rim[2*i]; segP(stl, [x, y + yC - 2.8, z], [x + (p[0] - x)*0.62, y + yC + 0.9, z + (p[2] - z)*0.62], 0.12, 5); }
      for (let i = 0; i < 2*n; i++) segP(stl, rim[i], rim[(i + 1) % (2*n)], 0.06, 4);
    };
    for (const [a, b] of streets){ const l = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(l/17));
      for (let k = 0; k < n; k++){ const t = (k + 0.5)/n; angsana(a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t, 10.2, 13.2, k*0.7 + ci); } }
    angsana(...L(-117, 35), 10.5, 13.4, 0.3);
    // ---- the riverside "bluebells": inverted umbrella canopies over the promenade dining
    const BB = [ETFE[0], ETFE[1]];
    const prom = [L(-140, 121), L(-122, 112), L(-96, 100), L(-72, 88), L(-45, 67)];
    for (let i = 0; i < prom.length; i++){ const [x, z] = prom[i], bb = BB[i % 2];
      segP(pole, [x, G0, z], [x, G0 + 5.2, z], 0.12, 6);
      latheP(bb, [[0.15, G0 + 5.0], [2.2, G0 + 5.6], [3.6, G0 + 6.6], [3.9, G0 + 7.1]], x, z, 12); }
    // ---- Read Bridge (1931): low steel plate-girder bridge, slight hump, lattice parapets, four lamp standards
    { const a = L(-153.2, 131.5), b = L(-157.2, 190.5), dx = b[0] - a[0], dz = b[1] - a[1], Lb = Math.hypot(dx, dz), ux = dx/Lb, uz = dz/Lb, px = -uz, pz = ux;
      const P2 = (s, t, y) => [a[0] + ux*s + px*t, y, a[1] + uz*s + pz*t];
      const yd = s => G0 + 0.6 + 2.4*Math.sin(Math.PI*Math.min(1, Math.max(0, s/Lb))), HW = 5.2;
      const gd = B.p({c:'#c9cbc4', m:0, lk:0.7}), dk = B.p('#8f8c84'), rl = B.p('#e8e8e2'), ln = B.p({c:'#fff1d0', glow:'#ffd9a0', gk:1.6}), lp = B.p('#2e3a3a');
      const N = 24; for (let i = 0; i < N; i++){ const s0 = -2 + (Lb + 4)*i/N, s1 = -2 + (Lb + 4)*(i + 1)/N, y0 = yd(s0), y1 = yd(s1);
        Q(dk, P2(s0, -HW, y0), P2(s0, HW, y0), P2(s1, HW, y1), P2(s1, -HW, y1));
        for (const sd of [-1, 1]){ const t = sd*HW, sag = s => yd(s) - 1.1 - 0.9*Math.sin(Math.PI*Math.min(1, Math.max(0, s/Lb)));
          Q(gd, P2(s0, t, y0 + 0.25), P2(s1, t, y1 + 0.25), P2(s1, t, sag(s1)), P2(s0, t, sag(s0)));
          Q(gd, P2(s0, t*0.94, sag(s0)), P2(s1, t*0.94, sag(s1)), P2(s1, t, sag(s1)), P2(s0, t, sag(s0)));
          segP(rl, P2(s0, t*0.97, y0 + 1.15), P2(s1, t*0.97, y1 + 1.15), 0.06, 4);
          for (let k = 0; k < 3; k++){ const s = s0 + (s1 - s0)*k/3; segP(rl, P2(s, t*0.97, yd(s) + 0.25), P2(s, t*0.97, yd(s) + 1.15), 0.025, 3); } } }
      Q(dk, P2(-2, -HW, yd(-2) - 1.6), P2(-2, HW, yd(-2) - 1.6), P2(Lb + 2, HW, yd(Lb + 2) - 1.6), P2(Lb + 2, -HW, yd(Lb + 2) - 1.6));
      for (const s of [0, Lb]) for (const sd of [-1, 1]){ const p = P2(s, sd*(HW + 0.2), yd(s));
        bx(dk, p[0] - 0.4, p[0] + 0.4, G0 - 3, p[1] + 1.4, p[2] - 0.4, p[2] + 0.4);
        segP(lp, [p[0], p[1] + 1.4, p[2]], [p[0], p[1] + 5.4, p[2]], 0.09, 6, 0.06);
        for (const q of [-0.5, 0.5]){ const lx = p[0] + ux*q, lz = p[2] + uz*q; latheP(ln, [[0.01, p[1] + 5.0], [0.2, p[1] + 5.1], [0.24, p[1] + 5.5], [0.12, p[1] + 5.75], [0.01, p[1] + 5.8]], lx, lz, 6); }
        latheP(ln, [[0.01, p[1] + 5.5], [0.22, p[1] + 5.6], [0.26, p[1] + 6.05], [0.14, p[1] + 6.3], [0.01, p[1] + 6.4]], p[0], p[2], 6); }
      // abutment walls down to the water on both banks
      for (const s of [0, Lb]) bx(dk, Math.min(P2(s, -HW - 0.6, 0)[0], P2(s, HW + 0.6, 0)[0]) - 0.6, Math.max(P2(s, -HW - 0.6, 0)[0], P2(s, HW + 0.6, 0)[0]) + 0.6, G0 - 4, yd(s) - 0.9, Math.min(P2(s, -HW - 0.6, 0)[2], P2(s, HW + 0.6, 0)[2]) - 0.6, Math.max(P2(s, -HW - 0.6, 0)[2], P2(s, HW + 0.6, 0)[2]) + 0.6);
    }
    vFlush(g, W, {c:'#ffffff'}); vFlush(g, R, {c:'#ffffff', lk:0.12}); vFlush(g, U, {c:'#ffffff'});
    B.flush(g); return g; }};
// piecewise-linear profile: pts [[x, y], ...] sorted by x
const pwl = pts => x => { if (x <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]){ const a = pts[i - 1], b = pts[i]; return a[1] + (b[1] - a[1])*(x - a[0])/(b[0] - a[0]); } return pts[pts.length - 1][1]; };
// monotone cubic through a profile (like the app's road decks: no overshoot, flat where the data is flat)
const mono = pts => { const n = pts.length, X = pts.map(p => p[0]), Y = pts.map(p => p[1]), d = [], m = [];
  for (let i = 0; i < n - 1; i++) d.push((Y[i + 1] - Y[i])/(X[i + 1] - X[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2]; for (let i = 1; i < n - 1; i++) m[i] = d[i - 1]*d[i] <= 0 ? 0 : (d[i - 1] + d[i])/2;
  for (let i = 0; i < n - 1; i++){ if (d[i] === 0){ m[i] = m[i + 1] = 0; continue; } const a = m[i]/d[i], b = m[i + 1]/d[i], q = a*a + b*b; if (q > 9){ const t = 3/Math.sqrt(q); m[i] = t*a*d[i]; m[i + 1] = t*b*d[i]; } }
  return x => { if (x <= X[0]) return Y[0]; if (x >= X[n - 1]) return Y[n - 1]; let i = 0; while (x > X[i + 1]) i++; const h = X[i + 1] - X[i], t = (x - X[i])/h, t2 = t*t, t3 = t2*t;
    return (2*t3 - 3*t2 + 1)*Y[i] + (t3 - 2*t2 + t)*h*m[i] + (-2*t3 + 3*t2)*Y[i + 1] + (t3 - t2)*h*m[i + 1]; }; };
// a strip (beam / slab) along x following y(x) + offsets, between z0 and z1, from y(x)+b0 to y(x)+b1, sampled at n steps from x0 to x1
const stripX = (o, yf, x0, x1, n, z0, z1, b0, b1, ends) => { for (let i = 0; i < n; i++){ const xa = x0 + (x1 - x0)*i/n, xb = x0 + (x1 - x0)*(i + 1)/n, ya = yf(xa), yb = yf(xb);
  Q(o, [xa, ya + b1, z0], [xb, yb + b1, z0], [xb, yb + b1, z1], [xa, ya + b1, z1]); Q(o, [xa, ya + b0, z0], [xb, yb + b0, z0], [xb, yb + b0, z1], [xa, ya + b0, z1]);
  Q(o, [xa, ya + b0, z0], [xb, yb + b0, z0], [xb, yb + b1, z0], [xa, ya + b1, z0]); Q(o, [xa, ya + b0, z1], [xb, yb + b0, z1], [xb, yb + b1, z1], [xa, ya + b1, z1]); }
  if (ends) for (const x of [x0, x1]){ const y = yf(x); Q(o, [x, y + b0, z0], [x, y + b0, z1], [x, y + b1, z1], [x, y + b1, z0]); } };
// cast-iron lamp standard with lantern(s) at (x, y, z): post height h, k lanterns on a cross-arm (1 or 3)
const lampStd = (oP, oL, x, y, z, h, k, ax) => {
  latheP(oP, [[0.42, y], [0.42, y + 0.5], [0.3, y + 0.62], [0.22, y + 1.2], [0.16, y + 1.4], [0.12, y + h - 0.6], [0.2, y + h - 0.4], [0.08, y + h - 0.2]], x, z, 8);
  const lan = (lx, ly, lz) => latheP(oL, [[0.01, ly], [0.2, ly + 0.08], [0.25, ly + 0.5], [0.16, ly + 0.72], [0.04, ly + 0.9], [0.01, ly + 1.0]], lx, lz, 6);
  if (k === 3){ const c = Math.cos(ax || 0)*0.75, s = Math.sin(ax || 0)*0.75; segP(oP, [x - c, y + h - 0.45, z - s], [x + c, y + h - 0.45, z + s], 0.05, 4);
    lan(x - c, y + h - 0.45, z - s); lan(x + c, y + h - 0.45, z + s); lan(x, y + h - 0.1, z); }
  else lan(x, y + h - 0.1, z);
};

// =====================================================================================================================
// ===== Elgin Bridge (1929, Municipal Engineer F. Dorrington Ward; steel bowstring arches cast in concrete, 140 ft span,
// built by Glasgow Steel Roofing; cast-iron lamps and bronze Singapura-lion medallions by Cavaliere Rodolfo Nolli):
// three low concrete-encased arches (one on each side, one between the two 26-ft roadways) with slender hangers
// under the curved top chord, solid end posts at the springings, five-foot footways cantilevered outside with a
// balustrade, four tall lamp standards with triple lanterns at the corners, abutments on both banks. The two
// carriageways of North / South Bridge Road and their deck are drawn by the app (deck from the real road data:
// local y 0 at the ends, 2.6 m over the river); the model wraps around them, leaving the carriageways clear.
// Local axes: +x from North Bridge Road (north bank) to South Bridge Road (south bank), +z upstream (west-north-west).
LANDMARKS.sgelgin = {zh:'艾尔金桥', en:'Elgin Bridge', cat:'old', r:40, h:9, water:true,
  lt:{m:0, c:'#ffe2b8', k:0.95, e:0.6, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB();
    const cr = B.p('#e6dfcd'), cd = B.p('#cfc6b0'), gr = B.p('#b9b2a2'), ir = B.p('#2c302f'), br = B.p({c:'#8a6a3a', m:0, lk:0.5}), ln = B.p({c:'#fff1d0', glow:'#ffd9a0', gk:1.7});
    // the app's deck: y = e - 0.6 (ramps from the banks, level over the river)
    const yd = mono([[-31.9, 0], [-10, 2.6], [12.05, 2.6], [34, 0]]);
    const XS = 21.35, RISE = 3.7, ZO = 9.3, ZF0 = 9.75, ZF1 = 11.35;
    const top = x => Math.max(yd(x) + 0.9, yd(x) + 0.9 + (RISE - 0.9)*(1 - (x/XS)*(x/XS)));
    // three arches: outer ones just outside the carriageways, the central one in the gap between them
    for (const [zc, w] of [[-ZO, 0.9], [0, 0.95], [ZO, 0.9]]){
      const z0 = zc - w/2, z1 = zc + w/2, n = 22;
      for (let i = 0; i < n; i++){ const xa = -XS + 2*XS*i/n, xb = -XS + 2*XS*(i + 1)/n;
        // the arch rib (top chord): 0.85 m deep
        for (const z of [z0, z1]) Q(cr, [xa, top(xa) - 0.85, z], [xb, top(xb) - 0.85, z], [xb, top(xb), z], [xa, top(xa), z]);
        Q(cd, [xa, top(xa), z0], [xb, top(xb), z0], [xb, top(xb), z1], [xa, top(xa), z1]); Q(cr, [xa, top(xa) - 0.85, z0], [xb, top(xb) - 0.85, z0], [xb, top(xb) - 0.85, z1], [xa, top(xa) - 0.85, z1]);
        // the tie / deck girder below it, standing 0.35 m above the deck
        for (const z of [z0, z1]) Q(cr, [xa, yd(xa) - 1.3, z], [xb, yd(xb) - 1.3, z], [xb, yd(xb) + 0.35, z], [xa, yd(xa) + 0.35, z]);
        Q(cd, [xa, yd(xa) + 0.35, z0], [xb, yd(xb) + 0.35, z0], [xb, yd(xb) + 0.35, z1], [xa, yd(xa) + 0.35, z1]); }
      // slender hangers
      for (let x = -XS + 3.05; x < XS - 1.5; x += 3.05) if (top(x) - yd(x) > 1.7) bx(cr, x - 0.17, x + 0.17, yd(x) + 0.3, top(x) - 0.8, zc - w*0.38, zc + w*0.38);
      // end posts at the springings
      for (const s of [-1, 1]){ const x = s*XS, y = yd(x); bx(cr, x - 0.75, x + 0.75, y - 1.4, y + 2.3, z0 - 0.25, z1 + 0.25); bx(cd, x - 0.9, x + 0.9, y + 2.3, y + 2.55, z0 - 0.4, z1 + 0.4); bx(cr, x - 0.55, x + 0.55, y + 2.55, y + 2.85, z0 - 0.15, z1 + 0.15);
        // bronze lion medallions on the outer faces of the outer posts
        if (zc !== 0){ const zf = zc > 0 ? z1 + 0.27 : z0 - 0.27; for (let k = 0; k < 10; k++){ const a = k/10*TAU, b = (k + 1)/10*TAU, r = 0.55; T3(br, [x, y + 1.2, zf], [x + Math.cos(a)*r, y + 1.2 + Math.sin(a)*r, zf], [x + Math.cos(b)*r, y + 1.2 + Math.sin(b)*r, zf]); } } }
    }
    // footways outside the outer arches: slab, fascia beam, balustrade
    const N = 30;
    for (const sz of [-1, 1]){ const za = sz*ZF0, zb = sz*ZF1, zr = sz*(ZF1 - 0.15);
      stripX(cd, yd, -XS - 6, XS + 6, N, Math.min(za, zb), Math.max(za, zb), -0.35, 0.15);
      stripX(cr, yd, -XS, XS, N, Math.min(zb, zb + sz*0.3), Math.max(zb, zb + sz*0.3), -1.2, 0.25);
      stripX(cr, yd, -XS - 6, XS + 6, N, Math.min(zr - 0.13, zr + 0.13), Math.max(zr - 0.13, zr + 0.13), 1.0, 1.15);
      for (let x = -XS - 5.6; x < XS + 5.7; x += 0.55) segP(cd, [x, yd(x) + 0.15, zr], [x, yd(x) + 1.0, zr], 0.07, 4);
      for (let x = -XS - 6; x <= XS + 6.1; x += 5.45) bx(cr, x - 0.2, x + 0.2, yd(x) + 0.1, yd(x) + 1.22, zr - 0.2, zr + 0.2);
    }
    // corner lamp standards (triple lanterns) on pedestals at the ends of the footways
    for (const sx of [-1, 1]) for (const sz of [-1, 1]){ const x = sx*(XS + 2.2), z = sz*(ZF1 - 0.6), y = yd(x) + 0.15;
      bx(gr, x - 0.55, x + 0.55, y, y + 1.1, z - 0.55, z + 0.55); bx(cd, x - 0.65, x + 0.65, y + 1.1, y + 1.3, z - 0.65, z + 0.65);
      lampStd(ir, ln, x, y + 1.3, z, 5.2, 3, HP); }
    // abutments (granite-faced) on both banks, down into the river
    for (const s of [-1, 1]){ const x0 = s > 0 ? XS - 0.8 : -XS - 3.5, x1 = s > 0 ? XS + 3.5 : -XS + 0.8;
      bx(gr, x0, x1, -4.5, Math.min(yd(x0), yd(x1)) - 0.4, -ZF1 - 0.6, ZF1 + 0.6);
      for (let y = -3.6; y < 0.8; y += 0.75) bx(cd, x0 - 0.05, x1 + 0.05, y, y + 0.08, -ZF1 - 0.65, ZF1 + 0.65); }
    B.flush(g); return g; }};

// =====================================================================================================================
// ===== Coleman Bridge (1990 twin-deck rebuild of the 1886 iron bridge by Municipal Engineer J. MacRitchie, keeping its
// look): on the faces of both decks the white arched girders of 1886 - a 76 ft centre span between two 38 ft side
// spans, the curved lower flange making three arches on two river piers (set parallel to the skewed banks) -, iron
// balustrades along the outer pavements and the ornamental cast-iron lamp posts. The app draws the two carriageways
// (Eu Tong Sen Street westbound, New Bridge Road / Hill Street eastbound, 7.8 m apart) from the real road data; the
// model dresses their edges. Local axes: +x from Hill Street (north bank) to New Bridge Road (south bank), +z upstream
// (west): Eu Tong Sen Street at z = +8.85, New Bridge Road at z = -8.94.
LANDMARKS.sgcoleman = {zh:'哥里门桥', en:'Coleman Bridge', cat:'old', r:48, h:9, water:true,
  lt:{m:0, c:'#ffe6c2', k:0.9, e:0.6, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB();
    const wh = B.p('#eeece4'), wd = B.p('#d6d3c8'), gr = B.p('#b8b1a3'), ir = B.p('#26302d'), ln = B.p({c:'#fff1d0', glow:'#ffd9a0', gk:1.7});
    const ydE = mono([[-33.5, 0], [-8.9, 3.0], [14.4, 3.4], [37.4, 2.8], [60.8, 0]]);
    const ydN = mono([[-40.6, 0], [-16.0, 3.0], [8.9, 3.0], [33.6, 0]]);
    // river banks (skewed): x_n(z), x_s(z) where the water starts / ends
    const xN = z => -24.4 + 0.38*z, xS = z => 24.35 + 0.39*z, WL = -0.35;
    const deck = (yd, zc, sd) => {     // sd: side of the outer pavement (+1 / -1)
      const zi = zc - sd*5.0, zo = zc + sd*5.0, zp = zc + sd*7.4;    // ribbon edges (10 m) and the pavement edge
      // arched fascia girders on both faces of the deck
      for (const zf of [zi, zp]){ const x0 = xN(zf), x1 = xS(zf), L = x1 - x0, P1 = x0 + 0.25*L, P2 = x0 + 0.75*L;
        const arch = x => { const sp = x < P1 ? [x0, P1] : x < P2 ? [P1, P2] : [P2, x1], c = (sp[0] + sp[1])/2, h = (sp[1] - sp[0])/2, t = (x - c)/h;
          const crown = yd(c) - (x < P1 || x >= P2 ? 0.75 : 0.9); return WL + 0.5 + (crown - WL - 0.5)*Math.sqrt(Math.max(0, 1 - t*t)); };
        const n = 48, s = zf === zp ? sd : -sd;
        for (let i = 0; i < n; i++){ const xa = x0 + L*i/n, xb = x0 + L*(i + 1)/n;
          for (const dz of [0, s*0.35]) Q(wh, [xa, arch(xa), zf + dz], [xb, arch(xb), zf + dz], [xb, yd(xb) + 0.25, zf + dz], [xa, yd(xa) + 0.25, zf + dz]);
          Q(wd, [xa, arch(xa), zf], [xb, arch(xb), zf], [xb, arch(xb), zf + s*0.35], [xa, arch(xa), zf + s*0.35]);
          // the flange moulding following the arches and the top cornice
          Q(wd, [xa, arch(xa) - 0.05, zf + s*0.45], [xb, arch(xb) - 0.05, zf + s*0.45], [xb, arch(xb) + 0.3, zf + s*0.45], [xa, arch(xa) + 0.3, zf + s*0.45]);
          Q(wd, [xa, yd(xa), zf + s*0.5], [xb, yd(xb), zf + s*0.5], [xb, yd(xb) + 0.32, zf + s*0.5], [xa, yd(xa) + 0.32, zf + s*0.5]); }
        // decorative roundels in the spandrels
        for (const [a, b] of [[x0, P1], [P1, P2], [P2, x1]]) for (const xr of [a + 0.12*(b - a), b - 0.12*(b - a)]){ const yr = (arch(xr) + yd(xr))/2 + 0.1, rr = Math.min(0.45, (yd(xr) - arch(xr))*0.3); if (rr < 0.15) continue;
          for (let k = 0; k < 10; k++){ const p = k/10*TAU, q = (k + 1)/10*TAU; T3(wd, [xr, yr, zf + s*0.5], [xr + Math.cos(p)*rr, yr + Math.sin(p)*rr, zf + s*0.5], [xr + Math.cos(q)*rr, yr + Math.sin(q)*rr, zf + s*0.5]); } }
        // piers in the river (and the springing blocks at the banks)
        for (const xp of [P1, P2]) bx(gr, xp - 0.9, xp + 0.9, -4, WL + 0.9, Math.min(zf, zf + s*0.6) - 0.3, Math.max(zf, zf + s*0.6) + 0.3);
      }
      // pier walls under the deck between the two faces (parallel to the banks)
      for (const f of [0.25, 0.75]){ const xa = xN(zi) + f*(xS(zi) - xN(zi)), xb = xN(zp) + f*(xS(zp) - xN(zp));
        Q(gr, [xa - 0.8, -4, zi], [xb - 0.8, -4, zp], [xb - 0.8, WL + 0.7, zp], [xa - 0.8, WL + 0.7, zi]); Q(gr, [xa + 0.8, -4, zi], [xb + 0.8, -4, zp], [xb + 0.8, WL + 0.7, zp], [xa + 0.8, WL + 0.7, zi]); Q(gr, [xa - 0.8, WL + 0.7, zi], [xb - 0.8, WL + 0.7, zp], [xb + 0.8, WL + 0.7, zp], [xa + 0.8, WL + 0.7, zi]); }
      // the outer pavement (slab) and its iron balustrade, lamp posts at the piers and abutments
      const xa = xN(zp) - 7, xb = xS(zp) + 7, za = Math.min(zo, zp), zb = Math.max(zo, zp);
      stripX(wd, yd, xa, xb, 34, za, zb, -0.3, 0.15);
      const zr = zp - sd*0.15;
      stripX(ir, yd, xa, xb, 34, zr - 0.05, zr + 0.05, 1.0, 1.1); stripX(ir, yd, xa, xb, 34, zr - 0.04, zr + 0.04, 0.25, 0.32);
      for (let x = xa + 0.2; x < xb; x += 0.32) segP(ir, [x, yd(x) + 0.15, zr], [x, yd(x) + 1.0, zr], 0.022, 3);
      for (let x = xa; x <= xb + 0.01; x += (xb - xa)/12){ segP(ir, [x, yd(x) + 0.15, zr], [x, yd(x) + 1.15, zr], 0.07, 4); for (const d of [-1, 1]) segP(ir, [x, yd(x) + 0.3, zr], [x + d*0.5, yd(x) + 0.95, zr], 0.02, 3); }
      const L0 = xS(zp) - xN(zp);
      for (const f of [-0.06, 0.25, 0.5, 0.75, 1.06]){ const x = xN(zp) + f*L0, z = zp - sd*0.5; bx(wd, x - 0.35, x + 0.35, yd(x) + 0.15, yd(x) + 0.75, z - 0.35, z + 0.35); lampStd(ir, ln, x, yd(x) + 0.75, z, 4.4, 1); }
      // abutment walls along both banks under the deck ends
      for (const xf of [xN, xS]){ const x1 = xf(zi), x2 = xf(zp), sx = xf === xN ? -1 : 1;
        Q(gr, [x1, -4, zi], [x2, -4, zp], [x2, Math.min(yd(x2), 1.2), zp], [x1, Math.min(yd(x1), 1.2), zi]);
        Q(gr, [x1 + sx*2.5, -4, zi], [x2 + sx*2.5, -4, zp], [x2 + sx*2.5, Math.min(yd(x2 + sx*2.5), 1.2), zp], [x1 + sx*2.5, Math.min(yd(x1 + sx*2.5), 1.2), zi]); }
    };
    deck(ydE, 8.85, 1); deck(ydN, -8.94, -1);
    B.flush(g); return g; }};

// =====================================================================================================================
// ===== Alkaff Bridge (1997/99, 55 m steel truss footbridge at Robertson Quay shaped like a tongkang - a lighter boat -
// painted in 2004 by Pacita Abad: white ground, six sections in yellow, pink, red, green, blue and orange, ~2,350
// painted circles): two side trusses flaring out like a hull, the top chord rising to bow and stern at both ends,
// the bottom chord sagging below the deck like a keel, Warren diagonals and verticals, the timber-coloured deck
// with a gentle hump, concrete landings on both banks. The model carries its own deck (replaces the app's path).
// Local axes: +x from the Robertson Quay (north-west) bank to the south-east bank, +z the upstream (south-west) side.
LANDMARKS.sgalkaff = {zh:'阿卡夫桥', en:'Alkaff Bridge', cat:'new', r:34, h:5, water:true,
  lt:{m:0, c:'#fff2dc', k:0.85, e:0.7, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), V = mkV();
    const dk = B.p('#a08d72'), cn = B.p('#c9c3b6'), rl = B.p('#f2f0ea'), ln = B.p({c:'#fff6e0', glow:'#ffe9c0', gk:1.2});
    const XE = 29.4, yd = x => -0.45 + 2.85*(1 - Math.pow(Math.min(1, Math.abs(x)/XE), 2)), HW = 2.1;
    const yt = x => yd(x) + 1.2 + 3.0*Math.pow(Math.min(1, Math.abs(x)/XE), 2.6);
    const yb = x => yd(x) - 0.5 - 1.9*(1 - Math.pow(Math.min(1, Math.abs(x)/XE), 2));
    const zt = x => HW + 0.75 + 0.3*Math.pow(Math.abs(x)/XE, 2), zb = HW - 0.1;
    const COL = ['#f3c623', '#ef7fb0', '#e23b3b', '#3fae5a', '#2f78c8', '#f28a2e'].map(rgb), WHT = rgb('#f4f2ec');
    const secC = x => COL[Math.min(5, Math.floor((x + XE)/(2*XE)*6))];
    // deck with a hump, edge girders and the cross beams below
    const N = 28;
    for (let i = 0; i < N; i++){ const xa = -XE + 2*XE*i/N, xb = -XE + 2*XE*(i + 1)/N;
      Q(dk, [xa, yd(xa), -HW], [xb, yd(xb), -HW], [xb, yd(xb), HW], [xa, yd(xa), HW]);
      for (const s of [-1, 1]){ const c = secC((xa + xb)/2);
        // the side truss chords (coloured by section), top chord flared outwards
        const ta = [xa, yt(xa), s*zt(xa)], tb = [xb, yt(xb), s*zt(xb)], ba = [xa, yb(xa), s*zb], bb = [xb, yb(xb), s*zb];
        VQ(V, c, [ta[0], ta[1] - 0.35, ta[2]], [tb[0], tb[1] - 0.35, tb[2]], tb, ta); VQ(V, c, ta, tb, [tb[0], tb[1], tb[2] - s*0.35], [ta[0], ta[1], ta[2] - s*0.35]);
        VQ(V, c, [ba[0], ba[1], ba[2]], [bb[0], bb[1], bb[2]], [bb[0], bb[1] + 0.45, bb[2]], [ba[0], ba[1] + 0.45, ba[2]]); VQ(V, c, ba, bb, [bb[0], bb[1], bb[2] - s*0.3], [ba[0], ba[1], ba[2] - s*0.3]);
        // the "hull" plating under the deck from the keel chord up to the deck edge (white with colour)
        VQ(V, WHT, [xa, yb(xa) + 0.45, s*zb], [xb, yb(xb) + 0.45, s*zb], [xb, yd(xb) - 0.05, s*(HW - 0.05)], [xa, yd(xa) - 0.05, s*(HW - 0.05)]);
        // handrail inside the truss
        segP(rl, [xa, yd(xa) + 1.05, s*(HW - 0.05)], [xb, yd(xb) + 1.05, s*(HW - 0.05)], 0.04, 4); }
    }
    // truss members: verticals at every panel point and alternating diagonals (Warren), white with colour bands
    const NP = 20;
    for (let k = 0; k <= NP; k++){ const x = -XE + 2*XE*k/NP, c = secC(Math.min(XE - 0.1, x));
      for (const s of [-1, 1]){ const t = [x, yt(x) - 0.3, s*(zt(x) - 0.15)], b = [x, yb(x) + 0.4, s*(zb + 0.1)];
        const v0 = [], o = mkV(); segP(v0, b, t, 0.12, 4); for (let i = 0; i < v0.length; i += 9) VT(V, k % 2 ? WHT : c, v0.slice(i, i + 3), v0.slice(i + 3, i + 6), v0.slice(i + 6, i + 9));
        if (k < NP){ const xn = -XE + 2*XE*(k + 1)/NP, a = k % 2 ? [x, yb(x) + 0.4, s*(zb + 0.1)] : [x, yt(x) - 0.3, s*(zt(x) - 0.15)], bb = k % 2 ? [xn, yt(xn) - 0.3, s*(zt(xn) - 0.15)] : [xn, yb(xn) + 0.4, s*(zb + 0.1)];
          const d0 = []; segP(d0, a, bb, 0.1, 4); for (let i = 0; i < d0.length; i += 9) VT(V, c, d0.slice(i, i + 3), d0.slice(i + 3, i + 6), d0.slice(i + 6, i + 9)); }
        // painted circles on the outer face of the hull plating (four sizes)
        if (k < NP){ const xm = x + XE/NP, ym = (yb(xm) + yd(xm))/2 + 0.1, r = [0.22, 0.3, 0.38, 0.26][k % 4], cc = COL[(k + (s > 0 ? 2 : 4)) % 6], zz = s*(zb + (HW - zb)*0.5 + 0.12);
          for (let q = 0; q < 8; q++){ const p0 = q/8*TAU, p1 = (q + 1)/8*TAU; VT(V, cc, [xm, ym, zz], [xm + Math.cos(p0)*r, ym + Math.sin(p0)*r, zz], [xm + Math.cos(p1)*r, ym + Math.sin(p1)*r, zz]); } } } }
    // overhead cross ties at bow and stern and a few along the span
    for (const x of [-26.5, -13, 0, 13, 26.5]) if (yt(x) - yd(x) > 2.3){ const v0 = []; segP(v0, [x, yt(x) - 0.2, -zt(x) + 0.2], [x, yt(x) - 0.2, zt(x) - 0.2], 0.09, 4); for (let i = 0; i < v0.length; i += 9) VT(V, WHT, v0.slice(i, i + 3), v0.slice(i + 3, i + 6), v0.slice(i + 6, i + 9)); }
    // bow / stern posts and the landings on both banks
    for (const s of [-1, 1]){ const x = s*XE;
      bx(cn, Math.min(x, x + s*4.5), Math.max(x, x + s*4.5), -1.5, -0.45, -HW - 0.6, HW + 0.6);
      bx(cn, Math.min(x - s*1.8, x + s*0.6), Math.max(x - s*1.8, x + s*0.6), -2.5, yd(x - s*1.8) - 0.2, -HW - 1.0, HW + 1.0);
      for (const sz of [-1, 1]){ segP(rl, [x + s*0.8, -0.45, sz*(HW + 0.3)], [x + s*0.8, 3.0, sz*(HW + 0.3)], 0.08, 6); latheP(ln, [[0.01, 3.0], [0.18, 3.05], [0.2, 3.4], [0.01, 3.5]], x + s*0.8, sz*(HW + 0.3), 6); } }
    // low deck lights along the handrails
    for (let x = -24; x <= 24; x += 8) for (const s of [-1, 1]) bx(ln, x - 0.12, x + 0.12, yd(x) + 0.95, yd(x) + 1.1, s*(HW - 0.15) - 0.05, s*(HW - 0.15) + 0.05);
    vFlush(g, V, {c:'#ffffff', lk:0.9}); B.flush(g); return g; }};
// Chinese hip-and-gable style roof on a rectangle (x0..x1, z0..z1) at eaves y, rise h, overhang ov, upswept corners
const cnRoof = (o, oR, x0, x1, z0, z1, y, h, ov, lift) => {
  x0 -= ov; x1 += ov; z0 -= ov; z1 += ov; lift = lift || 0.6;
  const L = x1 - x0, W = z1 - z0, cx = (x0 + x1)/2, cz = (z0 + z1)/2, k = Math.max(0, (L - W)/2);
  const a = [cx - k, y + h, cz], b = [cx + k, y + h, cz], C = [[x0, y + lift, z0], [x1, y + lift, z0], [x1, y + lift, z1], [x0, y + lift, z1]];
  const E = [[cx, y, z0], [cx, y, z1], [x0, y, cz], [x1, y, cz]];
  // each slope as two quads sagging to the middle of the eave (concave profile)
  const mid = (p, q) => [(p[0] + q[0])/2, (p[1] + q[1])/2 - 0.15*h, (p[2] + q[2])/2];
  Q(o, C[3], E[1], mid(E[1], b), mid(C[3], a)); Q(o, E[1], C[2], mid(C[2], b), mid(E[1], b)); Q(o, mid(C[3], a), mid(E[1], b), b, a); Q(o, mid(E[1], b), mid(C[2], b), b, b);
  Q(o, C[1], E[0], mid(E[0], a), mid(C[1], b)); Q(o, E[0], C[0], mid(C[0], a), mid(E[0], a)); Q(o, mid(C[1], b), mid(E[0], a), a, b); Q(o, mid(E[0], a), mid(C[0], a), a, a);
  T3(o, C[0], C[3], a); T3(o, C[2], C[1], b);
  if (oR){ segP(oR, [a[0] - 0.6, a[1] + 0.12, a[2]], [b[0] + 0.6, b[1] + 0.12, b[2]], 0.18, 5); for (const p of C) segP(oR, p, p[0] < cx ? a : b, 0.1, 4);
    for (const e of [a, b]) segP(oR, [e[0] + (e === a ? -0.6 : 0.6), e[1], e[2]], [e[0] + (e === a ? -0.9 : 0.9), e[1] + 0.7, e[2]], 0.14, 4); }
};
// octagonal prism (radius r to the corners) between y0 and y1 at (x, z) into a batch
const oct = (o, x, z, r, y0, y1) => latheP(o, [[r, y0], [r, y1], [0.01, y1]], x, z, 8, PI/8);

// =====================================================================================================================
// ===== Masjid Jamae (Chulia) (1826-35, built by the Chulia Muslims from the Coromandel coast; South Bridge Road): the
// entrance gatehouse on South Bridge Road - a two-storey "miniature palace" front with a row of tiny arched windows
// and a crenellated parapet - between two slender octagonal minarets of seven tiers with niches, cornices and
// onion-domed caps (South Indian Muslim style, like Nagore Dargah), white with mint-green details; the passage and
// courtyard behind; the prayer hall with Tuscan pilasters, arched openings and a two-tier hipped tiled roof; the
// two-storey annex on the south side. Footprint from OSM (the gatehouse is extended to its real width along South
// Bridge Road). Local axes: +x east, +z south (rot 0); the gate faces east-south-east.
LANDMARKS.sgjamae = {zh:'詹美回教堂', en:'Masjid Jamae (Chulia)', cat:'old', r:40, h:23,
  lt:{m:0, c:'#fff0d8', k:0.85, e:0.5, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB();
    const wh = B.p('#f3f0e6'), wd = B.p('#dcd8cb'), mg = B.p('#9fd1b5'), dg = B.p('#4f8f72'), rf = B.p('#9c5a42'), dk = B.p('#3a3a36'), gl = B.p({c:'#5a4a35', glow:'#ffd890', gk:0.8}), gd = B.p({c:'#d9c27a', m:0, lk:0.8});
    const O = [5.25, 1.65], L = p => [p[0] - O[0], p[1] - O[1]];
    // ---- prayer hall: walls with pilasters and arched openings, two-tier hipped roof
    const H = [[-27.6, 5.5], [-21.6, -20.0], [23.2, -10.0], [21.4, -1.7], [20.2, 7.2], [18.4, 16.1], [-6.1, 10.8], [-12.1, 9.0]].map(L);
    prismP(wh, H, -5, 8.2); bandP(wd, H, 8.2, 0.5, 0.25); bandP(wd, H, -5, 5.6, 0.12);
    for (const F of edgesOut(H)){ if (F.L < 4) continue; const n = Math.max(1, Math.round(F.L/3.6)), w = F.L/n;
      for (let i = 0; i <= n; i++) fbx(wd, F, i*w - 0.25, i*w + 0.25, 0.6, 8.0, 0, 0.3);
      for (let i = 0; i < n; i++){ const uc = (i + 0.5)*w; farch(dk, F, uc, 0.9, Math.min(1.8, w*0.5), 3.6, 0.04); farch(dk, F, uc, 4.9, Math.min(1.2, w*0.35), 6.6, 0.04); frect(mg, F, uc - Math.min(1.8, w*0.5)/2 - 0.1, uc + Math.min(1.8, w*0.5)/2 + 0.1, 4.2, 4.4, 0.06); } }
    // roofs: lower tier over the whole hall (on its bounding rectangle in the hall's own axes), upper clerestory tier
    { const ax = mainAxis(H), ay = [-ax[1], ax[0]]; let s0 = 1e9, s1 = -1e9, t0 = 1e9, t1 = -1e9; for (const p of H){ const s = p[0]*ax[0] + p[1]*ax[1], t = p[0]*ay[0] + p[1]*ay[1]; s0 = Math.min(s0, s); s1 = Math.max(s1, s); t0 = Math.min(t0, t); t1 = Math.max(t1, t); }
      const ry = Math.atan2(-ax[1], ax[0]), rr = mkB(), ro = rr.p('#9c5a42'), rc = rr.p('#4f8f72'), cw = rr.p('#f3f0e6'), cd = rr.p('#dcd8cb');
      const sm = (s0 + s1)/2, tm = (t0 + t1)/2, Lh = (s1 - s0)/2 - 1.5, Wh = (t1 - t0)/2 - 1.5;
      hipR(ro, -Lh, Lh, -Wh, Wh, 8.7, 3.6, 0.9, rc);
      bx(cw, -Lh*0.55, Lh*0.55, 10.2, 12.4, -Wh*0.45, Wh*0.45); for (let x = -Lh*0.55 + 1.2; x < Lh*0.55 - 0.6; x += 2.2) for (const z of [-Wh*0.45 - 0.02, Wh*0.45 + 0.02]) bx(gl, x - 0.4, x + 0.4, 10.8, 11.9, z - 0.03, z + 0.03);
      hipR(ro, -Lh*0.55, Lh*0.55, -Wh*0.45, Wh*0.45, 12.4, 2.6, 0.7, rc);
      const sub = new THREE.Group(); rr.flush(sub); sub.rotation.y = ry; sub.position.set(ax[0]*sm + ay[0]*tm, 0, ax[1]*sm + ay[1]*tm); g.add(sub); }
    // ---- south annex (two storeys, hipped roof)
    const A2 = [[-12.1, 9.0], [-6.1, 10.8], [-6.7, 12.6], [-2.5, 14.4], [-4.3, 23.3], [-11.5, 22.7], [-13.9, 20.9]].map(L);
    prismP(wh, A2, -5, 7.0); bandP(wd, A2, 3.3, 0.3, 0.12); bandP(wd, A2, 7.0, 0.4, 0.2); gridWins(dk, A2, 0, 7, 3.5, 2.6, 1.0, 2.0, 0.8, 0.04);
    pyrR(rf, inset(A2, -0.5), 7.4, 2.4, 0);
    // ---- the passage from the gate (single storey with a parapet)
    const P2 = [[20.2, 7.2], [21.4, -1.7], [28.5, 0.7], [32.1, 9.0]].map(L);
    prismP(wh, P2, -5, 5.2); bandP(mg, P2, 5.2, 0.5, 0.12);
    // ---- the gatehouse on South Bridge Road between the two minarets
    const fr0 = L([38.1, 6.1]), dir = [-0.477, 0.879], inw = [-0.879, -0.477], GW = 11.0, GD = 6.8;
    const P = (u, d) => [fr0[0] + dir[0]*u + inw[0]*d, fr0[1] + dir[1]*u + inw[1]*d];
    const G4 = [P(0, 0), P(GW, 0), P(GW, GD), P(0, GD)];
    prismP(wh, G4, -5, 9.2); bandP(mg, G4, 4.4, 0.35, 0.18); bandP(wd, G4, 8.6, 0.6, 0.3);
    const F = fc(G4[0][0], G4[0][1], G4[1][0], G4[1][1]);     // front face: u along South Bridge Road, d outwards (to the street)
    const fo = F.nx*dir[1] - F.nz*dir[0];                      // sign of the outward normal relative to the street side
    const so = (F.nx*(-inw[0]) + F.nz*(-inw[1])) > 0 ? 1 : -1;
    // central arched gateway with a green surround, small arched windows above, crenellated "palace" parapet
    farch(dk, F, GW/2, 0, 3.0, 2.9, so*0.05); fbx(mg, F, GW/2 - 2.0, GW/2 - 1.6, 0, 4.3, 0, so*0.3); fbx(mg, F, GW/2 + 1.6, GW/2 + 2.0, 0, 4.3, 0, so*0.3);
    for (const uc of [2.9, 9.5]){ farch(dk, F, uc, 1.0, 1.4, 2.6, so*0.05); }
    for (let i = 0; i < 7; i++){ const uc = 2.6 + i*1.2; farch(gl, F, uc, 5.4, 0.55, 6.5, so*0.05); fbx(mg, F, uc - 0.4, uc + 0.4, 5.15, 5.35, 0, so*0.12); }
    for (let i = 0; i < 9; i++){ const uc = 2.2 + i*1.0; fbx(wh, F, uc - 0.25, uc + 0.25, 9.2, 10.0, -so*0.1, so*0.15); latheP(mg, [[0.12, 10.0], [0.2, 10.2], [0.01, 10.6]], ...[fp(F, uc, 0, 0)[0], fp(F, uc, 0, 0)[2]], 6); }
    // central raised pediment with a small dome
    fbx(wh, F, GW/2 - 1.6, GW/2 + 1.6, 9.2, 11.0, -so*0.2, so*0.3); { const c = fp(F, GW/2, 0, 0); latheP(mg, [[0.9, 11.0], [1.0, 11.4], [0.8, 12.1], [0.3, 12.6], [0.08, 13.1], [0.01, 13.4]], c[0], c[2], 10); }
    // ---- the two minarets at the front corners: seven octagonal tiers with niches and cornices, onion domes
    for (const u of [0, GW]){ const c = P(u, 0.6), x = c[0], z = c[1];
      oct(wh, x, z, 2.0, -5, 2.0); oct(wd, x, z, 2.2, 2.0, 2.4);
      let y = 2.4, r = 1.75;
      for (let t = 0; t < 7; t++){ const h = t === 0 ? 3.2 : 2.35 - t*0.08;
        oct(wh, x, z, r, y, y + h);
        for (let k = 0; k < 8; k++){ const a = k/8*TAU, rf2 = r*0.924, Fk = fc(x + Math.cos(a)*rf2 - Math.sin(a)*0.5, z + Math.sin(a)*rf2 + Math.cos(a)*0.5, x + Math.cos(a)*rf2 + Math.sin(a)*0.5, z + Math.sin(a)*rf2 - Math.cos(a)*0.5);
          farch(t % 2 ? dk : mg, Fk, 0.5, y + 0.45, Math.min(0.62, r*0.5), y + h - 0.55, 0.03); }
        oct(t % 2 ? wd : mg, x, z, r + 0.28, y + h, y + h + 0.22); y += h + 0.22; r *= 0.93; }
      latheP(mg, [[r + 0.1, y], [r + 0.35, y + 0.6], [r + 0.25, y + 1.2], [r*0.55, y + 1.8], [0.15, y + 2.3], [0.06, y + 2.6], [0.01, y + 2.65]], x, z, 12);
      segP(gd, [x, y + 2.5, z], [x, y + 3.6, z], 0.05, 4); latheP(gd, [[0.01, y + 3.0], [0.14, y + 3.1], [0.01, y + 3.25]], x, z, 6); }
    // ---- the corner shophouse at Mosque Street / South Bridge Road next to the gate (kept with the mosque's ground plan)
    { const W = mkV(), R = mkV(), rng = LMCTX.rng, Ps = [[43.5, -2.8], [38.1, 6.1], [28.5, 0.7], [33.9, -8.2]].map(L), D = mainAxis(Ps);
      const c = {wall:rgb('#e9d9a8'), trim:C_TRIM, shut:rgb('#3e6a53'), roof:C_ROOF}, o = {gl:B.p('#2a3236'), gll:gl, shop:B.p({c:'#4d3b2c', glow:'#ffc070', gk:1.0})};
      const r = pitched(W, R, Ps, D, 1, 0, 4.0 + 2*3.4, 2.2, c.wall, c.roof);
      for (const e of r.E) if (e.along < 0.5) facadeE(e, 0, 4.0, 3.4, 3, c, o, W, R, rng, {pLit:0.3});
      vFlush(g, W, {c:'#ffffff'}); vFlush(g, R, {c:'#ffffff', lk:0.12}); }
    B.flush(g); return g; }};

// =====================================================================================================================
// ===== The Majestic (1928, Swan & Maclaren for Eu Tong Sen; the Tien Yien Moh Toi Cantonese opera house, later the
// Majestic Theatre): a cream four-storey front on Eu Tong Sen Street mixing Western and Chinese forms - a five-bay
// arcaded five-foot way, a central tower bay rising above the parapet under a green-tiled Chinese hip-and-gable
// roof, two corner pavilions with small green roofs, green-glazed pent roofs at the floor bands, rows of
// colourful porcelain panels with Cantonese opera scenes (abstract colour fields here) and the dragon mosaics; the
// auditorium hall (domed ceiling inside) behind under a long hipped roof. Footprint from OSM. Local axes: +x along
// the front (south-west -> north-east), +z towards Eu Tong Sen Street (south-east).
LANDMARKS.sgmajestic = {zh:'大华戏院', en:'The Majestic', cat:'old', r:28, h:26,
  lt:{m:0, c:'#ffe7c4', k:0.85, e:0.55, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), V = mkV(), rng = LMCTX.rng;
    const cr = B.p('#efe6cf'), cd = B.p('#d9ccaa'), gt = B.p({c:'#3f8a5c', m:0, lk:0.45}), gr = B.p('#8f9890'), dk = B.p('#2e3236'), gl = B.p({c:'#ffe2b0', glow:'#ffcf8c', gk:0.9}), rd = B.p('#a33a2c'), au = B.p({c:'#d8b25a', m:0, lk:0.8});
    const W2 = 13.95, ZF = 23.05, ZB = -23.05, DF = 10;      // half width, front / back, depth of the front block
    // auditorium (behind) and its long hipped roof
    bx(cr, -W2, W2, -5, 15.5, ZB, ZF - DF); bandP(cd, [[-W2, ZB], [W2, ZB], [W2, ZF - DF], [-W2, ZF - DF]], 15.5, 0.6, 0.25);
    hipR(gr, -W2 + 0.6, W2 - 0.6, ZB + 0.6, ZF - DF - 0.2, 16.0, 5.5, 0.6);
    const sideF = [fc(-W2, ZB, -W2, ZF - DF), fc(W2, ZF - DF, W2, ZB)];
    for (const Fs of sideF){ fpil(cd, Fs, 1, Fs.L - 1, 6, 0, 15.5, 0.6, 0.25); for (let i = 0; i < 6; i++){ const uc = 1 + (i + 0.5)*(Fs.L - 2)/6; frect(dk, Fs, uc - 0.8, uc + 0.8, 9.5, 13.0, 0.05); } }
    // front block: four storeys
    const FY = [0, 5.2, 9.4, 13.4, 17.4];
    bx(cr, -W2, W2, -5, FY[4], ZF - DF, ZF - 2.6);
    bx(cr, -W2, W2, 4.6, FY[4], ZF - 2.6, ZF);                 // upper floors over the five-foot way
    const F = fc(-W2, ZF, W2, ZF);                             // front face, u from -W2, d towards the street (+z)
    // arcade of the five-foot way: six piers, five arches; shop fronts behind (lit)
    farcade(cr, F, 0, 2*W2, 5, 0, 3.2, 5.2, 1.1, -0.2, 0.3, 6);
    frect(gl, F, 0.6, 2*W2 - 0.6, 0.1, 3.6, -2.55);
    // floor bands with green pent roofs, windows in five bays, porcelain panels (colour fields) between the floors
    const PANEL = ['#c8432f', '#e2a43a', '#3d7fb8', '#3f9a62', '#d86b8f', '#f0d27a'].map(rgb);
    for (let f = 1; f < 4; f++){ const y = FY[f], y1 = FY[f + 1];
      // green-glazed pent roof along the floor line (sloping out over the street)
      const ya = y + 0.15; Q(gt, fp(F, -0.3, ya + 0.9, 0), fp(F, 2*W2 + 0.3, ya + 0.9, 0), fp(F, 2*W2 + 0.5, ya, 1.35), fp(F, -0.5, ya, 1.35));
      fbx(cd, F, -0.1, 2*W2 + 0.1, ya - 0.35, ya, 0, 1.25);
      for (let i = 0; i < 5; i++){ const uc = (i + 0.5)*2*W2/5;
        frect(rng() < 0.4 ? gl : dk, F, uc - 1.05, uc + 1.05, y + 1.3, y + 1.3 + (y1 - y)*0.5, 0.05);
        fbx(cd, F, uc - 1.25, uc + 1.25, y + 1.05, y + 1.3, 0, 0.18);
        // porcelain panel band above each window
        const py = y + 1.45 + (y1 - y)*0.5, ph = Math.min(0.9, y1 - py - 0.25);
        for (let k = 0; k < 3; k++) vfrect(V, PANEL[Math.floor(rng()*PANEL.length)], F, uc - 1.05 + k*0.7, uc - 1.05 + (k + 1)*0.7 - 0.06, py, py + ph, 0.06); }
      fpil(cd, F, 0, 2*W2, 5, y, y1, 0.55, 0.22); }
    // parapet with a green tiled coping, corner pavilions and the central tower bay
    fbx(cr, F, -0.2, 2*W2 + 0.2, FY[4], FY[4] + 1.1, -0.3, 0.2); Q(gt, fp(F, -0.4, FY[4] + 1.5, -0.4), fp(F, 2*W2 + 0.4, FY[4] + 1.5, -0.4), fp(F, 2*W2 + 0.5, FY[4] + 1.05, 0.5), fp(F, -0.5, FY[4] + 1.05, 0.5));
    for (const xc of [-W2 + 2.2, W2 - 2.2]){ bx(cr, xc - 2.0, xc + 2.0, FY[4], FY[4] + 3.0, ZF - 4.0, ZF); frect(dk, F, xc + W2 - 0.9, xc + W2 + 0.9, FY[4] + 0.6, FY[4] + 2.3, 0.04);
      for (const xx of [xc - 1.8, xc + 1.8]) for (const zz of [ZF - 3.8, ZF - 0.2]) bx(rd, xx - 0.17, xx + 0.17, FY[4] + 3.0, FY[4] + 4.3, zz - 0.17, zz + 0.17);
      cnRoof(gt, au, xc - 2.0, xc + 2.0, ZF - 4.0, ZF, FY[4] + 4.3, 1.8, 0.7, 0.4); }
    // central tower bay: projects slightly, rises to a tiled hip-and-gable roof with gilded ridge ends
    bx(cr, -4.2, 4.2, FY[3], FY[4] + 4.2, ZF - 6, ZF + 0.35);
    { const Fc = fc(-4.2, ZF + 0.35, 4.2, ZF + 0.35);
      frect(dk, Fc, 1.5, 6.9, FY[4] + 0.4, FY[4] + 3.2, 0.04);
      // the dragon mosaic: a colour band across the tower (abstract)
      for (let k = 0; k < 8; k++) vfrect(V, PANEL[(k*5) % 6], Fc, 0.3 + k*0.98, 0.3 + (k + 1)*0.98 - 0.08, FY[3] + 0.5, FY[3] + 1.6, 0.06);
      bx(rd, -4.4, -3.6, FY[4] + 4.2, FY[4] + 5.6, ZF - 0.2, ZF + 0.5); bx(rd, 3.6, 4.4, FY[4] + 4.2, FY[4] + 5.6, ZF - 0.2, ZF + 0.5); }
    cnRoof(gt, au, -4.4, 4.4, ZF - 6.2, ZF + 0.5, FY[4] + 5.6, 2.6, 1.0, 0.6);
    // balconies with balustrades in front of the three middle bays (2nd and 3rd floors), finials along the parapet
    for (const f of [2, 3]){ const y = FY[f] + 0.25; fbx(cd, F, 2*W2/5, 2*W2*4/5, y - 0.2, y, 0, 1.0); fbal(cr, F, 2*W2/5 + 0.1, 2*W2*4/5 - 0.1, y, 1.0, 0.95, 0.16); }
    for (let i = 0; i <= 10; i++){ const u = 0.3 + i*(2*W2 - 0.6)/10; if (Math.abs(u - W2) < 4.6) continue; const p = fp(F, u, 0, -0.05); latheP(au, [[0.18, FY[4] + 1.5], [0.22, FY[4] + 1.75], [0.08, FY[4] + 2.1], [0.01, FY[4] + 2.25]], p[0], p[2], 6); }
    // windows on the flanks of the front block
    for (const Fs of [fc(-W2, ZF - DF, -W2, ZF), fc(W2, ZF, W2, ZF - DF)]) for (let f = 1; f < 4; f++) for (const uc of [3.0, 6.6]) frect(rng() < 0.4 ? gl : dk, Fs, uc - 0.8, uc + 0.8, FY[f] + 1.3, FY[f] + 3.0, 0.05);
    // the rear of the front block above the auditorium roof line
    bx(cr, -W2, W2, FY[4] - 0.5, FY[4] + 0.8, ZF - DF - 0.3, ZF - DF + 0.3);
    vFlush(g, V, {c:'#ffffff', m:0, lk:0.5}); B.flush(g); return g; }};
// ===== placements: WGS84 position of each local origin and rot = bearing of local +x (rad, counter-clockwise from east)
SG_PLACES.push(
  {type:'sgclarkequay', lat:1.290498, lon:103.845817, rot:0},   // centre of the five blocks' bbox (Read Bridge at the SW); +x east, +z south
  {type:'sgboatquay', lat:1.28721, lon:103.849494, rot:0},   // centre of the row's bbox (Elgin Bridge end to Bonham Street); +x east, +z south
  {type:'sgelgin', lat:1.2890736, lon:103.8493104, rot:-2.1294},   // mid-span between the carriageways; +x from North Bridge Road (north bank) to South Bridge Road, +z upstream
  {type:'sgcoleman', lat:1.2897652, lon:103.8480024, rot:-2.2393},   // mid-river between the two decks; +x from Hill Street (north bank) to New Bridge Road, +z upstream (Eu Tong Sen Street deck)
  {type:'sgalkaff', lat:1.2901172, lon:103.839966, rot:-0.5707},   // mid-span; +x from the Robertson Quay bank (north-west) to the south-east bank
  {type:'sgjamae', lat:1.2831711, lon:103.8454342, rot:0},   // centre of the footprint bbox; +x east, +z south; the gate faces South Bridge Road (east-south-east)
  {type:'sgmajestic', lat:1.2847067, lon:103.8432093, rot:0.8745}    // footprint centre; +x along the front (SW -> NE), +z towards Eu Tong Sen Street
);
}
