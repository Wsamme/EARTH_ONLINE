// ===== City Brush lm40, group sg40e — Sentosa, HarbourFront and the Southern Ridges.
// Keys: sghftowers (HarbourFront Towers One & Two with the cable car station), sgkeppelbaytower, sgfaberpeak, sgsentosastn,
// sgskyhelix, sgoceanarium, sgcapella, sgpalawanbr, sgmbc, sgkeppelbaybr, sgalexarch, sgbukitchandu.
// Every plan is the real OSM footprint (ref_sg40e.json, local metres round the SG_PLACES point: +x east, +z south, rot 0).
// Hill / sloping sites carry the app terrain (the 70 m height nodes round the site, decimetres) so that foundations and
// floors sit on the map ground exactly; the model base is recomputed with the app's own rule (max ground in r + 0.6).
// Block-scoped: only LANDMARKS and SG_PLACES are touched. y = 0 is the model base. No text, logos or brand colours.
{
const PI = Math.PI, HP = PI/2, TAU = PI*2;
const lerp = (a, b, t) => a + (b - a)*t;
const clamp01 = t => t < 0 ? 0 : t > 1 ? 1 : t;
const vlen = a => Math.hypot(a[0], a[1], a[2]), nrm = a => { const l = vlen(a) || 1; return [a[0]/l, a[1]/l, a[2]/l]; };
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const mix = (a, b, t) => [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];
// triangle batches keyed by colour spec: one LTris call per material
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const quadP = (o, a, b, c, d) => { o.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2]); };
const triP = (o, a, b, c) => { o.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); };
// n-sided prism round the segment a-b
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
// box (w along x, d along z) standing on y, turned ry (about +y, three.js sense)
const boxP = function(o, w, h, d, x, y, z, ry){
  const c = Math.cos(ry || 0), s = Math.sin(ry || 0), hw = w/2, hd = d/2, y1 = y + h;
  const ax = x - hw*c - hd*s, az = z + hw*s - hd*c, bx = x + hw*c - hd*s, bz = z - hw*s - hd*c, cx = x + hw*c + hd*s, cz = z - hw*s + hd*c, dx = x - hw*c + hd*s, dz = z + hw*s + hd*c;
  o.push(ax, y1, az, dx, y1, dz, cx, y1, cz, ax, y1, az, cx, y1, cz, bx, y1, bz,
    ax, y, az, ax, y1, az, bx, y1, bz, ax, y, az, bx, y1, bz, bx, y, bz,
    bx, y, bz, bx, y1, bz, cx, y1, cz, bx, y, bz, cx, y1, cz, cx, y, cz,
    cx, y, cz, cx, y1, cz, dx, y1, dz, cx, y, cz, dx, y1, dz, dx, y, dz,
    dx, y, dz, dx, y1, dz, ax, y1, az, dx, y, dz, ax, y1, az, ax, y, az);
};
// box between two plan points a-b (width w across, height h from y)
const barP = (o, a, b, w, h, y) => { const L = Math.hypot(b[0]-a[0], b[1]-a[1]); if (L < 1e-3) return; boxP(o, L, h, w, (a[0]+b[0])/2, y, (a[1]+b[1])/2, Math.atan2(-(b[1]-a[1]), b[0]-a[0])); };
// smooth grid mesh: P(i, j) -> [x, y, z]
const smoothGrid = function(g, nu, nv, P, keep, col){
  const id = new Int32Array((nu+1)*(nv+1)).fill(-1), pos = [], I = [];
  const vtx = (i, j) => { const k = j*(nu+1) + i; if (id[k] < 0){ id[k] = pos.length/3; pos.push(...P(i, j)); } return id[k]; };
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++){ if (keep && !keep(i, j)) continue; const a = vtx(i, j), b = vtx(i+1, j), c = vtx(i+1, j+1), d = vtx(i, j+1); I.push(a, d, c, a, c, b); }
  if (!I.length) return;
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(I); geo.computeVertexNormals();
  return lmAdd(g, geo, typeof col === 'string' ? {c:col, ds:true} : Object.assign({ds:true}, col), 0, 0, 0);
};
const ICO = (() => { const P = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]], F = [[0,2,4],[4,2,1],[1,2,5],[5,2,0],[4,3,0],[1,3,4],[5,3,1],[0,3,5]], out = [];
  for (const [a, b, d] of F){ const A = P[a], Bv = P[b], D = P[d], ab = nrm(mix(A, Bv, 0.5)), bd = nrm(mix(Bv, D, 0.5)), da = nrm(mix(D, A, 0.5));
    for (const t of [[A, ab, da], [ab, Bv, bd], [da, bd, D], [ab, bd, da]]) for (const v of t) out.push(v[0], v[1], v[2]); } return out; })();
const ico = function(o, c, rx, ry){ for (let i = 0; i < ICO.length; i += 3) o.push(c[0] + ICO[i]*rx, c[1] + ICO[i+1]*ry, c[2] + ICO[i+2]*rx); };
const treeP = function(B, x, y, z, s, r, trunkC, leafC){ segP(B.p(trunkC), [x, y - 0.5, z], [x, y + 2.6*s, z], 0.22*s, 4); const k = 2.1*s*(0.85 + 0.3*r()); ico(B.p(leafC), [x, y + 3.6*s, z], k, k*0.8); };
// ---- plan helpers (local [x, z])
const pip = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0]-a[0])*(z-a[1])/(b[1]-a[1]) + a[0]) c = !c; } return c; };
const cen = P => { let x = 0, z = 0; for (const p of P){ x += p[0]; z += p[1]; } return [x/P.length, z/P.length]; };
const chaikinOpen = (P, k) => { for (let it = 0; it < k; it++){ const Q = [P[0]]; for (let i = 0; i < P.length - 1; i++){ const a = P[i], b = P[i+1]; Q.push([a[0]*0.75 + b[0]*0.25, a[1]*0.75 + b[1]*0.25], [a[0]*0.25 + b[0]*0.75, a[1]*0.25 + b[1]*0.75]); } Q.push(P[P.length-1]); P = Q; } return P; };
const edgeN = function(P, i){ const a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], L = Math.hypot(ex, ez) || 1; let nx = ez/L, nz = -ex/L; const mx = (a[0]+b[0])/2, mz = (a[1]+b[1])/2; if (pip(P, mx + nx*0.25, mz + nz*0.25)){ nx = -nx; nz = -nz; } return [nx, nz, L, mx, mz]; };
const edgeBands = function(o, P, y0, y1, off, skip){
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], [nx, nz, L, mx, mz] = edgeN(P, i); if (L < 0.6 || (skip && skip(mx, mz, nx, nz))) continue;
    quadP(o, [a[0]+nx*off, y0, a[1]+nz*off], [b[0]+nx*off, y0, b[1]+nz*off], [b[0]+nx*off, y1, b[1]+nz*off], [a[0]+nx*off, y1, a[1]+nz*off]); }
};
const edgeFins = function(o, P, y0, y1, sp, w, d, skip){
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], [nx, nz, L, mx, mz] = edgeN(P, i); if (L < 2 || (skip && skip(mx, mz, nx, nz))) continue;
    const n = Math.max(1, Math.round(L/sp)), ry = Math.atan2(-(b[1]-a[1]), b[0]-a[0]);
    for (let k = 0; k <= n; k++){ const t = k/n; boxP(o, w, y1 - y0, d, a[0] + (b[0]-a[0])*t + nx*d/2, y0, a[1] + (b[1]-a[1])*t + nz*d/2, ry); } }
};
const flatPoly = function(o, P, y){
  const tri = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
  for (const [a, b, c] of tri) triP(o, [P[a][0], y, P[a][1]], [P[b][0], y, P[b][1]], [P[c][0], y, P[c][1]]);
};
const offRing = function(P, d){
  const n = P.length; let A2 = 0; for (let i = 0; i < n; i++){ const a = P[i], b = P[(i+1) % n]; A2 += a[0]*b[1] - b[0]*a[1]; }
  const sg = A2 > 0 ? 1 : -1, out = [];
  for (let i = 0; i < n; i++){
    const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i+1) % n];
    let ax = p1[0]-p0[0], az = p1[1]-p0[1], bx = p2[0]-p1[0], bz = p2[1]-p1[1]; const la = Math.hypot(ax, az) || 1, lb = Math.hypot(bx, bz) || 1; ax /= la; az /= la; bx /= lb; bz /= lb;
    const n1 = [sg*az, -sg*ax], n2 = [sg*bz, -sg*bx]; let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
    const k = d/Math.max(0.5, mx*n1[0] + mz*n1[1]); out.push([p1[0] + mx*k, p1[1] + mz*k]);
  }
  return out;
};
const wallP = function(o, P, y0, y1){ for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; quadP(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); } };
const prismP = function(ow, ot, P, y0, y1){ wallP(ow, P, y0, y1); flatPoly(ot, P, y1); };
// rectangle (centre c, half sizes hu along unit axis ax, hv across) -> plan ring
const rectR = (c, ax, hu, hv) => { const nx = -ax[1], nz = ax[0]; return [[c[0] - ax[0]*hu - nx*hv, c[1] - ax[1]*hu - nz*hv], [c[0] + ax[0]*hu - nx*hv, c[1] + ax[1]*hu - nz*hv], [c[0] + ax[0]*hu + nx*hv, c[1] + ax[1]*hu + nz*hv], [c[0] - ax[0]*hu + nx*hv, c[1] - ax[1]*hu + nz*hv]]; };
// hipped roof over a rectangle (centre c, axis ax, half sizes hu, hv), eave y0, ridge y1 (ridge length 2(hu - hv)) into batch o
const hipP = function(o, c, ax, hu, hv, y0, y1, ov){
  ov = ov || 0; hu += ov; hv += ov;
  const R = rectR(c, ax, hu, hv), r = Math.max(0, hu - hv), A = [c[0] - ax[0]*r, y1, c[1] - ax[1]*r], Bp = [c[0] + ax[0]*r, y1, c[1] + ax[1]*r];
  const E = R.map(p => [p[0], y0, p[1]]);
  quadP(o, E[0], E[1], Bp, A); quadP(o, E[2], E[3], A, Bp); triP(o, E[1], E[2], Bp); triP(o, E[3], E[0], A);
  quadP(o, E[0], E[3], E[2], E[1]);
};
// [E, N] metres of the app projection
const sgX = lon => (lon - 103.845)*111290.5, sgY = lat => (lat - 1.315)*110574;
// app terrain baked round a site: h(x, y) = the app's hC, top(r, X, Y) = the app's model base
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
// local ground function of a key: gl(x, z) = map ground - model base
const groundK = (TER, LAT, LON, RR) => { const G = terrK(TER), X = sgX(LON), Y = sgY(LAT), TOP = G.top(RR, X, Y); return {gl:(x, z) => G.h(X + x, Y - z) - TOP, TOP}; };
const minG = (gl, P) => { let m = 1e9; for (const p of P) m = Math.min(m, gl(p[0], p[1])); const c = cen(P); return Math.min(m, gl(c[0], c[1])); };
// glass office block: walls (lit windows), spandrel bands per floor, mullions, roof slab, parapet, foundation to yb
const glassBlock = function(B, P, yb, y0, y1, o){
  const fh = o.fh || 3.6;
  wallP(B.p(o.gl), P, y0, y1); flatPoly(B.p(o.rf), P, y1);
  if (yb < y0) wallP(B.p(o.base || o.fr), P, yb, y0 + 0.01);
  const bh = o.bh || 0.32;
  for (let y = y0 + (o.y1st || fh); y < y1 - 0.6; y += fh) edgeBands(B.p(o.sp || o.fr), P, y - bh, y + bh, 0.1, o.skip);
  if (o.mull) edgeFins(B.p(o.fr), P, y0 + (o.mb || 0), y1, o.mull, o.mw || 0.1, o.md || 0.22, o.skip);
  edgeBands(B.p(o.fr), P, y1 - 0.25, y1 + (o.par === undefined ? 1.1 : o.par), 0.04);
};
// ---- cable car (Doppelmayr monocable gondola, 8-seat cabins with metallic-black bodies and chrome trim): rope pair and cabins
// a = [x, y, z] at the station mouth, d = unit plan direction to the next tower, len m, slope dy/dx (rises +), gap = rope spacing
const cableStub = function(B, a, d, len, slope, gap, cols, cabinsAt){
  const n = [-d[1], d[0]], rope = B.p(cols.rope);
  for (const sgn of [-1, 1]){
    const p0 = [a[0] + n[0]*gap/2*sgn, a[1], a[2] + n[1]*gap/2*sgn], p1 = [p0[0] + d[0]*len, a[1] + slope*len, p0[2] + d[1]*len];
    segP(rope, p0, p1, 0.07, 3);
  }
  for (const [t, sgn] of cabinsAt || []){
    const s = t*len, p = [a[0] + d[0]*s + n[0]*gap/2*sgn, a[1] + slope*s, a[2] + d[1]*s + n[1]*gap/2*sgn];
    cabin(B, p, d, cols);
  }
};
// one cabin hanging from the rope point p (grip, hanger arm, body ~2.0 x 2.3 x 2.1 m with a window band)
const cabin = function(B, p, d, cols){
  const ry = Math.atan2(-d[1], d[0]), hb = p[1] - 4.6;
  segP(B.p(cols.hang), p, [p[0], p[1] - 2.3, p[2]], 0.07, 4);
  boxP(B.p(cols.body), 2.0, 2.2, 2.3, p[0], hb, p[2], ry);
  boxP(B.p(cols.win), 2.04, 0.85, 2.34, p[0], hb + 1.05, p[2], ry);
  boxP(B.p(cols.hang), 1.4, 0.18, 1.6, p[0], hb + 2.2, p[2], ry);
};
// station positions of the Mount Faber Line (world E, N of the station centres) -> straight alignment (remontees-mecaniques.net:
// "the alignment is straight, 1,727 m"); used only to aim the short rope stubs at the stations' mouths
const STN = {faber:[sgX(103.819462) - 6, sgY(1.271214) - 2], hf:[sgX(103.81895) - 28, sgY(1.2646) - 13], sentosa:[sgX(103.817702) + 0, sgY(1.255436) + 9]};
const dirTo = (a, b) => { const dx = b[0] - a[0], dz = -(b[1] - a[1]), L = Math.hypot(dx, dz); return [dx/L, dz/L]; };


