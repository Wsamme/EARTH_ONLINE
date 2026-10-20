// ===== lm18/d: Chinatown, Kampong Glam and Orchard Road =====
// Masjid Sultan, Sri Mariamman Temple, Buddha Tooth Relic Temple, Thian Hock Keng, People's Park Complex, ION Orchard, Ngee Ann City.
// Block-scoped: only LANDMARKS and SG_PLACES are touched. Real dimensions in metres; y = 0 is the ground.
// Every model is drawn in a local frame derived from the real OSM footprint (see the SG_PLACES rot); the plans below are
// the real footprints in that frame. Foundations reach down to y = -5.
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

// ================= Masjid Sultan (1928-32, Denis Santry of Swan & Maclaren), Kampong Glam =================
// Indo-Saracenic prayer hall raised ~3 m on a basement, 55 x 33 m on the qibla axis. Two identical gold onion domes
// (~12 m across, ~31 m high) on octagonal drums with the dark band of glass-bottle ends at their base: one over the main
// entrance towards Bussorah Street, one over the royal memorial facing North Bridge Road. Each dome block is flanked by
// two octagonal minarets with chhatri tops; four slimmer minarets at the hall corners; side entrance porches; cusped-arch
// windows in two tiers, crenellated parapets. Local frame: +z = ESE (main entrance, Bussorah St), -z = WNW (North Bridge Rd),
// +x = NNE. Night: warm floodlights, gold domes lit, lit windows.
LANDMARKS.sultanmosque = {zh:'苏丹回教堂', en:'Masjid Sultan (Sultan Mosque)', cat:'old', r:40, h:34,
  lt:{m:0, c:'#ffd6a0', k:0.95, e:0.45},
  build(){
    const g = new THREE.Group(), B = mkB();
    const WALL = '#e6d6ac', TRIM = '#f4ecd2', BASE = '#c2b18c', ROOF = '#b9b3a3', DARK = '#433d34', BAND = '#1b1a18',
      GOLD = {c:'#d6a33a', lc:'#ffd27e', lk:1.35, glow:'#b98a2e', gk:0.55}, WIN = {c:'#4d463a', glow:'#ffc77e', gk:0.42}, LAMP = {c:'#fff2cc', glow:'#ffd890', gk:1.7};
    const X0 = -16.7, X1 = 17.0, Z0 = -20.2, Z1 = 23.7, FL = 2.8, WT = 12.6, PT = 13.7;
    // ---- foundation: the real footprint ----
    const RING = [[11.1,-25.3],[11.3,-20.2],[16.6,-19.8],[16.5,-23.1],[19.4,-22.3],[19.2,-19.7],[16.8,-19.3],[17.0,-3.8],[27.9,-3.9],[27.6,9.2],[16.7,9.2],[16.3,20.5],[19.5,20.4],[19.5,23.6],[11.3,23.9],[10.9,29.2],[-10.5,28.5],[-10.8,23.5],[-19.9,23.4],[-19.9,20.1],[-16.7,20.1],[-16.6,9.7],[-26.5,9.3],[-26.3,-4.3],[-16.6,-4.0],[-16.9,-20.0],[-19.0,-20.4],[-18.9,-23.1],[-16.2,-22.9],[-15.8,-20.5],[-10.5,-20.1],[-10.4,-26.0],[-5.2,-25.6],[-5.0,-31.4],[6.1,-31.0],[5.8,-25.7]];
    prismP(B.p(BASE), RING, -5, 0.6);
    // ---- prayer hall ----
    bxP(B.p(BASE), X0 - 0.2, X1 + 0.2, 0.6, FL, Z0 - 0.2, Z1 + 0.2);                 // raised basement storey
    bxP(B.p(WALL), X0, X1, FL, WT, Z0, Z1);
    bxP(B.p(TRIM), X0 - 0.3, X1 + 0.3, WT - 0.5, WT + 0.1, Z0 - 0.3, Z1 + 0.3);      // cornice
    bxP(B.p(ROOF), X0 + 0.3, X1 - 0.3, WT + 0.1, WT + 0.25, Z0 + 0.3, Z1 - 0.3);
    bxP(B.p(ROOF), -7.5, 8.2, WT + 0.25, WT + 0.9, -17.5, 16.0);                     // raised centre of the roof
    // parapet with merlons and lotus-bud pinnacles
    const PAR = rectXZ(X0 - 0.1, X1 + 0.1, Z0 - 0.1, Z1 + 0.1);
    parP(B.p(WALL), PAR, WT + 0.1, PT, 0.4); parP(B.p(TRIM), PAR, PT - 0.05, PT + 0.08, 0.5);
    for (const [x, z, a] of alongP(PAR, 1.25)) boxP(B.p(TRIM), 0.55, 0.45, 0.42, x, PT, z, -a);
    for (const [x, z] of alongP(PAR, 5.6)){ latheP(B.p(TRIM), [[0.32, PT], [0.32, PT + 0.8], [0.42, PT + 0.95], [0.3, PT + 1.25], [0.06, PT + 1.7]], x, z, 6); }
    // facade bays: cusped two-tier windows, pilasters, a string course
    const bay = (F, u) => {
      slabP(B.p(TRIM), mv(ogArchO(1.25, 5.3), u, FL + 1.2), F, 0, 0.1);
      shapeP(B.p(WIN), mv(ogArchO(0.95, 4.7), u, FL + 1.45), F, 0.13);
      slabP(B.p(TRIM), mv(rArchO(0.8, 2.5), u, 9.6), F, 0, 0.1);
      shapeP(B.p(WIN), mv(rArchO(0.58, 2.1), u, 9.8), F, 0.13);
      shapeP(B.p(DARK), mv(rectO(-0.7, 0.7, 1.1, 1.9), u, 0), F, 0.22);           // basement vent
    };
    const pil = (F, u, v0, v1) => slabP(B.p(TRIM), rectO(u - 0.22, u + 0.22, v0, v1), F, 0, 0.16);
    // long sides (x = X1 facing +x, x = X0 facing -x): F(u) with u = -z for +x and u = z for -x
    for (const s of [1, -1]){
      const F = fX(s > 0 ? X1 : X0, s, 0);
      for (const z of [-17.4, -13.9, -10.4, -6.9, 11.6, 15.2, 18.8]){ bay(F, -s*z); pil(F, -s*(z - 1.75), FL, WT - 0.5); pil(F, -s*(z + 1.75), FL, WT - 0.5); }
      slabP(B.p(TRIM), rectO(-26, 26, 9.0, 9.35), F, 0, 0.14);
    }
    // ends beside the dome blocks
    for (const [z, s] of [[Z1, 1], [Z0, -1]]){ const F = fZ(z, s, 0); for (const x of [-13.9, 13.9]) bay(F, s*x); }
    // ---- side entrance porches (one on each long side) ----
    for (const [p0, p1, z0, z1, s] of [[X1, 27.9, -3.9, 9.2, 1], [-26.4, X0, -4.3, 9.7, -1]]){
      const xo = s > 0 ? p1 : p0, zc = (z0 + z1)/2;
      bxP(B.p(BASE), p0, p1, 0.6, 1.4, z0, z1);
      bxP(B.p(WALL), p0, p1, 1.4, 5.0, z0, z1);
      parP(B.p(TRIM), rectXZ(p0 - 0.2, p1 + 0.2, z0 - 0.2, z1 + 0.2), 4.7, 5.15, 0.5); capP(B.p(ROOF), rectXZ(p0, p1, z0, z1), 5.02);
      for (const [x, z, a] of alongP(rectXZ(p0, p1, z0, z1), 1.25)) boxP(B.p(TRIM), 0.5, 0.4, 0.38, x, 5.15, z, -a);
      const F = fX(xo, s, zc);
      for (const u of [-4.3, 0, 4.3]){ slabP(B.p(TRIM), mv(ogArchO(1.75, 3.5), u, 1.25), F, 0, 0.1); shapeP(B.p(DARK), mv(ogArchO(1.45, 3.1), u, 1.4), F, 0.12); }
      for (const [z, t] of [[z0, -1], [z1, 1]]){ const Fz = fZ(z, t, (p0 + p1)/2); slabP(B.p(TRIM), mv(ogArchO(1.75, 3.5), 0, 1.25), Fz, 0, 0.1); shapeP(B.p(DARK), mv(ogArchO(1.45, 3.1), 0, 1.4), Fz, 0.12); }
      for (const z of [z0 + 0.4, z1 - 0.4]){ const x = xo - s*0.4; latheP(B.p(TRIM), [[0.35, 5.15], [0.35, 6.0], [0.5, 6.15], [0.4, 6.4]], x, z, 8); LLathe(g, onion(0.42).map(p => [p[0], p[1]]), x, 6.4, z, GOLD, 12); }
      bxP(B.p(BASE), xo + (s > 0 ? 0 : -1.4), xo + (s > 0 ? 1.4 : 0), -0.4, 0.9, zc - 3, zc + 3);   // steps
      boxP(B.p(LAMP), 0.3, 0.45, 0.3, xo + s*0.25, 3.9, z0 + 0.3); boxP(B.p(LAMP), 0.3, 0.45, 0.3, xo + s*0.25, 3.9, z1 - 0.3);
    }
    // ---- the two dome blocks with drum, glass-bottle band and onion dome ----
    const ONION = [[5.05, 0], [5.7, 0.8], [6.15, 2.0], [6.2, 3.3], [5.8, 4.7], [4.9, 6.0], [3.6, 7.2], [2.2, 8.2], [1.05, 9.0], [0.4, 9.6], [0.12, 10.0], [0, 10.15]];
    for (const [x0, x1, z0, z1, s, zi] of [[-5.4, 5.6, 17.9, 28.9, 1, Z1], [-5.0, 6.0, -31.2, -19.8, -1, Z0]]){
      const cx = (x0 + x1)/2, cz = (z0 + z1)/2, zo = s > 0 ? z1 : z0, TB = 17.0;
      bxP(B.p(BASE), x0 - 0.2, x1 + 0.2, 0.6, FL, z0 - 0.2, z1 + 0.2);
      bxP(B.p(WALL), x0, x1, FL, TB, z0, z1);
      bxP(B.p(TRIM), x0 - 0.3, x1 + 0.3, TB - 0.55, TB + 0.05, z0 - 0.3, z1 + 0.3);
      for (const [x, z, a] of alongP(rectXZ(x0, x1, z0, z1), 1.2)) boxP(B.p(TRIM), 0.5, 0.45, 0.4, x, TB + 0.05, z, -a);
      // pishtaq: a tall cusped arch in a rectangular frame on the outer face
      const F = fZ(zo, s, cx);
      slabP(B.p(TRIM), rectO(-4.7, 4.7, FL + 0.3, 15.7), F, 0, 0.14);
      slabP(B.p(WALL), rectO(-4.3, 4.3, FL + 0.6, 15.3), F, 0.14, 0.2);
      shapeP(B.p(DARK), ogArchO(3.3, 11.6).map(p => [p[0], p[1] + FL + 0.7]), F, 0.22);
      shapeP(B.p(WIN), rArchO(1.5, 4.0).map(p => [p[0], p[1] + FL]), F, 0.26);        // doors
      shapeP(B.p(WIN), ogArchO(1.9, 4.6).map(p => [p[0], p[1] + 8.2]), F, 0.26);      // upper window
      slabP(B.p(TRIM), rectO(-3.3, 3.3, 7.3, 7.7), F, 0.2, 0.5);
      // inner face above the hall roof and the side faces above the minarets
      shapeP(B.p(WIN), mv(rArchO(1.2, 2.6), 0, WT + 1.2), fZ(s > 0 ? z0 : z1, -s, cx), 0.05);
      for (const t of [1, -1]) shapeP(B.p(WIN), mv(rArchO(1.0, 2.2), 0, 14.0), fX(t > 0 ? x1 : x0, t, cz), 0.05);
      // octagonal drum with little arched windows, the dark band of bottle ends, gold onion dome and crescent finial
      const D0 = TB + 0.6, D1 = 20.0;
      latheP(B.p(WALL), [[5.35, TB], [5.35, D0]], cx, cz, 8, PI/8);
      latheP(B.p(TRIM), [[5.35, D0], [5.5, D0 + 0.25], [5.2, D0 + 0.35]], cx, cz, 8, PI/8);
      latheP(B.p(WALL), [[5.15, D0 + 0.35], [5.15, D1]], cx, cz, 8, PI/8);
      for (let i = 0; i < 8; i++){ const a = i/8*TAU, ap = 5.15*Math.cos(PI/8) + 0.03, F8 = fA(cx + Math.cos(a)*ap, cz + Math.sin(a)*ap, a + HP); shapeP(B.p(DARK), mv(rArchO(0.55, 1.6), 0, D0 + 0.55), F8, 0); }
      latheP(B.p(TRIM), [[5.15, D1], [5.45, D1 + 0.2], [5.45, D1 + 0.4]], cx, cz, 8, PI/8);
      LCyl(g, 5.2, 5.25, 1.1, cx, D1 + 0.4, cz, BAND, 32);
      LCyl(g, 5.1, 5.25, 0.2, cx, D1 + 1.5, cz, GOLD, 32);
      LLathe(g, ONION, cx, D1 + 1.7, cz, GOLD, 32);
      const T = D1 + 1.7 + 10.15;
      latheP(B.p(GOLD), [[0.22, T - 0.1], [0.3, T + 0.3], [0.08, T + 0.5], [0.26, T + 0.75], [0.07, T + 1.0], [0.05, T + 1.6]], cx, cz, 8);
      slabP(B.p(GOLD), CRES.map(p => [p[1], p[0] + T + 2.0]), fA(cx, cz, HP), -0.05, 0.05);
      // main-entrance porch (chhajja canopy) on the east, a smaller porch on the west
      const pd = s > 0 ? 1.6 : 0.9, zp = zo + s*pd;
      bxP(B.p(BASE), cx - 3.6, cx + 3.6, -0.4, 1.0, Math.min(zo, zp), Math.max(zo, zp));
      bxP(B.p(TRIM), cx - 3.4, cx - 2.7, 1.0, 5.4, Math.min(zo, zp - s*0.7), Math.max(zo, zp - s*0.7));
      bxP(B.p(TRIM), cx + 2.7, cx + 3.4, 1.0, 5.4, Math.min(zo, zp - s*0.7), Math.max(zo, zp - s*0.7));
      quadP(B.p(TRIM), [cx - 3.9, 6.0, zo], [cx + 3.9, 6.0, zo], [cx + 3.9, 5.3, zp], [cx - 3.9, 5.3, zp]);
      bxP(B.p(TRIM), cx - 3.9, cx + 3.9, 5.15, 5.35, Math.min(zp, zp - s*0.1), Math.max(zp, zp - s*0.1));
      boxP(B.p(LAMP), 0.32, 0.5, 0.32, cx - 3.05, 4.3, zp - s*0.35); boxP(B.p(LAMP), 0.32, 0.5, 0.32, cx + 3.05, 4.3, zp - s*0.35);
    }
    // ---- minarets flanking the dome blocks (octagonal shafts, balconies, chhatri with a gold cupola) ----
    const minaret = (x, z, w, tall) => {
      bxP(B.p(BASE), x - w/2 - 0.15, x + w/2 + 0.15, 0.6, FL, z - w/2 - 0.15, z + w/2 + 0.15);
      bxP(B.p(WALL), x - w/2, x + w/2, FL, PT, z - w/2, z + w/2);
      bxP(B.p(TRIM), x - w/2 - 0.25, x + w/2 + 0.25, PT - 0.4, PT + 0.15, z - w/2 - 0.25, z + w/2 + 0.25);
      for (const s of [1, -1]){ shapeP(B.p(DARK), mv(ogArchO(0.5, 2.0), 0, 6.5), fX(x + s*w/2, s, z), 0.04); shapeP(B.p(DARK), mv(ogArchO(0.5, 2.0), 0, 6.5), fZ(z + s*w/2, s, x), 0.04); }
      const r = w*0.4, H1 = PT + tall;
      latheP(B.p(WALL), [[r*1.05, PT + 0.15], [r, PT + 1.0], [r*0.95, H1]], x, z, 8, PI/8);
      for (const yb of [PT + tall*0.45, H1]){
        latheP(B.p(TRIM), [[r*0.95, yb - 0.3], [r*1.35, yb], [r*1.35, yb + 0.3], [r*0.95, yb + 0.3]], x, z, 8, PI/8);
        for (let i = 0; i < 8; i++){ const a = (i + 0.5)/8*TAU; boxP(B.p(TRIM), 0.35, 0.4, 0.2, x + Math.cos(a)*r*1.27, yb + 0.3, z + Math.sin(a)*r*1.27, -a + HP); }
      }
      for (let i = 0; i < 8; i++){ const a = (i + 0.5)/8*TAU; shapeP(B.p(DARK), mv(rArchO(0.28, 1.0), 0, PT + tall*0.7), fA(x + Math.cos(a)*r*0.95*Math.cos(PI/8), z + Math.sin(a)*r*0.95*Math.cos(PI/8), a + HP), 0.02); }
      const C0 = H1 + 0.3, C1 = C0 + 2.1;
      for (let i = 0; i < 8; i++){ const a = (i + 0.5)/8*TAU; segP(B.p(TRIM), [x + Math.cos(a)*r*0.95, C0, z + Math.sin(a)*r*0.95], [x + Math.cos(a)*r*0.95, C1, z + Math.sin(a)*r*0.95], 0.13, 4); }
      latheP(B.p(TRIM), [[r*1.15, C0 - 0.05], [r*1.15, C0 + 0.12], [0, C0 + 0.12]], x, z, 8, PI/8);
      latheP(B.p(TRIM), [[r*1.1, C1], [r*1.3, C1 + 0.25], [r*1.0, C1 + 0.45], [0, C1 + 0.45]], x, z, 8, PI/8);
      const rd = r*0.95; LLathe(g, onion(rd*0.75), x, C1 + 0.45, z, GOLD, 12);
      latheP(B.p(GOLD), [[0.08, C1 + 0.45 + rd*1.75], [0.05, C1 + 0.45 + rd*1.75 + 1.0]], x, z, 4);
      boxP(B.p(LAMP), 0.25, 0.35, 0.25, x, C0 + 0.2, z);
    };
    minaret(8.4, 26.5, 5.5, 9.5); minaret(-8.05, 26.2, 5.5, 9.5);   // the two minarets of the Bussorah Street front
    minaret(8.5, -22.8, 5.5, 8.0); minaret(-7.7, -23.0, 5.5, 8.0);
    // slender minarets at the four hall corners
    for (const [x, z] of [[18.0, 21.9], [-18.3, 21.8], [18.0, -21.4], [-17.4, -21.6]]){
      bxP(B.p(BASE), x - 1.75, x + 1.75, 0.6, FL, z - 1.75, z + 1.75);
      latheP(B.p(WALL), [[1.75, FL], [1.75, PT + 0.6]], x, z, 8, PI/8);
      latheP(B.p(TRIM), [[1.75, PT + 0.6], [2.0, PT + 0.9], [1.3, PT + 1.1]], x, z, 8, PI/8);
      latheP(B.p(WALL), [[1.3, PT + 1.1], [1.15, 18.0]], x, z, 8, PI/8);
      latheP(B.p(TRIM), [[1.15, 18.0], [1.5, 18.25], [1.5, 18.5], [1.1, 18.55]], x, z, 8, PI/8);
      for (let i = 0; i < 6; i++){ const a = (i + 0.5)/6*TAU; segP(B.p(TRIM), [x + Math.cos(a)*0.95, 18.5, z + Math.sin(a)*0.95], [x + Math.cos(a)*0.95, 19.9, z + Math.sin(a)*0.95], 0.09, 4); }
      latheP(B.p(TRIM), [[1.2, 19.9], [1.3, 20.1], [1.0, 20.25]], x, z, 8, PI/8);
      LLathe(g, onion(0.82), x, 20.25, z, GOLD, 10);
      latheP(B.p(GOLD), [[0.06, 22.2], [0.04, 22.9]], x, z, 4);
    }
    B.flush(g);
    return g;
  }};
