// ===== lm40 / sg40b: Chinatown, Tanjong Pagar and the upper Singapore River - 12 new landmarks (City Brush, real Singapore 1:1) =====
// Keys: sgchinatowncx, sgalabrar, sgfuktakchi, sgyuehhai, sgjinrikisha, sgmaxwell, sgyingfo, sgsiangcho, sgcantonment, sgordbr,
// sgjiakkim, sguesquare. One block; helpers (triangle batches, plan polygons, facade frames, East Asian roofs) from
// lm22/heritage live inside it. Only LANDMARKS and SG_PLACES are touched. Randomness only from LMCTX.rng.
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
// ---------------- shared Chinese-temple pieces (ridges, porcelain figures, lanterns, lattices) ----------------
// decorated ridge along local x (turned ry about (cx, cz)): roll + face panel; tail = Hokkien swallowtail ends curling up;
// curl = short Teochew / Cantonese end curls; town = dense cut-and-paste porcelain miniature houses, pagodas and figures
function tRidge(B, V, Rn, PAL, cx, cz, a, yr, sag, ry, o){
  o = o || {}; const RC = o.rc || '#3f7b54', TL = o.tl || '#8f4c36';
  const c = Math.cos(ry || 0), s = Math.sin(ry || 0), Rr = (x, y, z) => [cx + x*c + z*s, y, cz - x*s + z*c], yc = x => yr + sag*Math.pow(Math.min(1, Math.abs(x)/a), 2);
  const N = 8; for (let i = 0; i < N; i++){ const x0 = -a + 2*a*i/N, x1 = -a + 2*a*(i + 1)/N; segP(B.p(RC), Rr(x0, yc(x0), 0), Rr(x1, yc(x1), 0), 0.3, 4); const pm = Rr((x0 + x1)/2, 0, 0); boxP(B.p(TL), 2*a/N, 0.6, 0.44, pm[0], yc((x0 + x1)/2) - 0.6, pm[2], ry || 0); }
  if (o.tail){ const T = [[a*0.9, 0], [a + 0.4, 0.15], [a + 0.9, 0.55], [a + 1.25, 1.15], [a + 1.4, 1.75], [a + 1.45, 2.1]];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let k = 0; k < T.length - 1; k++){ const p0 = T[k], p1 = T[k+1];
      segP(B.p(RC), Rr(sx*p0[0], yc(a) + p0[1], sz*0.1*k), Rr(sx*p1[0], yc(a) + p1[1], sz*0.1*(k + 1)), 0.25 - k*0.03, 4); } }
  if (o.curl) for (const sx of [-1, 1]){ const P = [[a - 0.2, 0], [a + 0.25, 0.15], [a + 0.5, 0.55], [a + 0.45, 0.95], [a + 0.2, 1.05]];
    for (let k = 0; k < P.length - 1; k++) segP(B.p(RC), Rr(sx*P[k][0], yc(a) + P[k][1], 0), Rr(sx*P[k+1][0], yc(a) + P[k+1][1], 0), 0.26 - k*0.03, 4); }
  // cut-and-paste porcelain panel on both faces of the ridge
  { const n = Math.max(2, Math.round(2*a/1.4)); for (let i = 0; i < n; i++){ const x0 = -a*0.88 + 1.76*a*i/n, x1 = -a*0.88 + 1.76*a*(i + 0.9)/n, pa = Rr(x0, 0, 0.25), pb = Rr(x1, 0, 0.25), pc = Rr(x0, 0, -0.25), pd = Rr(x1, 0, -0.25), y0 = yc((x0 + x1)/2) - 0.5, col = PAL[(i*3 + 1) % PAL.length];
    vAdd(V, col, t => { quadP(t, [pa[0], y0, pa[2]], [pb[0], y0, pb[2]], [pb[0], y0 + 0.4, pb[2]], [pa[0], y0 + 0.4, pa[2]]); quadP(t, [pd[0], y0, pd[2]], [pc[0], y0, pc[2]], [pc[0], y0 + 0.4, pc[2]], [pd[0], y0 + 0.4, pd[2]]); }); } }
  if (o.figs) for (let i = 1; i < 2*a/0.8 - 1; i++){ const x = -a + i*0.8; if (Math.abs(x) < (o.gap || 1.0)) continue; const p = Rr(x, yc(x) + 0.28, 0), hh = 0.55 + Rn()*0.35, c1 = PAL[Math.floor(Rn()*PAL.length)], c2 = PAL[Math.floor(Rn()*PAL.length)];
    vAdd(V, c1, t => { boxP(t, 0.36, hh*0.62, 0.28, p[0], p[1], p[2], ry || 0); boxP(t, 0.56, 0.1, 0.22, p[0], p[1] + hh*0.45, p[2], ry || 0); });
    vAdd(V, c2, t => { boxP(t, 0.18, hh*0.22, 0.18, p[0], p[1] + hh*0.62, p[2], ry || 0); }); }
  // Teochew "town" ridge: one- and two-storey miniature buildings, pagodas and opera figures crowded along the ridge
  if (o.town){ const n = Math.round(2*a/0.62); for (let i = 0; i < n; i++){ const x = -a + 0.3 + (2*a - 0.6)*i/(n - 1); if (Math.abs(x) < (o.gap || 0)) continue;
      const p = Rr(x, yc(x) + 0.28, 0), k = (i*7 + Math.floor(Rn()*3)) % 6, cw = PAL[(i*5 + 2) % PAL.length], cr = PAL[(i*3 + 5) % PAL.length];
      if (k < 3){ const st = k === 2 ? 2 : 1, w = 0.5, h1 = 0.42;   // miniature hall / two-storey house: wall + roof
        for (let j = 0; j < st; j++){ vAdd(V, cw, t => boxP(t, w*(1 - 0.15*j), h1, 0.34, p[0], p[1] + j*(h1 + 0.14), p[2], ry || 0)); vAdd(V, cr, t => boxP(t, w*(1.25 - 0.15*j), 0.12, 0.48, p[0], p[1] + h1 + j*(h1 + 0.14), p[2], ry || 0)); } }
      else if (k === 3){ for (let j = 0; j < 4; j++) vAdd(V, j % 2 ? cr : cw, t => boxP(t, 0.36 - j*0.06, 0.28, 0.36 - j*0.06, p[0], p[1] + j*0.32, p[2], ry || 0)); }   // pagoda
      else { const hh = 0.5 + Rn()*0.3; vAdd(V, cw, t => { boxP(t, 0.22, hh*0.6, 0.2, p[0], p[1], p[2], ry || 0); }); vAdd(V, cr, t => { boxP(t, 0.34, 0.09, 0.16, p[0], p[1] + hh*0.42, p[2], ry || 0); boxP(t, 0.13, hh*0.22, 0.13, p[0], p[1] + hh*0.6, p[2], ry || 0); }); }
    } }
}
// two porcelain dragons along a ridge (local x, turned ry) facing a centre ornament (pearl on a rod when pearl)
function tDragons(B, V, cx, cz, a, yr, sag, ry, pearl, GOLD){
  const c = Math.cos(ry || 0), s = Math.sin(ry || 0), Rr = (x, y, z) => [cx + x*c + z*s, y, cz - x*s + z*c], yc = x => yr + sag*Math.pow(Math.min(1, Math.abs(x)/a), 2);
  for (const sx of [-1, 1]){ let prev = null; const N = 16;
    for (let i = 0; i <= N; i++){ const t = i/N, x = sx*(0.9 + t*a*0.78), p = Rr(x, yc(x) + 0.5 + 0.38*Math.sin(t*TAU*1.5 + 0.6) + 0.3*(1 - t)*(1 - t), 0.16*Math.sin(t*TAU*1.5));
      if (prev){ const rr = 0.3 - 0.17*t; vAdd(V, '#2f8f5a', o => segP(o, prev, p, rr, 5)); if (i % 2 === 0) vAdd(V, i % 4 ? '#e9c33b' : '#3d6fd0', o => boxP(o, 0.1, rr*1.4, 0.07, p[0], p[1] + rr*0.6, p[2], ry || 0)); }
      prev = p; }
    const h = Rr(sx*0.85, yc(0.85) + 0.85, 0);
    vAdd(V, '#2f8f5a', o => boxP(o, 0.62, 0.38, 0.38, h[0], h[1], h[2], ry || 0));
    vAdd(V, '#d23b2c', o => boxP(o, 0.22, 0.48, 0.44, h[0] + c*sx*0.28, h[1] + 0.08, h[2] - s*sx*0.28, ry || 0));
  }
  if (pearl){ segP(B.p(GOLD), [cx, yr, cz], [cx, yr + 1.25, cz], 0.04, 4); latheP(B.p(GOLD), [[0.04, yr + 1.05], [0.3, yr + 1.2], [0.36, yr + 1.45], [0.25, yr + 1.7], [0.04, yr + 1.8]], cx, cz, 8);
    vAdd(V, '#d23b2c', o => { for (let k = 0; k < 6; k++){ const a2 = k/6*TAU; segP(o, [cx, yr + 1.45, cz], [cx + Math.cos(a2)*0.6, yr + 1.6 + 0.3*Math.abs(Math.sin(a2)), cz + Math.sin(a2)*0.1], 0.05, 3); } }); }
  else latheP(B.p(GOLD), [[0.25, yr + 0.2], [0.32, yr + 0.5], [0.2, yr + 0.8], [0.04, yr + 1.0]], cx, cz, 8);
}
const tLantern = (B, LANT, GOLD, x, y, z, s) => { s = s || 1; latheP(B.p(LANT), [[0.05, y - 1.1*s], [0.28*s, y - 1.0*s], [0.34*s, y - 0.78*s], [0.28*s, y - 0.56*s], [0.05, y - 0.48*s]], x, z, 8); segP(B.p(GOLD), [x, y - 0.48*s, z], [x, y - 0.05, z], 0.02, 3); };
const tLattice = (B, WIN, FR, F, u0, u1, v0, v1) => { shapeP(B.p(WIN), rectO(u0, u1, v0, v1), F, 0.04); const n = Math.max(2, Math.round((u1 - u0)/0.3)); for (let j = 1; j < n; j++) shapeP(B.p(FR), rectO(lerp(u0, u1, j/n) - 0.035, lerp(u0, u1, j/n) + 0.035, v0, v1), F, 0.07); };
// stone lion (seated guardian, simplified): plinth, body, head, mane
function tLion(B, ST, x, y, z, ry, s){ s = s || 1; boxP(B.p(ST), 0.9*s, 0.5*s, 0.7*s, x, y, z, ry); boxP(B.p(ST), 0.62*s, 0.7*s, 0.5*s, x, y + 0.5*s, z, ry); boxP(B.p(ST), 0.55*s, 0.45*s, 0.5*s, x, y + 1.2*s, z, ry); boxP(B.p(ST), 0.66*s, 0.22*s, 0.56*s, x, y + 1.25*s, z, ry); }

