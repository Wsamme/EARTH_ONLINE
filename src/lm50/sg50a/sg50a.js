// ===== lm50/sg50a: Singapore CBD - Raffles Place, Battery Road, Collyer Quay, Robinson Road, Cecil Street, Shenton Way (City Brush lm50, real Singapore 1:1)
// Built in the map frame (local +x = east, +z = south, rot 0) on the real OSM footprints of R/lm50/ref_sg50a.json.
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
// ================= Bank of China Building, 4 Battery Road (sgboc, hero) =================
// Wikipedia: the old block (Palmer & Turner, completed Dec 1953, 16 storeys, 61 m to the roof; roots.gov.sg says 18 storeys) and
// the 2000 tower (36 storeys, 168 m) side by side on a shared podium. Plan from the OSM building:parts of w106193390: tower
// w172916312 (notched 24-point plan), the old block w1075238476 (Battery Road / Flint Street corner, OSM top 53.4 m), podium
// parts w1075238475 (23.7 m), w1075238477 / w1075238478 (20.4 m), w1075238474 (10.5 m).
// Look (photos, Wikimedia Commons): white stone tower with punched windows, deep dark vertical slots, carved lattice panels in the
// outer window columns, a stepped crown with recessed corners; the white old block / podium with rows of lattice panels.
// Night: floodlit white stone (warm), lit windows. No signs or lettering.
{
const A0 = [1.285696, 103.852268];
const SITE0 = [[22.6,7.6],[20.8,16.9],[6.2,24.0],[5.2,22.0],[-5.5,27.2],[-16.4,4.8],[-19.0,-0.7],[-25.2,-13.3],[-14.3,-18.6],[-8.9,-21.1],[5.3,-27.9],[11.5,-15.3],[14.0,-9.8]];
// the OSM tower ring (24 points, ragged where it meets the old block) fitted with its 34 x 31 m box at -24 deg, re-entrant corner notches
const TOW0 = notchR(-3.39, -6.94, 17.0, 15.4, -24*PI/180, 2.4);
const OLD0 = [[13.9,2.0],[10.1,3.0],[7.1,-0.5],[-1.9,3.7],[7.1,21.0],[19.1,15.0],[20.9,7.2],[14.9,-4.0]];
const P23_0 = [[-5.4,27.2],[7.1,21.0],[-1.9,3.7],[-4.6,5.0],[-4.1,9.7],[-7.6,11.5],[-13.1,9.0],[-15.4,4.2],[-16.4,4.9]];
const P20a0 = [[-25.1,-13.5],[-19.1,-0.5],[-17.9,-1.0],[-19.1,-4.0],[-16.6,-5.3],[-12.6,-15.3],[-14.4,-18.8]];
const P20b0 = [[5.3,-27.8],[-8.9,-21.3],[-7.1,-17.8],[4.9,-15.3],[8.9,-17.0],[10.1,-14.8],[11.4,-15.3]];
const P10_0 = [[12.6,-9.3],[20.9,7.2],[19.1,15.0],[5.4,22.0],[6.1,23.7],[20.9,16.7],[22.6,7.7],[13.9,-10.0]];
const C0 = pcen(TOW0), [SITE, TOW, OLD, P23, P20a, P20b, P10] = shAll([SITE0, TOW0, OLD0, P23_0, P20a0, P20b0, P10_0], C0);
LANDMARKS.sgboc = {zh:'中国银行大厦', en:'Bank of China Building', cat:'new', r:34, h:168,
  lt:{m:0, c:'#ffe9c8', k:0.55}, build(){
  const g = new THREE.Group(), B = mkB();
  const ST = {c:'#e9e5db', m:0, lk:0.55}, ST2 = {c:'#dcd6c9', m:0, lk:0.5}, ROOF = '#b9b4a9', FOUND = '#bdb7ab', PAVE = '#c6c0b4',
    WIN = {c:'#36434e', m:1, fh:4.2, cw:2.6}, SLOT = {c:'#24303a', m:1, fh:4.2, cw:1.6}, LAT = {c:'#cdc5b4', m:0, lk:0.4},
    OWIN = {c:'#3c4954', m:1, fh:3.4, cw:2.4}, LOB = {c:'#b8c2c4', m:0, glow:'#ffe2b8', gk:0.7}, LION = '#d6d0c2', MECH = '#8f9395';
  const Y1 = 150, Y2 = 160, Y3 = 166, YT = 168;
  foundP(B.p(FOUND), SITE); capP(B.p(PAVE), SITE, 0.3);
  // ---- tower: white stone walls; the short notch edges are the dark vertical slots ----
  const slot = e => e.L < 3 ? ST2 : null;
  wallsByEdge(B, TOW, 0.3, Y1, ST, slot);
  winP(B, TOW, 24, Y1 - 2, 4.2, 2.7, 1.25, 2.7, WIN, {minL:4.6, end:1, endCol:LAT});
  // a deeper slot down the middle of each long face (photo: twin dark slots with window strips)
  for (const e of edgesF(TOW)) if (e.L > 13) for (const f of [0.3, 0.7]){ slabP(B.p(SLOT), rectO(e.L*f - 1.1, e.L*f + 1.1, 24, Y1 + 4), e.F, 0.0, 0.12);
    for (const d of [-0.55, 0.55]) slabP(B.p(ST2), rectO(e.L*f + d - 0.06, e.L*f + d + 0.06, 24, Y1 + 4), e.F, 0.12, 0.2); }
  // string course at the crown base, then the stepped crown
  bandAtP(B.p(ST2), TOW, Y1 - 1.2, 1.2, 0.25);
  const T1 = offP(TOW, 0.9), T2 = scP(TOW, 0.72), T3 = scP(TOW, 0.5);
  wallsByEdge(B, T1, Y1, Y2, ST, slot); capP(B.p(ROOF), T1, Y2);
  winP(B, T1, Y1 + 1.5, Y2 - 1.5, 7, 3.4, 1.9, 5.2, SLOT, {minL:5});
  bandAtP(B.p(ST2), T1, Y2 - 0.8, 0.8, 0.2);
  blkP(B, T2, Y2, Y3, ST, ROOF); winP(B, T2, Y2 + 1, Y3 - 0.5, 4.5, 4, 1.2, 3.4, LAT, {minL:4});
  blkP(B, T3, Y3, YT, ST2, ROOF);
  // recessed corner steps: small set-back blocks at the long-edge ends (stepped silhouette)
  for (const e of edgesF(T1)) if (e.L > 9) for (const u of [2.2, e.L - 2.2]){ const p = e.F(u, 0, -2.4); boxP(B.p(ST), 3.2, Y3 - 1 - Y2, 3.2, p[0], Y2, p[2], -e.ang); }
  // roof plant
  boxP(B.p(MECH), 7, 2.2, 6, 0, YT, 0); lavP(B.p(LAV50), T3, YT);
  // ---- old block (1953): white stone, vertical window strips, a row of lattice panels at the top floor, raised centre ----
  wallP(B.p(ST), OLD, 0.3, 53.4); capP(B.p(ROOF), OLD, 53.4);
  winP(B, OLD, 6, 50, 3.4, 2.2, 1.2, 2.2, OWIN, {minL:5});
  winP(B, OLD, 50, 53.4, 3.4, 2.2, 1.7, 2.6, LAT, {minL:5, w:0.1});
  bandAtP(B.p(ST2), OLD, 53.4 - 0.8, 0.8, 0.3); bandAtP(B.p(ST2), OLD, 5.2, 0.8, 0.25);
  const OC = scP(OLD, 0.55); blkP(B, OC, 53.4, 58.2, ST, ROOF); bandAtP(B.p(ST2), OC, 57.6, 0.6, 0.2);
  const OC2 = scP(OLD, 0.3); blkP(B, OC2, 58.2, 61, ST2, ROOF);
  // entrance on Battery Road (south face) with two stone lions on plinths
  { const e = edgesF(OLD).reduce((a, b) => (b.a[1] + b.b[1] > a.a[1] + a.b[1] ? b : a));
    slabP(B.p(LOB), rectO(e.L/2 - 3, e.L/2 + 3, 0.3, 5), e.F, 0.02, 0.1);
    for (const s of [-1, 1]){ const p = e.F(e.L/2 + s*4.2, 0, 1.4); boxP(B.p(ST2), 1.2, 1.1, 1.8, p[0], 0.3, p[2], -e.ang);
      latheP(B.p(LION), [[0.5, 1.4], [0.55, 2.0], [0.42, 2.5], [0.3, 2.8], [0.01, 2.9]], p[0], p[2], 6); } }
  // ---- podium parts ----
  for (const [P, h] of [[P23, 23.7], [P20a, 20.4], [P20b, 20.4], [P10, 10.5]]){
    wallP(B.p(ST), P, 0.3, h); capP(B.p(ROOF), P, h); bandAtP(B.p(ST2), P, h - 0.7, 0.7, 0.15);
    winP(B, P, 5, h - 1.5, 4.2, 2.8, 1.6, 2.4, OWIN, {minL:4});
    bandAtP(B.p(LOB), P, 0.3, 4.4, 0.03);
  }
  B.flush(g); return g; }};
const PL = LL40(A0[0], A0[1], C0[0], C0[1]);
SG_PLACES.push({type:'sgboc', lat:PL.lat, lon:PL.lon, rot:0});
}
// ================= SGX Centre, 2 & 4 Shenton Way (sgsgx, hero) =================
// Wikipedia: twin towers SGX Centre One (2000) and Two (2001), 30 floors each, roof 172 m, antenna spire 187 m; Kohn Pedersen Fox
// with Architects 61; slightly arced so most floors look towards Marina Bay; vertical and horizontal fins on different sides;
// colonnaded walkways and a glass lobby on the first storey. Plans: OSM w47345025 (Tower One, NE) and w47345024 (Tower Two, SW)
// on the 3-storey podium w45098518 (app 11.1 m). Look (photo, Commons "SGX Centre Two"): warm-grey granite; the arced SE face
// with closely spaced vertical fins; the narrow end faces glass with deep horizontal sun-shade ledges between granite piers that
// rise into a crown frame with an open square at the top; a slim twin antenna mast above it.
// Night: lit office floors, crown frame washed white. No lettering (the real crown carries a tenant sign: left out).
{
const A0 = [1.279274, 103.849819];
const POD0 = [[36.7,-87.9],[-62.3,72.1],[-36.6,87.6],[61.9,-71.9]];
// tags: g granite flank, c arced fin face, e end face (glass + ledges), n notch
const T1raw = [[31.4,-71.9,'n'],[27.9,-66.6,'n'],[24.9,-68.9,'g'],[3.4,-33.4,'e'],[11.7,-28.1,'n'],[14.2,-31.6,'e'],[30.7,-21.4,'c']];
const T1arc = [[30.7,-21.4],[37.9,-33.9],[44.4,-46.9],[48.2,-61.9]];
const T2raw = [[-8.6,42.6,'e'],[-27.1,31.9,'n'],[-25.8,28.9,'n'],[-32.6,24.9,'g'],[-54.1,58.6,'g'],[-50.3,61.6,'g'],[-53.3,66.4,'e'],[-36.1,76.9,'c']];
const T2arc = [[-36.1,76.9],[-24.8,66.4],[-15.8,53.9],[-8.6,42.6]];
const mkT = (raw, arc, endTagAfterArc) => { const out = raw.slice(); const s = crChain(arc, 4); for (let i = 1; i < s.length - 1; i++) out.push([s[i][0], s[i][1], 'c']); out.push([arc[arc.length - 1][0], arc[arc.length - 1][1], endTagAfterArc]); return out; };
// Tower One: after the arc comes the NE end face (48.2,-61.9) -> (31.4,-71.9); Tower Two's arc ends at its inner end face vertex
const T1T = mkT(T1raw, T1arc, 'e'), T2T = (() => { const a = T2raw.slice(); const s = crChain(T2arc, 4); for (let i = 1; i < s.length - 1; i++) a.push([s[i][0], s[i][1], 'c']); return a; })();
const C0 = pcen(POD0);
const sh = T => T.map(t => [t[0] - C0[0], t[1] - C0[1], t[2]]);
const POD = shP(POD0, C0[0], C0[1]), TW = [tagP(sh(T1T)), tagP(sh(T2T))];
LANDMARKS.sgsgx = {zh:'新交所大厦', en:'SGX Centre', cat:'new', r:100, h:187,
  lt:{m:1, c:'#e8f0ff', k:0.55}, build(){
  const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
  const GR = {c:'#aaa59c', m:0, lk:0.35}, GR2 = {c:'#9b968d', m:0, lk:0.3}, GL = {c:'#46566a', m:1, fh:4.8, cw:1.6}, GLE = {c:'#4c5d70', m:1, fh:4.8, cw:3},
    LEDGE = {c:'#c9c6bf', m:0, lk:0.3}, ROOF = '#8e9192', MECH = '#727779', FOUND = '#bdb7ab', PAVE = '#c4beb2', LOB = {c:'#aebfc6', m:0, glow:'#ffe6c0', gk:0.75},
    MAST = '#c9cccd', MURAL = {c:'#8c8478', m:0, lk:0.3}, COL = '#cfcac0';
  const YP = 11.1, Y1 = 160, Y2 = 172, YM = 187, FH = 4.8;
  // ---- podium: granite, glass lobby behind a colonnade along Shenton Way (SE long edge) ----
  foundP(B.p(FOUND), POD); wallP(B.p(GR), POD, 0.3, YP); capP(B.p(ROOF), POD, YP);
  bandAtP(B.p(GR2), POD, YP - 0.8, 0.8, 0.2);
  const pe = edgesF(POD);
  for (const e of pe){ if (e.L < 50) continue;
    const se = e.nx*0 + 1; // both long sides: colonnade and glass on the Shenton Way side, plain wall with the long mural band on Robinson Road side
    const isShenton = (e.a[0] + e.b[0]) > 0; // the SE edge lies east of the centre
    if (isShenton){ slabP(B.p(LOB), rectO(2, e.L - 2, 0.3, 6.5), e.F, -3, -2.9); slabP(B.p(ROOF), rectO(0, e.L, 6.5, 7.2), e.F, -3.2, 0.05);
      const n = Math.round(e.L/8.4); for (let k = 0; k <= n; k++){ const p = e.F(k*e.L/n, 0, -0.6); segP(B.p(COL), [p[0], 0.3, p[2]], [p[0], 6.5, p[2]], 0.45, 8); } }
    else slabP(B.p(MURAL), rectO(e.L/2 - 60, e.L/2 + 60, 1.2, 5.2), e.F, 0.02, 0.12);
  }
  // ---- the two towers ----
  for (const T of TW){
    const P = T.P, E = edgesF(P);
    // walls per edge kind
    E.forEach((e, i) => { const t = T.tags[i], c = t === 'c' ? GL : t === 'e' ? GLE : GR;
      quadP(B.p(c), [e.a[0], YP, e.a[1]], [e.b[0], YP, e.b[1]], [e.b[0], Y1, e.b[1]], [e.a[0], Y1, e.a[1]]); });
    capP(B.p(ROOF), P, Y1);
    E.forEach((e, i) => { const t = T.tags[i];
      if (t === 'c'){ // arced face: vertical granite fins every 1.55 m
        const n = Math.max(1, Math.round(e.L/1.55)); for (let k = 0; k < n; k++) slabP(B.p(GR), rectO(k*e.L/n - 0.14, k*e.L/n + 0.14, YP, Y2), e.F, 0, 0.75);
        ribP(B.p(GR2), [e.a, e.b], YP + FH, Y1, FH, 0.35, 0.05);
      } else if (t === 'g'){ // flat granite flank: narrow vertical window slits
        const n = Math.max(1, Math.round(e.L/3)); for (let k = 0; k < n; k++) shapeP(B.p(GL), rectO((k + 0.5)*e.L/n - 0.45, (k + 0.5)*e.L/n + 0.45, YP + 2, Y1 - 2), e.F, 0.05);
        slabP(B.p(GR), rectO(0, e.L, Y1, Y2), e.F, -0.4, 0);
      } else if (t === 'e'){ // end face: granite piers at both sides, glass with deep sun-shade ledges between, crown frame with an open square
        const pw = Math.min(4.2, e.L*0.2);
        slabP(B.p(GR), rectO(0, pw, YP, Y2), e.F, 0, 0.9); slabP(B.p(GR), rectO(e.L - pw, e.L, YP, Y2), e.F, 0, 0.9);
        for (let y = YP + FH*2; y < Y1 - 6; y += FH*2) slabP(B.p(LEDGE), rectO(pw, e.L - pw, y, y + 0.45), e.F, 0, 1.6);
        for (let k = 1; k < 4; k++) shapeP(B.p(GR2), rectO(pw + (e.L - 2*pw)*k/4 - 0.08, pw + (e.L - 2*pw)*k/4 + 0.08, YP, Y1 - 6), e.F, 0.06);
        slabP(B.p(GR), rectO(pw, e.L - pw, Y1 - 6, Y1 - 3.5), e.F, 0, 0.9);       // sill of the open square
        slabP(B.p(GR), rectO(pw, e.L - pw, Y2 - 3, Y2), e.F, 0, 0.9);             // lintel
      }
    });
    // crown: screen walls rise from the roof to 172 m on the flanks; roof plant set back; the twin antenna mast over one end
    const S2 = offP(P, 2.5); wallP(B.p(MECH), offP(P, 6), Y1, Y1 + 5); capP(B.p(ROOF), offP(P, 6), Y1 + 5);
    const ce = E.filter((e, i) => T.tags[i] === 'e').sort((a, b) => b.L - a.L)[0];
    if (ce){ const m = ce.F(ce.L/2, 0, -4.5);
      for (const d of [-1.2, 1.2]){ const p = [m[0] + ce.nz*0 + Math.cos(ce.ang)*d, 0, m[2] + Math.sin(ce.ang)*d]; segP(B.p(MAST), [p[0], Y1, p[2]], [p[0], YM, p[2]], 0.28, 6);
        for (let y = Y2; y < YM - 1; y += 2.5) segP(B.p(MAST), [p[0], y, p[2]], [m[0], y + 1.25, m[2]], 0.08, 4); }
      boxP(B.p(LAV50), 0.5, 0.6, 0.5, m[0], YM, m[2]); }
    lavP(B.p(LAV50), [P[0], P[Math.floor(P.length/2)]], Y2);
  }
  // street trees along Shenton Way
  for (const e of pe) if (e.L > 50 && (e.a[0] + e.b[0]) > 0){ const n = Math.round(e.L/14); for (let k = 0; k < n; k++){ const p = e.F((k + 0.5)*e.L/n, 0, 2.4); treeP(B.p('#5b4a3a'), B.p({c:'#4f7a3e', m:0, lk:0.1}), p[0], 0.3, p[2], 1.2, R); } }
  B.flush(g); return g; }};
const PL = LL40(A0[0], A0[1], C0[0], C0[1]);
SG_PLACES.push({type:'sgsgx', lat:PL.lat, lon:PL.lon, rot:0});
}
// ================= OUE Downtown (former DBS Building Towers), 6 Shenton Way (sgoue, hero) =================
// Wikipedia: Tower 1, 50 storeys, 201 m (1975, Architects Team 3; tallest in Singapore 1975-86), aluminium cladding replaced by a
// glass curtain wall in the 2017 conversion (Oakwood serviced apartments); Tower 2, 36 storeys, 150 m (1994, offices); the
// Downtown Gallery mall runs the full length of the podium. Plans from OSM: Tower 1 w172915340 with its floor parts w510804033
// (39-80, 84-123, 127-166, 170-183 m: the three recessed breaks between them) and the core w510804763 (to 201 m); Tower 2
// w172915341; Downtown Gallery w510901696 (39 m). Look (photos, Commons): Tower 1 dark-grey glass divided by deep vertical fins
// (four bays a face), dark recessed breaks, an open-grid crown; Tower 2 light grey cladding with a regular grid of small windows;
// the Gallery glass behind slender light fins. Night: lit apartment / office windows, a softly lit crown on Tower 1.
{
const A0 = [1.277402, 103.848671];
const T1F0 = [[-42.5,44.4],[-33.0,52.6],[-20.5,57.9],[-6.3,34.1],[-17.5,24.6],[-28.3,20.6]];
const CORE0 = [[-33.5,42.6],[-21.0,50.1],[-13.3,37.1],[-25.8,30.1]];
const T2_0 = [[25.5,-68.4],[-10.3,-9.1],[13.5,5.1],[49.2,-53.6]];
const GAL0 = [[-11.6,-9.1],[13.5,6.1],[-56.2,119.3],[-81.3,104.1],[-61.0,71.1]];
const C0 = [0, 0], [T1F, CORE, T2, GAL] = shAll([T1F0, CORE0, T2_0, GAL0], C0);
LANDMARKS.sgoue = {zh:'华联海湾大厦', en:'OUE Downtown', cat:'new', r:137, h:201,
  lt:{m:1, c:'#ffe7c4', k:0.45}, build(){
  const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
  const GL1 = {c:'#3a444d', m:1, fh:3.9, cw:1.8}, FIN = {c:'#555b61', m:0, lk:0.2}, MUL1 = {c:'#4c535a', m:0, lk:0.15}, DARK = '#23282d',
    CL2 = {c:'#cfccc4', m:0, lk:0.3}, WIN2 = {c:'#34414c', m:1, fh:4.0, cw:2.2}, ROOF = '#8b8e90', MECH = '#6e7376', FOUND = '#bdb7ab', PAVE = '#c4beb2',
    GLG = {c:'#4a5660', m:1, fh:5.5, cw:3.2}, FING = {c:'#dcdcd6', m:0, lk:0.3}, LOB = {c:'#b4c2c6', m:0, glow:'#ffe6c0', gk:0.8}, GRID = '#5d6368', LEAF = {c:'#4f7a3e', m:0, lk:0.1};
  // ---- Downtown Gallery podium (39 m): glass behind light vertical fins, recessed glazed ground floor, roof garden ----
  const YG = 39;
  foundP(B.p(FOUND), GAL); foundP(B.p(FOUND), T2);
  wallP(B.p(GLG), GAL, 0.3, YG); capP(B.p(ROOF), GAL, YG);
  finsP(B.p(FING), GAL, 6, YG, 2.6, 0.9, 0.35);
  ribP(B.p(FING), GAL, 6, YG, 5.5, 0.5, 0.06); bandAtP(B.p(LOB), GAL, 0.3, 5.7, 0.04);
  bandAtP(B.p(FING), GAL, YG - 1.2, 1.2, 0.3);
  for (const [x, z] of alongP(offP(GAL, 5), 9)){ if (inPolyS(offP(T1F, -3), x, z)) continue; treeP(B.p('#5b4a3a'), B.p(LEAF), x, YG, z, 0.9, R); }
  // ---- Tower 1: four glass blocks between the recessed breaks, deep fins, open-grid crown ----
  const blocks = [[YG, 80], [84, 123], [127, 166], [170, 192]];
  for (const [a, b] of blocks){
    wallP(B.p(GL1), T1F, a, b); capP(B.p(ROOF), T1F, b); capP(B.p(ROOF), T1F, a);
    facadeP(B, T1F, a, b, {mul:MUL1, bay:1.55, fd:0.12, fw:0.05, fh:3.9, band:MUL1, bh:0.18});
    // four bays a face: three deep fins + corner fins
    for (const e of edgesF(T1F)){ if (e.L < 6) continue; for (let k = 0; k <= 4; k++) slabP(B.p(FIN), rectO(k*e.L/4 - 0.35, k*e.L/4 + 0.35, a - 0.4, b + 0.4), e.F, 0, k % 4 ? 1.3 : 0.6); }
    bandAtP(B.p(FIN), T1F, b - 0.9, 0.9, 0.35);
  }
  // breaks: the core and the structural frame show through
  for (const [a, b] of [[80, 84], [123, 127], [166, 170]]){ blkP(B, CORE, a, b, DARK); for (const p of offP(T1F, 1.2)) segP(B.p(FIN), [p[0], a, p[1]], [p[0], b, p[1]], 0.6, 6); }
  // crown 192-201: open grid screen round the core
  blkP(B, CORE, 192, 201, MECH, ROOF);
  for (const e of edgesF(T1F)){ if (e.L < 2) continue; const n = Math.max(1, Math.round(e.L/2.2));
    for (let k = 0; k <= n; k++) slabP(B.p(GRID), rectO(k*e.L/n - 0.12, k*e.L/n + 0.12, 192, 201), e.F, -0.2, 0.2);
    for (let y = 192; y <= 201.01; y += 3) slabP(B.p(GRID), rectO(0, e.L, y - 0.15, y + 0.15), e.F, -0.2, 0.2); }
  lavP(B.p(LAV50), T1F, 201);
  // ---- Tower 2 (150 m): light grey cladding with a grid of small windows, recessed glazed base ----
  wallP(B.p(LOB), offP(T2, 1.5), 0.3, 6); wallP(B.p(CL2), T2, 6, 150); capP(B.p(ROOF), T2, 150);
  for (const p of T2) segP(B.p(CL2), [p[0], 0.3, p[1]], [p[0], 6, p[1]], 0.8, 8);
  winP(B, T2, 8, 146, 4.0, 2.2, 1.3, 2.0, WIN2, {minL:5});
  bandAtP(B.p(CL2), T2, 146, 4, 0.15);
  blkP(B, scP(T2, 0.6), 150, 155, MECH, ROOF); lavP(B.p(LAV50), T2, 150);
  B.flush(g); return g; }};
const PL = LL40(A0[0], A0[1], C0[0], C0[1]);
SG_PLACES.push({type:'sgoue', lat:PL.lat, lon:PL.lon, rot:0});
}
// ================= V on Shenton, 5 Shenton Way (sgvshenton, hero) =================
// UNStudio with Architects 61 (e-architect / Wikipedia): a 53/54-storey residential tower of 237 m and a 23-storey office tower of
// 123 m on a shared plinth (car park, sky garden over the whole 8th storey); facades on a hexagon pattern (office: curtain-wall
// hexagon module; residential: balconies, bay windows and planters stacked into the pattern); sky lobbies on the 24th and 34th
// floors; a chamfer line frames each tower and the plinth and lights up as a continuous line at night. Plans from OSM: plinth parts
// (26.4 m) over the site w448084975; residential shafts w560229133 + w560229131 with the link w560229135; office tower w560229136.
// Look (photo, Commons 2025): residential tower of two joined shafts with white balcony bands and open lattice crowns; office tower
// silver glass with white hexagon lines; grey plinth with a large hexagon panel pattern.
{
const A0 = [1.277411, 103.849369];
const SITE0 = [[31.4,-80.1],[-58.5,61.7],[-30.2,79.4],[50.9,-50.7],[53.9,-55.4],[55.9,-58.4],[58.6,-62.9]];
const RA0 = [[-48.7,54.9],[-43.2,57.9],[-47.0,63.1],[-30.2,73.1],[-14.7,47.6],[-36.2,34.6]];
const RB0 = [[1.5,21.6],[-20.0,8.6],[-33.7,31.1],[-12.2,44.1]];
const LK0 = [[-33.7,31.1],[-36.2,34.6],[-14.7,47.6],[-12.2,44.1]];
const OF0 = [[-7.0,-15.9],[18.3,-0.4],[52.3,-56.6],[51.0,-61.4],[29.0,-74.4]];
const C0 = pcen(SITE0), [SITE, RA, RB, LK, OF] = shAll([SITE0, RA0, RB0, LK0, OF0], C0);
// honeycomb lines (pointy-top hexagons, flat-to-flat width cw) on facade frame F over u0..u1, v0..v1, strips of width t at offset w
function hexF(o, F, u0, u1, v0, v1, cw, t, w){
  const hh = cw/Math.sqrt(3), rs = 1.5*hh; // hexagon circumradius, row step
  const seg = (a, b) => { // clip to the face box, then a thin strip
    let [ua, va] = a, [ub, vb] = b; if ((ua < u0 && ub < u0) || (ua > u1 && ub > u1) || (va < v0 && vb < v0) || (va > v1 && vb > v1)) return;
    const cu = x => Math.max(u0, Math.min(u1, x)), cv = x => Math.max(v0, Math.min(v1, x)); ua = cu(ua); ub = cu(ub); va = cv(va); vb = cv(vb);
    const L = Math.hypot(ub - ua, vb - va); if (L < 0.2) return; const nu = -(vb - va)/L*t/2, nv = (ub - ua)/L*t/2;
    shapeP(o, [[ua + nu, va + nv], [ub + nu, vb + nv], [ub - nu, vb - nv], [ua - nu, va - nv]], F, w); };
  for (let r = 0, v = v0; v < v1 + hh; r++, v += rs) for (let u = u0 + (r % 2 ? cw/2 : 0); u < u1 + cw; u += cw){
    const P = []; for (let k = 0; k < 6; k++){ const a = PI/6 + k*PI/3; P.push([u + Math.cos(a)*hh, v + Math.sin(a)*hh]); }
    seg(P[5], P[0]); seg(P[0], P[1]); seg(P[1], P[2]); }
}
LANDMARKS.sgvshenton = {zh:'V on Shenton', en:'V on Shenton', cat:'new', r:91, h:237,
  lt:{m:1, c:'#eaf2ff', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
  const GLR = {c:'#56636d', m:1, fh:3.9, cw:2.4}, LEDGE = {c:'#e3e5e3', m:0, lk:0.25}, GLO = {c:'#6f8290', m:1, fh:4.2, cw:3.0}, HEX = {c:'#e6e9ea', m:0, lk:0.3},
    POD = {c:'#9c9e9d', m:0, lk:0.25}, PODG = {c:'#4f5a62', m:1, fh:3.3, cw:3}, ROOF = '#8b8e90', FOUND = '#bdb7ab', PAVE = '#c4beb2', DARK = '#2b3238',
    CH = {c:'#f2f4f4', m:0, glow:'#e8f4ff', gk:1.1}, LAT = '#d7dadb', LOB = {c:'#b4c2c6', m:0, glow:'#ffe6c0', gk:0.8}, LEAF = {c:'#4f7a3e', m:0, lk:0.1};
  const YP = 26.4, YR = 226, YRT = 237, YO = 123;
  // ---- plinth: grey hexagon panels, a glazed base, the sky-garden deck on top ----
  foundP(B.p(FOUND), SITE); wallP(B.p(POD), SITE, 6, YP); capP(B.p('#7d8a74'), SITE, YP);
  wallP(B.p(LOB), offP(SITE, 1.2), 0.3, 6); capP(B.p(PAVE), SITE, 0.3);
  for (const e of edgesF(SITE)) if (e.L > 8){ hexF(B.p(HEX), e.F, 0, e.L, 6.5, YP - 0.5, 6.5, 0.22, 0.06); slabP(B.p(ROOF), rectO(0, e.L, 5.6, 6.4), e.F, 0, 1.6); }
  for (const p of SITE) segP(B.p(CH), [p[0], YP + 0.05, p[1]], [p[0], 6.4, p[1]], 0.18, 4);
  bandAtP(B.p(CH), SITE, YP - 0.25, 0.25, 0.1);
  for (const [x, z] of alongP(offP(SITE, 4), 10)){ if ([RA, RB, LK, OF].some(Q => inPolyS(offP(Q, -2), x, z))) continue; treeP(B.p('#5b4a3a'), B.p(LEAF), x, YP, z, 0.8, R); }
  // ---- residential tower: two shafts and the recessed link, balcony bands, sky-lobby breaks, lattice crowns ----
  for (const P of [RA, RB]){
    wallP(B.p(GLR), P, YP, YR); capP(B.p(ROOF), P, YR);
    ledgeP(B.p(LEDGE), P, YP + 3.9, YR - 1, 3.9, 0.9, 0.35);
    // irregular bay windows / planters: short white fins at varying places on each floor (fixed pattern from the rng)
    for (const e of edgesF(P)) if (e.L > 6) for (let y = YP + 3.9; y < YR - 4; y += 3.9){ const n = 1 + (R()*3 | 0); for (let k = 0; k < n; k++){ const u = 1 + R()*(e.L - 2); slabP(B.p(LEDGE), rectO(u - 0.15, u + 0.15, y, y + 3.9), e.F, 0, 0.9); } }
    for (const yb of [88.8, 127.8]) wallP(B.p(DARK), offP(P, 1.0), yb, yb + 3.9);
    for (const p of P) segP(B.p(CH), [p[0], YP, p[1]], [p[0], YR, p[1]], 0.16, 4);
    latticeP(B.p(LAT), offP(P, 0.3), YR, YRT, 3.2, 0.18, 3, true);
    capP(B.p(ROOF), offP(P, 3), YR + 1.5); lavP(B.p(LAV50), [P[0], P[2]], YRT);
  }
  wallP(B.p(GLR), offP(LK, 0.8), YP, YR - 4); ledgeP(B.p(LEDGE), offP(LK, 0.8), YP + 3.9, YR - 5, 3.9, 0.5, 0.3);
  // ---- office tower: silver glass with white hexagon lines, chamfer-line edges ----
  wallP(B.p(GLO), OF, YP, YO); capP(B.p(ROOF), OF, YO);
  for (const e of edgesF(OF)) if (e.L > 4) hexF(B.p(HEX), e.F, 0, e.L, YP, YO, 6.0, 0.28, 0.08);
  for (const p of OF) segP(B.p(CH), [p[0], YP, p[1]], [p[0], YO, p[1]], 0.18, 4);
  bandAtP(B.p(CH), OF, YO - 0.3, 0.3, 0.12);
  blkP(B, scP(OF, 0.55), YO, YO + 4, '#767b7e', ROOF); lavP(B.p(LAV50), [OF[0], OF[2]], YO);
  B.flush(g); return g; }};
const PL = LL40(A0[0], A0[1], C0[0], C0[1]);
SG_PLACES.push({type:'sgvshenton', lat:PL.lat, lon:PL.lon, rot:0});
}
}
