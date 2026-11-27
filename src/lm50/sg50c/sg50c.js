// ===== lm50/sg50c: Civic & Bras Basah, Bugis, Beach Road, Kampong Glam, Marina Centre, upper river quays (City Brush lm50, real Singapore 1:1) =====
// One block; helpers inside. Only LANDMARKS and SG_PLACES are touched. All models use rot 0: local +x = east, +z = south; plans are the
// real OSM footprints / building parts (R/lm50/ref_sg50c.json, generated into D50C by SC/lm50/sg50c/gen.py) relative to each key's
// origin (the area centroid of its parts). Heights: the verified figure where one exists (cited per model), else the data (OSM) heights.
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
const pArchO = (hw, ht, n) => pArch(hw, ht, n || 5);
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
// ---- sg50c helpers ----
// pointed (lancet) arch outline, as the app's pointedArch (not in the offline kit)
const pArch = (hw, ht, n) => { const hs = ht - 1.732*hw, P = [[-hw, 0], [hw, 0], [hw, hs]]; for (let i = 1; i <= n; i++){ const a = PI/3*i/n; P.push([-hw + 2*hw*Math.cos(a), hs + 2*hw*Math.sin(a)]); } for (let i = n - 1; i >= 0; i--){ const a = PI/3*i/n; P.push([hw - 2*hw*Math.cos(a), hs + 2*hw*Math.sin(a)]); } return P; };
const DK = k => D50C[k], PK = (k, i) => D50C[k].p[i];
const placeK = (k, rot) => SG_PLACES.push({type:k, lat:D50C[k].o[0], lon:D50C[k].o[1], rot:rot || 0});
// a plan polygon clipped to a band along axis angle a (degrees): s0 <= d.p <= s1, t0 <= n.p <= t1 (n = d turned +90 deg)
const axisD = a => { const r = a*PI/180; return [[Math.cos(r), Math.sin(r)], [-Math.sin(r), Math.cos(r)]]; };
const band = (P, a, s0, s1, t0, t1) => { const [d, n] = axisD(a); return clipST(P, d, n, s0, s1, t0, t1); };
const stXZ = (a, s, t) => { const [d, n] = axisD(a); return [s*d[0] + t*n[0], s*d[1] + t*n[1]]; };
// glass curtain wall on plan P from y0 to y1: glass prism, spandrel band every fh, mullions every bay
function glassP(B, P, y0, y1, S){
  prismP(B.p(S.glass), P, y0, y1, false);
  const fh = S.fh || 4, md = S.md || 0.22, mw = S.mw || 0.09;
  if (S.band) for (let y = y0 + fh; y < y1 - 0.5; y += fh) bandP(B.p(S.band), P, y - (S.bh || 0.45), S.bh || 0.45, S.bd || 0.12);
  if (S.mull) for (const E of edgesF(P)){ if (E.L < 1.2) continue; const k = Math.max(1, Math.round(E.L/(S.bay || 1.5)));
    for (let j = 1; j < k; j++){ const u = j*E.L/k; slabP(B.p(S.mull), rectO(u - mw, u + mw, y0, y1), E.F, 0, md); }
    slabP(B.p(S.mull), rectO(-0.15, 0.15, y0, y1), E.F, 0, md*1.4); }
}
// masonry / rendered block with punched windows: wall prism, windows (fw x wh per bay per floor), optional floor bands
function punchP(B, P, y0, y1, S){
  prismP(B.p(S.wall), P, y0, y1, false);
  const fh = S.fh || 3.3, nf = Math.max(1, Math.round((y1 - y0 - (S.top || 0))/fh));
  winP(B.p(S.win), P, y0 + (S.skip || 0)*fh, nf - (S.skip || 0), fh, S.bay || 3.2, S.ww || 1.6, S.wh || fh*0.55, S.sill || fh*0.25, 0.05, S.minL || 2.5);
  if (S.band) for (let f = 1; f < nf; f++) bandP(B.p(S.band), P, y0 + f*fh - 0.25, 0.3, S.bd || 0.1);
}
// horizontal ribbon windows (one strip per floor on every edge)
function ribbonP(B, P, y0, y1, S){
  prismP(B.p(S.wall), P, y0, y1, false);
  const fh = S.fh || 3.3, nf = Math.max(1, Math.floor((y1 - y0 - (S.top || 0.6))/fh));
  for (const E of edgesF(P)){ if (E.L < (S.minL || 2)) continue;
    for (let f = S.skip || 0; f < nf; f++){ const v = y0 + f*fh + (S.sill || fh*0.3); shapeP(B.p(S.win), rectO(0.35, E.L - 0.35, v, v + (S.wh || fh*0.45)), E.F, 0.05); } }
}
// flat roof: cap, parapet, a few plant boxes (deterministic from the plan)
function roofF(B, P, y, S){
  capP(B.p(S.roof || S.wall), P, y);
  if (S.par !== 0) parP(B.p(S.parC || S.wall), P, y, y + (S.par || 1.0), 0.25);
  if (S.plant){ const c = ctr(P), A = Math.abs(sArea(P)); if (A > 300){ const w = Math.min(14, Math.sqrt(A)*0.3); boxP(B.p(S.plant), w, 2.6, w*0.7, c[0], y, c[1]); } }
}
// foundation plinth from -5 to y
const foundP = (B, P, y, col) => prismP(B.p(col), P, -5, y || 0.01, false);
// a lattice (trellis) ring of slender members round plan P between y0 and y1
function trellisP(B, P, y0, y1, col, step, r){
  for (const [x, z] of alongP(P, step || 3)) segP(B.p(col), [x, y0, z], [x, y1, z], r || 0.18, 4);
  for (let y = y0; y <= y1 + 0.01; y += (y1 - y0)/3) for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; segP(B.p(col), [a[0], y, a[1]], [b[0], y, b[1]], (r || 0.18)*1.2, 4); }
  const Q = alongP(P, step || 3); for (let i = 0; i < Q.length; i++){ const a = Q[i], b = Q[(i+1) % Q.length]; segP(B.p(col), [a[0], y0, a[1]], [b[0], y1, b[1]], (r || 0.18)*0.8, 4); }
}
// a deck polyline helper for bridges: points [x, z, y] -> per-vertex frames
function polyFr(L){ const out = []; for (let i = 0; i < L.length; i++){ const a = L[Math.max(0, i - 1)], b = L[Math.min(L.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; out.push({p:L[i], d:[dx/l, dz/l], n:[-dz/l, dx/l]}); } return out; }
// a ribbon along a polyline between lateral offsets o0..o1, from y(top)+dy0 to y+dy1 (closed box segments)
function ribbonL(o, L, o0, o1, dy0, dy1){ const F = polyFr(L);
  for (let i = 0; i < F.length - 1; i++){ const A = F[i], C = F[i+1];
    const P = (f, off, dy) => [f.p[0] + f.n[0]*off, f.p[2] + dy, f.p[1] + f.n[1]*off];
    const a0 = P(A, o0, dy0), a1 = P(A, o1, dy0), a2 = P(A, o1, dy1), a3 = P(A, o0, dy1), c0 = P(C, o0, dy0), c1 = P(C, o1, dy0), c2 = P(C, o1, dy1), c3 = P(C, o0, dy1);
    quadP(o, a3, a2, c2, c3); quadP(o, a0, c0, c1, a1); quadP(o, a0, a3, c3, c0); quadP(o, a1, c1, c2, a2); } }
// resample a polyline [[x, z, y], ...] every `step` m (linear)
function resL(L, step){ const out = [L[0]]; for (let i = 0; i < L.length - 1; i++){ const a = L[i], b = L[i+1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(l/step)); for (let k = 1; k <= n; k++){ const t = k/n; out.push([a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t, a[2] + (b[2] - a[2])*t]); } } return out; }
// extras: real buildings that a key's plan hull hides but that belong to no key - plain blocks at their data heights
// (an elevated deck - base above ground - becomes a slab on columns)
function xtraB(B, k, shop){
  for (const p of (DK(k).x || [])){
    const P = p[2], c = (p[4] && p[4].c) || '#d6d1c6', W = {c, m:0, lk:0.25};
    if (p[0] > 0.5){ prismP(B.p(W), P, p[0], p[1], true); capP(B.p((p[4] && p[4].rc) || '#b9b2a2'), P, p[1] + 0.02);
      for (const [x, z] of alongP(offP(P, 1.2), 9)) boxP(B.p('#c9c3b8'), 0.6, p[0], 0.6, x, 0, z); }
    else if (shop){ foundP(B, P, 0, '#8f8b84'); const nf = Math.max(2, Math.round(p[1]/4.0)); shopP(B, P, 0, nf, p[1]/nf, 4.6, shop); roofF(B, P, p[1], {wall:shop.WALL, roof:'#a9a59c', par:0.6, parC:shop.TRIM}); }
    else { foundP(B, P, 0, '#8f8b84'); punchP(B, P, 0, p[1], {wall:W, win:{c:'#3d4850', m:1, fh:3.4, cw:2.6}, fh:3.4, bay:3.0, ww:1.4, wh:1.6, sill:1.0});
      roofF(B, P, p[1], {wall:W, roof:'#a3a097', par:0.7, parC:'#e9e5dc'}); }
  }
}
// generated by SC/lm50/sg50c/gen.py from R/lm50/ref_sg50c.json (+ OSM rings): per key o = origin [lat, lon], r, p = [[base, top, ring, osm, colour], ...]
const D50C = {"sgguocomidtown":{"o":[1.297373,103.858008],"r":51,"p":[[0,99.6,[[-3.4,45.0],[32.3,8.0],[29.3,5.2],[38.3,-4.3],[3.6,-36.3],[-4.7,-27.5],[-10.2,-32.8],[-45.4,4.5]],"-",{}],[0,13.8,[[-4.7,-27.5],[29.3,5.2],[38.3,-4.3],[3.6,-36.3]],"w1075250784",{"c":"black","l":"4","mt":"metal"}]]},"sgndc":{"o":[1.298682,103.853414],"r":53,"p":[[0,20.0,[[11.6,31.9],[9.4,35.4],[17.1,41.9],[21.9,35.9],[24.1,37.2],[38.6,19.9],[37.4,9.9],[34.9,8.2],[36.1,6.9],[-8.1,-28.1],[-8.6,-26.8],[-24.1,-39.8],[-27.9,-39.3],[-39.1,-25.8],[-36.6,-23.8],[-39.1,-22.1],[-31.9,-16.3],[-40.9,-5.6],[-36.1,-2.1],[-31.9,-6.8],[-6.4,14.7],[-7.4,15.7]],"r3413595",{"l":"3","h":"20"}]]},"sgsspp":{"o":[1.297892,103.85129],"r":34,"p":[[0,20.0,[[-18.8,-14.7],[-17.8,-12.2],[-20.8,-9.9],[-19.5,-9.2],[-23.0,-5.2],[-11.8,4.8],[-9.3,2.6],[5.7,15.6],[6.7,14.3],[17.0,23.3],[25.2,13.8],[15.2,4.8],[15.7,3.8],[1.5,-9.2],[3.7,-12.2],[-7.5,-22.4],[-11.8,-18.2],[-12.3,-18.7],[-14.0,-16.4],[-16.5,-16.9]],"w155986468",{"l":"4","h":"20"}]]},"sgbugisjunction":{"o":[1.299879,103.855952],"r":73,"p":[[0,11.1,[[-60.2,2.7],[-44.7,13.9],[-54.2,26.4],[-36.9,38.9],[-27.4,25.9],[-8.9,40.2],[-16.7,50.2],[6.6,67.4],[48.6,11.2],[43.1,-12.1],[1.3,-53.6],[-14.2,-50.6]],"w172364977",{"l":"3"}],[9.9,50.1,[[-33.4,-19.8],[-24.9,-13.3],[-26.7,-10.8],[15.1,20.7],[17.3,17.7],[25.8,24.7],[33.6,14.7],[-26.2,-29.8]],"w427133450",{"l":"15","ml":"3"}],[9.9,43.5,[[33.1,9.9],[36.1,12.2],[46.1,0.4],[-2.9,-48.8],[-20.7,-25.8],[30.6,12.9]],"w427133463",{"l":"13","ml":"3"}]]},"sgpeninsula":{"o":[1.292332,103.850824],"r":52,"p":[[16.5,20.4,[[-20.6,-8.5],[-29.6,6.2],[-29.6,11.0],[-1.6,27.5],[3.1,26.5],[12.1,10.5],[12.1,9.2],[9.6,12.7],[4.9,14.5],[-19.6,-0.3],[-20.6,-5.0],[-18.4,-8.5]],"w257193900",{"c":"lightgrey","l":"6","ml":"5","mt":"concrete","rc":"grey"}],[0,17.1,[[43.9,-14.8],[26.9,-25.8],[25.4,-25.0],[24.4,-25.0],[23.4,-25.5],[22.6,-26.0],[22.4,-27.0],[22.4,-28.0],[22.9,-29.0],[-6.4,-45.3],[-43.4,17.5],[8.6,46.5]],"w1075234631",{"c":"lightgrey","l":"5","mt":"concrete","rc":"grey"}],[16.5,111.0,[[4.9,14.5],[9.6,12.7],[24.1,-11.5],[22.9,-16.8],[-1.1,-29.3],[-5.9,-27.5],[-20.6,-5.0],[-19.6,-0.3]],"w257193902",{"c":"lightgrey","l":"30","ml":"5","mt":"concrete","rc":"white","h":"111"}],[4.2,17.1,[[22.9,-29.0],[22.4,-28.0],[22.4,-27.0],[22.6,-26.0],[23.4,-25.5],[24.4,-25.0],[25.4,-25.0],[26.9,-25.8],[43.9,-14.8],[44.4,-15.8],[31.1,-24.0],[33.1,-27.0],[25.9,-31.0],[24.1,-28.3]],"-",{}]]},"sglourdes":{"o":[1.30318,103.856044],"r":24,"p":[[0,14.2,[[2.4,-13.0],[-16.1,3.8],[-11.8,8.0],[-15.3,11.5],[-12.3,15.0],[-8.8,11.5],[-4.6,15.5],[13.2,-1.5],[15.7,-8.7],[10.2,-14.7]],"w191010560",{}]]},"sgtextile":{"o":[1.303673,103.861444],"r":32,"p":[[23.1,83.1,[[-26.6,-0.5],[-11.6,23.7],[26.7,0.0],[11.7,-23.5]],"w427139534",{"l":"25","ml":"7"}],[0,23.1,[[-26.3,-0.5],[-11.6,23.7],[26.4,0.2],[11.4,-23.5]],"w427139534",{"l":"25","ml":"7"}]]},"sgriversidepoint":{"o":[1.289328,103.844119],"r":94,"p":[[0,13.8,[[1.8,-9.9],[-6.9,-24.7],[-24.9,-2.7],[-11.9,6.1]],"w327014374",{"l":"4","rs":"gabled"}],[0,13.8,[[-16.7,-40.2],[-39.9,-13.4],[-24.9,-2.7],[-6.9,-24.7]],"w327014370",{"l":"4","rs":"gabled"}],[0,13.8,[[-22.7,-54.4],[-28.4,-52.4],[-36.2,-57.2],[-54.2,-29.4],[-52.4,-22.2],[-39.9,-13.4],[-16.7,-40.2]],"w327014377",{"l":"4","rs":"gabled"}],[0,13.8,[[46.6,55.3],[58.6,66.6],[74.1,48.3],[59.8,41.1]],"w327014375",{"l":"4","rs":"gabled"}],[0,13.8,[[33.6,44.1],[46.6,55.3],[59.8,41.1],[43.8,32.3]],"w327014372",{"l":"4","rs":"gabled"}],[0,13.8,[[21.1,32.3],[33.6,44.1],[43.8,32.3],[30.1,21.6]],"w327014371",{"l":"4","rs":"gabled"}],[0,13.8,[[-7.7,10.8],[16.3,29.3],[27.6,16.3],[8.6,-5.7]],"w327014373",{"l":"4","rs":"gabled"}]]},"sgcentennial":{"o":[1.293422,103.860282],"r":41,"p":[[0,158.0,[[34.8,7.5],[32.3,2.3],[23.3,-10.2],[15.0,-16.7],[13.3,-14.2],[8.5,-15.0],[6.8,-17.2],[7.3,-21.0],[-1.7,-25.0],[-13.7,-26.2],[-24.5,-25.7],[-24.5,-24.5],[-23.2,-24.5],[-23.2,-22.0],[-26.7,-21.5],[-28.5,-15.5],[-32.2,-11.5],[-31.0,-9.0],[-34.5,-8.5],[-28.5,4.0],[-21.5,12.3],[-14.2,16.5],[-13.7,15.3],[-11.7,14.8],[-8.7,15.3],[-6.5,17.8],[-6.5,21.3],[9.0,26.5],[24.5,26.0],[24.5,24.8],[22.8,24.3],[22.8,22.5],[26.3,21.8],[27.5,17.8],[31.8,12.3],[31.3,8.8],[32.3,7.5],[33.0,8.3]],"w155988210",{"c":"#757974","l":"37","mt":"concrete","h":"158"}]]},"sgritzcarlton":{"o":[1.290532,103.860086],"r":62,"p":[[0,10.0,[[-49.2,-17.3],[45.0,34.4],[53.5,20.2],[-30.7,-26.8],[-30.0,-27.3],[-40.2,-33.3]],"w591619207",{"c":"#c1ccd3","l":"2","mt":"metal","h":"10"}],[30.0,140.0,[[-30.7,-26.8],[-30.0,-27.3],[-40.2,-33.3],[-49.2,-17.3],[45.0,34.4],[53.5,20.2]],"w591619207",{"c":"#c1ccd3","l":"2","mt":"metal","h":"10"}],[0,30.0,[[35.3,28.9],[43.3,14.7],[-30.7,-26.8],[-30.5,-27.6],[-40.0,-33.1],[-49.0,-17.6],[-49.0,-17.1]],"w591619207",{"c":"#c1ccd3","l":"2","mt":"metal","h":"10"}],[10.0,30.0,[[36.3,28.9],[45.0,34.4],[53.5,20.2],[44.0,14.7]],"-",{}],[10.0,30.0,[[-9.7,-14.8],[-18.2,-0.6],[-9.2,4.7],[-0.7,-10.1]],"-",{}],[10.0,30.0,[[-40.2,-33.3],[-49.2,-17.3],[-39.0,-11.8],[-30.0,-27.3]],"-",{}],[10.0,30.0,[[2.8,11.7],[11.8,15.9],[20.8,2.2],[11.0,-3.1]],"-",{}]]},"sgprinsep":{"o":[1.30173,103.851095],"r":26,"p":[[0,13.1,[[-15.6,-3.1],[-0.9,8.9],[-7.9,17.6],[-3.9,20.6],[18.9,-6.6],[15.4,-9.6],[9.9,-3.1],[-5.6,-15.6]],"w172596749",{}]],"x":[[0,6.6,[[-3.9,9.4],[-15.1,0.4],[-20.6,7.1],[-9.9,16.6]],"-",{}]]},"sgwesley":{"o":[1.297128,103.847396],"r":51,"p":[[0,13.8,[[25.9,24.8],[34.2,30.0],[41.9,18.8],[33.7,13.0]],"w1066693836",{"c":"lightgrey","l":"4","mt":"metal"}],[0,13.8,[[4.9,16.5],[10.9,20.0],[11.7,18.3],[14.7,20.5],[15.2,19.5],[25.4,26.0],[31.9,16.5],[22.4,10.5],[24.7,7.0],[15.7,1.0]],"w1066693840",{"c":"brown","l":"4","mt":"brick","rc":"red"}],[0,13.8,[[0.2,1.5],[-4.6,-1.2],[-11.1,8.3],[-0.8,15.3],[0.2,13.5],[4.9,16.5],[15.7,1.0],[4.9,-6.0]],"w1066693839",{"c":"white","l":"4","mt":"concrete","rc":"lightgrey"}],[0,13.8,[[-10.6,-2.0],[-17.1,-2.5],[-21.8,1.0],[-20.6,3.5],[-14.6,7.5],[-13.6,5.8],[-11.1,8.3],[-4.6,-1.2],[0.2,1.5],[9.9,-12.5],[7.9,-13.2],[10.9,-18.0],[3.2,-22.7],[1.4,-19.2]],"w1066693843",{"c":"white","l":"4","mt":"concrete","rc":"darkgrey"}],[0,17.1,[[-27.8,-21.0],[-27.8,-16.7],[-29.1,-16.2],[-30.8,-18.5],[-33.8,-16.7],[-32.1,-14.5],[-35.6,-15.0],[-36.8,-5.0],[-29.6,-4.2],[-24.3,2.8],[-17.1,-2.5],[-10.6,-2.0],[-9.8,-8.5],[-13.6,-9.0],[-12.8,-19.2]],"w1066693838",{"c":"brown","l":"5","mt":"brick"}],[0,7.2,[[-2.8,-22.0],[-12.3,-22.7],[-13.6,-9.0],[-9.8,-8.5],[-10.6,-2.0],[1.4,-19.2]],"w1066693837",{"c":"white","l":"2","mt":"concrete"}],[0,13.8,[[13.4,-21.0],[7.9,-13.2],[11.7,-10.7],[16.4,-18.5]],"w1066693842",{"c":"white","l":"4","mt":"concrete","rc":"lightgrey"}]]},"sgparkroyalbeach":{"o":[1.300146,103.860602],"r":85,"p":[[4.2,21.0,[[-5.3,-11.5],[-22.0,1.5],[-31.3,6.0],[-28.0,10.3],[-19.0,5.8],[-1.8,-7.7]],"-",{}],[0,21.0,[[-31.3,6.0],[-22.0,1.5],[-5.3,-11.5],[-8.0,-14.5],[-32.5,4.5]],"-",{}],[0,21.0,[[-1.8,-7.7],[-19.0,5.8],[-28.0,10.3],[-23.5,15.8],[-44.3,21.0],[-63.5,24.0],[-62.8,43.0],[-36.0,38.3],[-14.5,30.5],[4.5,19.3],[25.0,-0.2],[42.7,-21.0],[63.0,-50.0],[47.0,-58.5],[17.7,-18.7],[2.2,-3.2]],"w47134224",{"l":"6"}]]},"sgparkroyalbeach2":{"o":[1.299793,103.860762],"r":42,"p":[[0,106.8,[[-32.9,-4.2],[-31.9,12.3],[-17.4,12.3],[-3.2,15.8],[6.3,22.5],[16.6,33.0],[26.1,26.5],[18.8,13.0],[16.6,1.8],[16.6,-12.0],[20.6,-27.5],[6.3,-33.2],[-0.2,-22.7],[-18.7,-7.7]],"w190945737",{"l":"32"}]]},"sggoldenlandmark":{"o":[1.302036,103.857829],"r":57,"p":[[0,11.1,[[32.5,-18.9],[31.3,-18.2],[25.0,-16.4],[19.8,-17.9],[18.8,-18.4],[11.0,-24.7],[7.5,-30.4],[7.3,-31.7],[7.3,-34.4],[9.0,-39.2],[-1.0,-47.9],[-50.5,8.3],[0.3,52.3],[13.5,49.3],[45.8,12.6],[28.3,-2.4],[38.5,-13.7]],"w47134068",{"l":"3"}],[9.9,67.2,[[-32.0,-10.7],[-30.2,-9.4],[-33.2,-6.4],[-27.7,-1.7],[-24.7,-4.7],[-18.7,0.1],[-2.2,-20.2],[4.5,-20.2],[23.0,-2.9],[29.0,-9.4],[30.8,-7.2],[36.0,-12.4],[2.0,-42.7],[-5.0,-34.4],[-8.7,-37.4]],"w190945731",{"l":"20","ml":"3"}],[4.2,11.1,[[28.3,-22.7],[25.0,-21.7],[21.8,-22.7],[14.8,-28.4],[12.3,-32.4],[12.3,-33.2],[13.0,-35.7],[9.0,-39.2],[7.3,-34.4],[7.3,-31.7],[7.5,-30.4],[11.0,-24.7],[18.8,-18.4],[24.3,-16.4],[25.8,-16.4],[31.3,-18.2],[32.5,-18.9]],"-",{}],[0,11.1,[[13.0,-35.7],[12.3,-33.2],[12.3,-32.4],[14.8,-28.4],[21.8,-22.7],[25.0,-21.7],[28.3,-22.7]],"-",{}]]},"sghotelgp":{"o":[1.297395,103.852633],"r":41,"p":[[0,13.8,[[-9.0,32.3],[6.0,14.6],[-17.2,-4.4],[-32.2,13.3]],"w429681543",{"l":"4"}],[0,68.0,[[6.0,14.6],[31.8,-16.2],[11.3,-32.9],[-15.0,-1.9]],"w429681542",{"l":"16","h":"68"}]],"x":[[0,10.7,[[-23.0,-3.2],[-30.0,5.6],[-27.5,7.6],[-20.2,-0.9]],"-",{}]]},"sgaliwal":{"o":[1.302658,103.861036],"r":37,"p":[[0,6.1,[[-0.2,22.6],[4.6,30.4],[23.1,18.4],[18.3,10.6]],"w190945113",{}],[0,12.7,[[-7.4,-30.9],[-25.9,-18.9],[-21.2,-10.6],[-9.9,-17.6],[-4.9,-10.1],[-15.7,-3.4],[-9.9,5.9],[1.6,-0.6],[6.3,7.1],[-5.7,14.4],[-0.2,22.6],[18.3,10.6]],"w190944927",{}]]},"sgchildrensmuseum":{"o":[1.292841,103.84876],"r":25,"p":[[0,20.0,[[6.1,-17.0],[-14.2,-3.2],[-9.4,3.3],[-15.4,8.0],[-8.9,17.5],[16.8,-0.2],[15.1,-4.0]],"w172368089",{"h":"20"}]]},"sgrafflesh":{"o":[1.301173,103.857197],"r":71,"p":[[19.8,46.8,[[-26.1,-33.1],[-25.4,-28.4],[2.6,-2.4],[-29.6,33.9],[-11.1,50.4],[18.6,17.4],[22.4,21.4],[28.1,21.4],[50.4,-2.9],[50.9,-8.1],[-3.4,-50.9],[-9.4,-51.6]],"w427133451",{"c":"#d6cec4","l":"14","ml":"6","mt":"stone","rc":"#d6cec4","rs":"flat"}],[0,66.6,[[-65.4,8.9],[-45.9,27.4],[-11.9,-8.1],[-31.4,-26.6]],"w560277991",{"c":"#455241","l":"20","mt":"glass"}],[6.6,20.4,[[-11.9,-8.1],[-45.9,27.4],[-6.4,60.6],[0.1,59.9],[54.6,-0.6],[54.6,-7.1],[-8.1,-58.1],[-19.6,-57.4],[-39.9,-35.6]],"w560277989",{"c":"#d3bba3","l":"2","mt":"stone"}],[0,7.2,[[-11.9,-8.1],[-45.9,27.4],[-6.4,60.6],[0.1,59.9],[54.6,-0.6],[54.6,-7.1],[-8.1,-58.1],[-19.6,-57.4],[-39.9,-35.6]],"w560277989",{"c":"#d3bba3","l":"2","mt":"stone"}]]},"sgmarinasquare":{"o":[1.291243,103.857128],"r":180,"p":[[9.9,13.8,[[-24.5,73.3],[40.8,111.0],[68.8,63.8],[3.8,25.0]],"w742205649",{"c":"#cebc9b","l":"4","ml":"3","mt":"concrete","rc":"#B6B9A4","rs":"flat"}],[13.2,17.1,[[53.3,37.5],[34.0,26.3],[32.3,29.3],[51.5,40.5]],"w743776033",{"c":"#EDDDCD","l":"5","ml":"4","mt":"concrete","rc":"#EDDDCD","rs":"flat"}],[13.2,17.1,[[47.8,2.5],[34.0,26.3],[53.3,37.5],[67.0,13.8]],"w743776034",{"c":"#1F193A","l":"5","ml":"4","mt":"glass","rc":"#1F193A","rs":"flat"}],[13.2,17.1,[[46.0,-8.0],[26.3,25.8],[32.3,29.3],[47.8,2.5],[67.0,13.8],[51.5,40.5],[58.5,44.0],[77.8,11.0]],"w743776035",{"c":"#EDDDCD","l":"5","ml":"4","mt":"concrete","rc":"#EDDDCD","rs":"flat"}],[9.9,13.8,[[68.8,63.8],[73.0,56.5],[89.5,66.8],[120.0,14.5],[38.3,-33.0],[3.8,25.0]],"w742205650",{"c":"#cebc9b","l":"4","ml":"3","mt":"concrete","rc":"#C9B088","rs":"flat"}],[4.2,10.5,[[-129.2,-25.5],[-125.0,-20.7],[-127.5,-11.7],[-133.7,-10.2],[-135.2,-4.7],[-134.7,-4.7],[-133.7,-4.7],[-124.7,-7.2],[-123.5,-8.2],[-119.5,-20.7],[-119.5,-21.7],[-119.5,-22.5],[-120.0,-23.2],[-126.2,-30.0],[-127.5,-30.7]],"-",{}],[0,10.5,[[-133.7,-10.2],[-127.5,-11.7],[-125.0,-20.7],[-129.2,-25.5]],"-",{}],[9.9,13.8,[[-13.7,-118.5],[-34.5,-130.2],[-44.2,-114.7],[-22.7,-102.5]],"w743776028",{"c":"#768B97","l":"4","ml":"3","mt":"concrete","rc":"#768B97","rs":"skillion"}],[9.9,17.1,[[15.0,-17.5],[-7.0,2.5],[-19.7,12.0],[3.8,25.0],[25.8,-11.0]],"w742205651",{"c":"#cebc9b","l":"5","ml":"3","mt":"concrete","rc":"#3A511D"}],[0,10.5,[[-127.5,-30.7],[-126.2,-30.0],[-120.0,-23.2],[-119.5,-22.5],[-119.5,-21.7],[-119.5,-20.7],[-123.5,-8.2],[-124.7,-7.2],[-133.7,-4.7],[-135.2,-4.7],[-136.7,0.3],[-136.0,4.3],[-134.7,8.5],[-132.5,11.5],[-59.7,70.8],[-49.0,58.3],[40.8,111.0],[73.0,56.5],[89.5,66.8],[120.0,14.5],[162.5,39.3],[161.3,33.5],[175.0,11.0],[106.3,-26.5],[66.3,-50.2],[52.0,-25.2],[-30.5,-74.5],[-22.0,-88.2],[-39.2,-98.2],[-33.5,-108.2],[-22.7,-102.5],[-13.7,-118.5],[-34.5,-130.2],[-54.2,-98.2],[-81.7,-111.7],[-76.2,-117.7],[-68.5,-122.0],[-53.0,-122.0],[-44.2,-137.2],[-53.7,-139.2],[-63.2,-139.2],[-77.0,-133.7],[-89.5,-125.0],[-94.7,-118.5],[-99.0,-110.0],[-105.5,-85.7],[-110.5,-88.2]],"w742205655",{"c":"#cebc9b","l":"3","mt":"concrete","rc":"#C3AC8C","rs":"flat"}],[9.9,17.1,[[-30.5,-74.5],[-88.2,-106.5],[-108.5,-48.5],[-54.7,-17.5],[-50.7,-36.0],[-44.7,-52.0],[-56.7,-59.0],[-49.5,-72.2],[-36.2,-64.5]],"w742205652",{"c":"#cebc9b","l":"5","ml":"3","mt":"concrete","rc":"#3A511D","rs":"flat"}]],"x":[[0,8.0,[[-108.5,-93.6],[-110.5,-87.9],[-105.5,-85.6],[-103.8,-90.9]],"-",{}],[0,15.5,[[47.8,-79.6],[28.0,-90.4],[23.3,-82.1],[43.8,-71.4]],"-",{}],[0,8.6,[[13.3,-98.6],[5.5,-102.9],[0.8,-93.9],[8.5,-89.9]],"-",{}]]},"sgmarinasquare2":{"o":[1.292126,103.858077],"r":76,"p":[[3.3,10.5,[[3.2,67.0],[-37.1,43.7],[-39.3,47.5],[0.7,71.2]],"-",{}],[0,3.3,[[3.2,67.0],[-36.8,43.7],[-38.8,47.0],[0.9,70.7]],"-",{}],[5.0,10.5,[[-37.1,43.7],[3.2,67.0],[5.9,62.7],[-34.3,39.2]],"-",{}],[3.3,10.5,[[-34.3,39.2],[5.9,62.7],[17.4,44.2],[-23.3,20.7]],"-",{}],[0,3.3,[[17.4,44.2],[-23.3,20.7],[-34.3,39.2],[5.9,62.5]],"-",{}],[5.0,10.5,[[-23.3,20.7],[17.4,44.2],[23.4,34.7],[-17.6,11.2]],"-",{}],[0,3.3,[[-17.6,11.2],[23.4,34.7],[27.2,28.5],[-13.6,4.5]],"-",{}],[3.3,10.5,[[-17.6,11.2],[23.4,34.7],[27.7,28.0],[-13.1,3.7]],"-",{}],[0,10.5,[[42.4,3.0],[28.2,-5.3],[49.7,-42.5],[19.9,-59.3],[13.9,-62.3],[1.4,-63.3],[-11.1,-60.3],[-17.1,-57.5],[-21.3,-53.8],[-27.3,-43.8],[-30.3,-36.8],[-30.8,-27.3],[-30.3,-18.8],[-28.6,-12.3],[-24.3,-6.5],[-13.1,3.7],[27.7,28.0]],"w743776030",{"c":"#cebc9b","l":"3","mt":"concrete","rc":"#3D5F2C","rs":"flat"}],[9.9,13.8,[[-7.1,-5.8],[-12.3,-9.3],[-17.1,-14.8],[-20.8,-21.8],[-20.1,-36.0],[-17.1,-42.5],[-13.1,-47.3],[-7.1,-50.3],[0.7,-51.5],[9.2,-51.0],[16.9,-46.8],[23.4,-57.5],[13.9,-62.3],[7.4,-63.3],[-4.6,-62.8],[-11.1,-60.3],[-17.1,-57.5],[-21.3,-53.8],[-23.8,-50.3],[-30.3,-36.8],[-30.8,-27.3],[-30.3,-18.8],[-28.6,-12.3],[-24.3,-6.5],[-13.1,3.7]],"w743776029",{"c":"#9A9DA5","l":"4","ml":"3","mt":"concrete","rc":"#9A9DA5","rs":"flat"}]]},"sgmarinasquare3":{"o":[1.290495,103.858622],"r":94,"p":[[0,13.8,[[-23.0,31.3],[-6.3,41.6],[-3.8,37.3],[52.2,68.8],[61.2,65.3],[60.7,-5.9],[14.7,-32.2]],"w743776031",{"c":"#cebc9b","l":"4","mt":"concrete","rc":"#B6B9A4"}],[0,17.1,[[-78.5,-13.2],[-25.3,17.8],[7.0,-36.7],[-46.3,-68.2]],"w743776032",{"c":"#cebc9b","l":"5","mt":"concrete","rc":"#B6B9A4","rs":"flat"}]]},"sgmarinamandarin":{"o":[1.291366,103.85688],"r":68,"p":[[56.1,63.3,[[-19.0,-6.3],[-28.0,27.5],[-9.5,38.2],[16.3,12.7],[32.3,-9.8],[-6.5,-31.8]],"w742205657",{"c":"#A8AF9F","l":"19","ml":"17","rc":"#A8AF9F"}],[49.5,56.7,[[-15.5,-18.0],[-20.2,-6.8],[-24.5,9.2],[-28.0,27.5],[-9.5,38.2],[17.5,12.7],[25.8,2.7],[34.0,-8.5],[-7.7,-32.3]],"w742205664",{"c":"#A8AF9F","l":"17","ml":"15","rc":"#A8AF9F"}],[42.9,50.1,[[-8.7,-33.5],[-21.5,-7.5],[-25.0,9.2],[-28.0,27.5],[-9.5,38.2],[17.5,13.2],[27.0,3.2],[35.3,-8.0]],"w742205658",{"c":"#A8AF9F","l":"15","ml":"13","rc":"#A8AF9F"}],[0,36.3,[[36.5,-6.5],[-10.7,-33.8],[-18.5,-19.3],[-22.0,-8.0],[-26.2,8.7],[-28.0,27.5],[-9.2,38.2],[18.5,14.0],[28.3,4.5]],"w742205663",{"c":"#A8AF9F","l":"13","ml":"11","rc":"#A8AF9F"}],[36.3,43.5,[[-18.5,-19.3],[-22.0,-8.0],[-26.2,8.7],[-28.0,27.5],[-9.5,38.2],[18.5,14.0],[28.3,4.5],[37.0,-6.8],[-10.7,-34.0]],"w742205663",{"c":"#A8AF9F","l":"13","ml":"11","rc":"#A8AF9F"}],[23.1,30.3,[[-21.5,-21.0],[-25.0,-9.3],[-28.0,8.0],[-28.0,27.5],[-9.5,38.2],[19.8,15.2],[30.5,5.7],[40.8,-5.0],[-14.7,-37.0]],"w742205662",{"c":"#A8AF9F","l":"9","ml":"7","rc":"#A8AF9F"}],[9.9,23.7,[[-23.2,-22.3],[-26.2,-9.8],[-29.2,7.5],[-28.0,27.5],[-9.5,38.2],[20.5,16.2],[42.5,-3.8],[-17.2,-38.3]],"w742205661",{"c":"#A8AF9F","l":"7","ml":"3","rc":"#A8AF9F"}],[69.3,73.2,[[-3.5,-13.3],[-15.5,20.5],[-7.0,24.7],[16.8,-4.5],[23.3,-14.5],[4.3,-25.8]],"w742205647",{"c":"#26272B","l":"22","ml":"21","mt":"concrete","rc":"#26272B","rs":"flat"}],[72.6,76.5,[[1.3,-18.0],[0.8,-13.3],[1.3,-10.3],[3.0,-7.5],[8.5,-5.0],[15.5,-6.8],[18.0,-8.5],[22.3,-15.8],[5.5,-25.3]],"w742205648",{"c":"#FAF5E1","l":"23","ml":"22","mt":"concrete","rc":"#FAF5E1","rs":"flat"}],[9.9,76.5,[[58.5,-6.8],[54.5,-9.8],[56.3,-12.8],[50.8,-16.3],[52.5,-19.3],[-7.0,-53.8],[-8.7,-50.8],[-22.0,-58.5],[-29.2,-45.3],[53.3,2.7]],"w742205656",{"c":"#E5DCD5","l":"23","ml":"3","mt":"concrete","rc":"#F1E7CE","rs":"flat"}],[62.7,69.9,[[-17.7,-5.5],[-28.0,27.5],[-9.5,38.2],[16.3,12.2],[31.3,-10.3],[-5.2,-31.0]],"w742205665",{"c":"#A8AF9F","l":"21","ml":"19","rc":"#A8AF9F"}],[29.7,36.9,[[-13.0,-35.8],[-20.2,-20.5],[-23.7,-8.5],[-26.7,8.0],[-28.0,27.5],[-9.5,38.2],[18.5,15.2],[29.3,5.0],[39.0,-5.5]],"w742205659",{"c":"#A8AF9F","l":"11","ml":"9","rc":"#A8AF9F"}],[0,29.7,[[-13.0,-35.8],[-20.2,-20.5],[-23.7,-8.5],[-26.7,8.0],[-28.0,27.5],[-9.2,38.2],[18.5,15.2],[29.3,5.0],[38.8,-5.3],[38.5,-5.8]],"w742205659",{"c":"#A8AF9F","l":"11","ml":"9","rc":"#A8AF9F"}]]},"sgmandarinoriental":{"o":[1.290664,103.858309],"r":56,"p":[[69.3,76.5,[[-3.0,19.9],[0.5,31.9],[14.8,27.6],[11.3,15.9]],"w741934151",{"c":"#EBEEEB","l":"23","ml":"21","rc":"#9FC8B2"}],[0,73.2,[[-49.0,14.6],[11.8,50.1],[49.5,-13.4],[41.8,-17.9],[9.5,36.6],[-43.7,5.6]],"w741934166",{"c":"#7E8997","l":"22","mt":"concrete","rc":"#9FC8B2"}],[16.5,69.9,[[-39.5,0.9],[-39.0,4.6],[-43.7,5.6],[9.5,36.6],[41.8,-17.9],[37.0,-16.1],[35.0,-21.6],[29.8,-19.9],[31.0,-15.6],[26.8,-14.4],[28.0,-10.4],[23.3,-8.6],[25.0,-4.4],[20.3,-3.1],[21.5,0.9],[-16.7,12.9],[-18.0,8.6],[-22.2,9.9],[-23.5,5.6],[-28.2,6.9],[-29.2,2.9],[-33.5,3.9],[-35.2,-0.1]],"w393090402",{"c":"#EBEEEB","l":"21","ml":"5","mt":"concrete","rc":"#9FC8B2"}],[56.1,60.0,[[16.5,0.4],[7.8,2.9],[7.0,0.9],[2.3,2.1],[3.0,4.6],[0.5,5.1],[-0.0,2.9],[-4.2,4.6],[-3.7,6.4],[-12.7,9.4],[-12.0,11.1],[17.3,2.1]],"w741934152",{"c":"#EBEEEB","l":"18","ml":"17","mt":"concrete","rc":"#EBEEEB"}],[59.4,66.6,[[16.5,0.4],[-12.7,9.4],[-12.0,11.1],[17.3,2.1]],"w741934153",{"c":"#EBEEEB","l":"20","ml":"18","mt":"concrete","rc":"#EBEEEB"}],[52.8,56.7,[[16.5,0.4],[11.8,1.6],[11.3,-0.1],[7.0,0.9],[6.5,-1.4],[1.8,0.4],[2.3,2.1],[-0.0,2.9],[-0.7,0.9],[-5.0,2.1],[-4.2,4.6],[-9.0,5.6],[-8.5,8.1],[-12.7,9.4],[-12.0,11.1],[17.3,2.1]],"w741934154",{"c":"#EBEEEB","l":"17","ml":"16","mt":"concrete","rc":"#EBEEEB"}],[49.5,53.4,[[16.0,-1.9],[15.5,-3.9],[10.8,-2.6],[10.0,-4.9],[5.8,-3.1],[4.8,-5.6],[0.5,-4.4],[1.0,-1.9],[-1.2,-1.4],[-2.0,-3.1],[-6.7,-1.9],[-6.0,0.4],[-10.2,1.6],[-9.7,3.4],[-13.7,5.1],[-13.2,6.9],[-18.0,8.6],[-16.7,12.9],[21.5,0.9],[20.3,-3.1]],"w741934156",{"c":"#EBEEEB","l":"16","ml":"15","mt":"concrete","rc":"#EBEEEB"}],[46.2,50.1,[[15.5,-3.9],[14.3,-6.1],[10.0,-4.9],[9.5,-6.6],[4.8,-5.6],[4.0,-7.4],[-0.0,-6.1],[0.5,-4.4],[-2.0,-3.1],[-2.5,-5.6],[-7.2,-4.4],[-6.7,-1.9],[-10.7,-0.9],[-10.2,1.6],[-14.5,2.9],[-13.7,5.1],[-18.5,6.4],[-16.7,12.9],[21.5,0.9],[19.5,-5.6]],"w741934157",{"c":"#EBEEEB","l":"15","ml":"14","mt":"concrete","rc":"#EBEEEB"}],[0,46.2,[[20.3,0.6],[19.5,-3.1],[20.0,-3.9],[19.8,-5.1],[15.5,-3.9],[14.3,-6.1],[10.0,-4.9],[9.3,-6.6],[4.8,-5.6],[4.0,-7.4],[-0.0,-6.1],[0.5,-4.4],[-2.0,-3.1],[-2.7,-5.4],[-7.0,-4.4],[-6.7,-1.9],[-10.7,-0.9],[-10.2,1.6],[-14.2,2.6],[-13.7,5.1],[-18.5,6.4],[-16.2,12.1]],"w741934157",{"c":"#EBEEEB","l":"15","ml":"14","mt":"concrete","rc":"#EBEEEB"}],[39.6,43.5,[[19.0,-7.4],[17.8,-9.6],[13.5,-7.9],[13.0,-10.4],[8.8,-9.1],[8.3,-10.9],[3.5,-9.6],[3.0,-12.1],[-1.2,-10.4],[-0.7,-8.6],[-3.0,-7.4],[-3.7,-9.6],[-8.5,-8.6],[-7.7,-6.1],[-12.0,-4.9],[-11.5,-2.6],[-16.2,-1.4],[-15.7,0.9],[-19.7,2.1],[-19.2,4.6],[-23.5,5.6],[-22.2,9.9],[-18.0,8.6],[-16.7,12.9],[21.5,0.9],[20.3,-3.1],[25.0,-4.4],[23.3,-8.6]],"w741934159",{"c":"#EBEEEB","l":"13","ml":"12","mt":"concrete","rc":"#EBEEEB"}],[33.0,36.9,[[22.5,-10.9],[22.0,-13.4],[17.3,-11.4],[16.5,-13.9],[12.5,-12.6],[11.8,-14.4],[7.8,-13.4],[7.0,-15.1],[2.3,-13.9],[1.8,-16.1],[-3.0,-14.4],[-2.0,-12.6],[-5.0,-12.1],[-5.5,-13.9],[-9.7,-12.6],[-9.0,-10.4],[-13.7,-9.1],[-12.7,-6.6],[-17.5,-5.6],[-16.7,-3.9],[-21.0,-1.9],[-20.5,-0.1],[-25.2,1.6],[-24.5,3.4],[-28.7,5.1],[-28.2,6.9],[-23.5,5.6],[-22.2,9.9],[-18.0,8.6],[-16.7,12.9],[21.5,0.9],[20.3,-3.1],[25.0,-4.4],[23.3,-8.6],[28.0,-10.4],[27.3,-12.1]],"w741934161",{"c":"#EBEEEB","l":"11","ml":"10","mt":"concrete","rc":"#EBEEEB"}],[29.7,33.6,[[22.0,-13.4],[21.5,-15.1],[16.5,-13.9],[16.0,-15.6],[11.8,-14.4],[11.3,-16.9],[7.0,-15.1],[5.8,-17.4],[1.8,-16.1],[1.0,-17.9],[-3.7,-16.9],[-3.0,-14.4],[-5.5,-13.9],[-6.0,-16.1],[-10.2,-14.4],[-9.7,-12.6],[-14.5,-11.4],[-13.7,-9.1],[-18.0,-7.9],[-17.5,-5.6],[-21.5,-4.4],[-21.0,-1.9],[-25.7,-0.9],[-25.2,1.6],[-29.2,2.9],[-28.2,6.9],[-23.5,5.6],[-22.2,9.9],[-18.0,8.6],[-16.7,12.9],[21.5,0.9],[20.3,-3.1],[25.0,-4.4],[23.3,-8.6],[28.0,-10.4],[26.8,-14.4]],"w741934162",{"c":"#EBEEEB","l":"10","ml":"9","mt":"concrete","rc":"#EBEEEB"}],[19.8,23.7,[[-7.2,-20.4],[-7.7,-22.6],[-12.7,-20.9],[-11.5,-19.1],[-16.2,-17.4],[-15.7,-15.6],[-19.7,-13.9],[-19.2,-12.1],[-24.0,-10.9],[-23.5,-8.6],[-27.5,-7.4],[-27.0,-4.9],[-31.2,-3.9],[-30.5,-1.4],[-35.2,-0.1],[-33.5,3.9],[-29.2,2.9],[-28.2,6.9],[-23.5,5.6],[-22.2,9.9],[-18.0,8.6],[-16.7,12.9],[21.5,0.9],[20.3,-3.1],[25.0,-4.4],[23.3,-8.6],[28.0,-10.4],[26.8,-14.4],[31.0,-15.6],[29.8,-19.9],[25.5,-18.6],[24.3,-20.9],[20.3,-19.1],[19.5,-21.6],[14.8,-20.4],[14.3,-22.1],[10.0,-20.9],[9.5,-23.4],[4.8,-21.6],[4.0,-23.9],[-0.0,-22.1],[-1.2,-24.6],[-5.5,-23.4],[-5.0,-20.9]],"w741934165",{"c":"#EBEEEB","l":"7","ml":"6","mt":"concrete","rc":"#EBEEEB"}],[13.2,20.4,[[-35.2,-0.1],[-33.5,3.9],[-29.2,2.9],[-28.2,6.9],[-23.5,5.6],[-22.2,9.9],[-18.0,8.6],[-16.7,12.9],[21.5,0.9],[20.3,-3.1],[25.0,-4.4],[23.3,-8.6],[28.0,-10.4],[26.8,-14.4],[31.0,-15.6],[29.8,-19.9],[25.5,-18.6],[24.3,-22.1],[22.0,-21.6],[21.5,-23.9],[19.0,-23.4],[18.5,-25.6],[16.0,-24.6],[15.5,-26.9],[14.3,-26.9],[13.0,-29.9],[11.8,-29.4],[11.3,-31.1],[7.8,-29.9],[7.0,-32.1],[-4.2,-28.6],[-3.7,-26.9],[-6.0,-26.4],[-5.5,-23.4],[-7.7,-22.6],[-9.0,-25.1],[-12.7,-23.9],[-13.2,-26.4],[-25.2,-22.6],[-24.5,-20.9],[-26.5,-20.4],[-25.7,-18.6],[-27.5,-17.9],[-27.0,-15.6],[-29.2,-15.1],[-28.7,-12.6],[-31.7,-11.4],[-31.2,-9.1],[-32.2,-9.1],[-31.7,-6.6],[-34.2,-6.1],[-33.5,-4.4],[-36.5,-3.9],[-36.0,-2.6],[-37.7,-1.9],[-37.0,-1.4],[-40.0,-0.9],[-39.5,0.9]],"w741934150",{"c":"#EBEEEB","l":"6","ml":"4","mt":"concrete","rc":"#668624"}],[52.8,56.7,[[16.5,0.4],[16.0,-1.9],[11.3,-0.1],[10.8,-2.6],[6.5,-1.4],[5.8,-3.1],[1.0,-1.9],[1.8,0.4],[-0.7,0.9],[-1.2,-1.4],[-6.0,0.4],[-5.0,2.1],[-9.7,3.4],[-9.0,5.6],[-13.2,6.9],[-12.7,9.4],[-17.5,10.4],[-16.7,12.9],[21.5,0.9],[20.8,-0.9]],"w741934155",{"c":"#EBEEEB","l":"17","ml":"16","mt":"concrete","rc":"#EBEEEB"}],[0,52.8,[[-17.2,10.4],[-16.7,12.6],[21.3,0.6],[20.8,-0.6],[16.5,0.4],[15.8,-1.9],[11.3,-0.1],[10.5,-2.4],[6.5,-1.4],[5.8,-3.1],[1.5,-2.1],[1.8,0.4],[-0.7,0.9],[-1.5,-1.4],[-5.7,0.4],[-5.0,2.1],[-9.5,3.4],[-9.0,5.6],[-13.2,6.9],[-12.7,9.4]],"w741934155",{"c":"#EBEEEB","l":"17","ml":"16","mt":"concrete","rc":"#EBEEEB"}],[42.9,46.8,[[19.5,-5.6],[19.0,-7.4],[14.3,-6.1],[13.5,-7.9],[9.5,-6.6],[8.8,-9.1],[4.0,-7.4],[3.5,-9.6],[-0.7,-8.6],[-0.0,-6.1],[-2.5,-5.6],[-3.0,-7.4],[-7.7,-6.1],[-7.2,-4.4],[-11.5,-2.6],[-10.7,-0.9],[-15.7,0.9],[-14.5,2.9],[-19.2,4.6],[-18.5,6.4],[-22.7,7.6],[-22.2,9.9],[-18.0,8.6],[-16.7,12.9],[21.5,0.9],[20.3,-3.1],[25.0,-4.4],[24.3,-6.6]],"w741934158",{"c":"#EBEEEB","l":"14","ml":"13","mt":"concrete","rc":"#EBEEEB"}],[0,42.9,[[-22.7,7.4],[-22.2,9.6],[-18.0,8.6],[-16.5,12.6],[21.3,1.1],[20.3,-3.1],[24.8,-4.4],[24.5,-6.4],[19.5,-5.6],[18.8,-7.4],[14.3,-6.1],[13.5,-7.9],[9.5,-6.6],[8.8,-9.1],[4.0,-7.4],[3.3,-9.6],[-0.5,-8.6],[-0.0,-6.1],[-2.5,-5.6],[-3.2,-7.4],[-7.7,-6.1],[-7.2,-4.4],[-11.2,-2.6],[-10.7,-0.9],[-15.5,0.9],[-14.5,2.9],[-19.0,4.6],[-18.5,6.4]],"w741934158",{"c":"#EBEEEB","l":"14","ml":"13","mt":"concrete","rc":"#EBEEEB"}],[0,36.3,[[-24.5,3.6],[-22.2,9.6],[-18.0,8.6],[-16.5,12.9],[21.3,1.1],[20.3,-3.1],[24.8,-4.6],[22.5,-10.9],[17.8,-9.6],[17.0,-11.4],[13.0,-10.4],[12.3,-12.6],[8.3,-10.9],[7.5,-13.1],[3.0,-12.1],[2.0,-13.9],[-1.7,-12.6],[-1.2,-10.4],[-3.7,-9.6],[-5.0,-11.9],[-8.7,-10.4],[-8.5,-8.6],[-12.5,-6.6],[-12.0,-4.9],[-16.5,-3.9],[-16.2,-1.4],[-20.2,-0.1],[-19.7,2.1]],"w741934160",{"c":"#EBEEEB","l":"12","ml":"11","mt":"concrete","rc":"#EBEEEB"}],[36.3,40.2,[[22.5,-10.9],[17.8,-9.6],[17.3,-11.4],[13.0,-10.4],[12.5,-12.6],[8.3,-10.9],[7.8,-13.4],[3.0,-12.1],[2.3,-13.9],[-2.0,-12.6],[-1.2,-10.4],[-3.7,-9.6],[-5.0,-12.1],[-9.0,-10.4],[-8.5,-8.6],[-12.7,-6.6],[-12.0,-4.9],[-16.7,-3.9],[-16.2,-1.4],[-20.5,-0.1],[-19.7,2.1],[-24.5,3.4],[-22.2,9.9],[-18.0,8.6],[-16.7,12.9],[21.5,0.9],[20.3,-3.1],[25.0,-4.4],[23.3,-8.6]],"w741934160",{"c":"#EBEEEB","l":"12","ml":"11","mt":"concrete","rc":"#EBEEEB"}],[26.4,30.3,[[21.5,-15.1],[20.8,-17.4],[16.0,-15.6],[15.5,-17.9],[11.3,-16.9],[10.8,-18.6],[5.8,-17.4],[5.3,-19.9],[1.0,-17.9],[0.5,-20.4],[-4.2,-19.1],[-3.7,-16.9],[-6.0,-16.1],[-6.7,-17.9],[-10.7,-16.9],[-10.2,-14.4],[-15.0,-13.4],[-14.5,-11.4],[-18.5,-9.6],[-18.0,-7.9],[-22.2,-6.1],[-21.5,-4.4],[-26.5,-2.6],[-25.7,-0.9],[-34.7,2.1],[-33.5,3.9],[-29.2,2.9],[-28.2,6.9],[-23.5,5.6],[-22.2,9.9],[-18.0,8.6],[-16.7,12.9],[21.5,0.9],[20.3,-3.1],[25.0,-4.4],[23.3,-8.6],[28.0,-10.4],[26.3,-16.9]],"w741934163",{"c":"#EBEEEB","l":"9","ml":"8","mt":"concrete","rc":"#EBEEEB"}],[23.1,27.0,[[26.3,-16.9],[25.5,-18.6],[20.8,-17.4],[20.3,-19.1],[15.5,-17.9],[14.8,-20.4],[10.8,-18.6],[10.0,-20.9],[5.3,-19.9],[4.8,-21.6],[0.5,-20.4],[-0.0,-22.1],[-5.0,-20.9],[-4.2,-19.1],[-6.7,-17.9],[-7.2,-20.4],[-11.5,-19.1],[-10.7,-16.9],[-15.7,-15.6],[-15.0,-13.4],[-19.2,-12.1],[-18.5,-9.6],[-23.5,-8.6],[-22.2,-6.1],[-27.0,-4.9],[-26.5,-2.6],[-30.5,-1.4],[-30.0,0.4],[-34.7,2.1],[-33.5,3.9],[-29.2,2.9],[-28.2,6.9],[-23.5,5.6],[-22.2,9.9],[-18.0,8.6],[-16.7,12.9],[21.5,0.9],[20.3,-3.1],[25.0,-4.4],[23.3,-8.6],[28.0,-10.4],[26.8,-14.4],[31.0,-15.6],[30.3,-17.9]],"w741934164",{"c":"#EBEEEB","l":"8","ml":"7","mt":"concrete","rc":"#EBEEEB"}],[0,23.1,[[-34.5,2.4],[-33.5,3.9],[-29.2,2.9],[-28.0,6.9],[-23.5,5.6],[-22.0,9.9],[-18.0,8.6],[-16.5,12.6],[21.3,1.1],[20.3,-3.1],[24.8,-4.4],[23.3,-8.6],[27.8,-10.4],[26.8,-14.4],[30.8,-15.6],[30.5,-17.6],[26.3,-16.9],[25.3,-18.6],[20.8,-17.4],[20.0,-19.1],[15.5,-17.9],[14.8,-20.4],[10.8,-18.6],[10.0,-20.9],[5.3,-19.9],[4.5,-21.4],[0.5,-20.4],[-0.2,-22.1],[-4.7,-21.1],[-4.2,-19.1],[-6.7,-17.9],[-7.5,-20.4],[-11.2,-19.4],[-10.7,-16.9],[-15.5,-15.6],[-15.0,-13.4],[-19.0,-12.1],[-18.5,-9.6],[-23.2,-8.6],[-22.2,-6.1],[-26.7,-4.9],[-26.5,-2.6],[-30.2,-1.4],[-30.0,0.4]],"w741934164",{"c":"#EBEEEB","l":"8","ml":"7","mt":"concrete","rc":"#EBEEEB"}]]},"sgpanpacific":{"o":[1.292295,103.858685],"r":75,"p":[[0,17.1,[[0.5,69.7],[46.5,-8.6],[4.7,-34.6],[-14.5,-29.3],[-39.5,13.4],[-25.3,21.7],[-40.0,46.7]],"w741940347",{"c":"#F2F6F7","l":"5","mt":"concrete","rc":"#F2F6F7"}],[108.9,122.7,[[29.7,5.7],[37.0,-7.8],[44.0,-3.8],[46.5,-8.6],[4.7,-34.6],[-14.5,-29.3],[-39.5,13.4],[-33.5,16.4],[-28.8,7.4],[-24.0,9.9],[-26.3,13.4],[-21.5,16.4]],"w393090488",{"c":"#F2F6F7","l":"37","ml":"33","mt":"concrete","rc":"#F2F6F7"}],[16.5,109.5,[[19.7,5.2],[23.2,6.9],[25.5,3.4],[29.7,5.7],[37.0,-7.8],[44.0,-3.8],[46.5,-8.6],[4.7,-34.6],[-14.5,-29.3],[-39.5,13.4],[-33.5,16.4],[-28.8,7.4],[-24.0,9.9],[-26.3,13.4],[-21.5,16.4],[-19.3,12.2],[-15.0,14.7],[-12.5,11.7],[-9.0,13.4],[-6.8,9.9],[-2.5,12.2],[-0.8,8.7],[4.0,11.2],[6.0,6.9],[10.7,9.4],[13.0,5.7],[17.2,8.2]],"w172373822",{"c":"#F2F6F7","l":"33","ml":"5","mt":"concrete","rc":"#F2F6F7"}],[132.0,135.9,[[4.0,-20.3],[6.5,-26.3],[6.0,-29.3],[4.0,-32.3],[-1.3,-36.3],[-7.3,-35.8],[-12.5,-31.6],[-13.8,-28.1],[-13.3,-21.6],[-10.8,-18.6],[-7.8,-16.8],[-4.3,-16.1],[-1.3,-16.1]],"w393090400",{"c":"#F2F6F7","l":"41","ml":"40","mt":"concrete","rc":"#F2F6F7"}],[122.1,132.6,[[-15.5,-7.3],[16.0,-15.1],[8.2,-45.3],[-22.8,-37.6]],"w393090482",{"c":"#F2F6F7","l":"40","ml":"37","mt":"concrete","rc":"#F2F6F7"}]],"x":[[4.5,6.0,[[54.0,86.9],[77.0,88.7],[77.5,78.2],[59.0,77.4],[59.8,56.2],[68.0,56.2],[68.5,28.2],[81.3,28.9],[81.3,18.2],[71.0,17.7],[72.8,-16.8],[83.0,-16.8],[83.5,-26.8],[71.0,-26.8],[64.5,-29.3],[58.5,-34.6],[55.5,-40.6],[53.8,-48.8],[54.3,-60.6],[14.3,-62.6],[14.3,-66.1],[-44.7,-69.1],[-44.7,-71.3],[-50.2,-71.3],[-51.5,-53.1],[-37.7,-51.8],[-44.2,-38.8],[-18.0,-23.8],[-14.5,-29.3],[4.8,-34.6],[8.3,-40.6],[21.5,-32.8],[26.3,-40.6],[42.3,-31.1],[37.0,-22.8],[42.3,-19.8],[38.8,-13.3],[46.5,-8.6],[44.8,-5.6],[50.0,-3.1],[49.0,-0.8],[58.5,5.7],[57.3,37.2],[48.3,31.9],[47.0,70.4],[54.3,74.4]],"w393090492",{"building":"yes","building:colour":"#e3dcd8","building:material":"concrete","height":"6","layer":"1","level":"1","min_height":"4.5","roof:colour":"#C2B197","roof:material":"concrete","start_date":"1986"}]]},"sgintercon":{"o":[1.298356,103.854915],"r":56,"p":[[0,18,[[-14.0,-47.0],[-7.4,-40.5],[12.1,-26.6],[15.5,-24.1],[18.2,-22.1],[25.0,-17.3],[40.4,-5.4],[48.5,-0.5],[14.1,44.9],[1.9,46.2],[-7.6,38.2],[-13.1,33.7],[-38.9,12.4],[-51.0,2.4],[-30.8,-25.3]],"r21057404",{"l":"3","h":"18"}],[9.9,52.8,[[29.1,9.4],[30.3,9.9],[35.1,3.4],[33.8,2.9],[37.3,-1.9],[35.6,-3.6],[36.8,-4.9],[-11.4,-42.1],[-26.4,-22.6],[21.3,14.6],[22.6,12.9],[24.8,14.6]],"w254815933",{"l":"15","ml":"3","h":"12"}],[-1,-1,[[-16.5,23.0],[-2.9,5.7],[15.9,20.3],[2.3,37.5],[-3.6,32.9],[-8.8,28.9]],"inner",{}]]},"sgfunan":{"o":[1.291393,103.849858],"r":78,"p":[[19.8,33.6,[[22.4,47.0],[34.4,26.8],[24.6,20.8],[12.9,41.0]],"w699175599",{"c":"#B6BBBF","l":"10","ml":"6","mt":"metal","rc":"#B6BBBF"}],[9.9,20.4,[[39.1,31.5],[43.9,23.3],[48.7,24.3],[48.7,-14.8],[19.9,-31.2],[16.9,-31.2],[15.9,-29.0],[-2.1,-39.0],[-34.9,18.5],[-14.6,30.3],[-6.9,29.8],[43.1,59.5],[48.7,49.4],[48.7,44.1]],"w699175602",{"c":"#B6BBBF","l":"6","ml":"3","mt":"metal","rc":"#B6BBBF"}],[19.8,40.2,[[-14.6,30.3],[-6.9,29.8],[12.9,41.0],[24.6,20.8],[-21.4,-5.7],[-34.9,18.5]],"w699175600",{"c":"#405165","l":"12","ml":"6","mt":"metal","rc":"#B6BBBF"}],[0,10.5,[[19.9,-31.2],[16.9,-31.2],[15.9,-29.0],[-36.1,-58.5],[-69.6,-1.0],[-14.6,30.3],[-6.9,29.8],[43.1,59.5],[48.7,49.4],[48.7,44.1],[39.1,31.5],[43.9,23.3],[48.7,24.3],[48.7,-14.8]],"w699175605",{"c":"#B08366","l":"3","rc":"#B08366"}],[19.8,33.6,[[46.1,-16.0],[34.4,4.8],[44.4,10.3],[48.7,2.5],[48.7,-14.5]],"w699175603",{"c":"#B6BBBF","l":"10","ml":"6","mt":"metal","rc":"#B6BBBF"}],[19.8,40.2,[[19.9,-31.2],[16.9,-31.2],[15.9,-29.0],[-2.1,-39.0],[-12.4,-21.7],[34.4,4.8],[46.1,-16.0]],"w699175601",{"c":"#405165","l":"12","ml":"6","mt":"metal","rc":"#B6BBBF"}],[9.9,40.2,[[-36.1,-58.5],[-46.4,-41.5],[-27.1,-30.7],[-39.9,-8.7],[-58.9,-19.5],[-69.6,-1.0],[-34.9,18.5],[-2.1,-39.0]],"w699175606",{"c":"#B6BBBF","l":"12","ml":"3","mt":"metal","rc":"#B6BBBF"}]]},"sgfunan2":{"o":[1.291429,103.850459],"r":61,"p":[[9.9,20.4,[[-18.3,48.2],[-18.3,53.4],[-16.6,50.4]],"w699175602",{"c":"#B6BBBF","l":"6","ml":"3","mt":"metal","rc":"#B6BBBF"}],[9.9,20.4,[[-5.9,30.9],[31.1,-30.9],[19.1,-43.9],[-4.6,-2.9],[-18.3,-10.7],[-18.3,28.3]],"w699175602",{"c":"#B6BBBF","l":"6","ml":"3","mt":"metal","rc":"#B6BBBF"}],[0,10.5,[[-4.6,-2.9],[-18.3,-10.7],[-18.3,28.3],[-5.9,30.9],[18.6,-9.4],[6.6,-22.4]],"w699175605",{"c":"#B08366","l":"3","rc":"#B08366"}],[0,10.5,[[-16.6,50.4],[-18.3,48.2],[-18.3,53.4]],"w699175605",{"c":"#B08366","l":"3","rc":"#B08366"}],[19.8,33.6,[[-18.3,-10.5],[-18.3,6.6],[-11.1,-6.4]],"w699175603",{"c":"#B6BBBF","l":"10","ml":"6","mt":"metal","rc":"#B6BBBF"}]]}};
// ---- bridges: deck lines from the refs (local metres round the bridge anchor, [x, z, elev]); the app's deck height `elev` is
// taken as model height elev - 0.6 (the app sets a model's base 0.6 m above the ground; the river quays here are at ground level) ----
const BR_EL = 0.6;
// a steel / concrete lamp post with a lit lantern
function brLamp(B, x, y, z, h, POST, LAMP){ segP(B.p(POST), [x, y, z], [x, y + h, z], 0.07, 5); boxP(B.p(LAMP), 0.42, 0.55, 0.42, x, y + h, z); }
// structure under / beside one deck line: underside slab (hw half-width), optional parapets on the outer side(s), lamps
function brLine(B, L0, hw, opt){
  const L = resL(L0.map(p => [p[0], p[1], p[2] - BR_EL]), 3);
  ribbonL(B.p(opt.SLAB), L, -hw, hw, -opt.th, -0.12);
  for (const s of opt.par || []){ const o = s*(hw + 0.1); ribbonL(B.p(opt.PAR), L, o - 0.15, o + 0.15, -0.3, opt.ph || 1.1); ribbonL(B.p(opt.FAS), L, o - 0.2, o + 0.2, -opt.th - 0.1, -0.2); }
  if (opt.lamp){ const F = polyFr(L); let acc = 0; for (let i = 1; i < F.length; i++){ const a = F[i-1].p, b = F[i].p; acc += Math.hypot(b[0] - a[0], b[1] - a[1]); if (acc >= opt.lamp){ acc = 0; for (const s of opt.par || []) brLamp(B, b[0] + F[i].n[0]*s*(hw + 0.1), b[2] + 1.1, b[1] + F[i].n[1]*s*(hw + 0.1), 3.6, opt.POST, opt.LAMP); } } }
}
// abutment block at a deck end (along the line direction at that end)
function brAbut(B, L0, end, hw, len, col){ const L = L0.map(p => [p[0], p[1], p[2] - BR_EL]), i = end ? L.length - 1 : 0, j = end ? L.length - 2 : 1, a = L[i], b = L[j], d = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(...d), u = [d[0]/l, d[1]/l], n = [-u[1], u[0]];
  const P = [[a[0] - u[0]*1 + n[0]*hw, a[1] - u[1]*1 + n[1]*hw], [a[0] + u[0]*len + n[0]*hw, a[1] + u[1]*len + n[1]*hw], [a[0] + u[0]*len - n[0]*hw, a[1] + u[1]*len - n[1]*hw], [a[0] - u[0]*1 - n[0]*hw, a[1] - u[1]*1 - n[1]*hw]];
  prismP(B.p(col), P, -5, Math.max(0.05, a[2] - 0.5), false); }

// ================= Robertson Bridge (footbridge over the upper Singapore River, late 1990s), Robertson Quay =================
// Verified: a pedestrian bridge in the upper reaches of the river linking Robertson Quay and the Kim Seng Road side, one of the bridges
// built in the years before 2000 (littledayout). Extent and deck heights from the app's path line on OSM bridge w475629843 (47 m,
// rising to 3.6 m); river banks from OSM. Not verified (estimates): structure (steel girder deck with railings), width 4 m, colours.
LANDMARKS.sgrobertsonbr = {zh:'罗拔申桥', en:'Robertson Bridge', cat:'new', r:30, h:5,
  lt:{m:0, c:'#eef3ff', k:0.9, e:0.8},
  build(){
    const g = new THREE.Group(), B = mkB();
    const L = [[4.1, -22.4, 0.6], [0.9, 1.4, 3.6], [-2.4, 25.1, 0.6]];
    // smooth arch profile through the three heights
    const S = []; for (let i = 0; i <= 24; i++){ const t = i/24, a = t < 0.5 ? L[0] : L[1], b = t < 0.5 ? L[1] : L[2], tt = t < 0.5 ? t*2 : t*2 - 1;
      S.push([a[0] + (b[0] - a[0])*tt, a[1] + (b[1] - a[1])*tt, 0.6 + 3.0*Math.sin(PI*t)]); }
    const STEEL = {c:'#d9dcdb', m:0, lc:'#e8f0ff', lk:0.8}, DECK = '#8e8478', RAIL = '#c9cdcc', POST = '#5f6466', LAMP = {c:'#fff2cc', glow:'#ffe6b0', gk:1.6}, STONE = '#a59e91';
    const SL = S.map(p => [p[0], p[1], p[2] - BR_EL]);
    ribbonL(B.p(DECK), SL, -2.0, 2.0, -0.35, 0.0);
    for (const s of [-1, 1]){ ribbonL(B.p(STEEL), SL, s*2.0 - 0.18, s*2.0 + 0.18, -1.3, -0.3); ribbonL(B.p(RAIL), SL, s*2.0 - 0.04, s*2.0 + 0.04, 1.0, 1.1);
      const F = polyFr(SL); for (let i = 0; i < F.length; i += 2){ const p = F[i].p, q = [p[0] + F[i].n[0]*s*2.0, p[1] + F[i].n[1]*s*2.0]; segP(B.p(RAIL), [q[0], p[2], q[1]], [q[0], p[2] + 1.05, q[1]], 0.03, 3); } }
    for (let i = 0; i < SL.length; i += 3){ const F = polyFr(SL)[i], p = F.p; segP(B.p(STEEL), [p[0] - F.n[0]*2, p[2] - 0.6, p[1] - F.n[1]*2], [p[0] + F.n[0]*2, p[2] - 0.6, p[1] + F.n[1]*2], 0.12, 4); }
    brAbut(B, L, 0, 2.6, 2.5, STONE); brAbut(B, L, 1, 2.6, 2.5, STONE);
    for (const e of [SL[0], SL[SL.length - 1]]) for (const s of [-1, 1]) brLamp(B, e[0] + s*2.3, e[2], e[1], 3.4, POST, LAMP);
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'sgrobertsonbr', lat:1.28995, lon:103.83644, rot:0});

// ================= Pulau Saigon Bridge (1997), Saiboo Street =================
// Verified: a vehicular bridge opened 1997, named after an island that once stood in the river (littledayout). The app draws the two
// carriageways of Saiboo Street (OSM bridge w464779142, decks at 3.4 m); this model adds the deck structure, fascia, parapets, lamps and
// the quay abutments. Estimates: single span (no river piers placed), parapet form, lamp spacing, colours.
LANDMARKS.sgsaigonbr = {zh:"西贡岛桥", en:"Pulau Saigon Bridge", cat:"new", r:68, h:5,
  lt:{m:0, c:'#fff0d6', k:0.7, e:0.7},
  build(){
    const g = new THREE.Group(), B = mkB();
    const A = [[24.0, -55.4, 0.6], [14.5, -33.2, 3.4], [4.7, -10.9, 3.4], [-5.0, 11.1, 3.4], [-14.8, 33.3, 3.4], [-24.3, 55.6, 0.6]];
    const C = [[14.5, -57.4, 0.6], [4.7, -35.4, 3.4], [-5.0, -13.7, 3.4], [-14.8, 8.3, 3.4], [-24.5, 30.1, 3.4], [-34.3, 52.1, 0.6]];
    const O = {SLAB:'#a8a39a', PAR:{c:'#d8d4ca', m:0, lk:0.5}, FAS:'#c4bfb4', POST:'#55595b', LAMP:{c:'#fff2cc', glow:'#ffe6b0', gk:1.6}, th:1.5, ph:1.1, lamp:18};
    brLine(B, A, 4.6, Object.assign({par:[-1]}, O)); brLine(B, C, 4.6, Object.assign({par:[-1]}, O));
    // the median between the two carriageways
    { const M = A.map((p, i) => [(p[0] + C[i][0])/2, (p[1] + C[i][1])/2, (p[2] + C[i][2])/2]); brLine(B, M, 1.0, Object.assign({par:[]}, O)); }
    for (const L of [A, C]){ brAbut(B, L, 0, 5.2, 3, '#9d978c'); brAbut(B, L, 1, 5.2, 3, '#9d978c'); }
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'sgsaigonbr', lat:1.28971, lon:103.83825, rot:0});

// ================= Clemenceau Bridge (1991; first bridge 1940), Clemenceau Avenue =================
// Verified (Wikipedia; littledayout): the first bridge (1940, 100 m long, 18 m wide) was demolished in 1989 for the Central Expressway;
// the present multi-lane pre-stressed concrete road bridge (1991) links River Valley Road with the CTE tunnel; boats up to 2 m high pass
// under it. The app draws the carriageways (decks to 4.6 m); this model adds the concrete deck structure, both footway decks (OSM paths
// on the bridge), parapets, lamps and the quay abutments. Estimates: single river span (no piers placed), parapet form, lamp spacing.
LANDMARKS.sgclemenceaubr = {zh:'克里孟梭桥', en:'Clemenceau Bridge', cat:'new', r:58, h:6,
  lt:{m:0, c:'#fff0d6', k:0.7, e:0.7},
  build(){
    const g = new THREE.Group(), B = mkB();
    const CA = [[30.5, -36.7, 0.6], [19.5, -16.7, 3.4], [8.5, 3.1, 4.6], [-2.5, 23.1, 3.4], [-13.5, 43.1, 0.6]];
    const CB = [[14.5, -36.7, 0.6], [5.5, -20.9, 2.8], [-3.5, -4.9, 4.2], [-12.5, 11.1, 4.2], [-18.2, 25.6, 2.4], [-24.0, 40.3, 0.6]];
    const PE = [[40.3, -37.4, 0.6], [30.5, -19.9, 3.0], [20.5, -2.7, 4.6], [10.8, 14.8, 3.0], [1.0, 32.1, 0.6]];
    const PW = [[5.8, -39.7, 0.6], [-5.0, -21.7, 3.2], [-15.5, -3.9, 4.2], [-26.0, 14.1, 3.2], [-36.7, 32.1, 0.6]];
    const O = {SLAB:'#a9a49b', PAR:{c:'#d9d5cb', m:0, lk:0.5}, FAS:'#c5c0b5', POST:'#55595b', LAMP:{c:'#fff2cc', glow:'#ffe6b0', gk:1.6}, th:1.6, ph:1.1};
    brLine(B, CA, 6.5, Object.assign({par:[]}, O)); brLine(B, CB, 6.5, Object.assign({par:[]}, O));
    // footway decks (the app's paths here are replaced) with parapets on the outer side and lamps
    const DECK = '#8f8a82';
    for (const [L, s] of [[PE, -1], [PW, 1]]){ const LL = resL(L.map(p => [p[0], p[1], p[2] - BR_EL]), 3); ribbonL(B.p(DECK), LL, -1.6, 1.6, -0.2, 0.15);
      brLine(B, L, 1.6, Object.assign({par:[s], lamp:16}, O)); brAbut(B, L, 0, 2.2, 3, '#9d978c'); brAbut(B, L, 1, 2.2, 3, '#9d978c'); }
    for (const L of [CA, CB]){ brAbut(B, L, 0, 6.0, 3, '#9d978c'); brAbut(B, L, 1, 6.0, 3, '#9d978c'); }
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'sgclemenceaubr', lat:1.29075, lon:103.84243, rot:0});
const byO = (k, o) => D50C[k].p.filter(p => p[3] === o);
// ================= Guoco Midtown office tower (Denton Corker Marshall, 2024), 128 Beach Road =================
// Verified: 192 m, 30 floors, 2024 (Wikipedia tallest list); 30-storey Grade A office tower, ~71,500 m2 (DCM). OSM: tower part
// r16738438 = the whole outline w725743263, 30 levels, glass, 2 roof levels, roof colour teal; part w1075250784 = 4 levels, black
// metal (the east corner). Not verified (estimates): the split of the 192 m into an 18 m base, 30 storeys of 5.5 m and a 14 m
// two-level roof crown; mullion spacing; glass tint.
LANDMARKS.sgguocomidtown = {zh:'国浩城中心', en:'Guoco Midtown', cat:'new', r:49, h:192,
  lt:{m:1, c:'#d6f2ec', k:0.6, fh:5.52, cw:3.0},
  build(){
    const g = new THREE.Group(), B = mkB();
    const R0 = PK('sgguocomidtown', 0)[2], Q = PK('sgguocomidtown', 1)[2];
    const LOB = [R0[0], R0[1], R0[2], R0[5], R0[6], R0[7]];               // outline minus the black metal corner
    const M = {GL:{c:'#55797a', m:1, fh:5.52, cw:3.0}, MUL:{c:'#c9d2d0', m:0, lk:0.15}, SP:{c:'#3c4a4b', m:0, lk:0.1}, LOB:{c:'#8fa6a6', glow:'#ffe6c2', gk:0.85},
      BLK:{c:'#232527', m:0, lk:0.2}, FIN:{c:'#3b3e41', m:0, lk:0.2}, CROWN:{c:'#3f8f86', m:0, lc:'#bff7ee', lk:1.2}, LOUV:{c:'#7fb8b0', m:0, lc:'#bff7ee', lk:1.0}, FOUND:'#8d8a84', ROOF:'#6e7472'};
    const Y0 = 18, YT = 178, YC = 192;
    foundP(B, R0, 0, M.FOUND);
    // base: glazed lobby (warm at night) behind slender columns; the east corner is a 4-storey black metal block with vertical fins
    prismP(B.p(M.LOB), offP(LOB, 1.2), 0, Y0, false);
    for (const [x, z] of alongP(LOB, 7.5)) boxP(B.p(M.MUL), 0.7, Y0, 0.7, x, 0, z);
    prismP(B.p(M.BLK), Q, 0, Y0, false);
    for (const E of edgesF(Q)){ if (E.L < 3) continue; const k = Math.round(E.L/1.2); for (let j = 1; j < k; j++) slabP(B.p(M.FIN), rectO(j*E.L/k - 0.1, j*E.L/k + 0.1, 0.4, Y0 - 0.3), E.F, 0, 0.45); }
    capP(B.p(M.BLK), offP(LOB, 1.2), Y0);
    // 30 storeys of glass curtain wall: mullions every 1.5 m, a dark spandrel band at each floor
    glassP(B, R0, Y0, YT, {glass:M.GL, band:M.SP, mull:M.MUL, fh:5.52, bh:0.9, bd:0.1, bay:1.5, md:0.28});
    bandP(B.p(M.MUL), R0, Y0 - 0.6, 0.9, 0.5);
    // two-level roof crown (teal): set back 1.5 m, louvred screen, parapet
    const RC = offP(R0, 1.5);
    capP(B.p(M.ROOF), R0, YT); parP(B.p(M.MUL), R0, YT, YT + 1.2, 0.3);
    prismP(B.p(M.CROWN), RC, YT, YC - 0.8, false); capP(B.p(M.ROOF), RC, YC - 0.8);
    for (const E of edgesF(RC)){ if (E.L < 2) continue; for (let y = YT + 1.2; y < YC - 1.2; y += 0.9) slabP(B.p(M.LOUV), rectO(0, E.L, y, y + 0.25), E.F, 0, 0.5); }
    parP(B.p(M.CROWN), RC, YC - 0.8, YC, 0.3);
    B.flush(g); return g;
  }};
placeK('sgguocomidtown');

// ================= National Design Centre (former St Anthony's Convent), 111 Middle Road =================
// Verified (Architectural Record; indesignlive; Wikipedia): four conserved blocks - three pre-war Art Deco / colonial-to-Moderne
// blocks of the 1920s-30s lined up along Middle Road and a post-war 1940s block behind them on the Queen Street side, whose former
// open courtyard is now a 4-storey atrium under a folded, cable-tensioned glass skylight (SCDA, 2014); Block D has five storeys and an
// angled entrance at its corner; all exterior surfaces white plaster; some roofs re-tiled; a 5-foot colonnade wraps the street
// facades; the 1940s block keeps its horizontal windows. One OSM outline r3413595 (3 levels / 20 m). Estimates: the block
// boundaries along the outline, which blocks have tiled roofs, storey heights, and the Cor-ten colour of the angled entry wall.
LANDMARKS.sgndc = {zh:'国家设计中心', en:'National Design Centre', cat:'old', r:51, h:20.5,
  lt:{m:0, c:'#fff2dc', k:0.55, e:0.5, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), A = 39.7, [d, n] = axisD(A);
    const R = PK('sgndc', 0)[2];
    const M = {W:{c:'#f3f1ea', m:0}, TR:'#ffffff', WIN:{c:'#39444a', m:1, fh:4.0, cw:2.4}, SHOP:{c:'#4a5458', glow:'#ffe2b8', gk:0.8}, TILE:'#9c5a43', ROOF:'#a8a59e',
      SKY:{c:'#b9d0d6', glow:'#fff0d6', gk:0.5}, CABLE:'#6b7377', COR:'#8a4b2a', FOUND:'#9a958c', PIER:'#fbfaf6'};
    let s0 = 1e9, s1 = -1e9, t0 = 1e9, t1 = -1e9; for (const p of R){ const s = p[0]*d[0] + p[1]*d[1], t = p[0]*n[0] + p[1]*n[1]; s0 = Math.min(s0, s); s1 = Math.max(s1, s); t0 = Math.min(t0, t); t1 = Math.max(t1, t); }
    foundP(B, R, 0, M.FOUND);
    const sD = s0 + 24, w3 = (s1 - sD)/3;
    // Block D (1940s, Queen Street end): five storeys, horizontal strip windows, flat roof, the folded glass skylight over the atrium
    const PD = band(R, A, s0 - 1, sD, t0 - 1, t1 + 1);
    ribbonP(B, PD, 0, 20, {wall:M.W, win:M.WIN, fh:4.0, sill:1.1, wh:1.5, minL:3});
    roofF(B, PD, 20, {wall:M.W, roof:M.ROOF, par:0.9, parC:M.TR});
    { const sa = s0 + 5, sb = sD - 4, ta = t0 + 7, tb = Math.min(t1 - 5, t0 + 26), N = 6;   // folded skylight: ridges across the atrium
      for (let i = 0; i < N; i++){ const u0 = sa + (sb - sa)*i/N, u1 = sa + (sb - sa)*(i + 0.5)/N, u2 = sa + (sb - sa)*(i + 1)/N;
        const P = (s, t, y) => { const q = stXZ(A, s, t); return [q[0], y, q[1]]; };
        quadP(B.p(M.SKY), P(u0, ta, 20.4), P(u0, tb, 20.4), P(u1, tb, 22.2), P(u1, ta, 22.2)); quadP(B.p(M.SKY), P(u1, ta, 22.2), P(u1, tb, 22.2), P(u2, tb, 20.4), P(u2, ta, 20.4));
        segP(B.p(M.CABLE), P(u1, ta, 22.25), P(u1, tb, 22.25), 0.07, 4); } }
    // the angled entrance at the Middle Road / Queen Street corner: a Cor-ten wall in the chamfer, glazed ground floor behind it
    { const a = stXZ(A, s0 + 0.5, t0 + 2.5), b = stXZ(A, s0 + 9, t0 - 0.2), L = Math.hypot(b[0] - a[0], b[1] - a[1]), F = fA(a[0], a[1], Math.atan2(b[1] - a[1], b[0] - a[0]));
      slabP(B.p(M.COR), rectO(0, L, 0, 5.2), F, 0.4, 0.9); shapeP(B.p(M.SHOP), rectO(0.5, L - 0.5, 0.2, 3.8), F, 0.05); }
    // Blocks C, B, A along Middle Road: three storeys of rendered Art Deco front (pilasters, rectangular windows, stepped parapet),
    // a colonnaded 5-foot way on the Middle Road face, hipped tiled roofs on two of them
    for (let i = 0; i < 3; i++){
      const P = band(R, A, sD + i*w3, sD + (i + 1)*w3, t0 - 1, t1 + 1); if (P.length < 3) continue;
      const yE = 14.5;
      prismP(B.p(M.W), P, 0, yE, false);
      winP(B.p(M.WIN), P, 4.6, 2, 4.6, 3.6, 1.5, 2.4, 1.0, 0.05, 3);
      for (const E of edgesF(P)){ if (E.L < 4) continue; const k = Math.max(2, Math.round(E.L/3.6));
        for (let j = 0; j <= k; j++) slabP(B.p(M.TR), rectO(j*E.L/k - 0.3, j*E.L/k + 0.3, 4.4, yE + 0.6), E.F, 0, 0.18);
        for (let j = 0; j < k; j++) shapeP(B.p(M.SHOP), rectO((j + 0.18)*E.L/k, (j + 0.82)*E.L/k, 0.3, 3.4), E.F, 0.05); }
      bandP(B.p(M.TR), P, 4.1, 0.4, 0.25); bandP(B.p(M.TR), P, yE - 0.5, 0.5, 0.3);
      // colonnade: square piers just outside the Middle Road face carrying the upper floors' edge beam
      const a = stXZ(A, sD + i*w3 + 0.8, t0 - 1.6), b = stXZ(A, sD + (i + 1)*w3 - 0.8, t0 - 1.6), k = Math.round(w3/3.6);
      for (let j = 0; j <= k; j++){ const x = a[0] + (b[0] - a[0])*j/k, z = a[1] + (b[1] - a[1])*j/k; boxP(B.p(M.PIER), 0.6, 4.2, 0.6, x, 0, z, -A*PI/180); }
      { const P2 = [stXZ(A, sD + i*w3, t0 - 2.0), stXZ(A, sD + (i + 1)*w3, t0 - 2.0), stXZ(A, sD + (i + 1)*w3, t0 + 0.2), stXZ(A, sD + i*w3, t0 + 0.2)]; prismP(B.p(M.W), P2, 4.2, 4.9, true); }
      if (i < 2){ const c = stXZ(A, sD + (i + 0.5)*w3, (t0 + Math.min(t1, t0 + 30))/2); hipRoof(g, c[0], c[1], w3 - 1.4, Math.min(t1 - t0, 30) - 2, yE, 4.4, M.TILE, -A*PI/180, 0.6); parP(B.p(M.TR), P, yE, yE + 0.6, 0.25); }
      else { roofF(B, P, yE, {wall:M.W, roof:M.ROOF, par:1.2, parC:M.TR});   // stepped Art Deco parapet in the middle of the street face
        const c = stXZ(A, sD + (i + 0.5)*w3, t0 + 0.3); boxP(B.p(M.TR), 7, 2.6, 0.6, c[0], yE, c[1], -A*PI/180); boxP(B.p(M.TR), 3.5, 4.0, 0.6, c[0], yE, c[1], -A*PI/180); }
    }
    B.flush(g); return g;
  }};
placeK('sgndc');

// ================= Church of Saints Peter and Paul (1869-70; national monument), 225A Queen Street =================
// Verified (Wikipedia; roots.gov.sg; parish site): neo-Gothic / tropical Gothic; built 1869-70 with its tower; three bells hung in
// the belfry 1883, spire completed by Fr Galmel after 1883; transepts and sacristy 1891-92; entrance porch and facade extended
// 1910-11; a rose window above the entrance; the belfry rises above the main entrance and carries a cross; eight columns frame the
// porch, whose lancet arches have metal tracery; statues of Saints Peter and Paul flank the rose window (their niches are modelled,
// not the figures); lancet windows, high altar at the east (SE) end; wooden louvred windows (2016).
// Footprint w155986468 (axis 41.7 deg: entrance NW on Queen Street). Estimates (not verified): all heights (eaves 10.5 m, tower 23 m,
// spire top 37 m), the octagonal spire, wall colour (warm white) and roof colour, the cross-gable reading of the wide front bay.
LANDMARKS.sgsspp = {zh:'圣伯多禄圣保禄堂', en:'Church of Saints Peter and Paul', cat:'old', r:32, h:38.5,
  lt:{m:0, c:'#fff1d8', k:0.65, e:0.6, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), A = 41.7, ry = -A*PI/180;
    const R = PK('sgsspp', 0)[2];
    const M = {W:{c:'#f2ece0', m:0}, TR:'#fbf8f1', DK:'#2c2a29', LOUV:'#5d4a3a', GLS:{c:'#5b5470', glow:'#ffd9a0', gk:0.55}, ROOF:'#7b5b4c', SPIRE:'#cfcac0', FOUND:'#a59e92', GOLD:{c:'#d8c27a', m:0, lk:1.2}};
    const S = (s, t, y) => { const q = stXZ(A, s, t); return [q[0], y, q[1]]; }, FR = (s, t) => stXZ(A, s, t);
    foundP(B, R, 0, M.FOUND);
    const front = band(R, A, -30, -5.2, -20, 20), nave = band(R, A, -5.2, 14.5, -20, 20), chan = band(R, A, 14.5, 32, -20, 20);
    const YE = 10.5;
    for (const P of [front, nave]) prismP(B.p(M.W), P, 0, YE, false);
    prismP(B.p(M.W), chan, 0, 9.5, false);
    bandP(B.p(M.TR), front, YE - 0.6, 0.6, 0.25); bandP(B.p(M.TR), nave, YE - 0.6, 0.6, 0.25); bandP(B.p(M.TR), chan, 8.9, 0.6, 0.25);
    bandP(B.p(M.TR), front, 0, 0.8, 0.15); bandP(B.p(M.TR), nave, 0, 0.8, 0.15); bandP(B.p(M.TR), chan, 0, 0.8, 0.15);
    // roofs: nave ridge along the axis, the wide front bay as a cross gable, a lower chancel roof; gable ends in wall colour
    const Fr = frm(A*PI/180);
    gableR(B.p(M.ROOF), Fr, -6, 14.6, -7.7, 8.2, YE, 6.0, 0.6, B.p(M.W), 'u', 0.05);
    gableR(B.p(M.ROOF), Fr, -20.6, -5.2, -11.6, 11.5, YE, 5.6, 0.6, B.p(M.W), 'v', 0.05);
    gableR(B.p(M.ROOF), Fr, 14.4, 28.3, -6.4, 6.3, 9.5, 4.8, 0.5, B.p(M.W), 'u', 0.05);
    // lancet windows with louvres between buttresses along the nave and chancel; buttresses
    for (const [P, yt] of [[nave, YE], [chan, 9.5]]) for (const E of edgesF(P)){ if (E.L < 8) continue; const k = Math.round(E.L/4.4);
      for (let j = 0; j <= k; j++) slabP(B.p(M.TR), [[j*E.L/k - 0.45, 0], [j*E.L/k + 0.45, 0], [j*E.L/k + 0.45, yt - 2.5], [j*E.L/k, yt - 0.6], [j*E.L/k - 0.45, yt - 2.5]], E.F, 0, 0.7);
      for (let j = 0; j < k; j++){ const u = (j + 0.5)*E.L/k; shapeP(B.p(M.DK), mv(pArch(0.95, 5.6, 5), u, 2.2), E.F, 0.04);
        for (let i = 0; i < 7; i++) shapeP(B.p(M.LOUV), rectO(u - 0.85, u + 0.85, 2.4 + i*0.55, 2.62 + i*0.55), E.F, 0.06); } }
    // the transept-front side walls: tall lancets with stained glass
    for (const E of edgesF(front)){ if (E.L < 5) continue; const k = Math.max(1, Math.round(E.L/5));
      for (let j = 0; j < k; j++){ const u = (j + 0.5)*E.L/k; shapeP(B.p(M.GLS), mv(pArch(1.0, 6.2, 5), u, 2.0), E.F, 0.04); } }
    // porch (1910-11): eight columns carrying lancet arches across the front, deep shadow behind
    { const sP = -21.4, tA = -10.0, tB = 10.0, F = (u, v, w) => S(sP - (w || 0), tA + u, v);
      slabP(B.p(M.W), rectO(0, tB - tA, 0, 6.6), F, 0, 0.6);
      for (let j = 0; j < 7; j++){ const u = (j + 0.5)*(tB - tA)/7; shapeP(B.p(M.DK), mv(pArch(1.1, 5.0, 5), u, 0.3), F, 0.65); }
      for (let j = 0; j <= 7; j++){ const p = S(sP - 0.9, tA + j*(tB - tA)/7, 0); LCyl(g, 0.28, 0.32, 5.0, p[0], 0.3, p[2], M.TR, 10); }
      slabP(B.p(M.TR), rectO(-0.2, tB - tA + 0.2, 6.6, 7.2), F, 0, 0.9);
      // the front wall above the porch either side of the tower, with the two saints' niches flanking the rose window (niches only)
      const F2 = (u, v, w) => S(-21.0 - (w || 0), tA + u, v);
      for (const u of [10 - 5.2, 10 + 5.2]){ slabP(B.p(M.TR), mv(pArch(0.8, 3.0, 5), u, 9.4), F2, 0, 0.15); shapeP(B.p(M.DK), mv(pArch(0.55, 2.6, 5), u, 9.6), F2, 0.17); slabP(B.p(M.TR), rectO(u - 0.7, u + 0.7, 9.1, 9.4), F2, 0, 0.35); } }
    // tower above the entrance: square shaft, rose window on its front, belfry with louvred lancets, corner pinnacles, octagonal spire, cross
    const tS0 = -24.0, tS1 = -18.0, tT = 3.0, YT = 23;
    rectPrism(B.p(M.W), Fr, tS0, tS1, -tT, tT, 0, YT);
    for (const y of [7.2, 15.0, YT - 0.5]) bandP(B.p(M.TR), Fr.rect(tS0, tS1, -tT, tT), y, 0.5, 0.25);
    { const F = (u, v, w) => S(tS0 - (w || 0), -tT + u, v);                // front (NW) face
      shapeP(B.p(M.DK), mv(pArch(1.2, 6.2, 5), tT, 0.2), F, 0.05);
      const rc = [tT, 11.0]; shapeP(B.p(M.TR), mv(circ(1.85, 20), rc[0], rc[1]), F, 0.06); shapeP(B.p(M.GLS), mv(circ(1.55, 20), rc[0], rc[1]), F, 0.09);
      for (let i = 0; i < 8; i++){ const a = i/8*TAU; slabP(B.p(M.TR), mv(rectO(-0.06, 0.06, 0, 1.55), 0, 0).map(p => [rc[0] + p[0]*Math.cos(a) - p[1]*Math.sin(a), rc[1] + p[0]*Math.sin(a) + p[1]*Math.cos(a)]), F, 0.09, 0.14); } }
    for (const E of edgesF(Fr.rect(tS0, tS1, -tT, tT))){ for (const u of [E.L*0.3, E.L*0.7]){ shapeP(B.p(M.DK), mv(pArch(0.65, 4.2, 5), u, 17.3), E.F, 0.04); for (let i = 0; i < 6; i++) shapeP(B.p(M.LOUV), rectO(u - 0.55, u + 0.55, 17.5 + i*0.5, 17.7 + i*0.5), E.F, 0.06); } }
    for (const [ss, tt] of [[tS0, -tT], [tS0, tT], [tS1, -tT], [tS1, tT]]){ const p = S(ss, tt, 0); LBox(g, 0.7, 2.2, 0.7, p[0], YT, p[2], M.TR, ry); LCone(g, 0.45, 2.6, p[0], YT + 2.2, p[2], M.TR, 4, PI/4 + ry); }
    parP(B.p(M.TR), Fr.rect(tS0, tS1, -tT, tT), YT, YT + 1.0, 0.3);
    { const c = S((tS0 + tS1)/2, 0, 0); LCyl(g, 2.3, 2.6, 1.2, c[0], YT, c[2], M.SPIRE, 8); LCone(g, 2.3, 12.4, c[0], YT + 1.2, c[2], M.SPIRE, 8);
      LBox(g, 0.18, 2.2, 0.18, c[0], YT + 13.4, c[2], M.GOLD, ry); LBox(g, 1.1, 0.18, 0.18, c[0], YT + 14.8, c[2], M.GOLD, ry); }
    B.flush(g); return g;
  }};
