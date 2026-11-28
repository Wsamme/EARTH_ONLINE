// ===== lm50/sg50b: Singapore - Tanjong Pagar (Anson Road, south Shenton Way), Chinatown, Outram (SGH campus), Tiong Bahru (City Brush lm50, real Singapore 1:1)
// Built in the map frame (local +x = east, +z = south, rot 0) on the real OSM footprints of R/lm50/ref_sg50b.json (+ corrected refs in SC/lm50/sg50b/).
// Only LANDMARKS and SG_PLACES are touched; helpers live inside this block (shared kit copied from lm50/sg50a).
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
const _Q4 = [[0, 1, 2], [0, 2, 3]];
function shapeP(o, pts, F, w){ for (const [a, b, c] of (pts.length === 4 ? _Q4 : tri2(pts))) o.push(...F(pts[a][0], pts[a][1], w), ...F(pts[b][0], pts[b][1], w), ...F(pts[c][0], pts[c][1], w)); }
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
function chiweiP(o, x, y, z, ang, s){ const P = [[-0.5, 0], [0.45, 0], [0.55, 0.6], [0.35, 1.25], [0.0, 1.55], [-0.15, 1.2], [0.15, 1.0], [0.1, 0.6], [-0.35, 0.45]].map(p => [p[0]*s, y + p[1]*s]);
  slabP(o, P, fA(x, z, ang), -0.12*s, 0.12*s); }

// ---- extra helpers (lm26/sgcbd) ----
// local frame: F(u, y, v) -> [x, y, z]; +u at plan angle a (x east, z south), +v = +u turned 90 deg towards +z
const frame = (ox, oz, a) => { const c = Math.cos(a), s = Math.sin(a); const f = (u, y, v) => [ox + u*c - v*s, y, oz + u*s + v*c];
  f.P = (u, v) => [ox + u*c - v*s, oz + u*s + v*c]; f.L = (x, z) => [(x - ox)*c + (z - oz)*s, -(x - ox)*s + (z - oz)*c]; f.a = a; return f; };
// box from local (u, y, v) ranges in frame F
function bxF(o, F, u0, u1, y0, y1, v0, v1, bot){
  const P = [F(u0,y0,v0), F(u1,y0,v0), F(u1,y0,v1), F(u0,y0,v1), F(u0,y1,v0), F(u1,y1,v0), F(u1,y1,v1), F(u0,y1,v1)];
  quadP(o, P[4], P[7], P[6], P[5]); quadP(o, P[0], P[4], P[5], P[1]); quadP(o, P[1], P[5], P[6], P[2]); quadP(o, P[2], P[6], P[7], P[3]); quadP(o, P[3], P[7], P[4], P[0]); if (bot) quadP(o, P[0], P[1], P[2], P[3]);
}
const polyF = (F, P) => P.map(p => F.P(p[0], p[1]));
// loft closed rings (arrays of [x, y, z], same count) into a batch
function loftP(o, S, cap){ const n = S[0].length; for (let k = 0; k < S.length - 1; k++) for (let i = 0; i < n; i++){ const j = (i + 1) % n; quadP(o, S[k][i], S[k][j], S[k+1][j], S[k+1][i]); }
  if (cap){ const t = S[S.length - 1], c = [0, 0, 0]; for (const p of t){ c[0] += p[0]/n; c[1] += p[1]/n; c[2] += p[2]/n; } for (let i = 0; i < n; i++) triP(o, c, t[i], t[(i + 1) % n]); } }
// open strip lofts (rows of points, not closed)
function sheetP(o, S){ for (let k = 0; k < S.length - 1; k++) for (let i = 0; i < S[k].length - 1; i++) quadP(o, S[k][i], S[k][i+1], S[k+1][i+1], S[k+1][i]); }
// shift a plan polygon
const shP = (P, dx, dz) => P.map(p => [p[0] - dx, p[1] - dz]);
// a rounded tree (trunk + two lumps) into batches
function treeP(oT, oC, x, y, z, s, R){ segP(oT, [x, y, z], [x, y + 2.2*s, z], 0.18*s, 4); latheP(oC, [[0.2*s, y + 1.6*s], [1.5*s, y + 2.1*s], [1.9*s, y + 2.9*s], [1.4*s, y + 3.8*s], [0.2*s, y + 4.3*s]], x + (R() - 0.5)*0.4*s, z + (R() - 0.5)*0.4*s, 7, R()*3); }
const inPolyS = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0]-a[0])*(z-a[1])/(b[1]-a[1]) + a[0]) c = !c; } return c; };
// a band of height h round a plan polygon at y, `off` proud of the walls
function bandAtP(o, P, y, h, off){ for (const e of edgesF(P)) if (e.L > 0.2) shapeP(o, rectO(0, e.L, y, y + h), e.F, off || 0.1); }
// ---- lm40/sg40a helpers ----
// model origin at local (cx, cz) of a ref anchor -> SG_PLACES lat/lon (rot 0: model axes = map axes, +x east, +z south)
const LL40 = (alat, alon, cx, cz) => ({lat:+(alat - cz/110574).toFixed(7), lon:+(alon + cx/111290.5).toFixed(7)});
// curtain-wall facade on every edge of plan P between y0 and y1: vertical mullions (every `bay` m, `fd` deep) and floor bands
// (every `fh` m); o = {mul, band, bay, fd, fw, fh, bh, skip(e) -> true to leave an edge bare, yb (first band), bands:false}
function facadeP(B, P, y0, y1, o){
  const E = edgesF(P), fw = o.fw || 0.09, fd = o.fd || 0.35, bh = o.bh || 0.5;
  for (const e of E){
    if (e.L < 0.6 || (o.skip && o.skip(e))) continue;
    if (o.mul){ const nb = Math.max(1, Math.round(e.L/(o.bay || 3))), bw = e.L/nb;
      for (let k = (o.ends ? 0 : 1); k <= (o.ends ? nb : nb - 1); k++) slabP(B.p(o.mul), rectO(k*bw - fw, k*bw + fw, y0, y1), e.F, 0, fd); }
    if (o.band && o.bands !== false){ for (let y = (o.yb != null ? o.yb : y0 + o.fh); y < y1 - 0.3; y += o.fh) shapeP(B.p(o.band), rectO(0, e.L, y - bh/2, y + bh/2), e.F, o.bo || 0.06); }
  }
}
// vertical corner posts of plan P (round, radius r) between y0 and y1
function cornersP(o, P, y0, y1, r){ for (const p of P) segP(o, [p[0], y0, p[1]], [p[0], y1, p[1]], r, 6); }
// rectangle of half-sizes (a along angle ang, b across) centred at (cx, cz)
const rectA = (cx, cz, a, b, ang) => { const c = Math.cos(ang), s = Math.sin(ang); return [[-a, -b], [a, -b], [a, b], [-a, b]].map(([u, v]) => [cx + u*c - v*s, cz + u*s + v*c]); };
// polygon centroid (area-weighted)
const pcen = P => { let A = 0, x = 0, z = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], k = a[0]*b[1] - b[0]*a[1]; A += k; x += (a[0] + b[0])*k; z += (a[1] + b[1])*k; } return [x/(3*A), z/(3*A)]; };
// shift a list of polygons so (cx, cz) becomes the origin
const shAll = (L, c) => L.map(P => shP(P, c[0], c[1]));
// lamp standard: pole + lantern (pole, lamp batches)
function lampP(oP, oL, x, y, z, h, r){ segP(oP, [x, y, z], [x, y + h, z], r || 0.09, 6); latheP(oL, [[0.01, y + h - 0.1], [0.32, y + h], [0.3, y + h + 0.5], [0.01, y + h + 0.6]], x, z, 6); }
// ---- lm50/sg50a kit: tower facade helpers (batched; one LTris per colour spec) ----
// foundation skirt down to y = -5 under a plan polygon
const foundP = (o, P, y1) => wallP(o, P, -5, y1 == null ? 0.3 : y1);
// plain block: walls + roof cap
function blkP(B, P, y0, y1, wall, roof){ wallP(B.p(wall), P, y0, y1); capP(B.p(roof || wall), P, y1); }
// punched windows: on every edge longer than minL, rectangles ww x wh centred in bays of ~`bay` m, one per storey (fh), proud by w
// o.skip(e, i) -> true leaves an edge bare; o.end: bays to leave at each edge end (filled by o.endCol panels if given)
function winP(B, P, y0, y1, fh, bay, ww, wh, col, o){
  o = o || {}; const E = edgesF(P);
  E.forEach((e, i) => {
    if (e.L < (o.minL || 2.2) || (o.skip && o.skip(e, i))) return;
    const n = Math.max(1, Math.round(e.L/bay)), bw = e.L/n, end = Math.min(o.end || 0, Math.floor((n - 1)/2));
    for (let y = y0; y + fh <= y1 + 0.01; y += fh) for (let k = 0; k < n; k++){
      const u = (k + 0.5)*bw, isEnd = k < end || k >= n - end;
      if (isEnd && !o.endCol) continue;
      shapeP(B.p(isEnd ? o.endCol : col), rectO(u - ww/2, u + ww/2, y + (fh - wh)*0.55, y + (fh - wh)*0.55 + wh), e.F, o.w || 0.06);
    }
  });
}
// horizontal spandrel ribbons (height sh every fh) round a plan polygon, proud by w
function ribP(o, P, y0, y1, fh, sh, w){ for (let y = y0; y < y1 - 0.2; y += fh) bandAtP(o, P, y, Math.min(sh, y1 - y), w || 0.05); }
// floor-edge slabs / balcony ledges: a thin ring d m proud of plan P every fh m (walls + top + underside strip)
function ledgeP(o, P, y0, y1, fh, d, t){ const Q = offP(P, -d); for (let y = y0; y < y1 - 0.3; y += fh){ wallP(o, Q, y, y + t); capP(o, Q, y + t); } }
// per-edge wall material: walls of edges with f(e, i) -> colour spec (null = default)
function wallsByEdge(B, P, y0, y1, def, f){ edgesF(P).forEach((e, i) => { const c = (f && f(e, i)) || def; quadP(B.p(c), [e.a[0], y0, e.a[1]], [e.b[0], y0, e.b[1]], [e.b[0], y1, e.b[1]], [e.a[0], y1, e.a[1]]); }); }
// vertical fins on every edge (every `bay` m), d deep, t thick
function finsP(o, P, y0, y1, bay, d, t, skip){ edgesF(P).forEach((e, i) => { if (e.L < 1.5 || (skip && skip(e, i))) return; const n = Math.max(1, Math.round(e.L/bay)), bw = e.L/n;
  for (let k = 1; k < n; k++) slabP(o, rectO(k*bw - t/2, k*bw + t/2, y0, y1), e.F, 0, d); }); }
// regular-ish plan polygon from a centre, half sizes and angle with corner chamfer c (8 points)
const chamR = (cx, cz, a, b, ang, c) => { const C = Math.cos(ang), S = Math.sin(ang); return [[-a + c, -b], [a - c, -b], [a, -b + c], [a, b - c], [a - c, b], [-a + c, b], [-a, b - c], [-a, -b + c]].map(([u, v]) => [cx + u*C - v*S, cz + u*S + v*C]); };
// scale a polygon about its centroid
const scP = (P, s) => { const c = pcen(P); return P.map(p => [c[0] + (p[0] - c[0])*s, c[1] + (p[1] - c[1])*s]); };
// open lattice crown: posts on the polygon's vertices and along edges, rings at heights, diagonals
function latticeP(o, P, y0, y1, step, r, rings, diag){
  const pts = []; for (const e of edgesF(P)){ const n = Math.max(1, Math.round(e.L/step)); for (let k = 0; k < n; k++){ const t = k/n; pts.push([e.a[0] + (e.b[0] - e.a[0])*t, e.a[1] + (e.b[1] - e.a[1])*t]); } }
  for (const p of pts) segP(o, [p[0], y0, p[1]], [p[0], y1, p[1]], r, 4);
  const R = rings || 2; for (let k = 0; k <= R; k++){ const y = y0 + (y1 - y0)*k/R; for (let i = 0; i < pts.length; i++){ const a = pts[i], b = pts[(i + 1) % pts.length]; segP(o, [a[0], y, a[1]], [b[0], y, b[1]], r*0.8, 4); } }
  if (diag) for (let k = 0; k < R; k++){ const ya = y0 + (y1 - y0)*k/R, yb = y0 + (y1 - y0)*(k + 1)/R; for (let i = 0; i < pts.length; i++){ const a = pts[i], b = pts[(i + 1) % pts.length]; segP(o, [a[0], (k + i) % 2 ? ya : yb, a[1]], [b[0], (k + i) % 2 ? yb : ya, b[1]], r*0.7, 4); } }
}
// aircraft warning lamps on the corners of a polygon at y
function lavP(o, P, y){ for (const p of P) boxP(o, 0.5, 0.6, 0.5, p[0], y, p[1]); }
const LAV50 = {c:'#c22', glow:'#ff2a1a', gk:2};
// street trees round a polygon (outside it), skipping points inside any of the `keep out` polygons
function treesRound(B, P, off, step, s, R, out, T, L){ for (const [x, z] of alongP(offP(P, -off), step)){ if (out && out.some(Q => inPolyS(Q, x, z))) continue; treeP(B.p(T || '#5b4a3a'), B.p(L || {c:'#4f7a3e', m:0, lk:0.1}), x, 0.3, z, s, R); } }
// rectangle (half sizes a, b, turned ang) with re-entrant square notches n at the four corners (12 points)
const notchR = (cx, cz, a, b, ang, n) => { const C = Math.cos(ang), S = Math.sin(ang);
  return [[-a+n,-b],[a-n,-b],[a-n,-b+n],[a,-b+n],[a,b-n],[a-n,b-n],[a-n,b],[-a+n,b],[-a+n,b-n],[-a,b-n],[-a,-b+n],[-a+n,-b+n]].map(([u, v]) => [cx + u*C - v*S, cz + u*S + v*C]); };
