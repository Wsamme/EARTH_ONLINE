// ---------- Changi Airport: Jewel Changi Airport (Safdie, 2019) and the Changi Airport control tower (1981) ----------
// Block-scoped: only LANDMARKS and SG_PLACES are touched. Real dimensions in metres; y = 0 is the ground.
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

LANDMARKS.jewel = {zh:'星耀樟宜', en:'Jewel Changi Airport', cat:'new', r:116, h:38, lt:{m:0, c:'#d6ecff', k:0.4, e:0.6}, build(){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
  const OX = JW.OX, OZ = JW.OZ;
  // ---- materials
  const GLASS = {c:'#86a6b4', op:0.54, glow:'#6fa9e6', gk:0.14, lk:0.12};
  const STEEL = '#eef2f2', SLAB = {c:'#e7e5df', glow:'#ffe6c4', gk:0.45}, CONC = '#aeaba3', PAVE = '#d3cec3';
  const SHOP = {c:'#55656c', glow:'#ffd09a', gk:1.1};
  const TERR = {c:'#4d7d37', glow:'#2a6a34', gk:0.7}, RISE = '#4f6844';
  const TREE1 = {c:'#2f6129', glow:'#2a7a44', gk:0.6}, TREE2 = {c:'#4a7f33', glow:'#3a8a3c', gk:0.6};
  const PARK = {c:'#5d8f45', glow:'#24502a', gk:0.45}, HEDGE = '#2f5a2c';
  const WATER = {c:'#e3f1f6', m:2, lk:0.95}, POOL = {c:'#86c6dc', glow:'#4cc3ff', gk:0.85};
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
    const pl = B.p(CONC); for (let i = 0; i < 96; i++){ const a = shellP(i/96, 1), b = shellP((i+1)/96, 1); quadP(pl, [a[0], -0.2, a[2]], [b[0], -0.2, b[2]], [b[0], 0.9, b[2]], [a[0], 0.9, a[2]]); } }

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
    const ap = B.p(CONC); for (let i = 0; i < NR; i++) ringQ(ap, i, rhoSh(i, 0.2), rhoSh(i + 1, 0.2), rhoSh(i, 0.2) + 1.6, rhoSh(i + 1, 0.2) + 1.6, 0.1); }
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
  { const wt = B.p(WATER), NW = 60, ytop = JW.YO - 0.6;
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

// ===================================================================================================================
// ===== Changi Airport control tower (1981, PWD architects): 78 m, the "cupcake" on a stick. A 16-sided shaft about 7 m
// across carries a 25 m head: a pleated cup flaring out from the shaft, a ring of equipment-room windows, the cab with
// 16 outward-leaning glass panels all round, a domed roof and the white radar radome on top.
LANDMARKS.changitower = {zh:'樟宜机场控制塔', en:'Changi Airport Control Tower', cat:'new', r:15, h:78, lt:{m:0, c:'#eef2ff', k:0.75, e:0.8}, build(){
  const g = new THREE.Group(), B = mkB();
  const W = '#eeede8', W2 = '#dcdbd5', GRY = '#8f9393';
  const CAB = {c:'#2d4648', glow:'#a8e8cf', gk:0.6}, BAND = {c:'#38474d', glow:'#ffe2ad', gk:0.5};
  const RED = {c:'#b02018', glow:'#ff2a1a', gk:2.4};
  const n = 16, a0 = PI/16, CX = 0, CZ = 0;
  const w = B.p(W), w2 = B.p(W2), cab = B.p(CAB), band = B.p(BAND), gr = B.p(GRY), red = B.p(RED);
  const loft = (out, prof, cap) => { for (let k = 0; k < prof.length - 1; k++) ngonP(out, n, prof[k][0], prof[k+1][0], prof[k][1], prof[k+1][1], CX, CZ, a0, cap && k === prof.length - 2 ? 1 : 0); };
  // entrance pavilion at the foot (16-sided, glazed band, canopy facing local +z)
  ngonP(w2, n, 8.2, 8.2, 0, 4.6, CX, CZ, a0, 1); ngonP(w, n, 8.7, 8.7, 4.6, 5.2, CX, CZ, a0, 1);
  ngonP(band, n, 8.3, 8.3, 0.9, 3.7, CX, CZ, a0, 0);
  boxP(w, 5.5, 0.35, 3.2, CX, 3.5, CZ + 9.4, 0); for (const s of [-1, 1]) segP(gr, [CX + s*2.5, 0, CZ + 10.6], [CX + s*2.5, 3.5, CZ + 10.6], 0.1, 4);
  // the 16-sided shaft, pilasters on alternate corners, the stair-window slot up the +z face
  ngonP(w, n, 3.65, 3.6, 5.2, 52, CX, CZ, a0, 0);
  for (let i = 0; i < n; i += 2){ const a = a0 + i/n*TAU; boxP(w2, 0.5, 46.4, 0.45, CX + Math.cos(a)*3.66, 5.2, CZ + Math.sin(a)*3.66, -a); }
  for (let y = 7.5; y < 50; y += 3.6) boxP(band, 0.7, 1.7, 0.2, CX, y, CZ + 3.55, 0);
  // the pleated cup: a bowl flaring from the shaft to the 25 m head, ribs on every corner
  const cup = []; for (let k = 0; k <= 8; k++){ const u = k/8; cup.push([3.6 + 9.0*Math.pow(u, 0.62), 50.5 + 10.5*u]); }
  loft(w, cup, false);
  for (let i = 0; i < n; i++){ const a = a0 + i/n*TAU, c = Math.cos(a), s = Math.sin(a); for (let k = 1; k < cup.length; k++) segP(w2, [CX + c*(cup[k-1][0] + 0.15), cup[k-1][1], CZ + s*(cup[k-1][0] + 0.15)], [CX + c*(cup[k][0] + 0.15), cup[k][1], CZ + s*(cup[k][0] + 0.15)], 0.24, 4); }
  // equipment floor: ribbon window, then the balcony ledge
  ngonP(w, n, 12.6, 12.6, 61.0, 63.4, CX, CZ, a0, 0);
  ngonP(band, n, 12.68, 12.68, 61.6, 62.9, CX, CZ, a0, 0);
  ngonP(w2, n, 13.25, 13.25, 63.4, 64.0, CX, CZ, a0, 1);
  // the cab: 16 outward-leaning glass panels, mullions, sill and head bands
  ngonP(cab, n, 11.4, 12.5, 64.0, 69.2, CX, CZ, a0, 0);
  ngonP(w2, n, 11.5, 11.5, 63.9, 64.5, CX, CZ, a0, 0);
  for (let i = 0; i < n; i++){ const a = a0 + i/n*TAU, c = Math.cos(a), s = Math.sin(a); segP(gr, [CX + c*11.45, 64, CZ + s*11.45], [CX + c*12.55, 69.2, CZ + s*12.55], 0.11, 4); }
  ngonP(w, n, 12.55, 13.0, 69.2, 70.0, CX, CZ, a0, 0);
  // domed roof rising to the radome base, catwalk rail at the eave
  const roof = []; for (let k = 0; k <= 6; k++){ const u = k/6; roof.push([lerp(13.0, 4.2, Math.pow(u, 0.8)), 70.0 + 2.6*Math.sin(u*HP)]); }
  loft(w2, roof, true);
  for (let i = 0; i < n; i++){ const a = a0 + i/n*TAU, b = a0 + (i + 1)/n*TAU, rr = 12.4, y = 70.2 + 0.35; segP(gr, [CX + Math.cos(a)*rr, y + 0.9, CZ + Math.sin(a)*rr], [CX + Math.cos(b)*rr, y + 0.9, CZ + Math.sin(b)*rr], 0.05, 3); segP(gr, [CX + Math.cos(a)*rr, y, CZ + Math.sin(a)*rr], [CX + Math.cos(a)*rr, y + 0.9, CZ + Math.sin(a)*rr], 0.04, 3); }
  ngonP(w, n, 3.4, 3.2, 72.6, 73.4, CX, CZ, a0, 1);
  LSph(g, 3.6, CX, 74.4, CZ, W, 1.0, 22);
  segP(gr, [CX, 77.9, CZ], [CX, 78.0, CZ], 0.05, 3);
  // antennae and dishes on the roof
  for (const [x, z, h] of [[8.0, 3.2, 5.0], [-8.0, -3.2, 4.4], [3.0, -8.2, 3.4], [-3.4, 7.8, 3.0]]){ const y = 70.6 + 1.6*(1 - Math.hypot(x, z)/13); segP(gr, [CX + x, y, CZ + z], [CX + x, y + h, CZ + z], 0.07, 4); }
  for (const [x, z] of [[6.8, -5.4], [-6.8, 5.4]]){ const y = 71.3; segP(gr, [CX + x, y, CZ + z], [CX + x, y + 1.1, CZ + z], 0.12, 4); LCyl(g, 0.9, 0.9, 0.18, CX + x, y + 1.1, CZ + z, W2, 12); }
  // aviation obstruction lights: radome mast, roof eave, mid-shaft
  boxP(red, 0.7, 0.6, 0.7, CX, 77.5, CZ, 0);
  for (let i = 0; i < 4; i++){ const a = i/4*TAU + PI/4; boxP(red, 0.65, 0.55, 0.65, CX + Math.cos(a)*12.9, 70.0, CZ + Math.sin(a)*12.9, 0); boxP(red, 0.55, 0.5, 0.55, CX + Math.cos(a)*3.8, 36, CZ + Math.sin(a)*3.8, 0); }
  B.flush(g);
  return g; }};

// ===== placements (WGS84); rot about +y; local +x east, +z south before turning
SG_PLACES.push(
  {type:'jewel',       lat:1.360222, lon:103.989750, rot:-0.4015},  // long axis bearing ~113 deg (ESE), oculus 12 m SSW of centre
  {type:'changitower', lat:1.359168, lon:103.989333, rot:-0.37}     // 16-sided; base entrance faces SSW
);
}
