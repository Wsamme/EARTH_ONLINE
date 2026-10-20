// ===== nyc/nyboro: New York landmarks around the boroughs and New Jersey (City Brush v29, New York 1:1).
// nyintrepid  Intrepid Museum (Essex-class carrier at Pier 86, aircraft on the flight deck, Space Shuttle Pavilion)
// nywasharch  Washington Square Arch (1892) and the round fountain on its axis
// nyhoboken   Hoboken Terminal (1907, copper-clad ferry and rail terminal, clock tower, Bush train sheds)
// nybkmuseum  Brooklyn Museum (1897 Beaux-Arts front, portico, saucer dome, the 2004 glass entrance pavilion)
// nyarmyplaza Soldiers' and Sailors' Arch, Grand Army Plaza (1892, granite, quadriga)
// nywsb       Williamsburgh Savings Bank Tower (1929, 156 m, clock faces, gilded dome)
// nyashe      Arthur Ashe Stadium (1997 bowl, 2016 retractable-roof superstructure)
// Every model is fitted to its real OSM footprint (nyc/ref_nyboro.json; model frames in the comments). No text, logos or
// insignia anywhere. Block-scoped: only LANDMARKS and SG_PLACES are touched.
{
const PI = Math.PI, HP = PI/2, TAU = PI*2;
const lerp = (a, b, t) => a + (b - a)*t, cl01 = t => t < 0 ? 0 : t > 1 ? 1 : t;
// ---- triangle batches: many parts of one colour spec become one LTris call (one material)
const NBat = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const quadP = (o, a, b, c, d) => o.push(...a, ...b, ...c, ...a, ...c, ...d);
const triP = (o, a, b, c) => o.push(...a, ...b, ...c);
// a frame: origin (cx, cy, cz), rotated ry about +y (same sense as three.js rotation.y)
const FR = (cx, cy, cz, ry) => { const c = Math.cos(ry || 0), s = Math.sin(ry || 0); return (x, y, z) => [cx + x*c + z*s, cy + y, cz - x*s + z*c]; };
const ID = (x, y, z) => [x, y, z];
// box (centre x, z; bottom y) in frame M
function boxM(o, M, w, h, d, x, y, z){
  const hw = w/2, hd = d/2;
  const P = [M(x-hw, y, z-hd), M(x+hw, y, z-hd), M(x+hw, y, z+hd), M(x-hw, y, z+hd), M(x-hw, y+h, z-hd), M(x+hw, y+h, z-hd), M(x+hw, y+h, z+hd), M(x-hw, y+h, z+hd)];
  for (const [a, b, c, e] of [[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]) quadP(o, P[a], P[b], P[c], P[e]);
}
const boxP = (o, w, h, d, x, y, z, ry) => ry ? boxM(o, FR(x, 0, z, ry), w, h, d, 0, y, 0) : boxM(o, ID, w, h, d, x, y, z);
const aboxM = (o, M, x0, x1, y0, y1, z0, z1) => boxM(o, M, x1 - x0, y1 - y0, z1 - z0, (x0 + x1)/2, y0, (z0 + z1)/2);
// hexahedron from 8 corners (bottom 4 then top 4, same order)
function hexP(o, P){ for (const [a, b, c, e] of [[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]) quadP(o, P[a], P[b], P[c], P[e]); }
// tube between two points
function segP(o, a, b, r, n){
  n = n || 4; const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2], L = Math.hypot(dx, dy, dz); if (L < 1e-4) return;
  const d = [dx/L, dy/L, dz/L], up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let ux = d[1]*up[2]-d[2]*up[1], uy = d[2]*up[0]-d[0]*up[2], uz = d[0]*up[1]-d[1]*up[0]; const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
  const vx = d[1]*uz-d[2]*uy, vy = d[2]*ux-d[0]*uz, vz = d[0]*uy-d[1]*ux;
  const ring = p => { const R = []; for (let i = 0; i < n; i++){ const t = (i + 0.5)/n*TAU, c = Math.cos(t)*r, s = Math.sin(t)*r; R.push([p[0]+ux*c+vx*s, p[1]+uy*c+vy*s, p[2]+uz*c+vz*s]); } return R; };
  const A = ring(a), Bq = ring(b);
  for (let i = 0; i < n; i++){ const j = (i+1) % n; quadP(o, A[i], A[j], Bq[j], Bq[i]); }
}
// loft through closed rings of [x, y, z]
function loftP(o, secs, cap){
  const n = secs[0].length;
  for (let s = 0; s < secs.length - 1; s++) for (let i = 0; i < n; i++){ const j = (i+1) % n; quadP(o, secs[s][i], secs[s][j], secs[s+1][j], secs[s+1][i]); }
  if (cap){ const t = secs[secs.length - 1], c = [0, 0, 0]; for (const p of t){ c[0] += p[0]/n; c[1] += p[1]/n; c[2] += p[2]/n; } for (let i = 0; i < n; i++) o.push(...c, ...t[i], ...t[(i+1) % n]); }
}
// open strip loft (rings not closed)
function stripP(o, secs){ for (let s = 0; s < secs.length - 1; s++) for (let i = 0; i < secs[s].length - 1; i++) quadP(o, secs[s][i], secs[s][i+1], secs[s+1][i+1], secs[s+1][i]); }
// surface of revolution: profile [[r, y], ...] around (x, z) in frame M, angles a0..a1
function latheM(o, M, prof, x, z, n, a0, a1){
  a0 = a0 || 0; a1 = a1 === undefined ? TAU : a1;
  for (let i = 0; i < n; i++){ const t0 = a0 + (a1 - a0)*i/n, t1 = a0 + (a1 - a0)*(i + 1)/n, c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
    for (let k = 0; k < prof.length - 1; k++){ const p = prof[k], q = prof[k+1];
      quadP(o, M(x + c0*p[0], p[1], z + s0*p[0]), M(x + c1*p[0], p[1], z + s1*p[0]), M(x + c1*q[0], q[1], z + s1*q[0]), M(x + c0*q[0], q[1], z + s0*q[0])); } }
}
const cylM = (o, M, r0, r1, y0, y1, x, z, n) => latheM(o, M, [[0, y0], [r0, y0], [r1, y1], [0, y1]], x, z, n || 12);
// ---- plan polygons ([x, z] points)
const area2 = P => { let s = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; s += a[0]*b[1] - b[0]*a[1]; } return s/2; };
function capM(o, M, ring, y){
  const rr = area2(ring) > 0 ? ring : ring.slice().reverse();
  const tr = THREE.ShapeUtils.triangulateShape(rr.map(p => new THREE.Vector2(p[0], p[1])), []);
  for (const t of tr) triP(o, M(rr[t[0]][0], y, rr[t[0]][1]), M(rr[t[1]][0], y, rr[t[1]][1]), M(rr[t[2]][0], y, rr[t[2]][1]));
}
function wallsM(o, M, ring, y0, y1){ for (let i = 0; i < ring.length; i++){ const a = ring[i], b = ring[(i+1) % ring.length]; quadP(o, M(a[0], y0, a[1]), M(b[0], y0, b[1]), M(b[0], y1, b[1]), M(a[0], y1, a[1])); } }
function prismM(o, M, ring, y0, y1, top, bot){ wallsM(o, M, ring, y0, y1); if (top !== false) capM(o, M, ring, y1); if (bot) capM(o, M, ring, y0); }
// inward offset of a polygon by d (negative grows), mitred and clamped
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
const rectR = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const circR = (cx, cz, r, n, a0) => { const P = []; for (let i = 0; i < n; i++){ const a = (a0 || 0) + i/n*TAU; P.push([cx + Math.cos(a)*r, cz + Math.sin(a)*r]); } return P; };
// ---- arches. Panel frame of an arch face: u across (x), v up (y), w through (z).
// a flat panel [-hw, hw] x [ys, yt] at depth w with a round hole of radius r springing at ys (r <= hw)
function archPanel(o, M, hw, ys, r, yt, w, n){
  const tc1 = Math.atan2(yt - ys, -hw), tc2 = Math.atan2(yt - ys, hw), T = [];
  for (let i = 0; i <= n; i++) T.push(PI - PI*i/n);
  T.push(tc1, tc2); T.sort((a, b) => b - a);
  const hit = t => { const c = Math.cos(t), s = Math.sin(t); let k = Math.abs(c) > 1e-6 ? hw/Math.abs(c) : 1e9; if (s > 1e-6) k = Math.min(k, (yt - ys)/s); return [k*c, ys + k*s]; };
  for (let i = 0; i < T.length - 1; i++){ const a = T[i], b = T[i+1]; if (a - b < 1e-6) continue;
    const ia = [r*Math.cos(a), ys + r*Math.sin(a)], ib = [r*Math.cos(b), ys + r*Math.sin(b)], oa = hit(a), ob = hit(b);
    quadP(o, M(ia[0], ia[1], w), M(ib[0], ib[1], w), M(ob[0], ob[1], w), M(oa[0], oa[1], w)); }
}
// half-annulus band (archivolt / soffit rib): radii r0..r1 springing at ys, depth w0..w1
function arcBand(o, M, r0, r1, ys, w0, w1, n, a0, a1){
  a0 = a0 === undefined ? 0 : a0; a1 = a1 === undefined ? PI : a1;
  for (let i = 0; i < n; i++){ const t0 = a0 + (a1 - a0)*i/n, t1 = a0 + (a1 - a0)*(i+1)/n;
    const P = (r, t, w) => M(r*Math.cos(t), ys + r*Math.sin(t), w);
    quadP(o, P(r1, t0, w0), P(r1, t1, w0), P(r1, t1, w1), P(r1, t0, w1));     // outer
    quadP(o, P(r0, t1, w0), P(r0, t0, w0), P(r0, t0, w1), P(r0, t1, w1));     // inner (soffit)
    quadP(o, P(r0, t0, w0), P(r0, t1, w0), P(r1, t1, w0), P(r1, t0, w0));     // faces
    quadP(o, P(r0, t1, w1), P(r0, t0, w1), P(r1, t0, w1), P(r1, t1, w1)); }
}
// ---- small sculpture vocabulary (stylised masses only, no faces / text)
// standing draped figure, height h, at (x, y, z) facing +z of frame M rotated ry
function figP(o, M, x, y, z, h, ry, arms){
  const F = (a, b, c) => { const cr = Math.cos(ry || 0), sr = Math.sin(ry || 0); return M(x + a*cr + c*sr, y + b, z - a*sr + c*cr); };
  const s = h/1.8;
  hexP(o, [F(-0.26*s, 0, -0.2*s), F(0.26*s, 0, -0.2*s), F(0.26*s, 0, 0.22*s), F(-0.26*s, 0, 0.22*s), F(-0.2*s, 1.0*s, -0.13*s), F(0.2*s, 1.0*s, -0.13*s), F(0.2*s, 1.0*s, 0.13*s), F(-0.2*s, 1.0*s, 0.13*s)]);   // robe
  hexP(o, [F(-0.2*s, 1.0*s, -0.13*s), F(0.2*s, 1.0*s, -0.13*s), F(0.2*s, 1.0*s, 0.13*s), F(-0.2*s, 1.0*s, 0.13*s), F(-0.24*s, 1.48*s, -0.12*s), F(0.24*s, 1.48*s, -0.12*s), F(0.24*s, 1.48*s, 0.12*s), F(-0.24*s, 1.48*s, 0.12*s)]); // torso
  hexP(o, [F(-0.1*s, 1.5*s, -0.1*s), F(0.1*s, 1.5*s, -0.1*s), F(0.1*s, 1.5*s, 0.1*s), F(-0.1*s, 1.5*s, 0.1*s), F(-0.09*s, 1.75*s, -0.09*s), F(0.09*s, 1.75*s, -0.09*s), F(0.09*s, 1.75*s, 0.09*s), F(-0.09*s, 1.75*s, 0.09*s)]); // head
  const ar = arms || 0;   // 0 down, 1 one arm raised, 2 both raised
  segP(o, F(-0.28*s, 1.42*s, 0), F(-0.34*s, ar === 2 ? 2.0*s : 0.85*s, ar === 2 ? 0 : 0.08*s), 0.06*s, 4);
  segP(o, F(0.28*s, 1.42*s, 0), F(ar ? 0.36*s : 0.34*s, ar ? 2.05*s : 0.85*s, ar ? 0.05*s : 0.08*s), 0.06*s, 4);
}
// a horse, length ~L along +z of its frame (rearing r 0..1)
function horseP(o, M, x, y, z, L, ry, rear){
  const F = (a, b, c) => { const cr = Math.cos(ry || 0), sr = Math.sin(ry || 0); return M(x + a*cr + c*sr, y + b, z - a*sr + c*cr); };
  const s = L/2.4, rr = rear || 0, lift = rr*0.5*s;
  // body (tilted when rearing)
  const bz0 = -0.65*s, bz1 = 0.65*s, by0 = 1.15*s, by1 = 1.15*s + lift;
  hexP(o, [F(-0.25*s, by0 - 0.25*s, bz0), F(0.25*s, by0 - 0.25*s, bz0), F(0.25*s, by1 - 0.25*s, bz1), F(-0.25*s, by1 - 0.25*s, bz1), F(-0.25*s, by0 + 0.3*s, bz0), F(0.25*s, by0 + 0.3*s, bz0), F(0.25*s, by1 + 0.3*s, bz1), F(-0.25*s, by1 + 0.3*s, bz1)]);
  segP(o, F(0, by1 + 0.15*s, bz1 - 0.05*s), F(0, by1 + 0.75*s, bz1 + 0.35*s), 0.16*s, 4);                // neck
  segP(o, F(0, by1 + 0.78*s, bz1 + 0.3*s), F(0, by1 + 0.55*s, bz1 + 0.72*s), 0.11*s, 4);               // head
  for (const sx of [-1, 1]){
    segP(o, F(sx*0.16*s, by0 - 0.1*s, bz0 + 0.1*s), F(sx*0.16*s, 0, bz0 - 0.05*s), 0.07*s, 4);          // hind legs
    if (rr > 0.3) segP(o, F(sx*0.16*s, by1 - 0.1*s, bz1 - 0.05*s), F(sx*0.16*s, by1 - 0.3*s + (sx > 0 ? 0.2*s : 0), bz1 + 0.45*s), 0.07*s, 4);
    else segP(o, F(sx*0.16*s, by1 - 0.1*s, bz1 - 0.1*s), F(sx*0.16*s, 0, bz1 + 0.05*s), 0.07*s, 4); }
  segP(o, F(0, by0 + 0.2*s, bz0), F(0, by0 - 0.5*s, bz0 - 0.35*s), 0.07*s, 4);                          // tail
}
// frame along edge i (a -> b) of a plan ring: u along the edge, v up, w outward (away from the ring's centroid)
function edgeFrame(ring, i){ const a = ring[i], b = ring[(i+1) % ring.length], L = Math.hypot(b[0]-a[0], b[1]-a[1]), ux = (b[0]-a[0])/L, uz = (b[1]-a[1])/L;
  let cx = 0, cz = 0; for (const p of ring){ cx += p[0]/ring.length; cz += p[1]/ring.length; }
  let nx = uz, nz = -ux; const mx = (a[0]+b[0])/2, mz = (a[1]+b[1])/2; if ((cx - mx)*nx + (cz - mz)*nz > 0){ nx = -nx; nz = -nz; }
  return {L, M:(u, v, w) => [a[0] + ux*u + nx*w, v, a[1] + uz*u + nz*w], ux, uz, nx, nz}; }
// disc / short cylinder along the frame's z axis (medallions, clock faces): centre (x, y), depth w0..w1
function discM(o, M, x, y, w0, w1, r, n){ n = n || 12; for (let i = 0; i < n; i++){ const a = i/n*TAU, b = (i+1)/n*TAU, A = [x + Math.cos(a)*r, y + Math.sin(a)*r], Bq = [x + Math.cos(b)*r, y + Math.sin(b)*r];
  quadP(o, M(A[0], A[1], w0), M(Bq[0], Bq[1], w0), M(Bq[0], Bq[1], w1), M(A[0], A[1], w1)); triP(o, M(x, y, w0), M(Bq[0], Bq[1], w0), M(A[0], A[1], w0)); triP(o, M(x, y, w1), M(A[0], A[1], w1), M(Bq[0], Bq[1], w1)); } }
// flat round-headed window / arch plate at depth w (frame u, v), width 2hw, total height h from v0
function winArchM(o, M, x, v0, hw, h, w, n){ n = n || 8; const ys = v0 + h - hw; quadP(o, M(x - hw, v0, w), M(x + hw, v0, w), M(x + hw, ys, w), M(x - hw, ys, w));
  for (let i = 0; i < n; i++){ const a = PI*i/n, b = PI*(i+1)/n; triP(o, M(x, ys, w), M(x + Math.cos(a)*hw, ys + Math.sin(a)*hw, w), M(x + Math.cos(b)*hw, ys + Math.sin(b)*hw, w)); } }
// frame with u along z (for faces normal to x): maps (u, v, w) -> (w, v, u)
const SWAP = M => (u, v, w) => M(w, v, u);
// park lamp (NYC style: black post, glass globe)
function lampP(B, x, y, z, POST, GLOBE){ cylM(B.p(POST), ID, 0.12, 0.08, y, y + 3.6, x, z, 6); cylM(B.p(POST), ID, 0.22, 0.22, y, y + 0.5, x, z, 6); latheM(B.p(GLOBE), ID, [[0, y + 3.6], [0.22, y + 3.7], [0.3, y + 4.0], [0.22, y + 4.3], [0, y + 4.38]], x, z, 8); }

// ============================================================================================================================
// Soldiers' and Sailors' Arch, Grand Army Plaza (John H. Duncan, 1889-92; quadriga by MacMonnies 1898).
// Model frame: origin = arch centre (ref nyarmyplaza (-0.3, 67.8)), rot 0.154 -> local +x along the arch (east), +z south
// (towards Prospect Park: the Army and Navy groups); the OSM parts give piers x +-(5.5..11.7), depth +-3.8, the corner
// pedestals 0-11 m, the opening crown at 15 m, the top at 24 m. Granite, Quincy base course; bronze groups and quadriga.
LANDMARKS.nyarmyplaza = {zh:'士兵与水手纪念拱门', en:"Soldiers' and Sailors' Arch", cat:'old', r:24, h:33.5,
  lt:{m:0, c:'#ffdcae', k:1.0, e:0.5},
  build(){
    const g = new THREE.Group(), B = NBat();
    const GR = '#bdb6a9', GR2 = '#aea798', BASE = '#7f7b74', BRZ = {c:'#4c5947', m:0, lk:0.35}, DK = '#5d5850', PAVE = '#9d978c';
    const W = 11.75, D = 3.8, R = 5.4, YS = 9.8, CR = YS + R;
    const o = B.p(GR), o2 = B.p(GR2);
    // plaza paving and foundation
    prismM(B.p(PAVE), ID, rectR(-14, 14, -10.5, 10.5), -3, 0.05);
    aboxM(B.p(BASE), ID, -W - 0.4, W + 0.4, -5, 1.0, -D - 0.4, D + 0.4);
    // piers (rusticated: proud joint bands on the faces)
    for (const sx of [-1, 1]){
      const x0 = sx*R, x1 = sx*W, xa = Math.min(x0, x1), xb = Math.max(x0, x1);
      aboxM(o, ID, xa, xb, 1.0, 16.4, -D, D);
      for (let y = 1.9; y < YS - 0.2; y += 0.95) aboxM(o2, ID, xa - 0.05, xb + 0.05, y, y + 0.12, -D - 0.06, D + 0.06);
      aboxM(o2, ID, xa - 0.12, xb + 0.12, YS - 0.55, YS, -D - 0.15, D + 0.15);              // impost
      // pedestals north and south, each with a pair of engaged Composite columns
      for (const sz of [-1, 1]){
        const zc = sz*(D + 1.25), px = sx*9.15;
        aboxM(B.p(BASE), ID, px - 2.3, px + 2.3, -2, 2.4, zc - 1.35, zc + 1.35);
        aboxM(o, ID, px - 2.05, px + 2.05, 2.4, 9.6, zc - 1.2, zc + 1.2);
        aboxM(o2, ID, px - 2.35, px + 2.35, 9.6, 11.0, zc - 1.45, zc + 1.45);                 // pedestal cornice
        for (const cx of [-1.35, 1.35]){ cylM(o2, ID, 0.42, 0.46, 2.6, 9.0, px + cx, zc + sz*1.2, 10); boxM(o2, ID, 1.15, 0.6, 1.15, px + cx, 9.0, zc + sz*1.2); }
        // medallion between the columns
        discM(o2, ID, px, 6.2, zc + sz*1.2, zc + sz*1.32, 0.75, 10);
      }
    }
    // the arch: faces, archivolts, coffered soffit, keystones
    for (const w of [-D, D]) archPanel(o, ID, R, YS, R, 16.4, w, 16);
    arcBand(o, ID, R - 0.02, R, YS, -D, D, 16);
    for (let k = 0; k < 7; k++){ const w = -D + 0.4 + k*(2*D - 0.8)/6; arcBand(o2, ID, R - 0.32, R, YS, w - 0.13, w + 0.13, 14); }
    for (const sz of [-1, 1]){ const w0 = sz*D, w1 = sz*(D + 0.22); arcBand(o2, ID, R, R + 0.85, YS, Math.min(w0, w1), Math.max(w0, w1), 16);
      aboxM(o2, ID, -0.75, 0.75, CR - 0.4, CR + 1.5, Math.min(w0, w1 + sz*0.15), Math.max(w0, w1 + sz*0.15));          // keystone (seal)
      // spandrel figures (low relief, winged)
      for (const sx of [-1, 1]){ const P = (u, v) => [sx*u, v, sz*(D + 0.12)]; triP(o2, P(R + 1.2, YS + 4.0), P(R + 4.6, CR + 0.6), P(R + 1.6, CR + 0.9)); triP(o2, P(R + 1.2, YS + 4.0), P(R + 4.9, YS + 3.0), P(R + 4.6, CR + 0.6)); }
    }
    // entablature, attic, parapet
    aboxM(o2, ID, -W - 0.15, W + 0.15, 16.4, 17.0, -D - 0.2, D + 0.2);
    aboxM(o, ID, -W, W, 17.0, 18.2, -D, D);
    aboxM(o2, ID, -W - 0.55, W + 0.55, 18.2, 19.0, -D - 0.6, D + 0.6);                        // main cornice
    aboxM(o, ID, -W + 0.3, W - 0.3, 19.0, 23.2, -D + 0.3, D - 0.3);                           // attic
    for (const sz of [-1, 1]) aboxM(o2, ID, -7.5, 7.5, 19.8, 22.4, sz > 0 ? D - 0.3 : -D + 0.22, sz > 0 ? D - 0.22 : -D + 0.3);   // blank attic panels
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) discM(o2, ID, sx*8.9, 21.1, sz*(D - 0.3), sz*(D - 0.15), 0.95, 12);
    aboxM(o2, ID, -W, W, 23.2, 24.0, -D, D);                                                  // parapet coping
    for (let i = -5; i <= 5; i++) for (const sz of [-1, 1]) aboxM(o2, ID, i*2.05 - 0.2, i*2.05 + 0.2, 17.1, 18.1, sz*D - 0.08, sz*D + 0.08);   // frieze triglyph rhythm
    // quadriga base and the Triumph of Columbia (horses abreast towards the park, +z), two heralds on the sides
    aboxM(o, ID, -5.2, 5.2, 24.0, 25.4, -2.6, 2.6);
    const bz = B.p(BRZ);
    for (let i = 0; i < 4; i++) horseP(bz, ID, -3.15 + i*2.1, 25.4, 0.8, 3.6, 0, i % 3 ? 0.6 : 0.85);
    hexP(bz, [[-1.5, 25.4, -2.2], [1.5, 25.4, -2.2], [1.5, 25.4, -0.4], [-1.5, 25.4, -0.4], [-1.3, 27.1, -2.0], [1.3, 27.1, -2.0], [1.3, 27.1, -0.6], [-1.3, 27.1, -0.6]]);   // chariot
    figP(bz, ID, 0, 26.6, -1.3, 3.9, 0, 1);
    segP(bz, [0.8, 30.0, -1.2], [0.9, 33.4, -1.2], 0.05, 4); quadP(bz, [0.9, 33.3, -1.2], [2.2, 33.0, -1.2], [2.2, 32.2, -1.2], [0.9, 32.4, -1.2]);   // standard
    for (const sx of [-1, 1]){ figP(bz, ID, sx*4.6, 25.4, -1.6, 3.2, 0, 1); quadP(bz, [sx*4.75, 27.2, -1.75], [sx*5.9, 29.2, -2.1], [sx*5.6, 27.6, -2.2], [sx*4.8, 26.6, -1.9]); }
    // the Army and Navy groups on the south pedestals: massed figures under a winged figure; north pedestals stay empty
    for (const sx of [-1, 1]){
      const cx = sx*9.15, cz = D + 1.25, y = 11.0;
      for (let k = 0; k < 5; k++){ const a = k/5*TAU + 0.4; figP(bz, ID, cx + Math.cos(a)*1.25, y, cz + Math.sin(a)*0.75, 2.5 + (k % 2)*0.3, a + HP, k === 1 ? 1 : 0); }
      hexP(bz, [[cx - 1.4, y, cz - 0.9], [cx + 1.4, y, cz - 0.9], [cx + 1.4, y, cz + 0.9], [cx - 1.4, y, cz + 0.9], [cx - 0.6, y + 2.4, cz - 0.5], [cx + 0.6, y + 2.4, cz - 0.5], [cx + 0.6, y + 2.4, cz + 0.5], [cx - 0.6, y + 2.4, cz + 0.5]]);
      figP(bz, ID, cx, y + 2.2, cz, 2.6, 0, 2);
      for (const sw of [-1, 1]) quadP(bz, [cx + sw*0.2, y + 4.3, cz - 0.15], [cx + sw*1.6, y + 5.6, cz - 0.4], [cx + sw*1.7, y + 4.6, cz - 0.4], [cx + sw*0.25, y + 3.8, cz - 0.15]);
    }
    // granite posts round the arch (the bronze chain reads as a dark rail)
    const PST = [];
    for (let i = 0; i <= 12; i++){ const x = -13 + i*26/12; PST.push([x, -8.6], [x, 8.6]); }
    for (let i = 1; i < 8; i++){ const z = -8.6 + i*17.2/8; PST.push([-13, z], [13, z]); }
    for (const p of PST) boxM(o2, ID, 0.45, 0.9, 0.45, p[0], 0, p[1]);
    for (const sz of [-1, 1]) aboxM(B.p(DK), ID, -13, 13, 0.62, 0.68, sz*8.6 - 0.04, sz*8.6 + 0.04);
    for (const sx of [-1, 1]) aboxM(B.p(DK), ID, sx*13 - 0.04, sx*13 + 0.04, 0.62, 0.68, -8.6, 8.6);
    B.flush(g); return g; }};
