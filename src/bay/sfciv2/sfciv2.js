// ===== bay/sfciv2: San Francisco civic centre, Cathedral Hill, Japantown and the Mission — the War Memorial Opera House and
// Veterans Building, the Asian Art Museum (the 1917 Main Library with the 2023 pavilion), Davies Symphony Hall, the Cathedral
// of Saint Mary of the Assumption, the Peace Pagoda and Mission Dolores with its basilica. Block-scoped: only LANDMARKS and
// SG_PLACES are touched. Real dimensions in metres; every plan traced from the real OSM footprint (bay/ref_sfciv2.json) in the
// model's local axes; PLACE gives each local origin (WGS84) and rot (bearing of local +x, counter-clockwise from east, rad).
// San Francisco is hilly: each model reads the real terrain under its plan (hC, when the app/kit provides it) and carries its
// plinths / foundations / steps down to the ground; in the model-only kit the ground is flat (y = 0).
{
const PI = Math.PI, HP = PI/2, TAU = PI*2;
const PLACE = {
  sfopera:    {lat:37.778575, lon:-122.420905, rot:0.1580},  // centre of the plan; +x = the Van Ness front (E), -z = the Memorial Court (N), +z = Grove St
  sfveterans: {lat:37.779545, lon:-122.421021, rot:0.1588},  // centre of the plan; +x = the Van Ness front (E), +z = the Memorial Court (S), -z = McAllister St
  sfasianart: {lat:37.780245, lon:-122.416002, rot:0.1466},  // -x = the Larkin St front (W), +z = the Fulton St front (S), +x = the Hyde St pavilion (E)
  sfdavies:   {lat:37.777650, lon:-122.420550, rot:0.1606},  // the curved glass front at the Van Ness (+x) / Grove (-z) corner, Hayes at +z, Franklin at -x
  sfstmarys:  {lat:37.784235, lon:-122.425387, rot:0.1578},  // cupola axis; -z = Geary Blvd (N), +x = Gough St (E)
  sfpagoda:   {lat:37.785069, lon:-122.429856, rot:0.1571},  // pagoda axis; -z = Post St (N), +z = Geary Blvd (S)
  sfmission:  {lat:37.764358, lon:-122.426945, rot:0.0803}   // basilica crossing; +x = the fronts on Dolores St (E), -z = 16th St (N), the old mission at +z
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


// ---------- extra helpers ----------
// inset a closed plan polygon ([x, z], right angles or gentle corners) by d (positive = inwards)
const insetP = function(P, d){
  let A = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; A += a[0]*b[1] - b[0]*a[1]; }
  const s = A > 0 ? 1 : -1, n = P.length, N = [];
  for (let i = 0; i < n; i++){ const a = P[i], b = P[(i+1) % n], L = Math.hypot(b[0]-a[0], b[1]-a[1]); N.push([-(b[1]-a[1])/L*s, (b[0]-a[0])/L*s]); }
  return P.map((p, i) => { const n1 = N[(i - 1 + n) % n], n2 = N[i], k = 1 + n1[0]*n2[0] + n1[1]*n2[1]; return [p[0] + d*(n1[0] + n2[0])/k, p[1] + d*(n1[1] + n2[1])/k]; });
};
// flat polygon cap (any simple polygon) at height y
const capAny = function(o, P, y){ const V = P.map(p => new THREE.Vector2(p[0], p[1])); const T = THREE.ShapeUtils.triangulateShape(V, []);
  for (const t of T) T3(o, [P[t[0]][0], y, P[t[0]][1]], [P[t[1]][0], y, P[t[1]][1]], [P[t[2]][0], y, P[t[2]][1]]); };
// outward faces of a closed plan polygon (fc frames, the outside on the right)
const polyF = function(P){ let A = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; A += a[0]*b[1] - b[0]*a[1]; }
  const F = []; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; F.push(A < 0 ? fc(a[0], a[1], b[0], b[1]) : fc(b[0], b[1], a[0], a[1])); } return F; };
// mansard roof on a plan polygon: slopes from inset a at y0 to inset b at y1, flat top (into top), oculus dormers (frames into od, glass dk/lit)
const mansP = function(o, top, od, glass, P, y0, y1, a, b, dw, rng){
  const P0 = insetP(P, a), P1 = insetP(P, b);
  for (let i = 0; i < P.length; i++){ const j = (i+1) % P.length; Q(o, [P0[i][0], y0, P0[i][1]], [P0[j][0], y0, P0[j][1]], [P1[j][0], y1, P1[j][1]], [P1[i][0], y1, P1[i][1]]); }
  capAny(top, P1, y1);
  if (!od) return;
  const FF = polyF(P), sl = (b - a)/(y1 - y0);
  for (const F of FF){ const n = Math.floor((F.L - 4)/dw); if (n < 1) continue;
    for (let k = 0; k < n; k++){ const u = F.L/2 + (k - (n - 1)/2)*dw, yb = y0 + 0.7, yt = y0 + 3.2;
      fbx(od, F, u - 0.95, u + 0.95, yb, yt, -a - (yt - y0)*sl - 0.8, -a - (yb - y0)*sl + 0.05);
      fdisc(glass(), F, u, yb + 1.25, 0.62, -a - (yb - y0)*sl + 0.08, 10);
      fbx(od, F, u - 1.1, u + 1.1, yt, yt + 0.25, -a - (yt - y0)*sl - 0.8, -a - (yb - y0)*sl + 0.2); } }
};
// transform a batch's triangles: rotate about y by ry, then translate
const xfB = function(B, ry, tx, tz){ const c = Math.cos(ry), s = Math.sin(ry);
  return { p(col){ const a = B.p(col); return { push(...v){ for (let i = 0; i < v.length; i += 3){ const x = v[i], z = v[i+2]; a.push(tx + x*c + z*s, v[i+1], tz - x*s + z*c); } } }; } }; };