// ================= Yueh Hai Ching Temple (粤海清庙), Phillip Street =================
// Teochew temple, present buildings 1852-55 (national monument 1996, restored 2011-14, UNESCO Award of Merit). Two identical
// temples side by side, each with its own entrance: Tian Hou (Mazu) and Xuan Tian Shang Di, each on the three-hall plan with a
// covered courtyard between the entrance hall and the main hall. Teochew roofs with relatively straight ridges crowded with
// cut-and-paste porcelain (qian ci) sculpture: miniature buildings, pagodas and opera figures forming a Chinese town; the Shang
// Di ridge has two dragons flanking a blazing pearl on a metal rod, the Mazu ridge a ridge of dragons. Red purlins and doors,
// gold on eaveboards and door gods, green on the boundary-wall tiles (Wikipedia; roots.gov.sg).
// OSM footprint w171999290 (24 x 21.4 m). Local frame: +x = front towards Phillip Street (ENE), the two temples side by side
// along z. Night: warm breathing floodlight, red lanterns.
LANDMARKS.sgyuehhai = {zh:'粤海清庙', en:'Yueh Hai Ching Temple', cat:'old', r:19, h:11.5,
  lt:{m:0, c:'#ffcf98', k:1.35, e:0.7, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), V = mkV(), Rn = LMCTX.rng;
    const GRAN = '#a7a196', WALL = '#e4ddd0', RED = '#8e2c21', TILE = '#7f5a45', GT = '#3f7b54', DARK = '#3a302a', PAVE = '#c6bfb2',
      GOLD = {c:'#d6a640', lc:'#ffd27e', lk:1.3}, WIN = {c:'#7d3524', glow:'#ffb35c', gk:0.55}, LANT = {c:'#d8382a', glow:'#ff4a22', gk:2.4};
    const PAL = ['#3f7b54', '#d23b2c', '#e9c33b', '#3d6fd0', '#f3efe5', '#e690a2', '#2f8f8a', '#e8873b'];
    const RING = [[-12.1,10.7],[-11.9,-10.7],[12.1,-10.7],[11.9,10.6]], FY = 0.6;
    prismP(B.p(GRAN), RING, -5, 0.3); capP(B.p(PAVE), RING, 0.31);
    for (const s of [-1, 1]){
      const z0 = s < 0 ? -10.6 : 0.35, z1 = s < 0 ? -0.35 : 10.6, zc = (z0 + z1)/2, hw = (z1 - z0)/2;
      // ---- entrance hall (front porch recessed 1.4 m behind granite columns) ----
      { const x0 = 6.4, x1 = 11.9, xf = x1 - 1.4;
        bxP(B.p(GRAN), x0, x1, 0.3, FY, z0, z1);
        bxP(B.p(WALL), x0, xf, FY, 5.2, z0, z1); bxP(B.p(GRAN), x0 - 0.02, xf + 0.02, FY, 1.5, z0 - 0.02, z1 + 0.02);
        for (const zz of [z0 + 0.25, z1 - 0.25]) bxP(B.p(WALL), xf, x1, FY, 5.2, zz - 0.25, zz + 0.25);       // porch side walls
        const F = fX(xf, 1, zc);
        shapeP(B.p(DARK), rectO(-1.7, 1.7, FY, 4.3), F, 0.02);
        for (const q of [-1, 1]){ shapeP(B.p(RED), rectO(q*0.05, q*1.6, FY + 0.3, 4.2), F, 0.06); vAdd(V, q > 0 ? '#3d6fd0' : '#3f7b54', t => shapeP(t, rectO(q*0.35, q*1.3, FY + 1.1, 3.4), F, 0.08)); vAdd(V, '#d6a640', t => shapeP(t, rectO(q*0.55, q*1.1, FY + 1.6, 2.9), F, 0.09)); }
        for (const q of [-1, 1]) tLattice(B, WIN, RED, F, q*3.0 - 0.8, q*3.0 + 0.8, 2.0, 3.4);                  // round-headed side windows simplified
        vAdd(V, '#e9c33b', t => shapeP(t, rectO(-1.2, 1.2, 4.45, 4.95), F, 0.04));                             // name board (blank)
        for (const zq of [zc - 2.4, zc + 2.4]) latheP(B.p(GRAN), [[0.36, FY], [0.36, FY + 0.3], [0.26, FY + 0.42], [0.24, 5.2]], x1 - 0.45, zq, 8);
        bxP(B.p(RED), xf, x1, 4.8, 5.3, z0 + 0.2, z1 - 0.2);                                                    // painted eaveboard
        vAdd(V, '#d6a640', t => boxP(t, 0.06, 0.32, 2*hw - 0.6, x1 + 0.02, 4.86, zc, 0));
        const yr = roofP(B.p(TILE), (x0 + x1)/2, zc, hw + 0.5, (x1 - x0)/2 + 0.6, hw + 0.5, 0, 5.2, 2.3, {ry:HP, gab:0.001, gcol:B.p(WALL), sag:0.12, pw:1.35, fas:0.28, fo:B.p(GT)});
        tRidge(B, V, Rn, PAL, (x0 + x1)/2, zc, hw + 0.3, yr + 0.22, 0.12, HP, {curl:true, town:true, gap:0.9});
        tDragons(B, V, (x0 + x1)/2, zc, hw + 0.3, yr + 0.22, 0.12, HP, false, GOLD);
        for (const zq of [zc - 3.2, zc - 1.1, zc + 1.1, zc + 3.2]) tLantern(B, LANT, GOLD, x1 - 0.8, 5.0, zq);
      }
      // ---- covered courtyard (worship pavilion) with side corridors ----
      { const x0 = -1.2, x1 = 6.4;
        for (const zz of [z0 + 0.9, z1 - 0.9]){ bxP(B.p(WALL), x0, x1, FY, 4.2, zz - 0.9, zz + 0.9); const r2 = roofP(B.p(TILE), (x0 + x1)/2, zz, (x1 - x0)/2 + 0.2, 1.3, (x1 - x0)/2 + 0.2, 0, 4.2, 0.9, {gab:0.001, gcol:B.p(WALL), pw:1.3, fas:0.18, fo:B.p(GT)}); }
        for (const xq of [x0 + 0.6, x1 - 0.6]) for (const zq of [zc - 2.2, zc + 2.2]) latheP(B.p(RED), [[0.24, FY], [0.22, 5.6]], xq, zq, 8);
        bxP(B.p(RED), x0 + 0.3, x1 - 0.3, 5.3, 5.7, zc - 2.5, zc + 2.5);
        const yr = roofP(B.p(TILE), (x0 + x1)/2, zc, (x1 - x0)/2 + 0.5, 3.2, (x1 - x0)/2 - 1.0, 0, 5.6, 1.5, {lift:0.35, pw:1.4, fas:0.2, fo:B.p(GT), hips:B.p(GT)});
        tRidge(B, V, Rn, PAL, (x0 + x1)/2, zc, (x1 - x0)/2 - 1.0, yr + 0.15, 0.05, 0, {curl:true, figs:true});
        latheP(B.p('#6c5a45'), [[0.5, FY], [0.75, FY + 0.45], [0.8, FY + 0.85], [0.62, FY + 1.1], [0, FY + 1.15]], 2.6, zc, 10);   // incense urn
      }
      // ---- main hall (higher, deeper) ----
      { const x0 = -11.9, x1 = -1.2;
        bxP(B.p(GRAN), x0, x1, 0.3, FY + 0.35, z0, z1);
        bxP(B.p(WALL), x0, x1, FY + 0.35, 6.4, z0, z1); bxP(B.p(GRAN), x0 - 0.02, x1 + 0.02, FY + 0.35, 1.6, z0 - 0.02, z1 + 0.02);
        const F = fX(x1, 1, zc);
        for (let k = -2; k <= 2; k++) tLattice(B, WIN, RED, F, k*1.95 - 0.8, k*1.95 + 0.8, FY + 0.5, 5.2);
        bxP(B.p(RED), x1, x1 + 0.4, 5.8, 6.4, z0 + 0.2, z1 - 0.2);
        const yr = roofP(B.p(TILE), (x0 + x1)/2, zc, hw + 0.55, (x1 - x0)/2 + 0.7, hw + 0.55, 0, 6.4, 3.0, {ry:HP, gab:0.001, gcol:B.p(WALL), sag:0.15, pw:1.35, fas:0.32, fo:B.p(GT)});
        tRidge(B, V, Rn, PAL, (x0 + x1)/2, zc, hw + 0.35, yr + 0.25, 0.15, HP, {curl:true, town:true, gap:1.0});
        tDragons(B, V, (x0 + x1)/2, zc, hw + 0.35, yr + 0.25, 0.15, HP, s > 0, GOLD);
        for (const zq of [zc - 2.6, zc + 2.6]) tLantern(B, LANT, GOLD, x1 + 0.7, 6.2, zq);
      }
    }
    // party wall between the two temples, coped with green tiles
    bxP(B.p(WALL), -11.9, 11.9, FY, 5.0, -0.35, 0.35); bxP(B.p(GT), -11.9, 11.9, 5.0, 5.25, -0.45, 0.45);
    B.flush(g); vFlush(g, V);
    return g;
  }};
SG_PLACES.push({type:'sgyuehhai', lat:1.284555, lon:103.849318, rot:-0.3310});

// ================= Siang Cho Keong Temple (仙祖宫), 66 Amoy Street =================
// Small Hokkien temple completed in 1869 (URA conservation portal), at the foot of Ann Siang Hill, once facing the sea: curved
// roof ridges with outward-sweeping swallowtail ends, unglazed clay tiles (URA); a pair of guardian lions in front
// (penang-traveltips). Layout (front hall, air-well, main hall) and colours are not documented: modelled in the usual Hokkien
// arrangement. OSM footprint w692636295 (14.6 x 9.5 m). Local frame: +x = front towards Amoy Street (ESE).
LANDMARKS.sgsiangcho = {zh:'仙祖宫', en:'Siang Cho Keong Temple', cat:'old', r:11, h:11,
  lt:{m:0, c:'#ffcf98', k:1.3, e:0.7, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), V = mkV(), Rn = LMCTX.rng;
    const GRAN = '#a29c91', WALL = '#e7e1d4', RED = '#8e2c21', TILE = '#9a5a3e', GT = '#8a4a34', DARK = '#3a302a',
      GOLD = {c:'#d6a640', lc:'#ffd27e', lk:1.3}, WIN = {c:'#7d3524', glow:'#ffb35c', gk:0.55}, LANT = {c:'#d8382a', glow:'#ff4a22', gk:2.4};
    const PAL = ['#3f7b54', '#d23b2c', '#e9c33b', '#3d6fd0', '#f3efe5', '#e8873b'];
    const RING = [[-7.2,-4.7],[7.4,-4.7],[6.9,4.9],[-7.2,4.6]], FY = 0.9;
    prismP(B.p(GRAN), RING, -5, FY);
    for (let k = 0; k < 3; k++) bxP(B.p(GRAN), 7.1 + k*0.0, 7.5 + k*0.35 - 0.0, 0, FY - k*0.3, -1.6, 1.6);   // front steps
    // front hall
    { const x0 = 2.2, x1 = 7.0, xf = 6.0, zc = 0, hw = 4.5;
      bxP(B.p(WALL), x0, xf, FY, 5.0, -hw, hw); bxP(B.p(GRAN), x0 - 0.02, xf + 0.02, FY, 1.8, -hw - 0.02, hw + 0.02);
      for (const zz of [-hw + 0.3, hw - 0.3]) bxP(B.p(WALL), xf, x1, FY, 5.0, zz - 0.3, zz + 0.3);
      const F = fX(xf, 1, 0);
      shapeP(B.p(DARK), rectO(-1.3, 1.3, FY, 3.9), F, 0.02);
      for (const q of [-1, 1]){ shapeP(B.p(RED), rectO(q*0.04, q*1.2, FY + 0.25, 3.8), F, 0.06); vAdd(V, q > 0 ? '#3d6fd0' : '#3f7b54', t => shapeP(t, rectO(q*0.3, q*1.0, FY + 1.0, 3.1), F, 0.08)); }
      for (const q of [-1, 1]) tLattice(B, WIN, RED, F, q*2.6 - 0.6, q*2.6 + 0.6, 2.2, 3.3);
      bxP(B.p(RED), xf, x1, 4.6, 5.1, -hw + 0.3, hw - 0.3);
      for (const zq of [-1.9, 1.9]) latheP(B.p(GRAN), [[0.3, FY], [0.3, FY + 0.25], [0.21, FY + 0.35], [0.2, 5.0]], x1 - 0.35, zq, 8);
      const yr = roofP(B.p(TILE), (x0 + x1)/2, zc, hw + 0.4, (x1 - x0)/2 + 0.5, hw + 0.4, 0, 5.0, 2.0, {ry:HP, gab:0.001, gcol:B.p(WALL), sag:0.45, pw:1.45, fas:0.25, fo:B.p(GT)});
      tRidge(B, V, Rn, PAL, (x0 + x1)/2, zc, hw + 0.2, yr + 0.2, 0.45, HP, {tail:true, figs:true, rc:'#8a4a34', tl:'#9a5a3e'});
      for (const zq of [-2.6, 0, 2.6]) tLantern(B, LANT, GOLD, x1 - 0.6, 4.8, zq, 0.9);
    }
    // air-well side walls and the main hall
    for (const zz of [-4.2, 4.2]) bxP(B.p(WALL), -0.6, 2.2, FY, 3.8, zz - 0.35, zz + 0.35);
    { const x0 = -7.1, x1 = -0.6, hw = 4.55;
      bxP(B.p(WALL), x0, x1, FY, 5.8, -hw, hw); bxP(B.p(GRAN), x0 - 0.02, x1 + 0.02, FY, 1.6, -hw - 0.02, hw + 0.02);
      const F = fX(x1, 1, 0); for (const q of [-1, 0, 1]) tLattice(B, WIN, RED, F, q*2.4 - 0.8, q*2.4 + 0.8, FY + 0.4, 4.6);
      const yr = roofP(B.p(TILE), (x0 + x1)/2, 0, hw + 0.45, (x1 - x0)/2 + 0.6, hw + 0.45, 0, 5.8, 2.4, {ry:HP, gab:0.001, gcol:B.p(WALL), sag:0.5, pw:1.45, fas:0.28, fo:B.p(GT)});
      tRidge(B, V, Rn, PAL, (x0 + x1)/2, 0, hw + 0.25, yr + 0.2, 0.5, HP, {tail:true, figs:true, rc:'#8a4a34', tl:'#9a5a3e'});
      latheP(B.p(GOLD), [[0.25, yr + 0.3], [0.32, yr + 0.6], [0.2, yr + 0.9], [0.04, yr + 1.1]], (x0 + x1)/2, 0, 8);
    }
    for (const s of [-1, 1]) tLion(B, GRAN, 7.9, 0, s*2.1, HP, 0.9);
    B.flush(g); vFlush(g, V);
    return g;
  }};