// ======================================================================================================
// HarbourFront Tower One (18 storeys, mapletreelogisticstrust.com) and HarbourFront Tower Two (16 storeys, the refurbished
// former Singapore cable car tower that still houses the HarbourFront station of the Mount Faber Line; wikipedia: track 69 m
// above sea level). Plans and heights = the OSM building parts of w47418847 (Tower One: slab 60 m, west strip 53.4 m, podiums
// 13.8 / 17.1 m) and w469423301 (Tower Two: side strips 53.4 m, central shaft 59 m). The glazed towers (architizer: "glazed
// facades used extensively") carry floor bands and mullions; Tower Two keeps the four round corner shafts of the old tower
// (the rounded corners of its footprint) and the glazed station box on top, with the rope pairs leaving north (Mount Faber)
// and south (Sentosa) along the straight line, two cabins on each side. Night: lit office windows, the lit station, red beacons.
// ======================================================================================================
{
const LAT = 1.2646, LON = 103.81895, RR = 112;
const TER = {X0:-2899.12, Y0:-5572.93, i0:356, j0:318, nx:6, ny:6, H:[-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,45,10,-3,-3,50,51,52,10,-3,-3,11,64,65,63,-3,-3,11,88,89,85]};
const T2W = [[-41.8,25.3],[-44.2,25.3],[-43.0,14.6],[-40.6,15.2],[-37.0,-14.4],[-36.4,-15.6],[-34.6,-16.2],[-33.4,-15.6],[-32.8,-13.8],[-38.2,37.8],[-40.6,39.5],[-42.4,38.9],[-43.0,37.2]];
const T2E = [[-17.9,33.6],[-19.1,40.1],[-20.3,41.3],[-22.1,41.3],[-23.3,38.9],[-17.9,-12.1],[-17.3,-13.8],[-15.5,-14.4],[-13.7,-12.7],[-13.7,-5.5],[-10.7,-5.5],[-12.5,9.9],[-13.7,9.3],[-14.9,21.2],[-13.1,21.2],[-14.3,34.2]];
const T2M = [[-32.8,-13.8],[-17.9,-12.1],[-23.3,38.9],[-38.2,37.8]];
const T1A = [[-0.6,10.5],[7.2,-67.2],[28.7,-64.8],[20.9,12.3],[14.9,12.3],[14.9,15.8],[4.2,14.6],[4.2,11.1]];
const T1B = [[28.1,7.5],[21.5,6.9],[28.1,-60.1],[34.6,-59.5]];
const T1C = [[0.0,5.1],[-7.2,4.5],[0.0,-62.5],[6.6,-61.9]];
const T1P1 = [[31.1,-20.4],[39.4,-19.8],[35.8,11.7],[57.9,14.0],[56.1,29.5],[-8.9,22.9],[-7.2,4.5],[0.0,5.1],[-0.6,10.5],[4.2,11.1],[4.2,14.6],[14.9,15.8],[14.9,12.3],[20.9,12.3],[21.5,6.9],[28.1,7.5]];
const T1P2 = [[41.8,-49.4],[51.3,-48.8],[50.8,-42.3],[63.3,-41.1],[57.9,14.0],[35.8,11.7],[39.4,-19.8],[31.1,-20.4],[31.6,-28.7],[39.4,-28.1]];
const T1N = [[42.4,-54.8],[64.5,-52.4],[63.3,-41.1],[50.8,-42.3],[51.3,-48.8],[41.8,-49.4]];   // north-east strip of the ring not in any part (podium height assumed)
LANDMARKS.sghftowers = {zh:'港湾大厦（缆车港湾站）', en:'HarbourFront Tower One & Two (Cable Car HarbourFront Station)', cat:'new', r:RR, h:68, lt:{m:1, c:'#e6efff', k:0.6}, build(){
  const g = new THREE.Group(), B = mkB(), {gl} = groundK(TER, LAT, LON, RR);
  const GL = {c:'#7f9cac', m:1, fh:3.3, cw:3.0, lc:'#e6efff', lk:0.55}, FR = {c:'#d3d8da', m:0, lk:0.15}, CORE = {c:'#e7e4dc', m:0, lc:'#fff3df', lk:0.4};
  const RF = '#8c8f93', BASE = {c:'#9b998f', m:0, lk:0}, STG = {c:'#a6c2cf', glow:'#d6ecff', gk:0.55, ds:true}, BEAC = {c:'#c22', glow:'#ff2a1a', gk:2};
  const CC = {rope:'#3b3d41', body:{c:'#26282c', m:0, lk:0}, win:{c:'#9aa7b0', glow:'#ffe2b0', gk:0.35}, hang:{c:'#b9bdc1', m:0, lk:0.2}};
  // ---- Tower Two: the old cable car tower, refurbished
  const g2 = minG(gl, [...T2W, ...T2E]), y2 = gl(-28, 13);
  glassBlock(B, T2W, g2 - 1.2, y2, y2 + 53.4, {gl:GL, fr:FR, rf:RF, base:BASE, fh:3.3, y1st:4.6, mull:1.6});
  glassBlock(B, T2E, g2 - 1.2, y2, y2 + 53.4, {gl:GL, fr:FR, rf:RF, base:BASE, fh:3.3, y1st:4.6, mull:1.6});
  // central shaft: solid lift / stair core faced in white panels with narrow glazed slots, up to the station floor at 59 m
  { const w = B.p(CORE); wallP(w, T2M, g2 - 1.2, y2 + 59); flatPoly(B.p(RF), T2M, y2 + 59);
    edgeFins(B.p(GL), T2M, y2 + 4, y2 + 58, 4.2, 0.9, 0.08); }
  // the four round corner shafts of the old tower
  for (const [x, z] of [[-34.9,-14.6],[-15.6,-12.7],[-21.0,39.9],[-40.9,38.3]]){ const c = B.p(CORE);
    const n = 12, r = 2.0; for (let i = 0; i < n; i++){ const a0 = i/n*TAU, a1 = (i+1)/n*TAU; quadP(c, [x + Math.cos(a0)*r, g2 - 1.2, z + Math.sin(a0)*r], [x + Math.cos(a1)*r, g2 - 1.2, z + Math.sin(a1)*r], [x + Math.cos(a1)*r, y2 + 59.6, z + Math.sin(a1)*r], [x + Math.cos(a0)*r, y2 + 59.6, z + Math.sin(a0)*r]); } }
  // station box on the roof: a glazed hall over the shaft, open at both ends where the ropes enter; roof slab and plant
  const ax = [(-23.3 + -38.2)/2 - (-32.8 + -17.9)/2, 38.35 - (-12.95)], L = Math.hypot(ax[0], ax[1]), d = [ax[0]/L, ax[1]/L];
  const sc = [(-32.8 - 17.9 - 23.3 - 38.2)/4, (-13.8 - 12.1 + 38.9 + 37.8)/4];
  const SB = rectR(sc, d, 27.5, 10.2), y5 = y2 + 59.6, y6 = y2 + 68;
  { const st = B.p(STG), fr = B.p(FR);
    for (let i = 0; i < 4; i++){ const a = SB[i], b = SB[(i+1) % 4]; if (i % 2 === 1) continue;     // long sides glazed; ends open
      quadP(st, [a[0], y5, a[1]], [b[0], y5, b[1]], [b[0], y6 - 1.2, b[1]], [a[0], y6 - 1.2, a[1]]); }
    flatPoly(B.p(RF), SB, y5); flatPoly(B.p(FR), SB, y6);
    edgeBands(fr, SB, y6 - 1.2, y6, 0.05); edgeBands(fr, SB, y5, y5 + 1.0, 0.06);
    edgeFins(fr, SB, y5, y6, 3.0, 0.22, 0.3);
    // gable frames over the two open ends
    for (const s of [-1, 1]){ const a = SB[s < 0 ? 0 : 2], b = SB[s < 0 ? 3 : 1]; barP(fr, a, b, 0.5, 1.4, y6 - 1.4); }
    // plant box and the bull-wheel housing (the line's drive is at Mount Faber; HarbourFront is an intermediate station)
    boxP(B.p(CORE), 10, 2.6, 18, sc[0], y6, sc[1], Math.atan2(-d[1], d[0]) + HP);
    for (const s of [-1, 1]) boxP(B.p(BEAC), 0.4, 0.5, 0.4, sc[0] + d[0]*s*24, y6 + 0.2, sc[1] + d[1]*s*24, 0); }
  // rope pairs: north to Seah Im Road tower (80 m asl, rope rising), south to the Sentosa tower (88 m asl)
  { const yc = y2 + 64, nN = dirTo(STN.hf, STN.faber), nS = dirTo(STN.hf, STN.sentosa);
    const aN = [sc[0] - d[0]*27.5, yc, sc[1] - d[1]*27.5], aS = [sc[0] + d[0]*27.5, yc, sc[1] + d[1]*27.5];
    // ropes inside the hall (deck to deck), then out
    cableStub(B, [sc[0] - d[0]*27.5, yc, sc[1] - d[1]*27.5], d, 55, 0, 5.6, CC, [[0.3, -1], [0.62, 1]]);
    cableStub(B, aN, nN, 60, 0.0275, 5.6, CC, [[0.55, 1]]);
    cableStub(B, aS, nS, 60, 0.038, 5.6, CC, [[0.45, -1]]);
    // the station platforms inside
    for (const s of [-1, 1]){ const p = rectR([sc[0] + s*(-d[1])*4.8, sc[1] + s*d[0]*4.8], d, 26, 1.6); flatPoly(B.p(FR), p, yc - 4.7); } }
  // ---- Tower One: the 18-storey slab, its lower west strip and the podiums
  const g1 = minG(gl, [...T1A, ...T1P1, ...T1P2]), y1 = gl(22, -20);
  glassBlock(B, T1A, g1 - 1.2, y1, y1 + 60, {gl:GL, fr:FR, rf:RF, base:BASE, fh:3.25, y1st:4.5, mull:1.5});
  glassBlock(B, T1B, g1 - 1.2, y1, y1 + 60, {gl:GL, fr:FR, rf:RF, base:BASE, fh:3.25, y1st:4.5});
  glassBlock(B, T1C, g1 - 1.2, y1, y1 + 53.4, {gl:GL, fr:FR, rf:RF, base:BASE, fh:3.25, y1st:4.5, mull:1.5});
  glassBlock(B, T1P1, g1 - 1.2, y1, y1 + 13.8, {gl:GL, fr:FR, rf:RF, base:BASE, fh:4.5, mull:3.0, par:0.9});
  glassBlock(B, T1P2, g1 - 1.2, y1, y1 + 17.1, {gl:GL, fr:FR, rf:RF, base:BASE, fh:4.2, mull:3.0, par:0.9});
  glassBlock(B, T1N, g1 - 1.2, y1, y1 + 13.8, {gl:GL, fr:FR, rf:RF, base:BASE, fh:4.5, par:0.9});
  // roof plant and the white frame of the roof crown on the slab
  { const ax1 = [7.2 - (-0.6), -67.2 - 10.5], L1 = Math.hypot(ax1[0], ax1[1]), d1 = [ax1[0]/L1, ax1[1]/L1], c1 = [(7.2 + 28.7 + 20.9 - 0.6)/4, (-67.2 - 64.8 + 12.3 + 10.5)/4];
    const PL = rectR(c1, d1, 26, 7); prismP(B.p(CORE), B.p(RF), PL, y1 + 60, y1 + 64.5);
    const CR = rectR(c1, d1, 38.5, 10.4); edgeBands(B.p(FR), CR, y1 + 60.2, y1 + 62.4, 0.15);
    boxP(B.p(BEAC), 0.4, 0.5, 0.4, c1[0], y1 + 64.5, c1[1], 0); }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'sghftowers', lat:1.2646, lon:103.81895, rot:0});
}

// ======================================================================================================
// Keppel Bay Tower (keppel.com: 18 storeys, T.O.P. 2002; keppelreit: 18-storey office tower with a six-storey podium), the
// twin of HarbourFront Tower One (mapletree.com.sg: Keppel–PSA "HarbourFront twin office towers", 18 storeys each). Plan and
// heights = the OSM building parts of w47418846: the 60 m slab, its two 53.4 m side strips, the podium blocks of 13.8 / 17.1 /
// 7.2 m. Full-height glass (keppel.com). Night: lit office windows, lit crown frame, red beacon.
// ======================================================================================================
{
const LAT = 1.264828, LON = 103.818253, RR = 60;
const TER = {X0:-2976.69, Y0:-5547.72, i0:355, j0:319, nx:6, ny:5, H:[-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,45,-3,-3,-3,50,51,52,-3,-3,-3,11,64,65,-3,-3,-3,11,88,89]};
const KT = [[-3.0,19.7],[3.5,-46.1],[24.4,-43.8],[17.9,21.5],[13.1,20.9],[12.5,25.6],[1.2,24.4],[1.8,20.3]];
const KE = [[18.5,16.1],[23.8,-37.8],[31.6,-36.7],[26.2,17.3]];
const KW = [[-2.4,14.3],[-10.2,13.7],[-4.8,-40.8],[2.9,-40.2]];
const KP1 = [[-3.0,19.7],[1.8,20.3],[1.2,24.4],[12.5,25.6],[13.1,20.9],[17.9,21.5],[18.5,16.1],[26.2,17.3],[31.6,-36.7],[38.8,-36.1],[30.4,41.6],[-4.8,38.1]];
const KP2 = [[-17.9,0.1],[-28.1,-1.1],[-23.3,-43.2],[-13.8,-42.0]];
const KP3 = [[-19.7,12.6],[-13.8,-42.0],[-4.8,-40.8],[-10.2,13.7]];
const KP4 = [[-19.7,12.6],[-2.4,14.3],[-4.8,38.1],[-45.4,33.9],[-41.8,-2.3],[-17.9,0.1]];
LANDMARKS.sgkeppelbaytower = {zh:'吉宝湾大厦', en:'Keppel Bay Tower', cat:'new', r:RR, h:65, lt:{m:1, c:'#e6efff', k:0.6}, build(){
  const g = new THREE.Group(), B = mkB(), {gl} = groundK(TER, LAT, LON, RR);
  const GL = {c:'#7f9cac', m:1, fh:3.3, cw:3.0, lc:'#e6efff', lk:0.55}, FR = {c:'#d3d8da', m:0, lk:0.15}, CORE = {c:'#e7e4dc', m:0, lc:'#fff3df', lk:0.4};
  const RF = '#8c8f93', BASE = {c:'#9b998f', m:0, lk:0}, BEAC = {c:'#c22', glow:'#ff2a1a', gk:2}, GRN = {c:'#5f8a4b', m:0, lk:0};
  const g0 = minG(gl, [...KP1, ...KP4, ...KP2]), y0 = gl(5, -5);
  glassBlock(B, KT, g0 - 1.2, y0, y0 + 60, {gl:GL, fr:FR, rf:RF, base:BASE, fh:3.25, y1st:4.5, mull:1.5});
  glassBlock(B, KE, g0 - 1.2, y0, y0 + 53.4, {gl:GL, fr:FR, rf:RF, base:BASE, fh:3.25, y1st:4.5, mull:1.5});
  glassBlock(B, KW, g0 - 1.2, y0, y0 + 53.4, {gl:GL, fr:FR, rf:RF, base:BASE, fh:3.25, y1st:4.5, mull:1.5});
  glassBlock(B, KP1, g0 - 1.2, y0, y0 + 13.8, {gl:GL, fr:FR, rf:RF, base:BASE, fh:4.5, mull:3.0, par:0.9});
  glassBlock(B, KP2, g0 - 1.2, y0, y0 + 7.2, {gl:GL, fr:FR, rf:RF, base:BASE, fh:3.6, mull:3.0, par:0.9});
  glassBlock(B, KP3, g0 - 1.2, y0, y0 + 17.1, {gl:GL, fr:FR, rf:RF, base:BASE, fh:2.85, mull:3.0, par:0.9});
  glassBlock(B, KP4, g0 - 1.2, y0, y0 + 17.1, {gl:GL, fr:FR, rf:RF, base:BASE, fh:2.85, mull:3.0, par:0.9});
  // planted podium roof edge (courtyards and greenery, architizer) — a planter band along the podium roofs
  edgeBands(B.p(GRN), KP4, y0 + 17.1, y0 + 17.9, -0.6);
  { const ax = [3.5 - (-3.0), -46.1 - 19.7], L = Math.hypot(ax[0], ax[1]), d = [ax[0]/L, ax[1]/L], c = [(3.5 + 24.4 + 17.9 - 3.0)/4, (-46.1 - 43.8 + 21.5 + 19.7)/4];
    prismP(B.p(CORE), B.p(RF), rectR(c, d, 22, 6.5), y0 + 60, y0 + 64.5);
    edgeBands(B.p(FR), rectR(c, d, 33, 10.4), y0 + 60.2, y0 + 62.4, 0.15);
    boxP(B.p(BEAC), 0.4, 0.5, 0.4, c[0], y0 + 64.5, c[1], 0); }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'sgkeppelbaytower', lat:1.264828, lon:103.818253, rot:0});
}