SG_PLACES.push({type:'nyarmyplaza', lat:40.6729895, lon:-73.9699035, rot:0.154});

// ============================================================================================================================
// Washington Square Arch (Stanford White, 1892, Tuckahoe marble) and the fountain on its axis (realigned 2009).
// Model frame: origin = arch centre (ref nywasharch (-0.2, -9.4)), rot -0.566 -> local +x along Washington Square North
// (ESE), local -z = up Fifth Avenue (north face, the two Washington statues), +z into the park: the fountain centre sits
// 54 m down the axis. Arch 19.2 x 7.0 m, 23 m high, opening 9.1 m wide and 14.3 m high.
LANDMARKS.nywasharch = {zh:'华盛顿广场拱门', en:'Washington Square Arch', cat:'old', r:73, h:23.2,
  lt:{m:0, c:'#ffe6c4', k:1.0, e:0.55},
  build(){
    const g = new THREE.Group(), B = NBat();
    const MB = '#e9e4d8', MB2 = '#d8d2c4', PAVE = '#b6b0a6', PAVE2 = '#a29d94', WAT = {c:'#5f7f8c', glow:'#9fd8ff', gk:0.35}, JET = {c:'#eef4f6', op:0.6, glow:'#dff2ff', gk:0.5};
    const POST = '#24272a', GLOBE = {c:'#f2ead8', glow:'#ffe2a8', gk:1.4};
    const W = 9.6, D = 3.5, R = 4.57, YS = 9.75, CR = YS + R, o = B.p(MB), o2 = B.p(MB2);
    // paving: the plaza at the arch and the walk down to the fountain
    const pv = B.p(PAVE);
    prismM(pv, ID, rectR(-12.5, 12.5, -8.5, 37.5), -2, 0.04);
    prismM(B.p(PAVE2), ID, circR(0.4, 54.3, 18.5, 40), -2, 0.03);
    // foundation and base
    aboxM(B.p(MB2), ID, -W - 0.25, W + 0.25, -4, 1.1, -D - 0.25, D + 0.25);
    for (const sx of [-1, 1]){
      const xa = Math.min(sx*R, sx*W), xb = Math.max(sx*R, sx*W);
      aboxM(o, ID, xa, xb, 1.1, 15.6, -D, D);
      aboxM(o2, ID, xa - 0.1, xb + 0.1, YS - 0.5, YS, -D - 0.12, D + 0.12);                    // impost
      // sunk panels on the pier faces and ends
      for (const sz of [-1, 1]) aboxM(o2, ID, (xa + xb)/2 - 1.5, (xa + xb)/2 + 1.5, 10.6, 14.6, sz*D - 0.06, sz*D + 0.06);
      aboxM(o2, ID, sx*W - 0.06, sx*W + 0.06, 2.5, 14.6, -2.2, 2.2);
      // north face: pedestal, the statue group (central figure with two flanking figures in high relief)
      const px = (xa + xb)/2;
      aboxM(o2, ID, px - 1.7, px + 1.7, 1.1, 3.3, -D - 1.5, -D);
      aboxM(o, ID, px - 1.9, px + 1.9, 3.3, 8.6, -D - 0.35, -D);                                 // relief backing
      figP(o, ID, px, 3.3, -D - 0.85, 4.6, PI, sx > 0 ? 0 : 1);
      figP(o2, ID, px - 1.3, 3.3, -D - 0.45, 3.6, PI, 0); figP(o2, ID, px + 1.3, 3.3, -D - 0.45, 3.6, PI, 0);
    }
    for (const w of [-D, D]) archPanel(o, ID, R, YS, R, 15.6, w, 16);
    arcBand(o, ID, R - 0.02, R, YS, -D, D, 16);
    for (let k = 0; k < 6; k++){ const w = -D + 0.45 + k*(2*D - 0.9)/5; arcBand(o2, ID, R - 0.28, R, YS, w - 0.12, w + 0.12, 14); }
    for (let k = 1; k < 8; k++){ const t = PI*k/8; for (let j = 0; j < 5; j++){ const w = -D + 1.15 + j*1.18; boxM(o2, ID, 0.35, 0.35, 0.35, Math.cos(t)*(R - 0.25), YS + Math.sin(t)*(R - 0.25) - 0.17, w); } }   // rosettes
    for (const sz of [-1, 1]){
      const w0 = sz*D, w1 = sz*(D + 0.18);
      arcBand(o2, ID, R, R + 0.75, YS, Math.min(w0, w1), Math.max(w0, w1), 16);
      aboxM(o2, ID, -0.7, 0.7, CR - 0.3, CR + 1.3, Math.min(w0, w1 + sz*0.2), Math.max(w0, w1 + sz*0.2));                     // eagle keystone
      for (const sx of [-1, 1]){ const P = (u, v) => [sx*u, v, sz*(D + 0.1)];                                              // winged victories
        triP(o2, P(R + 0.9, YS + 3.4), P(R + 3.9, CR + 0.7), P(R + 1.2, CR + 1.0)); triP(o2, P(R + 0.9, YS + 3.4), P(R + 4.2, YS + 2.5), P(R + 3.9, CR + 0.7)); }
    }
    // entablature: architrave, star frieze, cornice; attic; coping
    aboxM(o2, ID, -W - 0.1, W + 0.1, 15.6, 16.3, -D - 0.12, D + 0.12);
    aboxM(o, ID, -W, W, 16.3, 17.5, -D, D);
    for (let i = -6; i <= 6; i++) for (const sz of [-1, 1]) boxM(o2, ID, 0.42, 0.42, 0.1, i*1.42, 16.7, sz*(D + 0.04));
    aboxM(o2, ID, -W - 0.5, W + 0.5, 17.5, 18.2, -D - 0.5, D + 0.5);
    aboxM(o, ID, -W + 0.2, W - 0.2, 18.2, 22.5, -D + 0.2, D - 0.2);
    for (const sz of [-1, 1]) aboxM(o2, ID, -6.8, 6.8, 19.0, 21.7, sz > 0 ? D - 0.2 : -D + 0.12, sz > 0 ? D - 0.12 : -D + 0.2);
    aboxM(o2, ID, -W, W, 22.5, 23.2, -D, D);
    // the fountain: granite rim, water, the central plume and a ring of jets
    const FX = 0.4, FZ = 54.3;
    latheM(B.p(PAVE2), ID, [[14.6, 0.0], [14.6, 0.55], [13.7, 0.55], [13.7, 0.2]], FX, FZ, 48);
    capM(B.p(WAT), ID, circR(FX, FZ, 13.75, 48), 0.32);
    latheM(B.p(PAVE2), ID, [[2.2, 0.2], [2.2, 0.6], [1.6, 0.6], [1.6, 0.3]], FX, FZ, 16);
    latheM(B.p(JET), ID, [[0.0, 0.5], [1.2, 0.6], [0.7, 2.5], [0.35, 5.5], [0.0, 7.0]], FX, FZ, 12);
    for (let k = 0; k < 16; k++){ const a = k/16*TAU, x = FX + Math.cos(a)*6.5, z = FZ + Math.sin(a)*6.5; latheM(B.p(JET), ID, [[0.0, 0.32], [0.3, 0.4], [0.12, 2.0], [0.0, 2.4]], x, z, 5); }
    // lamps round the fountain and at the arch
    for (let k = 0; k < 8; k++){ const a = k/8*TAU + PI/8; lampP(B, FX + Math.cos(a)*17.2, 0, FZ + Math.sin(a)*17.2, POST, GLOBE); }
    for (const sx of [-1, 1]) for (const z of [-7.5, 9]) lampP(B, sx*12, 0, z, POST, GLOBE);
    B.flush(g); return g; }};
