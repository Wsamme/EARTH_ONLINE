// ===== lm26/sgbugis: Bugis / Little India / Fort Canning / Dhoby Ghaut landmarks (City Brush v29, real Singapore 1:1) =====
// sgveeramakali  Sri Veeramakaliamman Temple (Serangoon Road): four-tier rajagopuram, striped compound walls, sculpted parapets,
//                eight vimana domes, the silver flagstaff, the 2014 six-storey annex behind.
// sgabdulgafoor  Masjid Abdul Gafoor (1907-10, Dunlop Street): raised prayer hall with cinquefoil-arched verandahs, the
//                onion-shaped pediment with the 25-ray sundial, two square minarets, 22 pencil minarets on the parapet, the
//                hexagonal three-level cupola with its onion domes; the madrasah extension.
// sgtantengniah  House of Tan Teng Niah (1900, Kerbau Road): the two-storey villa painted in rainbow colours, Chinese tiled
//                roofs, five-foot way under the front wing.
// sgkwanim       Kwan Im Thong Hood Cho Temple (Waterloo Street) with the Sri Krishnan Temple next door (and the plain
//                Waterloo View block between them, which the hull would otherwise hide).
// sglasalle      LASALLE College of the Arts, McNally campus (2007, RSP): six black blocks round a faceted glass "canyon"
//                under a gridded glass roof skin.
// sgfortcanning  Fort Canning Park: the Fort Gate (1859), Fort Canning Centre (1926 barracks) and the flagstaff + lighthouse
//                replicas at Raffles Terrace; each part sits on the real (app) terrain under it (hC in the app / kit).
// sgmacdonald    MacDonald House (1949, 40 Orchard Road): ten-storey red-brick block with white window frames and the
//                green glazed tile roof edge.
// One block; helpers inside. Only LANDMARKS and SG_PLACES are touched. Local frames: +z = the main front of each model.
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
// ---- Dravidian temple kit (gopuram tiers crowded with painted deities, miniature shrines, vimanas) ----
function DRV(B, V, R, M){
  const PAL = ['#3d6fd0', '#d23b2c', '#3e9b4b', '#e9c33b', '#f3efe5', '#e690a2', '#e8873b', '#5bb9e1', '#9a5cc6', '#2f8f8a', '#f3efe5', '#e9c33b'];
  const SKIN = ['#3a62c4', '#4f86d6', '#e2b08a', '#d39a6c', '#f0d2b4', '#3a62c4', '#59a8d8', '#e7a47e'];
  const ROBE = ['#d23b2c', '#e9c33b', '#3e9b4b', '#e690a2', '#e8873b', '#9a5cc6', '#2f8f8a', '#d23b2c', '#f3efe5', '#5bb9e1', '#c8462f', '#e9c33b'];
  const pk = A => A[Math.floor(R()*A.length)], pick = () => pk(PAL);
  const deity = (F, u, v, w0, h, big) => {
    const rb = pk(ROBE), sk = pk(SKIN), aw = big ? 0.36 : 0.3;
    vAdd(V, rb, t => { slabP(t, rectO(u - 0.17*h, u + 0.17*h, v, v + 0.6*h), F, w0, w0 + 0.2*h); slabP(t, [[u - 0.22*h, v], [u + 0.22*h, v], [u + 0.15*h, v + 0.25*h], [u - 0.15*h, v + 0.25*h]], F, w0 + 0.02, w0 + 0.24*h); });
    vAdd(V, sk, t => { slabP(t, rectO(u - aw*h, u + aw*h, v + 0.42*h, v + 0.53*h), F, w0 + 0.03*h, w0 + 0.15*h); slabP(t, rectO(u - 0.085*h, u + 0.085*h, v + 0.6*h, v + 0.78*h), F, w0 + 0.03*h, w0 + 0.17*h); });
    vAdd(V, '#e6be3c', t => slabP(t, [[u - 0.09*h, v + 0.78*h], [u + 0.09*h, v + 0.78*h], [u + 0.05*h, v + 0.92*h], [u, v + 1.0*h], [u - 0.05*h, v + 0.92*h]], F, w0 + 0.03*h, w0 + 0.16*h));
  };
  // miniature shrine on a cornice at height y: kuta (square, domed) or sala (barrel roofed), s = scale
  const mini = (x, y, z, a, big, s) => {
    s = s || 1; const col = pick();
    vAdd(V, col, t => {
      if (big){ boxP(t, 0.7*s, 0.32*s, 0.36*s, x, y, z, -a); const c = Math.cos(a), sn = Math.sin(a), P = []; for (let i = 0; i <= 6; i++){ const q = PI*i/6; P.push([Math.cos(q)*0.2*s, Math.sin(q)*0.24*s]); }
        for (let i = 0; i < 6; i++){ const p = P[i], q = P[i+1], hl = 0.35*s; quadP(t, [x - c*hl - sn*p[0], y + 0.32*s + p[1], z - sn*hl + c*p[0]], [x + c*hl - sn*p[0], y + 0.32*s + p[1], z + sn*hl + c*p[0]], [x + c*hl - sn*q[0], y + 0.32*s + q[1], z + sn*hl + c*q[0]], [x - c*hl - sn*q[0], y + 0.32*s + q[1], z - sn*hl + c*q[0]]); } }
      else { boxP(t, 0.36*s, 0.3*s, 0.36*s, x, y, z, -a); latheP(t, [[0.22*s, y + 0.3*s], [0.24*s, y + 0.4*s], [0.15*s, y + 0.56*s], [0.03*s, y + 0.68*s]], x, z, 6); }
    });
  };
  // gopuram: o = {GX, GZ (centre), GW, GD (base), y0 (plinth top), BH (base wall top), NT, W0, W1, D0, D1, hb0, hb1, CW (crown width)}; front +z
  function gopuram(o){
    const {GX, GZ, GW, GD} = o, GZ0 = GZ - GD/2, GZ1 = GZ + GD/2, k = o.k || 1;
    bxP(B.p(M.STONE), GX - GW/2 - 0.25, GX + GW/2 + 0.25, o.y0 - 1, o.y0 + 1.0*k, GZ0 - 0.25, GZ1 + 0.25);
    bxP(B.p(M.WALL), GX - GW/2, GX + GW/2, o.y0 + 1.0*k, o.BH, GZ0, GZ1);
    const dw = o.dw || 1.55, dh = o.dh || 4.6;
    for (const s of [1, -1]){
      const F = fZ(s > 0 ? GZ1 : GZ0, s, GX), yb = o.y0 + 1.0*k;
      shapeP(B.p(M.DARK), rectO(-dw, dw, yb, yb + dh + 0.4), F, 0.03);
      shapeP(B.p(M.DOOR), rectO(-dw + 0.15, -0.04, yb, yb + dh), F, 0.06); shapeP(B.p(M.DOOR), rectO(0.04, dw - 0.15, yb, yb + dh), F, 0.06);
      for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) for (const sx of [-1, 1]) boxP(B.p(M.GOLD), 0.09, 0.09, 0.09, GX + s*sx*(0.35 + j*0.27*dw/1.55), yb + 0.5 + i*dh/7, (s > 0 ? GZ1 : GZ0) + s*0.1);
      vAdd(V, '#e6be3c', t => slabP(t, [[-dw - 0.3, yb + dh + 0.3], [dw + 0.3, yb + dh + 0.3], [dw + 0.3, yb + dh + 0.65], [0.9, yb + dh + 0.65], [0, yb + dh + 1.0], [-0.9, yb + dh + 0.65], [-dw - 0.3, yb + dh + 0.65]], F, 0, 0.12));
      const nU = Math.max(1, Math.round((GW/2 - dw - 0.6)/1.25));
      for (let j = 0; j < nU; j++) for (const sg of [-1, 1]){ const u = sg*(dw + 0.95 + j*1.25); if (Math.abs(u) > GW/2 - 0.5) continue;
        vAdd(V, '#e6be3c', t => slabP(t, rectO(u - 0.5, u + 0.5, yb + 0.5, o.BH - 0.9), F, 0, 0.1)); shapeP(B.p(M.DARK), rectO(u - 0.4, u + 0.4, yb + 0.65, o.BH - 1.15), F, 0.12); deity(F, u, yb + 0.7, 0.1, Math.min(2.4, o.BH - yb - 1.9), true); }
      for (const u of [-GW/2 + 0.25, GW/2 - 0.25]) vAdd(V, '#e6be3c', t => slabP(t, rectO(u - 0.15, u + 0.15, yb, o.BH), F, 0, 0.14));
      boxP(B.p(M.LAMP), 0.3, 0.45, 0.3, GX - s*(dw + 0.35), yb + dh, (s > 0 ? GZ1 : GZ0) + s*0.35);
      boxP(B.p(M.LAMP), 0.3, 0.45, 0.3, GX + s*(dw + 0.35), yb + dh, (s > 0 ? GZ1 : GZ0) + s*0.35);
    }
    for (const s of [1, -1]){ const F = fX(GX + s*GW/2, s, GZ); for (const u of [-GD/4, GD/4]){ shapeP(B.p(M.DARK), rectO(u - 0.4, u + 0.4, o.y0 + 1.6, o.BH - 1.2), F, 0.04); deity(F, u, o.y0 + 1.7, 0.05, Math.min(2.4, o.BH - o.y0 - 3), true); } }
    vAdd(V, '#c8462f', t => frustP(t, GX, GZ, GW + 0.5, GD + 0.5, GW + 0.8, GD + 0.8, o.BH, 0.3));
    vAdd(V, '#e6be3c', t => frustP(t, GX, GZ, GW + 0.8, GD + 0.8, GW + 0.5, GD + 0.5, o.BH + 0.3, 0.25));
    let y = o.BH + 0.55;
    for (let i = 0; i < o.NT; i++){
      const f = o.NT > 1 ? i/(o.NT - 1) : 0, W = lerp(o.W0, o.W1, f), D = lerp(o.D0, o.D1, f), hb = lerp(o.hb0, o.hb1, f), Wt = W - 0.34*k, Dt = D - 0.22*k, fh = hb*0.78;
      vAdd(V, i % 2 ? '#f1e3c6' : '#f4dcc0', t => frustP(t, GX, GZ, W, D, Wt, Dt, y, hb));
      for (const [F, len, fr] of [[fZ(GZ + D/2, 1, GX), W, 1], [fZ(GZ - D/2, -1, GX), W, 1], [fX(GX + W/2, 1, GZ), D, 0], [fX(GX - W/2, -1, GZ), D, 0]]){
        const n = Math.max(2, Math.round((len - 0.4)/(0.62*k)));
        for (let j = 0; j < n; j++){ const u = -len/2 + 0.2 + (j + 0.5)*(len - 0.4)/n; if (fr && Math.abs(u) < 0.62*k) continue; deity(F, u, y + 0.08, 0.02, fh*(0.88 + 0.12*R()), j === 0 || j === n - 1); }
        for (const u of [-len/2 + 0.1, len/2 - 0.1]) vAdd(V, '#e6be3c', t => slabP(t, rectO(u - 0.1, u + 0.1, y, y + hb), F, 0, 0.1));
        if (fr){ shapeP(B.p(M.DARK), mv(rArchO(0.36*k, 1.05*hb/1.6), 0, y + 0.12), F, 0.06); vAdd(V, '#e6be3c', t => slabP(t, mv(rArchO(0.55*k, 1.25*hb/1.6), 0, y + 0.05), F, 0, 0.05)); }
      }
      vAdd(V, i % 2 ? '#c8462f' : '#2f6fbf', t => frustP(t, GX, GZ, Wt + 0.55, Dt + 0.55, Wt + 0.75, Dt + 0.75, y + hb, 0.22));
      vAdd(V, '#e6be3c', t => frustP(t, GX, GZ, Wt + 0.75, Dt + 0.75, Wt + 0.6, Dt + 0.6, y + hb + 0.22, 0.08));
      y += hb + 0.3;
      const Wp = Wt + 0.45, Dp = Dt + 0.45;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) mini(GX + sx*(Wp/2 - 0.2), y, GZ + sz*(Dp/2 - 0.2), 0, false, k);
      for (const sz of [-1, 1]){ const n = Math.max(1, Math.round((Wp - 0.8)/(0.9*k))); for (let j = 0; j < n; j++){ const u = -Wp/2 + 0.4 + (j + 0.5)*(Wp - 0.8)/n; mini(GX + u, y, GZ + sz*(Dp/2 - 0.2), 0, j % 2 === 0, k); } }
      for (const sx of [-1, 1]){ const n = Math.max(1, Math.round((Dp - 0.8)/(0.9*k))); for (let j = 0; j < n; j++){ const u = -Dp/2 + 0.4 + (j + 0.5)*(Dp - 0.8)/n; mini(GX + sx*(Wp/2 - 0.2), y, GZ + u, HP, j % 2 === 0, k); } }
      y += 0.12;
    }
    // crowning sala: barrel vault along the front, horseshoe gable ends, gold kalasams
    { const W = o.CW, D = o.CD || W*0.58, VL = W + 0.3, VR = (o.VR || 1.05)*k, nk = o.nk || 7;
      vAdd(V, '#f1e3c6', t => frustP(t, GX, GZ, W, D, W - 0.1, D - 0.1, y, 0.45*k));
      for (const [F, len] of [[fZ(GZ + D/2, 1, GX), W], [fZ(GZ - D/2, -1, GX), W]]) for (let j = 0; j < 6; j++){ const u = -len/2 + 0.35 + (j + 0.5)*(len - 0.7)/6; deity(F, u, y + 0.02, 0.02, 0.42*k, false); }
      vAdd(V, '#c8462f', t => frustP(t, GX, GZ, W + 0.2, D + 0.2, W + 0.3, D + 0.3, y + 0.45*k, 0.15));
      const yv = y + 0.45*k + 0.15, AR = [];
      for (let i = 0; i <= 12; i++){ const q = PI*i/12; AR.push([Math.cos(q)*VR, Math.sin(q)*VR*1.25]); }
      vAdd(V, '#e3b43c', t => { for (let i = 0; i < 12; i++){ const p = AR[i], q = AR[i+1]; quadP(t, [GX - VL/2, yv + p[1], GZ + p[0]], [GX + VL/2, yv + p[1], GZ + p[0]], [GX + VL/2, yv + q[1], GZ + q[0]], [GX - VL/2, yv + q[1], GZ + q[0]]); } });
      for (let j = 0; j < 5; j++){ const x = GX - VL/2 + 0.6 + j*(VL - 1.2)/4; vAdd(V, j % 2 ? '#2f6fbf' : '#d23b2c', t => { for (let i = 0; i < 12; i++){ const p = AR[i], q = AR[i+1]; quadP(t, [x - 0.12, yv + p[1]*1.02, GZ + p[0]*1.02], [x + 0.12, yv + p[1]*1.02, GZ + p[0]*1.02], [x + 0.12, yv + q[1]*1.02, GZ + q[0]*1.02], [x - 0.12, yv + q[1]*1.02, GZ + q[0]*1.02]); } }); }
      for (const sx of [-1, 1]){ const P = AR.map(p => [p[0]*1.45, p[1]*1.4]); const Fx = fX(GX + sx*VL/2, sx, GZ);
        vAdd(V, '#d0462e', t => slabP(t, P.map(p => [p[0], p[1] + yv - 0.05]), Fx, -0.05, 0.12));
        vAdd(V, '#e3b43c', t => slabP(t, P.map(p => [p[0]*0.75, p[1]*0.75 + yv]), Fx, 0.12, 0.2));
        vAdd(V, '#3e9b4b', t => slabP(t, [[-0.3*k, yv + 0.25*k], [0.3*k, yv + 0.25*k], [0.35*k, yv + 0.75*k], [0, yv + 1.0*k], [-0.35*k, yv + 0.75*k]], Fx, 0.2, 0.3)); }
      const y0 = yv + VR*1.25 - 0.06;
      for (let j = 0; j < nk; j++){ const x = GX - VL/2 + 0.35 + j*(VL - 0.7)/(nk - 1);
        latheP(B.p(M.GOLD), [[0.13*k, y0], [0.24*k, y0 + 0.12*k], [0.28*k, y0 + 0.3*k], [0.18*k, y0 + 0.48*k], [0.07*k, y0 + 0.56*k], [0.13*k, y0 + 0.66*k], [0.02, y0 + 1.0*k]], x, GZ, 8); }
      return y0 + 1.0*k;
    }
  }
  // vimana standing on a roof at y0: square base block (hw tall), tiers, dome, kalasam
  function vimana(cx, cz, w, d, y0, hw, tiers, gold){
    bxP(B.p(M.WALL), cx - w/2, cx + w/2, y0 - 0.3, y0 + hw, cz - d/2, cz + d/2);
    vAdd(V, '#c8462f', t => bxP(t, cx - w/2 - 0.2, cx + w/2 + 0.2, y0 + hw, y0 + hw + 0.3, cz - d/2 - 0.2, cz + d/2 + 0.2));
    for (const s of [1, -1]){ for (const F of [fX(cx + s*w/2, s, cz), fZ(cz + s*d/2, s, cx)]){ vAdd(V, pick(), t => slabP(t, rectO(-0.3, 0.3, y0 + 0.2, y0 + hw - 0.2), F, 0, 0.25)); } }
    let yy = y0 + hw + 0.3, ww = w - 0.4, dd = d - 0.4;
    for (let i = 0; i < tiers; i++){
      const h = 1.2;
      vAdd(V, i % 2 ? '#f1e3c6' : '#f2d6b4', t => frustP(t, cx, cz, ww, dd, ww - 0.3, dd - 0.3, yy, h));
      for (const [F, len] of [[fZ(cz + dd/2, 1, cx), ww], [fZ(cz - dd/2, -1, cx), ww], [fX(cx + ww/2, 1, cz), dd], [fX(cx - ww/2, -1, cz), dd]]){
        const n = Math.max(2, Math.round(len/0.65)); for (let j = 0; j < n; j++){ const u = -len/2 + (j + 0.5)*len/n; vAdd(V, pick(), t => slabP(t, rectO(u - 0.17, u + 0.17, yy + 0.18, yy + 0.85), F, 0, 0.2)); } }
      vAdd(V, i % 2 ? '#2f6fbf' : '#c8462f', t => frustP(t, cx, cz, ww + 0.2, dd + 0.2, ww + 0.35, dd + 0.35, yy + h, 0.22));
      yy += h + 0.22;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) mini(cx + sx*(ww/2 - 0.05), yy, cz + sz*(dd/2 - 0.05), 0, false);
      for (const sz of [-1, 1]) mini(cx, yy, cz + sz*(dd/2 - 0.05), 0, true);
      for (const sx of [-1, 1]) mini(cx + sx*(ww/2 - 0.05), yy, cz, HP, true);
      yy += 0.45; ww -= 1.0; dd -= 1.0;
    }
    const r = Math.max(0.55, (Math.min(ww, dd)/2 + 0.2)*0.72);
    vAdd(V, '#e6be3c', t => latheP(t, [[r*0.8, yy], [r*0.8, yy + 0.5], [r*1.05, yy + 0.6]], cx, cz, 8, PI/8));
    const DOME = [[r*1.05, 0], [r*1.25, r*0.35], [r*1.22, r*0.75], [r*0.95, r*1.15], [r*0.5, r*1.45], [r*0.12, r*1.6], [0, r*1.62]];
    if (gold) latheP(B.p(M.GOLD), DOME.map(p => [p[0], p[1] + yy + 0.6]), cx, cz, 8, PI/8);
    else vAdd(V, '#e6be3c', t => latheP(t, DOME.map(p => [p[0], p[1] + yy + 0.6]), cx, cz, 8, PI/8));
    const yk = yy + 0.6 + r*1.6;
    latheP(B.p(M.GOLD), [[0.14, yk], [0.24, yk + 0.12], [0.27, yk + 0.3], [0.16, yk + 0.46], [0.06, yk + 0.55], [0.11, yk + 0.65], [0.02, yk + 1.0]], cx, cz, 8);
    return yk + 1.0;
  }
  // red-and-white striped compound wall faces along a polygon's edges (temple walls), y0..y1, stripe width sw
  function stripes(P, y0, y1, sw, skip){
    for (const E of edgesF(P)){ if (skip && skip(E)) continue; const n = Math.max(1, Math.round(E.L/(2*sw)));
      for (let j = 0; j < n; j++){ const u0 = (j + 0.25)*E.L/n, u1 = (j + 0.75)*E.L/n; vAdd(V, '#c23a2a', t => shapeP(t, rectO(u0, u1, y0, y1), E.F, 0.04)); } }
  }
  return {deity, mini, gopuram, vimana, stripes, pick, pk};
}

