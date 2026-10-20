// ===== nyc/nymidtown: Midtown Manhattan landmarks on their real OSM footprints (City Brush v25, New York 1:1).
// Empire State Building, Chrysler Building, One Vanderbilt, Grand Central Terminal, MetLife Building, New York Public Library.
// Every model is built in a frame aligned with the Midtown street grid: local +x = along the cross streets toward the East
// River ("east"), local -z = up the avenues ("north", uptown), +z toward downtown. rot ~ -0.50 (the grid is ~29 deg clockwise
// of true north). Block-scoped: only LANDMARKS and SG_PLACES are touched.
{
const PI = Math.PI, HP = PI/2, TAU = PI*2;
// ---- triangle batches: every part of one colour spec goes into one LTris call (one material, one draw call)
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const quadP = (o, a, b, c, d) => o.push(...a, ...b, ...c, ...a, ...c, ...d);
const triP = (o, a, b, c) => o.push(...a, ...b, ...c);
const lerp = (a, b, t) => a + (b - a)*t;
// cylinder segment a -> b of radius r with n sides
function segP(o, a, b, r, n, r2){
  n = n || 4; r2 = r2 === undefined ? r : r2; const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2], L = Math.hypot(dx, dy, dz); if (L < 1e-4) return;
  const d = [dx/L, dy/L, dz/L], up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let ux = d[1]*up[2]-d[2]*up[1], uy = d[2]*up[0]-d[0]*up[2], uz = d[0]*up[1]-d[1]*up[0]; const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
  const vx = d[1]*uz-d[2]*uy, vy = d[2]*ux-d[0]*uz, vz = d[0]*uy-d[1]*ux;
  const ring = (p, rr) => { const R = []; for (let i = 0; i < n; i++){ const t = (i + 0.5)/n*TAU, c = Math.cos(t)*rr, s = Math.sin(t)*rr; R.push([p[0]+ux*c+vx*s, p[1]+uy*c+vy*s, p[2]+uz*c+vz*s]); } return R; };
  const A = ring(a, r), Bq = ring(b, r2);
  for (let i = 0; i < n; i++){ const j = (i+1) % n; quadP(o, A[i], A[j], Bq[j], Bq[i]); }
}
const rotQ = (cx, cz, ry) => { const c = Math.cos(ry || 0), s = Math.sin(ry || 0); return (x, y, z) => [cx + x*c + z*s, y, cz - x*s + z*c]; };
function boxP(o, w, h, d, x, y, z, ry){
  const R = rotQ(x, z, ry), hw = w/2, hd = d/2;
  const P = [R(-hw, y, -hd), R(hw, y, -hd), R(hw, y, hd), R(-hw, y, hd), R(-hw, y+h, -hd), R(hw, y+h, -hd), R(hw, y+h, hd), R(-hw, y+h, hd)];
  for (const [a, b, c, e] of [[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]) quadP(o, P[a], P[b], P[c], P[e]);
}
const abox = (o, x0, x1, y0, y1, z0, z1) => boxP(o, x1 - x0, y1 - y0, z1 - z0, (x0 + x1)/2, y0, (z0 + z1)/2, 0);
function loftP(o, secs, cap){
  const n = secs[0].length;
  for (let s = 0; s < secs.length - 1; s++) for (let i = 0; i < n; i++){ const j = (i+1) % n; quadP(o, secs[s][i], secs[s][j], secs[s+1][j], secs[s+1][i]); }
  if (cap){ const t = secs[secs.length - 1], c = [0, 0, 0]; for (const p of t){ c[0] += p[0]/n; c[1] += p[1]/n; c[2] += p[2]/n; } for (let i = 0; i < n; i++) o.push(...c, ...t[i], ...t[(i+1) % n]); }
}
// frustum / cylinder about a vertical axis, n sides, radii r0 (bottom) r1 (top)
function cylP(o, x, z, r0, r1, y0, y1, n, cap, rot){
  const a = [], b = []; rot = rot === undefined ? PI/n : rot;
  for (let i = 0; i < n; i++){ const t = rot + i/n*TAU, c = Math.cos(t), s = Math.sin(t); a.push([x + c*r0, y0, z + s*r0]); b.push([x + c*r1, y1, z + s*r1]); }
  loftP(o, [a, b], cap);
}
// ---- plan polygons ([x, z])
const area2 = P => { let s = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; s += a[0]*b[1] - b[0]*a[1]; } return s/2; };
const outN = (P, i) => { const s = area2(P) > 0 ? 1 : -1, a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], l = Math.hypot(ex, ez) || 1; return [ez/l*s, -ex/l*s]; };
const triang = P => THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
const rectP = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const chamf = (hx, hz, c, cx, cz) => { cx = cx || 0; cz = cz || 0; return [[cx-hx+c, cz-hz], [cx+hx-c, cz-hz], [cx+hx, cz-hz+c], [cx+hx, cz+hz-c], [cx+hx-c, cz+hz], [cx-hx+c, cz+hz], [cx-hx, cz+hz-c], [cx-hx, cz-hz+c]]; };
const flatP = (o, P, y) => { for (const t of triang(P)) for (const k of t){ const p = P[k]; o.push(p[0], y, p[1]); } };
function wallsP(o, P, y0, y1, edges){
  for (let i = 0; i < P.length; i++){ if (edges && !edges(i)) continue; const a = P[i], b = P[(i+1) % P.length]; quadP(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); }
}
// a horizontal band round a polygon standing `off` proud of the walls (y .. y + h)
function bandP(o, P, y, h, off, edges){
  for (let i = 0; i < P.length; i++){ if (edges && !edges(i)) continue;
    const a = P[i], b = P[(i+1) % P.length]; if (Math.hypot(b[0]-a[0], b[1]-a[1]) < 0.2) continue; const [nx, nz] = outN(P, i);
    const A = [a[0]+nx*off, a[1]+nz*off], Bb = [b[0]+nx*off, b[1]+nz*off];
    quadP(o, [A[0], y, A[1]], [Bb[0], y, Bb[1]], [Bb[0], y+h, Bb[1]], [A[0], y+h, A[1]]);
    if (off > 0.05) quadP(o, [a[0], y+h, a[1]], [b[0], y+h, b[1]], [Bb[0], y+h, Bb[1]], [A[0], y+h, A[1]]);
  }
}
// vertical strips (window bays) centred in bays of about `sp` along every edge, `w` wide, `off` proud of the wall
function stripsP(o, P, y0, y1, sp, w, off, edges, minL){
  for (let i = 0; i < P.length; i++){ if (edges && !edges(i)) continue;
    const a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], L = Math.hypot(ex, ez); if (L < (minL || sp*0.9)) continue;
    const [nx, nz] = outN(P, i), n = Math.max(1, Math.round(L/sp)), ux = ex/L, uz = ez/L, st = L/n;
    for (let k = 0; k < n; k++){ const s = st*(k + 0.5), x = a[0] + ux*s + nx*off, z = a[1] + uz*s + nz*off;
      quadP(o, [x - ux*w/2, y0, z - uz*w/2], [x + ux*w/2, y0, z + uz*w/2], [x + ux*w/2, y1, z + uz*w/2], [x - ux*w/2, y1, z - uz*w/2]); }
  }
}
// window panes in the strips of stripsP: one quad per floor (fh) of height wh, `off` proud of the wall
function panesP(o, P, y0, y1, sp, w, off, fh, wh, edges, minL){
  for (let i = 0; i < P.length; i++){ if (edges && !edges(i)) continue;
    const a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], L = Math.hypot(ex, ez); if (L < (minL || sp*0.9)) continue;
    const [nx, nz] = outN(P, i), n = Math.max(1, Math.round(L/sp)), ux = ex/L, uz = ez/L, st = L/n;
    for (let k = 0; k < n; k++){ const s = st*(k + 0.5), x = a[0] + ux*s + nx*off, z = a[1] + uz*s + nz*off;
      for (let y = y0; y + wh <= y1 + 0.01; y += fh) quadP(o, [x - ux*w/2, y, z - uz*w/2], [x + ux*w/2, y, z + uz*w/2], [x + ux*w/2, y + wh, z + uz*w/2], [x - ux*w/2, y + wh, z - uz*w/2]); }
  }
}
// projecting fins (perpendicular to the wall) every ~sp along every edge
function finsP(o, P, y0, y1, sp, d, edges){
  for (let i = 0; i < P.length; i++){ if (edges && !edges(i)) continue;
    const a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], L = Math.hypot(ex, ez); if (L < sp*0.7) continue;
    const [nx, nz] = outN(P, i), n = Math.max(1, Math.round(L/sp)), ux = ex/L, uz = ez/L, st = L/n;
    for (let k = 1; k < n; k++){ const x = a[0] + ux*st*k, z = a[1] + uz*st*k;
      quadP(o, [x, y0, z], [x + nx*d, y0, z + nz*d], [x + nx*d, y1, z + nz*d], [x, y1, z]); }
  }
}
// flat shape (2-D points [u, v]) in a vertical plane: origin p0, u along (ux, uz), v up, pushed `off` along the plane normal
const convex = P => { let sg = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], c = P[(i+2) % P.length], cr = (b[0]-a[0])*(c[1]-b[1]) - (b[1]-a[1])*(c[0]-b[0]);
  if (Math.abs(cr) < 1e-9) continue; if (!sg) sg = Math.sign(cr); else if (Math.sign(cr) !== sg) return false; } return true; };
function shapeP(o, pts, p0, ux, uz, off){
  const nx = uz, nz = -ux, T = convex(pts) ? pts.slice(2).map((q, i) => [0, i + 1, i + 2]) : triang(pts);
  const M = q => [p0[0] + ux*q[0] + nx*(off || 0), p0[1] + q[1], p0[2] + uz*q[0] + nz*(off || 0)];
  for (const t of T) triP(o, M(pts[t[0]]), M(pts[t[1]]), M(pts[t[2]]));
}
// round-headed opening outline (width w, total height h) as [u, v] points from its bottom centre
const archPts = (w, h, n) => { const r = w/2, P = [[-r, 0], [r, 0], [r, h - r]]; n = n || 8; for (let i = 1; i < n; i++){ const a = PI*i/n; P.push([Math.cos(a)*r, h - r + Math.sin(a)*r]); } P.push([-r, h - r]); return P; };
// a face of an edge of polygon P: returns (s, v, off) -> point, s along the edge from its start, v = height, off outward
const edgeF = (P, i) => { const a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], L = Math.hypot(ex, ez), ux = ex/L, uz = ez/L, [nx, nz] = outN(P, i);
  return {L, ux, uz, nx, nz, at:(s, v, off) => [a[0] + ux*s + nx*(off || 0), v, a[1] + uz*s + nz*(off || 0)]}; };