SG_PLACES.push({type:'sultanmosque', lat:1.302225, lon:103.858989, rot:1.1711});

// ================= Sri Mariamman Temple (1827; gopuram 1925), South Bridge Road, Chinatown =================
// Singapore's oldest Hindu temple, Dravidian style, oriented east (the OSM footprint is ~8 deg off east, ~22 deg off the
// shophouse grid). Six-tier gopuram (~20 m) over the entrance, tiers crowded with painted stucco deities (suggested here
// by coloured figure niches, cornices and miniature shrines), barrel-vault crown with gold kalasams; compound walls with
// mouldings and seated cows; the mandapam hall; the vimana over Mariamman's sanctum; smaller domed vimanas over the
// Draupadi, Ganesha and rear shrines; the gold flagpole. Local frame: +z = east (gopuram front), +x = north (Pagoda St side).
LANDMARKS.mariamman = {zh:'马里安曼兴都庙', en:'Sri Mariamman Temple', cat:'old', r:30, h:20.4,
  lt:{m:0, c:'#ffd9a8', k:1.0, e:0.55},
  build(){
    const g = new THREE.Group(), B = mkB(), V = mkV(), R = LMCTX.rng;
    const STONE = '#a69e8e', WALL = '#f0e6d0', GOLD = {c:'#d9a93f', lc:'#ffd27e', lk:1.3}, DOOR = '#5b3b22', ROOF = '#b7a78d', PAVE = '#cbc4b4',
      DARK = '#3a2f29', LAMP = {c:'#fff2cc', glow:'#ffd890', gk:1.8};
    const PAL = ['#3d6fd0', '#d23b2c', '#3e9b4b', '#e9c33b', '#f3efe5', '#e690a2', '#e8873b', '#5bb9e1', '#9a5cc6', '#2f8f8a', '#f3efe5', '#e9c33b'];
    const pick = () => PAL[Math.floor(R()*PAL.length)];
    const RING = [[6.9,-19.8],[9.4,-18.9],[9.8,-16.0],[11.5,-16.3],[12.4,-1.8],[4.1,-0.7],[4.0,2.4],[11.5,4.2],[7.9,21.7],[1.1,20.2],[0.9,22.7],[-6.9,22.6],[-7.3,19.6],[-10.3,20.0],[-10.3,-18.5],[-8.7,-20.0],[-5.7,-19.8],[-6.1,-22.8],[-3.9,-24.3],[-2.1,-23.9],[-0.4,-21.1],[2.7,-19.8],[3.4,-18.7]];
    // ---- foundation, courtyard paving, compound wall with mouldings, cows and miniature shrines ----
    wallP(B.p(STONE), RING, -5, 0.4); capP(B.p(PAVE), RING, 0.4);
    parP(B.p(STONE), RING, 0.4, 1.0, 0.75);
    parP(B.p(WALL), RING, 1.0, 3.9, 0.6);
    vAdd(V, '#c8462f', t => parP(t, RING, 3.2, 3.5, 0.7));
    vAdd(V, '#e6be3c', t => parP(t, RING, 3.9, 4.25, 0.8));
    const CL = offP(RING, 0.3);
    const cow = (o, x, y, z, ang) => {
      const c = Math.cos(ang), s = Math.sin(ang);
      boxP(o, 1.45, 0.6, 0.72, x, y, z, -ang); boxP(o, 0.5, 0.32, 0.4, x - c*0.25, y + 0.6, z - s*0.25, -ang);
      const hx = x + c*0.85, hz = z + s*0.85; boxP(o, 0.4, 0.45, 0.36, hx, y + 0.5, hz, -ang); boxP(o, 0.3, 0.2, 0.3, hx + c*0.18, y + 0.45, hz + s*0.18, -ang);
      for (const k of [1, -1]) segP(o, [hx - s*k*0.12, y + 0.95, hz + c*k*0.12], [hx - s*k*0.3, y + 1.25, hz + c*k*0.3], 0.045, 3);
    };
    let k = 0;
    for (const [x, z, a, L] of alongP(CL, 2.6)){
      if (L < 1.6) continue;
      if (k++ % 3 === 0) cow(B.p('#f4f0e6'), x, 4.25, z, a);
      else { const col = pick(); vAdd(V, col, t => { boxP(t, 0.55, 0.45, 0.55, x, 4.25, z, -a); latheP(t, [[0.3, 4.7], [0.34, 4.85], [0.2, 5.1], [0.04, 5.3]], x, z, 6); }); }
    }
    // ---- gopuram ----
    const GX = -3.0, GZ0 = 16.7, GZ1 = 22.75, GW = 9.6, GZ = (GZ0 + GZ1)/2;
    bxP(B.p(STONE), GX - GW/2 - 0.25, GX + GW/2 + 0.25, 0.4, 1.4, GZ0 - 0.25, GZ1 + 0.25);
    bxP(B.p(WALL), GX - GW/2, GX + GW/2, 1.4, 5.7, GZ0, GZ1);
    for (const s of [1, -1]){
      const F = fZ(s > 0 ? GZ1 : GZ0, s, GX);
      shapeP(B.p(DARK), rectO(-1.55, 1.55, 1.4, 5.0), F, 0.03);
      shapeP(B.p(DOOR), rectO(-1.4, -0.04, 1.4, 4.6), F, 0.06); shapeP(B.p(DOOR), rectO(0.04, 1.4, 1.4, 4.6), F, 0.06);
      for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) for (const sx of [-1, 1]) boxP(B.p(GOLD), 0.09, 0.09, 0.09, GX + s*sx*(0.35 + j*0.27), 1.9 + i*0.45, (s > 0 ? GZ1 : GZ0) + s*0.1);
      for (const u of [-3.6, -2.4, 2.4, 3.6]){ vAdd(V, '#e6be3c', t => slabP(t, rectO(u - 0.5, u + 0.5, 2.0, 4.6), F, 0, 0.1)); shapeP(B.p(DARK), rectO(u - 0.38, u + 0.38, 2.2, 4.3), F, 0.12); vAdd(V, pick(), t => slabP(t, rectO(u - 0.22, u + 0.22, 2.35, 3.8), F, 0.12, 0.3)); }
      for (const u of [-4.6, -1.85, 1.85, 4.6]) vAdd(V, '#e6be3c', t => slabP(t, rectO(u - 0.15, u + 0.15, 1.4, 5.7), F, 0, 0.14));
      boxP(B.p(LAMP), 0.3, 0.45, 0.3, GX - s*1.9, 4.6, (s > 0 ? GZ1 : GZ0) + s*0.35);
      boxP(B.p(LAMP), 0.3, 0.45, 0.3, GX + s*1.9, 4.6, (s > 0 ? GZ1 : GZ0) + s*0.35);
    }
    for (const s of [1, -1]){ const F = fX(GX + s*GW/2, s, GZ); for (const u of [-1.6, 1.6]){ shapeP(B.p(DARK), rectO(u - 0.38, u + 0.38, 2.2, 4.3), F, 0.04); vAdd(V, pick(), t => slabP(t, rectO(u - 0.22, u + 0.22, 2.35, 3.8), F, 0.04, 0.24)); } }
    vAdd(V, '#c8462f', t => frustP(t, GX, GZ, GW + 0.5, GZ1 - GZ0 + 0.5, GW + 0.8, GZ1 - GZ0 + 0.8, 5.7, 0.3));
    vAdd(V, '#e6be3c', t => frustP(t, GX, GZ, GW + 0.8, GZ1 - GZ0 + 0.8, GW + 0.5, GZ1 - GZ0 + 0.5, 6.0, 0.25));
    // the six tiers
    let y = 6.25;
    const mini = (x, z, a, big) => {   // a miniature shrine on a cornice: kuta (square, domed) or sala (barrel-roofed)
      const col = pick();
      vAdd(V, col, t => {
        if (big){ boxP(t, 0.7, 0.32, 0.36, x, y, z, -a); const c = Math.cos(a), s = Math.sin(a), P = []; for (let i = 0; i <= 6; i++){ const q = PI*i/6; P.push([Math.cos(q)*0.2, Math.sin(q)*0.24]); }
          for (let i = 0; i < 6; i++){ const p = P[i], q = P[i+1]; quadP(t, [x - c*0.35 - s*p[0], y + 0.32 + p[1], z - s*0.35 + c*p[0]], [x + c*0.35 - s*p[0], y + 0.32 + p[1], z + s*0.35 + c*p[0]], [x + c*0.35 - s*q[0], y + 0.32 + q[1], z + s*0.35 + c*q[0]], [x - c*0.35 - s*q[0], y + 0.32 + q[1], z - s*0.35 + c*q[0]]); } }
        else { boxP(t, 0.36, 0.3, 0.36, x, y, z, -a); latheP(t, [[0.22, y + 0.3], [0.24, y + 0.4], [0.15, y + 0.56], [0.03, y + 0.68]], x, z, 6); }
      });
    };
    let W = 8.7, D = 5.2;
    for (let i = 0; i < 6; i++){
      const hb = 1.22, Wt = W - 0.32, Dt = D - 0.22;
      vAdd(V, i % 2 ? '#f1e3c6' : '#f2d6b4', t => frustP(t, GX, GZ, W, D, Wt, Dt, y, hb));
      for (const [F, len, fr] of [[fZ(GZ + D/2, 1, GX), W, 1], [fZ(GZ - D/2, -1, GX), W, 1], [fX(GX + W/2, 1, GZ), D, 0], [fX(GX - W/2, -1, GZ), D, 0]]){
        const n = Math.max(2, Math.round(len/0.6));
        for (let j = 0; j < n; j++){ const u = -len/2 + (j + 0.5)*len/n; if (fr && Math.abs(u) < 0.75) continue; const hh = 0.62 + 0.25*R();
          vAdd(V, pick(), t => slabP(t, rectO(u - 0.17, u + 0.17, y + 0.18, y + 0.18 + hh), F, 0.0, 0.2)); }
        for (const u of [-len/2 + 0.12, len/2 - 0.12]) vAdd(V, '#e6be3c', t => slabP(t, rectO(u - 0.12, u + 0.12, y, y + hb), F, 0, 0.12));
        if (fr){ shapeP(B.p(DARK), mv(rArchO(0.42, 1.0), 0, y + 0.1), F, 0.08); vAdd(V, '#e6be3c', t => slabP(t, mv(rArchO(0.6, 1.15), 0, y + 0.05), F, 0, 0.06)); }
      }
      vAdd(V, i % 2 ? '#c8462f' : '#2f6fbf', t => frustP(t, GX, GZ, Wt + 0.55, Dt + 0.55, Wt + 0.7, Dt + 0.7, y + hb, 0.24));
      y += hb + 0.24;
      const Wp = Wt + 0.3, Dp = Dt + 0.3;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) mini(GX + sx*(Wp/2 - 0.2), GZ + sz*(Dp/2 - 0.2), 0, false);
      for (const sz of [-1, 1]){ const n = Math.max(1, Math.round((Wp - 0.8)/0.95)); for (let j = 0; j < n; j++){ const u = -Wp/2 + 0.4 + (j + 0.5)*(Wp - 0.8)/n; mini(GX + u, GZ + sz*(Dp/2 - 0.2), 0, j % 2 === 0); } }
      for (const sx of [-1, 1]){ const n = Math.max(1, Math.round((Dp - 0.8)/0.95)); for (let j = 0; j < n; j++){ const u = -Dp/2 + 0.4 + (j + 0.5)*(Dp - 0.8)/n; mini(GX + sx*(Wp/2 - 0.2), GZ + u, HP, j % 2 === 0); } }
      y += 0.5; W = Wt - 0.42; D = Dt - 0.2;
    }
    // crowning barrel vault with horseshoe gable ends and seven gold kalasams
    const VL = W + 0.2, VR = Math.min(0.95, D/2 + 0.1);
    vAdd(V, '#e6be3c', t => frustP(t, GX, GZ, W + 0.2, D + 0.2, W, D, y, 0.35));
    const yv = y + 0.35, AR = [];
    for (let i = 0; i <= 10; i++){ const q = PI*i/10; AR.push([Math.cos(q)*VR, Math.sin(q)*VR*1.15]); }
    vAdd(V, '#e3b43c', t => { for (let i = 0; i < 10; i++){ const p = AR[i], q = AR[i+1]; quadP(t, [GX - VL/2, yv + p[1], GZ + p[0]], [GX + VL/2, yv + p[1], GZ + p[0]], [GX + VL/2, yv + q[1], GZ + q[0]], [GX - VL/2, yv + q[1], GZ + q[0]]); } });
    for (const sx of [-1, 1]){ const P = [...AR.map(p => [p[0]*1.3, p[1]*1.3])]; vAdd(V, '#d0462e', t => slabP(t, P.map(p => [p[0], p[1] + yv - 0.05]), fX(GX + sx*VL/2, sx, GZ), -0.05, 0.1)); vAdd(V, '#e3b43c', t => slabP(t, P.map(p => [p[0]*0.7, p[1]*0.7 + yv]), fX(GX + sx*VL/2, sx, GZ), 0.1, 0.18)); }
    for (let j = 0; j < 7; j++){ const x = GX - VL/2 + 0.3 + j*(VL - 0.6)/6, y0 = yv + VR*1.15 - 0.05;
      latheP(B.p(GOLD), [[0.12, y0], [0.22, y0 + 0.12], [0.26, y0 + 0.28], [0.17, y0 + 0.44], [0.07, y0 + 0.52], [0.12, y0 + 0.62], [0.02, y0 + 0.95]], x, GZ, 8); }
    // ---- mandapam (hall from the gopuram to the sanctum) ----
    const MX0 = GX - 5.0, MX1 = GX + 5.0, MZ0 = -1.5, MZ1 = GZ0;
    bxP(B.p(WALL), MX0, MX1, 0.4, 6.0, MZ0, MZ1);
    vAdd(V, '#c8462f', t => bxP(t, MX0 - 0.2, MX1 + 0.2, 6.0, 6.35, MZ0 - 0.2, MZ1 + 0.2));
    vAdd(V, '#e6be3c', t => bxP(t, MX0 - 0.35, MX1 + 0.35, 6.35, 6.6, MZ0 - 0.35, MZ1 + 0.35));
    capP(B.p(ROOF), rectXZ(MX0 - 0.3, MX1 + 0.3, MZ0 - 0.3, MZ1 + 0.3), 6.62);
    for (const s of [1, -1]){ const F = fX(s > 0 ? MX1 : MX0, s, (MZ0 + MZ1)/2); for (let j = 0; j < 5; j++){ const u = -7 + j*3.5; shapeP(B.p(DARK), mv(rArchO(0.7, 2.4), u, 2.2), F, 0.04); vAdd(V, '#e6be3c', t => slabP(t, rectO(u + 1.6, u + 1.9, 0.4, 6.0), F, 0, 0.12)); } }
    y = 6.6; for (const [x, z] of [[MX0, MZ0], [MX1, MZ0], [MX0, MZ1 - 0.6], [MX1, MZ1 - 0.6], [MX0, (MZ0 + MZ1)/2], [MX1, (MZ0 + MZ1)/2]]) mini(x + (x < GX ? 0.3 : -0.3), z, 0, false);
    latheP(B.p(GOLD), [[0.16, 6.6], [0.12, 11.6], [0.25, 11.7], [0.04, 12.4]], GX, 14.6, 8);
    for (let j = 0; j < 4; j++) latheP(B.p(GOLD), [[0.3, 6.6 + j*1.1], [0.3, 6.75 + j*1.1]], GX, 14.6, 8);
    // ---- vimanas: the main sanctum and three smaller shrines ----
    const vimana = (cx, cz, w, d, hw, tiers, dr, gold) => {
      bxP(B.p(WALL), cx - w/2, cx + w/2, 0.4, hw, cz - d/2, cz + d/2);
      vAdd(V, '#c8462f', t => bxP(t, cx - w/2 - 0.2, cx + w/2 + 0.2, hw, hw + 0.3, cz - d/2 - 0.2, cz + d/2 + 0.2));
      for (const s of [1, -1]){ shapeP(B.p(DARK), mv(rArchO(0.55, 1.9), 0, 1.6), fX(cx + s*w/2, s, cz), 0.04); vAdd(V, '#e6be3c', t => slabP(t, mv(rArchO(0.75, 2.2), 0, 1.45), fX(cx + s*w/2, s, cz), 0, 0.03)); }
      let yy = hw + 0.3, ww = w - 0.4, dd = d - 0.4;
      for (let i = 0; i < tiers; i++){
        const h = 1.2;
        vAdd(V, i % 2 ? '#f1e3c6' : '#f2d6b4', t => frustP(t, cx, cz, ww, dd, ww - 0.3, dd - 0.3, yy, h));
        for (const [F, len] of [[fZ(cz + dd/2, 1, cx), ww], [fZ(cz - dd/2, -1, cx), ww], [fX(cx + ww/2, 1, cz), dd], [fX(cx - ww/2, -1, cz), dd]]){
          const n = Math.max(2, Math.round(len/0.65)); for (let j = 0; j < n; j++){ const u = -len/2 + (j + 0.5)*len/n; vAdd(V, pick(), t => slabP(t, rectO(u - 0.17, u + 0.17, yy + 0.18, yy + 0.85), F, 0, 0.2)); } }
        vAdd(V, i % 2 ? '#2f6fbf' : '#c8462f', t => frustP(t, cx, cz, ww + 0.2, dd + 0.2, ww + 0.35, dd + 0.35, yy + h, 0.22));
        yy += h + 0.22; const sv = y; y = yy;
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) mini(cx + sx*(ww/2 - 0.05), cz + sz*(dd/2 - 0.05), 0, false);
        for (const sz of [-1, 1]) mini(cx, cz + sz*(dd/2 - 0.05), 0, true);
        for (const sx of [-1, 1]) mini(cx + sx*(ww/2 - 0.05), cz, HP, true);
        y = sv; yy += 0.45; ww -= 1.0; dd -= 1.0;
      }
      const r = Math.max(0.55, (Math.min(ww, dd)/2 + 0.2)*0.72);
      vAdd(V, '#e6be3c', t => latheP(t, [[r*0.8, yy], [r*0.8, yy + 0.5], [r*1.05, yy + 0.6]], cx, cz, 8, PI/8));
      const DOME = [[r*1.05, 0], [r*1.25, r*0.35], [r*1.22, r*0.75], [r*0.95, r*1.15], [r*0.5, r*1.45], [r*0.12, r*1.6], [0, r*1.62]];
      if (gold) latheP(B.p(GOLD), DOME.map(p => [p[0], p[1] + yy + 0.6]), cx, cz, 8, PI/8);
      else vAdd(V, '#e6be3c', t => latheP(t, DOME.map(p => [p[0], p[1] + yy + 0.6]), cx, cz, 8, PI/8));
      const yk = yy + 0.6 + r*1.6;
      latheP(B.p(GOLD), [[0.14, yk], [0.24, yk + 0.12], [0.27, yk + 0.3], [0.16, yk + 0.46], [0.06, yk + 0.55], [0.11, yk + 0.65], [0.02, yk + 1.0]], cx, cz, 8);
      return yk + 1.0;
    };
    vimana(GX, -5.6, 7.2, 8.0, 6.6, 3, 0, true);     // Mariamman's sanctum
    vimana(7.4, -10.0, 5.6, 8.4, 5.4, 2, 0, false);   // Draupadi shrine
    vimana(6.0, 9.6, 4.2, 5.6, 4.8, 1, 0, false);     // Ganesha shrine
    vimana(-3.3, -21.4, 5.0, 4.6, 4.4, 1, 0, false);  // rear shrine
    // covered verandahs along the inner walls (low lean-to roofs)
    for (const [x0, x1, z0, z1] of [[-10.0, MX0, -18.0, 19.4], [MX1, 7.2, 14.0, 19.6], [2.3, 4.4, -1.0, -16.0]]){ const zz0 = Math.min(z0, z1), zz1 = Math.max(z0, z1); bxP(B.p(ROOF), x0, x1, 3.4, 3.6, zz0, zz1); for (const z of [zz0 + 0.5, zz1 - 0.5]) for (const x of [x0 + 0.3, x1 - 0.3]) bxP(B.p(WALL), x - 0.15, x + 0.15, 0.4, 3.4, z - 0.15, z + 0.15); }
    B.flush(g); vFlush(g, V);
    return g;
  }};
