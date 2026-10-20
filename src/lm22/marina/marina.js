// ===== City Brush v24, wave 3 group "marina" — Marina Bay waterfront landmarks upgraded =====
// mbs, artscience, helix, flyer, esplanade, merlion. Started from lm18/f1 (and main17 for artscience) and upgraded.
// Block-scoped: only LANDMARKS and SG_PLACES are touched. Real dimensions in metres; y = 0 is the model base.
{
const PI = Math.PI, HP = PI/2, TAU = PI*2;
const lerp = (a, b, t) => a + (b - a)*t;
const clamp01 = t => t < 0 ? 0 : t > 1 ? 1 : t;
const add = (a, b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]], sub = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]], mul = (a, s) => [a[0]*s, a[1]*s, a[2]*s];
const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2], cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const vlen = a => Math.hypot(a[0], a[1], a[2]), nrm = a => { const l = vlen(a) || 1; return [a[0]/l, a[1]/l, a[2]/l]; };
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
}
const polyP = (o, pts, r, n, closed) => { for (let i = 0; i < pts.length - 1; i++) segP(o, pts[i], pts[i+1], r, n); if (closed) segP(o, pts[pts.length-1], pts[0], r, n); };
// box (w along x, d along z) standing on y, turned ry
const boxP = function(o, w, h, d, x, y, z, ry){
  const c = Math.cos(ry || 0), s = Math.sin(ry || 0), hw = w/2, hd = d/2, y1 = y + h;
  const ax = x - hw*c - hd*s, az = z + hw*s - hd*c, bx = x + hw*c - hd*s, bz = z - hw*s - hd*c, cx = x + hw*c + hd*s, cz = z - hw*s + hd*c, dx = x - hw*c + hd*s, dz = z + hw*s + hd*c;
  o.push(ax, y, az, bx, y, bz, cx, y, cz, ax, y, az, cx, y, cz, dx, y, dz,
    ax, y1, az, dx, y1, dz, cx, y1, cz, ax, y1, az, cx, y1, cz, bx, y1, bz,
    ax, y, az, ax, y1, az, bx, y1, bz, ax, y, az, bx, y1, bz, bx, y, bz,
    bx, y, bz, bx, y1, bz, cx, y1, cz, bx, y, bz, cx, y1, cz, cx, y, cz,
    cx, y, cz, cx, y1, cz, dx, y1, dz, cx, y, cz, dx, y1, dz, dx, y, dz,
    dx, y, dz, dx, y1, dz, ax, y1, az, dx, y, dz, ax, y1, az, ax, y, az);
}
// smooth parametric surface f(u, v) -> [x, y, z] as one indexed (smooth-shaded) mesh
const surf = function(g, nu, nv, f, col){
  const P = [], I = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) P.push(...f(i/nu, j/nv));
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++){ const a = j*(nu+1) + i, b = a + 1, c = a + nu + 2, d = a + nu + 1; I.push(a, b, c, a, c, d); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setIndex(I); geo.computeVertexNormals();
  return lmAdd(g, geo, typeof col === 'string' ? {c:col, ds:true} : Object.assign({ds:true}, col), 0, 0, 0);
}
const capP = (o, loop, c) => { if (!c){ c = [0, 0, 0]; for (const p of loop){ c[0] += p[0]/loop.length; c[1] += p[1]/loop.length; c[2] += p[2]/loop.length; } } for (let i = 0; i < loop.length; i++) o.push(...c, ...loop[i], ...loop[(i+1) % loop.length]); };
// low-poly ball into a batch, round-headed tree, palm
const ICO = (() => { const P = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]], F = [[0,2,4],[4,2,1],[1,2,5],[5,2,0],[4,3,0],[1,3,4],[5,3,1],[0,3,5]], out = [];
  for (const [a, b, d] of F){ const A = P[a], Bv = P[b], D = P[d], ab = nrm(mix(A, Bv, 0.5)), bd = nrm(mix(Bv, D, 0.5)), da = nrm(mix(D, A, 0.5));
    for (const t of [[A, ab, da], [ab, Bv, bd], [da, bd, D], [ab, bd, da]]) for (const v of t) out.push(v[0], v[1], v[2]); } return out; })();
const ico = function(o, c, rx, ry){ for (let i = 0; i < ICO.length; i += 3) o.push(c[0] + ICO[i]*rx, c[1] + ICO[i+1]*ry, c[2] + ICO[i+2]*rx); }
const treeP = function(B, x, y, z, s, r, trunkC, leafC){ segP(B.p(trunkC), [x, y, z], [x, y + 2.6*s, z], 0.22*s, 5); const k = 2.1*s*(0.85 + 0.3*r()); ico(B.p(leafC), [x, y + 3.6*s, z], k, k*0.8); }
const palm = function(B, x, y, z, h, r, trunkC, leafC){
  const lean = (r() - 0.5)*0.5, la = r()*TAU, top = [x + Math.cos(la)*lean*h*0.25, y + h, z + Math.sin(la)*lean*h*0.25];
  segP(B.p(trunkC), [x, y, z], top, 0.28, 5, 0.2);
  const o = B.p(leafC), nf = 7;
  for (let i = 0; i < nf; i++){ const a = i/nf*TAU + r(), L = 2.6 + r()*1.4, ca = Math.cos(a), sa = Math.sin(a);
    const m = [top[0] + ca*L*0.55, top[1] + 0.5, top[2] + sa*L*0.55], e = [top[0] + ca*L, top[1] - 1.1, top[2] + sa*L], w = 0.55;
    triP(o, top, [m[0] - sa*w, m[1], m[2] + ca*w], e); triP(o, top, e, [m[0] + sa*w, m[1], m[2] - ca*w]); }
}
// ---- plan helpers (local [x, z] points)
const toXZ = (F, OE, ON) => { const P = []; for (let i = 0; i < F.length; i += 2) P.push([F[i] - OE, ON - F[i+1]]); return P; };
const pip = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0]-a[0])*(z-a[1])/(b[1]-a[1]) + a[0]) c = !c; } return c; };
const cen = P => { let x = 0, z = 0; for (const p of P){ x += p[0]; z += p[1]; } return [x/P.length, z/P.length]; };
const perim = P => { let L = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; L += Math.hypot(b[0]-a[0], b[1]-a[1]); } return L; };
const chaikin = (P, k) => { for (let it = 0; it < k; it++){ const Q = []; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; Q.push([a[0]*0.75 + b[0]*0.25, a[1]*0.75 + b[1]*0.25], [a[0]*0.25 + b[0]*0.75, a[1]*0.25 + b[1]*0.75]); } P = Q; } return P; };
const resample = function(P, n){
  const seg = []; let L = 0;
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], l = Math.hypot(b[0]-a[0], b[1]-a[1]); seg.push([a, b, L, l]); L += l; }
  const out = []; let j = 0;
  for (let k = 0; k < n; k++){ const s = k*L/n; while (j < seg.length - 1 && seg[j][2] + seg[j][3] < s) j++; const [a, b, s0, l] = seg[j], t = l > 0 ? clamp01((s - s0)/l) : 0; out.push([a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t]); }
  return out;
}
// outward unit normal of edge i of plan P (tested against the polygon, so concave plans work)
const edgeN = function(P, i){ const a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], L = Math.hypot(ex, ez) || 1; let nx = ez/L, nz = -ex/L; const mx = (a[0]+b[0])/2, mz = (a[1]+b[1])/2; if (pip(P, mx + nx*0.25, mz + nz*0.25)){ nx = -nx; nz = -nz; } return [nx, nz, L, mx, mz]; }
// vertical bands along the edges of plan P, `off` outside the wall, y0..y1; skip(mx, mz, nx, nz) drops an edge
const edgeBands = function(o, P, y0, y1, off, skip){
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], [nx, nz, L, mx, mz] = edgeN(P, i); if (L < 0.6 || (skip && skip(mx, mz, nx, nz))) continue;
    quadP(o, [a[0]+nx*off, y0, a[1]+nz*off], [b[0]+nx*off, y0, b[1]+nz*off], [b[0]+nx*off, y1, b[1]+nz*off], [a[0]+nx*off, y1, a[1]+nz*off]); }
}
// vertical fins / mullions along the edges of P every sp metres
const edgeFins = function(o, P, y0, y1, sp, w, d, skip){
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], [nx, nz, L, mx, mz] = edgeN(P, i); if (L < 2 || (skip && skip(mx, mz, nx, nz))) continue;
    const n = Math.max(1, Math.round(L/sp)), ry = Math.atan2(-(b[1]-a[1]), b[0]-a[0]);
    for (let k = 0; k <= n; k++){ const t = k/n; boxP(o, w, y1 - y0, d, a[0] + (b[0]-a[0])*t + nx*d/2, y0, a[1] + (b[1]-a[1])*t + nz*d/2, ry); } }
}
// flat polygon at height y (fan from the centroid; convex / star-shaped plans only)
const flatP = function(o, P, y){ const c = cen(P); for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; triP(o, [c[0], y, c[1]], [b[0], y, b[1]], [a[0], y, a[1]]); } }


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
}
// prism ring band (outer ring O, inner ring I, same count) between y0 and y1: outer face, top and soffit
const bandRing = function(o, O, I, y0, y1){ const n = O.length; for (let i = 0; i < n; i++){ const j = (i+1) % n, a = O[i], b = O[j], c = I[j], d = I[i];
  quadP(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); quadP(o, [a[0], y1, a[1]], [b[0], y1, b[1]], [c[0], y1, c[1]], [d[0], y1, d[1]]); quadP(o, [d[0], y0, d[1]], [c[0], y0, c[1]], [b[0], y0, b[1]], [a[0], y0, a[1]]); } }
