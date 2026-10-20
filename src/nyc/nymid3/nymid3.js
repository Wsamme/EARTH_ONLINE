// ===== nyc/nymid3: Midtown towers, wave 3 (City Brush v29, New York 1:1).
// Hearst Tower, New York Times Building, Bank of America Tower, Seagram Building, Lever House, 601 Lexington Avenue
// (Citigroup Center) with St. Peter's Church, 550 Madison Avenue, 270 Park Avenue.
// Every model is built in a frame aligned with the Midtown street grid: local +x = along the cross streets toward the East
// River ("east"), local -z = up the avenues ("north"), rot = -0.506 (the grid is ~29 deg clockwise of true north). Plans follow
// the OSM footprints / building parts from SC/nyc/ref_nymid3.json (converted to the grid frame, origin per model).
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
const L3 = (a, b, t) => [a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t, a[2] + (b[2] - a[2])*t];
// square / n-sided tube from a to b
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
function cylP(o, x, z, r0, r1, y0, y1, n, cap, rot){
  const a = [], b = []; rot = rot === undefined ? PI/n : rot;
  for (let i = 0; i < n; i++){ const t = rot + i/n*TAU, c = Math.cos(t), s = Math.sin(t); a.push([x + c*r0, y0, z + s*r0]); b.push([x + c*r1, y1, z + s*r1]); }
  loftP(o, [a, b], cap);
}
// ---- plan polygons ([x, z])
const area2 = P => { let s = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; s += a[0]*b[1] - b[0]*a[1]; } return s/2; };
const outN = (P, i) => { const s = area2(P) > 0 ? 1 : -1, a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], l = Math.hypot(ex, ez) || 1; return [ez/l*s, -ex/l*s]; };
const triang = (P, H) => THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), (H || []).map(h => h.map(p => new THREE.Vector2(p[0], p[1]))));
const rectP = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const chamf = (hx, hz, c, cx, cz) => { cx = cx || 0; cz = cz || 0; return [[cx-hx+c, cz-hz], [cx+hx-c, cz-hz], [cx+hx, cz-hz+c], [cx+hx, cz+hz-c], [cx+hx-c, cz+hz], [cx-hx+c, cz+hz], [cx-hx, cz+hz-c], [cx-hx, cz-hz+c]]; };
const S = (P, ox, oz) => P.map(p => [+(p[0] - ox).toFixed(2), +(p[1] - oz).toFixed(2)]);
const flatP = (o, P, y) => { for (const t of triang(P)) for (const k of t){ const p = P[k]; o.push(p[0], y, p[1]); } };
function wallsP(o, P, y0, y1, edges){
  for (let i = 0; i < P.length; i++){ if (edges && !edges(i)) continue; const a = P[i], b = P[(i+1) % P.length]; quadP(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); }
}
const prismP = (o, P, y0, y1, bot) => { wallsP(o, P, y0, y1); flatP(o, P, y1); if (bot) flatP(o, P, y0); };
// outward offset of a polygon (mitred), d > 0 grows it
function offP(P, d){
  const n = P.length, R = [];
  for (let i = 0; i < n; i++){ const a = outN(P, (i - 1 + n) % n), b = outN(P, i); let mx = a[0] + b[0], mz = a[1] + b[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
    const k = d/Math.max(0.3, mx*b[0] + mz*b[1]); R.push([P[i][0] + mx*k, P[i][1] + mz*k]); }
  return R;
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
// vertical strips centred in bays of about `sp` along every edge, `w` wide, `off` proud of the wall
function stripsP(o, P, y0, y1, sp, w, off, edges, minL, ends){
  for (let i = 0; i < P.length; i++){ if (edges && !edges(i)) continue;
    const a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], L = Math.hypot(ex, ez); if (L < (minL || sp*0.9)) continue;
    const [nx, nz] = outN(P, i), n = Math.max(1, Math.round(L/sp)), ux = ex/L, uz = ez/L, st = L/n;
    for (let k = ends ? 0 : 1; k < (ends ? n + 1 : n); k++){ const s = st*k, x = a[0] + ux*s + nx*off, z = a[1] + uz*s + nz*off;
      quadP(o, [x - ux*w/2, y0, z - uz*w/2], [x + ux*w/2, y0, z + uz*w/2], [x + ux*w/2, y1, z + uz*w/2], [x - ux*w/2, y1, z - uz*w/2]);
      if (off > 0.12){ const xb = a[0] + ux*s, zb = a[1] + uz*s; quadP(o, [xb - ux*w/2, y0, zb - uz*w/2], [x - ux*w/2, y0, z - uz*w/2], [x - ux*w/2, y1, z - uz*w/2], [xb - ux*w/2, y1, zb - uz*w/2]);
        quadP(o, [xb + ux*w/2, y0, zb + uz*w/2], [x + ux*w/2, y0, z + uz*w/2], [x + ux*w/2, y1, z + uz*w/2], [xb + ux*w/2, y1, zb + uz*w/2]); } }
  }
}
// a face of an edge of polygon P: (s, v, off) -> point, s along the edge from its start, v = height, off outward
const edgeF = (P, i) => { const a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], L = Math.hypot(ex, ez), ux = ex/L, uz = ez/L, [nx, nz] = outN(P, i);
  return {L, ux, uz, nx, nz, at:(s, v, off) => [a[0] + ux*s + nx*(off || 0), v, a[1] + uz*s + nz*(off || 0)]}; };
// flat 2-D outline [u, v] (with optional holes) on an edge face F, pushed off outward
function faceShapeP(o, F, pts, holes, off){
  const all = pts.concat(...(holes || [])), T = triang(pts, holes);
  for (const t of T) triP(o, F.at(all[t[0]][0], all[t[0]][1], off), F.at(all[t[1]][0], all[t[1]][1], off), F.at(all[t[2]][0], all[t[2]][1], off));
}
// rectangle on a face (s0..s1, v0..v1) pushed off outward; a box of depth dep when dep is given
function faceRect(o, F, s0, s1, v0, v1, off, dep){
  const a = F.at(s0, v0, off), b = F.at(s1, v0, off), c = F.at(s1, v1, off), d = F.at(s0, v1, off); quadP(o, a, b, c, d);
  if (dep){ const a2 = F.at(s0, v0, off - dep), b2 = F.at(s1, v0, off - dep), c2 = F.at(s1, v1, off - dep), d2 = F.at(s0, v1, off - dep);
    quadP(o, a2, a, d, d2); quadP(o, b, b2, c2, c); quadP(o, d, c, c2, d2); quadP(o, a2, b2, b, a); }
}
// arch outline (width w, total height h, springing at h - w/2) as [u, v] from bottom centre u0
const archPts = (u0, w, h, n) => { const r = w/2, P = [[u0 - r, 0], [u0 + r, 0], [u0 + r, h - r]]; n = n || 10; for (let i = 1; i < n; i++){ const a = PI*i/n; P.push([u0 + Math.cos(a)*r, h - r + Math.sin(a)*r]); } P.push([u0 - r, h - r]); return P; };
// plan point -> lat/lon of the Midtown frame (origin = the ref anchor of the target)
const LL = (lat0, lon0, fx, fz) => { const ex = fx*Math.cos(ROT) + fz*Math.sin(ROT), ez = -fx*Math.sin(ROT) + fz*Math.cos(ROT); return {lat:+(lat0 - ez/111048).toFixed(7), lon:+(lon0 + ex/84516).toFixed(7)}; };
const place = (type, lat0, lon0, fx, fz) => { const p = LL(lat0, lon0, fx, fz); SG_PLACES.push({type, lat:p.lat, lon:p.lon, rot:ROT}); };
const RED = {c:'#b02018', glow:'#ff2a1a', gk:2.2};
const aviP = (o, pts, y) => { for (const [x, z] of pts) abox(o, x - 0.35, x + 0.35, y, y + 0.8, z - 0.35, z + 0.35); };