// ======================================================================================================
// Faber Peak — the Mount Faber station of the Singapore Cable Car (wikipedia: track 93 m above sea level; remontees-mecaniques:
// the line's drive station, Doppelmayr Uni-G; the 2005 "Jewel Box" refurbishment, thesmartlocal: its exterior façade lit by
// twinkling lights and changing colour washes at night) with its restaurants on the summit. Plan = OSM w184389542 split into its
// wings: the north block and the middle block (two storeys), the station hall at the south end whose mouth faces the harbour
// (the ropes leave south-south-west for the Seah Im Road tower, 80 m asl, 300 m away), the long south-east arm, the west
// wing (Arbora restaurant POI) and its small annex w176204468, all stepping with the real slope of the hill (the app terrain is baked in). Glazed walls in
// white frames, roof terraces with glass balustrades, a shallow barrel roof over the station hall with the bull-wheel inside.
// Night: lit glazing and the façade wash cycling (anim 'cycle').
// ======================================================================================================
{
const LAT = 1.271214, LON = 103.819462, RR = 76;
const TER = {X0:-2842.14, Y0:-4841.59, i0:357, j0:328, nx:6, ny:6, H:[501,562,584,563,507,431,614,701,742,727,664,568,691,808,877,882,821,709,719,864,966,997,947,827,701,865,992,1048,1011,890,650,815,952,1021,994,879]};
const NB = [[-28.3,-18.4],[-26.5,-28.5],[8.7,-23.2],[6.9,-7.8],[-24.1,-6.6]];
const MB = [[-24.1,-6.6],[6.9,-7.8],[11.1,-6.0],[11.7,-1.2],[4.5,10.6],[-14.6,8.8],[-25.9,7.1]];
const SH = [[-14.6,8.8],[4.5,10.6],[2.7,26.0],[-16.4,23.7]];
const WW = [[-53.4,-16.7],[-35.5,-19.0],[-28.3,-18.4],[-24.1,-6.6],[-45.6,-9.5],[-53.4,-13.1],[-54.0,-14.9]];
const FX = [[-39.7,-23.2],[-40.3,-18.4],[-50.4,-17.3],[-58.8,-17.8],[-57.6,-25.0]];   // OSM w176204468 (h 6, est), the annex north of the west wing
const SE = [[11.7,-1.2],[21.8,6.5],[24.2,3.5],[61.2,13.6],[52.9,24.9],[12.3,14.8],[7.5,11.2],[4.5,10.6]];
LANDMARKS.sgfaberpeak = {zh:'花柏山顶（缆车站）', en:'Faber Peak (Mount Faber Cable Car Station)', cat:'new', r:RR, h:9, lt:{m:0, c:"#fff0da", k:0.7, e:0.6, anim:'cycle', c2:'#b896ff'}, build(){
  const g = new THREE.Group(), B = mkB(), {gl} = groundK(TER, LAT, LON, RR);
  const WH = {c:'#eeeeea', m:0, lk:0.55}, GLS = {c:'#86a9b6', glow:'#ffe4bd', gk:0.32}, RF = {c:'#a9aba6', m:0, lk:0.1}, BASE = {c:'#b6ad9c', m:0, lk:0.2};
  const RAIL = {c:'#cfe3e8', op:0.45, ds:true}, STL = {c:'#5f6266', m:0, lk:0.15}, DECK = {c:'#c9c3b6', m:0, lk:0.1};
  const CC = {rope:'#3b3d41', body:{c:'#26282c', m:0, lk:0}, win:{c:'#9aa7b0', glow:'#ffe2b0', gk:0.35}, hang:{c:'#b9bdc1', m:0, lk:0.2}};
  // a glazed wing: white base course and slab edges, glass between, flat roof with a terrace balustrade
  const wing = (P, yg, H, fl, terr) => {
    const yb = minG(gl, P) - 1.5;
    wallP(B.p(BASE), P, yb, yg + 0.6);
    wallP(B.p(GLS), P, yg + 0.6, yg + H);
    flatPoly(B.p(RF), P, yg + H);
    for (let k = 1; k < fl; k++) edgeBands(B.p(WH), P, yg + k*H/fl - 0.45, yg + k*H/fl + 0.3, 0.12);
    edgeBands(B.p(WH), P, yg + H - 0.8, yg + H + 0.25, 0.14);
    edgeFins(B.p(WH), P, yg + 0.6, yg + H, 3.6, 0.22, 0.25);
    if (terr){ edgeBands(B.p(RAIL), P, yg + H + 0.25, yg + H + 1.3, -0.3); flatPoly(B.p(DECK), offRing(P, -0.4), yg + H + 0.05); }
  };
  const yN = gl(-10, -17), yM = gl(-6, 1), yS = gl(-6, 17), yW = gl(-40, -14), yE = gl(32, 12);
  wing(NB, yN, 9.6, 2, true);
  wing(MB, Math.min(yM, yN - 1.2), 9.6, 2, true);
  wing(WW, yW, 5.2, 1, true);
  wing(SE, yE, 6.0, 1, true);
  wing(FX, gl(-49, -21), 5.0, 1, false);
  // ---- station hall: lower level (arrivals, shops), the platform level and a shallow barrel roof over the cabin loop
  { const yb = minG(gl, SH) - 2, y0 = Math.min(yS, yM - 1), yP = y0 + 5.2, yR = y0 + 13.2;
    wallP(B.p(BASE), SH, yb, y0 + 0.6); wallP(B.p(GLS), SH, y0 + 0.6, yP); edgeBands(B.p(WH), SH, yP - 0.6, yP + 0.3, 0.14);
    flatPoly(B.p(RF), SH, yP);
    // the hall: posts and glazed sides on the long edges, open mouth at the south end
    const ax = [(-16.4 + 2.7)/2 - (-14.6 + 4.5)/2, (23.7 + 26.0)/2 - (8.8 + 10.6)/2], L = Math.hypot(ax[0], ax[1]), d = [ax[0]/L, ax[1]/L], n = [-d[1], d[0]];
    const c = cen(SH), hu = L/2 + 1.2, hv = 10.2, nb = 14;
    const gls = B.p(GLS), wh = B.p(WH), rf = B.p(RF);
    for (let i = 0; i < nb; i++){
      const t0 = i/nb, t1 = (i+1)/nb, th0 = lerp(-1, 1, t0), th1 = lerp(-1, 1, t1);
      const P = (u, th) => { const v = hv*th, y = yR - 3.0*th*th; return [c[0] + d[0]*u + n[0]*v, y, c[1] + d[1]*u + n[1]*v]; };
      quadP(rf, P(-hu, th0), P(hu, th0), P(hu, th1), P(-hu, th1));
    }
    for (const s of [-1, 1]){ const a = [c[0] - d[0]*hu + n[0]*hv*s, c[1] - d[1]*hu + n[1]*hv*s], b = [c[0] + d[0]*hu + n[0]*hv*s, c[1] + d[1]*hu + n[1]*hv*s];
      quadP(gls, [a[0], yP, a[1]], [b[0], yP, b[1]], [b[0], yR - 3.2, b[1]], [a[0], yR - 3.2, a[1]]);
      for (let k = 0; k <= 5; k++){ const t = k/5, p = [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]; boxP(wh, 0.4, yR - 3 - yP, 0.4, p[0], yP, p[1], 0); }
      barP(wh, a, b, 0.5, 0.6, yR - 3.4); }
    // barrel ribs
    for (let k = 0; k <= 6; k++){ const u = lerp(-hu, hu, k/6), pts = []; for (let j = 0; j <= 8; j++){ const th = lerp(-1, 1, j/8); pts.push([c[0] + d[0]*u + n[0]*hv*th, yR - 3.0*th*th + 0.25, c[1] + d[1]*u + n[1]*hv*th]); } polyP(wh, pts, 0.22, 4); }
    // the bull-wheel (drive) at the back of the hall and the rope loop round it, platforms either side
    const yc = yP + 4.4, back = [c[0] - d[0]*(hu - 3), yc, c[1] - d[1]*(hu - 3)];
    { const st = B.p(STL), k = 20, R = 2.8; const ring = []; for (let i = 0; i <= k; i++){ const a = i/k*TAU; ring.push([back[0] + n[0]*Math.cos(a)*R + d[0]*Math.sin(a)*R, yc, back[2] + n[1]*Math.cos(a)*R + d[1]*Math.sin(a)*R]); }
      polyP(st, ring, 0.18, 4); segP(st, [back[0], yP, back[2]], [back[0], yc, back[2]], 0.5, 6); }
    for (const s of [-1, 1]){ flatPoly(B.p(DECK), rectR([c[0] + n[0]*s*4.6, c[1] + n[1]*s*4.6], d, hu - 1, 1.6), yP + 0.05); }
    // ropes out of the mouth towards HarbourFront, cabins in the hall and on the ropes
    const dd = dirTo(STN.faber, STN.hf), mouth = [c[0] + d[0]*hu, yc, c[1] + d[1]*hu];
    cableStub(B, [back[0], yc, back[2]], d, 2*hu - 3, 0, 5.6, CC, [[0.35, -1], [0.7, 1], [0.5, 1]]);
    cableStub(B, mouth, dd, 26, -0.043, 5.6, CC, [[0.7, -1]]);
  }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'sgfaberpeak', lat:1.271214, lon:103.819462, rot:0});
}

// ======================================================================================================
// Sentosa Station of the Mount Faber Line on Imbiah hill (wikipedia: track 47 m asl; remontees-mecaniques: the bottom station,
// hydraulic tension station, with the cabin garage and the cable car museum). Plan = OSM w159637725: the long hall (51 x 18 m)
// on the line's axis, which the ropes enter at its north mouth from the Sentosa tower (88 m asl, 450 m away), the south block,
// and the attached two-storey shop block w159637728 (OSM 2 floors). Lower level in buff render with glazed openings, the
// platform hall above under a shallow pitched metal roof on white posts, the tension carriage at the south end.
// ======================================================================================================
{
const LAT = 1.255436, LON = 103.817702, RR = 57;
const TER = {X0:-3038.01, Y0:-6586.23, i0:354, j0:304, nx:6, ny:5, H:[400,465,481,442,364,268,442,510,525,482,396,292,438,502,516,475,391,291,394,449,462,427,355,268,321,364,376,351,297,228]};
const HALL = [[-12.1,17.8],[-6.8,-33.2],[-5.0,-33.2],[-4.4,-36.2],[5.2,-35.0],[4.6,-32.0],[11.7,-30.9],[6.4,19.0]];
const SOUTH = [[6.4,19.0],[11.1,20.1],[14.7,23.1],[15.9,27.3],[14.7,37.9],[9.3,37.3],[10.5,27.8],[-18.1,24.9],[-17.5,17.2],[-12.1,17.8]];
const SHOP = [[-16.3,8.3],[-18.1,24.9],[10.5,27.8],[9.3,37.3],[0.4,36.7],[-0.2,39.7],[-10.4,39.1],[-9.8,35.0],[-30.1,33.2],[-28.3,15.4],[-25.9,15.4],[-24.7,7.7]];
LANDMARKS.sgsentosastn = {zh:'圣淘沙缆车站', en:'Sentosa Cable Car Station (Imbiah)', cat:'new', r:RR, h:11, lt:{m:0, c:"#fff0da", k:0.6, e:0.6}, build(){
  const g = new THREE.Group(), B = mkB(), {gl} = groundK(TER, LAT, LON, RR);
  const WH = {c:'#efefea', m:0, lk:0.45}, REN = {c:'#d9cfb8', m:0, lk:0.35}, GLS = {c:'#86a9b6', glow:'#ffe4bd', gk:0.32}, RF = {c:'#8f9497', m:0, lk:0.1};
  const BASE = {c:'#b6ad9c', m:0, lk:0.1}, STL = {c:'#5f6266', m:0, lk:0.15}, DECK = {c:'#b39a78', m:0, lk:0.1};
  const CC = {rope:'#3b3d41', body:{c:'#26282c', m:0, lk:0}, win:{c:'#9aa7b0', glow:'#ffe2b0', gk:0.35}, hang:{c:'#b9bdc1', m:0, lk:0.2}};
  const block = (P, y0, H, fl, glazeFrom) => {
    const yb = minG(gl, P) - 1.5; wallP(B.p(BASE), P, yb, y0 + 0.3); wallP(B.p(REN), P, y0 + 0.3, y0 + H); flatPoly(B.p(RF), P, y0 + H);
    for (let k = 0; k < fl; k++){ const ya = y0 + k*H/fl; edgeBands(B.p(GLS), P, ya + 1.0, ya + H/fl - 0.8, 0.05); edgeFins(B.p(REN), P, ya + 1.0, ya + H/fl - 0.8, 4.0, 0.7, 0.12); }
    edgeBands(B.p(WH), P, y0 + H - 0.7, y0 + H + 0.5, 0.1);
  };
  const yH = gl(0, -8), yS = gl(0, 26);
  block(SHOP, Math.min(gl(-12, 25), yS), 7.0, 2);
  block(SOUTH, yS, 8.0, 2);
  // the hall: lower storey (garage / museum) and the platform level above
  { const y0 = yH, yP = y0 + 5.0, yE = y0 + 11.4, yR = y0 + 13.4;
    const yb = minG(gl, HALL) - 1.5; wallP(B.p(BASE), HALL, yb, y0 + 0.3); wallP(B.p(REN), HALL, y0 + 0.3, yP); flatPoly(B.p(RF), HALL, yP);
    edgeBands(B.p(GLS), HALL, y0 + 1.2, yP - 1.0, 0.05); edgeFins(B.p(REN), HALL, y0 + 1.2, yP - 1.0, 4.2, 0.8, 0.12); edgeBands(B.p(WH), HALL, yP - 0.5, yP + 0.4, 0.12);
    const ax = [-6.8 - (-12.1), -33.2 - 17.8], L = Math.hypot(ax[0], ax[1]), d = [ax[0]/L, ax[1]/L], n = [-d[1], d[0]];
    const c = [(-12.1 + 6.4 - 6.8 + 11.7)/4, (17.8 + 19.0 - 33.2 - 30.9)/4], hu = 26.2, hv = 9.0;
    const wh = B.p(WH), gls = B.p(GLS), rf = B.p(RF);
    // posts, eaves beams, glazed side screens (upper half), pitched roof with ridge on the axis
    for (const s of [-1, 1]){ const a = [c[0] - d[0]*hu + n[0]*hv*s, c[1] - d[1]*hu + n[1]*hv*s], b = [c[0] + d[0]*hu + n[0]*hv*s, c[1] + d[1]*hu + n[1]*hv*s];
      for (let k = 0; k <= 8; k++){ const t = k/8; boxP(wh, 0.45, yE - yP, 0.45, lerp(a[0], b[0], t), yP, lerp(a[1], b[1], t), 0); }
      barP(wh, a, b, 0.5, 0.7, yE - 0.7);
      quadP(gls, [a[0], yP + 1.1, a[1]], [b[0], yP + 1.1, b[1]], [b[0], yE - 0.7, b[1]], [a[0], yE - 0.7, a[1]]);
      const ov = 1.4, A = [c[0] - d[0]*(hu + ov) + n[0]*(hv + ov)*s, yE - 0.3, c[1] - d[1]*(hu + ov) + n[1]*(hv + ov)*s], Bp = [c[0] + d[0]*(hu + ov) + n[0]*(hv + ov)*s, yE - 0.3, c[1] + d[1]*(hu + ov) + n[1]*(hv + ov)*s];
      quadP(rf, A, Bp, [c[0] + d[0]*(hu + ov), yR, c[1] + d[1]*(hu + ov)], [c[0] - d[0]*(hu + ov), yR, c[1] - d[1]*(hu + ov)]); }
    // gable ends (south closed, north open mouth)
    { const P = (u, s, y) => [c[0] + d[0]*u + n[0]*hv*s, y, c[1] + d[1]*u + n[1]*hv*s];
      triP(B.p(REN), P(-hu, -1, yE), P(-hu, 1, yE), [c[0] - d[0]*hu, yR, c[1] - d[1]*hu]); quadP(B.p(REN), P(-hu, -1, yP), P(-hu, 1, yP), P(-hu, 1, yE), P(-hu, -1, yE));
      barP(wh, [P(hu, -1, 0)[0], P(hu, -1, 0)[2]], [P(hu, 1, 0)[0], P(hu, 1, 0)[2]], 0.6, 1.0, yE - 1.0); }
    // the rope loop round the hydraulic tension carriage at the south end, platforms, cabins parked in the hall
    const yc = yP + 4.4, back = [c[0] - d[0]*(hu - 4), yc, c[1] - d[1]*(hu - 4)];
    { const st = B.p(STL), k = 20, R = 2.8, ring = []; for (let i = 0; i <= k; i++){ const a = i/k*TAU; ring.push([back[0] + n[0]*Math.cos(a)*R + d[0]*Math.sin(a)*R, yc, back[2] + n[1]*Math.cos(a)*R + d[1]*Math.sin(a)*R]); }
      polyP(st, ring, 0.18, 4); boxP(st, 4.2, 1.6, 4.2, back[0], yc - 0.8, back[2], Math.atan2(-d[1], d[0])); segP(st, [back[0], yP, back[2]], [back[0], yc - 0.8, back[2]], 0.4, 6); }
    for (const s of [-1, 1]) flatPoly(B.p(DECK), rectR([c[0] + n[0]*s*4.6, c[1] + n[1]*s*4.6], d, hu - 2, 1.6), yP + 0.05);
    const dd = dirTo(STN.sentosa, STN.hf), mouth = [c[0] + d[0]*hu, yc, c[1] + d[1]*hu];
    cableStub(B, back, d, 2*hu - 4, 0, 5.6, CC, [[0.25, 1], [0.55, -1], [0.8, 1]]);
    cableStub(B, mouth, dd, 22, 0.09, 5.6, CC, [[0.6, -1]]);
  }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'sgsentosastn', lat:1.255436, lon:103.817702, rot:0});
}

