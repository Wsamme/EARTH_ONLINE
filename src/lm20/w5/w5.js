// ===== City Brush v20, wave-2 group W5 — Henderson Waves, Reflections at Keppel Bay, VivoCity, Chinese Garden (Jurong Lake
// Gardens), Kranji War Memorial, Our Tampines Hub. Each model sits on its real OSM footprint / alignment; plans are given in
// local metres (x east, z south) round the SG_PLACES point, and turned by rot where noted.
// Hill sites (Henderson Waves, Kranji) carry the app terrain baked in (the 70 m height nodes round the site) so that piers,
// plinths and earthworks reach the real map ground exactly; the model base is recomputed with the app's own rule.
// Block-scoped: only LANDMARKS and SG_PLACES are touched. Real dimensions in metres; y = 0 is the model base.
{
const PI = Math.PI, HP = PI/2, TAU = PI*2;
const lerp = (a, b, t) => a + (b - a)*t;
const clamp01 = t => t < 0 ? 0 : t > 1 ? 1 : t;
const sstep = (a, b, x) => { const t = clamp01((x - a)/(b - a)); return t*t*(3 - 2*t); };
const vlen = a => Math.hypot(a[0], a[1], a[2]), nrm = a => { const l = vlen(a) || 1; return [a[0]/l, a[1]/l, a[2]/l]; };
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const mix = (a, b, t) => [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];
// triangle batches keyed by the full colour spec: many small parts of one material become one LTris call
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const quadP = (o, a, b, c, d) => { o.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2]); };
const triP = (o, a, b, c) => { o.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); };
// n-sided prism round the segment a-b (radii r0 at a, r1 at b)
const segP = function(o, a, b, r0, n, r1){
  n = n || 4; if (r1 === undefined) r1 = r0;
  const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2], L = Math.hypot(dx, dy, dz); if (L < 1e-4) return;
  const d = [dx/L, dy/L, dz/L], up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const u = nrm(cross(d, up)), v = cross(d, u);
  const ring = (p, rr) => { const R = []; for (let i = 0; i < n; i++){ const t = (i + 0.5)/n*TAU, c = Math.cos(t)*rr, s = Math.sin(t)*rr; R.push([p[0]+u[0]*c+v[0]*s, p[1]+u[1]*c+v[1]*s, p[2]+u[2]*c+v[2]*s]); } return R; };
  const A = ring(a, r0), Bq = ring(b, Math.max(r1, 0.001));
  for (let i = 0; i < n; i++){ const j = (i+1) % n; quadP(o, A[i], A[j], Bq[j], Bq[i]); }
};
const polyP = (o, pts, r, n, closed) => { for (let i = 0; i < pts.length - 1; i++) segP(o, pts[i], pts[i+1], r, n); if (closed) segP(o, pts[pts.length-1], pts[0], r, n); };
// box (w along x, d along z) standing on y, turned ry
const boxP = function(o, w, h, d, x, y, z, ry){
  const c = Math.cos(ry || 0), s = Math.sin(ry || 0), hw = w/2, hd = d/2, y1 = y + h;
  const ax = x - hw*c - hd*s, az = z + hw*s - hd*c, bx = x + hw*c - hd*s, bz = z - hw*s - hd*c, cx = x + hw*c + hd*s, cz = z - hw*s + hd*c, dx = x - hw*c + hd*s, dz = z + hw*s + hd*c;
  o.push(ax, y1, az, dx, y1, dz, cx, y1, cz, ax, y1, az, cx, y1, cz, bx, y1, bz,
    ax, y, az, ax, y1, az, bx, y1, bz, ax, y, az, bx, y1, bz, bx, y, bz,
    bx, y, bz, bx, y1, bz, cx, y1, cz, bx, y, bz, cx, y1, cz, cx, y, cz,
    cx, y, cz, cx, y1, cz, dx, y1, dz, cx, y, cz, dx, y1, dz, dx, y, dz,
    dx, y, dz, dx, y1, dz, ax, y1, az, dx, y, dz, ax, y1, az, ax, y, az);
};
// tapered box: bottom w0 x d0, top w1 x d1 (centred), standing on y, turned ry
const taperP = function(o, w0, d0, w1, d1, h, x, y, z, ry){
  const c = Math.cos(ry || 0), s = Math.sin(ry || 0);
  const C = (w, d, yy) => [[-w/2, -d/2], [w/2, -d/2], [w/2, d/2], [-w/2, d/2]].map(([px, pz]) => [x + px*c + pz*s, yy, z - px*s + pz*c]);
  const A = C(w0, d0, y), T = C(w1, d1, y + h);
  for (let i = 0; i < 4; i++){ const j = (i+1) % 4; quadP(o, A[i], A[j], T[j], T[i]); }
  quadP(o, T[0], T[1], T[2], T[3]);
};
// smooth parametric surface f(u, v) -> [x, y, z] as one indexed (smooth-shaded) mesh
const surf = function(g, nu, nv, f, col){
  const P = [], I = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) P.push(...f(i/nu, j/nv));
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++){ const a = j*(nu+1) + i, b = a + 1, c = a + nu + 2, d = a + nu + 1; I.push(a, b, c, a, c, d); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setIndex(I); geo.computeVertexNormals();
  return lmAdd(g, geo, typeof col === 'string' ? {c:col, ds:true} : Object.assign({ds:true}, col), 0, 0, 0);
};
// smooth (shared-normal) grid mesh: P(i, j) -> [x, y, z] for i <= nu, j <= nv, keep(i, j) selects the cells
const smoothGrid = function(g, nu, nv, P, keep, col){
  const id = new Int32Array((nu+1)*(nv+1)).fill(-1), pos = [], I = [];
  const vtx = (i, j) => { const k = j*(nu+1) + i; if (id[k] < 0){ id[k] = pos.length/3; pos.push(...P(i, j)); } return id[k]; };
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++){ if (!keep(i, j)) continue; const a = vtx(i, j), b = vtx(i+1, j), c = vtx(i+1, j+1), d = vtx(i, j+1); I.push(a, d, c, a, c, b); }
  if (!I.length) return;
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(I); geo.computeVertexNormals();
  return lmAdd(g, geo, typeof col === 'string' ? {c:col, ds:true} : Object.assign({ds:true}, col), 0, 0, 0);
};
// low-poly ball into a batch, round-headed tree, palm
const ICO = (() => { const P = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]], F = [[0,2,4],[4,2,1],[1,2,5],[5,2,0],[4,3,0],[1,3,4],[5,3,1],[0,3,5]], out = [];
  for (const [a, b, d] of F){ const A = P[a], Bv = P[b], D = P[d], ab = nrm(mix(A, Bv, 0.5)), bd = nrm(mix(Bv, D, 0.5)), da = nrm(mix(D, A, 0.5));
    for (const t of [[A, ab, da], [ab, Bv, bd], [da, bd, D], [ab, bd, da]]) for (const v of t) out.push(v[0], v[1], v[2]); } return out; })();
const ico = function(o, c, rx, ry){ for (let i = 0; i < ICO.length; i += 3) o.push(c[0] + ICO[i]*rx, c[1] + ICO[i+1]*ry, c[2] + ICO[i+2]*rx); };
const treeP = function(B, x, y, z, s, r, trunkC, leafC){ segP(B.p(trunkC), [x, y - 0.5, z], [x, y + 2.6*s, z], 0.22*s, 4); const k = 2.1*s*(0.85 + 0.3*r()); ico(B.p(leafC), [x, y + 3.6*s, z], k, k*0.8); };
const palm = function(B, x, y, z, h, r, trunkC, leafC){
  const lean = (r() - 0.5)*0.5, la = r()*TAU, top = [x + Math.cos(la)*lean*h*0.25, y + h, z + Math.sin(la)*lean*h*0.25];
  segP(B.p(trunkC), [x, y, z], top, 0.28, 4, 0.2);
  const o = B.p(leafC), nf = 7;
  for (let i = 0; i < nf; i++){ const a = i/nf*TAU + r(), L = 2.6 + r()*1.4, ca = Math.cos(a), sa = Math.sin(a);
    const m = [top[0] + ca*L*0.55, top[1] + 0.5, top[2] + sa*L*0.55], e = [top[0] + ca*L, top[1] - 1.1, top[2] + sa*L], w = 0.55;
    triP(o, top, [m[0] - sa*w, m[1], m[2] + ca*w], e); triP(o, top, e, [m[0] + sa*w, m[1], m[2] - ca*w]); }
};
// ---- plan helpers (local [x, z] points)
const pip = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0]-a[0])*(z-a[1])/(b[1]-a[1]) + a[0]) c = !c; } return c; };
const cen = P => { let x = 0, z = 0; for (const p of P){ x += p[0]; z += p[1]; } return [x/P.length, z/P.length]; };
const perim = P => { let L = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; L += Math.hypot(b[0]-a[0], b[1]-a[1]); } return L; };
const chaikin = (P, k) => { for (let it = 0; it < k; it++){ const Q = []; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; Q.push([a[0]*0.75 + b[0]*0.25, a[1]*0.75 + b[1]*0.25], [a[0]*0.25 + b[0]*0.75, a[1]*0.25 + b[1]*0.75]); } P = Q; } return P; };
const chaikinOpen = (P, k) => { for (let it = 0; it < k; it++){ const Q = [P[0]]; for (let i = 0; i < P.length - 1; i++){ const a = P[i], b = P[i+1]; Q.push([a[0]*0.75 + b[0]*0.25, a[1]*0.75 + b[1]*0.25], [a[0]*0.25 + b[0]*0.75, a[1]*0.25 + b[1]*0.75]); } Q.push(P[P.length-1]); P = Q; } return P; };
const resample = function(P, n){
  const seg = []; let L = 0;
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], l = Math.hypot(b[0]-a[0], b[1]-a[1]); seg.push([a, b, L, l]); L += l; }
  const out = []; let j = 0;
  for (let k = 0; k < n; k++){ const s = k*L/n; while (j < seg.length - 1 && seg[j][2] + seg[j][3] < s) j++; const [a, b, s0, l] = seg[j], t = l > 0 ? clamp01((s - s0)/l) : 0; out.push([a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t]); }
  return out;
};
const area2 = P => { let A = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; A += a[0]*b[1] - b[0]*a[1]; } return A/2; };
// outward unit normal of edge i of plan P (tested against the polygon, so concave plans work)
const edgeN = function(P, i){ const a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], L = Math.hypot(ex, ez) || 1; let nx = ez/L, nz = -ex/L; const mx = (a[0]+b[0])/2, mz = (a[1]+b[1])/2; if (pip(P, mx + nx*0.25, mz + nz*0.25)){ nx = -nx; nz = -nz; } return [nx, nz, L, mx, mz]; };
// vertical bands along the edges of plan P, `off` outside the wall, y0..y1; skip(mx, mz, nx, nz) drops an edge
const edgeBands = function(o, P, y0, y1, off, skip){
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], [nx, nz, L, mx, mz] = edgeN(P, i); if (L < 0.6 || (skip && skip(mx, mz, nx, nz))) continue;
    quadP(o, [a[0]+nx*off, y0, a[1]+nz*off], [b[0]+nx*off, y0, b[1]+nz*off], [b[0]+nx*off, y1, b[1]+nz*off], [a[0]+nx*off, y1, a[1]+nz*off]); }
};
// vertical fins / mullions along the edges of P every sp metres
const edgeFins = function(o, P, y0, y1, sp, w, d, skip){
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], [nx, nz, L, mx, mz] = edgeN(P, i); if (L < 2 || (skip && skip(mx, mz, nx, nz))) continue;
    const n = Math.max(1, Math.round(L/sp)), ry = Math.atan2(-(b[1]-a[1]), b[0]-a[0]);
    for (let k = 0; k <= n; k++){ const t = k/n; boxP(o, w, y1 - y0, d, a[0] + (b[0]-a[0])*t + nx*d/2, y0, a[1] + (b[1]-a[1])*t + nz*d/2, ry); } }
};
// flat polygon (any simple plan, triangulated) at height y, facing up
const flatPoly = function(o, P, y){
  const tri = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
  for (const [a, b, c] of tri) triP(o, [P[a][0], y, P[a][1]], [P[b][0], y, P[b][1]], [P[c][0], y, P[c][1]]);
};
// miter offset of a simple polygon (d > 0 outward, d < 0 inward)
const offRing = function(P, d){
  const n = P.length; let A2 = 0; for (let i = 0; i < n; i++){ const a = P[i], b = P[(i+1) % n]; A2 += a[0]*b[1] - b[0]*a[1]; }
  const sg = A2 > 0 ? 1 : -1, out = [];
  for (let i = 0; i < n; i++){
    const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i+1) % n];
    let ax = p1[0]-p0[0], az = p1[1]-p0[1], bx = p2[0]-p1[0], bz = p2[1]-p1[1]; const la = Math.hypot(ax, az) || 1, lb = Math.hypot(bx, bz) || 1; ax /= la; az /= la; bx /= lb; bz /= lb;
    const n1 = [sg*az, -sg*ax], n2 = [sg*bz, -sg*bx]; let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
    const k = d/Math.max(0.35, mx*n1[0] + mz*n1[1]); out.push([p1[0] + mx*k, p1[1] + mz*k]);
  }
  return out;
};
// wall of plan P from y0 to y1 (outer faces only) into a batch
const wallP = function(o, P, y0, y1){ for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; quadP(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); } };
// prism of plan P (walls + flat top) into batches
const prismP = function(ow, ot, P, y0, y1){ wallP(ow, P, y0, y1); flatPoly(ot, P, y1); };
// [E, N, E, N ...] flat footprint arrays -> local [x, z] relative to an origin (E, N)
const toXZ = (F, OE, ON) => { const P = []; for (let i = 0; i < F.length; i += 2) P.push([F[i] - OE, ON - F[i+1]]); return P; };
// app terrain baked round a site: the 70 m height nodes (decimetres); h(x, y) = the app's hC, top(r, X, Y) = the app's model base
const terrK = T => {
  const hAtB = (x, y) => {
    const fx = Math.min(T.nx - 1.0001, Math.max(0, (x + 28000)/70 - T.i0)), fy = Math.min(T.ny - 1.0001, Math.max(0, (y + 28000)/70 - T.j0));
    const i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j, H = T.H, n = T.nx;
    return ((H[j*n+i]*(1-u) + H[j*n+i+1]*u)*(1-v) + (H[(j+1)*n+i]*(1-u) + H[(j+1)*n+i+1]*u)*v)/10;
  };
  const h = (x, y) => Math.max(-0.3, hAtB(x, y));
  const top = (r, X, Y) => { let hi = -1e9; for (let a = 0; a < 12; a++) for (const f of [0, 0.35, 0.7]) hi = Math.max(hi, h(X + Math.cos(a/12*TAU)*r*f, Y + Math.sin(a/12*TAU)*r*f)); return hi + 0.6; };
  return {h, top};
};
const sgX = lon => (lon - 103.845)*111290.5, sgY = lat => (lat - 1.315)*110574;