// ================= Sri Veeramakaliamman Temple (1881; rebuilt 1983-87; annex 2014), 141 Serangoon Road =================
// Real footprint (OSM): the temple (~23 m on Serangoon Road x 27 m) and the six-storey annex behind it. The four-tier
// rajagopuram stands over the entrance on Serangoon Road; red-and-white striped compound walls; the hall roof carries a
// parapet of miniature shrines and eight vimana domes (Kali's sanctum the largest, Ganesha and Murugan beside it); the
// silver flagstaff in the light court behind the gopuram. Local frame: +z = ESE (Serangoon Road front), +x = NNE.
LANDMARKS.sgveeramakali = {zh:'维拉马卡里亚曼兴都庙', en:'Sri Veeramakaliamman Temple', cat:'old', r:30, h:22.5,
  lt:{m:0, c:'#ffd9a8', k:1.0, e:0.55, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), V = mkV(), R = LMCTX.rng;
    const M = {STONE:'#a69e8e', WALL:'#f2e8d2', GOLD:{c:'#d9a93f', lc:'#ffd27e', lk:1.3}, DOOR:'#5b3b22', DARK:'#3a2f29', LAMP:{c:'#fff2cc', glow:'#ffd890', gk:1.8}};
    const D = DRV(B, V, R, M);
    const ROOF = '#bfb39a', PAVE = '#cbc4b4', ANX = '#efe3c8', GLASS = {c:'#2e3238', glow:'#ffcf8a', gk:0.35}, SILVER = {c:'#dfe3e8', lc:'#fff4dc', lk:1.4};
    const RM = [[8.66, -2.16], [8.4, 15.46], [14.8, 15.77], [14.61, 23.5], [-8.24, 23.51], [-10.31, 21.26], [-10.11, -3.35]];
    const RA = [[-10.11, -3.35], [-9.37, -22.67], [-3.94, -27.39], [9.17, -24.15], [8.66, -2.16]];
    const HW = 6.4;                                       // hall wall top
    // ---- foundations and the temple hall: striped outer walls, cornices, flat roof, parapet of shrines and Nandi ----
    wallP(B.p(M.STONE), RM, -5, 0.5); wallP(B.p(M.STONE), RA, -5, 0.5);
    wallP(B.p(M.STONE), RM, 0.5, 1.1);
    wallP(B.p(M.WALL), offP(RM, 0.1), 1.1, HW);
    D.stripes(offP(RM, 0.1), 1.3, 4.6, 0.42, E => Math.abs(E.a[1] - 23.5) < 0.2 && Math.abs(E.b[1] - 23.5) < 0.2 && false);
    vAdd(V, '#c8462f', t => parP(t, offP(RM, -0.15), HW - 0.6, HW - 0.25, 0.5));
    vAdd(V, '#e6be3c', t => parP(t, offP(RM, -0.25), HW - 0.25, HW + 0.1, 0.6));
    const RI = offP(RM, 0.3);
    // roof with an open light court behind the gopuram (the silver flagstaff stands in it)
    capP(B.p(ROOF), [[-9.6, -2.8], [8.3, -2.6], [8.1, 15.0], [-9.8, 15.0]], HW);
    capP(B.p(ROOF), [[5.0, 15.0], [14.3, 15.3], [14.2, 23.1], [5.0, 23.1]], HW);
    capP(B.p(ROOF), [[-7.9, 15.0], [-6.2, 15.0], [-6.2, 23.1], [-7.9, 23.1], [-9.9, 21.1]], HW);
    capP(B.p(PAVE), [[-6.2, 15.0], [5.0, 15.0], [5.0, 17.0], [-6.2, 17.0]], 0.55);
    parP(B.p(M.WALL), RI, HW, HW + 0.9, 0.35);
    vAdd(V, '#2f6fbf', t => parP(t, offP(RI, -0.05), HW + 0.9, HW + 1.1, 0.45));
    let k = 0;
    for (const [x, z, a, L] of alongP(offP(RI, 0.25), 1.5)){
      if (L < 0.9 || (z > 16.2 && x > -6.5 && x < 5.3)) continue;
      if (k++ % 4 === 0){ const c = Math.cos(a), s = Math.sin(a), o = B.p('#f4f0e6'), y = HW + 1.1;      // seated Nandi
        boxP(o, 1.0, 0.42, 0.5, x, y, z, -a); const hx = x + c*0.6, hz = z + s*0.6; boxP(o, 0.3, 0.32, 0.26, hx, y + 0.35, hz, -a); boxP(o, 0.34, 0.3, 0.3, x - c*0.15, y + 0.42, z - s*0.15, -a); }
      else D.mini(x, HW + 1.1, z, a, k % 2 === 0, 1.25);
    }
    // ---- the four-tier rajagopuram on Serangoon Road ----
    const top = D.gopuram({GX:-0.6, GZ:20.25, GW:10.4, GD:6.5, y0:0.5, BH:7.2, NT:4, W0:9.6, W1:6.0, D0:5.8, D1:3.7, hb0:1.95, hb1:1.55, CW:4.9, CD:2.7, VR:1.15, k:1.12, dw:1.7, dh:4.9});
    // ---- silver flagstaff (dhvaja stambha) in the light court ----
    latheP(B.p(M.STONE), [[1.0, 0.55], [1.0, 1.1], [0.7, 1.3], [0.55, 1.9]], -0.6, 16.0, 8, PI/8);
    latheP(B.p(SILVER), [[0.26, 1.9], [0.2, 10.6], [0.4, 10.75], [0.06, 11.4]], -0.6, 16.0, 10);
    for (let j = 0; j < 6; j++) latheP(B.p(SILVER), [[0.34, 2.2 + j*1.35], [0.34, 2.38 + j*1.35]], -0.6, 16.0, 10);
    for (const s of [-1, 1]) segP(B.p(SILVER), [-0.6, 10.2, 16.0], [-0.6 + s*0.6, 10.4, 16.0], 0.05, 4);
    // ---- vimanas: Kali's sanctum (largest, gold dome), Ganesha, Murugan, smaller shrines (eight domes in all) ----
    D.vimana(-0.6, 3.2, 6.4, 6.4, HW, 2.2, 2, true);
    D.vimana(-6.6, 8.6, 3.6, 3.6, HW, 1.6, 1, true);
    D.vimana(5.2, 8.6, 3.6, 3.6, HW, 1.6, 1, true);
    for (const [x, z, w] of [[-7.4, 0.4, 2.4], [6.2, 0.4, 2.4], [-7.4, 12.6, 2.2], [6.2, 12.6, 2.2], [11.4, 19.4, 2.6]]) D.vimana(x, z, w, w, HW, 1.0, 1, false);
    // small arched windows along the side walls under the cornice
    for (const E of edgesF(offP(RM, 0.1))){ if (E.L < 3) continue; const n = Math.floor(E.L/3.2);
      for (let j = 0; j < n; j++){ const u = (j + 0.5)*E.L/n; shapeP(B.p(M.DARK), mv(rArchO(0.45, 1.4), u, 4.75), E.F, 0.06); } }
    // ---- the 2014 annex: six storeys, cream walls, red and gold cornices at each floor, windows, roof kiosks ----
    const RAi = offP(RA, 0.2), AH = 20.6;
    wallP(B.p(ANX), RAi, 0.5, AH); capP(B.p(ROOF), RAi, AH - 0.2);
    for (let f = 0; f < 6; f++){ const y = 0.5 + f*3.35; if (f) vAdd(V, f % 2 ? '#c8462f' : '#e6be3c', t => parP(t, offP(RAi, -0.15), y - 0.18, y + 0.12, 0.3));
      for (const E of edgesF(RAi)){ if (E.L < 3 || E.a[1] > -3.5 && E.b[1] > -3.5) continue; const n = Math.floor(E.L/3.0);
        for (let j = 0; j < n; j++){ const u = (j + 0.5)*E.L/n; shapeP(B.p(GLASS), f === 0 ? mv(rArchO(0.6, 2.3), u, y + 0.3) : rectO(u - 0.7, u + 0.7, y + 0.8, y + 2.6), E.F, 0.05); } } }
    vAdd(V, '#c8462f', t => parP(t, offP(RAi, -0.2), AH - 0.3, AH + 0.1, 0.5));
    parP(B.p(ANX), RAi, AH + 0.1, AH + 1.0, 0.3);
    for (const [x, z] of [[-8.3, -21.4], [7.5, -22.6], [-8.6, -4.3], [7.4, -3.5]]){ bxP(B.p(ANX), x - 0.7, x + 0.7, AH, AH + 1.0, z - 0.7, z + 0.7); vAdd(V, '#e6be3c', t => latheP(t, [[0.75, AH + 1.0], [0.8, AH + 1.2], [0.55, AH + 1.55], [0.22, AH + 1.8], [0.04, AH + 1.95]], x, z, 8, PI/8)); }
    B.flush(g); vFlush(g, V);
    return g;
  }};