placeK('sgsspp');

// ================= Pan Pacific Singapore (John Portman & Associates with DP Architects, 1986), Marina Square =================
// Verified: 111 m, 32 floors above ground, 1986, Portman + DP (skyscrapercenter); 790 rooms round an atrium rising 35 floors; the
// high-rise lifts (floors 22-38) are outdoor observation lifts (Wikipedia). Massing from the OSM parts of w155987124: a 5-level
// podium (w741940347), the tower w172373822 with the zig-zag room bays of its south face, the top floors w393090488 behind the
// bays, a box w393090482 and a round top w393090400 on the north side; OSM colour #F2F6F7. The OSM part heights (to 135.9 m) are
// scaled above the podium so the top is the verified 111 m. The elevated deck w393090492 (OSM 4.5-6 m, start 1986) that meets the
// podium is hidden by this plan and so modelled here as a slab on columns (column spacing estimated). Not placed (position unknown): the external observation lifts.
LANDMARKS.sgpanpacific = {zh:'泛太平洋酒店', en:'Pan Pacific Singapore', cat:'new', r:120, h:111,
  lt:{m:1, c:'#ffe7c6', k:0.6, fh:2.9, cw:3.2},
  build(){
    const g = new THREE.Group(), B = mkB(), k = 'sgpanpacific';
    const Y = y => y <= 17.1 ? y : 16.5 + (y - 16.5)*(111 - 16.5)/(135.9 - 16.5);
    const P0 = byO(k, 'w741940347')[0][2], T = byO(k, 'w172373822')[0][2], U = byO(k, 'w393090488')[0][2], X = byO(k, 'w393090482')[0][2], O = byO(k, 'w393090400')[0][2];
    const M = {W:{c:'#eef2f2', m:0, lk:0.25}, WIN:{c:'#3d4b55', m:1, fh:2.9, cw:3.2}, TR:'#ffffff', SHOP:{c:'#47545a', glow:'#ffe2b6', gk:0.85}, ROOF:'#9ea4a6',
      CL:{c:'#4f6670', glow:'#ffe8c8', gk:0.6}, CROWN:{c:'#f4f6f6', m:0, lc:'#fff1d6', lk:1.3}, FOUND:'#8f8b84', PL:'#7d8487'};
    foundP(B, P0, 0, M.FOUND);
    // podium: rendered white, a glazed ground floor, horizontal bands
    prismP(B.p(M.W), P0, 0, 17.1, false); roofF(B, P0, 17.1, {wall:M.W, roof:M.ROOF, par:1.0, parC:M.TR});
    for (const E of edgesF(P0)){ if (E.L < 4) continue; shapeP(B.p(M.SHOP), rectO(0.6, E.L - 0.6, 0.4, 4.6), E.F, 0.05);
      for (const y of [6.5, 10.2, 13.9]) shapeP(B.p(M.WIN), rectO(1.0, E.L - 1.0, y, y + 1.6), E.F, 0.05); }
    bandP(B.p(M.TR), P0, 5.2, 0.5, 0.3);
    // tower: one window band per floor on every facet, so the zig-zag bays of the south face read as a sawtooth of glass strips
    const y1 = Y(108.9), y2 = Y(122.7);
    ribbonP(B, T, 17.1, y1, {wall:M.W, win:M.WIN, fh:2.9, sill:0.95, wh:1.45, minL:1.6, top:0.3});
    ribbonP(B, U, y1, y2, {wall:M.W, win:M.WIN, fh:2.9, sill:0.95, wh:1.45, minL:1.6, top:0.6});
    capP(B.p(M.ROOF), T, y1); roofF(B, U, y2, {wall:M.W, roof:M.ROOF, par:1.1, parC:M.TR});
    for (const E of edgesF(T)) if (E.L > 6) for (const u of [0.4, E.L - 0.4]) slabP(B.p(M.TR), rectO(u - 0.35, u + 0.35, 17.1, y1), E.F, 0, 0.3);
    // the box on the north side (former top-floor restaurant, now the club lounge) and the round top
    const yx0 = Y(122.1), yx1 = Y(132.6), yo1 = Y(135.9);
    prismP(B.p(M.W), X, yx0, yx1, false); for (const E of edgesF(X)) shapeP(B.p(M.CL), rectO(0.8, E.L - 0.8, yx0 + 1.0, yx1 - 1.4), E.F, 0.05);
    roofF(B, X, yx1, {wall:M.W, roof:M.ROOF, par:0.8, parC:M.TR});
    prismP(B.p(M.CROWN), O, yx1, yo1, false); capP(B.p(M.ROOF), O, yo1); bandP(B.p(M.TR), O, yo1 - 0.6, 0.6, 0.3);
    { const c = ctr(U); boxP(B.p(M.PL), 10, 2.8, 6, c[0] + 6, y2, c[1] + 6); }
    xtraB(B, k); B.flush(g); return g;
  }};
