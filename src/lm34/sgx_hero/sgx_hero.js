// ===== lm34/sgx_hero — five hero landmarks for the Singapore page (City Brush)
// All five sit on their real OSM footprints. rot 0: local +x is east, +z is south.
// y = 0 is the ground the app places the model on.
//
// These are fine-detail replicas, built the same way as Marina Bay Sands in
// src/lm22/marina/marina.js: one glass volume, then the facade drawn as real
// geometry (mullions, spandrels, fins, ribs). Canvas textures are not used,
// because lmMerge keeps positions but drops UVs, so a texture would vanish.
// The night window glow (material m:1) is only the lights inside the glass.
// No logos, brand marks or writing.
//
//   sgmillenia    ★ Millenia Tower      OSM way/48035153   roof 218 m
//   sgcentennial  ★ Centennial Tower    OSM way/155988210  roof 158 m
//   sgcapital     ★ Capital Tower       OSM way/47345009   roof 254 m
//   sgsota        ★ School of the Arts  OSM way/107937797  OSM height 50 m
//   sgmalabar     ★ Malabar Mosque      OSM way/531916524  tiles, domes, minaret
//
// Block-scoped: only LANDMARKS and SG_PLACES are touched.
{
const PI = Math.PI, TAU = PI * 2;
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const quadP = (o, a, b, c, d) => o.push(a[0],a[1],a[2], b[0],b[1],b[2], c[0],c[1],c[2], a[0],a[1],a[2], c[0],c[1],c[2], d[0],d[1],d[2]);
const triP = (o, a, b, c) => o.push(a[0],a[1],a[2], b[0],b[1],b[2], c[0],c[1],c[2]);
const ctr = P => { let x = 0, z = 0; for (const p of P){ x += p[0]; z += p[1]; } return [x / P.length, z / P.length]; };
const scaleRing = (P, s, c) => { c = c || ctr(P); return P.map(p => [c[0] + (p[0] - c[0]) * s, c[1] + (p[1] - c[1]) * s]); };
const vlen2 = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
// walls between two rings of the same length
function loftP(o, A, yA, B, yB){ const n = A.length; for (let i = 0; i < n; i++){ const j = (i + 1) % n; quadP(o, [A[i][0], yA, A[i][1]], [A[j][0], yA, A[j][1]], [B[j][0], yB, B[j][1]], [B[i][0], yB, B[i][1]]); } }
function capP(o, P, y){ const c = ctr(P); for (let i = 0; i < P.length; i++){ const j = (i + 1) % P.length; triP(o, [c[0], y, c[1]], [P[i][0], y, P[i][1]], [P[j][0], y, P[j][1]]); } }
// a round tube from point a to point b, used for thin mullions and ribs
function segP(o, a, b, r, n){
  n = n || 4; const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2], L = Math.hypot(dx, dy, dz); if (L < 1e-4) return;
  const d = [dx/L, dy/L, dz/L], up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const ux = d[1]*up[2] - d[2]*up[1], uy = d[2]*up[0] - d[0]*up[2], uz = d[0]*up[1] - d[1]*up[0];
  const ul = Math.hypot(ux, uy, uz) || 1, u = [ux/ul, uy/ul, uz/ul];
  const v = [d[1]*u[2] - d[2]*u[1], d[2]*u[0] - d[0]*u[2], d[0]*u[1] - d[1]*u[0]];
  const ring = (p) => { const R = []; for (let i = 0; i < n; i++){ const t = (i + 0.5) / n * TAU; R.push([p[0] + (u[0]*Math.cos(t) + v[0]*Math.sin(t))*r, p[1] + (u[1]*Math.cos(t) + v[1]*Math.sin(t))*r, p[2] + (u[2]*Math.cos(t) + v[2]*Math.sin(t))*r]); } return R; };
  const A = ring(a), B = ring(b);
  for (let i = 0; i < n; i++){ const j = (i + 1) % n; quadP(o, A[i], A[j], B[j], B[i]); }
}
function polyP(o, pts, r, n){ for (let i = 0; i < pts.length - 1; i++) segP(o, pts[i], pts[i + 1], r, n); }
// a box standing on y. w runs along local x, d along local z, then the box is turned by ry.
function boxP(o, w, h, d, x, y, z, ry){
  const c = Math.cos(ry || 0), s = Math.sin(ry || 0), hw = w/2, hd = d/2, y1 = y + h;
  const ax = x - hw*c - hd*s, az = z + hw*s - hd*c, bx = x + hw*c - hd*s, bz = z - hw*s - hd*c;
  const cx = x + hw*c + hd*s, cz = z - hw*s + hd*c, dx = x - hw*c + hd*s, dz = z + hw*s + hd*c;
  o.push(ax,y,az, bx,y,bz, cx,y,cz, ax,y,az, cx,y,cz, dx,y,dz,
    ax,y1,az, dx,y1,dz, cx,y1,cz, ax,y1,az, cx,y1,cz, bx,y1,bz,
    ax,y,az, ax,y1,az, bx,y1,bz, ax,y,az, bx,y1,bz, bx,y,bz,
    bx,y,bz, bx,y1,bz, cx,y1,cz, bx,y,bz, cx,y1,cz, cx,y,cz,
    cx,y,cz, cx,y1,cz, dx,y1,dz, cx,y,cz, dx,y1,dz, dx,y,dz,
    dx,y,dz, dx,y1,dz, ax,y1,az, dx,y,dz, ax,y1,az, ax,y,az);
}
function far4(P){
  const c = ctr(P), V = P.map(p => ({p, d: Math.hypot(p[0]-c[0], p[1]-c[1]), a: Math.atan2(p[1]-c[1], p[0]-c[0])}));
  V.sort((a, b) => b.d - a.d); const pick = [];
  for (const v of V){ if (pick.every(q => Math.abs(Math.atan2(Math.sin(v.a - q.a), Math.cos(v.a - q.a))) > 0.7)) pick.push(v); if (pick.length === 4) break; }
  return pick.map(v => v.p);
}
// The Millenia plan in OSM is a chamfered square (6 points). Fitting a box to that
// hexagon stretches the pyramid. The four far corners are the real square.
function cornerSq(P){
  const c = ctr(P), V = far4(P).slice();
  V.sort((a, b) => Math.atan2(a[1] - c[1], a[0] - c[0]) - Math.atan2(b[1] - c[1], b[0] - c[0]));
  return V.length >= 4 ? V : P.slice();
}
function archO(hw, ht){ const n = 7, rise = Math.min(hw, ht * 0.48), P = [[-hw, 0], [hw, 0], [hw, ht - rise]];
  for (let i = 0; i <= n; i++){ const a = PI * (1 - i / n); P.push([Math.cos(a) * hw, ht - rise + Math.sin(a) * rise]); } P.push([-hw, ht - rise]); return P; }