SG_PLACES.push({type:'sgsiangcho', lat:1.279922, lon:103.846579, rot:-0.4667});

// ================= Fuk Tak Chi Museum (福德祠), 76 Telok Ayer Street =================
// One of the oldest Chinese temples in Singapore (built in brick in 1825, renovated and expanded 1854, 1862 and 1869), founded by
// the Cantonese and Hakka communities; converted into the Fuk Tak Chi Museum in 1998 within Far East Square (culturepaedia
// singaporeccc; chinatown.sg). Anchored on the Far East Square piece that holds the museum POI (w372148466, 23 x 8 m; walls set
// 0.6-1.0 m in from the party walls so that the hull keeps the neighbouring shophouses): a front
// hall and a main hall behind an air-well, gable roofs with modest end curls. Roof colours are not documented (green glazed
// tiles assumed as in the target note). Local frame: +x = front towards Telok Ayer Street (SE).
LANDMARKS.sgfuktakchi = {zh:'福德祠', en:'Fuk Tak Chi Museum', cat:'old', r:13, h:9.5,
  lt:{m:0, c:'#ffcf98', k:1.3, e:0.7, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), V = mkV(), Rn = LMCTX.rng;
    const GRAN = '#a29c91', WALL = '#e6dfd0', RED = '#8e2c21', TILE = '#4f7a57', GT = '#2f5f45', DARK = '#3a302a',
      GOLD = {c:'#d6a640', lc:'#ffd27e', lk:1.3}, WIN = {c:'#7d3524', glow:'#ffb35c', gk:0.55}, LANT = {c:'#d8382a', glow:'#ff4a22', gk:2.4};
    const PAL = ['#3f7b54', '#d23b2c', '#e9c33b', '#3d6fd0', '#f3efe5', '#e8873b'];
    const RING = [[-11.5,3.35],[-11.1,-3.35],[11.5,-3.35],[11.5,3.35]], FY = 0.45, hw = 3.35;
    prismP(B.p(GRAN), RING, -5, FY);
    // front hall
    { const x0 = 5.6, x1 = 11.4, xf = 10.2;
      bxP(B.p(WALL), x0, xf, FY, 4.8, -hw, hw); bxP(B.p(GRAN), x0 - 0.02, xf + 0.02, FY, 1.7, -hw - 0.02, hw + 0.02);
      for (const zz of [-hw + 0.25, hw - 0.25]) bxP(B.p(WALL), xf, x1, FY, 4.8, zz - 0.25, zz + 0.25);
      const F = fX(xf, 1, 0);
      shapeP(B.p(DARK), rectO(-1.2, 1.2, FY, 3.6), F, 0.02);
      for (const q of [-1, 1]){ shapeP(B.p(RED), rectO(q*0.04, q*1.1, FY + 0.25, 3.5), F, 0.06); vAdd(V, '#d6a640', t => shapeP(t, rectO(q*0.3, q*0.9, FY + 1.1, 2.8), F, 0.08)); }
      for (const q of [-1, 1]) tLattice(B, WIN, RED, F, q*2.5 - 0.55, q*2.5 + 0.55, 2.0, 3.2);
      bxP(B.p(RED), xf, x1, 4.4, 4.9, -hw + 0.25, hw - 0.25);
      for (const zq of [-1.7, 1.7]) latheP(B.p(GRAN), [[0.28, FY], [0.28, FY + 0.25], [0.2, FY + 0.35], [0.19, 4.8]], x1 - 0.35, zq, 8);
      const yr = roofP(B.p(TILE), (x0 + x1)/2, 0, hw + 0.35, (x1 - x0)/2 + 0.5, hw + 0.35, 0, 4.8, 2.0, {ry:HP, gab:0.001, gcol:B.p(WALL), sag:0.15, pw:1.4, fas:0.25, fo:B.p(GT)});
      tRidge(B, V, Rn, PAL, (x0 + x1)/2, 0, hw + 0.15, yr + 0.2, 0.15, HP, {curl:true, figs:true, rc:GT, tl:TILE});
      for (const zq of [-1.9, 1.9]) tLantern(B, LANT, GOLD, x1 - 0.6, 4.6, zq, 0.9);
    }
    for (const zz of [-3.6, 3.6]) bxP(B.p(WALL), 1.8, 5.6, FY, 3.6, zz - 0.35, zz + 0.35);
    { const x0 = -11.3, x1 = 1.8;
      bxP(B.p(WALL), x0, x1, FY, 5.6, -hw, hw); bxP(B.p(GRAN), x0 - 0.02, x1 + 0.02, FY, 1.5, -hw - 0.02, hw + 0.02);
      const F = fX(x1, 1, 0); for (const q of [-1, 0, 1]) tLattice(B, WIN, RED, F, q*2.2 - 0.7, q*2.2 + 0.7, FY + 0.4, 4.4);
      const yr = roofP(B.p(TILE), (x0 + x1)/2, 0, hw + 0.4, (x1 - x0)/2 + 0.5, hw + 0.4, 0, 5.6, 2.3, {ry:HP, gab:0.001, gcol:B.p(WALL), sag:0.18, pw:1.4, fas:0.28, fo:B.p(GT)});
      tRidge(B, V, Rn, PAL, (x0 + x1)/2, 0, hw + 0.2, yr + 0.2, 0.18, HP, {curl:true, figs:true, rc:GT, tl:TILE});
      latheP(B.p(GOLD), [[0.25, yr + 0.3], [0.32, yr + 0.6], [0.2, yr + 0.9], [0.04, yr + 1.1]], (x0 + x1)/2, 0, 8);
    }
    B.flush(g); vFlush(g, V);
    return g;
  }};
SG_PLACES.push({type:'sgfuktakchi', lat:1.282914, lon:103.848738, rot:-0.6374});

// ================= Ying Fo Fui Kun (应和会馆), 98 Telok Ayer Street =================
// Hakka clan association founded 1822; the 1844 reconstruction produced the present two-storey building (national monument):
// a courtyard surrounded by an entrance hall, main hall and adjoining corridors; two Doric columns frame the entrance with an
// arch spanning between them; front windows set higher than a man's height (after Hakka tulou); granite columns carry the upper
// floor (roots.gov.sg). Roof form and colours are not documented: Chinese gable roofs with plain ridges are assumed.
// OSM footprint w125836766 (23 x 12 m). Local frame: +x = front towards Telok Ayer Street (SE).
LANDMARKS.sgyingfo = {zh:'应和会馆', en:'Ying Fo Fui Kun', cat:'old', r:15, h:13,
  lt:{m:0, c:'#ffd6a4', k:1.25, e:0.7, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), V = mkV(), Rn = LMCTX.rng;
    const GRAN = '#a29c91', WALL = '#ece6da', RED = '#8e2c21', TILE = '#6e6a62', GT = '#3f6f55', DARK = '#3a302a', TRIM = '#f6f1e6',
      GOLD = {c:'#d6a640', lc:'#ffd27e', lk:1.3}, WIN = {c:'#5b3324', glow:'#ffbf6e', gk:0.5}, LANT = {c:'#d8382a', glow:'#ff4a22', gk:2.4};
    const PAL = ['#3f7b54', '#d23b2c', '#e9c33b', '#3d6fd0', '#f3efe5'];
    const RING = [[-11.5,-5.9],[11.6,-5.9],[11.5,5.9],[-11.5,6.0]], FY = 0.45, hw = 5.85;
    prismP(B.p(GRAN), RING, -5, FY);
    // entrance hall: two storeys, front wall with the Doric pair and the arch, high windows
    { const x0 = 5.4, x1 = 11.45;
      bxP(B.p(WALL), x0, x1, FY, 8.4, -hw, hw); bxP(B.p(GRAN), x1 - 0.02, x1 + 0.03, FY, 1.0, -hw, hw);
      const F = fX(x1, 1, 0);
      shapeP(B.p(DARK), mv(rArchO(1.3, 4.0, 10), 0, FY), F, 0.02);                    // arched entrance
      slabP(B.p(TRIM), mv(archFill(1.5, 3.3, 3.75, 10), 0, FY), F, 0, 0.12);           // the arch between the columns
      shapeP(B.p(RED), rectO(-1.1, 1.1, FY, 2.9), F, 0.05);                           // doors
      for (const q of [-1, 1]){ latheP(B.p(TRIM), [[0.36, FY], [0.36, FY + 0.35], [0.3, FY + 0.45], [0.26, FY + 3.6], [0.36, FY + 3.75], [0.36, FY + 3.95]], x1 + 0.45, q*1.85, 12); }
      bxP(B.p(TRIM), x1 - 0.02, x1 + 0.85, FY + 3.95, FY + 4.3, -2.3, 2.3);            // entablature over the columns
      for (const q of [-3.9, 3.9]) shapeP(B.p(WIN), rectO(q - 0.5, q + 0.5, 2.3, 3.4), F, 0.03);                 // high ground-floor windows
      for (const q of [-3.9, -1.3, 1.3, 3.9]) { shapeP(B.p(WIN), rectO(q - 0.55, q + 0.55, 5.4, 7.2), F, 0.03); slabP(B.p(TRIM), rectO(q - 0.7, q + 0.7, 5.25, 5.4), F, 0, 0.08); }
      slabP(B.p(TRIM), rectO(-hw, hw, 4.75, 5.0), F, 0, 0.12); slabP(B.p(TRIM), rectO(-hw, hw, 8.05, 8.4), F, 0, 0.15);
      const yr = roofP(B.p(TILE), (x0 + x1)/2, 0, hw + 0.4, (x1 - x0)/2 + 0.5, hw + 0.4, 0, 8.4, 2.4, {ry:HP, gab:0.001, gcol:B.p(WALL), sag:0.1, pw:1.35, fas:0.25, fo:B.p(GT)});
      tRidge(B, V, Rn, PAL, (x0 + x1)/2, 0, hw + 0.2, yr + 0.18, 0.1, HP, {curl:true, rc:GT, tl:TILE});
      for (const zq of [-1.0, 1.0]) tLantern(B, LANT, GOLD, x1 + 0.6, 4.3, zq, 0.8);
    }
    // corridors round the courtyard
    for (const zz of [-hw + 0.9, hw - 0.9]){ bxP(B.p(WALL), -2.0, 5.4, FY, 7.2, zz - 0.9, zz + 0.9); const F = fZ(zz - Math.sign(zz)*0.9, -Math.sign(zz), 1.7);
      for (const u of [-2.4, 0, 2.4]) shapeP(B.p(WIN), rectO(u - 0.6, u + 0.6, 4.6, 6.4), F, 0.03);
      roofP(B.p(TILE), 1.7, zz, 3.9, 1.3, 3.9, 0, 7.2, 1.1, {gab:0.001, gcol:B.p(WALL), pw:1.3, fas:0.2, fo:B.p(GT)}); }
    for (const xq of [-1.2, 1.7, 4.6]) for (const zq of [-3.6, 3.6]) latheP(B.p(GRAN), [[0.24, FY], [0.22, 4.6]], xq, zq, 8);
    // main hall: two storeys, altar hall below, upper hall
    { const x0 = -11.45, x1 = -2.0;
      bxP(B.p(WALL), x0, x1, FY, 9.0, -hw, hw);
      const F = fX(x1, 1, 0); for (const q of [-2.6, 0, 2.6]){ tLattice(B, WIN, RED, F, q - 0.9, q + 0.9, FY + 0.4, 4.0); shapeP(B.p(WIN), rectO(q - 0.7, q + 0.7, 5.4, 7.6), F, 0.03); }
      slabP(B.p(TRIM), rectO(-hw, hw, 4.6, 4.85), F, 0, 0.1);
      const yr = roofP(B.p(TILE), (x0 + x1)/2, 0, hw + 0.45, (x1 - x0)/2 + 0.55, hw + 0.45, 0, 9.0, 2.6, {ry:HP, gab:0.001, gcol:B.p(WALL), sag:0.12, pw:1.35, fas:0.28, fo:B.p(GT)});
      tRidge(B, V, Rn, PAL, (x0 + x1)/2, 0, hw + 0.25, yr + 0.18, 0.12, HP, {curl:true, rc:GT, tl:TILE});
      latheP(B.p(GOLD), [[0.25, yr + 0.3], [0.32, yr + 0.6], [0.2, yr + 0.9], [0.04, yr + 1.1]], (x0 + x1)/2, 0, 8);
    }
    B.flush(g); vFlush(g, V);
    return g;
  }};
