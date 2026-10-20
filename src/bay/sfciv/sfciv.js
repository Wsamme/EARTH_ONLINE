// ===== bay/sfciv: San Francisco civic and heritage landmarks — City Hall, Coit Tower, Palace of Fine Arts, the Painted
// Ladies, Grace Cathedral, Sutro Tower, the Legion of Honor. Block-scoped: only LANDMARKS and SG_PLACES are touched.
// Real dimensions in metres, every plan traced from the real OSM footprint (bay/ref_sfciv.json) in the model's local axes;
// PLACE (below) gives each local origin (WGS84) and rot (bearing of local +x, counter-clockwise from east, radians).
// San Francisco is hilly: each model reads the real terrain under its plan (hC, when the app/kit provides it) and carries
// its plinths / foundations / steps down to the ground; in the model-only kit the ground is flat (y = 0).
{
const PI = Math.PI, HP = PI/2, TAU = PI*2;
const PLACE = {
  sfcityhall:     {lat:37.779273, lon:-122.419238, rot:0.1545},  // rotunda centre; +x = Polk St (E), -x = Van Ness Ave (W), -z = McAllister St (N)
  coittower:      {lat:37.802373, lon:-122.405834, rot:0.2478},  // shaft centre; the entrance (-z) faces the Telegraph Hill parking circle (N)
  palacefa:       {lat:37.802917, lon:-122.448405, rot:0.1571},  // rotunda centre; +x = the lagoon (E), the colonnades curve round it, the hall at -x
  paintedladies:  {lat:37.776268, lon:-122.432741, rot:0.1553},  // in 716 Steiner, mid-row; the fronts face -x (Steiner St / Alamo Square, W), 722 at -z (N), 710 at +z (S)
  gracecathedral: {lat:37.791847, lon:-122.413493, rot:0.1553},  // nave axis; the towers and main doors at +x (Taylor St, E), the apse at -x
  sutrotower:     {lat:37.755241, lon:-122.452853, rot:0},       // centre of the three legs (one leg due west)
  legionofhonor:  {lat:37.784550, lon:-122.500735, rot:0.7138}   // middle of the plan; +x = the entrance arch (NE), -x = the rotunda (SW)
};
// ---------- the real ground under a model: local (x, z) -> ground height relative to the model base (y = 0) ----------
// (only when the model is being built at its real place: the base the app chose must be the one computed there, otherwise
// - a copy placed elsewhere with the landmark tool, the generated-city mode, the model-only kit - the ground is flat)
const siteGY = key => {
  const P = PLACE[key]; let top = null, wx = 0, wy = 0;
  try { if (typeof hC === 'function' && typeof sgXY === 'function' && LMCTX && LMCTX.u && LMCTX.u.base){
    const w = sgXY(P.lat, P.lon), r = LANDMARKS[key].r; let hi = -Infinity;
    for (let a = 0; a < 12; a++) for (const f of [0, 0.35, 0.7]) hi = Math.max(hi, hC(w[0] + Math.cos(a/12*TAU)*r*f, w[1] + Math.sin(a/12*TAU)*r*f));
    if (Math.abs(hi + 0.6 - LMCTX.u.base.value) < 0.05){ top = LMCTX.u.base.value; wx = w[0]; wy = w[1]; } } } catch (e){ top = null; }
  const c = Math.cos(P.rot), s = Math.sin(P.rot);
  if (top === null || !isFinite(top)) return Object.assign(() => 0, {real:false});
  return Object.assign((x, z) => hC(wx + x*c + z*s, wy + x*s - z*c) - top, {real:true});
};
// lowest ground over a set of points (and their centroid)
const minGY = (gy, pts) => { let m = Infinity, cx = 0, cz = 0; for (const p of pts){ m = Math.min(m, gy(p[0], p[1])); cx += p[0]/pts.length; cz += p[1]/pts.length; } return Math.min(m, gy(cx, cz)); };
// ---------- triangle batches: many small parts of one colour spec become one LTris call ----------
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const Q = (o, a, b, c, d) => o.push(...a, ...b, ...c, ...a, ...c, ...d);
const T3 = (o, a, b, c) => o.push(...a, ...b, ...c);
// axis-aligned box from min/max corners (with bottom)
const bx = function(o, x0, x1, y0, y1, z0, z1){
  const P = [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]];
  Q(o, P[4], P[7], P[6], P[5]); Q(o, P[0], P[4], P[5], P[1]); Q(o, P[1], P[5], P[6], P[2]); Q(o, P[2], P[6], P[7], P[3]); Q(o, P[3], P[7], P[4], P[0]); Q(o, P[0], P[1], P[2], P[3]);
};
// box rotated about y by ry round its centre (cx, cz)
const rbx = function(o, cx, cz, w, d, y0, y1, ry){
  const c = Math.cos(ry), s = Math.sin(ry), R = (x, y, z) => [cx + x*c + z*s, y, cz - x*s + z*c], hw = w/2, hd = d/2;
  const P = [R(-hw,y0,-hd),R(hw,y0,-hd),R(hw,y0,hd),R(-hw,y0,hd),R(-hw,y1,-hd),R(hw,y1,-hd),R(hw,y1,hd),R(-hw,y1,hd)];
  Q(o, P[4], P[7], P[6], P[5]); Q(o, P[0], P[4], P[5], P[1]); Q(o, P[1], P[5], P[6], P[2]); Q(o, P[2], P[6], P[7], P[3]); Q(o, P[3], P[7], P[4], P[0]); Q(o, P[0], P[1], P[2], P[3]);
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
// solid of revolution into a batch: profile [[r, y], ...] round (cx, cz), n sides (a cap where r = 0)
const latheP = function(o, prof, cx, cz, n, a0){
  a0 = a0 || 0; const R = prof.map(([r, y]) => { const ring = []; for (let i = 0; i < n; i++){ const t = a0 + i/n*TAU; ring.push([cx + Math.cos(t)*r, y, cz + Math.sin(t)*r]); } return ring; });
  for (let k = 0; k < R.length - 1; k++) for (let i = 0; i < n; i++){ const j = (i+1) % n; Q(o, R[k][i], R[k+1][i], R[k+1][j], R[k][j]); }
};
// plan polygon ([x, z]) walls between y0 and y1, and a flat cap (fan from the centroid: convex or star-shaped plans)
const wallsP = (o, P, y0, y1) => { for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; Q(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); } };
const capP = (o, P, y) => { let cx = 0, cz = 0; for (const p of P){ cx += p[0]/P.length; cz += p[1]/P.length; } for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; T3(o, [cx, y, cz], [b[0], y, b[1]], [a[0], y, a[1]]); } };
// ---------- a "face": a vertical wall plane, u along it (from point A), d outwards, y up ----------
// fc(ax, az, bx, bz): wall from A to B; outward normal = the right-hand side when walking A->B seen from above (+y)
const fc = function(ax, az, bx_, bz){ const L = Math.hypot(bx_ - ax, bz - az), tx = (bx_ - ax)/L, tz = (bz - az)/L; return {ax, az, tx, tz, nx:-tz, nz:tx, L}; };
// faces of an axis-aligned rectangle, each with the outside to the right: front (+z), right (+x), back (-z), left (-x)
const rectF = (x0, x1, z0, z1) => ({f:fc(x0, z1, x1, z1), r:fc(x1, z1, x1, z0), b:fc(x1, z0, x0, z0), l:fc(x0, z0, x0, z1)});
const fp = (F, u, y, d) => [F.ax + F.tx*u + F.nx*d, y, F.az + F.tz*u + F.nz*d];
const foff = (F, d) => Object.assign({}, F, {ax:F.ax + F.nx*d, az:F.az + F.nz*d});
// box in face coordinates
const fbx = function(o, F, u0, u1, y0, y1, d0, d1){
  const P = [fp(F,u0,y0,d0), fp(F,u1,y0,d0), fp(F,u1,y0,d1), fp(F,u0,y0,d1), fp(F,u0,y1,d0), fp(F,u1,y1,d0), fp(F,u1,y1,d1), fp(F,u0,y1,d1)];
  Q(o, P[4], P[7], P[6], P[5]); Q(o, P[0], P[4], P[5], P[1]); Q(o, P[1], P[5], P[6], P[2]); Q(o, P[2], P[6], P[7], P[3]); Q(o, P[3], P[7], P[4], P[0]); Q(o, P[0], P[1], P[2], P[3]);
};
// flat panel on the face (window glass, doors) at depth d
const frect = (o, F, u0, u1, y0, y1, d) => Q(o, fp(F,u0,y0,d), fp(F,u1,y0,d), fp(F,u1,y1,d), fp(F,u0,y1,d));
// round-headed opening: rectangle up to the springing ys, half circle above (total height ys + w/2)
const farch = function(o, F, uc, y0, w, ys, d, n){
  n = n || 6; const r = w/2; frect(o, F, uc - r, uc + r, y0, ys, d);
  for (let i = 0; i < n; i++){ const a = PI*i/n, b = PI*(i+1)/n; T3(o, fp(F, uc, ys, d), fp(F, uc + Math.cos(a)*r, ys + Math.sin(a)*r, d), fp(F, uc + Math.cos(b)*r, ys + Math.sin(b)*r, d)); }
};
// pointed (lancet) opening: rectangle up to ys, equilateral pointed head above (apex ys + 0.866 w)
const flancet = function(o, F, uc, y0, w, ys, d, n){
  n = n || 4; const r = w/2; frect(o, F, uc - r, uc + r, y0, ys, d);
  for (let i = 0; i < n; i++){ const a0 = PI - PI/3*i/n, a1 = PI - PI/3*(i+1)/n;
    T3(o, fp(F, uc, ys, d), fp(F, uc + r + w*Math.cos(a0), ys + w*Math.sin(a0), d), fp(F, uc + r + w*Math.cos(a1), ys + w*Math.sin(a1), d));
    T3(o, fp(F, uc, ys, d), fp(F, uc - r - w*Math.cos(a1), ys + w*Math.sin(a1), d), fp(F, uc - r - w*Math.cos(a0), ys + w*Math.sin(a0), d)); }
};
// circular panel on a face (rose windows, oculi)
const fdisc = function(o, F, uc, yc, r, d, n){ n = n || 16; for (let i = 0; i < n; i++){ const a = i/n*TAU, b = (i + 1)/n*TAU; T3(o, fp(F, uc, yc, d), fp(F, uc + Math.cos(a)*r, yc + Math.sin(a)*r, d), fp(F, uc + Math.cos(b)*r, yc + Math.sin(b)*r, d)); } };
// open arcade: n round arches between u0 and u1 on piers of width pw, springing at ys, wall up to yt, thickness d0..d1
const farcade = function(o, F, u0, u1, n, y0, ys, yt, pw, d0, d1, seg){
  seg = seg || 6; const bw = (u1 - u0)/n, r = (bw - pw)/2;
  for (let k = 0; k <= n; k++){ const u = u0 + k*bw; fbx(o, F, u - pw/2, u + pw/2, y0, yt, d0, d1); }
  for (let k = 0; k < n; k++){ const uc = u0 + (k + 0.5)*bw;
    for (let i = 0; i < seg; i++){ const a = PI - PI*i/seg, b = PI - PI*(i+1)/seg, ua = uc + Math.cos(a)*r, ub = uc + Math.cos(b)*r, ya = ys + Math.sin(a)*r, yb = ys + Math.sin(b)*r;
      Q(o, fp(F, ua, ya, d1), fp(F, ub, yb, d1), fp(F, ub, yt, d1), fp(F, ua, yt, d1)); Q(o, fp(F, ub, yb, d0), fp(F, ua, ya, d0), fp(F, ua, yt, d0), fp(F, ub, yt, d0));
      Q(o, fp(F, ua, ya, d0), fp(F, ub, yb, d0), fp(F, ub, yb, d1), fp(F, ua, ya, d1)); }
  }
};
// round column at (u, d) on the face, with square base and capital blocks (cap into oc)
const fcol = function(o, oc, F, u, d, y0, y1, r, n){
  const c = fp(F, u, 0, d); segP(o, [c[0], y0 + r*0.9, c[2]], [c[0], y1 - r*1.1, c[2]], r, n || 8, r*0.88);
  fbx(oc, F, u - r*1.25, u + r*1.25, y0, y0 + r*0.9, d - r*1.25, d + r*1.25);
  fbx(oc, F, u - r*1.4, u + r*1.4, y1 - r*1.1, y1, d - r*1.4, d + r*1.4);
};
// free column (round shaft, square plinth and abacus) at (x, z)
const col = function(o, oc, x, z, y0, y1, r, n){
  segP(o, [x, y0 + r*0.9, z], [x, y1 - r*1.1, z], r, n || 8, r*0.86);
  bx(oc, x - r*1.25, x + r*1.25, y0, y0 + r*0.9, z - r*1.25, z + r*1.25); bx(oc, x - r*1.4, x + r*1.4, y1 - r*1.1, y1, z - r*1.4, z + r*1.4);
};
// balustrade: rails and balusters along the face between u0 and u1 at depth d
const fbal = function(o, F, u0, u1, y, h, d, w, step){
  w = w || 0.3; fbx(o, F, u0, u1, y, y + h*0.18, d - w/2, d + w/2); fbx(o, F, u0, u1, y + h*0.82, y + h, d - w*0.6, d + w*0.6);
  const n = Math.max(1, Math.round((u1 - u0)/(step || 0.5))); for (let i = 0; i < n; i++){ const u = u0 + (i + 0.5)*(u1 - u0)/n; fbx(o, F, u - 0.08, u + 0.08, y + h*0.18, y + h*0.82, d - 0.08, d + 0.08); }
};
// triangular pediment on a face: base u0..u1 at y, apex height h, depth d0..d1 (solid), raking cornice into oc
const fped = function(o, oc, F, u0, u1, y, h, d0, d1){
  const um = (u0 + u1)/2;
  for (const d of [d0, d1]) T3(o, fp(F, u0, y, d), fp(F, u1, y, d), fp(F, um, y + h, d));
  Q(o, fp(F, u0, y, d0), fp(F, um, y + h, d0), fp(F, um, y + h, d1), fp(F, u0, y, d1)); Q(o, fp(F, um, y + h, d0), fp(F, u1, y, d0), fp(F, u1, y, d1), fp(F, um, y + h, d1));
  if (oc){ const t = 0.5, e = 0.4, dd = d1 + 0.3; Q(oc, fp(F, u0 - e, y, dd), fp(F, um, y + h + t, dd), fp(F, um, y + h + t, d0), fp(F, u0 - e, y, d0)); Q(oc, fp(F, um, y + h + t, dd), fp(F, u1 + e, y, dd), fp(F, u1 + e, y, d0), fp(F, um, y + h + t, d0));
    Q(oc, fp(F, u0 - e, y - 0.55, dd), fp(F, um, y + h + t - 0.55, dd), fp(F, um, y + h + t, dd), fp(F, u0 - e, y, dd)); Q(oc, fp(F, um, y + h + t - 0.55, dd), fp(F, u1 + e, y - 0.55, dd), fp(F, u1 + e, y, dd), fp(F, um, y + h + t, dd)); }
};
// pilasters (flat strips) at bay boundaries
const fpil = function(o, F, u0, u1, n, y0, y1, w, p){ for (let i = 0; i <= n; i++){ const u = u0 + i*(u1 - u0)/n; fbx(o, F, u - w/2, u + w/2, y0, y1, -0.02, p); } };
// gabled roof, ridge along x (ax = 'x') or z; gable-end triangles go to ow (the wall batch); ov = eaves overhang
const gabR = function(o, ow, x0, x1, z0, z1, y, h, ax, ov){
  ov = ov || 0;
  if (ax === 'x'){ const cz = (z0 + z1)/2; Q(o, [x0, y, z1 + ov], [x1, y, z1 + ov], [x1, y + h, cz], [x0, y + h, cz]); Q(o, [x1, y, z0 - ov], [x0, y, z0 - ov], [x0, y + h, cz], [x1, y + h, cz]);
    if (ow){ T3(ow, [x0, y, z0], [x0, y, z1], [x0, y + h, cz]); T3(ow, [x1, y, z1], [x1, y, z0], [x1, y + h, cz]); } }
  else { const cx = (x0 + x1)/2; Q(o, [x1 + ov, y, z1], [x1 + ov, y, z0], [cx, y + h, z0], [cx, y + h, z1]); Q(o, [x0 - ov, y, z0], [x0 - ov, y, z1], [cx, y + h, z1], [cx, y + h, z0]);
    if (ow){ T3(ow, [x0, y, z1], [x1, y, z1], [cx, y + h, z1]); T3(ow, [x1, y, z0], [x0, y, z0], [cx, y + h, z0]); } }
};
// hipped roof on the rectangle x0..x1, z0..z1 at eaves height y, rise h
const hipR = function(o, x0, x1, z0, z1, y, h){
  const L = x1 - x0, W = z1 - z0, cx = (x0 + x1)/2, cz = (z0 + z1)/2; let a, b;
  if (L >= W){ const k = (L - W)/2; a = [cx - k, y + h, cz]; b = [cx + k, y + h, cz];
    Q(o, [x0, y, z1], [x1, y, z1], b, a); Q(o, [x1, y, z0], [x0, y, z0], a, b); T3(o, [x0, y, z0], [x0, y, z1], a); T3(o, [x1, y, z1], [x1, y, z0], b); }
  else { const k = (W - L)/2; a = [cx, y + h, cz - k]; b = [cx, y + h, cz + k];
    Q(o, [x1, y, z1], [x1, y, z0], a, b); Q(o, [x0, y, z0], [x0, y, z1], b, a); T3(o, [x0, y, z1], [x1, y, z1], b); T3(o, [x1, y, z0], [x0, y, z0], a); }
};
// cornice band all round a rectangle (projecting p, height h at y)
const corniceR = (o, x0, x1, z0, z1, y, h, p) => { bx(o, x0 - p, x1 + p, y, y + h, z0 - p, z0 + 0.6); bx(o, x0 - p, x1 + p, y, y + h, z1 - 0.6, z1 + p); bx(o, x0 - p, x0 + 0.6, y, y + h, z0 + 0.6, z1 - 0.6); bx(o, x1 - 0.6, x1 + p, y, y + h, z0 + 0.6, z1 - 0.6); };
// simple broadleaf tree (trunk + two-lobed crown) and a conifer (redwood / cypress), batched
const treeP = function(oT, oC, x, y, z, s, rng){
  segP(oT, [x, y - 1, z], [x, y + 3.2*s, z], 0.28*s, 5, 0.2*s);
  const j = () => (rng() - 0.5)*1.2*s;
  latheP(oC, [[0.01, y + 2.6*s], [2.2*s, y + 3.4*s], [2.5*s, y + 4.6*s], [1.7*s, y + 5.9*s], [0.01, y + 6.5*s]], x + j()*0.3, z + j()*0.3, 7, rng()*PI);
  latheP(oC, [[0.01, y + 3.6*s], [1.5*s, y + 4.2*s], [1.6*s, y + 5.2*s], [0.01, y + 6.0*s]], x + j(), z + j(), 6, rng()*PI);
};
const conifer = function(oT, oC, x, y, z, h, r, rng){
  segP(oT, [x, y - 1, z], [x, y + h*0.25, z], r*0.12, 5, r*0.09);
  const t = rng ? rng()*PI : 0; latheP(oC, [[0.01, y + h*0.12], [r, y + h*0.22], [r*0.86, y + h*0.45], [r*0.55, y + h*0.72], [0.01, y + h]], x, z, 7, t);
};
// strips along polylines draped on the real ground (the paths / service roads the app hides under a model are redrawn by it)
const drape = function(o, gy, lines, w, lift, yMax){
  if (!gy.real) return;                       // these are the real paths of the real site only
  for (const L of lines) for (let i = 0; i < L.length - 1; i++){ const a = L[i], b = L[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz); if (len < 0.05) continue;
    const nx = -dz/len*w/2, nz = dx/len*w/2, n = Math.max(1, Math.ceil(len/3)), Y = (x, z) => Math.min(yMax === undefined ? 1e9 : yMax, gy(x, z)) + lift;
    for (let k = 0; k < n; k++){ const f0 = k/n, f1 = (k + 1)/n, x0 = a[0] + dx*f0, z0 = a[1] + dz*f0, x1 = a[0] + dx*f1, z1 = a[1] + dz*f1;
      Q(o, [x0 - nx, Y(x0 - nx, z0 - nz), z0 - nz], [x0 + nx, Y(x0 + nx, z0 + nz), z0 + nz], [x1 + nx, Y(x1 + nx, z1 + nz), z1 + nz], [x1 - nx, Y(x1 - nx, z1 - nz), z1 - nz]); }
    if (i < L.length - 2) latheP(o, [[w/2, Y(b[0], b[1])], [0.01, Y(b[0], b[1]) + 0.001]], b[0], b[1], 8); }
};
// parts lying on the open ground round a model (redrawn paths, reflections on the water) go into a wrapper that does not
// pass traverse() on: they are not merged and do not count towards the ground-plan hull that hides the real city under it
const loose = (g, fn) => { const B2 = mkB(), w = new THREE.Object3D(); w.traverse = function(cb){ cb(this); }; fn(B2, w); B2.flush(w); g.add(w);
  for (const m of w.children) if (m.material && m.material.transparent) m.renderOrder = 3;      // translucent parts after the map's water (renderOrder 1)
  return w; };