// lofted shard: bottom ring bot [[x, z]] at y0, top ring top [[x, y, z]] (own height per vertex, same count); glass faces into G,
// floor bands every fh (h tall, off proud) and vertical mullions every ~sp (w wide) into M; returns the face list
function shardP(G, M, bot, y0, top, fh, sp, w, h){
  const n = bot.length, cx = bot.reduce((s, p) => s + p[0], 0)/n, cz = bot.reduce((s, p) => s + p[1], 0)/n;
  const A = i => [bot[i][0], y0, bot[i][1]], T = i => top[i];
  for (let i = 0; i < n; i++){ const j = (i + 1) % n, a = A(i), b = A(j), c = T(j), d = T(i);
    if (Math.hypot(b[0]-a[0], b[2]-a[2]) < 0.05 && Math.hypot(c[0]-d[0], c[2]-d[2]) < 0.05) continue;
    quadP(G, a, b, c, d);
    // outward normal (horizontal part) of this face
    const mx = (a[0] + b[0] + c[0] + d[0])/4 - cx, mz = (a[2] + b[2] + c[2] + d[2])/4 - cz;
    let ex = (b[0] - a[0]) + (c[0] - d[0]), ez = (b[2] - a[2]) + (c[2] - d[2]); const el = Math.hypot(ex, ez) || 1; ex /= el; ez /= el;
    let nx = ez, nz = -ex; if (nx*mx + nz*mz < 0){ nx = -nx; nz = -nz; }
    const o = (p, k) => [p[0] + nx*k, p[1], p[2] + nz*k];
    if (M){
      const ym = Math.min(c[1], d[1]);
      for (let y = y0 + fh; y < ym - 0.3; y += fh){ const p = L3(a, d, (y - y0)/(d[1] - y0)), q = L3(b, c, (y - y0)/(c[1] - y0)), p2 = L3(a, d, (y - h - y0)/(d[1] - y0)), q2 = L3(b, c, (y - h - y0)/(c[1] - y0));
        quadP(M, o(p2, 0.06), o(q2, 0.06), o(q, 0.06), o(p, 0.06)); }
      const Lb = Math.max(Math.hypot(b[0]-a[0], b[2]-a[2]), Math.hypot(c[0]-d[0], c[2]-d[2])), k = Math.max(1, Math.round(Lb/sp));
      for (let m = 1; m < k; m++){ const f = m/k, p = L3(a, b, f), q = L3(d, c, f);
        quadP(M, o([p[0] - ex*w/2, p[1], p[2] - ez*w/2], 0.08), o([p[0] + ex*w/2, p[1], p[2] + ez*w/2], 0.08), o([q[0] + ex*w/2, q[1], q[2] + ez*w/2], 0.08), o([q[0] - ex*w/2, q[1], q[2] - ez*w/2], 0.08)); }
    }
  }
}
// =====================================================================================================================
// Hearst Tower (Foster + Partners, 2006): a 46-storey, 182 m steel diagrid tower rising out of the hollowed-out six-storey
// Hearst Magazine Building (Joseph Urban, 1928) on Eighth Avenue between 56th and 57th Streets. Above the base a lit clerestory
// (7th - 10th floors) through which the lowest diagonals pass; from the 10th floor (33.5 m) eight four-storey tiers of
// stainless-clad triangles (four per long face, three per short face, horizontal ring beams at every node row) stand proud of
// the blue-grey glass; at the corners the glass is cut back ("bird's mouth"), the diagonals of both faces meeting in front of it
// every second tier. Cast-stone base: chamfered Eighth Avenue corners, seven bays per front, storefronts, tripartite windows,
// the central entrance arch, six pylons (pairs at the centres of Eighth Avenue and 57th Street, one on each chamfered corner)
// with sculpture groups on pedestals (abstract blocks) and urns above the parapet. Tower 51.3 x 39.5 m (OSM part), base 59.5 x
// 60.6 m. Origin = tower axis; +x = Eighth Avenue (east), -z = 57th Street. Night: lit offices and clerestory, warm floodlit
// stone base, faintly uplit diagrid.
LANDMARKS.nyhearst = {zh:'赫斯特大厦', en:'Hearst Tower', cat:'new', r:44, h:183,
  lt:{m:1, c:'#e6eefc', k:0.55, anim:'none'}, build(){
  const g = new THREE.Group(), B = mkB();
  const ST = {c:'#d6c8aa', m:0, lc:'#ffd6a0', lk:0.85}, STD = {c:'#c4b493', m:0, lc:'#ffd6a0', lk:0.7};
  const WIN = {c:'#353b42', m:1, fh:4.3, cw:2.2}, GL = {c:'#7d93a4', m:1, fh:4.22, cw:1.5}, MU = {c:'#9aa6b0', m:1, fh:4.22, cw:1.5};
  const DG = {c:'#cdd3d8', m:0, lc:'#dfe8ff', lk:0.3}, SKY = {c:'#8ea1ad', glow:'#ffe2b8', gk:0.35}, ROOF = '#7b7d7f', SHOP = {c:'#4a4f52', glow:'#ffd9a6', gk:0.55};
  const base = S([[-12.4,82.8],[-12.3,22.2],[43.6,22.3],[47.0,26.7],[47.0,78.1],[43.4,81.5],[21.6,81.5],[21.6,82.8]], 15.1, 52.2);
  const YB = 21.6, YP = 23.6;                       // cornice / parapet of the 1928 base (roof 70 ft)
  const st = B.p(ST), sd = B.p(STD), wi = B.p(WIN);
  // ---- base: cast-stone box, foundations to -5
  wallsP(st, base, -5, YP); flatP(B.p(ROOF), base, -5);
  const street = i => i !== 0;                      // edge 0 = the west party wall (the Sheffield)
  const ch1 = edgeF(base, 2), ch2 = edgeF(base, 4), e8 = edgeF(base, 3), n57 = edgeF(base, 1);
  // storefronts, second-storey windows and the tripartite windows of the third to sixth storeys in seven bays per front
  for (let i = 0; i < base.length; i++){ if (!street(i)) continue; const F = edgeF(base, i); if (F.L < 3) continue;
    const n = F.L > 40 ? 7 : Math.max(1, Math.round(F.L/7.5)), sp = F.L/n;
    for (let k = 0; k < n; k++){ const s0 = k*sp + 0.9, s1 = (k + 1)*sp - 0.9;
      if (!(i === 3 && k === 3)) faceRect(B.p(SHOP), F, s0, s1, 0.4, 4.8, 0.04);
      faceRect(wi, F, s0 + 0.3, s1 - 0.3, 6.0, 8.2, 0.04);
      for (let f = 0; f < 4; f++){ const v = 9.4 + f*3.1, w3 = (s1 - s0 - 0.6)/3;
        for (let q = 0; q < 3; q++) faceRect(wi, F, s0 + 0.3 + q*w3 + 0.12, s0 + 0.3 + (q + 1)*w3 - 0.12, v, v + 2.2, f === 3 ? 0.2 : 0.02); } }
    for (let k = 0; k <= n; k++) faceRect(sd, F, Math.max(0, k*sp - 0.7), Math.min(F.L, k*sp + 0.7), 0, YB, 0.3, 0.3);     // piers
    faceRect(sd, F, 0, F.L, 4.9, 5.7, 0.36, 0.36); faceRect(sd, F, 0, F.L, 8.6, 9.2, 0.5, 0.5);         // bands; balustrade line
    for (let k = 0; k < n; k++) for (let q = 0; q < 9; q++){ const s = k*sp + 1.2 + q*(sp - 2.4)/8; faceRect(sd, F, s - 0.08, s + 0.08, 9.2, 10.1, 0.5, 0.16); }
    faceRect(sd, F, 0, F.L, YB - 1.0, YB, 0.6, 0.6);   // cornice
    faceRect(st, F, 0, F.L, YP - 0.4, YP, 0.15, 0.15); // parapet coping
  }
  // the main entrance arch in the centre of the Eighth Avenue front, flanked by two doorways
  { const m = e8.L/2; faceShapeP(B.p(SHOP), e8, archPts(m, 5.6, 9.6, 10), null, 0.06); faceRect(sd, e8, m - 3.3, m + 3.3, 9.6, 10.4, 0.42, 0.42);
    for (const d of [-5.6, 5.6]) faceRect(B.p(SHOP), e8, m + d - 1.0, m + d + 1.0, 0.3, 3.8, 0.06); }
  // six pylons: pairs at the centres of Eighth Avenue and 57th Street, one on each chamfered corner; sculpture groups on
  // pedestals at the third storey (abstract), urns above the sixth
  { const py = [[ch1, ch1.L/2], [ch2, ch2.L/2], [e8, e8.L/2 - 4.4], [e8, e8.L/2 + 4.4], [n57, n57.L/2 - 4.4], [n57, n57.L/2 + 4.4]];
    for (const [F, s] of py){
      faceRect(st, F, s - 1.4, s + 1.4, 0, YP + 2.6, 1.1, 1.1);                                         // pylon
      for (const ds of [-0.95, -0.32, 0.32, 0.95]) faceRect(sd, F, s + ds - 0.13, s + ds + 0.13, 10.5, YP + 2.2, 1.25, 0.15);   // fluting
      faceRect(st, F, s - 1.7, s + 1.7, 7.4, 8.9, 1.9, 0.8);                                            // pedestal
      const q = F.at(s, 0, 1.75); boxP(sd, 2.6, 2.6, 1.0, q[0], 8.9, q[2], ROT); cylP(sd, q[0], q[2], 0.42, 0.34, 11.5, 13.6, 6, true);   // sculpture group
      const u = F.at(s, 0, 0.55); cylP(st, u[0], u[2], 0.7, 0.9, YP + 2.6, YP + 3.4, 8, true); cylP(st, u[0], u[2], 0.95, 0.55, YP + 3.4, YP + 4.8, 8, true);   // urn
    }
  }
  // atrium skylight inside the parapet, round the tower
  { const inner = offP(base, -1.2); flatP(B.p(SKY), inner, YP - 0.6); }
  // ---- tower: chamfered glass prism (bird's-mouth corners) behind the diagrid
  const HX = 25.65, HZ = 19.75, Y0 = 33.5, YT = 182, NT = 8, T = (YT - Y0)/NT, gp = chamf(HX - 1.0, HZ - 1.0, 5.2);
  { const o = B.p(GL); wallsP(o, gp, YP - 1, YT - 0.4); bandP(B.p(SKY), gp, YP - 1, Y0 - YP + 0.6, 0.04); }   // clerestory (7th - 10th floors) lit
  { const o = B.p(MU); stripsP(o, gp, Y0, YT - 0.4, 1.5, 0.11, 0.06);
    for (let y = Y0 + 4.22; y < YT - 1; y += 4.22) bandP(o, gp, y - 0.32, 0.32, 0.07); }
  flatP(B.p(ROOF), offP(gp, -0.1), YT - 0.5);
  abox(B.p(ROOF), -12, 12, YT - 0.5, YT + 3.2, -8, 8);               // rooftop plant
  // diagrid: nodes every w along each face; even rows include the corners (shared by both faces)
  { const D = B.p(DG);
    const faces = [{a:[-HX, -HZ], u:[1, 0], L:2*HX, n:4}, {a:[HX, -HZ], u:[0, 1], L:2*HZ, n:3}, {a:[HX, HZ], u:[-1, 0], L:2*HX, n:4}, {a:[-HX, HZ], u:[0, -1], L:2*HZ, n:3}];
    for (const f of faces){ const w = f.L/f.n, P = (s, y) => [f.a[0] + f.u[0]*s, y, f.a[1] + f.u[1]*s];
      for (let k = -1; k < NT; k++){ const y0 = Y0 + k*T, y1 = y0 + T, odd = (k + 2) % 2;
        for (let j = 0; j <= f.n; j++){ const s = (j + (odd ? 0.5 : 0))*w; if (s > f.L + 1e-6) continue;
          if (s - w/2 > -1e-6) segP(D, P(s, y0), P(s - w/2, y1), 0.78, 4);
          if (s + w/2 < f.L + 1e-6) segP(D, P(s, y0), P(s + w/2, y1), 0.78, 4); } }
      for (let k = 0; k <= NT; k++) segP(D, P(0, Y0 + k*T), P(f.L, Y0 + k*T), k === NT ? 0.85 : 0.6, 4);
    }
    // corner posts of the bird's mouth (the shared nodes) tie into the ring beams
    for (const [x, z] of [[-HX, -HZ], [HX, -HZ], [HX, HZ], [-HX, HZ]]) for (let k = 0; k <= NT; k += 2) boxP(D, 1.5, 1.5, 1.5, x, Y0 + k*T - 0.75, z);
  }
  aviP(B.p(RED), [[-HX + 1, -HZ + 1], [HX - 1, HZ - 1]], YT + 0.3);
  B.flush(g); return g; }};
place('nyhearst', 40.76705, -73.9835, 15.1, 52.2);

