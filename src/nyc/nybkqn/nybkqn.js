// ===== nyc/nybkqn: New York landmarks in Brooklyn and Long Island City (City Brush v32, New York 1:1).
// nybkborohall   Brooklyn Borough Hall (1848, Greek Revival marble, Ionic portico, the 1898 cupola)
// nybktower      The Brooklyn Tower (2022, 327 m, black-bronze fluted hexagon) on the Dime Savings Bank (1908/1932, domed)
// nydomino       Domino Sugar Refinery (1884 brick shell, the 2023 glass vault, the stack) and Domino Park artifacts
// nycarousel     Jane's Carousel (1922 carousel in Jean Nouvel's 2011 clear pavilion, Brooklyn Bridge Park)
// nygreenwood    Green-Wood Cemetery main gate (Richard Upjohn, 1861, brownstone Gothic Revival) - architecture only
// nyboathouse    Prospect Park Boathouse (1905, white terracotta, the arcade on the Lullwater)
// nykingstheatre Kings Theatre (1929 French Renaissance movie palace, Flatbush Ave) - marquee and blade sign without letters
// nyarmyterminal Brooklyn Army Terminal (Cass Gilbert 1919, Buildings A and B, the skylit atrium, the bridges)
// ny1courtsq     One Court Square (1990, 205 m, green glass, the stepped pyramidal top)
// nyskylinetower Skyline Tower (2021, 237 m, 3 Court Square)
// nygantry, nygantry_b  Gantry Plaza State Park: the two restored 1925 transfer-bridge gantries and their piers (no letters)
// All fitted to the real OSM footprints (nyc/ref_nybkqn*.json). No text, logos or signage anywhere. Block-scoped: only
// LANDMARKS and SG_PLACES are touched.
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

// ---- nybkqn extras
// flat polygon [[u, v], ...] in a frame at depth w (window recesses, arches, gables)
function polyFaceM(o, M, pts, w){ const pp = area2(pts) > 0 ? pts : pts.slice().reverse();
  const tr = THREE.ShapeUtils.triangulateShape(pp.map(p => new THREE.Vector2(p[0], p[1])), []);
  for (const t of tr) triP(o, M(pp[t[0]][0], pp[t[0]][1], w), M(pp[t[1]][0], pp[t[1]][1], w), M(pp[t[2]][0], pp[t[2]][1], w)); }
// extruded plate of a polygon [[u, v]] between depths w0 and w1 (frame u, v, w)
function plateM(o, M, pts, w0, w1){ polyFaceM(o, M, pts, w0); polyFaceM(o, M, pts, w1);
  for (let i = 0; i < pts.length; i++){ const a = pts[i], b = pts[(i+1) % pts.length]; quadP(o, M(a[0], a[1], w0), M(b[0], b[1], w0), M(b[0], b[1], w1), M(a[0], a[1], w1)); } }
// pointed (Gothic) arch outline: half-width hw, springing at vs, apex at vs + ha
const gothA = (x, hw, v0, vs, ha, n) => { n = n || 5; const R = (hw*hw + ha*ha)/(2*hw), tm = Math.asin(Math.min(1, ha/R)), P = [[x - hw, v0], [x + hw, v0]];
  for (let i = 0; i < n; i++){ const t = tm*i/n; P.push([x + hw - R + R*Math.cos(t), vs + R*Math.sin(t)]); }
  P.push([x, vs + ha]);
  for (let i = n - 1; i >= 0; i--){ const t = tm*i/n; P.push([x - hw + R - R*Math.cos(t), vs + R*Math.sin(t)]); }
  return P; };
// round arch outline (semicircle head)
const roundA = (x, hw, v0, vs, n) => { n = n || 8; const P = [[x - hw, v0], [x + hw, v0]]; for (let i = 0; i <= n; i++){ const a = PI*i/n; P.push([x + hw*Math.cos(a), vs + hw*Math.sin(a)]); } return P; };
// notched square ring: half size H, face half-length f, steps of s (for One Court Square)
function notchSq(H, f, s){ const n = Math.round((H - f)/s);
  // build symmetric ring explicitly: quadrant corner path from (f, -H) to (H, -f)
  const C = [[f, -H]]; let x = f, z = -H; for (let k = 0; k < n; k++){ z += s; C.push([x, z]); x += s; C.push([x, z]); }
  const out = []; const rot = (p, q) => q === 0 ? p : q === 1 ? [-p[1], p[0]] : q === 2 ? [-p[0], -p[1]] : [p[1], -p[0]];
  for (let q = 0; q < 4; q++) for (const p of C) out.push(rot(p, q));
  return out; }
// zig-zag pleated version of a ring: each edge split into ~step-long pleats pushed out by dep at the middle
function pleat(P, step, dep){ const s = area2(P) > 0 ? 1 : -1, out = [];
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], L = Math.hypot(ex, ez), n = Math.max(1, Math.round(L/step));
    const nx = ez/L*s, nz = -ex/L*s;   // outward for CCW in x-z with area2 > 0 ... checked by sign
    for (let k = 0; k < n; k++){ const t0 = k/n, tm = (k + 0.5)/n; out.push([a[0] + ex*t0, a[1] + ez*t0]); out.push([a[0] + ex*tm + nx*dep, a[1] + ez*tm + nz*dep]); } }
  return out; }
// horizontal outward strip on a ring at height y (floor bands), protruding by p, thickness t
function bandRing(o, ring, y, t, p){ const R = p ? offP(ring, -p) : ring; wallsM(o, ID, R, y, y + t); }
const toward = (P, c, d) => P.map(p => { const dx = p[0] - c[0], dz = p[1] - c[1], L = Math.hypot(dx, dz) || 1; return [p[0] - dx/L*d, p[1] - dz/L*d]; });
const cenP = P => { let x = 0, z = 0; for (const p of P){ x += p[0]; z += p[1]; } return [x/P.length, z/P.length]; };
const AVL = {c:'#b02020', glow:'#ff2a1a', gk:2.2};
// wall panel [[u, v]] with an opening [[u, v]] (both any orientation), between depths w0 and w1, with the reveal walls
function holeWallM(o, M, outer, hole, w0, w1){
  const O = area2(outer) > 0 ? outer : outer.slice().reverse(), Hh = area2(hole) > 0 ? hole.slice().reverse() : hole;
  const V = O.concat(Hh), tr = THREE.ShapeUtils.triangulateShape(O.map(p => new THREE.Vector2(p[0], p[1])), [Hh.map(p => new THREE.Vector2(p[0], p[1]))]);
  for (const t of tr) for (const w of [w0, w1]) triP(o, M(V[t[0]][0], V[t[0]][1], w), M(V[t[1]][0], V[t[1]][1], w), M(V[t[2]][0], V[t[2]][1], w));
  for (const R of [O, Hh]) for (let i = 0; i < R.length; i++){ const a = R[i], b = R[(i+1) % R.length]; quadP(o, M(a[0], a[1], w0), M(b[0], b[1], w0), M(b[0], b[1], w1), M(a[0], a[1], w1)); } }

// ============================================================================================================================
// One Court Square (Skidmore, Owings & Merrill, 1990; 50 storeys, 205 m). Model frame: origin = tower centre, rot -0.2464
// (local axes on the Long Island City grid; +z towards 45th Ave / Court Sq, -z towards 44th Drive and Skyline Tower).
// Plan from OSM: a 51.8 m square whose corners are cut in two 4.65 m steps; the OSM parts give the stepped pyramidal top
// (each 4.65 m step inwards rises 7.5 m: 170 / 177.5 / 185 / 192.5 / 200 m), scaled here to the real 205 m roof.
// Green-tinted glass, silver-green mullions on a 1.52 m module, the lobby entrance on the west (Jackson Ave side).
LANDMARKS.ny1courtsq = {zh:'法院广场一号', en:'One Court Square', cat:'new', r:40, h:213,
  lt:{m:1, c:'#ffe6c4', k:0.75},
  build(){
    const g = new THREE.Group(), B = NBat();
    const GL = {c:'#3c6964', m:1, fh:4.1, cw:1.52}, MUL = '#9db3ab', SPN = '#2f5550', LOB = {c:'#5d8580', glow:'#ffe2b8', gk:0.35},
      CRN = {c:'#3f6d67', glow:'#d6e8ff', gk:0.32}, MECH = '#6f7672', PAV = '#a7a399', GRN = '#8e9a8c';
    const S = 4.65, H = 25.9;
    const R0 = notchSq(H, 16.6, S), R1 = notchSq(H, 12.0, S), R2 = notchSq(H - S, 12.0, S), R3 = notchSq(H - 2*S, 12.0, S), R4 = rectR(-12, 12, -12, 12);
    const T = [171, 178.6, 186.2, 193.8, 201.4];
    // foundations, lobby, shaft
    prismM(B.p(PAV), ID, offP(R0, -0.6), -6, 0.15);
    prismM(B.p(LOB), ID, offP(R0, 1.2), 0, 9.6, false);
    aboxM(B.p(SPN), ID, -26.2, 26.2, 9.3, 9.9, -16.9, 16.9); aboxM(B.p(SPN), ID, -16.9, 16.9, 9.3, 9.9, -26.2, 26.2);
    for (const p of R0){ if (Math.abs(p[0]) > 25 || Math.abs(p[1]) > 25) boxM(B.p(MUL), ID, 0.9, 9.6, 0.9, p[0]*0.985, 0, p[1]*0.985); }
    prismM(B.p(GL), ID, R0, 9.6, T[0], false);
    // tiers of the pyramid
    const RS = [R0, R1, R2, R3, R4];
    for (let k = 1; k < 5; k++){ prismM(B.p(k < 3 ? GL : CRN), ID, RS[k], T[k-1], T[k], false); capM(B.p(SPN), ID, RS[k-1], T[k-1]); }
    capM(B.p(SPN), ID, R4, T[4]);
    // mullions on every face segment (shaft and tiers), floor lines
    const mul = B.p(MUL), spn = B.p(SPN);
    const segMul = (R, y0, y1) => { const s = area2(R) > 0 ? 1 : -1;
      for (let i = 0; i < R.length; i++){ const a = R[i], b = R[(i+1) % R.length], L = Math.hypot(b[0]-a[0], b[1]-a[1]), n = Math.max(1, Math.round(L/1.52)), ux = (b[0]-a[0])/L, uz = (b[1]-a[1])/L, nx = uz*s, nz = -ux*s;
        for (let k = 0; k <= n; k++){ const x = a[0] + ux*L*k/n + nx*0.12, z = a[1] + uz*L*k/n + nz*0.12;
          quadP(mul, [x - ux*0.09, y0, z - uz*0.09], [x + ux*0.09, y0, z + uz*0.09], [x + ux*0.09, y1, z + uz*0.09], [x - ux*0.09, y1, z - uz*0.09]); } } };
    segMul(R0, 9.6, T[0]); for (let k = 1; k < 5; k++) segMul(RS[k], T[k-1], T[k]);
    for (let y = 13.7; y < T[0] - 1; y += 4.1) bandRing(spn, R0, y, 0.35, 0.06);
    for (let k = 0; k < 5; k++) bandRing(B.p(MUL), RS[k], T[k] - 0.6, 0.6, 0.1);      // parapet copings on the steps
    // west entrance pavilion (OSM bump) with canopy
    aboxM(B.p(LOB), ID, -31.2, -25.9, 0, 8.4, -3.4, 3.2); aboxM(B.p(MUL), ID, -32.6, -25.9, 8.4, 9.2, -5.2, 5.0);
    // rooftop: mechanical box, broadcast masts, beacons
    aboxM(B.p(MECH), ID, -7.5, 7.5, T[4], T[4] + 3.6, -7.5, 7.5);
    for (const [x, z, hh] of [[-5.5, -5.5, 9], [5.5, 5.5, 7.5], [5.5, -5.5, 6]]){ segP(B.p(MECH), [x, T[4] + 3.6, z], [x, T[4] + 3.6 + hh, z], 0.18, 5); boxM(B.p(AVL), ID, 0.5, 0.5, 0.5, x, T[4] + 3.6 + hh, z); }
    for (const [x, z] of [[-11.6, -11.6], [11.6, -11.6], [11.6, 11.6], [-11.6, 11.6]]) boxM(B.p(AVL), ID, 0.5, 0.45, 0.5, x, T[4], z);
    // plaza: low planters and trees on the Court Square (south-east) side
    for (const [x, z] of [[-14, 29.5], [0, 29.5], [14, 29.5]]){ cylM(B.p(GRN), ID, 1.0, 1.0, 0, 0.6, x, z, 8); cylM(B.p('#5c4a3a'), ID, 0.16, 0.12, 0.6, 3.2, x, z, 5); latheM(B.p(GRN), ID, [[0, 2.6], [1.9, 3.4], [2.1, 4.6], [1.3, 5.8], [0, 6.2]], x, z, 7); }
    B.flush(g); return g; }};
SG_PLACES.push({type:'ny1courtsq', lat:40.7470027, lon:-73.9438628, rot:-0.2464});

