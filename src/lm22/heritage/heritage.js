// ===== lm22/heritage: Buddha Tooth Relic Temple, Sri Mariamman Temple, Thian Hock Keng, Masjid Sultan, Pinnacle@Duxton,
// National Museum of Singapore - wave-3 upgrades of the lm18 models (City Brush v24, real Singapore 1:1).
// Same keys, footprints and placements as lm18 (the SG_PLACES entries are re-pushed unchanged). Upgrades:
//  mariamman     - the gopuram rebuilt: five strongly tapering tiers crowded with painted deities (robe, arms, head, crown),
//                  central windows, red / blue cornices with miniature shrines, a proper sala crown with horseshoe gables and
//                  seven kalasams; guardian deities in the base niches; main vimana lowered under the gopuram.
//  buddhatooth   - the four Tathagata pavilions on the roof garden round the Ten Thousand Buddha pagoda, garden planting,
//                  lanterns on every hall, gilt eave lines glowing at night (lantern-red night look).
//  thianhockkeng - bolder Hokkien ridges: swallowtails curling high, porcelain-shard ridge panels and figures, two large
//                  porcelain dragons with the flaming pearl on the main hall; a row of lanterns on the front hall; brighter
//                  breathing floodlight at night.
//  sultanmosque  - the band of glass-bottle ends under both domes, lighter sand walls, lit entrance recess, breathing
//                  floodlight.
//  pinnacle      - the facades remade as the pixelated mosaic of prefabricated panels (bay windows, planter boxes, flat and
//                  recessed windows in seven sets), slot recesses, white corner piers and slab edges; the 26th / 50th storey
//                  sky gardens planted, with glass balustrades and continuous lit edge lines at night.
//  natmuseum     - a taller zinc dome with fish-scale courses and ribs on a lower drum, columned lantern; mullioned windows;
//                  the Glass Rotunda with a metal roof and a glowing mesh drum; warm breathing floodlight.
// One block; each group of models keeps its own helpers in an inner block. Only LANDMARKS and SG_PLACES are touched.
{
// ---------------- the Chinatown / Kampong Glam temples (helpers from lm18/d) ----------------
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
  lt:{m:0, c:'#ffdcae', k:1.0, e:0.45, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB();
    const WALL = '#eadbb6', TRIM = '#f7f0dc', BASE = '#c4b490', ROOF = '#b9b3a3', DARK = '#433d34', BAND = '#1b1a18',
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
      shapeP(B.p({c:'#4a4236', glow:'#ffc77e', gk:0.3}), ogArchO(3.3, 11.6).map(p => [p[0], p[1] + FL + 0.7]), F, 0.22);
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
      // the band of glass-bottle ends (donated by the poor of the community): rows of bottle bottoms in green, brown and clear glass
      for (let row = 0; row < 3; row++) for (let i = 0; i < 56; i++){ const a = (i + 0.5*(row % 2))/56*TAU, rr = 5.26, yb = D1 + 0.52 + row*0.32, k = (i*7 + row*3) % 5;
        boxP(B.p(k < 2 ? {c:'#47603f', lk:1.6} : k < 4 ? {c:'#6e5233', lk:1.6} : {c:'#b9c4bb', lk:1.6}), 0.2, 0.2, 0.08, cx + Math.cos(a)*rr, yb, cz + Math.sin(a)*rr, -a + HP); }
      LCyl(g, 5.1, 5.25, 0.2, cx, D1 + 1.5, cz, GOLD, 32);
      LLathe(g, ONION, cx, D1 + 1.7, cz, GOLD, 32);
      const T = D1 + 1.7 + 10.15;
      latheP(B.p(GOLD), [[0.22, T - 0.1], [0.3, T + 0.3], [0.08, T + 0.5], [0.26, T + 0.75], [0.07, T + 1.0], [0.05, T + 1.6]], cx, cz, 8);
      slabP(B.p(GOLD), CRES.map(p => [p[1], p[0] + T + 2.0]), fA(cx, cz, HP), -0.05, 0.05);
      // main-entrance porch (chhajja canopy) on the east, a smaller porch on the west
      const pd = s > 0 ? 1.6 : 0.9, zp = zo + s*pd;
      bxP(B.p(BASE), cx - 3.6, cx + 3.6, -0.4, 1.0, Math.min(zo, zp), Math.max(zo, zp));
      if (s > 0){   // the east entrance foyer on four Doric columns under a flat canopy with merlon cresting
        for (const x of [-3.0, -1.05, 1.05, 3.0]){ latheP(B.p(TRIM), [[0.42, 1.0], [0.42, 1.3], [0.3, 1.38], [0.27, 4.75], [0.38, 4.9], [0.42, 5.15]], cx + x, zp - 0.45, 10); boxP(B.p(TRIM), 0.9, 0.18, 0.9, cx + x, 1.0, zp - 0.45); }
        bxP(B.p(TRIM), cx - 3.7, cx + 3.7, 5.15, 5.7, zo, zp + 0.05);
        for (let k = 0; k < 11; k++) boxP(B.p(TRIM), 0.4, 0.38, 0.3, cx - 3.4 + k*0.68, 5.7, zp - 0.1);
      } else {
        bxP(B.p(TRIM), cx - 3.4, cx - 2.7, 1.0, 5.4, Math.min(zo, zp - s*0.7), Math.max(zo, zp - s*0.7));
        bxP(B.p(TRIM), cx + 2.7, cx + 3.4, 1.0, 5.4, Math.min(zo, zp - s*0.7), Math.max(zo, zp - s*0.7));
        quadP(B.p(TRIM), [cx - 3.9, 6.0, zo], [cx + 3.9, 6.0, zo], [cx + 3.9, 5.3, zp], [cx - 3.9, 5.3, zp]); }
      bxP(B.p(TRIM), cx - 3.9, cx + 3.9, 5.15, 5.35, Math.min(zp, zp - s*0.1), Math.max(zp, zp - s*0.1));
      { const lx = s > 0 ? 2.0 : 3.05; boxP(B.p(LAMP), 0.32, 0.5, 0.32, cx - lx, 4.3, zp - s*0.35); boxP(B.p(LAMP), 0.32, 0.5, 0.32, cx + lx, 4.3, zp - s*0.35); }
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
LANDMARKS.mariamman = {zh:'马里安曼兴都庙', en:'Sri Mariamman Temple', cat:'old', r:30, h:17.6,
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
    // ---- gopuram (1925): granite plinth, two-storey base with the great bell-studded doors, five tapering tiers crowded with
    // painted stucco deities on every face and ledge, cornices carrying miniature shrines, the barrel-vaulted crown (sala)
    // with horseshoe gable ends and seven gold kalasams. Figures are abstracted: robe, multiple arms, head, gold crown.
    const GX = -3.0, GZ0 = 16.7, GZ1 = 22.75, GW = 9.6, GZ = (GZ0 + GZ1)/2;
    const SKIN = ['#3a62c4', '#4f86d6', '#e2b08a', '#d39a6c', '#f0d2b4', '#3a62c4', '#59a8d8', '#e7a47e'];
    const ROBE = ['#d23b2c', '#e9c33b', '#3e9b4b', '#e690a2', '#e8873b', '#9a5cc6', '#2f8f8a', '#d23b2c', '#f3efe5', '#5bb9e1', '#c8462f', '#e9c33b'];
    const pk = A => A[Math.floor(R()*A.length)];
    // a standing deity on facade frame F at u, from v, standing w0 proud of the wall, h tall
    const deity = (F, u, v, w0, h, big) => {
      const rb = pk(ROBE), sk = pk(SKIN), aw = big ? 0.36 : 0.3;
      vAdd(V, rb, t => { slabP(t, rectO(u - 0.17*h, u + 0.17*h, v, v + 0.6*h), F, w0, w0 + 0.2*h); slabP(t, [[u - 0.22*h, v], [u + 0.22*h, v], [u + 0.15*h, v + 0.25*h], [u - 0.15*h, v + 0.25*h]], F, w0 + 0.02, w0 + 0.24*h); });
      vAdd(V, sk, t => { slabP(t, rectO(u - aw*h, u + aw*h, v + 0.42*h, v + 0.53*h), F, w0 + 0.03*h, w0 + 0.15*h); slabP(t, rectO(u - 0.085*h, u + 0.085*h, v + 0.6*h, v + 0.78*h), F, w0 + 0.03*h, w0 + 0.17*h);
        if (big) slabP(t, rectO(u - (aw - 0.05)*h, u + (aw - 0.05)*h, v + 0.3*h, v + 0.38*h), F, w0 + 0.05*h, w0 + 0.15*h); });
      vAdd(V, '#e6be3c', t => slabP(t, [[u - 0.09*h, v + 0.78*h], [u + 0.09*h, v + 0.78*h], [u + 0.05*h, v + 0.92*h], [u, v + 1.0*h], [u - 0.05*h, v + 0.92*h]], F, w0 + 0.03*h, w0 + 0.16*h));
    };
    // base: granite plinth, cream walls with gilt pilasters, the doorway, niches with guardian deities
    bxP(B.p(STONE), GX - GW/2 - 0.25, GX + GW/2 + 0.25, 0.4, 1.4, GZ0 - 0.25, GZ1 + 0.25);
    bxP(B.p(WALL), GX - GW/2, GX + GW/2, 1.4, 5.7, GZ0, GZ1);
    for (const s of [1, -1]){
      const F = fZ(s > 0 ? GZ1 : GZ0, s, GX);
      shapeP(B.p(DARK), rectO(-1.55, 1.55, 1.4, 5.0), F, 0.03);
      shapeP(B.p(DOOR), rectO(-1.4, -0.04, 1.4, 4.6), F, 0.06); shapeP(B.p(DOOR), rectO(0.04, 1.4, 1.4, 4.6), F, 0.06);
      for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) for (const sx of [-1, 1]) boxP(B.p(GOLD), 0.09, 0.09, 0.09, GX + s*sx*(0.35 + j*0.27), 1.9 + i*0.45, (s > 0 ? GZ1 : GZ0) + s*0.1);
      vAdd(V, '#e6be3c', t => slabP(t, [[-1.85, 4.9], [1.85, 4.9], [1.85, 5.25], [0.9, 5.25], [0, 5.6], [-0.9, 5.25], [-1.85, 5.25]], F, 0, 0.12));
      for (const u of [-3.6, -2.4, 2.4, 3.6]){ vAdd(V, '#e6be3c', t => slabP(t, rectO(u - 0.5, u + 0.5, 1.9, 4.75), F, 0, 0.1)); shapeP(B.p(DARK), rectO(u - 0.4, u + 0.4, 2.05, 4.5), F, 0.12); deity(F, u, 2.1, 0.1, 2.1, true); }
      for (const u of [-4.6, -1.85, 1.85, 4.6]) vAdd(V, '#e6be3c', t => slabP(t, rectO(u - 0.15, u + 0.15, 1.4, 5.7), F, 0, 0.14));
      boxP(B.p(LAMP), 0.3, 0.45, 0.3, GX - s*1.9, 4.6, (s > 0 ? GZ1 : GZ0) + s*0.35);
      boxP(B.p(LAMP), 0.3, 0.45, 0.3, GX + s*1.9, 4.6, (s > 0 ? GZ1 : GZ0) + s*0.35);
    }
    for (const s of [1, -1]){ const F = fX(GX + s*GW/2, s, GZ); for (const u of [-1.6, 1.6]){ shapeP(B.p(DARK), rectO(u - 0.4, u + 0.4, 2.05, 4.5), F, 0.04); deity(F, u, 2.1, 0.05, 2.1, true); } }
    vAdd(V, '#c8462f', t => frustP(t, GX, GZ, GW + 0.5, GZ1 - GZ0 + 0.5, GW + 0.8, GZ1 - GZ0 + 0.8, 5.7, 0.3));
    vAdd(V, '#e6be3c', t => frustP(t, GX, GZ, GW + 0.8, GZ1 - GZ0 + 0.8, GW + 0.5, GZ1 - GZ0 + 0.5, 6.0, 0.25));
    let y = 6.25;
    const mini = (x, z, a, big) => {   // a miniature shrine on a cornice: kuta (square, domed) or sala (barrel-roofed)
      const col = pick();
      vAdd(V, col, t => {
        if (big){ boxP(t, 0.7, 0.32, 0.36, x, y, z, -a); const c = Math.cos(a), s = Math.sin(a), P = []; for (let i = 0; i <= 6; i++){ const q = PI*i/6; P.push([Math.cos(q)*0.2, Math.sin(q)*0.24]); }
          for (let i = 0; i < 6; i++){ const p = P[i], q = P[i+1]; quadP(t, [x - c*0.35 - s*p[0], y + 0.32 + p[1], z - s*0.35 + c*p[0]], [x + c*0.35 - s*p[0], y + 0.32 + p[1], z + s*0.35 + c*p[0]], [x + c*0.35 - s*q[0], y + 0.32 + q[1], z + s*0.35 + c*q[0]], [x - c*0.35 - s*q[0], y + 0.32 + q[1], z - s*0.35 + c*q[0]]); } }
        else { boxP(t, 0.36, 0.3, 0.36, x, y, z, -a); latheP(t, [[0.22, y + 0.3], [0.24, y + 0.4], [0.15, y + 0.56], [0.03, y + 0.68]], x, z, 6); }
      });
    };
    // the five tiers: each a tapering storey of pale walls with a central window, pilasters and a crowd of deities on the faces
    // and at the corners, closed by a red / blue cornice and a parapet of miniature shrines
    const NT = 5;
    for (let i = 0; i < NT; i++){
      const f = i/(NT - 1), W = lerp(8.9, 4.9, f), D = lerp(5.3, 3.0, f), hb = lerp(1.45, 1.12, f), Wt = W - 0.34, Dt = D - 0.22, fh = hb*0.78;
      vAdd(V, i % 2 ? '#f1e3c6' : '#f4dcc0', t => frustP(t, GX, GZ, W, D, Wt, Dt, y, hb));
      for (const [F, len, fr] of [[fZ(GZ + D/2, 1, GX), W, 1], [fZ(GZ - D/2, -1, GX), W, 1], [fX(GX + W/2, 1, GZ), D, 0], [fX(GX - W/2, -1, GZ), D, 0]]){
        const n = Math.max(2, Math.round((len - 0.4)/0.62));
        for (let j = 0; j < n; j++){ const u = -len/2 + 0.2 + (j + 0.5)*(len - 0.4)/n; if (fr && Math.abs(u) < 0.62) continue; deity(F, u, y + 0.08, 0.02, fh*(0.88 + 0.12*R()), j === 0 || j === n - 1); }
        for (const u of [-len/2 + 0.1, len/2 - 0.1]) vAdd(V, '#e6be3c', t => slabP(t, rectO(u - 0.1, u + 0.1, y, y + hb), F, 0, 0.1));
        if (fr){ shapeP(B.p(DARK), mv(rArchO(0.36, 1.05*hb/1.6), 0, y + 0.12), F, 0.06); vAdd(V, '#e6be3c', t => slabP(t, mv(rArchO(0.55, 1.25*hb/1.6), 0, y + 0.05), F, 0, 0.05)); }
      }
      vAdd(V, i % 2 ? '#c8462f' : '#2f6fbf', t => frustP(t, GX, GZ, Wt + 0.55, Dt + 0.55, Wt + 0.75, Dt + 0.75, y + hb, 0.22));
      vAdd(V, '#e6be3c', t => frustP(t, GX, GZ, Wt + 0.75, Dt + 0.75, Wt + 0.6, Dt + 0.6, y + hb + 0.22, 0.08));
      y += hb + 0.3;
      const Wp = Wt + 0.45, Dp = Dt + 0.45;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) mini(GX + sx*(Wp/2 - 0.2), GZ + sz*(Dp/2 - 0.2), 0, false);
      for (const sz of [-1, 1]){ const n = Math.max(1, Math.round((Wp - 0.8)/0.9)); for (let j = 0; j < n; j++){ const u = -Wp/2 + 0.4 + (j + 0.5)*(Wp - 0.8)/n; mini(GX + u, GZ + sz*(Dp/2 - 0.2), 0, j % 2 === 0); } }
      for (const sx of [-1, 1]){ const n = Math.max(1, Math.round((Dp - 0.8)/0.9)); for (let j = 0; j < n; j++){ const u = -Dp/2 + 0.4 + (j + 0.5)*(Dp - 0.8)/n; mini(GX + sx*(Wp/2 - 0.2), GZ + u, HP, j % 2 === 0); } }
      y += 0.12;
    }
    // crowning sala: a barrel vault along the front, horseshoe gable ends with a kirtimukha face, seven gold kalasams
    { const W = 4.3, D = 2.5, VL = W + 0.3, VR = 1.05;
      vAdd(V, '#f1e3c6', t => frustP(t, GX, GZ, W, D, W - 0.1, D - 0.1, y, 0.45));
      for (const [F, len] of [[fZ(GZ + D/2, 1, GX), W], [fZ(GZ - D/2, -1, GX), W]]) for (let j = 0; j < 6; j++){ const u = -len/2 + 0.35 + (j + 0.5)*(len - 0.7)/6; deity(F, u, y + 0.02, 0.02, 0.42, false); }
      vAdd(V, '#c8462f', t => frustP(t, GX, GZ, W + 0.2, D + 0.2, W + 0.3, D + 0.3, y + 0.45, 0.15));
      const yv = y + 0.6, AR = [];
      for (let i = 0; i <= 12; i++){ const q = PI*i/12; AR.push([Math.cos(q)*VR, Math.sin(q)*VR*1.25]); }
      vAdd(V, '#e3b43c', t => { for (let i = 0; i < 12; i++){ const p = AR[i], q = AR[i+1]; quadP(t, [GX - VL/2, yv + p[1], GZ + p[0]], [GX + VL/2, yv + p[1], GZ + p[0]], [GX + VL/2, yv + q[1], GZ + q[0]], [GX - VL/2, yv + q[1], GZ + q[0]]); } });
      for (let j = 0; j < 5; j++){ const x = GX - VL/2 + 0.6 + j*(VL - 1.2)/4; vAdd(V, j % 2 ? '#2f6fbf' : '#d23b2c', t => { for (let i = 0; i < 12; i++){ const p = AR[i], q = AR[i+1]; quadP(t, [x - 0.12, yv + p[1]*1.02, GZ + p[0]*1.02], [x + 0.12, yv + p[1]*1.02, GZ + p[0]*1.02], [x + 0.12, yv + q[1]*1.02, GZ + q[0]*1.02], [x - 0.12, yv + q[1]*1.02, GZ + q[0]*1.02]); } }); }
      for (const sx of [-1, 1]){ const P = AR.map(p => [p[0]*1.45, p[1]*1.4]); const Fx = fX(GX + sx*VL/2, sx, GZ);
        vAdd(V, '#d0462e', t => slabP(t, P.map(p => [p[0], p[1] + yv - 0.05]), Fx, -0.05, 0.12));
        vAdd(V, '#e3b43c', t => slabP(t, P.map(p => [p[0]*0.75, p[1]*0.75 + yv]), Fx, 0.12, 0.2));
        vAdd(V, '#3e9b4b', t => slabP(t, [[-0.3, yv + 0.25], [0.3, yv + 0.25], [0.35, yv + 0.75], [0, yv + 1.0], [-0.35, yv + 0.75]], Fx, 0.2, 0.3)); }
      for (let j = 0; j < 7; j++){ const x = GX - VL/2 + 0.35 + j*(VL - 0.7)/6, y0 = yv + VR*1.25 - 0.06;
        latheP(B.p(GOLD), [[0.13, y0], [0.24, y0 + 0.12], [0.28, y0 + 0.3], [0.18, y0 + 0.48], [0.07, y0 + 0.56], [0.13, y0 + 0.66], [0.02, y0 + 1.0]], x, GZ, 8); }
      y = 6.6;
    }
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
    vimana(GX, -5.6, 7.2, 8.0, 6.6, 2, 0, true);     // Mariamman's sanctum
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
  lt:{m:0, c:'#ffb27a', k:1.0, e:0.45},
  build(){
    const g = new THREE.Group(), B = mkB();
    const GRAN = '#a7a196', RED = '#a8291f', GOLDP = {c:'#c79a3e', glow:'#ffae48', gk:0.85}, TILE = '#46413c', WHITE = '#ebe7dd', BEAM = '#3f6d5f',
      WIN = {c:'#b98a3c', glow:'#ffb862', gk:0.7}, GOLD = {c:'#d8a73e', lc:'#ffd27e', lk:1.3}, LANT = {c:'#d8382a', glow:'#ff4a22', gk:2.4}, DOOR = '#86201a', BRONZE = '#5a4a37';
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
      // Tang-style hip-and-gable (xieshan) top roof: hipped below, a red gable with gilt trim above, long main ridge
      const ridgeK = Math.max(0.5, a - 0.35*w), y0 = yc + 1.4;
      roofP(B.p(TILE), cx, cz, a + 1.7, w + 1.7, ridgeK, 0, y0, top - y0, {gab:0.5, gcol:B.p(RED), lift:0.75, fas:0.45, fo:B.p(GOLDP), pw:1.6, nt:6, hips:B.p(TILE), ridge:B.p(TILE), rr:0.38});
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
    // ---- the four Tathagata pavilions round the central pagoda on the roof garden (by direction: N, S, E, W), small
    // square pavilions of red columns and gilt lattice under pyramidal tiled roofs with gold finials; garden planting
    { const y0 = S3 + 0.02;
      for (const [cx, cz] of [[-7.6, -10.6], [5.3, -10.6], [-7.6, 11.4], [5.3, 11.4]]){
        const a = 1.55;
        bxP(B.p(WHITE), cx - a - 0.35, cx + a + 0.35, y0, y0 + 0.45, cz - a - 0.35, cz + a + 0.35);
        const P = rectXZ(cx - a, cx + a, cz - a, cz + a);
        for (const [x, z] of P) boxP(B.p(RED), 0.32, 2.7, 0.32, x, y0 + 0.45, z);
        for (const e of edgesF(P)){ shapeP(B.p(WIN), rectO(0.25, e.L - 0.25, y0 + 1.3, y0 + 2.9), e.F, -0.02); shapeP(B.p(BEAM), rectO(-0.1, e.L + 0.1, y0 + 2.85, y0 + 3.15), e.F, 0.0); }
        roofP(B.p(TILE), cx, cz, a + 1.0, a + 1.0, 0.18, 0.18, y0 + 3.1, 2.3, {lift:0.45, fas:0.22, fo:B.p(GOLDP), pw:1.5, nt:5, hips:B.p(TILE)});
        latheP(B.p(GOLD), [[0.22, y0 + 5.35], [0.3, y0 + 5.55], [0.15, y0 + 5.85], [0.04, y0 + 6.2]], cx, cz, 8);
        latheP(B.p(LANT), [[0.04, y0 + 2.15], [0.22, y0 + 2.25], [0.27, y0 + 2.45], [0.22, y0 + 2.65], [0.04, y0 + 2.75]], cx, cz + a + 0.45, 8);
      }
      for (const [x, z] of [[-8.6, -3.5], [-8.6, 3.0], [6.6, -3.5], [6.6, 3.0], [-0.8, -9.8], [-0.8, 9.8]]){ latheP(B.p('#5b7f4c'), [[0.01, y0 + 0.3], [1.0, y0 + 0.7], [0.9, y0 + 1.4], [0.01, y0 + 1.7]], x, z, 7); }
    }
    // lanterns under the eaves of the connecting hall too (the night look is lantern red)
    lanterns(BL[1], S1 - 0.35, 3.4); lanterns(BL[1], S2 - 0.3, 3.4); lanterns(BL[2], S2 - 0.3, 3.4);
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
LANDMARKS.thianhockkeng = {zh:'天福宫', en:'Thian Hock Keng Temple', cat:'old', r:46, h:14.5,
  lt:{m:0, c:'#ffcf98', k:1.45, e:0.65, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), V = mkV(), Rn = LMCTX.rng;
    const GRAN = '#a29c91', RED = '#8e2c21', TILE = '#8f4c36', GT = '#3f7b54', WHITE = '#e7e1d4', PAVE = '#c6bfb2', DARK = '#3a302a',
      GOLD = {c:'#d6a640', lc:'#ffd27e', lk:1.3}, WIN = {c:'#7d3524', glow:'#ffb35c', gk:0.6}, LANT = {c:'#d8382a', glow:'#ff4a22', gk:2.4}, LEAF = '#5a7c4b', TRUNK = '#6b5440';
    const PAL = ['#3f7b54', '#d23b2c', '#e9c33b', '#3d6fd0', '#f3efe5', '#e690a2', '#2f8f8a', '#e8873b'];
    const RING = [[24.5,-12.1],[32.7,-12.0],[33.0,20.0],[-38.6,21.3],[-39.0,-1.6],[-17.9,-4.2],[-18.2,-26.6],[24.2,-27.1]];
    wallP(B.p(GRAN), RING, -5, 0.3); capP(B.p(PAVE), RING, 0.3);
    const AX = 3.0, FY = 0.75;
    bxP(B.p(GRAN), -16.2, 22.2, 0.3, FY, -26.8, 16.6);
    bxP(B.p(GRAN), AX - 4.5, AX + 4.5, 0.3, FY - 0.25, 16.6, 18.2);
    // decorated Hokkien ridge: curved (sagging) roll with swallowtail ends splitting upwards, ceramic-shard figures
    const ridge = (cx, cz, a, yr, sag, ry, figs) => {
      const c = Math.cos(ry || 0), s = Math.sin(ry || 0), Rr = (x, y, z) => [cx + x*c + z*s, y, cz - x*s + z*c], yc = x => yr + sag*Math.pow(Math.min(1, Math.abs(x)/a), 2);
      const N = 10; for (let i = 0; i < N; i++){ const x0 = -a + 2*a*i/N, x1 = -a + 2*a*(i + 1)/N; segP(B.p(GT), Rr(x0, yc(x0), 0), Rr(x1, yc(x1), 0), 0.32, 4); const pm = Rr((x0 + x1)/2, 0, 0); boxP(B.p(TILE), 2*a/N, 0.62, 0.46, pm[0], yc((x0 + x1)/2) - 0.62, pm[2], ry || 0); }
      // swallowtail ends: the ridge sweeps out and splits into two tails curling high up
      const T = [[a*0.9, 0], [a + 0.4, 0.15], [a + 0.95, 0.6], [a + 1.35, 1.3], [a + 1.55, 2.0], [a + 1.6, 2.45]];
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let k = 0; k < T.length - 1; k++){ const p0 = T[k], p1 = T[k+1];
        segP(B.p(GT), Rr(sx*p0[0], yc(a) + p0[1], sz*0.1*k), Rr(sx*p1[0], yc(a) + p1[1], sz*0.1*(k + 1)), 0.27 - k*0.035, 4); }
      // the ridge's face panel (cut-and-paste porcelain: flowers and scrolls) and the porcelain-shard figures standing on it
      { const n = Math.max(2, Math.round(2*a/1.4)); for (let i = 0; i < n; i++){ const x0 = -a*0.85 + 1.7*a*i/n, x1 = -a*0.85 + 1.7*a*(i + 0.9)/n, pa = Rr(x0, 0, 0.27), pb = Rr(x1, 0, 0.27), pc = Rr(x0, 0, -0.27), pd = Rr(x1, 0, -0.27), y0 = yc((x0 + x1)/2) - 0.5, col = PAL[(i*3 + 1) % PAL.length];
        vAdd(V, col, t => { quadP(t, [pa[0], y0, pa[2]], [pb[0], y0, pb[2]], [pb[0], y0 + 0.4, pb[2]], [pa[0], y0 + 0.4, pa[2]]); quadP(t, [pd[0], y0, pd[2]], [pc[0], y0, pc[2]], [pc[0], y0 + 0.4, pc[2]], [pd[0], y0 + 0.4, pd[2]]); }); } }
      if (figs) for (let i = 1; i < 2*a/0.8 - 1; i++){ const x = -a + i*0.8; if (Math.abs(x) < 1.0) continue; const p = Rr(x, yc(x) + 0.3, 0), hh = 0.6 + Rn()*0.4, c1 = PAL[Math.floor(Rn()*PAL.length)], c2 = PAL[Math.floor(Rn()*PAL.length)];
        vAdd(V, c1, t => { boxP(t, 0.4, hh*0.62, 0.3, p[0], p[1], p[2], ry || 0); boxP(t, 0.62, 0.12, 0.24, p[0], p[1] + hh*0.45, p[2], ry || 0); });
        vAdd(V, c2, t => { boxP(t, 0.2, hh*0.22, 0.2, p[0], p[1] + hh*0.62, p[2], ry || 0); boxP(t, 0.26, 0.08, 0.26, p[0], p[1] + hh*0.84, p[2], ry || 0); }); }
    };
    // two dragons of glazed porcelain shards chasing the flaming pearl: sinuous green bodies with yellow / blue scale crests,
    // red manes, raised heads facing the pearl on its gold flame stand
    const dragons = (cx, cz, a, yr, sag) => {
      const yc = x => yr + sag*Math.pow(Math.min(1, Math.abs(x)/a), 2);
      for (const sx of [-1, 1]){ let prev = null; const N = 22;
        for (let i = 0; i <= N; i++){ const t = i/N, x = sx*(1.0 + t*a*0.82), y = yc(x) + 0.55 + 0.42*Math.sin(t*TAU*1.6 + 0.6) + 0.35*(1 - t)*(1 - t), z = 0.18*Math.sin(t*TAU*1.6), p = [cx + x, y, cz + z];
          if (prev){ const rr = 0.34 - 0.2*t; vAdd(V, '#2f8f5a', o => segP(o, prev, p, rr, 6)); if (i % 2 === 0) vAdd(V, i % 4 ? '#e9c33b' : '#3d6fd0', o => boxP(o, 0.12, rr*1.5, 0.08, p[0], p[1] + rr*0.6, p[2], 0)); }
          prev = p; }
        // head (raised), mane, horns, open jaws
        const hx = cx + sx*0.95, hy = yc(0.95) + 0.95;
        vAdd(V, '#2f8f5a', o => { boxP(o, 0.75, 0.42, 0.42, hx, hy, cz, 0); boxP(o, 0.45, 0.14, 0.34, hx - sx*0.45, hy + 0.05, cz, 0); boxP(o, 0.45, 0.12, 0.34, hx - sx*0.42, hy + 0.3, cz, 0); });
        vAdd(V, '#d23b2c', o => { boxP(o, 0.25, 0.55, 0.5, hx + sx*0.3, hy + 0.1, cz, 0); segP(o, [hx + sx*0.2, hy + 0.4, cz], [hx + sx*0.65, hy + 0.85, cz], 0.07, 4); });
        vAdd(V, '#e9c33b', o => { for (const k of [-1, 1]) segP(o, [hx, hy + 0.42, cz + k*0.12], [hx + sx*0.35, hy + 0.8, cz + k*0.2], 0.05, 3); });
      }
      // the flaming pearl on its stand
      latheP(B.p(GOLD), [[0.05, yr + 0.3], [0.35, yr + 0.5], [0.45, yr + 0.85], [0.3, yr + 1.15], [0.05, yr + 1.3]], cx, cz, 8);
      vAdd(V, '#d23b2c', o => { for (let k = 0; k < 7; k++){ const a2 = k/7*TAU; segP(o, [cx, yr + 0.95, cz], [cx + Math.cos(a2)*0.75, yr + 1.1 + 0.35*Math.abs(Math.sin(a2)), cz + Math.sin(a2)*0.12], 0.06, 3); } });
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
      for (const x of [-8.7, -6.2, -3.7, AX - 4.2, AX - 1.4, AX + 1.4, AX + 4.2, 9.7, 12.2, 14.7]) lantern(x, 5.1, z1 - 0.9);
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
}
// ---------------- Pinnacle@Duxton (helpers from lm18/f2) ----------------
{
const PI = Math.PI, HP = PI/2, TAU = PI*2;
const FD = {pinnacle:{"A":[[-60.9,-89.0],[-27.5,-109.2],[-14.9,-88.5],[-47.8,-68.3]],"B":[[19.1,-62.4],[-10.8,-88.5],[5.4,-106.8],[35.2,-80.7]],"C":[[61.5,-32.1],[40.0,-21.4],[21.5,-58.8],[43.0,-69.5]],"D":[[9.5,30.7],[0.0,11.2],[35.8,-6.6],[45.4,13.0]],"E":[[-14.3,68.7],[-34.0,58.6],[-15.5,23.6],[4.2,33.7]],"F":[[6.6,132.1],[-14.3,138.1],[-25.1,100.1],[-4.2,94.2]],"G":[[15.5,177.8],[-6.0,181.4],[-12.5,145.8],[9.5,141.6]],"DECK":[[1.2,-135.3],[3.0,-109.8],[5.4,-106.8],[-10.8,-88.5],[19.1,-62.4],[35.2,-80.7],[43.0,-69.5],[21.5,-58.8],[40.0,-21.4],[61.5,-32.1],[45.4,13.0],[35.8,-6.6],[0.0,11.2],[9.5,30.7],[4.2,33.7],[-15.5,23.6],[-34.0,58.6],[-39.4,50.3],[-63.3,-87.9],[-60.9,-89.0],[-47.8,-68.3],[-14.9,-88.5],[-27.5,-109.2],[-6.0,-121.1],[-3.0,-125.8],[-2.4,-135.3]],"CC":[[44.8,53.3],[66.9,70.5],[46.6,96.0],[43.0,133.3],[12.5,131.0],[14.9,101.9],[4.2,101.3],[5.4,79.4],[30.4,81.1],[42.4,68.7],[23.3,52.7],[28.0,47.3],[40.6,58.0]],"CR":[[47.7,-59.4],[60.3,-33.3],[40.0,-23.2],[27.5,-48.7],[31.6,-51.1],[44.8,-26.2],[53.1,-30.3],[40.6,-55.8]],"_place":[1.277027,103.841293]}};
// every material double-sided so that extrusions and triangle batches of one colour share one material
const dsS = c => typeof c === 'string' ? {c, ds:true} : Object.assign({ds:true}, c);
const LPolyD = (g, P, y0, h, col) => LPoly(g, P, y0, h, dsS(col)), LBoxD = (g, w, h, d, x, y, z, col, ry) => LBox(g, w, h, d, x, y, z, dsS(col), ry);
const LShapeD = (g, pts, depth, x, y, z, col, ry) => LShape(g, pts, depth, x, y, z, dsS(col), ry), LBeamD = (g, a, b, r, col, seg) => LBeam(g, a, b, r, dsS(col), seg);
const LCylD = (g, rt, rb, h, x, y, z, col, seg, ry) => LCyl(g, rt, rb, h, x, y, z, dsS(col), seg, ry), LSphD = (g, r, x, y, z, col, sy, seg) => LSph(g, r, x, y, z, dsS(col), sy, seg);
const lerp = (a, b, t) => a + (b - a)*t, cl01 = t => t < 0 ? 0 : t > 1 ? 1 : t, sm = t => { t = cl01(t); return t*t*(3 - 2*t); };
// ---- triangle batches: many small parts of one colour spec become one LTris call
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const quadP = (o, a, b, c, d) => o.push(...a, ...b, ...c, ...a, ...c, ...d);
const triP = (o, a, b, c) => o.push(...a, ...b, ...c);
function segP(o, a, b, r, n){
  n = n || 4; const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2], L = Math.hypot(dx, dy, dz); if (L < 1e-4) return;
  const d = [dx/L, dy/L, dz/L], up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let ux = d[1]*up[2]-d[2]*up[1], uy = d[2]*up[0]-d[0]*up[2], uz = d[0]*up[1]-d[1]*up[0]; const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
  const vx = d[1]*uz-d[2]*uy, vy = d[2]*ux-d[0]*uz, vz = d[0]*uy-d[1]*ux;
  const ring = p => { const R = []; for (let i = 0; i < n; i++){ const t = (i + 0.5)/n*TAU, c = Math.cos(t)*r, s = Math.sin(t)*r; R.push([p[0]+ux*c+vx*s, p[1]+uy*c+vy*s, p[2]+uz*c+vz*s]); } return R; };
  const A = ring(a), B = ring(b);
  for (let i = 0; i < n; i++){ const j = (i+1) % n; quadP(o, A[i], A[j], B[j], B[i]); }
}
const polyP = (o, pts, r, n, closed) => { for (let i = 0; i < pts.length - 1; i++) segP(o, pts[i], pts[i+1], r, n); if (closed) segP(o, pts[pts.length-1], pts[0], r, n); };
function boxP(o, w, h, d, x, y, z, ry){
  const R = rotP(x, z, ry || 0), hw = w/2, hd = d/2;
  const P = [R(-hw, y, -hd), R(hw, y, -hd), R(hw, y, hd), R(-hw, y, hd), R(-hw, y+h, -hd), R(hw, y+h, -hd), R(hw, y+h, hd), R(-hw, y+h, hd)];
  for (const [a, b, c, e] of [[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]) quadP(o, P[a], P[b], P[c], P[e]);
}
const capP = (o, L) => { const c = [0, 0, 0]; for (const p of L){ c[0] += p[0]/L.length; c[1] += p[1]/L.length; c[2] += p[2]/L.length; } for (let i = 0; i < L.length; i++) o.push(...c, ...L[i], ...L[(i+1) % L.length]); };
// ---- plan polygons ([x, z] points)
const area2 = P => { let s = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; s += a[0]*b[1] - b[0]*a[1]; } return s/2; };
const cenP = P => { let x = 0, z = 0; for (const p of P){ x += p[0]; z += p[1]; } return [x/P.length, z/P.length]; };
const rectP = (w, d, cx, cz, ry) => { const R = rotP(cx || 0, cz || 0, ry || 0); return [[-w/2, -d/2], [w/2, -d/2], [w/2, d/2], [-w/2, d/2]].map(p => { const q = R(p[0], 0, p[1]); return [q[0], q[2]]; }); };
const ngon = (n, r, cx, cz, a0) => { const P = []; for (let i = 0; i < n; i++){ const a = (a0 || 0) + i/n*TAU; P.push([(cx || 0) + Math.cos(a)*r, (cz || 0) + Math.sin(a)*r]); } return P; };
const scaleP = (P, s, c) => { c = c || cenP(P); return P.map(p => [c[0] + (p[0]-c[0])*s, c[1] + (p[1]-c[1])*s]); };
const shiftP = (P, dx, dz) => P.map(p => [p[0] + dx, p[1] + dz]);
// inward offset by d (negative grows), mitred and clamped
function offP(P, d){
  const n = P.length, s = area2(P) > 0 ? 1 : -1, L = [];
  for (let i = 0; i < n; i++){ const a = P[i], b = P[(i+1) % n], ex = b[0]-a[0], ez = b[1]-a[1], l = Math.hypot(ex, ez) || 1; L.push([a[0] - ez/l*s*d, a[1] + ex/l*s*d, ex, ez]); }
  const out = [];
  for (let i = 0; i < n; i++){ const p = L[(i + n - 1) % n], q = L[i], den = p[2]*q[3] - p[3]*q[2];
    if (Math.abs(den) < 1e-6){ out.push([q[0], q[1]]); continue; }
    const t = ((q[0]-p[0])*q[3] - (q[1]-p[1])*q[2])/den; let x = p[0] + p[2]*t, z = p[1] + p[3]*t;
    const ox = P[i][0], oz = P[i][1], dd = Math.hypot(x - ox, z - oz), mx = Math.abs(d)*2.5;
    if (dd > mx){ x = ox + (x - ox)/dd*mx; z = oz + (z - oz)/dd*mx; }
    out.push([x, z]); }
  return out;
}
// outward unit normal of edge i
const outN = (P, i) => { const s = area2(P) > 0 ? 1 : -1, a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], l = Math.hypot(ex, ez) || 1; return [ez/l*s, -ex/l*s]; };
const inPoly = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0]-a[0])*(z-a[1])/(b[1]-a[1]) + a[0]) c = !c; } return c; };
const dSeg = (x, z, a, b) => { const ex = b[0]-a[0], ez = b[1]-a[1], L2 = ex*ex + ez*ez || 1, t = cl01(((x-a[0])*ex + (z-a[1])*ez)/L2); return Math.hypot(x - a[0] - ex*t, z - a[1] - ez*t); };
const dPoly = (P, x, z) => { let d = 1e9; for (let i = 0; i < P.length; i++) d = Math.min(d, dSeg(x, z, P[i], P[(i+1) % P.length])); return d; };
const triang = P => THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
// walls of a plan polygon from y0 up to ytop (a number or f(x, z)) and its top, into a batch
function prismP(o, P, y0, ytop, noTop){
  const f = typeof ytop === 'function' ? ytop : () => ytop;
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; quadP(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], f(b[0], b[1]), b[1]], [a[0], f(a[0], a[1]), a[1]]); }
  if (!noTop) for (const t of triang(P)) for (const k of t){ const p = P[k]; o.push(p[0], f(p[0], p[1]), p[1]); }
}
const flatP = (o, P, y) => { for (const t of triang(P)) for (const k of t){ const p = P[k]; o.push(p[0], y, p[1]); } };
// a sloping roof plane over P rising from y0 to y1 along the plan direction (dx, dz)
const slopeF = (P, y0, y1, dx, dz) => { let a = 1e9, b = -1e9; for (const p of P){ const s = p[0]*dx + p[1]*dz; a = Math.min(a, s); b = Math.max(b, s); } return (x, z) => y0 + (y1 - y0)*((x*dx + z*dz) - a)/Math.max(0.01, b - a); };
// floor bands round a plan polygon every `step` m between y0 and y1 (vertical quads just proud of the wall)
function bandsP(o, P, y0, y1, step, bh, off, edges){
  off = off || 0.12;
  for (let i = 0; i < P.length; i++){ if (edges && !edges(i)) continue;
    const a = P[i], b = P[(i+1) % P.length]; if (Math.hypot(b[0]-a[0], b[1]-a[1]) < 0.3) continue; const [nx, nz] = outN(P, i);
    for (let y = y0 + step; y < y1 - 0.3; y += step) quadP(o, [a[0]+nx*off, y, a[1]+nz*off], [b[0]+nx*off, y, b[1]+nz*off], [b[0]+nx*off, y+bh, b[1]+nz*off], [a[0]+nx*off, y+bh, a[1]+nz*off]);
  }
}
// vertical strips (mullions / piers) standing `off` proud of the walls, about `sp` apart, `w` wide
function mullP(o, P, y0, y1, sp, w, off, edges){
  for (let i = 0; i < P.length; i++){ if (edges && !edges(i)) continue;
    const a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], L = Math.hypot(ex, ez); if (L < sp*0.6) continue;
    const [nx, nz] = outN(P, i), n = Math.max(1, Math.round(L/sp)), ux = ex/L, uz = ez/L, yy0 = typeof y0 === 'function' ? y0 : () => y0, yy1 = typeof y1 === 'function' ? y1 : () => y1;
    for (let k = 0; k <= n; k++){ const t = k/n, x = a[0] + ex*t + nx*off, z = a[1] + ez*t + nz*off, p = [x - ux*w/2, z - uz*w/2], q = [x + ux*w/2, z + uz*w/2];
      quadP(o, [p[0], yy0(x, z), p[1]], [q[0], yy0(x, z), q[1]], [q[0], yy1(x, z), q[1]], [p[0], yy1(x, z), p[1]]); }
  }
}
// deep fins (boxes) along the edges
function finsP(o, P, y0, y1, sp, w, d, edges){
  for (let i = 0; i < P.length; i++){ if (edges && !edges(i)) continue;
    const a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], L = Math.hypot(ex, ez); if (L < 2) continue;
    const [nx, nz] = outN(P, i), n = Math.max(1, Math.round(L/sp)), ry = Math.atan2(-ez, ex);
    for (let k = 0; k <= n; k++){ const t = k/n; boxP(o, w, y1 - y0, d, a[0] + ex*t + nx*d/2, y0, a[1] + ez*t + nz*d/2, ry); }
  }
}
// a lit line along the top edge of a polygon (crowns at night)
function edgeLineP(o, P, f, r){ for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; segP(o, [a[0], f(a[0], a[1]) + r, a[1]], [b[0], f(b[0], b[1]) + r, b[1]], r, 4); } }
// polygon with a hole (terrace rings), extruded
function ringPoly(g, outer, inner, y0, h, col){
  const sh = new THREE.Shape(outer.map(p => new THREE.Vector2(p[0], -p[1])));
  sh.holes.push(new THREE.Path(inner.map(p => new THREE.Vector2(p[0], -p[1]))));
  const m = lmAdd(g, new THREE.ExtrudeGeometry(sh, {depth:h, bevelEnabled:false}), dsS(col), 0, y0, 0); m.rotation.x = -HP; return m;
}
// trees into batches
function treeP(B, x, y, z, s, crown, trunk){
  segP(B.p(trunk || '#5d4a3a'), [x, y, z], [x, y + 3*s, z], 0.28*s, 4);
  const c = B.p(crown || '#4f7f3a'), R = 2.4*s, cy = y + 4.2*s, top = [x, cy + R*0.75, z], bot = [x, cy - R*0.55, z], ring = [];
  for (let i = 0; i < 6; i++){ const a = i/6*TAU; ring.push([x + Math.cos(a)*R, cy, z + Math.sin(a)*R]); }
  for (let i = 0; i < 6; i++){ const j = (i+1) % 6; triP(c, top, ring[j], ring[i]); triP(c, bot, ring[i], ring[j]); }
}
function palmP(B, x, y, z, s, r){
  const top = [x + (r() - 0.5)*1.2*s, y + 7*s, z + (r() - 0.5)*1.2*s];
  segP(B.p('#5d4a3a'), [x, y, z], top, 0.22*s, 4);
  const f = B.p('#4f7f3a');
  for (let i = 0; i < 7; i++){ const a = i/7*TAU + r(), c = Math.cos(a), sn = Math.sin(a), L = 3.2*s;
    triP(f, top, [top[0] + c*L - sn*0.5*s, top[1] - 1.2*s, top[2] + sn*L + c*0.5*s], [top[0] + c*L + sn*0.5*s, top[1] - 1.2*s, top[2] + sn*L - c*0.5*s]); }
}
// scatter trees inside a polygon (avoid: f(x, z) -> true to skip)
function treesIn(B, P, n, y, s, r, avoid, crown){
  let k = 0, xs = P.map(p => p[0]), zs = P.map(p => p[1]); const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
  for (let t = 0; t < n*12 && k < n; t++){ const x = lerp(x0, x1, r()), z = lerp(z0, z1, r()); if (!inPoly(P, x, z) || dPoly(P, x, z) < 2 || (avoid && avoid(x, z))) continue;
    treeP(B, x, typeof y === 'function' ? y(x, z) : y, z, s*(0.8 + 0.5*r()), crown); k++; }
}
// a glass curtain-wall tower body: extruded plan, spandrel bands, mullions
function glassBody(g, B, P, y0, y1, spec, o){
  LPolyD(g, P, y0, y1 - y0, spec);
  if (o.band) bandsP(B.p(o.band), P, y0, y1, o.fh || 4.2, o.bh || 0.55, 0.1);
  if (o.mull) mullP(B.p(o.mull), P, y0, y1, o.sp || 3, o.mw || 0.3, 0.14);
}
// ===== Pinnacle@Duxton (ARC Studio, 2009): seven 50-storey HDB slab towers (about 22 x 40 m, roof 156 m) set end to end in a
// chain round the site - five round the landscaped car-park deck, two beyond the Tanjong Pagar Community Club - and linked at
// the 26th and 50th storeys by continuous sky gardens on bridges between the tower ends (the 500 m sky park on top). Facades of
// prefabricated panels in seven sets: projecting bay windows, planter boxes, flat and recessed windows in light grey / white /
// sand tones form a pixelated mosaic; a deep recessed slot down the middle of each long face. Night: lit windows, the two sky
// garden bands lit as continuous lines. Tower plans from OSM; the Community Club (inside the model's ground hull) is included.
LANDMARKS.pinnacle = {zh:'达士岭组屋', en:'Pinnacle@Duxton', cat:'new', r:186, h:156, lt:{m:1, c:'#fff2dc', k:0.6}, build(){
  const g = new THREE.Group(), B = mkB(), F = FD.pinnacle, r = LMCTX.rng;
  const Y26 = 78, Y50 = 150, ROOF = 154.4;
  const wallC = {c:'#dcd9d1', m:1, fh:3.0, cw:2.4}, dark = B.p({c:'#4a5258', m:1, fh:3.0, cw:2.4}), slab = B.p('#f4f2ec'), SKY = {c:'#59646b', glow:'#ffe1b0', gk:0.7};
  const LAMP = B.p({c:'#fff4dc', glow:'#ffeac4', gk:2.2});
  // vertex-coloured facade mosaic: one material, many panel shades
  const V = {p:new Float32Array(1 << 20), c:new Float32Array(1 << 20), n:0}, VC = {};
  const vgrow = () => { const L = V.p.length*2, P = new Float32Array(L), C = new Float32Array(L); P.set(V.p); C.set(V.c); V.p = P; V.c = C; };
  const vpush = (hex, t) => { let c = VC[hex]; if (!c){ const k = new THREE.Color(hex); c = VC[hex] = [k.r, k.g, k.b]; }
    if (V.n + t.length > V.p.length) vgrow();
    for (let i = 0; i < t.length; i += 3){ V.p[V.n] = t[i]; V.p[V.n + 1] = t[i+1]; V.p[V.n + 2] = t[i+2]; V.c[V.n] = c[0]; V.c[V.n + 1] = c[1]; V.c[V.n + 2] = c[2]; V.n += 3; } };
  // the deck over the car park, its planted top with trees, play courts and pavilions; the Community Club
  LPolyD(g, F.DECK, -4, 10.9, '#c9c4b8'); bandsP(B.p(SKY), F.DECK, 0.8, 6, 3.0, 1.4, 0.06);
  LPolyD(g, F.DECK, 6.9, 0.45, '#86ad62');
  const TOW = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(k => F[k]);
  treesIn(B, F.DECK, 70, 7.35, 1.2, r, (x, z) => TOW.some(P => inPoly(P, x, z) || dPoly(P, x, z) < 4));
  { const c = cenP(F.DECK); LPolyD(g, rectP(28, 15, c[0] + 8, c[1] - 6, 0.5), 7.36, 0.1, '#b8664e'); LPolyD(g, rectP(9, 9, c[0] - 16, c[1] + 22, 0.2), 7.35, 3.2, '#f4f2ec'); }
  LPolyD(g, F.CC, -3, 20.9, {c:'#e7e4dc', m:1, fh:3.0, cw:2.4}); bandsP(dark, F.CC, 0, 17.9, 4.2, 1.8, 0.06); prismP(B.p('#c9c4b8'), offP(F.CC, 1.5), 17.9, 19.2);
  // ---- the towers (local x across the slab, local z along it)
  const T = TOW.map(P => { const e = [0, 1, 2, 3].map(i => [P[i], P[(i+1) % 4]]), L = e.map(([a, b]) => Math.hypot(b[0]-a[0], b[1]-a[1]));
    const k = L[0] > L[1] ? 0 : 1, a = e[k][0], b = e[k][1], ux = (b[0]-a[0])/L[k], uz = (b[1]-a[1])/L[k], c = cenP(P);
    return {P, c, ry:Math.atan2(ux, uz), len:(L[k] + L[k+2])/2, wid:(L[1-k] + L[3-k])/2, ux, uz}; });
  const SHADE = ['#eeebe4', '#e2ded5', '#d6d8d5', '#f5f3ee', '#ddd7ca', '#cfd3d4'], GLS = ['#9cafb8', '#a7b7be', '#90a4ae'], WIN = '#7b8991', REC = '#5d676e', PLANT = '#5f8f45';
  T.forEach((t, ti) => {
    const R = (() => { const c = Math.cos(t.ry), sn = Math.sin(t.ry), cx = t.c[0], cz = t.c[1]; return (x, y, z) => [cx + x*c + z*sn, y, cz - x*sn + z*c]; })(), TD = t.wid, TW = t.len;
    LPolyD(g, t.P, -3, ROOF + 3, wallC);
    // faces: [length along the face, half-depth to the face, side, axis (0 = long face, normal local x; 1 = end face, normal local z)]
    const faces = [[TW, TD/2, 1, 0], [TW, TD/2, -1, 0], [TD, TW/2, 1, 1], [TD, TW/2, -1, 1]];
    faces.forEach(([len, off, s, ax], fi) => {
      // face basis in world x-z: point = O + U*u + W*w, y = v (u along the face, w outwards); written straight into the batch
      const c0 = Math.cos(t.ry), s0 = Math.sin(t.ry), EX = [c0, -s0], EZ = [s0, c0], A = ax ? EZ : EX;
      const Ox = t.c[0] + A[0]*s*off, Oz = t.c[1] + A[1]*s*off, Ux = ax ? s*EX[0] : -s*EZ[0], Uz = ax ? s*EX[1] : -s*EZ[1], Wx = s*A[0], Wz = s*A[1];
      let cr = 0, cg = 0, cb = 0;
      const col = hex => { let c = VC[hex]; if (!c){ const k = new THREE.Color(hex); c = VC[hex] = [k.r, k.g, k.b]; } cr = c[0]; cg = c[1]; cb = c[2]; };
      const put = (u, v, w) => { if (V.n + 3 > V.p.length) vgrow(); const i = V.n, P = V.p, C = V.c; P[i] = Ox + Ux*u + Wx*w; P[i+1] = v; P[i+2] = Oz + Uz*u + Wz*w; C[i] = cr; C[i+1] = cg; C[i+2] = cb; V.n = i + 3; };
      const quad = (hex, u0, u1, v0, v1, w) => { col(hex); put(u0, v0, w); put(u1, v0, w); put(u1, v1, w); put(u0, v0, w); put(u1, v1, w); put(u0, v1, w); };
      const box = (hex, u0, u1, v0, v1, w0, w1, top) => { quad(hex, u0, u1, v0, v1, w1);
        put(u0, v0, w0); put(u0, v0, w1); put(u0, v1, w1); put(u0, v0, w0); put(u0, v1, w1); put(u0, v1, w0);
        put(u1, v0, w1); put(u1, v0, w0); put(u1, v1, w0); put(u1, v0, w1); put(u1, v1, w0); put(u1, v1, w1);
        put(u0, v0, w0); put(u1, v0, w0); put(u1, v0, w1); put(u0, v0, w0); put(u1, v0, w1); put(u0, v0, w1);
        if (top) col(top); put(u0, v1, w1); put(u1, v1, w1); put(u1, v1, w0); put(u0, v1, w1); put(u1, v1, w0); put(u0, v1, w0); };
      const nb = Math.max(3, Math.round(len/3.3)), bw = len/nb, mid = ax ? -1 : Math.floor(nb/2);
      for (let j = 0; j < nb; j++){
        const u0 = -len/2 + j*bw, u1 = u0 + bw, set = (j*5 + ti*3 + fi) % 7;
        if (j === mid){   // the deep slot: dark recess between white fins, full height
          quad(REC, u0 + 0.3, u1 - 0.3, 7, Y50, 0.02);
          for (const uu of [u0 + 0.15, u1 - 0.15]) box('#f2f0ea', uu - 0.15, uu + 0.15, 7, Y50, 0, 1.0);
          continue; }
        for (const [ya, yb, n] of [[7.0, Y26 - 0.6, 24], [Y26 + 3.6, Y50 - 0.6, 22]]){
          const fh = (yb - ya)/n;
          for (let k = 0; k < n; k++){
            const y0 = ya + k*fh, q = r(), w = (set + (k >> 1)) % 7;
            const ty = w === 0 || w === 3 ? (q < 0.6 ? 0 : 2) : w === 1 || w === 5 ? (q < 0.6 ? 1 : 2) : w === 2 ? (q < 0.78 ? 2 : 3) : (q < 0.35 ? 0 : q < 0.65 ? 1 : q < 0.93 ? 2 : 3);
            const sh = SHADE[(set + (k >> 2)) % SHADE.length];
            if (ty === 0){ box(sh, u0 + 0.25, u1 - 0.25, y0 + 0.45, y0 + fh - 0.25, 0, 0.75); quad(GLS[(j + k) % 3], u0 + 0.45, u1 - 0.45, y0 + 0.65, y0 + fh - 0.45, 0.76); }
            else if (ty === 1){ box(sh, u0 + 0.15, u1 - 0.15, y0, y0 + 0.95, 0, 0.6, PLANT); quad(WIN, u0 + 0.4, u1 - 0.4, y0 + 1.05, y0 + fh - 0.35, 0.03); }
            else if (ty === 2){ quad(sh, u0, u1, y0, y0 + fh, 0.02); quad(WIN, u0 + 0.65, u1 - 0.65, y0 + 0.9, y0 + fh - 0.5, 0.04); }
            else { quad(REC, u0 + 0.2, u1 - 0.2, y0 + 0.1, y0 + fh - 0.1, 0.02); }
          }
        }
      }
      // floor-slab edges, every storey, just proud of the panels
      for (const [ya, yb, n] of [[7.0, Y26 - 0.6, 24], [Y26 + 3.6, Y50 - 0.6, 22]]){ const fh = (yb - ya)/n; for (let k = 0; k <= n; k++){ const y0 = ya + k*fh; quad('#f3f1ec', -len/2 - 0.1, len/2 + 0.1, y0 - 0.12, y0 + 0.08, 0.9); } }
    });
    // white corner piers
    for (const sx of [-1, 1]) for (const sz of [-1, 1]){ const q = R(sx*(TD/2 + 0.2), 0, sz*(TW/2 + 0.2)); boxP(slab, 1.2, Y50 - 7, 1.2, q[0], 7, q[2], t.ry); }
    // the 26th and 50th storey refuge / sky-garden floors through the tower: white slabs, glazed lit band
    for (const y of [Y26, Y50]){ LPolyD(g, rectP(TD + 2.4, TW + 2.4, t.c[0], t.c[1], t.ry), y - 0.6, 0.7, '#f4f2ec'); LPolyD(g, rectP(TD - 3, TW - 3, t.c[0], t.c[1], t.ry), y + 0.1, 3.0, SKY); LPolyD(g, rectP(TD + 2.4, TW + 2.4, t.c[0], t.c[1], t.ry), y + 3.1, 0.6, '#f4f2ec'); }
    // roof: planted, glass balustrades, trees, the lift overrun and water tanks
    LPolyD(g, rectP(TD, TW, t.c[0], t.c[1], t.ry), ROOF, 0.4, '#86ad62');
    for (let k = 0; k < 6; k++){ const q = R((r() - 0.5)*(TD - 6), 0, (r() - 0.5)*(TW - 6)); treeP(B, q[0], ROOF + 0.4, q[2], 0.6); }
    for (const s of [-1, 1]){ const q = R(s*(TD/2 - 0.3), 0, 0); boxP(B.p({c:'#cfe3ea', op:0.55}), 0.2, 1.3, TW, q[0], ROOF + 0.4, q[2], t.ry); }
    { const q = R(0, 0, -TW/4); boxP(slab, 8, 2.6, 7, q[0], ROOF + 0.4, q[2], t.ry); }
    for (const sx of [-1, 1]){ const q = R(sx*(TD/2 + 0.6), 0, 0); segP(LAMP, R(sx*(TD/2 + 1.25), Y50 + 3.15, -TW/2 - 1.2), R(sx*(TD/2 + 1.25), Y50 + 3.15, TW/2 + 1.2), 0.1, 4); segP(LAMP, R(sx*(TD/2 + 1.25), Y26 + 3.15, -TW/2 - 1.2), R(sx*(TD/2 + 1.25), Y26 + 3.15, TW/2 + 1.2), 0.1, 4); }
  });
  { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(V.p.slice(0, V.n), 3)); geo.setAttribute('color', new THREE.BufferAttribute(V.c.slice(0, V.n), 3)); geo.computeVertexNormals(); lmAdd(g, geo, {c:'#ffffff', vc:true, ds:true, m:1, fh:3.0, cw:2.4}, 0, 0, 0, 0); }
  // ---- sky bridges between consecutive tower ends, at the 26th and 50th storeys (the 50th open on top, planted)
  const endSeg = (t, toward) => { const R = rotP(t.c[0], t.c[1], t.ry); let best = null;
    for (const s of [-1, 1]){ const m = R(0, 0, s*t.len/2), d = Math.hypot(m[0] - toward[0], m[2] - toward[1]); if (!best || d < best.d) best = {d, a:R(-7, 0, s*t.len/2), b:R(7, 0, s*t.len/2)}; } return best; };
  for (let i = 0; i < T.length - 1; i++){
    const A = endSeg(T[i], T[i+1].c), Bq = endSeg(T[i+1], T[i].c);
    let a0 = A.a, a1 = A.b, b0 = Bq.a, b1 = Bq.b; if (Math.hypot(a0[0]-b0[0], a0[2]-b0[2]) > Math.hypot(a0[0]-b1[0], a0[2]-b1[2])){ const t = b0; b0 = b1; b1 = t; }
    const at = (p, q, s) => [lerp(p[0], q[0], s), lerp(p[2], q[2], s)];
    for (const y of [Y26, Y50]){
      const box = (y0, y1, s, col) => { const L0 = at(a0, a1, 0.5 - s/2), L1 = at(a0, a1, 0.5 + s/2), M0 = at(b0, b1, 0.5 - s/2), M1 = at(b0, b1, 0.5 + s/2);
        LHex(g, [[L0[0], y0, L0[1]], [L1[0], y0, L1[1]], [M1[0], y0, M1[1]], [M0[0], y0, M0[1]], [L0[0], y1, L0[1]], [L1[0], y1, L1[1]], [M1[0], y1, M1[1]], [M0[0], y1, M0[1]]], col); };
      box(y - 1.7, y + 0.1, 1, '#f4f2ec'); box(y + 0.1, y + 3.1, 0.86, SKY); box(y + 3.1, y + 4.2, 1, '#f4f2ec');
      // lit edge lines along both sides of the bridge (the sky gardens read as continuous bands of light at night)
      for (const s of [0, 1]){ const p = at(a0, a1, s), q = at(b0, b1, s); segP(LAMP, [p[0], y + 4.25, p[1]], [q[0], y + 4.25, q[1]], 0.2, 4); segP(LAMP, [p[0], y - 1.75, p[1]], [q[0], y - 1.75, q[1]], 0.12, 4); }
      if (y === Y50){ box(y + 4.2, y + 4.6, 0.82, '#86ad62');
        for (let k = 0; k < 5; k++){ const s = 0.2 + 0.6*r(), tt = (k + 0.5)/5, p = at(a0, a1, s), q = at(b0, b1, s); treeP(B, lerp(p[0], q[0], tt), y + 4.6, lerp(p[1], q[1], tt), 0.5 + 0.2*r()); }
        for (const s of [0.04, 0.96]){ const p = at(a0, a1, s), q = at(b0, b1, s); segP(B.p({c:'#cfe3ea', op:0.55}), [p[0], y + 5.1, p[1]], [q[0], y + 5.1, q[1]], 0.5, 4); } }
    }
  }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'pinnacle', lat:1.277027, lon:103.841293, rot:0});
}
// ---------------- National Museum of Singapore (helpers from lm18/b) ----------------
{
const PI = Math.PI, HP = PI/2, TAU = PI*2;
const lerp = (a, b, t) => a + (b - a)*t, cl01 = t => t < 0 ? 0 : t > 1 ? 1 : t;
// triangle batches: many small parts of one colour spec become one LTris call
// (a growable Float32Array keeps the big batches out of the garbage collector's way)
const FBuf = function(){ this.a = new Float32Array(4608); this.n = 0; }
FBuf.prototype.push = function(){ const k = arguments.length; if (this.n + k > this.a.length){ const b = new Float32Array(Math.max(this.a.length*2, this.n + k)); b.set(this.a); this.a = b; } for (let i = 0; i < k; i++) this.a[this.n++] = arguments[i]; return this.n; };
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:new FBuf()}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.n) LTris(g, e.a.a.subarray(0, e.a.n), e.col); M.clear(); } }; };
const quadP = (o, a, b, c, d) => o.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2]);
const triP = (o, a, b, c) => o.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
// box (w along x, d along z) standing on y, turned ry, into a batch
const boxP = function(o, w, h, d, x, y, z, ry){
  const R = rotP(x, z, ry || 0), hw = w/2, hd = d/2;
  const P = [R(-hw, y, -hd), R(hw, y, -hd), R(hw, y, hd), R(-hw, y, hd), R(-hw, y+h, -hd), R(hw, y+h, -hd), R(hw, y+h, hd), R(-hw, y+h, hd)];
  for (const [a, b, c, e] of [[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]) quadP(o, P[a], P[b], P[c], P[e]);
}
// n-sided prism round the segment a-b
const segP = function(o, a, b, r, n){
  n = n || 4; const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2], L = Math.hypot(dx, dy, dz); if (L < 1e-4) return;
  const d = [dx/L, dy/L, dz/L], up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let ux = d[1]*up[2]-d[2]*up[1], uy = d[2]*up[0]-d[0]*up[2], uz = d[0]*up[1]-d[1]*up[0]; const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
  const vx = d[1]*uz-d[2]*uy, vy = d[2]*ux-d[0]*uz, vz = d[0]*uy-d[1]*ux;
  const ring = p => { const R = []; for (let i = 0; i < n; i++){ const t = (i + 0.5)/n*TAU, c = Math.cos(t)*r, s = Math.sin(t)*r; R.push([p[0]+ux*c+vx*s, p[1]+uy*c+vy*s, p[2]+uz*c+vz*s]); } return R; };
  const A = ring(a), Bq = ring(b);
  for (let i = 0; i < n; i++){ const j = (i+1) % n; quadP(o, A[i], A[j], Bq[j], Bq[i]); }
}
// plan polygons ([x, z] points)
const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const wallsP = (o, P, y0, y1) => { for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; quadP(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); } };
const V2 = p => new THREE.Vector2(p[0], p[1]);
const capP = function(o, P, y, holes){ const H = holes || [], tri = THREE.ShapeUtils.triangulateShape(P.map(V2), H.map(h => h.map(V2))), A = P.concat(...H); for (const t of tri) for (const i of t) o.push(A[i][0], y, A[i][1]); }
const prismP = function(o, P, y0, y1, bottom){ wallsP(o, P, y0, y1); capP(o, P, y1); if (bottom) capP(o, P, y0); }
const cenP = P => { let x = 0, z = 0; for (const p of P){ x += p[0]; z += p[1]; } return [x/P.length, z/P.length]; };
// offset a simple polygon outward by d (miter joins)
const offP = function(P, d){
  const n = P.length, c = cenP(P), out = [];
  let A = 0; for (let i = 0; i < n; i++){ const a = P[i], b = P[(i+1) % n]; A += a[0]*b[1] - b[0]*a[1]; } const s = A > 0 ? 1 : -1;
  for (let i = 0; i < n; i++){
    const p = P[(i + n - 1) % n], q = P[i], r = P[(i+1) % n];
    const e1 = [q[0]-p[0], q[1]-p[1]], e2 = [r[0]-q[0], r[1]-q[1]], l1 = Math.hypot(...e1) || 1, l2 = Math.hypot(...e2) || 1;
    const n1 = [s*e1[1]/l1, -s*e1[0]/l1], n2 = [s*e2[1]/l2, -s*e2[0]/l2], m = [n1[0]+n2[0], n1[1]+n2[1]], ml = Math.hypot(...m) || 1;
    const k = d/Math.max(0.35, (m[0]*n1[0] + m[1]*n1[1])/ml); out.push([q[0] + m[0]/ml*k, q[1] + m[1]/ml*k]);
  }
  return out;
}
// wall frame along a -> b ([x, z]); n points away from `ins` (a point inside the building)
const WF = function(a, b, ins){
  const dx = b[0]-a[0], dz = b[1]-a[1], L = Math.hypot(dx, dz), u = [dx/L, dz/L]; let n = [u[1], -u[0]];
  if (ins && n[0]*(ins[0]-a[0]) + n[1]*(ins[1]-a[1]) > 0) n = [-n[0], -n[1]];
  return {a, b, u, n, L, ry:Math.atan2(-u[1], u[0]), P:(t, y, d) => [a[0] + u[0]*t + n[0]*(d || 0), y, a[1] + u[1]*t + n[1]*(d || 0)]};
}
const wbox = (o, F, t, y, w, h, d0, dep) => { const c = F.P(t, 0, d0 + dep/2); boxP(o, w, h, Math.abs(dep), c[0], y, c[2], F.ry); };
const wquad = (o, F, t0, t1, y0, y1, d) => quadP(o, F.P(t0, y0, d), F.P(t1, y0, d), F.P(t1, y1, d), F.P(t0, y1, d));
// arched (round-topped) panel centred at t, width w, from y0 up to the crown y1, at wall offset d
const warch = function(o, F, t, w, y0, y1, d, n){
  n = n || 6; const r = w/2, ys = y1 - r, pts = [[t - r, y0], [t + r, y0], [t + r, ys]];
  for (let i = 1; i < n; i++){ const a = PI*i/n; pts.push([t + Math.cos(a)*r, ys + Math.sin(a)*r]); } pts.push([t - r, ys]);
  const c = F.P(t, (y0 + ys)/2, d); for (let i = 0; i < pts.length; i++){ const p = pts[i], q = pts[(i+1) % pts.length]; triP(o, c, F.P(p[0], p[1], d), F.P(q[0], q[1], d)); }
}
// solid arch ring: the voussoir band round a round-headed opening (w wide, crown y1), band width bw, projecting dep
const warchRing = function(o, F, t, w, y1, bw, d0, dep, n){
  n = n || 6; const r = w/2, ys = y1 - r;
  for (let i = 0; i < n; i++){ const a0 = PI*i/n, a1 = PI*(i+1)/n;
    const P = (a, rr, d) => F.P(t + Math.cos(a)*rr, ys + Math.sin(a)*rr, d);
    quadP(o, P(a0, r, d0 + dep), P(a0, r + bw, d0 + dep), P(a1, r + bw, d0 + dep), P(a1, r, d0 + dep));
    quadP(o, P(a0, r + bw, d0), P(a1, r + bw, d0), P(a1, r + bw, d0 + dep), P(a0, r + bw, d0 + dep)); }
}
// triangular pediment prism: base t0..t1 at y, apex height h, from wall offset d0 projecting dep
const wped = function(o, F, t0, t1, y, h, d0, dep){
  const tm = (t0 + t1)/2, A = F.P(t0, y, d0 + dep), Bq = F.P(t1, y, d0 + dep), C = F.P(tm, y + h, d0 + dep), A0 = F.P(t0, y, d0), B0 = F.P(t1, y, d0), C0 = F.P(tm, y + h, d0);
  triP(o, A, Bq, C); quadP(o, A, C, C0, A0); quadP(o, C, Bq, B0, C0); quadP(o, A0, B0, Bq, A);
}
// hipped roof (ridge along the longer side) and gable roof (ridge along local x) into batches
const hipP = function(o, cx, cz, L, W, y, h, ry, over){
  if (W > L) return hipP(o, cx, cz, W, L, y, h, (ry || 0) + HP, over);
  const R = rotP(cx, cz, ry || 0), hl = L/2 + (over || 0), hw = W/2 + (over || 0), k = Math.max(0, hl - hw);
  const A = R(-hl, y, -hw), Bq = R(hl, y, -hw), C = R(hl, y, hw), D = R(-hl, y, hw), r1 = R(-k, y + h, 0), r2 = R(k, y + h, 0);
  quadP(o, A, Bq, r2, r1); quadP(o, C, D, r1, r2); triP(o, D, A, r1); triP(o, Bq, C, r2);
}
const gableP = function(o, ow, cx, cz, L, W, y, h, ry, over){
  const R = rotP(cx, cz, ry || 0), hl = L/2, hw = W/2 + (over || 0);
  const A = R(-hl, y, -hw), Bq = R(hl, y, -hw), C = R(hl, y, hw), D = R(-hl, y, hw), r1 = R(-hl, y + h, 0), r2 = R(hl, y + h, 0);
  quadP(o, A, Bq, r2, r1); quadP(o, C, D, r1, r2);
  const w0 = R(-hl, y, -W/2), w1 = R(-hl, y, W/2), w2 = R(hl, y, -W/2), w3 = R(hl, y, W/2);
  triP(ow, w0, w1, r1); triP(ow, w2, w3, r2);
}
// surface of revolution into a batch: profile [[r, y], ...]
const latheP = function(o, prof, cx, y0, cz, n, a0, a1){
  a0 = a0 || 0; a1 = a1 === undefined ? TAU : a1;
  for (let i = 0; i < n; i++){ const t0 = a0 + (a1 - a0)*i/n, t1 = a0 + (a1 - a0)*(i+1)/n;
    for (let j = 0; j < prof.length - 1; j++){ const [r0, h0] = prof[j], [r1, h1] = prof[j+1], P = (r, h, a) => [cx + Math.cos(a)*r, y0 + h, cz + Math.sin(a)*r];
      quadP(o, P(r0, h0, t0), P(r0, h0, t1), P(r1, h1, t1), P(r1, h1, t0)); } }
}
// balustrade along a wall frame from t0 to t1: base rail, balusters, top rail, pedestals at the given positions
const balP = function(o, F, t0, t1, y, d, h, posts){
  h = h || 1.15; wbox(o, F, (t0 + t1)/2, y, t1 - t0, 0.22, d - 0.3, 0.42); wbox(o, F, (t0 + t1)/2, y + h - 0.2, t1 - t0, 0.2, d - 0.32, 0.44);
  for (let t = t0 + 0.3; t < t1 - 0.2; t += 0.5) wbox(o, F, t, y + 0.22, 0.17, h - 0.42, d - 0.25, 0.25);
  for (const t of posts || []) wbox(o, F, t, y, 0.62, h + 0.08, d - 0.36, 0.5);
}