// =====================================================================================================================
// The New York Times Building (Renzo Piano Building Workshop with FXFOWLE, 2007), Eighth Avenue between 40th and 41st Streets:
// 52 storeys, roof 228 m, the 91 m carbon-fibre mast to 319 m. Square plan with notched corners (exposed steel X-bracing and corner columns),
// the 40th / 41st Street faces with a projecting centre bay (OSM parts). All four faces are veiled by a screen of horizontal
// white ceramic rods ~0.6 - 2.7 m in front of the clear glass, left open at eye level on each floor, sparser on the top 91 m,
// running on 22 - 28 m above the roof into the sky (the north / south screens past the notched corners and taller). Five-storey wing to the east round the open birch-and-moss garden, also screened.
// Origin = centre of the tower square; +x = east (toward Seventh Avenue), -x = Eighth Avenue. No lettering anywhere.
// Night: lit offices behind the rods, the rod screen above the roof glowing white, a red light on the mast.
LANDMARKS.nynytimes = {zh:'纽约时报大楼', en:'The New York Times Building', cat:'new', r:103, h:319,
  lt:{m:1, c:'#f2f4ff', k:0.6, e:0.6, anim:'none'}, build(){
  const g = new THREE.Group(), B = mkB();
  const GL = {c:'#a8b4be', m:1, fh:4.2, cw:1.5}, SP = {c:'#5f6973', m:1, fh:4.2, cw:1.5}, ROD = {c:'#ecebe5', m:0, lc:'#fff1d6', lk:0.42};
  const RODT = {c:'#e7e5de', glow:'#fff2de', gk:0.55}, STL = {c:'#dcdfe2', m:0, lc:'#eef4ff', lk:0.35}, LOB = {c:'#56626b', glow:'#ffe4bc', gk:0.6};
  const MAST = {c:'#cdd1d4', m:0, lk:0.6}, ROOF = '#7f8285', TRK = '#ebe7de', LEAF = '#86a058', MOSS = '#5d7a3e';
  const ox = 16.55, oz = -5.15, H = 227, FH = 4.2, C = 23.85, n = 3.0;
  // tower plan: square +-C with 3 m notches at the corners and the projecting centre bays on 41st (-z) and 40th (+z) Streets
  const tp = [[-C + n, -C], [-14.65, -C], [-14.65, -29.15], [11.05, -29.15], [11.05, -C], [C - n, -C], [C - n, -C + n], [C, -C + n], [C, C - n], [C - n, C - n], [C - n, C],
    [10.95, C], [10.95, 28.95], [-14.75, 28.95], [-14.75, C], [-C + n, C], [-C + n, C - n], [-C, C - n], [-C, -C + n], [-C + n, -C + n]];
  { const o = B.p(GL); wallsP(o, tp, -5, H); flatP(B.p(ROOF), tp, H); }
  { const o = B.p(SP); for (let y = 12 + FH; y < H - 1; y += FH) bandP(o, tp, y - 0.5, 0.5, 0.05); stripsP(o, tp, 0, H, 1.5, 0.08, 0.04); }
  // lobby: glazed and lit on Eighth Avenue and the streets below the screens
  { const o = B.p(LOB); bandP(o, tp, 0.2, 11.6, 0.1, i => i >= 16 || i <= 1 || i === 12); }
  // Eighth Avenue entrance canopy (glass on steel) and the 41st / 40th Street canopies
  { const o = B.p(STL); abox(o, -C - 6.5, -C, 6.0, 6.4, -12, 12); for (const z of [-11, 0, 11]) segP(o, [-C - 6.2, 6.0, z], [-C, 8.5, z], 0.12, 4);
    abox(o, -14, 10.5, 5.0, 5.3, -29.15 - 4, -29.15); abox(o, -14, 10.5, 5.0, 5.3, 28.95, 28.95 + 4); }
  // the notches: corner columns and stacked X-braces (two storeys each) in both notch planes
  { const o = B.p(STL);
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]){ const X = sx*C, Z = sz*C;
      boxP(o, 0.9, H + 2, 0.9, X - sx*0.45, 0, Z - sz*0.45);
      for (let y = 12; y + 2*FH <= H + 0.1; y += 2*FH){
        segP(o, [X, y, Z - sz*n], [X - sx*n, y + 2*FH, Z], 0.16, 4); segP(o, [X - sx*n, y, Z], [X, y + 2*FH, Z - sz*n], 0.16, 4);
        segP(o, [X, y, Z], [X, y + 2*FH, Z - sz*n], 0.14, 4); segP(o, [X, y, Z], [X - sx*n, y + 2*FH, Z], 0.14, 4);
        segP(o, [X - sx*n, y, Z], [X, y, Z], 0.12, 4); segP(o, [X, y, Z - sz*n], [X, y, Z], 0.12, 4); } } }
  // ceramic-rod screens: [start x, z], direction, length, base; rods in the band above eye level of each floor, solid band above the roof
  const scr = [[[-17.6, -29.8], [1, 0], 31.75, 6, 256], [[13.9, 29.6], [-1, 0], 31.65, 6, 256], [[-24.5, 21.25], [0, -1], 43.6, 12, 250], [[24.5, -22.05], [0, 1], 43.6, 12, 250]];
  { const R = B.p(ROD), RT = B.p(RODT), Sx = B.p(STL);
    // rods sparser on the top 91 m of offices; above the roof the screen runs on 22 - 28 m with nothing behind it
    for (const [a, u, L, yb, yt] of scr){ const P = (s, y) => [a[0] + u[0]*s, y, a[1] + u[1]*s];
      for (let yf = yb; yf < yt; yf += FH){ const top = yf >= H - 2, nr = top ? 9 : yf > 137 ? 6 : 9, sp = top ? 0.46 : yf > 137 ? 0.42 : 0.3;
        for (let k = 0; k < nr; k++){ const y = yf + (top ? 0.1 : 1.85) + k*sp; if (y > yt - 0.2) continue;
          quadP(y > H ? RT : R, P(0, y), P(L, y), P(L, y + 0.18), P(0, y + 0.18)); } }
      const nv = Math.round(L/4.5); for (let k = 0; k <= nv; k++){ const s = k*L/nv; segP(Sx, P(s, yb), P(s, yt), 0.07, 4); }
      for (let y = yb; y < yt; y += 4*FH) segP(Sx, P(0, y), P(L, y), 0.05, 4);
    } }
  // roof: mechanical cross, the mast (91 m) with platforms and the red beacon
  { const o = B.p(ROOF); abox(o, -11.2, 9.6, H, 232, -15.05, 14.85); abox(o, -4.65, 2.42, H, 232, -23.05, 22.9); }
  { const o = B.p(MAST), mx = -0.8, mz = -0.05; cylP(o, mx, mz, 1.2, 0.12, 228, 318.4, 8, true); cylP(o, mx, mz, 2.2, 1.6, 232, 236, 8, true);
    for (const y of [258, 284]) cylP(o, mx, mz, 1.6, 1.6, y, y + 0.6, 8, true);
    cylP(B.p(RED), mx, mz, 0.3, 0.3, 318.4, 319, 6, true); aviP(B.p(RED), [[-10, -14], [8.5, 14]], 232); }
  // ---- east wing (25 m) round the open garden
  const wing = S([[40.4,22.9],[40.9,16.7],[40.9,3.5],[62.7,3.6],[62.8,-18.6],[41.1,-18.7],[40.5,-29.0],[40.6,-35.9],[113.9,-35.7],[114.0,22.6]], ox, oz);
  { const o = B.p(GL); wallsP(o, wing, -5, 25); flatP(B.p(ROOF), wing, 25); }
  { const o = B.p(SP); for (let y = 6; y < 25; y += 4.6) bandP(o, wing, y - 0.6, 0.6, 0.05); bandP(o, wing, 24, 1.2, 0.08); stripsP(o, wing, 0, 25, 1.5, 0.08, 0.04); bandP(B.p(LOB), wing, 0.2, 4.6, 0.06); }
  { const R = B.p(ROD); for (const i of [6, 7, 9]){ const F = edgeF(wing, i); if (F.L < 10) continue;
      for (let y = 6.5; y < 24.5; y += 0.36) quadP(R, F.at(0.5, y, 0.8), F.at(F.L - 0.5, y, 0.8), F.at(F.L - 0.5, y + 0.16, 0.8), F.at(0.5, y + 0.16, 0.8)); } }
  // garden: moss mounds and birches
  { const gx0 = 40.9 - ox, gx1 = 62.7 - ox, gz0 = -18.6 - oz, gz1 = 3.6 - oz, M = B.p(MOSS); flatP(M, rectP(gx0, gx1, gz0, gz1), 0.25);
    for (let k = 0; k < 7; k++){ const x = lerp(gx0 + 3, gx1 - 3, (k + 0.5)/7 + (LMCTX.rng() - 0.5)*0.08), z = lerp(gz0 + 3, gz1 - 3, LMCTX.rng()), h = 14 + LMCTX.rng()*2;
      segP(B.p(TRK), [x, 0.2, z], [x, h, z], 0.16, 4); cylP(B.p(LEAF), x, z, 1.2, 0.3, h - 6, h + 1.5, 5, true); } }
  B.flush(g); return g; }};
place('nynytimes', 40.7561, -73.9903, 16.55, -5.15);