// ============================================================================================================================
// Skyline Tower (3 Court Square; Hill West Architects, 2021; 67 storeys, 237 m, the tallest building in Queens). Model frame:
// origin = lot centre, rot -0.2464 (same grid as One Court Square, which stands to the south across 44th Drive... the plaza).
// OSM: a full-lot 5-storey podium (19.2 m), the tower an L in plan (x -10..10 by z -17..20, and the east arm x 10..29 by
// z 4..20), roof 232 m. Floor-to-ceiling blue-grey glass, white mullions, recessed corner balconies, the curtain wall carried
// up as an open screen round the roof.
LANDMARKS.nyskylinetower = {zh:'天际线大厦', en:'Skyline Tower', cat:'new', r:44, h:239,
  lt:{m:1, c:'#ffe6c4', k:0.7},
  build(){
    const g = new THREE.Group(), B = NBat();
    const GL = {c:'#71879a', m:1, fh:3.45, cw:2.4}, MUL = '#d9dde0', POD = {c:'#6c7a86', m:1, fh:4.2, cw:3}, PST = '#c9c4ba', DK = '#3c454e',
      BAL = '#56616b', SCR = {c:'#8aa0b1', glow:'#dfeaff', gk:0.3}, RAIL = '#9fb2c0';
    const LOT = [[-29.0, 30.9], [-28.9, -30.8], [29.1, -31.4], [28.9, 31.3]];
    const TW = [[-10.3, 19.5], [-10.1, -17.4], [10.4, -17.4], [10.3, 4.2], [29.0, 4.3], [29.0, 19.9], [23.7, 19.9], [23.7, 22.7], [-6.5, 22.7], [-6.5, 19.5]];
    const YP = 19.2, YR = 232, YS = 237.5;
    // podium: stone base, glass floors, double-height entrance on 44th Drive (-z)
    prismM(B.p(PST), ID, offP(LOT, 0.3), -6, 5.5);
    prismM(B.p(POD), ID, offP(LOT, 0.5), 5.5, YP - 0.8); prismM(B.p(PST), ID, offP(LOT, 0.2), YP - 0.8, YP);
    for (let y = 5.5; y < YP - 1; y += 4.2) bandRing(B.p(MUL), offP(LOT, 0.5), y, 0.3, 0.05);
    aboxM(B.p(DK), ID, -8, 8, 0, 8.5, -31.9, -30.9); aboxM(B.p(MUL), ID, -10, 10, 8.5, 9.3, -34, -30.6);
    // tower: corner balconies cut out of the convex corners (2.6 m) from the podium roof up
    const conv = [0, 1, 2, 4, 5];   // convex corners of TW (the 3 m bump on +z is left whole)
    const TB = []; for (let i = 0; i < TW.length; i++){ const p = TW[i];
      if (!conv.includes(i)){ TB.push(p); continue; }
      const a = TW[(i + TW.length - 1) % TW.length], b = TW[(i+1) % TW.length], da = Math.hypot(a[0]-p[0], a[1]-p[1]), db = Math.hypot(b[0]-p[0], b[1]-p[1]), d = 2.6;
      const pa = [p[0] + (a[0]-p[0])/da*d, p[1] + (a[1]-p[1])/da*d], pb = [p[0] + (b[0]-p[0])/db*d, p[1] + (b[1]-p[1])/db*d];
      TB.push(pa, [pa[0] + pb[0] - p[0], pa[1] + pb[1] - p[1]], pb); }
    prismM(B.p(GL), ID, TB, YP, YR, true);
    // balcony slabs and glass rails in the corner notches; floor lines; mullions
    const mul = B.p(MUL);
    for (const i of conv){ const p = TW[i], a = TW[(i + TW.length - 1) % TW.length], b = TW[(i+1) % TW.length];
      const ua = [(a[0]-p[0]), (a[1]-p[1])], ub = [(b[0]-p[0]), (b[1]-p[1])], la = Math.hypot(...ua), lb = Math.hypot(...ub);
      const A = [ua[0]/la*2.6, ua[1]/la*2.6], Bv = [ub[0]/lb*2.6, ub[1]/lb*2.6];
      const ring = [[p[0], p[1]], [p[0] + A[0], p[1] + A[1]], [p[0] + A[0] + Bv[0], p[1] + A[1] + Bv[1]], [p[0] + Bv[0], p[1] + Bv[1]]];
      for (let y = YP + 3.45; y < YR - 2; y += 3.45){ prismM(B.p(BAL), ID, ring, y - 0.25, y, true, true);
        for (const [u, v] of [[ring[1], ring[0]], [ring[0], ring[3]]]) quadP(B.p(RAIL), [u[0], y, u[1]], [v[0], y, v[1]], [v[0], y + 1.1, v[1]], [u[0], y + 1.1, u[1]]); }
    }
    for (let y = YP + 3.45; y < YR; y += 3.45) bandRing(mul, TB, y - 0.18, 0.18, 0.05);
    { const s = area2(TB) > 0 ? 1 : -1;
      for (let i = 0; i < TB.length; i++){ const a = TB[i], b = TB[(i+1) % TB.length], L = Math.hypot(b[0]-a[0], b[1]-a[1]); if (L < 3) continue;
        const n = Math.round(L/1.6), ux = (b[0]-a[0])/L, uz = (b[1]-a[1])/L, nx = uz*s*0.08, nz = -ux*s*0.08;
        for (let k = 1; k < n; k++){ const x = a[0] + ux*L*k/n + nx, z = a[1] + uz*L*k/n + nz; quadP(mul, [x - ux*0.06, YP, z - uz*0.06], [x + ux*0.06, YP, z + uz*0.06], [x + ux*0.06, YS, z + uz*0.06], [x - ux*0.06, YS, z - uz*0.06]); } } }
    // roof: the glass screen carried up 5.5 m (open), mechanical floors inside, beacons
    wallsM(B.p(SCR), ID, offP(TB, -0.05), YR, YS);
    aboxM(B.p(DK), ID, -8, 8, YR, YR + 4.5, -12, 14);
    for (const [x, z] of [[-9, -16], [9, -16], [27.5, 18.5], [-9, 21]]) boxM(B.p(AVL), ID, 0.5, 0.5, 0.5, x, YS, z);
    B.flush(g); return g; }};
SG_PLACES.push({type:'nyskylinetower', lat:40.7479793, lon:-73.9444466, rot:-0.2464});

// ============================================================================================================================
// The Brooklyn Tower (SHoP Architects, 2022; 93 storeys, 327 m to the crown, the tallest building outside Manhattan) rising
// behind the Dime Savings Bank of Brooklyn (Mowbray & Uffinger 1908, enlarged 1932: white marble, Ionic columns, the smooth
// marble dome). Model frame: origin = the lot centroid, rot 0 (+x east, +z south: DeKalb Avenue on +z, Flatbush Avenue
// Extension on the east, Albee Square on the west). OSM parts: the bank 0-33.3 m (the west / DeKalb part of the lot), the
// hexagonal tower part (roof 324 m), the rest of the lot a 18.6 m podium. The hexagon's corners are notched ("hexagonal
// shafts"), the six faces are pleated by the projecting fins, the sides step in slightly near the top into the crown; the
// cladding darkens from bronze at the base to black at the top.
LANDMARKS.nybktower = {zh:'布鲁克林大厦', en:'The Brooklyn Tower', cat:'new', r:60, h:328,
  lt:{m:1, c:'#ffe4c0', k:0.75},
  build(){
    const g = new THREE.Group(), B = NBat();
    const T1 = {c:'#7c6a56', m:1, fh:3.4, cw:2.4}, T2 = {c:'#4f453d', m:1, fh:3.4, cw:2.4}, T3 = {c:'#2d2a28', m:1, fh:3.4, cw:2.4},
      CRN = {c:'#3a332d', glow:'#ffcf8f', gk:0.55}, MAR = {c:'#e6e0d4', m:0, lc:'#ffe3bd', lk:0.9, e:0.5}, MAR2 = {c:'#d3ccbe', m:0, lc:'#ffe3bd', lk:0.8, e:0.5},
      GRA = '#b79a8e', POD = {c:'#b2a796', m:1, fh:4.6, cw:3.2}, DK = '#3a3631', WIN = {c:'#4d5357', glow:'#ffd9a0', gk:0.25}, BRZ = '#8a6a48';
    // ---- the lot: podium (18.6 m) and the bank (OSM part 0-33.3 m)
    const LOT = [[-44.7,23.6],[-42.2,22.4],[-9.3,-29.8],[8.4,-56.8],[15.9,-56.8],[40.7,8.8],[30.9,7.9],[26.9,4.5],[22.2,11.3],[20.3,11.3],[19.0,38.5],[-38.5,37.4]];
    const BK = [[-44.7,23.6],[-42.2,22.4],[-9.3,-29.8],[0.2,-9.0],[-1.0,-7.1],[12.7,20.0],[14.0,20.1],[15.1,18.5],[20.1,18.8],[19.0,38.5],[-38.5,37.4]];
    const PD = [[-9.3,-29.8],[8.4,-56.8],[15.9,-56.8],[40.7,8.8],[30.9,7.9],[26.9,4.5],[22.2,11.3],[20.3,11.3],[20.1,18.8],[15.1,18.5],[14.0,20.1],[12.7,20.0],[-1.0,-7.1],[0.2,-9.0]];
    prismM(B.p(GRA), ID, offP(LOT, -0.2), -6, 1.2);
    prismM(B.p(POD), ID, PD, 1.2, 17.4); prismM(B.p(MAR2), ID, offP(PD, -0.25), 17.4, 18.6);
    for (let y = 5.8; y < 17; y += 4.6) bandRing(B.p(MAR2), PD, y, 0.35, 0.08);
    // bank: marble walls to the main cornice (19 m), the deep parapet / attic (to 23 m), the drum and the dome
    const bk = B.p(MAR), bk2 = B.p(MAR2);
    prismM(bk, ID, BK, 1.2, 19); prismM(bk2, ID, offP(BK, -0.7), 19, 20.2); prismM(bk, ID, offP(BK, 0.4), 20.2, 23.4); prismM(bk2, ID, offP(BK, 0.1), 23.4, 24.0);
    bandRing(bk2, BK, 3.0, 0.5, 0.15);
    // windows between the columns on DeKalb (+z face) and the diagonal west face
    const facadeCols = (a, b, n, y0, y1, free) => { const L = Math.hypot(b[0]-a[0], b[1]-a[1]), ux = (b[0]-a[0])/L, uz = (b[1]-a[1])/L; let nx = uz, nz = -ux;
      const c = cenP(BK); if ((c[0] - (a[0]+b[0])/2)*nx + (c[1] - (a[1]+b[1])/2)*nz > 0){ nx = -nx; nz = -nz; }
      for (let k = 0; k < n; k++){ const t = (k + 0.5)/n*L, x = a[0] + ux*t + nx*(free ? 3.2 : 0.55), z = a[1] + uz*t + nz*(free ? 3.2 : 0.55);
        cylM(bk, ID, 0.62, 0.72, y0 + 0.9, y1 - 1.0, x, z, 12); boxM(bk2, ID, 1.75, 0.9, 1.75, x, y0, z); boxM(bk2, ID, 1.9, 1.0, 1.9, x, y1 - 1.0, z);
        if (k < n - 1){ const t2 = (k + 1)/n*L, wx = a[0] + ux*t2 + nx*0.08, wz = a[1] + uz*t2 + nz*0.08; const M = (u, v, w) => [wx + ux*u + nx*w, v, wz + uz*u + nz*w];
          if (!free){ polyFaceM(B.p(WIN), M, roundA(0, 1.1, y0 + 2, y1 - 4.6, 6), 0.02); polyFaceM(B.p(WIN), M, [[-1.1, y1 + 1.2], [1.1, y1 + 1.2], [1.1, y1 + 3.0], [-1.1, y1 + 3.0]], 0.02); } } }
      if (free){ // entablature and soffit over the free-standing columns
        const M = (u, v, w) => [a[0] + ux*u + nx*w, v, a[1] + uz*u + nz*w]; aboxM(bk2, M, 0, L, y1, y1 + 2.0, -0.2, 4.2); } };
    facadeCols([-38.5, 37.4], [19.0, 38.5], 12, 3.5, 17.5, false);   // DeKalb Avenue
    facadeCols([-42.2, 22.4], [-9.3, -29.8], 9, 3.5, 17.5, false);   // the diagonal north-west face
    facadeCols([-44.7, 23.6], [-38.5, 37.4], 4, 1.2, 17.5, true);    // Albee Square portico: four Ionic columns in front
    // the dome over the hexagonal rotunda (5th-floor terrace round it)
    const DX = -15, DZ = 21;
    latheM(bk2, ID, [[0, 24], [11.2, 24], [11.2, 25.2], [10.6, 25.2], [10.6, 26.6], [11.0, 26.6], [11.0, 27.2]], DX, DZ, 24);
    latheM(bk, ID, [[10.4, 27.2], [10.0, 28.8], [9.0, 30.4], [7.4, 31.7], [5.2, 32.7], [2.6, 33.2], [0, 33.35]], DX, DZ, 24);
    cylM(bk2, ID, 1.0, 1.0, 33.2, 34.0, DX, DZ, 10);
    // ---- the tower: notched hexagon, pleated faces, slight setbacks, crown
    const HX = [[-5.1,-22.3],[2.7,-32.8],[18.2,-32.0],[28.7,-13.0],[20.7,-0.2],[5.6,-0.9]], C = cenP(HX);
    const notched = (P, d, n) => { const out = []; for (let i = 0; i < P.length; i++){ const v = P[i], a = P[(i + P.length - 1) % P.length], b = P[(i+1) % P.length];
        const la = Math.hypot(a[0]-v[0], a[1]-v[1]), lb = Math.hypot(b[0]-v[0], b[1]-v[1]); out.push([v[0] + (a[0]-v[0])/la*d, v[1] + (a[1]-v[1])/la*d]);
        const cx = C[0] - v[0], cz = C[1] - v[1], lc = Math.hypot(cx, cz); out.push([v[0] + cx/lc*n, v[1] + cz/lc*n]); out.push([v[0] + (b[0]-v[0])/lb*d, v[1] + (b[1]-v[1])/lb*d]); }
      return out; };
    const LV = [[-4, 0], [62, 0], [150, 0], [208, 0.8], [234, 1.6], [256, 2.4], [276, 3.2], [293, 4.0], [307, 4.8], [316.5, 4.8]];
    for (let k = 0; k < LV.length - 1; k++){ const [y0, d] = LV[k], y1 = LV[k+1][0];
      const ring = pleat(notched(toward(HX, C, d), 2.3, 1.7), 1.75, 0.45), mat = y0 < 60 ? T1 : y0 < 148 ? T2 : T3;
      prismM(B.p(mat), ID, ring, y0, y1, false);
      if (k > 2) capM(B.p(DK), ID, notched(toward(HX, C, LV[k-1][1]), 2.3, 1.7), y0);
      if (k > 2) bandRing(B.p(BRZ), notched(toward(HX, C, d), 2.3, 1.7), y0, 0.5, 0.55);   // bronze ledge at each setback
    }
    // crown: the pleated skin continues 10.5 m above the roof as an open screen of fins, lit from inside at night
    const top = notched(toward(HX, C, 4.8), 2.3, 1.7);
    capM(B.p(DK), ID, top, 316.5 - 0.3);
    // inner lit screen, and the outer pleat ridges carried up as free-standing fins (taller at the face centres)
    wallsM(B.p(CRN), ID, offP(top, 1.0), 316.5, 325.6);
    { const crown = pleat(top, 1.75, 0.45), n = crown.length;
      for (let i = 1; i < n; i += 2){ const p = crown[i], a = crown[i - 1], b = crown[(i + 1) % n], ux = b[0] - a[0], uz = b[1] - a[1], L = Math.hypot(ux, uz) || 1;
        // distance of this fin from its face's corner (fins near the hexagon corners stay lower)
        let dmin = 1e9; for (const v of HX) dmin = Math.min(dmin, Math.hypot(p[0] - v[0], p[1] - v[1]));
        const yt = 323.5 + Math.min(3.5, dmin*0.42);
        const F = (u, v, w) => [p[0] + ux/L*u + (-uz/L)*w*0 + (C[0] - p[0])/Math.hypot(C[0] - p[0], C[1] - p[1])*w, v, p[1] + uz/L*u + (C[1] - p[1])/Math.hypot(C[0] - p[0], C[1] - p[1])*w];
        aboxM(B.p(T3), F, -0.22, 0.22, 316.5, yt, 0, 1.0); } }
    for (const p of toward(HX, C, 5.4)) boxM(B.p(AVL), ID, 0.5, 0.5, 0.5, p[0], 327, p[1]);
    aboxM(B.p(DK), ID, C[0] - 6, C[0] + 6, 316.2, 321, C[1] - 6, C[1] + 6);
    // base: bronze canopy over the Fleet Street residential entrance
    { const a = HX[5], b = HX[0], ux = (b[0]-a[0]), uz = (b[1]-a[1]); aboxM(B.p(BRZ), FR((a[0]+b[0])/2, 0, (a[1]+b[1])/2, Math.atan2(-uz, ux)), -6, 6, 18.6, 19.4, -3.5, 0.5); }
    B.flush(g); return g; }};
