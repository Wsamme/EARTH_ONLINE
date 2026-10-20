// ===== nyc/nypark: Park Avenue, Fifth Avenue, the Upper East Side and Roosevelt Island (City Brush v32, New York 1:1)
// St. Bartholomew's Church, Central Synagogue, 731 Lexington Avenue, 767 Fifth Avenue (+ the glass cube on its plaza),
// The Pierre, The Sherry-Netherland, The Frick Collection, Temple Emanu-El, Park Avenue Armory, and Franklin D. Roosevelt
// Four Freedoms Park with the Renwick Smallpox Hospital ruin (secondary key nyfourfreedoms_b, label:false).
// Every model is built in a frame aligned with the Manhattan street grid: local +x = along the cross streets toward the
// East River ("east"), local -z = up the avenues ("north"); rot = -0.506 (the grid is ~29 deg clockwise of true north).
// Four Freedoms Park follows the island's own axis (rot -0.643: local +z = down the lawn toward the south tip).
// Plans follow the OSM footprints / building parts in SC/nyc/ref_nypark.json. No text, logos or signage on any model.
// Block-scoped: only LANDMARKS and SG_PLACES are touched.
{
const PI = Math.PI, HP = PI/2, TAU = PI*2;
const ROT = -0.506;
// ---- triangle batches: every part of one colour spec goes into one LTris call (one material, one draw call)
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const quadP = (o, a, b, c, d) => o.push(...a, ...b, ...c, ...a, ...c, ...d);
const triP = (o, a, b, c) => o.push(...a, ...b, ...c);
const lerp = (a, b, t) => a + (b - a)*t;
const rotQ = (cx, cz, ry) => { const c = Math.cos(ry || 0), s = Math.sin(ry || 0); return (x, y, z) => [cx + x*c + z*s, y, cz - x*s + z*c]; };
function boxP(o, w, h, d, x, y, z, ry){
  const R = rotQ(x, z, ry), hw = w/2, hd = d/2;
  const P = [R(-hw, y, -hd), R(hw, y, -hd), R(hw, y, hd), R(-hw, y, hd), R(-hw, y+h, -hd), R(hw, y+h, -hd), R(hw, y+h, hd), R(-hw, y+h, hd)];
  for (const [a, b, c, e] of [[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]) quadP(o, P[a], P[b], P[c], P[e]);
}
const abox = (o, x0, x1, y0, y1, z0, z1) => boxP(o, x1 - x0, y1 - y0, z1 - z0, (x0 + x1)/2, y0, (z0 + z1)/2, 0);
// n-sided tube a -> b (radius r at a, r2 at b)
function segP(o, a, b, r, n, r2){
  n = n || 4; r2 = r2 === undefined ? r : r2; const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2], L = Math.hypot(dx, dy, dz); if (L < 1e-4) return;
  const d = [dx/L, dy/L, dz/L], up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let ux = d[1]*up[2]-d[2]*up[1], uy = d[2]*up[0]-d[0]*up[2], uz = d[0]*up[1]-d[1]*up[0]; const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
  const vx = d[1]*uz-d[2]*uy, vy = d[2]*ux-d[0]*uz, vz = d[0]*uy-d[1]*ux;
  const ring = (p, rr) => { const R = []; for (let i = 0; i < n; i++){ const t = (i + 0.5)/n*TAU, c = Math.cos(t)*rr, s = Math.sin(t)*rr; R.push([p[0]+ux*c+vx*s, p[1]+uy*c+vy*s, p[2]+uz*c+vz*s]); } return R; };
  const A = ring(a, r), Bq = ring(b, r2);
  for (let i = 0; i < n; i++){ const j = (i+1) % n; quadP(o, A[i], A[j], Bq[j], Bq[i]); }
}
// polygon helpers ([x, z] points)
const circP = (r, n, a0, cx, cz, sz) => { const P = []; for (let i = 0; i < n; i++){ const a = (a0 || 0) + i/n*TAU; P.push([(cx || 0) + Math.cos(a)*r, (cz || 0) + Math.sin(a)*r*(sz || 1)]); } return P; };
const rectP = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const octP = (cx, cz, w, d, ch) => [[cx - w/2 + ch, cz - d/2], [cx + w/2 - ch, cz - d/2], [cx + w/2, cz - d/2 + ch], [cx + w/2, cz + d/2 - ch], [cx + w/2 - ch, cz + d/2], [cx - w/2 + ch, cz + d/2], [cx - w/2, cz + d/2 - ch], [cx - w/2, cz - d/2 + ch]];
function capP(o, P, y){
  const tr = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
  for (const t of tr) triP(o, [P[t[0]][0], y, P[t[0]][1]], [P[t[1]][0], y, P[t[1]][1]], [P[t[2]][0], y, P[t[2]][1]]);
}
function prismP(o, P, y0, y1, top, bot){
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; quadP(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); }
  if (top !== false) capP(o, P, y1); if (bot) capP(o, P, y0);
}
// sloped skin between two polygons with the same vertex count (mansards, tapering crowns)
function skinP(o, P0, y0, P1, y1, top){
  for (let i = 0; i < P0.length; i++){ const j = (i+1) % P0.length; quadP(o, [P0[i][0], y0, P0[i][1]], [P0[j][0], y0, P0[j][1]], [P1[j][0], y1, P1[j][1]], [P1[i][0], y1, P1[i][1]]); }
  if (top) capP(o, P1, y1);
}
// inset polygon (convex-ish, about its centroid by a distance d along each edge normal -> simple scale approximation)
const insetP = (P, d) => { let cx = 0, cz = 0; for (const p of P){ cx += p[0]; cz += p[1]; } cx /= P.length; cz /= P.length;
  const n = P.length, out = [];
  for (let i = 0; i < n; i++){ const a = P[(i + n - 1) % n], b = P[i], c = P[(i+1) % n];
    const n1 = nrmOut(a, b, cx, cz), n2 = nrmOut(b, c, cx, cz); let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
    const k = d/Math.max(0.3, mx*n1[0] + mz*n1[1]); out.push([b[0] - mx*k, b[1] - mz*k]); }
  return out; };
function nrmOut(a, b, cx, cz){ const ex = b[0]-a[0], ez = b[1]-a[1], L = Math.hypot(ex, ez) || 1; let nx = ez/L, nz = -ex/L; if (nx*((a[0]+b[0])/2 - cx) + nz*((a[1]+b[1])/2 - cz) < 0){ nx = -nx; nz = -nz; } return [nx, nz]; }
// surface of revolution into a batch: prof = [[r, y], ...] bottom to top; sx / sz scale (ellipses)
function latheP(o, prof, cx, cy, cz, n, a0, sx, sz){
  sx = sx || 1; sz = sz || 1; a0 = a0 || 0;
  for (let k = 0; k < prof.length - 1; k++){ const [r0, y0] = prof[k], [r1, y1] = prof[k+1];
    for (let i = 0; i < n; i++){ const t0 = a0 + i/n*TAU, t1 = a0 + (i+1)/n*TAU;
      const A = [cx + Math.cos(t0)*r0*sx, cy + y0, cz + Math.sin(t0)*r0*sz], B = [cx + Math.cos(t1)*r0*sx, cy + y0, cz + Math.sin(t1)*r0*sz];
      const C = [cx + Math.cos(t1)*r1*sx, cy + y1, cz + Math.sin(t1)*r1*sz], D = [cx + Math.cos(t0)*r1*sx, cy + y1, cz + Math.sin(t0)*r1*sz];
      if (r0 < 1e-4) triP(o, A, C, D); else if (r1 < 1e-4) triP(o, A, B, C); else quadP(o, A, B, C, D); } }
}
// gable roof: ridge along the local x of a frame (cx, cz, ry); L along the ridge, W across, eaves at y, ridge at y + h
function gableP(o, cx, cz, L, W, y, h, ry, ov){
  const R = rotQ(cx, cz, ry), hl = L/2, hw = W/2 + (ov || 0);
  const A = R(-hl, y, -hw), B = R(hl, y, -hw), C = R(hl, y, hw), D = R(-hl, y, hw), r1 = R(-hl, y + h, 0), r2 = R(hl, y + h, 0);
  quadP(o, A, B, r2, r1); quadP(o, D, C, r2, r1); triP(o, A, D, r1); triP(o, B, C, r2);
}
function hipP(o, cx, cz, L, W, y, h, ry, ov){
  const R = rotQ(cx, cz, ry), hl = L/2 + (ov || 0), hw = W/2 + (ov || 0), k = Math.max(0, hl - hw);
  const A = R(-hl, y, -hw), B = R(hl, y, -hw), C = R(hl, y, hw), D = R(-hl, y, hw), r1 = R(-k, y + h, 0), r2 = R(k, y + h, 0);
  quadP(o, A, B, r2, r1); quadP(o, C, D, r1, r2); triP(o, D, A, r1); triP(o, B, C, r2);
}
// windows: dark quads on a wall segment a -> b ([x, z]) with outward normal n, floors from y0 step fh while below y1
function winSeg(o, a, b, n, y0, y1, fh, bw, ww, wh, sill, off, arch){
  const L = Math.hypot(b[0]-a[0], b[1]-a[1]); if (L < bw*0.8) return; const nb = Math.max(1, Math.round(L/bw)), ex = (b[0]-a[0])/L, ez = (b[1]-a[1])/L;
  off = off === undefined ? 0.07 : off;
  for (let y = y0; y + sill + wh <= y1 + 0.01; y += fh) for (let i = 0; i < nb; i++){
    const t = (i + 0.5)*L/nb, cx = a[0] + ex*t + n[0]*off, cz = a[1] + ez*t + n[1]*off, w2 = ww/2, yb = y + sill, yt = yb + wh;
    const P = (u, v) => [cx + ex*u, v, cz + ez*u];
    if (!arch) quadP(o, P(-w2, yb), P(w2, yb), P(w2, yt), P(-w2, yt));
    else { const ys = yt - w2; quadP(o, P(-w2, yb), P(w2, yb), P(w2, ys), P(-w2, ys)); const m = 6; for (let k = 0; k < m; k++){ const t0 = k/m*PI, t1 = (k+1)/m*PI; triP(o, P(0, ys), P(Math.cos(t0)*w2, ys + Math.sin(t0)*w2), P(Math.cos(t1)*w2, ys + Math.sin(t1)*w2)); } }
  }
}
// windows round an axis-aligned box (sides: string of n/s/e/w to include; n = -z face)
function winBox(o, x0, x1, z0, z1, y0, y1, fh, bw, ww, wh, sill, sides, arch){
  sides = sides || 'nsew';
  if (sides.includes('n')) winSeg(o, [x0, z0], [x1, z0], [0, -1], y0, y1, fh, bw, ww, wh, sill, 0.07, arch);
  if (sides.includes('s')) winSeg(o, [x1, z1], [x0, z1], [0, 1], y0, y1, fh, bw, ww, wh, sill, 0.07, arch);
  if (sides.includes('e')) winSeg(o, [x1, z0], [x1, z1], [1, 0], y0, y1, fh, bw, ww, wh, sill, 0.07, arch);
  if (sides.includes('w')) winSeg(o, [x0, z1], [x0, z0], [-1, 0], y0, y1, fh, bw, ww, wh, sill, 0.07, arch);
}
// windows round a polygon (outward normals from the centroid)
function winPoly(o, P, y0, y1, fh, bw, ww, wh, sill, arch){
  let cx = 0, cz = 0; for (const p of P){ cx += p[0]; cz += p[1]; } cx /= P.length; cz /= P.length;
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; winSeg(o, a, b, nrmOut(a, b, cx, cz), y0, y1, fh, bw, ww, wh, sill, 0.07, arch); }
}
// thin vertical piers / mullions along a segment (boxes proud of the wall)
function piersSeg(o, a, b, n, y0, y1, step, w, d, skipEnds){
  const L = Math.hypot(b[0]-a[0], b[1]-a[1]), nb = Math.max(1, Math.round(L/step)), ex = (b[0]-a[0])/L, ez = (b[1]-a[1])/L, ry = Math.atan2(-ez, ex);
  for (let i = skipEnds ? 1 : 0; i <= (skipEnds ? nb - 1 : nb); i++){ const t = i*L/nb; boxP(o, w, y1 - y0, d, a[0] + ex*t + n[0]*d/2, y0, a[1] + ez*t + n[1]*d/2, ry); }
}
// a horizontal band (cornice / string course) round a polygon, proud by `out`
const bandP = (o, P, y, h, out) => prismP(o, insetP(P, -out), y, y + h, true, true);
// semicircular arch outline filled (an arch opening seen as a dark recess), in a vertical plane through a-b at offset
function archQ(o, c, ex, ez, n, off, hw, ys, yb, m){
  m = m || 8; const cx = c[0] + n[0]*off, cz = c[1] + n[1]*off, P = (u, v) => [cx + ex*u, v, cz + ez*u];
  quadP(o, P(-hw, yb), P(hw, yb), P(hw, ys), P(-hw, ys));
  for (let k = 0; k < m; k++){ const t0 = k/m*PI, t1 = (k+1)/m*PI; triP(o, P(0, ys), P(Math.cos(t0)*hw, ys + Math.sin(t0)*hw), P(Math.cos(t1)*hw, ys + Math.sin(t1)*hw)); }
}
// archivolt ring (thick arch band) in the plane of a facade: centre c, half width hw (inner), band t, springing ys
function archRing(o, c, ex, ez, n, off, hw, t, ys, d, m){
  m = m || 10; const P = (u, v, w) => [c[0] + ex*u + n[0]*w, v, c[1] + ez*u + n[1]*w];
  for (let k = 0; k < m; k++){ const t0 = k/m*PI, t1 = (k+1)/m*PI;
    const a0 = [Math.cos(t0)*hw, ys + Math.sin(t0)*hw], a1 = [Math.cos(t1)*hw, ys + Math.sin(t1)*hw], b0 = [Math.cos(t0)*(hw + t), ys + Math.sin(t0)*(hw + t)], b1 = [Math.cos(t1)*(hw + t), ys + Math.sin(t1)*(hw + t)];
    quadP(o, P(a0[0], a0[1], off + d), P(a1[0], a1[1], off + d), P(b1[0], b1[1], off + d), P(b0[0], b0[1], off + d));
    quadP(o, P(a0[0], a0[1], off), P(a1[0], a1[1], off), P(a1[0], a1[1], off + d), P(a0[0], a0[1], off + d)); }
}
// grid-frame point (gx, gz) around a ref anchor -> lat / lon (ref local +x east, +z south; frame rotated by rot)
const placeAt = (key, alat, alon, gx, gz, rot) => { const c = Math.cos(ROT), s = Math.sin(ROT), E = gx*c + gz*s, S = -gx*s + gz*c;
  SG_PLACES.push({type:key, lat:+(alat - S/111048).toFixed(7), lon:+(alon + E/84516).toFixed(7), rot}); };