const sArea = P => { let A = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length]; A += a[0]*b[1] - b[0]*a[1]; } return A / 2; };
// One frame per edge. u runs along the edge, w points outward, v is height.
function edgesF(P){ const sg = sArea(P) > 0 ? 1 : -1, out = [];
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], L = vlen2(a, b) || 1e-6, ex = (b[0]-a[0])/L, ez = (b[1]-a[1])/L, nx = ez*sg, nz = -ex*sg;
    out.push({L, a, b, ex, ez, nx, nz, ry: Math.atan2(-ez, ex), F:(u, v, w) => [a[0] + ex*u + nx*(w || 0), v, a[1] + ez*u + nz*(w || 0)]}); }
  return out; }
function shapeP(o, pts, F, w){ for (let i = 1; i < pts.length - 1; i++) triP(o, F(pts[0][0], pts[0][1], w), F(pts[i][0], pts[i][1], w), F(pts[i+1][0], pts[i+1][1], w)); }
function slabP(o, pts, F, w0, w1){ shapeP(o, pts, F, w1); for (let i = 0; i < pts.length; i++){ const a = pts[i], b = pts[(i+1)%pts.length]; quadP(o, F(a[0], a[1], w0), F(b[0], b[1], w0), F(b[0], b[1], w1), F(a[0], a[1], w1)); } }
// Horizontal stone bands proud of a wall, one per floor. This is what you see by day.
function floorBands(o, P, y0, y1, step, bh, off){
  for (let y = y0; y < y1 - bh; y += step){
    for (const e of edgesF(P)){ if (e.L < 1.2) continue;
      const a = e.F(0, y, off), b = e.F(e.L, y, off), c = e.F(e.L, y + bh, off), d = e.F(0, y + bh, off);
      quadP(o, a, b, c, d);
      quadP(o, e.F(0, y, 0), a, b, e.F(e.L, y, 0));
      quadP(o, d, c, e.F(e.L, y + bh, 0), e.F(0, y + bh, 0)); }
  }
}
// Vertical mullions. sp is the bay width in metres.
function mullions(o, P, y0, y1, sp, r, off){
  for (const e of edgesF(P)){ if (e.L < 2) continue; const n = Math.max(1, Math.round(e.L / sp));
    for (let k = 0; k <= n; k++){ const p = e.F(e.L * k / n, y0, off); segP(o, p, [p[0], y1, p[2]], r, 4); } }
}
function frameOf(P){
  const c = ctr(P); let xx = 0, zz = 0, xz = 0;
  for (const p of P){ const x = p[0]-c[0], z = p[1]-c[1]; xx += x*x; zz += z*z; xz += x*z; }
  let ang = 0.5 * Math.atan2(2*xz, xx - zz), co = Math.cos(ang), si = Math.sin(ang), vu = 0, vv = 0;
  for (const p of P){ const x = p[0]-c[0], z = p[1]-c[1], u = x*co + z*si, v = -x*si + z*co; vu += u*u; vv += v*v; }
  if (vv > vu){ ang += PI/2; co = Math.cos(ang); si = Math.sin(ang); }
  return { c, co, si,
    L:(x, z) => [(x-c[0])*co + (z-c[1])*si, -(x-c[0])*si + (z-c[1])*co],
    W:(u, v) => [c[0] + u*co - v*si, c[1] + u*si + v*co] };
}
function clipHalf(P, inside, hit){ if (!P.length) return []; const out = [];
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1)%P.length], ia = inside(a), ib = inside(b);
    if (ia && ib) out.push(b); else if (ia && !ib) out.push(hit(a, b)); else if (!ia && ib){ out.push(hit(a, b)); out.push(b); } }
  return out;
}
function clipBand(P, vOf, v0, v1){
  const hit = (a, b, v) => { const va = vOf(a), vb = vOf(b), t = (v - va) / ((vb - va) || 1e-6); return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t]; };
  let Q = clipHalf(P, p => vOf(p) >= v0 - 1e-4, (a, b) => hit(a, b, v0));
  Q = clipHalf(Q, p => vOf(p) <= v1 + 1e-4, (a, b) => hit(a, b, v1));
  return Q.filter((p, i) => vlen2(p, Q[(i + Q.length - 1) % Q.length]) > 0.35);
}
function pip(P, x, z){ let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0]-a[0])*(z-a[1])/(b[1]-a[1]) + a[0]) c = !c; } return c; }
// Liang–Barsky clip of a segment to the rectangle (0..L) x (0..H), in facade coordinates.
function clipSeg(u0, v0, u1, v1, L, H){
  let t0 = 0, t1 = 1, du = u1-u0, dv = v1-v0;
  const pk = [-du, du, -dv, dv], qk = [u0, L-u0, v0, H-v0];
  for (let i = 0; i < 4; i++){
    if (Math.abs(pk[i]) < 1e-9){ if (qk[i] < 0) return null; }
    else { const r = qk[i] / pk[i]; if (pk[i] < 0){ if (r > t1) return null; if (r > t0) t0 = r; } else { if (r < t0) return null; if (r < t1) t1 = r; } }
  }
  return [u0 + du*t0, v0 + dv*t0, u0 + du*t1, v0 + dv*t1];
}
function ribbon(o, e, u0, v0, u1, v1, th, off){
  const dx = u1-u0, dy = v1-v0, len = Math.hypot(dx, dy) || 1, px = -dy/len*th, py = dx/len*th;
  quadP(o, e.F(u0+px, v0+py, off), e.F(u1+px, v1+py, off), e.F(u1-px, v1-py, off), e.F(u0-px, v0-py, off));
}
// White diagonal lattice over a tiled wall. Two families of lines, clipped to the facade.
function lattice(o, e, y0, H, step, th, off){
  const L = e.L;
  for (const dir of [1, -1]){
    for (let s = -H; s < L + H; s += step){
      const c = clipSeg(s, 0, s + dir*H, H, L, H);
      if (!c || Math.hypot(c[2]-c[0], c[3]-c[1]) < 0.4) continue;
      ribbon(o, e, c[0], y0 + c[1], c[2], y0 + c[3], th, off);
    }
  }
}
const GL = (c, fh, cw) => ({c, m:1, fh: fh || 3.8, cw: cw || 3.1, ds:true});
const RED = {c:'#ffb0b0', glow:'#ff2a2a', gk:2.2, m:0, ds:true};

