// GENERATED from hk/midlevels/midlevels.js by gbareal/tools/mkhklm.py - do not edit
// ===== City Brush v37 — Hong Kong landmarks: Mid-Levels (hk_b). Real OSM footprints, rot 0 (local x east, z south); every part stands
// on the real ground (hC), so the slopes of the Mid-Levels and the Peak are followed. No logos, names or signage.
{
/* gba: this module runs in the Hong Kong frame (x_gba = x_hk + 7000.0, y_gba = y_hk + -35000.0): frame shims (gbareal/tools/mkhklm.py) */
const sgXY = (lat, lon) => { const q = _gbaXY(lat, lon); return [q[0] - 7000.0, q[1] - -35000.0]; };
const hC = (x, y) => _gbaHC(x + 7000.0, y + -35000.0), hAt = (x, y) => _gbaHAt(x + 7000.0, y + -35000.0);
const SGRoads = _gbaRoadsHK;

// ---------- shared helpers (hk_b: Mid-Levels and the Peak) ----------
const PI = Math.PI, TAU = PI*2, HP = PI/2, D2R = PI/180;
// the app puts a landmark's y = 0 on the highest ground within r (+0.6 m); gl(x, z) = the real ground there in local metres
// (rot is always 0 here, so local x = east, z = south). Outside the app (model-only kit) the ground is flat.
const mkGround = (lat, lon, r) => {
  if (typeof hC !== 'function' || typeof sgXY !== 'function') return {gl:() => 0, top:0, flat:true};
  const q = sgXY(lat, lon), X = q[0], Y = q[1]; let hi = -Infinity;
  for (let a = 0; a < 12; a++) for (const f of [0, 0.35, 0.7]) hi = Math.max(hi, hC(X + Math.cos(a/12*TAU)*r*f, Y + Math.sin(a/12*TAU)*r*f));
  const top = hi + 0.6; return {gl:(x, z) => hC(X + x, Y - z) - top, top, flat:false};
};
// batches of raw triangles per colour spec (one LTris per spec)
const mkBatch = () => { const m = new Map(); return {
  a(col){ let v = m.get(col); if (!v){ v = []; m.set(col, v); } return v; },
  flush(g){ for (const [c, v] of m) if (v.length) LTris(g, v, c); m.clear(); }}; };
const quad = (a, p, q, r, s) => { a.push(p[0], p[1], p[2], q[0], q[1], q[2], r[0], r[1], r[2], p[0], p[1], p[2], r[0], r[1], r[2], s[0], s[1], s[2]); };
const tri3 = (a, p, q, r) => { a.push(p[0], p[1], p[2], q[0], q[1], q[2], r[0], r[1], r[2]); };
// frame: local (s, t) along / across an axis at angle ang (radians, CCW from east seen from above) round (cx, cz) -> local [x, z]
const F = (cx, cz, ang) => { const c = Math.cos(ang), s = Math.sin(ang); return (u, v) => [cx + u*c + v*s, cz - u*s + v*c]; };
const toFrame = (ring, ang, cx, cz) => { const c = Math.cos(ang), s = Math.sin(ang); return ring.map(p => { const dx = p[0] - (cx || 0), dz = p[1] - (cz || 0); return [dx*c - dz*s, dx*s + dz*c]; }); };
const bbox = P => { let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity; for (const p of P){ a = Math.min(a, p[0]); b = Math.min(b, p[1]); c = Math.max(c, p[0]); d = Math.max(d, p[1]); } return [a, b, c, d]; };
const cen = P => { let x = 0, z = 0; for (const p of P){ x += p[0]; z += p[1]; } return [x/P.length, z/P.length]; };
const sarea = P => { let s = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) s += (P[j][0] - P[i][0])*(P[j][1] + P[i][1]); return s/2; };
const inPoly = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0])*(z - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; };
// oriented box: centre (cx, cz), axis angle ry, length L (along), width W (across), from y0 to y1; bottom face omitted
function obox(a, cx, cz, ry, L, W, y0, y1, bottom){
  const f = F(cx, cz, ry), hl = L/2, hw = W/2, P = [f(-hl, -hw), f(hl, -hw), f(hl, hw), f(-hl, hw)];
  for (let i = 0; i < 4; i++){ const p = P[i], q = P[(i + 1) % 4]; quad(a, [p[0], y0, p[1]], [q[0], y0, q[1]], [q[0], y1, q[1]], [p[0], y1, p[1]]); }
  quad(a, [P[0][0], y1, P[0][1]], [P[1][0], y1, P[1][1]], [P[2][0], y1, P[2][1]], [P[3][0], y1, P[3][1]]);
  if (bottom) quad(a, [P[0][0], y0, P[0][1]], [P[3][0], y0, P[3][1]], [P[2][0], y0, P[2][1]], [P[1][0], y0, P[1][1]]);
}
// box given in a frame f (u, v centre), length along u, width along v
const fbox = (a, f, ang, u, v, L, W, y0, y1) => { const c = f(u, v); obox(a, c[0], c[1], ang, L, W, y0, y1); };
// prism over a plan ring (local [x, z]), walls + optional top cap
function prism(a, P, y0, y1, cap, bot){
  const n = P.length;
  for (let i = 0; i < n; i++){ const p = P[i], q = P[(i + 1) % n]; quad(a, [p[0], y0, p[1]], [q[0], y0, q[1]], [q[0], y1, q[1]], [p[0], y1, p[1]]); }
  if (cap !== false) capP(a, P, y1);
  if (bot) capP(a, P, y0);
}
function capP(a, P, y){
  const V = P.map(p => new THREE.Vector2(p[0], p[1])), T = THREE.ShapeUtils.triangulateShape(V, []);
  for (const t of T) tri3(a, [P[t[0]][0], y, P[t[0]][1]], [P[t[1]][0], y, P[t[1]][1]], [P[t[2]][0], y, P[t[2]][1]]);
}
// cap a ring whose points carry their own heights ([x, y, z])
function capP3(a, P){ const V = P.map(p => new THREE.Vector2(p[0], p[2])), T = THREE.ShapeUtils.triangulateShape(V, []); for (const t of T) tri3(a, P[t[0]], P[t[1]], P[t[2]]); }
// offset a ring outward (+d) / inward (-d) (simple miter, fine for convex-ish plans)
function offsetRing(P, d){
  const n = P.length, s = sarea(P) > 0 ? 1 : -1, out = [];
  for (let i = 0; i < n; i++){
    const p = P[(i + n - 1) % n], q = P[i], r = P[(i + 1) % n];
    const n1 = nrm(p, q, s), n2 = nrm(q, r, s); let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
    const k = Math.max(0.35, mx*n1[0] + mz*n1[1]); out.push([q[0] + mx*d/k, q[1] + mz*d/k]);
  }
  return out;
}
// outward unit normal of edge p->q for a ring of orientation s
const nrm = (p, q, s) => { const dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz) || 1; return s > 0 ? [dz/l, -dx/l] : [-dz/l, dx/l]; };
// lowest ground under a ring (its corners and edge midpoints), in local metres
const lowUnder = (gl, P) => { let m = Infinity; for (let i = 0; i < P.length; i++){ const p = P[i], q = P[(i + 1) % P.length]; m = Math.min(m, gl(p[0], p[1]), gl((p[0] + q[0])/2, (p[1] + q[1])/2)); } return m; };
const highUnder = (gl, P) => { let m = -Infinity; for (const p of P) m = Math.max(m, gl(p[0], p[1])); return m; };
// a plinth / retaining wall from below the lowest ground under the ring up to y1
const plinth = (a, gl, P, y1, extra) => { const lo = lowUnder(gl, P) - (extra === undefined ? 1.5 : extra); if (lo < y1 - 0.05) prism(a, P, lo, y1, true); return lo; };
// windows on every edge of a ring: rows of dark panes (glowing at night) just outside the walls
function ringWins(a, P, y0, floors, fh, bay, ww, wh, minL, sill){
  const s = sarea(P) > 0 ? 1 : -1, n = P.length;
  for (let i = 0; i < n; i++){
    const p = P[i], q = P[(i + 1) % n], L = Math.hypot(q[0] - p[0], q[1] - p[1]); if (L < (minL || 4)) continue;
    const N = nrm(p, q, s), k = Math.max(1, Math.floor(L/bay)), dx = (q[0] - p[0])/L, dz = (q[1] - p[1])/L, o = 0.07;
    for (let j = 0; j < k; j++){ const m = (j + 0.5)*L/k, cx = p[0] + dx*m + N[0]*o, cz = p[1] + dz*m + N[1]*o, hx = dx*ww/2, hz = dz*ww/2;
      for (let f = 0; f < floors; f++){ const yb = y0 + f*fh + (sill === undefined ? fh*0.3 : sill), yt = yb + wh;
        quad(a, [cx - hx, yb, cz - hz], [cx + hx, yb, cz + hz], [cx + hx, yt, cz + hz], [cx - hx, yt, cz - hz]); } }
  }
}
// horizontal bands (string courses, cornices, spandrels) round a ring: a thin skin outset by d from y0 to y1
function band(a, P, y0, y1, d){ prism(a, offsetRing(P, d), y0, y1, false); }
// columns along a straight line from p to q (local [x, z]), n columns, round (seg sides) or square (seg 0)
function colsLine(a, p, q, n, y0, y1, r, seg){
  for (let i = 0; i < n; i++){ const t = n === 1 ? 0.5 : i/(n - 1), x = p[0] + (q[0] - p[0])*t, z = p[1] + (q[1] - p[1])*t; colB(a, x, z, r, y0, y1, seg); }
}
function colB(a, x, z, r, y0, y1, seg){
  const n = seg || 6; for (let i = 0; i < n; i++){ const t0 = i/n*TAU + PI/n, t1 = (i + 1)/n*TAU + PI/n, p = [x + Math.cos(t0)*r, z + Math.sin(t0)*r], q = [x + Math.cos(t1)*r, z + Math.sin(t1)*r];
    quad(a, [p[0], y0, p[1]], [q[0], y0, q[1]], [q[0], y1, q[1]], [p[0], y1, p[1]]); }
}
// hipped / gabled roofs into a batch (frame f, axis ang): L along, W across, eave at y, ridge rise h, overhang o
function hipB(a, f, u, v, L, W, y, h, o, gableEnds){
  const hl = L/2 + (o || 0), hw = W/2 + (o || 0), k = gableEnds ? hl : Math.max(0, hl - hw);
  const P = (s, t, yy) => { const c = f(u + s, v + t); return [c[0], yy, c[1]]; };
  const A = P(-hl, -hw, y), B = P(hl, -hw, y), C = P(hl, hw, y), D = P(-hl, hw, y), r1 = P(-k, 0, y + h), r2 = P(k, 0, y + h);
  quad(a, A, B, r2, r1); quad(a, C, D, r1, r2); tri3(a, D, A, r1); tri3(a, B, C, r2);
}
// a pyramid / tent roof over a ring (all edges up to the centre point)
function tentB(a, P, y, h){ const c = cen(P); for (let i = 0; i < P.length; i++){ const p = P[i], q = P[(i + 1) % P.length]; tri3(a, [p[0], y, p[1]], [q[0], y, q[1]], [c[0], y + h, c[1]]); } }
// a lathe (surface of revolution) into a batch: pts [[r, y], ...], n segments
function latheB(a, x, z, pts, n, y0){
  for (let i = 0; i < n; i++){ const t0 = i/n*TAU, t1 = (i + 1)/n*TAU, c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
    for (let k = 0; k < pts.length - 1; k++){ const [r0, h0] = pts[k], [r1, h1] = pts[k + 1], yy0 = (y0 || 0) + h0, yy1 = (y0 || 0) + h1;
      quad(a, [x + c0*r0, yy0, z + s0*r0], [x + c1*r0, yy0, z + s1*r0], [x + c1*r1, yy1, z + s1*r1], [x + c0*r1, yy1, z + s0*r1]); } }
}
// a beam between two points as a square tube (cheap)
function beamB(a, p, q, w){
  const dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2], L = Math.hypot(dx, dy, dz) || 1; let ux = dx/L, uy = dy/L, uz = dz/L;
  let ax = 0, ay = 1, az = 0; if (Math.abs(uy) > 0.9){ ax = 1; ay = 0; }
  let vx = uy*az - uz*ay, vy = uz*ax - ux*az, vz = ux*ay - uy*ax; const vl = Math.hypot(vx, vy, vz); vx /= vl; vy /= vl; vz /= vl;
  const wx = uy*vz - uz*vy, wy = uz*vx - ux*vz, wz = ux*vy - uy*vx, h = w/2;
  const C = [[h, h], [-h, h], [-h, -h], [h, -h]].map(([s, t]) => [vx*s + wx*t, vy*s + wy*t, vz*s + wz*t]);
  for (let i = 0; i < 4; i++){ const c = C[i], d = C[(i + 1) % 4]; quad(a, [p[0] + c[0], p[1] + c[1], p[2] + c[2]], [p[0] + d[0], p[1] + d[1], p[2] + d[2]], [q[0] + d[0], q[1] + d[1], q[2] + d[2]], [q[0] + c[0], q[1] + c[1], q[2] + c[2]]); }
}
// round-arched openings (dark) on a facade plane: frame f / ang, the facade line v = v0 (outward sign sg), arches centred at us
function archRow(a, f, us, v0, sg, y0, hw, ht, n){
  n = n || 6; const o = 0.08*sg;
  for (const u of us){ const P = [[-hw, 0], [hw, 0], [hw, ht - hw]]; for (let i = 1; i < n; i++){ const t = PI*i/n; P.push([Math.cos(t)*hw, ht - hw + Math.sin(t)*hw]); } P.push([-hw, ht - hw]);
    const W = P.map(p => { const c = f(u + p[0], v0 + o); return [c[0], y0 + p[1], c[1]]; }); const c0 = f(u, v0 + o), C = [c0[0], y0 + (ht - hw)*0.5, c0[1]];
    for (let i = 0; i < W.length; i++) tri3(a, C, W[i], W[(i + 1) % W.length]); }
}
// the same along the frame's v axis (facade at u = u0)
function archRowV(a, f, vs, u0, sg, y0, hw, ht, n){
  n = n || 6; const o = 0.08*sg;
  for (const v of vs){ const P = [[-hw, 0], [hw, 0], [hw, ht - hw]]; for (let i = 1; i < n; i++){ const t = PI*i/n; P.push([Math.cos(t)*hw, ht - hw + Math.sin(t)*hw]); } P.push([-hw, ht - hw]);
    const W = P.map(p => { const c = f(u0 + o, v + p[0]); return [c[0], y0 + p[1], c[1]]; }); const c0 = f(u0 + o, v), C = [c0[0], y0 + (ht - hw)*0.5, c0[1]];
    for (let i = 0; i < W.length; i++) tri3(a, C, W[i], W[(i + 1) % W.length]); }
}
// a rectangle on a facade (frame coords): along u from u0..u1 at v = v0 (offset o), from y0 to y1
const panelU = (a, f, u0, u1, v0, y0, y1) => { const p = f(u0, v0), q = f(u1, v0); quad(a, [p[0], y0, p[1]], [q[0], y0, q[1]], [q[0], y1, q[1]], [p[0], y1, p[1]]); };
const panelV = (a, f, v0, v1, u0, y0, y1) => { const p = f(u0, v0), q = f(u0, v1); quad(a, [p[0], y0, p[1]], [q[0], y0, q[1]], [q[0], y1, q[1]], [p[0], y1, p[1]]); };
// sample a polyline at spacing d -> [[x, z, angle], ...]
function along(P, d, off){ const out = []; let acc = off || 0; for (let i = 0; i < P.length - 1; i++){ const p = P[i], q = P[i + 1], L = Math.hypot(q[0] - p[0], q[1] - p[1]); if (L < 1e-6) continue; const ang = Math.atan2(-(q[1] - p[1]), q[0] - p[0]); while (acc <= L){ const t = acc/L; out.push([p[0] + (q[0] - p[0])*t, p[1] + (q[1] - p[1])*t, ang]); acc += d; } acc -= L; } return out; }
// decode a flat ring [x0, z0, x1, z1, ...] (decimetres) to [[x, z], ...]
const dec = (A, s) => { const P = []; for (let i = 0; i < A.length; i += 2) P.push([A[i]/(s || 10), A[i + 1]/(s || 10)]); return P; };