// low-poly tree into batches (trunk + 2 crowns)
function treeP(B, x, y, z, s, crown, trunk, r){
  const o = B.p(trunk || '#5a4a3c'); segP(o, [x, y, z], [x, y + 2.6*s, z], 0.22*s, 4);
  const c = B.p(crown || '#5c7a45'); const k = r ? 0.85 + r()*0.3 : 1;
  latheP(c, [[0, 0], [1.9*s*k, 0.9*s], [2.1*s*k, 2.2*s], [1.4*s*k, 3.4*s], [0, 4.0*s]], x, y + 2.0*s, z, 6, r ? r()*PI : 0);
}
// ---- shared facade helpers (all into batches)
// horizontal bands round a polygon (sides only), every `step` from y0 to y1, `h` thick, `out` proud of the wall
function bandsP(o, P, y0, y1, step, h, out){ const Q = insetP(P, -out); for (let y = y0; y <= y1 + 1e-6; y += step) prismP(o, Q, y, y + h, false); }
// vertical mullions / piers round a polygon (outward normals from the centroid)
function mullP(o, P, y0, y1, step, w, d){
  let cx = 0, cz = 0; for (const p of P){ cx += p[0]; cz += p[1]; } cx /= P.length; cz /= P.length;
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; if (Math.hypot(b[0]-a[0], b[1]-a[1]) < step*0.6) continue; piersSeg(o, a, b, nrmOut(a, b, cx, cz), y0, y1, step, w, d, false); }
}
// elliptical wall arc (centre cx, cz, radii rx, rz, angles a0 -> a1), y0 -> y1, the top ring scaled by k (inward tilt)
function arcWall(o, cx, cz, rx, rz, a0, a1, y0, y1, k, n){
  k = k || 1; for (let i = 0; i < n; i++){ const t0 = a0 + (a1 - a0)*i/n, t1 = a0 + (a1 - a0)*(i+1)/n;
    quadP(o, [cx + Math.cos(t0)*rx, y0, cz + Math.sin(t0)*rz], [cx + Math.cos(t1)*rx, y0, cz + Math.sin(t1)*rz], [cx + Math.cos(t1)*rx*k, y1, cz + Math.sin(t1)*rz*k], [cx + Math.cos(t0)*rx*k, y1, cz + Math.sin(t0)*rz*k]); }
}
// translate a polygon
const movP = (P, dx, dz) => P.map(p => [p[0] + dx, p[1] + dz]);
// ---------------------------------------------------------------------------------------------------------------------------
// 767 Fifth Avenue (General Motors Building, Edward Durell Stone with Emery Roth & Sons, 1968): 50 storeys, 215 m, a slab
// 90 x 31 m clad in white Georgia marble — continuous vertical marble piers with recessed black-glass bays between them — on
// a 15 m base that fills the rest of the block to Madison Avenue; the broad faces look north to Central Park and south.
// On the plaza toward Fifth Avenue: the 32 ft (9.75 m) plain glass cube (2006/2011, rebuilt 2019) with the glass lift and
// the spiral stair inside, the round skylight lenses, two long fountains and the honey locusts. No signage of any kind.
// Frame: grid (see header); origin = block centre (ref grid 36, -11). +z = south (58th St), -x = west (Fifth Avenue).
LANDMARKS.ny767fifth = {zh:'通用汽车大厦（第五大道767号）', en:'767 Fifth Avenue (General Motors Building)', cat:'new', r:90, h:218,
  lt:{m:1, c:'#ffe6c2', k:0.55},
  build(){
    const g = new THREE.Group(), B = mkB(), OX = 36, OZ = -11;
    const L = (x, z) => [x - OX, z - OZ];
    const MARB = {c:'#ecebe6', m:0, lc:'#fff4e0', lk:0.28}, GL = {c:'#1f242b', m:1, fh:4.3, cw:3.05}, SHOP = {c:'#2e3540', m:1, fh:5.5, cw:4.0},
      GRAN = {c:'#c6c3bd', m:0, lk:0.25}, CUBE = {c:'#d8eef5', op:0.28, glow:'#eef6ff', gk:0.55}, STEEL = {c:'#b9bec4', glow:'#ffffff', gk:0.35},
      WAT = {c:'#5a7f97', glow:'#9fd2ff', gk:0.25}, LENS = {c:'#d9e9ef', glow:'#f4fbff', gk:0.6}, ROOF = '#8f918f', CROWN = '#3c5a33', TRUNK = '#5b4b3b';
    // ---- tower: the dark glass core, the marble piers proud of it
    const TP = [[4.2,4.4],[4.3,-26.4],[33.9,-26.5],[33.9,-29.3],[70.4,-29.4],[70.4,-26.2],[94.3,-26.2],[94.2,4.2],[70.5,4.1],[70.6,7.7],[34.4,7.7],[34.4,4.4]].map(p => L(p[0], p[1]));
    const H = 213.5;
    prismP(B.p(GL), TP, -5, H, true);
    // piers on every edge of the tower plan (continuous from the base to the top, ending in a parapet)
    { let cx = 0, cz = 0; for (const p of TP){ cx += p[0]; cz += p[1]; } cx /= TP.length; cz /= TP.length;
      for (let i = 0; i < TP.length; i++){ const a = TP[i], b = TP[(i+1) % TP.length], n = nrmOut(a, b, cx, cz), len = Math.hypot(b[0]-a[0], b[1]-a[1]);
        if (len < 2) { boxP(B.p(MARB), 1.0, H + 2.2, 1.0, a[0], -5, a[1]); continue; }
        piersSeg(B.p(MARB), a, b, n, 15, H + 2.2, 3.05, 1.15, 0.55, false); } }
    // the tower's own base band and roof: a parapet ring and the mechanical penthouse (set back, marble)
    capP(B.p(ROOF), TP, H + 0.2);
    abox(B.p(MARB), -20, 20, H, H + 4.5, -9, 4);
    abox(B.p(ROOF), -14, 14, H + 4.5, H + 5.0, -6, 1);
    // ---- the base: 15 m (five storeys) round the tower, the same marble, deep shop windows at the street
    const BP = [[10.1,19.5],[10.2,4.4],[4.2,4.4],[4.3,-26.4],[10.3,-26.4],[10.3,-41.4],[103.1,-41.5],[102.9,19.5]].map(p => L(p[0], p[1]));
    prismP(B.p(MARB), BP, -5, 15, false);
    capP(B.p(GRAN), BP, 15);
    bandP(B.p(MARB), BP, 14.2, 0.8, 0.35);
    { let cx = 0, cz = 0; for (const p of BP){ cx += p[0]; cz += p[1]; } cx /= BP.length; cz /= BP.length;
      for (let i = 0; i < BP.length; i++){ const a = BP[i], b = BP[(i+1) % BP.length], n = nrmOut(a, b, cx, cz);
        winSeg(B.p(SHOP), a, b, n, 0, 6.2, 6.2, 3.05, 2.4, 5.4, 0.3); winSeg(B.p(GL), a, b, n, 6.5, 14, 4.0, 3.05, 1.6, 2.9, 0.6); } }
    // ---- the plaza between Fifth Avenue and the tower (granite, at street level)
    const x0 = -26 - OX, x1 = 4.2 - OX, z0 = -41.4 - OZ, z1 = 19.4 - OZ;
    abox(B.p(GRAN), x0, x1, -3, 0.25, z0, z1);
    // two long fountains along 58th / 59th Streets (granite rims, water)
    for (const zc of [z0 + 5.5, z1 - 5.5]){
      abox(B.p(GRAN), x0 + 6, x1 - 6, 0.25, 0.75, zc - 2.6, zc + 2.6);
      abox(B.p(WAT), x0 + 6.4, x1 - 6.4, 0.75, 0.82, zc - 2.2, zc + 2.2);
      for (let x = x0 + 8; x < x1 - 7; x += 2.4) segP(B.p(WAT), [x, 0.8, zc], [x, 1.6, zc], 0.06, 3, 0.02);
      for (let x = x0 + 9; x < x1 - 8; x += 7.5){ const zt = zc + (zc < 0 ? 4.6 : -4.6); abox(B.p(GRAN), x - 0.9, x + 0.9, 0.25, 0.8, zt - 0.9, zt + 0.9); treeP(B, x, 0.8, zt, 1.25, CROWN, TRUNK); }
    }
    // round skylight lenses (flush seats) round the cube
    const cubeC = L(-12.4, -11.25);
    for (const [dx, dz, r] of [[-9, -9, 1.6], [-9, 9, 1.6], [9, -10, 1.6], [9, 10, 1.6], [-13, 0, 1.2], [13, 0, 1.2], [0, -15, 1.2], [0, 15, 1.2], [17, -5, 1.0], [17, 5, 1.0]])
      latheP(B.p(LENS), [[r, 0], [r, 0.45], [r*0.8, 0.62], [0, 0.66]], cubeC[0] + dx, 0.25, cubeC[1] + dz, 14);
    // ---- the glass cube: 9.75 m, three panels a side, almost invisible seams; the glass lift cylinder and the spiral stair inside
    { const [cx, cz] = cubeC, s = 4.85, h = 9.75, y0 = 0.25;
      prismP(B.p(CUBE), rectP(cx - s, cx + s, cz - s, cz + s), y0, y0 + h, true);
      const o = B.p(STEEL);
      for (const [px, pz] of [[-s, -s], [s, -s], [s, s], [-s, s]]) boxP(o, 0.08, h, 0.08, cx + px, y0, cz + pz);
      for (const t of [-s/3, s/3]){ boxP(o, 0.03, h, 0.03, cx + t, y0, cz - s - 0.01); boxP(o, 0.03, h, 0.03, cx + t, y0, cz + s + 0.01); boxP(o, 0.03, h, 0.03, cx - s - 0.01, y0, cz + t); boxP(o, 0.03, h, 0.03, cx + s + 0.01, y0, cz + t); }
      for (const [a, b] of [[[-s, -s], [s, -s]], [[s, -s], [s, s]], [[s, s], [-s, s]], [[-s, s], [-s, -s]]]) segP(o, [cx + a[0], y0 + h, cz + a[1]], [cx + b[0], y0 + h, cz + b[1]], 0.06, 4);
      // lift shaft (glass cylinder) and the spiral stair winding round it, down through the plaza
      latheP(B.p(CUBE), [[1.1, -4], [1.1, h - 0.6]], cx, y0, cz, 12);
      for (let k = 0; k < 26; k++){ const a = k/26*TAU*1.15, y = y0 + h*0.62 - k*0.36; const r0 = 1.25, r1 = 3.1;
        const P = [[Math.cos(a)*r0, Math.sin(a)*r0], [Math.cos(a)*r1, Math.sin(a)*r1], [Math.cos(a + 0.3)*r1, Math.sin(a + 0.3)*r1], [Math.cos(a + 0.3)*r0, Math.sin(a + 0.3)*r0]].map(p => [cx + p[0], cz + p[1]]);
        prismP(B.p(STEEL), P, y - 0.08, y, true, true); }
    }
    B.flush(g); return g;
  }};
placeAt('ny767fifth', 40.76370, -73.97290, 36, -11, ROT);
// ---------------------------------------------------------------------------------------------------------------------------
// 731 Lexington Avenue (Cesar Pelli & Associates, 2005): the whole block Lexington - Third Avenue, 58th - 59th Streets.
// The 55-storey glass tower on the Lexington Avenue side (roof 246 m, communications mast to ~286 m) steps up from a 30 / 40 m
// base through setbacks at 150 m and 210 m (OSM building parts), with notched corners; pale blue-grey glass in a fine silver
// grid. In the middle of the block the elliptical, open-air Beacon Court: a seven-storey curved glass wall that leans slightly
// inward, open to 58th Street through a tall portal; the lower eastern wing toward Third Avenue (30 / 38 / 50 m).
// Frame: grid (header). Origin = block centre (ref grid 28.5, -13.7); +z = 58th Street (south), -x = Lexington Avenue (west).
LANDMARKS.ny731lex = {zh:'列克星敦大道731号（彭博大厦）', en:'731 Lexington Avenue (Bloomberg Tower)', cat:'new', r:78, h:287,
  lt:{m:1, c:'#e6f0ff', k:0.5},
  build(){
    const g = new THREE.Group(), B = mkB(), OX = 28.5, OZ = -13.7;
    const L = P => P.map(p => [p[0] - OX, p[1] - OZ]);
    const GL = {c:'#7890a2', m:1, fh:4.0, cw:3.0}, GLB = {c:'#55697a', m:1, fh:5.0, cw:3.0}, MUL = {c:'#c4ccd3', m:0, lk:0.18},
      SPAN = {c:'#a9b4be', m:0, lk:0.2}, STONE = {c:'#c9c4bb', m:0, lk:0.3}, ROOF = '#7b8085', MAST = {c:'#a3a9af', m:0, lk:0.6, lc:'#ffffff'},
      BEAC = {c:'#c22', glow:'#ff2a1a', gk:2.2}, CGL = {c:'#9fb8c8', op:0.45, glow:'#fff1d8', gk:0.35}, PAVE = '#b8b3aa',
      CROWN = {c:'#d9e4ee', glow:'#eaf4ff', gk:0.55}, TREE = '#58773f', TRUNK = '#56473a';
    // ---- footprints (OSM, grid frame)
    const LOTW = L([[-35.5, 17.5], [-35.9, -44.1], [30.5, -44.9], [30.5, -38.4], [20.4, -35.4], [20.4, 3.3], [24.6, 0.5], [26.7, 4.1], [29.9, 7.5], [28.5, 15.1], [24.1, 15.1], [24.0, 16.9]]);
    const LOTE = L([[44.6, 15.2], [43.5, 7.6], [46.5, 4.5], [48.8, 1.0], [53.1, 3.6], [53.0, -35.5], [49.2, -37.0], [43.0, -38.5], [43.1, -44.4], [92.8, -44.8], [93.0, 17.2], [48.8, 17.4], [48.8, 15.2]]);
    const P30 = L([[-30.7, 11.3], [-30.6, 3.7], [-31.7, 3.7], [-31.7, -30.9], [-30.6, -30.9], [-30.6, -38.5], [20.4, -38.7], [20.3, 11.1]]);
    const P40 = L([[-28.7, 9.4], [-28.7, 3.7], [-31.7, 3.7], [-31.7, -30.9], [-28.7, -31.0], [-28.7, -36.7], [16.4, -36.9], [16.4, -29.4], [20.4, -29.5], [20.4, 0.5], [16.4, 0.5], [16.3, 9.2]]);
    const P150 = L([[-27.0, 2.7], [-27.0, -1.6], [-28.8, -1.6], [-28.7, -29.4], [-27.0, -29.3], [-27.0, -33.0], [-24.0, -33.0], [-24.0, -35.6], [13.9, -35.7], [13.9, -29.4], [20.4, -29.5], [20.4, 0.5], [13.9, 0.5], [13.8, 7.2], [-24.1, 7.3], [-24.1, 2.7]]);
    const P210 = L([[-27.0, 2.7], [-27.0, -1.6], [-28.8, -1.6], [-28.7, -29.4], [-27.0, -29.3], [-27.0, -33.0], [9.9, -33.1], [9.9, -29.5], [13.9, -29.4], [13.9, -1.8], [9.9, -1.8], [9.9, 2.6]]);
    const P246 = L([[-28.8, -1.6], [-28.7, -29.4], [13.9, -29.4], [13.9, -1.8]]);
    const E30 = L([[53.2, 11.1], [53.0, -38.9], [90.1, -39.1], [90.2, 10.9]]), E38 = L([[61.6, 11.1], [61.6, 5.4], [85.7, 5.2], [85.5, -33.6], [61.5, -33.4], [61.6, -38.9], [90.1, -39.1], [90.2, 10.9]]), E50 = L([[57.7, 5.4], [57.5, -33.5], [85.5, -33.6], [85.7, 5.2]]);
    // ---- the podium (street wall 22 m: dark glass shopfronts, a pale stone ground storey frame)
    for (const P of [LOTW, LOTE]){ prismP(B.p(GLB), P, -5, 22, true); bandsP(B.p(STONE), P, 0, 0, 1, 1.0, 0.2); bandsP(B.p(SPAN), P, 6, 21, 5, 0.6, 0.15); mullP(B.p(MUL), P, 0, 22, 3.0, 0.22, 0.25); }
    // ---- the tower: stacked parts, glass with silver spandrels every floor and mullions every 1.5 m
    const parts = [[P30, 22, 30], [P40, 22, 40], [P150, 40, 150], [P210, 150, 210], [P246, 210, 246]];
    for (const [P, y0, y1] of parts){
      prismP(B.p(GL), P, y0 - 0.2, y1, true);
      bandsP(B.p(SPAN), P, y0 + 3.6, y1 - 1, 4.0, 0.45, 0.12);
      mullP(B.p(MUL), P, y0, y1, 1.5, 0.12, 0.18);
      bandsP(B.p(MUL), P, y1 - 1.3, y1, 1, 1.3, 0.25);   // parapet cap at each setback
    }
    // the top: a lantern-like lit band, the roof plant screen and the mast with a red beacon
    bandsP(B.p(CROWN), P246, 241, 241, 1, 4.2, 0.3);
    { const T = insetP(P246, 3.5); prismP(B.p(MUL), T, 246, 252, true); capP(B.p(ROOF), P246, 246.05); }
    const tc = [-7.4 - OX, -15.5 - OZ];
    segP(B.p(MAST), [tc[0], 252, tc[1]], [tc[0], 284, tc[1]], 0.9, 6, 0.35);
    for (const y of [258, 266, 274]) segP(B.p(MAST), [tc[0] - 1.6, y, tc[1]], [tc[0] + 1.6, y, tc[1]], 0.12, 4);
    latheP(B.p(BEAC), [[0, 0], [0.45, 0.4], [0, 0.9]], tc[0], 284, tc[1], 6);
    // ---- the east wing (Third Avenue side)
    for (const [P, y0, y1] of [[E30, 22, 30], [E38, 22, 38], [E50, 22, 50]]){ prismP(B.p(GL), P, y0 - 0.2, y1, true); bandsP(B.p(SPAN), P, y0 + 3.6, y1 - 1, 4.0, 0.45, 0.12); mullP(B.p(MUL), P, y0, y1, 1.5, 0.12, 0.18); bandsP(B.p(MUL), P, y1 - 1.2, y1, 1, 1.2, 0.22); }
    // ---- Beacon Court: the open elliptical court between the wings, ringed by 25 / 28 m buildings, the leaning glass wall
    const cx = 36.7 - OX, cz = -10.0 - OZ, rx = 10.0, rz = 17.2;
    const R28 = L([[20.4, -20.1], [20.4, -35.4], [27.8, -37.8], [34.4, -38.8], [38.5, -38.9], [45.6, -38.1], [53.0, -35.5], [53.1, -19.8], [49.2, -18.3], [47.5, -21.5], [44.9, -24.4], [41.3, -26.7], [37.6, -27.6], [33.3, -27.1], [29.8, -25.4], [26.9, -22.4], [24.5, -18.7]]);
    const R25 = L([[20.4, 3.3], [20.4, -20.1], [24.5, -18.7], [26.9, -22.4], [29.8, -25.4], [33.3, -27.1], [37.6, -27.6], [41.3, -26.7], [44.9, -24.4], [47.5, -21.5], [49.2, -18.3], [53.1, -19.8], [53.1, 3.6], [48.8, 1.0], [46.5, 4.5], [43.5, 7.6], [42.8, 3.2], [44.9, -0.1], [46.5, -4.0], [47.0, -7.8], [46.8, -12.5], [45.5, -16.5], [43.0, -20.6], [39.6, -23.1], [37.1, -23.6], [34.3, -23.3], [31.1, -21.4], [28.2, -16.9], [26.9, -13.2], [26.4, -8.7], [26.8, -5.3], [28.0, -1.5], [30.7, 3.0], [29.9, 7.5], [26.7, 4.1], [24.6, 0.5]]);
    prismP(B.p(GLB), R28, -5, 28, true); prismP(B.p(GLB), R25, -5, 25, true);
    bandsP(B.p(SPAN), R28, 6, 27, 4, 0.4, 0.1);
    // court floor (paving) and the inward-leaning glass wall (open toward 58th Street between the portal piers)
    { const E = circP(1, 28).map(p => [cx + p[0]*rx, cz + p[1]*rz]); capP(B.p(PAVE), E, 0.15); }
    const gap = 0.62;   // half-angle of the opening round +z (58th Street)
    arcWall(B.p(CGL), cx, cz, rx, rz, HP + gap, HP + TAU - gap, 0.15, 28, 0.93, 40);
    for (let i = 0; i <= 20; i++){ const t = HP + gap + (TAU - 2*gap)*i/20, c = Math.cos(t), s = Math.sin(t); segP(B.p(MUL), [cx + c*rx, 0.15, cz + s*rz], [cx + c*rx*0.93, 28, cz + s*rz*0.93], 0.16, 4); }
    for (let y = 4; y <= 28; y += 4) for (let i = 0; i < 40; i++){ const t0 = HP + gap + (TAU - 2*gap)*i/40, t1 = HP + gap + (TAU - 2*gap)*(i+1)/40, k = 1 - 0.07*y/28;
      segP(B.p(MUL), [cx + Math.cos(t0)*rx*k, y, cz + Math.sin(t0)*rz*k], [cx + Math.cos(t1)*rx*k, y, cz + Math.sin(t1)*rz*k], 0.08, 3); }
    // the tall portal from 58th Street: two piers and a lintel at the seventh floor
    for (const sx of [-1, 1]){ const t = HP + sx*gap; boxP(B.p(STONE), 1.6, 28, 2.4, cx + Math.cos(t)*rx, -1, cz + Math.sin(t)*rz + 1.0, 0); }
    abox(B.p(STONE), cx - Math.sin(gap)*rx - 1, cx + Math.sin(gap)*rx + 1, 26, 28.6, cz + rz*Math.cos(gap) - 0.5, cz + rz*Math.cos(gap) + 2.4);
    // a few trees in the court
    for (const [dx, dz] of [[-4, -8], [4, -8], [-4, 2], [4, 2]]){ abox(B.p(STONE), cx + dx - 1, cx + dx + 1, 0.15, 0.7, cz + dz - 1, cz + dz + 1); treeP(B, cx + dx, 0.7, cz + dz, 1.1, TREE, TRUNK); }
    B.flush(g); return g;
  }};
