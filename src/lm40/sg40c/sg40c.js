// ===== lm40/sg40c: Bras Basah, Bugis & Little India (City Brush lm40, real Singapore 1:1) =====
// One block; helpers inside. Only LANDMARKS, SG_PLACES and SITES are touched. All models use rot 0: local +x = east,
// +z = south; the plans are the real OSM footprints (ref_sg40c.json) relative to their area centroid.
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
const circ = (r, n) => { const P = []; for (let i = 0; i < (n || 16); i++){ const a = i/(n || 16)*PI*2; P.push([Math.cos(a)*r, Math.sin(a)*r]); } return P; };
const semi = (r, n) => { const P = [[r, 0]]; for (let i = 1; i < n; i++){ const a = PI*i/n; P.push([Math.cos(a)*r, Math.sin(a)*r]); } P.push([-r, 0]); return P; };
// local metres <-> world (for terrain sampling of spread-out models)
const W_X = lon => (lon - 103.845)*111290.5, W_Y = lat => (lat - 1.315)*110574;
// ---- sg40c helpers ----
const rngL = () => LMCTX.rng();
// Sutherland-Hodgman: polygon P clipped by the half plane a*x + b*z <= c
function clipH(P, a, b, c){ const out = []; for (let i = 0; i < P.length; i++){ const p = P[i], q = P[(i+1) % P.length], dp = a*p[0] + b*p[1] - c, dq = a*q[0] + b*q[1] - c;
  if (dp <= 0) out.push(p); if ((dp < 0) !== (dq < 0) && Math.abs(dp - dq) > 1e-9){ const t = dp/(dp - dq); out.push([p[0] + (q[0] - p[0])*t, p[1] + (q[1] - p[1])*t]); } } return out; }
// P clipped by the band s0 <= d.p <= s1, t0 <= n.p <= t1 (d, n unit vectors)
function clipST(P, d, n, s0, s1, t0, t1){ let Q = P; Q = clipH(Q, d[0], d[1], s1); Q = clipH(Q, -d[0], -d[1], -s0); Q = clipH(Q, n[0], n[1], t1); Q = clipH(Q, -n[0], -n[1], -t0); return Q; }
// windows: rectangles on every edge of plan P (outward offset w), storeys from y0 (fh tall), bays ~bay m, window fw x wh, sill
function winP(o, P, y0, nf, fh, bay, fw, wh, sill, w, minL){ for (const E of edgesF(P)){ if (E.L < (minL || 2.5)) continue; const n = Math.max(1, Math.round(E.L/bay)), ww = Math.min(fw, E.L/n - 0.4);
  for (let f = 0; f < nf; f++){ const v = y0 + f*fh + sill; for (let j = 0; j < n; j++){ const u = (j + 0.5)*E.L/n; shapeP(o, rectO(u - ww/2, u + ww/2, v, v + wh), E.F, w || 0.05); } } } }