SG_PLACES.push({type:'nywasharch', lat:40.7312346, lon:-73.9971024, rot:-0.566});


// ============================================================================================================================
// Williamsburgh Savings Bank Tower, One Hanson Place (Halsey, McCormick & Helmle, 1929; 156 m).
// Model frame: origin = ref anchor, rot 0.1358 -> local axes along the lot (x across, +z south along Ashland Place, which is
// the west side, -x); Hanson Place is the north side (-z). Masses from the OSM parts: limestone base to 24 m on the whole
// lot, the buff-brick slab to 66 m, the narrower body to 85 m, the cruciform shaft to 110 m with a limestone band to 115 m,
// the 11.7 m clock stage (four 8.2 m faces centred at 130 m), the octagonal drum and the gilded dome to 156 m.
LANDMARKS.nywsb = {zh:'威廉斯堡储蓄银行大楼', en:'Williamsburgh Savings Bank Tower', cat:'old', r:45, h:156,
  lt:{m:1, c:'#ffd9a0', k:0.8},
  build(){
    const g = new THREE.Group(), B = NBat();
    const BR = {c:'#c4ad86', m:0, lk:0.3}, LS = {c:'#ddd3bc', m:0, lk:0.45}, WIN = {c:'#3b4046', m:1, fh:3.4, cw:1.5}, DK = '#2e3134';
    const GOLD = {c:'#c9a04a', m:0, lc:'#ffcf7a', lk:1.3, glow:'#a87a20', gk:0.25}, CLK = {c:'#f0e9d6', glow:'#ffeab8', gk:1.3}, ROOF = '#8f8a80';
    const br = B.p(BR), ls = B.p(LS), wn = B.p(WIN);
    // a block with window bays: recessed glazing, brick piers, spandrels per floor, a limestone cap
    const block = (x0, x1, z0, z1, y0, y1, bay, fh, piers, capH) => {
      aboxM(wn, ID, x0 + 0.3, x1 - 0.3, y0, y1, z0 + 0.3, z1 - 0.3);
      const P = piers || br;
      for (const [a0, a1, zz, ax] of [[x0, x1, z0, 0], [x0, x1, z1, 0], [z0, z1, x0, 1], [z0, z1, x1, 1]]){
        const L = a1 - a0, n = Math.max(1, Math.round(L/bay));
        for (let i = 0; i <= n; i++){ const t = a0 + L*i/n, w = (i === 0 || i === n) ? 1.5 : 1.2, c0 = Math.max(a0, t - w/2), c1 = Math.min(a1, t + w/2);
          if (ax) aboxM(P, ID, zz - 0.32, zz + 0.32, y0, y1, c0, c1); else aboxM(P, ID, c0, c1, y0, y1, zz - 0.32, zz + 0.32); }
        for (let y = y0 + fh - 1.1; y < y1 - 0.5; y += fh){ if (ax) aboxM(br, ID, zz - 0.28, zz + 0.28, y, y + 1.35, a0, a1); else aboxM(br, ID, a0, a1, y, y + 1.35, zz - 0.28, zz + 0.28); }
      }
      if (capH){ aboxM(ls, ID, x0 - 0.35, x1 + 0.35, y1 - capH, y1, z0 - 0.35, z1 + 0.35); }
      capM(B.p(ROOF), ID, rectR(x0 + 0.3, x1 - 0.3, z0 + 0.3, z1 - 0.3), y1 + 0.03);
    };
    // limestone base (granite dado), the banking hall's tall round-arched windows and the Hanson Place arch
    aboxM(B.p('#6c6a66'), ID, -19.8, 9.4, -5, 1.6, -38.1, 22.9);
    aboxM(ls, ID, -19.8, 4.6, 1.6, 24, -38.1, 22.9);
    aboxM(ls, ID, 4.6, 9.4, 1.6, 12, -38.1, 22.9);
    aboxM(B.p(ROOF), ID, 4.9, 9.1, 12, 12.2, -37.8, 22.6);
    aboxM(ls, ID, -20.15, 4.95, 22.6, 24.2, -38.45, 23.25);                                       // base cornice
    const dk = B.p(DK);
    for (let i = 0; i < 8; i++){ const z = -33.5 + i*7.6; winArchM(dk, SWAP(ID), z, 3.0, 2.3, 15.5, -19.85, 10); for (let k = 0; k < 3; k++) winArchM(dk, SWAP(ID), z - 1.6 + k*1.6, 19.0, 0.55, 2.6, -19.85, 6); }
    winArchM(dk, ID, -7.6, 1.6, 3.65, 14.9, -38.15, 12);                                          // the Hanson Place arch
    for (const x of [-15.6, 1.0]) winArchM(dk, ID, x, 3.0, 2.0, 12.5, -38.15, 10);
    for (let k = 0; k < 9; k++) winArchM(dk, ID, -17.6 + k*2.55, 19.0, 0.6, 2.8, -38.15, 6);
    for (let i = 0; i < 7; i++) winArchM(dk, SWAP(ID), -34 + i*8.4, 3.5, 1.6, 6.0, 9.45, 8);
    // the slab and the setbacks
    block(-19.5, 3.0, -37.8, 22.6, 24.2, 66, 3.0, 3.45, null, 2.2);
    for (let i = 0; i < 7; i++) winArchM(dk, ID, -17.4 + i*3.1, 62.0, 0.75, 2.6, -38.15, 6);
    block(-13.2, 2.8, -37.5, 17.0, 66, 85, 2.9, 3.45, null, 1.6);
    block(-12.9, -1.2, -19.0, 7.0, 85, 110, 2.9, 3.45, null, 0);
    block(-15.3, 1.3, -12.2, 0.3, 85, 110, 2.9, 3.45, null, 0);
    aboxM(ls, ID, -15.6, 1.6, 107.5, 115, -12.5, 0.6); aboxM(ls, ID, -13.2, -0.9, 107.5, 115, -19.3, 7.3);
    for (let i = 0; i < 4; i++) for (const z of [-19.35, 7.35]) winArchM(dk, ID, -11.4 + i*2.9, 108.5, 0.8, 4.6, z, 6);
    // the clock stage: limestone-trimmed square, four clock faces, corner piers and urns
    const cx = -7.05, cz = -5.75, hs = 5.85;
    aboxM(br, ID, cx - hs, cx + hs, 115, 140, cz - hs, cz + hs);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]){ aboxM(ls, ID, cx + sx*hs - 0.9, cx + sx*hs + 0.9, 115, 141.2, cz + sz*hs - 0.9, cz + sz*hs + 0.9);
      latheM(ls, ID, [[0, 141.2], [0.6, 141.2], [0.75, 142.2], [0.35, 143.0], [0.1, 143.6], [0, 143.8]], cx + sx*hs, cz + sz*hs, 8); }
    aboxM(ls, ID, cx - hs - 0.3, cx + hs + 0.3, 138.6, 140.2, cz - hs - 0.3, cz + hs + 0.3);
    aboxM(ls, ID, cx - hs - 0.2, cx + hs + 0.2, 120.5, 121.3, cz - hs - 0.2, cz + hs + 0.2);
    for (let s = 0; s < 4; s++){
      const M = FR(cx, 0, cz, s*HP), fz = hs + 0.05;
      discM(B.p(LS), M, 0, 130, fz, fz + 0.35, 4.45, 24);
      discM(B.p(CLK), M, 0, 130, fz + 0.35, fz + 0.45, 4.1, 24);
      for (let k = 0; k < 12; k++){ const a = k/12*TAU; discM(dk, M, Math.cos(a)*3.55, 130 + Math.sin(a)*3.55, fz + 0.45, fz + 0.5, 0.17, 5); }
      const hand = (a, L, w) => { const c = Math.cos(a), sn = Math.sin(a), px = -sn*w, py = c*w; quadP(dk, M(px, 130 + py, fz + 0.55), M(c*L + px, 130 + sn*L + py, fz + 0.55), M(c*L - px, 130 + sn*L - py, fz + 0.55), M(-px, 130 - py, fz + 0.55)); };
      hand(PI/2 - 0.5, 2.7, 0.14); hand(PI/2 + 2.1, 3.7, 0.1);
      for (let k = 0; k < 2; k++) winArchM(dk, M, -2.6 + k*5.2, 116.2, 0.7, 3.6, fz - 0.02, 6);
    }
    // octagonal drum with arched openings, balustrade, the gilded ribbed dome and its lantern
    latheM(ls, ID, [[0, 140.2], [7.3, 140.2], [7.3, 140.9], [6.4, 140.9]], cx, cz, 8);
    latheM(br, ID, [[6.25, 140.9], [6.25, 146.2]], cx, cz, 8, PI/8, PI/8 + TAU);
    for (let k = 0; k < 8; k++){ const a = PI/8 + k*PI/4 + PI/8, M = FR(cx, 0, cz, HP - a); winArchM(dk, M, 0, 141.6, 0.85, 3.6, 5.8, 6); }
    latheM(ls, ID, [[0, 146.2], [6.7, 146.2], [6.7, 146.9], [5.6, 147.0]], cx, cz, 8, PI/8, PI/8 + TAU);
    const DP = []; for (let i = 0; i <= 8; i++){ const t = i/8*HP; DP.push([5.4*Math.cos(t)*(1 - 0.08*Math.sin(t)), 147 + 6.6*Math.sin(t)]); }
    latheM(B.p(GOLD), ID, DP, cx, cz, 24);
    for (let k = 0; k < 12; k++){ const a = k/12*TAU, pts = DP.map(p => [cx + Math.cos(a)*(p[0] + 0.12), p[1] + 0.05, cz + Math.sin(a)*(p[0] + 0.12)]); for (let i = 0; i < pts.length - 1; i++) segP(B.p(GOLD), pts[i], pts[i+1], 0.13, 3); }
    latheM(ls, ID, [[0, 153.4], [1.3, 153.4], [1.3, 154.6], [1.6, 154.7], [0.9, 155.2], [0.25, 155.5], [0.08, 156], [0, 156]], cx, cz, 10);
    B.flush(g); return g; }};