const SGMILLENIA = {lat:1.2926332, lon:103.8603017, r:37.5, way:48035153, P:[[-28.26,8.6],[8.79,28.03],[18.73,9.32],[28.02,-8.16],[-9.03,-27.58],[-18.25,-10.23]]};
const SGCENTENNIAL = {lat:1.2934365, lon:103.8602859, r:44.6, way:155988210, P:[[-35.17,-6.54],[-29.05,5.73],[-21.8,13.71],[-14.93,18.37],[-12.25,16.51],[-9.03,17.03],[-6.68,19.55],[-6.95,22.75],[8.34,28.16],[23.94,27.64],[24.07,26.14],[22.37,26.08],[22.42,24.22],[26.18,23.63],[27.15,19.19],[31.52,13.77],[30.49,10.58],[32.07,8.96],[32.57,9.77],[34.26,9.16],[29.67,-0.17],[23.13,-8.58],[14.36,-14.85],[12.65,-12.84],[8.12,-13.51],[6.03,-15.51],[6.55,-18.99],[-2.33,-23.24],[-14.06,-24.74],[-24.9,-23.83],[-24.63,-22.62],[-23.67,-22.77],[-23.69,-20.71],[-27.01,-20.03],[-29.03,-13.87],[-32.63,-10.02],[-31.59,-7.5]]};
const SGCAPITAL = {lat:1.2776741, lon:103.8476538, r:53.4, way:47345009, P:[[-43.63,12.38],[-36.25,16.94],[-0.36,39.17],[7.43,43.98],[8.99,41.5],[31.51,5.6],[39.44,-7.07],[22.65,-17.47],[25.24,-21.59],[10.13,-30.95],[7.83,-27.26],[-11.34,-39.13],[-19.56,-26],[-42.08,9.91]]};
const SGSOTA = {lat:1.2992411, lon:103.8486383, r:83.4, way:107937797, P:[[-48.92,-48.24],[-43.2,-36.25],[-29.33,-25.08],[-45.44,-4.78],[-43.31,-3.01],[-45.18,-0.48],[-36.86,6.07],[-34.9,3.69],[-32.72,5.16],[-31.88,3.93],[-26.99,20.61],[-32.26,27.51],[-30.12,29.22],[-31.29,30.81],[-23.35,37.61],[-22.32,36.56],[-20.34,38.23],[-14.93,31.37],[-1.1,36.52],[-3.56,39.25],[-1.04,41.39],[-2.21,42.9],[5.47,48.68],[6.49,47.66],[9.24,48.78],[34.84,15.82],[36.04,16.96],[41.67,9.76],[40.34,8.69],[66.13,-24.58],[64.06,-26.06],[66.47,-29.55],[12.22,-74.4],[10.97,-72.99],[8.13,-73.78],[4.93,-69.62]]};
const SGMALABAR = {lat:1.3051674, lon:103.8597777, r:36.3, way:531916524, P:[[-20.11,8.47],[-5.09,27.79],[21.19,7.24],[20.84,2.82],[6.9,-17.51],[2.11,-11.44],[1.73,-7.16],[-5.63,-8.42],[-10.91,-3.2],[-11.04,1.42]]};
const place = k => { const D = {sgmillenia:SGMILLENIA, sgcentennial:SGCENTENNIAL, sgcapital:SGCAPITAL, sgsota:SGSOTA, sgmalabar:SGMALABAR}[k]; SG_PLACES.push({type:k, lat:D.lat, lon:D.lon, rot:0}); };