// horizontal bands on every edge (spandrels, cornices): a slab between offsets 0..dw from y to y + h
function bandP(o, P, y, h, dw){ for (const E of edgesF(P)) slabP(o, rectO(-0.02, E.L + 0.02, y, y + h), E.F, 0, dw); }
// a frame turned by angle a: (u, v) plan coordinates -> (x, z)
const frm = a => { const c = Math.cos(a), s = Math.sin(a); return {X:(u, v) => [u*c - v*s, u*s + v*c], R:(u, y, v) => [u*c - v*s, y, u*s + v*c], rect:(u0, u1, v0, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(p => [p[0]*c - p[1]*s, p[0]*s + p[1]*c])}; };
// gable roof in frame Fr: ridge along u (u0..u1), eaves at v0, v1 (overhang ov), eave height y, rise h, slight sag of the slopes;
// the two gable-end triangles go to batch gw (wall colour) if given. along='v' turns it (ridge along v).
function gableR(o, Fr, u0, u1, v0, v1, y, h, ov, gw, along, sag){
  const R = along === 'v' ? (a, yy, b) => Fr.R(b, yy, a) : Fr.R; if (along === 'v'){ [u0, u1, v0, v1] = [v0, v1, u0, u1]; }
  const vm = (v0 + v1)/2, N = 3, sg = sag === undefined ? 0.12 : sag;
  const prof = []; for (let i = 0; i <= N; i++){ const t = i/N; prof.push([t, y + h*t - (i > 0 && i < N ? sg*h*Math.sin(PI*t) : 0)]); }
  for (const side of [-1, 1]){ const ve = side < 0 ? v0 - ov : v1 + ov;
    for (let i = 0; i < N; i++){ const [ta, ya] = prof[i], [tb, yb] = prof[i+1], va = ve + (vm - ve)*ta, vb = ve + (vm - ve)*tb, ya2 = ya - (i === 0 ? ov*h/((v1 - v0)/2) : 0);
      quadP(o, R(u0 - ov, ya2, va), R(u1 + ov, ya2, va), R(u1 + ov, yb, vb), R(u0 - ov, yb, vb)); } }
  if (gw) for (const u of [u0, u1]) triP(gw, R(u, y, v0), R(u, y, v1), R(u, y + h, vm));
}
// prism of a frame rectangle
const rectPrism = (o, Fr, u0, u1, v0, v1, y0, y1) => prismP(o, Fr.rect(u0, u1, v0, v1), y0, y1);
// generic storeyed block on plan P: walls, a band at each floor, windows (bay, width, height), parapet, roof cap
function blkP(B, P, y0, nf, fh, C, o){ o = o || {}; const yt = y0 + nf*fh;
  prismP(B.p(C.WALL), P, y0, yt, false); capP(B.p(C.ROOF || C.WALL), P, yt);
  for (let f = 1; f < nf; f++) if (C.BAND) bandP(B.p(C.BAND), P, y0 + f*fh - 0.3, 0.35, o.bd || 0.12);
  winP(B.p(C.WIN), P, y0 + (o.skip0 ? fh : 0), nf - (o.skip0 ? 1 : 0), fh, o.bay || 3.2, o.ww || 2.0, o.wh || fh*0.55, o.sill || fh*0.25, 0.05, 2.5);
  if (o.par !== false) parP(B.p(C.TRIM || C.WALL), P, yt, yt + (o.par || 1.0), 0.25);
  return yt; }
// ================= School of the Arts Singapore (WOHA, 2010), 1 Zubir Said Drive =================
// Verified: 56 m, 10 floors (skyscrapercenter); three long rectangular 6-storey blocks span the "Backdrop" podium (e-architect,
// gooood); podium holds concert hall / drama theatre / black box; faceted sculptural podium in off-form coloured concrete;
// living creeper screens on the facades ("inspired by a musical score"); breezeways between the blocks with facilities suspended
// between them; the roof is a park with a 400 m running track (gooood) and bridges at the highest roof level (architectureau);
// shops along an external covered walkway. Real footprint w107937797. Block orientation (parallel to Prinsep Street) and the
// exact podium height are estimates.
LANDMARKS.sgsota = {zh:'新加坡艺术学院', en:'School of the Arts Singapore', cat:'new', r:72, h:56,
  lt:{m:0, c:'#ffe7c4', k:0.45, e:0.4},
  build(){
    const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
    const P = [[-6.6,57.1],[-2.4,52.3],[-20.9,45.2],[-25.1,51.2],[-26.9,50.0],[-28.1,51.2],[-35.9,45.2],[-35.3,43.4],[-36.5,42.3],[-31.7,35.7],[-37.6,16.2],[-41.8,20.3],[-49.0,14.4],[-39.4,1.9],[-53.2,-30.7],[-2.4,-47.3],[5.3,-51.4],[17.9,-45.5],[61.5,-12.9],[1.2,63.6]];
    const M = {CON:'#a39b8f', CON2:'#8d8478', DECK:'#6f6a62', GLS:{c:'#2f3a3f', m:1, fh:5.4, cw:4.5}, SHOP:{c:'#3a4446', glow:'#ffd9a0', gk:0.9},
      GRN:'#4f7a38', GRN2:'#5f8f45', TRK:'#a8553e', WHT:'#d9d6cf', RAIL:'#5a5f60', ROOF:'#7f8a6a', DARK:'#3a3936'};
    const d = [-0.619, 0.785], n = [0.785, 0.619], ST = (s, t) => [s*d[0] + t*n[0], s*d[1] + t*n[1]];
    const YP = 23.5, FH = 5.4, YT = YP + 6*FH;           // podium top, storey height, block roof (= 55.9)
    // podium: ground floor set back behind columns (covered walkway), a faceted chamfer band, the upper podium on the full plan
    const P0 = offP(P, 2.6);
    prismP(B.p(M.CON2), P0, -5, 6.2, false);
    for (const E of edgesF(P0)){ if (E.L < 4) continue; const k = Math.max(1, Math.round(E.L/9));
      for (let j = 0; j < k; j++){ const u0 = (j + 0.12)*E.L/k, u1 = (j + 0.88)*E.L/k; shapeP(B.p(M.SHOP), rectO(u0, u1, 0.3, 4.6), E.F, 0.04); } }
    for (const [x, z] of alongP(P, 9)) boxP(B.p(M.CON), 0.8, 6.2, 0.8, x, 0, z);
    { const A = offP(P, 2.6), Bq = P, secs = [A.map(p => [p[0], 6.2, p[1]]), Bq.map(p => [p[0], 10.5, p[1]])];
      LLoft(g, secs, M.CON, false); }
    prismP(B.p(M.CON), P, 10.5, YP, false); capP(B.p(M.DECK), P, YP);
    // podium facade: long horizontal slots and a few faceted glazed openings
    for (const E of edgesF(P)){ if (E.L < 6) continue;
      shapeP(B.p(M.GLS), rectO(1, E.L - 1, 13.0, 14.6), E.F, 0.05); shapeP(B.p(M.GLS), rectO(1, E.L - 1, 18.4, 20.0), E.F, 0.05);
      slabP(B.p(M.CON2), rectO(0, E.L, YP - 0.2, YP + 1.1), E.F, 0, 0.25); }
    // three 6-storey blocks across the podium, parallel to Prinsep Street; breezeways between them
    const PI_ = offP(P, 1.5), BL = [[21.5, 39.5, -46, 46], [-5, 13, -46, 46], [-31.5, -13.5, -46, 46]], BP = [];
    for (const [t0, t1, s0, s1] of BL){
      const Q = clipST(PI_, d, n, s0, s1, t0, t1); if (Q.length < 3) continue; BP.push(Q);
      prismP(B.p(M.CON), Q, YP, YT, false);
      for (const E of edgesF(Q)){ if (E.L < 3) continue; const k = Math.max(1, Math.round(E.L/4.5));
        for (let f = 0; f < 6; f++){ const v = YP + f*FH; slabP(B.p(M.WHT), rectO(0, E.L, v, v + 0.5), E.F, 0, 0.35);
          for (let j = 0; j < k; j++){ const u = (j + 0.5)*E.L/k; shapeP(B.p(M.GLS), rectO(u - E.L/k/2 + 0.25, u + E.L/k/2 - 0.25, v + 0.9, v + 4.6), E.F, 0.06); } }
        // creeper screens: vertical green strips of varying height and width, like the bars of a score
        if (E.L > 15){ let u = 1.5; while (u < E.L - 2){ const w = 0.8 + R()*2.4, v0 = YP + 0.5 + Math.floor(R()*3)*FH, v1 = Math.min(YT - 0.4, v0 + FH*(1.5 + R()*3.5));
          if (R() < 0.72) slabP(B.p(R() < 0.5 ? M.GRN : M.GRN2), rectO(u, Math.min(E.L - 1, u + w), v0, v1), E.F, 0.7, 1.05);
          u += w + 0.6 + R()*2.2; } } }
      // roof: parapet, roof garden, the running track lane round the edge
      parP(B.p(M.RAIL), Q, YT, YT + 1.1, 0.25);
      const Q1 = offP(Q, 1.0), Q2 = offP(Q, 4.2);
      prismP(B.p(M.TRK), Q1, YT, YT + 0.12, false); prismP(B.p(M.ROOF), Q2, YT, YT + 0.2, false);
      for (const E of edgesF(Q2)){ if (E.L < 12) continue; const k = Math.floor(E.L/12); for (let j = 0; j < k; j++){ const p = E.F((j + 0.5)*E.L/k, 0, -2.5); LCyl(g, 0.25, 0.3, 3, p[0], YT, p[2], '#5b4a3a', 5); LSph(g, 2.4, p[0], YT + 4, p[2], M.GRN2, 0.8, 7); } }
    }
    // bridges at the top roof level link the blocks (the track crosses them) + suspended volumes in the breezeways
    for (const s of [-34, 0, 30]) for (let i = 0; i < 2; i++){ const ta = BL[i][2 - 2] , tb = BL[i+1][1];
      const t0 = BL[i+1][1] - 0.5, t1 = BL[i][0] + 0.5, a = ST(s - 3, t0), b = ST(s + 3, t0), c = ST(s + 3, t1), e = ST(s - 3, t1);
      prismP(B.p(M.CON), [a, b, c, e], YT - 1.2, YT, true); prismP(B.p(M.TRK), [a, b, c, e], YT, YT + 0.12, false);
      for (const sg of [-3, 3]){ const p = ST(s + sg, t0), q = ST(s + sg, t1); segP(B.p(M.RAIL), [p[0], YT + 1.1, p[1]], [q[0], YT + 1.1, q[1]], 0.06, 4); } }
    for (const [i, s, f0, nf] of [[0, -18, 2, 2], [0, 22, 1, 2], [1, -10, 3, 2], [1, 24, 1, 1]]){
      const t0 = BL[i+1][1] - 0.3, t1 = BL[i][0] + 0.3, Q = [ST(s - 9, t0), ST(s + 9, t0), ST(s + 9, t1), ST(s - 9, t1)];
      prismP(B.p(M.CON2), Q, YP + f0*FH, YP + (f0 + nf)*FH, true);
      for (const E of edgesF(Q)) if (E.L > 10) shapeP(B.p(M.GLS), rectO(1, E.L - 1, YP + f0*FH + 1, YP + (f0 + nf)*FH - 0.8), E.F, 0.05); }
    // podium roof decks in the breezeways are planted
    for (const Q of [clipST(offP(P, 3), d, n, -46, 46, 13.5, 21), clipST(offP(P, 3), d, n, -46, 46, -13, -5.5)]) if (Q.length > 2) prismP(B.p(M.GRN), Q, YP, YP + 0.3, false);
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'sgsota', lat:1.299372, lon:103.848739, rot:0});
// ================= House of Tan Yeok Nee (1882-85, national monument), 101 Penang Road =================
// Verified: Teochew mansion in the sidianjin configuration with four double-pitched gable ends; halls symmetric along a central
// axis with side courtyards; front and back face east and west; single storey (a two-storey wing part from 1906); walls repainted
// yellow in the 2000 restoration; marble pillars at the front door; almost straight roof ridges, very colourful ornamented roofs
// (porcelain-inlay figures). Plan: the four real footprints r8409861 + w602071817/18/19 (the data maps the wings and halls as
// separate pieces; their 15 m data heights are wrong). Hall heights, roof tile colour and courtyard positions are estimates.
LANDMARKS.sgtanyeoknee = {zh:'陈旭年宅第', en:'House of Tan Yeok Nee', cat:'old', r:40, h:10,
  lt:{m:0, c:'#ffe2b0', k:0.55, e:0.6, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), V = mkV(), Fr = frm(-17*PI/180);
    const M = {WALL:'#d8b45c', WALL2:'#cfa64e', TILE:'#5e625c', RIDGE:'#e6e0d0', STONE:'#b8b3a8', COURT:'#a7a39a', DOOR:'#3b2a20', MARB:'#ece8de', WIN:'#2d2a26', TRIM:'#f1ecdf', RED:'#8e2e22'};
    // compound: plinth over the real pieces (frame u = ENE along the axis, v = SSE)
    const PIECES = [[[9.3,-13.4],[8.7,-16.3],[-30.1,-5.1],[-31.9,-11.6],[10.5,-24.6],[15.9,-27.0],[18.9,-24.0],[18.9,-20.5],[21.2,-21.1],[28.4,0.9],[0.9,9.2],[-3.8,-9.8]],
      [[-30.7,-2.1],[-11.0,-7.4],[-5.6,12.7],[-24.7,18.1]], [[0.3,14.5],[2.7,13.9],[0.9,9.2],[28.4,0.9],[31.4,11.0],[2.1,19.9]], [[2.7,13.9],[0.3,14.5],[2.1,19.9],[-20.6,25.8],[-22.3,19.3],[2.1,12.1]]];
    for (const Q of PIECES) prismP(B.p(M.STONE), Q, -5, 0.7, false);
    const WH = 4.6, Y0 = 0.7;
    // halls across the axis (ridge along v) and the two side wings (ridge along u); [u0,u1,v0,v1, eave, rise, ridge dir]
    const HALLS = [[17.5, 26.6, -13.4, 9.0, WH, 3.6, 'v'], [-1.6, 9.5, -13.4, 9.0, WH + 0.6, 4.2, 'v'], [-28.6, -17.5, -10.8, 10.2, WH, 3.4, 'v'],
      [-27.0, 26.6, -20.3, -13.4, WH - 0.5, 2.6, 'u'], [-27.0, 26.6, 10.0, 19.5, WH - 0.5, 3.0, 'u'], [-17.5, -8.6, -10.8, -6.0, WH - 0.8, 1.6, 'u'], [-17.5, -8.6, 5.4, 10.2, WH - 0.8, 1.6, 'u']];
    for (const [u0, u1, v0, v1, eh, rh, al] of HALLS){
      rectPrism(B.p(M.WALL), Fr, u0, u1, v0, v1, Y0, Y0 + eh);
      bandP(B.p(M.TRIM), Fr.rect(u0, u1, v0, v1), Y0 + eh - 0.5, 0.5, 0.12);
      gableR(B.p(M.TILE), Fr, u0, u1, v0, v1, Y0 + eh, rh, 0.6, B.p(M.WALL2), al, 0.05);
      // ridge roll with swept ends and colourful porcelain figures on it
      const ry = Y0 + eh + rh; const [a0, a1, b] = al === 'v' ? [v0, v1, (u0 + u1)/2] : [u0, u1, (v0 + v1)/2];
      const RP = (a, y) => al === 'v' ? Fr.R(b, y, a) : Fr.R(a, y, b);
      segP(B.p(M.RIDGE), RP(a0 - 0.7, ry + 0.15), RP(a1 + 0.7, ry + 0.15), 0.28, 4);
      for (const a of [a0 - 0.7, a1 + 0.7]){ const p = RP(a, ry + 0.15), q = RP(a + (a < (a0 + a1)/2 ? -0.6 : 0.6), ry + 0.9); segP(B.p(M.RIDGE), p, q, 0.22, 4); }
      const nfig = Math.max(2, Math.round((a1 - a0)/3.5));
      for (let j = 1; j < nfig; j++){ const p = RP(a0 + (a1 - a0)*j/nfig, ry + 0.4); const cols = ['#2f7d4f', '#d2a23a', '#b8432f', '#3a6fb0', '#e7d9b8'];
        vAdd(V, cols[j % 5], t => boxP(t, 0.5, 0.55 + 0.25*(j % 2), 0.5, p[0], ry + 0.35, p[2])); }
    }
    // gable-end walls (the four double-pitched gables seen at the corners): raised wall heads with a curved coping
    for (const [u, v0, v1] of [[26.6, -20.3, -13.4], [26.6, 10.0, 19.5], [-27.0, -20.3, -13.4], [-27.0, 10.0, 19.5]]){
      const vm = (v0 + v1)/2, hw = (v1 - v0)/2 + 0.2, F = (uu, vv, w) => Fr.R(u + (u > 0 ? 1 : -1)*(w || 0), vv, vm + (u > 0 ? -1 : 1)*uu);
      const O = []; for (let i = 0; i <= 10; i++){ const t = -1 + 2*i/10; O.push([t*hw, Y0 + 4.3 + 2.6*(1 - t*t) + 0.4*Math.cos(PI*t*2.5)*(1 - Math.abs(t))]); }
      slabP(B.p(M.WALL2), [[-hw, Y0], [hw, Y0], ...O.reverse()], F, 0, 0.35);
      slabP(B.p(M.TRIM), O.map(p => [p[0], p[1] + 0.25]).concat(O.slice().reverse().map(p => [p[0], p[1] - 0.05])), F, 0.3, 0.42); }
    // courtyards between the halls (granite paving) and the lane between the rear block and the main hall
    for (const [u0, u1, v0, v1] of [[9.5, 17.5, -13.4, 9.0], [-8.6, -1.6, -10.8, 10.0], [-17.5, -8.6, -6.0, 5.4]]) rectPrism(B.p(M.COURT), Fr, u0, u1, v0, v1, Y0, Y0 + 0.05);
    // front (east) facade: central doorway between marble pillars, timber doors, side windows with grilles
    { const F = (uu, vv, w) => Fr.R(26.6 + (w || 0), vv, -uu); // u along the facade (north -> south is -v), w outwards (east)
      const vc = -2.2;
      slabP(B.p(M.TRIM), rectO(-vc - 2.4, -vc + 2.4, Y0, Y0 + 3.9), F, 0, 0.1);
      shapeP(B.p(M.DOOR), rectO(-vc - 1.3, -vc + 1.3, Y0, Y0 + 3.3), F, 0.12);
      for (const s of [-1, 1]){ const p = Fr.R(27.6, 0, vc + s*1.9); LCyl(g, 0.22, 0.24, WH - 0.2, p[0], Y0, p[2], M.MARB, 8); }
      for (const s of [-1, 1]) for (const k of [5.2, 8.6]){ const uu = -vc + s*k; shapeP(B.p(M.WIN), rectO(uu - 0.7, uu + 0.7, Y0 + 1.2, Y0 + 2.8), F, 0.08);
        for (let i = 0; i < 4; i++) shapeP(B.p(M.TRIM), rectO(uu - 0.7 + 0.28 + i*0.28, uu - 0.7 + 0.36 + i*0.28, Y0 + 1.2, Y0 + 2.8), F, 0.11); }
      // stone steps up to the platform
      rectPrism(B.p(M.STONE), Fr, 26.6, 28.6, vc - 2.6, vc + 2.6, 0, 0.35); }
    // side and wing windows (small, timber-shuttered)
    winP(B.p(M.WIN), Fr.rect(-27.0, 26.6, -20.3, -13.4), Y0, 1, 4, 4.5, 1.0, 1.4, 1.2, 0.05, 5);
    winP(B.p(M.WIN), Fr.rect(-27.0, 26.6, 10.0, 19.5), Y0, 1, 4, 4.5, 1.0, 1.4, 1.2, 0.05, 5);
    B.flush(g); vFlush(g, V); return g;
  }};