// ======================================================================================================
// Henderson Waves (IJP Corporation / George L. Legendre with RSP Architects; AKT engineers; 2008). The 274 m pedestrian
// bridge of the Southern Ridges, 36 m above Henderson Road, between Telok Blangah Hill Park (west) and Mount Faber Park
// (east): an 8 m timber deck on steel girders and tall concrete pylons; its wave surface — curved steel ribs clad in
// slats of yellow balau — rises over the deck as sheltered alcoves with benches and dips under it as catenary bellies,
// seven waves in all (six of ~24 m, 3.5 m deep; the 57 m central wave over the road, 6 m), narrowing to the single
// spine beam at each pylon. LED-lit at night (19:00–02:00).
// Placement: rot 0 on the real OSM alignment (anchor 1.27605 N, 103.81541 E; local +x east, +z south). The app terrain
// here is smoothed (no valley: ~22 m under the bridge, 19–30 m at the ends), so the deck is set 36 m above the real road
// level of the map and the two ridge shoulders the bridge lands on are modelled as forested earthworks with the paths
// on top; the pylons stand on the map ground.
// ======================================================================================================
{
const LAT = 1.27605, LON = 103.81541, RR = 200;
const TER = {X0:-3293.09, Y0:-4306.86, i0:348, j0:334, nx:11, ny:10, H:[265,233,202,182,181,203,251,328,439,580,730,356,306,256,218,198,204,235,295,384,498,620,452,385,316,258,220,207,220,260,324,408,495,539,459,375,300,244,212,207,225,264,317,373,603,516,421,334,264,217,194,192,209,237,267,632,544,447,354,275,217,181,164,164,173,186,621,539,445,353,272,210,166,141,130,128,131,575,504,419,333,256,194,150,122,107,100,98,506,447,375,299,230,174,134,107,92,84,81,427,381,322,258,200,152,118,95,82,75,73]};
// the OSM line of the bridge (local x, z)
const LINE = [[-92.0,-78.8],[-75.6,-62.7],[-59.2,-46.6],[-42.7,-30.5],[-28.9,-20.4],[-15.0,-10.3],[5.6,-1.0],[26.2,8.4],[45.5,15.0],[64.9,21.7],[84.2,28.4],[103.5,35.1]];
LANDMARKS.hendersonwaves = {zh:'亨德森波浪桥', en:'Henderson Waves', cat:'new', r:RR, h:34, lt:{m:0, c:'#ffd7a0', k:0.55, e:0.7}, build(){
  const g = new THREE.Group(), B = mkB(), r = LMCTX.rng;
  const X = sgX(LON), Y = sgY(LAT), G = terrK(TER), TOP = G.top(RR, X, Y);
  const gl = (x, z) => G.h(X + x, Y - z) - TOP;                  // local ground of the map
  const TIMB = {c:'#a5814f', glow:'#ffb45a', gk:0.5, ds:true}, DECK = {c:'#8d6e48', ds:true}, RIB = {c:'#56514b', ds:true}, STEEL = {c:'#6c6b67', ds:true};
  const CONC = {c:'#b7b1a5', lk:0.25, ds:true}, RAIL = {c:'#4a4b4c', ds:true}, LED = {c:'#e8dcc0', glow:'#ffc977', gk:1.1, ds:true};
  const EARTH = {c:'#6f9a4b', m:0, lk:0, ds:true}, PATHC = {c:'#b3a78f', m:0, lk:0.15, ds:true}, LEAF = {c:'#4e7a42', m:0, lk:0, ds:true}, LEAF2 = {c:'#5f8a4b', m:0, lk:0, ds:true}, TRUNK = {c:'#5b4a3a', m:0, lk:0, ds:true};
  // ---- centreline: the OSM line smoothed, with arc length; extrapolated straight beyond the ends
  const P = chaikinOpen(LINE, 3), S = [0];
  for (let i = 1; i < P.length; i++) S.push(S[i-1] + Math.hypot(P[i][0]-P[i-1][0], P[i][1]-P[i-1][1]));
  const LEN = S[S.length-1];
  const at = s => {
    let i = 0; if (s <= 0) i = 0; else if (s >= LEN) i = P.length - 2; else { let lo = 0, hi = P.length - 1; while (hi - lo > 1){ const m = (lo + hi) >> 1; if (S[m] <= s) lo = m; else hi = m; } i = lo; }
    const a = P[i], b = P[i+1], l = S[i+1] - S[i] || 1, t = (s - S[i])/l, tx = (b[0]-a[0])/l, tz = (b[1]-a[1])/l;
    return [a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t, tx, tz];
  };
  // point at chainage s, lateral offset w (+ = right of the walking direction W->E, i.e. the south side), height y
  const pt = (s, w, y) => { const c = at(s); return [c[0] - c[3]*w, y, c[1] + c[2]*w]; };
  // deck level: 36 m above the road where the bridge crosses Henderson Road (chainage ~123: between the two carriageways)
  const SROAD = 123.5, cR = at(SROAD), YD = gl(cR[0], cR[1]) + 36;
  const S0 = 6, S1 = LEN + 6;                 // deck ends (abutments in the ridge shoulders)
  const WAVES = [];                           // [s0, s1, depth, +1 up / -1 down, max sweep angle]
  { let s = SROAD - 28.5 - 3*24; for (let k = 0; k < 7; k++){ const main = k === 3, L = main ? 57 : 24; WAVES.push([s, s + L, main ? 6 : 3.5, k % 2 ? 1 : -1, main ? 2.0 : 1.78]); s += L; } }
  const PYL = [WAVES[0][0], ...WAVES.map(w => w[1])];
  const A0 = 4.25;                             // rib radius across the deck (deck 8 m wide; the spine on the south edge)
  // rib of a wave at u (0..1 along the wave), point at t (0 spine .. 1 tip), f scales the radius (timber lining inside)
  const ribPt = (W, u, t, f) => {
    const sn = Math.sin(PI*u), b = W[2]*Math.pow(sn, 0.6), th = W[4]*Math.pow(sn, 0.42)*t, s = lerp(W[0], W[1], u);
    const lat = A0*f*Math.cos(th), h = (0.35 + b*f*Math.sin(th))*W[3];
    return pt(s, lat, YD + (W[3] < 0 ? -1.75 : 0.2) + h);
  };
  // ---- deck: timber walking surface, edge fascias, twin steel girders and the spine beam on the south edge
  { const dk = B.p(DECK), st = B.p(STEEL), sp = B.p(RIB), ds = 1.5;
    for (let s = S0; s < S1 - 0.01; s += ds){
      const s2 = Math.min(S1, s + ds);
      quadP(dk, pt(s, -4, YD), pt(s2, -4, YD), pt(s2, 4, YD), pt(s, 4, YD));
      quadP(st, pt(s, -4, YD - 0.45), pt(s2, -4, YD - 0.45), pt(s2, 4, YD - 0.45), pt(s, 4, YD - 0.45));
      for (const w of [-4.05]) quadP(st, pt(s, w, YD - 0.45), pt(s2, w, YD - 0.45), pt(s2, w, YD + 0.05), pt(s, w, YD + 0.05));
      // girders under the deck
      for (const w of [-2.6, 1.8]){ quadP(st, pt(s, w - 0.4, YD - 1.75), pt(s2, w - 0.4, YD - 1.75), pt(s2, w + 0.4, YD - 1.75), pt(s, w + 0.4, YD - 1.75));
        for (const e of [-0.4, 0.4]) quadP(st, pt(s, w + e, YD - 1.75), pt(s2, w + e, YD - 1.75), pt(s2, w + e, YD - 0.45), pt(s, w + e, YD - 0.45)); }
      // spine: the edge beam the waves grow from (south side)
      quadP(sp, pt(s, 4.0, YD - 1.9), pt(s2, 4.0, YD - 1.9), pt(s2, 4.0, YD + 0.55), pt(s, 4.0, YD + 0.55));
      quadP(sp, pt(s, 4.75, YD - 1.9), pt(s2, 4.75, YD - 1.9), pt(s2, 4.75, YD + 0.55), pt(s, 4.75, YD + 0.55));
      quadP(sp, pt(s, 4.0, YD + 0.55), pt(s2, 4.0, YD + 0.55), pt(s2, 4.75, YD + 0.55), pt(s, 4.75, YD + 0.55));
      quadP(sp, pt(s, 4.0, YD - 1.9), pt(s2, 4.0, YD - 1.9), pt(s2, 4.75, YD - 1.9), pt(s, 4.75, YD - 1.9));
    }
    // cross beams under the deck
    for (let s = S0 + 1; s < S1; s += 6) segP(st, pt(s, -3.2, YD - 1.2), pt(s, 4.2, YD - 1.2), 0.25, 4);
  }
  // ---- the seven waves: curved steel ribs every ~1.5 m with longitudinal timber slats on their inner face
  { const rb = B.p(RIB), tm = B.p(TIMB), NS = 11, NT = 14;
    for (const W of WAVES){
      const L = W[1] - W[0], n = Math.max(8, Math.round(L/1.45)), ribs = [];
      for (let k = 0; k <= n; k++) ribs.push(k/n);
      for (let k = 1; k < n; k++){ const u = ribs[k], pts = []; for (let i = 0; i <= NT; i++) pts.push(ribPt(W, u, i/NT, 1.04)); polyP(rb, pts, 0.13, 4); }
      for (let k = 0; k < n; k++){ const u0 = ribs[k], u1 = ribs[k+1];
        for (let j = 0; j < NS; j++){ const t0 = (j + 0.1)/NS, t1 = (j + 0.8)/NS;
          quadP(tm, ribPt(W, u0, t0, 0.98), ribPt(W, u1, t0, 0.98), ribPt(W, u1, t1, 0.98), ribPt(W, u0, t1, 0.98)); } }
      // the up-waves are shelters: timber benches along the spine side
      if (W[3] > 0){ const bn = B.p(DECK); for (let s = W[0] + L*0.22; s < W[0] + L*0.78; s += 2.4){ const a = pt(s, 3.2, YD), b = pt(s + 2.0, 3.2, YD);
          boxP(bn, 2.0, 0.45, 0.55, (a[0]+b[0])/2, YD, (a[2]+b[2])/2, Math.atan2(-(b[2]-a[2]), b[0]-a[0])); } }
    }
  }
  // ---- railings: steel posts, timber-capped handrail with an LED strip under it, on both edges
  { const rl = B.p(RAIL), ld = B.p(LED), tm = B.p(DECK);
    for (const w of [-3.95, 3.85]){
      const top = [], led = [];
      for (let s = S0; s <= S1; s += 1.8){ const a = pt(s, w, YD), b = pt(s, w, YD + 1.15); segP(rl, a, b, 0.05, 4); top.push(pt(s, w, YD + 1.15)); led.push(pt(s, w - Math.sign(w)*0.05, YD + 1.02)); }
      polyP(tm, top, 0.09, 4); polyP(ld, led, 0.035, 3);
      for (const hh of [0.35, 0.7]){ const q = []; for (let s = S0; s <= S1; s += 3.6) q.push(pt(s, w, YD + hh)); polyP(rl, q, 0.025, 3); }
    }
  }
  // ---- concrete pylons at the wave junctions down to the map ground (the tallest ~38 m by the road), abutments
  { const cc = B.p(CONC);
    for (const s of PYL){
      const c = at(s), gy = gl(c[0], c[1]) - 2.5, top = YD - 1.9, ry = Math.atan2(-c[3], c[2]), h = top - gy; if (h < 1) continue;
      taperP(cc, 1.5 + h*0.018, 2.6 + h*0.03, 1.3, 2.4, h - 2.6, c[0] - c[3]*0.4, gy, c[1] + c[2]*0.4, ry);
      taperP(cc, 1.3, 2.4, 1.6, 8.4, 2.6, c[0] - c[3]*0.4, top - 2.6, c[1] + c[2]*0.4, ry);
    }
    for (const s of [S0, S1]){ const c = at(s), ry = Math.atan2(-c[3], c[2]); boxP(cc, 3, 14, 10, c[0], YD - 14, c[1], ry); }
  }
  // ---- the ridge shoulders: forested earthworks from the deck ends down to the map ground, with the paths on top
  const MOUND = [
    {p:at(S0 + 8), d:nrm([-0.72, 0, -0.69]), lat:0.78, along:0.42},                // Telok Blangah Hill Park (west)
    {p:at(S1 - 10), d:nrm([0.74, 0, 0.67]), lat:0.95, along:0.55}];                // Mount Faber Park (east)
  const Ytop = YD - 0.25;
  const mh = (x, z) => {
    let h = -1e9;
    for (const M of MOUND){
      const dx = x - M.p[0], dz = z - M.p[1], al = dx*M.d[0] + dz*M.d[2], px = dx - M.d[0]*al, pz = dz - M.d[2]*al;
      const side = Math.hypot(px, pz), front = Math.max(0, -al), back = Math.max(0, al);
      const dd = Math.max(0, Math.hypot(Math.max(0, side - 5), front) - 1), K = 9, hh = Ytop - M.lat*(dd < K ? dd*dd/(2*K) : dd - K/2) - M.along*Math.max(0, back - 12);
      h = Math.max(h, hh);
    }
    return h;
  };
  const smax = (a, b, k) => { const hh = clamp01(0.5 + 0.5*(b - a)/k); return lerp(a, b, hh) + k*hh*(1 - hh); };
  { const ST = 4;
    for (const M of MOUND){
      const ext = 130, cx = M.p[0] + M.d[0]*45, cz = M.p[1] + M.d[2]*45, n = Math.round(2*ext/ST), Hc = [];
      for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++){ const x = cx - ext + i*ST, z = cz - ext + j*ST, gg = gl(x, z), m = mh(x, z); Hc.push([x, smax(gg, m, 2.5), z, m - gg]); }
      smoothGrid(g, n, n, (i, j) => { const q = Hc[j*(n+1) + i]; return [q[0], q[1], q[2]]; }, (i, j) => Math.max(Hc[j*(n+1) + i][3], Hc[j*(n+1) + i + 1][3], Hc[(j+1)*(n+1) + i + 1][3], Hc[(j+1)*(n+1) + i][3]) >= -0.6, EARTH);
    }
    // paved paths on the shoulders, following the real paths away from the bridge ends
    const pa = B.p(PATHC);
    const PATHS = [[[-92.0,-78.8],[-106.4,-94.9],[-120.7,-110.9],[-118.2,-120.6],[-113.2,-125.9],[-100.9,-129.6]], [[103.6,35.1],[108.3,43.1],[117.3,49.3],[120.2,57.0],[120.8,70.3]], [[103.6,35.1],[103.6,17.4],[103.6,-0.1],[105.1,-6.9]]];
    const ends = [at(S0), at(S1)];
    for (const Pp of PATHS){
      const e = Math.hypot(Pp[0][0] - ends[0][0], Pp[0][1] - ends[0][1]) < Math.hypot(Pp[0][0] - ends[1][0], Pp[0][1] - ends[1][1]) ? ends[0] : ends[1];
      const Q = [[e[0], e[1]], ...Pp]; const R = [];
      for (let i = 0; i < Q.length - 1; i++){ const a = Q[i], b = Q[i+1], L = Math.hypot(b[0]-a[0], b[1]-a[1]), k = Math.max(1, Math.round(L/3)); for (let q = 0; q < k; q++) R.push([a[0] + (b[0]-a[0])*q/k, a[1] + (b[1]-a[1])*q/k]); }
      R.push(Q[Q.length-1]);
      for (let i = 0; i < R.length - 1; i++){ const a = R[i], b = R[i+1], L = Math.hypot(b[0]-a[0], b[1]-a[1]) || 1, nx = -(b[1]-a[1])/L*1.6, nz = (b[0]-a[0])/L*1.6;
        const ya = smax(gl(a[0], a[1]), mh(a[0], a[1]), 2.5) + 0.12, yb = smax(gl(b[0], b[1]), mh(b[0], b[1]), 2.5) + 0.12;
        if (Math.min(mh(a[0], a[1]) - gl(a[0], a[1]), mh(b[0], b[1]) - gl(b[0], b[1])) < 0.5) break;
        quadP(pa, [a[0] - nx, ya, a[1] - nz], [a[0] + nx, ya, a[1] + nz], [b[0] + nx, yb, b[1] + nz], [b[0] - nx, yb, b[1] - nz]); }
    }
    // landing platforms at the deck ends
    for (const s of [S0, S1]){ const c = at(s), dir = s === S0 ? -1 : 1; quadP(pa, pt(s, -4, YD + 0.02), pt(s, 4, YD + 0.02), pt(s + dir*10, 4, YD - 0.3), pt(s + dir*10, -4, YD - 0.3)); }
    // the forest on the shoulders (and along their feet)
    const nearDeck = (x, z) => { for (let s = S0 - 16; s <= S1 + 16; s += 4){ const c = at(s); if (Math.hypot(x - c[0], z - c[1]) < 9) return true; } return false; };
    for (const M of MOUND){
      for (let k = 0; k < 650; k++){
        const a = r()*TAU, d = Math.sqrt(r())*95, x = M.p[0] + M.d[0]*40 + Math.cos(a)*d, z = M.p[1] + M.d[2]*40 + Math.sin(a)*d, m = mh(x, z), gg = gl(x, z);
        if (m - gg < 1.2 || nearDeck(x, z)) continue;
        const y = smax(gg, m, 2.5), s = 1.1 + r()*0.9; treeP(B, x, y, z, s, r, TRUNK, r() < 0.5 ? LEAF : LEAF2);
      }
    }
  }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'hendersonwaves', lat:1.27605, lon:103.81541, rot:0});
}