// ======================================================================================================================
// WAR MEMORIAL OPERA HOUSE and VETERANS BUILDING (1932, Arthur Brown Jr., the architect of City Hall across Van Ness): two
// Beaux-Arts buildings identical outside but for the Opera House's stage block, either side of the Memorial Court. Granite
// bases and steps, rusticated terra-cotta walls; on the Van Ness front a severe rusticated basement with arched openings (five
// pairs of doors) and, above it, a loggia of eight pairs of granite Roman Doric columns screening colossal arch-headed windows;
// Doric entablature; a mansard roof (weathered copper) with oculus dormers; end pavilions at the corners of the front block. The Opera House adds the auditorium roof and the tall stage house (fly tower) towards Franklin St.
// Night: floodlit warm white; the Opera House's loggia windows glow gold.
// Local axes: +x = Van Ness Ave (E, the fronts), -x = Franklin St (W); origin = centre of the plan.
// ======================================================================================================================
const WMBuild = function(key, opera){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng, gy = siteGY(key);
  const W = '#ddd6c8', T = '#c9c1b2', K = '#2f343b', L = {c:'#3b3529', glow:'#ffd596', gk:0.85}, CU = {c:'#55665d', lk:0.4},
    RF = {c:'#9b9d97', lk:0.2}, LG = {c:'#d8c9a8', glow:'#ffd890', gk:1.1};
  const w = B.p(W), t = B.p(T), dk = B.p(K), lit = B.p(L), cu = B.p(CU), rf = B.p(RF), lg = B.p(LG);
  const win = () => rng() < 0.28 ? lit : dk;
  const Y1 = 7.8, YC = 20.4, YE = 23.0, YM = 29.0;
  const D = opera ? {fx:49.4, fz:24.5, sx:46.4, rz:28.0, ex0:24.0, ex1:42.4, ez:36.7, rx0:-37.4, tx:-54.8, tz:24.0}
                  : {fx:40.3, fz:22.8, sx:37.2, rz:25.8, ex0:20.4, ex1:33.2, ez:33.9, rx0:-42.9, tx:-42.9, tz:20.6};
  const {fx, fz, sx, rz, ex0, ex1, ez, rx0, tx, tz} = D;
  // ---- facade vocabulary ----
  const rust = (F, u0, u1, d) => { d = d || 0; for (let y = 1.0; y < Y1 - 0.7; y += 1.0) frect(t, F, u0, u1, y, y + 0.13, d + 0.04);
    fbx(t, F, u0, u1, -0.6, 0.6, d - 0.02, d + 0.3); fbx(t, F, u0, u1, Y1 - 0.55, Y1, d - 0.02, d + 0.32); };
  const entab = (F, u0, u1, d0, d1, tri) => {
    fbx(t, F, u0, u1, YC, YC + 0.75, d0, d1); fbx(w, F, u0, u1, YC + 0.75, YE - 0.8, d0, d1 - 0.08);
    if (tri){ const n = Math.max(1, Math.round((u1 - u0)/1.55)); for (let i = 0; i <= n; i++){ const u = u0 + i*(u1 - u0)/n; fbx(t, F, u - 0.24, u + 0.24, YC + 0.8, YE - 0.85, d1 - 0.1, d1 + 0.03); } }
    fbx(t, F, u0 - 0.35, u1 + 0.35, YE - 0.8, YE - 0.45, d0, d1 + 0.35); fbx(t, F, u0 - 0.6, u1 + 0.6, YE - 0.45, YE, d0, d1 + 0.65); };
  // side facade: rusticated base with arched windows, pilasters, two rows of windows (square / arch-headed), entablature
  const sideF = (F, u0, u1, n) => { const bw = (u1 - u0)/n;
    rust(F, u0, u1); fpil(w, F, u0, u1, n, Y1, YC, 0.95, 0.32); for (let y = Y1 + 0.9; y < YC - 0.3; y += 0.9) frect(t, F, u0, u1, y, y + 0.07, 0.03);   // rusticated terra cotta
    for (let i = 0; i < n; i++){ const uc = u0 + (i + 0.5)*bw;
      farch(win(), F, uc, 1.4, 1.9, 4.6, 0.36, 6); frect(win(), F, uc - 0.9, uc + 0.9, Y1 + 1.3, Y1 + 4.6, 0.05);
      fbx(t, F, uc - 1.15, uc + 1.15, Y1 + 4.6, Y1 + 4.95, -0.02, 0.22); farch(win(), F, uc, Y1 + 6.2, 1.9, YC - 2.4, 0.05, 6); }
    entab(F, u0, u1, -0.02, 0.42, true); };
  // pavilion facade (the end pavilions): rusticated base with an arched window, a pedimented window over a balcony, corner pilasters
  const pavF = (F, u0, u1, n) => { const bw = (u1 - u0)/n;
    rust(F, u0, u1); fbx(w, F, u0, u0 + 1.3, Y1, YC, -0.02, 0.4); fbx(w, F, u1 - 1.3, u1, Y1, YC, -0.02, 0.4);
    for (let i = 0; i < n; i++){ const uc = u0 + (i + 0.5)*bw;
      farch(win(), F, uc, 1.2, 2.2, 4.8, 0.36, 6); frect(win(), F, uc - 1.0, uc + 1.0, Y1 + 1.6, Y1 + 6.4, 0.05);
      fbal(t, F, uc - 1.4, uc + 1.4, Y1 + 0.3, 1.0, 0.45, 0.3, 0.42); fped(w, t, F, uc - 1.5, uc + 1.5, Y1 + 6.9, 1.0, 0, 0.3); fbx(t, F, uc - 1.4, uc + 1.4, Y1 + 6.4, Y1 + 6.9, 0, 0.35);
      frect(win(), F, uc - 0.9, uc + 0.9, Y1 + 8.8, YC - 1.4, 0.05); }
    entab(F, u0, u1, -0.02, 0.5, true); };
  // ---- masses ----
  const lo = minGY(gy, [[tx, -rz], [fx, -ez], [fx, ez], [tx, rz], [0, 0], [fx, 0], [tx, 0]]) - 5.0;
  const plinth = (x0, x1, z0, z1) => bx(t, x0 - 0.3, x1 + 0.3, lo, 0.25, z0 - 0.3, z1 + 0.3);
  plinth(rx0, sx, -rz, rz); plinth(sx, fx, -fz, fz); plinth(ex0, ex1, -ez, ez);
  bx(w, rx0, sx, 0, YE, -rz, rz); bx(w, sx - 0.5, fx - 2.8, 0, YE, -fz, fz); bx(w, fx - 2.9, fx, 0, Y1, -fz, fz);
  for (const s of [-1, 1]) bx(w, ex0, ex1, 0, YE, s > 0 ? rz - 0.5 : -ez, s > 0 ? ez : -rz + 0.5);
  if (opera){ plinth(tx, rx0, -tz, tz); bx(w, tx, rx0 + 0.5, 0, YE - 2.0, -tz, tz); bx(rf, tx + 0.6, rx0, YE - 2.0, YE - 1.8, -tz + 0.6, tz - 0.6);
    corniceR(t, tx, rx0, -tz, tz, YE - 2.6, 0.6, 0.35); }
  // ---- the Van Ness front: rusticated basement, the loggia of paired Doric columns, colossal arch-headed windows ----
  { const F = fc(fx, fz, fx, -fz), L = F.L, n = 7, c0 = 2.4, cs = (L - 2*c0)/n, Fw = foff(F, -2.8);
    rust(F, 0, L); fbx(t, F, 0, L, Y1 - 0.1, Y1 + 0.38, -2.8, 0.12);
    for (let k = 0; k < n; k++){ const uc = c0 + (k + 0.5)*cs;
      if (k >= 1 && k <= 5){ farch(lit, F, uc, 0.35, 2.5, 4.4, 0.06, 8); for (const o of [-0.62, 0.62]) frect(B.p({c:'#4a3a2a', lk:0.2}), F, uc + o - 0.55, uc + o + 0.55, 0.35, 3.3, 0.08); }   // five pairs of doors
      else farch(win(), F, uc, 1.4, 2.0, 4.6, 0.06, 6);
      fbx(t, F, uc - 1.55, uc + 1.55, 4.4 + 1.25, 4.4 + 1.6, -0.02, 0.18);
      { const ww = Math.min(3.1, cs - 2.9); farch(opera ? lit : win(), Fw, uc, Y1 + 1.4, ww, YC - 3.1, 0.05, 10);
        for (const y of [Y1 + 5.6, YC - 3.1]) fbx(t, Fw, uc - ww/2, uc + ww/2, y - 0.12, y + 0.12, 0.0, 0.14);
        for (const o of [-ww/6, ww/6]) fbx(t, Fw, uc + o - 0.06, uc + o + 0.06, Y1 + 1.4, YC - 3.1 + Math.sqrt(Math.max(0, ww*ww/4 - o*o)), 0.0, 0.1); }
      fbal(t, F, c0 + k*cs + 1.5, c0 + (k + 1)*cs - 1.5, Y1 + 0.38, 1.05, -1.0, 0.28, 0.42); }
    for (let k = 0; k <= n; k++){ const ub = c0 + k*cs; for (const o of [-0.82, 0.82]) fcol(w, t, F, ub + o, -1.0, Y1 + 0.38, YC, 0.6, 10); }
    for (const [u0, u1] of [[0, 1.0], [L - 1.0, L]]) fbx(w, F, u0, u1, Y1, YC, -2.9, 0.0);
    entab(F, 0, L, -2.9, 0.15, true);
    // the sides of the front projection and the short returns to the end pavilions
    for (const s of [1, -1]){
      const Fs = s > 0 ? fc(sx - 0.5, fz, fx, fz) : fc(fx, -fz, sx - 0.5, -fz); rust(Fs, 0, Fs.L); entab(Fs, 0, Fs.L, -0.02, 0.4, false);
      if (rz > fz + 0.5){ const Fr = s > 0 ? fc(sx, rz, sx, fz) : fc(sx, -fz, sx, -rz); rust(Fr, 0, Fr.L); entab(Fr, 0, Fr.L, -0.02, 0.4, false); }
      const Fq = s > 0 ? fc(ex1, rz, sx, rz) : fc(sx, -rz, ex1, -rz); rust(Fq, 0, Fq.L); frect(win(), Fq, Fq.L/2 - 0.9, Fq.L/2 + 0.9, Y1 + 1.3, YC - 2.0, 0.05); entab(Fq, 0, Fq.L, -0.02, 0.4, false);
    }
    // the front steps down to the Van Ness sidewalk
    const gF = Math.min(0, gy(fx + 2.5, 0)), ns = Math.max(2, Math.min(9, Math.ceil((0.3 - gF)/0.17)));
    for (let k = 0; k < ns; k++) fbx(t, F, 0.6 - k*0.1, L - 0.6 + k*0.1, gF - 1.0, 0.3 - (k + 1)*(0.3 - gF)/ns + 0.17, -0.1 + k*0.36, 0.3 + k*0.36);
  }
  // ---- end pavilions ----
  for (const s of [1, -1]){
    const Ff = s > 0 ? fc(ex1, ez, ex1, rz) : fc(ex1, -rz, ex1, -ez); pavF(Ff, 0, Ff.L, 1);
    const Fs = s > 0 ? fc(ex0, ez, ex1, ez) : fc(ex1, -ez, ex0, -ez); pavF(Fs, 0, Fs.L, 2);
    const Fb = s > 0 ? fc(ex0, rz, ex0, ez) : fc(ex0, -ez, ex0, -rz); rust(Fb, 0, Fb.L); entab(Fb, 0, Fb.L, -0.02, 0.4, false);
  }
  // ---- long sides (the Memorial Court and the street) and the back ----
  for (const s of [1, -1]){ const F = s > 0 ? fc(rx0, rz, ex0, rz) : fc(ex0, -rz, rx0, -rz); sideF(F, 0.6, F.L - 0.6, Math.round(F.L/6.1)); }
  { const F = fc(rx0, -rz, rx0, rz), n = Math.round(F.L/6.4); rust(F, 0, F.L); fpil(w, F, 0.6, F.L - 0.6, n, Y1, YC, 0.9, 0.25);
    for (let i = 0; i < n; i++){ const uc = 0.6 + (i + 0.5)*(F.L - 1.2)/n; if (opera && Math.abs(uc - F.L/2) < tz) continue; frect(win(), F, uc - 0.85, uc + 0.85, Y1 + 1.4, Y1 + 4.6, 0.05); frect(win(), F, uc - 0.85, uc + 0.85, Y1 + 6.4, YC - 2.2, 0.05); }
    entab(F, 0, F.L, -0.02, 0.4, false); }
  if (opera){ for (const F of [fc(tx, -tz, tx, tz), fc(tx, tz, rx0, tz), fc(rx0, -tz, tx, -tz)]){ const n = Math.max(1, Math.round(F.L/6.5));
    fbx(t, F, 0, F.L, -0.6, 0.6, -0.02, 0.3); for (let i = 0; i < n; i++){ const uc = (i + 0.5)*F.L/n; frect(win(), F, uc - 0.8, uc + 0.8, 3.0, 6.2, 0.05); frect(win(), F, uc - 0.8, uc + 0.8, 9.5, 13.5, 0.05); frect(dk, F, uc - 0.8, uc + 0.8, 15.5, 18.0, 0.05); } } }
  // ---- copper mansards with oculus dormers ----
  const MP = [[rx0, -rz], [sx, -rz], [sx, -fz], [fx, -fz], [fx, fz], [sx, fz], [sx, rz], [rx0, rz]];
  mansP(cu, rf, cu, win, MP, YE, YM, 0.45, 3.4, opera ? 6.3 : 5.9, rng);
  for (const s of [1, -1]){ const z0 = s > 0 ? rz - 1.0 : -ez, z1 = s > 0 ? ez : -rz + 1.0;
    mansP(cu, rf, cu, win, [[ex0, z0], [ex1, z0], [ex1, z1], [ex0, z1]], YE, YM + 0.6, 0.45, 2.8, 5.2, rng); }
  // ---- Opera House: the auditorium roof and the stage house (fly tower) ----
  if (opera){
    hipR(cu, -12.5, 21.0, -23.0, 23.0, YM, 6.2);
    const x0 = -37.0, x1 = -13.0, zz = 21.5, H = 42.6;
    bx(w, x0, x1, YM - 0.5, H, -zz, zz); corniceR(t, x0, x1, -zz, zz, H - 1.4, 0.7, 0.5); corniceR(t, x0, x1, -zz, zz, YM + 0.6, 0.5, 0.3);
    hipR(cu, x0 + 0.4, x1 - 0.4, -zz + 0.4, zz - 0.4, H, 1.6);
    const R4 = rectF(x0, x1, -zz, zz);
    for (const F of [R4.f, R4.b, R4.l, R4.r]){ const n = Math.max(2, Math.round(F.L/6.0)); fpil(w, F, 0.4, F.L - 0.4, n, YM + 1.1, H - 1.4, 1.0, 0.3);
      for (let i = 0; i < n; i++){ const uc = 0.4 + (i + 0.5)*(F.L - 0.8)/n; farch(dk, F, uc, H - 8.5, 1.8, H - 4.3, 0.05, 6); } }
  }
  // ---- Veterans Building: the glazed roof lanterns over the top-floor galleries (the old museum's skylights) ----
  if (!opera){ const sk = B.p({c:'#6f7c82', lk:0.2}); for (const [x0, x1, z0, z1] of [[-36, -6, -19, -7], [-36, -6, 7, 19], [-2, 12, -19, 19]]){
    bx(rf, x0, x1, YM, YM + 0.7, z0, z1); gabR(sk, rf, x0 + 0.3, x1 - 0.3, z0 + 0.3, z1 - 0.3, YM + 0.7, 1.6, (x1 - x0) > (z1 - z0) ? 'x' : 'z', 0); } }
  // ---- Veterans Building: the Memorial Court's Van Ness railing and gate piers with lanterns (outside the plan hull) ----
  if (!opera) loose(g, L2 => { const ir = L2.p({c:'#2b2e30', lk:0.15}), sp = L2.p(T), ln = L2.p({c:'#e9dcc0', glow:'#ffdc98', gk:1.2}), xf = 38.6, zA = ez + 0.6, zB = 74.3, zc = (zA + zB)/2;
    for (let z = zA; z < zB - 0.1; z += 4.0){ const z1 = Math.min(zB, z + 4.0), gate = Math.abs((z + z1)/2 - zc) < 4.2, g0 = gy(xf, z) - 0.3;
      bx(sp, xf - 0.35, xf + 0.35, g0, g0 + 2.6, z - 0.35, z + 0.35); if (gate) continue;
      bx(sp, xf - 0.3, xf + 0.3, g0, g0 + 0.6, z, z1); bx(ir, xf - 0.05, xf + 0.05, g0 + 2.0, g0 + 2.12, z, z1); for (let zz = z + 0.2; zz < z1; zz += 0.22) bx(ir, xf - 0.03, xf + 0.03, g0 + 0.6, g0 + 2.3, zz - 0.03, zz + 0.03); }
    for (const zz of [zc - 4.6, zc + 4.6]){ const g0 = gy(xf, zz) - 0.3; bx(sp, xf - 0.9, xf + 0.9, g0, g0 + 4.6, zz - 0.9, zz + 0.9); bx(sp, xf - 1.1, xf + 1.1, g0 + 4.6, g0 + 5.0, zz - 1.1, zz + 1.1);
      latheP(ir, [[0.12, g0 + 5.0], [0.12, g0 + 5.5]], xf, zz, 6); latheP(ln, [[0.3, g0 + 5.5], [0.42, g0 + 6.0], [0.38, g0 + 6.6], [0.01, g0 + 7.0]], xf, zz, 8);
      for (let z = zz - 0.6; z <= zz + 0.6; z += 0.3) {} }
    for (let zz = zc - 3.6; zz <= zc + 3.6; zz += 0.24){ const g0 = gy(xf, zc) - 0.3; bx(ir, xf - 0.03, xf + 0.03, g0, g0 + 3.0 + 0.6*Math.cos((zz - zc)/3.6*HP), zz - 0.03, zz + 0.03); }
    // the court's central lawn inside the drive loop (traced from the OSM paths), draped on the real ground
    if (gy.real){ const lw = L2.p({c:'#6c9550', lk:0.1}), LP = [[-36.9, 41.6], [5.5, 41.5], [15.6, 49.0], [17.1, 54.5], [15.0, 59.6], [5.8, 66.2], [-36.8, 66.3]];
      const inP = (x, z) => { let c = false; for (let i = 0, j = LP.length - 1; i < LP.length; j = i++){ const a = LP[i], b = LP[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0])*(z - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; };
      for (let x = -36.6; x < 17; x += 2.5) for (let z = 41.9; z < 66; z += 2.5){ const x1 = x + 2.5, z1 = z + 2.5; if (!inP((x + x1)/2, (z + z1)/2)) continue;
        Q(lw, [x, gy(x, z1) + 0.1, z1], [x1, gy(x1, z1) + 0.1, z1], [x1, gy(x1, z) + 0.1, z], [x, gy(x, z) + 0.1, z]); } } });
  // ---- flagpoles on the front ----
  for (const s of [-1, 1]) segP(t, [fx - 4.5, YM, s*(fz - 4)], [fx - 4.5, YM + 9.5, s*(fz - 4)], 0.1, 4, 0.05);
  B.flush(g); return g;
};
LANDMARKS.sfopera = {zh:'战争纪念歌剧院', en:'War Memorial Opera House', cat:'old', r:72, h:45,
  lt:{m:0, c:'#ffe8c6', k:0.9, e:0.5}, build(){ return WMBuild('sfopera', true); }};
LANDMARKS.sfveterans = {zh:'退伍军人纪念大楼', en:'War Memorial Veterans Building', cat:'old', r:58, h:39,
  lt:{m:0, c:'#ffe8c6', k:0.9, e:0.5}, build(){ return WMBuild('sfveterans', false); }};

// ======================================================================================================================
// LOUISE M. DAVIES SYMPHONY HALL (1980, Skidmore, Owings & Merrill with Pietro Belluschi): the concert hall is wrapped at the
// Van Ness / Grove corner by a curved, five-storey glass wall in front of the lobby promenades, between two round stair towers;
// horizontally scored precast walls coloured like the War Memorial's granite and terra cotta, the cornice and the curved copper
// mansard echo the neighbours; the hall's drum rises above; the Zellerbach rehearsal wing at Franklin & Hayes.
// Night: the glass lobbies glow (warm), the precast walls lightly floodlit.
// Local axes: +x = Van Ness Ave (E), -z = Grove St (N), +z = Hayes St (S), -x = Franklin St (W); origin = the ref anchor.
// ======================================================================================================================
// Catmull-Rom resampling of a polyline ([x, z]) with k sub-steps per segment
const crSmooth = function(P, k){ const out = [];
  for (let i = 0; i < P.length - 1; i++){ const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (let j = 0; j < k; j++){ const t = j/k, t2 = t*t, t3 = t2*t;
      out.push([0, 1].map(a => 0.5*((2*p1[a]) + (-p0[a] + p2[a])*t + (2*p0[a] - 5*p1[a] + 4*p2[a] - p3[a])*t2 + (-p0[a] + 3*p1[a] - 3*p2[a] + p3[a])*t3))); } }
  out.push(P[P.length - 1]); return out; };
LANDMARKS.sfdavies = {zh:'戴维斯交响音乐厅', en:'Louise M. Davies Symphony Hall', cat:'new', r:80, h:38,
  lt:{m:0, c:'#ffe6c4', k:0.6, e:0.6},
  build(){
    const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng, gy = siteGY('sfdavies');
    const PC = '#d5cdbd', PT = '#c2b9a8', GL = {c:'#62798a', op:0.55, glow:'#ffd9a2', gk:0.35}, LB = {c:'#d9cfbd', glow:'#ffd9a2', gk:0.45}, MU = '#8c9091', CU = {c:'#55665d', lk:0.35}, RF = {c:'#9b9d97', lk:0.15},
      K = '#2f343b', L = {c:'#3b3529', glow:'#ffd596', gk:0.7};
    const pc = B.p(PC), pt = B.p(PT), gl = B.p(GL), mu = B.p(MU), cu = B.p(CU), rf = B.p(RF), dk = B.p(K), lit = B.p(L);
    const YA = 21.2, YB = 24.2, YM = 30.4, YH = 35.0;
    const CRV = crSmooth([[-5.8, -40.1], [4.8, -40.1], [15.8, -38.6], [21.6, -36.7], [27.8, -33.9], [32.8, -30.4], [37.3, -26.3], [43.6, -17.7], [47.2, -9.4], [48.6, 0.8], [48.8, 15.6]], 3);
    const MAIN = [[-33.0, 38.5], [-32.8, 4.7], [-33.2, -37.9], [-8.0, -40.1]].concat(CRV.slice(1), [[48.6, 27.4], [48.4, 38.8]]);
    const RW = [[-67.8, 4.7], [-32.8, 4.7], [-33.8, 38.5], [-67.9, 38.4]];
    const NW = [[-47.0, -38.1], [-47.0, -44.1], [-37.9, -44.0], [-37.8, -46.0], [-16.4, -45.9], [-16.2, -37.9]];
    const lo = minGY(gy, [[-67, 38], [-67, 5], [-47, -45], [-16, -46], [10, -40], [40, -25], [49, 0], [49, 38], [0, 38]]) - 5.0;
    // plinths and walls of the precast blocks
    const block = (P, h, scored, wins) => { const Pp = insetP(P, -0.3); wallsP(pt, Pp, lo, 0.3); capAny(pt, Pp, 0.3);
      wallsP(pc, P, 0, h); capAny(rf, insetP(P, 0.4), h - 0.3); wallsP(pc, insetP(P, 0.4), h - 0.3, h + 0.4); capAny(pc, P, h + 0.4);   // parapet (top surface)
      for (const F of polyF(P)){ if (scored) for (let y = 1.2; y < h - 0.4; y += 1.25) frect(pt, F, 0, F.L, y, y + 0.1, 0.03);
        if (wins){ const n = Math.floor(F.L/wins); for (let i = 0; i < n; i++){ const uc = (i + 0.5)*F.L/n; for (let y = 3.2; y < h - 3; y += 4.2) frect(rng() < 0.3 ? lit : dk, F, uc - 0.45, uc + 0.45, y, y + 2.4, 0.05); } } } };
    block(RW, 10.2, true, 4.2); block(NW, 13.6, true, 5.0);
    // the main body: the scored precast walls on Hayes / Franklin / the Grove wing, glass on the curve
    { const Pp = insetP(MAIN, -0.3); wallsP(pt, Pp, lo, 0.3); capAny(pt, Pp, 0.3); }
    const FF = polyF(MAIN), nC = CRV.length - 1, i0 = 3;               // faces i0 .. i0 + nC - 1 are the curved glass front
    FF.forEach((F, i) => {
      const curved = i >= i0 && i < i0 + nC;
      if (curved){
        frect(gl, F, -0.02, F.L + 0.02, 0.3, YA, -1.2);                                     // the glass wall (set back behind the bands)
        for (const [y0, y1] of [[0.3, 0.9], [5.6, 6.5], [10.6, 11.5], [15.6, 16.5]]) fbx(pc, F, -0.05, F.L + 0.05, y0, y1, -1.4, 0.0);   // floor bands
        const nm = Math.max(1, Math.round(F.L/2.6)); for (let m = 0; m <= nm; m++){ const u = m*F.L/nm; fbx(mu, F, u - 0.07, u + 0.07, 0.9, YA, -1.25, -1.0); }
        fbx(pc, F, -0.05, F.L + 0.05, YA, YB, -1.4, 0.0); for (let y = YA + 0.6; y < YB - 0.2; y += 0.8) frect(pt, F, 0, F.L, y, y + 0.08, 0.03);
        fbx(pt, F, -0.08, F.L + 0.08, YB - 0.35, YB, -1.4, 0.35);
      } else {
        wallsP(pc, [[F.ax, F.az], [F.ax + F.tx*F.L, F.az + F.tz*F.L]], 0, YB);
        for (let y = 1.2; y < YB - 0.4; y += 1.25) frect(pt, F, 0, F.L, y, y + 0.1, 0.03);
        fbx(pt, F, -0.05, F.L + 0.05, YB - 0.35, YB, -0.05, 0.35);
        const n = Math.floor(F.L/5.5); for (let k = 0; k < n; k++){ const uc = (k + 0.5)*F.L/n; frect(rng() < 0.3 ? lit : dk, F, uc - 0.5, uc + 0.5, 6.0, 15.0, 0.05); }
        if (F.L > 30){ const um = F.L/2; frect(lit, F, um - 6, um + 6, 0.3, 4.2, 0.06); fbx(pt, F, um - 6.6, um + 6.6, 4.2, 4.7, 0, 1.6); }   // entrance
      }
    });
    // inner lobby balconies seen through the glass (parapets, ceilings), the floor slabs behind the bands
    { const lb = B.p(LB); for (let i = 0; i < CRV.length - 1; i++){ const a = CRV[i], b = CRV[i + 1], F = fc(b[0], b[1], a[0], a[1]);
        for (const y of [6.0, 11.0, 16.0]){ fbx(pc, F, -0.3, F.L + 0.3, y - 0.45, y, -9.0, -1.3); fbx(pc, F, -0.3, F.L + 0.3, y, y + 1.0, -4.2 + (y - 6)*0.08, -3.9 + (y - 6)*0.08); }
        fbx(pc, F, -0.3, F.L + 0.3, YA - 0.4, YA, -9.0, -1.3); frect(lb, F, -0.3, F.L + 0.3, 0.3, YA - 0.4, -9.0);           // lobby slabs, balcony fronts, the hall's lit outer wall
        if (i % 3 === 1) for (const y of [0.3, 6.0, 11.0, 16.0]) frect(dk, F, F.L/2 - 0.8, F.L/2 + 0.8, y, y + 2.6, -8.95); } }
    // the round stair towers at both ends of the glass
    for (const [cx, cz, r] of [[-10.6, -38.4, 4.4], [49.6, 21.6, 4.6]]){
      latheP(pt, [[r + 0.3, lo], [r + 0.3, 0.3]], cx, cz, 18); latheP(pc, [[r, 0.3], [r, YB + 1.2], [r + 0.3, YB + 1.2], [r + 0.3, YB + 1.6], [0.01, YB + 1.6]], cx, cz, 18);
      for (let y = 1.2; y < YB; y += 1.25) latheP(pt, [[r + 0.03, y], [r + 0.03, y + 0.1]], cx, cz, 18); }
    // the curved copper mansard over the whole main block, the flat roof, then the hall's drum
    mansP(cu, rf, null, null, MAIN, YB, YM, 0.5, 4.6, 0, rng);
    const HALL = [[-27.4, 17.1], [-20.7, 0.0], [-19.7, -27.3], [9.1, -28.1], [15.6, -26.5], [19.6, -24.6], [24.4, -21.2], [27.6, -17.4], [30.1, -13.6], [32.4, -7.7], [33.1, 0.0], [33.3, 25.7], [5.0, 25.7], [-12.1, 32.4]];
    const HI = insetP(HALL, 2.0); wallsP(pc, HI, YM - 0.5, YH); capAny(rf, insetP(HI, 0.4), YH - 0.2); wallsP(pc, insetP(HI, 0.4), YH - 0.2, YH + 0.5); capAny(pc, HI, YH + 0.5);
    for (const F of polyF(HI)) for (let y = YM + 0.8; y < YH - 0.3; y += 1.25) frect(pt, F, 0, F.L, y, y + 0.1, 0.03);
    hipR(cu, -24, 22, -20, 20, YH, 1.4);
    // rooftop plant and the stage-end block (towards Hayes / Franklin)
    bx(pc, -30.5, -14.0, YM - 0.5, YH + 2.4, 8.0, 30.0); corniceR(pt, -30.5, -14.0, 8.0, 30.0, YH + 2.0, 0.4, 0.3); bx(rf, -30.0, -14.5, YH + 2.4, YH + 2.6, 8.5, 29.5);
    // the Henry Moore bronze (Large Four Piece Reclining Figure) on the corner plaza, kept out of the plan hull
    loose(g, L2 => { const br = L2.p({c:'#5a4a36', lk:0.4}), gb = gy(30, -50); bx(L2.p(PT), 26.5, 35.5, gb - 0.5, gb + 0.6, -53.6, -49.6);
      for (const [x, z, r, s] of [[28.0, -51.6, 1.0, 0.8], [30.2, -51.4, 1.15, 1.0], [32.4, -51.8, 0.95, 0.75], [34.0, -51.5, 0.8, 1.1]]) latheP(br, [[0.01, gb + 0.6], [r, gb + 0.9], [r*1.05, gb + 0.6 + s*1.4], [0.5*r, gb + 0.6 + s*2.0], [0.01, gb + 0.6 + s*2.2]], x, z, 9, rng()); });
    B.flush(g); return g; }};

// ======================================================================================================================
// ASIAN ART MUSEUM — the former Main Library (1917, George Kelham; converted by Gae Aulenti, 2003) and the Akiko Yamazaki &
// Jerry Yang Pavilion with its rooftop Art Terrace (2023, wHY). Beaux-Arts granite block of four storeys facing the Civic
// Center Plaza (Larkin St) and the Fulton St mall: rusticated basement with arched openings, a giant Ionic order with tall
// windows and arched reading-room windows, entablature with a plain frieze, attic and cornice; secondary McAllister and Hyde
// fronts (buff brick at the back). The pavilion on the Hyde St side: smooth grey granite plinth, faceted grey terra-cotta
// tiles with angular rustication, gem-shaped bay windows, a glass-railed roof terrace.
// Night: floodlit warm white, the pavilion's bay windows lit.
// Local axes: -x = Larkin St (W, main front), +z = Fulton St (S), -z = McAllister St (N), +x = Hyde St (E).
// ======================================================================================================================
LANDMARKS.sfasianart = {zh:'亚洲艺术博物馆', en:'Asian Art Museum', cat:'old', r:66, h:27,
  lt:{m:0, c:'#ffeacc', k:0.85, e:0.5},
  build(){
    const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng, gy = siteGY('sfasianart');
    const W = '#dad6cc', T = '#c6c0b3', K = '#2f343b', L = {c:'#3b3529', glow:'#ffd596', gk:0.75}, RF = {c:'#9b9d97', lk:0.15}, BR = '#c4ad88',
      TC = {c:'#8f918d', lk:0.5}, GR = '#7d807e', GL = {c:'#40505a', glow:'#ffe2b0', gk:0.7}, SK = {c:'#6f7d84', lk:0.2}, RL = {c:'#9fb4bd', op:0.45, ds:true};
    const w = B.p(W), t = B.p(T), dk = B.p(K), lit = B.p(L), rf = B.p(RF), br = B.p(BR), tc = B.p(TC), gr = B.p(GR), gl = B.p(GL), sk = B.p(SK);
    const win = () => rng() < 0.25 ? lit : dk;
    const Y1 = 7.0, YC = 19.0, YE = 21.4, YA = 24.6;
    const lo = minGY(gy, [[-51, -31], [11, -29], [55, -15], [55, 10], [42, 23], [-50, 23], [0, 0]]) - 5.0;
    const rust = (F, u0, u1) => { for (let y = 1.0; y < Y1 - 0.7; y += 0.95) frect(t, F, u0, u1, y, y + 0.12, 0.04);
      fbx(t, F, u0, u1, -0.6, 0.55, -0.02, 0.3); fbx(t, F, u0, u1, Y1 - 0.5, Y1, -0.02, 0.32); };
    const entab = (F, u0, u1, d0, d1) => { fbx(t, F, u0, u1, YC, YC + 0.7, d0, d1); fbx(w, F, u0, u1, YC + 0.7, YE - 0.6, d0, d1 - 0.06);
      fbx(t, F, u0 - 0.3, u1 + 0.3, YE - 0.6, YE, d0, d1 + 0.45);
      fbx(w, F, u0, u1, YE, YA - 0.9, -0.02, 0.1); fbx(t, F, u0 - 0.5, u1 + 0.5, YA - 0.9, YA - 0.45, -0.02, 0.6); fbx(t, F, u0 - 0.7, u1 + 0.7, YA - 0.45, YA, -0.02, 0.85); };
    // Ionic column with a volute capital (a wider cushion block) and an Attic base
    const icol = (F, u, d, y0, y1, r) => { const c = fp(F, u, 0, d); segP(w, [c[0], y0 + 0.5, c[2]], [c[0], y1 - 0.75, c[2]], r, 10, r*0.88);
      fbx(t, F, u - r*1.3, u + r*1.3, y0, y0 + 0.5, d - r*1.3, d + r*1.3); fbx(t, F, u - r*1.55, u + r*1.55, y1 - 0.75, y1 - 0.3, d - r*1.0, d + r*1.0);
      fbx(t, F, u - r*1.3, u + r*1.3, y1 - 0.3, y1, d - r*1.3, d + r*1.3); };
    // ---- masses: the library (main block, the long Fulton wing), the low link, the pavilion ----
    const A0 = [[-51.2, -29.4], [11.3, -29.4], [11.3, -1.0], [42.4, -1.0], [42.4, 23.6], [-51.2, 23.6]];
    const A = A0.concat([[-51.2, 14.0], [-48.4, 14.0], [-48.4, -21.8], [-51.2, -21.8]]);    // the Larkin loggia recessed 2.8 m
    wallsP(t, insetP(A0, -0.3), lo, 0.25); capAny(t, insetP(A0, -0.3), 0.25); bx(t, -51.5, -34.7, lo, 0.25, -31.7, -29.0);
    wallsP(w, A, 0, YA - 0.9); capAny(rf, A, YA - 1.2); wallsP(w, insetP(A, 0.5), YA - 1.2, YA + 0.3); capAny(w, insetP(A, -0.0), YA + 0.3);
    bx(w, -51.2, -35.0, 0, YA + 0.6, -31.4, -29.0);                                                      // NW corner pavilion (2 m proud on McAllister)
    // the Aulenti court skylight and roof lanterns
    bx(sk, -36, -6, YA + 0.3, YA + 1.0, -18, 12); for (let k = 0; k < 5; k++) gabR(sk, null, -36 + k*6, -30 + k*6, -18, 12, YA + 1.0, 1.4, 'z', 0);
    bx(sk, 16, 38, YA + 0.3, YA + 0.9, 4, 19);
    // ---- the Larkin St front (W) ----
    { const F = fc(-51.2, -31.4, -51.2, 23.6), L = F.L, pw = 9.6, n = 7, c0 = pw, cs = (L - 2*pw)/n;
      rust(F, 0, L);
      for (let k = 0; k < n; k++){ const uc = c0 + (k + 0.5)*cs;
        if (k >= 2 && k <= 4){ farch(lit, F, uc, 0.4, 3.2, 4.4, 0.06, 8); fbx(t, F, uc - 2.1, uc + 2.1, 0.4, 0.55, 0.0, 0.3); }
        else farch(win(), F, uc, 1.4, 2.2, 4.3, 0.06, 6);
        const Fw = foff(F, -2.7), ww = Math.min(2.9, cs - 2.4), o = rng() < 0.3 ? lit : dk; frect(o, Fw, uc - ww/2, uc + ww/2, Y1 + 0.9, YC - 1.0, 0.04);
        frect(t, Fw, uc - ww/2 - 0.1, uc + ww/2 + 0.1, Y1 + 5.2, Y1 + 6.0, 0.07); fbx(t, Fw, uc - ww/2 - 0.35, uc + ww/2 + 0.35, YC - 1.0, YC - 0.6, 0.0, 0.25);
        fbal(t, F, c0 + k*cs + 0.95, c0 + (k + 1)*cs - 0.95, Y1, 1.0, -1.1, 0.26, 0.4); }
      fbx(w, F, c0, L - c0, 0, Y1, -2.8, 0.0); fbx(w, F, c0, L - c0, YE, YA + 0.3, -2.8, 0.0);              // base and attic in front of the recessed loggia
      for (let k = 0; k <= n; k++) icol(F, c0 + k*cs, -1.05, Y1, YC, 0.74);
      for (const [u0, u1] of [[0, pw], [L - pw, L]]){ const uc = (u0 + u1)/2;
        fbx(w, F, u0, u1, Y1, YC, -0.02, 0.25); for (const o of [-3.6, 3.6]) fbx(w, F, uc + o - 0.55, uc + o + 0.55, Y1, YC, 0.2, 0.55);
        farch(win(), F, uc, Y1 + 1.6, 2.6, YC - 3.6, 0.3, 8); fbx(t, F, uc - 1.8, uc + 1.8, Y1 + 1.2, Y1 + 1.6, 0.2, 0.6); }
      entab(F, 0, L, -2.8, 0.3);
      // steps to the three portals, down to the plaza
      const gF = Math.min(0, gy(-55, -4)), ns = Math.max(2, Math.min(10, Math.ceil((0.3 - gF)/0.16)));
      for (let k = 0; k < ns; k++) fbx(t, F, c0 + 2*cs - 1.5 - k*0.1, c0 + 5*cs + 1.5 + k*0.1, gF - 1.0, 0.3 - (k + 1)*(0.3 - gF)/ns + 0.16, -0.1 + k*0.35, 0.3 + k*0.35);
    }
    // ---- the Fulton St front (S): engaged Ionic order between arched reading-room windows, end pavilions ----
    { const F = fc(-51.2, 23.6, 42.4, 23.6), L = F.L, pw = 8.0, n = 13, cs = (L - 2*pw)/n;
      rust(F, 0, L);
      for (let k = 0; k < n; k++){ const uc = pw + (k + 0.5)*cs; farch(win(), F, uc, 1.4, 2.0, 4.2, 0.06, 6);
        frect(win(), F, uc - 1.1, uc + 1.1, Y1 + 1.2, Y1 + 4.2, 0.06); farch(rng() < 0.4 ? lit : dk, F, uc, Y1 + 5.0, 2.6, YC - 2.9, 0.06, 8); }
      for (let k = 0; k <= n; k++){ const u = pw + k*cs; fbx(w, F, u - 0.75, u + 0.75, Y1, YC, -0.02, 0.15); icol(F, u, 0.55, Y1, YC, 0.5); }
      for (const [u0, u1] of [[0, pw], [L - pw, L]]){ const uc = (u0 + u1)/2; fbx(w, F, u0, u1, Y1, YC, -0.02, 0.35);
        frect(win(), F, uc - 1.2, uc + 1.2, Y1 + 1.6, Y1 + 5.2, 0.37); farch(win(), F, uc, Y1 + 6.4, 2.4, YC - 3.2, 0.37, 8); }
      entab(F, 0, L, -0.02, 0.95); }
    // ---- the McAllister St front (N) and the NW pavilion: pilasters, windows ----
    { const F = fc(11.3, -29.4, -35.0, -29.4), n = 10, bw = F.L/n; rust(F, 0, F.L); fpil(w, F, 0, F.L, n, Y1, YC, 0.9, 0.3);
      for (let i = 0; i < n; i++){ const uc = (i + 0.5)*bw; farch(win(), F, uc, 1.4, 1.8, 4.2, 0.06, 6); frect(win(), F, uc - 1.0, uc + 1.0, Y1 + 1.2, Y1 + 4.4, 0.05); farch(win(), F, uc, Y1 + 5.4, 2.0, YC - 2.6, 0.05, 6); }
      entab(F, 0, F.L, -0.02, 0.4);
      const Fp = fc(-35.0, -31.4, -51.2, -31.4); rust(Fp, 0, Fp.L); farch(win(), Fp, Fp.L/2, 1.4, 2.4, 4.4, 0.06, 6); farch(win(), Fp, Fp.L/2, Y1 + 1.6, 2.6, YC - 3.4, 0.06, 8);
      fbx(w, Fp, 0.3, 1.5, Y1, YC, -0.02, 0.4); fbx(w, Fp, Fp.L - 1.5, Fp.L - 0.3, Y1, YC, -0.02, 0.4); entab(Fp, 0, Fp.L, -0.02, 0.4);
      for (const Fx of [fc(-35.0, -29.4, -35.0, -31.4)]){ rust(Fx, 0, Fx.L); entab(Fx, 0, Fx.L, -0.02, 0.3); } }
    // ---- the back (Hyde St side of the library, buff brick) ----
    for (const F of [fc(11.3, -1.0, 11.3, -29.4), fc(42.4, 23.6, 42.4, -1.0), fc(42.4, -1.0, 11.3, -1.0)]){
      frect(br, F, 0, F.L, 0.6, YA - 0.9, 0.03); const n = Math.max(1, Math.floor(F.L/4.5));
      for (let i = 0; i < n; i++){ const uc = (i + 0.5)*F.L/n; for (const y of [2.0, 8.4, 13.4, 18.4]) frect(win(), F, uc - 0.75, uc + 0.75, y, y + 3.0, 0.05); } }
    // ---- the low link and the 2023 pavilion on Hyde St ----
    bx(t, 11.3, 18.7, lo, 0.25, -19.7, -1.0); bx(gr, 11.3, 18.7, 0, 6.0, -19.7, -1.0); bx(rf, 11.6, 18.4, 6.0, 6.2, -19.4, -1.3);
    const PV = [[18.7, -15.4], [55.3, -15.4], [55.2, 10.7], [42.4, 10.7], [42.4, -1.0], [18.7, -1.0]], YP = 9.5;
    wallsP(gr, insetP(PV, -0.25), lo, 3.0); capAny(gr, PV, 0.2); wallsP(gr, PV, 0, 3.0);                   // smooth grey granite plinth
    wallsP(tc, PV, 3.0, YP); capAny(rf, PV, YP - 0.2);
    for (const F of polyF(PV)){ for (let y = 3.0; y < YP - 0.1; y += 0.62){ const y1 = Math.min(YP, y + 0.62);
        Q(tc, fp(F, 0, y, 0.0), fp(F, F.L, y, 0.0), fp(F, F.L, y + 0.4, 0.16), fp(F, 0, y + 0.4, 0.16)); Q(tc, fp(F, 0, y + 0.4, 0.16), fp(F, F.L, y + 0.4, 0.16), fp(F, F.L, y1, 0.0), fp(F, 0, y1, 0.0)); }
      fbx(gr, F, -0.1, F.L + 0.1, YP - 0.2, YP + 0.25, -0.1, 0.25); }
    // gem-shaped bay windows (faceted, projecting) on Hyde St and McAllister
    const gem = (F, u, y0, y1, w0, p) => { const a = fp(F, u - w0/2, 0, 0.17), b = fp(F, u - w0/2 + p*0.8, 0, p), c = fp(F, u + w0/2 - p*0.8, 0, p), d = fp(F, u + w0/2, 0, 0.17), ym = (y0 + y1)/2;
      const P2 = [a, b, c, d]; for (let i = 0; i < 3; i++){ const s = P2[i], e = P2[i+1]; Q(gl, [s[0], y0 + 0.6, s[2]], [e[0], y0 + (i === 1 ? 0 : 0.6), e[2]], [e[0], y1 - (i === 1 ? 0 : 0.6), e[2]], [s[0], y1 - 0.6, s[2]]); }
      const cA = fp(F, u, 0, 0.17); T3(tc, [a[0], y0 + 0.6, a[2]], [b[0], y0, b[2]], [cA[0], y0 - 0.5, cA[2]]); T3(tc, [b[0], y0, b[2]], [c[0], y0, c[2]], [cA[0], y0 - 0.5, cA[2]]); T3(tc, [c[0], y0, c[2]], [d[0], y0 + 0.6, d[2]], [cA[0], y0 - 0.5, cA[2]]);
      T3(tc, [a[0], y1 - 0.6, a[2]], [cA[0], y1 + 0.5, cA[2]], [b[0], y1, b[2]]); T3(tc, [b[0], y1, b[2]], [cA[0], y1 + 0.5, cA[2]], [c[0], y1, c[2]]); T3(tc, [c[0], y1, c[2]], [cA[0], y1 + 0.5, cA[2]], [d[0], y1 - 0.6, d[2]]); void ym; };
    { const FH = fc(55.3, -15.4, 55.2, 10.7); gem(FH, 7.0, 3.8, 8.6, 6.0, 1.6); gem(FH, 17.5, 3.8, 8.6, 6.0, 1.6);
      frect(lit, FH, 2.0, 24.0, 0.6, 2.7, 0.05); fbx(gr, FH, 1.5, 24.5, 2.7, 3.0, 0, 1.4);                  // the street-level art wall and its lit overhang
      const FN = fc(18.7, -15.4, 55.3, -15.4); gem(FN, 30.0, 3.8, 8.6, 5.0, 1.3); frect(dk, FN, 2.0, 7.0, 0.3, 4.5, 0.05); }
    // the Art Terrace: glass railings, a pergola-like canopy, the mechanical enclosure (zinc) at the north edge
    { const R2 = loose(g, L2 => { const rl = L2.p(RL); const PI2 = insetP(PV, 0.3); for (const F of polyF(PI2)) frect(rl, F, 0, F.L, YP + 0.25, YP + 1.35, 0); }); void R2; }
    bx(B.p({c:'#77807f', lk:0.3}), 20.0, 36.0, YP - 0.2, YP + 3.0, -15.0, -9.5); for (let x = 20.5; x < 36; x += 0.6) bx(gr, x, x + 0.08, YP + 0.2, YP + 3.0, -15.15, -15.05);
    bx(t, 45.0, 54.0, YP + 0.25, YP + 0.35, -10.5, 5.0); for (const [x, z] of [[45.3, -10.2], [53.7, -10.2], [45.3, 4.7], [53.7, 4.7]]) bx(gr, x - 0.1, x + 0.1, YP + 0.25, YP + 3.2, z - 0.1, z + 0.1);
    bx(gr, 44.8, 54.2, YP + 3.2, YP + 3.45, -10.7, 5.2);
    B.flush(g); return g; }};

// ======================================================================================================================
// CATHEDRAL OF SAINT MARY OF THE ASSUMPTION (1971, Pietro Belluschi and Pier Luigi Nervi, with McSweeney, Ryan & Lee) on
// Cathedral Hill: a 77 m square base on a raised plaza (a garage below); the cupola — eight hyperbolic-paraboloid shells of
// precast concrete, square at the bottom (63 m) and a cross at the top, 58 m above the floor — rests on four corner pylons;
// between the pylons the shells' lower edges arch up over four great windows; the stained-glass slits (Gyorgy Kepes: the four
// elements — water N, earth E, sun S, fire W) run up the middle of each face and across the top as a cross of light; a 17 m
// gold cross on the summit. The parish buildings fill the south of the block (Ellis St side).
// Night: the white shells floodlit, the stained-glass cross and slits glowing, the gold cross lit.
// Local axes: -z = Geary Blvd (N), +x = Gough St (E), +z = Ellis St (S); origin = the cupola axis.
// ======================================================================================================================
LANDMARKS.sfstmarys = {zh:'圣母升天主教座堂', en:'Cathedral of Saint Mary of the Assumption', cat:'new', r:104, h:76,
  lt:{m:0, c:'#f2f4ff', k:1.0, e:0.75},
  build(){
    const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng, gy = siteGY('sfstmarys');
    const SH = {c:'#dedbd3', ds:true}, SL = '#c3bfb6', PY = '#cfc6b4', PZ = {c:'#c9c2b3', lk:0.3}, GW = {c:'#4a5b66', glow:'#ffe2b8', gk:0.45}, MU = '#5d6266',
      GD = {c:'#d6ae4e', glow:'#ffd77a', gk:0.55}, PB = '#cdc8bd', K = '#30353b', L = {c:'#3b3529', glow:'#ffd596', gk:0.6};
    const SG = [{c:'#d4a63a', glow:'#ffcc55', gk:0.8}, {c:'#3d8a52', glow:'#5fd07c', gk:0.7}, {c:'#3f6fb5', glow:'#5f9cff', gk:0.75}, {c:'#b4473a', glow:'#ff6a4f', gk:0.75}];   // S sun, E earth, N water, W fire
    const sh = B.p(SH), sl = B.p(SL), py = B.p(PY), pz = B.p(PZ), gw = B.p(GW), mu = B.p(MU), gd = B.p(GD), pb = B.p(PB), dk = B.p(K), lit = B.p(L);
    const S = 31.5, A = 20.4, HW = 1.5, YT = 57.0, YC = 6.5, YMID = 21.0;
    const rot = (p, k) => { const a = k*HP, c = Math.cos(a), s = Math.sin(a); return [p[0]*c + p[2]*s, p[1], -p[0]*s + p[2]*c]; };
    const ybot = t => YC + (YMID - YC)*(1 - (1 - t)*(1 - t));            // lower edge of a shell: rises from the pylon to the middle of the face
    // ---- the raised plaza (podium over the garage) and the parish buildings on the south of the block ----
    const PL = [[-37.9, -38.1], [39.1, -38.1], [39.1, 49.5], [-37.9, 49.5]], SB = [[-52.7, 49.5], [54.0, 49.5], [54.0, 86.5], [-52.7, 86.4]];
    const lo = minGY(gy, PL.concat(SB, [[0, 0], [0, 70], [-50, 70], [50, 70]])) - 5.0;
    wallsP(pb, PL, lo, 0); capAny(pz, PL, 0.0);
    for (const F of polyF(PL)){ fbx(pb, F, 0, F.L, 0.0, 1.0, -0.4, 0.0); for (let y = lo + 3.2; y < -0.6; y += 3.2) frect(sl, F, 0, F.L, y, y + 0.15, 0.03); }
    // steps from the streets up to the plaza (north: Geary, east: Gough), only where the ground falls away
    for (const [F, um, wd] of [[polyF(PL)[0], 0.5, 20], [polyF(PL)[1], 0.35, 16]]){ const u = F.L*um, c = fp(F, u, 0, 2.5), gF = Math.min(0, gy(c[0], c[2]));
      if (gF < -0.4){ const ns = Math.min(18, Math.ceil(-gF/0.17)); for (let k = 0; k < ns; k++) fbx(pz, F, u - wd/2, u + wd/2, gF - 0.8, -(k + 1)*(-gF)/ns + 0.17 - 0.001, k*0.33 - 0.3, (k + 1)*0.33); } }
    { const YS = 4.2; wallsP(pb, SB, lo, YS); capAny(pz, SB, YS); for (let x = -46; x < 50; x += 12) bx(sl, x, x + 6, YS, YS + 0.9, 58, 78); for (const F of polyF(SB)){ fbx(pb, F, 0, F.L, YS, YS + 0.9, -0.3, 0.05);
      const n = Math.floor(F.L/3.6); for (let i = 0; i < n; i++){ const uc = (i + 0.5)*F.L/n; for (let y = YS - 3.4; y > lo + 1.5; y -= 3.5) { const yy = Math.max(y, gy(fp(F, uc, 0, 0)[0], fp(F, uc, 0, 0)[2]) + 0.8); if (yy < y + 0.01) frect(rng() < 0.3 ? lit : dk, F, uc - 0.9, uc + 0.9, yy, yy + 2.0, 0.05); } } } }
    // planters / trees on the plaza
    for (const [x, z] of [[-34, -34], [35, -34], [-34, 45], [35, 45], [0, 44], [-17, 44], [17, 44]]){ bx(pb, x - 1.6, x + 1.6, 0, 0.8, z - 1.6, z + 1.6); treeP(py, B.p({c:'#4e6b3f', lk:0.2}), x, 0.8, z, 0.9, rng); }
    // ---- the cupola: 8 hyperbolic-paraboloid shells (ruled surfaces), the four pylons, the great windows ----
    const NU = 14, NV = 18;
    for (let k = 0; k < 4; k++) for (const s of [1, -1]){
      const C = [s*S, YC, S], M = [s*HW, YMID, S], O = [s*HW, YT, HW], T = [s*HW, YT, A];
      const P = (u, v) => { const bxp = C[0] + (M[0] - C[0])*u, by = ybot(u), tz = O[2] + (T[2] - O[2])*u;
        return rot([bxp*(1 - v) + s*HW*v, by*(1 - v) + YT*v, S*(1 - v) + tz*v], k); };
      for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++){ const u0 = i/NU, u1 = (i + 1)/NU, v0 = j/NV, v1 = (j + 1)/NV;
        if (s > 0) Q(sh, P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)); else Q(sh, P(u1, v0), P(u0, v0), P(u0, v1), P(u1, v1)); }
      // precast panel joints along some rulings, the thick lower edge, the slit edge and the corner fold
      for (let i = 1; i < NU; i += 2){ const u = i/NU; segP(sl, P(u, 0.02), P(u, 0.985), 0.09, 3); }
      for (let i = 0; i < NU; i++) segP(sl, P(i/NU, 0), P((i + 1)/NU, 0), 0.45, 4);
      segP(sl, P(1, 0), P(1, 1), 0.28, 4); segP(sl, P(0, 0), P(0, 1), 0.35, 4);
      // the great window under the shell's lower edge (glass at the face line, mullions)
      for (let i = 0; i < NU; i++){ const a = P(i/NU, 0), b = P((i + 1)/NU, 0), a0 = rot([s*(S - (S - HW)*i/NU), 0, S - 0.6], k), b0 = rot([s*(S - (S - HW)*(i + 1)/NU), 0, S - 0.6], k);
        const a1 = [a0[0], a[1] - 0.2, a0[2]], b1 = [b0[0], b[1] - 0.2, b0[2]]; if (s > 0) Q(gw, a0, b0, b1, a1); else Q(gw, b0, a0, a1, b1);
        segP(mu, a0, [a0[0], a[1] - 0.2, a0[2]], 0.09, 4); }
      for (let y = 3.0; y < YMID; y += 3.0){ const pts = []; for (let i = 0; i <= NU; i++){ const t = i/NU; if (ybot(t) > y + 0.3) pts.push(rot([s*(S - (S - HW)*t), y, S - 0.55], k)); }
        for (let i = 0; i < pts.length - 1; i++) segP(mu, pts[i], pts[i + 1], 0.07, 3); }
      // doors at the foot of the window (bronze)
      { const d0 = rot([s*0.05, 0, S - 0.45], k), d1 = rot([s*(HW + 3.5), 0, S - 0.45], k); Q(dk, d0, d1, [d1[0], 4.2, d1[2]], [d0[0], 4.2, d0[2]]); }
    }
    for (let k = 0; k < 4; k++){
      // the corner pylon (tapering, rising to the shells' corners)
      const c = rot([S, 0, S], k), cx = c[0], cz = c[2], d = rot([1, 0, 1], k), dx = d[0]/Math.SQRT2, dz = d[2]/Math.SQRT2;
      { const P1 = rot([38.3, 0, 38.3], k), P2 = rot([38.3, 0, 27.5], k), P3 = rot([27.5, 0, 27.5], k), P4 = rot([27.5, 0, 38.3], k), TP = rot([S + 0.2, YC + 0.5, S + 0.2], k);
        T3(py, P1, P2, TP); T3(py, P2, P3, TP); T3(py, P3, P4, TP); T3(py, P4, P1, TP);         // the corner pylon: a massive foot out to the 255 ft (77.7 m) square
        for (const [a, b] of [[P1, P2], [P2, P3], [P3, P4], [P4, P1]]) Q(py, [a[0], lo, a[2]], [b[0], lo, b[2]], b, a); void cx; void cz; void dx; void dz; }
      // the glazing under the foot of the slit, between the two halves of the great window
      { const a0 = rot([-HW, 0, S - 0.6], k), b0 = rot([HW, 0, S - 0.6], k); Q(gw, a0, b0, [b0[0], YMID - 0.2, b0[2]], [a0[0], YMID - 0.2, a0[2]]);
        segP(mu, a0, [a0[0], YMID - 0.2, a0[2]], 0.12, 4); segP(mu, b0, [b0[0], YMID - 0.2, b0[2]], 0.12, 4); }
      // the stained-glass slit up the middle of the face, then across the top (the arm of the cross)
      const sg = B.p(SG[k]), a = rot([-HW, YMID, S], k), b = rot([HW, YMID, S], k), e = rot([HW, YT, A], k), f = rot([-HW, YT, A], k);
      Q(sg, a, b, e, f); for (let y = YMID + 3; y < YT; y += 3.4){ const t = (y - YMID)/(YT - YMID), z = S + (A - S)*t; segP(sl, rot([-HW, y, z], k), rot([HW, y, z], k), 0.08, 3); }
      const g0 = rot([-HW, YT, A], k), g1 = rot([HW, YT, A], k), g2 = rot([HW, YT, HW], k), g3 = rot([-HW, YT, HW], k), m0 = rot([0, YT + 1.1, A], k), m1 = rot([0, YT + 1.1, HW], k);
      Q(sg, g0, g1, m0, m0); Q(sg, g1, g2, m1, m0); Q(sg, g3, g0, m0, m1); Q(sg, g2, g3, m1, m1);
      Q(sl, rot([-HW, YT + 0.0, A], k), rot([HW, YT, A], k), rot([HW, YT - 1.0, A + 0.15], k), rot([-HW, YT - 1.0, A + 0.15], k));
      segP(sl, rot([-HW, YT, A], k), rot([-HW, YT, HW], k), 0.18, 4); segP(sl, rot([HW, YT, A], k), rot([HW, YT, HW], k), 0.18, 4);
    }
    // the crossing of the cross of light, the base of the gold cross
    latheP(B.p(SG[0]), [[2.1, YT + 0.6], [1.2, YT + 1.6], [0.01, YT + 1.8]], 0, 0, 4, PI/4);
    bx(gd, -1.0, 1.0, YT + 1.2, YT + 2.2, -1.0, 1.0);
    bx(gd, -0.38, 0.38, YT + 2.2, YT + 18.6, -0.38, 0.38); bx(gd, -3.0, 3.0, YT + 13.4, YT + 14.2, -0.36, 0.36);
    B.flush(g); return g; }};

