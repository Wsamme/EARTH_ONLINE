// ===== nyc/nyouter2: New York outer boroughs and New Jersey landmarks (City Brush v32, New York 1:1)
// nyqueensmus     Queens Museum (1939 New York City Building, Flushing Meadows)
// nyhallsci       New York Hall of Science (1964 Great Hall, the blue dalle-de-verre wall, Rocket Park)
// nynybg          Enid A. Haupt Conservatory (1902, New York Botanical Garden)
// nybxcourthouse  Bronx County Building / Courthouse (1934, 851 Grand Concourse)
// nyfordham       Keating Hall, Fordham University Rose Hill (1936, Collegiate Gothic, central tower)
// nygould         Gould Memorial Library + Hall of Fame for Great Americans + Philosophy / Language halls (Stanford White)
// nysnugharbor    Sailors' Snug Harbor, Temple Row (buildings A-E, 1833-1880)
// nycrrnj         Central Railroad of New Jersey Terminal (1889 head house, clock tower, 1914 Bush train shed)
// nynewarkcath    Cathedral Basilica of the Sacred Heart, Newark (French Gothic Revival, twin towers)
// nylsc           Liberty Science Center (observation tower, planetarium dome), Jersey City
// Every model is built in its ref frame (local metres round the ref anchor, +x east, +z south) on the real OSM footprint,
// placed with rot 0. No text, logos or insignia anywhere. Block-scoped: only LANDMARKS and SG_PLACES are touched.
{
const PI = Math.PI, HP = PI/2, TAU = PI*2;
const lerp = (a, b, t) => a + (b - a)*t, cl01 = t => t < 0 ? 0 : t > 1 ? 1 : t;
// ---- triangle batches: many parts of one colour spec become one LTris call (one material)
const NBat = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const quadP = (o, a, b, c, d) => o.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2]);
const triP = (o, a, b, c) => o.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
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


// ---- nyouter2 extras
const shR = (ring, O) => ring.map(p => [p[0] - O[0], p[1] - O[1]]);
// place a model whose origin is ref point O (ref local metres round the anchor A: +x east, +z south), rot 0
const placeAt = (key, A, O, rot) => SG_PLACES.push({type:key, lat:+(A[0] - O[1]/111048).toFixed(6), lon:+(A[1] + O[0]/84516).toFixed(6), rot:rot || 0});
// compose an edge frame of a ring given in frame M
function edgeFM(ring, i, M){ const E = edgeFrame(ring, i); return {L:E.L, M:(u, v, w) => { const p = E.M(u, v, w); return M(p[0], p[1], p[2]); }}; }
// classical column (round shaft, base, capital) at (x, z) of frame M from y0, height h, radius r
function colP(o, M, x, z, y0, h, r, n, cap){
  const c = cap === undefined ? 1.3 : cap;
  latheM(o, M, [[0, y0], [r*1.3, y0], [r*1.3, y0 + 0.3*r], [r*1.05, y0 + 0.5*r], [r, y0 + 0.9*r], [r*0.86, y0 + h - 0.9*r], [r*c, y0 + h - 0.35*r], [r*c, y0 + h], [0, y0 + h]], x, z, n || 8);
}
// gable roof in frame M: ridge along z (z0..z1) over x0..x1, eaves y0, rise h, overhang ov
function gableM(o, M, x0, x1, z0, z1, y0, h, ov){ ov = ov || 0; const xm = (x0 + x1)/2;
  quadP(o, M(x0 - ov, y0, z0 - ov), M(xm, y0 + h, z0 - ov), M(xm, y0 + h, z1 + ov), M(x0 - ov, y0, z1 + ov));
  quadP(o, M(x1 + ov, y0, z1 + ov), M(xm, y0 + h, z1 + ov), M(xm, y0 + h, z0 - ov), M(x1 + ov, y0, z0 - ov));
  triP(o, M(x0, y0, z0), M(x1, y0, z0), M(xm, y0 + h, z0)); triP(o, M(x1, y0, z1), M(x0, y0, z1), M(xm, y0 + h, z1)); }
// the same with the ridge along x
function gableXM(o, M, x0, x1, z0, z1, y0, h, ov){ gableM(o, (a, b, c) => M(c, b, a), z0, z1, x0, x1, y0, h, ov); }
// hipped roof over a rectangle (ridge along the longer side), frame M
function hipM(o, M, x0, x1, z0, z1, y0, h){
  const L = x1 - x0, W = z1 - z0;
  if (L >= W){ const zm = (z0 + z1)/2, d = W/2; hexP(o, [M(x0, y0, z0), M(x1, y0, z0), M(x1, y0, z1), M(x0, y0, z1), M(x0 + d, y0 + h, zm), M(x1 - d, y0 + h, zm), M(x1 - d, y0 + h, zm), M(x0 + d, y0 + h, zm)]); }
  else { const xm = (x0 + x1)/2, d = L/2; hexP(o, [M(x0, y0, z0), M(x1, y0, z0), M(x1, y0, z1), M(x0, y0, z1), M(xm, y0 + h, z0 + d), M(xm, y0 + h, z0 + d), M(xm, y0 + h, z1 - d), M(xm, y0 + h, z1 - d)]); }
}
// pyramid / frustum roof over a rectangle: top rectangle inset by t (t >= half side -> point)
function pyrM(o, M, x0, x1, z0, z1, y0, h, tx, tz){ const xm = (x0 + x1)/2, zm = (z0 + z1)/2, ax = Math.min(tx, (x1 - x0)/2), az = Math.min(tz === undefined ? tx : tz, (z1 - z0)/2);
  hexP(o, [M(x0, y0, z0), M(x1, y0, z0), M(x1, y0, z1), M(x0, y0, z1), M(x0 + ax, y0 + h, z0 + az), M(x1 - ax, y0 + h, z0 + az), M(x1 - ax, y0 + h, z1 - az), M(x0 + ax, y0 + h, z1 - az)]); }
// rows of flat windows on the faces of an axis-aligned box in frame M (n per face along the long side)
//   faces: 'n' z = z0 (outward -z), 's' z = z1, 'w' x = x0, 'e' x = x1
function winBox(o, M, x0, x1, z0, z1, faces, levels, hw, hh, bay, arch){
  for (const f of faces){
    const alongX = f === 'n' || f === 's', a0 = alongX ? x0 : z0, a1 = alongX ? x1 : z1, L = a1 - a0, n = Math.max(1, Math.floor(L/bay)), off = 0.06;
    for (let k = 0; k < n; k++){ const a = a0 + (k + 0.5)*L/n;
      for (const v0 of levels){
        const F = f === 'n' ? (u, v) => M(u, v, z0 - off) : f === 's' ? (u, v) => M(u, v, z1 + off) : f === 'w' ? (u, v) => M(x0 - off, v, u) : (u, v) => M(x1 + off, v, u);
        if (arch){ const ys = v0 + hh - hw; quadP(o, F(a - hw, v0), F(a + hw, v0), F(a + hw, ys), F(a - hw, ys));
          for (let i = 0; i < 6; i++){ const t0 = PI*i/6, t1 = PI*(i + 1)/6; triP(o, F(a, ys), F(a + Math.cos(t0)*hw, ys + Math.sin(t0)*hw), F(a + Math.cos(t1)*hw, ys + Math.sin(t1)*hw)); } }
        else quadP(o, F(a - hw, v0), F(a + hw, v0), F(a + hw, v0 + hh), F(a - hw, v0 + hh));
      } } }
}
// pointed (Gothic) window plate in an edge-like frame F(u, v) at u = a
function gothWin(o, F, a, v0, hw, hh, n){ n = n || 4; const ys = v0 + hh - 1.73*hw;
  quadP(o, F(a - hw, v0), F(a + hw, v0), F(a + hw, ys), F(a - hw, ys));
  const L = [], R = []; for (let i = 0; i <= n; i++){ const t = PI/3*i/n; L.push(F(a - hw + 2*hw*Math.cos(t) - 0*hw, ys + 2*hw*Math.sin(t))); R.push(F(a + hw - 2*hw*Math.cos(t), ys + 2*hw*Math.sin(t))); }
  for (let i = 0; i < n; i++){ triP(o, F(a, ys), R[i], R[i + 1]); triP(o, F(a, ys), L[i + 1], L[i]); }
  triP(o, F(a, ys), F(a + hw, ys), R[0]); triP(o, F(a, ys), L[0], F(a - hw, ys)); }
// crenellated parapet along a straight run in frame F(u, v, w): merlons of width mw every 2*mw
function crenel(o, F, u0, u1, y0, h, d, mw){ const n = Math.max(1, Math.round((u1 - u0)/(2*mw)));
  aboxM(o, F, u0, u1, y0, y0 + h*0.45, -d, 0.15); for (let k = 0; k < n; k++){ const a = u0 + (k + 0.25)*(u1 - u0)/n; aboxM(o, F, a, a + (u1 - u0)/n*0.5, y0 + h*0.45, y0 + h, -d, 0.15); } }
// generic rocket (no markings): body radius r from y0; stages = [[h, r]...] stacked; nose cone; optional fins
function rocketP(o, oDark, M, x, z, y0, stages, nose, fins){
  let y = y0;
  for (const [h, r, dark] of stages){ cylM(dark ? oDark : o, M, r, r, y, y + h, x, z, 14); cylM(oDark, M, r*1.03, r*1.03, y + h - 0.25, y + h, x, z, 14); y += h; }
  latheM(o, M, nose.map(p => [p[0], y + p[1]]), x, z, 14);
  if (fins) for (let k = 0; k < 4; k++){ const a = k*HP + PI/4, c = Math.cos(a), s = Math.sin(a), r = stages[0][1];
    hexP(oDark, [M(x + c*r, y0, z + s*r), M(x + c*(r + fins), y0, z + s*(r + fins)), M(x + c*(r + fins) - s*0.08, y0, z + s*(r + fins) + c*0.08), M(x + c*r - s*0.08, y0, z + s*r + c*0.08),
      M(x + c*r, y0 + 5, z + s*r), M(x + c*(r + 0.2), y0 + 4.2, z + s*(r + 0.2)), M(x + c*(r + 0.2) - s*0.08, y0 + 4.2, z + s*(r + 0.2) + c*0.08), M(x + c*r - s*0.08, y0 + 5, z + s*r + c*0.08)]); }
  return y;
}
// low-poly deciduous tree into batches (trunk + crown), s = scale (~1 = 9 m tall)
function treeP(B, x, y, z, s, crown){ cylM(B.p('#5b4a3a'), ID, 0.25*s, 0.32*s, y, y + 3.2*s, x, z, 5);
  latheM(B.p(crown || '#5f7f4a'), ID, [[0, y + 2.6*s], [2.4*s, y + 3.4*s], [3.0*s, y + 5.2*s], [2.5*s, y + 7.2*s], [1.2*s, y + 8.6*s], [0, y + 9.0*s]], x, z, 7); }

// ============================================================================================================================
// nyqueensmus  Queens Museum — the 1939 New York City Building (Aymar Embury II), Flushing Meadows. Long limestone box
//   (128 x 54 m, 13 m, corner pavilions), raised central roof with the 2013 Grimshaw skylight, the east colonnade of square
//   piers in front of the 1994 glass wall (facing the Unisphere), the 2013 fritted-glass screen wall on the west front (LED-lit
//   at night). Frame: ref nyouter2 / nyqueensmus, origin = footprint centroid, rot 0; QF(u, y, w): u along the long axis
//   (to the SSE), w across (+w = east front).
const QMD = {A:[40.7458, -73.8467], O:[-3.8, -8.2],
  ring:[[-56.1,-49.4],[-50.0,-52.0],[-52.3,-57.6],[-6.3,-76.6],[-3.9,-70.8],[4.7,-74.4],[6.9,-69.2],[5.0,-66.3],[5.3,-62.9],[7.1,-60.7],[10.4,-59.8],[12.8,-54.0],[7.4,-51.8],[35.2,14.7],[40.4,12.5],[42.6,17.9],[41.0,21.0],[41.4,23.8],[43.1,26.1],[46.4,27.2],[48.7,32.7],[40.3,36.2],[42.7,41.9],[-3.2,61.1],[-5.7,55.1],[-12.0,57.7],[-14.2,52.5],[-12.8,49.8],[-13.3,46.3],[-15.2,44.1],[-18.0,43.2],[-20.4,37.6],[-15.0,35.3],[-42.7,-31.2],[-47.7,-29.2],[-49.9,-34.6],[-48.6,-37.2],[-48.8,-40.2],[-51.0,-42.9],[-53.8,-43.8]]};
LANDMARKS.nyqueensmus = {zh:'皇后区博物馆', en:'Queens Museum (New York City Building)', cat:'old', r:72, h:16,
  lt:{m:0, c:'#ffe4bf', k:0.5, e:0.6},
  build(){
    const g = new THREE.Group(), B = NBat();
    const ST = '#dcd9d0', ST2 = '#cbc8be', RF = '#8d8a83', DK = '#30363c';
    const GLW = {c:'#c9d3d6', glow:'#e4f0ff', gk:1.1}, GLE = {c:'#6c8590', glow:'#ffe0b0', gk:0.7}, SKY = {c:'#a9bec6', glow:'#fff0cc', gk:0.6}, WIN = {c:'#2f3840', glow:'#ffd8a0', gk:0.45};
    const st = B.p(ST), st2 = B.p(ST2);
    const R = shR(QMD.ring, QMD.O), ax = [0.386, 0.922], nx = [0.922, -0.386];
    const QF = (u, y, w) => [u*ax[0] + w*nx[0], y, u*ax[1] + w*nx[1]];
    // body, cornice, roof
    prismM(st, ID, R, -4, 12.6, false);
    prismM(st2, ID, offP(R, -0.45), 12.6, 13.5, false);
    capM(B.p(RF), ID, offP(R, -0.45), 13.45);
    // stone base course
    prismM(st2, ID, offP(R, -0.25), -1, 0.9, false);
    // raised central roof (the old exhibition hall / rink volume) with clerestory slot and skylights
    aboxM(st, QF, -57, 57, 13.4, 15.3, -15.5, 15.5);
    aboxM(st2, QF, -57.4, 57.4, 15.3, 15.7, -15.9, 15.9);
    aboxM(B.p(SKY), QF, -45, -28, 15.7, 16.3, -6.1, 6.1);                     // Grimshaw skylight over the atrium
    for (let u = -20; u <= 44; u += 16) aboxM(B.p(SKY), QF, u - 5, u + 5, 15.7, 16.1, -4, 4);
    quadP(B.p(WIN), QF(-56, 13.9, 15.56), QF(56, 13.9, 15.56), QF(56, 14.9, 15.56), QF(-56, 14.9, 15.56));
    quadP(B.p(WIN), QF(-56, 13.9, -15.56), QF(56, 13.9, -15.56), QF(56, 14.9, -15.56), QF(-56, 14.9, -15.56));
    // east front (to the Unisphere): colonnade of 16 square piers before the glass wall, entablature, steps
    const wE = 27.15;
    quadP(B.p(GLE), QF(-30.5, 0.4, wE + 0.05), QF(30.5, 0.4, wE + 0.05), QF(30.5, 11.2, wE + 0.05), QF(-30.5, 11.2, wE + 0.05));
    for (let u = -30; u <= 30.01; u += 4) aboxM(st, QF, u - 0.6, u + 0.6, 0.4, 11.4, wE, wE + 1.5);
    for (let u = -28; u <= 28.01; u += 4) aboxM(B.p(DK), QF, u - 0.05, u + 0.05, 0.4, 11.2, wE + 0.08, wE + 0.16);   // glass mullions
    aboxM(st2, QF, -31, 31, 11.4, 12.9, wE - 0.1, wE + 1.8);
    aboxM(st2, QF, -24, 24, -1.5, 0.45, wE + 1.5, wE + 6.5);
    aboxM(st2, QF, -22, 22, -1.5, 0.2, wE + 6.5, wE + 8);
    // west front (Grand Central Parkway): the fritted-glass screen wall in a stone frame, fins
    const wW = -27.1;
    aboxM(st2, QF, -31.5, 31.5, 0, 12.6, wW - 0.9, wW + 0.2);
    aboxM(B.p(GLW), QF, -30.5, 30.5, 0.6, 8.8, wW - 1.1, wW - 0.95);
    for (let k = 0; k < 40; k += 2){ const u = -30.5 + k*1.525; quadP(B.p('#b8bcbf'), QF(u, 0.6, wW - 1.12), QF(u + 1.525, 0.6, wW - 1.12), QF(u + 1.525, 8.8, wW - 1.12), QF(u, 8.8, wW - 1.12)); }   // aluminium panels alternate with the fritted glass
    for (let u = -30.5; u <= 30.51; u += 1.525) aboxM(B.p('#e7e9ea'), QF, u - 0.04, u + 0.04, 0.6, 8.8, wW - 1.35, wW - 1.1);
    aboxM(st2, QF, -10, 10, -1.5, 0.5, wW - 6, wW - 0.9);
    // pilasters and tall slot windows on the long walls outside the porticoes, and on the end pavilions
    for (const s of [-1, 1]) for (let u = -46; u <= 46.01; u += 5.75){ if (Math.abs(u) < 33) continue;
      aboxM(st2, QF, u - 0.55, u + 0.55, 0.9, 12.6, s > 0 ? 27.0 : -27.6, s > 0 ? 27.6 : -27.0);
      if (Math.abs(u) < 45) quadP(B.p(WIN), QF(u + 1.4, 3.0, s*27.12), QF(u + 4.3, 3.0, s*27.12), QF(u + 4.3, 10.4, s*27.12), QF(u + 1.4, 10.4, s*27.12)); }
    for (const s of [-1, 1]){ const u = s*64.1;      // the end fronts
      for (let w = -21; w <= 21.01; w += 6){ aboxM(st2, QF, s > 0 ? u - 0.1 : u - 0.5, s > 0 ? u + 0.5 : u + 0.1, 0.9, 12.6, w - 0.55, w + 0.55);
        if (w < 20) quadP(B.p(WIN), QF(u + s*0.06, 5.0, w + 1.3), QF(u + s*0.06, 5.0, w + 4.7), QF(u + s*0.06, 10.6, w + 4.7), QF(u + s*0.06, 10.6, w + 1.3)); } }
    // plaza flagpoles (plain) and planters on the east forecourt
    for (const u of [-34, 34]){ cylM(B.p('#d8d8d4'), QF, 0.12, 0.08, 0, 18, u, 40, 6); }
    B.flush(g); return g; }};