placeAt('ny731lex', 40.76160, -73.96800, 28.5, -13.7, ROT);
// ---------------------------------------------------------------------------------------------------------------------------
// The Sherry-Netherland (Schultze & Weaver with Buchman & Kahn, 1927): 38 storeys, 171 m to the tip of the spire. A buff brick
// apartment-hotel tower with limestone base storeys and terracotta trim; the lot is filled to 70 - 85 m (setback wings on Fifth
// Avenue and 59th Street), the slender shaft rises to 135 m, then the neo-Romanesque crown: corner turret stages, an arcaded
// lantern to 160 m and the pointed pyramidal spire with lucarnes and pinnacles that hides the water tank. Floodlit at night.
// Frame: grid; origin = tower centre (ref grid -1.85, -7.8); -x = Fifth Avenue (west), +z = 59th Street (south).
LANDMARKS.nysherry = {zh:'雪梨-荷兰酒店', en:'The Sherry-Netherland', cat:'old', r:30, h:172,
  lt:{m:1, c:'#ffdcae', k:0.5},
  build(){
    const g = new THREE.Group(), B = mkB(), OX = -1.85, OZ = -7.8;
    const L = P => P.map(p => [p[0] - OX, p[1] - OZ]);
    const BRICK = {c:'#cdb995', m:1, fh:3.2, cw:2.3}, LIME = {c:'#ddd5c4', m:0, lk:0.35, lc:'#ffe2b5'}, WIN = {c:'#2b2f35', m:1, fh:3.2, cw:2.3},
      SHOP = {c:'#3a3530', glow:'#ffd9a0', gk:0.45}, CROWN = {c:'#e3dac8', m:0, lc:'#ffdca8', lk:0.95}, ROOFC = {c:'#a6ab9f', m:0, lc:'#ffdca8', lk:0.8},
      DARK = '#3b3a38', AWN = '#2e3b33', GOLD = {c:'#b9a26b', glow:'#ffd88f', gk:0.5};
    const W70 = L([[-16.7, 6.0], [-16.6, -23.4], [-14.2, -23.5], [-14.1, 3.2], [20.5, 2.9], [20.5, 6.0]]);
    const W79 = L([[-14.1, 3.2], [-14.2, -23.5], [-12.0, -23.4], [-12.1, 1.5], [4.1, 1.4], [4.0, -0.8], [20.4, -0.9], [20.5, 2.9]]);
    const N85 = L([[-12.2, -17.0], [-12.0, -23.4], [4.1, -23.4], [4.0, -17.1]]), NE70 = L([[4.0, -14.4], [4.1, -23.4], [20.5, -23.4], [20.5, -14.4]]);
    const E85 = L([[8.5, -0.8], [8.4, -14.3], [20.5, -14.4], [20.4, -0.9]]);
    const T = L([[-12.1, 1.5], [-12.2, -17.0], [4.0, -17.1], [4.0, -14.4], [8.4, -14.3], [8.5, -0.8], [4.0, -0.8], [4.1, 1.4]]);
    // ---- the setback wings and the shaft: brick with limestone base storeys, string courses, punched windows in pairs
    const wing = (P, top) => {
      prismP(B.p(BRICK), P, -5, top, true);
      prismP(B.p(LIME), insetP(P, -0.12), -5, 13, false);
      bandsP(B.p(LIME), P, 13, 13, 1, 0.7, 0.3); bandsP(B.p(LIME), P, top - 1.2, top - 1.2, 1, 1.4, 0.35);
      winPoly(B.p(WIN), P, 13.6, top - 2, 3.2, 1.65, 0.85, 1.75, 0.6);
    };
    for (const R of [[-16.7, -14.2, -23.4, 6.0], [-14.2, 20.5, 2.9, 6.0]]) wing(L(rectP(R[0], R[1], R[2], R[3])), 70);
    for (const R of [[-14.2, -12.1, -23.5, 2.9], [-12.1, 4.1, 1.4, 2.9], [4.0, 20.5, -0.9, 2.9]]) wing(L(rectP(R[0], R[1], R[2], R[3])), 79);
    wing(N85, 85); wing(NE70, 70); wing(E85, 85);
    prismP(B.p(BRICK), T, 60, 135, true);
    winPoly(B.p(WIN), T, 85.6, 132, 3.2, 1.65, 0.85, 1.75, 0.6);
    bandsP(B.p(LIME), T, 101, 133, 32, 0.6, 0.25);
    // corner piers of the shaft (slightly proud), ending in small pinnacles at 135 m
    for (const p of T){ boxP(B.p(BRICK), 1.4, 135 - 85, 1.4, p[0], 85, p[1]); latheP(B.p(CROWN), [[0.8, 0], [0.8, 1.5], [0.3, 4.0], [0, 5.2]], p[0], 135, p[1], 4, PI/4); }
    // ground floor shops / lobby on Fifth Avenue and 59th Street, the entrance canopy on Fifth
    winSeg(B.p(SHOP), [-16.7 - OX, -23.4 - OZ], [-16.7 - OX, 6.0 - OZ], [-1, 0], 0, 5, 5, 3.6, 3.0, 4.2, 0.4, 0.13, true);
    winSeg(B.p(SHOP), [-16.7 - OX, 6.0 - OZ], [20.5 - OX, 6.0 - OZ], [0, 1], 0, 5, 5, 3.6, 3.0, 4.2, 0.4, 0.13, true);
    abox(B.p(AWN), -20.2 - OX, -16.7 - OX, 4.2, 4.6, -11 - OZ, -6 - OZ);
    for (const z of [-11, -6]) segP(B.p(GOLD), [-19.9 - OX, 0, z - OZ], [-19.9 - OX, 4.2, z - OZ], 0.06, 4);
    // ---- the crown: OSM parts 135 - 160 m, then the spire to ~171 m
    const C1 = L([[-12.1, -10.0], [-6.6, -10.0], [-6.6, -5.7], [-12.1, -5.6]]), C2 = L([[-6.3, -17.0], [-2.5, -17.0], [-2.5, 1.4], [-6.3, 1.4]]);
    const C3 = L([[-11.0, -15.5], [2.3, -15.5], [2.2, -0.1], [-11.0, -0.1]]), C4 = L([[-8.0, -12.7], [6.4, -12.7], [6.4, -3.0], [-7.9, -2.9]]);
    for (const [P, top] of [[C1, 145], [C2, 145], [C4, 155]]){ prismP(B.p(CROWN), P, 134.8, top, true); bandsP(B.p(CROWN), P, top - 0.8, top - 0.8, 1, 0.8, 0.25); winPoly(B.p(WIN), P, 137, top - 2, 3.4, 2.2, 0.9, 2.4, 0.4, true); }
    // the lantern block (135 - 160) with chamfered corners, tall round-arched openings and corner pinnacles
    const lc = [-4.35 - OX, -7.8 - OZ], LB = octP(lc[0], lc[1], 13.3, 15.4, 2.2);
    prismP(B.p(CROWN), LB, 134.8, 160, true);
    winPoly(B.p(WIN), LB, 146, 157, 11, 2.6, 1.5, 9.0, 0.6, true);
    bandsP(B.p(CROWN), LB, 145.2, 145.2, 1, 0.9, 0.3); bandsP(B.p(CROWN), LB, 159.0, 159.0, 1, 1.0, 0.45);
    for (let i = 0; i < 8; i += 2){ const p = LB[i], q = LB[i+1], m = [(p[0] + q[0])/2, (p[1] + q[1])/2];
      for (const c of [p, q]) latheP(B.p(CROWN), [[0.55, 0], [0.55, 2.0], [0.2, 4.2], [0, 5.0]], c[0], 160, c[1], 4, PI/4);
      // a gabled dormer (lucarne) on each face of the spire base
      const dx = m[0] - lc[0], dz = m[1] - lc[1], dl = Math.hypot(dx, dz), ux = dx/dl, uz = dz/dl, d0 = dl - 2.2;
      boxP(B.p(CROWN), 2.4, 3.0, 2.0, lc[0] + ux*d0, 160, lc[1] + uz*d0, Math.atan2(-uz, ux) + HP);
      gableP(B.p(ROOFC), lc[0] + ux*d0, lc[1] + uz*d0, 2.0, 2.4, 163, 1.6, Math.atan2(-uz, ux), 0.15); }
    // the spire: an octagonal pyramid, a small arcaded lantern near the top and the finial
    latheP(B.p(ROOFC), [[6.4, 0], [5.8, 1.4], [1.5, 9.2], [0.85, 9.7]], lc[0], 160, lc[1], 8, PI/8);
    latheP(B.p(ROOFC), [[0.85, 0], [0.1, 1.5]], lc[0], 169.7, lc[1], 8, PI/8);
    latheP(B.p(GOLD), [[0.2, 0], [0.3, 0.3], [0, 0.6]], lc[0], 171.1, lc[1], 6);
    // the water-tank chimney (OSM part 0 - 148)
    abox(B.p(BRICK), 6.4 - OX, 9.6 - OX, 85, 148, -9.8 - OZ, -6.0 - OZ); abox(B.p(CROWN), 6.1 - OX, 9.9 - OX, 147, 148.5, -10.1 - OZ, -5.7 - OZ);
    // the sidewalk post clock on Fifth Avenue (cast iron, two plain faces, no numerals)
    { const cx = -21.5 - OX, cz = -11.9 - OZ, IRON = '#2f3a33', FACE = {c:'#f2efe6', glow:'#fff4dc', gk:0.7};
      latheP(B.p(IRON), [[0.45, 0], [0.45, 0.5], [0.3, 0.7], [0.2, 1.2], [0.14, 1.4], [0.14, 3.9], [0.2, 4.0]], cx, 0, cz, 8);
      latheP(B.p(GOLD), [[0.62, 0], [0.62, 0.18]], cx, 4.0, cz, 12); latheP(B.p(IRON), [[0.62, 0], [0.62, 0.2], [0, 0.2]], cx, 4.95, cz, 12);
      { const o = B.p(IRON); for (let i = 0; i < 16; i++){ const t0 = i/16*TAU, t1 = (i+1)/16*TAU;
          quadP(o, [cx + Math.cos(t0)*0.62, 4.0 + 0.5 + Math.sin(t0)*0.5, cz - 0.18], [cx + Math.cos(t1)*0.62, 4.5 + Math.sin(t1)*0.5, cz - 0.18], [cx + Math.cos(t1)*0.62, 4.5 + Math.sin(t1)*0.5, cz + 0.18], [cx + Math.cos(t0)*0.62, 4.5 + Math.sin(t0)*0.5, cz + 0.18]); } }
      for (const sz of [-1, 1]){ const o = B.p(FACE); for (let i = 0; i < 16; i++){ const t0 = i/16*TAU, t1 = (i+1)/16*TAU;
          triP(o, [cx, 4.5, cz + sz*0.2], [cx + Math.cos(t0)*0.52, 4.5 + Math.sin(t0)*0.42, cz + sz*0.2], [cx + Math.cos(t1)*0.52, 4.5 + Math.sin(t1)*0.42, cz + sz*0.2]); }
        segP(B.p(IRON), [cx, 4.5, cz + sz*0.22], [cx + 0.3, 4.62, cz + sz*0.22], 0.025, 3); segP(B.p(IRON), [cx, 4.5, cz + sz*0.22], [cx - 0.05, 4.84, cz + sz*0.22], 0.025, 3); }
      latheP(B.p(GOLD), [[0.12, 0], [0.2, 0.25], [0, 0.6]], cx, 5.15, cz, 6); }
    B.flush(g); return g;
  }};