SG_PLACES.push({type:'mariamman', lat:1.282680, lon:103.845210, rot:1.4312});

// ================= Buddha Tooth Relic Temple and Museum (2007), South Bridge Road / Sago Street =================
// Tang-dynasty style (northern Chinese) temple on a granite podium: an I-shaped block (front hall, connecting hall, rear
// hall) of three storeys of red columns and gold lattice under tiers of sweeping dark-tiled eaves; the front and rear halls
// carry double-eaved hip roofs with gold ridge ornaments, the connecting hall the rooftop garden with the Ten Thousand
// Buddha Pagoda pavilion; the forecourt towards South Bridge Road with the drum and bell towers, side porches, bronze
// incense urns and white balustrades; an open rear yard on the podium. Local frame: +z = ESE (front, South Bridge Road), +x = NNE
// (Sago Street side). Night: warm floodlights, glowing lattice windows and red lanterns under the eaves.
LANDMARKS.buddhatooth = {zh:'佛牙寺龙华院', en:'Buddha Tooth Relic Temple and Museum', cat:'old', r:46, h:31,
  lt:{m:0, c:'#ffcf9a', k:0.95, e:0.45},
  build(){
    const g = new THREE.Group(), B = mkB();
    const GRAN = '#a7a196', RED = '#a8291f', GOLDP = {c:'#c79a3e', glow:'#ffae48', gk:0.45}, TILE = '#46413c', WHITE = '#ebe7dd', BEAM = '#3f6d5f',
      WIN = {c:'#b98a3c', glow:'#ffb862', gk:0.55}, GOLD = {c:'#d8a73e', lc:'#ffd27e', lk:1.3}, LANT = {c:'#d8382a', glow:'#ff5a2e', gk:1.7}, DOOR = '#86201a', BRONZE = '#5a4a37';
    const RING = [[13.8,28.1],[13.4,39.9],[-13.7,39.5],[-13.3,27.8],[-16.0,27.9],[-16.0,-38.5],[15.8,-38.1],[15.4,28.6]];
    const P1 = [[13.3,-21.7],[13.0,-13.5],[8.2,-13.6],[7.8,14.4],[13.1,14.3],[13.2,25.7],[2.3,25.6],[2.5,22.1],[-4.4,21.7],[-4.3,25.7],[-13.9,25.4],[-14.0,14.0],[-10.6,14.1],[-10.3,-13.1],[-12.2,-12.7],[-12.0,-22.4],[-3.3,-22.3],[-3.3,-16.2],[4.1,-16.2],[3.7,-22.0]];
    const PB = 1.2;   // podium top
    prismP(B.p(GRAN), RING, -5, PB);
    bxP(B.p(GRAN), -4.2, 2.2, -0.3, PB, 39.5, 41.3);   // front steps
    // ---- ground storey on the real I-shaped plan: red walls, a colonnade, lattice windows ----
    const S1 = 8.0;
    wallP(B.p(RED), P1, PB, S1);
    const colon = (P, y0, y1, step, skip) => {
      for (const e of edgesF(P)){ if (e.L < 2.5) continue; const n = Math.max(1, Math.round(e.L/step));
        for (let k = 0; k <= n; k++){ const u = e.L*k/n, p = e.F(u, 0, 0.32); boxP(B.p(RED), 0.62, y1 - y0, 0.62, p[0], y0, p[2], -e.ang); boxP(B.p(WHITE), 0.85, 0.35, 0.85, p[0], y0, p[2], -e.ang); }
        for (let k = 0; k < n; k++){ const u0 = e.L*k/n, u1 = e.L*(k+1)/n; if (skip && skip(e, (u0 + u1)/2)) continue;
          shapeP(B.p(WIN), rectO(u0 + 0.55, u1 - 0.55, y0 + (y1 - y0)*0.32, y1 - 0.5), e.F, 0.05);
          for (let j = 1; j < 6; j++){ const u = lerp(u0 + 0.55, u1 - 0.55, j/6); shapeP(B.p(DOOR), rectO(u - 0.04, u + 0.04, y0 + (y1 - y0)*0.32, y1 - 0.5), e.F, 0.08); }
          shapeP(B.p(DOOR), rectO(u0 + 0.55, u1 - 0.55, y0 + (y1 - y0)*0.62, y0 + (y1 - y0)*0.62 + 0.08), e.F, 0.08); }
        shapeP(B.p(BEAM), rectO(0, e.L, y1 - 0.45, y1 - 0.05), e.F, 0.36);
        shapeP(B.p(GOLDP), rectO(0, e.L, y1 - 0.5, y1 - 0.42), e.F, 0.37);
      }
    };
    colon(P1, PB, S1, 3.4, (e, u) => Math.abs(e.a[1] - 21.9) < 0.6 && Math.abs(e.b[1] - 21.9) < 0.6);
    // main entrance: three great red doors with gilt studs in the recessed porch
    for (const u of [-3.1, -1.0, 1.1]){ shapeP(B.p(DOOR), rectO(u - 0.85, u + 0.85, PB, 6.0), fZ(21.95, 1, 0), 0.12); for (let i = 0; i < 7; i++) for (let j = 0; j < 4; j++) boxP(B.p(GOLD), 0.1, 0.1, 0.08, u - 0.6 + j*0.4, PB + 0.6 + i*0.7, 22.1); }
    // ---- upper storeys (front hall, connecting hall, rear hall) ----
    const BL = [{x0:-13.9, x1:13.2, z0:14.1, z1:25.6}, {x0:-10.4, x1:8.0, z0:-13.4, z1:14.2}, {x0:-12.1, x1:13.2, z0:-22.3, z1:-13.3}];
    const pent = (b, y, d, h) => roofP(B.p(TILE), (b.x0 + b.x1)/2, (b.z0 + b.z1)/2, (b.x1 - b.x0)/2 + d, (b.z1 - b.z0)/2 + d, (b.x1 - b.x0)/2, (b.z1 - b.z0)/2, y, h, {lift:0.45, fas:0.35, fo:B.p(GOLDP), pw:1.5, n:6, nt:3});
    const lanterns = (b, y, step) => { for (const e of edgesF(rectXZ(b.x0, b.x1, b.z0, b.z1))){ const n = Math.max(1, Math.round(e.L/step)); for (let k = 0; k < n; k++){ const p = e.F(e.L*(k + 0.5)/n, 0, 1.1); latheP(B.p(LANT), [[0.05, y - 1.25], [0.3, y - 1.15], [0.36, y - 0.9], [0.3, y - 0.65], [0.05, y - 0.55]], p[0], p[2], 8); segP(B.p(GOLDP), [p[0], y - 0.55, p[2]], [p[0], y - 0.1, p[2]], 0.02, 3); } } };
    for (const b of BL){ pent(b, S1 - 0.4, 1.9, 1.3); }
    lanterns(BL[0], S1 - 0.35, 3.4);
    const S2 = 12.8, S3 = 17.2;
    for (const b of BL){ const P = rectXZ(b.x0, b.x1, b.z0, b.z1); wallP(B.p(RED), P, S1 + 0.6, S2); colon(P, S1 + 0.6, S2, 3.4); pent(b, S2 - 0.4, 1.6, 1.15); }
    for (const b of BL){ const P = rectXZ(b.x0, b.x1, b.z0, b.z1); wallP(B.p(RED), P, S2 + 0.5, S3); colon(P, S2 + 0.5, S3, 3.4); }
    // connecting hall: rooftop garden terrace with white balustrades
    { const b = BL[1]; capP(B.p('#7f8c6c'), rectXZ(b.x0, b.x1, b.z0, b.z1), S3 + 0.02);
      for (const e of edgesF(rectXZ(b.x0, b.x1, b.z0, b.z1))){ if (Math.abs(e.ang) > 1.0 && Math.abs(e.ang) < 2.2) { boxP(B.p(WHITE), 0.3, 1.1, e.L, (e.a[0] + e.b[0])/2 + e.nx*0.2, S3, (e.a[1] + e.b[1])/2, 0); for (let k = 0; k <= Math.round(e.L/1.6); k++){ const p = e.F(k*1.6, 0, 0.2); boxP(B.p(WHITE), 0.32, 1.35, 0.32, p[0], S3, p[2]); } } }
      bxP(B.p(GRAN), b.x0 + 0.6, b.x1 - 0.6, S3, S3 + 0.35, -11.5, 12.0); }
    // front and rear halls: double-eaved hip roofs (pent eave, short clerestory, main hip roof with gold ornaments)
    for (const [b, top] of [[BL[0], 26.2], [BL[2], 25.0]]){
      const cx = (b.x0 + b.x1)/2, cz = (b.z0 + b.z1)/2, a = (b.x1 - b.x0)/2, w = (b.z1 - b.z0)/2;
      roofP(B.p(TILE), cx, cz, a + 2.1, w + 2.1, a - 0.6, w - 0.6, S3 - 0.3, 1.5, {lift:0.55, fas:0.4, fo:B.p(GOLDP), pw:1.4, nt:3});
      const yc = S3 + 1.2, P = rectXZ(b.x0 + 0.6, b.x1 - 0.6, b.z0 + 0.6, b.z1 - 0.6);
      wallP(B.p(RED), P, yc, yc + 1.5); for (const e of edgesF(P)){ const n = Math.round(e.L/1.6); for (let k = 0; k < n; k++) shapeP(B.p(WIN), rectO(e.L*k/n + 0.2, e.L*(k+1)/n - 0.2, yc + 0.25, yc + 1.25), e.F, 0.04); }
      const ridgeK = Math.max(0.5, a - w), y0 = yc + 1.4;
      roofP(B.p(TILE), cx, cz, a + 1.7, w + 1.7, ridgeK, 0, y0, top - y0, {lift:0.75, fas:0.45, fo:B.p(GOLDP), pw:1.6, nt:6, hips:B.p(TILE), ridge:B.p(TILE), rr:0.38});
      for (const s of [1, -1]) chiweiP(B.p(GOLD), cx + s*(ridgeK + 0.1), top + 0.2, cz, s > 0 ? 0 : PI, 1.5);
      latheP(B.p(GOLD), [[0.5, top + 0.4], [0.62, top + 0.7], [0.4, top + 1.1], [0.1, top + 1.6]], cx, cz, 8);
      // the four corner hip ends carry small gold beasts
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) boxP(B.p(GOLD), 0.35, 0.5, 0.35, cx + sx*(a + 1.45), y0 + 0.6, cz + sz*(w + 1.45));
    }
    lanterns(BL[0], S2 - 0.3, 3.4); lanterns(BL[2], S1 - 0.35, 3.4);
    // ---- the Ten Thousand Buddha Pagoda pavilion on the roof garden (double-eaved, pyramidal) ----
    { const cx = -0.8, cz = -0.5, a = 6.2, y0 = S3 + 0.35;
      bxP(B.p(WHITE), cx - a - 0.8, cx + a + 0.8, y0, y0 + 0.6, cz - a - 0.8, cz + a + 0.8);
      const P = rectXZ(cx - a, cx + a, cz - a, cz + a);
      wallP(B.p(RED), P, y0 + 0.6, 21.6); colon(P, y0 + 0.6, 21.6, 3.1);
      roofP(B.p(TILE), cx, cz, a + 1.8, a + 1.8, a - 1.4, a - 1.4, 21.3, 1.4, {lift:0.6, fas:0.35, fo:B.p(GOLDP), pw:1.4, nt:3});
      const P2 = rectXZ(cx - a + 1.6, cx + a - 1.6, cz - a + 1.6, cz + a - 1.6);
      wallP(B.p(RED), P2, 22.5, 24.4); for (const e of edgesF(P2)){ const n = 4; for (let k = 0; k < n; k++) shapeP(B.p(WIN), rectO(e.L*k/n + 0.25, e.L*(k+1)/n - 0.25, 22.8, 24.0), e.F, 0.04); }
      roofP(B.p(TILE), cx, cz, a, a, 0.35, 0.35, 24.2, 4.4, {lift:0.6, fas:0.4, fo:B.p(GOLDP), pw:1.5, nt:6, hips:B.p(TILE)});
      latheP(B.p(GOLD), [[0.6, 28.5], [0.7, 28.8], [0.45, 29.2], [0.55, 29.6], [0.35, 30.0], [0.12, 30.6], [0.04, 31.0]], cx, cz, 10);
      lanterns({x0:cx - a, x1:cx + a, z0:cz - a, z1:cz + a}, 21.4, 3.1);
    }
    // ---- forecourt: drum and bell towers, side porches, incense urns, balustrades ----
    for (const [cx, cz] of [[8.7, 33.6], [-8.65, 33.45]]){
      const a = 3.1;
      bxP(B.p(WHITE), cx - a, cx + a, PB, 5.2, cz - a, cz + a);
      for (const s of [1, -1]){ shapeP(B.p(DOOR), mv(rArchO(1.0, 3.0), 0, PB), fX(cx + s*a, s, cz), 0.04); shapeP(B.p(DOOR), mv(rArchO(1.0, 3.0), 0, PB), fZ(cz + s*a, s, cx), 0.04); }
      roofP(B.p(TILE), cx, cz, a + 1.3, a + 1.3, a - 0.5, a - 0.5, 4.9, 0.9, {lift:0.4, fas:0.3, fo:B.p(GOLDP), nt:3});
      const P = rectXZ(cx - a + 0.5, cx + a - 0.5, cz - a + 0.5, cz + a - 0.5);
      wallP(B.p(RED), P, 5.8, 9.4); for (const e of edgesF(P)){ shapeP(B.p(WIN), rectO(0.6, e.L - 0.6, 6.4, 8.9), e.F, 0.04); for (const u of [0.15, e.L - 0.15]){ const p = e.F(u, 0, 0.15); boxP(B.p(RED), 0.4, 3.6, 0.4, p[0], 5.8, p[2]); } }
      bxP(B.p(WHITE), cx - a - 0.1, cx + a + 0.1, 5.8, 6.0, cz - a - 0.1, cz + a + 0.1);
      roofP(B.p(TILE), cx, cz, a + 1.2, a + 1.2, 0.25, 0.25, 9.2, 3.6, {lift:0.6, fas:0.35, fo:B.p(GOLDP), pw:1.5, nt:5, hips:B.p(TILE)});
      latheP(B.p(GOLD), [[0.35, 12.8], [0.4, 13.1], [0.22, 13.5], [0.05, 14.0]], cx, cz, 8);
      latheP(B.p(LANT), [[0.05, 7.2], [0.32, 7.3], [0.38, 7.55], [0.32, 7.8], [0.05, 7.9]], cx, cz + a + 0.9, 8);
    }
    for (const [x0, x1, z0, z1] of [[-11.9, -7.3, 25.4, 30.5], [7.0, 11.8, 25.3, 30.6]]){
      const cx = (x0 + x1)/2, cz = (z0 + z1)/2;
      bxP(B.p(RED), x0 + 0.3, x1 - 0.3, PB, 3.9, z0 + 0.3, z1 - 0.3);
      for (const e of edgesF(rectXZ(x0 + 0.3, x1 - 0.3, z0 + 0.3, z1 - 0.3))) shapeP(B.p(WIN), rectO(0.6, e.L - 0.6, 1.9, 3.5), e.F, 0.04);
      roofP(B.p(TILE), cx, cz, (x1 - x0)/2 + 0.6, (z1 - z0)/2 + 0.6, 0.6, 0, 3.8, 2.0, {lift:0.4, fas:0.25, fo:B.p(GOLDP), nt:4, ridge:B.p(TILE), rr:0.2});
    }
    for (const x of [-4.6, 2.6]){ bxP(B.p(GRAN), x - 0.9, x + 0.9, PB, PB + 0.8, 33.5, 35.3); latheP(B.p(BRONZE), [[0.5, PB + 0.8], [0.85, PB + 1.2], [0.9, PB + 1.7], [0.7, PB + 2.0], [0.75, PB + 2.15], [0, PB + 2.15]], x, 34.4, 12); }
    const BAL = [[-13.5, 26.0], [-13.5, 39.3], [-4.2, 39.3], null, [2.2, 39.3], [13.2, 39.3], [13.2, 28.8]];
    for (let i = 0; i < BAL.length - 1; i++){ const a = BAL[i], b = BAL[i+1]; if (!a || !b) continue; const L = Math.hypot(b[0] - a[0], b[1] - a[1]), ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      boxP(B.p(WHITE), L, 0.9, 0.25, (a[0] + b[0])/2, PB, (a[1] + b[1])/2, -ang); for (let k = 0; k <= Math.round(L/1.8); k++){ const t = k/Math.round(L/1.8); boxP(B.p(WHITE), 0.3, 1.15, 0.3, lerp(a[0], b[0], t), PB, lerp(a[1], b[1], t)); } }
    // ---- the rear yard on the podium (open in the building-part data): paving, planters, trees, a low balustrade ----
    for (const [x0, x1, z0, z1] of [[-14.5, -6.0, -36.5, -26.5], [6.0, 14.2, -36.5, -26.5]]){ bxP(B.p(GRAN), x0, x1, PB, PB + 0.6, z0, z1); for (let k = 0; k < 2; k++){ const x = lerp(x0 + 2, x1 - 2, k), z = (z0 + z1)/2; segP(B.p(BRONZE), [x, PB + 0.6, z], [x, PB + 3.2, z], 0.2, 5); LSph(g, 2.4, x, PB + 4.4, z, '#5b7f4c', 0.85, 8); } }
    { const RB = [[-15.6, -22.6], [-15.6, -38.0], [15.4, -37.7], [15.3, -22.4]]; for (let i = 0; i < 3; i++){ const a2 = RB[i], b2 = RB[i+1], L = Math.hypot(b2[0] - a2[0], b2[1] - a2[1]), ang = Math.atan2(b2[1] - a2[1], b2[0] - a2[0]); boxP(B.p(WHITE), L, 0.9, 0.25, (a2[0] + b2[0])/2, PB, (a2[1] + b2[1])/2, -ang); } }
    B.flush(g);
    return g;
  }};
