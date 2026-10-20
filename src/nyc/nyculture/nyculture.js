// ===== nyc/nyculture: New York culture landmarks on their real OSM footprints (City Brush v29, New York 1:1) =====
// Carnegie Hall, The Plaza Hotel with the Pulitzer Fountain, MoMA with 53W53 and Museum Tower, Lincoln Center (Metropolitan
// Opera House, David Geffen Hall, David H. Koch Theater, Vivian Beaumont Theater and the Library, the Revson Fountain plaza),
// Columbus Circle (10 Columbus Circle and the Columbus Monument), The Dakota and Madison Square Garden.
// Every model is built in the Manhattan street-grid frame: local +x = along the streets to the east-south-east, local +z = along
// the avenues to the south-south-west (rot = -0.5096 measured on the footprints). Footprints: nyc/ref_nyculture.json.
// No names, logos or text anywhere; screens and LED walls show abstract colour only.
{
const PI = Math.PI, TAU = PI*2, HP = PI/2, ROT = -0.5096;
// ---------------- triangle batches: everything of one colour spec becomes one LTris call ----------------
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const quad = (o, a, b, c, d) => o.push(...a, ...b, ...c, ...a, ...c, ...d);
const tri = (o, a, b, c) => o.push(...a, ...b, ...c);
const abox = (o, x0, x1, y0, y1, z0, z1, noBot) => {
  const P = [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]];
  const F = noBot ? [[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]] : [[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]];
  for (const [a, b, c, d] of F) quad(o, P[a], P[b], P[c], P[d]);
};
// box w (local x before ry) x h x d centred on x, z with its base at y
const rbox = (o, w, h, d, x, y, z, ry) => {
  const c = Math.cos(ry || 0), s = Math.sin(ry || 0), R = (u, v) => [x + u*c + v*s, z - u*s + v*c], hw = w/2, hd = d/2;
  const q = [R(-hw, -hd), R(hw, -hd), R(hw, hd), R(-hw, hd)], P = [...q.map(p => [p[0], y, p[1]]), ...q.map(p => [p[0], y + h, p[1]])];
  for (const [a, b, cc, e] of [[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]) quad(o, P[a], P[b], P[cc], P[e]);
};
const flat = (o, P, y, down) => { const T = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
  for (const t of T){ const a = [P[t[0]][0], y, P[t[0]][1]], b = [P[t[1]][0], y, P[t[1]][1]], c = [P[t[2]][0], y, P[t[2]][1]]; if (down) tri(o, a, c, b); else tri(o, a, b, c); } };
// extruded polygon [[x, z], ...] from y0 to y1 (walls + optional top / bottom caps)
const prism = (o, P, y0, y1, top = true, bot = false) => {
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length]; quad(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); }
  if (top) flat(o, P, y1); if (bot) flat(o, P, y0, true);
};
// cylinder / regular prism radius r (or [rb, rt]) with n sides
const cyl = (o, x, z, r, y0, y1, n, top = true, a0 = 0) => {
  const rb = Array.isArray(r) ? r[0] : r, rt = Array.isArray(r) ? r[1] : r;
  for (let i = 0; i < n; i++){ const t0 = a0 + i/n*TAU, t1 = a0 + (i + 1)/n*TAU;
    quad(o, [x + Math.cos(t0)*rb, y0, z + Math.sin(t0)*rb], [x + Math.cos(t1)*rb, y0, z + Math.sin(t1)*rb], [x + Math.cos(t1)*rt, y1, z + Math.sin(t1)*rt], [x + Math.cos(t0)*rt, y1, z + Math.sin(t0)*rt]);
    if (top && rt > 0) tri(o, [x, y1, z], [x + Math.cos(t1)*rt, y1, z + Math.sin(t1)*rt], [x + Math.cos(t0)*rt, y1, z + Math.sin(t0)*rt]); }
};
// surface of revolution [[r, y], ...] (angles a0..a0+span)
const lathe = (o, pts, x, z, n, a0 = 0, span = TAU) => {
  for (let k = 0; k < pts.length - 1; k++){ const [r0, y0] = pts[k], [r1, y1] = pts[k + 1];
    for (let i = 0; i < n; i++){ const t0 = a0 + i/n*span, t1 = a0 + (i + 1)/n*span;
      quad(o, [x + Math.cos(t0)*r0, y0, z + Math.sin(t0)*r0], [x + Math.cos(t1)*r0, y0, z + Math.sin(t1)*r0], [x + Math.cos(t1)*r1, y1, z + Math.sin(t1)*r1], [x + Math.cos(t0)*r1, y1, z + Math.sin(t0)*r1]); } }
};
// beam between two 3-D points (n-sided)
const seg = (o, a, b, r, n = 4) => {
  const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2], L = Math.hypot(dx, dy, dz); if (L < 1e-4) return;
  const d = [dx/L, dy/L, dz/L], up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let ux = d[1]*up[2]-d[2]*up[1], uy = d[2]*up[0]-d[0]*up[2], uz = d[0]*up[1]-d[1]*up[0]; const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
  const vx = d[1]*uz-d[2]*uy, vy = d[2]*ux-d[0]*uz, vz = d[0]*uy-d[1]*ux;
  const ring = p => { const R = []; for (let i = 0; i < n; i++){ const t = (i + 0.5)/n*TAU, c = Math.cos(t)*r, s = Math.sin(t)*r; R.push([p[0]+ux*c+vx*s, p[1]+uy*c+vy*s, p[2]+uz*c+vz*s]); } return R; };
  const A = ring(a), Bq = ring(b); for (let i = 0; i < n; i++){ const j = (i + 1) % n; quad(o, A[i], A[j], Bq[j], Bq[i]); }
};
// signed area (x, z plan): > 0 = east -> south -> west order (clockwise on a north-up map); outward normal = left of a->b
const area = P => { let s = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length]; s += a[0]*b[1] - b[0]*a[1]; } return s/2; };
// mapping on the vertical wall through plan segment a->b: (u along the wall from a, y, out) -> 3-D point; sgn: +1 = outward is left of a->b
const wmap = (a, b, sgn) => { const dx = b[0]-a[0], dz = b[1]-a[1], L = Math.hypot(dx, dz) || 1, ux = dx/L, uz = dz/L, nx = uz*sgn, nz = -ux*sgn;
  const f = (u, y, out) => [a[0] + ux*u + nx*(out || 0), y, a[1] + uz*u + nz*(out || 0)]; f.L = L; f.n = [nx, nz]; f.u = [ux, uz]; return f; };
// rectangle on a wall (u0..u1, y0..y1) pushed out by off
const wrect = (o, W, u0, u1, y0, y1, off) => quad(o, W(u0, y0, off), W(u1, y0, off), W(u1, y1, off), W(u0, y1, off));
// small box standing proud of a wall: u0..u1 along, y0..y1, from out0 to out1
const wbox = (o, W, u0, u1, y0, y1, out0, out1) => { const P = [W(u0, y0, out0), W(u1, y0, out0), W(u1, y0, out1), W(u0, y0, out1)].map(p => [p[0], p[2]]); prism(o, P, y0, y1, true); };
// arch-headed panel on a wall: centre u, bottom y0, half width hw, total height ht (round top)
const warch = (o, W, u, y0, hw, ht, off, n = 8) => { const P = [[u - hw, y0], [u + hw, y0], [u + hw, y0 + ht - hw]];
  for (let i = 1; i < n; i++){ const t = PI*i/n; P.push([u + Math.cos(t)*hw, y0 + ht - hw + Math.sin(t)*hw]); } P.push([u - hw, y0 + ht - hw]);
  for (let i = 1; i < P.length - 1; i++) tri(o, W(P[0][0], P[0][1], off), W(P[i][0], P[i][1], off), W(P[i + 1][0], P[i + 1][1], off)); };
// vertical strips (piers / fins / mullions) along each edge of a polygon: width w every step, y0..y1, offset out
const stripsP = (o, P, y0, y1, step, w, off, minL = 3) => {
  const s = area(P) > 0 ? -1 : 1;
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], dx = b[0]-a[0], dz = b[1]-a[1], L = Math.hypot(dx, dz); if (L < minL) continue;
    const ux = dx/L, uz = dz/L, nx = -uz*s*off, nz = ux*s*off, n = Math.max(1, Math.floor((L - 0.6)/step)), m = (L - n*step)/2;
    for (let k = 0; k < n; k++){ const t = m + (k + 0.5)*step;
      quad(o, [a[0] + ux*(t - w/2) + nx, y0, a[1] + uz*(t - w/2) + nz], [a[0] + ux*(t + w/2) + nx, y0, a[1] + uz*(t + w/2) + nz], [a[0] + ux*(t + w/2) + nx, y1, a[1] + uz*(t + w/2) + nz], [a[0] + ux*(t - w/2) + nx, y1, a[1] + uz*(t - w/2) + nz]); } }
};
// horizontal bands round a polygon at heights ys (height hb), offset out
const bandsP = (o, P, ys, hb, off) => {
  const s = area(P) > 0 ? -1 : 1;
  for (const y of ys) for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], dx = b[0]-a[0], dz = b[1]-a[1], L = Math.hypot(dx, dz); if (L < 0.2) continue;
    const nx = -dz/L*s*off, nz = dx/L*s*off; quad(o, [a[0]+nx, y, a[1]+nz], [b[0]+nx, y, b[1]+nz], [b[0]+nx, y + hb, b[1]+nz], [a[0]+nx, y + hb, a[1]+nz]); }
};
// a solid ledge (cornice / balcony) round a polygon: depth out from the wall, y0..y1
const ledgeP = (o, P, y0, y1, out) => { const s = area(P) > 0 ? 1 : -1, n = P.length, Q = [];
  for (let i = 0; i < n; i++){ const p = P[(i + n - 1) % n], c = P[i], q = P[(i + 1) % n];
    const d1 = norm2([c[0]-p[0], c[1]-p[1]]), d2 = norm2([q[0]-c[0], q[1]-c[1]]), n1 = [d1[1]*s, -d1[0]*s], n2 = [d2[1]*s, -d2[0]*s];
    let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml; const k = out/Math.max(0.35, mx*n1[0] + mz*n1[1]);
    Q.push([c[0] + mx*k, c[1] + mz*k]); }
  prism(o, Q, y0, y1, true, true); return Q; };
const norm2 = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0]/l, v[1]/l]; };
const rect = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const shift = (P, dx, dz) => P.map(p => [p[0] - dx, p[1] - dz]);
// rectangular hip / mansard roof: base rectangle at y0, top rectangle inset by (ix, iz) at y0 + h (ix = half length -> ridge)
const hipR = (o, x0, x1, z0, z1, y0, h, ix, iz, cap = true) => {
  const B = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], T = [[x0 + ix, y0 + h, z0 + iz], [x1 - ix, y0 + h, z0 + iz], [x1 - ix, y0 + h, z1 - iz], [x0 + ix, y0 + h, z1 - iz]];
  for (let i = 0; i < 4; i++){ const j = (i + 1) % 4; quad(o, B[i], B[j], T[j], T[i]); }
  if (cap && (x1 - x0 - 2*ix) > 0.05 && (z1 - z0 - 2*iz) > 0.05) quad(o, T[0], T[3], T[2], T[1]);
};
// simple tree: trunk + faceted crown
const treeB = (oT, oL, x, y, z, s) => { abox(oT, x - 0.2*s, x + 0.2*s, y, y + 2.6*s, z - 0.2*s, z + 0.2*s, true);
  lathe(oL, [[0, y + 1.6*s], [1.9*s, y + 2.6*s], [2.2*s, y + 3.9*s], [1.4*s, y + 5.2*s], [0, y + 5.7*s]], x, z, 6, 0.3); };
// grid point (relative to the ref anchor, rot ROT) -> lat/lon; push the placement
const LLg = (lat0, lon0, fx, fz) => { const ex = fx*Math.cos(ROT) + fz*Math.sin(ROT), ez = -fx*Math.sin(ROT) + fz*Math.cos(ROT); return {lat:+(lat0 - ez/111048).toFixed(7), lon:+(lon0 + ex/84516).toFixed(7)}; };
const placeG = (type, lat0, lon0, fx, fz) => { const p = LLg(lat0, lon0, fx, fz); SG_PLACES.push({type, lat:p.lat, lon:p.lon, rot:ROT}); };
const AVI = {c:'#b02018', m:0, lk:0, glow:'#ff2a1a', gk:2.2};
// one wall (W = wmap): piers / fins every step (width w) from y0 to y1, offset off; m = margin at the ends
const wStrips = (o, W, y0, y1, step, w, off, m = 0) => { const L = W.L - 2*m, n = Math.max(1, Math.round(L/step)), st = L/n;
  for (let k = 0; k <= n; k++){ const u = m + k*st; wrect(o, W, Math.max(0, u - w/2), Math.min(W.L, u + w/2), y0, y1, off); } };
// one wall: horizontal bands at heights ys
const wBands = (o, W, ys, hb, off) => { for (const y of ys) wrect(o, W, 0, W.L, y, y + hb, off); };
// punched windows on a wall: floors from y0 every fh (nf floors), bays of width bay; window ww x wh; lit ones go to oL (probability pL)
const wWins = (oD, oL, W, u0, u1, y0, fh, nf, bay, ww, wh, off, pL, rng) => { const n = Math.max(1, Math.round((u1 - u0)/bay)), st = (u1 - u0)/n;
  for (let f = 0; f < nf; f++) for (let k = 0; k < n; k++){ const u = u0 + (k + 0.5)*st, y = y0 + f*fh + (fh - wh)*0.45;
    wrect(oL && rng() < pL ? oL : oD, W, u - ww/2, u + ww/2, y, y + wh, off); } };
const range = (a, b, st) => { const r = []; for (let y = a; y <= b + 1e-6; y += st) r.push(y); return r; };