// low-poly tree into batches
function treeP(B, x, y, z, s, crown, trunk){
  const th = 2.8*s; segP(B.p(trunk), [x, y, z], [x, y + th, z], 0.22*s, 4);
  const c = B.p(crown), R = 2.4*s, cy = y + th + R*0.45, top = [x, cy + R*0.9, z], bot = [x, cy - R*0.55, z], ring = [];
  for (let i = 0; i < 6; i++){ const a = i/6*TAU + s*3.1; ring.push([x + Math.cos(a)*R, cy + ((i & 1) ? 0.3 : -0.2)*s, z + Math.sin(a)*R]); }
  for (let i = 0; i < 6; i++){ const j = (i+1) % 6; triP(c, top, ring[j], ring[i]); triP(c, bot, ring[i], ring[j]); }
}
const RED = {c:'#c22222', glow:'#ff2a1a', gk:2.4};

// =====================================================================================================================
// Empire State Building (Shreve, Lamb & Harmon, 1931): 102 floors, roof 381 m, tip 443.2 m. A five-storey base fills the
// 130 x 60 m lot on Fifth Avenue between 33rd and 34th Streets; the tower is set back 18 m from Fifth Avenue and the west lot
// line (less on the streets) and steps in at the 21st, 25th, 30th, 72nd, 81st and 85th floors to the 86th-floor observatory
// (320 m); the 61 m mooring mast (four tapering tiers, the 102nd-floor drum, 381 m) carries the 62 m antenna. Buff Indiana
// limestone piers with continuous vertical window bays (chrome-nickel steel mullions, aluminium spandrels). Plan per the OSM
// building parts (the tower sits ~2.5 m south of the lot centre). Night: lit windows on the shaft; the top tiers, the mast and
// the antenna floodlit in changing colours (the LED crown lighting). Frame origin = the tower axis; +x = Fifth Avenue.
LANDMARKS.nyempire = {zh:'帝国大厦', en:'Empire State Building', cat:'new', r:75, h:443,
  lt:{m:1, c:'#ffffff', k:0.75, e:0.75, anim:'cycle', c2:'#3d7bff'}, build(){
  const g = new THREE.Group(), B = mkB();
  const LIME = {c:'#dad0bb', m:0, lk:0.1}, STRIP = {c:'#8f959b', m:1, fh:3.72, cw:1.25}, PANE = {c:'#58616b', m:1, fh:3.72, cw:1.25}, ROOF = {c:'#7a7672', m:0, lk:0.06};
  const TOPL = {c:'#e4dac6', m:0, lk:1.55}, TOPS = {c:'#a7abae', m:0, lk:1.2}, MAST = {c:'#cfd1d2', m:0, lk:2.3}, MASTG = {c:'#5d6670', m:0, lk:1.1};
  const GRAN = {c:'#4f4b48', m:0, lk:0.25}, SHOP = {c:'#39424b', glow:'#ffd9a2', gk:0.55}, STEEL = {c:'#b9bcbf', m:0, lk:0.5};
  const L = B.p(LIME), S = B.p(STRIP), R = B.p(ROOF), TL = B.p(TOPL), TS = B.p(TOPS), M = B.p(MAST), MG = B.p(MASTG);
  // ---- the five-storey base on the lot (tower coordinates: lot z -32.3 .. 27.3)
  const LOT = rectP(-64.9, 64.9, -32.3, 27.3), YB = 20.2;
  abox(B.p(GRAN), -64.95, 64.95, -5, 0.2, -32.35, 27.35);
  wallsP(B.p(GRAN), LOT, 0, 5.4);
  wallsP(L, LOT, 5.4, YB); flatP(R, LOT, YB - 0.05);
  bandP(L, LOT, YB - 0.9, 1.5, 0.25);                                    // parapet coping
  stripsP(B.p(SHOP), LOT, 0.4, 4.6, 6.5, 4.8, 0.06);                      // shop fronts in granite surrounds
  stripsP(S, LOT, 6.6, YB - 1.4, 2.6, 1.3, 0.06);                         // window bays of floors 2-5
  panesP(B.p(PANE), LOT, 7.2, YB - 1.4, 2.6, 1.1, 0.09, 3.3, 2.3);
  // Fifth Avenue entrance (+x): three-storey recessed portal with a geometric transom, flanked by stone piers
  { const x = 64.95, F = (z, y) => [x, y, z];
    abox(L, 64.9, 66.0, 0, 18.4, -9.8, -7.6); abox(L, 64.9, 66.0, 0, 18.4, 2.6, 4.8); abox(L, 64.9, 66.2, 16.6, 18.6, -9.8, 4.8);
    quadP(B.p(SHOP), F(-7.6, 0.1), F(2.6, 0.1), F(2.6, 16.6), F(-7.6, 16.6));
    const T = B.p(STEEL); for (let k = 0; k <= 6; k++){ const z = -7.6 + k*10.2/6; quadP(T, [x + 0.12, 5, z - 0.12], [x + 0.12, 5, z + 0.12], [x + 0.12, 16.6, z + 0.12], [x + 0.12, 16.6, z - 0.12]); }
    for (const y of [5, 8.6, 12.4]) quadP(T, [x + 0.14, y, -7.6], [x + 0.14, y, 2.6], [x + 0.14, y + 0.35, 2.6], [x + 0.14, y + 0.35, -7.6]); }
  // 34th Street (-z) and 33rd Street (+z): two entrances each with a stainless-steel canopy and triple windows above
  for (const sz of [-1, 1]) for (const ex of [-27, 9]){
    const z = sz > 0 ? 27.3 : -32.3, zo = z + sz*2.6;
    abox(B.p(STEEL), ex - 4.5, ex + 4.5, 5.0, 5.8, Math.min(z, zo), Math.max(z, zo));
    quadP(B.p(SHOP), [ex - 3.2, 0.1, z + sz*0.08], [ex + 3.2, 0.1, z + sz*0.08], [ex + 3.2, 4.9, z + sz*0.08], [ex - 3.2, 4.9, z + sz*0.08]);
    abox(L, ex - 4.4, ex + 4.4, 5.8, 15.5, z - 0.3, z + 0.3); abox(S, ex - 3.4, ex + 3.4, 6.4, 14.8, z - 0.38, z + 0.38);
  }
  // ---- the tiers (plans from the OSM building parts, symmetrised)
  const T1 = [[-47.2,-20.6],[-35.6,-20.6],[-35.6,-25.2],[-14.1,-25.2],[-14.1,-20.6],[14.1,-20.6],[14.1,-25.2],[35.6,-25.2],[35.6,-20.6],[47.2,-20.6],[47.2,20.6],[35.6,20.6],[35.6,25.2],[14.1,25.2],[14.1,20.6],[-14.1,20.6],[-14.1,25.2],[-35.6,25.2],[-35.6,20.6],[-47.2,20.6]];
  const T2 = [[-35.6,-25.2],[-14.1,-25.2],[-14.1,-20.6],[14.1,-20.6],[14.1,-25.2],[35.6,-25.2],[35.6,-7.0],[34.0,-7.0],[34.0,7.6],[35.6,7.6],[35.6,25.2],[14.1,25.2],[14.1,20.6],[-14.1,20.6],[-14.1,25.2],[-35.6,25.2],[-35.6,7.6],[-34.0,7.6],[-34.0,-7.0],[-35.6,-7.0]];
  const T3 = [[-27.9,-20.65],[27.9,-20.65],[27.9,-14.2],[34.0,-14.2],[34.0,14.0],[27.9,14.0],[27.9,20.65],[-27.9,20.65],[-27.9,14.0],[-34.0,14.0],[-34.0,-14.2],[-27.9,-14.2]];
  const T4 = [[-27.9,-20.65],[-9.1,-20.65],[-9.1,-14.4],[9.1,-14.4],[9.1,-20.65],[27.9,-20.65],[27.9,20.65],[9.1,20.65],[9.1,14.4],[-9.1,14.4],[-9.1,20.65],[-27.9,20.65]];
  const T5 = [[-26.0,-18.6],[-11.1,-18.6],[-11.1,-14.3],[11.1,-14.3],[11.1,-18.6],[26.0,-18.6],[26.0,18.6],[11.1,18.6],[11.1,14.3],[-11.1,14.3],[-11.1,18.6],[-26.0,18.6]];
  const T6 = chamf(22.7, 14.45, 2.2), T7 = chamf(21.6, 13.4, 2.4), T8 = chamf(18.6, 10.4, 1.6);
  const tiers = [[T1, YB, 75.2, 0], [T2, 75.2, 90.0, 0], [T3, 90.0, 115.0, 0], [T4, 115.0, 255.4, 0], [T5, 255.4, 290.0, 1], [T6, 290.0, 309.6, 1], [T7, 309.6, 320.0, 1]];
  for (const [P, y0, y1, top] of tiers){
    const W = top ? TL : L, St = top ? TS : S;
    wallsP(W, P, y0, y1); flatP(R, P, y1 - 0.05);
    stripsP(St, P, y0 + 0.9, y1 - 1.1, 2.45, 1.12, 0.07, null, 1.6);
    if (!top) panesP(B.p(PANE), P, y0 + 1.5, y1 - 1.1, 2.45, 0.96, 0.1, 3.72, 2.25, null, 1.6);
    bandP(W, P, y1 - 0.8, 1.35, 0.18);                                   // stone coping at each setback
  }
  // 86th floor: parapet and the inward-curving safety fence round the open-air promenade, the enclosed observatory
  bandP(TL, T7, 320.0, 1.3, 0); bandP(B.p({c:'#8c9094', m:0, lk:0.9}), chamf(21.3, 13.1, 2.3), 321.3, 1.9, 0);
  wallsP(TL, T8, 320, 330.5); flatP(R, T8, 330.4); stripsP(TS, T8, 321.0, 329.6, 2.3, 1.3, 0.07, null, 1.5);
  bandP(TL, T8, 329.8, 1.0, 0.15);
  // ---- the mooring mast: four tapering tiers with corner buttresses and aluminium ribs, the 102nd-floor drum, the cap
  const mt = [[7.4, 2.6, 330.4, 339.0], [6.2, 2.1, 339.0, 349.5], [5.1, 1.7, 349.5, 359.5], [4.1, 1.3, 359.5, 367.5]];
  for (const [h, c, y0, y1] of mt){
    const P = chamf(h, h, c); wallsP(M, P, y0, y1); flatP(M, P, y1);
    stripsP(MG, P, y0 + 0.8, y1 - 0.6, 1.25, 0.55, 0.05);
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]){            // corner buttresses (fins) rising up the tier
      const d = h - c*0.5, p0 = [sx*d, y0, sz*d], p1 = [sx*(d + 0.95), y0, sz*(d + 0.95)], p2 = [sx*(d + 0.55), y1 - 0.5, sz*(d + 0.55)], p3 = [sx*d, y1 + 0.5, sz*d];
      quadP(M, p0, p1, p2, p3);
    }
  }
  cylP(MG, 0, 0, 3.4, 3.4, 367.5, 374.2, 16, false);
  for (let k = 0; k < 16; k++){ const a = k/16*TAU; segP(M, [Math.cos(a)*3.45, 367.5, Math.sin(a)*3.45], [Math.cos(a)*3.45, 374.2, Math.sin(a)*3.45], 0.16, 3); }
  cylP(M, 0, 0, 3.6, 3.0, 374.2, 376.0, 16, false); cylP(M, 0, 0, 3.0, 1.7, 376.0, 381.0, 16, true);
  // ---- the antenna (62 m)
  cylP(B.p({c:'#c4c7c9', m:0, lk:2.0}), 0, 0, 1.35, 1.05, 381.0, 396.0, 8, false);
  cylP(B.p({c:'#c4c7c9', m:0, lk:2.0}), 0, 0, 0.8, 0.6, 396.0, 416.0, 8, false);
  cylP(B.p({c:'#c4c7c9', m:0, lk:2.0}), 0, 0, 0.45, 0.32, 416.0, 434.0, 6, false);
  cylP(B.p({c:'#c4c7c9', m:0, lk:2.0}), 0, 0, 0.22, 0.06, 434.0, 442.6, 6, true);
  for (const [y, r] of [[396, 1.25], [416, 0.85], [434, 0.55]]) cylP(B.p(MAST), 0, 0, r, r, y - 0.4, y + 0.4, 8, true);
  cylP(B.p(RED), 0, 0, 0.18, 0.18, 442.5, 443.2, 6, true);
  for (const y of [381.4, 405]) for (const [sx, sz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) cylP(B.p(RED), sx*(y < 390 ? 1.5 : 0.8), sz*(y < 390 ? 1.5 : 0.8), 0.14, 0.14, y, y + 0.35, 4, true);
  B.flush(g); return g; }};