SG_PLACES.push({type:'nybktower', lat:40.6904033, lon:-73.9823895, rot:0});

// ============================================================================================================================
// Brooklyn Army Terminal (Cass Gilbert, 1918-19), Sunset Park. Model frame: origin between the two warehouses, rot -0.665
// (local +z along the buildings towards the north-east / 58th St, -x towards the water). OSM: Building A (west, 65 x 312 m,
// with the jog at the north end) and Building B (east, 97 x 301 m), eight storeys of reinforced concrete; three enclosed
// bridges cross the rail yard between them. Building B's atrium: 20 m wide, the length of the building, skylit, with the
// staggered cantilevered loading balconies and the rail track running in. Plain concrete, regular pier-and-spandrel grid,
// projecting stair towers, rooftop stair / elevator houses.
LANDMARKS.nyarmyterminal = {zh:'布鲁克林陆军码头', en:'Brooklyn Army Terminal', cat:'old', r:196, h:46,
  lt:{m:1, c:'#ffe2b8', k:0.6},
  build(){
    const g = new THREE.Group(), B = NBat();
    const CON = {c:'#d5cfc2', m:1, fh:4.6, cw:3.0}, CON2 = '#c4bdaf', CON3 = '#b3ac9e', ROOF = '#8f8a82', DK = '#4b4d4f', SKY = {c:'#b8d0da', op:0.5, ds:true},
      INN = {c:'#cfc8ba', m:1, fh:4.6, cw:3.0}, YARD = '#8b867c', RAIL = '#5a524a', TAR = '#6e6a64';
    const AX0 = -102.3, AX1 = -36.6, AZ0 = -156.1, AZ1 = 143.5, BX0 = 5.3, BX1 = 102.4, BZ0 = -155.5, BZ1 = 145.6, HA = 37.4, HB = 37.4, FH = 4.6;
    const con = B.p(CON), c2 = B.p(CON2), c3 = B.p(CON3);
    // grid facade on a rectangle: piers every ~6.1 m, spandrel bands at each floor, cornice band; stair towers every ~48 m
    const block = (x0, x1, z0, z1, h) => {
      aboxM(B.p(CON3), ID, x0 - 0.3, x1 + 0.3, -9, 1.2, z0 - 0.3, z1 + 0.3);
      aboxM(con, ID, x0, x1, 1.2, h, z0, z1);
      aboxM(c2, ID, x0 - 0.35, x1 + 0.35, h - 1.4, h, z0 - 0.35, z1 + 0.35);
      for (let y = 1.2 + FH; y < h - 2; y += FH){ aboxM(c2, ID, x0 - 0.18, x1 + 0.18, y - 0.55, y + 0.25, z0 - 0.18, z1 + 0.18); }
      const nz = Math.round((z1 - z0)/6.1), nx = Math.round((x1 - x0)/6.1);
      for (let k = 0; k <= nz; k++){ const z = z0 + (z1 - z0)*k/nz; for (const x of [x0, x1]) boxM(c2, ID, 0.9, h - 2.6, 0.9, x, 1.2, z); }
      for (let k = 0; k <= nx; k++){ const x = x0 + (x1 - x0)*k/nx; for (const z of [z0, z1]) boxM(c2, ID, 0.9, h - 2.6, 0.9, x, 1.2, z); }
      // projecting stair towers on the long sides, with roof houses
      const nt = Math.round((z1 - z0)/48);
      if (nt > 0) for (let k = 0; k <= nt; k++){ const z = z0 + 6 + (z1 - z0 - 12)*k/nt;
        for (const [x, s] of [[x0, -1], [x1, 1]]){ aboxM(c3, ID, Math.min(x, x + s*1.2), Math.max(x, x + s*1.2), 0, h + 3.2, z - 3, z + 3); aboxM(c2, ID, Math.min(x, x - s*5), Math.max(x, x - s*5), h, h + 3.6, z - 3.6, z + 3.6); } }
      prismM(B.p(ROOF), ID, rectR(x0 + 0.2, x1 - 0.2, z0 + 0.2, z1 - 0.2), h - 0.6, h - 0.5, true); };
    // ---- Building A (+ the north jog, the penthouses to the OSM 45 m)
    block(AX0, AX1, AZ0, AZ1, HA);
    block(-65.1, AX1, AZ1, 156.2, HA);
    for (const z of [-100, 0, 100]) aboxM(c3, ID, -78, -60, HA, 45.2, z - 7, z + 7);
    // ---- Building B: perimeter ring of loft floors round the open atrium (x 43.8..63.8)
    const XA0 = 43.8, XA1 = 63.8, ZA0 = BZ0 + 14, ZA1 = BZ1 - 14;
    aboxM(c3, ID, BX0 - 0.3, BX1 + 0.3, -6, 1.2, BZ0 - 0.3, BZ1 + 0.3);
    aboxM(con, ID, BX0, XA0, 1.2, HB, BZ0, BZ1); aboxM(con, ID, XA1, BX1, 1.2, HB, BZ0, BZ1);
    aboxM(con, ID, XA0, XA1, 1.2, HB, BZ0, ZA0); aboxM(con, ID, XA0, XA1, 1.2, HB, ZA1, BZ1);
    { // reuse the facade dressing of block() on B's outline without filling the atrium again
      aboxM(c2, ID, BX0 - 0.35, XA0, HB - 1.4, HB, BZ0 - 0.35, BZ1 + 0.35); aboxM(c2, ID, XA1, BX1 + 0.35, HB - 1.4, HB, BZ0 - 0.35, BZ1 + 0.35);
      for (let y = 1.2 + FH; y < HB - 2; y += FH){ aboxM(c2, ID, BX0 - 0.18, BX0 + 0.1, y - 0.55, y + 0.25, BZ0, BZ1); aboxM(c2, ID, BX1 - 0.1, BX1 + 0.18, y - 0.55, y + 0.25, BZ0, BZ1);
        aboxM(c2, ID, BX0, BX1, y - 0.55, y + 0.25, BZ0 - 0.18, BZ0 + 0.1); aboxM(c2, ID, BX0, BX1, y - 0.55, y + 0.25, BZ1 - 0.1, BZ1 + 0.18); }
      const nz = Math.round((BZ1 - BZ0)/6.1); for (let k = 0; k <= nz; k++){ const z = BZ0 + (BZ1 - BZ0)*k/nz; for (const x of [BX0, BX1]) boxM(c2, ID, 0.9, HB - 2.6, 0.9, x, 1.2, z); }
      const nx = Math.round((BX1 - BX0)/6.1); for (let k = 0; k <= nx; k++){ const x = BX0 + (BX1 - BX0)*k/nx; for (const z of [BZ0, BZ1]) boxM(c2, ID, 0.9, HB - 2.6, 0.9, x, 1.2, z); }
      const nt = 6; for (let k = 0; k <= nt; k++){ const z = BZ0 + 6 + (BZ1 - BZ0 - 12)*k/nt;
        for (const [x, s] of [[BX0, -1], [BX1, 1]]){ aboxM(c3, ID, Math.min(x, x + s*1.2), Math.max(x, x + s*1.2), 0, HB + 3.2, z - 3, z + 3); aboxM(c2, ID, Math.min(x, x - s*5), Math.max(x, x - s*5), HB, HB + 3.6, z - 3.6, z + 3.6); } }
      for (const [x0, x1] of [[BX0, XA0], [XA1, BX1]]) prismM(B.p(ROOF), ID, rectR(x0 + 0.2, x1 - 0.2, BZ0 + 0.2, BZ1 - 0.2), HB - 0.6, HB - 0.5, true);
      prismM(B.p(ROOF), ID, rectR(XA0, XA1, BZ0 + 0.2, ZA0), HB - 0.6, HB - 0.5, true); prismM(B.p(ROOF), ID, rectR(XA0, XA1, ZA1, BZ1 - 0.2), HB - 0.6, HB - 0.5, true); }
    // atrium: inner walls (lit windows), floor with the rail track, the staggered balconies, the skylight
    const inn = B.p(INN);
    quadP(inn, [XA0, 1.2, ZA1], [XA0, 1.2, ZA0], [XA0, HB, ZA0], [XA0, HB, ZA1]); quadP(inn, [XA1, 1.2, ZA0], [XA1, 1.2, ZA1], [XA1, HB, ZA1], [XA1, HB, ZA0]);
    quadP(inn, [XA0, 1.2, ZA0], [XA1, 1.2, ZA0], [XA1, HB, ZA0], [XA0, HB, ZA0]); quadP(inn, [XA1, 1.2, ZA1], [XA0, 1.2, ZA1], [XA0, HB, ZA1], [XA1, HB, ZA1]);
    prismM(B.p(YARD), ID, rectR(XA0, XA1, ZA0, ZA1), 1.0, 1.2, true);
    for (const x of [52.5, 54.0]) aboxM(B.p(RAIL), ID, x - 0.08, x + 0.08, 1.2, 1.38, BZ0 - 6, ZA1);
    for (let f = 1; f < 8; f++){ const y = 1.2 + f*FH;
      for (const s of [-1, 1]){ const x = s < 0 ? XA0 : XA1, sh = ((f + (s > 0 ? 1 : 0)) % 2)*9;
        for (let z = ZA0 + 6 + sh; z < ZA1 - 6; z += 18){ aboxM(c2, ID, Math.min(x, x - s*2.8), Math.max(x, x - s*2.8), y - 0.45, y, z - 3.2, z + 3.2);
          aboxM(B.p(DK), ID, Math.min(x - s*2.7, x - s*2.8), Math.max(x - s*2.7, x - s*2.8), y, y + 1.05, z - 3.2, z + 3.2); } } }
    { const sk = B.p(SKY), xm = (XA0 + XA1)/2; for (let z = ZA0; z < ZA1 - 0.1; z += (ZA1 - ZA0)/24){ const z2 = z + (ZA1 - ZA0)/24;
        quadP(sk, [XA0, HB, z], [xm, HB + 3.4, z], [xm, HB + 3.4, z2], [XA0, HB, z2]); quadP(sk, [xm, HB + 3.4, z], [XA1, HB, z], [XA1, HB, z2], [xm, HB + 3.4, z2]);
        aboxM(B.p(DK), ID, XA0, XA1, HB - 0.2, HB + 0.1, z - 0.25, z + 0.25); segP(B.p(DK), [XA0, HB, z], [xm, HB + 3.4, z], 0.12, 4); segP(B.p(DK), [xm, HB + 3.4, z], [XA1, HB, z], 0.12, 4); } }
    // ---- the three enclosed bridges over the rail yard (OSM footprints), at the 2nd floor
    for (const [z0, z1] of [[-118.1, -106.5], [-20.4, -9.0], [77.5, 88.7]]){ aboxM(con, ID, AX1, BX0, 5.8, 10.6, z0 + 0.5, z1 - 0.5); aboxM(c2, ID, AX1, BX0, 10.6, 11.1, z0 + 0.3, z1 - 0.3); aboxM(c2, ID, AX1, BX0, 5.4, 5.8, z0 + 0.3, z1 - 0.3);
      for (let x = AX1 + 6; x < BX0 - 3; x += 8.5) boxM(c3, ID, 1.2, 5.4, 1.2, x, 0, (z0 + z1)/2); }
    // ---- the rail yard between them: tracks and the loading platforms along both buildings
    prismM(B.p(YARD), ID, rectR(AX1, BX0, AZ0, BZ1), -0.6, 0.1, true);
    for (const x of [-27, -20, -13, -6, 1]) for (const dx of [-0.72, 0.72]) aboxM(B.p(RAIL), ID, x + dx - 0.08, x + dx + 0.08, 0.1, 0.28, AZ0 + 4, BZ1 - 4);
    for (const [x0, x1] of [[AX1, AX1 + 6], [BX0 - 6, BX0]]){ aboxM(c3, ID, x0, x1, 0, 1.25, AZ0 + 3, BZ1 - 3); aboxM(B.p(TAR), ID, x0 - (x0 < 0 ? 0 : 1.5), x1 + (x0 < 0 ? 1.5 : 0), 4.9, 5.3, AZ0 + 3, BZ1 - 3); }
    B.flush(g); return g; }};