SG_PLACES.push({type:'nywsb', lat:40.68545, lon:-73.97765, rot:0.1358});


// ============================================================================================================================
// Hoboken Terminal (Kenneth Murchison, 1907): Beaux-Arts ferry and rail terminal on the Hudson, copper-clad over a rusticated
// limestone base, the 69 m clock tower (2007 replica), the ferry concourse with its slip gables on the river, the Bush train
// sheds. Model frame = the ref anchor (rot 0, +x east, +z south), every outline from the OSM terminal footprint: the sheds
// x -206..-26, the head house x -26..31, the ferry wing out to the river edge (72.5, 73.8)-(131.4, -58.1); the tower stands
// at the head house's north-east corner, where the clock-tower history markers are (Hudson Place / Warrington Plaza).
// The letters on the tower frame are left out (no text): the open frame stays.
const HOB = {
  H:[[-25.6,-10.0],[-23.8,-15.2],[-28.6,-16.1],[-26.2,-24.3],[-22.4,-23.2],[-21.5,-25.4],[-6.0,-21.8],[-5.0,10.0],[21.1,9.4],[31.5,83.1],[31.5,92.6],[-11.7,92.5],[-25.6,92.8]],
  F:[[21.1,9.4],[72.0,-75.5],[104.2,-66.9],[131.4,-58.1],[115.4,-12.9],[96.4,29.2],[72.5,73.8],[65.1,69.4],[51.7,94.6],[42.5,89.0],[43.1,83.4],[31.5,83.1]],
  C:[[-6.0,-21.8],[-1.0,-21.9],[-0.6,5.5],[17.5,5.3],[26.1,-8.6],[21.4,-14.9],[30.6,-29.3],[38.3,-28.0],[65.8,-77.3],[72.0,-75.5],[21.1,9.4],[-5.0,10.0]],
  S:[-206.0, -25.6, -8.6, 95.8], RS:[72.5, 73.8], RN:[131.4, -58.1], T:[13.0, 15.5]};
LANDMARKS.nyhoboken = {zh:'霍博肯总站', en:'Hoboken Terminal', cat:'old', r:230, h:69,
  lt:{m:0, c:'#ffdcb0', k:0.8, e:0.45},
  build(){
    const g = new THREE.Group(), B = NBat();
    const CU = {c:'#5f9b88', m:0, lc:'#ffe0b8', lk:0.9}, CU2 = {c:'#4c8070', m:0, lc:'#ffe0b8', lk:0.7}, LS = '#cbc2ad', ROOF = '#5b605d', SHED = '#7e7c76', STEEL = '#3e4347';
    const WIN = {c:'#27313a', glow:'#ffcf8a', gk:0.7}, DK = '#2a3036', CLK = {c:'#efe8d4', glow:'#ffe8b0', gk:1.4}, SKY = {c:'#8fa7a6', glow:'#ffd9a0', gk:0.6};
    const cu = B.p(CU), cu2 = B.p(CU2), ls = B.p(LS), wn = B.p(WIN), dk = B.p(DK);
    const edgeF = edgeFrame;
    // ---- head house: limestone base, copper upper storeys with arched windows, cornice, roof with the Tiffany skylight
    prismM(ls, ID, HOB.H, -5, 5.5, false);
    prismM(cu, ID, offP(HOB.H, 0.3), 5.5, 19.5, false);
    prismM(cu2, ID, offP(HOB.H, -0.5), 19.5, 21.0, false);
    capM(B.p(ROOF), ID, HOB.H, 20.9);
    for (let i = 0; i < HOB.H.length; i++){ const E = edgeF(HOB.H, i); if (E.L < 9) continue;
      const n = Math.floor(E.L/6.5); for (let k = 0; k < n; k++){ const u = (k + 0.5)*E.L/n;
        winArchM(wn, E.M, u, 1.2, 1.3, 3.6, 0.06, 6); winArchM(wn, E.M, u, 7.0, 1.5, 7.5, 0.36, 6); winArchM(wn, E.M, u, 15.2, 1.0, 2.6, 0.36, 6);
        aboxM(cu2, (x, y, z) => E.M(x, y, z), u - 3.25 + 0.0, u - 3.25 + 0.7, 5.5, 19.5, 0.3, 0.75); } }
    prismM(B.p(SKY), ID, [[-12, 18], [16, 18], [22, 78], [-12, 78]], 20.9, 23.4);
    hexP(B.p(SKY), [[-12, 23.4, 18], [16, 23.4, 18], [22, 23.4, 78], [-12, 23.4, 78], [-6, 26.5, 26], [12, 26.5, 26], [16, 26.5, 70], [-6, 26.5, 70]]);
    // ---- ferry wing: copper walls and windows, the concourse roof, gabled slip sheds and the slip gables on the river
    for (let i = 0; i < HOB.F.length; i++){ if (i >= 3 && i <= 5) continue; const E = edgeF(HOB.F, i);
      aboxM(ls, E.M, 0, E.L, -5, 3.0, -0.6, 0); aboxM(cu, E.M, 0, E.L, 3.0, 14.5, -0.6, -0.25); aboxM(cu2, E.M, -0.3, E.L + 0.3, 14.5, 15.6, -0.6, 0.4); }
    capM(B.p(ROOF), ID, HOB.F, 15.5);
    for (let i = 0; i < HOB.F.length; i++){ const E = edgeF(HOB.F, i); if (E.L < 12 || i === 4 || i === 5 || i === 3) continue;
      const n = Math.floor(E.L/7); for (let k = 0; k < n; k++){ const u = (k + 0.5)*E.L/n; winArchM(wn, E.M, u, 6.0, 1.6, 7.0, 0.31, 6); } }
    // river edge: six slips, gables with great arched openings between copper pylons
    const [sx0, sz0] = HOB.RS, [sx1, sz1] = HOB.RN, RL = Math.hypot(sx1 - sx0, sz1 - sz0), rux = (sx1 - sx0)/RL, ruz = (sz1 - sz0)/RL, rnx = -ruz, rnz = rux;   // outward = river (east)
    const RM = (u, v, w) => [sx0 + rux*u + rnx*w, v, sz0 + ruz*u + rnz*w];
    const NS = 6, bw = RL/NS, roof = B.p({c:'#5a9483', m:0, lk:0.6});
    for (let k = 0; k < NS; k++){
      const uc = (k + 0.5)*bw, hw = bw/2 - 1.6, M = (u, v, w) => RM(uc + u, v, w);
      archPanel(cu, M, hw, 8.0, hw - 1.0, 15.5, 0.8, 14);
      quadP(B.p({c:'#262c30', glow:'#ffcf8a', gk:0.3}), M(-hw, -1, -2.5), M(hw, -1, -2.5), M(hw, 15.5, -2.5), M(-hw, 15.5, -2.5)); aboxM(B.p(SHED), M, -hw, hw, -1.0, 0.2, -2.5, 0.8);
      aboxM(cu, M, -hw, -hw + 1.0, 0, 8.0, 0.3, 0.8); aboxM(cu, M, hw - 1.0, hw, 0, 8.0, 0.3, 0.8);
      arcBand(cu2, M, hw - 1.0, hw - 0.2, 8.0, 0.8, 1.15, 14);
      // pediment and the shed roof running inland
      const gT = 21.5, depth = -46;
      quadP(cu, M(-hw - 1.6, 15.5, 0.9), M(hw + 1.6, 15.5, 0.9), M(hw + 1.6, 16.4, 0.9), M(-hw - 1.6, 16.4, 0.9));
      triP(cu, M(-hw - 1.6, 16.4, 0.9), M(hw + 1.6, 16.4, 0.9), M(0, gT, 0.9));
      quadP(roof, M(-hw - 1.9, 16.2, 1.2), M(0, gT + 0.3, 1.2), M(0, gT + 0.3, depth), M(-hw - 1.9, 16.2, depth));
      quadP(roof, M(hw + 1.9, 16.2, 1.2), M(0, gT + 0.3, 1.2), M(0, gT + 0.3, depth), M(hw + 1.9, 16.2, depth));
      triP(cu, M(-hw - 1.6, 16.0, depth), M(hw + 1.6, 16.0, depth), M(0, gT, depth));
      discM(cu2, M, 0, 18.3, 0.9, 1.15, 1.2, 10);
      // copper pylon with a finial between the slips
      const P = (u, v, w) => RM(k*bw + u, v, w);
      aboxM(cu2, P, -1.6, 1.6, -5, 19.5, -1.0, 1.6); aboxM(cu, P, -1.9, 1.9, 19.5, 20.6, -1.3, 1.9);
      latheM(cu2, (x, y, z) => P(x, y, z), [[0, 20.6], [0.9, 20.6], [0.9, 22.4], [0.5, 23.6], [0.1, 24.6], [0, 24.8]], 0, 0.3, 8);
    }
    { const P = (u, v, w) => RM(RL + u, v, w); aboxM(cu2, P, -1.6, 1.6, -5, 19.5, -1.0, 1.6); aboxM(cu, P, -1.9, 1.9, 19.5, 20.6, -1.3, 1.9); latheM(cu2, P, [[0, 20.6], [0.9, 20.6], [0.9, 22.4], [0.5, 23.6], [0.1, 24.6], [0, 24.8]], 0, 0.3, 8); }
    // timber fender racks in front of the slips
    for (let k = 0; k <= NS; k++) for (let j = 0; j < 4; j++) boxM(B.p('#5a4c3e'), (x, y, z) => RM(k*bw + x, y, z + 2 + j*3.2), 0.5, 4.5, 0.5, 0, -3, 0);
    // ---- the Hudson Place bus station (north of the sheds; it falls under the terminal's ground plan): limestone base,
    //      copper upper storey, hipped copper roof
    { const BT = [[-126.8,-49.6],[-93.8,-41.9],[-92.9,-20.5],[-126.1,-20.3]];
      prismM(ls, ID, BT, -5, 4.5, false); prismM(cu, ID, offP(BT, 0.25), 4.5, 11.5, false); prismM(cu2, ID, offP(BT, -0.4), 11.5, 12.4, false);
      for (let i = 0; i < 4; i++){ const E = edgeF(BT, i), n = Math.floor(E.L/5.5); for (let k = 0; k < n; k++){ const u = (k + 0.5)*E.L/n; winArchM(wn, E.M, u, 0.8, 1.4, 3.2, 0.05, 6); winArchM(wn, E.M, u, 6.0, 1.2, 4.4, 0.3, 6); } }
      hexP(B.p({c:'#5a9483', m:0, lk:0.6}), [[-127.2,12.4,-50.0],[-93.4,12.4,-42.3],[-92.5,12.4,-20.1],[-126.5,12.4,-19.9],[-118,14.7,-41],[-101,14.7,-37],[-101,14.7,-28],[-118,14.7,-28]]);
      prismM(ls, ID, [[-44.9,92.7],[-31.3,93.0],[-31.8,106.5],[-44.4,106.4]], -5, 6.0, true); }
    // ---- the Warrington Plaza canopy (glass on slim steel posts)
    capM(B.p({c:'#9fb4b8', op:0.75}), ID, HOB.C, 4.6);
    for (let i = 0; i < HOB.C.length; i++){ const p = HOB.C[i]; cylM(B.p(STEEL), ID, 0.15, 0.15, -1, 4.6, p[0], p[1], 6); }
    // ---- Bush train sheds: low concrete vaults along the tracks with the smoke slot at each crown, steel columns
    const [x0, x1, z0, z1] = HOB.S, nb = 8, bwS = (z1 - z0)/nb, sh = B.p(SHED), st = B.p(STEEL);
    for (let k = 0; k < nb; k++){
      const za = z0 + k*bwS, zb = za + bwS, zm = (za + zb)/2, secs = [];
      const prof = []; for (let i = 0; i <= 6; i++){ const t = i/6, z = lerp(za, zm - 0.5, t); prof.push([z, 5.4 + 1.4*Math.sin(t*HP)]); }
      for (let i = 6; i >= 0; i--){ const t = i/6, z = lerp(zb, zm + 0.5, t); prof.push([z, 5.4 + 1.4*Math.sin(t*HP)]); }
      for (let i = 0; i < 6; i++){ quadP(sh, [x0, prof[i][1], prof[i][0]], [x1, prof[i][1], prof[i][0]], [x1, prof[i+1][1], prof[i+1][0]], [x0, prof[i+1][1], prof[i+1][0]]);
        quadP(sh, [x0, prof[i+7][1], prof[i+7][0]], [x1, prof[i+7][1], prof[i+7][0]], [x1, prof[i+8][1], prof[i+8][0]], [x0, prof[i+8][1], prof[i+8][0]]); }
      aboxM(sh, ID, x0, x1, 7.2, 7.35, zm - 1.1, zm + 1.1);                                      // slot hood
      for (let x = x0 + 6; x < x1; x += 12){ aboxM(st, ID, x - 0.2, x + 0.2, -5, 7.2, zm - 0.05 - 0.6, zm - 0.55); aboxM(st, ID, x - 0.2, x + 0.2, -5, 7.2, zm + 0.55, zm + 0.6); }
      for (let x = x0 + 12; x < x1; x += 12) cylM(st, ID, 0.25, 0.25, -5, 5.4, x, za, 6);
    }
    aboxM(B.p(SHED), ID, x0, x1, 4.8, 5.5, z0 - 0.3, z0 + 0.3); aboxM(B.p(SHED), ID, x0, x1, 4.8, 5.5, z1 - 0.3, z1 + 0.3);
    aboxM(cu2, ID, x1 - 0.4, x1 + 0.1, -5, 7.3, z0, z1);
    // ---- the clock tower: copper-clad shaft on the head house, clock stage, the open letter frame (no letters), cap
    const [tx, tz] = HOB.T, th = 4.8;
    aboxM(cu, ID, tx - th, tx + th, 18, 45.5, tz - th, tz + th);
    for (const ax of [-1, 1]) for (const az of [-1, 1]) aboxM(cu2, ID, tx + ax*th - 0.7, tx + ax*th + 0.7, 18, 47, tz + az*th - 0.7, tz + az*th + 0.7);
    aboxM(cu2, ID, tx - th - 0.4, tx + th + 0.4, 45.5, 46.6, tz - th - 0.4, tz + th + 0.4);
    aboxM(cu, ID, tx - th + 0.4, tx + th - 0.4, 46.6, 53.2, tz - th + 0.4, tz + th - 0.4);
    aboxM(cu2, ID, tx - th - 0.2, tx + th + 0.2, 53.2, 54.0, tz - th - 0.2, tz + th + 0.2);
    for (let s = 0; s < 4; s++){
      const M = FR(tx, 0, tz, s*HP), fz = th - 0.35;
      discM(cu2, M, 0, 49.9, fz, fz + 0.2, 2.15, 18); discM(B.p(CLK), M, 0, 49.9, fz + 0.2, fz + 0.3, 1.85, 18);
      quadP(dk, M(-0.06, 49.9, fz + 0.35), M(0.06, 49.9, fz + 0.35), M(0.06, 51.2, fz + 0.35), M(-0.06, 51.2, fz + 0.35));
      quadP(dk, M(0, 49.84, fz + 0.36), M(0, 49.96, fz + 0.36), M(1.0, 49.5, fz + 0.36), M(1.0, 49.38, fz + 0.36));
      for (let k = 0; k < 3; k++) winArchM(wn, M, -2.6 + k*2.6, 24 + 0, 0.55, 3.0, th + 0.02, 6), winArchM(wn, M, -2.6 + k*2.6, 32, 0.55, 3.0, th + 0.02, 6), winArchM(wn, M, -2.6 + k*2.6, 40, 0.55, 3.0, th + 0.02, 6);
      // letter frame: an open copper grid on each side
      const lf = (a, b, c, d) => aboxM(cu2, M, a, b, c, d, th - 0.15, th + 0.15);
      lf(-th, th, 54.0, 54.4); lf(-th, th, 58.6, 59.0); for (let k = 0; k <= 5; k++){ const u = -th + k*2*th/5; lf(u - 0.12, u + 0.12, 54.4, 58.6); }
    }
    for (const ax of [-1, 1]) for (const az of [-1, 1]) cylM(cu2, ID, 0.3, 0.3, 54, 59, tx + ax*(th - 0.3), tz + az*(th - 0.3), 6);
    aboxM(cu2, ID, tx - th + 0.6, tx + th - 0.6, 54.0, 59.4, tz - th + 0.6, tz + th - 0.6);
    hexP(cu, [[tx - th, 59.4, tz - th], [tx + th, 59.4, tz - th], [tx + th, 59.4, tz + th], [tx - th, 59.4, tz + th], [tx - 1.6, 64.5, tz - 1.6], [tx + 1.6, 64.5, tz - 1.6], [tx + 1.6, 64.5, tz + 1.6], [tx - 1.6, 64.5, tz + 1.6]]);
    latheM(cu2, ID, [[0, 64.5], [1.3, 64.5], [1.1, 65.6], [0.4, 66.4], [0.12, 66.6], [0.06, 69], [0, 69]], tx, tz, 8);
    B.flush(g); return g; }};
