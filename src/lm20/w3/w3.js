// ===== lm20/w3: heritage landmarks (Cathedral of the Good Shepherd, Armenian Church, Peranakan Museum, Singapore Art
// Museum, Masjid Hajjah Fatimah, Malay Heritage Centre). Block-scoped: only LANDMARKS and SG_PLACES are touched.
// Real dimensions in metres, y = 0 is the ground; every plan is traced from the real OSM footprint in local axes (see the
// SG_PLACES line after each model for its origin and turn).
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
const latheP = function(o, prof, cx, cz, n, a0){
  a0 = a0 || 0; const R = prof.map(([r, y]) => { const ring = []; for (let i = 0; i < n; i++){ const t = a0 + i/n*TAU; ring.push([cx + Math.cos(t)*r, y, cz + Math.sin(t)*r]); } return ring; });
  for (let k = 0; k < R.length - 1; k++) for (let i = 0; i < n; i++){ const j = (i+1) % n; Q(o, R[k][i], R[k][j], R[k+1][j], R[k+1][i]); }
};
// plan polygon ([x, z]) walls between y0 and y1, and a flat cap (fan from the centroid: use for convex or star-shaped plans)
const wallsP = (o, P, y0, y1) => { for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; Q(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); } };
const capP = (o, P, y) => { let cx = 0, cz = 0; for (const p of P){ cx += p[0]/P.length; cz += p[1]/P.length; } for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; T3(o, [cx, y, cz], [a[0], y, a[1]], [b[0], y, b[1]]); } };
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
// hipped roof on the rectangle x0..x1, z0..z1 at eaves height y, rise h, overhang ov
const hipR = function(o, x0, x1, z0, z1, y, h, ov, oc, of){
  ov = ov || 0; x0 -= ov; x1 += ov; z0 -= ov; z1 += ov; const L = x1 - x0, W = z1 - z0, cx = (x0 + x1)/2, cz = (z0 + z1)/2;
  // the eaves drop a little below y so the overhang reads as a sloping roof edge
  const ye = y - ov*h/Math.max(1, Math.min(L, W)/2 - ov);
  let a, b;
  if (L >= W){ const k = (L - W)/2; a = [cx - k, y + h, cz]; b = [cx + k, y + h, cz];
    Q(o, [x0, ye, z1], [x1, ye, z1], b, a); Q(o, [x1, ye, z0], [x0, ye, z0], a, b); T3(o, [x0, ye, z0], [x0, ye, z1], a); T3(o, [x1, ye, z1], [x1, ye, z0], b); }
  else { const k = (W - L)/2; a = [cx, y + h, cz - k]; b = [cx, y + h, cz + k];
    Q(o, [x1, ye, z1], [x1, ye, z0], a, b); Q(o, [x0, ye, z0], [x0, ye, z1], b, a); T3(o, [x0, ye, z1], [x1, ye, z1], b); T3(o, [x1, ye, z0], [x0, ye, z0], a); }
  if (oc){ const r = 0.13, lift = (p) => [p[0], p[1] + 0.08, p[2]];
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
// gable with a hipped back end: ridge along z from the gable at z1 back to a hip at z0
const gabHipZ = function(o, ow, x0, x1, z0, z1, y, h, ov){
  ov = ov || 0; const cx = (x0 + x1)/2, hw = (x1 - x0)/2, zr = z0 + hw;
  Q(o, [x1 + ov, y, z1], [x1 + ov, y, z0 - ov], [cx, y + h, zr], [cx, y + h, z1]); Q(o, [x0 - ov, y, z0 - ov], [x0 - ov, y, z1], [cx, y + h, z1], [cx, y + h, zr]);
  T3(o, [x1 + ov, y, z0 - ov], [x0 - ov, y, z0 - ov], [cx, y + h, zr]);
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
  if (o.rise !== 0) hipR(P.rf, x0, x1, z0, z1, H, o.rise || 3.4, o.ov === undefined ? 0.9 : o.ov, P.rc, P.t);
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
      T3(P.rf, [cx, H + rise, cz], [ea[0], H, ea[1]], [eb[0], H, eb[1]]); if (P.rc) segP(P.rc, [ea[0], H + 0.08, ea[1]], [cx, H + rise + 0.08, cz], 0.13, 4); }
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

// ---------- extra helpers (w3) ----------
// concave plan polygons: triangulated caps and prisms
const tri2 = P => THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
const capC = (o, P, y) => { for (const [a, b, c] of tri2(P)) T3(o, [P[a][0], y, P[a][1]], [P[b][0], y, P[b][1]], [P[c][0], y, P[c][1]]); };
const prismC = (o, P, y0, y1) => { wallsP(o, P, y0, y1); capC(o, P, y1); };
const sArea = P => { let A = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; A += a[0]*b[1] - b[0]*a[1]; } return A/2; };
// outward faces of all edges of a plan polygon
const edgesOut = P => { const neg = sArea(P) < 0, out = []; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; out.push(neg ? fc(a[0], a[1], b[0], b[1]) : fc(b[0], b[1], a[0], a[1])); } return out; };
// face from A to B whose outward normal points away from point C
const fcAway = (a, b, c) => { const F = fc(a[0], a[1], b[0], b[1]); const mx = (a[0] + b[0])/2, mz = (a[1] + b[1])/2; return (F.nx*(mx - c[0]) + F.nz*(mz - c[1]) >= 0) ? F : fc(b[0], b[1], a[0], a[1]); };
const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t];
// transform the vertices pushed into a batch array after index i0 (x,y,z triples) with f([x,y,z]) -> [x,y,z]
const xfm = (o, i0, f) => { for (let i = i0; i < o.length; i += 3){ const p = f([o[i], o[i+1], o[i+2]]); o[i] = p[0]; o[i+1] = p[1]; o[i+2] = p[2]; } };
// regular n-gon prism walls (no caps) of circumradius r about (cx, cz)
const ngonP = (o, cx, cz, r, n, y0, y1, a0) => latheP(o, [[r, y0], [r, y1]], cx, cz, n, a0 || 0);
const discP = (o, cx, cz, r, n, y, a0) => { a0 = a0 || 0; for (let i = 0; i < n; i++){ const a = a0 + i/n*TAU, b = a0 + (i+1)/n*TAU; T3(o, [cx, y, cz], [cx + Math.cos(a)*r, y, cz + Math.sin(a)*r], [cx + Math.cos(b)*r, y, cz + Math.sin(b)*r]); } };
// faces of a regular n-gon (outward, flat sides), each of width 2 r sin(PI/n)
const ngonF = (cx, cz, r, n, a0) => { const out = []; a0 = a0 || 0; for (let i = 0; i < n; i++){ const a = a0 + i/n*TAU, b = a0 + (i+1)/n*TAU; out.push(fc(cx + Math.cos(b)*r, cz + Math.sin(b)*r, cx + Math.cos(a)*r, cz + Math.sin(a)*r)); } return out; };
// pyramid / hipped roof over a convex polygon to an apex (or ridge for rectangles: use hipR)
const pyrP = (o, P, y, apex, ov) => { const c = [0, 0]; for (const p of P){ c[0] += p[0]/P.length; c[1] += p[1]/P.length; }
  const E = P.map(p => { const dx = p[0] - c[0], dz = p[1] - c[1], L = Math.hypot(dx, dz) || 1; return [p[0] + dx/L*(ov || 0), p[1] + dz/L*(ov || 0)]; });
  for (let i = 0; i < E.length; i++){ const a = E[i], b = E[(i+1) % E.length]; T3(o, [c[0], apex, c[1]], [a[0], y, a[1]], [b[0], y, b[1]]); } };
// ---------- curved / bent ranges: inner polyline I (court side) and outer polyline O (same point count) ----------
// P = {w, t, dk, lit, rf, rc, rng}; o = {y0, H, nf, vd (verandah depth on the I side, 0 = none), bay, rise, ov, arch, endA, endB (close the ends)}
const strip = function(P, I, O, o){
  const y0 = o.y0 === undefined ? 0.6 : o.y0, H = o.H, nf = o.nf || 2, fh = (H - y0)/nf, vd = o.vd || 0, bay = o.bay || 3.6, rise = o.rise === undefined ? 3 : o.rise, ov = o.ov === undefined ? 0.8 : o.ov, n = I.length, rng = P.rng;
  const dir = I.map((p, i) => { const dx = O[i][0] - p[0], dz = O[i][1] - p[1], L = Math.hypot(dx, dz); return [dx/L, dz/L, L]; });
  const Iw = I.map((p, i) => [p[0] + dir[i][0]*vd, p[1] + dir[i][1]*vd]);   // inner wall line (behind the verandah)
  const M = I.map((p, i) => lerp2(p, O[i], 0.5));
  for (let i = 0; i < n - 1; i++){
    // foundation and verandah floor
    Q(P.w, [I[i][0], y0, I[i][1]], [I[i+1][0], y0, I[i+1][1]], [O[i+1][0], y0, O[i+1][1]], [O[i][0], y0, O[i][1]]);
    for (const L of [I, O]) Q(P.w, [L[i][0], -4, L[i][1]], [L[i+1][0], -4, L[i+1][1]], [L[i+1][0], y0, L[i+1][1]], [L[i][0], y0, L[i][1]]);
    // walls
    for (const L of [Iw, O]) Q(P.w, [L[i][0], y0, L[i][1]], [L[i+1][0], y0, L[i+1][1]], [L[i+1][0], H, L[i+1][1]], [L[i][0], H, L[i][1]]);
    Q(P.w, [Iw[i][0], H - 0.02, Iw[i][1]], [Iw[i+1][0], H - 0.02, Iw[i+1][1]], [O[i+1][0], H - 0.02, O[i+1][1]], [O[i][0], H - 0.02, O[i][1]]);
    const c = M[i], Fo = fcAway(O[i], O[i+1], lerp2(M[i], M[i+1], 0.5)), Fw = fcAway(Iw[i], Iw[i+1], lerp2(M[i], M[i+1], 0.5)), Fi = fcAway(I[i], I[i+1], lerp2(M[i], M[i+1], 0.5));
    // outer face: windows, string courses, cornice
    if (Fo.L > 2.4 && !o.noO){ fwins(P.dk, P.lit, Fo, 0.5, Fo.L - 0.5, bay, Array.from({length:nf}, (_, k) => [y0 + k*fh + (k ? 0.7 : 0.5), fh*0.58, o.arch === false ? 'r' : 'a', Math.min(1.5, bay*0.42)]), 0.05, rng, o.pl === undefined ? 0.25 : o.pl);
      for (let k = 1; k < nf; k++) fbx(P.t, Fo, -0.05, Fo.L + 0.05, y0 + k*fh - 0.3, y0 + k*fh + 0.1, -0.02, 0.22); }
    fbx(P.t, Fo, -0.1, Fo.L + 0.1, H - 0.5, H, -0.02, 0.35);
    if (vd > 0){
      // the inner wall behind the verandah: windows / doors
      if (Fw.L > 2.4) fwins(P.dk, P.lit, Fw, 0.4, Fw.L - 0.4, bay, Array.from({length:nf}, (_, k) => [y0 + k*fh + 0.25, fh*0.66, k ? 'r' : 'a', Math.min(1.6, bay*0.44)]), 0.05, rng, (o.pl === undefined ? 0.25 : o.pl)*1.4);
      // the arcaded colonnade on the court side, one tier per floor
      const na = Math.max(1, Math.round(Fi.L/bay));
      for (let k = 0; k < nf; k++){ const yb = y0 + k*fh;
        farcade(P.w, Fi, 0, Fi.L, na, yb, yb + fh*0.58, yb + fh, 0.7, -0.6, 0.05);
        if (o.cols !== false) for (let j = 0; j <= na; j++) fcol(P.t, P.t, Fi, j*Fi.L/na, 0.32, yb, yb + fh*0.58, 0.24, 6);
        if (k) fbal(P.t, Fi, 0.35, Fi.L - 0.35, yb, 1.0, -0.3, 0.16);
        if (k) fbx(P.t, Fi, -0.05, Fi.L + 0.05, yb - 0.35, yb + 0.05, -vd, 0.15); }
      fbx(P.t, Fi, -0.1, Fi.L + 0.1, H - 0.5, H, -vd, 0.35);
      // verandah ceiling
      Q(P.t, [I[i][0], H - 0.05, I[i][1]], [I[i+1][0], H - 0.05, I[i+1][1]], [Iw[i+1][0], H - 0.05, Iw[i+1][1]], [Iw[i][0], H - 0.05, Iw[i][1]]);
    } else {
      if (Fi.L > 2.4){ fwins(P.dk, P.lit, Fi, 0.5, Fi.L - 0.5, bay, Array.from({length:nf}, (_, k) => [y0 + k*fh + (k ? 0.7 : 0.5), fh*0.58, o.arch === false ? 'r' : 'a', Math.min(1.5, bay*0.42)]), 0.05, rng, o.pl === undefined ? 0.25 : o.pl);
        for (let k = 1; k < nf; k++) fbx(P.t, Fi, -0.05, Fi.L + 0.05, y0 + k*fh - 0.3, y0 + k*fh + 0.1, -0.02, 0.22); }
      fbx(P.t, Fi, -0.1, Fi.L + 0.1, H - 0.5, H, -0.02, 0.35);
    }
    // roof: eaves on both sides up to the ridge over the middle line
    if (rise > 0){
      const e = (p, i2, s) => [p[0] - s*dir[i2][0]*ov, H - ov*0.35, p[1] - s*dir[i2][1]*ov];
      const r0 = [M[i][0], H + rise, M[i][1]], r1 = [M[i+1][0], H + rise, M[i+1][1]];
      Q(P.rf, e(I[i], i, 1), e(I[i+1], i + 1, 1), r1, r0); Q(P.rf, e(O[i+1], i + 1, -1), e(O[i], i, -1), r0, r1);
      if (P.rc) segP(P.rc, [r0[0], r0[1] + 0.08, r0[2]], [r1[0], r1[1] + 0.08, r1[2]], 0.13, 4);
    }
  }
  // closed ends: end wall and a gable (wall-coloured triangle under the ridge)
  for (const [k, on] of [[0, o.endA], [n - 1, o.endB]]){ if (!on) continue;
    const a = Iw[k], b = O[k]; Q(P.w, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], H, b[1]], [a[0], H, a[1]]);
    if (rise > 0) T3(P.w, [I[k][0] - dir[k][0]*ov, H - ov*0.35, I[k][1] - dir[k][1]*ov], [O[k][0] + dir[k][0]*ov, H - ov*0.35, O[k][1] + dir[k][1]*ov], [M[k][0], H + rise, M[k][1]]);
  }
};
// offset a polyline I (array of [x, z]) by D to the side away from the point C (miter joints) -> the outer line
const offAway = (I, D, C) => { const n = I.length, N = [];
  for (let i = 0; i < n - 1; i++){ const a = I[i], b = I[i+1], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz); let nx = -dz/L, nz = dx/L;
    const mx = (a[0] + b[0])/2, mz = (a[1] + b[1])/2; if (nx*(mx - C[0]) + nz*(mz - C[1]) < 0){ nx = -nx; nz = -nz; } N.push([nx, nz]); }
  return I.map((p, i) => { const n1 = N[Math.max(0, i - 1)], n2 = N[Math.min(N.length - 1, i)]; let bx_ = n1[0] + n2[0], bz = n1[1] + n2[1]; const bl = Math.hypot(bx_, bz); bx_ /= bl; bz /= bl;
    const k = D/Math.max(0.5, bx_*n1[0] + bz*n1[1]); return [p[0] + bx_*k, p[1] + bz*k]; }); };