// =====================================================================================================================
// National Museum of Singapore (1887, H. E. McCallum; 1907 rear range, 1916 wing; 2006 extension by W Architects).
// The neo-Palladian front block faces Stamford Road (north-east): 74 m long, two tall storeys with Doric pilasters below
// and Ionic above, pedimented windows, balustraded parapet, pedimented end pavilions, a carriage porch and behind it the
// 16-sided rotunda drum with its stained-glass windows and the fish-scale zinc dome (27 m). Behind: the parallel 1907 range
// (with the 1916 wing to the south-east) and the glass-and-steel extension towards Fort Canning: the 11 m Glass Passage,
// the 24 m x 16 m Glass Rotunda and the perforated-metal wing. Local +z = north-east (Stamford Road front), +x = north-west.
// The site rises towards Fort Canning: everything stands on a stone plinth that runs down to y = -6.
LANDMARKS.natmuseum = {zh:'新加坡国家博物馆', en:'National Museum of Singapore', cat:'old', r:94, h:27.5,
  lt:{m:0, c:'#ffe2bc', k:0.95, e:0.3, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB();
  const wall = '#ebe4d2', trim = '#f6f2e8', dark = {c:'#3a434b', glow:'#ffd6a0', gk:0.16}, roof = '#8a5646', zinc = {c:'#a3aaae', lc:'#ffe8c8', lk:2.6}, zinc2 = {c:'#8d969b', lc:'#ffe8c8', lk:2.6}, stone = '#cdc4b0';
  const glass = {c:'#9db8c4', glow:'#fff0d8', gk:0.28}, steel = '#e4e6e4', mesh = '#9a9d9b', perf = '#b7b1a3';
  const W = B.p(wall), T = B.p(trim), DK = B.p(dark), RF = B.p(roof), ST = B.p(stone);
  const AX = -6.45;                                            // the axis of the front block (rotunda, porch)
  const F0 = 0.9, G1 = 6.6, S1 = 7.3, U1 = 12.9, E1 = 14.3;   // plinth top, ground storey, string course, upper storey, cornice
  // a classical two-storey facade on wall frame F from t0 to t1 with nb bays
  const facade = (F, t0, t1, nb, o) => {
    o = o || {}; const bw = (t1 - t0)/nb;
    wbox(T, F, (t0 + t1)/2, G1, t1 - t0 + 0.6, S1 - G1, 0, 0.3);                       // string course
    wbox(T, F, (t0 + t1)/2, U1, t1 - t0 + 0.6, E1 - U1 - 0.4, 0, 0.22);                // frieze
    wbox(T, F, (t0 + t1)/2, E1 - 0.42, t1 - t0 + 1.2, 0.42, 0, 0.62);                  // cornice
    wbox(ST, F, (t0 + t1)/2, -6, t1 - t0 + 0.6, F0 + 6, 0, 0.32);                      // plinth
    for (let i = 0; i <= nb; i++){ const t = t0 + i*bw;
      if (!o.noPil){ wbox(T, F, t, F0, 0.85, G1 - F0, 0, 0.26); wbox(T, F, t, S1, 0.72, U1 - S1, 0, 0.22); wbox(T, F, t, U1 - 0.45, 1.0, 0.45, 0, 0.32); } }
    for (let i = 0; i < nb; i++){ const t = t0 + (i + 0.5)*bw;
      if (o.door && i === (nb >> 1)) { warch(DK, F, t, 2.6, F0, 5.9, 0.04); warchRing(T, F, t, 2.6, 5.9, 0.35, 0, 0.12); }
      else { warch(DK, F, t, 1.7, 1.9, 5.5, 0.04); warchRing(T, F, t, 1.7, 5.5, 0.3, 0, 0.1); wbox(T, F, t, 1.7, 2.1, 0.22, 0, 0.18);
        wbox(T, F, t, 1.9, 0.11, 3.6, 0.04, 0.07); wbox(T, F, t, 4.6, 1.7, 0.11, 0.04, 0.07); for (const k of [-1, 1]) wbox(T, F, t + k*0.42, 1.9, 0.06, 2.7, 0.04, 0.05); }
      wquad(DK, F, t - 0.82, t + 0.82, 8.3, 11.4, 0.04); wbox(T, F, t, 8.1, 2.1, 0.2, 0, 0.18);
      wbox(T, F, t, 8.3, 0.11, 3.1, 0.04, 0.07); wbox(T, F, t, 10.3, 1.64, 0.1, 0.04, 0.07); for (const k of [-1, 1]) wbox(T, F, t + k*0.41, 8.3, 0.06, 3.1, 0.04, 0.05);
      wbox(T, F, t - 0.95, 8.3, 0.22, 3.1, 0, 0.1); wbox(T, F, t + 0.95, 8.3, 0.22, 3.1, 0, 0.1);
      if (i % 2) wped(T, F, t - 1.25, t + 1.25, 11.6, 0.75, 0, 0.22); else wbox(T, F, t, 11.6, 2.4, 0.35, 0, 0.24);
    }
    if (o.bal) { const posts = []; for (let i = 0; i <= nb; i++) posts.push(t0 + i*bw); balP(T, F, t0, t1, E1, 0, 1.15, posts); }
  };
  // a rectangular block: walls, plinth, facades on chosen sides, roof
  const block = (x0, z0, x1, z1, sides, o) => {
    o = o || {}; const P = rect(x0, z0, x1, z1), c = [(x0 + x1)/2, (z0 + z1)/2];
    prismP(W, P, -6, o.top || E1);
    const Fs = {n:WF([x0, z0], [x1, z0], c), s:WF([x1, z1], [x0, z1], c), w:WF([x0, z1], [x0, z0], c), e:WF([x1, z0], [x1, z1], c)};
    for (const k in sides) if (sides[k]) { const F = Fs[k]; facade(F, 0, F.L, sides[k], o); }
    return Fs;
  };
  // ---- front block (1887) ----
  const ZP0 = 27.0, ZP1 = 42.3, ZW0 = 28.6, ZW1 = 40.7;
  const pav = s => { const x0 = s < 0 ? AX - 36.95 : AX + 24.55, x1 = x0 + 12.4;
    const Fs = block(x0, ZP0, x1, ZP1, {s:3, n:3, [s < 0 ? 'w' : 'e']:3}, {bal:false});
    // pediment on the front (the Victorian coat of arms is left out), roof ridge running back from it
    const F = Fs.s; wped(T, F, -0.4, F.L + 0.4, E1, 3.7, 0, 0.7); wped(W, F, 0.6, F.L - 0.6, E1 + 0.42, 2.9, 0.05, 0.6);
    gableP(RF, W, (x0 + x1)/2, (ZP0 + ZP1)/2, ZP1 - ZP0 - 0.4, x1 - x0 + 0.4, E1, 3.7, HP, 0.2);
    const Fb = Fs[s < 0 ? 'w' : 'e']; balP(T, Fb, 0.3, Fb.L - 0.3, E1, 0, 1.15, [0.3, Fb.L - 0.3]);
    // paired corner pilasters
    for (const t of [0.35, F.L - 0.35]) { wbox(T, F, t, F0, 1.2, G1 - F0, 0, 0.4); wbox(T, F, t, S1, 1.1, U1 - S1, 0, 0.35); }
  };
  pav(-1); pav(1);
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? AX - 24.55 : AX + 11.2, x1 = s < 0 ? AX - 11.2 : AX + 24.55;
    block(x0, ZW0, x1, ZW1, {s:3, n:3}, {bal:true});
    hipP(RF, (x0 + x1)/2, (ZW0 + ZW1)/2, x1 - x0 + 0.2, ZW1 - ZW0 + 0.2, E1, 3.0, 0, 0);
  }
  // centre block with the rotunda and the carriage porch
  const XC0 = AX - 11.2, XC1 = AX + 11.2, ZC0 = 23.7, ZC1 = 45.4, CZ = 34.6;
  { const Fs = block(XC0, ZC0, XC1, ZC1, {s:5}, {door:true, top:E1 + 1.2});
    const F = Fs.s; wbox(W, F, F.L/2, E1, F.L, 1.6, 0, 0.3); // attic in front of the drum
    // porch: three arches in front, one each side; columned loggia above; pediment
    const px0 = AX - 7.5, px1 = AX + 7.5, pz1 = 52.2;
    prismP(W, rect(px0, ZC1, px1, pz1), -6, E1);
    const Fp = WF([px1, pz1], [px0, pz1], [AX, ZC1]), Fl = WF([px0, pz1], [px0, ZC1], [AX, ZC1]), Fr = WF([px1, ZC1], [px1, pz1], [AX, ZC1]);
    for (const [Fx, n] of [[Fp, 3], [Fl, 1], [Fr, 1]]) {
      const bw = Fx.L/n; wbox(ST, Fx, Fx.L/2, -6, Fx.L + 0.6, F0 + 6, 0, 0.32);
      for (let i = 0; i < n; i++){ const t = (i + 0.5)*bw; warch(DK, Fx, t, bw*0.62, F0, 5.8, 0.05); warchRing(T, Fx, t, bw*0.62, 5.8, 0.4, 0, 0.15); }
      for (let i = 0; i <= n; i++) wbox(T, Fx, i*bw, F0, 1.0, G1 - F0, 0, 0.35);
      wbox(T, Fx, Fx.L/2, G1, Fx.L + 0.7, S1 - G1, 0, 0.36);
      wquad(DK, Fx, 0.6, Fx.L - 0.6, S1 + 0.3, U1 - 0.2, 0.05);
      wbox(T, Fx, Fx.L/2, U1, Fx.L + 0.6, E1 - U1 - 0.4, 0, 0.25); wbox(T, Fx, Fx.L/2, E1 - 0.42, Fx.L + 1.2, 0.42, 0, 0.66);
    }
    // the loggia columns (paired, Corinthian-ish) standing in front of the dark recess
    for (const t of [0.7, 1.7, 5.2, 6.2, 8.8, 9.8, 13.3, 14.3]) { const c = Fp.P(t, 0, 0.5); LCyl(g, 0.34, 0.38, U1 - S1 - 0.6, c[0], S1, c[2], trim, 10); boxP(T, 0.95, 0.6, 0.95, c[0], U1 - 0.6, c[2]); }
    balP(T, Fp, 0.6, Fp.L - 0.6, S1 + 0.2, 0.55, 1.0, [0.6, 4.0, 11.0, 14.4]);
    wped(T, Fp, -0.5, Fp.L + 0.5, E1, 3.1, 0, 0.75); wped(W, Fp, 0.6, Fp.L - 0.6, E1 + 0.42, 2.4, 0.05, 0.6);
    // front steps down to the lawn
    for (let k = 0; k < 8; k++) boxP(ST, 19 - k*0.0, 0.5, 6.8 - k*0.75, AX, -4.1 + k*0.5, pz1 + 3.4 - k*0.375);
    // the rotunda: 16-sided drum with arched stained-glass windows, cornice, fish-scale zinc dome with ribs, lantern
    const RD = 8.2, Y0 = E1 + 0.4, Y1 = 18.9, nS = 16, glassS = {c:'#6d5a3e', glow:'#ffbe6a', gk:1.0}, DR = 6.5;
    latheP(W, [[RD, 0], [RD, Y1 - Y0]], AX, Y0, CZ, nS);
    for (let i = 0; i < nS; i++){ const a = (i + 0.5)/nS*TAU, ca = Math.cos(a), sa = Math.sin(a), ux = -sa, uz = ca;
      const Fd = {P:(t, y, d) => [AX + ca*(RD + (d || 0)) + ux*t, y, CZ + sa*(RD + (d || 0)) + uz*t], ry:Math.atan2(-uz, ux)};
      warch(B.p(glassS), Fd, 0, 1.3, Y0 + 0.75, Y1 - 0.55, 0.04); warchRing(T, Fd, 0, 1.3, Y1 - 0.55, 0.2, 0, 0.1);
      const b = i/nS*TAU, c0 = [AX + Math.cos(b)*RD, 0, CZ + Math.sin(b)*RD]; boxP(T, 0.7, Y1 - Y0, 0.7, c0[0], Y0, c0[2], -b); }
    latheP(T, [[RD + 0.1, 0], [RD + 0.75, 0.25], [RD + 0.75, 0.6], [RD, 0.6]], AX, Y1, CZ, 32);
    // the dome: a raised (slightly stilted) zinc dome, its fish-scale tiles read as alternating courses, 16 ribs, lantern
    const dome = []; for (let k = 0; k <= 14; k++){ const th = k/14*HP; dome.push([Math.max(0.01, (RD + 0.05)*Math.pow(Math.cos(th), 0.92)), 0.6 + DR*Math.sin(th)]); }
    for (let k = 0; k < 14; k++) latheP(B.p(k % 2 ? zinc : zinc2), [dome[k], dome[k + 1]], AX, Y1, CZ, 32);
    for (let i = 0; i < nS; i++){ const a = i/nS*TAU; const pts = dome.slice(0, 13).map(([r, y]) => [AX + Math.cos(a)*(r + 0.1), Y1 + y + 0.05, CZ + Math.sin(a)*(r + 0.1)]); for (let k = 0; k < pts.length - 1; k++) segP(B.p(zinc), pts[k], pts[k+1], 0.14, 4); }
    { const yl = Y1 + 0.6 + DR - 0.3;
      latheP(T, [[1.5, 0], [1.5, 0.3], [1.15, 0.3]], AX, yl, CZ, 16);
      for (let i = 0; i < 8; i++){ const a = (i + 0.5)/8*TAU; segP(T, [AX + Math.cos(a)*1.15, yl + 0.3, CZ + Math.sin(a)*1.15], [AX + Math.cos(a)*1.15, yl + 1.25, CZ + Math.sin(a)*1.15], 0.1, 4); }
      latheP(B.p(glassS), [[0.95, 0.3], [0.95, 1.25]], AX, yl, CZ, 8);
      latheP(T, [[1.35, 1.25], [1.35, 1.45], [0.7, 1.75], [0.12, 2.15], [0.05, 2.45]], AX, yl, CZ, 12); }
    latheP(B.p(zinc), [[RD + 0.1, 0], [RD + 0.1, 0.01]], AX, Y1 + 0.6, CZ, 32);
    // flat roof of the centre block and the corridor behind it (glass-roofed by W Architects)
    prismP(W, rect(AX - 4.6, 12.8, AX + 4.6, ZC0), -6, 12.6); gableP(B.p(glass), W, AX, (12.8 + ZC0)/2, 9.6, ZC0 - 12.8, 12.6, 2.2, HP, 0.2);
  }
  // ---- the 1907 rear range and the 1916 wing: two storeys, hipped tile roofs ----
  const RR = [[-89.3, -0.2], [77.1, -0.2], [77.1, 14.4], [53.9, 14.4], [53.9, 20.2], [42.5, 20.2], [42.5, 13.0], [-89.4, 13.0]];
  prismP(W, RR, -6, 13.2);
  { const Ff = WF([77.1, 14.4], [53.9, 14.4], [60, 5]), Fb = WF([-89.3, -0.2], [77.1, -0.2], [0, 6]), Ff2 = WF([42.5, 13.0], [-89.4, 13.0], [0, 6]), Fst = WF([53.9, 20.2], [42.5, 20.2], [48, 15]);
    const Fe = WF([77.1, -0.2], [77.1, 14.7], [0, 6]), Fw = WF([-89.4, 13.8], [-89.3, -0.2], [0, 6]);
    const simple = (F, t0, t1, nb) => { const bw = (t1 - t0)/nb;
      wbox(T, F, (t0 + t1)/2, 6.2, t1 - t0, 0.6, 0, 0.25); wbox(T, F, (t0 + t1)/2, 12.5, t1 - t0 + 0.4, 0.7, 0, 0.5); wbox(ST, F, (t0 + t1)/2, -6, t1 - t0, F0 + 6, 0, 0.3);
      for (let i = 0; i < nb; i++){ const t = t0 + (i + 0.5)*bw; warch(DK, F, t, 1.6, 1.9, 5.4, 0.04); wquad(DK, F, t - 0.75, t + 0.75, 7.9, 11.1, 0.04); wbox(T, F, t, 11.2, 2.0, 0.3, 0, 0.18);
        wbox(T, F, t, 1.9, 0.1, 3.5, 0.04, 0.06); wbox(T, F, t, 4.5, 1.6, 0.1, 0.04, 0.06); wbox(T, F, t, 7.9, 0.1, 3.2, 0.04, 0.06); wbox(T, F, t, 9.8, 1.5, 0.1, 0.04, 0.06); }
      for (let i = 0; i <= nb; i += 2) wbox(T, F, t0 + i*bw, F0, 0.7, 11.6, 0, 0.2); };
    simple(Ff, 0, Ff.L, 5); simple(Fe, 0, Fe.L, 3); simple(Fw, 0, Fw.L, 3); simple(Ff2, 0, Ff2.L, 28); simple(Fst, 0, Fst.L, 2); simple(Fb, 0, Fb.L, 36);
  }
  hipP(RF, -6.15, 6.6, 166.4, 13.6, 13.2, 3.4, 0, 0.35); hipP(RF, 48.2, 17.3, 11.4, 5.8, 13.2, 2.4, 0, 0.3);
  // ---- the 2006 extension towards Fort Canning ----
  const GL = B.p(glass), SL = B.p(steel);
  const glassBox = (P, y1, step) => {      // glass walls with white mullions and transoms, glass roof with beams
    wallsP(GL, P, F0, y1); capP(GL, P, y1); wallsP(ST, P, -6, F0);
    for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], L = Math.hypot(b[0]-a[0], b[1]-a[1]), n = Math.max(1, Math.round(L/step));
      for (let k = 0; k <= n; k++){ const x = lerp(a[0], b[0], k/n), z = lerp(a[1], b[1], k/n); segP(SL, [x, F0, z], [x, y1 + 0.3, z], 0.16, 4); }
      for (const y of [F0 + 3.6, y1 - 0.2]) segP(SL, [a[0], y, a[1]], [b[0], y, b[1]], 0.14, 4); }
  };
  const P8 = [[30.7, -0.2], [-41.2, -0.2], [-17.1, -28.9], [4.2, -28.5], [4.2, -13.7], [30.9, -13.1]];
  glassBox(P8, 11.2, 3.2);
  for (let x = -36; x < 30; x += 4.5) segP(SL, [x, 11.4, -0.2], [Math.max(x, x < -17 ? x : x), 11.4, x < -17 ? -0.2 - (x + 41.2)*1.19 : (x < 4.2 ? -28.7 : -13.4)], 0.22, 4);
  const P11 = [[-42.0, -0.2], [-41.8, -8.7], [-33.6, -11.1], [-28.8, -18.8], [-30.9, -29.1], [-17.1, -28.9], [-41.2, -0.2]];
  glassBox(P11, 10.2, 3.2);
  // Glass Rotunda: a 24 m glass drum round a steel-mesh drum, 16 m high
  { const cx = -41.2, cz = -21.6, R0 = 12.6;
    latheP(B.p({c:'#a9c6d2', op:0.42, glow:'#cfe6ff', gk:0.25}), [[R0, F0], [R0, 16.6]], cx, 0, cz, 28);
    latheP(B.p({c:mesh, glow:'#ffe2b8', gk:0.35}), [[10.4, F0], [10.4, 15.6]], cx, 0, cz, 24);
    latheP(B.p('#7f8588'), [[10.6, 15.6], [10.6, 15.9], [0.01, 16.4]], cx, 0, cz, 24);
    latheP(B.p({c:'#a9c6d2', op:0.42, glow:'#cfe6ff', gk:0.25}), [[R0, 16.6], [10.6, 16.0]], cx, 0, cz, 28);
    latheP(SL, [[R0 + 0.3, 16.3], [R0 + 0.3, 16.9], [R0 - 0.3, 16.9], [R0 - 0.3, 16.3]], cx, 0, cz, 28);
    latheP(ST, [[R0 + 0.3, -6], [R0 + 0.3, F0]], cx, 0, cz, 28);
    for (let i = 0; i < 28; i++){ const a = i/28*TAU, x = cx + Math.cos(a)*(R0 + 0.12), z = cz + Math.sin(a)*(R0 + 0.12); segP(SL, [x, F0, z], [x, 16.6, z], 0.13, 4); }
    for (const y of [5.6, 10.6]) latheP(SL, [[R0 + 0.2, y], [R0 + 0.2, y + 0.25]], cx, 0, cz, 28);
  }
  // the perforated-metal wing and the small pavilion beside it
  { const P0 = rect(4.2, -33.6, 64.2, -13.2); prismP(B.p(perf), P0, -6, 7.6); wallsP(ST, offP(P0, 0.05), -6, F0);
    for (let y = 2.2; y < 7.4; y += 1.3) wallsP(B.p('#a39d90'), offP(P0, 0.08), y, y + 0.18);
    const F = WF([64.2, -33.6], [4.2, -33.6], [30, -20]); for (let t = 3; t < 60; t += 6) wquad(DK, F, t, t + 3.2, F0, 3.6, 0.1);
    glassBox(rect(38.9, -46.5, 54.7, -33.6), 4.3, 3.2); }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'natmuseum', lat:1.296563, lon:103.848423, rot:2.2689});
}
}
