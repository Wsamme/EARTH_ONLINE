// ===== nyc/nycpark: Central Park structures and the museums on its edges (City Brush v33, New York 1:1)
// Belvedere Castle on Vista Rock, Bethesda Terrace and Fountain, Bow Bridge, Loeb Boathouse, the Central Park Zoo (the brick
// arcades round the sea lion pool, the Delacorte clock arch; secondary key nycpzoo_b, label:false), Wollman Rink, the Delacorte
// Theater, the Conservatory Garden (Vanderbilt Gate, fountains, wisteria pergola), the Neue Galerie and the New-York Historical
// Society. Inside the park the ground and the lakes are the map's: every model is fitted to the app's terrain (base = highest
// ground within r + 0.6 m) and the water levels from nycreal/out/terrain.pkl (the Lake 16.55 m, Turtle Pond 31.55 m), offsets
// computed offline (tools/terr.py) and noted per key. No people, no animal figures, no text, logos or signage on any model;
// the Bethesda angel is a plain generic winged figure.
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
// band round a polygon: the outer face, and ring caps (top and bottom) between the wall and the band - never over the roof
const bandP = (o, P, y, h, out) => { const Q = insetP(P, -out); prismP(o, Q, y, y + h, false);
  for (let i = 0; i < P.length; i++){ const j = (i + 1) % P.length;
    quadP(o, [P[i][0], y + h, P[i][1]], [Q[i][0], y + h, Q[i][1]], [Q[j][0], y + h, Q[j][1]], [P[j][0], y + h, P[j][1]]);
    quadP(o, [P[i][0], y, P[i][1]], [P[j][0], y, P[j][1]], [Q[j][0], y, Q[j][1]], [Q[i][0], y, Q[i][1]]); } };
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
// ---- nycpark additions
// flush a batch set shifted by (-cx, -cz): models are written in the ref "grid frame" round the anchor and placed at (cx, cz)
function cpFlushAt(B, g, cx, cz, dy){ dy = dy || 0; for (const o of B._all()) for (let i = 0; i < o.length; i += 3){ o[i] -= cx; o[i+1] += dy; o[i+2] -= cz; } B.flush(g); }
const cpBB = () => { const B = mkB(), L = []; const p0 = B.p; B.p = col => { const a = p0(col); if (!a.__seen){ a.__seen = 1; L.push(a); } return a; }; B._all = () => L; return B; };
// deterministic value noise (no rng state): hash of integer lattice, smooth
const cpHsh = (i, j) => { let h = (i*374761393 + j*668265263) | 0; h = (h ^ (h >>> 13))*1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0)/4294967296; };
function cpNoise(x, z){ const i = Math.floor(x), j = Math.floor(z), u = x - i, v = z - j, su = u*u*(3 - 2*u), sv = v*v*(3 - 2*v);
  return lerp(lerp(cpHsh(i, j), cpHsh(i+1, j), su), lerp(cpHsh(i, j+1), cpHsh(i+1, j+1), su), sv); }
const cpFbm = (x, z) => cpNoise(x, z)*0.6 + cpNoise(x*2.1 + 7, z*2.1 + 3)*0.3 + cpNoise(x*4.3 + 1, z*4.3 + 9)*0.1;
// signed distance to a polygon (positive inside)
function cpSdPoly(P, x, z){ let d = 1e9, ins = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[j], b = P[i];
    if (((a[1] > z) !== (b[1] > z)) && (x < (b[0] - a[0])*(z - a[1])/(b[1] - a[1]) + a[0])) ins = !ins;
    const ex = b[0]-a[0], ez = b[1]-a[1], t = Math.max(0, Math.min(1, ((x-a[0])*ex + (z-a[1])*ez)/(ex*ex + ez*ez || 1)));
    d = Math.min(d, Math.hypot(x - a[0] - ex*t, z - a[1] - ez*t)); }
  return ins ? d : -d; }
// height field into batches: hf(x, z) -> y or null (skip); cells x0..x1, z0..z1 step st; steep triangles -> colRock, flat -> colTop
function cpHfield(B, hf, x0, x1, z0, z1, st, colRock, colTop, steep, minY){
  const nx = Math.round((x1 - x0)/st), nz = Math.round((z1 - z0)/st), Hh = [];
  for (let j = 0; j <= nz; j++){ const r = []; for (let i = 0; i <= nx; i++) r.push(hf(x0 + i*st, z0 + j*st)); Hh.push(r); }
  const oR = B.p(colRock), oT = B.p(colTop);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++){
    const y = [Hh[j][i], Hh[j][i+1], Hh[j+1][i+1], Hh[j+1][i]]; if (y.some(v => v === null) || Math.max(...y) < minY) continue;
    const P = [[x0 + i*st, y[0], z0 + j*st], [x0 + (i+1)*st, y[1], z0 + j*st], [x0 + (i+1)*st, y[2], z0 + (j+1)*st], [x0 + i*st, y[3], z0 + (j+1)*st]];
    for (const [a, b, c] of [[0, 2, 1], [0, 3, 2]]){ const dy = Math.max(P[a][1], P[b][1], P[c][1]) - Math.min(P[a][1], P[b][1], P[c][1]);
      triP(dy/st > steep ? oR : oT, P[a], P[b], P[c]); } }
}
// crenellated parapet along a polyline (wall t thick from y0 to y1, merlons mh high every step)
function cpCrenel(o, pts, y0, y1, t, mh, step, closed){
  const n = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < n; i++){ const a = pts[i], b = pts[(i+1) % pts.length], L = Math.hypot(b[0]-a[0], b[1]-a[1]); if (L < 0.05) continue;
    const ry = Math.atan2(-(b[1]-a[1]), b[0]-a[0]), mx = (a[0]+b[0])/2, mz = (a[1]+b[1])/2;
    boxP(o, L + t, y1 - y0, t, mx, y0, mz, ry);
    if (mh > 0){ const k = Math.max(1, Math.floor(L/step)); for (let m = 0; m < k; m++){ const u = (m + 0.25)/k; boxP(o, step*0.5, mh, t, a[0] + (b[0]-a[0])*u + (b[0]-a[0])/L*step*0.25, y1, a[1] + (b[1]-a[1])*u + (b[1]-a[1])/L*step*0.25, ry); } } }
}
// place a key whose frame is rotated by rot (not the grid): (gx, gz) in that frame round the anchor
const cpPlaceR = (key, alat, alon, gx, gz, rot) => { const c = Math.cos(rot), s = Math.sin(rot), E = gx*c + gz*s, S = -gx*s + gz*c;
  SG_PLACES.push({type:key, lat:+(alat - S/111048).toFixed(7), lon:+(alon + E/84516).toFixed(7), rot}); };
// the app's terrain under a model (table from tools/gtab.py): gy(lx, lz) = ground height in model-local metres (relative to the
// app base), on the same triangles as the app's terrain mesh (70 m cells split along (i, j) -> (i+1, j+1)); min -0.3 - base
function cpGY(T){ const c = Math.cos(T.rot), s = Math.sin(T.rot), HALF = 28000, TS = 70, lo = -0.3 - T.base;
  return (lx, lz) => { const wx = T.x0 + lx*c + lz*s, wy = T.y0 + lx*s - lz*c, fx = (wx + HALF)/TS - T.i0, fy = (wy + HALF)/TS - T.j0;
    const i = Math.max(0, Math.min(T.n - 2, Math.floor(fx))), j = Math.max(0, Math.min(T.H.length - 2, Math.floor(fy))), u = fx - i, v = fy - j, R0 = T.H[j], R1 = T.H[j+1];
    const a = R0[i], b = R0[i+1], cc = R1[i+1], d = R1[i];
    return Math.max(lo, u >= v ? a + (b - a)*u + (cc - b)*v : a + (d - a)*v + (cc - d)*u); }; }
// ---------------------------------------------------------------------------------------------------------------------------
// Belvedere Castle (1867-1869, Calvert Vaux and Jacob Wrey Mould) on Vista Rock over Turtle Pond.
// The map's terrain here is flat at the pond level (local y ~ -0.6 with r 46), so Vista Rock itself is modelled: a schist
// outcrop rising ~9 m with a sheer face to the pond (north-east) and gentler slopes to the Ramble (south / west).
// Grid frame (ROT): +x along the cross streets (ESE), -z up the avenues (NNW); written round the ref anchor, placed at (8, -6).
// The castle: the schist west wing with the arched gate, the square main tower with crenellations and flagpole, the round
// corner turret with the conical cap, the terraces with crenellated parapets, two open half-timbered wooden pavilions.
LANDMARKS.nybelvedere = {zh:'眺望台城堡', en:'Belvedere Castle', cat:'old', r:46, h:28,
  lt:{m:0, c:'#ffe2b8', k:0.55, e:0.4},
  build(){
    const g = new THREE.Group(), B = cpBB(), CX = 8, CZ = -6, TOP = 8.6;
    const ROCK = '#6c675f', GRASS = '#5d7646', SCH = '#7b7468', GRN = '#a8a398', SLATE = '#3d4347', WOOD = '#8b6b4b', PAVE = '#9b958a', DARK = '#25272a', WOODL = '#c9b48f';
    // ---- Vista Rock: plateau polygon (top) and slope widths (steep to the pond on the north / east)
    const PL = [[-14, -20], [4, -21], [14, -12], [24, -9], [30, -5], [30, 6], [22, 9], [6, 6], [-8, 7], [-15, 2]];
    const rockH = (x, z) => {
      const s = cpSdPoly(PL, x, z), n = cpFbm(x*0.23, z*0.23);
      if (s >= 0) return TOP + (s > 3 ? (n - 0.5)*0.5 : 0) ;
      const north = (z < -8 || x > 26) ? 1 : 0, W = north ? 4.5 + n*2 : 11 + n*4, t = -s/W;
      if (t >= 1) return t > 1.6 ? null : -1.4;
      return -1.4 + (TOP + 1.4)*Math.pow(1 - t, north ? 0.55 : 1.4) + (n - 0.5)*2.2*(1 - t)*t*4;
    };
    cpHfield(B, rockH, -34, 46, -40, 30, 2, ROCK, GRASS, 0.9, -1);
    // paved terrace round the castle and along the walk to the pavilions
    const op = B.p(PAVE);
    capP(op, [[-12, -18], [3, -19], [12, -10], [28, -6], [28, 5.5], [10, 4.5], [-12, 5]], TOP + 0.3);
    // crenellated parapet on the cliff edge (pond side) and the south edge
    const os = B.p(SCH), og = B.p(GRN);
    cpCrenel(os, [[-14, -19.5], [3.6, -20.4], [13.6, -11.4], [24, -8.4], [29.4, -4.6], [29.4, 5.6]], TOP, TOP + 1.0, 0.6, 0.55, 1.3, false);
    cpCrenel(os, [[29.4, 5.6], [21.8, 8.4], [12, 6.2]], TOP, TOP + 1.0, 0.6, 0.55, 1.3, false);
    cpCrenel(os, [[-3, 6.3], [-8, 6.6], [-14.4, 2], [-14, -19.5]], TOP, TOP + 0.9, 0.6, 0, 1.3, false);
    // ---- the castle (OSM footprint: west wing x 12..20.7, z -6.2..-0.8; tower x 20.5..26, z -3.2..3.7; turret at 26.3, 2.9)
    const y0 = TOP;
    // foundations down into the rock
    prismP(os, rectP(11.6, 26.4, -6.6, 4.2), -2, y0, false);
    // west wing: two storeys of schist, granite quoins and string course, crenellated parapet
    prismP(os, rectP(12, 20.8, -6.2, -0.6), y0, y0 + 6.4, true);
    for (const [x, z] of [[12, -6.2], [20.8, -6.2], [12, -0.6]]) boxP(og, 0.7, 6.4, 0.7, x, y0, z);
    bandsP(og, rectP(12, 20.8, -6.2, -0.6), y0 + 3.2, y0 + 3.2, 1, 0.25, 0.12);
    cpCrenel(os, [[12, -6.2], [20.8, -6.2], [20.8, -0.6], [12, -0.6]], y0 + 6.4, y0 + 7.0, 0.55, 0.7, 1.4, true);
    // tower: square, 13 m, crenellated, granite trim
    prismP(os, rectP(20.4, 26.0, -3.4, 3.7), y0, y0 + 12.4, true);
    for (const [x, z] of [[20.4, -3.4], [26, -3.4], [20.4, 3.7]]) boxP(og, 0.8, 12.4, 0.8, x, y0, z);
    bandsP(og, rectP(20.4, 26.0, -3.4, 3.7), y0 + 6.6, y0 + 6.6, 1, 0.3, 0.14);
    prismP(og, insetP(rectP(20.4, 26.0, -3.4, 3.7), -0.35), y0 + 12.0, y0 + 12.5, true, true);   // corbelled cornice
    cpCrenel(os, [[20.1, -3.7], [26.3, -3.7], [26.3, 4.0], [20.1, 4.0]], y0 + 12.5, y0 + 13.4, 0.6, 0.8, 1.3, true);
    // corbels under the tower parapet, arrow slits on the turret, corner pinnacles on the west wing
    for (const [a1, b1] of [[[20.1, -3.7], [26.3, -3.7]], [[26.3, -3.7], [26.3, 4.0]], [[26.3, 4.0], [20.1, 4.0]], [[20.1, 4.0], [20.1, -3.7]]]){
      const L = Math.hypot(b1[0]-a1[0], b1[1]-a1[1]), n = Math.round(L/0.9), ry = Math.atan2(-(b1[1]-a1[1]), b1[0]-a1[0]);
      for (let k = 0; k <= n; k++){ const t = k/n; boxP(og, 0.35, 0.6, 0.45, a1[0] + (b1[0]-a1[0])*t, y0 + 11.9, a1[1] + (b1[1]-a1[1])*t, ry); } }
    for (let k = 0; k < 6; k++){ const a2 = k/6*TAU + 0.3; boxP(B.p(DARK), 0.14, 1.1, 0.14, 26.3 + Math.cos(a2)*1.47, y0 + 3 + (k % 2)*4, 3.0 + Math.sin(a2)*1.47); }
    for (const [x, z] of [[12, -6.2], [12, -0.6]]){ boxP(os, 0.9, 1.6, 0.9, x, y0 + 6.4, z); latheP(og, [[0.4, 0], [0, 0.9]], x, y0 + 8.0, z, 4, PI/4); }
    // small lookout roof on the tower (the restored top with the flag and the weather instruments)
    hipP(B.p(SLATE), 23.2, 0.15, 3.2, 3.2, y0 + 12.5, 2.2, 0, 0.1);
    segP(B.p(GRN), [23.2, y0 + 14.6, 0.15], [23.2, y0 + 20.5, 0.15], 0.07, 4);
    boxP(B.p('#d9d6cf'), 1.6, 1.0, 0.05, 24.05, y0 + 19.3, 0.15);
    // round corner turret with the conical cap
    latheP(os, [[1.45, -2], [1.45, y0 + 13.6], [1.75, y0 + 13.9], [1.75, y0 + 14.6]], 26.3, 0, 3.0, 10);
    latheP(B.p(SLATE), [[1.85, y0 + 14.6], [0.02, y0 + 18.4]], 26.3, 0, 3.0, 10);
    segP(B.p(GRN), [26.3, y0 + 18.3, 3.0], [26.3, y0 + 19.6, 3.0], 0.05, 4);
    // windows: pointed arched openings (dark), arrow slits on the tower, the arched gate of the west wing
    const od = B.p(DARK);
    winSeg(od, [12.4, -6.2], [20.4, -6.2], [0, -1], y0 + 0.9, y0 + 6, 3.2, 2.7, 1.0, 1.6, 0.4, 0.07, true);
    winSeg(od, [20.4, -0.6], [12.4, -0.6], [0, 1], y0 + 3.4, y0 + 6, 3.2, 2.7, 1.0, 1.4, 0.4, 0.07, true);
    archQ(od, [16.4, -0.6], 1, 0, [0, 1], 0.07, 1.2, y0 + 2.0, y0, 8);
    archRing(B.p(GRN), [16.4, -0.6], 1, 0, [0, 1], 0.0, 1.2, 0.35, y0 + 2.0, 0.25, 8);
    winSeg(od, [20.7, -3.4], [25.7, -3.4], [0, -1], y0 + 1.2, y0 + 12, 3.4, 2.5, 0.9, 1.9, 0.6, 0.07, true);
    winSeg(od, [26, -3.1], [26, 1.6], [1, 0], y0 + 1.2, y0 + 12, 3.4, 2.4, 0.9, 1.9, 0.6, 0.07, true);
    winSeg(od, [25.7, 3.7], [20.7, 3.7], [0, 1], y0 + 4.6, y0 + 12, 3.4, 2.5, 0.9, 1.9, 0.6, 0.07, true);
    archQ(od, [23.2, 3.7], 1, 0, [0, 1], 0.07, 0.9, y0 + 1.9, y0, 8);
    // ---- open wooden pavilions (half-timbered, slate hipped roofs): SW one 5.5 x 4.6, north one 3 x 6.4 on the stone bastion
    const ow = B.p(WOOD), owl = B.p(WOODL), osl = B.p(SLATE);
    const pav = (x0, x1, z0, z1, hp) => {
      for (const [x, z] of [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]) boxP(ow, 0.35, hp, 0.35, x, y0, z);
      for (const [a, b] of [[[x0, z0], [x1, z0]], [[x1, z0], [x1, z1]], [[x1, z1], [x0, z1]], [[x0, z1], [x0, z0]]]){
        const L = Math.hypot(b[0]-a[0], b[1]-a[1]), ry = Math.atan2(-(b[1]-a[1]), b[0]-a[0]);
        boxP(ow, L, 0.45, 0.3, (a[0]+b[0])/2, y0 + hp - 0.45, (a[1]+b[1])/2, ry);              // plate
        boxP(owl, L, 0.9, 0.18, (a[0]+b[0])/2, y0 + 0.05, (a[1]+b[1])/2, ry);                   // low rail panel
        const ex = (b[0]-a[0])/L, ez = (b[1]-a[1])/L;
        for (const s of [0, 1]){ const p = s ? b : a, d = s ? -1 : 1;                           // knee braces
          segP(ow, [p[0] + ex*d*0.2, y0 + hp - 1.4, p[1] + ez*d*0.2], [p[0] + ex*d*1.2, y0 + hp - 0.45, p[1] + ez*d*1.2], 0.08, 4); } }
      hipP(osl, (x0 + x1)/2, (z0 + z1)/2, Math.abs(x1 - x0), Math.abs(z1 - z0), y0 + hp, Math.min(Math.abs(x1-x0), Math.abs(z1-z0))*0.75, 0, 0.5);
      segP(ow, [(x0 + x1)/2, y0 + hp + Math.min(Math.abs(x1-x0), Math.abs(z1-z0))*0.75, (z0 + z1)/2], [(x0 + x1)/2, y0 + hp + Math.min(Math.abs(x1-x0), Math.abs(z1-z0))*0.75 + 1.0, (z0 + z1)/2], 0.06, 4);
    };
    pav(-10.4, -5.2, -0.8, 3.6, 3.6);
    // north bastion (stone loggia base) with the second pavilion at its west end
    prismP(os, rectP(-7.9, 2.9, -18.4, -12.3), -1.5, y0 + 1.0, true);
    cpCrenel(os, [[-7.9, -18.4], [2.9, -18.4], [2.9, -12.3]], y0 + 1.0, y0 + 2.0, 0.5, 0.5, 1.3, false);
    pav(-7.7, -4.9, -18.2, -12.4, 3.3);
    // stone stairs up from the south-west walk (Ramble side) and the south path
    const ost = B.p(GRN);
    for (let i = 0; i < 14; i++){ const t = i/14; boxP(ost, 2.6, 0.62, 1.0, 4 + 0*t, -1.2 + t*(TOP + 1.2), 6.5 + (1 - t)*12, 0); }
    for (let i = 0; i < 12; i++){ const t = i/12; boxP(ost, 1.0, 0.8, 2.4, -14.5 - (1 - t)*11, -1.2 + t*(TOP + 1.2), -8, 0); }
    // a few trees on the rock (The Ramble edge)
    const r = LMCTX.rng;
    for (const [x, z] of [[-20, -6], [-18, 10], [-4, 13], [8, 13], [34, 12], [-24, 4], [-10, 14], [18, 14]]){ const y = rockH(x, z); if (y !== null) treeP(B, x, Math.max(-0.6, y) - 0.2, z, 1.6 + r()*0.5, '#4f6e3c', '#4d3f33', r); }
    cpFlushAt(B, g, CX, CZ);
    return g;
  }};