// hipped roof over a rotated rectangle: centre (cx, cz), long side L along angle a (radians, x towards z), width W
const hipRot = (o, cx, cz, a, L, W, y, h, ov, oc) => { const i0 = o.length, j0 = oc ? oc.length : 0; hipR(o, -L/2, L/2, -W/2, W/2, y, h, ov, oc); const c = Math.cos(a), s = Math.sin(a), f = p => [cx + p[0]*c - p[2]*s, p[1], cz + p[0]*s + p[2]*c]; xfm(o, i0, f); if (oc) xfm(oc, j0, f); };
// plain wall detailing on a face: n windows per floor, string courses and a cornice
const wallF = (P, F, y0, H, nf, bay, kind, pl) => { if (F.L < 2.2) return; const fh = (H - y0)/nf;
  fwins(P.dk, P.lit, F, 0.5, F.L - 0.5, bay, Array.from({length:nf}, (_, k) => [y0 + k*fh + (k ? 0.7 : 0.5), fh*0.58, kind || (k ? 'r' : 'a'), Math.min(1.5, bay*0.42)]), 0.05, P.rng, pl === undefined ? 0.25 : pl);
  for (let k = 1; k < nf; k++) fbx(P.t, F, -0.05, F.L + 0.05, y0 + k*fh - 0.3, y0 + k*fh + 0.1, -0.02, 0.22);
  fbx(P.t, F, -0.15, F.L + 0.15, H - 0.5, H, -0.02, 0.4); };

// ===== Cathedral of the Good Shepherd (1843-47, Denis McSwiney; steeple 1847 after C. A. Dyce; nave extended 1888):
// restrained Renaissance / Palladian Latin cross after St Paul's Covent Garden and St Martin-in-the-Fields. Aisleless nave
// and transepts, Tuscan pilasters all round, big round-headed windows, a hexastyle Tuscan portico on Queen Street (west)
// with the steeple rising behind it (square stage with clustered corner columns and pedimented faces, octagonal stage
// with gablets, six-sided spire and budded cross), a tetrastyle pedimented portico on Victoria Street (east), small
// pedimented porches on the nave sides and pedimented transept ends. White with dark yellow (restored 2013-16).
// Local axes: +x = bearing -37 deg along the nave (towards Victoria Street, ESE), +z = SSW; the main door faces -x.
LANDMARKS.goodshepherd = {zh:'善牧主教座堂', en:'Cathedral of the Good Shepherd', cat:'old', r:40, h:35.4,
  lt:{m:0, c:'#ffe2b8', k:0.95, e:0.55},
  build(){
    const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
    const WL = '#e8d39a', T = '#f4f1e8', D = '#2c3a35', L = {c:'#3b3a2d', glow:'#ffcf8a', gk:0.6}, R = {c:'#8a5a46', lk:0.25}, PL = '#c9c2b2',
      SG = {c:'#3c4a3e', glow:'#ffbf74', gk:0.7};
    const sp = B.p('#e9e6dc'), w = B.p(WL), t = B.p(T), dk = B.p(D), lit = B.p(L), rf = B.p(R), sg = B.p(SG), pl = B.p(PL);
    const FP = [[28.8,-10.0],[29.0,9.3],[19.3,9.3],[18.7,18.6],[3.0,18.6],[2.9,9.6],[-5.4,9.3],[-5.7,13.9],[-13.8,14.1],[-13.7,9.4],[-33.2,9.3],[-32.5,-9.9],[-13.9,-9.9],[-13.6,-14.5],[-5.4,-14.7],[-5.2,-9.6],[3.1,-10.1],[3.3,-19.0],[19.0,-19.0],[19.1,-10.1]];
    prismC(pl, FP, -5, 0.6);
    const Y0 = 0.6, H = 11.6, RS = 5.2, zc = -0.25, hw = 9.4, z0 = zc - hw, z1 = zc + hw;
    const xw = -29.4, xe = 25.4, tx0 = 3.4, tx1 = 18.8, tz0 = -18.7, tz1 = 18.3;
    // big round-headed window with a white architrave and keystone (stained-glass head)
    const win = (F, u, big) => { const ww = big ? 2.5 : 2.2, ys = big ? 7.4 : 6.9;
      fbx(t, F, u - ww/2 - 0.35, u + ww/2 + 0.35, 2.0, 2.3, -0.02, 0.25);                       // sill
      farch(t, F, u, 2.3, ww + 0.6, ys, 0.04, 8); farch(rng() < 0.45 ? sg : dk, F, u, 2.3, ww, ys, 0.09, 8);
      fbx(t, F, u - 0.25, u + 0.25, ys + ww/2 - 0.1, ys + ww/2 + 0.6, -0.02, 0.18); };            // keystone
    const pil = (F, u, y1) => { fbx(t, F, u - 0.42, u + 0.42, Y0, y1, -0.02, 0.3); fbx(t, F, u - 0.55, u + 0.55, Y0, Y0 + 0.6, -0.02, 0.38); fbx(t, F, u - 0.55, u + 0.55, y1 - 0.45, y1, -0.02, 0.4); };
    const entab = (F, u0, u1, y) => { fbx(t, F, u0, u1, y - 1.1, y - 0.35, -0.02, 0.25); fbx(t, F, u0 - 0.1, u1 + 0.1, y - 0.35, y, -0.02, 0.55); };
    // ---- nave and chancel walls ----
    bx(w, xw, tx0, Y0, H, z0, z1); bx(w, tx1, xe, Y0, H, z0, z1);
    // ---- transept (crossing and both arms) ----
    bx(w, tx0, tx1, Y0, H, tz0, tz1);
    // roofs: nave ridge along x over the whole length, transept ridge along z; gable ends in wall colour
    gabR(rf, null, xw - 0.6, xe + 0.6, z0, z1, H, RS, 'x', 0.7);
    gabR(rf, null, tx0, tx1, tz0 - 0.6, tz1 + 0.6, H, RS*(tx1 - tx0)/(2*hw), 'z', 0.7);
    // long sides of the nave (north z0 / south z1): pilasters, windows, entablature
    for (const [F, s] of [[fc(xw, z1, tx0, z1), 1], [fc(tx0, z0, xw, z0), -1]]){
      const U = x => s > 0 ? x - xw : tx0 - x;
      for (const x of [-29.0, -22.0, -15.0, -4.2, 3.0]) pil(F, U(x), H - 1.1);
      for (const x of [-25.5, -18.5, -0.6]) win(F, U(x), true);
      entab(F, -0.3, F.L + 0.3, H);
    }
    for (const [F, s] of [[fc(tx1, z1, xe, z1), 1], [fc(xe, z0, tx1, z0), -1]]){
      const U = x => s > 0 ? x - tx1 : xe - x;
      for (const x of [19.2, 25.0]) pil(F, U(x), H - 1.1);
      win(F, U(22.1), true); entab(F, -0.3, F.L + 0.3, H);
    }
    // transept arms: side walls (one window each) and pedimented ends
    for (const s of [1, -1]){
      const zo = s > 0 ? tz1 : tz0, zi = s > 0 ? z1 : z0;
      const Fe = s > 0 ? fc(tx0, zo, tx1, zo) : fc(tx1, zo, tx0, zo), Lm = Fe.L/2;
      for (const u of [0.4, 4.0, Fe.L - 4.0, Fe.L - 0.4]) pil(Fe, u, H - 1.1);
      win(Fe, Lm, true); entab(Fe, -0.3, Fe.L + 0.3, H);
      fped(w, t, Fe, -0.3, Fe.L + 0.3, H, RS*(tx1 - tx0)/(2*hw), -0.02, 0.4);
      for (let i = 0; i < 10; i++){ const a = i/10*TAU, b = (i + 1)/10*TAU; T3(t, fp(Fe, Lm, H + 1.8, 0.45), fp(Fe, Lm + Math.cos(a)*0.75, H + 1.8 + Math.sin(a)*0.75, 0.45), fp(Fe, Lm + Math.cos(b)*0.75, H + 1.8 + Math.sin(b)*0.75, 0.45)); }
      // door with a pedimented hood on each transept end
      frect(dk, Fe, Lm - 3.8, Lm - 2.2, Y0, 4.2, 0.06); frect(dk, Fe, Lm + 2.2, Lm + 3.8, Y0, 4.2, 0.06);
      fbx(t, Fe, Lm - 4.2, Lm - 1.8, 4.2, 4.6, -0.02, 0.5); fbx(t, Fe, Lm + 1.8, Lm + 4.2, 4.2, 4.6, -0.02, 0.5);
      for (const [F, xs] of [[s > 0 ? fc(tx1, zo, tx1, zi) : fc(tx1, zi, tx1, zo), 1], [s > 0 ? fc(tx0, zi, tx0, zo) : fc(tx0, zo, tx0, zi), -1]]){
        pil(F, 0.4, H - 1.1); pil(F, F.L - 0.4, H - 1.1); win(F, F.L/2, false); entab(F, -0.3, F.L + 0.3, H); }
    }
    // ---- portico: n columns between z a..b at x = xc, facing direction s (-1 west, +1 east), roof back to the wall ----
    const portico = (xwall, xc, za, zb, n, s, ht, cr) => {
      const F = s < 0 ? fc(xc, za, xc, zb) : fc(xc, zb, xc, za);   // outward = -x for s<0
      const L = zb - za, x0 = Math.min(xwall, xc), x1 = Math.max(xwall, xc);
      bx(pl, x0 - (s < 0 ? 0.8 : 0), x1 + (s > 0 ? 0.8 : 0), -0.6, Y0, za - 0.6, zb + 0.6);                        // podium and steps
      for (let i = 0; i < n; i++){ const u = 0.7 + i*(L - 1.4)/(n - 1); fcol(t, t, F, u, -cr - 0.15, Y0, ht, cr, 10); }
      // entablature all round the portico and the ceiling
      bx(t, x0 - 0.1, x1 + 0.1, ht, ht + 0.85, za - 0.1, zb + 0.1); bx(t, x0 - 0.35, x1 + 0.35, ht + 0.85, ht + 1.25, za - 0.35, zb + 0.35);
      const rise = Math.min(3.0, L*0.19);
      fped(w, t, F, -0.35, L + 0.35, ht + 1.25, rise, -0.7, 0.3);
      // the roof over the portico (two slopes back to the wall)
      const xa = s < 0 ? xc - 0.45 : xwall, xb = s < 0 ? xwall : xc + 0.45, zm = (za + zb)/2, yb = ht + 1.25;
      Q(rf, [xa, yb, za - 0.4], [xb, yb, za - 0.4], [xb, yb + rise, zm], [xa, yb + rise, zm]); Q(rf, [xb, yb, zb + 0.4], [xa, yb, zb + 0.4], [xa, yb + rise, zm], [xb, yb + rise, zm]);
      // cross on the apex
      const cx = xc + s*0.1; segP(t, [cx, yb + rise, zm], [cx, yb + rise + 1.9, zm], 0.09, 4); segP(t, [cx, yb + rise + 1.3, zm - 0.55], [cx, yb + rise + 1.3, zm + 0.55], 0.08, 4);
      return {F, L, rise};
    };
    // west front (Queen Street): hexastyle portico, three doors, niche
    { const p = portico(xw, -32.7, zc - 7.3, zc + 7.3, 6, -1, 9.0, 0.48);
      const F = fc(xw, z0, xw, z1);
      for (const u of [hw - 4.1, hw, hw + 4.1]){ fbx(t, F, u - 1.3, u + 1.3, Y0, 5.8, -0.02, 0.08); farch(dk, F, u, Y0, 1.9, 4.6, 0.12, 6); }
      farch(dk, F, hw, 6.6, 1.3, 8.2, 0.12, 6); fbx(t, F, hw - 0.9, hw + 0.9, 6.3, 6.6, -0.02, 0.35);           // niche with the statue
      LBox(g, 0.55, 1.5, 0.4, xw - 0.45, 6.6, zc, '#ece6d8');
      pil(F, 0.3, H - 1.1); pil(F, F.L - 0.3, H - 1.1); entab(F, -0.3, F.L + 0.3, H);
      fped(w, t, F, -0.3, F.L + 0.3, H, RS, -0.02, 0.35);
      bx(lit, xw - 2.9, xw - 0.2, 9.0, 9.05, zc - 6.8, zc + 6.8);                                              // lit portico ceiling
    }
    // east front (Victoria Street): tetrastyle portico against the sanctuary wall
    { portico(xe, 28.5, zc - 5.2, zc + 5.2, 4, 1, 8.6, 0.45);
      const F = fc(xe, z1, xe, z0); pil(F, 0.3, H - 1.1); pil(F, F.L - 0.3, H - 1.1); entab(F, -0.3, F.L + 0.3, H);
      fped(w, t, F, -0.3, F.L + 0.3, H, RS, -0.02, 0.35); farch(dk, F, hw, Y0, 1.8, 4.2, 0.06, 6); }
    // diminutive porticos on the nave sides
    for (const s of [1, -1]){
      const zw = s > 0 ? z1 : z0, zo = s > 0 ? 13.9 : -14.5, xa = -13.6, xb = -5.6, ht = 5.6;
      const F = s > 0 ? fc(xa, zo, xb, zo) : fc(xb, zo, xa, zo), L = F.L;
      bx(pl, xa - 0.3, xb + 0.3, -0.5, Y0, Math.min(zw, zo + s*0.6), Math.max(zw, zo + s*0.6));
      fcol(t, t, F, 0.5, -0.5, Y0, ht, 0.36, 8); fcol(t, t, F, L - 0.5, -0.5, Y0, ht, 0.36, 8);
      bx(t, xa, xb, ht, ht + 0.8, Math.min(zw, zo), Math.max(zw, zo));
      fped(w, t, F, -0.25, L + 0.25, ht + 0.8, 1.9, -0.6, 0.3);
      const zm = Math.min(zw, zo), zM = Math.max(zw, zo), xm = (xa + xb)/2, yb = ht + 0.8;
      Q(rf, [xa - 0.3, yb, zm], [xa - 0.3, yb, zM], [xm, yb + 1.9, zM], [xm, yb + 1.9, zm]); Q(rf, [xb + 0.3, yb, zM], [xb + 0.3, yb, zm], [xm, yb + 1.9, zm], [xm, yb + 1.9, zM]);
      const Fw = s > 0 ? fc(xa, zw, xb, zw) : fc(xb, zw, xa, zw); farch(dk, Fw, L/2, Y0, 1.8, 4.0, 0.08, 6);
      segP(t, [xm, yb + 1.9, zo + s*0.1], [xm, yb + 3.2, zo + s*0.1], 0.07, 4); segP(t, [xm - 0.4, yb + 2.75, zo + s*0.1], [xm + 0.4, yb + 2.75, zo + s*0.1], 0.06, 4);
    }
    // ---- the steeple over the west end ----
    { const cx = -25.9, cz = zc, s = 6.6, ya = H + 0.2, yb = 22.2;
      const Rt = rectF(cx - s/2, cx + s/2, cz - s/2, cz + s/2), FA = [Rt.f, Rt.r, Rt.b, Rt.l];
      bx(w, cx - s/2, cx + s/2, ya - 1.5, yb, cz - s/2, cz + s/2);
      for (const F of FA){
        farch(dk, F, s/2, 17.4, 1.5, 19.9, 0.06, 6); farch(t, F, s/2, 17.2, 2.1, 19.9, 0.03, 6);
        fbx(t, F, -0.2, s + 0.2, 16.8, 17.2, -0.02, 0.3);
        fbx(t, F, -0.3, s + 0.3, yb - 0.5, yb, -0.02, 0.5);
        fped(w, t, F, 0.1, s - 0.1, yb, 1.6, -0.1, 0.4);
        for (let i = 0; i < 10; i++){ const a = i/10*TAU, b = (i + 1)/10*TAU; T3(t, fp(F, s/2, yb + 0.6, 0.45), fp(F, s/2 + Math.cos(a)*0.42, yb + 0.6 + Math.sin(a)*0.42, 0.45), fp(F, s/2 + Math.cos(b)*0.42, yb + 0.6 + Math.sin(b)*0.42, 0.45)); }
      }
      // three engaged Ionic columns at each corner (one on the diagonal, one on each face)
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]){
        const px = cx + sx*s/2, pz = cz + sz*s/2;
        for (const [ox, oz] of [[0.15, 0.15], [-0.75, 0.32], [0.32, -0.75]]){ const x = px + sx*ox, z = pz + sz*oz; segP(t, [x, 17.2, z], [x, yb - 0.5, z], 0.24, 8, 0.21); bx(t, x - 0.33, x + 0.33, yb - 0.85, yb - 0.5, z - 0.33, z + 0.33); }
      }
      // octagonal stage: Tuscan columns at the angles, narrow windows, a gablet on every face
      const r8 = 2.75, y2 = yb + 0.6, y3 = 27.6, a0 = PI/8;
      bx(t, cx - 3.0, cx + 3.0, yb, y2, cz - 3.0, cz + 3.0);
      ngonP(w, cx, cz, r8, 8, y2, y3, a0);
      const F8 = ngonF(cx, cz, r8, 8, a0);
      for (const F of F8){ frect(dk, F, F.L/2 - 0.35, F.L/2 + 0.35, y2 + 1.2, y3 - 1.6, 0.05); fbx(t, F, -0.05, F.L + 0.05, y3 - 0.45, y3, -0.02, 0.3); fped(w, t, F, 0.0, F.L, y3, 0.75, -0.05, 0.25); }
      for (let i = 0; i < 8; i++){ const a = a0 + i/8*TAU, x = cx + Math.cos(a)*(r8 + 0.05), z = cz + Math.sin(a)*(r8 + 0.05); segP(t, [x, y2, z], [x, y3 - 0.45, z], 0.17, 6); }
      // six-sided spire and the budded cross
      const yS = y3 + 0.5, tip = 33.8;
      latheP(t, [[2.55, y3 + 0.1], [2.55, yS], [2.25, yS]], cx, cz, 6, PI/6);
      latheP(sp, [[2.25, yS], [1.6, yS + 2.0], [0.12, tip - 0.2], [0.01, tip]], cx, cz, 6, PI/6);
      segP(t, [cx, tip - 0.3, cz], [cx, 35.4, cz], 0.08, 4); segP(t, [cx, 34.8, cz - 0.5], [cx, 34.8, cz + 0.5], 0.07, 4);
      for (const [dz, dy] of [[-0.55, 34.8], [0.55, 34.8], [0, 35.45]]) bx(t, cx - 0.1, cx + 0.1, dy - 0.1, dy + 0.1, cz + dz - 0.1, cz + dz + 0.1);
    }
    B.flush(g); return g; }};