// Catmull-Rom subdivision of an open chain of [x, z] points (keeps the end points), n pieces per segment
function crChain(P, n){ const out = []; for (let i = 0; i < P.length - 1; i++){ const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
  for (let k = 0; k < n; k++){ const t = k/n, t2 = t*t, t3 = t2*t; out.push([0, 1].map(j => 0.5*(2*p1[j] + (-p0[j] + p2[j])*t + (2*p0[j] - 5*p1[j] + 4*p2[j] - p3[j])*t2 + (-p0[j] + 3*p1[j] - 3*p2[j] + p3[j])*t3))); } }
  out.push(P[P.length - 1].slice()); return out; }
// tagged plan: [[x, z, tag], ...] -> {P, tags} where tags[i] is the tag of the edge from vertex i to i + 1
const tagP = T => ({P:T.map(t => [t[0], t[1]]), tags:T.map(t => t[2])});
// generic tower shaft on plan P between y0 and y1. s.sty: 'cw' glass + mullions + floor bands; 'rib' glass + spandrel ribbons
// (+ mullions); 'fin' glass + vertical fins + thin bands; 'punch' solid wall (s.fr) with a window grid (s.gl).
// s: {gl, fr, mul, band, fh, bay, sh (ribbon height), fd, fw, ww, wh, roof, cap:false, par (parapet height), minL}
function tw50(B, P, y0, y1, s){
  const fh = s.fh || 4, bay = s.bay || 3;
  if (s.sty === 'punch'){ wallP(B.p(s.fr), P, y0, y1); winP(B, P, y0 + (s.w0 || 0), y1, fh, bay, s.ww || 1.4, s.wh || fh*0.55, s.gl, {minL:s.minL || 2}); }
  else {
    wallP(B.p(s.gl), P, y0, y1);
    if (s.sty === 'rib'){ ribP(B.p(s.fr), P, y0 + fh - (s.sh || 1.2), y1, fh, s.sh || 1.2, 0.06); if (s.mul !== null) facadeP(B, P, y0, y1, {mul:s.mul || s.fr, bay, fd:s.fd || 0.2, fw:s.fw || 0.06, fh}); }
    else if (s.sty === 'fin'){ finsP(B.p(s.mul || s.fr), P, y0, y1, bay, s.fd || 0.6, s.fw || 0.25); ribP(B.p(s.band || s.fr), P, y0 + fh, y1, fh, s.bh || 0.3, 0.04); }
    else facadeP(B, P, y0, y1, {mul:s.mul || s.fr, band:s.band || s.fr, bay, fd:s.fd || 0.25, fw:s.fw || 0.07, fh, bh:s.bh || 0.35});
  }
  if (s.cap !== false) capP(B.p(s.roof || '#8e9192'), P, y1);
  if (s.par){ wallP(B.p(s.fr || s.mul), P, y1, y1 + s.par); }
}
// register a key: LANDMARKS entry + its SG_PLACES line (model origin = local (C0) of the ref anchor A0, rot 0)
function K50(key, zh, en, A0, C0, def){ LANDMARKS[key] = Object.assign({zh, en, cat:'new'}, def); const PL = LL40(A0[0], A0[1], C0[0], C0[1]); SG_PLACES.push({type:key, lat:PL.lat, lon:PL.lon, rot:0}); }
// common colour specs
const ROOF50 = '#8e9192', MECH50 = '#72777a', FOUND50 = '#bdb7ab', PAVE50 = '#c4beb2', LOB50 = {c:'#b4c2c6', m:0, glow:'#ffe6c0', gk:0.8};
// glazed recessed lobby band + foundation for a tower plan
function baseP(B, P, yl){ foundP(B.p(FOUND50), P); wallP(B.p(LOB50), offP(P, 1.2), 0.3, yl || 5); capP(B.p(ROOF50), offP(P, 1.2), 0.3); }
// ---- lm50/sg50b helpers ----
// shift a ref entry {A, r, p:[{r, b, t}]} so local (C) becomes the model origin
const PREP = (d, C) => ({r:shP(d.r, C[0], C[1]), p:(d.p || []).map(q => ({r:shP(q.r, C[0], C[1]), b:q.b, t:q.t}))});
// hip roof (straight planes) over the frame rectangle u0..u1 x v0..v1 at y, rise h, eaves overhang ov; gable roof when gab
function hipF(o, F, u0, u1, v0, v1, y, h, ov, gab){
  ov = ov || 0; u0 -= ov; u1 += ov; v0 -= ov; v1 += ov;
  const L = u1 - u0, W = v1 - v0, k = gab ? 0 : Math.min(L, W)/2, vm = (v0 + v1)/2, um = (u0 + u1)/2;
  const A = F(u0, y, v0), B = F(u1, y, v0), C = F(u1, y, v1), Dd = F(u0, y, v1);
  let r1, r2;
  if (L >= W){ r1 = F(u0 + k, y + h, vm); r2 = F(u1 - k, y + h, vm); quadP(o, A, B, r2, r1); quadP(o, C, Dd, r1, r2); triP(o, Dd, A, r1); triP(o, B, C, r2); }
  else { r1 = F(um, y + h, v0 + k); r2 = F(um, y + h, v1 - k); quadP(o, B, C, r2, r1); quadP(o, Dd, A, r1, r2); triP(o, A, B, r1); triP(o, C, Dd, r2); }
}
// cap between an outer polygon and holes (plan [x, z]) at y
function capHoleP(o, P, H, y){ const T = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), H.map(h => h.map(p => new THREE.Vector2(p[0], p[1])))); const A = P.concat(...H);
  for (const [a, b, c] of T) o.push(A[a][0], y, A[a][1], A[b][0], y, A[b][1], A[c][0], y, A[c][1]); }