// ---------- shared: generic blocks on real footprints, openings, roofs ----------
// longest-edge axis of a ring (radians), and the ring's box in that frame
const axisOf = P => { let best = 0, ang = 0; for (let i = 0; i < P.length; i++){ const p = P[i], q = P[(i + 1) % P.length], L = Math.hypot(q[0] - p[0], q[1] - p[1]); if (L > best){ best = L; ang = Math.atan2(-(q[1] - p[1]), q[0] - p[0]); } } return ang; };
const frameBox = (P, ang) => bbox(toFrame(P, ang, 0, 0));
// a fan-triangulated opening (convex outline [[x, y], ...]) on a facade line of a frame: centred at u, facade v0, outward sign sg
function openU(a, f, u, v0, sg, y0, shape){ const o = 0.08*sg, W = shape.map(p => { const c = f(u + p[0], v0 + o); return [c[0], y0 + p[1], c[1]]; }); let cy = 0; for (const p of shape) cy += p[1]; const c0 = f(u, v0 + o), C = [c0[0], y0 + cy/shape.length, c0[1]]; for (let i = 0; i < W.length; i++) tri3(a, C, W[i], W[(i + 1) % W.length]); }
function openV(a, f, v, u0, sg, y0, shape){ const o = 0.08*sg, W = shape.map(p => { const c = f(u0 + o, v + p[0]); return [c[0], y0 + p[1], c[1]]; }); let cy = 0; for (const p of shape) cy += p[1]; const c0 = f(u0 + o, v), C = [c0[0], y0 + cy/shape.length, c0[1]]; for (let i = 0; i < W.length; i++) tri3(a, C, W[i], W[(i + 1) % W.length]); }
const shRect = (hw, h) => [[-hw, 0], [hw, 0], [hw, h], [-hw, h]];
const shRound = (hw, h, n) => { n = n || 6; const P = [[-hw, 0], [hw, 0], [hw, h - hw]]; for (let i = 1; i < n; i++){ const t = PI*i/n; P.push([Math.cos(t)*hw, h - hw + Math.sin(t)*hw]); } P.push([-hw, h - hw]); return P; };
const shPoint = (hw, h, n) => { n = n || 4; const hs = h - 1.732*hw, P = [[-hw, 0], [hw, 0], [hw, Math.max(0, hs)]]; for (let i = 1; i <= n; i++){ const t = PI/3*i/n; P.push([-hw + 2*hw*Math.cos(t), hs + 2*hw*Math.sin(t)]); } for (let i = n - 1; i >= 1; i--){ const t = PI/3*i/n; P.push([hw - 2*hw*Math.cos(t), hs + 2*hw*Math.sin(t)]); } P.push([-hw, Math.max(0, hs)]); return P; };
// openings on all four faces of a frame box [u0, v0, u1, v1]: n per face along u, m along v
function openBox(a, f, bx, y0, shape, du, dv, skip){
  const [u0, v0, u1, v1] = bx, nu = Math.max(0, Math.floor((u1 - u0)/du)), nv = Math.max(0, Math.floor((v1 - v0)/dv));
  for (let i = 0; i < nu; i++){ const u = u0 + (i + 0.5)*(u1 - u0)/nu; if (!(skip && skip('u', i, nu))){ openU(a, f, u, v0, -1, y0, shape); openU(a, f, u, v1, 1, y0, shape); } }
  for (let i = 0; i < nv; i++){ const v = v0 + (i + 0.5)*(v1 - v0)/nv; if (!(skip && skip('v', i, nv))){ openV(a, f, v, u0, -1, y0, shape); openV(a, f, v, u1, 1, y0, shape); } }
}
// rectangularity of a ring (area / its frame box area)
const rectness = (P, ang) => { const b = frameBox(P, ang); return Math.abs(sarea(P))/Math.max(1, (b[2] - b[0])*(b[3] - b[1])); };
// a generic block on a real footprint: walls from (ground) y0 to y0 + h, windows per floor, a cornice, then a hipped roof
// (near-rectangular plans) or a flat roof with a parapet and roof plant. o: {wall, win, roof, trim, fh, bay, ww, wh, roofH, flat, y0, plinthCol}
function block(B, gl, P, h, o){
  const y0 = o.y0 !== undefined ? o.y0 : (lowUnder(gl, P) + highUnder(gl, P))/2;
  plinth(B.a(o.plinthCol || o.trim || o.wall), gl, P, y0 + 0.02);
  const top = y0 + h; prism(B.a(o.wall), P, y0, top, true);
  const fh = o.fh || 3.3, fl = Math.max(1, Math.round(h/fh));
  if (o.win) ringWins(B.a(o.win), P, y0, fl, h/fl, o.bay || 3.2, o.ww || 1.4, o.wh || (h/fl)*0.5, 3.5);
  if (o.trim) band(B.a(o.trim), P, top - 0.6, top, 0.25);
  const ang = o.ang !== undefined ? o.ang : axisOf(P), rn = rectness(P, ang);
  if (!o.flat && o.roof && rn > 0.86){ const bx = frameBox(P, ang), f = F(0, 0, ang), L = bx[2] - bx[0], W = bx[3] - bx[1];
    hipB(B.a(o.roof), f, (bx[0] + bx[2])/2, (bx[1] + bx[3])/2, L, W, top, o.roofH || Math.min(5, W*0.32), 0.5, o.gable); }
  else if (o.trim) { band(B.a(o.trim), P, top, top + 0.9, 0); }
  return {y0, top};
}
// 2-D convex hull and convex clipping (Sutherland-Hodgman): keeps a rebuilt neighbour inside the plan hull of a model
const hull2 = pts => { const P = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0])*(b[1] - o[1]) - (a[1] - o[1])*(b[0] - o[0]), lo = [], up = [];
  for (const p of P){ while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = P.length - 1; i >= 0; i--){ const p = P[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); } up.pop(); lo.pop(); return lo.concat(up); };
function clipConvex(S, C){ let out = S.slice(); const sg = sarea(C) > 0 ? 1 : -1;
  for (let i = 0; i < C.length && out.length; i++){ const a = C[i], b = C[(i + 1) % C.length], inp = out; out = [];
    const side = p => sg*((b[0] - a[0])*(p[1] - a[1]) - (b[1] - a[1])*(p[0] - a[0]));
    for (let j = 0; j < inp.length; j++){ const p = inp[j], q = inp[(j + 1) % inp.length], sp = side(p), sq = side(q);
      if (sp >= 0) out.push(p); if ((sp < 0) !== (sq < 0) && sp !== sq){ const t = sp/(sp - sq); out.push([p[0] + (q[0] - p[0])*t, p[1] + (q[1] - p[1])*t]); } } }
  return out; }