// the real paths / service roads under each model's ground plan (OSM, local frames), redrawn with drape()
const HIDDEN = {"coittower":[[[-6.5,13.8],[5.2,14.2]],[[5.2,14.2],[10.4,11.8],[12.9,2.9],[13.2,-1.7],[8.2,-12.1],[-0.1,-12.5],[-10,-12.4],[-10,-6.2],[-12.5,-0.7],[-10.2,11.5],[-6.5,13.8]],[[-6.8,-33.4],[-6.3,-12.4]]],"legionofhonor":[[[36.2,-0.2],[36.3,12.3],[6.8,12.1],[6.7,-12.4],[36.1,-12.3],[36.2,-0.2]],[[50.7,-41.1],[47.8,4.8],[51.5,46.6]],[[116.6,-0.1],[43.4,-0.2]]],"palacefa":[[[42,-1],[22.3,-0.6]],[[39.1,119.3],[36.1,102.3],[22.2,92.3],[22.2,69.3]],[[49.7,118.3],[47.3,112.1],[36.1,102.3],[37.4,84.7],[35.3,74.5],[31.5,70.3],[25.6,68.6],[6.3,70.3],[-2.8,65.3],[-19.1,44.9],[-18.4,37.1],[-12.2,33],[-5,31.2],[-0.9,30.4],[16.7,35.7],[24.9,34.6],[31.1,28.8],[39.8,10.6],[42,-1],[37.3,-18.6],[27,-33],[18.4,-36],[-4.1,-30.1],[-17.2,-38.5],[-8.5,-58.5],[1.3,-70],[6.4,-72.8],[21.1,-73.3],[21.5,-93]],[[-15,139.7],[12.5,90.5]],[[-1,-30.2],[-0.3,-22.2]],[[-22,-0.6],[-46.1,-1.3],[-44.4,20.5],[-39.3,39.5],[-28.4,60.1],[-9.5,80.9],[1.8,88.1],[22.2,92.3],[22.3,129.5]],[[-0.4,22.2],[-0.9,30.4]],[[30.2,29.7],[15.9,15.9]],[[-15.2,-16.1],[-25.3,-25.9],[-17.2,-38.5]],[[29.1,-31.2],[15.2,-16.3]],[[-15.7,15.6],[-25.5,24.9],[-18.9,39.1]],[[21.1,-73.3],[35.4,-73.1]],[[-46.2,-10.2],[-41.6,-8.4],[-36.3,-2.7],[-38.1,4.5],[-46,7.9]]],"sfcityhall":[[[-59.5,-44.2],[-49.4,-42.7],[-50.7,-0.1]]],"sutrotower":[[[15.2,9.5],[6.5,13.4],[2.9,16.5]],[[2.9,16.5],[-8.7,9.2],[-13.2,-1.4],[-13.3,-6.2],[-9.8,-10],[4.1,-17.7],[10.7,-18.5],[18.4,-15.8]]]};
// ---------- night light points (lamp sprites; blink = aviation obstruction lights flashing in sync) ----------
const lampPts = function(g, pts, rgb, size, blink){
  if (!pts.length) return;
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const col = new Float32Array(pts.length); for (let i = 0; i < col.length; i += 3){ col[i] = rgb[0]; col[i+1] = rgb[1]; col[i+2] = rgb[2]; }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const tex = typeof lampTex !== 'undefined' && lampTex && lampTex.image ? lampTex : null;
  const mat = new THREE.PointsMaterial({size, map:tex, vertexColors:true, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending, sizeAttenuation:true});
  const p = new THREE.Points(geo, mat); p.renderOrder = 6; p.frustumCulled = false;
  p.onBeforeRender = () => {
    const nf = typeof matLamp !== 'undefined' ? Math.min(1, matLamp.opacity*1.15) : (NIGHT.uNight.value > 0.5 ? 1 : 0);
    let k = 1; if (blink){ const t = typeof LMT !== 'undefined' && LMT.value > 0 ? LMT.value : performance.now()/1000; k = (t % 1.6) < 0.75 ? 1 : 0.06; }
    mat.opacity = nf*k; };
  g.add(p);
};