placeAt('nybelvedere', 40.7794, -73.9691, 8, -6, ROT);
// ---------------------------------------------------------------------------------------------------------------------------
// Bethesda Terrace and Fountain (1859-1873, Vaux and Mould). Frame: local +x along Terrace Drive (rot -0.28, 16 deg south of
// east), -z toward the Lake. Written round the ref anchor, placed at (-9, -14), r 52 -> app base 18.28 m; the map's ground here is
// 16.24 m (local -2.04), the Lake 16.50 m (local -1.78). The lower terrace (esplanade, brick paving) sits at 16.80 m (-1.48);
// the upper terrace at +3.5 (the real drop is ~7 m; the map's smoothed ground rises only ~2 m to the drive, so the upper level
// stands as a terrace beside the drive with short flights down to its north walk).
// Kept north of the drive and its north walk (z < 27 here) so the app never hides Terrace Drive.
// The fountain: the 28 m basin, the lower pedestal, the upper basin with the falling water, and a plain winged figure on top.
LANDMARKS.nybethesda = {zh:'毕士达露台与喷泉', en:'Bethesda Terrace and Fountain', cat:'old', r:52, h:14,
  lt:{m:0, c:'#ffdcae', k:0.6, e:0.6},
  build(){
    const g = new THREE.Group(), B = cpBB(), CX = -9, CZ = -14;
    const PLZ = -1.48, UP = 3.5, GND = -2.3;
    const SAND = '#a8936b', SANDL = '#bba783', GRAN = '#8f8b84', BRICK = '#a48c72', DARK = '#2b2a28', GRASS = '#5a7645',
      BRZ = {c:'#5f7f6c'}, WATER = {c:'#4f7f96', op:0.85}, FALL = {c:'#dfeef2', op:0.55, ds:true}, TILE = '#b98b5a';
    const os = B.p(SAND), osl = B.p(SANDL), og = B.p(GRAN), ob = B.p(BRICK), od = B.p(DARK);
    // balustrade: rail + base + balusters (low-poly posts) along a polyline at height y
    const bal = (pts, y, h, step) => {
      h = h || 1.0; step = step || 0.45;
      for (let i = 0; i < pts.length - 1; i++){ const a = pts[i], b = pts[i+1], L = Math.hypot(b[0]-a[0], b[1]-a[1]), ry = Math.atan2(-(b[1]-a[1]), b[0]-a[0]);
        const mx = (a[0]+b[0])/2, mz = (a[1]+b[1])/2;
        boxP(os, L + 0.4, 0.22, 0.55, mx, y, mz, ry); boxP(osl, L + 0.5, 0.16, 0.62, mx, y + h - 0.16, mz, ry);
        const n = Math.max(1, Math.round(L/step)); for (let k = 0; k < n; k++){ const t = (k + 0.5)/n; boxP(os, 0.16, h - 0.38, 0.16, a[0] + (b[0]-a[0])*t, y + 0.22, a[1] + (b[1]-a[1])*t, ry); }
        const np = Math.max(1, Math.round(L/6)); for (let k = 0; k <= np; k++){ const t = k/np; boxP(osl, 0.6, h + 0.12, 0.7, a[0] + (b[0]-a[0])*t, y, a[1] + (b[1]-a[1])*t, ry); } }
    };
    // ---- lower terrace (esplanade): brick paving from the arcade (z -2) to the Lake (z -57), planting beds east and west
    const PLAZA = [[-44, -2], [26, -2], [26, -40], [17, -53], [4, -57.5], [-23, -57.5], [-36, -53], [-44, -40]];
    prismP(ob, PLAZA, GND - 0.4, PLZ, true);
    // the curved lake edge: a stone wall down into the water, balustrade with a central opening to the boat landing
    prismP(og, [[-36, -53], [-23, -57.5], [4, -57.5], [17, -53], [17.6, -54], [4.2, -58.6], [-23.2, -58.6], [-36.6, -54]], -4.5, PLZ + 0.15, true);
    bal([[-36, -53.6], [-23, -58.0], [-14.5, -58.0]], PLZ, 0.95); bal([[-4.5, -58.0], [4, -58.0], [17, -53.6]], PLZ, 0.95);
    for (let i = 0; i < 5; i++) boxP(og, 10, 0.3, 0.6, -9.5, PLZ - 0.3*(i + 1), -58.6 - i*0.6);               // landing steps to the water
    bal([[17, -53.6], [26, -40], [26, -26]], PLZ, 0.95); bal([[-36, -53.6], [-44, -40], [-44, -26]], PLZ, 0.95);
    // planting beds with low stone curbs on both sides of the plaza
    for (const [x0, x1] of [[-43, -31], [13.5, 25]]){ prismP(og, rectP(x0, x1, -44, -8), PLZ, PLZ + 0.45, false); capP(B.p(GRASS), rectP(x0 + 0.3, x1 - 0.3, -43.7, -8.3), PLZ + 0.4); }
    // ---- the fountain (centre -9.5, -31): basin 28 m, rim, water, pedestal, upper basin, falling water, the winged figure
    const FX = -9.5, FZ = -31;
    latheP(og, [[14.2, PLZ], [14.2, PLZ + 0.55], [13.5, PLZ + 0.62], [13.5, PLZ + 0.2]], FX, 0, FZ, 40);
    capP(B.p(WATER), circP(13.6, 40, 0, FX, FZ), PLZ + 0.35);
    latheP(os, [[3.4, PLZ + 0.2], [3.4, PLZ + 1.1], [2.9, PLZ + 1.3], [2.2, PLZ + 1.6], [1.3, PLZ + 2.0], [1.0, PLZ + 3.6], [1.3, PLZ + 3.9]], FX, 0, FZ, 16);
    latheP(osl, [[1.3, PLZ + 3.9], [3.6, PLZ + 4.3], [3.8, PLZ + 4.65], [3.3, PLZ + 4.7], [0.9, PLZ + 4.5]], FX, 0, FZ, 20);   // upper basin
    latheP(os, [[0.9, PLZ + 4.5], [0.75, PLZ + 5.4], [1.05, PLZ + 5.7], [0.95, PLZ + 6.2], [0.6, PLZ + 6.35], [0, PLZ + 6.4]], FX, 0, FZ, 12);
    latheP(B.p(FALL), [[3.8, PLZ + 4.6], [4.05, PLZ + 3.2], [4.3, PLZ + 1.5], [4.5, PLZ + 0.35]], FX, 0, FZ, 24);
    // the plain winged figure (bronze): robe, torso, head, raised arm, two spread wings
    const ob2 = B.p(BRZ), FY = PLZ + 6.35;
    latheP(ob2, [[0.5, 0], [0.42, 0.8], [0.3, 1.45], [0.24, 1.75], [0.12, 1.92], [0.16, 2.02], [0.15, 2.2], [0, 2.32]], FX, FY, FZ, 8);
    segP(ob2, [FX + 0.22, FY + 1.65, FZ], [FX + 0.55, FY + 2.35, FZ - 0.1], 0.07, 4);
    segP(ob2, [FX - 0.22, FY + 1.6, FZ], [FX - 0.45, FY + 1.15, FZ - 0.3], 0.07, 4);
    for (const sx of [-1, 1]){
      const r0 = [FX + sx*0.12, FY + 1.75, FZ + 0.2], tip = [FX + sx*1.25, FY + 2.75, FZ + 0.55], lo = [FX + sx*0.95, FY + 0.95, FZ + 0.5], mid = [FX + sx*1.4, FY + 1.85, FZ + 0.6];
      triP(ob2, r0, tip, mid); triP(ob2, r0, mid, lo); }
    // ---- the arcade block between the staircases (x -25.6 .. 0.4) with its north face at z -2
    const AX0 = -25.6, AX1 = 0.4;
    prismP(os, rectP(AX0, AX1, -2, 20.4), GND, UP - 0.1, false);
    capP(ob, rectP(AX0, AX1, -2, 20.4), UP);
    bandP(osl, rectP(AX0, AX1, -2, 20.4), UP - 0.9, 0.35, 0.25);
    // three arched openings with the tiled ceiling glimpsed inside, rusticated piers
    for (let i = 0; i < 3; i++){ const cx = AX0 + (AX1 - AX0)*(i + 0.5)/3;
      archQ(od, [cx, -2], 1, 0, [0, -1], 0.06, 2.6, PLZ + 2.9, PLZ, 10);
      archRing(osl, [cx, -2], 1, 0, [0, -1], 0, 2.6, 0.45, PLZ + 2.9, 0.3, 10);
      capP(B.p(TILE), rectP(cx - 2.4, cx + 2.4, -1.95, 3), PLZ + 4.2); }
    for (let i = 0; i <= 3; i++){ const px = AX0 + (AX1 - AX0)*i/3; boxP(osl, 1.1, PLZ + 5.0 - PLZ, 0.5, px, PLZ, -2.2); }
    bal([[AX0, -2.3], [AX1, -2.3]], UP, 1.05);
    // ---- the grand staircases (x -30.5 and +5): upper level -> landing -> plaza, flanked by balustraded walls
    for (const sx of [-30.5, 5.0]){
      const w = 8.6, x0 = sx - w/2, x1 = sx + w/2, nS = 16, rs = (UP - PLZ)/2/nS;
      // flight 1 (top, z 20.4 -> 14), landing (14 -> 10), flight 2 (10 -> 3.6), then the paved foot (3.6 -> -2)
      for (let k = 0; k < nS; k++){ boxP(og, w, UP - rs*(k + 1) - GND, 0.4, sx, GND, 20.4 - 0.4*k - 0.2); }
      prismP(og, rectP(x0, x1, 10.0, 14.0), GND, PLZ + (UP - PLZ)/2, true);
      for (let k = 0; k < nS; k++){ boxP(og, w, PLZ + (UP - PLZ)/2 - rs*(k + 1) - GND, 0.4, sx, GND, 10.0 - 0.4*k - 0.2); }
      capP(ob, rectP(x0, x1, -2, 3.6), PLZ + 0.02);
      for (const ex of [x0 - 0.5, x1 + 0.5]){
        prismP(os, rectP(ex - 0.5, ex + 0.5, -2, 20.4), GND, PLZ + 0.6, true);
        const pts = [[ex, 20.4], [ex, 14.0], [ex, 10.0], [ex, 3.6]];
        bal([pts[0], pts[1]], UP - 0.2, 1.0); bal([pts[1], pts[2]], PLZ + (UP - PLZ)/2 - 0.1, 1.0); bal([pts[2], pts[3]], PLZ + (UP - PLZ)/2 - 0.1, 1.0);
        boxP(os, 1.0, PLZ + (UP - PLZ)/2 - GND, 6.4, ex, GND, 6.8);
        boxP(os, 1.0, UP - GND, 6.4, ex, GND, 17.2);
        boxP(osl, 1.3, 1.6, 1.3, ex, PLZ, 3.2); latheP(osl, [[0.45, 0], [0.6, 0.4], [0.3, 0.9], [0, 1.0]], ex, PLZ + 1.6, 3.2, 8);   // newel posts with finials
      }
    }
    // ---- upper terrace wings beside the staircases (outer walls), the north balustrade, the walk down to the drive level
    for (const [x0, x1] of [[-44, -35.3], [9.8, 18]]){ prismP(os, rectP(x0, x1, -2, 20.4), GND, UP - 0.1, false); capP(ob, rectP(x0, x1, -2, 20.4), UP); bal([[x0, -2.3], [x1, -2.3]], UP, 1.05); }
    // south edge: low parapet with gaps over the stair heads, short flights down to the walk beside the drive (z 22 -> 26)
    for (const [x0, x1] of [[-44, -35.3], [AX0, AX1], [9.8, 18]]) bal([[x0, 20.2], [x1, 20.2]], UP, 0.9);
    // (the walk beside the drive and the Mall paths stay the map's: nothing south of z 22.4, so the app keeps them)
    // lamps on the plaza (dark iron posts with warm lanterns)
    const lampC = {c:'#f3dfb0', glow:'#ffd690', gk:1.2}, ol = B.p('#2e3230'), oL = B.p(lampC);
    for (const [x, z] of [[-24, -10], [5, -10], [-30, -48], [11, -48], [-44, -2.6], [18, -2.6]]){ segP(ol, [x, PLZ, z], [x, PLZ + 3.6, z], 0.08, 5); boxP(oL, 0.4, 0.6, 0.4, x, PLZ + 3.6, z); }
    cpFlushAt(B, g, CX, CZ);
    return g;
  }};