// ======================================================================================================
// Esplanade – Theatres on the Bay (Michael Wilford & Partners / DP Architects, 2002). Remade on the real footprints:
// the Concert Hall shell (south-west, ~96 x 73 m, ~37 m) and the Theatre shell (north, the 107 m 'teardrop', ~44 m) — glass
// space frames clad in some 7,000 triangular aluminium sunshades —, the podium between and round them (mall, studios, the round
// forecourt), the Annexe, the DBS Foundation Outdoor Theatre on its promontory with the amphitheatre steps, the waterfront
// promenade, Makansutra Gluttons Bay and the Singtel Waterfront Theatre (2022). rot 0: local +x east, +z south.
// The site steps down from the podium level (y = 0) to the promenade (y = -3.4), which sits on the real waterfront ground.
// ======================================================================================================
{
const OE = 10, ON = 0;   // model origin (E, N) relative to the reference anchor 1.289478 N, 103.856014 E
const X = F => toXZ(F, OE, ON);
const CH = [-78.3,-36.4,-102.8,-47.1,-110.6,-48.3,-118.3,-47.7,-125.5,-45.3,-133.3,-37.6,-137.4,-31.7,-140.4,-19.8,-139.8,-9.1,-136.2,-0.8,-130.3,8.1,-119.5,13.4,-71.2,24.7,-63.4,24.7,-58,22.3,-52.7,14.6,-48.5,6.9,-44.3,-6.2,-44.3,-13.3,-47.3,-21,-51.5,-26.3];
const TH = [-63.4,32.4,-92.1,95.8,-92.1,105.3,-88.5,114.2,-84.3,121.3,-77.7,129,-69.4,132,-59.2,133.8,-49.7,132.6,-40.1,127.3,-33.6,120.7,-29.4,110.6,-22.2,87.5,-13.9,53.7,-13.9,47.2,-16.3,43,-18.6,40.1,-27.6,33.6,-37.1,29.4,-48.5,27,-57.4,28.2];
const POD = [13.6,-25.7,6.4,-14.5,9.4,-12.1,12.4,-8.5,13,-4.4,11.8,0.9,6.4,6.3,-0.1,7.5,-6.7,5.1,-10.3,-0.8,-10.9,-5,-8.5,-11.5,-4.9,-13.9,-13.3,-23.4,-24.6,-22.2,-25.8,-29.9,-28.2,-36.4,-35.4,-44.7,-44.9,-49.5,-51.5,-50.7,-59.2,-50.7,-62.8,-49.5,-72.4,-44.1,-75.4,-47.1,-81.3,-41.8,-77.1,-38.8,-78.3,-36.4,-51.5,-26.3,-47.3,-21,-44.3,-13.3,-44.3,-6.2,-48.5,6.9,-52.7,14.6,-58,22.3,-63.4,24.7,-71.2,24.7,-119.5,13.4,-118.3,29.4,-114.8,41.9,-108.2,54.9,-101,66.2,-85.5,81.6,-63.4,32.4,-57.4,28.2,-48.5,27,-37.1,29.4,-27.6,33.6,-18.6,40.1,-13.9,47.2,-13.9,53.7,-22.2,87.5,-8.5,91.7,-3.7,76.8,2.3,76.8,12.4,73.3,14.2,76.8,23.7,72.7,32.7,65.6,37.5,60.2,41.7,53.7,45.2,43,45.8,35.3,42.9,35.3,39.9,-28.1];
const ANX = [39.9,-28.1,42.3,24.7,50.6,24.1,47,-29.3,50,-33.5,54.2,-34,57.2,-31.7,61.4,18.1,85.8,17,82.9,-32.3,67.9,-31.1,64.3,-37.6,57.8,-42.4,51.2,-44.1,42.9,-40,38.1,-32.3,37.5,-28.1];
const OUT = [-10.3,-82.1,-16.8,-75,-16.3,-71.4,-11.5,-68.4,-17.4,-61.3,-25.8,-56,-18,-50.7,-4.3,-48.3,8.2,-48.9,14.2,-50.7,20.8,-54.2,23.7,-58.4,18.4,-61.3,10,-69.6,12.4,-70.8,16,-75,16,-77.9,11.2,-82.1,7,-83.9,-2.5,-84.5];
const SWT = [166.4,-26.9,164,-56,94.8,-51.2,97.2,-22.2];
const GB1 = [134.8,-18.6,104.9,-16.9,107.9,18.1,137.2,16.4], GB2 = [101.4,-16.9,96.6,-16.3,99,13.4,104.3,12.8];
// the real bay edge in front (E, N), west to east, including the round promontory of the Outdoor Theatre
const SHORE = [-136,-63.8, -112.3,-64.2, -32,-67.2, -26.5,-74.7, -29.5,-78.4, -21,-84.9, -15.8,-87.9, -7.3,-90.9, 1.2,-91.7, 8.7,-90.9, 16.2,-89.2, 22.7,-85.7, 28.2,-82.2, 25.7,-77.9, 33.2,-70.4, 160,-78.5];
LANDMARKS.esplanade = {zh:'滨海艺术中心', en:'Esplanade – Theatres on the Bay', cat:'new', r:172, h:46, water:true, lt:{m:0, c:'#ffc888', k:0.9, e:0.5, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB(), r = LMCTX.rng;
  // every colour is a double-sided spec so that solids and triangle batches of one colour share a material (16 in all)
  const GLS = {c:'#66727a', glow:'#ffb25e', gk:0.62, ds:true}, SHD = {c:'#c6c2b6', m:0, lc:'#ffcf8f', lk:0.55, ds:true}, STONE = {c:'#d3cab8', ds:true}, STONE2 = {c:'#bdb4a2', ds:true};
  const PGL = {c:'#5b6a72', glow:'#ffd29a', gk:0.6, ds:true}, PAVE = {c:'#cbc3b1', ds:true}, TRIM = {c:'#ebe7de', ds:true}, GREEN = {c:'#6f9a58', ds:true}, LEAF = {c:'#55803f', ds:true}, TRUNK = {c:'#6a5a48', ds:true};
  const CAN = {c:'#767c81', m:0, lc:'#cfe0ff', lk:0.45, glow:'#ffd6a0', gk:0.25, ds:true}, LAMP = {c:'#f0ead8', glow:'#ffe2a8', gk:1.2, ds:true}, FIN = {c:'#9a8468', ds:true}, QUAY = STONE2;
  const ROOFC = {c:'#a7a399', ds:true}, STEELC = {c:'#4d5256', ds:true}, DARKW = {c:'#6f6a62', ds:true};
  const YP = -3.4;   // promenade level (the real waterfront ground)
  const pCH = X(CH), pTH = X(TH), pPOD = X(POD), pANX = X(ANX), pOUT = X(OUT), pSWT = X(SWT), pGB1 = X(GB1), pGB2 = X(GB2), shore = X(SHORE);
  const inShell = (x, z) => pip(pCH, x, z) || pip(pTH, x, z);

  // ---- the two shells: glass space frame + aluminium sunshades, on a stone plinth
  const shell = (ring, apexEN, H, P, Q) => {
    const R = resample(chaikin(ring, 2), 132), n = R.length, A = [apexEN[0] - OE, ON - apexEN[1]];
    const prof = v => H*Math.pow(Math.max(0, 1 - Math.pow(v, P)), Q);
    const rimAt = u => { const f = (((u % 1) + 1) % 1)*n, i = Math.floor(f), t = f - i, a = R[i % n], b = R[(i+1) % n]; return [a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t]; };
    const S = (u, v) => { const q = rimAt(u); return [A[0] + (q[0]-A[0])*v, prof(v), A[1] + (q[1]-A[1])*v]; };
    surf(g, n, 34, (u, v) => S(u, 1 - Math.pow(1 - v, 1.7)), GLS);
    // plinth and the glazed foyer band at the foot of the shell
    const pl = B.p(STONE), fg = B.p(PGL);
    for (let i = 0; i < n; i++){ const a = R[i], b = R[(i+1) % n];
      quadP(pl, [a[0], -5, a[1]], [b[0], -5, b[1]], [b[0], 0.05, b[1]], [a[0], 0.05, a[1]]); }
    // sunshades in rows of equal spacing along the meridians
    let Rm = 0; for (const q of R) Rm += Math.hypot(q[0]-A[0], q[1]-A[1])/n;
    const NT = 500, sv = [0]; for (let k = 1; k <= NT; k++) sv.push(sv[k-1] + Math.hypot(Rm/NT, prof(k/NT) - prof((k-1)/NT)));
    const per = perim(R), rowSp = 1.75, colSp = 1.95, sh = B.p(SHD), nRows = Math.floor(sv[NT]/rowSp);
    for (let j = 1; j < nRows; j++){
      const s = j*rowSp; let k = 1; while (k < NT && sv[k] < s) k++;
      const v = (k - 1 + (s - sv[k-1])/Math.max(1e-6, sv[k] - sv[k-1]))/NT; if (v > 0.994) break;
      const cnt = Math.max(5, Math.round(per*v/colSp));
      const y = prof(v), dy = -H*Q*Math.pow(Math.max(1e-6, 1 - Math.pow(v, P)), Q - 1)*P*Math.pow(v, P - 1);
      for (let i = 0; i < cnt; i++){
        // point on the shell and its local frame (row tangent tu, downslope tv, outward normal), allocation-light
        const u = (i + 0.5*(j % 2) + (r() - 0.5)*0.12)/cnt, f = (((u % 1) + 1) % 1)*n, k0 = Math.floor(f), tt = f - k0, qa = R[k0 % n], qb = R[(k0 + 1) % n];
        const qx = qa[0] + (qb[0]-qa[0])*tt, qz = qa[1] + (qb[1]-qa[1])*tt, px = A[0] + (qx - A[0])*v, pz = A[1] + (qz - A[1])*v;
        let ux = qb[0]-qa[0], uz = qb[1]-qa[1]; const ul = Math.hypot(ux, uz) || 1; ux /= ul; uz /= ul;
        let vx = qx - A[0], vy = dy, vz = qz - A[1]; const vl = Math.hypot(vx, vy, vz) || 1; vx /= vl; vy /= vl; vz /= vl;
        let nx = -uz*vy, ny = uz*vx - ux*vz, nz = ux*vy;              // tu x tv with tu = (ux, 0, uz)
        { const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl; }
        if (nx*(px - A[0]) + ny*(y - H*0.25) + nz*(pz - A[1]) < 0){ nx = -nx; ny = -ny; nz = -nz; }
        const w = colSp*0.43, dd = rowSp*0.95, hh = 0.32 + 1.05*(1 - Math.abs(ny)) + r()*0.15;
        const ax = px - ux*w, az = pz - uz*w, bx = px + ux*w, bz = pz + uz*w;
        const cx = px + vx*dd + nx*0.05, cy = y + vy*dd + ny*0.05, cz = pz + vz*dd + nz*0.05;
        const tx = px + vx*dd*0.62 + nx*hh, ty = y + vy*dd*0.62 + ny*hh, tz = pz + vz*dd*0.62 + nz*hh;
        sh.push(ax, y, az, bx, y, bz, tx, ty, tz,  ax, y, az, tx, ty, tz, cx, cy, cz,  bx, y, bz, cx, cy, cz, tx, ty, tz);
      }
    }
    // the low glazed foyer ring at the foot (sunshades stop above it)
    for (let i = 0; i < n; i += 1){ const a = S(i/n, 0.995), b = S((i+1)/n, 0.995); quadP(fg, [a[0], 0.05, a[2]], [b[0], 0.05, b[2]], [b[0], Math.min(4.5, b[1]), b[2]], [a[0], Math.min(4.5, a[1]), a[2]]); }
    // the steel Y-columns round the foot of the shell, carrying the space frame over the glazed foyer
    { const yc = B.p(STEELC), nY = Math.round(perim(R)/8.5);
      for (let k = 0; k < nY; k++){ const u = (k + 0.5)/nY, q = S(u, 1), c = S(u, 0.97), b = [q[0] + (c[0] - q[0])*0.3, 0.05, q[2] + (c[2] - q[2])*0.3], m = [b[0] + (c[0] - q[0])*0.25, 3.4, b[2] + (c[2] - q[2])*0.25];
        if (pip(pPOD, q[0] - (c[0] - q[0])*0.6, q[2] - (c[2] - q[2])*0.6) || pip(pANX, q[0] - (c[0] - q[0])*0.6, q[2] - (c[2] - q[2])*0.6)) continue;
        segP(yc, b, m, 0.32, 6, 0.26); for (const d of [-0.5, 0.5]) segP(yc, m, S(u + d/nY, 0.986), 0.22, 5, 0.18); } }
  };
  shell(pCH, [-94, -11], 37, 2.3, 0.5);
  shell(pTH, [-60, 96], 44, 2.2, 0.5);

  // ---- the podium (mall, studios, foyers) round the shells, with the round forecourt; the Annexe
  const skipPod = (x, z, nx, nz) => inShell(x + nx*1.2, z + nz*1.2);
  LPoly(g, pPOD, -5, 19.4, STONE); LPoly(g, pPOD, 14.4, 0.1, ROOFC);
  LPoly(g, pANX, -5, 14.9, STONE); LPoly(g, pANX, 9.9, 0.1, ROOFC);
  const pg = B.p(PGL), st2 = B.p(STONE2), tr = B.p(TRIM);
  for (const [P, top] of [[pPOD, 14.5], [pANX, 10]]){
    edgeBands(pg, P, 0.2, 5.2, 0.12, skipPod);                       // shopfronts / foyer glazing
    edgeBands(tr, P, 5.2, 5.9, 0.2, skipPod);                        // canopy fascia
    edgeBands(pg, P, 7.4, top - 2.6, 0.1, skipPod);                  // upper ribbon windows
    edgeFins(tr, P, 7.4, top - 2.6, 3.2, 0.3, 0.35, skipPod);        // mullions
    edgeBands(st2, P, top - 0.6, top + 0.9, 0.15, skipPod);           // parapet band
    edgeBands(st2, P, -5, 0.2, 0.08, skipPod);                       // plinth course
  }
  // roof terrace on the mall: planting beds, trees and a pergola (east part of the podium roof)
  { const gr = B.p(GREEN); for (const [x0, z0, w, d] of [[-8, -62, 24, 10], [10, -54, 18, 12], [24, -36, 14, 16], [-28, -44, 12, 10], [-2, -40, 9, 9]]){ const P = [[x0, z0], [x0 + w, z0], [x0 + w, z0 + d], [x0, z0 + d]];
      if (P.every(p => pip(pPOD, p[0], p[1]))){ boxP(gr, w, 0.7, d, x0 + w/2, 14.5, z0 + d/2, 0); for (let k = 0; k < 3; k++) treeP(B, x0 + w*(0.2 + 0.3*k), 15.2, z0 + d/2, 0.9, r, TRUNK, LEAF); } }
    for (let k = 0; k < 6; k++) boxP(tr, 0.4, 3, 0.4, 4 + k*4, 14.5, -30, 0); boxP(tr, 22, 0.3, 4, 14, 17.5, -30, 0); }
  // the rest of the podium roof: timber deck of the roof terrace, rows of planters, rooftop plant rooms and louvred screens
  { const dk = B.p(FIN), gr = B.p(GREEN), pl = B.p(ROOFC), lv = B.p(STONE2);
    for (const [x0, z0, w, d] of [[-14, -30, 30, 12], [8, -66, 14, 8]]) if (pip(pPOD, x0, z0) && pip(pPOD, x0 + w, z0 + d)) boxP(dk, w, 0.25, d, x0 + w/2, 14.5, z0 + d/2, 0);
    for (let k = 0; k < 140; k++){ const x = -75 + r()*125, z = -70 + r()*95; if (!pip(pPOD, x, z) || inShell(x, z) || inShell(x + 6, z) || inShell(x - 6, z) || inShell(x, z + 6) || inShell(x, z - 6)) continue;
      const q = r(); if (q < 0.22) boxP(pl, 4 + r()*5, 2.4 + r()*1.5, 3 + r()*4, x, 14.5, z, 0); else if (q < 0.3){ boxP(lv, 7, 2.8, 0.3, x, 14.5, z, 0); } else if (q < 0.42) boxP(gr, 5, 0.6, 1.4, x, 14.5, z, 0); }
    for (let k = 0; k < 40; k++){ const x = -40 + r()*80, z = -66 + r()*50; if (pip(pPOD, x, z) && !inShell(x, z) && !inShell(x + 4, z) && !inShell(x - 4, z)) treeP(B, x, 14.6, z, 0.8 + 0.3*r(), r, TRUNK, LEAF); } }
  // glazed roof lights over the concourse between the shells
  { const o = B.p(PGL), w = B.p(TRIM); for (let k = 0; k < 7; k++){ const x = -44 - OE + k*5.2, z0 = ON - 30, z1 = ON - 8; if (!pip(pPOD, x, z0) || !pip(pPOD, x, z1)) continue;
      quadP(o, [x, 14.5, z0], [x, 14.5, z1], [x + 2.6, 16.6, z1], [x + 2.6, 16.6, z0]); quadP(w, [x + 2.6, 16.6, z0], [x + 2.6, 16.6, z1], [x + 5.2, 14.5, z1], [x + 5.2, 14.5, z0]); } }
  // glazed lift/stair lanterns on the roof
  for (const [x, z] of [[-30, -16], [8, -40], [-60, -8]]) if (pip(pPOD, x, z)) { LBox(g, 6, 3.5, 6, x, 14.5, z, PGL); LBox(g, 7, 0.4, 7, x, 18, z, TRIM); }

  // ---- forecourt at the podium level (y = 0), the amphitheatre steps down to the Outdoor Theatre, the promenade
  const SC = [0 - OE, ON + 70];           // stage centre (E 0, N -70)
  const arc = (rad, a0, a1, n) => { const P = []; for (let i = 0; i <= n; i++){ const a = a0 + (a1 - a0)*i/n; P.push([SC[0] + Math.cos(a)*rad, SC[1] - Math.sin(a)*rad]); } return P; };
  const A0 = 0.36, A1 = PI - 0.36, RS = 24, NSt = 8, DS = 2.75;
  { const top = arc(RS + NSt*DS, A0, A1, 24);   // the forecourt reaches down to the top row of steps
    const site = [...top.reverse(), [46 - OE, ON + 50], [45 - OE, ON - 30], [-55 - OE, ON - 30], [-55 - OE, ON + 47]];
    LPoly(g, site.slice().reverse(), -5, 5, PAVE); }
  for (let k = 0; k < NSt; k++){ const P = [...arc(RS + k*DS, A0, A1, 20), ...arc(RS + (k+1)*DS, A0, A1, 20).reverse()]; LPoly(g, P, -5, 5 + YP + (k + 1)*(-YP/NSt), k % 2 ? PAVE : STONE2); }
  // promenade along the bay (on the real waterfront ground) with its quay edge
  { const P = [...shore, [160 - OE, ON + 40], [-136 - OE, ON + 40]]; LPoly(g, P, -5.6, 5.6 + YP, PAVE);
    for (let i = 0; i < shore.length - 1; i++){ const a = shore[i], b = shore[i+1]; quadP(B.p(QUAY), [a[0], -5.6, a[1]], [b[0], -5.6, b[1]], [b[0], YP + 0.02, b[1]], [a[0], YP + 0.02, a[1]]);
      const L = Math.hypot(b[0]-a[0], b[1]-a[1]), n = Math.max(1, Math.round(L/2.4)); for (let k = 0; k < n; k++){ const t = k/n, x = lerp(a[0], b[0], t), z = lerp(a[1], b[1], t); segP(B.p(STEELC), [x, YP, z], [x, YP + 1.1, z], 0.04, 3); }
      segP(B.p(STEELC), [a[0], YP + 1.1, a[1]], [b[0], YP + 1.1, b[1]], 0.06, 4); }
    // rain trees and lamps along the promenade (not in front of the Outdoor Theatre)
    for (let i = 0; i < shore.length - 1; i++){ const a = shore[i], b = shore[i+1], L = Math.hypot(b[0]-a[0], b[1]-a[1]); if (L < 20) continue; const ex = (b[0]-a[0])/L, ez = (b[1]-a[1])/L;
      for (let d = 8; d < L - 4; d += 13){ const x = a[0] + ex*d - ez*8, z = a[1] + ez*d + ex*8; if (Math.abs(x + OE) < 46) continue; treeP(B, x, YP, z, 1.35, r, TRUNK, LEAF); }
      for (let d = 3; d < L; d += 26){ const x = a[0] + ex*d - ez*3, z = a[1] + ez*d + ex*3; segP(B.p(STEELC), [x, YP, z], [x, YP + 5, z], 0.08, 5); boxP(B.p(LAMP), 0.5, 0.5, 0.5, x, YP + 5, z, 0); } } }

  // ---- DBS Foundation Outdoor Theatre: stage on the promontory under a triangulated steel canopy that opens to the audience
  { LPoly(g, pOUT.slice().reverse(), -5, 5 + YP + 1.3, STONE2);
    const R = resample(pOUT, 72), n = R.length, A = [SC[0], SC[1] + 6], Hc = 16, yb = YP + 1.3;
    const hr = q => { const dz = -(q[1] - A[1]), dx = q[0] - A[0], l = Math.hypot(dx, dz) || 1; return 8.5*clamp01((dz/l + 0.15)/0.95); };
    const rim = R.map(q => [q, hr(q)]);
    const S = (u, v) => { const f = (((u % 1) + 1) % 1)*n, i = Math.floor(f), t = f - i, a = rim[i % n], b = rim[(i+1) % n], q = [lerp(a[0][0], b[0][0], t), lerp(a[0][1], b[0][1], t)], h = lerp(a[1], b[1], t);
      return [A[0] + (q[0]-A[0])*v, yb + h + (Hc - 1.3 - h)*Math.pow(Math.max(0, 1 - Math.pow(v, 2.4)), 0.5), A[1] + (q[1]-A[1])*v]; };
    surf(g, n, 14, S, CAN);
    const rb = B.p(TRIM); for (let i = 0; i < n; i += 4){ const P = []; for (let j = 0; j <= 10; j++) P.push(S(i/n, j/10)); polyP(rb, P.map(p => [p[0], p[1] + 0.15, p[2]]), 0.18, 4); }
    { const P = []; for (let i = 0; i <= n; i++) P.push(S(i/n, 1)); polyP(rb, P, 0.3, 4); }
    for (let i = 0; i < n; i++){ const p = S(i/n, 1); if (p[1] - yb > 2) segP(rb, [p[0], yb, p[2]], p, 0.3, 6); }
    // stage lights under the canopy at night
    for (let k = 0; k < 7; k++){ const p = S(0.25 + k*0.08, 0.55); boxP(B.p(LAMP), 0.6, 0.4, 0.6, p[0], p[1] - 0.8, p[2], 0); } }

  // ---- Makansutra Gluttons Bay and the Singtel Waterfront Theatre on the low east part of the site
  { LPoly(g, pGB1, YP + 6.9, 0.25, ROOFC); LPoly(g, pGB2, YP + 3.6, 0.2, ROOFC);
    LPoly(g, pGB1.slice().reverse(), -5, 5 + YP + 7, STONE); edgeBands(B.p(PGL), pGB1, YP + 0.3, YP + 3.4, 0.12); edgeBands(B.p(TRIM), pGB1, YP + 3.4, YP + 4.0, 0.6); edgeBands(B.p(PGL), pGB1, YP + 4.4, YP + 6.2, 0.1);
    LPoly(g, pGB2.slice().reverse(), -5, 5 + YP + 3.7, STONE); edgeBands(B.p(PGL), pGB2, YP + 0.3, YP + 2.6, 0.12);
    LBox(g, 9, 0.25, 34, 91.5 - OE, YP + 3.3, ON - 0, TRIM, 0.08); for (let k = 0; k < 4; k++) LCyl(g, 0.15, 0.15, 3.3, 87.5 - OE, YP, ON - 14 + k*9.3, STEELC, 6); }
  { LPoly(g, pSWT.slice().reverse(), -5, 5 + YP + 11.7, DARKW);
    edgeFins(B.p(FIN), pSWT, YP + 4.6, YP + 11.4, 1.5, 0.35, 0.7);
    edgeBands(B.p(PGL), pSWT, YP + 0.3, YP + 4.4, 0.15); edgeBands(B.p(TRIM), pSWT, YP + 4.4, YP + 4.9, 0.4); edgeBands(B.p(STONE2), pSWT, YP + 11.2, YP + 12.2, 0.1); }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'esplanade', lat:1.289478, lon:103.856014 + OE/111290.5, rot:0});
}
// ======================================================================================================
// Singapore Flyer (2008): 150 m wheel (165 m overall), 28 air-conditioned capsules mounted outboard of the rim, the spindle
// carried by an A-frame of two splayed legs on each side, over the real three-storey terminal: three stepped, rounded glass
// levels (0-7, 7-14, 14-21 m) on the real footprints, terraces with planting, the boarding level under the wheel.
// The wheel lies in the local x-y plane (axle along z); the model origin is the hub's ground point and rot turns local +x
// to the wheel's real bearing (38 deg north of east).
// ======================================================================================================
{
const HE = -11.65, HN = 1.15, ROT = 0.6629;   // hub ground point (E, N) relative to the reference anchor 1.2894 N, 103.86323 E
const cR = Math.cos(ROT), sR = Math.sin(ROT);
const W = F => { const P = []; for (let i = 0; i < F.length; i += 2){ const de = F[i] - HE, dn = F[i+1] - HN; P.push([de*cR + dn*sR, de*sR - dn*cR]); } return P; };
const L1 = [51.7,16.1,55.9,8.4,57.1,0.7,55.9,-14.7,52.9,-24.2,48.1,-32.5,35.6,-41.4,24.8,-45.0,9.9,-47.4,-8.0,-49.1,-27.1,-49.1,-42.0,-48.0,-52.2,-45.6,-59.3,-40.8,-64.1,-34.9,-65.3,-29.6,-61.7,-12.4,-55.7,-2.9,-46.8,7.8,-30.7,36.8,-22.3,45.1,-14.0,49.9,-3.8,53.4,2.8,54.0,9.9,52.9,17.7,49.3,23.7,44.6,32.6,32.7,48.1,20.8];
const L2 = [-19.9,42.8,-12.2,46.9,-3.2,49.9,2.2,50.5,8.1,49.3,14.7,46.3,20.1,42.2,29.0,30.3,44.5,19.1,51.1,8.4,52.3,-6.4,51.1,-13.0,48.7,-21.3,44.0,-28.4,38.6,-33.1,33.2,-36.7,23.1,-39.7,8.7,-42.0,-8.6,-43.8,-27.7,-43.8,-42.0,-42.6,-51.0,-40.8,-56.9,-36.7,-60.5,-31.9,-61.7,-28.4,-58.1,-13.6,-52.8,-4.7,-43.8,6.0,-36.6,16.7,-27.1,35.1];
const L3 = [-17.5,40.4,-11.6,44.0,-3.8,46.3,0.4,46.9,5.1,45.7,9.9,43.4,14.1,40.4,23.1,29.1,37.4,18.5,42.2,10.2,43.4,-2.3,40.4,-14.7,36.2,-20.1,32.0,-24.2,27.2,-27.2,18.9,-29.6,-9.8,-33.1,-40.2,-32.5,-47.4,-30.8,-51.6,-27.8,-54.0,-24.8,-54.6,-22.5,-52.2,-10.0,-47.4,-2.9,-39.0,6.6,-31.3,19.6,-24.1,33.9];
// the paved ends of the wheel's ground strip beyond the terminal
const PADS = [[48.7,43.4,44.0,49.3,30.0,46.0,38.0,34.0], [-71.9,-40.8,-67.1,-47.4,-55.0,-46.5,-62.0,-36.0]];
LANDMARKS.flyer = {zh:'新加坡摩天观景轮', en:'Singapore Flyer', cat:'new', r:86, h:167, lt:{m:0, c:'#e6eeff', k:0.55, e:0.35, anim:'cycle', c2:'#ff6fae'}, build(){
  const g = new THREE.Group(), B = mkB(), r = LMCTX.rng;
  const st = '#e4e7e9', CY = 89, R = 71.5, rimC = {c:'#dfe3e6', glow:'#8fd2ff', gk:1.15};
  const GL = {c:'#7f9ba6', glow:'#ffe2b3', gk:0.5}, SLAB = '#eef0ee', GRN = '#6f9a58', LEAF = '#55803f', TRUNK = '#6a5a48', PAVE = '#c9c2b2';
  // ---- terminal: three stepped glass levels with white slab edges and mullions, planted terraces
  const lv = [[W(L1), 0, 7], [W(L2), 7, 14], [W(L3), 14, 21]];
  lv.forEach(([P, y0, y1], i) => {
    LPoly(g, P, i ? y0 : -5, y1 - (i ? y0 : -5) - 0.9, GL);
    LPoly(g, P, y1 - 0.9, 0.9, '#c9cdcb');
    edgeBands(B.p(SLAB), P, y1 - 0.9, y1 + 0.25, 0.25);                 // slab edge / parapet
    edgeFins(B.p(SLAB), P, y0 + (i ? 0 : 0.2), y1 - 0.9, 2.4, 0.18, 0.25);  // mullions
    if (!i) edgeBands(B.p('#cfcac0'), P, -5, 0.2, 0.06);                  // plinth course
    // planted edge of the terrace on top of this level (where the next level steps back)
    if (i < 2){ const Q = lv[i+1][0]; for (let k = 0; k < P.length; k++){ const a = P[k], b = P[(k+1) % P.length], m = [(a[0]+b[0])/2, (a[1]+b[1])/2]; if (pip(Q, m[0], m[1])) continue;
      const [nx, nz, L] = edgeN(P, k); if (L < 3) continue; const ux = (b[0]-a[0])/L, uz = (b[1]-a[1])/L, c = [m[0] - nx*2.2, m[1] - nz*2.2];
      boxP(B.p(GRN), L*0.9, 0.7, 2.6, c[0], y1 + 0.25, c[1], Math.atan2(-uz, ux));
      for (let d = 2; d < L - 1; d += 6.5) treeP(B, a[0] + ux*d - nx*2.2, y1 + 0.9, a[1] + uz*d - nz*2.2, 0.75, r, TRUNK, LEAF); } }
  });
  // boarding canopy on the top level under the wheel, and the paved ends of the wheel strip
  LBox(g, 26, 0.5, 30, 0, 26.5, 0, SLAB); for (const sx of [-12, 12]) for (const sz of [-13, 13]) LCyl(g, 0.3, 0.3, 5.5, sx, 21, sz, '#9aa0a3', 8);
  for (const F of PADS) LPoly(g, W(F), -0.6, 0.7, PAVE);
  // ---- A-frame legs, one pair on each side of the wheel, standing on the terminal roof; spindle and hub
  const L = B.p(st);
  for (const s of [-1, 1]){
    const H = [0, CY, s*8.5];
    for (const fx of [-36, 36]){ const F = [fx, 21, s*17]; segP(L, F, H, 1.6, 10, 1.1); boxP(L, 4.2, 1.2, 4.2, fx, 21, s*17, 0); }
    segP(L, [-23, 46, s*13.6], [23, 46, s*13.6], 0.7, 8);
  }
  LBeam(g, [0, CY, -12], [0, CY, 12], 2.4, st, 16);
  for (const s of [-1, 1]) LBeam(g, [0, CY, s*5.5], [0, CY, s*7.2], 5.5, st, 20);
  // ---- rim: a triangulated tube truss (two outer chords + inner chord), lit in one colour at night
  const N = 112, rimO = B.p(rimC), brace = B.p(st), rp = (a, rr, z) => [Math.cos(a)*rr, CY + Math.sin(a)*rr, z];
  for (let i = 0; i < N; i++){ const a0 = i/N*TAU, a1 = (i+1)/N*TAU;
    for (const z of [-2.4, 2.4]) segP(rimO, rp(a0, R, z), rp(a1, R, z), 0.55, 6);
    segP(brace, rp(a0, R - 2.6, 0), rp(a1, R - 2.6, 0), 0.4, 5);
    segP(brace, rp(a0, R, -2.4), rp(a0, R - 2.6, 0), 0.16, 3); segP(brace, rp(a0, R, 2.4), rp(a0, R - 2.6, 0), 0.16, 3);
    segP(brace, rp(a0, R, -2.4), rp(a0, R, 2.4), 0.14, 3); }
  // cable spokes, crossing between the hub flanges and the rim
  const sp = B.p('#c9cdd0');
  for (let i = 0; i < 56; i++){ const a = i/56*TAU; for (const s of [-1, 1]) segP(sp, [Math.cos(a + s*0.06)*5, CY + Math.sin(a + s*0.06)*5, s*6.4], rp(a, R - 2.6, 0), 0.09, 3); }
  // capsules: horizontal glass pods, axis parallel to the axle, outboard of the rim
  // capsules: 7 m glass cylinders on white end frames, lit inside at night
  const cap = {c:'#a9c6d2', glow:'#fff0d4', gk:1.0}, capF = B.p(st);
  for (let k = 0; k < 28; k++){ const a = k/28*TAU + 0.05, c = rp(a, R + 4.4, 0);
    LBeam(g, [c[0], c[1], -3.5], [c[0], c[1], 3.5], 2.05, cap, 14);
    for (const z of [-3.5, -1.6, 0, 1.6, 3.5]){ const P = []; for (let j = 0; j <= 12; j++){ const b = j/12*TAU; P.push([c[0] + Math.cos(b)*2.12, c[1] + Math.sin(b)*2.12, z]); } polyP(capF, P, Math.abs(z) > 3 ? 0.2 : 0.1, 3); }
    segP(capF, [c[0], c[1] - 2.1, -3.5], [c[0], c[1] - 2.1, 3.5], 0.25, 4);
    for (const z of [-2.4, 2.4]) segP(brace, rp(a, R + 0.4, z), [c[0], c[1], z*0.9], 0.35, 4); }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'flyer', lat:1.2894 + HN/110574, lon:103.86323 + HE/111290.5, rot:ROT});
}
// ======================================================================================================
// Helix Bridge (2010): 280 m double-helix footbridge (three 65 m spans + two 40 m end spans) beside the Bayfront Avenue
// bridge. Re-laid on the real alignment: a 309 m radius curve bowing east towards the road bridge, from the Bayfront
// (ArtScience Museum) to Marina Centre. Major helix (r ~5.3 m) and minor helix (r ~4.3 m) joined by struts, the 7 m deck inside,
// canopy panels, four round viewing pods cantilevered towards the bay (west, the concave side), piers with forked arms.
// rot 0: local +x east, -z north; the model origin is the middle of the bridge axis.
// ======================================================================================================
{
const OE = -42.76, ON = -2.5;   // origin (E, N) relative to the reference anchor 1.28765 N, 103.861 E
LANDMARKS.helix = {zh:'双螺旋桥', en:'Helix Bridge', cat:'new', r:156, h:17, water:true, lt:{m:0, c:'#eaf2ff', k:0.5, e:0.6, anim:'cycle', c2:'#56d6ff'}, build(){
  const g = new THREE.Group(), B = mkB();
  const RC = 309.25, CX = -352 - OE, CZ = ON + 0.5, TM = Math.atan2(-(0 - CZ), 0 - CX);
  const th = t => TM + t/RC, Pc = t => [CX + RC*Math.cos(th(t)), CZ - RC*Math.sin(th(t))], Nn = t => [Math.cos(th(t)), -Math.sin(th(t))];
  const HL = 140, yd = t => 5.2 + 1.6*(1 - (t/HL)*(t/HL)) - (Math.abs(t) > 122 ? (Math.abs(t) - 122)*0.12 : 0);
  const ya = t => yd(t) + 2.4, PITCH = 26, NS = 420;
  const hp = (t, ph, rr) => { const p = Pc(Math.max(-HL, Math.min(HL, t))), n = Nn(t), f = TAU*t/PITCH + ph, c = Math.cos(f)*rr; return [p[0] + n[0]*c, ya(t) + Math.sin(f)*rr, p[1] + n[1]*c]; };
  const major = B.p({c:'#d4d8dc', glow:'#eef6ff', gk:0.5}), minor = B.p({c:'#bfc5ca', glow:'#ff9ad6', gk:0.32}), strut = B.p('#c6cbcf');
  for (const ph0 of [0, PI]){
    for (let k = 0; k < 5; k++){ const ph = ph0 + (k - 2)*0.075, P = []; for (let i = 0; i <= NS; i++){ const t = -HL + 2*HL*i/NS; P.push(hp(t, ph, 5.3)); } polyP(major, P, 0.13, 4); }
    for (let k = 0; k < 3; k++){ const ph = ph0 + HP + (k - 1)*0.09, P = []; for (let i = 0; i <= NS; i++){ const t = -HL + 2*HL*i/NS; P.push(hp(t, ph, 4.25)); } polyP(minor, P, 0.11, 4); }
    for (let t = -HL; t <= HL; t += 2.6){ segP(strut, hp(t, ph0, 5.3), hp(t, ph0 + HP, 4.25), 0.07, 3); segP(strut, hp(t, ph0 + PI*0.25, 5.3), hp(t, ph0 + HP, 4.25), 0.06, 3); }
  }
  // canopy panels (glass / perforated steel) along the upper part of the minor helix
  // canopies of glass and perforated stainless mesh fixed to the inner helix where it passes over the deck: curved shells
  // ~3.5 m wide following each minor-helix strand across the top, alternating glass (pale, lit at night) and mesh (darker)
  const canG = B.p({c:'#c7dde4', glow:'#e8f6ff', gk:0.28, ds:true}), canM = B.p({c:'#9aa3a8', ds:true});
  for (let i = 0; i < NS; i += 2){ const t0 = -HL + 2*HL*i/NS, t1 = -HL + 2*HL*(i + 2)/NS;
    for (const ph0 of [HP, -HP]){ const a0 = TAU*t0/PITCH + ph0; if (Math.sin(a0) < 0.3 || Math.abs(t0) > HL - 6) continue;
      const o = Math.floor((t0 + HL)/9) % 2 ? canM : canG;
      for (let q = -2; q < 2; q++) quadP(o, hp(t0, ph0 + q*0.2, 4.05), hp(t1, ph0 + q*0.2, 4.05), hp(t1, ph0 + (q + 1)*0.2, 4.05), hp(t0, ph0 + (q + 1)*0.2, 4.05)); } }
  // night: pairs of red and green lights along the strands (the 'base pairs'), and lamps at the deck edges
  { const RED = B.p({c:'#8a8e90', glow:'#ff3b3b', gk:1.6}), GRN = B.p({c:'#8a8e90', glow:'#3dff7a', gk:1.6}), WL = B.p({c:'#eef4f6', glow:'#e6f4ff', gk:1.0});
    let k = 0; for (let t = -HL + 4; t <= HL - 4; t += 6.5, k++){ for (const ph0 of [0, PI]){ const p = hp(t, ph0 + 0.05, 5.55), q = hp(t, ph0 + HP + 0.05, 4.5);
      boxP(k % 2 ? RED : GRN, 0.32, 0.32, 0.32, p[0], p[1] - 0.16, p[2], 0); boxP(k % 2 ? GRN : RED, 0.3, 0.3, 0.3, q[0], q[1] - 0.15, q[2], 0); } }
    for (let t = -HL; t <= HL; t += 5) for (const sd of [-1, 1]){ const p = Pc(t), n = Nn(t), y = yd(t); boxP(WL, 0.3, 0.12, 0.3, p[0] + n[0]*sd*3.3, y + 1.15, p[1] + n[1]*sd*3.3, 0); } }
  // deck and balustrade, with the landings at both ends
  const deckSecs = [];
  for (let i = 0; i <= 64; i++){ const t = -HL - 6 + (2*HL + 12)*i/64, tc = Math.max(-HL, Math.min(HL, t)), p = Pc(t), n = Nn(t), y = yd(tc);
    deckSecs.push([[p[0] - n[0]*3.5, y, p[1] - n[1]*3.5], [p[0] + n[0]*3.5, y, p[1] + n[1]*3.5], [p[0] + n[0]*3.5, y - 0.7, p[1] + n[1]*3.5], [p[0] - n[0]*3.5, y - 0.7, p[1] - n[1]*3.5]]); }
  LLoft(g, deckSecs, '#b9b2a4', false);
  const bal = B.p({c:'#cfe0e6', glow:'#fff2d6', gk:0.3});
  for (let i = 0; i < deckSecs.length - 1; i++) for (const k of [0, 1]){ const p = deckSecs[i][k], q = deckSecs[i+1][k]; quadP(bal, p, q, [q[0], q[1] + 1.1, q[2]], [p[0], p[1] + 1.1, p[2]]); }
  // piers with forked arms under the tube, and the viewing pods on the bay (west) side
  for (const t of [-100, -35, 30, 95]){ const p = Pc(t), n = Nn(t), y = yd(t) - 0.7;
    LCyl(g, 1.3, 1.6, y - 1.5, p[0], -1, p[1], '#c3c1ba', 12);
    for (const s of [-1, 1]) LBeam(g, [p[0], y - 3.4, p[1]], [p[0] + n[0]*s*4.6, y, p[1] + n[1]*s*4.6], 0.55, '#c3c1ba', 8);
    const x = p[0] - n[0]*9.5, z = p[1] - n[1]*9.5, yy = yd(t);
    LCyl(g, 4.6, 4.2, 0.8, x, yy - 0.8, z, '#b9b2a4', 24); LRing(g, 4.4, 4.4, 4.6, 4.6, yy, yy + 1.1, {c:'#cfe0e6', glow:'#fff2d6', gk:0.3}, 24, 0, TAU).position.set(x, 0, z);
    boxP(B.p('#b9b2a4'), 5, 0.7, 2.5, p[0] - n[0]*6, yy - 0.7, p[1] - n[1]*6, Math.atan2(n[1], n[0]) === 0 ? 0 : -Math.atan2(n[1], n[0]));
    LCyl(g, 0.4, 0.4, yy + 1, x, -1, z, '#9da3a6', 8); }
  for (const s of [-1, 1]){ const t = s*(HL + 5), p = Pc(t), n = Nn(t); LBox(g, 10, 1.2 + 4.0, 16, p[0], -4, p[1], '#cfc7b6', -Math.atan2(n[1], n[0])); }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'helix', lat:1.28765 + ON/110574, lon:103.861 + OE/111290.5, rot:0});
}
// ======================================================================================================
// Merlion Park: the 8.6 m Merlion (lion head, fish body on a curled tail, facing east, the water jet from its mouth into the
// bay) at the edge of the real waterfront platform, the 2 m Merlion Cub 22 m behind it, the viewing pier to the north-east,
// granite paving, railings, lamps and palms. Re-laid on the real positions (fountain at 1.286784 N, 103.854503 E).
// rot 0: local +x east (the statue faces +x).
// ======================================================================================================
{
const OE = 10, ON = 0;   // origin (E, N) relative to the reference anchor 1.28681 N, 103.85432 E
// the platform and its viewing pier, following the real shoreline (E, N)
const DECK = [-22.2,7.8, 39,30.1, 56.5,14.3, 48.8,6.6, 33.3,20.1, 23,17.3, 24.6,1.5, 26.3,-14.4, 35.3,-21.7, 27,-22.4, 14,-22.6, 0,-24.5, -33,-23, -31,-4];
const merlionStatue = function(g, B, x0, y0, z0, s, ry, jet){
  const R = rotP(x0, z0, ry), P = (x, y, z) => { const q = R(x*s, y0 + y*s, z*s); return q; };
  const W = {c:'#f1eee6', ds:true}, W2 = {c:'#e1ddd2', ds:true}, sc = B.p(W2);
  // wave pedestal
  const ped = []; for (let k = 0; k < 14; k++){ const a = k/14*TAU; ped.push(P(Math.cos(a)*2.4, 0, Math.sin(a)*2.2)); }
  LLoft(g, [ped, ped.map(p => [p[0], p[1] + 1.1*s, p[2]]).map((p, k) => { const a = k/14*TAU; return P(Math.cos(a)*(2.1 + 0.25*Math.sin(3*a)), 1.1 + 0.3*Math.sin(2*a), Math.sin(a)*(1.9 + 0.25*Math.cos(3*a))); })], W2, true);
  // fish body: elliptical sections along an S-curve from the coiled tail to the neck
  const body = []; const NB = 9;
  for (let k = 0; k <= NB; k++){ const t = k/NB, cx = -0.9 + 1.3*t - 0.35*Math.sin(PI*t), cy = 1.0 + 4.6*t, rx = 1.3 + 0.4*Math.sin(PI*t*0.9) - 0.1*t, rz = 1.2 + 0.32*Math.sin(PI*t);
    const L = []; for (let i = 0; i < 14; i++){ const a = i/14*TAU; L.push(P(cx + Math.cos(a)*rx, cy, Math.sin(a)*rz)); } body.push(L);
    if (k > 0 && k < NB) for (let i = 0; i < 14; i++) if (i % 2 === k % 2){ const a = (i + 0.5)/14*TAU, p = P(cx + Math.cos(a - 0.12)*(rx + 0.03), cy + 0.1, Math.sin(a - 0.12)*(rz + 0.03)), q = P(cx + Math.cos(a)*(rx + 0.06), cy - 0.32, Math.sin(a)*(rz + 0.06)), u = P(cx + Math.cos(a + 0.12)*(rx + 0.03), cy + 0.1, Math.sin(a + 0.12)*(rz + 0.03)); sc.push(...p, ...q, ...u); } }
  LLoft(g, body, W, false);
  // coiled tail behind, rising to a split fin
  const tl = []; for (let k = 0; k <= 16; k++){ const t = k/16, a = PI*0.15 + t*PI*1.55; tl.push(P(-1.4 - 1.5*Math.sin(a)*(1 - 0.3*t), 1.0 + 1.6*(1 - Math.cos(a)) + t*1.6, 0.6*Math.sin(t*PI))); }
  for (let k = 0; k < 16; k++) segP(sc, tl[k], tl[k+1], 0.75*s*(1 - k/18), 8, 0.75*s*(1 - (k+1)/18));
  const te = tl[16]; LTris(g, [...te, ...P(-3.8, 6.4, 0.9), ...P(-2.2, 6.6, 0), ...te, ...P(-3.8, 6.4, -0.9), ...P(-2.2, 6.6, 0)], W);
  // lion head: a big round head with a broad muzzle, open mouth, brows and small ears, framed by a collar of mane locks that
  // flow back and down over the shoulders (three rows of tapering tufts)
  const hx = 0.6, hy = 6.75, M = W, mn = B.p(W2), dk = '#4a4440';
  LSph(g, 1.45*s, ...P(hx, hy, 0), M, 1.06, 18);
  LSph(g, 0.95*s, ...P(hx + 1.05, hy - 0.45, 0), M, 0.78, 14);                    // muzzle
  for (const zz of [-0.42, 0.42]) LSph(g, 0.5*s, ...P(hx + 1.55, hy - 0.42, zz), M, 0.8, 10);   // whisker pads
  LSph(g, 0.34*s, ...P(hx + 1.75, hy + 0.05, 0), W2, 0.75, 10);                    // nose
  LSph(g, 0.5*s, ...P(hx + 1.45, hy - 0.98, 0), dk, 0.55, 10);                     // open mouth
  LSph(g, 0.42*s, ...P(hx + 1.25, hy - 1.32, 0), M, 0.5, 10);                      // lower jaw
  for (const zz of [-0.58, 0.58]){ LSph(g, 0.16*s, ...P(hx + 1.32, hy + 0.48, zz), dk, 1, 6);
    segP(mn, P(hx + 1.2, hy + 0.78, zz*1.45), P(hx + 1.45, hy + 0.72, zz*0.35), 0.16*s, 5, 0.1*s);              // brow ridges
    LCone(g, 0.26*s, 0.5*s, ...P(hx - 0.1, hy + 1.2, zz*1.7), M, 5); }                                         // ears
  for (let j = 0; j < 4; j++) for (let i = 0; i < 18; i++){ const a = (i + 0.5*j)/18*TAU, ca = Math.cos(a), sa = Math.sin(a); if (sa < -0.75 + 0.15*j) continue;   // a: round the face axis
    const rr = 1.25 + 0.2*j, base = P(hx + 0.05 - 0.45*j, hy + 0.15 + sa*rr - 0.25*j, ca*rr*1.06);
    const tip = P(hx - 0.55 - 0.45*j, hy - 0.2 - 0.3*j + sa*(rr + 0.3), ca*(rr + 0.32)*1.06);
    segP(mn, base, tip, (0.46 - 0.04*j)*s, 6, 0.16*s); }
  // pectoral fins
  for (const zz of [-1, 1]) LTris(g, [...P(0.6, 3.4, zz*0.95), ...P(1.4, 2.4, zz*1.9), ...P(0.1, 2.9, zz*1.25)], W);
  if (jet){ const J = B.p({c:'#e6f1f4', glow:'#dff6ff', gk:0.8, ds:true}), pts = [];
    for (let k = 0; k <= 20; k++){ const t = k/20; pts.push(P(hx + 1.6 + t*jet, hy - 1.0 + 1.6*t - t*t*(hy + 2.9), 0)); }
    for (let k = 0; k < 20; k++) segP(J, pts[k], pts[k+1], (0.2 + 0.25*k/20)*s, 6, (0.2 + 0.25*(k+1)/20)*s);
    const e = pts[20]; for (let k = 0; k < 12; k++){ const a = k/12*TAU; segP(J, [e[0], e[1] - 0.2, e[2]], [e[0] + Math.cos(a)*1.3*s, e[1] + 0.45*s, e[2] + Math.sin(a)*1.3*s], 0.25*s, 4, 0.05*s); } }
}

LANDMARKS.merlion = {zh:'鱼尾狮公园', en:'Merlion Park', cat:'old', r:58, h:12, water:true, lt:{m:0, c:'#f4f6ff', k:1.05, e:0.55, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB(), r = LMCTX.rng;
  const deck = toXZ(DECK, OE, ON), PAVE = '#d9d2c3', PAVE2 = '#e3ddd0', QUAY = '#bdb5a5', RAIL = '#5c6064';
  // granite platform on its quay wall (the water side drops to the bay)
  LPoly(g, deck, -2.2, 2.35, PAVE);
  edgeBands(B.p(QUAY), deck, -2.2, 0.05, 0.05);
  // paving pattern: lighter bands across the platform
  for (let k = 0; k < 6; k++){ const x = -36 + k*9; boxP(B.p(PAVE2), 1.2, 0.04, 24, x, 0.15, -2, 0); }
  // railing along the water edges (north edge, the pier, the east edge and the promontory)
  const rl = B.p(RAIL);
  for (let i = 0; i < 9; i++){ const a = deck[i], b = deck[i+1], L = Math.hypot(b[0]-a[0], b[1]-a[1]), n = Math.max(1, Math.round(L/2.5));
    segP(rl, [a[0], 1.25, a[1]], [b[0], 1.25, b[1]], 0.06, 4);
    for (let k = 0; k <= n; k++){ const t = k/n, x = lerp(a[0], b[0], t), z = lerp(a[1], b[1], t); segP(rl, [x, 0.15, z], [x, 1.25, z], 0.04, 3); } }
  // lamp posts and palms
  for (const [e, n2] of [[-18, 6], [0, 13], [18, 16], [-12, -22], [8, -24], [30, -20], [40, 24]]){ const q = toXZ([e, n2], OE, ON)[0]; LCyl(g, 0.12, 0.15, 4.5, q[0], 0.15, q[1], '#4d5156', 6); LSph(g, 0.35, q[0], 4.85, q[1], {c:'#f0ead8', glow:'#ffe2a8', gk:1.2}, 1, 8); }
  for (const [e, n2] of [[-26, -14], [-24, -2], [-16, -18], [-6, -20], [4, -22]]){ const q = toXZ([e, n2], OE, ON)[0]; palm(B, q[0], 0.15, q[1], 6 + r()*2, r, '#7a6a55', '#6c9a4a'); }
  // benches facing the bay
  for (const [e, n2] of [[-8, 8], [4, 12], [-14, -10]]){ const q = toXZ([e, n2], OE, ON)[0]; boxP(B.p('#9a8a74'), 3, 0.45, 0.8, q[0], 0.15, q[1], 0.35); }
  // the Merlion (8.6 m incl. pedestal, facing east, spouting into the bay) on its wave-like base, and the cub behind it
  { const q = toXZ([20.3, -2.9], OE, ON)[0];
    LCyl(g, 3.3, 3.7, 0.8, q[0], 0.15, q[1], '#cfc8b9', 20);
    merlionStatue(g, B, q[0], 0.95, q[1], 0.94, 0, 10); }
  { const q = toXZ([-2.1, -1.4], OE, ON)[0];
    LCyl(g, 1.0, 1.2, 1.0, q[0], 0.15, q[1], '#cfc8b9', 16);
    merlionStatue(g, B, q[0], 1.15, q[1], 0.2, 0, 3); }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'merlion', lat:1.28681 + ON/110574, lon:103.85432 + OE/111290.5, rot:0});
}
// ======================================================================================================
// Marina Bay Sands (Safdie, 2010), re-laid on the real plan. The three 55-storey hotel towers (194 m) stand on the real,
// gently curving hotel axis (bearings 35, 25 and 16 deg east of north), each a straight west leg and a curving east leg that
// leans on it (the 'playing card' profile, atrium between the legs up to level 23); the 340 m SkyPark follows the same curve,
// with the 67 m cantilever to the north, the infinity pool on its west edge, gardens and pavilions. West of Bayfront Avenue,
// on the real footprints: The Shoppes along the waterfront, and the casino, the two theatres and the Sands Expo under their
// stepped, north-lit wave roofs; the Rain Oculus, the Event Plaza steps, the promenade, Crystal Pavilion North and the glass
// sphere pavilion in the bay. rot 0: local +x east, +z south; the model origin is mid-complex (west of Bayfront Avenue).
// ======================================================================================================
{
const OE = -40, ON = -20;   // origin (E, N) relative to the reference anchor 1.283979 N, 103.859765 E (mid-complex)
// the SkyPark / hotel axis: E as a cubic of N (fitted to the real SkyPark outline), from the south end to the north tip
const cE = n => 123.594 + 0.361782*n - 0.00110637*n*n + 9.15558e-7*n*n*n, dE = n => 0.361782 - 2*0.00110637*n + 3*9.15558e-7*n*n;
const NS0 = -176, NS1 = 138, TWR = [-144, -43, 52];
const CAS_OUT = [-92.2,-11.3,-52.8,67.6,-40.3,97.2,55.8,20.1,41.5,-9.5,23.6,-40.4,-15.8,-94.3,-30.7,-109.2];
const CAS_SL = [[34,[-31.9,1.1,-20,-11.3,12.9,-39.2,4.5,-46.3,-6.8,-37.4,-35.5,-8.3,-36.1,-8.9,-39.7,-5.4]],[27,[-30.1,75.3,0.9,49.2,26.6,28.4,45.1,16.6,37.3,8.3,21.2,20.1,-5,41.5,-27.1,61,-28.3,59.9,-36.1,68.2]],[30,[-60.6,-42.1,-55.2,-50.4,-37.9,-69.4,-45,-75.4,-67.7,-47.5]],[33,[-45,-23.8,-11.6,-58.2,-18.8,-63.5,-41.5,-41.6,-51.6,-29.1]],[35,[-35.5,-8.3,-23,-21.4,6.3,-48.1,-1.5,-55.2,-13.4,-45.1,-30.1,-29.1,-42.7,-14.9]],[30,[-33.1,27.8,-25.9,34.9,9.3,4.1,29.6,-11.9,22.4,-19.6,5.1,-5.4]],[34,[-40.3,-17.2,-30.1,-29.1,-2.7,-54,-9.8,-59.9,-46.8,-22]],[31,[-55.2,-36.8,-29.5,-65.9,-36.7,-70.6,-55.2,-50.4,-61.2,-41.6]],[32,[-49.8,-30.9,-41.5,-41.6,-20,-62.9,-27.7,-67.6,-48.6,-45.1,-56.4,-35.6]],[32,[-29.5,11.8,-28.9,11.8,2.1,-17.2,18.2,-30.3,10.5,-37.4,-20,-11.3,-36.1,4.7]],[31,[-27.1,23.7,5.1,-5.4,24.2,-20.8,16.4,-28.5,2.1,-17.2,-34.3,16.6]],[28,[-27.1,61,-5,41.5,21.2,20.1,40.3,6.5,32.6,-1.2,15.2,11.8,-25.9,47.4,-26.5,46.8,-33.7,53.9]],[26,[-34.9,91.3,2.1,59.3,27.8,39.7,49.3,25.5,42.7,17.2,26.6,28.4,0.9,49.2,-30.1,75.3,-30.7,74.7,-39.7,83.6,-36.1,86.5,-37.3,88.3]],[29,[-32.5,40.9,-25.9,47.4,15.2,11.8,35,-3,27.8,-10.1,9.3,4.1,-25.9,34.9,-26.5,34.4]]];
const THE_OUT = [87.5,189.7,82.1,182,76.1,182.6,75.5,178.5,93.5,177.9,93.5,154.7,85.1,91.9,62.4,36.7,-34.3,116.8,-30.1,135.2,-16.4,164.2,-6.2,179,0.3,185.6,17.6,196.8,29.6,201.6,42.1,202.8,51.1,202.8,62.4,201,71.4,198,79.7,194.5];
const THE_SL = [[29,[72.6,146.4,54.7,149.4,16.4,159.5,15.8,158.3,13.5,159.5,15.8,168.4,33.2,163.6,55.8,158.9,75.5,156.5]],[30,[41.5,75.3,36.1,68.2,21.8,76.5,-5.6,96,-1.5,102,8.7,94.8]],[31,[73.8,136.4,69.6,126.9,52.3,129.8,29,137.5,14.7,142.9,14.1,141.7,12.3,142.9,15.8,151.2,54.7,139.3]],[32,[54.7,88.9,49.9,81.2,35.5,87.7,1.5,107.3,5.7,112.6,17,106.1,41.5,93.7]],[30,[74.4,146.4,70.8,136.9,54.7,139.3,15.8,151.2,15.2,150,13.5,151.2,16.4,159.5,54.7,149.4]],[32,[72,126.3,67.8,116.2,51.7,120.3,27.2,128.6,13.5,134.6,12.9,134,11.7,134.6,14.7,142.9,29,137.5,52.3,129.8]],[26,[14.1,184.4,14.1,183.2,11.1,183.8,12.3,192.1,28.4,190.3,58.2,188.5,75,188.5,73.8,177.9,37.3,180.2]],[31,[48.7,81.8,43.3,74.1,8.7,94.8,-1.5,102,2.7,106.7,35.5,87.7]],[33,[70.2,115.6,65.4,106.7,49.9,110.9,25.4,120.3,11.7,127.5,11.1,126.3,9.9,126.9,13.5,134.6,27.2,128.6,51.7,120.3]],[33,[61.2,96,56.4,88.3,41.5,93.7,17,106.1,4.5,113.2,8.7,119.2,46.9,100.8]],[34,[68.4,105.5,63,96,46.9,100.8,7.5,119.2,11.7,127.5,25.4,120.3,49.9,110.9]],[27,[12.9,175.5,14.1,184.4,37.3,180.2,75.5,177.3,73.8,167.2,57.6,169,34.4,172.5,15.2,176.7,14.7,174.9]],[28,[76.1,167.2,73.2,157.1,55.8,158.9,33.2,163.6,15.8,168.4,15.8,166.6,13.5,167.2,15.2,176.7,34.4,172.5,57.6,169]]];
const EXP_OUT = [-63,-128.1,-49.8,-149.5,-54,-156,-74.3,-182.7,-108.9,-231.3,-168,-297.7,-195.5,-286.5,-213.4,-275.8,-262.4,-238.4,-222.4,-199.3,-183,-155.4,-144.7,-106.2,-110.7,-55.8];
const EXP_SL = [[27,[-117.9,-86,-101.2,-112.1,-78.5,-143.6,-64.7,-159.6,-72.5,-165.5,-88.6,-147.7,-107.7,-122.8,-120.9,-103.2,-122.1,-103.8,-128.6,-93.7]],[32,[-200.3,-234.9,-200.9,-236.1,-183,-249.1,-163.9,-261,-148.9,-267.5,-155.5,-275.8,-170.4,-269.9,-193.7,-256.2,-211,-243.2,-202.7,-232.5]],[33,[-146.5,-169.1,-113.7,-201.7,-99.4,-211.7,-106.5,-218.9,-117.3,-212.3,-136.4,-196.9,-152.5,-179.7,-153.7,-180.3,-156.1,-177.9]],[34,[-184.7,-218.3,-169.8,-230.7,-149.5,-245,-134,-252.7,-140,-260.4,-156.1,-253.9,-177,-239.6,-192.5,-227.8]],[28,[-120.9,-103.2,-107.7,-122.8,-88.6,-147.7,-70.1,-168.5,-77.9,-174.4,-92.2,-160.2,-110.7,-137.6,-125,-118.1,-126.2,-118.6,-131,-110.9]],[33,[-191.3,-226.6,-192.5,-227.8,-177,-239.6,-156.1,-253.9,-141.2,-259.8,-147.1,-268.1,-163.9,-261,-183,-249.1,-200.9,-236.1,-193.1,-224.8]],[35,[-160.3,-189.8,-141.8,-207.6,-123.9,-221.2,-110.7,-228.9,-118.5,-236.7,-129.2,-230.7,-149.5,-215.9,-167.4,-199.9,-168,-201.1,-169.2,-199.9]],[32,[-140.6,-157.2,-123.3,-176.2,-105.9,-193.4,-93.4,-202.9,-101.2,-210,-113.7,-201.7,-150.1,-166.1]],[34,[-152.5,-179.7,-136.4,-196.9,-117.3,-212.3,-105.3,-220.6,-112.5,-228.4,-123.9,-221.2,-141.8,-207.6,-160.3,-189.8,-160.9,-190.4,-162.7,-189.2]],[36,[-118.5,-236.7,-116.7,-237.2,-125,-246.1,-143.6,-235.5,-162.1,-221.8,-175.8,-210,-167.4,-199.9,-149.5,-215.9,-129.2,-230.7]],[31,[-209.8,-242,-211,-243.2,-193.7,-256.2,-170.4,-269.9,-156.7,-275.2,-162.1,-283.5,-178.2,-277.6,-202.1,-263.3,-221.2,-250.9,-213.4,-239.6]],[30,[-129.8,-131.7,-113.7,-152.4,-94,-174.4,-82.1,-185.7,-89.8,-192.8,-104.2,-179.1,-140,-140.6]],[35,[-175.8,-210,-162.1,-221.8,-143.6,-235.5,-126.2,-245.6,-132.8,-253.3,-149.5,-245,-169.8,-230.7,-184.2,-218.9]],[31,[-134.6,-145.3,-120.9,-161.9,-104.2,-179.1,-88,-194,-95.2,-201.1,-105.9,-193.4,-123.3,-176.2,-140.6,-157.2,-141.2,-158.4,-144.7,-153.6]],[30,[-220,-249.7,-221.2,-250.9,-202.1,-263.3,-178.2,-277.6,-162.7,-283.5,-169.8,-293,-190.1,-283.5,-215.2,-269.9,-231.9,-257.4,-224.2,-246.1]],[29,[-125,-118.1,-110.7,-137.6,-92.2,-160.2,-76.1,-176.8,-84.5,-183.9,-94,-174.4,-113.7,-152.4,-129.8,-131.7,-130.4,-132.9,-135.8,-126.4]]];
const SHOP = [51.1,202.8,42.1,202.8,29.6,201.6,17.6,196.8,0.3,185.6,-6.2,179,-16.4,164.2,-30.1,135.2,-34.3,116.8,62.4,36.7,64.8,26.1,55.8,20.1,-40.3,97.2,-52.8,67.6,-92.2,-11.3,-36.7,-100.9,-63,-128.1,-110.7,-55.8,-144.7,-106.2,-183,-155.4,-222.4,-199.3,-262.4,-238.4,-289.8,-208.8,-257,-182.1,-205.6,-122.8,-148.3,-46.3,-156.1,-41.6,-114.3,33.8,-105.3,29,-74.3,95.4,-70.7,102.6,-68.9,102.6,-67.1,108.5,-67.7,114.4,-64.2,122.7,-60.6,126.9,-47.4,170.2,-35.5,190.3,-27.1,200.4,-9.8,216.4,0.9,222.3,23,230.6,28.4,247.2,58.8,244.3,60.6,243.1,59.4,237.8,73.2,234.8,95.8,226.5,88.1,198,79.7,194.5,62.4,201];
const LNK1 = [113.2,-81.3,79.7,-131.7,42.1,-106.2,57,-85.4,67.2,-59.9];
const LNK2 = [141.8,26.1,125.7,-20.2,92.9,-5.4,112,34.9];
const NWING = [167.5,208.7,168.7,182.6,167.5,158.3,163.9,123.3,159.1,100.8,153.8,79.4,141.2,83,138.8,75.3,130.5,77.6,143.6,131,147.2,169.6,147.2,207.5];
const CPN = [-134.6,157.1,-134.6,145.2,-115.5,145.2,-111.3,136.4,-131,100.2,-138.8,99.6,-138.8,113.2,-145.9,113.2,-153.1,129.8,-141.2,157.1];
const SHORE = [-296.7,-169.4,-281,-145.4,-270.5,-135.6,-243.5,-116.9,-234.2,-107.1,-187.7,-38.4,-183.5,-20.1,-182.5,1.4,-176.7,19.1,-170.7,31.4,-162.5,44.4,-154.7,54.9,-125,78.9,-105.5,92.1,-103.5,107.4,-96.7,123.4,-94,145.4];
const KIOSK = [[-83.9,87.1,-79.1,97.8,-74.3,95.4,-79.1,85.4], [-99.4,55.1,-92.8,68.7,-87.4,67,-94,52.7]];
LANDMARKS.mbs = {zh:'滨海湾金沙', en:'Marina Bay Sands', cat:'new', r:322, h:202, water:true, lt:{m:1, c:'#ffe3b8', k:0.7, anim:'show', c2:'#ff5ad8'}, build(){
  const g = new THREE.Group(), B = mkB(), r = LMCTX.rng;
  // towers: 58 m along the axis (real footprints), west leg 15 m deep and vertical, east leg 16-19.5 m curving in to meet it
  // at level 23 (~79 m) over the glazed atrium; ~31 m deep above the join, ~55 m at the base. The SkyPark (38 m) overhangs.
  const TOP = 194, HW = 28.5, OX = -1, WL = 15, YJ = 79;
  const GLW = {c:'#bcc8cd', ds:true, fh:3.45, cw:2.1}, BAND = {c:'#eef0ec', ds:true, m:0, lk:0.3};
  const ATR = {c:'#86a0ab', ds:true, m:0, lk:0.1, glow:'#ffe2b8', gk:0.45}, WHITE = {c:'#f2f2ee', ds:true, m:0, lk:0.45, glow:'#fff1d6', gk:0.12};
  const CONC = {c:'#d4d1c9', ds:true, m:0, lk:0.3}, DECK = {c:'#a99d88', ds:true, m:0, lk:0.25}, POOL = {c:'#4fb3d6', ds:true, glow:'#46d6ff', gk:0.75};
  const GREEN = {c:'#5f8f47', ds:true, m:0, lk:0.15}, TRUNK = {c:'#a99d88', ds:true, m:0, lk:0.25}, HULL = {c:'#dfe2e4', ds:true, m:0, lk:0.4, glow:'#d6e6ff', gk:0.5}, LITE = {c:'#e9e6dc', ds:true, glow:'#fff3d8', gk:1.3};
  const DKG = {c:'#7d94a0', ds:true, m:0, lk:0.12, glow:'#ffe0b0', gk:0.5}, SKY = {c:'#a3bfca', ds:true, m:0, lk:0.1, glow:'#ffe2b5', gk:0.4};
  const PAVE = {c:'#cbc3b2', ds:true, m:0, lk:0.2}, CRYS = {c:'#a6c5d2', ds:true, glow:'#d9ecff', gk:0.5}, ROOFW = {c:'#e6e4dd', ds:true, m:0, lk:0.3};
  const GAPW = y => y < YJ ? 21*Math.pow(1 - y/YJ, 1.5) : 0, gap = GAPW;
  const thick = y => 16 + 3.5*Math.pow(1 - y/TOP, 2);
  const X = F => toXZ(F, OE, ON), YP = -3.4;

  // ---------------- SkyPark centreline (the real, gently curved hotel axis) ----------------
  const tab = []; { let s = 0, pn = NS0, pe = cE(NS0); for (let n = NS0; n <= NS1 + 1e-6; n += 1){ const e = cE(n); s += Math.hypot(e - pe, n - pn); tab.push([n, s]); pn = n; pe = e; } }
  const LEN = tab[tab.length - 1][1];
  const nAt = t => { const s = clamp01(t)*LEN; let i = 1; while (i < tab.length - 1 && tab[i][1] < s) i++; const a = tab[i-1], b = tab[i]; return a[0] + (b[0] - a[0])*(s - a[1])/Math.max(1e-6, b[1] - a[1]); };
  const tAt = n => { let i = 1; while (i < tab.length - 1 && tab[i][0] < n) i++; return tab[i][1]/LEN; };
  const frame = t => { const n = nAt(t), e = cE(n), de = dE(n), l = Math.hypot(de, 1), TE = de/l, TN = 1/l;
    return {p:[e - OE, ON - n], T:[TE, -TN], A:[TN, TE]}; };           // A = across, towards the east (local x, z)
  const M = (t, a, y) => { const f = frame(t); return [f.p[0] + f.A[0]*a, y, f.p[1] + f.A[1]*a]; };

  // ---------------- the three hotel towers, each on the real axis at its own bearing ----------------
  const tower = (n0, ti) => {
    const gap = y => GAPW(y)*[1.06, 0.96, 0.86][ti];                    // the site narrows northwards: the legs splay less
    const tg = new THREE.Group(), TB = mkB(), pb = TB.p(BAND), pw = TB.p(WHITE), zc = 0, XW = OX - WL;
    LBox(tg, WL, TOP, 2*HW, OX - WL/2, 0, zc, GLW);                       // west leg (vertical)
    const secs = [];
    for (let k = 0; k <= 30; k++){ const y = TOP*k/30, xi = OX + gap(y), xo = xi + thick(y); secs.push([[xi, y, zc - HW], [xo, y, zc - HW], [xo, y, zc + HW], [xi, y, zc + HW]]); }
    LLoft(tg, secs, GLW, true);                                         // east leg, curving in to the join
    // glazed atrium walls between the legs at both ends, with their transoms and mullions
    const ap = [[0, 0]]; for (let k = 0; k <= 16; k++){ const y = YJ*k/16; ap.push([gap(y) + 0.2, y]); }
    for (const s of [-1, 1]){ LShape(tg, ap, 0.6, OX, 0, zc + s*(HW - 1.2), ATR);
      for (let y = 6; y < YJ - 2; y += 6.9){ const x1 = OX + gap(y); if (x1 - OX > 1) quadP(pb, [OX, y, zc + s*(HW - 0.85)], [x1, y, zc + s*(HW - 0.85)], [x1, y + 0.5, zc + s*(HW - 0.85)], [OX, y + 0.5, zc + s*(HW - 0.85)]); }
      for (let x = 3.5; x < 21; x += 3.5){ let yt = 0; while (yt < YJ && gap(yt) > x) yt += 1; segP(pb, [OX + x, 0, zc + s*(HW - 0.8)], [OX + x, yt, zc + s*(HW - 0.8)], 0.14, 3); } }
    // floor bands (white spandrels) on every storey, all faces
    for (let y = 3.45; y < TOP - 1.5; y += 3.45){
      const xo = OX + gap(y) + thick(y) + 0.12, xw = XW - 0.12, bh = 0.7;
      quadP(pb, [xw, y, zc - HW], [xw, y, zc + HW], [xw, y + bh, zc + HW], [xw, y + bh, zc - HW]);
      quadP(pb, [xo, y, zc - HW], [xo, y, zc + HW], [xo, y + bh, zc + HW], [xo, y + bh, zc - HW]);
      for (const s of [-1, 1]){ const z = zc + s*(HW + 0.12); quadP(pb, [xw, y, z], [OX, y, z], [OX, y + bh, z], [xw, y + bh, z]); quadP(pb, [OX + gap(y), y, z], [xo, y, z], [xo, y + bh, z], [OX + gap(y), y + bh, z]); }
      // the atrium-side faces of the legs below the join
      if (y < YJ - 1){ const xg = OX + gap(y) - 0.12; if (gap(y) > 1.5){ quadP(pb, [OX + 0.12, y, zc - HW], [OX + 0.12, y, zc + HW], [OX + 0.12, y + bh, zc + HW], [OX + 0.12, y + bh, zc - HW]); quadP(pb, [xg, y, zc - HW], [xg, y, zc + HW], [xg, y + bh, zc + HW], [xg, y + bh, zc - HW]); } }
    }
    // vertical mullions: paired every 4.1 m on the long faces, every 3.4 m on the ends
    for (let dz = -HW + 1.9; dz < HW; dz += 4.1){ for (const o of [0, 1.1]){ segP(pb, [XW - 0.2, 0, zc + dz + o], [XW - 0.2, TOP - 2, zc + dz + o], 0.12, 3);
      const P = []; for (let k = 0; k <= 18; k++){ const y = (TOP - 2)*k/18; P.push([OX + gap(y) + thick(y) + 0.2, y, zc + dz + o]); } polyP(pb, P, 0.12, 3); } }
    for (const s of [-1, 1]){ const z = zc + s*(HW + 0.25);
      for (let x = -WL + 2; x < 0; x += 3.4) segP(pb, [OX + x, 0, z], [OX + x, TOP - 2, z], 0.13, 3);
      const inner = [], outer = [], mid = []; for (let k = 0; k <= 24; k++){ const y = TOP*k/24; inner.push([OX + gap(y) + 0.5, y, z + s*0.15]); outer.push([OX + gap(y) + thick(y) - 0.5, y, z + s*0.15]); for (const f of [0.3, 0.55, 0.8]) mid.push([f, OX + gap(y) + thick(y)*f, y]); }
      for (const f of [0.3, 0.55, 0.8]){ const P = mid.filter(q => q[0] === f).map(q => [q[1], q[2], z]); polyP(pb, P, 0.13, 3); }
      // white edge frames of the legs (the strong outline of the 'cards')
      polyP(pw, inner, 0.6, 4); polyP(pw, outer, 0.6, 4); segP(pw, [XW + 0.4, 0, z + s*0.15], [XW + 0.4, TOP, z + s*0.15], 0.6, 4); segP(pw, [OX - 0.4, 0, z + s*0.15], [OX - 0.4, TOP, z + s*0.15], 0.5, 4); }
    // east facade: deep planted terraces with white fascias on every floor (bougainvillea planters following the curved leg)
    { const gp = TB.p(GREEN); for (let y = 3.45; y < TOP - 4; y += 3.45){ const xo = OX + gap(y) + thick(y) + 0.12, z0 = zc - HW + 0.6, z1 = zc + HW - 0.6;
      quadP(gp, [xo, y + 0.72, z0], [xo, y + 0.72, z1], [xo + 1.5, y + 0.72, z1], [xo + 1.5, y + 0.72, z0]);
      quadP(pb, [xo + 1.5, y - 0.1, z0], [xo + 1.5, y - 0.1, z1], [xo + 1.5, y + 0.85, z1], [xo + 1.5, y + 0.85, z0]);
      quadP(pb, [xo, y - 0.1, z0], [xo, y - 0.1, z1], [xo + 1.5, y - 0.1, z1], [xo + 1.5, y - 0.1, z0]); } }
    // roof slab under the SkyPark
    LBox(tg, WL + thick(TOP) + 1, 1.2, 2*HW + 1, OX + (thick(TOP) - WL)/2, TOP - 0.6, zc, WHITE);
    LBox(tg, WL + gap(0) + thick(0) + 4, 5.2, 2*HW + 3, OX + (gap(0) + thick(0) - WL)/2, -5, 0, CONC);   // plinth under both legs
    TB.flush(tg);
    const e = cE(n0), brg = Math.atan(dE(n0));
    tg.position.set(e - OE, 0, ON - n0); tg.rotation.y = -brg; g.add(tg);
  };
  TWR.forEach((n0, ti) => tower(n0, ti));
  const tT = TWR.map(tAt);

  // hotel links (glazed lobby atria) between the towers and the north wing, from the real footprints
  for (const F of [LNK1, LNK2]){ const P = X(F); LPoly(g, P, -5, 22, ATR); LPoly(g, offRing(P, -1.5), 17, 0.6, WHITE); edgeFins(B.p(BAND), P, 0, 17, 3.5, 0.3, 0.3); }
  { const P = X(NWING); LPoly(g, P, -5, 23, CONC); edgeBands(B.p(DKG), P, 1, 6, 0.1); for (let y = 8; y < 17; y += 4.5) edgeBands(B.p(DKG), P, y, y + 2.4, 0.1); }
  // porte-cochere: the undulating white canopy along the towers' west side, on columns
  { const o = B.p(WHITE), t0 = tT[0] - 0.08, t1 = tT[2] + 0.08, nK = 30;
    for (let k = 0; k < nK; k++){ const ta = lerp(t0, t1, k/nK), tb = lerp(t0, t1, (k+1)/nK), ya = 10 + 1.2*Math.sin(k/nK*PI*6), yb = 10 + 1.2*Math.sin((k+1)/nK*PI*6);
      quadP(o, M(ta, OX - 34, ya - 0.6), M(ta, OX - 17, ya + 0.6), M(tb, OX - 17, yb + 0.6), M(tb, OX - 34, yb - 0.6)); }
    for (let k = 0; k <= 12; k++){ const t = lerp(t0 + 0.01, t1 - 0.01, k/12); segP(B.p(CONC), M(t, OX - 30, -1), M(t, OX - 30, 9.5), 0.45, 8); }
    for (let k = 0; k < 3; k++) LPoly(g, [M(tT[k] - 0.07, OX - 17, 0), M(tT[k] + 0.07, OX - 17, 0), M(tT[k] + 0.07, OX - 36, 0), M(tT[k] - 0.07, OX - 36, 0)].map(p => [p[0], p[2]]), -5, 5.3, PAVE); }

  // ---------------- SkyPark ----------------
  const sk = t => { let hw = 19.5; if (t < 0.03) hw = 14 + 5.5*Math.sin(t/0.03*HP); if (t > 0.79) hw = 19.5 - 10.5*Math.pow((t - 0.79)/0.21, 1.4);
    const yb = 190.5 - 2.5*Math.sin(PI*Math.min(1, t/0.8)) + (t > 0.8 ? 5.5*(t - 0.8)/0.2 : 0); return {hw, yb}; };
  const pw = B.p(WHITE), pl = B.p(LITE), pb = B.p(BAND);
  const secs = [], NS = 64, WE = [], EE = [];
  for (let k = 0; k <= NS; k++){ const t = k/NS, s = sk(t), P = (a, y) => M(t, a, y);
    secs.push([P(-s.hw, 200.5), P(-s.hw - 0.7, 197.6), P(-s.hw*0.72, s.yb + 1.6), P(0, s.yb), P(s.hw*0.72, s.yb + 1.6), P(s.hw + 0.7, 197.6), P(s.hw, 200.5)]);
    WE.push(M(t, -s.hw + 0.6, 0)); EE.push(M(t, s.hw - 0.6, 0)); }
  LLoft(g, secs, HULL, true); capP(B.p(HULL), secs[0]);
  for (let k = 1; k < NS; k += 2) polyP(B.p(CONC), secs[k].slice(1, 6).map(p => [p[0], p[1] - 0.25, p[2]]), 0.22, 3);
  polyP(pl, secs.map(s => [s[1][0], s[1][1], s[1][2]]), 0.3, 4); polyP(pl, secs.map(s => [s[5][0], s[5][1], s[5][2]]), 0.3, 4);
  polyP(pl, secs.map(s => [s[0][0], s[0][1] + 0.05, s[0][2]]), 0.18, 4); polyP(pl, secs.map(s => [s[6][0], s[6][1] + 0.05, s[6][2]]), 0.18, 4);
  LPoly(g, [...WE.map(p => [p[0], p[2]]), ...EE.slice().reverse().map(p => [p[0], p[2]])], 200.5, 0.35, DECK);
  const strip = (t0, t1, f0, f1, y, h, col) => { const P = [], Q = []; for (let k = 0; k <= 16; k++){ const t = lerp(t0, t1, k/16), s = sk(t), a = M(t, -s.hw + 2*s.hw*f0, 0), b = M(t, -s.hw + 2*s.hw*f1, 0); P.push([a[0], a[2]]); Q.push([b[0], b[2]]); } return LPoly(g, [...P, ...Q.reverse()], y, h, col); };
  for (const [t0, t1] of [[0.1, 0.24], [0.255, 0.395], [0.41, 0.54]]){ strip(t0, t1, 0.03, 0.27, 200.55, 0.55, POOL); strip(t0, t1, 0.27, 0.3, 200.5, 0.9, BAND); }
  strip(0.1, 0.54, 0.0, 0.03, 200.5, 1.0, CRYS);
  strip(0.04, 0.76, 0.62, 0.95, 200.6, 0.9, GREEN);
  strip(0.58, 0.76, 0.04, 0.5, 200.6, 0.5, PAVE);
  strip(0.79, 0.985, 0.06, 0.94, 200.6, 0.35, DECK);                     // the observation deck on the cantilever
  for (let k = 0; k < 40; k++){ const t = 0.05 + 0.7*k/39, s = sk(t), p = M(t, s.hw*(0.42 + 0.42*r()), 201.4); treeP(B, p[0], p[1], p[2], 0.9 + 0.3*r(), r, TRUNK, GREEN); }
  for (let k = 0; k < 18; k++){ const t = 0.11 + 0.42*k/17, s = sk(t), p = M(t, -s.hw*0.36, 200.9); palm(B, p[0], p[1], p[2], 6.5, r, TRUNK, GREEN); }
  const pav = (t, a, w, d, h) => { const f = frame(t), p = M(t, a, 0), ry = Math.atan2(-f.A[1], f.A[0]); boxP(B.p(DKG), w, h, d, p[0], 200.8, p[2], ry); boxP(pw, w + 3, 0.6, d + 3, p[0], 200.8 + h, p[2], ry); };
  pav(0.06, 6, 14, 16, 4.5); for (const t of [0.3, 0.47]) pav(t, 7, 12, 10, 4); for (const t of [0.6, 0.67, 0.74]) pav(t, 4, 16, 14, 4.5);
  { const rl = B.p(CRYS); for (let k = 0; k < NS; k++){ const a = secs[k], b = secs[k+1]; for (const i of [0, 6]){ const p = a[i], q = b[i]; quadP(rl, [p[0], 200.8, p[2]], [q[0], 200.8, q[2]], [q[0], 202.2, q[2]], [p[0], 202.2, p[2]]); } } }

  // a stepped 'wave' roof strip: a curved metal shell rising across the strip from its south edge to a glazed north-light
  // clerestory on its north edge (sections at right angles to the strip's long axis)
  const waveRoof = (Q, y0, top) => {
    const c = cen(Q); let sxx = 0, szz = 0, sxz = 0; for (const p of Q){ const dx = p[0]-c[0], dz = p[1]-c[1]; sxx += dx*dx; szz += dz*dz; sxz += dx*dz; }
    const an = 0.5*Math.atan2(2*sxz, sxx - szz), u = [Math.cos(an), Math.sin(an)]; let v = [-u[1], u[0]]; if (v[1] > 0) v = [-v[0], -v[1]];   // v points north
    let u0 = 1e9, u1 = -1e9; for (const p of Q){ const pu = (p[0]-c[0])*u[0] + (p[1]-c[1])*u[1]; u0 = Math.min(u0, pu); u1 = Math.max(u1, pu); }
    const NU = Math.max(4, Math.round((u1 - u0)/7)), NV = 6, rf = B.p(ROOFW), gl = B.p(SKY), st = [];
    for (let i = 0; i <= NU; i++){ const uu = lerp(u0 + 0.4, u1 - 0.4, i/NU); let a = 1e9, b = -1e9;
      for (let k = 0; k < Q.length; k++){ const p = Q[k], q = Q[(k+1) % Q.length], pu = (p[0]-c[0])*u[0] + (p[1]-c[1])*u[1], qu = (q[0]-c[0])*u[0] + (q[1]-c[1])*u[1];
        if ((pu - uu)*(qu - uu) > 0 || pu === qu) continue; const t = (uu - pu)/(qu - pu), px = lerp(p[0], q[0], t), pz = lerp(p[1], q[1], t), pv = (px-c[0])*v[0] + (pz-c[1])*v[1]; a = Math.min(a, pv); b = Math.max(b, pv); }
      if (b - a < 0.5) continue;
      const W = (s, y) => { const vv = lerp(a, b, s); return [c[0] + u[0]*uu + v[0]*vv, y, c[1] + u[1]*uu + v[1]*vv]; }, R = [];
      for (let j = 0; j <= NV; j++){ const s = j/NV; R.push(W(s, y0 + (top - y0)*(1 - (1 - s)*(1 - s)))); }
      st.push({R, lo:W(1, top - 2.6), b0:W(1, y0), a0:W(0, y0)}); }
    for (let i = 0; i < st.length - 1; i++){ const A = st[i], Bq = st[i+1];
      for (let j = 0; j < A.R.length - 1; j++) quadP(rf, A.R[j], A.R[j+1], Bq.R[j+1], Bq.R[j]);
      quadP(gl, A.R[A.R.length - 1], Bq.R[Bq.R.length - 1], Bq.lo, A.lo); quadP(rf, A.lo, Bq.lo, Bq.b0, A.b0); }
    for (const S of [st[0], st[st.length - 1]]) if (S) capP(rf, [S.a0, ...S.R, S.b0]);
  };
  // ---------------- west of Bayfront Avenue: The Shoppes, the casino, the theatres and the Sands Expo on their real plans ----------------
  const shop = X(SHOP);
  LPoly(g, shop, -5, 20, CONC); LPoly(g, shop, 14.95, 0.15, ROOFW);
  edgeBands(B.p(DKG), shop, 0.4, 13.2, 0.1);
  edgeFins(pb, shop, 0.4, 14.5, 4.5, 0.4, 0.3);
  edgeBands(pb, shop, 5.4, 6.0, 0.25); edgeBands(pb, shop, 14.2, 15.4, 0.15);
  for (const [OUT, SL] of [[CAS_OUT, CAS_SL], [THE_OUT, THE_SL], [EXP_OUT, EXP_SL]]){
    const P = X(OUT); LPoly(g, P, -5, 30, CONC);
    edgeBands(B.p(DKG), P, 0.4, 6.0, 0.1); for (let y = 9; y < 23; y += 4.6) edgeBands(B.p(SKY), P, y, y + 1.6, 0.08);
    edgeBands(pb, P, 24.4, 25.6, 0.15);
    for (const [top, F] of SL) waveRoof(X(F), 24.6, top);
  }
  // the Rain Oculus: the acrylic bowl in the roof of the mall
  { const q = X([-120, -9])[0]; LLathe(g, [[2, 13], [6, 14.5], [9, 16], [11, 17.4], [11.4, 17.8]], q[0], 0, q[1], CRYS, 32); LRing(g, 11.2, 11.2, 12.4, 12.4, 15.0, 18.2, WHITE, 32, 0, TAU).position.set(q[0], 0, q[1]); }
  // waterfront promenade and the Event Plaza steps down from the mall to the bay
  { const P = [...X(SHORE), ...X([-60,150, -95,70, -140,-30, -200,-120, -270,-185])];
    LPoly(g, P, -5.6, 5.6 + YP, PAVE);
    const S = X(SHORE); for (let i = 0; i < S.length - 1; i++){ const a = S[i], b = S[i+1], L = Math.hypot(b[0]-a[0], b[1]-a[1]), ux = (b[0]-a[0])/L, uz = (b[1]-a[1])/L;
      segP(B.p('#5c6064'), [a[0], YP + 1.1, a[1]], [b[0], YP + 1.1, b[1]], 0.06, 4);
      for (let d = 6; d < L; d += 14){ const x = a[0] + ux*d - uz*7, z = a[1] + uz*d + ux*7; if (d % 28 < 14) treeP(B, x, YP, z, 1.25, r, TRUNK, GREEN); else { segP(B.p('#5c6064'), [x, YP, z], [x, YP + 5, z], 0.08, 5); boxP(B.p(LITE), 0.5, 0.5, 0.5, x, YP + 5, z, 0); } } }
    const a = X([-148.3, -46.3])[0], b = X([-114.3, 33.8])[0], L = Math.hypot(b[0]-a[0], b[1]-a[1]), ux = (b[0]-a[0])/L, uz = (b[1]-a[1])/L, nx = uz, nz = -ux;
    for (let k = 0; k < 7; k++){ const d0 = k*2.6, h = YP + (7 - k)*(-YP/7); LPoly(g, [[a[0] + nx*d0, a[1] + nz*d0], [b[0] + nx*d0, b[1] + nz*d0], [b[0] + nx*(d0 + 2.7), b[1] + nz*(d0 + 2.7)], [a[0] + nx*(d0 + 2.7), a[1] + nz*(d0 + 2.7)]], -5, 5 + h, k % 2 ? PAVE : CONC); } }
  // F&B pavilions on the promenade
  for (const F of KIOSK){ const P = X(F); LPoly(g, P, YP - 1, 5.6, DKG); LPoly(g, offRing(P, 0.8), YP + 4.6, 0.4, WHITE); }
  { const P = X([91.1,118.6,94.7,139.3,100,138.7,96.4,117.4]); LPoly(g, P, -5, 10.4, DKG); LPoly(g, offRing(P, 0.8), 5.4, 0.4, WHITE); }   // glazed entrance pavilion by Bayfront Avenue
  // Crystal Pavilion North standing in the bay, on its platform with the access bridge
  { const P = X(CPN); LPoly(g, P, -5.6, 5.6 + YP + 0.4, PAVE);
    const c = cen(P), s = 1.1, R = rotP(c[0], c[1], 0.5), base = [[-14, -11], [12, -13], [16, 6], [-4, 14], [-16, 4]].map(p => [p[0]*s, p[1]*s]), H = 21*s, y0 = YP + 0.4;
    const bp = base.map(p => { const q = R(p[0], 0, p[1]); return [q[0], y0, q[2]]; }), tp = base.map((p, i) => { const q = R(p[0]*(0.42 + 0.08*(i % 2)) + 1.5*s, 0, p[1]*0.45 - 1.5*s); return [q[0], y0 + H*(0.85 + 0.15*(i % 3)/2), q[2]]; }), apx = (q => [q[0], y0 + H + 6*s, q[2]])(R(2*s, 0, -2*s));
    const T = []; for (let i = 0; i < 5; i++){ const j = (i+1) % 5; T.push(...bp[i], ...bp[j], ...tp[j], ...bp[i], ...tp[j], ...tp[i], ...tp[i], ...tp[j], ...apx); } LTris(g, T, CRYS);
    for (let i = 0; i < 5; i++){ const j = (i+1) % 5; segP(pb, bp[i], tp[i], 0.3, 4); segP(pb, tp[i], apx, 0.3, 4); segP(pb, tp[i], tp[j], 0.3, 4);
      for (let q = 1; q < 4; q++) segP(pb, mix(bp[i], bp[j], q/4), mix(tp[i], tp[j], q/4), 0.12, 3); } }
  // the glass sphere pavilion on the water by the Event Plaza (former Crystal Pavilion South)
  { const q = X([-244.4, -71.5])[0], Rs = 16.6, yc = YP - 3.2;
    LDome(g, Rs, q[0], yc, q[1], CRYS, 1, 32);
    const o = B.p(WHITE); for (let i = 0; i < 16; i++){ const a = i/16*TAU, P = []; for (let k = 0; k <= 10; k++){ const f = k/10*HP*0.98, rr = Math.cos(f)*Rs*1.004; P.push([q[0] + Math.cos(a)*rr, yc + Math.sin(f)*Rs*1.004, q[1] + Math.sin(a)*rr]); } polyP(o, P, 0.18, 3); }
    for (const y of [3, 7, 11]){ const rr = Math.sqrt(Math.max(0, Rs*Rs - y*y))*1.004, P = []; for (let i = 0; i <= 32; i++){ const a = i/32*TAU; P.push([q[0] + Math.cos(a)*rr, yc + y, q[1] + Math.sin(a)*rr]); } polyP(o, P, 0.15, 3); }
    LCyl(g, Rs + 2.5, Rs + 2.5, 1.5, q[0], YP - 1.5, q[1], PAVE, 32); }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'mbs', lat:1.283979 + ON/110574, lon:103.859765 + OE/111290.5, rot:0});
}
// ======================================================================================================
// ArtScience Museum
// ======================================================================================================
{
// ===== ArtScience Museum (Safdie, 2011): ten white 'fingers' rising from a round bowl on a central drum, over a lily pond.
// The tallest fingers (~55-60 m) face local +x; placed so they lean towards Marina Bay Sands, the hand opening to the bay.
LANDMARKS.artscience = {zh:'艺术科学博物馆', en:'ArtScience Museum', cat:'new', r:52, h:60, water:true, lt:{m:0, c:'#fff1de', k:1.05, e:0.7, anim:'cycle', c2:'#ffcf7a'}, build(){
  // Safdie, 2011: ten petal 'fingers' of unequal length rising from one fluted white bowl, skinned in fibre-reinforced polymer,
  // each fingertip cut off by a skylight; the dish between the fingers drains to a central oculus; the bowl stands on a small
  // glazed drum in the lily pond. The tallest finger (~60 m) faces local +x.
  const g = new THREE.Group(), B = mkB(), r = LMCTX.rng;
  const SKIN = {c:'#f2f1ec', ds:true}, SEAM = {c:'#cfcec6', ds:true}, TIP = {c:'#8fa6ae', glow:'#ffe2b8', gk:0.75, ds:true}, RIM = {c:'#e4e2da', ds:true};
  const GLS = {c:'#5f7480', glow:'#ffd9a6', gk:0.5, ds:true}, POND = {c:'#6f9fb4', glow:'#18303c', gk:0.5}, PAD = {c:'#6f9a55', ds:true}, STONE = {c:'#d6d1c4', ds:true}, STEEL = {c:'#7c8286', ds:true};
  // the lily pond and its stone rim, lily pads
  LCyl(g, 44, 44, 0.35, 0, 0, 0, POND, 56); LRing(g, 44, 44, 45.5, 45.5, -1, 0.75, STONE, 56, 0, TAU);
  { const pad = B.p(PAD); for (let k = 0; k < 90; k++){ const a = r()*TAU, d = 17 + r()*25, x = Math.cos(a)*d, z = Math.sin(a)*d, sz = 0.6 + r()*1.0; for (let i = 0; i < 7; i++){ const t0 = i/7*TAU, t1 = (i+1)/7*TAU; pad.push(x, 0.42, z, x + Math.cos(t0)*sz, 0.42, z + Math.sin(t0)*sz, x + Math.cos(t1)*sz, 0.42, z + Math.sin(t1)*sz); } } }
  // round island, glazed lobby drum and the steel 'basket' under the bowl
  LCyl(g, 15.5, 15.5, 1.2, 0, -0.6, 0, STONE, 40);
  LCyl(g, 11.5, 11.5, 6.2, 0, 0.6, 0, GLS, 40);
  { const o = B.p(STEEL); for (let i = 0; i < 20; i++){ const a = i/20*TAU; segP(o, [Math.cos(a)*11.7, 0.6, Math.sin(a)*11.7], [Math.cos(a)*11.7, 6.8, Math.sin(a)*11.7], 0.12, 4); }
    for (let i = 0; i < 16; i++){ const a = i/16*TAU, b = a + 0.5; segP(o, [Math.cos(a)*9, 6.5, Math.sin(a)*9], [Math.cos(b)*15, 11.5, Math.sin(b)*15], 0.35, 5); } }
  LLathe(g, [[0, 6.4], [10.5, 6.5], [12.5, 7.0], [15.5, 8.6], [19, 11.0], [22.5, 13.8], [25, 16.0]], 0, 0, 0, SKIN, 40);   // the bowl under the finger roots
  // the ten fingers: centre line leaves the drum steeply outward and bends up towards the tip; full-sector wide at the root
  // (so the roots merge into one fluted bowl), tapering to the ~7 m skylit tip; flattened lens sections, cupped on the inside
  const NF = 10, ps = B.p(SEAM), tc = B.p(TIP), rc = B.p(RIM);
  for (let i = 0; i < NF; i++){
    const phi = i/NF*TAU + 0.31, f = 0.5 + 0.5*Math.cos(phi), jit = (r() - 0.5)*0.12;
    const L = 37 + 27*Math.pow(f, 1.2) + jit*16, th0 = 1.0 - 0.1*f, th1 = 0.5 - 0.24*f + jit, r0 = 8.5, y0 = 6.8;
    const dh = [Math.cos(phi), Math.sin(phi)], NS = 18;
    // integrate the centre line
    const C = [], TH = []; { let rr = r0, yy = y0; for (let k = 0; k <= NS; k++){ const sv = k/NS, th = th0 + (th1 - th0)*Math.pow(sv, 0.85); C.push([rr, yy]); TH.push(th); rr += Math.sin(th)*L/NS; yy += Math.cos(th)*L/NS; } }
    const frameAt = k => { const sv = k/NS, [rr, yy] = C[k], th = TH[k], c = [dh[0]*rr, yy, dh[1]*rr];
      const Nn = [-Math.cos(th)*dh[0], Math.sin(th), -Math.cos(th)*dh[1]];                 // inner (upper) normal of the finger
      const Wd = [-dh[1], 0, dh[0]];
      const wSector = TAU*rr/NF*0.5*1.04, wTip = 4.4 + 1.3*f, wMid = Math.min(wSector, 8.2), w = sv < 0.38 ? wSector : lerp(Math.min(TAU*C[Math.round(0.38*NS)][0]/NF*0.5*1.02, 8.2), wTip, Math.pow((sv - 0.38)/0.62, 1.5));
      const t = lerp(3.4, 1.9, sv);
      return {c, Nn, Wd, w: Math.max(w, wTip), t, flare: 0.3*Math.max(0, 1 - sv/0.45)}; };
    const Fr = []; for (let k = 0; k <= NS; k++) Fr.push(frameAt(k));
    const pt = (F, u) => { const a = u*TAU, ca = Math.cos(a), sa = Math.sin(a), q1 = Math.sign(ca)*Math.pow(Math.abs(ca), 0.42), q2 = Math.sign(sa)*Math.pow(Math.abs(sa), 1.1);
      const cup = (sa > 0 ? -0.85 : -1.1)*(1 - q1*q1)*F.t*0.45;                            // cupped inner face, rounded (bulging) underside
      const ww = F.w*(1 - F.flare*q2);                                                       // the underside of the roots is wider: one fluted bowl
      return [F.c[0] + F.Wd[0]*ww*q1 + F.Nn[0]*(F.t*q2 + cup), F.c[1] + F.Nn[1]*(F.t*q2 + cup), F.c[2] + F.Wd[2]*ww*q1 + F.Nn[2]*(F.t*q2 + cup)]; };
    surf(g, 20, NS, (u, v) => pt(Fr[Math.round(v*NS)], u), SKIN);
    // panel seams along the finger and across it every few metres
    for (const u of [0.0, 0.5, 0.18, 0.32, 0.68, 0.82]){ const P = []; for (let k = 2; k <= NS; k++){ const p = pt(Fr[k], u); P.push(p); } polyP(ps, P, 0.09, 3); }
    for (let k = 4; k < NS; k += 3){ const P = []; for (let j = 0; j <= 20; j++) P.push(pt(Fr[k], j/20)); polyP(ps, P, 0.07, 3); }
    // the skylight at the cut fingertip, with its white rim
    const tipL = []; for (let j = 0; j < 20; j++) tipL.push(pt(Fr[NS], j/20));
    const T = [Math.sin(TH[NS])*dh[0], Math.cos(TH[NS]), Math.sin(TH[NS])*dh[1]];
    capP(tc, tipL.map(p => [p[0] + T[0]*0.05, p[1] + T[1]*0.05, p[2] + T[2]*0.05]));
    polyP(rc, [...tipL, tipL[0]].map(p => [p[0] + T[0]*0.1, p[1] + T[1]*0.1, p[2] + T[2]*0.1]), 0.28, 4);
  }
  // the dish between the finger roots, draining to the central oculus
  LLathe(g, [[2.2, 9.4], [6, 9.9], [10, 10.7], [13.5, 11.4]], 0, 0, 0, SKIN, 40);
  LCyl(g, 2.2, 2.2, 0.3, 0, 9.2, 0, GLS, 20);
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'artscience', lat:1.2862 - 10/110574, lon:103.8592 - 3/111290.5, rot:-0.50});
}
}