SG_PLACES.push({type:'sgveeramakali', lat:1.307981, lon:103.852309, rot:1.0225});

// ================= Masjid Abdul Gafoor (1907-10; restored 2003), 41 Dunlop Street =================
// Set behind the endowment shophouses, reached from Dunlop Street through a gate and courtyard. Raised prayer hall with
// verandahs on the front and sides behind arcades of cinquefoil arches (graduated, the largest beside the door); the main
// entrance under an onion-shaped pediment holding the sundial with 25 calligraphic rays (one for each prophet), flanked by
// two square minarets; simple cupolas on the verandah corners; a row of 22 slender six-stage minarets with onion tops along
// the roof-deck parapet; the hexagonal three-level cupola with corner minarets, a large onion dome and a smaller one above
// with the star and crescent. Creamy yellow walls, forest-green trim, white plasterwork. The two-storey madrasah extension
// fills the rest of the plot. Local frame: +z = NE (front towards the Dunlop Street gate), +x = NW.
LANDMARKS.sgabdulgafoor = {zh:'阿都卡夫回教堂', en:'Masjid Abdul Gafoor', cat:'old', r:26, h:21,
  lt:{m:0, c:'#ffe2b4', k:1.0, e:0.5, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), V = mkV();
    const WALL = '#efd78e', TRIM = '#f7f3e6', GRN = '#2f6a3c', DOME = '#3f8a4f', BASE = '#d6ccb2', DECK = '#bdb5a2', DARK = '#2a2925',
      GOLD = {c:'#d9b048', lc:'#ffe0a0', lk:1.2}, LAMP = {c:'#fff2cc', glow:'#ffe0a0', gk:1.6}, WIN = {c:'#3a4a3c', glow:'#ffd9a0', gk:0.45};
    const RING = [[-20.16, 14.97], [-19.68, -15.0], [20.16, -14.97], [19.68, 15.0]];
    const MX0 = -19.6, MX1 = 4.6, MZ0 = -12.0, MZ1 = 14.6, EX = -7.5;            // main block, entrance axis x = EX
    const HX0 = -16.4, HX1 = 1.4, HZ0 = -12.0, HZ1 = 11.2;                        // prayer hall inside the verandahs
    const FL = 1.7, VT = 6.9, HT = 9.3;                                            // floor, verandah top, hall roof deck
    // ---- plinth (raised floor over the basement) ----
    wallP(B.p(BASE), RING, -5, 0.4); capP(B.p('#cfc8b8'), RING, 0.4);
    bxP(B.p(BASE), MX0, MX1, 0.3, FL, MZ0, MZ1);
    for (let i = 0; i < 6; i++) bxP(B.p(TRIM), EX - 2.4 + i*0.0, EX + 2.4, 0.3 + i*0.24, 0.54 + i*0.24, MZ1 + 1.6 - i*0.27, MZ1 + 1.87 - i*0.27);   // entrance steps
    // ---- prayer hall block and roof deck ----
    bxP(B.p(WALL), HX0, HX1, FL, HT, HZ0, HZ1); capP(B.p(DECK), rectXZ(HX0, HX1, HZ0, HZ1), HT + 0.01);
    bxP(B.p(TRIM), HX0 - 0.2, HX1 + 0.2, HT - 0.35, HT, HZ0 - 0.2, HZ1 + 0.2);
    parP(B.p(WALL), rectXZ(HX0 - 0.1, HX1 + 0.1, HZ0 - 0.1, HZ1 + 0.1), HT, HT + 0.9, 0.3);
    parP(B.p(GRN), rectXZ(HX0 - 0.15, HX1 + 0.15, HZ0 - 0.15, HZ1 + 0.15), HT + 0.9, HT + 1.05, 0.4);
    // hall windows (stained glass) above the verandah roofs and on the rear
    for (const [F, L, c] of [[fX(HX0, -1, (HZ0 + HZ1)/2), HZ1 - HZ0, VT], [fX(HX1, 1, (HZ0 + HZ1)/2), HZ1 - HZ0, VT], [fZ(HZ1, 1, (HX0 + HX1)/2), HX1 - HX0, VT], [fZ(HZ0, -1, (HX0 + HX1)/2), HX1 - HX0, 2.4]]){
      const n = Math.floor(L/3.0); for (let j = 0; j < n; j++){ const u = -L/2 + (j + 0.5)*L/n; if (c === VT && Math.abs(u) < 1 && F === null) continue;
        shapeP(B.p(WIN), mv(ogArchO(0.55, c === VT ? 1.8 : 3.6), u, c === VT ? VT + 0.3 : 2.6), F, 0.05); shapeP(B.p(GRN), mv(ogArchO(0.72, c === VT ? 2.05 : 3.9), u, c === VT ? VT + 0.2 : 2.5), F, 0.02); } }
    // ---- verandahs: arcades of cinquefoil arches on the front and the sides ----
    const cinq = (hw, ht, n) => { const P = [[-hw, 0], [hw, 0], [hw, ht - hw]]; n = n || 30;
      for (let i = 1; i < n; i++){ const th = PI*i/n, r = hw*(1 - 0.16*(1 - Math.abs(Math.sin(5*th)))); P.push([Math.cos(th)*r, ht - hw + Math.sin(th)*r*1.05]); }
      P.push([-hw, ht - hw]); return P; };
    capP(B.p(DECK), [[MX0, MZ0], [MX1, MZ0], [MX1, MZ1], [MX0, MZ1]], VT + 0.55);
    const arcade = (F, L, spans, y0, y1) => {                                 // spans: [[u, hw], ...]: openings along a facade
      const o = B.p(WALL); let u0 = 0;
      for (const [u, hw] of spans){ const ht = y1 - y0 - 0.9;
        shapeP(B.p(DARK), mv(cinq(hw, ht), u, y0), F, 0.25);
        slabP(B.p(TRIM), mv(cinq(hw + 0.18, ht + 0.18), u, y0), F, 0.0, 0.18);
        u0 = u + hw; }
    };
    const pierRow = (F, L, spans, y0, y1) => { // solid piers between the openings + entablature
      const o = B.p(WALL), cuts = [[-1e3, -L/2], ...spans.map(([u, hw]) => [u - hw - 0.18, u + hw + 0.18]), [L/2, 1e3]];
      for (let i = 0; i < cuts.length - 1; i++){ const a = cuts[i][1], b = cuts[i+1][0]; if (b - a > 0.05){ slabP(o, rectO(a, b, y0, y1 - 0.9), F, -0.4, 0.15); slabP(B.p(TRIM), rectO((a + b)/2 - 0.22, (a + b)/2 + 0.22, y0, y1 - 0.9), F, 0.15, 0.3); } }
      slabP(o, rectO(-L/2, L/2, y1 - 0.9, y1), F, -0.4, 0.15);
      slabP(B.p(TRIM), rectO(-L/2 - 0.1, L/2 + 0.1, y1 - 0.18, y1 + 0.05), F, 0.15, 0.32);
      slabP(B.p(GRN), rectO(-L/2, L/2, y1 - 0.65, y1 - 0.45), F, 0.15, 0.2);
      // balustrade parapet with round openings
      slabP(B.p(TRIM), rectO(-L/2, L/2, y1 + 0.05, y1 + 0.95), F, -0.2, 0.12);
      for (let u = -L/2 + 0.6; u < L/2 - 0.4; u += 0.9) shapeP(B.p(GRN), circ(0.22, 8).map(p => [p[0] + u, p[1] + y1 + 0.5]), F, 0.14);
    };
    const FW = MX1 - MX0;
    // front: entrance (EX) wide, two graduated arches each side, corner bays
    const fspans = [[0, 1.55], [-3.35, 1.25], [-6.05, 1.05], [3.35, 1.25], [6.05, 1.05], [-9.5, 0.95], [9.5, 0.95]].map(([u, hw]) => [u + (EX - (MX0 + MX1)/2), hw]);
    const Ff = fZ(MZ1, 1, (MX0 + MX1)/2);
    pierRow(Ff, FW, fspans, FL, VT); arcade(Ff, FW, fspans, FL, VT);
    for (const [F, L, cz] of [[fX(MX0, -1, (MZ0 + MZ1)/2), MZ1 - MZ0], [fX(MX1, 1, (MZ0 + MZ1)/2), MZ1 - MZ0]]){
      const sp = []; const n = 8; for (let j = 0; j < n; j++) sp.push([-L/2 + (j + 0.5)*L/n, 1.05]);
      pierRow(F, L, sp, FL, VT); arcade(F, L, sp, FL, VT); }
    // ---- the entrance pediment: onion-dome outline holding the 25-ray sundial; star and crescent above ----
    { const F = fZ(MZ1 + 0.35, 1, EX), y0 = VT - 0.2, PW = 3.0, PH = 6.8;
      const ON = []; for (let i = 0; i <= 24; i++){ const t = i/24, a = PI*t; const r = PW*(Math.sin(a)*0.62 + 0.38*Math.pow(Math.sin(a), 3)) * (1 - 0.0*t); }
      const prof = [[PW*0.82, 0], [PW*1.0, 1.4], [PW*1.02, 2.4], [PW*0.86, 3.5], [PW*0.55, 4.6], [PW*0.22, 5.6], [PW*0.08, 6.2], [0, PH]];
      const OUT = [...prof.map(p => [p[0], p[1] + y0]), ...prof.slice(0, -1).reverse().map(p => [-p[0], p[1] + y0])];
      slabP(B.p(WALL), OUT, F, -0.3, 0.2);
      slabP(B.p(TRIM), OUT.map(p => [p[0]*1.06, (p[1] - y0)*1.03 + y0 - 0.05]), F, -0.3, 0.12);
      const cy = y0 + 1.1, RR = 2.35;
      for (let i = 0; i < 25; i++){ const a0 = PI*(i + 0.1)/25, a1 = PI*(i + 0.9)/25;
        vAdd(V, i % 2 ? '#2f6a3c' : '#d9b048', t => shapeP(t, [[Math.cos(a0)*0.75, cy + Math.sin(a0)*0.75], [Math.cos(a0)*RR, cy + Math.sin(a0)*RR], [Math.cos(a1)*RR, cy + Math.sin(a1)*RR], [Math.cos(a1)*0.75, cy + Math.sin(a1)*0.75]], F, 0.24)); }
      vAdd(V, '#e6c25a', t => shapeP(t, semi(0.7, 12).map(p => [p[0], p[1] + cy]), F, 0.26));
      vAdd(V, '#2f6a3c', t => shapeP(t, rectO(-2.5, 2.5, cy - 0.32, cy - 0.05), F, 0.25));
      for (const s of [-1, 1]){ slabP(B.p(TRIM), rectO(s*2.75 - 0.18, s*2.75 + 0.18, y0, y0 + 2.6), F, 0.2, 0.45); }   // small Corinthian columns
      shapeP(B.p(GRN), rectO(-1.6, 1.6, VT - 1.2, VT - 0.5), F, 0.3);                // calligraphy panel over the door
      const yt = y0 + PH; latheP(B.p(GOLD), [[0.05, yt - 0.1], [0.05, yt + 0.6]], EX, MZ1 + 0.4, 4);
      slabP(B.p(GOLD), CRES.map(p => [p[0]*0.55, p[1]*0.55 + yt + 0.95]), F, 0.38, 0.46); }
    // ---- two square minarets beside the entrance; simple cupolas on the verandah corners ----
    const minaret = (x, z, w, y0, h, stages, rd) => {
      for (let i = 0; i < stages; i++){ const a = y0 + h*i/stages, b = y0 + h*(i + 1)/stages, ww = w*(1 - 0.08*i);
        bxP(B.p(WALL), x - ww/2, x + ww/2, a, b, z - ww/2, z + ww/2);
        bxP(B.p(TRIM), x - ww/2 - 0.08, x + ww/2 + 0.08, b - 0.16, b, z - ww/2 - 0.08, z + ww/2 + 0.08);
        if (i > 0) for (const F of [fZ(z + ww/2, 1, x), fZ(z - ww/2, -1, x), fX(x + ww/2, 1, z), fX(x - ww/2, -1, z)]) shapeP(B.p(GRN), mv(ogArchO(ww*0.2, (b - a)*0.6), 0, a + (b - a)*0.18), F, 0.03); }
      const yt = y0 + h, wt = w*(1 - 0.08*stages);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) latheP(B.p(TRIM), [[0.07, yt], [0.07, yt + 0.9]], x + sx*wt*0.38, z + sz*wt*0.38, 4);
      latheP(B.p(TRIM), [[wt*0.62, yt + 0.9], [wt*0.62, yt + 1.05]], x, z, 8, PI/8);
      LLathe(g, onion(rd), x, yt + 1.05, z, DOME, 12);
      latheP(B.p(GOLD), [[0.04, yt + 1.05 + rd*2.3], [0.04, yt + 1.05 + rd*2.3 + 0.5]], x, z, 4);
      const F = fZ(z, 1, x); slabP(B.p(GOLD), CRES.map(p => [p[0]*0.35, p[1]*0.35 + yt + 1.05 + rd*2.3 + 0.75]), F, -0.03, 0.03);
    };
    for (const s of [-1, 1]) minaret(EX + s*2.55 + s*0.0, MZ1 + 0.15, 1.35, FL, 11.6, 4, 0.62);
    for (const [x, z] of [[MX0 + 0.7, MZ1 - 0.7], [MX1 - 0.7, MZ1 - 0.7], [MX0 + 0.7, MZ0 + 0.7], [MX1 - 0.7, MZ0 + 0.7]]) minaret(x, z, 1.25, FL, VT + 0.2 - FL + 1.0, 2, 0.6);
    // ---- the 22 slender six-stage minarets on the roof-deck parapet ----
    { const P = rectXZ(HX0 + 0.05, HX1 - 0.05, HZ0 + 0.05, HZ1 - 0.05), per = 2*((HX1 - HX0) + (HZ1 - HZ0)), y0 = HT + 1.05;
      for (let i = 0; i < 22; i++){ let d = (i + 0.5)*per/22, x, z; const Lx = HX1 - HX0, Lz = HZ1 - HZ0;
        if (d < Lx){ x = HX0 + d; z = HZ1; } else if ((d -= Lx) < Lz){ x = HX1; z = HZ1 - d; } else if ((d -= Lz) < Lx){ x = HX1 - d; z = HZ0; } else { d -= Lx; x = HX0; z = HZ0 + d; }
        const o = B.p(TRIM);
        for (let k = 0; k < 6; k++){ const r = 0.24 - k*0.02; latheP(B.p(k % 2 ? TRIM : WALL), [[r, y0 + k*0.5], [r, y0 + k*0.5 + 0.42], [r + 0.05, y0 + k*0.5 + 0.44], [r + 0.05, y0 + k*0.5 + 0.5]], x, z, 6); }
        latheP(B.p(DOME), onion(0.19).map(p => [p[0], p[1] + y0 + 3.0]), x, z, 8);
        latheP(B.p(GOLD), [[0.025, y0 + 3.0 + 0.45], [0.025, y0 + 3.0 + 0.85]], x, z, 3); } }
    // ---- the hexagonal three-level cupola: pilasters, corner minarets, large onion dome, smaller dome, star and crescent ----
    { const cx = EX, cz = (HZ0 + HZ1)/2 - 0.5, y0 = HT; let y = y0;
      for (let lv = 0; lv < 3; lv++){ const r = 3.3 - lv*0.55, h = 2.1 - lv*0.2;
        latheP(B.p(WALL), [[r, y], [r, y + h]], cx, cz, 6, PI/6); capP(B.p(DECK), ringPts(cx, cz, r, 6, PI/6), y + h);
        latheP(B.p(TRIM), [[r + 0.12, y + h - 0.22], [r + 0.12, y + h]], cx, cz, 6, PI/6);
        for (let i = 0; i < 6; i++){ const a = PI/6 + i*PI/3, a2 = a + PI/3, mx = cx + (Math.cos(a) + Math.cos(a2))/2*r, mz = cz + (Math.sin(a) + Math.sin(a2))/2*r, ang = Math.atan2(mz - cz, mx - cx);
          const F = (u, v, w) => [mx - Math.sin(ang)*u + Math.cos(ang)*(w || 0), v, mz + Math.cos(ang)*u + Math.sin(ang)*(w || 0)];
          shapeP(B.p(WIN), mv(ogArchO(0.35, h*0.62), 0, y + h*0.12), F, 0.04);
          const px = cx + Math.cos(a)*r, pz = cz + Math.sin(a)*r; latheP(B.p(TRIM), [[0.16, y], [0.16, y + h]], px, pz, 4, PI/4);
          if (lv === 2){ latheP(B.p(TRIM), [[0.18, y + h], [0.16, y + h + 1.2]], px, pz, 6); latheP(B.p(DOME), onion(0.22).map(p => [p[0], p[1] + y + h + 1.2]), px, pz, 8); latheP(B.p(GOLD), [[0.025, y + h + 1.7], [0.025, y + h + 2.0]], px, pz, 3); } }
        y += h; }
      latheP(B.p(TRIM), [[1.75, y], [1.85, y + 0.25]], cx, cz, 12);
      LLathe(g, onion(1.62), cx, y + 0.25, cz, DOME, 16);
      const y2 = y + 0.25 + 1.62*2.15;
      latheP(B.p(WALL), [[0.42, y2], [0.42, y2 + 0.5]], cx, cz, 8);
      LLathe(g, onion(0.48), cx, y2 + 0.5, cz, DOME, 12);
      const y3 = y2 + 0.5 + 0.48*2.3;
      latheP(B.p(GOLD), [[0.05, y3], [0.05, y3 + 0.8]], cx, cz, 4);
      slabP(B.p(GOLD), CRES.map(p => [p[0]*0.6, p[1]*0.6 + y3 + 1.1]), fZ(cz, 1, cx), -0.04, 0.04);
      slabP(B.p(GOLD), star(5, 0.28, 0.12, PI/2).map(p => [p[0] + 0.05, p[1] + y3 + 1.1]), fZ(cz, 1, cx), -0.04, 0.04); }
    // ---- rear ablution / service wing and the two-storey madrasah extension ----
    bxP(B.p(WALL), MX0 + 1, MX1 - 1, 0.4, 4.2, -14.6, MZ0); bxP(B.p(TRIM), MX0 + 0.8, MX1 - 0.8, 4.2, 4.5, -14.8, MZ0);
    { const X0 = 5.0, X1 = 19.7, Z0 = -14.6, Z1 = 14.6, H2 = 9.4;
      bxP(B.p(WALL), X0, X1, 0.4, H2, Z0, Z1); capP(B.p(DECK), rectXZ(X0, X1, Z0, Z1), H2 + 0.01);
      bxP(B.p(TRIM), X0 - 0.15, X1 + 0.15, 4.6, 4.85, Z0 - 0.15, Z1 + 0.15);
      parP(B.p(TRIM), rectXZ(X0 - 0.1, X1 + 0.1, Z0 - 0.1, Z1 + 0.1), H2, H2 + 0.9, 0.3);
      for (const [F, L] of [[fZ(Z1, 1, (X0 + X1)/2), X1 - X0], [fZ(Z0, -1, (X0 + X1)/2), X1 - X0], [fX(X1, 1, 0), Z1 - Z0], [fX(X0, -1, 0), Z1 - Z0]]){
        const n = Math.floor(L/2.6); for (let j = 0; j < n; j++){ const u = -L/2 + (j + 0.5)*L/n; for (const y of [1.0, 5.4]){ shapeP(B.p(GRN), mv(ogArchO(0.68, 3.0), u, y), F, 0.03); shapeP(B.p(WIN), mv(ogArchO(0.5, 2.7), u, y + 0.1), F, 0.06); } } }
      for (const [x, z] of [[X0 + 0.4, Z1 - 0.4], [X1 - 0.4, Z1 - 0.4], [X0 + 0.4, Z0 + 0.4], [X1 - 0.4, Z0 + 0.4]]) minaret(x, z, 0.8, H2, 1.6, 2, 0.32); }
    // lamps at the entrance
    for (const s of [-1, 1]) boxP(B.p(LAMP), 0.35, 0.5, 0.35, EX + s*1.95, 5.0, MZ1 + 0.5);
    B.flush(g); vFlush(g, V);
    return g;
  }};