// ======================================================================================================================
// PEACE PAGODA, Japantown (1968, Yoshiro Taniguchi; a gift of Osaka): a circular-plan pagoda of reinforced concrete, 30.5 m
// (100 ft) — a core of twelve white concrete posts with dark infill, five broad conical roofs clad in copper (46 ft down to
// 34 ft across) carried on exposed radiating concrete beams like rafters, and the nine-ringed gilded bronze spire (kurin) with
// the flaming jewel (hoshu); a five-sided concrete podium with steps in the Peace Plaza (over the Japan Center garage).
// Night: floodlit (warm white), the spire catching the light.
// Local axes: -z = Post St (N), +z = Geary Blvd (S); origin = the pagoda axis.
// ======================================================================================================================
LANDMARKS.sfpagoda = {zh:'和平塔', en:'Peace Pagoda', cat:'old', r:13, h:31,
  lt:{m:0, c:'#fff0d8', k:1.1, e:0.7},
  build(){
    const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng, gy = siteGY('sfpagoda');
    const WC = '#e6e2d9', DC = {c:'#383c3f', lk:0.2}, CP = {c:'#4d5c53', lk:0.55}, GD = {c:'#cfa448', glow:'#ffd27a', gk:0.25}, PD = '#c9c3b6', SL = '#8c8a84';
    const wc = B.p(WC), dc = B.p(DC), cp = B.p(CP), gd = B.p(GD), pd = B.p(PD), sl = B.p(SL);
    // ---- podium: outer platform (3 steps), the five-sided podium (3 outer + 2 inner steps), down to the plaza ----
    const lo = Math.min(0, minGY(gy, [[0, 0], [11, 0], [-11, 0], [0, 11], [0, -11], [8, 8], [-8, 8], [8, -8], [-8, -8]])) - 4.0;
    const pent = (R, a0) => { const P = []; for (let i = 0; i < 5; i++){ const a = a0 + i/5*TAU; P.push([Math.cos(a)*R, Math.sin(a)*R]); } return P; };
    const a0 = -HP;                                                   // one point of the pentagon to the north (Post St)
    let y = 0;
    for (const [R, h] of [[11.4, 0.17], [11.0, 0.17], [10.6, 0.17]]){ const P = pent(R, a0); wallsP(pd, P, lo, y + h); capAny(pd, P, y + h); y += h; }
    for (const [R, h] of [[9.6, 0.18], [9.2, 0.18], [8.8, 0.18], [7.6, 0.18], [7.2, 0.18]]){ const P = pent(R, a0); wallsP(pd, P, y - 0.1, y + h); capAny(pd, P, y + h); y += h; }
    const Y0 = y;                                                     // podium top (~1.4 m)
    for (const F of polyF(pent(10.6, a0))) frect(sl, F, 0.8, F.L - 0.8, Y0 - 1.25, Y0 - 1.0, 0.02);
    // ---- the core: twelve white posts and dark infill, up to the top roof ----
    const RC = 2.15, YT = Y0 + 19.0;
    latheP(dc, [[RC - 0.35, Y0], [RC - 0.35, YT]], 0, 0, 12);
    for (let i = 0; i < 12; i++){ const a = (i + 0.5)/12*TAU; rbx(wc, Math.cos(a)*RC, Math.sin(a)*RC, 0.5, 0.42, Y0, YT + 0.4, -a); }
    // ---- five conical copper roofs on radiating concrete beams ----
    const eaves = [3.4, 7.0, 10.6, 14.2, 17.8].map(e => Y0 + e), RR = [7.0, 6.55, 6.1, 5.65, 5.2];
    eaves.forEach((ye, k) => { const R = RR[k], yc = ye + 1.35;
      // roof: slightly upswept copper cone with a thick fascia; underside white concrete
      latheP(cp, [[R + 0.05, ye - 0.05], [R, ye + 0.3], [R - 0.6, ye + 0.38], [R - 2.0, ye + 0.72], [RC + 0.2, yc]], 0, 0, 40);
      latheP(wc, [[RC + 0.1, ye - 0.25], [R - 0.4, ye - 0.22], [R + 0.05, ye - 0.05]], 0, 0, 40);
      latheP(cp, [[R + 0.05, ye - 0.05], [R + 0.05, ye - 0.28], [R - 0.35, ye - 0.28]], 0, 0, 40);
      for (let i = 0; i < 24; i++){ const a = (i + 0.5)/24*TAU, ca = Math.cos(a), sa = Math.sin(a);
        segP(wc, [ca*RC, ye - 1.05, sa*RC], [ca*(R - 0.5), ye - 0.3, sa*(R - 0.5)], 0.13, 4, 0.1); }
      // a ring beam under each roof where the rafters leave the core
      latheP(wc, [[RC + 0.35, ye - 1.3], [RC + 0.35, ye - 0.6], [RC, ye - 0.6]], 0, 0, 12);
    });
    // ---- the kurin: base (roban), nine gilded rings on the mast, water flame and the flaming jewel to 30.5 m ----
    const yk = YT + 0.4, top = Y0 - 1.4 + 30.5;
    latheP(wc, [[1.3, yk], [1.3, yk + 0.6], [1.0, yk + 0.6], [0.95, yk + 1.1], [0.01, yk + 1.1]], 0, 0, 8);
    latheP(gd, [[0.75, yk + 1.1], [0.85, yk + 1.5], [0.55, yk + 1.7], [0.18, yk + 1.75]], 0, 0, 12);
    segP(gd, [0, yk + 1.7, 0], [0, top - 2.0, 0], 0.13, 6);
    const r0 = yk + 2.1, r1 = top - 3.0; for (let i = 0; i < 9; i++){ const yy = r0 + i*(r1 - r0)/8, rr = 0.82 - i*0.025; latheP(gd, [[0.14, yy - 0.08], [rr, yy - 0.05], [rr, yy + 0.05], [0.14, yy + 0.08]], 0, 0, 14); }
    for (let i = 0; i < 4; i++){ const a = i*HP + PI/4; segP(gd, [Math.cos(a)*0.2, top - 2.7, Math.sin(a)*0.2], [Math.cos(a)*0.65, top - 1.6, Math.sin(a)*0.65], 0.08, 3, 0.02); }
    latheP(gd, [[0.01, top - 1.6], [0.32, top - 1.2], [0.36, top - 0.8], [0.18, top - 0.45], [0.06, top - 0.3], [0.12, top - 0.2], [0.01, top]], 0, 0, 10);
    B.flush(g); return g; }};