// ======================================================================================================================
// SAN FRANCISCO CITY HALL (1915, Bakewell & Brown / Arthur Brown Jr.): Beaux-Arts, two blocks between Van Ness Ave and
// Polk St; granite facades with a rusticated base, a giant Doric colonnade along the wings, corner pavilions, pedimented
// central porticos on Polk and Van Ness; two light courts either side of the rotunda; the dome (after Les Invalides) on a
// colonnaded drum, its ribs, garlands and lantern gilded, top of the lantern 93.7 m. Night: floodlit, the colour-changing
// LED lighting (anim 'cycle').
// Local axes: +x = Polk St (E), -x = Van Ness Ave (W), -z = McAllister St (N), +z = Grove St (S); origin = dome axis.
// ======================================================================================================================
LANDMARKS.sfcityhall = {zh:'旧金山市政厅', en:'San Francisco City Hall', cat:'old', r:90, h:94,
  lt:{m:0, c:'#fff0d8', k:1.05, e:0.45, anim:'cycle', c2:'#ff8fd2'},
  build(){
    const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng, gy = siteGY('sfcityhall');
    const W = '#dedad0', T = '#c8c3b7', K = '#323a44', L = {c:'#3a3428', glow:'#ffd08a', gk:0.75}, R = {c:'#a3a59f', lk:0.25},
      SK = {c:'#5d6a72', lk:0.3}, CU = {c:'#2e3836', lk:0.6}, GD = {c:'#d8ad48', lk:1.1}, LG = {c:'#e4d6b4', glow:'#ffdf9e', gk:0.9}, SC = '#b9b3a6';
    const w = B.p(W), t = B.p(T), dk = B.p(K), lit = B.p(L), rf = B.p(R), sk = B.p(SK), cu = B.p(CU), gd = B.p(GD), lg = B.p(LG), sc = B.p(SC);
    const Y1 = 8.6, YC = 23.2, YE = 25.6, YA = 28.6, YB = 29.5;     // rusticated base top, colonnade top, entablature top, attic top, cornice top
    const WIN = (F, u0, u1, n, rows) => { const bw = (u1 - u0)/n; for (let i = 0; i < n; i++){ const uc = u0 + (i + 0.5)*bw;
      for (const [y0, h, kind, ww] of rows){ const o = rng() < 0.3 ? lit : dk; if (kind === 'a') farch(o, F, uc, y0, ww, y0 + h - ww/2, 0.06); else frect(o, F, uc - ww/2, uc + ww/2, y0, y0 + h, 0.06); } } };
    const rust = (F, u0, u1) => { for (let y = 1.1; y < Y1 - 0.5; y += 1.05) frect(t, F, u0, u1, y, y + 0.14, 0.04); fbx(t, F, u0, u1, Y1 - 0.6, Y1, -0.02, 0.35); };
    const topBand = (F, u0, u1, attWin) => {
      fbx(t, F, u0, u1, YC, YC + 0.9, -0.02, 2.3); fbx(w, F, u0, u1, YC + 0.9, YE - 0.6, -0.02, 2.0); fbx(t, F, u0 - 0.2, u1 + 0.2, YE - 0.6, YE, -0.02, 2.5);
      if (attWin){ const n = Math.max(1, Math.round((u1 - u0)/4.2)), bw = (u1 - u0)/n; for (let i = 0; i < n; i++) frect(dk, F, u0 + (i + 0.5)*bw - 0.8, u0 + (i + 0.5)*bw + 0.8, YE + 0.7, YE + 2.2, 0.05); }
      fbx(t, F, u0 - 0.3, u1 + 0.3, YA, YB, -0.02, 1.1); fbal(t, F, u0, u1, YB, 1.15, 0.4, 0.34, 0.55); };
    // colonnaded wing facade: rusticated base with arched windows, recessed wall with two storeys of windows behind a giant Doric order
    const colFacade = (F, u0, u1, n) => { const bw = (u1 - u0)/n, Fo = foff(F, 2.4);
      fbx(w, F, u0, u1, 0, Y1, -0.02, 2.4); rust(Fo, u0, u1); WIN(Fo, u0, u1, n, [[1.6, 5.2, 'a', 1.7]]); WIN(F, u0, u1, n, [[9.8, 4.0, 'r', 1.6], [15.6, 4.6, 'r', 1.6]]);
      for (let i = 0; i <= n; i++) fcol(w, t, F, u0 + i*bw, 1.55, Y1, YC, 0.78, 10);
      topBand(F, u0, u1, true); };
    // pavilion facade: rusticated base, paired pilasters, pedimented windows
    const pavFacade = (F, u0, u1) => { const n = 3, bw = (u1 - u0)/n;
      rust(F, u0, u1); WIN(F, u0, u1, n, [[1.6, 5.2, 'a', 1.9], [9.8, 4.6, 'r', 1.8], [16.2, 4.0, 'r', 1.7]]);
      for (let i = 0; i <= n; i++){ const u = u0 + i*bw, s = i === 0 ? 1 : i === n ? -1 : 0; for (const o of s ? [s*0.6, s*1.9] : [-0.65, 0.65]) fbx(w, F, u + o - 0.42, u + o + 0.42, Y1, YC, -0.02, 0.55); }
      for (let i = 0; i < n; i++){ const uc = u0 + (i + 0.5)*bw; fped(w, t, F, uc - 1.4, uc + 1.4, 14.6, 0.9, 0, 0.3); fbx(t, F, uc - 1.3, uc + 1.3, 14.3, 14.6, 0, 0.35); }
      fbx(t, F, u0, u1, YC, YE, -0.02, 0.9); fbx(t, F, u0 - 0.3, u1 + 0.3, YA + 0.6, YB + 0.6, -0.02, 1.1); fbal(t, F, u0, u1, YB + 0.6, 1.15, 0.4, 0.34, 0.55); };
    // ---- plan (traced from the footprint): wings round two light courts, corner pavilions, central pavilions ----
    const XE = 43.6, XW = -42.9, ZN = -61.8, ZS = 61.0, CX = 24, CZ0 = 23.5, CZ1 = 46.5;
    const PAV = [[-44.0, -22.0, -64.0, -48.2], [21.5, 44.6, -64.0, -48.2], [-44.0, -22.0, 47.4, 63.3], [21.5, 44.6, 47.4, 63.3]];
    // granite plinth down to the ground (the site falls ~3 m to the south-east)
    { const lo = minGY(gy, [[XW, ZN], [XE, ZN], [XE, ZS], [XW, ZS], [0, 0], [-47, 0], [47, 0]]) - 2.5;
      bx(t, XW - 1.3, XE + 4.6, lo, 0.35, ZN - 2.4, ZS + 2.5); }
    // bars round the courts (to the attic top)
    bx(w, XW, XE, 0, YA, ZN, -CZ1); bx(w, XW, XE, 0, YA, CZ1, ZS); bx(w, XW, -CX, 0, YA, -CZ1, CZ1); bx(w, CX, XE, 0, YA, -CZ1, CZ1); bx(w, -CX, CX, 0, YA, -CZ0, CZ0);
    // roofs: flat grey roof over the wings, glazed skylights over the light courts (sunk 4.6 m)
    for (const [x0, x1, z0, z1] of [[XW, XE, ZN, -CZ1], [XW, XE, CZ1, ZS], [XW, -CX, -CZ1, CZ1], [CX, XE, -CZ1, CZ1]]) bx(rf, x0 + 0.8, x1 - 0.8, YA, YA + 0.25, z0 + 0.8, z1 - 0.8);
    for (const s of [-1, 1]){ const z0 = s < 0 ? -CZ1 : CZ0, z1 = s < 0 ? -CZ0 : CZ1;
      bx(w, -CX, CX, 0, 24.0, z0, z1); bx(sk, -CX + 1.2, CX - 1.2, 24.0, 24.4, z0 + 1.2, z1 - 1.2);
      for (let k = -2; k <= 2; k++) gabR(sk, null, -CX + 1.2, CX - 1.2, z0 + 1.2 + (z1 - z0 - 2.4)*(k + 2)/5, z0 + 1.2 + (z1 - z0 - 2.4)*(k + 3)/5, 24.4, 1.0, 'x', 0);
      // court walls: windows on the inner faces
      const Fs = s < 0 ? [fc(-CX, -CZ0, CX, -CZ0), fc(CX, -CZ1, -CX, -CZ1), fc(-CX, -CZ1, -CX, -CZ0), fc(CX, -CZ0, CX, -CZ1)] : [fc(CX, CZ0, -CX, CZ0), fc(-CX, CZ1, CX, CZ1), fc(-CX, CZ0, -CX, CZ1), fc(CX, CZ1, CX, CZ0)];
      for (const F of Fs){ const Fi = {...F, nx:-F.nx, nz:-F.nz}; const n = Math.round(F.L/4.4); for (let i = 0; i < n; i++){ const uc = (i + 0.5)*F.L/n; frect(rng() < 0.4 ? lit : dk, Fi, uc - 0.8, uc + 0.8, YE + 0.4, YE + 2.3, 0.05); } }
    }
    // corner pavilions (a metre proud of the wings, attic 0.6 m higher)
    for (const [x0, x1, z0, z1] of PAV){
      bx(w, x0, x1, 0, YA + 0.6, z0, z1); bx(rf, x0 + 0.8, x1 - 0.8, YA + 0.6, YA + 0.9, z0 + 0.8, z1 - 0.8);
      const R4 = rectF(x0, x1, z0, z1), Fz = z0 < 0 ? R4.b : R4.f, Fx = x0 < 0 ? R4.l : R4.r;
      pavFacade(Fz, 0.3, Fz.L - 0.3); pavFacade(Fx, 0.3, Fx.L - 0.3);
    }
    // long facades: the colonnaded wings on Polk (E) and Van Ness (W)
    for (const [xf, s] of [[XE, 1], [XW, -1]]){
      for (const [za, zb] of [[-48.2, -16.0], [16.0, 47.4]]){ const F = s > 0 ? fc(xf, zb, xf, za) : fc(xf, za, xf, zb); colFacade(F, 0, F.L, 7); }
    }
    // short facades: the recessed centres on McAllister (N) and Grove (S)
    for (const [zf, s] of [[ZN, -1], [ZS, 1]]){ const F = s < 0 ? fc(21.5, zf, -22.0, zf) : fc(-22.0, zf, 21.5, zf); colFacade(F, 0, F.L, 10); }
    // ---- central pavilions with porticos and pediments; the transverse attic and its gable roof over the axis ----
    for (const s of [1, -1]){
      const xw = s > 0 ? 44.8 : -45.0, xc = s > 0 ? 46.5 : -46.7, hz = 12.5;
      bx(w, Math.min(xw, s*CX), Math.max(xw, s*CX), 0, YA, -16.0, 16.0);
      const F = s > 0 ? fc(xw, hz, xw, -hz) : fc(xw, -hz, xw, hz);
      const Fo = foff(F, 2.8); fbx(w, F, -0.4, F.L + 0.4, 0, Y1, -0.02, 2.8);
      rust(Fo, -0.4, F.L + 0.4); farch(dk, Fo, F.L/2, 0.4, 3.6, 5.6, 0.06, 8); farch(dk, Fo, F.L/2 - 6.3, 0.4, 2.6, 5.0, 0.06); farch(dk, Fo, F.L/2 + 6.3, 0.4, 2.6, 5.0, 0.06);
      WIN(F, 0, F.L, 6, [[9.8, 4.4, 'r', 1.7], [16.0, 4.6, 'a', 1.7]]);
      for (let i = 0; i < 6; i++){ const u = 2.3 + i*(F.L - 4.6)/5; fcol(w, t, F, u, 1.75, Y1, YC, 0.85, 12); }
      fbx(t, F, -0.4, F.L + 0.4, YC, YC + 0.9, -0.02, 2.6); fbx(w, F, -0.4, F.L + 0.4, YC + 0.9, YE, -0.02, 2.3); fbx(t, F, -0.6, F.L + 0.6, YE - 0.4, YE + 0.2, -0.02, 2.8);
      fped(w, t, F, -0.6, F.L + 0.6, YE + 0.2, 5.4, 0, 2.6);
      // sculpture group in the tympanum (abstract figures), acroteria
      for (let i = 0; i < 9; i++){ const u = F.L/2 + (i - 4)*2.3, hh = 4.2*(1 - Math.abs(i - 4)/5.2); if (hh > 0.6) fbx(sc, F, u - 0.7, u + 0.7, YE + 0.4, YE + 0.4 + hh, 2.0, 2.9); }
      for (const u of [-0.4, F.L/2, F.L + 0.4]){ const c = fp(F, u, 0, 2.0); latheP(sc, [[0.8, u === F.L/2 ? YE + 5.8 : YE + 0.2], [0.55, (u === F.L/2 ? YE + 5.8 : YE + 0.2) + 1.6], [0.01, (u === F.L/2 ? YE + 5.8 : YE + 0.2) + 2.6]], c[0], c[2], 6); }
      // the steps up to the doors
      { const gF = Math.min(0, gy(xw + s*7, 0)), n = Math.max(3, Math.min(14, Math.ceil((0.5 - gF)/0.17)));
        for (let k = 0; k < n; k++) fbx(t, F, 3.0 - k*0.15, F.L - 3.0 + k*0.15, gF - 1.0, 0.5 - (k + 1)*(0.5 - gF)/n + 0.17, 2.8 + k*0.42, 3.25 + k*0.42); }
      // wing returns between the portico and the colonnades
      for (const zz of [[-16, -12.5], [12.5, 16]]){ const Fr = s > 0 ? fc(XE + 1.2, zz[1], XE + 1.2, zz[0]) : fc(XW - 2.1, zz[0], XW - 2.1, zz[1]); rust(Fr, 0, Fr.L); topBand(Fr, 0, Fr.L, false); }
    }
    // Van Ness porch: four tall piers in front of the west portico (the carriage entrance)
    for (const z of [-6.3, -2.4, 1.4, 6.6]) bx(w, -50.7, -48.3, 0, 15.0, z - 1.5, z + 1.5);
    bx(t, -51.0, -48.0, 15.0, 16.2, -8.0, 8.2);
    // transverse attic over the axis (E-W) with a low gable roof; the rotunda base rises through it
    bx(w, -45.0, 44.8, YA, 31.6, -14.4, 14.4); corniceR(t, -45.0, 44.8, -14.4, 14.4, 31.2, 0.6, 0.5);
    gabR(rf, w, -45.0, 44.8, -14.4, 14.4, 31.8, 5.2, 'x', 0.6);
    // ---- rotunda base block, corner pylons, drum, colonnade, attic, dome and lantern ----
    bx(w, -19.8, 19.8, YA, 33.6, -19.8, 19.8); corniceR(t, -19.8, 19.8, -19.8, 19.8, 33.0, 0.8, 0.6);
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]){ const x0 = sx > 0 ? 9.6 : -19.8, z0 = sz > 0 ? 9.4 : -19.8;
      bx(w, x0, x0 + 10.2, 33.6, 37.6, z0, z0 + 10.4); bx(t, x0 - 0.3, x0 + 10.5, 37.6, 38.3, z0 - 0.3, z0 + 10.7);
      const cx = x0 + 5.1, cz = z0 + 5.2; latheP(sc, [[1.6, 38.3], [1.3, 39.4], [1.7, 40.4], [0.9, 41.6], [0.01, 42.2]], cx, cz, 8); }
    const NC = 32;
    latheP(w, [[18.9, 33.6], [18.9, 38.6], [18.2, 39.4], [0.01, 39.4]], 0, 0, NC);                // drum podium
    latheP(w, [[15.0, 39.4], [15.0, 51.0]], 0, 0, NC);                                               // drum wall
    for (let i = 0; i < 16; i++){ const a = (i + 0.5)/16*TAU, F = fc(Math.cos(a + 0.09)*15.05, Math.sin(a + 0.09)*15.05, Math.cos(a - 0.09)*15.05, Math.sin(a - 0.09)*15.05);
      farch(rng() < 0.5 ? lit : dk, F, F.L/2, 41.2, 1.9, 47.6, 0.04, 6); }
    for (let i = 0; i < 16; i++) for (const o of [-0.075, 0.075]){ const a = i/16*TAU + o; col(w, t, Math.cos(a)*17.3, Math.sin(a)*17.3, 39.4, 50.6, 0.62, 8); }
    latheP(t, [[18.2, 50.6], [18.4, 51.4], [18.0, 52.8], [15.0, 52.8]], 0, 0, NC);                // entablature
    latheP(w, [[15.6, 52.8], [15.6, 56.6], [15.9, 56.6], [15.9, 57.3], [14.9, 57.3]], 0, 0, NC);   // attic
    for (let i = 0; i < 32; i++){ const a = (i + 0.5)/32*TAU; bx(t, Math.cos(a)*17.7 - 0.25, Math.cos(a)*17.7 + 0.25, 52.8, 54.0, Math.sin(a)*17.7 - 0.25, Math.sin(a)*17.7 + 0.25); }
    latheP(t, [[18.0, 54.0], [18.0, 54.25], [17.4, 54.25]], 0, 0, NC);
    for (let i = 0; i < 16; i++){ const a = (i + 0.5)/16*TAU, F = fc(Math.cos(a + 0.12)*15.65, Math.sin(a + 0.12)*15.65, Math.cos(a - 0.12)*15.65, Math.sin(a - 0.12)*15.65); fdisc(dk, F, F.L/2, 54.9, 0.75, 0.04, 8); }
    // the copper dome (patinated), sixteen gilded ribs, a gilded garland band and eight lucarnes
    const DP = [[14.9, 57.3], [14.85, 59.5], [14.4, 62.5], [13.5, 65.6], [12.1, 68.6], [10.2, 71.4], [8.0, 73.8], [5.8, 75.6], [4.5, 76.6]];
    latheP(cu, DP, 0, 0, NC);
    for (let i = 0; i < 16; i++){ const a = i/16*TAU, ca = Math.cos(a), sa = Math.sin(a);
      for (let k = 0; k < DP.length - 1; k++){ const p = DP[k], q = DP[k + 1]; segP(gd, [ca*(p[0] + 0.12), p[1], sa*(p[0] + 0.12)], [ca*(q[0] + 0.12), q[1], sa*(q[0] + 0.12)], 0.22, 4); } }
    latheP(gd, [[15.05, 57.3], [15.05, 57.9], [14.9, 57.9]], 0, 0, NC);
    latheP(gd, [[13.75, 64.9], [13.8, 65.4], [13.3, 66.0]], 0, 0, NC);
    for (let i = 0; i < 8; i++){ const a = (i + 0.5)/8*TAU, r = 14.3, x = Math.cos(a)*r, z = Math.sin(a)*r, F = fc(x - Math.sin(a)*1.0, z + Math.cos(a)*1.0, x + Math.sin(a)*1.0, z - Math.cos(a)*1.0);
      const Fo = (Math.cos(a)*F.nx + Math.sin(a)*F.nz) > 0 ? F : fc(x + Math.sin(a)*1.0, z - Math.cos(a)*1.0, x - Math.sin(a)*1.0, z + Math.cos(a)*1.0);
      fbx(cu, Fo, 0, 2.0, 59.2, 61.6, -1.2, 0.6); farch(dk, Fo, 1.0, 59.5, 1.1, 60.9, 0.62, 6); fped(gd, null, Fo, -0.1, 2.1, 61.6, 0.8, -1.2, 0.6); }
    // lantern: base, colonnaded drum (lit at night), small gilded dome, the finial (orb and torch) to 93.7 m
    latheP(w, [[5.3, 76.3], [5.3, 78.0], [4.4, 78.0]], 0, 0, 16);
    latheP(lg, [[2.9, 78.0], [2.9, 85.8]], 0, 0, 16);
    for (let i = 0; i < 8; i++){ const a = i/8*TAU; col(w, gd, Math.cos(a)*3.9, Math.sin(a)*3.9, 78.0, 85.6, 0.3, 6); bx(gd, Math.cos(a)*5.0 - 0.3, Math.cos(a)*5.0 + 0.3, 78.0, 79.6, Math.sin(a)*5.0 - 0.3, Math.sin(a)*5.0 + 0.3); }
    latheP(t, [[4.4, 85.6], [4.5, 86.4], [3.3, 86.4]], 0, 0, 16);
    latheP(gd, [[3.5, 86.4], [3.2, 87.6], [2.3, 88.8], [1.0, 89.5], [0.45, 89.7]], 0, 0, 16);
    latheP(gd, [[0.45, 89.7], [0.75, 90.2], [0.35, 90.9], [0.7, 91.8], [0.8, 92.4], [0.5, 92.9], [0.22, 93.3], [0.01, 93.7]], 0, 0, 10);
    loose(g, L2 => drape(L2.p({c:'#cfc8b8', lk:0.15}), gy, HIDDEN.sfcityhall || [], 2.6, 0.12));
    // flagpoles over the porticos
    for (const s of [1, -1]) segP(t, [s*44.0, YB, 0], [s*44.0, 46.0, 0], 0.12, 4, 0.06);
    B.flush(g); return g; }};