SG_PLACES.push({type:'sgabdulgafoor', lat:1.304398, lon:103.853738, rot:2.4670});

// ================= House of Tan Teng Niah (1900), 37 Kerbau Road =================
// The last surviving Chinese villa in Little India, built by the confectionery merchant Tan Teng Niah: two storeys, eight
// rooms, a square main block under a Chinese tiled hip-and-gable roof and a central front wing towards Kerbau Road whose
// upper floor overhangs a five-foot way. Restored in the 1980s and painted in a riot of colours: every panel, pilaster,
// shutter and moulding a different hue. Local frame: +z = NE (front wing, Kerbau Road), +x = SE.
LANDMARKS.sgtantengniah = {zh:'陈东龄故居', en:'House of Tan Teng Niah', cat:'old', r:16, h:11.2,
  lt:{m:0, c:'#ffe0b8', k:1.0, e:0.6, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), V = mkV(), R = LMCTX.rng;
    const ROOF = '#9a5a3e', RIDGE = '#c9b9a0', BASE = '#9b9384', DARK = '#2c2724', WIN = {c:'#3a3530', glow:'#ffd38a', gk:0.5};
    const RAIN = ['#e8679b', '#f2c53a', '#3b78c9', '#46a65a', '#8a56b8', '#ef8a3a', '#d9443a', '#37b5c4', '#a9c94a', '#f08fb8', '#5b5fd0', '#f5e04a'];
    let ci = 0; const nextC = () => RAIN[(ci++) % RAIN.length];
    const RING = [[-7.01, 4.59], [-7.7, -10.66], [7.23, -11.1], [7.37, 4.58], [4.06, 4.26], [4.12, 14.03], [-3.96, 14.28], [-4.09, 4.58]];
    const G0 = 0.5, G1 = 4.3, U1 = 7.7;                    // ground floor, upper floor, eaves
    wallP(B.p(BASE), RING, -5, G0); capP(B.p('#b9b0a0'), RING, G0);
    const RW = offP(RING, 0.15);
    // walls: coloured panels between contrasting pilasters, windows with lunettes and louvred shutters
    for (const E of edgesF(RW)){
      const front = (E.a[1] + E.b[1])/2 > 13; if (E.L < 0.5) continue;
      const n = Math.max(1, Math.round(E.L/2.3)), bw = E.L/n;
      for (let fl = 0; fl < 2; fl++){
        const y0 = fl ? G1 : G0, y1 = fl ? U1 : G1, rec = front && !fl ? -1.7 : 0;
        for (let j = 0; j < n; j++){
          const u0 = j*bw, u1 = (j + 1)*bw, um = (u0 + u1)/2, wc = nextC();
          vAdd(V, wc, t => shapeP(t, rectO(u0, u1, y0, y1), E.F, rec));
          if (rec) vAdd(V, wc, t => { for (const [a, b] of [[u0, u0], [u1, u1]]) {} });
          const ww = Math.min(0.5, bw*0.22), wy0 = y0 + (fl ? 0.7 : 0.9), wy1 = y1 - 0.75;
          vAdd(V, '#f6f1e4', t => shapeP(t, mv(rArchO(ww + 0.14, wy1 - wy0 + 0.75), um, wy0 - 0.1), E.F, rec + 0.03));
          vAdd(V, nextC(), t => shapeP(t, mv(semi(ww, 8), um, wy1 - 0.0), E.F, rec + 0.05));
          shapeP(B.p(fl && !front ? WIN : DARK), rectO(um - ww - 0.06, um + ww + 0.06, wy0 - 0.06, wy1 + 0.04), E.F, rec + 0.05);
          const sc = nextC(); vAdd(V, sc, t => { for (const s of [-1, 1]){ shapeP(t, rectO(um + (s < 0 ? -ww : 0.04), um + (s < 0 ? -0.04 : ww), wy0, wy1), E.F, rec + 0.08); }
            for (let y = wy0 + 0.12; y < wy1 - 0.08; y += 0.16) shapeP(t, rectO(um - ww + 0.06, um + ww - 0.06, y, y + 0.05), E.F, rec + 0.11); });
          // pilaster at the bay boundary
          const pc = nextC(); vAdd(V, pc, t => slabP(t, rectO(u0 - 0.16, u0 + 0.16, y0, y1), E.F, rec, rec + 0.12));
          if (j === n - 1) vAdd(V, pc, t => slabP(t, rectO(u1 - 0.16, u1 + 0.16, y0, y1), E.F, rec, rec + 0.12));
        }
        // floor band / cornice
        vAdd(V, nextC(), t => slabP(t, rectO(-0.1, E.L + 0.1, y1 - 0.28, y1), E.F, 0, 0.22));
      }
      if (front){ // five-foot way: columns carrying the overhanging upper floor, soffit, side returns
        for (let j = 0; j <= n; j++){ const u = j*bw, c = nextC(); vAdd(V, c, t => { const p = E.F(Math.min(E.L - 0.2, Math.max(0.2, u)), 0, -0.2); latheP(t, [[0.2, G0], [0.2, G1 - 0.3], [0.3, G1 - 0.15], [0.3, G1]], p[0], p[2], 8); }); }
        vAdd(V, '#f6f1e4', t => shapeP(t, [[0, 0], [E.L, 0], [E.L, -1.7], [0, -1.7]].map(([u, w]) => [u, w]), (u, v, w) => E.F(u, G1 - 0.02, v), 0));
      }
    }
    // the five-foot way soffit as a flat underside (horizontal), side returns of the recess
    { const E = edgesF(RW).find(E => (E.a[1] + E.b[1])/2 > 13); const P = [E.F(0, G1, 0), E.F(E.L, G1, 0), E.F(E.L, G1, -1.7), E.F(0, G1, -1.7)];
      vAdd(V, '#f6f1e4', t => quadP(t, P[0], P[1], P[2], P[3]));
      for (const u of [0.02, E.L - 0.02]) vAdd(V, '#e8679b', t => quadP(t, E.F(u, G0, 0), E.F(u, G0, -1.7), E.F(u, G1, -1.7), E.F(u, G1, 0))); }
    // carved entrance doors (pintu pagar) on the front, under the gilded name board
    { const E = edgesF(RW).find(E => (E.a[1] + E.b[1])/2 > 13), um = E.L/2;
      shapeP(B.p('#6b3a22'), rectO(um - 0.8, um + 0.8, G0, G0 + 2.7), E.F, -1.62);
      vAdd(V, '#e6be3c', t => shapeP(t, rectO(um - 0.95, um + 0.95, G0 + 2.85, G0 + 3.3), E.F, -1.6));
      vAdd(V, '#2f9a5a', t => { shapeP(t, rectO(um - 0.75, um - 0.05, G0 + 0.3, G0 + 1.6), E.F, -1.58); shapeP(t, rectO(um + 0.05, um + 0.75, G0 + 0.3, G0 + 1.6), E.F, -1.58); }); }
    // roofs: main block hip-and-gable with the ridge along x; the front wing's roof along z; gable ends painted
    const o = B.p(ROOF), rid = B.p(RIDGE), gc = [];
    roofP(o, -0.15, -3.25, 8.45, 8.75, 4.6, 0, U1, 3.1, {gab:0.6, gcol:gc, lift:0.12, pw:1.2, fas:0.35, fo:B.p('#5b3a2c'), ridge:rid, rr:0.22, hips:rid, hr:0.12, n:6, nt:5});
    roofP(o, 0.05, 9.7, 5.6, 4.95, 3.0, 0, U1 - 0.2, 2.7, {gab:0.6, gcol:gc, lift:0.1, pw:1.2, fas:0.3, fo:B.p('#5b3a2c'), ridge:rid, rr:0.2, hips:rid, hr:0.11, n:6, nt:5, ry:HP});
    vAdd(V, '#3b78c9', t => { for (let i = 0; i < gc.length; i++) t.push(gc[i]); });
    B.flush(g); vFlush(g, V);
    return g;
  }};
SG_PLACES.push({type:'sgtantengniah', lat:1.307057, lon:103.850938, rot:2.4740});