SG_PLACES.push({type:'goodshepherd', lat:1.296050, lon:103.851220, rot:-0.6458});   // nave along +x (WNW -> ESE); main door and steeple at -x (Queen Street)

// ===== Armenian Church of Saint Gregory the Illuminator (1835-36, G. D. Coleman; tower 1853 G. V. Maddox; spire 1953):
// Singapore's oldest church. A round nave set in a square-cross plan, white Neoclassical: projecting Tuscan Doric
// porticos with triangular pediments on the north, south and west fronts (carriage porches), the east portico boxing in
// the bowed apse and carrying the spire (square stage, octagonal tower with louvred arches, slender octagonal spire with
// ball and cross); Tuscan pilasters, timber-louvred windows, a low hipped roof. Lawn and trees of the church grounds.
// Local axes: +x = bearing -27 deg (ESE, towards Hill Street; altar and spire end), +z = SSW; the main (west) door faces -x.
LANDMARKS.armenian = {zh:'亚美尼亚教堂', en:'Armenian Church of Saint Gregory the Illuminator', cat:'old', r:27, h:26.4,
  lt:{m:0, c:'#ffe6c4', k:1.0, e:0.6},
  build(){
    const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
    const W = '#f3f1ea', T = '#e3ded2', D = '#2d3532', LV = '#47523f', L = {c:'#3b3a30', glow:'#ffd08f', gk:0.55}, R = {c:'#6f6a64', lk:0.25}, PL = '#c8c2b4',
      GR = {c:'#6f9a55', lk:0.12}, TT = '#5b4b3b', TC = {c:'#4f7445', lk:0.18};
    const w = B.p(W), t = B.p(T), dk = B.p(D), lv = B.p(LV), lit = B.p(L), rf = B.p(R), pl = B.p(PL);
    const FP = [[-10.6,-3.4],[-10.6,-7.4],[-1.3,-7.4],[-1.1,-12.2],[4.8,-12.6],[4.8,-7.3],[8.0,-7.6],[8.1,-3.5],[13.9,-4.0],[13.7,3.6],[8.1,3.1],[8.1,7.0],[4.1,7.1],[4.3,11.6],[-2.2,11.7],[-2.0,6.9],[-10.8,6.7],[-10.6,1.9],[-16.8,1.7],[-16.8,-3.6]];
    // lawn of the church grounds (low, under everything) and the plinth
    LPoly(g, [[-20.5, -14.5], [16.5, -14.5], [18.5, -9], [18.5, 9], [16, 14.5], [-20.5, 14.5]], -2.6, 2.25, GR);
    prismC(pl, FP, -5, 0.7);
    const Y0 = 0.7, H = 8.4, x0 = -10.6, x1 = 8.1, z0 = -7.45, z1 = 6.9;
    bx(w, x0, x1, Y0, H, z0, z1);
    // hipped roof of the nave and a little crowning lantern over the round nave
    hipR(rf, x0, x1, z0, z1, H + 0.55, 3.4, 0.6);
    bx(t, x0 - 0.35, x1 + 0.35, H, H + 0.55, z0 - 0.35, z1 + 0.35);                       // entablature / cornice
    bx(t, x0 - 0.1, x1 + 0.1, H - 1.0, H, z0 - 0.1, z1 + 0.1);
    // walls: Tuscan pilasters and timber-louvred windows in plain architraves
    const pil = (F, u) => { fbx(t, F, u - 0.32, u + 0.32, Y0, H - 1.0, -0.02, 0.22); fbx(t, F, u - 0.42, u + 0.42, Y0, Y0 + 0.5, -0.02, 0.3); };
    const louv = (F, u) => { fbx(t, F, u - 0.95, u + 0.95, 1.6, 6.2, -0.02, 0.1); frect(rng() < 0.3 ? lit : lv, F, u - 0.75, u + 0.75, 1.8, 6.0, 0.12);
      for (let y = 2.05; y < 5.9; y += 0.32) fbx(t, F, u - 0.75, u + 0.75, y, y + 0.06, 0.1, 0.16); fbx(t, F, u - 1.1, u + 1.1, 6.2, 6.55, -0.02, 0.3); };
    const Rb = rectF(x0, x1, z0, z1);
    // north (z0) and south (z1) walls: bays either side of the porticos
    for (const [F, s] of [[Rb.f, 1], [Rb.b, -1]]){ const U = x => s > 0 ? x - x0 : x1 - x;
      for (const x of [-10.3, -6.0, -1.6, 4.8, 7.8]) pil(F, U(x));
      louv(F, U(-8.1)); louv(F, U(-3.8)); louv(F, U(6.4)); }
    // west wall either side of the west portico, east wall either side of the east portico
    for (const [F, s] of [[Rb.l, 1], [Rb.r, -1]]){ const U = z => s > 0 ? z - z0 : z1 - z;
      for (const z of [-7.1, -4.3, 2.4, 6.6]) pil(F, U(z)); louv(F, U(-5.7)); louv(F, U(4.6)); }
    // ---- porticos: 4 Tuscan Doric columns (paired at the corners), entablature, pediment, gabled roof back to the wall ----
    const portico = (F, depth, ht, rise) => {   // F = the portico front, outward; the portico runs back depth to the wall
      const L = F.L;
      for (const u of [0.45, 1.25, L - 1.25, L - 0.45]) fcol(t, t, F, u, -0.45, Y0, ht, 0.3, 10);
      for (const u of [0.45, L - 0.45]) fcol(t, t, F, u, -depth + 0.6, Y0, ht, 0.3, 10);      // rear columns against the body
      fbx(t, F, -0.1, L + 0.1, ht, ht + 0.75, -depth, 0.05); fbx(t, F, -0.3, L + 0.3, ht + 0.75, ht + 1.1, -depth, 0.3);
      fped(w, t, F, -0.3, L + 0.3, ht + 1.1, rise, -0.5, 0.25);
      const a = fp(F, -0.35, ht + 1.1, -depth), b = fp(F, L + 0.35, ht + 1.1, -depth), c = fp(F, L + 0.35, ht + 1.1, 0.0), d = fp(F, -0.35, ht + 1.1, 0.0), m0 = fp(F, L/2, ht + 1.1 + rise, -depth), m1 = fp(F, L/2, ht + 1.1 + rise, 0.0);
      Q(rf, a, d, m1, m0); Q(rf, c, b, m0, m1);
      fbx(t, F, 0.2, L - 0.2, ht - 0.05, ht, -depth + 0.3, -0.3);                                 // ceiling
      fbx(pl, F, -0.6, L + 0.6, -0.5, Y0, -depth, 1.0);                                          // steps
    };
    portico(fc(-16.8, -3.6, -16.8, 1.8), 6.2, 6.6, 1.7);      // west (main entrance), front faces -x
    portico(fc(4.8, -12.55, -1.2, -12.55), 5.1, 6.6, 1.7);     // north
    portico(fc(-2.1, 11.6, 4.2, 11.6), 4.7, 6.6, 1.7);         // south
    // doors in the porches
    farch(dk, Rb.l, -0.9 - z0, Y0, 1.9, 3.9, 0.06, 6); farch(dk, Rb.b, x1 - 1.8, Y0, 1.7, 3.8, 0.06, 6); farch(dk, Rb.f, 1.05 - x0, Y0, 1.7, 3.8, 0.06, 6);
    // ---- east portico boxing in the apse, carrying the tower and spire ----
    { const Fe = fc(13.8, 3.4, 13.8, -3.8), L = Fe.L, ht = 6.6;
      bx(w, x1 - 0.2, 13.0, Y0, ht, -3.6, 3.2);                                                  // the boxed-in apse
      for (const u of [0.45, 1.25, L - 1.25, L - 0.45]) fcol(t, t, Fe, u, -0.4, Y0, ht, 0.3, 10);
      for (const u of [2.9, L - 2.9]) fbx(t, Fe, u - 0.35, u + 0.35, Y0, ht, -0.85, -0.6);
      fbx(t, Fe, -0.1, L + 0.1, ht, ht + 0.75, -5.7, 0.05); fbx(t, Fe, -0.3, L + 0.3, ht + 0.75, ht + 1.1, -5.7, 0.3);
      fped(w, t, Fe, -0.3, L + 0.3, ht + 1.1, 1.9, -0.5, 0.25);
      fbx(pl, Fe, -0.6, L + 0.6, -0.5, Y0, -5.7, 0.9);
      frect(lit, Fe, L/2 - 0.8, L/2 + 0.8, 2.0, 5.0, -0.82);                                    // the east window (stained glass)
      // square stage behind the pediment: pilasters, cornice, balustrade with corner urns
      const cx = 10.9, cz = -0.2, s = 5.2, ya = ht + 1.1, yb = 11.6;
      bx(w, cx - s/2, cx + s/2, ya, yb, cz - s/2, cz + s/2);
      const Rt = rectF(cx - s/2, cx + s/2, cz - s/2, cz + s/2);
      for (const F of [Rt.f, Rt.r, Rt.b, Rt.l]){ fbx(t, F, -0.1, 0.5, ya, yb, -0.02, 0.2); fbx(t, F, s - 0.5, s + 0.1, ya, yb, -0.02, 0.2);
        farch(dk, F, s/2, 9.0, 1.0, 10.4, 0.05, 6); fbx(t, F, -0.3, s + 0.3, yb - 0.4, yb, -0.02, 0.4); fbal(t, F, 0.2, s - 0.2, yb, 0.85, 0.15, 0.18); }
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]){ const ux = cx + sx*(s/2 + 0.1), uz = cz + sz*(s/2 + 0.1); bx(t, ux - 0.3, ux + 0.3, yb, yb + 0.9, uz - 0.3, uz + 0.3); latheP(t, [[0.22, yb + 0.9], [0.32, yb + 1.25], [0.18, yb + 1.6], [0.04, yb + 1.85]], ux, uz, 8); }
      // octagonal tower with louvred round-arched openings, cornice
      const r8 = 2.05, y2 = yb, y3 = 16.0, a0 = PI/8;
      ngonP(w, cx, cz, r8, 8, y2, y3, a0);
      for (const F of ngonF(cx, cz, r8, 8, a0)){ farch(dk, F, F.L/2, y2 + 1.3, 0.85, y3 - 1.6, 0.05, 6);
        for (let y = y2 + 1.5; y < y3 - 1.5; y += 0.38) fbx(t, F, F.L/2 - 0.42, F.L/2 + 0.42, y, y + 0.07, 0.05, 0.1); }
      for (let i = 0; i < 8; i++){ const a = a0 + i/8*TAU; segP(t, [cx + Math.cos(a)*(r8 + 0.04), y2, cz + Math.sin(a)*(r8 + 0.04)], [cx + Math.cos(a)*(r8 + 0.04), y3, cz + Math.sin(a)*(r8 + 0.04)], 0.12, 4); }
      latheP(t, [[r8 + 0.05, y3], [r8 + 0.35, y3 + 0.25], [r8 + 0.35, y3 + 0.6], [r8 - 0.15, y3 + 0.65]], cx, cz, 8, a0);
      // slender octagonal spire, banded, with a ball and cross
      const yS = y3 + 0.65, tip = 24.6;
      latheP(w, [[r8 - 0.15, yS], [r8 - 0.35, yS + 0.8], [0.12, tip - 0.2], [0.01, tip]], cx, cz, 8, a0);
      for (const yb2 of [yS + 2.5, yS + 5.0]){ const rr = (r8 - 0.35) - ((r8 - 0.35) - 0.12)*(yb2 - yS - 0.8)/(tip - 0.2 - yS - 0.8); latheP(t, [[rr + 0.08, yb2], [rr + 0.08, yb2 + 0.25]], cx, cz, 8, a0); }
      LSph(g, 0.32, cx, tip + 0.15, cz, T, 1, 10);
      segP(t, [cx, tip + 0.4, cz], [cx, 26.4, cz], 0.07, 4); segP(t, [cx, 25.75, cz - 0.42], [cx, 25.75, cz + 0.42], 0.06, 4);
    }
    // ---- trees of the church grounds ----
    { const tt = B.p(TT), tc = B.p(TC); for (const [x, z, sc] of [[-18.5, -11.5, 1.1], [15.5, -12.0, 1.0], [-18.5, 11.5, 1.0], [14.5, 11.5, 0.9], [-12.5, 12.5, 0.8]]) treeP(tt, tc, x, z, sc, rng); }
    B.flush(g); return g; }};