placeAt('nyqueensmus', QMD.A, QMD.O, 0);

// ============================================================================================================================
// nyhallsci  New York Hall of Science — the 1964 Great Hall (Wallace K. Harrison): an amoeba-shaped hall 24 m high whose
//   wall is 22 undulating concrete panels, each a 9 x 28 grid of cobalt-blue dalle-de-verre glass (blue glow at night); the
//   low base round it, the 1996 entrance rotunda, the 2004 glass north wing; Rocket Park with two generic rockets (plain, no
//   markings). Frame: ref nyouter2 / nyhallsci, origin = ref (0, -20), rot 0.
const HSD = {A:[40.7471, -73.8517], O:[0, -20],
  ring:[[-50.0,6.8],[-45.0,0.9],[-48.0,-2.4],[-48.9,-6.7],[-48.6,-8.9],[-47.2,-11.5],[-45.0,-13.5],[-43.0,-14.5],[-44.6,-17.4],[-41.5,-18.4],[-39.1,-18.3],[-38.4,-21.9],[-34.0,-20.7],[-29.1,-17.8],[-25.9,-21.8],[-27.3,-22.9],[-13.9,-39.8],[-12.5,-38.6],[-8.0,-44.3],[-32.3,-101.9],[-15.8,-108.1],[-8.2,-89.7],[-0.6,-91.5],[5.5,-74.4],[6.4,-74.3],[7.9,-79.0],[10.0,-81.6],[13.6,-83.8],[16.8,-84.6],[21.0,-84.2],[24.3,-82.7],[27.5,-80.3],[29.9,-77.2],[31.7,-72.6],[32.3,-69.6],[31.7,-63.7],[30.7,-60.9],[29.0,-58.6],[25.2,-55.9],[50.9,5.7],[31.6,30.4],[30.7,36.3],[-19.9,29.3],[-22.0,31.7],[-24.7,33.1],[-27.2,33.4],[-30.7,32.7],[-34.4,30.4],[-36.9,27.0],[-41.8,26.3]],
  north:[[-8.0,-44.3],[-32.3,-101.9],[-15.8,-108.1],[-8.2,-89.7],[-0.6,-91.5],[5.5,-74.4],[6.4,-74.3],[9.5,-62.0],[1.5,-48.5]],
  rot:[18.3, -69.8, 14.2], gh:[-23.5, 5.5, 23.5, 25.5], rockets:[[44, 48], [55, 42]]};
LANDMARKS.nyhallsci = {zh:'纽约科学馆', en:'New York Hall of Science', cat:'old', r:110, h:36,
  lt:{m:0, c:'#e8f0ff', k:0.45, e:0.6},
  build(){
    const g = new THREE.Group(), B = NBat(), O = HSD.O;
    const CON = '#c3beb3', CON2 = '#d3cfc6', RF = '#8e8c87', DK = '#2c3238', WHT = '#e9e9e5', MET = '#9aa0a5';
    const BLUE = {c:'#1d3f9a', glow:'#2e5cff', gk:0.95}, GLA = {c:'#7d939c', glow:'#ffe2b8', gk:0.55}, CHN = {c:'#c4d0d1', glow:'#dfeaff', gk:0.6};
    const con = B.p(CON), con2 = B.p(CON2);
    const R = shR(HSD.ring, O);
    // ---- the low base (1964 hexagonal base and the later wings at ground level)
    prismM(con, ID, R, -4.5, 6.2, false); capM(B.p(RF), ID, R, 6.15);
    prismM(con2, ID, offP(R, -0.3), 6.2, 7.0, false);
    for (let i = 0; i < R.length; i++){ const E = edgeFrame(R, i); if (E.L < 5) continue; quadP(B.p(GLA), E.M(0.6, 1.2, 0.05), E.M(E.L - 0.6, 1.2, 0.05), E.M(E.L - 0.6, 4.6, 0.05), E.M(0.6, 4.6, 0.05)); }
    // ---- 2004 north wing: translucent channel-glass box with a metal roof edge
    const NW = shR(HSD.north, O);
    prismM(B.p(CHN), ID, NW, -4.5, 12.5, false); capM(B.p(RF), ID, NW, 12.45); prismM(B.p(MET), ID, offP(NW, -0.3), 12.5, 13.3, false);
    for (let i = 0; i < NW.length; i++){ const E = edgeFrame(NW, i), n = Math.floor(E.L/3); for (let k = 1; k < n; k++) aboxM(B.p(MET), E.M, k*E.L/n - 0.1, k*E.L/n + 0.1, 0, 12.5, 0, 0.25); }
    // ---- 1996 entrance rotunda: glass drum with concrete bands and a flat dome
    { const [rx, rz, rr] = HSD.rot, cx = rx - O[0], cz = rz - O[1];
      cylM(B.p(GLA), ID, rr - 0.2, rr - 0.2, -4.5, 11.5, cx, cz, 28); cylM(con2, ID, rr, rr, 11.5, 13.0, cx, cz, 28); cylM(con2, ID, rr, rr, 5.6, 6.4, cx, cz, 28);
      latheM(B.p(RF), ID, [[rr - 0.3, 13.0], [rr*0.7, 14.6], [rr*0.35, 15.4], [0, 15.6]], cx, cz, 28);
      for (let k = 0; k < 28; k++){ const a = k/28*TAU; aboxM(B.p(MET), FR(cx + Math.cos(a)*(rr - 0.1), 0, cz + Math.sin(a)*(rr - 0.1), -a), -0.1, 0.1, 0, 11.5, -0.12, 0.12); } }
    // ---- the Great Hall: amoeba plan, 22 undulating panels, each a 9 x 28 grid of blue glass in concrete
    const gx = HSD.gh[0] - O[0], gz = HSD.gh[1] - O[1], grx = HSD.gh[2], grz = HSD.gh[3], NP = 22, NC = 9, NS = NP*NC, P = [];
    for (let i = 0; i < NS; i++){ const t = i/NS*TAU, k = 1 + 0.06*Math.sin(2*t + 0.8) + 0.035*Math.sin(3*t + 2.1);
      P.push([gx + grx*k*Math.cos(t), gz + grz*k*Math.sin(t)]); }
    // undulation: each panel bows alternately out / in
    const PW = P.map((p, i) => { const q = P[(i + 1) % NS], r0 = P[(i + NS - 1) % NS], tx = q[0] - r0[0], tz = q[1] - r0[1], L = Math.hypot(tx, tz), nx = tz/L, nz = -tx/L;
      const ph = (i % NC)/NC, s = Math.floor(i/NC) % 2 ? -1 : 1, b = s*1.1*Math.sin(ph*PI);
      const ox = p[0] - gx, oz = p[1] - gz, out = (nx*ox + nz*oz) > 0 ? 1 : -1; return [p[0] + nx*b*out, p[1] + nz*b*out, nx*out, nz*out]; });
    const H0 = -4.5, H1 = 24.0, ROWS = 28, rh = (H1 - 1.2 - 0.6)/ROWS, blue = B.p(BLUE), rib = B.p(CON2);
    for (let i = 0; i < NS; i++){
      const a = PW[i], b = PW[(i + 1) % NS];
      quadP(blue, [a[0], H0, a[1]], [b[0], H0, b[1]], [b[0], H1, b[1]], [a[0], H1, a[1]]);
      // vertical rib at a (thicker at panel joints)
      const jt = i % NC === 0, rw = jt ? 0.32 : 0.12, ro = jt ? 0.55 : 0.28, tx = b[0] - a[0], tz = b[1] - a[1], L = Math.hypot(tx, tz), ux = tx/L, uz = tz/L;
      hexP(rib, [[a[0] - ux*rw, -4.5, a[1] - uz*rw], [a[0] + ux*rw, -4.5, a[1] + uz*rw], [a[0] + ux*rw + a[2]*ro, -4.5, a[1] + uz*rw + a[3]*ro], [a[0] - ux*rw + a[2]*ro, -4.5, a[1] - uz*rw + a[3]*ro],
        [a[0] - ux*rw, H1, a[1] - uz*rw], [a[0] + ux*rw, H1, a[1] + uz*rw], [a[0] + ux*rw + a[2]*ro, H1, a[1] + uz*rw + a[3]*ro], [a[0] - ux*rw + a[2]*ro, H1, a[1] - uz*rw + a[3]*ro]]);
      // horizontal ribs: a ledge face and its front
      for (let r = 0; r <= ROWS; r++){ const y = 1.2 + r*rh, d = 0.24;
        quadP(rib, [a[0], y, a[1]], [b[0], y, b[1]], [b[0] + b[2]*d, y, b[1] + b[3]*d], [a[0] + a[2]*d, y, a[1] + a[3]*d]);
        quadP(rib, [a[0] + a[2]*d, y - 0.13, a[1] + a[3]*d], [b[0] + b[2]*d, y - 0.13, b[1] + b[3]*d], [b[0] + b[2]*d, y, b[1] + b[3]*d], [a[0] + a[2]*d, y, a[1] + a[3]*d]); }
      // base plinth and the coping
      quadP(rib, [a[0] + a[2]*0.35, -4.5, a[1] + a[3]*0.35], [b[0] + b[2]*0.35, -4.5, b[1] + b[3]*0.35], [b[0] + b[2]*0.35, 1.2, b[1] + b[3]*0.35], [a[0] + a[2]*0.35, 1.2, a[1] + a[3]*0.35]);
      quadP(rib, [a[0] + a[2]*0.45, H1 - 0.6, a[1] + a[3]*0.45], [b[0] + b[2]*0.45, H1 - 0.6, b[1] + b[3]*0.45], [b[0] + b[2]*0.45, H1 + 0.5, b[1] + b[3]*0.45], [a[0] + a[2]*0.45, H1 + 0.5, a[1] + a[3]*0.45]);
      quadP(rib, [a[0] + a[2]*0.45, H1 + 0.5, a[1] + a[3]*0.45], [b[0] + b[2]*0.45, H1 + 0.5, b[1] + b[3]*0.45], [b[0] - b[2]*0.4, H1 + 0.5, b[1] - b[3]*0.4], [a[0] - a[2]*0.4, H1 + 0.5, a[1] - a[3]*0.4]);
    }
    capM(B.p(RF), ID, PW.map(p => [p[0], p[1]]), H1 + 0.3);
    // roof plant and a skylight band
    aboxM(B.p(MET), ID, gx - 6, gx + 4, H1 + 0.3, H1 + 2.6, gz - 4, gz + 3);
    // ---- Rocket Park: two generic launchers on pads (white / silver, dark bands, no markings)
    const W = B.p(WHT), Dk = B.p('#555b61'), SV = B.p('#b9bec2');
    { const [x, z] = HSD.rockets[0], cx = x - O[0], cz = z - O[1];
      aboxM(B.p(CON2), ID, cx - 4, cx + 4, -3.5, 0.5, cz - 4, cz + 4);
      latheM(SV, ID, [[0, 0.5], [2.6, 0.5], [2.5, 2.2], [1.55, 4.0], [0, 4.0]], cx, cz, 14);                 // booster skirt
      const top = rocketP(SV, Dk, ID, cx, cz, 4.0, [[16, 1.5], [1.2, 1.2, true]], [[1.1, 0], [0.95, 1.4], [0.45, 2.9], [0.3, 3.2], [0, 3.3]]);
      segP(Dk, [cx, top + 3.2, cz], [cx, top + 7.2, cz], 0.12, 4);                                           // escape tower
      for (let k = 0; k < 4; k++){ const a = k*HP; segP(Dk, [cx + Math.cos(a)*0.32, top + 3.1, cz + Math.sin(a)*0.32], [cx, top + 5.6, cz], 0.05, 3); } }
    { const [x, z] = HSD.rockets[1], cx = x - O[0], cz = z - O[1];
      aboxM(B.p(CON2), ID, cx - 4, cx + 4, -3.5, 0.5, cz - 4, cz + 4);
      for (let k = 0; k < 4; k++){ const a = k*HP + PI/4; segP(Dk, [cx + Math.cos(a)*3.2, 0.5, cz + Math.sin(a)*3.2], [cx + Math.cos(a)*1.5, 3.5, cz + Math.sin(a)*1.5], 0.18, 4); }
      rocketP(W, Dk, ID, cx, cz, 0.5, [[2.4, 1.55, true], [19, 1.55], [0.4, 1.55, true], [8.0, 1.55], [0.5, 1.5, true]], [[1.5, 0], [1.35, 1.6], [0.95, 3.0], [0.6, 4.6], [0.35, 5.2], [0, 5.35]]); }
    // a few young trees on the lawn round the park
    for (const [x, z] of [[30, 58], [62, 30], [20, 52], [68, 56]]) treeP(B, x - O[0], 0, z - O[1], 1.0, '#5d7d48');
    B.flush(g); return g; }};
placeAt('nyhallsci', HSD.A, HSD.O, 0);