placeK('sgpanpacific');
// ---- generic: one OSM building part as a block of a given style; Y = height mapping (scaling to a verified height) ----
function partB(B, p, S, Y){
  Y = Y || (y => y); const y0 = Y(p[0]), y1 = Y(p[1]), P = p[2];
  if (p[0] < 0.5) foundP(B, P, 0, S.found || '#8f8b84');
  const k = S.kind || 'punch';
  if (k === 'glass') glassP(B, P, y0, y1, S);
  else if (k === 'ribbon') ribbonP(B, P, y0, y1, S);
  else if (k === 'tier'){ prismP(B.p(S.wall), P, y0, y1, false);   // a terraced block: a glazed band per floor behind balcony fronts, balustrade on top
    const fh = S.fh || 3.3; for (const E of edgesF(P)) if (E.L > 1.2) for (let y = y1 - fh; y >= y0 - 0.1; y -= fh) shapeP(B.p(S.win), rectO(0.2, E.L - 0.2, y + 1.0, y + fh - 0.5), E.F, 0.05);
    capP(B.p(S.roof || S.wall), P, y1); parP(B.p(S.parC || S.wall), P, y1, y1 + 1.0, 0.18); return; }
  else if (k === 'solid') prismP(B.p(S.wall), P, y0, y1, false);
  else punchP(B, P, y0, y1, S);
  if (S.roofOff !== true) roofF(B, P, y1, S);
}
const cssC = {black:'#2a2b2d', white:'#f1f1ee', lightgrey:'#c9cacb', grey:'#9a9b9c', darkgrey:'#5f6163', brown:'#8a5a44', red:'#9b4b3a', teal:'#3f8f86'};
const oCol = (p, def) => { const c = p[4] && p[4].c; return c ? (cssC[c] || c) : def; };