SG_PLACES.push({type:'nyhoboken', lat:40.7353, lon:-74.0277, rot:0});


// ============================================================================================================================
// Brooklyn Museum (McKim, Mead & White, 1893-1927) on Eastern Parkway, with the 2004 glass entrance pavilion (Polshek).
// Model frame: origin = ref anchor, rot -0.2618 -> local +x along the Eastern Parkway front (ESE), -z = the front (NNE).
// The OSM footprint gives the 150 m front (west wing, central pavilion, east wing), the east block along Washington Avenue
// and the fan-shaped pavilion (circle centre (-11.5, 3), r ~ 40). Rusticated base, giant Ionic pilasters, entablature and
// cornice with the 3.7 m figures, the hexastyle Ionic portico and pediment, the low saucer dome; light granite / limestone.
const BKM = {
  ring:[[-85.4,22.4],[-85.3,12.7],[-86.0,12.7],[-86.0,-3.0],[-70.1,-3.0],[-70.1,-2.0],[-64.8,-2.0],[-64.9,-1.6],[-31.5,-1.5],[22.0,-1.1],[43.0,-1.1],[47.9,-1.2],[47.9,-2.1],[64.1,-2.0],[64.0,13.3],[65.6,13.4],[65.4,18.5],[79.7,18.4],[80.0,59.9],[62.9,59.4],[62.9,65.2],[65.0,65.2],[65.0,77.8],[-0.2,77.7],[-0.2,58.3],[3.0,58.3],[3.0,51.6],[0.3,51.6],[-0.1,26.0],[-34.7,26.4],[-34.8,19.0],[-46.9,19.0],[-46.7,20.3],[-56.1,20.3],[-56.1,21.7]],
  pav:[[-31.5,-1.5],[-33.6,-5.6],[-38.7,-7.1],[-38.0,-8.9],[-36.0,-11.8],[-46.3,-18.7],[-41.2,-25.2],[-35.0,-30.2],[-25.7,-34.9],[-16.5,-36.9],[-8.5,-36.8],[-0.6,-35.5],[8.1,-31.8],[12.9,-28.8],[18.1,-24.2],[21.8,-19.1],[24.3,-14.7],[19.2,-11.8],[22.5,-4.1],[22.0,-1.1]],
  pc:[-11.5, 3.0], px:-11.0};
function rayPoly(cx, cz, dx, dz, P){ let best = -1;   // farthest crossing
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], den = dx*ez - dz*ex; if (Math.abs(den) < 1e-9) continue;
  const t = ((a[0]-cx)*ez - (a[1]-cz)*ex)/den, u = ((a[0]-cx)*dz - (a[1]-cz)*dx)/den; if (t > 0.01 && u >= 0 && u <= 1) best = Math.max(best, t); } return best > 0 ? best : 1e9; }
LANDMARKS.nybkmuseum = {zh:'布鲁克林博物馆', en:'Brooklyn Museum', cat:'old', r:110, h:46,
  lt:{m:0, c:'#ffe1b8', k:0.85, e:0.5, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = NBat();
    const ST = '#d4cdbd', ST2 = '#c3bba9', ROOF = '#8d8b85', WIN = {c:'#2d3237', glow:'#ffcf90', gk:0.35}, CU = {c:'#6f9c8c', m:0, lk:0.5};
    const GL = {c:'#86a6ad', glow:'#ffdcae', gk:0.75}, FRM = '#5d6266';
    const st = B.p(ST), st2 = B.p(ST2), wn = B.p(WIN);
    // the main mass with the classical order on every long facade
    prismM(st, ID, BKM.ring, -5, 25.5, false);
    capM(B.p(ROOF), ID, BKM.ring, 25.4);
    for (let i = 0; i < BKM.ring.length; i++){ const E = edgeFrame(BKM.ring, i); if (E.L < 7) continue;
      aboxM(st2, E.M, -0.2, E.L + 0.2, 0, 7.5, 0, 0.35);                                        // rusticated base
      for (let y = 1.2; y < 7.3; y += 1.25) aboxM(st, E.M, -0.2, E.L + 0.2, y, y + 0.15, 0.3, 0.42);
      aboxM(st2, E.M, -0.3, E.L + 0.3, 20.8, 23.0, 0, 0.55); aboxM(st2, E.M, -0.6, E.L + 0.6, 23.0, 23.8, 0, 1.0);   // entablature, cornice
      aboxM(st, E.M, -0.1, E.L + 0.1, 23.8, 25.6, 0, 0.3);                                      // attic
      const n = Math.max(1, Math.round(E.L/5.6)), bw = E.L/n, front = E.nz < -0.8;
      for (let k = 0; k <= n; k++){ const u = k*bw; aboxM(st2, E.M, u - 0.6, u + 0.6, 7.5, 20.8, 0, 0.5); if (front && k > 0 && k < n && E.L > 30) figP(st, E.M, u, 25.6, 0.0, 3.6, 0, k % 3 === 0 ? 1 : 0); }
      for (let k = 0; k < n; k++){ const u = (k + 0.5)*bw; aboxM(wn, E.M, u - 1.1, u + 1.1, 10.0, 17.5, 0, 0.08); winArchM(wn, E.M, u, 2.2, 1.0, 3.8, 0.43, 6); aboxM(st2, E.M, u - 1.5, u + 1.5, 17.5, 18.4, 0, 0.3); }
    }
    // the central pavilion, the upper galleries and the saucer dome
    aboxM(st, ID, -31.5, 22.0, 0, 28.5, -1.6, 26.0);
    aboxM(st2, ID, -32.0, 22.5, 26.8, 28.6, -2.2, 26.5);
    aboxM(st, ID, -30.0, 5.0, 28.6, 34.0, 2.0, 24.0); aboxM(st2, ID, -30.4, 5.4, 33.4, 34.4, 1.6, 24.4);
    capM(B.p(ROOF), ID, rectR(-31.5, 22.0, -1.6, 26.0), 28.55); capM(B.p(ROOF), ID, rectR(-30, 5, 2, 24), 34.35);
    const dx = BKM.px, dz = 13.0;
    latheM(st, ID, [[0, 34.4], [10.5, 34.4], [10.5, 38.0], [11.0, 38.0], [11.0, 38.7], [10.2, 38.8]], dx, dz, 32);
    const DP = []; for (let i = 0; i <= 8; i++){ const t = i/8*HP; DP.push([10.2*Math.cos(t), 38.8 + 5.0*Math.sin(t)]); }
    latheM(B.p(CU), ID, DP, dx, dz, 32);
    latheM(st, ID, [[0, 43.6], [1.6, 43.6], [1.6, 45.2], [1.9, 45.3], [0.4, 45.9], [0, 46]], dx, dz, 12);
    // copper cresting along the attic of the central pavilion
    for (let x = -30; x <= 20.5; x += 1.5) boxM(B.p(CU), ID, 0.35, 0.8, 0.35, x, 28.6, -1.9);
    // the portico: podium (where the grand stair landed), six Ionic columns, entablature and pediment
    const px = BKM.px, pz0 = -1.6, pz1 = -8.6, PW = 16.8;
    aboxM(st2, ID, px - PW, px + PW, 0, 8.5, pz1, pz0);
    for (let k = 0; k < 6; k++){ const x = px - 15 + k*6; latheM(st, ID, [[0, 8.5], [1.15, 8.5], [1.15, 9.2], [0.85, 9.4], [0.78, 21.0], [1.1, 21.4], [1.1, 22.0], [0, 22.0]], x, pz1 + 1.4, 12);
      for (const sx of [-1, 1]) cylM(st2, ID, 0.42, 0.42, 21.0, 21.9, x + sx*1.0, pz1 + 1.4, 8); }
    for (const x of [px - PW + 0.6, px + PW - 0.6]) aboxM(st, ID, x - 0.7, x + 0.7, 8.5, 22.0, pz1 + 0.6, pz0);
    aboxM(st2, ID, px - PW - 0.3, px + PW + 0.3, 22.0, 24.6, pz1 - 0.3, pz0);
    aboxM(st2, ID, px - PW - 0.7, px + PW + 0.7, 24.6, 25.4, pz1 - 0.8, pz0);
    { const zf = pz1 - 0.6, zb = pz0, y0 = 25.4, y1 = 31.5, a = px - PW - 0.7, b = px + PW + 0.7;
      triP(st, [a, y0, zf], [b, y0, zf], [px, y1, zf]); triP(st, [a, y0, zb], [px, y1, zb], [b, y0, zb]);
      quadP(B.p(ROOF), [a - 0.3, y0 - 0.1, zf - 0.3], [px, y1 + 0.3, zf - 0.3], [px, y1 + 0.3, zb + 1], [a - 0.3, y0 - 0.1, zb + 1]);
      quadP(B.p(ROOF), [b + 0.3, y0 - 0.1, zf - 0.3], [px, y1 + 0.3, zf - 0.3], [px, y1 + 0.3, zb + 1], [b + 0.3, y0 - 0.1, zb + 1]);
      for (let k = 0; k < 7; k++){ const x = px - 12 + k*4, h = (1 - Math.abs(x - px)/(PW + 0.7))*(y1 - y0); if (h > 1.6) figP(st2, ID, x, y0 + 0.2, zf + 0.25, Math.min(2.6, h - 0.6), 0, 0); } }
    // the glass entrance pavilion: a fan of glass stepping up towards the portico, steel frame
    const [cx, cz] = BKM.pc, gl = B.p(GL), fr = B.p(FRM), N = 28, a0 = Math.atan2(-11.8 - cz, -36.0 - cx), a1 = Math.atan2(-11.8 - cz, 19.2 - cx);
    const TI = [[1.0, 6.2], [0.75, 8.4], [0.5, 10.4], [0.25, 12.2]];
    let prev = null;
    for (let i = 0; i <= N; i++){
      const a = a0 + (a1 - a0 + (a1 < a0 ? TAU : 0))*i/N, dxv = Math.cos(a), dzv = Math.sin(a);
      const ro = Math.min(rayPoly(cx, cz, dxv, dzv, BKM.pav), 60), ri = dzv < -0.05 ? Math.min(ro, (pz0 - cz)/dzv) : ro;
      const pts = TI.map(([t, h]) => ({r:lerp(ri, ro, t), h}));
      if (prev){
        for (let k = 0; k < pts.length; k++){
          const pa = prev.p[k], pb = pts[k], P = (d, r, y) => [cx + Math.cos(d)*r, y, cz + Math.sin(d)*r];
          const yLo = k === 0 ? -3 : pts[k - 1].h, rIn = k < pts.length - 1 ? [prev.p[k+1].r, pts[k+1].r] : [ri, ri];
          quadP(gl, P(prev.a, pa.r, yLo), P(a, pb.r, yLo), P(a, pb.r, pb.h), P(prev.a, pa.r, pa.h));                       // riser
          quadP(gl, P(prev.a, pa.r, pa.h), P(a, pb.r, pb.h), P(a, rIn[1], pb.h), P(prev.a, rIn[0], pa.h));                 // tread
          segP(fr, P(prev.a, pa.r + 0.05, pa.h + 0.05), P(a, pb.r + 0.05, pb.h + 0.05), 0.12, 4);
        }
      }
      for (const p of pts){ const P = y => [cx + dxv*(p.r + 0.06), y, cz + dzv*(p.r + 0.06)]; segP(fr, P(p === pts[0] ? 0 : pts[pts.indexOf(p) - 1].h), P(p.h), 0.1, 4); }
      prev = {a, p:pts};
    }
    // four slim metal pylons at the plaza edge and the plaza paving with its fountain jets
    for (let k = 0; k < 4; k++){ const a = -PI/2 + (k - 1.5)*0.45, x = cx + Math.cos(a)*43.5, z = cz + Math.sin(a)*43.5; aboxM(fr, ID, x - 0.45, x + 0.45, -3, 7.5, z - 0.3, z + 0.3); }
    B.flush(g); return g; }};