SG_PLACES.push({type:'sgyingfo', lat:1.282517, lon:103.848441, rot:-0.6374});

// ================= Masjid Al-Abrar (阿布拉回教堂), 192 Telok Ayer Street =================
// Founded 1827 as a thatched hut; the present brick building 1850-55, renovated 1986-89 (roots.gov.sg): a frontage of three
// shophouse widths with the five-foot-way built into the facade; two tall octagonal minarets flanking the main entrance, each
// topped with a crescent and star; the parapet with decorative merlon cresting now runs across the full front; the 1986-89
// works added an upper floor and a large jack roof over the prayer hall, the courtyard was roofed over; large French louvred
// windows with coloured-glass fanlights. Wall / trim colours are not documented (white with green trim assumed).
// OSM footprint w172904416 (25.8 x 15.6 m). Local frame: +x = front towards Telok Ayer Street (ESE).
LANDMARKS.sgalabrar = {zh:'阿布拉回教堂', en:'Masjid Al-Abrar', cat:'old', r:16, h:17,
  lt:{m:0, c:'#ffe2b8', k:1.2, e:0.6, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB();
    const WALL = '#f1ece0', TRIM = '#fbf8f0', BASE = '#c9c1b0', GRN = '#4e8a62', ROOF = '#8b8478', DARK = '#3f3a33',
      GOLD = {c:'#d6a33a', lc:'#ffd27e', lk:1.3, glow:'#b98a2e', gk:0.5}, WIN = {c:'#4d5a52', glow:'#ffd08a', gk:0.45}, FAN = {c:'#3d6fd0', glow:'#9fc4ff', gk:0.5};
    const X0 = -12.9, X1 = 12.9, Z0 = -7.8, Z1 = 7.8, G1 = 4.6, G2 = 8.6, PT = 9.6;
    prismP(B.p(BASE), [[12.9,7.8],[-12.5,7.8],[-12.9,-7.8],[12.5,-7.8]], -5, 0.35);
    const XF = X1 - 2.0;                                     // the five-foot-way runs inside the front wall
    bxP(B.p(WALL), X0, XF, 0.35, G1, Z0, Z1);
    bxP(B.p(WALL), X0, X1, G1, G2, Z0, Z1);                  // upper floor over the five-foot-way
    bxP(B.p(TRIM), X0, X1 + 0.15, G1 - 0.1, G1 + 0.35, Z0, Z1);
    // five-foot-way arcade: piers and arches on the street front
    { const F = fX(X1, 1, 0);
      for (const zc of [-5.2, 0, 5.2]){ const hw = zc === 0 ? 1.8 : 1.6;
        slabP(B.p(TRIM), mv(archFill(hw, 2.8, G1 - 0.1, 10), zc, 0), F, -0.3, 0.05);
        for (const q of [-1, 1]) slabP(B.p(WALL), rectO(zc + q*hw, zc + q*(hw + 0.45), 0.35, G1 - 0.1), F, -0.3, 0.05); }
      for (const q of [-1, 1]) slabP(B.p(WALL), rectO(q*7.4, q*7.8, 0.35, G1), F, -0.3, 0.05);
      const Fi = fX(XF, 1, 0);
      shapeP(B.p(DARK), mv(rArchO(1.1, 3.6, 8), 0, 0.35), Fi, 0.02);                                   // main door
      for (const zc of [-5.2, 5.2]) for (const q of [-1, 1]){ shapeP(B.p(WIN), rectO(zc + q*1.1 - 0.5, zc + q*1.1 + 0.5, 0.9, 3.2), Fi, 0.02); shapeP(B.p(FAN), mv(semi(0.5, 6), zc + q*1.1, 3.2), Fi, 0.03); }
      // upper floor: French louvred windows with coloured fanlights, pilasters
      for (const zc of [-5.2, 0, 5.2]) for (const q of [-1, 1]){ const u = zc + q*1.25;
        shapeP(B.p(WIN), rectO(u - 0.55, u + 0.55, G1 + 0.8, G1 + 2.8), F, 0.03); shapeP(B.p(FAN), mv(semi(0.55, 6), u, G1 + 2.8), F, 0.04);
        slabP(B.p(TRIM), rectO(u - 0.7, u + 0.7, G1 + 0.65, G1 + 0.8), F, 0, 0.1); slabP(B.p(GRN), mv(semi(0.7, 6), u, G1 + 2.85), F, 0, 0.06); }
      for (const u of [-7.6, -2.6, 2.6, 7.6]) slabP(B.p(TRIM), rectO(u - 0.22, u + 0.22, G1, G2), F, 0, 0.14);
      slabP(B.p(TRIM), rectO(Z0, Z1, G2 - 0.3, G2), F, 0, 0.2);
    }
    // parapet with merlon cresting across the full front, returning a little along the sides
    { const P = [[X1 + 0.05, Z0], [X1 + 0.05, Z1]]; bxP(B.p(WALL), X1 - 0.3, X1 + 0.05, G2, PT, Z0, Z1); bxP(B.p(GRN), X1 - 0.35, X1 + 0.1, PT - 0.2, PT, Z0, Z1);
      for (let z = Z0 + 0.4; z < Z1 - 0.2; z += 0.8){ if (Math.abs(Math.abs(z) - 2.6) < 0.9) continue; boxP(B.p(TRIM), 0.3, 0.45, 0.42, X1 - 0.12, PT, z, 0); latheP(B.p(TRIM), [[0.12, PT + 0.45], [0.16, PT + 0.6], [0.02, PT + 0.85]], X1 - 0.12, z, 4); }
      for (const s of [-1, 1]) bxP(B.p(WALL), X1 - 4, X1, G2, PT - 0.4, s*Z1 - 0.15, s*Z1 + 0.15); }
    // the two octagonal minarets flanking the main entrance
    for (const s of [-1, 1]){ const x = X1 - 0.55, z = s*2.6, r8 = 0.85, oct = (r, y0, y1, col) => latheP(B.p(col), [[r, y0], [r, y1]], x, z, 8, PI/8);
      oct(r8, 0.35, 12.4, WALL); latheP(B.p(TRIM), [[0, 12.4], [r8, 12.4]], x, z, 8, PI/8);
      for (const y of [G1 - 0.1, G2 - 0.3, PT]) latheP(B.p(TRIM), [[r8 + 0.12, y], [r8 + 0.12, y + 0.3], [r8, y + 0.32]], x, z, 8, PI/8);
      latheP(B.p(GRN), [[r8 + 0.45, 12.4], [r8 + 0.45, 12.65], [r8, 12.75]], x, z, 8, PI/8);                    // balcony
      for (let i = 0; i < 8; i++){ const a = (i + 0.5)/8*TAU; segP(B.p(TRIM), [x + Math.cos(a)*(r8 + 0.35), 12.65, z + Math.sin(a)*(r8 + 0.35)], [x + Math.cos(a)*(r8 + 0.35), 13.3, z + Math.sin(a)*(r8 + 0.35)], 0.05, 3); }
      for (let i = 0; i < 8; i++){ const a = (i + 0.5)/8*TAU; shapeP(B.p(DARK), mv(rArchO(0.18, 0.9, 5), 0, 9.9), fA(x + Math.cos(a)*r8*0.93, z + Math.sin(a)*r8*0.93, a + HP), 0.02); }
      oct(0.62, 12.75, 14.3, WALL);
      latheP(B.p(GRN), [[0.68, 14.3], [0.8, 14.55], [0.74, 14.95], [0.48, 15.4], [0.18, 15.8], [0.05, 16.05]], x, z, 8, PI/8);
      segP(B.p(GOLD), [x, 16.0, z], [x, 16.45, z], 0.04, 4);
      // crescent and star
      slabP(B.p(GOLD), CRES.map(p => [p[0]*0.55, p[1]*0.55 + 16.75]), fX(x, 1, z), -0.04, 0.04);
      slabP(B.p(GOLD), star(5, 0.14, 0.06, HP).map(p => [p[0] + 0.12, p[1] + 16.78]), fX(x, 1, z), -0.04, 0.05);
    }
    // jack roof over the prayer hall: hipped roof with a raised clerestory along the ridge
    hipRoof(g, -2.0, 0, 21.4, 15.2, G2, 2.4, ROOF, 0, 0.5);
    bxP(B.p(TRIM), -9.5, 5.5, G2 + 1.9, G2 + 2.9, -2.2, 2.2);
    for (let k = 0; k < 9; k++) for (const s of [-1, 1]) shapeP(B.p(WIN), rectO(-8.9 + k*1.6, -8.1 + k*1.6, G2 + 2.0, G2 + 2.75), fZ(s*2.2, s, 0), 0.02);
    hipRoof(g, -2.0, 0, 15.8, 5.2, G2 + 2.9, 1.1, ROOF, 0, 0.3);
    B.flush(g);
    return g;
  }};