// ================= Marina Square (1987), Marina Centre - the mall podium joining the three hotels =================
// Verified: Marina Centre complex with the Pan Pacific, Mandarin Oriental and PARKROYAL COLLECTION Marina Bay (Wikipedia). Model =
// the OSM building parts of w303311927 that are not hotel parts (assigned by the hotels' OSM outlines w155987124 / w46594816 /
// w742205653), heights and colours from OSM (#cebc9b concrete podium, grey link blocks). Split into three keys so no plan hull
// covers streets' buildings: the main west podium (sgmarinasquare), the north-east wing and link by the Pan Pacific (sgmarinasquare2,
// unlabelled) and the south-east wing under the Mandarin Oriental (sgmarinasquare3, unlabelled). Facade treatment is an estimate.
const msBuild = k => () => {
  const g = new THREE.Group(), B = mkB();
  const SHOP = {c:'#4c5559', glow:'#ffe0b0', gk:0.85}, WIN = {c:'#3e4a52', m:1, fh:3.4, cw:3.0}, ROOF = '#a3a29a', TR = '#efe8d8';
  for (const p of DK(k).p){
    const W = {c:oCol(p, '#cebc9b'), m:0, lk:0.3};
    if (p[0] < 0.5){ foundP(B, p[2], 0, '#8f8b84'); prismP(B.p(W), p[2], 0, p[1], false);
      for (const E of edgesF(p[2])){ if (E.L < 6) continue; shapeP(B.p(SHOP), rectO(1, E.L - 1, 0.4, 4.2), E.F, 0.05);
        for (let y = 5.6; y < p[1] - 2.5; y += 3.4) shapeP(B.p(WIN), rectO(1.5, E.L - 1.5, y, y + 1.1), E.F, 0.05); }
      bandP(B.p(TR), p[2], 4.6, 0.5, 0.35); }
    else { prismP(B.p(W), p[2], p[0], p[1], false); for (const E of edgesF(p[2])) if (E.L > 5) shapeP(B.p(WIN), rectO(1, E.L - 1, p[0] + 1.0, p[1] - 1.2), E.F, 0.05); }
    roofF(B, p[2], p[1], {wall:W, roof:ROOF, par:0.9, parC:TR, plant:'#8c8e88'});
  }
  xtraB(B, k); B.flush(g); return g; };