// ======================================================================================================
// SkyHelix Sentosa (Dec 2021; Aerophile "Aerobar": brochure — tower diameter 11 m, overall height 40 m, passengers rise to
// 35 m, 12 helices crossing clockwise and counter-clockwise, 3 masts carrying the rails, 16 passengers in a rotating gondola,
// 3 winches hidden under pit covers; Mount Faber Leisure: an open-air gondola, guests seated with feet dangling, LED-lit after
// sundown, apex 79 m above sea level). OSM w176839464 = the 11 m octagonal base. The gondola is shown part-way up (21 m).
// ======================================================================================================
{
const LAT = 1.254958, LON = 103.817613, RR = 25;
const TER = {X0:-3047.91, Y0:-6639.08, i0:355, j0:304, nx:4, ny:4, H:[465,481,442,364,510,525,482,396,502,516,475,391,449,462,427,355]};
const BASEP = [[-5.8,-1.3],[-3.4,-5.4],[1.3,-6.0],[4.9,-3.1],[6.1,1.7],[3.1,5.2],[-1.6,5.8],[-5.2,2.9]];
LANDMARKS.sgskyhelix = {zh:'圣淘沙天空螺旋', en:'SkyHelix Sentosa', cat:'new', r:RR, h:40, lt:{m:0, c:'#e4eeff', k:0.9, e:0.8, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB(), {gl} = groundK(TER, LAT, LON, RR);
  const WH = {c:'#f1f2f0', m:0, lk:0.8}, STL = {c:'#8a8e92', m:0, lk:0.3}, LED = {c:'#dfe8f5', glow:'#cfe2ff', gk:0.9}, DECK = {c:'#8d8a84', m:0, lk:0.1};
  const GON = {c:'#e9e9e6', m:0, lk:0.4}, SEAT = {c:'#33363a', m:0, lk:0}, BASE = {c:'#b6ad9c', m:0, lk:0.1};
  const y0 = gl(0, 0), yb = minG(gl, BASEP) - 1.5, R = 5.5, H = 40;
  // pit cover and the boarding ring
  wallP(B.p(BASE), BASEP, yb, y0 + 0.5); flatPoly(B.p(DECK), BASEP, y0 + 0.5);
  { const o = B.p(DECK), n = 24; for (let i = 0; i < n; i++){ const a0 = i/n*TAU, a1 = (i+1)/n*TAU, r0 = 6.2, r1 = 8.6;
      quadP(o, [Math.cos(a0)*r0, y0 + 0.35, Math.sin(a0)*r0], [Math.cos(a1)*r0, y0 + 0.35, Math.sin(a1)*r0], [Math.cos(a1)*r1, y0 + 0.35, Math.sin(a1)*r1], [Math.cos(a0)*r1, y0 + 0.35, Math.sin(a0)*r1]);
      quadP(B.p(BASE), [Math.cos(a0)*r1, yb, Math.sin(a0)*r1], [Math.cos(a1)*r1, yb, Math.sin(a1)*r1], [Math.cos(a1)*r1, y0 + 0.35, Math.sin(a1)*r1], [Math.cos(a0)*r1, y0 + 0.35, Math.sin(a0)*r1]); } }
  // 12 helices (6 each way), half a turn over the height, white tubes with an LED strip on every other one
  { const wh = B.p(WH), ld = B.p(LED), N = 40;
    for (let k = 0; k < 12; k++){ const sg = k < 6 ? 1 : -1, a0 = (k % 6)/6*TAU + (sg < 0 ? PI/6 : 0), pts = [], pl = [];
      for (let i = 0; i <= N; i++){ const t = i/N, a = a0 + sg*t*PI, y = y0 + 0.5 + t*(H - 2.5);
        pts.push([Math.cos(a)*R, y, Math.sin(a)*R]); pl.push([Math.cos(a)*(R + 0.16), y, Math.sin(a)*(R + 0.16)]); }
      polyP(wh, pts, 0.17, 5); if (k % 2 === 0) polyP(ld, pl, 0.05, 3); }
    // ring beams
    for (const y of [y0 + 0.6, y0 + 13, y0 + 26, y0 + H - 2]){ const pts = []; for (let i = 0; i <= 36; i++){ const a = i/36*TAU; pts.push([Math.cos(a)*R, y, Math.sin(a)*R]); } polyP(wh, pts, 0.2, 4); } }
  // three masts with the rails, the head frame at the top
  { const st = B.p(STL), wh = B.p(WH);
    for (let k = 0; k < 3; k++){ const a = k/3*TAU + PI/2, x = Math.cos(a)*(R - 0.7), z = Math.sin(a)*(R - 0.7);
      segP(st, [x, y0 + 0.5, z], [x, y0 + H, z], 0.38, 6); boxP(st, 1.2, 1.4, 1.2, x, y0 + H - 0.4, z, a); }
    const top = []; for (let i = 0; i <= 36; i++){ const a = i/36*TAU; top.push([Math.cos(a)*(R - 0.5), y0 + H, Math.sin(a)*(R - 0.5)]); } polyP(wh, top, 0.32, 5);
    for (let k = 0; k < 3; k++){ const a = k/3*TAU + PI/2; segP(wh, [Math.cos(a)*(R - 0.7), y0 + H, Math.sin(a)*(R - 0.7)], [0, y0 + H + 0.4, 0], 0.22, 4); } }
  // the open-air gondola: a ring round the tower, 16 outward-facing seats, rail and LED underside; carriages on the masts
  { const yg = y0 + 21, ri = 6.0, ro = 8.4, n = 32, gn = B.p(GON), ld = B.p(LED), st = B.p(STL), se = B.p(SEAT);
    for (let i = 0; i < n; i++){ const a0 = i/n*TAU, a1 = (i+1)/n*TAU, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      quadP(gn, [c0*ri, yg, s0*ri], [c1*ri, yg, s1*ri], [c1*ro, yg, s1*ro], [c0*ro, yg, s0*ro]);
      quadP(gn, [c0*ri, yg - 0.7, s0*ri], [c1*ri, yg - 0.7, s1*ri], [c1*ro, yg - 0.7, s1*ro], [c0*ro, yg - 0.7, s0*ro]);
      quadP(gn, [c0*ro, yg - 0.7, s0*ro], [c1*ro, yg - 0.7, s1*ro], [c1*ro, yg, s1*ro], [c0*ro, yg, s0*ro]);
      quadP(gn, [c0*ri, yg - 0.7, s0*ri], [c1*ri, yg - 0.7, s1*ri], [c1*ri, yg + 1.1, s1*ri], [c0*ri, yg + 1.1, s0*ri]);
      quadP(ld, [c0*(ro - 0.3), yg - 0.72, s0*(ro - 0.3)], [c1*(ro - 0.3), yg - 0.72, s1*(ro - 0.3)], [c1*(ro - 1.2), yg - 0.72, s1*(ro - 1.2)], [c0*(ro - 1.2), yg - 0.72, s0*(ro - 1.2)]); }
    for (let i = 0; i < 16; i++){ const a = (i + 0.5)/16*TAU, c = Math.cos(a), s = Math.sin(a), ry = Math.atan2(-s, c);
      boxP(se, 0.55, 0.45, 0.55, c*7.4, yg, s*7.4, ry); boxP(se, 0.12, 0.9, 0.55, c*7.05, yg + 0.45, s*7.05, ry); }
    const rail = []; for (let i = 0; i <= 36; i++){ const a = i/36*TAU; rail.push([Math.cos(a)*6.3, yg + 1.15, Math.sin(a)*6.3]); } polyP(st, rail, 0.06, 3);
    for (let k = 0; k < 3; k++){ const a = k/3*TAU + PI/2; boxP(st, 1.0, 2.4, 1.0, Math.cos(a)*(R - 0.7), yg - 0.9, Math.sin(a)*(R - 0.7), a); segP(st, [Math.cos(a)*(R - 0.7), yg - 0.3, Math.sin(a)*(R - 0.7)], [Math.cos(a)*ri, yg - 0.3, Math.sin(a)*ri], 0.2, 4); } }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'sgskyhelix', lat:1.254958, lon:103.817613, rot:0});
}


// ======================================================================================================
// Mapletree Business City, Alexandra Road (MBC I 2010, MBC II 2016; DCA Architects for MBC II). MBC II (architizer): a
// 30-storey office tower over a terraced podium with a 250 m curved facade, a planted elevated deck and landscaped terraces;
// Wikipedia's tallest list: MBC II 155 m, 30 floors. MPACT: column-free floor plates, 3.2 m floor-to-ceiling. Plans and heights:
// OSM — MBC II tower w775267652 (155 m used), its podium blocks w775267649 / 650 / 651 (9 / 7 / 6 floors, 4.5 m floor to floor),
// the site deck w775267627; MBC I — the main slab w172481794 with the tiered building parts of w775267628 (17.1 / 20.4 / 30.3 /
// 46.8 m, roof plant to 50.1 m, the lower floors open under a portal on the south face), the 18-floor blocks w327590776 and
// w172481882 and the 2-floor block w327590771 (OSM heights), the plinth w327590773, and the block w1150420152 at Alexandra Road
// (OSM h 14.4, estimated). Glazed bands with white slab edges and mullions, planted terrace edges. Night: lit office windows,
// lit crown frame on the MBC II tower.
// ======================================================================================================
{
const S = F => F;
const T2 = S([[98.7,-46.0],[125.0,-85.1],[180.5,-48.4],[154.3,-9.2]]);
const P9 = S([[52.8,-101.7],[55.8,-109.5],[109.5,-88.7],[104.1,-79.8],[116.7,-72.7],[107.1,-58.5],[86.8,-67.3],[81.4,-53.1],[46.8,-64.4],[33.7,-66.8],[42.6,-105.9]]);
const P7 = S([[-10.5,-119.5],[-9.9,-127.2],[44.4,-114.2],[34.9,-71.5],[17.0,-76.8],[-1.6,-80.4],[-11.1,-81.6],[-24.2,-81.6],[-18.3,-120.7]]);
const P6 = S([[-84.6,-132.0],[-21.2,-129.7],[-22.3,-120.8],[-18.2,-120.7],[-23.6,-85.7],[-86.4,-88.6],[-88.8,-118.9],[-84.7,-119.6]]);
const DK2 = S([[-23.6,-85.8],[-24.1,-81.7],[-11.1,-81.7],[17.0,-76.9],[34.9,-71.6],[33.8,-66.8],[46.8,-64.5],[81.4,-53.3],[86.8,-67.5],[107.2,-58.5],[98.9,-46.0],[110.8,-38.3],[108.4,-30.0],[110.8,34.1],[-144.9,-80.9],[-131.2,-112.4],[-131.8,-121.4],[-121.7,-142.0],[-123.4,-143.1],[-131.7,-143.1],[-150.9,-139.1],[-142.5,-155.2],[-118.0,-161.7],[-109.1,-161.8],[-91.1,-196.1],[24.2,-143.4],[97.6,-117.9],[139.4,-96.5],[198.0,-53.1],[196.2,-45.4],[176.4,-5.0],[154.2,-9.1],[180.4,-48.3],[125.0,-85.0],[116.6,-72.6],[104.0,-79.8],[109.3,-88.6],[55.8,-109.3],[52.7,-101.6],[42.5,-105.8],[44.3,-114.1],[-9.8,-127.1],[-10.5,-119.4],[-22.5,-120.6],[-21.4,-129.5],[-84.4,-131.9],[-84.4,-119.5],[-88.6,-118.8],[-86.2,-88.8]]);
const M_LO = S([[-50.5,38.2],[-63.6,34.6],[-63.6,-7.4],[62.3,28.1],[51.6,67.3],[1.4,53.0],[6.2,36.4],[-45.7,22.2]]);   // 0-17.1 and 19.8-30.3 (south portal open)
const M_FULL = S([[51.6,67.3],[-63.6,34.7],[-63.6,-7.4],[62.3,28.1]]);
const M_W = S([[-121.0,18.0],[-110.2,-20.5],[-63.6,-7.5],[-63.6,34.4]]);
const M_PL1 = S([[48.0,27.5],[40.2,55.4],[-63.6,26.4],[-63.6,-3.7]]), M_PL2 = S([[-97.7,-16.9],[-69.6,-9.2],[-70.8,-5.7],[-63.6,-3.7],[-63.6,26.1],[-106.6,13.9]]);
const B18A = S([[73.2,162.8],[12.1,146.8],[23.4,103.9],[84.5,120.0]]), B18B = S([[-222.4,18.6],[-125.1,61.3],[-141.9,99.9],[-239.2,57.2]]);
const B2 = S([[-3.8,126.0],[-96.5,100.6],[-90.6,79.1],[2.1,104.5]]);
const BAX = S([[116.7,4.4],[127.4,15.1],[135.2,18.6],[144.7,24.6],[137.5,43.0],[130.4,44.1],[123.8,42.4],[113.1,30.5],[110.7,30.5],[110.1,-0.9]]);
const PL1 = S([[15.9,132.5],[-4.0,126.0],[1.9,104.7],[-90.4,79.3],[-96.4,100.5],[-105.5,98.2],[-100.2,77.5],[-132.4,77.4],[-125.3,61.4],[-222.5,18.6],[-216.4,8.5],[-141.3,44.0],[-137.2,35.2],[-130.0,31.0],[-120.9,17.9],[51.5,67.1],[62.3,28.0],[115.5,57.1],[120.3,61.3],[122.1,64.3],[121.5,72.6],[119.7,77.4],[100.0,113.6],[86.9,109.5],[84.4,120.2],[23.6,104.2]]);
// clip a plan to the half plane x < c (side -1) or x >= c (side +1)
const clipX = (P, c, side) => { const out = [], inside = p => side < 0 ? p[0] < c : p[0] >= c;
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], ia = inside(a), ib = inside(b);
    if (ia) out.push(a); if (ia !== ib){ const t = (c - a[0])/(b[0] - a[0]); out.push([c, a[1] + (b[1] - a[1])*t]); } }
  return out; };