cpPlaceR('nybethesda', 40.7740, -73.9708, -9, -14, -0.28);
// ---------------------------------------------------------------------------------------------------------------------------
// Bow Bridge (1862, Vaux and Mould): the shallow cast-iron arch over the Lake, 87 ft (26.5 m) span between granite abutments,
// the 142 ft (43 m) balustrade of interlocking circles, eight planting urns on panelled pedestals, the scrolled spandrels.
// Local +x along the OSM way "Bow Bridge" (north end -> south-east end, 44.5 m), rot -1.024; centred on its midpoint.
// The app draws the path deck itself: this model is fitted to the corrected deck profile in decks.json / nycpark_deck_fix.py
// (E = 1.0 + 2.6 (1 - u^2) m above the ground 16.24 m; base 16.84 -> local deck = E - 0.6); the Lake surface is local -0.34.
LANDMARKS.nybowbridge = {zh:'弓桥', en:'Bow Bridge', cat:'old', r:26, h:6,
  lt:{m:0, c:'#fff0d8', k:0.45, e:0.7},
  build(){
    const g = new THREE.Group(), B = cpBB(), L = 44.47, HL = L/2, SP = 13.25, W = 2.3;
    const IRON = '#e6dfcd', IRD = '#cfc6b0', WOODD = '#7c5f45', GRAN = '#8e8a82', PLANT = '#567a3e';
    const deck = x => { const u = Math.max(-1, Math.min(1, x/HL)); return 1.0 + 2.6*(1 - u*u) - 0.6; };
    const oi = B.p(IRON), oid = B.p(IRD), ow = B.p(WOODD), ogr = B.p(GRAN), op = B.p(PLANT);
    // half width along the bridge: the railings flare out at both ends (the "bow" in plan)
    const hw = x => { const a = Math.abs(x); return a < HL - 5 ? W : W + Math.pow((a - (HL - 5))/5, 2)*1.6; };
    // deck planking (slightly under the app's own path deck), and the deck edge fascia
    const N = 44;
    for (let i = 0; i < N; i++){ const x0 = -HL + L*i/N, x1 = -HL + L*(i+1)/N, y0 = deck(x0) - 0.06, y1 = deck(x1) - 0.06;
      quadP(ow, [x0, y0, -hw(x0)], [x1, y1, -hw(x1)], [x1, y1, hw(x1)], [x0, y0, hw(x0)]);
      for (const s of [-1, 1]){ quadP(oi, [x0, y0, s*hw(x0)], [x1, y1, s*hw(x1)], [x1, y1 - 0.45, s*hw(x1)], [x0, y0 - 0.45, s*hw(x0)]); } }
    // the arch ribs (three: both fascias and the middle) and the scrolled spandrels between rib and deck
    const archY = x => { const u = x/SP; return -0.1 + (deck(0) - 0.55 + 0.1)*(1 - u*u); };
    for (const z of [-W + 0.15, 0, W - 0.15]){
      const n = 24; let prev = null;
      for (let i = 0; i <= n; i++){ const x = -SP + 2*SP*i/n, p = [x, archY(x), z]; if (prev) segP(z === 0 ? oid : oi, prev, p, 0.17, 4); prev = p; }
    }
    for (const s of [-1, 1]){ const z = s*(W - 0.12);
      // spandrel: verticals and circles (the arabesque openwork) between the arch and the deck girder
      for (let x = -SP + 1.0; x <= SP - 1.0; x += 1.1){ const y0 = archY(x), y1 = deck(x) - 0.45; if (y1 - y0 < 0.25) continue;
        segP(oi, [x, y0, z], [x, y1, z], 0.05, 4);
        const r = Math.min(0.42, (y1 - y0)/2 - 0.02), cy = (y0 + y1)/2; if (r > 0.12){ let pv = null; for (let k = 0; k <= 8; k++){ const t = k/8*TAU, p = [x + 0.55 + Math.cos(t)*r, cy + Math.sin(t)*r, z]; if (pv) segP(oi, pv, p, 0.035, 3); pv = p; } } }
      // bottom chord flourishes: small volutes near the springings
      for (const sx of [-1, 1]){ let pv = null; for (let k = 0; k <= 10; k++){ const t = k/10*TAU*1.25, r = 0.55 - k*0.035, p = [sx*(SP - 1.3) + Math.cos(t)*r*sx, 0.9 + Math.sin(t)*r, z]; if (pv) segP(oi, pv, p, 0.04, 3); pv = p; } }
    }
    // cross bracing under the deck
    for (let x = -SP + 1.5; x <= SP - 1.5; x += 3){ segP(oid, [x, archY(x), -W + 0.2], [x, archY(x), W - 0.2], 0.06, 4); }
    // granite abutments under both ends (from the springing to the bridge ends), wing walls, footings into the lake bed
    for (const sx of [-1, 1]){
      const xa = sx*SP, xb = sx*(HL + 0.6), y = (x) => deck(x) - 0.5;
      const xs = [xa - sx*0.6, xa + sx*2, xa + sx*4.5, xa + sx*6.8, xb];
      for (let i = 0; i < xs.length - 1; i++){ const x0 = xs[i], x1 = xs[i+1], w0 = hw(x0) + 0.3, w1 = hw(x1) + 0.3;
        const P = [[x0, -w0], [x1, -w1], [x1, w1], [x0, w0]];
        prismP(ogr, P, -1.6, Math.min(y(x0), y(x1)), true); }
    }
    // the balustrade: posts, top and bottom rails, the chain of interlocking circles; the eight urns on panelled pedestals
    const RH = 1.05;
    for (const s of [-1, 1]){
      const n = 88; let pT = null, pB = null;
      for (let i = 0; i <= n; i++){ const x = -HL + L*i/n, z = s*hw(x), y = deck(x);
        const t = [x, y + RH, z], b = [x, y + 0.12, z];
        if (pT){ segP(oi, pT, t, 0.06, 4); segP(oi, pB, b, 0.045, 4); }
        pT = t; pB = b;
        if (i % 4 === 0) segP(oi, [x, y - 0.05, z], [x, y + RH, z], 0.05, 4);
        if (i < n){ const xc = x + L/n/2, yc = deck(xc) + 0.6, zc = s*hw(xc); let pv = null;      // interlocking circles (r 0.36, step 0.5)
          for (let k = 0; k <= 8; k++){ const a = k/8*TAU, p = [xc + Math.cos(a)*0.36, yc + Math.sin(a)*0.36, zc]; if (pv) segP(oi, pv, p, 0.025, 3); pv = p; } }
      }
      for (const x of [-15.5, -5.2, 5.2, 15.5]){ const y = deck(x), z = s*hw(x);
        boxP(oid, 1.0, RH + 0.15, 0.55, x, y, z);
        latheP(oi, [[0.2, 0], [0.32, 0.12], [0.18, 0.3], [0.42, 0.55], [0.5, 0.78], [0.44, 0.86]], x, y + RH + 0.15, z, 10);
        latheP(op, [[0.4, 0], [0.48, 0.25], [0.3, 0.55], [0, 0.65]], x, y + RH + 0.98, z, 7); }
    }
    // end posts / newels at the four corners
    for (const sx of [-1, 1]) for (const s of [-1, 1]){ const x = sx*(HL - 0.3), y = deck(x), z = s*hw(x);
      boxP(oid, 0.6, RH + 0.3, 0.6, x, y - 0.1, z); latheP(oi, [[0.3, 0], [0.25, 0.2], [0, 0.45]], x, y + RH + 0.2, z, 8); }
    cpFlushAt(B, g, 0, 0);
    return g;
  }};