SG_PLACES.push({type:'sgalabrar', lat:1.280308, lon:103.847261, rot:-0.4619});

// ================= Jinrikisha Station (人力车站), 1 Neil Road =================
// Built 1903 for the Municipal rickshaw department under Municipal Engineer Samuel Tomlinson and Municipal Architect D.M. Craik
// (remembersingapore; Wikipedia): a triangular corner site at the junction of Neil Road and Tanjong Pagar Road, Ionic
// pilasters and a curved pediment marking the corner, a square tower above it topped by an octagonal cupola; originally
// exposed brick (unusual then), since painted; restored by URA in 1987. Storey heights are estimates (two storeys).
// OSM footprint w172814077 (the apex piece of the wedge); the party walls with the shophouses behind are set 0.6-0.8 m in so
// that the hull does not hide them. Local frame: +x along
// Tanjong Pagar Road towards the junction (NNE), the corner at +x, Neil Road on the -z side.
LANDMARKS.sgjinrikisha = {zh:'人力车站', en:'Jinrikisha Station', cat:'old', r:25, h:21.5,
  lt:{m:0, c:'#ffd8a8', k:1.35, e:0.6, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB();
    const BRICK = '#a8553e', TRIM = '#efe6d2', BASE = '#9c8f7e', ROOF = '#7b5a48', DARK = '#3b302a', CUP = '#8e9a8c',
      WIN = {c:'#4b3a2e', glow:'#ffc77a', gk:0.5}, SHUT = '#5d6d5a', LAMP = {c:'#fff2cc', glow:'#ffd890', gk:1.6};
    const RING = [[-1.9,-19.9],[21.8,4.6],[21.1,6.6],[19.6,8.2],[-21.0,8.2],[-22.2,1.1],[-14.6,-0.3],[-17.5,-3.4]];
    const G1 = 5.0, G2 = 9.6, CT = 10.4;
    prismP(B.p(BASE), RING, -5, 0.4);
    const IN = offP(RING, 0.15);
    prismP(B.p(BRICK), IN, 0.4, G2);
    prismP(B.p(TRIM), offP(RING, -0.15), G2, G2 + 0.35); prismP(B.p(BRICK), offP(RING, 0.05), G2 + 0.35, CT); prismP(B.p(TRIM), offP(RING, -0.1), CT, CT + 0.25);
    capP(B.p(ROOF), offP(RING, 0.6), CT - 0.1);
    prismP(B.p(TRIM), offP(RING, -0.08), G1 - 0.2, G1 + 0.15);                                   // string course
    prismP(B.p(TRIM), offP(RING, -0.05), 0.4, 1.0);                                              // plinth band
    // street fronts: Neil Road (edge 1) and Tanjong Pagar Road (edge 4); bays with pilasters, arched ground windows, shuttered upper windows
    const E = edgesF(RING);
    for (const ei of [0, 3]){ const e = E[ei], n = Math.max(2, Math.round(e.L/3.8)), bw = e.L/n;
      for (let k = 0; k <= n; k++){ const u = k*bw; if (u < 0.6 || u > e.L - 0.6) continue; slabP(B.p(TRIM), rectO(u - 0.28, u + 0.28, 1.0, G2), e.F, 0, 0.18); slabP(B.p(TRIM), rectO(u - 0.4, u + 0.4, G2 - 0.55, G2 - 0.25), e.F, 0, 0.26); }   // Ionic pilasters with capitals
      for (let k = 0; k < n; k++){ const u = (k + 0.5)*bw;
        shapeP(B.p(DARK), mv(rArchO(0.95, 3.4, 8), u, 1.0), e.F, 0.02); slabP(B.p(TRIM), mv(archFill(1.15, 3.45, 3.75, 8), u, 0.0), e.F, 0, 0.08);
        shapeP(B.p(WIN), rectO(u - 0.7, u + 0.7, G1 + 0.7, G2 - 1.0), e.F, 0.02);
        for (const q of [-1, 1]) shapeP(B.p(SHUT), rectO(u + q*0.72, u + q*1.15, G1 + 0.7, G2 - 1.0), e.F, 0.05);
        slabP(B.p(TRIM), rectO(u - 0.85, u + 0.85, G2 - 0.95, G2 - 0.75), e.F, 0, 0.1); }
    }
    // the rounded corner: entrance, pilasters and the curved pediment
    { const cx = 20.9, cz = 6.9, ang = Math.atan2(0.40, 0.92), F = fA(cx, cz, ang + HP);
      shapeP(B.p(DARK), mv(rArchO(1.2, 3.8, 8), 0, 0.6), F, 0.05);
      for (const q of [-1, 1]) slabP(B.p(TRIM), rectO(q*1.55 - 0.3, q*1.55 + 0.3, 0.6, G2), F, 0, 0.3);
      shapeP(B.p(WIN), rectO(-0.8, 0.8, G1 + 0.6, G2 - 1.0), F, 0.08);
      // curved (segmental) pediment over the corner bay
      const SEG = []; for (let i = 0; i <= 12; i++){ const t = i/12; SEG.push([-2.3 + 4.6*t, 1.35*Math.sin(PI*t)]); }
      slabP(B.p(TRIM), mv(SEG, 0, CT + 0.25), F, -0.4, 0.3);
      slabP(B.p(BRICK), mv(SEG.map(p => [p[0]*0.82, p[1]*0.72]), 0, CT + 0.3), F, -0.4, 0.36);
    }
    // square tower behind the corner, octagonal cupola
    { const tx = 16.6, tz = 4.3, tr = Math.atan2(0.40, 0.92), s = 2.6, T0 = CT, T1 = 15.8;
      boxP(B.p(BRICK), 2*s, T1 - T0 + 1, 2*s, tx, T0 - 1, tz, -tr);
      boxP(B.p(TRIM), 2*s + 0.5, 0.45, 2*s + 0.5, tx, T1, tz, -tr); boxP(B.p(TRIM), 2*s + 0.25, 0.3, 2*s + 0.25, tx, T0 + 0.1, tz, -tr);
      for (const [px, pz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]){ const c = Math.cos(-tr), sn = Math.sin(-tr), ox = px*(s - 0.1), oz = pz*(s - 0.1); boxP(B.p(TRIM), 0.55, T1 - T0, 0.55, tx + ox*c + oz*sn, T0, tz - ox*sn + oz*c, -tr); }
      for (let k = 0; k < 4; k++){ const a = -tr + k*HP, c = Math.cos(a), sn = Math.sin(a), F = fA(tx + c*(s + 0.01), tz - sn*(s + 0.01), HP - a);
        shapeP(B.p(WIN), mv(rArchO(0.75, 2.8, 8), 0, T0 + 1.2), F, 0.02); slabP(B.p(TRIM), mv(archFill(0.95, T0 + 3.25, T0 + 3.55, 8), 0, 0), F, 0, 0.06);
        shapeP(B.p(DARK), circ(0.55, 12).map(p => [p[0], p[1] + T1 - 0.9]), F, 0.02); }
      // octagonal cupola: drum with openings, dome, lantern and finial
      latheP(B.p(TRIM), [[2.0, T1 + 0.45], [2.0, T1 + 0.75], [1.75, T1 + 0.8]], tx, tz, 8, PI/8);
      latheP(B.p(TRIM), [[1.7, T1 + 0.8], [1.7, T1 + 2.6]], tx, tz, 8, PI/8);
      for (let i = 0; i < 8; i++){ const a = (i + 0.5)/8*TAU, ap = 1.7*Math.cos(PI/8) + 0.01; shapeP(B.p(DARK), mv(rArchO(0.4, 1.4, 6), 0, T1 + 1.0), fA(tx + Math.cos(a)*ap, tz + Math.sin(a)*ap, a + HP), 0); }
      latheP(B.p(TRIM), [[1.95, T1 + 2.6], [1.95, T1 + 2.85], [1.7, T1 + 2.9]], tx, tz, 8, PI/8);
      latheP(B.p(CUP), [[1.75, T1 + 2.9], [1.62, T1 + 3.6], [1.25, T1 + 4.3], [0.7, T1 + 4.85], [0.3, T1 + 5.05]], tx, tz, 8, PI/8);
      latheP(B.p(TRIM), [[0.3, T1 + 5.05], [0.3, T1 + 5.45], [0.38, T1 + 5.5], [0.06, T1 + 5.8]], tx, tz, 8);
      segP(B.p(DARK), [tx, T1 + 5.8, tz], [tx, T1 + 6.0, tz], 0.04, 4);
      LSph(g, 0.22, tx, T1 + 5.8, tz, LAMP, 1, 8);
    }
    B.flush(g);
    return g;
  }};
SG_PLACES.push({type:'sgjinrikisha', lat:1.280235, lon:103.843868, rot:1.3393});

// ================= Maxwell Food Centre (麦士威熟食中心), 1 Kadayanallur Street =================
// Opened as Maxwell Market on 17 November 1928 at Maxwell Road / South Bridge Road; renovated 1986-87 and again 2000-01
// (ID Architects), reopened as Maxwell Food Centre with 103 stalls; floor area 3,365 m2 (Wikipedia). An open-sided hawker hall:
// a column grid under a long hipped roof with a raised, louvred jack roof along the ridge, the stall rows inside. Roof and
// column colours and heights are not documented (estimates). OSM footprint w47298639 (80.5 x 41.4 m, a small annex at the west
// end). Local frame: +x along the hall (SE).
LANDMARKS.sgmaxwell = {zh:"麦士威熟食中心", en:"Maxwell Food Centre", cat:"old", r:49, h:12,
  lt:{m:0, c:'#ffe0b0', k:0.9, e:0.8},
  build(){
    const g = new THREE.Group(), B = mkB();
    const COL = '#e9e2d2', BASE = '#a49b8b', ROOF = '#5e5a55', ROOF2 = '#6b6660', STALL = '#cfc6b4', DARK = '#3d3833', TILE = '#b9aa94',
      LIT = {c:'#f3e6c8', glow:'#ffe2a6', gk:0.9}, SIGN = {c:'#d8cdb4', glow:'#fff0cf', gk:0.7};
    const X0 = -39.5, X1 = 41.0, Z0 = -20.7, Z1 = 20.7, EV = 5.6;
    prismP(B.p(BASE), [[-39.7,3.9],[-45.2,3.8],[-45.0,-6.3],[-39.1,-6.7],[-39.5,-20.7],[41.0,-20.7],[41.0,20.7],[-39.5,20.7]], -5, 0.35);
    capP(B.p(TILE), rectXZ(X0 + 0.2, X1 - 0.2, Z0 + 0.2, Z1 - 0.2), 0.36);
    // column grid and edge beams
    const nx = 12, nz = 6;
    for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++){ const x = X0 + 0.5 + (X1 - X0 - 1)*i/nx, z = Z0 + 0.5 + (Z1 - Z0 - 1)*j/nz; if (j > 0 && j < nz && i > 0 && i < nx && (j % 2)) continue; boxP(B.p(COL), 0.55, EV - 0.35, 0.55, x, 0.35, z, 0); }
    for (const z of [Z0 + 0.5, Z1 - 0.5]) bxP(B.p(COL), X0 + 0.2, X1 - 0.2, EV - 0.6, EV, z - 0.3, z + 0.3);
    for (const x of [X0 + 0.5, X1 - 0.5]) bxP(B.p(COL), x - 0.3, x + 0.3, EV - 0.6, EV, Z0 + 0.2, Z1 - 0.2);
    // stall rows (back-to-back blocks with lit counters), aisles between
    for (const zc of [-13.2, -4.4, 4.4, 13.2]) for (let i = 0; i < 6; i++){ const x0 = X0 + 4 + i*12.6, x1 = x0 + 10.8;
      bxP(B.p(STALL), x0, x1, 0.36, 2.7, zc - 1.6, zc + 1.6); bxP(B.p(DARK), x0 - 0.1, x1 + 0.1, 2.7, 3.1, zc - 1.75, zc + 1.75);
      for (const s of [-1, 1]) shapeP(B.p(SIGN), rectO(x0 + 0.3, x1 - 0.3, 2.25, 2.65), fZ(zc + s*1.6, s, (x0 + x1)/2 - (x0 + x1)/2), 0.03);
      for (const s of [-1, 1]) shapeP(B.p(LIT), rectO(x0 + 0.3, x1 - 0.3, 1.0, 1.25), fZ(zc + s*1.6, s, 0), 0.05); }
    // annex at the west end (service block)
    bxP(B.p(COL), -45.0, X0 + 0.2, 0.35, 3.6, -6.3, 3.8); bxP(B.p(ROOF2), -45.3, X0 + 0.2, 3.6, 3.85, -6.6, 4.1);
    // long hipped roof, then the raised louvred jack roof along the ridge
    hipRoof(g, (X0 + X1)/2, 0, X1 - X0, Z1 - Z0, EV, 4.6, ROOF, 0, 1.6);
    const JX0 = X0 + 14, JX1 = X1 - 14, JW = 9.0, JY = EV + 4.6*0.55;
    bxP(B.p(DARK), JX0, JX1, JY - 0.3, JY + 1.3, -JW/2 + 0.3, JW/2 - 0.3);
    for (let x = JX0 + 0.6; x < JX1 - 0.4; x += 1.2) for (const s of [-1, 1]) boxP(B.p(COL), 0.12, 1.3, 0.1, x, JY, s*(JW/2 - 0.25), 0);
    hipRoof(g, (JX0 + JX1)/2, 0, JX1 - JX0 + 1.2, JW + 1.4, JY + 1.3, 1.6, ROOF2, 0, 0.2);
    B.flush(g);
    return g;
  }};