// ============================================================================================================================
// nynybg  Enid A. Haupt Conservatory (1902, Lord & Burnham), New York Botanical Garden: the C-shaped run of eleven white
//   glasshouse pavilions — the 27 m Palm Dome (glass aisle ring, tall clerestory drum, ribbed dome, lantern), the arched-roof
//   galleries, the two big corner pavilions with raised lanterns and cupolas, the end pavilions and the apsidal ends; the
//   courtyard pools inside the C. Frame: ref nyouter2_2 / nynybg (anchor re-made on the conservatory), origin = ref (0, 0).
const NBG = {A:[40.8639, -73.88213],
  dome:[16.4, -3.9, 14.3],
  gal:[[23.6, 9.5, 43.5, 39.3, 8.6], [-11.15, -46.9, 8.55, -15.9, 8.6], [-48.35, -38.35, -28.55, -50.7, 8.3], [19.75, 69.1, 39.2, 56.75, 8.2]],
  arm:[[-50.7, -27.75, -36.95, -6.15, 11.0], [9.3, 66.6, -4.3, 45.2, 11.0]],
  bigpav:[[[-32.6,-57.2],[-28.3,-59.9],[-31.1,-64.3],[-18.4,-72.5],[-15.7,-68.3],[-11.4,-71.0],[-3.4,-58.1],[-7.6,-55.4],[-4.8,-51.0],[-17.5,-43.1],[-20.2,-47.3],[-24.6,-44.6]],
          [[35.4,50.6],[39.9,47.8],[37.2,43.6],[49.7,35.5],[52.4,39.7],[56.8,37.0],[64.9,49.7],[60.5,52.5],[63.3,56.9],[50.7,64.9],[47.9,60.5],[43.5,63.3]]],
  endpav:[[[-64.1,-35.2],[-62.7,-36.1],[-63.6,-37.6],[-54.1,-43.6],[-53.3,-42.3],[-51.6,-43.3],[-45.4,-33.5],[-46.0,-30.9],[-55.5,-24.9],[-58.1,-25.7]],
          [[4.0,72.2],[4.6,69.7],[14.1,63.7],[16.7,64.4],[22.9,74.3],[21.4,75.3],[22.2,76.5],[12.7,82.5],[11.7,81.0],[10.0,82.0]]],
  annex:[[-58.3,-57.5],[-42.0,-67.8],[-38.7,-62.6],[-33.6,-54.5],[-48.6,-44.5],[-54.2,-52.8]]};
LANDMARKS.nynybg = {zh:'恩尼德·豪普特温室（纽约植物园）', en:'Enid A. Haupt Conservatory', cat:'old', r:95, h:28,
  lt:{m:0, c:'#fff1d8', k:0.55, e:0.5},
  build(){
    const g = new THREE.Group(), B = NBat();
    const FRM = '#f4f4f0', BASE = '#c9c1ae', GLS = {c:'#dcebe7', glow:'#fff0c8', gk:0.55}, GLR = {c:'#e9f1ef', glow:'#fff3d6', gk:0.4}, WAT = {c:'#5b7f8c'}, GRN = '#7c9a5e', PAV = '#bdb6a6';
    const fr = B.p(FRM), gs = B.p(GLS), gr = B.p(GLR), bs = B.p(BASE);
    // glass wall along a polyline segment a->b (local edge frame) with mullions every ~1.6 m, knee wall, eave beam
    const glassWall = (E, y1) => { aboxM(bs, E.M, 0, E.L, -5, 0.9, -0.15, 0.35); quadP(gs, E.M(0, 0.9, 0), E.M(E.L, 0.9, 0), E.M(E.L, y1, 0), E.M(0, y1, 0));
      const n = Math.max(1, Math.round(E.L/1.6)); for (let k = 0; k <= n; k++) aboxM(fr, E.M, k*E.L/n - 0.07, k*E.L/n + 0.07, 0.9, y1, 0, 0.14);
      aboxM(fr, E.M, 0, E.L, y1 - 0.35, y1 + 0.15, -0.1, 0.3); aboxM(fr, E.M, 0, E.L, 3.0, 3.15, 0, 0.12); };
    const ringWalls = (P, y1) => { for (let i = 0; i < P.length; i++){ const E = edgeFrame(P, i); if (E.L > 0.3) glassWall(E, y1); } };
    // glass hip/pyramid roof from a ring at y0 to its offset ring at y1 (+ cap)
    const ringRoof = (P, y0, y1, ins) => { const Q = offP(P, ins); for (let i = 0; i < P.length; i++){ const j = (i + 1) % P.length; quadP(gr, [P[i][0], y0, P[i][1]], [P[j][0], y0, P[j][1]], [Q[j][0], y1, Q[j][1]], [Q[i][0], y1, Q[i][1]]);
        segP(fr, [P[i][0], y0, P[i][1]], [Q[i][0], y1, Q[i][1]], 0.1, 4); } return Q; };
    // ---- low base under the whole run (plinth) and the service annex at the north end
    prismM(B.p(PAV), ID, NBG.annex, -5, 5.0, false); capM(B.p('#7d7f7c'), ID, NBG.annex, 4.95);
    winBox(B.p({c:'#3a4046', glow:'#ffd8a0', gk:0.3}), ID, -50, -44, -60, -50, [], [], 0.6, 1.6, 3);
    // ---- galleries: straight glass halls with a segmental (arched) glass roof and a ridge monitor
    const gallery = (x0, z0, x1, z1, W, eave, rise) => {
      const L = Math.hypot(x1 - x0, z1 - z0), ry = -Math.atan2(z1 - z0, x1 - x0), M = FR(x0, 0, z0, ry), hw = W/2;
      for (const s of [-1, 1]){ const E = {L, M:(u, v, w) => M(u, v, s*(hw + w))}; glassWall(E, eave); }
      const NA = 8, prof = []; for (let i = 0; i <= NA; i++){ const t = PI*i/NA; prof.push([-Math.cos(t)*hw, eave + Math.sin(t)*rise]); }
      for (let i = 0; i < NA; i++) quadP(gr, M(0, prof[i][1], prof[i][0]), M(L, prof[i][1], prof[i][0]), M(L, prof[i+1][1], prof[i+1][0]), M(0, prof[i+1][1], prof[i+1][0]));
      const nr = Math.max(2, Math.round(L/2.4)); for (let k = 0; k <= nr; k++){ const u = k*L/nr; for (let i = 0; i < NA; i++) segP(fr, M(u, prof[i][1], prof[i][0]), M(u, prof[i+1][1], prof[i+1][0]), 0.08, 3); }
      aboxM(fr, M, 0, L, eave + rise - 0.1, eave + rise + 0.5, -0.9, 0.9);                         // ridge monitor
      for (let k = 0; k <= nr; k++) aboxM(fr, M, k*L/nr - 0.1, k*L/nr + 0.1, eave + rise + 0.5, eave + rise + 0.9, -0.1, 0.1);
      return {M, L}; };
    for (const [x0, z0, x1, z1, W] of NBG.gal) gallery(x0, z0, x1, z1, W, 5.6, 2.6);
    // ---- the two arms ending in apses (taller arched roofs)
    for (const [x0, z0, x1, z1, W] of NBG.arm){
      const { M, L } = gallery(x0, z0, x1, z1, W, 6.0, 3.6), hw = W/2, NA = 8;
      // apsidal end at u = L: half-round glass wall and a half-dome of glass
      const AP = []; for (let i = 0; i <= NA; i++){ const t = -HP + PI*i/NA; AP.push([L + Math.cos(t)*hw, Math.sin(t)*hw]); }
      for (let i = 0; i < NA; i++){ const a = M(AP[i][0], 0, AP[i][1]), b = M(AP[i+1][0], 0, AP[i+1][1]); const E = {L:Math.hypot(b[0] - a[0], b[2] - a[2]), M:(u, v, w) => { const t = u/Math.hypot(b[0] - a[0], b[2] - a[2]); return [a[0] + (b[0] - a[0])*t, v, a[2] + (b[2] - a[2])*t]; }}; glassWall(E, 6.0); }
      for (let i = 0; i < NA; i++) for (let j = 0; j < 4; j++){ const p0 = j/4*HP, p1 = (j + 1)/4*HP, r0 = Math.cos(p0)*hw, r1 = Math.cos(p1)*hw, y0 = 6.0 + Math.sin(p0)*3.6, y1 = 6.0 + Math.sin(p1)*3.6;
        const A0 = AP[i], A1 = AP[i+1], d0 = [(A0[0] - L)/hw, A0[1]/hw], d1 = [(A1[0] - L)/hw, A1[1]/hw];
        quadP(gr, M(L + d0[0]*r0, y0, d0[1]*r0), M(L + d1[0]*r0, y0, d1[1]*r0), M(L + d1[0]*r1, y1, d1[1]*r1), M(L + d0[0]*r1, y1, d0[1]*r1));
        if (j < 3) segP(fr, M(L + d0[0]*r0, y0, d0[1]*r0), M(L + d0[0]*r1, y1, d0[1]*r1), 0.08, 3); } }
    // ---- corner pavilions: stepped-square glass bodies, hipped glass roof, raised square lantern with a small dome and finial
    for (const P of NBG.bigpav){
      ringWalls(P, 7.2); const Q = ringRoof(P, 7.2, 11.0, 4.2);
      capM(gr, ID, Q, 11.0);
      let cx = 0, cz = 0; for (const p of P){ cx += p[0]/P.length; cz += p[1]/P.length; }
      const ang = Math.atan2(P[1][1] - P[0][1], P[1][0] - P[0][0]), M = FR(cx, 0, cz, -ang), s = 4.4;
      for (const [a, b] of [[-s, s]]) { const E = [[-s, -s], [s, -s], [s, s], [-s, s]].map(p => M(p[0], 0, p[1])).map(p => [p[0], p[2]]); for (let i = 0; i < 4; i++){ const F = edgeFrame(E, i); quadP(gs, F.M(0, 11.0, 0), F.M(F.L, 11.0, 0), F.M(F.L, 14.6, 0), F.M(0, 14.6, 0)); for (let k = 0; k <= 5; k++) aboxM(fr, F.M, k*F.L/5 - 0.07, k*F.L/5 + 0.07, 11, 14.6, 0, 0.14); aboxM(fr, F.M, -0.2, F.L + 0.2, 14.4, 15.0, -0.1, 0.35); } }
      pyrM(gr, M, -s - 0.3, s + 0.3, -s - 0.3, s + 0.3, 15.0, 1.6, 2.6);
      latheM(gr, ID, [[2.0, 16.6], [2.1, 17.4], [1.7, 18.6], [0.9, 19.5], [0.3, 19.8], [0, 19.85]], cx, cz, 12);
      for (let k = 0; k < 12; k++){ const a = k/12*TAU; segP(fr, [cx + Math.cos(a)*2.05, 16.6, cz + Math.sin(a)*2.05], [cx + Math.cos(a)*1.2, 19.3, cz + Math.sin(a)*1.2], 0.06, 3); }
      cylM(fr, ID, 0.1, 0.05, 19.8, 21.6, cx, cz, 5); }
    // ---- end pavilions (lower): glass bodies, hipped glass roof, a small octagonal cupola
    for (const P of NBG.endpav){
      ringWalls(P, 6.4); const Q = ringRoof(P, 6.4, 9.6, 3.6); capM(gr, ID, Q, 9.6);
      let cx = 0, cz = 0; for (const p of P){ cx += p[0]/P.length; cz += p[1]/P.length; }
      cylM(gs, ID, 1.6, 1.6, 9.6, 11.4, cx, cz, 8); latheM(gr, ID, [[1.9, 11.4], [1.5, 12.2], [0.6, 12.9], [0, 13.0]], cx, cz, 8); cylM(fr, ID, 0.08, 0.04, 13.0, 14.2, cx, cz, 4); }
    // ---- the Palm Dome: aisle ring, clerestory drum, ribbed dome, lantern
    { const [cx, cz, R0] = NBG.dome, R1 = 10.2, NS = 32;
      const ring = []; for (let i = 0; i < NS; i++){ const a = i/NS*TAU; ring.push([cx + Math.cos(a)*R0, cz + Math.sin(a)*R0]); }
      ringWalls(ring, 7.0);
      latheM(gr, ID, [[R0, 7.0], [R1 + 0.3, 10.6]], cx, cz, NS);
      for (let i = 0; i < NS; i++){ const a = i/NS*TAU; segP(fr, [cx + Math.cos(a)*R0, 7.0, cz + Math.sin(a)*R0], [cx + Math.cos(a)*(R1 + 0.3), 10.6, cz + Math.sin(a)*(R1 + 0.3)], 0.09, 3); }
      cylM(gs, ID, R1, R1, 10.6, 15.6, cx, cz, NS);
      for (let i = 0; i < NS; i++){ const a = i/NS*TAU; aboxM(fr, FR(cx + Math.cos(a)*R1, 0, cz + Math.sin(a)*R1, -a), -0.08, 0.08, 10.6, 15.6, -0.08, 0.15); }
      cylM(fr, ID, R1 + 0.25, R1 + 0.25, 15.4, 16.0, cx, cz, NS); cylM(fr, ID, R1 + 0.15, R1 + 0.15, 13.0, 13.2, cx, cz, NS);
      const prof = []; for (let i = 0; i <= 8; i++){ const t = i/8*HP; prof.push([Math.cos(t)*R1, 16.0 + Math.sin(t)*8.2]); }
      prof[8][0] = 2.4; latheM(gr, ID, prof, cx, cz, NS);
      for (let k = 0; k < 16; k++){ const a = k/16*TAU; for (let i = 0; i < 8; i++){ const p = prof[i], q = prof[i + 1]; segP(fr, [cx + Math.cos(a)*p[0], p[1], cz + Math.sin(a)*p[0]], [cx + Math.cos(a)*q[0], q[1], cz + Math.sin(a)*q[0]], 0.12, 3); } }
      for (const t of [0.35, 0.65]){ const r = Math.cos(t*HP)*R1 + 0.05, y = 16 + Math.sin(t*HP)*8.2; latheM(fr, ID, [[r, y - 0.1], [r + 0.1, y], [r, y + 0.1]], cx, cz, NS); }
      cylM(gs, ID, 2.3, 2.3, 24.2, 25.9, cx, cz, 12); cylM(fr, ID, 2.6, 2.6, 25.9, 26.3, cx, cz, 12);
      latheM(gr, ID, [[2.5, 26.3], [1.9, 26.9], [0.8, 27.4], [0, 27.5]], cx, cz, 12); cylM(fr, ID, 0.1, 0.05, 27.4, 29.0, cx, cz, 4); }
    // ---- courtyard: the reflecting pools inside the C and lawn
    { const M = FR(-6, 0, 3, -1.0);
      for (const [a, b] of [[-24, -2], [2, 24]]){ aboxM(B.p(BASE), M, a, b, -0.6, 0.3, -6.5, 6.5); aboxM(B.p(WAT), M, a + 0.6, b - 0.6, -0.5, 0.36, -5.9, 5.9); } }
    B.flush(g); return g; }};
placeAt('nynybg', NBG.A, [0, 0], 0);