SG_PLACES.push({type:'buddhatooth', lat:1.281490, lon:103.844230, rot:1.0769});

// ================= Thian Hock Keng Temple (1839-42), Telok Ayer Street =================
// Hokkien temple to Mazu on the old waterfront: on a granite platform the entrance hall (three-section "san chuan" roof:
// raised centre, lower sides), the first courtyard, the main hall with a double-eaved hip-and-gable roof and the
// dragons-and-pearl ridge, the rear (Guanyin) hall, side galleries, the two octagonal pagodas at the rear corners; curved
// ridges rising to split swallowtail ends, green-glazed ridges and eaves on red tiles, colourful ceramic-shard ridge figures.
// North of it the Chong Wen Ge pavilion with its gate, south a garden forecourt and the two-storey hall behind it.
// Local frame: +z = ESE (front, Telok Ayer Street), +x = NNE. Night: warm floodlights and red lanterns.
LANDMARKS.thianhockkeng = {zh:'天福宫', en:'Thian Hock Keng Temple', cat:'old', r:46, h:14,
  lt:{m:0, c:'#ffd2a0', k:1.15, e:0.5},
  build(){
    const g = new THREE.Group(), B = mkB(), V = mkV(), Rn = LMCTX.rng;
    const GRAN = '#a29c91', RED = '#8e2c21', TILE = '#8f4c36', GT = '#3f7b54', WHITE = '#e7e1d4', PAVE = '#c6bfb2', DARK = '#3a302a',
      GOLD = {c:'#d6a640', lc:'#ffd27e', lk:1.3}, WIN = {c:'#7d3524', glow:'#ffb35c', gk:0.5}, LANT = {c:'#d8382a', glow:'#ff5a2e', gk:1.7}, LEAF = '#5a7c4b', TRUNK = '#6b5440';
    const PAL = ['#3f7b54', '#d23b2c', '#e9c33b', '#3d6fd0', '#f3efe5', '#e690a2', '#2f8f8a', '#e8873b'];
    const RING = [[24.5,-12.1],[32.7,-12.0],[33.0,20.0],[-38.6,21.3],[-39.0,-1.6],[-17.9,-4.2],[-18.2,-26.6],[24.2,-27.1]];
    wallP(B.p(GRAN), RING, -5, 0.3); capP(B.p(PAVE), RING, 0.3);
    const AX = 3.0, FY = 0.75;
    bxP(B.p(GRAN), -16.2, 22.2, 0.3, FY, -26.8, 16.6);
    bxP(B.p(GRAN), AX - 4.5, AX + 4.5, 0.3, FY - 0.25, 16.6, 18.2);
    // decorated Hokkien ridge: curved (sagging) roll with swallowtail ends splitting upwards, ceramic-shard figures
    const ridge = (cx, cz, a, yr, sag, ry, figs) => {
      const c = Math.cos(ry || 0), s = Math.sin(ry || 0), Rr = (x, y, z) => [cx + x*c + z*s, y, cz - x*s + z*c], yc = x => yr + sag*Math.pow(Math.min(1, Math.abs(x)/a), 2);
      const N = 10; for (let i = 0; i < N; i++){ const x0 = -a + 2*a*i/N, x1 = -a + 2*a*(i + 1)/N; segP(B.p(GT), Rr(x0, yc(x0), 0), Rr(x1, yc(x1), 0), 0.26, 4); const pm = Rr((x0 + x1)/2, 0, 0); boxP(B.p(TILE), 2*a/N, 0.5, 0.36, pm[0], yc((x0 + x1)/2) - 0.55, pm[2], ry || 0); }
      const T = [[a*0.9, 0], [a + 0.35, 0.12], [a + 0.8, 0.5], [a + 1.15, 1.1], [a + 1.3, 1.65]];
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let k = 0; k < T.length - 1; k++){ const p0 = T[k], p1 = T[k+1];
        segP(B.p(GT), Rr(sx*p0[0], yc(a) + p0[1], sz*0.09*k), Rr(sx*p1[0], yc(a) + p1[1], sz*0.09*(k + 1)), 0.2 - k*0.03, 4); }
      if (figs) for (let i = 1; i < 2*a/0.9 - 1; i++){ const x = -a + i*0.9; if (Math.abs(x) < 1.0) continue; const p = Rr(x, yc(x) + 0.25, 0); const hh = 0.35 + Rn()*0.25; vAdd(V, PAL[Math.floor(Rn()*PAL.length)], t => boxP(t, 0.3, hh, 0.22, p[0], p[1], p[2], ry || 0)); }
    };
    // two green dragons chasing the flaming pearl
    const dragons = (cx, cz, a, yr, sag) => {
      const yc = x => yr + sag*Math.pow(Math.min(1, Math.abs(x)/a), 2);
      for (const sx of [-1, 1]){ let prev = null; for (let i = 0; i <= 16; i++){ const x = sx*(0.8 + i*(a*0.72)/16), y = yc(x) + 0.45 + 0.32*Math.sin(i*0.9), p = [cx + x, y, cz]; if (prev) segP(B.p(GT), prev, p, 0.17 - i*0.005, 5); prev = p; }
        boxP(B.p(GT), 0.55, 0.42, 0.38, cx + sx*0.75, yc(0.75) + 0.55, cz); boxP(B.p(GOLD), 0.2, 0.2, 0.42, cx + sx*0.55, yc(0.55) + 0.75, cz); }
      latheP(B.p(GOLD), [[0.05, yr + 0.3], [0.3, yr + 0.55], [0.35, yr + 0.8], [0.25, yr + 1.05], [0.05, yr + 1.2]], cx, cz, 8);
      for (let k = 0; k < 5; k++){ const a2 = k/5*TAU; segP(B.p(GOLD), [cx, yr + 0.85, cz], [cx + Math.cos(a2)*0.55, yr + 1.0 + 0.25*Math.sin(a2*2), cz + Math.sin(a2)*0.1], 0.05, 3); }
    };
    const lantern = (x, y, z) => { latheP(B.p(LANT), [[0.05, y - 1.15], [0.28, y - 1.05], [0.34, y - 0.82], [0.28, y - 0.6], [0.05, y - 0.5]], x, z, 8); segP(B.p(GOLD), [x, y - 0.5, z], [x, y - 0.05, z], 0.02, 3); };
    const lattice = (F, u0, u1, v0, v1) => { shapeP(B.p(WIN), rectO(u0, u1, v0, v1), F, 0.04); const n = Math.max(2, Math.round((u1 - u0)/0.3)); for (let j = 1; j < n; j++) shapeP(B.p(RED), rectO(lerp(u0, u1, j/n) - 0.035, lerp(u0, u1, j/n) + 0.035, v0, v1), F, 0.07); };
    // ---- entrance hall (san chuan dian) ----
    { const x0 = -10, x1 = 16, z0 = 8.5, z1 = 16.5, zw = z1 - 1.8, cz = (z0 + z1)/2;
      bxP(B.p(GRAN), x0, x1, FY, 5.3, z0, zw);
      const F = fZ(zw, 1, 0);
      shapeP(B.p(DARK), rectO(AX - 1.8, AX + 1.8, FY, 4.6), F, 0.02);
      for (const s of [-1, 1]){ shapeP(B.p(RED), rectO(AX + s*0.05, AX + s*1.65, FY + 0.35, 4.45), F, 0.06); vAdd(V, s > 0 ? '#3d6fd0' : '#3f7b54', t => shapeP(t, rectO(AX + s*0.35, AX + s*1.35, FY + 1.2, 3.6), F, 0.08)); }
      for (const xs of [-6.2, 12.2]){ shapeP(B.p(DARK), rectO(xs - 1.1, xs + 1.1, FY, 3.7), F, 0.02); shapeP(B.p(RED), rectO(xs - 1.0, xs + 1.0, FY + 0.3, 3.6), F, 0.05); vAdd(V, '#2f8f8a', t => shapeP(t, rectO(xs - 2.6, xs - 1.5, FY + 0.6, 3.0), F, 0.04)); vAdd(V, '#2f8f8a', t => shapeP(t, rectO(xs + 1.5, xs + 2.6, FY + 0.6, 3.0), F, 0.04)); }
      for (const x of [x0 + 0.4, -2.2, AX - 2.6, AX + 2.6, 8.2, x1 - 0.4]){ latheP(B.p(GRAN), [[0.42, FY], [0.42, FY + 0.35], [0.3, FY + 0.45], [0.28, 5.3]], x, z1 - 0.45, 8); }
      for (const x of [-2.2, 8.2]) vAdd(V, '#3f7b54', t => { for (let k = 0; k < 6; k++){ const a = k*1.2; segP(t, [x + Math.cos(a)*0.33, FY + 0.8 + k*0.7, z1 - 0.45 + Math.sin(a)*0.33], [x + Math.cos(a + 1.2)*0.33, FY + 1.5 + k*0.7, z1 - 0.45 + Math.sin(a + 1.2)*0.33], 0.1, 4); } });
      bxP(B.p(RED), x0, x1, 4.9, 5.4, zw, z1 - 0.2);
      for (const s of [-1, 1]){ bxP(B.p(GRAN), AX + s*3.3 - 0.45, AX + s*3.3 + 0.45, FY, FY + 1.0, 17.2, 18.1); boxP(B.p('#8f8a80'), 0.6, 0.9, 0.85, AX + s*3.3, FY + 1.0, 17.6); boxP(B.p('#8f8a80'), 0.5, 0.5, 0.5, AX + s*3.3, FY + 1.9, 17.85); }
      // roofs: raised centre bay over the main door, lower side bays; curved gables with swallowtail ridges
      const rC = roofP(B.p(TILE), AX, cz, 6.0, 5.0, 6.0, 0, 5.3, 3.9, {gab:0.001, gcol:B.p(WHITE), sag:0.55, pw:1.45, fas:0.3, fo:B.p(GT)});
      ridge(AX, cz, 6.0, rC + 0.25, 0.55, 0, true);
      for (const [xa, xb] of [[x0 - 0.5, AX - 4.6], [AX + 4.6, x1 + 0.5]]){ const r2 = roofP(B.p(TILE), (xa + xb)/2, cz, (xb - xa)/2, 4.7, (xb - xa)/2, 0, 4.9, 3.0, {gab:0.001, gcol:B.p(WHITE), sag:0.35, pw:1.45, fas:0.28, fo:B.p(GT)}); ridge((xa + xb)/2, cz, (xb - xa)/2, r2 + 0.2, 0.35, 0, true); }
      for (const x of [AX - 4.2, AX + 4.2, -6.2, 12.2]) lantern(x, 5.1, z1 - 0.9);
    }
    // ---- side galleries ----
    for (const [x0, x1] of [[-16.0, -10.0], [16.0, 22.0]]){
      const cx = (x0 + x1)/2, z0 = -26.6, z1 = 16.4, cz = (z0 + z1)/2;
      bxP(B.p(WHITE), x0, x1, FY, 4.4, z0, z1); bxP(B.p(GRAN), x0 - 0.05, x1 + 0.05, FY, 1.6, z0 - 0.05, z1 + 0.05);
      const F = fX(x0 < 0 ? x1 : x0, x0 < 0 ? 1 : -1, cz); for (let k = 0; k < 9; k++){ const u = -19 + k*4.75; lattice(F, u - 1.0, u + 1.0, 1.8, 3.7); }
      const F2 = fX(x0 < 0 ? x0 : x1, x0 < 0 ? -1 : 1, cz); for (let k = 0; k < 9; k++){ const u = -19 + k*4.75; shapeP(B.p(DARK), rectO(u - 0.5, u + 0.5, 2.2, 3.4), F2, 0.04); }
      const r = roofP(B.p(TILE), cx, cz, (z1 - z0)/2 + 0.4, 3.7, (z1 - z0)/2 + 0.4, 0, 4.3, 1.9, {ry:HP, gab:0.001, gcol:B.p(WHITE), sag:0.25, pw:1.4, fas:0.2, fo:B.p(GT)});
      ridge(cx, cz, (z1 - z0)/2 + 0.4, r + 0.15, 0.25, HP, false);
    }
    // ---- main hall (Mazu): double-eaved hip-and-gable roof, dragons and pearl ----
    { const x0 = -7, x1 = 13, z0 = -13, z1 = -1, cx = (x0 + x1)/2, cz = (z0 + z1)/2, a = (x1 - x0)/2, b = (z1 - z0)/2;
      bxP(B.p(GRAN), x0 - 1.4, x1 + 1.4, 0.3, FY + 0.5, z0 - 1.4, z1 + 1.4);
      bxP(B.p(RED), x0, x1, FY + 0.5, 5.8, z0, z1);
      for (const e of edgesF(rectXZ(x0, x1, z0, z1))){ const n = Math.round(e.L/3.4); for (let k = 0; k <= n; k++){ const p = e.F(e.L*k/n, 0, 0.9); latheP(B.p(GRAN), [[0.4, FY + 0.5], [0.4, FY + 0.8], [0.27, FY + 0.95], [0.25, 5.8]], p[0], p[2], 8); }
        for (let k = 0; k < n; k++) lattice(e.F, e.L*k/n + 0.5, e.L*(k + 1)/n - 0.5, FY + 1.4, 4.9); }
      shapeP(B.p(DARK), rectO(-2.4, 2.4, FY + 0.5, 4.9), fZ(z1, 1, cx), 0.1);
      roofP(B.p(TILE), cx, cz, a + 2.0, b + 2.0, a - 0.2, b - 0.2, 5.5, 1.3, {lift:0.5, sag:0.25, fas:0.3, fo:B.p(GT), pw:1.4, nt:3});
      bxP(B.p(RED), x0 + 0.6, x1 - 0.6, 6.6, 8.3, z0 + 0.6, z1 - 0.6);
      for (const e of edgesF(rectXZ(x0 + 0.6, x1 - 0.6, z0 + 0.6, z1 - 0.6))){ const n = Math.round(e.L/2.2); for (let k = 0; k < n; k++) lattice(e.F, e.L*k/n + 0.3, e.L*(k + 1)/n - 0.3, 6.9, 8.0); }
      const yt = roofP(B.p(TILE), cx, cz, a + 1.4, b + 1.4, a - 2.2, 0, 8.1, 3.4, {gab:0.42, gcol:B.p(WHITE), lift:0.8, sag:0.6, fas:0.35, fo:B.p(GT), hips:B.p(GT), pw:1.6, nt:6});
      ridge(cx, cz, a - 2.2, yt + 0.2, 0.6, 0, false); dragons(cx, cz, a - 2.2, yt + 0.2, 0.6);
      for (const k of [-0.6, 0.6]) lantern(cx + k*a, 5.2, z1 + 1.1);
      latheP(B.p('#6c5a45'), [[0.6, FY], [0.9, FY + 0.5], [0.95, FY + 1.0], [0.75, FY + 1.3], [0.8, FY + 1.4], [0, FY + 1.4]], AX, 3.5, 10);   // incense urn in the courtyard
    }
    // ---- rear (Guanyin) hall ----
    { const x0 = -10, x1 = 16, z0 = -26.4, z1 = -17, cz = (z0 + z1)/2;
      bxP(B.p(RED), x0, x1, FY, 6.0, z0, z1); bxP(B.p(GRAN), x0 - 0.05, x1 + 0.05, FY, 1.6, z0 - 0.05, z1 + 0.05);
      const F = fZ(z1, 1, 0); for (let k = 0; k < 7; k++){ const u = x0 + 1.9 + k*3.7; lattice(F, u - 1.2, u + 1.2, 1.9, 5.0); }
      const r = roofP(B.p(TILE), AX, cz, 13.6, 5.8, 13.6, 0, 5.8, 3.6, {gab:0.001, gcol:B.p(WHITE), sag:0.5, pw:1.45, fas:0.3, fo:B.p(GT)});
      ridge(AX, cz, 13.6, r + 0.2, 0.5, 0, true);
      for (const k of [-2, -1, 1, 2]) lantern(AX + k*3.2, 5.5, z1 + 0.9);
    }
    // ---- the two octagonal pagodas at the rear corners ----
    for (const cx of [-13.0, 19.0]){ const cz = -21.6;
      bxP(B.p(WHITE), cx - 3.2, cx + 3.2, FY, 6.4, cz - 3.2, cz + 3.2);
      roofP(B.p(TILE), cx, cz, 4.4, 4.4, 3.2, 3.2, 6.1, 0.9, {lift:0.4, fas:0.25, fo:B.p(GT), nt:3});
      latheP(B.p(RED), [[2.6, 6.9], [2.6, 9.6]], cx, cz, 8, PI/8); capP(B.p(RED), ringPts(cx, cz, 2.6, 8, PI/8), 9.6);
      for (let i = 0; i < 8; i++){ const a = (i + 0.5)/8*TAU, ap = 2.6*Math.cos(PI/8) + 0.02; lattice(fA(cx + Math.cos(a)*ap, cz + Math.sin(a)*ap, a + HP), -0.65, 0.65, 7.3, 9.2); }
      latheP(B.p(TILE), [[3.7, 9.4], [3.0, 10.1], [2.0, 10.9], [1.0, 11.9], [0.25, 12.8], [0.05, 13.0]], cx, cz, 8, PI/8);
      latheP(B.p(GT), [[3.75, 9.25], [3.75, 9.45]], cx, cz, 8, PI/8);
      for (let i = 0; i < 8; i++){ const a = i/8*TAU + PI/8; segP(B.p(GT), [cx + Math.cos(a)*3.8, 9.55, cz + Math.sin(a)*3.8], [cx + Math.cos(a)*0.4, 12.75, cz + Math.sin(a)*0.4], 0.12, 4); }
      latheP(B.p(GOLD), [[0.2, 12.9], [0.35, 13.15], [0.2, 13.45], [0.3, 13.6], [0.05, 13.95]], cx, cz, 8);
    }
    // ---- north: Chong Wen Ge pavilion, its gate and garden ----
    { const cx = 28.4, cz = -4.0;
      bxP(B.p(GRAN), cx - 3.8, cx + 3.8, 0.3, 4.4, cz - 3.8, cz + 3.8);
      for (const e of edgesF(rectXZ(cx - 3.8, cx + 3.8, cz - 3.8, cz + 3.8))) shapeP(B.p(DARK), mv(rArchO(0.9, 2.8), e.L/2, 0.3), e.F, 0.04);
      roofP(B.p(TILE), cx, cz, 5.0, 5.0, 3.6, 3.6, 4.2, 1.0, {lift:0.4, fas:0.25, fo:B.p(GT), nt:3});
      latheP(B.p(WHITE), [[3.0, 5.0], [3.0, 8.0]], cx, cz, 8, PI/8); capP(B.p(WHITE), ringPts(cx, cz, 3.0, 8, PI/8), 8.0);
      for (let i = 0; i < 8; i++){ const a = (i + 0.5)/8*TAU, ap = 3.0*Math.cos(PI/8) + 0.02; shapeP(B.p(WIN), mv(rArchO(0.55, 1.8), 0, 5.6), fA(cx + Math.cos(a)*ap, cz + Math.sin(a)*ap, a + HP), 0); }
      latheP(B.p(TILE), [[4.1, 7.8], [3.4, 8.5], [2.3, 9.4], [1.1, 10.5], [0.25, 11.6], [0.05, 11.8]], cx, cz, 8, PI/8);
      for (let i = 0; i < 8; i++){ const a = i/8*TAU + PI/8; segP(B.p(GT), [cx + Math.cos(a)*4.2, 7.95, cz + Math.sin(a)*4.2], [cx + Math.cos(a)*0.4, 11.55, cz + Math.sin(a)*0.4], 0.12, 4); }
      latheP(B.p(GOLD), [[0.22, 11.7], [0.38, 12.0], [0.22, 12.35], [0.32, 12.5], [0.05, 12.9]], cx, cz, 8);
      // gate on the street front
      const gz = 19.3; for (const s of [-1, 1]) bxP(B.p(GRAN), cx + s*2.4 - 0.4, cx + s*2.4 + 0.4, 0.3, 4.0, gz - 0.4, gz + 0.4);
      bxP(B.p(RED), cx - 2.0, cx + 2.0, 3.2, 4.0, gz - 0.25, gz + 0.25);
      const rg = roofP(B.p(TILE), cx, gz, 3.4, 1.3, 3.4, 0, 3.9, 1.3, {gab:0.001, gcol:B.p(WHITE), sag:0.3, pw:1.4, fas:0.15, fo:B.p(GT)}); ridge(cx, gz, 3.4, rg + 0.12, 0.3, 0, false);
      for (const [x, z] of [[24.5, 6], [31.5, 8], [26, 13], [31, 15], [31.5, -9], [24.8, -10]]){ segP(B.p(TRUNK), [x, 0.3, z], [x, 3.2, z], 0.22, 5); LSph(g, 2.3 + Rn()*0.5, x, 4.6, z, LEAF, 0.85, 8); }
    }
    // ---- south: garden forecourt and the two-storey hall behind it ----
    { const x0 = -38.5, x1 = -16.6, z0 = -3.6, z1 = 7.5, cx = (x0 + x1)/2, cz = (z0 + z1)/2;
      bxP(B.p(WHITE), x0, x1, 0.3, 8.4, z0, z1); bxP(B.p(GRAN), x0 - 0.05, x1 + 0.05, 0.3, 1.4, z0 - 0.05, z1 + 0.05);
      const F = fZ(z1, 1, 0); for (let k = 0; k < 6; k++){ const u = x0 + 1.8 + k*3.65; lattice(F, u - 1.0, u + 1.0, 1.8, 3.6); lattice(F, u - 1.0, u + 1.0, 5.4, 7.4); }
      bxP(B.p(GT), x0 - 0.6, x1 + 0.6, 4.3, 4.55, z0 - 0.6, z1 + 0.6);
      const r = roofP(B.p(TILE), cx, cz, (x1 - x0)/2 + 0.8, (z1 - z0)/2 + 0.9, (x1 - x0)/2 - 4.0, 0, 8.3, 3.2, {lift:0.5, sag:0.35, fas:0.3, fo:B.p(GT), hips:B.p(GT), pw:1.5});
      ridge(cx, cz, (x1 - x0)/2 - 4.0, r + 0.15, 0.35, 0, true);
      for (const [x, z] of [[-35, 12], [-29, 16.5], [-23, 12], [-19.5, 17.5], [-34, 18.5]]){ segP(B.p(TRUNK), [x, 0.3, z], [x, 3.0, z], 0.22, 5); LSph(g, 2.2 + Rn()*0.5, x, 4.4, z, LEAF, 0.85, 8); }
      bxP(B.p(GRAN), -31, -24, 0.3, 0.75, 10, 14);
    }
    // boundary walls along the street beside the temple, white with green-tiled copings
    for (const [xa, xb] of [[-38.5, -26.5], [-22.5, -16.3], [22.3, 25.6], [31.2, 32.7]]){ bxP(B.p(WHITE), xa, xb, 0.3, 2.2, 20.0, 20.5); bxP(B.p(GT), xa - 0.1, xb + 0.1, 2.2, 2.45, 19.85, 20.65); }
    for (const [za, zb] of [[-11.8, 19.9]]){ bxP(B.p(WHITE), 32.3, 32.8, 0.3, 2.2, za, zb); bxP(B.p(GT), 32.2, 32.9, 2.2, 2.45, za, zb); }
    B.flush(g); vFlush(g, V);
    return g;
  }};