SG_PLACES.push({type:'sgmaxwell', lat:1.280358, lon:103.844735, rot:-0.8504});

// ---------------- shared: slab / curtain-wall blocks on real plan polygons ----------------
// residential slab (HDB): dark window band behind, a lit-window core material; per floor a spandrel / parapet band (bandH of fh)
function slabBlock(B, P, y0, y1, fh, cols, o){
  o = o || {}; const nF = Math.max(1, Math.round((y1 - y0)/fh)), f = (y1 - y0)/nF;
  prismP(B.p(cols.win), offP(P, 0.35), y0, y1);
  for (let i = 0; i < nF; i++){ const y = y0 + i*f; wallP(B.p(i % (o.alt || 1e9) === 0 && i ? cols.band2 || cols.band : cols.band), offP(P, -0.05), y + f*0.02, y + f*(o.bandH || 0.42)); }
  // vertical piers (party walls / columns) along each edge
  if (o.pier) for (const [x, z, a, L] of alongP(P, o.pier)) for (const s of [-0.5, 0.5]) boxP(B.p(cols.band), 0.35, y1 - y0, 0.55, x + Math.cos(a)*L*s, y0, z + Math.sin(a)*L*s, -a);
  prismP(B.p(cols.band), offP(P, -0.05), y1, y1 + (o.par || 1.1));
  capP(B.p(cols.roof || cols.band), offP(P, 0.3), y1 + 0.3);
}
// curtain wall: glass prism, aluminium spandrel bands every floor, mullions every `mw` m
function cwBlock(B, P, y0, y1, fh, cols, mw){
  const nF = Math.max(1, Math.round((y1 - y0)/fh)), f = (y1 - y0)/nF;
  prismP(B.p(cols.glass), P, y0, y1);
  for (let i = 1; i <= nF; i++){ const y = y0 + i*f; wallP(B.p(cols.alu), offP(P, -0.12), y - 0.75, y - 0.05); }
  if (mw) for (const [x, z, a, L] of alongP(P, mw)) boxP(B.p(cols.alu), 0.14, y1 - y0, 0.3, x, y0, z, -a);
  prismP(B.p(cols.alu), offP(P, -0.15), y1, y1 + 1.2); capP(B.p(cols.roof || cols.alu), P, y1 + 0.2);
}

// ================= Chinatown Complex (牛车水大厦), 335 Smith Street =================
// HDB complex opened 1 October 1983 ($18 million, ~1.35 ha): wet market in the basement, shops on the first floor, the cooked
// food centre (Singapore's largest hawker centre) on the second floor, a multi-storey car park; two L-shaped HDB blocks of 21
// and 25 storeys stand on it (NLB Infopedia); upgraded 2008. OSM: the complex w47298646 (podium; a 12 m part in the south),
// the 21-storey L block w171985729 (parts 9.9-69.9 m) and the 25-storey L block w870261058 / w171985727 (lift cores to 83 m).
// Colours are not documented: a brown-tiled podium and cream blocks with brown spandrels are assumed. Local frame = the ref
// frame round the anchor (+x east, +z south, rot 0). Night: lit flat windows, lit food-centre openings.
LANDMARKS.sgchinatowncx = {zh:'牛车水大厦', en:'Chinatown Complex', cat:'new', r:80, h:84,
  lt:{m:1, c:'#fff0d6', k:0.55, fh:2.8, cw:2.4},
  build(){
    const g = new THREE.Group(), B = mkB();
    const POD = {c:'#9a6a52', m:0, lc:'#ffe0b8', lk:0.5}, POD2 = {c:'#c9b8a2', m:0, lc:'#ffe0b8', lk:0.5}, DARK = {c:'#3a3430', m:0}, GLOW = {c:'#e9d9b6', glow:'#ffd896', gk:0.8, m:0},
      WIN = {c:'#4d555a', m:1, fh:2.8, cw:2.4}, BAND = {c:'#e4dccb', m:0, lc:'#fff0d6', lk:0.25}, BAND2 = {c:'#9a6a52', m:0}, ROOF = {c:'#8d8880', m:0}, CORE = {c:'#e4dccb', m:0, lc:'#fff0d6', lk:0.3};
    const CX = [[-69.2,12.5],[-71.6,10.1],[-71.0,7.6],[-53.0,-23.9],[-18.3,-4.9],[-20.0,-1.9],[-16.6,0.4],[-14.3,-3.7],[-11.3,-2.0],[-8.4,-7.1],[-42.3,-29.0],[-45.3,-29.6],[-46.5,-31.5],[-46.0,-33.2],[-47.7,-35.0],[-31.6,-54.7],[-30.4,-57.6],[-27.4,-59.4],[-21.4,-67.2],[20.5,-42.3],[22.9,-39.3],[24.7,-32.7],[23.5,-26.7],[17.6,-17.3],[21.6,-15.0],[34.8,-38.1],[67.7,-17.9],[69.5,-14.3],[51.5,16.6],[26.4,3.1],[24.6,6.0],[16.3,1.9],[11.6,10.6],[52.2,33.7],[32.4,68.8]];
    const SOUTH = [[6.1,1.1],[-42.3,-29.1],[-44.1,-29.1],[-45.2,-29.9],[-45.2,-37.9],[-31.5,-54.6],[-30.3,-57.6],[-27.3,-59.4],[-21.4,-67.1],[20.4,-42.2],[24.0,-36.2],[23.4,-26.7]];
    const WT = [[-46.5,22.0],[-45.3,19.4],[-42.3,20.6],[-31.7,2.9],[-51.2,-7.6],[-52.4,-5.9],[-54.9,-6.5],[-53.7,-9.5],[-56.1,-10.7],[-55.5,-12.5],[-57.3,-14.3],[-54.2,-19.7],[-51.9,-18.6],[-51.2,-19.7],[-49.5,-18.6],[-48.9,-19.7],[-47.1,-19.2],[-46.4,-20.3],[-38.6,-15.6],[-38.6,-14.4],[-36.4,-13.3],[-36.2,-13.8],[-27.9,-9.0],[-28.3,-8.4],[-27.4,-7.9],[-26.7,-8.5],[-24.3,-7.3],[-24.8,-6.0],[-21.3,-4.2],[-24.8,1.7],[-19.5,4.7],[-22.4,9.4],[-21.3,10.1],[-26.1,17.8],[-26.7,17.8],[-27.8,20.1],[-27.2,20.7],[-31.4,28.5],[-33.2,29.7]];
    const ET = [[41.3,-21.4],[46.1,-17.8],[44.9,-16.7],[41.3,-18.4],[35.9,-9.0],[49.1,-1.2],[50.3,-3.6],[52.1,-4.2],[53.3,-3.0],[51.5,-0.1],[55.6,2.9],[49.1,14.2],[38.3,8.2],[39.5,6.5],[27.6,-0.1],[24.6,4.7],[21.6,3.5],[21.0,2.9],[22.8,-0.7],[19.2,-3.0],[21.6,-6.6],[19.8,-7.8],[29.4,-22.0],[28.2,-23.2],[33.0,-30.9],[34.2,-30.3],[36.5,-34.5],[46.1,-29.1]];
    const PT = 9.9;
    // ---- podium: market / shops / food centre / car park, horizontal bands of openings ----
    prismP(B.p(POD), CX, -5, PT);
    wallP(B.p(DARK), offP(CX, -0.1), 0.0, 3.2);                                                   // shop fronts under the canopy
    wallP(B.p(POD2), offP(CX, -0.9), 3.2, 3.8);                                                   // canopy band round the base
    wallP(B.p(GLOW), offP(CX, -0.08), 5.0, 7.6);                                                  // food-centre openings (second storey)
    wallP(B.p(POD2), offP(CX, -0.15), PT - 0.5, PT + 0.6);
    capP(B.p(ROOF), CX, PT + 0.05);
    for (const [x, z, a, L] of alongP(CX, 6.0)) if (L > 2) boxP(B.p(POD), 0.6, 4.2, 0.4, x, 3.8, z, -a);        // piers between the openings
    prismP(B.p(POD), SOUTH, PT, 12.0); wallP(B.p(GLOW), offP(SOUTH, -0.08), PT + 0.4, 11.5); capP(B.p(ROOF), SOUTH, 12.05);
    // food-centre roof: raised ventilation clerestories (jack roofs) over the hawker hall
    for (const [cx, cz, ry] of [[-6, -38, 0.53], [8, -25, 0.53], [-24, -22, 0.53]]){ boxP(B.p(DARK), 16, 1.4, 5, cx, 12.0, cz, ry); hipRoof(g, cx, cz, 17, 6.2, 13.4, 1.4, '#7b746c', ry, 0.2); }
    // ---- the two L-shaped residential blocks (21 and 25 storeys) ----
    const cols = {win:WIN, band:BAND, band2:BAND2, roof:ROOF};
    slabBlock(B, WT, PT, 69.0, 69.0/21 > 0 ? (69.0 - PT)/21 : 2.8, cols, {bandH:0.45, alt:4, pier:7.5, par:0.9});
    slabBlock(B, ET, PT, 80.2, (80.2 - PT)/25, cols, {bandH:0.45, alt:4, pier:7.5, par:0.9});
    // lift cores and water tanks on the roofs (OSM parts)
    prismP(B.p(CORE), [[-51.8,-18.4],[-55.4,-12.5],[-57.2,-13.7],[-54.2,-19.6]], 69.0, 72.5); prismP(B.p(CORE), [[-53.6,-9.5],[-51.2,-7.8],[-52.4,-6.0],[-54.8,-7.2]], 69.0, 72.5);
    prismP(B.p(CORE), [[53.3,7.7],[55.6,2.9],[56.8,3.5],[55.1,8.2]].map(p => [p[0] - 1.6, p[1] + 0.2]), 80.2, 83.6); prismP(B.p(CORE), [[41.9,-31.5],[43.1,-32.1],[46.7,-29.7],[46.1,-29.1]].map(p => [p[0] - 0.8, p[1] + 0.9]), 80.2, 83.6);
    for (const [x, z] of [[-38, -6], [-36, 12], [36, -18], [40, 2]]) boxP(B.p(CORE), 4.5, 2.6, 4.5, x, (x < 0 ? 69.0 : 80.2) + 0.3, z, x < 0 ? -0.5 : 0.53);
    B.flush(g);
    return g;
  }};