placeAt('nysherry', 40.76425, -73.97260, -1.85, -7.8, ROT);
// ---------------------------------------------------------------------------------------------------------------------------
// The Pierre (Schultze & Weaver, 1930): 41 storeys, 159 m. Limestone lower storeys, a pale buff brick shaft with limestone
// quoins and string courses rising from 38 m and 61 m wings (OSM parts) to 145 m, crowned by the steep verdigris-copper
// mansard roof modelled on the Royal Chapel at Versailles: chamfered corners, tall round-arched dormers, oeil-de-boeuf
// lucarnes above, a balustraded ridge platform with a small lantern and chimneys; floodlit gold at night.
// Frame: grid; origin = tower centre (ref grid 34.2, 27.1); -x = Fifth Avenue (west), -z = 61st Street (north).
LANDMARKS.nypierre = {zh:'皮埃尔酒店', en:'The Pierre', cat:'old', r:50, h:163,
  lt:{m:1, c:'#ffdcae', k:0.5},
  build(){
    const g = new THREE.Group(), B = mkB(), OX = 34.2, OZ = 27.1;
    const L = P => P.map(p => [p[0] - OX, p[1] - OZ]);
    const BRICK = {c:'#d2bf9e', m:1, fh:3.3, cw:2.4}, LIME = {c:'#e0d8c6', m:0, lk:0.35, lc:'#ffe0b0'}, WIN = {c:'#2c3036', m:1, fh:3.3, cw:2.4},
      CU = {c:'#6f9a86', m:0, lc:'#ffd38a', lk:1.05, e:0.6}, CUD = {c:'#557a69', m:0, lc:'#ffd38a', lk:0.9}, DWIN = {c:'#262a2e', glow:'#ffd9a0', gk:0.35},
      ROOF = '#8a8c88', SHOP = {c:'#3a3530', glow:'#ffd9a0', gk:0.45}, AWN = '#30352f', GOLD = {c:'#b49c62', glow:'#ffd88f', gk:0.5};
    const part = (P, y0, y1, win) => {
      prismP(B.p(BRICK), P, y0, y1, true);
      if (y0 < 1) { prismP(B.p(LIME), insetP(P, -0.12), -5, Math.min(14, y1 - 1), false); bandsP(B.p(LIME), P, 14, 14, 1, 0.8, 0.3); }
      bandsP(B.p(LIME), P, y1 - 1.3, y1 - 1.3, 1, 1.5, 0.4);
      if (win) winPoly(B.p(WIN), P, Math.max(y0, 14.6), y1 - 2.2, 3.3, 1.7, 0.85, 1.85, 0.6);
    };
    // ---- the ground-floor fill (10 m) and the wings (38 m, 48 m, 61 m)
    for (const P of [[[61.0, 11.5], [60.9, 6.4], [75.9, 6.3], [75.9, 11.3]], [[-6.5, 12.0], [-6.4, 6.3], [7.7, 6.3], [7.6, 11.9]], [[-6.5, 36.7], [-6.5, 30.7], [16.4, 30.6], [16.3, 36.7]],
      [[52.2, 36.6], [52.2, 30.2], [75.9, 30.1], [75.9, 36.7]], [[25.1, 17.5], [25.1, 6.3], [43.6, 6.3], [43.7, 17.5]]]) part(L(P), -5, 10, true);
    for (const P of [[[43.7, 17.5], [43.6, 11.5], [75.9, 11.3], [75.9, 30.1], [60.9, 30.1], [61.0, 17.4]], [[-6.5, 30.7], [-6.5, 12.0], [7.6, 11.9], [7.6, 30.7]],
      [[7.6, 11.9], [7.7, 6.3], [25.1, 6.3], [25.2, 11.8]], [[43.6, 11.5], [43.6, 6.3], [60.9, 6.4], [61.0, 11.5]]]) part(L(P), -5, 38, true);
    part(L([[43.7, 17.5], [43.6, 11.5], [61.0, 11.5], [61.0, 17.4]]), 37.8, 48, true);
    part(L([[52.2, 30.2], [52.2, 17.5], [61.0, 17.4], [60.9, 30.1]]), -5, 61, true);
    part(L([[7.6, 30.7], [7.6, 11.9], [25.2, 11.8], [25.1, 17.5], [16.4, 17.6], [16.4, 30.6]]), -5, 61, true);
    // ---- the shaft (0 - 145 m): quoins on the corners, string courses every few storeys
    const T = L([[16.3, 36.7], [16.4, 17.6], [52.2, 17.5], [52.2, 36.6]]);
    part(T, -5, 144, false);
    winPoly(B.p(WIN), T, 14.6, 141, 3.3, 1.7, 0.85, 1.85, 0.6);
    for (const p of T) for (let y = 61; y < 143; y += 1.65) boxP(B.p(LIME), (y/1.65|0) % 2 ? 1.6 : 1.1, 0.8, (y/1.65|0) % 2 ? 1.1 : 1.6, p[0], y, p[1]);
    bandsP(B.p(LIME), T, 128, 128, 1, 0.7, 0.3);
    // ground floor: arched shopfronts on Fifth Avenue, the entrance canopy on 61st Street
    winSeg(B.p(SHOP), [-6.5 - OX, 36.7 - OZ], [-6.4 - OX, 6.3 - OZ], [-1, 0], 0, 5.5, 5.5, 3.8, 2.8, 4.6, 0.4, 0.13, true);
    winSeg(B.p(SHOP), [-6.4 - OX, 6.3 - OZ], [75.9 - OX, 6.3 - OZ], [0, -1], 0, 5.5, 5.5, 3.8, 2.8, 4.6, 0.4, 0.13, true);
    abox(B.p(AWN), 27 - OX, 41 - OX, 4.4, 4.8, 3.0 - OZ, 6.3 - OZ);
    for (const x of [27.4, 40.6]) segP(B.p(GOLD), [x - OX, 0, 3.3 - OZ], [x - OX, 4.4, 3.3 - OZ], 0.07, 4);
    // ---- the mansard (143 - 160 m): chamfered plan, steep lower slope, curb, shallow upper slope to the platform
    const M0 = L([[17.1, 31.3], [17.2, 22.8], [24.2, 18.1], [44.5, 18.1], [51.6, 23.1], [51.4, 30.9], [44.3, 36.0], [24.0, 36.2]]);
    const M1 = insetP(M0, 2.2), M2 = insetP(M0, 4.6);
    prismP(B.p(LIME), insetP(M0, -0.5), 143.2, 144.6, true);   // cornice
    skinP(B.p(CU), M0, 144.6, M1, 155.5, false);
    bandsP(B.p(CU), M1, 155.3, 155.3, 1, 0.5, 0.25);
    skinP(B.p(CUD), M1, 155.8, M2, 158.0, true);
    // dormers: tall round-arched windows in projecting copper frames on the lower slope, oeil-de-boeuf above
    let mcx = 0, mcz = 0; for (const p of M0){ mcx += p[0]; mcz += p[1]; } mcx /= M0.length; mcz /= M0.length;
    for (let i = 0; i < M0.length; i++){ const a = M0[i], b = M0[(i+1) % M0.length], len = Math.hypot(b[0]-a[0], b[1]-a[1]), n = nrmOut(a, b, mcx, mcz), ex = (b[0]-a[0])/len, ez = (b[1]-a[1])/len;
      const nd = len > 15 ? 5 : (len > 9 ? 3 : 1);
      for (let k = 0; k < nd; k++){ const t = (k + 0.5)*len/nd, px = a[0] + ex*t, pz = a[1] + ez*t, ry = Math.atan2(-ez, ex);
        boxP(B.p(CU), 2.6, 6.2, 1.9, px - n[0]*0.6, 145.0, pz - n[1]*0.6, ry);
        archQ(B.p(DWIN), [px, pz], ex, ez, n, 0.36, 0.85, 149.0, 145.6, 6);
        archRing(B.p(LIME), [px, pz], ex, ez, n, 0.3, 0.95, 0.3, 149.0, 0.15, 6);
        // the oeil-de-boeuf above
        const q = [px - n[0]*1.7, pz - n[1]*1.7];
        boxP(B.p(CU), 1.9, 2.0, 1.2, q[0], 151.6, q[1], ry);
        latheP(B.p(CU), [[1.0, 0], [0.5, 0.6], [0, 0.8]], q[0], 153.6, q[1], 4, PI/4 - ry);
        archQ(B.p(DWIN), q, ex, ez, n, 0.62, 0.5, 152.6, 152.1, 6);
      } }
    // the ridge platform: balustrade, the small lantern and two chimneys
    const pc = [34.3 - OX, 27.2 - OZ];
    for (const p of M2) segP(B.p(LIME), [p[0], 158, p[1]], [p[0], 159.0, p[1]], 0.18, 4);
    latheP(B.p(CU), [[1.6, 0], [1.6, 1.4], [1.9, 1.6], [0.9, 2.4], [0.3, 3.0], [0, 3.6]], pc[0], 158, pc[1], 8);
    latheP(B.p(GOLD), [[0.15, 0], [0.15, 1.6], [0, 2.0]], pc[0], 161.6, pc[1], 5);
    for (const dx of [-9, 9]){ abox(B.p(LIME), pc[0] + dx - 0.9, pc[0] + dx + 0.9, 155, 160, pc[1] - 0.6, pc[1] + 0.6); }
    B.flush(g); return g;
  }};
placeAt('nypierre', 40.76540, -73.97190, 34.2, 27.1, ROT);
// ---------------------------------------------------------------------------------------------------------------------------
// St. Bartholomew's Church (Bertram Goodhue, 1917-18; dome 1930; community house 1927): Byzantine Revival in salmon brick
// banded with grey-buff limestone. The triple-arched Romanesque portal porch (McKim, Mead & White, 1902-03, moved from the old
// church) on Park Avenue, the wide gabled nave with round-arched clerestory windows and a great arched west window, the
// transepts, the octagonal drum on a square crossing tower and the polychrome tiled dome (top ~42 m), the chancel to the east,
// the community house along 50th Street and the open terrace at Park Avenue and 50th Street. No figures, no inscriptions.
// Frame: grid; origin = crossing centre (ref grid 19.5, 31.5); -x = Park Avenue (west), -z = 51st Street (north).
LANDMARKS.nystbarts = {zh:'圣巴多罗买教堂', en:"St. Bartholomew's Church", cat:'old', r:56, h:45,
  lt:{m:0, c:'#ffd9aa', k:0.55, e:0.4},
  build(){
    const g = new THREE.Group(), B = mkB(), OX = 19.5, OZ = 31.5;
    const X = x => x - OX, Z = z => z - OZ;
    const BR = {c:'#c48a68', m:0, lk:0.45}, LS = {c:'#cfc6b2', m:0, lk:0.6}, TILE = {c:'#a55a3c', m:0, lk:0.3}, WIN = {c:'#2b2a30', glow:'#ffcf8a', gk:0.25},
      DOME = {c:'#c99a5c', m:0, lk:0.9, lc:'#ffd59a'}, DRIB = {c:'#4f7a74', m:0, lk:0.5}, BRONZE = {c:'#5a4a35', m:0, lk:0.4}, PAVE = '#bdb5a6', GREEN = '#5d7b45', TRUNK = '#56473a';
    // banded brick walls: brick prism plus limestone courses every 1.8 m (proud 5 cm)
    const walls = (P, y0, y1, bands) => { prismP(B.p(BR), P, y0, y1, false); if (bands !== false) bandsP(B.p(LS), P, Math.max(0.6, y0 + 0.6), y1 - 0.5, 1.8, 0.35, 0.05); bandsP(B.p(LS), P, y1 - 0.9, y1 - 0.9, 1, 0.9, 0.3); };
    // ---- the nave (with aisles) x -8.8..8.8, z 17.3..46.9; aisles 10 m, nave walls 18 m, low-pitched tile roof to 25 m
    const NV = rectP(X(-8.8), X(8.8), Z(17.3), Z(46.9));
    walls(rectP(X(-8.8), X(8.8), Z(17.3), Z(22.3)), -4, 10); walls(rectP(X(-8.8), X(8.8), Z(41.9), Z(46.9)), -4, 10);
    hipP(B.p(TILE), X(0), Z(19.8), 17.6, 5.0, 10, 2.0, 0, 0.4); hipP(B.p(TILE), X(0), Z(44.4), 17.6, 5.0, 10, 2.0, 0, 0.4);
    walls(rectP(X(-8.8), X(8.8), Z(22.3), Z(41.9)), -4, 18);
    gableP(B.p(TILE), X(0), Z(32.1), 17.6, 19.6, 18, 6.5, 0, 0.5);
    // the west gable wall (rises above the porch) with the great arched window, and the gable triangle in brick
    { const yb = 18, yt = 24.5, zA = Z(22.3), zB = Z(41.9), x = X(-8.8); const o = B.p(BR);
      triP(o, [x - 0.06, yb, zA], [x - 0.06, yb, zB], [x - 0.06, yt, (zA + zB)/2]);
      archQ(B.p(WIN), [x, (zA + zB)/2], 0, -1, [-1, 0], 0.08, 3.6, 17.2, 12.0, 10);
      archRing(B.p(LS), [x, (zA + zB)/2], 0, -1, [-1, 0], 0.05, 3.7, 0.7, 17.2, 0.35, 10); }
    // clerestory and aisle windows (round-arched)
    winSeg(B.p(WIN), [X(-6), Z(22.3)], [X(7), Z(22.3)], [0, -1], 11.5, 17.5, 6, 4.3, 1.7, 4.3, 0.6, 0.08, true);
    winSeg(B.p(WIN), [X(7), Z(41.9)], [X(-6), Z(41.9)], [0, 1], 11.5, 17.5, 6, 4.3, 1.7, 4.3, 0.6, 0.08, true);
    winSeg(B.p(WIN), [X(-6), Z(17.3)], [X(7), Z(17.3)], [0, -1], 2.5, 9.5, 7, 4.3, 1.4, 4.4, 0.8, 0.08, true);
    // ---- the portal porch on Park Avenue: three round arches on paired columns, a frieze and a low balustraded top
    { const x0 = X(-19.2), x1 = X(-8.8), z0 = Z(15.1), z1 = Z(40.0), H = 13.5;
      abox(B.p(LS), x0, x1, -4, 0.8, z0, z1 + 6.9);                 // steps / podium (to the south edge 46.9)
      abox(B.p(LS), x0 + 1.6, x1, 0.8, H, z0, z1);                    // porch mass
      abox(B.p(LS), x0 + 1.2, x1, H - 2.4, H - 1.2, z0 - 0.3, z1 + 0.3); // frieze band
      abox(B.p(LS), x0 + 1.0, x1, H - 0.4, H + 0.3, z0 - 0.4, z1 + 0.4); // cornice
      for (let z = z0 + 0.6; z <= z1 - 0.5; z += 1.6) abox(B.p(LS), x0 + 1.3, x0 + 1.8, H + 0.3, H + 1.3, z, z + 0.5);
      const zc = (z0 + z1)/2, xs = x0 + 1.6;
      for (const [dz, hw, ys] of [[-8.2, 2.0, 7.0], [0, 2.6, 7.6], [8.2, 2.0, 7.0]]){
        archQ(B.p(BRONZE), [xs, zc + dz], 0, -1, [-1, 0], 0.06, hw, ys, 0.8, 10);
        archRing(B.p(LS), [xs, zc + dz], 0, -1, [-1, 0], 0.04, hw + 0.05, 0.9, ys, 0.6, 10);
        for (const s of [-1, 1]) for (const k of [0, 1]) segP(B.p(LS), [xs - 0.9 - k*0.9, 0.8, zc + dz + s*(hw + 0.7)], [xs - 0.9 - k*0.9, ys + 0.3, zc + dz + s*(hw + 0.7)], 0.32, 8);
      }
    }
    // narthex wing along the south of the porch (to z 46.9)
    walls(rectP(X(-17.6), X(-8.8), Z(40.0), Z(46.9)), -4, 9); hipP(B.p(TILE), X(-13.2), Z(43.45), 8.8, 6.9, 9, 1.6, 0, 0.3);
    // ---- transepts (north arm to z 8.8) and the crossing tower
    walls(rectP(X(8.8), X(30.3), Z(8.8), Z(22.3)), -4, 18); gableP(B.p(TILE), X(19.55), Z(15.5), 13.6, 21.5, 18, 6.0, HP, 0.4);
    walls(rectP(X(8.8), X(30.3), Z(41.9), Z(50.5)), -4, 18); gableP(B.p(TILE), X(19.55), Z(46.2), 8.6, 21.5, 18, 6.0, HP, 0.4);
    for (const zf of [8.8]){ const z = Z(zf); archQ(B.p(WIN), [X(19.55), z], 1, 0, [0, -1], 0.08, 4.2, 15.0, 5.0, 12); archRing(B.p(LS), [X(19.55), z], 1, 0, [0, -1], 0.05, 4.3, 0.8, 15.0, 0.4, 12);
      const o = B.p(BR); triP(o, [X(8.8), 18, z - 0.15], [X(30.3), 18, z - 0.15], [X(19.55), 24, z - 0.15]); }
    walls(rectP(X(8.8), X(30.3), Z(22.3), Z(41.9)), -4, 26);           // crossing tower (square), to 26 m
    winSeg(B.p(WIN), [X(10), Z(22.3)], [X(29), Z(22.3)], [0, -1], 19.5, 25, 6, 4.8, 1.5, 4.0, 0.4, 0.08, true);
    winSeg(B.p(WIN), [X(29), Z(41.9)], [X(10), Z(41.9)], [0, 1], 19.5, 25, 6, 4.8, 1.5, 4.0, 0.4, 0.08, true);
    capP(B.p(TILE), rectP(X(8.8), X(30.3), Z(22.3), Z(41.9)), 26.05);
    // the octagonal drum with arched windows and the polychrome tiled dome, lantern finial
    const dc = [X(19.55), Z(32.1)], DR = circP(9.0, 8, PI/8, dc[0], dc[1]);
    prismP(B.p(BR), DR, 25.5, 32.5, false); bandsP(B.p(LS), DR, 25.5, 32, 1.8, 0.35, 0.05); bandsP(B.p(LS), DR, 32.0, 32.0, 1, 0.8, 0.35);
    winPoly(B.p(WIN), DR, 26.6, 31.6, 6, 3.0, 1.3, 3.6, 0.4, true);
    for (const p of DR) boxP(B.p(LS), 0.9, 7.0, 0.9, p[0], 25.5, p[1]);
    const prof = []; for (let i = 0; i <= 8; i++){ const t = i/8*HP; prof.push([8.7*Math.cos(t), 8.6*Math.sin(t)]); } prof[8][0] = 1.3;
    latheP(B.p(DOME), prof, dc[0], 32.8, dc[1], 8, PI/8);
    // tile pattern: blue-green ribs on the eight hips and two bands
    for (let k = 0; k < 8; k++){ const a = PI/8 + k/8*TAU; let prev = null;
      for (let i = 0; i <= 8; i++){ const r = prof[i][0] + 0.08, y = 32.8 + prof[i][1]; const p = [dc[0] + Math.cos(a)*r, y, dc[1] + Math.sin(a)*r]; if (prev) segP(B.p(DRIB), prev, p, 0.28, 3); prev = p; } }
    for (const [r, y, h] of [[8.75, 33.6, 0.7], [6.6, 38.4, 0.6]]) latheP(B.p(DRIB), [[r, 0], [r - 0.15, h]], dc[0], y, dc[1], 8, PI/8);
    latheP(B.p(LS), [[1.4, 0], [1.4, 1.6], [1.6, 1.8], [0.5, 2.6], [0.2, 3.4], [0, 3.8]], dc[0], 41.2, dc[1], 8, PI/8);
    // ---- the chancel to the east (x 30.3..44.9), gabled, flat east end against the neighbour
    walls(rectP(X(30.3), X(44.9), Z(10.8), Z(40.3)), -4, 16); gableP(B.p(TILE), X(37.6), Z(25.55), 14.6, 29.5, 16, 5.0, 0, 0.3);
    winSeg(B.p(WIN), [X(31.5), Z(10.8)], [X(43.5), Z(10.8)], [0, -1], 6, 14.5, 9, 4.0, 1.5, 6.0, 0.5, 0.08, true);
    // ---- the community house along 50th Street (x 8.6..43.5, z 50.5..69.4): five storeys, arched top windows, tile hip roof
    const CH = [[X(8.7), Z(50.5)], [X(43.6), Z(50.5)], [X(43.5), Z(69.4)], [X(8.6), Z(69.3)]];
    walls(CH, -4, 17, false); bandsP(B.p(LS), CH, 4.6, 4.6, 1, 0.6, 0.15);
    winPoly(B.p(WIN), CH, 5.6, 16.5, 3.6, 3.3, 1.4, 2.2, 0.6);
    winSeg(B.p(WIN), [X(8.6), Z(69.3)], [X(43.5), Z(69.4)], [0, 1], 0, 4.5, 4.5, 4.4, 2.6, 3.6, 0.3, 0.08, true);
    capP(B.p(LS), CH, 17.05);
    // the terraced top storeys: set back from 50th Street and from the west, arched windows, a tile hip roof
    const CH2 = rectP(X(12.5), X(43.0), Z(50.8), Z(65.0));
    walls(CH2, 16.5, 23, false); winPoly(B.p(WIN), CH2, 17.8, 22.4, 3.0, 3.3, 1.4, 2.4, 0.2, true);
    hipP(B.p(TILE), X(27.75), Z(57.9), 30.5, 14.2, 23, 3.4, 0, 0.5);
    for (let x = 9.1; x < 43.3; x += 1.0) abox(B.p(LS), X(x) - 0.1, X(x) + 0.1, 17, 18.0, Z(68.8), Z(69.0));
    // ---- the terrace at Park Avenue and 50th Street: raised paving, a low balustrade, planters and trees
    { const x0 = X(-19.0), x1 = X(8.6), z0 = Z(46.9), z1 = Z(69.0);
      abox(B.p(PAVE), x0, x1, -3, 1.1, z0, z1);
      for (let x = x0 + 0.6; x < x1; x += 1.2) abox(B.p(LS), x - 0.12, x + 0.12, 1.1, 1.95, z1 - 0.3, z1);
      for (let z = z0 + 0.6; z < z1; z += 1.2) abox(B.p(LS), x0, x0 + 0.3, 1.1, 1.95, z - 0.12, z + 0.12);
      abox(B.p(LS), x0, x1, 1.95, 2.15, z1 - 0.35, z1 + 0.05); abox(B.p(LS), x0 - 0.05, x0 + 0.35, 1.95, 2.15, z0, z1);
      for (const [x, z] of [[-14, 52], [-14, 59], [-14, 65.5], [-6, 65.5], [2, 65.5], [-6, 54], [2, 54]]) treeP(B, X(x), 1.1, Z(z), 1.3, GREEN, TRUNK, LMCTX.rng); }
    B.flush(g); return g;
  }};