// ================= Kwan Im Thong Hood Cho Temple (1884; rebuilt 1982) and Sri Krishnan Temple (1870/1933), Waterloo Street =================
// Two temples side by side on the pedestrian Waterloo Street, famous for devotees praying at both. Kwan Im: granite
// platform and steps, a front portico on red columns under its own curved roof, the main hall under a large hip-and-gable
// roof of glazed orange tiles with green ridges, two dragons chasing the pearl on the ridge, swallowtail ridge ends; the
// four-storey 1982 block behind. Sri Krishnan: a three-tier gopuram crowded with painted deities over the entrance,
// red-and-white striped walls, the mandapa with a parapet of shrines, the vimana over Krishna's sanctum, the annexe behind.
// Between them stands the plain eleven-storey Waterloo View block (a filler here, because the hull of the two temples
// covers it). Local frame: +z = SE (Waterloo Street front), +x = NE.
LANDMARKS.sgkwanim = {zh:'观音堂佛祖庙与克里斯南兴都庙', en:'Kwan Im Thong Hood Cho Temple & Sri Krishnan Temple', cat:'old', r:46, h:38.6,
  lt:{m:0, c:'#ffd9a8', k:1.0, e:0.55, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), V = mkV(), R = LMCTX.rng;
    const GRAN = '#a7a196', PAVE = '#c9c2b2', RED = '#b8261d', TILE = '#d8902c', GRT = '#3e8a52', WALLK = '#f2e8d2', DARK = '#2c2522',
      GOLD = {c:'#d9a93f', lc:'#ffd27e', lk:1.3}, LAMP = {c:'#ff5a3a', glow:'#ff6a3a', gk:1.6}, WINK = {c:'#3a3a40', glow:'#ffd08a', gk:0.35},
      FLAT = {c:'#d8d3c8', m:1, fh:3.3, cw:2.6, lc:'#ffe6b8', lk:0.7};
    const M = {STONE:GRAN, WALL:WALLK, GOLD, DOOR:'#5b3b22', DARK, LAMP:{c:'#fff2cc', glow:'#ffd890', gk:1.8}};
    // ================= Kwan Im Thong Hood Cho =================
    { const X0 = 13.45, X1 = 38.4, Z0 = -15.85, Z1 = 16.75, cx = (X0 + X1)/2;
      const RK = [[X0, Z0], [X1, Z0], [X1, Z1], [X0, Z1]];
      wallP(B.p(GRAN), RK, -5, 1.0); capP(B.p(PAVE), RK, 1.0);
      for (let i = 0; i < 4; i++) bxP(B.p(GRAN), cx - 6 + 0*i, cx + 6, 0.2, 0.45 + i*0.2, Z1 - 0.0 + 0, Z1 + 0.9 - i*0.22);     // steps
      // front portico: six red columns on granite bases, beam, the lower curved roof
      const PZ0 = 10.5, PZ1 = Z1 - 0.4;
      for (let i = 0; i < 6; i++){ const x = X0 + 1.4 + i*(X1 - X0 - 2.8)/5;
        latheP(B.p(GRAN), [[0.55, 1.0], [0.55, 1.5], [0.42, 1.7]], x, PZ1, 8); latheP(B.p(RED), [[0.36, 1.7], [0.33, 6.0]], x, PZ1, 10);
        latheP(B.p(GOLD), [[0.36, 5.4], [0.36, 5.6]], x, PZ1, 10); }
      bxP(B.p(RED), X0 + 0.8, X1 - 0.8, 5.9, 6.5, PZ1 - 0.35, PZ1 + 0.35);
      vAdd(V, '#2f6fbf', t => bxP(t, X0 + 0.8, X1 - 0.8, 5.6, 5.9, PZ1 - 0.3, PZ1 + 0.3));
      roofP(B.p(TILE), cx, (PZ0 + Z1)/2 + 0.3, (X1 - X0)/2 + 0.6, (Z1 - PZ0)/2 + 1.2, (X1 - X0)/2 - 3.0, 0, 6.5, 2.6, {lift:0.9, pw:1.6, fas:0.4, fo:B.p(RED), ridge:B.p(GRT), rr:0.28, hips:B.p(GRT), hr:0.16, n:8, nt:5, sag:0.5});
      // front wall of the hall: granite, three doors, gold name board (blank), lattice windows
      bxP(B.p(GRAN), X0 + 0.3, X1 - 0.3, 1.0, 7.4, PZ0 - 0.6, PZ0);
      const Ff = fZ(PZ0, 1, cx);
      for (const [u, w] of [[0, 1.6], [-6.5, 1.1], [6.5, 1.1]]){ shapeP(B.p(RED), rectO(u - w, u + w, 1.0, 4.4 + (w > 1.2 ? 0.5 : 0)), Ff, 0.04); for (const s of [-1, 1]) for (let j = 0; j < 4; j++) boxP(B.p(GOLD), 0.1, 0.1, 0.1, cx + u + s*w*0.5, 1.6 + j*0.8, PZ0 + 0.1); }
      vAdd(V, '#e3b43c', t => shapeP(t, rectO(-2.4, 2.4, 5.3, 6.3), Ff, 0.06)); vAdd(V, '#b8261d', t => shapeP(t, rectO(-2.6, 2.6, 5.15, 6.45), Ff, 0.04));
      for (const u of [-10, -3.5, 3.5, 10]){ shapeP(B.p(DARK), circ(0.8, 12).map(p => [p[0] + u, p[1] + 3.6]), Ff, 0.05); vAdd(V, '#3e8a52', t => { for (let k = -2; k <= 2; k++) shapeP(t, rectO(u + k*0.3 - 0.05, u + k*0.3 + 0.05, 2.9, 4.3), Ff, 0.07); }); }
      // main hall: walls, red lanterns, the great roof with glazed tiles, green ridges, swallowtails, dragons and the pearl
      const HZ0 = -3.0, HZ1 = PZ0 - 0.3;
      bxP(B.p(WALLK), X0 + 0.4, X1 - 0.4, 1.0, 7.6, HZ0, HZ1);
      for (const s of [-1, 1]){ const F = fX(s > 0 ? X1 - 0.4 : X0 + 0.4, s, (HZ0 + HZ1)/2); for (const u of [-4, 0, 4]) shapeP(B.p(WINK), circ(0.75, 12).map(p => [p[0] + u, p[1] + 4.2]), F, 0.04); }
      bxP(B.p(RED), X0 + 0.2, X1 - 0.2, 7.3, 7.8, HZ0 - 0.2, HZ1 + 0.2);
      const ry0 = 7.8, rh = 4.4, ridgeY = ry0 + rh;
      roofP(B.p(TILE), cx, (HZ0 + HZ1)/2, (X1 - X0)/2 + 1.4, (HZ1 - HZ0)/2 + 1.6, (X1 - X0)/2 - 2.6, 0, ry0, rh, {gab:0.62, gcol:B.p(RED), lift:1.1, pw:1.6, fas:0.5, fo:B.p(RED), ridge:B.p(GRT), rr:0.42, hips:B.p(GRT), hr:0.2, n:8, nt:6, sag:0.7});
      const rz = (HZ0 + HZ1)/2, hl = (X1 - X0)/2 - 2.6;
      for (const s of [-1, 1]) chiweiP(B.p(GRT), cx + s*(hl + 0.3), ridgeY + 0.75, rz, s > 0 ? 0 : PI, 1.5);
      // two dragons along the ridge, facing the flaming pearl at the centre
      for (const s of [-1, 1]){ const o = B.p(GRT), pts = [];
        for (let i = 0; i <= 16; i++){ const t = i/16, x = cx + s*(hl - 0.8 - t*(hl - 2.4)), y = ridgeY + 0.95 + 0.55*Math.sin(t*PI*2.5) + t*0.4; pts.push([x, y, rz + 0.15*Math.cos(t*PI*3)]); }
        for (let i = 0; i < pts.length - 1; i++) segP(o, pts[i], pts[i+1], 0.26 - i*0.008, 6);
        const hd = pts[pts.length - 1]; boxP(o, 0.9, 0.6, 0.55, hd[0] - s*0.3, hd[1] - 0.2, hd[2], 0); boxP(B.p(GOLD), 0.3, 0.5, 0.15, hd[0] - s*0.1, hd[1] + 0.3, hd[2] + 0.2, 0);
        for (let i = 2; i < pts.length - 2; i += 3) segP(B.p(GOLD), pts[i], [pts[i][0], pts[i][1] + 0.4, pts[i][2]], 0.06, 3); }
      LSph(g, 0.5, cx, ridgeY + 1.25, rz, GOLD, 1, 12);
      latheP(B.p(GOLD), [[0.25, ridgeY + 0.4], [0.12, ridgeY + 0.75]], cx, rz, 8);
      // red lanterns under the portico
      for (let i = 0; i < 5; i++) LSph(g, 0.42, X0 + 3.6 + i*(X1 - X0 - 7.2)/4, 4.9, PZ1 - 0.2, LAMP, 1.25, 10);
      // the four-storey 1982 block behind: cream walls, red bands, windows, its own tiled roof
      const BZ0 = Z0 + 0.3, BZ1 = HZ0 + 0.2, BH = 14.4;
      bxP(B.p(WALLK), X0 + 0.3, X1 - 0.3, 1.0, BH - 1.2, BZ0, BZ1);
      for (let f = 1; f < 4; f++) bxP(B.p(RED), X0 + 0.2, X1 - 0.2, 1.0 + f*3.2 - 0.2, 1.0 + f*3.2 + 0.1, BZ0 - 0.1, BZ1 + 0.05);
      for (const [F, L] of [[fZ(BZ0, -1, cx), X1 - X0 - 0.6], [fX(X1 - 0.3, 1, (BZ0 + BZ1)/2), BZ1 - BZ0], [fX(X0 + 0.3, -1, (BZ0 + BZ1)/2), BZ1 - BZ0]]){
        const n = Math.floor(L/2.6); for (let f = 0; f < 4; f++) for (let j = 0; j < n; j++){ const u = -L/2 + (j + 0.5)*L/n; shapeP(B.p(WINK), rectO(u - 0.75, u + 0.75, 1.0 + f*3.2 + 0.8, 1.0 + f*3.2 + 2.5), F, 0.04); } }
      roofP(B.p(TILE), cx, (BZ0 + BZ1)/2, (X1 - X0)/2 + 0.6, (BZ1 - BZ0)/2 + 0.8, (X1 - X0)/2 - 4, 0, BH - 1.2, 2.6, {gab:0.6, gcol:B.p(RED), lift:0.6, pw:1.5, fas:0.35, fo:B.p(RED), ridge:B.p(GRT), rr:0.3, n:6, nt:5});
    }
    // ================= Sri Krishnan Temple =================
    { const RS = [[-23.26, -17.21], [-23.47, 22.55], [-39.07, 22.04], [-38.55, -17.33]], X0 = -38.9, X1 = -23.4, cx = (X0 + X1)/2;
      const D = DRV(B, V, R, M);
      wallP(B.p(M.STONE), RS, -5, 0.5); capP(B.p(PAVE), RS, 0.5);
      // compound / mandapa walls with red-and-white stripes
      const RM = [[X1 + 0.1, 2.5], [X1 + 0.1, 22.3], [X0 - 0.05, 21.8], [X0 - 0.05, 2.5]];
      wallP(B.p(M.WALL), RM, 0.5, 5.6);
      D.stripes(RM, 0.8, 4.2, 0.4);
      vAdd(V, '#c8462f', t => parP(t, offP(RM, -0.15), 5.0, 5.3, 0.5)); vAdd(V, '#e6be3c', t => parP(t, offP(RM, -0.25), 5.3, 5.6, 0.6));
      capP(B.p(PAVE), RM, 5.6);
      parP(B.p(M.WALL), offP(RM, 0.25), 5.6, 6.4, 0.3);
      let k = 0; for (const [x, z, a, L] of alongP(offP(RM, 0.45), 1.6)){ if (L < 0.9 || z > 17.8) continue; D.mini(x, 6.4, z, a, (k++) % 2 === 0, 1.15); }
      // gopuram on Waterloo Street
      D.gopuram({GX:cx, GZ:19.85, GW:8.8, GD:5.0, y0:0.5, BH:6.0, NT:3, W0:8.0, W1:5.8, D0:4.4, D1:3.3, hb0:1.5, hb1:1.3, CW:4.4, CD:2.4, VR:1.0, k:0.95, dw:1.45, dh:4.0, nk:5});
      // vimana over the sanctum, a smaller one beside it
      D.vimana(cx, 6.2, 5.6, 5.6, 5.6, 1.4, 2, true);
      D.vimana(cx - 4.6, 12.5, 2.6, 2.6, 5.6, 0.9, 1, false); D.vimana(cx + 4.6, 12.5, 2.6, 2.6, 5.6, 0.9, 1, false);
      // annexe behind (multi-purpose halls): two storeys, cream with red cornices and arched windows
      const AZ0 = -17.0, AZ1 = 2.5, AH = 8.6;
      bxP(B.p(M.WALL), X0 + 0.1, X1 - 0.1, 0.5, AH, AZ0, AZ1); capP(B.p(PAVE), rectXZ(X0 + 0.1, X1 - 0.1, AZ0, AZ1), AH + 0.01);
      vAdd(V, '#c8462f', t => bxP(t, X0 - 0.1, X1 + 0.1, 4.4, 4.7, AZ0 - 0.1, AZ1));
      vAdd(V, '#e6be3c', t => parP(t, rectXZ(X0 - 0.1, X1 + 0.1, AZ0 - 0.1, AZ1), AH - 0.3, AH + 0.6, 0.35));
      for (const [F, L] of [[fZ(AZ0, -1, cx), X1 - X0 - 0.2], [fX(X1 - 0.1, 1, (AZ0 + AZ1)/2), AZ1 - AZ0], [fX(X0 + 0.1, -1, (AZ0 + AZ1)/2), AZ1 - AZ0]]){
        const n = Math.floor(L/2.8); for (const y of [1.2, 5.3]) for (let j = 0; j < n; j++){ const u = -L/2 + (j + 0.5)*L/n; shapeP(B.p(WINK), mv(rArchO(0.6, 2.4), u, y), F, 0.04); } }
    }
    // ================= Waterloo View (plain eleven-storey neighbour) =================
    { const RW = [[4.51, 2.62], [-17.39, 1.75], [-16.94, -13.93], [5.01, -12.98]], HH = 37.5;
      wallP(B.p(FLAT), RW, -3, HH); capP(B.p(PAVE), RW, HH);
      for (let f = 1; f < 11; f++) vAdd(V, '#ece8df', t => parP(t, offP(RW, -0.35), 1.0 + f*3.3, 1.25 + f*3.3, 0.5));
      vAdd(V, '#ece8df', t => parP(t, RW, HH, HH + 1.1, 0.25)); }
    B.flush(g); vFlush(g, V);
    return g;
  }};
SG_PLACES.push({type:'sgkwanim', lat:1.300785, lon:103.852793, rot:0.8995});