SG_PLACES.push({type:'thianhockkeng', lat:1.281050, lon:103.847530, rot:1.0594});

// ================= People's Park Complex (1973, Design Partnership: William Lim, Tay Kheng Soon, Gan Eng Oon) =================
// Brutalist mixed-use megastructure, 103 m / 31 storeys: a shopping podium clad in ribbed precast panels (with the
// interlocking-atrium "city room" lit from the roof) carries a 96 x 14 m residential slab: void deck, 25 storeys of flats
// with balconies on one face and the corridor "streets in the air" every third floor on the other, service cores at the
// ends and the tall roof structures. The slab stands perpendicular to Eu Tong Sen Street.
// Paint: the slab and podium were green and yellow with maroon accents from 2009 (orange and green before); in 2025 the
// complex was repainted red and white. PPC_SCHEME picks the palette: 'current' (2025 red and white, default) or 'classic'.
// Local frame: +x = SE along the slab (towards Eu Tong Sen Street), +z = SW (Park Crescent). Night: lit flats and shops.
const PPC_SCHEME = 'current';
LANDMARKS.peoplespark = {zh:'珍珠坊', en:"People's Park Complex", cat:'new', r:90, h:103,
  lt:{m:1, c:'#fff0d8', k:0.55},
  build(){
    const g = new THREE.Group(), B = mkB(), Rn = LMCTX.rng;
    const SC = PPC_SCHEME === 'classic' ? {body:'#a3c046', band:'#efc232', core:'#8a2f2b', pod:'#a3c046', pod2:'#efc232', rib:'#8a2f2b'}
                                        : {body:'#f0ede5', band:'#c8342c', core:'#bd302a', pod:'#ece8df', pod2:'#c8342c', rib:'#f6f3ec'};
    const BODY = {c:SC.body, m:1, fh:3.0, cw:2.5, lk:0.35}, BAND = {c:SC.band, m:0, lk:0.35}, CORE = {c:SC.core, m:0, lk:0.4}, POD = {c:SC.pod, m:0, lk:0.45},
      POD2 = {c:SC.pod2, m:0, lk:0.45}, RIB = {c:SC.rib, m:0, lk:0.45}, GLASS = {c:'#3b4148', glow:'#ffd9a0', gk:0.75}, DARK = '#3a3d40', ROOF = '#9d9a92', SKY = {c:'#9fb4c0', glow:'#fff0cc', gk:0.6}, CONC = '#b8b4aa', GRN = '#6f8f55';
    const RING = [[-31.8,60.7],[-32.2,31.9],[-55.0,32.2],[-54.9,22.1],[-63.3,22.1],[-71.3,13.2],[-71.7,5.1],[-32.7,4.6],[-31.9,-63.4],[40.6,-63.4],[41.6,60.7]];
    const PT = 16.4;   // podium roof
    // ---- podium ----
    wallP(B.p(CONC), RING, -5, 0.4);
    const IN = offP(RING, 1.2);
    wallP(B.p(GLASS), IN, 0.4, 4.6);                                     // shopfronts, set back under the canopy
    capP(B.p(CONC), RING, 0.4);
    wallP(B.p(POD), RING, 4.6, PT); capP(B.p(ROOF), RING, PT);
    { const o = B.p(CONC); for (const e of edgesF(RING)) quadP(o, e.F(0, 4.6, 0), e.F(e.L, 4.6, 0), e.F(e.L, 4.6, -1.25), e.F(0, 4.6, -1.25)); }   // canopy soffit
    // ribbed precast panels: vertical ribs in three bands, floor bands between them
    for (const e of edgesF(RING)){
      if (e.L < 3) continue;
      for (const [y0, y1] of [[5.2, 8.0], [8.9, 11.9], [12.8, 15.6]]){ const n = Math.round(e.L/1.15); for (let k = 0; k < n; k++){ const u = e.L*(k + 0.5)/n; slabP(B.p(RIB), rectO(u - 0.22, u + 0.22, y0, y1), e.F, 0, 0.35); } }
      for (const y of [4.6, 8.0, 11.9, 15.6]) slabP(B.p(POD2), rectO(0, e.L, y, y + 0.9), e.F, 0, 0.42);
      slabP(B.p(POD), rectO(0, e.L, PT - 0.1, PT + 1.0), e.F, -0.1, 0.25);
    }
    // the "city room": two interlocking atria lit by roof lights; roof gardens and plant
    for (const [cx, cz, a, b] of [[-6, -12, 13, 11], [10, 4, 11, 13]]){ bxP(B.p(CONC), cx - a/2 - 0.6, cx + a/2 + 0.6, PT, PT + 1.0, cz - b/2 - 0.6, cz + b/2 + 0.6); roofP(B.p(SKY), cx, cz, a/2, b/2, 0.4, 0.4, PT + 1.0, 3.2, {pw:1, nt:1, n:1}); }
    for (const [x0, x1, z0, z1] of [[-26, -8, -56, -36], [8, 34, -56, -34], [-26, -8, 40, 56], [10, 34, 40, 56]]) bxP(B.p(GRN), x0, x1, PT, PT + 0.5, z0, z1);
    for (const [x, z, w, d, h] of [[28, -20, 8, 6, 3.0], [-24, -24, 6, 6, 2.6], [30, 46, 7, 5, 2.4]]) boxP(B.p(CONC), w, h, d, x, PT, z);
    // ---- the slab ----
    const X0 = -55.0, X1 = 41.3, Z0 = 18.3, Z1 = 32.2, S0 = PT + 1.0, VD = S0 + 3.4, FH = 3.0, NF = 25, TOP = VD + NF*FH;   // TOP ~ 96.8
    // void deck: recessed core and columns
    bxP(B.p(DARK), X0 + 2, X1 - 2, PT, VD, Z0 + 2.5, Z1 - 2.5);
    for (let x = X0 + 1.2; x <= X1 - 1.0; x += 6.0) for (const z of [Z0 + 0.8, Z1 - 0.8]) bxP(B.p(CONC), x - 0.6, x + 0.6, PT, VD, z - 0.6, z + 0.6);
    bxP(B.p(BAND), X0, X1, VD - 0.6, VD, Z0, Z1);
    bxP(B.p(BODY), X0 + 0.4, X1 - 0.4, VD, TOP, Z0 + 0.9, Z1 - 0.9);
    // SW face (+z): balconies on every floor; NE face (-z): access corridors every third floor (streets in the air)
    for (let f = 0; f < NF; f++){
      const y = VD + f*FH;
      bxP(B.p(BAND), X0 + 1.2, X1 - 1.2, y, y + 0.28, Z1 - 0.9, Z1 + 0.5);
      bxP(B.p(BODY), X0 + 1.2, X1 - 1.2, y + 0.28, y + 1.25, Z1 + 0.35, Z1 + 0.5);
      shapeP(B.p(GLASS), rectO(X0 + 1.2, X1 - 1.2, y + 1.3, y + 2.75), fZ(Z1 - 0.9, 1, 0), 0.02);
      if (f % 3 === 1){ bxP(B.p(BAND), X0 + 1.0, X1 - 1.0, y, y + 0.3, Z0 - 0.6, Z0 + 0.9); bxP(B.p(BAND), X0 + 1.0, X1 - 1.0, y + 0.3, y + 1.2, Z0 - 0.6, Z0 - 0.45); shapeP(B.p(DARK), rectO(-(X1 - 1.0), -(X0 + 1.0), y + 0.3, y + FH), fZ(Z0 + 0.9, -1, 0), 0.02); }
      else shapeP(B.p(GLASS), rectO(-(X1 - 1.2), -(X0 + 1.2), y + 0.9, y + 2.2), fZ(Z0 + 0.9, -1, 0), 0.03);
    }
    // party walls / fins every two bays on both long faces
    for (let x = X0 + 1.2; x <= X1 - 1.0; x += 6.0){ bxP(B.p(BODY), x - 0.25, x + 0.25, VD, TOP, Z1 - 0.9, Z1 + 0.7); bxP(B.p(BODY), x - 0.2, x + 0.2, VD, TOP, Z0 - 0.4, Z0 + 0.9); }
    // service cores at both ends and the roof structures ("vertical elements")
    for (const [x0, x1] of [[X0 - 2.2, X0 + 3.0], [X1 - 3.0, X1 + 2.0]]){ bxP(B.p(CORE), x0, x1, PT, TOP + 4.5, Z0 + 3.0, Z1 - 3.0); for (let y = VD + 2; y < TOP; y += 6) shapeP(B.p(DARK), rectO(-0.5, 0.5, y, y + 1.2), fX(x0 < 0 ? x0 : x1, x0 < 0 ? -1 : 1, (Z0 + Z1)/2), 0.03); }
    bxP(B.p(BAND), X0 + 0.2, X1 - 0.2, TOP, TOP + 1.2, Z0 + 0.6, Z1 - 0.6);
    bxP(B.p(CONC), X0 + 1, X1 - 1, TOP + 1.2, TOP + 1.4, Z0 + 1, Z1 - 1);
    for (const [x, w, h] of [[-38, 7, 5.6], [-12, 9, 4.2], [12, 7, 5.6], [27, 6, 3.6]]) bxP(B.p(BODY), x - w/2, x + w/2, TOP + 1.4, TOP + 1.4 + h, Z0 + 2.5, Z1 - 2.5);
    // the big sign frames on top of the long faces (left blank: no lettering)
    for (const z of [Z0 - 0.2, Z1 + 0.2]) bxP(B.p(CORE), -30, 20, TOP + 1.4, TOP + 5.6, z - 0.2, z + 0.2);
    B.flush(g);
    return g;
  }};