SG_PLACES.push({type:'sgtanyeoknee', lat:1.298649, lon:103.843247, rot:0});
// ================= Indian Heritage Centre (2015, Robert Greg Shand Architects + URBNarc), 5 Campbell Lane =================
// Verified: four storeys on a tight triangular site (wallpaper*); transparent facade on Campbell Lane whose externalised
// criss-crossing double-flight stairs follow the Chand Baori stepwell (a 3-D jali), a large colourful mural on the gallery
// wall behind it, steel-framed curtain wall, palette of concrete, granite, glass, steel (theplan.it); lit at night. Real
// footprint w176326997; its SW edge is the pedestrian Campbell Lane. Overall height (19.5 m) is an estimate.
LANDMARKS.sgihc = {zh:'印度传统文化馆', en:'Indian Heritage Centre', cat:'new', r:35, h:19.5,
  lt:{m:0, c:'#ffdcb0', k:0.55, e:0.7},
  build(){
    const g = new THREE.Group(), B = mkB(), V = mkV(), R = LMCTX.rng;
    const P = [[-10.6,-8.1],[32.3,-6.3],[7.9,15.7],[4.3,16.3],[-32.1,-8.1],[-28.0,-14.0]];
    const M = {BODY:'#cbc6bd', GRAN:'#77736d', GLS:{c:'#a8c3c6', op:0.32, ds:true}, STEEL:'#2f3437', STAIR:'#d9d4ca', LED:{c:'#f4e3c4', glow:'#ffd38a', gk:1.4},
      WIN:{c:'#39434a', m:1, fh:4.6, cw:3}, ROOF:'#8c8780'};
    const H = 19.5, FH = 4.6, D = [4.3, 16.3], E = [-32.1, -8.1];
    const L = Math.hypot(E[0] - D[0], E[1] - D[1]), ex = (E[0] - D[0])/L, ez = (E[1] - D[1])/L;
    // outward normal of the Campbell Lane edge (points SW, away from the centroid)
    let nx = ez, nz = -ex; if (nx*(0 - D[0]) + nz*(0 - D[1]) > 0){ nx = -nx; nz = -nz; }
    const c0 = nx*D[0] + nz*D[1], DEP = 4.2;
    const body = clipH(P, nx, nz, c0 - DEP);
    prismP(B.p(M.GRAN), P, -5, 0.6, false);
    prismP(B.p(M.BODY), body, 0.6, H, false); capP(B.p(M.ROOF), body, H);
    parP(B.p(M.BODY), body, H, H + 1.0, 0.3);
    // the double-skin zone: floor slabs at each level, the stepwell stairs, the curtain wall
    const zone = clipH(P, -nx, -nz, -(c0 - DEP));
    for (let f = 1; f <= 4; f++) prismP(B.p(M.STAIR), offP(zone, 0.05), f*FH - 0.35, f*FH, true);
    prismP(B.p(M.STAIR), zone, 0.6, 0.8, false);
    // stair flights: on each level, pairs of opposed flights crossing in an X between landings (Chand Baori pattern)
    const FA = (u, y, w) => [D[0] + ex*u - nx*w, y, D[1] + ez*u - nz*w];   // u along the lane from the south tip, w = depth in from the glass
    const nb = 6, bw = (L - 4)/nb;
    for (let f = 0; f < 4; f++){ const y0 = f*FH + 0.8, y1 = (f + 1)*FH - 0.35;
      for (let j = 0; j < nb; j++){ const u0 = 2 + j*bw, u1 = u0 + bw, w = j % 2 ? 1.4 : 2.8;
        for (const [ua, ub] of [[u0, u1], [u1, u0]]){
          const p0 = FA(ua, y0, w), p1 = FA(ub, y1, w), q0 = FA(ua, y0, w + 1.2), q1 = FA(ub, y1, w + 1.2);
          quadP(B.p(M.STAIR), p0, p1, q1, q0);
          const k = 9; for (let s = 0; s < k; s++){ const t = s/k, a = FA(ua + (ub - ua)*t, y0 + (y1 - y0)*t, w), b2 = FA(ua + (ub - ua)*t, y0 + (y1 - y0)*t, w + 1.2), a2 = FA(ua + (ub - ua)*t, y0 + (y1 - y0)*(t + 1/k), w), b3 = FA(ua + (ub - ua)*t, y0 + (y1 - y0)*(t + 1/k), w + 1.2); quadP(B.p(M.STAIR), a, b2, b3, a2); }
          segP(B.p(M.LED), FA(ua, y0 + 1.0, w - 0.05), FA(ub, y1 + 1.0, w - 0.05), 0.05, 3); } } }
    // the mural on the gallery wall behind the stairs: an abstract collage of colour fields (no text, no figures)
    { const COL = ['#e2457a', '#f39a2b', '#2fb3a8', '#f2d23c', '#7b4fb8', '#3f7fd0', '#e86a3a', '#5dbb5a', '#c93a3a', '#f5efe2'];
      const FW = (u, v, w) => [D[0] + ex*u - nx*(DEP - (w || 0)), v, D[1] + ez*u - nz*(DEP - (w || 0))];
      for (let u = 0.5; u < L - 0.5; ){ const w = 1.2 + R()*3.2; for (let v = 0.8; v < H - 0.5; ){ const h = 1.0 + R()*3.4;
          vAdd(V, COL[Math.floor(R()*COL.length)], t => shapeP(t, rectO(u, Math.min(L - 0.5, u + w), v, Math.min(H - 0.3, v + h)), FW, 0.06)); v += h; } u += w; } }
    // steel-framed curtain wall on the lane: glass plane, mullion grid echoing the stairs, bracing diagonals
    { const Fg = (u, v, w) => [D[0] + ex*u + nx*(w || 0), v, D[1] + ez*u + nz*(w || 0)];
      shapeP(B.p(M.GLS), rectO(0.2, L - 0.2, 0.6, H + 0.6), Fg, 0);
      for (let u = 0.2; u <= L; u += L/12) segP(B.p(M.STEEL), Fg(u, 0.6, 0.05), Fg(u, H + 0.6, 0.05), 0.09, 4);
      for (let f = 0; f <= 4; f++) segP(B.p(M.STEEL), Fg(0.2, f*FH + 0.6, 0.06), Fg(L - 0.2, f*FH + 0.6, 0.06), 0.11, 4);
      for (let f = 0; f < 4; f++) for (let j = 0; j < 6; j++){ const ua = 0.2 + j*(L - 0.4)/6, ub = ua + (L - 0.4)/6;
        segP(B.p(M.STEEL), Fg(ua, f*FH + 0.6, 0.08), Fg(ub, (f + 1)*FH + 0.6, 0.08), 0.05, 3); segP(B.p(M.STEEL), Fg(ub, f*FH + 0.6, 0.08), Fg(ua, (f + 1)*FH + 0.6, 0.08), 0.05, 3); } }
    // the other faces: granite base course, narrow slot windows; open lobby at the south tip
    for (const E2 of edgesF(body)){ if (E2.L < 3) continue; slabP(B.p(M.GRAN), rectO(0, E2.L, 0.6, 1.4), E2.F, 0, 0.08);
      const k = Math.max(1, Math.round(E2.L/6)); for (let f = 1; f < 4; f++) for (let j = 0; j < k; j++){ const u = (j + 0.5)*E2.L/k; shapeP(B.p(M.WIN), rectO(u - 0.5, u + 0.5, f*FH + 1.4, f*FH + 3.8), E2.F, 0.05); } }
    B.flush(g); vFlush(g, V, {glow:'#ffffff', gk:0.35}); return g;
  }};