// ======================================================================================================================
// COIT TOWER (1933, Arthur Brown Jr. & Henry Howard): a fluted, slightly tapering column of unpainted concrete on the top
// of Telegraph Hill, 64 m; the arcade of the observation deck 9.8 m below the top, a crown of piers; the base rotunda
// (murals inside) with the entrance and its phoenix relief on the north (the parking circle). Night: floodlit white.
// The smoothed terrain puts the summit ~20 m north-west of the tower: the tower stands on its summit terrace, a stone
// retaining wall and a short grassy skirt carry it down to the real ground on the steep east and south sides.
// Local axes: -z = north (entrance), origin = shaft axis.
// ======================================================================================================================
LANDMARKS.coittower = {zh:'科伊特塔', en:'Coit Tower', cat:'old', r:22, h:66,
  lt:{m:0, c:'#f1f3ff', k:1.3, e:0.8},
  build(){
    const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng, gy = siteGY('coittower');
    const C = '#e2ddd1', C2 = '#cfc8b9', K = '#2c3036', L = {c:'#3a3428', glow:'#ffd9a0', gk:0.6}, ST = '#a39b8d', GR = {c:'#6f7f52', lk:0.15}, TT = '#5b4b3b', TC = {c:'#4f6b45', lk:0.15}, PV = '#b3ac9f';
    const c = B.p(C), c2 = B.p(C2), dk = B.p(K), lit = B.p(L), st = B.p(ST), gr = B.p(GR), tt = B.p(TT), tc = B.p(TC), pv = B.p(PV);
    const F0 = -1.5;                                   // floor of the summit terrace (local y), ~81.8 m above the sea
    // ---- summit terrace, retaining wall, grassy skirt down to the real ground ----
    { const n = 24, RT = 14.6, P = [], Q2 = [];
      for (let i = 0; i < n; i++){ const a = i/n*TAU, ca = Math.cos(a), sa = Math.sin(a), ro = (ca > 0.55 && sa < 0.45) ? 17.0 : 19.0;
        P.push([ca*RT, sa*RT]); Q2.push([ca*ro, sa*ro, Math.min(F0 - 0.4, gy(ca*ro, sa*ro) - 0.4)]); }
      capP(pv, P, F0); 
      for (let i = 0; i < n; i++){ const j = (i + 1) % n, a = P[i], b = P[j], ga = Math.min(F0, gy(a[0]*1.02, a[1]*1.02)) - 0.6, gb = Math.min(F0, gy(b[0]*1.02, b[1]*1.02)) - 0.6;
        Q(st, [a[0], ga, a[1]], [b[0], gb, b[1]], [b[0], F0, b[1]], [a[0], F0, a[1]]);
        Q(st, [a[0]*1.01, F0, a[1]*1.01], [b[0]*1.01, F0, b[1]*1.01], [b[0]*1.01, F0 + 1.05, b[1]*1.01], [a[0]*1.01, F0 + 1.05, a[1]*1.01]);
        const A = Q2[i], Bq = Q2[j]; Q(gr, [a[0], ga, a[1]], [A[0], A[2], A[1]], [Bq[0], Bq[2], Bq[1]], [b[0], gb, b[1]]); }
      // pines and eucalypts on the hillside
      for (let i = 0; i < 9; i++){ const a = (i + 0.3 + rng()*0.4)/9*TAU, rr = 16.0 + rng()*1.5, x = Math.cos(a)*rr, z = Math.sin(a)*rr;
        if (Math.cos(a) > 0.55 && Math.sin(a) < 0.45) continue; treeP(tt, tc, x, Math.min(F0, gy(x, z)), z, 1.5 + rng()*0.6, rng); }
    }
    loose(g, L2 => drape(L2.p(PV), gy, HIDDEN.coittower || [], 2.2, 0.1, F0 - 0.2));
    // ---- base rotunda (one tall storey, flat roof with a parapet), entrance block and the square lobby round the shaft ----
    const BP = [[-10.9, -2.9], [-9.8, -5.8], [-8.9, -5.7], [-8.8, -8.4], [-5.9, -8.5], [-5.9, -11.1], [5.5, -11.1], [5.5, -8.5], [8.8, -8.5], [8.8, -5.8], [10.1, -5.8], [11.2, -2.6], [11.1, 1.6], [10.2, 5.7], [8.9, 5.7], [8.9, 8.6], [5.6, 8.6], [5.5, 10.0], [2.8, 10.9], [-1.5, 11.1], [-5.3, 10.0], [-5.7, 8.7], [-8.7, 8.6], [-8.8, 5.7], [-9.7, 5.7], [-10.8, 3.0], [-11.2, -0.3]];
    const YB = F0 + 6.0;
    LPoly(g, BP, F0 - 0.5, 6.5, C2);
    for (let i = 0; i < BP.length; i++){ const a = BP[i], b = BP[(i + 1) % BP.length], F = fc(b[0], b[1], a[0], a[1]);
      fbx(c, F, -0.05, F.L + 0.05, YB - 0.7, YB, -0.02, 0.35); fbx(c, F, -0.05, F.L + 0.05, YB, YB + 1.0, -0.15, 0.12);
      if (F.L > 2.4 && Math.abs(a[1] + 11.1) > 0.2) for (let u = 1.0; u < F.L - 0.6; u += 2.2){ frect(rng() < 0.3 ? lit : dk, F, u, u + 0.7, F0 + 1.0, F0 + 4.6, 0.04); } }
    // entrance on the north: stepped portal, tall door, the phoenix relief over it
    { const F = fc(3.1, -11.1, -3.1, -11.1);
      fbx(c, F, 0, 6.2, F0, F0 + 8.0, -0.1, 0.35); fbx(c2, F, 0.9, 5.3, F0, F0 + 9.6, -0.1, 0.1);
      frect(dk, F, 1.9, 4.3, F0, F0 + 4.2, 0.4); frect(c2, F, 1.7, 4.5, F0 + 5.0, F0 + 7.4, 0.42);
      for (const [u, y0, h] of [[3.1, 5.2, 1.6], [2.4, 6.0, 0.9], [3.8, 6.0, 0.9]]) fbx(st, F, u - 0.35, u + 0.35, F0 + y0, F0 + y0 + h, 0.4, 0.62);
      // steps down to the parking circle
      const ge = Math.min(F0, gy(0, -16)); for (let k = 0; k < 6; k++){ const y = F0 - (k + 1)*(F0 - ge)/6; bx(st, -3.0, 3.0, ge - 1, y + 0.05, -14.6 - (k + 1)*0.45, -14.6 - k*0.45); } }
    bx(c, -5.85, 5.75, F0, F0 + 12.0, -5.8, 5.7); bx(c2, -6.05, 5.95, F0 + 11.6, F0 + 12.2, -6.0, 5.9);
    // ---- the fluted shaft (tapering 5.65 -> 5.25 m), the deck arcade, cornice and the crown of piers ----
    const NF = 20, Y0 = F0 + 12.2, YD = F0 + 54.2, YT = F0 + 64.0, rAt = y => 5.65 - 0.4*(y - Y0)/(YD - Y0);
    { const rows = [Y0, Y0 + 14, Y0 + 28, YD - 0.6];
      for (let k = 0; k < rows.length - 1; k++){ const ya = rows[k], yb = rows[k + 1];
        for (let i = 0; i < NF*2; i++){ const a0 = i/(NF*2)*TAU, a1 = (i + 1)/(NF*2)*TAU, ra0 = rAt(ya) - (i % 2 ? 0.22 : 0), ra1 = rAt(ya) - ((i + 1) % 2 ? 0.22 : 0), rb0 = rAt(yb) - (i % 2 ? 0.22 : 0), rb1 = rAt(yb) - ((i + 1) % 2 ? 0.22 : 0);
          Q(c, [Math.cos(a0)*ra0, ya, Math.sin(a0)*ra0], [Math.cos(a0)*rb0, yb, Math.sin(a0)*rb0], [Math.cos(a1)*rb1, yb, Math.sin(a1)*rb1], [Math.cos(a1)*ra1, ya, Math.sin(a1)*ra1]); } }
      latheP(c2, [[rAt(YD) + 0.25, YD - 0.6], [rAt(YD) + 0.45, YD]], 0, 0, 40);
      // observation deck arcade: 12 tall round-headed openings
      const rr = 5.3; latheP(c, [[rr, YD], [rr, YD + 6.8]], 0, 0, 36);
      for (let i = 0; i < 12; i++){ const a = (i + 0.5)/12*TAU, F = fc(Math.cos(a + 0.2)*(rr + 0.02), Math.sin(a + 0.2)*(rr + 0.02), Math.cos(a - 0.2)*(rr + 0.02), Math.sin(a - 0.2)*(rr + 0.02));
        farch(rng() < 0.5 ? lit : dk, F, F.L/2, YD + 0.3, 2.05, YD + 5.0, 0.03, 6); }
      latheP(c2, [[rr + 0.3, YD + 6.8], [rr + 0.5, YD + 7.4], [rr + 0.2, YD + 7.6]], 0, 0, 36);
      // crown: ring of piers (the top's scalloped look) round a slightly smaller drum, flat roof
      latheP(c, [[4.8, YD + 7.6], [4.8, YT - 0.5], [0.01, YT - 0.5]], 0, 0, 24);
      for (let i = 0; i < 16; i++){ const a = i/16*TAU; rbx(c, Math.cos(a)*5.05, Math.sin(a)*5.05, 0.9, 0.9, YD + 7.6, YT, -a); latheP(c2, [[0.5, YT], [0.01, YT + 0.5]], Math.cos(a)*5.05, Math.sin(a)*5.05, 4, PI/4); }
      latheP(c2, [[1.6, YT - 0.5], [1.6, YT + 0.6], [0.01, YT + 0.6]], 0, 0, 8);
    }
    B.flush(g); return g; }};

// ======================================================================================================================
// SUTRO TOWER (1973): the three-legged TV/FM mast on Mount Sutro, 298 m to the tip (ground ~250 m). Legs 45.7 m apart at
// the base lean in to the waist (18.3 m) at ~168 m and out again to the antenna triangle (30.5 m) at 232 m; the top
// crossarm's sides run on past the corners; three masts carry the antennas to 298 m. Lattice legs and X-bracing,
// platforms at 55, 114 and 168 m; painted in bands of international orange and white. Night: unlit, red aviation lights
// flashing in sync. (Plan from the OSM 3-D parts: legs, platforms and crossarm.)
// Local axes = east/south, origin = the tower axis; one leg due west.
// ======================================================================================================================
LANDMARKS.sutrotower = {zh:'苏特罗塔', en:'Sutro Tower', cat:'new', r:40, h:298,
  lt:{m:0, c:'#ffffff', k:0.05, e:1.0},
  build(){
    const g = new THREE.Group(), B = mkB(), gy = siteGY('sutrotower');
    const RD = {c:'#c4402e', lk:0.2}, WH = {c:'#eeeeea', lk:0.2}, GY = '#8d9196', CO = '#b3ada2', AV = {c:'#a01010', glow:'#ff2a1a', gk:2.2}, AN = {c:'#d9d9d4', lk:0.2};
    const rd = B.p(RD), wh = B.p(WH), gyb = B.p(GY), co = B.p(CO), av = B.p(AV), an = B.p(AN);
    const band = y => (Math.floor(y/26) % 2) ? wh : rd;
    const LA = [PI, PI/3, -PI/3].map(a => [Math.cos(a), -Math.sin(a)]);            // leg directions (x, z): W, NE, SE
    const Rl = y => y <= 167.8 ? 26.9 + (10.5 - 26.9)*y/167.8 : 10.5 + (17.8 - 10.5)*(y - 167.8)/(230 - 167.8);
    const P = (k, y) => [LA[k][0]*Rl(y), y, LA[k][1]*Rl(y)];
    const LV = [0, 26, 55, 84, 114.5, 141, 167.8, 199, 230];                          // panel levels
    // ---- legs: four-chord lattice columns (2.6 m), zigzag lacing, banded ----
    const HW = 1.3;
    for (let k = 0; k < 3; k++){
      const d = LA[k], tx = -d[1], tz = d[0];                                         // tangent (horizontal, across the leg)
      const corner = (y, i) => { const p = P(k, y), su = (i & 1) ? 1 : -1, sv = (i & 2) ? 1 : -1; return [p[0] + tx*su*HW + d[0]*sv*HW, y, p[2] + tz*su*HW + d[1]*sv*HW]; };
      const ys = []; for (let y = 0; y < 230; y += 6.5) ys.push(y); ys.push(230);
      for (let s = 0; s < ys.length - 1; s++){ const ya = ys[s], yb = ys[s + 1], o = band((ya + yb)/2);
        segP(o, P(k, ya), P(k, yb), 1.25, 4);
        for (let i = 0; i < 4; i++) segP(o, corner(ya, i), corner(yb, i), 0.42, 4);
        for (const [i, j] of [[0, 1], [1, 3], [3, 2], [2, 0]]) segP(o, corner(ya, i), corner(yb, j), 0.12, 3);
        for (const [i, j] of [[0, 1], [1, 3], [3, 2], [2, 0]]) segP(o, corner(yb, i), corner(yb, j), 0.1, 3); }
      // concrete footing down to the real ground
      const p0 = P(k, 0), gl = Math.min(-0.5, gy(p0[0], p0[2])) - 1.5; bx(co, p0[0] - 3.2, p0[0] + 3.2, gl, 1.4, p0[2] - 3.2, p0[2] + 3.2);
    }
    // ---- bracing between the legs: horizontal girts at each level, X-diagonals in each panel, platforms with rails ----
    for (let l = 0; l < LV.length; l++){ const y = LV[l];
      for (let k = 0; k < 3; k++){ const a = P(k, y), b = P((k + 1) % 3, y);
        if (l > 0) segP(wh, a, b, 0.6, 4);
        if (l < LV.length - 1){ const y2 = LV[l + 1], a2 = P(k, y2), b2 = P((k + 1) % 3, y2), o = band((y + y2)/2);
          segP(o, a, b2, 0.55, 4); segP(o, b, a2, 0.55, 4);
          const m = [(a[0] + b2[0] + b[0] + a2[0])/4, (y + y2)/2, (a[2] + b2[2] + b[2] + a2[2])/4];  // a short strut at the X
          segP(o, [(a[0] + b[0])/2, y, (a[2] + b[2])/2], m, 0.2, 3); } } }
    for (const y of [55, 114.5, 167.8]){ const T = [0, 1, 2].map(k => { const p = P(k, y); return [p[0]*1.12, p[2]*1.12]; });
      for (let k = 0; k < 3; k++){ const a = T[k], b = T[(k + 1) % 3], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), nx = dz/L*1.2, nz = -dx/L*1.2;
        Q(gyb, [a[0], y - 0.3, a[1]], [b[0], y - 0.3, b[1]], [b[0] + nx, y - 0.3, b[1] + nz], [a[0] + nx, y - 0.3, a[1] + nz]);
        Q(wh, [a[0], y - 1.6, a[1]], [b[0], y - 1.6, b[1]], [b[0], y - 0.3, b[1]], [a[0], y - 0.3, a[1]]);
        segP(wh, [a[0] + nx, y + 0.7, a[1] + nz], [b[0] + nx, y + 0.7, b[1] + nz], 0.06, 3); } }
    // ---- the top crossarm: a deep triangular truss whose sides run 14 m past the corners ----
    { const y0 = 228.2, y1 = 232.2, C3 = [0, 1, 2].map(k => P(k, 230));
      for (let k = 0; k < 3; k++){ const a = C3[k], b = C3[(k + 1) % 3], dx = b[0] - a[0], dz = b[2] - a[2], L = Math.hypot(dx, dz), ux = dx/L, uz = dz/L, nx = -uz*1.0, nz = ux*1.0;
        const A = [a[0] - ux*13.6, a[2] - uz*13.6], Bp = [b[0] + ux*13.6, b[2] + uz*13.6];
        for (const s of [-1, 1]) for (const y of [y0, y1]) segP(wh, [A[0] + nx*s, y, A[1] + nz*s], [Bp[0] + nx*s, y, Bp[1] + nz*s], 0.3, 4);
        const n = 14; for (let i = 0; i < n; i++){ const f0 = i/n, f1 = (i + 1)/n, p0 = [A[0] + (Bp[0] - A[0])*f0, A[1] + (Bp[1] - A[1])*f0], p1 = [A[0] + (Bp[0] - A[0])*f1, A[1] + (Bp[1] - A[1])*f1];
          for (const s of [-1, 1]) segP(wh, [p0[0] + nx*s, i % 2 ? y0 : y1, p0[1] + nz*s], [p1[0] + nx*s, i % 2 ? y1 : y0, p1[1] + nz*s], 0.16, 3); }
        Q(gyb, [A[0] - nx*1.2, y1 + 0.05, A[1] - nz*1.2], [Bp[0] - nx*1.2, y1 + 0.05, Bp[1] - nz*1.2], [Bp[0] + nx*1.2, y1 + 0.05, Bp[1] + nz*1.2], [A[0] + nx*1.2, y1 + 0.05, A[1] + nz*1.2]);
        // antenna pods hung at the arm ends
        for (const E of [A, Bp]){ segP(an, [E[0], y0 - 6, E[1]], [E[0], y0, E[1]], 0.75, 8); bx(av, E[0] - 0.4, E[0] + 0.4, y1, y1 + 0.8, E[1] - 0.4, E[1] + 0.4); }
      }
      // equipment cabin (the observatory level) in the middle
      latheP(gyb, [[4.5, 226.0], [4.5, 228.2], [0.01, 228.2]], 0, 0, 6, PI/6);
      // ---- three masts on the corners: lattice to 276 m, radome stack, whip to 297.8 m; bands of orange and white ----
      for (let k = 0; k < 3; k++){ const c = C3[k], top = k === 0 ? 297.8 : 296.0;
        const cr = (y, i) => { const w = 1.25 - 0.5*(y - 232)/44, sx = (i & 1) ? 1 : -1, sz = (i & 2) ? 1 : -1; return [c[0] + sx*w, y, c[2] + sz*w]; };
        for (let y = 232.2; y < 276; y += 5.5){ const yb = Math.min(276, y + 5.5), o = (Math.floor((y - 232)/11) % 2) ? wh : rd;
          for (let i = 0; i < 4; i++) segP(o, cr(y, i), cr(yb, i), 0.16, 3);
          for (const [i, j] of [[0, 1], [1, 3], [3, 2], [2, 0]]) segP(o, cr(y, i), cr(yb, j), 0.07, 3); }
        for (let y = 276; y < 290; y += 3.5) segP(Math.floor((y - 276)/3.5) % 2 ? wh : rd, [c[0], y, c[2]], [c[0], y + 3.5, c[2]], 0.95, 8);
        segP(rd, [c[0], 290, c[2]], [c[0], top - 0.8, c[2]], 0.28, 6); segP(wh, [c[0], top - 0.8, c[2]], [c[0], top, c[2]], 0.18, 6);
        bx(av, c[0] - 0.45, c[0] + 0.45, top, top + 0.7, c[2] - 0.45, c[2] + 0.45);
        for (let i = 0; i < 6; i++){ const a = i/6*TAU; segP(an, [c[0] + Math.cos(a)*1.1, 262, c[2] + Math.sin(a)*1.1], [c[0] + Math.cos(a)*1.1, 272, c[2] + Math.sin(a)*1.1], 0.32, 4); }
      }
    }
    // the service roads round the tower base and the small equipment buildings by the legs (real footprints)
    loose(g, (L2, w) => { drape(L2.p({c:'#6e6f71', lk:0.1}), gy, HIDDEN.sutrotower || [], 5.0, 0.25);
      if (gy.real) for (const [P, h] of [[[[-27.8, -0.4], [-27.8, -3.2], [-18.5, -3.2], [-18.5, -0.3]], 9.5], [[[4.4, -28.7], [15.8, -31.3], [16.8, -26.7], [6.5, -24.3], [6.0, -26.7], [4.9, -26.4]], 3.0], [[[5.2, 23.2], [7.5, 22.5], [9.1, 28.1], [6.8, 28.8]], 3.0]]){
        const lo = minGY(gy, P) - 0.6, hi = Math.max(...P.map(q => gy(q[0], q[1]))); LPoly(w, P, lo, hi + h - lo, '#b9b7b0'); } });
    // aviation lights: mast tops, crossarm ends, platform corners (flashing red, in sync)
    const AL = [];
    for (let k = 0; k < 3; k++){ const c = P(k, 230); AL.push(c[0], k === 0 ? 298.4 : 296.6, c[2]); }
    for (let k = 0; k < 3; k++){ const a = P(k, 230), b = P((k + 1) % 3, 230), dx = b[0] - a[0], dz = b[2] - a[2], L = Math.hypot(dx, dz); AL.push(a[0] - dx/L*13.6, 233.3, a[2] - dz/L*13.6, b[0] + dx/L*13.6, 233.3, b[2] + dz/L*13.6); }
    for (const y of [55, 114.5, 167.8]) for (let k = 0; k < 3; k++){ const p = P(k, y); AL.push(p[0]*1.12, y + 1.2, p[2]*1.12); bx(av, p[0]*1.12 - 0.35, p[0]*1.12 + 0.35, y + 0.6, y + 1.3, p[2]*1.12 - 0.35, p[2]*1.12 + 0.35); }
    lampPts(g, AL, [1, 0.12, 0.06], 34, true);
    B.flush(g); return g; }};


