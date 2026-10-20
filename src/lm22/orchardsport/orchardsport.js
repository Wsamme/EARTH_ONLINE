// ===== lm22 / orchardsport: ION Orchard, Ngee Ann City, Suntec City, Singapore Indoor Stadium, National Stadium, Jewel Changi =====
// Wave-3 upgrades of the lm18 / lm16 models. Block-scoped: only LANDMARKS and SG_PLACES are touched. Each group keeps its own
// helper set in an inner block (the lm18/d, lm18/c and lm16/changi helper sets differ in signatures). y = 0 is the ground.
{
// ---------------------------------------------------------------- Orchard Road: ION Orchard, Ngee Ann City
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


// ================= ION Orchard (2009, Benoy with RSP) and The Orchard Residences =================
// The mall is wrapped in a smooth, bulging glass-and-metal skin (horizontal louvre bands, recessed glazed shopfronts) on
// the real curving footprint; on the Orchard Road front the louvres carry the LED media facade (lm22: abstract slow colour
// art at night, m:2, no images or text); the glass "seed pod" canopy (lm22: springs high from the skin and sweeps down to
// the street corner, a steel diagrid enmeshed with the glass) on tree columns over the main entrance and the Orchard MRT
// pavilion; the car-park block behind with the
// level-9 garden; the 56-storey residential tower (218 m, ION Sky on levels 55-56) on the real wavy plan, banded floors,
// tapering curved crown. No signage. Local frame: +z = NNE (Orchard Road front), +x = WNW (towards Paterson Road).
// Night: LED louvres on the front, glowing canopy, shopfronts lit, lit flats, lit crown.
LANDMARKS.ionorchard = {zh:'ION 乌节', en:'ION Orchard', cat:'new', r:96, h:218,
  lt:{m:1, c:'#dce8ff', k:0.6},
  build(){
    const g = new THREE.Group(), B = mkB();
    const GLASS = {c:'#8fa6b4', glow:'#cfe2ff', gk:0.42, m:0, lk:0.25}, SHOP = {c:'#3a4048', glow:'#ffe2b0', gk:0.85, m:0, lk:0.2}, METAL = {c:'#d2cfc6', m:0, lk:0.55}, DARKM = '#5d6266',
      LOUV = {c:'#d6d3cb', m:2, lk:0.95}, CANG = {c:'#c4d6de', op:0.5, glow:'#eef6ff', gk:0.3, m:0, lk:0.3}, STEEL = {c:'#e4e2dc', m:0, lk:0.7},
      TGLASS = {c:'#7f97a6', m:1, fh:3.6, cw:2.8, lk:0.4}, TBAND = {c:'#eceae4', m:0, lk:0.35}, CROWN = {c:'#9fb3c0', glow:'#d8e8ff', gk:0.75, m:0, lk:0.3}, ROOF = {c:'#aaa8a1', m:0, lk:0.25}, GRN = '#6f9a5a', CONC = '#bdb9b0', PAVE = '#c9c5bb';
    const chaikin = (P, it) => { for (let k = 0; k < it; k++){ const Q = []; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; Q.push([a[0]*0.75 + b[0]*0.25, a[1]*0.75 + b[1]*0.25], [a[0]*0.25 + b[0]*0.75, a[1]*0.25 + b[1]*0.75]); } P = Q; } return P; };
    const OUT = [[70.4,34.3],[67.5,36.5],[60.5,38.5],[58.4,41.0],[54.1,51.6],[50.5,55.0],[44.2,57.1],[6.6,58.6],[1.1,59.6],[-11.5,65.4],[-16.5,66.1],[-26.5,62.9],[-30.3,62.3],[-38.7,64.4],[-45.7,62.8],[-49.7,64.4],[-53.7,64.7],[-55.4,62.9],[-56.4,29.4],[-57.7,24.7],[-61.8,17.5],[-68.0,14.9],[-79.3,13.0],[-65.8,-45.6],[-63.1,-51.9],[-58.1,-57.5],[-52.6,-59.9],[-44.1,-61.9],[-5.7,-55.7],[4.9,-52.8],[13.0,-55.3],[21.9,-55.5],[33.4,-54.5],[48.5,-49.5],[49.4,-47.9],[57.4,-49.7],[67.8,-48.1],[72.7,-46.7],[75.0,-44.0],[77.0,-35.6],[76.7,-29.9],[68.7,4.6],[70.9,21.7],[73.5,26.3],[72.3,30.4]];
    const MALL = [[-12.4,63.8],[-16.5,66.1],[-26.5,62.9],[-30.3,62.3],[-38.7,64.4],[-45.7,62.8],[-49.7,64.4],[-53.7,64.7],[-55.4,62.9],[-56.4,29.4],[-57.7,24.7],[-61.8,17.5],[-68.0,14.9],[-79.3,13.0],[-65.8,-45.6],[-63.1,-51.9],[-58.1,-57.5],[-52.6,-59.9],[-44.1,-61.9],[-5.7,-55.7],[4.9,-52.8],[13.0,-55.3],[21.9,-55.5],[33.4,-54.5],[48.5,-49.5],[49.4,-47.9],[57.4,-49.7],[67.8,-48.1],[72.7,-46.7],[75.0,-44.0],[77.0,-35.6],[76.7,-29.9],[68.7,4.6],[70.9,21.7],[73.5,26.3],[72.3,30.4],[67.9,33.6],[63.9,33.8],[51.6,20.3],[45.9,17.4],[38.5,20.2],[36.0,24.4],[36.3,31.0],[38.2,36.7],[35.8,42.2],[32.7,45.3],[20.5,46.6],[16.4,50.3],[10.7,53.6],[4.3,54.4],[-0.9,56.0]];
    const TOWER = [[60.7,-16.9],[58.1,-15.4],[52.9,-15.1],[37.8,-16.2],[25.7,-19.5],[21.3,-22.5],[20.1,-24.6],[21.6,-26.8],[24.0,-27.4],[24.0,-32.2],[19.4,-33.1],[18.6,-34.6],[19.0,-41.0],[7.0,-43.1],[4.7,-44.6],[3.3,-47.1],[3.7,-50.1],[7.0,-54.0],[13.0,-55.3],[21.9,-55.5],[33.4,-54.5],[48.5,-49.5],[49.6,-45.3],[47.2,-43.3],[39.2,-44.3],[38.4,-38.3],[49.1,-37.5],[48.9,-30.6],[55.9,-29.1],[59.7,-27.2],[62.2,-25.2],[63.2,-22.3],[62.8,-19.4]];
    // ---- plaza and foundation ----
    wallP(B.p(CONC), OUT, -5, 0.3); capP(B.p(PAVE), OUT, 0.3);
    // ---- the mall's bulging skin: recessed shopfronts, then metal bands and glass swelling out and rolling onto the roof ----
    const M = chaikin(MALL, 2), ring = (d, y) => offP(M, -d).map(p => [p[0], y, p[1]]);
    const loft = (o, A, Bq) => { for (let i = 0; i < A.length; i++){ const j = (i + 1) % A.length; quadP(o, A[i], A[j], Bq[j], Bq[i]); } };
    const PY = [0.3, 5.0, 5.8, 9, 14, 19, 24, 28, 31.0, 32.8, 33.7, 34.2], PD = [-2.6, -2.6, -0.2, 0.9, 1.8, 2.3, 2.2, 1.5, 0.4, -1.0, -2.4, -3.6];
    const prof = y => { if (y <= PY[0]) return PD[0]; for (let i = 0; i < PY.length - 1; i++) if (y <= PY[i+1]) return lerp(PD[i], PD[i+1], (y - PY[i])/(PY[i+1] - PY[i])); return PD[PD.length - 1]; };
    loft(B.p(SHOP), ring(-2.6, 0.3), ring(-2.6, 5.0));
    loft(B.p(METAL), ring(-2.6, 5.0), ring(-0.2, 5.8));
    // the media facade: on the Orchard Road front (and round the plaza corner) the metal louvres carry LEDs (slow abstract
    // colour art at night, no images or text); elsewhere plain metal bands
    const front = p => p[1] > 14 || (p[0] > 30 && p[1] > -2);
    { let y = 5.8; let k = 0; while (y < 33.9){ const y2 = Math.min(34.2, y + (k % 2 ? 1.45 : 0.45)), A = ring(prof(y), y), Bq = ring(prof(y2), y2);
        const om = B.p(METAL), ol = B.p(LOUV), og = B.p(GLASS), top = y >= 31.0;
        for (let i = 0; i < A.length; i++){ const j = (i + 1) % A.length, o = top ? om : k % 2 ? og : (front(M[i]) && y > 7 ? ol : om); quadP(o, A[i], A[j], Bq[j], Bq[i]); }
        y = y2; k++; } }
    capP(B.p(ROOF), offP(M, 3.6), 34.2);
    // ---- the car-park block behind, with the level-9 garden ----
    const RB = chaikin([[-42,-57.5],[-5.5,-51.5],[5,-48.8],[13,-51.3],[33,-50.6],[47.5,-45.8],[66,-44.5],[72,-41],[73,-31.5],[66.5,-4],[20,-4],[-42,-4]], 1);
    const RB2 = offP(RB, 3.0); wallP(B.p(DARKM), RB2, 33.0, 40.0); capP(B.p(GRN), RB2, 40.0);
    for (const e of edgesF(RB2)){ if (e.L < 1) continue; for (let y = 34.6; y < 39.6; y += 1.2) slabP(B.p(METAL), rectO(0, e.L, y, y + 0.35), e.F, 0, 0.4); }
    wallP(B.p(METAL), offP(RB2, 0.4), 40.0, 41.1);
    // ---- the glass "seed pod" canopy over the entrance and the MRT pavilion ----
    { const C = [[32.7,45.3],[44.2,57.1],[50.5,55.0],[54.1,51.6],[58.4,41.0],[60.5,38.5],[67.5,36.5],[70.4,34.3],[67.9,33.6],[63.9,33.8],[51.6,20.3],[45.9,17.4],[38.5,20.2],[36.0,24.4],[36.3,31.0],[38.2,36.7],[35.8,42.2]];
      // the pod is high where it springs from the skin (inner side) and sweeps down towards the street corner (outer side)
      const CP = chaikin(offP(C, -2.0), 2), c = ctr(CP), N = 8, DO = [0.62, 0.78];
      let pmin = 1e9, pmax = -1e9; for (const q of CP){ const v = (q[0] - c[0])*DO[0] + (q[1] - c[1])*DO[1]; pmin = Math.min(pmin, v); pmax = Math.max(pmax, v); }
      const EH = CP.map(q => { const v = ((q[0] - c[0])*DO[0] + (q[1] - c[1])*DO[1] - pmin)/(pmax - pmin); return lerp(21.5, 7.2, Math.pow(v, 0.8)); });
      const H = (t, i) => { const e = EH[i % CP.length]; return lerp(18.8, e, t*t) + 2.2*Math.sin(PI*t)*(1 - t*0.3) + 0.9*Math.sin(i/CP.length*TAU*3 + 1)*t*(1 - t); };
      const pt = (i, t) => [c[0] + (CP[i % CP.length][0] - c[0])*t, H(t, i % CP.length), c[1] + (CP[i % CP.length][1] - c[1])*t];
      const og = B.p(CANG), os = B.p(STEEL);
      for (let i = 0; i < CP.length; i++) for (let k = 0; k < N; k++){ const t0 = k/N, t1 = (k + 1)/N; quadP(og, pt(i, t0), pt(i + 1, t0), pt(i + 1, t1), pt(i, t1)); }
      // a diagrid of steel members enmeshed with the glass (two spiral families), a stiff edge beam and two ring members
      for (let i = 0; i < CP.length; i += 2) for (let k = 1; k < N; k++) for (const sd of [1, -1]){ const i0 = (i + sd*k + 4*CP.length) % CP.length, i1 = (i + sd*(k + 1) + 4*CP.length) % CP.length; segP(os, pt(i0, k/N), pt(i1, (k + 1)/N), 0.1, 4); }
      for (const t of [0.5, 1.0]) for (let i = 0; i < CP.length; i++) segP(os, pt(i, t), pt(i + 1, t), t === 1 ? 0.22 : 0.1, 4);
      // tree columns
      let RM = 0; for (const q of CP) RM += Math.hypot(q[0] - c[0], q[1] - c[1])/CP.length;
      for (const [x, z] of [[47, 47], [60, 38], [52, 28], [42, 33]]){ segP(os, [x, 0.3, z], [x, 6.5, z], 0.35, 8); const top = [x, 6.5, z];
        for (let k = 0; k < 4; k++){ const a = k/4*TAU + 0.4; const p = [x + Math.cos(a)*3.5, 0, z + Math.sin(a)*3.5]; const tt = Math.min(1, Math.hypot(p[0] - c[0], p[2] - c[1])/RM); p[1] = H(tt, 0) - 0.3; segP(os, top, p, 0.16, 6); } }
      // MRT entrance pavilion (real footprint), curved glass roof
      const MP = chaikin([[35.2,64.3],[30.5,62.1],[26.6,52.7],[28.1,50.5],[31.8,48.4],[35.6,49.1],[41.0,56.2],[41.5,60.8]], 1);
      wallP(B.p(CANG), MP, 0.3, 3.2); const mc = ctr(MP); const ro = B.p(DARKM);
      for (let i = 0; i < MP.length; i++){ const a = MP[i], b = MP[(i+1) % MP.length]; triP(ro, [a[0], 3.2, a[1]], [b[0], 3.2, b[1]], [mc[0], 4.2, mc[1]]); }
    }
    // ---- The Orchard Residences tower ----
    { const T = chaikin(TOWER, 2), tc = ctr(T), Y0 = 40.0, FH = 3.6, YT = 205.0;  // bands from the garden level; the glass shaft reaches the ground at the back
      const tr = (s, d, y) => offP(T, -d).map(p => [tc[0] + (p[0] - tc[0])*s, y, tc[1] + (p[1] - tc[1])*s]);
      loft(B.p(TGLASS), tr(1, 0, 0.3), tr(1, 0, YT));
      const ob = B.p(TBAND);
      for (let y = 6.0; y < YT - 1; y += (y < Y0 ? 4.4 : FH)){ const A = tr(1, 0.55, y), A2 = tr(1, 0.55, y + 0.38), I = tr(1, -0.1, y), I2 = tr(1, -0.1, y + 0.38); loft(ob, A, A2); loft(ob, I, A); loft(ob, A2, I2); }
      // vertical fins at the wavy bays
      for (let i = 0; i < T.length; i += 4){ const p = T[i], d = Math.hypot(p[0] - tc[0], p[1] - tc[1]) || 1, nx = (p[0] - tc[0])/d, nz = (p[1] - tc[1])/d; quadP(B.p(TBAND), [p[0], Y0, p[1]], [p[0] + nx*0.9, Y0, p[1] + nz*0.9], [p[0] + nx*0.9, YT, p[1] + nz*0.9], [p[0], YT, p[1]]); }
      // crown: the top floors draw in towards a rounded top, ION Sky lit
      const CR = [[1.0, YT], [0.97, 208.5], [0.9, 212], [0.78, 215], [0.6, 217.2], [0.35, 218.0]];
      for (let k = 0; k < CR.length - 1; k++) loft(B.p(k < 2 ? CROWN : METAL), tr(CR[k][0], 0, CR[k][1]), tr(CR[k+1][0], 0, CR[k+1][1]));
      capP(B.p(METAL), tr(0.35, 0, 218).map(p => [p[0], p[2]]), 218.0);
      loft(B.p(TBAND), tr(1, 0.6, YT - 0.3), tr(1, 0.6, YT + 0.4));
    }
    B.flush(g);
    return g;
  }};