SG_PLACES.push({type:'armenian', lat:1.293100, lon:103.849400, rot:-0.4712});   // nave along +x; main (west) door at -x, spire over the east portico (+x, Hill Street)

// ===== Peranakan Museum (former Tao Nan School, 1910-12, Municipal Engineer's Office): three-storey eclectic classical
// school building with French Renaissance touches on Armenian Street. Symmetrical front: two projecting end pavilions with
// canted corners, fluted Corinthian pilasters and pedimented parapets, between them a three-tier columned loggia
// (the wide verandahs) over the entrance; tall windows on every floor, string courses, a parapeted cornice, hipped
// tiled roofs over the front and rear blocks and the skylight of the square central atrium.
// Local axes: +x = bearing -28.4 deg (ESE, the front on Armenian Street), +z = SSW.
LANDMARKS.peranakan = {zh:'土生华人博物馆', en:'Peranakan Museum', cat:'old', r:30, h:20.6,
  lt:{m:0, c:'#ffe4bc', k:1.0, e:0.55, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
    const W = '#ede3cb', T = '#f8f5ec', D = '#2f3a3c', L = {c:'#3e3b30', glow:'#ffcf8c', gk:0.6}, R = {c:'#a1583e', lk:0.25}, PL = '#c7bfae',
      GL = {c:'#6f8790', glow:'#ffe2b0', gk:0.35}, IR = '#1d1d1d';
    const w = B.p(W), t = B.p(T), dk = B.p(D), lit = B.p(L), rf = B.p(R), pl = B.p(PL), gl = B.p(GL);
    const FP = [[-21.0,7.2],[-23.2,7.0],[-23.8,-5.5],[-21.1,-5.5],[-21.9,-14.6],[-7.8,-14.8],[-7.6,-8.2],[-5.4,-8.0],[-5.6,-14.6],[20.3,-14.5],[23.5,-12.2],[23.4,-7.4],[21.0,-5.5],[18.6,-6.2],[19.0,5.7],[21.1,6.0],[24.1,7.8],[23.5,12.8],[20.9,15.5],[-5.8,15.2],[-6.0,8.5],[-7.3,8.5],[-7.1,15.2],[-21.0,14.5]];
    prismC(pl, FP, -5, 0.9);
    const Y0 = 0.9, nf = 3, fh = 4.67, H = Y0 + nf*fh, PT = H + 1.3;     // eaves 14.9, parapet top 16.2
    const fl = k => Y0 + k*fh;
    // window of floor k: ground floor round-headed, upper floors tall French windows with cornice hoods
    const win = (F, u, k, ww) => { ww = ww || 1.5; const y = fl(k);
      if (k === 0){ farch(t, F, u, y + 0.6, ww + 0.5, y + 3.0, 0.03, 6); farch(rng() < 0.4 ? lit : dk, F, u, y + 0.7, ww, y + 3.0, 0.07, 6); }
      else { fbx(t, F, u - ww/2 - 0.25, u + ww/2 + 0.25, y + 0.35, y + 3.55, -0.02, 0.06); frect(rng() < 0.35 ? lit : dk, F, u - ww/2, u + ww/2, y + 0.45, y + 3.45, 0.09);
        fbx(t, F, u - ww/2 - 0.45, u + ww/2 + 0.45, y + 3.55, y + 3.85, -0.02, 0.3); fbx(t, F, u - ww/2 - 0.3, u + ww/2 + 0.3, y + 0.25, y + 0.4, -0.02, 0.3); } };
    // fluted Corinthian pilaster for floor k (shaft with flutes, a capital block)
    const pil = (F, u, k, wd) => { wd = wd || 0.62; const y0 = fl(k), y1 = fl(k + 1) - 0.45;
      fbx(t, F, u - wd/2, u + wd/2, y0, y1, -0.02, 0.2); for (const du of [-wd*0.25, 0, wd*0.25]) fbx(w, F, u + du - 0.035, u + du + 0.035, y0 + 0.5, y1 - 0.6, 0.18, 0.22);
      fbx(t, F, u - wd/2 - 0.12, u + wd/2 + 0.12, y1 - 0.55, y1, -0.02, 0.32); };
    const bands = (F, u0, u1) => { for (let k = 1; k < nf; k++) fbx(t, F, u0, u1, fl(k) - 0.45, fl(k), -0.02, 0.28);
      fbx(t, F, u0 - 0.1, u1 + 0.1, H - 0.7, H, -0.02, 0.3); fbx(t, F, u0 - 0.25, u1 + 0.25, H, H + 0.35, -0.02, 0.6);
      fbx(w, F, u0, u1, H + 0.35, PT - 0.25, -0.3, 0.15); fbx(t, F, u0 - 0.1, u1 + 0.1, PT - 0.25, PT, -0.3, 0.3); };
    // ---- the two blocks and the link ----
    const zc = 0.35, za = -14.55, zb = 15.2;
    bx(w, -5.4, 19.0, Y0, H, za, zb); bx(w, -21.6, -7.6, Y0, H, za, 14.5); bx(w, -7.7, -5.3, Y0, H, -8.1, 8.4); bx(w, -23.6, -21.5, Y0, H, -5.5, 7.0);
    // roofs behind the parapet, the atrium skylight
    hipR(rf, -5.0, 18.6, za + 0.4, zb - 0.4, PT - 0.6, 4.6, 0, B.p({c:'#8d4b34', lk:0.2}));
    hipR(rf, -21.2, -8.0, za + 0.4, 14.1, PT - 0.6, 4.2, 0);
    { const cx = 6.8, s = 7.0, y = PT + 1.4; bx(t, cx - s/2, cx + s/2, PT - 0.6, y, zc - s/2, zc + s/2); hipR(gl, cx - s/2, cx + s/2, zc - s/2, zc + s/2, y, 1.8, 0.15); }
    // parapet walls of the blocks (the long sides and the back)
    for (const F of [fc(-5.4, zb, 19.0, zb), fc(19.0, za, -5.4, za), fc(-21.6, 14.5, -7.6, 14.5), fc(-7.6, za, -21.6, za), fc(-23.6, -5.5, -23.6, 7.0), fc(-21.6, za, -21.6, -5.5), fc(-21.6, 7.0, -21.6, 14.5)]) bands(F, -0.05, F.L + 0.05);
    // ---- long sides: bays with windows and pilasters ----
    for (const [F, u0, u1, nb] of [[fc(-5.4, zb, 19.0, zb), 0, 24.4, 6], [fc(19.0, za, -5.4, za), 0, 24.4, 6], [fc(-21.6, 14.5, -7.6, 14.5), 0, 14.0, 3], [fc(-7.6, za, -21.6, za), 0, 14.0, 3]]){
      const bw = (u1 - u0)/nb;
      for (let k = 0; k < nf; k++){ for (let i = 0; i < nb; i++) win(F, u0 + (i + 0.5)*bw, k); for (let i = 0; i <= nb; i++) pil(F, u0 + i*bw, k, 0.55); }
    }
    for (const F of [fc(-23.6, -5.5, -23.6, 7.0)]) for (let k = 0; k < nf; k++){ win(F, 3.1, k, 1.3); win(F, 9.4, k, 1.3); }
    for (const F of [fc(-21.6, za, -21.6, -5.5), fc(-21.6, 7.0, -21.6, 14.5)]) for (let k = 0; k < nf; k++) win(F, F.L/2, k, 1.3);
    // ---- front pavilions with canted corners ----
    for (const s of [-1, 1]){
      const P = s < 0 ? [[19.0, -14.55], [20.6, -14.55], [23.4, -12.2], [23.4, -7.4], [21.2, -5.8], [19.0, -5.8]] : [[19.0, 15.2], [20.8, 15.2], [23.5, 12.8], [23.8, 8.0], [21.2, 5.95], [19.0, 5.95]];
      prismC(w, P, Y0, H);
      const E = edgesOut(P);
      for (const F of E){ if (Math.abs(F.nx) < 0.2 && F.L < 2.5 && Math.abs(F.ax - 19.0) < 0.1) continue;   // faces against the main block
        if (F.nx < -0.9) continue;
        bands(F, -0.05, F.L + 0.05);
        if (F.L > 3.5){ for (let k = 0; k < nf; k++){ win(F, F.L/2, k, 1.6); pil(F, 0.55, k); pil(F, F.L - 0.55, k); } }
        else if (F.L > 1.6){ for (let k = 0; k < nf; k++) win(F, F.L/2, k, 0.8); }
      }
      // pediment over the pavilion front (the long face towards +x)
      const Ff = E.reduce((a, b) => (b.nx > 0.9 && b.L > (a ? a.L : 0)) ? b : a, null);
      if (Ff){ fped(w, t, Ff, -0.3, Ff.L + 0.3, PT, 1.7, -0.4, 0.25); for (const u of [-0.1, Ff.L + 0.1]){ const c = fp(Ff, u, 0, 0.05); latheP(t, [[0.28, PT], [0.38, PT + 0.4], [0.2, PT + 0.8], [0.04, PT + 1.05]], c[0], c[2], 8); } }
      hipR(rf, 19.0, 22.9, s < 0 ? -13.9 : 6.6, s < 0 ? -6.4 : 14.6, PT - 0.6, 2.6, 0);
    }
    // ---- the central loggia: three tiers of Corinthian columns with balustrades, the entrance behind ----
    { const xc = 22.4, z0 = -5.8, z1 = 5.95, F = fc(xc, z1, xc, z0), Fw = fc(19.0, z1, 19.0, z0), L = F.L;
      for (let k = 0; k < nf; k++){ const y0 = fl(k), y1 = fl(k + 1);
        for (const u of [0.55, L/2 - 1.9, L/2 + 1.9, L - 0.55]){ const c = fp(F, u, 0, -0.35); segP(t, [c[0], y0 + 0.4, c[2]], [c[0], y1 - 0.9, c[2]], 0.27, 10, 0.24); bx(t, c[0] - 0.4, c[0] + 0.4, y0, y0 + 0.4, c[2] - 0.4, c[2] + 0.4); bx(t, c[0] - 0.42, c[0] + 0.42, y1 - 0.9, y1 - 0.45, c[2] - 0.42, c[2] + 0.42); }
        fbx(t, F, -0.05, L + 0.05, y1 - 0.45, y1, -3.4, 0.1);                          // floor slab / entablature
        if (k) fbal(t, F, 0.9, L - 0.9, y0, 1.05, -0.35, 0.18);
        // doors and windows on the back wall of the loggia
        for (const u of [L/2 - 3.2, L/2, L/2 + 3.2]){ if (k === 0 && u === L/2){ farch(dk, Fw, u, y0, 2.4, y0 + 3.0, 0.06, 6); continue; } frect(k ? lit : dk, Fw, u - 0.75, u + 0.75, y0 + 0.4, y0 + 3.5, 0.06); fbx(t, Fw, u - 1.0, u + 1.0, y0 + 3.5, y0 + 3.8, -0.02, 0.25); }
      }
      bands(F, -0.05, L + 0.05);
      // raised centre of the parapet: a segmental crest between scrolls (no lettering)
      const um = L/2; for (let i = 0; i < 8; i++){ const a = PI*i/8, b = PI*(i + 1)/8; Q(t, fp(F, um + Math.cos(a)*3.2, PT + Math.sin(a)*1.3, 0.25), fp(F, um + Math.cos(b)*3.2, PT + Math.sin(b)*1.3, 0.25), fp(F, um + Math.cos(b)*3.2, PT + Math.sin(b)*1.3 - 0.4, 0.25), fp(F, um + Math.cos(a)*3.2, PT + Math.sin(a)*1.3 - 0.4, 0.25));
        T3(w, fp(F, um, PT, 0.1), fp(F, um + Math.cos(a)*3.0, PT + Math.sin(a)*1.15, 0.1), fp(F, um + Math.cos(b)*3.0, PT + Math.sin(b)*1.15, 0.1)); }
      hipR(rf, 19.0, 22.6, z0, z1, PT - 0.6, 1.8, 0);
      // the entrance posts with the pair of cast-iron eagles, and the front steps
      for (const u of [L/2 - 2.6, L/2 + 2.6]){ const c = fp(F, u, 0, 1.6); bx(t, c[0] - 0.35, c[0] + 0.35, 0, 1.6, c[2] - 0.35, c[2] + 0.35); LBox(g, 0.45, 0.6, 0.35, c[0], 1.6, c[2], IR); }
      fbx(pl, F, 1.5, L - 1.5, -0.5, Y0 - 0.3, -0.2, 1.0);
    }
    B.flush(g); return g; }};