// ======================================================================================================================
// PALACE OF FINE ARTS (Bernard Maybeck, 1915 Panama-Pacific Exposition; rebuilt in concrete 1964-74): the open octagonal
// rotunda (dome 49.4 m) on eight piers with pairs of russet Corinthian columns on high podiums, the attic with its relief
// panels and figure groups; the two Corinthian colonnades curving round the lagoon, broken by "pylons" whose planter boxes
// carry the weeping maidens at their corners; the long curved exhibition hall behind (outer arc ~340 m, 41 m deep,
// 15-17 m) screened by redwoods. The lagoon itself is the map's water (level 1.67 m); at night the warm floodlights and
// their reflections in it.
// Local axes: +x = the lagoon (ENE), z along the chord (+z = SSE); origin = rotunda centre. Plans traced from OSM.
// ======================================================================================================================
LANDMARKS.palacefa = {zh:'艺术宫', en:'Palace of Fine Arts', cat:'old', r:150, h:50,
  lt:{m:0, c:'#ffc98c', k:1.15, e:0.55},
  build(){
    const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng, gy = siteGY('palacefa');
    const BU = '#d8c2a0', BL = '#e3d1b2', BD = '#bfa784', RU = {c:'#9c4f3a', lk:0.8}, DO = {c:'#c49a76', lk:0.9}, K = '#3a342e', FG = '#cdb796',
      GR = {c:'#3f5a36', lk:0.2}, TT = '#5b4b3b', TC = {c:'#2f4a32', lk:0.12}, BC = {c:'#55703f', lk:0.15}, RF = {c:'#a69a86', lk:0.4},
      RFX = {c:'#8fa8b0', glow:'#ffb15a', gk:1.3, op:0.45, m:0, lk:0}, HB = {c:'#d8c2a0', lk:0.4};
    const bu = B.p(BU), bl = B.p(BL), bd = B.p(BD), ru = B.p(RU), dm = B.p(DO), dk = B.p(K), fg = B.p(FG), gr = B.p(GR), tt = B.p(TT), tc = B.p(TC), bc = B.p(BC), rf = B.p(RF), RB = mkB(), rfx = RB.p(RFX);
    const G0 = Math.min(0, gy(0, 0));                               // the grounds (flat, ~1.4 m above the sea)
    const WL = gy.real ? 1.67 + 0.07 - LMCTX.u.base.value : G0 + 0.3;   // just above the lagoon's surface (the map's water body at 1.67 m)
    // ---------------- the rotunda ----------------
    { const Y = G0;
      latheP(bd, [[24.5, Y - 1.0], [24.5, Y + 0.6], [0.01, Y + 0.6]], 0, 0, 8, PI/8);         // floor platform (octagon)
      for (let k = 0; k < 8; k++){
        const ph = (22.5 + 45*k)*PI/180, cr = Math.cos(ph), sr = Math.sin(ph), ct = -sr, st = cr;
        const P2 = (r, t) => [cr*r + ct*t, sr*r + st*t];
        // pier (trapezoid in plan) up to the entablature
        const pp = [P2(21.8, -4.8), P2(27.0, -5.0), P2(27.0, 5.0), P2(21.8, 4.8)];
        wallsP(bu, pp, Y, Y + 25); capP(bu, pp, Y + 25);
        // podium, the pair of russet columns, entablature block, attic pedestal with its figure group
        const pod = [P2(26.8, -3.4), P2(32.0, -3.4), P2(33.4, 0), P2(32.0, 3.4), P2(26.8, 3.4)];
        wallsP(bd, pod, Y - 0.5, Y + 5.2); capP(bd, pod, Y + 5.2);
        for (const tq of [-1.55, 1.55]){ const c = P2(29.2, tq); segP(ru, [c[0], Y + 6.0, c[1]], [c[0], Y + 21.0, c[1]], 0.85, 10, 0.75);
          latheP(bl, [[1.15, Y + 5.2], [1.0, Y + 6.0]], c[0], c[1], 8); latheP(bl, [[0.8, Y + 21.0], [1.25, Y + 22.2], [1.35, Y + 22.4]], c[0], c[1], 8); }
        const ent = [P2(26.4, -3.4), P2(31.6, -3.4), P2(31.6, 3.4), P2(26.4, 3.4)];
        wallsP(bl, ent, Y + 22.4, Y + 25.2); capP(bl, ent, Y + 25.2);
        const att = [P2(26.4, -2.9), P2(30.8, -2.9), P2(30.8, 2.9), P2(26.4, 2.9)];
        wallsP(bu, att, Y + 25.2, Y + 31.6); capP(bu, att, Y + 31.6);
        for (const tq of [-1.5, 0, 1.5]){ const c = P2(29.0, tq), hh = tq ? 3.2 : 4.0;
          latheP(fg, [[0.55, Y + 31.6], [0.45, Y + 31.6 + hh*0.55], [0.3, Y + 31.6 + hh*0.8], [0.32, Y + 31.6 + hh*0.9], [0.01, Y + 31.6 + hh]], c[0], c[1], 6); }
        // the arched side (octagon face) between this pier and the next, at 45 deg further on
        const th = (45*(k + 1))*PI/180, cx = Math.cos(th), sx = Math.sin(th), tx = -sx, tz = cx;
        const hw = 4.6, F = fc(cx*22.6 - tx*hw, sx*22.6 - tz*hw, cx*22.6 + tx*hw, sx*22.6 + tz*hw), Fo = (F.nx*cx + F.nz*sx) > 0 ? F : fc(cx*22.6 + tx*hw, sx*22.6 + tz*hw, cx*22.6 - tx*hw, sx*22.6 - tz*hw);
        farcade(bu, Fo, 0, Fo.L, 1, Y, Y + 15.6, Y + 25.0, 0.6, -1.0, 1.0, 10);
        farcade(bl, Fo, 0.6, Fo.L - 0.6, 1, Y, Y + 15.6, Y + 16.4, 0.2, 1.0, 1.25, 10);
      }
      // attic ring with the eight relief panels, cornice; the drum and the coffered dome
      latheP(bu, [[22.6, Y + 25.0], [22.6, Y + 34.0], [23.4, Y + 34.4], [23.4, Y + 35.0], [17.4, Y + 35.0]], 0, 0, 8, PI/8);
      latheP(bu, [[17.6, Y + 35.0], [17.6, Y + 25.0], [22.6, Y + 25.0]], 0, 0, 8, PI/8);
      latheP(bl, [[23.0, Y + 24.6], [23.0, Y + 25.4], [22.6, Y + 25.4]], 0, 0, 8, PI/8);
      for (let k = 0; k < 8; k++){ const th = (45*k)*PI/180, c = Math.cos(th), s2 = Math.sin(th), a0 = [c*22.65 - s2*6.4, s2*22.65 + c*6.4], a1 = [c*22.65 + s2*6.4, s2*22.65 - c*6.4];
        const F = fc(a0[0], a0[1], a1[0], a1[1]), Fo = (F.nx*c + F.nz*s2) > 0 ? F : fc(a1[0], a1[1], a0[0], a0[1]);
        fbx(fg, Fo, 0.8, Fo.L - 0.8, Y + 27.0, Y + 33.0, 0, 0.25); for (let i = 0; i < 5; i++) fbx(bd, Fo, 1.6 + i*2.0, 2.6 + i*2.0, Y + 27.8, Y + 31.6 + (i % 2)*0.8, 0.25, 0.55); }
      latheP(bu, [[17.8, Y + 35.0], [17.8, Y + 37.2], [17.2, Y + 37.6]], 0, 0, 16);
      const DP = [[16.9, Y + 37.6], [16.6, Y + 40.2], [15.4, Y + 43.4], [13.2, Y + 46.0], [10.0, Y + 48.0], [6.0, Y + 49.1], [2.2, Y + 49.4], [0.01, Y + 49.45]];
      latheP(dm, DP, 0, 0, 24);
      for (let i = 0; i < 12; i++){ const a = i/12*TAU, ca = Math.cos(a), sa = Math.sin(a);
        for (let k = 0; k < DP.length - 2; k++){ const p = DP[k], q = DP[k + 1]; segP(bd, [ca*(p[0] + 0.06), p[1], sa*(p[0] + 0.06)], [ca*(q[0] + 0.06), q[1], sa*(q[0] + 0.06)], 0.2, 4); } }
      for (const [r, y] of [[16.25, Y + 41.0], [14.6, Y + 44.4]]) latheP(bd, [[r + 0.15, y], [r + 0.15, y + 0.5]], 0, 0, 24);
      latheP(bl, [[1.5, Y + 49.3], [1.0, Y + 50.0], [0.01, Y + 50.3]], 0, 0, 8);
    }
    // ---------------- the colonnades: two rows of Corinthian columns under an open entablature, broken by pylons ----------------
    const COLH = 13.2, ENT = 2.4;
    const pylon = (px, pz, ang, half, maid) => { const Y = G0, c = Math.cos(ang), s2 = Math.sin(ang), R = (u, v) => [px + c*u - s2*v, pz + s2*u + c*v];
      for (const [u, v] of [[-half, -half], [half, -half], [half, half], [-half, half]]){ const q = R(u, v); col(bl, bl, q[0], q[1], Y + 0.4, Y + 1.2 + COLH, 0.75, 8); }
      rbx(bu, px, pz, 2*half + 2.2, 2*half + 2.2, Y + 1.2 + COLH, Y + 1.2 + COLH + ENT, -ang);
      rbx(bl, px, pz, 2*half + 2.6, 2*half + 2.6, Y + 1.2 + COLH + ENT - 0.4, Y + 1.2 + COLH + ENT, -ang);
      rbx(bd, px, pz, 2*half + 1.4, 2*half + 1.4, Y - 0.6, Y + 0.4, -ang);
      if (!maid) return;
      // the planter box with the weeping maidens at its corners, greenery on top
      const yb = Y + 1.2 + COLH + ENT, bh = 4.0, bw = 2*half + 0.6;
      rbx(bu, px, pz, bw, bw, yb, yb + bh, -ang); rbx(bl, px, pz, bw + 0.5, bw + 0.5, yb + bh - 0.3, yb + bh + 0.15, -ang);
      latheP(bc, [[bw*0.62, yb + bh + 0.1], [bw*0.5, yb + bh + 0.9], [0.01, yb + bh + 1.3]], px, pz, 6, ang + PI/4);
      for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]){ const q = R(u*(bw/2 + 0.45), v*(bw/2 + 0.45));
        latheP(fg, [[0.62, yb], [0.55, yb + 1.3], [0.4, yb + 2.4], [0.3, yb + 2.7], [0.34, yb + 2.95], [0.01, yb + 3.25]], q[0], q[1], 6); }
    };
    const run = (A, Bp, ha, hb) => {                     // columns and entablature from pylon A to pylon B (straight)
      const dx = Bp[0] - A[0], dz = Bp[1] - A[1], L = Math.hypot(dx, dz), ux = dx/L, uz = dz/L, nx = -uz, nz = ux, Y = G0;
      const s0 = ha < 0 ? 3.6 : ha + 2.0, s1 = hb < 0 ? L : L - hb - 2.0, n = Math.max(1, Math.round((s1 - s0)/3.7));
      for (let i = 0; i <= n; i++){ const sd = s0 + (s1 - s0)*i/n; for (const o of [-1.45, 1.45]) col(bl, bl, A[0] + ux*sd + nx*o, A[1] + uz*sd + nz*o, Y + 0.4, Y + 1.2 + COLH, 0.62, 8); }
      const yb = Y + 1.2 + COLH, ang = Math.atan2(dz, dx);
      for (const o of [-1.45, 1.45]){ const cx = A[0] + ux*L/2 + nx*o, cz = A[1] + uz*L/2 + nz*o; rbx(bu, cx, cz, L, 1.7, yb, yb + ENT, -ang); rbx(bl, cx, cz, L, 2.1, yb + ENT - 0.35, yb + ENT, -ang); }
      for (let i = 0; i <= n; i++){ const sd = s0 + (s1 - s0)*i/n; rbx(bu, A[0] + ux*sd, A[1] + uz*sd, 0.6, 2.9, yb + 0.5, yb + ENT - 0.3, -ang); }
      rbx(bd, A[0] + ux*L/2, A[1] + uz*L/2, L, 4.6, Y - 0.6, Y + 0.4, -ang);
    };
    for (const sg of [1, -1]){
      // the colonnade's centre line (traced from the OSM band); HF = pylon half-size (0 = a bend without a pylon)
      const CH = [[-28.8, 31.2, 2.4], [-25.4, 39.5, 0], [-19.2, 50.8, 2.4], [-11.8, 61.2, 0], [-5.6, 68.0, 2.4], [2.3, 74.0, 0], [14.5, 79.3, 2.4], [22.7, 76.6, 2.4], [33.0, 77.8, 2.6], [31.2, 106.3, 2.8]];
      const P = CH.map(p => [p[0], p[1]*sg]), HF = CH.map(p => p[2]);
      for (let i = 0; i < P.length - 1; i++) run(P[i], P[i + 1], HF[i] ? HF[i] + 0.6 : -1.85, HF[i + 1] ? HF[i + 1] + 0.6 : -1.85);
      for (let i = 0; i < P.length; i++){ if (!HF[i]) continue; const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)]; pylon(P[i][0], P[i][1], Math.atan2(b[1] - a[1], b[0] - a[0]), HF[i], true); }
      latheP(bu, [[2.5, G0 - 0.5], [2.5, G0 + 1.4], [1.6, G0 + 2.0], [1.2, G0 + 3.2], [1.7, G0 + 4.0], [0.01, G0 + 4.0]], -30.2, 26.8*sg, 10);   // round end planter
      pylon(14.2, 104.8*sg, 0, 3.0, true);                                                                                 // the free-standing pylon
      // floodlight glow reflected in the lagoon in front of the colonnade
      for (const i of [2, 4, 6, 7]){ const q = P[i], d = Math.hypot(q[0], q[1]), ux = q[0]/d, uz = q[1]/d, x0 = q[0] - ux*3, z0 = q[1] - uz*3;
        Q(rfx, [x0 - uz*1.2, WL, z0 + ux*1.2], [x0 + uz*1.2, WL, z0 - ux*1.2], [x0 - ux*24 + uz*1.8, WL, z0 - uz*24 - ux*1.8], [x0 - ux*24 - uz*1.8, WL, z0 - uz*24 + ux*1.8]); }
    }
    // the rotunda's reflection (warm streaks across the water towards the east shore)
    for (let i = -4; i <= 4; i++){ const z = i*3.6, w = 1.2 + (4 - Math.abs(i))*0.15, L = 34 - Math.abs(i)*2.5;
      Q(rfx, [26, WL, z - w], [26, WL, z + w], [26 + L, WL, z + w*1.4], [26 + L, WL, z - w*1.4]); }
    // ---------------- the exhibition hall ----------------
    { const Y = G0;
      const HALL = [[-93.2, -25.3], [-88.2, -46.6], [-84.9, -55.6], [-80.6, -65.5], [-75.4, -76.2], [-69.9, -85.2], [-62.4, -95.9], [-56, -103.7], [-46.9, -113.2], [-40.5, -119], [-33.4, -124.6], [-24.4, -130.9], [-21.4, -126.2], [-20.8, -126.7], [-3.7, -100.2], [-4.4, -99.8], [-2, -96.2], [-6.3, -92.9], [-17.4, -83], [-25.2, -74.5], [-31.7, -65.9], [-41.2, -50.9], [-44.7, -42.7], [-48.3, -31], [-50.8, -20.1], [-52.1, -11.4], [-52.4, -1.5], [-52.1, 7.8], [-51, 18], [-49.2, 26.8], [-46.5, 36.4], [-43.1, 45.2], [-38.9, 53.8], [-35.9, 59.2], [-29.3, 69], [-24.5, 75.1], [-17.6, 82.5], [-10, 89.1], [-1.6, 94.8], [-4.9, 99.9], [-4, 100.5], [-20.5, 126.6], [-21, 126.3], [-23.6, 130.5], [-29.9, 126.7], [-36.5, 121.9], [-51.2, 108.4], [-57.7, 101.3], [-65.6, 91.4], [-70.8, 83.7], [-79.8, 67], [-87.5, 48], [-90.7, 37.7], [-92.8, 28.1], [-95.1, 6.3], [-95.3, -4.8], [-94.7, -14.2]];
      const BAND = [[-76, -21.7], [-72.8, -37.9], [-66.6, -54.8], [-58.1, -70.6], [-46.1, -87.7], [-35.1, -100], [-23.5, -109.8], [-14, -116.3], [-10.2, -110.2], [-17.9, -104.5], [-29.5, -94.7], [-40.1, -82.4], [-51, -67.7], [-59.7, -52.7], [-66.7, -35.6], [-69.1, -20.8], [-70.7, -4.2], [-70, 10.8], [-68.1, 25.2], [-64.2, 40.7], [-58.6, 55.7], [-52.4, 67.2], [-44.2, 79.3], [-35.8, 89.5], [-28.1, 97.3], [-19.5, 104.7], [-10.5, 110.8], [-14.4, 117], [-32.2, 104.1], [-39.5, 96.8], [-49.3, 85.1], [-59.2, 72.2], [-66.2, 58], [-71.1, 43.1], [-74.9, 26], [-77, 11.1], [-77.9, -4.7]];
      const ENDS = [[[-24.4, -130.9], [-15, -136.9], [-8.7, -127.1], [-16.5, -122.1], [-6, -105.8], [0.5, -109.8], [6.6, -100.6], [-1.5, -95.5], [-4.4, -99.8], [-3.7, -100.2], [-20.8, -126.7], [-21.4, -126.2]],
                    [[-23.6, 130.5], [-21, 126.3], [-20.5, 126.6], [-4, 100.5], [-4.9, 99.9], [-1.3, 94.2], [7.5, 99.6], [1.3, 109.5], [-5.1, 105.5], [-16, 122.8], [-8.8, 127.1], [-14.5, 136.2]]];
      const PORCH = [[[-16.5, -122.1], [-11.3, -125.5], [-0.8, -108.9], [-6, -105.8]], [[-16, 122.8], [-5.1, 105.5], [-0.2, 108.7], [-10.9, 126]]];
      LPoly(g, HALL, Y - 1.5, 16.4, HB); LPoly(g, HALL, Y + 14.9, 0.25, RF);
      LPoly(g, BAND, Y + 14.9, 2.3, HB); LPoly(g, BAND, Y + 17.15, 0.2, RF);
      for (const E of ENDS){ LPoly(g, E, Y - 1.5, 18.5, HB); LPoly(g, E, Y + 16.9, 0.2, RF); }
      for (const P of PORCH){ LPoly(g, P, Y - 0.5, 5.6, BL); }
      { const ST = [[-90.0, 52.3], [-86.4, 51.2], [-84.0, 57.2], [-88.0, 58.5]]; LPoly(g, ST, Y - 1.0, 21.0, HB); LPoly(g, ST.map(p => [p[0]*1.004, p[1]*1.004]), Y + 19.6, 0.6, BL); }   // the stack on the outer wall (OSM, 20 m)
      // inner (lagoon) face: pilasters, a cornice, tall doors; outer face: pilasters and cornice
      const INNER = HALL.slice(16, 39).reverse(), OUTER = HALL.slice(0, 11).reverse().concat(HALL.slice(44).reverse()).reverse();
      const facade = (PL, doors) => { for (let i = 0; i < PL.length - 1; i++){ const F = fc(PL[i][0], PL[i][1], PL[i + 1][0], PL[i + 1][1]);
        fbx(bl, F, -0.1, F.L + 0.1, Y + 13.2, Y + 14.1, -0.02, 0.7); fbx(bd, F, -0.1, F.L + 0.1, Y - 0.5, Y + 1.0, -0.02, 0.35);
        const n = Math.max(1, Math.round(F.L/6.5)); for (let k = 0; k <= n; k++){ const u = k*F.L/n; fbx(bl, F, u - 0.5, u + 0.5, Y + 1.0, Y + 13.2, -0.02, 0.45); }
        if (doors && i % 3 === 1){ const u = F.L/2; fbx(bl, F, u - 2.6, u + 2.6, Y, Y + 9.8, -0.02, 0.6); frect(dk, F, u - 1.8, u + 1.8, Y, Y + 7.2, 0.62); fped(bl, null, F, u - 3.0, u + 3.0, Y + 9.8, 1.6, 0, 0.6); } } };
      facade(INNER, true); facade(OUTER, false);
      // the redwoods planted against the hall's lagoon side (1968) and trees round the grounds
      for (let i = 0; i < INNER.length - 1; i++){ const a = INNER[i], b = INNER[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = (b[1] - a[1])/L, nz = -(b[0] - a[0])/L;
        for (let sd = 2.5; sd < L; sd += 6.0 + rng()*2){ const off = 4.5 + rng()*3.5, x = a[0] + (b[0] - a[0])*sd/L - nx*off, z = a[1] + (b[1] - a[1])*sd/L - nz*off;
          if (Math.abs(z) < 34 && x > -60) continue; conifer(tt, tc, x, Y, z, 16 + rng()*9, 2.6 + rng()*1.2, rng); } }
    }
    // trees on the lawns between the hall, the colonnades and the lagoon
    for (const [x, z, sc] of [[-40, -10, 1.6], [-42, 12, 1.5], [-36, -30, 1.4], [-35, 30, 1.5], [-12, -92, 1.3], [-12, 95, 1.3], [40, -92, 1.4], [42, 95, 1.3], [-46, 0, 1.4]]) treeP(tt, gr, x, G0, z, sc, rng);
    loose(g, L2 => { drape(L2.p({c:'#d9d1bf', lk:0.15}), gy, HIDDEN.palacefa || [], 2.6, 0.06); const o = L2.p(RFX); for (let i = 0; i < rfx.length; i++) o.push(rfx[i]); });
    // lamps: uplights at the pylons and round the rotunda (warm), path lamps by the lagoon
    { const LP = []; for (let k = 0; k < 8; k++){ const a = (22.5 + 45*k)*PI/180; LP.push(Math.cos(a)*33, G0 + 0.8, Math.sin(a)*33); }
      for (const sg of [1, -1]) for (const [x, z] of [[-24, 40], [-12, 60], [4, 74], [22, 84], [36, 92], [36, 104]]) LP.push(x, G0 + 3.2, z*sg);
      lampPts(g, LP, [1, 0.78, 0.5], 7, false); }
    B.flush(g); return g; }};