SG_PLACES.push({type:'nyarmyterminal', lat:40.6441808, lon:-74.0255015, rot:-0.665});

// ============================================================================================================================
// Domino Sugar Refinery (1884: Filter House, Pan House and Finishing House) and its 2023 conversion by PAU (the brick shell
// kept, a new office building inside under a glass barrel vault), with the Domino Park artifacts across River Street (James
// Corner Field Operations, 2018). Model frame: origin = the refinery centroid, rot 1.2288: local +x along the long facade
// (north, towards South 2nd St), -z towards the East River (River Street at z = -43, Kent Avenue at z = +33).
// OSM parts: brick plinth 0-6 m, the brick shell (walls ~1 m thick) 6-44 m on the river half and 6-33 m on the Kent Avenue
// half, the inner building 6-65 m (vault crown), the stack on the river face (square base to 54 m, oval shaft to 75 m).
// The famous rooftop sign is left out (no lettering). Park: the elevated Artifact Walk on salvaged cast-iron columns with the
// turquoise crane rails, the four syrup tanks of the syrup-tank garden, a screw conveyor.
LANDMARKS.nydomino = {zh:'多米诺糖厂', en:'Domino Sugar Refinery', cat:'old', r:48, h:76,
  lt:{m:0, c:'#ffdcae', k:0.8, e:0.5},
  build(){
    const g = new THREE.Group(), B = NBat();
    const BR = {c:'#8e4b36', m:0, lc:'#ffd2a0', lk:0.85, e:0.5}, BR2 = '#74402f', STN = '#a79a88', WIN = '#2a2624', GL = {c:'#93acb6', m:1, fh:4.2, cw:3.0},
      VLT = {c:'#a9c6d0', glow:'#fff0d0', gk:0.42, op:0.82}, RIB = '#e4e4df', TQ = '#3fa3a0', IRN = '#3f4244', TNK = '#9a9790', RUST = '#8a5a3c', PAV = '#a59f94';
    const br = B.p(BR), b2 = B.p(BR2), win = B.p(WIN);
    const X0 = -38.3, X1 = 38.3, Z0 = -21.9, ZM = 0.3, Z1 = 22.4;
    // plinth and the shell walls (front / river half to 44 m, back half to 33 m)
    aboxM(B.p(STN), ID, X0 - 0.3, X1 + 0.3, -7.5, 1.2, Z0 - 0.3, Z1 + 0.3); aboxM(b2, ID, X0 - 0.15, X1 + 0.15, 1.2, 6, Z0 - 0.15, Z1 + 0.15);
    for (let x = X0 + 3; x < X1 - 2; x += 4.6){ polyFaceM(win, (u, v, w) => [x + u, v, Z0 - 0.2 + w], roundA(0, 1.2, 1.2, 4.0, 5), 0); polyFaceM(win, (u, v, w) => [x + u, v, Z1 + 0.2 + w], roundA(0, 1.2, 1.2, 4.0, 5), 0); }
    const wall = (x0, x1, z0, z1, h) => aboxM(br, ID, x0, x1, 6, h, z0, z1);
    wall(X0, X1, Z0, Z0 + 1, 44); wall(X0, X0 + 1, Z0, ZM, 44); wall(X1 - 1, X1, Z0, ZM, 44);
    wall(X0, X0 + 1, ZM, Z1, 33); wall(X1 - 1, X1, ZM, Z1, 33); wall(X0, X1, Z1 - 1, Z1, 33);
    // cornices and string courses
    for (const [y, zz0, zz1] of [[44, Z0, ZM], [33, ZM, Z1]]){ aboxM(b2, ID, X0 - 0.5, X1 + 0.5, y - 0.9, y, zz0 - 0.5, zz0 === Z0 ? Z0 + 1.5 : zz1 + 0.5);
      for (const x of [X0, X1]) aboxM(b2, ID, x - 0.5, x + 0.5, y - 0.9, y, zz0, zz1 + (zz1 === Z1 ? 0.5 : 0)); }
    aboxM(b2, ID, X0 - 0.5, X1 + 0.5, 32.1, 33, Z1 - 1.5, Z1 + 0.5);
    for (const y of [14, 24.5]) { aboxM(b2, ID, X0 - 0.25, X1 + 0.25, y, y + 0.5, Z0 - 0.25, Z0 + 0.2); aboxM(b2, ID, X0 - 0.25, X1 + 0.25, y, y + 0.5, Z1 - 0.2, Z1 + 0.25); }
    // arched window openings (dark) on all four faces: 10 floors on the river half, 7 on the back
    const winsX = (z, w, ytop) => { for (let y = 7.2; y < ytop - 3.5; y += 3.8) for (let x = X0 + 2.6; x < X1 - 2; x += 3.45){ if (z < 0 && Math.abs(x) < 6) continue;
        const M = (u, v, ww) => [x + u, v, z + ww]; polyFaceM(win, M, roundA(0, 0.85, y, y + 2.3, 4), w); } };
    winsX(Z0 - 0.04, 0, 44); winsX(Z1 + 0.04, 0, 33);
    const winsZ = (x, s) => { for (let y = 7.2; y < 40; y += 3.8) for (let z = Z0 + 2.6; z < Z1 - 2; z += 3.45){ if (z > ZM && y > 29) continue;
        const M = (u, v, ww) => [x + ww, v, z + u]; polyFaceM(win, M, roundA(0, 0.85, y, y + 2.3, 4), 0); } };
    winsZ(X0 - 0.04, -1); winsZ(X1 + 0.04, 1);
    // the inner office building and the glass barrel vault (axis along x)
    aboxM(B.p(GL), ID, -33.6, 33.5, 6, 44, -18.3, 17.7);
    { const R = 18, H = 21, zc = -0.3, n = 14, vl = B.p(VLT), rb = B.p(RIB);
      for (let i = 0; i < n; i++){ const a0 = PI*i/n, a1 = PI*(i+1)/n, P = (x, a) => [x, 44 + Math.sin(a)*H, zc + Math.cos(a)*R];
        quadP(vl, P(-33.6, a0), P(33.5, a0), P(33.5, a1), P(-33.6, a1)); }
      for (const x of [-33.6, 33.5]) for (let i = 0; i < n; i++){ const a0 = PI*i/n, a1 = PI*(i+1)/n; triP(vl, [x, 44, zc], [x, 44 + Math.sin(a0)*H, zc + Math.cos(a0)*R], [x, 44 + Math.sin(a1)*H, zc + Math.cos(a1)*R]); }
      for (let x = -33.6; x <= 33.6; x += 67.1/12) for (let i = 0; i < n; i++){ const a0 = PI*i/n, a1 = PI*(i+1)/n; segP(rb, [x, 44 + Math.sin(a0)*H, zc + Math.cos(a0)*R], [x, 44 + Math.sin(a1)*H, zc + Math.cos(a1)*R], 0.22, 4); }
      for (let i = 1; i < n; i++){ const a = PI*i/n; segP(rb, [-33.6, 44 + Math.sin(a)*H, zc + Math.cos(a)*R], [33.5, 44 + Math.sin(a)*H, zc + Math.cos(a)*R], 0.16, 4); } }
    // the stack on the river face
    aboxM(br, ID, -4.7, 4.6, -7.5, 54, -27.0, -21.0); aboxM(b2, ID, -5.1, 5.0, 53, 55, -27.4, -20.6);
    for (let y = 9; y < 53; y += 4.4) aboxM(win, ID, -1.0, 1.0, y, y + 2.4, -27.06, -26.9);
    latheM(br, FR(0, 0, -23.9, 0), [[0, 55], [3.7, 55], [3.5, 73.6], [4.0, 74.2], [4.0, 75], [3.1, 75], [3.1, 70], [0, 70]], 0, 0, 16);
    B.flush(g); return g; }};
SG_PLACES.push({type:'nydomino', lat:40.7144181, lon:-73.9673060, rot:1.2288});

// Domino Park (secondary key, no label): the artifacts across River Street on the waterfront, same axes as the refinery,
// origin 66 m out towards the river from the refinery centre (local z here = refinery z + 66).
LANDMARKS.nydomino_b = {zh:'多米诺公园', en:'Domino Park', cat:'new', label:false, r:90, h:16,
  lt:{m:0, c:'#ffdcae', k:0.7, e:0.6},
  build(){
    const g = new THREE.Group(), B = NBat(), PK = (x, y, z) => [x, y, z + 66];
    const TQ = '#3fa3a0', IRN = '#3f4244', TNK = '#9a9790', RUST = '#8a5a3c', PAV = '#a59f94';
    const pk = B.p(PAV); prismM(pk, PK, rectR(-72, 74, -86, -47), -2.6, 0.12, true);
    // Artifact Walk: elevated catwalk on pairs of salvaged cast-iron columns, the turquoise crane rails on top
    const YW = 10.7, ZW = -53;
    for (let x = -68; x <= 68; x += 6.8) for (const dz of [-2.6, 2.6]){ cylM(B.p(IRN), PK, 0.32, 0.4, -2.4, YW - 0.6, x, ZW + dz, 8); boxM(B.p(IRN), PK, 0.9, 0.6, 0.9, x, YW - 0.6, ZW + dz); }
    aboxM(B.p(IRN), PK, -69, 69, YW - 0.3, YW, ZW - 3.2, ZW + 3.2); aboxM(B.p('#b9b2a4'), PK, -69, 69, YW, YW + 0.12, ZW - 2.4, ZW + 2.4);
    for (const dz of [-3.1, 3.1]) aboxM(B.p(TQ), PK, -69, 69, YW, YW + 1.4, ZW + dz - 0.25, ZW + dz + 0.25);   // crane-rail girders as parapets
    for (const x of [-68, -34, 0, 34, 68]) { aboxM(B.p(TQ), PK, x - 0.5, x + 0.5, YW, YW + 4.2, ZW - 3.4, ZW - 2.6); aboxM(B.p(TQ), PK, x - 0.5, x + 0.5, YW, YW + 4.2, ZW + 2.6, ZW + 3.4); aboxM(B.p(TQ), PK, x - 0.6, x + 0.6, YW + 4.2, YW + 5.0, ZW - 3.6, ZW + 3.6); }
    for (const s of [-1, 1]){ const x0 = s*69; for (let k = 0; k < 16; k++){ const y = YW - (k + 1)*YW/16; aboxM(B.p(IRN), PK, Math.min(x0 + s*k*1.1, x0 + s*(k + 1)*1.1), Math.max(x0 + s*k*1.1, x0 + s*(k + 1)*1.1), y - 0.25, y, ZW - 1.2, ZW + 1.2); } }
    // syrup-tank garden: four riveted steel tanks (~11 m)
    for (const [x, z] of [[-24, -70], [-14, -76], [-4, -70], [6, -77]]){ cylM(B.p(TNK), PK, 3.2, 3.2, -2.4, 11, x, z, 16); latheM(B.p(RUST), PK, [[3.2, 11], [2.2, 11.9], [0.6, 12.3], [0, 12.35]], x, z, 16);
      for (const y of [2.5, 5.5, 8.5]) cylM(B.p(RUST), PK, 3.28, 3.28, y, y + 0.22, x, z, 16); }
    // screw conveyor on its trestle, and a turquoise crane gantry fragment at the north end
    { const x0 = 32, z0 = -61; for (let k = 0; k < 40; k++){ const a = k*0.9, x = x0 + k*0.3; segP(B.p(RUST), PK(x, 2.0 + Math.cos(a)*0.6, z0 + Math.sin(a)*0.6), PK(x + 0.3, 2.0 + Math.cos(a + 0.9)*0.6, z0 + Math.sin(a + 0.9)*0.6), 0.07, 3); }
      segP(B.p(RUST), PK(x0, 2.0, z0), PK(x0 + 12, 2.0, z0), 0.12, 5); for (const x of [x0 + 1, x0 + 11]) segP(B.p(IRN), PK(x, 0.1, z0), PK(x, 1.5, z0), 0.12, 4); }
    for (const x of [52, 64]) for (const z of [-80, -66]) aboxM(B.p(TQ), PK, x - 0.45, x + 0.45, -2.4, 9, z - 0.45, z + 0.45);
    aboxM(B.p(TQ), PK, 51, 65, 9, 10.4, -80.6, -79.4); aboxM(B.p(TQ), PK, 51, 65, 9, 10.4, -66.6, -65.4); aboxM(B.p(TQ), PK, 57, 59, 9.2, 10.8, -80, -66);
    // the waterfront esplanade's tree row and a few lawn trees
    for (const [x, z] of [[-63, -83], [-54, -83], [-45, -83], [-36, -83], [18, -83], [27, -83], [36, -83], [45, -83], [-60, -62], [-48, -66], [14, -64], [44, -72]]){
      cylM(B.p('#5c4a3a'), PK, 0.2, 0.15, -1, 3.2, x, z, 5); latheM(B.p('#6c8a58'), PK, [[0, 2.6], [2.4, 3.6], [2.7, 5.2], [1.7, 6.9], [0, 7.4]], x, z, 7); }
    B.flush(g); return g; }};
SG_PLACES.push({type:'nydomino_b', lat:40.7146171, lon:-73.9680420, rot:1.2288});