// =====================================================================================================================
// Bank of America Tower, One Bryant Park (COOKFOX, 2009): 55 storeys, roof 288 m at the south peak, the 78 m spire to 366 m;
// the lower north peak (258.5 m) carries the wind-turbine mast (290 m). Faceted "crystal" form: the plan of the OSM parts (a
// notch on the south-east and the west sides) rises straight for the lower third, then two interpenetrating shards lean in -
// the south-east corner opening into a widening wedge-shaped chamfer, every face sloping - to sloped roofs under the two
// peaks. Clear low-iron glass with fritted bands and slim mullions. Seven- and eight-storey glass base filling the lot to the
// middle of the block (the brick neo-Georgian theatre front on 43rd Street, abstract marquee), the 12 m lobby and garden room
// on Sixth Avenue with the canopy. Origin = tower centre; +x = Sixth Avenue (east), +z = 42nd Street.
// Night: warm lit floors full height, lit parapet screens, the LED spire cycling colours.
LANDMARKS.nybofa = {zh:'美国银行大厦', en:'Bank of America Tower', cat:'new', r:98, h:366,
  lt:{m:1, c:'#ffffff', k:0.7, e:1, anim:'cycle', c2:'#4f8dff'}, build(){
  const g = new THREE.Group(), B = mkB();
  const GL = {c:'#a2b5c1', m:1, fh:4.27, cw:1.52}, FR = {c:'#cad5db', m:1, fh:4.27, cw:1.52}, POD = {c:'#91a5b1', m:1, fh:4.3, cw:1.6};
  const LOB = {c:'#7a8b94', glow:'#ffe2b8', gk:0.6}, SPI = {c:'#e6eaee', m:0, lc:'#ffffff', lk:1.8}, TOP = {c:'#bccad2', glow:'#ffe7c4', gk:0.5};
  const BRK = {c:'#8c4a36', m:0, lc:'#ffd6a0', lk:0.8}, TC = {c:'#e4dccb', m:0, lc:'#ffd6a0', lk:0.9}, ROOF = '#8a8d90', CAN = '#6e5a43', MQ = {c:'#3a3530', glow:'#ffd890', gk:0.9};
  const ox = -3, oz = 0.6, FH = 4.27, YS = 92;
  // ---- lower body (0 - 92 m, to the 18th floor): rectangular plan with the 4.6 m extensions at the NE and SW corners (OSM)
  const P0 = S([[-40.8,26.7],[-40.8,0.3],[-36.5,0.3],[-36.5,-25.4],[34.9,-25.4],[34.9,0.3],[29.2,0.3],[29.2,26.7]], ox, oz);
  { const o = B.p(GL); wallsP(o, P0, -5, YS); }
  { const o = B.p(FR); for (let y = 15 + FH; y < YS; y += FH) bandP(o, P0, y - 0.7, 0.7, 0.05); stripsP(o, P0, 15, YS, 1.52, 0.1, 0.06); }
  // ---- upper shards: south (main, roof 288 m) and north (258.5 m); duplicated bottom vertices open into the corner wedges
  const sb = [[-37.8, -6], [0.95, -6], [32.2, -6], [32.2, 26.1], [32.2, 26.1], [0.95, 26.1], [-37.8, 26.1]];
  const st = [[-24, 264, -2], [0.95, 288, -2], [22, 283, -2], [25.5, 281, 12.5], [11, 281, 21.5], [0.95, 288, 21.5], [-24, 264, 21.5]];
  const nb = [[-33.5, -26], [37.9, -26], [37.9, -26], [37.9, 6], [-33.5, 6]];
  const nt = [[-21, 244, -21.5], [17, 258.5, -21.5], [27.5, 258.5, -12], [27.5, 252, 2], [-21, 244, 2]];
  shardP(B.p(GL), B.p(FR), sb, YS, st.map(p => [p[0], p[1], p[2]]), FH, 1.52, 0.1, 0.7);
  shardP(B.p(GL), B.p(FR), nb, YS, nt.map(p => [p[0], p[1], p[2]]), FH, 1.52, 0.1, 0.7);
  // roofs (sloped planes) and the lit parapet screens (top 6 m of every face)
  { const o = B.p(ROOF), T = st.map(p => [p[0], p[1] - 0.2, p[2]]), N = nt.map(p => [p[0], p[1] - 0.2, p[2]]);
    quadP(o, T[6], T[0], T[1], T[5]); triP(o, T[1], T[2], T[3]); triP(o, T[1], T[3], T[4]); triP(o, T[1], T[4], T[5]);
    triP(o, N[0], N[1], N[4]); triP(o, N[1], N[2], N[3]); triP(o, N[1], N[3], N[4]);
    const Tp = B.p(TOP);
    for (const R of [st, nt]) for (let i = 0; i < R.length; i++){ const a = R[i], b = R[(i + 1) % R.length], d = 6;
      const cx = R.reduce((s, p) => s + p[0], 0)/R.length, cz = R.reduce((s, p) => s + p[2], 0)/R.length;
      const k = (p) => { const dx = p[0] - cx, dz = p[2] - cz, l = Math.hypot(dx, dz) || 1; return [p[0] + dx/l*0.15, p[1], p[2] + dz/l*0.15]; };
      quadP(Tp, k([a[0], a[1] - d, a[2]]), k([b[0], b[1] - d, b[2]]), k(b), k(a)); } }
  // the park-facing south-east wedge: double curtain wall with horizontal LED strips (bluish white at night)
  { const o = B.p({c:'#c4d3dc', glow:'#cfe2ff', gk:0.55}), b = [32.2, YS, 26.1], t1 = st[3], t2 = st[4];
    const cx = (t1[0] + t2[0])/2 - b[0], cz = (t1[2] + t2[2])/2 - b[2], nl = Math.hypot(t1[2] - t2[2], t2[0] - t1[0]) || 1;
    let nx = (t1[2] - t2[2])/nl, nz = (t2[0] - t1[0])/nl; if (nx*(b[0] - 0) + nz*(b[2] - 10) < 0){ nx = -nx; nz = -nz; }
    for (let y = YS + FH; y < Math.min(t1[1], t2[1]) - 1; y += FH){ const f = (y - YS)/(t1[1] - YS), p = L3(b, t1, f), q = L3(b, t2, (y - YS)/(t2[1] - YS));
      quadP(o, [p[0] + nx*0.25, y - 0.35, p[2] + nz*0.25], [q[0] + nx*0.25, y - 0.35, q[2] + nz*0.25], [q[0] + nx*0.25, y, q[2] + nz*0.25], [p[0] + nx*0.25, y, p[2] + nz*0.25]); } }
  // the spire (south peak): tapering mast wrapped by three pipes in a triangular pattern with ties; north turbine mast
  { const o = B.p(SPI), sx = 0.95, sz = 7.95, y0 = 287.5, y1 = 366;
    cylP(o, sx, sz, 0.75, 0.33, y0 - 4, y1 - 1, 8, true); cylP(o, sx, sz, 3.2, 1.2, y0 - 2, y0 + 7, 6, true);
    const pp = t => [0, 1, 2].map(i => { const a = i*TAU/3 + 0.3, r = lerp(2.0, 0.45, t); return [sx + Math.cos(a)*r, lerp(y0 + 7, y1 - 6, t), sz + Math.sin(a)*r]; });
    for (let k = 0; k < 12; k++){ const A = pp(k/12), Bq = pp((k + 1)/12); for (let i = 0; i < 3; i++){ segP(o, A[i], Bq[i], 0.16, 4); segP(o, A[i], Bq[(i + 1) % 3], 0.07, 4); } }
    cylP(B.p(RED), sx, sz, 0.25, 0.25, y1 - 1, y1, 6, true);
    const tx = 22, tz = -14; cylP(o, tx, tz, 0.6, 0.35, 256, 290, 6, true); for (const y of [266, 276, 284]) boxP(o, 3.4, 0.25, 0.25, tx, y, tz, 0.4);
    cylP(B.p(RED), tx, tz, 0.25, 0.25, 290, 290.6, 6, true); }
  // ---- base: 30 m glass podium (west), 15 m lobby / garden room wrapping the tower on Sixth Avenue and 42nd Street
  const pw = S([[-94.51,33.28],[-94.52,-28.22],[15.91,-28.02],[15.87,-24.8],[-36.05,-25.64],[-36.61,-0.87],[-40.19,-0.94],[-40.81,25.59],[-1.66,26.3],[-1.64,33.15]], ox, oz);
  const pe = S([[-1.64,33.15],[-1.66,26.3],[28.93,26.84],[29.51,0.23],[34.39,0.38],[34.91,-24.49],[15.87,-24.8],[15.91,-28.02],[36.5,-28.0],[36.01,33.21]], ox, oz);
  { const o = B.p(POD); wallsP(o, pw, -5, 30); flatP(B.p(ROOF), pw, 30); flatP(B.p('#6b8450'), rectP(-88, -42, -24, 28), 30.25);   // green roof on the base for (let y = 4.6 + 3.6; y < 30; y += 3.6) bandP(B.p(FR), pw, y - 0.9, 0.9, 0.05);
    stripsP(B.p(FR), pw, 0, 30, 1.6, 0.1, 0.06); bandP(B.p(LOB), pw, 0.2, 4.4, 0.04); bandP(B.p(FR), pw, 29, 1.6, 0.1); }
  { const o = B.p(LOB); wallsP(o, pe, -5, 12.2); stripsP(B.p(FR), pe, 0, 15, 1.6, 0.12, 0.06); wallsP(B.p(POD), pe, 12.2, 15); flatP(B.p(ROOF), pe, 15); bandP(B.p(FR), pe, 12, 0.9, 0.08); }
  // entrance canopy on Sixth Avenue / 42nd Street
  { const o = B.p(CAN); abox(o, 33, 46.5, 9.2, 9.8, 6, 30); abox(o, 6, 33, 9.2, 9.8, 29.5, 38.5); }
  // the theatre front on 43rd Street: brick, five centre bays, terracotta trim, abstract lit marquee
  { const F = {L:26, at:(s, v, off) => [-60 + s, v, -29.4 - (off || 0)]}, br = B.p(BRK), tc = B.p(TC);
    faceRect(br, F, 0, 26, 0, 15.5, 0.6, 0.6); faceRect(tc, F, -0.3, 26.3, 15.3, 16.3, 0.9, 0.9); faceRect(tc, F, 0, 26, 0, 1.2, 0.75, 0.75);
    for (let k = 0; k < 5; k++){ const s = 5.2 + k*3.9; faceRect(B.p(GL), F, s - 0.9, s + 0.9, 7.8, 12.8, 0.65); faceRect(tc, F, s - 1.15, s + 1.15, 12.8, 13.4, 0.7);
      faceRect(tc, F, s + 1.4, s + 1.95, 6.8, 15.3, 0.75, 0.75); }
    faceRect(B.p(MQ), F, 4.5, 21.5, 4.6, 6.4, 2.6, 2.0); }
  B.flush(g); return g; }};
place('nybofa', 40.75545, -73.9844, -3, 0.6);