SG_PLACES.push({type:'peranakan', lat:1.294280, lon:103.849080, rot:-0.4957});   // front (+x) on Armenian Street (ESE)

// ===== Singapore Art Museum building (former Saint Joseph's Institution, Bras Basah Road): the two-storey central block
// (1867, Brother Lothaire Combes) with its arcaded front verandah, the porte-cochere carrying the bronze group of
// St Jean-Baptiste de La Salle with two children, the central pediment and the silver dome on an octagonal drum (c.1900,
// replacing the belfry); the two curved wings (1903, Father Charles Benedict Nain) with two-storey arcaded colonnades
// round the front lawn, ending in pedimented pavilions on Bras Basah Road; the chapel block behind (1912), Marseille-tile
// hipped roofs. Local axes: +x = bearing -38.5 deg (ESE, towards Queen Street), +z = SSW (the front, Bras Basah Road).
LANDMARKS.sam = {zh:'新加坡美术馆', en:'Singapore Art Museum', cat:'old', r:54, h:29.0,
  lt:{m:0, c:'#ffe6c2', k:1.0, e:0.55, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
    const W = '#efebe1', T = '#fbfaf5', D = '#2e3436', L = {c:'#3d3a31', glow:'#ffd08f', gk:0.6}, R = {c:'#ad5d3f', lk:0.25}, RC = {c:'#8e4a32', lk:0.2}, PL = '#c9c3b6',
      SV = {c:'#c4c9ce', lc:'#eef3ff', lk:1.25}, GR = {c:'#77a05b', lk:0.12}, BZ = '#4a4036';
    const w = B.p(W), t = B.p(T), dk = B.p(D), lit = B.p(L), rf = B.p(R), rc = B.p(RC), pl = B.p(PL), sv = B.p(SV);
    const P = {w, t, dk, lit, rf, rc, rng};
    const FP = [[3.3,6.6],[-5.2,6.6],[-5.3,-0.2],[-14.5,-0.4],[-14.9,9.7],[-21.0,10.7],[-26.9,14.7],[-27.4,22.7],[-43.6,23.5],[-43.5,15.9],[-41.7,7.6],[-30.6,-4.3],[-29.7,-23.2],[-26.3,-26.7],[-11.8,-26.8],[-10.3,-50.8],[3.2,-50.9],[3.8,-26.3],[23.6,-26.3],[23.7,-5.1],[31.4,-1.3],[36.0,2.6],[42.4,12.7],[43.9,25.1],[27.0,24.9],[26.6,17.6],[21.8,11.6],[14.4,10.0],[13.8,-0.2],[3.3,-0.1]];
    prismC(pl, FP, -5, 0.6);
    // the front lawn between the wings
    LPoly(g, [[-14.4, 0.2], [-14.4, 9.9], [-26.6, 15.0], [-27.2, 24.0], [26.8, 25.2], [26.2, 17.8], [14.2, 10.2], [13.7, 0.2]], -2.6, 2.3, GR);
    const Y0 = 0.6, H = 12.4, nf = 2, fh = (H - Y0)/nf;
    // ======== central block ========
    const cx0 = -30.0, cx1 = 23.6, cz0 = -26.6, cz1 = -4.5, zf = -0.3;
    bx(w, cx0, cx1, Y0, H, cz0, cz1);
    for (const F of [fc(cx1, cz0, cx0, cz0), fc(cx1, cz1, cx1, cz0), fc(cx0, cz0, cx0, cz1)]) wallF(P, F, Y0, H, nf, 3.6, null, 0.25);
    hipR(rf, cx0, cx1, cz0, zf, H, 4.8, 0.8, rc);
    // front verandah: two tiers of arcades on paired columns, balustrade on the upper tier, windows behind
    { const xa = -14.5, xb = 13.8, F = fc(xa, zf, xb, zf), Fw = fc(xa, cz1, xb, cz1), n = 8;
      fwins(dk, lit, Fw, 0.4, Fw.L - 0.4, Fw.L/n, [[Y0 + 0.2, fh*0.7, 'a', 1.5], [Y0 + fh + 0.2, fh*0.7, 'a', 1.5]], 0.05, rng, 0.4);
      for (let k = 0; k < nf; k++){ const yb = Y0 + k*fh;
        farcade(w, F, 0, F.L, n, yb, yb + fh*0.6, yb + fh, 0.8, -0.7, 0.05);
        for (let j = 0; j <= n; j++){ fcol(t, t, F, j*F.L/n - 0.42, 0.3, yb, yb + fh*0.6, 0.22, 6); fcol(t, t, F, j*F.L/n + 0.42, 0.3, yb, yb + fh*0.6, 0.22, 6); }
        if (k){ fbal(t, F, 0.4, F.L - 0.4, yb, 1.0, -0.3, 0.16); fbx(t, F, -0.05, F.L + 0.05, yb - 0.35, yb + 0.05, -4.2, 0.15); } }
      fbx(t, F, -0.2, F.L + 0.2, H - 0.6, H, -4.2, 0.4);
      fbx(t, F, 0, F.L, H - 0.65, H - 0.6, -4.2, -0.6);
      // central pediment over the entrance (plain roundel, no lettering) with its cross-gable into the main roof
      const um = -0.95 - xa, pw = 6.0;
      fbx(w, F, um - pw, um + pw, H - 0.6, H + 0.4, -0.5, 0.45);
      fped(w, t, F, um - pw, um + pw, H + 0.4, 2.7, -0.5, 0.35);
      for (let i = 0; i < 14; i++){ const a = i/14*TAU, b = (i + 1)/14*TAU; T3(t, fp(F, um, H + 1.5, 0.42), fp(F, um + Math.cos(a)*0.85, H + 1.5 + Math.sin(a)*0.85, 0.42), fp(F, um + Math.cos(b)*0.85, H + 1.5 + Math.sin(b)*0.85, 0.42)); }
      gabR(rf, null, -0.95 - pw, -0.95 + pw, -9.0, zf + 0.3, H + 0.4, 2.7, 'z', 0.3);
    }
    // ---- porte-cochere: open arches on three sides, balustraded terrace, the bronze group above the entrance ----
    { const xa = -5.2, xb = 3.3, za = zf, zb = 6.6, yt = 6.4;
      const Ff = fc(xa, zb, xb, zb), Fr = fc(xb, zb, xb, za), Fl = fc(xa, za, xa, zb);
      bx(pl, xa - 1.2, xb + 1.2, -0.6, Y0, za, zb + 0.4);
      for (const [F, n] of [[Ff, 3], [Fr, 2], [Fl, 2]]){ farcade(w, F, 0, F.L, n, Y0, 4.3, yt, 1.0, -0.8, 0.05);
        for (let j = 0; j <= n; j++){ const u = j*F.L/n; fcol(t, t, F, u - 0.3, 0.32, Y0, 4.3, 0.24, 8); fcol(t, t, F, u + 0.3, 0.32, Y0, 4.3, 0.24, 8); }
        fbx(t, F, -0.2, F.L + 0.2, yt - 0.5, yt, -0.8, 0.35); fbal(t, F, 0.1, F.L - 0.1, yt, 1.0, -0.2, 0.2); }
      bx(t, xa, xb, yt - 0.55, yt - 0.5, za, zb - 0.2); bx(w, xa + 0.6, xb - 0.6, yt - 0.2, yt, za, zb - 0.6);
      bx(lit, xa + 0.7, xb - 0.7, yt - 0.58, yt - 0.55, za + 0.3, zb - 0.9);       // lit porch ceiling
      // statue group: pedestal, the saint pointing ahead, a child on either side
      const sx = -0.95, sz = zb - 1.1, bz = B.p(BZ);
      bx(t, sx - 1.0, sx + 1.0, yt, yt + 1.0, sz - 0.7, sz + 0.7);
      segP(bz, [sx, yt + 1.0, sz], [sx, yt + 2.5, sz], 0.42, 8, 0.3); segP(bz, [sx, yt + 2.5, sz], [sx, yt + 3.0, sz], 0.26, 8, 0.24); LSph(g, 0.2, sx, yt + 3.2, sz, BZ, 1, 8);
      segP(bz, [sx + 0.2, yt + 2.6, sz], [sx + 0.5, yt + 2.9, sz + 0.7], 0.08, 4);
      for (const dx of [-0.65, 0.65]){ segP(bz, [sx + dx, yt + 1.0, sz + 0.15], [sx + dx, yt + 1.95, sz + 0.15], 0.22, 6, 0.17); LSph(g, 0.14, sx + dx, yt + 2.1, sz + 0.15, BZ, 1, 8); }
    }
    // ---- the dome: square attic, octagonal drum with arched windows, ribbed silver dome, lantern ----
    { const dx = -0.95, dz = -12.0, a0 = PI/8, rD = 4.7, y1 = 17.6, y2 = 20.4;
      bx(w, dx - 5.6, dx + 5.6, 14.5, y1, dz - 5.6, dz + 5.6);
      const Rq = rectF(dx - 5.6, dx + 5.6, dz - 5.6, dz + 5.6);
      for (const F of [Rq.f, Rq.r, Rq.b, Rq.l]){ fbx(t, F, -0.3, F.L + 0.3, y1 - 0.5, y1, -0.02, 0.4); for (const u of [0.4, F.L - 0.4]) fbx(t, F, u - 0.4, u + 0.4, 14.5, y1 - 0.5, -0.02, 0.25); }
      ngonP(w, dx, dz, rD, 8, y1, y2, a0);
      for (const F of ngonF(dx, dz, rD, 8, a0)){ farch(dk, F, F.L/2, y1 + 0.5, 1.2, y2 - 1.2, 0.05, 6); farch(t, F, F.L/2, y1 + 0.4, 1.6, y2 - 1.2, 0.02, 6); }
      for (let i = 0; i < 8; i++){ const a = a0 + i/8*TAU; segP(t, [dx + Math.cos(a)*(rD + 0.05), y1, dz + Math.sin(a)*(rD + 0.05)], [dx + Math.cos(a)*(rD + 0.05), y2, dz + Math.sin(a)*(rD + 0.05)], 0.16, 4); }
      latheP(t, [[rD + 0.05, y2], [rD + 0.4, y2 + 0.3], [rD + 0.4, y2 + 0.6], [rD - 0.1, y2 + 0.65]], dx, dz, 8, a0);
      const Dp = [[rD - 0.1, y2 + 0.65], [rD - 0.15, y2 + 1.4], [4.3, y2 + 2.3], [3.7, y2 + 3.3], [2.8, y2 + 4.2], [1.7, y2 + 4.8], [1.05, y2 + 5.05]];
      latheP(sv, Dp, dx, dz, 16, 0);
      for (let i = 0; i < 8; i++){ const a = i/8*TAU; for (let k = 0; k < Dp.length - 1; k++) segP(sv, [dx + Math.cos(a)*(Dp[k][0] + 0.06), Dp[k][1], dz + Math.sin(a)*(Dp[k][0] + 0.06)], [dx + Math.cos(a)*(Dp[k+1][0] + 0.06), Dp[k+1][1], dz + Math.sin(a)*(Dp[k+1][0] + 0.06)], 0.09, 3); }
      const yl = y2 + 5.05; ngonP(w, dx, dz, 1.05, 8, yl, yl + 1.7, a0);
      for (const F of ngonF(dx, dz, 1.05, 8, a0)) frect(lit, F, F.L/2 - 0.2, F.L/2 + 0.2, yl + 0.35, yl + 1.3, 0.04);
      latheP(t, [[1.2, yl + 1.7], [1.25, yl + 1.9], [0.9, yl + 1.95]], dx, dz, 8, a0);
      latheP(sv, [[0.9, yl + 1.95], [0.75, yl + 2.35], [0.35, yl + 2.65], [0.08, yl + 2.75]], dx, dz, 8, 0);
      LSph(g, 0.17, dx, yl + 2.95, dz, SV, 1, 8); segP(sv, [dx, yl + 3.0, dz], [dx, yl + 3.6, dz], 0.04, 4);
    }
    // ======== the curved wings: arcaded two-storey ranges facing the lawn, back-of-house behind, end pavilions ========
    const wing = (I, rearEdge, pav, zFront) => {
      const O = offAway(I, 10.0, [-1, 10]);
      strip(P, I, O, {y0:Y0, H, nf, vd:3.0, bay:3.7, rise:3.6, ov:0.8, noO:true, pl:0.3});
      // back-of-house block between the range and the real outer line (flat roof behind a parapet)
      const zc = pav[2], i2 = O[2], i3 = O[3], tz = (zc - i2[1])/(i3[1] - i2[1]), xe = i2[0] + (i3[0] - i2[0])*tz;
      const Fl = [O[0], ...rearEdge, [xe, zc], O[2], O[1]], HF = 10.8;
      wallsP(w, Fl, Y0, HF); capC(B.p({c:'#9b958b', lk:0.2}), Fl, HF - 0.05);
      const E = edgesOut(Fl);
      for (let i = 1; i <= rearEdge.length - 1; i++) wallF(P, E[i], Y0, HF, 2, 3.6, null, 0.2);
      for (const F of E) fbx(t, F, -0.1, F.L + 0.1, HF, HF + 0.8, -0.3, 0.1);
      // the end pavilion: two storeys, giant pilasters, a pediment towards Bras Basah Road, hipped roof
      const [x0, x1, z0, z1] = pav;
      bx(w, x0, x1, Y0, H, z0, z1);
      const Rp = rectF(x0, x1, z0, z1);
      for (const F of [Rp.f, Rp.l, Rp.r]){ wallF(P, F, Y0, H, nf, 3.5, null, 0.3); for (const u of [0.35, F.L - 0.35]) fbx(t, F, u - 0.5, u + 0.5, Y0, H - 0.5, -0.02, 0.3); }
      const Ff = Rp.f; for (const u of [Ff.L/2 - 3.6, Ff.L/2 + 3.6]) fbx(t, Ff, u - 0.45, u + 0.45, Y0, H - 0.5, -0.02, 0.35);
      fped(w, t, Ff, Ff.L/2 - 4.4, Ff.L/2 + 4.4, H, 2.3, -0.4, 0.4);
      for (let i = 0; i < 12; i++){ const a = i/12*TAU, b = (i + 1)/12*TAU; T3(t, fp(Ff, Ff.L/2, H + 0.95, 0.45), fp(Ff, Ff.L/2 + Math.cos(a)*0.6, H + 0.95 + Math.sin(a)*0.6, 0.45), fp(Ff, Ff.L/2 + Math.cos(b)*0.6, H + 0.95 + Math.sin(b)*0.6, 0.45)); }
      hipR(rf, x0, x1, z0, z1, H, 3.4, 0.8, rc);
      bx(pl, x0 + 4, x1 - 4, -0.6, Y0, z1, z1 + 1.2);
    };
    wing([[-14.6, -4.5], [-14.8, 8.2], [-26.9, 15.0], [-27.3, 19.0]], [[-30.4, -4.5], [-41.7, 7.6], [-43.5, 16.0]], [-43.6, -27.4, 16.0, 23.5]);
    wing([[13.8, -4.5], [14.2, 8.0], [26.3, 14.6], [26.8, 19.5]], [[31.4, -1.3], [36.0, 2.6], [42.4, 12.7], [43.4, 18.0]], [26.8, 43.9, 18.0, 25.0]);
    // ======== chapel block behind (hall below, chapel above), gabled with a rose window ========
    { const x0 = -10.3, x1 = 3.4, z0 = -50.9, z1 = -26.6, HC = 13.0;
      bx(w, x0, x1, Y0, HC, z0, z1);
      for (const F of [fc(x1, z1, x1, z0), fc(x0, z0, x0, z1)]){ fwins(dk, lit, F, 0.6, F.L - 0.6, 3.5, [[Y0 + 0.6, 3.6, 'a', 1.4], [Y0 + 6.6, 4.6, 'a', 1.5]], 0.05, rng, 0.35); fbx(t, F, -0.1, F.L + 0.1, Y0 + 5.9, Y0 + 6.3, -0.02, 0.25); fbx(t, F, -0.2, F.L + 0.2, HC - 0.5, HC, -0.02, 0.4); }
      gabR(rf, w, x0 - 0.5, x1 + 0.5, z0, z1, HC, 4.4, 'z', 0);
      const Fb = fc(x1, z0, x0, z0); fwins(dk, lit, Fb, 0.8, Fb.L - 0.8, 3.4, [[Y0 + 0.6, 3.6, 'a', 1.3], [Y0 + 6.6, 3.6, 'r', 1.3]], 0.05, rng, 0.3);
      for (let i = 0; i < 16; i++){ const a = i/16*TAU, b = (i + 1)/16*TAU; T3(t, fp(Fb, Fb.L/2, HC + 1.4, 0.03), fp(Fb, Fb.L/2 + Math.cos(a)*1.25, HC + 1.4 + Math.sin(a)*1.25, 0.03), fp(Fb, Fb.L/2 + Math.cos(b)*1.25, HC + 1.4 + Math.sin(b)*1.25, 0.03));
        T3(lit, fp(Fb, Fb.L/2, HC + 1.4, 0.06), fp(Fb, Fb.L/2 + Math.cos(a)*0.95, HC + 1.4 + Math.sin(a)*0.95, 0.06), fp(Fb, Fb.L/2 + Math.cos(b)*0.95, HC + 1.4 + Math.sin(b)*0.95, 0.06)); }
      fped(w, t, Fb, -0.3, Fb.L + 0.3, HC, 4.4, -0.02, 0.3);
    }
    B.flush(g); return g; }};