// ======================================================================================================
// Reflections at Keppel Bay (Studio Daniel Libeskind with DCA Architects, 2011). Six curving glass towers in three pairs at
// the entrance to Keppel Harbour — in each pair one of 41 storeys (174 m) and one of 24 (116 m) — on the real OSM footprints,
// bowing apart as they rise, their tops cut on a slope and crowned with open steel-tube frames round the roof sky gardens;
// a glazed sky bridge links each pair at the crown of its lower tower. The low "villa" blocks (6–8 storeys, curved plans,
// anodised-aluminium bands, sloping roofs) line the waterfront below; lobbies, pool deck and gardens between.
// Placement: rot 0, origin at the centre of the estate (1.266419 N, 103.811300 E); plans are the OSM rings relative to the
// reference point 1.2665 N, 103.8105 E (shifted by OX, OZ). Night: lit apartment windows, white-lit crowns, red beacons.
// ======================================================================================================
{
const OX = 89, OZ = 9, RR = 212;
const X = F => { const P = []; for (let i = 0; i < F.length; i += 2) P.push([F[i] - OX, F[i+1] - OZ]); return P; };
// towers: footprint, height, storeys, pair id (OSM rings, local x east / z south of the reference point)
const TW = [
  {F:[-82.9,-20.2,-103.8,-25.5,-104.4,-26.7,-79.9,-69.4,-64.4,-55.2,-65.0,-51.6,-63.2,-48.7], H:174, n:41, p:0},
  {F:[-85.2,-0.6,-52.4,-36.2,-44.7,-23.2,-45.8,-19.0,-45.3,-16.0,-68.5,7.1], H:116, n:24, p:0},
  {F:[1.3,-39.8,-4.1,-55.8,18.0,-57.6,18.0,-55.2,21.6,-54.0,31.2,-20.8,13.9,-8.9], H:174, n:41, p:1},
  {F:[-4.1,-14.9,3.7,-1.8,-10.0,2.3,-13.0,0.6,-15.4,0.6,-32.7,-27.3,-23.2,-41.5], H:116, n:24, p:1},
  {F:[67.6,-109.2,89.7,-108.6,90.3,-107.4,73.6,-59.3,55.0,-71.2,62.2,-97.9], H:174, n:41, p:2},
  {F:[46.7,-61.1,30.6,-52.8,21.6,-99.1,37.7,-99.7,40.1,-96.1,42.5,-95.5], H:116, n:24, p:2}];
// villa blocks along the water (footprint, height, roof slope sign)
const VL = [
  {F:[-46.4,65.8,-42.9,52.2,-39.9,44.4,-29.7,30.8,-20.2,23.1,-4.1,14.8,0.1,29.6,-7.0,32.0,-13.0,35.5,-19.0,40.9,-24.4,47.4,-30.3,57.5,-10.6,64.0,-15.4,77.7], H:27.6, k:1},
  {F:[17.4,13.6,26.4,23.1,33.0,17.8,36.5,10.0,39.5,3.5,41.3,-9.5,56.2,-9.5,53.9,7.1,46.1,23.7,34.2,36.7,26.4,42.7,7.9,23.1], H:24.3, k:-1},
  {F:[-59.6,108.5,-40.5,110.3,-40.5,115.6,-38.1,115.0,-32.1,102.0,-27.3,95.4,-13.0,86.5,-6.4,100.8,-10.0,102.6,-21.4,115.0,-24.4,120.9,-25.0,128.1,-61.4,125.1], H:24.3, k:1},
  {F:[93.9,-30.9,86.7,-33.2,78.3,-32.7,71.2,-31.5,60.4,-24.9,55.6,-19.6,44.3,-27.3,52.1,-35.6,60.4,-41.5,72.4,-46.3,83.1,-46.3,89.1,-65.9,102.2,-61.7], H:27.6, k:-1},
  {F:[129.1,-80.7,138.0,-81.9,148.8,-81.9,155.3,-81.3,163.7,-78.9,173.3,-74.8,179.2,-70.0,189.4,-59.9,179.2,-51.6,167.3,-62.3,153.0,-67.6,142.8,-68.8,142.8,-47.5,128.5,-47.5], H:24.3, k:1},
  {F:[218.6,-7.2,210.3,-8.9,201.9,-9.5,193.6,-7.7,182.2,-39.8,195.9,-43.9,202.5,-26.7,198.3,-25.5,199.5,-23.2,206.7,-23.8,223.4,-20.2,235.9,-12.5,226.4,-1.8], H:24.3, k:-1},
  {F:[224.6,-77.7,237.7,-74.2,234.1,-56.4,243.7,-55.2,252.1,-55.8,262.8,-60.5,273.6,-67.0,282.5,-57.0,276.5,-51.6,267.6,-46.9,258.0,-43.3,240.7,-42.1,231.2,-43.3,218.6,-47.5], H:27.6, k:1},
  {F:[120.1,-30.3,119.5,-26.7,131.5,-27.3,127.9,-23.8,127.3,-20.2,127.9,-16.6,124.9,-17.2,122.5,-19.0,121.9,-18.4,124.9,-14.9,134.4,-10.7,133.9,-8.9,127.3,-3.0,115.3,-6.0,115.3,-2.4,107.0,-2.4,107.0,-7.7,108.2,-11.9,105.2,-14.3,111.8,-39.8], H:21, k:-1}];
// lobbies / clubhouse pavilions
const LOB = [[107.0,-83.1,97.4,-83.1,96.8,-99.1,106.4,-99.1], [-13.6,-27.9,1.3,-39.8,7.3,-24.3,-4.1,-14.9], [54.5,-76.5,45.5,-71.8,43.1,-89.0,62.2,-97.9,56.2,-74.8], [-75.1,-11.3,-78.1,-14.3,-79.9,-23.8,-67.9,-41.5,-63.2,-24.9]];
// principal axes of a plan: centre, unit long axis, half extents along / across
const axes = P => {
  const c = cen(P); let xx = 0, zz = 0, xz = 0; for (const p of P){ const dx = p[0]-c[0], dz = p[1]-c[1]; xx += dx*dx; zz += dz*dz; xz += dx*dz; }
  const a = 0.5*Math.atan2(2*xz, xx - zz), ax = [Math.cos(a), Math.sin(a)]; let lo = 1e9, hi = -1e9, wl = 1e9, wh = -1e9;
  for (const p of P){ const u = (p[0]-c[0])*ax[0] + (p[1]-c[1])*ax[1], v = -(p[0]-c[0])*ax[1] + (p[1]-c[1])*ax[0]; lo = Math.min(lo, u); hi = Math.max(hi, u); wl = Math.min(wl, v); wh = Math.max(wh, v); }
  return {c, ax, lo, hi, wl, wh};
};
LANDMARKS.reflections = {zh:'丽珀苑（吉宝湾）', en:'Reflections at Keppel Bay', cat:'new', r:RR, h:176, lt:{m:1, c:'#e4eeff', k:0.6}, build(){
  const g = new THREE.Group(), B = mkB(), r = LMCTX.rng;
  const GL = {c:'#9cbcc6', m:1, fh:3.4, cw:2.6, lc:'#e4eeff', lk:0.5}, BAND = {c:'#eef0ec', m:0, lc:'#e8f0ff', lk:0.25}, CROWN = {c:'#e3e7ea', m:0, lc:'#f2f6ff', lk:1.3, glow:'#eef4ff', gk:0.55};
  const VGL = {c:'#71909a', m:1, fh:3.2, cw:2.4}, ALU = {c:'#d8dcdb', m:0, lk:0.25}, ROOF = {c:'#bfc3bf', m:0, lk:0.1}, LAWN = {c:'#7ca757', m:0, lk:0}, PAVE = {c:'#d3ccbc', m:0, lk:0.12};
  const POOL = {c:'#57b4c8', glow:'#3d9fc4', gk:0.35}, BEAC = {c:'#c22', glow:'#ff2a1a', gk:2}, LEAF = {c:'#557f42', m:0, lk:0}, TRUNK = {c:'#7a6a55', m:0, lk:0}, LOBG = {c:'#6f8d95', glow:'#ffd9a3', gk:0.45};
  const Y0 = -6;                                                 // foundations below the low waterfront ground
  // ---- the towers
  const built = [];
  for (let ti = 0; ti < TW.length; ti++){
    const T = TW[ti], P0 = resample(chaikin(X(T.F), 2), 40), A = axes(P0), mate = TW[ti ^ 1], Am = axes(X(mate.F));
    // bow away from the partner, a slight twist, top cut on a slope falling towards the bay
    let lx = A.c[0] - Am.c[0], lz = A.c[1] - Am.c[1]; const ll = Math.hypot(lx, lz) || 1; lx /= ll; lz /= ll;
    const lean = T.H > 150 ? 11 : 7, tw = (ti % 2 ? -1 : 1)*0.07, H = T.H, slope = T.H > 150 ? 15 : 12;
    const sgn = A.ax[1] > 0 ? -1 : 1;                              // the end towards the south (bay) is the low end
    const u01 = p => clamp01(((p[0]-A.c[0])*A.ax[0] + (p[1]-A.c[1])*A.ax[1] - A.lo)/(A.hi - A.lo || 1));
    const yTop = p => { const u = sgn > 0 ? u01(p) : 1 - u01(p); return H - slope*(1 - u); };
    const tf = (p, y) => { const f = y/H, a = tw*f, c = Math.cos(a), s = Math.sin(a), dx = p[0]-A.c[0], dz = p[1]-A.c[1], d = lean*f*f; return [A.c[0] + dx*c - dz*s + lx*d, y, A.c[1] + dx*s + dz*c + lz*d]; };
    const n = P0.length, gl = B.p(GL), bd = B.p(BAND), cr = B.p(CROWN), Hlow = H - slope;
    // glass walls in storey slices up to the low edge of the roof, then the sloped crown band
    const ys = [Y0]; for (let y = 3.6; y < Hlow - 0.5; y += 3.4*1.5) ys.push(y); ys.push(Hlow);
    for (let k = 0; k < ys.length - 1; k++) for (let i = 0; i < n; i++){ const a = P0[i], b = P0[(i+1) % n]; quadP(gl, tf(a, ys[k]), tf(b, ys[k]), tf(b, ys[k+1]), tf(a, ys[k+1])); }
    for (let i = 0; i < n; i++){ const a = P0[i], b = P0[(i+1) % n]; quadP(gl, tf(a, Hlow), tf(b, Hlow), tf(b, yTop(b) - 1.5), tf(a, yTop(a) - 1.5)); }
    // white slab edges / balcony bands every storey (offset out of the glass)
    const PO = offRing(P0, 0.35);
    for (let y = 4.2; y < Hlow - 1; y += 3.4){ for (let i = 0; i < n; i++){ const a = PO[i], b = PO[(i+1) % n]; quadP(bd, tf(a, y), tf(b, y), tf(b, y + 0.42), tf(a, y + 0.42)); } }
    // the sloping roof (sky garden) and the open crown of steel tubes rising 4 m above it
    { const top = P0.map(p => tf(p, yTop(p) - 1.5)), c3 = tf(A.c, H - slope*0.5 - 1.5); for (let i = 0; i < n; i++) triP(B.p(ROOF), c3, top[(i+1) % n], top[i]);
      const inner = offRing(P0, -2.2).map(p => tf(p, yTop(p) - 1.2)); for (let i = 0; i < n; i++) triP(B.p(LAWN), tf(A.c, H - slope*0.5 - 1.2), inner[(i+1) % n], inner[i]);
      const rim = []; for (let i = 0; i < n; i++){ const p = PO[i], a = tf(p, yTop(p) - 1.5), b = tf(p, yTop(p) + 2.5); segP(cr, a, b, 0.22, 4); rim.push(b); }
      polyP(cr, rim, 0.3, 5, true); const rim2 = PO.map(p => tf(p, yTop(p) + 0.5)); polyP(cr, rim2, 0.16, 4, true);
      // crown band (white) round the top edge
      for (let i = 0; i < n; i++){ const a = PO[i], b = PO[(i+1) % n]; quadP(bd, tf(a, yTop(a) - 2.4), tf(b, yTop(b) - 2.4), tf(b, yTop(b) - 1.4), tf(a, yTop(a) - 1.4)); }
      if (T.H > 150){ const hi = P0.reduce((m, p) => yTop(p) > yTop(m) ? p : m, P0[0]); const q = tf(hi, yTop(hi) + 2.6); LSph(g, 0.7, q[0], q[1] + 0.4, q[2], BEAC, 1, 6); } }
    // base: lobby glazing at the foot
    built.push({A, tf, P0, H, yTop});
  }
  // ---- sky bridges: one glazed link per pair at the crown of the lower tower
  for (let p = 0; p < 3; p++){
    const T1 = built[2*p], T2 = built[2*p + 1], y = T2.H - 16;
    let best = null, bd = 1e9;
    for (const a of T1.P0) for (const b of T2.P0){ const A = T1.tf(a, y), Bq = T2.tf(b, y), d = Math.hypot(A[0]-Bq[0], A[2]-Bq[2]); if (d < bd){ bd = d; best = [A, Bq]; } }
    const [A, Bq] = best, dx = Bq[0]-A[0], dz = Bq[2]-A[2], L = Math.hypot(dx, dz) + 4, mx = (A[0]+Bq[0])/2, mz = (A[2]+Bq[2])/2, ry = Math.atan2(-dz, dx);
    LBox(g, L, 4.2, 7, mx, y, mz, LOBG, ry); LBox(g, L + 1, 0.8, 8, mx, y - 0.8, mz, ALU, ry); LBox(g, L + 1, 0.6, 8, mx, y + 4.2, mz, ALU, ry);
    LBox(g, L - 2, 0.4, 5, mx, y + 4.8, mz, LAWN, ry);
  }
  // ---- villa blocks: curved plans, aluminium floor bands, glazing, roofs sloping along the block
  for (const V of VL){
    const P = X(V.F), A = axes(P), n = P.length, H = V.H;
    const yR = p => H + V.k*2.6*(((p[0]-A.c[0])*A.ax[0] + (p[1]-A.c[1])*A.ax[1] - (A.lo + A.hi)/2)/((A.hi - A.lo)/2 || 1));
    const wl = B.p(VGL), al = B.p(ALU);
    for (let i = 0; i < n; i++){ const a = P[i], b = P[(i+1) % n]; quadP(wl, [a[0], Y0, a[1]], [b[0], Y0, b[1]], [b[0], yR(b), b[1]], [a[0], yR(a), a[1]]); }
    const PO = offRing(P, 0.3);
    const minR = Math.min(...P.map(yR));
    for (let y = 3.4; y < minR - 0.6; y += 3.2) for (let i = 0; i < n; i++){ const a = PO[i], b = PO[(i+1) % n]; quadP(al, [a[0], y, a[1]], [b[0], y, b[1]], [b[0], y + 0.7, b[1]], [a[0], y + 0.7, a[1]]); }
    // roof: triangulated plan with the sloping height; a parapet band; planted terrace
    const tri = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []), rf = B.p(ROOF);
    for (const [a, b, c] of tri) triP(rf, [P[a][0], yR(P[a]), P[a][1]], [P[b][0], yR(P[b]), P[b][1]], [P[c][0], yR(P[c]), P[c][1]]);
    for (let i = 0; i < n; i++){ const a = PO[i], b = PO[(i+1) % n]; quadP(al, [a[0], yR(P[i]) - 1.0, a[1]], [b[0], yR(P[(i+1) % n]) - 1.0, b[1]], [b[0], yR(P[(i+1) % n]) + 0.4, b[1]], [a[0], yR(P[i]) + 0.4, a[1]]); }
  }
  // ---- lobbies and clubhouse: low glass pavilions under white roofs
  for (const F of LOB){ const P = X(F); prismP(B.p(LOBG), B.p(ALU), P, Y0, 5.2); const PO = offRing(P, 1.2); flatPoly(B.p(ALU), PO, 5.6); wallP(B.p(ALU), PO, 5.2, 5.6); }
  // ---- gardens between the blocks: lawns, pools, palms (on land only: north of the waterfront line)
  { const lw = B.p(LAWN), pl = B.p(POOL), pv = B.p(PAVE);
    const SH = [[-76.3,133.8],[-34.8,166.6],[76.5,11.8],[115.9,7.4],[212.1,9.5],[263.1,27.8],[290.6,32.0]];
    const shoreZ = x => { for (let i = 0; i < SH.length - 1; i++){ const a = SH[i], b = SH[i+1]; if (x >= Math.min(a[0], b[0]) && x <= Math.max(a[0], b[0])) return a[1] + (b[1]-a[1])*(x - a[0])/((b[0]-a[0]) || 1); } return 1e9; };
    const free = (x, z, m) => z < Math.min(shoreZ(x), shoreZ(x - 6), shoreZ(x + 6)) - m && !VL.some(V => pip(X(V.F), x - OX, z - OZ)) && !TW.some(T => pip(X(T.F), x - OX, z - OZ)) && !LOB.some(F => pip(X(F), x - OX, z - OZ));
    for (const [x, z, w, d, ry] of [[100, 2, 24, 8, 0.15], [160, -28, 20, 7, 0.05], [-8, 72, 18, 7, 0.75]]){ boxP(pv, w + 4, 0.25, d + 4, x - OX, -3.2, z - OZ, ry); boxP(pl, w, 0.3, d, x - OX, -3.1, z - OZ, ry); }
    for (const [x, z, w, d, ry] of [[-40, -45, 20, 14, 0.5], [45, -10, 14, 12, 0.3], [-60, 40, 14, 20, 0.6], [205, -55, 10, 8, 0.2]]) if (free(x, z, 2)) boxP(lw, w, 0.3, d, x - OX, -3.3, z - OZ, ry);
    for (let k = 0; k < 140; k++){ const x = -70 + r()*350, z = -70 + r()*190; if (!free(x, z, 4)) continue; palm(B, x - OX, -3.2, z - OZ, 7 + r()*4, r, TRUNK, LEAF); } }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'reflections', lat:1.2665 - OZ/110574, lon:103.8105 + OX/111290.5, rot:0});
}