SG_PLACES.push({type:'ionorchard', lat:1.303980, lon:103.832010, rot:2.6285});

// ================= Ngee Ann City (1993, Raymond Woo & Associates), Orchard Road =================
// A 250 m long red-brown granite podium ("the Great Wall") of seven retail and car-park levels, and the twin 26-storey
// office towers (the "door gods") on its rear corners: square shafts with stepped corners, vertical window strips,
// three stepped crown tiers. In front the large Civic Plaza recessed into the podium with rounded corners, the tall curved
// glazed main entrance at its back with (lm22) the monumental gate frame in front of it - two great free-standing granite
// columns, double lintel and cornice - and the pair of bronze guardian lions on plinths, the fountain facing Orchard Road,
// covered walkways along the street fronts.
// Heights: podium ~34 m, tower roofs ~108 m, crowns to ~132 m (27 floors). No store names. Local frame: +z = NNE
// (Orchard Road front), +x = WNW. Night (lm22): floodlit granite podium and towers, lit vertical window slots, glowing
// entrance and shopfronts, warm-lit crowns.
LANDMARKS.ngeeann = {zh:'义安城', en:'Ngee Ann City', cat:'new', r:140, h:133,
  lt:{m:1, c:'#ffe4c0', k:0.55},
  build(){
    const g = new THREE.Group(), B = mkB();
    const GR = {c:'#7c4b3f', m:0, lk:0.7}, GR2 = {c:'#6a3f35', m:0, lk:0.6}, TW = {c:'#7c4b3f', m:0, lk:0.5, lc:'#ffd2a8'}, WS = {c:'#3a3436', m:1, fh:3.9, cw:1.3, lk:0.2},
      GLASS = {c:'#55666f', glow:'#ffe6bf', gk:0.8, m:0, lk:0.2}, SHOP = {c:'#3c4146', glow:'#ffdcae', gk:0.75, m:0, lk:0.2}, PAVE = '#bdb5a8', ROOF = '#8f8a83', WATER = {c:'#7fa6b8', glow:'#bfe0ff', gk:0.5, m:0, lk:0.3},
      CROWN = {c:'#8a5546', m:0, lk:1.0, lc:'#ffd9a8', glow:'#d08a52', gk:0.6}, STEEL = {c:'#cfccc4', m:0, lk:0.5}, CANOPY = {c:'#6b6560', m:0, lk:0.3},
      BRZ = {c:'#6a5232', m:0, lk:0.9, lc:'#ffd9a0'}, LAMP = {c:'#e8dcc0', glow:'#ffd890', gk:1.4};
    const RING = [[122.5,54.2],[48.9,54.2],[49.1,42.7],[47.0,33.2],[43.0,25.2],[36.0,18.1],[27.5,13.1],[14.5,12.4],[6.9,14.9],[2.4,15.2],[-6.1,14.2],[-9.3,11.8],[-18.9,11.3],[-27.9,15.9],[-35.1,22.9],[-41.5,31.4],[-43.4,41.0],[-43.4,51.6],[-101.0,48.8],[-107.3,40.1],[-107.7,13.1],[-115.9,12.5],[-116.3,-51.7],[18.0,-49.2],[18.1,-43.9],[21.6,-43.6],[21.3,-37.5],[44.7,-37.4],[44.2,-29.2],[77.0,-29.2],[77.0,-26.5],[79.7,-26.5],[79.7,-23.8],[83.7,-23.9],[83.5,-17.7],[130.7,-17.0],[128.4,49.9]];
    const POD = [[-5.8,12.0],[-11.4,11.6],[-11.4,10.2],[-40.0,9.3],[-40.0,12.0],[-43.2,12.3],[-42.9,15.5],[-46.3,15.2],[-47.1,42.9],[-107.3,40.1],[-107.7,13.1],[-115.9,12.5],[-116.3,-51.7],[18.0,-49.2],[18.1,-43.9],[21.6,-43.6],[21.3,-37.5],[44.7,-37.4],[44.2,-29.2],[77.0,-29.2],[77.0,-26.5],[79.7,-26.5],[79.7,-23.8],[83.7,-23.9],[83.5,-17.7],[130.7,-17.0],[128.6,42.5],[54.0,43.0],[54.4,16.2],[43.5,15.7],[43.5,13.1],[40.6,12.5],[40.9,10.4],[15.8,9.7],[15.8,12.4],[11.0,12.2],[10.7,6.4],[-6.1,6.2]];
    const PT = 34.0;
    // ---- plaza, foundation ----
    wallP(B.p(GR2), RING, -5, 0.3); capP(B.p(PAVE), RING, 0.3);
    // ---- podium: glazed shopfronts under a granite wall of horizontal bands and deep vertical slots ----
    wallP(B.p(SHOP), offP(POD, 1.0), 0.3, 6.0);
    { const o = B.p(GR); for (const e of edgesF(POD)) quadP(o, e.F(0, 6.0, 0), e.F(e.L, 6.0, 0), e.F(e.L, 6.0, -1.05), e.F(0, 6.0, -1.05)); }
    wallP(B.p(GR), POD, 6.0, PT); capP(B.p(ROOF), POD, PT);
    for (const e of edgesF(POD)){
      if (e.L < 4) continue;
      for (const y of [6.0, 12.5, 19.0, 25.5]) slabP(B.p(GR2), rectO(0, e.L, y, y + 0.7), e.F, 0, 0.3);
      slabP(B.p(GR2), rectO(0, e.L, PT - 1.6, PT + 0.9), e.F, -0.2, 0.45);
      const n = Math.max(1, Math.round(e.L/16)); for (let k = 0; k < n; k++){ const u = e.L*(k + 0.5)/n; shapeP(B.p(WS), rectO(u - 0.75, u + 0.75, 7.4, PT - 2.4), e.F, 0.32); slabP(B.p(GR), rectO(u - 1.6, u - 0.75, 6.0, PT - 1.6), e.F, 0, 0.6); slabP(B.p(GR), rectO(u + 0.75, u + 1.6, 6.0, PT - 1.6), e.F, 0, 0.6); }
    }
    // the raised centre between the towers and its roof lantern
    const MID = [[-35.7,-24.6],[-36.5,9.6],[-11.4,10.2],[-11.4,11.6],[-4.5,12.0],[-4.5,9.3],[9.7,9.6],[9.9,12.7],[15.8,12.4],[15.8,9.7],[37.4,10.1],[38.1,-24.1],[44.3,-26.5],[44.7,-37.4],[21.3,-37.5],[21.6,-43.6],[18.1,-43.9],[18.0,-49.2],[-45.1,-49.8],[-45.6,-29.6]];
    const MI = offP(MID, 2.0);
    wallP(B.p(GR), MI, PT, PT + 6.5); capP(B.p(ROOF), MI, PT + 6.5);
    for (const e of edgesF(MI)) if (e.L > 4) slabP(B.p(GR2), rectO(0, e.L, PT + 5.6, PT + 6.9), e.F, -0.1, 0.35);
    bxP(B.p(GR), -10.7, 15.0, PT + 6.5, PT + 9.5, -42.7, 5.7);
    roofP(B.p(GLASS), 2.15, -18.5, 11.0, 22.0, 0.5, 11.5, PT + 9.5, 4.5, {pw:1, nt:1, n:2});
    // ---- the main entrance: tall curved glazed front at the back of the plaza, in a granite frame ----
    { const C = [[15.8,10.6],[14.5,12.4],[6.9,14.9],[2.4,15.2],[-6.1,14.2],[-9.3,11.8],[-11.4,10.6]], CC = [];
      for (let i = 0; i < C.length - 1; i++) for (let k = 0; k < 4; k++){ const t = k/4; CC.push([lerp(C[i][0], C[i+1][0], t), lerp(C[i][1], C[i+1][1], t)]); } CC.push(C[C.length - 1]);
      const o = B.p(GLASS), om = B.p(STEEL);
      for (let i = 0; i < CC.length - 1; i++){ const a = CC[i], b = CC[i+1]; quadP(o, [a[0], 0.3, a[1]], [b[0], 0.3, b[1]], [b[0], 30.5, b[1]], [a[0], 30.5, a[1]]); if (i % 2 === 0) segP(om, [a[0], 0.3, a[1]], [a[0], 30.5, a[1]], 0.18, 4); }
      for (let y = 5; y < 30; y += 4.2) for (let i = 0; i < CC.length - 1; i++) segP(om, [CC[i][0], y, CC[i][1]], [CC[i+1][0], y, CC[i+1][1]], 0.12, 4);
      const TOP = CC.map(p => [p[0], p[1] + 1.4]); for (let i = 0; i < CC.length - 1; i++){ const a = CC[i], b = CC[i+1], a2 = TOP[i], b2 = TOP[i+1]; quadP(B.p(GR2), [a[0], 30.5, a[1]], [b[0], 30.5, b[1]], [b2[0], 31.2, b2[1]], [a2[0], 31.2, a2[1]]); quadP(B.p(GR2), [a2[0], 31.2, a2[1]], [b2[0], 31.2, b2[1]], [b[0], PT, b[1] - 3], [a[0], PT, a[1] - 3]); }
      for (const x of [-13.0, 17.4]) bxP(B.p(GR), x - 1.8, x + 1.8, 0.3, PT + 1.5, 8.5, 12.8);
    }
    // ---- plaza: rounded corners (planters and steps), fountain facing Orchard Road, covered walkways ----
    for (const P of [[[-43.4,51.6],[-43.4,41.0],[-41.5,31.4],[-35.1,22.9],[-27.9,15.9],[-18.9,11.3],[-11.4,11.6],[-11.4,10.2],[-40.0,9.3],[-40.0,12.0],[-43.2,12.3],[-42.9,15.5],[-46.3,15.2],[-47.1,42.9],[-47.0,51.4]],
                     [[49.1,42.7],[47.0,33.2],[43.0,25.2],[36.0,18.1],[27.5,13.1],[15.8,12.4],[15.8,9.7],[40.9,10.4],[40.6,12.5],[43.5,13.1],[43.5,15.7],[54.4,16.2],[54.0,43.0],[48.9,45.0]]]){
      prismP(B.p(GR2), P, 0.3, 1.3); capP(B.p('#6f8f58'), offP(P, 1.0), 1.32); }
    { const fx = 3.0, fz = 44.0; latheP(B.p(GR2), [[6.5, 0.3], [6.5, 0.95], [6.0, 0.95], [6.0, 0.6], [0, 0.6]], fx, fz, 24); latheP(B.p(WATER), [[5.95, 0.82], [0, 0.82]], fx, fz, 24);
      latheP(B.p(GR2), [[1.6, 0.6], [1.2, 1.6], [2.2, 1.9], [2.2, 2.1], [0.6, 2.2], [0.5, 3.0], [1.0, 3.2], [0, 3.3]], fx, fz, 12);
      for (let k = 0; k < 8; k++){ const a = k/8*TAU; segP(B.p(WATER), [fx + Math.cos(a)*2.4, 0.85, fz + Math.sin(a)*2.4], [fx + Math.cos(a)*3.6, 2.6, fz + Math.sin(a)*3.6], 0.12, 4); segP(B.p(WATER), [fx + Math.cos(a)*3.6, 2.6, fz + Math.sin(a)*3.6], [fx + Math.cos(a)*4.6, 0.85, fz + Math.sin(a)*4.6], 0.1, 4); }
      segP(B.p(WATER), [fx, 3.3, fz], [fx, 6.0, fz], 0.18, 5); }
    for (const [x0, x1, z0, z1] of [[54.5, 128.0, 43.4, 53.4], [-106.5, -47.6, 41.0, 51.2]]){ bxP(B.p(CANOPY), x0, x1, 4.2, 4.6, z0, z1); for (let x = x0 + 1; x < x1; x += 8.0) bxP(B.p(CANOPY), x - 0.25, x + 0.25, 0.3, 4.2, z1 - 0.8, z1 - 0.3); }
    // ---- the monumental gateway in front of the main entrance: two great square granite columns standing free of the curved
    // glass wall, a double lintel with a deep cornice across their heads (a gate-frame read from Orchard Road), and the pair
    // of bronze guardian lions on their plinths at the foot of the steps ----
    { const zc = 23.5, xs = [-10.4, 14.2], cw = 4.4, ytop = PT + 3.0;
      for (const x of xs){
        bxP(B.p(GR2), x - cw/2 - 0.6, x + cw/2 + 0.6, 0.3, 2.2, zc - cw/2 - 0.6, zc + cw/2 + 0.6);          // base
        bxP(B.p(GR), x - cw/2, x + cw/2, 2.2, ytop - 2.4, zc - cw/2, zc + cw/2);                             // shaft
        for (let y = 5.2; y < ytop - 4; y += 3.2) bxP(B.p(GR2), x - cw/2 - 0.08, x + cw/2 + 0.08, y, y + 0.22, zc - cw/2 - 0.08, zc + cw/2 + 0.08);   // rustication joints
        bxP(B.p(GR2), x - cw/2 - 0.5, x + cw/2 + 0.5, ytop - 2.4, ytop - 1.2, zc - cw/2 - 0.5, zc + cw/2 + 0.5);   // capital
        // the lamp lanterns on the column faces
        bxP(B.p(LAMP), x - 0.5, x + 0.5, 6.0, 8.0, zc + cw/2, zc + cw/2 + 0.35);
      }
      const x0 = xs[0] - cw/2 - 1.6, x1 = xs[1] + cw/2 + 1.6;
      bxP(B.p(GR), x0, x1, ytop - 1.2, ytop + 1.6, zc - 2.6, zc + 2.6);                // upper lintel
      bxP(B.p(GR2), x0 - 0.8, x1 + 0.8, ytop + 1.6, ytop + 2.4, zc - 3.2, zc + 3.2);   // cornice
      bxP(B.p(GR2), x0 + 1.4, x1 - 1.4, ytop - 6.6, ytop - 5.2, zc - 1.6, zc + 1.6);   // lower tie beam
      for (let k = 0; k < 5; k++){ const x = lerp(xs[0] + cw/2 + 1.2, xs[1] - cw/2 - 1.2, k/4); bxP(B.p(GR2), x - 0.35, x + 0.35, ytop - 5.2, ytop - 1.2, zc - 0.8, zc + 0.8); }   // struts between the beams
      // entrance steps across the gate
      for (let k = 0; k < 3; k++) bxP(B.p(GR2), xs[0] - 4 - k, xs[1] + 4 + k, 0.3, 1.25 - k*0.3, 13.5, 21.0 + k*1.4);
      // guardian lions (lion with cub on the west, lioness on the east), bronze on granite plinths, facing Orchard Road
      for (const x of [xs[0], xs[1]]){ const z = zc + 7.5, o = B.p(BRZ);
        bxP(B.p(GR2), x - 1.6, x + 1.6, 0.3, 2.0, z - 2.2, z + 2.2); bxP(B.p(GR), x - 1.8, x + 1.8, 2.0, 2.3, z - 2.4, z + 2.4);
        boxP(o, 2.0, 1.2, 2.6, x, 2.3, z - 0.3);                         // haunches on the plinth
        boxP(o, 1.6, 2.0, 1.4, x, 2.6, z + 0.3); latheP(o, [[0, 3.6], [0.95, 3.7], [1.05, 4.3], [0.9, 4.9], [0.5, 5.2], [0, 5.25]], x, z + 0.55, 8);   // chest, maned head
        boxP(o, 0.9, 0.55, 0.7, x, 4.05, z + 1.35);                       // muzzle
        for (const dx of [-0.5, 0.5]) boxP(o, 0.42, 1.7, 0.45, x + dx, 2.3, z + 1.05);   // fore legs
        latheP(o, [[0, 2.3], [0.42, 2.35], [0.42, 2.75], [0, 2.8]], x + (x < 0 ? 0.75 : -0.75), z + 1.55, 8);   // ball / cub under the paw
      }
    }
    // ---- the twin towers ----
    const tower = (S, S1, S2, S3) => {
      const c = ctr(S);
      wallP(B.p(TW), S, PT, 108.0);
      for (const e of edgesF(S)){ if (e.L < 2.0) continue; const n = Math.max(1, Math.round(e.L/2.6));
        for (let k = 0; k < n; k++){ const u = e.L*(k + 0.5)/n; shapeP(B.p(WS), rectO(u - 0.55, u + 0.55, PT + 2.5, 104.5), e.F, 0.05); }
        for (const y of [PT + 1.2, 70.0, 104.8]) slabP(B.p(GR2), rectO(0, e.L, y, y + 1.0), e.F, 0, 0.3); }
      // stepped crown: three tiers drawing in, lit in warm white at night, a slender finial
      wallP(B.p(CROWN), S1, 108.0, 115.5); capP(B.p(ROOF), S, 108.0);
      for (const e of edgesF(S1)){ if (e.L < 2.0) continue; const n = Math.max(1, Math.round(e.L/3.2)); for (let k = 0; k < n; k++){ const u = e.L*(k + 0.5)/n; shapeP(B.p(WS), rectO(u - 0.7, u + 0.7, 109.2, 114.2), e.F, 0.05); } slabP(B.p(GR2), rectO(0, e.L, 115.0, 116.0), e.F, 0, 0.35); }
      capP(B.p(ROOF), S1, 115.5);
      wallP(B.p(CROWN), S2, 115.5, 121.5); capP(B.p(ROOF), S2, 121.5);
      for (const e of edgesF(S2)) if (e.L > 2) slabP(B.p(GR2), rectO(0, e.L, 121.0, 122.0), e.F, 0, 0.35);
      wallP(B.p(CROWN), S3, 121.5, 128.5);
      for (const e of edgesF(S3)){ const n = Math.max(1, Math.round(e.L/4.5)); for (let k = 0; k < n; k++){ const u = e.L*(k + 0.5)/n; shapeP(B.p(WS), rectO(u - 1.2, u + 1.2, 122.5, 127.0), e.F, 0.05); } slabP(B.p(GR2), rectO(0, e.L, 127.8, 129.0), e.F, 0, 0.4); }
      const c3 = ctr(S3); frustP(B.p(GR2), c3[0], c3[1], 24, 25, 12, 12.5, 128.5, 2.5);
      latheP(B.p(STEEL), [[0.6, 131.0], [0.45, 131.8], [0.12, 133.0]], c3[0], c3[1], 8);
    };
    tower([[-36.3,-21.8],[-36.5,9.6],[-40.0,9.3],[-40.0,12.0],[-43.2,12.3],[-42.9,15.5],[-75.9,14.9],[-76.2,11.7],[-78.9,11.7],[-78.9,9.0],[-82.1,9.4],[-81.4,-24.9],[-78.1,-25.2],[-78.2,-27.9],[-76.0,-27.6],[-75.5,-30.5],[-42.4,-29.9],[-42.5,-27.3],[-39.8,-27.3],[-39.8,-24.6],[-35.7,-24.6]],
          [[-36.3,-21.8],[-37.0,7.2],[-43.2,7.0],[-43.2,9.7],[-45.8,9.7],[-46.3,15.2],[-72.7,14.7],[-72.7,9.3],[-76.2,9.0],[-75.9,7.0],[-82.1,6.7],[-81.4,-22.2],[-76.0,-22.2],[-76.0,-24.9],[-72.0,-24.9],[-72.0,-30.3],[-45.6,-29.6],[-45.9,-24.9],[-42.5,-24.6],[-42.4,-22.0]],
          [[-46.4,12.6],[-72.7,12.0],[-72.7,9.3],[-76.2,9.0],[-75.9,7.0],[-79.4,6.7],[-78.7,-22.2],[-76.0,-22.2],[-76.0,-24.9],[-72.0,-24.9],[-72.0,-27.6],[-45.6,-27.0],[-45.9,-24.9],[-42.5,-24.6],[-42.4,-22.0],[-39.8,-21.9],[-40.5,7.0],[-43.2,7.0],[-43.2,9.7],[-45.8,9.7]],
          [[-45.9,7.0],[-72.7,6.6],[-72.0,-22.3],[-45.8,-22.2]]);
    tower([[76.5,16.2],[43.5,15.7],[43.5,13.1],[40.6,12.5],[40.9,10.4],[37.4,10.1],[38.1,-24.1],[41.6,-23.8],[41.6,-26.5],[44.3,-26.5],[44.2,-29.2],[77.0,-29.2],[77.0,-26.5],[79.7,-26.5],[79.7,-23.8],[83.7,-23.9],[83.0,10.4],[79.5,10.1],[79.8,13.4],[76.8,12.8]],
          [[83.2,-21.0],[83.0,7.7],[76.3,7.7],[76.8,10.1],[73.6,10.4],[73.1,16.1],[46.9,16.0],[46.7,10.1],[43.5,10.4],[43.5,7.7],[37.4,7.4],[38.1,-21.5],[43.7,-21.0],[44.0,-24.5],[47.4,-24.2],[47.4,-29.4],[73.8,-28.9],[73.8,-23.5],[77.0,-23.8],[77.0,-21.2]],
          [[73.6,13.1],[46.7,12.7],[46.7,10.1],[43.5,10.4],[43.5,7.7],[40.8,7.7],[40.8,-21.5],[43.7,-21.0],[44.0,-24.5],[47.4,-24.2],[47.4,-26.8],[73.5,-26.7],[73.8,-23.5],[77.0,-23.8],[77.0,-21.2],[79.7,-21.2],[79.8,8.0],[76.3,7.7],[76.8,10.1],[73.6,10.4]],
          [[73.6,7.7],[46.9,8.0],[47.5,-21.5],[73.8,-20.8]]);
    B.flush(g);
    return g;
  }};