const XC = -63.6;      // MBC I: the line between the main slab's east part (sgmbc) and its west wing (sgmbcw)
const mbcBuild = (part, OX, OZ) => {
  const g = new THREE.Group(), B = mkB(), sh = P => P.map(p => [p[0] - OX, p[1] - OZ]);
  const GL = {c:'#86a3a9', m:1, fh:4.5, cw:3.0, lc:'#e8f0ff', lk:0.5}, FR = {c:'#e3e5e2', m:0, lk:0.2}, RF = '#8e9193', BASE = {c:'#a39d92', m:0, lk:0.1};
  const GRN = {c:'#5b8748', m:0, lk:0}, DECK = {c:'#b9b4aa', m:0, lk:0.1}, CROWN = {c:'#e9ecee', m:0, lc:'#f2f6ff', lk:1.2, glow:'#eef4ff', gk:0.45}, BEAC = {c:'#c22', glow:'#ff2a1a', gk:2};
  const y0 = 0, yb = -5, PLH = 4.5;
  const blk = (P, ya, yt, fh, mull) => glassBlock(B, sh(P), yb, ya, yt, {gl:GL, fr:FR, rf:RF, base:BASE, fh, mull, par:1.0});
  const deck = P => { P = sh(P); wallP(B.p(BASE), P, yb, PLH - 0.4); flatPoly(B.p(DECK), P, PLH - 0.4); edgeBands(B.p(GRN), P, PLH - 0.4, PLH + 0.4, -0.8); };
  const top18 = P => { P = sh(P); const c = cen(P); prismP(B.p(FR), B.p(RF), P.map(p => [lerp(p[0], c[0], 0.25), lerp(p[1], c[1], 0.25)]), 60.6, 64.5); };
  if (part === 'A'){
    deck(DK2); deck(clipX(PL1, XC, 1));
    // ---- MBC II: terraced podium (6 / 7 / 9 floors) and the tower
    blk(P6, y0, 27.0, 4.5, 3.0); blk(P7, y0, 31.5, 4.5, 3.0); blk(P9, y0, 40.5, 4.5, 3.0);
    for (const [P, y] of [[P6, 27.0], [P7, 31.5], [P9, 40.5]]) edgeBands(B.p(GRN), sh(P), y + 0.3, y + 1.2, -0.9);
    blk(T2, y0, 135, 4.5, 1.6);
    { const T = sh(T2), c = cen(T), inset = T.map(p => [lerp(p[0], c[0], 0.12), lerp(p[1], c[1], 0.12)]);
      // crown: an open white frame screening the roof plant, 135 -> 155 m, lit at night
      prismP(B.p(FR), B.p(RF), inset, 135, 146);
      edgeBands(B.p(CROWN), T, 136.5, 155, 0.3);
      edgeFins(B.p(CROWN), T, 135, 155, 2.4, 0.5, 0.5);
      boxP(B.p(BEAC), 0.5, 0.6, 0.5, c[0], 155, c[1], 0);
      for (const y of [36, 72, 108]) edgeBands(B.p(GRN), T, y - 0.2, y + 0.9, 0.5); }
    // ---- MBC I main slab (east of XC): tiered, open portal at the south face on the lower floors
    blk(M_LO, y0, 30.3, 4.4, 3.0);
    glassBlock(B, sh(M_FULL), 16.5, 16.5, 20.4, {gl:GL, fr:FR, rf:RF, fh:4.4, mull:3.0, par:0});
    glassBlock(B, sh(M_FULL), 29.7, 29.7, 46.8, {gl:GL, fr:FR, rf:RF, fh:4.4, mull:3.0});
    flatPoly(B.p(FR), sh(M_FULL), 29.7); flatPoly(B.p(FR), sh(M_FULL), 16.5);
    prismP(B.p(FR), B.p(RF), sh(M_PL1), 46.8, 50.1);
    { const v = sh([[-45.7,22.2],[6.2,36.4],[1.4,53.0],[-50.5,38.2]]);
      for (let k = 0; k <= 6; k++){ const t = k/6, a = [lerp(v[3][0], v[2][0], t), lerp(v[3][1], v[2][1], t)]; boxP(B.p(FR), 1.2, 29.7, 1.2, a[0], 0, a[1], 0); } }
    blk(B18A, y0, 60.6, 3.37, 2.0); top18(B18A); blk(BAX, y0, 14.4, 4.6, 3.0);
  } else {
    deck(clipX(PL1, XC, -1));
    blk(M_W, y0, 46.8, 4.4, 3.0); prismP(B.p(FR), B.p(RF), sh(M_PL2), 46.8, 50.1);
    blk(B18B, y0, 60.6, 3.37, 2.0); top18(B18B); blk(B2, y0, 8.5, 4.2, 3.0);
  }
  B.flush(g);
  return g; };
// sgmbc: MBC II and the east part of MBC I; origin at the centre of its extent (ref point + (23.5, -16.5))
LANDMARKS.sgmbc = {zh:'丰树商业城', en:'Mapletree Business City', cat:'new', r:216, h:155, lt:{m:1, c:'#e8f0ff', k:0.6}, build(){ return mbcBuild('A', 23.5, -16.5); }};
SG_PLACES.push({type:'sgmbc', lat:1.275549, lon:103.799611, rot:0});
// sgmbcw (label:false): the west wing of MBC I's main slab and the west 18-floor block, split off so that the convex hull of the
// model does not cover the low buildings between MBC I and MBC II (Skylight Building etc.); origin = ref point + (-118.5, 52.8)
LANDMARKS.sgmbcw = {zh:'丰树商业城（西座）', en:'Mapletree Business City I (west blocks)', label:false, cat:'new', r:138, h:65, lt:{m:1, c:'#e8f0ff', k:0.6}, build(){ return mbcBuild('B', -118.5, 52.8); }};
SG_PLACES.push({type:'sgmbcw', lat:1.274922, lon:103.798335, rot:0});
}

// ======================================================================================================
// Keppel Bay Bridge (2008; DCA Architects and TY Lin International; 250 m, Singapore's longest cable-stayed bridge — wikipedia;
// Keppel fact sheet: a main pylon with seven asymmetrical stay cables rising 50 m above the sea, pedestrian walkways on both
// sides, white surfaces, programmable LED lighting; Monash bridge db: steel deck, maximum span 190 m). Alignment = the OSM road
// and the two footway lines (deck ~17 m wide), all hidden under the model and replaced by its own deck (gently cambered, 9 m at
// mid-span — the app's footway profile). The pylon is placed 60 m from the Keppel Island end so that the main span is 190 m;
// WHICH END carries the pylon is not stated by any source found (from recollection of photos: the island end) — check.
// Night: LED colour drift on the white deck, pylon and stays (anim 'cycle').
// ======================================================================================================
{
const LAT = 1.26405, LON = 103.81415, RR = 140;
LANDMARKS.sgkeppelbaybr = {zh:'吉宝湾大桥', en:'Keppel Bay Bridge', cat:'new', r:RR, h:50, lt:{m:0, c:'#f2f5ff', k:0.85, e:0.75, anim:'cycle', c2:'#7fb6ff'}, build(){
  const g = new THREE.Group(), B = mkB();
  const WH = {c:'#f0f1ee', m:0, lk:0.9}, ASP = {c:'#4c4e50', m:0, lk:0}, PAV = {c:'#b8b2a6', m:0, lk:0.1}, LINE = {c:'#e8e8e0', m:0, lk:0.2};
  const CAB = {c:'#d9dcdc', m:0, lk:1.0}, CON = {c:'#c9c5bb', m:0, lk:0.3}, LED = {c:'#e6eef5', glow:'#bcd8ff', gk:0.9}, RAIL = {c:'#9aa0a4', m:0, lk:0.3};
  const A = [98.0, -42.5], Z = [-121.0, 50.5], L0 = Math.hypot(Z[0] - A[0], Z[1] - A[1]), d = [(Z[0] - A[0])/L0, (Z[1] - A[1])/L0], n = [-d[1], d[0]];
  const E = (250 - L0)/2, S0 = -E, S1 = L0 + E, LEN = S1 - S0;
  const pt = (s, w, y) => [A[0] + d[0]*s + n[0]*w, y, A[1] + d[1]*s + n[1]*w];
  const yD = s => 1.4 + 7.6*(1 - Math.pow(2*(s - S0)/LEN - 1, 2));
  const HW = 8.6, ds = 2.5;
  { const as = B.p(ASP), pv = B.p(PAV), wh = B.p(WH), ln = B.p(LINE), ld = B.p(LED), rl = B.p(RAIL);
    for (let s = S0; s < S1 - 0.01; s += ds){ const s2 = Math.min(S1, s + ds), y1 = yD(s), y2 = yD(s2);
      quadP(as, pt(s, -5.6, y1), pt(s2, -5.6, y2), pt(s2, 5.6, y2), pt(s, 5.6, y1));
      for (const [w0, w1] of [[-HW, -5.6], [5.6, HW]]) quadP(pv, pt(s, w0, y1 + 0.18), pt(s2, w0, y2 + 0.18), pt(s2, w1, y2 + 0.18), pt(s, w1, y1 + 0.18));
      for (const w of [-5.6, 5.6]) quadP(wh, pt(s, w, y1), pt(s2, w, y2), pt(s2, w, y2 + 0.18), pt(s, w, y1 + 0.18));
      // box girder: soffit and the white fascias
      quadP(wh, pt(s, -HW, y1 - 1.9), pt(s2, -HW, y2 - 1.9), pt(s2, HW, y2 - 1.9), pt(s, HW, y1 - 1.9));
      for (const w of [-HW, HW]) quadP(wh, pt(s, w, y1 - 1.9), pt(s2, w, y2 - 1.9), pt(s2, w, y2 + 0.2), pt(s, w, y1 + 0.2));
      // lane lines (dashed centre, solid edges) — plain paint, no text
      if (Math.round(s/ds) % 2 === 0) quadP(ln, pt(s, -0.08, y1 + 0.02), pt(s2, -0.08, y2 + 0.02), pt(s2, 0.08, y2 + 0.02), pt(s, 0.08, y1 + 0.02));
      for (const w of [-5.3, 5.3]) quadP(ln, pt(s, w - 0.07, y1 + 0.02), pt(s2, w - 0.07, y2 + 0.02), pt(s2, w + 0.07, y2 + 0.02), pt(s, w + 0.07, y1 + 0.02));
      // LED strip along the fascia
      for (const w of [-HW - 0.03, HW + 0.03]) quadP(ld, pt(s, w, y1 - 0.7), pt(s2, w, y2 - 0.7), pt(s2, w, y2 - 0.45), pt(s, w, y1 - 0.45));
    }
    // parapets: posts, handrail; crash barrier between road and walkway
    for (const w of [-HW + 0.1, HW - 0.1]){ const top = []; for (let s = S0; s <= S1 + 0.01; s += 2.5){ const y = yD(s) + 0.18; segP(rl, pt(s, w, y), pt(s, w, y + 1.15), 0.05, 4); top.push(pt(s, w, y + 1.15)); } polyP(wh, top, 0.08, 4);
      for (const hh of [0.4, 0.8]){ const q = []; for (let s = S0; s <= S1 + 0.01; s += 5) q.push(pt(s, w, yD(s) + 0.18 + hh)); polyP(rl, q, 0.03, 3); } }
    for (const w of [-5.75, 5.75]){ const q = []; for (let s = S0; s <= S1 + 0.01; s += 5) q.push(pt(s, w, yD(s) + 0.55)); polyP(wh, q, 0.2, 4); }
    // lamp posts every 25 m on both walkways
    for (let s = S0 + 10; s < S1 - 5; s += 25) for (const w of [-HW + 0.4, HW - 0.4]){ const y = yD(s) + 0.18; segP(rl, pt(s, w, y), pt(s, w, y + 7), 0.09, 5); boxP(B.p(LED), 0.5, 0.25, 0.5, pt(s, w, 0)[0], y + 7, pt(s, w, 0)[2], 0); }
  }
  // ---- piers and abutments
  { const cc = B.p(CON);
    for (const s of [S0 + 3, S1 - 3]){ const c = pt(s, 0, 0); boxP(cc, 6, yD(s) + 3, 2*HW + 1, c[0], -3, c[2], Math.atan2(-d[1], d[0])); }
    const sP = S1 - 60; for (const w of [-4.5, 4.5]){ const c = pt(sP + 3, w, 0); boxP(cc, 3.5, yD(sP) - 1.9 + 4, 3.5, c[0], -4, c[2], Math.atan2(-d[1], d[0])); } }
  // ---- the pylon: a single white tapered mast on the deck axis, leaning back towards the island; seven stays to the main span
  { const sP = S1 - 60, base = pt(sP, 0, yD(sP)), lean = 0.27, H = 50 - yD(sP), wh = B.p(WH);
    const topP = [base[0] + d[0]*lean*H, 50, base[2] + d[1]*lean*H];
    const sec = (t) => { const p = mix(base, topP, t), a = lerp(2.0, 0.9, t), b = lerp(3.2, 1.4, t); return [p, a, b]; };
    const N = 12; for (let i = 0; i < N; i++){ const [p0, a0, b0] = sec(i/N), [p1, a1, b1] = sec((i+1)/N);
      const C = (p, a, b) => [[p[0] - d[0]*a - n[0]*b, p[1], p[2] - d[1]*a - n[1]*b], [p[0] + d[0]*a - n[0]*b, p[1], p[2] + d[1]*a - n[1]*b], [p[0] + d[0]*a + n[0]*b, p[1], p[2] + d[1]*a + n[1]*b], [p[0] - d[0]*a + n[0]*b, p[1], p[2] - d[1]*a + n[1]*b]];
      const R0 = C(p0, a0, b0), R1 = C(p1, a1, b1); for (let k = 0; k < 4; k++){ const j = (k + 1) % 4; quadP(wh, R0[k], R0[j], R1[j], R1[k]); } }
    { const C = (p, a, b) => [[p[0] - d[0]*a - n[0]*b, p[1], p[2] - d[1]*a - n[1]*b], [p[0] + d[0]*a - n[0]*b, p[1], p[2] + d[1]*a - n[1]*b], [p[0] + d[0]*a + n[0]*b, p[1], p[2] + d[1]*a + n[1]*b], [p[0] - d[0]*a + n[0]*b, p[1], p[2] - d[1]*a + n[1]*b]];
      const R1 = C(topP, 0.9, 1.4); quadP(wh, R1[0], R1[1], R1[2], R1[3]); }
    // pylon foot on the pier below the deck
    segP(B.p(CON), [base[0], -4, base[2]], [base[0], base[1] - 1.9, base[2]], 2.0, 6);
    // stays: anchored up the top third of the pylon, landing on the deck axis (median) every ~22 m of the main span
    const cb = B.p(CAB), ld = B.p(LED);
    for (let k = 0; k < 7; k++){ const t = 0.62 + k*0.055, p = mix(base, topP, t), s = sP - 24 - k*22.5, q = pt(s, 0, yD(s) + 0.3);
      segP(cb, p, q, 0.11, 5); segP(ld, [p[0], p[1] - 0.2, p[2]], [q[0], q[1] + 0.15, q[2]], 0.03, 3); }
    // median strip under the stays
    const md = B.p(WH); for (let s = sP - 182; s < sP + 4; s += 2.5){ const s2 = s + 2.5, y1 = yD(s), y2 = yD(s2); quadP(md, pt(s, -0.7, y1 + 0.25), pt(s2, -0.7, y2 + 0.25), pt(s2, 0.7, y2 + 0.25), pt(s, 0.7, y1 + 0.25)); }
  }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'sgkeppelbaybr', lat:1.26405, lon:103.81415, rot:0});
}