// ============================================================================================================================
// nybxcourthouse  Bronx County Building (1934, Max Hausle & Joseph Freedlander), 851 Grand Concourse: a square nine-storey
//   limestone block on a rusticated granite base, giant square piers framing the window columns on every front, the
//   sculptured frieze band and cornice, the setback attic storey and the central upper block (58.5 m), and on each of the four
//   fronts the entrance stair flanked by two sculpture groups on granite pedestals (stylised figures only).
//   Frame: ref nyouter2 / nybxcourthouse, origin = footprint centroid, local box rotated (ry -0.4214); +x faces the Concourse.
const BXD = {A:[40.8262, -73.9227], O:[-93.4, -7.2], ry:-0.4214, hx:34.4, hz:37.8};
LANDMARKS.nybxcourthouse = {zh:'布朗克斯县法院大楼', en:'Bronx County Building (Courthouse)', cat:'old', r:58, h:59,
  lt:{m:0, c:'#ffe2b8', k:0.75, e:0.5},
  build(){
    const g = new THREE.Group(), B = NBat(), M = FR(0, 0, 0, BXD.ry), hx = BXD.hx, hz = BXD.hz;
    const LS = '#d8d1bf', LS2 = '#c9c0aa', GR = '#a29c91', GR2 = '#8a847a', FRZ = '#cdbf9c', SP = '#7f7464', RF = '#7b7a76', SC = '#d6cfbd';
    const WIN = {c:'#2b3239', glow:'#ffd9a2', gk:0.55}, DOOR = {c:'#3a3530', glow:'#ffcf8a', gk:0.8};
    const ls = B.p(LS), ls2 = B.p(LS2), gr = B.p(GR), gr2 = B.p(GR2), win = B.p(WIN), sp = B.p(SP);
    // ---- masses
    aboxM(gr, M, -hx, hx, -6, 8.0, -hz, hz);
    aboxM(ls, M, -hx + 0.3, hx - 0.3, 8.0, 33.2, -hz + 0.3, hz - 0.3);
    aboxM(B.p(FRZ), M, -hx + 0.05, hx - 0.05, 33.2, 35.6, -hz + 0.05, hz - 0.05);
    aboxM(ls2, M, -hx - 0.6, hx + 0.6, 35.6, 36.7, -hz - 0.6, hz + 0.6);
    aboxM(ls, M, -hx + 2.8, hx - 2.8, 36.7, 41.2, -hz + 2.8, hz - 2.8);
    aboxM(ls2, M, -hx + 2.5, hx - 2.5, 41.2, 41.9, -hz + 2.5, hz - 2.5);
    aboxM(ls, M, -14.5, 14.5, 41.9, 57.4, -17.5, 17.5);
    aboxM(ls2, M, -15.0, 15.0, 57.4, 58.5, -18.0, 18.0);
    aboxM(B.p(RF), M, -12, 12, 58.5, 59.0, -15, 15);
    // ---- the four fronts
    const faces = [{L:2*hz, F:(u, v, w) => M(hx + w, v, u)}, {L:2*hz, F:(u, v, w) => M(-hx - w, v, -u)}, {L:2*hx, F:(u, v, w) => M(-u, v, hz + w)}, {L:2*hx, F:(u, v, w) => M(u, v, -hz - w)}];
    for (const f of faces){
      const F = f.F, hl = f.L/2, cw = Math.min(24, hl - 9);                       // colonnade half-width
      // rustication joints on the granite base
      for (let y = 1.0; y < 8; y += 1.15) quadP(gr2, F(-hl, y, 0.03), F(hl, y, 0.03), F(hl, y + 0.12, 0.03), F(-hl, y + 0.12, 0.03));
      // giant piers and window columns with spandrels
      const np = Math.round(2*cw/4.2), st = 2*cw/np;
      for (let k = 0; k <= np; k++){ const u = -cw + k*st; aboxM(ls2, F, u - 0.75, u + 0.75, 8.0, 33.2, -0.3, 0.75); }
      for (let k = 0; k < np; k++){ const u = -cw + (k + 0.5)*st;
        for (let fl = 0; fl < 6; fl++){ const y = 9.2 + fl*4.0; quadP(win, F(u - 1.2, y, -0.25), F(u + 1.2, y, -0.25), F(u + 1.2, y + 2.7, -0.25), F(u - 1.2, y + 2.7, -0.25));
          quadP(sp, F(u - 1.3, y + 2.7, -0.24), F(u + 1.3, y + 2.7, -0.24), F(u + 1.3, y + 4.0, -0.24), F(u - 1.3, y + 4.0, -0.24)); }
        quadP(win, F(u - 1.0, 2.2, 0.05), F(u + 1.0, 2.2, 0.05), F(u + 1.0, 6.0, 0.05), F(u - 1.0, 6.0, 0.05)); }
      // corner pavilions: punched windows
      for (const s of [-1, 1]) for (let k = 0; k < 2; k++){ const u = s*(cw + 2.5 + k*3.6);
        if (Math.abs(u) > hl - 1.5) continue;
        for (let fl = 0; fl < 6; fl++){ const y = 9.4 + fl*4.0; quadP(win, F(u - 0.8, y, -0.24), F(u + 0.8, y, -0.24), F(u + 0.8, y + 2.4, -0.24), F(u - 0.8, y + 2.4, -0.24)); }
        quadP(win, F(u - 0.8, 2.4, 0.05), F(u + 0.8, 2.4, 0.05), F(u + 0.8, 5.6, 0.05), F(u - 0.8, 5.6, 0.05)); }
      // frieze relief rhythm (small raised panels) and attic windows
      for (let u = -hl + 2; u < hl - 1; u += 2.6) aboxM(B.p(SC), F, u - 0.9, u + 0.9, 33.6, 35.2, 0, 0.18);
      for (let u = -hl + 6; u < hl - 5; u += 3.2) quadP(win, F(u - 0.7, 37.6, -2.74), F(u + 0.7, 37.6, -2.74), F(u + 0.7, 40.2, -2.74), F(u - 0.7, 40.2, -2.74));
      // entrance: recessed bronze portal, stair, the two pedestals with sculpture groups
      aboxM(gr2, F, -5.5, 5.5, -6, 0.4, 0, 6.5);
      for (let k = 0; k < 6; k++) aboxM(gr, F, -5.0, 5.0, 0.4 + k*0.33, 0.73 + k*0.33, 0, 5.0 - k*0.8);
      quadP(B.p(DOOR), F(-4.0, 2.4, 0.06), F(4.0, 2.4, 0.06), F(4.0, 7.4, 0.06), F(-4.0, 7.4, 0.06));
      aboxM(gr, F, -4.8, 4.8, 7.4, 8.2, 0, 0.5);
      for (const s of [-1, 1]){
        aboxM(gr, F, s*8.5 - 3.0, s*8.5 + 3.0, -1, 3.4, 0.4, 4.4); aboxM(gr2, F, s*8.5 - 3.3, s*8.5 + 3.3, 3.4, 3.8, 0.1, 4.7);
        const o = B.p(SC); figP(o, F, s*8.5 - 1.3, 3.8, 2.6, 3.4, 0, 0); figP(o, F, s*8.5 + 1.2, 3.8, 2.2, 3.0, 0, s > 0 ? 1 : 0);
        hexP(o, [F(s*8.5 - 0.6, 3.8, 1.2), F(s*8.5 + 0.6, 3.8, 1.2), F(s*8.5 + 0.6, 3.8, 3.4), F(s*8.5 - 0.6, 3.8, 3.4), F(s*8.5 - 0.4, 5.8, 1.6), F(s*8.5 + 0.4, 5.8, 1.6), F(s*8.5 + 0.4, 5.8, 3.0), F(s*8.5 - 0.4, 5.8, 3.0)]); }
    }
    // ---- upper block: piers and windows on its four sides, attic windows
    const tf = [{L:35, F:(u, v, w) => M(14.5 + w, v, u)}, {L:35, F:(u, v, w) => M(-14.5 - w, v, -u)}, {L:29, F:(u, v, w) => M(-u, v, 17.5 + w)}, {L:29, F:(u, v, w) => M(u, v, -17.5 - w)}];
    for (const f of tf){ const hl = f.L/2, n = Math.round(f.L/3.6), st = f.L/n;
      for (let k = 0; k <= n; k++){ const u = -hl + k*st; aboxM(ls2, f.F, u - 0.45, u + 0.45, 41.9, 57.4, -0.1, 0.45); }
      for (let k = 0; k < n; k++){ const u = -hl + (k + 0.5)*st; for (let fl = 0; fl < 4; fl++){ const y = 42.8 + fl*3.6; quadP(win, f.F(u - 0.9, y, 0.04), f.F(u + 0.9, y, 0.04), f.F(u + 0.9, y + 2.4, 0.04), f.F(u - 0.9, y + 2.4, 0.04)); } } }
    B.flush(g); return g; }};
placeAt('nybxcourthouse', BXD.A, BXD.O, 0);

// ============================================================================================================================
// nyfordham  Keating Hall (1936, Robert J. Reiley), Fordham University Rose Hill: Collegiate Gothic in grey Fordham gneiss with
//   limestone trim — four ranges round an enclosed courtyard (four storeys, buttresses, Tudor windows, crenellated parapets,
//   slate roofs), the central entrance pavilion on the front facing Edwards Parade (pointed entrance arch, great Gothic window,
//   steps), and the square clock tower rising from the courtyard behind it (multi-storey open belfry, four clock faces above
//   it, crenellated top with corner pinnacles). Frame: ref nyouter2 / nyfordham (Keating Hall = building 6), origin = its
//   centroid, local box rotated ry 0.9206; local -z = the front (north-west, to Edwards Parade).
const KHD = {A:[40.8615, -73.8857], O:[151.3, 107.4], ry:0.9206, x0:-26.6, x1:25.6, z0:-28.2, z1:28.7, D:13.0};
LANDMARKS.nyfordham = {zh:'福坦莫大学基廷楼', en:'Keating Hall, Fordham University', cat:'old', r:48, h:52,
  lt:{m:0, c:'#ffe0b0', k:0.7, e:0.4},
  build(){
    const g = new THREE.Group(), B = NBat(), M = FR(0, 0, 0, KHD.ry), {x0, x1, z0, z1, D} = KHD;
    const GN = '#a19a8d', GN2 = '#8f887b', TR = '#d5cebb', SL = '#4e5459', DK = '#2a2f35';
    const WIN = {c:'#2b3138', glow:'#ffd596', gk:0.55}, CLK = {c:'#ece6d2', glow:'#fff0c8', gk:1.2};
    const gn = B.p(GN), gn2 = B.p(GN2), tr = B.p(TR), win = B.p(WIN), sl = B.p(SL), H = 16.5;
    const cx0 = x0 + D, cx1 = x1 - D, cz0 = z0 + D, cz1 = z1 - D;                     // the courtyard
    // ---- the four ranges: plinth, walls, string course, parapet band, slate roofs
    const ranges = [[x0, x1, z0, cz0, 'x'], [x0, x1, cz1, z1, 'x'], [x0, cx0, cz0, cz1, 'z'], [cx1, x1, cz0, cz1, 'z']];
    for (const [a0, a1, b0, b1, ax] of ranges){
      aboxM(gn2, M, a0 - 0.3, a1 + 0.3, -6, 1.2, b0 - 0.3, b1 + 0.3); aboxM(gn, M, a0, a1, 1.2, H, b0, b1);
      aboxM(tr, M, a0 - 0.15, a1 + 0.15, 4.6, 4.9, b0 - 0.15, b1 + 0.15); aboxM(tr, M, a0 - 0.2, a1 + 0.2, H - 0.3, H + 0.1, b0 - 0.2, b1 + 0.2);
    }
    // one slate roof round the quadrangle: outer and courtyard slopes meeting at a ridge ring (hips / valleys at the corners)
    { const rect = d => [[x0 + d, z0 + d], [x1 - d, z0 + d], [x1 - d, z1 - d], [x0 + d, z1 - d]], Ro = rect(0.4), Rr = rect(D/2), Ri = rect(D - 0.4);
      for (let i = 0; i < 4; i++){ const j = (i + 1) % 4; quadP(sl, M(Ro[i][0], H + 0.1, Ro[i][1]), M(Ro[j][0], H + 0.1, Ro[j][1]), M(Rr[j][0], H + 5.6, Rr[j][1]), M(Rr[i][0], H + 5.6, Rr[i][1]));
        quadP(sl, M(Ri[i][0], H + 0.1, Ri[i][1]), M(Ri[j][0], H + 0.1, Ri[j][1]), M(Rr[j][0], H + 5.6, Rr[j][1]), M(Rr[i][0], H + 5.6, Rr[i][1])); } }
    // facades: outer faces (crenellated, buttressed) and courtyard faces
    const faces = [{a:x0, b:x1, F:(u, v, w) => M(u, v, z0 - w), out:true, front:true}, {a:-x1, b:-x0, F:(u, v, w) => M(-u, v, z1 + w), out:true}, {a:-z1, b:-z0, F:(u, v, w) => M(x0 - w, v, -u), out:true}, {a:z0, b:z1, F:(u, v, w) => M(x1 + w, v, u), out:true},
      {a:cx0, b:cx1, F:(u, v, w) => M(u, v, cz0 + w)}, {a:-cx1, b:-cx0, F:(u, v, w) => M(-u, v, cz1 - w)}, {a:-cz1, b:-cz0, F:(u, v, w) => M(cx0 + w, v, -u)}, {a:cz0, b:cz1, F:(u, v, w) => M(cx1 - w, v, u)}];
    for (const f of faces){
      const { a, b, F } = f;
      if (f.out) crenel(tr, (u, v, w) => F(u, v, -w), a, b, H + 0.1, 1.4, 0.45, 0.7);
      const n = Math.max(1, Math.round((b - a)/6.4)), st = (b - a)/n, skip = u => f.front && Math.abs(u + 0.5) < 8.5;
      if (f.out) for (let k = 0; k <= n; k++){ const u = a + k*st; if (skip(u)) continue;
        aboxM(gn2, F, u - 0.45, u + 0.45, 0, H - 2.0, 0, 0.75); hexP(gn2, [F(u - 0.45, H - 2.0, 0), F(u + 0.45, H - 2.0, 0), F(u + 0.45, H - 2.0, 0.75), F(u - 0.45, H - 2.0, 0.75), F(u - 0.45, H - 0.8, 0), F(u + 0.45, H - 0.8, 0), F(u + 0.45, H - 0.8, 0.05), F(u - 0.45, H - 0.8, 0.05)]); }
      for (let k = 0; k < n; k++){ const u = a + (k + 0.5)*st; if (skip(u)) continue;
        const Fw = (uu, vv) => F(uu, vv, 0.05);
        gothWin(win, Fw, u - 1.0, 1.9, 0.6, 2.4, 3); gothWin(win, Fw, u + 1.0, 1.9, 0.6, 2.4, 3);
        for (const y of [5.6, 9.2, 12.6]){ quadP(win, Fw(u - 1.75, y), Fw(u - 0.15, y), Fw(u - 0.15, y + 2.3), Fw(u - 1.75, y + 2.3)); quadP(win, Fw(u + 0.15, y), Fw(u + 1.75, y), Fw(u + 1.75, y + 2.3), Fw(u + 0.15, y + 2.3));
          aboxM(tr, F, u - 2.0, u + 2.0, y + 2.3, y + 2.55, 0, 0.18); } } }
    for (const [cx, cz] of [[-18, 22], [17, 22], [-20, -20], [19, -20]]) aboxM(gn2, M, cx - 1.0, cx + 1.0, H, H + 7.6, cz - 0.6, cz + 0.6);
    // ---- the front entrance pavilion (projecting 1.6 m, rising above the range) with the great window and the portal
    const px = -0.5, pw = 7.2, P = (u, v, w) => M(px + u, v, w);
    aboxM(gn, P, -pw, pw, -6, 22.0, z0 - 1.6, cz0);
    for (const s of [-1, 1]){ latheM(gn2, P, [[0, -6], [1.25, -6], [1.25, 24.5], [0, 24.5]], s*pw, z0 - 1.6, 8); latheM(tr, P, [[1.0, 24.5], [0.9, 25.3], [0.05, 28.0], [0, 28.0]], s*pw, z0 - 1.6, 8); }
    crenel(tr, (u, v, w) => P(u, v, z0 - 1.6 + w), -pw, pw, 22.0, 1.5, 0.5, 0.7); aboxM(tr, P, -pw - 0.2, pw + 0.2, 21.6, 22.0, z0 - 1.9, z0 - 1.3);
    const Ff = (u, v) => P(u, v, z0 - 1.66);
    gothWin(B.p(DK), Ff, 0, 0.0, 2.6, 8.2, 6); aboxM(tr, P, -3.3, 3.3, 0, 0.5, z0 - 2.1, z0 - 1.6);
    gothWin(win, Ff, 0, 10.0, 2.4, 10.6, 6);
    for (const u of [-1.2, 0, 1.2]) aboxM(tr, P, u - 0.08, u + 0.08, 10.0, 18.0, z0 - 1.75, z0 - 1.6);
    for (const y of [13.6, 17.0]) aboxM(tr, P, -2.4, 2.4, y - 0.08, y + 0.08, z0 - 1.75, z0 - 1.6);
    for (let k = 0; k < 6; k++) aboxM(tr, P, -6 - k*0.4, 6 + k*0.4, -1.2, 0.3 - k*0.25, z0 - 2.6 - k*0.8, z0 - 1.5);
    // ---- the clock tower rising from the courtyard behind the pavilion
    const tz = cz0 + 6.3, th = 5.8, F = (u, v, w) => M(px + u, v, tz + w);
    aboxM(gn, F, -th, th, -6, 30.0, -th, th);
    aboxM(tr, F, -th - 0.2, th + 0.2, 30.0, 30.5, -th - 0.2, th + 0.2);
    aboxM(gn, F, -th + 0.3, th - 0.3, 30.5, 45.0, -th + 0.3, th - 0.3);
    for (const y of [40.0, 45.0]) aboxM(tr, F, -th - 0.15, th + 0.15, y - 0.45, y, -th - 0.15, th + 0.15);
    for (let s = 0; s < 4; s++){
      const R = (u, v, w) => { const c = [[1, 0], [0, 1], [-1, 0], [0, -1]][s]; return F(u*c[0] - w*c[1], v, u*c[1] + w*c[0]); };
      const Fw = (u, v) => R(u, v, -(th - 0.3) - 0.05), Fo = (u, v) => R(u, v, -th - 0.05);
      crenel(tr, (u, v, w) => R(u, v, -th + 0.3 - w), -th + 0.3, th - 0.3, 45.0, 1.4, 0.45, 0.65);
      gothWin(B.p(DK), Fw, -1.75, 30.9, 1.05, 8.4, 4); gothWin(B.p(DK), Fw, 1.75, 30.9, 1.05, 8.4, 4);              // open belfry
      discM(tr, (u, v, w) => R(u, v, -(th - 0.3) - w), 0, 42.3, 0.0, 0.25, 2.1, 20); discM(B.p(CLK), (u, v, w) => R(u, v, -(th - 0.3) - w), 0, 42.3, 0.25, 0.35, 1.8, 20);
      for (const y of [17.5, 23.5]) gothWin(win, Fo, 0, y, 0.7, 3.6, 3); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]){ const cx = sx*(th - 0.1), cz = sz*(th - 0.1);
      latheM(gn2, F, [[0, 26], [1.15, 26], [1.15, 46.6], [0, 46.6]], cx, cz, 8); latheM(tr, F, [[0, 46.6], [1.35, 46.6], [1.35, 47.1], [0, 47.1]], cx, cz, 8);
      latheM(tr, F, [[0.95, 47.1], [0.85, 47.9], [0.05, 51.6], [0, 51.6]], cx, cz, 8); }
    // courtyard paving
    aboxM(B.p('#b9b2a4'), M, cx0, cx1, -0.4, 0.15, cz0, cz1);
    B.flush(g); return g; }};
