// ===== lm20/w4: Orchard / Scotts Road, the Istana, Little India and two Buddhist monasteries =====
// Tang Plaza (TANGS + Marriott tower), Goodwood Park Hotel, The Istana, Sri Srinivasa Perumal Temple,
// Kong Meng San Phor Kark See Monastery (core of the Bright Hill complex), Lian Shan Shuang Lin Monastery.
// Block-scoped: only LANDMARKS and SG_PLACES are touched. Real dimensions in metres; y = 0 is the ground (the highest
// ground within r + 0.6 m). Unless noted, the local frame is the real map frame (+x east, +z south, rot 0) with the
// origin at the SG_PLACES point, so the plans below are the real OSM footprints. Foundations reach down the slopes.
{
const PI = Math.PI, HP = PI/2, TAU = PI*2;
// ---- triangle batches: many small parts of one colour spec become one LTris call ----
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const quadP = (o, a, b, c, d) => o.push(...a, ...b, ...c, ...a, ...c, ...d);
const triP = (o, a, b, c) => o.push(...a, ...b, ...c);
// box (w along x, d along z) standing on y, turned ry about its centre
function boxP(o, w, h, d, x, y, z, ry){
  const c = Math.cos(ry || 0), s = Math.sin(ry || 0), hw = w/2, hd = d/2;
  const R = (px, py, pz) => [x + px*c + pz*s, py, z - px*s + pz*c];
  const P = [R(-hw, y, -hd), R(hw, y, -hd), R(hw, y, hd), R(-hw, y, hd), R(-hw, y+h, -hd), R(hw, y+h, -hd), R(hw, y+h, hd), R(-hw, y+h, hd)];
  for (const [a, b, e, f] of [[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]) quadP(o, P[a], P[b], P[e], P[f]);
}
// box between x0..x1, y0..y1, z0..z1 (no rotation)
const bxP = (o, x0, x1, y0, y1, z0, z1) => boxP(o, x1 - x0, y1 - y0, z1 - z0, (x0 + x1)/2, y0, (z0 + z1)/2);
// plan polygons ([x, z] points)
const tri2 = P => THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
function capP(o, P, y){ for (const [a, b, c] of tri2(P)) o.push(P[a][0], y, P[a][1], P[b][0], y, P[b][1], P[c][0], y, P[c][1]); }
function wallP(o, P, y0, y1, open){ const n = P.length; for (let i = 0; i < (open ? n - 1 : n); i++){ const a = P[i], b = P[(i+1) % n]; quadP(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); } }
function prismP(o, P, y0, y1, bot){ wallP(o, P, y0, y1); capP(o, P, y1); if (bot) capP(o, P, y0); }
const rectXZ = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const ctr = P => { let x = 0, z = 0; for (const p of P){ x += p[0]; z += p[1]; } return [x/P.length, z/P.length]; };
// offset a closed plan polygon inwards by d (negative = outwards; miter, simple polygons)
function offP(P, d){
  const n = P.length; let A = 0; for (let i = 0; i < n; i++){ const a = P[i], b = P[(i+1) % n]; A += a[0]*b[1] - b[0]*a[1]; }
  const sg = A > 0 ? -1 : 1, out = [];
  for (let i = 0; i < n; i++){
    const p = P[(i + n - 1) % n], c = P[i], q = P[(i+1) % n];
    let e1 = [c[0] - p[0], c[1] - p[1]], e2 = [q[0] - c[0], q[1] - c[1]]; const l1 = Math.hypot(...e1) || 1, l2 = Math.hypot(...e2) || 1;
    e1 = [e1[0]/l1, e1[1]/l1]; e2 = [e2[0]/l2, e2[1]/l2];
    const n1 = [e1[1]*sg, -e1[0]*sg], n2 = [e2[1]*sg, -e2[0]*sg], m = [n1[0] + n2[0], n1[1] + n2[1]], ml = Math.hypot(...m) || 1;
    const cs = Math.max(0.35, (m[0]*n1[0] + m[1]*n1[1])/ml);
    out.push([c[0] + m[0]/ml*d/cs, c[1] + m[1]/ml*d/cs]);
  }
  return out;
}
// points along a closed polygon every `step` m (for parapet merlons, lamps, mullions): [x, z, edge direction angle]
function alongP(P, step, inset){
  const out = [];
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.5) continue;
    const n = Math.max(1, Math.round(L/step)), ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    for (let k = 0; k < n; k++){ const t = (k + 0.5)/n; out.push([a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t, ang, L/n]); } }
  return out;
}
// surface of revolution into a batch: prof [[r, y], ...] bottom to top; n sides; ph = start angle
function latheP(o, prof, cx, cz, n, ph, sx, sz){
  ph = ph || 0; sx = sx || 1; sz = sz || 1;
  for (let j = 0; j < prof.length - 1; j++){ const [r0, y0] = prof[j], [r1, y1] = prof[j+1];
    for (let i = 0; i < n; i++){ const a0 = ph + i/n*TAU, a1 = ph + (i+1)/n*TAU;
      quadP(o, [cx + Math.cos(a0)*r0*sx, y0, cz + Math.sin(a0)*r0*sz], [cx + Math.cos(a1)*r0*sx, y0, cz + Math.sin(a1)*r0*sz], [cx + Math.cos(a1)*r1*sx, y1, cz + Math.sin(a1)*r1*sz], [cx + Math.cos(a0)*r1*sx, y1, cz + Math.sin(a0)*r1*sz]); } }
}
// cylinder segment between two points into a batch (n-sided prism)
function segP(o, a, b, r, n){
  n = n || 4; const d = [b[0]-a[0], b[1]-a[1], b[2]-a[2]], L = Math.hypot(...d); if (L < 1e-4) return; d[0] /= L; d[1] /= L; d[2] /= L;
  const up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let u = [d[1]*up[2] - d[2]*up[1], d[2]*up[0] - d[0]*up[2], d[0]*up[1] - d[1]*up[0]]; const ul = Math.hypot(...u); u = u.map(q => q/ul);
  const v = [d[1]*u[2] - d[2]*u[1], d[2]*u[0] - d[0]*u[2], d[0]*u[1] - d[1]*u[0]];
  const ring = p => { const R = []; for (let i = 0; i < n; i++){ const t = (i + 0.5)/n*TAU, c = Math.cos(t)*r, s = Math.sin(t)*r; R.push([p[0]+u[0]*c+v[0]*s, p[1]+u[1]*c+v[1]*s, p[2]+u[2]*c+v[2]*s]); } return R; };
  const A = ring(a), B = ring(b); for (let i = 0; i < n; i++){ const j = (i+1) % n; quadP(o, A[i], A[j], B[j], B[i]); }
}
// facade frames: F(u, v, w) -> point; u along the facade, v up, w outwards
const fZ = (z, s, cx) => (u, v, w) => [(cx || 0) + s*u, v, z + s*(w || 0)];       // plane z = const, facing s*z
const fX = (x, s, cz) => (u, v, w) => [x + s*(w || 0), v, (cz || 0) - s*u];       // plane x = const, facing s*x
const fA = (x, z, ang) => { const c = Math.cos(ang), s = Math.sin(ang); return (u, v, w) => [x + c*u + s*(w || 0), v, z + s*u - c*(w || 0)]; }; // along direction ang (x->z), outward = right-hand normal
// a flat outline ([u, v] points) on a facade at offset w
function shapeP(o, pts, F, w){ for (const [a, b, c] of tri2(pts)) o.push(...F(pts[a][0], pts[a][1], w), ...F(pts[b][0], pts[b][1], w), ...F(pts[c][0], pts[c][1], w)); }
// the same outline as a slab between offsets w0 and w1 (front face + sides)
function slabP(o, pts, F, w0, w1){ shapeP(o, pts, F, w1); for (let i = 0; i < pts.length; i++){ const a = pts[i], b = pts[(i+1) % pts.length]; quadP(o, F(a[0], a[1], w0), F(b[0], b[1], w0), F(b[0], b[1], w1), F(a[0], a[1], w1)); } }
const mv = (P, du, dv) => P.map(p => [p[0] + du, p[1] + dv]);
// outlines in the facade plane
const rectO = (u0, u1, v0, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
const rArchO = (hw, ht, n) => { const P = [[-hw, 0], [hw, 0]]; for (let i = 0; i <= (n || 8); i++){ const a = PI*i/(n || 8); P.push([Math.cos(a)*hw, ht - hw + Math.sin(a)*hw]); } return P; };
const pArchO = (hw, ht, n) => pointedArch(hw, ht, n || 5);
// ogee / cusped (Mughal) arch: pointed arch with a small reverse curve at the apex
const ogArchO = (hw, ht, n) => { n = n || 6; const hs = ht - hw*1.25, P = [[-hw, 0], [hw, 0], [hw, hs]];
  for (let i = 1; i < n; i++){ const t = i/n, a = t*HP; P.push([hw*Math.cos(a)*(1 - 0.18*t*t), hs + hw*0.95*Math.sin(a) + hw*0.3*t*t*t]); }
  P.push([0, ht]);
  for (let i = n - 1; i >= 1; i--){ const t = i/n, a = t*HP; P.push([-hw*Math.cos(a)*(1 - 0.18*t*t), hs + hw*0.95*Math.sin(a) + hw*0.3*t*t*t]); }
  P.push([-hw, hs]); return P; };
// a ring of n points round (cx, cz)
const ringPts = (cx, cz, r, n, ph) => { const P = []; for (let i = 0; i < n; i++){ const a = (ph || 0) + i/n*TAU; P.push([cx + Math.cos(a)*r, cz + Math.sin(a)*r]); } return P; };
const lerp = (a, b, t) => a + (b - a)*t;
// parapet: a wall of thickness t along every edge of a closed plan polygon (inside it), y0..y1
function parP(o, P, y0, y1, t){ const c = ctr(P); for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.05) continue;
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]); let nx = -(b[1] - a[1])/L, nz = (b[0] - a[0])/L; const mx = (a[0] + b[0])/2, mz = (a[1] + b[1])/2; if (nx*(c[0] - mx) + nz*(c[1] - mz) < 0){ nx = -nx; nz = -nz; }
  boxP(o, L + t*0.0, y1 - y0, t, mx + nx*t/2, y0, mz + nz*t/2, -ang); } }
// a crescent (horns up) outline, ~1.1 m across
const CRES = (() => { const P = []; for (let i = 0; i <= 12; i++){ const a = PI*0.25 + i/12*PI*1.5; P.push([Math.cos(a)*0.55, Math.sin(a)*0.55]); }
  for (let i = 1; i < 12; i++){ const a = -1.227 - i/12*(TAU - 2*1.227); P.push([0.25 + Math.cos(a)*0.413, Math.sin(a)*0.413]); } return P; })();
// vertex-coloured batch: any number of colours in one material (colourful stucco sculpture, painted bands)
const mkV = () => ({pos:[], col:[]});
const _vc = {};
function vAdd(V, hex, fn){ const t = []; fn(t); let c = _vc[hex]; if (!c){ const k = new THREE.Color(hex); c = _vc[hex] = [k.r, k.g, k.b]; } for (let i = 0; i < t.length; i++) V.pos.push(t[i]); for (let i = 0; i < t.length; i += 3) V.col.push(c[0], c[1], c[2]); }
function vFlush(g, V, spec){ if (!V.pos.length) return; const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(V.pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(V.col, 3)); geo.computeVertexNormals(); lmAdd(g, geo, Object.assign({c:'#ffffff', vc:true, ds:true}, spec || {}), 0, 0, 0, 0); V.pos = []; V.col = []; }
// rectangular frustum into a batch: Lb x Wb at y0 to Lt x Wt at y0 + h, centred (cx, cz); top cap
function frustP(o, cx, cz, Lb, Wb, Lt, Wt, y0, h, nocap){
  const b = [[cx - Lb/2, y0, cz - Wb/2], [cx + Lb/2, y0, cz - Wb/2], [cx + Lb/2, y0, cz + Wb/2], [cx - Lb/2, y0, cz + Wb/2]];
  const t = [[cx - Lt/2, y0 + h, cz - Wt/2], [cx + Lt/2, y0 + h, cz - Wt/2], [cx + Lt/2, y0 + h, cz + Wt/2], [cx - Lt/2, y0 + h, cz + Wt/2]];
  for (let i = 0; i < 4; i++){ const j = (i + 1) % 4; quadP(o, b[i], b[j], t[j], t[i]); }
  if (!nocap) quadP(o, t[0], t[3], t[2], t[1]);
}
const sArea = P => { let A = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; A += a[0]*b[1] - b[0]*a[1]; } return A/2; };
// facade frames of a plan polygon's edges: u from 0 at P[i] to L at P[i+1], v up, w outwards
function edgesF(P){ const sg = sArea(P) > 0 ? 1 : -1, out = [];
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-6, ex = (b[0] - a[0])/L, ez = (b[1] - a[1])/L, nx = ez*sg, nz = -ex*sg;
    out.push({L, ang:Math.atan2(ez, ex), nx, nz, a, b, F:(u, v, w) => [a[0] + ex*u + nx*(w || 0), v, a[1] + ez*u + nz*(w || 0)]}); }
  return out; }
// East Asian roof into a batch: from half-sizes (a0, b0) at y to (a1, b1) at y + h (hip: a1 = ridge half-length, b1 = 0;
// pent roof round a wall: a1, b1 = the wall; pyramid: 0, 0), concave profile (pw), corners swept up by `lift`, turned ry.
// opt.gab (0..1): hip-and-gable - the ends stop moving in at that fraction and a gable (opt.gcol) closes the top;
// opt.sag: the ridge and eaves sag in the middle and rise towards the ends (Hokkien curved ridges);
// opt.fas: fascia depth under the eave line (into opt.fo); opt.hips / opt.ridge: batches for hip and ridge rolls
function roofP(o, cx, cz, a0, b0, a1, b1, y, h, opt){
  opt = opt || {}; const n = opt.n || 6, nt = opt.nt || 5, pw = opt.pw || 1.7, lift = opt.lift || 0, c = Math.cos(opt.ry || 0), s = Math.sin(opt.ry || 0), gab = opt.gab || 0, sag = opt.sag || 0;
  const R = (x, yy, z) => [cx + x*c + z*s, yy, cz - x*s + z*c];
  const A_ = u => gab ? (u < gab ? a0 + (a1 - a0)*u/gab : a1) : a0 + (a1 - a0)*u;
  const ring = (u, dy) => {
    const a = A_(u), b = b0 + (b1 - b0)*u, yy = y + h*Math.pow(u, pw) + dy, lu = lift*Math.pow(1 - u, 2), P = [];
    const C = [[-a, -b], [a, -b], [a, b], [-a, b]];
    for (let k = 0; k < 4; k++){ const A = C[k], B = C[(k+1) % 4]; for (let i = 0; i < n; i++){ const t = i/n, cc = Math.pow(Math.abs(2*t - 1), 4), f = 1 + 0.03*cc*(1 - u)*(lift ? 1 : 0), lx = (A[0] + (B[0] - A[0])*t)*f, lz = (A[1] + (B[1] - A[1])*t)*f;
      P.push(R(lx, yy + lu*cc + sag*Math.pow(Math.min(1, Math.abs(lx)/Math.max(0.1, a0)), 2)*(0.35 + 0.65*u), lz)); } }
    return P;
  };
  const S = []; for (let i = 0; i <= nt; i++) S.push(ring(i/nt, 0));
  const m = 4*n, loft = (o2, A, B2) => { for (let i = 0; i < m; i++){ const j = (i + 1) % m; quadP(o2, A[i], A[j], B2[j], B2[i]); } };
  for (let i = 0; i < nt; i++) loft(o, S[i], S[i+1]);
  if (opt.fas) loft(opt.fo || o, ring(0, -opt.fas), S[0]);
  if (opt.hips){ for (let k = 0; k < 4; k++){ const P = []; for (let i = 0; i <= nt; i++){ if (gab && i/nt > gab + 1e-6) break; P.push(S[i][k*n]); } for (let i = 0; i < P.length - 1; i++) segP(opt.hips, [P[i][0], P[i][1] + 0.12, P[i][2]], [P[i+1][0], P[i+1][1] + 0.12, P[i+1][2]], opt.hr || 0.16, 4); } }
  const yt = y + h;
  if (gab && opt.gcol){ const yg = y + h*Math.pow(gab, pw), bg = b0 + (b1 - b0)*gab, sg = sag*0.35 + sag*0.65*gab, st = sag; for (const sx of [-1, 1]){ const x = sx*(a1 + 0.02); triP(opt.gcol, R(x, yg + sg, -bg), R(x, yg + sg, bg), R(x, yt + st, 0)); } }
  if (opt.ridge && a1 > 0.3 && b1 < 0.05){ const N = sag ? 8 : 1; for (let i = 0; i < N; i++){ const xa = -a1 - 0.2 + (2*a1 + 0.4)*i/N, xb = -a1 - 0.2 + (2*a1 + 0.4)*(i + 1)/N, ya = yt + 0.15 + sag*Math.pow(Math.min(1, Math.abs(xa)/a0), 2), yb = yt + 0.15 + sag*Math.pow(Math.min(1, Math.abs(xb)/a0), 2), p = R(xa, ya, 0), q = R(xb, yb, 0); segP(opt.ridge, p, q, opt.rr || 0.3, 4); } }
  return yt;
}
// chiwei / ridge-end ornament: a curled fin standing on the ridge at (x, y, z), facing along ang
function chiweiP(o, x, y, z, ang, s){ const P = [[-0.5, 0], [0.45, 0], [0.55, 0.6], [0.35, 1.25], [0.0, 1.55], [-0.15, 1.2], [0.15, 1.0], [0.1, 0.6], [-0.35, 0.45]].map(p => [p[0]*s, p[1]*s]);
  slabP(o, P, fA(x, z, ang), -0.12*s, 0.12*s); }