SG_PLACES.push({type:'ngeeann', lat:1.302590, lon:103.834760, rot:2.6738});
}
// ---------------------------------------------------------------- Marina Centre and Kallang: Suntec City, Indoor Stadium, National Stadium
{
const PI = Math.PI, HP = PI/2, TAU = PI*2;
const lerp = (a, b, t) => a + (b - a)*t, cl01 = t => t < 0 ? 0 : t > 1 ? 1 : t, sm = t => { t = cl01(t); return t*t*(3 - 2*t); };
// triangle batches: many small parts of one colour spec become one LTris call
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const quadP = (o, a, b, c, d) => o.push(...a, ...b, ...c, ...a, ...c, ...d);
const triP = (o, a, b, c) => o.push(...a, ...b, ...c);
const sub = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]], add = (a, b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]], mul = (a, s) => [a[0]*s, a[1]*s, a[2]*s];
const crs = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const nrm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0]/l, a[1]/l, a[2]/l]; };
// n-sided prism round the segment a-b
function segP(o, a, b, r, n){
  n = n || 4; const L = Math.hypot(b[0]-a[0], b[1]-a[1], b[2]-a[2]); if (L < 1e-4) return; const d = nrm(sub(b, a));
  const up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], u = nrm(crs(d, up)), v = crs(d, u);
  const ring = p => { const R = []; for (let i = 0; i < n; i++){ const t = (i + 0.5)/n*TAU, c = Math.cos(t)*r, s = Math.sin(t)*r; R.push([p[0]+u[0]*c+v[0]*s, p[1]+u[1]*c+v[1]*s, p[2]+u[2]*c+v[2]*s]); } return R; };
  const A = ring(a), B = ring(b);
  for (let i = 0; i < n; i++){ const j = (i+1) % n; quadP(o, A[i], A[j], B[j], B[i]); }
}
const polyP = (o, pts, r, n) => { for (let i = 0; i < pts.length - 1; i++) segP(o, pts[i], pts[i+1], r, n); };
// box (w along x, d along z) standing on y, turned ry, into a batch
function boxP(o, w, h, d, x, y, z, ry){
  const R = rotP(x, z, ry || 0), hw = w/2, hd = d/2;
  const P = [R(-hw, y, -hd), R(hw, y, -hd), R(hw, y, hd), R(-hw, y, hd), R(-hw, y+h, -hd), R(hw, y+h, -hd), R(hw, y+h, hd), R(-hw, y+h, hd)];
  for (const [a, b, c, e] of [[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]) quadP(o, P[a], P[b], P[c], P[e]);
}
// box between two plan points a, b ([x, z]) of width w, from y0 to y1
function wallP(o, a, b, w, y0, y1){
  const dx = b[0]-a[0], dz = b[1]-a[1], L = Math.hypot(dx, dz); if (L < 1e-3) return;
  boxP(o, L, y1 - y0, w, (a[0]+b[0])/2, y0, (a[1]+b[1])/2, Math.atan2(-dz, dx));
}
// plan polygon helpers ([x, z] points)
const cenP = P => { let x = 0, z = 0; for (const p of P){ x += p[0]; z += p[1]; } return [x/P.length, z/P.length]; };
const areaP = P => { let a = 0; for (let i = 0; i < P.length; i++){ const p = P[i], q = P[(i+1) % P.length]; a += p[0]*q[1] - q[0]*p[1]; } return a/2; };
const lerpP = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const ellP = (a, b, n, cx, cz, a0) => { const P = []; for (let i = 0; i < n; i++){ const t = (a0 || 0) + i/n*TAU; P.push([(cx || 0) + Math.cos(t)*a, (cz || 0) + Math.sin(t)*b]); } return P; };
// offset a simple polygon by d (positive = outwards) with mitred corners
function offP(P, d){
  const s = areaP(P) > 0 ? 1 : -1, n = P.length, out = [];
  for (let i = 0; i < n; i++){
    const a = P[(i - 1 + n) % n], b = P[i], c = P[(i + 1) % n];
    const e1 = nrm([b[0]-a[0], 0, b[1]-a[1]]), e2 = nrm([c[0]-b[0], 0, c[1]-b[1]]);
    // outward normals for x east / z south plan coordinates
    const n1 = [-e1[2]*s, e1[0]*s], n2 = [-e2[2]*s, e2[0]*s];
    let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
    const k = 1/Math.max(0.25, mx*n1[0] + mz*n1[1]);
    out.push([b[0] - mx*d*k, b[1] - mz*d*k]);
  }
  return out;
}
// vertical walls of a closed plan polygon between y0 and y1; caps triangulated (any simple polygon)
const wallsP = (o, P, y0, y1) => { for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; quadP(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); } };
function capP(o, P, y){
  const tr = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
  for (const [a, b, c] of tr) triP(o, [P[a][0], y, P[a][1]], [P[b][0], y, P[b][1]], [P[c][0], y, P[c][1]]);
}
const prismP = (o, P, y0, y1, bottom) => { wallsP(o, P, y0, y1); capP(o, P, y1); if (bottom) capP(o, P, y0); };
// horizontal bands round a plan polygon every `step` m between y0 and y1 (vertical quads just proud of the wall)
function bandsP(o, P, y0, y1, step, bh, off){
  const c = cenP(P); off = off || 0.12;
  for (let i = 0; i < P.length; i++){
    const a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], L = Math.hypot(ex, ez); if (L < 0.3) continue;
    let nx = ez/L, nz = -ex/L; if (nx*((a[0]+b[0])/2 - c[0]) + nz*((a[1]+b[1])/2 - c[1]) < 0){ nx = -nx; nz = -nz; }
    for (let y = y0 + step; y < y1 - 0.4; y += step) quadP(o, [a[0]+nx*off, y, a[1]+nz*off], [b[0]+nx*off, y, b[1]+nz*off], [b[0]+nx*off, y+bh, b[1]+nz*off], [a[0]+nx*off, y+bh, a[1]+nz*off]);
  }
}
// vertical mullion strips round a plan polygon every `sp` m (flat strips just proud of the wall)
function mullP(o, P, y0, y1, sp, w, off){
  const c = cenP(P); off = off || 0.15;
  for (let i = 0; i < P.length; i++){
    const a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], L = Math.hypot(ex, ez); if (L < 1) continue;
    let nx = ez/L, nz = -ex/L; if (nx*((a[0]+b[0])/2 - c[0]) + nz*((a[1]+b[1])/2 - c[1]) < 0){ nx = -nx; nz = -nz; }
    const n = Math.max(1, Math.round(L/sp));
    for (let k = 0; k <= n; k++){ const t = k/n, x = a[0] + ex*t + nx*off, z = a[1] + ez*t + nz*off, hx = ex/L*w/2, hz = ez/L*w/2;
      quadP(o, [x - hx, y0, z - hz], [x + hx, y0, z + hz], [x + hx, y1, z + hz], [x - hx, y1, z - hz]); }
  }
}
// smooth parametric surface f(u, v) -> [x, y, z], one indexed mesh (double sided)
function surf(g, nu, nv, f, col){
  const P = [], I = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) P.push(...f(i/nu, j/nv));
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++){ const a = j*(nu+1) + i, b = a + 1, c = a + nu + 2, d = a + nu + 1; I.push(a, b, c, a, c, d); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setIndex(I); geo.computeVertexNormals();
  return lmAdd(g, geo, typeof col === 'string' ? {c:col, ds:true} : Object.assign({ds:true}, col), 0, 0, 0);
}
function surfP(o, nu, nv, f){
  const G = []; for (let j = 0; j <= nv; j++){ const R = []; for (let i = 0; i <= nu; i++) R.push(f(i/nu, j/nv)); G.push(R); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) quadP(o, G[j][i], G[j][i+1], G[j+1][i+1], G[j+1][i]);
}
function treeP(B, x, y, z, s, crown){
  segP(B.p('#5d4a3a'), [x, y, z], [x, y + 3*s, z], 0.28*s, 4);
  const c = B.p(crown || '#557f3c'), R = 2.4*s, cy = y + 4.2*s, top = [x, cy + R*0.75, z], bot = [x, cy - R*0.55, z], ring = [];
  for (let i = 0; i < 6; i++){ const a = i/6*TAU; ring.push([x + Math.cos(a)*R, cy, z + Math.sin(a)*R]); }
  for (let i = 0; i < 6; i++){ const j = (i+1) % 6; triP(c, top, ring[j], ring[i]); triP(c, bot, ring[i], ring[j]); }
}