SG_PLACES.push({type:'sgihc', lat:1.305669, lon:103.852289, rot:0});
// ================= Masjid Malabar (A. H. Siddique; built 1956-62, opened 1963), 471 Victoria Street =================
// Verified: Indo-Saracenic reinforced-concrete mosque at the corner of Victoria Street and Jalan Sultan, dramatising the corner with
// domes, projecting balconies, parapets and chatris (URA); golden onion domes - a big central one, a smaller one on a platform over
// the south-eastern section, an octagonal minaret to the right of the main dome capped by a smaller dome, each with a crescent and
// star (Wikipedia / Infopedia); facade covered in blue and white tiles (retiled 1995); prayer hall on the first floor with verandahs
// on three sides; external staircases between the levels; windows with interlocking-coin latticework. Real footprint w531916524.
// Heights (parapet 12 m, main dome 25 m, minaret 29 m) and the tile grid are estimates.
LANDMARKS.sgmalabar = {zh:'马拉巴回教堂', en:'Masjid Malabar', cat:'old', r:35, h:29,
  lt:{m:0, c:'#fff1d6', k:0.85, e:0.6},
  build(){
    const g = new THREE.Group(), B = mkB(), Fr = frm(-38.3*PI/180);
    const P = [[19.8,-3.0],[19.8,1.1],[-6.5,21.9],[-21.4,2.3],[-12.5,-4.2],[-11.9,-8.9],[-7.1,-14.3],[0.6,-13.1],[0.6,-17.2],[5.4,-23.2]];
    const M = {BLUE:'#2350a0', BLUE2:'#1c4189', WHITE:'#eef0f2', GOLD:{c:'#d9a93a', lc:'#ffe09a', lk:1.1}, DARK:'#1d2430', WIN:'#22262c', BASE:'#8f9399', LAMP:{c:'#fff3d0', glow:'#ffe4a8', gk:1.2}, GRN:'#2e7a4a'};
    const Y1 = 4.6, Y2 = 12.0;
    prismP(B.p(M.BASE), P, -5, 0.6, false);
    prismP(B.p(M.BLUE), P, 0.6, Y2, false); capP(B.p(M.BLUE2), P, Y2);
    // white tile grid on the blue walls (every ~1.2 m), cornices, the parapet
    for (const E of edgesF(P)){ if (E.L < 1.5) continue; const nu = Math.max(1, Math.round(E.L/1.2));
      for (let j = 1; j < nu; j++){ const u = j*E.L/nu; shapeP(B.p(M.WHITE), rectO(u - 0.04, u + 0.04, 0.6, Y2), E.F, 0.02); }
      for (let v = 1.8; v < Y2; v += 1.2) shapeP(B.p(M.WHITE), rectO(0, E.L, v - 0.04, v + 0.04), E.F, 0.02);
      slabP(B.p(M.WHITE), rectO(-0.05, E.L + 0.05, Y1 - 0.2, Y1 + 0.3), E.F, 0, 0.35);
      slabP(B.p(M.WHITE), rectO(-0.05, E.L + 0.05, Y2 - 0.1, Y2 + 0.45), E.F, 0, 0.5); }
    parP(B.p(M.BLUE), P, Y2, Y2 + 1.3, 0.35); bandP(B.p(M.WHITE), offP(P, -0.05), Y2 + 1.3, 0.2, 0.1);
    // ground floor: rectangular windows with lattice infill; first floor: verandah arcades of pointed arches on three sides
    for (const E of edgesF(P)){ if (E.L < 5) continue; const k = Math.max(1, Math.round(E.L/3.4));
      for (let j = 0; j < k; j++){ const u = (j + 0.5)*E.L/k;
        shapeP(B.p(M.WIN), rectO(u - 0.7, u + 0.7, 1.4, 3.6), E.F, 0.06);
        for (let i = 0; i < 4; i++) shapeP(B.p(M.WHITE), rectO(u - 0.7, u + 0.7, 1.5 + i*0.55, 1.58 + i*0.55), E.F, 0.08);
        shapeP(B.p(M.DARK), mv(pArchO(1.05, 5.6, 5), u, Y1 + 0.8), E.F, 0.06);
        slabP(B.p(M.WHITE), mv(pArchO(1.3, 6.0, 5), u, Y1 + 0.6).concat(), E.F, 0.0, 0.04);
        shapeP(B.p(M.DARK), mv(pArchO(1.05, 5.6, 5), u, Y1 + 0.8), E.F, 0.07);
        { const q = E.F(j*E.L/k + 0.01, 0, 0.15); if (j > 0) boxP(B.p(M.WHITE), 0.45, 6.6, 0.45, q[0], Y1 + 0.3, q[2], -E.ang); } } }
    // projecting balconies on the two street fronts (Victoria Street SE, Jalan Sultan NE)
    for (const [u0, u1, v, s] of [[-12, -4, 13.2, 1], [4, 12, 13.2, 1]]){ const Q = Fr.rect(u0, u1, v, v + 1.4*s); prismP(B.p(M.WHITE), Q, Y1 + 0.3, Y1 + 0.7, true); parP(B.p(M.WHITE), Q, Y1 + 0.7, Y1 + 1.8, 0.15); }
    // chatris at the parapet corners: four slender columns and a small golden dome
    const chat = (u, v, r) => { const c = Fr.X(u, v); for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) LBox(g, 0.25, 2.2, 0.25, c[0] + a*r*0.7, Y2 + 1.3, c[1] + b*r*0.7, M.WHITE);
      LCyl(g, r, r, 0.3, c[0], Y2 + 3.5, c[1], M.WHITE, 8); LLathe(g, onion(r*0.85).map(p => [p[0], p[1]]), c[0], Y2 + 3.8, c[1], M.GOLD, 10); }
    for (const [u, v] of [[-17.5, 12.0], [-17.5, -10.5], [0, 12.5], [-6, -13.5]]) chat(u, v, 0.9);
    // main dome: blue-tiled drum with arched lights, golden onion dome, crescent and star
    const C0 = Fr.X(-1.5, -0.5);
    LCyl(g, 5.2, 5.4, 1.0, C0[0], Y2, C0[1], M.WHITE, 16);
    LCyl(g, 4.6, 4.6, 3.6, C0[0], Y2 + 1.0, C0[1], M.BLUE, 16);
    for (let i = 0; i < 12; i++){ const a = i/12*TAU, F = fA(C0[0] + Math.cos(a)*4.62, C0[1] + Math.sin(a)*4.62, a + HP); shapeP(B.p(M.DARK), pArchO(0.45, 2.2, 4).map(p => [p[0], p[1] + Y2 + 1.6]), F, 0); }
    LCyl(g, 4.9, 4.9, 0.4, C0[0], Y2 + 4.6, C0[1], M.WHITE, 16);
    LLathe(g, onion(4.0), C0[0], Y2 + 5.0, C0[1], M.GOLD, 24);
    const fin = (x, y, z, s) => { LCyl(g, 0.08*s, 0.12*s, 1.6*s, x, y, z, M.GOLD, 6); LSph(g, 0.22*s, x, y + 1.0*s, z, M.GOLD, 1, 8);
      LShape(g, CRES.map(p => [p[0]*s, p[1]*s]), 0.1, x, y + 1.9*s, z, M.GOLD); }
    fin(C0[0], Y2 + 5.0 + 9.4, C0[1], 1.3);
    // smaller dome on a platform over the south-eastern section (left of the main dome seen from Victoria Street)
    const C1 = Fr.X(-12, 7.5);
    LBox(g, 6, 1.6, 6, C1[0], Y2, C1[1], M.BLUE, 38.3*PI/180); LBox(g, 6.4, 0.3, 6.4, C1[0], Y2 + 1.6, C1[1], M.WHITE, 38.3*PI/180);
    LCyl(g, 2.3, 2.3, 1.4, C1[0], Y2 + 1.9, C1[1], M.BLUE, 12);
    LLathe(g, onion(2.1), C1[0], Y2 + 3.3, C1[1], M.GOLD, 16); fin(C1[0], Y2 + 3.3 + 4.9, C1[1], 0.8);
    // octagonal minaret to the right of the main dome, at the street corner: tiered shaft, balconies, golden cap
    const C2 = Fr.X(13.5, 9.0);
    const oct = (r, y0, h, col) => LCyl(g, r, r, h, C2[0], y0, C2[1], col, 8);
    oct(2.2, 0.6, Y2 + 1.3 - 0.6, M.BLUE); oct(2.5, Y2 + 1.3, 0.4, M.WHITE);
    oct(1.75, Y2 + 1.7, 6.0, M.BLUE); oct(2.3, Y2 + 7.7, 0.35, M.WHITE);
    for (let i = 0; i < 8; i++){ const a = i/8*TAU + PI/8; LBox(g, 0.2, 1.0, 0.2, C2[0] + Math.cos(a)*2.15, Y2 + 8.05, C2[1] + Math.sin(a)*2.15, M.WHITE); }
    oct(2.3, Y2 + 9.05, 0.25, M.WHITE);
    oct(1.35, Y2 + 9.3, 3.4, M.BLUE);
    for (let i = 0; i < 8; i++){ const a = i/8*TAU + PI/8, F = fA(C2[0] + Math.cos(a)*1.3, C2[1] + Math.sin(a)*1.3, a + HP); shapeP(B.p(M.DARK), pArchO(0.3, 1.8, 4).map(p => [p[0], p[1] + Y2 + 10.0]), F, 0.02); }
    oct(1.6, Y2 + 12.7, 0.3, M.WHITE);
    LLathe(g, onion(1.45), C2[0], Y2 + 13.0, C2[1], M.GOLD, 12); fin(C2[0], Y2 + 13.0 + 3.4, C2[1], 0.65);
    // external staircase up to the first floor on the Victoria Street front
    { for (let i = 0; i < 12; i++){ const u = 2 - i*0.55; rectPrism(B.p(M.WHITE), Fr, u - 0.55, u, 13.3, 15.6, 0.6, 0.6 + (i + 1)*Y1/12); } parP(B.p(M.WHITE), Fr.rect(-4.6, 2, 13.3, 15.6), 0.6, 1.4, 0.1); }
    // lamps along the parapet for the night look
    for (const [x, z] of alongP(P, 4)) boxP(B.p(M.LAMP), 0.25, 0.35, 0.25, x, Y2 + 1.5, z);
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'sgmalabar', lat:1.305114, lon:103.859789, rot:0});
// ================= Sakya Muni Buddha Gaya Temple (founded 1927 by the Thai monk Vutthisara), 366 Race Course Road =================
// Verified: the "Temple of 1,000 Lights", the 15 m, ~300 t Buddha inside surrounded by lights (roots.gov.sg); a chedi (stupa)
// style roofline (Frommer's); a bulbous dome with a spire rising behind it (Travelfish); two guardian figures. Footprint: the hall
// is taken as w454182411 (the POIs sit on it and on w455155911 beside it; neither is named in the data) - anchor uncertain.
// Wall and roof colours, the roof tiers and all heights (walls 11 m, dome 24 m, spire 31 m) are estimates.
LANDMARKS.sgsakyamuni = {zh:'释迦牟尼菩提迦耶寺（千灯寺）', en:'Sakya Muni Buddha Gaya Temple', cat:'old', r:35, h:31,
  lt:{m:0, c:'#ffe6b8', k:0.6, e:0.5, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), Fr = frm(-50.2*PI/180);
    const P1 = [[18.1,-1.6],[6.7,12.0],[-14.2,-5.1],[-2.8,-18.8]], P2 = [[3.7,9.7],[-4.0,18.6],[-14.8,9.7],[-7.0,0.2]];
    const M = {WALL:'#efe3c2', WALL2:'#e2d2a8', TRIM:'#f7f1e1', ROOF:'#b5462e', ROOF2:'#2f6e4a', GOLD:{c:'#d8aa3c', lc:'#ffe3a0', lk:1.2}, DARK:'#2b2622', BASE:'#9d968a', LAMP:{c:'#fff1cc', glow:'#ffd890', gk:1.3}, RED:'#9c2a22'};
    // hall (u = along Race Course Road -5..12.7, v = depth, road at v = -14.2) and the annex beside it
    prismP(B.p(M.BASE), P1, -5, 0.8, false); prismP(B.p(M.BASE), P2, -5, 0.6, false);
    const U0 = -5.0, U1 = 12.7, V0 = -14.2, V1 = 12.9, YW = 11;
    rectPrism(B.p(M.WALL), Fr, U0, U1, V0, V1, 0.8, YW);
    bandP(B.p(M.TRIM), Fr.rect(U0, U1, V0, V1), YW - 0.6, 0.6, 0.2);
    prismP(B.p(M.WALL2), P2, 0.6, 8.2, false); capP(B.p(M.TRIM), P2, 8.2); parP(B.p(M.TRIM), P2, 8.2, 9.0, 0.2);
    winP(B.p(M.DARK), P2, 0.6, 2, 3.8, 3.5, 1.2, 2.0, 1.0, 0.05, 4);
    // two-tier roof over the hall, steep and swept up at the eaves, green border tiles
    const cu = (U0 + U1)/2, cv = (V0 + V1)/2, cxz = Fr.X(cu, cv), ry = 50.2*PI/180;
    roofP(B.p(M.ROOF), cxz[0], cxz[1], (U1 - U0)/2 + 1.2, (V1 - V0)/2 + 1.2, (U1 - U0)/2 - 2.5, (V1 - V0)/2 - 3.5, YW, 3.2, {ry:ry, pw:1.3, lift:0.7, fas:0.5, fo:B.p(M.ROOF2), n:4});
    rectPrism(B.p(M.WALL), Fr, U0 + 2.6, U1 - 2.6, V0 + 3.6, V1 - 3.6, YW + 3.0, YW + 5.0);
    roofP(B.p(M.ROOF), cxz[0], cxz[1], (U1 - U0)/2 - 1.6, (V1 - V0)/2 - 2.6, 1.2, (V1 - V0)/2 - 8, YW + 5.0, 3.6, {ry:ry, pw:1.25, lift:0.6, fas:0.4, fo:B.p(M.ROOF2), n:4});
    // the chedi: square base, bell-shaped (bulbous) dome, rings, and the spire behind it
    const C0 = Fr.X(cu, V0 + 9);
    LBox(g, 5.2, 1.2, 5.2, C0[0], YW + 7.5, C0[1], M.TRIM, -ry + PI/4*0);
    LLathe(g, [[2.6, 0], [2.9, 0.4], [3.1, 1.6], [2.8, 3.0], [2.2, 4.0], [1.3, 4.6], [0.8, 4.9]], C0[0], YW + 8.7, C0[1], M.GOLD, 20);
    for (let i = 0; i < 6; i++) LCyl(g, 0.8 - i*0.1, 0.85 - i*0.1, 0.32, C0[0], YW + 13.6 + i*0.34, C0[1], M.GOLD, 12);
    LCone(g, 0.45, 3.0, C0[0], YW + 15.6, C0[1], M.GOLD, 10);
    const C1 = Fr.X(cu, V1 - 6);
    LBox(g, 3.4, 2.0, 3.4, C1[0], YW + 7.0, C1[1], M.WALL, -ry);
    LLathe(g, [[1.7, 0], [1.6, 1.0], [1.3, 3.0], [1.1, 4.8], [0.7, 7.0], [0.35, 9.5], [0.12, 11.4], [0.02, 13.0]], C1[0], YW + 9.0, C1[1], M.GOLD, 12);
    // ridge finials (chofa-like horns) at the gable ends of the upper roof
    for (const s of [-1, 1]){ const p = Fr.R(cu + s*1.2, YW + 8.6, cv); LCone(g, 0.18, 1.4, p[0], p[1], p[2], M.GOLD, 6); }
    // road front: portico with columns and the doorway, guardian plinths either side
    { const F = (uu, vv, w) => Fr.R(uu, vv, V0 - (w || 0));
      shapeP(B.p(M.DARK), rectO(cu - 1.8, cu + 1.8, 0.8, 4.8), F, 0.05);
      for (const k of [-6.5, -3.5, 3.5, 6.5]) shapeP(B.p(M.DARK), rectO(cu + k - 0.7, cu + k + 0.7, 2.2, 5.4), F, 0.05);
      rectPrism(B.p(M.TRIM), Fr, cu - 4, cu + 4, V0 - 3, V0, 5.6, 6.2);
      for (const k of [-3.6, -1.2, 1.2, 3.6]){ const p = Fr.R(cu + k, 0, V0 - 2.7); LCyl(g, 0.28, 0.3, 4.8, p[0], 0.8, p[2], M.TRIM, 8); }
      roofP(B.p(M.ROOF), ...Fr.X(cu, V0 - 1.5), 4.6, 2.0, 2.2, 0.2, 6.2, 2.0, {ry:ry, pw:1.2, lift:0.4, n:3});
      rectPrism(B.p(M.BASE), Fr, cu - 4.4, cu + 4.4, V0 - 3.6, V0, 0, 0.8);
      for (const s of [-1, 1]){ const p = Fr.R(cu + s*5.6, 0, V0 - 2.2); LBox(g, 1.2, 1.4, 1.2, p[0], 0.8, p[2], M.TRIM, -ry); } }
    winP(B.p(M.DARK), Fr.rect(U0, U1, V0 + 3, V1), 0.8, 2, 4.6, 4.2, 1.1, 2.6, 1.4, 0.05, 6);
    for (const [x, z] of alongP(Fr.rect(U0 - 1.2, U1 + 1.2, V0 - 1.2, V1 + 1.2), 3.2)) boxP(B.p(M.LAMP), 0.22, 0.4, 0.22, x, YW - 0.9, z);
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'sgsakyamuni', lat:1.314839, lon:103.857052, rot:0});