LANDMARKS.sgmarinasquare = {zh:'滨海广场', en:'Marina Square', cat:'new', r:DK('sgmarinasquare').r, h:17.1, lt:{m:0, c:'#ffe6c4', k:0.35, e:0.3}, build:msBuild('sgmarinasquare')};
LANDMARKS.sgmarinasquare2 = {zh:'滨海广场', en:'Marina Square', cat:'new', label:false, r:DK('sgmarinasquare2').r, h:13.8, lt:{m:0, c:'#ffe6c4', k:0.35, e:0.3}, build:msBuild('sgmarinasquare2')};
LANDMARKS.sgmarinasquare3 = {zh:'滨海广场', en:'Marina Square', cat:'new', label:false, r:DK('sgmarinasquare3').r, h:17.1, lt:{m:0, c:'#ffe6c4', k:0.35, e:0.3}, build:msBuild('sgmarinasquare3')};
placeK('sgmarinasquare'); placeK('sgmarinasquare2'); placeK('sgmarinasquare3');

// ================= PARKROYAL COLLECTION Marina Bay (former Marina Mandarin; John Portman with DP Architects, 1987) =================
// Verified (Wikipedia): 21 levels, opened 1987, Portman + DP, one of the largest open atriums in South-East Asia (21 levels) with
// rooms off balconies overlooking it. Massing = the OSM parts inside w742205653: a stack of one-storey tiers (#A8AF9F) stepping back
// in a curve above the podium, the tall room slab w742205656 (#E5DCD5) along the north-east, a dark crown storey (#26272B) and a
// pale curved top (#FAF5E1); heights from the OSM levels (76.5 m, not verified). The tier fronts' glazing is an estimate.
LANDMARKS.sgmarinamandarin = {zh:'滨华大酒店', en:'PARKROYAL COLLECTION Marina Bay', cat:'new', r:DK('sgmarinamandarin').r, h:76.5,
  lt:{m:1, c:'#ffe9c8', k:0.55, fh:3.3, cw:3.0},
  build(){
    const g = new THREE.Group(), B = mkB(), WIN = {c:'#3b4850', m:1, fh:3.3, cw:3.0};
    for (const p of DK('sgmarinamandarin').p){
      const W = {c:oCol(p, '#e5dcd5'), m:0, lk:0.3}, o = p[3];
      if (o === 'w742205656') partB(B, p, {kind:'ribbon', wall:W, win:WIN, fh:3.3, sill:0.9, wh:1.5, roof:'#9b9a94', par:1.0, parC:'#f4efe6'});
      else if (o === 'w742205647') partB(B, p, {kind:'solid', wall:{c:'#2a2b2f', m:0, lc:'#ffe2b8', lk:1.0}, roof:'#3a3b3f', par:0.6});
      else if (o === 'w742205648') partB(B, p, {kind:'solid', wall:{c:'#faf5e1', m:0, lc:'#fff1d4', lk:1.2}, roof:'#e8e2cc', par:0.8});
      else partB(B, [Math.max(p[0], 10.5), p[1], p[2]], {kind:'tier', wall:W, win:WIN, fh:3.3, roof:'#b9bfae', parC:'#e9ece3'});
    }
    B.flush(g); return g;
  }};