// ============================================================================================================================
// Brooklyn Borough Hall (Gamaliel King, 1848; cupola 1898), Greek Revival in white Tuckahoe marble. Model frame: origin =
// footprint centre, rot -0.0918 (local +x ~ east, -z ~ north). OSM: 50 x 32 m, the portico bump on the north face (18.6 m),
// a 15 m recess on the Joralemon Street (south) face; top 41.3 m (the figure of Justice on the cupola). The hexastyle Ionic
// portico and its pediment stand at the head of the broad north stair; three storeys of tall windows on a rusticated base;
// the cupola: a square base, a colonnaded drum, a ribbed dome and a lantern with the figure.
LANDMARKS.nybkborohall = {zh:'布鲁克林区政厅', en:'Brooklyn Borough Hall', cat:'old', r:36, h:41.5,
  lt:{m:0, c:'#ffe3bd', k:1.0, e:0.55},
  build(){
    const g = new THREE.Group(), B = NBat();
    const MAR = '#e3ddd0', MAR2 = '#d2cbbc', MAR3 = '#bfb7a7', WIN = {c:'#3b3c3e', glow:'#ffdcae', gk:0.25}, CUP = {c:'#ece8de', m:0, lc:'#fff0d6', lk:1.4, e:0.7}, DOME = '#9aa29a', GR = '#a39c90';
    const m = B.p(MAR), m2 = B.p(MAR2), m3 = B.p(MAR3), wn = B.p(WIN);
    const X0 = -25, X1 = 25.1, Z0 = -14.6, Z1 = 17.0, YB = 4.6, YC = 19.0, YA = 21.4;
    // base (rusticated), walls, main cornice, attic parapet
    aboxM(m3, ID, X0 - 0.3, X1 + 0.3, -5, YB, Z0 - 0.3, Z1 + 0.3);
    for (let y = 0.8; y < YB - 0.3; y += 0.9) aboxM(m2, ID, X0 - 0.4, X1 + 0.4, y, y + 0.12, Z0 - 0.4, Z1 + 0.4);
    const BODY = [[X0, Z0], [X1, Z0], [X1, Z1], [7.6, Z1], [7.5, 14.2], [-7.5, 14.2], [-7.5, Z1], [X0, Z1]];
    prismM(m, ID, BODY, YB, YC); prismM(m2, ID, offP(BODY, -0.7), YC, YC + 1.0); prismM(m, ID, offP(BODY, -0.1), YC + 1.0, YA); prismM(m2, ID, offP(BODY, -0.3), YA, YA + 0.4);
    bandRing(m2, BODY, YB, 0.6, 0.25); bandRing(m2, BODY, 11.6, 0.3, 0.12);
    // windows: two tall storeys over the base, small attic windows
    const wins = (a, b, n) => { const L = Math.hypot(b[0]-a[0], b[1]-a[1]), ux = (b[0]-a[0])/L, uz = (b[1]-a[1])/L, nx = -uz, nz = ux;   // outward normal for the edges as listed below
      for (let k = 0; k < n; k++){ const t = (k + 0.5)/n*L, x = a[0] + ux*t, z = a[1] + uz*t; const M = (u, v, w) => [x + ux*u - nx*w, v, z + uz*u - nz*w];
        for (const [y0, y1] of [[1.4, 3.6], [6.0, 10.6], [12.6, 17.2]]){ polyFaceM(wn, M, rectR(-0.8, 0.8, y0, y1).map(p => [p[0], p[1]]), -0.06);
          aboxM(m2, M, -1.05, 1.05, y1, y1 + 0.45, -0.25, 0.05); aboxM(m2, M, -1.0, 1.0, y0 - 0.25, y0, -0.25, 0.05); } } };
    wins([X1, Z0], [X0, Z0], 13); wins([X0, Z1], [-7.5, Z1], 4); wins([7.6, Z1], [X1, Z1], 4); wins([X0, Z0], [X0, Z1], 8); wins([X1, Z1], [X1, Z0], 8);
    // north portico: podium, six Ionic columns, entablature, pediment; the broad stair down to the plaza
    const PZ0 = -19.6, PZ1 = Z0;
    aboxM(m3, ID, -10.4, 10.4, -5, YB, PZ0 - 0.6, PZ1);
    for (let k = 0; k < 16; k++){ const z0 = PZ0 - 0.6 - (k + 1)*0.62, y1 = YB - k*YB/16; aboxM(m3, ID, -9.6, 9.6, -2, y1, z0, z0 + 0.62); }
    for (const s of [-1, 1]) aboxM(m2, ID, s*9.6 - 0.9, s*9.6 + 0.9, -2, YB + 0.9, PZ0 - 10.8, PZ0 - 0.6);   // stair cheek walls
    for (let k = 0; k < 6; k++){ const x = -8.3 + k*3.32; cylM(m, ID, 0.62, 0.72, YB + 0.5, YC - 1.1, x, PZ0 + 0.4, 14); boxM(m2, ID, 1.6, 0.5, 1.6, x, YB, PZ0 + 0.4);
      boxM(m2, ID, 1.9, 0.6, 1.25, x, YC - 1.1, PZ0 + 0.4); for (const s of [-1, 1]) cylM(m2, FR(x + s*0.78, 0, PZ0 + 0.4, 0), 0.32, 0.32, YC - 0.95, YC - 0.95 + 0.01, 0, 0, 8); }
    for (const x of [-9.6, 9.6]) aboxM(m, ID, x - 0.7, x + 0.7, YB, YC - 0.5, PZ0 + 1.8, PZ1);
    aboxM(m2, ID, -10.2, 10.2, YC - 0.5, YC + 1.4, PZ0 - 0.4, PZ1); aboxM(m, ID, -10.4, 10.4, YC + 1.4, YC + 2.1, PZ0 - 0.6, PZ1);
    { const P = (x, y, z) => [x, y, z], y0 = YC + 2.1, yt = y0 + 4.2;
      for (const z of [PZ0 - 0.6, PZ1]) triP(m2, P(-10.4, y0, z), P(10.4, y0, z), P(0, yt, z));
      quadP(m, P(-10.6, y0 - 0.1, PZ0 - 0.8), P(0, yt + 0.15, PZ0 - 0.8), P(0, yt + 0.15, PZ1), P(-10.6, y0 - 0.1, PZ1));
      quadP(m, P(0, yt + 0.15, PZ0 - 0.8), P(10.6, y0 - 0.1, PZ0 - 0.8), P(10.6, y0 - 0.1, PZ1), P(0, yt + 0.15, PZ1));
      triP(m3, P(-8.6, y0 + 0.5, PZ0 - 0.45), P(8.6, y0 + 0.5, PZ0 - 0.45), P(0, yt - 0.9, PZ0 - 0.45)); }
    polyFaceM(wn, (u, v, w) => [u, v, PZ0 + 2.0 + w], rectR(-1.4, 1.4, YB + 0.4, YB + 7.5), -0.05);   // main door
    for (const x of [-5, 5]) polyFaceM(wn, (u, v, w) => [x + u, v, PZ0 + 2.0 + w], rectR(-0.9, 0.9, YB + 6.2, YB + 10.2), -0.05);
    // south (Joralemon St) entrance in the recess
    polyFaceM(wn, (u, v, w) => [u, v, 14.2 + 0.06 + w], rectR(-1.5, 1.5, YB + 0.3, YB + 6.0), 0);
    // cupola: square base, colonnaded drum, ribbed dome, lantern, the figure of Justice
    const cp = B.p(CUP); const CX = 0, CZ = 1.2;
    aboxM(cp, ID, -5.2, 5.2, YA, YA + 3.6, CZ - 5.2, CZ + 5.2); aboxM(cp, ID, -5.6, 5.6, YA + 3.6, YA + 4.2, CZ - 5.6, CZ + 5.6);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) boxM(cp, ID, 0.9, 3.6, 0.9, sx*4.9, YA, CZ + sz*4.9);
    cylM(cp, ID, 3.9, 3.9, YA + 4.2, YA + 4.8, CX, CZ, 16); cylM(m3, ID, 2.7, 2.7, YA + 4.8, YA + 10.4, CX, CZ, 16);
    for (let k = 0; k < 12; k++){ const a = k/12*TAU; cylM(cp, ID, 0.22, 0.25, YA + 4.8, YA + 10.4, CX + Math.cos(a)*3.5, CZ + Math.sin(a)*3.5, 6); }
    cylM(cp, ID, 3.9, 3.9, YA + 10.4, YA + 11.3, CX, CZ, 16);
    latheM(B.p(DOME), ID, [[3.6, YA + 11.3], [3.3, YA + 12.6], [2.6, YA + 13.7], [1.5, YA + 14.4], [0.9, YA + 14.6]], CX, CZ, 16);
    for (let k = 0; k < 12; k++){ const a = k/12*TAU; segP(cp, [CX + Math.cos(a)*3.62, YA + 11.3, CZ + Math.sin(a)*3.62], [CX + Math.cos(a)*1.55, YA + 14.4, CZ + Math.sin(a)*1.55], 0.1, 3); }
    cylM(cp, ID, 0.95, 0.85, YA + 14.6, YA + 16.6, CX, CZ, 10); latheM(B.p(DOME), ID, [[1.1, YA + 16.6], [0.9, YA + 17.2], [0.2, YA + 17.6]], CX, CZ, 10);
    figP(B.p(CUP), ID, CX, YA + 17.6, CZ, 2.2, PI, 1);
    // plaza paving and the stair landing
    prismM(B.p(GR), ID, rectR(-14, 14, PZ0 - 12, PZ0 - 10.4), -1, 0.1, true);
    B.flush(g); return g; }};
SG_PLACES.push({type:'nybkborohall', lat:40.6927694, lon:-73.9903047, rot:-0.0918});

// ============================================================================================================================
// Jane's Carousel (Philadelphia Toboggan Co. 1922, restored by Jane Walentas) in Jean Nouvel's 2011 pavilion, Brooklyn Bridge
// Park (Empire Fulton Ferry, between the Brooklyn and Manhattan Bridges). Model frame: origin = pavilion centre, rot 0 (+x east,
// +z south; the river is to the north and west). OSM: a 21.8 m square (72 ft). A clear acrylic box with slender steel mullions
// on a low plinth, a thin flat roof; inside, the carousel: 48 horses in three rows on brass poles, two chariots, the canopy
// with its rounding boards and rows of lamps (lit at night), the centre pole and mirrored drum.
LANDMARKS.nycarousel = {zh:'简的旋转木马', en:"Jane's Carousel", cat:'old', r:17, h:9.6,
  lt:{m:0, c:'#ffe2b0', k:0.7, e:0.7},
  build(){
    const g = new THREE.Group(), B = NBat();
    const PL = '#b9b4a8', GLS = {c:'#d8e8ee', op:0.28, ds:true}, STL = '#6c7176', ROOF = '#e2e2de', ROOFU = '#c8c9c6', WD = '#7a5a3e',
      CAN = {c:'#e9dcc0', glow:'#ffd890', gk:0.55}, LMP = {c:'#fff2c8', glow:'#ffe6a0', gk:1.6}, BRS = '#c8a24a', RED = '#a53a32', HW = '#efe7d6', HB = '#7d5434', HG = '#8c8f93', MIR = '#9fb2bd';
    const H = 10.9, Y0 = 0.9, YR = 8.6;
    aboxM(B.p(PL), ID, -H - 1.2, H + 1.2, -2, Y0, -H - 1.2, H + 1.2);
    // glass walls (clear acrylic) with mullions every 1.8 m, roof slab
    const gl = B.p(GLS);
    for (const [a, b] of [[[-H, -H], [H, -H]], [[H, -H], [H, H]], [[H, H], [-H, H]], [[-H, H], [-H, -H]]]){
      quadP(gl, [a[0], Y0, a[1]], [b[0], Y0, b[1]], [b[0], YR, b[1]], [a[0], YR, a[1]]);
      for (let k = 0; k <= 12; k++){ const t = k/12, x = a[0] + (b[0]-a[0])*t, z = a[1] + (b[1]-a[1])*t; boxM(B.p(STL), ID, 0.14, YR - Y0, 0.14, x, Y0, z); } }
    aboxM(B.p(STL), ID, -H, H, YR - 0.3, YR, -H - 0.08, -H + 0.08); aboxM(B.p(STL), ID, -H, H, YR - 0.3, YR, H - 0.08, H + 0.08);
    aboxM(B.p(STL), ID, -H - 0.08, -H + 0.08, YR - 0.3, YR, -H, H); aboxM(B.p(STL), ID, H - 0.08, H + 0.08, YR - 0.3, YR, -H, H);
    aboxM(B.p(ROOFU), ID, -H - 0.6, H + 0.6, YR, YR + 0.5, -H - 0.6, H + 0.6); aboxM(B.p(ROOF), ID, -H - 0.65, H + 0.65, YR + 0.5, YR + 0.95, -H - 0.65, H + 0.65);
    // the carousel
    cylM(B.p(WD), ID, 7.4, 7.4, Y0, Y0 + 0.45, 0, 0, 32);
    cylM(B.p(MIR), ID, 2.0, 2.0, Y0 + 0.45, 5.4, 0, 0, 12); cylM(B.p(BRS), ID, 0.3, 0.3, 5.4, 7.2, 0, 0, 8);
    latheM(B.p(CAN), ID, [[0, 7.0], [2.2, 6.95], [5.5, 6.3], [7.5, 5.85], [7.6, 5.85]], 0, 0, 32);
    cylM(B.p(RED), ID, 7.6, 7.6, 5.0, 5.85, 0, 0, 32);                // rounding boards
    for (let k = 0; k < 32; k++){ const a = (k + 0.5)/32*TAU; boxM(B.p(LMP), ID, 0.16, 0.16, 0.16, Math.cos(a)*7.66, 5.38, Math.sin(a)*7.66); boxM(B.p(LMP), ID, 0.14, 0.14, 0.14, Math.cos(a)*4.6, 6.62, Math.sin(a)*4.6); }
    cylM(B.p(LMP), ID, 0.25, 0.25, 7.2, 7.5, 0, 0, 8);
    const cols = [HW, HB, HG, HW, HB, HW];
    for (const [rr, n, lift] of [[6.6, 18, 0.2], [5.4, 16, 0.5], [4.2, 14, 0.8]]) for (let k = 0; k < n; k++){
      const a = (k + (rr > 6 ? 0 : 0.5))/n*TAU; const x = Math.cos(a)*rr, z = Math.sin(a)*rr;
      if (rr > 6 && (k === 4 || k === 13)){ aboxM(B.p(RED), FR(x, 0, z, -a), -0.6, 0.6, Y0 + 0.45, Y0 + 1.6, -1.1, 1.1); continue; }   // chariots
      segP(B.p(BRS), [x, Y0 + 0.45, z], [x, 5.0, z], 0.035, 4);
      horseP(B.p(cols[(k + Math.round(rr)) % cols.length]), ID, x, Y0 + 0.75 + lift*((k % 2) ? 1 : 0.4), z, 1.7, -a, k % 3 === 0 ? 0.6 : 0.2); }
    B.flush(g); return g; }};