// ================= Leong San See Temple (est. 1917, present building 1926), 371 Race Course Road =================
// Verified (URA conservation portal): southern Chinese Fujian-style temple, the roof is the focal point - curved ridges ending
// in swallow's tails, decorated with ceramic dragons, chimeras, phoenixes and flowers in cut-and-paste porcelain, four large
// panels at the ends of the perpendicular ridges; lacquered columns on carved granite bases; entrance with two carved stone lions
// and round windows; glossy yellow roof tiles (a later addition). Footprint w871542048; front on Race Course Road (SE). Hall
// layout and heights are estimates.
LANDMARKS.sgleongsan = {zh:'龙山寺', en:'Leong San See Temple', cat:'old', r:35, h:12.5,
  lt:{m:0, c:'#ffd9a8', k:0.55, e:0.6},
  build(){
    const g = new THREE.Group(), B = mkB(), V = mkV(), Fr = frm(34.8*PI/180), ry = -34.8*PI/180;
    const P = [[-5.1,-17.7],[18.8,-1.1],[5.0,17.9],[-18.8,0.7]];
    const M = {WALL:'#d8cbb3', WALL2:'#c9b796', TILE:'#d9a92c', TILE2:'#b9851e', RIDGE:'#e8d9b0', RED:'#9b2a20', GRAN:'#9a958b', DARK:'#2a2420', STONE:'#bdb7aa', LANT:{c:'#c8352a', glow:'#ff6a3a', gk:1.4}, GOLD:'#d4a73c'};
    prismP(B.p(M.GRAN), P, -5, 0.6, false);
    // frame: u from the back (-14.6) to the Race Course Road front (+14.6); v across (-11.6..11.6)
    const HALLS = [[7.4, 14.6, -11.6, 11.6, 5.2, 3.0], [-9.8, 3.4, -11.6, 11.6, 6.2, 3.8], [-14.6, -9.8, -11.6, 11.6, 4.6, 2.4]];
    for (const [u0, u1, v0, v1, eh, rh] of HALLS){
      rectPrism(B.p(M.WALL), Fr, u0, u1, v0, v1, 0.6, eh);
      const c = Fr.X((u0 + u1)/2, (v0 + v1)/2), L = (v1 - v0)/2, W = (u1 - u0)/2;
      // curved ridge (sag), swept eaves: ridge along v
      roofP(B.p(M.TILE), c[0], c[1], L + 0.8, W + 1.0, L - 0.3, 0, eh, rh, {ry:ry - PI/2, pw:1.5, lift:0.5, sag:0.9, fas:0.35, fo:B.p(M.TILE2), n:5, ridge:B.p(M.RIDGE), rr:0.32, hips:B.p(M.RIDGE), hr:0.14});
      // swallow-tail ridge ends and ceramic dragons / phoenixes along the main ridge
      const yr = eh + rh + 0.9;
      for (const s of [-1, 1]){ const a = Fr.R((u0 + u1)/2, yr, s*(L - 0.1)), b1 = Fr.R((u0 + u1)/2 + 0.45, yr + 1.3, s*(L + 0.9)), b2 = Fr.R((u0 + u1)/2 - 0.45, yr + 1.3, s*(L + 0.9));
        segP(B.p(M.RIDGE), a, b1, 0.16, 4); segP(B.p(M.RIDGE), a, b2, 0.16, 4); }
      const nf = Math.round(L*2/3.2);
      for (let j = 0; j < nf; j++){ const vv = -L + 1 + (2*L - 2)*(j + 0.5)/nf, p = Fr.R((u0 + u1)/2, yr - 0.2, vv), col = ['#3f8f5a', '#2f6fb0', '#d24a32', '#e9c645'][j % 4];
        vAdd(V, col, t => { boxP(t, 0.45, 0.6, 1.4, p[0], yr - 0.4, p[2], ry); boxP(t, 0.35, 0.5, 0.5, p[0], yr + 0.1, p[2], ry); }); }
    }
    // side galleries joining the halls round the two courtyards (lower pent roofs)
    for (const s of [-1, 1]){ const v0 = s < 0 ? -11.6 : 8.4, v1 = s < 0 ? -8.4 : 11.6;
      rectPrism(B.p(M.WALL2), Fr, 3.4, 7.4, v0, v1, 0.6, 4.2); const c = Fr.X(5.4, (v0 + v1)/2);
      roofP(B.p(M.TILE), c[0], c[1], 2.4, 2.0, 1.6, 0, 4.2, 1.6, {ry:ry, pw:1.4, n:3, fas:0.25, fo:B.p(M.TILE2)}); }
    rectPrism(B.p(M.STONE), Fr, 3.4, 7.4, -8.4, 8.4, 0.6, 0.7);
    // front: lacquered columns on granite bases under the eave, the doorway, round windows, two stone lions, lanterns
    { const F = (uu, vv, w) => Fr.R(14.6 + (w || 0), vv, -uu);
      shapeP(B.p(M.RED), rectO(-2.2, 2.2, 0.6, 4.4), F, 0.04); shapeP(B.p(M.DARK), rectO(-1.8, 1.8, 0.6, 4.0), F, 0.06);
      for (const s of [-1, 1]){ shapeP(B.p(M.DARK), circ(1.0, 14).map(p => [p[0] + s*6.5, p[1] + 2.8]), F, 0.06); slabP(B.p(M.STONE), circ(1.25, 14).map(p => [p[0] + s*6.5, p[1] + 2.8]), F, 0, 0.03); }
      for (const vv of [-9.5, -4.5, 4.5, 9.5]){ const p = Fr.R(16.0, 0, vv); LBox(g, 0.6, 0.6, 0.6, p[0], 0.6, p[2], M.GRAN, ry); LCyl(g, 0.24, 0.24, 4.4, p[0], 1.2, p[2], M.RED, 8); }
      for (const vv of [-3.2, 3.2]){ const p = Fr.R(17.8, 0, vv); LBox(g, 1.0, 0.9, 1.3, p[0], 0, p[2], M.GRAN, ry); LBox(g, 0.8, 1.3, 1.0, p[0], 0.9, p[2], M.STONE, ry); LSph(g, 0.45, p[0], 2.5, p[2], M.STONE, 1, 8); }
      for (const vv of [-2.6, 2.6]){ const p = Fr.R(16.0, 0, vv); LSph(g, 0.4, p[0], 4.3, p[2], M.LANT, 1.25, 8); } }
    winP(B.p(M.DARK), Fr.rect(-14.6, 7.4, -11.6, 11.6), 0.6, 1, 4, 4.5, 1.0, 1.6, 1.4, 0.05, 6);
    B.flush(g); vFlush(g, V); return g;
  }};
SG_PLACES.push({type:'sgleongsan', lat:1.315235, lon:103.856842, rot:0});
// ================= Maghain Aboth Synagogue (1878, national monument), Waterloo Street =================
// Verified (Wikipedia): neoclassical / colonial, symmetrical; single storey with a U-shaped women's gallery (1893) and a more solid
// gallery (1924-25) forming a second storey; a covered porch with steps up to a vestibule designed for horse carriages; arched
// doorways with classical keystones; pilasters with decorative capitals along the corners and sides; a repeating sequence of
// Palladian arcades and pedestals; mostly rectangular timber-louvred windows. Footprint w172596786 (its data height 40 m is wrong);
// the porch is the centred projection of the footprint towards Waterloo Street (SE). Wikipedia says the facade faces west - the
// footprint shows the porch on the Waterloo Street side, which this model follows. Colours (white, green louvres), the hipped roof
// and the heights (eaves 10.5 m) are estimates.
LANDMARKS.sgmaghain = {zh:'马海阿波犹太会堂', en:'Maghain Aboth Synagogue', cat:'old', r:30, h:13.5,
  lt:{m:0, c:'#fff0d8', k:0.6, e:0.7, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), Fr = frm(38.5*PI/180), ry = -38.5*PI/180;
    const M = {WALL:'#f0ece2', TRIM:'#fbfaf5', LOUV:'#3f5f48', DARK:'#2b2a28', ROOF:'#7b7a76', BASE:'#a7a296', STEP:'#c9c4b8'};
    const U0 = -14.0, U1 = 12.4, V0 = -10.1, V1 = 10.1, Y0 = 0.9, Y1 = 5.6, Y2 = 10.5;
    rectPrism(B.p(M.BASE), Fr, U0, U1, V0, V1, -5, Y0);
    rectPrism(B.p(M.WALL), Fr, U0, U1, V0, V1, Y0, Y2);
    const P = Fr.rect(U0, U1, V0, V1);
    bandP(B.p(M.TRIM), P, Y1 - 0.25, 0.45, 0.18); bandP(B.p(M.TRIM), P, Y2 - 0.6, 0.6, 0.35);
    parP(B.p(M.TRIM), offP(P, -0.3), Y2, Y2 + 1.0, 0.3);
    // low hipped roof behind the parapet
    hipRoof(g, ...Fr.X((U0 + U1)/2, 0), U1 - U0 - 1.2, V1 - V0 - 1.2, Y2, 3.0, M.ROOF, ry);
    // pilasters at the bays, ground-floor arcade of round-arched openings with keystones, upper louvred windows
    for (const E of edgesF(P)){ const k = Math.max(2, Math.round(E.L/3.3));
      for (let j = 0; j <= k; j++){ const u = j*E.L/k; slabP(B.p(M.TRIM), rectO(u - 0.3, u + 0.3, Y0, Y2 - 0.6), E.F, 0, 0.22); slabP(B.p(M.TRIM), rectO(u - 0.42, u + 0.42, Y2 - 1.1, Y2 - 0.6), E.F, 0, 0.3); }
      for (let j = 0; j < k; j++){ const u = (j + 0.5)*E.L/k, hw = Math.min(1.0, E.L/k/2 - 0.55);
        shapeP(B.p(M.DARK), mv(rArchO(hw, 3.6, 8), u, Y0 + 0.2), E.F, 0.04);
        shapeP(B.p(M.LOUV), mv(rectO(-hw + 0.1, hw - 0.1, 0, 2.5), u, Y0 + 0.3), E.F, 0.06);
        slabP(B.p(M.TRIM), [[u - 0.22, Y0 + 3.55], [u + 0.22, Y0 + 3.55], [u + 0.3, Y0 + 4.1], [u - 0.3, Y0 + 4.1]], E.F, 0, 0.12);
        shapeP(B.p(M.DARK), rectO(u - hw*0.8, u + hw*0.8, Y1 + 0.7, Y1 + 3.6), E.F, 0.04);
        for (let i = 0; i < 6; i++) shapeP(B.p(M.LOUV), rectO(u - hw*0.8 + 0.05, u + hw*0.8 - 0.05, Y1 + 0.8 + i*0.47, Y1 + 1.05 + i*0.47), E.F, 0.06);
        slabP(B.p(M.TRIM), rectO(u - hw*0.8 - 0.15, u + hw*0.8 + 0.15, Y1 + 3.6, Y1 + 3.85), E.F, 0, 0.1); } }
    // the carriage porch on Waterloo Street: four columns, a flat roof with balustraded parapet, steps
    { const PU0 = U1, PU1 = 17.0, PV0 = -2.9, PV1 = 3.8;
      rectPrism(B.p(M.STEP), Fr, PU0, PU1, PV0, PV1, -5, 0.5);
      for (const [uu, vv] of [[PU1 - 0.5, PV0 + 0.5], [PU1 - 0.5, PV1 - 0.5], [PU0 + 0.6, PV0 + 0.5], [PU0 + 0.6, PV1 - 0.5]]){ const p = Fr.R(uu, 0, vv); LBox(g, 0.9, 0.6, 0.9, p[0], 0.5, p[2], M.TRIM, ry); LCyl(g, 0.32, 0.36, 4.0, p[0], 1.1, p[2], M.TRIM, 10); LBox(g, 0.85, 0.4, 0.85, p[0], 5.1, p[2], M.TRIM, ry); }
      rectPrism(B.p(M.TRIM), Fr, PU0, PU1 + 0.2, PV0 - 0.2, PV1 + 0.2, 5.5, 6.3);
      parP(B.p(M.TRIM), Fr.rect(PU0, PU1 + 0.2, PV0 - 0.2, PV1 + 0.2), 6.3, 7.2, 0.2);
      const F = (uu, vv, w) => Fr.R(U1 + (w || 0), vv, -uu);
      shapeP(B.p(M.DARK), mv(rArchO(1.4, 4.2, 10), -0.45, Y0), F, 0.06); slabP(B.p(M.TRIM), [[-0.75, Y0 + 3.9], [-0.15, Y0 + 3.9], [-0.05, Y0 + 4.6], [-0.85, Y0 + 4.6]], F, 0, 0.15); }
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'sgmaghain', lat:1.298228, lon:103.850701, rot:0});