// =====================================================================================================================
// Suntec City (Tsao & McKown with DP Architects, 1995-97), Marina Centre: four 45-storey, 181 m office towers (the
// fingers) and the 18-storey Tower Five (the thumb) laid out like a left hand round the Fountain of Wealth (the
// palm's gold ring: a 21 m silicon-bronze ring, 66 m round, on four inclined 13.8 m bronze legs over its basin), on the
// 4-storey mall podium with its round east and west ends. Blue-green glass with pale spandrel bands; each tower cuts back
// one corner at 90 m and the opposite corner at 150 m (OSM building parts). The convention centre is a separate
// building to the south-west and is left to the map (its plan would swallow the Conrad Centennial).
// Local axes: +x along the tower rows (ESE, 29.7 deg south of east), +z SSW. Origin = centre of the fountain.
// lm22: vertical mullions on every tower, lean-to glass skylights over the cut corners, louvred roof plant screens with a
// lit rim (towers 1-5), the Fountain of Wealth with the jets thrown inwards from the ring, the central plume and stepped terraces.
LANDMARKS.suntec = {zh:'新达城', en:'Suntec City', cat:'new', r:203, h:181,
  lt:{m:1, c:'#d8f0ea', k:0.6, fh:4.0, cw:3.0}, build(){
  const g = new THREE.Group(), B = mkB();
  const glass = {c:'#4c727c', m:1, fh:4.0, cw:3.0, ds:true}, band = {c:'#b9c6c3', m:0, lk:0.15}, crown = {c:'#c9d6d2', m:0, lk:1.0, lc:'#bfefff'};
  const pod = {c:'#d9d2c3', m:0, lk:0.45, lc:'#ffe2b8', ds:true}, podG = {c:'#48565c', glow:'#ffdcae', gk:0.5, ds:true}, roofc = '#b7b1a5', green = '#6a8f4c';
  const bronze = {c:'#9b7438', m:0, lk:1.2, lc:'#ffd890'}, mulc = {c:'#a9bcba', m:0, lk:0.2}, skyl = {c:'#9cc4c8', glow:'#d9f4ff', gk:0.4, ds:true}, plant = {c:'#8c9696', m:0, lk:0.3};
  const water = {c:'#d8eef4', glow:'#9fe6ff', gk:0.9, ds:true};
  // a tower: plan corners in order [a, b, c, d]; corner i1 is cut back at 90 m, corner i2 (opposite) at 150 m
  const tower = (Q, i1, i2, H) => {
    const cut = (P, i) => { const n = P.length, a = P[(i - 1 + n) % n], c = P[i], b = P[(i + 1) % n]; return P.slice(0, i).concat([lerpP(c, a, 0.5), lerpP(c, b, 0.5)], P.slice(i + 1)); };
    const P1 = cut(Q, i1), P2 = (() => { const k = i2 > i1 ? i2 + 1 : i2; return cut(P1, k); })();
    const stage = (P, y0, y1) => { LPoly(g, P, y0, y1 - y0, glass); bandsP(B.p(band), P, y0, y1 - 1, 4.0, 1.2, 0.1); mullP(B.p(mulc), P, Math.max(y0, 9.5), y1 - 0.6, 3.0, 0.22, 0.17); };
    const HR = H - 5;   // main roof; the plant screen rises to H
    stage(Q, -5, 90); stage(P1, 90, 150); stage(P2, 150, HR);
    // sloped glass skylights (lean-to wedges) over the cut corners, lit crown bands at each set-back
    for (const [P, y, i] of [[Q, 90, i1], [P1, 150, i2 > i1 ? i2 + 1 : i2]]){
      const n = P.length, c = P[i], a = lerpP(c, P[(i - 1 + n) % n], 0.5), b = lerpP(c, P[(i + 1) % n], 0.5), yt = y + 9, o = B.p(skyl);
      triP(o, [a[0], yt, a[1]], [b[0], yt, b[1]], [c[0], y, c[1]]); triP(o, [a[0], y, a[1]], [a[0], yt, a[1]], [c[0], y, c[1]]); triP(o, [b[0], y, b[1]], [c[0], y, c[1]], [b[0], yt, b[1]]);
      for (let k = 0; k <= 8; k++){ const p = lerpP(a, b, k/8); polyP(B.p(mulc), [[p[0], yt + 0.1, p[1]], [lerp(p[0], c[0], 0.999), y + 0.1, lerp(p[1], c[1], 0.999)]], 0.13, 3); }
      polyP(B.p(crown), [[a[0], yt + 0.2, a[1]], [b[0], yt + 0.2, b[1]]], 0.35, 4);
      bandsP(B.p(crown), P, y - 2.2, y, 2.2, 2.2, 0.12);
    }
    bandsP(B.p(crown), P2, HR - 3.5, HR, 3.5, 3.5, 0.12);
    capP(B.p(roofc), P2, HR + 0.05);
    // roof plant screen set back from the parapet, louvred, a lit top rim, the maintenance mast
    const PS = offP(P2, -4.5); prismP(B.p(plant), PS, HR, H - 0.6); bandsP(B.p(mulc), PS, HR, H - 0.6, 1.1, 0.35, 0.1); prismP(B.p(crown), offP(PS, 0.3), H - 0.6, H);
    const c = cenP(Q); segP(B.p(plant), [c[0], H, c[1]], [c[0], H + 1.6, c[1]], 0.25, 4); boxP(B.p({c:'#b02018', glow:'#ff2a1a', gk:2.2}), 0.6, 0.5, 0.6, c[0], H + 1.6, c[1], 0);
    // granite base: a two-storey colonnade round the lobby
    bandsP(B.p(pod), Q, -0.5, 9.5, 10, 10, 0.25);
  };
  tower([[-103.6, -55.5], [-59.4, -56.3], [-58.9, -16.9], [-102.9, -15.7]], 3, 1, 181);   // Tower One (west)
  tower([[-62.2, -105.9], [-17.9, -106.5], [-16.9, -66.1], [-62.0, -65.7]], 1, 3, 181);   // Tower Two
  tower([[17.7, -104.3], [63.0, -104.2], [63.3, -59.4], [17.9, -59.4]], 0, 2, 181);       // Tower Three
  tower([[68.2, -56.6], [113.1, -56.3], [112.8, -11.1], [67.4, -11.2]], 2, 0, 181);       // Tower Four (east)
  // Tower Five (18 storeys, the thumb)
  const T5 = [[-107.4, 46.3], [-48.4, 46.1], [-49.1, 105.1], [-107.6, 105.1]];
  LPoly(g, T5, -5, 77, glass); bandsP(B.p(band), T5, 0, 71, 4.0, 1.2, 0.1); bandsP(B.p(crown), T5, 68.5, 72, 3.5, 3.5, 0.12);
  bandsP(B.p(pod), T5, -0.5, 9.5, 10, 10, 0.25); capP(B.p(roofc), T5, 72.05); mullP(B.p(mulc), T5, 9.5, 68.5, 3.0, 0.22, 0.17);
  { const PS = offP(T5, -9); prismP(B.p(plant), PS, 72, 77.4); bandsP(B.p(mulc), PS, 72, 77.4, 1.1, 0.35, 0.1); prismP(B.p(crown), offP(PS, 0.3), 77.4, 78); }
  // the mall podium (4 storeys) with its round ends
  const PODS = [
    [[-134.3, -55.1], [-133.5, -134.2], [-94.7, -173.5], [-94.0, -153.3], [-75.2, -134.8], [-58.4, -134.1], [-58.3, -148.4], [-24.3, -148.0], [-24.8, -106.6], [-62.1, -105.7], [-61.5, -72.0], [-75.9, -56.3]],
    [[24.4, -108.1], [-24.4, -108.2], [-24.4, -147.9], [24.5, -147.8]],
    [[24.5, -147.8], [59.0, -147.6], [58.6, -133.8], [135.8, -133.4], [176.3, -93.8], [161.1, -78.2], [135, -60], [132.4, -50.3], [130.9, -32.3], [116.4, -33.6], [117.0, -64.0], [111.8, -59.7], [101.7, -59.4], [102.2, -56.2], [72.5, -56.3], [72.3, -60.4], [63.3, -68.9], [63.0, -104.2], [23.8, -104.4]],
    [[-103.6, -55.5], [-102.9, -15.7], [-98.1, -15.8], [-98.7, 46.0], [-107.4, 46.3], [-107.6, 105.1], [-86.2, 105.1], [-85.3, 121.0], [-124.2, 121.0], [-124.8, 102.6], [-116.9, 96.0], [-113.5, 88.7], [-113.0, 77.4], [-116.9, 69.4], [-119.2, 66.6], [-127.4, 63.1], [-129.9, 55.0], [-135.5, 50.0], [-134.3, -55.1]]];
  for (const P of PODS){
    prismP(B.p(pod), P, -5, 21); bandsP(B.p(podG), P, 0.3, 19, 5.2, 3.2, 0.08);
    prismP(B.p(pod), offP(P, 0.2), 20.2, 22); capP(B.p(roofc), offP(P, -0.5), 22.02);
  }
  // round ends: the east drum (domed) and the west rotunda by the convention centre
  LCyl(g, 30.5, 30.5, 27, 162.5, -5, -48, pod, 40); for (const y of [4.6, 10.4, 16.2]) LCyl(g, 30.65, 30.65, 3.2, 162.5, y, -48, podG, 40);
  LDome(g, 29, 162.5, 22, -48, band, 0.28, 40);
  LCyl(g, 21, 21, 31, -135, -5, 86, pod, 36); for (const y of [4, 10, 16, 22]) LCyl(g, 21.15, 21.15, 3.4, -135, y, 86, podG, 36);
  LCyl(g, 20, 21, 2, -135, 26, 86, pod, 36);
  prismP(B.p(pod), [[-145, 106], [-132, 106], [-131.9, 121.0], [-145.0, 121.0]], -5, 22);
  // roof gardens and skylights on the podium
  for (const [x, z, w, d] of [[-115, -95, 26, 40], [0, -128, 30, 22], [95, -110, 50, 22], [-118, 0, 18, 70]]) boxP(B.p(green), w, 0.6, d, x, 22, z, 0);
  for (const [x, z, w, d] of [[-80, -120, 16, 10], [40, -125, 14, 12], [140, -95, 18, 10]]) boxP(B.p(podG), w, 2.5, d, x, 22, z, 0);
  // ---- the Fountain of Wealth in its sunken round court: basin, stepped terraces, the bronze ring (21 m across, 66 m
  // round, 13.8 m up) on four inclined legs, the water plume and the jets thrown inwards from the ring; lit at night
  const FR = 17.5;
  LRing(g, FR - 3, FR - 3, FR, FR, -5, 1.2, pod, 40);
  LRing(g, FR - 6, FR - 6, FR - 3, FR - 3, -5, 0.6, pod, 40);
  for (let k = 0; k < 3; k++) LRing(g, FR + k*2.2, FR + k*2.2, FR + 2.2 + k*2.2, FR + 2.2 + k*2.2, -5, 1.2 + 0.55*(k + 1), pod, 48);
  LCyl(g, FR - 6, FR - 6, 5.25, 0, -5, 0, {c:'#5f8c9a', glow:'#3a8ab0', gk:0.6}, 40);
  // the ring: a hollow bronze tube of trapezoid section with the inner lip, the four legs splayed on their footings
  LRing(g, 9.8, 9.8, 11.2, 11.2, 12.6, 13.8, bronze, 56); LRing(g, 10.1, 10.1, 10.9, 10.9, 11.6, 12.6, bronze, 56);
  for (let k = 0; k < 4; k++){ const a = PI/4 + k*HP, c = Math.cos(a), s = Math.sin(a);
    segP(B.p(bronze), [c*4.6, 0.25, s*4.6], [c*10.5, 12.8, s*10.5], 0.85, 8); segP(B.p(bronze), [c*4.6, 0.25, s*4.6], [c*4.6, 0.6, s*4.6], 1.6, 8); }
  // water: the central plume, a crown of jets thrown inwards from the ring, spray curtain round the basin
  segP(B.p(water), [0, 0.25, 0], [0, 10.5, 0], 0.55, 6); segP(B.p(water), [0, 10.5, 0], [0, 12.5, 0], 0.25, 5);
  for (let k = 0; k < 24; k++){ const a = (k + 0.5)/24*TAU, c = Math.cos(a), s = Math.sin(a), pts = [];
    for (let i = 0; i <= 6; i++){ const t = i/6, r = lerp(9.9, 3.0, t); pts.push([c*r, 12.4 + 1.6*Math.sin(t*PI*0.8) - 11.8*t*t, s*r]); }
    polyP(B.p(water), pts, 0.12, 3); }
  for (let k = 0; k < 36; k++){ const a = k/36*TAU; segP(B.p(water), [Math.cos(a)*(FR - 6.5), 0.25, Math.sin(a)*(FR - 6.5)], [Math.cos(a)*(FR - 8.5), 2.6, Math.sin(a)*(FR - 8.5)], 0.08, 3); }
  // plaza paving round the court (the open south side of the 'palm')
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'suntec', lat:1.294769, lon:103.858919, rot:-0.5184});