// ===== Columbus Circle: 10 Columbus Circle (2003, SOM / David Childs; former Time Warner Center, now Deutsche Bank Center) and the
// Columbus Monument (1892, Gaetano Russo). Twin 55-storey glass towers 228 m to the roof, parallelogram plans aligned with Broadway,
// glass "lantern" parapets on top; lower glass wings to 55 / 80 / 105 / 125 m; a 45 m limestone base with large openings that
// follows the curve of the circle, the 26 x 45 m cable-net glass wall of the atrium on the axis of 59th Street between the towers,
// and the 46 m LED glass prow at the 58th Street corner. On the roundabout island: the paved plaza ringed by trees and benches,
// the circular fountain pool with its jets, and the monument: stepped granite base, the marble Genius with the globe, the
// granite rostral column with three tiers of bronze ship prows and the marble statue of Columbus on top (23 m).
// Origin: grid point (17.6, 14.8) of the ref (anchor 40.7685, -73.9827); the island centre is at local (65.0, -6.1).
LANDMARKS.nycolumbus = {zh:'哥伦布圆环', en:'Columbus Circle · 10 Columbus Circle', cat:'new', r:122, h:230,
  lt:{m:1, c:'#e6efff', k:0.6, anim:'none'}, build(){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng, OX = 17.6, OZ = 14.8;
  const C = p => [p[0] - OX, p[1] - OZ], CP = P => P.map(C);
  const GL = {c:'#4f5c68', m:1, fh:4.1, cw:3.0}, FIN = {c:'#8e9aa4', m:0, lk:0.18}, LANT = {c:'#c8d3db', m:0, lk:0.3, glow:'#eaf3ff', gk:1.0}, ROOF = {c:'#6b7176', m:0, lk:0.1};
  const LIME = {c:'#d6cab3', m:0, lk:0.55, lc:'#ffe2bc'}, BGL = {c:'#3d464d', m:0, lk:0.1, glow:'#ffd6a2', gk:0.42}, ATR = {c:'#9fb2bf', m:0, lk:0.2, glow:'#fff0d6', gk:0.6}, PROW = {c:'#a9c6d3', m:2, lk:0.9};
  const GRAN = {c:'#cbc4b6', m:0, lk:1.05, lc:'#ffe6c4'}, MARB = {c:'#efebe2', m:0, lk:1.2, lc:'#fff1dc'}, BRZ = {c:'#5f5541', m:0, lk:0.55, lc:'#ffe6c4'};
  const PAVE = {c:'#bcb5a8', m:0, lk:0.35, lc:'#ffe6c4'}, WAT = {c:'#7fa9ba', m:0, lk:0.2, glow:'#bfe4ff', gk:0.45}, LEAF = {c:'#58743f', m:0, lk:0.25, lc:'#fff0d0'}, TRUNK = {c:'#5a4a3a', m:0, lk:0.2};
  const Gl = B.p(GL), Fi = B.p(FIN), Rf = B.p(ROOF), Li = B.p(LIME), Bg = B.p(BGL);
  // ---------- the base (0 - 45 m): limestone frame with large openings, curved along the circle ----------
  const CC = [84.2, 9.6], arc = [];
  { const a0 = Math.atan2(21.7 - CC[1], 18.2 - CC[0]), a1 = Math.atan2(69.6 - CC[1], 59.3 - CC[0]), r0 = Math.hypot(18.2 - CC[0], 21.7 - CC[1]), r1 = Math.hypot(59.3 - CC[0], 69.6 - CC[1]);
    for (let i = 0; i <= 12; i++){ const t = i/12, a = a0 + (a1 - a0)*t, r = r0 + (r1 - r0)*t; arc.push([CC[0] + Math.cos(a)*r, CC[1] + Math.sin(a)*r]); } }
  const BASE = CP([[-80.7, 79.6], [-81.4, -49.6], [4.2, -49.9], [21.2, -19.3], [18.7, -12.3], [16.9, -5.4], [13.7, -5.4], [13.9, 22.0], ...arc, [58.1, 72.9], [67.0, 74.5], [66.7, 78.4], [4.5, 79.3]]);
  const sB = area(BASE) > 0 ? 1 : -1, nA = 6, nArc0 = 8, nArc1 = 8 + 12, nProw = [nArc1, nArc1 + 1, nArc1 + 2];
  prism(Bg, BASE, -4, 45, false); flat(Rf, BASE, 45);
  for (let i = 0; i < BASE.length; i++){
    const a = BASE[i], b = BASE[(i + 1) % BASE.length], W = wmap(a, b, sB); if (W.L < 0.5) continue;
    if (i === nA){            // the atrium's cable-net glass wall (26 m wide, 45 m tall) between the towers
      wrect(B.p(ATR), W, 0, W.L, 0, 44, 0.05);
      for (let y = 2.3; y < 44; y += 2.3) wrect(Fi, W, 0, W.L, y, y + 0.1, 0.12);
      for (let u = 1.4; u < W.L; u += 1.4) wrect(Fi, W, u - 0.05, u + 0.05, 0, 44, 0.12);
      wrect(Li, W, 0, W.L, 44, 45.6, 0.35); continue; }
    if (nProw.includes(i)){ wrect(B.p(PROW), W, 0, W.L, 0, 46, 0.2); continue; }
    const arcE = i >= nArc0 && i < nArc1;
    wBands(Li, W, [-4, 6.2, 15.4, 24.6, 33.8], arcE ? 1.6 : 1.3, 0.3);
    wrect(Li, W, 0, W.L, 42.4, 45.8, 0.45);                                                    // the parapet band
    if (arcE){ wStrips(Li, W, -4, 45, 4.5, 1.9, 0.3); wStrips(Fi, W, 0, 42, 1.5, 0.12, 0.15); }   // the retail front: stone piers, mullions
    else { wStrips(Li, W, -4, 45, 6.6, 2.4, 0.3); wStrips(Fi, W, 6, 42, 3.3, 0.14, 0.15, 3.3); }
    wrect(B.p(BGL), W, 0, W.L, 0.3, 5.6, 0.32);                                                // shop windows lit at night
  }
  // ---------- the glass wings and the towers ----------
  const glassBlock = (P, y0, y1, cap = true) => { prism(Gl, P, y0, y1, false); if (cap){ flat(Rf, P, y1); ledgeP(Fi, P, y1 - 0.4, y1 + 1.0, 0.15); }
    bandsP(Fi, P, range(y0 + 4.1, y1 - 1, 4.1), 0.32, 0.1); stripsP(Fi, P, y0, y1, 3.0, 0.16, 0.18); };
  const N105 = CP([[-72.5, -41.2], [-7.3, -40.8], [-16.3, -5.1], [-72.6, -6.5]]), N80 = CP([[-59.3, -46.0], [1.9, -44.6], [-7.3, -40.8], [-59.3, -41.2]]);
  const S105 = CP([[-68.4, 22.3], [-11.9, 22.6], [-7.5, 23.8], [32.1, 65.1], [-68.1, 64.7]]), S125 = CP([[-68.4, 22.3], [-41.2, 22.4], [-20.9, 57.1], [-68.1, 57.2]]);
  const MID = CP([[-72.9, 22.2], [-72.6, -6.5], [-16.3, -5.1], [-11.9, 22.6]]);
  const NT = CP([[-72.5, -41.2], [-47.8, -40.4], [-27.7, -5.9], [-52.3, -6.3]]), ST = CP([[-41.2, 22.4], [-11.9, 22.6], [9.0, 57.1], [-20.9, 57.1]]);
  glassBlock(N105, 45, 105); glassBlock(N80, 45, 80); glassBlock(S105, 45, 105); glassBlock(S125, 105, 125); glassBlock(MID, 45, 55);
  for (const T of [NT, ST]){
    glassBlock(T, T === ST ? 125 : 105, 224, false);
    // the 18 m glass lantern parapet (lit at night) round the mechanical floors, roof inside it
    prism(B.p(LANT), T, 224, 230.5, false); ledgeP(Fi, T, 223.6, 224.4, 0.25); flat(Rf, T, 229.2);
    const c = T.reduce((s, p) => [s[0] + p[0]/4, s[1] + p[1]/4], [0, 0]);
    abox(Rf, c[0] - 6, c[0] + 6, 224, 231.5, c[1] - 6, c[1] + 6, true);
    for (const p of T){ const q = [p[0] + (c[0] - p[0])*0.06, p[1] + (c[1] - p[1])*0.06]; abox(B.p(AVI), q[0] - 0.3, q[0] + 0.3, 230.5, 231.3, q[1] - 0.3, q[1] + 0.3, true); }
  }
  // ---------- the roundabout island and the Columbus Monument ----------
  const [mx, mz] = C([82.6, 8.7]), yI = -1.55, Gr = B.p(GRAN), Ma = B.p(MARB), Bz = B.p(BRZ), Pv = B.p(PAVE), Wa = B.p(WAT);
  cyl(Pv, mx, mz, 33.5, -3.6, yI, 56);
  cyl(Gr, mx, mz, [33.6, 33.6], yI, yI + 0.18, 56, false);
  // ring of trees and the curved benches (gaps on the axes of the paths)
  for (let i = 0; i < 28; i++){ const a = (i + 0.5)/28*TAU; if (Math.abs(Math.sin(2*a)) < 0.16) continue; treeB(B.p(TRUNK), B.p(LEAF), mx + Math.cos(a)*30.0, yI, mz + Math.sin(a)*30.0, 1.1 + rng()*0.15); }
  for (let q = 0; q < 4; q++) for (let i = 0; i < 9; i++){ const a = q*HP + 0.2 + i*0.13; rbox(B.p(TRUNK), 0.6, 0.45, 3.4, mx + Math.cos(a)*26.5, yI, mz + Math.sin(a)*26.5, -a); }
  // the circular fountain: granite rim, the pool, the jets (lit at night)
  lathe(Gr, [[22.6, yI], [22.6, yI + 0.55], [21.9, yI + 0.55], [21.9, yI + 0.2]], mx, mz, 56);
  lathe(Gr, [[15.4, yI + 0.2], [15.4, yI + 0.55], [14.7, yI + 0.55], [14.7, yI]], mx, mz, 56);
  lathe(Wa, [[21.9, yI + 0.35], [15.4, yI + 0.35]], mx, mz, 56);
  for (let i = 0; i < 40; i++){ const a = i/40*TAU, r = 18.6, x = mx + Math.cos(a)*r, z = mz + Math.sin(a)*r, dx = -Math.cos(a), dz = -Math.sin(a);
    tri(Wa, [x - dz*0.18, yI + 0.35, z + dx*0.18], [x + dz*0.18, yI + 0.35, z - dx*0.18], [x + dx*1.4, yI + 2.6, z + dz*1.4]); }
  // the monument: stepped octagonal granite base, pedestal, the rostral column, capital, statue
  const R8 = w => w/2/Math.cos(PI/8);
  cyl(Gr, mx, mz, R8(9.3), yI, yI + 1.0, 8, true, PI/8); cyl(Gr, mx, mz, R8(7.0), yI + 1.0, yI + 1.5, 8, true, PI/8);
  abox(Gr, mx - 2.1, mx + 2.1, yI + 1.5, yI + 3.6, mz - 2.1, mz + 2.1, true); abox(Gr, mx - 2.35, mx + 2.35, yI + 3.4, yI + 3.75, mz - 2.35, mz + 2.35);
  abox(Gr, mx - 1.45, mx + 1.45, yI + 3.75, yI + 5.0, mz - 1.45, mz + 1.45, true); abox(Gr, mx - 1.6, mx + 1.6, yI + 4.85, yI + 5.15, mz - 1.6, mz + 1.6);
  lathe(Gr, [[1.25, yI + 5.15], [1.25, yI + 5.6], [1.05, yI + 5.9], [0.98, yI + 6.2], [0.86, yI + 19.0], [1.05, yI + 19.25], [1.05, yI + 19.6], [1.4, yI + 19.9], [1.4, yI + 20.3], [0, yI + 20.3]], mx, mz, 14);
  // bronze ship prows in three tiers (two per tier, rotated each tier) and anchors
  for (let t = 0; t < 3; t++) for (const sd of [0, PI]){ const a = t*PI/3 + sd + PI/6, y = yI + 8.6 + t*3.4, ca = Math.cos(a), sa = Math.sin(a);
    const P = (r, dy, s) => [mx + ca*r - sa*s, y + dy, mz + sa*r + ca*s];
    for (const s of [-1, 1]) { quad(Bz, P(0.7, -0.9, 0.55*s), P(2.3, -0.2, 0.08*s), P(2.5, 0.75, 0.1*s), P(0.7, 0.9, 0.6*s)); }
    tri(Bz, P(0.7, 0.9, -0.6), P(2.5, 0.75, -0.1), P(2.5, 0.75, 0.1)); tri(Bz, P(0.7, 0.9, -0.6), P(2.5, 0.75, 0.1), P(0.7, 0.9, 0.6));
    seg(Bz, P(0.8, -1.6, 0), P(1.25, -2.7, 0), 0.09, 4); }
  // Columbus (marble), on a small drum
  cyl(Ma, mx, mz, 0.75, yI + 20.3, yI + 21.1, 10); lathe(Ma, [[0.62, yI + 21.1], [0.66, yI + 22.0], [0.5, yI + 23.3], [0.42, yI + 23.5], [0, yI + 23.55]], mx, mz, 10);
  lathe(Ma, [[0, yI + 23.5], [0.2, yI + 23.6], [0.23, yI + 23.85], [0.17, yI + 24.05], [0, yI + 24.12]], mx, mz, 8);
  seg(Ma, [mx + 0.3, yI + 23.2, mz - 0.25], [mx + 0.62, yI + 22.3, mz - 0.62], 0.12, 4);
  // the Genius of Geography with the globe, against the south face of the pedestal
  lathe(Ma, [[0, yI + 1.5], [0.42, yI + 1.5], [0.36, yI + 2.6], [0.2, yI + 3.1], [0, yI + 3.25]], mx, mz + 2.6, 8);
  for (const s of [-1, 1]) tri(Ma, [mx + s*0.2, yI + 2.9, mz + 2.45], [mx + s*1.2, yI + 3.6, mz + 2.3], [mx + s*0.5, yI + 2.0, mz + 2.35]);
  lathe(Bz, [[0, yI + 3.2], [0.32, yI + 3.42], [0.32, yI + 3.6], [0, yI + 3.82]], mx + 0.35, mz + 2.75, 8);
  B.flush(g);
  return g; }};
placeG('nycolumbus', 40.7685, -73.9827, 17.6, 14.8);