// =====================================================================================================================
// Seagram Building (Mies van der Rohe with Philip Johnson, 1958), 375 Park Avenue between 52nd and 53rd Streets: a 38-storey,
// 157 m slab of bronze and topaz glass, five bays (8.62 m) wide on Park Avenue and three deep, set back 30 m behind its pink-
// granite plaza with the two rectangular pools and fountain jets and the green-marble ledges on the side streets. Bronze
// I-beam mullions on every 1.44 m module run the full height; bronze spandrels; the top two storeys of bronze louvres. The
// columns stand free in front of the recessed glass lobby (7.3 m). Behind: the full-height spine and the ten-storey bustle with
// four-storey wings to both side streets (OSM parts). Origin = slab centre; -x = Park Avenue (west), -z = 53rd Street.
// Night: Richard Kelly's even perimeter lighting - every floor glows at the window heads - the lit lobby and pools.
LANDMARKS.nyseagram = {zh:'西格拉姆大厦', en:'Seagram Building', cat:'new', r:57, h:159,
  lt:{m:1, c:'#ffe2b8', k:0.5, anim:'none'}, build(){
  const g = new THREE.Group(), B = mkB();
  const BZ = {c:'#584532', m:0, lc:'#ffd9a8', lk:0.16}, BZD = {c:'#3f3125', glow:'#ffcf90', gk:0.3}, GLS = {c:'#74675e', m:1, fh:4.05, cw:1.44};
  const CEIL = {c:'#8a7a62', glow:'#ffd7a0', gk:0.5}, LOB = {c:'#6b6359', glow:'#ffe2b8', gk:0.75}, TRV = {c:'#d8ccb4', m:0, lk:0.6};
  const GRN = {c:'#b4a59a', m:0, lc:'#ffe2c0', lk:0.22}, MARB = {c:'#3e5949', m:0, lk:0.2}, POOL = {c:'#35667b', glow:'#7fc8ff', gk:0.4}, JET = {c:'#e6f0f4', glow:'#d8f0ff', gk:0.7};
  const ROOF = '#6f6a63', HX = 13.08, HZ = 21.55, YL = 7.3, FH = 4.05, YT = 157.4;
  const slab = rectP(-HX, HX, -HZ, HZ);
  // curtain wall: glass skin, bronze spandrels per floor, mullions on the 1.44 m module, perimeter-light strips at the window heads
  function cw(P, y0, y1, edges, top){ const gl = B.p(GLS), bz = B.p(BZ);
    wallsP(gl, P, y0, y1, edges);
    for (let y = y0 + FH; y < y1 - 0.5; y += FH){ bandP(bz, P, y - 1.05, 1.05, 0.06, edges); bandP(B.p(CEIL), P, y - 1.35, 0.3, 0.03, edges); }
    stripsP(bz, P, y0, y1, 1.44, 0.14, 0.22, edges, 3);
    if (top) bandP(B.p(BZD), P, y1 - top, top, 0.1, edges);
    bandP(bz, P, y1 - 0.5, 1.1, 0.3, edges); }
  // ---- the slab: lobby storey, shaft, louvred top; corner columns
  cw(slab, YL, YT, null, 11.5);
  flatP(B.p(ROOF), slab, YT + 0.5);
  for (const [x, z] of [[-HX, -HZ], [HX, -HZ], [HX, HZ], [-HX, HZ]]) abox(B.p(BZ), x - 0.5, x + 0.5, 0, YT + 0.6, z - 0.5, z + 0.5);
  // lobby: free-standing bronze-clad columns on the bay lines, recessed glass box, travertine elevator cores
  { const o = B.p(BZ); for (let i = 0; i <= 5; i++) for (const x of [-HX, -HX + 8.72, -HX + 17.44, HX]){ const z = -HZ + i*8.62; if (Math.abs(x) < HX - 0.1 && i > 0 && i < 5) continue; abox(o, x - 0.45, x + 0.45, 0, YL, z - 0.45, z + 0.45); }
    const lp = rectP(-HX + 4.2, HX, -HZ + 4.2, HZ - 4.2); wallsP(B.p(LOB), lp, 0, YL); stripsP(o, lp, 0, YL, 2.9, 0.12, 0.08);
    abox(B.p(TRV), -2, 9, 0.1, YL - 0.1, -8, 8); flatP(B.p(BZ), slab, YL - 0.05); abox(o, -HX, HX, YL - 1.2, YL, -HZ, HZ);
    abox(o, -HX - 3.6, -HX, YL - 2.0, YL - 1.6, -4.5, 4.5); }        // entrance canopy
  // ---- spine (full height) and the bustle / wings behind
  cw(rectP(HX, 21.45, -12.7, 13.5), 0, YT, i => i !== 3, 11.5); flatP(B.p(ROOF), rectP(HX, 21.45, -12.7, 13.5), YT + 0.5);
  { const bu = rectP(21.45, 48.1, -12.67, 13.6); cw(bu, 0, 40, i => i !== 3, 0); flatP(B.p(ROOF), bu, 40.5); wallsP(B.p(BZ), bu, -5, 0); }
  for (const w of [[[21.5, -29.95], [48.1, -29.95], [48.1, -12.67], [21.5, -12.67]], [[21.47, 13.6], [47.5, 13.6], [47.5, 29.85], [21.47, 29.85]]]){
    cw(w, 0, 20, null, 0); flatP(B.p(ROOF), w, 20.5); wallsP(B.p(BZ), w, -5, 0); }
  wallsP(B.p(BZ), slab, -5, 0.1);
  // ---- the plaza (27 m deep): pink granite, raised three steps at the centre of the Park Avenue front, low granite walls with
  // marble caps (benches) to the side streets, the two 14 x 21 m pools at the north-west and south-west corners with marble
  // banquettes and central jet clusters, ivy beds east of the pools; travertine canopies over the side-street entrances
  { const x0 = -42.5, x1 = -HX, z0 = -33.5, z1 = 30.85, gr = B.p(GRN), mb = B.p(MARB);
    const pz = rectP(x0, x1, z0, z1); flatP(gr, pz, 0.45); wallsP(gr, pz, -5, 0.45);
    for (let k = 0; k < 3; k++) abox(gr, x0 - 1.2 + k*0.4, x0 - 0.8 + k*0.4, -0.5, 0.15*(k + 1), -9, 9);
    for (const [za, zb] of [[z0 + 0.3, -9.2], [9.2, z1 - 0.3]]){ abox(gr, x0 - 0.6, x0 + 0.2, -0.5, 0.95, za, zb); abox(mb, x0 - 0.7, x0 + 0.3, 0.95, 1.1, za, zb); }
    for (const [za, zb] of [[-31.0, -9.7], [8.6, 29.9]]){ const xa = -40.5, xb = -26.5;
      flatP(B.p(POOL), rectP(xa, xb, za, zb), 0.32); wallsP(gr, rectP(xa, xb, za, zb).reverse(), 0.2, 0.45);
      for (const [p0, p1, q0, q1] of [[xa - 0.9, xb + 0.9, za - 0.9, za - 0.2], [xa - 0.9, xb + 0.9, zb + 0.2, zb + 0.9], [xb + 0.2, xb + 0.9, za, zb]]) abox(mb, p0, p1, 0.45, 0.9, q0, q1);
      const cx = (xa + xb)/2, cz = (za + zb)/2; for (const [dx, dz] of [[0, 0], [1.2, 0], [-1.2, 0], [0, 1.2], [0, -1.2]]) cylP(B.p(JET), cx + dx, cz + dz, 0.14, 0.05, 0.32, dx || dz ? 2.4 : 3.8, 4, true);
      flatP(B.p({c:'#4f6b3e'}), rectP(xb + 1.5, xb + 6.5, za + 2, zb - 2), 0.62); }
    cylP(B.p(BZ), -33.5, 19.2, 0.12, 0.08, 0.32, 16, 6, true);                          // the bronze flagpole in the south pool
    for (const z of [-HZ - 2.4, HZ + 2.4]) abox(B.p(TRV), 2, 9, 4.6, 5.0, Math.min(z, z + Math.sign(z)*2.6) - 0.01, Math.max(z, z + Math.sign(z)*2.6)); }
  B.flush(g); return g; }};
place('nyseagram', 40.7584, -73.97225, 1.77, -8.55);

// =====================================================================================================================
// Lever House (SOM, Gordon Bunshaft / Natalie de Blois, 1952), 390 Park Avenue between 53rd and 54th Streets: a slender 21-storey
// slab of blue-green glass (93.6 m) standing on the north half of a one-storey podium that floats on stainless-steel pilotis over
// the open ground-floor plaza, with a courtyard open to the sky in its middle and a roof terrace. Curtain wall of blue-green
// vision glass and darker green wired-glass spandrels in a fine stainless grid; the three mechanical storeys at the top are
// spandrel glass all round; the service stalk on the west end. Slab and podium per the OSM footprint; +x = Park Avenue (east).
// Night: lit offices, one mullion in five lit (vertical lines of light), the lit glass lobby under the podium.
LANDMARKS.nylever = {zh:'利华大厦', en:'Lever House', cat:'new', r:43, h:94,
  lt:{m:1, c:'#e8f4f0', k:0.55, anim:'none'}, build(){
  const g = new THREE.Group(), B = mkB();
  const GV = {c:'#5d918d', m:1, fh:3.82, cw:1.45}, GS = {c:'#2b4a55', m:0, lk:0.08}, SSL = {c:'#d2d7db', glow:'#eaf6ff', gk:0.75}, SS = {c:'#c5cacf', m:0, lc:'#eef6ff', lk:0.3};
  const LOB = {c:'#5f7470', glow:'#ffe6c2', gk:0.65}, ROOF = '#8b8f8e', PAV = {c:'#c3bdb1', m:0, lk:0.25}, GRN = '#5f7d48', SOF = {c:'#dde0e2', m:0, lk:0.4};
  const ox = 9.7, oz = 2.0, YP0 = 4.6, YP1 = 9.6, YT = 93.6, FH = (YT - YP1)/22;
  const pod = S([[-7.63,32.24],[-7.67,3.91],[-19.66,3.92],[-19.65,-28.44],[39.13,-28.43],[39.06,32.32]], ox, oz);
  const slab = S([[-7.6,-15.45],[38.6,-15.6],[38.65,0.9],[-7.6,1.1]], ox, oz), stalk = S([[-12.45,-11.8],[-7.6,-11.85],[-7.6,-2.4],[-12.4,-2.4]], ox, oz);
  const hole = rectP(-9, 17, 5, 23);
  // ---- ground: paving, pilotis, the glass lobby under the slab, the enclosed west wing
  { const o = B.p(PAV); flatP(o, pod, 0.12); wallsP(o, pod, -5, 0.12); }
  { const o = B.p(SS); for (const [x, z] of [[-28.4,-29.4],[-19,-29.4],[-9.5,-29.4],[0,-29.4],[9.5,-29.4],[19,-29.4],[28.4,-29.4],[28.4,-20],[28.4,-10],[28.4,0],[28.4,10],[28.4,20],[28.4,29.3],[19,29.3],[9.5,29.3],[0,29.3],[-9.5,29.3],[-16.3,29.3],[-16.3,20],[-16.3,10],[-9,23.8],[17,23.8],[-9,4.2],[17,4.2]])
      abox(o, x - 0.32, x + 0.32, 0, YP0, z - 0.32, z + 0.32); }
  { const lb = rectP(-17.3, 22, -16.6, -2.2); wallsP(B.p(LOB), lb, 0.1, YP0); stripsP(B.p(SS), lb, 0.1, YP0, 1.9, 0.08, 0.05);
    const ww = rectP(-29.35, -17.4, -30.4, 1.9); wallsP(B.p(LOB), ww, 0.1, YP0); stripsP(B.p(SS), ww, 0.1, YP0, 1.9, 0.08, 0.05); }
  // courtyard garden under the opening
  { flatP(B.p(GRN), rectP(-5, 13, 8, 20), 0.3); flatP(B.p({c:'#3f6f80', glow:'#8fd0ff', gk:0.3}), rectP(-2, 8, 11, 17), 0.38);
    for (let k = 0; k < 4; k++) cylP(B.p(GRN), -4 + k*5.6, 9.5, 1.1, 0.4, 0.3, 4.3, 5, true); }
  // ---- podium: one floating storey round the open courtyard, roof terrace
  { const gv = B.p(GV), gs = B.p(GS), ss = B.p(SS);
    wallsP(gv, pod, YP0, YP1); bandP(gs, pod, YP0, 1.1, 0.04); bandP(gs, pod, YP1 - 1.3, 1.3, 0.04); stripsP(ss, pod, YP0, YP1, 1.45, 0.08, 0.06);
    const hw = hole.slice().reverse(); wallsP(gv, hw, YP0, YP1); bandP(gs, hw, YP0, 1.1, 0.04); bandP(gs, hw, YP1 - 1.3, 1.3, 0.04); stripsP(ss, hw, YP0, YP1, 1.45, 0.08, 0.06);
    const so = B.p(SOF), rf = B.p(ROOF);
    for (const t of triang(pod, [hole])){ const all = pod.concat(hole); triP(so, ...t.map(k => [all[k][0], YP0, all[k][1]])); triP(rf, ...t.map(k => [all[k][0], YP1, all[k][1]])); }
    bandP(ss, pod, YP1, 0.9, 0.0); bandP(ss, hw, YP1, 0.9, 0.0);
    for (const [x0, x1, z0, z1] of [[-26, -18, -27, -18], [-24, 22, 25, 28], [22, 27, -26, 0], [-26, -20, -12, -1]]) abox(B.p(GRN), x0, x1, YP1, YP1 + 0.6, z0, z1); }
  // ---- the slab and the stalk
  { const gv = B.p(GV), gs = B.p(GS), ss = B.p(SS), YM = YT - 3*FH;
    for (const [P, ed] of [[slab, null], [stalk, i => i !== 1]]){
      wallsP(gv, P, YP1, YT, ed);
      for (let y = YP1 + FH; y < YM + 0.1; y += FH) bandP(gs, P, y - 1.37, 1.37, 0.03, ed);
      bandP(gs, P, YM, YT - YM, 0.03, ed); stripsP(ss, P, YP1, YT, 1.45, 0.09, 0.07, ed, 2);
      if (P === slab) stripsP(B.p(SSL), P, YP1, YT, 7.25, 0.12, 0.1, null, 6);      // one mullion in five lit at night
      for (let y = YP1 + FH; y < YT; y += FH) bandP(ss, P, y - 0.06, 0.08, 0.08, ed);
      bandP(ss, P, YT - 0.4, 0.8, 0.1, ed); flatP(B.p(ROOF), P, YT + 0.3); }
    abox(B.p(ROOF), -10, 18, YT, YT + 2.2, -14, -3); }
  B.flush(g); return g; }};
place('nylever', 40.75965, -73.973, 9.7, 2.0);