placeAt('nystbarts', 40.75760, -73.97305, 19.5, 31.5, ROT);
// ---------------------------------------------------------------------------------------------------------------------------
// Central Synagogue (Henry Fernbach, 1872; restored after the 1998 fire): Moorish Revival in tan sandstone banded with red-brown
// stone. The Lexington Avenue front between the twin towers: the great horseshoe arch with the rose window, the triple
// entrance with cusped horseshoe arches, an arcaded gable; the two towers - square shafts with banded masonry, octagonal belfry
// stages with horseshoe arcades, the green copper onion domes with gilded bands and finials (~37 m); the nave with horseshoe-
// arched windows between buttress piers with small pinnacles and the pitched roof. Respectful architecture only, no inscriptions.
// Frame: grid; origin = centre of the footprint (ref grid -30.8, 25.6); +x = Lexington Avenue (east), -z = 55th Street (north).
LANDMARKS.nycentralsyn = {zh:'中央犹太会堂', en:'Central Synagogue', cat:'old', r:28, h:39,
  lt:{m:0, c:'#ffd9aa', k:0.6, e:0.5},
  build(){
    const g = new THREE.Group(), B = mkB(), OX = -30.8, OZ = 25.6;
    const X = x => x - OX, Z = z => z - OZ;
    const SAND = {c:'#bd9f7c', m:0, lk:0.55}, RED = {c:'#8e5a46', m:0, lk:0.45}, WIN = {c:'#2b2a30', glow:'#ffcf8a', gk:0.25}, ROOF = {c:'#5d6266', m:0, lk:0.25},
      CU = {c:'#4c7b69', m:0, lk:0.7, lc:'#ffe2b0'}, GOLD = {c:'#c2a35a', glow:'#ffd98f', gk:0.45}, DOOR = '#4a3a2c', TRIM = {c:'#d9c7a8', m:0, lk:0.6};
    const banded = (P, y0, y1) => { prismP(B.p(SAND), P, y0, y1, false); bandsP(B.p(RED), P, Math.max(0.8, y0 + 0.8), y1 - 0.6, 1.5, 0.5, 0.04); };
    // ---- the nave (x -46..-16.7, z 12.6..38.6): walls to 17 m, buttress piers, horseshoe-arched windows, pitched roof to 23.6 m
    const NV = rectP(X(-46.0), X(-16.7), Z(12.6), Z(38.6));
    banded(NV, -4, 17); bandsP(B.p(TRIM), NV, 16.2, 16.2, 1, 0.8, 0.3);
    for (let x = -43; x <= -19; x += 6) for (const [zf, nz] of [[12.6, -1], [38.6, 1]]){
      abox(B.p(SAND), X(x) - 0.7, X(x) + 0.7, -4, 17.6, Z(zf) + (nz < 0 ? -0.8 : 0), Z(zf) + (nz < 0 ? 0 : 0.8));
      latheP(B.p(TRIM), [[0.55, 0], [0.55, 0.8], [0.2, 2.6], [0, 3.2]], X(x), 17.6, Z(zf) + nz*0.4, 4, PI/4); }
    for (const [a, b, n] of [[[X(-46), Z(12.6)], [X(-16.7), Z(12.6)], [0, -1]], [[X(-16.7), Z(38.6)], [X(-46), Z(38.6)], [0, 1]]]){
      winSeg(B.p(WIN), a, b, n, 7.0, 15.5, 9, 6.0, 2.6, 7.2, 0.6, 0.08, true);
      winSeg(B.p(WIN), a, b, n, 1.5, 6.2, 5, 6.0, 1.4, 3.6, 0.5, 0.08, true); }
    gableP(B.p(ROOF), X(-31.35), Z(25.6), 29.3, 26.0, 17, 6.6, 0, 0.6);
    // the west annex (x -51.4..-46)
    banded(rectP(X(-51.3), X(-46.0), Z(11.1), Z(40.8)), -4, 12); capP(B.p(ROOF), rectP(X(-51.3), X(-46.0), Z(11.1), Z(40.8)), 12.05);
    // ---- the Lexington Avenue front between the towers (x = -16.7, z 17..34)
    const xf = X(-16.7), zc = Z(25.6);
    banded(rectP(X(-18.5), xf, Z(17.0), Z(34.2)), -4, 19);
    { const o = B.p(SAND); triP(o, [xf + 0.02, 19, Z(17.0)], [xf + 0.02, 19, Z(34.2)], [xf + 0.02, 24.2, zc]); }
    // arcaded gable top: small arches and a central finial
    for (let k = -3; k <= 3; k++) archQ(B.p(WIN), [xf, zc + k*2.0], 0, -1, [1, 0], 0.06, 0.55, 20.3 + (3 - Math.abs(k))*1.2, 19.4, 6);
    latheP(B.p(GOLD), [[0.3, 0], [0.3, 1.2], [0, 2.4]], xf - 0.3, 24.0, zc, 6);
    // the great horseshoe arch with the rose window
    archRing(B.p(TRIM), [xf, zc], 0, -1, [1, 0], 0.05, 5.6, 0.9, 11.5, 0.45, 14);
    archQ(B.p(RED), [xf, zc], 0, -1, [1, 0], 0.06, 5.6, 11.5, 6.6, 14);
    { const o = B.p(WIN), R = 3.3, cy = 12.2, n = 24; for (let i = 0; i < n; i++){ const t0 = i/n*TAU, t1 = (i+1)/n*TAU;
        triP(o, [xf + 0.12, cy, zc], [xf + 0.12, cy + Math.sin(t0)*R, zc + Math.cos(t0)*R], [xf + 0.12, cy + Math.sin(t1)*R, zc + Math.cos(t1)*R]); }
      const t = B.p(TRIM); for (let i = 0; i < 12; i++){ const a = i/12*TAU; segP(t, [xf + 0.18, cy, zc], [xf + 0.18, cy + Math.sin(a)*R, zc + Math.cos(a)*R], 0.09, 3); }
      for (let i = 0; i < 24; i++){ const a0 = i/24*TAU, a1 = (i+1)/24*TAU; segP(t, [xf + 0.2, cy + Math.sin(a0)*(R + 0.15), zc + Math.cos(a0)*(R + 0.15)], [xf + 0.2, cy + Math.sin(a1)*(R + 0.15), zc + Math.cos(a1)*(R + 0.15)], 0.2, 4); } }
    // the triple entrance (cusped horseshoe arches) on a short flight of steps
    abox(B.p(TRIM), xf, xf + 2.2, -2, 0.6, Z(18.5), Z(32.7));
    for (const [dz, hw] of [[-4.6, 1.3], [0, 1.7], [4.6, 1.3]]){
      archQ(B.p(DOOR), [xf, zc + dz], 0, -1, [1, 0], 0.07, hw, 3.6 + hw*0.6, 0.6, 10);
      archRing(B.p(TRIM), [xf, zc + dz], 0, -1, [1, 0], 0.05, hw + 0.05, 0.45, 3.6 + hw*0.6, 0.3, 10); }
    // ---- the twin towers: square banded shafts to 25 m, octagonal belfry to 29.5 m, onion dome and finial to ~37.5 m
    for (const [z0, z1] of [[10.4, 17.0], [33.0, 39.5]]){
      const tz = Z((z0 + z1)/2), tx = X(-13.45), S = rectP(X(-16.8), X(-10.2), Z(z0), Z(z1));
      banded(S, -4, 25.0); capP(B.p(SAND), S, 25.0);
      for (const p of S) boxP(B.p(SAND), 0.9, 25.6, 0.9, p[0], -4, p[1]);
      bandsP(B.p(TRIM), S, 9.2, 9.2, 1, 0.5, 0.18); bandsP(B.p(TRIM), S, 24.4, 24.4, 1, 0.7, 0.3);
      winPoly(B.p(WIN), S, 11.5, 22.5, 5.5, 3.0, 0.9, 3.4, 0.6, true);
      for (const p of S) latheP(B.p(GOLD), [[0.35, 0], [0.35, 0.6], [0, 2.0]], p[0], 25.2, p[1], 4, PI/4);
      const O = circP(2.9, 8, PI/8, tx, tz);
      prismP(B.p(SAND), O, 25.0, 29.4, false); bandsP(B.p(RED), O, 25.6, 29, 1.2, 0.35, 0.03);
      winPoly(B.p(WIN), O, 25.9, 28.8, 4, 1.6, 0.8, 2.4, 0.1, true);
      bandsP(B.p(TRIM), O, 29.2, 29.2, 1, 0.5, 0.25);
      // the onion dome: bulb wider than the drum, pinched neck, gilded bands, finial
      latheP(B.p(CU), [[2.7, 0], [3.4, 1.1], [3.55, 2.2], [3.1, 3.5], [2.0, 4.6], [0.9, 5.5], [0.35, 6.2], [0.25, 6.6]], tx, 29.7, tz, 12);
      latheP(B.p(GOLD), [[3.42, 0], [3.56, 0.6], [3.5, 1.0]], tx, 30.9, tz, 12);
      latheP(B.p(GOLD), [[0.28, 0], [0.55, 0.4], [0.28, 0.8], [0.12, 1.6], [0.25, 1.9], [0, 2.6]], tx, 36.2, tz, 6);
    }
    B.flush(g); return g;
  }};