// ===== The Museum of Modern Art and 53W53 (53rd Street, between Fifth and Sixth Avenues). 53W53 (2019, Jean Nouvel): 320 m,
// 77 storeys on a 26.6 m wide lot; the east and west faces vertical, the north and south faces leaning in as they rise, ending
// in faceted spires (the highest at 320 m, others at about 298 and 272 m and two low ones over the 54th Street wing at 80 and
// 92 m); dark glass behind the exposed light-grey concrete diagrid. MoMA: the Geffen Wing (2019, Diller Scofidio + Renfro) in the
// tower's base and on the former Folk Art Museum lot, the Taniguchi buildings (2004: the 53rd Street lobby building, the gallery
// blocks and the 75 m block behind, the David and Peggy Rockefeller Building on 54th Street), Museum Tower (1984, Cesar Pelli,
// patchwork glass) over the West Wing galleries, the 1939 Goodwin & Stone building (white marble, translucent glass, the
// cantilevered roof canopy with round holes) with Philip Johnson's dark 1964 East Wing, and the Abby Aldrich Rockefeller
// Sculpture Garden (marble paving, the two pools, birches, the wall on 54th Street). Heights from the city's building data.
// Origin: grid point (-1, -11) of the ref (anchor 40.76145, -73.9776).
LANDMARKS.nymoma = {zh:'现代艺术博物馆与西53街53号', en:'Museum of Modern Art · 53W53', cat:'new', r:86, h:320,
  lt:{m:1, c:'#e9eef8', k:0.5, anim:'none'}, build(){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng, OX = -1, OZ = -11;
  const C = p => [p[0] - OX, p[1] - OZ], CP = P => P.map(C), X = x => x - OX, Z = z => z - OZ;
  const TG = {c:'#36424d', m:1, fh:4.15, cw:3.0}, DIA = {c:'#bdb7ad', m:0, lk:0.35, lc:'#fff1dc'}, STEEL = {c:'#9aa1a6', m:0, lk:0.5, glow:'#dfe8ff', gk:0.12};
  const DK = {c:'#3d4043', m:0, lk:0.25}, ALU = {c:'#aeb2b4', m:0, lk:0.45, lc:'#fff0dc'}, MG = {c:'#55636d', m:1, fh:4.4, cw:3.2}, WG = {c:'#c9cfd0', m:0, lk:0.3, glow:'#fff3de', gk:0.35};
  const MARB = {c:'#e9e6df', m:0, lk:0.6, lc:'#fff2de'}, PG1 = {c:'#4b5b6b', m:1, fh:3.5, cw:3.0}, PG2 = {c:'#6c7883', m:1, fh:3.5, cw:3.0}, ROOF = {c:'#707477', m:0, lk:0.1};
  const PAVE = {c:'#c9c6bf', m:0, lk:0.3}, WAT = {c:'#5f7f8a', m:0, lk:0.1, glow:'#9fd2e6', gk:0.25}, LEAF = {c:'#6f8a4f', m:0, lk:0.25, lc:'#fff0d0'}, TRUNK = {c:'#d8d4c8', m:0, lk:0.3};
  const Tg = B.p(TG), Di = B.p(DIA), Dk = B.p(DK), Al = B.p(ALU), Mg = B.p(MG), Rf = B.p(ROOF);
  // ---------- 53W53 ----------
  // a column of the tower: sections [y, x0, x1, zN, zS] lofted (sides + diagrid on all four faces)
  const lerp = (a, b, t) => a + (b - a)*t;
  const secAt = (S, y) => { for (let i = 0; i < S.length - 1; i++){ const a = S[i], b = S[i + 1]; if (y <= b[0] + 1e-6){ const t = (y - a[0])/Math.max(1e-6, b[0] - a[0]); return a.map((v, k) => lerp(v, b[k], t)); } } return S[S.length - 1]; };
  const column = (S, nUs, rowH) => {
    for (let i = 0; i < S.length - 1; i++){ const a = S[i], b = S[i + 1];
      const A = [[a[1], a[0], a[3]], [a[2], a[0], a[3]], [a[2], a[0], a[4]], [a[1], a[0], a[4]]], Bq = [[b[1], b[0], b[3]], [b[2], b[0], b[3]], [b[2], b[0], b[4]], [b[1], b[0], b[4]]];
      for (let k = 0; k < 4; k++){ const j = (k + 1) % 4; quad(Tg, A[k], A[j], Bq[j], Bq[k]); } }
    const top = S[S.length - 1]; if (top[2] - top[1] > 0.5 && top[4] - top[3] > 0.5) quad(Rf, [top[1], top[0], top[3]], [top[1], top[0], top[4]], [top[2], top[0], top[4]], [top[2], top[0], top[3]]);
    // faces: 0 south (+z), 1 north (-z), 2 east (+x), 3 west (-x); F(u, y)
    const y0 = S[0][0] + 5, y1 = S[S.length - 1][0];
    const faces = [(u, y) => { const s = secAt(S, y); return [lerp(s[1], s[2], u), y, s[4]]; }, (u, y) => { const s = secAt(S, y); return [lerp(s[2], s[1], u), y, s[3]]; },
                   (u, y) => { const s = secAt(S, y); return [s[2], y, lerp(s[4], s[3], u)]; }, (u, y) => { const s = secAt(S, y); return [s[1], y, lerp(s[3], s[4], u)]; }];
    const outs = [[0, 0, 1], [0, 0, -1], [1, 0, 0], [-1, 0, 0]];
    faces.forEach((F, fi) => { const nU = nUs[fi > 1 ? 1 : 0], nR = Math.max(2, Math.round((y1 - y0)/rowH)), node = (i, k) => { const u = Math.min(1, Math.max(0, (i + (k % 2)*0.5)/nU)); return F(u, lerp(y0, y1, k/nR)); };
      const mem = (p, q) => { const d = [q[0]-p[0], q[1]-p[1], q[2]-p[2]], o = outs[fi]; let s = [d[1]*o[2]-d[2]*o[1], d[2]*o[0]-d[0]*o[2], d[0]*o[1]-d[1]*o[0]]; const l = Math.hypot(...s) || 1, sc = secAt(S, (p[1] + q[1])/2), fw = fi < 2 ? sc[2] - sc[1] : sc[4] - sc[3], w = 0.55*Math.min(1, Math.max(0.15, fw/9)); s = s.map(v => v/l*w);
        const of = o.map(v => v*0.35); quad(Di, [p[0]-s[0]+of[0], p[1]-s[1], p[2]-s[2]+of[2]], [p[0]+s[0]+of[0], p[1]+s[1], p[2]+s[2]+of[2]], [q[0]+s[0]+of[0], q[1]+s[1], q[2]+s[2]+of[2]], [q[0]-s[0]+of[0], q[1]-s[1], q[2]-s[2]+of[2]]); };
      for (let k = 0; k < nR; k++) for (let i = -1; i <= nU; i++){ const p = node(i, k), up = k % 2 ? [node(i, k + 1), node(i + 1, k + 1)] : [node(i - 1, k + 1), node(i, k + 1)];
        for (const q of up) if (Math.hypot(q[0]-p[0], q[2]-p[2]) > 0.3 || Math.abs(q[1]-p[1]) > 0.3) mem(p, q); } });
  };
  // the main tower: three columns side by side, peaks at 272 (west), 320 (middle) and 298 m (east); ridge line at z -6 (grid)
  const tx0 = X(-73.5), tx3 = X(-49.5), tw = (tx3 - tx0)/3, zS0 = Z(19.3), zN0 = Z(-21.0), zP = Z(-2.0);
  [[272, 0], [320, 1], [298, 2]].forEach(([yP, c]) => { const x0 = tx0 + c*tw, x1 = x0 + tw, xc = (x0 + x1)/2, yC = yP - 44;
    const zS = y => y <= 24 ? zS0 : lerp(zS0, zP + 0.6, (y - 24)/(yP - 24)), zN = y => y <= 96 ? zN0 : lerp(zN0, zP - 0.6, (y - 96)/(yP - 96));
    column([[-4, x0, x1, zN0, zS0], [24, x0, x1, zN0, zS0], [96, x0, x1, zN0, zS(96)], [yC, x0, x1, zN(yC), zS(yC)], [yP, xc - 0.15, xc + 0.15, zP - 0.15, zP + 0.15]], [1, 4], 16.6);
    seg(B.p(STEEL), [xc, yP - 2, zP], [xc, yP + 4.5, zP], 0.25, 4); });
  // the north wing on 54th Street: two lower peaks (80 and 92 m)
  [[80, X(-73.5), X(-60.9)], [92, X(-60.9), X(-48.3)]].forEach(([yP, x0, x1]) => { const xc = (x0 + x1)/2, zb = Z(-41.6), zt = Z(-27.5), zr = Z(-21.2);
    column([[-4, x0, x1, zb, zr], [20, x0, x1, zb, zr], [yP - 16, x0, x1, lerp(zb, zt, 0.75), zr], [yP, xc - 0.15, xc + 0.15, zt, zt + 0.3]], [1, 2], 16.6);
    seg(B.p(STEEL), [xc, yP - 2, zt], [xc, yP + 3.5, zt], 0.2, 4); });
  // the base on the whole lot (lobby and the Geffen Wing galleries, terrace at the 6th storey), the Geffen front on 53rd Street
  const L53 = CP([[-79.2, 19.5], [-79.3, -16.9], [-73.7, -17.0], [-73.6, -41.3], [-40.5, -41.7], [-40.3, -22.4], [-48.1, -22.3], [-48.1, -17.4], [-40.4, -17.4], [-40.1, 18.7]]);
  prism(Tg, L53, -4, 23.4, true); ledgeP(Al, L53, 23.0, 24.2, 0.2);
  { const W = wmap(C([-40.1, 18.7]), C([-79.2, 19.5]), area(L53) > 0 ? 1 : -1); const gw = B.p(WG);
    wrect(gw, W, 0, 9.4, 0.2, 23.0, 0.12); for (let y = 0; y < 23; y += 4.6) wrect(Al, W, 0, 9.4, y, y + 0.35, 0.2); for (let u = 0; u <= 9.4; u += 1.88) wrect(Al, W, u - 0.08, u + 0.08, 0, 23, 0.2);
    for (let k = 0; k < 5; k++){ const u = 2.2 + k*1.2, y = 1 + k*4.4; wrect(Dk, W, u - 0.4, u + 1.9, y, y + 0.5, 0.3); }        // the blade staircase behind the glass
    wrect(B.p(WG), W, 9.4, 39, -1, 4.6, 0.12); }
  // ---------- MoMA (heights: city data) ----------
  const P25s = CP([[-40.0, 19.0], [-40.1, 15.0], [8.2, 14.8], [8.2, 18.6]]), P35a = CP([[-40.1, 15.0], [-40.3, 2.7], [-6.2, 2.3], [-6.2, -0.7], [8.1, -0.7], [8.2, 14.8]]);
  const P75 = CP([[-40.3, 2.7], [-40.4, -17.4], [-48.1, -17.4], [-48.1, -22.3], [-6.4, -22.7], [-6.2, 2.3]]), P35b = CP([[-40.3, -22.4], [-40.4, -36.9], [25.0, -37.5], [25.0, -23.0]]);
  const P35c = CP([[-6.2, -0.7], [-6.4, -22.7], [15.0, -22.9], [15.0, -8.2], [8.0, -8.1], [8.1, -0.7]]), P25n = CP([[-40.4, -36.9], [-40.5, -41.7], [37.5, -42.5], [37.8, -16.0], [15.2, -15.8], [15.0, -22.9], [25.0, -23.0], [25.0, -37.5]]);
  const block = (P, y1, wall, frame, step, cap) => { prism(B.p(wall), P, -4, y1, false); flat(Rf, P, y1); ledgeP(B.p(cap || frame), P, y1 - 0.9, y1 + 0.3, 0.12);
    if (step) { bandsP(B.p(frame), P, range(4.6, y1 - 3, 4.6), 0.45, 0.1); stripsP(B.p(frame), P, -1, y1 - 0.9, step, 0.3, 0.12); } };
  block(P75, 74.8, MG, ALU, 3.2); block(P35a, 35, MG, ALU, 4.0); block(P35b, 35, DK, ALU, 0); block(P35c, 35, MG, ALU, 4.0);
  block(P25n, 25, DK, ALU, 0); block(P25s, 25, DK, ALU, 0);
  // the Taniguchi 53rd Street front: dark granite and aluminium, the glazed lobby, the long entrance canopy, white glass bands above
  { const W = wmap(C([8.2, 18.6]), C([-40.0, 19.0]), area(P25s) > 0 ? 1 : -1);
    wrect(B.p(WG), W, 2, 46, -1, 5.6, 0.1); wrect(Al, W, 0, W.L, 5.6, 6.3, 0.15); wbox(Al, W, 4, 30, 5.2, 5.6, 0, 3.6);
    for (const [y0, y1] of [[8.5, 12.4], [14.6, 18.5]]) wrect(B.p(WG), W, 1.5, W.L - 1.5, y0, y1, 0.1);
    for (let u = 1.5; u < W.L; u += 3.0) wrect(Al, W, u - 0.1, u + 0.1, 8.5, 18.5, 0.16); }
  // the Rockefeller Building on 54th Street: the large square window in the dark wall
  { const W = wmap(C([-40.5, -41.7]), C([37.5, -42.5]), area(P25n) > 0 ? 1 : -1);
    wrect(B.p(WG), W, 30, 52, 6, 22, 0.1); for (let u = 30; u <= 52; u += 2.75) wrect(Al, W, u - 0.1, u + 0.1, 6, 22, 0.16); for (let y = 6; y <= 22; y += 4) wrect(Al, W, 30, 52, y - 0.1, y + 0.1, 0.16);
    wrect(B.p(WG), W, 3, 26, -1, 4.2, 0.1); wrect(B.p(WG), W, 56, 77, -1, 4.2, 0.1); }
  // ---------- Museum Tower (1984): the West Wing galleries below, the patchwork glass shaft above ----------
  const MTb = CP([[8.2, 18.6], [8.0, -8.1], [15.0, -8.2], [15.2, -15.8], [37.8, -16.0], [38.1, 18.2]]);
  const MT1 = CP([[11.7, 18.5], [11.5, -8.1], [18.5, -8.3], [18.6, -15.8], [34.5, -16.0], [34.7, 18.3]]), MT2 = CP([[15.1, 18.5], [15.0, -8.2], [22.0, -8.3], [21.9, -15.8], [31.1, -15.9], [31.2, 18.3]]);
  block(MTb, 28, MG, ALU, 3.0);
  const patch = (P, y0, y1) => { const s = area(P) > 0 ? 1 : -1;
    for (let i = 0; i < P.length; i++){ const W = wmap(P[i], P[(i + 1) % P.length], s), n = Math.max(1, Math.round(W.L/3.05)), st = W.L/n;
      for (let k = 0; k < n; k++) for (let y = y0, f = 0; y < y1 - 0.1; y += 7, f++){ const h = (k*7 + f*3 + (k >> 1)*5) % 5; wrect(B.p(h < 2 ? PG2 : PG1), W, k*st, (k + 1)*st, y, Math.min(y1, y + 7), 0); }
      for (let k = 0; k <= n; k++) wrect(Al, W, k*st - 0.07, k*st + 0.07, y0, y1, 0.08); } };
  patch(MT1, 28, 169); flat(Rf, MT1, 169); patch(MT2, 169, 179.6); flat(Rf, MT2, 179.6); ledgeP(Al, MT1, 168.6, 169.4, 0.1);
  bandsP(Al, MT1, range(31.5, 166, 3.5), 0.12, 0.05);
  // ---------- the 1939 Goodwin & Stone building and Johnson's East Wing ----------
  const G39 = CP([[38.1, 19.0], [37.9, -16.0], [62.0, -16.2], [62.2, 18.8]]), E64 = CP([[62.2, 18.8], [62.0, -16.2], [77.3, -16.4], [77.6, 18.6]]);
  prism(B.p(MARB), G39, -4, 26.2, false); flat(Rf, G39, 26.2);
  { const W = wmap(C([62.2, 18.8]), C([38.1, 19.0]), area(G39) > 0 ? 1 : -1);
    wrect(B.p(WG), W, 1.5, W.L - 1.5, -1, 4.0, 0.08);                                       // ground floor glass, set back
    wrect(B.p(WG), W, 0.8, W.L - 0.8, 5.2, 13.6, 0.1); for (let u = 0.8; u <= W.L - 0.7; u += 1.2) wrect(Al, W, u - 0.06, u + 0.06, 5.2, 13.6, 0.14);   // the Thermolux wall
    for (let y = 5.2; y <= 13.7; y += 2.1) wrect(Al, W, 0.8, W.L - 0.8, y - 0.06, y + 0.06, 0.14);
    for (const y of [15.6, 19.6]) wrect(Dk, W, 1.2, W.L - 1.2, y, y + 1.9, 0.08);           // strip windows in the marble
    wrect(Dk, W, 0.6, W.L - 0.6, 23.0, 25.6, 0.0);                                            // the recessed top floor
    // the cantilevered roof canopy with its round openings
    const cp = []; for (let i = 0; i < 9; i++) cp.push(1.4 + i*2.6);
    wbox(B.p(MARB), W, -0.5, W.L + 0.5, 25.8, 26.4, -0.2, 2.4); for (const u of cp) { const p = W(u, 26.45, 1.3); cyl(Dk, p[0], p[2], 0.55, 26.4, 26.46, 8, true); } }
  prism(Dk, E64, -4, 33, false); flat(Rf, E64, 33);
  { const W = wmap(C([77.6, 18.6]), C([62.2, 18.8]), area(E64) > 0 ? 1 : -1);
    wrect(B.p(MG), W, 0.4, W.L - 0.4, 0, 31.5, 0.05); for (let u = 0.4; u <= W.L; u += 2.55) wrect(Dk, W, u - 0.25, u + 0.25, 0, 32, 0.15); for (let y = 4.3; y < 32; y += 3.9) wrect(Dk, W, 0, W.L, y - 0.2, y + 0.2, 0.15); }
  // ---------- the Sculpture Garden: marble paving, the two pools, birches, the wall on 54th Street ----------
  const SG = CP([[37.8, -16.0], [37.5, -42.5], [77.3, -42.9], [77.3, -16.4]]); flat(B.p(PAVE), SG, -1.0);
  abox(B.p(PAVE), X(37.6), X(77.4), -4, -1.02, Z(-42.6), Z(-16.2), true);
  for (const [x0, x1, z0, z1] of [[45, 59, -36, -30], [62, 74, -26, -21]]){ abox(B.p(MARB), X(x0) - 0.4, X(x1) + 0.4, -1.0, -0.6, Z(z0) - 0.4, Z(z1) + 0.4, true); abox(B.p(WAT), X(x0), X(x1), -0.62, -0.58, Z(z0), Z(z1), true); }
  for (let i = 0; i < 9; i++){ const x = X(41 + i*4.2), z = Z(-19.5 - (i % 2)*1.5); treeB(B.p(TRUNK), B.p(LEAF), x, -1.0, z, 1.05 + rng()*0.2); }
  abox(Dk, X(37.6), X(77.4), -1, 3.8, Z(-42.9), Z(-42.4), true);
  for (const [x, z, h] of [[52, -27, 2.6], [66, -33, 3.2], [43, -39, 2.2]]) { abox(Dk, X(x) - 0.5, X(x) + 0.5, -1, -0.2, Z(z) - 0.5, Z(z) + 0.5, true); lathe(Dk, [[0.1, -0.2], [0.7, h*0.5], [0.3, h], [0, h + 0.1]], X(x), Z(z), 6); }
  // aviation lights
  
  B.flush(g);
  return g; }};