SG_PLACES.push({type:'nybkmuseum', lat:40.6712, lon:-73.9636, rot:-0.2618});


// ============================================================================================================================
// Arthur Ashe Stadium (Rossetti, 1997; retractable roof 2016), USTA Billie Jean King National Tennis Center.
// Model frame: origin = the bowl's centre (ref nyashe (-12.2, 1.0)), rot 0.419 -> the OSM octagon becomes axis-aligned: a
// 157 m square with 55 m chamfers (long walls at x, z = +-78.6); the court runs along local z (NNW-SSE). The bowl: lower
// tier, suite rings, the steep upper tier to the 27 m rim. The roof: eight steel columns at the octagon's corners, two
// primary trusses (along x at z = +-42) and two secondary ones, a perimeter ring truss, the fixed PTFE ring roof round the
// 84 m opening, and the two sliding panels parked open over the east and west sides. No names, logos or sponsor marks.
const ASH = {oct:[[-78.6,-39.4],[-39.4,-78.6],[39.4,-78.6],[78.6,-39.4],[78.6,39.4],[39.4,78.6],[-39.4,78.6],[-78.6,39.4]], op:42, col:[[81,40.5],[40.5,81],[-40.5,81],[-81,40.5],[-81,-40.5],[-40.5,-81],[40.5,-81],[81,-40.5]]};
LANDMARKS.nyashe = {zh:'阿瑟·阿什球场', en:'Arthur Ashe Stadium', cat:'new', r:100, h:40,
  lt:{m:0, c:'#e8f0ff', k:0.55, e:0.4},
  build(){
    const g = new THREE.Group(), B = NBat();
    const CON = '#c4c1b9', BRK = '#8a6352', DKG = {c:'#2b3238', glow:'#ffd9a0', gk:0.55}, SEAT = '#2c4870', SEAT2 = '#33527d', CRT = {c:'#2f62a8', glow:'#6f9fff', gk:0.25}, CRT2 = {c:'#5d8b67', glow:'#7fb58a', gk:0.15};
    const FAB = {c:'#eceee9', glow:'#fff1dc', gk:0.3}, STL = '#dfe2e3', STL2 = '#a9aeb2', LINE = '#f2f2ee';
    const oct = ASH.oct, ray = (P, a) => { const dx = Math.cos(a), dz = Math.sin(a); let best = 1e9; for (let i = 0; i < P.length; i++){ const p = P[i], q = P[(i+1) % P.length], ex = q[0]-p[0], ez = q[1]-p[1], den = dx*ez - dz*ex; if (Math.abs(den) < 1e-9) continue; const t = (p[0]*ez - p[1]*ex)/den, u = (p[0]*dz - p[1]*dx)/den; if (t > 0 && u >= -1e-6 && u <= 1 + 1e-6) best = Math.min(best, t); } return best; };
    // rounded rectangle of the field (x +-19, z +-31, corner radius 8)
    const field = []; for (let q = 0; q < 4; q++){ const sx = q === 0 || q === 3 ? 1 : -1, sz = q < 2 ? 1 : -1; for (let i = 0; i <= 4; i++){ const a = q*HP + i/4*HP; field.push([sx*11 + Math.cos(a)*8, sz*23 + Math.sin(a)*8]); } }
    const NA = 96, ang = [], rin = [], rout = [];
    for (let i = 0; i < NA; i++){ const a = i/NA*TAU; ang.push(a); rin.push(ray(field, a)); rout.push(ray(oct, a) - 1.2); }
    const P = (i, t, y) => { const a = ang[i % NA], r = lerp(rin[i % NA], rout[i % NA], t); return [Math.cos(a)*r, y, Math.sin(a)*r]; };
    // the facade: brick podium, concrete upper walls with the concourse bands and fins
    prismM(B.p(BRK), ID, oct, -5, 6.5, false);
    prismM(B.p(CON), ID, oct, 6.5, 27.2, false);
    for (let i = 0; i < 8; i++){ const E = edgeFrame(oct, i);
      for (const [y0, y1] of [[7.6, 9.6], [14.4, 16.6], [21.0, 23.0]]) aboxM(B.p(DKG), E.M, 1.0, E.L - 1.0, y0, y1, 0, 0.06);
      const n = Math.round(E.L/6); for (let k = 0; k <= n; k++){ const u = k*E.L/n; aboxM(B.p(CON), E.M, u - 0.35, u + 0.35, 6.5, 27.2, 0, 0.9); }
      aboxM(B.p(STL2), E.M, -0.5, E.L + 0.5, 26.6, 27.6, 0, 1.4);                              // rim fascia
      for (let k = 1; k < 4; k++) aboxM(B.p(DKG), E.M, k*E.L/4 - 2.5, k*E.L/4 + 2.5, 0, 4.2, 0, 0.06);   // gates
    }
    // field and the court (blue inner court, green surround, white lines)
    capM(B.p(CRT2), ID, field, 0.6);
    capM(B.p(CRT), ID, rectR(-8.5, 8.5, -15.5, 15.5), 0.64);
    const ln = B.p(LINE), L = (x0, x1, z0, z1) => aboxM(ln, ID, x0, x1, 0.64, 0.68, z0, z1);
    L(-5.49, -5.44, -11.89, 11.89); L(5.44, 5.49, -11.89, 11.89); L(-4.12, -4.07, -11.89, 11.89); L(4.07, 4.12, -11.89, 11.89);
    L(-5.49, 5.49, -11.89, -11.84); L(-5.49, 5.49, 11.84, 11.89); L(-4.12, 4.12, -6.43, -6.38); L(-4.12, 4.12, 6.38, 6.43); L(-0.03, 0.03, -6.4, 6.4);
    aboxM(B.p('#30343a'), ID, -6.4, 6.4, 0.6, 1.07, -0.03, 0.03);                                  // net
    // the bowl: lower tier, suite levels (glazed), upper tier; risers and treads all round
    const tier = (t0, t1, y0, y1, rows, col, col2) => {
      for (let k = 0; k < rows; k++){ const ta = lerp(t0, t1, k/rows), tb = lerp(t0, t1, (k + 1)/rows), ya = lerp(y0, y1, k/rows), yb = lerp(y0, y1, (k + 1)/rows), o = B.p(k % 2 ? col : col2);
        for (let i = 0; i < NA; i++){ quadP(o, P(i, ta, ya), P(i + 1, ta, ya), P(i + 1, ta, yb), P(i, ta, yb)); quadP(o, P(i, ta, yb), P(i + 1, ta, yb), P(i + 1, tb, yb), P(i, tb, yb)); } } };
    tier(0.0, 0.33, 0.6, 10.5, 12, SEAT, SEAT2);
    for (let i = 0; i < NA; i++){ quadP(B.p(DKG), P(i, 0.33, 10.5), P(i + 1, 0.33, 10.5), P(i + 1, 0.36, 17.5), P(i, 0.36, 17.5)); quadP(B.p(CON), P(i, 0.33, 10.5), P(i + 1, 0.33, 10.5), P(i + 1, 0.33, 10.0), P(i, 0.33, 10.0));
      quadP(B.p(CON), P(i, 0.36, 17.5), P(i + 1, 0.36, 17.5), P(i + 1, 0.4, 17.5), P(i, 0.4, 17.5)); }
    tier(0.4, 1.0, 17.5, 27.0, 16, SEAT, SEAT2);
    for (let i = 0; i < NA; i++) quadP(B.p(CON), P(i, 0.0, 0.0), P(i + 1, 0.0, 0.0), P(i + 1, 0.0, 1.6), P(i, 0.0, 1.6));    // field wall
    // aisles (light radial stripes on the tiers)
    for (let i = 0; i < NA; i += 6){ segP(B.p(CON), P(i, 0.02, 1.0), P(i, 0.32, 10.6), 0.35, 3); segP(B.p(CON), P(i, 0.42, 17.9), P(i, 0.98, 27.2), 0.35, 3); }
    // ---- roof superstructure
    const st = B.p(STL), st2 = B.p(STL2), RY0 = 29.0, RY1 = 37.0, OP = ASH.op;
    for (const [cx, cz] of ASH.col){
      aboxM(B.p(CON), ID, cx - 3, cx + 3, -5, 1.5, cz - 3, cz + 3);
      aboxM(st, ID, cx - 1.4, cx + 1.4, 1.5, RY1 + 1.2, cz - 1.4, cz + 1.4);
      const d = Math.hypot(cx, cz), ux = cx/d, uz = cz/d, tx = -uz, tz = ux;                     // two raking braces to the ring truss
      for (const s of [-1, 1]) segP(st2, [cx, 6, cz], [cx - ux*8 + tx*s*16, RY0, cz - uz*8 + tz*s*16], 0.5, 6);
    }
    // perimeter ring truss over the rim (octagon grown 2 m)
    const ringT = oct.map(p => [p[0]*1.03, p[1]*1.03]);
    for (let i = 0; i < 8; i++){ const a = ringT[i], b = ringT[(i+1) % 8], n = Math.round(Math.hypot(b[0]-a[0], b[1]-a[1])/6);
      segP(st, [a[0], RY0, a[1]], [b[0], RY0, b[1]], 0.35, 4); segP(st, [a[0], RY0 + 4.5, a[1]], [b[0], RY0 + 4.5, b[1]], 0.35, 4);
      for (let k = 0; k < n; k++){ const p = [lerp(a[0], b[0], k/n), lerp(a[1], b[1], k/n)], q = [lerp(a[0], b[0], (k + 1)/n), lerp(a[1], b[1], (k + 1)/n)]; segP(st2, [p[0], k % 2 ? RY0 : RY0 + 4.5, p[1]], [q[0], k % 2 ? RY0 + 4.5 : RY0, q[1]], 0.22, 4); } }
    // primary (along x) and secondary (along z) trusses on the column lines: Warren trusses 8 m deep
    const truss = (a, b, y0, y1, n, r) => { segP(st, [a[0], y0, a[1]], [b[0], y0, b[1]], r, 4); segP(st, [a[0], y1, a[1]], [b[0], y1, b[1]], r, 4);
      for (let k = 0; k < n; k++){ const p = [lerp(a[0], b[0], k/n), lerp(a[1], b[1], k/n)], q = [lerp(a[0], b[0], (k + 1)/n), lerp(a[1], b[1], (k + 1)/n)];
        segP(st2, [p[0], k % 2 ? y0 : y1, p[1]], [q[0], k % 2 ? y1 : y0, q[1]], r*0.6, 4); segP(st2, [p[0], y0, p[1]], [p[0], y1, p[1]], r*0.5, 4); } };
    for (const s of [-1, 1]){ for (const dz of [-1.6, 1.6]) truss([-84, s*OP + dz], [84, s*OP + dz], RY0, RY1 + 1.2, 28, 0.55); truss([s*OP, -84], [s*OP, 84], RY0 + 0.5, RY1, 28, 0.45); }
    // the fixed fabric ring roof between the ring truss and the opening (square +-OP), and the radial secondary trusses
    const sq = [[-OP, -OP], [OP, -OP], [OP, OP], [-OP, OP]], NR = 64, fab = B.p(FAB);
    for (let i = 0; i < NR; i++){
      const a0 = i/NR*TAU, a1 = (i + 1)/NR*TAU, ri0 = ray(sq, a0), ri1 = ray(sq, a1), ro0 = ray(oct, a0)*1.03, ro1 = ray(oct, a1)*1.03;
      const Q = (a, r, y) => [Math.cos(a)*r, y, Math.sin(a)*r];
      quadP(fab, Q(a0, ri0, RY1 - 1.0), Q(a1, ri1, RY1 - 1.0), Q(a1, lerp(ri1, ro1, 0.5), RY1 - 2.6), Q(a0, lerp(ri0, ro0, 0.5), RY1 - 2.6));
      quadP(fab, Q(a0, lerp(ri0, ro0, 0.5), RY1 - 2.6), Q(a1, lerp(ri1, ro1, 0.5), RY1 - 2.6), Q(a1, ro1, RY0 + 3.0), Q(a0, ro0, RY0 + 3.0));
      if (i % 2 === 0){ segP(st2, Q(a0, ri0, RY1 - 0.6), Q(a0, ro0, RY0 + 4.5), 0.3, 4); segP(st2, Q(a0, ri0, RY1 - 3.5), Q(a0, ro0, RY0), 0.25, 4); }
    }
    // the two sliding panels, parked open over the east and west sides: shallow fabric vaults with steel ribs
    for (const s of [-1, 1]){
      const x0 = s*OP, x1 = s*84, n = 10, secs = [];
      for (let k = 0; k <= n; k++){ const z = lerp(-OP - 2, OP + 2, k/n), row = []; for (let j = 0; j <= 6; j++){ const x = lerp(x0, x1, j/6); row.push([x, RY1 + 1.4 + 1.6*Math.sin(j/6*PI), z]); } secs.push(row); }
      stripP(fab, secs);
      for (let k = 0; k <= n; k += 2) for (let j = 0; j < 6; j++) segP(st, secs[k][j], secs[k][j+1], 0.3, 4);
    }
    // floodlights under the roof edge (glow at night)
    for (let i = 0; i < 32; i++){ const a = i/32*TAU, r = ray(sq, a) + 3; boxM(B.p({c:'#f4f4ee', glow:'#ffffff', gk:1.2}), ID, 1.4, 0.5, 1.4, Math.cos(a)*r, RY1 - 3.2, Math.sin(a)*r); }
    B.flush(g); return g; }};