// ======================================================================================================
// Alexandra Arch (2008, Southern Ridges; NLB Infopedia: 80 m long, 4 m wide, steel and granite, designed like an open fig leaf —
// a curved deck meeting an arch tilted at 70 degrees; lighting.co.jp: indirect washes cycling every 20 minutes from warm white
// to sunset orange to midnight blue). Deck = the OSM footway "Alexandra Arch" (the curved span over Alexandra Road and its west
// switchback ramp) at the app's deck heights (6.6 m over the road), hidden under the model and replaced. The white steel arch
// springs from the two ends of the span and leans over the deck (70 degrees from horizontal) towards the outside of the curve,
// with hangers to the deck edge; arch rise above the deck (~11 m) is an ESTIMATE. Granite-clad abutments; Forest Walk (app)
// continues from the east end at 6.6 m.
// ======================================================================================================
{
const LAT = 1.280189, LON = 103.802439, RR = 61;
const SPAN = [[-15.3,-9.6,3.8],[-3.5,-2.1,5.0],[8.3,5.3,6.2],[27.1,14.5,6.6],[39.5,17.6,6.6],[51.9,20.7,6.6]];
const RAMP = [[-23.1,7.6,0.4],[-7.8,11.5,1.8],[-13.8,-0.4,3.0],[-15.3,-9.6,3.8]];
LANDMARKS.sgalexarch = {zh:'亚历山大拱桥', en:'Alexandra Arch', cat:"new", r:RR, h:16, lt:{m:0, c:"#fff2dc", k:0.9, e:0.8, anim:'cycle', c2:'#ff9a4a'}, build(){
  const g = new THREE.Group(), B = mkB();
  const WH = {c:'#f1f1ee', m:0, lk:1.0}, DECK = {c:'#a7a39b', m:0, lk:0.2}, STL = {c:'#d9dbdb', m:0, lk:0.6}, GRA = {c:'#8d8a86', m:0, lk:0.3};
  const RL = {c:'#7c8286', m:0, lk:0.3}, LED = {c:'#f0e6d4', glow:'#ffd9a0', gk:0.8};
  const yG = -0.6, W = 2.0;
  // smoothed centreline with heights
  const path = (Q, k) => { const P = chaikinOpen(Q.map(p => [p[0], p[1]]), k), H = chaikinOpen(Q.map(p => [p[2], 0]), k).map(p => p[0]); return P.map((p, i) => [p[0], H[i] + yG, p[1]]); };
  const deck = (C, cols) => {
    const dk = B.p(DECK), wh = B.p(WH), rl = B.p(RL), ld = B.p(LED), L = [], R = [];
    for (let i = 0; i < C.length; i++){ const a = C[Math.max(0, i - 1)], b = C[Math.min(C.length - 1, i + 1)], dx = b[0] - a[0], dz = b[2] - a[2], l = Math.hypot(dx, dz) || 1, nx = -dz/l, nz = dx/l;
      L.push([C[i][0] + nx*W, C[i][1], C[i][2] + nz*W, nx, nz]); R.push([C[i][0] - nx*W, C[i][1], C[i][2] - nz*W, nx, nz]); }
    for (let i = 0; i < C.length - 1; i++){ const a = L[i], b = L[i+1], c = R[i+1], e = R[i];
      quadP(dk, a, b, c, e); quadP(wh, [a[0], a[1] - 0.9, a[2]], [b[0], b[1] - 0.9, b[2]], [c[0], c[1] - 0.9, c[2]], [e[0], e[1] - 0.9, e[2]]);
      for (const [p, q] of [[a, b], [e, c]]){ quadP(wh, [p[0], p[1] - 0.9, p[2]], [q[0], q[1] - 0.9, q[2]], [q[0], q[1] + 0.1, q[2]], [p[0], p[1] + 0.1, p[2]]);
        quadP(ld, [p[0], p[1] - 0.6, p[2]], [q[0], q[1] - 0.6, q[2]], [q[0], q[1] - 0.45, q[2]], [p[0], p[1] - 0.45, p[2]]); } }
    for (const S of [L, R]){ const top = []; for (let i = 0; i < S.length; i++){ const p = S[i]; if (i % 2 === 0) segP(rl, [p[0], p[1], p[2]], [p[0], p[1] + 1.2, p[2]], 0.04, 4); top.push([p[0], p[1] + 1.2, p[2]]); }
      polyP(B.p(STL), top, 0.06, 4); const mid = S.map(p => [p[0], p[1] + 0.6, p[2]]); polyP(rl, mid, 0.025, 3); }
    return {L, R};
  };
  const CS = path(SPAN, 3), CR = path(RAMP, 2);
  const span = deck(CS); deck(CR);
  // ramp columns and the span's end piers / granite abutments
  { const gr = B.p(GRA); for (let i = 1; i < CR.length - 1; i += 2){ const p = CR[i]; if (p[1] - yG > 0.8) segP(gr, [p[0], yG - 1, p[2]], [p[0], p[1] - 0.9, p[2]], 0.35, 6); }
    for (const p of [CS[0], CS[CS.length - 1]]) boxP(gr, 5.2, p[1] - yG + 0.5, 5.2, p[0], yG - 1.5, p[2], 0); }
  // the tilted arch: springing from the deck ends, its plane leaning 20 degrees off vertical towards the convex (south) side
  { const a = CS[0], b = CS[CS.length - 1], ch = [b[0] - a[0], b[2] - a[2]], cl = Math.hypot(ch[0], ch[1]), cu = [ch[0]/cl, ch[1]/cl], out = [-cu[1], cu[0]];   // out = right of a->b = south side
    const tilt = 20*PI/180, rise = 11.5, st = B.p(WH), hg = B.p(STL), N = 32, pts = [];
    for (let i = 0; i <= N; i++){ const t = i/N, base = [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)], h = rise*Math.sin(PI*t)*(1 - 0.08*Math.pow(Math.sin(PI*t), 6));
      pts.push([base[0] + out[0]*h*Math.sin(tilt), base[1] + h*Math.cos(tilt), base[2] + out[1]*h*Math.sin(tilt)]); }
    // flattened box section: two tubes side by side
    for (const o of [-0.35, 0.35]) polyP(st, pts.map(p => [p[0] + cu[0]*0 - out[1]*0 + out[0]*o*0.2, p[1] + o, p[2] + out[1]*o*0.2]), 0.42, 6);
    // hangers from the arch to the nearer deck edge
    const E = span.L; for (let i = 3; i < N - 2; i += 2){ const p = pts[i]; let best = E[0], bd = 1e9; for (const q of [...span.L, ...span.R]){ const dd = Math.hypot(q[0] - p[0], q[2] - p[2]); if (dd < bd){ bd = dd; best = q; } } segP(hg, p, [best[0], best[1] + 1.2, best[2]], 0.05, 3); }
  }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'sgalexarch', lat:1.280189, lon:103.802439, rot:0});
}

// ======================================================================================================
// Reflections at Bukit Chandu, 31-K Pepys Road (NHB: built 1930 for senior British staff of the Opium Packing Plant, in the style
// of the black-and-white colonial bungalows with art-deco elements; opened 2002 as a WWII interpretive centre on the Battle of
// Pasir Panjang). URA conservation portal: a two-storey Black and White bungalow, symmetrical about the entrance axis; main
// hip-and-gable roof in clay tiles; a front verandah with a full-length open corridor behind it on the upper floor;
// segmental arches on the driveway porch and along the first-storey corridor; timber louvred doors and windows; timber, glass,
// clay tiles and copper. Plan = OSM w121881930 (28.6 x 13.9 m block with the porch projecting 6 m on the south-west front).
// Storey heights are estimates. Night: soft warm floodlight (breathe). No people, no names.
// ======================================================================================================
{
const LAT = 1.279508, LON = 103.794117, RR = 24;
const A0 = [-5.2,-15.8], B0 = [16.2,3.2], C0 = [6.7,13.3];
LANDMARKS.sgbukitchandu = {zh:'鸦片山之役纪念馆', en:'Reflections at Bukit Chandu', cat:'old', r:RR, h:13, lt:{m:0, c:'#ffe3b8', k:0.7, e:0.7, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB();
  const WHT = {c:'#f3f1ea', m:0, lk:0.75}, BLK = {c:'#2a2a2a', m:0, lk:0.1}, TILE = {c:'#9e4e36', m:0, lk:0.3}, WIN = {c:'#3c4247', glow:'#ffd9a6', gk:0.35};
  const BASE = {c:'#a69f90', m:0, lk:0.1}, FL = '#c9c1b0', CU = {c:'#5e8f7e', m:0, lk:0.2};
  const ux = [B0[0] - A0[0], B0[1] - A0[1]], Lu = Math.hypot(ux[0], ux[1]), ax = [ux[0]/Lu, ux[1]/Lu], vx = [C0[0] - B0[0], C0[1] - B0[1]], Lv = Math.hypot(vx[0], vx[1]), av = [vx[0]/Lv, vx[1]/Lv];
  const c = [(A0[0] + C0[0])/2, (A0[1] + C0[1])/2], hu = Lu/2, hv = Lv/2;
  const P = (u, v) => [c[0] + ax[0]*u + av[0]*v, c[1] + ax[1]*u + av[1]*v];            // +v = towards the porch side (south-west)
  const ry = Math.atan2(-ax[1], ax[0]);
  const H1 = 4.2, H2 = 8.0, EV = 8.4, RID = 12.6, VER = 2.4;
  const outer = [P(-hu, -hv), P(hu, -hv), P(hu, hv), P(-hu, hv)], core = [P(-hu, -hv), P(hu, -hv), P(hu, hv - VER), P(-hu, hv - VER)];
  wallP(B.p(BASE), outer, -5, 0.7); flatPoly(B.p(FL), outer, 0.7);
  // white rendered ground floor, black-timber-framed upper floor (the "black and white" look), black string course
  wallP(B.p(WHT), core, 0.7, H1); wallP(B.p(WHT), core, H1, EV);
  edgeBands(B.p(BLK), core, H1 - 0.2, H1 + 0.25, 0.04);
  edgeFins(B.p(BLK), core, H1 + 0.25, EV, 1.6, 0.16, 0.06);
  edgeBands(B.p(BLK), core, EV - 0.45, EV, 0.05);
  for (const [y0, y1] of [[1.3, H1 - 0.7], [H1 + 0.8, EV - 0.8]]) edgeFins(B.p(WIN), core, y0, y1, 2.6, 1.0, 0.07);
  flatPoly(B.p(FL), outer, H1 + 0.02);
  // front verandah: segmental-arched ground-floor corridor, upper open corridor with black posts and balustrade
  { const wh = B.p(WHT), bk = B.p(BLK), nb = 7;
    for (let k = 0; k <= nb; k++){ const u = lerp(-hu + 0.4, hu - 0.4, k/nb), p = P(u, hv - 0.3); boxP(wh, 0.6, H1 - 0.7, 0.6, p[0], 0.7, p[1], ry); boxP(bk, 0.22, EV - H1, 0.22, p[0], H1, p[1], ry); }
    for (let k = 0; k < nb; k++){ const u0 = lerp(-hu + 0.4, hu - 0.4, k/nb), u1 = lerp(-hu + 0.4, hu - 0.4, (k+1)/nb), m = 10;
      for (let i = 0; i < m; i++){ const t0 = i/m, t1 = (i+1)/m, s0 = Math.sin(PI*t0)*0.55, s1 = Math.sin(PI*t1)*0.55;
        const p0 = P(lerp(u0, u1, t0), hv - 0.3), p1 = P(lerp(u0, u1, t1), hv - 0.3);
        quadP(wh, [p0[0], H1 - 1.2 + s0, p0[1]], [p1[0], H1 - 1.2 + s1, p1[1]], [p1[0], H1, p1[1]], [p0[0], H1, p0[1]]); } }
    edgeBands(bk, [P(-hu, hv - 0.3), P(hu, hv - 0.3), P(hu, hv - 0.31), P(-hu, hv - 0.31)], H1 + 0.9, H1 + 1.05, 0);
    for (let k = 0; k <= 40; k++){ const p = P(lerp(-hu, hu, k/40), hv - 0.3); boxP(bk, 0.05, 0.9, 0.05, p[0], H1, p[1], ry); } }
  // the main hip-and-gable roof (clay tiles), copper finials at the corners
  hipP(B.p(TILE), c, ax, hu, hv, EV, RID, 0.9);
  { const gb = B.p(WHT), r0 = Math.max(0, hu - hv);
    for (const s of [-1, 1]){ const t = [c[0] + ax[0]*r0*s, RID, c[1] + ax[1]*r0*s], k = 0.45, q = [P(s*(r0 + hv*k), -hv*k), P(s*(r0 + hv*k), hv*k)];
      const yq = RID - (RID - EV)*k, ap = P(s*(r0 + hv*k), 0), apex = [ap[0], RID, ap[1]], qa = [q[0][0], yq, q[0][1]], qb = [q[1][0], yq, q[1][1]];
      triP(gb, qa, qb, apex); triP(B.p(TILE), t, apex, qa); triP(B.p(TILE), t, qb, apex); } }
  for (const [u, v] of [[-hu - 0.9, -hv - 0.9], [hu + 0.9, -hv - 0.9], [hu + 0.9, hv + 0.9], [-hu - 0.9, hv + 0.9]]){ const p = P(u, v); segP(B.p(CU), [p[0], EV - 0.1, p[1]], [p[0], EV + 0.7, p[1]], 0.07, 4); }
  // the projecting two-storey porch on the axis: segmental driveway arch below, room above, its own gable roof
  { const pu = 5.45, pv0 = hv, pv1 = hv + 6.0, PR = [P(-pu, pv0), P(pu, pv0), P(pu, pv1), P(-pu, pv1)], wh = B.p(WHT), bk = B.p(BLK);
    wallP(B.p(BASE), PR, -5, 0.5); flatPoly(B.p(FL), PR, 0.5);
    for (const s of [-1, 1]) for (const v of [pv0 + 0.5, pv1 - 0.5]){ const p = P(s*(pu - 0.5), v); boxP(wh, 1.0, H1 - 0.5, 1.0, p[0], 0.5, p[1], ry); }
    // segmental arch spandrels on the three open faces
    for (const [u0, u1, v0, v1] of [[-pu, pu, pv1, pv1], [-pu, -pu, pv0, pv1], [pu, pu, pv0, pv1]]){ const m = 12;
      for (let i = 0; i < m; i++){ const t0 = i/m, t1 = (i+1)/m, s0 = Math.sin(PI*t0)*0.9, s1 = Math.sin(PI*t1)*0.9;
        const p0 = P(lerp(u0, u1, t0), lerp(v0, v1, t0)), p1 = P(lerp(u0, u1, t1), lerp(v0, v1, t1));
        quadP(wh, [p0[0], H1 - 1.6 + s0, p0[1]], [p1[0], H1 - 1.6 + s1, p1[1]], [p1[0], H1 + 0.1, p1[1]], [p0[0], H1 + 0.1, p0[1]]); } }
    const UP = [P(-pu, pv0), P(pu, pv0), P(pu, pv1), P(-pu, pv1)];
    flatPoly(B.p(FL), UP, H1 + 0.1); wallP(wh, UP, H1 + 0.1, EV - 0.3); edgeFins(bk, UP, H1 + 0.3, EV - 0.3, 1.4, 0.15, 0.06);
    edgeFins(B.p(WIN), UP, H1 + 0.9, EV - 1.0, 2.2, 0.9, 0.07);
    // gable roof over the porch, ridge across the front
    const ya = EV - 0.3, yr = EV + 3.0, o = 0.6, tl = B.p(TILE);
    const q = (u, v, y) => { const p = P(u, v); return [p[0], y, p[1]]; };
    quadP(tl, q(-pu - o, pv0, ya), q(-pu - o, pv1 + o, ya), q(0, pv1 + o, yr), q(0, pv0, yr));
    quadP(tl, q(pu + o, pv0, ya), q(0, pv0, yr), q(0, pv1 + o, yr), q(pu + o, pv1 + o, ya));
    triP(wh, q(-pu, pv1 + 0.2, ya), q(pu, pv1 + 0.2, ya), q(0, pv1 + 0.2, yr - 0.3));
    for (let k = -3; k <= 3; k++){ const p = q(k*1.2, pv1 + 0.25, ya); segP(bk, p, [p[0], ya + (yr - ya - 0.3)*(1 - Math.abs(k)/4.2), p[2]], 0.06, 4); }
  }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'sgbukitchandu', lat:1.279508, lon:103.794117, rot:0});
}