SG_PLACES.push({type:'nybowbridge', lat:40.7757594, lon:-73.9717704, rot:-1.024});
// ---------------------------------------------------------------------------------------------------------------------------
// Loeb Boathouse (1954, red brick and limestone, the copper roofs with the green patina) on the east shore of the Lake: the long restaurant hall with the glazed lakeside
// front and its awning, the lower south wing, the east service annex, the floating rowboat dock with the rowboats (no text).
// Frame: local +x along the north wall (rot 0.22, 12.6 deg north of east), +z south; written round the ref anchor, placed at
// (14, -11), r 40 -> app base 16.73 m; ground ~15.5 m (local -1.2), the Lake surface 16.50 m (local -0.23).
LANDMARKS.nyloeb = {zh:'洛布船屋', en:'Loeb Boathouse', cat:'old', r:40, h:10,
  lt:{m:0, c:'#ffdcae', k:0.4},
  build(){
    const g = new THREE.Group(), B = cpBB(), CX = 14, CZ = -11, FL = 0.45, WL = -0.23;
    const BRICK = '#8f4f3e', LIME = '#d6cdb8', ROOF = '#6b9a85', GLASS = {c:'#2f3d44', glow:'#ffd9a0', gk:0.9}, AWN = '#2f5f45',
      DOCK = '#7d6a55', HULL = '#3d6b58', HIN = '#d8d2c2', DARK = '#2a2a2a', CONC = '#a7a299';
    const ob = B.p(BRICK), ol = B.p(LIME), or_ = B.p(ROOF), og = B.p(GLASS), oa = B.p(AWN), od = B.p(DOCK), oc = B.p(CONC);
    // foundations / terrace plinth (to the lake bed)
    prismP(oc, [[-3.2, -42], [31.4, -42], [31.4, -13.3], [22.1, -13.3], [22.1, 19.3], [-3.2, 19.3]], -3.2, FL, true);
    // north hall: brick walls, limestone base course and cornice, the hipped roof
    const A = rectP(-0.7, 31.4, -41.5, -13.3), Bw = rectP(-1.8, 22.1, -13.3, 19.3), C = rectP(31.3, 36.8, -28.4, -17), D = rectP(22.1, 24.2, 4.1, 16.5);
    prismP(ob, A, -3.0, FL + 5.6, false); bandP(ol, A, FL, 0.9, 0.12); bandP(ol, A, FL + 5.3, 0.5, 0.3);
    hipP(or_, 15.35, -27.4, 32.1, 28.2, FL + 5.8, 3.6, 0, 0.6);
    prismP(ob, Bw, -3.0, FL + 4.4, false); bandP(ol, Bw, FL, 0.9, 0.12); bandP(ol, Bw, FL + 4.1, 0.45, 0.3);
    hipP(or_, 10.15, 3, 23.9, 32.6, FL + 4.55, 2.6, HP, 0.5);
    prismP(ob, C, -3.0, FL + 3.8, true); bandP(ol, C, FL + 3.5, 0.35, 0.15);
    prismP(ob, D, -3.0, FL + 3.8, true);
    // a low lantern (roof monitor) on the hall ridge
    prismP(ol, rectP(9, 21.7, -28.6, -26.2), FL + 8.6, FL + 9.6, false); hipP(or_, 15.35, -27.4, 13.6, 3.4, FL + 9.6, 0.8, 0, 0.2);
    // lakeside front of the hall: tall glazing between limestone piers; awning over the lakeside terrace walk
    for (let z = -40.5; z < -14.5; z += 3.2){ boxP(og, 0.12, 3.6, 2.6, -0.76, FL + 0.9, z + 1.4); boxP(ol, 0.5, 4.4, 0.5, -0.8, FL + 0.9, z); }
    for (let x = 1.2; x < 30; x += 3.2) boxP(og, 2.4, 2.6, 0.12, x + 1.2, FL + 1.4, -41.56);
    winSeg(og, [22.1, -13.3], [22.1, 19.3], [1, 0], FL + 1.0, FL + 3.8, 4, 2.8, 1.8, 2.2, 0.3, 0.07);
    winSeg(og, [-1.8, 19.3], [-1.8, -13.3], [-1, 0], FL + 1.0, FL + 3.8, 4, 2.6, 1.9, 2.4, 0.2, 0.07);
    // the lakeside dining terrace: deck over the water edge with posts and a green canvas roof
    prismP(od, rectP(-6.5, -0.7, -40, -14), -2.2, FL, true);
    for (let z = -40; z <= -14; z += 3.25) for (const x of [-6.3]) segP(B.p(LIME), [x, FL, z], [x, FL + 3.2, z], 0.1, 4);
    quadP(oa, [-0.7, FL + 4.0, -40.3], [-0.7, FL + 4.0, -13.7], [-6.8, FL + 3.2, -13.7], [-6.8, FL + 3.2, -40.3]);
    boxP(oa, 0.08, 0.5, 26.6, -6.8, FL + 2.7, -27);
    for (let z = -39; z <= -15; z += 2.6) boxP(B.p(DARK), 0.06, 1.0, 1.4, -6.3, FL, z);           // railing panels
    // the rowboat dock (floating, at the north end) with finger piers and the rowboats moored in rows
    const DY = WL + 0.25;
    prismP(od, rectP(-10, -6.5, -30, 6), DY - 0.35, DY, true);
    for (const z of [-26, -20, -14, -8, -2, 4]) prismP(od, rectP(-22, -10, z - 0.6, z + 0.6), DY - 0.35, DY, true);
    const boat = (x, z, ry) => {
      const R = rotQ(x, z, ry), oh = B.p(HULL), oi = B.p(HIN), y0 = WL - 0.2, y1 = WL + 0.45;
      const prof = [[-2.1, 0.0], [-1.9, 0.62], [-1.0, 0.72], [0.6, 0.7], [1.6, 0.5], [2.2, 0.0]];
      for (let i = 0; i < prof.length - 1; i++){ const [a, wa] = prof[i], [b, wb] = prof[i+1];
        for (const s of [-1, 1]){ quadP(oh, R(a, y1, s*wa), R(b, y1, s*wb), R(b, y0, s*wb*0.55), R(a, y0, s*wa*0.55)); }
        quadP(oi, R(a, y1 - 0.25, -wa*0.85), R(b, y1 - 0.25, -wb*0.85), R(b, y1 - 0.25, wb*0.85), R(a, y1 - 0.25, wa*0.85)); }
      for (const u of [-0.8, 0.5]) boxP(oi, 0.25, 0.06, 1.25, x + Math.cos(ry)*u, y1 - 0.12, z - Math.sin(ry)*u, ry);
    };
    for (const z of [-26, -20, -14, -8, -2]) for (let k = 0; k < 4; k++){ boat(-12.6 - k*2.6, z - 1.7, HP); boat(-12.6 - k*2.6, z + 1.7, HP); }
    // lamps along the terrace walk
    const lamp = {c:'#f3dfb0', glow:'#ffd690', gk:1.1};
    for (const [x, z] of [[26, -44], [8, -44], [-8, -12], [24, 18], [37.5, -14]]){ segP(B.p('#2e3230'), [x, -0.8, z], [x, 3.2, z], 0.07, 5); boxP(B.p(lamp), 0.35, 0.5, 0.35, x, 3.2, z); }
    cpFlushAt(B, g, CX, CZ);
    return g;
  }};
cpPlaceR('nyloeb', 40.7752, -73.9689, 14, -11, 0.22);
// ---------------------------------------------------------------------------------------------------------------------------
// New-York Historical Society, 170 Central Park West (1908 York & Sawyer centre, 1938 Walker & Gillette wings): the long grey
// granite front on Central Park West with the rusticated base, the giant engaged Ionic colonnade over the 2nd-3rd storeys,
// the entablature and attic storey, the end pavilions with pilasters, the entrance steps; the recessed top storey.
// Grid frame (ROT): +x east (CPW face at x 6.7), -z north (77th St face at z -20.5); written round the ref anchor, placed at
// (-20, 10.6), r 40. OSM footprint (52.8 x 62.2 m, light-court notch on the west side) followed exactly.
LANDMARKS.nynyhist = {zh:'纽约历史学会', en:'New-York Historical Society', cat:'old', r:43, h:36,
  lt:{m:0, c:'#ffe0b4', k:0.65, e:0.5},
  build(){
    const g = new THREE.Group(), B = cpBB(), CX = -20, CZ = 10.6;
    const GR = '#c8c2b5', GRD = '#aea89b', GRL = '#d6d0c3', WIN = {c:'#2b3135', glow:'#ffd7a0', gk:0.35}, ROOF = '#7f7d78', DARK = '#26292b';
    const og = B.p(GR), ogd = B.p(GRD), ogl = B.p(GRL), ow = B.p(WIN), or_ = B.p(ROOF);
    const FP = [[-31.0, 41.7], [-31.0, 4.6], [-38.6, 4.6], [-38.7, -20.4], [6.6, -20.5], [6.7, 39.4], [4.4, 41.7]];   // SE corner chamfered 2.3 m so the hull keeps the 76th St sidewalk   // the SW wing is nynyhist_b
    const XE = 6.7, Z0 = -20.5, Z1 = 41.7, H1 = 7.2, H2 = 20.4, H3 = 23.0, H4 = 27.6;
    prismP(ogd, FP, -4, 0.4, false);
    prismP(og, FP, 0.4, H4, true);
    // rusticated base: horizontal channels
    for (let y = 1.0; y < H1; y += 0.9) bandP(ogd, FP, y, 0.12, 0.05);
    bandP(ogl, FP, H1, 0.6, 0.35);                      // base cornice / balustrade line
    bandP(ogl, FP, H2, 0.5, 0.25); bandP(ogl, FP, H2 + 0.5, 2.1, 0.15);   // architrave + frieze
    bandP(ogl, FP, H3 - 0.4, 0.6, 0.6);                 // main cornice
    bandP(ogl, FP, H4 - 0.5, 0.5, 0.35);                // attic cornice
    // CPW front: giant Ionic colonnade between the end pavilions (z -9 .. 30), engaged columns 1.25 m in diameter
    const ZA = -9.0, ZB = 30.2, nC = 12;
    for (let i = 0; i < nC; i++){ const z = ZA + (ZB - ZA)*i/(nC - 1);
      latheP(ogl, [[0.75, 0], [0.68, 0.4], [0.62, 0.6], [0.55, H2 - H1 - 1.6], [0.6, H2 - H1 - 1.4], [0.85, H2 - H1 - 0.6], [0.85, H2 - H1]], XE + 0.05, H1 + 0.6, z, 10);
      boxP(ogl, 1.9, 0.5, 2.1, XE + 0.3, H2 - 0.5, z); }                              // Ionic capital block (volutes read as the wide abacus)
    // windows: tall ones between the columns (2nd and 3rd storeys with spandrels), base windows, attic windows
    for (let i = 0; i < nC - 1; i++){ const z = ZA + (ZB - ZA)*(i + 0.5)/(nC - 1);
      boxP(ow, 0.12, 4.0, 1.7, XE + 0.02, H1 + 1.6, z); boxP(ow, 0.12, 3.4, 1.7, XE + 0.02, H1 + 7.2, z);
      boxP(ow, 0.12, 2.0, 1.3, XE + 0.02, H3 + 1.2, z); }
    // end pavilions on CPW: pilasters and single windows
    for (const [z0, z1] of [[Z0, ZA - 1.6], [ZB + 1.6, Z1]]){
      for (const z of [z0 + 0.6, z1 - (z1 === Z1 ? 2.9 : 0.6)]) boxP(ogl, 0.5, H2 - H1, 1.1, XE + 0.2, H1 + 0.6, z);
      const zc = (z0 + z1)/2; boxP(ow, 0.12, 4.6, 2.0, XE + 0.02, H1 + 2.0, zc); boxP(ow, 0.12, 2.6, 1.8, XE + 0.02, H1 + 8.2, zc); boxP(ow, 0.12, 1.9, 1.3, XE + 0.02, H3 + 1.2, zc);
      boxP(ogl, 0.6, 0.5, 3.0, XE + 0.25, H1 + 6.9, zc); }
    // base: windows and the central entrance with the steps (portal at z 10.6)
    winSeg(ow, [XE, ZA], [XE, ZB], [1, 0], 1.2, H1 - 0.6, 6, 3.4, 1.4, 3.2, 0.6, 0.07);
    boxP(B.p(DARK), 0.2, 4.2, 3.4, XE + 0.05, 0.4, 10.6); boxP(ogl, 0.9, 0.9, 5.4, XE + 0.4, 4.6, 10.6);
    for (let k = 0; k < 3; k++) boxP(ogd, 1.2 - k*0.4, 0.15*(k + 1) + 0.3, 9 - k*0.6, XE + (1.2 - k*0.4)/2, 0.0, 10.6);
    // side and rear facades: punched windows on four storeys, pilaster strips
    const sides = [[[6.6, -20.5], [-38.7, -20.4], [0, -1]], [[-31.0, 41.7], [4.4, 41.7], [0, 1]], [[-38.7, -20.4], [-38.6, 4.6], [-1, 0]]];
    for (const [a, b, n] of sides){
      winSeg(ow, a, b, n, 1.2, H1 - 0.5, 6, 3.6, 1.4, 3.0, 0.6, 0.07);
      winSeg(ow, a, b, n, H1 + 1.4, H2 - 0.6, 5.6, 3.6, 1.6, 3.6, 0.4, 0.07);
      winSeg(ow, a, b, n, H3 + 0.6, H4 - 0.8, 4, 3.6, 1.2, 1.8, 0.4, 0.07);
      piersSeg(ogl, a, b, n, H1 + 0.6, H2, 7.2, 0.8, 0.25, true); }
    // recessed top storey and the rooftop plant (the measured roof reaches 35.8 m)
    prismP(og, [[-36, -14], [-2, -14], [-2, 36], [-40, 36], [-40, 18]], H4, H4 + 4.2, true);
    winPoly(ow, rectP(-36, -2, -14, 36), H4 + 0.8, H4 + 3.6, 4, 3.6, 1.6, 2.0, 0.2);
    prismP(or_, rectP(-28, -12, -4, 22), H4 + 4.2, H4 + 8.0, true);
    // the park-side sidewalk lamps (the two bronze lanterns at the entrance)
    const lamp = {c:'#f6e3b6', glow:'#ffd690', gk:1.3};
    for (const z of [6.4, 14.8]){ boxP(B.p(lamp), 0.5, 0.8, 0.4, XE + 0.3, 3.6, z); }       // lanterns on the wall (nothing on the sidewalk)
    cpFlushAt(B, g, CX, CZ, -0.5);
    return g;
  }};
placeAt('nynyhist', 40.7793, -73.9740, -20, 10.6, ROT);
// the south-west wing on 76th Street (separate key so the hull of the main block stays off the neighbour on 77th Street)
LANDMARKS.nynyhist_b = {zh:'纽约历史学会西翼', en:'New-York Historical Society (west wing)', cat:'old', r:18, h:28, label:false,
  lt:{m:0, c:'#ffe0b4', k:0.65, e:0.5},
  build(){
    const g = new THREE.Group(), B = cpBB(), CX = -38.5, CZ = 27.8;
    const GR = '#c8c2b5', GRD = '#aea89b', GRL = '#d6d0c3', WIN = {c:'#2b3135', glow:'#ffd7a0', gk:0.35};
    const og = B.p(GR), ogd = B.p(GRD), ogl = B.p(GRL), ow = B.p(WIN);
    const W = [[-46.0, 41.7], [-46.1, 14.0], [-31.0, 14.0], [-31.0, 41.7]], H1 = 7.2, H2 = 20.4, H3 = 23.0, H4 = 27.6;
    prismP(ogd, W, -4, 0.4, false); prismP(og, W, 0.4, H4, true);
    for (let y = 1.0; y < H1; y += 0.9) bandP(ogd, W, y, 0.12, 0.05);
    bandP(ogl, W, H1, 0.6, 0.35); bandP(ogl, W, H2, 0.5, 0.25); bandP(ogl, W, H2 + 0.5, 2.1, 0.15); bandP(ogl, W, H3 - 0.4, 0.6, 0.9); bandP(ogl, W, H4 - 0.5, 0.5, 0.35);
    for (const [a, b, n] of [[[-46.0, 41.7], [-31.0, 41.7], [0, 1]], [[-46.1, 14.0], [-46.0, 41.7], [-1, 0]], [[-31.0, 14.0], [-46.1, 14.0], [0, -1]]]){
      winSeg(ow, a, b, n, 1.2, H1 - 0.5, 6, 3.6, 1.4, 3.0, 0.6, 0.07);
      winSeg(ow, a, b, n, H1 + 1.4, H2 - 0.6, 5.6, 3.6, 1.6, 3.6, 0.4, 0.07);
      winSeg(ow, a, b, n, H3 + 0.6, H4 - 0.8, 4, 3.6, 1.2, 1.8, 0.4, 0.07); }
    cpFlushAt(B, g, CX, CZ, -0.5);
    return g;
  }};