SG_PLACES.push({type:'sgchinatowncx', lat:1.282278, lon:103.843180, rot:0});

// ================= Police Cantonment Complex (警察广东民大厦), 391 New Bridge Road =================
// Public Works Department design (structural engineer CPG, contractor Kajima), built Nov 1997 - May 2001, opened July 2001:
// a 25-storey tower with 6- to 9-storey podium blocks (four blocks A-D), a 4-storey basement, 106,400 m2; an energy-efficient
// aluminium and glass curtain wall; a semicircular structure at the corner depicting a soaring bird's wing (Wikipedia).
// Massing from the OSM building parts of w32507125: tower 85 m, west wing 60 m, podium blocks 20 / 27 / 28 / 34 m, the round
// corner block (20.4 m) at the north tip, a 7.2 m entrance block in the south. The form of the "wing" over the round block is
// an interpretation (an upswept canopy); glass / aluminium tones assumed. Local frame = ref frame (rot 0). Night: lit offices.
LANDMARKS.sgcantonment = {zh:'警察广东民大厦', en:'Police Cantonment Complex', cat:'new', r:82, h:89,
  lt:{m:1, c:'#f4f2ea', k:0.6, fh:3.6, cw:3.0},
  build(){
    const g = new THREE.Group(), B = mkB();
    const GL = {c:'#5d7a88', m:1, fh:3.6, cw:3.0}, GL2 = {c:'#6c8794', m:1, fh:3.6, cw:3.0}, ALU = {c:'#cfd3d4', m:0, lc:'#eef4ff', lk:0.4}, BASE = {c:'#b9b2a5', m:0},
      ROOF = {c:'#8f9294', m:0}, DARK = {c:'#3c4044', m:0}, CROWN = {c:'#dfe3e4', m:0, lc:'#dce8ff', lk:1.1}, LOBBY = {c:'#d9d2bf', glow:'#ffe2b0', gk:0.7, m:0};
    const RING = [[-43.2,-25.1],[-46.2,-31.1],[-6.8,-51.2],[-8.6,-56.0],[-8.6,-60.1],[-7.4,-64.3],[-5.0,-67.8],[-0.8,-70.2],[3.3,-71.4],[7.5,-70.8],[11.1,-68.4],[15.3,-63.1],[15.9,-58.9],[14.7,-53.0],[16.5,-50.0],[18.9,-51.2],[20.7,-48.3],[22.4,-48.9],[60.1,23.5],[58.3,24.7],[64.2,37.1],[43.3,41.9],[46.9,47.8],[35.6,50.2],[32.6,44.3],[25.4,46.6],[26.0,52.0],[-15.8,61.5],[-17.6,51.4],[-45.6,47.8],[14.1,17.6],[-1.4,-13.9],[-23.5,-2.6],[-19.3,5.1],[-56.4,24.1],[-73.7,-9.7]];
    prismP(B.p(BASE), RING, -5, 0.4);
    const PART = {
      east:[[-6.8,-51.2],[-2.6,-48.3],[2.2,-46.5],[6.9,-46.5],[11.7,-48.9],[14.7,-53.0],[16.5,-50.0],[18.9,-51.2],[20.7,-48.3],[22.4,-48.9],[60.1,23.5],[58.3,24.7],[64.2,37.1],[43.3,41.9],[36.8,31.2],[39.2,30.0],[35.6,6.9],[14.1,17.6],[-1.4,-13.9],[-6.2,-11.5],[-10.4,-19.8],[5.1,-27.5]],
      south:[[-45.6,47.8],[35.6,6.9],[39.2,30.0],[36.8,31.2],[28.4,15.2],[19.5,19.9],[32.6,44.3],[11.1,49.0],[-17.6,51.4]],
      west:[[-39.6,-17.4],[-57.5,-7.9],[-47.4,11.6],[-59.9,17.6],[-73.7,-9.7],[-43.2,-25.1]],
      tower:[[-19.3,5.1],[-44.4,17.6],[-57.5,-7.9],[-32.5,-21.0]],
      entr:[[25.4,46.6],[26.0,52.0],[-15.8,61.5],[-17.6,51.4],[11.1,49.0]],
      north:[[-6.8,-51.2],[5.1,-27.5],[-10.4,-19.8],[-6.2,-11.5],[-23.5,-2.6],[-32.5,-21.0],[-39.6,-17.4],[-46.2,-31.1]],
      se:[[36.8,31.2],[46.9,47.8],[35.6,50.2],[19.5,19.9],[28.4,15.2]] };
    const C = {glass:GL, alu:ALU, roof:ROOF}, C2 = {glass:GL2, alu:ALU, roof:ROOF};
    // podium blocks: a 4.5 m lobby storey, then office floors
    for (const [k, h] of [['east', 20.0], ['south', 28.0], ['north', 27.0], ['se', 34.0]]){ const P = offP(PART[k], 0.05);
      prismP(B.p(LOBBY), offP(P, 0.6), 0.4, 4.8); wallP(B.p(ALU), offP(P, -0.05), 4.4, 5.0);
      for (const [x, z, a, L] of alongP(P, 8.4)) if (L > 3) boxP(B.p(ALU), 0.7, 4.4, 0.7, x, 0.4, z, -a);
      cwBlock(B, P, 5.0, h, 3.9, k === 'south' ? C2 : C, 1.6); }
    // west wing (60 m) and the 25-storey tower (85 m) with its crown
    { const P = offP(PART.west, 0.05); prismP(B.p(LOBBY), offP(P, 0.6), 0.4, 4.8); cwBlock(B, P, 4.8, 60.0, 3.45, C2, 1.6); }
    { const P = offP(PART.tower, 0.05); prismP(B.p(LOBBY), offP(P, 0.6), 0.4, 4.8); cwBlock(B, P, 4.8, 85.0, 3.2, C, 1.5);
      // top: recessed plant storey behind an aluminium screen, a thin projecting roof plane
      const P2 = offP(P, 2.0); prismP(B.p(DARK), P2, 85.0, 88.0); wallP(B.p(CROWN), offP(P, 0.4), 85.6, 88.4);
      for (const [x, z, a] of alongP(offP(P, 0.4), 1.2)) boxP(B.p(CROWN), 0.12, 2.8, 0.35, x, 85.6, z, -a);
      prismP(B.p(CROWN), offP(P, -0.8), 88.4, 88.9); }
    // entrance block (7.2 m) with a canopy
    { const P = offP(PART.entr, 0.05); prismP(B.p(LOBBY), P, 0.4, 6.4); prismP(B.p(ALU), offP(P, -0.6), 6.4, 7.2); }
    // the round corner block and its upswept "wing" canopy
    { const cx = 3.6, cz = -58.6, R = 11.6;
      latheP(B.p(GL), [[R - 0.6, 0.4], [R - 0.6, 4.8]], cx, cz, 28); latheP(B.p(LOBBY), [[R - 0.9, 0.4], [R - 0.9, 4.6]], cx, cz, 28);
      latheP(B.p(GL), [[R, 4.8], [R, 20.4]], cx, cz, 28); capP(B.p(ROOF), ringPts(cx, cz, R, 28), 20.4);
      for (let y = 8.7; y < 20; y += 3.9) latheP(B.p(ALU), [[R + 0.12, y - 0.7], [R + 0.12, y]], cx, cz, 28);
      for (let i = 0; i < 28; i++){ const a = i/28*TAU; boxP(B.p(ALU), 0.16, 15.6, 0.3, cx + Math.cos(a)*(R + 0.1), 4.8, cz + Math.sin(a)*(R + 0.1), -a + HP); }
      // canopy: thin shell over the outer (north) half, rising from 21 m at the core to 25 m at the rim
      const o = B.p(CROWN), N = 14, M = 4, a0 = PI*1.05, a1 = PI*1.95, pt = (i, j) => { const a = a0 + (a1 - a0)*i/N, r = R*0.25 + (R + 0.3 - R*0.25)*j/M, t = j/M, lift = 1 - Math.pow(Math.abs(2*i/N - 1), 2)*0.6;
        return [cx + Math.cos(a)*r, 21.0 + 4.2*t*t*lift, cz + Math.sin(a)*r]; };
      for (let i = 0; i < N; i++) for (let j = 0; j < M; j++){ quadP(o, pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)); }
      for (let i = 0; i <= N; i += 2) segP(B.p(ALU), [cx + Math.cos(a0 + (a1 - a0)*i/N)*R*0.3, 20.4, cz + Math.sin(a0 + (a1 - a0)*i/N)*R*0.3], pt(i, M - 1), 0.12, 4);
    }
    B.flush(g);
    return g;
  }};
SG_PLACES.push({type:'sgcantonment', lat:1.278458, lon:103.839514, rot:0});

// ================= UE Square (联合工程广场), River Valley Road / Clemenceau Avenue =================
// Mixed-use "city within a city" by Architects 61 on the former United Engineers headquarters site (Asian Architect &
// Contractor 1997, via CUHK library). Modelled: the anchor building w172749016 only - the retail podium (13.2 m) and the two
// blocks above it (to 36.9 m) with the roof structures from the OSM parts (36.3-43.5 m). The pitched red-tiled roofs follow
// the target note (not verified). UE Square's office tower (w320637212) and the Residences (w172748774) are not modelled.
// Local frame = ref frame (rot 0), origin at the footprint centre.
LANDMARKS.sguesquare = {zh:'联合工程广场', en:'UE Square', cat:'new', r:46, h:44,
  lt:{m:1, c:'#fff0d6', k:0.55, fh:3.1, cw:2.6},
  build(){
    const g = new THREE.Group(), B = mkB();
    const POD = {c:'#e6ddcc', m:0, lc:'#ffe6c4', lk:0.45}, WIN = {c:'#55606a', m:1, fh:3.1, cw:2.6}, BAND = {c:'#efe9dc', m:0, lc:'#fff0d6', lk:0.2}, BAND2 = {c:'#b3876a', m:0},
      ROOF = {c:'#b0563c', m:0, lc:'#ffcf9e', lk:0.4}, DARK = {c:'#3c3a38', m:0}, SHOP = {c:'#e8d8b8', glow:'#ffe2b0', gk:0.8, m:0}, GREY = {c:'#8d8a84', m:0};
    const O = [-9.0, -50.5];                                    // ref offset of the local origin
    const T = P => P.map(p => [p[0] + O[0], p[1] + O[1]]);
    const RING = T([[46.2,39.4],[18.1,89.4],[10.9,84.6],[6.1,75.1],[-1.7,68.0],[-12.4,64.5],[-21.3,64.5],[-28.0,59.7],[-1.0,11.5]]);
    prismP(B.p(POD), RING, -5, 13.2);
    wallP(B.p(SHOP), offP(RING, -0.06), 0.4, 4.2); wallP(B.p(BAND), offP(RING, -0.9), 4.2, 4.8);
    wallP(B.p(WIN), offP(RING, -0.05), 6.2, 11.8); wallP(B.p(BAND), offP(RING, -0.12), 12.4, 13.6); capP(B.p(GREY), RING, 13.25);
    for (const [x, z, a, L] of alongP(RING, 7.0)) if (L > 3) boxP(B.p(BAND), 0.6, 8.4, 0.5, x, 4.8, z, -a);
    const cols = {win:WIN, band:BAND, band2:BAND2, roof:GREY};
    const A = T([[-24.9,55.5],[-1.0,12.8],[13.3,20.5],[-7.0,57.8],[-13.5,53.7],[-17.1,60.2]]);
    const Bk = T([[31.2,31.2],[45.0,39.5],[20.5,82.2],[12.1,77.4],[15.7,71.5],[9.2,67.9],[19.3,51.0]]);
    slabBlock(B, A, 13.2, 36.9, 3.1, cols, {bandH:0.36, alt:3, pier:6.5, par:0.4});
    slabBlock(B, Bk, 13.2, 36.9, 3.1, cols, {bandH:0.36, alt:3, pier:6.5, par:0.4});
    // pitched roofs over the blocks (hips along each block's long axis) and the raised roof pieces (OSM 36.3-43.5 m)
    const hipOn = (P, y, h, over) => { let best = 0, ang = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L > best){ best = L; ang = Math.atan2(b[1] - a[1], b[0] - a[0]); } }
      const c = Math.cos(ang), s = Math.sin(ang), cc = ctr(P); let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
      for (const p of P){ const dx = p[0] - cc[0], dz = p[1] - cc[1], u = dx*c + dz*s, v = -dx*s + dz*c; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
      const uc = (u0 + u1)/2, vc = (v0 + v1)/2; hipRoof(g, cc[0] + uc*c - vc*s, cc[1] + uc*s + vc*c, u1 - u0, v1 - v0, y, h, ROOF, -ang, over); };
    hipOn(A, 37.0, 3.6, 0.8); hipOn(T([[31.2,31.2],[45.0,39.5],[20.5,82.2],[19.3,81.5],[19.3,51.0]]), 37.0, 3.2, 0.8); hipOn(T([[19.3,51.0],[19.3,81.5],[12.1,77.4],[15.7,71.5],[9.2,67.9]]), 37.0, 2.4, 0.6);
    hipOn(T([[-12.3,32.3],[-8.8,27.0],[-4.0,30.0],[-7.0,35.3]]), 40.4, 3.0, 0.3); hipOn(T([[-17.1,41.2],[-11.1,44.8],[-14.1,50.1],[-20.1,47.2]]), 40.4, 3.0, 0.3);
    B.flush(g);
    return g;
  }};