SG_PLACES.push({type:'nycarousel', lat:40.7044342, lon:-73.9923840, rot:0});

// ============================================================================================================================
// Green-Wood Cemetery main gate (Richard Upjohn & Son, 1861-65), Fifth Avenue at 25th Street - accurate, respectful
// architecture only. Model frame: origin = OSM centroid, rot 0.1526: local +x along the gate (east-north-east), -z towards the
// street, +z into the cemetery. From the OSM outline: the office building on the west (x -22..-3), the gate itself (x -0.7..18)
// with two pointed-arch carriageways either side of the central pier and tower, the side piers, an octagonal tower (x 20..26)
// and a short wing (to x 32). Belleville brownstone, steep gables over the arches with the carved panels (plain relief here),
// pinnacles, the openwork central spire, polychrome slate roofs.
LANDMARKS.nygreenwood = {zh:'绿荫公墓正门', en:'Green-Wood Cemetery Gate', cat:'old', r:34, h:33,
  lt:{m:0, c:'#ffd9a8', k:0.75, e:0.6},
  build(){
    const g = new THREE.Group(), B = NBat();
    const BS = '#7b5545', BS2 = '#68473a', BS3 = '#8e6957', SL = '#4c4f58', SL2 = '#7a6a66', DK = '#26201e', REL = '#9a7c68', PAV = '#9b958b';
    const bs = B.p(BS), b2 = B.p(BS2), b3 = B.p(BS3), dk = B.p(DK);
    const ZF = -3.0, ZB = 1.0;          // gate wall faces (street / cemetery)
    // paving through the gate and foundations
    prismM(B.p(PAV), ID, rectR(-1, 18.4, -9, 8), -0.5, 0.06, true);
    aboxM(b2, ID, -22.4, -2.8, -4, 0.3, -4.2, 6.4); aboxM(b2, ID, -2.8, 32.2, -4, 0.3, -3.6, 0.6); aboxM(b2, ID, 20.2, 26.4, -4, 0.3, -4.4, 2.0);
    // ---- the gate: piers, two pointed carriageway arches, gables with relief panels
    const piers = [[-0.7, 2.1], [7.4, 9.9], [15.2, 18.0]];
    for (const [x0, x1] of piers){ aboxM(bs, ID, x0, x1, 0, 11.0, ZF - 1.0, ZB + 1.0); aboxM(b2, ID, x0 - 0.2, x1 + 0.2, 0, 1.0, ZF - 1.2, ZB + 1.2);
      for (const z of [ZF - 1.0, ZB + 1.0]) aboxM(b3, ID, x0 + 0.3, x1 - 0.3, 1.0, 10.0, z - 0.25, z + 0.25); }   // buttress faces
    for (const [xc, hw] of [[4.75, 2.65], [12.55, 2.65]]){
      for (const z of [ZF, ZB]){ const M = (u, v, w) => [xc + u, v, z + w];
        // wall face with the pointed carriageway opening (springing 5.2 m, apex 8.5 m)
        const ar = gothA(0, hw - 0.15, 0, 5.2, 3.3, 6); holeWallM(bs, M, [[-hw, 0.02], [hw, 0.02], [hw, 9.4], [-hw, 9.4]], ar.slice(1).concat([ar[0]]).filter((p, i, A) => i === 0 || Math.hypot(p[0] - A[i-1][0], p[1] - A[i-1][1]) > 1e-3).map(p => [p[0], Math.max(0.05, p[1])]), -0.2, 0.2);
        // pointed hood moulding over the arch
        { const hm = gothA(0, hw + 0.25, 0, 5.2, 3.75, 6).slice(2); for (let i = 0; i < hm.length - 1; i++) segP(b3, M(hm[i][0], hm[i][1], z < 0 ? -0.3 : 0.3), M(hm[i+1][0], hm[i+1][1], z < 0 ? -0.3 : 0.3), 0.16, 4); }

        // gable over the arch with the carved panel and finial
        const gz = z + (z < 0 ? -0.4 : 0.4); plateM(bs, (u, v, w) => [xc + u, v, gz + w], [[-hw - 0.4, 9.4], [hw + 0.4, 9.4], [0, 15.2]], -0.35, 0.35);
        plateM(b3, (u, v, w) => [xc + u, v, gz + w], [[-hw - 0.7, 9.2], [-hw - 0.4, 9.2], [0, 15.4], [0, 15.8]], -0.45, 0.45);
        plateM(b3, (u, v, w) => [xc + u, v, gz + w], [[hw + 0.7, 9.2], [hw + 0.4, 9.2], [0, 15.4], [0, 15.8]], -0.45, 0.45);
        plateM(B.p(REL), (u, v, w) => [xc + u, v, gz + w], gothA(0, 1.6, 9.9, 11.0, 2.4, 4), z < 0 ? -0.5 : 0.36, z < 0 ? -0.36 : 0.5); }
      // vault soffit through the gate
      aboxM(dk, ID, xc - hw + 0.1, xc + hw - 0.1, 8.35, 8.5, ZF, ZB); aboxM(b2, ID, xc - hw, xc + hw, 9.4, 9.9, ZF - 0.6, ZB + 0.6);
      // roof between the two gables
      { const P = (u, v, w) => [xc + u, v, w]; quadP(B.p(SL), P(-hw - 0.4, 9.4, ZF - 0.4), P(0, 15.2, ZF - 0.4), P(0, 15.2, ZB + 0.4), P(-hw - 0.4, 9.4, ZB + 0.4));
        quadP(B.p(SL), P(0, 15.2, ZF - 0.4), P(hw + 0.4, 9.4, ZF - 0.4), P(hw + 0.4, 9.4, ZB + 0.4), P(0, 15.2, ZB + 0.4)); } }
    // side-pier pinnacles
    for (const xc of [0.7, 16.6]){ aboxM(bs, ID, xc - 1.1, xc + 1.1, 11.0, 15.5, ZF - 0.6, ZB + 0.6); for (const z of [ZF - 0.6, ZB + 0.6]) plateM(dk, (u, v, w) => [xc + u, v, z + w], gothA(0, 0.45, 12.0, 13.6, 1.0, 3), -0.05, 0.05);
      latheM(b3, ID, [[1.5, 15.5], [1.5, 16.1], [0, 22.5]], xc, (ZF + ZB)/2, 4, PI/4, PI/4 + TAU); }
    // ---- central tower and the openwork spire (to ~32 m)
    { const xc = 8.65, zc = (ZF + ZB)/2;
      aboxM(bs, ID, xc - 1.9, xc + 1.9, 11.0, 19.5, zc - 3.0, zc + 3.0); aboxM(b2, ID, xc - 2.1, xc + 2.1, 19.5, 20.2, zc - 3.2, zc + 3.2);
      for (const z of [zc - 3.0, zc + 3.0]) plateM(dk, (u, v, w) => [xc + u, v, z + w], gothA(0, 1.0, 13.0, 16.4, 2.2, 4), -0.06, 0.06);
      for (const x of [xc - 1.9, xc + 1.9]) plateM(dk, (u, v, w) => [x + w, v, zc + u], gothA(0, 1.6, 13.0, 16.4, 2.2, 4), -0.06, 0.06);
      // belfry stage: four corner shafts, open arches, gablets
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) aboxM(bs, ID, xc + sx*1.75 - 0.35, xc + sx*1.75 + 0.35, 20.2, 24.5, zc + sz*2.0 - 0.35, zc + sz*2.0 + 0.35);
      for (const z of [zc - 2.0, zc + 2.0]) plateM(bs, (u, v, w) => [xc + u, v, z + w], [[-2.1, 24.0], [2.1, 24.0], [0, 26.3]], -0.25, 0.25);
      for (const x of [xc - 1.75, xc + 1.75]) plateM(bs, (u, v, w) => [x + w, v, zc + u], [[-2.4, 24.0], [2.4, 24.0], [0, 26.3]], -0.25, 0.25);
      aboxM(b2, ID, xc - 2.1, xc + 2.1, 24.0, 24.5, zc - 2.4, zc + 2.4);
      latheM(B.p(SL), ID, [[2.0, 24.5], [1.6, 26.0], [0, 32.6]], xc, zc, 8, PI/8, PI/8 + TAU);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) latheM(b3, ID, [[0.35, 24.5], [0, 27.4]], xc + sx*1.75, zc + sz*2.0, 4);
      segP(B.p(DK), [xc, 32.4, zc], [xc, 33.2, zc], 0.05, 4); }
    // ---- the office building (west): one storey under a steep polychrome slate roof, dormers, chimneys
    { const x0 = -22.2, x1 = -3.0, z0 = -4.0, z1 = 6.2, yw = 5.2, yr = 12.5, zm = (z0 + z1)/2;
      aboxM(bs, ID, x0, x1, 0, yw, z0, z1); aboxM(b2, ID, x0 - 0.2, x1 + 0.2, yw - 0.4, yw, z0 - 0.3, z1 + 0.3);
      for (const z of [z0 - 0.04, z1 + 0.04]) for (let x = x0 + 2.2; x < x1 - 1.5; x += 3.2) polyFaceM(dk, (u, v, w) => [x + u, v, z + w], gothA(0, 0.7, 1.2, 3.0, 1.2, 3), 0);
      const sl = B.p(SL), s2 = B.p(SL2);
      for (const [za, zb] of [[z0 - 0.4, zm], [z1 + 0.4, zm]]) for (let y = yw; y < yr - 0.01; y += (yr - yw)/7){ const t0 = (y - yw)/(yr - yw), t1 = Math.min(1, t0 + 1/7), k = Math.round(t0*7);
        const zA = lerp(za, zb, t0), zB = lerp(za, zb, t1), yA = y, yB = yw + (yr - yw)*t1; quadP(k % 3 === 1 ? s2 : sl, [x0 - 0.3, yA, zA], [x1 + 0.3, yA, zA], [x1 + 0.3, yB, zB], [x0 - 0.3, yB, zB]); }
      for (const x of [x0 - 0.3, x1 + 0.3]) plateM(bs, (u, v, w) => [x + w, v, u], [[z0 - 0.4, yw], [z1 + 0.4, yw], [zm, yr]], -0.15, 0.15);
      for (const x of [-17, -8]) { aboxM(bs, ID, x - 1.1, x + 1.1, yw, yw + 2.6, z0 - 0.2, z0 + 1.6); plateM(bs, (u, v, w) => [x + u, v, z0 - 0.2 + w], [[-1.3, yw + 2.6], [1.3, yw + 2.6], [0, yw + 4.2]], -0.1, 1.8); }
      aboxM(b2, ID, -20.6, -19.4, 9, 14.2, zm - 0.6, zm + 0.6); aboxM(b2, ID, -6.2, -5.0, 9, 14.2, zm - 0.6, zm + 0.6);
      // connecting wall to the gate
      aboxM(bs, ID, x1, -0.7, 0, 4.2, ZF + 0.6, ZB - 0.6); }
    // ---- east: wall, octagonal tower with spirelet, the short wing
    aboxM(bs, ID, 18.0, 20.5, 0, 6.0, ZF + 0.4, ZB - 0.4);
    { const xc = 23.3, zc = -1.2; latheM(bs, ID, [[3.0, 0], [3.0, 13.0]], xc, zc, 8, PI/8, PI/8 + TAU); latheM(b2, ID, [[3.25, 13.0], [3.25, 13.6], [0, 13.6]], xc, zc, 8, PI/8, PI/8 + TAU);
      latheM(B.p(SL), ID, [[2.9, 13.6], [0, 21.0]], xc, zc, 8, PI/8, PI/8 + TAU);
      for (let k = 0; k < 8; k++){ const a = PI/8 + (k + 0.5)/8*TAU; const x = xc + Math.cos(a)*2.95, z = zc + Math.sin(a)*2.95; plateM(dk, (u, v, w) => [x + Math.cos(a + HP)*u + Math.cos(a)*w, v, z + Math.sin(a + HP)*u + Math.sin(a)*w], gothA(0, 0.45, 8.6, 10.6, 1.0, 3), 0, 0.06); } }
    aboxM(bs, ID, 26.2, 32.0, 0, 4.6, -3.4, 0.3); latheM(B.p(SL), FR(29.1, 0, -1.55, 0), [[0, 4.6]], 0, 0, 4);
    { const P = (x, y, z) => [x, y, z], sl = B.p(SL); quadP(sl, P(26.2, 4.6, -3.7), P(32.2, 4.6, -3.7), P(32.2, 7.2, -1.55), P(26.2, 7.2, -1.55)); quadP(sl, P(32.2, 4.6, 0.6), P(26.2, 4.6, 0.6), P(26.2, 7.2, -1.55), P(32.2, 7.2, -1.55));
      triP(bs, P(32.0, 4.6, -3.4), P(32.0, 4.6, 0.3), P(32.0, 7.0, -1.55)); }
    B.flush(g); return g; }};
SG_PLACES.push({type:'nygreenwood', lat:40.6580938, lon:-73.9947189, rot:0.1526});