placeAt('nynyhist_b', 40.7793, -73.9740, -38.5, 27.8, ROT);
// ---------------------------------------------------------------------------------------------------------------------------
// Neue Galerie New York, 1048 Fifth Avenue at 86th Street (1914, Carrere and Hastings, the William Starr Miller house): Louis
// XIII style red brick with limestone quoins, window surrounds and rusticated ground storey, the steep slate mansard with
// pedimented and oval dormers, the tall chimneys. Grid frame (ROT): Fifth Avenue front (3 bays) at x -11.9 (west, facing the
// park), 86th Street front (7 bays) at z 2.3 (south); placed at (3.3, -4.9), r 22. Footprint = OSM (30.4 x 14.3 m, L notch).
LANDMARKS.nyneue = {zh:'新画廊', en:'Neue Galerie New York', cat:'old', r:22, h:24,
  lt:{m:0, c:'#ffe0b4', k:0.6, e:0.4},
  build(){
    const g = new THREE.Group(), B = cpBB(), CX = 3.3, CZ = -4.9;
    const BRK = '#9b4b3c', LS = '#dcd3bf', LSD = '#c4baa5', SL = '#4b5258', WIN = {c:'#2b3033', glow:'#ffd9a2', gk:0.5}, IRON = '#2c2f2e';
    const ob = B.p(BRK), ol = B.p(LS), old = B.p(LSD), os = B.p(SL), ow = B.p(WIN), oi = B.p(IRON);
    const FP = [[-11.9, 2.3], [-11.8, -10.8], [-3.7, -10.9], [-3.7, -12.0], [18.5, -12.0], [18.5, 2.3]];
    const G1 = 5.0, C1 = 16.4, MT = 21.2;
    prismP(old, FP, -4, 0, false);
    prismP(ol, FP, 0, G1, false);                                           // limestone ground storey, rusticated
    for (let y = 0.7; y < G1; y += 0.75) bandP(old, FP, y, 0.1, 0.04);
    prismP(ob, FP, G1, C1, false);                                          // brick upper storeys
    bandP(ol, FP, G1, 0.45, 0.15); bandP(ol, FP, G1 + 4.1, 0.25, 0.08);      // string courses
    bandP(ol, FP, C1 - 0.6, 0.9, 0.55);                                      // main cornice
    // quoins at the corners (alternating long / short blocks)
    for (const [x, z] of [[-11.9, 2.3], [18.5, 2.3], [-11.8, -10.8], [18.5, -12.0]]) for (let y = G1; y < C1 - 0.6; y += 0.8){ const k = Math.round((y - G1)/0.8) % 2; boxP(ol, k ? 1.2 : 0.8, 0.4, k ? 0.8 : 1.2, x, y, z); }
    // windows with limestone surrounds: Fifth Ave front (3 bays), 86th St front (7 bays), north side
    const fac = (a, b, n, bays) => {
      const L = Math.hypot(b[0]-a[0], b[1]-a[1]), ex = (b[0]-a[0])/L, ez = (b[1]-a[1])/L, ry = Math.atan2(-ez, ex);
      for (let i = 0; i < bays; i++){ const t = (i + 0.5)*L/bays, x = a[0] + ex*t, z = a[1] + ez*t;
        for (const [y0, h, w] of [[1.1, 2.9, 1.5], [G1 + 0.8, 3.3, 1.6], [G1 + 4.7, 2.7, 1.5], [G1 + 8.2, 2.2, 1.4]]){
          boxP(ow, w, h, 0.1, x + n[0]*0.04, y0, z + n[1]*0.04, ry);
          boxP(ol, w + 0.5, 0.35, 0.3, x + n[0]*0.12, y0 + h, z + n[1]*0.12, ry);            // lintel / keystone band
          boxP(ol, w + 0.4, 0.18, 0.35, x + n[0]*0.14, y0 - 0.18, z + n[1]*0.14, ry); }     // sill
        boxP(oi, 1.9, 0.9, 0.5, x + n[0]*0.35, G1 + 0.8, z + n[1]*0.35, ry); }              // balconette on the piano nobile
    };
    fac([-11.9, -10.8], [-11.9, 2.3], [-1, 0], 3);
    fac([-11.9, 2.3], [18.5, 2.3], [0, 1], 7);
    fac([18.5, -12.0], [-3.7, -12.0], [0, -1], 5);
    fac([18.5, 2.3], [18.5, -12.0], [1, 0], 3);
    boxP(B.p('#2a2420'), 2.0, 3.4, 0.2, 6.2, 0, 2.38);                       // entrance door on 86th St
    boxP(ol, 3.6, 0.6, 0.6, 6.2, 3.6, 2.6);
    // mansard: steep lower slope to a flatter upper slope, slate, with dormers and chimneys
    const M0 = insetP(FP, -0.2), M1 = insetP(FP, 1.6), M2 = insetP(FP, 4.2);
    skinP(os, M0, C1 + 0.3, M1, MT, false); skinP(os, M1, MT, M2, MT + 1.6, true);
    for (const [a, b, n, k] of [[[-11.9, -10.8], [-11.9, 2.3], [-1, 0], 3], [[-11.9, 2.3], [18.5, 2.3], [0, 1], 7], [[18.5, -12.0], [-3.7, -12.0], [0, -1], 5]]){
      const L = Math.hypot(b[0]-a[0], b[1]-a[1]), ex = (b[0]-a[0])/L, ez = (b[1]-a[1])/L, ry = Math.atan2(-ez, ex);
      for (let i = 0; i < k; i++){ const t = (i + 0.5)*L/k, x = a[0] + ex*t - n[0]*0.9, z = a[1] + ez*t - n[1]*0.9;
        boxP(ol, 1.8, 2.6, 1.4, x, C1 + 0.6, z, ry); boxP(ow, 1.1, 1.8, 0.1, x + n[0]*0.71, C1 + 0.8, z + n[1]*0.71, ry);
        gableP(ol, x, z, 2.1, 1.7, C1 + 3.2, 0.9, ry + HP); }
    }
    for (const [x, z] of [[-6, -11.4], [10, -11.4], [16.5, 0.5], [-9, 0.8]]){ boxP(ob, 1.4, 6.2, 0.9, x, C1 + 1, z); boxP(ol, 1.6, 0.3, 1.1, x, C1 + 7.2, z); }
    cpFlushAt(B, g, CX, CZ, -0.8);   // ground floor at the Fifth Avenue grade
    return g;
  }};
placeAt('nyneue', 40.7812, -73.9603, 3.3, -4.9, ROT);
// ---------------------------------------------------------------------------------------------------------------------------
// Delacorte Theater (1962; renovated 2020-2023): the open-air bowl of ~1,800 seats facing Turtle Pond, the thrust stage with the
// pond and Belvedere Castle behind it, the outer wall with vertical timber slats, the steel lighting towers at the ends of the bowl
// and on the rim. Frame north-up (rot 0), centred on the bowl centre (ref anchor + (2, 12)): seats from r 13 to r 35 over the
// sector -172.7 .. -31.2 deg (through north), following the OSM outline; r 40, base 31.85 m, ground 31.25 m (local -0.6).
LANDMARKS.nydelacorte = {zh:'德拉科特剧场', en:'Delacorte Theater', cat:'new', r:40, h:19,
  lt:{m:0, c:'#fff1dc', k:0.35},
  build(){
    const g = new THREE.Group(), B = cpBB();
    const SEAT = '#355b57', CONC = '#a29d93', SLAT = '#9b7b57', STAGE = '#6b5a48', STEEL = '#5a5e60', DARK = '#2b2d2f', LAMP = {c:'#fff3d6', glow:'#fff1d0', gk:1.6};
    const os = B.p(SEAT), oc = B.p(CONC), osl = B.p(SLAT), ost = B.p(STAGE), oe = B.p(STEEL);
    const A0 = -172.7*PI/180, A1 = -31.2*PI/180, R0 = 13, R1 = 34.6, NR = 22, G = -0.6, TOPY = 4.6;
    const nA = 40, ang = i => A0 + (A1 - A0)*i/nA, P = (r, a, y) => [Math.cos(a)*r, y, Math.sin(a)*r];
    // the stepped rows (each row: tread + riser, seat backs as a thin band), radial aisles left as plain concrete
    for (let k = 0; k < NR; k++){
      const r0 = R0 + (R1 - R0)*k/NR, r1 = R0 + (R1 - R0)*(k + 1)/NR, y = G + 0.35 + (TOPY - 0.35 - G)*k/NR, y2 = G + 0.35 + (TOPY - 0.35 - G)*(k + 1)/NR;
      for (let i = 0; i < nA; i++){ const a = ang(i), b = ang(i + 1), aisle = (i % 8 === 0);
        quadP(oc, P(r0, a, y), P(r0, b, y), P(r1, b, y), P(r1, a, y));                    // tread
        quadP(oc, P(r1, a, y), P(r1, b, y), P(r1, b, y2), P(r1, a, y2));                  // riser
        if (!aisle){ const rs = r0 + (r1 - r0)*0.55; quadP(os, P(rs, a + 0.004, y), P(rs, b - 0.004, y), P(rs + 0.08, b - 0.004, y + 0.75), P(rs + 0.08, a + 0.004, y + 0.75));
          quadP(os, P(rs - 0.45, a + 0.004, y + 0.42), P(rs - 0.45, b - 0.004, y + 0.42), P(rs, b - 0.004, y + 0.45), P(rs, a + 0.004, y + 0.45)); }
      }
    }
    // the bowl's underside / outer wall with timber slats, the rim walk and its rail
    for (let i = 0; i < nA; i++){ const a = ang(i), b = ang(i + 1);
      quadP(oc, P(R1, a, G - 0.4), P(R1, b, G - 0.4), P(R1, b, TOPY), P(R1, a, TOPY));
      quadP(oc, P(R1, a, TOPY), P(R1, b, TOPY), P(R1 + 1.6, b, TOPY), P(R1 + 1.6, a, TOPY));
      for (let s = 0; s < 4; s++){ const t = a + (b - a)*(s + 0.5)/4; boxP(osl, 0.14, TOPY + 1.4 - G, 0.22, Math.cos(t)*(R1 + 1.75), G, Math.sin(t)*(R1 + 1.75), -t); }
      segP(oe, P(R1 + 1.6, a, TOPY + 1.1), P(R1 + 1.6, b, TOPY + 1.1), 0.04, 4); }
    boxP(oe, 0.1, 0.1, 0.1, 0, 0, 0);
    // the end walls of the bowl (stair ramps down to the stage level)
    for (const a of [A0, A1]){ const q0 = P(R0, a, 0), q1 = P(R1 + 1.6, a, 0); const L = Math.hypot(q1[0]-q0[0], q1[2]-q0[2]);
      boxP(oc, L, TOPY + 0.6 - G, 0.6, (q0[0] + q1[0])/2, G, (q0[2] + q1[2])/2, -a); }
    // stage: the thrust platform at the centre with the wings, low back wall toward the pond
    const SP = [[-11, 3], [-7, -4], [0, -7.5], [7, -4], [11, 3], [11, 10], [-11, 10]];
    prismP(ost, SP, G - 0.3, G + 1.0, true);
    prismP(oc, circP(R0, 32, 0).filter(p => p[1] < 10.5), G - 0.2, G + 0.3, true);
    prismP(B.p(DARK), rectP(-12, 12, 10, 11), G, G + 2.4, true);
    // lighting towers: two tall ones at the bowl ends and four on the rim (lattice masts with lamp heads)
    const tower = (x, z, h) => { for (const [dx, dz] of [[-0.6, -0.6], [0.6, -0.6], [0.6, 0.6], [-0.6, 0.6]]) segP(oe, [x + dx, G, z + dz], [x + dx*0.5, h, z + dz*0.5], 0.08, 4);
      for (let y = G + 2; y < h; y += 2.2) prismP(oe, rectP(x - 0.55, x + 0.55, z - 0.55, z + 0.55), y, y + 0.12, false);
      boxP(oe, 3.0, 1.6, 0.8, x, h, z); boxP(B.p(LAMP), 2.6, 1.2, 0.15, x, h + 0.2, z + 0.42); boxP(B.p(LAMP), 2.6, 1.2, 0.15, x, h + 0.2, z - 0.42); };
    for (const a of [A0 + 0.02, A1 - 0.02]){ const q = P(R1 + 2.4, a, 0); tower(q[0], q[2], 18); }
    for (const t of [0.4, 0.6, 0.8]){ const q = P(R1 + 2.4, A0 + (A1 - A0)*t, 0); tower(q[0], q[2], 13); }
    cpFlushAt(B, g, 0, 0);
    return g;
  }};