// ======================================================================================================
// VivoCity (Toyo Ito & Associates with DP Architects, 2006), HarbourFront. The 300 m long mall on its real OSM footprint:
// the scalloped sea front of two glazed storeys under the undulating white roof edge along the 300 m waterfront promenade,
// the Sky Park on the level-3 roof (shallow reflecting and wading pools, grassed dunes, timber decks, palms, the amphitheatre
// steps), the three-storey halls behind, the block on Telok Blangah Road with the Sentosa Express station and cinemas,
// the multi-storey car park at the west end, and the wave-topped curving walls along the road.
// Placement: rot 0, origin 95 m west of the reference point 1.26437 N, 103.82295 E (plans: OSM rings in metres from it,
// shifted by OX). The map ground here (0.9 m) lies ~5 m under the model base (a hill to the north-west sets the base), so
// every level is measured from G0, the real ground under the mall. Night: lit shopfronts, the white wave edge floodlit.
// ======================================================================================================
{
const OX = -95, RR = 228, LAT = 1.26437, LON = 103.82295 + OX/111290.5;
const TER = {X0:-2549.00, Y0:-5598.36, i0:359, j0:316, nx:10, ny:9, H:[-3,-3,-3,-45,-45,-45,-45,-45,-45,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,45,9,9,9,9,9,41,-3,-3,51,52,9,9,9,9,9,42,41,41,64,65,63,60,56,52,48,45,43,42,88,89,85,79,71,63,55,50,46,44,130,130,122,110,95,80,68,58,51,47]};
const X = F => { const P = []; for (let i = 0; i < F.length; i += 2) P.push([F[i] - OX, F[i+1]]); return P; };
const FP = [-269.6,87.2,-269.7,75.2,-266.2,75.1,-266.2,67.6,-269.7,67.5,-269.7,62.1,-248.7,63.8,-233.8,67.4,-228.0,67.9,-228.5,56.8,-225.0,54.4,-225.5,50.8,-222.6,50.8,-223.2,47.8,-220.8,47.8,-225.0,-36.3,-227.3,-67.8,-148.6,-73.2,-149.1,-88.6,-120.5,-90.4,-120.5,-95.6,-118.1,-99.2,-115.1,-101.6,-112.1,-106.4,-101.9,-115.3,-82.8,-120.6,-63.1,-122.4,-43.4,-126.0,-7.6,-126.6,13.3,-130.7,23.5,-131.3,32.5,-128.3,45.6,-127.1,46.8,-124.8,52.8,-126.0,58.8,-123.0,62.4,-119.4,64.2,-108.7,63.0,-105.0,60.0,-100.9,51.0,-96.1,-48.6,-86.6,-47.4,-75.0,63.6,-83.2,70.2,-10.2,69.6,-3.0,64.8,1.1,66.0,34.3,65.4,70.4,62.5,78.7,77.3,81.1,77.9,99.5,74.9,97.3,73.2,109.6,65.3,125.1,61.1,127.5,55.1,128.7,42.0,124.5,37.2,124.5,31.3,126.9,25.9,125.7,21.1,123.9,19.8,119.7,18.0,97.2,15.7,94.3,11.6,94.9,9.3,98.3,12.3,111.3,12.3,116.7,6.9,121.4,9.9,124.5,-1.6,129.9,-8.1,130.4,-19.5,129.9,-27.3,130.4,-34.5,129.3,-39.9,123.9,-41.7,115.6,-43.9,115.6,-46.9,116.8,-53.4,123.9,-58.3,126.9,-70.2,128.1,-76.2,126.3,-85.3,119.7,-87.7,113.2,-88.8,104.9,-91.2,103.1,-92.9,100.3,-98.2,105.5,-98.2,109.0,-100.0,113.2,-102.4,115.6,-102.4,121.5,-103.0,124.5,-106.6,125.7,-159.2,128.7,-164.7,126.8,-166.5,123.8,-167.0,119.2,-173.5,119.2,-177.0,121.5,-182.5,123.9,-197.4,122.1,-201.0,123.3,-208.7,123.3,-203.3,124.3,-202.7,126.8,-204.0,128.1,-211.2,126.9,-215.4,123.9,-217.2,120.3,-218.4,114.9,-219.0,96.0,-220.8,92.5,-224.9,89.5,-229.7,87.7];
// OSM building parts used as the massing zones
const PT = {
  east:[-47.5,-74.8,63.5,-83.2,68.9,-20.9,59.3,-23.3,36.6,-22.1,-9.3,-16.7,-34.4,-16.1,-41.6,-19.1,-44.6,-23.3],
  hall:[27.7,8.2,13.3,5.8,5.0,1.1,-2.8,-6.1,-7.5,-8.4,-38.6,-4.9,-45.8,-6.1,-51.7,-13.2,-55.3,-26.2,-63.7,-41.0,-73.2,-45.2,-104.3,-44.0,-113.2,-47.6,-121.6,-57.1,-124.6,-71.3,-125.8,-89.7,-117.4,-89.7,-114.4,-87.3,-108.4,-87.9,-104.3,-83.7,-97.7,-74.3,-91.1,-72.5,-47.5,-74.8,-44.6,-23.3,-41.6,-19.1,-34.4,-16.1,-9.3,-16.7,36.6,-22.1,59.3,-23.3,68.9,-20.9,70.1,-10.2,69.5,-3.1,64.7,1.1,53.9,6.4],
  road:[-48.7,-86.7,-47.5,-74.8,-91.1,-72.5,-97.7,-74.3,-104.3,-83.7,-108.4,-87.9,-114.4,-87.3,-117.4,-89.7,-120.4,-90.3,-120.4,-95.6,-118.0,-99.2,-115.0,-101.5,-112.0,-106.3,-101.9,-115.2,-82.8,-120.5,-63.1,-122.3,-43.4,-125.8,-7.5,-126.4,13.3,-130.6,23.5,-131.2,32.5,-128.2,45.6,-127.0,46.8,-124.7,52.7,-125.8,58.7,-122.9,62.3,-119.3,64.1,-108.7,62.9,-105.1,59.9,-100.9,51.0,-96.2],
  sky:[15.1,36.6,7.4,40.8,2.0,46.7,-1.6,56.8,-2.8,64.5,-5.8,74.0,-9.9,81.1,-15.9,88.2,-24.3,93.0,-37.4,95.9,-42.8,103.6,-52.9,114.9,-61.9,119.1,-69.6,119.7,-76.2,116.7,-81.6,113.1,-84.6,100.7,-88.1,97.1,-93.5,96.5,-100.7,101.9,-101.9,109.6,-110.2,123.2,-112.6,124.4,-122.2,122.0,-131.7,122.6,-153.2,117.3,-173.5,119.1,-180.7,121.4,-186.1,121.4,-192.0,119.7,-196.8,119.1,-209.3,121.4,-214.7,118.5,-218.3,114.9,-218.9,107.2,-217.1,110.2,-213.5,112.0,-198.6,110.8,-192.0,117.3,-186.7,118.5,-179.5,117.9,-178.3,114.9,-174.7,115.5,-169.9,112.5,-168.1,108.4,-165.2,107.8,-158.0,108.4,-146.7,115.5,-131.7,115.5,-123.4,114.3,-116.2,109.6,-113.8,104.8,-114.4,96.5,-111.4,93.6,-106.7,91.8,-103.1,91.8,-107.8,82.3,-116.2,82.3,-123.4,83.5,-126.9,86.5,-128.7,90.6,-131.7,93.0,-138.9,94.2,-155.0,94.8,-161.6,97.1,-165.8,101.3,-166.4,104.2,-172.9,103.1,-176.5,103.6,-178.9,106.0,-178.9,109.6,-180.1,106.6,-179.5,103.6,-186.1,101.9,-188.4,97.1,-189.6,91.2,-205.8,75.8,-210.5,74.0,-224.9,75.2,-235.6,70.4,-239.2,69.7,-239.2,66.2,-233.8,67.5,-227.8,68.1,-218.9,65.1,-207.5,57.4,-199.8,50.3,-196.8,43.2,-196.8,38.4,-205.2,24.2,-206.9,16.5,-204.6,6.4,-200.4,1.7,-186.7,-0.7,-184.9,-3.1,-173.5,-5.5,-165.8,-13.2,-162.8,-20.9,-162.8,-29.8,-154.4,-32.2,-146.7,-35.7,-141.3,-44.6,-137.1,-39.9,-126.9,-31.6,-116.2,-25.6,-101.9,-25.0,-73.8,-28.0,-68.4,-28.0,-64.3,-26.2,-61.3,-22.7,-58.9,-10.2,-57.1,-4.3,-52.3,0.5,-45.8,3.4,-18.9,1.7,-11.7,3.4,-5.8,7.6,-0.4,12.9,6.8,27.7],
  se:[62.3,78.7,77.2,81.1,77.8,99.5,74.8,97.1,73.6,105.4,68.3,116.1,63.5,120.3,59.3,121.4,55.1,121.4,46.2,112.0,41.4,110.8,24.7,113.7,19.9,113.7,18.1,97.1,31.3,82.3,36.6,84.7,48.6,84.7,58.7,81.1],
  sw:[-235.6,70.4,-224.9,75.2,-210.5,74.0,-205.8,75.8,-189.6,91.2,-188.4,97.1,-186.1,101.9,-179.5,103.6,-180.1,106.6,-178.9,109.6,-178.3,114.9,-179.5,117.9,-186.7,118.5,-192.0,117.3,-198.6,110.8,-213.5,112.0,-217.1,110.2,-218.9,107.2,-218.9,95.9,-220.7,92.4,-224.9,89.4,-229.6,87.6,-239.2,87.5,-239.2,69.7],
  mid:[-168.1,108.4,-165.8,101.3,-161.6,97.1,-155.0,94.8,-138.9,94.2,-131.7,93.0,-128.7,90.6,-126.9,86.5,-123.4,83.5,-116.2,82.3,-107.8,82.3,-103.1,91.8,-106.7,91.8,-111.4,93.6,-114.4,96.5,-113.8,104.8,-116.2,109.6,-123.4,114.3,-131.7,115.5,-146.7,115.5,-158.0,108.4,-165.2,107.8],
  bay:[15.1,36.6,25.3,46.1,39.6,58.0,52.7,59.8,65.3,58.6,65.3,70.4,62.3,78.7,58.7,81.1,48.6,84.7,36.6,84.7,31.3,82.3,26.5,78.1,20.5,76.4,15.1,76.4,10.4,77.6,5.6,81.7,4.4,87.0,6.8,99.5,5.6,107.2,0.8,112.0,-5.2,115.5,-13.5,117.3,-24.9,117.3,-42.8,112.0,-48.1,108.4,-42.8,103.6,-37.4,95.9,-24.3,93.0,-15.9,88.2,-9.9,81.1,-5.8,74.0,-2.8,64.5,-1.6,56.8,2.0,46.7,7.4,40.8],
  west:[-266.1,67.5,-239.2,69.7,-239.2,87.5,-269.6,87.0,-269.6,75.2,-266.1,75.2],
  // the multi-storey car park at the west end (the footprint not covered by OSM parts there)
  park:[-220.8,47.8,-225.0,-36.3,-227.3,-67.8,-148.6,-73.2,-149.1,-88.6,-125.8,-89.7,-124.6,-71.3,-121.6,-57.1,-113.2,-47.6,-104.3,-44.0,-116.2,-25.6,-126.9,-31.6,-137.1,-39.9,-141.3,-44.6,-146.7,-35.7,-154.4,-32.2,-162.8,-29.8,-162.8,-20.9,-165.8,-13.2,-173.5,-5.5,-184.9,-3.1,-186.7,-0.7,-200.4,1.7,-204.6,6.4,-206.9,16.5,-205.2,24.2,-196.8,38.4,-196.8,43.2,-199.8,50.3,-207.5,57.4,-218.9,65.1,-222.6,50.8]};
LANDMARKS.vivocity = {zh:'怡丰城', en:'VivoCity', cat:'new', r:RR, h:30, water:true, lt:{m:0, c:'#fff1dc', k:0.55, e:0.6}, build(){
  const g = new THREE.Group(), B = mkB(), r = LMCTX.rng;
  const Gt = terrK(TER), TOP = Gt.top(RR, sgX(LON), sgY(LAT)), G0 = Gt.h(sgX(LON), sgY(LAT) - 20) - TOP;   // the mall's ground floor
  const WH = {c:'#eeede8', m:0, lk:0.35}, WAVE = {c:'#f6f5f1', m:0, lc:'#fff6e8', lk:1.0}, SHOP = {c:'#6c8791', glow:'#ffd7a0', gk:0.55}, GLU = {c:'#86a3ad', glow:'#ffe8c8', gk:0.25};
  const ROOF = {c:'#cdd0cc', m:0, lk:0.05}, PANEL = {c:'#c3c8c8', m:0, lk:0.2}, DARK = {c:'#4b5254', m:0, lk:0};
  const TIMB = {c:'#b28f62', m:0, lk:0.1}, PAVE2 = {c:'#dcdad2', m:0, lk:0.05}, GRASS = {c:'#7cab54', m:0, lk:0}, POOL = {c:'#5ec3d4', glow:'#3aa6d0', gk:0.3}, PROM = {c:'#c3b6a0', m:0, lk:0.15};
  const LEAF = {c:'#5a8a45', m:0, lk:0}, TRUNK = {c:'#857258', m:0, lk:0}, LAMP = {c:'#f2ead8', glow:'#ffe1a6', gk:1.3}, POLE = {c:'#5b6063', m:0, lk:0};
  const fp = X(FP), Y2 = G0 + 11.5, Y3 = G0 + 17.5;
  const P = {}; for (const k in PT) P[k] = X(PT[k]);
  // ---- the two-storey base on the whole footprint
  const wl = B.p(WH), rf = B.p(ROOF), sh = B.p(SHOP), gu = B.p(GLU);
  wallP(wl, fp, G0 - 1.5, Y2); flatPoly(rf, fp, Y2);
  // sea front and ends: shopfront glazing at level 1, a ribbon of glass at level 2; along the road: entrances only
  const isSea = (mx, mz, nx, nz) => mz > 40 && nz > -0.2;
  edgeBands(sh, fp, G0 + 0.2, G0 + 5.2, 0.12, (mx, mz, nx, nz) => mz < -60);
  edgeBands(gu, fp, G0 + 6.6, G0 + 10.4, 0.12, (mx, mz, nx, nz) => !isSea(mx, mz, nx, nz));
  edgeFins(B.p(WH), fp, G0 + 6.6, G0 + 10.4, 3.0, 0.25, 0.3, (mx, mz, nx, nz) => !isSea(mx, mz, nx, nz));
  // ---- the undulating roof edge along the sea front: a deep white fascia rising and falling over the scalloped bays
  { const wv = B.p(WAVE); let s = 0;
    for (let i = 0; i < fp.length; i++){
      const a = fp[i], b = fp[(i+1) % fp.length], [nx, nz, L, mx, mz] = edgeN(fp, i);
      if (!isSea(mx, mz, nx, nz)){ s += L; continue; }
      const k = Math.max(1, Math.round(L/2.5));
      for (let q = 0; q < k; q++){
        const t0 = q/k, t1 = (q+1)/k, s0 = s + L*t0, s1 = s + L*t1, h0 = Y2 + 1.0 + 1.6*Math.sin(s0/36*TAU), h1 = Y2 + 1.0 + 1.6*Math.sin(s1/36*TAU);
        const A = [a[0] + (b[0]-a[0])*t0, a[1] + (b[1]-a[1])*t0], Bq = [a[0] + (b[0]-a[0])*t1, a[1] + (b[1]-a[1])*t1], o = 4.2;
        const Ao = [A[0] + nx*o, A[1] + nz*o], Bo = [Bq[0] + nx*o, Bq[1] + nz*o];
        quadP(wv, [Ao[0], h0 - 2.2, Ao[1]], [Bo[0], h1 - 2.2, Bo[1]], [Bo[0], h1, Bo[1]], [Ao[0], h0, Ao[1]]);        // fascia
        quadP(wv, [A[0], h0 - 2.2, A[1]], [Bq[0], h1 - 2.2, Bq[1]], [Bo[0], h1 - 2.2, Bo[1]], [Ao[0], h0 - 2.2, Ao[1]]); // soffit
        quadP(wv, [A[0], h0, A[1]], [Bq[0], h1, Bq[1]], [Bo[0], h1, Bo[1]], [Ao[0], h0, Ao[1]]);                     // top
        if (q % 3 === 0) segP(B.p(WAVE), [Ao[0] - nx*0.6, G0, Ao[1] - nz*0.6], [Ao[0] - nx*0.6, h0 - 2.2, Ao[1] - nz*0.6], 0.22, 6);   // slender columns
      }
      s += L;
    }
  }
  // ---- level 3 and the taller blocks
  const block = (Q, y1, glass) => { wallP(B.p(WH), Q, Y2 - 0.5, y1); flatPoly(B.p(ROOF), Q, y1); if (glass) edgeBands(B.p(GLU), Q, Y2 + 1.0, y1 - 1.4, 0.1); edgeBands(B.p(WAVE), Q, y1 - 0.9, y1 + 0.5, 0.15); };
  block(P.east, Y3, true); block(P.hall, Y3, true); block(P.se, G0 + 15.5, true); block(P.sw, G0 + 15.5, true); block(P.mid, G0 + 15.5, true); block(P.west, G0 + 15.5, false);
  // the block on Telok Blangah Road (cinemas, the Sentosa Express station on level 3) with its wave-topped curving wall
  { const Q = P.road, y1 = G0 + 24; wallP(B.p(WH), Q, Y2 - 0.5, y1); flatPoly(B.p(ROOF), Q, y1);
    const wv = B.p(WAVE); let s = 0;
    for (let i = 0; i < Q.length; i++){ const a = Q[i], b = Q[(i+1) % Q.length], [nx, nz, L, mx, mz] = edgeN(Q, i); if (nz > -0.3){ s += L; continue; }
      const k = Math.max(1, Math.round(L/3));
      for (let q = 0; q < k; q++){ const t0 = q/k, t1 = (q+1)/k, h0 = y1 + 1.5 + 1.8*Math.sin((s + L*t0)/48*TAU), h1 = y1 + 1.5 + 1.8*Math.sin((s + L*t1)/48*TAU);
        const A = [a[0] + (b[0]-a[0])*t0 + nx*0.3, a[1] + (b[1]-a[1])*t0 + nz*0.3], Bq = [a[0] + (b[0]-a[0])*t1 + nx*0.3, a[1] + (b[1]-a[1])*t1 + nz*0.3];
        quadP(wv, [A[0], G0 + 6, A[1]], [Bq[0], G0 + 6, Bq[1]], [Bq[0], h1, Bq[1]], [A[0], h0, A[1]]);
        // the flowing stripes on the wall
        for (const [y, w] of [[G0 + 9, 0.9], [G0 + 13.5, 0.9], [G0 + 18, 0.9]]){ const d0 = 1.4*Math.sin((s + L*t0)/30*TAU), d1 = 1.4*Math.sin((s + L*t1)/30*TAU);
          quadP(B.p(GLU), [A[0] + nx*0.05, y + d0, A[1] + nz*0.05], [Bq[0] + nx*0.05, y + d1, Bq[1] + nz*0.05], [Bq[0] + nx*0.05, y + d1 + w, Bq[1] + nz*0.05], [A[0] + nx*0.05, y + d0 + w, A[1] + nz*0.05]); } }
      s += L; }
    edgeBands(B.p(SHOP), Q, G0 + 0.2, G0 + 5.5, 0.15, (mx, mz, nx, nz) => nz > -0.3); }
  // the multi-storey car park: open decks behind horizontal aluminium bands
  { const Q = P.park, y1 = G0 + 21.5; wallP(B.p(DARK), Q, Y2 - 0.5, y1 - 0.2); flatPoly(B.p(ROOF), Q, y1);
    for (let y = Y2 + 0.6; y < y1; y += 2.9) edgeBands(B.p(PANEL), Q, y, y + 1.7, 0.2);
    edgeBands(B.p(WAVE), Q, y1 - 0.4, y1 + 1.0, 0.25); }
  // ---- the Sky Park on the level-3 roof: the large shallow reflecting pool, wading pools, grassed dunes, timber decks, palms,
  // the amphitheatre steps; the rest of that roof is pale decking
  { const S = P.sky, tm = B.p(TIMB), gr = B.p(GRASS), pl = B.p(POOL);
    flatPoly(B.p(PAVE2), S, Y2 + 0.12);
    const inS = (x, z) => pip(S, x, z);
    const blob = (o, cx, cz, rx, rz, y, ph, n) => { const Q = []; n = n || 28; for (let k = 0; k < n; k++){ const a = k/n*TAU, f = 1 + 0.12*Math.sin(3*a + ph) + 0.07*Math.sin(5*a + 2*ph); Q.push([cx + Math.cos(a)*rx*f, cz + Math.sin(a)*rz*f]); } if (o) flatPoly(o, Q, y); return Q; };
    const C = [-110 - OX, 52];
    blob(tm, C[0], C[1], 52, 26, Y2 + 0.2, 0.4);
    blob(pl, C[0] + 2, C[1] + 1, 42, 17, Y2 + 0.32, 1.1);
    blob(pl, -175 - OX, 40, 12, 8, Y2 + 0.32, 2.0); blob(tm, -175 - OX, 40, 16, 11, Y2 + 0.2, 2.0);
    blob(pl, -40 - OX, 60, 10, 7, Y2 + 0.32, 0.7); blob(tm, -40 - OX, 60, 14, 10, Y2 + 0.2, 0.7);
    // grassed dunes round the pools
    for (const [x, z, rx, rz, hh] of [[-160, 70, 12, 8, 1.8], [-150, 15, 14, 9, 2.0], [-70, 20, 13, 8, 1.6], [-60, 85, 10, 7, 1.4], [-190, 20, 9, 7, 1.4], [-120, 10, 10, 6, 1.2]]){
      const c = [x - OX, z]; if (!inS(c[0], c[1])) continue; const Q = blob(null, c[0], c[1], rx, rz, 0, x, 18);
      for (let k = 0; k < Q.length; k++){ const a = Q[k], b = Q[(k+1) % Q.length]; triP(gr, [c[0], Y2 + 0.12 + hh, c[1]], [b[0], Y2 + 0.15, b[1]], [a[0], Y2 + 0.15, a[1]]); } }
    // amphitheatre steps facing the sea
    for (let k = 0; k < 6; k++){ const c = [-20 - OX, 70]; boxP(B.p(WH), 22 - k*2, 0.45*(k + 1), 2, c[0], Y2 + 0.15, c[1] - k*2, 0.5); }
    for (let k = 0; k < 160; k++){ const a = r()*TAU, d = 0.75 + r()*0.75, x = C[0] + Math.cos(a)*62*d, z = C[1] + Math.sin(a)*32*d; if (!inS(x, z)) continue; palm(B, x, Y2 + 0.2, z, 6 + r()*3, r, TRUNK, LEAF); }
    // glass balustrade round the roof garden
    edgeBands(B.p(GLU), S, Y2 + 0.15, Y2 + 1.25, -0.4); }
  // skylights along the hall roofs
  for (const [Q, y] of [[P.hall, Y3], [P.east, Y3]]){ const A = cen(Q);
    for (let k = -4; k <= 4; k++){ const z0 = A[1] + k*9; const xs = []; for (let x = -130 - OX; x <= 70 - OX; x += 2) if (pip(Q, x, z0) && pip(Q, x, z0 + 3)) xs.push(x);
      if (xs.length < 4) continue; let s0 = xs[0];
      for (let i = 1; i <= xs.length; i++){ if (i < xs.length && xs[i] - xs[i-1] < 2.5) continue; const s1 = xs[i-1]; if (s1 - s0 > 6){ const gl = B.p(GLU);
          quadP(gl, [s0, y + 0.1, z0], [s1, y + 0.1, z0], [s1, y + 1.6, z0 + 1.5], [s0, y + 1.6, z0 + 1.5]); quadP(gl, [s0, y + 1.6, z0 + 1.5], [s1, y + 1.6, z0 + 1.5], [s1, y + 0.1, z0 + 3], [s0, y + 0.1, z0 + 3]); }
        if (i < xs.length) s0 = xs[i]; } } }
  // ---- the waterfront promenade: the deck between the scalloped front and the sea wall, lamps, café umbrellas
  { const i0 = FP.findIndex((v, i) => i % 2 === 0 && FP[i] === 77.9 && FP[i+1] === 99.5)/2, n = fp.length, S = [];
    for (let k = i0; ; k = (k + 1) % n){ S.push(fp[k]); if (FP[2*k] === -229.7 && FP[2*k+1] === 87.7) break; if (S.length > n) break; }
    const OUT = X([-236,140.5, -69,140, 39,140, 50,141, 75,133, 78,124, 85,116, 82,100]);
    const PR = S.concat(OUT); flatPoly(B.p(PROM), PR, G0 + 0.12);
    // sea wall and railing along the outer edge
    for (let i = 0; i < OUT.length - 1; i++){ const a = OUT[i], b = OUT[i+1], L = Math.hypot(b[0]-a[0], b[1]-a[1]), ux = (b[0]-a[0])/L, uz = (b[1]-a[1])/L;
      quadP(B.p(PROM), [a[0], G0 - 1.2, a[1]], [b[0], G0 - 1.2, b[1]], [b[0], G0 + 0.12, b[1]], [a[0], G0 + 0.12, a[1]]); segP(B.p(POLE), [a[0], G0 + 1.1, a[1]], [b[0], G0 + 1.1, b[1]], 0.05, 4);
      for (let t = 0; t < L; t += 2.5) segP(B.p(POLE), [a[0] + ux*t, G0, a[1] + uz*t], [a[0] + ux*t, G0 + 1.1, a[1] + uz*t], 0.03, 3);
      for (let t = 3; t < L; t += 16){ const x = a[0] + ux*t + uz*2.5, z = a[1] + uz*t - ux*2.5; segP(B.p(POLE), [x, G0, z], [x, G0 + 5, z], 0.09, 4); boxP(B.p(LAMP), 0.6, 0.45, 0.6, x, G0 + 5, z, 0); } }
    for (let k = 0; k < 90; k++){ const x = -230 - OX + r()*300, z = 95 + r()*42; if (!pip(PR, x, z) || pip(fp, x, z)) continue; if (pip(fp, x, z - 3)) continue;
      segP(B.p(POLE), [x, G0, z], [x, G0 + 2.6, z], 0.05, 3); const um = B.p(WAVE), m = 8; for (let q = 0; q < m; q++){ const a0 = q/m*TAU, a1 = (q+1)/m*TAU; triP(um, [x, G0 + 3.1, z], [x + Math.cos(a1)*1.6, G0 + 2.5, z + Math.sin(a1)*1.6], [x + Math.cos(a0)*1.6, G0 + 2.5, z + Math.sin(a0)*1.6]); } }
  }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'vivocity', lat:LAT, lon:LON, rot:0});
}