// frame box of a facade frame F(u, v, w) (edgesF / fA style): u0..u1 along, v0..v1 up, w0..w1 out
const fbox = (o, F, u0, u1, v0, v1, w0, w1) => slabP(o, rectO(u0, u1, v0, v1), F, w0, w1);
// a residential slab: walls, corridor / balcony ledges every fh, window ribbons, roof; s = {wall, gl, ledge, roof, fh, ww}
function slab50(B, P, y0, y1, s){
  const fh = s.fh || 3;
  wallP(B.p(s.wall), P, y0, y1); capP(B.p(s.roof || ROOF50), P, y1);
  ribP(B.p(s.gl), P, y0 + fh*0.35, y1 - 0.4, fh, fh*0.45, 0.04);
  if (s.ledge) ledgeP(B.p(s.ledge), P, y0 + fh, y1, fh, s.ld || 0.8, 0.25);
  if (s.par !== false) wallP(B.p(s.wall), offP(P, -0.2), y1, y1 + (s.par || 1.1));
}
// simple low block with punched windows and a parapet; s = {wall, gl, fh, roof, par, bay}
function low50(B, P, y0, y1, s){
  wallP(B.p(s.wall), P, y0, y1); capP(B.p(s.roof || ROOF50), P, y1);
  if (s.gl) winP(B, P, y0 + (s.w0 || 1), y1 - 0.6, s.fh || 4, s.bay || 3.2, s.ww || 1.8, s.wh || (s.fh || 4)*0.5, s.gl, {minL:3});
  if (s.par) wallP(B.p(s.wall), P, y1, y1 + s.par);
}
// a shop / lobby glazing band round plan P from y0 to y1, set in by d
function lobby50(B, P, y0, y1, d){ const Q = offP(P, d == null ? 0.6 : d); wallP(B.p(LOB50), Q, y0, y1); }
// lit window spec shorthand
const GLs = (c, fh, cw) => ({c, m:1, fh:fh || 4, cw:cw || 2.4});
// stone / concrete spec shorthand
const STs = (c, lk) => ({c, m:0, lk:lk == null ? 0.35 : lk});
// ---- footprints from R/lm50/ref_sg50b.json and SC/lm50/sg50b/ref_sg50b_{1,2,3}.json (local m round the ref anchor A, +x east, +z south) ----
const D = {};
D.altez = {"A":[1.274603,103.844358],"r":[[22.4,-28.6],[15.9,28.4],[-20.6,30.6],[-17.1,-28.6]],"p":[{"r":[[-15.1,23.6],[14.2,27.1],[17.2,1.1],[-12.1,-2.4]],"b":10.0,"t":250.0},{"r":[[-17.1,-28.6],[-20.6,30.6],[15.9,28.4],[22.4,-28.6]],"b":0.0,"t":10.0}]};
D.mas = {"A":[1.274687,103.846652],"r":[[-41.9,12.9],[-26.5,-4.8],[-37.0,-13.8],[-8.3,-46.9],[2.1,-38.0],[4.5,-40.7],[14.5,-32.2],[19.7,-38.3],[20.6,-39.3],[24.6,-44.0],[41.3,-29.8],[36.6,-24.4],[31.1,-18.0],[42.3,-8.5],[32.1,3.2],[34.7,5.1],[35.3,7.0],[35.6,8.8],[0.6,50.4],[-1.3,51.2],[-4.2,51.5],[-41.6,18.7],[-44.4,16.2]],"p":[{"r":[[-8.4,41.7],[-15.1,41.7],[-4.1,51.2],[0.6,50.7],[8.1,41.7],[-1.1,41.7],[-4.1,45.4]],"b":0.0,"t":13.8},{"r":[[-1.1,41.7],[-8.4,41.7],[-4.1,45.4]],"b":0.0,"t":102.0},{"r":[[-36.9,16.9],[-39.6,20.2],[-15.1,41.7],[-8.4,41.7]],"b":0.0,"t":13.8},{"r":[[-1.1,41.7],[8.1,41.7],[35.9,8.7],[34.6,4.9],[32.1,3.2]],"b":0.0,"t":13.8},{"r":[[-39.6,20.2],[-36.9,16.9],[-41.1,13.4],[-43.9,16.4]],"b":4.2,"t":13.8},{"r":[[-36.9,16.9],[-19.4,-3.8],[-18.9,-4.8],[-18.9,-5.8],[-19.1,-6.8],[-19.9,-7.8],[-20.9,-8.3],[-21.9,-8.3],[-22.9,-8.1],[-23.9,-7.3],[-41.1,13.4]],"b":4.2,"t":102.0},{"r":[[-41.1,13.4],[-23.9,-7.3],[-22.9,-8.1],[-21.9,-8.3],[-20.9,-8.3],[-19.9,-7.8],[-19.1,-6.8],[-18.9,-5.8],[-18.9,-4.8],[-19.4,-3.8],[-36.9,16.9],[-8.4,41.7],[-1.1,41.7],[42.4,-8.6],[4.6,-40.6],[-41.9,12.7]],"b":0.0,"t":102.0}]};
D.spring = {"A":[1.27513,103.846284],"r":[[-35.8,34.8],[-37.4,31.4],[-39.8,29.1],[-37.0,25.5],[-37.9,23.8],[-38.0,21.4],[-37.5,19.7],[2.0,-28.3],[2.9,-33.7],[4.1,-36.7],[6.3,-39.9],[9.3,-42.3],[13.7,-43.3],[16.9,-44.1],[24.1,-43.2],[28.9,-40.0],[33.0,-35.3],[34.7,-30.3],[37.6,-29.1],[41.8,-25.3],[42.4,-24.7],[-2.9,29.7],[-18.4,48.4],[-21.0,46.0],[-23.9,43.4],[-24.7,44.5],[-31.5,39.1],[-30.2,37.6],[-31.8,36.4],[-33.2,37.9]],"p":[{"r":[[-18.6,2.9],[-10.4,13.7],[-9.1,11.4],[-7.4,12.4],[-8.6,14.2],[-1.4,20.2],[27.9,-11.8],[30.1,-17.1],[30.1,-21.8],[28.4,-27.3],[24.9,-30.8],[20.1,-33.1],[14.6,-33.1],[9.9,-31.3],[6.4,-28.3],[3.9,-23.1]],"b":0.0,"t":130.0},{"r":[[24.9,-30.8],[20.1,-33.1],[14.6,-33.1],[9.9,-31.3],[6.4,-28.3],[3.9,-23.1],[3.9,-18.3],[5.1,-13.1],[9.4,-9.3],[13.6,-7.1],[18.9,-6.6],[24.4,-8.3],[27.9,-11.8],[30.1,-17.1],[30.1,-21.8],[28.4,-27.3]],"b":0.0,"t":165.0}]};
D.s76 = {"A":[1.273421,103.845572],"r":[[36.3,-1.0],[-9.5,-40.4],[-41.5,-3.9],[10.1,40.5],[36.8,9.9],[37.3,4.6]],"p":[{"r":[[-6.9,23.9],[3.8,33.9],[5.6,33.9],[6.8,32.9],[18.6,18.7],[19.8,15.7],[25.1,10.4],[14.1,-0.1],[13.6,-0.1]],"b":0.0,"t":16.5},{"r":[[-6.9,23.9],[3.8,33.9],[5.6,33.9],[6.8,32.9],[18.6,18.7],[19.8,15.7],[25.3,10.4],[13.8,-0.3]],"b":16.5,"t":129.3}]};
D.lippo = {"A":[1.273089,103.844943],"r":[[-25.9,-16.1],[-28.7,-18.7],[-21.7,-25.9],[-8.8,-13.4],[0.2,-22.6],[5.8,-17.2],[-3.1,-8.1],[0.0,-5.0],[-6.3,1.5],[-4.1,3.6],[2.8,-3.4],[4.2,-2.0],[11.2,-9.7],[23.6,-22.4],[57.0,9.8],[44.6,22.5],[33.5,11.7],[26.3,20.0],[19.2,14.9],[12.7,21.5],[4.7,13.8],[-3.8,22.4],[-13.4,13.1],[-10.5,10.2],[-14.0,6.9],[-18.2,11.2],[-22.8,6.6],[-27.4,11.3],[-32.6,6.3],[-37.0,10.8],[-42.1,5.8],[-47.0,10.7],[-52.2,5.7],[-56.9,10.5],[-61.9,5.7],[-53.0,-3.3],[-39.6,-16.9],[-37.6,-14.9],[-33.1,-19.5],[-27.7,-14.3]],"p":[{"r":[[-3.9,4.0],[-2.7,5.0],[-9.2,11.5],[-10.4,10.5],[-13.4,13.2],[-3.9,22.2],[4.6,14.0],[12.8,21.7],[19.3,15.2],[37.8,33.0],[42.1,29.5],[48.1,34.7],[64.8,17.5],[23.6,-21.5],[4.6,-2.0],[2.8,-3.3]],"b":0.0,"t":10.5},{"r":[[48.1,34.7],[64.8,17.5],[23.6,-21.5],[6.8,-5.0],[42.1,29.5]],"b":9.9,"t":40.2},{"r":[[-39.7,-16.8],[-61.7,5.7],[-56.9,10.5],[-52.2,5.7],[-46.9,11.0],[-42.2,5.7],[-36.7,11.0],[-32.4,6.2],[-27.2,11.0],[-22.9,6.7],[-18.2,11.0],[-13.9,6.7],[-9.2,11.5],[-2.7,5.0],[-25.4,-16.8],[-27.7,-14.5],[-33.2,-19.3],[-37.9,-15.0]],"b":0.0,"t":150.0},{"r":[[0.3,-5.0],[-3.2,-8.0],[5.6,-16.8],[0.3,-22.8],[-8.7,-13.3],[-21.7,-25.8],[-28.9,-18.8],[-25.9,-16.3],[-25.4,-16.8],[-6.2,1.5]],"b":0.0,"t":10.5}]};
D.keppel = {"A":[1.27441,103.842238],"r":[[-52.6,23.7],[-64.5,17.2],[-40.6,-36.8],[-24.5,-29.7],[-23.6,-31.6],[-0.8,-24.4],[18.3,-20.7],[25.3,-19.3],[72.5,-9.4],[66.9,3.5],[59.2,22.6],[-1.6,23.3],[-14.5,23.6]],"p":[{"r":[[-52.6,23.6],[-14.4,23.6],[-8.9,11.1],[-61.9,11.1],[-64.6,17.1]],"b":0.0,"t":109.5},{"r":[[59.6,-12.2],[59.6,2.1],[66.6,3.6],[72.6,-9.7]],"b":0.0,"t":7.2},{"r":[[59.6,2.1],[59.6,-12.2],[25.6,-19.2],[19.6,-6.7]],"b":0.0,"t":7.2},{"r":[[-61.9,11.1],[-8.9,11.1],[1.6,-13.2],[-0.6,-24.4],[-23.4,-31.4],[-24.6,-29.7],[-40.6,-36.9]],"b":0.0,"t":109.5},{"r":[[21.1,-19.9],[15.4,-7.7],[19.1,-6.9],[24.6,-19.2]],"b":0.0,"t":6.6},{"r":[[1.6,-13.2],[0.4,-10.2],[19.6,-6.7],[25.6,-19.2],[-0.6,-24.4]],"b":6.6,"t":10.5},{"r":[[9.6,-8.7],[15.6,-20.9],[0.1,-24.2],[2.4,-13.2],[1.1,-10.2]],"b":0.0,"t":6.6}]};
D.anson = {"A":[1.275346,103.845645],"r":[[-39.6,-13.6],[-45.3,-6.8],[-4.7,25.5],[1.6,29.0],[5.3,28.6],[8.6,28.2],[13.1,24.4],[40.1,-10.8],[30.1,-21.1],[-9.5,-16.9]],"p":[{"r":[[-33.0,0.8],[-21.8,-0.5],[-20.5,7.8],[19.0,3.8],[18.2,-4.0],[31.5,-5.2],[30.2,-18.7],[-34.3,-11.7]],"b":0.0,"t":68.0}]};
D.ct = {"A":[1.28622,103.843495],"r":[[24.7,-17.8],[23.0,-19.6],[24.2,-21.3],[23.0,-22.1],[29.0,-29.6],[6.2,-48.6],[-53.5,23.2],[-41.5,32.7],[-39.8,30.2],[-29.0,38.4],[-23.0,30.7],[-18.8,34.4]],"p":[]};
D.ot = {"A":[1.28622,103.843495],"r":[[-11.0,42.2],[-1.0,50.4],[56.5,-17.8],[46.2,-26.1]],"p":[]};
D.scall = {"A":[1.28622,103.843495],"r":[[56.5,-17.8],[46.2,-26.1],[33.7,-10.8],[23.0,-19.6],[24.2,-21.3],[23.0,-22.1],[29.0,-29.6],[6.2,-48.6],[-53.5,23.2],[-41.5,32.7],[-39.8,30.2],[-29.0,38.4],[-23.0,30.7],[-1.0,50.4]],"p":[]};
D.opb = {"A":[1.282907,103.839822],"r":[[56.2,0.2],[54.9,0.8],[54.6,0.3],[51.8,1.6],[51.7,1.3],[51.0,1.6],[48.7,2.7],[48.1,1.8],[47.2,2.3],[45.1,-1.0],[45.4,-1.3],[41.8,-5.7],[40.2,-4.5],[39.6,-5.2],[37.5,-3.4],[40.0,-0.4],[40.9,-1.0],[43.6,3.2],[37.4,6.2],[37.7,7.1],[36.4,7.7],[35.4,5.9],[33.9,3.6],[30.9,0.2],[28.6,-1.8],[26.3,-3.2],[22.8,3.3],[16.4,11.8],[18.0,13.0],[12.6,18.7],[9.5,21.1],[5.2,23.4],[0.3,25.8],[-4.7,27.3],[-9.8,28.4],[-10.0,27.4],[-16.6,28.2],[-21.1,28.2],[-24.6,28.0],[-29.5,27.2],[-34.0,26.3],[-38.5,24.8],[-43.1,22.9],[-47.8,20.2],[-52.1,17.2],[-51.0,16.1],[-50.3,16.7],[-49.5,15.9],[-49.7,15.8],[-48.7,14.5],[-48.4,14.7],[-47.4,13.5],[-47.0,13.7],[-44.7,10.5],[-42.5,12.2],[-43.1,13.0],[-35.7,16.7],[-34.3,13.5],[-38.8,11.3],[-39.1,11.9],[-44.3,8.4],[-42.3,6.2],[-43.8,5.0],[-44.9,3.8],[-43.6,2.7],[-43.8,2.4],[-42.6,1.4],[-42.3,1.6],[-41.8,0.9],[-42.4,0.0],[-41.2,-0.8],[-37.5,2.2],[-36.8,2.6],[-34.1,4.4],[-30.8,-3.2],[-23.0,-13.0],[-14.4,-20.4],[-7.4,-24.7],[-0.3,-27.0],[3.0,-27.7],[7.7,-28.3],[13.9,-28.1],[19.0,-27.8],[23.9,-26.8],[23.7,-25.7],[28.1,-24.4],[32.8,-22.5],[40.7,-18.0],[45.9,-14.0],[50.3,-9.1],[53.7,-4.5]],"p":[{"r":[[-42.2,0.1],[-41.7,0.6],[-44.7,3.6],[-42.2,6.1],[-44.0,8.3],[-39.2,11.8],[-38.7,11.3],[-34.5,13.8],[-35.7,16.6],[-43.0,13.1],[-42.2,11.8],[-44.7,10.8],[-47.0,13.8],[-51.7,17.3],[-38.7,25.1],[-24.5,28.1],[-10.0,27.3],[-10.0,28.6],[0.0,25.6],[12.8,18.6],[9.0,14.3],[7.8,15.6],[6.0,13.1],[-1.7,17.3],[-2.2,16.1],[-1.0,14.8],[-4.0,10.8],[-1.7,9.6],[-1.0,10.8],[3.0,7.8],[-3.0,1.3],[-10.7,5.3],[-10.0,6.6],[-16.0,7.8],[-14.7,17.8],[-16.5,17.8],[-16.5,14.3],[-23.2,14.3],[-22.5,17.8],[-24.5,17.3],[-22.5,9.6],[-23.2,9.6],[-23.2,7.8],[-34.0,4.3],[-41.0,-1.2]],"b":0.0,"t":129.3},{"r":[[-14.2,-20.7],[-23.2,-12.9],[-31.0,-2.9],[-34.0,4.3],[-29.2,6.6],[-16.5,-9.9],[-6.5,-17.7],[-5.7,-16.4],[-3.5,-17.7],[-7.7,-24.9]],"b":125.4,"t":129.3},{"r":[[13.3,6.6],[6.0,13.1],[7.8,15.6],[9.0,14.3],[12.8,18.6],[18.0,13.1],[16.3,11.8],[22.8,3.1],[27.0,-4.7],[26.3,-5.2],[31.8,-11.2],[30.5,-12.4],[28.8,-8.9],[23.5,-11.7],[24.5,-14.7],[23.5,-15.4],[19.8,-6.4]],"b":125.4,"t":129.3},{"r":[[-7.7,-24.9],[-3.5,-17.7],[2.5,-20.2],[11.5,-20.7],[10.8,-18.2],[9.8,-18.2],[10.8,-17.2],[10.8,-12.9],[8.5,-12.9],[7.8,-14.2],[3.0,-13.7],[5.0,-5.9],[13.8,-6.4],[14.5,-6.9],[19.8,-6.4],[23.5,-15.4],[24.5,-14.7],[23.5,-11.7],[28.8,-8.9],[30.5,-12.4],[31.8,-11.2],[26.3,-5.2],[27.0,-4.7],[26.3,-3.4],[31.3,0.1],[36.5,7.8],[37.8,7.3],[37.0,6.1],[43.8,3.1],[40.8,-1.2],[40.0,-0.4],[37.8,-3.4],[39.5,-5.2],[40.0,-4.7],[42.0,-5.9],[47.3,2.6],[47.8,1.8],[48.5,2.6],[56.3,0.1],[53.8,-4.7],[46.0,-14.2],[33.0,-22.4],[24.0,-25.4],[24.0,-26.7],[7.8,-28.4],[-0.5,-27.2]],"b":0.0,"t":129.3}]};
D.yh1 = {"A":[1.28492,103.843519],"r":[[1.5,-24.5],[8.1,-18.8],[20.4,-8.1],[24.3,-4.8],[-1.5,24.5],[-5.9,20.7],[-12.3,15.1],[-24.2,4.8],[-4.4,-17.8]],"p":[{"r":[[8.3,-18.6],[2.3,-12.1],[7.8,-7.3],[-12.4,15.2],[-5.9,20.4],[2.3,10.9],[7.1,15.2],[13.8,7.4],[9.6,3.9],[20.3,-8.1]],"b":16.5,"t":20.4},{"r":[[7.3,14.9],[13.6,7.4],[9.6,3.9],[20.1,-7.8],[8.6,-18.6],[2.6,-12.1],[7.8,-7.3],[-12.4,15.2],[-5.9,20.4],[2.3,10.9]],"b":0.0,"t":16.5}]};
D.yh2 = {"A":[1.28492,103.843519],"r":[[1.5,-24.5],[8.1,-18.8],[20.4,-8.1],[24.3,-4.8],[-1.5,24.5],[-5.9,20.7],[-12.3,15.1],[-24.2,4.8],[-4.4,-17.8]],"p":[{"r":[[24.6,-5.1],[1.8,-24.6],[-24.4,4.9],[-1.2,24.7]],"b":0.0,"t":10.5}]};
D.comb = {"A":[1.280398,103.833742],"r":[[-32.1,7.5],[-40.0,21.0],[0.9,44.7],[39.8,-21.6],[-0.3,-44.8],[-7.4,-32.7]],"p":[{"r":[[-40.3,20.9],[0.9,44.7],[39.7,-21.8],[-0.3,-44.8],[-7.3,-32.3],[18.2,-18.1],[-5.6,22.7],[-31.8,7.4]],"b":0.0,"t":10.5}]};
D.acad = {"A":[1.281681,103.835538],"r":[[49.2,-31.9],[-1.3,-59.4],[-19.4,-26.6],[-27.9,-11.1],[-34.3,0.6],[-36.7,-0.7],[-47.9,19.7],[-45.5,21.0],[-52.3,33.4],[-1.8,60.8],[22.7,16.4],[31.2,0.9],[60.5,-24.3]],"p":[{"r":[[-28.2,-11.0],[-52.0,33.5],[-2.0,60.8],[22.5,16.3]],"b":0.0,"t":43.5},{"r":[[-36.5,-0.7],[-48.0,20.0],[-45.5,21.0],[-34.2,0.3]],"b":3.3,"t":7.2},{"r":[[-45.7,20.5],[-35.0,0.0],[-36.7,-0.7],[-47.7,19.5],[-47.7,20.0]],"b":0.0,"t":3.3},{"r":[[-28.2,-11.0],[22.5,16.3],[31.0,1.0],[-19.2,-26.2]],"b":16.5,"t":23.7},{"r":[[-21.0,-7.5],[15.3,12.3],[23.8,-3.2],[-12.7,-22.7]],"b":39.6,"t":43.5},{"r":[[-21.0,-7.5],[15.3,12.3],[23.8,-3.2],[-12.7,-22.7]],"b":0.0,"t":17.1},{"r":[[23.3,-2.5],[-13.0,-22.0],[-20.7,-7.7],[15.8,11.5]],"b":0.0,"t":39.6},{"r":[[31.0,1.0],[60.3,-24.0],[49.5,-31.7]],"b":0.0,"t":3.9},{"r":[[31.0,1.0],[49.5,-31.7],[-1.2,-59.5],[-19.2,-26.2]],"b":0.0,"t":43.5}]};
D.nhcs = {"A":[1.278574,103.836113],"r":[[31.9,53.1],[22.1,47.4],[5.7,37.8],[-29.2,17.5],[-57.4,0.5],[-50.9,-10.8],[-39.7,-29.6],[-31.4,-44.3],[-25.7,-41.0],[-20.6,-49.9],[-18.1,-48.4],[-16.6,-47.6],[46.5,-11.4],[41.4,-2.5],[47.2,0.9],[38.4,15.9],[49.9,22.6]],"p":[{"r":[[-31.5,16.0],[-29.0,12.0],[-28.2,11.2],[-27.2,11.0],[-26.2,11.0],[-25.5,11.2],[9.0,31.7],[9.8,32.5],[10.3,33.2],[10.3,34.2],[10.0,35.2],[8.0,39.0],[32.0,53.0],[49.8,22.7],[-39.7,-29.5],[-57.5,0.7]],"b":0.0,"t":40.2},{"r":[[3.5,36.5],[4.3,35.0],[-26.0,17.0],[-27.0,18.5]],"b":0.0,"t":40.2},{"r":[[-27.0,18.5],[-26.0,17.0],[4.3,35.0],[3.5,36.5],[8.0,39.0],[10.0,35.2],[10.3,34.2],[10.3,33.2],[9.8,32.5],[9.0,31.7],[-25.5,11.2],[-26.2,11.0],[-27.2,11.0],[-28.2,11.2],[-29.0,12.0],[-31.5,16.0]],"b":4.2,"t":40.2},{"r":[[47.0,0.7],[-31.2,-44.3],[-39.7,-29.5],[38.5,16.2]],"b":0.0,"t":23.7},{"r":[[-20.5,-49.8],[-26.0,-40.8],[41.5,-2.3],[46.3,-11.0]],"b":0.0,"t":23.7}]};
D.nccs = {"A":[1.281208,103.837736],"r":[[-6.7,-50.9],[-16.0,-35.1],[-11.3,-32.4],[-14.4,-27.1],[-16.3,-24.1],[-23.0,-28.2],[-38.3,-3.9],[-45.9,9.6],[-41.0,18.1],[-23.9,34.0],[-0.7,50.7],[24.4,34.0],[38.5,11.5],[35.1,9.3],[38.4,3.5],[40.6,-0.3],[50.7,5.6],[52.8,1.9],[54.9,-1.6],[58.1,0.3],[64.0,-9.9]],"p":[{"r":[[-31.8,-0.0],[-38.3,10.5],[-38.1,18.0],[-38.1,19.0],[-38.8,20.0],[-23.8,34.0],[-0.6,50.7],[24.4,34.0],[8.4,24.0],[5.4,28.7],[-29.3,6.7],[-26.8,3.2]],"b":0.0,"t":36.9},{"r":[[-16.8,-24.3],[-31.8,-0.0],[-26.8,3.2],[-29.3,6.7],[5.4,28.7],[8.4,24.0],[24.4,34.0],[38.9,11.5],[35.2,9.2],[38.2,3.7],[-14.3,-27.0],[-16.1,-24.0]],"b":0.0,"t":79.8},{"r":[[-31.8,-0.0],[-16.8,-24.3],[-23.3,-28.3],[-38.1,-4.0]],"b":4.2,"t":79.8},{"r":[[38.2,3.7],[40.7,-0.3],[50.7,5.5],[54.9,-1.5],[57.9,0.2],[63.9,-9.8],[-6.6,-50.8],[-16.1,-35.3],[-11.3,-32.3],[-14.3,-27.0]],"b":0.0,"t":69.9},{"r":[[-45.6,9.5],[-43.8,11.5],[-43.8,13.2],[-41.1,18.0],[-38.8,20.0],[-38.1,19.0],[-38.1,18.0],[-38.3,10.5],[-31.8,-0.0],[-38.1,-4.0]],"b":4.2,"t":36.9}]};
D.ctp = {"A":[1.285208,103.844931],"r":[[-11.8,73.1],[12.7,32.7],[15.1,34.2],[37.7,-2.6],[38.7,-4.2],[36.3,-5.8],[54.5,-36.0],[55.1,-38.9],[55.6,-42.0],[55.7,-45.4],[55.4,-48.5],[54.7,-51.7],[53.3,-54.9],[52.0,-57.5],[50.6,-60.1],[48.4,-62.6],[46.5,-64.4],[43.8,-66.6],[40.6,-68.1],[37.5,-69.4],[33.6,-70.6],[29.6,-70.9],[26.6,-70.9],[23.0,-70.3],[19.4,-69.0],[16.4,-67.6],[14.2,-66.0],[10.3,-62.7],[8.4,-60.4],[0.8,-48.0],[-5.2,-38.3],[-17.3,-18.6],[-16.8,-18.2],[-13.6,-15.3],[-15.3,-12.3],[-14.6,-6.1],[-17.3,-5.5],[-18.8,-7.7],[-20.7,-9.4],[-22.6,-10.7],[-25.0,-11.3],[-27.3,-11.3],[-29.7,-11.1],[-31.6,-10.4],[-33.8,-8.9],[-35.3,-6.7],[-36.4,-4.6],[-36.7,-2.2],[-39.8,-0.0],[-42.5,2.4],[-45.0,5.2],[-46.8,7.4],[-48.5,9.9],[-49.7,12.1],[-50.7,14.9],[-52.0,17.9],[-52.5,20.6],[-53.4,23.6],[-54.0,26.7],[-54.3,30.2],[-57.4,31.0],[-58.2,28.7],[-65.2,30.4],[-62.8,43.0],[-56.1,41.9],[-56.2,40.3],[-53.0,39.4],[-52.4,41.6],[-51.8,43.9],[-50.9,45.9],[-50.0,47.7],[-49.0,49.9]],"p":[{"r":[[-12.1,-11.7],[-3.1,25.0],[11.2,34.0],[20.7,18.5],[17.7,6.0],[32.2,3.8],[29.2,-8.2],[23.7,-6.5],[23.7,-5.2],[15.4,-3.5],[11.9,-18.2],[-3.1,-26.5]],"b":16.0,"t":118.0},{"r":[[-12.1,-11.7],[-3.1,25.0],[11.2,33.8],[20.7,18.5],[17.7,6.0],[31.7,3.8],[31.9,3.3],[29.2,-8.0],[23.9,-6.5],[23.7,-5.2],[15.4,-3.5],[11.7,-18.2],[-3.3,-26.2]],"b":0.0,"t":16.0}]};
D.hl571 = {"A":[1.284568,103.845697],"r":[[10.2,23.8],[4.2,33.3],[49.7,61.0],[55.4,51.0],[46.7,45.5],[45.4,46.8],[42.4,45.5],[43.7,43.8],[22.7,31.3],[21.4,33.3],[19.2,32.0],[20.2,30.3]],"p":[]};
D.hl572 = {"A":[1.284568,103.845697],"r":[[-60.3,-21.5],[-61.6,-19.7],[-62.6,-20.2],[-68.6,-10.7],[-12.6,23.0],[-6.6,14.3],[-7.8,13.5],[-6.6,11.3],[-15.6,5.3],[-16.8,7.0],[-20.3,5.3],[-19.1,3.5],[-48.3,-14.2],[-49.6,-12.0],[-52.6,-14.2],[-51.3,-16.0]],"p":[]};
D.hl573 = {"A":[1.284568,103.845697],"r":[[76.4,18.3],[81.7,9.5],[36.4,-18.5],[30.4,-9.0],[39.9,-3.0],[41.2,-4.7],[43.7,-3.0],[42.9,-1.7],[63.9,10.5],[65.2,8.8],[67.4,10.5],[66.2,12.5]],"p":[]};
D.hl574 = {"A":[1.284568,103.845697],"r":[[12.4,-19.7],[13.7,-21.5],[14.9,-20.7],[20.9,-30.2],[-35.3,-64.7],[-40.6,-55.2],[-40.1,-54.7],[-41.1,-52.2],[-31.6,-46.2],[-30.3,-48.7],[-27.6,-46.2],[-28.6,-44.5],[0.7,-27.2],[1.7,-29.2],[4.7,-27.2],[3.7,-25.0]],"p":[]};
D.hlpe = {"A":[1.284568,103.845697],"r":[[32.2,-30.0],[29.2,-25.0],[33.9,-22.0],[16.2,8.3],[10.7,4.8],[6.4,11.8],[11.9,14.8],[2.9,29.0],[-2.1,25.8],[-3.6,28.3],[1.7,31.3],[-9.6,50.3],[21.4,68.8],[30.9,53.3],[49.7,64.5],[87.2,3.0]],"p":[]};
D.hlpw = {"A":[1.284568,103.845697],"r":[[-8.6,25.5],[-7.1,22.8],[-9.6,21.3],[-3.6,11.8],[-1.1,13.3],[13.9,-11.2],[-55.1,-51.7],[-89.1,4.0],[-46.6,29.5],[-35.8,11.8],[-13.1,25.5],[-11.8,23.8]],"p":[]};
D.ppc = {"A":[1.285777,103.843982],"r":[[-62.1,26.2],[-60.4,24.7],[-63.8,21.7],[-57.6,14.9],[-44.3,0.1],[15.3,-68.0],[56.7,-32.2],[65.8,-24.4],[55.8,-13.0],[6.1,43.7],[-15.8,67.5],[-63.2,27.4]],"p":[{"r":[[14.0,9.7],[42.3,-23.6],[13.5,-46.6],[-14.0,-13.6]],"b":16.5,"t":40.2},{"r":[[-15.7,67.7],[6.3,43.4],[-44.5,0.2],[-64.0,21.4],[-60.5,24.4],[-63.5,27.4]],"b":16.5,"t":99.0},{"r":[[-15.7,67.7],[65.5,-24.1],[15.3,-68.1],[-64.0,21.4],[-60.5,24.4],[-63.5,27.4]],"b":0.0,"t":17.1}]};
D.maxch = {"A":[1.277281,103.846378],"r":[[-8.9,19.8],[-7.1,32.0],[18.6,29.8],[17.9,24.5],[26.4,23.8],[28.6,19.8],[28.6,15.0],[25.1,9.0],[-12.6,-37.2],[-31.1,-24.2],[-0.6,16.8],[6.6,16.0],[6.6,18.0]],"p":[]};
D.mnd = {"A":[1.27881,103.84586],"r":[[-22.5,-46.5],[-40.4,-32.4],[-11.2,4.0],[18.5,41.2],[36.3,27.2],[44.9,20.4],[36.0,9.3],[27.4,16.1],[11.3,-4.0],[19.4,-10.4],[14.6,-16.4],[8.3,-24.2],[0.3,-17.9]],"p":[{"r":[[19.5,-10.4],[8.0,-24.2],[0.3,-17.7],[-22.2,-46.7],[-40.2,-32.4],[18.3,41.1],[36.3,27.3],[11.0,-3.9]],"b":6.6,"t":66.6},{"r":[[-22.2,-46.7],[-40.2,-32.4],[18.3,40.8],[36.0,27.3],[11.0,-3.9],[19.3,-10.4],[19.3,-10.7],[8.3,-23.9],[0.3,-17.7]],"b":0.0,"t":6.6}]};
D.mndb = {"A":[1.278875,103.846509],"r":[[-19.4,-3.5],[-21.7,0.3],[-9.4,18.5],[7.6,17.5],[15.8,10.3],[20.1,-5.2],[5.1,-24.0]],"p":[]};
D.kreta = {"A":[1.281307,103.842716],"r":[[27.9,0.9],[-15.1,-23.3],[-27.8,-1.3],[15.4,23.2]],"p":[]};
D.tbp = {"A":[1.286423,103.827293],"r":[[-88.0,-31.2],[-93.5,-7.6],[-90.3,-6.9],[-94.1,11.8],[-92.5,12.2],[-49.7,21.9],[14.7,36.5],[19.3,13.7],[22.7,14.5],[23.7,14.8],[29.4,16.0],[32.5,16.7],[30.5,26.5],[43.0,29.0],[44.1,23.5],[57.7,26.2],[58.6,21.8],[62.9,22.7],[65.0,23.1],[67.1,23.5],[66.5,26.6],[91.8,32.1],[94.0,22.0],[97.8,22.8],[102.0,23.6],[102.0,2.1],[102.0,-6.8],[100.5,-7.5],[100.9,-9.4],[101.3,-11.1],[99.1,-11.6],[75.6,-16.6],[75.2,-15.0],[73.0,-5.7],[70.9,-6.1],[68.8,-6.6],[65.4,-7.2],[65.9,-9.5],[62.2,-10.2],[63.7,-17.5],[64.2,-20.1],[60.5,-20.8],[51.5,-22.6],[51.0,-20.2],[49.5,-12.9],[46.2,-13.6],[45.8,-11.6],[38.5,-13.0],[35.8,-13.6],[36.9,-17.3],[30.4,-18.7],[29.3,-18.9],[25.6,-19.7],[26.2,-22.5],[12.2,-25.5],[12.4,-28.2],[-3.8,-31.7],[-86.9,-31.1]],"p":[{"r":[[94.1,21.9],[101.9,23.6],[101.9,-6.6],[100.9,-7.1]],"b":6.6,"t":53.4},{"r":[[66.6,26.6],[91.9,31.9],[94.1,21.9],[101.9,23.6],[101.9,-6.6],[100.9,-7.1],[101.4,-11.4],[75.6,-16.6],[73.4,-5.4],[68.6,-6.6],[63.1,22.4],[67.4,23.6]],"b":0.0,"t":7.2},{"r":[[66.6,26.6],[91.9,31.9],[101.4,-11.4],[75.6,-16.6]],"b":6.6,"t":60.0},{"r":[[68.6,-6.6],[63.1,22.4],[67.4,23.6],[73.4,-5.4]],"b":6.6,"t":53.4},{"r":[[30.4,26.6],[42.9,28.9],[44.1,23.6],[57.9,25.9],[58.4,21.9],[63.1,22.4],[68.6,-6.6],[65.6,-7.1],[66.1,-9.6],[61.9,-10.1],[64.4,-20.4],[51.1,-22.6],[49.4,-13.1],[46.4,-13.9],[45.9,-11.4],[38.6,-13.1]],"b":0.0,"t":7.2},{"r":[[-93.4,-7.9],[-90.4,-6.6],[-93.9,11.6],[14.9,36.6],[19.6,13.6],[32.6,16.4],[38.6,-13.1],[35.6,-13.9],[36.9,-17.4],[25.6,-19.6],[26.1,-22.6],[12.4,-25.6],[12.4,-28.1],[-3.6,-31.6],[-87.9,-30.9]],"b":0.0,"t":13.8}]};
D.stt = {"A":[1.273277,103.828166],"r":[[17.2,-21.0],[-29.8,0.3],[-19.8,22.3],[27.5,0.3],[24.0,-7.5],[30.5,-10.2],[27.5,-17.5],[20.2,-14.5]],"p":[]};
D.qtg = {"A":[1.28375,103.834559],"r":[[32.5,3.1],[-26.8,-16.9],[-30.3,-14.7],[-31.5,-9.9],[-29.8,-3.9],[-26.8,-0.4],[27.7,17.3]],"p":[]};
D.hlrel = {A:[1.284568,103.845697], r:[[-33.1,-68.8],[-23.9,-63.3],[15.2,-40.0],[87.0,2.8],[49.8,64.4],[30.9,53.2],[21.5,68.7],[-9.7,50.1],[1.5,31.5],[-11.9,23.4],[-13.2,25.6],[-36.0,12.0],[-46.5,29.3],[-88.7,4.2],[-76.4,-16.1],[-50.0,-59.8],[-41.6,-54.7],[-34.5,-66.3]]};  // OSM r2304417 outer w47298535
D.tbm = {A:[1.284871,103.832345], r:[[-44.9,-36.4],[-42.7,34.8],[-28.6,34.4],[-34.2,38.3],[-37.3,43.8],[-36.9,50.1],[-34.3,55.1],[-30.5,57.9],[-26.2,59.0],[-21.6,58.5],[-19.7,57.7],[-16.3,55.8],[-13.4,51.7],[-12.5,47.7],[-12.5,44.8],[-13.3,41.9],[-8.2,48.3],[52.8,1.1],[52.2,0.4],[54.4,-1.6],[51.9,-4.4],[55.8,-7.8],[55.3,-8.4],[57.5,-10.4],[57.6,-12.1],[60.3,-15.2],[61.5,-18.4],[62.0,-22.0],[61.1,-25.8],[59.3,-29.0],[56.9,-31.3],[54.4,-32.8],[52.0,-33.5],[49.7,-33.4],[48.7,-34.6],[45.6,-34.6],[45.6,-35.9],[40.4,-35.8],[40.3,-38.5],[8.9,-37.8],[4.8,-37.7]], h:[[-20.0,-11.4],[-18.9,18.2],[-17.4,21.0],[-15.5,22.0],[-12.5,22.7],[-9.6,21.5],[4.4,10.5],[0.0,5.1],[-0.6,3.5],[-0.2,1.8],[1.1,0.5],[3.0,0.5],[4.6,1.5],[8.9,6.9],[30.8,-10.4],[31.6,-12.6],[30.6,-14.3],[28.9,-15.3],[8.1,-14.8],[8.3,-9.5],[7.8,-7.9],[6.2,-6.8],[4.7,-6.8],[3.3,-7.7],[2.5,-9.3],[2.4,-14.6],[-17.1,-14.1],[-18.9,-13.0]]};  // OSM r21297472: outer w172241893, inner (court) w172241921
// ================= Altez, 16 Enggor Street (sgaltez, hero) =================
// Wikipedia / CTBUH: residential tower by RSP Architects for Far East Organization, 2014, 62 storeys, 250 m (architectural top),
// all-concrete; Woh Hup: one 62-storey 280-unit tower with commercial space on the first storey. OSM: tower part w393100852
// (62 levels, glass #525b60, from 10 m to 250 m) on the 10 m podium w172023443 (metal #5d6166). The neighbour to the east is
// Skysuites@Anson (w393100851 / w172023451, not modelled) - the plan stays on Altez's own footprint.
// The facade composition, crown and podium-roof layout could not be checked against a readable source (photos only): modelled as a
// dark glass curtain wall with light slab edges, a glazed shop base, a plain parapet crown with roof plant - generic, estimated.
{
const A0 = D.altez.A, T0 = D.altez.p[0].r, P0 = D.altez.p[1].r, C0 = pcen(T0), [TW, POD] = shAll([T0, P0], C0);
K50('sgaltez', 'Altez', 'Altez', A0, C0, {r:47, h:250, lt:{m:1, c:'#e8f0ff', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
  const GL = GLs('#4f5a62', 3.87, 1.5), MET = {c:'#5d6166', m:0, lk:0.25}, EDGE = {c:'#c9cdd0', m:0, lk:0.3}, MUL = {c:'#7d878d', m:0, lk:0.2},
    DECK = {c:'#7b8f6a', m:0, lk:0.1}, SHOP = {c:'#b6c4c8', m:0, glow:'#ffe6c0', gk:0.85};
  const Y0 = 10, YR = 246, YT = 250;
  // podium: dark metal cladding, glazed shopfronts on the first storey, planted deck
  foundP(B.p(FOUND50), POD); wallP(B.p(MET), POD, 4.6, Y0); wallP(B.p(SHOP), offP(POD, 0.8), 0.3, 4.6); capP(B.p(ROOF50), offP(POD, 0.8), 4.6);
  bandAtP(B.p(MET), POD, 4.4, 0.6, 0.25); capP(B.p(DECK), POD, Y0); wallP(B.p(MET), offP(POD, -0.15), Y0, Y0 + 1.1);
  finsP(B.p(MUL), POD, 5, Y0, 1.6, 0.15, 0.12);
  for (const [x, z] of alongP(offP(POD, 2.5), 7)) if (!inPolyS(offP(TW, -1.5), x, z)) treeP(B.p('#5b4a3a'), B.p({c:'#4f7a3e', m:0, lk:0.1}), x, Y0, z, 0.8, R);
  // tower: glass with mullions and light slab edges every storey
  wallP(B.p(GL), TW, Y0, YR);
  facadeP(B, TW, Y0, YR, {mul:MUL, bay:1.5, fd:0.18, fw:0.05, bands:false});
  ribP(B.p(EDGE), TW, Y0 + 3.87, YR, 3.87, 0.35, 0.12);
  bandAtP(B.p(EDGE), TW, Y0, 0.8, 0.2);
  // crown: parapet screen and roof plant
  capP(B.p(ROOF50), TW, YR); wallP(B.p(MUL), offP(TW, -0.1), YR, YT);
  finsP(B.p(EDGE), offP(TW, -0.1), YR, YT, 1.5, 0.2, 0.1);
  blkP(B, scP(TW, 0.55), YR, YR + 3, MECH50, ROOF50);
  lavP(B.p(LAV50), TW, YT);
  B.flush(g); return g; }});
}
// ================= State Courts Towers, 1 Havelock Square (sgstatecourts, hero) =================
// Wikipedia (State Courts of Singapore) and BD+C ("Singapore's new courthouse set for all to see"): design competition 2011 won by
// Serie Architects + Multiply Architects (with CPG), completed 2019; 35 storeys, 178 m, 53 courtrooms and 54 hearing chambers.
// Two slender buildings - the Court Tower in front, the Office Tower behind - joined by 39 link bridges. The Court Tower is an open
// frame of "court trays" of varying heights with no glazed facade round it; on each tray stand courtroom boxes clad in pigmented
// precast panels 5-12 m high, coloured to match the tiled roofs of the Chinatown shophouses, with a garden terrace round them. The
// Office Tower has a horizontal grid facade, wider glazing in the middle and narrower over the service core; roof garden and sky
// terraces. Plans: OSM w699163979 "Court Tower", w699163978 "Office Tower", outline w699163980 (reref SC/lm50/sg50b/ref_sg50b_1.json;
// the target row's w44414588 is the conserved 1975 State Courts building 100 m to the south-west, left to the app). Tray levels,
// box sizes and the bridge positions follow the described system but are not surveyed (estimates). No signs or text.
{
const A0 = D.scall.A, C0 = [0.2, 2.7], AX = -49.87*PI/180;
K50('sgstatecourts', '国家法院', 'State Courts', A0, C0, {r:66, h:178, lt:{m:1, c:'#fff0d8', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB(), f = frame(-C0[0], -C0[1], AX), R = LMCTX.rng;
  const FRM = {c:'#eceeec', m:0, lk:0.45}, TRAY = {c:'#e4e6e3', m:0, lk:0.4, glow:'#fff1d6', gk:0.25}, CORE = {c:'#dfe1df', m:0, lk:0.4},
    GL = GLs('#5d7480', 4.6, 1.6), GLL = {c:'#9fb2b8', m:0, glow:'#ffe8c6', gk:0.7}, GRN = {c:'#5f8a45', m:0, lk:0.1},
    BX = [{c:'#b5603f', m:0, lk:0.3}, {c:'#a3543a', m:0, lk:0.3}, {c:'#c47a52', m:0, lk:0.3}], RIB = {c:'#8f4a33', m:0, lk:0.25};
  const box = (o, u0, u1, y0, y1, v0, v1) => bxF(o, f, u0, u1, y0, y1, v0, v1);
  const CU0 = -52.0, CU1 = 41.2, CV0 = -26.4, CV1 = 3.0;      // court tower
  const OU0 = -39.3, OU1 = 50.0, OV0 = 18.6, OV1 = 31.7;      // office tower
  const YT = 178;
  foundP(B.p(FOUND50), polyF(f, rectO(CU0, CU1, CV0, CV1)), 0.3); foundP(B.p(FOUND50), polyF(f, rectO(OU0, OU1, OV0, OV1)), 0.3);
  foundP(B.p(FOUND50), polyF(f, rectO(30, CU1, CV1, OV0)), 0.3);
  // ---- Court Tower: glazed base, open frame, trays with courtroom boxes and gardens ----
  wallP(B.p(LOB50), polyF(f, rectO(CU0 + 3, CU1 - 2, CV0 + 3, CV1 - 1)), 0.3, 11.5);
  const TR = [11.5, 22.5, 33.5, 43.5, 55.5, 66.5, 77.0, 88.5, 99.5, 110.5, 121.0, 132.5, 143.5, 154.0, 165.5, 175.5];
  for (const y of TR){ box(B.p(TRAY), CU0, CU1, y, y + 0.9, CV0, CV1); }
  // perimeter frame: slender columns on both long faces and the ends
  for (let k = 0; k <= 10; k++){ const u = CU0 + 0.4 + k*(CU1 - CU0 - 0.8)/10; for (const v of [CV0 + 0.4, CV1 - 0.4]){ const p = f(u, 0, v); segP(B.p(FRM), [p[0], 0.3, p[2]], [p[0], YT, p[2]], 0.45, 6); } }
  for (const u of [CU0 + 0.4, CU1 - 0.4]) for (const v of [-19, -12.6, -5.8]){ const p = f(u, 0, v); segP(B.p(FRM), [p[0], 0.3, p[2]], [p[0], YT, p[2]], 0.4, 6); }
  // courtroom boxes: 3-4 per tray, 5-12 m tall, three precast tones, vertical ribs; garden strip and small trees on the tray edge
  for (let t = 0; t < TR.length - 1; t++){
    const y0 = TR[t] + 0.9, gap = TR[t + 1] - y0 - 0.6; let u = CU0 + 3 + R()*4;
    while (u < CU1 - 12){
      const w = 12 + R()*10, u1 = Math.min(u + w, CU1 - 3), h = Math.min(gap, 5 + R()*7), v0 = CV0 + 4 + R()*3, v1 = CV1 - 3 - R()*3;
      const P = polyF(f, rectO(u, u1, v0, v1)), C = BX[Math.floor(R()*3)];
      wallP(B.p(C), P, y0, y0 + h); capP(B.p(C), P, y0 + h);
      finsP(B.p(RIB), P, y0, y0 + h, 1.2, 0.18, 0.25);
      u = u1 + 4 + R()*6;
    }
    // planting along both long edges of the tray
    for (const v of [CV0 + 1.6, CV1 - 1.6]){ box(B.p(GRN), CU0 + 1, CU1 - 1, y0, y0 + 0.6, v - 0.9, v + 0.9);
      for (let k = 0; k < 4; k++){ const p = f(CU0 + 6 + R()*(CU1 - CU0 - 12), 0, v); treeP(B.p('#5b4a3a'), B.p(GRN), p[0], y0 + 0.6, p[2], 0.6, R); } }
  }
  // roof garden on the court tower
  box(B.p(GRN), CU0 + 2, CU1 - 2, TR[TR.length - 1] + 0.9, TR[TR.length - 1] + 1.4, CV0 + 2, CV1 - 2);
  box(B.p(FRM), CU0, CU1, YT - 0.8, YT, CV0, CV1 - 0.0);
  // ---- service core between the towers (east end) ----
  box(B.p(CORE), 30, CU1, 0.3, YT + 2, CV1, OV0);
  // ---- Office Tower: glass with a white horizontal grid; solid ends over the cores; wider glazing in the middle ----
  const OP = polyF(f, rectO(OU0, OU1, OV0, OV1));
  wallP(B.p(GL), OP, 0.3, YT); capP(B.p(ROOF50), OP, YT);
  wallP(B.p(LOB50), polyF(f, rectO(OU0 + 1, OU1 - 1, OV0 + 1, OV1 - 1)), 0.3, 6);
  ribP(B.p(FRM), OP, 6, YT, 4.6, 0.7, 0.12);
  for (const [v, s] of [[OV0, -1], [OV1, 1]]){ const F = (t, y, w) => f(t, y, v + s*(w || 0));
    // mullions: close over the ends, open in the middle
    for (let u = OU0 + 2; u < OU1 - 1.5; ){ slabP(B.p(FRM), rectO(u - 0.15, u + 0.15, 6, YT), F, 0, 0.5); const m = Math.abs(u - (OU0 + OU1)/2)/((OU1 - OU0)/2); u += m > 0.7 ? 1.6 : m > 0.4 ? 2.6 : 3.6; }
    for (const [a, b] of [[OU0, OU0 + 6], [OU1 - 6, OU1]]) slabP(B.p(CORE), rectO(a, b, 6, YT), F, 0, 0.55); }
  for (const [u, s] of [[OU0, -1], [OU1, 1]]) slabP(B.p(CORE), rectO(OV0, OV1, 0.3, YT), (t, y, w) => f(u + s*(w || 0), y, t), 0, 0.3);
  box(B.p(CORE), OU0, OU1, YT, YT + 2.2, OV0, OV1); box(B.p(GRN), OU0 + 1.5, OU1 - 1.5, YT + 2.2, YT + 2.6, OV0 + 1.5, OV1 - 1.5);
  // ---- 39 link bridges across the atrium ----
  for (let i = 0; i < 39; i++){ const y = 14 + i*4.15, u = CU0 + 18 + ((i*29) % 58), w = 3.2;
    box(B.p(FRM), u, u + w, y, y + 0.5, CV1, OV0); box(B.p(GLL), u + 0.1, u + w - 0.1, y + 0.5, y + 2.9, CV1 + 0.1, OV0 - 0.1); box(B.p(FRM), u, u + w, y + 2.9, y + 3.2, CV1, OV0); }
  lavP(B.p(LAV50), polyF(f, rectO(OU0, OU1, OV0, OV1)), YT + 2.2);
  B.flush(g); return g; }});
}
// ================= College of Medicine Building, 16 College Road (sgcolmed, hero) =================
// Wonderwall.sg / NHB and the Annals of the Academy of Medicine (Teo 2005): neoclassical, Major P. H. Keys (Keys & Dowdeswell),
// built 1923-26, opened 15 Feb 1926, restored 1985-87, national monument 2002. A row of colossal fluted Doric columns across the
// front; 11 sculptured timber doors behind the colonnade; a bas-relief Roman eagle over the central doorway; allegorical friezes of
// the teaching and practice of medicine on both sides of the front; three floors (with a mezzanine); courtyards behind the front.
// Plan: OSM w172092367 / part w463204784 (3 levels, concrete #b9c2c7, hipped tiled roof #b49695): a 77 x 17 m front range facing
// College Road and two rear wings round an open court. Column count (12, one more than the doors), storey heights and the roof
// pitch are estimates. Night: warm floodlit colonnade and glowing windows.
{
const A0 = D.comb.A, C0 = [20.35, 11.55], AX = -59.6*PI/180;
K50('sgcolmed', '医药学院大厦', 'College of Medicine Building', A0, C0, {r:63, h:24, lt:{m:0, c:'#ffe9c8', k:0.55}, build(){
  const g = new THREE.Group(), B = mkB(), f = frame(0, 0, AX), R = LMCTX.rng;
  const WALL = {c:'#d2d7d6', m:0, lk:0.55}, COL = {c:'#e4e6e2', m:0, lk:0.6}, TRIM = {c:'#e9eae6', m:0, lk:0.55}, RELIEF = {c:'#f2f1ea', m:0, lk:0.6},
    ROOF = '#ab8a82', WIN = {c:'#3a4650', m:0, glow:'#ffd9a0', gk:0.8}, DOOR = '#5a3f2b', STEP = '#c9c5bb', LOG = {c:'#bfc5c4', m:0, lk:0.5};
  const box = (o, u0, u1, y0, y1, v0, v1) => bxF(o, f, u0, u1, y0, y1, v0, v1);
  const FV = (v, s) => (t, y, w) => f(t, y, v + s*(w || 0));
  const FU = (u, s) => (t, y, w) => f(u + s*(w || 0), y, t);
  const FRONT = rectO(-38.4, 38.4, -16.8, 0), WN = rectO(-38.7, -22.8, -47.3, -16.8), WS = rectO(24.0, 38.3, -46.3, -16.8);
  const YE = 14.6, YT = 18.2, YP = 19.4, YW = 16.0;   // column top, entablature top, parapet top, wing eaves
  for (const P of [FRONT, WN, WS]) foundP(B.p(FOUND50), polyF(f, P), 0.3);
  // ---- front range: end pavilions solid, centre recessed behind the colonnade ----
  box(B.p(WALL), -38.4, -24.4, 0.3, YT, -16.8, 0); box(B.p(WALL), 24.4, 38.4, 0.3, YT, -16.8, 0);
  box(B.p(WALL), -24.4, 24.4, 0.3, YT, -16.8, -3.6);
  box(B.p(LOG), -24.4, 24.4, 0.3, 1.5, -3.6, 0.4);                                  // colonnade floor
  for (let i = 0; i < 4; i++) box(B.p(STEP), -12 + i*0.0, 12, 0.3, 1.5 - i*0.3, 0.4, 0.4 + (i + 1)*0.45);
  box(B.p(TRIM), -24.4, 24.4, YE, YT, -3.6, 0.2);                                   // entablature over the loggia
  bandAtP(B.p(TRIM), polyF(f, FRONT), YE, 0.9, 0.3);                                // architrave line round the front range
  bandAtP(B.p(TRIM), polyF(f, FRONT), YT - 1.0, 1.0, 0.45);                         // cornice
  box(B.p(TRIM), -38.6, 38.6, YT, YP, -17.0, 0.25);                                 // parapet / attic
  // colossal fluted Doric columns (12), with abacus and echinus; triglyph rhythm on the frieze
  const NC = 12, cu = i => -22.6 + i*45.2/(NC - 1);
  for (let i = 0; i < NC; i++){ const p = f(cu(i), 0, -0.9);
    latheP(B.p(COL), [[0.78, 1.5], [0.78, 1.9], [0.7, 2.0], [0.62, YE - 1.0], [0.75, YE - 0.6], [0.82, YE - 0.4]], p[0], p[2], 16);
    boxP(B.p(COL), 1.9, 0.4, 1.9, p[0], YE - 0.4, p[2], -AX); }
  { const F = FV(0.2, 1); for (let u = -24; u <= 24; u += 1.5) shapeP(B.p(RELIEF), rectO(u - 0.25, u + 0.25, YE + 1.2, YE + 2.6), F, 0.03); }
  // 11 timber doors between the columns, upper windows on the recessed wall, the Roman eagle over the central door
  { const F = FV(-3.6, 1);
    for (let i = 0; i < NC - 1; i++){ const u = (cu(i) + cu(i + 1))/2; shapeP(B.p(DOOR), rectO(u - 0.9, u + 0.9, 1.5, 5.0), F, 0.04); slabP(B.p(TRIM), rectO(u - 1.15, u + 1.15, 4.9, 5.4), F, 0.0, 0.12);
      for (const y of [7.0, 10.8]) shapeP(B.p(WIN), rectO(u - 0.75, u + 0.75, y, y + 2.4), F, 0.04); }
    const E = [[-2.2, 0.6], [-1.3, 0.2], [-0.4, 0.5], [-0.35, -0.6], [0, -0.9], [0.35, -0.6], [0.4, 0.5], [1.3, 0.2], [2.2, 0.6], [1.5, -0.2], [0.5, -0.1], [0.3, 0.9], [0, 1.1], [-0.3, 0.9], [-0.5, -0.1], [-1.5, -0.2]];
    shapeP(B.p(RELIEF), mv(E, 0, 6.3), F, 0.1); }
  // end pavilions: pilasters, three tiers of windows, the allegorical frieze panels
  for (const [u0, u1] of [[-38.4, -24.4], [24.4, 38.4]]){ const F = FV(0, 1);
    for (const u of [u0 + 0.6, u1 - 0.6]) slabP(B.p(TRIM), rectO(u - 0.6, u + 0.6, 1.5, YE), F, 0, 0.35);
    for (let k = 0; k < 3; k++){ const u = u0 + 3.5 + k*3.5;
      shapeP(B.p(WIN), rectO(u - 0.8, u + 0.8, 2.2, 4.6), F, 0.05); shapeP(B.p(WIN), rectO(u - 0.8, u + 0.8, 6.8, 9.6), F, 0.05); shapeP(B.p(WIN), rectO(u - 0.7, u + 0.7, 10.8, 12.8), F, 0.05); }
    slabP(B.p(RELIEF), rectO(u0 + 1.8, u1 - 1.8, YE + 0.9, YT - 1.1), F, 0.3, 0.38);
    slabP(B.p(WALL), rectO(u0, u1, 1.5, 2.0), F, 0, 0.3); }
  // ends and back of the front range
  for (const [u, s] of [[-38.4, -1], [38.4, 1]]){ const F = FU(u, s); for (let k = 0; k < 4; k++){ const t = -14.5 + k*3.8; for (const y of [2.2, 6.8, 10.8]) shapeP(B.p(WIN), rectO(t - 0.75, t + 0.75, y, y + 2.3), F, 0.05); } }
  { const F = FV(-16.8, -1); for (let u = -21; u <= 21; u += 3.6) for (const y of [2.2, 6.8, 10.8]) shapeP(B.p(WIN), rectO(u - 0.75, u + 0.75, y, y + 2.3), F, 0.05); }
  hipF(B.p(ROOF), f, -38.4, 38.4, -16.8, 0, YP, 5.2, 0.7);
  // ---- rear wings round the court ----
  for (const P of [WN, WS]){ const [u0, , v0] = [P[0][0], 0, P[0][1]], u1 = P[1][0], v1 = P[2][1];
    box(B.p(WALL), u0, u1, 0.3, YW, Math.min(v0, v1), -16.8);
    const Q = polyF(f, rectO(u0, u1, Math.min(v0, v1), -16.8));
    bandAtP(B.p(TRIM), Q, YW - 0.8, 0.8, 0.3); bandAtP(B.p(TRIM), Q, 5.6, 0.5, 0.15);
    winP(B, Q, 1.8, YW - 1.2, 4.6, 3.4, 1.5, 2.4, WIN, {minL:6});
    hipF(B.p(ROOF), f, u0, u1, Math.min(v0, v1), -16.4, YW, 4.0, 0.7); }
  // court: lawn and a few trees
  capP(B.p({c:'#6f8f55', m:0, lk:0.1}), polyF(f, rectO(-22.6, 23.8, -45.0, -17.0)), 0.35);
  for (const [u, v] of [[-14, -30], [0, -38], [14, -30], [-6, -24], [8, -42]]){ const p = f(u, 0, v); treeP(B.p('#5b4a3a'), B.p({c:'#4f7a3e', m:0, lk:0.1}), p[0], 0.3, p[2], 1.2, R); }
  B.flush(g); return g; }});
}
// ================= Church of St Teresa, 510 Kampong Bahru Road (sgstteresa, hero) =================
// Roots.gov.sg / Wikipedia (national monument 2009): Romano-Byzantine church, opened 7 April 1929, sketches by Fr Jean Marie Ouillon
// after the Sacre-Coeur in Montmartre, final plans by Emile Brizay. "An imposing dome that caps the sanctuary"; "a pair of towers
// topped by twin cupolas" flanking the main entrance, the two belfries above the porch holding five bells; side windows set within
// triple arches with a cross-in-circle motif; clerestory windows. Plan: OSM w172092357 (52 x 24 m nave block, axis ENE-WSW, with the
// 7.5 x 8 m porch on the east end facing the driveway loop and Kampong Bahru Road; the sanctuary and dome at the west, uphill end).
// Heights are not published: walls, towers (~29 m to the crosses) and dome (~31 m) are estimates from the plan proportions.
// Colours (cream render, terracotta roofs, grey-green domes) are estimates. Night: warm floodlight, glowing windows.
{
const A0 = D.stt.A, C0 = [-1.2, 0.5], AX = -24.663*PI/180, [RING] = shAll([D.stt.r], C0);
K50('sgstteresa', '圣德肋撒堂', 'Church of St Teresa', A0, C0, {r:37, h:34, lt:{m:0, c:'#ffe7c4', k:0.6}, build(){
  const g = new THREE.Group(), B = mkB(), f = frame(0, 0, AX);
  const WALL = {c:'#ece3cf', m:0, lk:0.6}, TRIM = {c:'#f7f2e6', m:0, lk:0.6}, ROOF = '#a4553a', DOME = {c:'#9ba7a3', m:0, lk:0.35},
    WIN = {c:'#3a3f4a', m:0, glow:'#ffcf8a', gk:0.9}, DOOR = '#4a3426', STEP = '#cfc8b8', CROSS = {c:'#e9e2cf', m:0, lk:0.7}, BELL = '#2c2a28';
  const box = (o, u0, u1, y0, y1, v0, v1) => bxF(o, f, u0, u1, y0, y1, v0, v1);
  // facade frames: long walls (v = const, facing s), end walls (u = const, facing s): F(t, y, w) with t along the wall
  const FV = (v, s) => (t, y, w) => f(t, y, v + s*(w || 0));
  const FU = (u, s) => (t, y, w) => f(u + s*(w || 0), y, t);
  const UW = -25.9, UE = 26.2, UT = 20.6;            // west end, east facade, tower inner face
  // ---- base: foundations, raised floor and steps ----
  foundP(B.p(FOUND50), RING, 0.3); capP(B.p(STEP), RING, 1.2); wallP(B.p(STEP), RING, 0.3, 1.2);
  for (let i = 0; i < 3; i++) box(B.p(STEP), UE + 7.4, UE + 9.0 - i*0.5, 0.3, 0.6 + i*0.3, -5.5, 4.4);
  // ---- aisles (v 6..12 both sides): walls to 9 m, lean-to roofs against the nave ----
  for (const s of [-1, 1]){
    const vo = 12*s, vi = 6*s;
    box(B.p(WALL), -18, UT, 1.2, 9, Math.min(vo, vi), Math.max(vo, vi));
    sheetP(B.p(ROOF), [[f(-18.4, 8.9, vo + 0.6*s), f(UT, 8.9, vo + 0.6*s)], [f(-18.4, 11.6, vi), f(UT, 11.6, vi)]]);
    bandAtP(B.p(TRIM), polyF(f, rectO(-18, UT, Math.min(vo, vi), Math.max(vo, vi))), 8.3, 0.7, 0.18);
    // triple-arch window groups in each bay + cross-in-circle above, pilaster strips between bays
    const F = FV(vo, s);
    for (let k = 0; k < 7; k++){ const uc = -15.2 + k*5.4;
      for (const d of [-1.15, 0, 1.15]) shapeP(B.p(WIN), mv(rArchO(0.42, d === 0 ? 3.6 : 3.1, 6), uc + d, 3.4), F, 0.05);
      slabP(B.p(TRIM), mv(rArchO(1.9, 4.3, 8), uc, 3.0), F, 0.0, 0.03);
      shapeP(B.p(TRIM), ringPts(0, 0, 0.55, 10).map(p => [uc + p[0], 7.7 + p[1]]), F, 0.07);
      slabP(B.p(WALL), rectO(uc + 2.4, uc + 3.0, 1.2, 8.3), F, 0, 0.25); }
  }
  // ---- nave (v -6..6): clerestory walls to 15 m, gable roof to 19.5 m ----
  box(B.p(WALL), -18, UT, 9, 15, -6, 6);
  for (const s of [-1, 1]){ const F = FV(6*s, s); for (let k = 0; k < 7; k++){ const uc = -15.2 + k*5.4;
    for (const d of [-0.7, 0.7]) shapeP(B.p(WIN), mv(rArchO(0.4, 2.3, 6), uc + d, 11.8), F, 0.05); } }
  bandAtP(B.p(TRIM), polyF(f, rectO(-18, UT, -6, 6)), 14.4, 0.6, 0.2);
  hipF(B.p(ROOF), f, -18, UT + 0.6, -6, 6, 15, 4.5, 0.5, true);
  // ---- sanctuary (west, full width) with the dome: square base, drum with windows, dome, lantern, cross ----
  box(B.p(WALL), UW, -18, 1.2, 15, -12, 12);
  for (const s of [-1, 1]){ const F = FV(12*s, s); for (const uc of [-23.5, -20.3]) shapeP(B.p(WIN), mv(rArchO(0.5, 3.4, 6), uc, 4), F, 0.05); }
  { const F = FU(UW, -1); for (const t of [-6, 0, 6]) shapeP(B.p(WIN), mv(rArchO(0.55, 3.8, 6), t, 5), F, 0.05); }
  bandAtP(B.p(TRIM), polyF(f, rectO(UW, -18, -12, 12)), 14.3, 0.7, 0.2);
  capP(B.p(ROOF), polyF(f, rectO(UW, -18, -12, 12)), 15.02);
  const dc = f(-19.8, 0, 0);
  box(B.p(WALL), UW, -13.7, 15, 17.2, -6.6, 6.6);
  latheP(B.p(WALL), [[6.0, 17.2], [6.0, 21.2]], dc[0], dc[2], 24);
  for (let i = 0; i < 12; i++){ const a = i/12*TAU, F = fA(dc[0] + Math.cos(a)*6.02, dc[2] + Math.sin(a)*6.02, a + HP); shapeP(B.p(WIN), mv(rArchO(0.45, 2.4, 5), 0, 18.2), F, 0.02); }
  latheP(B.p(TRIM), [[6.4, 21.2], [6.4, 21.7], [6.1, 21.9]], dc[0], dc[2], 24);
  const dome = []; for (let i = 0; i <= 8; i++){ const a = i/8*HP; dome.push([6.1*Math.cos(a), 21.9 + 7.1*Math.sin(a)]); }
  latheP(B.p(DOME), dome, dc[0], dc[2], 24);
  latheP(B.p(TRIM), [[1.3, 28.7], [1.3, 30.3], [1.55, 30.5], [0.9, 31.3], [0.05, 31.9]], dc[0], dc[2], 10);
  for (let i = 0; i < 12; i++){ const a = i/12*TAU; segP(B.p(TRIM), [dc[0] + Math.cos(a)*6.05, 21.9, dc[2] + Math.sin(a)*6.05], [dc[0] + Math.cos(a)*1.5, 28.4, dc[2] + Math.sin(a)*1.6], 0.12, 4); }
  const cross = (x, y, z, s) => { boxP(B.p(CROSS), 0.22*s, 2.2*s, 0.22*s, x, y, z, -AX); boxP(B.p(CROSS), 1.2*s, 0.22*s, 0.22*s, x, y + 1.35*s, z, -AX); };
  cross(dc[0], 32.0, dc[2], 1);
  // ---- east front: twin towers with belfries and cupolas, central gable with the great arched window ----
  for (const s of [-1, 1]){
    const v0 = 6.6*s, v1 = 12*s, vm = 9.3*s, tv0 = Math.min(v0, v1), tv1 = Math.max(v0, v1);
    box(B.p(WALL), UT, UE, 1.2, 21.4, tv0, tv1);
    const P = polyF(f, rectO(UT, UE, tv0, tv1));
    for (const y of [9, 15]) bandAtP(B.p(TRIM), P, y, 0.5, 0.15);
    bandAtP(B.p(TRIM), P, 20.8, 0.8, 0.3);
    // belfry: two arched openings per face, louvres dark
    for (const e of edgesF(P)) for (const d of [-1.1, 1.1]) { shapeP(B.p(BELL), mv(rArchO(0.6, 3.8, 6), e.L/2 + d, 16.2), e.F, 0.04); slabP(B.p(TRIM), mv(rArchO(0.75, 4.0, 6), e.L/2 + d, 16.0), e.F, 0.0, 0.02); }
    for (const e of edgesF(P)) shapeP(B.p(WIN), mv(rArchO(0.45, 2.6, 5), e.L/2, 10.6), e.F, 0.04);
    // cupola: octagonal drum, dome, finial, cross
    const tc = f((UT + UE)/2, 0, vm);
    box(B.p(WALL), UT + 0.6, UE - 0.6, 21.4, 22.2, tv0 + 0.6, tv1 - 0.6);
    latheP(B.p(WALL), [[2.2, 22.2], [2.2, 24.4]], tc[0], tc[2], 8, PI/8);
    for (let i = 0; i < 8; i++){ const a = PI/8 + (i + 0.5)/8*TAU, F = fA(tc[0] + Math.cos(a)*2.05, tc[2] + Math.sin(a)*2.05, a + HP); shapeP(B.p(BELL), mv(rArchO(0.35, 1.6, 4), 0, 22.6), F, 0.02); }
    latheP(B.p(TRIM), [[2.45, 24.4], [2.45, 24.7]], tc[0], tc[2], 8, PI/8);
    const cd = []; for (let i = 0; i <= 6; i++){ const a = i/6*HP; cd.push([2.35*Math.cos(a), 24.7 + 2.6*Math.sin(a)]); }
    latheP(B.p(DOME), cd, tc[0], tc[2], 12);
    latheP(B.p(TRIM), [[0.4, 27.2], [0.45, 27.8], [0.05, 28.2]], tc[0], tc[2], 6);
    cross(tc[0], 28.1, tc[2], 0.6);
  }
  // central gable wall between the towers
  { const F = FU(UE, 1);
    slabP(B.p(WALL), [[-6.6, 1.2], [6.6, 1.2], [6.6, 15], [0, 19.6], [-6.6, 15]], F, -0.4, 0.1);
    slabP(B.p(TRIM), [[-7.1, 14.6], [7.1, 14.6], [0, 20.3], [-0.01, 20.3]], F, 0.1, 0.3);
    shapeP(B.p(WIN), mv(rArchO(2.1, 5.2, 10), 0, 8.8), F, 0.14);
    slabP(B.p(TRIM), mv(rArchO(2.6, 5.8, 10), 0, 8.5), F, 0.1, 0.13);
    for (const t of [-4.4, 4.4]) shapeP(B.p(WIN), mv(rArchO(0.4, 2.4, 5), t, 10.5), F, 0.14);
    cross(...(p => [p[0], 20.3, p[2]])(f(UE + 0.2, 0, 0)), 0.6);
  }
  // porch: three arches to the front, one each side, a flat roof with a low parapet
  { const u0 = UE, u1 = 33.5, v0 = -4.5, v1 = 3.5;
    box(B.p(WALL), u0, u1, 1.2, 7.6, v0, v1);
    const FF = FU(u1, 1); for (const t of [-2.7, -0.5, 1.7]) shapeP(B.p(DOOR), mv(rArchO(0.85, 4.6, 8), t, 1.2), FF, 0.03);
    for (const [v, s] of [[v0, -1], [v1, 1]]) shapeP(B.p(DOOR), mv(rArchO(1.0, 4.6, 8), (u0 + u1)/2, 1.2), FV(v, s), 0.03);
    box(B.p(TRIM), u0, u1 + 0.3, 7.0, 7.7, v0 - 0.3, v1 + 0.3); box(B.p(TRIM), u0, u1 + 0.3, 7.7, 8.4, v0 - 0.3, v1 + 0.3);
    capP(B.p(ROOF50), polyF(f, rectO(u0, u1, v0, v1)), 8.41);
    slabP(B.p(DOOR), rectO(-1.6, 1.6, 1.2, 5.4), FU(UE, 1), 0.12, 0.16);
  }
  B.flush(g); return g; }});
}
// ================= Tanjong Pagar: Shenton Way / Anson Road towers (medium detail on the real OSM plans) =================
// Heights: meta.h from Wikipedia's List of tallest buildings in Singapore where given (Springleaf 165, 76 Shenton 158, Lippo 150,
// Keppel South Central 207); otherwise the app / OSM data heights (MAS 102, Twenty Anson 68 = OSM 20 levels) - not verified.
// Colours and materials from the OSM building:colour / building:material tags; facade rhythms are generic (estimates).