placeG('nymoma', 40.76145, -73.9776, -1, -11);

// ===== The Plaza Hotel (1907, Henry J. Hardenbergh; 58th Street annex 1921, Warren & Wetmore) and the Pulitzer Fountain (1916,
// Carrere & Hastings, Pomona by Karl Bitter). 18 storeys, 77 m: a rusticated white-marble base (three storeys), white brick and
// terracotta shaft with a marble balcony over the 13th storey and an arcaded top, the main cornice at 59 m, then three storeys of
// dormers in the steep green-tiled mansard with copper cresting; higher hipped pavilion roofs at the corners, rounded turrets with
// green domes at the north-east and south-east corners; the Fifth Avenue entrance (six Tuscan columns carrying a balcony) facing
// the fountain, the porch on Central Park South; light court in the middle over the covered Palm Court. Grand Army Plaza (south
// half): the stepped granite basins of the fountain with the bronze Pomona on top, the paving and the row of trees.
// Frame: grid rotated -0.4974 (measured on the hotel's footprint). Origin: grid point (40, 10) of the ref (anchor 40.76455,
// -73.97445): the hotel is at x -78..7, the fountain at (48.7, 2.5). The smoothed terrain falls 3-7 m towards the Pond along
// Central Park South, so the rusticated marble plinth runs down to -10 m there. Includes the narrow 32 m neighbour on Central
// Park South west of the hotel (its footprint falls inside the hotel's plan hull).
LANDMARKS.nyplaza = {zh:'广场饭店与普利策喷泉', en:'The Plaza Hotel · Pulitzer Fountain', cat:'old', r:96, h:86,
  lt:{m:0, c:'#ffe3b8', k:0.85, e:0.5, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng, OX = 40, OZ = 10;
  const X = x => x - OX, Z = z => z - OZ;
  const MARB = {c:'#e4e0d6', m:0, lk:0.95}, BRICK = {c:'#eee9de', m:0, lk:0.85}, TRIM = {c:'#d9d1c1', m:0, lk:0.8}, ROOF = {c:'#5d7d67', m:0, lk:0.35, lc:'#d8f0de'};
  const COP = {c:'#79a893', m:0, lk:0.5, lc:'#e0fff0'}, WIN = '#2c3136', LIT = {c:'#3a3530', glow:'#ffd7a0', gk:0.75}, PLINTH = {c:'#bcb6aa', m:0, lk:0.5}, FLAT = '#77797a';
  const GRAN = {c:'#cfc8bb', m:0, lk:0.9, lc:'#ffe8c8'}, WAT = {c:'#7ea6b6', glow:'#bfe3ff', gk:0.45}, BRZ = {c:'#5b6a55', m:0, lk:0.8, lc:'#ffe2b8'}, PAVE = '#c3bcb0', LEAF = '#5f7a44', TRUNK = '#5a4a3a';
  const Ma = B.p(MARB), Br = B.p(BRICK), Tr = B.p(TRIM), Rf = B.p(ROOF), Cu = B.p(COP), Wd = B.p(WIN), Wl = B.p(LIT), Pl = B.p(PLINTH);
  const yG = -1.0, yC = 59, yR = 78;                  // ground floor level, main cornice, mansard top
  // ---------- the masonry wings (grid coordinates -> model) ----------
  const R = (x0, x1, z0, z1) => rect(X(x0), X(x1), Z(z0), Z(z1));
  const WN = [[X(-32.1), Z(-23.6)], [X(42.0), Z(-23.6)], [X(42.0), Z(1.0)], [X(-29.4), Z(1.0)], [X(-29.4), Z(-10.6)], [X(-32.1), Z(-10.6)]];
  const WE = R(24.0, 45.9, -17.7, 38.7), WS = [[X(-38.3), Z(21.0)], [X(41.0), Z(21.0)], [X(41.0), Z(41.1)], [X(19.5), Z(41.1)], [X(19.5), Z(39.9)], [X(-38.3), Z(39.9)]];
  const CRT = R(-38.3, 24.2, 0.8, 21.2);
  for (const P of [WN, WE, WS]){ prism(Pl, P, -10, yG, false); prism(Br, P, yG, yC, false); }
  prism(Br, CRT, -10, 20, true);
  // turrets: rounded corners rising to green domes
  const TUR = [[X(42.9), Z(-20.6), 3.0], [X(43.2), Z(38.4), 2.6]];
  for (const [x, z, r] of TUR){ cyl(Pl, x, z, r, -10, yG, 16, false); cyl(Br, x, z, r, yG, 66, 16, false); cyl(Tr, x, z, r + 0.35, 58.5, 60, 16, true);
    lathe(Rf, [[r, 60], [r, 66], [r + 0.3, 66.3], [r*0.95, 69], [r*0.7, 72.5], [r*0.35, 75], [0.25, 76], [0.12, 77.5], [0, 78]], x, z, 16);
    for (let y = 61.2; y < 66; y += 3.2) for (let k = 0; k < 4; k++){ const a = (k + 0.5)/4*PI*0.5 - PI*0.25 + (z < 0 ? -PI/4 : PI/4); const cx = x + Math.cos(a)*(r + 0.05), cz = z + Math.sin(a)*(r + 0.05), tx = -Math.sin(a)*0.55, tz = Math.cos(a)*0.55;
      quad(Wd, [cx - tx, y, cz - tz], [cx + tx, y, cz + tz], [cx + tx, y + 2.0, cz + tz], [cx - tx, y + 2.0, cz - tz]); } }
  // ---------- facades: marble base, white brick shaft, balcony, arcade, cornice; punched windows (some lit at night) ----------
  const FH = 3.32, Y2 = yG + 6.0;                                       // floors above the tall ground floor
  const facade = (a, b, sgn, street) => { const W = wmap(a, b, sgn); if (W.L < 2) return;
    wrect(Ma, W, 0, W.L, yG, yG + 13.6, 0.12);                                                       // marble base, 3 storeys
    for (const y of range(yG + 0.9, yG + 12.5, 0.9)) wrect(Tr, W, 0, W.L, y, y + 0.14, 0.16);         // rustication joints
    wbox(Tr, W, -0.3, W.L + 0.3, yG + 13.2, yG + 13.9, 0, 0.6);                                       // base cornice
    const nb = Math.max(1, Math.round(W.L/3.65)), bw = W.L/nb;
    for (let k = 0; k < nb; k++){ const u = (k + 0.5)*bw;
      if (street && k % 2 === 0) warch(Wd, W, u, yG + 0.3, 1.05, 4.9, 0.2, 6); else wrect(Wd, W, u - 0.95, u + 0.95, yG + 0.5, yG + 4.6, 0.2);    // ground floor
      for (const y of [Y2 + 1.0, Y2 + 4.3]) wrect(rng() < 0.4 ? Wl : Wd, W, u - 0.7, u + 0.7, y, y + 2.1, 0.2); }
    wWins(Wd, Wl, W, 0, W.L, Y2 + 7.6, FH, 10, bw, 1.3, 2.05, 0.06, 0.38, rng);                       // floors 4 - 13
    for (const y of [Y2 + 7.6 + 4*FH - 0.25, Y2 + 7.6 + 8*FH - 0.25]) wrect(Tr, W, 0, W.L, y, y + 0.35, 0.1);
    const yb = Y2 + 7.6 + 10*FH;                                                                      // the marble balcony over the 13th storey
    wbox(Ma, W, -0.2, W.L + 0.2, yb - 0.2, yb + 0.35, 0, 1.1); wrect(Ma, W, -0.2, W.L + 0.2, yb + 0.35, yb + 1.25, 1.05);
    for (let k = 0; k < nb; k++){ const u = (k + 0.5)*bw; warch(rng() < 0.35 ? Wl : Wd, W, u, yb + 0.5, 0.75, 5.2, 0.06, 6);   // arcaded 14th - 15th storeys
      wrect(Tr, W, u + bw/2 - 0.3, u + bw/2 + 0.3, yb, yb + 6.0, 0.14); wrect(rng() < 0.3 ? Wl : Wd, W, u - 0.6, u + 0.6, yb + 6.6, yb + 8.4, 0.06); }
    wbox(Tr, W, -0.4, W.L + 0.4, yC - 1.1, yC + 0.4, 0, 1.0); wrect(Ma, W, -0.4, W.L + 0.4, yC + 0.4, yC + 1.0, 0.85);          // cornice + parapet
  };
  for (const P of [WN, WE, WS]){ const s = area(P) > 0 ? 1 : -1; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length];
    const street = P === WN ? i === 0 : P === WE ? i === 1 : (i === 2 || i === 4);
    const court = (P === WN && i === 2) || (P === WS && i === 0) || (P === WE && i === 3);
    if (court){ const W = wmap(a, b, s); wWins(Wd, Wl, W, 0, W.L, 21, FH, 11, 3.4, 1.2, 2.0, 0.06, 0.3, rng); continue; }
    facade(a, b, s, street); } }
  // ---------- roofs: green mansards with three rows of dormers, hipped corner pavilions, chimneys, copper cresting ----------
  const dorm = (W, u0, u1, ins, yTop, pav) => {          // dormers along a roof slope (inset ins at yTop above the cornice line)
    const n = Math.max(1, Math.round((u1 - u0)/3.65)), st = (u1 - u0)/n;
    for (const [y0, h, f] of [[yC + 1.6, 3.2, 0.13], [yC + 6.6, 2.9, 0.38], [yC + 11.2, 2.4, 0.62]]){
      if (y0 + h > yTop - 1.5) continue; const s0 = ins*(y0 - yC)/(yTop - yC);
      for (let k = 0; k < n; k++){ if (f > 0.5 && k % 2) continue; const u = u0 + (k + 0.5)*st, hw = f > 0.5 ? 0.7 : 0.95;
        wbox(Br, W, u - hw, u + hw, y0, y0 + h, -s0 + 0.35, -s0 - 2.2);
        wrect(rng() < 0.3 ? Wl : Wd, W, u - hw + 0.3, u + hw - 0.3, y0 + 0.4, y0 + h - 0.5, -s0 + 0.37);
        const a = W(u - hw - 0.15, y0 + h, -s0 + 0.5), b = W(u + hw + 0.15, y0 + h, -s0 + 0.5), c = W(u, y0 + h + 1.1, -s0 + 0.5), a2 = W(u - hw - 0.15, y0 + h, -s0 - 2.2), b2 = W(u + hw + 0.15, y0 + h, -s0 - 2.2), c2 = W(u, y0 + h + 1.1, -s0 - 2.2);
        tri(Cu, a, b, c); quad(Cu, a, c, c2, a2); quad(Cu, c, b, b2, c2); } } };
  const mans = (x0, x1, z0, z1, ins, axis) => { hipR(Rf, X(x0), X(x1), Z(z0), Z(z1), yC + 1.0, yR - yC - 1.0, axis === 'x' ? 0 : ins, axis === 'x' ? ins : 0);
    if (axis === 'x') for (const z of [Z(z0) + ins, Z(z1) - ins]) abox(Cu, X(x0), X(x1), yR, yR + 0.6, z - 0.15, z + 0.15, true);
    else for (const x of [X(x0) + ins, X(x1) - ins]) abox(Cu, x - 0.15, x + 0.15, yR, yR + 0.6, Z(z0), Z(z1), true); };
  const pav = (x0, x1, z0, z1, top) => { const ix = (x1 - x0)/2 - 2.4, iz = (z1 - z0)/2 - 2.4; hipR(Rf, X(x0), X(x1), Z(z0), Z(z1), yC + 1.0, top - yC - 1.0, ix, iz);
    abox(Cu, X(x0) + ix - 0.2, X(x1) - ix + 0.2, top, top + 0.8, Z(z0) + iz - 0.2, Z(z1) - iz + 0.2, true);
    for (const [x, z] of [[X(x0) + ix, Z(z0) + iz], [X(x1) - ix, Z(z1) - iz]]) seg(Cu, [x, top + 0.8, z], [x, top + 3.2, z], 0.12, 4); };
  mans(-29.4, 24.5, -23.6, 1.0, 6.4, 'x'); mans(24.0, 45.9, -1.0, 21.0, 6.4, 'z'); mans(-38.3, 24.5, 21.0, 39.9, 6.0, 'x'); mans(19.5, 41.0, 39.0, 41.1, 0.6, 'x');
  pav(24.0, 45.9, -23.6, -0.5, 84.5); pav(24.0, 45.9, 19.5, 39.6, 84.5); pav(-32.1, -12.5, -23.6, -10.6, 84); pav(-38.3, -21.0, 24.5, 39.9, 82.5);
  // dormers on the street slopes
  { const sN = area(WN) > 0 ? 1 : -1, sE = area(WE) > 0 ? 1 : -1, sS = area(WS) > 0 ? 1 : -1;
    const Wn = wmap(WN[0], WN[1], sN), We = wmap(WE[1], WE[2], sE), Ws = wmap(WS[4], WS[5], sS), Ws2 = wmap(WS[2], WS[3], sS);
    dorm(Wn, 2.0, 18.5, 9.2, 84.5); dorm(Wn, 20.5, 55.5, 6.4, yR); dorm(Wn, 57.5, 72.0, 9.2, 84.5);
    dorm(We, 1.5, 16.0, 8.6, 84.5); dorm(We, 18.5, 36.5, 6.4, yR); dorm(We, 39.5, 55.0, 8.6, 84.5);
    dorm(Ws, 3.0, 40.0, 6.0, yR); dorm(Ws, 41.5, 56.0, 5.3, 82.5); dorm(Ws2, 2.0, 16.0, 9.2, 84.5); }
  // chimneys (white brick, copper caps)
  for (const [x, z, h] of [[-20, -12, 81.5], [-2, -1.5, 81], [12, -12.5, 81.5], [-26, 27, 81], [2, 26.5, 82], [14, 29, 81], [33, 9, 81.5]]){
    abox(Br, X(x) - 1.4, X(x) + 1.4, 70, h, Z(z) - 0.9, Z(z) + 0.9, true); abox(Cu, X(x) - 1.35, X(x) + 1.35, h, h + 0.5, Z(z) - 1.05, Z(z) + 1.05); }
  flat(B.p(FLAT), R(-36, 22, 2, 19), 20.05);
  // ---------- entrances ----------
  { // Fifth Avenue: six Tuscan columns carrying the second-storey balcony, facing the fountain
    const x0 = X(45.9), z0 = Z(2.0), z1 = Z(16.6);
    abox(Ma, x0, x0 + 3.6, yG + 6.0, yG + 6.9, z0, z1); abox(Ma, x0 + 3.3, x0 + 3.6, yG + 6.9, yG + 8.0, z0, z1, true);
    for (let i = 0; i < 6; i++){ const z = z0 + 0.8 + i*(z1 - z0 - 1.6)/5; cyl(Ma, x0 + 2.9, z, [0.42, 0.36], yG, yG + 6.0, 10, false); abox(Ma, x0 + 2.4, x0 + 3.4, yG + 5.6, yG + 6.0, z - 0.5, z + 0.5); }
    const W = wmap([x0, z1], [x0, z0], -1); for (const u of [3.4, 7.3, 11.2]) warch(Wl, W, u, yG + 0.2, 1.5, 5.4, 0.25, 6); }
  { // Central Park South: porch over the three centre bays
    const z0 = Z(-23.6), xa = X(4.4), xb = X(15.4);
    abox(Ma, xa, xb, yG + 5.4, yG + 6.2, z0 - 3.4, z0); abox(Ma, xa, xb, yG + 6.2, yG + 7.0, z0 - 3.4, z0 - 3.1, true);
    for (const x of [xa + 0.4, (xa + xb)/2 - 2.2, (xa + xb)/2 + 2.2, xb - 0.4]) cyl(Ma, x, z0 - 2.9, 0.33, -10, yG + 5.4, 10, false);
  }
  // ---------- the narrow neighbour on Central Park South (its real footprint falls under the hotel's plan): plain limestone front
  { const P = R(-39.2, -32.1, -23.5, 5.4), s = area(P) > 0 ? 1 : -1; prism(B.p(TRIM), P, -10, 32.5, true);
    const W = wmap(P[0], P[1], s); wWins(Wd, Wl, W, 0.4, W.L - 0.4, yG + 4.5, 3.1, 9, 2.4, 1.2, 1.9, 0.06, 0.3, rng); wrect(Wd, W, 0.8, W.L - 0.8, -6, yG + 3.6, 0.06);
    wbox(Tr, W, -0.2, W.L + 0.2, 31.6, 32.5, 0, 0.6); }
  // ---------- Grand Army Plaza (south half): paving, the Pulitzer Fountain, the trees ----------
  const fx = X(88.7), fz = Z(12.5), yP = -1.2, Gr = B.p(GRAN), Wa = B.p(WAT);
  flat(B.p(PAVE), rect(X(62), X(114), Z(-4.5), Z(33)), yP - 0.05); abox(B.p(PAVE), X(62), X(114), -4, yP - 0.06, Z(-4.5), Z(33), true);
  // the lower pool: a semicircle to the south with straight sides, steps up to the terrace on the north
  const D = [], rP = 11.2; for (let i = 0; i <= 16; i++){ const a = PI*i/16; D.push([fx + Math.cos(a)*rP, fz + Math.sin(a)*rP]); } D.push([fx - rP, fz - 9.5], [fx + rP, fz - 9.5]);
  prism(Gr, D, yP - 0.3, yP + 0.55, true); flat(Wa, D.map(p => [fx + (p[0] - fx)*0.94, fz + (p[1] - fz)*0.94 - 0.3]), yP + 0.58);
  for (let i = 0; i < 4; i++) abox(Gr, fx - rP - 1.2, fx + rP + 1.2, yP - 0.2, yP + 0.18*(i + 1), fz - 9.5 - 1.2 - i*0.7, fz - 9.5 - 1.9 - i*0.7, true);
  // the tiers of granite basins and the pedestal, Pomona in bronze on top (6.7 m)
  lathe(Gr, [[6.2, yP + 0.5], [6.2, yP + 1.05], [5.7, yP + 1.05], [5.7, yP + 0.9], [4.4, yP + 0.9]], fx, fz, 28); lathe(Wa, [[5.75, yP + 0.98], [1.0, yP + 0.98]], fx, fz, 28);
  lathe(Gr, [[4.4, yP + 0.9], [4.4, yP + 1.9], [3.9, yP + 1.9], [3.9, yP + 1.75], [2.9, yP + 1.75]], fx, fz, 24); lathe(Wa, [[3.95, yP + 1.83], [1.0, yP + 1.83]], fx, fz, 24);
  lathe(Gr, [[2.9, yP + 1.75], [2.9, yP + 2.7], [2.5, yP + 2.7], [2.5, yP + 2.55], [1.0, yP + 2.55]], fx, fz, 20); lathe(Wa, [[2.55, yP + 2.63], [0.9, yP + 2.63]], fx, fz, 20);
  lathe(Gr, [[0.9, yP + 2.55], [0.7, yP + 3.0], [0.6, yP + 3.2], [1.9, yP + 3.5], [1.9, yP + 3.75], [0.5, yP + 3.8], [0.55, yP + 4.6], [0.75, yP + 4.75], [0, yP + 4.8]], fx, fz, 16);
  lathe(B.p(BRZ), [[0, yP + 4.8], [0.42, yP + 4.85], [0.38, yP + 5.6], [0.28, yP + 6.2], [0.2, yP + 6.35], [0.16, yP + 6.5], [0, yP + 6.7]], fx, fz, 8);
  seg(B.p(BRZ), [fx + 0.25, yP + 6.0, fz], [fx + 0.55, yP + 6.55, fz - 0.15], 0.1, 4); lathe(B.p(BRZ), [[0, yP + 6.4], [0.3, yP + 6.55], [0, yP + 6.75]], fx + 0.55, fz - 0.15, 6);
  for (let i = 0; i < 24; i++){ const a = i/24*TAU, x = fx + Math.cos(a)*5.9, z = fz + Math.sin(a)*5.9; tri(Wa, [x - Math.sin(a)*0.15, yP + 0.6, z + Math.cos(a)*0.15], [x + Math.sin(a)*0.15, yP + 0.6, z - Math.cos(a)*0.15], [x + Math.cos(a)*1.3, yP + 0.62, z + Math.sin(a)*1.3]); }
  // trees: the row along the south side and round the plaza edges
  for (let i = 0; i < 9; i++) treeB(B.p(TRUNK), B.p(LEAF), X(66 + i*5.8), yP, Z(30.5), 1.1 + rng()*0.2);
  for (let i = 0; i < 5; i++) treeB(B.p(TRUNK), B.p(LEAF), X(111), yP, Z(-1 + i*6.2), 1.1 + rng()*0.2);
  B.flush(g);
  return g; }};
