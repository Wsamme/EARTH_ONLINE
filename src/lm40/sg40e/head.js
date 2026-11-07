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