SG_PLACES.push({type:'sguesquare', lat:1.292143, lon:103.842681, rot:0});

// ---------------- shared bridge pieces ----------------
// deck profile: y at local x (ends at y0, crown rise at mid)
const bProf = (L, y0, rise) => x => y0 + rise*(1 - Math.pow(2*x/L, 2));
function bDeck(B, col, L, W, prof, th, n, zf){ n = n || 12; zf = zf || (() => 0); for (let i = 0; i < n; i++){ const x0 = -L/2 + L*i/n, x1 = -L/2 + L*(i + 1)/n, o = B.p(col);
  const P = (x, y, z) => [x, y, z + zf(x)]; const a = prof(x0), b = prof(x1);
  quadP(o, P(x0, a, -W/2), P(x1, b, -W/2), P(x1, b, W/2), P(x0, a, W/2));   // top
  quadP(o, P(x0, a - th, W/2), P(x1, b - th, W/2), P(x1, b - th, -W/2), P(x0, a - th, -W/2));
  for (const s of [-1, 1]) quadP(o, P(x0, a - th, s*W/2), P(x1, b - th, s*W/2), P(x1, b, s*W/2), P(x0, a, s*W/2)); } }
function bLamp(B, POST, LAMP, x, y, z, h){ segP(B.p(POST), [x, y, z], [x, y + h, z], 0.07, 6); latheP(B.p(POST), [[0.18, y], [0.14, y + 0.5], [0.08, y + 0.7]], x, z, 6); latheP(B.p(LAMP), [[0.05, y + h], [0.24, y + h + 0.1], [0.26, y + h + 0.45], [0.18, y + h + 0.6], [0.04, y + h + 0.7]], x, z, 6); }

// ================= Ord Bridge (奥德桥), Clarke Quay / Robertson Quay =================
// Pedestrian bridge over the Singapore River, completed July 1886 and opened that year, replacing the ABC Bridge; a steel truss
// bridge "designed in simple form with symmetrical balustrades and girders" (Wikipedia; remembersingapore). Conserved by URA
// (2008). Extent from the bridge path line in the refs (44 m between the two quays). Deck width, truss depth and the paint colour
// are not documented (estimates). Local frame: x along the bridge (towards the north-east bank), deck centred on z = 0.
LANDMARKS.sgordbr = {zh:'奥德桥', en:'Ord Bridge', cat:'old', r:26, h:5.5,
  lt:{m:0, c:'#ffe2b8', k:1.0, e:0.8},
  build(){
    const g = new THREE.Group(), B = mkB();
    const STEEL = '#4f5d5a', DECK = '#8b7f70', STONE = '#a59e91', POST = '#2f3533', LAMP = {c:'#fff2cc', glow:'#ffd890', gk:1.8}, RAIL = '#5a6965';
    const L = 40, W = 3.6, prof = bProf(L, 0.1, 1.7), th = 0.35;
    bDeck(B, DECK, L, W, prof, th, 14);
    // two lattice side girders forming the balustrades: top and bottom chords, Warren diagonals, posts
    for (const s of [-1, 1]){ const z = s*(W/2 + 0.12), n = 20, top = x => prof(x) + 1.15, bot = x => prof(x) - 0.75;
      for (let i = 0; i < n; i++){ const x0 = -L/2 + L*i/n, x1 = -L/2 + L*(i + 1)/n;
        segP(B.p(STEEL), [x0, top(x0), z], [x1, top(x1), z], 0.09, 4); segP(B.p(STEEL), [x0, bot(x0), z], [x1, bot(x1), z], 0.12, 4);
        segP(B.p(STEEL), [x0, bot(x0), z], [(x0 + x1)/2, top((x0 + x1)/2), z], 0.05, 4); segP(B.p(STEEL), [(x0 + x1)/2, top((x0 + x1)/2), z], [x1, bot(x1), z], 0.05, 4);
        segP(B.p(STEEL), [x0, bot(x0), z], [x0, top(x0), z], 0.06, 4);
        segP(B.p(RAIL), [x0, prof(x0) + 0.55, z], [x1, prof(x1) + 0.55, z], 0.03, 3); }
      segP(B.p(STEEL), [L/2, bot(L/2), z], [L/2, top(L/2), z], 0.08, 4);
      boxP(B.p(STEEL), L, 0.05, 0.22, 0, top(0) + 0.0, z, 0); }
    // cross girders under the deck
    for (let i = 0; i <= 10; i++){ const x = -L/2 + L*i/10; boxP(B.p(STEEL), 0.25, 0.5, W + 0.3, x, prof(x) - th - 0.45, 0, 0); }
    // stone abutments on both quays, lamps at the four corners
    for (const sx of [-1, 1]){ const x = sx*(L/2 + 1.2); bxP(B.p(STONE), x - 1.6, x + 1.6, -5, prof(sx*L/2) - 0.05, -W/2 - 0.6, W/2 + 0.6);
      capP(B.p(DECK), rectXZ(x - 1.6, x + 1.6, -W/2, W/2), prof(sx*L/2));
      for (const s of [-1, 1]){ bxP(B.p(STONE), x - 0.45, x + 0.45, prof(sx*L/2), prof(sx*L/2) + 1.3, s*(W/2 + 0.15) - 0.4, s*(W/2 + 0.15) + 0.4); bLamp(B, POST, LAMP, x, prof(sx*L/2) + 1.3, s*(W/2 + 0.15), 2.6); } }
    B.flush(g);
    return g;
  }};
SG_PLACES.push({type:'sgordbr', lat:1.290942, lon:103.844058, rot:1.0454});

// ================= Jiak Kim Bridge (爵金桥), Robertson Quay =================
// Pedestrian bridge over the upper Singapore River at Jiak Kim Street, opened 1999, designed by CPG Corporation: a single-arch
// (cable arch) bridge with nine steel cables holding the deck from the span, painted white or ash (Wikipedia; penang-traveltips).
// Extent from the bridge path line in the refs (47 m). Arch rise, deck width and which side the arch rib stands on are not
// documented: the rib is modelled along the downstream side, leaning over the deck; the deck follows the real path line. Local frame: x along the bridge (towards the
// Kim Seng Park bank, ENE).
LANDMARKS.sgjiakkim = {zh:'爵金桥', en:'Jiak Kim Bridge', cat:'new', r:28, h:11,
  lt:{m:0, c:'#eef3ff', k:1.1, e:0.8},
  build(){
    const g = new THREE.Group(), B = mkB();
    const WHITE = {c:'#e6e6e0', lc:'#e8f0ff', lk:1.2}, DECK = '#9c958a', STONE = '#a59e91', CABLE = '#bfc1bd', RAIL = '#d8d8d2', POST = '#6c6f6d', LAMP = {c:'#fff2cc', glow:'#ffe6b0', gk:1.6};
    const L = 44, W = 4.0, prof = bProf(L, 0.1, 1.5), th = 0.45;
    // the deck follows the real path line, which bends ~3 m upstream at mid-river: centreline offset zf(x)
    const ZP = [[-23.6, 0], [-15.8, -1.1], [-0.4, -3.2], [23.6, 0]], zf = x => { for (let i = 0; i < ZP.length - 1; i++){ const a = ZP[i], b = ZP[i+1]; if (x <= b[0] || i === ZP.length - 2){ const t = Math.max(0, Math.min(1, (x - a[0])/(b[0] - a[0]))); return a[1] + (b[1] - a[1])*t; } } return 0; };
    bDeck(B, DECK, L, W, prof, th, 16, zf);
    for (const s of [-1, 1]) for (let i = 0; i < 22; i++){ const x0 = -L/2 + L*i/22, x1 = -L/2 + L*(i + 1)/22, z0 = zf(x0) + s*(W/2 - 0.05), z1 = zf(x1) + s*(W/2 - 0.05);
      segP(B.p(WHITE), [x0, prof(x0) - th - 0.25, z0], [x1, prof(x1) - th - 0.25, z1], 0.28, 4);
      segP(B.p(RAIL), [x0, prof(x0) + 1.1, z0], [x1, prof(x1) + 1.1, z1], 0.04, 4); segP(B.p(RAIL), [x0, prof(x0), z0], [x0, prof(x0) + 1.1, z0], 0.025, 3); }
    // the single arch rib springing from the two banks, its plane leaning over the deck; nine cables to the deck edge
    const SP = L/2 + 1.0, RISE = 9.5, zb = W/2 + 0.6, lean = -1.4, arch = t => { const x = -SP + 2*SP*t, y = 0.3 + RISE*(1 - Math.pow(2*t - 1, 2)); return [x, y, zb + lean*(y/RISE)]; };
    let prev = arch(0); for (let i = 1; i <= 24; i++){ const p = arch(i/24); segP(B.p(WHITE), prev, p, 0.38, 6); prev = p; }
    for (let k = 1; k <= 9; k++){ const t = 0.5 + (k - 5)*0.085, a = arch(t), x = a[0]; segP(B.p(CABLE), a, [x, prof(x) - 0.2, zf(x) + W/2 - 0.1], 0.035, 3); }
    for (const sx of [-1, 1]){ const x = sx*(L/2 + 1.4); bxP(B.p(STONE), x - 1.8, x + 1.8, -5, prof(sx*L/2) - 0.05, -W/2 - 0.6, W/2 + 1.6); capP(B.p(DECK), rectXZ(x - 1.8, x + 1.8, -W/2, W/2), prof(sx*L/2));
      for (const s of [-1, 1]) bLamp(B, POST, LAMP, x, prof(sx*L/2), s*(W/2 + 0.2), 3.6); }
    B.flush(g);
    return g;
  }};
SG_PLACES.push({type:'sgjiakkim', lat:1.292236, lon:103.835705, rot:0.5586});

}