// ================= ★ Millenia Tower (Kevin Roche, 1996) =================
// Square plan on four lit cylinders (each 50 ft / 15.24 m), five-storey glass lobby,
// granite curtain wall with a tight window grid, dark glazed slots at the top corners,
// then a ribbed glass pyramid 140 ft / 42.7 m (main roof about 176 m, tip 218 m).
LANDMARKS.sgmillenia = {zh:'美年大厦', en:'Millenia Tower', cat:'new', r:SGMILLENIA.r, h:218, lt:{m:1, c:'#fff1dc', k:0.62}, build(){
  const g = new THREE.Group(), B = mkB(), c = ctr(SGMILLENIA.P);
  const SQ = cornerSq(SGMILLENIA.P);
  const STONE = {c:'#f3f0e8', m:0, lk:0.35, ds:true}, GRAN = {c:'#e4dfd4', m:0, lk:0.4, ds:true};
  const CYL = {c:'#f7f3ea', glow:'#ffe6b0', gk:1.5, m:0, ds:true};
  const GLASS = Object.assign(GL('#7f8c90', 3.7, 3.05), {glow:'#ffe4b8', gk:0.2});
  const SLOT = GL('#243038', 3.4, 2.4);
  const PY = Object.assign(GL('#c5d0d4', 5.5, 3.6), {glow:'#f4fbff', gk:0.45});
  const RIB = {c:'#f4f6f4', glow:'#fff6dc', gk:1.05, m:0};
  const yShaft = 16, yRoof = 175.5, yTip = yRoof + 42.7;
  LPoly(g, scaleRing(SGMILLENIA.P, 1.08, c), -8, 8.4, {c:'#cfc8ba', m:0, ds:true});
  // four illuminated cylinders, pushed just outside the corners so the shaft does not swallow them
  for (const p of SQ){ const dx = p[0]-c[0], dz = p[1]-c[1], L = Math.hypot(dx, dz) || 1;
    LCyl(g, 2.55, 3.15, 15.24, p[0] + dx/L*2.4, 0, p[1] + dz/L*2.4, CYL, 16); }
  LPoly(g, scaleRing(SQ, 0.48, c), 0.3, 20.2, {c:'#d5e6ea', m:0, glow:'#fff0d0', gk:0.75, ds:true});
  const S = scaleRing(SQ, 0.90, c);
  LPoly(g, S, yShaft, yRoof - yShaft, GLASS);
  // granite corner piers, full height, wider than the window mullions
  for (const p of S){ const q = [c[0] + (p[0]-c[0])*1.015, c[1] + (p[1]-c[1])*1.015];
    boxP(B.p(GRAN), 2.05, yRoof - yShaft, 2.05, q[0], yShaft, q[1], Math.atan2(p[1]-c[1], p[0]-c[0])); }
  // light granite grid over darker glass, kept thin enough that the lit windows show at night
  floorBands(B.p(STONE), S, yShaft + 3.2, yRoof - 8, 3.7, 0.7, 0.26);
  mullions(B.p(STONE), S, yShaft + 0.4, yRoof - 1, 3.15, 0.2, 0.32);
  // the top corners step back into dark vertical window slots, under the pyramid
  for (const e of edgesF(S)){ if (e.L < 8) continue;
    for (const u of [2.4, e.L - 2.4]){ const p = e.F(u, 152, 0.05);
      boxP(B.p(SLOT), 2.7, 22.5, 0.55, p[0], 152, p[2], e.ry); } }
  // pyramid: a true square, same width as the shaft, ribbed glass, 42.7 m tall
  const top = scaleRing(S, 0.04, c);
  loftP(B.p(PY), S, yRoof, top, yTip - 0.6); capP(B.p(PY), top, yTip - 0.6);
  const ribs = B.p(RIB);
  for (let i = 0; i < S.length; i++){
    const a = S[i], b = S[(i+1)%S.length];
    segP(ribs, [a[0], yRoof, a[1]], [c[0], yTip, c[1]], 0.36, 4);
    const n = 4; for (let k = 1; k < n; k++){ const t = k/n, x = a[0]+(b[0]-a[0])*t, z = a[1]+(b[1]-a[1])*t;
      segP(ribs, [x, yRoof + 0.2, z], [c[0], yTip, c[1]], 0.14, 3); }
  }
  for (let s = 1; s <= 6; s++){ const t = s/7, y = yRoof + (yTip - yRoof)*t;
    const ring = S.map(p => [c[0]+(p[0]-c[0])*(1-t), c[1]+(p[1]-c[1])*(1-t)]);
    for (let i = 0; i < ring.length; i++){ const A = ring[i], Bv = ring[(i+1)%ring.length]; segP(ribs, [A[0], y, A[1]], [Bv[0], y, Bv[1]], 0.14, 3); } }
  LCyl(g, 0.12, 0.45, 3.2, c[0], yTip - 0.4, c[1], RED, 8);
  B.flush(g); return g;
}};
place('sgmillenia');

// ================= ★ Centennial Tower =================
// Kevin Roche, 1997, reclad in 2015 by Thom Mayne. 158 m, 37 storeys.
// The wall follows the real curved footprint. The new skin is a field of
// interlinking window frames; they project further the higher they sit.
// A 12 m open trellis crowns the roof (it answers Millenia's pyramid).
LANDMARKS.sgcentennial = {zh:'盛年大厦', en:'Centennial Tower', cat:'new', r:SGCENTENNIAL.r, h:158, lt:{m:1, c:'#e7eef6', k:0.6}, build(){
  const g = new THREE.Group(), B = mkB(), P = SGCENTENNIAL.P, c = ctr(P);
  const STONE = {c:'#d5dbe0', m:0, lk:0.3, ds:true}, FRAME = {c:'#e7eef2', m:0, lk:0.45, ds:true};
  const GLASS = GL('#8fa6b0', 3.7, 3.2), METAL = {c:'#c5ced4', glow:'#f3f7fb', gk:0.35, m:0, ds:true};
  LPoly(g, scaleRing(P, 1.04, c), -8, 8.5, {c:'#cfc8bc', m:0, ds:true});
  LPoly(g, P, 0, 9, STONE);
  const S = scaleRing(P, 0.985, c);
  LPoly(g, S, 9, 137, GLASS);
  floorBands(B.p(FRAME), S, 14, 142, 7.4, 0.32, 0.12);
  // projecting window modules, staggered like brickwork, deeper toward the roof
  const mods = B.p(FRAME); let row = 0;
  for (let y = 12; y < 142; y += 6.4, row++){
    const depth = 0.28 + 1.05 * ((y - 12) / 130);
    const shift = (row % 2) * 2.7;
    for (const e of edgesF(S)){ if (e.L < 5) continue;
      for (let u = 1.6 + shift; u < e.L - 1.2; u += 5.4){
        const p = e.F(u, y, 0.02);
        boxP(mods, Math.min(3.15, e.L * 0.4), 2.35, depth, p[0] + e.nx*(depth*0.5 + 0.02), y, p[2] + e.nz*(depth*0.5 + 0.02), e.ry);
      } }
  }
  // 12 m open trellis: posts, three hoops, and one diagonal per bay
  const R = scaleRing(P, 0.78, c), posts = B.p(METAL);
  for (const e of edgesF(R)){ if (e.L < 3) continue; const n = Math.max(1, Math.round(e.L / 6.5));
    for (let k = 0; k <= n; k++){ const p = e.F(e.L*k/n, 146, 0); segP(posts, p, [p[0], 158, p[2]], 0.16, 4);
      if (k < n){ const q = e.F(e.L*(k+1)/n, 146, 0); segP(posts, p, [q[0], 158, q[2]], 0.07, 3); } } }
  for (const y of [149.2, 153.2, 157.2]){ for (const e of edgesF(R)){ if (e.L < 1) continue; const a = e.F(0, y, 0), b = e.F(e.L, y, 0); segP(posts, a, b, 0.11, 3); } }
  LPoly(g, scaleRing(R, 0.92, c), 145.2, 0.7, STONE);
  LCyl(g, 0.1, 0.4, 2.2, c[0], 158, c[1], RED, 6);
  B.flush(g); return g;
}};
place('sgcentennial');