// ================= The Cathay (1939 Cathay Building facade; 2006 redevelopment), 2 Handy Road =================
// Verified (Wikipedia): Frank W. Brewer's 1939 Cathay Building (Singapore's first skyscraper, national monument 2003); only a portion
// of the main facade was revealed and preserved; the 2006 redevelopment by Tange Associates + RDC holds retail and a cineplex, with
// The Cathay Residences tower above. Real footprint w46503590 (8 floors, 27.6 m) and its tower part (26.4-53.4 m). Which face keeps
// the old front (here the Handy Road / Dhoby Ghaut face) and the stepped Art Deco tower piece (to 34 m) are estimates.
LANDMARKS.sgcathay = {zh:'国泰大厦', en:'The Cathay', cat:'new', r:58, h:53.4,
  lt:{m:1, c:'#e3ecf5', k:0.55},
  build(){
    const g = new THREE.Group(), B = mkB();
    const P = [[21.8,-47.3],[39.7,-20.6],[41.5,-8.2],[38.5,9.0],[42.1,10.8],[42.1,23.8],[38.0,26.2],[40.3,36.9],[36.2,44.6],[11.7,50.5],[2.1,46.4],[-3.2,39.2],[-21.2,41.6],[-24.7,29.8],[-23.5,26.2],[-54.6,12.0],[-51.0,6.6],[-39.7,-23.6],[-40.9,-37.8],[-21.2,-41.4]];
    const T = [[-42.6,8.3],[-43.8,0.0],[-42.6,0.0],[-43.8,-7.7],[-37.3,-8.9],[-36.7,-6.5],[-33.1,-7.7],[-36.1,-20.7],[-31.3,-21.3],[-33.7,-32.6],[-3.8,-38.5],[3.3,-0.6]];
    const M = {GLS:{c:'#5d7486', m:1, fh:4.2, cw:3.2}, GLR:{c:'#6c7f8c', m:1, fh:3.2, cw:2.6}, FRAME:'#c9ccd0', CREAM:{c:'#efe6cf', m:0, lc:'#fff0d0', lk:0.9}, FIN:{c:'#f6efdc', m:0, lc:'#fff0d0', lk:1.0}, DARK:'#2e3236', ROOF:'#8d9296', SHOP:{c:'#3d4448', glow:'#ffe2b0', gk:0.9}};
    prismP(B.p(M.ROOF), P, -5, 0.4, false);
    // 2006 podium: glass curtain wall in floor bands, shopfronts at the street
    prismP(B.p(M.GLS), P, 0.4, 27.6, false); capP(B.p(M.ROOF), P, 27.6);
    for (let f = 1; f <= 6; f++) bandP(B.p(M.FRAME), P, 4.6 + (f - 1)*3.85, 0.45, 0.2);
    for (const E of edgesF(P)){ if (E.L < 3) continue; shapeP(B.p(M.SHOP), rectO(0.4, E.L - 0.4, 0.6, 4.0), E.F, 0.05);
      const k = Math.round(E.L/1.6); for (let j = 1; j < k; j++) shapeP(B.p(M.FRAME), rectO(j*E.L/k - 0.06, j*E.L/k + 0.06, 4.6, 27.2), E.F, 0.06); }
    parP(B.p(M.FRAME), P, 27.6, 28.6, 0.25);
    // residential tower on the west part (26.4 - 53.4 m): glass with balcony slabs
    prismP(B.p(M.GLR), T, 27.6, 53.4, false); capP(B.p(M.ROOF), T, 53.4);
    for (let y = 30.6; y < 53; y += 3.2) bandP(B.p(M.FRAME), T, y, 0.25, 0.9);
    parP(B.p(M.FRAME), T, 53.4, 54.6, 0.3);
    // the preserved 1939 front on the Handy Road / Dhoby Ghaut face: cream wall with tall piers, stepped central tower piece
    { const a = [-54.6, 12.0], b = [-23.5, 26.2], L = Math.hypot(b[0] - a[0], b[1] - a[1]), ex = (b[0] - a[0])/L, ez = (b[1] - a[1])/L, nx = ez, nz = -ex;
      const sg = (nx*(a[0]) + nz*(a[1])) < 0 ? 1 : -1, F = (u, v, w) => [a[0] + ex*u - sg*nx*(w || 0), v, a[1] + ez*u - sg*nz*(w || 0)];
      slabP(B.p(M.CREAM), rectO(0, L, 0.4, 27.6), F, 0, 0.6);
      for (let j = 0; j <= 14; j++){ const u = 1 + j*(L - 2)/14; slabP(B.p(M.FIN), rectO(u - 0.35, u + 0.35, 4.4, 28.4), F, 0.6, 1.3); }
      for (let f = 0; f < 6; f++) for (let j = 0; j < 14; j++){ const u = 1 + (j + 0.5)*(L - 2)/14; shapeP(B.p(M.DARK), rectO(u - 0.6, u + 0.6, 6 + f*3.7, 8.4 + f*3.7), F, 0.65); }
      shapeP(B.p(M.SHOP), rectO(L/2 - 5, L/2 + 5, 0.6, 4.2), F, 0.65);
      // central stepped tower piece
      const cu = L/2; let w = 9, y = 27.6;
      for (const [dh, dw] of [[3.2, 0], [2.4, 2.2], [2.0, 4.0]]){ const ww = w - dw; slabP(B.p(M.CREAM), rectO(cu - ww/2, cu + ww/2, y, y + dh), F, -2.5, 1.0); y += dh; }
      for (const s of [-2.4, -0.8, 0.8, 2.4]) slabP(B.p(M.FIN), rectO(cu + s - 0.25, cu + s + 0.25, 20, 34.6), F, 1.0, 1.5); }
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'sgcathay', lat:1.299495, lon:103.847711, rot:0});

// ================= Tekka Centre (1979-82; renovated 2008-09), Buffalo Road / Serangoon Road =================
// Verified (Wikipedia): two floors, the hawker centre and wet market on the ground floor, basement parking; opened 1982, renovated
// 2008-09. Real footprint w47198835 (the HDB blocks beside it stay as data buildings). Colours, the open market frontage and the
// roof are estimates.
LANDMARKS.sgtekka = {zh:'竹脚中心', en:'Tekka Centre', cat:'new', r:100, h:83.1,
  lt:{m:0, c:'#ffe0b0', k:0.45, e:0.7},
  build(){
    const g = new THREE.Group(), B = mkB();
    const P = [[-55.9,-42.4],[-69.1,-39.4],[-79.8,-46.5],[-77.4,-50.7],[-73.2,-49.5],[-74.4,-45.3],[-64.9,-44.2],[-63.7,-47.1],[-57.1,-48.9],[-57.1,-50.1],[-53.5,-51.3],[-52.9,-48.3],[-44.0,-50.1],[-44.6,-53.6],[-39.8,-54.8],[-41.6,-63.1],[-38.0,-63.7],[-37.4,-60.8],[-29.7,-63.1],[-30.3,-67.3],[-29.7,-68.5],[-26.7,-65.5],[-21.9,-70.8],[34.8,-25.8],[16.3,-2.1],[42.6,18.1],[49.7,9.2],[59.9,16.9],[50.9,30.6],[65.9,40.1],[55.7,55.5],[38.4,44.2],[15.7,49.5],[6.2,60.8],[8.6,62.6],[7.4,64.4],[5.0,62.0],[0.8,66.7],[-41.0,26.4],[-41.6,18.1],[-36.2,18.1],[-35.0,19.3],[-23.7,17.5],[-24.3,13.4],[-23.1,10.4],[-11.1,-4.4],[-55.3,-40.6]];
    const M = {WALL:'#d9c7a6', UP:'#b8644a', TRIM:'#eee6d4', DARK:{c:'#3a3530', glow:'#ffd9a0', gk:0.7}, WIN:{c:'#3d4246', m:1, fh:4.4, cw:3.2}, ROOF:'#8a8a84', COL:'#cfc6b4', BASE:'#8d877c', HDB:{c:'#e6e0d2', m:1, fh:2.8, cw:2.4}, HBAND:'#c7bfae'};
    prismP(B.p(M.BASE), P, -5, 0.4, false);
    const P0 = offP(P, 2.2);
    prismP(B.p(M.DARK), P0, 0.4, 5.0, false);
    for (const [x, z, a] of alongP(P, 6)) boxP(B.p(M.COL), 0.6, 4.6, 0.6, x, 0.4, z);
    prismP(B.p(M.WALL), P, 5.0, 10.0, false); capP(B.p(M.ROOF), P, 10.0);
    bandP(B.p(M.UP), P, 5.0, 1.0, 0.15); bandP(B.p(M.UP), P, 9.2, 0.8, 0.2);
    winP(B.p(M.WIN), P, 6.0, 1, 4.4, 4.0, 2.8, 2.2, 0.4, 0.06, 3.5);
    parP(B.p(M.TRIM), P, 10.0, 11.0, 0.25);
    // the HDB blocks of the complex that rise beside the market podium (w178436578/79/80/81, heights = their OSM parts); they
    // stand inside this model's hull, so they are drawn here as plain slab blocks instead of being hidden
    const HDB = [[76.5,[[-49.4,-75.0],[-45.2,-76.2],[-44.6,-73.8],[-37.4,-75.6],[-39.2,-80.3],[-35.6,-81.5],[-35.0,-76.2],[-31.4,-76.8],[-26.7,-72.6],[-25.5,-73.8],[-21.9,-70.8],[-26.7,-65.5],[-29.7,-68.5],[-30.3,-67.3],[-29.7,-63.1],[-37.4,-60.8],[-38.0,-63.7],[-41.6,-63.1],[-39.8,-54.8],[-44.6,-53.6],[-47.0,-64.3],[-45.8,-64.3],[-47.0,-67.9],[-50.0,-67.9],[-50.5,-72.6]]],[76.5,[[-45.8,-64.9],[-47.0,-64.3],[-44.0,-50.1],[-52.9,-48.3],[-53.5,-51.3],[-57.1,-50.1],[-57.1,-48.9],[-63.7,-47.1],[-64.9,-44.2],[-74.4,-45.3],[-73.2,-49.5],[-77.4,-50.7],[-76.8,-51.9],[-77.4,-53.0],[-78.6,-51.9],[-79.8,-53.0],[-75.0,-61.4],[-69.1,-58.4],[-69.1,-61.4],[-65.5,-61.4],[-65.5,-59.0],[-62.5,-59.6],[-62.5,-60.8],[-52.9,-63.1],[-52.9,-63.7],[-54.1,-63.7],[-54.7,-65.5],[-50.5,-66.7],[-50.5,-63.7]]],[10.5,[[64.1,20.5],[63.5,14.0],[65.3,14.0],[65.9,11.0],[65.3,10.4],[62.9,13.4],[61.7,12.2],[59.9,14.6],[52.1,8.6],[53.9,6.8],[49.7,3.3],[48.0,5.1],[40.8,-0.9],[42.0,-2.1],[30.6,-11.5],[40.2,-22.8],[77.2,7.4],[78.4,20.5],[74.2,27.0],[77.2,29.4],[76.0,31.2],[73.0,29.4],[65.9,40.1],[55.7,33.5],[56.3,32.3],[54.5,31.2],[59.3,22.9],[61.1,24.0],[63.5,20.5]]],[69.9,[[28.3,65.0],[28.3,72.1],[27.7,73.3],[22.3,74.4],[21.7,72.1],[16.3,73.3],[16.3,78.6],[14.5,79.2],[12.7,78.0],[12.7,73.9],[9.7,75.0],[0.8,66.7],[5.0,62.0],[7.4,64.4],[8.6,62.6],[6.2,60.8],[8.6,58.4],[10.9,60.8],[15.7,59.6],[15.7,62.0],[20.5,60.8],[18.1,53.1],[22.3,51.9],[24.1,56.7],[27.1,56.1]]],[83.1,[[21.7,48.4],[31.2,46.0],[32.4,50.7],[45.0,53.1],[47.4,50.1],[55.1,55.5],[53.9,57.8],[56.9,60.2],[52.7,66.7],[47.4,63.2],[43.2,67.9],[41.4,67.3],[42.0,62.6],[31.8,60.8],[31.2,63.2],[28.3,65.0],[27.1,56.1],[24.1,56.7]]],[83.1,[[-44.0,-0.3],[-41.6,9.8],[-42.8,11.0],[-46.4,12.2],[-48.2,11.0],[-48.2,9.8],[-54.7,11.0],[-53.5,16.3],[-57.1,16.9],[-57.7,11.6],[-61.9,12.2],[-70.3,5.1],[-67.3,-1.5],[-64.9,0.3],[-63.7,-1.5],[-64.3,-2.1],[-61.9,-5.0],[-60.1,-3.2],[-55.3,-4.4],[-54.7,-0.3],[-50.5,-0.9],[-52.3,-9.8],[-47.6,-10.4],[-47.0,-3.2],[-45.8,-3.8]]],[83.1,[[-48.2,-14.5],[-39.2,-16.3],[-38.6,-13.3],[-23.7,-10.4],[-22.5,-11.5],[-15.9,-6.8],[-16.5,-5.0],[-12.9,-2.6],[-18.9,5.1],[-24.9,0.9],[-28.5,6.3],[-30.8,4.5],[-27.3,0.3],[-39.2,-2.1],[-38.6,1.5],[-41.6,2.7],[-42.2,-0.9],[-44.0,-0.3],[-45.8,-3.8],[-47.0,-3.2]]],[10.5,[[-88.2,-21.6],[-83.4,-28.7],[-86.4,-30.5],[-84.6,-32.9],[-82.2,-31.1],[-76.2,-40.6],[-65.5,-34.1],[-66.7,-32.9],[-64.3,-31.7],[-69.7,-23.4],[-71.4,-24.6],[-73.2,-22.2],[-76.8,-24.6],[-78.0,-23.4],[-75.6,-21.0],[-74.4,-21.6],[-73.2,-14.5],[-74.4,-14.5],[-74.4,-13.3],[-75.6,-11.5],[-75.0,-10.9],[-72.6,-13.9],[-71.4,-12.7],[-69.7,-14.5],[-61.9,-8.6],[-64.3,-5.6],[-65.5,-6.8],[-67.3,-4.4],[-63.7,-1.5],[-64.9,0.3],[-67.3,-1.5],[-70.3,5.1],[-87.0,-8.6]]]];
    for (const [top, Q] of HDB){ prismP(B.p(M.HDB), Q, -5, top, false); capP(B.p(M.ROOF), Q, top); for (let y = 6; y < top - 2; y += 8.4) bandP(B.p(M.HBAND), Q, y, 0.5, 0.15); parP(B.p(M.HBAND), Q, top, top + 1.0, 0.25); }
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'sgtekka', lat:1.306206, lon:103.850593, rot:0});