// ======================================================================================================
// Capella Singapore (Foster + Partners with DP Architects, 2009). fosterandpartners.com: two 1880s Tanah Merah military
// buildings — white, tall pitched terracotta roofs — restored as the resort's gateway; the new hotel extends from both sides of
// them in a continuous plan curving round garden courtyards, its top level with the colonial roofs, under a shallow curved
// roof canopy (which gains an extra storey) that overhangs to shelter the walkways; facades of horizontal brise-soleil in earth
// tones. OSM: w116818220 = the two colonial blocks (with their north porches), w116818069 = Foster's curving wing (the two
// loops), w163201812 = the small round pavilion in the east courtyard (OSM h 6.8). The villas (OSM, unmodelled) stay as they are.
// Colonial blocks: two storeys with verandahs on square piers, hipped roofs; ridge 15.9 m (OSM). Night: warm floodlight
// on the white colonial blocks (breathe), lit rooms in the wing.
// ======================================================================================================
{
const LAT = 1.249698, LON = 103.824432, RR = 100;
const WING = [[-42.9,-17.2],[-44.7,-5.3],[-49.5,-5.9],[-53.1,-4.7],[-59.0,0.0],[-64.4,8.3],[-64.4,13.7],[-63.2,19.6],[-58.5,24.9],[-51.3,27.9],[-44.7,27.3],[-28.0,21.4],[-25.6,22.0],[-7.1,22.6],[8.4,29.7],[16.8,36.2],[19.8,36.8],[31.7,54.6],[37.7,58.7],[44.8,61.1],[52.0,60.5],[57.4,58.2],[62.1,55.2],[65.7,50.4],[68.1,44.5],[68.7,34.4],[63.3,23.8],[58.6,19.6],[58.6,16.6],[50.8,14.3],[53.2,3.0],[62.7,6.0],[72.3,13.1],[78.9,22.0],[82.4,33.2],[82.4,42.1],[80.7,49.9],[77.7,56.4],[72.9,62.9],[67.5,67.6],[60.4,71.8],[47.2,74.8],[40.1,73.6],[32.9,71.2],[21.5,62.9],[8.4,44.5],[0.7,40.4],[-15.5,35.0],[-23.2,34.4],[-29.8,35.6],[-42.3,41.0],[-54.3,41.0],[-65.6,36.8],[-72.2,30.3],[-77.6,17.8],[-77.0,1.8],[-70.4,-7.1],[-62.0,-14.2],[-54.3,-16.6]];
const AXA = 0.1697, AX = [Math.cos(AXA), Math.sin(AXA)];       // long axis of the colonial blocks (u east-south-east)
const U = (u, v) => [u*AX[0] - v*AX[1], u*AX[1] + v*AX[0]];  // block frame -> plan
LANDMARKS.sgcapella = {zh:'嘉佩乐酒店', en:'Capella Singapore', cat:'old', r:RR, h:16, lt:{m:0, c:'#ffe2b8', k:0.75, e:0.6, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB();
  const WHT = {c:'#f2f0e8', m:0, lk:0.8}, TER = {c:'#a5553b', m:0, lk:0.35}, WIN = {c:'#4b545b', glow:'#ffd9a6', gk:0.4}, PIER = {c:'#e9e6dc', m:0, lk:0.7};
  const GLW = {c:'#58676c', m:1, fh:3.6, cw:3.2, lc:'#ffe4c0', lk:0.5}, LOUV = {c:'#9a8467', m:0, lk:0.2}, CAN = {c:'#dcd8cf', m:0, lk:0.35}, SLAB = {c:'#ece9e1', m:0, lk:0.3};
  const BASE = {c:'#a69f90', m:0, lk:0.1}, GRN = {c:'#5d8a4a', m:0, lk:0};
  const yb = -5;
  // ---- the two colonial blocks: [u0, u1, v0, v1] in the block frame, north porches [u0, u1, v0]
  const BLK = [[-45.2, -1.5, -8.5, 10.9, [-28.1, -13.6, -13.3]], [0.5, 52.3, -7.4, 10.4, [20.6, 29.2, -13.4]]];
  const H1 = 4.8, H2 = 9.4, EV = 9.9, RID = 15.9, VER = 2.6;
  for (const [u0, u1, v0, v1, po] of BLK){
    const cu = (u0 + u1)/2, cv = (v0 + v1)/2, hu = (u1 - u0)/2, hv = (v1 - v0)/2, c = U(cu, cv);
    const outer = rectR(c, AX, hu, hv), inner = rectR(c, AX, hu - VER, hv - VER);
    // plinth, core walls (white) with windows, floors, verandah floors
    wallP(B.p(BASE), outer, yb, 0.6); flatPoly(B.p(SLAB), outer, 0.6);
    wallP(B.p(WHT), inner, 0.6, EV); flatPoly(B.p(SLAB), outer, H1 + 0.05);
    edgeBands(B.p(WHT), outer, H1 - 0.35, H1 + 0.35, 0.02);
    // tall windows / french doors on both floors
    for (const [ya, yb2] of [[1.2, H1 - 0.9], [H1 + 0.9, H2 - 0.6]]) edgeFins(B.p(WIN), inner, ya, yb2, 3.2, 1.35, 0.06);
    // verandah piers (ground) and posts (upper), the upper balustrade
    for (let i = 0; i < 4; i++){ const a = outer[i], b = outer[(i+1) % 4], L = Math.hypot(b[0]-a[0], b[1]-a[1]), n = Math.round(L/3.6);
      for (let k = 0; k <= n; k++){ const t = k/n, p = [lerp(a[0], b[0], t), lerp(a[1], b[1], t)], q = [lerp(p[0], c[0], 0.35/hu*0), lerp(p[1], c[1], 0)];
        const ins = [p[0] + (c[0] - p[0])*(0.35/Math.hypot(c[0] - p[0], c[1] - p[1])), p[1] + (c[1] - p[1])*(0.35/Math.hypot(c[0] - p[0], c[1] - p[1]))];
        boxP(B.p(PIER), 0.7, H1 - 0.35, 0.7, ins[0], 0.6, ins[1], Math.atan2(-AX[1], AX[0]));
        boxP(B.p(PIER), 0.4, EV - H1 - 0.35, 0.4, ins[0], H1 + 0.35, ins[1], Math.atan2(-AX[1], AX[0])); } }
    edgeBands(B.p(PIER), rectR(c, AX, hu - 0.35, hv - 0.35), H1 + 0.35, H1 + 1.35, 0);
    edgeBands(B.p(WHT), outer, EV - 0.6, EV, 0.05);
    // the tall hipped terracotta roof over the verandahs (eaves overhang 0.9 m)
    hipP(B.p(TER), c, AX, hu, hv, EV, RID, 0.9);
    // the north porch: two storeys, its own hipped roof
    const [pu0, pu1, pv0] = po, pc = U((pu0 + pu1)/2, (pv0 + v0)/2), phu = (pu1 - pu0)/2, phv = (v0 - pv0)/2;
    const PR = rectR(pc, AX, phu, phv);
    wallP(B.p(BASE), PR, yb, 0.6); flatPoly(B.p(SLAB), PR, 0.6); flatPoly(B.p(SLAB), PR, H1 + 0.05);
    for (const [k, t] of [[0, 0.02], [1, 0.36], [2, 0.64], [3, 0.98]]){ const p = U(lerp(pu0, pu1, t), pv0 + 0.5);
      boxP(B.p(PIER), 0.8, H1 - 0.35, 0.8, p[0], 0.6, p[1], Math.atan2(-AX[1], AX[0])); boxP(B.p(PIER), 0.45, EV - H1 - 0.35, 0.45, p[0], H1 + 0.35, p[1], Math.atan2(-AX[1], AX[0])); }
    edgeBands(B.p(PIER), PR, H1 + 0.35, H1 + 1.35, -0.2);
    hipP(B.p(TER), pc, AX, phu, phv, EV - 0.4, EV + 3.6, 0.6);
  }
  // ---- Foster's wing: four levels (the top one under the curved canopy), glass behind earth-tone brise-soleil bands
  { const P = WING, y0 = 0.6, LV = [0.6, 4.2, 7.8, 11.4], yT = 14.6;
    wallP(B.p(BASE), P, yb, y0); wallP(B.p(GLW), P, y0, yT); flatPoly(B.p(SLAB), P, yT);
    for (const y of LV.slice(1)) edgeBands(B.p(SLAB), P, y - 0.25, y + 0.25, 0.35);
    // brise-soleil: three slender horizontal louvre bands per level, held 0.9 m off the glass
    for (const y of LV) for (const f of [0.95, 1.75, 2.55]) edgeBands(B.p(LOUV), P, y + f, y + f + 0.22, 0.9);
    edgeFins(B.p(LOUV), P, y0, yT, 4.5, 0.12, 1.0);
    // the shallow curved roof canopy: an outset plate on a slight camber, deep fascia, slim columns at the overhang
    const O = offRing(P, 2.2), yc = yT + 0.9;
    flatPoly(B.p(CAN), O, yc + 0.45); wallP(B.p(CAN), O, yc, yc + 0.45); flatPoly(B.p(CAN), O, yc);
    for (let i = 0; i < O.length; i += 2){ const p = O[i]; boxP(B.p(SLAB), 0.3, yc - y0, 0.3, p[0], y0, p[1], 0); }
    // the garden courtyards inside the loops (lawns)
    for (const [c, r] of [[[-58.8, 15.8], 9.5], [[54.5, 39.5], 13.5]]){ const o = B.p(GRN), n = 18; for (let i = 0; i < n; i++){ const a0 = i/n*TAU, a1 = (i+1)/n*TAU;
      triP(o, [c[0], 0.35, c[1]], [c[0] + Math.cos(a1)*r, 0.35, c[1] + Math.sin(a1)*r], [c[0] + Math.cos(a0)*r, 0.35, c[1] + Math.sin(a0)*r]); } }
  }
  // ---- round pavilion in the east courtyard (OSM w163201812, h 6.8)
  { const c = [46.6, 37.4], r = 4.1, n = 16, gl = B.p(GLW), cn = B.p(CAN);
    for (let i = 0; i < n; i++){ const a0 = i/n*TAU, a1 = (i+1)/n*TAU;
      quadP(gl, [c[0] + Math.cos(a0)*r, 0.4, c[1] + Math.sin(a0)*r], [c[0] + Math.cos(a1)*r, 0.4, c[1] + Math.sin(a1)*r], [c[0] + Math.cos(a1)*r, 6.0, c[1] + Math.sin(a1)*r], [c[0] + Math.cos(a0)*r, 6.0, c[1] + Math.sin(a0)*r]);
      triP(cn, [c[0], 6.8, c[1]], [c[0] + Math.cos(a1)*(r + 1.2), 6.0, c[1] + Math.sin(a1)*(r + 1.2)], [c[0] + Math.cos(a0)*(r + 1.2), 6.0, c[1] + Math.sin(a0)*(r + 1.2)]); } }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'sgcapella', lat:1.249698, lon:103.824432, rot:0});
}