placeAt('nycentralsyn', 40.75965, -73.97010, -30.8, 25.6, ROT);
// ---------------------------------------------------------------------------------------------------------------------------
// Temple Emanu-El (Robert D. Kohn, Charles Butler and Clarence Stein, 1929): Romanesque Revival with Byzantine and Art Deco
// detail, in buff limestone. The Fifth Avenue front is one tall gable wall with the great recessed round-arched portal - five
// receding archivolts, the large wheel window in the arch and the triple doors below - framed by two buttress towers with
// stepped tops; the long sanctuary (one of the largest synagogue halls in the world) with tall round-arched windows between
// buttresses along 65th Street and a steep polychrome tile roof; the lower Beth-El chapel wing on the north, the community
// house wing at the east end. Respectful architecture only, no inscriptions.
// Frame: grid; origin = footprint centre (ref grid 71.4, 32.8); -x = Fifth Avenue (west), +z = 65th Street (south).
LANDMARKS.nyemanuel = {zh:'以马内利会堂', en:'Temple Emanu-El', cat:'old', r:46, h:56,
  lt:{m:0, c:'#ffdcb0', k:0.6, e:0.5},
  build(){
    const g = new THREE.Group(), B = mkB(), OX = 71.4, OZ = 32.8;
    const X = x => x - OX, Z = z => z - OZ;
    const LS = {c:'#cdbf9f', m:0, lk:0.6}, LS2 = {c:'#b9aa89', m:0, lk:0.5}, WIN = {c:'#2b2a30', glow:'#ffcf8a', gk:0.28}, TILE = {c:'#8f5a3e', m:0, lk:0.3},
      TILE2 = {c:'#5e7363', m:0, lk:0.3}, DOOR = '#4b3b2b', ROOFF = '#6c6c68', GOLD = {c:'#b99c5a', glow:'#ffd98f', gk:0.35};
    const wall = (P, y0, y1) => { prismP(B.p(LS), P, y0, y1, true); bandsP(B.p(LS2), P, y1 - 1.2, y1 - 1.2, 1, 1.2, 0.35); };
    // ---- the sanctuary (x 37..95.5, z 24.2..54.2): walls to 36 m, steep tile roof to the ridge at 52 m
    const S = rectP(X(37.0), X(95.5), Z(24.2), Z(54.2)), zc = Z(39.2);
    wall(S, -4, 36);
    bandsP(B.p(LS2), S, 8, 8, 1, 0.8, 0.2);
    gableP(B.p(TILE), X(66.25), zc, 58.5, 30.0, 36, 16.0, 0, 0.6);
    { const o = B.p(TILE2), hw0 = 15.6, x0 = X(37.2), x1 = X(95.3); for (const yb of [39.5, 43.5, 47.5]){ const yt = yb + 1.0, wb = hw0*(1 - (yb - 36)/16), wt = hw0*(1 - (yt - 36)/16);
      for (const sg of [-1, 1]) quadP(o, [x0, yb + 0.08, zc + sg*wb], [x1, yb + 0.08, zc + sg*wb], [x1, yt + 0.08, zc + sg*wt], [x0, yt + 0.08, zc + sg*wt]); } }
    // buttresses and tall round-arched windows along 65th Street and the north side above the chapel
    for (let x = 44; x <= 92; x += 8){ abox(B.p(LS2), X(x) - 1.0, X(x) + 1.0, -4, 34.5, Z(54.2), Z(55.6)); if (x < 64 || x > 80) abox(B.p(LS2), X(x) - 1.0, X(x) + 1.0, 24, 34.5, Z(22.8), Z(24.2)); }
    for (const [a, b, n] of [[[X(44), Z(54.2)], [X(92), Z(54.2)], [0, 1]], [[X(92), Z(24.2)], [X(44), Z(24.2)], [0, -1]]]){
      winSeg(B.p(WIN), a, b, n, 12.0, 32.5, 22, 8.0, 3.2, 18.5, 0.5, 0.08, true); }
    winSeg(B.p(WIN), [X(44), Z(54.2)], [X(92), Z(54.2)], [0, 1], 2.0, 7.5, 6, 8.0, 2.2, 4.2, 0.5, 0.08, true);
    // ---- the Fifth Avenue front (x = 32.7..37, z 24.2..54.2): gable wall to 54 m, buttress towers, the great arch
    const xf = X(32.7);
    abox(B.p(LS), xf, X(37.2), -4, 36, Z(28.5), Z(49.7));
    { const o = B.p(LS), y0 = 36, y1 = 53.5; triP(o, [xf, y0, Z(28.5)], [xf, y0, Z(49.7)], [xf, y1, zc]); triP(o, [X(37.2), y0, Z(28.5)], [X(37.2), y1, zc], [X(37.2), y0, Z(49.7)]);
      // gable coping (two sloped bars)
      segP(B.p(LS2), [xf - 0.2, y0 + 0.4, Z(28.0)], [xf - 0.2, y1 + 0.5, zc], 0.6, 4); segP(B.p(LS2), [xf - 0.2, y0 + 0.4, Z(50.2)], [xf - 0.2, y1 + 0.5, zc], 0.6, 4);
      // a small arcade high in the gable
      for (let k = -2; k <= 2; k++) archQ(B.p(WIN), [xf, zc + k*1.9], 0, -1, [-1, 0], 0.06, 0.6, 43.2, 40.6, 6); }
    // buttress towers at both front corners, stepped tops
    for (const [z0, z1] of [[24.2, 28.5], [49.7, 54.2]]){
      const T = rectP(X(32.7), X(38.5), Z(z0), Z(z1));
      prismP(B.p(LS), T, -4, 40, true); bandsP(B.p(LS2), T, 39.2, 39.2, 1, 0.8, 0.3);
      prismP(B.p(LS), insetP(T, 0.8), 40, 43.5, true); prismP(B.p(LS2), insetP(T, 1.4), 43.5, 45.5, true);
      winSeg(B.p(WIN), [X(32.7), Z(z1)], [X(32.7), Z(z0)], [-1, 0], 22, 37, 7.5, 3.0, 1.0, 5.2, 0.5, 0.08, true); }
    // the great recessed arch: five receding archivolts, the wheel window and the triple portal
    const hw = 7.6, ys = 19.0;
    for (let k = 0; k < 5; k++){ const r = hw - k*0.55, d = 2.6 - k*0.5, col = B.p(k % 2 ? LS2 : LS);
      archRing(col, [xf, zc], 0, -1, [-1, 0], 0, r, 0.55, ys, d, 16);
      for (const sg of [-1, 1]) boxP(col, d, ys + 0.6, 0.55, xf - d/2, -0.6, zc + sg*(r + 0.275)); }
    abox(B.p(LS), xf - 2.6, xf, -0.6, 36, Z(24.2) + 4.3, zc - hw - 0.55); abox(B.p(LS), xf - 2.6, xf, -0.6, 36, zc + hw + 0.55, Z(54.2) - 4.5);
    abox(B.p(LS), xf - 2.6, xf, ys + hw + 0.55, 36, zc - hw - 0.6, zc + hw + 0.6);
    archQ(B.p(LS2), [xf, zc], 0, -1, [-1, 0], 0.03, hw - 2.2, ys, 0, 16);
    { const o = B.p(WIN), R = 4.2, cy = ys + 0.4, xw = xf - 0.08, n = 28; for (let i = 0; i < n; i++){ const t0 = i/n*TAU, t1 = (i+1)/n*TAU;
        triP(o, [xw, cy, zc], [xw, cy + Math.sin(t0)*R, zc + Math.cos(t0)*R], [xw, cy + Math.sin(t1)*R, zc + Math.cos(t1)*R]); }
      const t = B.p(LS); for (let i = 0; i < 12; i++){ const a = i/12*TAU; segP(t, [xw - 0.06, cy + Math.sin(a)*1.0, zc + Math.cos(a)*1.0], [xw - 0.06, cy + Math.sin(a)*R, zc + Math.cos(a)*R], 0.11, 3); }
      for (const a0 of [HP, HP + PI/3]) for (let k = 0; k < 3; k++){ const a = a0 + k*TAU/3, b = a0 + (k+1)*TAU/3; segP(t, [xw - 0.07, cy + Math.sin(a)*0.85, zc + Math.cos(a)*0.85], [xw - 0.07, cy + Math.sin(b)*0.85, zc + Math.cos(b)*0.85], 0.06, 3); }
      for (let i = 0; i < 16; i++){ const a0 = i/16*TAU, a1 = (i+1)/16*TAU; segP(t, [xw - 0.06, cy + Math.sin(a0)*1.0, zc + Math.cos(a0)*1.0], [xw - 0.06, cy + Math.sin(a1)*1.0, zc + Math.cos(a1)*1.0], 0.07, 3); }
      // the two columns flanking the wheel window (plain capitals, no figures)
      for (const sg of [-1, 1]){ segP(t, [xf - 0.7, 9.2, zc + sg*4.7], [xf - 0.7, 21.6, zc + sg*4.7], 0.34, 8); abox(t, xf - 1.3, xf, 21.6, 22.4, zc + sg*4.7 - 0.6, zc + sg*4.7 + 0.6); abox(t, xf - 1.3, xf, 8.6, 9.2, zc + sg*4.7 - 0.6, zc + sg*4.7 + 0.6); }
      for (let i = 0; i < 24; i++){ const a0 = i/24*TAU, a1 = (i+1)/24*TAU; segP(t, [xw - 0.1, cy + Math.sin(a0)*(R + 0.2), zc + Math.cos(a0)*(R + 0.2)], [xw - 0.1, cy + Math.sin(a1)*(R + 0.2), zc + Math.cos(a1)*(R + 0.2)], 0.25, 4); } }
    for (const dz of [-3.6, 0, 3.6]){ archQ(B.p(DOOR), [xf, zc + dz], 0, -1, [-1, 0], 0.1, 1.25, 5.8, 0.5, 8); }
    abox(B.p(LS2), xf - 4.2, xf, -2, 0.5, Z(31), Z(47.4));       // steps
    abox(B.p(LS2), xf - 0.3, xf, 8.2, 9.2, zc - 5.4, zc + 5.4);     // lintel band over the doors
    // ---- the Beth-El chapel wing on the north (x 37.8..63.7, z 11.4..24.2): 20 m, gabled, its own arched front on Fifth
    const C = rectP(X(37.8), X(63.7), Z(11.4), Z(24.2));
    wall(C, -4, 20); gableP(B.p(TILE), X(50.75), Z(17.8), 25.9, 12.8, 20, 5.5, 0, 0.4);
    winSeg(B.p(WIN), [X(39), Z(11.4)], [X(62.5), Z(11.4)], [0, -1], 7, 18, 12, 4.6, 1.6, 8.5, 0.5, 0.08, true);
    { const o = B.p(LS), x = X(37.8) - 0.05; triP(o, [x, 20, Z(11.4)], [x, 20, Z(24.2)], [x, 25.5, Z(17.8)]);
      archRing(B.p(LS2), [x, Z(17.8)], 0, -1, [-1, 0], 0, 2.4, 0.6, 9, 0.4, 10); archQ(B.p(DOOR), [x, Z(17.8)], 0, -1, [-1, 0], 0.02, 2.4, 9, 0.5, 10);
      winSeg(B.p(WIN), [x, Z(24.2)], [x, Z(11.4)], [-1, 0], 12, 18.5, 7, 4.2, 1.3, 5.0, 0.3, 0.02, true); }
    abox(B.p(LS), X(32.7), X(37.8), -4, 12, Z(24.2), Z(28.5));
    // ---- the east end: community house wing (x 95.5..110.1), flat roof, punched windows
    const E = [[X(95.5), Z(24.2)], [X(95.5), Z(27.0)], [X(110.1), Z(27.0)], [X(110.1), Z(54.2)], [X(95.5), Z(54.2)]];
    const E2 = rectP(X(95.5), X(110.1), Z(27.0), Z(54.2));
    wall(E2, -4, 30); capP(B.p(ROOFF), E2, 30.05);
    winPoly(B.p(WIN), E2, 4, 28, 3.8, 3.0, 1.3, 2.3, 0.7);
    abox(B.p(LS), X(95.5), X(96.5), -4, 36, Z(24.2), Z(27.0));
    // a finial on the gable apex
    latheP(B.p(GOLD), [[0.35, 0], [0.35, 0.8], [0.15, 1.6], [0, 2.2]], xf + 0.2, 53.9, zc, 6);
    B.flush(g); return g;
  }};