// real OSM footprints / outlines (local metres round each target anchor, +x east, +z south), from hk/ref_midlevels.json
const C_TOWER = [[-29.4,6.4],[-22.6,-3.8],[-25.3,-16.8],[-12.3,-19.5],[-5.8,-29.2],[4.0,-22.8],[16.6,-25.3],[19.1,-12.9],[29.4,-6.2],[22.6,4.1],[25.2,16.8],[12.5,19.4],[5.9,29.4],[-4.3,22.8],[-16.6,25.3],[-19.1,13.1]];
const C_POD = [[-53.5,-21.2],[-31.4,-51.9],[-18.8,-42.8],[-12.6,-51.8],[-3.0,-45.6],[-4.5,-43.2],[16.3,-29.1],[18.4,-32.3],[24.5,-28.4],[27.9,-33.5],[36.5,-27.6],[32.0,-20.4],[43.9,-12.7],[38.6,-4.6],[42.6,-1.6],[51.4,9.5],[39.6,20.3],[42.4,23.5],[23.7,38.3],[14.7,27.2],[19.6,23.8],[25.7,16.9],[28.0,12.6],[30.2,5.8],[30.7,0.1],[29.8,-7.3],[27.0,-14.3],[23.5,-18.4],[22.6,-18.2],[6.8,-28.6],[6.6,-29.6],[4.0,-30.2],[-3.6,-30.6],[-7.5,-29.9],[-12.7,-28.2],[-17.9,-25.1],[-21.9,-21.7],[-25.7,-17.1],[-29.7,-9.1],[-22.7,-4.5],[-22.6,-3.8],[-29.4,6.4],[-20.2,12.4],[-24.9,19.4],[-30.9,15.7],[-37.2,10.7],[-40.2,6.9],[-43.1,0.2],[-43.5,-3.5],[-43.3,-7.3],[-40.4,-7.9],[-41.3,-12.2]];
const C_SHOP = [[35.6,-18.1],[40.1,-24.9],[48.4,-19.6],[43.9,-12.7]];
const C_NB = [[41.7,-9.3],[48.0,-19.0],[61.5,-2.2],[52.9,4.7]];
const SJ = [[-26.0,-16.1],[-21.0,-21.8],[-15.5,-17.1],[-12.6,-20.4],[-2.0,-11.4],[3.3,-17.6],[15.0,-7.7],[12.3,-4.6],[24.4,5.7],[8.5,24.3],[-15.4,4.0],[-12.7,0.8],[-22.7,-7.7],[-20.0,-10.9]];
const GH = [[-64.4,-22.2],[-60.3,-26.4],[-55.1,-21.3],[-50.7,-25.8],[-43.5,-18.8],[-31.2,-31.4],[-25.6,-26.0],[-18.6,-33.3],[-7.7,-22.7],[-1.9,-28.6],[34.0,6.0],[28.4,11.8],[48.8,31.5],[37.1,43.5],[14.8,22.0],[10.9,26.0],[-23.4,-7.0],[-18.4,-12.1],[-30.2,-23.5],[-42.3,-11.2],[-35.0,-4.2],[-40.2,1.2]];
const FS = [[-20.5,-7.1],[-15.4,-30.1],[18.2,-22.7],[13.5,-0.8],[8.7,-1.7],[6.5,8.7],[15.0,10.5],[13.6,17.0],[4.7,15.2],[1.7,29.3],[10.0,31.0],[7.1,44.8],[-10.7,41.2],[-7.9,27.4],[-2.6,28.4],[4.0,-2.6]];
const WM = [[-19.0,20.3],[-6.3,-26.9],[19.1,-20.2],[6.3,27.0]];
const JM = [[-14.4,-6.6],[12.8,-6.7],[12.8,-3.9],[15.5,-3.9],[15.5,3.4],[12.8,3.4],[12.8,6.6],[-14.3,6.7]];
const MM_PLOT = [[-25.9,4.3],[-7.7,-17.4],[-5.7,-17.2],[-4.4,-19.1],[0.1,-18.9],[21.4,-10.3],[10.4,21.4],[-12.1,13.0],[-11.1,10.2]];
const MM_T = [[-3.4,13.5],[0.6,3.2],[3.5,4.3],[5.2,-0.2],[2.2,-1.3],[5.4,-9.5],[18.4,-4.5],[15.3,3.7],[13.4,3.0],[11.6,7.4],[14.3,8.4],[10.3,18.7]];
const MM_L = [[-10.7,11.6],[-2.3,-12.2],[3.7,-10.1],[-4.7,13.7]];
const MM_V = [[-23.7,4.0],[-9.2,-14.9],[-3.1,-12.7],[-5.5,-5.9],[-4.8,-5.6],[-9.9,8.9]];
const PMQ_PLOT = [[-55.2,0.1],[-29.0,-28.4],[-9.9,-46.5],[0.1,-44.3],[9.8,-38.3],[21.8,-34.2],[37.0,-24.4],[56.4,-7.3],[0.4,54.8]];
const PMQ_H = [[-25.7,-28.6],[-17.9,-36.7],[-12.7,-31.8],[-11.6,-33.1],[30.9,6.8],[29.3,8.4],[35.0,13.8],[27.7,21.5],[25.1,19.0],[23.2,21.0],[-24.4,-23.7],[-22.5,-25.6]];
const PMQ_S = [[-49.7,-2.8],[-42.0,-10.9],[-38.8,-8.0],[-37.0,-9.9],[10.6,34.7],[8.7,36.7],[11.4,39.2],[4.1,46.9],[-1.6,41.5],[-3.2,43.2],[-45.7,3.3],[-44.5,2.1]];
const PMQ_Q = [[-35.4,-8.5],[-22.6,-22.0],[-2.4,-3.1],[-15.3,10.4]];
const TK_PLOT = [[-78.3,28.3],[-49.8,-25.1],[-45.1,-23.0],[-29.6,-58.9],[-28.1,-58.2],[-20.7,-82.4],[46.2,-62.5],[56.3,-56.8],[56.8,-47.9],[55.3,-41.4],[57.2,-35.2],[61.8,-29.7],[62.7,-23.5],[32.0,72.6],[32.0,91.7]];
const ZOO_KEEP = [[[-88.9,67.4],[-33.8,29.9],[-19.7,19.4],[-4.3,1.8],[17.7,-51.8],[35.1,-88.1],[44.0,-108.6],[50.0,-106.2],[65.1,-87.6],[150.7,6.5],[163.6,23.7],[163.0,37.6],[103.5,89.4],[58.2,121.9],[-54.4,148.6],[-76.1,91.1]],[[-229.5,-16.1],[-200.1,-29.3],[-194.2,-33.1],[-191.9,-39.2],[-186.0,-40.0],[-176.2,-42.9],[-168.2,-50.3],[-158.9,-62.6],[-137.1,-86.5],[-118.1,-105.2],[-83.1,-126.4],[-65.3,-127.8],[-12.5,-126.9],[-6.4,-133.2],[17.7,-135.2],[25.2,-134.4],[31.7,-130.1],[32.5,-125.2],[32.2,-118.5],[30.9,-113.2],[17.1,-82.3],[-12.2,-9.2],[-25.2,6.1],[-40.8,19.7],[-86.5,-47.2],[-156.6,-12.9],[-172.3,-11.6],[-207.2,-13.3]]];
const TK_B = {"w148461485":{"n":"Former Central Magistracy","zh":"\u524d\u4e2d\u592e\u88c1\u5224\u53f8\u7f72","h":10.3,"r":[[26.1,23.1],[32.2,3.3],[29.6,2.4],[32.7,-7.4],[55.3,-0.3],[45.8,29.6]]},"w148461573":{"n":"Barrack Block","zh":"\u8425\u623f\u5927\u697c","h":13.4,"r":[[-45.1,-23.0],[-39.3,-36.1],[-27.7,-31.2],[-29.0,-28.1],[-17.2,-23.0],[-12.8,-24.9],[-1.3,-19.7],[0.4,-15.3],[13.4,-9.5],[14.8,-12.9],[25.1,-8.2],[19.3,4.8]]},"w148461574":{"n":"D Hall","zh":"D\u4ed3","h":10.3,"r":[[-24.1,29.5],[-20.1,19.9],[12.3,33.3],[11.0,36.6],[14.5,38.0],[15.9,34.8],[37.5,43.8],[33.5,53.3]]},"w148461576":{"n":"F Hall","zh":"F\u4ed3","h":6.8,"r":[[-72.0,27.2],[-63.9,12.3],[-36.5,24.3],[-44.3,42.6]]},"w148461577":{"n":"B Hall","zh":"B\u4ed3","h":10.3,"r":[[-30.2,10.1],[-26.8,2.0],[-4.4,11.4],[-7.8,19.4]]},"w148461578":{"n":"Married Sergeants' Quarters","zh":"\u5df2\u5a5a\u8b66\u957f\u5bbf\u820d","h":6.8,"r":[[36.1,-37.7],[40.2,-47.5],[53.7,-41.8],[49.6,-32.0]]},"w148461580":{"n":"JC Cube","zh":"\u8d5b\u9a6c\u4f1a\u7acb\u65b9","h":10.3,"r":[[2.6,57.7],[7.3,44.7],[35.4,55.4],[28.6,73.4]]},"w148461582":{"n":"Armoury","zh":"\u67aa\u623f","h":6.8,"r":[[-36.9,-42.0],[-29.6,-58.9],[-17.4,-53.7],[-24.7,-36.8]]},"w148461583":{"n":"E Hall","zh":"\u4f0d\u5ea7","h":13.4,"r":[[0.5,69.2],[5.2,61.6],[26.6,74.5],[21.9,82.2]]},"r2001832":{"n":"Superintendent's House & C Hall","zh":"\u76d1\u72f1\u957f\u697c\u53caC\u4ed3","h":10.3,"r":[[-5.4,21.0],[2.0,3.5],[24.5,13.0],[19.0,26.1],[24.2,28.3],[22.3,32.7]]},"w148461586":{"n":"JC Contemporary","zh":"\u8d5b\u9a6c\u4f1a\u827a\u65b9","h":10.3,"r":[[-68.8,10.2],[-57.1,-11.1],[-26.8,2.0],[-36.5,24.3]]},"w148461588":{"n":"Married Inspectors' Quarters","zh":"\u5df2\u5a5a\u7763\u5bdf\u5bbf\u820d","h":10.3,"r":[[29.7,-25.8],[32.1,-33.8],[62.0,-23.3],[55.8,-4.9],[48.0,-7.8],[51.4,-18.4]]},"w148461590":{"n":"Single Inspectors' Quarters","zh":"\u672a\u5a5a\u7763\u5bdf\u5bbf\u820d","h":10.3,"r":[[42.4,-54.5],[45.6,-61.5],[55.7,-56.9],[52.6,-50.0],[48.9,-51.7],[48.1,-50.0],[44.9,-51.4],[45.7,-53.1]]},"w148461595":{"n":"A Hall","zh":"A\u4ed3","h":6.8,"r":[[-31.5,-2.6],[-28.6,-9.5],[2.0,3.5],[-0.7,9.8],[-5.5,7.8],[-4.7,5.8],[-22.3,-1.6],[-23.1,0.2],[-27.8,-1.8],[-28.1,-1.2]]},"w148461596":{"n":"Police Headquarters Block","zh":"\u8b66\u5bdf\u603b\u90e8\u5927\u697c","h":13.4,"r":[[-27.6,-59.8],[-20.7,-82.4],[36.7,-65.4],[30.3,-43.2],[21.0,-45.8],[22.4,-50.6],[-16.6,-61.7],[-17.9,-56.9]]},"w591035976":{"n":"Bauhinia House","zh":"\u7d2b\u8346\u697c","h":6.8,"r":[[24.9,87.7],[28.0,81.6],[31.9,83.1],[31.9,89.2],[29.3,90.2]]},"w764334587":{"n":"Blue Gate","zh":"\u84dd\u95f8","h":6.8,"r":[[-78.3,28.3],[-76.3,24.8],[-72.0,27.2],[-74.0,30.7]]},"w1459953825":{"n":"Ablutions Block & A Hall","zh":"\u6c90\u6d74\u697c","h":10.3,"r":[[-55.9,-12.9],[-52.9,-19.8],[-28.6,-9.5],[-31.5,-2.6]]}};
const TK_AREAS = {"Parade Ground":[[-29.0,-28.1],[-17.4,-53.7],[-17.9,-56.9],[-16.6,-61.7],[22.4,-50.6],[21.0,-45.8],[30.3,-43.2],[25.1,-27.2],[51.4,-18.4],[46.5,-3.0],[32.7,-7.4],[25.1,-8.2],[14.8,-12.9],[13.4,-9.5],[0.4,-15.3],[-1.3,-19.7],[-12.8,-24.9],[-17.2,-23.0]],"Court Yard":[[19.0,26.1],[21.0,21.3],[45.8,29.6],[43.7,36.1],[30.5,31.8],[29.5,35.1],[22.3,32.7],[24.2,28.3]],"Prison Yard":[[-45.9,47.0],[-32.1,14.2],[-20.1,19.9],[-24.1,29.5],[8.0,42.8],[2.6,57.7],[-4.7,70.7]]};
const ZOO = {"water":[[[61.5,-23.5],[63.6,-26.1],[79.1,-26.8],[81.5,-24.4],[81.8,-8.2],[79.9,-5.8],[64.5,-5.4],[62.1,-7.6]]],"wood":[[[-190.6,-25.3],[-157.5,-50.1],[-115.3,-93.5],[-103.5,-101.6],[-72.3,-114.2],[-78.9,-102.6],[-99.7,-91.3],[-114.4,-73.5],[-123.0,-58.1],[-137.0,-59.0],[-176.8,-23.7]],[[-171.7,-18.4],[-136.7,-50.9],[-116.4,-49.4],[-97.3,-61.4],[-61.4,-66.1],[-37.7,-55.2],[-21.3,-44.7],[-33.1,-22.6],[-39.0,7.3],[-79.8,-51.6],[-97.1,-47.4],[-123.4,-33.8],[-134.9,-45.1],[-148.7,-34.0],[-141.2,-24.4],[-156.9,-15.9]],[[128.2,31.3],[145.5,25.5],[141.1,44.6]],[[54.3,-77.4],[65.8,-82.7],[156.4,19.5],[125.9,22.9],[107.1,6.6],[119.7,-9.3]]],"play":[[[-87.2,67.6],[-75.4,61.0],[-56.3,89.7],[-51.0,93.8],[-47.2,100.6],[-45.5,111.3],[-48.6,117.9],[-54.4,124.0],[-58.5,135.0],[-73.7,90.5]]],"resv":[[[29.7,-27.0],[58.6,-59.3],[114.7,-8.6],[87.6,21.8]]],"paths":[[[-5.5,-37.2],[11.2,-72.3],[16.6,-96.8],[-13.6,-116.0],[-71.6,-109.1],[-76.9,-99.6]],[[56.9,103.2],[78.2,87.2],[84.7,78.9],[83.8,41.8],[87.7,24.1]],[[83.8,41.8],[28.0,-8.1]],[[-100.0,-63.1],[-76.9,-99.6],[-26.0,-102.3],[-2.0,-92.6],[18.5,-81.7]],[[-58.8,41.8],[-34.6,80.7],[-20.5,108.1],[-13.1,117.9],[1.6,123.5]],[[-50.9,55.5],[-44.9,43.3],[-34.9,38.5],[-25.3,51.6],[-4.1,31.0],[10.2,31.5],[-5.9,51.0]],[[9.5,135.0],[7.4,125.2],[18.9,114.7]],[[-56.3,89.7],[-34.6,80.7]],[[43.9,-45.1],[60.7,-27.1]],[[83.7,-6.5],[102.0,7.5]],[[86.4,-36.9],[82.1,-29.5]],[[82.1,-29.5],[74.0,-36.0],[67.3,-35.8],[53.6,-17.6],[54.9,-10.7],[69.6,2.2],[76.3,1.8],[90.1,-13.7],[89.6,-22.6],[82.1,-29.5]],[[-226.8,-22.6],[-175.6,-19.8],[-137.3,-55.2],[-118.7,-53.2],[-100.0,-63.1],[-61.0,-68.9],[-30.5,-56.4],[-5.5,-37.2]],[[163.6,23.7],[147.1,23.5],[127.2,28.9],[113.1,46.9],[100.2,58.7],[83.9,61.2],[62.4,60.9],[47.4,54.3],[32.4,47.6],[21.3,39.5],[10.2,31.5],[11.5,7.4],[17.2,-9.0],[18.4,-12.2]],[[-34.1,-1.2],[-28.4,-0.5],[-19.6,-3.7],[-5.5,-37.2]],[[58.1,-1.1],[28.0,-26.7],[58.9,-62.5],[116.3,-8.9],[87.7,24.1],[58.1,-1.1]],[[109.1,87.6],[122.7,64.0],[142.9,45.8],[147.1,23.5]],[[58.9,-62.5],[46.1,-79.5],[32.8,-90.3]],[[-61.0,-68.9],[-44.8,-101.6]],[[-2.0,-92.6],[-1.4,-76.8],[-18.6,-47.3]],[[-37.6,-59.2],[-12.9,-97.0]],[[16.6,-96.8],[18.5,-110.0],[-3.1,-123.2],[-13.9,-123.5],[-77.4,-116.6],[-103.9,-105.9],[-116.6,-97.1],[-158.4,-53.2],[-172.7,-49.9],[-178.0,-51.8]],[[36.8,105.7],[56.9,103.2],[59.6,111.5]],[[-5.9,51.0],[31.3,91.7],[36.8,105.7],[1.6,123.5],[-26.9,83.4],[-27.2,67.5],[-5.9,51.0]],[[28.0,-8.1],[22.2,-15.2],[18.4,-12.2],[16.3,-28.9]],[[28.0,-8.1],[25.7,-17.5],[28.0,-26.7]],[[20.8,38.5],[58.1,-1.1]],[[127.2,28.9],[102.0,7.5]],[[61.0,-98.1],[59.4,-97.3],[66.3,-89.1],[61.7,-82.8],[55.6,-87.0],[49.8,-82.4]],[[-12.9,-97.0],[-4.7,-110.3]],[[-44.0,-112.4],[-32.3,-121.5]],[[56.5,123.7],[55.2,115.8],[59.6,111.5]],[[-107.8,45.3],[-96.0,47.5],[-84.1,45.4],[-63.4,34.7],[-24.9,6.6],[-17.8,-0.4],[-12.0,-7.9],[31.5,-115.2],[31.2,-121.6],[28.4,-127.2],[18.9,-132.8],[-43.5,-131.3],[-58.6,-134.7],[-66.2,-139.1],[-74.0,-148.3],[-77.1,-159.7],[-75.0,-167.9]]]};
const ZOO_ONE = [[-229.5,-16.1],[-200.1,-29.3],[-194.2,-33.1],[-191.9,-39.2],[-186.0,-40.0],[-176.2,-42.9],[-168.2,-50.3],[-158.9,-62.6],[-137.1,-86.5],[-118.1,-105.2],[-83.1,-126.4],[-65.3,-127.8],[-12.5,-126.9],[-6.4,-133.2],[17.7,-135.2],[25.2,-134.4],[31.7,-130.1],[32.5,-125.2],[32.2,-118.5],[30.9,-113.2],[44.0,-108.6],[50.0,-106.2],[65.1,-87.6],[150.7,6.5],[163.6,23.7],[163.0,37.6],[103.5,89.4],[58.2,121.9],[-54.4,148.6],[-76.1,91.1],[-88.9,67.4],[-40.8,19.7],[-86.5,-47.2],[-156.6,-12.9],[-172.3,-11.6],[-207.2,-13.3]];
const ZOO_HOUSES = [[[-144.2,-33.1],[-135.0,-41.2],[-130.3,-35.8],[-139.5,-27.8]],[[-25.5,-31.9],[-21.0,-41.2],[-9.1,-35.5],[-13.6,-26.1]],[[114.3,52.4],[114.6,50.1],[115.6,48.1],[117.2,46.5],[119.3,45.6],[121.3,45.4],[123.3,45.9],[125.1,46.9],[126.4,48.4],[127.2,50.3],[127.4,52.3],[127.0,54.3],[126.0,56.0],[124.5,57.4],[122.4,58.3],[120.2,58.4],[118.0,57.8],[116.1,56.5],[114.9,54.6]]];