// ======================================================================================================
// Singapore Oceanarium (Resorts World Sentosa; opened 2012 as S.E.A. Aquarium, reopened expanded 24 Jul 2025 — wikipedia).
// The hall is the former Maritime Experiential Museum building (Michael Graves with DP Architects, 2011–13: a waterfront form
// "reminiscent of the hull of a ship", its ribbed frame casting dappled light, glassy facades glowing at night — michaelgraves.com,
// e-architect); benoy.com: the 2025 "The Waves" canopy integrates with "the ribbed arches of the Oceanarium's main hall".
// Plan = OSM w171984328 (wikipedia's coordinates fall in it). Modelled: the hull-shaped glazed vault on a solid plinth with
// transverse ribbed arches every 4.5 m, glazed gable ends. Vault crown 21 m: an ESTIMATE (no height published). The Waves canopy
// is left out (its position is not in the data). Night: the glazed vault glows (lit interior), ribs floodlit.
// ======================================================================================================
{
const LAT = 1.258448, LON = 103.820347, RR = 82;
const HALL = [[51.8,23.4],[57.8,54.4],[23.6,69.8],[2.6,43.7],[-14.7,8.1],[-20.6,-28.2],[15.9,-43.6],[35.1,-17.5]];
LANDMARKS.sgoceanarium = {zh:'新加坡海洋馆（原S.E.A.海洋馆）', en:'Singapore Oceanarium (former S.E.A. Aquarium)', cat:'new', r:RR, h:22, lt:{m:0, c:'#e8f2ff', k:0.7, e:0.7}, build(){
  const g = new THREE.Group(), B = mkB();
  const GLS = {c:'#79a3b4', glow:'#9fd6ff', gk:0.42, ds:true}, RIB = {c:'#ecebe6', m:0, lk:0.9}, PL = {c:'#c8bba4', m:0, lk:0.35}, BASE = {c:'#a69f90', m:0, lk:0.1};
  const MUL = {c:'#9aa3a6', m:0, lk:0.2}, DK = '#8f8b84';
  const N0 = [(-20.6 + 15.9)/2, (-28.2 - 43.6)/2], S0 = [(57.8 + 23.6)/2, (54.4 + 69.8)/2];
  const L = Math.hypot(S0[0] - N0[0], S0[1] - N0[1]), d = [(S0[0] - N0[0])/L, (S0[1] - N0[1])/L], n = [-d[1], d[0]], C = [(N0[0] + S0[0])/2, (N0[1] + S0[1])/2];
  // width of the plan across the axis at u (intersection of the cross line with the polygon)
  const span = u => { let lo = 1e9, hi = -1e9; const px = C[0] + d[0]*u, pz = C[1] + d[1]*u;
    for (let i = 0; i < HALL.length; i++){ const a = HALL[i], b = HALL[(i+1) % HALL.length];
      const ax = a[0] - px, az = a[1] - pz, bx = b[0] - px, bz = b[1] - pz, ua = ax*d[0] + az*d[1], ub = bx*d[0] + bz*d[1];
      if ((ua <= 0 && ub >= 0) || (ua >= 0 && ub <= 0)){ const t = Math.abs(ub - ua) < 1e-6 ? 0 : ua/(ua - ub), v = (ax + (bx - ax)*t)*n[0] + (az + (bz - az)*t)*n[1]; lo = Math.min(lo, v); hi = Math.max(hi, v); } }
    return [lo, hi]; };
  const U0 = -L/2 + 0.3, U1 = L/2 - 0.3, YP = 3.2, HC = 21;
  const P = (u, s) => { const [lo, hi] = span(u), v = lerp(lo, hi, (s + 1)/2), w = (hi - lo)/2, e = Math.abs(s);
    const y = YP + (HC - YP)*Math.pow(Math.max(0, 1 - Math.pow(e, 2.4)), 0.55)*(0.82 + 0.18*Math.min(1, w/26));
    return [C[0] + d[0]*u + n[0]*v, y, C[1] + d[1]*u + n[1]*v]; };
  // plinth (the solid base course round the hall) and the floor
  wallP(B.p(BASE), HALL, -5, 0.6); wallP(B.p(PL), HALL, 0.6, YP); flatPoly(B.p(DK), HALL, YP);
  edgeBands(B.p(RIB), HALL, YP - 0.3, YP + 0.2, 0.1);
  // the glazed vault
  { const NU = 40, NV = 24; smoothGrid(g, NU, NV, (i, j) => P(lerp(U0, U1, i/NU), lerp(-1, 1, j/NV)), null, GLS);
    // glazing bars along the vault
    const mu = B.p(MUL); for (let j = 1; j < NV; j += 2){ const pts = []; for (let i = 0; i <= NU; i++) pts.push(P(lerp(U0, U1, i/NU), lerp(-1, 1, j/NV))); polyP(mu, pts, 0.07, 3); } }
  // transverse ribbed arches every 4.5 m, standing proud of the glass
  { const rb = B.p(RIB), nr = Math.round((U1 - U0)/4.5);
    for (let k = 0; k <= nr; k++){ const u = lerp(U0, U1, k/nr), pts = [];
      for (let j = 0; j <= 20; j++){ const p = P(u, lerp(-1, 1, j/20)); const up = j === 0 || j === 20 ? 0 : 0.55; pts.push([p[0], p[1] + up, p[2]]); }
      polyP(rb, pts, 0.32, 4);
      for (const s of [-1, 1]){ const p = P(u, s); segP(rb, [p[0], 0.6, p[2]], [p[0], YP + 0.4, p[2]], 0.45, 4); } } }
  // glazed gable ends with mullions
  { const gl = B.p(GLS), mu = B.p(MUL);
    for (const u of [U0, U1]){ const top = []; for (let j = 0; j <= 20; j++) top.push(P(u, lerp(-1, 1, j/20)));
      const c0 = [C[0] + d[0]*u, YP, C[1] + d[1]*u];
      for (let j = 0; j < 20; j++){ const a = top[j], b = top[j+1]; quadP(gl, [a[0], YP, a[2]], [b[0], YP, b[2]], b, a); }
      for (let j = 2; j < 20; j += 2){ const a = top[j]; segP(mu, [a[0], YP, a[2]], a, 0.12, 4); } } }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'sgoceanarium', lat:1.258448, lon:103.820347, rot:0});
}

// ======================================================================================================
// Palawan Beach: the rope suspension bridge to the islet and its two lookout towers (wikipedia Pulau Palawan: a simple
// suspension bridge links the islet, which has two lookout towers; atlasobscura: two large wooden towers joined by a walkway,
// viewing decks over the Singapore Strait). Bridge = the OSM footway line (89 m) from the beach to the islet; towers = the OSM
// footprint w163201852 (two ~10.7 m squares joined by a narrow link). Timber posts and planked deck hung from sagging main
// ropes with hangers and rope side-nets; the towers as two-level timber frames with viewing decks, the link walkway at the
// upper deck and pyramid roofs — tower deck heights (3.6 / 7.2 m) and roof apex (11.5 m) are ESTIMATES (none published).
// ======================================================================================================
{
const LAT = 1.248374, LON = 103.821745, RR = 80;
const BA = [32.2, -31.0], BI = [-32.2, 31.0];
const SQ = [[[-50.8,44.0],[-59.1,37.5],[-52.5,29.2],[-44.2,36.3]], [[-36.4,38.7],[-28.1,45.8],[-34.6,54.1],[-43.0,47.0]]];
LANDMARKS.sgpalawanbr = {zh:'巴拉湾吊桥与瞭望塔', en:'Palawan Beach suspension bridge & lookout towers', cat:'new', r:RR, h:12, lt:{m:0, c:'#ffd9a0', k:0.5, e:0.8}, build(){
  const g = new THREE.Group(), B = mkB(), r = LMCTX.rng;
  const TIM = {c:'#8b6b49', m:0, lk:0.3}, TIM2 = {c:'#6f553b', m:0, lk:0.2}, ROPE = {c:'#c2ad86', m:0, lk:0.2}, NET = {c:'#b7a27c', op:0.55, ds:true};
  const ROOF = {c:'#5e4b3a', m:0, lk:0.1}, SAND = {c:'#d8cba8', m:0, lk:0}, LAMP = {c:'#ffe2b0', glow:'#ffcf80', gk:1.2};
  // ---- the bridge
  const L = Math.hypot(BI[0] - BA[0], BI[1] - BA[1]), d = [(BI[0] - BA[0])/L, (BI[1] - BA[1])/L], n = [-d[1], d[0]];
  const S0 = 2.5, S1 = L - 2.5, YE = 1.7, SAG = 0.7, W = 0.85;
  const at = (s, w, y) => [BA[0] + d[0]*s + n[0]*w, y, BA[1] + d[1]*s + n[1]*w];
  const deckY = s => YE - SAG*(1 - Math.pow((2*(s - S0)/(S1 - S0) - 1), 2));
  { const tm = B.p(TIM), t2 = B.p(TIM2), rp = B.p(ROPE), nt = B.p(NET);
    // planks and the two stringers
    for (let s = S0; s < S1 - 0.2; s += 0.55){ const y = deckY(s + 0.2); boxP(tm, 0.42, 0.08, 2*W + 0.2, ...[at(s + 0.2, 0, 0)[0]], y - 0.08, at(s + 0.2, 0, 0)[2], Math.atan2(-d[1], d[0])); }
    for (const w of [-W, W]){ const pts = []; for (let s = S0; s <= S1 + 0.01; s += 2) pts.push(at(s, w, deckY(s) - 0.12)); polyP(t2, pts, 0.1, 4); }
    // posts (a pair at each end), main ropes, hand ropes, hangers, side nets
    const PH = 4.2;
    for (const s of [S0 - 0.6, S1 + 0.6]) for (const w of [-W - 0.25, W + 0.25]){ const p = at(s, w, 0); segP(tm, [p[0], -1.5, p[2]], [p[0], YE + PH, p[2]], 0.2, 6); }
    for (const s of [S0 - 0.6, S1 + 0.6]) segP(t2, at(s, -W - 0.25, YE + PH - 0.3), at(s, W + 0.25, YE + PH - 0.3), 0.12, 4);
    for (const w of [-W - 0.15, W + 0.15]){
      const main = [], hand = [];
      for (let k = 0; k <= 40; k++){ const s = lerp(S0 - 0.6, S1 + 0.6, k/40), t = 2*k/40 - 1; main.push(at(s, w, YE + PH - 0.2 - (PH - 1.45)*(1 - t*t))); hand.push(at(s, w, deckY(Math.min(S1, Math.max(S0, s))) + 1.05)); }
      polyP(rp, main, 0.05, 3); polyP(rp, hand, 0.04, 3);
      for (let k = 1; k < 40; k++){ const a = main[k], s = lerp(S0 - 0.6, S1 + 0.6, k/40); if (s < S0 || s > S1) continue; segP(rp, [a[0], deckY(s), a[2]], a, 0.02, 3); }
      for (let k = 0; k < 40; k++){ const s0 = lerp(S0 - 0.6, S1 + 0.6, k/40), s1 = lerp(S0 - 0.6, S1 + 0.6, (k+1)/40); if (s0 < S0 || s1 > S1) continue;
        quadP(nt, at(s0, w, deckY(s0)), at(s1, w, deckY(s1)), hand[k+1], hand[k]); } }
    // landing platforms and the ground anchors
    for (const [s, dir] of [[S0, -1], [S1, 1]]){ const c = at(s + dir*1.4, 0, 0); boxP(tm, 2.6, YE + 1.5, 2.6, c[0], -1.5, c[2], Math.atan2(-d[1], d[0])); }
    // two lanterns at the bridge heads
    for (const s of [S0 - 0.6, S1 + 0.6]) for (const w of [-W - 0.25, W + 0.25]){ const p = at(s, w, YE + PH); boxP(B.p(LAMP), 0.3, 0.4, 0.3, p[0], p[1], p[2], 0); }
  }
  // ---- the islet pad under the towers and the two lookout towers with the link walkway
  { const all = [...SQ[0], ...SQ[1]], c = cen(all);
    const pad = []; for (let i = 0; i < 20; i++){ const a = i/20*TAU; let R = 0; for (const p of all) R = Math.max(R, (p[0] - c[0])*Math.cos(a) + (p[1] - c[1])*Math.sin(a)); pad.push([c[0] + Math.cos(a)*(R + 4), c[1] + Math.sin(a)*(R + 4)]); }
    wallP(B.p(SAND), pad, -1.5, 0.15); flatPoly(B.p(SAND), pad, 0.15);
    const YD = [0.5, 3.6, 7.2], YR = 9.9, YA = 11.5;
    for (const Q of SQ){
      const qc = cen(Q), ax0 = [Q[1][0] - Q[0][0], Q[1][1] - Q[0][1]], ql = Math.hypot(ax0[0], ax0[1]), ax = [ax0[0]/ql, ax0[1]/ql], ry = Math.atan2(-ax[1], ax[0]);
      const hs = 5.1, inner = rectR(qc, ax, hs, hs);
      // posts: corners and mid-sides
      for (let i = 0; i < 4; i++){ const a = inner[i], b = inner[(i+1) % 4];
        for (const t of [0, 0.5]){ const p = [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]; boxP(B.p(TIM), 0.35, YR, 0.35, p[0], 0, p[1], ry); } }
      // decks with railings, cross bracing
      for (const y of YD){ const o = B.p(TIM2); boxP(o, 2*hs, 0.2, 2*hs, qc[0], y - 0.2, qc[1], ry);
        if (y > 1){ edgeBands(B.p(TIM), inner, y + 0.95, y + 1.1, 0.02); edgeFins(B.p(TIM), inner, y, y + 1.0, 1.0, 0.07, 0.07); } }
      for (let i = 0; i < 4; i++){ const a = inner[i], b = inner[(i+1) % 4]; segP(B.p(TIM2), [a[0], 0.6, a[1]], [b[0], YD[1] - 0.2, b[1]], 0.08, 4); segP(B.p(TIM2), [b[0], 0.6, b[1]], [a[0], YD[1] - 0.2, a[1]], 0.08, 4); }
      // stair flights along one side
      { const s0 = [qc[0] + ax[0]*-3.8 + -ax[1]*3.4, qc[1] + ax[1]*-3.8 + ax[0]*3.4];
        for (let k = 0; k < 14; k++){ const t = k/14; boxP(B.p(TIM2), 0.3, 0.12, 1.1, s0[0] + ax[0]*t*6.5, YD[0] + t*(YD[1] - YD[0]), s0[1] + ax[1]*t*6.5, ry); }
        for (let k = 0; k < 14; k++){ const t = k/14; boxP(B.p(TIM2), 0.3, 0.12, 1.1, s0[0] + ax[0]*(6.5 - t*6.5), YD[1] + t*(YD[2] - YD[1]), s0[1] + ax[1]*(6.5 - t*6.5) - 0*ax[0], ry); } }
      // pyramid roof
      { const o = B.p(ROOF), R = rectR(qc, ax, hs + 0.9, hs + 0.9), apex = [qc[0], YA, qc[1]];
        for (let i = 0; i < 4; i++){ const a = R[i], b = R[(i+1) % 4]; triP(o, [a[0], YR, a[1]], [b[0], YR, b[1]], apex); } }
      boxP(B.p(LAMP), 0.3, 0.3, 0.3, qc[0], YR - 0.6, qc[1], 0);
    }
    // the link walkway between the towers at the upper deck
    { const a = cen(SQ[0]), b = cen(SQ[1]); barP(B.p(TIM2), a, b, 2.2, 0.25, YD[2] - 0.25);
      for (const s of [-1, 1]){ const dd = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(dd[0], dd[1]), nn = [-dd[1]/l*1.1*s, dd[0]/l*1.1*s];
        segP(B.p(TIM), [a[0] + nn[0], YD[2] + 1.05, a[1] + nn[1]], [b[0] + nn[0], YD[2] + 1.05, b[1] + nn[1]], 0.06, 4); } }
  }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'sgpalawanbr', lat:1.248374, lon:103.821745, rot:0});
}

}