// =====================================================================================================================
// 601 Lexington Avenue, the former Citigroup (Citicorp) Center (Hugh Stubbins, William LeMessurier, 1977), Lexington Avenue
// between 53rd and 54th Streets: a 48.7 m square tower of flush silver aluminium and reflective glass ribbon bands raised on four
// 7.6 m square stilts (34.5 m) set at the middle of each side and the central core, so the corners cantilever 22 m. 46 office
// storeys; above the top office floor (229 m) the crown rises 49 m as a 45-degree slope facing south to the 279 m ridge.
// Under the north-west corner St. Peter's Lutheran Church (1977, dark granite, the folded roof with the diagonal skylight), the
// plaza on Lexington Avenue, and on the east the stepped glazed roofs of the atrium building and the six-storey annex (the part
// east of the atrium is the separate unlabelled key nycitigroupe so the hull spares 880 Third Avenue). Origin = tower axis;
// -x = Lexington Avenue (west), -z = 54th Street. Night: lit offices, the crown slope lit white, warm-lit church and atrium.
const CITI = {AL:{c:'#d4d8db', m:0, lc:'#eef4ff', lk:0.1}, GB:{c:'#56636e', m:1, fh:4.235, cw:3.66}, MUL:{c:'#c3c8cc', m:1, fh:4.235, cw:3.66}, ROOF:'#8c8f92',
  ATR:{c:'#8fa2ad', glow:'#ffe6c4', gk:0.45}, LOB:{c:'#5d6870', glow:'#ffe4bc', gk:0.6}};
// aluminium-and-ribbon-window walls (bands of glass per floor) on polygon P from y0 to y1
function citiWall(B, P, y0, y1, fh, gh, edges){
  wallsP(B.p(CITI.AL), P, y0, y1, edges);
  for (let y = y0; y + gh < y1 - 0.2; y += fh) bandP(B.p(CITI.GB), P, y + (fh - gh)*0.55, gh, 0.05, edges);
  stripsP(B.p(CITI.MUL), P, y0, y1, 3.66, 0.14, 0.08, edges, 4);
}
LANDMARKS.nycitigroup = {zh:'列克星敦大道601号（花旗集团中心）', en:'601 Lexington Avenue (Citigroup Center)', cat:'new', r:93, h:279,
  lt:{m:1, c:'#f2f6ff', k:0.6, e:1, anim:'none'}, build(){
  const g = new THREE.Group(), B = mkB();
  const CRW = {c:'#e3e6e8', m:0, lc:'#ffffff', lk:1.25}, CRS = {c:'#cfd3d6', m:0, lc:'#ffffff', lk:0.9}, SOF = {c:'#cbd0d4', glow:'#fff0d8', gk:0.25};
  const GRA = {c:'#5b524b', m:0, lc:'#ffd6a8', lk:0.55}, CU = {c:'#7f8580', m:0, lk:0.3}, SKY = {c:'#aebcc4', glow:'#ffe2b0', gk:0.7};
  const PAV = {c:'#b9b3aa', m:0, lk:0.25}, WAT = {c:'#5d8696', glow:'#9fd6ff', gk:0.35};
  const ox = 2.0, oz = 11.5, H = 24.85, Y0 = 34.5, NF = 46, FH = 4.235, YE = Y0 + NF*FH, YR = YE + 2*H;     // eave 229.3 (south), ridge 279 (north)
  const sq = rectP(-H, H, -H, H);
  // ---- the raised shaft
  citiWall(B, sq, Y0, YE, FH, 1.95);
  flatP(B.p(SOF), sq, Y0);                                         // underside of the cantilevered tower
  bandP(B.p(CITI.AL), sq, Y0, 1.2, 0.12);
  // ---- crown: east / west triangles and the north face carry the banding on; the south-facing 45-degree slope
  { const al = B.p(CRS), gb = B.p(CITI.GB);
    triP(al, [H, YE, H], [H, YE, -H], [H, YR, -H]); triP(al, [-H, YE, H], [-H, YR, -H], [-H, YE, -H]);
    quadP(al, [-H, YE, -H], [H, YE, -H], [H, YR, -H], [-H, YR, -H]);
    for (let y = YE + 1.2; y < YR - 2.5; y += FH){ const zf = H - (y - YE) - 0.4, zt = H - (y + 1.6 - YE) - 0.4;
      for (const sx of [-1, 1]){ const x = sx*(H + 0.06); quadP(gb, [x, y, -H], [x, y, zf], [x, y + 1.6, zt], [x, y + 1.6, -H]); }
      quadP(gb, [-H, y, -H - 0.06], [H, y, -H - 0.06], [H, y + 1.6, -H - 0.06], [-H, y + 1.6, -H - 0.06]); }
    const cr = B.p(CRW); quadP(cr, [-H, YE, H], [H, YE, H], [H, YR, -H], [-H, YR, -H]);
    for (let k = 1; k < 14; k++){ const t = k/14, y = YE + t*2*H, z = H - t*2*H; segP(B.p(CRS), [-H, y, z], [H, y, z], 0.18, 4); }
    for (let k = 0; k <= 8; k++){ const x = -H + k*2*H/8; segP(B.p(CRS), [x, YE, H], [x, YR, -H], 0.16, 4); }
    abox(B.p(CITI.AL), -H, H, YR - 0.2, YR + 0.6, -H, -H + 1.2); aviP(B.p(RED), [[-H + 1, -H + 0.6], [H - 1, -H + 0.6]], YR + 0.6); }
  // ---- stilts (mid-sides) and the core
  { const al = B.p(CITI.AL), s = 3.8, c = H - s;
    for (const [x, z] of [[c, 0], [-c, 0], [0, -c], [0, c]]){ abox(al, x - s, x + s, -5, Y0, z - s, z + s);
      for (const dx of [-s + 0.9, s - 0.9]) for (const dz of [-s, s]) if (Math.abs(x) > 1) abox(B.p(CITI.MUL), x + dx - 0.5, x + dx + 0.5, 0, Y0, z + dz - 0.12, z + dz + 0.12);
        else abox(B.p(CITI.MUL), x + dz - 0.12, x + dz + 0.12, 0, Y0, z + dx - 0.5, z + dx + 0.5); }
    const core = chamf(8.2, 8.45, 2.1); wallsP(al, core, 0, Y0); bandP(B.p(CITI.LOB), core, 0.3, 6.5, 0.05); }
  // ---- St. Peter's Church: granite prism, folded roof rising to the diagonal (south-west to north-east) skylight ridge
  { const gr = B.p(GRA), x0 = -40.2, x1 = -18.8, z0 = -37.1, z1 = -16.2, yl = 10.5, yh = 18.5;
    const NW = [x0, yl, z0], NE = [x1, yh, z0], SE = [x1, yl, z1], SW = [x0, yh, z1];
    wallsP(gr, rectP(x0, x1, z0, z1), -5, 0.2);
    quadP(gr, [x0, 0, z0], [x1, 0, z0], NE, NW); quadP(gr, [x1, 0, z0], [x1, 0, z1], SE, NE); quadP(gr, [x1, 0, z1], [x0, 0, z1], SW, SE); quadP(gr, [x0, 0, z1], [x0, 0, z0], NW, SW);
    triP(gr, [x0, yl, z0], [x1, yh, z0], [x0, yh, z1]); triP(gr, [x1, yl, z1], [x0, yh, z1], [x1, yh, z0]);
    const sk = B.p(SKY), d = 1.6, ux = (x1 - x0), uz = (z0 - z1), ul = Math.hypot(ux, uz), px = -uz/ul*d, pz = ux/ul*d;
    quadP(sk, [x0 + px, yh + 0.5, z1 + pz], [x1 + px, yh + 0.5, z0 + pz], [x1 - px, yh + 0.5, z0 - pz], [x0 - px, yh + 0.5, z1 - pz]);
    // vertical glazed slots on the street faces
    for (const [a, b2] of [[[x0 - 0.05, z0 + 6], [x0 - 0.05, z0 + 8]], [[x0 + 6, z0 - 0.05], [x0 + 8, z0 - 0.05]]]) quadP(sk, [a[0], 1, a[1]], [b2[0], 1, b2[1]], [b2[0], 15, b2[1]], [a[0], 15, a[1]]);
    // lower wings (7 m) under the tower
    for (const P of [S([[-17.41,-22.14],[-10.13,-22.4],[-10.16,-25.35],[6.35,-25.47],[6.24,-13.29],[-2.04,-13.39],[-2.07,-4.57],[-16.75,-4.44]], ox, oz),
                     S([[-31.56,3.08],[-31.58,-4.79],[-16.75,-4.44],[-1.84,-4.6],[-1.84,3.08]], ox, oz)]){ wallsP(gr, P, -5, 7); flatP(B.p(PAV), P, 7); bandP(B.p(CITI.LOB), P, 1.0, 3.0, 0.05); }
    // the cross on the Lexington face (plain bronze bars)
    abox(CU === null ? gr : B.p(CU), x0 - 0.35, x0 - 0.1, 6, 9, -27.4, -26.9); abox(B.p(CU), x0 - 0.35, x0 - 0.1, 7.7, 8.2, -28.2, -26.1); }
  // ---- plaza on Lexington Avenue (stepped fountain walls of the sunken plaza suggested at grade) and paving under the tower
  { const pv = B.p(PAV), PZ = [[-40.6, -16], [-18.5, -16], [-18.5, -8.4], [3.7, -8.4], [3.7, 24.9], [-40.6, 24.9]]; flatP(pv, PZ, 0.15); wallsP(pv, PZ, -5, 0.15);
    for (let k = 0; k < 4; k++){ abox(pv, -39.5 + k*1.1, -38.4 + k*1.1, 0.15, 0.6 + k*0.45, 2 + k*1.1, 23.5); abox(B.p(WAT), -39.45 + k*1.1, -38.45 + k*1.1, 0.6 + k*0.45, 0.66 + k*0.45, 2.2 + k*1.1, 23.3); }
    for (let k = 0; k < 6; k++) cylP(B.p({c:'#5f7a48'}), -30 + (k % 3)*5, 6 + Math.floor(k/3)*9, 1.8, 0.5, 0.15, 5.5, 5, true); }
  // ---- east side: stepped glazed roofs of the atrium building (OSM 10 / 14 / 18 / 22 m) and the annex west part (26 m)
  { const zN = -36.95, zS = 24.85;
    for (const [xa, xb, h] of [[3.7, 15.45, 10], [14.7, 17.8, 14], [17.8, 20.8, 18], [20.8, 24.5, 22]]){ const P = rectP(xa, xb, zN, zS);
      wallsP(B.p(CITI.AL), P, -5, h - 1.5, i => i !== 3); flatP(B.p(CITI.ATR), P, h); wallsP(B.p(CITI.ATR), P, h - 1.5, h, i => i !== 3);
      bandP(B.p(CITI.LOB), P, 0.4, Math.min(h - 3, 5), 0.06, i => i === 0 || i === 2); } }
  const anx = S([[25.81,36.46],[26.54,-25.34],[72.87,-25.4],[72.87,-15.8],[44.19,-15.57],[43.87,20.16],[57.76,20.47],[57.91,36.62]], ox, oz);
  citiWall(B, anx, -5, 26, 4.3, 1.9); flatP(B.p(CITI.ROOF), anx, 26);
  bandP(B.p(CITI.LOB), anx, 0.3, 4.2, 0.1, i => i !== 0);
  const atr = S([[43.87,20.16],[44.19,-15.57],[72.87,-15.8],[72.66,5.47],[57.67,5.66],[57.76,20.47]], ox, oz);
  { const o = B.p(CITI.ATR); flatP(o, atr, 30); wallsP(o, atr, 26, 30); stripsP(B.p(CITI.MUL), atr, 26, 30, 3.0, 0.15, 0.05); }
  for (const P of [rectP(27.6, 39.6, -9.8, 8.3)]){ wallsP(B.p(CITI.AL), P, 26, 28); flatP(B.p(CITI.ROOF), P, 28); }
  B.flush(g); return g; }};
