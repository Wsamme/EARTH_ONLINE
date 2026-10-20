// ===== lm26/sgcbd: seven new landmarks in Singapore's CBD / Tanjong Pagar / Telok Ayer (City Brush v29, real Singapore 1:1)
//  sgcapitagreen - CapitaGreen (2014, Toyo Ito): 40-storey square tower, double-skin facade with planted panels, sky forest
//                  and the red four-petal wind scoop crown; Market / Cecil / Cross Street.
//  sgoasia       - Oasia Hotel Downtown (2016, WOHA): red / orange / pink aluminium mesh tower with creepers, four corner cores,
//                  four open-sided sky gardens and the open "bower" crown; Peck Seah Street.
//  sgofc         - Ocean Financial Centre (2011, Pelli Clarke Pelli): two interlocking banded glass volumes, the curved sail
//                  towards Collyer Quay, the gently sloping crown with sky gardens, the 105 m low-zone wing.
//  sgconfhall    - Singapore Conference Hall (1965, Malayan Architects Co-Partnership): long box under a cantilevered butterfly
//                  roof, hanging louvre strips, glass curtain walls; Shenton Way.
//  sgtelokayer   - Telok Ayer Chinese Methodist Church (1925, Swan & Maclaren): two-storey arcaded church with the Chinese
//                  pavilion on the roof.
//  sglayan       - Sri Layan Sithi Vinayagar Temple (Keong Saik Road): temple hall with the five-tier rajagopuram (2007) and vimana.
//  sgnagore      - Nagore Dargah (1828-30): Indo-Saracenic shrine with four 14-tier minaret towers, the perforated miniature-palace
//                  facade and the multifoil arch on Telok Ayer Street.
// Every model is built in the real map frame (local +x = east, +z = south, rot 0) on the real OSM footprints
// (ref_sgcbd_fix.json in this folder, re-extracted around the corrected anchors). Only LANDMARKS and SG_PLACES are touched.
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
// ================= CapitaGreen (2014, Toyo Ito & Associates with Takenaka), 138 Market Street =================
// 40-storey office tower (~242 m to the top of the wind scoop) on the wedge between Market, Cecil and Cross Street.
// Square plan (~42 m, chamfered corners) parallel to Cecil Street; a double-skin glass facade with planted panels in a random
// pattern over about half of it; tall glass lobby; the roof "Sky Forest" behind a glass screen; and the 45 m red four-petal
// wind scoop ("a plant growing towards the sun") that draws fresh air down the inner tube. Night: lit office floors, the red
// petals floodlit, aviation lights on the tips.
{
const A0 = [1.28190, 103.84945], OX = 64.0, OZ = 10.9;   // ref anchor (ref_sgcbd_fix.json), model origin = tower centre
const SITE = shP([[91.6,-34.7],[94.0,32.9],[80.8,51.8],[35.5,27.5],[33.1,12.1],[70.1,-46.6]], OX, OZ);
LANDMARKS.sgcapitagreen = {zh:'凯德·绿', en:'CapitaGreen', cat:'new', r:60, h:242, lt:{m:1, c:'#ffe6c8', k:0.6}, build(){
  const g = new THREE.Group(), B = mkB(), V = mkV(), R = LMCTX.rng;
  const GL = {c:'#58777f', m:1, fh:4.6, cw:2.9}, MUL = {c:'#c9cfd0', m:0, lk:0.2}, BAND = {c:'#a9b1b2', m:0, lk:0.2}, CONC = '#cfccc3', PAVE = '#bab5a8',
    RED = {c:'#b3302a', m:0, lc:'#ff4a30', lk:1.6, glow:'#d0301e', gk:0.55}, RIB = {c:'#7a1d19', m:0, lc:'#ff4a30', lk:1.3, glow:'#a02014', gk:0.5}, SCR = {c:'#86a2a6', m:0, lk:0.2},
    LOB = {c:'#a7bfc2', m:0, glow:'#ffe0b0', gk:0.8}, TRK = '#5b4a3a', LEAF = {c:'#4a7a3a', m:0, lk:0.1}, LAV = {c:'#c22', glow:'#ff2a1a', gk:2};
  const GREENS = ['#3f6b35', '#4f7d3c', '#5d8a44', '#365f30', '#6b9550', '#46723a'];
  const a = -57.8*PI/180, F = frame(0, 0, a), H = 21, CH = 3.2, Y0 = 11, FH = 4.6, NF = 39, YR = Y0 + NF*FH + 5.2, YS = YR + 8.5;
  const TP = polyF(F, [[-H + CH, -H], [H - CH, -H], [H, -H + CH], [H, H - CH], [H - CH, H], [-H + CH, H], [-H, H - CH], [-H, -H + CH]]);
  // ---- site plinth / plaza, foundations ----
  wallP(B.p(CONC), SITE, -5, 0.5); capP(B.p(PAVE), SITE, 0.5);
  wallP(B.p(CONC), TP, -5, 0.5);
  // plaza trees round the tower
  for (const [u, v] of [[-28, -14], [-30, 4], [-26, 24], [26, 26], [10, 31], [-6, 31], [31, -8], [12, -29], [-10, -29]]){
    const p = F.P(u, v);
    if (inPolyS(offP(SITE, 2.5), p[0], p[1])) treeP(B.p(TRK), B.p(LEAF), p[0], 0.5, p[1], 1.4, R); }
  // ---- lobby: recessed glass box behind a row of slim columns, entrance canopies ----
  const LP = offP(TP, 1.6);
  prismP(B.p(LOB), LP, 0.5, Y0);
  for (const [x, z] of alongP(TP, 7.2)) segP(B.p(MUL), [x, 0.5, z], [x, Y0, z], 0.38, 6);
  for (const s of [-1, 1]){ bxF(B.p(BAND), F, -9, 9, 6.2, 6.8, s*H, s*(H + 5.5), true); }
  // ---- tower: glass body, floor bands, mullion fins, planted panels in the double skin ----
  prismP(B.p(GL), TP, Y0, YR);
  const E = edgesF(TP);
  for (const e of E){
    const nb = Math.max(1, Math.round(e.L/2.95)), bw = e.L/nb;
    for (let k = 0; k <= nb; k++) slabP(B.p(MUL), rectO(k*bw - 0.09, k*bw + 0.09, Y0, YS), e.F, 0, 0.55);
    for (let i = 0; i <= NF; i++){ const y = Y0 + i*FH; shapeP(B.p(BAND), rectO(0, e.L, y - 0.35, y + 0.25), e.F, 0.06); }
    shapeP(B.p(BAND), rectO(0, e.L, YR - 0.6, YR + 0.5), e.F, 0.08);
    if (e.L < 6) continue;
    for (let k = 0; k < nb; k++){
      const pc = 0.32 + 0.45*R();
      for (let i = 0; i < NF; i++){
        const y = Y0 + i*FH; if (R() > pc*(i > NF - 3 ? 0.6 : 1)) continue;
        const col = GREENS[Math.floor(R()*GREENS.length)];
        vAdd(V, col, t => shapeP(t, rectO(k*bw + 0.16, (k + 1)*bw - 0.16, y + 0.3, y + FH - 0.3), e.F, 0.3));
      }
    }
  }
  // ---- roof: Sky Forest behind the glass screen ----
  wallP(B.p(SCR), offP(TP, 0.3), YR, YS); capP(B.p(CONC), TP, YR + 0.01);
  bandAtP(B.p(BAND), TP, YS - 0.5, 0.5);
  for (let i = 0; i < 26; i++){
    const ang = R()*TAU, rr = 9 + R()*10, x = Math.cos(ang)*rr, z = Math.sin(ang)*rr; const L = F.L(x, z);
    if (Math.abs(L[0]) > H - 3 || Math.abs(L[1]) > H - 3) continue;
    treeP(B.p(TRK), B.p(LEAF), x, YR, z, 1.5 + R()*0.8, R);
  }
  // ---- the wind scoop: four red petals opening upwards round the inner tube, with dark ribs ----
  latheP(B.p(RED), [[3.6, YR], [3.6, YR + 6], [3.3, YR + 9]], 0, 0, 16);
  const PH = 45.5, NR = 16, NC = 10;
  for (let k = 0; k < 4; k++){
    const phi = a + PI/4 + k*HP, dx = Math.cos(phi), dz = Math.sin(phi), tx = -dz, tz = dx;
    const pt = (t, s) => { const w = 4.9*Math.pow(Math.max(0, Math.sin(PI*(0.1 + 0.9*t))), 0.7) + 0.15, rc = 3.0 + 5.5*t + 9.5*Math.pow(t, 2.3), r = rc - 0.28*w*s*s, y = YR + 1 + PH*t - 1.0*s*s*(1 - t);
      return [dx*r + tx*s*w, y, dz*r + tz*s*w]; };
    const S = []; for (let i = 0; i <= NR; i++){ const row = []; for (let j = 0; j <= NC; j++) row.push(pt(i/NR, -1 + 2*j/NC)); S.push(row); }
    sheetP(B.p(RED), S);
    // a second skin just outside (gives the petals thickness when seen edge-on)
    const S2 = S.map((row, i) => row.map(p => [p[0] + dx*0.35, p[1], p[2] + dz*0.35])); sheetP(B.p(RED), S2);
    for (const s of [-1, 0, 1]) for (let i = 0; i < NR; i++) segP(B.p(RIB), pt(i/NR, s), pt((i + 1)/NR, s), s ? 0.32 : 0.22, 4);
    for (let i = 2; i < NR; i += 3) for (let j = 0; j < NC; j++) segP(B.p(RIB), pt(i/NR, -1 + 2*j/NC), pt(i/NR, -1 + 2*(j + 1)/NC), 0.16, 3);
    const tip = pt(1, 0); boxP(B.p(LAV), 0.6, 0.6, 0.6, tip[0], tip[1] - 0.2, tip[2]);
  }
  B.flush(g); vFlush(g, V, {m:0, lk:0.08}); return g; }};
SG_PLACES.push({type:'sgcapitagreen', lat:1.281801, lon:103.850025, rot:0});
}
// ================= Oasia Hotel Downtown (2016, WOHA), 100 Peck Seah Street =================
// 27 storeys / ~191 m on a 50 x 50 m plot; offices below, hotel above. Four corner cores carry the tower so that four
// open-sided sky gardens (levels 6, 12, 21 and the 27th-storey roof terrace) cut right through it; the 42.9 m crown is an open
// "bower" framed by the cores. The whole skin is expanded aluminium mesh in five warm colours (red, orange, pink, maroon)
// with 21 species of creepers climbing it. Night: lit rooms behind the mesh, the sky-garden soffits glowing warm.
{
const A0 = [1.27588, 103.84434];
LANDMARKS.sgoasia = {zh:'市中豪亚酒店', en:'Oasia Hotel Downtown', cat:'new', r:36, h:191, lt:{m:1, c:'#ffd2a8', k:0.55}, build(){
  const g = new THREE.Group(), B = mkB(), V = mkV(), R = LMCTX.rng;
  const GL = {c:'#3f3a3a', m:1, fh:3.4, cw:2.4}, SLAB = '#8c8680', CORE = '#6a3a33', FOUND = '#cfcac0', PLANT = {c:'#4b7a38', m:0, lk:0.1},
    TRK = '#5b4a3a', LEAF = {c:'#45793a', m:0, lk:0.12}, SOF = {c:'#d9b48a', glow:'#ffcf94', gk:0.75}, POOL = {c:'#5aaec2', glow:'#3f9fc0', gk:0.5},
    LOB = {c:'#b8a58e', m:0, glow:'#ffdcae', gk:0.8}, ICORE = '#57504c';
  const MESH = ['#b3282b', '#b3282b', '#a82428', '#bd302c', '#b3282b', '#c43c2f', '#8e2131', '#9a2430', '#cf4a33', '#c4506a', '#d96a3d', '#b3282b'], VINE = ['#4e7c35', '#3c682d', '#64983f', '#557f3a'];
  const F = frame(0.5, 0, 8*PI/180), S = 23.3, C = 4, K = 12.0;   // half-size, corner chamfer, core inner edge
  const OCT = [[-S + C, -S], [S - C, -S], [S, -S + C], [S, S - C], [S - C, S], [-S + C, S], [-S, S - C], [-S, -S + C]];
  const P8 = polyF(F, OCT);
  const coreUV = (su, sv) => [[su*K, sv*K], [su*S, sv*K], [su*S, sv*(S - C)], [su*(S - C), sv*S], [su*K, sv*S]];
  const CORES = [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b]) => polyF(F, coreUV(a, b)));
  // zones: [y0, y1, solid]; sky gardens between the solid blocks, the crown above 150 m
  const Z = [[7, 30, 1], [30, 44, 0], [44, 70, 1], [70, 92, 0], [92, 122, 1], [122, 136, 0], [136, 150, 1], [150, 191, 0]];
  const YT = 191;
  // ---- foundation, lobby ----
  wallP(B.p(FOUND), P8, -5, 0.5); capP(B.p(FOUND), P8, 0.5);
  prismP(B.p(LOB), offP(P8, 2.2), 0.5, 7);
  for (const P of CORES) prismP(B.p(CORE), P, 0.5, 7);
  // ---- solid blocks: glass behind the mesh; slabs; soffits under each block (glow over the gardens) ----
  for (const [y0, y1, solid] of Z){
    if (solid){ prismP(B.p(GL), offP(P8, 0.9), y0, y1); capP(B.p(SOF), offP(P8, 0.3), y0 - 0.02); bandAtP(B.p(SLAB), P8, y1 - 0.8, 0.8, 0.3); }
    else if (y1 < 160){
      for (const P of CORES) prismP(B.p(CORE), offP(P, 0.6), y0, y1);
      prismP(B.p(ICORE), polyF(F, [[-7, -7], [7, -7], [7, 7], [-7, 7]]), y0, y1);
      prismP(B.p(SLAB), P8, y0 - 1.2, y0 + 0.3); capP(B.p(PLANT), offP(P8, 1.2), y0 + 0.35);
      // planter kerbs along the open edges, trees and shrubs on the terrace
      for (let i = 0; i < 16; i++){
        const u = (R()*2 - 1)*(S - 3), v = (R()*2 - 1)*(S - 3); if (Math.abs(u) < 9 && Math.abs(v) < 9) continue; if (Math.abs(u) > K - 1 && Math.abs(v) > K - 1) continue;
        const p = F.P(u, v); treeP(B.p(TRK), B.p(LEAF), p[0], y0 + 0.3, p[1], 1.1 + R()*0.7, R);
      }
    }
  }
  // ---- the crown: the cores rise to the top, a lattice bower between them, roof terrace with the pool ----
  for (const P of CORES) prismP(B.p(CORE), offP(P, 0.6), 150, YT);
  prismP(B.p(SLAB), P8, 148.8, 150.3); capP(B.p(PLANT), offP(P8, 1.2), 150.35);
  bxF(B.p(POOL), F, -9, 9, 150.3, 150.6, -4, 4);
  bxF(B.p(ICORE), F, -6, 6, 150.3, 158, 8, 14);
  for (let i = 0; i < 12; i++){ const u = (R()*2 - 1)*(S - 4), v = (R()*2 - 1)*(S - 4); if (Math.abs(v) < 5 && Math.abs(u) < 10) continue; if (Math.abs(u) > K - 1 && Math.abs(v) > K - 1) continue;
    const p = F.P(u, v); treeP(B.p(TRK), B.p(LEAF), p[0], 150.3, p[1], 1.3 + R()*0.6, R); }
  // bower: ring beams tying the cores at the top and at 170 m, slender verticals between them
  for (const s of [-1, 1]){
    for (const yb of [YT - 1.2, 170]){ bxF(B.p(CORE), F, -K, K, yb, yb + 1.2, s*S - 0.6, s*S + 0.6); bxF(B.p(CORE), F, s*S - 0.6, s*S + 0.6, yb, yb + 1.2, -K, K); }
    bxF(B.p(CORE), F, -K, K, YT - 1.2, YT, -0.5, 0.5); bxF(B.p(CORE), F, -0.5, 0.5, YT - 1.2, YT, -K, K);
  }
  // ---- the mesh skin with creepers: panels on every outer face of the solid blocks and of the cores ----
  const E = edgesF(P8), pw = 2.33, ph = 3.4;
  const vine = new Map();
  for (let ei = 0; ei < E.length; ei++){
    const e = E[ei], nc = Math.max(1, Math.round(e.L/pw)), cw = e.L/nc, long = e.L > 20;
    for (let k = 0; k < nc; k++){
      const uc = (k + 0.5)*cw, du = uc - e.L/2, inCore = !long || Math.abs(du) > e.L/2 - (S - K - C);
      // creeper strands: a column is planted from the bottom of a block and climbs a random height
      let y = 7;
      for (const [y0, y1, solid] of Z){
        const top = y1 > 150 && !solid ? (inCore ? YT : 0) : y1;
        if (!solid && y1 > 150 && !inCore){
          // bower lattice between the cores: verticals and a band of mesh near the top
          const a0 = e.F(k*cw + 0.1, 170, 0.2), a1 = e.F(k*cw + 0.1, YT - 1.2, 0.2); segP(B.p(CORE), a0, a1, 0.18, 4);
          for (let yy = YT - 1.2 - ph; yy > 176; yy -= ph) if (R() < 0.75){ const c = MESH[Math.floor(R()*MESH.length)]; vAdd(V, c, t => shapeP(t, rectO(k*cw + 0.12, (k + 1)*cw - 0.12, yy + 0.1, yy + ph - 0.1), e.F, 0.35)); }
          continue;
        }
        if (!solid && !inCore) continue;
        const vh = (R() < 0.62 - 0.28*y0/150) ? (y1 - y0)*(0.35 + 0.65*R()) : 0;
        for (let yy = y0; yy < top - 0.5; yy += ph){
          const y2 = Math.min(top, yy + ph);
          const green = yy - y0 < vh || (R() < 0.08);
          const c = green ? VINE[Math.floor(R()*VINE.length)] : MESH[Math.floor(R()*MESH.length)];
          vAdd(V, c, t => shapeP(t, rectO(k*cw + 0.08, (k + 1)*cw - 0.08, yy + 0.08, y2 - 0.08), e.F, green ? 0.75 : 0.55));
          if (green && R() < 0.5) vAdd(V, VINE[Math.floor(R()*VINE.length)], t => slabP(t, rectO(k*cw + 0.3 + R()*0.4, (k + 1)*cw - 0.3 - R()*0.4, yy + 0.4, y2 - 0.2), e.F, 0.75, 1.15));
        }
      }
    }
  }
  B.flush(g); vFlush(g, V, {m:0, lc:'#ff8a5c', lk:0.4}); return g; }};