// ================= LASALLE College of the Arts, McNally campus (2007, RSP Architects) =================
// The whole block between McNally Street, Short Street, Prinsep Street and Lorong Sakai: six black seven-storey buildings
// (four L-shaped corner blocks and one in the middle of each long side) separated by alleys that lead into a central
// "urban canyon" lined with fractured, faceted glass walls; a gridded glass roof skin spans the canyon between the roofs.
// Outer faces: black stone and aluminium with scattered window slots. Night: the canyon glass glows, scattered lit windows
// in the black shells. Local frame: +z = SW (McNally Street), +x = SE (Prinsep Street side).
LANDMARKS.sglasalle = {zh:'拉萨尔艺术学院', en:'LASALLE College of the Arts', cat:'new', r:72, h:35,
  lt:{m:0, c:'#d6e4ff', k:0.5, e:0.5, anim:'none'},
  build(){
    const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
    const BLK = {c:'#25272b', m:0, lk:0.12}, ROOFC = '#3a3c40', PAVE = '#b9b6ae', GLS = {c:'#8fa6b4', m:0, glow:'#ffdcae', gk:0.42},
      MUL = '#d9dde0', SLOT = {c:'#4a5560', m:0, lk:0.1, glow:'#ffe8c4', gk:0.6}, SKIN = {c:'#cfe0ea', op:0.32, ds:true, m:0}, STEEL = '#e8ebed';
    const RING = [[-17.42, -48.66], [0.34, -48.73], [13.33, -47.17], [13.56, -50.49], [47.55, -51.69], [47.24, -30.63], [44.32, -31.32], [45.79, -24.87], [45.16, -18.11], [47.31, -18.34], [47.01, 11.18], [45.7, 11.48], [45.55, 16.94], [44.16, 23.55], [47.08, 23.47], [46.85, 48.37], [9.41, 50.89], [7.63, 47.81], [0.64, 49.72], [-6.83, 48.25], [-7.83, 49.87], [-47.81, 48.38], [-48.04, 23.86], [-45.89, 23.64], [-46.26, 18.49], [-44.89, 13.57], [-47.81, 12.88], [-47.88, -13.33], [-45.42, -12.25], [-46.88, -18.71], [-45.95, -24.94], [-48.03, -24.78], [-48.03, -47.15]];
    wallP(B.p('#4a4b4e'), RING, -5, 0.4); capP(B.p(PAVE), RING, 0.4);
    // the six blocks: outer (street) edges flagged 1, inner (canyon / alley) edges 0
    const BL = [
      {P:[[-48, -48.7], [0.3, -48.7], [0.3, -30], [-29, -30], [-29, -25], [-48, -25]], H:32.5},
      {P:[[13.5, -50.4], [47.5, -51.7], [47.3, -31], [29, -31], [29, -30], [13.5, -30]], H:31.0},
      {P:[[29, -18.2], [47.3, -18.3], [47.0, 11.2], [29, 11.2]], H:28.0},
      {P:[[29, 23.5], [47.1, 23.5], [46.85, 48.4], [9.4, 50.9], [9.4, 29], [29, 29]], H:32.5},
      {P:[[-7.8, 49.9], [-47.8, 48.4], [-48, 23.9], [-29, 23.9], [-29, 29], [-7.8, 29]], H:31.0},
      {P:[[-48, -12.3], [-29, -12.3], [-29, 12.9], [-47.8, 12.9]], H:28.0},
    ];
    const outerish = (a, b) => { const m = [(a[0] + b[0])/2, (a[1] + b[1])/2]; return Math.abs(m[0]) > 44 || Math.abs(m[1]) > 45.5; };
    for (const bl of BL){
      const P = bl.P, H = bl.H;
      capP(B.p(ROOFC), P, H); parP(B.p(BLK), P, H, H + 1.2, 0.3);
      for (const E of edgesF(P)){
        if (outerish(E.a, E.b)){
          // black street faces with scattered horizontal window slots
          const o = B.p(BLK); quadP(o, E.F(0, 0.4, 0), E.F(E.L, 0.4, 0), E.F(E.L, H, 0), E.F(0, H, 0));
          for (let y = 5.0; y < H - 3; y += 4.5){ let u = 1 + R()*4; while (u < E.L - 3){ const w = 2 + R()*7; if (u + w > E.L - 1) break; shapeP(B.p(SLOT), rectO(u, u + w, y, y + 0.9 + (R() < 0.3 ? 1.2 : 0)), E.F, 0.05); u += w + 2 + R()*6; } }
          shapeP(B.p(SLOT), rectO(0.8, Math.max(1, E.L - 0.8), 0.4, 3.6), E.F, 0.05);
        } else {
          // canyon faces: fractured, faceted glass with white mullions, grid jittered in and out
          const nu = Math.max(1, Math.round(E.L/6.5)), vs = [0.4, 6 + R()*3, 14 + R()*4, 22 + R()*3, H];
          const Wg = []; for (let i = 0; i <= nu; i++){ Wg.push(vs.map((v, j) => (i === 0 || i === nu) ? 0 : (j === 0 ? 0.6 : (R() - 0.35)*4.2))); }
          const Pt = (i, j) => E.F(E.L*i/nu, vs[j], Wg[i][j] - 0.6);
          const o = B.p(GLS), mu = B.p(MUL);
          for (let i = 0; i < nu; i++) for (let j = 0; j < vs.length - 1; j++){ const a = Pt(i, j), b = Pt(i + 1, j), c = Pt(i + 1, j + 1), d = Pt(i, j + 1);
            if ((i + j) % 2) { triP(o, a, b, c); triP(o, a, c, d); } else { triP(o, a, b, d); triP(o, b, c, d); }
            segP(mu, a, b, 0.09, 3); segP(mu, a, d, 0.09, 3); }
          for (let j = 0; j < vs.length - 1; j++) segP(mu, Pt(nu, j), Pt(nu, j + 1), 0.09, 3);
          for (let i = 0; i < nu; i++) segP(mu, Pt(i, vs.length - 1), Pt(i + 1, vs.length - 1), 0.09, 3);
          // black slab edges behind the glass (floors) so the canyon reads as layered
          for (let y = 4.9; y < H - 1; y += 4.5) quadP(B.p(BLK), E.F(0, y, -1.6), E.F(E.L, y, -1.6), E.F(E.L, y + 0.4, -1.6), E.F(0, y + 0.4, -1.6));
          quadP(B.p(BLK), E.F(0, 0.4, -1.8), E.F(E.L, 0.4, -1.8), E.F(E.L, H, -1.8), E.F(0, H, -1.8));
        }
      }
    }
    // canyon floor: paving, planters, the black-box theatre plinths
    capP(B.p(PAVE), [[-29, -30], [29, -30], [29, 29], [-29, 29]], 0.45);
    for (const [x, z, w, d, h] of [[-8, -6, 9, 6, 1.0], [10, 9, 7, 5, 0.8], [6, -16, 5, 8, 0.6]]) bxP(B.p(ROOFC), x - w/2, x + w/2, 0.4, 0.4 + h, z - d/2, z + d/2);
    // sky bridges across the canyon
    for (const [a, b, y] of [[[-29, 0, -5], [29, 0, -2]], [[-12, 0, -30], [-6, 0, 29]], [[12, 0, -30], [18, 0, 29]]].map((q, i) => [q[0], q[1], 14 + i*5])){
      const dx = b[0] - a[0], dz = b[2] - a[2], L = Math.hypot(dx, dz), ang = Math.atan2(dz, dx);
      boxP(B.p(BLK), L, 1.2, 3.2, (a[0] + b[0])/2, y, (a[2] + b[2])/2, -ang); boxP(B.p(SLOT), L, 1.6, 3.0, (a[0] + b[0])/2, y + 1.2, (a[2] + b[2])/2, -ang); }
    // roof skin: a gridded glass canopy over the canyon, resting on the black roofs
    { const y = 34.2, X0 = -33, X1 = 33, Z0 = -34, Z1 = 33;
      const o = B.p(SKIN); quadP(o, [X0, y, Z0], [X1, y, Z0], [X1, y, Z1], [X0, y, Z1]);
      const st = B.p(STEEL);
      for (let x = X0; x <= X1 + 0.01; x += 3.3) segP(st, [x, y - 0.1, Z0], [x, y - 0.1, Z1], 0.11, 3);
      for (let z = Z0; z <= Z1 + 0.01; z += 3.3) segP(st, [X0, y - 0.1, z], [X1, y - 0.1, z], 0.11, 3);
      for (const x of [X0, X1]) for (let z = Z0; z <= Z1; z += 11.15) segP(st, [x, 27.5, z], [x, y, z], 0.18, 4);
      for (const z of [Z0, Z1]) for (let x = X0 + 11; x < X1; x += 11) segP(st, [x, 27.5, z], [x, y, z], 0.18, 4); }
    B.flush(g);
    return g;
  }};
SG_PLACES.push({type:'sglasalle', lat:1.302825, lon:103.851600, rot:-0.6935});