SG_PLACES.push((() => { const fx = 40, fz = 10, r = -0.4974, ex = fx*Math.cos(r) + fz*Math.sin(r), ez = -fx*Math.sin(r) + fz*Math.cos(r); return {type:'nyplaza', lat:+(40.76455 - ez/111048).toFixed(7), lon:+(-73.97445 + ex/84516).toFixed(7), rot:r}; })());

// ===== Lincoln Center for the Performing Arts (Columbus Avenue, 62nd - 65th Streets). Travertine buildings round the raised
// Josie Robertson Plaza and the Revson Fountain: the Metropolitan Opera House (1966, Wallace Harrison) with its five 27 m arches
// in front of the glass lobby (the two Chagall murals and the starburst chandeliers behind), travertine fins on the sides, the
// stage house behind; David Geffen Hall (1962, Max Abramovitz; rebuilt 2022) inside its peristyle of tapered travertine columns
// under a thin roof; the David H. Koch Theater (1964, Philip Johnson) with the columned loggia and the promenade balcony; the
// Vivian Beaumont Theater (1965, Eero Saarinen) and the Library for the Performing Arts, the travertine lid over glass; Hearst
// Plaza with the reflecting pool and Henry Moore's Reclining Figure, the plane-tree grove and the Lincoln Ristorante under its
// sloping lawn roof; the grand stair to Columbus Avenue; the Guggenheim Bandshell in Damrosch Park. Plaza 2.3 m above Columbus Ave.
// Origin: grid point (-53, 14) of the ref (anchor 40.7725, -73.9835).
LANDMARKS.nylincoln = {zh:'林肯表演艺术中心', en:'Lincoln Center', cat:'new', r:165, h:44,
  lt:{m:0, c:'#ffe4bc', k:0.85, e:0.55, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng, OX = -53, OZ = 14;
  const X = x => x - OX, Z = z => z - OZ, R = (x0, x1, z0, z1) => rect(X(x0), X(x1), Z(z0), Z(z1));
  const TRAV = {c:'#e7e0d1', m:0, lk:0.85, lc:'#ffe9c8'}, TRIM = {c:'#d6cebd', m:0, lk:0.7}, GLW = {c:'#4d4132', glow:'#ffcf8a', gk:0.85}, GLD = {c:'#384047', m:0, lk:0.12};
  const MURR = {c:'#b8463b', glow:'#d0503f', gk:0.45}, MURY = {c:'#d8b146', glow:'#e6bf55', gk:0.45}, CHAN = {c:'#f2e5c4', glow:'#fff1c8', gk:1.7};
  const PAVE = '#d8d2c5', PAVD = '#615f5a', WAT = {c:'#6f9fb3', glow:'#a8e0ff', gk:0.65}, LAWN = '#6d9a4c', LEAF = '#5a7a43', TRUNK = '#5a4a3a', ROOF = '#8b8b87', BRZ = {c:'#4f4b3e', m:0, lk:0.6};
  const Tv = B.p(TRAV), Tm = B.p(TRIM), Gw = B.p(GLW), Gd = B.p(GLD), Rf = B.p(ROOF), Pv = B.p(PAVE);
  const yP = 1.2, yB = -7;                                           // plaza level, foundations
  // ---------- the plaza podium ----------
  const JRP = R(-38.7, 50.2, -11.6, 41.4), HP1 = R(-84.2, -11.4, -91.0, -11.4), HP2 = R(-116.7, -84.0, -30.0, -11.2);
  for (const P of [JRP, HP1, HP2]){ prism(Tm, P, yB, yP - 0.02, false); flat(Pv, P, yP); }
  // the grand stair down to Columbus Avenue (between Geffen Hall and the Koch Theater)
  for (let i = 0; i < 14; i++){ const x0 = X(50.2 + i*0.75), y1 = yP - (i + 1)*0.18; abox(Pv, x0, x0 + 0.75, yB, y1, Z(-11.6), Z(39.8), true); }
  for (const z of [-11.6, 39.4]) abox(Tm, X(50.2), X(60.7), yB, yP + 0.9, Z(z), Z(z + 0.4), true);
  // ---------- the Revson Fountain: dark granite basin, programmable jets (lit at night) ----------
  const fX = X(5.0), fZ = Z(14.5), Wa = B.p(WAT), Pd = B.p(PAVD);
  for (const r of [16, 23, 30]) lathe(Pd, [[r + 0.35, yP + 0.03], [r - 0.35, yP + 0.03]], fX, fZ, 48);
  lathe(Pd, [[9.9, yP], [9.9, yP + 0.5], [9.3, yP + 0.5], [9.3, yP + 0.3]], fX, fZ, 40); lathe(Wa, [[9.35, yP + 0.38], [0, yP + 0.38]], fX, fZ, 40);
  for (let k = 0; k < 2; k++){ const r = k ? 6.5 : 3.6, n = k ? 24 : 12, h = k ? 3.2 : 5.5; for (let i = 0; i < n; i++){ const a = i/n*TAU, x = fX + Math.cos(a)*r, z = fZ + Math.sin(a)*r;
    quad(Wa, [x - Math.sin(a)*0.18, yP + 0.38, z + Math.cos(a)*0.18], [x + Math.sin(a)*0.18, yP + 0.38, z - Math.cos(a)*0.18], [x + Math.sin(a)*0.05, yP + 0.38 + h, z - Math.cos(a)*0.05], [x - Math.sin(a)*0.05, yP + 0.38 + h, z + Math.cos(a)*0.05]); } }
  lathe(Wa, [[0.5, yP + 0.38], [0.35, yP + 7], [0.08, yP + 10.5], [0, yP + 10.8]], fX, fZ, 8);
  // ---------- the Metropolitan Opera House ----------
  { const xf = X(-38.7), x0 = X(-176.2), z0 = Z(-11.3), z1 = Z(41.4), yT = yP + 29.3;
    prism(Tv, rect(x0, xf - 3.1, z0, z1), yB, yT, false); flat(Pv, rect(xf - 3.1, xf, z0, z1), yP + 0.01);
    abox(Tv, X(-166.7), X(-115.3), yB, yP + 18, Z(41.4), Z(50.1), true);                       // rear annex
    flat(Rf, rect(x0, xf - 3.1, z0, z1), yT); abox(Tv, X(-114), X(-60), yT, yT + 3.0, z0 + 2, z1 - 2, true);    // roof, auditorium
    abox(Tv, X(-157.7), X(-114.4), yP, yP + 42, Z(-1.1), Z(31.8), true);                       // the stage house
    // travertine fins on the north, south and west sides
    const sideFins = (a, b, sg) => { const W = wmap(a, b, sg); wrect(Gd, W, 0, W.L, yP, yT - 2, 0.02); for (let u = 0.6; u < W.L; u += 1.6) wbox(Tv, W, u - 0.3, u + 0.3, yB, yT - 0.2, 0, 0.55);
      wbox(Tv, W, -0.4, W.L + 0.4, yT - 2.2, yT + 0.4, 0, 0.7); };
    sideFins([x0, z1], [xf - 3.1, z1], -1); sideFins([xf - 3.1, z0], [x0, z0], -1); sideFins([x0, z0], [x0, z1], -1);
    // the east front: the glass lobby set back 3.1 m behind the five arches
    const xg = xf - 3.1, Wg = wmap([xg, z1], [xg, z0], -1);
    wrect(Gw, Wg, 0, Wg.L, yP, yT - 1.0, 0.0); for (let u = 0; u <= Wg.L; u += 2.05) wrect(Tm, Wg, u - 0.08, u + 0.08, yP, yT - 1, 0.06);
    for (let y = yP + 4.5; y < yT - 2; y += 4.5) wrect(Tm, Wg, 0, Wg.L, y - 0.08, y + 0.08, 0.06);
    wrect(B.p(MURY), Wg, 44.5, 52.0, yP + 13, yP + 22.5, 0.12); wrect(B.p(MURR), Wg, 0.7, 8.2, yP + 13, yP + 22.5, 0.12);          // the Chagall murals (north / south)
    for (let i = 0; i < 9; i++){ const u = 12 + i*3.6, y = yP + 15 + (i % 3)*3, p = Wg(u, y, 0.9); lathe(B.p(CHAN), [[0, y - 0.9], [0.9, y], [0, y + 0.9]], p[0], p[2], 8); }
    // the arcade: two solid end bays and five round arches, 3.1 m deep
    const L = z1 - z0, ew = 4.6, n = 5, pw = 1.3, aw = (L - 2*ew - (n - 1)*pw)/n, ys = yT - 4.3 - aw/2, yt = yT, Wf = wmap([xf, z1], [xf, z0], -1);
    wbox(Tv, Wf, 0, ew, yB, yt, -3.1, 0); wbox(Tv, Wf, L - ew, L, yB, yt, -3.1, 0);
    for (let k = 0; k < n - 1; k++){ const u = ew + (k + 1)*aw + k*pw; wbox(Tv, Wf, u, u + pw, yB, yt, -3.1, 0); }
    for (let k = 0; k < n; k++){ const u0 = ew + k*(aw + pw), u1 = u0 + aw, cu = (u0 + u1)/2, hw = aw/2;
      // spandrels (front and back faces) and the soffit of each arch
      for (let i = 0; i < 12; i++){ const t0 = PI*i/12, t1 = PI*(i + 1)/12, a = [cu + Math.cos(t0)*hw, ys + Math.sin(t0)*hw], b = [cu + Math.cos(t1)*hw, ys + Math.sin(t1)*hw];
        for (const o of [0, -3.1]){ quad(Tv, Wf(a[0], a[1], o), Wf(b[0], b[1], o), Wf(b[0], yt, o), Wf(a[0], yt, o)); }
        quad(Tv, Wf(a[0], a[1], 0), Wf(a[0], a[1], -3.1), Wf(b[0], b[1], -3.1), Wf(b[0], b[1], 0)); } }
    wbox(Tv, Wf, -0.3, L + 0.3, yt - 0.1, yt + 0.6, -3.4, 0.3); }
  // ---------- David Geffen Hall: glass hall inside a peristyle of tapered travertine columns ----------
  { const gx0 = X(-11.5), gx1 = X(48.1), gz0 = Z(-90.7), gz1 = Z(-11.4), yT = yP + 27.4;
    prism(Gw, rect(gx0 + 3.2, gx1 - 3.2, gz0 + 3.2, gz1 - 3.2), yB, yT - 0.5, false);
    for (let y = yP + 6.5; y < yT - 2; y += 6.5) bandsP(Tm, rect(gx0 + 3.2, gx1 - 3.2, gz0 + 3.2, gz1 - 3.2), [y], 0.6, 0.05);
    stripsP(Tm, rect(gx0 + 3.2, gx1 - 3.2, gz0 + 3.2, gz1 - 3.2), yP, yT - 0.5, 2.6, 0.16, 0.05);
    abox(Tv, gx0 - 0.4, gx1 + 0.4, yT - 1.2, yT + 0.4, gz0 - 0.4, gz1 + 0.4); abox(Tv, gx0 + 6, gx1 - 6, yT + 0.4, yT + 4.2, gz0 + 8, gz1 - 8, true);
    const col = (x, z, ax) => { const bw = 0.55, tw = 0.95, bd = 0.45, td = 0.75, y0 = yP, y1 = yT - 1.2;
      const P = (sx, sz, y, w, d) => ax ? [x + sx*d, y, z + sz*w] : [x + sx*w, y, z + sz*d];
      for (const [a, b] of [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]]) quad(Tv, P(a[0], a[1], y0, bw, bd), P(b[0], b[1], y0, bw, bd), P(b[0], b[1], y1, tw, td), P(a[0], a[1], y1, tw, td)); };
    for (let i = 0; i <= 10; i++){ const x = gx0 + 1.0 + i*(gx1 - gx0 - 2)/10; col(x, gz0 + 1.0, false); col(x, gz1 - 1.0, false); }
    for (let i = 1; i < 13; i++){ const z = gz0 + 1.0 + i*(gz1 - gz0 - 2)/13; col(gx0 + 1.0, z, true); col(gx1 - 1.0, z, true); }
    abox(Tm, gx0, gx1, yB, yP, gz0, gz1, true); }
  // ---------- the David H. Koch Theater ----------
  { const kx0 = X(-11.1), kx1 = X(48.3), kz0 = Z(39.8), kz1 = Z(119.5), yT = yP + 28;
    prism(Tv, rect(kx0, kx1, kz0 + 3.6, kz1), yB, yT, false); flat(Rf, rect(kx0, kx1, kz0 + 3.6, kz1), yT);
    abox(Tv, X(-3.4), X(39.1), yT, yT + 3, Z(56), Z(99), true); abox(Tv, X(5.6), X(30.9), yP, yP + 35, Z(99.1), Z(116.6), true);
    for (const [a, b] of [[[kx1, kz0 + 3.6], [kx1, kz1]], [[kx0, kz1], [kx0, kz0 + 3.6]], [[kx1, kz1], [kx0, kz1]]]){ const W = wmap(a, b, area(rect(kx0, kx1, kz0, kz1)) > 0 ? 1 : -1);
      for (let u = 2.5; u < W.L - 1; u += 5.0) wrect(Gd, W, u, u + 0.9, yP + 2, yT - 3, 0.04); wbox(Tv, W, -0.3, W.L + 0.3, yT - 1.6, yT + 0.3, 0, 0.5); }
    // the front loggia: the gold-lit promenade glass behind a colonnade of paired travertine piers, the balcony
    const Wk = wmap([kx0, kz0 + 3.6], [kx1, kz0 + 3.6], 1);
    wrect(Gw, Wk, 0, Wk.L, yP, yT - 1.5, 0.0); for (let y = yP + 5.5; y < yT - 2; y += 5.5) wrect(Tm, Wk, 0, Wk.L, y - 0.2, y + 0.2, 0.05);
    for (let k = 0; k < 11; k++){ const u = 2.7 + k*(Wk.L - 5.4)/10; for (const d of [-0.85, 0.85]) wbox(Tv, Wk, u + d - 0.45, u + d + 0.45, yP, yT, 2.6, 3.6); }
    wbox(Tv, Wk, -0.2, Wk.L + 0.2, yT - 1.6, yT + 0.3, 0, 3.8); wbox(Tv, Wk, 0, Wk.L, yP + 9.4, yP + 10.2, 0, 2.6); wbox(Tm, Wk, 0, Wk.L, yP + 10.2, yP + 11.3, 2.45, 2.6);
    abox(Tm, kx0, kx1, yB, yP, kz0, kz0 + 3.6, true); }
  // ---------- Vivian Beaumont Theater and the Library: the travertine lid over glass ----------
  { const Pb = [[X(-176.3), Z(-90.7)], [X(-84.2), Z(-90.9)], [X(-84.2), Z(-30.0)], [X(-176.3), Z(-30.0)]];
    prism(Gd, Pb.map(p => [p[0] + (p[0] > X(-130) ? -3 : 3), p[1] + (p[1] < Z(-60) ? 3 : -3)]), yB, yP + 8.5, false);
    for (let i = 0; i <= 6; i++) for (const z of [Z(-87.7), Z(-33.0)]){ const x = X(-173.3) + i*(X(-87.2) - X(-173.3))/6; abox(Tv, x - 0.7, x + 0.7, yB, yP + 8.5, z - 0.7, z + 0.7, true); }
    prism(Tv, Pb, yP + 8.5, yP + 21.5, true, true); bandsP(Tm, Pb, [yP + 8.5], 0.9, 0.15);
    for (const y of [yP + 12.5, yP + 16.8]) bandsP(Gd, Pb, [y], 1.4, 0.05);
    abox(Tv, X(-157.0), X(-103.5), yP + 21.5, yP + 28.2, Z(-86.4), Z(-35.6), true);
    const Wl = rect(X(-176.2), X(-116.7), Z(-29.9), Z(-11.2)); prism(Tv, Wl, yB, yP + 18, true); bandsP(Gd, Wl, [yP + 3, yP + 9, yP + 13.5], 2.6, 0.05); }
  // ---------- Hearst Plaza: the reflecting pool with the Reclining Figure, the grove, the Ristorante's lawn roof ----------
  { const Wa2 = B.p(WAT), Br = B.p(BRZ);
    abox(Tm, X(-83), X(-41), yP, yP + 0.55, Z(-70), Z(-34), true); flat(Wa2, R(-82.4, -41.6, -69.4, -34.6), yP + 0.57);
    const mx = X(-50.5), mz = Z(-56.5), yW = yP + 0.57;
    lathe(Br, [[0, yW], [1.6, yW + 0.2], [1.9, yW + 1.6], [1.2, yW + 3.0], [0.4, yW + 3.6], [0, yW + 3.7]], mx - 2.2, mz, 7);
    seg(Br, [mx - 1.0, yW + 2.4, mz], [mx + 3.2, yW + 1.0, mz + 0.4], 1.0, 6); seg(Br, [mx + 2.4, yW, mz - 0.3], [mx + 4.6, yW + 2.4, mz + 0.4], 1.1, 6); seg(Br, [mx - 3.8, yW + 3.2, mz], [mx - 2.8, yW + 4.4, mz + 0.2], 0.7, 6);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) treeB(B.p(TRUNK), B.p(LEAF), X(-36 + i*7.2), yP, Z(-66 + j*7.0), 1.25 + rng()*0.15);
    // Lincoln Ristorante: glass walls under the sloping hyperbolic-paraboloid lawn
    const rx0 = X(-74.2), rx1 = X(-29.7), rz0 = Z(-91.7), rz1 = Z(-73.2), hh = (u, v) => yP + 7.6*(1 - u)*(1 - v) + 1.6*u*(1 - v) + 0.1*u*v + 4.2*(1 - u)*v;
    const nu = 10, nv = 5, pt = (i, j) => { const u = i/nu, v = j/nv; return [rx0 + (rx1 - rx0)*u, hh(u, v), rz0 + (rz1 - rz0)*v]; };
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) quad(B.p(LAWN), pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1));
    for (let i = 0; i < nu; i++){ const a = pt(i, 0), b = pt(i + 1, 0); quad(Gw, [a[0], yP, a[2]], [b[0], yP, b[2]], [b[0], b[1] - 0.3, b[2]], [a[0], a[1] - 0.3, a[2]]); }
    for (let j = 0; j < nv; j++) for (const i of [0, nu]){ const a = pt(i, j), b = pt(i, j + 1); quad(Gw, [a[0], yP, a[2]], [b[0], yP, b[2]], [b[0], b[1] - 0.3, b[2]], [a[0], a[1] - 0.3, a[2]]); }
    for (let i = 0; i < nu; i++){ const a = pt(i, nv), b = pt(i + 1, nv); quad(Gw, [a[0], yP, a[2]], [b[0], yP, b[2]], [b[0], Math.max(yP, b[1] - 0.3), b[2]], [a[0], Math.max(yP, a[1] - 0.3), a[2]]); }
    abox(Gw, X(-83.2), X(-77.0), yP, yP + 3.0, Z(-97.4), Z(-91.0), true); }
  // ---------- the Guggenheim Bandshell in Damrosch Park (opening east) ----------
  { const bx = X(-168), bz = Z(92), gb = yP - 3.0; abox(Tm, bx - 2, bx + 12, yB, gb + 1.2, bz - 11, bz + 11, true);
    lathe(Tv, [[11, gb + 1.2], [10.6, gb + 4.5], [9.4, gb + 7.6], [7.2, gb + 10.2], [4.2, gb + 11.8], [0, gb + 12.4]], bx, bz, 12, HP, PI);
    for (let i = 0; i < 6; i++) treeB(B.p(TRUNK), B.p(LEAF), X(-150 + i*20), gb, Z(64), 1.3 + rng()*0.2);
    for (let i = 0; i < 6; i++) treeB(B.p(TRUNK), B.p(LEAF), X(-150 + i*20), gb, Z(124), 1.3 + rng()*0.2); }
  B.flush(g);
  return g; }};