place('nycitigroup', 40.7585, -73.9702, 2.0, 11.5);
// the annex east of the atrium (separate key: its own hiding hull)
LANDMARKS.nycitigroupe = {zh:'列克星敦大道601号附楼', en:'601 Lexington Avenue annex', cat:'new', r:22, h:26, label:false,
  lt:{m:1, c:'#f2f6ff', k:0.5, anim:'none'}, build(){
  const g = new THREE.Group(), B = mkB(), cx = 79.0, cz = -10.0;
  const P = S([[72.87,-25.4],[87.04,-24.91],[86.62,5.51],[72.66,5.47]], cx, cz);
  citiWall(B, P, -5, 26, 4.3, 1.9); flatP(B.p(CITI.ROOF), P, 26); bandP(B.p(CITI.LOB), P, 0.3, 4.2, 0.1, i => i !== 3);
  B.flush(g); return g; }};
place('nycitigroupe', 40.7585, -73.9702, 79.0, -10.0);

// =====================================================================================================================
// 550 Madison Avenue (Philip Johnson and John Burgee, 1984; the former AT&T / Sony Building), Madison Avenue between 55th and
// 56th Streets: a 37-storey, 197 m slab (61 x 31 m) of rough pink-grey Stony Creek granite, the windows recessed between piers
// in the Madison / west rhythm of the 1-4-4-4-8-4-4-4-1 bays and six bays on the side streets; the top three storeys glazed.
// Crown: the broken pediment ("Chippendale" top) - a 12 m gable over the Madison and west faces with flared raking edges and
// the 10.4 m circular notch running through the roof. Base: the 35.4 m high, 15.2 m wide entrance arch recessed 6 m with its
// arched window and oculus, flanked by three 18.3 m rectangular openings each side. Origin = slab centre; +x = Madison Avenue
// (east), -z = 56th Street. Night: lit offices, the pediment floodlit warm white, the lit arch and arcade.
LANDMARKS.ny550madison = {zh:'麦迪逊大道550号', en:'550 Madison Avenue', cat:'new', r:36, h:197,
  lt:{m:1, c:'#ffe7c8', k:0.6, e:1, anim:'none'}, build(){
  const g = new THREE.Group(), B = mkB();
  const GR = {c:'#c6a294', m:0, lc:'#ffe2c4', lk:0.12}, GRT = {c:'#caa597', m:0, lc:'#ffe0b8', lk:1.25}, GRD = {c:'#b8958a', m:0, lc:'#ffe2c4', lk:0.12};
  const GW = {c:'#3c4248', m:1, fh:4.6, cw:1.45}, ARC = {c:'#5a646c', glow:'#ffe2b0', gk:0.65}, MUL = {c:'#8f9599', m:0, lk:0.2}, ROOF = '#857a74';
  const HX = 15.7, HZ = 30.15, YB = 36.6, YE = 185, YA = 197, FH = 4.6, YG = YE - 13;      // base top, eave, apex, glazed top storeys
  const slab = rectP(-HX, HX, -HZ, HZ);
  { const o = B.p(GW); wallsP(o, slab, YB - 1, YE); }
  wallsP(B.p(GR), slab, -5, 0.3);
  // facade grid: piers between bays, mullions in the groups, granite spandrels per floor (none on the glazed top storeys)
  const longBays = (() => { const W = 2*HZ, pier = 1.25, endw = 2.4, ws = (W - 10*pier - 2*endw)/32, B2 = []; let s = pier;
    const grp = [1, 4, 4, 4, 8, 4, 4, 4, 1]; for (const n of grp){ const w = n === 1 ? endw : n*ws; B2.push([s, s + w, n === 1 ? 1 : n]); s += w + pier; } return B2; })();
  const sideBays = (() => { const W = 2*HX, pier = 1.3, n = 6, w = (W - (n + 1)*pier)/n, B2 = []; for (let k = 0; k < n; k++){ const s = pier + k*(w + pier); B2.push([s, s + w, 3]); } return B2; })();
  for (let i = 0; i < 4; i++){ const F = edgeF(slab, i), bays = F.L > 40 ? longBays : sideBays, gr = B.p(GR), mu = B.p(GRD);
    let s0 = 0; for (const [a, b] of bays){ faceRect(gr, F, s0, a, YB, YE, 0.55, 0.55); s0 = b; } faceRect(gr, F, s0, F.L, YB, YE, 0.55, 0.55);
    for (const [a, b, n] of bays) for (let k = 1; k < n; k++){ const s = a + (b - a)*k/n; faceRect(mu, F, s - 0.13, s + 0.13, YB, YG, 0.3, 0.3); faceRect(B.p(MUL), F, s - 0.06, s + 0.06, YG, YE, 0.12, 0.12); }
    for (let y = YB + FH; y < YG + 0.1; y += FH) for (const [a, b] of bays) faceRect(gr, F, a, b, y - 1.7, y, 0.35, 0.35);
    faceRect(gr, F, 0, F.L, YB - 1.6, YB, 0.75, 0.75); faceRect(gr, F, 0, F.L, YE - 0.9, YE, 0.8, 0.8); }
  // ---- crown: broken pediment (gable over the long faces, ridge along x) with the circular notch through the roof
  { const r = 5.2, yc = 194.0, slopeY = z => YA - (YA - YE)*Math.abs(z)/HZ;
    let zi = 0; for (let z = 0; z < HZ; z += 0.02){ const yy = yc + Math.sqrt(Math.max(0, r*r - z*z)); if (z > r || slopeY(z) <= yy){ zi = z; break; } }
    const yi = slopeY(zi), a0 = Math.atan2(yi - yc, zi);
    // outline in (z, y): eave corners -> slope -> notch arc (lower half) -> slope
    const arcPts = []; for (let k = 0; k <= 20; k++){ const a = a0 - (PI + 2*a0)*k/20; arcPts.push([Math.cos(a)*r, yc + Math.sin(a)*r]); }
    const outline = [[-HZ, YE], [HZ, YE]].concat(arcPts.map(p => [p[0], p[1]])).concat([[-zi, yi]]);
    // arcPts runs from (zi, yi) round the bottom to (-zi, yi)
    const pg = B.p(GRT);
    for (const sx of [1, -1]){ const x = sx*HX, T = triang(outline); for (const t of T) triP(pg, ...t.map(k => [x, outline[k][1], outline[k][0]])); }
    // roof planes from the eaves to the notch, the notch (half cylinder) through the depth
    quadP(pg, [-HX, YE, HZ], [HX, YE, HZ], [HX, yi, zi], [-HX, yi, zi]); quadP(pg, [-HX, YE, -HZ], [HX, YE, -HZ], [HX, yi, -zi], [-HX, yi, -zi]);
    for (let k = 0; k < 20; k++){ const p = arcPts[k], q = arcPts[k + 1]; quadP(pg, [-HX, p[1], p[0]], [HX, p[1], p[0]], [HX, q[1], q[0]], [-HX, q[1], q[0]]); }
    // flared raking cornices along the slopes on both faces, and the eave cornice
    for (const sx of [1, -1]){ const x = sx*(HX + 0.5); for (const sz of [1, -1]){ segP(pg, [x, YE + 0.2, sz*HZ], [x, yi + 0.2, sz*zi], 0.55, 4); }
      segP(pg, [x, YE, -HZ], [x, YE, HZ], 0.5, 4); } }
  // ---- base: Madison Avenue face with the arch and the arcade openings (recessed glazing), side and west faces
  { const F = edgeF(slab, 1), gr = B.p(GR), arc = B.p(ARC);      // edge 1 = x = +HX (Madison), s from z = -HZ to +HZ
    const mid = F.L/2, aw = 15.2, ah = 35.4, op = [];
    for (const sg of [-1, 1]) for (let k = 0; k < 3; k++){ const c = mid + sg*(aw/2 + 1.3 + 3.05 + k*7.4); op.push([[c - 3.05, 0], [c + 3.05, 0], [c + 3.05, 18.3], [c - 3.05, 18.3]]); }
    const archO = archPts(mid, aw, ah, 14);
    faceShapeP(gr, F, [[0, 0], [F.L, 0], [F.L, YB], [0, YB]], [archO.slice().reverse()].concat(op.map(o => o.slice().reverse())), 0.0);
    // arcade: recessed glass and soffits
    for (const o of op){ const s0 = o[0][0], s1 = o[1][0]; faceRect(arc, F, s0, s1, 0, 18.3, -1.8); faceRect(gr, F, s0, s1, 18.3, 18.31, 0, 1.8);
      faceRect(gr, F, s0 - 0.01, s0, 0, 18.3, 0, 1.8); faceRect(gr, F, s1, s1 + 0.01, 0, 18.3, 0, 1.8); }
    // the arch: 6 m deep reveal (jambs and barrel soffit), the arched window with mullions and the oculus at the back
    const r = aw/2, ys = ah - r, D = 6.0;
    for (let k = 0; k < 14; k++){ const a0 = PI*k/14, a1 = PI*(k + 1)/14, p = F.at(mid + Math.cos(a0)*r, ys + Math.sin(a0)*r, 0), q = F.at(mid + Math.cos(a1)*r, ys + Math.sin(a1)*r, 0);
      const p2 = F.at(mid + Math.cos(a0)*r, ys + Math.sin(a0)*r, -D), q2 = F.at(mid + Math.cos(a1)*r, ys + Math.sin(a1)*r, -D); quadP(gr, p, q, q2, p2); }
    faceRect(gr, F, mid - r - 0.01, mid - r, 0, ys, 0, D); faceRect(gr, F, mid + r, mid + r + 0.01, 0, ys, 0, D);
    faceShapeP(arc, F, archPts(mid, aw, ah, 14), null, -D);
    const mu = B.p(MUL); for (let k = 1; k < 6; k++){ const s = mid - r + k*aw/6; faceRect(mu, F, s - 0.12, s + 0.12, 0, ys + Math.sqrt(Math.max(0, r*r - (s - mid)**2)) - 0.2, -D + 0.1); }
    for (let y = 4.6; y < ah - 1; y += 4.6) faceRect(mu, F, mid - r, mid + r, y, y + 0.2, -D + 0.12);
    const oc = []; for (let k = 0; k < 16; k++){ const a = TAU*k/16; oc.push([mid + Math.cos(a)*4.4, ys + 0.6 + Math.sin(a)*4.4]); }
    for (let k = 0; k < 16; k++){ const p = oc[k], q = oc[(k + 1) % 16]; segP(mu, F.at(p[0], p[1], -D + 0.2), F.at(q[0], q[1], -D + 0.2), 0.3, 4); }
    // other three faces: tall glazed openings in the base, granite piers
    for (const i of [0, 2, 3]){ const E = edgeF(slab, i), n = E.L > 40 ? 9 : 4, w = E.L/n;
      for (let k = 0; k < n; k++) faceRect(arc, E, k*w + 1.2, (k + 1)*w - 1.2, 0.3, i === 3 ? 10 : 14, 0.05);
      faceRect(gr, E, 0, E.L, YB - 9, YB - 8.2, 0.4, 0.4); } }
  flatP(B.p(ROOF), slab, YE - 0.1); flatP(B.p(GRD), slab, 0.05);
  B.flush(g); return g; }};