SG_PLACES.push({type:'sgoasia', lat:1.27588, lon:103.84434, rot:0});
}
// ================= Ocean Financial Centre (2011, Pelli Clarke Pelli with Architects 61), 10 Collyer Quay =================
// 43 storeys, 245 m. Two interlocking volumes "like a ship's sail": the curved sail towards Collyer Quay / Marina Bay and a
// rectilinear volume towards Raffles Place, both in horizontal bands of glass and anodised aluminium; a gently sloping crown
// with four levels of roof gardens behind open fins; the larger low-zone floors as a 105 m wing to the north-west (OSM part);
// a podium with a green wall. Night: lit floors, faint LED lines along the bands, the crown outlined in LED (colour drift).
{
const A0 = [1.28318, 103.85193];
LANDMARKS.sgofc = {zh:'海洋金融中心', en:'Ocean Financial Centre', cat:'new', r:66, h:245, lt:{m:1, c:'#d8ecff', k:0.75, anim:'cycle', c2:'#8ec0ff'}, build(){
  const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
  const GL = {c:'#5d8796', m:1, fh:4.8, cw:3.0}, BAND = {c:'#c6ccd0', m:0, lk:0.15, glow:'#d6e8ff', gk:0.3}, FIN = {c:'#d5dadd', m:0, lk:1.1, glow:'#9fc8ff', gk:0.35},
    EDGE = {c:'#eef6ff', glow:'#d8ecff', gk:1.0}, POD = '#b9b6ae', PAVE = '#c4bfb3', LOB = {c:'#a9c0c6', m:0, glow:'#ffe6c0', gk:0.8},
    GREEN = {c:'#4c7a3a', m:0, lk:0.1}, ROOF = '#8f9497', TRK = '#5b4a3a', LEAF = {c:'#4a7a3a', m:0, lk:0.12}, LAV = {c:'#c22', glow:'#ff2a1a', gk:2};
  const SITE = [[-32.8,-47.4],[58.0,-21.9],[52.0,-6.5],[41.2,10.7],[28.1,25.0],[12.0,36.2],[-25.0,44.5],[-35.8,43.3],[-42.9,36.8]];
  // the curved east side of the tower, smoothed (Catmull-Rom through the OSM vertices)
  const CK = [[43.0,-18.3],[54.4,-16.0],[50.2,-5.3],[37.1,12.5],[23.3,24.4],[-9.5,39.8],[-10.7,35.0]], CUR = [];
  for (let i = 1; i < CK.length - 2; i++) for (let k = 0; k < 4; k++){ const t = k/4, p0 = CK[i-1], p1 = CK[i], p2 = CK[i+1], p3 = CK[i+2];
    CUR.push([0, 1].map(j => 0.5*((2*p1[j]) + (-p0[j] + p2[j])*t + (2*p0[j] - 5*p1[j] + 4*p2[j] - p3[j])*t*t + (-p0[j] + 3*p1[j] - 3*p2[j] + p3[j])*t*t*t))); }
  CUR.push([-9.5, 39.8]);
  const SAIL = [[14.4,-14.2], [43.0,-18.3], ...CUR, [-10.7,35.0]];
  const WEST = [[10.2,-20.7], [16.0,-11.5], [-8.0,36.5], [-19.6,39.8], [-38.2,4.2]];
  const WING = [[-31.6,-45.6],[19.8,-30.8],[2.4,-18.3],[-8.3,-21.3],[-17.3,-14.8],[-17.9,-8.3],[-37.6,3.0]];
  // ---- podium: site plinth, lobby glass, green wall on the car park, plaza trees ----
  wallP(B.p(POD), SITE, -5, 0.5); capP(B.p(PAVE), SITE, 0.5);
  prismP(B.p(LOB), offP(SAIL, 1.5), 0.5, 14); prismP(B.p(LOB), offP(WEST, 1.5), 0.5, 14);
  prismP(B.p(POD), WING, 0.5, 14);
  for (const e of edgesF(WING)) if (e.L > 8) slabP(B.p(GREEN), rectO(1, e.L - 1, 1.2, 12.8), e.F, 0, 0.25);
  for (const [x, z] of [[-30, 30], [-34, 18], [-22, 40], [45, -6], [36, 12]]) treeP(B.p(TRK), B.p(LEAF), x, 0.5, z, 1.4, R);
  // ---- the three volumes: glass bodies with aluminium bands per floor ----
  const Y0 = 14, FH = 4.8;
  const vol = (P, ytop, slope) => {
    // slope: f(x, z) -> roof height of the crown fins; the glass body stops 2 floors below the lowest fin top
    prismP(B.p(GL), P, Y0, ytop);
    for (const e of edgesF(P)){ if (e.L < 0.3) continue;
      for (let y = Y0; y <= ytop + 0.01; y += FH) shapeP(B.p(BAND), rectO(0, e.L, y - 0.75, y + 0.55), e.F, 0.12);
      const n = Math.max(1, Math.round(e.L/3.0));
      for (let k = 0; k <= n; k++) slabP(B.p(BAND), rectO(k*e.L/n - 0.07, k*e.L/n + 0.07, Y0, ytop), e.F, 0, 0.3);
    }
    if (!slope) return;
    // crown: open vertical fins round the edge rising to the sloping roof line, roof gardens inside, an LED edge line
    const P2 = offP(P, 0.2);
    for (const e of edgesF(P2)){ const n = Math.max(1, Math.round(e.L/1.6));
      for (let k = 0; k <= n; k++){ const p = e.F(k*e.L/n, 0, 0.1), yt = slope(p[0], p[2]); slabP(B.p(FIN), rectO(k*e.L/n - 0.12, k*e.L/n + 0.12, ytop, yt), e.F, 0, 0.6); }
      const a = e.F(0, 0, 0.3), b = e.F(e.L, 0, 0.3); segP(B.p(EDGE), [a[0], slope(a[0], a[2]) + 0.2, a[2]], [b[0], slope(b[0], b[2]) + 0.2, b[2]], 0.28, 4);
      for (let y = ytop + FH*1.5; y < 245; y += FH*1.5){ const pa = e.F(0, 0, 0.3), pb = e.F(e.L, 0, 0.3); if (slope(pa[0], pa[2]) > y + 1 && slope(pb[0], pb[2]) > y + 1) shapeP(B.p(BAND), rectO(0, e.L, y - 0.3, y + 0.3), e.F, 0.65); }
    }
    // stepped roof gardens inside the crown
    for (let i = 0; i < 3; i++){ const Pi = offP(P, 4 + i*4.5), yy = ytop + i*FH*1.4; prismP(B.p(GL), Pi, ytop, yy + FH*1.4); capP(B.p(GREEN), Pi, yy + FH*1.4 + 0.05);
      const c = ctr(Pi); for (let k = 0; k < 5; k++){ const q = Pi[Math.floor(R()*Pi.length)]; const x = lerp(q[0], c[0], 0.25 + R()*0.3), z = lerp(q[1], c[1], 0.25 + R()*0.3); treeP(B.p(TRK), B.p(LEAF), x, yy + FH*1.4, z, 1.0 + R()*0.5, R); } }
  };
  // sail: highest at the north tip (245 m), sloping gently down to the south
  const sailTop = (x, z) => 245 - (z + 18)*0.2;
  vol(SAIL, Y0 + 42*FH, sailTop);
  vol(WEST, Y0 + 40*FH, (x, z) => sailTop(x, z) - 10.5);
  vol(WING, 105, null);
  capP(B.p(ROOF), WING, 105.02);
  bxP(B.p(ROOF), -18, -4, 105, 110, -38, -26);
  const tip = [52.5, sailTop(52.5, -16), -16]; boxP(B.p(LAV), 0.8, 0.8, 0.8, tip[0], tip[1] + 0.3, tip[2]);
  B.flush(g); return g; }};
SG_PLACES.push({type:'sgofc', lat:1.28318, lon:103.85193, rot:0});
}
// ================= Singapore Conference Hall and Trade Union House (1965, Malayan Architects Co-Partnership), 7 Shenton Way ====
// A long five-storey box (~64 x 43 m) under one cantilevered butterfly roof that collects rain to the middle: the auditorium /
// conference block and the trade union block, linked by the glazed concourse; glass curtain walls stop short of the roof, two
// long strips of vertical louvre screens hang from it along the front (Shenton Way) and the back; slim columns and a recessed
// ground floor, the entrance pavilion on Shenton Way. Night: warm floodlight on the white roof edge, lit glazing.
{
const A0 = [1.27617, 103.84900], OX = 1.0, OZ = 1.5;
LANDMARKS.sgconfhall = {zh:'新加坡大会堂', en:'Singapore Conference Hall', cat:'old', r:53, h:21, lt:{m:0, c:'#ffe2bc', k:0.85, e:0.5, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
  const WHITE = '#efece4', LOUV = '#d6d2c6', CONC = '#cbc5b7', GLS = {c:'#3c5862', m:1, fh:3.6, cw:2.2, lk:0.4}, LOB = {c:'#9db4ba', m:0, glow:'#ffe2b4', gk:0.85},
    DARK = '#2f3a3e', PAVE = '#bdb7aa', SOFF = {c:'#d8d2c4', glow:'#ffe6c4', gk:0.35}, MOS = '#c4b9a3';
  const F = frame(0, 0, 122*PI/180);
  const UW = 34, VW = 22.5, UR = 38.2, VR = 28.2, YT = 15.2, YE = 20.3, YV = 18.6;   // walls, roof extents, roof edge / valley heights
  // ---- base: plaza, plinth, foundations ----
  const SITEP = offP(shP([[9.7,-42.7],[36.0,-26.7],[33.6,-23.1],[44.9,-16.0],[4.9,48.0],[-42.8,19.0],[-36.8,10.1],[-50.0,2.4],[-41.0,-11.9],[-28.5,-4.7],[-3.4,-45.1],[7.3,-38.5]], OX, OZ), -0.8);
  wallP(B.p(CONC), SITEP, -5, 0.4); capP(B.p(PAVE), SITEP, 0.4);
  // ---- the two blocks and the concourse ----
  for (const [u0, u1] of [[-UW, -5], [5.5, UW]]){
    bxF(B.p(LOB), F, u0 + 1.5, u1 - 1.5, 0.4, 5.2, -VW + 2.5, VW - 2.5);                       // recessed ground floor
    bxF(B.p(GLS), F, u0, u1, 5.2, YT, -VW, VW);                                                 // upper floors, curtain walls
    for (const s of [-1, 1]) for (let y = 5.2; y < YT; y += 3.35) bxF(B.p(DARK), F, u0, u1, y - 0.25, y + 0.15, s*VW - 0.05, s*(VW + 0.15));
    for (let u = u0 + 3; u < u1 - 1; u += 4.2) for (const s of [-1, 1]) bxF(B.p(DARK), F, u - 0.08, u + 0.08, 5.2, YT, s*VW, s*(VW + 0.12));
    bxF(B.p(CONC), F, u0 - 0.4, u0 + 0.4, 0.4, YT, -VW, VW); bxF(B.p(CONC), F, u1 - 0.4, u1 + 0.4, 0.4, YT, -VW, VW);   // end walls
  }
  bxF(B.p(LOB), F, -5, 5.5, 0.4, YT + 1.5, -VW + 1, VW - 1);                                     // the glazed concourse
  // end walls of the whole box: mosaic-tiled panels
  for (const s of [-1, 1]) bxF(B.p(MOS), F, s*UW - 0.6, s*UW + 0.6, 5.2, YT, -VW + 3, VW - 3);
  // columns carrying the roof (front and back rows) and round the ground floor
  for (let u = -UW + 2; u <= UW - 1; u += 6.4) for (const s of [-1, 1]){ const p = F(u, 0, s*(VW + 1.6)); segP(B.p(WHITE), [p[0], 0.4, p[2]], [p[0], YE - 1.2, p[2]], 0.42, 6); }
  // ---- louvre screens hanging from the roof along the front and the back ----
  for (const s of [-1, 1]){
    for (let u = -UW; u <= UW; u += 0.9) bxF(B.p(LOUV), F, u - 0.06, u + 0.06, YT - 3.4, YE - 1.4, s*(VW + 2.1), s*(VW + 2.9));
    bxF(B.p(WHITE), F, -UW, UW, YT - 3.6, YT - 3.2, s*(VW + 2.0), s*(VW + 3.0));
  }
  // ---- butterfly roof: two planes falling to the central valley, thick white fascia, soffit ----
  const top = v => YV + (YE - YV)*Math.abs(v)/VR;
  const o = B.p(WHITE), so = B.p(SOFF);
  for (const s of [-1, 1]){
    const a = F(-UR, top(s*VR), s*VR), b = F(UR, top(s*VR), s*VR), c = F(UR, YV, 0), d = F(-UR, YV, 0);
    quadP(o, a, b, c, d);
    const a2 = F(-UR, top(s*VR) - 1.3, s*VR), b2 = F(UR, top(s*VR) - 1.3, s*VR), c2 = F(UR, YV - 1.0, 0), d2 = F(-UR, YV - 1.0, 0);
    quadP(so, a2, b2, c2, d2);
    quadP(o, a, b, b2, a2);                                                                       // long fascia
    for (const su of [-1, 1]){ const p = F(su*UR, top(s*VR), s*VR), q = F(su*UR, YV, 0), q2 = F(su*UR, YV - 1.0, 0), p2 = F(su*UR, top(s*VR) - 1.3, s*VR); quadP(o, p, q, q2, p2); }
  }
  // rainwater spout at the middle of the valley ends
  for (const su of [-1, 1]){ const p = F(su*(UR + 0.6), YV - 0.6, 0); segP(B.p(CONC), [p[0], 0.4, p[2]], [p[0], YV - 0.4, p[2]], 0.35, 6); }
  // ---- entrance pavilion on Shenton Way, service wing at the north-east end ----
  bxF(B.p(LOB), F, 11.5, 26.6, 0.4, 5.0, VW, 41.0);
  bxF(B.p(WHITE), F, 10.4, 27.8, 5.0, 5.9, VW, 42.8);
  for (const u of [11, 19, 27.2]) for (const v of [30, 42.2]){ const p = F(u, 0, v); segP(B.p(WHITE), [p[0], 0.4, p[2]], [p[0], 5.0, p[2]], 0.3, 6); }
  bxF(B.p(CONC), F, -42.4, -UW, 0.4, 11.5, -14.6, 15.8);
  B.flush(g); return g; }};
SG_PLACES.push({type:'sgconfhall', lat:1.276156, lon:103.849009, rot:0});
}
// ================= Telok Ayer Chinese Methodist Church (1924-25, Denis Santry of Swan & Maclaren), 235 Telok Ayer Street ======
// A trapezoidal two-storey church at the junction of Telok Ayer Street and Cecil Street: the social hall on the ground floor
// behind the arcaded five-foot-way (piers with cushion capitals), the sanctuary above behind tall round-arched louvred
// windows, cornices and a balustraded flat roof; on the roof at the front an open Chinese pavilion with red columns and a
// green glazed hip-and-gable roof with upswept eaves. Night: warm floodlight, the pavilion lit.
{
const A0 = [1.27847, 103.84700], OX = 0.7, OZ = 0.0;
LANDMARKS.sgtelokayer = {zh:'直落亚逸礼拜堂', en:'Telok Ayer Chinese Methodist Church', cat:'old', r:20, h:21, lt:{m:0, c:'#ffdcae', k:1.0, e:0.6, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
  const WALL = '#efe5cc', TRIM = '#f8f4ea', BASE = '#b9b1a0', DARK = '#4f463d', SHUT = '#4a6a4c', RED = '#a8322b', TILE = {c:'#3f7d55', m:0, lk:0.9},
    RIDGE = '#2c5e40', TERR = '#bdb5a3', GOLD = {c:'#d6b04a', lk:1.2}, LAMP = {c:'#fff0cc', glow:'#ffd890', gk:1.6};
  const P = shP([[-7.7,14.1],[-8.9,-15.5],[10.8,-13.7],[8.4,15.3]], OX, OZ);
  const Y1 = 5.4, Y2 = 12.6, YR = 13.3;
  wallP(B.p(BASE), P, -5, 0.3); capP(B.p(BASE), P, 0.3);
  prismP(B.p(WALL), offP(P, 0.15), 0.3, YR);
  for (const e of edgesF(P)){
    const n = Math.max(3, Math.round(e.L/3.7)), bw = e.L/n;
    // ground floor: arcade of round arches between piers with cushion capitals
    for (let k = 0; k < n; k++){
      const uc = (k + 0.5)*bw;
      shapeP(B.p(DARK), mv(rArchO(bw*0.34, 4.3, 8), uc, 0.3), e.F, 0.03);
      slabP(B.p(TRIM), mv(rArchO(bw*0.4, 4.65, 8), uc, 0.3), e.F, 0, 0.02);
      // upper storey: tall round-arched window with green louvred shutters, a sill, a small round window above
      shapeP(B.p(SHUT), mv(rArchO(bw*0.2, 4.4, 8), uc, Y1 + 1.4), e.F, 0.05);
      slabP(B.p(TRIM), rectO(uc - bw*0.26, uc + bw*0.26, Y1 + 1.15, Y1 + 1.4), e.F, 0, 0.18);
      shapeP(B.p(DARK), ringPts(0, 0, 0.42, 10).map(p => [uc + p[0], Y2 - 0.95 + p[1]]), e.F, 0.05);
    }
    for (let k = 0; k <= n; k++){
      const u = k*bw, wd = (k === 0 || k === n) ? 0.7 : 0.45;
      slabP(B.p(TRIM), rectO(u - wd, u + wd, 0.3, Y1), e.F, 0, 0.32);
      slabP(B.p(TRIM), rectO(u - wd - 0.18, u + wd + 0.18, Y1 - 1.1, Y1 - 0.75), e.F, 0, 0.45);
      slabP(B.p(TRIM), rectO(u - wd*0.7, u + wd*0.7, Y1 + 0.6, Y2), e.F, 0, 0.2);
    }
    slabP(B.p(TRIM), rectO(-0.3, e.L + 0.3, Y1, Y1 + 0.6), e.F, 0, 0.5);
    slabP(B.p(TRIM), rectO(-0.4, e.L + 0.4, Y2, YR), e.F, 0, 0.6);
  }
  // balustraded parapet round the roof terrace
  capP(B.p(TERR), offP(P, 0.15), YR + 0.01);
  for (const [x, z] of alongP(offP(P, 0.35), 0.55)) segP(B.p(TRIM), [x, YR, z], [x, YR + 0.85, z], 0.08, 4);
  parP(B.p(TRIM), P, YR + 0.85, YR + 1.1, 0.4);
  for (const p of P) bxP(B.p(TRIM), p[0] - 0.45, p[0] + 0.45, YR, YR + 1.4, p[1] - 0.45, p[1] + 0.45);
  // a relief cross on the front (south) facade over the entrance
  { const e = edgesF(P).find(f => Math.abs(f.nz) > 0.9 && f.nz > 0); if (e){ slabP(B.p(TRIM), rectO(e.L/2 - 0.18, e.L/2 + 0.18, Y2 - 2.6, Y2 - 0.3), e.F, 0.2, 0.35); slabP(B.p(TRIM), rectO(e.L/2 - 0.75, e.L/2 + 0.75, Y2 - 1.15, Y2 - 0.8), e.F, 0.2, 0.35); } }
  // ---- the Chinese pavilion on the roof at the front ----
  const ry = -0.0744, c = ctr(P), cx = c[0] + 0.2, cz = c[1] + 9.2, RR = rotP(cx, cz, ry);
  { const pl = [[-4.6, -3.9], [4.6, -3.9], [4.6, 3.9], [-4.6, 3.9]].map(p => { const q = RR(p[0], 0, p[1]); return [q[0], q[2]]; }); prismP(B.p(TRIM), pl, YR, YR + 0.45); }
  const YC = YR + 0.45, HC = 3.5;
  for (const [x, z] of [[-3.9, -3.2], [0, -3.2], [3.9, -3.2], [-3.9, 3.2], [0, 3.2], [3.9, 3.2]]){ const q = RR(x, 0, z); segP(B.p(RED), [q[0], YC, q[2]], [q[0], YC + HC, q[2]], 0.22, 8); }
  for (const s of [-1, 1]){ const a = RR(-4.1, 0, s*3.2), b = RR(4.1, 0, s*3.2); segP(B.p(RED), [a[0], YC + HC - 0.3, a[2]], [b[0], YC + HC - 0.3, b[2]], 0.2, 4); const a2 = RR(s*3.9, 0, -3.4), b2 = RR(s*3.9, 0, 3.4); segP(B.p(RED), [a2[0], YC + HC - 0.3, a2[2]], [b2[0], YC + HC - 0.3, b2[2]], 0.2, 4); }
  const hips = B.p(RIDGE), ridge = B.p(RIDGE);
  roofP(B.p(TILE), cx, cz, 5.6, 4.9, 3.0, 0, YC + HC, 3.2, {ry, lift:0.85, pw:1.5, gab:0.62, gcol:B.p(RED), hips, ridge, rr:0.24, hr:0.15, sag:0.25, fas:0.35, fo:B.p(RED)});
  for (const s of [-1, 1]){ const q = RR(s*3.2, 0, 0); chiweiP(B.p(RIDGE), q[0], YC + HC + 3.2 + 0.2, q[2], ry + (s > 0 ? 0 : PI), 0.9); }
  { const q = RR(0, 0, 0); latheP(B.p(GOLD), [[0.3, YC + HC + 3.3], [0.35, YC + HC + 3.6], [0.18, YC + HC + 4.1], [0.02, YC + HC + 4.5]], q[0], q[2], 8); }
  for (const [x, z] of [[-2.0, 3.4], [2.0, 3.4], [-2.0, -3.4], [2.0, -3.4]]){ const q = RR(x, 0, z); boxP(B.p(LAMP), 0.4, 0.55, 0.4, q[0], YC + HC - 1.2, q[2]); }
  B.flush(g); return g; }};
SG_PLACES.push({type:'sgtelokayer', lat:1.27847, lon:103.847006, rot:0});
}
// ================= Sri Layan Sithi Vinayagar Temple (1925; rajagopuram 2007), 73 Keong Saik Road =================
// The Chettiar temple to Vinayagar at the bend of Keong Saik Road by Kreta Ayer Road: a flat-roofed temple hall with
// pilasters and a red / gold cornice carrying small shrines and Nandi figures, the vimana over the sanctum, and the five-tier
// rajagopuram over the entrance facing Keong Saik Road, crowded with painted stucco deities, cornices with miniature shrines
// and the barrel-vaulted crown with gilt kalasams. Figures are abstracted. Night: warm floodlight, lamps at the door.
{
const A0 = [1.28126, 103.84165];
LANDMARKS.sglayan = {zh:'斯里拉央西迪维纳亚加兴都庙', en:'Sri Layan Sithi Vinayagar Temple', cat:'old', r:22, h:20.5, lt:{m:0, c:'#ffd9a8', k:1.0, e:0.55, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB(), V = mkV(), R = LMCTX.rng;
  const STONE = '#a79f90', WALL = '#f2e8d2', DOOR = '#5b3b22', DARK = '#3a2f29', ROOF = '#bdb3a2', LAMP = {c:'#fff2cc', glow:'#ffd890', gk:1.8}, GOLDS = {c:'#d9a93f', lc:'#ffd27e', lk:1.3};
  const PAL = ['#3d6fd0', '#d23b2c', '#3e9b4b', '#e9c33b', '#f3efe5', '#e690a2', '#e8873b', '#5bb9e1', '#9a5cc6', '#2f8f8a'];
  const SKIN = ['#3a62c4', '#4f86d6', '#e2b08a', '#d39a6c', '#f0d2b4', '#59a8d8'];
  const pk = A => A[Math.floor(R()*A.length)];
  const P = [[-11.7,8.4],[-15.9,7.2],[-8.7,-13.6],[14.0,-12.4],[14.6,1.2],[12.8,1.2],[12.8,8.9],[8.6,8.9],[8.0,16.1],[-11.7,10.7]];
  const YH = 7.0;
  // ---- the temple hall ----
  wallP(B.p(STONE), P, -5, 0.4); capP(B.p(STONE), P, 0.4);
  prismP(B.p(WALL), offP(P, 0.1), 0.4, YH);
  for (const e of edgesF(P)){ if (e.L < 1.5) continue;
    const n = Math.max(1, Math.round(e.L/2.6));
    for (let k = 0; k <= n; k++) vAdd(V, '#e6be3c', t => slabP(t, rectO(k*e.L/n - 0.16, k*e.L/n + 0.16, 0.4, YH - 0.5), e.F, 0, 0.14));
    // red and white vertical stripes on the base course, a red band and the gilt cornice
    for (let u = 0.3; u < e.L - 0.3; u += 0.9) vAdd(V, '#c8462f', t => shapeP(t, rectO(u, u + 0.45, 0.6, 2.0), e.F, 0.05));
    vAdd(V, '#c8462f', t => slabP(t, rectO(0, e.L, YH - 0.5, YH), e.F, 0, 0.3));
    vAdd(V, '#e6be3c', t => slabP(t, rectO(-0.1, e.L + 0.1, YH, YH + 0.3), e.F, 0, 0.45));
    for (let k = 0; k < n; k++){ const uc = (k + 0.5)*e.L/n; if (R() < 0.5) shapeP(B.p(DARK), mv(rArchO(0.45, 1.6, 6), uc, 3.0), e.F, 0.05); }
  }
  capP(B.p(ROOF), offP(P, 0.1), YH + 0.31);
  // parapet with miniature shrines and Nandi figures at intervals
  for (const [x, z, a] of alongP(offP(P, 0.4), 2.2)){
    if (R() < 0.35){ boxP(B.p(WALL), 0.9, 0.5, 0.5, x, YH + 0.3, z, -a); boxP(B.p(WALL), 0.3, 0.45, 0.32, x + Math.cos(a)*0.38, YH + 0.55, z + Math.sin(a)*0.38, -a); }
    else vAdd(V, pk(PAL), t => { boxP(t, 0.5, 0.45, 0.5, x, YH + 0.3, z, -a); latheP(t, [[0.3, YH + 0.75], [0.33, YH + 0.9], [0.2, YH + 1.15], [0.04, YH + 1.35]], x, z, 6); });
  }
  // ---- vimana over the sanctum (west part): three tapering tiers and an octagonal dome with a gilt finial ----
  { const vx = -6.0, vz = -2.0; let y = YH + 0.3;
    for (let i = 0; i < 3; i++){ const w = 5.2 - i*1.2, h = 1.6 - i*0.15; vAdd(V, i % 2 ? '#f1e3c6' : '#f4dcc0', t => frustP(t, vx, vz, w, w, w - 0.4, w - 0.4, y, h));
      vAdd(V, i % 2 ? '#c8462f' : '#2f6fbf', t => frustP(t, vx, vz, w - 0.2, w - 0.2, w + 0.1, w + 0.1, y + h, 0.25));
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) vAdd(V, pk(PAL), t => { boxP(t, 0.4, 0.35, 0.4, vx + sx*(w/2 - 0.1), y + h + 0.25, vz + sz*(w/2 - 0.1)); });
      for (const s of [-1, 1]){ vAdd(V, pk(PAL), t => slabP(t, rectO(-0.5, 0.5, y + 0.1, y + h - 0.1), fZ(vz + s*(w/2 - 0.2), s, vx), 0, 0.2)); vAdd(V, pk(PAL), t => slabP(t, rectO(-0.5, 0.5, y + 0.1, y + h - 0.1), fX(vx + s*(w/2 - 0.2), s, vz), 0, 0.2)); }
      y += h + 0.25; }
    vAdd(V, '#f3e6c8', t => latheP(t, [[1.5, y], [1.75, y + 0.5], [1.6, y + 1.2], [1.0, y + 1.8], [0.2, y + 2.1]], vx, vz, 8, PI/8));
    latheP(B.p(GOLDS), [[0.25, y + 2.0], [0.32, y + 2.4], [0.15, y + 2.9], [0.02, y + 3.2]], vx, vz, 8);
  }
  // ---- the rajagopuram over the east entrance on Keong Saik Road ----
  const GX = 11.6, GZ = -5.6, GW = 9.0, GD = 5.6;      // centre, width (along the street), depth
  bxP(B.p(STONE), GX - GD/2 - 0.3, GX + GD/2 + 0.3, 0.4, 1.3, GZ - GW/2 - 0.3, GZ + GW/2 + 0.3);
  bxP(B.p(WALL), GX - GD/2, GX + GD/2, 1.3, 6.2, GZ - GW/2, GZ + GW/2);
  // a standing deity on frame F: robe, arms, head, crown
  const deity = (F, u, v, w0, h) => {
    vAdd(V, pk(PAL), t => slabP(t, [[u - 0.22*h, v], [u + 0.22*h, v], [u + 0.15*h, v + 0.62*h], [u - 0.15*h, v + 0.62*h]], F, w0, w0 + 0.2*h));
    vAdd(V, pk(SKIN), t => { slabP(t, rectO(u - 0.33*h, u + 0.33*h, v + 0.42*h, v + 0.52*h), F, w0 + 0.03*h, w0 + 0.15*h); slabP(t, rectO(u - 0.085*h, u + 0.085*h, v + 0.62*h, v + 0.8*h), F, w0 + 0.03*h, w0 + 0.17*h); });
    vAdd(V, '#e6be3c', t => slabP(t, [[u - 0.09*h, v + 0.8*h], [u + 0.09*h, v + 0.8*h], [u, v + 1.0*h]], F, w0 + 0.03*h, w0 + 0.16*h));
  };
  { const F = fX(GX + GD/2, 1, GZ);   // street face (+x)
    shapeP(B.p(DARK), rectO(-1.6, 1.6, 1.3, 5.2), F, 0.03); shapeP(B.p(DOOR), rectO(-1.45, -0.04, 1.3, 4.8), F, 0.06); shapeP(B.p(DOOR), rectO(0.04, 1.45, 1.3, 4.8), F, 0.06);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) for (const sx of [-1, 1]) boxP(B.p(GOLDS), 0.09, 0.09, 0.09, GX + GD/2 + 0.1, 1.8 + i*0.48, GZ - sx*(0.35 + j*0.28));
    for (const u of [-3.4, -2.3, 2.3, 3.4]){ vAdd(V, '#e6be3c', t => slabP(t, rectO(u - 0.45, u + 0.45, 1.8, 4.9), F, 0, 0.1)); shapeP(B.p(DARK), rectO(u - 0.36, u + 0.36, 1.95, 4.65), F, 0.12); deity(F, u, 2.0, 0.12, 2.2); }
    for (const s of [-1, 1]) boxP(B.p(LAMP), 0.3, 0.45, 0.3, GX + GD/2 + 0.35, 4.7, GZ + s*2.0);
  }
  vAdd(V, '#c8462f', t => frustP(t, GX, GZ, GD + 0.5, GW + 0.5, GD + 0.8, GW + 0.8, 6.2, 0.35));
  vAdd(V, '#e6be3c', t => frustP(t, GX, GZ, GD + 0.8, GW + 0.8, GD + 0.5, GW + 0.5, 6.55, 0.25));
  let y = 6.8;
  const NT = 5;
  for (let i = 0; i < NT; i++){
    const f = i/(NT - 1), W = lerp(8.4, 4.4, f), D = lerp(5.0, 2.7, f), hb = lerp(1.95, 1.5, f), Wt = W - 0.4, Dt = D - 0.25;
    vAdd(V, i % 2 ? '#f1e3c6' : '#f4dcc0', t => frustP(t, GX, GZ, D, W, Dt, Wt, y, hb));
    for (const [F, len, fr] of [[fX(GX + D/2, 1, GZ), W, 1], [fX(GX - D/2, -1, GZ), W, 1], [fZ(GZ + W/2, 1, GX), D, 0], [fZ(GZ - W/2, -1, GX), D, 0]]){
      const n = Math.max(2, Math.round((len - 0.4)/0.72));
      for (let j = 0; j < n; j++){ const u = -len/2 + 0.2 + (j + 0.5)*(len - 0.4)/n; if (fr && Math.abs(u) < 0.7) continue; deity(F, u, y + 0.1, 0.02, hb*0.82); }
      if (fr) shapeP(B.p(DARK), mv(rArchO(0.4, 1.2*hb/1.95, 6), 0, y + 0.15), F, 0.06);
    }
    vAdd(V, i % 2 ? '#c8462f' : '#2f6fbf', t => frustP(t, GX, GZ, Dt + 0.5, Wt + 0.5, Dt + 0.75, Wt + 0.75, y + hb, 0.25));
    vAdd(V, '#e6be3c', t => frustP(t, GX, GZ, Dt + 0.75, Wt + 0.75, Dt + 0.6, Wt + 0.6, y + hb + 0.25, 0.1));
    y += hb + 0.35;
    const Wp = Wt + 0.5, Dp = Dt + 0.5;
    for (const sz of [-1, 1]) for (const sx of [-1, 1]) vAdd(V, pk(PAL), t => { boxP(t, 0.38, 0.3, 0.38, GX + sx*(Dp/2 - 0.2), y, GZ + sz*(Wp/2 - 0.2)); latheP(t, [[0.22, y + 0.3], [0.25, y + 0.4], [0.15, y + 0.56], [0.03, y + 0.7]], GX + sx*(Dp/2 - 0.2), GZ + sz*(Wp/2 - 0.2), 6); });
    for (const sx of [-1, 1]){ const n = Math.max(1, Math.round((Wp - 0.8)/1.0)); for (let j = 0; j < n; j++){ const u = -Wp/2 + 0.4 + (j + 0.5)*(Wp - 0.8)/n; vAdd(V, pk(PAL), t => { boxP(t, 0.36, 0.3, 0.6, GX + sx*(Dp/2 - 0.2), y, GZ + u); latheP(t, [[0.2, y + 0.3], [0.2, y + 0.42], [0.1, y + 0.6], [0.02, y + 0.68]], GX + sx*(Dp/2 - 0.2), GZ + u, 6); }); } }
  }
  // the crown (sala): barrel vault along the street with horseshoe gable ends and five gilt kalasams
  { const L = 4.2, r = 1.15, y0 = y + 0.1; vAdd(V, '#f4dcc0', t => bxP(t, GX - 1.1, GX + 1.1, y - 0.05, y0 + 0.35, GZ - L/2, GZ + L/2));
    const S = []; for (let i = 0; i <= 10; i++){ const a = PI*i/10; S.push([Math.cos(a)*r, y0 + 0.35 + Math.sin(a)*r*1.1]); }
    vAdd(V, '#3e9b4b', t => { for (let i = 0; i < 10; i++){ const p = S[i], q = S[i+1]; quadP(t, [GX + p[0], p[1], GZ - L/2], [GX + q[0], q[1], GZ - L/2], [GX + q[0], q[1], GZ + L/2], [GX + p[0], p[1], GZ + L/2]); } });
    for (const s of [-1, 1]) vAdd(V, '#e6be3c', t => slabP(t, S.map(p => [p[0]*1.25, y0 + 0.35 + (p[1] - y0 - 0.35)*1.25]), fZ(GZ + s*L/2, s, GX), 0, 0.2));
    for (let k = 0; k < 5; k++){ const z = GZ - L/2 + 0.4 + k*(L - 0.8)/4; latheP(B.p(GOLDS), [[0.18, y0 + 1.55], [0.26, y0 + 1.8], [0.12, y0 + 2.1], [0.03, y0 + 2.45]], GX, z, 8); }
  }
  B.flush(g); vFlush(g, V, {m:0, lk:0.8}); return g; }};