SG_PLACES.push({type:'sam', lat:1.297226, lon:103.850990, rot:-0.6720});   // front (+z) towards Bras Basah Road (SSW); wings at -x / +x

// ===== Masjid Hajjah Fatimah (1845-46; prayer hall rebuilt 1930s by Chung & Wong with Malay craftsmen), Beach Road:
// white walled compound with the prayer hall set askew to face Mecca, enclosed verandahs on three sides with lancet
// windows, merlon cresting and miniature cupolas along the parapets glazed with green Chinese tiles, a gold onion dome on
// a drum ringed with twelve lancet lights of yellow and green glass; the mausoleum behind the mihrab; the front ranges on
// the street side with the gateway and its Moorish timber balcony; and the four-stage, church-spire-like minaret with
// Doric pilasters, which leans about six degrees ("the leaning tower of Singapore").
// Local axes: +x = bearing -23 deg (ESE, the street side), so the qibla (bearing 157 deg, WNW) is -x; +z = SSW.
LANDMARKS.mhfatimah = {zh:'哈贾法蒂玛回教堂', en:'Masjid Hajjah Fatimah', cat:'old', r:30, h:27.8,
  lt:{m:0, c:'#fff0d6', k:0.95, e:0.5},
  build(){
    const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
    const W = '#f4f2ea', T = '#e0ddd2', D = '#363832', GT = {c:'#3f8a5d', lk:0.35}, PL = '#cdc6b6', WD = '#6e4b30',
      GOLD = {c:'#d6a63a', lc:'#ffd27e', lk:1.3, glow:'#b98a2e', gk:0.5}, YG = {c:'#55603a', glow:'#ffd27a', gk:0.65}, GG = {c:'#3a5a45', glow:'#a8e8a8', gk:0.55},
      L = {c:'#3d3b31', glow:'#ffd394', gk:0.55}, LAMP = {c:'#fff2cc', glow:'#ffd890', gk:1.6};
    const w = B.p(W), t = B.p(T), dk = B.p(D), gt = B.p(GT), pl = B.p(PL), lit = B.p(L), yg = B.p(YG), gg = B.p(GG), gd = B.p(GOLD);
    const FP = [[7.9,-5.3],[9.3,-13.0],[17.2,-11.1],[15.7,-4.0],[13.5,-4.4],[13.1,-2.3],[14.4,-0.9],[20.6,-9.4],[25.2,-6.1],[18.4,2.5],[19.5,3.4],[17.1,7.0],[15.0,5.2],[8.1,14.6],[3.2,10.9],[-14.9,10.9],[-15.4,5.2],[-19.9,5.3],[-19.5,3.2],[-25.2,3.6],[-25.8,-2.5],[-15.3,-3.8],[-15.4,-11.5],[4.4,-12.2],[4.3,-5.0]];
    prismC(pl, FP, -5, 0.6);
    const Y0 = 0.6;
    // lancet opening (pointed arch) with a moulded surround
    const lan = (o, F, u, y0, wd, ht) => { flancet(t, F, u, y0 - 0.15, wd + 0.4, y0 + ht - (wd + 0.4)*0.866, 0.03, 4); flancet(o, F, u, y0, wd, y0 + ht - wd*0.866, 0.07, 4); };
    // parapet along a face: green-tiled coping, merlons, and miniature cupolas at the ends
    const parapet = (F, y, cup) => { fbx(w, F, -0.1, F.L + 0.1, y, y + 0.55, -0.25, 0.1); fbx(gt, F, -0.15, F.L + 0.15, y + 0.55, y + 0.75, -0.3, 0.15);
      const n = Math.max(1, Math.round(F.L/1.2)); for (let i = 0; i < n; i++){ const u = (i + 0.5)*F.L/n; fbx(w, F, u - 0.28, u + 0.28, y + 0.75, y + 1.25, -0.22, 0.08); fbx(gt, F, u - 0.32, u + 0.32, y + 1.25, y + 1.35, -0.26, 0.12); }
      const nc = Math.max(2, Math.round(F.L/5.5) + 1);
      if (cup) for (const u of Array.from({length:nc}, (_, i) => 0.15 + i*(F.L - 0.3)/(nc - 1))){ const c = fp(F, u, 0, -0.1); latheP(w, [[0.42, y], [0.42, y + 1.5], [0.52, y + 1.65], [0.5, y + 1.95], [0.32, y + 2.25], [0.08, y + 2.45]], c[0], c[2], 8); latheP(gd, [[0.07, y + 2.4], [0.11, y + 2.6], [0.03, y + 2.75], [0.02, y + 3.0]], c[0], c[2], 6); } };
    // ======== prayer hall: verandah ring (lower) round a raised central hall ========
    const hx0 = -15.3, hx1 = 4.35, hz0 = -11.85, hz1 = 10.9, HV = 7.2, ix0 = -12.3, ix1 = 1.3, iz0 = -8.7, iz1 = 7.8, HI = 10.2;
    bx(w, hx0, hx1, Y0, HV, hz0, hz1); bx(w, ix0, ix1, HV, HI, iz0, iz1);
    bx(t, hx0, hx1, HV - 0.02, HV, hz0, hz1);
    const Rh = rectF(hx0, hx1, hz0, hz1), Ri = rectF(ix0, ix1, iz0, iz1);
    for (const [F, side] of [[Rh.f, 'f'], [Rh.b, 'b'], [Rh.r, 'r'], [Rh.l, 'l']]){
      if (side !== 'l'){ const n = Math.max(2, Math.round(F.L/3.1)); for (let i = 0; i < n; i++){ const u = (i + 0.5)*F.L/n; lan(rng() < 0.35 ? lit : dk, F, u, Y0 + 0.9, 1.3, 4.6); fbx(t, F, u + F.L/n/2 - 0.25, u + F.L/n/2 + 0.25, Y0, HV - 0.6, -0.02, 0.18); } }
      else { lan(dk, F, 3.0, Y0 + 1.2, 1.1, 3.6); lan(dk, F, F.L - 3.0, Y0 + 1.2, 1.1, 3.6); }
      fbx(t, F, -0.2, F.L + 0.2, HV - 0.6, HV, -0.02, 0.3); parapet(F, HV, true);
    }
    for (const F of [Ri.f, Ri.b, Ri.r, Ri.l]){ const n = Math.max(2, Math.round(F.L/2.6)); for (let i = 0; i < n; i++) lan(i % 3 === 1 ? gg : yg, F, (i + 0.5)*F.L/n, HV + 0.4, 0.8, 2.2); fbx(t, F, -0.2, F.L + 0.2, HI - 0.45, HI, -0.02, 0.3); parapet(F, HI, true); }
    // main doors on the east front of the hall (towards the forecourt)
    for (const u of [Rh.r.L/2 - 3.2, Rh.r.L/2, Rh.r.L/2 + 3.2]) lan(dk, Rh.r, u, Y0, 1.6, 4.4);
    // ---- the dome: drum with twelve lancet lights (yellow and green), gold onion dome, crescent finial ----
    { const cx = (ix0 + ix1)/2, cz = (iz0 + iz1)/2, rD = 3.6, y0 = HI, y1 = HI + 2.9;
      latheP(w, [[rD + 0.5, y0], [rD + 0.5, y0 + 0.5], [rD, y0 + 0.6], [rD, y1]], cx, cz, 24);
      for (let i = 0; i < 12; i++){ const a = Math.floor(i/3)*HP + (i % 3 - 1)*0.34, F = fc(cx + Math.cos(a + 0.12)*rD, cz + Math.sin(a + 0.12)*rD, cx + Math.cos(a - 0.12)*rD, cz + Math.sin(a - 0.12)*rD);
        const Fo = (F.nx*Math.cos(a) + F.nz*Math.sin(a)) > 0 ? F : fc(cx + Math.cos(a - 0.12)*rD, cz + Math.sin(a - 0.12)*rD, cx + Math.cos(a + 0.12)*rD, cz + Math.sin(a + 0.12)*rD);
        flancet((i % 3 === 1) ? gg : yg, Fo, Fo.L/2, y0 + 0.9, 0.55, y1 - 0.7, 0.04, 3); }
      latheP(t, [[rD, y1], [rD + 0.35, y1 + 0.2], [rD + 0.35, y1 + 0.45], [rD - 0.05, y1 + 0.5]], cx, cz, 24);
      const ON = [[rD - 0.05, 0], [rD + 0.45, 0.7], [rD + 0.75, 1.7], [rD + 0.7, 2.7], [rD + 0.2, 3.8], [rD - 0.7, 4.8], [1.6, 5.7], [0.75, 6.4], [0.3, 6.9], [0.08, 7.25], [0, 7.4]];
      LLathe(g, ON, cx, y1 + 0.5, cz, GOLD, 28);
      const T0 = y1 + 0.5 + 7.4;
      latheP(gd, [[0.16, T0 - 0.15], [0.24, T0 + 0.25], [0.07, T0 + 0.45], [0.2, T0 + 0.7], [0.05, T0 + 0.95], [0.04, T0 + 1.5]], cx, cz, 8);
      for (let i = 0; i < 12; i++){ const a = PI*0.25 + i/12*PI*1.5, b = PI*0.25 + (i + 1)/12*PI*1.5, r0 = 0.5, r1 = 0.36, oz = 0.12;
        Q(gd, [cx, T0 + 2.0 + Math.cos(a)*r0, cz + Math.sin(a)*r0], [cx, T0 + 2.0 + Math.cos(b)*r0, cz + Math.sin(b)*r0], [cx, T0 + 2.0 + Math.cos(b)*r1, cz + Math.sin(b)*r1 + oz], [cx, T0 + 2.0 + Math.cos(a)*r1, cz + Math.sin(a)*r1 + oz]); }
    }
    // ======== mausoleum behind the mihrab ========
    { const M = [[-15.3, 5.2], [-19.9, 5.3], [-19.5, 3.2], [-25.2, 3.6], [-25.8, -2.5], [-15.3, -3.8]], HM = 5.4;
      prismC(w, M, Y0, HM);
      for (const F of edgesOut(M)){ if (F.L > 2.5 && F.nx < 0.5) lan(dk, F, F.L/2, Y0 + 1.0, 0.9, 2.8); fbx(t, F, -0.1, F.L + 0.1, HM - 0.4, HM, -0.02, 0.25); if (F.nx < 0.5) parapet(F, HM, false); }
      latheP(w, [[1.4, HM], [1.4, HM + 0.6]], -22.2, 0.5, 12); LDome(g, 1.45, -22.2, HM + 0.6, 0.5, W, 1.15, 14);
      latheP(gd, [[0.08, HM + 2.25], [0.04, HM + 2.8]], -22.2, 0.5, 4);
    }
    // ======== the street-side ranges: vestibule round the minaret, the front range with the gateway and its balcony ========
    { const EP = [[4.3, -5.0], [7.9, -5.3], [9.3, -13.0], [17.2, -11.1], [15.7, -4.0], [13.5, -4.4], [13.1, -2.3], [14.4, -0.9], [20.6, -9.4], [25.2, -6.1], [18.4, 2.5], [19.5, 3.4], [17.1, 7.0], [15.0, 5.2], [8.1, 14.6], [3.2, 10.9], [4.3, 10.9]], HE = 6.2;
      prismC(w, EP, Y0, HE);
      const E = edgesOut(EP);
      for (let i = 0; i < E.length; i++){ const F = E[i];
        if (i === E.length - 1) continue;                         // against the hall
        if (F.L > 2.6){ const n = Math.max(1, Math.round(F.L/2.8)); for (let j = 0; j < n; j++) lan(rng() < 0.3 ? lit : dk, F, (j + 0.5)*F.L/n, Y0 + 0.8, 1.2, 3.8); }
        fbx(t, F, -0.1, F.L + 0.1, HE - 0.45, HE, -0.02, 0.25); parapet(F, HE, false);
      }
      // the gateway on the street (outer) side: tall lancet gate, the timber balcony above it on carved brackets
      const Fg = fc(19.5, 3.4, 17.1, 7.0), Fg2 = (Fg.nx*(18.3 - 12) + Fg.nz*(5.2 - 3)) > 0 ? Fg : fc(17.1, 7.0, 19.5, 3.4), wd = B.p(WD);
      prismC(w, [[18.4, 2.5], [19.5, 3.4], [17.1, 7.0], [15.0, 5.2]], HE, HE + 2.6);
      lan(dk, Fg2, Fg2.L/2, Y0, 2.0, 4.6);
      fbx(wd, Fg2, 0.2, Fg2.L - 0.2, HE - 0.1, HE + 0.15, -0.2, 1.1); fbx(wd, Fg2, 0.25, Fg2.L - 0.25, HE + 0.15, HE + 1.9, 0.6, 1.0);
      for (let k = 0; k < 6; k++){ const u = 0.4 + k*(Fg2.L - 0.8)/5; fbx(wd, Fg2, u - 0.06, u + 0.06, HE + 0.15, HE + 2.2, 0.95, 1.1); }
      fbx(wd, Fg2, 0.1, Fg2.L - 0.1, HE + 2.2, HE + 2.4, -0.2, 1.25);
      for (const u of [0.4, Fg2.L - 0.4]) fbx(wd, Fg2, u - 0.12, u + 0.12, HE - 1.0, HE, 0, 0.9);
      parapet(Fg2, HE + 2.6, true);
      // lamps either side of the gate
      for (const u of [-0.3, Fg2.L + 0.3]){ const c = fp(Fg2, u, 0, 0.25); LBox(g, 0.3, 0.5, 0.3, c[0], 3.2, c[2], LAMP); }
    }
    // ======== the leaning minaret (built apart, then tilted 6 deg about its base) ========
    { const M = mkB(), cx = 12.55, cz = -8.45, a = 0.233, s1 = 5.8, ca = Math.cos(a), sa = Math.sin(a);
      const mw = M.p(W), mt = M.p(T), mdk = M.p(D), mgt = M.p(GT), mlit = M.p(L), mgd = M.p(GOLD);
      // rotated square faces of the base
      const sq = (s) => { const h = s/2, P = [[-h, -h], [h, -h], [h, h], [-h, h]].map(([x, z]) => [cx + x*ca - z*sa, cz + x*sa + z*ca]); return {P, F:edgesOut(P)}; };
      const Sq = sq(s1), y1 = 11.2;
      wallsP(mw, Sq.P, -2, y1); capP(mw, Sq.P, y1);
      for (const F of Sq.F){
        for (const u of [0.3, F.L - 0.3]) fbx(mt, F, u - 0.32, u + 0.32, Y0, y1 - 0.8, -0.02, 0.25);     // Doric pilasters
        fbx(mt, F, -0.2, F.L + 0.2, y1 - 0.8, y1 - 0.2, -0.02, 0.35); fbx(mgt, F, -0.3, F.L + 0.3, y1 - 0.2, y1, -0.02, 0.45);
        flancet(mt, F, F.L/2, 6.1, 1.3, 8.6, 0.03, 4); flancet(rng() < 0.5 ? mlit : mdk, F, F.L/2, 6.25, 1.0, 8.6, 0.06, 4);
        fbx(mt, F, -0.1, F.L + 0.1, 5.4, 5.7, -0.02, 0.22);
      }
      flancet(mdk, Sq.F[1], Sq.F[1].L/2, Y0, 1.5, 3.6, 0.06, 4);
      // stage 2: octagon with pilasters at the angles and arched openings, balcony
      const st = (r, y0, y2, wn, bal) => { const a0 = a + PI/8; ngonP(mw, cx, cz, r, 8, y0, y2, a0); capP(mw, ngonF(cx, cz, r, 8, a0).map(F => [F.ax, F.az]), y2);
        for (const F of ngonF(cx, cz, r, 8, a0)){ farch(mdk, F, F.L/2, y0 + 0.5, wn, y2 - 0.9 - wn/2, 0.05, 6); fbx(mt, F, -0.06, F.L + 0.06, y2 - 0.5, y2, -0.02, 0.28); }
        for (let i = 0; i < 8; i++){ const aa = a0 + i/8*TAU; segP(mt, [cx + Math.cos(aa)*(r + 0.04), y0, cz + Math.sin(aa)*(r + 0.04)], [cx + Math.cos(aa)*(r + 0.04), y2 - 0.5, cz + Math.sin(aa)*(r + 0.04)], 0.15, 4); }
        if (bal){ latheP(mt, [[r, y2], [r + 0.55, y2 + 0.1], [r + 0.55, y2 + 0.3], [r - 0.1, y2 + 0.32]], cx, cz, 8, a0);
          for (const F of ngonF(cx, cz, r + 0.45, 8, a0)) fbal(mt, F, 0.05, F.L - 0.05, y2 + 0.3, 0.8, 0, 0.12); } };
      st(2.55, y1, 16.0, 0.9, true); st(1.95, 16.3, 20.2, 0.75, true); st(1.4, 20.5, 23.0, 0.55, false);
      // spire with a gold finial and crescent
      const a0 = a + PI/8; latheP(mt, [[1.55, 23.0], [1.55, 23.3], [1.3, 23.35]], cx, cz, 8, a0);
      latheP(mw, [[1.3, 23.35], [1.0, 24.4], [0.12, 26.5], [0.01, 26.6]], cx, cz, 8, a0);
      latheP(mgd, [[0.1, 26.5], [0.18, 26.75], [0.06, 26.9], [0.05, 27.2]], cx, cz, 8);
      for (let i = 0; i < 10; i++){ const p = PI*0.25 + i/10*PI*1.5, q = PI*0.25 + (i + 1)/10*PI*1.5, r0 = 0.38, r1 = 0.27;
        Q(mgd, [cx, 27.55 + Math.cos(p)*r0, cz + Math.sin(p)*r0], [cx, 27.55 + Math.cos(q)*r0, cz + Math.sin(q)*r0], [cx, 27.55 + Math.cos(q)*r1, cz + Math.sin(q)*r1 + 0.09], [cx, 27.55 + Math.cos(p)*r1, cz + Math.sin(p)*r1 + 0.09]); }
      // the lean: 6 degrees towards the street (local +x, a little to the north), pivoting on the base
      const th = 6*PI/180, dx = 0.94, dz = -0.34, ct = Math.cos(th), st6 = Math.sin(th);
      const lean = p => { const u = (p[0] - cx)*dx + (p[2] - cz)*dz, v = -(p[0] - cx)*dz + (p[2] - cz)*dx, y = p[1] - Y0; const u2 = u*ct + y*st6, y2 = -u*st6 + y*ct; return [cx + u2*dx - v*dz, Y0 + y2, cz + u2*dz + v*dx]; };
      for (const arr of [mw, mt, mdk, mgt, mlit, mgd]) xfm(arr, 0, lean);
      M.flush(g);
      // a lamp at the minaret door
      const c = lean([cx + 3.2, 4.0, cz]); LBox(g, 0.3, 0.45, 0.3, c[0], c[1], c[2], LAMP);
    }
    B.flush(g); return g; }};