SG_PLACES.push({type:'nydelacorte', lat:+(40.7802 - 12/111048).toFixed(7), lon:+(-73.9688 + 2/84516).toFixed(7), rot:0});
// ---------------------------------------------------------------------------------------------------------------------------
// Wollman Rink (1950; rebuilt 1986): the rounded ice rink (68 x 40 m) with the white dasher boards and the rink deck, the long
// curved rink house built into the slope on its north side (glazed front to the rink, canopy, the roof terrace reached from the
// park at grade), the small booth at the east end, floodlight poles. Frame north-up (rot 0) round the ref anchor, placed at
// (12, -30), r 54 -> app base 10.81 m; the rink level is the map ground 7.10 m (local -3.71), the slope rises north of the house.
LANDMARKS.nywollman = {zh:'沃尔曼溜冰场', en:'Wollman Rink', cat:'new', r:54, h:12,
  lt:{m:0, c:'#f4f6ff', k:0.35},
  build(){
    const g = new THREE.Group(), B = cpBB(), CX = 12, CZ = -30, RY = -3.29;
    const ICE = {c:'#e6eef2'}, BOARD = '#f2f2ee', CAP = '#3a6f9a', DECK = '#9d9a94', WALL = '#b7aa94', GLASS = {c:'#304048', glow:'#ffe2b0', gk:0.8},
      ROOF = '#8b8f8c', STEEL = '#55595b', LAMP = {c:'#f6f4ec', glow:'#ffffff', gk:1.6}, BOOTH = '#c9c1b0';
    // rounded rectangle in the rink frame (centre (0, -26), axis rotated 0.19 rad: east end lower in z)
    const C0 = [0, -26], ca = Math.cos(0.19), sa = Math.sin(0.19);
    const T = (u, v) => [C0[0] + u*ca - v*sa, C0[1] + u*sa + v*ca];
    const rr = (hu, hv, rc, n) => { const P = []; for (const [cu, cv, a0] of [[hu - rc, hv - rc, 0], [-hu + rc, hv - rc, HP], [-hu + rc, -hv + rc, PI], [hu - rc, -hv + rc, 1.5*PI]])
      for (let i = 0; i <= n; i++){ const a = a0 + i/n*HP; P.push(T(cu + Math.cos(a)*rc, cv + Math.sin(a)*rc)); } return P; };
    const ICEP = rr(34, 20, 11, 6), DECKP = rr(38, 24, 14, 6), BRD0 = rr(34.15, 20.15, 11.1, 6), BRD1 = rr(34.45, 20.45, 11.4, 6);
    prismP(B.p(DECK), DECKP, -4.2, RY + 0.05, true);
    capP(B.p(ICE), ICEP, RY + 0.12);
    // dasher boards with the blue cap rail
    const ob = B.p(BOARD), oc = B.p(CAP);
    for (let i = 0; i < BRD0.length; i++){ const j = (i + 1) % BRD0.length, a = BRD0[i], b = BRD0[j], a1 = BRD1[i], b1 = BRD1[j];
      quadP(ob, [a[0], RY, a[1]], [b[0], RY, b[1]], [b[0], RY + 1.1, b[1]], [a[0], RY + 1.1, a[1]]);
      quadP(ob, [a1[0], RY, a1[1]], [b1[0], RY, b1[1]], [b1[0], RY + 1.1, b1[1]], [a1[0], RY + 1.1, a1[1]]);
      quadP(oc, [a[0], RY + 1.1, a[1]], [b[0], RY + 1.1, b[1]], [b1[0], RY + 1.12, b1[1]], [a1[0], RY + 1.12, a1[1]]); }
    // centre line and the circles as faint painted lines on the ice
    const ol = B.p('#9fb6c8'); { const p0 = T(0, -19.8), p1 = T(0, 19.8); boxP(ol, 0.3, 0.02, 39.6, (p0[0] + p1[0])/2, RY + 0.13, (p0[1] + p1[1])/2, -0.19); }
    // the rink house: OSM ring, from the rink level to the roof terrace (1.7 m), glazed rink front, canopy, terrace rail
    const H = [[-22.3, -62.4], [-13.4, -64.6], [-2.0, -65.9], [7.2, -65.8], [18.6, -64.4], [29.6, -61.4], [38.1, -57.9], [46.2, -53.5], [55.5, -46.8], [48.8, -38.9], [40.6, -44.6], [39.8, -43.3], [28.3, -48.8], [16.0, -52.3], [3.2, -53.7], [-9.6, -52.9], [-9.9, -54.8], [-19.4, -52.7]];
    const ow = B.p(WALL), og = B.p(GLASS), orf = B.p(ROOF), ost = B.p(STEEL);
    prismP(ow, H, -4.5, 1.7, false); capP(orf, H, 1.7);
    // south (rink) front: points 9..17 of the ring, glazing in bays with mullions, the canopy over it
    const S = H.slice(9).concat([H[0]]);
    for (let i = 0; i < S.length - 1; i++){ const a = S[i], b = S[i+1], L = Math.hypot(b[0]-a[0], b[1]-a[1]); if (L < 2) continue;
      const ex = (b[0]-a[0])/L, ez = (b[1]-a[1])/L, nx = ez, nz = -ex;          // outward (south) normal for this winding
      const k = Math.max(1, Math.round(L/3));
      for (let m = 0; m < k; m++){ const t0 = m*L/k + 0.15, t1 = (m + 1)*L/k - 0.15;
        quadP(og, [a[0] + ex*t0 + nx*0.08, RY + 0.3, a[1] + ez*t0 + nz*0.08], [a[0] + ex*t1 + nx*0.08, RY + 0.3, a[1] + ez*t1 + nz*0.08], [a[0] + ex*t1 + nx*0.08, RY + 3.6, a[1] + ez*t1 + nz*0.08], [a[0] + ex*t0 + nx*0.08, RY + 3.6, a[1] + ez*t0 + nz*0.08]); }
      quadP(orf, [a[0], RY + 4.0, a[1]], [b[0], RY + 4.0, b[1]], [b[0] + nx*3.2, RY + 3.8, b[1] + nz*3.2], [a[0] + nx*3.2, RY + 3.8, a[1] + nz*3.2]);
      segP(ost, [a[0] + nx*3.0, RY, a[1] + nz*3.0], [a[0] + nx*3.0, RY + 3.8, a[1] + nz*3.0], 0.09, 4);
      segP(ost, [a[0] + nx*0.2, 1.7 + 1.0, a[1] + nz*0.2], [b[0] + nx*0.2, 1.7 + 1.0, b[1] + nz*0.2], 0.04, 4); }
    // roof terrace furniture: low planters and two small pavilions (stairs / lift heads)
    prismP(ow, rectP(-6, 2, -62, -57), 1.7, 4.2, true); prismP(ow, rectP(30, 36, -57, -52), 1.7, 4.2, true);
    // the booth at the east end (OSM 12.7 x 12.7 m square, 3.3 m)
    prismP(B.p(BOOTH), [[36.9, -29.3], [41.2, -33.5], [49.6, -25.0], [45.2, -20.8]], -4, RY + 3.3, false);
    hipP(orf, 43.25, -27.15, 11.9, 6.0, RY + 3.3, 1.4, -PI/4, 0.4);
    // floodlight poles round the rink
    for (const [u, v] of [[-30, -24], [0, -26], [30, -24], [-30, 24], [0, 26], [30, 24]]){ const p = T(u, v); segP(ost, [p[0], RY - 0.5, p[1]], [p[0], RY + 12, p[1]], 0.16, 6); boxP(B.p(LAMP), 1.8, 0.6, 0.8, p[0], RY + 12, p[1], -0.19); }
    cpFlushAt(B, g, CX, CZ);
    return g;
  }};
cpPlaceR('nywollman', 40.7677, -73.9746, 12, -30, 0);
// ---------------------------------------------------------------------------------------------------------------------------
// Conservatory Garden (1937), Central Park at 105th Street: the Vanderbilt Gate (1894 Paris ironwork) on Fifth Avenue with the
// steps down, the central Italian garden (the lawn between yew hedges, the double allees of crabapples, the jet fountain at the
// west end) and the semicircular wisteria pergola on the terrace above it; the two small stone garden houses; the fountain pools
// of the north garden as a secondary key (pool rim and water jets only - the sculpture is left out: no figures).
// Grid frame (ROT), the garden axis along local x (Fifth Avenue east at x ~ 50); written round the ref anchor, placed at (-12, -4),
// r 62 -> app base 10.74 m. The ground is the app's terrain (table from tools/gtab.py): everything is draped on it.
// The map draws the fountains' water itself (flat water at the ground + 0.12): only rims and jets are modelled there.
LANDMARKS.nyconservgarden = {zh:'温室花园', en:'Conservatory Garden', cat:'old', r:62, h:12,
  lt:{m:0, c:'#ffe6c0', k:0.4},
  build(){
    const g = new THREE.Group(), B = cpBB(), CX = -12, CZ = -4;
    const gy0 = cpGY({"x0":2324.08,"y0":10414.51,"rot":-0.506,"base":10.74,"i0":431,"j0":547,"n":5,"H":[[9.66,3.76,-0.74,-1.14,-3.64],[10.86,3.36,-2.44,-1.74,-3.54],[12.56,6.26,-5.84,-5.84,-5.84],[14.06,13.46,-5.84,-5.84,-5.84],[16.16,8.46,-5.84,-5.84,-5.84]]}), gy = (x, z) => gy0(x - CX, z - CZ);       // model written in the anchor frame
    const GRASS = '#62874a', GRAV = '#b9ad94', HEDGE = '#2f5233', STONE = '#b3ab9b', IRON = '#1f2522', GOLD = '#9a8148',
      WIST = {c:'#7f8f5a'}, WOODP = '#6d6a5f', TRUNK = '#5a4636', CRAB = '#87a05a', JET = {c:'#e8f3f6', op:0.55, ds:true}, ROOF = '#5a5f5c', LAMPC = {c:'#f4e3b4', glow:'#ffd690', gk:1.1};
    const og = B.p(GRASS), ov = B.p(GRAV), oh = B.p(HEDGE), os = B.p(STONE), oi = B.p(IRON);
    const FC = [-42.3, -4.0];                                                // centre fountain (the map's pool, r ~ 6)
    // ---- the draped ground: lawn, the walks, the allee strips (gravel), the terrace, skipping the fountain pool
    const region = (x, z) => {
      if (Math.hypot(x - FC[0], z - FC[1]) < 7.2) return null;
      if (x > -44 && x < 34 && z > -23 && z < 16) return og;                  // the great lawn
      if (x > -44 && x < 34 && ((z > -33 && z < -23) || (z > 16 && z < 27))) return (Math.abs(z + 28) < 1.6 || Math.abs(z - 21.5) < 1.6) ? ov : og;
      if (x >= 34 && x < 46 && Math.abs(z + 4) < 6) return ov;                // the walk from the gate
      if (x > -50 && x <= -44 && z > -33 && z < 27) return ov;                // the cross walk at the west end of the lawn
      if (Math.hypot(x - FC[0], z - FC[1]) < 25 && x < -44) return Math.hypot(x - FC[0], z - FC[1]) > 19 ? ov : og;  // terrace + pergola walk
      return null; };
    const st = 2;
    for (let x = -68; x < 46; x += st) for (let z = -46; z < 38; z += st){
      const o = region(x + st/2, z + st/2); if (!o) continue;
      quadP(o, [x, gy(x, z) + 0.1, z], [x, gy(x, z + st) + 0.1, z + st], [x + st, gy(x + st, z + st) + 0.1, z + st], [x + st, gy(x + st, z) + 0.1, z]); }
    // ---- yew hedges framing the lawn and the allees (dark green, 1.3 m), with openings on the axis and the cross walks
    const hedge = (x0, z0, x1, z1, h) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.ceil(L/4)), ry = Math.atan2(-(z1 - z0), x1 - x0);
      for (let i = 0; i < n; i++){ const t = (i + 0.5)/n, x = x0 + (x1 - x0)*t, z = z0 + (z1 - z0)*t; boxP(oh, L/n + 0.05, h + 0.4, 1.1, x, gy(x, z) - 0.3, z, ry); } };
    for (const z of [-22.6, 15.6]){ hedge(-43, z, -8, z, 0.9); hedge(-2, z, 33, z, 0.9); }
    for (const z of [-33.4, 27.4]){ hedge(-48, z, 34, z, 1.4); }
    hedge(33.6, -33, 33.6, -11, 1.4); hedge(33.6, 3, 33.6, 27, 1.4);
    // ---- crabapple allees: double rows each side
    const r = LMCTX.rng;
    for (const z of [-31.2, -24.8, 18.2, 24.8]) for (let x = -40; x <= 30; x += 5){ treeP(B, x, gy(x, z) - 0.1, z, 0.95 + r()*0.15, CRAB, TRUNK, r); }
    // ---- centre fountain: stone rim round the map's pool, the tall jet, the basin step
    const fy = gy(FC[0], FC[1]);
    latheP(os, [[7.1, -0.5], [7.1, 0.55], [6.5, 0.6], [6.5, -0.3]], FC[0], fy, FC[1], 28);
    latheP(os, [[0.9, -0.3], [0.9, 0.5], [0.4, 0.8], [0, 0.85]], FC[0], fy, FC[1], 10);
    latheP(B.p(JET), [[0.3, 0.6], [0.22, 4], [0.14, 9], [0.45, 10.2], [1.0, 9.8], [1.9, 7], [2.7, 2.5], [3.1, 0.3]], FC[0], fy, FC[1], 12);
    // ---- the wisteria pergola: a semicircle (r 21) round the fountain on the west terrace, two rows of iron posts, the arched
    //      trellis and the wisteria canopy; the terrace steps on the axis
    const A0 = HP + 0.15, A1 = 1.5*PI - 0.15 + PI/2 - 0.15, n = 26;
    for (let i = 0; i <= n; i++){ const a = HP + PI*i/n, ca = Math.cos(a), sa = Math.sin(a);
      for (const rr of [19.4, 22.6]){ const x = FC[0] + ca*rr, z = FC[1] + sa*rr, y = gy(x, z); segP(oi, [x, y, z], [x, y + 3.4, z], 0.08, 5); }
      const xa = FC[0] + ca*19.4, za = FC[1] + sa*19.4, xb = FC[0] + ca*22.6, zb = FC[1] + sa*22.6, ya = gy(xa, za) + 3.4, yb = gy(xb, zb) + 3.4;
      segP(oi, [xa, ya, za], [(xa + xb)/2, (ya + yb)/2 + 0.7, (za + zb)/2], 0.06, 4); segP(oi, [(xa + xb)/2, (ya + yb)/2 + 0.7, (za + zb)/2], [xb, yb, zb], 0.06, 4);
      if (i < n){ const b = HP + PI*(i + 1)/n, cb = Math.cos(b), sb = Math.sin(b), ow = B.p(WIST);
        const P0 = [FC[0] + ca*18.9, 0, FC[1] + sa*18.9], P1 = [FC[0] + cb*18.9, 0, FC[1] + sb*18.9], P2 = [FC[0] + cb*23.1, 0, FC[1] + sb*23.1], P3 = [FC[0] + ca*23.1, 0, FC[1] + sa*23.1], PM = [FC[0] + (ca + cb)/2*21, 0, FC[1] + (sa + sb)/2*21];
        for (const P of [P0, P1, P2, P3]) P[1] = gy(P[0], P[2]) + 3.55; PM[1] = gy(PM[0], PM[2]) + 4.6;
        triP(ow, P0, P1, PM); triP(ow, P1, P2, PM); triP(ow, P2, P3, PM); triP(ow, P3, P0, PM);
        segP(oi, [FC[0] + ca*19.4, gy(FC[0] + ca*19.4, FC[1] + sa*19.4) + 3.4, FC[1] + sa*19.4], [FC[0] + cb*19.4, gy(FC[0] + cb*19.4, FC[1] + sb*19.4) + 3.4, FC[1] + sb*19.4], 0.05, 4);
        segP(oi, [FC[0] + ca*22.6, gy(FC[0] + ca*22.6, FC[1] + sa*22.6) + 3.4, FC[1] + sa*22.6], [FC[0] + cb*22.6, gy(FC[0] + cb*22.6, FC[1] + sb*22.6) + 3.4, FC[1] + sb*22.6], 0.05, 4); }
    }
    // steps up to the pergola on the axis (west of the fountain) and the low retaining wall of the terrace
    for (let k = 0; k < 10; k++){ const x = -50.5 - k*0.8, z = -4; boxP(os, 0.8, 0.5, 7, x, gy(x, z) - 0.3, z); }
    for (let i = 0; i < 18; i++){ const a = HP + PI*i/18, b = HP + PI*(i + 1)/18, x0 = FC[0] + Math.cos(a)*17.4, z0 = FC[1] + Math.sin(a)*17.4, x1 = FC[0] + Math.cos(b)*17.4, z1 = FC[1] + Math.sin(b)*17.4;
      if (Math.abs((a + b)/2 - PI) < 0.2) continue;
      const L = Math.hypot(x1 - x0, z1 - z0); boxP(os, L, 1.4, 0.6, (x0 + x1)/2, Math.min(gy(x0, z0), gy(x1, z1)) - 0.4, (z0 + z1)/2, Math.atan2(-(z1 - z0), x1 - x0)); }
    // ---- the two small stone garden houses (OSM 3.2 / 4.6 m) at the terrace corners
    for (const [x0, x1, z0, z1, h] of [[-58, -45, -41, -28, 3.2], [-58, -45, 20, 33, 4.6]]){
      const y = Math.min(gy(x0, z0), gy(x1, z0), gy(x0, z1), gy(x1, z1));
      prismP(os, rectP(x0, x1, z0, z1), y - 1.5, Math.max(gy(x0, z0), gy(x1, z1)) + h - 1.2, false);
      hipP(B.p(ROOF), (x0 + x1)/2, (z0 + z1)/2, x1 - x0 + 0.6, z1 - z0 + 0.6, Math.max(gy(x0, z0), gy(x1, z1)) + h - 1.2, 2.2, 0, 0.3); }
    // ---- the Vanderbilt Gate on Fifth Avenue (x 44, axis z -4): two tall openwork iron piers with lanterns, the double gate,
    //      the scrolled overthrow, the stone base, steps down into the garden
    const GX = 44.5, GZ = -4, gyG = gy(GX, GZ);
    boxP(os, 2.2, 0.5, 15.5, GX, gyG - 0.3, GZ);
    for (const s of [-1, 1]){ const pz = GZ + s*5.0;
      boxP(os, 1.6, 1.0, 1.6, GX, gyG, pz);
      for (const [dx, dz] of [[-0.45, -0.45], [0.45, -0.45], [0.45, 0.45], [-0.45, 0.45]]) segP(oi, [GX + dx, gyG + 1.0, pz + dz], [GX + dx*0.7, gyG + 7.2, pz + dz*0.7], 0.07, 4);
      for (let y = gyG + 1.6; y < gyG + 7; y += 0.9){ prismP(oi, rectP(GX - 0.42, GX + 0.42, pz - 0.42, pz + 0.42), y, y + 0.08, false);
        let pv = null; for (let k = 0; k <= 8; k++){ const t = k/8*TAU, p = [GX + 0.5, y + 0.45 + Math.sin(t)*0.3, pz + Math.cos(t)*0.3]; if (pv) segP(oi, pv, p, 0.03, 3); pv = p; } }
      latheP(B.p(GOLD), [[0.45, 0], [0.3, 0.4], [0.12, 1.0], [0, 1.5]], GX, gyG + 7.2, pz, 8);
      boxP(B.p(LAMPC), 0.45, 0.6, 0.45, GX + 0.6, gyG + 5.6, pz);
      // gate leaf: frame, vertical bars, a band of scrolls (open lattice)
      const z0 = GZ + s*0.05, z1 = GZ + s*4.15;
      for (let k = 0; k <= 14; k++){ const z = z0 + (z1 - z0)*k/14; segP(oi, [GX, gyG + 0.2, z], [GX, gyG + 4.4 + Math.sin(k/14*PI)*0.6*(s > 0 ? 1 : 1), z], 0.03, 3); }
      for (const y of [gyG + 0.3, gyG + 2.2, gyG + 4.3]) segP(oi, [GX, y, z0], [GX, y, z1], 0.05, 4);
      for (let k = 0; k < 6; k++){ const zc = z0 + (z1 - z0)*(k + 0.5)/6; let pv = null; for (let m = 0; m <= 8; m++){ const t = m/8*TAU, p = [GX, gyG + 3.25 + Math.sin(t)*0.32, zc + Math.cos(t)*0.32]; if (pv) segP(oi, pv, p, 0.03, 3); pv = p; } }
    }
    // overthrow: the scrolled iron arch over the gate with a gilded crest
    { let pv = null; for (let k = 0; k <= 16; k++){ const t = k/16, z = GZ - 4.4 + 8.8*t, y = gyG + 6.4 + Math.sin(t*PI)*1.6, p = [GX, y, z]; if (pv) segP(oi, pv, p, 0.07, 4); pv = p; }
      for (let k = 0; k < 7; k++){ const zc = GZ - 3.3 + 6.6*k/6, yb = gyG + 5.6 + Math.sin((zc - GZ + 4.4)/8.8*PI)*1.1; let pv2 = null; for (let m = 0; m <= 8; m++){ const t = m/8*TAU, p = [GX, yb + Math.sin(t)*0.42, zc + Math.cos(t)*0.42]; if (pv2) segP(oi, pv2, p, 0.035, 3); pv2 = p; } }
      latheP(B.p(GOLD), [[0.5, 0], [0.35, 0.5], [0, 1.1]], GX, gyG + 8.0, GZ, 8); segP(oi, [GX, gyG + 4.8, GZ - 4.4], [GX, gyG + 4.8, GZ + 4.4], 0.06, 4); }
    // steps down from the gate into the garden walk
    for (let k = 0; k < 6; k++){ const x = 42.6 - k*0.45; boxP(os, 0.45, 0.4, 9.5, x, gy(x, GZ) - 0.2 + (6 - k)*0.04, GZ); }
    // lamps along the allees
    for (const [x, z] of [[-30, -28], [0, -28], [24, -28], [-30, 21.5], [0, 21.5], [24, 21.5]]){ const y = gy(x, z); segP(oi, [x, y, z], [x, y + 3.6, z], 0.07, 5); boxP(B.p(LAMPC), 0.35, 0.5, 0.35, x, y + 3.6, z); }
    cpFlushAt(B, g, CX, CZ);
    return g;
  }};