placeAt('nyfordham', KHD.A, KHD.O, 0);

// ============================================================================================================================
// nygould  Gould Memorial Library (1899, McKim, Mead & White / Stanford White), Bronx Community College (former NYU University
//   Heights): Greek-cross library in buff Roman brick and limestone on a raised base, pedimented north / west / south arms, the
//   east wing with the hexastyle Corinthian portico and the grand stair, the Pantheon-like stepped drum and copper-tiled dome;
//   the open-air Hall of Fame for Great Americans colonnade curving round the back on its tall substructure (no busts,
//   no names), and the flanking Hall of Philosophy and Hall of Languages. Frame: ref nyouter2 / nygould, origin = the dome
//   centre (ref -91.2, 28.3); library frame ry -0.4237 (+x to the portico, ESE).
const GLD = {A:[40.859, -73.9129], O:[-91.2, 28.3], ry:-0.4237,
  lib:[[-9.45,-16.8],[9.5,-16.8],[9.5,-12.3],[12.3,-9.5],[17.3,-9.5],[17.3,-8.9],[31.0,-8.9],[31.0,8.7],[17.3,8.7],[17.3,9.5],[12.3,9.5],[9.5,12.3],[9.5,16.7],[-9.45,16.7],[-9.45,12.3],[-12.3,9.5],[-16.8,9.5],[-16.8,-9.5],[-12.3,-9.5],[-9.45,-12.3]],
  hfo:[[-81.5,-0.1],[-86.8,-1.4],[-95.0,-1.5],[-102.9,0.6],[-107.7,3.2],[-111.9,6.5],[-117.1,12.9],[-120.2,20.4],[-121.3,27.1],[-120.5,35.2],[-118.6,40.6],[-116.8,44.0],[-111.6,50.2],[-106.1,54.2]],
  hfi:[[-83.5,4.4],[-89.6,3.2],[-94.6,3.3],[-99.5,4.4],[-104.0,6.5],[-109.9,11.1],[-114.2,17.6],[-115.4,20.8],[-116.4,25.6],[-116.4,30.6],[-115.9,33.9],[-114.1,39.0],[-111.3,43.6],[-107.2,47.7],[-104.1,49.8]],
  stN:[[-82.4,2.2],[-77.3,-8.6],[-71.2,-15.8],[-65.5,-17.8],[-60.0,-23.6]],
  tail:[[-60.0,-23.6],[-55.2,-29.0],[-51.9,-31.5],[-48.0,-33.0],[-43.1,-33.7],[-39.5,-33.5],[-33.9,-31.4]],
  stS:[[-105.1,52.0],[-108.8,60.5],[-112.0,68.3]],
  ph:[[-70.3,-10.6],[-62.3,-14.7],[-57.5,-23.6],[-53.8,-21.6],[-38.8,-14.8],[-50.7,11.5],[-66.8,4.3],[-62.7,-4.7],[-66.5,-6.4]],
  lh:[[-97.1,71.3],[-93.0,62.2],[-77.0,69.4],[-88.9,95.8],[-104.9,88.5],[-100.9,79.7],[-104.7,78.0],[-103.8,75.9],[-114.1,71.9],[-111.8,66.7],[-106.7,69.6]]};
LANDMARKS.nygould = {zh:'古尔德纪念图书馆与美国名人堂', en:'Gould Memorial Library and Hall of Fame for Great Americans', cat:'old', r:88, h:29,
  lt:{m:0, c:'#ffe3bb', k:0.75, e:0.4},
  build(){
    const g = new THREE.Group(), B = NBat(), O = GLD.O, M = FR(0, 0, 0, GLD.ry);
    const BR = '#c9a57a', BR2 = '#b8946a', LS = '#ddd6c4', GRA = '#a8a196', CU = {c:'#6f9c88', m:0, lc:'#ffe7c4', lk:0.6}, CU2 = '#5e8a77', RF = '#6c6f70', DK = '#30353a';
    const WIN = {c:'#2c3239', glow:'#ffd394', gk:0.6};
    const br = B.p(BR), ls = B.p(LS), gra = B.p(GRA), win = B.p(WIN), cu = B.p(CU);
    // ---- library: raised base, brick walls with limestone pilasters, cornice, parapet
    const L = GLD.lib, Lw = L.map(p => { const q = M(p[0], 0, p[1]); return [q[0], q[2]]; });
    prismM(gra, ID, offP(Lw, -0.4), -8, 3.2, false); prismM(ls, ID, offP(Lw, -0.5), 3.2, 3.8, false);
    prismM(br, ID, Lw.map(p => p), 3.8, 13.0, false);
    prismM(ls, ID, offP(Lw, -0.55), 13.0, 14.0, false); capM(B.p(RF), ID, Lw, 13.9);
    for (let i = 0; i < Lw.length; i++){ const E = edgeFrame(Lw, i); if (E.L < 6 || (i >= 5 && i <= 7)) continue;
      const n = 4, st = E.L/n; for (let k = 0; k <= n; k++) aboxM(ls, E.M, k*st - 0.45, k*st + 0.45, 3.8, 13.0, 0, 0.3);
      for (let k = 0; k < n; k++){ const u = (k + 0.5)*st; winArchM(win, E.M, u, 5.4, 0.85, 5.6, 0.05, 6); quadP(win, E.M(u - 0.7, 1.0, 0.45), E.M(u + 0.7, 1.0, 0.45), E.M(u + 0.7, 2.4, 0.45), E.M(u - 0.7, 2.4, 0.45)); } }
    // pedimented arms (N, S, W) and the east wing roof
    gableXM(B.p(RF), M, -16.8, -9.45, -9.5, 9.5, 14.0, 3.6, 0.6); gableXM(B.p(RF), M, 9.45, 31.0, -9.0, 8.8, 14.0, 3.4, 0.4);
    aboxM(gra, M, 31.0, 34.9, -8, 3.2, -8.9, 8.7); aboxM(ls, M, 31.0, 35.0, 3.2, 3.8, -9.0, 8.8); aboxM(ls, M, 30.4, 34.8, 13.0, 13.4, -8.6, 8.4);
    gableM(B.p(RF), M, -9.45, 9.5, -16.8, -9.5, 14.0, 3.6, 0.6); gableM(B.p(RF), M, -9.45, 9.5, 9.5, 16.7, 14.0, 3.6, 0.6);
    for (const [a, b, c, d] of [[-17.4, -17.4, -9.9, 9.9], [-9.9, 9.9, -17.4, -17.4], [-9.9, 9.9, 17.3, 17.3]]){
      if (a === b){ triP(ls, M(a, 14.0, c), M(a, 14.0, d), M(a, 17.6, 0)); } else { triP(ls, M(a, 14.0, c), M(b, 14.0, c), M(0, 17.6, c)); } }
    // ---- the drum and dome (Pantheon-like steps, copper tiles, sealed oculus)
    latheM(br, ID, [[0, 13.9], [11.2, 13.9], [11.2, 16.4], [0, 16.4]], 0, 0, 32);
    latheM(ls, ID, [[0, 16.4], [11.5, 16.4], [11.5, 17.0], [10.6, 17.0], [10.6, 18.0], [9.9, 18.0], [9.9, 18.8], [0, 18.8]], 0, 0, 32);
    latheM(cu, ID, [[9.9, 18.8], [9.5, 20.6], [8.6, 22.6], [7.1, 24.6], [5.1, 26.4], [3.4, 27.4], [0, 27.4]], 0, 0, 32);
    latheM(B.p(CU2), ID, [[3.5, 27.4], [3.5, 27.9], [2.6, 28.4], [0, 28.6]], 0, 0, 16);
    for (let k = 0; k < 24; k++){ const a = k/24*TAU; const p = [[9.9, 18.8], [9.5, 20.6], [8.6, 22.6], [7.1, 24.6], [5.1, 26.4], [3.4, 27.4]];
      for (let i = 0; i < p.length - 1; i++) segP(B.p(CU2), [Math.cos(a)*(p[i][0] + 0.06), p[i][1], Math.sin(a)*(p[i][0] + 0.06)], [Math.cos(a)*(p[i+1][0] + 0.06), p[i+1][1], Math.sin(a)*(p[i+1][0] + 0.06)], 0.07, 3); }
    // ---- the east portico: six Corinthian columns, entablature, pediment, grand stair
    for (let k = 0; k < 6; k++){ const z = -7.5 + k*3.0; colP(ls, M, 33.6, z, 3.8, 9.2, 0.55, 10, 1.45); }
    aboxM(ls, M, 31.8, 35.3, 13.0, 14.4, -9.0, 8.8);
    gableXM(B.p(RF), M, 30.0, 35.6, -9.3, 9.1, 14.4, 3.4, 0.2); triP(ls, M(35.75, 14.4, -9.1), M(35.75, 14.4, 8.9), M(35.75, 17.75, -0.1)); aboxM(ls, M, 35.0, 35.75, 14.3, 14.6, -9.3, 9.1);
    quadP(B.p(DK), M(31.0, 3.8, -6.5), M(31.0, 3.8, 6.3), M(31.0, 11.8, 6.3), M(31.0, 11.8, -6.5));
    for (let k = 0; k < 10; k++) aboxM(gra, M, 34.9, 35.6 + (10 - k)*0.55, -8 - 0, 0.32*(k + 1), -8.6, 8.4);
    // ---- the colonnades (Hall of Fame): floor on a tall substructure, two rows of columns, architraves, roof with balustrade
    const resample = (P, n) => { const d = [0]; for (let i = 1; i < P.length; i++) d.push(d[i-1] + Math.hypot(P[i][0] - P[i-1][0], P[i][1] - P[i-1][1]));
      const out = []; for (let k = 0; k <= n; k++){ const s = d[d.length - 1]*k/n; let i = 1; while (i < d.length - 1 && d[i] < s) i++; const t = (s - d[i-1])/(d[i] - d[i-1] || 1); out.push([P[i-1][0] + (P[i][0] - P[i-1][0])*t, P[i-1][1] + (P[i][1] - P[i-1][1])*t]); } return {pts:out, len:d[d.length - 1]}; };
    const colonnade = (C, hw, deep) => {
      const { pts, len } = resample(C.map(p => [p[0] - O[0], p[1] - O[1]]), Math.max(2, Math.round(len0(C)/3.0)));
      const N = pts.length, side = [], nrm = [];
      for (let i = 0; i < N; i++){ const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N - 1, i + 1)], tx = b[0] - a[0], tz = b[1] - a[1], l = Math.hypot(tx, tz); nrm.push([tz/l, -tx/l]); }
      const P = (i, s, y) => [pts[i][0] + nrm[i][0]*s*hw, y, pts[i][1] + nrm[i][1]*s*hw];
      for (let i = 0; i < N - 1; i++){
        for (const s of [-1, 1]){
          quadP(gra, P(i, s*1.06, -deep), P(i + 1, s*1.06, -deep), P(i + 1, s*1.06, 1.0), P(i, s*1.06, 1.0));                // substructure walls
          quadP(ls, P(i, s, 5.4), P(i + 1, s, 5.4), P(i + 1, s, 6.4), P(i, s, 6.4));                                          // architrave
          quadP(ls, P(i, s*1.12, 6.4), P(i + 1, s*1.12, 6.4), P(i + 1, s*1.12, 7.2), P(i, s*1.12, 7.2));                      // parapet
          if (i % 2 === 0) { const a = P(i, s*1.07, -deep*0.55), b = P(i + 1, s*1.07, -deep*0.55); const m = [(a[0] + b[0])/2, (a[2] + b[2])/2];
            quadP(B.p(DK), [m[0] - (b[0] - a[0])*0.3, -deep*0.55, m[1] - (b[2] - a[2])*0.3], [m[0] + (b[0] - a[0])*0.3, -deep*0.55, m[1] + (b[2] - a[2])*0.3], [m[0] + (b[0] - a[0])*0.3, -deep*0.55 + 4.2, m[1] + (b[2] - a[2])*0.3], [m[0] - (b[0] - a[0])*0.3, -deep*0.55 + 4.2, m[1] - (b[2] - a[2])*0.3]); } }
        quadP(ls, P(i, -1.06, 1.0), P(i + 1, -1.06, 1.0), P(i + 1, 1.06, 1.0), P(i, 1.06, 1.0));                                // walkway
        quadP(B.p(RF), P(i, -1.12, 6.9), P(i + 1, -1.12, 6.9), P(i + 1, 1.12, 6.9), P(i, 1.12, 6.9));                         // roof
      }
      for (let i = 0; i < N; i++) for (const s of [-1, 1]){ const p = P(i, s*0.92, 0); colP(ls, ID, p[0], p[2], 1.0, 4.4, 0.32, 8, 1.35); }
    };
    const len0 = C => { let s = 0; for (let i = 1; i < C.length; i++) s += Math.hypot(C[i][0] - C[i-1][0], C[i][1] - C[i-1][1]); return s; };
    { const no = resample(GLD.hfo, 40).pts, ni = resample(GLD.hfi, 40).pts, mid = no.map((p, i) => [(p[0] + ni[i][0])/2, (p[1] + ni[i][1])/2]);
      colonnade(GLD.stS.slice().reverse().concat(mid.slice().reverse()).concat(GLD.stN.slice(1)), 2.6, 15);
      colonnade(GLD.tail, 2.4, 12); }
    // ---- Hall of Philosophy and Hall of Languages: buff brick, limestone base and cornice, hipped slate roofs
    for (const R0 of [GLD.ph, GLD.lh]){
      const R = shR(R0, O);
      prismM(gra, ID, offP(R, -0.3), -10, 2.4, false); prismM(br, ID, R, 2.4, 16.6, false); prismM(ls, ID, offP(R, -0.5), 16.6, 17.6, false);
      const Q = offP(R, 4.5); for (let i = 0; i < R.length; i++){ const j = (i + 1) % R.length, Rr = offP(R, -0.5); quadP(B.p(RF), [Rr[i][0], 17.6, Rr[i][1]], [Rr[j][0], 17.6, Rr[j][1]], [Q[j][0], 20.6, Q[j][1]], [Q[i][0], 20.6, Q[i][1]]); }
      capM(B.p(RF), ID, Q, 20.6);
      for (let i = 0; i < R.length; i++){ const E = edgeFrame(R, i); if (E.L < 7) continue; const n = Math.round(E.L/3.4), st = E.L/n;
        for (let k = 0; k < n; k++){ const u = (k + 0.5)*st; for (const y of [3.6, 7.6, 11.6]) quadP(win, E.M(u - 0.7, y, 0.05), E.M(u + 0.7, y, 0.05), E.M(u + 0.7, y + 2.5, 0.05), E.M(u - 0.7, y + 2.5, 0.05)); }
        aboxM(ls, E.M, 0, E.L, 6.9, 7.2, 0, 0.15); } }
    B.flush(g); return g; }};