// ======================================================================================================================
// GRACE CATHEDRAL (Nob Hill, 1928-64; Lewis P. Hobart after Bodley/Hare): French Gothic in reinforced concrete, 100 m
// long, 49 m across the transepts; twin towers 53 m above the street at the east front on Taylor St (the Ghiberti
// doors, the rose window above them), aisled nave with buttresses and flying buttresses, transepts, the polygonal apse,
// the slender crossing flèche 75 m above the street. The entry floor is 6.1 m above the street: a terrace and steps.
// Night: floodlit, the rose window glowing.
// Local axes: +x = east (the towers), -x = the apse; origin on the nave axis.
// ======================================================================================================================
LANDMARKS.gracecathedral = {zh:'恩典座堂', en:'Grace Cathedral', cat:'old', r:64, h:76,
  lt:{m:0, c:'#ffe7c6', k:1.1, e:0.5},
  build(){
    const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng, gy = siteGY('gracecathedral');
    const W = '#cfc9bd', T = '#bdb6a8', K = '#2a2f37', L = {c:'#3b342d', glow:'#ffc77d', gk:0.55}, RS = {c:'#3a2f45', glow:'#ffb468', gk:1.2},
      R = {c:'#5f6966', lk:0.35}, CU = {c:'#6c8279', lk:0.5}, GD = {c:'#c79a3c', lk:0.9}, ST = '#a59e90';
    const w = B.p(W), t = B.p(T), dk = B.p(K), lit = B.p(L), rs = B.p(RS), rf = B.p(R), cu = B.p(CU), gd = B.p(GD), st = B.p(ST);
    const gS = Math.min(0, gy(52, 0)), F = Math.min(0, gS + 6.1);    // street in front of the towers; the entry floor 6.1 m above it
    // terrace (podium) under the whole church, down to the lowest ground, and the steps to the doors
    { const lo = Math.min(F, minGY(gy, [[-50, -14], [-50, 14], [-20, -24], [-20, 22], [47, -15], [47, 15], [0, 0], [30, 14], [30, -14]])) - 2.0;
      bx(st, -21.3, 48.5, lo, F + 0.3, -14.6, 14.6); bx(st, -50.0, -21.3, lo, F + 0.3, -9.8, 9.8); bx(st, -21.3, -6.3, lo, F + 0.3, -23.8, 22.2);
      const n = Math.max(2, Math.min(30, Math.ceil((F - gS)/0.17)));
      for (let k = 0; k < n; k++) bx(st, 48.5, 48.5 + (k + 1)*0.4, lo, F + 0.3 - (k + 1)*(F - gS)/n + 0.02, -12.5 - k*0.05, 12.5 + k*0.05);
      bx(st, 48.5, 48.5 + n*0.4, F - 0.2 - (F - gS)*0.5, F + 1.0 - (F - gS)*0.5 + 0.2, -13.3, -12.5); bx(st, 48.5, 48.5 + n*0.4, F - 0.2 - (F - gS)*0.5, F + 1.0 - (F - gS)*0.5 + 0.2, 12.5, 13.3); }
    const Y0 = F + 0.3, AE = Y0 + 15.0, CE = Y0 + 27.0, NR = 7.0, zc = 6.3, za = 13.4;
    const butt = (Fc, u, h, p, pin) => { fbx(t, Fc, u - 0.55, u + 0.55, Y0, h - 1.4, 0, p); fbx(t, Fc, u - 0.55, u + 0.55, h - 1.4, h, 0, p*0.55);
      if (pin){ const c = fp(Fc, u, 0, p*0.35); latheP(w, [[0.55, h], [0.5, h + 1.4], [0.01, h + 4.2]], c[0], c[2], 4, PI/4); } };
    // ---- nave (x -40 .. 34.6) and chancel: clerestory, aisles with lean-to roofs, buttresses, flyers, lancets ----
    for (const [x0, x1, zA] of [[-40.5, -21.0, 9.0], [-6.6, 34.6, za]]){
      bx(w, x0, x1, Y0, CE, -zc, zc); bx(w, x0, x1, Y0, AE, -zA, -zc); bx(w, x0, x1, Y0, AE, zc, zA);
      for (const s2 of [-1, 1]) Q(rf, [x0, AE, s2*(zA + 0.4)], [x1, AE, s2*(zA + 0.4)], [x1, AE + 3.4, s2*zc], [x0, AE + 3.4, s2*zc]);
      const nb = Math.max(1, Math.round((x1 - x0)/6.9));
      for (const s2 of [-1, 1]){
        const Fa = s2 > 0 ? fc(x0, zA, x1, zA) : fc(x1, -zA, x0, -zA), Fc = s2 > 0 ? fc(x0, zc, x1, zc) : fc(x1, -zc, x0, -zc);
        for (let k = 0; k <= nb; k++){ const u = Fa.L*k/nb; butt(Fa, u, AE + 3.0, 1.8, true);
          // flying buttress from the aisle buttress to the clerestory wall
          const a = fp(Fa, u, AE + 2.4, 1.2), b = fp(Fc, s2 > 0 ? u : Fa.L - u, CE - 4.2, 0.2); segP(t, a, b, 0.42, 4); segP(t, [a[0], a[1] + 1.6, a[2]], [b[0], b[1] + 1.0, b[2]], 0.28, 4); }
        for (let k = 0; k < nb; k++){ const u = Fa.L*(k + 0.5)/nb; flancet(rng() < 0.45 ? lit : dk, Fa, u, Y0 + 3.2, 2.0, AE - 3.6, 0.05);
          const uc = s2 > 0 ? u : Fa.L - u; flancet(rng() < 0.5 ? lit : dk, Fc, uc - 1.05, AE + 4.2, 1.5, CE - 4.4, 0.05); flancet(rng() < 0.5 ? lit : dk, Fc, uc + 1.05, AE + 4.2, 1.5, CE - 4.4, 0.05); }
        fbx(t, Fa, -0.1, Fa.L + 0.1, AE - 0.5, AE, -0.02, 0.4); fbx(t, Fc, -0.1, Fc.L + 0.1, CE - 0.6, CE, -0.02, 0.5);
        for (let u = 0.6; u < Fc.L - 0.3; u += 1.2) fbx(t, Fc, u, u + 0.5, CE, CE + 0.8, -0.1, 0.3);        // parapet
      }
    }
    gabR(rf, w, -40.5, 34.6, -zc - 0.3, zc + 0.3, CE, NR, 'x', 0.2);
    bx(w, -21.0, -6.6, Y0, CE, -zc, zc);
    // ---- transepts with their gable fronts, rose windows and portals ----
    for (const s2 of [-1, 1]){
      const zo = s2 > 0 ? 21.1 : -22.4, xa = -20.2, xb = -7.4, lo = Math.min(zo, s2*zc), hi = Math.max(zo, s2*zc);
      bx(w, xa, xb, Y0, CE, lo, hi); gabR(rf, w, xa - 0.3, xb + 0.3, lo, hi, CE, NR, 'z', 0.2);
      const Fe = s2 > 0 ? fc(xa, zo, xb, zo) : fc(xb, zo, xa, zo), m = Fe.L/2;
      fdisc(t, Fe, m, CE - 6.0, 4.0, 0.08, 20); fdisc(rs, Fe, m, CE - 6.0, 3.5, 0.12, 20);
      flancet(dk, Fe, m, Y0, 3.4, Y0 + 6.6, 0.06, 6); fbx(t, Fe, m - 2.6, m + 2.6, Y0, Y0 + 9.6, -0.02, 0.7); flancet(dk, Fe, m, Y0, 3.0, Y0 + 6.2, 0.74, 6);
      for (const u of [m - 3.8, m + 3.8]) flancet(rng() < 0.5 ? lit : dk, Fe, u, Y0 + 11.0, 1.6, Y0 + 15.5, 0.06);
      for (const u of [0.2, Fe.L - 0.2]){ butt(Fe, u, CE + 1.0, 2.2, true); }
      for (const Fs of [fc(xb, Math.max(lo, hi) * (s2 > 0 ? 1 : 0) + Math.min(lo, hi)*(s2 > 0 ? 0 : 1), xb, s2 > 0 ? lo : hi)]) {}
      for (const [xs, dir] of [[xb, 1], [xa, -1]]){ const Fs = dir > 0 ? fc(xs, hi, xs, lo) : fc(xs, lo, xs, hi);
        for (let k = 0; k < 2; k++) flancet(rng() < 0.4 ? lit : dk, Fs, Fs.L*(0.3 + k*0.4), Y0 + 4, 1.8, CE - 6.0, 0.05); }
    }
    // ---- apse: half dodecagon round (-40.5, 0), ambulatory and chapels lower, buttresses with pinnacles ----
    { const ax = -40.5, n = 6, AR = 6.3, AR2 = 9.0;
      const P1 = [], P2 = []; for (let i = 0; i <= n; i++){ const a = HP + PI*i/n; P1.push([ax + Math.cos(a)*AR, Math.sin(a)*AR]); P2.push([ax + Math.cos(a)*AR2, Math.sin(a)*AR2]); }
      for (let i = 0; i < n; i++){ const a = P1[i], b = P1[i + 1], c = P2[i], d = P2[i + 1];
        Q(w, [a[0], Y0, a[1]], [b[0], Y0, b[1]], [b[0], CE, b[1]], [a[0], CE, a[1]]); Q(w, [c[0], Y0, c[1]], [d[0], Y0, d[1]], [d[0], AE, d[1]], [c[0], AE, c[1]]);
        Q(rf, [c[0], AE, c[1]], [d[0], AE, d[1]], [b[0], AE + 3.4, b[1]], [a[0], AE + 3.4, a[1]]);
        T3(rf, [ax, CE + NR, 0], [a[0], CE, a[1]], [b[0], CE, b[1]]);
        const Fa = fc(d[0], d[1], c[0], c[1]), Fc = fc(b[0], b[1], a[0], a[1]);
        flancet(rng() < 0.5 ? lit : dk, Fa, Fa.L/2, Y0 + 3.0, 1.6, AE - 3.4, 0.05); flancet(rng() < 0.5 ? lit : dk, Fc, Fc.L/2, AE + 4.0, 1.6, CE - 4.4, 0.05);
        const pc = P2[i], ang = Math.atan2(pc[1], pc[0] - ax), Fb = fc(pc[0] - Math.sin(ang)*0.6, pc[1] + Math.cos(ang)*0.6, pc[0] + Math.sin(ang)*0.6, pc[1] - Math.cos(ang)*0.6);
        if (i > 0){ const Fo = (Fb.nx*Math.cos(ang) + Fb.nz*Math.sin(ang)) > 0 ? Fb : fc(pc[0] + Math.sin(ang)*0.6, pc[1] - Math.cos(ang)*0.6, pc[0] - Math.sin(ang)*0.6, pc[1] + Math.cos(ang)*0.6); butt(Fo, 0.6, AE + 3.0, 1.6, true); }
      }
    }
    // ---- the east front: twin towers, the central portal (gilded doors), the rose window, gallery and gable ----
    const TT = Math.min(Y0 + 52, gS + 53.0), FX = 45.4;
    for (const s2 of [-1, 1]){
      const z0 = s2 > 0 ? 5.15 : -13.45, z1 = s2 > 0 ? 13.6 : -5.15, x0 = 34.6, x1 = FX, cz = (z0 + z1)/2, R4 = rectF(x0, x1, z0, z1);
      bx(w, x0, x1, Y0, TT, z0, z1);
      for (const Fx of [R4.r, s2 > 0 ? R4.f : R4.b]){ const m = Fx.L/2;
        fbx(t, Fx, -0.2, Fx.L + 0.2, Y0 + 19.0, Y0 + 19.6, -0.02, 0.4); fbx(t, Fx, -0.2, Fx.L + 0.2, TT - 13.5, TT - 12.9, -0.02, 0.4);
        if (Fx === R4.r){ flancet(dk, Fx, m, Y0, 3.2, Y0 + 6.6, 0.06, 6); fbx(t, Fx, m - 2.4, m + 2.4, Y0, Y0 + 9.0, -0.02, 0.6); flancet(dk, Fx, m, Y0, 2.6, Y0 + 6.2, 0.64, 6); }
        flancet(rng() < 0.5 ? lit : dk, Fx, m, Y0 + 11.0, 2.0, Y0 + 16.4, 0.06);
        flancet(dk, Fx, m - 1.35, TT - 11.8, 1.9, TT - 3.6, 0.06); flancet(dk, Fx, m + 1.35, TT - 11.8, 1.9, TT - 3.6, 0.06);
        for (let y = TT - 11.0; y < TT - 3.4; y += 0.9) fbx(t, Fx, m - 2.25, m + 2.25, y, y + 0.18, 0.06, 0.22);       // louvres
        fbx(t, Fx, -0.3, Fx.L + 0.3, TT - 1.4, TT - 0.6, -0.02, 0.6);
        for (let u = 0.3; u < Fx.L - 0.3; u += 1.1) fbx(w, Fx, u, u + 0.55, TT - 0.6, TT + 1.0, -0.2, 0.3); }
      // angle buttresses in three set-offs and corner pinnacles
      for (const [px, pz] of [[x1, z0], [x1, z1], [x0, s2 > 0 ? z1 : z0]]){
        bx(t, px - 1.0, px + 1.0, Y0, Y0 + 19.0, pz - 1.0, pz + 1.0); bx(t, px - 0.8, px + 0.8, Y0 + 19.0, TT - 13.0, pz - 0.8, pz + 0.8); bx(t, px - 0.6, px + 0.6, TT - 13.0, TT - 1.0, pz - 0.6, pz + 0.6);
        latheP(w, [[0.75, TT - 1.0], [0.7, TT + 1.6], [0.01, TT + 5.0]], px, pz, 4, PI/4); }
      latheP(w, [[0.75, TT - 1.0], [0.7, TT + 1.6], [0.01, TT + 5.0]], x0 + 0.6, s2 > 0 ? z0 + 0.6 : z1 - 0.6, 4, PI/4);
    }
    { const Fm = fc(FX, 5.15, FX, -5.15), m = Fm.L/2;
      bx(w, 34.6, FX, Y0, CE + 2.0, -5.2, 5.2);
      fbx(w, Fm, m - 5.0, m + 5.0, Y0, Y0 + 12.5, -0.02, 1.8);               // the portal block (to 47.2 m)
      for (let k = 0; k < 4; k++) flancet(k % 2 ? w : t, Fm, m, Y0 + 0.0, 6.6 - k*0.9, Y0 + 6.4 - k*0.25, 1.83 + k*0.04, 8);
      flancet(gd, Fm, m, Y0, 3.2, Y0 + 5.4, 2.0, 8); frect(t, Fm, m - 0.08, m + 0.08, Y0, Y0 + 5.4, 2.03);
      fped(w, t, Fm, m - 5.0, m + 5.0, Y0 + 12.5, 3.2, 0, 1.8);
      fdisc(t, Fm, m, Y0 + 21.2, 4.6, 0.12, 24); fdisc(rs, Fm, m, Y0 + 21.2, 4.0, 0.2, 24);
      for (let i = 0; i < 12; i++){ const a = i/12*TAU; segP(t, fp(Fm, m, Y0 + 21.2, 0.26), fp(Fm, m + Math.cos(a)*4.0, Y0 + 21.2 + Math.sin(a)*4.0, 0.26), 0.12, 3); }
      for (let u = 0.8; u < Fm.L - 0.5; u += 1.15) flancet(dk, Fm, u, CE - 1.6, 0.7, CE + 0.6, 0.06, 3);              // gallery
      fbx(t, Fm, -0.1, Fm.L + 0.1, CE + 1.4, CE + 2.0, -0.02, 0.5);
      gabR(rf, w, 34.6, FX - 0.2, -5.2, 5.2, CE + 2.0, 5.0, 'z', 0); }
    // ---- the adjoining Chapel of Grace (south, 1930, after the Sainte-Chapelle) and the cathedral offices (north): hidden real
    //      footprints rebuilt (Gothic blocks with lancets; the chapel with a steep roof, the offices with a crenellated parapet) ----
    { const CHP = [[-51.3, 14.5], [-48.2, 11.5], [-44.8, 11.7], [-44.4, 7.7], [-41.0, 9.2], [-20.4, 9.3], [-20.4, 21.1], [-48.3, 21.2], [-51.1, 18.6]];
      const OFF = [[-50.3, -30.6], [-41.8, -30.7], [-41.6, -22.7], [-20.1, -22.3], [-20.2, -8.4], [-41.2, -8.4], [-45.9, -6.0], [-50.8, -14.0], [-50.9, -21.4], [-50.2, -21.4]];
      const gc = minGY(gy, CHP) - 1.0, go = minGY(gy, OFF) - 1.0, yo = Math.min(0, Math.max(...OFF.map(p => gy(p[0], p[1])))) + 13.4, yc = Y0 + 11.0;
      LPoly(g, CHP, gc, yc - gc, W); LPoly(g, OFF, go, yo - go, W);
      gabR(rf, w, -48.3, -20.4, 11.6, 21.1, yc, 5.2, 'x', 0.2);
      latheP(rf, [[1.3, yc], [0.01, yc + 5.0]], -49.4, 16.2, 6);
      const Fs = fc(-48.3, 21.2, -20.4, 21.1); for (let k = 0; k < 6; k++){ const u = 2.4 + k*4.6; flancet(rng() < 0.5 ? lit : dk, Fs, u, Y0 + 1.5, 1.7, yc - 3.0, 0.05); fbx(t, Fs, u + 2.0, u + 2.6, gc, yc - 0.6, -0.02, 0.9); }
      const Fw = fc(-20.4, 21.1, -20.4, 9.3); flancet(dk, Fw, Fw.L/2, Y0 + 1.0, 3.0, yc - 2.4, 0.05);
      for (let i = 0; i < OFF.length; i++){ const a = OFF[i], b = OFF[(i + 1) % OFF.length], Fo = fc(b[0], b[1], a[0], a[1]); if (Fo.L < 4) continue;
        const n = Math.round(Fo.L/3.4); for (let k = 0; k < n; k++){ const u = (k + 0.5)*Fo.L/n; for (const y of [yo - 12.0, yo - 8.2, yo - 4.4]) flancet(rng() < 0.35 ? lit : dk, Fo, u, y, 1.1, y + 2.0, 0.05); }
        for (let u = 0.4; u < Fo.L - 0.3; u += 1.2) fbx(t, Fo, u, u + 0.55, yo, yo + 0.9, -0.15, 0.15); fbx(t, Fo, -0.05, Fo.L + 0.05, yo - 0.5, yo, -0.02, 0.3); }
    }
    // ---- the crossing flèche: octagonal base with gablets, open lantern stage, the slender spire (to 75 m above the street) ----
    { const cx = -13.8, top = Math.min(Y0 + 80, gS + 75.0), y0 = CE + NR - 1.0;
      latheP(cu, [[2.6, y0], [2.6, y0 + 6.0], [2.2, y0 + 6.0]], cx, 0, 8, PI/8);
      for (let i = 0; i < 8; i++){ const a = (i + 0.5)/8*TAU, x = cx + Math.cos(a)*2.45, z = Math.sin(a)*2.45; latheP(cu, [[0.5, y0 + 6.0], [0.01, y0 + 9.5]], x, z, 4, PI/4); }
      latheP(cu, [[2.0, y0 + 6.0], [1.6, y0 + 9.0], [0.9, y0 + 16], [0.25, top - 2.0], [0.01, top]], cx, 0, 8, PI/8);
      segP(gd, [cx, top - 1.2, 0], [cx, top + 0.6, 0], 0.08, 4); segP(gd, [cx, top - 0.1, -0.6], [cx, top - 0.1, 0.6], 0.07, 4); }
    B.flush(g); return g; }};