placeG('nylincoln', 40.7725, -73.9835, -53, 14);

// ===== Carnegie Hall (1891, William B. Tuthill; studio wings 1894-97), Seventh Avenue and 57th Street, with Carnegie Hall Tower
// (1991, Cesar Pelli) next door, which wraps into the hall's light court (included so the city keeps no half-hidden tower).
// The hall: reddish-brown Roman brick with terracotta bands, pilasters and arches in a modified Italian Renaissance style; the
// eight-storey main building on the corner (the five-arch granite arcade at the street, the tall round-arched windows of the
// second storey, the two-and-a-half-storey central arcade over the balustraded balcony, the frieze, the paired round-arched
// windows of the sixth storey, the cornice, the arcaded seventh-storey wall), the same design with blind brick openings on
// Seventh Avenue; the 13-storey studio wing on 56th Street and the 16-storey studio wing to the east; the entrance canopy.
// The tower: 60 storeys, 231 m, a slender slab of dark red brick banded with cream, the lower wing rising to 170 m in the hall's
// court, the open steel cornice at the top. Origin: grid point (13, 10.4) of the ref (anchor 40.7651, -73.9799).
LANDMARKS.nycarnegie = {zh:'卡内基音乐厅', en:'Carnegie Hall', cat:'old', r:45, h:231,
  lt:{m:0, c:'#ffdcae', k:0.9, e:0.45, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng, OX = 13, OZ = 10.4;
  const X = x => x - OX, Z = z => z - OZ, R = (x0, x1, z0, z1) => rect(X(x0), X(x1), Z(z0), Z(z1));
  const BRK = {c:'#9b5b45', m:0, lk:0.75, lc:'#ffd9ae'}, TC = {c:'#b98a69', m:0, lk:0.85, lc:'#ffe0b8'}, GRN = {c:'#a99c90', m:0, lk:0.8}, WIN = '#2b2a2a', LIT = {c:'#3a3128', glow:'#ffd29a', gk:0.75};
  const CBR = {c:'#7c3d30', m:0, lk:0.25}, CRM = {c:'#d7c6a5', m:0, lk:0.35}, STL = {c:'#3f4844', m:0, lk:0.4, lc:'#e8f0ff'}, ROOF = '#6f6a66', CAN = {c:'#2d2b2a', glow:'#ffe2b0', gk:0.9};
  const Bk = B.p(BRK), Tc = B.p(TC), Gr = B.p(GRN), Wd = B.p(WIN), Wl = B.p(LIT), Rf = B.p(ROOF);
  const yG = -0.7;
  // ---------- masses ----------
  const MB = R(-18.2, 14.5, -20.1, 33.0), EW1 = R(14.5, 27.7, -20.1, 9.4), EW2 = R(14.5, 22.1, 9.4, 32.2), EW3 = R(14.5, 27.8, 32.2, 41.5), SW = R(-18.2, 14.5, 33.0, 41.5);
  prism(Bk, MB, -4, 37.0, false); flat(Rf, MB, 37.0); { const P8 = R(-16.7, 13.0, -18.6, 31.5); prism(Bk, P8, 37.0, 40.6, true); const s8 = area(P8) > 0 ? 1 : -1;
    for (let i = 0; i < 4; i++){ const W = wmap(P8[i], P8[(i + 1) % 4], s8); wWins(Wd, Wl, W, 0.5, W.L - 0.5, 37.4, 3.2, 1, 2.4, 1.2, 1.9, 0.05, 0.35, rng); } ledgeP(Tc, P8, 40.4, 41.0, 0.3); }
  prism(Bk, EW1, -4, 55.0, false); flat(Rf, EW1, 55.0); prism(Bk, EW2, -4, 50.0, false); flat(Rf, EW2, 50.0); prism(Bk, EW3, -4, 55.0, false); flat(Rf, EW3, 55.0);
  prism(Bk, SW, -4, 47.0, false); flat(Rf, SW, 47.0);
  // ---------- the main fronts (57th Street: windows; Seventh Avenue: blind brick openings) ----------
  const front = (W, nArc, blind) => { const L = W.L, c = L/2, O = blind ? B.p(CBR) : Wd;
    wrect(Gr, W, 0, L, -4, yG + 7.0, 0.12);                                                                  // granite base
    for (let k = 0; k < 5; k++){ const u = c + (k - 2)*4.6; warch(k === 2 || blind ? Wd : Wl, W, u, yG, 1.6, 5.8, 0.14, 8); wrect(Gr, W, u + 2.0, u + 2.6, yG, yG + 6.6, 0.25); }
    wbox(Tc, W, -0.2, L + 0.2, yG + 7.0, yG + 7.9, 0, 0.7);                                                   // heavy cornice over the base
    for (const u of [2.6, 5.4, L - 5.4, L - 2.6]) warch(O, W, u, yG + 8.3, 0.75, 5.4, 0.1, 6);                // second-storey arched windows
    wbox(Tc, W, c - 12.5, c + 12.5, yG + 11.2, yG + 11.6, 0, 1.2); wrect(Tc, W, c - 12.5, c + 12.5, yG + 11.6, yG + 12.6, 1.15);   // balcony + balustrade
    const aw = 22/nArc; for (let k = 0; k < nArc; k++){ const u = c - 11 + (k + 0.5)*aw; warch(O, W, u, yG + 12.4, aw*0.36, 9.6, 0.1, 8);
      wrect(Tc, W, u + aw/2 - 0.35, u + aw/2 + 0.35, yG + 12.4, yG + 21.6, 0.2); }
    wrect(Tc, W, c - 11.4, c - 10.7, yG + 12.4, yG + 21.6, 0.2);
    for (const u of [2.4, L - 2.4]) for (const y of [yG + 13.5, yG + 17.5]) wrect(O, W, u - 0.8, u + 0.8, y, y + 2.6, 0.1);
    wrect(Tc, W, 0, L, yG + 21.6, yG + 23.4, 0.15);                                                           // the broad frieze
    for (let k = 0; k < 9; k++) wrect(blind ? O : (rng() < 0.4 ? Wl : Wd), W, 1.6 + k*(L - 3.2)/8 - 0.7, 1.6 + k*(L - 3.2)/8 + 0.7, yG + 24.2, yG + 26.6, 0.1);
    for (let k = 0; k < 5; k++){ const u = c + (k - 2)*5.4; wrect(Tc, W, u - 2.0, u + 2.0, yG + 27.4, yG + 31.4, 0.12);  // sixth storey: square openings with paired arched windows
      for (const d of [-0.9, 0.9]) warch(O, W, u + d, yG + 27.8, 0.62, 3.2, 0.16, 6); }
    wbox(Tc, W, -0.4, L + 0.4, yG + 32.0, yG + 33.4, 0, 1.1);                                                 // main cornice
    for (let k = 0; k < 12; k++){ const u = 1.4 + k*(L - 2.8)/11; warch(O, W, u, yG + 33.8, 0.55, 2.4, 0.08, 6); }   // arcaded seventh-storey wall
    wrect(Tc, W, 0, L, yG + 36.8, yG + 37.7, 0.18);
    for (let k = 0; k <= 14; k++) wrect(Tc, W, k*L/14 - 0.3, k*L/14 + 0.3, yG + 7.9, yG + 32.0, 0.06);    // terracotta pilasters
  };
  const sMB = area(MB) > 0 ? 1 : -1;
  front(wmap(MB[0], MB[1], sMB), 5, false); front(wmap(MB[3], MB[0], sMB), 4, true);
  // ---------- the studio wings: brick with terracotta bands, rows of windows, arched top storey, cornice ----------
  const wing = (W, y1, nf) => { const fh = (y1 - yG - 8)/nf;
    wrect(Gr, W, 0, W.L, -4, yG + 4.5, 0.1); wWins(Wd, Wl, W, 0.8, W.L - 0.8, yG, 4.5, 1, 2.6, 1.6, 3.2, 0.12, 0.3, rng);
    wWins(Wd, Wl, W, 0.8, W.L - 0.8, yG + 5.5, fh, nf - 1, 2.6, 1.25, fh*0.58, 0.06, 0.32, rng);
    for (let f = 2; f < nf; f += 3) wrect(Tc, W, 0, W.L, yG + 5.5 + f*fh - 0.3, yG + 5.5 + f*fh + 0.2, 0.1);
    const n = Math.max(1, Math.round((W.L - 1.6)/2.6)); for (let k = 0; k < n; k++) warch(rng() < 0.3 ? Wl : Wd, W, 0.8 + (k + 0.5)*(W.L - 1.6)/n, y1 - 4.6, 0.6, 3.0, 0.06, 6);
    wbox(Tc, W, -0.3, W.L + 0.3, y1 - 1.1, y1 + 0.2, 0, 0.9); };
  { const s = area(EW1) > 0 ? 1 : -1; wing(wmap(EW1[0], EW1[1], s), 55, 16); }
  { const s = area(SW) > 0 ? 1 : -1; wing(wmap(SW[2], SW[3], s), 47, 13); wing(wmap(SW[3], SW[0], s), 47, 13); }
  { const s = area(EW3) > 0 ? 1 : -1; wing(wmap(EW3[2], EW3[3], s), 55, 16); }
  { const s = area(EW2) > 0 ? 1 : -1; const W = wmap(EW2[1], EW2[2], s); wWins(Wd, Wl, W, 0.8, W.L - 0.8, yG + 5.5, 3.1, 14, 2.6, 1.2, 1.9, 0.06, 0.3, rng); }
  // the entrance canopy on 57th Street
  { const W = wmap(MB[0], MB[1], sMB); wbox(B.p(CAN), W, 6.2, W.L - 6.2, yG + 3.6, yG + 4.2, 0, 3.2); }
  // ---------- Carnegie Hall Tower ----------
  { const T = R(27.7, 44.4, -13.4, 32.3), T2 = R(22.1, 27.7, 9.4, 32.3), L57 = R(27.7, 44.4, -20.1, -13.4), L56 = R(27.8, 44.4, 32.3, 40.8);
    const Cb = B.p(CBR), Cr = B.p(CRM);
    prism(Cb, T, -4, 222, false); flat(Rf, T, 222); prism(Cb, T2, -4, 170, false); flat(Rf, T2, 170); ledgeP(Cr, T2, 169.2, 170.4, 0.25);
    prism(Cb, L57, -4, 25, false); flat(Rf, L57, 25); prism(Cb, L56, -4, 50, false); flat(Rf, L56, 50);
    for (const [P, y0, y1] of [[T, 25, 222], [T2, 50, 170], [L57, yG, 25], [L56, yG, 50]]){ const s = area(P) > 0 ? 1 : -1;
      bandsP(Cr, P, range(y0 + 10.8, y1 - 4, 21.6), 1.4, 0.08);
      for (let i = 0; i < 4; i++){ const W = wmap(P[i], P[(i + 1) % 4], s); if (W.L < 3) continue; wWins(Wd, Wl, W, 0.6, W.L - 0.6, y0 + 0.6, 3.6, Math.floor((y1 - y0 - 1)/3.6), 2.55, 1.3, 2.0, 0.05, 0.36, rng); } }
    // the open steel cornice
    const Tl = ledgeP(B.p(STL), T, 221.6, 222.6, 1.6); prism(B.p(STL), Tl, 229.4, 231, true, true);
    for (const p of Tl){ abox(B.p(STL), p[0] - 0.35, p[0] + 0.35, 222.6, 229.4, p[1] - 0.35, p[1] + 0.35, true); }
    for (let i = 0; i < 4; i++){ const a = Tl[i], b = Tl[(i + 1) % 4], n = Math.round(Math.hypot(b[0] - a[0], b[1] - a[1])/2.8);
      for (let k = 1; k < n; k++){ const t = k/n, x = a[0] + (b[0] - a[0])*t, z = a[1] + (b[1] - a[1])*t; abox(B.p(STL), x - 0.15, x + 0.15, 222.6, 229.4, z - 0.15, z + 0.15, true); } }
    abox(B.p(AVI), X(36) - 0.3, X(36) + 0.3, 231, 231.8, Z(9.4) - 0.3, Z(9.4) + 0.3, true); }
  B.flush(g);
  return g; }};