SG_PLACES.push({type:'nyempire', lat:40.7484225, lon:-73.9856728, rot:-0.5074});

// =====================================================================================================================
// Chrysler Building (William Van Alen, 1930): 77 floors, roof 282 m, spire tip 319 m, on the trapezoidal lot at Lexington
// Avenue (-x, the lot is on its east side) and 42nd Street (+z). Black granite ground floor and white marble lower floors; a 16-storey base round two light
// courts (north and south wings set back at about the 16th, 18th, 23rd/28th and 31st floors, OSM parts), the 31st-floor
// frieze of grey brick hubcaps with winged radiator-cap ornaments at the corners; the shaft (white brick piers, window bays with
// dark grey spandrels) rises without setbacks to the 61st floor, where steel eagle gargoyles project from the four corners.
// The crown: seven terraced arches in a cruciform groin vault, ribbed Nirosta stainless steel with radiating triangular
// windows (lit white at night), and the 38 m needle spire. Frame origin = the tower axis.
LANDMARKS.nychrysler = {zh:'克莱斯勒大厦', en:'Chrysler Building', cat:'new', r:50, h:319,
  lt:{m:1, c:'#fff4e2', k:0.7, anim:'none'}, build(){
  const g = new THREE.Group(), B = mkB();
  const WB = {c:'#e7e4dd', m:0, lk:0.1}, WIN = {c:'#7b8086', m:1, fh:3.66, cw:1.3}, PANE = {c:'#4e565f', m:1, fh:3.66, cw:1.3}, GB = {c:'#6c6f74', m:0, lk:0.1}, ROOF = {c:'#7b7975', m:0, lk:0.05};
  const ST = {c:'#c9ced3', m:0, lk:0.55}, CST = {c:'#c9ced3', m:0, lk:2.6}, ST2 = {c:'#8f969d', m:0, lk:2.0}, TRI = {c:'#3c444e', glow:'#f4f7ff', gk:1.9};
  const GR = {c:'#2e2c2b', m:0, lk:0.25}, MB = {c:'#ebe7dc', m:0, lk:0.45}, LOB = {c:'#3a4047', glow:'#ffd8a0', gk:0.6}, SPI = {c:'#d5d9dd', m:0, lk:3.4};
  const W = B.p(WB), S = B.p(WIN), G = B.p(GB), R = B.p(ROOF), T = B.p(ST), T2 = B.p(ST2);
  // ---- base: the lot (black granite ground floor, three floors of white marble)
  const LOT = [[-32.4,31.95],[-31.9,-30.85],[32.0,-30.45],[31.9,-21.75],[23.6,6.85],[19.5,32.55]];
  { const o = B.p(GR); wallsP(o, LOT, -5, 5.2); flatP(o, LOT, -5); }
  wallsP(B.p(MB), LOT, 5.2, 15.4); flatP(R, LOT, 15.35); bandP(B.p(MB), LOT, 14.8, 0.9, 0.2);
  stripsP(B.p(LOB), LOT, 0.5, 4.4, 5.2, 3.6, 0.06); stripsP(S, LOT, 6.0, 14.4, 2.4, 1.3, 0.06);
  // main entrances: Lexington Avenue (east) and 42nd Street (south), three storeys high in dark granite surrounds
  for (const [i, s0] of [[0, 31.4], [5, 27.0]]){ const F = edgeF(LOT, i);
    const o = B.p(GR);
    quadP(B.p(LOB), F.at(s0 - 3.2, 0.2, 0.32), F.at(s0 + 3.2, 0.2, 0.32), F.at(s0 + 3.2, 12.2, 0.32), F.at(s0 - 3.2, 12.2, 0.32));
    quadP(o, F.at(s0 - 4.6, 0, 0.3), F.at(s0 - 3.2, 0, 0.3), F.at(s0 - 3.2, 13.6, 0.3), F.at(s0 - 4.6, 13.6, 0.3));
    quadP(o, F.at(s0 + 3.2, 0, 0.3), F.at(s0 + 4.6, 0, 0.3), F.at(s0 + 4.6, 13.6, 0.3), F.at(s0 + 3.2, 13.6, 0.3));
    quadP(o, F.at(s0 - 4.6, 12.2, 0.3), F.at(s0 + 4.6, 12.2, 0.3), F.at(s0 + 4.6, 13.6, 0.3), F.at(s0 - 4.6, 13.6, 0.3)); }
  // the low annex on the east side of the lot (OSM: 10 m, between the Chrysler and its eastern neighbours)
  { const AX = [[20.0,29.9],[23.6,6.8],[24.9,2.4],[34.3,2.0],[34.2,29.9]];
    wallsP(B.p(GR), AX, -5, 4.6); wallsP(W, AX, 4.6, 10.2); flatP(R, AX, 10.15); bandP(G, AX, 9.4, 0.8, 0.12);
    stripsP(B.p(LOB), AX, 0.4, 4.0, 5.0, 3.8, 0.06, i => i === 4); stripsP(S, AX, 5.4, 9.0, 2.4, 1.3, 0.06, i => i >= 2); }
  // ---- the wings round the light courts, stepping back (OSM building parts)
  const NA = [[-32.0,-12.25],[-31.9,-30.85],[32.0,-30.45],[31.9,-21.75],[29.0,-11.85]], NB = rectP(-26.4, 26.1, -25.05, -11.75), NC = rectP(-23.5, 23.4, -22.25, -11.75), ND = rectP(-14.1, 14.6, -19.15, -11.75);
  const SA = [[-32.4,31.95],[-32.3,13.35],[22.5,13.55],[21.0,23.15],[19.5,32.55]], SB = [[-26.5,25.85],[-26.5,13.35],[21.0,13.35],[21.0,23.15],[20.5,26.15]], SC = [[-23.7,23.45],[-23.7,13.35],[22.5,13.55],[21.0,23.15]], SD = rectP(-14.4, 14.2, 11.75, 20.35);
  for (const [P, y0, y1] of [[NA, 15.4, 50], [NB, 50, 70], [NC, 70, 80], [ND, 80, 86], [SA, 15.4, 50], [SB, 50, 70], [SC, 70, 80], [SD, 80, 86]]){
    wallsP(W, P, y0, y1); flatP(R, P, y1 - 0.05); stripsP(S, P, y0 + 0.8, y1 - 1.0, 2.35, 0.95, 0.06, null, 1.6);
    panesP(B.p(PANE), P, y0 + 1.4, y1 - 1.0, 2.35, 0.8, 0.09, 3.66, 2.1, null, 1.6);
    bandP(G, P, y1 - 1.2, 1.2, 0.14); }
  // ---- the shaft (full rectangle to the 59th floor, then the cross plan to the 61st)
  const SH = rectP(-14.5, 14.5, -17.6, 17.6);
  const CR = [[-9.55,-17.6],[9.55,-17.6],[9.55,-12.5],[12.75,-9.6],[14.5,-9.6],[14.5,9.6],[12.75,9.6],[9.55,12.5],[9.55,17.6],[-9.55,17.6],[-9.55,12.5],[-12.75,9.6],[-14.5,9.6],[-14.5,-9.6],[-12.75,-9.6],[-9.55,-12.5]];
  wallsP(W, SH, 15.4, 185.2); flatP(R, SH, 185.1); stripsP(S, SH, 16.2, 184.0, 2.35, 0.95, 0.06);
  panesP(B.p(PANE), SH, 16.8, 184.0, 2.35, 0.8, 0.09, 3.66, 2.1); panesP(B.p(PANE), CR, 186.6, 198.4, 2.35, 0.8, 0.09, 3.66, 2.1, null, 2.0);
  wallsP(W, CR, 185.2, 199.4); flatP(R, CR, 199.3); stripsP(S, CR, 186.0, 198.4, 2.35, 0.95, 0.06, null, 2.0);
  bandP(G, SH, 184.2, 1.0, 0.12); bandP(G, CR, 198.4, 1.1, 0.14);
  // the 31st-floor frieze: grey brick band with hubcaps round the shaft and the top of the wings
  for (const P of [ND, SD]){ bandP(G, P, 86, 3.4, 0.1); flatP(R, P, 89.35); bandP(W, P, 89.4, 0.6, 0.1); }
  bandP(G, SH, 86, 3.4, 0.1);
  { const o = B.p(ST); for (const P of [SH, ND, SD]) for (let i = 0; i < P.length; i++){ const F = edgeF(P, i), n = Math.floor(F.L/2.6);
      for (let k = 0; k < n; k++){ const c = F.at((k + 0.5)*F.L/n, 87.7, 0.2); const pts = []; for (let j = 0; j < 8; j++){ const a = j/8*TAU; pts.push([Math.cos(a)*0.85, Math.sin(a)*0.85]); }
        shapeP(o, pts, [c[0], c[1], c[2]], F.ux, F.uz, 0); } } }
  // radiator-cap ornaments at the corners of the 31st-floor setback: winged steel caps projecting diagonally
  for (const [x, z] of [[-14.1,-19.15], [14.6,-19.15], [-14.4,20.35], [14.2,20.35]]){
    const sx = Math.sign(x), sz = Math.sign(z), y = 89.4;
    segP(T, [x, y + 1.0, z], [x + sx*2.6, y + 0.7, z + sz*2.6], 0.55, 6, 0.3);
    triP(T, [x, y + 0.6, z], [x - sx*4.2, y + 2.4, z], [x, y + 2.0, z]); triP(T, [x, y + 0.6, z], [x, y + 2.4, z - sz*4.2], [x, y + 2.0, z]);
    cylP(T, x, z, 0.8, 0.6, y, y + 2.2, 8, true); }
  // ---- the 61st floor: steel eagle gargoyles at the corners
  const UT = 11.1;
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]){
    const c = [sx*UT, 200.2, sz*UT], tip = [sx*(UT + 4.6), 199.4, sz*(UT + 4.6)];
    segP(T, c, tip, 0.75, 6, 0.42);
    boxP(T, 1.1, 1.0, 1.6, tip[0], 199.0, tip[2], sx*sz > 0 ? -PI/4 : PI/4);
    segP(T, [tip[0] + sx*0.5, 199.4, tip[2] + sz*0.5], [tip[0] + sx*1.5, 199.0, tip[2] + sz*1.5], 0.28, 4, 0.05);
    triP(T, [sx*UT, 199.8, sz*UT], [sx*(UT + 2.6), 200.6, sz*(UT + 2.6)], [sx*(UT - 2.5), 201.6, sz*UT]);
    triP(T, [sx*UT, 199.8, sz*UT], [sx*(UT + 2.6), 200.6, sz*(UT + 2.6)], [sx*UT, 201.6, sz*(UT - 2.5)]);
  }
  // ---- upper tower (61st floor to the crown)
  const UP = rectP(-UT, UT, -UT, UT);
  wallsP(W, UP, 199.4, 218.2); stripsP(S, UP, 200.4, 217.0, 2.2, 1.15, 0.06);
  // ---- the crown: seven terraced arches, each a cruciform groin vault (two crossing barrel vaults) on a square
  const AW = [11.1, 9.7, 8.3, 6.95, 5.65, 4.4, 3.2], AT = [229.3, 237.2, 244.8, 252.0, 258.8, 265.2, 271.4];
  const TW = B.p(TRI), CT = B.p(CST), NS = 14;
  for (let k = 0; k < 7; k++){
    const w = AW[k], sp = AT[k] - w, y0 = k ? AT[k-1] - AW[k-1]*0.35 : 218.2;
    wallsP(CT, rectP(-w, w, -w, w), y0, sp);
    for (const ax of [0, 1]){                          // barrel along x (ax 0) and along z (ax 1)
      const P = (u, ph) => { const a = w*Math.cos(ph), y = sp + w*Math.sin(ph); return ax ? [a, y, u] : [u, y, a]; };
      for (let i = 0; i < NS; i++){ const p0 = i/NS*PI, p1 = (i + 1)/NS*PI; quadP(CT, P(-w, p0), P(w, p0), P(w, p1), P(-w, p1)); }
    }
    // arch faces on the four sides with the radiating triangular windows and a darker rim
    for (let f = 0; f < 4; f++){
      const nx = [1, -1, 0, 0][f], nz = [0, 0, 1, -1][f];
      const p0 = [nx*w, sp, nz*w], u = [-nz, nx];      // u along the face (shapeP pushes along +normal)
      const semi = []; for (let i = 0; i <= NS; i++){ const a = i/NS*PI; semi.push([Math.cos(a)*w, Math.sin(a)*w]); }
      shapeP(CT, semi, p0, u[0], u[1], 0.0);
      const rim = []; for (let i = 0; i <= NS; i++){ const a = i/NS*PI; rim.push([Math.cos(a)*w, Math.sin(a)*w]); } for (let i = NS; i >= 0; i--){ const a = i/NS*PI; rim.push([Math.cos(a)*w*0.9, Math.sin(a)*w*0.9]); }
      shapeP(T2, rim, p0, u[0], u[1], 0.08);
      const n = k < 3 ? 9 : k < 5 ? 7 : 5, rb = 0.36*w, ra = 0.84*w, dl = 0.42*PI/n;
      for (let i = 0; i < n; i++){ const a = (i + 0.5)/n*PI;
        shapeP(TW, [[Math.cos(a - dl)*rb, Math.sin(a - dl)*rb], [Math.cos(a)*ra, Math.sin(a)*ra], [Math.cos(a + dl)*rb, Math.sin(a + dl)*rb]], p0, u[0], u[1], 0.12); }
      // small triangular windows on the wall below the spring line (the narrow setbacks)
      if (sp - y0 > 2.5) for (let i = -2; i <= 2; i++){ const c = i*w*0.36;
        shapeP(TW, [[c - 0.6, -2.2], [c + 0.6, -2.2], [c, -0.5]], p0, u[0], u[1], 0.1); }
    }
  }
  // ---- the spire
  { const P0 = rectP(-2.7, 2.7, -2.7, 2.7), P1 = rectP(-1.5, 1.5, -1.5, 1.5);
    loftP(CT, [P0.map(p => [p[0], 268.5, p[1]]), P1.map(p => [p[0], 282.0, p[1]])], true);
    cylP(B.p(SPI), 0, 0, 1.35, 0.06, 282.0, 318.7, 8, true);
    for (const y of [286, 292, 299]) cylP(B.p(SPI), 0, 0, 1.25 - (y - 282)*0.036, 1.15 - (y - 282)*0.036, y, y + 0.5, 8, true);
    cylP(B.p(RED), 0, 0, 0.12, 0.12, 318.6, 319.0, 4, true); }
  B.flush(g); return g; }};