placeAt('nyemanuel', 40.76860, -73.97010, 71.4, 32.8, ROT);
// ---------------------------------------------------------------------------------------------------------------------------
// The Frick Collection (Henry Clay Frick House, Carrere & Hastings, 1913-14; John Russell Pope extension 1935; restored and
// extended 2025): a two-storey Indiana-limestone Beaux-Arts mansion behind its raised Fifth Avenue garden. The long West
// Gallery wing along 71st Street ending in the pavilion on Fifth Avenue, the main house with the central columned loggia
// facing the park, rusticated ground floor, tall French windows, cornice and balustraded roofline with urns, the gallery's
// glass skylight lantern, the entrance pavilion on 70th Street and the walled 70th Street garden with its reflecting pool;
// the Fifth Avenue lawn with magnolia trees behind a low balustrade.
// Frame: grid; origin = ref grid (0.8, -7.8); -x = Fifth Avenue (west), +z = 70th Street (south).
LANDMARKS.nyfrick = {zh:'弗里克收藏馆', en:'The Frick Collection', cat:'old', r:58, h:17,
  lt:{m:0, c:'#ffdcb0', k:0.5, e:0.6},
  build(){
    const g = new THREE.Group(), B = mkB(), OX = 0.8, OZ = -7.8;
    const X = x => x - OX, Z = z => z - OZ;
    const LS = {c:'#dcd4c3', m:0, lk:0.5}, LS2 = {c:'#c9c0ad', m:0, lk:0.45}, WIN = {c:'#2d3034', glow:'#ffd7a0', gk:0.3}, ROOF = '#7b7d7a',
      SKY = {c:'#9fb4bd', glow:'#fff0d0', gk:0.25}, LAWN = '#6a8a4a', PAVE = '#c2bba9', WAT = {c:'#4d6f7e', glow:'#9fcfe0', gk:0.15}, MAG = '#7f9a58', TRUNK = '#5a4a3a', HEDGE = '#4a6a3a';
    // a mansion block: rusticated ground floor, piano nobile, cornice, balustrade, punched windows
    const mansion = (P, h, sides) => {
      prismP(B.p(LS), P, -4, h, true);
      bandsP(B.p(LS2), P, 0, 0, 1, 1.2, 0.25);                      // base course
      bandsP(B.p(LS2), P, 1.6, 5.6, 0.8, 0.12, 0.04);               // rustication lines
      bandsP(B.p(LS2), P, 6.0, 6.0, 1, 0.5, 0.2);                   // string course
      bandsP(B.p(LS), P, h - 1.8, h - 1.8, 1, 1.0, 0.55);           // cornice
      // balustrade: posts round the roof edge, rail on top
      const Q = insetP(P, 0.15); prismP(B.p(LS2), Q, h - 0.8, h, false);
      prismP(B.p(LS), insetP(P, -0.1), h + 1.0, h + 1.25, false);
      let cx = 0, cz = 0; for (const p of Q){ cx += p[0]; cz += p[1]; } cx /= Q.length; cz /= Q.length;
      for (let i = 0; i < Q.length; i++){ const a = Q[i], b = Q[(i+1) % Q.length], L = Math.hypot(b[0]-a[0], b[1]-a[1]), n = Math.max(1, Math.round(L/0.6));
        for (let k = 0; k <= n; k++){ const t = k/n; boxP(B.p(LS), 0.22, 1.0, 0.22, a[0] + (b[0]-a[0])*t, h, a[1] + (b[1]-a[1])*t); } }
      for (const p of Q) latheP(B.p(LS), [[0.35, 0], [0.45, 0.4], [0.25, 0.9], [0, 1.2]], p[0], h + 1.25, p[1], 6);
      winPoly(B.p(WIN), P, 1.8, 5.4, 6, 3.6, 1.3, 2.6, 0.2);         // ground floor
      winPoly(B.p(WIN), P, 7.2, 12.4, 6, 3.6, 1.5, 4.0, 0.2, true);  // tall arched French windows
    };
    // ---- the West Gallery wing along 71st Street (x -33.4..35.1, z -36.6..-21.8) and its skylight lantern
    const GW = rectP(X(-33.4), X(35.1), Z(-36.6), Z(-21.8));
    mansion(GW, 14.5);
    capP(B.p(ROOF), GW, 14.55);
    { const x0 = X(-24), x1 = X(10), z0 = Z(-33.5), z1 = Z(-25); abox(B.p(LS2), x0, x1, 14.5, 15.6, z0, z1); gableP(B.p(SKY), (x0 + x1)/2, (z0 + z1)/2, x1 - x0, z1 - z0, 15.6, 2.4, 0, 0.1);
      for (let x = x0; x <= x1; x += 2.0) segP(B.p(LS2), [x, 15.6, z0], [x, 18.0, (z0 + z1)/2], 0.06, 3); }
    // the Fifth Avenue pavilion at the west end of the gallery: pilasters, a central arched window, a low attic
    for (let z = -35.6; z <= -22.8; z += 3.2) abox(B.p(LS2), X(-33.4) - 0.5, X(-33.4), 1.2, 12.7, Z(z) - 0.4, Z(z) + 0.4);
    abox(B.p(LS), X(-33.4), X(-28.0), 14.5, 16.2, Z(-34.6), Z(-23.8));
    // ---- the main house (x -10.5..29.9, z -21.8..20)
    const MH = [[X(-10.5), Z(-21.8)], [X(29.9), Z(-21.8)], [X(29.9), Z(18.5)], [X(26.1), Z(21.0)], [X(20.8), Z(20.9)], [X(19.3), Z(20.2)], [X(-10.5), Z(20.2)]];
    mansion(MH, 15.0);
    capP(B.p(ROOF), MH, 15.05);
    abox(B.p(ROOF), X(-2), X(22), 15.0, 16.6, Z(-14), Z(12));      // low roof over the courts
    // the central loggia facing the garden: six Ionic-style columns on a podium, entablature, the windows behind
    { const x = X(-10.5), zc = Z(-0.8); abox(B.p(LS), x - 3.2, x, -1, 1.2, zc - 9.5, zc + 9.5);
      for (let k = 0; k < 6; k++){ const z = zc - 7.5 + k*3.0; segP(B.p(LS), [x - 2.4, 1.2, z], [x - 2.4, 12.6, z], 0.45, 8); latheP(B.p(LS), [[0.7, 0], [0.7, 0.5]], x - 2.4, 12.6, z, 6); }
      abox(B.p(LS), x - 3.3, x, 13.1, 14.6, zc - 9.6, zc + 9.6); abox(B.p(LS2), x - 3.3, x, 14.6, 15.2, zc - 9.6, zc + 9.6); }
    // the south-west porch block (x -14.3..-10.5, z 11.4..20.2)
    mansion(rectP(X(-14.3), X(-10.5), Z(11.4), Z(20.2)), 9.0);
    // the east part along 71st Street (x 29.9..35.1, z -36.6..-9.8)
    mansion(rectP(X(29.9), X(35.1), Z(-21.8), Z(-9.8)), 15.0);
    // ---- the Fifth Avenue garden: raised lawn, low balustrade on the street, magnolias, hedges
    { const x0 = X(-33.4), x1 = X(-10.5), z0 = Z(-21.8), z1 = Z(20.2);
      abox(B.p(PAVE), x0, x1, -2, 0.9, z0, z1); abox(B.p(LAWN), x0 + 2.0, x1 - 2.5, 0.9, 1.0, z0 + 2.0, z1 - 2.0);
      for (let z = z0 + 0.6; z < z1; z += 0.9) abox(B.p(LS), x0, x0 + 0.25, 0.9, 1.7, z - 0.1, z + 0.1);
      abox(B.p(LS), x0 - 0.1, x0 + 0.35, 1.7, 1.95, z0, z1);
      for (const [x, z] of [[-29, -16], [-29, -6], [-29, 4], [-29, 14], [-22, -16], [-22, 14], [-15.5, -17], [-15.5, 15]]) treeP(B, X(x), 1.0, Z(z), 1.2, MAG, TRUNK, LMCTX.rng);
      for (const z of [z0 + 1.0, z1 - 1.0]) abox(B.p(HEDGE), x0 + 2, x1 - 2.5, 1.0, 1.9, z - 0.5, z + 0.5); }
    // ---- the 70th Street garden (east of the house): street wall with railing, a rectangular reflecting pool, gravel, trees
    { const x0 = X(30.0), x1 = X(44.0), z0 = Z(0.0), z1 = Z(24.4);
      abox(B.p(PAVE), x0, x1, -2, 0.4, z0, z1);
      abox(B.p(LS), x0, x1, 0.4, 1.2, z1 - 0.5, z1); for (let x = x0 + 0.3; x < x1; x += 0.5) segP(B.p(ROOF), [x, 1.2, z1 - 0.25], [x, 2.6, z1 - 0.25], 0.03, 3);
      abox(B.p(LS), x1 - 0.5, x1, 0.4, 3.5, z0, z1); abox(B.p(LS), x0, x1, 0.4, 3.5, z0, z0 + 0.5);
      abox(B.p(LS2), X(33.0), X(41.0), 0.4, 0.75, Z(5.5), Z(18.5)); abox(B.p(WAT), X(33.4), X(40.6), 0.75, 0.8, Z(5.9), Z(18.1));
      for (const [x, z] of [[32.2, 2.5], [41.8, 2.5], [32.2, 21.5], [41.8, 21.5]]) treeP(B, X(x), 0.4, Z(z), 1.15, MAG, TRUNK, LMCTX.rng);
      abox(B.p(HEDGE), X(30.6), X(31.8), 0.4, 1.3, Z(5), Z(19)); abox(B.p(HEDGE), X(42.2), X(43.4), 0.4, 1.3, Z(5), Z(19)); }
    // the strip along 70th Street in front of the house: paving and a low wall with railing
    { const x0 = X(-14.3), x1 = X(30.0), z0 = Z(20.2), z1 = Z(24.4); abox(B.p(PAVE), x0, x1, -2, 0.35, z0, z1); abox(B.p(LS), x0, x1, 0.35, 1.0, z1 - 0.45, z1); }
    B.flush(g); return g;
  }};
placeAt('nyfrick', 40.77120, -73.96730, 0.8, -7.8, ROT);
// ---------------------------------------------------------------------------------------------------------------------------
// Park Avenue Armory (Seventh Regiment Armory, Charles W. Clinton, 1877-81): the whole block Park - Lexington Avenue, 66th -
// 67th Streets. The red-brick Gothic Revival administration building on Park Avenue - four storeys with granite trim, pointed
// windows, machicolated and crenellated parapets, the square corner towers and the central entrance tower over the arched
// portal; behind it the great Drill Hall (~ 61 x 88 m, one of the largest unobstructed interiors of its time): buttressed
// brick walls with arched windows and the broad segmental barrel roof on iron arch trusses, with a glazed monitor along the
// crown; the lower company-room block with corner turrets at the Lexington Avenue end. Floodlit at night.
// Frame: grid; origin = ref grid (48.8, 19.4); -x = Park Avenue (west), -z = 67th Street (north).
LANDMARKS.nyarmory = {zh:'公园大道军械库', en:'Park Avenue Armory', cat:'old', r:70, h:37,
  lt:{m:0, c:'#ffd6a6', k:0.55, e:0.5},
  build(){
    const g = new THREE.Group(), B = mkB(), OX = 48.8, OZ = 19.4;
    const X = x => x - OX, Z = z => z - OZ;
    const BR = {c:'#8f4f3c', m:0, lk:0.45}, GR = {c:'#a49d92', m:0, lk:0.55}, WIN = {c:'#2b2a2c', glow:'#ffd29a', gk:0.25}, ROOF = {c:'#4f5457', m:0, lk:0.2},
      SEAM = '#62676a', MON = {c:'#8ea3ad', glow:'#ffe9c8', gk:0.25}, DOOR = '#3f2f24', FLAT = '#6d6a66';
    // crenellated parapet round a polygon (merlons as boxes), machicolation band under it
    const crenSeg = (a, b, nn, y, mh, step) => { const L = Math.hypot(b[0]-a[0], b[1]-a[1]), n = Math.max(1, Math.round(L/step)), ry = Math.atan2(-(b[1]-a[1]), b[0]-a[0]);
      for (let k = 0; k < n; k++){ const t = (k + 0.5)/n; boxP(B.p(BR), step*0.5, mh, 0.7, a[0] + (b[0]-a[0])*t + nn[0]*0.15, y + 0.4, a[1] + (b[1]-a[1])*t + nn[1]*0.15, ry); } };
    const crenel = (P, y, mh, step) => {
      bandsP(B.p(GR), P, y - 1.3, y - 1.3, 1, 0.9, 0.45);                 // corbel / machicolation band
      prismP(B.p(BR), insetP(P, -0.35), y - 0.4, y + 0.4, false);
      let cx = 0, cz = 0; for (const p of P){ cx += p[0]; cz += p[1]; } cx /= P.length; cz /= P.length;
      for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; crenSeg(a, b, nrmOut(a, b, cx, cz), y, mh, step); }
    };
    const block = (P, h, fh, ww, wh, arch) => {
      prismP(B.p(BR), P, -4, h, true);
      prismP(B.p(GR), insetP(P, -0.15), -4, 2.4, false);                   // granite base
      bandsP(B.p(GR), P, 2.4, h - 3, fh, 0.35, 0.08);                      // granite sill courses
      winPoly(B.p(WIN), P, 3.2, h - 2.0, fh, 3.2, ww, wh, 0.4, arch);
    };
    // ---- the administration building on Park Avenue (x -10..22, z -11.4..50.1): 4 storeys, 21 m
    const AD = rectP(X(-10.0), X(22.0), Z(-11.4), Z(50.1));
    block(AD, 21, 4.6, 1.3, 2.9, true); crenel(AD, 21, 1.3, 1.6); capP(B.p(FLAT), AD, 21.05);
    // corner towers (square, 28 m) at 67th and 66th Streets
    for (const [z0, z1] of [[-11.4, -2.4], [41.4, 50.2]]){
      const T = rectP(X(-11.4), X(-1.4), Z(z0), Z(z1));
      block(T, 27.5, 4.6, 1.1, 2.9, true); crenel(T, 27.5, 1.4, 1.5); capP(B.p(FLAT), T, 27.55);
      for (const p of T) segP(B.p(GR), [p[0], 22, p[1]], [p[0], 29.6, p[1]], 0.5, 6); }
    // the central entrance tower (x -13.1..1, z 15.2..23.4) to 33 m with the arched portal
    { const T = rectP(X(-13.1), X(1.0), Z(15.2), Z(23.4)), zc = Z(19.3), xf = X(-13.1);
      block(T, 32.5, 4.6, 1.2, 3.0, true); crenel(T, 32.5, 1.5, 1.4); capP(B.p(FLAT), T, 32.55);
      archQ(B.p(DOOR), [xf, zc], 0, -1, [-1, 0], 0.1, 2.3, 4.2, 0, 10);
      archRing(B.p(GR), [xf, zc], 0, -1, [-1, 0], 0.05, 2.35, 0.7, 4.2, 0.4, 10);
      abox(B.p(GR), xf - 0.4, xf, 9.5, 10.2, zc - 3.8, zc + 3.8); }
    // ---- the drill hall (x 22..102, z -10.6..48.8): walls 15 m with buttresses and arched windows, the segmental vault
    const x0 = X(22.0), x1 = X(102.0), z0 = Z(-10.6), z1 = Z(48.8), zc = (z0 + z1)/2, hw = (z1 - z0)/2, ye = 15.0, yc = 33.2;
    for (const [zf, nz] of [[z0, -1], [z1, 1]]){
      abox(B.p(BR), x0, x1, -4, ye, Math.min(zf, zf - nz*0.6), Math.max(zf, zf - nz*0.6));
      abox(B.p(GR), x0, x1, -4, 2.2, Math.min(zf, zf + nz*0.2), Math.max(zf, zf + nz*0.2));
      for (let x = x0 + 4; x < x1 - 2; x += 8.9){
        abox(B.p(BR), x - 0.9, x + 0.9, -4, ye + 1.4, Math.min(zf, zf + nz*1.2), Math.max(zf, zf + nz*1.2));
        latheP(B.p(GR), [[0.75, 0], [0.75, 0.5], [0, 1.6]], x, ye + 1.4, zf + nz*0.6, 4, PI/4); }
      winSeg(B.p(WIN), [x0 + 4, zf], [x1 - 2, zf], [0, nz], 4.5, 13.5, 9, 8.9, 3.2, 7.5, 0.5, 0.08, true);
      abox(B.p(GR), x0, x1, ye - 1.3, ye - 0.4, Math.min(zf, zf + nz*0.45), Math.max(zf, zf + nz*0.45)); abox(B.p(BR), x0, x1, ye - 0.4, ye + 0.4, Math.min(zf - nz*0.6, zf + nz*0.35), Math.max(zf - nz*0.6, zf + nz*0.35));
      crenSeg([x0, zf], [x1, zf], [0, nz], ye, 1.1, 1.6);
    }
    // the vault: radius from span and rise, standing-seam ribs, the glazed monitor along the crown
    { const rise = yc - ye, R = (hw*hw + rise*rise)/(2*rise), yo = yc - R, n = 16, th = Math.asin(hw/R);
      const pt = (t, x, k) => [x, yo + Math.cos(t)*(R + (k || 0)), zc + Math.sin(t)*(R + (k || 0))];
      for (let i = 0; i < n; i++){ const t0 = -th + 2*th*i/n, t1 = -th + 2*th*(i+1)/n; if (Math.abs((t0 + t1)/2) < 2*th/n*0.6) continue;
        quadP(B.p(ROOF), pt(t0, x0), pt(t1, x0), pt(t1, x1), pt(t0, x1)); }
      // the crown strip carries the monitor
      { const t0 = -th + 2*th*Math.floor(n/2 - 0.5)/n, t1 = -t0; const ym = yo + R*Math.cos(t0);
        abox(B.p(ROOF), x0 + 2, x1 - 2, ym - 0.6, ym + 0.2, zc - 3.6, zc + 3.6);
        abox(B.p(MON), x0 + 3, x1 - 3, ym + 0.2, ym + 2.2, zc - 2.6, zc + 2.6);
        gableP(B.p(ROOF), (x0 + x1)/2, zc, x1 - x0 - 5, 6.6, ym + 2.2, 1.3, 0, 0.2);
        quadP(B.p(ROOF), pt(t0, x0), pt(t0, x1), [x1, ym - 0.6, zc - 3.6], [x0, ym - 0.6, zc - 3.6]); quadP(B.p(ROOF), pt(t1, x0), pt(t1, x1), [x1, ym - 0.6, zc + 3.6], [x0, ym - 0.6, zc + 3.6]); }
      for (let x = x0 + 4; x < x1 - 2; x += 8.9){ let prev = null; for (let i = 0; i <= n; i++){ const p = pt(-th + 2*th*i/n, x, 0.15); if (prev) segP(B.p(SEAM), prev, p, 0.18, 3); prev = p; } }
      // end walls of the vault (brick lunettes) above the administration building and the east block
      for (const xe of [x0, x1]) for (let i = 0; i < n; i++){ const t0 = -th + 2*th*i/n, t1 = -th + 2*th*(i+1)/n; triP(B.p(BR), [xe, ye, zc], pt(t0, xe), pt(t1, xe)); }
      for (const xe of [x0, x1]) triP(B.p(BR), [xe, ye, z0], [xe, ye, z1], [xe, ye, zc]);
      // a few small lunette windows in the end walls
      for (const xe of [x0 - 0.05, x1 + 0.05]) for (const dz of [-10, 0, 10]) archQ(B.p(WIN), [xe, zc + dz], 0, -1, [xe < 0 ? -1 : 1, 0], 0.04, 1.6, 22 - Math.abs(dz)*0.35, 18.5 - Math.abs(dz)*0.35, 8);
    }
    // ---- the Lexington Avenue block (x 102..110.8): 18 m, crenellated, corner turrets
    const LB = [[X(102.0), Z(-11.4)], [X(109.7), Z(-11.5)], [X(109.8), Z(11.9)], [X(110.7), Z(11.8)], [X(110.8), Z(26.9)], [X(109.9), Z(26.9)], [X(110.0), Z(50.0)], [X(102.2), Z(50.1)]];
    block(LB, 18, 4.2, 1.2, 2.6, true); crenel(LB, 18, 1.2, 1.5); capP(B.p(FLAT), LB, 18.05);
    for (const [x, z] of [[106, -11.4 + 2.5], [106, 50 - 2.5]]){ const c = circP(2.6, 8, 0, X(x), Z(z)); prismP(B.p(BR), c, -4, 22.5, true); crenel(c, 22.5, 1.1, 1.2); }
    { const T = rectP(X(102.0), X(110.8), Z(11.8), Z(26.9)); prismP(B.p(BR), T, 17, 23, true); crenel(T, 23, 1.2, 1.4);
      archQ(B.p(DOOR), [X(110.8), Z(19.35)], 0, 1, [1, 0], 0.1, 2.0, 3.8, 0, 10); }
    B.flush(g); return g;
  }};