// ======================================================================================================
// Chinese Garden (Yu Hwa Yuan, Prof. Yuen-chen Yu, 1975; Jurong Lake Gardens, renewed 2024): the garden island in Jurong
// Lake in Song-dynasty imperial style. Modelled: the seven-storey Cloud(-Piercing) Pagoda (Ru Yun Ta, 48 m, octagonal, after
// the Linggu Temple pagoda) on its terrace with the twelve zodiac figures; the Twin Pagodas by the lake (the broad Cloud
// Draping Tower and the slender Moon Receiving Tower, three storeys); the 13-arch White Rainbow Bridge (after the Summer
// Palace 17-arch bridge) from the green-roofed garden gate on the Lakeside Garden shore; the Grand Arch halls round their
// koi-pond courtyard; the Tea House pavilions and the Stone Boat on the lotus pond; the walled Suzhou-style Bonsai Garden
// with the Pavilion on the Rocks; the bronze Confucius statue; the island's paths (redrawn: the app hides paths under a
// landmark) and trees. Placement: rot 0, origin 40 m west of 1.33861 N, 103.72951 E (all plans in metres from that point,
// shifted by OX). The map ground is flat here (0.9 m; the lake surface 1.18 m). Night: floodlit pagodas, red lanterns.
// ======================================================================================================
{
const OX = -40, RR = 268, LAT = 1.33861, LON = 103.72951 + OX/111290.5;
const PATHS = [[-123.0,132.0,0,-140.5,106.0,0],[-140.5,106.0,0,-148.0,94.0,0],[-178.5,47.5,0,-146.0,51.0,0],[22.0,114.0,0,17.5,102.0,0],[-2.5,112.0,0,-11.5,92.5,0,-23.0,80.0,0],[2.5,64.5,0,-2.0,49.5,0],[16.5,61.5,0,19.5,95.0,0,17.5,102.0,0],[17.5,102.0,0,16.5,104.0,0,-2.5,112.0,0],[-2.5,112.0,0,-7.5,113.5,0],[-7.5,113.5,0,-20.0,113.0,0,-25.5,111.0,0],[-25.5,111.0,0,-55.5,92.0,0],[-55.5,92.0,0,-59.5,79.5,0,-56.5,55.5,0],[54.0,61.0,0,66.5,54.0,0],[66.5,54.0,0,85.0,42.5,0],[64.0,51.0,0,70.5,36.5,0],[70.5,36.5,0,59.0,21.0,0],[59.0,21.0,0,57.0,19.0,0],[70.5,36.5,0,81.5,35.5,0],[57.0,49.0,0,53.5,55.0,0,54.0,61.0,0],[54.0,61.0,0,55.5,74.5,0,62.0,92.5,0,65.0,93.0,0,72.5,85.5,0],[47.5,29.5,0,52.0,43.0,0,57.0,49.0,0],[57.0,49.0,0,64.0,51.0,0],[64.0,51.0,0,66.5,54.0,0],[66.5,54.0,0,80.5,78.0,0,86.0,69.0,0,86.5,48.0,0,85.0,42.5,0],[85.0,42.5,0,81.5,35.5,0],[81.5,35.5,0,80.5,23.5,0,76.5,15.5,0,69.0,15.0,0,59.0,21.0,0],[59.0,21.0,0,47.5,29.5,0],[47.5,29.5,0,39.0,32.5,0,40.5,40.5,0,39.0,46.5,0,29.5,54.0,0,16.5,61.5,0],[16.5,61.5,0,2.5,64.5,0],[2.5,64.5,0,-17.0,66.0,0],[-17.0,66.0,0,-38.0,61.5,0],[-38.0,61.5,0,-56.5,55.5,0],[-56.5,55.5,0,-65.5,52.0,0],[-65.5,52.0,0,-78.5,47.0,0],[54.0,15.5,0.0,49.5,8.0,0.0,47.0,3.5,0.2,43.0,-13.5,1.2,37.5,-16.0,1.6,20.5,-11.5,2.6],[20.5,-11.5,2.6,0.5,-12.0,1.4],[0.5,-12.0,1.4,-8.5,-13.0,1.0],[34.0,19.5,0.8,24.5,1.5,1.8],[24.5,1.5,1.8,20.5,-11.5,2.6],[20.5,-11.5,2.6,19.0,-28.5,3.6],[19.0,-28.5,3.6,19.5,-45.0,2.6,20.0,-61.5,1.6],[20.0,-61.5,1.6,20.5,-84.5,0.4],[20.5,-84.5,0.4,20.5,-92.5,0.0,20.5,-100.5,0.0,21.0,-116.5,0.0,23.0,-126.5,0.0,32.0,-149.0,0.0],[-4.5,40.5,0,-5.0,32.5,0,-1.5,15.5,0],[-37.0,19.5,0,-31.5,24.0,0,-19.0,24.5,0,-1.5,15.5,0],[-1.5,15.5,0.2,11.5,8.5,1.0,24.5,1.5,1.8],[-15.5,-5.5,0,-7.5,5.0,0],[-8.5,-13.0,0,-13.0,-7.5,0],[-12.0,-21.0,0,-9.0,-21.5,0,-8.5,-24.0,0],[-65.5,52.0,0,-62.0,40.5,0,-37.0,19.5,0],[-37.0,19.5,0,-19.0,4.0,0,-13.0,7.0,0,-7.5,5.0,0],[-7.5,5.0,0.4,-4.0,2.0,0.6,0.5,-12.0,1.4],[-17.0,66.0,0,-18.5,72.5,0,-23.0,80.0,0],[-23.0,80.0,0,-28.5,82.0,0,-34.0,80.5,0],[-34.0,80.5,0,-37.0,77.0,0,-38.0,61.5,0],[-25.5,111.0,0,-20.0,107.5,0,-14.0,108.5,0,-7.5,113.5,0],[-98.0,121.0,0,-121.5,116.0,0,-140.5,106.0,0],[-113.5,96.5,0,-109.0,99.0,0,-102.5,108.0,0,-93.5,107.0,0],[-93.5,107.0,0,-55.5,92.0,0],[-55.5,92.0,0,-34.0,80.5,0],[-107.5,72.5,0,-109.0,87.5,0,-113.5,96.5,0],[-113.5,96.5,0,-117.5,97.5,0,-137.0,94.0,0,-148.0,94.0,0],[-142.5,58.0,0,-138.5,59.0,0,-137.5,44.5,0,-141.5,44.0,0],[-119.5,-12.0,0,-99.5,-48.0,0],[-99.5,-48.0,0,-86.0,-71.0,0,-79.0,-77.5,0],[-79.0,-77.5,0,-17.0,-90.5,0],[-109.5,32.5,0,-116.0,-1.5,0,-119.5,-12.0,0],[-119.5,-12.0,0,-143.0,-26.5,0,-148.0,-27.0,0],[-165.5,105.0,0,-150.0,122.0,0,-134.0,130.5,0,-123.0,132.0,0],[-123.0,132.0,0,-107.0,131.0,0,-98.0,121.0,0],[-98.0,121.0,0,-93.5,107.0,0],[-104.5,44.5,0,-106.5,63.5,0],[-100.5,37.5,0,-95.0,30.5,0,-92.5,15.0,0,-93.0,-4.5,0,-99.5,-48.0,0],[-90.5,42.5,0,-100.5,37.5,0],[-100.5,37.5,0,-109.5,32.5,0],[-109.5,32.5,0,-133.0,31.0,0,-136.0,32.5,0,-141.0,36.5,0,-141.5,44.0,0,-145.0,43.5,0,-146.0,51.0,0],[-79.0,-77.5,0,-87.5,-91.5,0,-104.0,-108.0,0],[-104.0,-108.0,0,-120.0,-122.0,0],[-6.0,-28.5,0,2.0,-33.5,0,7.5,-45.5,0,7.5,-89.0,0],[20.5,-84.5,0.4,13.0,-87.0,0.0,7.5,-89.0,0.0],[7.5,-89.0,0,-5.0,-86.5,0],[7.0,-61.0,1.0,20.0,-61.5,1.6],[19.0,-28.5,3.6,38.0,-31.0,4.6,57.0,-33.5,5.6],[64.0,-143.0,0.0,73.5,-131.5,0.0,77.5,-127.0,0.4,83.0,-114.5,1.2,89.0,-102.0,1.8],[89.0,-102.0,1.8,89.5,-82.5,3.0,90.0,-63.5,4.0,91.0,-44.5,5.0],[91.0,-44.5,5.0,99.0,-30.0,4.2,102.5,-23.0,3.6,106.5,-15.5,3.2,115.5,-5.5,2.4,124.5,4.0,2.0],[124.5,4.0,2.0,140.0,15.0,0.8,151.0,17.5,0.2,153.0,17.0,0.2,155.5,16.5,0.0,175.5,14.5,0.0],[209.5,-82.5,0,161.5,-112.5,0],[161.5,-112.5,0,112.0,-137.5,0,64.0,-143.0,0],[64.0,-143.0,0,32.0,-149.0,0],[-104.0,-108.0,0,-130.5,-76.0,0,-136.0,-66.5,0,-148.0,-27.0,0],[89.0,-102.0,1.8,99.0,-98.5,1.2,108.5,-89.5,0.6,115.5,-82.5,0.0,117.5,-80.0,0.0,131.0,-70.0,0.0],[173.0,-105.0,0,164.5,-96.5,0,157.0,-106.0,0],[157.0,-106.0,0,137.5,-111.0,0,109.5,-128.5,0,104.5,-133.0,0,103.0,-138.5,0],[157.0,-106.0,0,161.5,-112.5,0],[168.0,-68.0,0,172.5,-62.0,0,168.0,-50.0,0,154.0,-48.0,0,146.0,-58.5,0,152.0,-71.5,0,164.5,-73.0,0,168.0,-68.0,0],[195.5,-91.0,0,175.0,-73.5,0],[81.0,-41.0,5.6,91.0,-44.5,5.0],[91.0,-44.5,5.0,105.5,-49.5,4.2,120.5,-55.0,3.2,123.0,-42.5,2.6,125.5,-30.0,1.8,134.0,-21.5,1.2,146.0,-17.5,0.6,155.0,-14.5,0.0,157.5,-13.5,0.0,164.5,-15.5,0.0,170.5,-23.5,0.0,175.5,-21.5,0.0,177.5,-18.5,0.0,177.0,-5.5,0.0,184.5,7.0,0.0],[124.5,4.0,2.0,106.0,8.5,3.0],[-143.0,66.0,0,-161.0,64.5,0,-162.5,67.5,0,-162.5,83.0,0,-160.0,85.0,0,-144.0,85.0,0,-142.5,83.5,0,-142.5,58.0,0,-146.5,58.0,0,-146.0,51.0,0],[-100.5,37.5,0,-104.5,44.5,0],[175.0,-73.5,0,168.0,-68.0,0],[148.5,-64.5,0,138.0,-69.0,0,131.0,-70.0,0,120.5,-55.0,0],[184.5,7.0,0,188.5,11.5,0],[170.5,-23.5,0,160.5,-49.0,0],[39.0,32.5,0,34.0,19.5,0],[57.0,19.0,0,54.0,15.5,0],[-2.0,49.5,0,-4.5,40.5,0],[-78.5,47.0,0,-90.5,42.5,0],[-106.5,63.5,0,-107.5,72.5,0],[-5.0,-86.5,0,-17.0,-90.5,0],[57.0,-33.5,5.6,69.0,-37.5,5.6,81.0,-41.0,5.6],[106.0,8.5,3.0,93.5,16.0,1.6,80.5,23.5,0.4],[72.5,85.5,0,80.5,78.0,0],[-120.0,-122.0,0,-125.0,-126.0,0]];
// 25 m water mask (Jurong Lake and the ponds), rows from z = MZ0 southwards, columns from x = MX0 eastwards (reference frame)
const MX0 = -322.06, MZ0 = -214.35, MASK = 'wwwwwwwwwwwwww....ww...|wwwwwwwwww.........w...|wwwwwwwww...........ww.|..wwwwww.............ww|....wwww......ww......w|....www....ww.ww.......|....www...www.ww.......|...www...wwww..w.......|...www...wwww...w......|...ww.....w.....w......|...ww............w.....|...ww....w.......ww....|...www...w......wwww...|.w.wwww........wwwwwww.|....wwww..wwwwwwwwwwwww|....wwwwwwwwwwwwwwwwwww|.....wwwwwwwwwww.....ww'.split('|');
const ISL = [[-125,-135],[-97,-150],[-75,-185],[10,-200],[115,-205],[150,-175],[172,-140],[182,-90],[186,-40],[182,20],[163,70],[138,108],[60,118],[-20,122],[-90,145],[-128,138],[-132,90],[-142,40],[-150,-20],[-140,-90]];
const wet = (x, z) => { const i = Math.floor((x - MX0)/25), j = Math.floor((z - MZ0)/25); return j >= 0 && j < MASK.length && i >= 0 && i < MASK[0].length && MASK[j][i] === 'w'; };
LANDMARKS.chinesegarden = {zh:'裕华园（星和园）', en:'Chinese Garden (Jurong Lake Gardens)', cat:'old', r:RR, h:48, water:true, lt:{m:0, c:'#ffd69c', k:0.95, e:0.8, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB(), r = LMCTX.rng;
  const G = -0.6, WL = -0.32;                                 // map ground and lake level (local)
  const WALL = {c:'#efe6d1', m:0, lk:0.8}, RED = {c:'#a3332b', m:0, lk:0.6}, RG = {c:'#3f7550', m:0, lk:0.35}, RGR = {c:'#5d6266', m:0, lk:0.3}, GOLD = {c:'#c9a246', m:0, lc:'#ffe2a0', lk:1.2};
  const MARB = {c:'#ece9e1', m:0, lk:0.7}, STONE = {c:'#b3ada0', m:0, lk:0.3}, PATHC = {c:'#cfc6b2', m:0, lk:0.1}, WOOD = {c:'#5e3a2a', m:0, lk:0.2}, BRONZE = {c:'#5f4b33', m:0, lk:0.9};
  const LANT = {c:'#d8462d', glow:'#ff6a3a', gk:1.4}, DARK = {c:'#2d2622', glow:'#ffb565', gk:0.35}, LEAF = {c:'#4f7c41', m:0, lk:0}, LEAF2 = {c:'#5f8d4a', m:0, lk:0}, TRUNK = {c:'#5b4a3a', m:0, lk:0};
  const L = (x, z) => [x - OX, z];                              // reference frame -> local
  const solid = [];                                             // footprints kept free of trees
  // ---------- builders ----------
  // Chinese hip roof over an L x W rectangle (centre cx, cz, turned ry) from the eave at y up h to the ridge; ov overhang, lift corner upturn
  const hipR = (col, cx, cz, Lr, Wr, y, h, ry, ov, lift, ridgeCol) => {
    const o = B.p(col), c = Math.cos(ry || 0), s = Math.sin(ry || 0), R = (x, yy, z) => [cx + x*c + z*s, yy, cz - x*s + z*c];
    const hl0 = Lr/2 + ov, hw0 = Wr/2 + ov, kk = Math.max(0, hl0 - hw0), n = 6, nt = 5;
    const ring = (u, dy) => { const a = hl0 + (kk - hl0)*u, b = hw0*(1 - u), yy = y + h*Math.pow(u, 1.7) + dy, lu = lift*Math.pow(1 - u, 2), P = [], C = [[-a, -b], [a, -b], [a, b], [-a, b]];
      for (let q = 0; q < 4; q++){ const A = C[q], Bc = C[(q+1) % 4]; for (let i = 0; i < n; i++){ const t = i/n, cc = Math.pow(Math.abs(2*t - 1), 4); P.push(R((A[0] + (Bc[0]-A[0])*t)*(1 + 0.03*cc*(1 - u)), yy + lu*cc, (A[1] + (Bc[1]-A[1])*t)*(1 + 0.03*cc*(1 - u)))); } }
      return P; };
    let prev = ring(0, -0.45), cur = ring(0, 0);
    for (let i = 0; i < prev.length; i++){ const j = (i+1) % prev.length; quadP(o, prev[i], prev[j], cur[j], cur[i]); }
    prev = cur;
    for (let k = 1; k <= nt; k++){ cur = ring(k/nt, 0); for (let i = 0; i < prev.length; i++){ const j = (i+1) % prev.length; quadP(o, prev[i], prev[j], cur[j], cur[i]); } prev = cur; }
    if (kk > 0.3) segP(B.p(ridgeCol || col), R(-kk - 0.4, y + h + 0.15, 0), R(kk + 0.4, y + h + 0.15, 0), 0.32, 4);
  };
  // octagonal concave roof ring from radius R0 (eave, at y) to R1 (at y + h); lift = corner upturn
  const OCT = k => k/8*TAU + PI/8;
  const octR = (col, cx, cz, R0, R1, y, h, lift) => {
    const o = B.p(col), n = 5, nt = 4;
    const ring = (u, dy) => { const rr = R0 + (R1 - R0)*Math.pow(u, 0.75), yy = y + h*Math.pow(u, 1.6) + dy, lu = lift*Math.pow(1 - u, 2), P = [];
      for (let k = 0; k < 8; k++){ const a0 = OCT(k), a1 = OCT(k+1); for (let i = 0; i < n; i++){ const t = i/n, cc = Math.pow(Math.abs(2*t - 1), 4), f = 1 + 0.05*cc*(1 - u);
        const x = (Math.cos(a0) + (Math.cos(a1) - Math.cos(a0))*t)*rr*f, z = (Math.sin(a0) + (Math.sin(a1) - Math.sin(a0))*t)*rr*f; P.push([cx + x, yy + lu*cc, cz + z]); } }
      return P; };
    let prev = ring(0, -0.4), cur = ring(0, 0);
    for (let i = 0; i < prev.length; i++){ const j = (i+1) % prev.length; quadP(o, prev[i], prev[j], cur[j], cur[i]); }
    prev = cur;
    for (let k = 1; k <= nt; k++){ cur = ring(k/nt, 0); for (let i = 0; i < prev.length; i++){ const j = (i+1) % prev.length; quadP(o, prev[i], prev[j], cur[j], cur[i]); } prev = cur; }
  };
  const octPts = (cx, cz, rr) => { const P = []; for (let k = 0; k < 8; k++) P.push([cx + Math.cos(OCT(k))*rr, cz + Math.sin(OCT(k))*rr]); return P; };
  // octagonal storey: cream walls, red corner columns, a red door / window panel on each face
  const octStorey = (cx, cz, rr, y0, hh, open) => {
    const P = octPts(cx, cz, rr); wallP(B.p(WALL), P, y0, y0 + hh);
    for (let k = 0; k < 8; k++){ const a = P[k], b = P[(k+1) % 8], mx = (a[0]+b[0])/2, mz = (a[1]+b[1])/2, nx = Math.cos((OCT(k)+OCT(k+1))/2), nz = Math.sin((OCT(k)+OCT(k+1))/2);
      segP(B.p(RED), [a[0], y0, a[1]], [a[0], y0 + hh, a[1]], 0.28 + rr*0.012, 6);
      const w = Math.hypot(b[0]-a[0], b[1]-a[1])*0.3, tx = (b[0]-a[0])/Math.hypot(b[0]-a[0], b[1]-a[1]), tz = (b[1]-a[1])/Math.hypot(b[0]-a[0], b[1]-a[1]), h0 = y0 + (open ? 0.1 : hh*0.25), h1 = y0 + hh*0.8;
      quadP(B.p(RED), [mx - tx*w + nx*0.06, h0, mz - tz*w + nz*0.06], [mx + tx*w + nx*0.06, h0, mz + tz*w + nz*0.06], [mx + tx*w + nx*0.06, h1, mz + tz*w + nz*0.06], [mx - tx*w + nx*0.06, h1, mz - tz*w + nz*0.06]);
      quadP(B.p(DARK), [mx - tx*w*0.7 + nx*0.1, h0 + 0.3, mz - tz*w*0.7 + nz*0.1], [mx + tx*w*0.7 + nx*0.1, h0 + 0.3, mz + tz*w*0.7 + nz*0.1], [mx + tx*w*0.7 + nx*0.1, h1 - 0.3, mz + tz*w*0.7 + nz*0.1], [mx - tx*w*0.7 + nx*0.1, h1 - 0.3, mz - tz*w*0.7 + nz*0.1]);
    }
    edgeBands(B.p(RED), P, y0 + hh - 0.7, y0 + hh, 0.12);
  };
  // balcony railing round an octagon of radius rr at y
  const octRail = (cx, cz, rr, y) => { const P = octPts(cx, cz, rr), o = B.p(RED); for (let k = 0; k < 8; k++){ const a = P[k], b = P[(k+1) % 8]; segP(o, [a[0], y + 1.0, a[1]], [b[0], y + 1.0, b[1]], 0.07, 4);
      for (let t = 0; t <= 1.001; t += 0.25){ const x = a[0] + (b[0]-a[0])*t, z = a[1] + (b[1]-a[1])*t; segP(o, [x, y, z], [x, y + 1.0, z], 0.05, 3); } } flatPoly(B.p(STONE), P, y); };
  // a pagoda: storeys of radius rb(k) and height hs(k) on a base at y0, eaves, balconies, a top roof and a gilded finial
  const pagoda = (cx, cz, y0, ns, rb, hs, eav, topH, fin) => {
    let y = y0;
    for (let k = 0; k < ns; k++){
      const rr = rb(k), hh = hs(k);
      if (k > 0) octRail(cx, cz, rr + 1.1, y);
      octStorey(cx, cz, rr, y, hh, k === 0); y += hh;
      flatPoly(B.p(STONE), octPts(cx, cz, rr + 0.4), y - 0.05);
      // bracket band and the eave
      wallP(B.p(RED), octPts(cx, cz, rr + 0.25), y, y + 0.55);
      if (k < ns - 1){ octR(RG, cx, cz, rr + eav, rb(k+1) + 0.2, y + 0.55, 1.5 + rr*0.06, 0.75 + rr*0.05);
        for (let q = 0; q < 8; q++){ const a = OCT(q), d = (rr + eav)*1.02; boxP(B.p(LANT), 0.42, 0.6, 0.42, cx + Math.cos(a)*d, y + 0.55 + 0.75 + rr*0.05 - 1.1, cz + Math.sin(a)*d, a); } }
      y += 0.55 + (k < ns - 1 ? 0.7 : 0);
    }
    octR(RG, cx, cz, rb(ns - 1) + eav, 0.25, y, topH, 0.9);
    const yt = y + topH, f = fin/6.2; LLathe(g, [[0, 0], [0.9, 0], [1.0, 0.5], [0.55, 1.0], [0.5, 1.6], [1.1, 2.1], [0.6, 2.7], [0.35, 3.2], [0.8, 3.6], [0.3, 4.1], [0.15, 5.6], [0.32, 5.85], [0.0, 6.2]].map(q => [q[0]*Math.sqrt(f), q[1]*f]), cx, yt - 0.3, cz, GOLD, 8);
    return yt + fin;
  };
  // rectangular hall: walls with red columns, a dark door band at the front, hip roof (double eave if dbl)
  const hall = (cx, cz, Lh, Wh, ry, y0, hh, roofC, dbl, base) => {
    const c = Math.cos(ry), s = Math.sin(ry), R = (x, z) => [cx + x*c + z*s, cz - x*s + z*c];
    const P = [R(-Lh/2, -Wh/2), R(Lh/2, -Wh/2), R(Lh/2, Wh/2), R(-Lh/2, Wh/2)]; solid.push(P.map(p => [p[0], p[1]]));
    if (base){ const PB = [R(-Lh/2 - base, -Wh/2 - base), R(Lh/2 + base, -Wh/2 - base), R(Lh/2 + base, Wh/2 + base), R(-Lh/2 - base, Wh/2 + base)]; prismP(B.p(STONE), B.p(STONE), PB, G - 0.3, y0); }
    prismP(B.p(WALL), B.p(WALL), P, y0, y0 + hh);
    const nc = Math.max(2, Math.round(Lh/3.6));
    for (let i = 0; i <= nc; i++){ const x = -Lh/2 + Lh*i/nc; for (const zz of [-Wh/2 - 0.35, Wh/2 + 0.35]){ const p = R(x, zz); segP(B.p(RED), [p[0], y0, p[1]], [p[0], y0 + hh, p[1]], 0.26, 6); } }
    for (const zz of [-Wh/2 - 0.05, Wh/2 + 0.05]){ const a = R(-Lh/2 + 0.6, zz), b = R(Lh/2 - 0.6, zz); quadP(B.p(DARK), [a[0], y0 + 0.2, a[1]], [b[0], y0 + 0.2, b[1]], [b[0], y0 + hh*0.72, b[1]], [a[0], y0 + hh*0.72, a[1]]);
      quadP(B.p(RED), [a[0], y0 + hh*0.72, a[1]], [b[0], y0 + hh*0.72, b[1]], [b[0], y0 + hh, b[1]], [a[0], y0 + hh, a[1]]); }
    if (dbl){ hipR(roofC, cx, cz, Lh + 0.6, Wh + 0.6, y0 + hh, 1.4, ry, 1.6, 0.5); const y2 = y0 + hh + 1.6; prismP(B.p(RED), B.p(WALL), [R(-Lh/2 + 1.5, -Wh/2 + 1.5), R(Lh/2 - 1.5, -Wh/2 + 1.5), R(Lh/2 - 1.5, Wh/2 - 1.5), R(-Lh/2 + 1.5, Wh/2 - 1.5)], y0 + hh, y2 + 1.4);
      hipR(roofC, cx, cz, Lh - 2.4, Wh - 2.4, y2 + 1.4, Math.min(Wh*0.32, 4.6), ry, 1.4, 0.6); }
    else hipR(roofC, cx, cz, Lh, Wh, y0 + hh, Math.min(Wh*0.36, 4.2), ry, 1.3, 0.55);
  };
  // small open pavilion (hexagonal / square) with a pointed roof
  const kiosk = (cx, cz, rr, y0, n) => { const P = []; for (let k = 0; k < n; k++){ const a = k/n*TAU; P.push([cx + Math.cos(a)*rr, cz + Math.sin(a)*rr]); } flatPoly(B.p(STONE), P, y0 + 0.4); wallP(B.p(STONE), P, G, y0 + 0.4); solid.push(P);
    for (const p of P) segP(B.p(RED), [p[0]*0.88 + cx*0.12, y0 + 0.4, p[1]*0.88 + cz*0.12], [p[0]*0.88 + cx*0.12, y0 + 3.6, p[1]*0.88 + cz*0.12], 0.17, 6);
    const o = B.p(RG), top = [cx, y0 + 3.6 + rr*0.75, cz]; for (let k = 0; k < n; k++){ const a = P[k], b = P[(k+1) % n], A = [cx + (a[0]-cx)*1.35, y0 + 3.5 + 0.35, cz + (a[1]-cz)*1.35], Bq = [cx + (b[0]-cx)*1.35, y0 + 3.5 + 0.35, cz + (b[1]-cz)*1.35], m = [(A[0]+Bq[0])/2*0.97 + cx*0.03, y0 + 3.5, (A[2]+Bq[2])/2*0.97 + cz*0.03]; triP(o, A, m, top); triP(o, m, Bq, top); }
    LCone(g, 0.25, 1.0, top[0], top[1] - 0.1, top[2], GOLD, 6); };
  const lantern = (x, y, z) => { boxP(B.p(LANT), 0.55, 0.75, 0.55, x, y, z, 0); };

  // ---------- the Cloud Pagoda on its terrace ----------
  { const C = L(159.5, -60.5), y0 = G + 3.9, T = octPts(C[0], C[1], 16);
    prismP(B.p(MARB), B.p(STONE), T, G - 0.4, y0); edgeBands(B.p(STONE), T, y0 - 0.5, y0 - 0.2, 0.15); solid.push(octPts(C[0], C[1], 19));
    // balustrade and four flights of steps
    { const o = B.p(MARB); for (let k = 0; k < 8; k++){ const a = T[k], b = T[(k+1) % 8]; segP(o, [a[0], y0 + 0.9, a[1]], [b[0], y0 + 0.9, b[1]], 0.12, 4); for (let t = 0; t < 1; t += 0.125){ const x = a[0] + (b[0]-a[0])*t, z = a[1] + (b[1]-a[1])*t; boxP(o, 0.3, 1.0, 0.3, x, y0, z, 0); } } }
    for (let k = 0; k < 4; k++){ const a = k*HP, dx = Math.cos(a), dz = Math.sin(a); for (let st = 0; st < 9; st++){ const d = 15.2 + st*0.75; boxP(B.p(MARB), Math.abs(dx) > 0.5 ? 0.8 : 7, y0 - G - st*0.43, Math.abs(dx) > 0.5 ? 7 : 0.8, C[0] + dx*d, G - 0.2, C[1] + dz*d, 0); } }
    pagoda(C[0], C[1], y0, 7, k => 7.3 - 0.42*k, k => k === 0 ? 6.2 : 3.9, 2.7, 3.0, 4.6);
    // the twelve zodiac figures round the terrace
    for (let k = 0; k < 12; k++){ const a = k/12*TAU + 0.13, x = C[0] + Math.cos(a)*22, z = C[1] + Math.sin(a)*22; boxP(B.p(STONE), 1.3, 1.1, 1.3, x, G, z, a); ico(B.p(BRONZE), [x, G + 2.0, z], 0.65, 0.95); }
    for (let k = 0; k < 8; k++){ const a = OCT(k) - PI/8; lantern(C[0] + Math.cos(a)*15.5, y0 + 1.1, C[1] + Math.sin(a)*15.5); } }

  // ---------- the Twin Pagodas by the lake (on a stone terrace at the water's edge) ----------
  { const T1 = L(-133, -110), T2 = L(-112, -123);
    const TER = [L(-148, -100), L(-120, -96), L(-96, -114), L(-104, -136), L(-130, -134), L(-150, -118)]; prismP(B.p(STONE), B.p(STONE), TER, G - 1.2, G + 1.0); solid.push(TER);
    { const o = B.p(MARB); for (let k = 0; k < TER.length; k++){ const a = TER[k], b = TER[(k+1) % TER.length]; segP(o, [a[0], G + 1.9, a[1]], [b[0], G + 1.9, b[1]], 0.1, 4); for (let t = 0; t < 1; t += 0.2){ boxP(o, 0.25, 0.9, 0.25, a[0] + (b[0]-a[0])*t, G + 1.0, a[1] + (b[1]-a[1])*t, 0); } } }
    pagoda(T1[0], T1[1], G + 1.0, 3, k => 5.2 - 0.6*k, k => k === 0 ? 4.8 : 3.9, 2.3, 2.8, 3.4);       // Cloud Draping Tower (broad)
    pagoda(T2[0], T2[1], G + 1.0, 3, k => 3.5 - 0.35*k, k => k === 0 ? 4.8 : 4.0, 1.9, 2.6, 3.0);      // Moon Receiving Tower (slender)
    for (const p of TER) lantern(p[0], G + 1.9, p[1]); }

  // ---------- the White Rainbow Bridge (13 arches) and the garden gate on the Lakeside Garden shore ----------
  { const A0 = L(-255, 41), A1 = L(-123, 132), LEN = Math.hypot(A1[0]-A0[0], A1[1]-A0[1]), ux = (A1[0]-A0[0])/LEN, uz = (A1[1]-A0[1])/LEN, nx = -uz, nz = ux;
    const S0 = 4, S1 = LEN - 6, W = 7.2, NA = 13, SW0 = 24, SW1 = 128;           // deck ends, width, arches between SW0..SW1 (over the water)
    const deck = s => G + 0.25 + 4.9*Math.pow(Math.sin(PI*clamp01((s - S0)/(S1 - S0))), 0.8);
    const P3 = (s, w, y) => [A0[0] + ux*s + nx*w, y, A0[1] + uz*s + nz*w];
    const mb = B.p(MARB), st = B.p(STONE);
    // arch layout: spans grow towards the middle
    const wts = []; for (let i = 0; i < NA; i++) wts.push(1 + 0.45*Math.sin(PI*(i + 0.5)/NA)); const tw = wts.reduce((a, b) => a + b, 0);
    const piers = [SW0]; for (let i = 0; i < NA; i++) piers.push(piers[i] + (SW1 - SW0)*wts[i]/tw);
    const pw = 1.6;                                                                                  // pier width
    // deck slab, parapets (white balustrades), approach ramps down to the ground
    for (let s = S0; s < S1 - 0.01; s += 2){ const s2 = Math.min(S1, s + 2), y1 = deck(s), y2 = deck(s2);
      quadP(mb, P3(s, -W/2, y1), P3(s2, -W/2, y2), P3(s2, W/2, y2), P3(s, W/2, y1));
      for (const w of [-W/2 - 0.1, W/2 + 0.1]){ quadP(mb, P3(s, w, y1 + 1.05), P3(s2, w, y2 + 1.05), P3(s2, w, y2 + 1.3), P3(s, w, y1 + 1.3)); boxP(mb, 0.32, 1.25, 0.32, P3(s, w, 0)[0], y1, P3(s, w, 0)[2], 0); }
      // outside the arch run the bridge is a solid embankment
      if (s < SW0 || s2 > SW1) for (const w of [-W/2, W/2]) quadP(mb, P3(s, w, WL - 1), P3(s2, w, WL - 1), P3(s2, w, y2), P3(s, w, y1));
    }
    // spandrel walls with the arch openings, arch vaults and the piers with cutwaters
    for (let i = 0; i < NA; i++){
      const a = piers[i] + pw/2, b = piers[i+1] - pw/2, c = (a + b)/2, ra = (b - a)/2, ys = WL + 0.2, n = 10;
      const ytop = sd => deck(sd) - 0.05;
      for (const w of [-W/2, W/2]){ const o = mb;
        for (let k = 0; k < n; k++){ const t0 = PI - PI*k/n, t1 = PI - PI*(k+1)/n, s0 = c + Math.cos(t0)*ra, s1 = c + Math.cos(t1)*ra, h0 = ys + Math.sin(t0)*ra*1.05, h1 = ys + Math.sin(t1)*ra*1.05;
          quadP(o, P3(s0, w, h0), P3(s1, w, h1), P3(s1, w, ytop(s1)), P3(s0, w, ytop(s0)));
          quadP(st, P3(s0, -W/2, h0), P3(s1, -W/2, h1), P3(s1, W/2, h1), P3(s0, W/2, h0)); } }
      // the arch ring (voussoirs) picked out
      { const R1 = []; for (let k = 0; k <= n; k++){ const t = PI - PI*k/n; R1.push([c + Math.cos(t)*(ra + 0.25), ys + Math.sin(t)*(ra + 0.25)*1.05]); } for (const w of [-W/2 - 0.08, W/2 + 0.08]) polyP(st, R1.map(q => P3(q[0], w, q[1])), 0.18, 4); }
    }
    for (let i = 0; i <= NA; i++){ const s = piers[i], y = deck(s); for (const w of [-W/2, W/2]){ quadP(mb, P3(s - pw/2, w, WL - 1), P3(s + pw/2, w, WL - 1), P3(s + pw/2, w, y), P3(s - pw/2, w, y)); }
      quadP(mb, P3(s - pw/2, -W/2, WL - 1), P3(s - pw/2, W/2, WL - 1), P3(s - pw/2, W/2, WL + 0.2), P3(s - pw/2, -W/2, WL + 0.2)); quadP(mb, P3(s + pw/2, -W/2, WL - 1), P3(s + pw/2, W/2, WL - 1), P3(s + pw/2, W/2, WL + 0.2), P3(s + pw/2, -W/2, WL + 0.2));
      for (const sg of [-1, 1]) triP(st, P3(s - pw/2, sg*W/2, WL + 0.6), P3(s + pw/2, sg*W/2, WL + 0.6), P3(s, sg*(W/2 + 1.4), WL + 0.6)); }
    // lanterns on the newel posts at both ends and the crown
    for (const s of [S0 + 1, S1 - 1, (S0 + S1)/2]) for (const w of [-W/2 - 0.1, W/2 + 0.1]){ const p = P3(s, w, 0); boxP(mb, 0.6, 1.8, 0.6, p[0], deck(s), p[2], 0); lantern(p[0], deck(s) + 1.8, p[2]); }
    // the garden gate at the shore end: three arched openings, red walls, a green-tiled hip roof, a pair of lions
    { const gc = P3(-8, 0, 0), ry = Math.atan2(-nz, nx), Lg = 17, Wg = 5.5, hg = 6.2, c = Math.cos(ry), s = Math.sin(ry), R = (x, z) => [gc[0] + x*c + z*s, gc[2] - x*s + z*c];
      const P = [R(-Lg/2, -Wg/2), R(Lg/2, -Wg/2), R(Lg/2, Wg/2), R(-Lg/2, Wg/2)]; prismP(B.p(RED), B.p(RED), P, G - 0.3, G + hg); solid.push(P);
      for (const zz of [-Wg/2 - 0.06, Wg/2 + 0.06]) for (const [x, w, h] of [[-5.2, 2.4, 3.4], [0, 3.4, 4.4], [5.2, 2.4, 3.4]]){ const o = B.p(DARK), n = 6, pts = [];
        for (let k = 0; k <= n; k++){ const t = PI - PI*k/n; pts.push([x + Math.cos(t)*w/2, G + h - w/2 + Math.sin(t)*w/2]); }
        for (let k = 0; k < n; k++){ const a = R(pts[k][0], zz), b = R(pts[k+1][0], zz); quadP(o, [a[0], G, a[1]], [b[0], G, b[1]], [b[0], pts[k+1][1], b[1]], [a[0], pts[k][1], a[1]]); } }
      edgeBands(B.p(WALL), P, G + hg - 1.1, G + hg - 0.4, 0.1);
      hipR(RG, gc[0], gc[2], Lg, Wg, G + hg, 2.6, ry, 1.5, 0.6);
      for (const sg of [-1, 1]){ const p = R(sg*4.0, Wg/2 + 3.5); boxP(B.p(STONE), 1.3, 1.4, 2.0, p[0], G, p[1], ry); ico(B.p(MARB), [p[0], G + 2.3, p[1]], 0.75, 1.0); }
      lantern(R(-Lg/2, Wg/2 + 0.6)[0], G + 4, R(-Lg/2, Wg/2 + 0.6)[1]); lantern(R(Lg/2, Wg/2 + 0.6)[0], G + 4, R(Lg/2, Wg/2 + 0.6)[1]); } }

  // ---------- the Grand Arch halls round the koi-pond courtyard (facing the bridge, south) ----------
  { const ry = -0.03;
    hall(...L(-134, 58.5), 40, 11, ry, G + 1.6, 6.0, RG, true, 1.6);          // the arch hall (front, with the gateway)
    hall(...L(-147, 47), 9, 13, ry, G + 0.9, 4.2, RG, false, 0.8);
    hall(...L(-121, 47), 9, 11, ry, G + 0.9, 4.2, RG, false, 0.8);
    hall(...L(-134, 41.5), 22, 6, ry, G + 0.9, 4.2, RG, false, 0.8);
    flatPoly(B.p(STONE), [L(-142, 44), L(-126, 44), L(-126, 52), L(-142, 52)], G + 0.25);
    // the broad flights of steps towards the bridge
    for (let st = 0; st < 6; st++) boxP(B.p(MARB), 30, 1.6 - st*0.27, 1.0, ...[L(-134, 66.5 + st)[0], G, L(-134, 66.5 + st)[1]], ry);
    // the gateway arch in the front hall: a tall dark opening and a raised roof over it
    { const p = L(-134, 64.2); quadP(B.p(DARK), [p[0] - 2.6, G + 1.6, p[1]], [p[0] + 2.6, G + 1.6, p[1]], [p[0] + 2.6, G + 6.4, p[1]], [p[0] - 2.6, G + 6.4, p[1]]); }
    for (const x of [-152, -116]) lantern(...[L(x, 65)[0], G + 4.5, L(x, 65)[1]]); }

  // ---------- Tea House pavilions and the Stone Boat on the lotus pond ----------
  { hall(...L(-12.9, -16.2), 9.6, 6, 1.48, G + 0.5, 3.6, RG, false, 0.5);
    hall(...L(-8.3, -29.9), 11.5, 4.8, 1.42, G + 0.5, 3.4, RG, false, 0.5);
    hall(...L(-10.5, -4), 14, 5.5, -0.87, G + 0.5, 3.6, RG, false, 0.5);
    hall(...L(-21.5, 1.5), 9, 5, 0.7, G + 0.5, 3.4, RG, false, 0.5);
    // the pavilion hall on the west bank of the pond (two wings)
    hall(...L(-79, -57), 21, 12, 0.91, G + 0.6, 4.4, RG, true, 0.8);
    hall(...L(-72, -38), 20, 7.5, -0.66, G + 0.6, 4.0, RG, false, 0.8);
    // the Stone Boat: a marble hull in the pond with a two-storey pavilion on its deck
    { const C = L(-46, -38), ry = 1.25, c = Math.cos(ry), s = Math.sin(ry), R = (x, z) => [C[0] + x*c + z*s, C[1] - x*s + z*c];
      const hull2 = []; for (let k = 0; k <= 12; k++){ const t = k/12, x = -12 + 24*t, w = 3.2*Math.pow(Math.sin(PI*Math.min(1, t*1.15 + 0.02)), 0.5); hull2.push([x, w]); }
      const P = [...hull2.map(q => R(q[0], q[1])), ...hull2.slice().reverse().map(q => R(q[0], -q[1]))].filter(p => !isNaN(p[0]));
      prismP(B.p(MARB), B.p(STONE), P, WL - 0.6, WL + 1.3); solid.push(P);
      hall(...R(-1.5, 0), 11, 4.4, ry, WL + 1.3, 3.2, RG, true, 0); } }

  // ---------- the Bonsai Garden: white walls with grey tile copings, halls, the Pavilion on the Rocks ----------
  { const W = [[90.3,38.4],[93,43.7],[97.2,66.8],[94.5,90.3],[62,115.5],[36.3,58.2],[48,47.9],[48.3,43.1],[43.8,31],[28.9,-0.5],[25.3,-12.6],[24.1,-25.1],[59,-31.6],[76,6.9]].map(p => L(p[0], p[1]));
    for (let i = 0; i < W.length; i++){ const a = W[i], b = W[(i+1) % W.length], Lw = Math.hypot(b[0]-a[0], b[1]-a[1]); if (Lw < 1) continue; const ry = Math.atan2(-(b[1]-a[1]), b[0]-a[0]);
      boxP(B.p(WALL), Lw, 2.6, 0.45, (a[0]+b[0])/2, G, (a[1]+b[1])/2, ry); boxP(B.p(RGR), Lw + 0.4, 0.35, 1.1, (a[0]+b[0])/2, G + 2.6, (a[1]+b[1])/2, ry); }
    // moon gate on the west wall
    hall(...L(79.3, 63.3), 11, 8, -1.19, G + 0.6, 4.0, RGR, false, 0.6);
    hall(...L(89.5, 42.2), 6, 5, -1.15, G + 0.4, 3.2, RGR, false, 0.4);
    hall(...L(52.1, -28.3), 9, 6, 0.23, G + 0.4, 3.4, RGR, false, 0.4);
    hall(...L(66, 98), 10, 6, 0.65, G + 0.4, 3.4, RGR, false, 0.4);
    // the rocky crag with its pavilion and the cave
    { const C = L(52, 22), o = B.p(STONE); for (let k = 0; k < 7; k++){ const a = k/7*TAU, d = 3 + r()*2; ico(o, [C[0] + Math.cos(a)*d, G + 1.6 + r(), C[1] + Math.sin(a)*d], 3.2 + r(), 2.6); } ico(o, [C[0], G + 3.4, C[1]], 4.2, 3.4); solid.push(octPts(C[0], C[1], 8));
      kiosk(C[0], C[1], 2.4, G + 5.6, 6); }
    // potted bonsai on low stands along the courtyards
    for (let k = 0; k < 40; k++){ const x = 30 + r()*65, z = -20 + r()*120, q = L(x, z); if (!pip(W, q[0], q[1]) || solid.some(P => pip(P, q[0], q[1]))) continue; boxP(B.p(STONE), 0.8, 0.7, 0.8, q[0], G, q[1], 0); ico(B.p(LEAF), [q[0], G + 1.3, q[1]], 0.7, 0.4); } }

  // ---------- the Confucius statue ----------
  { const C = L(-64, 38.7); boxP(B.p(STONE), 4, 2.4, 4, C[0], G, C[1], 0.4); boxP(B.p(STONE), 3.2, 0.5, 3.2, C[0], G + 2.4, C[1], 0.4); solid.push(octPts(C[0], C[1], 4));
    LLathe(g, [[0, 0], [1.35, 0], [1.2, 1.8], [1.0, 3.6], [1.15, 4.6], [0.95, 5.4], [0.5, 5.75], [0.3, 6.0], [0, 6.0]], C[0], G + 2.9, C[1], BRONZE, 10);
    LSph(g, 0.62, C[0], G + 9.6, C[1], BRONZE, 1.1, 10); LCyl(g, 0.5, 0.45, 0.5, C[0], G + 10.1, C[1], BRONZE, 8);
    boxP(B.p(BRONZE), 1.4, 1.0, 0.8, C[0] + 0.3, G + 6.6, C[1] + 0.5, 0.4); }

  // ---------- other pavilions and halls of the garden ----------
  hall(...L(65.3, -156.1), 18, 11, -0.19, G + 0.6, 4.2, RG, false, 0.8);
  kiosk(...L(10, -118), 3.2, G + 0.2, 8); kiosk(...L(118, -30), 2.6, G + 0.2, 6); kiosk(...L(-95, 112), 2.8, G + 0.2, 6); kiosk(...L(150, 0), 2.6, G + 0.2, 4);

  // ---------- the island's paths (redrawn, [x, z, bridge height] per vertex), footbridges, lanterns along them ----------
  { const o = B.p(PATHC); let cnt = 0;
    for (const F of PATHS){ const Q = []; for (let i = 0; i < F.length; i += 3) Q.push([F[i] - OX, F[i+1], Math.min(F[i+2], 1.3)]);
      for (let i = 0; i < Q.length - 1; i++){ const a = Q[i], b = Q[i+1], Lp = Math.hypot(b[0]-a[0], b[1]-a[1]); if (Lp < 0.3) continue; const nx = -(b[1]-a[1])/Lp*1.4, nz = (b[0]-a[0])/Lp*1.4;
        const ya = G + 0.07 + a[2], yb = G + 0.07 + b[2], br = a[2] > 0.15 || b[2] > 0.15;
        quadP(br ? B.p(MARB) : o, [a[0] - nx, ya, a[1] - nz], [a[0] + nx, ya, a[1] + nz], [b[0] + nx, yb, b[1] + nz], [b[0] - nx, yb, b[1] - nz]);
        if (br){ for (const sg of [-1, 1]){ segP(B.p(RED), [a[0] + nx*sg, ya + 0.95, a[1] + nz*sg], [b[0] + nx*sg, yb + 0.95, b[1] + nz*sg], 0.06, 4);
            for (let t = 0; t <= Lp; t += 2.5){ const f = t/Lp, x = a[0] + (b[0]-a[0])*f + nx*sg, z = a[1] + (b[1]-a[1])*f + nz*sg, y = ya + (yb - ya)*f; segP(B.p(RED), [x, Math.min(y, WL), z], [x, y + 0.95, z], 0.06, 4); } }
          quadP(B.p(STONE), [a[0] - nx, ya - 0.35, a[1] - nz], [b[0] - nx, yb - 0.35, b[1] - nz], [b[0] - nx, yb, b[1] - nz], [a[0] - nx, ya, a[1] - nz]);
          quadP(B.p(STONE), [a[0] + nx, ya - 0.35, a[1] + nz], [b[0] + nx, yb - 0.35, b[1] + nz], [b[0] + nx, yb, b[1] + nz], [a[0] + nx, ya, a[1] + nz]); }
        if (!br && Lp > 18 && (cnt++ % 3) === 0){ const x = (a[0]+b[0])/2 + nx*1.6, z = (a[1]+b[1])/2 + nz*1.6; segP(B.p(WOOD), [x, G, z], [x, G + 2.4, z], 0.06, 4); lantern(x, G + 2.4, z); } } } }

  // ---------- trees on the island (not in the water, on paths or in buildings) ----------
  { const segs = []; for (const F of PATHS) for (let i = 0; i < F.length - 3; i += 3) segs.push([F[i] - OX, F[i+1], F[i+3] - OX, F[i+4]]);
    const nearPath = (x, z, d) => segs.some(sg => { const ax = sg[2]-sg[0], az = sg[3]-sg[1], l2 = ax*ax + az*az || 1, t = clamp01(((x-sg[0])*ax + (z-sg[1])*az)/l2), px = sg[0] + ax*t - x, pz = sg[1] + az*t - z; return px*px + pz*pz < d*d; });
    for (let k = 0; k < 900; k++){
      const x = -150 + r()*340, z = -205 + r()*340; if (!pip(ISL, x, z) || wet(x, z) || wet(x + 6, z) || wet(x - 6, z) || wet(x, z + 6) || wet(x, z - 6)) continue;
      const q = L(x, z); if (solid.some(P => pip(P, q[0], q[1])) || nearPath(q[0], q[1], 3.2) || Math.hypot(x - 159.5, z + 60.5) < 26 || (x < -110 && z > 30 && z < 75)) continue;
      treeP(B, q[0], G, q[1], 0.9 + r()*0.8, r, TRUNK, r() < 0.5 ? LEAF : LEAF2); } }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'chinesegarden', lat:LAT, lon:LON, rot:0});
}