SG_PLACES.push({type:'nychrysler', lat:40.7516019, lon:-73.9753329, rot:-0.4992});

// =====================================================================================================================
// One Vanderbilt (Kohn Pedersen Fox, 2020): roof 397 m, spire tip 427 m, on the block of Madison / Vanderbilt Avenues and
// 42nd / 43rd Streets, facing Grand Central (+x = Vanderbilt Avenue). Four interlocking tapering volumes, set back at 315 m
// (west and south), 330 m (east) and 350 m (north) round the core that ends in the crown (diagonal steel beams in open
// screens) and the spire; glass curtain walls with pearl-white terracotta spandrels on every floor. The base is cut away on a
// diagonal at the 42nd Street / Vanderbilt corner toward the terminal: a tall glazed lobby under a sloping soffit (15 m on 42nd
// Street rising to 34 m on Vanderbilt). Volume footprints follow the OSM parts; the crown is lit (LED, colour cycling).
LANDMARKS.nyvanderbilt = {zh:'范德比尔特一号', en:'One Vanderbilt', cat:'new', r:50, h:427,
  lt:{m:1, c:'#ffffff', k:0.75, e:0.6, anim:'cycle', c2:'#86b6ff'}, build(){
  const g = new THREE.Group(), B = mkB();
  const GL = {c:'#93a5b4', m:1, fh:4.6, cw:3.05}, TC = {c:'#e6dfd2', m:0, lk:0.12}, ROOF = {c:'#8a8782', m:0, lk:0.05};
  const CRW = {c:'#e2e7eb', m:0, lk:2.1}, BEAM = {c:'#9ea6ae', m:0, lk:1.3}, LOB = {c:'#46525c', glow:'#ffe2b8', gk:0.6}, SOF = {c:'#d8c8ad', glow:'#ffdcae', gk:0.32};
  const Gp = B.p(GL), Tp = B.p(TC), Rp = B.p(ROOF);
  const FH = 4.6, Y0 = 34;
  // a tapering volume: rectangle [x0, x1, z0, z1] at y = ya, rectangle t at y = yb; glass faces, terracotta spandrel bands
  // (one per floor, proud of the glass) and slim terracotta fins; mat overrides the materials above yc (the crown)
  function vol(b, t, ya, yb, yc, outer, dh){
    const at = (y, i) => { const u = (y - ya)/(yb - ya), q = [b[0] + (t[0] - b[0])*u, b[1] + (t[1] - b[1])*u, b[2] + (t[2] - b[2])*u, b[3] + (t[3] - b[3])*u];
      return [[q[0], y, q[2]], [q[1], y, q[2]], [q[1], y, q[3]], [q[0], y, q[3]]][i]; };
    const ytop = yc || yb, out = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    // the outer face folds back: its two corners stop dh lower and a sloping roof plane rises to the inner edge
    const yt = [0, 1, 2, 3].map(i => outer !== undefined && (i === outer || i === (outer + 1) % 4) ? ytop - dh : ytop);
    for (let i = 0; i < 4; i++){ const j = (i + 1) % 4, [nx, nz] = out[i];
      quadP(Gp, at(ya, i), at(ya, j), at(yt[j], j), at(yt[i], i));
      const off = (p, d) => [p[0] + nx*d, p[1], p[2] + nz*d], ym = Math.min(yt[i], yt[j]);
      for (let y = ya + FH; y < ym - 0.6; y += FH) quadP(Tp, off(at(y - 1.45, i), 0.16), off(at(y - 1.45, j), 0.16), off(at(y, j), 0.16), off(at(y, i), 0.16));
      const L = Math.hypot(at(ya, j)[0] - at(ya, i)[0], at(ya, j)[2] - at(ya, i)[2]), n = Math.max(2, Math.round(L/3.05));
      for (let k = 1; k < n; k++){ const f = k/n, yy = yt[i] + (yt[j] - yt[i])*f, P = y => { const a = at(y, i), c = at(y, j); return [a[0] + (c[0] - a[0])*f, y, a[2] + (c[2] - a[2])*f]; };
        const a = P(ya), c = P(yy), dx = at(ya, j)[0] - at(ya, i)[0], dz = at(ya, j)[2] - at(ya, i)[2], ll = Math.hypot(dx, dz), ux = dx/ll*0.2, uz = dz/ll*0.2;
        quadP(Tp, [a[0] - ux + nx*0.3, a[1], a[2] - uz + nz*0.3], [a[0] + ux + nx*0.3, a[1], a[2] + uz + nz*0.3], [c[0] + ux + nx*0.3, c[1], c[2] + uz + nz*0.3], [c[0] - ux + nx*0.3, c[1], c[2] - uz + nz*0.3]); }
      if (yt[i] !== yt[j]) triP(Gp, at(ym, i), at(ym, j), yt[i] > yt[j] ? at(yt[i], i) : at(yt[j], j));
    }
    const top = [0, 1, 2, 3].map(i => at(yt[i], i)); quadP(outer !== undefined ? Gp : Rp, top[0], top[1], top[2], top[3]);
    // edge trim along the top
    for (let i = 0; i < 4; i++){ const j = (i + 1) % 4; segP(Tp, at(yt[i], i), at(yt[j], j), 0.45, 4); }
    return at;
  }
  // ---- base (0 - 34 m): the lot without the cut-away corner
  const BP = [[-30.4,30.3],[-30.4,24.2],[-32.6,24.1],[-32.4,-30.1],[32.6,-30.3],[32.55,3.8],[6.0,30.3]];
  { const o = B.p(TC); wallsP(o, BP, -5, 0.2); flatP(o, BP, -5); }
  wallsP(Gp, BP, 0.2, Y0, i => i !== 5); flatP(Rp, BP, Y0 - 0.1);
  for (let y = 9.2 + FH; y < Y0; y += FH) bandP(Tp, BP, y - 1.05, 1.05, 0.16, i => i !== 5);
  bandP(Tp, BP, 8.4, 1.2, 0.2, i => i !== 5);
  stripsP(Tp, BP, 0.2, Y0, 3.05, 0.32, 0.3, i => i !== 5);
  stripsP(B.p(LOB), BP, 0.6, 7.9, 6.1, 5.2, 0.08, i => i !== 5);
  // the cut-away corner toward Grand Central: glazed lobby wall on the diagonal, sloping soffit, wedge face on 42nd Street
  { const A = [6.0, 30.3], Bq = [32.55, 3.8], o = B.p(LOB);
    quadP(o, [A[0], 0.2, A[1]], [Bq[0], 0.2, Bq[1]], [Bq[0], 34, Bq[1]], [A[0], 15, A[1]]);
    for (let k = 1; k < 12; k++){ const f = k/12, x = A[0] + (Bq[0] - A[0])*f, z = A[1] + (Bq[1] - A[1])*f; segP(Tp, [x, 0.2, z], [x, 15 + 19*f, z], 0.22, 4); }
    triP(B.p(SOF), [A[0], 15, A[1]], [Bq[0], 34, Bq[1]], [32.55, 34, 30.3]);
    triP(Tp, [A[0], 15, A[1]], [32.55, 34, 30.3], [A[0], 34, 30.3]);
    triP(Tp, [Bq[0], 34, Bq[1]], [32.55, 34, 30.3], [32.55, 34, 30.3]); }
  // plaza paving under the cut-away corner (also keeps the ground plan on the whole lot)
  { const o = B.p({c:'#c9c3b8', m:0, lk:0.3}), PZ = [[6.0,30.3],[28.7,30.2],[28.7,20.9],[32.5,20.9],[32.55,3.8]]; flatP(o, PZ, 0.12); wallsP(o, PZ, -0.6, 0.12); }
  // ---- the four tapering volumes
  vol([-32.4, -10, -24, 30.3], [-23, -8, -14, 21], Y0, 315, 0, 3, 16);        // west
  vol([-32.4, 20, 12, 30.3], [-23, 8, 8, 21], Y0, 315, 0, 2, 16);              // south (over the cut-away)
  vol([2, 32.55, -26, 30.3], [7.5, 22.6, -17.8, 15.2], Y0, 330, 0, 1, 16);     // east (Vanderbilt Avenue)
  vol([-32.4, 32.55, -30.3, -8], [-12, 23.4, -27.4, -13.6], Y0, 350, 0, 0, 16);   // north (43rd Street)
  const at = vol([-18, 24, -24, 18], [-3.7, 13.7, -13.8, 3.7], Y0, 397, 362);   // core, glass up to 362 m
  // ---- the crown (362 - 397 m): open screens of glass and terracotta crossed by sloping steel beams, lit at night
  { const C = B.p(CRW), Bm = B.p(BEAM);
    for (let i = 0; i < 4; i++){ const j = (i + 1) % 4;
      quadP(C, at(362, i), at(362, j), at(397, j), at(397, i));
      const P = (f, y) => { const a = at(y, i), c = at(y, j); return [a[0] + (c[0] - a[0])*f, y, a[2] + (c[2] - a[2])*f]; };
      const out = [[0, -1], [1, 0], [0, 1], [-1, 0]][i], o = (p) => [p[0] + out[0]*0.35, p[1], p[2] + out[1]*0.35];
      for (const [f0, f1] of [[0, 0.5], [0.5, 1], [0, 1]]) { segP(Bm, o(P(f0, 362)), o(P(f1, 397)), 0.45, 4); segP(Bm, o(P(f1, 362)), o(P(f0, 397)), 0.45, 4); }
      for (const y of [370, 379, 388]) segP(Bm, o(P(0, y)), o(P(1, y)), 0.3, 4);
      segP(Bm, o(P(0, 397)), o(P(1, 397)), 0.5, 4);
    }
    quadP(Rp, at(396, 0), at(396, 1), at(396, 2), at(396, 3));
  }
  // ---- the spire
  cylP(B.p({c:'#c9cdd1', m:0, lk:1.6}), 7.45, -8.7, 1.1, 0.14, 397, 426.6, 8, true);
  cylP(B.p({c:'#c9cdd1', m:0, lk:1.6}), 7.45, -8.7, 1.8, 1.4, 397, 400, 8, true);
  cylP(B.p(RED), 7.45, -8.7, 0.13, 0.13, 426.5, 427, 4, true);
  B.flush(g); return g; }};