// ===== The Center (中环中心), 99 Queen's Road Central: 1998, 73 storeys, roof 292 m, 346 m to the mast top, all-steel frame.
// Plan from OSM (w148228888 and its parts): a square of ~43 m (corners on the footprint) with four wedge bays from 30 to 270 m,
// a core square up to the roof, then the stepped crown and the mast. Night: the horizontal neon bands, denser towards the top,
// slowly cycling through the spectrum (lt.anim 'cycle'). The low podium / plaza block round the tower (w148461575) is rebuilt too.
{
const LAT = 22.284614, LON = 114.154728, RR = 62;
LANDMARKS.hkthecenter = {zh:'中环中心', en:'The Center', cat:'new', r:RR, h:346,
  lt:{m:0, c:'#3fc8ff', c2:'#ff4fb3', k:2.8, e:1, anim:'cycle'},
  build(){
    const g = new THREE.Group(), G = mkGround(LAT, LON, RR), gl = G.gl, B = mkBatch();
    const GL = {c:'#8e9aa3', m:1, fh:3.8, cw:3.2, lk:0.25}, GL2 = {c:'#7d8a94', m:1, fh:3.8, cw:2.6, lk:0.25}, LOB = {c:'#3e474e', glow:'#ffe2b8', gk:0.5},
      NEON = {c:'#dfe3e6', m:0}, STEEL = {c:'#c6ccd0', m:0, lc:'#ffffff', lk:0.5}, POD = {c:'#b8b2a7', m:0, lc:'#ffd9a8', lk:0.25}, PODG = {c:'#39424a', glow:'#ffd9a8', gk:0.55},
      PAVE = {c:'#a9a49a', m:0, lc:'#ffd9a8', lk:0.1}, DARK = '#4a4f54', RED = {c:'#c22', glow:'#ff2a1a', gk:2.0};
    const SQ = [[-29.4, 6.4], [-5.8, -29.2], [29.4, -6.2], [5.9, 29.4]];
    const CORE = [[-19.0, 4.2], [-3.7, -18.8], [19.0, -4.0], [3.8, 19.1]];
    const sc = (P, k) => P.map(p => [p[0]*k, p[1]*k]);
    // ground: plinth under the tower and the podium (the street falls a little to the north)
    plinth(B.a(POD), gl, C_POD, 0); plinth(B.a(POD), gl, SQ, 0);
    // podium / plaza block: shopfronts, a solid band, the paved roof with planters
    prism(B.a(POD), C_POD, 0, 7.6, true);
    ringWins(B.a(PODG), C_POD, 0.4, 1, 4.6, 4.2, 3.6, 3.6, 3, 0.2);
    prism(B.a(PAVE), offsetRing(C_POD, -1.2), 7.6, 8.1, true);
    // the small shop block next door (w1117325259) is hidden by the app; rebuilt, clipped to the plan hull so no further neighbour is hidden
    const SH = clipConvex(C_SHOP, hull2(C_POD.concat(C_TOWER))); if (SH.length >= 3){ plinth(B.a(POD), gl, SH, 0); prism(B.a(POD), SH, 0, 10.3, true); ringWins(B.a(PODG), SH, 0, 3, 3.3, 3, 1.4, 1.6, 2); }
    // lobby (0-30 m): a recessed glass box inside the square, steel columns at the corners and mid-sides
    prism(B.a(LOB), offsetRing(SQ, -1.6), 0, 30, false);
    for (let i = 0; i < 4; i++){ const p = SQ[i], q = SQ[(i + 1) % 4]; colsLine(B.a(STEEL), p, q, 5, 0, 30, 1.0, 4); }
    // the shaft: square to 282 m, the wedge bays (whole footprint) 30-270 m, the core to the roof
    prism(B.a(GL), C_TOWER, 30, 270, true);
    prism(B.a(GL2), SQ, 270, 282, true);
    prism(B.a(GL2), CORE, 282, 292, true);
    // crown: two stepped tiers and the mast
    const T1 = sc(CORE, 0.72), T2 = sc(CORE, 0.46);
    prism(B.a(STEEL), T1, 292, 298, true); prism(B.a(STEEL), T2, 298, 303, true);
    LCyl(g, 2.2, 2.6, 6, 0, 303, 0, STEEL, 10); LCyl(g, 0.55, 1.4, 37, 0, 309, 0, STEEL, 8);
    LSph(g, 0.8, 0, 346, 0, RED, 1, 8); LSph(g, 0.6, 0, 328, 0, RED, 1, 6);
    // neon bands at the floor edges: every 4th floor low down, every 2nd from 120 m, every floor from 200 m
    const nb = B.a(NEON);
    for (let y = 33.8; y < 268; y += 3.8){ const k = Math.round((y - 33.8)/3.8), st = y < 110 ? 3 : y < 190 ? 2 : 1; if (k % st) continue; prism(nb, offsetRing(C_TOWER, 0.2), y, y + (y < 190 ? 0.9 : 1.3), false); }
    for (const y of [271, 274.5, 278, 281.4]) prism(nb, offsetRing(SQ, 0.18), y, y + 1.1, false);
    for (const y of [284, 287, 290, 291.6]) prism(nb, offsetRing(CORE, 0.18), y, y + 0.45, false);
    for (const y of [294, 297.4]) prism(nb, offsetRing(T1, 0.15), y, y + 0.4, false);
    for (const y of [300, 302.5]) prism(nb, offsetRing(T2, 0.15), y, y + 0.4, false);
    // vertical mullions on the wedge bays (light steel fins) for the daytime texture
    const ms = B.a(STEEL), s = sarea(C_TOWER) > 0 ? 1 : -1;
    for (let i = 0; i < C_TOWER.length; i++){ const p = C_TOWER[i], q = C_TOWER[(i + 1) % C_TOWER.length], L = Math.hypot(q[0] - p[0], q[1] - p[1]), n = Math.max(1, Math.round(L/3.2)), N = nrm(p, q, s);
      for (let j = 0; j <= n; j++){ const t = j/n, x = p[0] + (q[0] - p[0])*t + N[0]*0.12, z = p[1] + (q[1] - p[1])*t + N[1]*0.12; obox(ms, x, z, Math.atan2(-(q[1] - p[1]), q[0] - p[0]), 0.25, 0.3, 30, 270); } }
    // plant / maintenance details on the roof of the square
    for (const c of SQ) obox(B.a(DARK), c[0]*0.8, c[1]*0.8, 0.98, 3, 3, 282, 285);
    B.flush(g); return g; }};
SG_PLACES.push({type:'hkthecenter', lat:LAT, lon:LON, rot:0});
}