// ======================================================================================================
// Kranji War Memorial and War Cemetery (Commonwealth War Graves Commission; the Singapore Memorial by Colin St Clair Oakes,
// unveiled 1957). On the hilltop terrace: the twelve wide stone-clad columns carrying the name panels, the flat wing-shaped
// roof on them (the air force), the central pylon rising through it to 24 m (the navy's fin) topped by a star, the curved
// panel at its foot; the end memorials (Civil Hospital Grave, Unmaintainable Graves) and the Cremation Memorial behind.
// Below, the cemetery lawns stepping down the hill in terraces with rows of white headstones and flower borders either side
// of the central avenue, the Cross of Sacrifice on the avenue, flights of steps to the terrace, the Stone of Remembrance
// near the entrance and the entrance lodge. The app terrain is flat here (4–6 m) while the real cemetery climbs a hill, so
// the terraced lawn is modelled as an earthwork rising ~9 m from the entrance to the memorial terrace.
// Placement: turned rot = 0.1177 so that local x runs along the memorial (the OSM roof outline) and local +z up the
// avenue, i.e. from the entrance (north) to the memorial (south); v = z + 70 is the distance up the avenue from the gate.
// ======================================================================================================
{
const ROT = 0.1177, RR = 140, LAT = 1.418920, LON = 103.758100;
const TER = {X0:-9671.14, Y0:11490.85, i0:258, j0:561, nx:8, ny:8, H:[41,42,44,46,49,52,55,57,41,42,44,46,49,52,55,56,41,42,44,47,50,53,56,54,41,43,45,47,50,54,56,53,41,43,45,48,51,55,55,52,42,43,46,49,52,56,55,52,42,44,46,50,54,58,54,51,42,44,47,51,55,58,55,51]};
LANDMARKS.kranji = {zh:'克兰芝战争纪念碑', en:'Kranji War Memorial', cat:'old', r:RR, h:34, lt:{m:0, c:'#f3f5ff', k:0.9, e:0.55, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB(), r = LMCTX.rng;
  const Gt = terrK(TER), X = sgX(LON), Y = sgY(LAT), TOP = Gt.top(RR, X, Y), c = Math.cos(ROT), s = Math.sin(ROT);
  const gl = (x, z) => Gt.h(X + x*c + z*s, Y + x*s - z*c) - TOP;         // map ground under local (x, z)
  const LAWN = {c:'#7fae57', m:0, lk:0}, BANK = {c:'#739f4e', m:0, lk:0}, STW = {c:'#e8e4d8', m:0, lk:1.0}, NAME = {c:'#bdb6a6', m:0, lk:0.7}, PAVE = {c:'#d2cbbb', m:0, lk:0.25};
  const HEAD = {c:'#f7f6f1', m:0, lk:0.15}, FLOW = {c:'#56763c', m:0, lk:0}, BLOOM = {c:'#9a6a55', m:0, lk:0}, ROOFC = {c:'#efece4', m:0, lk:0.9}, BRONZE = {c:'#5d4a35', m:0, lk:0.4};
  const STAR = {c:'#f2e6c0', glow:'#fff1c8', gk:1.3}, WALLG = {c:'#a9a296', m:0, lk:0.35}, LEAF = {c:'#52803f', m:0, lk:0}, TRUNK = {c:'#5b4a3a', m:0, lk:0};
  const V0 = 70, P = (u, v, y) => [u, y, v - V0];                       // avenue coordinates -> local
  // ---- the terraced hill: height above the entrance level along the avenue, falling off at the sides
  const gE = gl(0, -V0), HT = 9.2;
  const H = v => v <= 154 ? HT*sstep(4, 119, v) : HT*(1 - sstep(154, 167, v));
  const BL = 17.6, band = v => { if (v < 10 || v > 115.6) return H(v); const k = Math.floor((v - 10)/BL), f = (v - 10)/BL - k, a = H(10 + BL*k), b = H(Math.min(119, 10 + BL*(k + 1))); return a + (b - a)*sstep(0.8, 1, f); };
  const side = u => 1 - sstep(u < 0 ? 60 : 72, u < 0 ? 73 : 88, Math.abs(u));
  const surf = (u, v) => { const gg = gl(u, v - V0); return gg + Math.max(0, gE + band(v) - gg)*side(u)*sstep(-12, -4, v); };
  const T = gE + HT + 0.15;                                              // memorial terrace level
  // ---- lawn mesh
  { const U0 = -76, U1 = 92, V1 = -10, V2 = 168, st = 4, nu = Math.round((U1 - U0)/st), nv = Math.round((V2 - V1)/st);
    const Hs = []; for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++){ const u = U0 + i*st, v = V1 + j*st; Hs.push(surf(u, v)); }
    const ex = (i, j) => Hs[j*(nu+1) + i] - gl(U0 + i*st, V1 + j*st - V0);
    smoothGrid(g, nu, nv, (i, j) => P(U0 + i*st, V1 + j*st, Hs[j*(nu+1) + i]), (i, j) => Math.max(ex(i, j), ex(i+1, j), ex(i+1, j+1), ex(i, j+1)) >= 0.25, LAWN); }
  // ---- rows of headstones with their flower borders, on the terraces either side of the avenue
  { const hd = B.p(HEAD), fl = B.p(FLOW), bl = B.p(BLOOM);
    for (let k = 0; k < 6; k++){
      const va = 10 + BL*k + 2.0, vb = 10 + BL*(k + 1) - 3.4;
      for (let v = va; v <= vb; v += 2.9) for (const sg of [-1, 1]){
        const u0 = 6.5, u1 = (sg < 0 ? 58 : 68) - (k < 1 ? 10 : 0);
        for (let u = u0; u <= u1; u += 1.3){ const uu = sg*u, y = surf(uu, v); if (uu > -19 && uu < -9.5 && v > 16 && v < 26) continue;
          quadP(hd, P(uu - 0.38, v - 0.05, y - 0.2), P(uu + 0.38, v - 0.05, y - 0.2), P(uu + 0.38, v - 0.05, y + 0.85), P(uu - 0.38, v - 0.05, y + 0.85));
          quadP(hd, P(uu - 0.38, v + 0.08, y + 0.85), P(uu + 0.38, v + 0.08, y + 0.85), P(uu + 0.38, v - 0.05, y + 0.85), P(uu - 0.38, v - 0.05, y + 0.85)); }
        // the border of plants in front of each row
        const a = sg*u0, b = sg*u1, ya = surf(a, v - 0.6), yb = surf(b, v - 0.6);
        quadP(r() < 0.82 ? fl : bl, P(a, v - 1.0, ya + 0.22), P(b, v - 1.0, yb + 0.22), P(b, v - 0.15, yb + 0.22), P(a, v - 0.15, ya + 0.22));
      }
    } }
  // ---- the central avenue, the Stone of Remembrance, the Cross of Sacrifice, the flights of steps
  { const pv = B.p(PAVE);
    for (let v = -6; v < 114; v += 2){ const y0 = surf(0, v) + 0.06, y1 = surf(0, v + 2) + 0.06; quadP(pv, P(-3.5, v, y0), P(3.5, v, y0), P(3.5, v + 2, y1), P(-3.5, v + 2, y1)); }
    for (const v of [10, 27.6, 45.2, 62.8, 80.4, 98]){ for (let q = 0; q < 4; q++){ const y = surf(0, v + q*1.2); boxP(B.p(STW), 9, 0.25, 1.2, 0, y - 0.1, v + q*1.2 - V0, 0); } }
    // Stone of Remembrance (on the avenue near the gate): the great stone on three steps
    { const v = 20, y = surf(0, v); boxP(B.p(STW), 6.2, 0.35, 3.2, 0, y - 0.1, v - V0, 0); boxP(B.p(STW), 5.6, 0.35, 2.6, 0, y + 0.25, v - V0, 0); boxP(B.p(STW), 5.0, 0.35, 2.0, 0, y + 0.6, v - V0, 0);
      boxP(B.p(STW), 3.6, 1.1, 1.05, 0, y + 0.95, v - V0, 0); boxP(B.p(STW), 3.75, 0.25, 1.2, 0, y + 2.05, v - V0, 0); }
    // Cross of Sacrifice: octagonal stepped base, tapering shaft, the bronze sword on its face
    { const v = 90, y = surf(0, v), o = B.p(STW);
      for (let q = 0; q < 3; q++){ const rr = 3.0 - q*0.7, Q = []; for (let k = 0; k < 8; k++){ const a = k/8*TAU + PI/8; Q.push([Math.cos(a)*rr, v - V0 + Math.sin(a)*rr]); } prismP(o, o, Q, y - 0.2 + q*0.4, y + 0.2 + q*0.4); }
      taperP(o, 0.75, 0.75, 0.5, 0.5, 7.3, 0, y + 1.0, v - V0, 0); boxP(o, 2.6, 0.5, 0.5, 0, y + 6.1, v - V0, 0);
      boxP(B.p(BRONZE), 0.22, 3.6, 0.1, 0, y + 3.6, v - V0 - 0.3, 0); boxP(B.p(BRONZE), 1.3, 0.16, 0.1, 0, y + 6.05, v - V0 - 0.3, 0); }
    // broad flights up to the memorial terrace
    for (let q = 0; q < 14; q++){ const v = 107 + q*1.0, y = surf(0, 107) + (T - surf(0, 107))*(q + 1)/14; boxP(B.p(STW), 22, Math.max(0.2, y - surf(0, v) + 0.2), 1.0, 0, surf(0, v) - 0.2, v - V0 + 0.5, 0); }
  }
  // ---- the memorial terrace with its retaining wall
  { const Q = [[-46, 121], [46, 121], [46, 152], [-46, 152]].map(p => [p[0], p[1] - V0]); prismP(B.p(WALLG), B.p(LAWN), Q, gE - 0.5, T); edgeBands(B.p(STW), [Q[0], Q[1], [46, 121.6 - V0], [-46, 121.6 - V0]], T - 0.2, T + 0.5, 0.1);
    flatPoly(B.p(PAVE), [[-36, 125.5 - V0], [36, 125.5 - V0], [36, 140 - V0], [-36, 140 - V0]], T + 0.04); flatPoly(B.p(PAVE), [[-3.5, 121 - V0], [3.5, 121 - V0], [3.5, 126 - V0], [-3.5, 126 - V0]], T + 0.04); }
  // ---- the Singapore Memorial: twelve columns in a gentle arc, the wing roof, the pylon with the star
  { const VC = 135, arc = u => VC - 0.0035*u*u, o = B.p(STW), nm = B.p(NAME), HC = 7.8;
    for (let i = 0; i < 12; i++){
      const u = -28.6 + 5.2*i + (i >= 6 ? 0 : 0), v = arc(u) - 1.2, ry = Math.atan(0.015*u);
      boxP(o, 1.05, HC, 4.2, u, T, v - V0, ry);
      for (const sg of [-1, 1]) boxP(nm, 0.06, HC - 1.6, 3.2, u + sg*0.55*Math.cos(ry), T + 0.8, v - V0 - sg*0.55*Math.sin(ry), ry);
    }
    // the wing: a thin slab over the columns, deepest in the middle, the tips swept up
    { const rf = B.p(ROOFC), n = 30, S = [];
      for (let i = 0; i <= n; i++){ const u = -33 + 66*i/n, t = Math.abs(u)/33, vf = arc(u) - 6.6 + 1.6*t*t, vb = vf + 13.5 - 6.5*t*t, y = T + HC + 0.9*t*t*t, th = 1.1 - 0.5*t; S.push([u, vf, vb, y, th]); }
      for (let i = 0; i < n; i++){ const a = S[i], b = S[i+1];
        quadP(rf, P(a[0], a[1], a[3] + a[4]), P(b[0], b[1], b[3] + b[4]), P(b[0], b[2], b[3] + b[4]*0.6), P(a[0], a[2], a[3] + a[4]*0.6));
        quadP(rf, P(a[0], a[1], a[3]), P(a[0], a[2], a[3]), P(b[0], b[2], b[3]), P(b[0], b[1], b[3]));
        quadP(rf, P(a[0], a[1], a[3]), P(b[0], b[1], b[3]), P(b[0], b[1], b[3] + b[4]), P(a[0], a[1], a[3] + a[4]));
        quadP(rf, P(a[0], a[2], a[3]), P(a[0], a[2], a[3] + a[4]*0.6), P(b[0], b[2], b[3] + b[4]*0.6), P(b[0], b[2], b[3])); }
      for (const a of [S[0], S[n]]) quadP(rf, P(a[0], a[1], a[3]), P(a[0], a[2], a[3]), P(a[0], a[2], a[3] + a[4]*0.6), P(a[0], a[1], a[3] + a[4])); }
    // the pylon (a tall fin rising through the roof) with the star; the curved panel at its foot
    { const v = arc(0) + 0.8; taperP(o, 2.4, 7.0, 1.5, 3.2, 24 - 1.6, 0, T, v - V0, 0);
      const st = star(5, 1.35, 0.55, HP).map(p => [p[0], p[1]]), y0 = T + 24 - 1.6 + 1.5, sp = B.p(STAR);
      for (let k = 0; k < st.length; k++){ const a = st[k], b = st[(k+1) % st.length]; for (const d of [-0.25, 0.25]) triP(sp, P(0, v + d, y0), P(a[0], v + d, y0 + a[1]), P(b[0], v + d, y0 + b[1])); }
      boxP(o, 0.5, 1.0, 0.5, 0, T + 24 - 1.6, v - V0, 0);
      const cp = []; for (let k = 0; k <= 12; k++){ const a = PI + PI*k/12; cp.push([Math.cos(a)*4.6, v - 5.2 + Math.sin(a)*1.6]); }
      for (let k = 0; k < 12; k++){ const a = cp[k], b = cp[k+1]; quadP(nm, P(a[0], a[1], T), P(b[0], b[1], T), P(b[0], b[1], T + 2.3), P(a[0], a[1], T + 2.3)); quadP(o, P(a[0], a[1], T + 2.3), P(b[0], b[1], T + 2.3), P(b[0], b[1] + 0.5, T + 2.3), P(a[0], a[1] + 0.5, T + 2.3)); } }
    // the end memorials and the Cremation Memorial behind
    for (const sg of [-1, 1]){ boxP(o, 7.5, 3.2, 1.2, sg*39, T, arc(39) - V0, -sg*0.5); boxP(o, 8.0, 0.35, 1.6, sg*39, T + 3.2, arc(39) - V0, -sg*0.5); }
    boxP(o, 18, 2.6, 1.0, 0, T, 149 - V0, 0); boxP(o, 18.6, 0.3, 1.4, 0, T + 2.6, 149 - V0, 0);
  }
  // ---- the entrance lodge and shelter near the gate
  { const o = B.p(STW); boxP(o, 13, 3.4, 4.6, -10, surf(-10, 0) - 0.3, 0.3 - V0, 0); boxP(B.p(ROOFC), 15, 0.4, 6.2, -10, surf(-10, 0) + 3.1, 0.3 - V0, 0);
    boxP(o, 6, 3.0, 5.6, -14.3, surf(-14.3, 21) - 0.3, 21 - V0, 0); boxP(B.p(ROOFC), 7, 0.35, 6.6, -14.3, surf(-14.3, 21) + 2.7, 21 - V0, 0); }
  // ---- trees along the edges of the cemetery
  for (let k = 0; k < 120; k++){ const u = -68 + r()*150, v = -10 + r()*170, au = Math.abs(u);
    if (au < 62 && v > 2 && v < 154) continue; const y = surf(u, v); treeP(B, u, y, v - V0, 1.2 + r()*0.8, r, TRUNK, LEAF); }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'kranji', lat:LAT, lon:LON, rot:ROT});
}