// ================= Fort Canning Park: Fort Gate, Fort Canning Centre, Raffles Terrace flagstaff and lighthouse =================
// Three structures spread over the hill, each standing on the real (app) terrain under it: the Fort Gate (1859, G. C.
// Collyer; the only remnant of Fort Canning) - a massive rendered gateway with a pointed-arch passage, timber doors and a
// heavy ledge; Fort Canning Centre (1926 British Army barracks) - a long three-storey Neo-Classical block with a central
// entrance bay, rusticated base, pilasters spanning the upper storeys, open corridors on the wings, a pitched roof with wide
// eaves, set into the slope; and on Raffles Terrace the replicas of the signal flagstaff (ship's mast with yard and
// rigging) and of the hill's lighthouse. In the app / in-situ kit each part's ground comes from hC(); offline from an
// embedded copy of the 70 m terrain grid. Local frame: rot 0, +x = east, +z = south; origin between the three sites.
{
const FC_LAT = 1.293729, FC_LON = 103.847161, FC_R = 224;
// the park paths whose lines the hull hides (clipped to the hull): redrawn as 2.5 m strips draped on the terrain
const FC_HULL = [[-40.1,-214.0],[-63.1,-209.2],[-150.9,-142.6],[-152.5,-136.1],[46.0,211.5],[48.2,215.0],[51.5,216.3],[54.8,215.0],[56.7,212.1],[73.2,181.7],[73.6,179.3],[73.2,176.9],[-26.6,-172.9]];
const FC_PATHS = [[[-27.5,-170.4],[-24.7,-152.8]],[[-24.7,-152.8],[-19.9,-122.8],[-10.6,-103.5],[-8.8,-90.1]],[[-1.8,-80.3],[-4.1,-78.9]],[[-145.7,-127.4],[-136.9,-127.8],[-131.5,-133.4]],[[-131.5,-133.4],[-124.7,-139.7],[-83.8,-158.6]],[[-127.2,-94.9],[-127.4,-99.3],[-131.2,-108.8]],[[-131.2,-108.8],[-131.5,-133.4]],[[35.2,189.4],[39.8,176.7]],[[-83.8,-158.6],[-62.6,-162.2]],[[60.4,176.7],[50.6,170.2]],[[52.9,166.3],[45.8,174.3],[29.8,180.0]],[[52.9,166.3],[41.6,171.7],[30.9,166.9],[22.5,151.8]],[[3.2,-62.8],[-8.8,-90.1],[-38.4,-100.8],[-48.0,-110.0],[-62.6,-162.2],[-67.7,-199.3],[-69.0,-202.7]],[[65.2,186.5],[55.0,205.2]],[[68.9,186.4],[67.6,186.8],[62.8,185.3],[59.8,179.1],[61.6,174.3],[68.5,171.7],[70.4,172.7]],[[57.5,207.2],[57.1,206.4],[52.6,204.6],[47.6,205.8],[45.8,208.1]]];
const FC_H = [0.93,0.93,0.93,0.93,0.93,0.93,0.93,0.93,4.08,4.03,0.93,0.93,9.77,9.42,8.17,6.65,5.39,4.61,4.22,4.09,0.93,14.34,15.97,15.33,12.81,9.64,6.99,5.31,4.50,4.20,16.19,21.36,24.23,23.33,19.16,13.80,9.24,6.33,4.89,4.37,20.82,28.04,32.16,31.09,25.41,17.95,11.51,7.37,5.33,4.57,23.41,31.76,36.58,35.42,28.94,20.32,12.85,8.04,5.66,4.78,22.77,30.80,35.40,34.26,28.06,19.80,12.66,8.07,5.81,5.00,19.16,25.58,29.23,28.28,23.35,16.83,11.20,7.61,5.87,5.28,14.25,18.54,20.98,20.39,17.19,13.01,9.36,7.07,5.99,5.68,9.67,12.04,13.41,13.16,11.52,9.40,7.67,6.69,6.30,6.22];
const fcH = (x, y) => { const fx = (x + 28000)/70 - 399, fy = (y + 28000)/70 - 362, i = Math.max(0, Math.min(8, Math.floor(fx))), j = Math.max(0, Math.min(8, Math.floor(fy))), u = fx - i, v = fy - j;
  const h = (a, b) => FC_H[b*10 + a]; return Math.max(-0.3, (h(i, j)*(1 - u) + h(i + 1, j)*u)*(1 - v) + (h(i, j + 1)*(1 - u) + h(i + 1, j + 1)*u)*v); };
LANDMARKS.sgfortcanning = {zh:'福康宁公园：古堡门与福康宁中心', en:'Fort Canning Park: Fort Gate & Fort Canning Centre', cat:'old', r:FC_R, h:16,
  lt:{m:0, c:'#ffe2b8', k:0.95, e:0.6, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), V = mkV();
    const PX = W_X(FC_LON), PY = W_Y(FC_LAT), app = typeof hC === 'function';
    let base;
    if (app) base = LMCTX.u.base.value;
    else { let hi = -1e9; for (let a = 0; a < 12; a++) for (const f of [0, 0.35, 0.7]) hi = Math.max(hi, fcH(PX + Math.cos(a/12*TAU)*FC_R*f, PY + Math.sin(a/12*TAU)*FC_R*f)); base = hi + 0.6; }
    const gnd = (x, z) => (app ? hC(PX + x, PY - z) : fcH(PX + x, PY - z)) - base;
    const span = pts => { let lo = 1e9, hi = -1e9; for (const [x, z] of pts){ const h = gnd(x, z); lo = Math.min(lo, h); hi = Math.max(hi, h); } return [lo, hi]; };
    const OCH = '#d8c79e', QUO = '#c2b087', WHITE = '#eeebe2', ROOF = '#8b4c3a', DARK = '#2f2e2c', TIMB = '#5a3b24', GRN = '#cfc6b4',
      MAST = {c:'#f4f2ec', lc:'#fff4dc', lk:1.2}, PATH = {c:'#cdc4b0', lk:0.05}, LANT = {c:'#fff3c4', glow:'#ffe7a0', gk:2.2}, CAP = '#2d2f33', IRON = '#3a3d40';
    // ---------------- Fort Gate ----------------
    { const C = [-144.95, -137.7], A = [0.973, 0.233], N = [-0.233, 0.973], L = 13.0, D = 5.8, H = 8.4, PW = 2.15, PH = 6.0;
      const F = w0 => (u, v, w) => [C[0] + A[0]*u + N[0]*(w0 + (w || 0)), v, C[1] + A[1]*u + N[1]*(w0 + (w || 0))];
      const pts = []; for (const u of [-L/2, L/2]) for (const w of [-D/2, D/2]) pts.push([C[0] + A[0]*u + N[0]*w, C[1] + A[1]*u + N[1]*w]);
      const [lo, hi] = span(pts), y0 = hi + 0.2, ry = -Math.atan2(A[1], A[0]);
      boxP(B.p(QUO), L + 0.6, y0 - lo + 3.5, D + 0.6, C[0], lo - 3.5, C[1], ry);
      // two piers, the mass over the passage, the pointed-arch spandrels on both faces
      for (const s of [-1, 1]){ const cu = s*(PW + (L/2 - PW)/2); boxP(B.p(OCH), L/2 - PW, H, D, C[0] + A[0]*cu, y0, C[1] + A[1]*cu, ry); }
      boxP(B.p(OCH), 2*PW + 0.02, H - PH - 0.4, D, C[0], y0 + PH + 0.4, C[1], ry);
      const arch = pointedArch(PW, PH, 8), SP = [[-PW, PH + 0.45], ...arch.slice(2).reverse().map(p => [p[0], p[1]]), [PW, PH + 0.45]];
      const ARC = [[-PW, 0], ...arch.slice(2).reverse(), [PW, 0]];
      slabP(B.p(OCH), [[-PW, PH + 0.45], [-PW, PH - 1.732*PW + 0.0], ...arch.slice(3, arch.length).reverse(), [PW, PH - 1.732*PW], [PW, PH + 0.45]].map(p => [p[0], p[1] + y0]), F(-D/2), 0, D);
      // dressed-stone arch ring and quoins on both faces, the heavy ledge, a low parapet
      for (const s of [-1, 1]){ const f = F(s*D/2);
        const ring = []; for (const p of arch.slice(2)) ring.push(p); 
        for (let i = 0; i < arch.length - 3; i++){ const p = arch[i + 2], q = arch[i + 3]; slabP(B.p(QUO), [[p[0], p[1] + y0], [q[0], q[1] + y0], [q[0]*1.25, q[1]*1.0 + y0 + 0.45], [p[0]*1.25, p[1]*1.0 + y0 + 0.45]], f, 0, s*0.12); }
        for (const u of [-L/2 + 0.35, L/2 - 0.35, -PW - 0.3, PW + 0.3]) for (let k = 0; k < 7; k++) slabP(B.p(QUO), rectO(u - (k % 2 ? 0.35 : 0.55), u + (k % 2 ? 0.35 : 0.55), y0 + k*0.95 + 0.05, y0 + k*0.95 + 0.85), f, 0, s*0.08); }
      boxP(B.p(QUO), L + 0.9, 0.55, D + 0.9, C[0], y0 + H, C[1], ry);
      boxP(B.p(OCH), L + 0.3, 0.9, D + 0.3, C[0], y0 + H + 0.55, C[1], ry);
      for (let k = 0; k < 9; k++){ const u = -L/2 + 0.6 + k*(L - 1.2)/8; boxP(B.p(OCH), 0.8, 0.6, D + 0.3, C[0] + A[0]*u, y0 + H + 1.45, C[1] + A[1]*u, ry); }
      // the great timber doors standing open against the passage walls, iron studs
      for (const s of [-1, 1]){ const pp = (u, w) => [C[0] + A[0]*u + N[0]*w, C[1] + A[1]*u + N[1]*w]; const p0 = pp(s*(PW - 0.12), D/2 - 0.3), p1 = pp(s*(PW - 0.12), D/2 - 0.3 - 2.0);
        quadP(B.p(TIMB), [p0[0], y0, p0[1]], [p1[0], y0, p1[1]], [p1[0], y0 + 4.6, p1[1]], [p0[0], y0 + 4.6, p0[1]]); }
      capP(B.p(GRN), pts.length ? [pts[0], pts[1], pts[3], pts[2]] : [], y0 - 0.02);
    }
    // ---------------- Fort Canning Centre (1926 barracks) ----------------
    { const O = [-42.3, -165.5], A = [-0.2046, -0.9788], Bv = [0.9788, -0.2046];
      const P2 = (s, t) => [O[0] + s*A[0] + t*Bv[0], O[1] + s*A[1] + t*Bv[1]];
      const rect = (s0, s1, t0, t1) => [P2(s0, t0), P2(s1, t0), P2(s1, t1), P2(s0, t1)];
      const FT = (T, sg) => (u, v, w) => { const p = P2(sg > 0 ? u : -u, T + sg*(w || 0)); return [p[0], v, p[1]]; };
      const FS = (S, sg) => (u, v, w) => { const p = P2(S + sg*(w || 0), sg > 0 ? -u : u); return [p[0], v, p[1]]; };
      const RING = [[-53.6, -153.6], [-57.2, -170.8], [-53.6, -172.0], [-61.4, -208.1], [-41.1, -212.3], [-33.9, -175.5], [-30.9, -176.1], [-27.4, -158.9], [-30.3, -158.3], [-22.0, -119.2], [-41.7, -115.6], [-50.0, -154.8]];
      const [lo, hi] = span(RING), y0 = (lo + hi)/2 + 0.2, F1 = y0 + 4.4, F2 = F1 + 3.9, EV = F2 + 3.9;
      wallP(B.p(GRN), RING, lo - 3, y0); capP(B.p(GRN), RING, y0);
      const WINGS = [[-49.3, -9.4], [8.2, 45.6]], T0 = -9.8, T1 = 10.5;
      for (const [s0, s1] of WINGS){
        prismP(B.p(WHITE), rect(s0, s1, T0, T1), y0, EV);
        for (const [F, len, front] of [[FT(T1, 1), s1 - s0, true], [FT(T0, -1), s1 - s0, false]]){
          const u0 = front ? s0 : -s1, n = Math.round(len/3.8);
          for (let k = 0; k < 6; k++) slabP(B.p(GRN), rectO(u0, u0 + len, y0 + 0.5 + k*0.65, y0 + 0.62 + k*0.65), F, 0, 0.06);        // rusticated base
          for (let j = 0; j < n; j++){ const um = u0 + (j + 0.5)*len/n;
            shapeP(B.p(DARK), mv(rArchO(0.75, 2.9), um, y0 + 0.6), F, 0.05);
            if (front){ shapeP(B.p(DARK), rectO(um - 1.45, um + 1.45, F1 + 0.15, F2 - 0.5), F, 0.04); shapeP(B.p(DARK), rectO(um - 1.45, um + 1.45, F2 + 0.15, EV - 0.6), F, 0.04);
              for (const y of [F1, F2]){ slabP(B.p(WHITE), rectO(um - 1.5, um + 1.5, y + 0.1, y + 1.0), F, 0.0, 0.12); for (let q = -6; q <= 6; q++) shapeP(B.p(DARK), rectO(um + q*0.21 - 0.05, um + q*0.21 + 0.05, y + 0.25, y + 0.85), F, 0.13); } }
            else for (const y of [F1, F2]) shapeP(B.p(DARK), rectO(um - 0.6, um + 0.6, y + 0.8, y + 2.9), F, 0.05);
            slabP(B.p(WHITE), rectO(u0 + j*len/n - 0.3, u0 + j*len/n + 0.3, F1, EV - 0.4), F, 0, 0.22); }
          slabP(B.p(WHITE), rectO(u0 + len - 0.3, u0 + len + 0.3, F1, EV - 0.4), F, 0, 0.22);
          slabP(B.p(WHITE), rectO(u0, u0 + len, F1 - 0.25, F1 + 0.05), F, 0, 0.3);
          slabP(B.p(WHITE), rectO(u0, u0 + len, EV - 0.55, EV), F, 0, 0.35); }
        for (const [F, len] of [[FS(s0, -1), T1 - T0], [FS(s1, 1), T1 - T0]]) for (const y of [y0 + 0.9, F1 + 0.8, F2 + 0.8]) for (let j = 0; j < 4; j++){ const um = -len/2 + (j + 0.5)*len/4 + (T0 + T1)/2*0; shapeP(B.p(DARK), rectO(um - 0.6, um + 0.6, y, y + 2.1), F, 0.05); }
        const sm = (s0 + s1)/2, c = P2(sm, (T0 + T1)/2);
        roofP(B.p(ROOF), c[0], c[1], (s1 - s0)/2 + 1.4, (T1 - T0)/2 + 1.6, (s1 - s0)/2 - 6, 0, EV, 4.6, {pw:1.0, fas:0.4, fo:B.p(WHITE), n:4, nt:3, ry:1.7768});
      }
      // central entrance bay: projecting, pilasters, pediment, porch
      const BS0 = -9.4, BS1 = 8.2, BT0 = -13.5, BT1 = 13.3;
      prismP(B.p(WHITE), rect(BS0, BS1, BT0, BT1), y0, EV + 1.2);
      for (const [F, T, sg] of [[FT(BT1, 1), BT1, 1], [FT(BT0, -1), BT0, -1]]){
        const u0 = sg > 0 ? BS0 : -BS1, len = BS1 - BS0;
        for (let k = 0; k < 6; k++) slabP(B.p(GRN), rectO(u0, u0 + len, y0 + 0.5 + k*0.65, y0 + 0.62 + k*0.65), F, 0, 0.06);
        for (let j = 0; j < 4; j++){ const um = u0 + (j + 0.5)*len/4; shapeP(B.p(DARK), j === 1 || j === 2 ? mv(rArchO(1.3, 3.6), um, y0 + 0.2) : mv(rArchO(0.75, 2.9), um, y0 + 0.6), F, 0.05);
          for (const y of [F1, F2]) shapeP(B.p(DARK), rectO(um - 0.75, um + 0.75, y + 0.7, y + 3.0), F, 0.05); }
        for (let j = 0; j <= 4; j++) slabP(B.p(WHITE), rectO(u0 + j*len/4 - 0.35, u0 + j*len/4 + 0.35, F1, EV + 0.6), F, 0, 0.3);
        slabP(B.p(WHITE), rectO(u0 - 0.2, u0 + len + 0.2, EV + 0.6, EV + 1.2), F, 0, 0.45);
        slabP(B.p(WHITE), [[u0 - 0.2, EV + 1.2], [u0 + len + 0.2, EV + 1.2], [u0 + len/2, EV + 4.3]], F, 0, 0.45);
        slabP(B.p(ROOF), [[u0 + 0.6, EV + 1.5], [u0 + len - 0.6, EV + 1.5], [u0 + len/2, EV + 3.85]], F, 0.46, 0.5); }
      { const c = P2((BS0 + BS1)/2, (BT0 + BT1)/2); roofP(B.p(ROOF), c[0], c[1], (BS1 - BS0)/2 + 0.6, (BT1 - BT0)/2 + 0.6, 0.1, 0, EV + 1.2, 3.2, {pw:1.0, fas:0.3, fo:B.p(WHITE), n:4, nt:3, ry:1.7768, gab:0.98, gcol:B.p(WHITE)}); }
      // front steps down to the green
      { const F = FT(BT1, 1); for (let k = 0; k < 8; k++){ const w = 0.45*(k + 1); const p = [...rect(-4, 4, BT1 + w - 0.45, BT1 + w)]; prismP(B.p(GRN), p, Math.min(y0, y0 - (k + 1)*0.32) - 3, y0 - k*0.32); } }
    }
    // ---------------- Raffles Terrace: the flagstaff replica ----------------
    { const cx = 51.5, cz = 211.7, [lo, hi] = span(ringPts(cx, cz, 4.6, 8)), y0 = hi + 0.15;
      latheP(B.p(GRN), [[4.6, lo - 2.5], [4.6, y0], [0.01, y0 + 0.01]], cx, cz, 16);
      latheP(B.p(MAST), [[0.32, y0], [0.24, y0 + 15.5], [0.0, y0 + 15.6]], cx, cz, 10);
      latheP(B.p(MAST), [[0.16, y0 + 14.0], [0.09, y0 + 25.0], [0.18, y0 + 25.1], [0.0, y0 + 25.5]], cx, cz, 8);
      boxP(B.p(MAST), 2.2, 0.18, 1.4, cx, y0 + 15.4, cz, 0);                    // cross-trees
      segP(B.p(MAST), [cx - 5.2, y0 + 13.2, cz + 0.25], [cx + 5.2, y0 + 13.2, cz + 0.25], 0.12, 6);   // yard-arm
      segP(B.p(MAST), [cx - 2.8, y0 + 20.5, cz + 0.2], [cx + 2.8, y0 + 20.5, cz + 0.2], 0.07, 5);
      segP(B.p(MAST), [cx, y0 + 9.0, cz - 0.2], [cx - 5.5, y0 + 11.6, cz - 0.2], 0.09, 5);           // gaff
      for (const [dx, dz] of [[-4.2, 0], [4.2, 0], [0, -4.2], [0, 4.2], [-3, -3], [3, 3], [-3, 3], [3, -3]]) segP(B.p(IRON), [cx + dx*0.25, y0 + 15.3, cz + dz*0.25], [cx + dx, y0 + 0.3, cz + dz], 0.025, 3);
      for (const s of [-1, 1]) segP(B.p(IRON), [cx + s*5.0, y0 + 13.2, cz + 0.25], [cx + s*0.2, y0 + 24.5, cz], 0.02, 3);
      latheP(B.p(CAP), [[0.22, y0 + 25.5], [0.0, y0 + 25.8]], cx, cz, 8);
    }
    // ---------------- Raffles Terrace: the lighthouse replica ----------------
    { const cx = 67.4, cz = 179.3, [lo, hi] = span(ringPts(cx, cz, 6.3, 8)), y0 = hi + 0.15;
      latheP(B.p(GRN), [[6.3, lo - 2.5], [6.3, y0 + 0.6], [0.01, y0 + 0.61]], cx, cz, 8, PI/8);
      for (let i = 0; i < 16; i++){ const a = i/16*TAU; segP(B.p(IRON), [cx + Math.cos(a)*6.1, y0 + 0.6, cz + Math.sin(a)*6.1], [cx + Math.cos(a)*6.1, y0 + 1.6, cz + Math.sin(a)*6.1], 0.04, 3); }
      latheP(B.p(IRON), [[6.15, y0 + 1.55], [6.15, y0 + 1.65]], cx, cz, 16);
      latheP(B.p(WHITE), [[2.1, y0 + 0.6], [1.75, y0 + 7.4], [2.25, y0 + 7.6], [2.25, y0 + 7.85]], cx, cz, 8, PI/8);
      for (const y of [2.6, 4.8]) shapeP(B.p(DARK), mv(rArchO(0.3, 1.0), 0, y0 + y), fZ(cz + 1.97, 1, cx), 0.02);
      for (let i = 0; i < 12; i++){ const a = i/12*TAU; segP(B.p(IRON), [cx + Math.cos(a)*2.15, y0 + 7.85, cz + Math.sin(a)*2.15], [cx + Math.cos(a)*2.15, y0 + 8.75, cz + Math.sin(a)*2.15], 0.03, 3); }
      latheP(B.p(IRON), [[2.15, y0 + 8.7], [2.15, y0 + 8.8]], cx, cz, 12);
      latheP(B.p(LANT), [[1.15, y0 + 7.85], [1.15, y0 + 9.4]], cx, cz, 8, PI/8);
      for (let i = 0; i < 8; i++){ const a = PI/8 + i/8*TAU; segP(B.p(CAP), [cx + Math.cos(a)*1.17, y0 + 7.85, cz + Math.sin(a)*1.17], [cx + Math.cos(a)*1.17, y0 + 9.4, cz + Math.sin(a)*1.17], 0.05, 3); }
      latheP(B.p(CAP), [[1.35, y0 + 9.4], [1.2, y0 + 9.65], [0.6, y0 + 10.3], [0.12, y0 + 10.6], [0.05, y0 + 11.2]], cx, cz, 12);
      LSph(g, 0.18, cx, y0 + 11.3, cz, CAP, 1, 8);
    }
    // ---------------- small park structures under the hull (kept as simple fillers) and the hidden paths ----------------
    { const blockOn = (P, h, col, roof) => { const [lo, hi] = span(P), y0 = hi + 0.1; wallP(B.p(GRN), P, lo - 2, y0); prismP(B.p(col), P, y0, y0 + h);
        if (roof){ const c = ctr(P); latheP(B.p(ROOF), [[Math.hypot(P[0][0] - c[0], P[0][1] - c[1]) + 0.6, y0 + h], [0.01, y0 + h + roof]], c[0], c[1], 4, Math.atan2(P[0][1] - c[1], P[0][0] - c[0])); } };
      blockOn([[-19.6, -106.1], [-39.3, -102.0], [-41.7, -115.6], [-22.0, -119.2]], 3.6, WHITE, 0);          // single-storey wing at the Centre's south end
      blockOn([[19.2, 134.6], [28.2, 143.5], [18.6, 152.4], [9.7, 143.5]], 3.4, WHITE, 2.6);                // shelter on the way up to Raffles Terrace
      { const P = [[-129.4, -112.7], [-122.9, -113.3], [-122.3, -109.7], [-128.8, -108.5]], [lo, hi] = span(P); prismP(B.p(GRN), P, lo - 1.5, hi + 0.25); parP(B.p(QUO), P, hi + 0.25, hi + 1.0, 0.45); }   // ruined walls of the married soldiers' quarters
      { const c = [-13.7, -129.1], [lo, hi] = span(ringPts(c[0], c[1], 2.4, 4)); bxP(B.p(QUO), c[0] - 2.2, c[0] + 2.2, lo - 1.5, hi + 0.5, c[1] - 2.2, c[1] + 2.2);
        bxP(B.p(WHITE), c[0] - 1.1, c[0] + 1.1, hi + 0.5, hi + 2.0, c[1] - 1.1, c[1] + 1.1); LFrust(g, 1.1, 1.1, 0.35, 0.35, 2.6, c[0], hi + 2.0, c[1], WHITE); }   // Napier memorial
      // trees: the app plants none inside a landmark's ground plan, so the model carries the park trees there (same form
      // and density as the app's park trees: squashed icosahedra 3.5-6 m, ~0.3 per 25 m cell), kept clear of the
      // buildings and inside the original hull so the plan does not grow
      { const R = LMCTX.rng, VT = mkV(), H = FC_HULL, ico = new THREE.IcosahedronGeometry(1, 0).attributes.position.array;
        const inP = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0])*(z - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; };
        const edgeD = (P, x, z) => { let d = 1e9; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], ex = b[0] - a[0], ez = b[1] - a[1], L2 = ex*ex + ez*ez || 1, t = Math.max(0, Math.min(1, ((x - a[0])*ex + (z - a[1])*ez)/L2)); d = Math.min(d, Math.hypot(x - a[0] - ex*t, z - a[1] - ez*t)); } return d; };
        const KEEP = [[-144.9, -137.7, 13], [67.4, 179.3, 10], [51.5, 211.7, 8], [18.9, 143.5, 11], [-13.7, -129.1, 5], [-125.8, -110.8, 6]];
        const CEN = offP([[-53.6, -153.6], [-57.2, -170.8], [-53.6, -172.0], [-61.4, -208.1], [-41.1, -212.3], [-33.9, -175.5], [-30.9, -176.1], [-27.4, -158.9], [-30.3, -158.3], [-22.0, -119.2], [-19.6, -106.1], [-39.3, -102.0], [-41.7, -115.6], [-50.0, -154.8]], -9);
        for (let gx = -160; gx < 80; gx += 25) for (let gz = -220; gz < 220; gz += 25){ const n = R() < 0.3 ? 1 : 0;
          for (let q = 0; q < n; q++){ const x = gx + R()*25, z = gz + R()*25, r = 3.5 + R()*2.5, v = R();
            if (!inP(H, x, z) || edgeD(H, x, z) < r*1.15 + 1.0 || inP(CEN, x, z) || KEEP.some(([kx, kz, kr]) => Math.hypot(x - kx, z - kz) < kr + r)) continue;
            const y = gnd(x, z) + r*0.75 + 1.4, col = '#' + new THREE.Color(0.36 + v*0.1, 0.52 + v*0.1, 0.3 + v*0.06).getHexString();
            vAdd(VT, col, t => { for (let i = 0; i < ico.length; i += 3) t.push(x + ico[i]*r*1.15, y + ico[i + 1]*r*0.75, z + ico[i + 2]*r*1.15); }); } }
        vFlush(g, VT, {lk:0, ds:false}); }
      const o = B.p(PATH);
      for (const L of FC_PATHS) for (let i = 0; i < L.length - 1; i++){ const a = L[i], b = L[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.05) continue;
        const nx = -(b[1] - a[1])/len*1.25, nz = (b[0] - a[0])/len*1.25, n = Math.max(1, Math.ceil(len/4)); let prev = null;
        for (let k = 0; k <= n; k++){ const x = a[0] + (b[0] - a[0])*k/n, z = a[1] + (b[1] - a[1])*k/n, y = gnd(x, z) + 0.22, cur = [[x + nx, y, z + nz], [x - nx, y, z - nz]];
          if (prev) quadP(o, prev[0], cur[0], cur[1], prev[1]); prev = cur; } }
    }
    B.flush(g); vFlush(g, V);
    return g;
  }};
