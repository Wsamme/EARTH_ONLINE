// ===== lm18/a: Civic District heritage (Raffles Hotel, National Gallery, Supreme Court, Victoria Theatre & Concert Hall,
// St Andrew's Cathedral, CHIJMES). Block-scoped: only LANDMARKS and SG_PLACES are touched.
// Real dimensions in metres; y = 0 is the ground; every plan was traced from the real footprint in local axes
// (see SG_PLACES at the end for each origin and turn); the main front of each model faces local +z.
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

// ===== Raffles Hotel (1887 / 1899, Swan & Maclaren): the white three-storey Main Building with verandahs, angled corner
// pavilions, the cast-iron porte-cochere and red-tiled hipped roofs; the wings round the Palm Court, the Lawn and the
// courtyards (Palm Court Wing, Bras Basah Wing, Bar & Billiard Room) and the 1991 arcade along North Bridge Road and Seah Street.
// Plans are drawn in the Main Building's axes (+x = bearing 56.5 deg along Beach Road, +z = front towards Beach Road),
// then shifted so that the origin of the landmark is the middle of the hotel block.
LANDMARKS.raffleshotel = {zh:'莱佛士酒店', en:'Raffles Hotel', cat:'old', r:130, h:25,
  lt:{m:0, c:'#ffd9a8', k:1.0, e:0.5},
  build(){
    const g = new THREE.Group(), h = new THREE.Group(); h.position.set(-35, 0, 12); g.add(h);
    const B = mkB(), rng = LMCTX.rng;
    const W = '#f4f1e9', T = '#fbfaf6', D = '#2c3237', L = {c:'#3d362c', glow:'#ffcd8a', gk:0.6}, RT = {c:'#97492f', lk:0.35}, RC = {c:'#7a3a26', lk:0.3}, PL = '#c9c2b4',
      CI = '#e6dfcf', GLR = {c:'#7f939b', glow:'#ffe0a8', gk:0.35}, TT = '#6b5a45', TL = {c:'#56803f', lk:0.2};
    const w = B.p(W), t = B.p(T), dk = B.p(D), lit = B.p(L), rt = B.p(RT), ci = B.p(CI), glr = B.p(GLR), tt = B.p(TT), tl = B.p(TL);
    const P = {w, t, dk, lit, rf:rt, rc:B.p(RC), rng};
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
    hipR(rt, -17.3, 16.8, -8.0, 52.9, 16.4, 5.4, 1.3, P.rc, t);
    bx(w, -3.6, 2.6, 20.6, 22.8, 14.0, 32.0); hipR(rt, -3.6, 2.6, 14.0, 32.0, 22.8, 1.9, 0.7, P.rc, t);       // lantern over the lobby atrium
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
    // ======== palms: the front lawn on Beach Road, the Palm Court, the Lawn ========
    for (const [x, z, hh] of [[-30, 74, 11], [-20, 80, 12], [30, 74, 11], [40, 80, 12], [-34, 84, 10], [46, 70, 10], [24, 30, 12], [30, 50, 13], [44, 46, 11], [26, 62, 12], [48, 60, 12], [-40, 16, 10], [-28, 20, 11], [-6, -74, 9]])
      palmP(tt, tl, x, z, hh, 1.0, rng);
    B.flush(h); return g; }};