SG_PLACES.push({type:'nyvanderbilt', lat:40.7529712, lon:-73.9785420, rot:-0.4969});

// =====================================================================================================================
// Grand Central Terminal (Reed & Stem, Warren & Wetmore, 1913): Beaux-Arts head house on 42nd Street (+z), Vanderbilt Avenue
// (-x) and Depew Place (+x). The Park Avenue Viaduct (drawn by the app at 6.6 m) wraps round the building inside its footprint:
// this model keeps clear of the deck (>= 5 m from its centreline) - a granite ground storey runs under the viaduct to the
// sidewalk with the 42nd Street entrances, and the head house rises behind the viaduct. 42nd Street facade (91 m): three
// 18 m arched windows between four pairs of columns, entablature, cornice and attic, the 4 m clock in the centre of the attic and
// the 15 m sculpture group above (abstract forms). Behind it the Main Concourse block (84 x 37 m, 38 m high) with three great
// arched windows at each end and its copper roof; lower wings to the north. Stony Creek granite base, Indiana limestone.
LANDMARKS.nygrandcentral = {zh:'纽约中央车站', en:'Grand Central Terminal', cat:'old', r:80, h:46,
  lt:{m:0, c:'#ffd8a0', k:1.0, e:0.6, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB();
  const LIM = {c:'#dcd2c0', m:0}, GRN = {c:'#b0a196', m:0}, WIN = {c:'#4a535b', glow:'#ffd9a0', gk:0.3}, MUL = {c:'#5b6165', m:0, lk:0.2};
  const COP = {c:'#6f9c8b', m:0, lk:0.25}, ROOF = {c:'#8a8680', m:0, lk:0.05}, CLK = {c:'#efe0a8', glow:'#fff0c4', gk:1.25}, SCU = {c:'#cbbfab', m:0, lk:1.5};
  const LOB = {c:'#3d454d', glow:'#ffd7a0', gk:0.55}, BRZ = {c:'#6a5a40', m:0, lk:0.4};
  const L = B.p(LIM), Gr = B.p(GRN), Wn = B.p(WIN), Mu = B.p(MUL), R = B.p(ROOF);
  const C0 = -1.5, YP = 5.0;
  // ---- the ground storey on the whole footprint (under the viaduct decks on the south, west and east)
  const RING = [[-60.6,52.0],[-59.4,-51.6],[59.4,-52.1],[60.6,51.6]];
  wallsP(Gr, RING, -5, YP); flatP(R, RING, YP - 0.05); flatP(Gr, RING, -5); bandP(Gr, RING, YP - 0.6, 0.6, 0.25);
  { const F = edgeF(RING, 3), o = B.p(LOB);               // 42nd Street entrances under the viaduct
    for (const dx of [-17, -8.5, 0, 8.5, 17]){ const s = F.L - (C0 + dx - (-60.6)) * F.L/121.2, w = dx ? 4.2 : 6.0;
      shapeP(o, archPts(w, 4.3, 8), F.at(s, 0.2, 0.06), F.ux, F.uz, 0); } }
  stripsP(B.p(LOB), RING, 0.6, 3.6, 7.5, 3.0, 0.06, i => i === 0 || i === 2);
  // ---- head house: south block behind the 42nd Street facade, the concourse block, the northern wings
  const HS = [[-47,8],[44,8],[44,34.1],[40.5,37.6],[-43.5,37.6],[-47,34.1]];
  wallsP(L, HS, YP, 28.5); flatP(R, HS, 30.0);
  const NB = rectP(-47, 44, -51.6, 8);
  wallsP(L, NB, YP, 26); flatP(R, NB, 25.95); bandP(L, NB, 24.6, 1.4, 0.35);
  stripsP(Wn, NB, 8, 23.5, 4.2, 1.6, 0.06, i => i === 0 || i === 1 || i === 3);
  const CB = rectP(C0 - 42, C0 + 42, -30, 8);
  wallsP(L, CB, 26, 36.5); bandP(L, CB, 33.0, 1.3, 0.6); bandP(L, CB, 34.3, 2.2, 0.15);
  // copper hip roof over the Main Concourse
  { const o = B.p(COP), x0 = C0 - 42.3, x1 = C0 + 42.3, z0 = -30.3, z1 = 8.3, zc = -11, y0 = 36.5, y1 = 43.0, k = 19;
    quadP(o, [x0, y0, z0], [x1, y0, z0], [x1 - k, y1, zc], [x0 + k, y1, zc]); quadP(o, [x1, y0, z1], [x0, y0, z1], [x0 + k, y1, zc], [x1 - k, y1, zc]);
    triP(o, [x0, y0, z0], [x0 + k, y1, zc], [x0, y0, z1]); triP(o, [x1, y0, z1], [x1 - k, y1, zc], [x1, y0, z0]);
    abox(B.p(COP), C0 - 20, C0 + 17, 43.0, 43.5, -11.4, -10.6); }
  // ---- the 42nd Street facade (plane z = 37.6, facing +z)
  const ZF = 37.6, F = (x, y, d) => [x, y, ZF + (d || 0)];
  for (const dx of [-15.5, 0, 15.5]){ const x = C0 + dx;
    shapeP(Wn, archPts(9.1, 18.6, 12), F(x, 8.4, 0.05), 1, 0, 0);
    shapeP(L, archPts(10.8, 19.5, 12), F(x, 7.9, 0.02), 1, 0, 0);
    for (const u of [-3.0, -1.5, 0, 1.5, 3.0]) quadP(Mu, F(x + u - 0.1, 8.4, 0.12), F(x + u + 0.1, 8.4, 0.12), F(x + u + 0.1, 8.4 + 18.6 - 4.55 + Math.sqrt(Math.max(0, 4.55*4.55 - u*u)), 0.12), F(x + u - 0.1, 8.4 + 18.6 - 4.55 + Math.sqrt(Math.max(0, 4.55*4.55 - u*u)), 0.12));
    for (const y of [12.0, 15.6, 19.2]) quadP(Mu, F(x - 4.55, y, 0.13), F(x + 4.55, y, 0.13), F(x + 4.55, y + 0.25, 0.13), F(x - 4.55, y + 0.25, 0.13));
  }
  // paired columns (fluted, on pedestals), entablature, cornice, attic
  for (const dx of [-23.25, -7.75, 7.75, 23.25]) for (const u of [-1.35, 1.35]){ const x = C0 + dx + u;
    abox(L, x - 1.0, x + 1.0, YP, 6.6, ZF, ZF + 1.45);
    cylP(L, x, ZF + 0.6, 0.78, 0.7, 6.6, 24.9, 12, false);
    abox(L, x - 1.05, x + 1.05, 24.9, 25.7, ZF, ZF + 1.5); }
  abox(L, -43.5, 40.5, 25.7, 28.5, ZF, ZF + 1.3);
  abox(L, -44.0, 41.0, 28.5, 30.0, ZF - 0.3, ZF + 1.65);
  wallsP(L, HS, 30.0, 34.0, i => i >= 2); abox(L, C0 - 13, C0 + 13, 34.0, 36.4, ZF - 1.5, ZF + 0.4);
  // side bays: stacked windows between pilasters
  for (const sx of [-1, 1]) for (const dx of [31, 38.5]){ const x = C0 + sx*dx;
    for (const [y0, y1] of [[8, 13], [15, 20], [21.8, 24.6]]) quadP(Wn, F(x - 1.4, y0, 0.05), F(x + 1.4, y0, 0.05), F(x + 1.4, y1, 0.05), F(x - 1.4, y1, 0.05));
    abox(L, x + 2.1, x + 3.3, YP, 25.7, ZF, ZF + 0.6); abox(L, x - 3.3, x - 2.1, YP, 25.7, ZF, ZF + 0.6); }
  // the clock (4 m) in a round broken pediment, flanked by cornucopias, under the sculpture group
  { const cp = []; for (let i = 0; i < 20; i++){ const a = i/20*TAU; cp.push([Math.cos(a)*2.0, Math.sin(a)*2.0]); }
    shapeP(B.p(CLK), cp, F(C0, 32.3, 0.55), 1, 0, 0);
    const rim = []; for (let i = 0; i <= 20; i++){ const a = i/20*TAU; rim.push([Math.cos(a)*2.45, Math.sin(a)*2.45]); } for (let i = 20; i >= 0; i--){ const a = i/20*TAU; rim.push([Math.cos(a)*2.0, Math.sin(a)*2.0]); }
    shapeP(B.p(BRZ), rim.slice(0, 21).concat(rim.slice(21)), F(C0, 32.3, 0.6), 1, 0, 0);
    for (const sx of [-1, 1]){ segP(L, F(C0 + sx*2.6, 31.0, 0.5), F(C0 + sx*5.6, 32.6, 0.4), 0.9, 6, 0.25); } }
  // sculpture group (Mercury flanked by Hercules and Minerva, ~15 m wide): abstract figures on the attic
  { const S = B.p(SCU), y = 36.4, z = ZF - 0.6;
    abox(S, C0 - 7.6, C0 + 7.6, y, y + 1.1, z - 1.6, z + 1.2);
    // Mercury, standing at the centre: body, cloak, raised arm, winged helmet
    segP(S, [C0, y + 1.1, z], [C0, y + 4.2, z + 0.1], 1.25, 8, 1.05); segP(S, [C0, y + 4.2, z + 0.1], [C0, y + 7.0, z], 1.05, 8, 0.8);
    cylP(S, C0, z, 0.62, 0.55, y + 7.0, y + 8.3, 8, true);
    triP(S, [C0 - 1.0, y + 7.2, z - 0.5], [C0 + 1.0, y + 7.2, z - 0.5], [C0 + 0.2, y + 1.4, z - 2.2]);
    segP(S, [C0 + 0.9, y + 6.4, z], [C0 + 2.6, y + 8.6, z + 0.4], 0.38, 5); segP(S, [C0 - 0.9, y + 6.2, z], [C0 - 2.2, y + 4.8, z + 0.6], 0.38, 5);
    for (const sx of [-1, 1]) triP(S, [C0 + sx*0.4, y + 8.0, z], [C0 + sx*1.5, y + 9.0, z - 0.3], [C0 + sx*0.5, y + 8.6, z]);
    // Hercules (west) and Minerva (east), reclining toward the corners
    for (const sx of [-1, 1]){ const x = C0 + sx*3.2;
      segP(S, [x, y + 1.5, z + 0.2], [x + sx*3.6, y + 1.5, z + 0.5], 0.95, 7, 0.7);
      segP(S, [x + sx*0.2, y + 1.6, z], [x - sx*0.3, y + 4.4, z - 0.2], 1.0, 7, 0.8);
      cylP(S, x - sx*0.35, z - 0.2, 0.5, 0.46, y + 4.4, y + 5.4, 8, true);
      segP(S, [x - sx*0.2, y + 3.8, z], [x + sx*1.6, y + 3.0, z + 0.6], 0.32, 5); }
    // the eagle over the clock
    triP(S, [C0 - 2.6, y - 0.2, z + 1.0], [C0, y + 0.9, z + 1.2], [C0, y - 0.6, z + 1.1]); triP(S, [C0 + 2.6, y - 0.2, z + 1.0], [C0, y + 0.9, z + 1.2], [C0, y - 0.6, z + 1.1]); }
  // ---- the Main Concourse ends (Vanderbilt Avenue / Depew Place): three great arched windows between paired columns
  for (const sx of [-1, 1]){ const xF = C0 + sx*42, ux = 0, uz = -sx, P0 = (z, y, d) => [xF + sx*(d || 0), y, z];
    for (const dz of [-11.5, 0, 11.5]){ const z = -11 + dz;
      shapeP(L, archPts(9.6, 19.0, 12), P0(z, 11.4, 0.02), ux, uz, 0);
      shapeP(Wn, archPts(8.2, 18.0, 12), P0(z, 11.9, 0.06), ux, uz, 0);
      for (const u of [-2.0, 0, 2.0]) quadP(Mu, P0(z + u - 0.1, 11.9, 0.12), P0(z + u + 0.1, 11.9, 0.12), P0(z + u + 0.1, 11.9 + 13.9 + Math.sqrt(Math.max(0, 16.8 - u*u)), 0.12), P0(z + u - 0.1, 11.9 + 13.9 + Math.sqrt(Math.max(0, 16.8 - u*u)), 0.12));
      for (const y of [16.5, 21.5]) quadP(Mu, P0(z - 4.1, y, 0.13), P0(z + 4.1, y, 0.13), P0(z + 4.1, y + 0.25, 0.13), P0(z - 4.1, y + 0.25, 0.13)); }
    for (const dz of [-17.25, -5.75, 5.75, 17.25]) for (const u of [-1.2, 1.2]){ const z = -11 + dz + u;
      cylP(L, xF + sx*0.8, z, 0.72, 0.66, 26.0, 32.8, 10, false); abox(L, xF - 0.9 + sx*0.8, xF + 0.9 + sx*0.8, 32.8, 33.4, z - 0.9, z + 0.9); }
    for (let k = 0; k < 6; k++){ const z = -27 + k*6.4; quadP(Wn, P0(z - 1.2, 9, 0.05), P0(z + 1.2, 9, 0.05), P0(z + 1.2, 23, 0.05), P0(z - 1.2, 23, 0.05)); }
  }
  // south block side walls (x = -47 / 44) and its roof parapet
  stripsP(Wn, HS, 8.5, 24.5, 4.3, 1.5, 0.06, i => i === 1 || i === 5);
  bandP(L, HS, 26.4, 2.1, 0.3, i => i !== 0);
  B.flush(g); return g; }};