placeK('sgmarinamandarin');

// ================= Mandarin Oriental, Singapore (John Portman & Associates, 1987), Marina Square =================
// Verified: 83.2 m, 21 floors, 1987, Portman (skyscrapercenter); the exterior was meant to resemble a fan; an atrium design
// (Wikipedia). Massing = the OSM parts inside w46594816: one-storey tiers (#EBEEEB) whose zig-zag balcony fronts step back towards the
// bay-side point - the fan - the tall part w393090402 and the core w741934166 (#7E8997) with its top; OSM heights (to 76.5 m) scaled
// so the top is the verified 83.2 m.
LANDMARKS.sgmandarinoriental = {zh:'文华东方酒店', en:'Mandarin Oriental Singapore', cat:'new', r:DK('sgmandarinoriental').r, h:83.2,
  lt:{m:1, c:'#ffe9c8', k:0.55, fh:3.6, cw:3.0},
  build(){
    const g = new THREE.Group(), B = mkB(), WIN = {c:'#3b4850', m:1, fh:3.6, cw:3.0}, s = 83.2/76.5, Y = y => y*s;
    const W = {c:'#eceeec', m:0, lk:0.3};
    for (const p of DK('sgmandarinoriental').p){
      const o = p[3];
      if (o === 'w741934166') partB(B, p, {kind:'ribbon', wall:{c:'#7e8997', m:0, lk:0.2}, win:WIN, fh:3.6, sill:1.0, wh:1.4, roof:'#8d9399', par:0.8}, Y);
      else if (o === 'w393090402') partB(B, p, {kind:'ribbon', wall:W, win:WIN, fh:3.6, sill:1.0, wh:1.6, roof:'#a9aca8', par:1.0, parC:'#ffffff'}, Y);
      else if (o === 'w741934151') partB(B, p, {kind:'solid', wall:{c:'#eceeec', m:0, lc:'#fff1d6', lk:1.2}, roof:'#a9aca8', par:0.8}, Y);
      else partB(B, [Math.max(Y(p[0]), 17.1), Y(p[1]), p[2]], {kind:'tier', wall:W, win:WIN, fh:3.6, roof:'#bfc4bf', parC:'#ffffff'});
    }
    B.flush(g); return g;
  }};
placeK('sgmandarinoriental');

// ================= Centennial Tower (Kevin Roche John Dinkeloo; reclad by Thom Mayne / Morphosis), 3 Temasek Avenue =================
// Verified: roof 158 m, 37 floors (Wikipedia tallest list; article); elliptical plan following the curve of Temasek Avenue; granite
// and curtain-wall cladding, Mayne's recladding a metal covering of interlinking window modules; a 12 m ornamental trellis crowns the
// tower (complementing the Millenia Tower pyramid). Footprint w155988210 (OSM colour #757974). The Conrad Centennial hotel is a
// separate building (not on this footprint) and is not modelled here. Estimates: module pattern, lobby height, trellis form.
LANDMARKS.sgcentennial = {zh:'百年大厦', en:'Centennial Tower', cat:'new', r:DK('sgcentennial').r, h:170,
  lt:{m:1, c:'#e4eef4', k:0.6, fh:4.05, cw:3.0},
  build(){
    const g = new THREE.Group(), B = mkB(), P = PK('sgcentennial', 0)[2];
    const GL = {c:'#5d6b74', m:1, fh:4.05, cw:3.0}, MET = {c:'#8f9599', m:0, lk:0.2}, MD = {c:'#6c7276', m:0, lk:0.15}, LOB = {c:'#8ea0a8', glow:'#ffe8c8', gk:0.85}, GR = '#9a958e', TRL = {c:'#b9bec2', m:0, lc:'#eaf6ff', lk:1.3};
    foundP(B, P, 0, '#8a8680');
    prismP(B.p(LOB), offP(P, 1.5), 0, 8, false); for (const [x, z] of alongP(P, 6)) boxP(B.p(GR), 1.0, 8, 1.0, x, 0, z);
    const Y0 = 8, YT = 158;
    glassP(B, P, Y0, YT, {glass:GL, band:MET, mull:MD, fh:4.05, bh:0.7, bd:0.25, bay:3.0, md:0.35, mw:0.14});
    // interlinking window modules: a staggered pattern of deeper metal frames every two floors
    for (const E of edgesF(P)){ if (E.L < 6) continue; const k = Math.round(E.L/6);
      for (let f = 0; f < 37; f += 2) for (let j = 0; j < k; j++){ if ((j + f/2) % 2) continue; const u = (j + 0.5)*E.L/k, v = Y0 + f*4.05;
        slabP(B.p(MET), rectO(u - E.L/k/2 + 0.2, u + E.L/k/2 - 0.2, v + 0.2, v + 0.6), E.F, 0.2, 0.75); slabP(B.p(MET), rectO(u - E.L/k/2 + 0.2, u - E.L/k/2 + 0.6, v + 0.2, v + 7.9), E.F, 0.2, 0.75); } }
    roofF(B, P, YT, {wall:MET, roof:'#7b8084', par:1.0, parC:MET});
    trellisP(B, offP(P, 1.0), YT, YT + 12, TRL, 3.2, 0.16);
    B.flush(g); return g;
  }};
placeK('sgcentennial');

// ================= The Ritz-Carlton, Millenia Singapore (Kevin Roche John Dinkeloo with DP Architects, 1996), Raffles Avenue =================
// Verified: 129 m architectural height, 32 floors, 1996 (skyscrapercenter; Wikipedia). Massing = the OSM parts of w46594815: the
// long slab w591619207 (OSM colour #c1ccd3, metal) on a 30 m base whose lower 10 m is open between four 10-30 m blocks; OSM heights
// above 30 m (to 140 m) scaled to the verified 129 m. Window grid and colours of glazing are estimates.
LANDMARKS.sgritzcarlton = {zh:'丽思卡尔顿美年酒店', en:'The Ritz-Carlton, Millenia Singapore', cat:'new', r:DK('sgritzcarlton').r, h:129,
  lt:{m:1, c:'#fff0d6', k:0.55, fh:3.6, cw:2.6},
  build(){
    const g = new THREE.Group(), B = mkB(), Y = y => y <= 30 ? y : 30 + (y - 30)*(129 - 30)/(140 - 30);
    const W = {c:'#c8d1d6', m:0, lk:0.3}, WIN = {c:'#3b4851', m:1, fh:3.6, cw:2.6}, TR = '#e3e8ea', LOB = {c:'#7e9098', glow:'#ffe6c2', gk:0.85};
    for (const p of DK('sgritzcarlton').p){
      if (p[0] >= 30) partB(B, p, {kind:'punch', wall:W, win:WIN, fh:3.6, bay:2.6, ww:1.5, wh:2.0, sill:0.9, band:TR, roof:'#9aa3a8', par:1.4, parC:TR, plant:'#8b9296'}, Y);
      else if (p[0] >= 10) partB(B, p, {kind:'ribbon', wall:W, win:WIN, fh:4.0, sill:1.0, wh:2.0, roof:'#9aa3a8', par:0.6}, Y);
      else if (p[1] <= 10){ foundP(B, p[2], 0, '#8f8b84'); prismP(B.p(LOB), offP(p[2], 2.0), 0, 10, false); for (const [x, z] of alongP(p[2], 7)) boxP(B.p(TR), 1.0, 10, 1.0, x, 0, z); capP(B.p(W), p[2], 10); }
      else { prismP(B.p(W), p[2], 10, 30, false); bandP(B.p(TR), p[2], 29.2, 0.8, 0.3); }
    }
    B.flush(g); return g;
  }};
placeK('sgritzcarlton');
// cap of a plan polygon with one hole (courtyard)
function capH(o, P, H, y){ const V = P.concat(H); for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), [H.map(p => new THREE.Vector2(p[0], p[1]))])) o.push(V[a][0], y, V[a][1], V[b][0], y, V[b][1], V[c][0], y, V[c][1]); }
// shophouse-rhythm front on every edge of P: pilasters every `bay`, louvred upper windows, shopfront arcade, cornice
function shopP(B, P, y0, nf, fh, bay, C){
  const yt = y0 + nf*fh; prismP(B.p(C.WALL), P, y0, yt, false);
  for (const E of edgesF(P)){ if (E.L < 3) continue; const k = Math.max(1, Math.round(E.L/bay));
    for (let j = 0; j <= k; j++) slabP(B.p(C.TRIM), rectO(j*E.L/k - 0.22, j*E.L/k + 0.22, y0, yt), E.F, 0, 0.15);
    for (let j = 0; j < k; j++){ const u = (j + 0.5)*E.L/k, hw = Math.min(1.6, E.L/k/2 - 0.5);
      shapeP(B.p(C.SHOP), rectO(u - hw - 0.2, u + hw + 0.2, y0 + 0.2, y0 + fh - 0.8), E.F, 0.05);
      for (let f = 1; f < nf; f++){ const v = y0 + f*fh; for (const s of [-1, 1]) shapeP(B.p(C.LOUV), rectO(u + s*hw*0.08, u + s*hw*0.92, v + 0.8, v + fh - 0.6), E.F, 0.06); } } }
  bandP(B.p(C.TRIM), P, y0 + fh - 0.4, 0.4, 0.2); bandP(B.p(C.TRIM), P, yt - 0.6, 0.6, 0.3);
  return yt; }
// tiled hipped roof over a (roughly rectangular) plan: oriented along its longest edge
// hipped roof following any plan: eaves on the plan (grown by `over`), sloping in to an inset ridge plateau
function loftRoof(o, P, y, h, inset, over){ const A = offP(P, -(over || 0)), Q = offP(P, inset); const yE = y - (over || 0)*h/inset;
  for (let i = 0; i < P.length; i++){ const j = (i + 1) % P.length; quadP(o, [A[i][0], yE, A[i][1]], [A[j][0], yE, A[j][1]], [Q[j][0], y + h, Q[j][1]], [Q[i][0], y + h, Q[i][1]]); }
  capP(o, Q, y + h); }
function hipOn(g, P, y, h, col, over){ { let mnx = 1e9, mxx = -1e9; const A = Math.abs(sArea(P)); let best = 0;
    for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), d = [Math.cos(ang), Math.sin(ang)], n = [-d[1], d[0]];
      let s0 = 1e9, s1 = -1e9, t0 = 1e9, t1 = -1e9; for (const p of P){ const s = p[0]*d[0] + p[1]*d[1], t = p[0]*n[0] + p[1]*n[1]; s0 = Math.min(s0, s); s1 = Math.max(s1, s); t0 = Math.min(t0, t); t1 = Math.max(t1, t); }
      best = Math.max(best, A/((s1 - s0)*(t1 - t0))); }
    if (best < 0.93){ const o = []; let w = 1e9; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l > 2) w = Math.min(w, l); }
      loftRoof(o, P, y, h, Math.max(1.5, Math.min(h*1.1, w*0.45)), over || 0.5); LTris(g, o, col); return; } }
  let bi = 0, bl = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l > bl){ bl = l; bi = i; } }
  const a = P[bi], b = P[(bi+1) % P.length], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), d = [Math.cos(ang), Math.sin(ang)], n = [-d[1], d[0]];
  let s0 = 1e9, s1 = -1e9, t0 = 1e9, t1 = -1e9; for (const p of P){ const s = p[0]*d[0] + p[1]*d[1], t = p[0]*n[0] + p[1]*n[1]; s0 = Math.min(s0, s); s1 = Math.max(s1, s); t0 = Math.min(t0, t); t1 = Math.max(t1, t); }
  const cs = (s0 + s1)/2, ct = (t0 + t1)/2; hipRoof(g, cs*d[0] + ct*n[0], cs*d[1] + ct*n[1], s1 - s0, t1 - t0, y, h, col, -ang, over || 0.6); }