placeAt('nyconservgarden', 40.7937, -73.9524, -12, -4, ROT);
// north garden (French): the Untermyer fountain pool rim with its jets, the concentric beds round it (no sculpture)
LANDMARKS.nyconservgarden_b = {zh:'温室花园北园', en:'Conservatory Garden (north garden)', cat:'old', r:14, h:5, label:false,
  lt:{m:0, c:'#ffe6c0', k:0.3},
  build(){
    const g = new THREE.Group(), B = cpBB(), gy = cpGY({"x0":2370.57,"y0":10467.87,"rot":-0.506,"base":5.5,"i0":433,"j0":549,"n":3,"H":[[-0.6,-0.6,-0.6],[-0.6,-0.6,-0.6]]}), STONE = '#b3ab9b', JET = {c:'#e8f3f6', op:0.5, ds:true}, BED = '#7c6a8a', HEDGE = '#3a5d36';
    const y = gy(0, 0);
    latheP(B.p(STONE), [[5.2, -0.6], [5.2, 0.5], [4.7, 0.55], [4.7, -0.2]], 0, y, 0, 24);
    capP(B.p({c:'#5a8aa0', op:0.85}), circP(4.75, 24, 0), y + 0.3);                          // the basin's water (no map pool here)
    latheP(B.p(STONE), [[1.2, -0.2], [1.1, 1.2], [0.6, 1.5], [0, 1.55]], 0, y, 0, 10);
    for (let k = 0; k < 6; k++){ const a = k/6*TAU; latheP(B.p(JET), [[0.1, 0.4], [0.25, 2.2], [0.6, 2.6], [1.0, 1.4], [1.2, 0.2]], Math.cos(a)*2.6, y, Math.sin(a)*2.6, 6); }
    latheP(B.p(JET), [[0.2, 1.5], [0.15, 4.2], [0.7, 4.6], [1.6, 2.6], [2.3, 0.4]], 0, y, 0, 10);
    for (let i = 0; i < 28; i++){ const a = i/28*TAU, b = (i + 1)/28*TAU; for (const [r0, r1, o] of [[5.2, 6.8, B.p('#b9ad94')], [6.8, 8.4, B.p(BED)], [8.8, 9.6, B.p(HEDGE)]]){
      const P = [[Math.cos(a)*r0, Math.sin(a)*r0], [Math.cos(b)*r0, Math.sin(b)*r0], [Math.cos(b)*r1, Math.sin(b)*r1], [Math.cos(a)*r1, Math.sin(a)*r1]];
      quadP(o, [P[0][0], gy(...P[0]) + (r0 < 6 ? 0.07 : 0.3), P[0][1]], [P[1][0], gy(...P[1]) + (r0 < 6 ? 0.07 : 0.3), P[1][1]], [P[2][0], gy(...P[2]) + (r0 < 6 ? 0.07 : 0.3), P[2][1]], [P[3][0], gy(...P[3]) + (r0 < 6 ? 0.07 : 0.3), P[3][1]]); } }
    B.flush(g); return g; }};
