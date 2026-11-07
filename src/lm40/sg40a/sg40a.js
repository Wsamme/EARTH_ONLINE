// ===== lm40/sg40a: twelve new landmarks in Singapore's CBD & Marina (City Brush lm40, real Singapore 1:1)
// Built in the map frame (local +x = east, +z = south, rot 0) on the real OSM footprints of SC/lm40/ref_sg40a*.json.
// Only LANDMARKS and SG_PLACES are touched; helpers live inside this block.
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
// ================= Capital Tower (2000, RSP Architects Planners & Engineers), 168 Robinson Road =================
// 52 floors, 254 m roof (Wikipedia; CTBUH 255.4 m architectural, 231.7 m to the top occupied floor), glass curtain wall
// (Permasteelisa), composite perimeter columns round a central core. Massing from the OSM building:parts of w47345009: a
// pinwheel plan (each of the four ~42 m faces stepped forward at one end) rising to 190 m, then a 50.6 x 33.1 m block to 229 m
// and a 40.3 x 22.9 m top block to 254 m. Night: lit office floors and a colour-changing crown (Wikipedia: parts of the facade
// change colour every few seconds) -> anim 'cycle'.
{
const A0 = [1.277641, 103.847636];
const SITE0 = [[9.9,-31.3],[12.3,-34.8],[27.2,-25.3],[24.8,-21.2],[43.9,-9.3],[10.5,44.6],[-45.0,10.8],[-10.4,-43.7]];
const MAIN0 = [[27.8,-5.8],[26.0,-2.8],[33.8,1.9],[11.1,38.1],[3.3,33.4],[1.5,35.8],[-34.3,13.2],[-33.1,10.8],[-40.3,6.1],[-17.6,-29.5],[-10.4,-25.3],[-8.0,-28.3]];
const UP0 = [[-15.8,-23.0],[27.2,3.7],[9.3,31.6],[-33.7,4.9]], TOP0 = [[-14.6,-15.8],[20.0,4.9],[8.1,24.5],[-26.5,3.1]];
const C0 = pcen(MAIN0), [SITE, MAIN, UP, TOPB] = shAll([SITE0, MAIN0, UP0, TOP0], C0);
LANDMARKS.sgcapitaltower = {zh:'资本大厦', en:'Capital Tower', cat:'new', r:50, h:254,
  lt:{m:1, c:'#bfe6ff', k:0.6, anim:'cycle', c2:'#8f7dff'}, build(){
  const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
  const GL = {c:'#5d8d97', m:1, fh:4.4, cw:3.0}, GLU = {c:'#5a8992', m:1, fh:4.4, cw:3.0}, MUL = {c:'#c8d0d2', m:0, lk:0.15}, BAND = {c:'#8fa8ae', m:0, lk:0.15},
    LOB = {c:'#b9c7c6', m:0, glow:'#ffe2b8', gk:0.8}, COL = '#d8d6cf', PAVE = '#c2bcb0', FOUND = '#bdb7ab', ROOF = '#8d9294', MECH = '#6f7577',
    LED = {c:'#dfe8ea', m:0, lc:'#86e4ff', lk:1.5, glow:'#7fd8ff', gk:0.55}, LAV = {c:'#c22', glow:'#ff2a1a', gk:2}, TRK = '#5b4a3a', LEAF = {c:'#4f7a3e', m:0, lk:0.1};
  const Y0 = 12.5, Y1 = 190, Y2 = 229, Y3 = 254;
  // ---- plaza on the site, foundations ----
  wallP(B.p(FOUND), SITE, -5, 0.4); capP(B.p(PAVE), SITE, 0.4);
  wallP(B.p(FOUND), MAIN, -5, 0.4);
  for (const [x, z] of alongP(offP(SITE, 3.2), 9)){ if (inPolyS(offP(MAIN, -2.5), x, z)) continue; treeP(B.p(TRK), B.p(LEAF), x, 0.4, z, 1.15, R); }
  // ---- lobby: glass behind the composite perimeter columns ----
  prismP(B.p(LOB), offP(MAIN, 1.8), 0.4, Y0);
  for (const [x, z] of alongP(MAIN, 9)) segP(B.p(COL), [x, 0.4, z], [x, Y0, z], 0.55, 8);
  // ---- shaft to 190 m: glass, mullions, floor bands, a deeper spandrel at the 163 m break ----
  prismP(B.p(GL), MAIN, Y0, Y1);
  facadeP(B, MAIN, Y0, Y1, {mul:MUL, band:BAND, bay:3.0, fd:0.4, fh:4.4, bh:0.45});
  bandAtP(B.p(BAND), MAIN, Y0 - 1.2, 1.2, 0.12); bandAtP(B.p(BAND), MAIN, 162.4, 1.4, 0.14); bandAtP(B.p(BAND), MAIN, Y1 - 1.3, 1.3, 0.15);
  capP(B.p(ROOF), offP(MAIN, 0.3), Y1 - 0.01);
  // ---- upper blocks ----
  prismP(B.p(GLU), UP, Y1, Y2); facadeP(B, UP, Y1, Y2, {mul:MUL, band:BAND, bay:3.0, fd:0.4, fh:4.4, bh:0.45});
  bandAtP(B.p(BAND), UP, Y2 - 1.3, 1.3, 0.15); capP(B.p(ROOF), offP(UP, 0.3), Y2 - 0.01);
  prismP(B.p(GLU), TOPB, Y2, Y3 - 4); facadeP(B, TOPB, Y2, Y3 - 4, {mul:MUL, band:BAND, bay:3.0, fd:0.4, fh:4.4, bh:0.45});
  // crown: open screen round the roof plant, LED edges on every step
  wallP(B.p(MUL), offP(TOPB, 0.2), Y3 - 4, Y3); capP(B.p(ROOF), offP(TOPB, 0.4), Y3 - 3.5);
  for (const e of edgesF(TOPB)){ const n = Math.round(e.L/1.5); for (let k = 0; k < n; k++) shapeP(B.p(MECH), rectO((k + 0.2)*e.L/n, (k + 0.8)*e.L/n, Y3 - 3.6, Y3 - 0.6), e.F, 0.05); }
  for (const [P, y] of [[MAIN, Y1], [UP, Y2], [TOPB, Y3]]) bandAtP(B.p(LED), P, y - 0.5, 0.5, 0.2);
  for (const p of TOPB) boxP(B.p(LAV), 0.5, 0.6, 0.5, p[0]*0.97, Y3, p[1]*0.97);
  B.flush(g); return g; }};
const PL = LL40(A0[0], A0[1], C0[0], C0[1]);
SG_PLACES.push({type:'sgcapitaltower', lat:PL.lat, lon:PL.lon, rot:0});
}
// ================= International Plaza (1976, Ang Kheng Leng & Associates), 10 Anson Road =================
// 190 m, 50 storeys (Wikipedia): a seven-storey triangular podium (shops on levels 1-3, car park on 4-8) on the site between
// Anson Road and Choon Guan Street, and a 43-storey elongated-octagon tower: offices 9-35, a recreation floor on level 36
// (pool, health club), apartments 37-50 and a roof garden. Plans: OSM w117041257 (podium) and its 0-190 m part (tower).
// Facade (not documented in the sources; from the massing): continuous concrete floor bands and dark ribbon glazing (the 1985
// external glass wall). Night: lit floors, an LED facade (Wikipedia: installed under the city lighting plan) -> anim 'cycle'.
{
const A0 = [1.275887, 103.845959];
const POD0 = [[-51.8,-26.0],[32.9,-37.2],[52.6,-38.4],[59.2,-33.1],[61.6,-24.2],[58.6,-13.5],[55.6,-9.3],[4.9,48.8],[-4.7,38.7],[-44.7,42.8]];
const TWR0 = [[20.4,-23.0],[25.8,-18.8],[29.4,13.8],[25.2,18.5],[-33.9,25.6],[-35.1,15.0],[-44.1,15.6],[-47.7,-10.5],[-42.9,-16.5]];
const C0 = pcen(POD0), [POD, TWR] = shAll([POD0, TWR0], C0);
LANDMARKS.sgintlplaza = {zh:'国际广场', en:'International Plaza', cat:'new', r:70, h:190,
  lt:{m:1, c:'#ffe2b8', k:0.55, anim:'cycle', c2:'#7ac8ff'}, build(){
  const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
  const CON = {c:'#d9d2c2', m:0, lk:0.2}, CON2 = {c:'#c9c0ae', m:0, lk:0.2}, GLO = {c:'#3e4c52', m:1, fh:3.86, cw:2.8}, GLR = {c:'#4a5552', m:1, fh:3.7, cw:2.4},
    SHOP = {c:'#9fb0b0', m:0, glow:'#ffdcaa', gk:0.75}, PARK = '#5d5f5c', FOUND = '#bdb6a6', ROOF = '#9a978e', POOL = {c:'#5ab0c6', glow:'#4aa8c8', gk:0.5},
    LED = {c:'#e8e4da', m:0, lc:'#9fd8ff', lk:1.3, glow:'#8fd0ff', gk:0.45}, LAV = {c:'#c22', glow:'#ff2a1a', gk:2}, LEAF = {c:'#4d7a3d', m:0, lk:0.1}, TRK = '#5b4a3a', DARK = '#3d3f3e';
  const YP = 28.5, YO = 132.2, YR = 138.6, YT = 190;
  // ---- podium: shops (glass shopfronts behind a canopy band), car-park decks with open louvred bands, roof deck ----
  wallP(B.p(FOUND), POD, -5, 0.3); capP(B.p(FOUND), POD, 0.3);
  prismP(B.p(SHOP), offP(POD, 1.5), 0.3, 5.2); prismP(B.p(CON), POD, 5.2, 13.6);
  bandAtP(B.p(CON2), POD, 4.6, 0.9, 1.4);                                   // street canopy
  for (const y of [8.6]) bandAtP(B.p(GLO), POD, y, 3.2, 0.05);               // shop levels 2-3: glazing strip
  prismP(B.p(CON), POD, 13.6, YP);
  for (let y = 14.4; y < YP - 1; y += 3.0) bandAtP(B.p(PARK), POD, y, 1.6, 0.04);   // car-park openings
  for (const e of edgesF(POD)){ const n = Math.round(e.L/1.6); for (let k = 1; k < n; k++) for (let y = 14.4; y < YP - 1; y += 3.0) slabP(B.p(CON2), rectO(k*e.L/n - 0.12, k*e.L/n + 0.12, y, y + 1.6), e.F, 0, 0.18); }
  capP(B.p(ROOF), POD, YP + 0.02); parP(B.p(CON), POD, YP, YP + 1.1, 0.3);
  // ---- tower: concrete floor bands and dark ribbon glazing; deeper bands on the residential floors ----
  prismP(B.p(GLO), offP(TWR, 0.6), YP, YO);
  for (let y = YP; y < YO - 0.5; y += 3.86) bandAtP(B.p(CON), TWR, y, 1.25, 0.0);
  for (const e of edgesF(TWR)){ const n = Math.max(1, Math.round(e.L/7.2)); for (let k = 0; k <= n; k++) slabP(B.p(CON2), rectO(k*e.L/n - 0.35, k*e.L/n + 0.35, YP, YO), e.F, -0.6, 0.15); }
  // level 36: recreation floor, open-sided behind columns, pool
  prismP(B.p(CON), TWR, YO, YO + 1.2); prismP(B.p(DARK), offP(TWR, 4), YO + 1.2, YR - 0.8); capP(B.p(POOL), offP(TWR, 9), YO + 1.25);
  for (const [x, z] of alongP(offP(TWR, 0.8), 7.2)) segP(B.p(CON), [x, YO + 1.2, z], [x, YR - 0.8, z], 0.45, 6);
  prismP(B.p(CON), TWR, YR - 0.8, YR);
  prismP(B.p(GLR), offP(TWR, 0.9), YR, YT - 1.2);
  for (let y = YR; y < YT - 1.5; y += 3.7) bandAtP(B.p(CON), offP(TWR, -0.5), y, 1.0, 0.0);
  for (const e of edgesF(TWR)){ const n = Math.max(1, Math.round(e.L/4.8)); for (let k = 0; k <= n; k++) slabP(B.p(CON2), rectO(k*e.L/n - 0.25, k*e.L/n + 0.25, YR, YT - 1.2), e.F, -0.6, 0.6); }
  // roof garden, lift / plant room, LED edge lines, aviation lights
  prismP(B.p(CON), TWR, YT - 1.2, YT - 0.2); parP(B.p(CON2), TWR, YT - 0.2, YT + 1.0, 0.3); capP(B.p(LEAF), offP(TWR, 1.5), YT - 0.15);
  const C = pcen(TWR), a = Math.atan2(TWR[4][1] - TWR[3][1], TWR[4][0] - TWR[3][0]);
  prismP(B.p(CON2), rectA(C[0], C[1], 9, 6, a), YT - 0.2, YT + 6.5); capP(B.p(ROOF), rectA(C[0], C[1], 9, 6, a), YT + 6.5);
  for (let i = 0; i < 14; i++){ const u = (R() - 0.5)*50, v = (R() - 0.5)*24, x = C[0] + u*Math.cos(a) - v*Math.sin(a), z = C[1] + u*Math.sin(a) + v*Math.cos(a);
    if (inPolyS(offP(TWR, 3), x, z) && Math.abs(u) > 11) treeP(B.p(TRK), B.p(LEAF), x, YT - 0.2, z, 0.9, R); }
  for (const P of [TWR]) for (const y of [YP + 1.2, YO, YT - 0.4]) bandAtP(B.p(LED), P, y - 0.3, 0.3, 0.25);
  for (const e of edgesF(TWR)) if (e.L > 6) { const p = e.F(e.L/2, 0, 0.3); segP(B.p(LED), [p[0], YP + 1, p[2]], [p[0], YT - 0.4, p[2]], 0.18, 4); }
  boxP(B.p(LAV), 0.6, 0.6, 0.6, C[0], YT + 6.5, C[1]);
  B.flush(g); return g; }};
const PL = LL40(A0[0], A0[1], C0[0], C0[1]);
SG_PLACES.push({type:'sgintlplaza', lat:PL.lat, lon:PL.lon, rot:0});
}
// ================= Millenia Tower (1996, Kevin Roche John Dinkeloo), 1 Temasek Avenue =================
// 41 storeys, 223 m (Wikipedia tallest list; OSM height 223; Wikipedia article: roof 218 m). Stone-clad square tower (OSM w48035153,
// 40.8 m square) whose square base rests on four illuminated cylinders that frame a five-storey glass lobby; a massive pyramidal
// roof. The stone grid (piers and spandrels round punched windows) and the 40 m pyramid proportions are estimates. Night: the
// four cylinders glow, lit office windows, the pyramid floodlit warm.
{
const A0 = [1.292629, 103.860299];
const SQ0 = [[28.1,-8.3],[9.0,27.8],[-28.1,8.3],[-9.0,-27.9]];
const C0 = pcen(SQ0), [SQ] = shAll([SQ0], C0);
LANDMARKS.sgmillenia = {zh:'美年大厦', en:'Millenia Tower', cat:'new', r:45, h:223,
  lt:{m:1, c:'#ffe6c4', k:0.6}, build(){
  const g = new THREE.Group(), B = mkB();
  const STONE = {c:'#bdb4a6', m:0, lk:0.25}, STD = {c:'#a89f92', m:0, lk:0.2}, WIN = {c:'#4b5558', m:1, fh:4.2, cw:2.6}, LOB = {c:'#b8c6c8', m:0, glow:'#ffe6c0', gk:0.9},
    CYL = {c:'#e6e1d6', m:0, glow:'#fff0d4', gk:0.85}, PYR = {c:'#c9c6bd', m:0, lc:'#ffe2b0', lk:1.3}, PYRG = {c:'#8ea0a4', m:0, lc:'#ffe2b0', lk:1.0}, PAVE = '#c4bdb0', FOUND = '#b9b2a5',
    LAV = {c:'#c22', glow:'#ff2a1a', gk:2};
  const ang = Math.atan2(SQ[1][1] - SQ[0][1], SQ[1][0] - SQ[0][0]), HS = Math.hypot(SQ[1][0] - SQ[0][0], SQ[1][1] - SQ[0][1])/2;
  const F = frame(0, 0, ang - HP), YL = 24, YB = 186, YT = 223, FH = 3.95;
  const SQP = polyF(F, [[-HS, -HS], [HS, -HS], [HS, HS], [-HS, HS]]);
  // ---- plaza, foundations ----
  const PLZ = polyF(F, [[-HS - 4, -HS - 4], [HS + 4, -HS - 4], [HS + 4, HS + 4], [-HS - 4, HS + 4]]);
  wallP(B.p(FOUND), PLZ, -5, 0.3); capP(B.p(PAVE), PLZ, 0.3);
  // ---- five-storey glass lobby between the four cylinders ----
  const CR = 5.2, CI = HS - CR + 0.4;
  prismP(B.p(LOB), polyF(F, [[-HS + 3, -HS + 3], [HS - 3, -HS + 3], [HS - 3, HS - 3], [-HS + 3, HS - 3]]), 0.3, YL);
  for (const [su, sv] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]){ const p = F.P(su*CI, sv*CI); latheP(B.p(CYL), [[CR, 0.3], [CR, YL - 1.5], [CR + 0.3, YL - 1.5], [CR + 0.3, YL]], p[0], p[1], 24); }
  // lobby mullions
  for (const e of edgesF(polyF(F, [[-HS + 3, -HS + 3], [HS - 3, -HS + 3], [HS - 3, HS - 3], [-HS + 3, HS - 3]]))){ const n = Math.round(e.L/2.2); for (let k = 1; k < n; k++) slabP(B.p(STD), rectO(k*e.L/n - 0.07, k*e.L/n + 0.07, 0.3, YL), e.F, 0, 0.25); }
  // ---- tower: stone body with a grid of piers and spandrels; windows behind ----
  prismP(B.p(WIN), offP(SQP, 0.5), YL, YB);
  prismP(B.p(STONE), SQP, YL, YL + 2.4);
  for (const e of edgesF(SQP)){
    const nb = 12, bw = e.L/nb;
    for (let k = 0; k <= nb; k++){ const w = k === 0 || k === nb ? 1.3 : 0.55; slabP(B.p(STONE), rectO(Math.max(0, k*bw - w), Math.min(e.L, k*bw + w), YL + 2.4, YB), e.F, -0.5, 0.3); }
    for (let y = YL + 2.4 + FH; y < YB - 1; y += FH) slabP(B.p(STONE), rectO(0, e.L, y - 1.05, y), e.F, -0.5, 0.12);
    // corner reveals: a slight double step down each corner
    for (const u of [0.0, e.L - 1.3]) slabP(B.p(STD), rectO(u, u + 1.3, YL + 2.4, YB), e.F, 0.3, 0.6);
  }
  // ---- cornice, then the pyramid with ribbed metal / glass faces ----
  prismP(B.p(STONE), offP(SQP, -0.8), YB, YB + 2.2);
  const PT = [], PH = YT - YB - 2.2;
  const base = polyF(F, [[-HS - 0.4, -HS - 0.4], [HS + 0.4, -HS - 0.4], [HS + 0.4, HS + 0.4], [-HS - 0.4, HS + 0.4]]);
  for (let i = 0; i < 4; i++){ const a = base[i], b = base[(i + 1) % 4]; triP(B.p(PYR), [a[0], YB + 2.2, a[1]], [b[0], YB + 2.2, b[1]], [0, YT - 3, 0]); }
  // ribs on each face (batched), and recessed glazed panels
  for (let i = 0; i < 4; i++){ const a = base[i], b = base[(i + 1) % 4];
    for (let k = 1; k < 10; k++){ const t = k/10, p = [a[0] + (b[0] - a[0])*t, YB + 2.2, a[1] + (b[1] - a[1])*t]; segP(B.p(PYRG), p, [p[0]*0.0 + (p[0])*0.02, YT - 3.5, p[2]*0.02], 0.22, 4); }
    for (let k = 1; k < 5; k++){ const f = k/5, y = YB + 2.2 + PH*f*0.93, s = 1 - f*0.93;
      segP(B.p(PYRG), [a[0]*s, y, a[1]*s], [b[0]*s, y, b[1]*s], 0.25, 4); } }
  segP(B.p(PYR), [0, YT - 3.5, 0], [0, YT, 0], 0.3, 6); boxP(B.p(LAV), 0.5, 0.5, 0.5, 0, YT, 0);
  B.flush(g); return g; }};