// ================= ★ Capital Tower (RSP, 2000) =================
// 254 m roof, occupied floors to about 232 m (CTBUH), 52 storeys.
// The OSM plan is a rotated rectangle with a stepped notch on the north side.
// The tower above the podium is that rectangle with rounded corners. The south
// face (toward Maxwell Road) carries the semicircular canopy and the vertical
// glass slot. Two projecting cornices, then a rounded shoulder and a louvered
// glass crown. Copper spandrels sit in the blue-green glass. No lettering.
LANDMARKS.sgcapital = {zh:'资金大厦', en:'Capital Tower', cat:'new', r:SGCAPITAL.r, h:254, lt:{m:1, c:'#d5e6f6', k:0.55}, build(){
  const g = new THREE.Group(), B = mkB(), P = SGCAPITAL.P, c = ctr(P);
  const GLASS = Object.assign(GL('#3f6474', 4.0, 3.6), {glow:'#ffe0b0', gk:0.12});
  const GLASS2 = Object.assign(GL('#6d93a4', 3.6, 2.6), {glow:'#eaf6ff', gk:0.35});
  const SLOT = GL('#1e303c', 3.8, 2.8);
  const SILVER = {c:'#d5dde4', m:0, lk:0.55, ds:true};
  const COPPER = {c:'#c48978', m:0, lk:0.4, ds:true};
  const SHELF = {c:'#e8e6df', m:0, lk:0.7, glow:'#fff6e4', gk:0.55, ds:true};
  const LOUVER = {c:'#f4f1ea', m:0, glow:'#fff3cc', gk:1.45, ds:true};
  const METAL = {c:'#ddd8ce', m:0, lk:0.6, glow:'#fff1d8', gk:0.35, ds:true};
  const POD = {c:'#c8c2b4', m:0, lk:0.3, ds:true};
  // Plan frame: +u runs along the south facade, +v points south (toward the park).
  const ANG = 31.8 * PI / 180, CO = Math.cos(ANG), SI = Math.sin(ANG);
  const Wxz = (u, v) => [u * CO - v * SI, u * SI + v * CO];
  const UC = -0.4, VC = 3.2;
  const rrect = (hw, hd, rad) => {
    rad = Math.max(0.8, Math.min(rad, hw - 0.8, hd - 0.8));
    const nArc = 5, cns = [
      [UC + hw - rad, VC + hd - rad, 0],
      [UC - hw + rad, VC + hd - rad, PI / 2],
      [UC - hw + rad, VC - hd + rad, PI],
      [UC + hw - rad, VC - hd + rad, PI * 1.5]
    ], pts = [];
    for (const [cx, cy, a0] of cns) for (let k = 0; k <= nArc; k++){
      const a = a0 + (PI / 2) * (k / nArc);
      pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
    }
    return pts;
  };
  const ring = (hw, hd, rad) => rrect(hw, hd, rad).map(p => Wxz(p[0], p[1]));
  const sec = (hw, hd, rad, y) => ring(hw, hd, rad).map(p => [p[0], y, p[1]]);
  const HW = 27.2, HD = 26.4;
  // podium follows the real footprint, including the north notch; street canopy on the south face
  LPoly(g, scaleRing(P, 1.04, c), -8, 8.3, {c:'#b7b1a4', m:0, ds:true});
  LPoly(g, P, 0, 5.2, POD);
  LPoly(g, scaleRing(P, 0.985, c), 5.2, 7.2, GLASS);
  LPoly(g, scaleRing(P, 1.01, c), 12.2, 1.1, SILVER);
  const south = Wxz(UC, VC + HD), OX = -SI, OZ = CO, ry = Math.atan2(-SI, CO);
  boxP(B.p(METAL), 20, 0.7, 7.5, south[0] + OX * 3.6, 3.6, south[1] + OZ * 3.6, ry);
  segP(B.p(POD), [south[0] + OX * 6.2, 0, south[1] + OZ * 6.2], [south[0] + OX * 6.2, 3.6, south[1] + OZ * 6.2], 0.35, 6);
  // main shaft: sharper corners, blue-green glass, silver floor lines, copper bays
  const S = ring(HW, HD, 3.6);
  LPoly(g, S, 13, 147, GLASS);
  floorBands(B.p(SILVER), S, 17, 156, 4.05, 0.55, 0.22);
  const copper = B.p(COPPER);
  for (const e of edgesF(S)){ if (e.L < 22) continue;
    const southFace = e.nz > 0.6;
    const n = Math.max(3, Math.round(e.L / 6.4));
    for (let k = 0; k < n; k++){ if (k % 2 === 0) continue;
      const u0 = e.L * (k + 0.12) / n, u1 = e.L * (k + 0.88) / n;
      if (southFace && Math.abs((u0 + u1) / 2 - e.L / 2) < e.L * 0.14) continue;
      for (let y = 28; y < 148; y += 8.1){
        quadP(copper, e.F(u0, y, 0.34), e.F(u1, y, 0.34), e.F(u1, y + 1.15, 0.34), e.F(u0, y + 1.15, 0.34));
        quadP(copper, e.F(u0, y, 0.02), e.F(u0, y, 0.34), e.F(u1, y, 0.34), e.F(u1, y, 0.02));
      }
    }
  }
  // vertical glass slot and the semicircular canopy on the south face
  boxP(B.p(SLOT), 8.2, 146, 1.5, south[0] + OX * 0.4, 14, south[1] + OZ * 0.4, ry);
  const brow = B.p(METAL), R = 9.2, yB = 86;
  for (let i = 0; i < 12; i++){
    const a0 = -PI / 2 + PI * i / 12, a1 = -PI / 2 + PI * (i + 1) / 12;
    const pt = (a, rr, y) => { const w = Wxz(UC + Math.sin(a) * rr, VC + HD + Math.cos(a) * rr); return [w[0], y, w[1]]; };
    quadP(brow, pt(a0, 0.4, yB), pt(a1, 0.4, yB), pt(a1, R, yB), pt(a0, R, yB));
    quadP(brow, pt(a0, 0.4, yB + 1.15), pt(a0, R, yB + 1.15), pt(a1, R, yB + 1.15), pt(a1, 0.4, yB + 1.15));
    quadP(brow, pt(a0, R, yB), pt(a1, R, yB), pt(a1, R, yB + 1.15), pt(a0, R, yB + 1.15));
  }
  // first cornice, then the rounded upper body, then the second cornice
  LPoly(g, ring(HW * 1.12, HD * 1.12, 5), 158.5, 4.6, SHELF);
  const up = [];
  for (let k = 0; k <= 6; k++){ const t = k / 6; up.push(sec(HW * (1 - 0.05 * t), HD * (1 - 0.05 * t), 6 + 8 * t, 163 + 43 * t)); }
  LLoft(g, up, GLASS2, false);
  floorBands(B.p(SILVER), ring(HW * 0.98, HD * 0.98, 10), 170, 200, 4.2, 0.4, 0.16);
  LPoly(g, ring(HW * 1.02, HD * 1.02, 12), 206, 3.6, SHELF);
  // sloping glass shoulder into the crown (occupied floors end near 232 m)
  const sh = [];
  for (let k = 0; k <= 5; k++){ const t = k / 5; sh.push(sec(HW * (0.90 - 0.16 * t), HD * (0.90 - 0.16 * t), 13 + 3 * t, 210 + 22 * t)); }
  LLoft(g, sh, GLASS2, false);
  const cr = [];
  for (let k = 0; k <= 4; k++){ const t = k / 4; cr.push(sec(HW * (0.72 - 0.04 * t), HD * (0.72 - 0.04 * t), 14, 232 + 16 * t)); }
  LLoft(g, cr, GLASS2, false);
  capP(B.p(GLASS2), ring(HW * 0.68, HD * 0.68, 14), 248);
  // louvered crown: the lit stack you recognise from Tanjong Pagar, with no mark on it
  for (let k = 0; k < 5; k++){
    const t = k / 4, sc = 0.78 - 0.03 * t;
    LPoly(g, ring(HW * sc, HD * sc, 14), 231.2 + k * 4.15, 0.55, LOUVER);
  }
  LPoly(g, ring(HW * 0.70, HD * 0.70, 13), 251.2, 1.3, LOUVER);
  mullions(B.p(LOUVER), ring(HW * 0.72, HD * 0.72, 14), 232, 248, 3.2, 0.1, 0.2);
  LCyl(g, 0.14, 0.4, 2.2, c[0], 252.2, c[1], RED, 6);
  B.flush(g); return g;
}};
place('sgcapital');