const STD_SHOP = {c:'#47535a', glow:'#ffe0b4', gk:0.85};

// ================= Bugis Junction (Design International, 1995), Victoria Street / Middle Road / North Bridge Road =================
// Verified (Wikipedia): opened 1995; a three-floor mall that rebuilt the shophouses of Bugis, Malay and Hylam Streets and covered
// those streets with glass (air-conditioned); with an office tower and the InterContinental hotel. Model: the mall outline
// w172364977 (OSM 3 levels) and the office tower parts w427133450 / w427133463 (OSM levels 3-15 / 3-13, app tops 50.1 / 43.5 m).
// The glass-covered streets inside the block are not placed (their lines are not in the data). Facade treatments are estimates.
LANDMARKS.sgbugisjunction = {zh:'白沙浮广场', en:'Bugis Junction', cat:'new', r:DK('sgbugisjunction').r, h:50.1,
  lt:{m:1, c:'#ffe6c4', k:0.5, fh:3.3, cw:3.0},
  build(){
    const g = new THREE.Group(), B = mkB(), [mall, t1, t2] = DK('sgbugisjunction').p;
    const W = {c:'#e7dfd0', m:0, lk:0.3}, TR = '#f7f2e8', WIN = {c:'#3c4a52', m:1, fh:3.3, cw:3.0}, GL = {c:'#5d7684', m:1, fh:3.3, cw:3.0}, MUL = '#c4ccd0';
    foundP(B, mall[2], 0, '#8f8b84');
    shopP(B, mall[2], 0, 3, 3.7, 5.2, {WALL:W, TRIM:TR, SHOP:STD_SHOP, LOUV:WIN});
    roofF(B, mall[2], 11.1, {wall:W, roof:'#a8a49a', par:0.9, parC:TR, plant:'#8b8d88'});
    for (const p of [t1, t2]){ glassP(B, p[2], 11.1, p[1], {glass:GL, band:{c:'#d9dde0', m:0}, mull:MUL, fh:3.3, bh:0.8, bd:0.15, bay:1.8});
      roofF(B, p[2], p[1], {wall:W, roof:'#9da2a4', par:1.2, parC:'#d9dde0', plant:'#8b8d88'}); }
    B.flush(g); return g;
  }};
placeK('sgbugisjunction');

// ================= InterContinental Singapore (1995), 80 Middle Road =================
// Verified: 16 storeys, 406 rooms, rooms in a shophouse-style setting preserving Peranakan heritage (Frasers Hospitality); built
// behind restored shophouses (OSM r21057404: 3 levels, 18 m, with an inner courtyard); the hotel block = OSM part w254815933
// (levels 3-15). The low ring stops at the tower's north-east face: the app keeps its own row of shophouse pieces along that edge.
// Estimates: tower height (16 storeys -> 52.8 m), shophouse bay width, colours.
LANDMARKS.sgintercon = {zh:'洲际酒店', en:'InterContinental Singapore', cat:'new', r:DK('sgintercon').r, h:52.8,
  lt:{m:1, c:'#ffe7c4', k:0.55, fh:3.3, cw:3.0},
  build(){
    const g = new THREE.Group(), B = mkB(), [lo, tw, inn] = DK('sgintercon').p, H = inn[2];
    const T0 = tw[2][7], T1 = tw[2][6], dl = Math.hypot(T1[0] - T0[0], T1[1] - T0[1]), na = -(T1[1] - T0[1])/dl, nb = (T1[0] - T0[0])/dl;   // tower NE face
    const P = clipH(lo[2], -na, -nb, -(na*T0[0] + nb*T0[1]) + 0.2);
    const W = {c:'#efe4cf', m:0, lk:0.35}, TR = '#fbf6ec', LOUV = {c:'#4c6a5a', m:1, fh:4.5, cw:2.4}, WIN = {c:'#3d4a52', m:1, fh:3.3, cw:3.0}, TW = {c:'#e9dcc6', m:0, lk:0.25};
    foundP(B, P, 0, '#8f8b84');
    // the shophouse ring round the courtyard: three storeys, pilasters, louvred windows, cornice; tiled roofs on the street ranges
    shopP(B, P, 0, 3, 4.5, 4.8, {WALL:W, TRIM:TR, SHOP:STD_SHOP, LOUV});
    wallP(B.p(W), H.slice().reverse(), 0, 13.5); capH(B.p('#a9a59c'), P, H, 13.5); parP(B.p(TR), P, 13.5, 14.3, 0.25);
    for (const E of edgesF(P)){ if (E.L < 12) continue; const a = E.F(0.5, 0, -3.2), b = E.F(E.L - 0.5, 0, -3.2), c = [(a[0] + b[0])/2, (a[2] + b[2])/2];
      hipRoof(g, c[0], c[1], E.L - 1.2, 6.0, 14.3, 3.6, '#9b5a44', -E.ang, 0.4); }
    // the hotel block: cream walls, punched windows, a band per floor, parapet
    punchP(B, tw[2], 14.3, tw[1], {wall:TW, win:WIN, fh:3.3, bay:3.0, ww:1.6, wh:1.9, sill:0.9, band:TR});
    roofF(B, tw[2], tw[1], {wall:TW, roof:'#9f9b92', par:1.2, parC:TR, plant:'#8b8d88'});
     B.flush(g); return g;
  }};
placeK('sgintercon');

// ================= Funan (2019 redevelopment), 107 North Bridge Road =================
// Verified: mall on North Bridge Road, reopened 2019 with offices and serviced apartments (target note). Model = the OSM parts of w432515092 with their OSM levels, colours and materials: a 3-level base
// (#B08366), a metal-clad podium (#B6BBBF, levels 3-6), two office blocks (#405165, levels 6-12) and two small metal blocks (levels
// 6-10) plus the serviced-apartment block lyf Funan (OSM w699175606, levels 3-12) that rises from the podium. The north-east wing is the
// unlabelled sub-key sgfunan2 so the main plan hull leaves the Peninsula Hotel tower next to it alone. Facade patterns are estimates.
const funanB = k => () => {
    const g = new THREE.Group(), B = mkB();
    const GL = {c:'#425a72', m:1, fh:3.4, cw:3.0}, WIN = {c:'#3a4650', m:1, fh:3.4, cw:3.0};
    for (const p of DK(k).p){
      const c = oCol(p, '#b6bbbf'), W = {c, m:0, lk:0.3}, P = p[2];
      if (p[0] < 0.5){ foundP(B, P, 0, '#8f8b84'); prismP(B.p(W), P, 0, p[1], false);
        for (const E of edgesF(P)){ if (E.L < 5) continue; shapeP(B.p(STD_SHOP), rectO(0.8, E.L - 0.8, 0.4, 4.4), E.F, 0.05); shapeP(B.p(WIN), rectO(1.2, E.L - 1.2, 5.8, 8.8), E.F, 0.05); }
        capP(B.p(W), P, p[1]); }
      else if (c === '#405165') glassP(B, P, p[0], p[1], {glass:GL, band:{c:'#2c3846', m:0}, mull:'#8d9aa8', fh:3.4, bh:0.7, bay:1.6});
      else { prismP(B.p(W), P, p[0], p[1], false);   // perforated metal cladding: fine vertical louvres
        for (const E of edgesF(P)){ if (E.L < 3) continue; const k = Math.round(E.L/0.9); for (let j = 1; j < k; j++) slabP(B.p('#cfd3d6'), rectO(j*E.L/k - 0.06, j*E.L/k + 0.06, p[0] + 0.3, p[1] - 0.3), E.F, 0, 0.25);
          shapeP(B.p(WIN), rectO(0.6, E.L - 0.6, p[0] + 1.2, p[0] + 2.6), E.F, 0.04); } }
      if (p[0] >= 0.5 || p[1] > 12) roofF(B, P, p[1], {wall:W, roof:(p[4] && p[4].rc) || '#a3a7aa', par:1.0, parC:'#d6dadc', plant:'#8b8d88'});
    }
    B.flush(g); return g; };
LANDMARKS.sgfunan = {zh:'福南', en:'Funan', cat:'new', r:DK('sgfunan').r, h:40.2, lt:{m:1, c:'#e6efff', k:0.5, fh:3.4, cw:3.0}, build:funanB('sgfunan')};
LANDMARKS.sgfunan2 = {zh:'福南', en:'Funan', cat:'new', label:false, r:DK('sgfunan2').r, h:20.4, lt:{m:1, c:'#e6efff', k:0.5, fh:3.4, cw:3.0}, build:funanB('sgfunan2')};
placeK('sgfunan'); placeK('sgfunan2');

// ================= Peninsula Plaza (Alfred Wong Partnership, 1979-80), 111 North Bridge Road =================
// Verified (docomomo Singapore): a five-storey rectilinear retail podium round a central atrium, capped at 18 m; three-dimensional
// arches of fibreglass clad in mosaic tiles; a square office tower set back on one side with a three-storey block between them
// ("wedding cake"); precast concrete ribs wrap the building and rise upward; sun-shading fins. OSM parts (lightgrey concrete): podium
// w1075234631 (5 levels), low block w257193900, tower w257193902 (OSM height 111 m, 30 levels - not verified). Rib spacing, arch
// size and the tile colour are estimates.
LANDMARKS.sgpeninsula = {zh:'半岛广场', en:'Peninsula Plaza', cat:'new', r:DK('sgpeninsula').r, h:111,
  lt:{m:1, c:'#ffe9cc', k:0.5, fh:3.6, cw:2.4},
  build(){
    const g = new THREE.Group(), B = mkB(), k = 'sgpeninsula';
    const W = {c:'#cbc8c0', m:0, lk:0.3}, RIB = '#dedbd3', WIN = {c:'#33404a', m:1, fh:3.6, cw:2.4}, TILE = '#b9a58c', ROOF = '#9e9b94';
    const pod = byO(k, 'w1075234631')[0], low = byO(k, 'w257193900')[0], tw = byO(k, 'w257193902')[0], ex = byO(k, '-')[0];
    foundP(B, pod[2], 0, '#8f8b84');
    prismP(B.p(W), pod[2], 0, 17.1, false); prismP(B.p(W), ex[2], 4.2, 17.1, false);
    // podium: the tiled three-dimensional arches along every long face, glazed shopfronts under them
    for (const E of edgesF(pod[2])){ if (E.L < 10) continue; const n = Math.max(1, Math.round(E.L/12));
      for (let j = 0; j < n; j++){ const u = (j + 0.5)*E.L/n, hw = E.L/n/2 - 0.8;
        shapeP(B.p(STD_SHOP), rectO(u - hw + 0.4, u + hw - 0.4, 0.4, 4.6), E.F, 0.05);
        slabP(B.p(TILE), mv(rArchO(hw, 14.5, 10), u, 2.5), E.F, 0, 0.3);
        shapeP(B.p(WIN), mv(rArchO(hw - 1.2, 12.5, 10), u, 4.8), E.F, 0.32); } }
    roofF(B, pod[2], 17.1, {wall:W, roof:ROOF, par:1.0, parC:RIB});
    // the three-storey block and the square tower: precast ribs rising up the faces, window strips between them
    for (const [p, y1] of [[low, 20.4], [tw, 111]]){
      prismP(B.p(W), p[2], 17.1, y1, false);
      for (const E of edgesF(p[2])){ if (E.L < 3) continue; const n = Math.round(E.L/1.5);
        for (let j = 0; j <= n; j++) slabP(B.p(RIB), rectO(j*E.L/n - 0.18, j*E.L/n + 0.18, 17.1, y1 + 0.6), E.F, 0, 0.55);
        for (let y = 18.2; y < y1 - 2; y += 3.6) shapeP(B.p(WIN), rectO(0.3, E.L - 0.3, y, y + 2.0), E.F, 0.05); }
      roofF(B, p[2], y1, {wall:W, roof:ROOF, par:1.2, parC:RIB, plant:'#8b8d88'}); }
    B.flush(g); return g;
  }};
placeK('sgpeninsula');

// ================= Church of Our Lady of Lourdes (1886-88; national monument), Ophir Road =================
// Verified (roots.gov.sg; Wikipedia): neo-Gothic, resembling the sanctuary at Lourdes; an eight-petalled rose window on the front
// facade; an angel statue above the porch; lancet windows; a three-aisled nave; the octagonal sanctuary (extended 1998). Footprint
// w191010560 (unnamed, under the church POI): entrance on the Ophir Road (south-west) side, polygonal apse to the north-east.
// Estimates: heights (eaves 9.5 m, front tower and spire to 30 m), the front tower itself, colours.
LANDMARKS.sglourdes = {zh:'露德圣母堂', en:'Church of Our Lady of Lourdes', cat:'old', r:DK('sglourdes').r, h:30,
  lt:{m:0, c:'#fff1d8', k:0.65, e:0.6, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), P = PK('sglourdes', 0)[2], A = -42.5, ry = -A*PI/180;
    const W = {c:'#f1ebdf', m:0}, TR = '#fbf8f2', DK_ = '#2c2a29', GLS = {c:'#5a5371', glow:'#ffd9a0', gk:0.55}, ROOF = '#6f6b68', SP = '#c9c4ba';
    const S = (s, t, y) => { const q = stXZ(A, s, t); return [q[0], y, q[1]]; };
    let s0 = 1e9, s1 = -1e9, t0 = 1e9, t1 = -1e9; const [d, n] = axisD(A); for (const p of P){ const s = p[0]*d[0] + p[1]*d[1], t = p[0]*n[0] + p[1]*n[1]; s0 = Math.min(s0, s); s1 = Math.max(s1, s); t0 = Math.min(t0, t); t1 = Math.max(t1, t); }
    foundP(B, P, 0, '#a59e92');
    const body = band(P, A, s0 + 3.6, s1, t0 - 1, t1 + 1), front = band(P, A, s0 - 1, s0 + 3.6, t0 - 1, t1 + 1);
    prismP(B.p(W), body, 0, 9.5, false); prismP(B.p(W), front, 0, 9.5, false);
    bandP(B.p(TR), body, 8.9, 0.6, 0.25); bandP(B.p(TR), body, 0, 0.8, 0.15);
    const Fr = frm(A*PI/180), tm = (t0 + t1)/2, hw = (t1 - t0)/2;
    gableR(B.p(ROOF), Fr, s0 + 3.4, s1 - 4, tm - hw + 0.4, tm + hw - 0.4, 9.5, 6.5, 0.6, B.p(W), 'u', 0.04);
    { const c = S(s1 - 4.5, tm, 0); LCyl(g, 0, 4.6, 5.0, c[0], 9.5, c[2], ROOF, 8, ry); }      // the polygonal apse roof
    for (const E of edgesF(body)){ if (E.L < 5) continue; const k = Math.max(1, Math.round(E.L/3.6));
      for (let j = 0; j < k; j++){ const u = (j + 0.5)*E.L/k; shapeP(B.p(GLS), mv(pArch(0.7, 5.4, 5), u, 2.0), E.F, 0.04); }
      for (let j = 0; j <= k; j++) slabP(B.p(TR), rectO(j*E.L/k - 0.3, j*E.L/k + 0.3, 0, 9.0), E.F, 0, 0.45); }
    // west front: gable, rose window, lancet doors, a central tower with a spire over the porch
    const Ff = (u, v, w) => S(s0 + 0.3 - (w || 0), t0 + u, v), L = t1 - t0;
    shapeP(B.p(W), [[0, 9.5], [L, 9.5], [L/2, 16.5]], Ff, 0.05);
    shapeP(B.p(TR), mv(circ(2.0, 16), L/2, 7.6), Ff, 0.1); shapeP(B.p(GLS), mv(circ(1.7, 16), L/2, 7.6), Ff, 0.14);
    for (let i = 0; i < 8; i++){ const a = i/8*TAU; shapeP(B.p(TR), mv(circ(0.32, 8), L/2 + Math.cos(a)*1.0, 7.6 + Math.sin(a)*1.0), Ff, 0.16); }
    for (const u of [L*0.2, L*0.8]) shapeP(B.p(DK_), mv(pArch(0.8, 4.0, 5), u, 0.3), Ff, 0.08);
    const tc = S(s0 - 0.6, tm, 0);
    LBox(g, 3.6, 18.5, 3.6, tc[0], 0, tc[2], TR, ry);
    for (const y of [3.2, 12.5]){ const q = S(s0 - 2.45, tm, 0); LBox(g, 1.3, y < 5 ? 3.4 : 2.6, 0.2, q[0], y < 5 ? 0.3 : 13.6, q[2], DK_, ry); }
    LCone(g, 2.6, 11.5, tc[0], 18.5, tc[2], SP, 8, PI/8 + ry);
    LBox(g, 0.16, 1.6, 0.16, tc[0], 30.0, tc[2], '#d8c27a', ry); LBox(g, 0.8, 0.16, 0.16, tc[0], 30.9, tc[2], '#d8c27a', ry);
    B.flush(g); return g;
  }};
placeK('sglourdes');

// ================= Textile Centre (Jalan Sultan) =================
// Verified (Wikipedia): 25 storeys, built 1972-74; shops, offices, apartments and a carpark. OSM w173394787 with part w427139534 (a
// 7-level podium under levels 7-25); app heights 23.1 / 83.1 m (data, not verified). Facade (punched windows, bands), colours: estimates.
LANDMARKS.sgtextile = {zh:'纺织中心', en:'Textile Centre', cat:'new', r:DK('sgtextile').r, h:83.1,
  lt:{m:1, c:'#ffe7c4', k:0.45, fh:3.3, cw:2.8},
  build(){
    const g = new THREE.Group(), B = mkB(), [up, lo] = DK('sgtextile').p;
    const W = {c:'#d9d4c8', m:0, lk:0.3}, TR = '#ece8de', WIN = {c:'#3b4750', m:1, fh:3.3, cw:2.8};
    foundP(B, lo[2], 0, '#8f8b84');
    prismP(B.p(W), lo[2], 0, 23.1, false);
    for (const E of edgesF(lo[2])){ if (E.L < 5) continue; shapeP(B.p(STD_SHOP), rectO(0.8, E.L - 0.8, 0.4, 4.2), E.F, 0.05); for (let y = 5.6; y < 22; y += 3.3) shapeP(B.p(WIN), rectO(1.0, E.L - 1.0, y + 0.8, y + 2.2), E.F, 0.05); }
    bandP(B.p(TR), lo[2], 22.5, 0.9, 0.35);
    punchP(B, up[2], 23.1, 83.1, {wall:W, win:WIN, fh:3.3, bay:2.8, ww:1.7, wh:1.7, sill:0.9, band:TR});
    roofF(B, up[2], 83.1, {wall:W, roof:'#a19d94', par:1.2, parC:TR, plant:'#8b8d88'});
    B.flush(g); return g;
  }};
placeK('sgtextile');

// ================= Riverside Point (Merchant Road, facing Clarke Quay) =================
// Verified (Wikipedia): opened August 1996, four storeys, by Andrew Tan Architects as a lifestyle centre keeping the old-world charm of
// the riverside godowns it replaced. OSM w45070916 (4 levels, height 25) with seven parts (4 levels each, roof:shape gabled; app top
// 13.8 m) along the bank. Model: each part a four-storey block under its own gabled roof, an arcade. Not modelled (position unknown):
// the pointed walk-through gateway and the tower landmark. Colours, arcade and roof pitch are estimates.
LANDMARKS.sgriversidepoint = {zh:'河畔坊', en:'Riverside Point', cat:'new', r:DK('sgriversidepoint').r, h:19,
  lt:{m:0, c:'#ffe4bc', k:0.5, e:0.4},
  build(){
    const g = new THREE.Group(), B = mkB();
    const W = {c:'#efe3cc', m:0, lk:0.3}, TR = '#fbf5ea', WIN = {c:'#3c4850', m:1, fh:3.3, cw:2.6}, ROOF = '#8f5a46';
    for (const p of DK('sgriversidepoint').p){
      const P = p[2]; foundP(B, P, 0, '#8f8b84');
      shopP(B, P, 0, 4, 3.45, 4.2, {WALL:W, TRIM:TR, SHOP:STD_SHOP, LOUV:WIN});
      // gable roof along the part's long axis, gable ends in wall colour
      let bi = 0, bl = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l > bl){ bl = l; bi = i; } }
      const a = P[bi], b = P[(bi+1) % P.length], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), Fr = frm(ang);
      let s0 = 1e9, s1 = -1e9, t0 = 1e9, t1 = -1e9; for (const q of P){ const s = q[0]*Math.cos(ang) + q[1]*Math.sin(ang), t = -q[0]*Math.sin(ang) + q[1]*Math.cos(ang); s0 = Math.min(s0, s); s1 = Math.max(s1, s); t0 = Math.min(t0, t); t1 = Math.max(t1, t); }
      gableR(B.p(ROOF), Fr, s0, s1, t0, t1, 13.8, Math.min(5.2, (t1 - t0)*0.28), 0.6, B.p(W), 'u', 0.02);
    }
    B.flush(g); return g;
  }};