// =====================================================================================================================
// Singapore Indoor Stadium (Kenzo Tange with RSP, 1989), Kallang: a 12,000-seat arena on a rhombic plan (diagonals
// about 232 m N-S and 142 m E-W), roofed by a stainless-steel Pantadome space frame that rises in stepped, pagoda-like
// tiers to a 45 m ridge along the long diagonal. lm22 remake: seven concave skirts in two steel tones with standing seams
// and hip rolls, each tier's eave fascia overhanging a dark clerestory band, the hipped crest; glazed walls with mullions
// and paired piers under the deep lowest eave; the entrance terraces and canopy at the north corner and the bridge to
// Stadium Walk on the east. Plan from the OSM footprint.
// Built in map axes (rot 0): the long diagonal runs NNW-SSE.
LANDMARKS.indoorstadium = {zh:'新加坡室内体育馆', en:'Singapore Indoor Stadium', cat:'new', r:130, h:45,
  lt:{m:0, c:'#e4eeff', k:0.9, e:0.55}, build(){
  const g = new THREE.Group(), B = mkB();
  const steel = {c:'#cfd4d8', m:0, lk:0.85, lc:'#e4eeff'}, steel2 = {c:'#bcc3c8', m:0, lk:0.8, lc:'#e4eeff'}, seam = {c:'#e6e9eb', m:0, lk:0.95, lc:'#e4eeff'};
  const fasc = {c:'#eceeee', m:0, lk:1.05, lc:'#e4eeff'}, soff = {c:'#7f888e', glow:'#ffe8c8', gk:0.18};
  const clere = {c:'#26313b', glow:'#9fc2ff', gk:0.75}, wall = {c:'#43515b', glow:'#ffe0b0', gk:0.6}, mull = {c:'#a3abb0', m:0, lk:0.5}, gran = {c:'#b9b3a7', m:0, lk:0.45}, pave = '#c6c0b4';
  const N = [-43.8, -110.0], E = [63.4, -28.2], S = [45.1, 104.0], W = [-64.6, 34.0];
  // a point of the rhombus: s along the long diagonal (-1 = N, +1 = S), t along the short one (-1 = W, +1 = E)
  const D = (s, t) => [(s > 0 ? s*S[0] : -s*N[0]) + (t > 0 ? t*E[0] : -t*W[0]), (s > 0 ? s*S[1] : -s*N[1]) + (t > 0 ? t*E[1] : -t*W[1])];
  const dia = (ra, rb) => [D(-ra, 0), D(0, rb), D(ra, 0), D(0, -rb)];
  const P3 = (p, y) => [p[0], y, p[1]];
  // Pantadome roof: seven stacked diamond skirts, each a concave stainless-steel sweep, set back behind a dark clerestory
  // band under the eave of the tier above; the crest is a long hipped ridge along the N-S diagonal at 45 m
  const K = 7, Y0 = 13.2, YT = 40.6;
  const RA = k => 1 - 0.6*Math.pow(k/K, 0.92), RB = k => 1 - 0.885*Math.pow(k/K, 0.85), YE = k => Y0 + (YT - Y0)*Math.pow(k/K, 1.22);
  const NE = 14, NR = 4;
  for (let k = 0; k < K; k++){
    const y0 = YE(k), y1 = YE(k + 1), gap = y1 - y0, fas = k ? 0.55 : 1.5, cl = Math.min(1.6, gap*0.36), ys = y1 - fas - cl;
    const O = dia(RA(k), RB(k)), I = dia(RA(k + 1) + 2.6/118, RB(k + 1) + 2.6/72), O2 = dia(RA(k + 1), RB(k + 1));
    const ring = u => { const R = []; const yy = y0 + (ys - y0)*Math.pow(u, 1.55); for (let i = 0; i < 4; i++) R.push(P3([lerp(O[i][0], I[i][0], u), lerp(O[i][1], I[i][1], u)], yy)); return R; };
    // the skirt, alternate tiers in two tones of steel
    const sk = B.p(k % 2 ? steel2 : steel);
    for (let r = 0; r < NR; r++){ const A = ring(r/NR), Bq = ring((r + 1)/NR);
      for (let i = 0; i < 4; i++){ const j = (i + 1) % 4; for (let e = 0; e < NE; e++){ const f0 = e/NE, f1 = (e + 1)/NE, L = (P, f) => [lerp(P[i][0], P[j][0], f), lerp(P[i][1], P[j][1], f), lerp(P[i][2], P[j][2], f)];
        quadP(sk, L(A, f0), L(A, f1), L(Bq, f1), L(Bq, f0)); } } }
    // standing seams down the skirt, hip rolls at the four corners
    const A0 = ring(0), A1 = ring(1), Am = [ring(0.33), ring(0.66)];
    for (let i = 0; i < 4; i++){ const j = (i + 1) % 4, Lx = Math.hypot(O[j][0] - O[i][0], O[j][1] - O[i][1]), n = Math.max(3, Math.round(Lx/4.2));
      for (let e = 1; e < n; e++){ const f = e/n, L = R => [lerp(R[i][0], R[j][0], f), lerp(R[i][1], R[j][1], f) + 0.12, lerp(R[i][2], R[j][2], f)];
        polyP(B.p(seam), [L(A0), L(Am[0]), L(Am[1]), L(A1)], 0.11, 3); }
      polyP(B.p(fasc), [A0[i], Am[0][i], Am[1][i], A1[i]].map(p => [p[0], p[1] + 0.25, p[2]]), 0.4, 4); }
    // eave fascia, soffit back to the clerestory, the clerestory glazing with mullions
    for (let i = 0; i < 4; i++){ const j = (i + 1) % 4;
      quadP(B.p(fasc), P3(O[i], y0 - fas), P3(O[j], y0 - fas), P3(O[j], y0 + 0.15), P3(O[i], y0 + 0.15));
      quadP(B.p(clere), P3(I[i], ys), P3(I[j], ys), P3(I[j], y1 - fas), P3(I[i], y1 - fas));
      if (k + 1 < K) quadP(B.p(soff), P3(O2[i], y1 - 0.55), P3(O2[j], y1 - 0.55), P3(I[j], y1 - 0.55), P3(I[i], y1 - 0.55));
      const Lx = Math.hypot(I[j][0] - I[i][0], I[j][1] - I[i][1]), n = Math.max(2, Math.round(Lx/5));
      for (let e = 1; e < n; e++){ const p = lerpP(I[i], I[j], e/n); segP(B.p(mull), [p[0], ys, p[1]], [p[0], y1 - fas, p[1]], 0.09, 3); } }
  }
  // the crest: a long hipped cap on the top tier's ring
  { const T = dia(RA(K), RB(K)), y = YT, a = D(-RA(K)*0.78, 0), b = D(RA(K)*0.78, 0), yr = 45, o = B.p(steel);
    for (let i = 0; i < 4; i++) quadP(B.p(fasc), P3(T[i], y - 0.55), P3(T[(i + 1) % 4], y - 0.55), P3(T[(i + 1) % 4], y + 0.15), P3(T[i], y + 0.15));
    triP(o, P3(T[0], y), P3(a, yr), P3(T[3], y)); triP(o, P3(T[0], y), P3(T[1], y), P3(a, yr));
    triP(o, P3(T[2], y), P3(T[3], y), P3(b, yr)); triP(o, P3(T[2], y), P3(b, yr), P3(T[1], y));
    quadP(o, P3(T[1], y), P3(b, yr), P3(a, yr), P3(T[1], y)); quadP(o, P3(T[3], y), P3(a, yr), P3(b, yr), P3(T[3], y));
    triP(o, P3(T[1], y), P3(b, yr), P3(a, yr)); triP(o, P3(T[3], y), P3(a, yr), P3(b, yr));
    polyP(B.p(fasc), [P3(a, yr + 0.3), P3(b, yr + 0.3)], 0.45, 4);
    for (const [p, q] of [[T[0], a], [T[2], b], [T[1], a], [T[1], b], [T[3], a], [T[3], b]]) polyP(B.p(fasc), [P3(p, y + 0.2), [q[0], yr + 0.2, q[1]]], 0.3, 4);
    // seams on the crest
    for (let e = 1; e < 14; e++){ const f = e/14; for (const [P, Q] of [[T[1], [lerp(a[0], b[0], f), lerp(a[1], b[1], f)]], [T[3], [lerp(a[0], b[0], f), lerp(a[1], b[1], f)]]]){
      const p = lerpP(f < 0.5 ? lerpP(T[0], P, f*2) : lerpP(P, T[2], f*2 - 1), Q, 0); polyP(B.p(seam), [[p[0], y + 0.12, p[1]], [Q[0], yr + 0.1, Q[1]]], 0.1, 3); } }
  }
  // the lowest soffit and the glazed walls under the eaves, granite base; mullions and transoms
  const WL = dia(0.925, 0.91), O0 = dia(RA(0), RB(0));
  for (let i = 0; i < 4; i++){ const j = (i + 1) % 4; quadP(B.p(soff), P3(O0[i], Y0 - 1.5), P3(O0[j], Y0 - 1.5), P3(WL[j], Y0 - 1.5), P3(WL[i], Y0 - 1.5)); }
  prismP(B.p(wall), WL, 1.0, Y0 - 1.5);
  for (let i = 0; i < 4; i++){ const a = WL[i], b = WL[(i + 1) % 4], n = Math.round(Math.hypot(b[0] - a[0], b[1] - a[1])/6);
    for (let k = 0; k <= n; k++){ const p = lerpP(a, b, k/n); segP(B.p(mull), [p[0], 1, p[1]], [p[0], Y0 - 1.5, p[1]], k % 2 ? 0.14 : 0.32, 4); }
    for (const y of [4.6, 8.2]) polyP(B.p(mull), [[a[0], y, a[1]], [b[0], y, b[1]]], 0.12, 3);
    // the roof's perimeter supports: paired steel piers in front of the glass every 18 m
    const m = Math.round(Math.hypot(b[0] - a[0], b[1] - a[1])/18), ex = (b[0] - a[0]), ez = (b[1] - a[1]), el = Math.hypot(ex, ez), nx = ez/el, nz = -ex/el, sg = (nx*(a[0] + b[0]) + nz*(a[1] + b[1])) > 0 ? 1 : -1;
    for (let k = 1; k < m; k++){ const p = lerpP(a, b, k/m); for (const d of [-0.9, 0.9]){ const x = p[0] + ex/el*d + nx*sg*1.2, z = p[1] + ez/el*d + nz*sg*1.2; segP(B.p(fasc), [x, 1.0, z], [x, Y0 - 1.5, z], 0.32, 4); } } }
  // walls under the eaves: the footprint plinth with the north entrance terraces
  const FP = [[-64.5, -69.2], [-75.2, -95.3], [-57.3, -101.9], [-61.5, -111.9], [-43.6, -118.5], [-40.0, -110.2], [-6.0, -123.8], [-1.2, -110.8], [-16.7, -104.8], [-8.3, -82.9], [63.3, -28.3], [99.1, -33.1], [66.9, -19.4], [60.9, -9.9], [46.0, 97.4], [41.8, 88.5], [35.8, 91.5], [39.4, 100.4], [-60.9, 36.3], [-55.5, 34.5], [-58.5, 26.8], [-63.9, 29.2], [-52.5, -49.7], [-48.9, -53.8], [-56.1, -72.2]];
  prismP(B.p(gran), FP, -5, 1.0);
  // entrance terraces and canopy at the north corner, the east bridge
  prismP(B.p(gran), [[-64.5, -69.2], [-75.2, -95.3], [-57.3, -101.9], [-61.5, -111.9], [-43.6, -118.5], [-40.0, -110.2], [-6.0, -123.8], [-1.2, -110.8], [-16.7, -104.8], [-8.3, -82.9], [-40, -80]], 1.0, 3.6);
  for (let s = 0; s < 4; s++) prismP(B.p(gran), offP([[-58, -95], [-44, -112], [-8, -116], [-14, -96]], -1.5 - s*1.4).map(p => [p[0], p[1]]), 1.0, 1.0 + 0.6*(s + 1));
  capP(B.p(fasc), [[-60, -93], [-45, -114], [-6, -118], [-12, -94]], 9.5); wallsP(B.p(fasc), [[-60, -93], [-45, -114], [-6, -118], [-12, -94]], 8.7, 9.5);
  for (const p of [[-56, -96], [-44, -110], [-10, -114], [-15, -97], [-35, -102], [-26, -107]]) segP(B.p(mull), [p[0], 3.6, p[1]], [p[0], 8.7, p[1]], 0.45, 8);
  prismP(B.p(gran), [[63.3, -28.3], [99.1, -33.1], [66.9, -19.4]], 1.0, 6.5);
  for (const [P, h] of [[[[66.3, 16.2], [74.6, 16.7], [74.0, 34.5], [65.1, 34.5]], 9.6], [[[36.4, -50.9], [44.8, -58.0], [48.4, -53.8], [40.6, -46.7]], 8.8]]){
    prismP(B.p(gran), P, -5, h - 1); prismP(B.p(fasc), offP(P, 0.6), h - 1, h); }
  prismP(B.p(pave), offP([[-75.2, -95.3], [-43.6, -118.5], [-6.0, -123.8], [63.3, -28.3], [99.1, -33.1], [60.9, -9.9], [46.0, 97.4], [-60.9, 36.3]], -1), -5, 0.06);
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'indoorstadium', lat:1.300734, lon:103.874321, rot:0});