// ================= Nanyang Academy of Fine Arts, Campus 1 (Bencoolen Street) =================
// Verified (Wikipedia): Campus 1 has two wings, A and B, joined by a linking bridge (not placed: its position is unknown); skylight studios with even daylight; the
// Tower Block (2017, S$40 m) sits on top of Bencoolen MRT station next to Campus 1. Real footprints w172596714 (7 floors, 24.3 m),
// w481661171 (6 floors, 21 m) and the Tower Block w380508304 (40 m in the data, estimate). Colours and the skylight form are estimates.
LANDMARKS.sgnafa = {zh:'南洋艺术学院', en:'Nanyang Academy of Fine Arts (Campus 1)', cat:'new', r:88, h:40,
  lt:{m:1, c:'#e6eef5', k:0.5},
  build(){
    const g = new THREE.Group(), B = mkB();
    const A = [[25.8,-32.2],[20.4,-25.1],[22.2,-23.3],[15.0,-15.0],[24.6,-7.3],[18.0,1.0],[12.0,-0.2],[12.6,-5.5],[9.6,-8.5],[-4.7,9.3],[7.3,9.9],[7.9,13.5],[-19.0,44.3],[-43.5,23.6],[27.6,-61.8],[34.1,-55.9],[40.1,-63.0],[71.7,-36.9],[50.8,-12.0]];
    const Bw = [[-19.0,44.3],[-32.1,60.3],[-56.0,39.6],[-43.5,23.6]], T = [[-32.1,60.3],[-42.3,71.6],[-66.8,51.4],[-56.0,39.6]];
    const M = {WALL:'#e4e2dc', WALL2:'#cfd2d4', BAND:'#b9bcbe', WIN:{c:'#46525a', m:1, fh:3.47, cw:3}, TRIM:'#f4f3ef', ROOF:'#9a9c9a', SKY:{c:'#b8d0dc', glow:'#e8f2ff', gk:0.5}, TWR:{c:'#55646e', m:1, fh:3.6, cw:3}, BASE:'#8f8f8a'};
    for (const Q of [A, Bw, T]) prismP(B.p(M.BASE), Q, -5, 0.4, false);
    blkP(B, A, 0.4, 7, 3.42, M, {bay:3.6, ww:2.6, wh:1.9, sill:0.8});
    blkP(B, Bw, 0.4, 6, 3.43, {WALL:M.WALL2, BAND:M.BAND, WIN:M.WIN, TRIM:M.TRIM, ROOF:M.ROOF}, {bay:3.6, ww:2.6, wh:1.9, sill:0.8});
    // skylight studios on the top of wing A: north-light monitors in rows
    { const d = [Math.cos(-0.876), Math.sin(-0.876)], n = [-d[1], d[0]];
      for (let t = -30; t <= 30; t += 6){ const Q = clipST(offP(A, 3), d, n, -60, 60, t, t + 3.4); if (Q.length < 3) continue;
        prismP(B.p(M.ROOF), Q, 24.4, 25.6, false); capP(B.p(M.SKY), Q, 25.6); } }
    // the Tower Block (2017): glass-and-panel tower with horizontal floor bands
    prismP(B.p(M.TWR), T, 0.4, 40, false); capP(B.p(M.ROOF), T, 40);
    for (let y = 4.0; y < 40; y += 3.6) bandP(B.p(M.TRIM), T, y, 0.5, 0.18);
    for (const E of edgesF(T)) for (let j = 1; j < 6; j++) slabP(B.p(M.TRIM), rectO(j*E.L/6 - 0.2, j*E.L/6 + 0.2, 4.0, 40), E.F, 0, 0.35);
    parP(B.p(M.TRIM), T, 40, 41.2, 0.3);
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'sgnafa', lat:1.299648, lon:103.851393, rot:0});
// ================= Mustafa Centre (opened 1995), Syed Alwi Road =================
// Verified (Wikipedia): 24-hour department store, one main store and five wings, ~37,000 m2; the data maps the blocks on the NE side
// of Syed Alwi Road as 5-storey buildings (17.7 m): w178437071, w178437074, w178437070 (+ a small piece) here, w47198841 in
// sgmustafa2 and w178437069 in sgmustafa3 (secondary keys, label:false; split so that no hull reaches over the lanes between them).
// Facade colours and the ground-floor shopfront arcade are estimates; the link over the lane is not placed (position unknown).
const MUS = (rings, lowRing) => function(){
  const g = new THREE.Group(), B = mkB();
  const M = {WALL:'#ece9e1', BAND:'#c9c5bb', WIN:{c:'#3e4a55', m:1, fh:3.4, cw:3}, TRIM:'#f7f5f0', ROOF:'#8e8f8c', SHOP:{c:'#3b4044', glow:'#ffe4b8', gk:1.0}, BASE:'#8d897f', FIN:'#d4d0c6'};
  for (const P of rings){ prismP(B.p(M.BASE), P, -5, 0.4, false);
    prismP(B.p(M.SHOP), offP(P, 1.8), 0.4, 4.4, false); prismP(B.p(M.WALL), P, 4.4, 17.7, false); capP(B.p(M.ROOF), P, 17.7);
    for (const [x, z] of alongP(P, 4)) boxP(B.p(M.FIN), 0.5, 4.0, 0.5, x, 0.4, z);
    for (let f = 0; f < 4; f++) bandP(B.p(M.BAND), P, 4.4 + f*3.33, 0.4, 0.15);
    winP(B.p(M.WIN), P, 4.4, 4, 3.33, 2.4, 1.9, 1.9, 0.7, 0.05, 3);
    parP(B.p(M.TRIM), P, 17.7, 18.7, 0.25);
    // rooftop plant rooms
    const c = ctr(P); LBox(g, 6, 3, 6, c[0], 17.7, c[1], M.BAND); }
  if (lowRing){ prismP(B.p(M.BASE), lowRing, -5, 0.4, false); prismP(B.p(M.WALL), lowRing, 0.4, 5.2, false); capP(B.p(M.ROOF), lowRing, 5.2); }
  B.flush(g); return g; };
LANDMARKS.sgmustafa = {zh:'慕斯达法中心', en:'Mustafa Centre', cat:'new', r:50, h:20.7, lt:{m:1, c:'#e8eef5', k:0.5},
  build:MUS([[[25.3,35.5],[-9.4,2.9],[1.4,-8.3],[36.0,23.7]], [[-24.9,-37.4],[-11.7,-24.4],[-11.7,-21.4],[-13.5,-18.4],[-18.9,-12.5],[-21.3,-11.9],[-24.3,-12.5],[-37.4,-23.8]],
    [[-13.5,-18.4],[-0.4,-6.6],[-5.8,-0.6],[-18.9,-12.5]]], [[18.7, 7.0], [11.5, 1.0], [17.5, -5.5], [24.7, 0.4]])};
SG_PLACES.push({type:'sgmustafa', lat:1.309538, lon:103.855936, rot:0});
LANDMARKS.sgmustafa2 = {zh:'慕斯达法中心', en:'Mustafa Centre', cat:'new', r:58, h:20.7, label:false, lt:{m:1, c:'#e8eef5', k:0.5},
  build:MUS([[[31.2,40.8],[-44.0,-28.0],[-32.1,-41.0],[43.7,27.2]]])};
SG_PLACES.push({type:'sgmustafa2', lat:1.310123, lon:103.855320, rot:0});
LANDMARKS.sgmustafa3 = {zh:'慕斯达法中心', en:'Mustafa Centre', cat:'new', r:45, h:20.7, label:false, lt:{m:1, c:'#e8eef5', k:0.5},
  build:MUS([[[-19.4,-35.5],[37.3,16.1],[19.4,35.6],[-37.3,-16.0]]])};