// ======================================================================================================================
// CALIFORNIA PALACE OF THE LEGION OF HONOR (1924, George Applegarth; after the Palais de la Légion d'Honneur / Hôtel de
// Salm, Paris): the triumphal-arch gateway in an Ionic screen colonnade, the Court of Honor ringed by Ionic colonnades
// (the Thinker in front of the arch, the 1995 glass-pyramid skylight), the main block with its pedimented Corinthian
// portico, gallery wings, and the domed rotunda pavilion on the back (ocean) front. Off-white stone; floodlit at night.
// Local axes: +x = the entrance arch (NE), -x = the rotunda (SW); origin = middle of the plan.
// ======================================================================================================================
LANDMARKS.legionofhonor = {zh:'荣勋宫', en:'Legion of Honor', cat:'old', r:60, h:22,
  lt:{m:0, c:'#ffe2b8', k:1.05, e:0.6},
  build(){
    const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng, gy = siteGY('legionofhonor');
    const W = '#e6dfcf', T = '#d2c9b6', K = '#33302c', L = {c:'#3b342d', glow:'#ffc98a', gk:0.5}, R = {c:'#8e918d', lk:0.3}, PV = '#d9d2c2',
      GL = {c:'#9fb7c2', glow:'#cfe4ff', gk:0.5}, BR = {c:'#2f3a33', lk:0.4}, ST = '#b9b1a1', SKY = {c:'#9aaab0', lk:0.2};
    const w = B.p(W), t = B.p(T), dk = B.p(K), lit = B.p(L), rf = B.p(R), pv = B.p(PV), gl = B.p(GL), br = B.p(BR), st = B.p(ST), sky = B.p(SKY);
    const Y0 = 0.3, YC = Y0 + 12.2, YA = Y0 + 13.6;
    // terrace podium down to the ground (it falls ~5 m to the west)
    { const lo = minGY(gy, [[-50, -31], [-50, 31], [45, -31], [45, 31], [-50, 0], [0, 0]]) - 1.5;
      bx(st, -44.6, 44.6, lo, Y0, -30.6, 30.6); latheP(st, [[7.2, lo], [7.2, Y0], [0.01, Y0]], -42.9, 0, 16); }
    // ---- main block (x -44 .. -1.1) and the gallery wings along the court; hipped skylit roofs ----
    const blocks = [[-44.0, -1.1, -30.2, 30.2], [-5.0, 44.0, 17.8, 30.2], [-5.0, 44.0, -30.2, -17.8]];
    for (const [x0, x1, z0, z1] of blocks){ bx(w, x0, x1, Y0, YC, z0, z1); corniceR(t, x0, x1, z0, z1, YC - 0.8, 0.8, 0.45); bx(w, x0 + 0.3, x1 - 0.3, YC, YA, z0 + 0.3, z1 - 0.3);
      hipR(rf, x0 + 0.6, x1 - 0.6, z0 + 0.6, z1 - 0.6, YA, Math.min(2.4, (z1 - z0)/2 - 1));
      const lx = x1 - x0 > 20 ? [x0 + 4, x1 - 4] : null; if (lx) for (let zz = z0 + 4; zz < z1 - 5; zz += (z1 - z0 > 30 ? 13 : 99)) bx(sky, lx[0], lx[1], YA + 0.4, YA + 1.2, zz, zz + 3.0); }
    // outer facades: rusticated base, round-headed blind arcades / windows, pilasters
    const outer = [fc(-44.0, -30.2, -44.0, 30.2), fc(44.0, -30.2, -44.0, -30.2), fc(-44.0, 30.2, 44.0, 30.2)];
    for (const F of outer){ const n = Math.round(F.L/4.6), bw = F.L/n;
      fbx(t, F, -0.1, F.L + 0.1, Y0, Y0 + 1.2, -0.02, 0.4);
      for (let i = 0; i <= n; i++) fbx(t, F, i*bw - 0.35, i*bw + 0.35, Y0 + 1.2, YC - 0.8, -0.02, 0.3);
      for (let i = 0; i < n; i++){ const uc = (i + 0.5)*bw; if (F === outer[0] && Math.abs(uc - F.L/2) < 9) continue;
        if (i % 3 === 1){ farch(rng() < 0.3 ? lit : dk, F, uc, Y0 + 2.2, 1.6, Y0 + 6.4, 0.05); } else { farch(t, F, uc, Y0 + 2.0, 2.0, Y0 + 8.0, 0.05); latheP(st, [[0.45, Y0 + 2.0], [0.35, Y0 + 4.4], [0.22, Y0 + 5.0], [0.01, Y0 + 5.3]], ...(p => [p[0], p[2]])(fp(F, uc, 0, 0.35)), 6); }
        fbx(t, F, uc - 1.0, uc + 1.0, Y0 + 9.2, Y0 + 10.6, -0.02, 0.12); } }
    // the rotunda pavilion on the back front: half-columns, cornice, statue balustrade, low dome
    { const cx = -42.9, R0 = 6.8;
      latheP(w, [[R0, Y0], [R0, YC + 1.0], [R0 + 0.5, YC + 1.0], [R0 + 0.5, YC + 1.8], [R0 - 0.3, YC + 1.8]], cx, 0, 24);
      for (let i = 0; i < 10; i++){ const a = PI/2 + (i + 0.5)/10*PI, x = cx + Math.cos(a)*(R0 + 0.35), z = Math.sin(a)*(R0 + 0.35); segP(w, [x, Y0 + 1.6, z], [x, YC, z], 0.45, 8); latheP(t, [[0.5, YC], [0.75, YC + 0.9]], x, z, 6); }
      for (let i = 0; i < 6; i++){ const a = PI/2 + (i + 0.5)/6*PI; farch(dk, fc(cx + Math.cos(a + 0.12)*(R0 + 0.02), Math.sin(a + 0.12)*(R0 + 0.02), cx + Math.cos(a - 0.12)*(R0 + 0.02), Math.sin(a - 0.12)*(R0 + 0.02)), 0.8, Y0 + 2.4, 1.2, Y0 + 7.6, 0.03, 5); }
      latheP(rf, [[R0 - 0.3, YC + 1.8], [R0 - 0.6, YC + 3.6], [R0 - 1.8, YC + 5.6], [R0 - 4.0, YC + 7.0], [0.6, YC + 7.6], [0.01, YC + 7.7]], cx, 0, 24);
      for (let i = 0; i < 6; i++){ const a = PI/2 + (i + 0.5)/6*PI; latheP(t, [[0.35, YC + 1.8], [0.3, YC + 3.4], [0.01, YC + 3.7]], cx + Math.cos(a)*(R0 + 0.1), Math.sin(a)*(R0 + 0.1), 5); } }
    // ---- the Court of Honor: paving, Ionic colonnades along both wings and inside the front screen ----
    bx(pv, -1.1, 44.0, Y0 - 0.2, Y0 + 0.1, -17.8, 17.8);
    for (const s2 of [-1, 1]){
      const zf = s2*15.0, zw = s2*17.8;
      for (let x = -0.2; x <= 38.4; x += 3.2) col(w, t, x, zf, Y0 + 0.1, Y0 + 9.0, 0.48, 8);
      bx(w, -1.1, 39.0, Y0 + 9.0, Y0 + 10.8, Math.min(zf, zw) - (s2 < 0 ? 0.7 : 0), Math.max(zf, zw) + (s2 > 0 ? 0.7 : 0)); bx(t, -1.1, 39.0, Y0 + 10.8, Y0 + 11.3, Math.min(zf, zw) - 0.9, Math.max(zf, zw) + 0.9);
      for (let x = 0; x < 38.6; x += 0.5) bx(t, x, x + 0.16, Y0 + 11.3, Y0 + 12.2, zf - s2*0.75 - 0.08, zf - s2*0.75 + 0.08);
      const Fw = s2 > 0 ? fc(-1.0, zw, 39.0, zw) : fc(39.0, zw, -1.0, zw), Fi = {...Fw, nx:-Fw.nx, nz:-Fw.nz};
      for (let u = 1.6; u < 39.5; u += 3.2) farch(rng() < 0.3 ? lit : dk, Fi, u, Y0 + 0.4, 1.6, Y0 + 5.6, 0.05);
      // front screen inside the court (x 39 .. 43): a row of columns facing the court, the wall to the street behind
      const za = s2*5.4, zb = s2*17.8;
      bx(w, 41.6, 43.2, Y0, Y0 + 10.8, Math.min(za, zb), Math.max(za, zb)); bx(t, 39.0, 43.6, Y0 + 10.8, Y0 + 11.3, Math.min(za, zb) - 0.2, Math.max(za, zb) + 0.2);
      for (let z = 6.6; z < 17.6; z += 2.9) col(w, t, 39.8, s2*z, Y0 + 0.1, Y0 + 9.0, 0.48, 8);
      bx(w, 39.0, 41.6, Y0 + 9.0, Y0 + 10.8, Math.min(za, zb), Math.max(za, zb));
      // the street side of the screen: engaged Ionic columns, niches
      const Fs = s2 > 0 ? fc(43.2, 17.8, 43.2, 5.4) : fc(43.2, -5.4, 43.2, -17.8);
      for (let u = 0.6; u < Fs.L; u += 2.4) fcol(w, t, Fs, u, 0.45, Y0 + 0.6, Y0 + 9.0, 0.45, 8);
      fbx(t, Fs, -0.2, Fs.L + 0.2, Y0, Y0 + 0.6, -0.02, 1.0); fbx(w, Fs, -0.2, Fs.L + 0.2, Y0 + 9.0, Y0 + 10.8, -0.02, 1.0); fbx(t, Fs, -0.3, Fs.L + 0.3, Y0 + 10.6, Y0 + 11.2, -0.02, 1.2);
      // end pavilions of the street front (the wing ends)
      const Fp = s2 > 0 ? fc(44.0, 30.2, 44.0, 17.8) : fc(44.0, -17.8, 44.0, -30.2);
      fpil(t, Fp, 0.3, Fp.L - 0.3, 3, Y0 + 1.2, YC - 0.8, 0.8, 0.45); farch(dk, Fp, Fp.L/2, Y0 + 2.0, 2.0, Y0 + 7.6, 0.05);
    }
    // ---- the triumphal arch gateway (x 38.5 .. 43.4) with paired Ionic columns, attic and a flag mast ----
    { const Fa = fc(43.4, 5.4, 43.4, -5.4), Fb = fc(38.5, -5.4, 38.5, 5.4);
      bx(w, 38.5, 43.4, Y0, Y0 + 15.8, -5.4, -2.5); bx(w, 38.5, 43.4, Y0, Y0 + 15.8, 2.5, 5.4); bx(w, 38.5, 43.4, Y0 + 12.8, Y0 + 15.8, -2.5, 2.5);
      for (const F of [Fa, Fb]){ farcade(w, F, 2.9, 8.0, 1, Y0, Y0 + 10.3, Y0 + 12.8, 0.1, -0.02, 0.4, 10);
        for (const u of [0.55, 1.75, 9.05, 10.25]) fcol(w, t, F, u, 0.6, Y0 + 0.5, Y0 + 11.6, 0.5, 8);
        fbx(t, F, -0.4, F.L + 0.4, Y0 + 11.6, Y0 + 12.8, -0.02, 1.1); fbx(t, F, -0.5, F.L + 0.5, Y0 + 15.4, Y0 + 16.1, -0.02, 0.7);
        fbx(t, F, 3.3, 7.5, Y0 + 13.2, Y0 + 15.0, -0.02, 0.15); }
      // coffered barrel vault of the passage
      for (let i = 0; i <= 8; i++){ const a = PI*i/8; bx(t, 38.5, 43.4, Y0 + 10.3 + Math.sin(a)*2.5 - 0.1, Y0 + 10.3 + Math.sin(a)*2.5 + 0.2, Math.cos(a)*2.5 - 0.15, Math.cos(a)*2.5 + 0.15); }
      segP(t, [41.0, Y0 + 16.1, 0], [41.0, Y0 + 27.0, 0], 0.09, 4); }
    // ---- the main block's court front: pedimented Corinthian portico (six columns) ----
    { const F = fc(-1.1, 6.3, -1.1, -6.3);
      bx(t, -1.1, 4.8, Y0 - 0.2, Y0 + 0.9, -6.6, 6.6);
      for (let i = 0; i < 6; i++) fcol(w, t, F, 0.9 + i*2.1, 4.9, Y0 + 0.9, Y0 + 11.4, 0.55, 10);
      fbx(w, F, -0.2, F.L + 0.2, Y0 + 11.4, Y0 + 13.2, -0.02, 5.9); fbx(t, F, -0.4, F.L + 0.4, Y0 + 13.0, Y0 + 13.5, -0.02, 6.2);
      fped(w, t, F, -0.4, F.L + 0.4, Y0 + 13.5, 2.9, 0.5, 6.1);
      farch(dk, F, F.L/2, Y0 + 0.9, 2.6, Y0 + 5.4, 0.05); farch(rng() < 0.5 ? lit : dk, F, F.L/2 - 4.0, Y0 + 1.6, 1.5, Y0 + 5.0, 0.05); farch(rng() < 0.5 ? lit : dk, F, F.L/2 + 4.0, Y0 + 1.6, 1.5, Y0 + 5.0, 0.05);
      // the rest of the court front of the main block
      for (const [za, zb] of [[17.8, 6.3], [-6.3, -17.8]]){ const Fr = fc(-1.1, za, -1.1, zb); fpil(t, Fr, 0.3, Fr.L - 0.3, 3, Y0 + 1.0, YC - 0.8, 0.7, 0.35);
        for (let k = 0; k < 3; k++) farch(rng() < 0.3 ? lit : dk, Fr, (k + 0.5)*Fr.L/3, Y0 + 1.6, 1.6, Y0 + 6.6, 0.05); } }
    loose(g, L2 => drape(L2.p(PV), gy, HIDDEN.legionofhonor || [], 3.0, 0.1, Y0 - 0.1));
    // ---- the glass pyramid skylight, the Thinker on its pedestal, lawns and cypresses outside ----
    { const px = 14.6, pz = -1.0, a = 2.6, h = 2.5, A = [px - a, Y0 + 0.1, pz - a], Bq = [px + a, Y0 + 0.1, pz - a], C = [px + a, Y0 + 0.1, pz + a], D = [px - a, Y0 + 0.1, pz + a], Tp = [px, Y0 + 0.1 + h, pz];
      T3(gl, A, Bq, Tp); T3(gl, Bq, C, Tp); T3(gl, C, D, Tp); T3(gl, D, A, Tp);
      bx(st, 27.5, 28.9, Y0 + 0.1, Y0 + 2.4, -0.6, 0.6); bx(br, 27.6, 28.8, Y0 + 2.4, Y0 + 3.0, -0.55, 0.55);
      latheP(br, [[0.42, Y0 + 3.0], [0.38, Y0 + 3.9], [0.01, Y0 + 4.1]], 28.0, 0.15, 6); latheP(br, [[0.2, Y0 + 3.8], [0.2, Y0 + 4.2], [0.01, Y0 + 4.5]], 28.5, -0.1, 5);
      const tt = B.p('#5b4b3b'), tc = B.p({c:'#3d5a3a', lk:0.12});
      for (const [x, z] of [[46.5, -27], [46.5, 27], [46.5, -12], [46.5, 12], [-46.5, -26], [-46.5, 26]]) conifer(tt, tc, x, Math.min(0, gy(x, z)), z, 9 + rng()*3, 1.5, rng); }
    B.flush(g); return g; }};