place('ny550madison', 40.7614, -73.9737, 23.0, -15.6);

// =====================================================================================================================
// 270 Park Avenue (Foster + Partners, 2025; JPMorgan Chase headquarters), the full block between Madison and Park Avenues,
// 47th and 48th Streets: 60 storeys, 423 m. The tower steps back toward both avenues in tiers (OSM parts: 130, 250, 330, 382 m,
// the centre to 423 m), each stepped end face carrying the bronze macro-bracing diamonds; the long street faces of dark
// reflective glass with bronze I-beam mullions step out band by band toward the middle. The tower is lifted 26 m above the
// street on bronze fan columns splaying from six pivot points round the base (the Grand Central tracks run beneath), over the glazed
// double-height lobby; at the avenue ends the bronze soffit slopes back with circular grilles. Crown: the top tier, bronze
// diamonds over glass screens lit by slowly rising bands of white light (Leo Villareal). Origin = centre of the block-long
// tower; +x = Park Avenue (east), -z = 48th Street. Night: lit offices, the crown sweeping in white bands.
LANDMARKS.ny270park = {zh:'公园大道270号（摩根大通总部）', en:'270 Park Avenue', cat:'new', r:67, h:423,
  lt:{m:1, c:'#ffffff', k:0.65, e:1, anim:'sweep'}, build(){
  const g = new THREE.Group(), B = mkB();
  const GL = {c:'#3c4954', m:1, fh:4.4, cw:3.0, lk:0.04}, BZ = {c:'#8a6a47', m:0, lc:'#ffe2c0', lk:0.1}, BZS = {c:'#7a5d3e', m:0, lc:'#ffe2c0', lk:0.35};
  const LOB = {c:'#4d5a63', glow:'#ffe6c4', gk:0.6}, CRW = {c:'#b9c0c5', m:0, lc:'#ffffff', lk:1.7}, ROOF = '#7c7f80', GRN = '#5d7a48', GRL = {c:'#2f2a24'};
  const YB = 26, FH = 4.4;
  // tiers west -> east: x edges, z extents (OSM parts, symmetric), tops
  const XE = [-54.77, -42.7, -30.7, -18.7, -6.4, 6.0, 18.3, 30.4, 42.3, 54.8];
  const ZE = [[-22.5, 21.7], [-24.25, 23.45], [-26.15, 25.3], [-27.85, 27.25], [-28.55, 28.55], [-27.85, 27.25], [-26.15, 25.3], [-24.25, 23.45], [-22.5, 21.7]];
  const TOP = [130, 250, 330, 382, 423, 382, 330, 250, 130];
  const gl = B.p(GL), bz = B.p(BZ);
  for (let i = 0; i < 9; i++){ const [x0, x1] = [XE[i], XE[i + 1]], [z0, z1] = ZE[i], y1 = TOP[i], crown = i === 4;
    const yg = crown ? 382 : y1;
    // long faces (north z0, south z1): glass with bronze mullions every 3 m and floor lines
    for (const [z, sg] of [[z0, -1], [z1, 1]]){
      quadP(gl, [x0, YB, z], [x1, YB, z], [x1, yg, z], [x0, yg, z]);
      const n = Math.round((x1 - x0)/3.0); for (let k = 0; k <= n; k++){ const x = x0 + (x1 - x0)*k/n; abox(bz, x - 0.18, x + 0.18, YB, yg, Math.min(z, z + sg*0.55), Math.max(z, z + sg*0.55)); }
      for (let y = YB + FH; y < yg - 0.5; y += FH) abox(bz, x0, x1, y - 0.25, y, Math.min(z, z + sg*0.12), Math.max(z, z + sg*0.12));
      abox(bz, x0, x1, yg - 1.0, yg + 0.8, Math.min(z, z + sg*0.4), Math.max(z, z + sg*0.4));
    }
    // step returns between neighbouring bands on the long faces (where this band stands proud of the next one)
    for (const j of [i - 1, i + 1]){ if (j < 0 || j > 8) continue; const xs = j < i ? x0 : x1, yt = Math.min(yg, TOP[j] === 423 ? 382 : TOP[j]);
      for (const [za, zb] of [[z0, ZE[j][0]], [ZE[j][1], z1]]) if (Math.abs(za - zb) > 0.05) quadP(gl, [xs, YB, za], [xs, YB, zb], [xs, yt, zb], [xs, yt, za]);
      if (yg > yt) quadP(gl, [xs, yt, z0], [xs, yt, z1], [xs, yg, z1], [xs, yg, z0]); }
    if (i === 0 || i === 8){ const xs = i === 0 ? x0 : x1; quadP(gl, [xs, YB, z0], [xs, YB, z1], [xs, yg, z1], [xs, yg, z0]); }
    // roof terrace of the tier (parapet, planting)
    if (!crown){ flatP(B.p(ROOF), rectP(x0, x1, z0, z1), y1); abox(B.p(GRN), x0 + 1.5, x1 - 1.5, y1, y1 + 0.7, z0 + 3, z1 - 3); }
  }
  // macro-bracing diamonds on every stepped end face (east and west): chains of rhombi between the face corners
  const diamonds = (xs, z0, z1, ya, yb, k, o) => { const zm = (z0 + z1)/2, h = (yb - ya)/k;
    for (let m = 0; m < k; m++){ const y0 = ya + m*h, y1 = y0 + h, ym = (y0 + y1)/2;
      const P = [[xs, y0, zm], [xs, ym, z1], [xs, y1, zm], [xs, ym, z0]]; for (let q = 0; q < 4; q++) segP(o, P[q], P[(q + 1) % 4], 0.75, 4);
      segP(o, [xs, y0, z0], [xs, y0, z1], 0.6, 4); }
    segP(o, [xs, yb, z0], [xs, yb, z1], 0.6, 4); segP(o, [xs, ya, z0], [xs, yb, z0], 0.7, 4); segP(o, [xs, ya, z1], [xs, yb, z1], 0.7, 4); };
  for (const sd of [-1, 1]){
    const off = sd*0.9;
    diamonds(sd*54.8 + off, -22.5, 21.7, YB, 130, 2, bz);
    diamonds(sd*(sd < 0 ? 42.7 : 42.3) + off, -24.25, 23.45, 130, 250, 2, bz);
    diamonds(sd*(sd < 0 ? 30.7 : 30.4) + off, -26.15, 25.3, 250, 330, 1, bz);
    diamonds(sd*(sd < 0 ? 18.7 : 18.3) + off, -27.85, 27.25, 330, 382, 1, bz);
  }
  // ---- crown (382 - 423): bronze diamonds over lit screens on the end faces, lit screens behind the long-face mullions
  { const cr = B.p(CRW), x0 = -6.4, x1 = 6.0, z0 = -28.55, z1 = 28.55;
    for (const x of [x0, x1]) quadP(cr, [x, 382, z0], [x, 382, z1], [x, 423, z1], [x, 423, z0]);
    for (const z of [z0, z1]) quadP(cr, [x0, 382, z], [x1, 382, z], [x1, 423, z], [x0, 423, z]);
    for (const [x, sd] of [[x0, -1], [x1, 1]]) diamonds(x + sd*0.9, z0, z1, 382, 423, 1, bz);
    for (let y = 386; y < 422; y += 4.1) for (const z of [z0, z1]) abox(B.p(BZS), x0, x1, y, y + 0.35, z - 0.5, z + 0.5);
    flatP(B.p(ROOF), rectP(x0 + 0.5, x1 - 0.5, z0 + 0.5, z1 - 0.5), 421.5);
    aviP(B.p(RED), [[0, z0 + 2], [0, z1 - 2]], 423); }
  // ---- the lifted base: glazed lobby recessed 5 m behind the long faces, bronze soffit, fan columns; sloped ends with grilles
  { const lb = rectP(-48, 48, -17.5, 16.5), lo = B.p(LOB); wallsP(lo, lb, 0, YB); flatP(B.p(BZS), lb, YB - 0.2);
    stripsP(B.p(BZ), lb, 0, YB, 3.0, 0.2, 0.1); wallsP(B.p(BZS), lb, -5, 0);
    flatP(B.p({c:'#c8c1b4', m:0, lk:0.25}), rectP(-58, 58, -31, 31), 0.1);
    // soffits under the tiers (from the long faces back to the lobby line)
    for (let i = 0; i < 9; i++){ const [x0, x1] = [XE[i], XE[i + 1]], [z0, z1] = ZE[i];
      quadP(B.p(BZS), [x0, YB, z0], [x1, YB, z0], [x1, YB, -17.5], [x0, YB, -17.5]); quadP(B.p(BZS), [x0, YB, 16.5], [x1, YB, 16.5], [x1, YB, z1], [x0, YB, z1]);
      for (const z of [z0, z1]) abox(B.p(BZS), x0, x1, YB - 2.2, YB, Math.min(z, z + Math.sign(z)*0.5), Math.max(z, z + Math.sign(z)*0.5)); }
    // fan columns: nodes on the ground under each long face, members fanning to the tower edge at 26 m
    // six pivot points round the base (three under each long face), each splaying a fan of five bronze-clad columns
    const nodes = [-36.5, 0, 36.5];
    for (const sd of [-1, 1]) for (const nx of nodes){ const zf = sd < 0 ? -26.8 : 26.2, zn = zf - sd*3.0, N = [nx, 1.2, zn];
      boxP(bz, 3.2, 1.2, 3.2, nx, 0, zn); cylP(bz, nx, zn, 1.3, 0.9, 1.2, 3.2, 8, true);
      for (const dx of [-16, -8, 0, 8, 16]) segP(bz, N, [nx + dx, YB - 1, zf], dx === 0 ? 1.0 : 0.85, 6); }
    // the avenue ends: soffit sloping back from the tower edge at 26 m to the lobby wall, circular grilles
    for (const sd of [-1, 1]){ const xt = sd*54.8, xb = sd*48, z0 = -22.5, z1 = 21.7, o = B.p(BZS);
      quadP(o, [xt, YB, z0], [xt, YB, z1], [xb, 7, z1], [xb, 7, z0]);
      for (let k = 0; k < 5; k++){ const zc = lerp(z0 + 5, z1 - 5, k/4), t = 0.55, xc = lerp(xt, xb, t) + sd*0.3, yc = lerp(YB, 7, t);
        const ring = []; for (let q = 0; q < 12; q++){ const a = q/12*TAU; ring.push([xc + Math.cos(a)*1.8*(xb - xt)/Math.hypot(xb - xt, 7 - YB)*0, yc + Math.sin(a)*1.8*0.94, zc + Math.cos(a)*1.8]); }
        const c = [xc, yc, zc]; for (let q = 0; q < 12; q++) triP(B.p(GRL), c, ring[q], ring[(q + 1) % 12]); }
      for (const z of [-15, 0, 15]) segP(bz, [xb + sd*0.2, 0, z], [xt, YB - 0.5, z], 0.75, 4); }
  }
  B.flush(g); return g; }};
place('ny270park', 40.7557, -73.9754, -56.8, -3.35);
}