// ===== St John's Cathedral (圣约翰座堂), Garden Road: 1847-49, Victorian Gothic (simplified Early English), cream rendered walls,
// lancet windows, the square bell tower with a crenellated parapet at the north-west end (OSM w107497695). Heights estimated.
{
const LAT = 22.278778, LON = 114.159667, RR = 34, ANG = 139.7*D2R;
LANDMARKS.hkstjohn = {zh:'圣约翰座堂', en:"St John's Cathedral", cat:'old', r:RR, h:29, lt:{m:0, c:'#ffd9a8', k:0.85, anim:'breathe'},
  build(){
    const g = new THREE.Group(), gl = mkGround(LAT, LON, RR).gl, B = mkBatch(), f = F(0, 0, ANG);
    const W = '#e8dec6', TR = '#d6caae', RF = '#6d625b', ST = {c:'#bdb3a0', m:0, lk:0.3}, WIN = {c:'#3b3742', glow:'#ffcf8c', gk:0.55}, DK = '#3a3532';
    plinth(B.a(ST), gl, SJ, 0.05, 1.5);
    const bx = (u0, u1, v0, v1, y0, y1, col) => fbox(B.a(col || W), f, ANG, (u0 + u1)/2, (v0 + v1)/2, u1 - u0, v1 - v0, y0, y1);
    // nave and chancel under one tall roof, the wider east part with aisles, the south-east chapel
    bx(-22.3, 22.8, -8.8, 7.4, 0, 10); hipB(B.a(RF), f, 0.25, -0.7, 45.1, 16.2, 10, 6.8, 0.4, true);
    bx(-22.3, 8.9, -13, -8.8, 0, 6.8); bx(-22.3, 8.9, 7.4, 11.4, 0, 6.8);
    for (const [v0, v1, s] of [[-13, -8.8, -1], [7.4, 11.4, 1]]){ const a = B.a(RF), vo = s < 0 ? v0 - 0.4 : v1 + 0.4, vi = s < 0 ? v1 : v0;
      const p = f(-22.6, vo), q = f(9.2, vo), r = f(9.2, vi), t = f(-22.6, vi); quad(a, [p[0], 6.8, p[1]], [q[0], 6.8, q[1]], [r[0], 9.6, r[1]], [t[0], 9.6, t[1]]); }
    bx(-6.5, 8.9, 11.4, 15.6, 0, 6.2); hipB(B.a(RF), f, 1.2, 13.5, 15.4, 4.2, 6.2, 2.6, 0.3);
    // gable end walls of the nave (triangles) at both ends
    for (const u of [-22.35, 22.85]){ const a = B.a(W), p = f(u, -8.8), q = f(u, 7.4), c = f(u, -0.7); tri3(a, [p[0], 10, p[1]], [q[0], 10, q[1]], [c[0], 16.6, c[1]]); }
    // buttresses along the walls, lancet windows between them
    const bt = B.a(TR), wn = B.a(WIN);
    for (let u = 10.4; u <= 21.5; u += 3.6){ for (const v of [-9.1, 7.7]) fbox(bt, f, ANG, u - 1.8, v, 0.8, 0.9, 0, 8.6); openU(wn, f, u, -8.8, -1, 2.8, shPoint(0.6, 5.2)); openU(wn, f, u, 7.4, 1, 2.8, shPoint(0.6, 5.2)); }
    for (let u = -20; u <= 7; u += 3.9){ for (const v of [-13.3, 11.7]) fbox(bt, f, ANG, u - 1.95, v, 0.7, 0.8, 0, 6.2); openU(wn, f, u, -13, -1, 1.8, shPoint(0.55, 3.8)); openU(wn, f, u, 11.4, 1, 1.8, shPoint(0.55, 3.8));
      openU(wn, f, u, -8.8, -1, 7.2, shPoint(0.45, 2.2)); openU(wn, f, u, 7.4, 1, 7.2, shPoint(0.45, 2.2)); }
    for (const u of [-3.3, 1.2, 5.7]) openU(wn, f, u, 15.6, 1, 1.6, shPoint(0.55, 3.4));
    openV(wn, f, -0.7, -22.3, -1, 2.4, shPoint(2.1, 7.6, 6));                        // the great east window
    for (const v of [-11, 9.4]) openV(wn, f, v, -22.3, -1, 1.8, shPoint(0.6, 3.6));
    // the tower: body, belfry openings, crenellated parapet, corner pinnacles, the door
    const tw = [22.3, 30.2, -4.5, 3.0], tc = [(tw[0] + tw[1])/2, (tw[2] + tw[3])/2];
    bx(tw[0], tw[1], tw[2], tw[3], 0, 23.5, W);
    const TWR = [f(tw[0], tw[2]), f(tw[1], tw[2]), f(tw[1], tw[3]), f(tw[0], tw[3])];
    for (const y of [10.2, 16.4, 23.2]) band(B.a(TR), TWR, y - 0.35, y + 0.15, 0.18);
    openBox(wn, f, tw, 17.6, shPoint(0.55, 3.6), 2.6, 2.5);
    openBox(wn, f, tw, 11.3, shPoint(0.35, 2.4), 7, 7);
    openV(B.a(DK), f, tc[1], tw[1], 1, 0, shPoint(1.1, 4.4));
    const mr = B.a(TR);
    for (let u = tw[0] + 0.5; u <= tw[1] - 0.4; u += 1.3) for (const v of [tw[2] + 0.3, tw[3] - 0.3]) fbox(mr, f, ANG, u, v, 0.75, 0.55, 23.5, 25.0);
    for (let v = tw[2] + 1.6; v <= tw[3] - 1.4; v += 1.3) for (const u of [tw[0] + 0.3, tw[1] - 0.3]) fbox(mr, f, ANG, u, v, 0.55, 0.75, 23.5, 25.0);
    for (const u of [tw[0] + 0.45, tw[1] - 0.45]) for (const v of [tw[2] + 0.45, tw[3] - 0.45]){ fbox(mr, f, ANG, u, v, 0.95, 0.95, 23.5, 26.4); const c = f(u, v); LCone(g, 0.6, 2.4, c[0], 26.4, c[1], TR, 4, ANG + PI/4); }
    for (const [u0, v0] of [[tw[0], tw[2]], [tw[1], tw[2]], [tw[0], tw[3]], [tw[1], tw[3]]]) fbox(bt, f, ANG, u0, v0, 1.1, 1.1, 0, 20);
    // a cross on the east gable
    { const c = f(-22.6, -0.7); LBox(g, 0.25, 1.8, 0.25, c[0], 16.5, c[1], TR); LBox(g, 1.0, 0.25, 0.25, c[0], 17.6, c[1], TR, ANG + HP); }
    B.flush(g); return g; }};
SG_PLACES.push({type:'hkstjohn', lat:LAT, lon:LON, rot:0});
}

// ===== Government House (香港礼宾府), Upper Albert Road: 1855; the 1944 rebuild (Seichi Fujimura) joined the blocks with a central
// tower and gave the roofs Japanese-style hipped forms; white walls. Footprint OSM w42258038; heights estimated.
{
const LAT = 22.278671, LON = 114.157408, RR = 72, ANG = -43.9*D2R;
LANDMARKS.hkgovhouse = {zh:'香港礼宾府', en:'Government House', cat:'old', r:RR, h:26, lt:{m:0, c:'#ffe0b8', k:0.8, anim:'breathe'},
  build(){
    const g = new THREE.Group(), gl = mkGround(LAT, LON, RR).gl, B = mkBatch(), f = F(0, 0, ANG);
    const W = '#f0ede6', TR = '#dcd6ca', RF = '#86533f', ST = {c:'#b9b2a4', m:0, lk:0.3}, WIN = {c:'#3a3d42', glow:'#ffd7a0', gk:0.5}, DK = '#4a4643';
    plinth(B.a(ST), gl, GH, 0.05, 1.5);
    const parts = [[-21.3, 28.6, -19.3, 11.2, 10.4, 4.6], [28.6, 57.0, -11.2, 5.6, 9.6, 4.0], [-36.5, -21.3, -11.1, 4.1, 9.0, 3.4],
      [-44.3, -36.5, -1.0, 21.3, 7.2, 2.8], [-38.2, -28.1, 4.0, 28.8, 6.4, 2.8], [-61.8, -38.2, 16.6, 28.8, 6.4, 2.8]];
    for (const [u0, u1, v0, v1, h, rh] of parts){
      const bx = [u0, v0, u1, v1], cu = (u0 + u1)/2, cv = (v0 + v1)/2;
      fbox(B.a(W), f, ANG, cu, cv, u1 - u0, v1 - v0, 0, h);
      fbox(B.a(TR), f, ANG, cu, cv, u1 - u0 + 0.5, v1 - v0 + 0.5, h - 0.5, h);
      hipB(B.a(RF), f, cu, cv, u1 - u0, v1 - v0, h, rh, 1.1);
      const fl = h > 8 ? 2 : 1; for (let k = 0; k < fl; k++) openBox(B.a(WIN), f, bx, 1.0 + k*4.8, shRect(0.7, 2.5), 3.4, 3.4);
      if (fl === 2) fbox(B.a(TR), f, ANG, cu, cv, u1 - u0 + 0.3, v1 - v0 + 0.3, 4.6, 5.0);
    }
    // the tower (1944): square shaft rising from the middle of the main block, two tiers of hipped roofs with wide eaves
    const tu = 2.5, tv = -4.0;
    fbox(B.a(W), f, ANG, tu, tv, 7.6, 7.6, 10, 21.5);
    for (let k = 0; k < 2; k++) openBox(B.a(WIN), f, [tu - 3.8, tv - 3.8, tu + 3.8, tv + 3.8], 12 + k*4.2, shRect(0.6, 2.2), 2.4, 2.4);
    hipB(B.a(RF), f, tu, tv, 7.6, 7.6, 17.0, 0.9, 1.6);
    fbox(B.a(W), f, ANG, tu, tv, 6.4, 6.4, 17.0, 21.5);
    hipB(B.a(RF), f, tu, tv, 6.4, 6.4, 21.5, 3.6, 1.9);
    { const c = f(tu, tv); LCyl(g, 0.12, 0.25, 2.2, c[0], 25.0, c[1], DK, 6); }
    // the porte-cochère on the front (north-east side), a few chimneys
    fbox(B.a(W), f, ANG, 4, 13.6, 9, 4.4, 0, 5.2); hipB(B.a(RF), f, 4, 13.6, 9, 4.4, 5.2, 1.6, 0.6);
    for (const [u, v] of [[-12, -10], [18, -12], [44, -3]]) fbox(B.a(TR), f, ANG, u, v, 1.0, 1.6, 10, 16.2);
    B.flush(g); return g; }};
SG_PLACES.push({type:'hkgovhouse', lat:LAT, lon:LON, rot:0});
}