SG_PLACES.push({type:'sglayan', lat:1.28126, lon:103.84165, rot:0});
}
// ================= Nagore Dargah (1828-30; now the Nagore Dargah Indian Muslim Heritage Centre), 140 Telok Ayer Street ====
// A small rectangular Indo-Saracenic shrine at the corner of Telok Ayer Street and Boon Tat Street, built by Chulia Muslims
// in memory of the saint of Nagore. Four identical minaret towers at the corners, fourteen niched tiers each with an onion
// dome; between the two front towers on Telok Ayer Street the "miniature palace facade" pierced with tiny doors and windows,
// rising above the flat roof with small domed kiosks; the Moorish multifoil entrance arch; fluted pilasters; tall French
// windows with semicircular fanlights along Boon Tat Street. Night: warm breathing floodlight, the entrance lit.
{
const A0 = [1.28146, 103.84787];
LANDMARKS.sgnagore = {zh:'纳哥德卡圣祠', en:'Nagore Dargah', cat:'old', r:15, h:20, lt:{m:0, c:'#ffdcb0', k:1.05, e:0.6, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
  const WALL = '#ece2c6', TRIM = '#f8f4ea', BASE = '#b5ac9a', DARK = '#4a4038', SHUT = '#6f8f6a', DOME = '#f4f0e4', GOLD = {c:'#d6b04a', lc:'#ffd27e', lk:1.2},
    ROOF = '#bfb6a4', LAMP = {c:'#fff0cc', glow:'#ffd890', gk:1.5}, ACC = '#c9d6c0';
  const F = frame(0, 0.2, 29.26*PI/180), HU = 10.95, HV = 6.15, T = 1.25, Y1 = 5.2, Y2 = 9.4;   // half sizes, minaret half-width
  const PL = polyF(F, [[-HU, -HV], [HU, -HV], [HU, HV], [-HU, HV]]);
  // multifoil (cusped) arch outline
  const foil = (hw, hs, lobes, n) => { const P = [[-hw, 0], [hw, 0], [hw, hs]]; n = n || 18; for (let i = 1; i < n; i++){ const t = PI*i/n, r = hw*(0.86 + 0.14*Math.abs(Math.cos(lobes*t))); P.push([Math.cos(t)*r, hs + Math.sin(t)*r*1.05]); } P.push([-hw, hs]); return P; };
  wallP(B.p(BASE), PL, -5, 0.4); capP(B.p(BASE), PL, 0.4);
  prismP(B.p(WALL), offP(PL, 0.1), 0.4, Y2);
  capP(B.p(ROOF), offP(PL, 0.1), Y2 + 0.61);
  // faces: front (u = +HU, Telok Ayer Street), Boon Tat Street side (v = -HV), rear, south side
  const FF = (u0, v0, u1, v1) => { const a = F.P(u0, v0), b = F.P(u1, v1); const L = Math.hypot(b[0] - a[0], b[1] - a[1]), ex = (b[0] - a[0])/L, ez = (b[1] - a[1])/L, nx = -ez, nz = ex;
    return {L, F:(u, v, w) => [a[0] + ex*u + nx*(w || 0), v, a[1] + ez*u + nz*(w || 0)]}; };
  const front = FF(HU, HV, HU, -HV), north = FF(HU, -HV, -HU, -HV), rear = FF(-HU, -HV, -HU, HV), south = FF(-HU, HV, HU, HV);
  for (const e of [front, north, rear, south]){
    slabP(B.p(TRIM), rectO(-0.2, e.L + 0.2, Y1 - 0.3, Y1 + 0.2), e.F, 0, 0.3);
    slabP(B.p(TRIM), rectO(-0.3, e.L + 0.3, Y2, Y2 + 0.6), e.F, 0, 0.55);
    // parapet with small merlons and finials
    slabP(B.p(WALL), rectO(0, e.L, Y2 + 0.6, Y2 + 1.3), e.F, -0.2, 0.1);
    for (let u = 2.2; u < e.L - 2; u += 1.1){ slabP(B.p(TRIM), rectO(u - 0.18, u + 0.18, Y2 + 1.3, Y2 + 1.75), e.F, -0.15, 0.05); const p = e.F(u, Y2 + 1.75, -0.05); latheP(B.p(DOME), [[0.14, Y2 + 1.75], [0.17, Y2 + 1.9], [0.08, Y2 + 2.1], [0.02, Y2 + 2.25]], p[0], p[2], 6); }
  }
  // Boon Tat Street side, rear and south: tall French windows with semicircular fanlights between fluted pilasters
  for (const e of [north, south, rear]){
    const n = Math.max(2, Math.round((e.L - 2*T*2)/2.6)), u0 = 2*T + 0.3, bw = (e.L - 2*u0)/n;
    for (let k = 0; k < n; k++){ const uc = u0 + (k + 0.5)*bw;
      for (const [yb, h] of [[0.9, 3.6], [Y1 + 0.6, 3.1]]){ slabP(B.p(TRIM), mv(rArchO(0.85, h + 0.25, 10), uc, yb - 0.1), e.F, 0, 0.06); shapeP(B.p(SHUT), mv(rArchO(0.7, h, 10), uc, yb), e.F, 0.08); shapeP(B.p(DARK), ringPts(0, 0, 0.42, 10).map(p => [uc + p[0], yb + h - 0.7 + p[1]*0.6]), e.F, 0.1); }
    }
    for (let k = 0; k <= n; k++){ const u = u0 + k*bw; slabP(B.p(TRIM), rectO(u - 0.22, u + 0.22, 0.4, Y2), e.F, 0, 0.18); slabP(B.p(TRIM), rectO(u - 0.32, u + 0.32, Y1 - 0.75, Y1 - 0.35), e.F, 0, 0.26); slabP(B.p(TRIM), rectO(u - 0.32, u + 0.32, Y2 - 0.55, Y2 - 0.1), e.F, 0, 0.26); }
  }
  // ---- the front: multifoil entrance arch, pilasters, and the pierced miniature palace facade rising above the roof ----
  { const e = front, uc = e.L/2, YP = 14.6, w0 = 2*T + 0.2, w1 = e.L - w0;
    slabP(B.p(WALL), rectO(w0, w1, Y2, YP - 1.1), e.F, -0.3, 0.05);
    slabP(B.p(TRIM), mv(foil(1.75, 2.6, 4), uc, 0.4), e.F, 0, 0.12); shapeP(B.p(DARK), mv(foil(1.4, 2.5, 4), uc, 0.4), e.F, 0.14);
    for (const s of [-1, 1]){ for (const du of [2.2, 3.1]) { slabP(B.p(TRIM), rectO(uc + s*du - 0.2, uc + s*du + 0.2, 0.4, Y1 - 0.3), e.F, 0, 0.3); slabP(B.p(TRIM), rectO(uc + s*du - 0.32, uc + s*du + 0.32, Y1 - 0.85, Y1 - 0.3), e.F, 0, 0.4); }
      shapeP(B.p(SHUT), mv(rArchO(0.35, 2.6, 8), uc + s*2.65, 1.0), e.F, 0.08); }
    // the palace front: four rows of tiny doors / windows, balcony ledges, pilasterettes
    const rows = [[Y1 + 0.5, 1.5, 7], [Y1 + 2.4, 1.2, 9], [Y2 + 0.9, 1.0, 9], [Y2 + 2.5, 0.85, 7]];
    for (const [yb, h, n] of rows){ const span = (w1 - w0) - 0.8, du = span/n;
      for (let k = 0; k < n; k++){ const u = w0 + 0.4 + (k + 0.5)*du; shapeP(B.p(DARK), mv(foil(du*0.28, h - du*0.28, 3, 10), u, yb), e.F, 0.1); slabP(B.p(TRIM), rectO(u + du*0.45 - 0.07, u + du*0.45 + 0.07, yb, yb + h + 0.15), e.F, 0, 0.14); }
      slabP(B.p(TRIM), rectO(w0 + 0.2, w1 - 0.2, yb - 0.25, yb - 0.05), e.F, 0, 0.4); }
    slabP(B.p(ACC), rectO(w0 + 0.3, w1 - 0.3, Y1 + 0.15, Y1 + 0.35), e.F, 0, 0.3);
    slabP(B.p(TRIM), rectO(w0, w1, YP - 1.1, YP - 0.7), e.F, -0.4, 0.3);
    // small domed kiosks along the top, a larger one in the middle
    for (let k = 0; k < 5; k++){ const u = w0 + 0.5 + k*(w1 - w0 - 1)/4, big = k === 2, r = big ? 0.6 : 0.36, p = e.F(u, 0, -0.1), y0 = YP - 0.7;
      for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) segP(B.p(TRIM), [p[0] + dx*r*0.7, y0, p[2] + dz*r*0.7], [p[0] + dx*r*0.7, y0 + (big ? 1.0 : 0.7), p[2] + dz*r*0.7], 0.06, 4);
      latheP(B.p(DOME), onion(r).map(q => [q[0], y0 + (big ? 1.0 : 0.7) + q[1]]), p[0], p[2], 10);
      latheP(B.p(GOLD), [[0.05, y0 + (big ? 1.0 : 0.7) + r*2.35], [0.05, y0 + (big ? 1.0 : 0.7) + r*2.35 + 0.4]], p[0], p[2], 4); }
    for (const s of [-1, 1]) { const p = e.F(uc + s*1.9, 0, 0.35); boxP(B.p(LAMP), 0.3, 0.45, 0.3, p[0], 3.4, p[2]); }
  }
  // ---- four minaret towers: fourteen niched tiers, onion domes with gilt finials ----
  for (const [su, sv] of [[1, -1], [1, 1], [-1, -1], [-1, 1]]){
    const c = F.P(su*(HU - T), sv*(HV - T)), NT = 14, y0 = 0.4, th = 1.22;
    for (let i = 0; i < NT; i++){
      const y = y0 + i*th, hw = T*(1 - 0.012*i), ry = -F.a;
      boxP(B.p(i % 2 ? WALL : TRIM), hw*2, th - 0.18, hw*2, c[0], y, c[1], ry);
      boxP(B.p(TRIM), hw*2 + 0.26, 0.18, hw*2 + 0.26, c[0], y + th - 0.18, c[1], ry);
      if (i > 0) for (const [fx, fz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){ const Fm = (u, v, w) => { const cc = Math.cos(F.a), ss = Math.sin(F.a), lu = fx*(hw + (w || 0)) + (fz ? u : 0)*1, lv = fz*(hw + (w || 0)) + (fx ? u : 0)*1; return [c[0] + lu*cc - lv*ss, v, c[1] + lu*ss + lv*cc]; };
        shapeP(B.p(DARK), mv(rArchO(0.3, 0.75, 6), 0, y + 0.12), Fm, 0.02); }
    }
    const yt = y0 + NT*th;
    latheP(B.p(TRIM), [[T*0.9, yt], [T*0.95, yt + 0.3], [T*0.7, yt + 0.45]], c[0], c[1], 8, PI/8);
    latheP(B.p(DOME), onion(T*0.78).map(q => [q[0], yt + 0.45 + q[1]]), c[0], c[1], 12);
    latheP(B.p(GOLD), [[0.07, yt + 0.45 + T*0.78*2.35], [0.07, yt + 0.45 + T*0.78*2.35 + 0.7]], c[0], c[1], 4);
  }
  B.flush(g); return g; }};
SG_PLACES.push({type:'sgnagore', lat:1.28146, lon:103.84787, rot:0});
}
}