SG_PLACES.push({type:'nygrandcentral', lat:40.7526527, lon:-73.9772775, rot:-0.5166});

// inward offset of a convex polygon by d (edges moved in, corners re-intersected)
function insetP(P, d){
  const n = P.length, s = area2(P) > 0 ? 1 : -1, Ls = [];
  for (let i = 0; i < n; i++){ const a = P[i], b = P[(i+1) % n], ex = b[0]-a[0], ez = b[1]-a[1], l = Math.hypot(ex, ez); Ls.push([a[0] - ez/l*s*d, a[1] + ex/l*s*d, ex, ez]); }
  const out = [];
  for (let i = 0; i < n; i++){ const p = Ls[(i + n - 1) % n], q = Ls[i], den = p[2]*q[3] - p[3]*q[2];
    if (Math.abs(den) < 1e-9){ out.push([q[0], q[1]]); continue; }
    const t = ((q[0]-p[0])*q[3] - (q[1]-p[1])*q[2])/den; out.push([p[0] + p[2]*t, p[1] + p[3]*t]); }
  return out;
}

// =====================================================================================================================
// MetLife Building (Pan Am Building; Emery Roth & Sons with Walter Gropius and Pietro Belluschi, 1963): 59 floors, 246 m, an
// elongated octagonal slab (91 x 42 m, broad faces north and south) standing across Park Avenue on a base over the northern
// end of Grand Central. Precast concrete grid - deep vertical mullion fins and window bands - interrupted by two recessed,
// louvred mechanical floors (21st and 46th) and the mechanical crown. The Park Avenue Viaduct roadways (drawn by the app)
// pass outside the base on both sides. Plan per the OSM parts: base 30 m on the lot, a setback to 38 m, then the tower.
LANDMARKS.nymetlife = {zh:'大都会人寿大厦', en:'MetLife Building', cat:'new', r:75, h:246,
  lt:{m:1, c:'#fff0d8', k:0.6, anim:'none'}, build(){
  const g = new THREE.Group(), B = mkB();
  const CON = {c:'#bdb9b0', m:0, lk:0.1}, GLS = {c:'#59646e', m:1, fh:3.81, cw:1.55}, LOU = {c:'#55595d', m:0, lk:0.12}, ROOF = {c:'#7d7a75', m:0, lk:0.05}, LOB = {c:'#3d454d', glow:'#ffd7a0', gk:0.5};
  const C = B.p(CON), Gs = B.p(GLS), Lo = B.p(LOU), R = B.p(ROOF);
  const FH = 3.81;
  // ---- base (0 - 30 m) and the setback storey (30 - 38 m)
  const LOT = [[-39.8,56.6],[-39.7,40.0],[-45.5,40.0],[-45.5,-56.6],[45.5,-56.6],[45.5,40.0],[39.4,40.0],[39.3,56.6]];
  wallsP(C, LOT, -5, 30); flatP(R, LOT, 29.95); flatP(C, LOT, -5); bandP(C, LOT, 28.8, 1.6, 0.3);
  for (let y = 6.5; y < 28; y += 4.25) bandP(Gs, LOT, y, 2.5, 0.05);
  finsP(C, LOT, 6.0, 28.8, 1.55, 0.45);
  stripsP(B.p(LOB), LOT, 0.4, 5.0, 8.0, 6.0, 0.06, i => i === 3 || i === 5);
  const S2 = [[-39.3,32.2],[-39.3,-44.1],[39.1,-44.1],[39.1,32.2],[30.7,32.2],[30.7,38.85],[-33,38.85],[-33,32.2]];
  wallsP(C, S2, 30, 38); flatP(R, S2, 37.95); bandP(Gs, S2, 31.6, 2.6, 0.05); bandP(C, S2, 37.0, 1.2, 0.25);
  // ---- the tower
  const TW = [[-21,-10],[21,-10],[45.5,-3.2],[45.5,25.6],[21,32.4],[-21,32.4],[-45.5,25.6],[-45.5,-3.2]], TI = insetP(TW, 1.3), TL = insetP(TW, 0.7);
  const segs = [[38, 84.4], [92.0, 179.0], [186.6, 238.4]];
  for (const [y0, y1] of segs){
    wallsP(C, TW, y0, y1);
    for (let y = y0 + 1.0; y + 2.1 < y1; y += FH) bandP(Gs, TW, y, 2.1, 0.05);
    finsP(C, TW, y0, y1, 1.55, 0.6);
    bandP(C, TW, y1 - 0.5, 0.5, 0.65);
  }
  for (const [y0, y1] of [[84.4, 92.0], [179.0, 186.6]]){ wallsP(Lo, TI, y0, y1); flatP(C, TW, y0 - 0.02); }
  for (const [y0, y1] of [[84.4, 92.0], [179.0, 186.6]]) for (let y = y0 + 0.6; y < y1 - 0.3; y += 0.9) bandP(C, TI, y, 0.12, 0.12);
  // the mechanical crown: louvred band, coping, roof
  wallsP(Lo, TL, 238.4, 245.2); for (let y = 239.0; y < 245; y += 0.9) bandP(C, TL, y, 0.12, 0.1);
  wallsP(C, TW, 245.2, 246.0); bandP(C, TW, 245.2, 0.8, 0.2); flatP(R, TW, 245.95);
  abox(C, -12, 12, 245.9, 249.5, 2, 20); cylP(B.p(RED), 0, 11, 0.15, 0.15, 249.5, 250.2, 4, true);
  B.flush(g); return g; }};