SG_PLACES.push({type:'mhfatimah', lat:1.302830, lon:103.862950, rot:-0.4014});   // street side +x (ESE); prayer hall faces the qibla at -x

// ===== Malay Heritage Centre (Istana Kampong Gelam, c.1840, attributed to G. D. Coleman): the yellow two-storey palace of
// the Sultans of Johor, Palladian with Malay touches: symmetrical, a raised ground floor, a projecting two-storey entrance
// porch with round arches below and the upper room carried over it (like a house on stilts), Doric pilasters, large
// timber-louvred windows, side bays, and a steep limas-like hipped roof with wide overhanging eaves; lawn and palms.
// Local axes: +x = bearing 34 deg (NE), +z = bearing -56 deg (SE): the porch and the garden front face +z.
LANDMARKS.malayheritage = {zh:'马来传统文化馆', en:'Malay Heritage Centre (Istana Kampong Gelam)', cat:'old', r:30, h:16.0,
  lt:{m:0, c:'#ffe2b4', k:1.1, e:0.6, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
    const W = '#e6bf58', T = '#f6f2e6', LV = '#4d5c45', D = '#2f3530', L = {c:'#3e3a2c', glow:'#ffd08a', gk:0.6}, R = {c:'#7c4434', lk:0.25}, RC = {c:'#6a3a2c', lk:0.2}, PL = '#cec5b0',
      GR = {c:'#76a05a', lk:0.12}, TT = '#6b5a45', PF = {c:'#4f7a3e', lk:0.18};
    const w = B.p(W), t = B.p(T), lv = B.p(LV), dk = B.p(D), lit = B.p(L), rf = B.p(R), rc = B.p(RC), pl = B.p(PL);
    const FP = [[8.4,3.4],[8.6,12.8],[3.8,12.4],[4.0,17.5],[-4.1,17.7],[-4.0,12.2],[-9.1,12.3],[-8.4,2.8],[-11.3,2.9],[-11.5,-8.7],[-8.6,-8.8],[-8.4,-14.4],[8.8,-14.3],[8.6,-8.7],[11.3,-8.3],[11.4,3.3]];
    LPoly(g, [[-8.9, -15.0], [9.2, -15.0], [12.2, -9.2], [12.5, 24], [-12.5, 24], [-12.1, -9.2]], -2.7, 2.35, GR);
    prismC(pl, FP, -5, 1.1);
    const Y0 = 1.1, fh = 4.55, H = Y0 + 2*fh, x0 = -8.5, x1 = 8.6, z0 = -14.35, z1 = 12.35;
    // timber-louvred window in a white architrave (some lit at night), and a two-storey Doric pilaster
    const louv = (F, u, y, ht, wd) => { wd = wd || 1.5; fbx(t, F, u - wd/2 - 0.22, u + wd/2 + 0.22, y - 0.15, y + ht + 0.15, -0.02, 0.08);
      if (rng() < 0.3){ frect(lit, F, u - wd/2, u + wd/2, y, y + ht, 0.1); } else { frect(lv, F, u - wd/2, u + wd/2, y, y + ht, 0.1); for (let yy = y + 0.2; yy < y + ht - 0.1; yy += 0.3) fbx(t, F, u - wd/2, u + wd/2, yy, yy + 0.05, 0.1, 0.14); fbx(t, F, u - 0.03, u + 0.03, y, y + ht, 0.1, 0.15); }
      fbx(t, F, u - wd/2 - 0.4, u + wd/2 + 0.4, y + ht + 0.15, y + ht + 0.45, -0.02, 0.3); };
    const pil = (F, u) => { fbx(t, F, u - 0.35, u + 0.35, Y0, H - 0.6, -0.02, 0.22); fbx(t, F, u - 0.45, u + 0.45, Y0, Y0 + 0.5, -0.02, 0.3); fbx(t, F, u - 0.48, u + 0.48, H - 1.0, H - 0.6, -0.02, 0.32); };
    const face = (F, nb, pils) => { const bw = F.L/nb;
      for (let i = 0; i < nb; i++){ const u = (i + 0.5)*bw; louv(F, u, Y0 + 0.7, 2.9); louv(F, u, Y0 + fh + 0.6, 2.9); }
      if (pils) for (let i = 0; i <= nb; i++) pil(F, Math.min(F.L - 0.35, Math.max(0.35, i*bw)));
      fbx(t, F, -0.05, F.L + 0.05, Y0 + fh - 0.25, Y0 + fh + 0.1, -0.02, 0.25); fbx(t, F, -0.15, F.L + 0.15, H - 0.6, H, -0.02, 0.35);
      fbx(pl, F, -0.05, F.L + 0.05, 0, Y0, -0.02, 0.12); };
    // ---- main block ----
    bx(w, x0, x1, Y0, H, z0, z1);
    const Rm = rectF(x0, x1, z0, z1);
    face(Rm.b, 4, true);
    for (const F of [Rm.f]) face(F, 4, true);
    // long sides: the bays either side of the side projections
    for (const F of [Rm.r, Rm.l]){
      // windows on the free parts only (the side bays cover z -8.7 .. 3.2)
      const ua = F === Rm.r ? z1 - 3.2 : -8.7 - z0, ub = F === Rm.r ? z1 + 8.7 : 3.2 - z0, segs = [[0.0, ua - 0.3], [ub + 0.3, F.L]];
      for (const [u0, u1] of segs){ const m = Math.max(1, Math.round((u1 - u0)/3.3)); for (let i = 0; i < m; i++){ const u = u0 + (i + 0.5)*(u1 - u0)/m; louv(F, u, Y0 + 0.7, 2.9, 1.3); louv(F, u, Y0 + fh + 0.6, 2.9, 1.3); } }
      fbx(t, F, -0.05, F.L + 0.05, Y0 + fh - 0.25, Y0 + fh + 0.1, -0.02, 0.25); fbx(t, F, -0.15, F.L + 0.15, H - 0.6, H, -0.02, 0.35); pil(F, 0.35); pil(F, F.L - 0.35); }
    hipR(rf, x0, x1, z0, z1, H, 5.6, 1.3, rc);
    // ---- side bays (two storeys, own hipped roofs) ----
    for (const s of [-1, 1]){ const xa = s > 0 ? x1 : -11.4, xb = s > 0 ? 11.35 : x0, za = -8.7, zb = 3.2;
      bx(w, xa, xb, Y0, H - 0.4, za, zb);
      const Rs = rectF(xa, xb, za, zb), Fo = s > 0 ? Rs.r : Rs.l;
      for (let i = 0; i < 3; i++){ const u = (i + 0.5)*Fo.L/3; louv(Fo, u, Y0 + 0.7, 2.9, 1.4); louv(Fo, u, Y0 + fh + 0.6, 2.7, 1.4); }
      for (const F of [Rs.f, Rs.b]) { louv(F, F.L/2, Y0 + fh + 0.6, 2.7, 1.1); }
      for (const F of [Fo, Rs.f, Rs.b]){ fbx(t, F, -0.05, F.L + 0.05, Y0 + fh - 0.25, Y0 + fh + 0.1, -0.02, 0.25); fbx(t, F, -0.15, F.L + 0.15, H - 1.0, H - 0.4, -0.02, 0.35); fbx(pl, F, -0.05, F.L + 0.05, 0, Y0, -0.02, 0.12); }
      pil(Fo, 0.35); pil(Fo, Fo.L - 0.35);
      hipR(rf, xa, xb, za, zb, H - 0.4, 2.2, 0.9, rc);
    }
    // ---- the entrance porch: round arches below, the upper room carried on columns, hipped roof; steps ----
    { const xa = -4.05, xb = 3.95, za = z1, zb = 17.6, ht = Y0 + fh;
      const Rp = rectF(xa, xb, za, zb);
      for (const [F, n] of [[Rp.f, 3], [Rp.r, 2], [Rp.l, 2]]){ farcade(w, F, 0, F.L, n, Y0, Y0 + 2.6, ht, 0.85, -0.6, 0.05);
        for (let j = 0; j <= n; j++) fcol(t, t, F, Math.min(F.L - 0.3, Math.max(0.3, j*F.L/n)), 0.25, Y0, ht - 0.3, 0.25, 8);
        fbx(t, F, -0.1, F.L + 0.1, ht - 0.35, ht + 0.1, -0.6, 0.35); }
      bx(w, xa, xb, ht, H - 0.3, za, zb);                                                     // the upper room
      for (const F of [Rp.f, Rp.r, Rp.l]){ const n = F === Rp.f ? 3 : 2; for (let i = 0; i < n; i++) louv(F, (i + 0.5)*F.L/n, ht + 0.6, 2.7, 1.2);
        for (const u of [0.3, F.L - 0.3]) fbx(t, F, u - 0.3, u + 0.3, ht, H - 0.7, -0.02, 0.22); fbx(t, F, -0.15, F.L + 0.15, H - 0.8, H - 0.3, -0.02, 0.35); }
      bx(lit, xa + 0.7, xb - 0.7, ht - 0.42, ht - 0.38, za + 0.2, zb - 0.7);                    // lit porch ceiling
      farch(dk, Rm.f, -0.05 - x0, Y0, 1.9, Y0 + 2.4, 0.06, 6);
      hipRot(rf, (xa + xb)/2, (za + zb)/2 - 0.6, HP, zb - za + 1.2, xb - xa, H - 0.3, 2.6, 0.9, rc);
      fbx(pl, Rp.f, 0.6, Rp.f.L - 0.6, -0.6, Y0 - 0.35, -0.2, 2.2); fbx(pl, Rp.f, 1.2, Rp.f.L - 1.2, -0.6, Y0 - 0.7, 2.0, 3.6);
    }
    // ---- palms and frangipani in the grounds ----
    { const tt = B.p(TT), pf = B.p(PF);
      for (const [x, z, h] of [[-11.0, 20.5, 9.5], [11.0, 20.5, 9.0], [-11.4, 9.0, 7.5], [11.4, 9.5, 8.0], [-7.0, 22.5, 6.5], [7.0, 22.8, 7.0]]) palmP(tt, pf, x, z, h, 1.0, rng); }
    B.flush(g); return g; }};
SG_PLACES.push({type:'malayheritage', lat:1.302887, lon:103.859828, rot:0.5934});   // porch and garden front (+z) face SE
}