// ======================================================================================================================
// THE PAINTED LADIES ("Postcard Row", 710-722 Steiner St, 1892-96, Matthew Kavanaugh): seven Queen Anne Victorians
// facing Alamo Square, each on its own lot and its own ground level (the street climbs to the south): raised basement,
// stairs up to a porch, a canted two-storey bay, a front gable with shingled tympanum and bargeboards, pastel bodies
// with contrasting trim. 722 (the north end, built first) is the larger "sister". Night: lit windows, street light.
// Local axes: the fronts face -x (Steiner St, WSW); +z = south (Hayes St); origin = middle of the row.
// ======================================================================================================================
LANDMARKS.paintedladies = {zh:'彩绘女士', en:'Painted Ladies', cat:'old', r:32, h:15,
  lt:{m:0, c:'#ffdcae', k:0.4, e:0.5},
  build(){
    const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng, gy = siteGY('paintedladies');
    const TR = '#f3eee0', K = '#2b2f36', L = {c:'#3a3428', glow:'#ffcf8c', gk:0.7}, R = {c:'#4d4f55', lk:0.2}, FN = '#9c9488';
    const tr = B.p(TR), dk = B.p(K), lit = B.p(L), rf = B.p(R), fn = B.p(FN);
    const AC = ['#7d3b3b', '#3f5f7f', '#55704d'].map(c => B.p(c));
    // north to south: 722, 720, 718, 716, 714, 712, 710 — [z0, z1, x1 (back), body colour, accent, height to the ridge]
    const HS = [[-26.6, -17.4, 10.2, '#e0cf96', 0, 14.2], [-16.55, -9.66, 7.5, '#a3b99c', 0, 13.2], [-9.66, -2.5, 7.3, '#bccbd8', 1, 13.2], [-2.5, 4.48, 7.3, '#e5b89e', 2, 13.2],
                [4.48, 11.4, 7.3, '#ece2b6', 1, 13.2], [11.8, 18.7, 7.5, '#86a5c4', 0, 13.2], [18.9, 25.85, 7.5, '#c6b4d2', 2, 13.2]];
    for (const [z0, z1, x1, body, ai, RH] of HS){
      const b = B.p(body), ac = AC[ai], x0 = -8.7, Wd = z1 - z0, zc = (z0 + z1)/2;
      const gf = Math.min(0, gy(x0 - 2.0, zc)), gb = Math.min(0, minGY(gy, [[x1, z0], [x1, z1], [x0, z0], [x0, z1]]));
      const yb = gf, YE = yb + RH - 3.6;                          // eaves; the gable rises 3.6 m to the ridge
      bx(fn, x0, x1, gb - 1.2, yb + 0.25, z0 + 0.02, z1 - 0.02);
      bx(b, x0, x1, yb + 0.25, YE, z0 + 0.04, z1 - 0.04);
      gabR(rf, b, x0 - 0.7, x1, z0 - 0.12, z1 + 0.12, YE, 3.6, 'x', 0.05);
      const F = fc(x0, z0, x0, z1), Ff = foff(F, 0.7);                 // the front (facing -x); u runs north -> south
      // shingled gable tympanum, bargeboards, attic window pair
      { const ym = YE, P = (u, y) => fp(Ff, u, y, 0.02);
        T3(ac, P(0.5, ym + 0.35), P(Wd - 0.5, ym + 0.35), P(Wd/2, ym + 3.1)); 
        for (const s2 of [-1, 1]){ const a = fp(Ff, s2 < 0 ? -0.1 : Wd + 0.1, ym - 0.1, 0.06), c = fp(Ff, Wd/2, ym + 3.65, 0.06); segP(tr, a, c, 0.16, 4); }
        frect(rng() < 0.4 ? lit : dk, Ff, Wd/2 - 1.1, Wd/2 - 0.15, ym + 0.6, ym + 1.9, 0.05); frect(rng() < 0.4 ? lit : dk, Ff, Wd/2 + 0.15, Wd/2 + 1.1, ym + 0.6, ym + 1.9, 0.05);
        fbx(tr, Ff, Wd/2 - 1.35, Wd/2 + 1.35, ym + 0.45, ym + 0.6, 0, 0.12); }
      // the gable overhang is carried on the front wall: frieze band and brackets under it
      fbx(b, F, 0, Wd, YE - 1.0, YE, -0.02, 0.7); fbx(tr, F, -0.05, Wd + 0.05, YE - 1.25, YE - 1.0, -0.02, 0.75);
      for (let u = 0.3; u < Wd; u += 0.9) fbx(tr, F, u, u + 0.18, YE - 1.0, YE - 0.4, 0.5, 0.72);
      // canted two-storey bay window on the north half
      { const bw = Math.min(3.6, Wd*0.5), u0 = 0.35, u1 = u0 + bw, dp = 0.95, y0 = yb + 2.7, y1 = YE - 1.3;
        const A = fp(F, u0, 0, 0), Bq = fp(F, u0 + dp, 0, dp), C = fp(F, u1 - dp, 0, dp), D = fp(F, u1, 0, 0);
        for (const [p, q] of [[A, Bq], [Bq, C], [C, D]]){ Q(b, [p[0], y0, p[2]], [q[0], y0, q[2]], [q[0], y1, q[2]], [p[0], y1, p[2]]);
          const Fw = fc(p[0], p[2], q[0], q[2]), m = Fw.L/2, ww = Math.min(1.1, Fw.L*0.6);
          for (const [ya, yh] of [[y0 + 0.5, 2.2], [y0 + 3.6, 2.1]]){ frect(rng() < 0.35 ? lit : dk, Fw, m - ww/2, m + ww/2, ya, ya + yh, 0.04); fbx(tr, Fw, m - ww/2 - 0.12, m + ww/2 + 0.12, ya + yh, ya + yh + 0.18, 0, 0.1); } }
        for (const [y, h] of [[y0 - 0.25, 0.3], [y1 - 0.1, 0.35]]){ const E = [A, Bq, C, D].map(p => [p[0], p[2]]); for (let i = 0; i < 3; i++){ const Fw = fc(E[i][0], E[i][1], E[i + 1][0], E[i + 1][1]); fbx(tr, Fw, -0.1, Fw.L + 0.1, y, y + h, -0.02, 0.15); } }
        T3(rf, [Bq[0], y1 + 0.25, Bq[2]], [C[0], y1 + 0.25, C[2]], [(A[0] + D[0])/2, y1 + 0.95, (A[2] + D[2])/2]); 
        frect(dk, F, u0 + 0.3, u1 - 0.3, yb + 0.25, yb + 2.3, 0.04); fbx(tr, F, u0 + 0.15, u1 - 0.15, yb + 2.3, yb + 2.5, 0, 0.1); }
      // entrance on the south half: stairs, porch posts, a little pediment; tall window over it
      { const uc = Wd*0.75, sw = 1.5, y0 = yb + 2.7, n = 14, run = 3.6;
        for (let k = 0; k < n; k++){ const yk = y0 - (k + 1)*(y0 - gf)/n; fbx(tr, F, uc - sw/2, uc + sw/2, gf - 0.6, yk + 0.19, 0.0 + k*run/n, 0.2 + (k + 1)*run/n); }
        fbx(tr, F, uc - sw/2 - 0.12, uc + sw/2 + 0.12, y0 - 0.2, y0, 0, 1.4);
        for (const du of [-sw/2 - 0.05, sw/2 + 0.05]) fbx(tr, F, uc + du - 0.1, uc + du + 0.1, y0, y0 + 2.9, 1.15, 1.35);
        fbx(b, F, uc - sw/2 - 0.2, uc + sw/2 + 0.2, y0 + 2.9, y0 + 3.3, -0.02, 1.45); fped(tr, null, F, uc - sw/2 - 0.25, uc + sw/2 + 0.25, y0 + 3.3, 0.7, 0, 1.45);
        frect(ac, F, uc - 0.55, uc + 0.55, y0, y0 + 2.4, 0.04);
        frect(rng() < 0.4 ? lit : dk, F, uc - 0.6, uc + 0.6, y0 + 3.9, y0 + 6.1, 0.04); fbx(tr, F, uc - 0.75, uc + 0.75, y0 + 6.1, y0 + 6.35, 0, 0.12); fbx(tr, F, uc - 0.75, uc + 0.75, y0 + 3.7, y0 + 3.9, 0, 0.12);
        frect(dk, F, uc - 0.5, uc + 0.5, yb + 0.6, yb + 1.9, 0.04); }
      // corner boards and the floor band
      for (const u of [0.0, Wd]) fbx(tr, F, u - 0.12, u + 0.12, yb + 0.25, YE - 1.25, -0.02, 0.12);
      fbx(tr, F, Wd*0.5 + 0.1, Wd - 0.1, yb + 5.6, yb + 5.85, -0.02, 0.1);
      // back windows (lit at night) on the rear face
      { const Fb = fc(x1, z1, x1, z0); for (let k = 0; k < 2; k++) for (const y of [yb + 3.2, yb + 6.4]) frect(rng() < 0.4 ? lit : dk, Fb, Wd*(0.28 + 0.44*k) - 0.5, Wd*(0.28 + 0.44*k) + 0.5, y, y + 1.8, 0.04); }
    }
    B.flush(g); return g; }};

// ===== placements =====
for (const k of Object.keys(PLACE)) if (LANDMARKS[k]) SG_PLACES.push({type:k, lat:PLACE[k].lat, lon:PLACE[k].lon, rot:PLACE[k].rot});
}