// ======================================================================================================================
// MISSION DOLORES (Mission San Francisco de Asís): the adobe mission church (1791) — whitewashed adobe walls 1.2 m thick, a
// tiled gable roof on redwood beams, the facade with four columns below and above, a balcony and three bells in the upper
// openings — and beside it, on the corner of 16th St, the Mission Dolores Basilica (1913-18, remodelled 1926 in the
// Churrigueresque manner): cream stucco, twin bell towers with open belfries, domes and lanterns, the richly carved portal
// and the curvilinear central gable, a red tile roof over the nave and the wider body, the apse to the west.
// Night: floodlit warm white.
// Local axes: +x = Dolores St (E, both fronts), -z = 16th St (N); origin = the basilica (the old mission stands at +z, its
// own axis turned 3.4 degrees, as in the real plan).
// ======================================================================================================================
LANDMARKS.sfmission = {zh:'多洛雷斯传教站', en:'Mission Dolores', cat:'old', r:46, h:35,
  lt:{m:0, c:'#ffe9c9', k:0.9, e:0.6},
  build(){
    const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng, gy = siteGY('sfmission');
    const CR = '#e4d8c0', CT = '#d1c2a4', AD = '#f0ece3', AT = '#e1dacb', TL = {c:'#a5583d', lk:0.35}, WD = '#5b3f2b', K = '#2f3236',
      L = {c:'#3b3529', glow:'#ffd596', gk:0.6}, BZ = {c:'#7a6440', lk:0.6}, SG = {c:'#4a5568', glow:'#ffb870', gk:0.4}, DM = '#d9cdb5', GD = {c:'#cfa448', lk:0.8};
    const cr = B.p(CR), ct = B.p(CT), tl = B.p(TL), wd = B.p(WD), dk = B.p(K), lit = B.p(L), sg = B.p(SG), dm = B.p(DM), gd = B.p(GD);
    const lo = minGY(gy, [[-30, -16], [28.6, -16], [28.6, 11], [-30, 18], [0, 0], [30, 30], [-15, 30], [-26, 27]]) - 5.0;
    // ================= the basilica =================
    const FB = Math.min(0, gy(30.5, -1.7)) + 0.9, CZ = -1.7;            // floor level (a few steps above Dolores St), axis
    const YE = FB + 14.0, YR = FB + 19.0;
    const BODY = [[-27.5, -15.7], [8.2, -15.7], [8.2, 12.0], [-27.5, 12.0]], NAVE = [[8.2, -12.15], [22.0, -12.15], [22.0, 8.6], [8.2, 8.6]];
    wallsP(ct, insetP(BODY, -0.3), lo, FB); wallsP(ct, insetP(NAVE, -0.3), lo, FB);
    wallsP(cr, BODY, FB, YE); wallsP(cr, NAVE, FB, YE - 1.0);
    gabR(tl, cr, -27.8, 8.4, -16.3, 12.6, YE, 5.6, 'x', 0.0); gabR(tl, cr, 8.2, 22.2, -12.7, 9.15, YE - 1.0, 4.9, 'x', 0.0);
    // the apse (half-round, conical tile roof) and the south-west chapel
    { const AP = []; for (let i = 0; i <= 8; i++){ const a = PI - 0.86 + 1.72*i/8; AP.push([-22.45 + Math.cos(a)*7.75, CZ + 0.3 + Math.sin(a)*7.75]); }   // shallow segmental apse (OSM)
      const APc = AP.slice().reverse(); wallsP(ct, APc, lo, FB); wallsP(cr, APc, FB, YE - 2.0); capAny(cr, APc, YE - 2.0);
      for (let i = 0; i < AP.length - 1; i++) T3(tl, [AP[i][0] - 0.4*Math.cos(PI - 0.86 + 1.72*i/8), YE - 2.0, AP[i][1]], [AP[i + 1][0] - 0.4*Math.cos(PI - 0.86 + 1.72*(i + 1)/8), YE - 2.0, AP[i + 1][1]], [-27.5, YE + 1.0, CZ]); }
    bx(ct, -27.8, -16.9, lo, FB, 11.8, 17.9); bx(cr, -27.5, -17.2, FB, FB + 8.5, 12.0, 17.6); gabR(tl, cr, -27.7, -17.0, 11.8, 17.8, FB + 8.5, 2.6, 'z', 0.3);
    // side walls: buttress pilasters and tall round-headed stained-glass windows, cornice
    for (const F of [fc(8.2, -15.7, -27.5, -15.7), fc(-27.5, 12.0, 8.2, 12.0), fc(22.0, -12.15, 8.2, -12.15), fc(8.2, 8.6, 22.0, 8.6)]){
      const n = Math.max(1, Math.round(F.L/6.0)); fpil(cr, F, 0.3, F.L - 0.3, n, FB, F.L > 20 ? YE : YE - 1.0, 1.1, 0.45);
      for (let i = 0; i < n; i++){ const uc = 0.3 + (i + 0.5)*(F.L - 0.6)/n; farch(sg, F, uc, FB + 4.0, 2.0, (F.L > 20 ? YE : YE - 1.0) - 3.6, 0.05, 6); }
      fbx(ct, F, -0.2, F.L + 0.2, (F.L > 20 ? YE : YE - 1.0) - 0.7, F.L > 20 ? YE : YE - 1.0, -0.02, 0.45); }
    // the west front of the body (behind the apse)
    { const F = fc(-27.5, -15.7, -27.5, 12.0); fbx(ct, F, -0.2, F.L + 0.2, YE - 0.7, YE, -0.02, 0.45); }
    // ---- the front: narthex block, twin towers, the portal and the curvilinear gable ----
    const XF0 = 22.0, XF1 = 28.6, ZT = [[-14.1, -7.5], [4.1, 10.7]];
    bx(ct, XF0, XF1 + 0.3, lo, FB, -14.4, 11.0); bx(cr, XF0, XF1, FB, YE + 1.0, -14.1, 10.7);
    const FF = fc(XF1, 10.7, XF1, -14.1), um = 10.7 - CZ;                  // front face, u from the south tower (z = 10.7) to the north
    // central gable: curvilinear (scrolls) parapet with a niche and a cross
    { const prof = []; const hw = 7.6, hb = YE + 1.0, ht = FB + 23.2;
      for (let i = 0; i <= 12; i++){ const t = i/12, u = -hw + 2*hw*t, a = Math.abs(u)/hw; const yy = hb + (ht - hb)*(a < 0.3 ? 1 : a < 0.62 ? 0.86 - (a - 0.3)*0.9 : 0.57 - (a - 0.62)*1.5); prof.push([u, yy]); }
      for (let i = 0; i < prof.length - 1; i++){ const [u0, y0] = prof[i], [u1, y1] = prof[i + 1]; Q(cr, fp(FF, um + u0, hb, -0.6), fp(FF, um + u1, hb, -0.6), fp(FF, um + u1, y1, -0.6), fp(FF, um + u0, y0, -0.6));
        Q(cr, fp(FF, um + u0, y0, -0.6), fp(FF, um + u1, y1, -0.6), fp(FF, um + u1, y1, -1.6), fp(FF, um + u0, y0, -1.6)); fbx(ct, FF, um + Math.min(u0, u1) - 0.1, um + Math.max(u0, u1) + 0.1, Math.min(y0, y1) - 0.1, Math.max(y0, y1) + 0.25, -1.7, -0.35); }
      Q(cr, fp(FF, um - hw, hb, -1.6), fp(FF, um + hw, hb, -1.6), fp(FF, um + hw, hb, -0.6), fp(FF, um - hw, hb, -0.6));
      segP(gd, fp(FF, um, ht, -1.1), fp(FF, um, ht + 2.4, -1.1), 0.1, 4); segP(gd, fp(FF, um - 0.7, ht + 1.7, -1.1), fp(FF, um + 0.7, ht + 1.7, -1.1), 0.08, 4);
      farch(dk, FF, um, ht - 4.0, 1.1, ht - 2.4, -0.55, 6); }
    // the Churrigueresque frontispiece: estipite pilasters, the arched portal, a round window, carved panels
    { fbx(ct, FF, um - 5.2, um + 5.2, FB, YE + 0.6, -0.02, 0.5);
      for (const o of [-4.4, -2.9, 2.9, 4.4]){ for (let y = FB + 0.4; y < YE; y += 2.2){ fbx(cr, FF, um + o - 0.45, um + o + 0.45, y, y + 1.1, 0.4, 0.9); fbx(ct, FF, um + o - 0.3, um + o + 0.3, y + 1.1, y + 2.2, 0.4, 0.75); } }
      farch(wd, FF, um, FB, 3.0, FB + 4.8, 0.52, 8); fbx(ct, FF, um - 2.2, um + 2.2, FB + 6.6, FB + 7.2, 0.4, 1.0);
      fdisc(sg, FF, um, FB + 10.0, 1.6, 0.52, 14); latheP(ct, [[1.95, 0], [1.95, 0.0001]], 0, 0, 3);
      for (const y of [FB + 7.6, FB + 12.4]) fbx(ct, FF, um - 2.2, um + 2.2, y, y + 0.9, 0.5, 0.8); }
    // the towers: shafts, open belfries, cornices, domes, lanterns, crosses
    for (const [z0, z1] of ZT){ const cz = (z0 + z1)/2, cx = (XF0 + XF1)/2, w = z1 - z0, YT1 = FB + 19.5, YT2 = FB + 25.4;
      bx(cr, XF0, XF1, FB, YT1, z0, z1); bx(ct, XF0 - 0.3, XF1 + 0.3, YT1 - 0.6, YT1, z0 - 0.3, z1 + 0.3);
      for (const F of [fc(XF1, z1, XF1, z0), fc(XF0, z0, XF1, z0), fc(XF1, z1, XF0, z1)]) farch(sg, F, F.L/2, FB + 9.5, 1.2, FB + 12.6, 0.05, 6);
      // belfry: corner piers and arched openings on all four sides
      const b0 = cx - 2.6, b1 = cx + 2.6, c0 = cz - 2.6, c1 = cz + 2.6;
      for (const [x, z] of [[b0, c0], [b1, c0], [b1, c1], [b0, c1]]) bx(cr, x - 0.75, x + 0.75, YT1, YT2, z - 0.75, z + 0.75);
      for (const F of [fc(b1, c1, b1, c0), fc(b0, c0, b1, c0), fc(b1, c1, b0, c1), fc(b0, c0, b0, c1)]){ farcade(cr, F, 0.75, F.L - 0.75, 1, YT1, YT2 - 2.6, YT2, 0.0, -0.4, 0.4, 6); }
      bx(dk, b0 + 0.2, b1 - 0.2, YT1, YT2 - 1.2, c0 + 0.2, c1 - 0.2);
      latheP(B.p(BZ), [[0.01, YT1 + 2.2], [0.9, YT1 + 2.4], [1.1, YT1 + 3.4], [0.5, YT1 + 4.0], [0.01, YT1 + 4.1]], cx, cz, 8);
      bx(ct, b0 - 1.0, b1 + 1.0, YT2, YT2 + 0.8, c0 - 1.0, c1 + 1.0);
      for (const [x, z] of [[b0 - 0.6, c0 - 0.6], [b1 + 0.6, c0 - 0.6], [b1 + 0.6, c1 + 0.6], [b0 - 0.6, c1 + 0.6]]) latheP(ct, [[0.45, YT2 + 0.8], [0.35, YT2 + 1.6], [0.01, YT2 + 2.6]], x, z, 6);
      latheP(cr, [[2.9, YT2 + 0.8], [2.9, YT2 + 1.8], [2.6, YT2 + 1.8]], cx, cz, 8, PI/8);
      latheP(dm, [[2.75, YT2 + 1.8], [2.6, YT2 + 3.0], [2.1, YT2 + 4.0], [1.2, YT2 + 4.7], [0.6, YT2 + 4.95]], cx, cz, 16);
      latheP(cr, [[0.6, YT2 + 4.95], [0.6, YT2 + 6.2], [0.8, YT2 + 6.3], [0.3, YT2 + 6.9], [0.05, YT2 + 7.2]], cx, cz, 8);
      segP(gd, [cx, YT2 + 7.1, cz], [cx, YT2 + 9.0, cz], 0.08, 4); segP(gd, [cx, YT2 + 8.4, cz - 0.55], [cx, YT2 + 8.4, cz + 0.55], 0.06, 4); }
    // front steps down to the sidewalk
    { const gF = Math.min(FB, gy(31.5, CZ)), ns = Math.max(2, Math.ceil((FB - gF)/0.17));
      for (let k = 0; k < ns; k++) fbx(ct, FF, um - 4.5 - k*0.05, um + 4.5 + k*0.05, gF - 0.8, FB - (k + 1)*(FB - gF)/ns + 0.17 - 0.001, k*0.32 - 0.02, (k + 1)*0.32); }
    // ================= the old mission (its own frame, 3.4 degrees turned) =================
    { const d = 0.0602, OX = 9.12, OZ = 21.90, c = Math.cos(d), s = Math.sin(d), O = xfB(B, d, OX, OZ);
      const gyO = (x, z) => gy(OX + x*c + z*s, OZ - x*s + z*c);
      const ad = O.p(AD), at = O.p(AT), tl2 = O.p(TL), wd2 = O.p(WD), dk2 = O.p(K), bz = O.p(BZ);
      const X0 = -21.0, X1 = 23.4, Z0 = -7.1, Z1 = 3.5, ZC = (Z0 + Z1)/2,                   // walls (the OSM outline is the roof: eaves 0.9 m out)
            FO = Math.min(0, gyO(25.5, ZC)) + 0.25, YE2 = FO + 7.2, YR2 = FO + 10.6;
      bx(at, X0 - 0.2, X1 + 0.2, lo, FO, Z0 - 0.2, Z1 + 0.2); bx(ad, X0, X1, FO, YE2, Z0, Z1);
      gabR(tl2, ad, X0 - 0.8, X1 + 0.7, Z0 - 0.9, Z1 + 0.9, YE2, YR2 - YE2, 'x', 0);
      for (let x = X0; x < X1; x += 0.9) for (const z of [Z0 - 0.5, Z1 + 0.5]) bx(wd2, x, x + 0.18, YE2 - 0.35, YE2 - 0.1, z - 0.4, z + 0.4);   // beam ends under the eaves
      // side walls: small deep windows, a buttress
      for (const F of [fc(X1, Z0, X0, Z0), fc(X0, Z1, X1, Z1)]){ for (let u = 6; u < F.L - 4; u += 8.5) frect(dk2, F, u - 0.5, u + 0.5, FO + 3.0, FO + 4.6, 0.04); fbx(at, F, F.L/2 - 1.0, F.L/2 + 1.0, FO, FO + 5.2, -0.02, 1.4); }
      // the facade (E): gable wall, four columns below and above, the cornices, balcony, three bells, the door
      const F = fc(X1, Z1, X1, Z0), L = F.L, uc = L/2;
      Q(ad, fp(F, 0, YE2, 0), fp(F, L, YE2, 0), fp(F, uc, YR2 - 0.1, 0), fp(F, uc, YR2 - 0.1, 0));
      Q(ad, fp(F, 0, YE2, 0.6), fp(F, L, YE2, 0.6), fp(F, uc, YR2 - 0.4, 0.6), fp(F, uc, YR2 - 0.4, 0.6)); fbx(ad, F, 0, L, FO, YE2, 0, 0.6);
      for (const u of [1.3, 3.9, L - 3.9, L - 1.3]){ const p = fp(F, u, 0, 0.85); segP(at, [p[0], FO, p[2]], [p[0], FO + 4.6, p[2]], 0.34, 8); fbx(at, F, u - 0.5, u + 0.5, FO, FO + 0.5, 0.35, 1.35);
        segP(at, [p[0], FO + 5.3, p[2]], [p[0], FO + 8.2, p[2]], 0.26, 8); }
      fbx(at, F, -0.1, L + 0.1, FO + 4.6, FO + 5.3, 0.4, 1.6); fbx(at, F, 0.4, L - 0.4, FO + 8.2, FO + 8.7, 0.3, 1.25);
      fbx(wd2, F, 0.6, L - 0.6, FO + 6.15, FO + 6.3, 1.25, 1.45); for (let u = 0.8; u < L - 0.6; u += 0.42) fbx(wd2, F, u - 0.05, u + 0.05, FO + 5.3, FO + 6.15, 1.3, 1.4);
      for (const u of [2.6, uc, L - 2.6]){ farch(dk2, F, u, FO + 5.7, 1.4, FO + 7.3, 0.62, 6); const p = fp(F, u, 0, 0.4); latheP(bz, [[0.01, FO + 6.0], [0.42, FO + 6.1], [0.33, FO + 6.6], [0.15, FO + 7.0], [0.01, FO + 7.05]], p[0], p[2], 8); }
      frect(wd2, F, uc - 1.2, uc + 1.2, FO, FO + 3.7, 0.62); fbx(at, F, uc - 1.5, uc + 1.5, FO + 3.7, FO + 4.0, 0.6, 0.85);
      gabR(tl2, null, X1 - 0.2, X1 + 1.5, Z0 - 0.9, Z1 + 0.9, YE2 + 0.25, YR2 - YE2, 'x', 0);
      // the low annex at the south-east (the entrance / museum)
      bx(at, 12.1, 22.1, lo, FO, Z1, 8.6); bx(ad, 12.1, 22.1, FO, FO + 4.4, Z1, 8.6); gabR(tl2, ad, 11.9, 22.3, Z1, 8.8, FO + 4.4, 1.4, 'x', 0.3);
      { const Fa = fc(22.1, 8.6, 22.1, Z1); frect(wd2, Fa, 1.5, 3.3, FO, FO + 2.6, 0.04); frect(dk2, Fa, 3.6, 4.4, FO + 1.2, FO + 2.6, 0.04); }
    }
    // the parish building between the basilica and the old mission's rear (flat roof)
    bx(ct, -26.5, -17.3, lo, FB, 18.7, 26.8); bx(cr, -26.3, -17.5, FB, FB + 10.7, 18.9, 26.6); bx(B.p({c:'#9b9890', lk:0.15}), -26.0, -17.8, FB + 10.7, FB + 10.9, 19.2, 26.3);
    for (const F of polyF([[-26.3, 18.9], [-17.5, 18.9], [-17.5, 26.6], [-26.3, 26.6]])) for (let u = 1.4; u < F.L - 1; u += 2.4) for (const y of [FB + 2.0, FB + 5.6, FB + 8.6]) frect(rng() < 0.3 ? lit : dk, F, u - 0.5, u + 0.5, y, y + 1.6, 0.04);
    B.flush(g); return g; }};

for (const k of Object.keys(PLACE)) if (LANDMARKS[k]) SG_PLACES.push({type:k, lat:PLACE[k].lat, lon:PLACE[k].lon, rot:PLACE[k].rot});
}