// ============================================================================================================================
// Prospect Park Boathouse (Helmle & Huberty, 1905), white glazed terracotta after Sansovino's library in Venice, on the east
// shore of the Lullwater. Model frame: origin = OSM centre, rot -0.1173 (local +x ~ east to the drive, -x to the water,
// +z ~ south). OSM: 12.3 x 31.6 m, 11.4 m. Lower storey: the open arcade of seven round arches on Tuscan columns facing the
// water over the landing terrace; upper storey: arched windows between paired columns; entablature, balustrade, low roof.
LANDMARKS.nyboathouse = {zh:'展望公园船屋', en:'Prospect Park Boathouse', cat:'old', r:20, h:12,
  lt:{m:0, c:'#ffe7c6', k:0.95, e:0.6},
  build(){
    const g = new THREE.Group(), B = NBat();
    const TC = '#f0ede5', TC2 = '#dcd6c9', TC3 = '#c8c1b2', DK = {c:'#3b3c3f', glow:'#ffd9a0', gk:0.3}, RF = '#7f8c86', STN = '#a39d92', WAT = '#5d6f6c';
    const t = B.p(TC), t2 = B.p(TC2), t3 = B.p(TC3), dk = B.p(DK);
    const X0 = -6.1, X1 = 6.1, Z0 = -15.8, Z1 = 15.6, Y1 = 5.0, Y2 = 9.6;
    aboxM(B.p(STN), ID, X0 - 4.4, X1 + 0.2, -3.5, 0.15, Z0 - 0.6, Z1 + 0.6);      // base and the landing terrace on the water side
    for (let k = 0; k < 5; k++) aboxM(B.p(STN), ID, X0 - 4.4 - (k + 1)*0.45, X0 - 4.4 - k*0.45, -3.5, 0.15 - (k + 1)*0.3, -6, 6);   // steps to the water
    for (const z of [Z0 - 0.6, Z1 + 0.6]) aboxM(t2, ID, X0 - 4.4, X0, 0.15, 1.1, z - 0.15, z + 0.15);
    aboxM(t2, ID, X0 - 4.5, X0 - 4.2, 0.15, 1.1, Z0 - 0.6, -6); aboxM(t2, ID, X0 - 4.5, X0 - 4.2, 0.15, 1.1, 6, Z1 + 0.6);
    // body: the arcade is a 3 m deep loggia on the west; walls elsewhere
    aboxM(t, ID, X0 + 3.0, X1, 0.15, Y2, Z0, Z1);
    aboxM(dk, ID, X0 + 2.95, X0 + 3.0, 0.15, Y1 - 0.2, Z0 + 1.5, Z1 - 1.5);
    aboxM(t, ID, X0, X0 + 3.0, Y1 - 0.6, Y1 + 0.35, Z0, Z1);                  // the arcade canopy = the second-floor terrace
    for (let z = Z0 + 0.4; z < Z1 - 0.2; z += 0.42) cylM(t, ID, 0.1, 0.13, Y1 + 0.35, Y1 + 1.0, X0 + 0.05, z, 5);
    aboxM(t2, ID, X0 - 0.12, X0 + 0.22, Y1 + 1.0, Y1 + 1.2, Z0, Z1); for (let k = 0; k <= 7; k++) boxM(t2, ID, 0.42, 0.85, 0.42, X0 + 0.05, Y1 + 0.35, Z0 + 0.2 + k*(Z1 - Z0 - 0.4)/7);
    for (let z = Z0 + 0.6; z < Z1; z += 1.2) aboxM(t3, ID, X0 - 0.08, X0, Y1 - 0.55, Y1 - 0.1, z - 0.2, z + 0.2);   // triglyphs
    const nb = 7, bw = (Z1 - Z0)/nb;
    for (let k = 0; k <= nb; k++){ const z = Z0 + k*bw; aboxM(t, ID, X0, X0 + 3.0, 0.15, Y1 - 0.6, z - 0.55, z + 0.55); cylM(t2, ID, 0.26, 0.29, 0.5, 3.4, X0 - 0.35, z, 10); boxM(t3, ID, 0.8, 0.35, 0.8, X0 - 0.35, 0.15, z); boxM(t3, ID, 0.75, 0.3, 0.75, X0 - 0.35, 3.4, z); }
    for (let k = 0; k < nb; k++){ const zc = Z0 + (k + 0.5)*bw, hw = bw/2 - 0.55; const M = (u, v, w) => [X0 + w, v, zc + u];
      archPanel(t, M, bw/2 - 0.55, 3.0, hw, Y1 - 0.6, 0, 8); archPanel(t, M, bw/2 - 0.55, 3.0, hw, Y1 - 0.6, 0.4, 8); arcBand(t3, M, hw, hw + 0.25, 3.0, -0.12, 0.05, 8); }
    aboxM(t2, ID, X0 - 0.2, X1 + 0.2, Y1 - 0.6, Y1, Z0 - 0.2, Z1 + 0.2);       // string course
    // upper storey: arched windows between paired columns (west and east), end bays
    for (const [x, s] of [[X0 + 3.0, -1], [X1, 1]]) for (let k = 0; k < nb; k++){ const zc = Z0 + (k + 0.5)*bw; const M = (u, v, w) => [x + s*w, v, zc + u];
      polyFaceM(dk, M, roundA(0, 0.85, s < 0 ? Y1 + 0.35 : Y1 + 0.6, Y2 - 1.9, 6), 0.04); arcBand(t3, M, 0.85, 1.05, Y2 - 1.9, -0.02, 0.12, 6);
      for (const dz of [-1, 1]) for (const dd of [0.95, 1.45]){ const z = zc + dz*(bw/2 - 0.05) - dz*dd + dz*0.9; cylM(t2, ID, 0.13, 0.15, Y1, Y2 - 0.4, x + s*0.12, z, 8); } }
    for (const z of [Z0, Z1]) for (const xc of [-0.2, 3.2]) polyFaceM(dk, (u, v, w) => [xc + u, v, z + (z < 0 ? -w : w)], roundA(0, 0.8, Y1 + 0.6, Y2 - 1.9, 6), 0.04);
    for (const z of [Z0, Z1]) polyFaceM(dk, (u, v, w) => [u, v, z + (z < 0 ? -w : w)], roundA(0, 1.0, 0.3, 2.6, 6), 0.04);
    // entablature, balustrade with urns, low copper roof
    const XU = X0 + 3.0;
    aboxM(t2, ID, XU - 0.45, X1 + 0.45, Y2 - 0.4, Y2 + 0.5, Z0 - 0.45, Z1 + 0.45); aboxM(t3, ID, XU - 0.6, X1 + 0.6, Y2 + 0.5, Y2 + 0.8, Z0 - 0.6, Z1 + 0.6);
    for (const [a, b] of [[[XU - 0.4, Z0 - 0.4], [X1 + 0.4, Z0 - 0.4]], [[X1 + 0.4, Z0 - 0.4], [X1 + 0.4, Z1 + 0.4]], [[X1 + 0.4, Z1 + 0.4], [XU - 0.4, Z1 + 0.4]], [[XU - 0.4, Z1 + 0.4], [XU - 0.4, Z0 - 0.4]]]){
      const L = Math.hypot(b[0]-a[0], b[1]-a[1]), n = Math.round(L/0.42);
      for (let k = 0; k <= n; k++){ const x = a[0] + (b[0]-a[0])*k/n, z = a[1] + (b[1]-a[1])*k/n; cylM(t, ID, 0.1, 0.13, Y2 + 0.8, Y2 + 1.45, x, z, 5); }
      aboxM(t2, ID, Math.min(a[0], b[0]) - 0.15, Math.max(a[0], b[0]) + 0.15, Y2 + 1.45, Y2 + 1.65, Math.min(a[1], b[1]) - 0.15, Math.max(a[1], b[1]) + 0.15); }
    for (const x of [XU - 0.4, X1 + 0.4]) for (let k = 0; k <= nb; k++){ const z = Z0 - 0.4 + (Z1 - Z0 + 0.8)*k/nb; boxM(t2, ID, 0.5, 0.95, 0.5, x, Y2 + 0.8, z); }
    { const XM = (XU + X1)/2, P = (x, y, z) => [x, y, z], r = B.p(RF), yb = Y2 + 0.8, yt = Y2 + 2.0;
      quadP(r, P(XU + 0.4, yb, Z0 + 0.4), P(X1 - 0.4, yb, Z0 + 0.4), P(XM + 1.2, yt, Z0 + 3), P(XM - 1.2, yt, Z0 + 3)); quadP(r, P(X1 - 0.4, yb, Z1 - 0.4), P(XU + 0.4, yb, Z1 - 0.4), P(XM - 1.2, yt, Z1 - 3), P(XM + 1.2, yt, Z1 - 3));
      quadP(r, P(X1 - 0.4, yb, Z0 + 0.4), P(X1 - 0.4, yb, Z1 - 0.4), P(XM + 1.2, yt, Z1 - 3), P(XM + 1.2, yt, Z0 + 3)); quadP(r, P(XU + 0.4, yb, Z1 - 0.4), P(XU + 0.4, yb, Z0 + 0.4), P(XM - 1.2, yt, Z0 + 3), P(XM - 1.2, yt, Z1 - 3));
      quadP(r, P(XM - 1.2, yt, Z0 + 3), P(XM + 1.2, yt, Z0 + 3), P(XM + 1.2, yt, Z1 - 3), P(XM - 1.2, yt, Z1 - 3)); }
    B.flush(g); return g; }};
SG_PLACES.push({type:'nyboathouse', lat:40.6608233, lon:-73.9652805, rot:-0.1173});

// ============================================================================================================================
// Kings Theatre (Rapp & Rapp, 1929; restored 2015), the French Renaissance movie palace at 1027 Flatbush Avenue. Model frame:
// origin = OSM centroid, rot 0.0771 (local +x ~ east; the Flatbush Avenue front faces -x at x = -52.2). OSM: the 12-14 m wide
// lobby wing from Flatbush (roof 11.6 m) into the 26 m auditorium, which extends to the north-east; the stage house (30 m, 2015)
// at the north-east end. Front: three bays of cream terracotta, the semicircular arch with its mouldings round a bas-relief in
// the centre bay, decorated pilasters in the outer bays, the parapet with the segmental broken pediment, medallion and corner
// finials; the segmental-arched brass-and-glass storefront; the restored marquee hung on two rods, its bulb borders lit and its
// panels plain (no letters). Buff brick auditorium with a stone cornice.
LANDMARKS.nykingstheatre = {zh:'国王剧院', en:'Kings Theatre', cat:'old', r:64, h:30.5,
  lt:{m:0, c:'#ffdcae', k:0.8, e:0.5},
  build(){
    const g = new THREE.Group(), B = NBat();
    const TC = {c:'#eadcc0', m:0, lc:'#ffe2b8', lk:1.2, e:0.6}, TC2 = '#d4c4a3', TC3 = '#bba886', BRK = '#9f7457', BRK2 = '#86604a', DK = {c:'#3a3128', glow:'#ffd08a', gk:0.6},
      MQ = {c:'#f3eadb', glow:'#fff0cf', gk:0.9}, BULB = {c:'#fff6d0', glow:'#ffe39a', gk:2.0}, RF = '#5e5a55', BRZ = '#8c6a3c';
    const RING = [[-51.9,-3.7],[-36.3,-3.3],[-36.1,-7.9],[-22.2,-7.5],[-22.0,-13.0],[-9.7,-24.6],[0.9,-28.7],[6.9,-29.7],[12.3,-33.3],[12.4,-37.6],[28.5,-37.1],[37.0,-28.6],[36.5,-6.5],[31.4,-3.3],[30.3,2.0],[25.6,13.2],[17.0,21.0],[32.1,20.9],[32.1,29.9],[-31.5,29.9],[-31.0,10.8],[-52.2,10.2]];
    const AUD = [[-22.0,-13.0],[-9.7,-24.6],[0.9,-28.7],[6.9,-29.7],[12.3,-33.3],[12.4,-37.6],[28.5,-37.1],[37.0,-28.6],[36.5,-6.5],[31.4,-3.3],[30.3,2.0],[25.6,13.2],[17.0,21.0],[32.1,20.9],[32.1,29.9],[-22.0,29.9]];
    const STG = [[12.4,-37.6],[28.5,-37.1],[37.0,-28.6],[36.7,-14.0],[12.4,-14.0]];
    prismM(B.p(BRK2), ID, offP(RING, -0.2), -5, 0.6); prismM(B.p(BRK), ID, RING, 0.6, 11.0); prismM(B.p(TC3), ID, offP(RING, -0.3), 11.0, 11.6);
    prismM(B.p(BRK), ID, AUD, 11.6, 25.2); prismM(B.p(TC2), ID, offP(AUD, -0.4), 25.2, 26.0); prismM(B.p(RF), ID, offP(AUD, 0.5), 26.0, 26.3);
    prismM(B.p(BRK2), ID, offP(STG, 0.6), 26.0, 30.0); prismM(B.p(TC3), ID, offP(STG, 0.3), 30.0, 30.4);
    for (const y of [6, 19]) bandRing(B.p(TC3), AUD, y, 0.4, 0.08);
    // ---- the Flatbush Avenue front (x = -52.2, facing -x): three storeys of terracotta to the parapet
    const FX = -52.2, Z0 = -3.7, Z1 = 10.2, ZC = (Z0 + Z1)/2;
    const F = (u, v, w) => [FX - w, v, ZC + u];     // facade frame: u across (z), v up, w outwards (-x)
    const tc = B.p(TC), t2 = B.p(TC2), t3 = B.p(TC3), dk = B.p(DK);
    aboxM(tc, F, -7.0, 7.0, 0.6, 14.2, -0.6, 0.3);
    // centre bay: the great semicircular arch with its mouldings, the bas-relief panel inside
    polyFaceM(t3, F, roundA(0, 3.0, 5.4, 9.8, 12), 0.32); arcBand(t2, F, 3.0, 3.7, 9.8, 0.3, 0.75, 12);
    for (const s of [-1, 1]) aboxM(t2, F, s*3.35 - 0.35, s*3.35 + 0.35, 5.4, 9.8, 0.3, 0.75);
    plateM(t2, F, [[-2.0, 6.2], [2.0, 6.2], [2.0, 9.6], [1.2, 11.4], [0, 12.0], [-1.2, 11.4], [-2.0, 9.6]], 0.32, 0.55);   // relief (plain)
    // outer bays: decorated pilasters, small windows
    for (const u of [-6.3, -4.6, 4.6, 6.3]) aboxM(t2, F, u - 0.42, u + 0.42, 4.6, 13.4, 0.3, 0.7);
    for (const u of [-5.45, 5.45]) for (const v of [7.0, 10.4]) polyFaceM(dk, F, rectR(-0.35, 0.35, v, v + 1.8), 0.32);
    aboxM(t3, F, -7.3, 7.3, 13.4, 14.2, 0.3, 1.0);                                          // cornice
    // parapet: segmental broken pediment with the medallion, corner finials
    aboxM(tc, F, -7.0, 7.0, 14.2, 15.0, 0.2, 0.6);
    for (const s of [-1, 1]){ const P = []; for (let i = 0; i <= 5; i++){ const a = (0.5 + 0.5*i/5)*PI*0.5; P.push([s*(0.9 + (4.2 - 0.9)*i/5), 15.0 + 1.6*Math.sin(PI/2 - (i/5)*PI/2)*0 + (1.7 - 1.7*(i/5)*(i/5))]); }
      plateM(t2, F, [[s*0.9, 15.0]].concat(P).concat([[s*4.2, 15.0]]), 0.15, 0.7); }
    discM(t3, F, 0, 16.0, 0.6, 0.8, 0.75, 12);
    for (const u of [-6.8, 6.8]) latheM(t2, F, [[0.38, 15.0], [0.46, 15.5], [0.22, 16.3], [0, 16.7]], u, -0.45, 6);
    // the segmental-arched brass-and-glass storefront and the frieze above it
    { const P = [[-5.6, 0.6], [5.6, 0.6]]; for (let i = 0; i <= 8; i++){ const a = i/8; P.push([5.6 - 11.2*a, 4.0 + 0.6*Math.sin(a*PI)]); } polyFaceM(dk, F, P, 0.32); }
    for (const u of [-3.4, -1.1, 1.1, 3.4]) aboxM(B.p(BRZ), F, u - 0.08, u + 0.08, 0.6, 4.3, 0.32, 0.42);
    // marquee (plain light panels, bulb borders), hung from the facade on two rods
    const MY0 = 4.9, MY1 = 7.2, MW = 4.8;
    aboxM(B.p(MQ), F, -6.9, 6.9, MY0, MY1, 0.6, MW); aboxM(B.p(RF), F, -7.0, 7.0, MY1, MY1 + 0.3, 0.6, MW + 0.1);
    for (const s of [-1, 1]) segP(B.p(BRZ), F(s*5.5, 12.0, 0.6), F(s*5.5, MY1 + 0.3, MW - 0.4), 0.06, 4);
    for (let u = -6.9; u <= 6.95; u += 0.46) for (const v of [MY0 + 0.15, MY1 - 0.15]) boxM(B.p(BULB), F, 0.12, 0.12, 0.12, u, v, MW + 0.05);
    for (let w = 1.0; w <= MW; w += 0.46) for (const v of [MY0 + 0.15, MY1 - 0.15]) for (const u of [-6.95, 6.95]) boxM(B.p(BULB), F, 0.12, 0.12, 0.12, u, v, w);
    for (let u = -6.5; u <= 6.5; u += 0.9) for (let w = 1.2; w < MW - 0.3; w += 0.9) boxM(B.p(BULB), F, 0.1, 0.05, 0.1, u, MY0 - 0.05, w);    // soffit bulbs
    B.flush(g); return g; }};