SG_PLACES.push({type:'nyashe', lat:40.749891, lon:-73.8470444, rot:0.419});


// ============================================================================================================================
// Intrepid Museum: USS Intrepid (CV-11), Essex-class carrier as modernised (SCB-27C / SCB-125: enclosed hurricane bow,
// angled flight deck, starboard deck-edge elevator), moored on the south side of Pier 86, with aircraft on the flight deck and
// the Space Shuttle Pavilion over the aft flight deck. Ship frame: origin = midships on the centreline (ref nyintrepid
// (-107.2, -26.7)), +x to the bow (ESE, the bow points at the Manhattan shore), +z to starboard (SSW); rot -0.4913.
// The flight deck outline (266 m, the angled deck overhanging the pier by ~12 m), the island (x -46..-18) and the elevator
// (x -77..-59) follow the OSM footprint. The hull floats: its waterline sits at the river surface (world y ~ 0.15), found from
// the app's base height (LMCTX.u.base). No hull numbers, insignia or markings with text.
const INT = {
  deck:[[-133,-14.5],[-76,-24.2],[-18.8,-31.2],[0.5,-32.1],[25.7,-30.2],[28,-18.3],[66.4,-16.7],[128,-16.0],[133.5,-13.5],[135,-7],[135,9],[133.5,14],[128,16.6],[100,16.4],[50,16.2],[-10,15.6],[-48,16.4],[-59.2,17.5],[-77.1,17.5],[-100,15.6],[-115,15.4],[-130.7,14.5]],
  WATER:0.15, FD:17.2};