// =====================================================================================================================
// National Stadium, Singapore Sports Hub (Arup / DP Architects, 2014) - remake. A 310 m free-span shallow steel dome
// (83 m high) clad in silver insulated metal panels over a lattice of arching beams that criss-cross the exterior and
// land on the ground beyond the facade, framing a covered promenade round the louvred enclosure. Over the pitch the
// dome is open along a 75 m wide slot that runs from beyond the centre out to the water-facing (south-west) edge -
// the 'western gate' that frames the city skyline; the two ETFE halves of the retractable roof (with their 20,000 m2
// LED matrix) sit parked on either side of the slot near the crown, carried by runway trusses that arch over the
// pitch. Inside: the 55,000-seat three-tier bowl of red seats, lower tier continuous, upper tiers open to the gate;
// pitch and athletics track. Dome rings, slot and parked roof halves from the OSM building parts.
// Local axes: +x along the slot towards the north-east (the gate is at -x), +z towards the south-east.
// lm22: the aluminium louvre blades of the bowl's skin, concrete feet where the arch ribs land, night colour wash
// (anim 'cycle' as in the lm20/core table - the dome is lit in colours for events).
LANDMARKS.sportshub = {zh:'新加坡国家体育场', en:'National Stadium · Sports Hub', cat:'new', r:162, h:83,
  lt:{m:0, c:'#e6efff', k:0.6, e:0.6, anim:'cycle', c2:'#7a6cff'}, build(){
  const g = new THREE.Group(), B = mkB(), RE = 155, RC = 146, HW = 37.5, XE = 12;
  const panel = {c:'#d5d9dc', m:0, lk:0.62, lc:'#e6efff'}, panelD = {c:'#b4babf', m:0, lk:0.55, lc:'#e6efff'}, rib = {c:'#eef0f1', m:0, lk:0.8, lc:'#e6efff'};
  const led = {c:'#c8d0d8', m:2, lk:0.9}, etfe = {c:'#e9eef0', glow:'#f4f8ff', gk:0.6}, seat = {c:'#9c2a2c', glow:'#ff3a2a', gk:0.12};
  const conc = {c:'#c9c4ba', m:0, lk:0.5}, louv = {c:'#9aa3a8', glow:'#ffe2b8', gk:0.4}, pitch = {c:'#4f8a3c', glow:'#3d7a2c', gk:0.5}, track = {c:'#a0543e', glow:'#7a3a2a', gk:0.25};
  // dome profile: a spherical cap (R 183.8 m, 310 m span) fitted to the OSM ring heights, ~79 m at the slot rim near the crown
  const Yd = r => 85 - 183.8 + Math.sqrt(Math.max(0, 183.8*183.8 - r*r));
  const inOpen = (x, z) => (Math.abs(z) < HW && x < XE) || ((x - XE)*(x - XE) + z*z < HW*HW);
  // distance from the centre to the opening's edge along direction a (from +x)
  const dIn = a => { const c = Math.cos(a), s = Math.abs(Math.sin(a)); const t = s > 1e-6 ? HW/s : 1e9;
    if (t*c < XE) return t; return XE*c + Math.sqrt(Math.max(0, XE*XE*c*c - XE*XE + HW*HW)); };
  const A0 = Math.asin(HW/RC) + 0.004;   // angle (from -x) where the slot leaves the clad dome
  const P = (a, r) => [Math.cos(a)*r, Yd(r), Math.sin(a)*r];
  // the cladding, as panels between the radial ribs (alternate silver tones)
  const NA = 96, NR = 14;
  for (let i = 0; i < NA; i++){
    const a0 = (PI - A0) - (TAU - 2*A0)*i/NA, a1 = (PI - A0) - (TAU - 2*A0)*(i + 1)/NA;
    const o = B.p(i % 2 ? panel : panelD);
    for (let j = 0; j < NR; j++){
      const r00 = lerp(Math.min(dIn(a0), RC), RC, j/NR), r01 = lerp(Math.min(dIn(a0), RC), RC, (j + 1)/NR);
      const r10 = lerp(Math.min(dIn(a1), RC), RC, j/NR), r11 = lerp(Math.min(dIn(a1), RC), RC, (j + 1)/NR);
      quadP(o, P(a0, r00), P(a1, r10), P(a1, r11), P(a0, r01));
    }
  }
  // the opening's rim: a deep fascia carrying the LED band, all round the slot
  const rim = [];
  for (let i = 0; i <= 120; i++){ const a = (PI - A0) - (TAU - 2*A0)*i/120, r = Math.min(dIn(a), RC); rim.push(P(a, r)); }
  for (let i = 0; i < rim.length - 1; i++){ const a = rim[i], b = rim[i + 1];
    quadP(B.p(led), [a[0], a[1] + 0.6, a[2]], [b[0], b[1] + 0.6, b[2]], [b[0], b[1] - 3.0, b[2]], [a[0], a[1] - 3.0, a[2]]); }
  // the outer lattice: two families of arching beams that cross on the dome and land on the ground beyond the facade
  const NB = 40;
  for (const sg of [-1, 1]) for (let i = 0; i < NB; i++){
    const a0 = i/NB*TAU, pts = [];
    for (let k = 0; k <= 16; k++){ const r = lerp(RE, 40, k/16), a = a0 + sg*0.9*(1 - r/RE), x = Math.cos(a)*r, z = Math.sin(a)*r;
      if (inOpen(x, z) || (Math.abs(z) < HW + 2 && x < XE + 2 && r > 20)) break;
      pts.push([x, r > RC ? Yd(RC)*(RE - r)/(RE - RC) : Yd(r) + 0.6, z]); }
    if (pts.length > 1) polyP(B.p(rib), pts, 0.85, 4);
  }
  // concentric purlin rings where the cladding meets the edge and half-way up
  for (const rr of [RC, 118, 90]){ const pts = []; for (let i = 0; i <= 96; i++){ const a = (PI - A0) - (TAU - 2*A0)*i/96; if (rr < dIn(a)) { if (pts.length > 1) polyP(B.p(rib), pts, 0.7, 4); pts.length = 0; continue; } pts.push(P(a, rr)); } if (pts.length > 1) polyP(B.p(rib), pts, 0.7, 4); }
  // the louvred enclosure under the dome edge and the covered promenade
  const RW = 136;
  for (let i = 0; i < 72; i++){ const a0 = i/72*TAU, a1 = (i + 1)/72*TAU, am = (a0 + a1)/2; if (Math.cos(am) < -0.93) continue;
    const y1 = Yd(RW) - 1.5;
    quadP(B.p(louv), [Math.cos(a0)*RW, 0, Math.sin(a0)*RW], [Math.cos(a1)*RW, 0, Math.sin(a1)*RW], [Math.cos(a1)*RW, y1, Math.sin(a1)*RW], [Math.cos(a0)*RW, y1, Math.sin(a0)*RW]);
    for (let k = 0; k < 3; k++){ const a = lerp(a0, a1, (k + 0.5)/3); segP(B.p(conc), [Math.cos(a)*(RW + 0.8), 0, Math.sin(a)*(RW + 0.8)], [Math.cos(a)*(RW + 0.8), y1, Math.sin(a)*(RW + 0.8)], 0.3, 4); }
    // the aluminium louvre blades of the bowl's skin, tilted outwards, above the open promenade level
    const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1), ob = B.p(rib);
    for (let y = 6.5; y < y1 - 0.5; y += 1.45) quadP(ob, [c0*(RW + 0.15), y, s0*(RW + 0.15)], [c1*(RW + 0.15), y, s1*(RW + 0.15)], [c1*(RW + 1.1), y - 0.55, s1*(RW + 1.1)], [c0*(RW + 1.1), y - 0.55, s0*(RW + 1.1)]); }
  // concrete feet where the paired arch ribs land on the promenade beyond the facade
  // (kept inside the old plan radius so the hull does not grow over the Sports Hub neighbours)
  for (let i = 0; i < NB; i++){ const a = i/NB*TAU, x = Math.cos(a)*(RE - 1.5), z = Math.sin(a)*(RE - 1.5); if (Math.abs(z) < HW + 4 && x < 0) continue;
    LCyl(g, 1.0, 1.45, 2.4, x, -0.6, z, conc, 8); segP(B.p(conc), [x, 1.6, z], [Math.cos(a)*(RE - 4), 3.6, Math.sin(a)*(RE - 4)], 0.8, 6); }
  LRing(g, RW - 2, RW - 2, RE, RE, -5, 0.5, conc, 96);
  // ---- inside: pitch, track and the three-tier bowl ----
  LPoly(g, ellP(92, 52, 48), -5, 5.3, track);
  LPoly(g, [[-52.5, -34], [52.5, -34], [52.5, 34], [-52.5, 34]], 0.3, 0.1, pitch);
  for (let k = -5; k <= 5; k += 2) boxP(B.p({c:'#5c9746', glow:'#4a8a38', gk:0.5}), 9.5, 0.12, 68, k*9.5, 0.4, 0, 0);
  // the bowl: elliptical rings from the track edge (95 x 56 m) to the back row (128 x 110 m), rising to ~7 m under
  // the dome all round; three tiers split by concourse fascias; the two upper tiers stop either side of the gate
  const AX = v => lerp(95, 128, v), BZ = v => lerp(56, 110, v);
  const yB = (a, v) => { const r = Math.hypot(Math.cos(a)*AX(1), Math.sin(a)*BZ(1)); return 1 + (Yd(r) - 8)*Math.pow(v, 0.95); };
  const BP = (a, v) => [Math.cos(a)*AX(v), yB(a, v), Math.sin(a)*BZ(v)];
  const TIERS = [[0, 0.4, 0], [0.45, 0.7, 0.42], [0.75, 1, 0.55]];
  for (const [v0, v1, gap] of TIERS){
    const a0 = gap ? PI + gap : 0, a1 = gap ? 3*PI - gap : TAU;
    surf(g, 90, 3, (u, v) => BP(lerp(a0, a1, u), lerp(v0, v1, v)), seat);
    // fascia (front of the tier above) and aisles
    const fa = B.p({c:'#dad6cf', glow:'#ffe6c4', gk:0.35});
    for (let i = 0; i < 90; i++){ const p = BP(lerp(a0, a1, i/90), v0), q = BP(lerp(a0, a1, (i + 1)/90), v0); quadP(fa, p, q, [q[0], q[1] - 2.6, q[2]], [p[0], p[1] - 2.6, p[2]]); }
    for (let i = 0; i < 36; i++){ const a = lerp(a0, a1, (i + 0.5)/36), w = 0.006; const P1 = (v, d) => { const p = BP(a + d, v); return [p[0], p[1] + 0.15, p[2]]; };
      quadP(B.p({c:'#d8d2c8', ds:true}), P1(v0, -w), P1(v0, w), P1(v1, w), P1(v1, -w)); }
  }
  // back wall of the bowl up to the dome, closed except at the gate
  surf(g, 90, 1, (u, v) => { const a = lerp(PI + 0.55, 3*PI - 0.55, u), p = BP(a, 1), r = Math.hypot(p[0], p[2]); return [p[0]*1.005, lerp(p[1] - 1, Yd(r) - 1, v), p[2]*1.005]; }, conc);
  // ---- the retractable roof: runway trusses arching over the pitch, the two ETFE halves parked by the slot ----
  for (const xr of [-28, 40]){ const pts = []; for (let k = 0; k <= 16; k++){ const z = lerp(-HW - 14, HW + 14, k/16), r = Math.hypot(xr, z); pts.push([xr, Math.abs(z) <= HW ? Yd(Math.hypot(xr, HW)) + 1.5 + 2.0*Math.sin(PI*(z + HW)/(2*HW)) : Yd(r) + 1.5, z]); }
    polyP(B.p(rib), pts, 1.1, 6); polyP(B.p(rib), pts.map(p => [p[0] + 3, p[1] - 2.5, p[2]]), 0.6, 4); }
  for (const sg of [-1, 1]){
    // a circular segment: chord on the slot edge from x = -44 to x = 46, arc out to r = 62
    const pts = []; for (let i = 0; i <= 18; i++){ const x = lerp(-44, 46, i/18); pts.push([x, sg*(HW + 0.5)]); }
    const arc = []; for (let i = 0; i <= 18; i++){ const x = lerp(46, -44, i/18), zz = Math.sqrt(Math.max(0, 62*62 - x*x)); arc.push([x, sg*Math.max(HW + 6, zz*0.92)]); }
    const seg = pts.concat(arc), yS = p => Yd(Math.hypot(p[0], p[1])) + 1.8;
    const top = seg.map(p => [p[0], yS(p), p[1]]);
    for (let i = 0; i < 19; i++){ const a = top[i], b = top[i + 1], c = top[37 - i - 1], d = top[37 - i];
      if (c && d) quadP(B.p(etfe), a, b, c, d); }
    for (let i = 0; i < seg.length; i++){ const a = top[i], b = top[(i + 1) % seg.length]; quadP(B.p(led), a, b, [b[0], b[1] - 2.6, b[2]], [a[0], a[1] - 2.6, a[2]]); }
    for (let i = 1; i < 18; i += 2){ const a = top[i], b = top[37 - i]; segP(B.p(rib), [a[0], a[1] + 0.3, a[2]], [b[0], b[1] + 0.3, b[2]], 0.35, 4); }
  }
  // floodlight ring under the rim of the opening
  const fl = []; for (let i = 0; i < 64; i++){ const a = (PI - A0) - (TAU - 2*A0)*(i + 0.5)/64, r = Math.min(dIn(a), RC) + 3; fl.push(Math.cos(a)*r, Yd(r) - 5.5, Math.sin(a)*r); }
  for (let i = 0; i < fl.length; i += 3) boxP(B.p({c:'#f2f2ee', glow:'#ffffff', gk:1.4}), 2.2, 0.8, 2.2, fl[i], fl[i + 1], fl[i + 2], 0);
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'sportshub', lat:1.304440, lon:103.874349, rot:0.7210});
}
// ---------------------------------------------------------------- Changi: Jewel
{
const PI = Math.PI, HP = PI/2, TAU = PI*2;
const lerp = (a, b, t) => a + (b - a)*t;
const clamp01 = t => t < 0 ? 0 : t > 1 ? 1 : t;
const sstep = (a, b, x) => { const t = clamp01((x - a)/(b - a)); return t*t*(3 - 2*t); };
const vsub = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
const vadd = (a, b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
const vmul = (a, s) => [a[0]*s, a[1]*s, a[2]*s];
const vcross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const vnorm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0]/l, a[1]/l, a[2]/l]; };
// triangle batches: many small parts of one colour become one LTris call
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const quadP = (out, a, b, c, d) => out.push(...a, ...b, ...c, ...a, ...c, ...d);
// n-sided prism round the segment a-b
function segP(out, a, b, r, n){
  n = n || 4; const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2], L = Math.hypot(dx, dy, dz); if (L < 1e-4) return;
  const d = [dx/L, dy/L, dz/L], up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let ux = d[1]*up[2]-d[2]*up[1], uy = d[2]*up[0]-d[0]*up[2], uz = d[0]*up[1]-d[1]*up[0]; const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
  const vx = d[1]*uz-d[2]*uy, vy = d[2]*ux-d[0]*uz, vz = d[0]*uy-d[1]*ux;
  const ring = p => { const R = []; for (let i = 0; i < n; i++){ const t = (i + 0.5)/n*TAU, c = Math.cos(t)*r, s = Math.sin(t)*r; R.push([p[0]+ux*c+vx*s, p[1]+uy*c+vy*s, p[2]+uz*c+vz*s]); } return R; };
  const A = ring(a), B = ring(b);
  for (let i = 0; i < n; i++){ const j = (i+1) % n; out.push(...A[i], ...A[j], ...B[j], ...A[i], ...B[j], ...B[i]); }
}
// box (w along x, d along z) standing on y, turned ry, into a batch
function boxP(out, w, h, d, x, y, z, ry){
  const R = rotP(x, z, ry || 0), hw = w/2, hd = d/2;
  const P = [R(-hw, y, -hd), R(hw, y, -hd), R(hw, y, hd), R(-hw, y, hd), R(-hw, y+h, -hd), R(hw, y+h, -hd), R(hw, y+h, hd), R(-hw, y+h, hd)];
  for (const [a, b, c, e] of [[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]) quadP(out, P[a], P[b], P[c], P[e]);
}
// regular n-gon prism (radius to the corners), optionally tapering, into a batch
function ngonP(out, n, r0, r1, y0, y1, x, z, a0, cap){
  for (let i = 0; i < n; i++){ const t0 = (a0 || 0) + i/n*TAU, t1 = (a0 || 0) + (i+1)/n*TAU, c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
    quadP(out, [x + c0*r0, y0, z + s0*r0], [x + c1*r0, y0, z + s1*r0], [x + c1*r1, y1, z + s1*r1], [x + c0*r1, y1, z + s0*r1]);
    if (cap){ out.push(x, y1, z, x + c1*r1, y1, z + s1*r1, x + c0*r1, y1, z + s0*r1); if (cap > 1) out.push(x, y0, z, x + c0*r0, y0, z + s0*r0, x + c1*r0, y0, z + s1*r0); } }
}
// distance along a ray from (ox, oz) in direction (dx, dz) to the ellipse centred (cx, cz) with semi-axes a, b (origin inside)
function rayEll(ox, oz, dx, dz, cx, cz, a, b){
  const px = ox - cx, pz = oz - cz, A = dx*dx/(a*a) + dz*dz/(b*b), B = 2*(px*dx/(a*a) + pz*dz/(b*b)), C = px*px/(a*a) + pz*pz/(b*b) - 1;
  return (-B + Math.sqrt(Math.max(0, B*B - 4*A*C)))/(2*A);
}
// low-poly tree standing on (x, y, z): trunk into `tk`, a rounded crown of radius r into `out`; total height h
const TRU = [], TRA = [];
for (let i = 0; i <= 6; i++){ TRU.push(Math.cos(i/6*TAU)); TRA.push(Math.sin(i/6*TAU)); }
function treeP(out, x, y, z, r, h, rot, tk){
  const cr = Math.cos(rot), sr = Math.sin(rot), cs = Math.cos(rot + PI/6), ss = Math.sin(rot + PI/6);
  const yb = y + h*0.32, yA = yb + h*0.1, yB = y + h*0.6, yC = y + h*0.86, rA = r*0.62, rB = r, rC = r*0.68;
  for (let i = 0; i < 6; i++){
    const c0 = TRU[i]*cr - TRA[i]*sr, s0 = TRA[i]*cr + TRU[i]*sr, c1 = TRU[i+1]*cr - TRA[i+1]*sr, s1 = TRA[i+1]*cr + TRU[i+1]*sr;
    const d0 = TRU[i]*cs - TRA[i]*ss, e0 = TRA[i]*cs + TRU[i]*ss, d1 = TRU[i+1]*cs - TRA[i+1]*ss, e1 = TRA[i+1]*cs + TRU[i+1]*ss;
    const ax0 = x + c0*rA, az0 = z + s0*rA, ax1 = x + c1*rA, az1 = z + s1*rA, bx0 = x + d0*rB, bz0 = z + e0*rB, bx1 = x + d1*rB, bz1 = z + e1*rB;
    const cx0 = x + c0*rC, cz0 = z + s0*rC, cx1 = x + c1*rC, cz1 = z + s1*rC, bpx = x + (TRU[(i + 5) % 6]*cs - TRA[(i + 5) % 6]*ss)*rB, bpz = z + (TRA[(i + 5) % 6]*cs + TRU[(i + 5) % 6]*ss)*rB;
    out.push(x, yb, z, ax1, yA, az1, ax0, yA, az0,
      ax0, yA, az0, ax1, yA, az1, bx0, yB, bz0,
      ax0, yA, az0, bx0, yB, bz0, bpx, yB, bpz,
      bpx, yB, bpz, bx0, yB, bz0, cx0, yC, cz0,
      bx0, yB, bz0, cx1, yC, cz1, cx0, yC, cz0,
      cx0, yC, cz0, cx1, yC, cz1, x, y + h, z);
  }
  if (tk){ const t = Math.max(0.18, r*0.09), yt = yb + h*0.06; for (let i = 0; i < 3; i++){ const a0 = rot + i/3*TAU, a1 = rot + (i + 1)/3*TAU, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    tk.push(x + c0*t, y, z + s0*t, x + c1*t, y, z + s1*t, x + c1*t*0.7, yt, z + s1*t*0.7, x + c0*t, y, z + s0*t, x + c1*t*0.7, yt, z + s1*t*0.7, x + c0*t*0.7, yt, z + s0*t*0.7); } }
}

// ===================================================================================================================
// ===== Jewel Changi Airport: a 200 m x 150 m toroidal glass-and-steel gridshell over a five-storey ring of shops,
// the Shiseido Forest Valley terraces, the Canopy Park on level 5, and the 40 m HSBC Rain Vortex falling through
// the oculus, which is pushed 12 m off-centre (local +z) to clear the Changi Skytrain that runs through the building.
// Local frame: +x = the long axis of the ellipse (east end, towards the T2 link side), +z = SSW (towards T2/T3),
// -z = NNE (Terminal 1). Origin = centre of the elliptical footprint.
const JW = {A:101.3, B:76.0, OX:0, OZ:12.3, RO:6.2, YO:27.5, YC:38.0, TC:0.29, PE:2.6, QE:2.2};
// roof profile along a ray from the oculus lip (t = 0) to the ground (t = 1): funnel up to the crest ring, then a
// superelliptic shoulder that comes down vertically at the base
function jProf(t){
  if (t <= JW.TC){ const u = t/JW.TC; return JW.YO + (JW.YC - JW.YO)*Math.pow(Math.sin(u*HP), 0.75); }
  const w = (t - JW.TC)/(1 - JW.TC); return JW.YC*Math.pow(Math.max(0, 1 - Math.pow(w, JW.PE)), 1/JW.QE);
}
// t at which the dome shoulder is at height y
const jTatY = y => JW.TC + (1 - JW.TC)*Math.pow(Math.max(0, 1 - Math.pow(Math.min(1, y/JW.YC), JW.QE)), 1/JW.PE);
// Skytrain centre line through the building (from the OSM monorail ends)
const jTrackZ = x => -5.3 + 0.034*x;

// lm22: warm interior glow at night (glass, slabs, shopfronts), floodlit steel grid, denser and brighter Rain Vortex,
// a foundation skirt down to y = -5.
// night: as in the lm20/core light table (anim 'show', c2) since this file loads after it; warm glow from inside
LANDMARKS.jewel = {zh:'星耀樟宜', en:'Jewel Changi Airport', cat:'new', r:116, h:38, lt:{m:0, c:'#ffe9cc', k:0.4, e:0.6, anim:'show', c2:'#6fe0ff'}, build(){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
  const OX = JW.OX, OZ = JW.OZ;
  // ---- materials
  const GLASS = {c:'#86a6b4', op:0.54, glow:'#ffd9a6', gk:0.13, lk:0.12};
  const STEEL = {c:'#eef2f2', m:0, lk:0.55, lc:'#fff1dc'}, SLAB = {c:'#e7e5df', glow:'#ffe2b8', gk:0.75}, CONC = '#aeaba3', PAVE = '#d3cec3';
  const SHOP = {c:'#55656c', glow:'#ffcf8f', gk:1.35};
  const TERR = {c:'#4d7d37', glow:'#2a6a34', gk:0.7}, RISE = '#4f6844';
  const TREE1 = {c:'#2f6129', glow:'#2a7a44', gk:0.6}, TREE2 = {c:'#4a7f33', glow:'#3a8a3c', gk:0.6};
  const PARK = {c:'#5d8f45', glow:'#24502a', gk:0.45}, HEDGE = '#2f5a2c';
  const WATER = {c:'#e3f1f6', m:2, lk:1.35}, POOL = {c:'#86c6dc', glow:'#7fd8ff', gk:1.1};
  const DARK = {c:'#3a4950', glow:'#fff0d0', gk:0.7}, RAIL = '#d3e2e6';

  // ---- outer boundary by arc length, rays from the oculus centre
  const NBd = 1440, EB = [], ES = [0];
  for (let i = 0; i <= NBd; i++){ const s = i/NBd*TAU; EB.push([JW.A*Math.cos(s), JW.B*Math.sin(s)]); if (i) ES.push(ES[i-1] + Math.hypot(EB[i][0]-EB[i-1][0], EB[i][1]-EB[i-1][1])); }
  const PER = ES[NBd];
  const bound = sig => { sig = ((sig % 1) + 1) % 1; const L = sig*PER; let lo = 0, hi = NBd; while (hi - lo > 1){ const m = (lo + hi) >> 1; if (ES[m] <= L) lo = m; else hi = m; } const f = (L - ES[lo])/((ES[hi] - ES[lo]) || 1); return [lerp(EB[lo][0], EB[hi][0], f), lerp(EB[lo][1], EB[hi][1], f)]; };
  const shellP = (sig, t) => { const b = bound(sig), dx = b[0] - OX, dz = b[1] - OZ, L = Math.hypot(dx, dz), rho = JW.RO + t*(L - JW.RO); return [OX + dx/L*rho, jProf(t), OZ + dz/L*rho]; };
  const shellN = (sig, t) => { const p = shellP(sig, t), e = 1e-3, ps = shellP(sig + e, t), pt = t < 1 - e ? shellP(sig, t + e) : null, pt0 = shellP(sig, t - e);
    const ds = vsub(ps, p), dt = pt ? vsub(pt, p) : vsub(p, pt0); return vnorm(vcross(ds, dt)); };

  // ---- hoops: uniform spacing along the surface (measured on the long axis), node count doubling outwards
  const NSm = 800, sAcc = [0]; let prev = shellP(0, 0);
  for (let k = 1; k <= NSm; k++){ const p = shellP(0, k/NSm); sAcc.push(sAcc[k-1] + Math.hypot(p[0]-prev[0], p[1]-prev[1], p[2]-prev[2])); prev = p; }
  const KH = 36, TT = [];
  for (let k = 0; k <= KH; k++){ const target = sAcc[NSm]*k/KH; let j = 0; while (j < NSm && sAcc[j+1] < target) j++; TT.push(Math.min(1, (j + (target - sAcc[j])/((sAcc[j+1] - sAcc[j]) || 1))/NSm)); }
  const hoops = []; let Nprev = 0, offPrev = 0;
  for (let k = 0; k <= KH; k++){
    const t = TT[k]; let C = 0, q0 = shellP(0, t);
    for (let i = 1; i <= 64; i++){ const q = shellP(i/64, t); C += Math.hypot(q[0]-q0[0], q[2]-q0[2]); q0 = q; }
    let N = 18*Math.pow(2, Math.max(0, Math.round(Math.log2(C/(3.9*18)))));
    if (Nprev){ N = Math.max(Nprev, Math.min(N, Nprev*2)); }
    const off = !Nprev ? 0 : N === Nprev ? (offPrev + 0.5) % 1 : (2*offPrev + 0.5) % 1;
    const nodes = [];
    for (let i = 0; i < N; i++){ const s = (i + off)/N; nodes.push({s, p:shellP(s, t), n:shellN(s, Math.max(t, 1e-3))}); }
    hoops.push({t, N, nodes}); Nprev = N; offPrev = off;
  }
  // ---- glass panels and steel members (hoops + the bias members of the triangulation)
  const glass = B.p(GLASS), stl = B.p(STEEL), MW = 0.07, MF = 0.22;
  // one member = a flat strip just outside the glass + a fin inside it (written straight into the batch)
  const member = (a, b, hw, fd) => {
    const A = a.p, Bp = b.p, An = a.n, Bn = b.n, o = 0.07;
    const ex = Bp[0] - A[0], ey = Bp[1] - A[1], ez = Bp[2] - A[2];
    let nx = An[0] + Bn[0], ny = An[1] + Bn[1], nz = An[2] + Bn[2]; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    let sx = ey*nz - ez*ny, sy = ez*nx - ex*nz, sz = ex*ny - ey*nx; const sl = (Math.hypot(sx, sy, sz) || 1)/hw; sx /= sl; sy /= sl; sz /= sl;
    const ax = A[0] + An[0]*o, ay = A[1] + An[1]*o, az = A[2] + An[2]*o, bx = Bp[0] + Bn[0]*o, by = Bp[1] + Bn[1]*o, bz = Bp[2] + Bn[2]*o;
    stl.push(ax - sx, ay - sy, az - sz, bx - sx, by - sy, bz - sz, bx + sx, by + sy, bz + sz, ax - sx, ay - sy, az - sz, bx + sx, by + sy, bz + sz, ax + sx, ay + sy, az + sz);
    const cx = Bp[0] - Bn[0]*fd, cy = Bp[1] - Bn[1]*fd, cz = Bp[2] - Bn[2]*fd, dx = A[0] - An[0]*fd, dy = A[1] - An[1]*fd, dz = A[2] - An[2]*fd;
    stl.push(ax, ay, az, bx, by, bz, cx, cy, cz, ax, ay, az, cx, cy, cz, dx, dy, dz);
  };
  for (let k = 0; k < KH; k++){
    const A = hoops[k].nodes, Bn = hoops[k+1].nodes, nA = A.length, nB = Bn.length;
    const sA = i => A[i % nA].s + Math.floor(i/nA);
    let j0 = 0; while (j0 < nB && Bn[j0].s < A[0].s) j0++;
    const sB = j => { const jj = j0 + j; return Bn[((jj % nB) + nB) % nB].s + Math.floor(jj/nB); };
    const nb = j => Bn[(((j0 + j) % nB) + nB) % nB];
    let i = 0, j = 0;
    member(A[0], nb(0), MW, MF);
    while (i < nA || j < nB){
      const advA = j >= nB || (i < nA && sA(i + 1) <= sB(j + 1));
      if (advA){ const a = A[i % nA], a2 = A[(i+1) % nA], b = nb(j); glass.push(...a.p, ...a2.p, ...b.p); if (i + 1 < nA || j < nB) member(a2, b, MW, MF); i++; }
      else { const a = A[i % nA], b = nb(j), b2 = nb(j + 1); glass.push(...a.p, ...b2.p, ...b.p); if (i < nA || j + 1 < nB) member(a, b2, MW, MF); j++; }
    }
  }
  for (let k = 0; k <= KH; k++){ const A = hoops[k].nodes; const hw = k === 0 ? 0.5 : k === KH ? 0.35 : MW*1.15, fd = k === 0 ? 0.8 : MF; for (let i = 0; i < A.length; i++) member(A[i], A[(i+1) % A.length], hw, fd); }
  // oculus compression ring and the ring beam at the base of the glass
  { const rim = [];
    for (let i = 0; i <= 48; i++){ const s = i/48, p = shellP(s, 0); rim.push(p); }
    const pc = B.p(STEEL); for (let i = 0; i < 48; i++){ const a = rim[i], b = rim[i+1]; quadP(pc, [a[0], a[1] + 0.3, a[2]], [b[0], b[1] + 0.3, b[2]], [b[0], b[1] - 1.1, b[2]], [a[0], a[1] - 1.1, a[2]]); }
    const pl = B.p(CONC); for (let i = 0; i < 96; i++){ const a = shellP(i/96, 1), b = shellP((i+1)/96, 1); quadP(pl, [a[0], -5, a[2]], [b[0], -5, b[2]], [b[0], 0.9, b[2]], [a[0], 0.9, a[2]]); } }

  // ---- interior: rays from the oculus at uniform angle
  const NR = 160, KT = 8, Y5 = 22, LV = [5.5, 11, 16.5, 22];
  const RH5 = [], LB = [], YT = [];
  for (let i = 0; i < NR; i++){ const a = i/NR*TAU, dx = Math.cos(a), dz = Math.sin(a);
    RH5.push(rayEll(OX, OZ, dx, dz, 0, 5, 56, 46)); LB.push(rayEll(OX, OZ, dx, dz, 0, 0, JW.A, JW.B)); YT.push(Y5*sstep(-0.1, 0.7, dz)); }
  const P = (i, rho, y) => { const a = i/NR*TAU; return [OX + Math.cos(a)*rho, y, OZ + Math.sin(a)*rho]; };
  const rhoSh = (i, y) => JW.RO + jTatY(y)*(LB[((i % NR) + NR) % NR] - JW.RO);
  const shellY = (x, z) => { const dx = x - OX, dz = z - OZ, rho = Math.hypot(dx, dz), L = rayEll(OX, OZ, dx/rho, dz/rho, 0, 0, JW.A, JW.B); return jProf(clamp01((rho - JW.RO)/(L - JW.RO))); };
  const inTrack = (p, y0, y1) => Math.abs(p[2] - jTrackZ(p[0])) < 6.8 && y1 > 6.0 && y0 < 14;
  const ringQ = (out, i, r0a, r0b, r1a, r1b, y) => quadP(out, P(i, r0a, y), P(i + 1, r0b, y), P(i + 1, r1b, y), P(i, r1a, y));
  const wallQ = (out, i, ra, rb, y0, y1) => quadP(out, P(i, ra, y0), P(i + 1, rb, y0), P(i + 1, rb, y1), P(i, ra, y1));
  const rP = i => RH5[((i % NR) + NR) % NR], yP = i => YT[((i % NR) + NR) % NR];
  // level 1 floor (with the opening for the Rain Vortex funnel) and a paved apron outside the glass
  { const fl = B.p(PAVE); for (let i = 0; i < NR; i++) ringQ(fl, i, 9.2, 9.2, rhoSh(i, 0.6) - 0.2, rhoSh(i + 1, 0.6) - 0.2, 0.06);
    const ap = B.p(CONC); for (let i = 0; i < NR; i++){ ringQ(ap, i, rhoSh(i, 0.2), rhoSh(i + 1, 0.2), rhoSh(i, 0.2) + 1.6, rhoSh(i + 1, 0.2) + 1.6, 0.1); wallQ(ap, i, rhoSh(i, 0.2) + 1.6, rhoSh(i + 1, 0.2) + 1.6, -5, 0.1); } }
  // the ring of shops: slabs, slab edges, storefronts (outer face behind the glass; inner face on the T1 side of the valley)
  const sl = B.p(SLAB), sh = B.p(SHOP), rl = B.p(RAIL), cp = B.p(PARK);
  for (let li = 0; li < LV.length; li++){
    const y = LV[li], top = li === LV.length - 1;
    for (let i = 0; i < NR; i++){
      const ri0 = rP(i), ri1 = rP(i + 1), ro0 = rhoSh(i, y + 1.0) - 1.2, ro1 = rhoSh(i + 1, y + 1.0) - 1.2;
      const mid = P(i + 0.5, (ri0 + ro0)/2, y);
      if (!top && inTrack(mid, y - 1, y + 0.2) && Math.abs(mid[0]) > 40){ /* opening for the Skytrain */ }
      else { ringQ(top ? cp : sl, i, ri0, ri1, ro0, ro1, y); }
      wallQ(sl, i, ro0, ro1, y - 0.9, y);
      if (top || y > Math.max(yP(i), yP(i + 1)) + 0.4) wallQ(sl, i, ri0 - 0.3, ri1 - 0.3, y - 0.9, y);
      wallQ(rl, i, ri0 - 0.15, ri1 - 0.15, y, y + 1.1);
    }
  }
  for (let li = 0; li < 4; li++){
    const y0 = li === 0 ? 0 : LV[li - 1], y1 = LV[li] - 0.9;
    for (let i = 0; i < NR; i++){
      const r0 = rhoSh(i, LV[li]) - 3.0, r1 = rhoSh(i + 1, LV[li]) - 3.0, pm = P(i + 0.5, r0, (y0 + y1)/2);
      if (!inTrack(pm, y0, y1)) wallQ(sh, i, r0, r1, y0, y1);
      const yt = Math.max(yP(i), yP(i + 1)); if (yt < y1 - 0.3){ const pi = P(i + 0.5, rP(i) + 2.5, (y0 + y1)/2); if (!inTrack(pi, Math.max(y0, yt), y1)) wallQ(sh, i, rP(i) + 2.5, rP(i + 1) + 2.5, Math.max(y0, yt), y1); }
    }
  }
  // ---- Shiseido Forest Valley: planted terraces stepping down from level 5 to the Rain Vortex on the far side from T1
  const tr = B.p(TERR), rs = B.p(RISE), t1 = B.p(TREE1), t2 = B.p(TREE2);
  const R0 = 14;
  const rhoK = (i, k) => lerp(R0, rP(i), k/KT);
  for (let i = 0; i < NR; i++){
    const path = (i % 20) < 2;   // walks across the valley floor
    for (let k = 0; k < KT; k++){
      let ya = yP(i)*(k + 1)/KT, yb = yP(i + 1)*(k + 1)/KT, ya0 = yP(i)*k/KT, yb0 = yP(i + 1)*k/KT;
      const low = Math.max(ya, yb) < 0.6;
      if (low){ if (k === KT - 1 || path) continue; ya = yb = 0.45; ya0 = yb0 = k ? 0.45 : 0.06; }   // planter beds on the T1 side of the floor
      const a0 = rhoK(i, k), b0 = rhoK(i + 1, k), a1 = rhoK(i, k + 1), b1 = rhoK(i + 1, k + 1);
      quadP(tr, P(i, a0, ya), P(i + 1, b0, yb), P(i + 1, b1, yb), P(i, a1, ya));
      if (ya - ya0 > 0.05) quadP(rs, P(i, a0, ya0), P(i + 1, b0, yb0), P(i + 1, b0, yb), P(i, a0, ya));
      // trees on the terrace
      const area = 0.5*(a1 - a0 + b1 - b0)*(a0 + a1)/2*TAU/NR;
      let n = area/(low ? 24 : 15) + rng(); while (n >= 1){ n--; const f = rng(), rr = lerp(a0, a1, 0.2 + 0.7*rng()), ii = i + f, y = lerp(ya, yb, f), p = P(ii, rr, y);
        if (Math.abs(p[2] - jTrackZ(p[0])) < 8.5) continue; treeP(rng() < 0.55 ? t1 : t2, p[0], y, p[2], 1.8 + rng()*1.8, 5 + rng()*6, rng()*TAU, rs); }
    }
  }
  // ---- Canopy Park on level 5: trees, the hedge maze at the east end, the Canopy Bridge across the valley
  for (let i = 0; i < NR; i++){
    const r0 = rP(i) + 2, r1 = rhoSh(i, 23) - 2.5; if (r1 <= r0) continue;
    const area = (r1 - r0)*(r0 + r1)/2*TAU/NR; let n = area/36 + rng();
    while (n >= 1){ n--; const rr = lerp(r0, r1, rng()), p = P(i + rng(), rr, Y5); if (Math.hypot(p[0] - 72, p[2] + 7) < 13) continue; if (Math.abs(p[2] + 30) < 7 && Math.abs(p[0]) < 44) continue;
      const hh = Math.min(4 + rng()*4.5, shellY(p[0], p[2]) - Y5 - 1.6); if (hh < 2.4) continue;
      treeP(rng() < 0.5 ? t1 : t2, p[0], Y5, p[2], Math.min(1.6 + rng()*1.6, hh*0.45), hh, rng()*TAU, rs); }
  }
  { const hd = B.p(HEDGE); for (let k = 0; k < 5; k++){ const R = 3 + k*2.4, gap = 0.6 + k*1.3; for (let s = 0; s < 24; s++){ const a0 = s/24*TAU, a1 = (s + 1)/24*TAU; if (Math.abs(((a0 - gap) % TAU + TAU) % TAU) < 0.5) continue;
      const p0 = [72 + Math.cos(a0)*R, Y5, -7 + Math.sin(a0)*R], p1 = [72 + Math.cos(a1)*R, Y5, -7 + Math.sin(a1)*R]; quadP(hd, p0, p1, [p1[0], Y5 + 1.8, p1[2]], [p0[0], Y5 + 1.8, p0[2]]); quadP(hd, [p0[0], Y5 + 1.8, p0[2]], [p1[0], Y5 + 1.8, p1[2]], [p1[0]*0.999, Y5 + 1.8, p1[2] + 0.4], [p0[0]*0.999, Y5 + 1.8, p0[2] + 0.4]); } } }
  { const zb = -30, dk = B.p(SLAB), gl = B.p(POOL);
    for (const s of [-1, 1]) boxP(dk, 16, 1.0, 10, s*33, Y5 - 0.95, zb, 0);
    boxP(dk, 50, 0.6, 3.6, 0, Y5 + 0.4, zb, 0);
    boxP(gl, 16, 0.05, 2.6, 0, Y5 + 1.0, zb, 0);
    for (const s of [-1, 1]){ quadP(rl, [-25, Y5 + 1, zb + s*1.8], [25, Y5 + 1, zb + s*1.8], [25, Y5 + 2.5, zb + s*1.8], [-25, Y5 + 2.5, zb + s*1.8]); segP(stl, [-25, Y5 + 2.5, zb + s*1.8], [25, Y5 + 2.5, zb + s*1.8], 0.08, 4); }
    for (let x = -24; x <= 24; x += 6) for (const s of [-1, 1]) segP(stl, [x, Y5 + 1, zb + s*1.8], [x, Y5 + 2.6, zb + s*1.8], 0.07, 3); }
  // ---- the HSBC Rain Vortex: a 40 m hollow column of water from the oculus into the acrylic funnel (light show at night)
  { const wt = B.p(WATER), NW = 84, ytop = JW.YO - 0.6;
    const wi = B.p(POOL);
    for (let L = 0; L < 2; L++) for (let i = 0; i < NW; i++){ const a = (i + L*0.5 + (rng() - 0.5)*0.3)/NW*TAU, wa = (L ? 0.9 : 0.35 + 0.35*rng())/NW*TAU*0.5, rt = 5.3 - L*0.6 + rng()*0.2, rb = 4.7 - L*0.5 + rng()*0.25;
      const c0 = Math.cos(a - wa), s0 = Math.sin(a - wa), c1 = Math.cos(a + wa), s1 = Math.sin(a + wa);
      quadP(L ? wi : wt, [OX + c0*rt, ytop, OZ + s0*rt], [OX + c1*rt, ytop, OZ + s1*rt], [OX + c1*rb, 0.4, OZ + s1*rb], [OX + c0*rb, 0.4, OZ + s0*rb]); }
    // water sheeting into the oculus over the funnel lip
    for (let i = 0; i < 48; i++){ const a0 = i/48*TAU, a1 = (i + 1)/48*TAU; quadP(wt, [OX + Math.cos(a0)*5.3, ytop, OZ + Math.sin(a0)*5.3], [OX + Math.cos(a1)*5.3, ytop, OZ + Math.sin(a1)*5.3], [OX + Math.cos(a1)*JW.RO, JW.YO + 0.2, OZ + Math.sin(a1)*JW.RO], [OX + Math.cos(a0)*JW.RO, JW.YO + 0.2, OZ + Math.sin(a0)*JW.RO]); }
    // the acrylic funnel and pool seen through the floor opening, glass balustrade round it
    const pl = B.p(POOL); ngonP(pl, 40, 9.0, 9.0, -0.4, 0.02, OX, OZ, 0, 1);
    ngonP(pl, 40, 7.6, 8.4, 0.02, 1.0, OX, OZ, 0, 0);
    ngonP(rl, 40, 9.3, 9.3, 0.06, 1.2, OX, OZ, 0, 0); }
  // ---- Changi Skytrain: dual guideway through the building at level 2/3, with a two-car train by the Rain Vortex
  { const ry = -Math.atan(0.034), cc = B.p(CONC), YD = 9.0;
    // the guideway stops just inside the glass at both ends (its continuation to the terminals is not part of this model)
    const GL = 196;
    boxP(cc, GL, 1.7, 7.6, 0, YD - 1.7, jTrackZ(0), ry);
    for (const dz of [-3.65, 0, 3.65]) boxP(cc, GL, 1.1, 0.35, 0, YD, jTrackZ(0) + dz, ry);
    for (const x of [-80, -52, -26, 26, 52, 80]) boxP(cc, 2.2, YD - 1.7, 4.5, x, 0, jTrackZ(x), ry);
    const tw = B.p(SLAB), dkw = B.p(DARK);
    for (let c = 0; c < 2; c++){ const x = -14 + c*12.2, z = jTrackZ(x) - 1.85; boxP(tw, 11.6, 3.3, 2.7, x, YD + 0.25, z, ry); boxP(dkw, 11.0, 1.25, 2.8, x, YD + 1.7, z, ry); } }
  // ---- links: the glazed bridges to Terminal 3 (west) and Terminal 2 (south-east), the Terminal 1 link (north)
  { const gb = B.p(GLASS), fr = B.p(SLAB);
    const link = (x0, z0, x1, z1, w, y0, y1) => { const L = Math.hypot(x1 - x0, z1 - z0), ry = -Math.atan2(z1 - z0, x1 - x0), cx = (x0 + x1)/2, cz = (z0 + z1)/2, R = rotP(cx, cz, ry);
      boxP(fr, L, 0.8, w, cx, y0 - 0.8, cz, ry); boxP(gb, L - 0.2, y1 - y0, w - 0.6, cx, y0, cz, ry); boxP(fr, L, 0.5, w, cx, y1, cz, ry);
      for (let k = 0; k <= Math.round(L/3); k++){ const u = -L/2 + L*k/Math.round(L/3); for (const s of [-1, 1]) segP(stl, R(u, y0, s*w/2), R(u, y1, s*w/2), 0.09, 4); }
      if (y0 > 2) for (const s of [-1, 1]){ const q = R(L/2 - 1.2, 0, s*(w/2 - 0.8)); boxP(fr, 0.9, y0 - 0.8, 0.9, q[0], 0, q[2], ry); } };
    link(-88, 35, -103.5, 43.5, 8, 6.2, 11.0);
    link(85, 42, 96.5, 50.5, 8, 6.2, 11.0);
    link(-61, -60, -66.5, -68, 12, 0.2, 5.5);
    // ground-floor entrances: glazed portals with canopies (forecourt side towards T1, the car park side, the south garden)
    for (const sg of [0.69, 0.80, 0.26, 0.35]){ const b = bound(sg), nx = b[0]/(JW.A*JW.A), nz = b[1]/(JW.B*JW.B), nl = Math.hypot(nx, nz), ry = Math.atan2(nx/nl, nz/nl), R = rotP(b[0], b[1], ry);
      const c = R(0, 0, 2.6), d = R(0, 0, 0.7); boxP(fr, 13, 0.5, 6.5, c[0], 4.6, c[2], ry); boxP(gb, 9, 4.4, 2.0, d[0], 0.15, d[2], ry);
      for (const s of [-1, 1]){ const q = R(s*5.8, 0, 5.2); segP(stl, [q[0], 0, q[2]], [q[0], 4.6, q[2]], 0.16, 4); } } }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'jewel', lat:1.360222, lon:103.989750, rot:-0.4015});
}
}