placeG('nycarnegie', 40.7651, -73.9799, 13, 10.4);

// ===== The Dakota (1884, Henry J. Hardenbergh), 1 West 72nd Street at Central Park West. North German Renaissance apartment
// house round a central courtyard: buff-yellow brick with brownstone and terracotta bands and window frames, eight storeys of
// masonry with oriels and iron balconies, then the steep slate roof with two rows of dormers, the big gables in the middle of the
// fronts, the high pyramidal roofs of the corner pavilions, chimneys, copper cresting and finials; the two-storey carriage
// arch on 72nd Street leading into the courtyard, the dry moat with its iron railing along 72nd Street.
// Origin: grid point (-8.9, -23.9) of the ref (anchor 40.77655, -73.9762).
LANDMARKS.nydakota = {zh:'达科他公寓', en:'The Dakota', cat:'old', r:46, h:51,
  lt:{m:0, c:'#ffdcaa', k:0.8, e:0.5, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng, OX = -8.9, OZ = -23.9;
  const X = x => x - OX, Z = z => z - OZ, R = (x0, x1, z0, z1) => rect(X(x0), X(x1), Z(z0), Z(z1));
  const BRK = {c:'#ccb386', m:0, lk:0.8, lc:'#ffdcae'}, TRIM = {c:'#9b7a5b', m:0, lk:0.6}, SLATE = {c:'#50555b', m:0, lk:0.25}, COP = {c:'#73a08a', m:0, lk:0.5, lc:'#e0fff0'};
  const WIN = '#2a2b2c', LIT = {c:'#3a3129', glow:'#ffd29a', gk:0.75}, IRON = {c:'#2d2f30', m:0, lk:0.1}, CRT = '#a59a88';
  const Bk = B.p(BRK), Tr = B.p(TRIM), Sl = B.p(SLATE), Cu = B.p(COP), Wd = B.p(WIN), Wl = B.p(LIT);
  const yG = -0.5, yC = 30.0;
  const x0 = -39.7, x1 = 21.9, z0 = -55.5, z1 = 7.7, cx0 = -20.0, cx1 = 0.5, cz0 = -42.5, cz1 = -7.5;
  const OUT = R(x0, x1, z0, z1), CT = R(cx0, cx1, cz0, cz1);
  // walls: four wings round the court (outer walls + court walls)
  prism(Bk, OUT, -4, yC, false); prism(Bk, [...CT].reverse(), yG, yC, false); flat(B.p(CRT), CT, yG + 0.02);
  // facades: brownstone bands, windows (pairs), cornice; t = 'street' or 'court'
  const fac = (W, street) => { const L = W.L;
    wrect(Tr, W, 0, L, -4, yG + 1.2, 0.1); for (const y of [yG + 4.4, yG + 11.6, yG + 18.8, yG + 26.0]) wrect(Tr, W, 0, L, y, y + 0.55, 0.12);
    const nb = Math.max(1, Math.round(L/3.3)), bw = L/nb;
    for (let f = 0; f < 8; f++){ const y = f === 0 ? yG + 1.6 : yG + 4.5 + (f - 1)*3.6 + 0.7, h = f === 0 ? 2.2 : 2.1;
      for (let k = 0; k < nb; k++){ const u = (k + 0.5)*bw; wrect(rng() < 0.35 ? Wl : Wd, W, u - 0.6, u + 0.6, y, y + h, 0.08);
        if (street && f > 0 && f % 2 === 1) wrect(Tr, W, u - 0.8, u + 0.8, y + h, y + h + 0.3, 0.14); } }
    wbox(Tr, W, -0.3, L + 0.3, yC - 0.9, yC + 0.25, 0, 0.75);
    if (street){ for (const u of [L*0.3, L*0.7]){ wbox(Bk, W, u - 2.2, u + 2.2, yG + 8.0, yG + 22.4, 0, 1.2); wbox(Tr, W, u - 2.4, u + 2.4, yG + 7.4, yG + 8.0, 0, 1.4);   // oriels
        for (let f = 0; f < 4; f++) wrect(rng() < 0.4 ? Wl : Wd, W, u - 1.3, u + 1.3, yG + 8.8 + f*3.6, yG + 10.8 + f*3.6, 1.22); }
      for (const u of [L*0.12, L*0.5, L*0.88]) for (const y of [yG + 15.2, yG + 22.4]){ wbox(Tr, W, u - 2.0, u + 2.0, y - 0.25, y, 0, 1.1); wrect(B.p(IRON), W, u - 2.0, u + 2.0, y, y + 1.0, 1.08); } }
  };
  const sO = area(OUT) > 0 ? 1 : -1, sC = -sO, CR = [...CT].reverse();
  for (let i = 0; i < 4; i++){ fac(wmap(OUT[i], OUT[(i + 1) % 4], sO), true); fac(wmap(CR[i], CR[(i + 1) % 4], sO), false); }
  // the carriage arch on 72nd Street into the courtyard
  { const W = wmap(OUT[2], OUT[3], sO), u = X(x1) - X(-9.7); wbox(Tr, W, u - 3.4, u + 3.4, yG, yG + 8.4, -0.2, 0.5); warch(Wd, W, u, yG, 2.3, 7.0, 0.52, 10);
    for (let i = 0; i < 12; i++){ const t = (i + 0.5)/12*W.L; if (Math.abs(t - u) < 4) continue; abox(B.p(IRON), ...(() => { const p = W(t, 0, 2.2); return [p[0] - 0.05, p[0] + 0.05, yG, yG + 1.1, p[2] - 0.05, p[2] + 0.05]; })(), true); }
    const a = W(0, 0, 2.2), b = W(u - 4, 0, 2.2), c = W(u + 4, 0, 2.2), d = W(W.L, 0, 2.2);
    for (const [p, q] of [[a, b], [c, d]]) quad(B.p(IRON), [p[0], yG + 1.0, p[2]], [q[0], yG + 1.0, q[2]], [q[0], yG + 1.12, q[2]], [p[0], yG + 1.12, p[2]]); }
  // ---------- the roof: steep slate wings, corner pavilions, central gables, dormers, chimneys, copper cresting ----------
  const dep = 2.0, wRoof = (ax0, ax1, az0, az1, alongX) => { const d = alongX ? (az1 - az0) : (ax1 - ax0), ins = d/2 - 1.2;
    hipR(Sl, X(ax0), X(ax1), Z(az0), Z(az1), yC + 0.25, 13.5, alongX ? 0 : ins, alongX ? ins : 0);
    if (alongX) abox(Cu, X(ax0), X(ax1), yC + 13.75, yC + 14.3, Z((az0 + az1)/2) - 0.2, Z((az0 + az1)/2) + 0.2, true);
    else abox(Cu, X((ax0 + ax1)/2) - 0.2, X((ax0 + ax1)/2) + 0.2, yC + 13.75, yC + 14.3, Z(az0), Z(az1), true); };
  wRoof(x0 + 10, x1 - 10, cz1, z1, true); wRoof(x0 + 10, x1 - 10, z0, cz0, true); wRoof(x0, cx0, z0 + 10, z1 - 10, false); wRoof(cx1, x1, z0 + 10, z1 - 10, false);
  const pav = (px0, px1, pz0, pz1) => { hipR(Sl, X(px0), X(px1), Z(pz0), Z(pz1), yC + 0.25, 18.5, (px1 - px0)/2 - 0.8, (pz1 - pz0)/2 - 0.8);
    const cx = X((px0 + px1)/2), cz = Z((pz0 + pz1)/2); abox(Cu, cx - 0.8, cx + 0.8, yC + 18.75, yC + 19.6, cz - 0.8, cz + 0.8, true); seg(Cu, [cx, yC + 19.6, cz], [cx, yC + 21.2, cz], 0.12, 4); };
  pav(x0, x0 + 12.5, z0, z0 + 12.5); pav(x1 - 12.5, x1, z0, z0 + 12.5); pav(x0, x0 + 12.5, z1 - 12.5, z1); pav(x1 - 12.5, x1, z1 - 12.5, z1);
  // central gables (brick, stepped brownstone copings) on each front, dormers on the slopes
  for (let i = 0; i < 4; i++){ const W = wmap(OUT[i], OUT[(i + 1) % 4], sO), L = W.L, c = L/2;
    const G = [[c - 5.5, yC], [c + 5.5, yC], [c + 5.5, yC + 4.0], [c + 2.5, yC + 4.0], [c + 2.5, yC + 9.0], [c, yC + 12.5], [c - 2.5, yC + 9.0], [c - 2.5, yC + 4.0], [c - 5.5, yC + 4.0]];
    for (let k = 1; k < G.length - 1; k++) tri(Bk, W(G[0][0], G[0][1], 0.02), W(G[k][0], G[k][1], 0.02), W(G[k + 1][0], G[k + 1][1], 0.02));
    for (let k = 1; k < G.length - 1; k++) tri(Bk, W(G[0][0], G[0][1], -3.5), W(G[k + 1][0], G[k + 1][1], -3.5), W(G[k][0], G[k][1], -3.5));
    for (let k = 1; k < G.length; k++){ const a = G[k], b = G[(k + 1) % G.length]; if (a[1] <= yC + 0.01 && b[1] <= yC + 0.01) continue; quad(Tr, W(a[0], a[1], 0.15), W(b[0], b[1], 0.15), W(b[0], b[1] + 0.35, 0.15), W(a[0], a[1] + 0.35, 0.15)); }
    hipR(Sl, ...(() => { const p = W(c - 3, 0, -9), q = W(c + 3, 0, 0.0); return [Math.min(p[0], q[0]), Math.max(p[0], q[0]), 0, 0]; })().slice(0, 2), ...(() => { const p = W(c - 3, 0, -9), q = W(c + 3, 0, 0.0); return [Math.min(p[2], q[2]), Math.max(p[2], q[2])]; })(), yC + 4, 8.2, i % 2 ? 0 : 2.9, i % 2 ? 2.9 : 0);
    for (const [a, b] of [[c - 1.6, c - 0.4], [c + 0.4, c + 1.6]]) wrect(rng() < 0.4 ? Wl : Wd, W, a, b, yC + 1.0, yC + 3.0, 0.05);
    wrect(Wd, W, c - 1.2, c + 1.2, yC + 5.0, yC + 7.4, 0.05);
    // dormers: lower row of gabled dormers, upper row of small ones (avoid pavilions and the gable)
    const I = [5.3, 9.5, 6.4, 8.65][i];
    for (const [y0, h, step] of [[yC + 1.2, 2.8, 3.6], [yC + 6.4, 2.2, 5.4]]){ const ins = I*(y0 - yC)/13.5;
      for (let u = 14.5; u < L - 14.5; u += step){ if (Math.abs(u - c) < 7.0) continue;
        wbox(Bk, W, u - 0.9, u + 0.9, y0, y0 + h, -ins + 0.35, -ins - 2.2); wrect(rng() < 0.3 ? Wl : Wd, W, u - 0.55, u + 0.55, y0 + 0.4, y0 + h - 0.4, -ins + 0.37);
        const a = W(u - 1.05, y0 + h, -ins + 0.4), b = W(u + 1.05, y0 + h, -ins + 0.4), cc = W(u, y0 + h + 1.2, -ins + 0.4), a2 = W(u - 1.05, y0 + h, -ins - 2.2), b2 = W(u + 1.05, y0 + h, -ins - 2.2), c2 = W(u, y0 + h + 1.2, -ins - 2.2);
        tri(Sl, a, b, cc); quad(Sl, a, cc, c2, a2); quad(Sl, cc, b, b2, c2); } } }
  // chimneys
  for (const [x, z] of [[-30, -6], [-12, -4], [12, -5], [-30, -45], [-8, -46], [14, -46], [-27, -25], [11, -27], [4, -16], [-24, -38]]){
    abox(Bk, X(x) - 0.9, X(x) + 0.9, yC + 6, yC + 15.5, Z(z) - 0.7, Z(z) + 0.7, true); abox(Tr, X(x) - 1.1, X(x) + 1.1, yC + 15.5, yC + 16.1, Z(z) - 0.9, Z(z) + 0.9); }
  B.flush(g);
  return g; }};