SG_PLACES.push({type:'nykingstheatre', lat:40.6459849, lon:-73.9573213, rot:0.0771});

// ============================================================================================================================
// Gantry Plaza State Park, Hunters Point (Long Island City): the restored 1925 "contained apron" transfer-bridge gantries of
// the Long Island Rail Road car-float terminal, their aprons in the slips and the piers either side - the structures only,
// without the lettering carried on top. Two keys, each with its own frame (rot -0.2475: local +x east towards the land, -x
// out along the slip to the East River, z along the gantry beam): nygantry = the southern double gantry (OSM 3 x 29 m beam,
// 17.3 m, machinery house on the land side) with its two piers; nygantry_b = the northern pair of portal gantries (OSM 4 x 38 m,
// 15.9 m) at the head of the U-shaped slip pier. Black-painted riveted steel: lattice towers, box-truss top girders, sheave
// frames, counterweights and hoist cables down to the aprons; timber pier decks on piles.
const nyGantry = (B, o) => {
  const STL = B.p('#2b2d2f'), ST2 = B.p('#3d4043'), CW = B.p('#4a4846'), CAB = B.p('#1d1e1f'), DECK = B.p('#8a7a66'), DK2 = B.p('#6b5d4e'), PILE = B.p('#4f463e'),
    APR = B.p('#55595c'), RAIL = B.p('#77706a'), LMP = B.p({c:'#fff2cc', glow:'#ffe2a0', gk:1.2});
  const XC = o.xc || 0, YT = o.top, TW = 2.6;
  // lattice towers
  const tower = (z) => { const x0 = XC - TW/2, x1 = XC + TW/2, z0 = z - TW/2, z1 = z + TW/2, y1 = YT - 3.4;
    aboxM(ST2, ID, x0 - 0.6, x1 + 0.6, -3, 0.6, z0 - 0.6, z1 + 0.6);
    for (const [x, zz] of [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]) boxM(STL, ID, 0.34, y1 - 0.6, 0.34, x, 0.6, zz);
    for (let y = 0.6; y < y1 - 0.1; y += 2.4){ const y2 = Math.min(y1, y + 2.4);
      for (const [a, b] of [[[x0, z0], [x1, z0]], [[x1, z0], [x1, z1]], [[x1, z1], [x0, z1]], [[x0, z1], [x0, z0]]]){
        segP(STL, [a[0], y, a[1]], [b[0], y2, b[1]], 0.07, 3); segP(STL, [b[0], y, b[1]], [a[0], y2, a[1]], 0.07, 3); segP(STL, [a[0], y2, a[1]], [b[0], y2, b[1]], 0.08, 3); } }
    // counterweight box hanging inside the tower and its sheave
    aboxM(CW, ID, x0 + 0.5, x1 - 0.5, y1 - 7.5, y1 - 4.0, z0 + 0.5, z1 - 0.5);
    cylM(ST2, (u, v, w) => [XC + w, v, z + u], 0.9, 0.9, -0.15, 0.15, 0, y1 + 0.6, 10); };
  for (const z of o.towers) tower(z);
  // top box truss along the beam (OSM outline), with walkway rails
  { const z0 = o.z0, z1 = o.z1, x0 = XC - 1.6, x1 = XC + 1.6, ya = YT - 3.4, yb = YT - 0.4;
    for (const x of [x0, x1]) for (const y of [ya, yb]) aboxM(STL, ID, x - 0.2, x + 0.2, y - 0.3, y + 0.3, z0, z1);
    const n = Math.round((z1 - z0)/2.4);
    for (let k = 0; k <= n; k++){ const z = z0 + (z1 - z0)*k/n; for (const x of [x0, x1]) boxM(STL, ID, 0.22, yb - ya, 0.22, x, ya, z);
      if (k < n){ const z2 = z0 + (z1 - z0)*(k + 1)/n; for (const x of [x0, x1]) segP(STL, [x, ya, k % 2 ? z : z2], [x, yb, k % 2 ? z2 : z], 0.09, 3); boxM(STL, ID, x1 - x0, 0.15, 0.2, XC, yb + 0.25, z); } }
    aboxM(ST2, ID, x0, x1, yb + 0.3, yb + 0.42, z0, z1);
    for (const x of [x0 - 0.1, x1 + 0.1]) aboxM(STL, ID, x - 0.04, x + 0.04, yb + 0.42, yb + 1.5, z0, z1);
    if (o.house) aboxM(ST2, ID, o.house[0], o.house[1], yb + 0.42, YT + 2.0, o.house[2], o.house[3]);
    for (const z of [z0 + 0.5, z1 - 0.5]) boxM(LMP, ID, 0.3, 0.3, 0.3, XC, yb + 1.6, z); }
  // hoist cables from the girder down to the aprons' outer ends, and the aprons in the slip
  for (const [za, zb] of o.aprons){ const zc = (za + zb)/2, w = zb - za, xr = o.xr, xl = o.xl;
    const P = (x, y, z) => [x, y, z];
    const yL = o.yl, yR = o.yr;
    // deck and side girders (sloping from the land end down to the float end)
    quadP(APR, P(xl, yL, za + 0.6), P(xl, yL, zb - 0.6), P(xr, yR, zb - 0.6), P(xr, yR, za + 0.6));
    for (const z of [za + 0.3, zb - 0.3]){ hexP(STL, [P(xl, yL - 1.3, z - 0.3), P(xr, yR - 1.3, z - 0.3), P(xr, yR - 1.3, z + 0.3), P(xl, yL - 1.3, z + 0.3), P(xl, yL + 0.5, z - 0.3), P(xr, yR + 0.5, z - 0.3), P(xr, yR + 0.5, z + 0.3), P(xl, yL + 0.5, z + 0.3)]); }
    for (const dz of [-1.9, -0.45, 0.45, 1.9]){ const z = zc + dz*(w/12); hexP(RAIL, [P(xl, yL, z - 0.06), P(xr, yR, z - 0.06), P(xr, yR, z + 0.06), P(xl, yL, z + 0.06), P(xl, yL + 0.16, z - 0.06), P(xr, yR + 0.16, z - 0.06), P(xr, yR + 0.16, z + 0.06), P(xl, yL + 0.16, z + 0.06)]); }
    const yAt = x => lerp(yL, yR, (x - xl)/(xr - xl));
    for (const z of [za + 0.3, zb - 0.3]) for (const x of [XC - 1.2, XC + 1.2]) segP(CAB, [x, YT - 3.6, z], [x, yAt(x) + 0.5, z], 0.05, 3);
    for (let x = xr + 3; x < xl - 2; x += 4.5) aboxM(STL, ID, x - 0.15, x + 0.15, yAt(x) - 1.3, yAt(x) - 1.0, za + 0.3, zb - 0.3); }
  // timber pier decks on piles, with a low rail
  for (const poly of o.piers){ prismM(DECK, ID, poly, o.yd - 0.35, o.yd, true, true);
    for (let i = 0; i < poly.length; i++){ const a = poly[i], b = poly[(i+1) % poly.length], L = Math.hypot(b[0]-a[0], b[1]-a[1]), n = Math.max(1, Math.round(L/4.5));
      for (let k = 0; k < n; k++){ const t = k/n, x = a[0] + (b[0]-a[0])*t, z = a[1] + (b[1]-a[1])*t; cylM(PILE, ID, 0.22, 0.22, o.yd - 6, o.yd - 0.35, x, z, 5); boxM(DK2, ID, 0.12, 1.05, 0.12, x, o.yd, z); }
      quadP(DK2, [a[0], o.yd + 1.0, a[1]], [b[0], o.yd + 1.0, b[1]], [b[0], o.yd + 1.08, b[1]], [a[0], o.yd + 1.08, a[1]]); } } };

LANDMARKS.nygantry = {zh:'龙门广场州立公园', en:'Gantry Plaza State Park', cat:'old', r:90, h:19,
  lt:{m:0, c:'#d9e4ff', k:0.9, e:0.6},
  build(){
    const g = new THREE.Group(), B = NBat();
    nyGantry(B, {top:17.3, towers:[-13.2, 0, 13.2], z0:-14.6, z1:14.5, house:[-1.4, 6.1, -1.9, 1.4], aprons:[[-13.4, -0.8], [0.8, 13.4]],
      xl:12.0, xr:-24.0, yl:0.6, yr:-1.6, yd:0.2,
      piers:[[[-83.1,19.6],[-83.5,28.9],[-70.8,28.7],[-70.7,25.6],[-44.6,25.6],[-44.5,27.9],[-40.6,27.8],[-27.6,40.3],[-25.4,39.8],[-36.2,27.7],[-31.4,27.5],[-17.7,40.2],[-16.1,39.3],[-27.0,29.4],[-27.1,27.5],[3.2,27.7],[4.5,22.8],[4.3,18.6],[-21.6,19.4],[-21.5,15.2],[-37.6,15.8],[-37.5,19.4]],
        [[21.8,-29.0],[1.9,-29.2],[1.9,-23.3],[-19.2,-23.4],[-19.2,-20.2],[-39.9,-20.3],[-39.9,-26.1],[-49.7,-26.2],[-49.9,-17.0],[-12.2,-15.7],[-12.2,-20.4],[9.0,-20.3],[9.1,-23.3],[15.2,-23.3],[15.2,-17.1],[22.4,-17.1],[27.7,-29.9]]]});
    B.flush(g); return g; }};
SG_PLACES.push({type:'nygantry', lat:40.7441154, lon:-73.9596348, rot:-0.2475});

LANDMARKS.nygantry_b = {zh:'龙门广场州立公园', en:'Gantry Plaza State Park', cat:'old', label:false, r:90, h:18,
  lt:{m:0, c:'#d9e4ff', k:0.9, e:0.6},
  build(){
    const g = new THREE.Group(), B = NBat();
    nyGantry(B, {top:15.9, towers:[-17.7, -5.6, 5.0, 17.2], z0:-19.1, z1:18.6, house:null, aprons:[[-18.6, -5.0], [4.4, 18.1]],
      xl:6.0, xr:-30.0, yl:0.6, yr:-1.6, yd:0.2,
      piers:[[[4.2,-28.8],[-80.9,-29.7],[-84.9,-27.2],[-84.9,-23.1],[-82.3,-21.0],[-7.3,-19.4],[4.1,-19.3]], [[4.0,24.6],[-32.7,24.7],[-32.4,34.1],[-47.0,34.0],[-52.0,32.3],[-54.4,28.8],[-54.1,22.4],[-48.6,19.6],[-6.1,18.2],[4.0,18.4]]]});
    B.flush(g); return g; }};
SG_PLACES.push({type:'nygantry_b', lat:40.7447782, lon:-73.9587545, rot:-0.2475});
}