SG_PLACES.push({type:'nymetlife', lat:40.7535060, lon:-73.9766579, rot:-0.5061});

// =====================================================================================================================
// New York Public Library, Stephen A. Schwarzman Building (Carrère and Hastings, 1911): Beaux-Arts, white Vermont marble on a
// granite base, 120 x 82 m between 40th and 42nd Streets, facing Fifth Avenue (+x) across its 27 m terrace. Fifth Avenue
// facade: the central portico (three arches, six Corinthian columns - singles at the ends, pairs between the arches - and the
// attic with six statues), fountain alcoves, five column-framed window bays each side and pedimented end pavilions; cornice and
// balustrade. The terrace with its granite balustrade, the grand stairway at 41st Street flanked by the two marble lions on
// their pedestals, two rows of locust trees, flagpoles. Behind: the reading-room wing on Bryant Park (stack windows below,
// nine great arched windows above, hip roof) and the gabled catalogue room on the axis. Lawns with trees on 42nd / 40th St.
LANDMARKS.nynypl = {zh:'纽约公共图书馆', en:'New York Public Library', cat:'old', r:96, h:32,
  lt:{m:0, c:'#ffe2b8', k:1.05, e:0.6, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB();
  const MAR = {c:'#e9e3d6', m:0}, GRA = {c:'#b9b2a6', m:0, lk:0.6}, RF = {c:'#7c8580', m:0, lk:0.05}, FL = {c:'#8a8680', m:0, lk:0.05};
  const WIN = {c:'#454c52', glow:'#ffdcaa', gk:0.3}, DOOR = {c:'#4d3f2c', glow:'#ffd49a', gk:0.5}, PAVE = {c:'#cbc4b8', m:0, lk:0.35};
  const LION = {c:'#cdbeab', m:0, lk:1.1}, LAWN = {c:'#6e9554', m:0, lk:0.04}, CRN = {c:'#5e8a45', m:0, lk:0.04}, TRK = {c:'#5b4a3a', m:0, lk:0.04};
  const M = B.p(MAR), Gr = B.p(GRA), Wn = B.p(WIN), Pv = B.p(PAVE);
  const XF = 37.0, ZC = 1.75, YT = 1.2;          // facade plane, portico axis, terrace level
  // ---- grounds: terrace on Fifth Avenue, lawns on 42nd and 40th Streets
  abox(Pv, XF, 64, -5, YT, -56.4, 56.6);
  for (const [z0, z1] of [[-69, -56.4], [56.6, 69]]){ abox(B.p(LAWN), -42.6, 64, -5, 0.25, z0, z1); }
  abox(Gr, 63.2, 64, YT, YT + 1.0, -56.4, ZC - 8.6); abox(Gr, 63.2, 64, YT, YT + 1.0, ZC + 8.6, 56.6);
  for (let z = -55; z < 56; z += 2.6) if (Math.abs(z - ZC) > 9) abox(Gr, 63.1, 64.1, YT, YT + 1.25, z - 0.3, z + 0.3);
  for (let k = 0; k < 6; k++){ const x = 58.2 + k, y = YT - (k + 1)*0.2; abox(Pv, x, x + 1, -5, y + 0.2, ZC - 8.6, ZC + 8.6); }
  // the lions (Patience to the south, Fortitude to the north) on pedestals at the foot of the stairway, facing the avenue
  for (const sz of [-1, 1]){ const z = ZC + sz*10.4, x = 60.2;
    abox(Gr, x - 2.6, x + 2.6, -1, YT + 1.6, z - 1.1, z + 1.1);
    const L = B.p(LION), y = YT + 1.6;
    abox(L, x - 2.0, x + 1.0, y, y + 0.55, z - 0.75, z + 0.75);
    segP(L, [x - 1.8, y + 0.75, z], [x + 0.6, y + 0.9, z], 0.62, 8, 0.66);
    segP(L, [x + 0.6, y + 0.9, z], [x + 1.15, y + 1.5, z], 0.72, 8, 0.6);
    cylP(L, x + 1.45, z, 0.42, 0.34, y + 1.2, y + 1.85, 8, true);
    for (const dz of [-0.45, 0.45]) segP(L, [x + 1.0, y + 0.3, z + dz], [x + 2.0, y + 0.3, z + dz], 0.22, 5);
    segP(L, [x - 1.9, y + 0.6, z + 0.5], [x - 0.4, y + 0.2, z + 0.85], 0.12, 4); }
  // flagpoles and the two rows of trees along the terrace edge
  for (const sz of [-1, 1]){ const z = ZC + sz*15; cylP(B.p({c:'#8a7a55', m:0, lk:0.6}), 56, z, 0.7, 0.55, YT, YT + 2.2, 8, true); segP(B.p({c:'#c9c9c4', m:0, lk:0.8}), [56, YT + 2.2, z], [56, YT + 24, z], 0.16, 6, 0.08); }
  for (const x of [57.5, 61.5]) for (let z = ZC + 18; z < 55; z += 6.6) for (const sz of [-1, 1]){ const zz = sz > 0 ? z : 2*ZC - z; if (Math.abs(zz) < 55) treeP(B, x, YT, zz, 1.25, CRN, TRK); }
  for (let x = -36; x < 60; x += 8.5) for (const z of [-64, 64]) treeP(B, x, 0.25, z, 1.45, CRN, TRK);
  // ---- the building: east wing (to the cornice), west reading-room wing, central catalogue-room wing, courts
  const MAIN = rectP(-42.6, XF, -56.4, 56.6);
  wallsP(Gr, MAIN, -5, YT + 1.4); wallsP(M, MAIN, YT + 1.4, 20.5); bandP(M, MAIN, 18.6, 1.9, 0.9); bandP(M, MAIN, 20.5, 1.5, 0.3);
  flatP(B.p(FL), MAIN, 15.0);
  const WW = rectP(-42.6, -12, -54.5, 54.5), CW = rectP(-27, 24.8, -12.7, 18), EW = rectP(12, XF, -56.4, 56.6);
  wallsP(M, WW, 15, 26.5); bandP(M, WW, 25.3, 1.2, 0.6); flatP(B.p(FL), EW, 20.45);
  wallsP(M, CW, 15, 24.5); bandP(M, CW, 23.4, 1.1, 0.5); wallsP(M, EW, 15, 20.5, i => i === 3);
  { const o = B.p(RF);                                         // hip roof over the reading room, gable over the catalogue room
    const x0 = -42.6, x1 = -12, z0 = -54.5, z1 = 54.5, y0 = 26.5, y1 = 31.5, xc = (x0 + x1)/2, k = 9;
    quadP(o, [x0, y0, z0], [x0, y0, z1], [xc, y1, z1 - k], [xc, y1, z0 + k]); quadP(o, [x1, y0, z1], [x1, y0, z0], [xc, y1, z0 + k], [xc, y1, z1 - k]);
    triP(o, [x0, y0, z0], [xc, y1, z0 + k], [x1, y0, z0]); triP(o, [x1, y0, z1], [xc, y1, z1 - k], [x0, y0, z1]);
    const zm = (CW[0][1] + CW[2][1])/2; quadP(o, [-27, 24.5, -12.7], [24.8, 24.5, -12.7], [24.8, 28.5, zm], [-27, 28.5, zm]); quadP(o, [-27, 24.5, 18], [24.8, 24.5, 18], [24.8, 28.5, zm], [-27, 28.5, zm]);
    triP(M, [24.8, 24.5, -12.7], [24.8, 24.5, 18], [24.8, 28.5, zm]); }
  // west facade on Bryant Park: narrow stack windows, the nine arched reading-room windows
  { const xw = -42.6 - 0.05;
    for (let z = -51; z <= 51; z += 2.4) quadP(Wn, [xw, 3.0, z - 0.4], [xw, 3.0, z + 0.4], [xw, 13.2, z + 0.4], [xw, 13.2, z - 0.4]);
    for (let k = -4; k <= 4; k++) shapeP(Wn, archPts(4.4, 9.0, 8), [xw - 0.02, 15.6, k*10.4], 0, 1, 0); }
  // north and south facades: two rows of windows
  for (const [sz, zf] of [[-1, -56.4], [1, 56.6]]) for (let x = -38; x <= 32; x += 4.6){ const z = zf + sz*0.05;
    quadP(Wn, [x - 0.9, 4.0, z], [x + 0.9, 4.0, z], [x + 0.9, 10.5, z], [x - 0.9, 10.5, z]); quadP(Wn, [x - 0.8, 13.0, z], [x + 0.8, 13.0, z], [x + 0.8, 16.4, z], [x - 0.8, 16.4, z]); }
  // ---- Fifth Avenue facade
  const FX = (z, y, d) => [XF + (d || 0), y, z];
  for (const sz of [-1, 1]){
    const zp = sz > 0 ? 15.6 : -12.1;
    // fountain alcove with the sculpture group above the basin
    { const z = zp + sz*3.2; shapeP(B.p(DOOR), archPts(4.0, 9.5, 8), FX(z, YT + 1.6, 0.06), 0, -1, 0); cylP(Gr, XF + 1.2, z, 1.6, 1.6, YT, YT + 0.9, 10, true); cylP(M, XF + 0.7, z, 0.5, 0.45, YT + 2.5, YT + 5.5, 8, true); }
    // five window bays between engaged Corinthian columns
    for (let k = 0; k < 5; k++){ const z = zp + sz*(8.2 + k*6.0);
      shapeP(Wn, archPts(2.8, 7.6, 8), FX(z, YT + 2.8, 0.06), 0, -1, 0); quadP(Wn, FX(z - 1.1, 13.4, 0.06), FX(z + 1.1, 13.4, 0.06), FX(z + 1.1, 16.4, 0.06), FX(z - 1.1, 16.4, 0.06));
      for (const e of [-3.0, 3.0]){ const zc = z + e; cylP(M, XF + 0.35, zc, 0.55, 0.5, YT + 1.4, 17.4, 10, false); abox(M, XF - 0.3, XF + 1.05, 17.4, 18.6, zc - 0.7, zc + 0.7); } }
    // end pavilion with a pediment over a great arched window and a raised attic
    { const z0 = sz > 0 ? 45.6 : -45.4, z1 = sz > 0 ? 56.6 : -56.4, zm = (z0 + z1)/2;
      abox(M, XF - 0.5, XF + 0.9, YT, 23.4, Math.min(z0, z1), Math.max(z0, z1));
      shapeP(Wn, archPts(4.2, 9.6, 8), FX(zm, YT + 3.0, 0.95), 0, -1, 0);
      shapeP(M, [[-3.6, 0], [3.6, 0], [0, 2.2]], FX(zm, 13.6, 1.0), 0, -1, 0); abox(M, XF + 0.8, XF + 1.2, 13.2, 13.6, zm - 3.7, zm + 3.7);
      for (const e of [-4.9, 4.9]) abox(M, XF + 0.85, XF + 1.35, YT + 1.4, 18.6, zm + e - 0.45, zm + e + 0.45); }
  }
  // ---- the portico
  { const zc = ZC, xa = 40.6, xc = 42.6;
    abox(M, XF, xa, YT, 19.0, zc - 13.85, zc + 13.85);
    for (const e of [-8.4, 0, 8.4]){ shapeP(B.p(DOOR), archPts(5.0, 10.6, 10), FX(zc + e, YT + 1.0, xa - XF + 0.05), 0, -1, 0);
      shapeP(M, archPts(5.9, 11.1, 10), FX(zc + e, YT + 0.8, xa - XF + 0.02), 0, -1, 0); }
    abox(Pv, xa, 44.4, YT, YT + 0.6, zc - 13.85, zc + 13.85); abox(Pv, 44.4, 45.4, YT, YT + 0.3, zc - 13.85, zc + 13.85);
    for (const e of [-12.4, -5.15, -3.25, 3.25, 5.15, 12.4]){ const z = zc + e;
      abox(M, xc - 0.85, xc + 0.85, YT + 0.6, YT + 2.6, z - 0.85, z + 0.85);
      cylP(M, xc, z, 0.7, 0.62, YT + 2.6, 15.0, 12, false);
      loftP(M, [rectP(-0.66, 0.66, -0.66, 0.66).map(p => [xc + p[0], 15.0, z + p[1]]), rectP(-0.95, 0.95, -0.95, 0.95).map(p => [xc + p[0], 16.3, z + p[1]])], true);
      // statue above each column, in front of the attic
      const S = B.p(MAR), y = 19.9; abox(S, xc - 0.6, xc + 0.6, y, y + 0.5, z - 0.6, z + 0.6); segP(S, [xc, y + 0.5, z], [xc, y + 2.7, z], 0.5, 7, 0.38); cylP(S, xc, z, 0.27, 0.25, y + 2.7, y + 3.3, 8, true); }
    abox(M, XF, 43.6, 16.3, 18.9, zc - 13.85, zc + 13.85); abox(M, XF, 44.0, 18.9, 19.9, zc - 14.2, zc + 14.2);
    abox(M, XF, 41.8, 19.9, 24.0, zc - 13.6, zc + 13.6); abox(M, XF, 42.1, 23.6, 24.4, zc - 13.9, zc + 13.9);
    for (const e of [-8.4, 0, 8.4]) quadP(B.p(PAVE), FX(zc + e - 3.2, 20.9, 4.86), FX(zc + e + 3.2, 20.9, 4.86), FX(zc + e + 3.2, 23.0, 4.86), FX(zc + e - 3.2, 23.0, 4.86)); }
  B.flush(g); return g; }};
SG_PLACES.push({type:'nynypl', lat:40.7532089, lon:-73.9822138, rot:-0.5061});
}