// ======================================================================================================
// Our Tampines Hub (DP Architects, 2017), Tampines: the community, civic and sports hub built round its "Town Square" — a
// 5,000-seat football stadium. On the real OSM footprint: the seven-storey block on the north (mall, hawker centre, gym,
// sports halls; the large rooftop swimming complex), the wings wrapping the pitch — the main stand on the west under the
// building's upper floors and the cantilevered canopy, the regional library on the east looking over the pitch, the
// festive arts theatre on the south — with the glazed running-track gallery on level 5 circling the stadium; earth-toned
// facades of vertical fins (Tampines' sand-quarry past), green walls and roof gardens (the community farm).
// Placement: rot 0 at 1.35315 N, 103.94051 E (plans: OSM rings and the OSM pitch, in metres from that point).
// The neighbouring Arena @ OTH (the retrofitted old sports hall, its own OSM building) is left to the map.
// ======================================================================================================
{
const RR = 160, LAT = 1.35315, LON = 103.94051;
const TER = {X0:10629.36, Y0:4218.40, i0:548, j0:457, nx:8, ny:8, H:[57,58,58,59,59,59,58,57,59,60,61,62,63,64,62,61,62,64,65,67,67,67,66,65,62,63,64,65,65,65,64,63,60,61,62,62,62,62,61,59,58,58,59,59,58,58,57,56,55,55,55,55,55,54,53,52,53,52,52,52,51,50,50,49]};
const toP = F => { const P = []; for (let i = 0; i < F.length; i += 2) P.push([F[i], F[i+1]]); return P; };
const NB = toP([-110.1,-42.2,-107.1,-45.7,-99.9,-46.3,-102.3,-66.5,-108.9,-67.1,-110.1,-97.9,-105.9,-101.5,89.9,-100.9,91.1,-51.7,86.9,-51.7,86.0,-13.5,54.7,-13.4,-26.2,-13.3,-44.4,-10.7,-46.2,-11.9,-50.4,13.0,-109.5,14.2,-111.3,12.4]);
const WW = toP([-44.4,-10.7,-26.2,-13.3,-25.9,106.1,-39.1,106.0,-45.0,101.3,-48.6,75.8,-62.3,42.0,-48.0,12.4]);
const SW = toP([-41.4,126.2,-41.4,113.8,-37.3,113.2,-39.1,106.0,-25.9,106.1,55.0,105.8,82.7,106.7,67.8,120.9,30.8,123.9,29.6,128.0]);
const EW = toP([54.7,-13.4,86.0,-13.5,82.7,106.7,55.0,105.8]);
const PITCH = toP([-26.2,-13.1,54.7,-13.4,55.0,105.8,-25.9,106.1]);
LANDMARKS.tampineshub = {zh:'我们的淡滨尼中心', en:'Our Tampines Hub', cat:'new', r:RR, h:34, lt:{m:1, c:'#ffe7c4', k:0.55, fh:4.6, cw:3.0}, build(){
  const g = new THREE.Group(), B = mkB(), r = LMCTX.rng;
  const Gt = terrK(TER), TOP = Gt.top(RR, sgX(LON), sgY(LAT)), G0 = Gt.h(sgX(LON) + 14, sgY(LAT) - 46) - TOP;
  const GLASS = {c:'#6f8790', m:1, fh:4.6, cw:3.0}, FIN = {c:'#b0805a', m:0, lc:'#ffd7a8', lk:0.45}, SLAB = {c:'#e7e2d7', m:0, lk:0.35};
  const ROOF = {c:'#c6c8c3', m:0, lk:0.05}, GREEN = {c:'#6f9d4c', m:0, lk:0}, LEAF = {c:'#557f42', m:0, lk:0}, TURF = {c:'#5d9a45', m:0, lk:0.05}, LINE = {c:'#f1f3ee', m:0, lk:0.1};
  const SEAT = {c:'#8d3b33', m:0, lk:0.25}, CAN = {c:'#eef0ed', m:0, lc:'#ffffff', lk:0.6}, TRACK = {c:'#88a6ad', glow:'#ffe6be', gk:0.6}, POOL = {c:'#5cc0d6', glow:'#3aa4d2', gk:0.35}, PV = {c:'#3e4c5c', m:0, lk:0}, DECK = {c:'#cbbfa6', m:0, lk:0.05}, LAMP = {c:'#f4f1e6', glow:'#ffffff', gk:1.6};
  // a wing: glazed walls between floor slabs, vertical earth-toned fins outside, roof; inner faces towards the pitch skipped if asked
  const wing = (P, y0, y1, skip, finSp) => {
    wallP(B.p(GLASS), P, y0, y1); flatPoly(B.p(ROOF), P, y1);
    for (let y = y0 + 6; y < y1 - 1; y += 4.6) edgeBands(B.p(SLAB), P, y, y + 0.6, 0.25, skip);
    edgeBands(B.p(SLAB), P, y1 - 1.6, y1 + 0.8, 0.3, skip);
    edgeFins(B.p(FIN), P, y0 + 6, y1 - 1.6, finSp || 1.6, 0.28, 0.9, skip);
  };
  const toPitch = (mx, mz, nx, nz) => pip(PITCH, mx + nx*4, mz + nz*4);
  // ---- the north block (seven storeys) with the rooftop swimming complex
  wing(NB, G0 - 1, G0 + 32, null, 1.5);
  { // ground floor: shopfronts and the open hawker frontage
    edgeBands(B.p(TRACK), NB, G0 + 0.3, G0 + 5.2, 0.15);
    // rooftop: pool deck, the 50 m pool and leisure pools, a green roof strip, shade pergolas
    const y = G0 + 32;
    flatPoly(B.p(DECK), [[-20, -95], [84, -95], [84, -55], [-20, -55]], y + 0.15);
    boxP(B.p(POOL), 50, 0.2, 21, 30, y + 0.2, -76, 0); boxP(B.p(POOL), 22, 0.2, 14, 70, y + 0.2, -68, 0); boxP(B.p(POOL), 14, 0.2, 12, -6, y + 0.2, -64, 0);
    flatPoly(B.p(GREEN), [[-105, -90], [-30, -90], [-30, -50], [-105, -50]], y + 0.2);
    for (let x = -100; x < -35; x += 9) for (let z = -86; z < -54; z += 8) boxP(B.p(LEAF), 6, 0.6, 4, x + 3, y + 0.2, z + 2, 0);
    for (let x = -18; x < 82; x += 6) segP(B.p(SLAB), [x, y + 3.2, -52], [x, y + 3.2, -98], 0.12, 4);
    for (const x of [-18, 82]) for (let z = -98; z <= -52; z += 6) segP(B.p(SLAB), [x, y, z], [x, y + 3.2, z], 0.12, 4);
  }
  // ---- the wings round the stadium: west (main stand under the upper floors), east (library), south (theatre)
  wing(WW, G0 + 13, G0 + 27, toPitch, 1.6); edgeBands(B.p(GLASS), WW, G0 - 1, G0 + 13, 0, toPitch); flatPoly(B.p(SLAB), WW, G0 + 13);
  wing(EW, G0 - 1, G0 + 28, null, 1.8);
  wing(SW, G0 - 1, G0 + 22, null, 1.6);
  // green walls on parts of the outer facades
  { const gw = B.p(GREEN); for (const [a, b] of [[[-62.3, 42.0], [-48.6, 75.8]], [[67.8, 120.9], [30.8, 123.9]], [[-110.1, -97.9], [-110.1, -60]]]){ const dx = b[0]-a[0], dz = b[1]-a[1], L = Math.hypot(dx, dz), nx = -dz/L, nz = dx/L;
      const o = pip(NB.concat(), a[0] + nx*2, a[1] + nz*2) || pip(WW, a[0] + nx*2, a[1] + nz*2) || pip(SW, a[0] + nx*2, a[1] + nz*2) ? -1.2 : 1.2;
      quadP(gw, [a[0] + nx*o, G0 + 6, a[1] + nz*o], [b[0] + nx*o, G0 + 6, b[1] + nz*o], [b[0] + nx*o, G0 + 20, b[1] + nz*o], [a[0] + nx*o, G0 + 20, a[1] + nz*o]); } }
  // ---- the pitch (Town Square): turf, markings, the west main stand and the east terrace, floodlights
  { flatPoly(B.p(TURF), PITCH, G0 + 0.08);
    const cx = 14.4, cz = 46.4, hw = 34, hl = 52.5, ln = B.p(LINE), w = 0.12, y = G0 + 0.12;
    const seg = (x0, z0, x1, z1) => { const L = Math.hypot(x1-x0, z1-z0), nx = -(z1-z0)/L*w, nz = (x1-x0)/L*w; quadP(ln, [x0 - nx, y, z0 - nz], [x0 + nx, y, z0 + nz], [x1 + nx, y, z1 + nz], [x1 - nx, y, z1 - nz]); };
    seg(cx - hw, cz - hl, cx + hw, cz - hl); seg(cx + hw, cz - hl, cx + hw, cz + hl); seg(cx + hw, cz + hl, cx - hw, cz + hl); seg(cx - hw, cz + hl, cx - hw, cz - hl); seg(cx - hw, cz, cx + hw, cz);
    { const n = 24; for (let k = 0; k < n; k++){ const a0 = k/n*TAU, a1 = (k+1)/n*TAU; seg(cx + Math.cos(a0)*9.15, cz + Math.sin(a0)*9.15, cx + Math.cos(a1)*9.15, cz + Math.sin(a1)*9.15); } }
    for (const sg of [-1, 1]){ const zz = cz + sg*hl; seg(cx - 20.16, zz, cx - 20.16, zz - sg*16.5); seg(cx + 20.16, zz, cx + 20.16, zz - sg*16.5); seg(cx - 20.16, zz - sg*16.5, cx + 20.16, zz - sg*16.5);
      boxP(B.p(LINE), 7.3, 2.4, 0.15, cx, G0, zz + sg*0.4, 0); }
    // west main stand: 22 rows rising under the west wing (front at the pitch edge)
    const st = B.p(SEAT), sl = B.p(SLAB);
    for (let k = 0; k < 22; k++){ const x0 = -26.4 - k*0.82, y0 = G0 + 0.6 + k*0.48;
      quadP(k % 2 ? st : sl, [x0, y0, -8], [x0, y0, 101], [x0 - 0.82, y0, 101], [x0 - 0.82, y0, -8]); quadP(sl, [x0, y0 - 0.48, -8], [x0, y0 - 0.48, 101], [x0, y0, 101], [x0, y0, -8]); }
    // east terrace below the library
    for (let k = 0; k < 10; k++){ const x0 = 55.2 + k*0.85, y0 = G0 + 0.6 + k*0.45; quadP(k % 2 ? st : sl, [x0, y0, -8], [x0, y0, 101], [x0 + 0.85, y0, 101], [x0 + 0.85, y0, -8]); quadP(sl, [x0, y0 - 0.45, -8], [x0, y0 - 0.45, 101], [x0, y0, 101], [x0, y0, -8]); }
    // the cantilevered canopy over the main stand and the glazed level-5 running-track gallery round the stadium
    { const cn = B.p(CAN), yC = G0 + 24.5; quadP(cn, [-26, yC, -12], [-26, yC, 105], [-12, yC - 1.4, 105], [-12, yC - 1.4, -12]); quadP(cn, [-26, yC + 0.6, -12], [-26, yC + 0.6, 105], [-12, yC - 0.9, 105], [-12, yC - 0.9, -12]);
      for (let z = -12; z <= 105; z += 6.5) segP(B.p(SLAB), [-27, yC + 2.8, z], [-12, yC - 0.9, z], 0.18, 4); }
    { const tr = B.p(TRACK), y0 = G0 + 20.5, y1 = G0 + 25.2, R = offRing(PITCH, -2.2), O = PITCH; for (let i = 0; i < 4; i++){ const a = R[i], b = R[(i+1) % 4], c = O[(i+1) % 4], d = O[i]; quadP(tr, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]);
        quadP(B.p(SLAB), [a[0], y1, a[1]], [b[0], y1, b[1]], [c[0], y1, c[1]], [d[0], y1, d[1]]); quadP(B.p(SLAB), [a[0], y0, a[1]], [b[0], y0, b[1]], [c[0], y0, c[1]], [d[0], y0, d[1]]);
        quadP(B.p(SLAB), [a[0], y1, a[1]], [b[0], y1, b[1]], [b[0], y1 + 0.9, b[1]], [a[0], y1 + 0.9, a[1]]); } }
    // floodlight bars on the canopy edge and the roofs at the corners
    for (const [x, z] of [[-13, 0], [-13, 46], [-13, 92], [56, -12], [56, 104]]){ boxP(B.p(LAMP), 1.2, 0.5, 6, x, G0 + 25.5, z, 0); }
  }
  // ---- roof gardens on the wings (the community farm) and trees round the plazas
  { const gr = B.p(GREEN); flatPoly(gr, offRing(WW, -2), G0 + 27.2); flatPoly(gr, offRing(SW, -2), G0 + 22.2);
    for (let k = 0; k < 40; k++){ const p = [-40 + r()*25, -5 + r()*105]; if (pip(WW, p[0], p[1])) ico(B.p(LEAF), [p[0], G0 + 28, p[1]], 1.3, 1.0); }
    // solar arrays and plant rooms on the big roofs
    for (let x = -100; x < -25; x += 4.5) boxP(B.p(PV), 3.2, 0.5, 30, x, G0 + 32, -30, 0);
    for (let z = -5; z < 100; z += 4.5) boxP(B.p(PV), 22, 0.5, 3.2, 70.5, G0 + 28, z, 0);
    for (const [x, z, w, d] of [[-60, -95, 14, 8], [10, -40, 18, 10], [70, 112, 10, 6]]) boxP(B.p(SLAB), w, 3.2, d, x, G0 + (z > 100 ? 22 : 32), z, 0); }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'tampineshub', lat:LAT, lon:LON, rot:0});
}

}