// ---- MAS Building, 10 Shenton Way (sgmasbldg): OSM w43755573 (1985); tower part w172915371 (37 levels, stone #B6A89F, 102 m in
// the data) on the 13.8 m podium filling the footprint. Anchor confirmed by the OSM name.
{
const d0 = D.mas, C0 = pcen(d0.p[6].r), d = PREP(d0, C0);
K50('sgmasbldg', '金融管理局大厦', 'MAS Building', d0.A, C0, {r:58, h:102, lt:{m:1, c:'#ffeccc', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB();
  const ST = STs('#b9ab9f'), ST2 = STs('#a99b8f', 0.3), GL = GLs('#3d4c56', 3.6, 2.2);
  foundP(B.p(FOUND50), d.r); lobby50(B, d.r, 0.3, 5.5, 1.5); wallP(B.p(ST), d.r, 5.5, 13.8); capP(B.p(ROOF50), d.r, 13.8); capP(B.p(ROOF50), offP(d.r, 1.5), 5.5);
  bandAtP(B.p(ST2), d.r, 13.0, 0.8, 0.2); winP(B, d.r, 6.2, 13, 3.6, 3.2, 2.2, 2.2, GL, {minL:4});
  for (const q of [d.p[6], d.p[5]]) tw50(B, q.r, 13.8, 102, {sty:'rib', gl:GL, fr:ST, fh:3.6, sh:1.5, bay:1.8, mul:ST2, par:2.2});
  blkP(B, scP(d.p[6].r, 0.45), 102, 106, MECH50, ROOF50); lavP(B.p(LAV50), d.p[6].r.filter((p, i) => i % 4 === 0), 104.2);
  B.flush(g); return g; }});
}
// ---- Springleaf Tower, 3 Anson Road (sgspringleaf): 165 m, 37 floors, 2002 (Wikipedia list). OSM w47345217 (stone #534d4d,
// height 27 = the podium over the whole footprint) with parts w172915354 (round tower, metal #a0a09e, 165 m) and w172915357
// (pointed slab, 130 m).
{
const d0 = D.spring, C0 = pcen(d0.r), d = PREP(d0, C0);
K50('sgspringleaf', '春叶大厦', 'Springleaf Tower', d0.A, C0, {r:60, h:165, lt:{m:1, c:'#e6f0ff', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB();
  const POD = STs('#5a5352', 0.3), MET = STs('#a6a7a4', 0.3), GL = GLs('#56707c', 4.2, 1.8);
  foundP(B.p(FOUND50), d.r); lobby50(B, d.r, 0.3, 5.5, 1.0); wallP(B.p(POD), d.r, 5.5, 27); capP(B.p(ROOF50), d.r, 27); capP(B.p(ROOF50), offP(d.r, 1), 5.5);
  ribP(B.p(STs('#6b6463', 0.3)), d.r, 8.5, 27, 3.2, 1.0, 0.05);
  tw50(B, d.p[0].r, 27, 130, {sty:'cw', gl:GL, fr:MET, fh:4.2, bay:1.8, par:2});
  tw50(B, d.p[1].r, 27, 165, {sty:'cw', gl:GL, fr:MET, fh:4.2, bay:1.8, par:2.5});
  blkP(B, scP(d.p[1].r, 0.5), 165, 168, MECH50, ROOF50); lavP(B.p(LAV50), d.p[1].r.filter((p, i) => i % 4 === 0), 167.5);
  B.flush(g); return g; }});
}
// ---- 76 Shenton (sg76shenton): 158 m, 40 floors, 2014 (Wikipedia list); OSM w172915342 (DP Architects, 5-level podium over the
// footprint) and tower part w172915356 (39 levels, glass #6c786f, from the 16.5 m podium roof).
{
const d0 = D.s76, C0 = pcen(d0.r), d = PREP(d0, C0);
K50('sg76shenton', '珊顿道76号', '76 Shenton', d0.A, C0, {r:47, h:158, lt:{m:1, c:'#ffeed6', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB();
  const POD = STs('#c7c9c4', 0.3), GL = GLs('#5f6f68', 3.5, 2.0), LED = STs('#e3e5e0', 0.35), T = d.p[1].r;
  foundP(B.p(FOUND50), d.r); lobby50(B, d.r, 0.3, 4.5, 1.0); capP(B.p(ROOF50), offP(d.r, 1), 4.5);
  wallP(B.p(POD), d.r, 4.5, 16.5); capP(B.p({c:'#7b8f6a', m:0, lk:0.1}), d.r, 16.5); winP(B, d.r, 5.5, 16, 3.6, 3.4, 2.4, 1.8, GL, {minL:4});
  wallP(B.p(GL), T, 16.5, 158); capP(B.p(ROOF50), T, 158);
  ledgeP(B.p(LED), T, 16.5 + 3.5, 158, 3.5, 0.9, 0.3); facadeP(B, T, 16.5, 158, {mul:LED, bay:2.4, fd:0.15, fw:0.05, bands:false});
  wallP(B.p(LED), offP(T, -0.2), 158, 161); lavP(B.p(LAV50), T.filter((p, i) => i % 3 === 0), 160.5);
  B.flush(g); return g; }});
}
// ---- Lippo Centre, 78 Shenton Way (sglippo): 150 m, 34 floors, 1990 (Wikipedia list). OSM w172915343: tower part w172915355
// (34 levels, stone #565254, 150 m) with the saw-tooth north face from the OSM plan; low parts w439006025 (metal, 3 levels),
// w439006024 (stone, 3 levels) and the glass block w439006026 (to 40.2 m).
{
const d0 = D.lippo, C0 = pcen(d0.r), d = PREP(d0, C0);
K50('sglippo', '力宝中心', 'Lippo Centre', d0.A, C0, {r:68, h:150, lt:{m:1, c:'#ffeccc', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB();
  const ST = STs('#5e5a5c', 0.3), ST2 = STs('#4c4849', 0.25), GL = GLs('#41505a', 4.2, 2.0), MET = STs('#b8babb', 0.3), GB = GLs('#5c6774', 3.6, 2.2);
  for (const q of d.p) foundP(B.p(FOUND50), q.r);
  tw50(B, d.p[2].r, 0.3, 150, {sty:'rib', gl:GL, fr:ST, fh:4.2, sh:1.6, bay:2.0, mul:ST2, par:2.5});
  lobby50(B, d.p[2].r, 0.3, 6, -0.05);
  low50(B, d.p[0].r, 0.3, 10.5, {wall:MET, gl:GB, fh:3.5, par:0.8}); low50(B, d.p[3].r, 0.3, 10.5, {wall:ST, gl:GB, fh:3.5, par:0.8});
  tw50(B, d.p[1].r, 9.9, 40.2, {sty:'cw', gl:GB, fr:MET, fh:3.6, bay:2.2, par:1.2});
  blkP(B, scP(d.p[2].r, 0.5), 150, 153, MECH50, ROOF50); lavP(B.p(LAV50), d.p[2].r.filter((p, i) => i % 5 === 0), 152.5);
  B.flush(g); return g; }});
}
// ---- Keppel South Central, 1 Hoe Chiang Road (sgkeppelsouth): 207 m, 33 floors, 2025 (Wikipedia list). OSM w1228196509: tower
// part w1228196512 (33 levels, glass, cyan, height 207) plus the second tall part on its north side; low parts w1228196511 / -10
// (2-3 levels, grass roofs). The data tower stops at 109.5 m: raised to the listed 207 m; the top 7 m modelled as a parapet screen
// (the crown form is not verified).
{
const d0 = D.keppel, C0 = pcen(d0.r), d = PREP(d0, C0);
K50('sgkeppelsouth', '吉宝南中心', 'Keppel South Central', d0.A, C0, {r:76, h:207, lt:{m:1, c:'#e2f4ff', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB();
  const GL = GLs('#5d8e98', 4.5, 1.5), MUL = STs('#c9d3d6', 0.25), GRN = {c:'#6f8f55', m:0, lk:0.1}, LOW = STs('#d4d6d2', 0.3), LG = GLs('#6e8c93', 3.5, 2);
  for (const q of d.p) foundP(B.p(FOUND50), q.r);
  for (const q of [d.p[3], d.p[0]]){ tw50(B, q.r, 0.3, 200, {sty:'cw', gl:GL, fr:MUL, fh:4.5, bay:1.5, fd:0.2}); lobby50(B, q.r, 0.3, 7, -0.05);
    wallP(B.p(MUL), offP(q.r, -0.1), 200, 207); finsP(B.p(GL), offP(q.r, -0.1), 200, 207, 1.5, 0.3, 0.12); }
  for (const i of [1, 2, 4, 6]){ const q = d.p[i]; low50(B, q.r, 0.3, q.t, {wall:LOW, gl:LG, fh:3.5}); capP(B.p(GRN), q.r, q.t + 0.02); }
  { const q = d.p[5]; wallP(B.p(LG), q.r, q.b, q.t); capP(B.p(GRN), q.r, q.t); }
  blkP(B, scP(d.p[3].r, 0.45), 200, 203, MECH50, ROOF50); lavP(B.p(LAV50), d.p[3].r.filter((p, i) => i % 2 === 0), 207);
  B.flush(g); return g; }});
}
// ---- Twenty Anson, 20 Anson Road (sgtwentyanson): OSM w172269374 (20 levels, 2009); tower part w172269372 (68 m in the data -
// height not verified, kept). Glass with light frames (estimate).
{
const d0 = D.anson, C0 = pcen(d0.p[0].r), d = PREP(d0, C0);
K50('sgtwentyanson', '安顺路20号', 'Twenty Anson', d0.A, C0, {r:45, h:68, lt:{m:1, c:'#e8f2ff', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB();
  const GL = GLs('#58717d', 3.4, 1.6), FR = STs('#dcdfdd', 0.3), T = d.p[0].r;
  foundP(B.p(FOUND50), T); lobby50(B, T, 0.3, 6, 1.2); capP(B.p(ROOF50), offP(T, 1.2), 6);
  tw50(B, T, 6, 68, {sty:'fin', gl:GL, fr:FR, fh:3.4, bay:1.6, fd:0.45, fw:0.14, par:2.5});
  blkP(B, scP(T, 0.5), 68, 71, MECH50, ROOF50);
  B.flush(g); return g; }});
}
}