SG_PLACES.push({type:'peoplespark', lat:1.284120, lon:103.842550, rot:-0.6842});

// ================= ION Orchard (2009, Benoy with RSP) and The Orchard Residences =================
// The mall is wrapped in a smooth, bulging glass-and-metal skin (horizontal metal bands, recessed glazed shopfronts,
// the curved media wall over the Orchard Road plaza) on the real curving footprint; the glass "seed pod" canopy with its
// steel ribs and tree columns over the main entrance and the Orchard MRT pavilion; the car-park block behind with the
// level-9 garden; the 56-storey residential tower (218 m, ION Sky on levels 55-56) on the real wavy plan, banded floors,
// tapering curved crown. No signage. Local frame: +z = NNE (Orchard Road front), +x = WNW (towards Paterson Road).
// Night: the skin and media wall glow, shopfronts lit, lit flats, lit crown.
LANDMARKS.ionorchard = {zh:'ION 乌节', en:'ION Orchard', cat:'new', r:96, h:218,
  lt:{m:1, c:'#dce8ff', k:0.6},
  build(){
    const g = new THREE.Group(), B = mkB();
    const GLASS = {c:'#8fa6b4', glow:'#cfe2ff', gk:0.42, m:0, lk:0.25}, SHOP = {c:'#3a4048', glow:'#ffe2b0', gk:0.85, m:0, lk:0.2}, METAL = {c:'#d2cfc6', m:0, lk:0.55}, DARKM = '#5d6266',
      MEDIA = {c:'#4a5872', glow:'#d9d0ff', gk:1.0, m:0, lk:0.1}, CANG = {c:'#c4d6de', op:0.5, glow:'#eef6ff', gk:0.3, m:0, lk:0.3}, STEEL = {c:'#e4e2dc', m:0, lk:0.7},
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
    { let y = 5.8; let k = 0; while (y < 33.9){ const y2 = Math.min(34.2, y + (k % 2 ? 1.45 : 0.45)); loft(B.p(y >= 31.0 ? METAL : (k % 2 ? GLASS : METAL)), ring(prof(y), y), ring(prof(y2), y2)); y = y2; k++; } }
    capP(B.p(ROOF), offP(M, 3.6), 34.2);
    // the media wall: a curved screen proud of the skin over the plaza and the Orchard Road corner
    { const idx = []; for (let i = 0; i < M.length; i++){ const p = M[i]; if (p[1] > 40 && p[0] > -36 && p[0] < -6) idx.push(i); }
      const A = idx.map(i => i); for (let s = 0; s < 5; s++){ const y0 = 11 + s*2.8, y1 = y0 + 2.8, o = B.p(MEDIA); const R0 = offP(M, -(prof(y0) + 0.35)), R1 = offP(M, -(prof(y1) + 0.35));
        for (let k = 0; k < A.length - 1; k++){ const i = A[k], j = A[k+1]; if (j !== i + 1) continue; quadP(o, [R0[i][0], y0, R0[i][1]], [R0[j][0], y0, R0[j][1]], [R1[j][0], y1, R1[j][1]], [R1[i][0], y1, R1[i][1]]); } } }
    // ---- the car-park block behind, with the level-9 garden ----
    const RB = chaikin([[-42,-57.5],[-5.5,-51.5],[5,-48.8],[13,-51.3],[33,-50.6],[47.5,-45.8],[66,-44.5],[72,-41],[73,-31.5],[66.5,-4],[20,-4],[-42,-4]], 1);
    const RB2 = offP(RB, 3.0); wallP(B.p(DARKM), RB2, 33.0, 40.0); capP(B.p(GRN), RB2, 40.0);
    for (const e of edgesF(RB2)){ if (e.L < 1) continue; for (let y = 34.6; y < 39.6; y += 1.2) slabP(B.p(METAL), rectO(0, e.L, y, y + 0.35), e.F, 0, 0.4); }
    wallP(B.p(METAL), offP(RB2, 0.4), 40.0, 41.1);
    // ---- the glass "seed pod" canopy over the entrance and the MRT pavilion ----
    { const C = [[32.7,45.3],[44.2,57.1],[50.5,55.0],[54.1,51.6],[58.4,41.0],[60.5,38.5],[67.5,36.5],[70.4,34.3],[67.9,33.6],[63.9,33.8],[51.6,20.3],[45.9,17.4],[38.5,20.2],[36.0,24.4],[36.3,31.0],[38.2,36.7],[35.8,42.2]];
      const CP = chaikin(offP(C, -2.0), 2), c = ctr(CP), N = 7, H = (t, i) => 8.6 + 8.2*Math.sqrt(Math.max(0, 1 - t*t)) + 1.2*Math.sin(i/CP.length*TAU*3)*t;
      const pt = (i, t) => [c[0] + (CP[i % CP.length][0] - c[0])*t, H(t, i % CP.length), c[1] + (CP[i % CP.length][1] - c[1])*t];
      const og = B.p(CANG), os = B.p(STEEL);
      for (let i = 0; i < CP.length; i++) for (let k = 0; k < N; k++){ const t0 = k/N, t1 = (k + 1)/N; quadP(og, pt(i, t0), pt(i + 1, t0), pt(i + 1, t1), pt(i, t1)); }
      for (let i = 0; i < CP.length; i += 2) for (let k = 0; k < N; k++) segP(os, pt(i, k/N), pt(i, (k + 1)/N), 0.12, 4);
      for (const t of [0.45, 0.8, 1.0]) for (let i = 0; i < CP.length; i++) segP(os, pt(i, t), pt(i + 1, t), 0.1, 4);
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
// glazed main entrance at its back, the fountain facing Orchard Road, covered walkways along the street fronts.
// Heights: podium ~34 m, tower roofs ~108 m, crowns to ~132 m (27 floors). No store names. Local frame: +z = NNE
// (Orchard Road front), +x = WNW. Night: floodlit granite, glowing entrance and shopfronts, lit offices and crowns.
LANDMARKS.ngeeann = {zh:'义安城', en:'Ngee Ann City', cat:'new', r:140, h:133,
  lt:{m:1, c:'#ffe4c0', k:0.55},
  build(){
    const g = new THREE.Group(), B = mkB();
    const GR = {c:'#7c4b3f', m:0, lk:0.7}, GR2 = {c:'#6a3f35', m:0, lk:0.6}, TW = {c:'#7c4b3f', m:1, fh:3.9, cw:3.0, lk:0.35}, WS = {c:'#3a3436', m:1, fh:3.9, cw:3.0, lk:0.2},
      GLASS = {c:'#55666f', glow:'#ffe6bf', gk:0.8, m:0, lk:0.2}, SHOP = {c:'#3c4146', glow:'#ffdcae', gk:0.75, m:0, lk:0.2}, PAVE = '#bdb5a8', ROOF = '#8f8a83', WATER = {c:'#7fa6b8', glow:'#bfe0ff', gk:0.5, m:0, lk:0.3},
      CROWN = {c:'#8a5546', m:0, lk:1.0, lc:'#ffd9a8', glow:'#d08a52', gk:0.6}, STEEL = {c:'#cfccc4', m:0, lk:0.5}, CANOPY = {c:'#6b6560', m:0, lk:0.3};
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