const PL = LL40(A0[0], A0[1], C0[0], C0[1]);
SG_PLACES.push({type:'sgmillenia', lat:PL.lat, lon:PL.lon, rot:0});
}
// ================= Esplanade Bridge (1997), Esplanade Drive over the mouth of the Singapore River =================
// Wikipedia: a low-level concrete arch bridge of seven spans, 261 m long (infobox 280 m), 46 m wide, two four-lane carriageways
// with walkways on both sides, street lamps by Light Cibles. The app draws both carriageways (OSM 'Esplanade Drive', bridge
// lines; deck height e(s) per vertex); the model gives the seven arches (spans of 261/7 = 37.3 m between six river piers),
// the vault soffits, spandrel faces and pier noses, the deck edge with the walkway surface just under the app's road ribbons,
// the parapets and a row of lamp standards. Arch spacing and lamp design are estimates (span count and length are sourced).
// Night: the arch faces floodlit warm white, lamps lit. Local frame: ref anchor (1.287959, 103.854184), +x east, +z south.
{
const A0 = [1.287959, 103.854184];
// carriageway centrelines (two lines, deck elevation per vertex) from ref_sg40a.json
const CW1 = [[27.7,-143.1],[23.1,-119.3],[18.5,-95.4],[13.8,-71.6],[9.2,-47.7],[4.6,-23.9],[0,0],[-4.7,23.8],[-9.3,47.6],[-13.9,71.5],[-18.6,95.3],[-23.2,119.2],[-27.8,143.0]];
const EL1 = [0.6,3.5,6.5,9.0,9.0,9.0,9.0,9.0,9.0,9.0,6.5,3.5,0.6];
const CW2 = [[9.2,-144.0],[4.7,-120.4],[0.2,-96.8],[-4.3,-73.2],[-8.8,-49.6],[-13.3,-26.0],[-17.8,-2.4],[-22.3,21.2],[-26.8,44.8],[-31.3,68.4],[-35.8,92.0],[-40.3,115.6],[-44.8,139.2]];
const N0 = [(CW1[0][0] + CW2[0][0])/2, (CW1[0][1] + CW2[0][1])/2], S0 = [(CW1[12][0] + CW2[12][0])/2, (CW1[12][1] + CW2[12][1])/2];
const M0 = [(N0[0] + S0[0])/2, (N0[1] + S0[1])/2], AX = Math.atan2(S0[1] - N0[1], S0[0] - N0[0]);
const F = frame(0, 0, AX);   // u along the bridge (north -> south), v across (+v = west side)
// deck height (local model y) at station u: app road = ground 0.9 + e + 0.18, model base = 1.5  ->  e - 0.42
const SE = CW1.map(p => { const q = [p[0] - M0[0], p[1] - M0[1]]; return q[0]*Math.cos(AX) + q[1]*Math.sin(AX); });
const eAt = u => { if (u <= SE[0]) return EL1[0]; for (let i = 0; i < SE.length - 1; i++) if (u <= SE[i+1]){ const t = (u - SE[i])/(SE[i+1] - SE[i]), s = t*t*(3 - 2*t); return EL1[i] + (EL1[i+1] - EL1[i])*s; } return EL1[EL1.length - 1]; };
const DY = u => eAt(u) - 0.42;
LANDMARKS.sgesplbr = {zh:'滨海大桥', en:'Esplanade Bridge', cat:'new', r:150, h:12,
  lt:{m:0, c:'#ffe2b8', k:1.15, e:0.9}, build(){
  const g = new THREE.Group(), B = mkB();
  const CON = {c:'#d6d2c8', m:0}, COND = {c:'#bdb8ac', m:0}, SOF = {c:'#aaa598', m:0, lk:0.6}, WALK = '#a8a196', RAIL = '#3f4648', POLE = '#5d6466',
    LAMP = {c:'#fff3d8', glow:'#ffdca0', gk:2.6}, FOUND = '#9d978b';
  const HW = 23, L = 261, NS = 7, SP = L/NS, U0 = -L/2, YW = -1.6, YSP = -1.2;
  const P3 = (u, y, v) => F(u, y, v);
  // ---- arches: vault soffit across the width, spandrel faces on both sides, piers with rounded noses ----
  for (let k = 0; k < NS; k++){
    const ua = U0 + k*SP + (k ? 1.6 : 0), ub = U0 + (k + 1)*SP - (k < NS - 1 ? 1.6 : 0), dmin = Math.min(DY(ua), DY(ub));
    const rise = Math.max(0.8, dmin - 1.7 - YSP), N = 16, arc = [];
    for (let i = 0; i <= N; i++){ const t = i/N, u = ua + (ub - ua)*t; arc.push([u, YSP + rise*Math.sqrt(Math.max(0, 1 - Math.pow(2*t - 1, 2)))]); }
    // soffit
    for (let i = 0; i < N; i++){ const [u1, y1] = arc[i], [u2, y2] = arc[i+1]; quadP(B.p(SOF), P3(u1, y1, -HW + 0.3), P3(u2, y2, -HW + 0.3), P3(u2, y2, HW - 0.3), P3(u1, y1, HW - 0.3)); }
    // spandrel faces (deck edge down to the arch ring), arch ring band
    for (const s of [-1, 1]){
      const Fs = (u, y, w) => P3(u, y, s*(HW + (w || 0)));
      for (let i = 0; i < N; i++){ const [u1, y1] = arc[i], [u2, y2] = arc[i+1];
        quadP(B.p(CON), Fs(u1, y1, 0), Fs(u2, y2, 0), Fs(u2, DY(u2) - 0.25, 0), Fs(u1, DY(u1) - 0.25, 0));
        quadP(B.p(COND), Fs(u1, y1, 0.25), Fs(u2, y2, 0.25), Fs(u2, y2 + 0.9, 0.25), Fs(u1, y1 + 0.9, 0.25)); }
    }
  }
  // piers between the spans (six) and the two abutments
  for (let k = 0; k <= NS; k++){
    const u = U0 + k*SP, w = k === 0 || k === NS ? 6 : 3.2, top = DY(u) - 0.25;
    bxF(B.p(CON), F, u - w/2, u + w/2, -5, top, -HW, HW);
    if (k > 0 && k < NS) for (const s of [-1, 1]){ const c = F(u, 0, s*HW); latheP(B.p(COND), [[1.6, -5], [1.6, YSP + 1.2], [1.1, YSP + 2.2], [0.2, YSP + 2.6]], c[0], c[2], 12); }
  }
  // ---- deck: walkway / deck surface just under the app's carriageways, edge beam, parapets, rails ----
  const NU = 60;
  for (let i = 0; i < NU; i++){ const u1 = U0 - 8 + (L + 16)*i/NU, u2 = U0 - 8 + (L + 16)*(i + 1)/NU, y1 = DY(u1) - 0.16, y2 = DY(u2) - 0.16;
    quadP(B.p(WALK), P3(u1, y1, -HW), P3(u2, y2, -HW), P3(u2, y2, HW), P3(u1, y1, HW));
    for (const s of [-1, 1]){
      quadP(B.p(CON), P3(u1, y1 - 1.0, s*(HW + 0.3)), P3(u2, y2 - 1.0, s*(HW + 0.3)), P3(u2, y2 + 1.05, s*(HW + 0.3)), P3(u1, y1 + 1.05, s*(HW + 0.3)));
      quadP(B.p(CON), P3(u1, y1 + 1.05, s*(HW + 0.3)), P3(u2, y2 + 1.05, s*(HW + 0.3)), P3(u2, y2 + 1.05, s*(HW - 0.2)), P3(u1, y1 + 1.05, s*(HW - 0.2)));
      quadP(B.p(CON), P3(u1, y1, s*(HW - 0.2)), P3(u2, y2, s*(HW - 0.2)), P3(u2, y2 + 1.05, s*(HW - 0.2)), P3(u1, y1 + 1.05, s*(HW - 0.2)));
      segP(B.p(RAIL), P3(u1, y1 + 1.3, s*(HW + 0.05)), P3(u2, y2 + 1.3, s*(HW + 0.05)), 0.05, 4);
    }
  }
  // ---- lamp standards along both parapets and the median (spacing estimated) ----
  for (let u = U0 + SP/2; u < -U0; u += SP/2){ for (const v of [HW - 0.6, -HW + 0.6, 0]){
    const c = P3(u, 0, v), y = DY(u) - 0.16 + (v === 0 ? 0.2 : 1.05);
    segP(B.p(POLE), [c[0], y, c[2]], [c[0], y + 9, c[2]], 0.14, 6);
    for (const s of (v === 0 ? [-1, 1] : [Math.sign(-v)])){ const e = P3(u, 0, v + s*1.6); segP(B.p(POLE), [c[0], y + 8.6, c[2]], [e[0], y + 9.2, e[2]], 0.08, 4); latheP(B.p(LAMP), [[0.05, y + 8.7], [0.6, y + 8.95], [0.5, y + 9.4], [0.05, y + 9.5]], e[0], e[2], 8); }
  } }
  B.flush(g); return g; }};
const PL = LL40(A0[0], A0[1], M0[0], M0[1]);
SG_PLACES.push({type:'sgesplbr', lat:PL.lat, lon:PL.lon, rot:0});
}
// ================= Jubilee Bridge (2015; Cox Architects + architects61, Arup), Merlion Park - Esplanade =================
// Wikipedia / Arup / e-architect: pedestrian balanced-cantilever bridge, 220 m long, 6 m wide, three spans (longest 95 m)
// carried on two twin-blade post-tensioned concrete piers; a curving single-cell box girder 1.5 m deep at mid-span and 3.5 m at
// the piers, thin edges; stone-tiled deck, slender stainless-steel cable balustrade, polished stainless coved edging with
// concealed LEDs washing the soffit. It runs on the river side of the Esplanade Bridge and replaces the app's path (OSM
// 'Jubilee Bridge'). Pier stations (side spans equal) and the deck's rise (to ~7 m over the water) are estimates.
{
const A0 = [1.287976, 103.854354];
const LN0 = [[7.9,109.0],[1.9,89.5],[-1.1,69.3],[-2.0,56.2],[-2.8,43.2],[-1.7,22.7],[-0.5,2.3],[3.4,-17.0],[9.1,-33.3],[14.8,-49.6],[24.0,-68.9],[34.6,-84.1],[45.2,-99.4]];
// smooth resampled centreline: [x, z, s]
const RS = (() => { const P = LN0, S = [0]; for (let i = 1; i < P.length; i++) S.push(S[i-1] + Math.hypot(P[i][0] - P[i-1][0], P[i][1] - P[i-1][1]));
  const at = s => { for (let i = 0; i < P.length - 1; i++) if (s <= S[i+1] || i === P.length - 2){ const t = Math.min(1, Math.max(0, (s - S[i])/(S[i+1] - S[i]))); return [P[i][0] + (P[i+1][0] - P[i][0])*t, P[i][1] + (P[i+1][1] - P[i][1])*t]; } };
  const L = S[S.length - 1], n = Math.round(L/2), out = [];
  for (let k = 0; k <= n; k++){ const s = L*k/n; let x = 0, z = 0, c = 0; for (let d = -6; d <= 6; d += 2){ const q = at(Math.min(L, Math.max(0, s + d))); x += q[0]; z += q[1]; c++; } out.push([x/c, z/c, s]); }
  out[0] = [P[0][0], P[0][1], 0]; out[n] = [P[P.length-1][0], P[P.length-1][1], L]; return {pts:out, L}; })();
const MID = RS.pts[Math.round(RS.pts.length/2)];
const C0 = [(LN0[0][0] + LN0[LN0.length-1][0] + MID[0]*2)/4, (LN0[0][1] + LN0[LN0.length-1][1] + MID[1]*2)/4];
LANDMARKS.sgjubilee = {zh:'禧庆桥', en:'Jubilee Bridge', cat:'new', r:120, h:9,
  lt:{m:0, c:'#e8f0ff', k:0.7, e:0.8}, build(){
  const g = new THREE.Group(), B = mkB();
  const CON = {c:'#e4e2dc', m:0}, SOF = {c:'#d2d0ca', m:0, lc:'#cfe6ff', lk:1.3}, TILE = '#c8c1b3', STEEL = {c:'#d9dde0', m:0, lk:0.4},
    EDGE = {c:'#e9edf0', glow:'#cfe4ff', gk:0.9}, CABLE = '#9aa2a6', FOUND = '#a49e92';
  const L = RS.L, SP1 = (L - 95)/2, SP2 = (L + 95)/2, HW = 3.0;
  const yDeck = s => -0.45 + 7.2*Math.pow(Math.sin(PI*Math.min(1, Math.max(0, s/L))), 0.55);
  const depth = s => { const d = Math.min(Math.abs(s - SP1), Math.abs(s - SP2)); return Math.max(0.5, Math.min(1, s/10, (L - s)/10))*(1.5 + 2.0*Math.pow(Math.max(0, 1 - d/45), 1.6)); };
  const P = RS.pts.map(([x, z, s], i, A) => { const a = A[Math.max(0, i - 1)], b = A[Math.min(A.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1;
    return {x: x - C0[0], z: z - C0[1], s, nx: -dz/l, nz: dx/l, y: yDeck(s), d: depth(s)}; });
  const at = (p, v, y) => [p.x + p.nx*v, y, p.z + p.nz*v];
  for (let i = 0; i < P.length - 1; i++){ const a = P[i], b = P[i+1];
    // deck surface, edge fascia (polished stainless), box girder webs and bottom
    quadP(B.p(TILE), at(a, -HW, a.y), at(b, -HW, b.y), at(b, HW, b.y), at(a, HW, a.y));
    for (const s of [-1, 1]){
      quadP(B.p(EDGE), at(a, s*HW, a.y + 0.08), at(b, s*HW, b.y + 0.08), at(b, s*HW, b.y - 0.35), at(a, s*HW, a.y - 0.35));
      quadP(B.p(SOF), at(a, s*HW, a.y - 0.35), at(b, s*HW, b.y - 0.35), at(b, s*1.7, b.y - b.d), at(a, s*1.7, a.y - a.d));
    }
    quadP(B.p(SOF), at(a, -1.7, a.y - a.d), at(b, -1.7, b.y - b.d), at(b, 1.7, b.y - b.d), at(a, 1.7, a.y - a.d));
    // cable balustrade: top rail and five cables per side
    for (const s of [-1, 1]){ segP(B.p(STEEL), at(a, s*(HW - 0.1), a.y + 1.2), at(b, s*(HW - 0.1), b.y + 1.2), 0.05, 4);
      for (let k = 1; k <= 4; k++) segP(B.p(CABLE), at(a, s*(HW - 0.1), a.y + 0.24*k), at(b, s*(HW - 0.1), b.y + 0.24*k), 0.012, 3);
      if (i % 1 === 0) segP(B.p(STEEL), at(a, s*(HW - 0.1), a.y), at(a, s*(HW - 0.1), a.y + 1.2), 0.035, 4); }
  }
  // twin-blade piers at the two pier stations
  for (const sp of [SP1, SP2]){ const p = P.reduce((m, q) => Math.abs(q.s - sp) < Math.abs(m.s - sp) ? q : m, P[0]), tx = -p.nz, tz = p.nx;
    for (const s of [-1, 1]){ const c = [p.x + tx*s*1.3, p.z + tz*s*1.3];
      const blade = [[c[0] + p.nx*1.6, c[1] + p.nz*1.6], [c[0] + tx*0.35 + p.nx*0.0, c[1] + tz*0.35], [c[0] - p.nx*1.6, c[1] - p.nz*1.6], [c[0] - tx*0.35, c[1] - tz*0.35]];
      prismP(B.p(CON), blade, -6, p.y - p.d + 0.05); } }
  // abutment pads at both ends
  for (const p of [P[0], P[P.length - 1]]) bxF(B.p(FOUND), frame(p.x, p.z, Math.atan2(p.nz, p.nx)), -3.5, 3.5, -3, p.y - 0.05, -3, 3);
  B.flush(g); return g; }};
const PL = LL40(A0[0], A0[1], C0[0], C0[1]);
SG_PLACES.push({type:'sgjubilee', lat:PL.lat, lon:PL.lon, rot:0});
}
// ================= Marina Bay Cruise Centre Singapore (2012, RSP + Bermello Ajamil & Partners), Marina Coastal Drive =================
// Wikiwand / RSP / MBCCS: opened Oct 2012, 3 floors, a low terminal with "cubistic, undulating roofs inspired by waves" that form a
// grand entrance where they meet the ground-transport hall; a 395 m x 18 m berth (OSM 'pier' area, drawn by the app), car park behind.
// Plans: OSM w510913019 (terminal, 14.4 m) with its five raised roof parts (17.1 / 20.4 m), and the car park w187888615 with its
// three deck parts (10.5 / 13.8 / 17.1 m). The raised parts are modelled as wedges rising towards the sea (wave crests); the
// glazing split and the colours are estimates. Gangways / aerobridges on the berth are left out (positions not in the data).
// Night: the glass halls glow, the roof waves floodlit cool white.
{
const A0 = [1.265726, 103.860819];
const TER0 = [[86.6,35.4],[10.2,91.1],[-90.1,-42.9],[-80.0,-42.3],[-74.6,-44.1],[-20.3,-83.2],[-17.9,-92.1],[-17.3,-97.5]];
const WAV0 = [[[4.8,-49.4],[18.5,-30.5],[-28.0,4.5],[-42.9,-14.5],[-18.5,-21.0],[-10.7,-25.7]], [[40.6,-19.8],[47.2,-10.9],[23.9,6.3],[16.8,-3.2],[29.3,-6.2],[32.9,-8.5]],
  [[50.8,21.7],[59.1,32.4],[41.8,44.3],[34.7,34.8],[46.0,32.4]], [[21.5,42.5],[29.3,53.1],[12.6,65.0],[5.4,55.5],[16.2,53.1]], [[-5.3,13.4],[1.2,22.9],[-21.5,39.5],[-29.2,30.6],[-16.7,27.1],[-13.1,24.7]]];
const WTOP = [20.4, 20.4, 17.1, 17.1, 20.4];
const CP0 = [[-74.6,-44.1],[-150.4,-145.5],[-114.6,-156.2],[-91.3,-189.4],[-20.3,-83.2]];
const CPP0 = [[[-66.2,-118.2],[-39.4,-80.3],[-48.9,-67.8],[-65.6,-64.3],[-91.3,-101.0]], [[-86.5,-174.0],[-25.6,-86.8],[-75.2,-51.8],[-139.1,-133.1],[-103.8,-142.0]]];
const C0 = [-28, -52];
const [TER, CP, ...rest] = shAll([TER0, CP0, ...WAV0, ...CPP0], C0), WAV = rest.slice(0, 5), CPP = rest.slice(5);
LANDMARKS.sgmbcc = {zh:'滨海湾邮轮中心', en:'Marina Bay Cruise Centre Singapore', cat:'new', r:158, h:20.4,
  lt:{m:0, c:'#e6f0ff', k:0.75, e:0.8}, build(){
  const g = new THREE.Group(), B = mkB();
  const WALL = {c:'#d7d9d6', m:0}, GLS = {c:'#7f9ea6', m:0, glow:'#ffe7c4', gk:0.65}, ROOF = {c:'#c9cdcf', m:0, lk:0.5}, ROOF2 = {c:'#aeb6ba', m:0, lk:0.5}, MUL = '#e8eae8',
    FOUND = '#a9a59c', DECK = '#8c8a84', CPW = {c:'#c4c1b8', m:0, lk:0.3}, CAN = {c:'#e9ebea', m:0}, COLM = '#bcb9b0';
  // ---- terminal hall: solid base, glazed upper hall on the long sides, flat roof at 14.4 m ----
  wallP(B.p(FOUND), TER, -5, 0.3); capP(B.p(FOUND), TER, 0.3);
  prismP(B.p(WALL), TER, 0.3, 5.5);
  prismP(B.p(GLS), offP(TER, 0.8), 5.5, 13.4);
  const E = edgesF(TER);
  for (const e of E){ if (e.L < 8) continue; const n = Math.round(e.L/4.5);
    for (let k = 0; k <= n; k++) slabP(B.p(MUL), rectO(k*e.L/n - 0.15, k*e.L/n + 0.15, 5.5, 13.4), e.F, -0.8, 0.1);
    shapeP(B.p(MUL), rectO(0, e.L, 9.3, 9.7), e.F, -0.7); }
  prismP(B.p(ROOF2), offP(TER, -1.2), 13.4, 14.4);
  // ---- the roof waves: each raised part a wedge rising from the flat roof to its crest towards the sea (SE) ----
  const ax = Math.atan2(TER[0][1] - TER[1][1], TER[0][0] - TER[1][0]);   // across the building, towards the berth side
  const dx = Math.cos(ax), dz = Math.sin(ax);
  WAV.forEach((P, i) => {
    const pr = P.map(p => p[0]*dx + p[1]*dz), lo = Math.min(...pr), hi = Math.max(...pr), top = WTOP[i] + 1.5;
    const yAt = p => 14.4 + (top - 14.4)*Math.pow(Math.min(1, Math.max(0, ((p[0]*dx + p[1]*dz) - lo)/(hi - lo))), 0.8);
    const Q = offP(P, -1.0);
    // sloped roof plane + side walls (glazed clerestory under the crest)
    const tris = THREE.ShapeUtils.triangulateShape(Q.map(p => new THREE.Vector2(p[0], p[1])), []);
    for (const [a, b, c] of tris) triP(B.p(ROOF), [Q[a][0], yAt(Q[a]), Q[a][1]], [Q[b][0], yAt(Q[b]), Q[b][1]], [Q[c][0], yAt(Q[c]), Q[c][1]]);
    for (let k = 0; k < Q.length; k++){ const a = Q[k], b = Q[(k + 1) % Q.length];
      quadP(B.p(GLS), [a[0], 14.4, a[1]], [b[0], 14.4, b[1]], [b[0], yAt(b) - 0.6, b[1]], [a[0], yAt(a) - 0.6, a[1]]);
      quadP(B.p(CAN), [a[0], yAt(a) - 0.6, a[1]], [b[0], yAt(b) - 0.6, b[1]], [b[0], yAt(b) + 0.05, b[1]], [a[0], yAt(a) + 0.05, a[1]]); }
    // standing-seam ribs along the slope
    seams(Q, yAt, 0.12);
  });
  // seam lines on the flat roof (between the waves)
  function seams(Q, yf, dy){ const px = -dz, pz = dx, pr = Q.map(p => p[0]*px + p[1]*pz), ql = Q.map(p => p[0]*dx + p[1]*dz);
    const a0 = Math.min(...pr), a1 = Math.max(...pr), b0 = Math.min(...ql), b1 = Math.max(...ql);
    for (let t = a0 + 1.5; t < a1; t += 3.0){ let prev = null;
      for (let s = b0; s <= b1 + 0.01; s += 3.0){ const x = px*t + dx*s, z = pz*t + dz*s, ins = inPolyS(Q, x, z);
        const p = ins ? [x, yf([x, z]) + dy, z] : null; if (p && prev) segP(B.p(ROOF2), prev, p, 0.07, 3); prev = p; } } }
  seams(offP(TER, 1.5), () => 14.4, 0.05);
  // ---- car park: three stepped decks with open sides ----
  wallP(B.p(FOUND), CP, -5, 0.3); capP(B.p(FOUND), CP, 0.3);
  for (const [P, top] of [[CP, 10.5], [CPP[1], 13.8], [CPP[0], 17.1]]){
    for (let y = 3.5; y <= top + 0.01; y += 3.5){ const yy = Math.min(y, top); prismP(B.p(DECK), P, yy - 0.5, yy); bandAtP(B.p(CPW), P, yy - 0.5, 1.6, 0.05); }
    for (const [x, z] of alongP(P, 8)) segP(B.p(COLM), [x, 0.3, z], [x, top, z], 0.35, 4);
  }
  B.flush(g); return g; }};
const PL = LL40(A0[0], A0[1], C0[0], C0[1]);
SG_PLACES.push({type:'sgmbcc', lat:PL.lat, lon:PL.lon, rot:0});
}
// ================= Marina South Pier (2006), 31 Marina Coastal Drive =================
// MPA launch release (30 Jun 2006): ~5,000 m2 ferry terminal for the Southern Islands with a "striking wave-like roof shelter", a
// waiting hall on the first floor for 3,000 people, an open roof deck with a viewing gallery. OSM w155110820 (2 floors, 7 m) with
// its serrated landward edge; the two covered gangways to the floating pontoons follow the OSM footways that run out to sea.
// Roof wave count / height and the pontoon size are estimates. Night: lit hall, lit gangway canopies.
{
const A0 = [1.270903, 103.863192];
const PIER0 = [[-44.4,1.7],[-39.6,1.7],[-37.2,-2.4],[-31.8,-4.2],[-28.8,-7.8],[-23.5,-10.1],[-20.5,-14.3],[-15.7,-16.1],[-12.7,-20.2],[-7.9,-22.0],[-5.0,-25.5],[-0.2,-27.9],[2.8,-31.5],[7.0,-33.8],[8.8,-33.8],[11.8,-38.0],[17.1,-39.2],[20.7,-43.3],[42.2,-15.5],[33.3,-8.9],[39.8,0.5],[-18.7,42.1],[-27.0,30.8],[-35.4,36.7],[-40.2,30.2],[-29.4,22.5],[-44.4,2.9]];
const GW0 = [[[-18,50],[2,79]], [[16,25],[54,76]]];
const C0 = [0, 8];
const [PIER] = shAll([PIER0], C0), GW = GW0.map(L => shP(L, C0[0], C0[1]));
LANDMARKS.sgmsouthpier = {zh:'滨海南码头', en:'Marina South Pier', cat:'new', r:102, h:13,
  lt:{m:0, c:'#fff0d8', k:0.7, e:0.8}, build(){
  const g = new THREE.Group(), B = mkB();
  const WALL = {c:'#e2e0da', m:0}, GLS = {c:'#86a2a8', m:0, glow:'#ffe6c0', gk:0.7}, ROOF = {c:'#d8dcdc', m:0, lk:0.55}, STL = '#9aa3a6', FOUND = '#aaa59a',
    DECK = '#8f8b83', PONT = '#9a968c', CAN = {c:'#e7e9e6', m:0, glow:'#fff0d0', gk:0.25}, RAIL = '#59605f';
  wallP(B.p(FOUND), PIER, -5, 0.3); capP(B.p(FOUND), PIER, 0.3);
  // hall: glazed ground floor behind a solid base band, upper floor, roof deck
  prismP(B.p(GLS), offP(PIER, 1.2), 0.3, 6.6); bandAtP(B.p(WALL), offP(PIER, 1.2), 0.3, 0.9, 0.05);
  for (const e of edgesF(offP(PIER, 1.2))){ if (e.L < 3) continue; const n = Math.max(1, Math.round(e.L/3)); for (let k = 0; k <= n; k++) slabP(B.p(STL), rectO(k*e.L/n - 0.1, k*e.L/n + 0.1, 0.3, 6.6), e.F, 0, 0.15); }
  prismP(B.p(WALL), PIER, 6.6, 7.4); parP(B.p(STL), PIER, 7.4, 8.5, 0.12);
  // the wave roof shelter over the roof deck: a sheet rising and falling in three waves along the long axis
  const ax = Math.atan2(PIER[18][1] - PIER[20][1], PIER[18][0] - PIER[20][0]);  // along the long sea-side edge
  const F = frame(-2, -3, Math.atan2(PIER[20][1] - PIER[21][1], PIER[20][0] - PIER[21][0]));
  const LU = 34, LV = 15, NU = 24, NV = 6, S = [];
  for (let i = 0; i <= NU; i++){ const row = [], u = -LU + 2*LU*i/NU; for (let j = 0; j <= NV; j++){ const v = -LV + 2*LV*j/NV; row.push(F(u, 11.0 + 1.8*Math.sin(u/LU*PI*1.5) + 0.6*Math.cos(v/LV*HP), v)); } S.push(row); }
  sheetP(B.p(ROOF), S); sheetP(B.p(ROOF), S.map(r => r.map(p => [p[0], p[1] - 0.35, p[2]])));
  for (let i = 0; i <= NU; i += 4) for (const j of [0, NV]){ const p = S[i][j]; segP(B.p(STL), [p[0], 7.4, p[2]], [p[0], p[1] - 0.3, p[2]], 0.25, 6); }
  // covered gangways out to the pontoons
  for (const [a, b] of GW){
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = Math.hypot(b[0] - a[0], b[1] - a[1]), G = frame(a[0], a[1], ang);
    bxF(B.p(DECK), G, 0, L, 0.6, 1.0, -1.6, 1.6); for (const s of [-1, 1]) for (let u = 0; u <= L; u += 4) segP(B.p(STL), G(u, 1.0, s*1.6), G(u, 3.6, s*1.6), 0.08, 4);
    for (const s of [-1, 1]) segP(B.p(RAIL), G(0, 2.0, s*1.6), G(L, 2.0, s*1.6), 0.05, 4);
    const R = []; for (let i = 0; i <= 6; i++){ const t = i/6 - 0.5; R.push([G(0, 3.6 + 0.6*(1 - 4*t*t), t*4.0), G(L, 3.6 + 0.6*(1 - 4*t*t), t*4.0)]); }
    for (let i = 0; i < 6; i++) quadP(B.p(CAN), R[i][0], R[i][1], R[i+1][1], R[i+1][0]);
    bxF(B.p(PONT), G, L - 2, L + 14, -1.0, 0.6, -4.5, 4.5);
  }
  B.flush(g); return g; }};
const PL = LL40(A0[0], A0[1], C0[0], C0[1]);
SG_PLACES.push({type:'sgmsouthpier', lat:PL.lat, lon:PL.lon, rot:0});
}
// ================= Six Battery Road (1984, P&T Architects & Engineers + RSP), Raffles Place =================
// Wikipedia: 174 m roof, 44 floors, modernist, brown granite finish, concrete structure; on the river side of Raffles Place.
// The 174 m tower is the elongated-hexagon building:part of OSM w172916311 (the named footprint is the 12 m podium round it).
// Facade rhythm (granite piers / spandrels round strip windows) and the podium height are estimates. Night: lit windows.
{
const A0 = [1.285480, 103.851811];
// podium trimmed on the east to the tower face: the neighbouring block (Bank of China side) reaches the tower in the app data
const POD0 = [[-10.0,30.2],[-32.1,39.7],[-36.8,37.3],[-33.3,-13.1],[18.1,-36.8],[27.6,-30.8],[24.0,14.8]];
const TWR0 = [[-2.2,-27.9],[18.1,-36.8],[28.2,-30.3],[24.0,14.8],[3.1,24.3],[-6.4,17.8]];
const C0 = pcen([[-10.0,30.2],[-32.1,39.7],[-36.8,37.3],[-33.3,-13.1],[24.0,-39.8],[44.3,5.3]]), [POD, TWR] = shAll([POD0, TWR0], C0);
LANDMARKS.sgsixbattery = {zh:'炮台路六号大厦', en:'Six Battery Road', cat:'new', r:54, h:174,
  lt:{m:1, c:'#ffe0b8', k:0.55}, build(){
  const g = new THREE.Group(), B = mkB();
  const GRN = {c:'#7c5f4e', m:0, lk:0.2}, GRD = {c:'#6a5042', m:0, lk:0.2}, WIN = {c:'#3c4447', m:1, fh:3.95, cw:2.6}, LOB = {c:'#a9b6b4', m:0, glow:'#ffdcae', gk:0.8},
    FOUND = '#a99c8e', PAVE = '#bdb3a5', ROOF = '#8c867f', LAV = {c:'#c22', glow:'#ff2a1a', gk:2};
  const YP = 12, YT = 174, FH = 3.95;
  wallP(B.p(FOUND), POD, -5, 0.3); capP(B.p(PAVE), POD, 0.3);
  // podium: glazed shopfronts and banking hall behind granite piers
  prismP(B.p(LOB), offP(POD, 1.0), 0.3, YP - 1.2); prismP(B.p(GRN), POD, YP - 1.2, YP); capP(B.p(ROOF), POD, YP + 0.01);
  for (const [x, z] of alongP(POD, 6)) boxP(B.p(GRN), 1.0, YP - 1.2, 1.0, x, 0.3, z);
  // tower: granite skin with strip windows
  prismP(B.p(WIN), offP(TWR, 0.5), YP, YT - 3);
  for (let y = YP; y < YT - 4; y += FH) bandAtP(B.p(GRN), TWR, y, 1.55, 0.0);
  for (const e of edgesF(TWR)){ const n = Math.max(1, Math.round(e.L/4.6)); for (let k = 0; k <= n; k++){ const w = k === 0 || k === n ? 0.9 : 0.32; slabP(B.p(GRD), rectO(Math.max(0, k*e.L/n - w), Math.min(e.L, k*e.L/n + w), YP, YT - 3), e.F, -0.5, 0.18); } }
  // crown: solid granite band round the roof plant
  prismP(B.p(GRN), TWR, YT - 3, YT); capP(B.p(ROOF), offP(TWR, 0.4), YT - 0.6);
  const c = pcen(TWR); boxP(B.p(GRD), 14, 5, 9, c[0], YT, c[1], 1.36); boxP(B.p(LAV), 0.5, 0.5, 0.5, c[0], YT + 5, c[1]);
  B.flush(g); return g; }};
const PL = LL40(A0[0], A0[1], C0[0], C0[1]);
SG_PLACES.push({type:'sgsixbattery', lat:PL.lat, lon:PL.lon, rot:0});
}
// ================= Singapore Land Tower (1980, P&T + Architects 61; regeneration 2025 by Maki and Associates), 50 Raffles Place =================
// Wikipedia: 190 m roof, 48 floors. Maki and Associates (2025): reclad in white-fritted low-e double glazing in a new curtain wall,
// an extra amenity floor (49 storeys); Singapore Land: a new roof crown to raise its skyline presence, a rooftop gallery and
// viewing deck on the 49th storey, a podium roof garden. Plans: tower OSM w46595418 (40 m square), podium w939684168 (14.4 m).
// The crown's form (an open frame of white fins round the deck) is an estimate. Night: lit floors, the crown glowing white.
{
const A0 = [1.284714, 103.852019];
const POD0 = [[-28.4,-3.5],[3.3,-27.8],[40.3,-25.4],[35.5,22.6],[28.4,22.6],[26.0,39.8],[-33.1,29.7],[-30.1,-3.5]];
const TWR0 = [[-28.4,-3.5],[3.3,-27.8],[28.4,3.0],[-3.3,27.9]];
const C0 = pcen(TWR0), [POD, TWR] = shAll([POD0, TWR0], C0);
LANDMARKS.sgsltower = {zh:'新置地大厦', en:'Singapore Land Tower', cat:'new', r:52, h:198,
  lt:{m:1, c:'#f2f6ff', k:0.6}, build(){
  const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
  const GLW = {c:'#c9d2d6', m:1, fh:3.8, cw:2.8}, FIN = {c:'#eef0ef', m:0, lk:0.3}, BAND = {c:'#dfe3e2', m:0, lk:0.2}, LOB = {c:'#b7c5c6', m:0, glow:'#ffe6c4', gk:0.85},
    PODC = {c:'#d3d6d3', m:0}, FOUND = '#b0aca2', PAVE = '#c1bbaf', CROWN = {c:'#f4f5f2', m:0, lc:'#eaf2ff', lk:1.4, glow:'#e8f0ff', gk:0.35}, DECK = '#9a9690',
    LEAF = {c:'#4c7a3c', m:0, lk:0.1}, TRK = '#5b4a3a', LAV = {c:'#c22', glow:'#ff2a1a', gk:2};
  const YP = 14.4, YL = 18, YR = 190, YC = 198;
  wallP(B.p(FOUND), POD, -5, 0.3); capP(B.p(PAVE), POD, 0.3);
  // podium with roof garden
  prismP(B.p(LOB), offP(POD, 1.0), 0.3, 6.5); prismP(B.p(PODC), POD, 6.5, YP); bandAtP(B.p(BAND), POD, 9.5, 0.6, 0.1);
  capP(B.p(LEAF), offP(POD, 1.2), YP + 0.02); parP(B.p(PODC), POD, YP, YP + 1.1, 0.3);
  for (let i = 0; i < 18; i++){ const x = (R() - 0.5)*70, z = (R() - 0.5)*70; if (inPolyS(offP(POD, 3), x, z) && !inPolyS(offP(TWR, -3), x, z)) treeP(B.p(TRK), B.p(LEAF), x, YP, z, 1.0, R); }
  // tower: white-fritted curtain wall, fine vertical fins, floor lines; glazed lobby base
  prismP(B.p(LOB), offP(TWR, 1.5), YP, YL); prismP(B.p(GLW), TWR, YL, YR);
  facadeP(B, TWR, YL, YR, {mul:FIN, band:BAND, bay:1.5, fd:0.3, fw:0.07, fh:3.8, bh:0.35});
  for (const p of TWR) segP(B.p(FIN), [p[0], YP, p[1]], [p[0], YR, p[1]], 0.6, 6);
  // 49th-storey gallery / viewing deck and the crown frame
  capP(B.p(DECK), TWR, YR + 0.02);
  prismP(B.p(LOB), offP(TWR, 5), YR, YR + 5);
  for (const e of edgesF(TWR)){ const n = Math.round(e.L/2.5); for (let k = 0; k <= n; k++) slabP(B.p(CROWN), rectO(k*e.L/n - 0.12, k*e.L/n + 0.12, YR, YC), e.F, -0.2, 0.25);
    shapeP(B.p(CROWN), rectO(0, e.L, YC - 0.8, YC), e.F, 0.26); shapeP(B.p(CROWN), rectO(0, e.L, YR + 1.0, YR + 1.6), e.F, 0.26); }
  for (const p of TWR) boxP(B.p(LAV), 0.5, 0.5, 0.5, p[0]*0.97, YC, p[1]*0.97);
  B.flush(g); return g; }};
const PL = LL40(A0[0], A0[1], C0[0], C0[1]);
SG_PLACES.push({type:'sgsltower', lat:PL.lat, lon:PL.lon, rot:0});
}
// ================= One Raffles Quay (2006, Kohn Pedersen Fox with Architects 61), 1 Raffles Quay =================
// North Tower 245 m / 50 storeys, South Tower 140 m / 29 storeys (Meinhardt, Wikipedia list) on a shared multi-level base; a covered
// plaza with bamboo and water bridges the two towers (architects61); transparent glass curtain wall with a slight green tint,
// prefabricated unitised glass-and-metal units (Heintges). Plans: OSM w47345006 (site), w172915345 (North), w172915347 (South).
// Mullion spacing, the base height (12 m) and the plaza canopy are estimates. Night: lit floors, lit crown edges.
{
const A0 = [1.281186, 103.851898];
const SITE0 = [[25.1,-76.3],[71.1,-47.3],[-18.5,87.3],[-38.2,67.2],[-68.0,41.1],[-16.7,-39.0],[18.5,-81.1]];
const NT0 = [[11.4,-2.8],[-5.9,-31.9],[-4.7,-33.0],[-9.5,-36.6],[37.6,-66.2],[39.4,-60.3],[41.2,-61.5],[59.1,-32.4]];
const ST0 = [[-17.3,67.2],[-57.3,38.1],[-31.6,-3.4],[8.4,22.7]];
const C0 = pcen(SITE0), [SITE, NT, ST] = shAll([SITE0, NT0, ST0], C0);
LANDMARKS.sgorq = {zh:'莱佛士码头一号', en:'One Raffles Quay', cat:'new', r:90, h:245,
  lt:{m:1, c:'#e0f2ff', k:0.6}, build(){
  const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
  const GL = {c:'#6f9a92', m:1, fh:4.3, cw:3.0}, MUL = {c:'#c8d2cf', m:0, lk:0.15}, BAND = {c:'#96aaa5', m:0, lk:0.15}, LOB = {c:'#b4c6c2', m:0, glow:'#ffe4be', gk:0.85},
    BASE = {c:'#cfd2cd', m:0}, CAN = {c:'#dfe4e2', m:0, op:0.75}, FOUND = '#aaa69c', PAVE = '#c0baae', ROOF = '#8b9190', LED = {c:'#e4ecea', m:0, lc:'#cfeaff', lk:1.3, glow:'#cfeaff', gk:0.3},
    LEAF = {c:'#5c8a3e', m:0, lk:0.1}, TRK = '#6b5a3a', WAT = {c:'#5f8fa0', glow:'#3f7fa0', gk:0.3}, LAV = {c:'#c22', glow:'#ff2a1a', gk:2};
  const YB = 12, YN = 245, YS = 140;
  wallP(B.p(FOUND), SITE, -5, 0.3); capP(B.p(PAVE), SITE, 0.3);
  // base: podium blocks under both towers, the covered plaza between with bamboo and water
  for (const P of [offP(NT, -6), offP(ST, -6)]){ prismP(B.p(LOB), offP(P, 1.2), 0.3, 6.0); prismP(B.p(BASE), P, 6.0, YB); capP(B.p(ROOF), P, YB + 0.01); }
  const PZ = offP(SITE, 4);
  for (let i = 0; i < 40; i++){ const x = (R() - 0.5)*120, z = (R() - 0.5)*150; if (!inPolyS(PZ, x, z) || inPolyS(offP(NT, -7), x, z) || inPolyS(offP(ST, -7), x, z)) continue;
    segP(B.p(LEAF), [x, 0.3, z], [x + (R() - 0.5), 6 + R()*3, z + (R() - 0.5)], 0.35, 4); }
  const nc = pcen(NT), sc = pcen(ST), mc = [(nc[0] + sc[0])/2, (nc[1] + sc[1])/2], ang = Math.atan2(sc[1] - nc[1], sc[0] - nc[0]);
  const CANP = rectA(mc[0], mc[1], 18, 22, ang); capP(B.p(CAN), CANP, YB + 3); for (const p of CANP) segP(B.p(MUL), [p[0], 0.3, p[1]], [p[0], YB + 3, p[1]], 0.3, 6);
  capP(B.p(WAT), rectA(mc[0], mc[1], 10, 4, ang), 0.35);
  // towers: tinted glass, unitised mullions, floor lines; crown band and recessed plant screen
  for (const [P, YT] of [[NT, YN], [ST, YS]]){
    prismP(B.p(GL), P, YB, YT - 6); facadeP(B, P, YB, YT - 6, {mul:MUL, band:BAND, bay:1.5, fd:0.25, fw:0.06, fh:4.3, bh:0.3});
    for (const p of P) segP(B.p(MUL), [p[0], YB, p[1]], [p[0], YT - 6, p[1]], 0.35, 6);
    wallP(B.p(MUL), P, YT - 6, YT); capP(B.p(ROOF), offP(P, 0.3), YT - 5);
    for (const e of edgesF(P)){ const n = Math.round(e.L/1.2); for (let k = 0; k < n; k++) shapeP(B.p(BAND), rectO((k + 0.15)*e.L/n, (k + 0.85)*e.L/n, YT - 5.5, YT - 0.6), e.F, 0.04); }
    bandAtP(B.p(LED), P, YT - 0.5, 0.5, 0.1); bandAtP(B.p(LED), P, YT - 6.5, 0.4, 0.1);
    const c = pcen(P); boxP(B.p(LAV), 0.5, 0.5, 0.5, c[0], YT, c[1]);
  }
  B.flush(g); return g; }};
const PL = LL40(A0[0], A0[1], C0[0], C0[1]);
SG_PLACES.push({type:'sgorq', lat:PL.lat, lon:PL.lon, rot:0});
}
// ================= Frasers Tower (2018, DP Architects), 182 Cecil Street =================
// 38 office storeys over a three-storey retail podium, 235 m (PropertyGuru; CTBUH 230.9 m) on the corner of Cecil Street and
// Telok Ayer Street, the former Telok Ayer Performing Arts Centre site (EdgeProp). A contextual prism: the base flares outward and
// the form tapers towards the crown as the core steps in (DP Architects); glass, steel and vertical fins (Pixeo); a cascading,
// planted retail podium ('The Oasis') with terraces; a roof garden ('The Sky'); the park with a fountain in front.
// ANCHOR CORRECTED: T40's w47345029 is 71 Robinson Road (its POIs); the real footprint is OSM w627103707 'Fraser Tower' (tower part
// 0-235 m, podium part 0-10.5 m) next to the Telok Ayer Chinese Methodist Church -> SC/lm40/ref_sg40a_1.json.
// Taper ratio and fin spacing are estimates. Night: lit floors, the fins and crown edge lit white.
{
const A0 = [1.27870, 103.84740];
const SITE0 = [[12.3,27.1],[-30.7,2.2],[-23.6,-9.6],[-30.1,-13.2],[-33.1,-13.2],[-36.1,-10.2],[-40.3,-0.7],[-43.3,-0.2],[-47.4,-2.5],[-48.0,-8.5],[-45.0,-27.4],[-32.5,-62.4],[-0.9,-47.6],[41.5,-22.1]];
const TWR0 = [[-30.7,2.2],[-0.9,-47.6],[41.5,-22.1],[12.3,27.1]];
const POD0 = [[-0.9,-47.6],[-23.6,-9.6],[-30.1,-13.2],[-33.1,-13.2],[-36.1,-10.2],[-40.3,-0.7],[-43.3,-0.2],[-47.4,-2.5],[-48.0,-8.5],[-45.0,-27.4],[-32.5,-62.4]];
const C0 = pcen(TWR0), [SITE, TWR, POD] = shAll([SITE0, TWR0, POD0], C0);
LANDMARKS.sgfraserstower = {zh:'星狮大厦', en:'Frasers Tower', cat:'new', r:66, h:235,
  lt:{m:1, c:'#e6f2ff', k:0.6}, build(){
  const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
  const GL = {c:'#6e8f9c', m:1, fh:4.5, cw:3.0}, FIN = {c:'#d4dadc', m:0, lc:'#e8f2ff', lk:0.5}, BAND = {c:'#9db0b6', m:0, lk:0.15}, LOB = {c:'#b6c6c8', m:0, glow:'#ffe4bc', gk:0.85},
    PODC = {c:'#cfcdc6', m:0}, FOUND = '#aea89d', PAVE = '#c2bcb0', LEAF = {c:'#4e7e3c', m:0, lk:0.1}, LEAF2 = {c:'#5f8f45', m:0, lk:0.1}, TRK = '#5b4a3a', ROOF = '#8e9291',
    LED = {c:'#eef2f2', m:0, lc:'#e8f2ff', lk:1.4, glow:'#e0ecff', gk:0.3}, LAV = {c:'#c22', glow:'#ff2a1a', gk:2};
  const YL = 11, YT = 235;
  wallP(B.p(FOUND), SITE, -5, 0.3); capP(B.p(PAVE), SITE, 0.3);
  // cascading planted podium: three terraces stepping down to the west
  for (const [d, y] of [[0, 10.5], [5, 7.0], [10, 3.6]]){ const P = offP(POD, d); prismP(B.p(PODC), P, 0.3, y); capP(B.p(LEAF), offP(P, 0.6), y + 0.02);
    for (const [x, z] of alongP(offP(P, 1.2), 4)) if (R() < 0.55) latheP(B.p(LEAF2), [[0.1, y], [1.1, y + 0.4], [0.9, y + 1.3], [0.1, y + 1.6]], x, z, 6, R()*3); }
  prismP(B.p(LOB), offP(POD, 11), 0.3, 3.4);
  for (let i = 0; i < 6; i++){ const p = pcen(POD); treeP(B.p(TRK), B.p(LEAF), p[0] + (R() - 0.5)*14, 10.5, p[1] + (R() - 0.5)*14, 1.2, R); }
  // tower: flared base (the lowest ~8 storeys lean out), then a steady taper to the crown
  const c = pcen(TWR), sc = (P, f) => P.map(p => [c[0] + (p[0] - c[0])*f, c[1] + (p[1] - c[1])*f]);
  const LV = [[0.3, 0.93], [YL, 0.95], [48, 1.0], [YT - 4, 0.86]];
  const rings = LV.map(([y, f]) => sc(TWR, f).map(p => [p[0], y, p[1]]));
  prismP(B.p(LOB), sc(TWR, 0.9), 0.3, YL);
  const ringsGl = rings.slice(1); loftP(B.p(GL), ringsGl, false);
  // fins on every face following the taper, floor lines
  for (let i = 0; i < 4; i++){ const j = (i + 1) % 4; const L = Math.hypot(TWR[j][0] - TWR[i][0], TWR[j][1] - TWR[i][1]), n = Math.round(L/3.0);
    for (let k = 0; k <= n; k++){ const t = k/n, pts = ringsGl.map(r => { const a = r[i], b = r[j]; return [a[0] + (b[0] - a[0])*t, a[1], a[2] + (b[2] - a[2])*t]; });
      const o = pts.map(p => { const dx = p[0] - c[0], dz = p[2] - c[1], l = Math.hypot(dx, dz) || 1; return [p[0] + dx/l*0.45, p[1], p[2] + dz/l*0.45]; });
      for (let q = 0; q < pts.length - 1; q++) quadP(B.p(FIN), pts[q], pts[q+1], o[q+1], o[q]); } }
  for (let y = YL + 4.5; y < YT - 5; y += 4.5){ const f = y < 48 ? 0.95 + 0.05*(y - YL)/(48 - YL) : 1.0 - 0.14*(y - 48)/(YT - 4 - 48); bandAtP(B.p(BAND), sc(TWR, f), y - 0.2, 0.4, 0.05); }
  // crown: roof garden ('The Sky') behind a glass screen; lit edge
  const TOP = sc(TWR, 0.86); wallP(B.p(FIN), TOP, YT - 4, YT); capP(B.p(ROOF), TOP, YT - 3.9); capP(B.p(LEAF), offP(TOP, 2), YT - 3.8);
  for (let i = 0; i < 10; i++){ const x = c[0] + (R() - 0.5)*30, z = c[1] + (R() - 0.5)*30; if (inPolyS(offP(TOP, 3), x, z)) treeP(B.p(TRK), B.p(LEAF), x, YT - 3.8, z, 1.0, R); }
  bandAtP(B.p(LED), TOP, YT - 0.5, 0.5, 0.1); for (const p of TOP) boxP(B.p(LAV), 0.5, 0.5, 0.5, p[0]*0.97 + c[0]*0.03, YT, p[1]*0.97 + c[1]*0.03);
  B.flush(g); return g; }};
const PL = LL40(A0[0], A0[1], C0[0], C0[1]);
SG_PLACES.push({type:'sgfraserstower', lat:PL.lat, lon:PL.lon, rot:0});
}
// ================= URA Centre, 45 Maxwell Road =================
// Headquarters of the Urban Redevelopment Authority with the Singapore City Gallery (POI in the low south-west wing). Plans: OSM
// w47345221 (unnamed in the data, POI 'Singapore City Gallery' inside) with its parts: the 61 m office slab and the 13.8 m wing.
// The separate 10-storey East Wing (w171987820, across the service lane) is left to the app's block. Facade (concrete grid,
// glazing, roof) is not documented in the sources found -> generic, estimated. Night: lit floors.
{
const A0 = [1.279582, 103.845342];
const SLAB0 = [[28.2,34.5],[-26.2,-33.1],[-7.1,-48.5],[47.3,19.7]];
const WING0 = [[-31.5,-31.3],[20.4,33.3],[4.3,47.6],[-25.6,9.0],[-46.5,-24.8]];
const ALL0 = [[-31.5,-31.3],[-22.6,-20.0],[-18.4,-23.6],[-26.2,-33.1],[-7.1,-48.5],[47.3,19.7],[28.2,34.5],[19.8,24.4],[15.6,28.0],[20.4,33.3],[4.3,47.6],[-25.6,9.0],[-46.5,-24.8]];
const C0 = pcen(ALL0), [SLAB, WING, ALL] = shAll([SLAB0, WING0, ALL0], C0);
LANDMARKS.sgura = {zh:'市区重建局大厦', en:'URA Centre', cat:'new', r:58, h:61,
  lt:{m:1, c:'#ffe8c8', k:0.55}, build(){
  const g = new THREE.Group(), B = mkB();
  const CON = {c:'#d8d4ca', m:0, lk:0.2}, CON2 = {c:'#c4bfb3', m:0, lk:0.2}, GL = {c:'#4f6266', m:1, fh:3.9, cw:2.8}, LOB = {c:'#aebfc0', m:0, glow:'#ffe2b8', gk:0.85},
    FOUND = '#aca699', PAVE = '#c2bcb0', ROOF = '#918d86', LEAF = {c:'#4f7d3d', m:0, lk:0.1};
  wallP(B.p(FOUND), ALL, -5, 0.3); capP(B.p(PAVE), ALL, 0.3);
  // gallery wing
  prismP(B.p(LOB), offP(WING, 1.2), 0.3, 5.0); prismP(B.p(CON), WING, 5.0, 13.8); bandAtP(B.p(GL), WING, 7.0, 4.6, 0.04);
  for (const e of edgesF(WING)){ const n = Math.max(1, Math.round(e.L/6)); for (let k = 0; k <= n; k++) slabP(B.p(CON2), rectO(k*e.L/n - 0.4, k*e.L/n + 0.4, 0.3, 13.8), e.F, -1.2, 0.3); }
  capP(B.p(LEAF), offP(WING, 1), 13.82); parP(B.p(CON), WING, 13.8, 14.9, 0.3);
  // office slab: concrete frame, glazed bays, roof plant screen
  prismP(B.p(LOB), offP(SLAB, 1.5), 0.3, 6.0); prismP(B.p(GL), offP(SLAB, 0.4), 6.0, 57.5);
  for (let y = 6.0; y < 57; y += 3.9) bandAtP(B.p(CON), SLAB, y, 1.0, 0.0);
  for (const e of edgesF(SLAB)){ const n = Math.max(1, Math.round(e.L/4.2)); for (let k = 0; k <= n; k++){ const w = k === 0 || k === n ? 1.2 : 0.35; slabP(B.p(CON2), rectO(Math.max(0, k*e.L/n - w), Math.min(e.L, k*e.L/n + w), 0.3, 57.5), e.F, -0.4, 0.3); } }
  prismP(B.p(CON), SLAB, 57.5, 58.4); capP(B.p(ROOF), SLAB, 58.41);
  wallP(B.p(CON2), offP(SLAB, 6), 58.4, 61);
  B.flush(g); return g; }};
const PL = LL40(A0[0], A0[1], C0[0], C0[1]);
SG_PLACES.push({type:'sgura', lat:PL.lat, lon:PL.lon, rot:0});
}
}