// ===== Flagstaff House (旧三军司令官邸, the Museum of Tea Ware), Hong Kong Park: 1846, Greek Revival, white, two storeys of
// colonnaded verandahs round the house, hipped roof; the single-storey later wing to the south (OSM w42255475). Heights estimated.
{
const LAT = 22.278353, LON = 114.162509, RR = 46, ANG = -12.4*D2R;
LANDMARKS.hkflagstaff = {zh:'旧三军司令官邸（茶具文物馆）', en:'Flagstaff House (Museum of Tea Ware)', cat:'old', r:RR, h:15, lt:{m:0, c:'#ffe2bc', k:0.85, anim:'breathe'},
  build(){
    const g = new THREE.Group(), gl = mkGround(LAT, LON, RR).gl, B = mkBatch(), f = F(0, 0, ANG);
    const W = '#f2f0ea', W2 = '#e6e2d8', RF = '#5f5650', ST = {c:'#c4bcae', m:0, lk:0.3}, WIN = {c:'#3c4045', glow:'#ffd7a0', gk:0.5}, SH = '#55705c';
    plinth(B.a(ST), gl, FS, 0.05, 1.2);
    const M = [-21.5, -26.1, 12.9, -2.5], cu = (M[0] + M[2])/2, cv = (M[1] + M[3])/2, L = M[2] - M[0], Wd = M[3] - M[1];
    fbox(B.a(ST), f, ANG, cu, cv, L, Wd, -0.2, 0.9);                                 // the raised ground-floor platform
    fbox(B.a(W2), f, ANG, cu, cv, L - 6, Wd - 6, 0.9, 10.2);                         // the house behind the verandahs
    for (let k = 0; k < 2; k++) openBox(B.a(SH), f, [M[0] + 3, M[1] + 3, M[2] - 3, M[3] - 3], 1.8 + k*4.7, shRect(0.75, 3.0), 3.0, 3.0);
    fbox(B.a(W), f, ANG, cu, cv, L, Wd, 5.2, 5.75);                                  // the upper verandah floor
    fbox(B.a(W), f, ANG, cu, cv, L + 0.3, Wd + 0.3, 9.6, 10.6);                      // entablature
    // columns on the edge of both verandahs and a balustrade upstairs
    const col = B.a(W); for (const [y0, y1, r] of [[0.9, 5.2, 0.32], [5.75, 9.6, 0.26]]){
      const n = Math.round(L/2.9), m = Math.round(Wd/2.9);
      for (let i = 0; i <= n; i++){ const u = M[0] + 0.45 + (L - 0.9)*i/n; for (const v of [M[1] + 0.45, M[3] - 0.45]){ const c = f(u, v); colB(col, c[0], c[1], r, y0, y1, 8); } }
      for (let i = 1; i < m; i++){ const v = M[1] + 0.45 + (Wd - 0.9)*i/m; for (const u of [M[0] + 0.45, M[2] - 0.45]){ const c = f(u, v); colB(col, c[0], c[1], r, y0, y1, 8); } } }
    for (const [u0, v0, u1, v1] of [[M[0], M[1], M[2], M[1]], [M[0], M[3], M[2], M[3]]]) fbox(B.a(W), f, ANG, (u0 + u1)/2, v0 + (v0 < cv ? 0.45 : -0.45), L - 0.6, 0.18, 5.75, 6.7);
    for (const u of [M[0] + 0.45, M[2] - 0.45]) fbox(B.a(W), f, ANG, u, cv, 0.18, Wd - 0.6, 5.75, 6.7);
    hipB(B.a(RF), f, cu, cv, L, Wd, 10.6, 4.4, 0.6);
    for (const u of [cu - 6, cu + 6]){ const c = f(u, cv); LBox(g, 1.0, 3.4, 1.6, c[0], 12.5, c[1], W, ANG); }
    // the later south wing (single storey) on the rest of the footprint
    for (const [u0, u1, v0, v1] of [[3.3, 8.1, -3.5, 7.1], [3.4, 16.9, 7.0, 13.8], [3.6, 8.0, 13.8, 28.3], [-1.8, 16.6, 28.1, 42.5]]){
      const a = (u0 + u1)/2, b = (v0 + v1)/2; fbox(B.a(W2), f, ANG, a, b, u1 - u0, v1 - v0, 0, 4.6);
      hipB(B.a(RF), f, a, b, u1 - u0, v1 - v0, 4.6, Math.min(2.2, (Math.min(u1 - u0, v1 - v0))*0.3), 0.4);
      openBox(B.a(WIN), f, [u0, v0, u1, v1], 1.2, shRect(0.6, 2.0), 3.2, 3.2); }
    B.flush(g); return g; }};
SG_PLACES.push({type:'hkflagstaff', lat:LAT, lon:LON, rot:0});
}

// ===== Western Market (西港城), Sheung Wan: 1906, Edwardian market hall, red brick with cream bands, four corner towers, arched
// windows (OSM w26599372). Heights estimated (three tall storeys).
{
const LAT = 22.287309, LON = 114.150365, RR = 31, ANG = 74.8*D2R;
LANDMARKS.hkwesternmkt = {zh:'西港城', en:'Western Market', cat:'old', r:RR, h:22, lt:{m:0, c:'#ffd29a', k:0.95, anim:'breathe'},
  build(){
    const g = new THREE.Group(), gl = mkGround(LAT, LON, RR).gl, B = mkBatch(), f = F(0, 0, ANG);
    const BR = '#a4473a', CR = '#ecdfc4', RF = '#5a4e48', ST = {c:'#cdbfa4', m:0, lk:0.3}, WIN = {c:'#35363b', glow:'#ffd29a', gk:0.55}, WIN2 = {c:'#3a3530', glow:'#ffc77a', gk:0.7};
    plinth(B.a(ST), gl, WM, 0.05, 1.2);
    const U0 = -24.6, U1 = 24.5, V0 = -13.1, V1 = 13.1, L = U1 - U0, Wd = V1 - V0, cu = (U0 + U1)/2;
    fbox(B.a(CR), f, ANG, cu, 0, L, Wd, 0, 1.0);
    fbox(B.a(BR), f, ANG, cu, 0, L - 0.2, Wd - 0.2, 1.0, 16.6);
    for (const [y0, y1] of [[6.2, 6.9], [11.4, 11.9], [15.8, 16.6]]) fbox(B.a(CR), f, ANG, cu, 0, L + 0.3, Wd + 0.3, y0, y1);
    band(B.a(CR), [f(U0, V0), f(U1, V0), f(U1, V1), f(U0, V1)], 16.6, 17.8, 0.1);   // the parapet
    hipB(B.a(RF), f, cu, 0, L - 3, Wd - 3, 16.6, 4.2, 0);
    // corner towers: brick shafts with cream quoins, a pyramid cap and a finial
    for (const u of [U0 + 2.8, U1 - 2.8]) for (const v of [V0 + 2.8, V1 - 2.8]){
      fbox(B.a(BR), f, ANG, u, v, 5.8, 5.8, 1.0, 19.6); fbox(B.a(CR), f, ANG, u, v, 6.2, 6.2, 19.0, 20.0);
      for (const du of [-2.9, 2.9]) for (const dv of [-2.9, 2.9]) fbox(B.a(CR), f, ANG, u + du, v + dv, 0.5, 0.5, 1.0, 19.0);
      hipB(B.a(RF), f, u, v, 6.0, 6.0, 20.0, 2.6, 0.2); const c = f(u, v); LCyl(g, 0.08, 0.2, 1.5, c[0], 22.4, c[1], CR, 6);
      openBox(B.a(WIN), f, [u - 2.9, v - 2.9, u + 2.9, v + 2.9], 17.0, shRound(0.45, 1.6), 5.8, 5.8); }
    // the market's big round-arched ground floor openings, round-headed windows upstairs
    const fac = (y, sh, sp, col) => { const nu = Math.floor((L - 11.6)/sp), nv = Math.floor((Wd - 11.6)/sp);
      for (let i = 0; i < nu; i++){ const u = U0 + 5.8 + (i + 0.5)*(L - 11.6)/nu; openU(B.a(col), f, u, V0, -1, y, sh); openU(B.a(col), f, u, V1, 1, y, sh); }
      for (let i = 0; i < nv; i++){ const v = V0 + 5.8 + (i + 0.5)*(Wd - 11.6)/nv; openV(B.a(col), f, v, U0, -1, y, sh); openV(B.a(col), f, v, U1, 1, y, sh); } };
    fac(1.2, shRound(1.25, 4.6), 3.75, WIN2); fac(7.6, shRound(0.75, 3.2), 3.75, WIN); fac(12.5, shRound(0.65, 2.6), 3.75, WIN);
    for (const u of [U0 + 2.8, U1 - 2.8]) for (const v of [V0 + 2.8, V1 - 2.8]) for (const y of [7.6, 12.5]) openBox(B.a(WIN), f, [u - 2.9, v - 2.9, u + 2.9, v + 2.9], y, shRound(0.55, 2.8), 5.8, 5.8);
    B.flush(g); return g; }};
SG_PLACES.push({type:'hkwesternmkt', lat:LAT, lon:LON, rot:0});
}

// ===== Jamia Mosque (些利街清真寺), Shelley Street: built 1890, rebuilt 1915; pale green and white, arched windows, a corner
// minaret, crenellated parapet (OSM w228196397; the porch on the east). Heights estimated.
{
const LAT = 22.280155, LON = 114.151916, RR = 30;
LANDMARKS.hkjamia = {zh:'些利街清真寺', en:'Jamia Mosque', cat:'old', r:RR, h:20, lt:{m:0, c:'#e8fff0', k:0.8},
  build(){
    const g = new THREE.Group(), gl = mkGround(LAT, LON, RR).gl, B = mkBatch(), f = F(0, 0, 0);
    const GRN = '#bcd3ad', WH = '#f3f1e9', ST = {c:'#d9d4c6', m:0, lk:0.3}, WIN = {c:'#3a4a44', glow:'#e9ffd8', gk:0.5}, DK = '#2f3a36', GOLD = {c:'#d2b45a', glow:'#ffe08a', gk:0.3};
    plinth(B.a(ST), gl, JM, 0.05, 1.2);
    fbox(B.a(WH), f, 0, -0.8, 0, 27.2, 13.3, 0, 0.9);
    fbox(B.a(GRN), f, 0, -0.8, 0, 27.0, 13.1, 0.9, 9.4);
    fbox(B.a(WH), f, 0, -0.8, 0, 27.4, 13.5, 4.6, 5.0); fbox(B.a(WH), f, 0, -0.8, 0, 27.5, 13.6, 9.4, 10.1);
    for (let x = -13.9; x <= 12.4; x += 1.2) for (const z of [-6.55, 6.55]) fbox(B.a(WH), f, 0, x, z, 0.6, 0.3, 10.1, 11.0);
    for (let z = -5.4; z <= 5.4; z += 1.2) for (const x of [-14.25, 12.65]) fbox(B.a(WH), f, 0, x, z, 0.3, 0.6, 10.1, 11.0);
    for (const x of [-14, 12.4]) for (const z of [-6.3, 6.3]){ fbox(B.a(WH), f, 0, x, z, 1.0, 1.0, 9.4, 12.0); LDome(g, 0.55, x, 12.0, z, WH, 1.3, 8); }
    // pointed-arched windows in two rows, the arcade on the long sides
    const bx = [-14.4, -6.65, 12.8, 6.65];
    openBox(B.a(WIN), f, bx, 1.4, shPoint(0.75, 2.9), 3.0, 3.3);
    openBox(B.a(WIN), f, bx, 5.6, shPoint(0.6, 2.6), 3.0, 3.3);
    // the porch on Shelley Street (east)
    fbox(B.a(WH), f, 0, 14.15, -0.2, 2.7, 7.3, 0, 6.2); openV(B.a(DK), f, -0.2, 15.5, 1, 0.2, shPoint(1.3, 4.4)); fbox(B.a(GRN), f, 0, 14.15, -0.2, 2.9, 7.5, 6.2, 6.8);
    // the minaret at the north-east corner
    const mx = 11.6, mz = -5.3; LCyl(g, 1.25, 1.35, 17.0, mx, 0, mz, WH, 8); LCyl(g, 1.7, 1.7, 0.6, mx, 13.2, mz, GRN, 8); LCyl(g, 1.25, 1.25, 1.0, mx, 13.8, mz, {c:'#ece9df'}, 8);
    LCyl(g, 0.95, 1.1, 1.8, mx, 17.0, mz, GRN, 8); LSph(g, 1.0, mx, 19.0, mz, WH, 1.2, 10); LCyl(g, 0.05, 0.08, 1.4, mx, 20.0, mz, GOLD, 6); LSph(g, 0.22, mx, 21.4, mz, GOLD, 1, 6);
    openBox(B.a(WIN), f, [mx - 1.3, mz - 1.3, mx + 1.3, mz + 1.3], 15.0, shPoint(0.32, 1.4), 2.6, 2.6);
    B.flush(g); return g; }};
SG_PLACES.push({type:'hkjamia', lat:LAT, lon:LON, rot:0});
}