// ---- additions (w4) ----
// fit a rotated rectangle to a plan polygon in the direction ang (x->z): centre, half-sizes along/across, ry for boxP/roofP
function fitR(P, ang){ const c = Math.cos(ang), s = Math.sin(ang); let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
  for (const p of P){ const u = p[0]*c + p[1]*s, v = -p[0]*s + p[1]*c; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
  const uc = (u0 + u1)/2, vc = (v0 + v1)/2; return {cx:uc*c - vc*s, cz:uc*s + vc*c, a:(u1 - u0)/2, b:(v1 - v0)/2, ang, ry:-ang}; }
// a local frame on a rotated rectangle: L(u, y, v) -> [x, y, z] (u along the long axis, v across)
const frameR = (cx, cz, ang) => { const c = Math.cos(ang), s = Math.sin(ang); return (u, y, v) => [cx + u*c - v*s, y, cz + u*s + v*c]; };
// the four corners of a fitted rectangle (inset d)
const cornersR = (f, d) => { const L = frameR(f.cx, f.cz, f.ang), a = f.a - (d || 0), b = f.b - (d || 0); return [[-a, -b], [a, -b], [a, b], [-a, b]].map(q => { const p = L(q[0], 0, q[1]); return [p[0], p[2]]; }); };
// regular n-gon roof into a batch: radius r0 at y to r1 at y + h (concave profile pw), corners swept up by lift
function polyRoofP(o, cx, cz, n, ph, r0, r1, y, h, opt){
  opt = opt || {}; const nt = opt.nt || 5, pw = opt.pw || 1.7, lift = opt.lift || 0, sub = opt.sub || 3;
  const ring = (u, dy) => { const r = r0 + (r1 - r0)*u, yy = y + h*Math.pow(u, pw) + dy, lu = lift*Math.pow(1 - u, 2), P = [];
    for (let k = 0; k < n; k++){ const a0 = ph + k/n*TAU, a1 = ph + (k+1)/n*TAU; for (let i = 0; i < sub; i++){ const t = i/sub, cc = Math.pow(Math.abs(2*t - 1), 4), x = Math.cos(a0)*(1 - t) + Math.cos(a1)*t, z = Math.sin(a0)*(1 - t) + Math.sin(a1)*t, f = 1 + 0.03*cc*(1 - u)*(lift ? 1 : 0);
      P.push([cx + x*r*f, yy + lu*cc, cz + z*r*f]); } }
    return P; };
  const S = []; for (let i = 0; i <= nt; i++) S.push(ring(i/nt, 0));
  const m = n*sub, loft = (o2, A, B2) => { for (let i = 0; i < m; i++){ const j = (i + 1) % m; quadP(o2, A[i], A[j], B2[j], B2[i]); } };
  for (let i = 0; i < nt; i++) loft(o, S[i], S[i+1]);
  if (opt.fas) loft(opt.fo || o, ring(0, -opt.fas), S[0]);
  if (opt.hips) for (let k = 0; k < n; k++) for (let i = 0; i < nt; i++){ const p = S[i][k*sub], q = S[i+1][k*sub]; segP(opt.hips, [p[0], p[1] + 0.1, p[2]], [q[0], q[1] + 0.1, q[2]], opt.hr || 0.16, 4); }
  if (opt.cap && r1 > 0.05) capP(o, S[nt].filter((_, i) => i % sub === 0).map(p => [p[0], p[2]]), y + h);
  return y + h;
}
// a regular n-gon prism wall (vertices at angle ph + k/n*TAU), optional cap
function ngonP(o, cx, cz, n, ph, r, y0, y1, cap){ const P = ringPts(cx, cz, r, n, ph); wallP(o, P, y0, y1); if (cap) capP(o, P, y1); return P; }
// clockwise/ccw-agnostic polygon edge midpoint-normal helper for alongP-like placement with an outward normal
function edgesOut(P){ return edgesF(P); }
// 2-D convex hull (monotone chain), returns CCW-in-math (x, z) order
function hullP(pts){ const P = pts.map(p => [p[0], p[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0])*(b[1] - o[1]) - (a[1] - o[1])*(b[0] - o[0]), lo = [], up = [];
  for (const p of P){ while (lo.length >= 2 && cr(lo[lo.length-2], lo[lo.length-1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = P.length - 1; i >= 0; i--){ const p = P[i]; while (up.length >= 2 && cr(up[up.length-2], up[up.length-1], p) <= 0) up.pop(); up.push(p); }
  up.pop(); lo.pop(); return lo.concat(up); }
// per-edge inward offset of a convex polygon: edge i (P[i] -> P[i+1]) moves inwards by d[i] (negative = outwards)
function offPe(P, d){ const n = P.length, sg = sArea(P) > 0 ? 1 : -1, L = [];
  for (let i = 0; i < n; i++){ const a = P[i], b = P[(i+1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-6, ex = (b[0] - a[0])/l, ez = (b[1] - a[1])/l, nx = -ez*sg, nz = ex*sg;
    L.push({p:[a[0] + nx*d[i], a[1] + nz*d[i]], e:[ex, ez]}); }
  const out = [];
  for (let i = 0; i < n; i++){ const A = L[(i + n - 1) % n], Bq = L[i], den = A.e[0]*Bq.e[1] - A.e[1]*Bq.e[0];
    if (Math.abs(den) < 1e-6){ out.push(Bq.p); continue; }
    const t = ((Bq.p[0] - A.p[0])*Bq.e[1] - (Bq.p[1] - A.p[1])*Bq.e[0])/den, X = [A.p[0] + A.e[0]*t, A.p[1] + A.e[1]*t], P0 = P[i];
    const lim = 2.5*Math.max(Math.abs(d[i]), Math.abs(d[(i + n - 1) % n])) + 0.3;
    if (Math.hypot(X[0] - P0[0], X[1] - P0[1]) > lim){ const ip = (i + n - 1) % n, a2 = P[ip], nx = -(P0[1] - a2[1])*sg, nz = (P0[0] - a2[0])*sg, l = Math.hypot(nx, nz) || 1; out.push([(P0[0] + nx/l*d[ip] + Bq.p[0])/2, (P0[1] + nz/l*d[ip] + Bq.p[1])/2]); }
    else out.push(X); }
  return out; }
// cap of a polygon with holes at height y
function capHoleP(o, P, H, y){ const v = p => new THREE.Vector2(p[0], p[1]), all = P.concat(...H);
  for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(P.map(v), H.map(h => h.map(v)))) o.push(all[a][0], y, all[a][1], all[b][0], y, all[b][1], all[c][0], y, all[c][1]); }
// distance from a point to a segment
const segD = (p, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx*dx + dz*dz || 1e-9, t = Math.max(0, Math.min(1, ((p[0] - a[0])*dx + (p[1] - a[1])*dz)/l2)); return Math.hypot(p[0] - a[0] - t*dx, p[1] - a[1] - t*dz); };
// hipped roofs over a set of convex zones that share edges: slopes only on the outer edges (an edge is shared when its
// midpoint lies on another zone's edge), eaves overhanging by `ov`, the inner flat at y + rise (inset `din`)
function zoneRoofs(o, Z, y, rise, din, ov, ridge, only, allExt){
  for (let zi = 0; zi < Z.length; zi++){ if (only && !only.includes(zi)) continue; const P = Z[zi], n = P.length, ext = [];
    for (let i = 0; i < n; i++){ const a = P[i], b = P[(i+1) % n], m = [(a[0] + b[0])/2, (a[1] + b[1])/2]; let sh = false;
      for (let zj = 0; zj < Z.length && !sh; zj++){ if (zj === zi) continue; const Q = Z[zj]; for (let k = 0; k < Q.length; k++) if (segD(m, Q[k], Q[(k+1) % Q.length]) < 1.2){ sh = true; break; } }
      ext.push(allExt || !sh); }
    let w = 1e9; for (let i = 0; i < n; i++){ const a = P[i], b = P[(i+1) % n]; w = Math.min(w, Math.max(...P.map(r => segD(r, a, b)))); }
    const dd = Math.min(din, w*0.42), O = offPe(P, ext.map(e => e ? -ov : 0)), I = offPe(P, ext.map(e => e ? dd : 0));
    for (let i = 0; i < n; i++){ const j = (i + 1) % n; quadP(o, [O[i][0], y, O[i][1]], [O[j][0], y, O[j][1]], [I[j][0], y + rise, I[j][1]], [I[i][0], y + rise, I[i][1]]); }
    capP(o, I, y + rise);
    if (ridge) for (let i = 0; i < n; i++){ const j = (i + 1) % n; if (ext[i]) segP(ridge, [I[i][0], y + rise + 0.08, I[i][1]], [I[j][0], y + rise + 0.08, I[j][1]], 0.12, 4); }
  } }
// ---- generic Chinese temple hall on a fitted rectangle f (fitR): podium, columns and lattice walls, roof ----
// o: {y0 floor, yb podium bottom, pm podium margin, wh wall height, roof:'hip'|'xs'|'dbl'|'gab', rise, ov, lift, sag, pw,
//     M:{pod, wall, col, win, beam, tile, ridge, gold, bal} batches, colStep, front:[sides with doors: 'n','s','e','w' in the
//     local frame: s = +v side], bal: balustrade on the podium edge, orn: ridge ornaments ('chi' chiwei, 'swt' swallowtails)}
function chHall(f, o){
  if (f.a < f.b) f = {cx:f.cx, cz:f.cz, a:f.b, b:f.a, ang:f.ang + HP, ry:-(f.ang + HP)};   // ridge along the long side
  const M = o.M, L = frameR(f.cx, f.cz, f.ang), a = f.a, b = f.b, y0 = o.y0 || 0, wh = o.wh || 6, pm = o.pm === undefined ? 1.5 : o.pm, ov = o.ov || 2.2;
  const rect = (A, Bq) => [L(-A, 0, -Bq), L(A, 0, -Bq), L(A, 0, Bq), L(-A, 0, Bq)].map(p => [p[0], p[2]]);
  // podium with a moulded top
  if (o.yb !== undefined){ prismP(M.pod, rect(a + pm, b + pm), o.yb, y0); if (o.bal) parP(M.bal, rect(a + pm, b + pm), y0, y0 + 1.0, 0.25); }
  const ai = a - 1.0, bi = b - 1.0;            // the wall line inside the veranda
  const W = rect(ai, bi); wallP(M.wall, W, y0, y0 + wh);
  // veranda columns and lattice panels on every face
  const st = o.colStep || 3.4;
  for (const e of edgesF(rect(a - 0.2, b - 0.2))){ const n = Math.max(1, Math.round(e.L/st));
    for (let k = 0; k <= n; k++){ const p = e.F(e.L*k/n, 0, 0); latheP(M.col, [[0.34, y0], [0.3, y0 + 0.4], [0.28, y0 + wh - 0.2], [0.36, y0 + wh]], p[0], p[2], 8); } }
  for (const e of edgesF(W)){ const n = Math.max(1, Math.round(e.L/st));
    for (let k = 0; k < n; k++){ const u0 = e.L*k/n + 0.35, u1 = e.L*(k + 1)/n - 0.35; shapeP(M.win, rectO(u0, u1, y0 + 0.6, y0 + wh - 0.9), e.F, 0.04);
      for (let j = 1; j < 5; j++){ const u = lerp(u0, u1, j/5); shapeP(M.wall, rectO(u - 0.05, u + 0.05, y0 + 0.6, y0 + wh - 0.9), e.F, 0.07); } }
    slabP(M.beam, rectO(-1.0, e.L + 1.0, y0 + wh - 0.7, y0 + wh), e.F, 0.0, 1.0); }
  capP(M.wall, W, y0 + wh);
  const yr = y0 + wh - 0.2, rise = o.rise || Math.min(9, b*0.62), ropt = {ry:f.ry, lift:o.lift === undefined ? 0.7 : o.lift, pw:o.pw || 1.55, nt:6, fas:0.4, fo:M.beam, hips:M.ridge, hr:0.2, ridge:M.ridge, rr:0.32, sag:o.sag || 0};
  let top = yr;
  if (o.roof === 'dbl'){
    roofP(M.tile, f.cx, f.cz, a + ov, b + ov, ai - 0.2, bi - 0.2, yr, 1.6, {ry:f.ry, lift:ropt.lift*0.7, pw:1.3, nt:3, fas:0.35, fo:M.beam, sag:ropt.sag*0.5});
    const y2 = yr + 1.4, h2 = o.cl || 2.4, W2 = rect(ai - 1.2, bi - 1.2); wallP(M.wall, W2, y2, y2 + h2);
    for (const e of edgesF(W2)){ const n = Math.max(1, Math.round(e.L/2.2)); for (let k = 0; k < n; k++) shapeP(M.win, rectO(e.L*k/n + 0.25, e.L*(k + 1)/n - 0.25, y2 + 0.3, y2 + h2 - 0.3), e.F, 0.04); slabP(M.beam, rectO(0, e.L, y2 + h2 - 0.45, y2 + h2), e.F, 0, 0.4); }
    const y3 = y2 + h2 - 0.2, a3 = ai - 1.2, b3 = bi - 1.2;
    top = roofP(M.tile, f.cx, f.cz, a3 + ov*0.9, b3 + ov*0.9, Math.max(0.6, a3 - b3), 0, y3, rise, Object.assign({}, ropt, {gab:o.xs ? 0.45 : 0, gcol:o.xs ? (M.gab || M.wall) : null}));
  } else if (o.roof === 'gab'){
    top = roofP(M.tile, f.cx, f.cz, a + ov*0.6, b + ov, a + ov*0.6, 0, yr, rise, Object.assign({}, ropt, {gab:0.001, gcol:M.wall, lift:0}));
  } else {
    top = roofP(M.tile, f.cx, f.cz, a + ov, b + ov, Math.max(0.6, a - b), 0, yr, rise, Object.assign({}, ropt, {gab:o.roof === 'xs' ? 0.45 : 0, gcol:o.roof === 'xs' ? (M.gab || M.wall) : null}));
  }
  // ridge ornaments
  const ra = o.roof === 'gab' ? a + ov*0.6 : Math.max(0.6, (o.roof === 'dbl' ? (ai - 1.2) - (bi - 1.2) : a - b));
  if (o.orn === 'chi'){ for (const s of [1, -1]){ const p = L(s*(ra + 0.1), 0, 0); chiweiP(M.gold, p[0], top + 0.2 + (o.sag || 0), p[2], f.ang + (s > 0 ? 0 : PI), Math.min(2.2, 0.9 + b*0.06)); }
    const c = L(0, 0, 0); latheP(M.gold, [[0.45, top + 0.3], [0.6, top + 0.6], [0.4, top + 1.0], [0.1, top + 1.6]], c[0], c[2], 8); }
  if (o.orn === 'swt'){ const k = Math.min(1, 0.45 + b*0.07); for (const s of [1, -1]) for (const t of [1, -1]){ const P = [[ra*0.92, 0, 0], [ra + 0.4*k, 0.15*k, t*0.12*k], [ra + 0.9*k, 0.55*k, t*0.24*k], [ra + 1.25*k, 1.15*k, t*0.34*k], [ra + 1.4*k, 1.7*k, t*0.42*k]];
      for (let k = 0; k < P.length - 1; k++){ const A2 = L(s*P[k][0], top + (o.sag || 0) + P[k][1] + 0.2, P[k][2]), B2 = L(s*P[k+1][0], top + (o.sag || 0) + P[k+1][1] + 0.2, P[k+1][2]); segP(M.ridge, A2, B2, 0.22 - k*0.035, 4); } } }
  return top;
}

// ================= Tang Plaza (1982): TANGS department store and the Singapore Marriott Tang Plaza Hotel =================
// Corner of Orchard Road and Scotts Road. A five-storey podium in the Chinese-palace manner of the 1958 C.K. Tang store:
// pale stone walls, red colonnades, green glazed-tile pent roofs along the Orchard Road and Scotts Road fronts (a low
// canopy over the Scotts Road colonnade, a deep upper roof band with upturned corners), a pool deck on the podium roof.
// On it the hotel tower (OSM: 30 floors above level 5, white concrete) on its real star-octagon plan, crowned by the
// octagonal green-tiled pagoda roof: a lower skirt eave, the top storey with red columns, the great concave pyramid with
// swept-up corners and a gold finial. Estimated heights: podium 22 m, tower roof 94.5 m, crown to 116 m.
// Frame: real map frame (+x east, +z south). Night: lit hotel windows, floodlit green crown, glowing shopfronts.
LANDMARKS.tangplaza = {zh:'董厦（乌节万豪酒店）', en:'Tang Plaza (Marriott Tang Plaza Hotel)', cat:'new', r:86, h:120,
  lt:{m:1, c:'#ffe6c4', k:0.55},
  build(){
    const g = new THREE.Group(), B = mkB();
    const STONE = {c:'#d9cfb7', m:0, lk:0.55}, RED = {c:'#a3261d', m:0, lk:0.8}, GREEN = {c:'#3f7a52', m:0, lc:'#e0ffd8', lk:0.95, glow:'#2f8a4a', gk:0.4}, GREEN2 = {c:'#2c5a3c', m:0, lk:0.6},
      SHOP = {c:'#3a4048', glow:'#ffdcae', gk:0.8, m:0, lk:0.2}, TW = {c:'#e7e2d6', m:1, fh:2.9, cw:2.6, lk:0.3}, TG = {c:'#6f7c86', m:1, fh:2.9, cw:2.6, lk:0.2},
      ROOF = {c:'#9d9890', m:0, lk:0.2}, PAVE = '#c4bdb0', GOLD = {c:'#d6a640', lc:'#ffd27e', lk:1.3}, WATER = {c:'#5fa8c8', glow:'#9fe0ff', gk:0.45},
      LEAF = '#5a7c4b', CWIN = {c:'#7a3a2a', glow:'#ffcf8a', gk:0.9}, LATT = {c:'#b88a3a', glow:'#ffb862', gk:0.35};
    const RING = [[72.9,-25.9],[70.6,-12.9],[74.7,-11.1],[49.7,36.9],[46.7,35.1],[30.6,64.8],[-47.1,23.3],[-54.2,20.3],[-70.3,-31.3],[-55.4,-62.1],[38.9,-17.6],[43.7,-26.5],[53.8,-21.8],[52.6,-26.5],[53.2,-30.1],[55.6,-33.6],[62.8,-36.6],[67.0,-35.4],[70.6,-33.1],[72.3,-29.5]];
    // the five-storey block: the Scotts Road front stands 5.5 m behind the colonnade
    const POD = [[72.9,-25.9],[70.6,-12.9],[74.7,-11.1],[49.7,36.9],[46.7,35.1],[30.6,64.8],[-47.1,23.3],[-48.9,18.7],[-65.0,-32.9],[-55.4,-62.1],[38.9,-17.6],[43.7,-26.5],[53.8,-21.8],[52.6,-26.5],[53.2,-30.1],[55.6,-33.6],[62.8,-36.6],[67.0,-35.4],[70.6,-33.1],[72.3,-29.5]];
    const TWR = [[-6.5,-25.3],[-1.1,-27.7],[3.1,-30.7],[6.7,-26.5],[16.2,-22.4],[21.0,-21.2],[21.0,-17.0],[24.6,-6.4],[27.6,-2.2],[24.0,0.7],[19.2,10.8],[18.0,15.6],[13.2,15.6],[2.5,19.1],[-1.1,22.1],[-3.5,19.1],[-14.8,13.8],[-19.0,12.6],[-19.0,7.9],[-22.0,-2.2],[-25.0,-6.4],[-22.0,-9.9],[-16.6,-20.0],[-16.0,-24.8]];
    const PT = 22.0, G1 = 6.2, EV = 18.5;
    // fronts with the green roof band: Orchard Road (edge 5), the corner (6), Scotts Road (7), the north-west corner (8)
    const FRONT = new Set([5, 6, 7, 8]);
    // ---- foundation and the Scotts Road colonnade floor ----
    wallP(B.p(STONE), RING, -4, 0.3);
    capP(B.p(PAVE), [[-54.2,20.3],[-70.3,-31.3],[-65.0,-32.9],[-48.9,18.7],[-47.1,23.3]], 0.3);
    // ---- podium ----
    const EP = edgesF(POD);
    const IN = offP(POD, 4.7), CAPP = POD.map((p, i) => (i >= 5 && i <= 9) ? IN[i] : p);
    EP.forEach((e, i) => { const o = B.p(STONE), top = FRONT.has(i) ? EV : PT; quadP(o, e.F(0, 0.3, 0), e.F(e.L, 0.3, 0), e.F(e.L, top, 0), e.F(0, top, 0)); });
    capP(B.p(ROOF), CAPP, PT);
    EP.forEach((e, i) => {
      if (e.L < 1.5) return;
      shapeP(B.p(SHOP), rectO(0.5, e.L - 0.5, 0.6, G1 - 0.4), e.F, 0.04);              // shopfronts
      const fr = FRONT.has(i);
      if (fr){
        // red giant-order columns, cream panels with gilt lattice bands between them, the lower green canopy
        const n = Math.max(1, Math.round(e.L/7.2));
        for (let k = 0; k <= n; k++){ const u = Math.min(e.L - 0.6, Math.max(0.6, e.L*k/n)), p = e.F(u, 0, 0.55); latheP(B.p(RED), [[0.62, G1 + 1.2], [0.55, G1 + 1.6], [0.55, EV - 0.6], [0.7, EV]], p[0], p[2], 8); }
        for (let k = 0; k < n; k++){ const u0 = e.L*k/n + 1.0, u1 = e.L*(k + 1)/n - 1.0; if (u1 - u0 < 1) continue;
          shapeP(B.p(LATT), rectO(u0, u1, 9.6, 11.4), e.F, 0.06); shapeP(B.p(LATT), rectO(u0, u1, 13.8, 15.6), e.F, 0.06);
          for (let j = 1; j < Math.round((u1 - u0)/0.7); j++){ const u = lerp(u0, u1, j/Math.round((u1 - u0)/0.7)); shapeP(B.p(RED), rectO(u - 0.05, u + 0.05, 9.6, 11.4), e.F, 0.09); shapeP(B.p(RED), rectO(u - 0.05, u + 0.05, 13.8, 15.6), e.F, 0.09); } }
        slabP(B.p(RED), rectO(0, e.L, EV - 1.0, EV - 0.2), e.F, 0, 0.75);                // the beam under the eave
        if (i === 5 || i === 6){ // lower canopy over the Orchard Road shopfronts
          const o = B.p(GREEN), u1 = i === 5 ? e.L - 14 : 0; if (u1 > 2){ quadP(o, e.F(0, G1 + 1.6, 0), e.F(u1, G1 + 1.6, 0), e.F(u1, G1 + 0.5, 1.2), e.F(0, G1 + 0.5, 1.2));
          slabP(B.p(GREEN2), rectO(0, u1, G1 + 0.25, G1 + 0.55), e.F, 1.0, 1.25); } }
      } else {
        // plain stone sides: string courses and a few window bands
        for (const y of [G1, 10.5, 14.5, PT - 0.8]) slabP(B.p(STONE), rectO(0, e.L, y, y + 0.45), e.F, 0, 0.3);
        if (e.L > 6) for (const y of [7.6, 11.6, 15.6]) shapeP(B.p(TG), rectO(1.5, e.L - 1.5, y, y + 1.8), e.F, 0.05);
        slabP(B.p(STONE), rectO(0, e.L, PT, PT + 1.0), e.F, -0.3, 0);                     // parapet
      }
    });
    // the upper green-tiled pent roof along the fronts: from the eave on the facade line up to the roof deck, corners swept up
    { const OUT = offP(POD, -0.9).map((p, i) => (i === 5 || i === 6) ? offP(POD, -0.45)[i] : p), o = B.p(GREEN), lift = i => (i === 5 || i === 9) ? 1.2 : (i === 6 || i === 7 ? 0.9 : 0.5);
      for (const i of FRONT){ const j = (i + 1) % POD.length;
        quadP(o, [OUT[i][0], EV + lift(i), OUT[i][1]], [OUT[j][0], EV + lift(j), OUT[j][1]], [IN[j][0], PT + 0.6, IN[j][1]], [IN[i][0], PT + 0.6, IN[i][1]]);
        quadP(B.p(GREEN2), [OUT[i][0], EV - 0.4 + lift(i), OUT[i][1]], [OUT[j][0], EV - 0.4 + lift(j), OUT[j][1]], [OUT[j][0], EV + lift(j), OUT[j][1]], [OUT[i][0], EV + lift(i), OUT[i][1]]);
        segP(B.p(GREEN2), [IN[i][0], PT + 0.75, IN[i][1]], [IN[j][0], PT + 0.75, IN[j][1]], 0.3, 4);
        // tile ribs
        const L = Math.hypot(OUT[j][0] - OUT[i][0], OUT[j][1] - OUT[i][1]), n = Math.round(L/1.6);
        for (let k = 1; k < n; k++){ const t = k/n, yo = EV + lerp(lift(i), lift(j), t) + 0.08; segP(B.p(GREEN2), [lerp(OUT[i][0], OUT[j][0], t), yo, lerp(OUT[i][1], OUT[j][1], t)], [lerp(IN[i][0], IN[j][0], t), PT + 0.68, lerp(IN[i][1], IN[j][1], t)], 0.07, 3); } }
      for (const k of [5, 9]) latheP(B.p(GOLD), [[0.25, EV + lift(k)], [0.12, EV + lift(k) + 0.9]], OUT[k][0], OUT[k][1], 6);
    }
    // ---- the Scotts Road colonnade and its green canopy ----
    { const A = [-54.2, 20.3], Bq = [-70.3, -31.3], A2 = [-48.9, 18.7], B2 = [-65.0, -32.9], n = 8, o = B.p(GREEN);
      for (let k = 0; k <= n; k++){ const t = k/n, x = lerp(A[0], Bq[0], t) + 0.55*0.955, z = lerp(A[1], Bq[1], t) - 0.55*0.298; latheP(B.p(RED), [[0.6, 0.3], [0.6, 0.8], [0.48, 1.0], [0.46, 6.6], [0.62, 7.0]], x, z, 8); }
      const ox = -0.9*0.955, oz = 0.9*0.298;
      quadP(o, [A[0] + ox, 6.9, A[1] + oz], [Bq[0] + ox, 6.9, Bq[1] + oz], [B2[0], 9.0, B2[1]], [A2[0], 9.0, A2[1]]);
      quadP(B.p(GREEN2), [A[0] + ox, 6.5, A[1] + oz], [Bq[0] + ox, 6.5, Bq[1] + oz], [Bq[0] + ox, 6.9, Bq[1] + oz], [A[0] + ox, 6.9, A[1] + oz]);
      for (let k = 1; k < 34; k++){ const t = k/34; segP(B.p(GREEN2), [lerp(A[0], Bq[0], t) + ox, 6.98, lerp(A[1], Bq[1], t) + oz], [lerp(A2[0], B2[0], t), 9.05, lerp(A2[1], B2[1], t)], 0.06, 3); }
      quadP(B.p(RED), [A[0] + 0.5, 6.5, A[1] - 0.15], [Bq[0] + 0.5, 6.5, Bq[1] - 0.15], [B2[0], 6.5, B2[1]], [A2[0], 6.5, A2[1]]);   // soffit
    }
    // ---- pool deck on the podium roof (east wing) ----
    { const L = frameR(48, 0, 0.45);
      const pool = [L(-9, 0, -4), L(9, 0, -4), L(9, 0, 4), L(-9, 0, 4)].map(p => [p[0], p[2]]);
      capP(B.p(PAVE), [L(-13, 0, -8), L(13, 0, -8), L(13, 0, 8), L(-13, 0, 8)].map(p => [p[0], p[2]]), PT + 0.25);
      capP(B.p(WATER), pool, PT + 0.32);
      for (const [u, v] of [[-11, -6.5], [-4, -6.5], [3, -6.5], [10, -6.5], [-11, 6.5], [10, 6.5]]){ const p = L(u, 0, v); segP(B.p('#6b5440'), [p[0], PT, p[2]], [p[0], PT + 2.6, p[2]], 0.18, 5); LSph(g, 1.9, p[0], PT + 3.4, p[2], LEAF, 0.8, 8); }
    }
    // ---- the small pavilion in the north notch (real footprint): stone piers under a green hip roof ----
    { const P = [[51.4,-31.9],[43.7,-35.4],[48.5,-46.7],[56.8,-43.1]], f = fitR(P, Math.atan2(-35.4 + 31.9, 43.7 - 51.4));
      wallP(B.p(STONE), P, -1, 0.3); capP(B.p(PAVE), P, 0.3);
      for (const q of cornersR(f, 0.6)) bxP(B.p(STONE), q[0] - 0.5, q[0] + 0.5, 0.3, 6.2, q[1] - 0.5, q[1] + 0.5);
      boxP(B.p(RED), f.a*2 - 0.4, 0.8, f.b*2 - 0.4, f.cx, 6.2, f.cz, f.ry);
      roofP(B.p(GREEN), f.cx, f.cz, f.a + 0.6, f.b + 0.6, f.a - f.b + 0.3, 0, 7.0, 2.6, {ry:f.ry, lift:0.5, fas:0.25, fo:B.p(GREEN2), hips:B.p(GREEN2), ridge:B.p(GREEN2), rr:0.2}); }
    // ---- the roof garden round the tower base ----
    { const GR = offP(TWR, -4.5); capP(B.p(LEAF), GR, PT + 0.12); for (let i = 0; i < GR.length; i += 2){ const p = offP(TWR, -3.0)[i]; segP(B.p('#6b5440'), [p[0], PT, p[1]], [p[0], PT + 2.2, p[1]], 0.16, 5); LSph(g, 1.6, p[0], PT + 2.9, p[1], LEAF, 0.85, 8); } }
    // ---- the hotel tower ----
    const Y1 = 94.5, ET = edgesF(TWR);
    wallP(B.p(TW), TWR, PT, Y1); capP(B.p(ROOF), TWR, Y1);
    ET.forEach(e => {
      const n = Math.max(1, Math.round(e.L/2.7));
      for (let k = 0; k < n; k++){ const u = e.L*(k + 0.5)/n; shapeP(B.p(TG), rectO(u - 0.55, u + 0.55, PT + 1.6, Y1 - 1.0), e.F, 0.04); }
      for (let y = PT + 1.0; y < Y1 - 2; y += 5.8) slabP(B.p(TW), rectO(0, e.L, y, y + 0.55), e.F, 0, 0.12);
      slabP(B.p(TW), rectO(0, e.L, PT, PT + 1.2), e.F, 0, 0.35);
    });
    // ---- the pagoda crown ----
    const CX = 1.1, CZ = -4.4, PH = 0.082;
    polyRoofP(B.p(GREEN), CX, CZ, 8, PH, 30.0, 24.6, Y1 - 0.9, 3.6, {lift:1.1, pw:1.3, nt:3, fas:0.5, fo:B.p(GREEN2), hips:B.p(GREEN2), hr:0.22});
    { const yb = Y1 + 2.7, yt = Y1 + 7.3, P = ringPts(CX, CZ, 23.2, 8, PH);
      wallP(B.p(CWIN), P, yb, yt);
      for (const p of P) latheP(B.p(RED), [[0.75, yb], [0.75, yt]], p[0], p[1], 8);
      for (let k = 0; k < 8; k++){ const a = P[k], b2 = P[(k + 1) % 8]; for (let j = 1; j < 4; j++){ const t = j/4; latheP(B.p(RED), [[0.42, yb], [0.42, yt]], lerp(a[0], b2[0], t), lerp(a[1], b2[1], t), 6); } }
      latheP(B.p(RED), [[23.4, yt - 0.8], [23.9, yt - 0.4], [23.4, yt]], CX, CZ, 8, PH);
    }
    const yR = Y1 + 7.0, yTop = polyRoofP(B.p(GREEN), CX, CZ, 8, PH, 28.2, 0.9, yR, 12.0, {lift:2.0, pw:1.55, nt:8, sub:4, fas:0.7, fo:B.p(GREEN2), hips:B.p(GREEN2), hr:0.32});
    for (let k = 0; k < 8; k++){ const a = PH + k/8*TAU, x = CX + Math.cos(a)*28.2*1.03, z = CZ + Math.sin(a)*28.2*1.03; latheP(B.p(GOLD), [[0.35, yR + 2.0], [0.2, yR + 2.9], [0.05, yR + 3.3]], x, z, 6); }
    latheP(B.p(GOLD), [[1.5, yTop - 0.4], [1.8, yTop + 0.3], [1.0, yTop + 0.8], [1.25, yTop + 1.4], [0.6, yTop + 1.9], [0.95, yTop + 2.3], [0.95, yTop + 2.6], [0.4, yTop + 2.9], [0.7, yTop + 3.3], [0.7, yTop + 3.55], [0.25, yTop + 3.9], [0.12, yTop + 5.6], [0.03, yTop + 6.2]], CX, CZ, 10);
    B.flush(g);
    return g;
  }};
SG_PLACES.push({type:'tangplaza', lat:1.305030, lon:103.833020, rot:0});

// ================= Goodwood Park Hotel (1900, R.A.J. Bidwell of Swan & Maclaren, as the Teutonia Club), Scotts Road =================
// On its knoll above Scotts Road: the white Queen Anne Revival / Rhineland-castle Tower Block (three storeys, ground-floor
// arcade on rusticated piers, blocked architraves) with the turret-like tower over the entrance (belfry stage, steep flared
// pyramid roof, the rebuilt pinnacle) flanked by two gables with semicircular pediments; the later white wings with
// red-tiled hipped roofs on the rest of the real OSM footprint, wrapped round the main-pool courtyard (pool, pool pavilion
// and cabana roof where the satellite outlines show roofs) and the north courtyard with the second pool; the porch and a
// double flight of steps down the terrace to the driveway. The app's terrain falls ~6 m to the west: the terrace walls
// and foundations reach y = -8. Frame: real map frame (+x east, +z south); the Tower Block faces WNW to Scotts Road.
// Night: warm floodlit white facades (gentle breathing), lit windows and verandahs, glowing pools.
LANDMARKS.goodwood = {zh:'良木园酒店', en:'Goodwood Park Hotel', cat:'old', r:101, h:41,
  lt:{m:0, c:'#ffe1b6', k:1.0, e:0.5, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
    const WALL = '#efebe1', TRIM = '#fbf9f3', STONE = '#cdc6b8', ROOF = {c:'#a5513a', m:0, lk:0.45}, ROOF2 = {c:'#7f3b2b', m:0, lk:0.3},
      WIN = {c:'#4c4840', glow:'#ffd9a0', gk:0.55}, DARK = {c:'#3e3c37', glow:'#ffc98a', gk:0.25}, PAVE = '#cbc5b8', LAWN = '#6f9a5a',
      WATER = {c:'#58b3d6', glow:'#8fe0ff', gk:0.55}, LEAF = '#4f7a44', TRUNK = '#7a6650', SPIRE = {c:'#5b5f63', m:0, lk:0.8}, LAMP = {c:'#fff2cc', glow:'#ffd890', gk:1.7};
    const RING = [[7.2,-39.9],[6.0,-38.1],[65.1,-3.1],[45.4,29.5],[52.0,33.6],[66.3,58.5],[53.8,66.2],[45.4,50.8],[40.7,53.2],[35.3,43.1],[40.7,40.2],[40.1,37.8],[43.6,35.4],[37.7,31.9],[22.7,57.4],[18.0,54.4],[15.6,57.9],[-37.6,25.9],[-47.7,43.1],[-26.2,55.6],[-28.6,59.7],[-25.0,62.1],[-35.2,79.3],[-74.6,53.2],[-82.3,55.0],[-84.1,45.5],[-77.6,43.7],[-53.1,3.4],[-50.1,5.2],[-22.6,-40.5],[-34.6,-48.2],[-35.8,-55.9],[-34.0,-57.7],[-34.6,-60.7],[-27.4,-72.5],[-13.7,-74.9],[-1.7,-67.8],[0.7,-55.9],[3.0,-57.7],[2.4,-60.7],[30.5,-67.2],[32.3,-60.7],[35.9,-60.1],[38.9,-66.0],[63.9,-50.6],[59.8,-44.6],[61.5,-42.3],[69.3,-44.1],[75.3,-15.6],[72.9,-15.0],[72.9,-12.6],[69.3,-7.9],[64.5,-7.3],[59.2,-11.4],[56.2,-10.8],[49.6,-35.8],[31.1,-47.0]];
    const A = [-50.1, 5.2], Bv = [-22.6, -40.5], C = [7.2, -39.9], D = [6.0, -38.1], E = [65.1, -3.1], F = [45.4, 29.5], G = [37.7, 31.9], H = [22.7, 57.4], I = [15.6, 57.9], J = [-37.6, 25.9];
    const h1 = [-11.7, -25.5], h2 = [-2.1, -25.5], h3 = [44.4, 2.1], h4 = [19.8, 42.9], h5 = [-33.6, 10.8];
    const HOLE = [h1, h2, h3, h4, h5];                                     // the main-pool courtyard
    const NCY = [[7.2,-39.9],[31.1,-47.0],[49.6,-35.8],[56.2,-10.8],[64.5,-7.3],[65.1,-3.1],[6.0,-38.1]];   // the north courtyard
    const TB = [A, Bv, h1, h5];
    const Z = [TB, hullP([Bv, [-34.6,-48.2], [-35.8,-55.9], [-34.6,-60.7], [-27.4,-72.5], [-13.7,-74.9], [-1.7,-67.8], [2.4,-60.7], C]),
      [[2.4,-60.7],[30.5,-67.2],[38.9,-66.0],[31.1,-47.0],C], [[38.9,-66.0],[63.9,-50.6],[61.5,-42.3],[49.6,-35.8],[31.1,-47.0]],
      [[61.5,-42.3],[69.3,-44.1],[75.3,-15.6],[69.3,-7.9],[64.5,-7.3],[56.2,-10.8],[49.6,-35.8]],
      [Bv, C, D, h2, h1], [D, E, h3, h2], [E, F, G, h4, h3], [G, H, I, J, h5, h4],
      [A, h5, J, [-47.7,43.1], [-77.6,43.7]], [[-47.7,43.1],[-26.2,55.6],[-25.0,62.1],[-35.2,79.3],[-74.6,53.2],[-77.6,43.7]],
      [[-74.6,53.2],[-82.3,55.0],[-84.1,45.5],[-77.6,43.7]], [F, [52.0,33.6], [66.3,58.5], [53.8,66.2], [45.4,50.8], G]];
    const Z5 = [[-25.6,50.8],[-43.5,40.2],[-37.0,30.1],[-19.6,40.7]];   // the wing in the south-west notch (satellite outline)
    const EV = 12.5, EVT = 14.0;
    // ---- terrace foundations, courtyard decks ----
    wallP(B.p(STONE), RING, -8, 0.6); wallP(B.p(STONE), Z5, -8, 0.6);
    capP(B.p(PAVE), HOLE, 0.3); capP(B.p(PAVE), NCY, 0.3); wallP(B.p(STONE), NCY, -6, 0.3);
    // ---- walls ----
    const ER = edgesF(RING), EH = edgesF(HOLE), FRONT = 28;
    ER.forEach((e, i) => { const o = B.p(WALL), top = i === FRONT ? EVT : EV; quadP(o, e.F(0, 0.6, 0), e.F(e.L, 0.6, 0), e.F(e.L, top, 0), e.F(0, top, 0)); });
    // courtyard walls (the hole's edges face into the courtyard: flip)
    EH.forEach((e, i) => { const o = B.p(WALL), top = i === 4 ? EVT : EV; quadP(o, e.F(0, 0.3, 0), e.F(e.L, 0.3, 0), e.F(e.L, top, 0), e.F(0, top, 0)); });
    capHoleP(B.p(ROOF2), RING, [HOLE], EV - 0.05); capP(B.p(ROOF2), TB, EVT - 0.05);
    for (const [a, b2] of [[Bv, h1], [h5, A]]){ const o = B.p(WALL); quadP(o, [a[0], EV, a[1]], [b2[0], EV, b2[1]], [b2[0], EVT, b2[1]], [a[0], EVT, a[1]]); }
    // ---- wing facades: plinth, string courses, cornice, three storeys of windows ----
    const wing = (e, top, inward) => {
      const s = inward ? -1 : 1, F = (u, v, w) => e.F(u, v, s*(w || 0));
      if (e.L < 1.2) return;
      slabP(B.p(STONE), rectO(0, e.L, 0.6, 1.5), F, 0, 0.15);
      for (const y of [4.9, 8.7]) slabP(B.p(TRIM), rectO(0, e.L, y, y + 0.3), F, 0, 0.12);
      slabP(B.p(TRIM), rectO(0, e.L, top - 0.65, top), F, 0, 0.4);
      const n = Math.round(e.L/3.6); if (n < 1) return;
      for (let k = 0; k < n; k++){ const u = e.L*(k + 0.5)/n;
        if (inward){ shapeP(B.p(DARK), mv(rArchO(1.25, 3.3), u, 1.0), F, 0.05); slabP(B.p(TRIM), rectO(u - 0.2, u + 0.2, 5.2, 8.4), F, 0, 0.15); shapeP(B.p(DARK), rectO(u - 1.3, u + 1.3, 5.4, 8.3), F, 0.04);
          slabP(B.p(TRIM), rectO(u - 1.6, u + 1.6, 5.4, 6.3), F, 0, 0.3); shapeP(B.p(WIN), rectO(u - 0.8, u + 0.8, 9.3, 11.4), F, 0.04); }
        else { shapeP(B.p(WIN), mv(rArchO(0.62, 2.5), u, 1.9), F, 0.04); slabP(B.p(TRIM), mv(rArchO(0.82, 2.75), u, 1.8), F, 0, 0.03);
          for (const y of [5.6, 9.4]){ shapeP(B.p(WIN), rectO(u - 0.62, u + 0.62, y, y + 2.1), F, 0.05); slabP(B.p(TRIM), rectO(u - 0.85, u + 0.85, y + 2.1, y + 2.45), F, 0, 0.14); slabP(B.p(TRIM), rectO(u - 0.8, u + 0.8, y - 0.25, y), F, 0, 0.18); } } }
    };
    ER.forEach((e, i) => { if (i !== FRONT) wing(e, EV, false); });
    EH.forEach((e, i) => { if (i !== 4) wing(e, EV, true); else wing(e, EVT, true); });
    // ---- roofs ----
    zoneRoofs(B.p(ROOF), Z, EV, 3.8, 6.0, 0.8, B.p(ROOF2), Z.map((_, i) => i).filter(i => i > 0));
    zoneRoofs(B.p(ROOF), Z, EVT, 4.6, 7.0, 0.9, B.p(ROOF2), [0], true);
    // the notch wing
    { const f = fitR(Z5, Math.atan2(-43.5 + 50.8, -25.6 + 43.5) + PI); wallP(B.p(WALL), Z5, 0.6, EV); capP(B.p(ROOF2), Z5, EV);
      for (const e of edgesF(Z5)) wing(e, EV, false);
      roofP(B.p(ROOF), f.cx, f.cz, f.a + 0.8, f.b + 0.8, Math.max(0.5, f.a - f.b), 0, EV, 4.0, {ry:f.ry, pw:1, nt:1, n:1, ridge:B.p(ROOF2), rr:0.14}); }
    // ---- the Tower Block front (edge A -> Bv, 53.3 m; u from A, w outwards to Scotts Road) ----
    const e0 = ER[FRONT], FF = e0.F, LT = e0.L, TU = 26.65;
    // rusticated terrace wall below the front, the terrace and its balustrade
    { const o = B.p(STONE); quadP(o, FF(-1, -8, 3.6), FF(LT + 1, -8, 3.6), FF(LT + 1, 0.6, 3.6), FF(-1, 0.6, 3.6));
      for (const u of [-1, LT + 1]) quadP(o, FF(u, -8, 0), FF(u, -8, 3.6), FF(u, 0.6, 3.6), FF(u, 0.6, 0));
      quadP(B.p(PAVE), FF(-1, 0.6, 0), FF(LT + 1, 0.6, 0), FF(LT + 1, 0.6, 3.6), FF(-1, 0.6, 3.6));
      for (let y = -7.4; y < 0.4; y += 0.85) slabP(o, rectO(-1, LT + 1, y, y + 0.08), FF, 3.6, 3.7);
      for (const [u0, u1] of [[-1, TU - 4.2], [TU + 4.2, LT + 1]]){ slabP(B.p(TRIM), rectO(u0, u1, 0.6, 1.5), FF, 3.3, 3.6); for (let u = u0 + 0.6; u < u1; u += 2.2) boxP(B.p(TRIM), 0.35, 1.25, 0.35, ...(p => [p[0], 0.6, p[2]])(FF(u, 0, 3.45)), -e0.ang); } }
    // ground-floor arcade on rusticated piers, verandah behind
    const NB = 12, BW = LT/NB;
    for (let k = 0; k < NB; k++){ const u = BW*(k + 0.5); if (Math.abs(u - TU) < 5) continue;
      shapeP(B.p(DARK), mv(rArchO(1.55, 4.1), u, 0.6), FF, 0.06);
      slabP(B.p(TRIM), mv(rArchO(1.75, 4.35), u, 0.6).filter(p => p[1] > 2.4), FF, 0, 0.04); }
    for (let k = 0; k <= NB; k++){ const u = BW*k; for (let y = 0.6; y < 5.2; y += 0.55) slabP(B.p(TRIM), rectO(u - 0.6, u + 0.6, y, y + 0.45), FF, 0, 0.22); }
    slabP(B.p(TRIM), rectO(0, LT, 5.2, 5.75), FF, 0, 0.3); slabP(B.p(TRIM), rectO(0, LT, 9.55, 9.85), FF, 0, 0.18);
    slabP(B.p(TRIM), rectO(0, LT, EVT - 0.8, EVT), FF, 0, 0.5); slabP(B.p(STONE), rectO(0, LT, 0.6, 1.2), FF, 0, 0.3);
    // upper floors: windows in blocked architraves with keystones, pilasters between the bays
    for (let k = 0; k < NB; k++){ const u = BW*(k + 0.5); if (Math.abs(u - TU) < 5) continue;
      for (const y of [6.3, 10.5]){ shapeP(B.p(WIN), rectO(u - 0.7, u + 0.7, y, y + 2.5), FF, 0.05);
        for (let j = 0; j < 4; j++) for (const sx of [-1, 1]) slabP(B.p(TRIM), rectO(u + sx*0.7 + (sx < 0 ? -0.45 : 0), u + sx*0.7 + (sx > 0 ? 0.45 : 0) + (j % 2 ? sx*0.15 : 0), y + j*0.64, y + j*0.64 + 0.5), FF, 0, 0.12);
        slabP(B.p(TRIM), rectO(u - 1.05, u + 1.05, y + 2.5, y + 2.9), FF, 0, 0.16); slabP(B.p(TRIM), rectO(u - 0.22, u + 0.22, y + 2.35, y + 3.0), FF, 0, 0.22); } }
    for (let k = 1; k < NB; k++){ const u = BW*k; if (Math.abs(u - TU) < 6) continue; slabP(B.p(TRIM), rectO(u - 0.3, u + 0.3, 5.75, EVT - 0.8), FF, 0, 0.18); }
    // the central pavilion and the two gables with semicircular pediments
    slabP(B.p(WALL), rectO(TU - 9.6, TU + 9.6, 0.6, EVT), FF, 0, 1.2);
    slabP(B.p(TRIM), rectO(TU - 9.8, TU + 9.8, EVT - 0.8, EVT), FF, 1.2, 1.6);
    for (const s of [-1, 1]){ const gu = TU + s*6.95, P = [[gu - 2.4, EVT - 0.1], [gu + 2.4, EVT - 0.1], [gu + 2.4, EVT + 2.2], [gu + 2.0, EVT + 2.6], [gu + 2.1, EVT + 3.1]];
      for (let i = 0; i <= 10; i++){ const a = PI*i/10; P.push([gu + Math.cos(a)*2.1, EVT + 3.1 + Math.sin(a)*2.1]); }
      P.push([gu - 2.1, EVT + 3.1], [gu - 2.0, EVT + 2.6], [gu - 2.4, EVT + 2.2]);
      slabP(B.p(WALL), P, FF, 0.6, 1.4); slabP(B.p(TRIM), P.map(p => [gu + (p[0] - gu)*1.06, EVT + (p[1] - EVT)*1.03]).filter((p, i) => i > 3), FF, 1.35, 1.45);
      shapeP(B.p(WIN), ringPts(gu, EVT + 3.0, 0.75, 12).map(p => [p[0], p[1]]), FF, 1.45); shapeP(B.p(WIN), rectO(gu - 0.65, gu + 0.65, EVT + 0.4, EVT + 1.9), FF, 1.45);
      // cross roof behind the gable
      const o = B.p(ROOF), yr = EVT + 4.6; quadP(o, FF(gu - 2.6, EVT, 0.8), FF(gu, yr, 0.8), FF(gu, yr, -9), FF(gu - 2.6, EVT, -9)); quadP(o, FF(gu, yr, 0.8), FF(gu + 2.6, EVT, 0.8), FF(gu + 2.6, EVT, -9), FF(gu, yr, -9));
      for (const y of [6.3, 10.5]){ shapeP(B.p(WIN), rectO(gu - 0.8, gu + 0.8, y, y + 2.6), FF, 1.25); slabP(B.p(TRIM), rectO(gu - 1.15, gu + 1.15, y + 2.6, y + 3.0), FF, 1.2, 1.4); }
      shapeP(B.p(DARK), mv(rArchO(1.4, 3.8), gu, 0.6), FF, 1.25); }
    // the tower: square shaft with quoins, arched windows, a belfry stage, corner pinnacles, the steep flared roof and pinnacle
    { const T0 = -4.8, T1 = 3.2, HW = 4.0, YT = 26.0, c = FF(TU, 0, (T0 + T1)/2), o = B.p(WALL);
      const P = [FF(TU - HW, 0, T1), FF(TU + HW, 0, T1), FF(TU + HW, 0, T0), FF(TU - HW, 0, T0)].map(p => [p[0], p[2]]);
      wallP(o, P, 0.6, YT); capP(B.p(ROOF2), P, YT);
      for (const p of P){ let k = 0; for (let y = 0.6; y < YT - 0.9; y += 0.84) { const w = k++ % 2 ? 0.62 : 0.86; boxP(B.p(TRIM), w, 0.42, w, p[0], y, p[1], -e0.ang); } }
      // the four faces: front (w = T1), back (w = T0), the two sides (u = TU +- HW)
      const fr = (u, v, w) => FF(TU + u, v, T1 + (w || 0)), bk = (u, v, w) => FF(TU - u, v, T0 - (w || 0)),
        sd1 = (u, v, w) => FF(TU + HW + (w || 0), v, (T0 + T1)/2 - u), sd2 = (u, v, w) => FF(TU - HW - (w || 0), v, (T0 + T1)/2 + u);
      for (const Fq of [fr, bk, sd1, sd2]){
        slabP(B.p(TRIM), rectO(-HW, HW, 14.6, 15.1), Fq, 0, 0.3); slabP(B.p(TRIM), rectO(-HW, HW, 21.9, 22.4), Fq, 0, 0.3); shapeP(B.p(WIN), mv(rArchO(0.6, 2.0), 0, 19.1), Fq, 0.05);
        slabP(B.p(TRIM), rectO(-HW - 0.2, HW + 0.2, YT - 0.7, YT), Fq, 0, 0.55);
        shapeP(B.p(WIN), mv(rArchO(0.75, 2.8), 0, 15.8), Fq, 0.05); slabP(B.p(TRIM), mv(rArchO(0.95, 3.05), 0, 15.7).filter(p => p[1] > 17.6), Fq, 0, 0.08);
        for (const s of [-1, 1]){ shapeP(B.p(DARK), mv(rArchO(0.6, 2.5), s*1.35, 22.8), Fq, 0.05); slabP(B.p(TRIM), mv(rArchO(0.75, 2.7), s*1.35, 22.7).filter(p => p[1] > 24.4), Fq, 0, 0.08); }
      }
      // front: the entrance arch and the window over it
      shapeP(B.p(DARK), mv(rArchO(1.6, 4.4), 0, 0.6), fr, 0.06); slabP(B.p(TRIM), mv(rArchO(1.85, 4.7), 0, 0.6).filter(p => p[1] > 2.5), fr, 0, 0.12);
      for (const y of [6.3, 10.5]){ shapeP(B.p(WIN), rectO(-0.85, 0.85, y, y + 2.6), fr, 0.05); slabP(B.p(TRIM), rectO(-1.2, 1.2, y + 2.6, y + 3.0), fr, 0, 0.16); }
      // corner pinnacles on the parapet
      for (const p of P){ latheP(B.p(TRIM), [[0.42, YT], [0.42, YT + 0.9], [0.55, YT + 1.05], [0.3, YT + 1.25], [0.05, YT + 2.4]], p[0], p[1], 4, PI/4 - e0.ang); }
      // the steep flared roof (square, bell-cast) and the pinnacle
      const y0 = YT + 0.1;
      roofP(B.p(ROOF), c[0], c[2], HW + 0.9, HW + 0.9, 0.18, 0.18, y0, 10.6, {ry:-e0.ang, pw:1.35, nt:7, n:4, lift:0.25, fas:0.3, fo:B.p(ROOF2), hips:B.p(ROOF2), hr:0.12});
      latheP(B.p(SPIRE), [[0.3, y0 + 10.5], [0.42, y0 + 10.9], [0.18, y0 + 11.2], [0.36, y0 + 11.5], [0.36, y0 + 11.8], [0.1, y0 + 12.1], [0.06, y0 + 14.0]], c[0], c[2], 8);
      LSph(g, 0.32, c[0], y0 + 12.6, c[2], SPIRE, 1, 8);
      // dormers with little pointed roofs on the four roof faces
      for (const [Fq, along] of [[fr, 1], [bk, 1], [sd1, 0], [sd2, 0]]){ const p = Fq(0, 0, 0.4), q = Fq(0, 0, -0.6); boxP(B.p(WALL), along ? 1.4 : 2.0, 1.5, along ? 2.0 : 1.4, q[0], y0 + 2.2, q[2], -e0.ang);
        shapeP(B.p(DARK), mv(rArchO(0.45, 1.3), 0, y0 + 2.3), Fq, 0.45); latheP(B.p(ROOF2), [[1.0, y0 + 3.7], [0.05, y0 + 5.0]], p[0], p[2], 4, PI/4 - e0.ang); }
    }
    // the porch (porte-cochere) before the tower, with the double flight of steps down the terrace
    { for (const s of [-1, 1]) for (const w of [3.6, 6.3]){ const p = FF(TU + s*3.1, 0, w); latheP(B.p(TRIM), [[0.36, 0.6], [0.36, 1.0], [0.27, 1.2], [0.25, 4.8], [0.36, 5.1]], p[0], p[2], 8); }
      slabP(B.p(TRIM), rectO(TU - 3.6, TU + 3.6, 5.1, 5.7), FF, 3.2, 6.8); capP(B.p(ROOF2), [FF(TU - 3.6, 0, 3.2), FF(TU + 3.6, 0, 3.2), FF(TU + 3.6, 0, 6.8), FF(TU - 3.6, 0, 6.8)].map(p => [p[0], p[2]]), 5.72);
      for (let u = TU - 3.4; u <= TU + 3.45; u += 0.55) boxP(B.p(TRIM), 0.22, 0.8, 0.22, ...(p => [p[0], 5.7, p[2]])(FF(u, 0, 6.6)), -e0.ang);
      quadP(B.p(PAVE), FF(TU - 3.6, 0.62, 3.6), FF(TU + 3.6, 0.62, 3.6), FF(TU + 3.6, 0.62, 6.8), FF(TU - 3.6, 0.62, 6.8));
      wallP(B.p(STONE), [FF(TU - 3.6, 0, 3.6), FF(TU + 3.6, 0, 3.6), FF(TU + 3.6, 0, 6.8), FF(TU - 3.6, 0, 6.8)].map(p => [p[0], p[2]]), -8, 0.62);
      for (const s of [-1, 1]){ // flights running along the terrace from the porch to the drive
        for (let k = 0; k < 17; k++){ const u0 = TU + s*(3.6 + k*0.55), y = 0.6 - (k + 1)*0.32; const P = [FF(u0, 0, 3.7), FF(u0 + s*0.55, 0, 3.7), FF(u0 + s*0.55, 0, 6.4), FF(u0, 0, 6.4)].map(p => [p[0], p[2]]);
          prismP(B.p(STONE), P, -8, y); }
        const uE = TU + s*(3.6 + 17*0.55); slabP(B.p(TRIM), [[TU + s*3.6, 1.5], [uE, -4.3], [uE, -3.6], [TU + s*3.6, 2.2]].map(p => s > 0 ? p : [p[0], p[1]]), FF, 6.3, 6.6);
        boxP(B.p(LAMP), 0.35, 0.5, 0.35, ...(p => [p[0], 1.6, p[2]])(FF(TU + s*3.8, 0, 6.5)), -e0.ang); }
    }
    // ---- the main-pool courtyard: pool, terrace, the pool pavilion and the cabana roof (satellite outlines), palms ----
    { const L = frameR(9, 8, 0.541), pool = [L(-11, 0, -4), L(11, 0, -4), L(11, 0, 4), L(-11, 0, 4)].map(p => [p[0], p[2]]);
      capP(B.p(STONE), [L(-12.2, 0, -5.2), L(12.2, 0, -5.2), L(12.2, 0, 5.2), L(-12.2, 0, 5.2)].map(p => [p[0], p[2]]), 0.38);
      capP(B.p(WATER), pool, 0.45);
      capP(B.p(LAWN), [[-24,8],[-12,-17],[-3,-18],[0,-12],[-8,4],[-18,14]], 0.36); capP(B.p(LAWN), [[30,6],[40,4],[25,32],[18,36],[16,28]], 0.36);
      // pool pavilion (13 x 10) and the long cabana roof
      for (const [P, hh] of [[[[-11.3,7.5],[-18.5,2.8],[-8.9,-11.4],[-2.3,-6.7]], 4.4], [[[18.6,28.9],[16.2,33.6],[-11.3,16.4],[-8.3,12.3]], 3.4]]){
        const f = fitR(P, Math.atan2(P[1][1] - P[0][1], P[1][0] - P[0][0]));
        if (hh > 4){ wallP(B.p(WALL), cornersR(f, 0.5), 0.3, hh); for (const e of edgesF(cornersR(f, 0.5))){ const n = Math.max(1, Math.round(e.L/2.6)); for (let k = 0; k < n; k++) shapeP(B.p(WIN), mv(rArchO(0.7, 2.6), e.L*(k + 0.5)/n, 0.6), e.F, 0.04); } }
        else { for (const q of cornersR(f, 0.4)) latheP(B.p(TRIM), [[0.2, 0.3], [0.2, hh]], q[0], q[1], 6); const L2 = frameR(f.cx, f.cz, f.ang); for (let u = -f.a + 3; u < f.a - 2; u += 3.4) for (const v of [-f.b + 0.4, f.b - 0.4]){ const p = L2(u, 0, v); latheP(B.p(TRIM), [[0.18, 0.3], [0.18, hh]], p[0], p[2], 6); } }
        roofP(B.p(ROOF), f.cx, f.cz, f.a + 0.6, f.b + 0.6, Math.max(0.3, f.a - f.b), 0, hh, Math.min(3.0, f.b*0.9), {ry:f.ry, pw:1, nt:1, n:1, ridge:B.p(ROOF2), rr:0.12}); }
    }
    // ---- the north courtyard (Mayfair) pool and garden ----
    { const L = frameR(40, -28, 0.535); capP(B.p(STONE), [L(-9.5, 0, -4.4), L(9.5, 0, -4.4), L(9.5, 0, 4.4), L(-9.5, 0, 4.4)].map(p => [p[0], p[2]]), 0.38);
      capP(B.p(WATER), [L(-8.5, 0, -3.4), L(8.5, 0, -3.4), L(8.5, 0, 3.4), L(-8.5, 0, 3.4)].map(p => [p[0], p[2]]), 0.45);
      capP(B.p(LAWN), [[14,-40],[30,-45],[44,-37],[30,-34]], 0.36); }
    // palms
    { const palms = [[-20,-8],[-16,-14],[-4,-20],[22,-2],[30,0],[36,6],[26,22],[-8,8],[-24,4],[20,-38],[52,-16]];
      for (const [x, z] of palms){ const hh = 7 + R()*4, lx = (R() - 0.5)*1.4, lz = (R() - 0.5)*1.4, yb = (x < -45) ? -4.8 : 0.35;
        segP(B.p(TRUNK), [x, yb, z], [x + lx, yb + hh, z + lz], 0.22, 5); const top = [x + lx, yb + hh, z + lz];
        for (let k = 0; k < 8; k++){ const a = k/8*TAU + R(), dx = Math.cos(a), dz = Math.sin(a), tip = [top[0] + dx*3.4, top[1] - 1.3, top[2] + dz*3.4], mid = [top[0] + dx*1.8, top[1] + 0.35, top[2] + dz*1.8];
          const sx = -dz*0.45, sz = dx*0.45, o = B.p(LEAF); quadP(o, top, [mid[0] + sx, mid[1], mid[2] + sz], tip, [mid[0] - sx, mid[1], mid[2] - sz]); } } }
    B.flush(g);
    return g;
  }};
SG_PLACES.push({type:'goodwood', lat:1.308690, lon:103.834560, rot:0});

// ================= The Istana (Government House, 1867-69, Maj. J.F.A. McNair), main building and forecourt =================
// Neo-Palladian, cross-shaped (real OSM footprint): the long front range faces ESE over the forecourt and the lawn; the
// rear wing runs WNW. Two storeys on a raised base of dwarf piers and arches; deep verandahs: Doric arcades on the ground
// floor, Ionic colonnades with balustrades upstairs, louvred openings; a balustraded parapet over the cornice and low
// slate-grey hipped roofs. The projecting entrance portico (carriage porch below, balcony above, pediment) before the
// central three-storey "one-stage" tower with Corinthian pilasters, cornice, slated mansard roof with dormers and the
// flagpole (tower 28 m); a pediment and portico at both ends of the front colonnades. The paved forecourt with its
// retaining wall and lamps reaches to the drive. Frame: real map frame; the axis frame (u, v) is turned 25.3 deg.
// Night: warm floodlit white facades (gentle breathing), lit louvres.
LANDMARKS.istana = {zh:'总统府（新加坡）', en:'The Istana', cat:'old', r:91, h:30,
  lt:{m:0, c:'#ffe4bc', k:1.0, e:0.55, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB();
    const WALL = '#f1eee6', TRIM = '#fcfbf6', BASE = '#c9c3b6', SLATE = {c:'#7b7d80', m:0, lk:0.35}, SLATE2 = '#5d5f62',
      DARK = {c:'#4a4b46', glow:'#ffd29a', gk:0.45}, LOUV = {c:'#5e665b', glow:'#ffd9a0', gk:0.35}, PAVE = '#d3cdbf', GRAVEL = '#c8bfae', LAWN = '#6f9a5a',
      LAMP = {c:'#fff2cc', glow:'#ffd890', gk:1.7}, POLE = '#e8e8e8', FLAG = {c:'#d0302a', ds:true};
    const RING = [[-18.8,7.9],[-15.9,1.4],[-22.8,-2.1],[-27.0,5.6],[-36.0,1.5],[-41.3,12.7],[-45.6,10.9],[-39.7,-1.0],[-66.5,-14.0],[-64.2,-18.8],[-66.0,-20.1],[-62.4,-28.4],[-59.4,-27.3],[-56.3,-33.8],[-16.8,-14.8],[-20.3,-7.6],[-13.4,-4.2],[-9.1,-13.0],[23.0,2.4],[27.2,-7.0],[29.0,-6.0],[40.3,-28.9],[23.1,-37.1],[18.3,-26.4],[0.9,-34.8],[4.5,-42.0],[10.5,-39.2],[12.3,-43.8],[16.5,-42.1],[24.3,-58.1],[57.8,-42.0],[48.9,-23.5],[47.0,-24.6],[46.5,-23.6],[50.1,-22.4],[44.7,-11.8],[52.4,-8.3],[51.9,-7.0],[54.8,-5.8],[53.1,-2.9],[54.2,-2.2],[50.7,6.7],[48.8,5.6],[41.7,20.3],[51.3,25.1],[46.4,34.0],[38.1,29.9],[24.3,58.9],[3.9,48.8],[15.8,23.3],[2.3,16.9],[-4.3,31.1],[-15.2,26.3],[-8.7,12.6]];
    const AN = 25.3*PI/180, L = frameR(0, 0, AN), UV = (u, v) => { const p = L(u, 0, v); return [p[0], p[2]]; };
    const Y0 = 1.6, Y1 = 7.0, Y2 = 12.4, YP = 13.6;   // floor of the raised ground storey, upper floor, cornice, parapet top
    // ---- base: granite foundation, the raised storey's dwarf piers and arches ----
    wallP(B.p(BASE), RING, -5, Y0);
    const ER = edgesF(RING);
    // ---- walls and verandahs on every face ----
    wallP(B.p(WALL), RING, Y0, Y2);
    capP(B.p(SLATE2), RING, Y2);
    ER.forEach(e => {
      if (e.L < 1.0) return;
      const n = Math.max(1, Math.round(e.L/3.9)), bw = e.L/n;
      for (let k = 0; k < n; k++){ const u = bw*(k + 0.5);
        if (bw > 2.6){
          shapeP(B.p(DARK), mv(rArchO(0.5, 0.9), u, 0.25), e.F, 0.04);                                   // vents in the base
          shapeP(B.p(DARK), mv(rArchO(bw*0.36, 4.6), u, Y0 + 0.2), e.F, 0.05);                            // ground-floor arcade
          slabP(B.p(TRIM), mv(rArchO(bw*0.36 + 0.22, 4.82), u, Y0 + 0.2).filter(p => p[1] > Y0 + 2.6), e.F, 0, 0.06);
          shapeP(B.p(LOUV), rectO(u - bw*0.37, u + bw*0.37, Y1 + 0.9, Y2 - 0.8), e.F, 0.05);                // upper verandah louvres
          slabP(B.p(TRIM), rectO(u - bw*0.36, u + bw*0.36, Y1 + 0.2, Y1 + 1.15), e.F, 0, 0.3);             // balustrade
        } else shapeP(B.p(LOUV), rectO(u - bw*0.3, u + bw*0.3, Y0 + 1.0, Y0 + 3.6), e.F, 0.05);
      }
      for (let k = 0; k <= n; k++){ const u = Math.min(e.L - 0.3, Math.max(0.3, bw*k));
        slabP(B.p(TRIM), rectO(u - 0.38, u + 0.38, Y0, Y1), e.F, 0, 0.3);                                    // Doric piers
        if (bw > 2.6){ const p = e.F(u, 0, 0.55); latheP(B.p(TRIM), [[0.42, Y1 + 0.1], [0.42, Y1 + 0.35], [0.31, Y1 + 0.5], [0.28, Y2 - 0.75], [0.42, Y2 - 0.45], [0.46, Y2 - 0.3]], p[0], p[2], 8); }   // Ionic columns
      }
      slabP(B.p(TRIM), rectO(0, e.L, Y1 - 0.3, Y1 + 0.15), e.F, 0, 0.32);
      slabP(B.p(TRIM), rectO(0, e.L, Y2 - 0.35, Y2 + 0.15), e.F, 0, 0.6);                                   // cornice
      slabP(B.p(WALL), rectO(0, e.L, Y2 + 0.15, YP), e.F, -0.25, 0.2);                                       // parapet
      const nb = Math.max(1, Math.round(e.L/1.1)); for (let k = 0; k < nb; k++){ const u = e.L*(k + 0.5)/nb; shapeP(B.p(DARK), rectO(u - 0.28, u + 0.28, Y2 + 0.35, YP - 0.25), e.F, 0.21); }
      slabP(B.p(TRIM), rectO(0, e.L, YP - 0.2, YP + 0.05), e.F, -0.3, 0.3);
    });
    // ---- low hipped slate roofs behind the parapet ----
    const Z = [
      [UV(-68.6, 1.0), UV(-65.3, -6.5), UV(-21.5, -6.2), UV(-13.9, 1.9), UV(-13.6, 15.2), UV(-66.1, 15.8)],
      [UV(-13.9, 1.9), UV(-13.8, -7.9), UV(21.8, -7.7), UV(21.7, 14.3), UV(-2.5, 14.8), UV(-13.6, 15.2)],
      [UV(-2.5, 14.8), UV(9.3, 14.5), UV(9.4, 30.0), UV(-2.5, 30.3)],
      [UV(21.6, -18.0), UV(46.5, -15.8), UV(46.5, 14.3), UV(21.7, 14.3), UV(21.8, -7.7)],
      [UV(21.7, 14.3), UV(46.5, 14.3), UV(47.1, 42.9), UV(24.4, 42.5)],
      [UV(24.1, -43.4), UV(34.2, -43.4), UV(35.4, -29.8), UV(23.9, -29.8)],
      [UV(23.9, -29.8), UV(47.1, -29.8), UV(48.7, -15.6), UV(46.5, -15.8), UV(21.6, -18.0)],
      [UV(-2.9, -62.9), UV(34.3, -62.7), UV(34.2, -43.4), UV(24.1, -43.4), UV(-3.1, -45.1)],
      [UV(-14.1, -31.8), UV(-13.9, -39.9), UV(-7.4, -45.0), UV(-3.1, -45.1), UV(5.0, -43.4), UV(5.3, -31.7)]];
    zoneRoofs(B.p(SLATE), Z, Y2 + 0.2, 2.6, 5.0, -0.4, B.p(SLATE2));
    // ---- the entrance portico (u 46.4..57.1, v 0.5..10.9): carriage porch, balcony, pediment ----
    { const u0 = 46.4, u1 = 57.6, v0 = 0.3, v1 = 11.1, vc = (v0 + v1)/2;
      const P4 = [UV(u0, v0), UV(u1, v0), UV(u1, v1), UV(u0, v1)];
      prismP(B.p(BASE), P4, -5, Y0 - 0.2);
      for (const v of [v0 + 0.6, v0 + 2.0, v1 - 2.0, v1 - 0.6]) for (const u of [u1 - 0.6]){ const p = UV(u, v); latheP(B.p(TRIM), [[0.5, Y0], [0.5, Y0 + 0.5], [0.4, Y0 + 0.7], [0.36, Y1 - 0.5], [0.5, Y1 - 0.2], [0.55, Y1]], p[0], p[1], 10); }
      for (const v of [v0 + 0.6, v1 - 0.6]) for (const u of [u0 + 4.5]){ const p = UV(u, v); latheP(B.p(TRIM), [[0.5, Y0], [0.5, Y0 + 0.5], [0.4, Y0 + 0.7], [0.36, Y1 - 0.5], [0.5, Y1 - 0.2], [0.55, Y1]], p[0], p[1], 10); }
      prismP(B.p(TRIM), P4, Y1, Y1 + 0.7);
      for (const v of [v0 + 0.6, v0 + 2.0, v1 - 2.0, v1 - 0.6]){ const p = UV(u1 - 0.6, v); latheP(B.p(TRIM), [[0.42, Y1 + 0.7], [0.42, Y1 + 1.0], [0.32, Y1 + 1.2], [0.3, Y2 - 0.5], [0.42, Y2 - 0.25], [0.48, Y2]], p[0], p[1], 10); }
      const FrF = (a, y, w) => { const p = L(u1 + (w || 0), 0, vc + a); return [p[0], y, p[2]]; };
      slabP(B.p(TRIM), rectO(-5.4, 5.4, Y1 + 0.7, Y1 + 1.8), FrF, -0.1, 0.1);
      for (let a = -5.0; a <= 5.0; a += 0.5) boxP(B.p(TRIM), 0.18, 1.0, 0.18, ...(p => [p[0], Y1 + 0.75, p[2]])(FrF(a, 0, 0.0)), -AN);
      // entablature and pediment
      prismP(B.p(TRIM), P4, Y2 - 0.1, Y2 + 0.9);
      const yp = Y2 + 0.9, PED = [[-5.6, yp], [5.6, yp], [0, yp + 3.0]];
      slabP(B.p(WALL), PED, FrF, -11.2, 0); slabP(B.p(TRIM), [[-5.9, yp - 0.05], [5.9, yp - 0.05], [0, yp + 3.25]], FrF, 0, 0.15);
      const o = B.p(SLATE); quadP(o, FrF(-5.9, yp, 0.2), FrF(0, yp + 3.1, 0.2), L(u0 - 2, yp + 3.1, vc), L(u0 - 2, yp, vc + 5.9)); quadP(o, FrF(0, yp + 3.1, 0.2), FrF(5.9, yp, 0.2), L(u0 - 2, yp, vc - 5.9), L(u0 - 2, yp + 3.1, vc));
      shapeP(B.p(DARK), ringPts(0, yp + 1.2, 0.7, 12), FrF, 0.17);
      // the porte-cochere before it (the satellite outline): paired Doric columns, entablature, balustraded roof terrace
      { const c0 = 57.6, c1 = 65.7, w0 = 0.6, w1 = 11.6, yc = Y1 - 0.4;
        for (const u of [c1 - 0.6, c1 - 1.6, c0 + 3.4]) for (const v of [w0 + 0.5, w1 - 0.5]){ const p = UV(u, v); latheP(B.p(TRIM), [[0.42, 0.17], [0.42, 0.6], [0.32, 0.8], [0.3, yc - 0.5], [0.42, yc - 0.2], [0.46, yc]], p[0], p[1], 10); }
        const PC = [UV(c0, w0), UV(c1, w0), UV(c1, w1), UV(c0, w1)]; prismP(B.p(TRIM), PC, yc, yc + 0.9); capP(B.p(SLATE2), PC, yc + 0.92);
        parP(B.p(TRIM), PC, yc + 0.9, yc + 1.9, 0.3); }
      // the steps up to the carriage porch floor
      for (let k = 0; k < 4; k++){ const P = [UV(u1 + k*0.45, v0 - 1), UV(u1 + (k + 1)*0.45, v0 - 1), UV(u1 + (k + 1)*0.45, v1 + 1), UV(u1 + k*0.45, v1 + 1)]; prismP(B.p(BASE), P, -5, Y0 - 0.4 - k*0.4); }
    }
    // ---- the pedimented porticoes at both ends of the front colonnades ----
    for (const [vA, vB] of [[-31.0, -21.0], [33.0, 43.0]]){ const u1 = 49.0, u0 = 46.8, vc = (vA + vB)/2;
      const P4 = [UV(u0, vA), UV(u1, vA), UV(u1, vB), UV(u0, vB)]; prismP(B.p(BASE), P4, -5, Y0);
      for (const v of [vA + 0.6, vA + 3.4, vB - 3.4, vB - 0.6]){ const p = UV(u1 - 0.5, v); latheP(B.p(TRIM), [[0.45, Y0], [0.45, Y0 + 0.4], [0.36, Y0 + 0.6], [0.33, Y2 - 0.6], [0.45, Y2 - 0.3], [0.5, Y2]], p[0], p[1], 10); }
      prismP(B.p(TRIM), P4, Y2 - 0.1, Y2 + 0.8);
      const FrF = (a, y, w) => { const p = L(u1 + (w || 0), 0, vc + a); return [p[0], y, p[2]]; }, yp = Y2 + 0.8;
      slabP(B.p(WALL), [[-5.1, yp], [5.1, yp], [0, yp + 2.6]], FrF, -2.6, 0); slabP(B.p(TRIM), [[-5.3, yp - 0.05], [5.3, yp - 0.05], [0, yp + 2.8]], FrF, 0, 0.15);
      const o = B.p(SLATE); quadP(o, FrF(-5.3, yp, 0.2), FrF(0, yp + 2.7, 0.2), L(u0 - 1.5, yp + 2.7, vc), L(u0 - 1.5, yp, vc + 5.3)); quadP(o, FrF(0, yp + 2.7, 0.2), FrF(5.3, yp, 0.2), L(u0 - 1.5, yp, vc - 5.3), L(u0 - 1.5, yp + 2.7, vc));
    }
    // ---- the central tower: third storey with Corinthian pilasters, cornice, slated mansard with dormers, flagpole ----
    { const uc = 35.0, vc = 5.7, a = 7.0, b = 7.0, T0 = YP, T1 = 21.6, T2 = 22.6;
      const P = [UV(uc - a, vc - b), UV(uc + a, vc - b), UV(uc + a, vc + b), UV(uc - a, vc + b)];
      wallP(B.p(WALL), P, Y2, T1); capP(B.p(SLATE2), P, T2);
      for (const e of edgesF(P)){
        slabP(B.p(TRIM), rectO(-0.2, e.L + 0.2, T1 - 0.2, T2), e.F, 0, 0.55);
        slabP(B.p(TRIM), rectO(-0.1, e.L + 0.1, T1 - 1.2, T1 - 0.6), e.F, 0, 0.3);
        for (let k = 0; k <= 4; k++){ const u = Math.min(e.L - 0.35, Math.max(0.35, e.L*k/4)); slabP(B.p(TRIM), rectO(u - 0.4, u + 0.4, T0, T1 - 1.2), e.F, 0, 0.25); slabP(B.p(TRIM), rectO(u - 0.55, u + 0.55, T1 - 1.8, T1 - 1.2), e.F, 0, 0.35); }
        for (let k = 0; k < 4; k++){ const u = e.L*(k + 0.5)/4; shapeP(B.p(LOUV), mv(rArchO(0.85, 4.6), u, T0 + 1.0), e.F, 0.05); slabP(B.p(TRIM), mv(rArchO(1.05, 4.85), u, T0 + 0.9).filter(p => p[1] > T0 + 3.5), e.F, 0, 0.1); }
      }
      // mansard: steep lower slope with dormers, low upper slope
      const c = UV(uc, vc), M0 = T2, M1 = T2 + 3.8, M2 = M1 + 1.4;
      roofP(B.p(SLATE), c[0], c[1], a + 0.3, b + 0.3, a - 1.4, b - 1.4, M0, M1 - M0, {ry:-AN, pw:1, nt:1, n:1});
      roofP(B.p(SLATE2), c[0], c[1], a - 1.4, b - 1.4, a - 4.2, b - 4.2, M1, M2 - M1, {ry:-AN, pw:1, nt:1, n:1});
      capP(B.p(SLATE2), [UV(uc - a + 4.2, vc - b + 4.2), UV(uc + a - 4.2, vc - b + 4.2), UV(uc + a - 4.2, vc + b - 4.2), UV(uc - a + 4.2, vc + b - 4.2)], M2);
      for (const e of edgesF(P)) for (const t of [0.3, 0.7]){ const p = e.F(e.L*t, 0, -0.9); boxP(B.p(WALL), 1.3, 2.0, 1.2, p[0], M0 + 0.6, p[2], -e.ang); const q = e.F(e.L*t, 0, -0.3);
        shapeP(B.p(LOUV), mv(rArchO(0.42, 1.5), e.L*t, M0 + 0.8), e.F, -0.28); latheP(B.p(SLATE2), [[0.95, M0 + 2.6], [0.05, M0 + 3.3]], p[0], p[2], 4, PI/4 - e.ang); }
      for (const p of P) latheP(B.p(TRIM), [[0.35, T2], [0.35, T2 + 0.6], [0.5, T2 + 0.75], [0.1, T2 + 1.4]], p[0], p[1], 6);
      // flagpole
      latheP(B.p(POLE), [[0.16, M2], [0.09, M2 + 9.5], [0.16, M2 + 9.6], [0.0, M2 + 9.8]], c[0], c[1], 6);
      const fp = [c[0], M2 + 9.2, c[1]], fd = L(1, 0, 0); quadP(B.p(FLAG), fp, [fp[0] + (fd[0])*2.4, fp[1], fp[2] + (fd[2])*2.4], [fp[0] + (fd[0])*2.4, fp[1] - 1.5, fp[2] + (fd[2])*2.4], [fp[0], fp[1] - 1.5, fp[2]]);
    }
    // ---- the forecourt: paved apron and gravel to the drive, retaining wall, lamps ----
    { const FC = [UV(47, -36), UV(76, -36), UV(76, 48), UV(47, 48)];
      prismP(B.p(BASE), FC, -6, 0.15); capP(B.p(GRAVEL), FC, 0.17);
      capP(B.p(PAVE), [UV(47, -6), UV(73, -6), UV(73, 18), UV(47, 18)], 0.2);
      capP(B.p(LAWN), [UV(62, -32), UV(72, -32), UV(72, -12), UV(62, -12)], 0.2); capP(B.p(LAWN), [UV(62, 24), UV(72, 24), UV(72, 44), UV(62, 44)], 0.2);
      for (const v of [-34, -18, -8, 20, 30, 46]){ const p = UV(75, v); latheP(B.p(BASE), [[0.25, 0.15], [0.18, 0.6], [0.09, 3.6]], p[0], p[1], 6); boxP(B.p(LAMP), 0.4, 0.55, 0.4, p[0], 3.6, p[1], -AN); }
      for (const v of [-6, 18]){ const p = UV(73, v); boxP(B.p(BASE), 1.2, 1.4, 1.2, p[0], 0.15, p[1], -AN); boxP(B.p(LAMP), 0.5, 0.6, 0.5, p[0], 1.55, p[1], -AN); }
      // balustrade along the outer edge, broken by the central flight of steps down to the drive
      for (const [v0, v1] of [[-36, -6], [18, 48]]){ const P = [UV(76, v0), UV(76, v1)], e = edgesF([UV(75.6, v0), UV(75.6, v1), UV(70, v1)])[0]; slabP(B.p(TRIM), rectO(0, e.L, 0.15, 1.1), e.F, -0.3, 0); }
      for (let k = 0; k < 6; k++){ const P = [UV(76 + k*0.5, -5), UV(76.5 + k*0.5, -5), UV(76.5 + k*0.5, 17), UV(76 + k*0.5, 17)]; prismP(B.p(BASE), P, -6, -0.35*(k + 1)); }
    }
    B.flush(g);
    return g;
  }};
SG_PLACES.push({type:'istana', lat:1.307100, lon:103.842920, rot:0});

// ================= Sri Srinivasa Perumal Temple (1855; gopuram 1977-79, gift of P. Govindasamy Pillai), Serangoon Road =================
// The five-tier, ~20 m Dravidian gopuram on the real OSM footprint of the temple building (14 x 15.6 m, aligned with the
// compass like the rest of the temple compound, so the gopuram faces east to the Serangoon Road / Perumal Road corner):
// moulded granite plinth, the solid two-storey base with pilasters, niches and the guardian figures by the great timber
// doors; five receding tiers crowded with painted stucco figures of Vishnu's avatars (coloured figure niches, cornices
// and rows of miniature shrines), the crowning barrel vault with horseshoe gable ends and five gold kalasams; behind it
// the flat-roofed entrance mandapam with its parapet of small shrines, and stubs of the compound wall with Garuda
// figures. Frame: u = east (gopuram front), v = south, turned 4.6 deg from the map frame. Night: warm floodlights.
LANDMARKS.srinivasa = {zh:'斯里尼维沙柏鲁马兴都庙', en:'Sri Srinivasa Perumal Temple', cat:'old', r:17, h:21,
  lt:{m:0, c:'#ffdcae', k:1.0, e:0.6, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), V = mkV(), R = LMCTX.rng;
    const STONE = '#a49c8c', WALL = '#f2eadb', GOLD = {c:'#dcae42', lc:'#ffd27e', lk:1.3}, DOOR = '#5d3a20', DARK = '#3a2f29', PAVE = '#cfc8ba', LAMP = {c:'#fff2cc', glow:'#ffd890', gk:1.8};
    const PAL = ['#2f5fc8', '#d23b2c', '#3e9b4b', '#e9c33b', '#f3efe5', '#e690a2', '#e8873b', '#5bb9e1', '#9a5cc6', '#2f8f8a', '#3d6fd0', '#f3efe5', '#e9c33b', '#2a4fae'];
    const pick = () => PAL[Math.floor(R()*PAL.length)];
    const AN = 4.6*PI/180, L = frameR(0.6, -0.4, AN);
    // local box helpers in the temple frame (u east, v south)
    const BX = (o, u0, u1, y0, y1, v0, v1) => boxP(o, u1 - u0, y1 - y0, v1 - v0, ...(p => [p[0], y0, p[2]])(L((u0 + u1)/2, 0, (v0 + v1)/2)), -AN);
    const FR = (cu, cv, W, D, Wt, Dt, y, h) => { const P = (w, d, yy) => [[-w/2, -d/2], [w/2, -d/2], [w/2, d/2], [-w/2, d/2]].map(q => L(cu + q[1], yy, cv + q[0]));
      const b0 = P(W, D, y), t0 = P(Wt, Dt, y + h); return [b0, t0]; };
    const frustT = (o, cu, cv, W, D, Wt, Dt, y, h) => { const [b0, t0] = FR(cu, cv, W, D, Wt, Dt, y, h); for (let i = 0; i < 4; i++){ const j = (i + 1) % 4; quadP(o, b0[i], b0[j], t0[j], t0[i]); } quadP(o, t0[0], t0[3], t0[2], t0[1]); };
    // facade frames: front (east, u = cu + D/2), back, north and south faces of a block centred (cu, cv) of width W (along v) and depth D (along u)
    const faces = (cu, cv, W, D) => [
      {F:(s, y, w) => L(cu + D/2 + (w || 0), y, cv - s), len:W, front:1}, {F:(s, y, w) => L(cu - D/2 - (w || 0), y, cv + s), len:W, front:0},
      {F:(s, y, w) => L(cu + s, y, cv + W/2 + (w || 0)), len:D, front:0}, {F:(s, y, w) => L(cu - s, y, cv - W/2 - (w || 0)), len:D, front:0}];
    // ---- foundation and the forecourt paving ----
    const RING = [[-5.8,-8.9],[7.9,-7.8],[7.3,7.7],[-7.0,7.1]];
    wallP(B.p(STONE), RING, -4, 0.3);
    const PV = [L(7.4, 0, -11.5), L(10.6, 0, -11.5), L(10.6, 0, 11.5), L(7.4, 0, 11.5)].map(p => [p[0], p[2]]); capP(B.p(PAVE), PV, 0.08); wallP(B.p(STONE), PV, -2, 0.08);
    // ---- gopuram ----
    const GU = 3.0, GW = 13.2, GD = 8.8, YB = 7.0;
    BX(B.p(STONE), GU - GD/2 - 0.35, GU + GD/2 + 0.35, 0.3, 0.75, -GW/2 - 0.35, GW/2 + 0.35);
    vAdd(V, '#c9c1ad', t => frustT(t, GU, 0, GW + 0.2, GD + 0.2, GW, GD, 0.75, 0.55));
    BX(B.p(WALL), GU - GD/2, GU + GD/2, 1.3, YB, -GW/2, GW/2);
    for (const fc of faces(GU, 0, GW, GD)){ const F = fc.F, Lh = fc.len/2;
      // pilasters and the two storeys of niches
      for (const s of [-Lh + 0.2, -Lh*0.62, -Lh*0.25, Lh*0.25, Lh*0.62, Lh - 0.2]) vAdd(V, '#e8c454', t => slabP(t, rectO(s - 0.16, s + 0.16, 1.3, YB), F, 0, 0.12));
      for (const s of [-Lh*0.81, -Lh*0.43, Lh*0.43, Lh*0.81]){ if (fc.front && Math.abs(s) < 2.2) continue;
        for (const [y0, y1] of [[1.9, 3.9], [4.5, 6.4]]){ shapeP(B.p(DARK), rectO(s - 0.42, s + 0.42, y0, y1), F, 0.05); vAdd(V, pick(), t => slabP(t, rectO(s - 0.24, s + 0.24, y0 + 0.15, y1 - 0.2), F, 0.05, 0.28)); vAdd(V, '#e8c454', t => slabP(t, rectO(s - 0.55, s + 0.55, y1, y1 + 0.18), F, 0, 0.15)); } }
      vAdd(V, '#c8462f', t => slabP(t, rectO(-Lh, Lh, 4.15, 4.4), F, 0, 0.2));
      if (fc.front || !fc.front && fc.len > 12){
        // the great doorway with its timber doors and guardian figures
        shapeP(B.p(DARK), rectO(-1.35, 1.35, 1.3, 5.6), F, 0.04);
        shapeP(B.p(DOOR), rectO(-1.2, -0.04, 1.3, 5.2), F, 0.07); shapeP(B.p(DOOR), rectO(0.04, 1.2, 1.3, 5.2), F, 0.07);
        for (let i = 0; i < 7; i++) for (let j = 0; j < 3; j++) for (const sx of [-1, 1]) boxP(B.p(GOLD), 0.09, 0.09, 0.09, ...(p => [p[0], 1.8 + i*0.48, p[2]])(F(sx*(0.3 + j*0.3), 0, 0.1)), -AN);
        vAdd(V, '#e8c454', t => slabP(t, rectO(-1.65, 1.65, 5.6, 6.0), F, 0, 0.2));
        for (const sx of [-1, 1]){ shapeP(B.p(DARK), rectO(sx*1.75 - 0.5 + sx*0.5, sx*1.75 + 0.5 + sx*0.5, 1.6, 4.4), F, 0.05); vAdd(V, sx < 0 ? '#2f5fc8' : '#3e9b4b', t => slabP(t, rectO(sx*2.25 - 0.3, sx*2.25 + 0.3, 1.7, 4.1), F, 0.05, 0.4)); }
        if (fc.front) for (const sx of [-1, 1]) boxP(B.p(LAMP), 0.3, 0.45, 0.3, ...(p => [p[0], 5.0, p[2]])(F(sx*3.3, 0, 0.35)), -AN);
      }
    }
    vAdd(V, '#c8462f', t => frustT(t, GU, 0, GW + 0.5, GD + 0.5, GW + 0.75, GD + 0.75, YB, 0.3));
    vAdd(V, '#e6be3c', t => frustT(t, GU, 0, GW + 0.75, GD + 0.75, GW + 0.45, GD + 0.45, YB + 0.3, 0.25));
    // the five tiers
    let y = YB + 0.55, W = 12.3, D = 8.0;
    const mini = (s, F, big) => { const col = pick(); vAdd(V, col, t => {
      const p = F(s, y, -0.25);
      if (big){ boxP(t, 0.7, 0.34, 0.38, p[0], y, p[2], -AN + (F === null ? 0 : 0)); latheP(t, [[0.2, y + 0.34], [0.22, y + 0.46], [0.12, y + 0.62], [0.03, y + 0.72]], p[0], p[2], 6); }
      else { boxP(t, 0.36, 0.3, 0.36, p[0], y, p[2], -AN); latheP(t, [[0.22, y + 0.3], [0.24, y + 0.4], [0.15, y + 0.56], [0.03, y + 0.68]], p[0], p[2], 6); } }); };
    for (let i = 0; i < 5; i++){
      const hb = 1.45, Wt = W - 0.45, Dt = D - 0.3;
      vAdd(V, i % 2 ? '#f1e3c6' : '#f2d6b4', t => frustT(t, GU, 0, W, D, Wt, Dt, y, hb));
      for (const fc of faces(GU, 0, W, D)){ const F = fc.F, len = fc.len, n = Math.max(2, Math.round(len/0.62));
        for (let j = 0; j < n; j++){ const s = -len/2 + (j + 0.5)*len/n; if (fc.front && Math.abs(s) < 0.8) continue; const hh = 0.7 + 0.3*R();
          vAdd(V, pick(), t => slabP(t, rectO(s - 0.18, s + 0.18, y + 0.2, y + 0.2 + hh), F, 0.0, 0.22)); }
        for (const s of [-len/2 + 0.12, len/2 - 0.12]) vAdd(V, '#e6be3c', t => slabP(t, rectO(s - 0.12, s + 0.12, y, y + hb), F, 0, 0.12));
        if (fc.front || fc.len === W){ shapeP(B.p(DARK), mv(rArchO(0.45, 1.1), 0, y + 0.1), F, 0.08); vAdd(V, '#e6be3c', t => slabP(t, mv(rArchO(0.64, 1.25), 0, y + 0.05), F, 0, 0.06)); }
      }
      vAdd(V, i % 2 ? '#c8462f' : '#2f6fbf', t => frustT(t, GU, 0, Wt + 0.55, Dt + 0.55, Wt + 0.72, Dt + 0.72, y + hb, 0.26));
      y += hb + 0.26;
      const Wp = Wt + 0.3, Dp = Dt + 0.3;
      for (const fc of faces(GU, 0, Wp, Dp)){ const F = fc.F, len = fc.len, n = Math.max(1, Math.round((len - 0.6)/0.95));
        for (let j = 0; j < n; j++){ const s = -len/2 + 0.3 + (j + 0.5)*(len - 0.6)/n; mini(s, F, j % 2 === 0 && len > 4); } }
      y += 0.48; W = Wt - 0.85; D = Dt - 0.42;
    }
    // the crowning barrel vault with horseshoe gable ends and five gold kalasams
    vAdd(V, '#e6be3c', t => frustT(t, GU, 0, W + 0.2, D + 0.2, W, D, y, 0.35));
    const yv = y + 0.35, VR = Math.min(1.0, D/2 + 0.1), VL = W + 0.2, AR = [];
    for (let i = 0; i <= 10; i++){ const q = PI*i/10; AR.push([Math.cos(q)*VR, Math.sin(q)*VR*1.15]); }
    vAdd(V, '#e3b43c', t => { for (let i = 0; i < 10; i++){ const p = AR[i], q = AR[i+1]; quadP(t, L(GU + p[0], yv + p[1], -VL/2), L(GU + p[0], yv + p[1], VL/2), L(GU + q[0], yv + q[1], VL/2), L(GU + q[0], yv + q[1], -VL/2)); } });
    for (const sz of [-1, 1]){ const Fg = (s, yy, w) => L(GU - s*sz, yy, sz*(VL/2 + (w || 0)));
      vAdd(V, '#d0462e', t => slabP(t, AR.map(p => [p[0]*1.32, p[1]*1.32 + yv - 0.05]), Fg, -0.05, 0.12));
      vAdd(V, '#e3b43c', t => slabP(t, AR.map(p => [p[0]*0.72, p[1]*0.72 + yv]), Fg, 0.12, 0.2)); }
    for (let j = 0; j < 5; j++){ const v = -VL/2 + 0.45 + j*(VL - 0.9)/4, y0 = yv + VR*1.15 - 0.05, p = L(GU, 0, v);
      latheP(B.p(GOLD), [[0.14, y0], [0.25, y0 + 0.14], [0.29, y0 + 0.32], [0.19, y0 + 0.5], [0.08, y0 + 0.6], [0.13, y0 + 0.72], [0.02, y0 + 1.1]], p[0], p[2], 8); }
    // ---- the entrance mandapam behind the gopuram (rest of the footprint) ----
    { const u0 = -6.1, u1 = GU - GD/2, hh = 5.6;
      BX(B.p(WALL), u0, u1, 0.3, hh, -7.2, 7.2); BX(B.p(WALL), u1, GU + GD/2 - 0.6, 0.3, 4.2, -7.5, -GW/2); BX(B.p(WALL), u1, GU + GD/2 - 0.6, 0.3, 4.2, GW/2, 7.5);
      vAdd(V, '#c8462f', t => BX(t, u0 - 0.15, u1, hh, hh + 0.3, -7.35, 7.35));
      vAdd(V, '#e6be3c', t => BX(t, u0 - 0.3, u1, hh + 0.3, hh + 0.55, -7.5, 7.5));
      for (const v of [-7.25, 7.25]){ const sv = Math.sign(v); for (let k = 0; k < 2; k++){ const u = u0 + 1.2 + k*1.9, p = L(u, 0, v + sv*0.04);
        shapeP(B.p(DARK), mv(rArchO(0.5, 2.1), 0, 1.4), (s, yy, w) => L(u - s*sv, yy, v + sv*(0.03 + (w || 0))), 0); } }
      y = hh + 0.55;
      for (const [u, v] of [[u0 + 0.4, -7.0], [u0 + 0.4, 7.0], [u0 + 0.4, 0], [u0 + 2.2, -7.0], [u0 + 2.2, 7.0]]){ const col = pick(), p = L(u, 0, v); vAdd(V, col, t => { boxP(t, 0.5, 0.4, 0.5, p[0], y, p[2], -AN); latheP(t, [[0.28, y + 0.4], [0.31, y + 0.55], [0.18, y + 0.78], [0.04, y + 0.95]], p[0], p[2], 6); }); }
    }
    // ---- stubs of the compound wall with Garuda figures, north and south of the gopuram ----
    for (const sv of [-1, 1]){ const v0 = sv*(GW/2), v1 = sv*(GW/2 + 3.6), u = GU + GD/2 - 0.5;
      BX(B.p(WALL), u - 0.35, u + 0.35, 0.3, 3.4, Math.min(v0, v1), Math.max(v0, v1));
      vAdd(V, '#c8462f', t => BX(t, u - 0.45, u + 0.45, 2.8, 3.05, Math.min(v0, v1), Math.max(v0, v1)));
      vAdd(V, '#e6be3c', t => BX(t, u - 0.5, u + 0.5, 3.4, 3.65, Math.min(v0, v1), Math.max(v0, v1)));
      for (let k = 0; k < 3; k++){ const v = v0 + sv*(0.6 + k*1.2), p = L(u, 0, v); vAdd(V, k === 1 ? '#3e9b4b' : '#e6be3c', t => { boxP(t, 0.4, 0.55, 0.45, p[0], 3.65, p[2], -AN); boxP(t, 0.25, 0.3, 0.3, p[0] + 0.05, 4.2, p[2], -AN); }); }
    }
    B.flush(g); vFlush(g, V);
    return g;
  }};
SG_PLACES.push({type:'srinivasa', lat:1.313550, lon:103.856430, rot:0});

// ================= Kong Meng San Phor Kark See Monastery (Bright Hill, from 1921; great halls from the 1980s on) =================
// The core of the hillside complex on the real OSM footprints: the Hall of Great Compassion (the 41 x 60 m main hall,
// double-eaved hip roof in orange-gold glazed tiles, red columns and lattice, on a stone podium whose terraces fall
// 14 m down the slope to the north, the grand stair to the courtyard on the south); the Hall of Great Strength across
// the courtyard (24 x 42 m, double-eaved hip-and-gable roof with dragon-tail ridge ends) with the rear gallery hall, the
// drum and bell towers (the two octagonal two-storey pavilions), the small incense pavilion; further south the
// octagonal Hall of Amrita Precepts / Rocana Buddha pagoda (double eaves, pagoda roof, gold stupa finial) with the
// side buildings and the hall to its west; paved courtyards, bronze urns, trees. Heights estimated from the halls'
// proportions. Frame: real map frame, origin 63 m south / 10 m west of the Hall of Great Compassion's centre.
// Night: warm floodlights, glowing lattice and lanterns.
LANDMARKS.kmspks = {zh:'光明山普觉禅寺', en:'Kong Meng San Phor Kark See Monastery', cat:'old', r:112, h:31,
  lt:{m:0, c:'#ffd6a0', k:0.95, e:0.5},
  build(){
    const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
    const OX = 10, OZ = -63, T = P => P.map(p => [p[0] + OX, p[1] + OZ]), TP = p => [p[0] + OX, p[1] + OZ];
    const GRAN = '#cbc6bb', WHITE = '#ece8df', RED = {c:'#a3271c', m:0, lk:0.8}, WALLC = '#e8dcc4', TILE = {c:'#d98a2b', m:0, lc:'#ffd9a0', lk:1.0}, RIDGE = {c:'#b8661f', m:0, lk:0.8},
      BEAM = {c:'#2f6d64', m:0, lk:0.5}, WIN = {c:'#b0853c', glow:'#ffbe6a', gk:0.55}, GOLD = {c:'#dcae42', lc:'#ffd27e', lk:1.3}, PAVE = '#c9c2b4', LEAF = '#4f7a44', TRUNK = '#6b5440',
      LANT = {c:'#d8382a', glow:'#ff5a2e', gk:1.6}, BRONZE = '#5a4a37', DARKW = {c:'#3c3a35', glow:'#ffcc88', gk:0.35};
    const M = {pod:B.p(GRAN), wall:B.p(WALLC), col:B.p(RED), win:B.p(WIN), beam:B.p(BEAM), tile:B.p(TILE), ridge:B.p(RIDGE), gold:B.p(GOLD), bal:B.p(WHITE), gab:B.p(RED)};
    const ang = (a, b2) => Math.atan2(b2[1] - a[1], b2[0] - a[0]);
    // ---- the site platform of the upper courtyards (paved), its retaining walls down the slope ----
    const SITE = T([[-46,26],[-34,22],[8,34],[34,44],[40,46],[14,62],[12,108],[12,130],[14,158],[-22,168],[-40,160],[-44,138],[-50,112],[-52,96],[-58,58],[-52,36]]);
    prismP(B.p(GRAN), SITE, -16, -1.0);
    capP(B.p(PAVE), SITE, -0.98);
    // ---- the Hall of Great Compassion ----
    { const MAIN = T([[-30.4,19.3],[-16.1,-36.5],[24.1,-26.4],[14.0,13.9],[12.7,18.8],[9.7,30.1]]), f = fitR(MAIN, ang(TP([-16.1,-36.5]), TP([24.1,-26.4])));
      const Lf = frameR(f.cx, f.cz, f.ang);
      // the podium: two terraces down the slope (north and east), stone with window rows (the halls below), balustrades
      const rect = (A, Bq, du) => [Lf(-A + (du || 0), 0, -Bq), Lf(A + (du || 0), 0, -Bq), Lf(A + (du || 0), 0, Bq), Lf(-A + (du || 0), 0, Bq)].map(p => [p[0], p[2]]);
      prismP(B.p(GRAN), rect(f.a + 4.0, f.b + 4.0), -16, -6.0); parP(B.p(WHITE), rect(f.a + 4.0, f.b + 4.0), -6.0, -5.0, 0.25);
      prismP(B.p(GRAN), rect(f.a + 1.8, f.b + 1.8), -6.0, 0.0); parP(B.p(WHITE), rect(f.a + 1.8, f.b + 1.8), 0.0, 1.0, 0.25);
      for (const [P, y0, y1] of [[rect(f.a + 4.0, f.b + 4.0), -14.5, -6.6], [rect(f.a + 1.8, f.b + 1.8), -5.2, -0.6]])
        for (const e of edgesF(P)){ const n = Math.round(e.L/3.2); for (let k = 0; k < n; k++){ const u = e.L*(k + 0.5)/n; for (let yy = y0; yy < y1 - 1.5; yy += 3.6) shapeP(B.p(DARKW), rectO(u - 0.7, u + 0.7, yy, yy + 2.0), e.F, 0.04); } }
      // the hall itself (front to the south: +v)
      chHall(f, {M, y0:0.0, wh:10.5, roof:'dbl', rise:11.5, ov:3.4, lift:1.2, pw:1.6, colStep:4.2, orn:'chi', cl:3.2});
      // grand stair from the front to the courtyard, white balustrades, bronze urns
      for (let k = 0; k < 9; k++){ const P = [Lf(-9, 0, f.b + 1.8 + k*0.5), Lf(9, 0, f.b + 1.8 + k*0.5), Lf(9, 0, f.b + 2.3 + k*0.5), Lf(-9, 0, f.b + 2.3 + k*0.5)].map(p => [p[0], p[2]]); prismP(B.p(GRAN), P, -6, -0.33*(k + 1)); }
      for (const s of [-1, 1]){ const A2 = Lf(s*9.3, 0.9, f.b + 1.8), B2 = Lf(s*9.3, -2.1, f.b + 6.3); segP(B.p(WHITE), A2, B2, 0.25, 4); prismP(B.p(WHITE), [Lf(s*9.3 - 0.4, 0, f.b + 1.8), Lf(s*9.3 + 0.4, 0, f.b + 1.8), Lf(s*9.3 + 0.4, 0, f.b + 6.3), Lf(s*9.3 - 0.4, 0, f.b + 6.3)].map(p => [p[0], p[2]]), -6, -2.6); }
      for (const s of [-1, 1]){ const p = Lf(s*14, 0, f.b + 9); latheP(B.p(BRONZE), [[0.7, -1], [1.1, -0.5], [1.2, 0.3], [0.9, 0.7], [1.0, 0.85], [0, 0.85]], p[0], p[2], 12); }
      // lanterns under the front eave
      for (let k = -4; k <= 4; k++){ const p = Lf(k*4.3, 0, f.b + 0.6); latheP(B.p(LANT), [[0.05, 8.9], [0.32, 9.0], [0.38, 9.25], [0.32, 9.5], [0.05, 9.6]], p[0], p[2], 8); }
      // the east annexe (two blocks of the real footprint)
      for (const Q of [[[14.0,13.9],[29.4,18.0],[26.5,29.3],[12.7,25.8]], [[17.9,26.5],[33.6,31.0],[31.7,40.7],[14.9,36.5]]]){
        const P = T(Q), fa = fitR(P, ang(P[0], P[1]));
        prismP(B.p(GRAN), cornersR(fa, -0.6), -16, 0.0);
        chHall(fa, {M, y0:0.0, wh:6.0, roof:'hip', rise:3.6, ov:1.6, lift:0.5, colStep:3.2}); }
    }
    // ---- the Hall of Great Strength (front to the north) and its rear gallery hall ----
    { const HB = T([[-25.6,47.2],[-5.3,54.9],[-19.6,92.8],[-44.7,94.6],[-36.3,72.1],[-39.9,70.9],[-32.1,50.7],[-27.4,52.5]]), f = fitR(HB, ang(TP([-25.6,47.2]), TP([-5.3,54.9])) + 0.0);
      const fh = Object.assign({}, f); fh.b = f.b - 5.5; const Lf = frameR(f.cx, f.cz, f.ang), c2 = Lf(0, 0, -5.5 + 0.0); fh.cx = c2[0]; fh.cz = c2[2];
      prismP(B.p(GRAN), cornersR(fh, -1.6), -3.0, 0.6);
      chHall(fh, {M, y0:0.6, wh:9.5, roof:'dbl', xs:true, rise:9.5, ov:3.0, lift:1.4, pw:1.6, colStep:4.0, orn:'chi', cl:2.8, bal:true});
      const LL = frameR(fh.cx, fh.cz, fh.ang);
      for (let k = 0; k < 5; k++){ const P = [LL(-7, 0, -fh.b - 1.6 - (k + 1)*0.45), LL(7, 0, -fh.b - 1.6 - (k + 1)*0.45), LL(7, 0, -fh.b - 1.6 - k*0.45), LL(-7, 0, -fh.b - 1.6 - k*0.45)].map(p => [p[0], p[2]]); prismP(B.p(GRAN), P, -3, 0.6 - 0.32*(k + 1)); }
      for (let k = -3; k <= 3; k++){ const p = LL(k*4.0, 0, -fh.b - 0.4); latheP(B.p(LANT), [[0.05, 8.0], [0.3, 8.1], [0.36, 8.35], [0.3, 8.6], [0.05, 8.7]], p[0], p[2], 8); }
      for (const s of [-1, 1]){ const p = LL(s*11, 0, -fh.b - 7); latheP(B.p(BRONZE), [[0.6, -1], [0.95, -0.5], [1.0, 0.2], [0.75, 0.55], [0.85, 0.7], [0, 0.7]], p[0], p[2], 12); }
      const RG = T([[-19.6,92.8],[6.1,102.3],[2.5,111.8],[-44.7,94.6]]), fr = fitR(RG, ang(RG[0], RG[1]));
      prismP(B.p(GRAN), cornersR(fr, -0.8), -3.0, 0.4);
      chHall(fr, {M, y0:0.4, wh:6.5, roof:'xs', rise:4.6, ov:2.0, lift:0.8, colStep:3.6, orn:'chi'});
    }
    // ---- the drum (west) and bell (east) towers: octagonal two-storey pavilions ----
    for (const [cx0, cz0, r0] of [[-48.2, 53.2, 5.6], [2.5, 69.9, 5.4]]){ const [cx, cz] = TP([cx0, cz0]), ph = PI/8 + 0.25;
      ngonP(B.p(GRAN), cx, cz, 8, ph, r0 + 0.4, -3.0, 0.8, true);
      ngonP(B.p(WALLC), cx, cz, 8, ph, r0 - 0.9, 0.8, 5.6);
      for (const p of ringPts(cx, cz, r0 - 0.2, 8, ph)) latheP(B.p(RED), [[0.3, 0.8], [0.27, 5.6]], p[0], p[1], 8);
      for (let k = 0; k < 8; k++){ const a0 = ph + (k + 0.5)/8*TAU, ap = (r0 - 0.9)*Math.cos(PI/8) + 0.02; shapeP(B.p(WIN), rectO(-1.2, 1.2, 1.3, 4.8), fA(cx + Math.cos(a0)*ap, cz + Math.sin(a0)*ap, a0 + HP), 0); }
      polyRoofP(B.p(TILE), cx, cz, 8, ph, r0 + 1.8, r0 - 1.2, 5.4, 1.3, {lift:0.8, pw:1.3, nt:3, fas:0.35, fo:B.p(BEAM), hips:B.p(RIDGE)});
      ngonP(B.p(WALLC), cx, cz, 8, ph, r0 - 1.6, 6.6, 10.0);
      for (const p of ringPts(cx, cz, r0 - 1.0, 8, ph)) latheP(B.p(RED), [[0.24, 6.6], [0.22, 10.0]], p[0], p[1], 6);
      for (let k = 0; k < 8; k++){ const a0 = ph + (k + 0.5)/8*TAU, ap = (r0 - 1.6)*Math.cos(PI/8) + 0.02; shapeP(B.p(WIN), rectO(-0.8, 0.8, 7.1, 9.5), fA(cx + Math.cos(a0)*ap, cz + Math.sin(a0)*ap, a0 + HP), 0); }
      const yt = polyRoofP(B.p(TILE), cx, cz, 8, ph, r0 + 1.0, 0.3, 9.8, 4.8, {lift:1.0, pw:1.6, nt:6, fas:0.35, fo:B.p(BEAM), hips:B.p(RIDGE)});
      latheP(B.p(GOLD), [[0.35, yt - 0.1], [0.45, yt + 0.3], [0.25, yt + 0.6], [0.32, yt + 0.9], [0.06, yt + 1.8]], cx, cz, 8);
    }
    // ---- the small incense pavilion ----
    { const P = T([[14.4,63.8],[6.7,62.0],[9.1,51.9],[16.2,53.7]]), f = fitR(P, ang(P[0], P[1])); prismP(B.p(GRAN), cornersR(f, -0.3), -3, 0.3); chHall(f, {M, y0:0.3, wh:3.6, roof:'xs', rise:2.4, ov:1.2, lift:0.6, colStep:2.6, orn:'chi'}); }
    // ---- the hall west of the precepts hall (real footprint) and the three side buildings ----
    { const P = T([[-44.1,98.2],[-53.6,128.4],[-70.9,123.1],[-61.4,92.8]]), f = fitR(P, ang(P[0], P[1])); prismP(B.p(GRAN), cornersR(f, -0.8), -3, 0.4); chHall(f, {M, y0:0.4, wh:7.0, roof:'xs', rise:5.0, ov:2.2, lift:0.9, colStep:3.6, orn:'chi'}); }
    for (const Q of [[[3.7,122.5],[4.3,136.1],[-5.3,136.1],[-5.3,123.1]], [[-2.9,163.4],[-4.1,138.5],[0.1,137.9],[1.3,163.4]], [[9.7,141.4],[10.3,153.3],[3.7,153.3],[3.7,141.4]]]){
      const P = T(Q), f = fitR(P, ang(P[0], P[1])); prismP(B.p(GRAN), cornersR(f, -0.2), -3, 0.2); chHall(f, {M, y0:0.2, wh:3.8, roof:'hip', rise:Math.min(2.6, f.b*0.9), ov:0.9, lift:0.3, pm:0, colStep:3.0}); }
    // ---- the octagonal Hall of Amrita Precepts with the Rocana Buddha: double eaves, pagoda roof, gold stupa finial ----
    { const [cx, cz] = TP([-21.0, 148.3]), ph = 0.245 + PI/8, r0 = 14.4;
      ngonP(B.p(GRAN), cx, cz, 8, ph, r0 + 2.6, -3.0, 0.9, true); parP(B.p(WHITE), ringPts(cx, cz, r0 + 2.6, 8, ph), 0.9, 1.8, 0.25);
      ngonP(B.p(WALLC), cx, cz, 8, ph, r0 - 1.2, 0.9, 8.5);
      for (let k = 0; k < 8; k++){ const a0 = ph + k/8*TAU, a1 = ph + (k + 1)/8*TAU; for (let j = 0; j < 3; j++){ const t = j/3, x = cx + (Math.cos(a0)*(1 - t) + Math.cos(a1)*t)*(r0 - 0.1), z = cz + (Math.sin(a0)*(1 - t) + Math.sin(a1)*t)*(r0 - 0.1); latheP(B.p(RED), [[0.36, 0.9], [0.32, 8.5]], x, z, 8); } }
      for (let k = 0; k < 8; k++){ const a0 = ph + (k + 0.5)/8*TAU, ap = (r0 - 1.2)*Math.cos(PI/8) + 0.03, Fq = fA(cx + Math.cos(a0)*ap, cz + Math.sin(a0)*ap, a0 + HP);
        for (const s of [-3.4, 0, 3.4]) shapeP(B.p(WIN), rectO(s - 1.3, s + 1.3, 1.6, 7.4), Fq, 0); }
      polyRoofP(B.p(TILE), cx, cz, 8, ph, r0 + 2.4, r0 - 2.2, 8.2, 2.0, {lift:1.2, pw:1.3, nt:3, sub:3, fas:0.4, fo:B.p(BEAM), hips:B.p(RIDGE)});
      ngonP(B.p(WALLC), cx, cz, 8, ph, r0 - 3.2, 9.8, 14.0);
      for (let k = 0; k < 8; k++){ const a0 = ph + (k + 0.5)/8*TAU, ap = (r0 - 3.2)*Math.cos(PI/8) + 0.03; shapeP(B.p(WIN), rectO(-2.6, 2.6, 10.4, 13.4), fA(cx + Math.cos(a0)*ap, cz + Math.sin(a0)*ap, a0 + HP), 0); }
      for (const p of ringPts(cx, cz, r0 - 2.6, 8, ph)) latheP(B.p(RED), [[0.3, 9.8], [0.28, 14.0]], p[0], p[1], 8);
      polyRoofP(B.p(TILE), cx, cz, 8, ph, r0 - 0.4, r0 - 4.8, 13.8, 1.6, {lift:1.1, pw:1.3, nt:3, sub:3, fas:0.4, fo:B.p(BEAM), hips:B.p(RIDGE)});
      ngonP(B.p(WALLC), cx, cz, 8, ph, r0 - 5.6, 15.0, 17.6);
      for (let k = 0; k < 8; k++){ const a0 = ph + (k + 0.5)/8*TAU, ap = (r0 - 5.6)*Math.cos(PI/8) + 0.03; shapeP(B.p(WIN), rectO(-1.6, 1.6, 15.4, 17.2), fA(cx + Math.cos(a0)*ap, cz + Math.sin(a0)*ap, a0 + HP), 0); }
      const yt = polyRoofP(B.p(TILE), cx, cz, 8, ph, r0 - 2.6, 0.5, 17.4, 7.0, {lift:1.4, pw:1.6, nt:7, sub:3, fas:0.45, fo:B.p(BEAM), hips:B.p(RIDGE), hr:0.25});
      latheP(B.p(GOLD), [[1.3, yt - 0.3], [1.6, yt + 0.2], [1.5, yt + 0.8], [1.0, yt + 1.5], [0.6, yt + 1.8], [0.7, yt + 2.0], [0.35, yt + 2.3], [0.4, yt + 2.9], [0.2, yt + 3.4], [0.25, yt + 3.8], [0.1, yt + 4.4], [0.03, yt + 5.4]], cx, cz, 12);
    }
    // ---- trees in the courtyards ----
    for (const q of [[-40,36],[-44,46],[18,48],[24,44],[-30,118],[-12,118],[8,112],[-42,140],[-4,170],[-38,166],[16,92],[18,74],[-52,74]]){
      const [x, z] = TP(q), s = 0.9 + R()*0.5; segP(B.p(TRUNK), [x, -1, z], [x, 3.0*s - 1, z], 0.3*s, 5); LSph(g, 3.0*s, x, 4.6*s - 1, z, LEAF, 0.8, 8); }
    B.flush(g);
    return g;
  }};
SG_PLACES.push({type:'kmspks', lat:1.361770, lon:103.836610, rot:0});

// ================= Lian Shan Shuang Lin Monastery (Siong Lim, 1902-09; restored 1991-2001), Toa Payoh =================
// The cong-lin layout on its north-south axis, every hall on its real OSM footprint (frame turned 9.7 deg): the front court
// closed by single-storey corridors with the pai-lou mountain gate and the half-moon pond; the Hall of Celestial Kings
// (Tian Wang Dian, Zhangzhou-style hip-and-gable roof); the courtyard with the drum (west) and bell (east) towers;
// the Mahavira Hall (Da Xiong Bao Dian) with its two-tiered hip-and-gable roof; the rear Dharma Hall and the side halls,
// corridors and the long Guan Yin Dian on the east; Hokkien roofs of dark grey tiles with curved ridges, swallowtail
// ends and colourful ceramic-shard (jian nian) figures, red-brown timber and lattice on granite bases; and in the
// south-east the seven-storey octagonal Dragon Light Pagoda (Long Guang Bao Ta, 2002) with its gilt crown (est. 33 m).
// Frame: real map frame (+x east, +z south). Night: the warm glow of the hidden beam lights, lanterns, floodlit pagoda.
LANDMARKS.shuanglin = {zh:'莲山双林寺', en:'Lian Shan Shuang Lin Monastery', cat:'old', r:96, h:34,
  lt:{m:0, c:'#ffd09a', k:1.0, e:0.5, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), V = mkV(), R = LMCTX.rng;
    const GRAN = '#b6b1a7', TIMB = {c:'#86452c', m:0, lk:0.7}, COL = {c:'#6f2c1d', m:0, lk:0.7}, WIN = {c:'#a5703f', glow:'#ffb862', gk:0.6}, BEAM = {c:'#3d6b5e', m:0, lk:0.6},
      TILE = {c:'#6a655f', m:0, lk:0.45}, RIDGE = {c:'#4b4743', m:0, lk:0.45}, GOLD = {c:'#d8a73e', lc:'#ffd27e', lk:1.3}, WHITE = '#e9e5dc', PAVE = '#c6c0b4',
      WATER = {c:'#4f8fa6', glow:'#7fc8e0', gk:0.25}, LANT = {c:'#d8382a', glow:'#ff5a2e', gk:1.7}, PSTONE = {c:'#c8c2b6', m:0, lk:1.0}, LEAF = '#4f7a44';
    const PAL = ['#3f7b54', '#d23b2c', '#e9c33b', '#3d6fd0', '#f3efe5', '#e690a2', '#2f8f8a', '#e8873b'];
    const M = {pod:B.p(GRAN), wall:B.p(TIMB), col:B.p(COL), win:B.p(WIN), beam:B.p(BEAM), tile:B.p(TILE), ridge:B.p(RIDGE), gold:B.p(GOLD), bal:B.p(WHITE)};
    const AN = 9.7*PI/180, fit = P => fitR(P, AN);
    // ---- the paved compound, granite base ----
    const SITE = [[-56,22],[-50,-24],[-44,-60],[-40,-80],[12,-72],[44,-70],[66,-66],[54,4],[34,30],[42,40],[40,54],[12,63],[-4,58],[-46,52]];
    prismP(B.p(GRAN), SITE, -4.5, -0.3); capP(B.p(PAVE), SITE, -0.28);
    const hall = (P, o) => { const f = fit(P); return chHall(f, Object.assign({M, yb:-4.5, pm:0.6, lift:0.5, pw:1.5, orn:'swt', colStep:3.2}, o)); };
    // jian nian ridge figures (vertex-coloured) along a hall's main ridge
    const figs = (P, top, n, spanK) => { const f = fit(P), L = frameR(f.cx, f.cz, f.ang), sp = Math.max(1, (f.a - f.b))*spanK;
      for (let k = 0; k < n; k++){ const u = -sp + 2*sp*(k + 0.5)/n, p = L(u, 0, 0), hh = 0.4 + R()*0.35; vAdd(V, PAL[Math.floor(R()*PAL.length)], t => boxP(t, 0.32, hh, 0.24, p[0], top + 0.45, p[2], -AN)); }
      for (const s of [-1, 1]){ const p = L(s*0.9, 0, 0); vAdd(V, '#3f7b54', t => { boxP(t, 1.2, 0.5, 0.3, p[0], top + 0.45, p[2], -AN); }); }
      const c = L(0, 0, 0); latheP(B.p(GOLD), [[0.08, top + 0.4], [0.35, top + 0.65], [0.4, top + 0.95], [0.25, top + 1.25], [0.06, top + 1.4]], c[0], c[2], 8); };
    // ---- the main axis ----
    const TWD = [[-35.8,3.0],[6.5,10.2],[3.6,26.2],[-38.2,19.1]];
    const t1 = hall(TWD, {y0:0.6, wh:6.2, roof:'xs', rise:5.2, ov:2.0, sag:0.75, lift:0.6, colStep:3.6}); figs(TWD, t1 + 0.75, 22, 0.9);
    const MAH = [[0.0,-34.3],[-3.6,-14.8],[-25.7,-18.3],[-22.1,-38.5]];
    const t2 = hall(MAH, {y0:1.0, wh:6.6, roof:'dbl', xs:true, rise:5.6, ov:2.4, cl:2.6, sag:0.8, lift:0.7, bal:true}); figs(MAH, t2 + 0.8, 12, 0.9);
    hall([[4.7,-31.9],[1.2,-14.2],[-3.6,-14.8],[-0.6,-32.5]], {y0:1.0, wh:4.2, roof:'gab', rise:1.6, ov:0.8, sag:0, orn:null});
    hall([[-17.9,-74.6],[11.3,-69.9],[7.7,-50.3],[-21.5,-55.1]], {y0:0.6, wh:6.0, roof:'xs', rise:4.6, ov:2.0, sag:0.6});            // Dharma Hall
    // ---- the drum (west) and bell (east) towers ----
    for (const P of [[[-27.5,-7.6],[-29.3,4.2],[-42.4,1.9],[-40.6,-9.4]], [[25.0,4.8],[23.9,13.1],[8.3,10.7],[10.1,2.4]]]){ const t = hall(P, {y0:0.6, wh:4.6, roof:'dbl', xs:true, rise:3.4, ov:1.6, cl:2.8, sag:0.4, lift:0.7}); }
    // ---- side halls and corridors ----
    for (const [P, o] of [
      [[[6.5,10.2],[23.9,13.1],[20.9,29.1],[3.6,26.2]], {wh:5.4, roof:'xs', rise:4.2}],
      [[[-38.2,19.1],[-54.4,16.7],[-51.4,0.1],[-35.8,3.0]], {wh:5.4, roof:'xs', rise:4.2}],
      [[[25.0,4.8],[10.1,2.4],[12.5,-11.8],[28.0,-9.4]], {wh:5.8, roof:'xs', rise:4.4}],
      [[[12.5,-11.8],[10.1,-0.5],[-0.6,-2.3],[1.2,-14.2]], {wh:5.0, roof:'xs', rise:3.8}],
      [[[-38.8,-20.7],[-25.7,-18.3],[-27.5,-7.6],[-40.6,-9.4]], {wh:5.2, roof:'xs', rise:3.8}],
      [[[-38.8,-20.7],[-42.4,1.9],[-49.0,0.7],[-45.4,-21.9]], {wh:5.6, roof:'gab', rise:2.8, ov:1.2}],
      [[[32.8,-36.7],[28.0,-9.4],[1.2,-14.2],[5.9,-41.4]], {wh:6.0, roof:'xs', rise:4.8}],
      [[[-23.9,-55.7],[-19.7,-55.1],[-25.7,-18.3],[-30.5,-19.5]], {wh:3.6, roof:'gab', rise:1.6, ov:0.9, orn:null}],
      [[[-30.5,-19.5],[-47.2,-22.5],[-40.6,-58.0],[-23.9,-55.7]], {wh:5.4, roof:'gab', rise:4.0}],
      [[[-40.6,-58.0],[-37.6,-77.6],[-17.9,-74.6],[-21.5,-55.1]], {wh:5.4, roof:'gab', rise:4.0}],
      [[[23.3,25.0],[28.6,-10.0],[32.2,-9.4],[26.8,25.6]], {wh:3.4, roof:'gab', rise:1.4, ov:0.8, orn:null}],
      [[[3.6,60.6],[5.3,43.4],[11.3,44.0],[9.5,61.2]], {wh:3.8, roof:'gab', rise:2.2, ov:1.0}],
      [[[5.9,-41.4],[10.7,-68.1],[37.0,-63.4],[32.8,-36.7]], {wh:7.5, roof:'dbl', rise:5.0, cl:3.0, sag:0.5}],
      [[[32.2,-2.9],[43.6,-67.5],[63.3,-64.6],[51.9,0.7]], {wh:7.0, roof:'xs', rise:5.6, ov:2.2, sag:0.7}]]) hall(P, Object.assign({y0:0.6, ov:1.8, sag:0.45}, o));
    // ---- the front court: single-storey corridors (U), the pai-lou mountain gate, the half-moon pond ----
    for (const P of [[[-38.2,19.1],[-33.5,20.2],[-37.6,44.0],[-43.6,48.7]], [[-43.6,48.7],[-37.6,44.0],[-6.6,49.3],[-3.0,55.8]], [[-6.6,49.3],[-2.4,25.6],[2.4,26.2],[-3.0,55.8]]]){
      const f = fitR(P, Math.abs(P[1][0] - P[0][0]) > Math.abs(P[1][1] - P[0][1]) ? AN : AN + HP);
      chHall(f, {M, yb:-4.5, y0:0.3, pm:0.2, wh:3.2, roof:'gab', rise:1.6, ov:0.8, lift:0, colStep:3.0}); }
    { const L = frameR(-22.3, 52.3, AN), y0 = 0.3;
      for (const u of [-6.2, -2.4, 2.4, 6.2]){ const p = L(u, 0, 0.8); boxP(B.p(GRAN), 1.1, 0.8, 1.1, p[0], y0, p[2], -AN); boxP(B.p(GRAN), 0.75, 8.2, 0.75, p[0], y0 + 0.8, p[2], -AN); }
      for (const [u0, u1, yb2, hh] of [[-2.4, 2.4, 7.4, 2.4], [-6.2, -2.4, 6.0, 1.9], [2.4, 6.2, 6.0, 1.9]]){ const p = L((u0 + u1)/2, 0, 0.8);
        boxP(B.p(BEAM), u1 - u0 + 0.8, 0.9, 0.9, p[0], yb2, p[2], -AN);
        roofP(B.p(TILE), p[0], p[2], (u1 - u0)/2 + 1.3, 1.6, (u1 - u0)/2 + 0.3, 0, yb2 + 0.9, hh*0.7, {ry:-AN, lift:0.6, pw:1.4, sag:0.35, fas:0.2, fo:B.p(BEAM), ridge:B.p(RIDGE), rr:0.2}); }
      for (const s of [-1, 1]) for (const t of [1, -1]){ const P = [[3.0, 0, 0], [3.5, 0.2, t*0.1], [3.9, 0.6, t*0.2], [4.1, 1.1, t*0.3]];
        for (let k = 0; k < P.length - 1; k++) segP(B.p(RIDGE), L(s*P[k][0], 7.4 + 0.9 + 1.68 + 0.35 + P[k][1], 0.8 + P[k][2]), L(s*P[k+1][0], 7.4 + 0.9 + 1.68 + 0.35 + P[k+1][1], 0.8 + P[k+1][2]), 0.16, 4); }
      // the two sutra pillars in the front court (the half-moon pond lies outside the gate, in the map)
      const Lp = frameR(-19.5, 38.0, AN);
      for (const u of [-11, 11]){ const p = Lp(u, 0, 0); latheP(B.p(GRAN), [[0.5, 0], [0.5, 0.3], [0.25, 0.5], [0.25, 2.6], [0.5, 2.8], [0.55, 3.4], [0.0, 3.9]], p[0], p[2], 8); }
    }
    // ---- lanterns under the eaves of the axis halls ----
    for (const P of [TWD, MAH]){ const f = fit(P), L = frameR(f.cx, f.cz, f.ang); for (const v of [f.b + 0.6]) for (let k = -4; k <= 4; k++){ if (Math.abs(k*3.4) > f.a) continue; const p = L(k*3.4, 0, v); latheP(B.p(LANT), [[0.05, 5.2], [0.3, 5.3], [0.36, 5.55], [0.3, 5.8], [0.05, 5.9]], p[0], p[2], 8); } }
    // ---- the Dragon Light Pagoda: seven storeys, octagonal, balconies, eaves, gilt crown ----
    { const cx = 31.9, cz = 46.1, ph = 0.2, base = 0.3;
      ngonP(B.p(GRAN), cx, cz, 8, ph, 7.4, -4.5, base + 1.2, true); parP(B.p(WHITE), ringPts(cx, cz, 7.4, 8, ph), base + 1.2, base + 2.0, 0.2);
      let y = base + 1.2, r = 4.8;
      const H = [4.0, 3.2, 3.0, 2.85, 2.7, 2.6, 2.5];
      for (let i = 0; i < 7; i++){ const h = H[i];
        ngonP(B.p(PSTONE), cx, cz, 8, ph, r, y, y + h);
        for (const p of ringPts(cx, cz, r + 0.02, 8, ph)) latheP(B.p(PSTONE), [[0.28, y], [0.24, y + h]], p[0], p[1], 6);
        for (let k = 0; k < 8; k++){ const a0 = ph + (k + 0.5)/8*TAU, ap = r*Math.cos(PI/8) + 0.03, Fq = fA(cx + Math.cos(a0)*ap, cz + Math.sin(a0)*ap, a0 + HP);
          if (k % 2 === 0) shapeP(B.p(WIN), mv(rArchO(Math.min(0.85, r*0.2), h*0.62), 0, y + h*0.12), Fq, 0); else { shapeP(B.p(RIDGE), rectO(-r*0.18, r*0.18, y + h*0.3, y + h*0.62), Fq, 0); } }
        // bracket band and the eave
        latheP(B.p(BEAM), [[r + 0.05, y + h - 0.5], [r + 0.4, y + h - 0.1]], cx, cz, 8, ph);
        polyRoofP(B.p(TILE), cx, cz, 8, ph, r + 1.9 - i*0.08, r - 0.1, y + h - 0.15, 1.05, {lift:0.65, pw:1.25, nt:2, sub:2, fas:0.25, fo:B.p(BEAM), hips:B.p(RIDGE), hr:0.1});
        y += h + 0.78;
        // balcony with a white railing on the eave
        const rn = r - 0.15; if (i < 6){ ngonP(B.p(WHITE), cx, cz, 8, ph, rn + 0.7, y - 0.05, y + 0.65); }
        r = r - 0.33;
      }
      // top roof and the gilt crown
      const yt = polyRoofP(B.p(TILE), cx, cz, 8, ph, r + 1.9, 0.3, y - 0.78, 2.8, {lift:0.8, pw:1.5, nt:4, sub:2, fas:0.25, fo:B.p(BEAM), hips:B.p(RIDGE), hr:0.12});
      latheP(B.p(GOLD), [[0.55, yt - 0.2], [0.75, yt + 0.4], [0.5, yt + 0.8], [0.62, yt + 1.2], [0.3, yt + 1.4], [0.36, yt + 1.7], [0.22, yt + 1.9], [0.3, yt + 2.1], [0.18, yt + 2.35], [0.26, yt + 2.55], [0.15, yt + 2.8], [0.22, yt + 3.0], [0.1, yt + 3.4], [0.32, yt + 3.7], [0.12, yt + 4.1], [0.03, yt + 5.0]], cx, cz, 10);
      for (let k = 0; k < 8; k++){ const a = ph + k/8*TAU; latheP(B.p(GOLD), [[0.12, base + 1.2 + H[0] + 0.5], [0.05, base + 1.2 + H[0] + 1.0]], cx + Math.cos(a)*(4.8 + 1.9)*1.03, cz + Math.sin(a)*(4.8 + 1.9)*1.03, 5); }
    }
    // ---- trees ----
    for (const [x, z] of [[-48,32],[16,36],[22,58],[-48,-70],[48,20],[58,-20],[-50,-40],[-8,-48]]){ const s = 0.8 + R()*0.5; segP(B.p(COL), [x, -0.3, z], [x, 3.2*s, z], 0.28*s, 5); LSph(g, 2.6*s, x, 4.4*s, z, LEAF, 0.85, 8); }
    B.flush(g); vFlush(g, V);
    return g;
  }};
SG_PLACES.push({type:'shuanglin', lat:1.330230, lon:103.857440, rot:0});
}