SG_PLACES.push({type:'sgfortcanning', lat:FC_LAT, lon:FC_LON, rot:0});
}

// ================= MacDonald House (1949, Palmer & Turner), 40 Orchard Road =================
// Ten storeys of reinforced concrete clad in light-red sand-faced brick (Neo-Georgian), white window frames and stone
// string courses, a ground-floor banking hall with a stone base and the entrance between two tall marble columns, a blank
// plaque on the front flanked by two projecting balconies, an open light well through the upper floors, and the roof edge
// laid with green glazed tiles. Frontage ~43 m on Orchard Road, ~30 m deep. Local frame: +z = SSE (Orchard Road), +x = ESE.
LANDMARKS.sgmacdonald = {zh:'麦唐纳大厦', en:'MacDonald House', cat:'old', r:30, h:40,
  lt:{m:0, c:'#ffdcb0', k:0.85, e:0.7, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB();
    const BRICK = '#b05f48', STONE = '#e6dfcf', WHITE = '#f4f1ea', GTILE = '#3f7f55', DARK = '#2b2b2e', ROOF = '#9a958b',
      WIN = {c:'#3a3f46', m:1, fh:3.4, cw:1.4, lc:'#ffe2b8', lk:0.5}, MARB = '#efece6', GL = {c:'#5d6670', glow:'#ffe0b0', gk:0.6};
    const RING = [[-23.05, -15.56], [22.23, -15.96], [22.4, 15.88], [-21.75, 15.9]];
    const R0 = offP(RING, 0.15), G = 0.5, HB = 6.2, FH = 3.35, NF = 9, TOP = HB + NF*FH;          // TOP = 36.35
    wallP(B.p(STONE), RING, -5, G);
    // banking-hall storey: stone base
    wallP(B.p(STONE), R0, G, HB);
    // brick shaft, light well from the first floor up
    const LW = [[-5.5, -9.5], [6.5, -9.5], [6.5, 3.0], [-5.5, 3.0]];
    wallP(B.p(BRICK), R0, HB, TOP);
    wallP(B.p(BRICK), LW, HB, TOP);
    capP(B.p(ROOF), R0, HB + 0.01);
    { const x0 = -21.6, x1 = 22.2, z0 = -15.7, z1 = 15.7; for (const P of [[[x0, z0], [x1, z0], [x1, -9.5], [x0, -9.5]], [[x0, 3.0], [x1, 3.0], [x1, z1], [x0, z1]], [[x0, -9.5], [-5.5, -9.5], [-5.5, 3.0], [x0, 3.0]], [[6.5, -9.5], [x1, -9.5], [x1, 3.0], [6.5, 3.0]]]) capP(B.p(ROOF), P, TOP + 0.02); }
    // facades: white-framed windows on every floor, string courses, quoins, the central plaque and balconies
    for (const E of edgesF(R0)){
      const front = (E.a[1] + E.b[1])/2 > 14, n = Math.round(E.L/2.75), bw = E.L/n;
      for (let f = 0; f < NF; f++){ const y = HB + f*FH;
        for (let j = 0; j < n; j++){ const um = (j + 0.5)*bw; if (front && f >= 1 && f <= 2 && Math.abs(um - E.L/2) < 3.2) continue;
          slabP(B.p(WHITE), rectO(um - 0.78, um + 0.78, y + 0.75, y + 2.75), E.F, 0, 0.06); shapeP(B.p(WIN), rectO(um - 0.64, um + 0.64, y + 0.88, y + 2.62), E.F, 0.08);
          shapeP(B.p(WHITE), rectO(um - 0.64, um + 0.64, y + 1.68, y + 1.76), E.F, 0.09); slabP(B.p(STONE), rectO(um - 0.85, um + 0.85, y + 0.62, y + 0.75), E.F, 0, 0.14); } }
      for (const y of [HB, HB + 2*FH, TOP - FH]) slabP(B.p(STONE), rectO(-0.1, E.L + 0.1, y - 0.15, y + 0.2), E.F, 0, 0.18);
      for (const u of [0.45, E.L - 0.45]) for (let k = 0; k < 2*NF; k++) slabP(B.p(STONE), rectO(u - (k % 2 ? 0.35 : 0.55), u + (k % 2 ? 0.35 : 0.55), HB + k*FH/2 + 0.05, HB + k*FH/2 + FH/2 - 0.08), E.F, 0, 0.08);
      // banking hall: tall windows in the stone base
      for (let j = 0; j < n; j++){ const um = (j + 0.5)*bw; if (front && Math.abs(um - E.L/2) < 3.4) continue; shapeP(B.p(GL), rectO(um - 0.85, um + 0.85, G + 1.1, HB - 0.9), E.F, 0.05); }
      slabP(B.p(STONE), rectO(-0.1, E.L + 0.1, HB - 0.5, HB), E.F, 0, 0.3);
      if (front){ const um = E.L/2;
        shapeP(B.p(GL), rectO(um - 2.4, um + 2.4, G + 0.2, HB - 0.7), E.F, 0.05);
        for (const s of [-1, 1]){ const p = E.F(um + s*2.9, 0, 0.7); latheP(B.p(MARB), [[0.42, G], [0.36, G + 0.4], [0.32, HB - 0.6], [0.45, HB - 0.4], [0.45, HB]], p[0], p[2], 12); }
        slabP(B.p(STONE), rectO(um - 3.6, um + 3.6, HB, HB + 0.5), E.F, 0, 1.0);
        slabP(B.p(STONE), rectO(um - 2.0, um + 2.0, HB + FH + 0.3, HB + 2*FH - 0.3), E.F, 0, 0.25);          // blank plaque
        for (const s of [-1, 1]){ const u = um + s*2.95, y = HB + FH*1.05; slabP(B.p(STONE), rectO(u - 0.9, u + 0.9, y, y + 0.25), E.F, 0, 1.1); slabP(B.p(WHITE), rectO(u - 0.9, u + 0.9, y + 0.25, y + 1.2), E.F, 0.95, 1.1);
          shapeP(B.p(WIN), rectO(u - 0.6, u + 0.6, y + 0.3, y + 2.3), E.F, 0.05); } }
    }
    // parapet and the green glazed-tile roof edge
    parP(B.p(STONE), R0, TOP, TOP + 0.6, 0.3);
    { const o = B.p(GTILE), P0 = offP(R0, -0.5), P1 = offP(R0, 1.2), y0 = TOP + 0.3, y1 = TOP + 1.9;
      for (let i = 0; i < 4; i++){ const j = (i + 1) % 4; quadP(o, [P0[i][0], y0, P0[i][1]], [P0[j][0], y0, P0[j][1]], [P1[j][0], y1, P1[j][1]], [P1[i][0], y1, P1[i][1]]); }
      parP(B.p(STONE), offP(R0, 1.2), y1, y1 + 0.35, 0.4); }
    // roof plant room
    bxP(B.p(STONE), -16, -9, TOP + 0.6, TOP + 3.6, -14, -11);
    B.flush(g);
    return g;
  }};
SG_PLACES.push({type:'sgmacdonald', lat:1.299240, lon:103.846137, rot:-0.3279});
}