placeAt('nyconservgarden_b', 40.7937, -73.9524, 2.8, -73.2, ROT);
// ---------------------------------------------------------------------------------------------------------------------------
// Central Park Zoo (the 1988 Kevin Roche redesign of the 1934 zoo): the red brick ranges with limestone trim round the Central
// Garden, the glass-roofed brick colonnade (pergola) on their garden side, the sea lion pool with its rock islands in the middle
// (the map draws the pool's water: rim, railing and rocks only), the Polar Circle house on the north, and as secondary keys
// (label:false) the Delacorte Clock arch with the zoo school building (nycpzoo_b: the brick arch and the clock only - no animal
// figures) and the southern complex with the tall glass-roofed Tropic Zone (nycpzoo_c). Split so that no hull reaches the
// Arsenal (kept as the map's building). Grid frame (ROT); pieces follow the OSM outline (one 5215 m2 polygon, 9.2 m).
// Every piece sits on the app's terrain (tables from tools/gtab.py; the ground falls ~5 m from north to south here).
{
const BRICK = '#9b5a45', LIME = '#d5cbb7', GLASSR = {c:'#a9c6cc', op:0.6}, STEELG = '#3f5f4e', ROOFF = '#6e6a63', DARKW = {c:'#2c2f31', glow:'#ffdcae', gk:0.4},
  GLASSV = {c:'#9dc0c6', op:0.7, glow:'#e8f4ff', gk:0.25}, ROCK = '#77736b', PAVE = '#a78d76', PLANT = '#5b7e45', RAIL = '#2e3a33';
// a brick range on polygon P (anchor frame), height h above its floor (the ground at its centre); foundation to the lowest ground
const cpZooBldg = (B, gy, P, h, o) => { o = o || {};
  let cx = 0, cz = 0; for (const p of P){ cx += p[0]; cz += p[1]; } cx /= P.length; cz /= P.length;
  const f = gy(cx, cz), lo = Math.min(...P.map(p => gy(p[0], p[1]))) - 0.6, ob = B.p(BRICK), ol = B.p(LIME);
  prismP(ob, P, lo, f + h, false); bandP(ol, P, f + h - 0.6, 0.6, 0.18); bandP(ol, P, f, 0.5, 0.08);
  capP(B.p(o.roof || ROOFF), insetP(P, 0.3), f + h - 0.15);
  if (!o.nowin) winPoly(B.p(DARKW), P, f + 0.6, f + h - 1.0, 4.2, 4.2, 1.6, 2.6, 0.4, true);
  return f; };
// glass-roofed colonnade along a -> b (anchor frame) on the side n (unit normal pointing into the garden), depth d
const cpColon = (B, gy, a, b, n, d) => {
  const L = Math.hypot(b[0]-a[0], b[1]-a[1]), ex = (b[0]-a[0])/L, ez = (b[1]-a[1])/L, k = Math.max(1, Math.round(L/3.6)), ob = B.p(BRICK), og = B.p(GLASSR), os = B.p(STEELG), ry = Math.atan2(-ez, ex);
  for (let i = 0; i <= k; i++){ const t = i*L/k, x = a[0] + ex*t + n[0]*d, z = a[1] + ez*t + n[1]*d, y = gy(x, z); boxP(ob, 0.75, 4.6 + 0.5, 0.75, x, y - 0.5, z, ry);
    boxP(B.p(LIME), 0.95, 0.3, 0.95, x, y + 4.3, z, ry); segP(os, [x, y + 4.6, z], [x - n[0]*d, y + 5.6, z - n[1]*d], 0.08, 4); }
  for (let i = 0; i < k; i++){ const t0 = i*L/k, t1 = (i + 1)*L/k;
    const p0 = [a[0] + ex*t0, a[1] + ez*t0], p1 = [a[0] + ex*t1, a[1] + ez*t1], y0 = gy(p0[0] + n[0]*d, p0[1] + n[1]*d), y1 = gy(p1[0] + n[0]*d, p1[1] + n[1]*d);
    quadP(og, [p0[0] + n[0]*(d + 0.4), y0 + 4.65, p0[1] + n[1]*(d + 0.4)], [p1[0] + n[0]*(d + 0.4), y1 + 4.65, p1[1] + n[1]*(d + 0.4)], [p1[0], y1 + 5.7, p1[1]], [p0[0], y0 + 5.7, p0[1]]);
    segP(os, [p0[0] + n[0]*d, y0 + 4.6, p0[1] + n[1]*d], [p1[0] + n[0]*d, y1 + 4.6, p1[1] + n[1]*d], 0.1, 4); }
};
LANDMARKS.nycpzoo = {zh:'中央公园动物园', en:'Central Park Zoo', cat:'old', r:78, h:16,
  lt:{m:0, c:'#ffdcae', k:0.45},
  build(){
    const g = new THREE.Group(), B = cpBB(), CX = -19, CZ = -9;
    const gy0 = cpGY({"x0":680.78,"y0":7546.13,"rot":-0.506,"base":16.55,"i0":408,"j0":506,"n":4,"H":[[-9.45,-9.45,-1.45,-1.15],[-9.45,-9.45,-3.55,-1.35],[-9.45,-2.65,-3.75,-1.55],[4.35,2.65,0.85,-1.45],[3.05,4.75,5.85,-1.45]]}), gy = (x, z) => gy0(x - CX, z - CZ);
    // ranges round the garden
    cpZooBldg(B, gy, rectP(-43, -37.3, -37, 23.3), 7);
    cpZooBldg(B, gy, [[-43, -37.1], [-21.7, -53], [-21.7, -46.5], [-33.3, -30.5], [-37.3, -30.4]], 7, {nowin:true});
    cpZooBldg(B, gy, rectP(-21.7, 23.8, -53, -46.5), 7.5);
    cpZooBldg(B, gy, rectP(18.1, 24.1, -46.5, -33.1), 7);
    cpZooBldg(B, gy, [[-42.6, 23.3], [-32.6, 23.3], [-21.7, 34.2], [-21.7, 39.4], [-42.6, 39.4]], 8, {nowin:true});
    cpZooBldg(B, gy, rectP(-21.7, 24.1, 38.8, 54.2), 9);
    cpZooBldg(B, gy, rectP(17.7, 24.1, 24.2, 38.8), 9);
    // the Polar Circle house (penguins and puffins) and its link, the north-west exhibit buildings
    const fP = cpZooBldg(B, gy, [[-10.4, -54.3], [-10.4, -71.6], [9.2, -72], [17.4, -63.5], [17.4, -54.3]], 9.2, {nowin:true});
    hipP(B.p(GLASSV), 3.5, -63, 22, 13, fP + 9.1, 2.6, 0, 0);
    cpZooBldg(B, gy, rectP(17.4, 24.4, -60.6, -54.3), 6, {nowin:true});
    for (const R of [rectP(-49.3, -43, -44.4, -37.9), rectP(-57, -49.3, -51.8, -44.2), rectP(-61.9, -55.9, -58.2, -49.2), rectP(-33, -25.3, -64, -48.1), rectP(-25.3, -21.4, -55.3, -52.7)]) cpZooBldg(B, gy, R, 6, {nowin:true});
    // the colonnades on the garden side (west, north-west diagonal, north, east, south)
    cpColon(B, gy, [-37.3, 23.3], [-37.3, -30.4], [1, 0], 3.4);
    cpColon(B, gy, [-33.3, -30.5], [-21.6, -42.5], [0.716, 0.698], 3.4);
    cpColon(B, gy, [-21.7, -46.5], [18.1, -46.5], [0, 1], 3.4);
    cpColon(B, gy, [18.1, -46.5], [18.1, -33.1], [-1, 0], 3.4);
    cpColon(B, gy, [-21.7, 38.8], [17.7, 38.8], [0, -1], 3.4);
    cpColon(B, gy, [-32.6, 23.3], [-21.7, 34.2], [0.707, -0.707], 3.4);
    // the Central Garden: brick paving round the pool and on the cross walks, planting beds, trees
    const op = B.p(PAVE), ov = B.p(PLANT), st = 2.5;
    const inPool = (x, z) => cpSdPoly([[-7.8, 2.1], [-7.5, -10.9], [-3.0, -15.2], [4.6, -15.1], [9.7, -10.3], [9.4, 1.8], [4.0, 7.1], [-3.1, 6.6]], x, z) > -0.9;
    for (let x = -33.5; x < 14.6; x += st) for (let z = -42.5; z < 35; z += st){ const xm = x + st/2, zm = z + st/2;
      if (inPool(xm, zm)) continue; if (xm < -33.3 && zm < -27) continue; if (zm < -30.5 + (xm + 33.3)*(-1.03) && xm < -21.6) continue;
      const dp = Math.hypot((xm - 1)/1.1, zm + 4), o = (dp < 17 || Math.abs(zm + 4) < 2.5 || Math.abs(xm - 1) < 2.5) ? op : ov;
      quadP(o, [x, gy(x, z) + 0.12, z], [x, gy(x, z + st) + 0.12, z + st], [x + st, gy(x + st, z + st) + 0.12, z + st], [x + st, gy(x + st, z) + 0.12, z]); }
    const r = LMCTX.rng;
    for (const [x, z] of [[-26, -20], [-26, 12], [8, -34], [-14, -36], [10, 26], [-12, 28], [-28, 24], [12, -26]]) treeP(B, x, gy(x, z) - 0.1, z, 1.4 + r()*0.3, '#557a3f', '#4d3d30', r);
    // the sea lion pool: granite rim with the railing round the map's water, the rock islands
    const POOL = insetP([[-7.8, 2.1], [-7.5, -10.9], [-3.0, -15.2], [4.6, -15.1], [9.7, -10.3], [9.4, 1.8], [4.0, 7.1], [-3.1, 6.6]], -0.6);
    const yp = gy(1, -4);
    { const IN = insetP(POOL, 0.6), ol = B.p(LIME); prismP(ol, POOL, yp - 0.8, yp + 0.75, false); prismP(ol, IN, yp - 0.8, yp + 0.75, false);
      for (let i = 0; i < POOL.length; i++){ const j = (i + 1) % POOL.length; quadP(ol, [POOL[i][0], yp + 0.75, POOL[i][1]], [IN[i][0], yp + 0.75, IN[i][1]], [IN[j][0], yp + 0.75, IN[j][1]], [POOL[j][0], yp + 0.75, POOL[j][1]]); } }
    const orl = B.p(RAIL); for (let i = 0; i < POOL.length; i++){ const a = POOL[i], b2 = POOL[(i + 1) % POOL.length]; segP(orl, [a[0], yp + 1.75, a[1]], [b2[0], yp + 1.75, b2[1]], 0.04, 4); segP(orl, [a[0], yp + 0.75, a[1]], [a[0], yp + 1.75, a[1]], 0.04, 4); }
    const ork = B.p(ROCK);
    for (const [x, z, s, h] of [[1.5, -5, 3.4, 2.4], [-3.5, -1, 1.8, 1.4], [5, -11, 2.2, 1.6], [-2, -10, 1.5, 1.0]]) latheP(ork, [[s, -0.3], [s*0.95, h*0.4], [s*0.6, h*0.85], [s*0.2, h], [0, h*1.02]], x, yp, z, 7, x*0.7);
    cpFlushAt(B, g, CX, CZ);
    return g;
  }};
placeAt('nycpzoo', 40.7678, -73.9718, -19, -9, ROT);
// the Delacorte Clock (1965) on its brick arch over the walk at the north-east corner, with the link and the zoo school building
LANDMARKS.nycpzoo_b = {zh:'德拉科特音乐钟', en:'Delacorte Clock (Central Park Zoo)', cat:'old', r:24, h:12, label:false,
  lt:{m:0, c:'#ffdcae', k:0.5},
  build(){
    const g = new THREE.Group(), B = cpBB(), CX = 46, CZ = -56;
    const gy0 = cpGY({"x0":760.41,"y0":7555.74,"rot":-0.506,"base":15.8,"i0":410,"j0":507,"n":3,"H":[[-2.8,-0.6,0.5],[-3.0,-0.8,1.1],[1.6,-0.7,2.1]]}), gy = (x, z) => gy0(x - CX, z - CZ);
    const BRZ = '#5d4b33', FACE = {c:'#efe6cf', glow:'#fff2d0', gk:0.8}, HANDS = '#1d1d1b', ob = B.p(BRICK), ol = B.p(LIME);
    // the link walls either side of the arch, the zoo school building (rounded east end)
    cpZooBldg(B, gy, rectP(24.4, 27.0, -57.3, -54.2), 4.5, {nowin:true});
    cpZooBldg(B, gy, rectP(31.4, 41.2, -57.3, -54.2), 4.5, {nowin:true});
    const fS = cpZooBldg(B, gy, [[41.2, -59.9], [56.2, -60.1], [59.4, -63.1], [62.9, -63.2], [67.4, -60.6], [67.6, -51.6], [63.9, -48.5], [58.8, -48.5], [57.6, -50.8], [41.3, -50.5]], 5.5);
    hipP(B.p(ROOFF), 50, -55.3, 17, 8.6, fS + 5.4, 1.6, 0, 0.2);
    // the arch: two brick piers, the round arch, the clock stage above with the dial on both faces, the bell under a small canopy
    const AX = 29.2, AZ = -55.75, y = gy(AX, AZ);
    for (const s of [-1, 1]) boxP(ob, 1.6, 6.2, 3.6, AX + s*3.0, y - 0.6, AZ);
    boxP(ob, 7.6, 1.6, 3.6, AX, y + 4.2, AZ);
    archRing(ol, [AX, AZ - 1.82], 1, 0, [0, -1], 0, 2.2, 0.35, y + 3.0, 0.12, 10);
    archRing(ol, [AX, AZ + 1.82], 1, 0, [0, 1], 0, 2.2, 0.35, y + 3.0, 0.12, 10);
    boxP(ol, 8.0, 0.4, 4.0, AX, y + 5.8, AZ);
    // clock stage: bronze frame with the dial (hour marks and hands only), stepped top, the bell and the canopy
    boxP(B.p(BRZ), 2.6, 3.0, 2.2, AX, y + 6.2, AZ);
    for (const s of [-1, 1]){ const zf = AZ + s*1.12;
      const dial = []; for (let k = 0; k < 20; k++){ const a0 = k/20*TAU, a1 = (k + 1)/20*TAU; triP(dial, [AX, y + 7.7, zf], [AX + Math.cos(a0)*0.95, y + 7.7 + Math.sin(a0)*0.95, zf], [AX + Math.cos(a1)*0.95, y + 7.7 + Math.sin(a1)*0.95, zf]); }
      B.p(FACE).push(...dial);
      for (let k = 0; k < 12; k++){ const a = k/12*TAU; boxP(B.p(HANDS), 0.08, 0.2, 0.03, AX + Math.cos(a)*0.8, y + 7.6 + Math.sin(a)*0.8, zf + s*0.02); }
      segP(B.p(HANDS), [AX, y + 7.7, zf + s*0.04], [AX + 0.45, y + 8.1, zf + s*0.04], 0.04, 3); segP(B.p(HANDS), [AX, y + 7.7, zf + s*0.04], [AX - 0.1, y + 8.45, zf + s*0.04], 0.03, 3); }
    boxP(B.p(BRZ), 3.0, 0.3, 2.6, AX, y + 9.2, AZ);
    for (const [dx, dz] of [[-1.1, -0.9], [1.1, -0.9], [1.1, 0.9], [-1.1, 0.9]]) segP(B.p(BRZ), [AX + dx, y + 9.5, AZ + dz], [AX + dx, y + 11.2, AZ + dz], 0.06, 4);
    latheP(B.p(BRZ), [[0.05, 0], [0.45, 0.2], [0.55, 0.75], [0.35, 0.95], [0, 1.0]], AX, y + 9.6, AZ, 10);
    hipP(B.p(BRZ), AX, AZ, 2.8, 2.4, y + 11.2, 1.0, 0, 0.2);
    cpFlushAt(B, g, CX, CZ);
    return g;
  }};
placeAt('nycpzoo_b', 40.7678, -73.9718, 46, -56, ROT);
// the southern complex: the Tropic Zone (tall glass roof), the ranges round the courtyard, the cafe and the entrance buildings
LANDMARKS.nycpzoo_c = {zh:'中央公园动物园热带馆', en:'Central Park Zoo (Tropic Zone)', cat:'old', r:52, h:18, label:false,
  lt:{m:0, c:'#ffdcae', k:0.45},
  build(){
    const g = new THREE.Group(), B = cpBB(), CX = -20, CZ = 70;
    const gy0 = cpGY({"x0":641.61,"y0":7477.52,"rot":-0.506,"base":12.0,"i0":408,"j0":505,"n":4,"H":[[-4.9,-4.9,3.0,3.5],[-4.9,-4.9,3.1,3.4],[-4.9,-4.9,1.0,3.2],[-4.9,1.9,0.8,3.0]]}), gy = (x, z) => gy0(x - CX, z - CZ);
    cpZooBldg(B, gy, rectP(-61, -42.6, 39.4, 58), 9);
    cpZooBldg(B, gy, rectP(-59, -51.4, 58, 65.8), 6);
    const fT = cpZooBldg(B, gy, rectP(-42.6, -28.4, 39.4, 62.3), 11, {nowin:true});
    // the Tropic Zone's glass roof: a tall hipped glass house over the brick walls, steel ribs
    hipP(B.p(GLASSV), -35.5, 50.85, 22.9, 14.2, fT + 10.9, 6.0, HP, 0);
    for (let z = 41; z < 61; z += 2.5) segP(B.p(STEELG), [-42.4, fT + 10.95, z], [-35.5, fT + 16.9, Math.min(Math.max(z, 46.0), 55.7)], 0.07, 4);
    cpZooBldg(B, gy, rectP(-51.2, -37.8, 62.3, 87.6), 9);
    cpZooBldg(B, gy, rectP(-37.8, 22.5, 77.3, 84.4), 6);
    cpZooBldg(B, gy, rectP(-0.2, 8.5, 72.8, 77.3), 6, {nowin:true});
    cpZooBldg(B, gy, rectP(8.5, 22.3, 62.4, 77.3), 6);
    cpZooBldg(B, gy, rectP(-18.7, -10.6, 44.6, 54.2), 6, {nowin:true});
    cpZooBldg(B, gy, rectP(-28.4, -20.3, 44.7, 48.6), 6, {nowin:true});
    cpZooBldg(B, gy, rectP(-37.2, -30.8, 84.4, 101.3), 6);
    cpZooBldg(B, gy, rectP(-42.4, -37.2, 89.8, 96.8), 5, {nowin:true});
    cpZooBldg(B, gy, rectP(12.2, 19.2, 83.7, 86.5), 5, {nowin:true});
    // colonnade on the north side of the courtyard (Intelligence Garden)
    cpColon(B, gy, [-28.4, 62.3], [8.5, 62.3], [0, 1], 3.0);
    cpFlushAt(B, g, CX, CZ);
    return g;
  }};
placeAt('nycpzoo_c', 40.7678, -73.9718, -20, 70, ROT);
}
}