placeAt('nygould', GLD.A, GLD.O, 0);

// ============================================================================================================================
// nysnugharbor  Sailors' Snug Harbor, Temple Row (Staten Island): the five interlocking Greek Revival buildings on Richmond
//   Terrace — Building C (1833, Minard Lafever; marble front, octastyle Ionic portico on a raised base), Buildings B and D
//   (1840, three-bay stone fronts with broad shallow pediments and small columned entrance porches), Buildings A and E (1879-80, Richard P. Smyth; hexastyle Ionic
//   porticoes), joined by low hyphens. Fronts face the Kill Van Kull (north). Frame: ref nyouter2 / nysnugharbor, origin =
//   Building C's centroid (ref 33.4, -77.3), row frame ry -0.2797 (local +x along the row to the east, -z = the fronts).
const SNG = {A:[40.6437, -74.1025], O:[33.4, -77.3], ry:-0.2797,
  // [x0, x1, zFront(body), z1(back), wallTop, basement, roofRise, portico zCols or 0, kind]
  bld:[[-63.9, -47.6, -16.2, 20.4, 12.2, 2.6, 2.7, -19.5, 'AE'], [-36.8, -20.4, -14.6, 17.3, 11.4, 2.4, 2.4, 0, 'BD'], [-11.6, 11.3, -15.4, 17.5, 14.0, 3.0, 3.4, -19.3, 'C'],
       [22.0, 38.7, -14.2, 19.8, 11.4, 2.4, 2.4, 0, 'BD'], [49.4, 65.9, -16.2, 20.4, 12.2, 2.6, 2.7, -19.5, 'AE']],
  hy:[[-47.7, -36.8, -2.0, 5.4], [-20.4, -11.3, -1.4, 5.4], [11.3, 22.1, -1.4, 5.5], [38.6, 49.5, -1.3, 5.5]]};
LANDMARKS.nysnugharbor = {zh:'水手斯纳格港（神殿排楼）', en:"Sailors' Snug Harbor, Temple Row", cat:'old', r:45, h:19,
  lt:{m:0, c:'#ffe6c4', k:0.75, e:0.55},
  build(){
    const g = new THREE.Group(), B = NBat(), M = FR(0, 0, 0, SNG.ry);
    const WL = '#e7e2d5', MB = '#ece9e1', BS = '#b8b2a5', RF = '#646a6e', COL = '#f3f0e8', TR = '#f5f3ee';
    const WIN = {c:'#2d343b', glow:'#ffd89c', gk:0.55}, DOOR = {c:'#3b3128', glow:'#ffcf88', gk:0.6};
    const bs = B.p(BS), rf = B.p(RF), col = B.p(COL), tr = B.p(TR), win = B.p(WIN);
    for (const [x0, x1, zf, z1, wt, bm, rise, zc, kind] of SNG.bld){
      const wl = B.p(kind === 'C' ? MB : WL), zr = zc ? zc - 0.8 : zf, xm = (x0 + x1)/2, W = x1 - x0;
      aboxM(bs, M, x0, x1, -10, bm, zf, z1); aboxM(wl, M, x0 + 0.1, x1 - 0.1, bm, wt, zf + 0.1, z1 - 0.1);
      // entablature / cornice band, antae
      aboxM(tr, M, x0 - 0.25, x1 + 0.25, wt - 1.0, wt, zr - 0.25, z1 + 0.25);
      for (const x of [x0, x1 - 0.9]) for (const z of [zf, z1 - 0.9]) aboxM(tr, M, x, x + 0.9, bm, wt - 1.0, z - 0.05, z + 0.95);
      // gable roof over body (and portico), pediments front and back
      gableM(rf, M, x0 - 0.3, x1 + 0.3, zr - 0.3, z1 + 0.3, wt, rise, 0);
      for (const z of [zr - 0.32, z1 + 0.32]){ triP(tr, M(x0 - 0.3, wt, z), M(x1 + 0.3, wt, z), M(xm, wt + rise, z));
        aboxM(tr, M, x0 - 0.4, x1 + 0.4, wt - 0.05, wt + 0.25, z - 0.12, z + 0.12); }
      // windows: two storeys on the long sides, back; basement windows
      for (const s of [-1, 1]){ const x = s < 0 ? x0 : x1, n = Math.round((z1 - zf - 3)/3.6), st = (z1 - zf - 3)/n;
        for (let k = 0; k < n; k++){ const z = zf + 1.5 + (k + 0.5)*st, F = (u, v) => M(x + s*0.16, v, u);
          for (const [y, h] of [[bm + 1.0, wt*0.27], [bm + 1.6 + wt*0.33, wt*0.22]]) { quadP(win, F(z - 0.6, y), F(z + 0.6, y), F(z + 0.6, y + h), F(z - 0.6, y + h)); aboxM(tr, M, s < 0 ? x - 0.25 : x, s < 0 ? x : x + 0.25, y + h, y + h + 0.3, z - 0.85, z + 0.85); }
          quadP(win, M(x + s*0.06, 0.7, z - 0.5), M(x + s*0.06, 0.7, z + 0.5), M(x + s*0.06, bm - 0.4, z + 0.5), M(x + s*0.06, bm - 0.4, z - 0.5)); } }
      { const n = Math.max(3, Math.round(W/4)); for (let k = 0; k < n; k++){ const x = x0 + (k + 0.5)*W/n;
          for (const y of [bm + 1.0, bm + 1.6 + wt*0.33]) quadP(win, M(x - 0.6, y, z1 + 0.06), M(x + 0.6, y, z1 + 0.06), M(x + 0.6, y + wt*0.24, z1 + 0.06), M(x - 0.6, y + wt*0.24, z1 + 0.06)); } }
      if (zc){
        // hexastyle Ionic portico on the raised base, steps, doorway
        aboxM(bs, M, x0, x1, -10, bm, zc - 0.9, zf); const n = kind === 'C' ? 8 : 6, sp = (W - 1.6)/(n - 1), r = kind === 'C' ? 0.6 : 0.5;
        for (let k = 0; k < n; k++) colP(col, M, x0 + 0.8 + k*sp, zc, bm, wt - 1.0 - bm, r, 10, 1.5);
        quadP(B.p(DOOR), M(xm - 1.3, bm, zf - 0.05), M(xm + 1.3, bm, zf - 0.05), M(xm + 1.3, bm + 5.0, zf - 0.05), M(xm - 1.3, bm + 5.0, zf - 0.05));
        for (const dx of [-W*0.3, W*0.3]) quadP(win, M(xm + dx - 0.7, bm + 1.0, zf - 0.05), M(xm + dx + 0.7, bm + 1.0, zf - 0.05), M(xm + dx + 0.7, bm + 4.4, zf - 0.05), M(xm + dx - 0.7, bm + 4.4, zf - 0.05));
        const ns = Math.round(bm/0.3); for (let k = 0; k < ns; k++) aboxM(bs, M, xm - W*0.36, xm + W*0.36, -1, bm - k*0.3, zc - 0.9 - (k + 1)*0.32, zc - 0.9 - k*0.32);
      } else {
        // three-bay front with pilasters, door with fanlight, windows
        for (let k = 0; k <= 3; k++){ const x = x0 + 0.45 + k*(W - 0.9)/3; aboxM(tr, M, x - 0.45, x + 0.45, bm, wt - 1.0, zf - 0.25, zf + 0.1); }
        for (let k = 0; k < 3; k++){ const x = x0 + 0.45 + (k + 0.5)*(W - 0.9)/3, F = (u, v, w) => M(u, v, zf - 0.08 - (w || 0));
          if (k === 1){ quadP(B.p(DOOR), F(x - 1.0, bm, 0), F(x + 1.0, bm, 0), F(x + 1.0, bm + 3.6, 0), F(x - 1.0, bm + 3.6, 0)); winArchM(win, F, x, bm + 3.6, 1.0, 1.4, 0, 6); }
          if (k === 1){ for (const dx of [-1.6, 1.6]) colP(col, M, x + dx, zf - 2.4, bm, 4.6, 0.3, 8, 1.4); aboxM(tr, M, x - 2.2, x + 2.2, bm + 4.6, bm + 5.3, zf - 3.0, zf); gableM(rf, M, x - 2.3, x + 2.3, zf - 3.1, zf, bm + 5.3, 1.0, 0); triP(tr, M(x - 2.2, bm + 5.3, zf - 3.12), M(x + 2.2, bm + 5.3, zf - 3.12), M(x, bm + 6.2, zf - 3.12)); }
          else quadP(win, F(x - 0.65, bm + 1.0, 0), F(x + 0.65, bm + 1.0, 0), F(x + 0.65, bm + 3.9, 0), F(x - 0.65, bm + 3.9, 0));
          quadP(win, F(x - 0.65, bm + 5.4, 0), F(x + 0.65, bm + 5.4, 0), F(x + 0.65, bm + 7.6, 0), F(x - 0.65, bm + 7.6, 0)); }
        for (let k = 0; k < 6; k++) aboxM(bs, M, (x0 + x1)/2 - 2.2, (x0 + x1)/2 + 2.2, -1, bm - k*0.4, zf - (k + 1)*0.35, zf - k*0.35); }
    }
    // hyphens: two-storey links with a cornice and a low roof
    for (const [x0, x1, z0, z1] of SNG.hy){
      aboxM(bs, M, x0, x1, -10, 1.2, z0, z1); aboxM(B.p(WL), M, x0, x1, 1.2, 6.4, z0 + 0.1, z1 - 0.1); aboxM(tr, M, x0, x1, 6.4, 7.0, z0 - 0.15, z1 + 0.15); aboxM(rf, M, x0, x1, 7.0, 7.3, z0 + 0.2, z1 - 0.2);
      const n = Math.max(2, Math.round((x1 - x0)/3.2)); for (let k = 0; k < n; k++){ const x = x0 + (k + 0.5)*(x1 - x0)/n;
        for (const z of [z0 + 0.04, z1 - 0.04]) for (const y of [1.9, 4.3]) quadP(win, M(x - 0.55, y, z + (z < 0 ? -0.06 : 0.06)), M(x + 0.55, y, z + (z < 0 ? -0.06 : 0.06)), M(x + 0.55, y + 1.6, z + (z < 0 ? -0.06 : 0.06)), M(x - 0.55, y + 1.6, z + (z < 0 ? -0.06 : 0.06))); } }
    // the front lawn falling to Richmond Terrace (the base sits on the terrace; the 70 m terrain is lower in front)
    { const gl = B.p('#b2d088'); for (let k = 0; k < 6; k++){ const x0 = -66 + k*22.4, x1 = x0 + 22.4; quadP(gl, M(x0, -0.2, -21.5), M(x1, -0.2, -21.5), M(x1, -9.5, -40), M(x0, -9.5, -40)); }
      aboxM(bs, M, -66, 68.4, -10, -0.1, -21.6, -20.4); }
    B.flush(g); return g; }};
placeAt('nysnugharbor', SNG.A, SNG.O, 0);