function intJet(o, oa, x, z, y, h, L, S, sw, kind){
  // generic jet / prop aircraft on its gear: fuselage loft, wings, tailplane, fin. o body array, oa accent (canopy / spinner)
  const c = Math.cos(h), s = Math.sin(h), P = (a, b, e) => [x + a*c - e*s, y + b, z + a*s + e*c];
  const R = L*(kind === 'a12' ? 0.03 : 0.045), yc = kind === 'prop' ? 1.9 : 1.7, secs = [];
  for (const [f, k] of [[-0.5, 0.55], [-0.32, 1.0], [0.12, 1.0], [0.3, 0.8], [0.42, 0.45], [0.5, 0.05]]){ const row = [];
    for (let i = 0; i < 6; i++){ const t = i/6*TAU; row.push(P(f*L, yc + Math.sin(t)*R*k*0.9, Math.cos(t)*R*k*(kind === 'a12' ? 1.8 : 1))); } secs.push(row); }
  loftP(o, secs, false);
  const wy = yc - R*0.2, rle = kind === 'a12' ? 0.32 : 0.12, rte = kind === 'a12' ? -0.5 : -0.2, tipC = kind === 'a12' ? 0.06 : 0.1, tipLe = rle - sw*0.3 - (kind === 'a12' ? 0.45 : 0);
  for (const sd of [-1, 1]){
    quadP(o, P(rle*L, wy, sd*R), P(rte*L, wy, sd*R), P((tipLe - tipC)*L, wy - 0.15, sd*S/2), P(tipLe*L, wy - 0.15, sd*S/2));
    if (kind !== 'a12') quadP(o, P(-0.36*L, yc, sd*R), P(-0.48*L, yc, sd*R), P(-0.5*L - sw*0.04*L, yc, sd*S*0.2), P(-0.42*L - sw*0.04*L, yc, sd*S*0.2));
  }
  const fins = kind === 'a12' ? [-1, 1] : [0];
  for (const fz of fins) quadP(o, P(-0.3*L, yc + R*0.5, fz*S*0.18), P(-0.5*L, yc + R*0.5, fz*S*0.18), P(-0.52*L - sw*0.03*L, yc + R + L*(kind === 'a12' ? 0.09 : 0.17), fz*S*0.2), P(-0.42*L - sw*0.03*L, yc + R + L*(kind === 'a12' ? 0.09 : 0.17), fz*S*0.2));
  segP(oa, P(0.2*L, yc + R*0.7, 0), P(0.32*L, yc + R*0.5, 0), R*0.5, 4);                                     // canopy
  if (kind === 'prop') segP(oa, P(0.5*L, yc, 0), P(0.53*L, yc, 0), L*0.15, 3);                                  // propeller disc
  for (const sd of [-1, 1]) segP(oa, P(-0.05*L, 0, sd*R*1.6), P(-0.05*L, yc - R*0.6, sd*R), 0.12, 3);               // main gear
  segP(oa, P(0.38*L, 0, 0), P(0.38*L, yc - R*0.5, 0), 0.1, 3);
}
function intHeli(o, oa, x, z, y, h, L){
  const c = Math.cos(h), s = Math.sin(h), P = (a, b, e) => [x + a*c - e*s, y + b, z + a*s + e*c];
  hexP(o, [P(-1.6, 0.6, -1.0), P(2.6, 0.6, -1.0), P(2.6, 0.6, 1.0), P(-1.6, 0.6, 1.0), P(-1.6, 2.6, -0.8), P(1.9, 2.8, -0.8), P(1.9, 2.8, 0.8), P(-1.6, 2.6, 0.8)]);
  segP(o, P(-1.6, 2.0, 0), P(-L + 3.5, 2.5, 0), 0.3, 4); quadP(o, P(-L + 3.6, 2.4, 0), P(-L + 2.6, 2.4, 0), P(-L + 2.4, 3.8, 0), P(-L + 3.2, 3.8, 0));
  segP(oa, P(0.3, 2.8, 0), P(0.3, 3.4, 0), 0.15, 4);
  for (const a of [0.4, 0.4 + HP]){ const ca = Math.cos(a)*L*0.5, sa = Math.sin(a)*L*0.5; segP(oa, P(0.3 - ca, 3.4, -sa), P(0.3 + ca, 3.4, sa), 0.12, 3); }
  for (const sd of [-1, 1]) segP(oa, P(-1.8, 0.05, sd*1.1), P(2.6, 0.05, sd*1.1), 0.07, 3);
}
LANDMARKS.nyintrepid = {zh:'无畏号海空暨太空博物馆', en:'Intrepid Museum', cat:'old', r:145, h:55,
  lt:{m:0, c:'#d8e4ff', k:0.6, e:0.5},
  build(){
    const g = new THREE.Group(), B = NBat();
    const base = (typeof LMCTX !== 'undefined' && LMCTX && LMCTX.u && LMCTX.u.base) ? LMCTX.u.base.value : 0;
    const WL = INT.WATER - base, FD = WL + INT.FD;
    const HULL = '#7b838a', HULL2 = '#6b737a', DECK = '#46494c', LINE = '#e6e6e0', DARK = '#1f2226', WIN = {c:'#2a3238', glow:'#ffd9a0', gk:0.8};
    const PAV = {c:'#eeefea', glow:'#fff2dc', gk:0.5}, PGL = {c:'#7f939e', glow:'#ffe6c0', gk:0.7}, ACG = '#9da4ab', ACN = '#2d3d57', ACO = '#c86a2c', ACV = '#5a6146', RED = {c:'#a0201a', glow:'#ff2a1a', gk:2.0}, BOOT = '#2f2a26';
    const hu = B.p(HULL), hu2 = B.p(HULL2), dk = B.p(DARK);
    // ---- hull: lofted sections from the transom to the stem (hurricane bow up to the flight deck)
    const LV = [-7.5, -4.5, -1.5, -0.6, 0.5, 4, 9, 13.5, 16.3], HBM = [10.8, 13.4, 14.1, 14.13, 14.17, 14.4, 14.8, 15.1, 15.3];
    const sternX = y => y < -2 ? -118 - (y + 7.5)*1.2 : -125.5 - Math.min(1, (y + 2)/6)*3.5, stemX = y => 123.0 + (y + 7.5)*0.48;
    const NS = 30, G = [];
    for (let k = 0; k <= NS; k++){ const u = k/NS, col = [];
      for (let j = 0; j < LV.length; j++){ const y = LV[j], xs = sternX(y), xe = stemX(y), x = lerp(xs, xe, u); let f = 1;
        if (x > 55){ const sn = cl01((x - 55)/(xe - 55)), p = lerp(1.6, 4.8, cl01((y + 7.5)/24)); f = Math.max(0, 1 - Math.pow(sn, p)); }
        if (x < -75){ const sn = cl01((-75 - x)/(-75 - xs)); f = y > 0 ? 1 - 0.42*sn*sn : 1 - (0.42 + (0 - y)/7.5*0.5)*sn*sn; }
        col.push([x, WL + y, HBM[j]*f]); }
      G.push(col); }
    const boot = B.p(BOOT), V = (p, sd) => [p[0], p[1], sd*p[2]];
    for (let j = 0; j < LV.length - 1; j++){ const o = LV[j] === -0.6 ? boot : hu;
      for (let k = 0; k < NS; k++) for (const sd of [-1, 1]) quadP(o, V(G[k][j], sd), V(G[k+1][j], sd), V(G[k+1][j+1], sd), V(G[k][j+1], sd));
      quadP(hu2, V(G[0][j], 1), V(G[0][j+1], 1), V(G[0][j+1], -1), V(G[0][j], -1)); }                   // transom
    const jt = LV.length - 1;
    for (let k = 0; k < NS; k++){ quadP(hu, V(G[k][0], 1), V(G[k+1][0], 1), V(G[k+1][0], -1), V(G[k][0], -1)); quadP(hu2, V(G[k][jt], 1), V(G[k+1][jt], 1), V(G[k+1][jt], -1), V(G[k][jt], -1)); }
    // hangar-deck openings and the gun sponsons along the parallel middle body
    for (const sd of [-1, 1]){
      for (const [x0, x1] of [[-52, -38], [-26, -14], [-2, 12], [26, 40]]) aboxM(dk, ID, x0, x1, WL + 8.5, WL + 13.2, sd > 0 ? 14.95 : -15.1, sd > 0 ? 15.1 : -14.95);
      for (let x = -70; x < 50; x += 22) aboxM(hu2, ID, x, x + 7, WL + 12.8, FD - 0.9, sd > 0 ? 14.8 : -17.8, sd > 0 ? 17.8 : -14.8);
    }
    // ---- flight deck: deck slab, the dark gallery band under it, sponsons under the angled deck
    const dkr = INT.deck;
    prismM(B.p(DECK), ID, dkr, FD - 0.9, FD, true, false);
    wallsM(B.p(HULL2), ID, dkr, FD - 1.7, FD - 0.9);
    capM(B.p(HULL2), ID, dkr, FD - 1.7);
    { const sp = [[-76,-24.2],[-18.8,-31.2],[0.5,-32.1],[25.7,-30.2],[28,-18.3]], hs = [[-82, -15.2], [28.5, -15.2]];
      const pts = [[-90, -15.3]].concat(sp).concat([[32, -15.3]]);
      for (let i = 0; i < pts.length - 1; i++){ const a = pts[i], b = pts[i+1]; quadP(hu2, [a[0], FD - 1.7, a[1]], [b[0], FD - 1.7, b[1]], [b[0], WL + 10, -15.2], [a[0], WL + 10, -15.2]); }
      triP(hu2, [-90, FD - 1.7, -15.3], [-76, FD - 1.7, -24.2], [-90, WL + 10, -15.2]); }
    // deck markings: axial centreline, the angled-deck centreline and edges (dashed), elevator outlines
    const ln = B.p(LINE), dash = (a, b, w, on, off) => { const L = Math.hypot(b[0]-a[0], b[1]-a[1]), ux = (b[0]-a[0])/L, uz = (b[1]-a[1])/L; for (let t = 0; t < L; t += on + off){ const t1 = Math.min(L, t + on); quadP(ln, [a[0] + ux*t - uz*w, FD + 0.03, a[1] + uz*t + ux*w], [a[0] + ux*t1 - uz*w, FD + 0.03, a[1] + uz*t1 + ux*w], [a[0] + ux*t1 + uz*w, FD + 0.03, a[1] + uz*t1 - ux*w], [a[0] + ux*t + uz*w, FD + 0.03, a[1] + uz*t - ux*w]); } };
    dash([30, 0], [130, 0], 0.25, 4, 3);
    const ang = -0.19, ax = Math.cos(ang), az = Math.sin(ang);
    dash([-125, 2], [-125 + ax*150, 2 + az*150], 0.3, 6, 4);
    for (const off of [-11, 11]) dash([-128, 2 + off], [-128 + ax*155, 2 + off + az*155], 0.15, 3, 3);
    for (const [x0, x1, z0, z1] of [[96, 113, -8.5, 8.5], [-77, -59.4, 17.5, 27.3]]){ dash([x0, z0], [x1, z0], 0.12, 1.5, 1); dash([x0, z1], [x1, z1], 0.12, 1.5, 1); dash([x0, z0], [x0, z1], 0.12, 1.5, 1); dash([x1, z0], [x1, z1], 0.12, 1.5, 1); }
    // the starboard deck-edge elevator (raised), the bridle-catcher horns at the bow
    aboxM(B.p(DECK), ID, -77.1, -59.4, FD - 0.9, FD - 0.02, 17.5, 27.3);
    aboxM(hu2, ID, -76, -60.5, WL + 4, FD - 0.9, 16, 18.5);
    for (const zc of [-6.2, 11.2]){ segP(hu2, [133, FD - 0.5, zc], [142, FD - 3.5, zc], 0.5, 4); segP(hu2, [133, FD - 3.0, zc], [141.5, FD - 3.8, zc], 0.35, 4); }
    // ---- island: four stepped levels, the bridge glazing, the raked funnel, the mast and radars
    const iy = FD;
    aboxM(hu, ID, -46, -18, iy, iy + 4.2, 6.0, 15.5);
    aboxM(hu, ID, -44, -20, iy + 4.2, iy + 7.4, 6.6, 15.3);
    aboxM(hu, ID, -40, -21.5, iy + 7.4, iy + 10.6, 7.4, 15.0);
    aboxM(hu, ID, -37, -25, iy + 10.6, iy + 13.2, 8.2, 14.4);
    aboxM(B.p(WIN), ID, -40.2, -21.3, iy + 8.6, iy + 9.9, 7.2, 15.2);
    aboxM(B.p(WIN), ID, -37.2, -24.8, iy + 11.6, iy + 12.6, 8.0, 14.6);
    aboxM(B.p(WIN), ID, -44.1, -19.9, iy + 5.4, iy + 6.2, 6.5, 15.4);
    hexP(hu, [[-45, iy + 7.4, 8.6], [-33, iy + 7.4, 8.6], [-33, iy + 7.4, 14.6], [-45, iy + 7.4, 14.6], [-44, iy + 17.5, 9.4], [-35, iy + 17.5, 9.4], [-35, iy + 17.5, 14.2], [-44, iy + 17.5, 14.2]]);   // funnel
    aboxM(dk, ID, -43.5, -35.5, iy + 17.5, iy + 17.9, 9.8, 13.8);
    const mx = -28, mz = 11.2, mt = iy + 35;
    segP(hu, [mx, iy + 13.2, mz], [mx, mt, mz], 0.55, 6);
    for (const [dx, dz] of [[-6, -2.6], [-6, 2.6]]) segP(hu, [mx + dx, iy + 13.2, mz + dz], [mx, iy + 26, mz], 0.35, 5);
    aboxM(hu2, ID, mx - 2.2, mx + 2.2, iy + 21.5, iy + 22.0, mz - 2.2, mz + 2.2);
    aboxM(hu2, ID, mx - 0.4, mx + 0.4, iy + 27.0, iy + 27.4, mz - 5.5, mz + 5.5);                    // yardarm
    { const y0 = iy + 23.5, x0 = mx + 1.5;                                                          // big rectangular air-search radar (lattice)
      for (let k = 0; k <= 6; k++) segP(hu2, [x0, y0 + k*0.75, mz - 6], [x0, y0 + k*0.75, mz + 6], 0.07, 3);
      for (let k = 0; k <= 12; k++) segP(hu2, [x0, y0, mz - 6 + k], [x0, y0 + 4.5, mz - 6 + k], 0.07, 3); }
    latheM(hu2, ID, [[0, iy + 30.5], [2.2, iy + 31.2], [2.6, iy + 32.0], [0, iy + 31.6]], mx, mz, 10);   // height-finder dish
    segP(hu2, [mx, mt, mz], [mx, mt + 2, mz], 0.12, 4);
    boxM(B.p(RED), ID, 0.5, 0.5, 0.5, mx, mt + 2, mz);
    // ---- Space Shuttle Pavilion: a white membrane hall on arched ribs over the aft flight deck (x -127..-58, z -19..10)
    const px0 = -127, px1 = -58, pzc = -4.8, pw = 14.6, ph = 15.5, pv = B.p(PAV), NAc = 12;
    const arc = (x, k) => { const t = k/NAc*PI; return [x, FD + Math.sin(t)*ph, pzc + Math.cos(t)*pw]; };
    for (let i = 0; i < 10; i++){ const xa = lerp(px0, px1, i/10), xb = lerp(px0, px1, (i + 1)/10), xm = (xa + xb)/2;
      for (let k = 0; k < NAc; k++){ const a0 = arc(xa, k), a1 = arc(xa, k + 1), b0 = arc(xb, k), b1 = arc(xb, k + 1), m0 = arc(xm, k), m1 = arc(xm, k + 1);
        const sag = (p, f) => [p[0], FD + (p[1] - FD)*f, pzc + (p[2] - pzc)*f];
        quadP(pv, a0, a1, sag(m1, 0.95), sag(m0, 0.95)); quadP(pv, sag(m0, 0.95), sag(m1, 0.95), b1, b0); }
      for (let k = 0; k < NAc; k++) segP(hu, arc(xa, k), arc(xa, k + 1), 0.35, 4); }
    for (let k = 0; k < NAc; k++) segP(hu, arc(px1, k), arc(px1, k + 1), 0.35, 4);
    for (const x of [px0, px1]) for (let k = 0; k < NAc; k++){ const a = arc(x, k), b = arc(x, k + 1); triP(pv, [x, FD, pzc], a, b);
      const sh = (p, f) => [x + (x > -90 ? 0.15 : -0.15), FD + (p[1] - FD)*f, pzc + (p[2] - pzc)*f]; if (k >= 3 && k < NAc - 3) quadP(B.p(PGL), sh(a, 0.35), sh(b, 0.35), sh(b, 0.75), sh(a, 0.75)); }
    // ---- aircraft on the flight deck (generic shapes and neutral colours, no markings)
    const ac = B.p(ACG), an = B.p(ACN), ao = B.p(ACO), av = B.p(ACV), ad = B.p(DARK);
    intJet(ad, ad, 114, 3.0, FD, 0, 31, 16.9, 0, 'a12');
    intJet(ac, ad, 84, -9.5, FD, 0.5, 19, 15, 0.7, 'jet');
    intJet(ac, ad, 68, 8.5, FD, -0.45, 19, 11.7, 0.5, 'jet');
    intJet(ac, ad, 52, -10.5, FD, 0.55, 16.6, 16.2, 0.25, 'jet');
    intJet(ac, ad, 40, 9.5, FD, -0.5, 16.6, 10.9, 0.6, 'jet');
    intJet(ac, ad, 24, -21, FD, 0.25, 15, 9.5, 0.4, 'jet');
    intJet(ac, ad, 9, -23, FD, 0.25, 14, 7.7, 0.55, 'jet');
    intJet(ac, ad, 96, 9.5, FD, -0.6, 14.7, 7.2, 0.7, 'jet');
    intJet(ac, ad, -4, -12, FD, 0.45, 12.2, 8.4, 0.5, 'jet');
    intJet(ac, ad, 24, 8.0, FD, -0.4, 15.6, 8.2, 0.75, 'jet');
    intJet(ac, ad, 8, 8.0, FD, -0.4, 13.5, 10.5, 0.6, 'jet');
    intJet(ac, ad, -10, -25, FD, 0.2, 14, 22, 0.0, 'prop');
    intJet(ao, ad, 100, -10, FD, 0.6, 8.8, 10, 0.0, 'prop');
    intJet(an, ad, -14, 4.0, FD, 0.1, 11.8, 15.3, 0.0, 'prop');
    intJet(an, ad, -55, -14, FD, 0.35, 10.2, 12.5, 0.0, 'prop');
    intJet(an, ad, -54, 4.5, FD, -0.3, 12.5, 16.5, 0.0, 'prop');
    intHeli(av, ad, -38, -6, FD, 0.6, 17.4);
    intHeli(av, ad, 58, -2.5, FD, 0.3, 16);
    intHeli(B.p(LINE), ad, -24, -20, FD, 0.2, 14);
    // ---- USS Growler (Regulus missile submarine) on the north side of Pier 86, and the two museum structures on the pier
    //      (both fall under the ship's ground plan once the submarine is in it): the access tower and the pier pavilion
    { const PIER = 1.7 - base, gz = -71.4, gc = (x, y, z) => [x, y, z], sub = B.p(DARK);
      const R0 = 4.1, cy = WL - 1.6, secs = [];
      for (const [x, k] of [[12.5, 0.15], [16, 0.6], [24, 0.95], [40, 1], [90, 1], [100, 0.8], [105.5, 0.45], [107.8, 0.05]]){ const row = []; for (let i = 0; i < 10; i++){ const t = i/10*TAU; row.push([x, cy + Math.sin(t)*R0*k, gz + Math.cos(t)*R0*k]); } secs.push(row); }
      loftP(sub, secs, false);
      aboxM(sub, ID, 18, 104, cy + R0 - 0.6, cy + R0 + 0.5, gz - 1.6, gz + 1.6);                                   // deck casing
      for (const [x0, x1] of [[78, 98]]){ latheM(sub, (x, y, z) => [x1 - (y - cy - R0 - 1.0), cy + R0 + 1.0 + (x - 0), z + gz], [[0, 0], [2.6, 0.3], [2.6, x1 - x0 - 1], [0, x1 - x0]], 0, 0, 12); }   // missile hangar
      aboxM(sub, ID, 52, 64, cy + R0 + 0.4, cy + R0 + 7.5, gz - 1.5, gz + 1.5);                                    // sail
      for (const x of [55, 58, 61]) cylM(sub, ID, 0.25, 0.2, cy + R0 + 7.5, cy + R0 + 10.5, x, gz, 6);
      aboxM(sub, ID, 30, 44, cy + R0 + 0.4, cy + R0 + 2.4, gz - 1.4, gz + 1.4);
      const pg = B.p({c:'#9aa6ad', glow:'#ffe2b0', gk:0.25});
      aboxM(pg, ID, 76.8, 101.6, PIER - 2, PIER + 11.8, -60.9, -53.0); aboxM(hu2, ID, 76.5, 101.9, PIER + 11.8, PIER + 12.4, -61.2, -52.7);
      aboxM(pg, ID, -39.1, -27.8, PIER - 2, PIER + 9.0, -42.8, -32.3); aboxM(hu2, ID, -39.4, -27.5, PIER + 9.0, PIER + 9.6, -43.1, -32.0);
      for (const x of [-36, -31]) aboxM(hu2, ID, x - 0.6, x + 0.6, PIER + 9.0, FD - 6.5, -32.3, -29.5);
      const WC = [[89.8,-18.4],[90.1,-43.5],[134.7,-43.0],[134.5,-28.3],[128.8,-28.4],[128.7,-18.0]];                // the welcome centre at the pier head
      prismM(pg, ID, WC, PIER - 2, PIER + 11.0, false); prismM(B.p(HULL2), ID, offP(WC, -0.4), PIER + 11.0, PIER + 11.5, true);
      for (let i = 0; i < WC.length; i++){ const E = edgeFrame(WC, i), n = Math.round(E.L/3.2); for (let k = 0; k <= n; k++) aboxM(hu2, E.M, k*E.L/n - 0.2, k*E.L/n + 0.2, PIER, PIER + 11.0, -0.1, 0.25); aboxM(hu2, E.M, 0, E.L, PIER + 5.2, PIER + 5.8, -0.1, 0.3); } }
    // ---- deck-edge lights and a few hull lights
    for (let i = 0; i < dkr.length; i++){ const a = dkr[i]; boxM(B.p({c:'#f2e6c8', glow:'#ffe2a0', gk:1.0}), ID, 0.35, 0.35, 0.35, a[0], FD, a[1]); }
    B.flush(g); return g; }};
SG_PLACES.push({type:'nyintrepid', lat:40.7647404, lon:-74.0008681, rot:-0.4913});

}