// ===== Man Mo Temple compound (文武庙), Hollywood Road: 1847; three buildings side by side: the Man Mo Temple (two halls with
// the incense court between), Lit Shing Kung and the Kung Sor; grey brick, green glazed tile roofs with decorated ridges,
// granite door frames, red lanterns at night. Footprints OSM w1300658311 / w1300658310 / w1300658306; heights estimated.
{
const LAT = 22.283924, LON = 114.150101, RR = 30, ANG = -20.8*D2R;
LANDMARKS.hkmanmo = {zh:'文武庙', en:'Man Mo Temple', cat:'old', r:RR, h:12, lt:{m:0, c:'#ffc480', k:0.9},
  build(){
    const g = new THREE.Group(), gl = mkGround(LAT, LON, RR).gl, B = mkBatch(), f = F(0, 0, ANG);
    const BRK = '#8f918d', GRN = '#4e7d58', RIDGE = {c:'#6b8f70', glow:'#ffb060', gk:0.08}, GRAN = '#cfc8b5', RED = '#8e2b22', ST = {c:'#a9a59a', m:0, lk:0.3}, DK = '#2e2a28',
      LAN = {c:'#c8321e', glow:'#ff5a2a', gk:1.6}, GOLD = {c:'#c9a246', glow:'#ffcf6a', gk:0.35};
    // halls in the frame: [u0, u1, v0, v1, wall, ridge]
    const halls = [];
    const fr = (P) => bbox(toFrame(P, ANG, 0, 0));
    const T = fr(MM_T), Lb = fr(MM_L), V = fr(MM_V);
    plinth(B.a(ST), gl, MM_T, 0.05, 1.2); plinth(B.a(ST), gl, MM_L, 0.05, 1.2); plinth(B.a(ST), gl, MM_V, 0.05, 1.2);
    halls.push([T[0], T[2], T[1], T[1] + 8.8, 6.0, 9.2], [T[0] + 1.6, T[2] - 1.6, T[1] + 8.8, T[1] + 13.6, 5.0, 7.0], [T[0], T[2], T[1] + 13.6, T[3], 7.0, 10.4]);
    halls.push([Lb[0], Lb[2], Lb[1], Lb[3], 5.6, 8.6]);
    halls.push([V[0], V[2], V[1], V[3], 5.6, 8.4]);
    for (const [u0, u1, v0, v1, w, rg] of halls){
      const cu = (u0 + u1)/2, cv = (v0 + v1)/2, L = u1 - u0, Wd = v1 - v0;
      fbox(B.a(BRK), f, ANG, cu, cv, L, Wd, 0, w);
      // gabled roof along u (ridge parallel to the street front), overhanging eaves, the gable walls rising above the roof line
      hipB(B.a(GRN), f, cu, cv, L, Wd, w, rg - w, 0.6, true);
      for (const u of [u0 - 0.05, u1 + 0.05]){ const a = B.a(BRK), p = f(u, v0 - 0.6), q = f(u, v1 + 0.6), c = f(u, cv); tri3(a, [p[0], w, p[1]], [q[0], w, q[1]], [c[0], rg + 0.5, c[1]]); }
      // the decorated main ridge with upturned ends
      fbox(B.a(RIDGE), f, ANG, cu, cv, L + 0.4, 0.6, rg - 0.1, rg + 0.75);
      for (const s of [-1, 1]){ const c = f(cu + s*(L/2 + 0.1), cv); LBox(g, 0.7, 1.0, 0.6, c[0], rg + 0.5, c[1], RIDGE, ANG); }
      fbox(B.a(GOLD), f, ANG, cu, cv, Math.min(5, L*0.35), 0.3, rg + 0.75, rg + 1.4);
    }
    // the front (north, toward Hollywood Road): granite door frames, red doors, a recessed porch with two granite columns
    for (const [u0, u1, v0] of [[T[0], T[2], T[1]], [Lb[0], Lb[2], Lb[1]], [V[0], V[2], V[1]]]){
      const cu = (u0 + u1)/2; openU(B.a(GRAN), f, cu, v0, -1, 0, shRect(1.6, 3.9)); openU(B.a(RED), f, cu, v0 - 0.04, -1, 0.1, shRect(1.2, 3.5));
      for (const s of [-1, 1]){ const c = f(cu + s*2.3, v0 - 0.4); colB(B.a(GRAN), c[0], c[1], 0.25, 0, 4.6, 6); }
      for (const s of [-1, 1]){ const c = f(cu + s*1.7, v0 - 0.9); LSph(g, 0.45, c[0], 4.4, c[1], LAN, 1.25, 8); }
      fbox(B.a(GRN), f, ANG, cu, v0 - 0.7, u1 - u0 - 0.6, 1.6, 4.6, 5.0);
    }
    // the incense coils hanging in the court (glowing tips)
    for (let k = 0; k < 6; k++){ const c = f(T[0] + 3 + (k % 3)*4.2, T[1] + 10 + Math.floor(k/3)*2.2); LCone(g, 0.7, 1.0, c[0], 2.8, c[1], {c:'#7a5a2e', glow:'#ff7a2a', gk:0.6}, 10); }
    B.flush(g); return g; }};
SG_PLACES.push({type:'hkmanmo', lat:LAT, lon:LON, rot:0});
}

// ===== PMQ (元创方), Aberdeen Street: the Police Married Quarters (1951), two seven-storey slab blocks with open access
// galleries facing the courtyard, on the site of the Central School; the low QUBE hall between them (OSM w295407296 Hollywood,
// w295407306 Staunton, w295407303 QUBE).
{
const LAT = 22.28341, LON = 114.151864, RR = 59, ANG = -43.2*D2R;
LANDMARKS.hkpmq = {zh:'元创方', en:'PMQ (former Police Married Quarters)', cat:'old', r:RR, h:30, lt:{m:1, c:'#ffe2b8', k:0.5, fh:3.2, cw:2.6},
  build(){
    const g = new THREE.Group(), gl = mkGround(LAT, LON, RR).gl, B = mkBatch(), f = F(0, 0, ANG);
    const W = {c:'#e9e3d3', m:1, fh:3.2, cw:2.6}, W2 = '#dcd5c3', RL = '#f6f4ee', ST = {c:'#b5ad9d', m:0, lk:0.25}, WIN = {c:'#41474c', glow:'#ffd9a4', gk:0.45}, GLS = {c:'#6f7d84', glow:'#ffe8c8', gk:0.4}, GRN = '#6f8f5a';
    const slab = (P, fl, galV, galSide) => {
      const bx = bbox(toFrame(P, ANG, 0, 0)), cu = (bx[0] + bx[2])/2, cv = (bx[1] + bx[3])/2, L = bx[2] - bx[0], Wd = bx[3] - bx[1];
      const y0 = (lowUnder(gl, P) + highUnder(gl, P))/2, top = y0 + fl*3.2 + 0.8;
      plinth(B.a(ST), gl, P, y0, 1.5);
      prism(B.a(W), P, y0, top, false); capP(B.a('#a9a8a2'), P, top);
      // access galleries on the courtyard side: slab edges and white railings, doors behind
      for (let k = 1; k <= fl; k++){ const y = y0 + k*3.2 - 3.2; fbox(B.a(W2), f, ANG, cu, galV + galSide*0.8, L - 2, 1.6, y + 3.0, y + 3.25); fbox(B.a(RL), f, ANG, cu, galV + galSide*1.55, L - 2, 0.12, y + 3.25, y + 4.25); }
      for (let k = 0; k < fl; k++) for (let i = 0; i < Math.floor(L/3.4); i++){ const u = bx[0] + 1.7 + i*3.4; openU(B.a(WIN), f, u, galV, galSide, y0 + 0.4 + k*3.2, shRect(0.5, 2.1)); openU(B.a(WIN), f, u, galV - galSide*Wd, -galSide, y0 + 1.1 + k*3.2, shRect(0.7, 1.5)); }
      for (const u of [bx[0], bx[2]]) for (let k = 0; k < fl; k++) openV(B.a(WIN), f, cv, u, u > cu ? 1 : -1, y0 + 1.0 + k*3.2, shRect(0.5, 1.5));
      band(B.a(W2), P, top - 0.2, top + 0.9, 0);
      return {y0, top};
    };
    slab(PMQ_H, 7, -0.6, 1); slab(PMQ_S, 8, 18.1, -1);
    // QUBE: a low glazed hall in the courtyard with a planted roof
    const y0 = (lowUnder(gl, PMQ_Q) + highUnder(gl, PMQ_Q))/2; plinth(B.a(ST), gl, PMQ_Q, y0, 1.5);
    prism(B.a(GLS), PMQ_Q, y0, y0 + 9.5, true); prism(B.a(GRN), offsetRing(PMQ_Q, -0.6), y0 + 9.5, y0 + 10.1, true); band(B.a(W2), PMQ_Q, y0 + 9.3, y0 + 10.3, 0.1);
    // the courtyard floor between the blocks
    const yc = y0 + 0.1, C = [f(-36, 0.4), f(33, 0.4), f(33, 17.1), f(-36, 17.1)]; prism(B.a(ST), C.map(p => [p[0], p[1]]), Math.min(yc, lowUnder(gl, C) - 1), yc - 0.4, true);
    B.flush(g); return g; }};
SG_PLACES.push({type:'hkpmq', lat:LAT, lon:LON, rot:0});
}