// ============================================================================================================================
// nycrrnj  Central Railroad of New Jersey Terminal (1889, Peabody & Stearns / William H. Peddle), Liberty State Park: the red-
//   brick Romanesque Revival head house (arched windows, steep slate hipped roof with dormers on the third floor) with the
//   clock tower and cupola in the middle of the waterfront front, the concourse wing along the platform ends, and the 1914
//   Bush train shed (twelve low concrete vaults with smoke slots over 20 tracks, steel columns). Frame: ref nyouter2 /
//   nycrrnj, origin = ref (-250, -40), local frame ry -0.1475 (+x east to the river).
const CRR = {A:[40.707, -74.0337], O:[-250, -40], ry:-0.1475};
LANDMARKS.nycrrnj = {zh:'新泽西中央铁路总站', en:'Central Railroad of New Jersey Terminal', cat:'old', r:165, h:42,
  lt:{m:0, c:'#ffd9ac', k:0.7, e:0.45},
  build(){
    const g = new THREE.Group(), B = NBat(), M = FR(0, 0, 0, CRR.ry);
    const BR = '#8e4a3a', BR2 = '#7a3d30', LS = '#c9b89c', SL = '#4c5156', CU = {c:'#5f8f7f', m:0, lk:0.6}, SH = '#8b8781', SHR = '#6f6b66', ST = '#3f4448', DK = '#2b2f33';
    const WIN = {c:'#2c3238', glow:'#ffd49a', gk:0.6}, CLK = {c:'#efe9d6', glow:'#fff0c8', gk:1.3};
    const br = B.p(BR), br2 = B.p(BR2), ls = B.p(LS), sl = B.p(SL), win = B.p(WIN);
    // ---- head house main block (x 116..156.3, z -40.7..25.9)
    const hx0 = 116.0, hx1 = 156.3, hz0 = -40.7, hz1 = 25.9, WT = 11.5;
    aboxM(ls, M, hx0, hx1, -4, 1.4, hz0, hz1); aboxM(br, M, hx0 + 0.1, hx1 - 0.1, 1.4, WT, hz0 + 0.1, hz1 - 0.1);
    aboxM(ls, M, hx0 - 0.3, hx1 + 0.3, WT - 0.5, WT, hz0 - 0.3, hz1 + 0.3); aboxM(ls, M, hx0 - 0.1, hx1 + 0.1, 5.6, 5.9, hz0 - 0.1, hz1 + 0.1);
    hipM(sl, M, hx0 - 0.5, hx1 + 0.5, hz0 - 0.5, hz1 + 0.5, WT, 9.5);
    winBox(win, M, hx0, hx1, hz0, hz1, ['n', 's', 'e'], [1.8], 1.25, 3.4, 5.4, true);
    winBox(win, M, hx0, hx1, hz0, hz1, ['n', 's', 'e'], [6.6], 1.0, 3.6, 3.6, true);
    // dormers on the roof (third floor): small gabled boxes on each slope
    for (const [s, ax] of [[-1, 'z'], [1, 'z'], [1, 'x']]){
      if (ax === 'z') for (let x = hx0 + 7; x < hx1 - 6; x += 6.5){ const z = s < 0 ? hz0 + 2.4 : hz1 - 2.4, zz = s < 0 ? z - 1.6 : z + 1.6;
        aboxM(br2, M, x - 1.3, x + 1.3, WT + 0.6, WT + 3.4, Math.min(z, zz), Math.max(z, zz)); gableM(sl, M, x - 1.6, x + 1.6, Math.min(z, zz) - 0.2, Math.max(z, zz) + 0.2, WT + 3.4, 1.4, 0);
        quadP(win, M(x - 0.8, WT + 1.0, zz + s*0.05), M(x + 0.8, WT + 1.0, zz + s*0.05), M(x + 0.8, WT + 3.0, zz + s*0.05), M(x - 0.8, WT + 3.0, zz + s*0.05)); }
      else for (let z = hz0 + 7; z < hz1 - 6; z += 6.5){ if (Math.abs(z + 7.4) < 7) continue; const x = hx1 - 2.4, xx = x + 1.6;
        aboxM(br2, M, x, xx, WT + 0.6, WT + 3.4, z - 1.3, z + 1.3); gableXM(sl, M, x - 0.2, xx + 0.2, z - 1.6, z + 1.6, WT + 3.4, 1.4, 0);
        quadP(win, M(xx + 0.05, WT + 1.0, z - 0.8), M(xx + 0.05, WT + 1.0, z + 0.8), M(xx + 0.05, WT + 3.0, z + 0.8), M(xx + 0.05, WT + 3.0, z - 0.8)); } }
    // big arched entrance arcade on the waterfront front (ferry concourse side)
    for (let k = -2; k <= 2; k++){ const z = -7.4 + k*5.6; if (k === 0) continue; winArchM(B.p(DK), (u, v, w) => M(hx1 + 0.08 + w, v, u), z, 0.0, 1.9, 6.0, 0, 8); }
    // ---- the clock tower (centred on the waterfront front)
    { const tz = -7.4, tx = hx1 - 2.5, th = 4.4, F = (u, v, w) => M(tx + u, v, tz + w);
      aboxM(br, F, -th, th, 0, 31.5, -th, th); aboxM(ls, F, -th - 0.25, th + 0.25, 0, 1.6, -th - 0.25, th + 0.25);
      for (const y of [11.2, 21.0, 31.5]) aboxM(ls, F, -th - 0.2, th + 0.2, y - 0.5, y, -th - 0.2, th + 0.2);
      for (let s = 0; s < 4; s++){ const c = [[1, 0], [0, 1], [-1, 0], [0, -1]][s], R = (u, v, w) => F(u*c[0] - w*c[1], v, u*c[1] + w*c[0]);
        discM(ls, (u, v, w) => R(u, v, -th - w), 0, 24.4, 0, 0.3, 2.3, 20); discM(B.p(CLK), (u, v, w) => R(u, v, -th - w), 0, 24.4, 0.3, 0.4, 2.0, 20);
        for (const u of [-1.6, 1.6]) winArchM(B.p(DK), (uu, v, w) => R(uu, v, -th - 0.05), u, 27.6, 0.8, 3.4, 0, 6);
        winArchM(win, (uu, v, w) => R(uu, v, -th - 0.05), 0, 13.0, 0.9, 4.5, 0, 6); winArchM(win, (uu, v, w) => R(uu, v, -th - 0.05), 0, 2.0, 2.0, 6.5, 0, 8); }
      pyrM(sl, F, -th - 0.5, th + 0.5, -th - 0.5, th + 0.5, 31.5, 6.2, 2.0, 2.0);
      aboxM(B.p(CU), F, -1.7, 1.7, 37.7, 39.6, -1.7, 1.7); for (const sx of [-1, 1]) for (const sz of [-1, 1]) aboxM(ls, F, sx*1.7 - 0.25, sx*1.7 + 0.25, 37.7, 39.6, sz*1.7 - 0.25, sz*1.7 + 0.25);
      pyrM(B.p(CU), F, -2.1, 2.1, -2.1, 2.1, 39.6, 2.0, 2.1, 2.1); cylM(B.p(ST), ID, 0.06, 0.04, 41.6, 43.0, F(0, 0, 0)[0], F(0, 0, 0)[2], 4); }
    // ---- concourse wing along the platform ends (x 97.5..116, z -54.7..57.9)
    { const x0 = 97.5, x1 = 116.0, z0 = -54.7, z1 = 57.9;
      aboxM(ls, M, x0, x1, -4, 1.0, z0, z1); aboxM(br, M, x0 + 0.1, x1, 1.0, 9.0, z0 + 0.1, z1 - 0.1); aboxM(ls, M, x0 - 0.3, x1, 8.6, 9.0, z0 - 0.3, z1 + 0.3);
      gableM(sl, M, x0 - 0.4, x1 + 0.2, z0 - 0.4, z1 + 0.4, 9.0, 5.2, 0);
      winBox(win, M, x0, x1, z0, z1, ['n', 's'], [1.6], 1.3, 5.0, 5.0, true);
      for (let z = z0 + 4; z < z1 - 3; z += 4.6) winArchM(win, (u, v, w) => M(x0 - 0.06, v, u), z, 2.0, 1.4, 5.4, 0, 6);
      // a skylight strip along the ridge
      aboxM(B.p({c:'#9aa9ad', glow:'#ffe2b0', gk:0.4}), M, x0 + 7.4, x1 - 7.6, 13.4, 14.4, z0 + 4, z1 - 4); }
    // ---- the Bush train shed: 12 bays (2 tracks each), concrete vaults with smoke slots, steel columns
    const sx0 = -152.2, sx1 = 97.5, sz0 = -57.5, sz1 = 58.0, nb = 12, bw = (sz1 - sz0)/nb, sh = B.p(SH), shr = B.p(SHR), st = B.p(ST);
    for (let k = 0; k < nb; k++){
      const za = sz0 + k*bw, zb = za + bw, zm = (za + zb)/2, xa = zb > 35.5 ? -110.9 : sx0;
      const prof = []; for (let i = 0; i <= 5; i++){ const t = i/5; prof.push([lerp(za, zm - 0.7, t), 5.2 + 1.5*Math.sin(t*HP)]); }
      const prof2 = []; for (let i = 0; i <= 5; i++){ const t = i/5; prof2.push([lerp(zb, zm + 0.7, t), 5.2 + 1.5*Math.sin(t*HP)]); }
      for (const P of [prof, prof2]) for (let i = 0; i < 5; i++) quadP(sh, M(xa, P[i][1], P[i][0]), M(sx1, P[i][1], P[i][0]), M(sx1, P[i+1][1], P[i+1][0]), M(xa, P[i+1][1], P[i+1][0]));
      aboxM(shr, M, xa, sx1, 6.75, 6.95, zm - 1.2, zm + 1.2);                                      // smoke-slot hood
      for (let x = xa + 5; x < sx1; x += 10.4){ aboxM(st, M, x - 0.2, x + 0.2, -4.5, 6.75, zm - 0.95, zm - 0.7); aboxM(st, M, x - 0.2, x + 0.2, -4.5, 6.75, zm + 0.7, zm + 0.95); }
      for (let x = xa + 10.4; x < sx1; x += 10.4) cylM(st, ID, 0.22, 0.22, -4.5, 5.2, ...((p) => [p[0], p[2]])(M(x, 0, za)), 6);
      // platform (low) under the bay centre
      aboxM(B.p('#9c978d'), M, xa, sx1, -4.5, 0.9, zm - 2.2, zm + 2.2);
    }
    aboxM(shr, M, sx0, sx1, 4.6, 5.3, sz0 - 0.4, sz0); aboxM(shr, M, -110.9, sx1, 4.6, 5.3, sz1, sz1 + 0.4); aboxM(shr, M, sx0, -110.9, 4.6, 5.3, 34.9, 35.3);
    aboxM(shr, M, sx0 - 0.4, sx0, 4.6, 5.3, sz0, 35.3); aboxM(shr, M, -111.3, -110.9, 4.6, 5.3, 35.3, sz1);
    B.flush(g); return g; }};
placeAt('nycrrnj', CRR.A, CRR.O, 0);

// ============================================================================================================================
// nynewarkcath  Cathedral Basilica of the Sacred Heart, Newark (1899-1954, French Gothic Revival, Rockport granite): the west
//   front with the two 71 m towers (belfry lancets, pierced parapets, corner pinnacles), three portals, the great rose window
//   and the gable; the nave with aisles, buttresses and flying buttresses, the green copper roofs; the 50 m transept with its
//   rose windows; the choir and the apse with the ambulatory chapels; the sacristy wing behind (on the OSM footprint). Respectful
//   architecture only. Frame: ref nyouter2_1 / nynewarkcath (anchor re-made on the cathedral), origin = mid-nave (ref
//   30.76, -71.87; the facade centre is 67 m in front), local frame ry -0.3812: x across, +z = out of the west front, -z = towards the apse (NNE).
const NWK = {A:[40.7544, -74.1787], O:[30.76, -71.87], ry:-0.3812, dz:67};
LANDMARKS.nynewarkcath = {zh:'圣心主教座堂（纽瓦克）', en:'Cathedral Basilica of the Sacred Heart, Newark', cat:'old', r:80, h:71,
  lt:{m:0, c:'#ffe2b8', k:0.85, e:0.45},
  build(){
    const g = new THREE.Group(), B = NBat(), R0 = FR(0, 0, 0, NWK.ry), M = (x, y, z) => R0(x, y, z + NWK.dz);
    const GR = '#c3baa8', GR2 = '#b1a896', TR = '#d6cfbf', CU = {c:'#5f8f7c', m:0, lc:'#ffe2b8', lk:0.5}, DK = '#2a2e35';
    const SG = {c:'#2b3346', glow:'#ffcb8a', gk:0.55}, ROSE = {c:'#37304a', glow:'#ff9f70', gk:0.75};
    const gr = B.p(GR), gr2 = B.p(GR2), tr = B.p(TR), cu = B.p(CU), sg = B.p(SG), rose = B.p(ROSE), dk = B.p(DK);
    const pinn = (x, y, z, r, h) => { latheM(tr, M, [[0, y], [r, y], [r, y + h*0.35], [r*0.82, y + h*0.38], [r*0.05, y + h], [0, y + h]], x, z, 6); };
    // Gothic window on a face given by a frame F(u, v) (flat)
    const NZ0 = -5.8, NZ1 = -62, TZ0 = -62, TZ1 = -92, CZ1 = -105, AW = 15.5, CW = 7.8, AH = 15.5, CH = 33, RH = 43;
    // ---- nave + choir: aisles, clerestory, roofs
    aboxM(gr, M, -AW, AW, -6, AH, NZ1, NZ0);  aboxM(gr, M, -AW, AW, -6, AH, CZ1, TZ1);
    aboxM(gr, M, -CW, CW, AH, CH, CZ1, NZ0);
    for (const s of [-1, 1]){ for (const [z0, z1] of [[NZ1, NZ0], [CZ1, TZ1]]){
        quadP(cu, M(s*(AW + 0.4), AH - 0.2, z0), M(s*(AW + 0.4), AH - 0.2, z1), M(s*CW, AH + 5.0, z1), M(s*CW, AH + 5.0, z0)); } }
    gableM(cu, M, -CW - 0.4, CW + 0.4, CZ1, NZ0 + 0.3, CH, RH - CH, 0);
    aboxM(tr, M, -CW - 0.3, CW + 0.3, CH - 0.6, CH, CZ1, NZ0); aboxM(tr, M, -AW - 0.3, AW + 0.3, AH - 0.6, AH, NZ1, NZ0); aboxM(tr, M, -AW - 0.3, AW + 0.3, AH - 0.6, AH, CZ1, TZ1);
    // bays: aisle windows, clerestory windows, buttresses, flyers, pinnacles
    const bays = []; for (let z = NZ0 - 3.4; z > NZ1 + 2; z -= 6.4) bays.push(z); for (let z = TZ1 - 3.2; z > CZ1 + 1; z -= 6.4) bays.push(z);
    for (const s of [-1, 1]) for (const z of bays){
      const Fa = (u, v) => M(s*(AW + 0.06), v, u), Fc = (u, v) => M(s*(CW + 0.06), v, u);
      gothWin(sg, Fa, z, 3.2, 1.3, 9.6, 4); gothWin(sg, Fc, z, AH + 5.6, 1.6, 10.6, 4);
      const bz = z - 3.2;
      aboxM(gr2, M, s > 0 ? AW : -AW - 2.4, s > 0 ? AW + 2.4 : -AW, -6, AH + 6.5, bz - 0.8, bz + 0.8);
      pinn(s*(AW + 1.2), AH + 6.5, bz, 0.75, 5.2);
      segP(gr2, M(s*(AW + 1.0), AH + 5.2, bz), M(s*(CW + 0.3), CH - 3.5, bz), 0.42, 4);
      segP(gr2, M(s*(AW + 1.0), AH + 3.0, bz), M(s*(CW + 0.3), CH - 6.5, bz), 0.3, 4);
      aboxM(gr2, M, s > 0 ? CW : -CW - 0.7, s > 0 ? CW + 0.7 : -CW, AH, CH + 0.5, bz - 0.5, bz + 0.5); }
    // ---- transept: arms to +-25.5 with gable ends, rose windows, portals
    const TW = 25.5;
    aboxM(gr, M, -TW, TW, -6, CH, TZ1, TZ0);
    gableXM(cu, M, -TW - 0.3, TW + 0.3, TZ1 - 0.4, TZ0 + 0.4, CH, RH - CH, 0);
    aboxM(tr, M, -TW - 0.3, TW + 0.3, CH - 0.6, CH, TZ1 - 0.3, TZ0 + 0.3);
    for (const s of [-1, 1]){
      const F = (u, v, w) => M(s*(TW + (w || 0)), v, -u), zc = (TZ0 + TZ1)/2;           // u along -z
      triP(gr, F(-TZ0, CH, 0), F(-TZ1, CH, 0), F(-zc, RH, 0));
      discM(tr, (u, v, w) => F(u, v, w), -zc, 22.5, 0, 0.35, 5.6, 24); discM(rose, (u, v, w) => F(u, v, w), -zc, 22.5, 0.35, 0.45, 4.9, 24);
      for (let k = 0; k < 12; k++){ const a = k/12*TAU; segP(tr, F(-zc, 22.5, 0.5), F(-zc + Math.cos(a)*4.9, 22.5 + Math.sin(a)*4.9, 0.5), 0.13, 3); }
      for (let k = -2; k <= 2; k++) gothWin(sg, (u, v) => F(u, v, 0.08), -zc + k*2.3, 12.0, 0.8, 4.8, 3);
      gothWin(dk, (u, v) => F(u, v, 0.08), -zc, 0, 2.2, 8.0, 5);
      for (const zz of [TZ0, TZ1]){ aboxM(gr2, M, s > 0 ? TW - 1.6 : -TW - 0.8, s > 0 ? TW + 0.8 : -TW + 1.6, -6, CH + 3.5, zz - 1.2 + (zz === TZ0 ? -0.8 : 0.8), zz + 1.2 + (zz === TZ0 ? -0.8 : 0.8)); pinn(s*(TW - 0.4), CH + 3.5, zz + (zz === TZ0 ? -0.8 : 0.8), 0.9, 6.5); } }
    // ---- apse: ambulatory with chapels (low), clerestory half-round, conical copper roofs
    { const NA = 10, Ra = AW, Rc = CW;
      for (let i = 0; i < NA; i++){ const a0 = PI + PI*i/NA, a1 = PI + PI*(i + 1)/NA, am = (a0 + a1)/2;
        const P = (r, a, y) => M(Math.cos(a)*r, y, CZ1 + Math.sin(a)*r);
        quadP(gr, P(Ra, a0, -6), P(Ra, a1, -6), P(Ra, a1, AH), P(Ra, a0, AH)); quadP(gr, P(Rc, a0, AH), P(Rc, a1, AH), P(Rc, a1, CH), P(Rc, a0, CH));
        quadP(cu, P(Ra + 0.4, a0, AH - 0.2), P(Ra + 0.4, a1, AH - 0.2), P(Rc, a1, AH + 5), P(Rc, a0, AH + 5));
        triP(cu, P(Rc + 0.3, a0, CH), P(Rc + 0.3, a1, CH), M(0, RH, CZ1));
        const Fw = (u, v) => { const r = Ra + 0.06, t = am + u/r; return P(r, t, v); }, Fc2 = (u, v) => { const r = Rc + 0.06, t = am + u/r; return P(r, t, v); };
        gothWin(sg, Fw, 0, 3.2, 1.2, 9.0, 3); gothWin(sg, Fc2, 0, AH + 5.6, 0.95, 10.2, 3);
        const b = P(Ra, a0, 0); aboxM(gr2, FR(b[0], 0, b[2], NWK.ry - a0 + HP), -0.7, 0.7, -6, AH + 5.0, -0.2, 2.2);
        segP(gr2, P(Ra + 1.2, a0, AH + 4.0), P(Rc + 0.3, a0, CH - 4.0), 0.35, 4); }
      capM(cu, ID, (() => { const R = []; for (let i = 0; i <= NA; i++){ const p = M(Math.cos(PI + PI*i/NA)*Rc, 0, CZ1 + Math.sin(PI + PI*i/NA)*Rc); R.push([p[0], p[2]]); } return R; })(), CH); }
    // ---- west front: centre section with portals, rose window, gallery, gable
    const FZ = 5.0, Ff = (u, v) => M(u, v, FZ + 0.06);
    aboxM(gr, M, -9.3, 9.3, -6, CH + 1.0, NZ0, FZ);
    triP(gr, M(-9.3, CH + 1.0, FZ), M(9.3, CH + 1.0, FZ), M(0, RH + 0.5, FZ));
    aboxM(tr, M, -9.4, 9.4, CH + 0.4, CH + 1.4, FZ - 0.6, FZ + 0.4);
    gothWin(dk, (uu, v) => M(uu, v, FZ + 1.7), 0, 0, 3.6, 13.5, 6); for (let k = 1; k <= 3; k++) gothWin(tr, (uu, v) => M(uu, v, FZ + 0.06 + (4 - k)*0.4), 0, 0, 3.6 + k*0.55, 13.5 + k*0.95, 6);
    aboxM(tr, M, -6.0, 6.0, -1, 0.5, FZ, FZ + 4.5);
    pinn(0, RH + 0.3, FZ - 0.4, 0.7, 4.0);
    // gable over the central portal
    triP(tr, M(-5.4, 12.5, FZ + 1.5), M(5.4, 12.5, FZ + 1.5), M(0, 20.0, FZ + 1.5));
    discM(tr, (u, v, w) => M(u, v, FZ + w), 0, 26.0, 0, 0.5, 6.4, 28); discM(rose, (u, v, w) => M(u, v, FZ + w), 0, 26.0, 0.5, 0.6, 5.5, 28);
    for (let k = 0; k < 16; k++){ const a = k/16*TAU; segP(tr, M(0, 26, FZ + 0.65), M(Math.cos(a)*5.5, 26 + Math.sin(a)*5.5, FZ + 0.65), 0.12, 3); }
    latheM(tr, (x, y, z) => M(x, z, FZ + 0.7 - y), [[0, -0.05], [1.4, -0.05], [1.4, 0.1], [0, 0.1]], 0, 26, 12);
    for (let k = -3; k <= 3; k++) gothWin(sg, Ff, k*2.4, 17.6, 0.85, 3.4, 3);                          // gallery
    // ---- the two towers (x = +-15, square 11.5 m) with angle buttresses, belfry, pierced parapet, pinnacles
    for (const s of [-1, 1]){
      const tx = s*15, th = 5.75, F = (u, v, w) => M(tx + u, v, w);
      aboxM(gr, F, -th, th, -6, 62.0, -th, th);
      for (const bx of [-1, 1]) for (const bz of [-1, 1]){         const cxw = M(tx + bx*th, 0, bz*th), A = FR(cxw[0], 0, cxw[2], NWK.ry + (bx*bz > 0 ? PI/4 : -PI/4));
        aboxM(gr2, A, -0.8, 0.8, -6, 44, -1.8, 1.8); aboxM(gr2, A, -0.65, 0.65, 44, 58, -1.2, 1.2); }
      for (const y of [16.0, 30.5, 44.0]) aboxM(tr, F, -th - 0.3, th + 0.3, y - 0.6, y, -th - 0.3, th + 0.3);
      for (let f = 0; f < 4; f++){ const c = [[1, 0], [0, 1], [-1, 0], [0, -1]][f], R = (u, v, w) => F(u*c[0] - w*c[1], v, u*c[1] + w*c[0]), Fo = (u, v) => R(u, v, -th - 0.06);
        for (const u of [-1.9, 1.9]) gothWin(dk, Fo, u, 46.0, 1.25, 13.0, 5);
        for (const u of [-1.9, 1.9]) aboxM(tr, R, u - 1.5, u + 1.5, 45.6, 46.0, -th - 0.3, -th);
        gothWin(sg, Fo, 0, 33.0, 1.0, 8.5, 4); gothWin(sg, Fo, 0, 18.5, 0.9, 7.0, 4);
        // pierced parapet: posts and rail
        for (let k = 0; k <= 8; k++){ const u = -th + k*th/4; aboxM(tr, R, u - 0.12, u + 0.12, 62.0, 64.0, -th - 0.1, -th + 0.2); }
        aboxM(tr, R, -th, th, 63.8, 64.3, -th - 0.15, -th + 0.25); aboxM(tr, R, -th - 0.3, th + 0.3, 61.4, 62.0, -th - 0.3, -th + 0.3); }
      if (s < 0) gothWin(dk, (u, v) => M(u, v, th + 0.06), tx, 0, 2.2, 9.6, 5); else gothWin(dk, (u, v) => M(u, v, th + 0.06), tx, 0, 2.2, 9.6, 5);
      aboxM(B.p(GR2), F, -th + 0.6, th - 0.6, 62.0, 62.6, -th + 0.6, th - 0.6);
      for (const bx of [-1, 1]) for (const bz of [-1, 1]){ pinn(tx + bx*(th - 0.3), 58.0, bz*(th - 0.3), 1.0, 13.0); }
      for (let f = 0; f < 4; f++){ const c = [[1, 0], [0, 1], [-1, 0], [0, -1]][f]; pinn(tx + c[1]*0*th + (f === 1 ? th - 0.2 : f === 3 ? -th + 0.2 : 0), 64.0, f === 0 ? -th + 0.2 : f === 2 ? th - 0.2 : 0, 0.45, 4.0); }
    }
    // ---- sacristy / rectory wing behind the apse (on the OSM footprint)
    { const x0 = -26.7, x1 = -8.8, z0 = -140, z1 = -112.7;
      aboxM(gr, M, x0, x1, -6, 12.0, z0, z1); aboxM(tr, M, x0 - 0.2, x1 + 0.2, 11.4, 12.0, z0 - 0.2, z1 + 0.2); gableM(cu, M, x0 - 0.3, x1 + 0.3, z0 - 0.3, z1 + 0.3, 12.0, 4.5, 0);
      winBox(sg, M, x0, x1, z0, z1, ['w', 'e', 'n'], [2.0, 6.6], 0.7, 3.0, 3.6, true); }
    B.flush(g); return g; }};