placeG('nydakota', 40.77655, -73.9762, -8.9, -23.9);

// ===== Madison Square Garden (1968, Charles Luckman) over Pennsylvania Station, between Seventh and Eighth Avenues, 31st to
// 33rd Streets. The 129 m drum of the arena (45 m), clad in pale precast concrete with 48 vertical ribs, the darker band of the
// concourse windows, the concrete compression ring and the nearly flat cable-suspended roof with its central ring and plant; the
// lower podium round it (the theatre lobby on Eighth Avenue, the glazed entrance on the Seventh Avenue side over the station
// entrances) with its glass concourse lit at night; the corner screens show abstract colour only. Two Penn Plaza (the office
// tower on Seventh Avenue) is a separate real building and stays the city's; the glass entrance pavilion between them and the two
// small stair pavilions on Eighth Avenue are included (their footprints fall under the Garden's plan). Origin: grid point (-1.75, -1.05) of the ref (anchor
// 40.7505, -73.99345) = the centre of the drum.
LANDMARKS.nymsg = {zh:'麦迪逊广场花园', en:'Madison Square Garden', cat:'new', r:108, h:49,
  lt:{m:0, c:'#e8eeff', k:0.75, e:0.6, anim:'none'}, build(){
  const g = new THREE.Group(), B = mkB(), OX = -1.75, OZ = -1.05;
  const X = x => x - OX, Z = z => z - OZ;
  const CONC = {c:'#d3cbba', m:0, lk:0.8, lc:'#eef2ff'}, PAN = {c:'#9e978a', m:0, lk:0.4}, GLS = {c:'#3a434a', glow:'#ffe2b4', gk:0.55}, GLB = {c:'#46525b', glow:'#cfe2ff', gk:0.35};
  const ROOF = '#a3a39f', RING = {c:'#dcd6ca', m:0, lk:0.9, glow:'#e8f0ff', gk:0.25}, LED = {c:'#56606a', m:2, lk:0.9}, DK = '#4a4d50';
  const Co = B.p(CONC), Pa = B.p(PAN), Gs = B.p(GLS), Rf = B.p(ROOF);
  const RD = 64.4, yP = 24.0, yT = 45.0, NR = 48;
  // ---------- the podium on the real outline ----------
  const RING0 = [[-74.9, 33.9], [-75.0, 24.9], [-76.3, 13.7], [-76.9, 2.2], [-76.7, -13.8], [-75.0, -27.2], [-75.2, -36.0], [-66.4, -36.2], [-61.9, -43.2], [-57.9, -47.9], [-47.3, -58.1], [-38.1, -54.1], [-33.4, -56.9], [-26.4, -60.4], [-18.4, -63.1], [-10.2, -64.8], [-2.2, -65.4], [6.6, -64.9], [14.3, -63.4], [22.3, -60.8], [30.1, -57.0], [34.6, -54.3], [42.7, -58.7], [49.2, -53.7], [55.2, -46.7], [51.1, -38.2], [55.4, -31.0], [63.3, -35.3], [65.2, -31.7], [67.4, -26.0], [63.7, -24.6], [66.7, -14.1], [67.8, -0.5], [67.4, 6.0], [66.3, 12.8], [63.8, 21.4], [67.3, 22.7], [66.6, 25.5], [63.7, 32.3], [55.5, 28.3], [50.9, 35.9], [55.5, 43.5], [47.7, 52.2], [43.3, 55.7], [34.8, 51.9], [28.2, 55.8], [19.0, 59.8], [10.8, 62.1], [2.5, 63.2], [-6.2, 63.3], [-14.6, 62.1], [-22.7, 60.0], [-30.6, 56.7], [-39.0, 51.8], [-47.0, 56.5], [-52.1, 51.9], [-58.2, 45.3], [-61.9, 40.8], [-66.4, 34.0]].map(p => [X(p[0]), Z(p[1])]);
  prism(Co, RING0, -4, yP, false); flat(Rf, RING0, yP);
  const s0 = area(RING0) > 0 ? 1 : -1;
  for (let i = 0; i < RING0.length; i++){ const W = wmap(RING0[i], RING0[(i + 1) % RING0.length], s0); if (W.L < 1.5) continue;
    wrect(Gs, W, 0, W.L, -0.6, 7.2, 0.08); wrect(Pa, W, 0, W.L, 7.2, 8.0, 0.12); wrect(B.p(GLB), W, 0, W.L, 11.5, 19.0, 0.08); wrect(Co, W, 0, W.L, yP - 1.2, yP + 0.6, 0.25);
    for (let u = 0; u < W.L; u += 4.0) wrect(Co, W, u, u + 0.6, -0.6, yP, 0.16); }
  // the Seventh Avenue entrance block (glass, with the corner screens) and the Eighth Avenue theatre front
  { const E = rect(X(55.5), X(67.6), Z(-24), Z(21.5)); prism(B.p(GLB), E, -0.6, 36.5, false); flat(Rf, E, 36.5); ledgeP(Co, E, 35.6, 37.2, 0.4);
    for (let y = 4.5; y < 36; y += 4.5) bandsP(Co, E, [y], 0.35, 0.06); stripsP(Co, E, -0.6, 36.5, 3.0, 0.2, 0.1);
    const W = wmap(E[1], E[2], area(E) > 0 ? 1 : -1); wrect(B.p(LED), W, 3, 13, 14, 26, 0.3); wrect(B.p(LED), W, W.L - 13, W.L - 3, 14, 26, 0.3); wbox(Co, W, 1, W.L - 1, 7.0, 7.8, 0, 4.5); }
  // the 15 m glass entrance pavilion on Seventh Avenue between the Garden and Two Penn Plaza (over the station entrances)
  { const P = [[63.8, 21.4], [66.3, 12.8], [67.4, 6.0], [67.8, -0.5], [66.7, -14.1], [63.7, -24.6], [67.4, -26.0], [98.5, -25.8], [98.6, 22.7], [67.3, 22.7]].map(p => [X(p[0]), Z(p[1])]);
    prism(B.p(GLB), P, -0.6, 15, false); flat(Rf, P, 15); ledgeP(Co, P, 14.2, 15.6, 0.6); bandsP(Co, P, [5.0, 10.0], 0.4, 0.08); stripsP(Co, P, -0.6, 15, 3.0, 0.18, 0.1);
    const W = wmap(P[7], P[8], area(P) > 0 ? 1 : -1); wbox(Co, W, 2, W.L - 2, 6.2, 6.9, 0, 5.5); wrect(B.p(LED), W, 6, 20, 8.0, 13.6, 0.4); wrect(B.p(LED), W, W.L - 20, W.L - 6, 8.0, 13.6, 0.4);
    wrect(Gs, W, 2, W.L - 2, -0.6, 5.8, 0.12); }
  // the two small corner pavilions on Eighth Avenue (station stairs)
  for (const Q of [[[-62.1, -51.1], [-52.2, -61.0], [-48.4, -57.1], [-58.3, -47.5]], [[-61.9, 48.8], [-58.2, 45.3], [-48.4, 55.4], [-51.8, 59.0]]]){ const P = Q.map(p => [X(p[0]), Z(p[1])]);
    prism(B.p(GLB), P, -0.6, 3.5, false); flat(Co, P, 3.5); }
  // ---------- the drum: concourse glass band, precast panels between 48 ribs, compression ring ----------
  cyl(Pa, 0, 0, RD - 0.6, yP, yT - 3.0, NR*2, false);
  cyl(B.p(GLB), 0, 0, RD - 0.3, yP, yP + 4.2, NR*2, false);
  for (let i = 0; i < NR; i++){ const a = i/NR*TAU, ca = Math.cos(a), sa = Math.sin(a), w = 1.15;
    const P = (r, y, s) => [ca*r - sa*s, y, sa*r + ca*s];
    quad(Co, P(RD + 0.9, yP + 4.2, -w), P(RD + 0.9, yP + 4.2, w), P(RD + 0.9, yT - 3.2, w), P(RD + 0.9, yT - 3.2, -w));
    quad(Co, P(RD - 0.6, yP + 4.2, -w), P(RD + 0.9, yP + 4.2, -w), P(RD + 0.9, yT - 3.2, -w), P(RD - 0.6, yT - 3.2, -w));
    quad(Co, P(RD + 0.9, yP + 4.2, w), P(RD - 0.6, yP + 4.2, w), P(RD - 0.6, yT - 3.2, w), P(RD + 0.9, yT - 3.2, w)); }
  lathe(B.p(RING), [[RD + 1.4, yT - 3.4], [RD + 1.4, yT], [RD - 0.6, yT], [RD - 0.6, yT - 0.2]], 0, 0, NR*2);
  cyl(Co, 0, 0, RD + 1.4, yP + 3.9, yP + 4.4, NR*2, false);
  // the cable-suspended roof: nearly flat, the central ring and the plant on it
  lathe(Rf, [[RD - 0.6, yT - 0.2], [48, yT + 0.9], [30, yT + 1.8], [14, yT + 2.3], [9.5, yT + 2.4]], 0, 0, NR);
  cyl(Co, 0, 0, 9.5, yT + 2.4, yT + 3.6, 24, true);
  for (const [x, z, w, d] of [[-22, 6, 9, 5], [18, -14, 7, 6], [24, 16, 6, 4], [-14, -24, 5, 5]]) abox(B.p(DK), x - w/2, x + w/2, yT + 1.4, yT + 3.8, z - d/2, z + d/2, true);
  B.flush(g);
  return g; }};
placeG('nymsg', 40.7505, -73.99345, -1.75, -1.05);
}