// ================= ★ School of the Arts (WOHA, occupied 2010) =================
// Three white-framed bars over an open ground floor. On each long face, one half
// is a screen of vertical fins and the other half is a planted wall. A skybridge
// ties the bars together. The base is dark folded metal. 50 m is the OSM height.
LANDMARKS.sgsota = {zh:'新加坡艺术学院', en:'School of the Arts', cat:'new', r:SGSOTA.r, h:50, lt:{m:1, c:'#e7efe4', k:0.5, fh:3.6, cw:2.8}, build(){
  const g = new THREE.Group(), B = mkB(), P = SGSOTA.P, c = ctr(P);
  const WHITE = {c:'#f4f5f2', m:0, lk:0.55, ds:true}, FIN = {c:'#d5d8dc', m:0, lk:0.4, ds:true};
  const DARK = {c:'#3c3834', m:0, lk:0.2, ds:true}, DARK2 = {c:'#2a2826', m:0, ds:true};
  const GLASS = GL('#9aa8a4', 3.6, 2.6);
  const GREENS = ['#3f7d3c', '#5ea24c', '#2f6a34', '#6eae58'];
  const F = frameOf(P), vOf = p => F.L(p[0], p[1])[1], uOf = p => F.L(p[0], p[1])[0];
  let v0 = 1e9, v1 = -1e9, u0 = 1e9, u1 = -1e9;
  for (const p of P){ const u = uOf(p), v = vOf(p); if (v < v0) v0 = v; if (v > v1) v1 = v; if (u < u0) u0 = u; if (u > u1) u1 = u; }
  LPoly(g, scaleRing(P, 1.02, c), -12, 12.3, {c:'#b7b3a8', m:0, ds:true});
  // open ground floor: columns, then the floor slab the bars stand on
  const cols = B.p(WHITE);
  for (let u = u0 + 8; u < u1 - 8; u += 16) for (const v of [v0*0.72, 0, v1*0.72]){
    const q = F.W(u, v); if (!pip(P, q[0], q[1])) continue; segP(cols, [q[0], 0, q[1]], [q[0], 8.2, q[1]], 0.55, 6); }
  LPoly(g, scaleRing(P, 0.98, c), 7.6, 1.3, WHITE);
  // dark folded skirt along the long sides
  const skirt = B.p(DARK), skirt2 = B.p(DARK2);
  for (const e of edgesF(P)){ if (e.L < 12) continue; const pitch = 5.2;
    for (let u = 0; u + pitch < e.L + 0.2; u += pitch){
      const A = e.F(u, 2.4, 0.15), M = e.F(Math.min(e.L, u + pitch*0.5), 5.4, 1.55), C = e.F(Math.min(e.L, u + pitch), 2.4, 0.15);
      const A2 = e.F(u, 8.0, 0.2), M2 = e.F(Math.min(e.L, u + pitch*0.5), 8.0, 0.35), C2 = e.F(Math.min(e.L, u + pitch), 8.0, 0.2);
      const o = ((u / pitch) | 0) % 2 ? skirt2 : skirt;
      triP(o, A, M, C); triP(o, A, M, A2); triP(o, M, C, C2); triP(o, A2, M, M2); triP(o, M2, C, C2); }
  }
  const gap = (v1 - v0) * 0.11, w = ((v1 - v0) - 2*gap) / 3;
  const heights = [44, 50, 46];
  for (let i = 0; i < 3; i++){
    const a = v0 + i*(w + gap), b = a + w, Q = clipBand(P, vOf, a, b);
    if (Q.length < 3) continue;
    const y0b = 8.6, h = heights[i] - y0b, qc = ctr(Q);
    LPoly(g, Q, y0b, h, GLASS);
    LPoly(g, scaleRing(Q, 1.012, qc), y0b + h - 0.3, 1.15, WHITE);
    LPoly(g, scaleRing(Q, 1.02, qc), y0b, 0.55, WHITE);
    const posts = B.p(WHITE);
    for (const p of Q) boxP(posts, 0.62, h, 0.62, p[0], y0b, p[1], 0);
    for (const e of edgesF(Q)){ if (e.L < 16) continue;
      const mid = e.L * 0.46;
      // white pier splitting fins from the planted half
      const pier = e.F(mid, y0b, 0.35); boxP(posts, 0.85, h + 1.2, 0.9, pier[0], y0b, pier[2], e.ry);
      const fins = B.p(FIN);
      for (let u = 0.8; u < mid - 0.6; u += 1.15){ const p = e.F(u, y0b + 0.6, 0.15);
        boxP(fins, 0.32, h - 1.4, 0.85, p[0] + e.nx*0.5, y0b + 0.6, p[2] + e.nz*0.5, e.ry); }
      let k = 0;
      for (let u = mid + 1.1; u < e.L - 0.6; u += 1.25, k++){
        const drop = (k % 5) * 0.7, ph = h - 1.2 - drop, p = e.F(u, y0b + 0.4 + drop, 0.2);
        const col = {c:GREENS[k % GREENS.length], m:0, lk:0.15, ds:true};
        boxP(B.p(col), 0.72, ph, 0.7, p[0] + e.nx*0.45, y0b + 0.4 + drop, p[2] + e.nz*0.45, e.ry);
      }
    }
    // a little planting along the roof edge
    const roofG = {c:'#4e9444', m:0, ds:true};
    for (const e of edgesF(Q)){ if (e.L < 8) continue;
      for (let u = 1.5; u < e.L; u += 3.2){ const p = e.F(u, y0b + h, 0.3);
        boxP(B.p(roofG), 0.8, 1.3 + (u % 2)*0.6, 0.55, p[0], y0b + h, p[2], e.ry); } }
  }
  // two skybridges across the three bars, open underneath, so the link reads from the street
  const bridge = (u0, u1, y) => {
    LPoly(g, [F.W(u0, v0 + 1.2), F.W(u1, v0 + 1.2), F.W(u1, v1 - 1.2), F.W(u0, v1 - 1.2)], y, 0.9, WHITE);
    LPoly(g, [F.W(u0 + 0.6, v0 + 1.6), F.W(u0 + 2.2, v0 + 1.6), F.W(u0 + 2.2, v1 - 1.6), F.W(u0 + 0.6, v1 - 1.6)], y + 0.9, 2.8, GLASS);
    LPoly(g, [F.W(u1 - 2.2, v0 + 1.6), F.W(u1 - 0.6, v0 + 1.6), F.W(u1 - 0.6, v1 - 1.6), F.W(u1 - 2.2, v1 - 1.6)], y + 0.9, 2.8, GLASS);
  };
  bridge(-22, -6, 27); bridge(8, 24, 32);
  B.flush(g); return g;
}};
place('sgsota');