placeAt('nyarmory', 40.76760, -73.96590, 48.8, 19.4, ROT);
// ---------------------------------------------------------------------------------------------------------------------------
// Franklin D. Roosevelt Four Freedoms Park (Louis I. Kahn, designed 1973-74, built 2010-12) at the south tip of Roosevelt Island,
// and the Renwick Smallpox Hospital ruin (James Renwick Jr., 1856) just north of it (secondary key nyfourfreedoms_b, label:false).
// Park: the forecourt with five copper beeches in a V, the 30 m wide grand staircase up to the plateau, the triangular lawn
// converging on the Room, flanked by granite-paved allees of littleleaf lindens (double rows), the plateau's sheer granite edge
// walls above the lower waterside promenades, the portrait niche (left plain - no figure, no inscription) and the Room: an
// open-air granite enclosure of massive blocks separated by narrow gaps, open to the south toward the water.
// Frame: the island axis (rot -0.643): local +z = down the lawn toward the south tip; origin = ref point (44.3, 45).
const FFR = -0.643;
const placeIsl = (key, alat, alon, gx, gz) => { const c = Math.cos(FFR), s = Math.sin(FFR), E = gx*c + gz*s, S = -gx*s + gz*c;
  SG_PLACES.push({type:key, lat:+(alat - S/111048).toFixed(7), lon:+(alon + E/84516).toFixed(7), rot:FFR}); };
LANDMARKS.nyfourfreedoms = {zh:'罗斯福四大自由公园', en:'Franklin D. Roosevelt Four Freedoms Park', cat:'new', r:135, h:9,
  lt:{m:0, c:'#fff2dc', k:0.55, e:0.8},
  build(){
    const g = new THREE.Group(), B = mkB(), OX = 44.3, OZ = 45.0, rng = LMCTX.rng;
    const X = x => x - OX, Z = z => z - OZ;
    const GRAN = {c:'#cfccc4', m:0, lk:0.55}, GRAN2 = {c:'#b8b5ae', m:0, lk:0.45}, LAWN = '#6f9a4e', GRAVEL = '#cbc3b0', LINDEN = '#6a8f45', BEECH = '#6a3a37',
      TRUNK = '#4f4136', DARK = '#3d3f42', LAMP = {c:'#e8e4d8', glow:'#fff1d6', gk:0.9};
    const YP = 3.6;                         // plateau / lawn level above the promenade
    // plateau outline: the trapezoid (north edge z -38 after the stairs) converging on the niche at z ~126
    const wx = z => 8.6 + 0.1914*(z + 51.8), ex = z => 79.9 - 0.1886*(z + 52.0);
    const zN = -38.0, zT = 76.5, zS = 124.5;
    const PL = [[X(wx(zN)), Z(zN)], [X(ex(zN)), Z(zN)], [X(ex(zT)), Z(zT)], [X(56.5), Z(zS)], [X(34.5), Z(zS)], [X(wx(zT)), Z(zT)]];
    // ---- the plateau body with sheer granite walls down to the waterside promenades
    prismP(B.p(GRAN), PL, -6, YP, false);
    bandsP(B.p(GRAN2), PL, YP - 0.5, YP - 0.5, 1, 0.5, 0.05);
    // the waterside promenades round the plateau (granite paving, a low edge)
    { const PR = insetP(PL, -5.0); prismP(B.p(GRAN2), PR, -6, 0.0, true); prismP(B.p(GRAN), PR, 0.0, 0.6, false); }
    // ---- the allees (granite paving) and the triangular lawn between them, its tip reaching into the plaza before the niche
    const AW = 8.6, lawnL = z => wx(z) + AW, lawnR = z => ex(z) - AW;
    capP(B.p(GRAN), PL, YP);
    { const Q = []; for (let k = 0; k <= 10; k++){ const z = zN + 2 + (zT - zN - 2)*k/10; Q.push([X(lawnL(z)), Z(z)]); }
      Q.push([X(44.45), Z(zT + 9)]);
      for (let k = 10; k >= 0; k--){ const z = zN + 2 + (zT - zN - 2)*k/10; Q.push([X(lawnR(z)), Z(z)]); }
      capP(B.p(LAWN), Q, YP + 0.06); }
    // linden rows: two rows in each allee, regular spacing (about 120 trees)
    for (const side of [-1, 1]) for (const d of [2.6, 6.4]){
      for (let z = zN + 3; z < zT - 1; z += 4.6){ const x = side < 0 ? wx(z) + d : ex(z) - d;
        segP(B.p(TRUNK), [X(x), YP, Z(z)], [X(x), YP + 2.6, Z(z)], 0.16, 4);
        latheP(B.p(LINDEN), [[0, 0], [1.7, 0.5], [2.0, 2.1], [1.6, 3.4], [0, 4.1]], X(x), YP + 2.2, Z(z), 6, rng()*PI); } }
    // the lampposts along the allee walks
    for (const side of [-1, 1]) for (let z = zN + 8; z < zT - 4; z += 18.6){ const x = side < 0 ? wx(z) + 4.5 : ex(z) - 4.5;
      segP(B.p(DARK), [X(x), YP, Z(z)], [X(x), YP + 3.6, Z(z)], 0.06, 4); latheP(B.p(LAMP), [[0.18, 0], [0.22, 0.35], [0, 0.5]], X(x), YP + 3.6, Z(z), 6); }
    // ---- the grand staircase (30 m wide) from the forecourt up to the plateau, with the flanking granite cheeks
    { const x0 = X(29.3), x1 = X(59.3), z0 = Z(-47.5), z1 = Z(zN), n = 24;
      for (let k = 0; k < n; k++){ const za = z0 + (z1 - z0)*k/n, zb = z0 + (z1 - z0)*(k+1)/n; abox(B.p(k % 2 ? GRAN : GRAN2), x0, x1, -4, YP*(k+1)/n, za, zb); }
      for (const [a, b] of [[X(wx(-47.5)), x0], [x1, X(ex(-47.5))]]) abox(B.p(GRAN), Math.min(a, b), Math.max(a, b), -4, YP + 0.05, z0, z1); }
    // ---- the forecourt north of the stairs: gravel and paving, five copper beeches in a V
    { const F = [[X(15.4), Z(-52.2)], [X(73.0), Z(-52.1)], [X(72.4), Z(-72.8)], [X(14.9), Z(-72.2)]];
      prismP(B.p(LAWN), rectP(X(10.0), X(78.0), Z(-82.0), Z(-50.0)), -2, 0.02, true); capP(B.p(GRAVEL), F, 0.05); abox(B.p(GRAN), X(8.6), X(79.9), -4, 0.08, Z(-52.0), Z(-47.5));
      for (const [x, z] of [[44.3, -55.5], [33, -61], [55.6, -61], [22, -66.5], [66.6, -66.5]]){
        segP(B.p(TRUNK), [X(x), 0, Z(z)], [X(x), 3.2, Z(z)], 0.35, 5);
        latheP(B.p(BEECH), [[0, 0], [4.2, 1.2], [5.2, 4.0], [4.4, 6.6], [2.2, 8.4], [0, 9.0]], X(x), 2.4, Z(z), 7, rng()*PI); } }
    // ---- the lawn's tip, the portrait niche and the Room
    // the narrowing granite forecourt between the allees' ends and the niche
    // the niche: a monolithic granite block with a plain recess (no figure, no inscription)
    { const xc = X(45.75), zc = Z(127.0);
      abox(B.p(GRAN), xc - 2.2, xc + 2.2, YP - 0.2, YP + 3.9, zc - 2.0, zc + 2.0);
      abox(B.p(GRAN2), xc - 1.3, xc + 1.3, YP + 0.9, YP + 3.3, zc - 2.06, zc - 1.95); }
    // the Room: floor slab, the east and west walls of separate granite blocks (narrow gaps), the north returns
    { const zr0 = Z(129.0), zr1 = Z(151.0), xa = X(35.0), xb = X(57.0);
      abox(B.p(GRAN2), xa - 1.0, xb + 1.0, -6, YP + 0.05, Z(zS), zr1 + 1.5);         // Room platform
      for (let x = xa + 2.0; x < xb - 2.0; x += 1.2) abox(B.p(GRAN), x, x + 1.12, YP + 0.05, YP + 0.08, zr0 + 2.5, zr1 - 0.5);   // floor joints
      const H = 3.66, bl = 3.66, gap = 0.08;
      for (const [x0, x1] of [[xa, xa + 2.0], [xb - 2.0, xb]]) for (let z = zr0; z < zr1 - 0.1; z += bl + gap) abox(B.p(GRAN), x0, x1, YP, YP + H, z, Math.min(zr1, z + bl));
      for (const [x0, x1] of [[xa, X(40.5)], [X(51.3), xb]]) abox(B.p(GRAN), x0, x1, YP, YP + H, zr0, zr0 + 2.0);
      // the open south end: a granite edge stepping down to the promenade
      for (let k = 0; k < 4; k++) abox(B.p(k % 2 ? GRAN2 : GRAN), xa - 1.0 - k*0.8, xb + 1.0 + k*0.8, -6, YP - k*0.9, zr1 + 1.5 + k*1.0, zr1 + 2.5 + k*1.0); }
    // the converging granite paths of the allees meet at the niche
    B.flush(g); return g;
  }};
placeIsl('nyfourfreedoms', 40.75100, -73.96080, 44.3, 45.0);

// ---- the Renwick Smallpox Hospital ruin: I-shaped plan, grey gneiss, three storeys of pointed-arch windows, battlemented
// parapets and gables, no roofs (a stabilised shell), the interior grassed; floodlit warm white at night.
LANDMARKS.nyfourfreedoms_b = {zh:'天花医院遗址', en:'Renwick Smallpox Hospital ruin', cat:'old', r:42, h:16, label:false,
  lt:{m:0, c:'#ffe8c8', k:0.85, e:0.7},
  build(){
    const g = new THREE.Group(), B = mkB(), OX = 44.6, OZ = -114.8, rng = LMCTX.rng;
    const X = x => x - OX, Z = z => z - OZ;
    const GN = {c:'#9b958a', m:0, lk:0.8}, GN2 = {c:'#857f75', m:0, lk:0.7}, HOLE = {c:'#2e2c2a', m:0, lk:0.15}, GRASS = '#62804a', RUST = '#6d5242', IVY = '#4f6a3a';
    const T = 0.9;       // wall thickness
    // wall slab from a to b ([x, z]), height h, with dark pointed-arch window openings on both faces
    const wallAB = (a, b, h, wins, ruin) => {
      const L = Math.hypot(b[0]-a[0], b[1]-a[1]), ex = (b[0]-a[0])/L, ez = (b[1]-a[1])/L, n = [ez, -ex], ry = Math.atan2(-ez, ex);
      // the wall in segments with irregular broken tops where ruined
      const ns = Math.max(1, Math.round(L/3.2));
      for (let i = 0; i < ns; i++){ const t0 = i/ns*L, t1 = (i+1)/ns*L, hh = ruin ? h - rng()*2.4 : h;
        boxP(B.p(GN), t1 - t0 + 0.02, hh + 4, T, a[0] + ex*(t0 + t1)/2, -4, a[1] + ez*(t0 + t1)/2, ry); }
      if (wins) for (const s of [1, -1]) winSeg(B.p(HOLE), s > 0 ? a : b, s > 0 ? b : a, [n[0]*s, n[1]*s], 0.6, h - 1.2, 3.3, 3.2, 1.3, 2.4, 0.5, T/2 + 0.04, true);
      // string course and (where intact) battlements
      boxP(B.p(GN2), L, 0.3, T + 0.3, (a[0] + b[0])/2, 3.6, (a[1] + b[1])/2, ry);
      if (!ruin){ const nm = Math.max(1, Math.round(L/1.4)); for (let k = 0; k < nm; k += 2) boxP(B.p(GN), L/nm, 0.9, T, a[0] + ex*(k + 0.5)*L/nm, h, a[1] + ez*(k + 0.5)*L/nm, ry); }
    };
    const rect = (x0, x1, z0, z1, h, ruinSides) => { const P = [[X(x0), Z(z0)], [X(x1), Z(z0)], [X(x1), Z(z1)], [X(x0), Z(z1)]];
      for (let i = 0; i < 4; i++) wallAB(P[i], P[(i+1) % 4], h, true, ruinSides && ruinSides.includes(i)); };
    // a grass apron round the ruin (the island lawn) and the grassed interior floor
    prismP(B.p(GRASS), [[X(20.5), Z(-82.5)], [X(68.5), Z(-82.5)], [X(68.5), Z(-147.0)], [X(20.5), Z(-147.0)]], -2, 0.0, true);
    capP(B.p(GRASS), [[X(27.7), Z(-89.5)], [X(61.3), Z(-89.5)], [X(61.5), Z(-140.1)], [X(28.6), Z(-140.1)]], 0.05);
    // the south bar (z -101.4..-89.5), the spine (x 34..48, z -129..-100.4), the north bar (z -140..-129)
    rect(27.8, 61.2, -101.4, -89.5, 10.6, [1]);
    rect(34.4, 48.0, -129.0, -101.4, 10.6, [0, 2]);
    rect(28.6, 61.4, -140.1, -129.0, 10.6, [3]);
    // gables over the centre of the west and east fronts, corner turret buttresses with pinnacles
    for (const [x, z0, z1] of [[27.8, -101.4, -89.5], [28.6, -140.1, -129.0], [61.2, -101.4, -89.5], [61.4, -140.1, -129.0]]){
      const zc = Z((z0 + z1)/2), xx = X(x), w = (z1 - z0)/2 - 1.2, o = B.p(GN);
      triP(o, [xx, 10.6, zc - w], [xx, 10.6, zc + w], [xx, 14.4, zc]); triP(o, [xx + (x < 40 ? 0.9 : -0.9), 10.6, zc - w], [xx + (x < 40 ? 0.9 : -0.9), 14.4, zc], [xx + (x < 40 ? 0.9 : -0.9), 10.6, zc + w]);
      archQ(B.p(HOLE), [xx, zc], 0, -1, [x < 40 ? -1 : 1, 0], 0.05, 0.9, 11.9, 10.8, 6);
      for (const zz of [Z(z0), Z(z1)]){ boxP(B.p(GN2), 1.6, 15.6, 1.6, xx, -4, zz); latheP(B.p(GN), [[0.6, 0], [0.6, 0.6], [0, 2.4]], xx, 11.6, zz, 4, PI/4); } }
    // the central entrance bay on the west side of the spine, a little ivy on the walls
    { const zc = Z(-114.8), xx = X(34.4); boxP(B.p(GN), 1.4, 16.0, 6.0, xx - 0.6, -4, zc); archQ(B.p(HOLE), [xx - 1.32, zc], 0, -1, [-1, 0], 0, 1.4, 4.0, 0, 8);
      triP(B.p(GN), [xx - 1.3, 12, zc - 3], [xx - 1.3, 12, zc + 3], [xx - 1.3, 14.6, zc]); }
    for (let k = 0; k < 14; k++){ const x = 28 + rng()*33, z = -139 + rng()*49; latheP(B.p(IVY), [[0, 0], [1.4, 0.6], [1.2, 2.2], [0, 3.0]], X(x), 0, Z(z), 5, rng()*PI); }
    // the steel stabilising frame (a few rusted braces inside the shell)
    for (const z of [-96, -134]) segP(B.p(RUST), [X(30), 8.5, Z(z)], [X(59), 8.5, Z(z)], 0.15, 4);
    B.flush(g); return g;
  }};
placeIsl('nyfourfreedoms_b', 40.75100, -73.96080, 44.6, -114.8);
}