// ===== National Gallery Singapore: former Supreme Court (1939, dome + Corinthian portico) and former City Hall (1929,
// 18-column Corinthian colonnade over the steps to the Padang), linked by studioMilou's 2015 gold filigree roof canopy.
// Local axes: +x = bearing 60.3 deg (NNE along St Andrew's Road), +z = front (ESE, the Padang).
// Old Supreme Court x -107..-24, link x -24..-10.7, City Hall x -10.7..106.4.
LANDMARKS.natgallery = {zh:'新加坡国家美术馆', en:'National Gallery Singapore', cat:'old', r:120, h:42,
  lt:{m:0, c:'#ffdcae', k:1.0, e:0.45},
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

// ===== Supreme Court of Singapore (2005, Foster + Partners with CPG): stone-clad court blocks round a glazed atrium,
// a lower annex towards High Street, a tall colonnade along Supreme Court Lane and the 67 m two-storey disc of the
// Court of Appeal floating on top. Local axes: +x = bearing 60.5 deg (NNE), +z = front (ESE, Supreme Court Lane / Padang).
LANDMARKS.supremecourt = {zh:'新加坡最高法院', en:'Supreme Court of Singapore', cat:'new', r:74, h:60,
  lt:{m:0, c:'#fff0dc', k:0.95, e:0.55},
  build(){
    const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
    const ST = '#d9d0bf', ST2 = '#cbc1ae', GZ = {c:'#33404a', m:1, fh:4.4, cw:3.0}, GA = {c:'#5f7683', m:1, fh:4.4, cw:2.2}, RF = {c:'#77736b', lk:0.2},
      DT = {c:'#b4b9bd', lk:0.5}, DU = {c:'#c4c8cb', glow:'#fff4e2', gk:0.45}, DB = {c:'#2f3a44', glow:'#ffe2b0', gk:0.5}, GR = {c:'#5f7a4c', lk:0.2}, PL = '#bfb6a5', STL = '#9a9ea2';
    const st = B.p(ST), st2 = B.p(ST2), gz = B.p(GZ), ga = B.p(GA), rf = B.p(RF), dt = B.p(DT), du = B.p(DU), db = B.p(DB), gr = B.p(GR), stl = B.p(STL);
    const FP = [[55.0,-30.2],[55.7,37.3],[-60.0,37.6],[-48.9,-39.3],[55.4,-39.2]];
    LPoly(g, FP, -5, 5.6, PL);
    const Y0 = 0.6;
    // ---- base storey: glazed lobby behind stone piers, full footprint ----
    const zf = 37.4, zb = -39.2, xr = 55.5, xl = z => -60.0 + (z - 37.6)*(11.1/-76.9);   // slanted west edge (along North Bridge Road)
    LPoly(g, [[xr - 1.2, zb + 1.2], [xr - 1.2, zf - 1.2], [xl(zf) + 1.4, zf - 1.2], [xl(zb) + 1.2, zb + 1.2]], Y0, 8.4 - Y0, GA);
    // ---- lower annex (x < -25): stone with ribbon windows, roof garden ----
    { const P = [[-25, zb], [-25, zf], [xl(zf), zf], [xl(zb), zb]];
      LPoly(g, P, 8.4, 9.6, ST);
      for (let z = -32; z < 33; z += 8.5){ const xa = xl(z) + 3.0, xb = -28.0; bx(st2, xa, xb, 18.0, 18.6, z - 1.2, z + 1.2); bx(gr, xa + 0.3, xb - 0.3, 18.6, 18.8, z - 0.9, z + 0.9);
        for (let x = xa + 2.5; x < xb - 1; x += 7.0) treeP(stl, gr, x, z, 0.7, rng); }
      const fa = [fc(xl(zf), zf, -25, zf), fc(xl(zb), zb, xl(zf), zf), fc(-25, zb, xl(zb), zb)];
      for (const F of fa){ for (let y = 9.6; y < 17; y += 4.2) frect(gz, F, 0.8, F.L - 0.8, y, y + 2.0, 0.06);
        for (let u = 1.5; u < F.L - 1; u += 1.6) fbx(st2, F, u - 0.12, u + 0.12, 9.4, 17.6, 0, 0.45);
        fbx(st, F, -0.3, F.L + 0.3, 17.6, 18.3, -0.02, 0.5); } }
    // ---- the two court blocks either side of the atrium ----
    const TOP = 44, z0 = -30.2, z1 = 27.0;
    for (const [x0, x1] of [[-25.0, 6.0], [26.0, 55.5]]){
      bx(st, x0, x1, 8.4, TOP, z0, z1); bx(rf, x0 + 0.5, x1 - 0.5, TOP, TOP + 0.1, z0 + 0.5, z1 - 0.5);
      bx(st2, x0 - 0.4, x1 + 0.4, TOP - 1.0, TOP + 0.6, z0 - 0.4, z1 + 0.4);
      const F = rectF(x0, x1, z0, z1);
      for (const s of ['f', 'b', 'l', 'r']){ const fa = F[s], ew = s === 'f' || s === 'b';
        frect(gz, fa, 1.2, fa.L - 1.2, 9.6, TOP - 1.4, 0.04);                                   // glazing behind the stone frame
        for (let y = 9.6; y < TOP - 1; y += 4.4) fbx(st, fa, 0, fa.L, y, y + 1.0, 0, 0.9);       // floor bands
        const sp = ew ? 3.0 : 4.2;
        for (let u = 1.2; u < fa.L - 0.6; u += sp) fbx(st, fa, u - 0.3, u + 0.3, 9.6, TOP - 1.0, 0, 0.9);   // mullions
        if (ew) for (let u = 1.2 + sp/2; u < fa.L - 0.6; u += sp) fbx(st2, fa, u - 0.06, u + 0.06, 9.6, TOP - 1.0, 0, 1.2);  // sun louvres
        fbx(st, fa, -0.2, 1.2, 8.4, TOP, -0.02, 0.9); fbx(st, fa, fa.L - 1.2, fa.L + 0.2, 8.4, TOP, -0.02, 0.9); }
      // planted roof terrace
      for (let k = 0; k < 6; k++){ const x = x0 + 4 + rng()*(x1 - x0 - 8), z = z0 + 4 + rng()*(z1 - z0 - 8); treeP(stl, gr, x, z, 0.8, rng); }
    }
    // lower court floors in front of and behind the blocks (to 18 m, the cornice line of the old Supreme Court), terraces above
    for (const [a0, a1] of [[-25.0, 6.0], [26.0, xr]]) for (const [b0, b1, fz] of [[z1, zf, 1], [zb, z0, -1]]){
      bx(st, a0, a1, 8.4, 18.0, b0, b1); bx(rf, a0 + 0.4, a1 - 0.4, 18.0, 18.08, b0 + 0.4, b1 - 0.4);
      const F = fz > 0 ? fc(a0, zf, a1, zf) : fc(a1, zb, a0, zb);
      frect(gz, F, 0.8, F.L - 0.8, 9.6, 17.0, 0.04);
      for (let y = 9.6; y < 17.5; y += 4.4) fbx(st, F, 0, F.L, y, y + 0.9, 0, 0.8);
      for (let u = 1.0; u < F.L - 0.5; u += 3.0) fbx(st, F, u - 0.3, u + 0.3, 9.6, 18.0, 0, 0.8);
      fbx(st2, F, -0.2, F.L + 0.2, 17.6, 18.9, -0.02, 0.9); fbal(stl, F, 0.4, F.L - 0.4, 18.9, 1.0, -0.6, 0.12);
      for (let u = 4; u < F.L - 2; u += 9){ const c = fp(F, u, 0, -4); bx(st2, c[0] - 1.2, c[0] + 1.2, 18.0, 18.8, c[2] - 1.2, c[2] + 1.2); latheP(gr, [[0.01, 18.8], [1.8, 19.6], [2.0, 20.8], [1.2, 21.8], [0.01, 22.2]], c[0], c[2], 7); } }
    // ---- the atrium between the blocks: glazed front and back walls with mullions, glass roof ----
    for (const z of [z1 - 0.2, z0 + 0.2]){ bx(ga, 6.0, 26.0, 8.4, TOP - 0.5, z - 0.1, z + 0.1); for (let x = 7.0; x < 26; x += 2.0) bx(stl, x - 0.08, x + 0.08, 8.4, TOP - 0.5, z - 0.35, z + 0.35); for (let y = 12.8; y < TOP; y += 4.4) bx(stl, 6.0, 26.0, y - 0.08, y + 0.08, z - 0.3, z + 0.3); }
    bx(ga, 6.0, 26.0, TOP - 0.6, TOP - 0.4, z0, z1);
    // ---- the front colonnade along Supreme Court Lane: tall slender columns carrying the podium edge ----
    { const F = fc(-25.0, zf, xr, zf);
      for (let u = 1.2; u < F.L; u += 4.0) { const c = fp(F, u, 0, -0.9); segP(st, [c[0], Y0, c[2]], [c[0], 8.4, c[2]], 0.42, 8); }
      fbx(st, F, -0.4, F.L + 0.4, 8.4, 9.9, -2.0, 0.3);
      // the tall portal of the entrance: thin columns two storeys high in front of the atrium
      for (let k = 0; k < 6; k++){ const x = 7.0 + k*3.6; segP(st, [x, 9.6, zf - 1.2], [x, 30.0, zf - 1.2], 0.38, 8); }
      bx(st, 5.5, 26.5, 30.0, 31.5, zf - 2.5, zf - 0.2); bx(st, 5.5, 26.5, 30.0, 30.2, z1, zf - 0.2);
      // back (North Bridge Road) entrance colonnade
      const Fb = fc(xr, zb, -25.0, zb); for (let u = 1.2; u < Fb.L; u += 4.0){ const c = fp(Fb, u, 0, -0.9); segP(st, [c[0], Y0, c[2]], [c[0], 8.4, c[2]], 0.42, 8); }
      fbx(st, Fb, -0.4, Fb.L + 0.4, 8.4, 9.9, -2.0, 0.3);
      const Fr = fc(xr, zf, xr, zb); for (let u = 1.2; u < Fr.L; u += 4.0){ const c = fp(Fr, u, 0, -0.9); segP(st, [c[0], Y0, c[2]], [c[0], 8.4, c[2]], 0.42, 8); }
      fbx(st, Fr, -0.4, Fr.L + 0.4, 8.4, 9.9, -2.0, 0.3);
    }
    // ---- the disc: supports, a lit underside, a glazed rim band and the shallow metal roof ----
    { const cx = 17.0, cz = -2.0, R = 33.5, yb = 49.0;
      latheP(st2, [[9.0, TOP], [9.0, yb - 0.6]], cx, cz, 24); // central drum
      for (let i = 0; i < 10; i++){ const a = i/10*TAU; segP(stl, [cx + Math.cos(a)*19, TOP, cz + Math.sin(a)*19], [cx + Math.cos(a)*21, yb - 0.5, cz + Math.sin(a)*21], 0.35, 6); }
      const N = 48;
      latheP(du, [[0.01, yb - 0.4], [R*0.5, yb - 0.1], [R - 1.2, yb + 0.6], [R, yb + 1.4]], cx, cz, N);
      latheP(db, [[R - 0.5, yb + 1.4], [R - 0.35, yb + 2.0], [R - 0.35, yb + 5.4], [R - 0.5, yb + 5.9]], cx, cz, N);
      latheP(dt, [[R, yb + 5.9], [R - 0.6, yb + 6.6], [R*0.75, yb + 8.6], [R*0.45, yb + 10.2], [R*0.2, yb + 10.9], [0.01, yb + 11.0]], cx, cz, N);
      const fin = B.p({c:'#cfd3d6', lk:0.6});
      for (let i = 0; i < N*3; i++){ const a = i/(N*3)*TAU, c = Math.cos(a), s1 = Math.sin(a); Q(fin, [cx + c*(R - 0.4), yb + 1.4, cz + s1*(R - 0.4)], [cx + c*(R + 0.5), yb + 1.4, cz + s1*(R + 0.5)], [cx + c*(R + 0.5), yb + 5.9, cz + s1*(R + 0.5)], [cx + c*(R - 0.4), yb + 5.9, cz + s1*(R - 0.4)]); }
    }
    B.flush(g); return g; }};

// ===== Victoria Theatre (1862) and Victoria Memorial Hall (1905), linked by the 54 m clock tower (1906) =====
// Plan in local axes: +x = bearing 55 deg (NE, towards the Padang), +z = front (SE, Empress Place).
// Theatre = west half (x < 0), Concert Hall = east half; the clock tower stands in the recessed centre of the front.
LANDMARKS.victoria = {zh:'维多利亚剧院及音乐会堂', en:'Victoria Theatre and Concert Hall', cat:'old', r:56, h:54,
  lt:{m:0, c:'#ffd9a6', k:1.0, e:0.45},
  build(){
    const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
    const W = '#eeeae0', T = '#f8f6f0', D = '#2c3238', L = {c:'#3b352c', glow:'#ffcf8e', gk:0.55}, R = {c:'#62666b', lk:0.35}, P = '#c8c1b2',
      K = {c:'#f6f2e6', glow:'#fff3d6', gk:1.1}, KD = '#23262a', CU = {c:'#c9c7c0', lk:0.6};
    const w = B.p(W), t = B.p(T), dk = B.p(D), lit = B.p(L), rf = B.p(R), kc = B.p(K), kd = B.p(KD), cu = B.p(CU);
    // foundation / plinth: the traced footprint
    const FP = [[31.6,15.6],[38.1,15.5],[37.8,24.4],[29.7,24.3],[29.8,31.5],[13.9,31.7],[13.9,24.4],[-13.0,24.3],[-13.0,31.5],[-28.3,31.4],[-28.4,24.9],[-36.5,24.7],[-37.1,15.6],[-34.2,15.7],[-34.2,-23.5],[-28.2,-23.4],[-28.3,-30.6],[-9.5,-30.6],[-9.6,-24.7],[-4.1,-25.0],[-4.2,-22.0],[4.5,-22.2],[4.4,-24.3],[11.7,-24.3],[11.8,-30.2],[31.4,-30.2],[31.4,-25.0],[37.8,-25.1],[37.8,-12.8],[31.1,-13.1]];
    LPoly(g, FP, -5, 5.6, P);
    const Y0 = 0.6, EH = 17, RH = 6.4;
    // --- the two halls: tall gabled boxes, hipped at the back ---
    for (const [x0, x1] of [[-28.3, -9.5], [11.8, 31.3]]){
      const z0 = -30.4, z1 = 24.4; bx(w, x0, x1, Y0, EH, z0, z1);
      corniceR(t, x0, x1, z0, z1, EH - 1.0, 1.0, 0.45);
      gabHipZ(rf, w, x0, x1, z0, z1, EH, RH, 0.6);
      const F = rectF(x0, x1, z0, z1);
      // clerestory windows above the aisles / link
      for (const s of ['l', 'r']) fwins(dk, lit, F[s], 3, F[s].L - 3, 4.6, [[12.0, 3.8, 'a', 1.7]], 0.05, rng, 0.3);
      fpil(t, F.l, 0.5, F.l.L - 0.5, 12, 11.2, EH - 1, 0.55, 0.25); fpil(t, F.r, 0.5, F.r.L - 0.5, 12, 11.2, EH - 1, 0.55, 0.25);
      // back elevation: two tiers of arched windows between pilasters, rusticated base band
      fwins(dk, lit, F.b, 1.5, F.b.L - 1.5, 3.8, [[2.0, 3.6, 'a', 1.5], [8.6, 5.2, 'a', 1.7]], 0.05, rng, 0.25);
      fpil(t, F.b, 0.4, F.b.L - 0.4, 5, Y0, EH - 1, 0.7, 0.3);
      fbx(t, F.b, -0.3, F.b.L + 0.3, 7.3, 7.9, -0.02, 0.3);
    }
    // --- pedimented frontispieces of the two halls ---
    for (const [x0, x1] of [[-28.3, -13.0], [13.9, 29.8]]){
      const z0 = 24.4, z1 = 31.6; bx(w, x0, x1, Y0, EH, z0, z1);
      gabR(rf, null, x0 - 0.3, x1 + 0.3, z0, z1 + 0.2, EH, 5.2, 'z', 0);
      const F = rectF(x0, x1, z0, z1), Lf = F.f.L;
      // rusticated ground storey with three arched doors
      for (let y = Y0 + 0.9; y < 6.6; y += 0.9) fbx(w, F.f, -0.1, Lf + 0.1, y, y + 0.12, -0.02, 0.12);
      for (const u of [Lf*0.22, Lf*0.5, Lf*0.78]) farch(dk, F.f, u, Y0 + 0.2, 2.4, 4.6, 0.14, 8);
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
      hipR(rf, x0, x1, z0, z1, H, 2.6, 0.4);
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
      const Ft = faces(s0)[0]; farch(dk, Ft, s0/2, Y0 + 0.2, 3.0, 5.6, 0.06, 8); fbx(t, Ft, 1.2, s0 - 1.2, 7.4, 8.0, -0.02, 0.35);
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
  lt:{m:0, c:'#ffe2b8', k:1.05, e:0.6},
  build(){
    const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
    const W = '#f3f0e8', T = '#e2ddd2', D = '#2a3038', L = {c:'#3b342d', glow:'#ffc77d', gk:0.6}, R = {c:'#5d6168', lk:0.25}, PL = '#c8c1b3',
      TT = '#5b4b3b', TC = {c:'#507545', lk:0.2};
    const w = B.p(W), t = B.p(T), dk = B.p(D), lit = B.p(L), rf = B.p(R);
    const FP = [[4.5,-20.4],[9.8,-20.5],[9.5,-19.7],[11.7,-19.5],[11.4,-18.7],[9.6,-18.3],[9.9,-10.3],[13.3,-10.1],[13.3,-11.5],[16.0,-11.6],[16.0,-10.2],[19.5,-10.2],[19.4,-11.4],[21.3,-11.7],[20.7,-10.2],[22.6,-10.5],[22.6,-9.2],[20.8,-8.8],[21.0,-6.2],[23.8,-5.7],[25.1,-7.1],[25.7,-6.0],[24.9,-4.9],[26.6,-3.1],[28.5,-3.5],[29.0,-2.4],[27.2,-2.1],[26.5,0.4],[28.4,1.4],[28.1,2.2],[26.2,1.2],[24.8,3.3],[25.6,4.9],[24.6,5.5],[23.7,3.9],[21.0,4.0],[20.9,7.5],[22.7,7.2],[22.3,8.8],[20.9,8.8],[21.1,10.1],[18.9,9.9],[18.9,8.6],[15.6,9.0],[15.4,9.8],[13.5,10.1],[13.5,8.8],[10.1,8.6],[9.5,16.4],[11.4,17.3],[10.1,17.3],[9.6,19.0],[4.4,19.2],[4.4,29.3],[5.4,28.7],[5.5,30.1],[-6.0,30.2],[-5.2,29.1],[-4.4,29.3],[-4.7,18.7],[-10.3,18.3],[-10.4,17.0],[-9.1,16.9],[-9.0,9.4],[-12.5,9.3],[-13.5,11.2],[-13.9,9.3],[-17.3,9.2],[-17.0,11.0],[-18.3,11.0],[-17.9,9.5],[-21.8,9.6],[-21.7,11.0],[-22.6,10.7],[-22.6,9.4],[-26.1,9.2],[-25.8,11.1],[-26.6,10.8],[-26.6,9.5],[-32.7,9.4],[-32.3,6.4],[-41.9,6.2],[-43.7,7.8],[-44.8,5.7],[-43.2,4.9],[-43.4,-5.2],[-44.8,-7.8],[-43.5,-9.2],[-42.1,-6.6],[-32.5,-6.3],[-32.6,-10.3],[-26.8,-10.8],[-26.9,-12.1],[-26.0,-11.9],[-26.0,-10.5],[-22.6,-10.5],[-22.5,-11.7],[-21.5,-12.3],[-21.7,-10.2],[-17.8,-10.3],[-18.1,-12.2],[-17.3,-11.9],[-17.3,-10.6],[-13.8,-10.4],[-13.3,-12.1],[-12.5,-11.8],[-12.4,-10.5],[-9.0,-10.3],[-9.3,-18.2],[-10.6,-18.2],[-10.6,-19.5],[-9.3,-19.6],[-9.3,-20.9],[-4.6,-20.8],[-4.4,-31.8],[-5.8,-31.7],[-5.5,-32.6],[5.9,-32.6],[5.2,-31.5],[4.3,-31.8]];
    LPoly(g, FP, -5, 5.6, PL);
    const Y0 = 0.6, AW = 8.6, CW = 15.6, NR = 6.6;            // aisle eaves, clerestory eaves, nave roof rise
    const zc0 = -6.0, zc1 = 5.8, za0 = -10.4, za1 = 9.4;      // clerestory and aisle walls
    // buttress with a sloped cap and a little pinnacle, standing on face F at u, projecting p
    const butt = (F, u, h, p, pin) => { fbx(t, F, u - 0.45, u + 0.45, Y0, h - 1.2, 0, p); fbx(t, F, u - 0.45, u + 0.45, h - 1.2, h, 0, p*0.55);
      if (pin){ const c = fp(F, u, 0, p*0.3); segP(t, [c[0], h, c[2]], [c[0], h + 2.2, c[2]], 0.32, 4, 0.02); } };
    // ---- nave: clerestory, aisles with lean-to roofs, buttresses, lancets ----
    { const x0 = -31.4, x1 = -9.2;
      bx(w, x0, x1, Y0, CW, zc0, zc1); bx(w, -32.6, x1, Y0, AW, za0, zc0); bx(w, -32.6, x1, Y0, AW, zc1, za1);
      for (const [zo, zi] of [[za0, zc0], [za1, zc1]]) Q(rf, [-32.8, AW, zo + Math.sign(zo)*0.4], [x1, AW, zo + Math.sign(zo)*0.4], [x1, AW + 2.6, zi], [-32.8, AW + 2.6, zi]);
      const Fs = [fc(-32.6, za1, x1, za1), fc(x1, za0, -32.6, za0)];
      for (const F of Fs){ for (let k = 0; k < 5; k++){ const u = 1.6 + k*(F.L - 3.2)/4; butt(F, u, AW + 0.4, 1.5, true); }
        for (let k = 0; k < 4; k++){ const u = 1.6 + (k + 0.5)*(F.L - 3.2)/4; flancet(rng() < 0.4 ? lit : dk, F, u, 2.2, 1.3, 6.2, 0.05); }
        fbx(t, F, -0.1, F.L + 0.1, AW - 0.5, AW, -0.02, 0.3); }
      for (const F of [fc(-31.4, zc1, x1, zc1), fc(x1, zc0, -31.4, zc0)]) for (let k = 0; k < 5; k++){ const u = 2.0 + k*(F.L - 4)/4; flancet(lit, F, u - 0.6, 11.6, 0.8, 13.6, 0.05); flancet(dk, F, u + 0.6, 11.6, 0.8, 13.6, 0.05); }
      corniceR(t, x0, x1, zc0, zc1, CW - 0.5, 0.5, 0.25);
    }
    // ---- chancel (aisled) and the polygonal apse ----
    { const x0 = 9.9, x1 = 21.0;
      bx(w, x0, x1, Y0, CW, zc0, zc1); bx(w, x0, x1, Y0, AW, za0 + 0.2, zc0); bx(w, x0, x1, Y0, AW, zc1, za1 + 0.6);
      for (const [zo, zi] of [[za0 + 0.2, zc0], [za1 + 0.6, zc1]]) Q(rf, [x0, AW, zo + Math.sign(zo)*0.4], [x1 + 0.4, AW, zo + Math.sign(zo)*0.4], [x1 + 0.4, AW + 2.6, zi], [x0, AW + 2.6, zi]);
      for (const F of [fc(x0, za1 + 0.6, x1, za1 + 0.6), fc(x1, za0 + 0.2, x0, za0 + 0.2)]){ butt(F, 3.4, AW + 0.4, 1.4, true); butt(F, 6.4, AW + 0.4, 1.4, true); butt(F, 9.6, AW + 0.4, 1.4, true);
        flancet(dk, F, 1.8, 2.2, 1.3, 6.2, 0.05); flancet(lit, F, 4.9, 2.2, 1.3, 6.2, 0.05); flancet(dk, F, 8.0, 2.2, 1.3, 6.2, 0.05); }
      for (const F of [fc(x0, zc1, x1, zc1), fc(x1, zc0, x0, zc0)]){ flancet(lit, F, 3.0, 11.6, 0.8, 13.6, 0.05); flancet(dk, F, 7.6, 11.6, 0.8, 13.6, 0.05); }
      corniceR(t, x0, x1, zc0, zc1, CW - 0.5, 0.5, 0.25);
      // apse: half octagon round (21, -0.1), walls to 14 m, polygonal roof, buttresses at the angles, tall lancets
      const ax = 21.0, az = -0.1, ar = 6.1, n = 4, AH = 14.0, P = [];
      for (let i = 0; i <= n; i++){ const a = -HP + PI*i/n; P.push([ax + Math.cos(a)*ar, az + Math.sin(a)*ar]); }
      for (let i = 0; i < n; i++){ const a = P[i], b = P[i + 1]; Q(w, [a[0], Y0, a[1]], [b[0], Y0, b[1]], [b[0], AH, b[1]], [a[0], AH, a[1]]);
        T3(w, [ax, AH, az], [a[0], AH, a[1]], [b[0], AH, b[1]]);
        T3(rf, [ax, AH + 6.2, az], [b[0] + (b[0] - ax)*0.06, AH - 0.1, b[1] + (b[1] - az)*0.06], [a[0] + (a[0] - ax)*0.06, AH - 0.1, a[1] + (a[1] - az)*0.06]);
        const F = fc(b[0], b[1], a[0], a[1]); flancet(lit, F, F.L/2, 3.0, 1.5, 10.6, 0.05, 5); }
      for (let i = 1; i < n; i++){ const a = -HP + PI*i/n, c = [ax + Math.cos(a)*(ar + 0.6), az + Math.sin(a)*(ar + 0.6)], F = fc(c[0] - Math.sin(a)*0.5, c[1] + Math.cos(a)*0.5, c[0] + Math.sin(a)*0.5, c[1] - Math.cos(a)*0.5);
        fbx(t, F, 0, 1.0, Y0, AH - 2, -0.6, 1.4); fbx(t, F, 0, 1.0, AH - 2, AH - 0.6, -0.6, 0.6); }
    }
    // ---- nave + chancel roof (one ridge from the tower to the apse), crossing ----
    gabR(rf, w, -31.6, 21.05, zc0, zc1, CW, NR, 'x', 0.5);
    bx(w, -9.2, 9.9, Y0, CW, zc0, zc1);
    // ---- transepts: inner arms (19 m wide) to the nave height, then the lower 1952 / 1983 hall extensions ----
    for (const sg of [-1, 1]){
      const zi = sg > 0 ? za1 : za0, zo = sg > 0 ? 19.1 : -20.8, ze = sg > 0 ? 30.0 : -32.4, xa = -9.2, xb = 9.8;
      const [lo, hi] = sg > 0 ? [zc1, zo] : [zo, zc0];
      bx(w, xa, xb, Y0, CW - 1.0, Math.min(lo, hi), Math.max(lo, hi));
      gabR(rf, w, xa - 0.4, xb + 0.4, Math.min(lo, hi), Math.max(lo, hi), CW - 1.0, 7.4, 'z', 0);
      const Fe = sg > 0 ? fc(xa, zo, xb, zo) : fc(xb, zo, xa, zo);
      flancet(dk, Fe, Fe.L/2 - 6.6, 3.0, 1.4, 9.6, 0.05); flancet(dk, Fe, Fe.L/2 + 6.6, 3.0, 1.4, 9.6, 0.05);
      flancet(lit, Fe, Fe.L/2 - 1.3, 13.6, 1.0, 16.4, 0.05); flancet(lit, Fe, Fe.L/2 + 1.3, 13.6, 1.0, 16.4, 0.05); farch(dk, Fe, Fe.L/2, 17.6, 1.5, 18.2, 0.05, 8);
      butt(Fe, 0.5, CW - 1.0, 1.6, true); butt(Fe, Fe.L - 0.5, CW - 1.0, 1.6, true);
      for (const F of [fc(xb, Math.max(zi, zo), xb, Math.min(zi, zo)), fc(xa, Math.min(zi, zo), xa, Math.max(zi, zo))]){ flancet(dk, F, F.L*0.5, 2.4, 1.3, 9.0, 0.05); butt(F, F.L*0.9, CW - 2, 1.2, false); }
      // the hall extension: 9.3 m wide, lower gabled range out to the ends of the cross
      const ya = 8.6, xc = -4.6, xd = 4.6, [e0, e1] = sg > 0 ? [zo, ze] : [ze, zo];
      bx(w, xc, xd, Y0, ya, e0, e1); gabR(rf, w, xc - 0.3, xd + 0.3, e0, e1, ya, 4.6, 'z', 0);
      const Fx = sg > 0 ? fc(xc, ze, xd, ze) : fc(xd, ze, xc, ze); flancet(dk, Fx, Fx.L/2 - 1.6, 2.2, 1.2, 7.0, 0.05); flancet(dk, Fx, Fx.L/2 + 1.6, 2.2, 1.2, 7.0, 0.05); flancet(lit, Fx, Fx.L/2, 9.4, 0.9, 10.6, 0.05);
      for (const F of [fc(xd, e1, xd, e0), fc(xc, e0, xc, e1)]) fwins(dk, lit, F, 0.6, F.L - 0.6, 3.0, [[2.2, 4.4, 'l', 1.1]], 0.05, rng, 0.25);
    }
    // ---- the west tower, belfry, corner pinnacles and the octagonal spire ----
    { const cx = -37.15, cz = -0.05, s = 11.6, TH = 25.8;
      const Rt = rectF(cx - s/2, cx + s/2, cz - s/2, cz + s/2), FA = [Rt.f, Rt.r, Rt.b, Rt.l];
      bx(w, cx - s/2, cx + s/2, Y0, TH, cz - s/2, cz + s/2);
      for (const F of FA){
        if (F !== Rt.r){ flancet(dk, F, s/2, Y0, 4.0, 6.4, 0.06, 6); fbx(t, F, s/2 - 2.6, s/2 - 2.0, Y0, 6.6, -0.02, 0.4); fbx(t, F, s/2 + 2.0, s/2 + 2.6, Y0, 6.6, -0.02, 0.4); }
        fbx(t, F, -0.1, s + 0.1, 10.0, 10.5, -0.02, 0.3); fbx(t, F, -0.1, s + 0.1, 17.6, 18.1, -0.02, 0.3);
        flancet(dk, F, s/2, 11.6, 1.4, 15.2, 0.05);
        flancet(dk, F, s/2 - 1.3, 19.0, 1.5, 22.8, 0.05); flancet(dk, F, s/2 + 1.3, 19.0, 1.5, 22.8, 0.05);
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
      for (const yb of [y0 + 3.0, y0 + 12, y0 + 21]){ const rb = r0*0.93 - (r0*0.93 - 0.55)*(yb - y0 - 3)/(tip - 0.6 - y0 - 3); latheP(t, [[rb + 0.18, yb], [rb + 0.18, yb + 0.5]], cx, cz, 8, PI/8); }
      for (let i = 0; i < 4; i++){ const a = i*HP, ux = Math.cos(a), uz = Math.sin(a), bxp = cx + ux*(r0 - 0.4), bzp = cz + uz*(r0 - 0.4);
        const F = fc(bxp - uz*1.1, bzp + ux*1.1, bxp + uz*1.1, bzp - ux*1.1), Fo = (ux*F.nx + uz*F.nz) > 0 ? F : fc(bxp + uz*1.1, bzp - ux*1.1, bxp - uz*1.1, bzp + ux*1.1);
        fbx(w, Fo, 0, 2.2, y0 + 2.6, y0 + 5.4, -0.8, 1.0); fped(w, t, Fo, -0.05, 2.25, y0 + 5.4, 1.6, -0.8, 1.0); flancet(dk, Fo, 1.1, y0 + 2.9, 0.8, y0 + 4.6, 1.05, 3); }
      // finial cross
      segP(t, [cx, tip - 0.3, cz], [cx, 63.0, cz], 0.09, 4); segP(t, [cx - 0.45, 62.35, cz], [cx + 0.45, 62.35, cz], 0.08, 4);
    }
    // ---- the cathedral lawn and a few rain trees ----
    { const tt = B.p(TT), tc = B.p(TC);
      LPoly(g, [[-52, -14], [-40, -25], [-8, -25], [-8, -10], [32, -10], [32, 17], [24, 25], [-40, 25], [-52, 14]], -1.8, 1.38, {c:'#7fa85e', lk:0.15}); for (const [x, z, sc] of [[-46, 14, 1.3], [-48, -16, 1.2], [-20, 18, 1.1], [-22, -19, 1.15], [18, 18, 1.0]]) treeP(tt, tc, x, z, sc, rng); }
    B.flush(g); return g; }};

// ===== CHIJMES (former Convent of the Holy Infant Jesus): the Gothic chapel (1903, Father Nain) with its five-storey
// spire and flying buttresses, Caldwell House (1841, G. D. Coleman) with its semicircular bay, the cloistered convent
// ranges round the courtyards and the low perimeter arcades on Bras Basah and North Bridge Roads.
// Local axes: +x = bearing 55 deg (NE, towards Bras Basah Road), +z = SE (North Bridge Road);
// the chapel entrance and Caldwell House's bay face -z (Victoria Street).
LANDMARKS.chijmes = {zh:'赞美广场', en:'CHIJMES', cat:'old', r:96, h:39,
  lt:{m:0, c:'#ffdcb0', k:1.0, e:0.5},
  build(){
    const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
    const W = '#f2efe6', T = '#dfd9cc', D = '#2a3038', L = {c:'#3b342b', glow:'#ffc98a', gk:0.6}, RS = {c:'#5a5f66', lk:0.25}, RT = {c:'#93503a', lk:0.35}, RC = {c:'#743c2a', lk:0.3},
      PL = '#c6bfb1', TT = '#5b4b3b', TC = {c:'#507545', lk:0.2}, SG = {c:'#3a3550', glow:'#ffb870', gk:0.75};
    const w = B.p(W), t = B.p(T), dk = B.p(D), lit = B.p(L), rs = B.p(RS), rt = B.p(RT), sg = B.p(SG);
    const P = {w, t, dk, lit, rf:rt, rc:B.p(RC), rng};
    const Y0 = 0.6;
    // ---- foundations (each traced footprint) ----
    const FPS = [
      [[-22.8,-42.3],[-22.8,-47.4],[-12.6,-47.3],[-12.9,-42.7],[-9.2,-42.4],[-8.9,-12.0],[-10.3,-11.0],[-12.3,-11.8],[-11.7,-2.6],[-13.8,-0.5],[-16.1,0.4],[-19.4,-0.2],[-20.9,-1.3],[-22.0,-2.8],[-22.5,-11.9],[-24.3,-11.4],[-25.9,-12.5],[-26.3,-42.0]],
      [[28.5,-42.5],[27.9,-28.9],[38.9,-28.7],[38.4,-18.9],[4.2,-20.4],[4.7,-43.3]],
      [[-20.8,44.4],[-20.8,42.3],[-10.6,42.4],[-11.0,44.9],[5.7,44.9],[5.6,42.7],[15.4,43.2],[15.4,45.4],[20.1,45.0],[20.1,35.5],[18.8,35.7],[18.9,22.5],[15.1,22.3],[15.3,16.3],[13.6,16.0],[13.8,7.8],[15.9,7.8],[15.8,1.4],[19.3,1.2],[19.4,-12.1],[35.2,-12.2],[34.9,36.1],[32.8,36.1],[32.8,45.5],[36.3,45.2],[36.1,61.5],[15.6,61.2],[15.2,63.7],[5.8,63.7],[5.7,61.5],[2.8,61.5],[2.9,60.7],[-8.1,60.4],[-7.7,63.0],[-18.3,62.4],[-18.4,60.2],[-39.1,59.5],[-39.1,44.1]],
      [[-33.1,-59.1],[-47.9,-60.5],[-41.6,7.3],[-52.0,8.0],[-57.5,-71.2],[-33.9,-69.5]],
      [[-31.6,13.5],[-31.9,7.8],[-1.9,7.2],[-1.9,14.5],[-29.8,15.0],[-29.5,13.3]],
      [[2.4,14.4],[-1.9,14.5],[-2.2,-1.4],[1.6,-1.1]],
      [[-39.0,71.0],[39.4,71.5],[42.0,-49.0],[47.7,-50.1],[46.8,80.9],[-38.6,81.0]],
      [[2.6,42.6],[2.7,34.6],[16.4,34.4],[16.3,42.5]],
      [[-29.0,42.9],[-35.9,40.5],[-31.7,31.7],[-25.5,34.6]]];
    for (const F of FPS) LPoly(g, F, -5, 5.6, PL);
    // ======== the chapel ========
    { const cx = -17.6, xa = -26.0, xb = -9.2, xn0 = -21.9, xn1 = -13.3, z0 = -42.3, z1 = -11.8, AW = 8.2, CW = 15.2, NR = 7.0;
      // nave (clerestory) and aisles
      bx(w, xn0, xn1, Y0, CW, z0, z1); bx(w, xa, xn0, Y0, AW, z0, z1); bx(w, xn1, xb, Y0, AW, z0, z1);
      gabR(rs, w, xn0, xn1, z0 - 0.3, z1, CW, NR, 'z', 0.45);
      Q(rs, [xa - 0.4, AW, z1], [xa - 0.4, AW, z0], [xn0, AW + 2.8, z0], [xn0, AW + 2.8, z1]); Q(rs, [xb + 0.4, AW, z0], [xb + 0.4, AW, z1], [xn1, AW + 2.8, z1], [xn1, AW + 2.8, z0]);
      corniceR(t, xn0, xn1, z0, z1, CW - 0.5, 0.5, 0.2);
      // side elevations: buttresses with pinnacles and flying buttresses, lancet windows (stained glass) in each bay
      const nb = 6;
      for (const [F, xo] of [[fc(xb, z1, xb, z0), xb], [fc(xa, z0, xa, z1), xa]]){
        for (let k = 0; k <= nb; k++){ const u = 0.8 + k*(F.L - 1.6)/nb; fbx(t, F, u - 0.45, u + 0.45, Y0, AW + 1.4, 0, 1.4);
          const c = fp(F, u, 0, 0.7); segP(t, [c[0], AW + 1.4, c[2]], [c[0], AW + 4.4, c[2]], 0.38, 4, 0.03);
          const top = fp(F, u, 0, 0.5), wallp = [xo < cx ? xn0 : xn1, 0, top[2]];
          segP(t, [top[0], AW + 2.6, top[2]], [wallp[0], CW - 2.2, wallp[2]], 0.22, 4); }
        for (let k = 0; k < nb; k++){ const u = 0.8 + (k + 0.5)*(F.L - 1.6)/nb; flancet(sg, F, u, 2.0, 1.5, 6.0, 0.05, 4); } }
      for (const F of [fc(xn1, z1, xn1, z0), fc(xn0, z0, xn0, z1)]) for (let k = 0; k < 6; k++) flancet(sg, F, 1.3 + (k + 0.5)*(F.L - 2.6)/6, 11.0, 1.2, 13.3, 0.05, 4);
      // apse: rounded east end (half 10-gon) with tall lancets and a conical half-roof
      const ar = 5.3, az = -5.0, AH = 13.2, AP = [];
      for (let i = 0; i <= 5; i++){ const a = PI*i/5; AP.push([cx + Math.cos(a)*ar, az + Math.sin(a)*ar]); }
      bx(w, cx - ar, cx + ar, Y0, AH, z1 - 0.2, az);
      for (let i = 0; i < 5; i++){ const a = AP[i], b = AP[i + 1]; Q(w, [a[0], Y0, a[1]], [b[0], Y0, b[1]], [b[0], AH, b[1]], [a[0], AH, a[1]]);
        T3(rs, [cx, AH + 5.4, az], [b[0] + (b[0] - cx)*0.08, AH - 0.1, b[1] + (b[1] - az)*0.08], [a[0] + (a[0] - cx)*0.08, AH - 0.1, a[1] + (a[1] - az)*0.08]);
        const F = fc(a[0], a[1], b[0], b[1]), Fo = (F.nx*((a[0] + b[0])/2 - cx) + F.nz*((a[1] + b[1])/2 - az)) > 0 ? F : fc(b[0], b[1], a[0], a[1]);
        flancet(sg, Fo, Fo.L/2, 2.4, 1.3, 9.6, 0.05, 4); }
      gabR(rs, null, cx - ar - 0.3, cx + ar + 0.3, z1 - 0.2, az, AH, 5.4, 'z', 0);
      // west front: the tower over the portal (wide lower stage, slimmer belfry), flying buttresses, octagonal spire
      const tx0 = -22.8, tx1 = -12.6, tz0 = -47.4, tz1 = -37.8, tc = (tx0 + tx1)/2, tzc = (tz0 + tz1)/2, TL = 10.4, TH = 24.6, s2 = 7.0;
      bx(w, tx0, tx1, Y0, TL, tz0, tz1);
      const Ft = fc(tx1, tz0, tx0, tz0), Lt = Ft.L;
      flancet(dk, Ft, Lt/2, Y0, 3.0, 5.0, 0.08, 6); fped(w, t, Ft, Lt/2 - 2.5, Lt/2 + 2.5, 7.2, 2.6, 0, 0.7);
      for (const u of [Lt/2 - 2.7, Lt/2 + 2.7]){ fbx(t, Ft, u - 0.25, u + 0.25, Y0, 9.6, 0, 0.75); const c = fp(Ft, u, 0, 0.5); latheP(w, [[0.42, 9.6], [0.08, 11.6], [0.01, 11.7]], c[0], c[2], 4, PI/4); }
      for (const F of [Ft, fc(tx1, tz1, tx1, tz0), fc(tx0, tz0, tx0, tz1)]){ fbx(t, F, -0.1, F.L + 0.1, TL - 0.5, TL, -0.02, 0.35); if (F !== Ft) flancet(dk, F, F.L/2, 2.6, 1.2, 6.6, 0.05); }
      bx(t, tx0 - 0.2, tx1 + 0.2, TL, TL + 0.25, tz0 - 0.2, tz1 + 0.2);
      // upper tower: rose window stage and belfry
      const ux0 = tc - s2/2, ux1 = tc + s2/2, uz0 = tzc - s2/2, uz1 = tzc + s2/2;
      bx(w, ux0, ux1, TL, TH, uz0, uz1);
      const Ru = rectF(ux0, ux1, uz0, uz1);
      for (let i = 0; i < 12; i++){ const a = i/12*TAU, b = (i + 1)/12*TAU, yc = 13.4, rr = 1.7; T3(sg, fp(Ru.b, s2/2, yc, 0.06), fp(Ru.b, s2/2 + Math.cos(a)*rr, yc + Math.sin(a)*rr, 0.06), fp(Ru.b, s2/2 + Math.cos(b)*rr, yc + Math.sin(b)*rr, 0.06)); }
      for (const F of [Ru.f, Ru.r, Ru.b, Ru.l]){
        fbx(t, F, -0.1, s2 + 0.1, 16.2, 16.6, -0.02, 0.3);
        flancet(dk, F, s2/2 - 1.1, 17.4, 1.0, 21.4, 0.05); flancet(dk, F, s2/2 + 1.1, 17.4, 1.0, 21.4, 0.05);
        fbx(t, F, -0.25, s2 + 0.25, TH - 0.5, TH, -0.02, 0.4);
        fped(w, t, F, 0.6, s2 - 0.6, TH, 2.2, -0.4, 0.2); }
      for (const [px, pz] of [[ux0, uz0], [ux1, uz0], [ux0, uz1], [ux1, uz1]]){ bx(t, px - 0.55, px + 0.55, TL, TH + 0.6, pz - 0.55, pz + 0.55); latheP(w, [[0.7, TH + 0.6], [0.12, TH + 5.4], [0.01, TH + 5.7]], px, pz, 6); }
      // flying buttresses from the corner piers of the lower stage to the belfry
      for (const [px, pz, qx, qz] of [[tx0 - 1.6, tz0 + 0.4, ux0, uz0 + 1.0], [tx1 + 1.6, tz0 + 0.4, ux1, uz0 + 1.0]]){
        bx(t, px - 0.55, px + 0.55, Y0, 11.2, pz - 0.7, pz + 0.7); latheP(w, [[0.62, 11.2], [0.1, 14.4], [0.01, 14.6]], px, pz, 4, PI/4); segP(t, [px, 10.8, pz], [qx, 16.0, qz], 0.22, 4); }
      fped(w, t, fc(xb, z0, xa, z0), 0.2, xb - xa - 0.2, AW, 2.4, 0, 0.3);
      // octagonal spire with gablets and crockets, finial cross
      const r0 = 3.0, y0 = TH + 0.2, tip = 37.8;
      latheP(w, [[r0, y0], [r0*0.92, y0 + 1.6], [0.32, tip - 0.4], [0.01, tip]], tc, tzc, 8, PI/8);
      for (let i = 0; i < 8; i++){ const a = (i + 0.5)/8*TAU; for (let k = 1; k < 6; k++){ const y = y0 + 1.6 + k*1.75, rr = r0*0.92 - (r0*0.92 - 0.32)*(y - y0 - 1.6)/(tip - 0.4 - y0 - 1.6) + 0.12; bx(t, tc + Math.cos(a)*rr - 0.14, tc + Math.cos(a)*rr + 0.14, y, y + 0.36, tzc + Math.sin(a)*rr - 0.14, tzc + Math.sin(a)*rr + 0.14); } }
      segP(t, [tc, tip - 0.2, tzc], [tc, 38.9, tzc], 0.07, 4); segP(t, [tc - 0.35, 38.4, tzc], [tc + 0.35, 38.4, tzc], 0.06, 4);
    }
    // ======== Caldwell House: two storeys, verandahs, jack roof, semicircular bay towards Victoria Street ========
    { colRange(P, 4.4, 28.3, -43.1, -20.4, {H:10.4, nf:2, ver:'fb', vd:2.4, bay:3.4, rise:0, pil:true});
      hipR(rt, 4.4, 28.3, -43.1, -20.4, 10.4, 3.2, 1.0); bx(w, 9.0, 23.7, 13.0, 14.4, -36.0, -27.5); hipR(rt, 9.0, 23.7, -36.0, -27.5, 14.4, 1.8, 0.6);   // jack roof
      colRange(P, 28.3, 38.6, -28.8, -19.0, {H:10.4, nf:2, ver:'f', vd:2.2, bay:3.4, rise:2.6});
      // the semicircular projection: colonnade of Doric columns on both storeys, half-conical roof
      const cx = 16.4, cz = -43.1, r = 5.6, n = 9;
      const ring = []; for (let i = 0; i <= n; i++){ const a = PI + PI*i/n; ring.push([cx + Math.cos(a)*r, cz + Math.sin(a)*r]); }
      for (let i = 0; i < n; i++){ const a = ring[i], b = ring[i + 1];
        for (const y of [Y0, 5.5]) Q(t, [a[0], y + 0.35, a[1]], [b[0], y + 0.35, b[1]], [b[0], y, b[1]], [a[0], y, a[1]]);
        T3(t, [cx, 5.5, cz], [a[0], 5.5, a[1]], [b[0], 5.5, b[1]]); T3(t, [cx, 10.2, cz], [a[0], 10.2, a[1]], [b[0], 10.2, b[1]]);
        T3(rt, [cx, 13.0, cz + 0.2], [b[0] + (b[0] - cx)*0.15, 10.0, b[1] + (b[1] - cz)*0.15], [a[0] + (a[0] - cx)*0.15, 10.0, a[1] + (a[1] - cz)*0.15]); }
      for (let i = 0; i <= n; i++){ const [x, z] = ring[i]; segP(t, [x, Y0, z], [x, 5.3, z], 0.3, 8); segP(t, [x, 5.9, z], [x, 10.0, z], 0.26, 8); }
      const ir = []; for (let i = 0; i <= n; i++){ const a = PI + PI*i/n; ir.push([cx + Math.cos(a)*(r - 2.2), cz + Math.sin(a)*(r - 2.2)]); }
      for (let i = 0; i < n; i++){ const a = ir[i], b = ir[i + 1]; Q(i % 2 ? lit : dk, [a[0], Y0, a[1]], [b[0], Y0, b[1]], [b[0], 10.0, b[1]], [a[0], 10.0, a[1]]); }
      for (let i = 0; i < n; i++){ const a = ring[i], b = ring[i + 1], m = 5.5 + 0.0; for (let k = 0; k < 4; k++){ const f0 = k/4, f1 = (k + 0.5)/4; const p0 = [a[0] + (b[0] - a[0])*f0, a[1] + (b[1] - a[1])*f0], p1 = [a[0] + (b[0] - a[0])*f1, a[1] + (b[1] - a[1])*f1]; bx(t, Math.min(p0[0], p1[0]) - 0.05, Math.max(p0[0], p1[0]) + 0.05, m, m + 1.0, Math.min(p0[1], p1[1]) - 0.05, Math.max(p0[1], p1[1]) + 0.05); } }
    }
    // ======== convent ranges ========
    // SW range along the lawn (old orphanage, two storeys, verandah to the courtyard) and its arm on Victoria Street
    { const sk = (z) => -52.4 + (z + 71.2)*(5.6/79.2);   // the range leans a little: centre line x(z)
      const zs = [-59.0, -39.0, -19.0, 7.5];
      for (let i = 0; i < 3; i++){ const za = zs[i], zb = zs[i + 1], xc = sk((za + zb)/2); colRange(P, xc - 4.9, xc + 4.9, za, zb, {H:10.2, nf:2, ver:'r', vd:2.4, bay:3.6, rise:3.2, ov:0.8}); }
      colRange(P, -57.0, -33.9, -70.6, -59.0, {H:10.2, nf:2, ver:'f', vd:2.4, bay:3.6, rise:3.2, ov:0.8}); }
    // cloister walks (one storey arcades) north of the dormitory courtyard and between the chapel and the dormitories
    colRange(P, -31.7, -1.9, 7.6, 14.6, {H:6.0, nf:1, ver:'fb', vd:2.2, bay:3.3, rise:2.2, ov:0.6});
    colRange(P, -2.1, 2.3, -1.2, 14.4, {H:6.0, nf:1, ver:'lr', vd:1.4, bay:3.3, rise:1.8, ov:0.5});
    // the dormitory ranges (three storeys, arcaded verandahs to the courtyard) in an L: north-east arm and south arm
    colRange(P, 19.3, 35.1, -12.1, 36.0, {H:14.2, nf:3, ver:'l', vd:2.8, bay:3.6, rise:3.6, ov:0.9});
    colRange(P, 13.7, 19.3, 1.4, 35.6, {H:11.0, nf:3, ver:'l', vd:1.6, bay:3.6, rise:2.6, ov:0.5, arch:false});
    colRange(P, 32.8, 36.2, 36.0, 45.4, {H:14.2, nf:3, ver:'', bay:3.6, rise:2.4, ov:0.5});
    colRange(P, -39.1, 36.2, 44.6, 61.3, {H:14.2, nf:3, ver:'b', vd:2.8, bay:3.6, rise:3.6, ov:0.9});
    for (const [x0, x1, z0, z1] of [[-20.8, -10.8, 42.3, 44.6], [5.6, 15.4, 42.8, 44.6], [15.4, 20.1, 35.5, 44.6]]) colRange(P, x0, x1, z0, z1, {H:12.6, nf:3, ver:'', bay:3.2, rise:1.8, ov:0.3});
    for (const [x0, x1] of [[-18.3, -8.0], [5.8, 15.4]]) colRange(P, x0, x1, 61.3, 63.5, {H:12.6, nf:3, ver:'', bay:3.2, rise:1.6, ov:0.3});
    colRange(P, 2.7, 16.3, 34.5, 42.5, {H:8.0, nf:2, ver:'b', vd:2.2, bay:3.4, rise:2.4, ov:0.6});
    // small pavilion in the courtyard
    { const c = [-30.7, 37.3], s2 = 3.4, a = 0.43; const R2 = (x, z) => [c[0] + x*Math.cos(a) - z*Math.sin(a), c[1] + x*Math.sin(a) + z*Math.cos(a)];
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]){ const p = R2(sx*s2, sz*s2); segP(t, [p[0], Y0, p[1]], [p[0], 5.4, p[1]], 0.25, 6); }
      const q = [R2(-s2 - 0.6, -s2 - 0.6), R2(s2 + 0.6, -s2 - 0.6), R2(s2 + 0.6, s2 + 0.6), R2(-s2 - 0.6, s2 + 0.6)];
      for (let i = 0; i < 4; i++) T3(rt, [c[0], 8.4, c[1]], [q[i][0], 5.4, q[i][1]], [q[(i + 1) % 4][0], 5.4, q[(i + 1) % 4][1]]); }
    // ======== perimeter arcades along Bras Basah Road and North Bridge Road ========
    colRange(P, 42.2, 47.4, -49.4, 71.0, {H:5.6, nf:1, ver:'lr', vd:1.8, bay:3.4, rise:1.8, ov:0.5});
    colRange(P, -38.8, 47.4, 71.2, 80.8, {H:5.6, nf:1, ver:'fb', vd:2.4, bay:3.4, rise:2.4, ov:0.5});
    // ======== trees on the lawn and in the courtyards ========
    { const tt = B.p(TT), tc = B.p(TC);
      for (const [x, z, s] of [[-34, -40, 1.2], [-32, -20, 1.1], [-34, -2, 1.0], [-4, -36, 0.9], [-3, -26, 0.8], [-5, 30, 1.0], [8, 24, 0.9], [-20, 26, 1.1], [8, -6, 0.9]]) treeP(tt, tc, x, z, s, rng); }
    B.flush(g); return g; }};

// ===== placements: WGS84 position of each local origin (traced from the real footprints) and rot = bearing of local +x (rad)
SG_PLACES.push(
  {type:'raffleshotel', lat:1.295263, lon:103.854371, rot:0.9861},  // middle of the hotel block (Beach Rd / Bras Basah Rd / North Bridge Rd / Seah St); Main Building front (+z) faces Beach Road (ESE)
  {type:'natgallery',   lat:1.290300, lon:103.851500, rot:1.0524},  // between the two buildings' backs; front (+z) faces the Padang; Old Supreme Court at -x, City Hall at +x
  {type:'supremecourt', lat:1.290410, lon:103.850700, rot:1.0559},  // front (+z) faces Supreme Court Lane / the Padang (ESE); disc centred at local (17, -2)
  {type:'victoria',     lat:1.288346, lon:103.851583, rot:0.9599},  // front (+z) faces Empress Place (SE); Theatre at -x, Concert Hall at +x, clock tower in the middle
  {type:'standrews',    lat:1.292377, lon:103.852276, rot:1.0734},  // crossing of nave and transepts; nave along +x, west tower and main door at -x
  {type:'chijmes',      lat:1.295180, lon:103.852140, rot:0.9599}   // chapel entrance and Caldwell House's bay face -z (Victoria Street, NW)
);
}