// ================= ★ Malabar Mosque (A.H. Siddique, 1963) =================
// Light turquoise tiles with a white geometric lattice (the tiles are the 1995
// work; the walls were painted before that). A gold onion dome on a drum, smaller
// domes beside it, and an octagonal minaret with its own small gold cap and crescent.
// Dome heights are not published; they are proportioned to this footprint and to
// photographs. No calligraphy.
LANDMARKS.sgmalabar = {zh:'马拉巴回教堂', en:'Malabar Mosque', cat:'old', r:SGMALABAR.r, h:28, lt:{m:0, c:'#d7e8ff', k:0.85, e:0.4, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB(), P = SGMALABAR.P, c = ctr(P);
  const CYAN = {c:'#5eb4c6', m:0, lc:'#e7f4ff', lk:0.75, ds:true};
  const CYAN2 = {c:'#3f9aaf', m:0, lc:'#e7f4ff', lk:0.7, ds:true};
  const WHITE = {c:'#f7f4ec', m:0, lk:0.7, ds:true};
  const DARK = {c:'#1c2830', glow:'#ffd9a8', gk:0.35, m:0, ds:true};
  const GOLD = {c:'#e2b23c', glow:'#ffd56a', gk:1.2, m:0, ds:true};
  const GOLD2 = {c:'#f0cb6c', glow:'#ffe090', gk:1.15, m:0};
  const yWall = 13.2;
  LPoly(g, scaleRing(P, 1.05, c), -4, 4.4, {c:'#c9c3b4', m:0, ds:true});
  LPoly(g, P, 0, 6.4, CYAN);
  LPoly(g, scaleRing(P, 0.992, c), 6.4, yWall - 6.4, CYAN2);
  LPoly(g, scaleRing(P, 0.96, c), yWall, 0.45, WHITE);
  // white lattice over every wall, then the arched openings on top of it
  const lat = B.p(WHITE), arches = B.p(WHITE), holes = B.p(DARK);
  for (const e of edgesF(P)){ if (e.L < 3) continue;
    lattice(lat, e, 0.6, yWall - 1.1, 2.6, 0.16, 0.2);
    if (e.L < 9) continue;
    const n = Math.max(2, Math.round(e.L / 5.2)), bw = e.L / n;
    for (let k = 0; k < n; k++){ const u = bw*(k + 0.5);
      for (const yb of [1.3, 7.2]){ const ht = yb < 3 ? 3.5 : 3.15, hw = Math.min(1.05, bw*0.28);
        const F = (uu, vv, w) => e.F(u + uu, yb + vv, w);
        slabP(arches, archO(hw + 0.16, ht + 0.18), F, 0.18, 0.4);
        shapeP(holes, archO(hw, ht), F, 0.46); } }
    // a string course and a row of small merlons
    for (let u = 0.8; u < e.L; u += 1.7){ const p = e.F(u, yWall, 0.25); boxP(lat, 0.55, 0.7, 0.4, p[0], yWall, p[2], e.ry); }
  }
  // gold onion on an octagonal drum; ribs so the dome is not a smooth blob
  const onionProf = r => [[r*0.22, 0], [r*0.85, r*0.12], [r*1.02, r*0.5], [r*0.78, r*0.95], [r*0.38, r*1.35], [r*0.1, r*1.62], [0.03, r*1.78]];
  const ribsOf = (x, y, z, r, n) => { const prof = onionProf(r), o = B.p(GOLD2);
    for (let i = 0; i < n; i++){ const a = i/n*TAU, ca = Math.cos(a), sa = Math.sin(a);
      polyP(o, prof.map(p => [x + ca*p[0], y + p[1], z + sa*p[0]]), 0.045, 3); } };
  // a crescent thick enough to read from the street, plus a small finial
  const crescentAt = (x, y, z, r) => { const o = B.p(GOLD2);
    const sweep = (yaw) => { const cy = Math.cos(yaw), sy = Math.sin(yaw);
      for (let i = 0; i < 8; i++){ const a0 = 0.45 + i/8*2.25, a1 = 0.45 + (i+1)/8*2.25;
        const p = (a, rr) => [x + Math.cos(a)*rr*cy, y + Math.sin(a)*rr, z + Math.cos(a)*rr*sy];
        quadP(o, p(a0, r), p(a1, r), p(a1, r*0.62), p(a0, r*0.62)); } };
    sweep(0); sweep(PI/2); LCyl(g, 0.05, 0.12, r*0.7, x, y + r*0.15, z, GOLD2, 6); };
  const domeAt = (x, z, r, y) => {
    LCyl(g, r*0.62, r*0.78, r*0.5, x, y, z, WHITE, 8);
    LCyl(g, r*0.8, r*0.8, r*0.12, x, y + r*0.38, z, CYAN, 8);
    LLathe(g, onionProf(r), x, y + r*0.48, z, GOLD, 18);
    ribsOf(x, y + r*0.48, z, r, 8);
    crescentAt(x, y + r*0.48 + r*1.78, z, r*0.28);
  };
  domeAt(c[0], c[1], 4.3, yWall);
  // smaller dome to the west of the main one, and little domes on the other corners
  let east = P[0], west = P[0];
  for (const p of P){ if (p[0] > east[0]) east = p; if (p[0] < west[0]) west = p; }
  const outP = p => { const dx = p[0]-c[0], dz = p[1]-c[1], L = Math.hypot(dx, dz) || 1; return [p[0] - dx/L*1.2, p[1] - dz/L*1.2]; };
  const wpt = outP(west); domeAt(wpt[0], wpt[1], 2.15, yWall);
  for (const p of far4(P)){ if (Math.hypot(p[0]-east[0], p[1]-east[1]) < 3 || Math.hypot(p[0]-west[0], p[1]-west[1]) < 3) continue;
    const q = outP(p); domeAt(q[0], q[1], 1.45, yWall); }
  // octagonal minaret just outside the east corner, taller than the wall, smaller gold cap
  { const dx = east[0]-c[0], dz = east[1]-c[1], L = Math.hypot(dx, dz) || 1;
    const x = east[0] + dx/L*2.6, z = east[1] + dz/L*2.6, H = 20.5;
    LCyl(g, 1.85, 2.15, H, x, 0, z, CYAN, 8);
    for (let y = 3.2; y < H - 1; y += 3.4) LCyl(g, 2.05, 2.05, 0.28, x, y, z, WHITE, 8);
    LCyl(g, 2.35, 2.35, 0.45, x, H - 0.2, z, WHITE, 8);
    // a small arched opening on each second face of the shaft
    for (let i = 0; i < 4; i++){ const a = i/4*TAU, ca = Math.cos(a), sa = Math.sin(a);
      const F = (u, v, w) => [x + ca*(2.05 + (w || 0)) - sa*u, v, z + sa*(2.05 + (w || 0)) + ca*u];
      slabP(arches, archO(0.38, 1.5).map(q => [q[0], q[1] + 8]), F, 0, 0.12);
      shapeP(holes, archO(0.26, 1.15).map(q => [q[0], q[1] + 8.15]), F, 0.16); }
    LLathe(g, onionProf(1.35), x, H + 0.3, z, GOLD, 14);
    ribsOf(x, H + 0.3, z, 1.35, 8);
    crescentAt(x, H + 0.3 + 1.35*1.78, z, 0.42);
  }
  B.flush(g); return g;
}};
place('sgmalabar');