// ===== Tai Kwun (大馆): the former Central Police Station compound (Police Headquarters Block 1919, Barrack Block 1864, Central
// Magistracy 1914, Victoria Prison halls), with the two new blocks by Herzog & de Meuron (JC Contemporary, JC Cube; opened 2018,
// facades of cast aluminium bricks). Every block stands on its own ground: the compound climbs ~15 m from Hollywood Road to
// the prison yard. Footprints from OSM (16 named blocks); the Parade Ground and the Prison Yard are paved terraces.
{
const LAT = 22.281221, LON = 114.154078, RR = 100;
const TKS = {   // osm id -> [style, floors, floor height]
  w148461596:['brick', 4, 4.2], w148461573:['white', 4, 4.0], w148461485:['mag', 3, 4.5], w148461588:['cream', 3, 3.8], w148461578:['cream', 2, 3.8],
  w148461590:['cream', 3, 3.5], w148461582:['brick', 2, 3.8], w148461595:['prison', 2, 3.6], w148461577:['prison', 3, 3.5], w148461574:['prison', 3, 3.5],
  w148461583:['prison', 4, 3.5], w148461576:['prison', 2, 3.6], r2001832:['prison', 3, 3.6], w1459953825:['prison', 3, 3.4], w148461586:['alu', 4, 4.3], w148461580:['alu', 5, 4.2], w591035976:['cream', 2, 3.4], w764334587:['cream', 2, 3.4]};
LANDMARKS.hktaikwun = {zh:'大馆', en:'Tai Kwun (former Central Police Station)', cat:'old', r:RR, h:22, lt:{m:0, c:'#ffd9ac', k:0.8, anim:'breathe'},
  build(){
    const g = new THREE.Group(), gl = mkGround(LAT, LON, RR).gl, B = mkBatch();
    const BRK = '#9d4c38', GRA = '#d3cab6', WHT = '#ece6d8', CRM = '#e3d6bd', PRS = '#d6d1c4', ALU = {c:'#a5a7a4', m:0, lc:'#ffe6c4', lk:0.35}, RF = '#5c5e5f', RF2 = '#6e5a4e',
      ST = {c:'#b4ab99', m:0, lk:0.3}, PAV = {c:'#b9b1a1', m:0, lk:0.15}, WIN = {c:'#3a3c40', glow:'#ffd8a2', gk:0.5}, AWIN = {c:'#4c4a46', glow:'#ffe6c4', gk:0.65}, GRN = '#4c6b52';
    // the paved terraces first (each at its mean ground, retaining walls down to the lowest point)
    for (const [k, P] of Object.entries(TK_AREAS)){ const y = (lowUnder(gl, P) + highUnder(gl, P))/2; prism(B.a(PAV), P, lowUnder(gl, P) - 1.5, y + 0.12, true); }
    // the prison wall round the compound (granite, ~5.5 m), stepping with the ground
    const wl = B.a(GRA);
    for (let i = 0; i < TK_PLOT.length; i++){ const p = TK_PLOT[i], q = TK_PLOT[(i + 1) % TK_PLOT.length], L = Math.hypot(q[0] - p[0], q[1] - p[1]), n = Math.max(1, Math.round(L/4)), ang = Math.atan2(-(q[1] - p[1]), q[0] - p[0]);
      for (let j = 0; j < n; j++){ const t = (j + 0.5)/n, x = p[0] + (q[0] - p[0])*t, z = p[1] + (q[1] - p[1])*t, y = gl(x, z); obox(wl, x, z, ang, L/n + 0.05, 0.8, y - 1.5, y + 5.5); } }
    for (const [id, b] of Object.entries(TK_B)){
      const st = TKS[id]; if (!st) continue; const [sty, fl, fh] = st, P = b.r, h = fl*fh, ang = axisOf(P), f = F(0, 0, ang);
      const y0 = sty === 'alu' ? highUnder(gl, P) : (lowUnder(gl, P) + highUnder(gl, P))/2;
      const wall = sty === 'brick' || sty === 'mag' ? BRK : sty === 'white' ? WHT : sty === 'cream' ? CRM : sty === 'alu' ? ALU : PRS;
      if (sty === 'alu'){
        // JC Contemporary / JC Cube: a recessed glazed ground floor, then the aluminium-brick box with a few large openings
        plinth(B.a(ST), gl, P, y0, 1.5); prism(B.a(AWIN), offsetRing(P, -1.5), y0, y0 + 4.5, true);
        prism(B.a(ALU), P, y0 + 4.5, y0 + h, true);
        for (let k = 1; k < fl; k++) band(B.a({c:'#8f918e'}), P, y0 + k*fh + 0.2, y0 + k*fh + 0.45, 0.06);
        ringWins(B.a(AWIN), P, y0 + 4.5, fl - 1, fh, 9, 3.2, 2.2, 8);
        colsLine(B.a(ALU), P[0], P[1], 2, y0, y0 + 4.5, 0.4, 6);
        continue;
      }
      plinth(B.a(ST), gl, P, y0, 1.5);
      prism(B.a(wall), P, y0, y0 + h, false); capP(B.a('#8b8984'), P, y0 + h);
      prism(B.a(GRA), P, y0, y0 + 1.0, false);                                       // granite base course
      for (let k = 1; k < fl; k++) band(B.a(sty === 'brick' || sty === 'mag' ? GRA : WHT), P, y0 + k*fh - 0.3, y0 + k*fh, 0.12);
      band(B.a(GRA), P, y0 + h - 0.5, y0 + h + 0.4, 0.3);
      ringWins(B.a(WIN), P, y0, fl, fh, sty === 'prison' ? 2.6 : 3.3, sty === 'prison' ? 0.7 : 1.2, sty === 'prison' ? 1.3 : fh*0.52, 4, sty === 'prison' ? fh*0.5 : fh*0.25);
      // verandahs / colonnades on the long sides of the police blocks and the giant order of the Magistracy
      if (sty === 'brick' || sty === 'white' || sty === 'mag'){
        const s = sarea(P) > 0 ? 1 : -1;
        for (let i = 0; i < P.length; i++){ const p = P[i], q = P[(i + 1) % P.length], L = Math.hypot(q[0] - p[0], q[1] - p[1]); if (L < 18) continue;
          const N = nrm(p, q, s), n = Math.round(L/3.6), o = sty === 'mag' ? 1.0 : 0.6;
          const pp = [p[0] + N[0]*o, p[1] + N[1]*o], qq = [q[0] + N[0]*o, q[1] + N[1]*o];
          if (sty === 'mag') colsLine(B.a(GRA), pp, qq, Math.round(L/4.5), y0 + 1.0, y0 + h - 0.5, 0.55, 8);
          else for (let k = 0; k < fl; k++) colsLine(B.a(GRA), pp, qq, n + 1, y0 + k*fh, y0 + (k + 1)*fh - 0.35, 0.28, sty === 'white' ? 0 : 8); } }
      // roofs: hipped on the near-rectangular blocks (grey slate), else a parapet
      const bx = frameBox(P, ang);
      if (rectness(P, ang) > 0.85){ const L = bx[2] - bx[0], W = bx[3] - bx[1]; hipB(B.a(sty === 'prison' ? RF : RF2), f, (bx[0] + bx[2])/2, (bx[1] + bx[3])/2, L, W, y0 + h + 0.4, Math.min(4.5, W*0.3), 0.4); }
      else band(B.a(GRA), P, y0 + h + 0.4, y0 + h + 1.3, 0);
    }
    // trees on the Parade Ground (it has a big mango tree) and in the Prison Yard
    for (const [k, P] of Object.entries(TK_AREAS)){ if (k === 'Court Yard') continue; const c = cen(P), y = (lowUnder(gl, P) + highUnder(gl, P))/2 + 0.12;
      LCyl(g, 0.5, 0.7, 4.5, c[0], y, c[1], '#5d4a3a', 7); LSph(g, 5.2, c[0], y + 7.5, c[1], GRN, 0.8, 10); }
    B.flush(g); return g; }};
SG_PLACES.push({type:'hktaikwun', lat:LAT, lon:LON, rot:0});
}

// ===== Hong Kong Zoological and Botanical Gardens (香港动植物公园), site: the Victorian gardens (opened in the 1860s-1871) on both
// sides of Albany Road: lawns and old trees, the fountain terrace, the Chinese War Memorial, the statue of King George VI,
// aviaries and glasshouse (generic forms). The real footpaths stay (keepRoads).
{
const LAT = 22.277797, LON = 114.155725;
Object.assign(SITES, {hkzoo:{zh:'香港动植物公园', en:'Hong Kong Zoological and Botanical Gardens', lat:LAT, lon:LON, r:230, keep:ZOO_ONE, keepRoads:[11, 12], h:20,
  lt:{m:0, c:'#ffe2b8', k:0.6},
  build(ctx){
    const g = new THREE.Group(), gy = ctx.gy, R = ctx.rng, B = mkBatch();
    const ST = {c:'#d8d1c0', m:0, lk:0.4}, WAT = {c:'#7fa9b8', glow:'#9fd8ff', gk:0.15}, BRZ = '#4e5a4c', MESH = {c:'#4a5a4c', ds:true, op:0.55}, FRM = '#3d4a40', GLS = {c:'#b9d0d6', op:0.6, glow:'#ffe8c0', gk:0.25}, RF = '#7a5a48';
    for (const K of ZOO_KEEP) ctx.paint(K, [118, 146, 98]);
    for (const P of ZOO.wood) ctx.paint(P, [92, 124, 80]);
    for (const P of ZOO.play) ctx.paint(P, [196, 182, 150]);
    for (const P of ZOO.resv) ctx.paint(P, [128, 152, 104]);
    // the fountain terrace: basin rim, water, the jet
    for (const P of ZOO.water){ const y = Math.min(...P.map(p => gy(p[0], p[1]))); const c = cen(P);
      prism(B.a(ST), offsetRing(P, 0.7), y - 1.0, y + 0.6, false); prism(B.a(ST), offsetRing(P, 0.7), y + 0.45, y + 0.6, true);
      prism(B.a(WAT), P, y - 0.5, y + 0.4, true); LCyl(g, 0.7, 1.4, 1.2, c[0], y + 0.4, c[1], ST, 10); LCyl(g, 0.15, 0.35, 5, c[0], y + 1.6, c[1], {c:'#e8f4ff', glow:'#cfeaff', gk:0.6, op:0.75}, 8);
      ctx.paint(offsetRing(P, 6), [196, 188, 170]); }
    // the Chinese War Memorial (a granite memorial gateway) near the Garden Road entrance and King George VI's statue
    { const x = 147.1, z = 23.5, y = gy(x, z), a = -0.62, f = F(x, z, a);
      fbox(B.a(ST), f, a, 0, 0, 12, 3.2, y - 1, y + 0.6);
      for (const u of [-5, -1.8, 1.8, 5]) fbox(B.a(ST), f, a, u, 0, 0.9, 0.9, y + 0.6, y + 6.4);
      fbox(B.a(ST), f, a, 0, 0, 11.6, 1.4, y + 6.4, y + 7.4); hipB(B.a('#9a948a'), f, 0, 0, 7, 1.6, y + 7.4, 1.2, 0.5, true); }
    { const x = 16.8, z = 41.4, y = gy(x, z); LBox(g, 2.4, 0.6, 2.4, x, y - 0.3, z, ST); LBox(g, 1.5, 2.6, 1.5, x, y + 0.3, z, ST); LCyl(g, 0.35, 0.45, 1.5, x, y + 2.9, z, BRZ, 8); LSph(g, 0.3, x, y + 4.7, z, BRZ, 1, 8); }
    // free spots (not on a path, inside the keep) for the generic aviaries / glasshouse
    const dSeg = (x, z, p, q) => { const dx = q[0] - p[0], dz = q[1] - p[1], L2 = dx*dx + dz*dz || 1; let t = ((x - p[0])*dx + (z - p[1])*dz)/L2; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] + dx*t - x, p[1] + dz*t - z); };
    const clear = (x, z, r) => { if (!ZOO_KEEP.some(K => inPoly(K, x, z))) return false; for (const P of ZOO.paths) for (let i = 0; i < P.length - 1; i++) if (dSeg(x, z, P[i], P[i + 1]) < r) return false; for (const P of ZOO.water) if (inPoly(offsetRing(P, r), x, z)) return false; return true; };
    const spots = []; for (let k = 0; k < 400 && spots.length < 4; k++){ const x = -60 + R()*220, z = -40 + R()*170, r = spots.length < 3 ? 9 : 8; if (clear(x, z, r + 2) && spots.every(s => Math.hypot(s[0] - x, s[1] - z) > 30)) spots.push([x, z, r]); }
    spots.forEach(([x, z, r], i) => { const y = Math.min(gy(x - r, z), gy(x + r, z), gy(x, z - r), gy(x, z + r));
      if (i < 3){ // aviary: a mesh dome on a low wall with steel ribs
        LCyl(g, r, r, 1.2, x, y - 0.6, z, ST, 16); LDome(g, r, x, y + 0.6, z, MESH, 0.85, 16);
        for (let k = 0; k < 8; k++){ const t = k/8*TAU, P = []; for (let j = 0; j <= 6; j++){ const e = j/6*HP; P.push([x + Math.cos(t)*Math.cos(e)*r, y + 0.6 + Math.sin(e)*r*0.85, z + Math.sin(t)*Math.cos(e)*r]); } for (let j = 0; j < 6; j++) beamB(B.a(FRM), P[j], P[j + 1], 0.18); } }
      else { const a = R()*PI, f = F(x, z, a); fbox(B.a(ST), f, a, 0, 0, 15, 8, y - 0.8, y + 0.8); fbox(B.a(GLS), f, a, 0, 0, 14, 7, y + 0.8, y + 4.8); hipB(B.a(GLS), f, 0, 0, 14, 7, y + 4.8, 2.2, 0.1, true); } });
    // the two small mapped houses (animal houses / stores)
    for (const P of ZOO_HOUSES){ const y = Math.min(...P.map(p => gy(p[0], p[1]))), a = axisOf(P), bx = frameBox(P, a), f = F(0, 0, a);
      prism(B.a('#e4ddcc'), P, y - 1, y + 4.2, true); hipB(B.a(RF), f, (bx[0] + bx[2])/2, (bx[1] + bx[3])/2, bx[2] - bx[0], bx[3] - bx[1], y + 4.2, 1.8, 0.4); }
    // trees: the old trees of the gardens (denser in the wooded parts), lamps along the paths
    const W = ZOO.wood; let nt = 0;
    for (let k = 0; k < 1400 && nt < 260; k++){ const x = -235 + R()*400, z = -140 + R()*295; const inW = W.some(P => inPoly(P, x, z)); if (!inW && R() > 0.35) continue; if (!clear(x, z, inW ? 2.5 : 4)) continue;
      ctx.tree(x, z, inW ? 3.2 + R()*1.6 : 2.6 + R()*1.8, R() < 0.3 ? 'raintree' : R() < 0.15 ? 'palm' : 'd'); nt++; }
    for (const P of ZOO.paths) for (const [x, z] of along(P, 26, 6)) ctx.lamp(x + 1.2, gy(x, z) + 3.8, z, [255, 214, 160]);
    B.flush(g); return g; }}});
}

}