placeAt('nynewarkcath', NWK.A, NWK.O, 0);

// ============================================================================================================================
// nylsc  Liberty Science Center (1993, expanded 2007), Liberty State Park, Jersey City: the angular four-storey exhibition
//   building in banded precast and glass, the glazed entrance hall, the big round drum and shallow dome of the planetarium
//   (the old IMAX dome theatre, 30 m), the 52 m observation tower (banded shaft, the glass pyramid event space on top).
//   Frame: ref nyouter2 / nylsc, origin = footprint centroid (ref 56.6, 18.4), rot 0.
const LSC = {A:[40.7084, -74.0553], O:[56.6, 18.4],
  ring:[[-0.9,60.4],[17.2,53.2],[0.1,10.2],[25.4,0.1],[24.7,-1.7],[43.7,-9.2],[37.6,-26.9],[37.2,-30.2],[37.5,-33.7],[38.5,-37.0],[40.2,-40.1],[42.6,-42.8],[45.3,-44.8],[48.2,-46.2],[51.4,-47.0],[54.9,-47.1],[58.7,-46.5],[61.8,-45.2],[64.4,-43.5],[66.8,-41.1],[68.5,-38.6],[76.4,-22.1],[94.5,-29.3],[95.8,-26.0],[104.4,-29.4],[105.5,-26.5],[112.4,-23.5],[109.4,-16.8],[111.8,-10.9],[118.7,-7.8],[115.7,-1.1],[116.9,2.0],[108.8,5.2],[110.0,8.3],[106.7,9.6],[110.6,19.3],[86.6,28.9],[88.7,34.2],[89.9,33.8],[97.1,51.8],[79.6,58.8],[72.8,41.8],[44.9,52.9],[58.4,86.8],[34.5,96.3],[20.8,61.9],[2.6,69.1]],
  dome:[53.4, -30.5, 16.3], tower:[38.5, -1.0, 3.8]};
LANDMARKS.nylsc = {zh:'自由科学中心', en:'Liberty Science Center', cat:'new', r:84, h:56,
  lt:{m:0, c:'#e8eeff', k:0.5, e:0.5},
  build(){
    const g = new THREE.Group(), B = NBat(), O = LSC.O;
    const PC = '#c8bcab', PC2 = '#b3a795', BRK = '#94584a', RF = '#8a8985', DOM = {c:'#d9dad6', m:0, lc:'#cfe0ff', lk:0.5}, ST = '#5b6066', WHT = '#e4e5e2';
    const GL = {c:'#5f7a88', glow:'#ffe4b8', gk:0.65}, GLC = {c:'#8fb0c0', glow:'#dfeeff', gk:0.9};
    const pc = B.p(PC), pc2 = B.p(PC2), gl = B.p(GL), rf = B.p(RF);
    const R = shR(LSC.ring, O);
    // ---- the exhibition building: brick base band, precast walls with ribbon windows, parapet, roof
    prismM(B.p(BRK), ID, R, -5, 3.6, false); prismM(pc, ID, R, 3.6, 17.0, false); prismM(pc2, ID, offP(R, -0.3), 17.0, 18.0, false); capM(rf, ID, R, 17.9);
    for (let i = 0; i < R.length; i++){ const E = edgeFrame(R, i); if (E.L < 4) continue;
      for (const [y0, y1] of [[1.0, 3.0], [5.2, 7.0], [9.4, 11.2], [13.6, 15.4]]) quadP(gl, E.M(0.5, y0, 0.05), E.M(E.L - 0.5, y0, 0.05), E.M(E.L - 0.5, y1, 0.05), E.M(0.5, y1, 0.05));
      for (const y of [4.6, 8.8, 13.0]) aboxM(pc2, E.M, 0, E.L, y - 0.2, y + 0.2, 0, 0.25); }
    // atrium roof light and rooftop plant
    { const cx = 62 - O[0], cz = 8 - O[1]; aboxM(B.p(GLC), ID, cx - 9, cx + 9, 17.9, 21.0, cz - 7, cz + 7); for (let k = -4; k <= 4; k++) aboxM(B.p(ST), ID, cx + k*2 - 0.08, cx + k*2 + 0.08, 17.9, 21.1, cz - 7.1, cz + 7.1);
      aboxM(B.p(PC2), ID, 90 - O[0], 102 - O[0], 17.9, 21.0, -14 - O[1], -2 - O[1]); }
    // ---- glazed entrance hall on the south-west arm (the 2007 front)
    { const a = [0.1 - O[0], 10.2 - O[1]], b = [25.4 - O[0], 0.1 - O[1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0])/L, uz = (b[1] - a[1])/L, nx = -uz, nz = ux;   // outward = north-west
      const F = (u, v, w) => [a[0] + ux*u + nx*w, v, a[1] + uz*u + nz*w];
      aboxM(B.p(GLC), F, 1.0, L - 1.0, 0, 13.5, -0.3, 0.6);
      for (let k = 0; k <= 9; k++){ const u = 1 + k*(L - 2)/9; aboxM(B.p(ST), F, u - 0.12, u + 0.12, 0, 13.5, 0.5, 0.8); }
      for (const y of [4.5, 9.0, 13.5]) aboxM(B.p(ST), F, 1.0, L - 1.0, y - 0.12, y + 0.12, 0.5, 0.8);
      aboxM(B.p(WHT), F, -1.0, L + 1.0, 13.5, 14.3, -0.5, 4.0); }
    // ---- planetarium: drum and shallow dome with panel ribs
    { const [x, z, r] = LSC.dome, cx = x - O[0], cz = z - O[1];
      cylM(pc2, ID, r + 0.4, r + 0.4, -3, 19.0, cx, cz, 36); cylM(B.p(BRK), ID, r + 0.5, r + 0.5, -5, 3.6, cx, cz, 36);
      const prof = []; for (let i = 0; i <= 8; i++){ const t = i/8*HP; prof.push([Math.cos(t)*r, 19.0 + Math.sin(t)*8.6]); }
      latheM(B.p(DOM), ID, prof, cx, cz, 36);
      for (let k = 0; k < 18; k++){ const a = k/18*TAU; for (let i = 0; i < 8; i++) segP(B.p(PC2), [cx + Math.cos(a)*(prof[i][0] + 0.05), prof[i][1], cz + Math.sin(a)*(prof[i][0] + 0.05)], [cx + Math.cos(a)*(prof[i+1][0] + 0.05), prof[i+1][1], cz + Math.sin(a)*(prof[i+1][0] + 0.05)], 0.09, 3); }
      for (const t of [0.3, 0.6]) latheM(B.p(PC2), ID, [[Math.cos(t*HP)*r + 0.1, 19 + Math.sin(t*HP)*8.6 - 0.1], [Math.cos(t*HP)*r + 0.15, 19 + Math.sin(t*HP)*8.6], [Math.cos(t*HP)*r + 0.1, 19 + Math.sin(t*HP)*8.6 + 0.1]], cx, cz, 36); }
    // ---- the observation tower (Robert Wood Johnson III Tower): banded shaft with glazed slots, the glass pyramid event space
    { const [x, z, h] = LSC.tower, cx = x - O[0], cz = z - O[1], F = (u, v, w) => [cx + u, v, cz + w], GP = B.p({c:'#9fc0cf', glow:'#ffe9c8', gk:1.0}), st = B.p(ST);
      aboxM(pc, F, -h, h, -5, 39.6, -h, h);
      for (let y = 6; y < 39; y += 6) aboxM(pc2, F, -h - 0.15, h + 0.15, y - 0.3, y, -h - 0.15, h + 0.15);
      for (let s = 0; s < 4; s++){ const c = [[1, 0], [0, 1], [-1, 0], [0, -1]][s], Rr = (u, v, w) => F(u*c[0] - w*c[1], v, u*c[1] + w*c[0]);
        for (const u of [-1.6, 1.6]) quadP(gl, Rr(u - 0.4, 18, -h - 0.05), Rr(u + 0.4, 18, -h - 0.05), Rr(u + 0.4, 38.5, -h - 0.05), Rr(u - 0.4, 38.5, -h - 0.05)); }
      const P = 6.4;
      aboxM(pc2, F, -P - 0.4, P + 0.4, 39.6, 40.6, -P - 0.4, P + 0.4);
      pyrM(GP, F, -P, P, -P, P, 40.6, 11.0, P, P);
      for (let s = 0; s < 4; s++){ const c = [[1, 0], [0, 1], [-1, 0], [0, -1]][s], Rr = (u, v, w) => F(u*c[0] - w*c[1], v, u*c[1] + w*c[0]);
        for (let k = 0; k <= 6; k++){ const u = -P + k*2*P/6; segP(st, Rr(u, 40.6, -P - 0.02), Rr(0, 51.6, -0.02), 0.07, 3); }
        for (const t of [0.33, 0.66]){ const y = 40.6 + 11*t, q = P*(1 - t); segP(st, Rr(-q, y, -q - 0.03), Rr(q, y, -q - 0.03), 0.07, 3); } }
      cylM(st, ID, 0.1, 0.05, 51.6, 55.0, cx, cz, 5);
      latheM(B.p({c:'#c22', glow:'#ff2a1a', gk:2}), ID, [[0, 55.0], [0.25, 55.1], [0, 55.4]], cx, cz, 6); }
    B.flush(g); return g; }};
placeAt('nylsc', LSC.A, LSC.O, 0);

}