placeK('sgriversidepoint');

// ================= Prinsep Street Presbyterian Church (C.J. Stephens of Swan & Maclaren, 1930; national monument 2000) =================
// Verified (Wikipedia / roots): Romanesque style; deep red brick; lightly modelled brickwork rising in a gable at the front following
// the roof; raised brickwork on the tower and belfry. Footprint w172596749 (T-plan: the hall on axis 39 deg and a narrow range across
// its Prinsep Street (south-east) end; the hall's gable rises over the range). Not placed (position not verified): the tower and belfry. Estimates: heights, roof colour, window rhythm.
LANDMARKS.sgprinsep = {zh:'布连拾街长老会', en:'Prinsep Street Presbyterian Church', cat:'old', r:DK('sgprinsep').r, h:16.5,
  lt:{m:0, c:'#ffe6c8', k:0.6, e:0.6, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), P = PK('sgprinsep', 0)[2], A = 39.0;
    const BR = {c:'#8e3b2b', m:0}, BR2 = '#a54a36', TR = '#e6dccb', GLS = {c:'#4d4a5c', glow:'#ffd9a0', gk:0.5}, ROOF = '#6d4d42';
    foundP(B, P, 0, '#8f8b84');
    const hall = band(P, A, -30, 5.4, -30, 30), range = band(P, A, 5.4, 30, -30, 30);   // the hall and the range across its Prinsep Street end
    prismP(B.p(BR), hall, 0, 9.0, false); prismP(B.p(BR), range, 0, 7.0, false);
    bandP(B.p(BR2), hall, 8.4, 0.6, 0.15); bandP(B.p(BR2), range, 6.4, 0.6, 0.15); bandP(B.p(TR), hall, 0, 0.7, 0.1); bandP(B.p(TR), range, 0, 0.7, 0.1);
    const Fr = frm(A*PI/180); let t0 = 1e9, t1 = -1e9, s0 = 1e9; const [d, n] = axisD(A); for (const p of hall){ const t = p[0]*n[0] + p[1]*n[1], s = p[0]*d[0] + p[1]*d[1]; t0 = Math.min(t0, t); t1 = Math.max(t1, t); s0 = Math.min(s0, s); }
    gableR(B.p(ROOF), Fr, s0, 5.6, t0, t1, 9.0, 5.6, 0.5, B.p(BR), 'u', 0.03);
    hipOn(g, range, 7.0, 2.4, ROOF, 0.5);
    // round-arched windows with brick surrounds along the hall and the range; buttress piers on the hall
    for (const [Q, yt] of [[hall, 8.4], [range, 6.4]]) for (const E of edgesF(Q)){ if (E.L < 8) continue; const k = Math.round(E.L/3.4);
      for (let j = 0; j < k; j++){ const u = (j + 0.5)*E.L/k, h = yt > 7 ? 4.6 : 3.4; slabP(B.p(BR2), mv(rArchO(0.85, h, 8), u, 1.8), E.F, 0, 0.12); shapeP(B.p(GLS), mv(rArchO(0.62, h - 0.3, 8), u, 1.95), E.F, 0.14); }
      if (yt > 7) for (let j = 0; j <= k; j++) slabP(B.p(BR2), rectO(j*E.L/k - 0.35, j*E.L/k + 0.35, 0, 8.4), E.F, 0, 0.35); }
    // the hall's front gable rising over the range: raised brick courses following the roof slope, a round-arched window
    { const L = t1 - t0, F = (u, v, w) => { const q = stXZ(A, 5.6 + (w || 0), t0 + u); return [q[0], v, q[1]]; };
      for (let i = 0; i < 6; i++){ const y = 9 + i*0.93, h = L/2*(1 - (i + 1)/6.2); slabP(B.p(BR2), rectO(L/2 - h, L/2 + h, y, y + 0.93), F, 0, 0.2); }
      slabP(B.p(BR2), mv(rArchO(1.2, 3.6, 10), L/2, 9.4), F, 0, 0.3); shapeP(B.p(GLS), mv(rArchO(0.95, 3.3, 10), L/2, 9.55), F, 0.32);
      for (const u of [L/2 - 4.5, L/2 + 4.5]) slabP(B.p(BR2), rectO(u - 0.4, u + 0.4, 7.0, 9.0 + 4.6*(1 - Math.abs(u - L/2)/(L/2))), F, 0, 0.4); }
    B.flush(g); return g;
  }};
placeK('sgwesley');

// ================= PARKROYAL on Beach Road and The Plaza tower (1979), 7500 Beach Road =================
// Verified (Wikipedia, The Plaza): completed 1979; a 30-storey residential / commercial tower of "triangular prism" design with concave
// faces, and an adjoining 8-storey building housing the hotel. Hotel = OSM w47134224 (OSM 6 levels; modelled with the verified 8
// storeys); tower = OSM w190945737 (OSM 32 levels, app 106.8 m - not verified), as the unlabelled sub-key sgparkroyalbeach2.
// Facade patterns and colours are estimates.
LANDMARKS.sgparkroyalbeach = {zh:'海滩路皇家公园酒店', en:'PARKROYAL on Beach Road', cat:'new', r:DK('sgparkroyalbeach').r, h:25,
  lt:{m:1, c:'#ffe7c4', k:0.5, fh:3.1, cw:2.8},
  build(){
    const g = new THREE.Group(), B = mkB();
    const W = {c:'#e3ddd1', m:0, lk:0.3}, TR = '#f3efe6', WIN = {c:'#3c4850', m:1, fh:3.1, cw:2.8};
    for (const p of DK('sgparkroyalbeach').p){
      const P = p[2]; if (p[0] < 0.5) foundP(B, P, 0, '#8f8b84');
      const y0 = p[0] > 0.5 ? 4.2 : 0; prismP(B.p(W), P, y0, 24.8, false);
      if (p[3] === 'w47134224') for (const E of edgesF(P)){ if (E.L < 4) continue; shapeP(B.p(STD_SHOP), rectO(0.6, E.L - 0.6, 0.4, 4.0), E.F, 0.05);
        for (let f = 1; f < 8; f++){ const v = f*3.1; shapeP(B.p(WIN), rectO(0.6, E.L - 0.6, v + 0.8, v + 2.3), E.F, 0.05); slabP(B.p(TR), rectO(0, E.L, v, v + 0.3), E.F, 0, 0.5); } }
      roofF(B, P, 24.8, {wall:W, roof:'#a3a097', par:1.0, parC:TR, plant:'#8b8d88'});
    }
    B.flush(g); return g;
  }};
LANDMARKS.sgparkroyalbeach2 = {zh:'海滩路皇家公园酒店', en:'PARKROYAL on Beach Road', cat:'new', label:false, r:DK('sgparkroyalbeach2').r, h:106.8,
  lt:{m:1, c:'#ffe7c4', k:0.5, fh:3.3, cw:2.6},
  build(){
    const g = new THREE.Group(), B = mkB(), P = PK('sgparkroyalbeach2', 0)[2];
    const W = {c:'#e6e0d4', m:0, lk:0.3}, TR = '#f5f1e8', WIN = {c:'#3c4850', m:1, fh:3.3, cw:2.6};
    foundP(B, P, 0, '#8f8b84');
    prismP(B.p(W), P, 0, 106.8, false);
    for (const E of edgesF(P)){ if (E.L < 3) continue; shapeP(B.p(STD_SHOP), rectO(0.5, E.L - 0.5, 0.4, 4.0), E.F, 0.05);
      for (let y = 6.6; y < 105; y += 3.3){ shapeP(B.p(WIN), rectO(0.5, E.L - 0.5, y + 0.9, y + 2.4), E.F, 0.05); slabP(B.p(TR), rectO(0, E.L, y, y + 0.35), E.F, 0, 0.7); } }
    roofF(B, P, 106.8, {wall:W, roof:'#a3a097', par:1.4, parC:TR, plant:'#8b8d88'});
    B.flush(g); return g;
  }};
placeK('sgparkroyalbeach'); placeK('sgparkroyalbeach2');

// ================= Golden Landmark (1983) and Village Hotel Bugis (1988), Victoria Street / Arab Street =================
// Verified: shopping complex completed 1983, the hotel 1988 (Wikipedia); the hotel has 19 storeys and 400 rooms; hotel and complex
// share a mix of Arabic, Asian and Western influences (roots.gov.sg). OSM: podium w47134068 (3 levels), hotel w190945731 (levels 3-20,
// app top 67.2 m). Estimates: the pointed-arch motif used for the Arabic influence, colours.
LANDMARKS.sggoldenlandmark = {zh:'金色地标', en:'Golden Landmark', cat:'new', r:DK('sggoldenlandmark').r, h:67.2,
  lt:{m:1, c:'#ffe2b0', k:0.55, fh:3.0, cw:2.6},
  build(){
    const g = new THREE.Group(), B = mkB(), k = 'sggoldenlandmark';
    const W = {c:'#e2cfa7', m:0, lk:0.35}, TR = {c:'#c9a35a', m:0, lk:0.6}, WIN = {c:'#3d4850', m:1, fh:3.0, cw:2.6}, DKA = '#3a3633';
    for (const p of DK(k).p){
      const P = p[2];
      if (p[3] === 'w190945731'){ punchP(B, P, 11.1, 67.2, {wall:W, win:WIN, fh:3.0, bay:3.0, ww:1.5, wh:1.8, sill:0.8});
        for (const E of edgesF(P)){ if (E.L < 4) continue; const n = Math.max(1, Math.round(E.L/3.0)); for (let j = 0; j < n; j++){ const u = (j + 0.5)*E.L/n; shapeP(B.p(DKA), mv(pArch(0.9, 3.2, 4), u, 63.0), E.F, 0.06); } }
        bandP(B.p(TR), P, 62.4, 0.5, 0.3); roofF(B, P, 67.2, {wall:W, roof:'#a8a091', par:1.4, parC:TR}); }
      else { if (p[0] < 0.5) foundP(B, P, 0, '#8f8b84'); prismP(B.p(W), P, p[0], 11.1, false);
        for (const E of edgesF(P)){ if (E.L < 6) continue; const n = Math.max(1, Math.round(E.L/4.6));
          for (let j = 0; j < n; j++){ const u = (j + 0.5)*E.L/n; if (p[0] < 0.5) shapeP(B.p(STD_SHOP), mv(pArch(1.6, 4.4, 5), u, 0.3), E.F, 0.05); shapeP(B.p(WIN), mv(pArch(1.2, 3.4, 5), u, 6.0), E.F, 0.05); } }
        bandP(B.p(TR), P, 10.3, 0.8, 0.3); roofF(B, P, 11.1, {wall:W, roof:'#a8a091', par:0.9, parC:TR}); }
    }
    B.flush(g); return g;
  }};
placeK('sggoldenlandmark');

// ================= Hotel Grand Pacific, 101 Victoria Street =================
// Verified: none beyond OSM. OSM w172596704 (height 68) with parts w429681542 (16 levels, 68 m) and w429681543 (4 levels, 13.8 m).
// Facade and colours are estimates.
LANDMARKS.sghotelgp = {zh:'大太平洋酒店', en:'Hotel Grand Pacific', cat:'new', r:DK('sghotelgp').r, h:68,
  lt:{m:1, c:'#ffe7c4', k:0.5, fh:3.6, cw:2.8},
  build(){
    const g = new THREE.Group(), B = mkB(), [lo, tw] = DK('sghotelgp').p;
    const W = {c:'#e4ded2', m:0, lk:0.3}, TR = '#f4f0e8', WIN = {c:'#3c4850', m:1, fh:3.6, cw:2.8};
    foundP(B, lo[2], 0, '#8f8b84'); foundP(B, tw[2], 0, '#8f8b84');
    prismP(B.p(W), lo[2], 0, 13.8, false); for (const E of edgesF(lo[2])){ if (E.L < 4) continue; shapeP(B.p(STD_SHOP), rectO(0.6, E.L - 0.6, 0.4, 4.2), E.F, 0.05); shapeP(B.p(WIN), rectO(1, E.L - 1, 6.2, 12.0), E.F, 0.05); }
    roofF(B, lo[2], 13.8, {wall:W, roof:'#a3a097', par:1.0, parC:TR});
    prismP(B.p(W), tw[2], 0, 13.8, false); for (const E of edgesF(tw[2])) if (E.L > 4) shapeP(B.p(STD_SHOP), rectO(0.6, E.L - 0.6, 0.4, 4.2), E.F, 0.05);
    punchP(B, tw[2], 13.8, 68, {wall:W, win:WIN, fh:3.6, bay:3.2, ww:2.0, wh:1.9, sill:0.9, band:TR});
    roofF(B, tw[2], 68, {wall:W, roof:'#a3a097', par:1.4, parC:TR, plant:'#8b8d88'});
    xtraB(B, 'sghotelgp'); B.flush(g); return g;
  }};
placeK('sghotelgp');

// ================= Aliwal Arts Centre (former Chong Cheng Boys' and Chong Pun Girls' School, late 1930s), 28 Aliwal Street =================
// Verified (URA conservation portal): an integrated Chinese boys' and girls' school of the late 1930s - two wings sharing a common
// school hall; Art Deco with clean geometric lines and a flag post. OSM w190944927 (app 12.7 m) + the small block w190945113.
// Not placed: the flag post. Estimates: storeys (3), colours, window rhythm.
LANDMARKS.sgaliwal = {zh:'阿里华艺术中心', en:'Aliwal Arts Centre', cat:'old', r:DK('sgaliwal').r, h:13.5,
  lt:{m:0, c:'#fff0d8', k:0.55, e:0.5},
  build(){
    const g = new THREE.Group(), B = mkB();
    const W = {c:'#f1ede2', m:0}, TR = '#ffffff', WIN = {c:'#3e5048', m:1, fh:4.0, cw:2.4}, ROOF = '#a6a29a';
    for (const p of DK('sgaliwal').p){
      const P = p[2], yt = p[1]; foundP(B, P, 0, '#8f8b84');
      prismP(B.p(W), P, 0, yt, false);
      const nf = Math.max(1, Math.round(yt/4.1));
      for (const E of edgesF(P)){ if (E.L < 3) continue; for (let f = 0; f < nf; f++){ const v = f*4.1; shapeP(B.p(WIN), rectO(0.6, E.L - 0.6, v + 1.2, v + 3.0), E.F, 0.05); slabP(B.p(TR), rectO(0, E.L, v + 3.25, v + 3.6), E.F, 0, 0.6); }
        const k = Math.round(E.L/3.4); for (let j = 1; j < k; j++) slabP(B.p(TR), rectO(j*E.L/k - 0.15, j*E.L/k + 0.15, 0.6, yt), E.F, 0, 0.25); }
      roofF(B, P, yt, {wall:W, roof:ROOF, par:0.9, parC:TR});
    }
    B.flush(g); return g;
  }};
placeK('sgaliwal');

// ================= Children's Museum Singapore (former Anglo-Chinese School building, 1906), 23B Coleman Street =================
// Verified (Wikipedia): the building was part of the Anglo-Chinese School, completed 1906; later the Methodist Book Room and the
// Singapore Philatelic Museum; the Children's Museum (2022). Footprint w172368089 (OSM height 20 m). Estimates: the colonial
// treatment (arcaded verandah, louvred windows, hipped tiled roof), storeys and colours.
LANDMARKS.sgchildrensmuseum = {zh:'新加坡儿童博物馆', en:"Children's Museum Singapore", cat:'old', r:DK('sgchildrensmuseum').r, h:20,
  lt:{m:0, c:'#fff0d8', k:0.6, e:0.5, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), P = PK('sgchildrensmuseum', 0)[2];
    const W = {c:'#f2ead8', m:0}, TR = '#fffdf6', LOUV = {c:'#5b6f58', m:1, fh:5, cw:2.4}, DK2 = '#3b3936', TILE = '#9b5a44';
    foundP(B, P, 0, '#a59e92');
    prismP(B.p(W), P, 0, 15, false); bandP(B.p(TR), P, 4.6, 0.4, 0.25); bandP(B.p(TR), P, 9.6, 0.4, 0.25); bandP(B.p(TR), P, 14.4, 0.6, 0.35);
    for (const E of edgesF(P)){ if (E.L < 4) continue; const k = Math.max(1, Math.round(E.L/3.6));
      for (let j = 0; j < k; j++){ const u = (j + 0.5)*E.L/k, hw = Math.min(1.25, E.L/k/2 - 0.35);
        shapeP(B.p(DK2), mv(rArchO(hw, 3.9, 8), u, 0.3), E.F, 0.05);
        for (const y0 of [5.6, 10.6]) shapeP(B.p(LOUV), rectO(u - hw*0.7, u + hw*0.7, y0, y0 + 2.8), E.F, 0.05); }
      for (let j = 0; j <= k; j++) slabP(B.p(TR), rectO(j*E.L/k - 0.3, j*E.L/k + 0.3, 0, 14.4), E.F, 0, 0.22); }
    hipOn(g, P, 15, 4.8, TILE, 0.8);
    B.flush(g); return g;
  }};
placeK('sgchildrensmuseum');

// ================= Raffles Hospital (opened 2002 in the retrofitted Blanco Court), 585 North Bridge Road =================
// Verified (Wikipedia): 13 floors, L-shaped, retrofitted from the Blanco Court office-and-shopping block keeping its superstructure;
// opened 2002. OSM parts of w47134077 with OSM colours / materials: stone podium #d3bba3 (0-20.4 m), the L-shaped stone block
// #d6cec4 (levels 6-14, to 46.8 m) and a dark-green glass block #455241 (20 levels, 66.6 m). Window patterns are estimates.
LANDMARKS.sgrafflesh = {zh:'莱佛士医院', en:'Raffles Hospital', cat:'new', r:DK('sgrafflesh').r, h:66.6,
  lt:{m:1, c:'#eef6ff', k:0.5, fh:3.4, cw:2.8},
  build(){
    const g = new THREE.Group(), B = mkB(), k = 'sgrafflesh';
    const WIN = {c:'#38454e', m:1, fh:3.4, cw:2.8}, GL = {c:'#455a4d', m:1, fh:3.4, cw:2.8};
    const L = byO(k, 'w427133451')[0], G = byO(k, 'w560277991')[0], Pd = byO(k, 'w560277989');
    const POD = {c:'#d3bba3', m:0, lk:0.3}, ST = {c:'#d6cec4', m:0, lk:0.3};
    foundP(B, Pd[0][2], 0, '#8f8b84'); foundP(B, G[2], 0, '#8f8b84');
    prismP(B.p(POD), Pd[0][2], 0, 20.4, false);
    for (const E of edgesF(Pd[0][2])){ if (E.L < 5) continue; shapeP(B.p(STD_SHOP), rectO(0.8, E.L - 0.8, 0.4, 4.8), E.F, 0.05); for (const y of [7.6, 11.2, 14.8]) shapeP(B.p(WIN), rectO(1.0, E.L - 1.0, y, y + 1.8), E.F, 0.05); }
    roofF(B, Pd[0][2], 20.4, {wall:POD, roof:'#b4a690', par:1.0, parC:'#e6dccd'});
    punchP(B, L[2], 20.4, 46.8, {wall:ST, win:WIN, fh:3.3, bay:3.0, ww:2.0, wh:1.7, sill:0.9, band:'#e8e2d8'});
    roofF(B, L[2], 46.8, {wall:ST, roof:'#b8b0a5', par:1.2, parC:'#e8e2d8', plant:'#8b8d88'});
    glassP(B, G[2], 0, 66.6, {glass:GL, band:{c:'#2f3a33', m:0}, mull:'#8a968e', fh:3.33, bh:0.6, bay:1.6});
    roofF(B, G[2], 66.6, {wall:{c:'#3f4c43', m:0}, roof:'#7f8780', par:1.2, parC:'#8a968e', plant:'#8b8d88'});
    B.flush(g); return g;
  }};
placeK('sgrafflesh');
}