// Moves the camera the app already has, so screenshots can frame each model.
// heading 0 puts the camera to the south. dist is metres.
window.__sgx = {
  ready(){ return landmarks.some(L => L.type === 'sgmillenia' && L.top != null) && landmarks.some(L => L.type === 'sgmalabar' && L.top != null); },
  names(){ return landmarks.filter(L => ['sgmillenia','sgcentennial','sgcapital','sgsota','sgmalabar'].includes(L.type)).map(L => ({type:L.type, top:+L.top.toFixed(2), x:+L.x.toFixed(1), y:+L.y.toFixed(1), h:LANDMARKS[L.type].h})); },
  look(type, dist, heading, elev, night, aim){
    const L = landmarks.find(q => q.type === type); if (!L) return false;
    const aimY = (L.top || 0) + Math.min(LANDMARKS[type].h * (aim == null ? 0.55 : aim), 200);
    const horiz = Math.cos(elev) * dist, vert = Math.sin(elev) * dist;
    camera.position.set(L.x + Math.sin(heading) * horiz, aimY + vert, -L.y + Math.cos(heading) * horiz);
    controls.target.set(L.x, aimY, -L.y);
    if (controls.update) controls.update();
    tod = night ? 21.3 : 11.5; todPlay = false; applyTime();
    return true;
  }
};
}