SG_PLACES.push({type:'sgmustafa3', lat:1.309073, lon:103.856498, rot:0});
// ================= Singapore Management University (city campus, 2004-06; Connexion 2019) - SITE =================
// Verified (OSM / refs): the campus = the university land-use polygons between Stamford Road, Bras Basah Road, Fort Canning and
// Victoria Street, with its named buildings: Li Ka Shing Library, School of Economics / School of Computing and Information
// Systems 1 and 2, School of Accountancy, Lee Kong Chian School of Business, School of Law & Kwa Geok Choo Library, School of
// Social Sciences & College of Integrative Studies, SMU Connexion, Innovation Bridge; the Campus Green (recreation ground) and the
// pedestrian concourse areas. The keep polygon is the union of the two main university polygons (it leaves out the National
// Museum, SAM and the Cathedral of the Good Shepherd, which are separate landmark models). Building heights are the data values
// (mostly estimates); the facade treatment (glass between terracotta-toned fins and white floor bands) is an estimate. The
// Administration Building on Victoria Street (a separate university polygon) is the landmark key sgsmu2 (label:false).
const SMU = {"keep":[[-24.5,15.0],[-45.4,-5.8],[-85.4,-73.7],[-165.4,-148.1],[-168.9,-155.2],[-170.1,-165.6],[-167.2,-172.4],[-131.9,-211.3],[-126.9,-212.2],[-121.5,-210.4],[-46.9,-150.8],[130.5,-20.6],[187.3,24.8],[181.4,24.8],[136.1,-12.0],[98.9,24.8],[99.1,24.8],[56.4,67.2],[134.0,125.9],[68.7,196.7],[24.2,172.7],[4.2,155.8],[-3.0,167.4],[-2.1,169.2],[-3.6,171.2],[-22.1,161.7],[-46.3,202.7],[-68.6,191.4],[-81.5,211.3],[-111.9,195.2],[-157.6,277.1],[-164.2,279.5],[-169.8,265.5],[-177.9,220.7],[-178.5,202.7],[-167.2,135.9],[-94.3,79.6],[-80.6,55.9],[-60.9,42.0],[-41.1,24.8]],"green":[[-41.8,-7.6],[-56.7,-36.6],[-64.8,-48.8],[-22.1,-66.3],[1.8,-67.2],[25.4,-47.0],[-20.9,11.1]],"ped":[[40.6,-73.4],[40.6,-75.2],[49.3,-68.3],[54.0,-68.3],[64.2,-61.5],[33.4,-25.9],[26.0,-31.6],[16.1,-11.7],[0.3,-0.7],[-8.1,8.4],[-15.2,19.4],[-18.8,19.1],[-24.5,15.0],[25.4,-47.0],[1.8,-67.2],[-10.4,-66.0],[-9.2,-72.8],[-1.2,-72.8],[4.2,-76.1],[17.6,-90.9]],"bld":[["w46522841","Li Ka Shing Library",30.0,null,[[31.9,25.2],[42.6,11.6],[45.1,13.9],[50.4,8.6],[69.1,21.8],[32.5,63.4],[18.7,52.7],[11.6,43.8],[13.3,41.9],[12.1,35.5],[7.5,31.4],[0.9,37.3],[-5.7,34.9],[-2.9,31.3],[-8.7,29.6],[-14.7,26.0],[-15.3,19.4],[-8.1,8.1],[0.2,-0.8],[15.8,-12.1],[24.2,-13.9],[29.6,-13.9],[33.2,-10.3],[33.8,1.0],[32.1,8.8],[29.7,14.1],[24.9,18.8]]],["w46522839","School of Economics & School of Computing and Information Systems (2)",26.0,null,[[-155.5,-168.0],[-152.5,-170.3],[-144.2,-172.7],[-141.8,-179.2],[-138.2,-182.2],[-144.2,-187.5],[-141.2,-194.1],[-131.0,-205.3],[-61.8,-147.8],[-70.1,-136.0],[-76.7,-132.4],[-79.7,-134.8],[-82.1,-132.4],[-80.3,-130.0],[-86.9,-117.0],[-87.5,-117.6],[-91.0,-111.0],[-100.6,-99.8],[-151.3,-140.7],[-146.6,-146.6],[-147.8,-147.2],[-150.7,-144.3],[-155.5,-148.4],[-159.1,-153.1],[-159.1,-159.7]]],["w1094096441","School of Economics & School of Computing",17.1,null,[[-107.8,-140.1],[-109.5,-142.5],[-113.1,-138.9],[-111.3,-136.0],[-112.5,-134.2],[-134.0,-152.6],[-128.1,-160.3],[-106.0,-143.1]]],["w46522840","School of Computing and Information Systems 1",26.0,null,[[8.1,-90.9],[-0.9,-79.6],[1.5,-78.4],[-9.2,-76.6],[-12.2,-79.6],[-15.2,-76.1],[-34.3,-92.1],[-35.5,-90.9],[-34.3,-89.1],[-37.9,-85.5],[-39.7,-86.1],[-40.3,-84.4],[-37.9,-82.0],[-36.1,-78.4],[-35.5,-75.5],[-40.3,-71.9],[-46.9,-71.3],[-48.1,-70.1],[-50.4,-70.7],[-52.2,-69.5],[-54.6,-70.7],[-56.4,-69.5],[-58.2,-70.7],[-60.0,-70.1],[-67.8,-71.9],[-70.7,-79.0],[-70.7,-86.7],[-68.4,-92.1],[-72.5,-95.0],[-66.0,-99.8],[-63.0,-97.4],[-61.2,-99.8],[-63.0,-102.1],[-56.4,-115.2],[-55.2,-114.6],[-51.6,-121.7],[-51.0,-121.1],[-42.1,-132.4]]],["w783586378","",30.0,null,[[-52.2,61.5],[-46.3,62.7],[-43.9,71.6],[-45.7,74.0],[-40.9,91.8],[-39.1,91.2],[-38.5,93.0],[-28.9,82.3],[-17.0,91.2],[-31.3,107.8],[-28.9,113.7],[-32.5,118.5],[-43.3,98.9],[-48.6,80.5]]],["w175139008","School of Social Sciences & College of Integrative Studies",24.3,7,[[-169.8,165.3],[-119.7,193.2],[-162.1,269.1],[-168.6,265.5],[-175.8,222.8],[-176.4,202.1]]],["w719635727","Innovation Bridge",7.0,2,[[-61.2,123.2],[-75.5,147.5],[-92.2,136.8],[-77.3,113.1]]],["w719635726","SMU Connexion",30.0,null,[[-63.6,59.2],[-52.2,61.5],[-48.6,80.5],[-43.3,98.9],[-32.5,118.5],[-35.5,122.0],[-32.5,124.4],[-35.5,129.1],[-27.2,139.8],[-30.7,142.8],[-103.0,96.5],[-98.2,89.4],[-95.2,90.6],[-93.4,88.2],[-95.8,86.4],[-108.3,96.5],[-109.5,95.3],[-123.9,113.1],[-126.3,111.9],[-112.5,96.5],[-113.1,95.9],[-64.2,55.6]]],["w423797941","School of Law & Kwa Geok Choo Library",30.0,null,[[-52.2,195.5],[-85.7,176.6],[-97.6,196.7],[-143.0,169.5],[-138.2,162.3],[-146.6,157.0],[-148.9,152.8],[-149.5,146.9],[-148.3,141.6],[-146.0,136.2],[-139.4,129.7],[-128.6,126.8],[-122.7,128.5],[-118.5,131.5],[-112.5,123.2],[-75.5,147.5],[-37.9,175.4]]],["w136853818","Lee Kong Chian School of Business",30.0,null,[[68.4,108.4],[63.6,114.9],[77.9,125.0],[82.7,126.2],[86.9,124.4],[106.6,104.2],[116.7,111.3],[132.8,125.6],[70.8,191.4],[63.6,184.9],[51.1,170.0],[32.5,168.3],[12.8,154.6],[51.1,97.1]]],["w175146817","",8.0,null,[[83.9,109.0],[90.5,113.7],[86.3,119.6],[79.7,114.9]]],["w136853913","School of Accountancy",30.0,null,[[-40.9,39.0],[-34.9,40.8],[-24.2,48.5],[-17.6,53.8],[-12.2,62.1],[-11.0,60.3],[-5.1,68.0],[-3.9,66.3],[4.5,73.4],[3.3,75.2],[5.1,75.2],[8.7,76.9],[20.0,86.4],[-15.2,132.7],[-29.5,114.3],[-28.9,113.7],[-31.3,107.8],[-17.0,91.2],[-28.9,82.3],[-38.5,93.0],[-39.1,91.2],[-40.9,91.8],[-45.7,74.0],[-43.9,71.6],[-46.3,62.7],[-47.5,62.1],[-49.8,47.3],[-45.7,41.4]]],["w743764345","",5.0,null,[[66.0,39.0],[70.8,42.5],[63.0,52.0],[58.8,48.5]]]]};
function smuBlock(B, M, P, y0, top, fh, fin){
  prismP(B.p(M.BASE), P, y0 - 5, y0 + 0.4, false);
  prismP(B.p(M.GLS), P, y0 + 0.4, top, false); capP(B.p(M.ROOF), P, top);
  for (let y = y0 + fh; y < top - 1; y += fh) bandP(B.p(M.BAND), P, y - 0.4, 0.6, 0.25);
  if (fin) for (const E of edgesF(P)){ if (E.L < 4) continue; const k = Math.round(E.L/fin); for (let j = 1; j < k; j++) slabP(B.p(M.FIN), rectO(j*E.L/k - 0.18, j*E.L/k + 0.18, y0 + 4.5, top - 0.6), E.F, 0, 0.7); }
  parP(B.p(M.BAND), P, top, top + 1.0, 0.25);
}
Object.assign(SITES, {sgsmu:{zh:'新加坡管理大学', en:'Singapore Management University', lat:1.29650, lon:103.84990, r:240, keep:SMU.keep, keepRoads:[11, 12], h:34,
  lt:{m:1, c:'#e4ecf4', k:0.55},
  build(ctx){
    const g = new THREE.Group(), B = mkB();
    const M = {GLS:{c:'#55697a', m:1, fh:4.2, cw:3.2}, BAND:'#e9e6df', FIN:'#b06a45', ROOF:'#8e918f', BASE:'#9c968b', LIB:{c:'#6d7f8c', m:1, fh:4.4, cw:3.6}, TERR:'#a65a3a', DECK:'#c9c2b3', SKY:{c:'#b6cdd6', op:0.55}};
    // ground: paving over the campus, the Campus Green lawn, the pedestrian concourse
    ctx.paint(SMU.keep, [192, 188, 178]);
    ctx.paint(SMU.green, [118, 156, 88]);
    ctx.paint(SMU.ped, [206, 200, 188]);
    for (const [osm, name, h, fl, P] of SMU.bld){
      let lo = Infinity, hi = -Infinity; for (const p of P){ const y = ctx.gy(p[0], p[1]); lo = Math.min(lo, y); hi = Math.max(hi, y); }
      const c = ctr(P), yc = ctx.gy(c[0], c[1]), base = Math.min(lo, yc), top = (lo + hi)/2 + h;
      if (osm === 'w719635727'){   // Innovation Bridge: a two-storey link raised over the ground on columns
        prismP(B.p(M.GLS), P, base + 4.5, base + 11, true); capP(B.p(M.ROOF), P, base + 11); bandP(B.p(M.FIN), P, base + 4.5, 0.8, 0.2);
        for (const [x, z] of alongP(P, 8)) LCyl(g, 0.3, 0.3, 4.6, x, ctx.gy(x, z) - 0.5, z, M.BAND, 6);
        continue; }
      if (h < 10){ prismP(B.p(M.BASE), P, base - 2, base + 0.4, false); prismP(B.p(M.TERR), P, base + 0.4, base + h, false); capP(B.p(M.ROOF), P, base + h); continue; }
      smuBlock(B, /Library/.test(name) ? Object.assign({}, M, {GLS:M.LIB}) : M, P, base, top, 4.2, /Connexion/.test(name) ? 0 : 3.0);
      if (/Connexion/.test(name)) for (let y = base + 4.2; y < top - 1; y += 4.2) bandP(B.p(M.TERR), P, y - 0.2, 0.35, 1.2);
      // roof terraces with planters on the larger blocks
      if (P.length >= 4 && h >= 24){ const Q = offP(P, 3.5); prismP(B.p(M.DECK), Q, top, top + 0.15, false); }
    }
    // trees round the Campus Green and along the concourse; lamps
    for (const [x, z] of alongP(SMU.green, 11)) ctx.tree(x, z, 3.2 + ctx.rng()*1.2, 'raintree');
    for (const [x, z] of alongP(SMU.ped, 14)) ctx.tree(x, z, 2.6, 'd');
    for (const [x, z] of alongP(SMU.ped, 9)) ctx.lamp(x, ctx.gy(x, z) + 4, z, [255, 226, 180]);
    for (const [x, z] of alongP(SMU.green, 9)) ctx.lamp(x, ctx.gy(x, z) + 4, z, [255, 226, 180]);
    B.flush(g); return g;
  }}});
// SMU Administration Building (81 Victoria Street, w136854009) and the block behind it (w175325173) in the separate university
// polygon at Victoria Street / Bras Basah Road; data heights (67 m, 27 m) are estimates.
LANDMARKS.sgsmu2 = {zh:'新加坡管理大学行政楼', en:'SMU Administration Building', cat:'new', r:60, h:67, label:false,
  lt:{m:1, c:'#e4ecf4', k:0.55},
  build(){
    const g = new THREE.Group(), B = mkB();
    const M = {GLS:{c:'#55697a', m:1, fh:4.2, cw:3.2}, BAND:'#e9e6df', FIN:'#b06a45', ROOF:'#8e918f', BASE:'#9c968b'};
    smuBlock(B, M, [[-21.1, 43.4], [-24.7, 41.1], [-27.2, 44.0], [-43.4, 30.2], [-2.6, -18.5], [17.1, -2.4]], 0, 67, 4.2, 3.0);
    smuBlock(B, M, [[6.9, -43.9], [17.0, -55.8], [43.3, -33.8], [17.0, -2.4], [-2.7, -18.4], [14.0, -38.0]], 0, 27, 4.2, 3.0);
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'sgsmu2', lat:1.296609, lon:103.852057, rot:0});
}
