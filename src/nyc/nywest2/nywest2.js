// ===== nyc/nywest2: Madison Square / Penn Station / Hudson Yards edge / Port Authority (City Brush v32, New York 1:1).
// Met Life Tower (+ One Madison), New York Life Building, Appellate Division Courthouse, Moynihan Train Hall in the Farley
// Building, The New Yorker Hotel, Manhattan West (One + Two), The Spiral, Javits Center (3 keys), Port Authority Bus Terminal
// (2 keys), One Penn Plaza. Models are built in the Manhattan street-grid frame: local +x = east-south-east along the
// cross streets, local -z = up the avenues, rot = -0.506. Plans follow the OSM footprints / parts of SC/nyc/ref_nywest2.json.
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
const T = (P, ox, oz) => P.map(p => [p[0] - ox, p[1] - oz]);
const R4 = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
// rounded rectangle (corner radius r, k segments per corner), counter-clockwise in plan
function rrect(x0, x1, z0, z1, r, k){
  const P = [], C = [[x1 - r, z1 - r, 0], [x0 + r, z1 - r, HP], [x0 + r, z0 + r, PI], [x1 - r, z0 + r, PI + HP]];
  for (const [cx, cz, a0] of C) for (let i = 0; i <= k; i++){ const a = a0 + HP*i/k; P.push([cx + Math.cos(a)*r, cz + Math.sin(a)*r]); }
  return P;
}
// a glass / curtain-wall prism: walls into G, floor bands + mullions into M, roof into Rf
function curtainP(G, M, Rf, P, y0, y1, fh, sp, opt){
  opt = opt || {};
  wallsP(G, P, y0, y1);
  if (Rf) flatP(Rf, P, y1);
  if (M){
    for (let y = y0 + fh; y < y1 - 0.4; y += fh) bandP(M, P, y - (opt.bh || 0.35), opt.bh || 0.35, opt.boff || 0.06);
    stripsP(M, P, y0, y1, sp, opt.mw || 0.22, opt.moff || 0.12, null, 1.5, false);
    if (opt.cap !== false) bandP(M, P, y1 - 0.9, 1.1, 0.12);
  }
}
// masonry prism: wall face in W (window colour) + piers / spandrels in S (stone)
function masonP(W, S, Rf, P, y0, y1, fh, sp, pw, off){
  wallsP(W, P, y0, y1);
  if (Rf) flatP(Rf, P, y1);
  stripsP(S, P, y0, y1, sp, pw || 0.9, off || 0.25, null, 1.2, true);
  for (let y = y0 + fh; y < y1 - 0.5; y += fh) bandP(S, P, y - 1.0, 1.0, 0.12);
}
// pyramid / hip from polygon P at y0 to a smaller polygon Q at y1 (same vertex count), capped
function frustP(o, P, y0, Q, y1, cap){
  const n = P.length;
  for (let i = 0; i < n; i++){ const j = (i + 1) % n; quadP(o, [P[i][0], y0, P[i][1]], [P[j][0], y0, P[j][1]], [Q[j][0], y1, Q[j][1]], [Q[i][0], y1, Q[i][1]]); }
  if (cap) flatP(o, Q, y1);
}
const scaleP = (P, k, cx, cz) => P.map(p => [cx + (p[0] - cx)*k, cz + (p[1] - cz)*k]);
const cenP = P => { let x = 0, z = 0; for (const p of P){ x += p[0]; z += p[1]; } return [x/P.length, z/P.length]; };
// n-gon ring in plan
const ngon = (cx, cz, r, n, a0) => { const P = []; for (let i = 0; i < n; i++){ const a = (a0 || 0) + i/n*TAU; P.push([cx + Math.cos(a)*r, cz + Math.sin(a)*r]); } return P; };
// a robed statue (abstract, no face): plinth + body + head
function statueP(o, x, y, z, s){
  boxP(o, 1.0*s, 0.5*s, 1.0*s, x, y, z);
  cylP(o, x, z, 0.42*s, 0.3*s, y + 0.5*s, y + 2.0*s, 6, true);
  cylP(o, x, z, 0.2*s, 0.2*s, y + 2.0*s, y + 2.45*s, 6, true);
}
// Corinthian-ish column: base, shaft (n sides), capital
function columnP(o, x, z, y0, h, r, n){
  boxP(o, r*2.6, h*0.035, r*2.6, x, y0, z);
  cylP(o, x, z, r, r*0.86, y0 + h*0.035, y0 + h*0.9, n || 8, false);
  cylP(o, x, z, r*0.9, r*1.35, y0 + h*0.9, y0 + h*0.975, n || 8, false);
  boxP(o, r*2.8, h*0.025, r*2.8, x, y0 + h*0.975, z);
}
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
// ===================================================================================================================
// ny1madison — Metropolitan Life Insurance Company Tower (1909, Napoleon LeBrun & Sons, 213 m) on the NW corner of its
// block (Madison Ave / E 24th St) + the rest of the block, One Madison Avenue (KPF 2023 tower on the 1960s base, ~142 m),
// which shares the block footprint (both hidden together). Frame = ny1madison ref anchor, grid-aligned; origin = tower centre.
LANDMARKS.ny1madison = {zh:'大都会人寿保险大楼', en:'Metropolitan Life Insurance Company Tower', cat:'old', r:128, h:214,
  lt:{m:0, c:'#fff1d8', k:0.85, e:0.55, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB(), OX = 2.55, OZ = 15.3;
  const MARB = '#e9e4d8', MARB2 = '#d9d2c2', WIN = {c:'#59606a', m:1, fh:3.9, cw:2.1}, GOLD = {c:'#caa24c', glow:'#ffcf6a', gk:0.9};
  const CLK = {c:'#f2efe6', glow:'#fff6dc', gk:1.1}, HAND = '#2b2622', ROOFG = '#8d8b86';
  const GL = {c:'#8497a6', m:1, fh:4.1, cw:3.0}, FIN = '#dfe3e4', LANT = {c:'#fff3c8', glow:'#fff0b0', gk:2.0};
  const ma = B.p(MARB), ma2 = B.p(MARB2), wi = B.p(WIN), go = B.p(GOLD), ck = B.p(CLK), ha = B.p(HAND), rg = B.p(ROOFG);
  const gl = B.p(GL), fi = B.p(FIN), la = B.p(LANT);
  // ---- the tower (frame centre 2.55, 15.3)
  const cx = 2.55 - OX, cz = 15.3 - OZ, hx = 11.45, hz = 10.5;
  const Rq = (ax, az) => R4(cx - ax, cx + ax, cz - az, cz + az);
  prismP(ma2, Rq(hx + 1.6, hz + 1.1), -5, 0.4, false);                      // plinth
  // base (floors 1-5): rusticated, slightly wider, arched entrance bays
  const BASE = Rq(hx + 1.3, hz + 0.75);
  masonP(wi, ma, null, BASE, 0.4, 21, 4.2, 3.2, 1.3, 0.3);
  bandP(ma, BASE, 0.4, 3.0, 0.15);
  bandP(ma, BASE, 19.6, 1.6, 0.55);                                           // cornice over the base
  // shaft 21..163: window wall + corner piers + intermediate piers + spandrels
  const SH = Rq(hx, hz);
  wallsP(wi, SH, 21, 163);
  for (let i = 0; i < 4; i++){ const F = edgeF(SH, i), L = F.L;
    faceRect(ma, F, -0.3, 2.6, 21, 163, 0.3, 0.6); faceRect(ma, F, L - 2.6, L + 0.3, 21, 163, 0.3, 0.6);     // corner piers
    const n = 3, w = (L - 5.2)/n;
    for (let k = 1; k < n; k++) faceRect(ma, F, 2.6 + k*w - 0.55, 2.6 + k*w + 0.55, 21, 148, 0.22, 0.45);
    for (let k = 0; k < n; k++){ const s0 = 2.6 + k*w, s1 = s0 + w;   // mullion pairs inside each bay
      faceRect(ma2, F, s0 + w/3 - 0.12, s0 + w/3 + 0.12, 21, 148, 0.08); faceRect(ma2, F, s0 + 2*w/3 - 0.12, s0 + 2*w/3 + 0.12, 21, 148, 0.08); }
    for (let y = 24.9; y < 147; y += 3.9) if (y < 99 || y > 118) faceRect(ma2, F, 2.6, L - 2.6, y - 0.9, y, 0.1);
    // clock (floors 25-27): square marble surround, dial, ticks, hands
    const yc = 108.5, sm = L/2;
    faceRect(ma, F, 2.6, L - 2.6, 99.5, 117.5, 0.25, 0.6);
    const dial = [], rim = []; for (let k = 0; k < 28; k++){ const a = k/28*TAU; dial.push([sm + Math.cos(a)*4.05, yc + Math.sin(a)*4.05]); rim.push([sm + Math.cos(a)*4.6, yc + Math.sin(a)*4.6]); }
    faceShapeP(ma2, F, rim, null, 0.3); faceShapeP(ck, F, dial, null, 0.42);
    for (let k = 0; k < 12; k++){ const a = k/12*TAU, c = Math.cos(a), s = Math.sin(a);
      const p0 = [sm + c*3.3, yc + s*3.3], p1 = [sm + c*3.85, yc + s*3.85], nx = -s*0.17, ny = c*0.17;
      faceShapeP(ha, F, [[p0[0] - nx, p0[1] - ny], [p0[0] + nx, p0[1] + ny], [p1[0] + nx, p1[1] + ny], [p1[0] - nx, p1[1] - ny]], null, 0.46); }
    const hand = (a, l, w) => { const c = Math.cos(a), s = Math.sin(a), nx = -s*w, ny = c*w; faceShapeP(ha, F, [[sm - nx, yc - ny], [sm + nx, yc + ny], [sm + c*l + nx*0.4, yc + s*l + ny*0.4], [sm + c*l - nx*0.4, yc + s*l - ny*0.4]], null, 0.5); };
    hand(PI/2 - 0.5 - i*0.9, 2.5, 0.22); hand(PI/2 + 1.2 + i*0.7, 3.5, 0.15);
    // loggia (floors 37-40): three tall arches per face between piers + balcony
    for (let k = 0; k < 3; k++){ const s0 = 2.6 + k*w;
      faceShapeP(ma, F, [[s0 - 0.6, 148], [s0 + w + 0.6, 148], [s0 + w + 0.6, 161.5], [s0 - 0.6, 161.5]], [archPts(s0 + w/2, w - 1.2, 12.2, 8).map(p => [p[0], p[1] + 148.6]).reverse()], 0.25); }
    faceRect(ma, F, -0.6, L + 0.6, 146.8, 148.2, 0.7, 1.0);                    // balcony
  }
  bandP(ma, SH, 161.5, 1.5, 0.7); bandP(ma2, SH, 163, 1.2, 1.0);              // cornice
  flatP(rg, SH, 163.0);
  // pyramid 164..188 to the lantern base, with small dormers
  const PY0 = Rq(hx - 0.6, hz - 0.6), PY1 = Rq(5.45, 4.4);
  frustP(ma, PY0, 164.2, PY1, 188, false);
  for (let i = 0; i < 4; i++){ const F0 = edgeF(PY0, i), F1 = edgeF(PY1, i); for (const t of [0.3, 0.7]) for (const hy of [170, 178]){
    const f = (hy - 164.2)/(188 - 164.2), a0 = F0.at(F0.L*t, 0, 0), a1 = F1.at(F1.L*t, 0, 0), x = a0[0] + (a1[0] - a0[0])*f, z = a0[2] + (a1[2] - a0[2])*f;
    boxP(wi, 1.4, 2.2, 1.4, x, hy, z); } }
  // cupola: drum colonnade, gilded dome, lantern, finial
  prismP(ma, Rq(5.6, 4.6), 188, 189.2, false);
  cylP(ma2, cx, cz, 4.3, 4.3, 189.2, 190.2, 16, true);
  cylP(la, cx, cz, 3.2, 3.2, 190.2, 197.2, 12, false);
  for (let k = 0; k < 8; k++){ const a = k/8*TAU + PI/8; cylP(ma, cx + Math.cos(a)*3.9, cz + Math.sin(a)*3.9, 0.36, 0.33, 190.2, 197.2, 6, false); }
  cylP(ma, cx, cz, 4.5, 4.5, 197.2, 198.4, 16, true);
  const dome = []; for (let k = 0; k <= 8; k++){ const a = k/8*HP; dome.push([Math.cos(a)*4.2, 198.4 + Math.sin(a)*6.2]); }
  for (let k = 0; k < dome.length - 1; k++) cylP(go, cx, cz, dome[k][0], Math.max(0.6, dome[k + 1][0]), dome[k][1], dome[k + 1][1], 16, false);
  cylP(la, cx, cz, 0.85, 0.85, 204.5, 207.8, 8, true);
  cylP(go, cx, cz, 1.1, 0.25, 207.8, 210.5, 8, false);
  cylP(go, cx, cz, 0.18, 0.05, 210.5, 213.4, 6, false);
  // ---- One Madison Avenue (rest of the block): podium + KPF tower of stacked glass volumes
  const PODIUM = T([[-9.9, 64], [-10, 26.7], [15.7, 26.5], [15.6, 4.0], [119.1, 4.1], [119.1, 63.9]], OX, OZ);
  prismP(rg, T(R4(-10, 119.1, 4, 64), OX, OZ), -5, 0.3, false);
  curtainP(gl, fi, rg, PODIUM, 0.3, 40, 4.4, 3.0, {bh:0.5});
  bandP(fi, PODIUM, 0.3, 5.5, 0.15);
  const parts = [
    [[[15.9, 53.2], [15.6, 11.9], [86.6, 11.7], [86.7, 19.0], [36.2, 19.5], [36.3, 32.9], [27.5, 33.0], [27.5, 53.1]], 40, 48],
    [[[36.3, 32.9], [36.2, 19.5], [48.3, 19.4], [48.4, 33.0]], 40, 119],
    [[[86.7, 32.9], [86.7, 19.0], [108.9, 19.0], [109.2, 32.9]], 40, 119],
    [[[27.5, 53.1], [27.5, 33.0], [48.4, 33.0], [48.4, 34.8], [86.7, 34.4], [86.7, 32.9], [113.4, 32.8], [113.4, 53.0]], 40, 129],
    [[[82.4, 49.1], [82.4, 37.5], [108.6, 37.3], [108.6, 49.0]], 129, 134],
    [[[48.4, 34.8], [48.3, 19.4], [86.7, 19.0], [86.7, 34.4]], 40, 141.8]];
  for (const [P, y0, y1] of parts){ const Q = T(P, OX, OZ); curtainP(gl, fi, rg, Q, y0, y1, 4.1, 1.55, {mw:0.16, moff:0.25}); }
  // terrace planting on the setbacks
  const gr = B.p('#6f8a52');
  for (const [x0, x1, z0, z1, y] of [[16.5, 26.5, 34, 52.5, 40.4], [28, 47.5, 20, 32, 119.2], [87.5, 108, 20, 32, 119.2], [109, 112.8, 34, 52.5, 129.2]])
    abox(gr, x0 - OX, x1 - OX, y, y + 0.5, z0 - OZ, z1 - OZ);
  B.flush(g); return g; }};
place('ny1madison', 40.7414, -73.9873, 2.55, 15.3);
// ===================================================================================================================
// nynylife — New York Life Building (1928, Cass Gilbert, 187.5 m): full-block limestone base (Madison Ave - Park Ave S,
// E 26th - 27th St) with light courts, cross-shaped setback tower, 148 m tower top with corner pinnacles, the gilded
// octagonal pyramid roof and lantern. Frame = nynylife ref anchor (grid), origin = tower centre.
LANDMARKS.nynylife = {zh:'纽约人寿大厦', en:'New York Life Building', cat:'old', r:72, h:188,
  lt:{m:0, c:'#ffe9c8', k:0.8, e:0.5}, build(){
  const g = new THREE.Group(), B = mkB(), OX = 46, OZ = -6;
  const LIME = '#d9d1bf', LIME2 = '#c7bea9', WIN = {c:'#5c5f63', m:1, fh:3.9, cw:2.2}, ROOF = '#8f8c86';
  const GOLD = {c:'#d0a43e', glow:'#ffc94a', gk:0.75}, LANT = {c:'#fff0c0', glow:'#ffe7a0', gk:1.8};
  const li = B.p(LIME), l2 = B.p(LIME2), wi = B.p(WIN), rf = B.p(ROOF), go = B.p(GOLD), la = B.p(LANT);
  const BLK = T([[-16.6, 23.4], [-16.2, -36.0], [109.7, -36.0], [109.2, 23.4]], OX, OZ);
  prismP(l2, BLK, -5, 0.3, false);
  // base 0..22 on the whole block: ground arcade + piers
  masonP(wi, li, rf, BLK, 0.3, 22, 3.9, 3.0, 1.0, 0.25);
  bandP(li, BLK, 0.3, 4.6, 0.2);
  for (let i = 0; i < 4; i++){ const F = edgeF(BLK, i), n = Math.round(F.L/5.2);   // arcade arches at the ground floor
    for (let k = 0; k < n; k++){ const u = (k + 0.5)*F.L/n; faceShapeP(wi, F, archPts(u, 3.0, 4.2, 6), null, 0.24); } }
  bandP(l2, BLK, 21, 1.2, 0.5);
  // 22..60 with light courts on the long sides
  const P60 = T([[-11.8, 18.1], [-11.6, -28.7], [11.0, -28.7], [10.9, -22.8], [21.8, -22.8], [21.8, -28.9], [70.1, -28.8], [70.1, -22.9], [81.5, -22.9], [81.6, -28.7], [102.3, -28.7], [102.1, 18.1], [81.2, 18.1], [81.3, 12.4], [69.9, 12.4], [69.8, 18.1], [21.7, 18.1], [21.8, 12.3], [10.7, 12.3], [10.7, 18.2]], OX, OZ);
  masonP(wi, li, rf, P60, 22, 60, 3.9, 2.4, 0.75, 0.22);
  bandP(l2, P60, 58.8, 1.3, 0.45);
  // 60..115 cross-shaped tower
  const P115 = T([[10.7, 5.4], [10.8, -15.9], [29.4, -16.0], [29.5, -23.0], [62.4, -23.0], [62.3, -16.0], [81.4, -16.1], [81.3, 5.5], [62.2, 5.6], [62.2, 12.2], [29.4, 12.2], [29.4, 5.3]], OX, OZ);
  masonP(wi, li, rf, P115, 60, 115, 3.9, 2.4, 0.75, 0.22);
  bandP(l2, P115, 113.8, 1.3, 0.45);
  // 115..148 tower
  const P148 = T(R4(29.45, 62.3, -23.0, 12.2), OX, OZ);
  masonP(wi, li, rf, P148, 115, 146, 3.9, 2.4, 0.75, 0.22);
  stripsP(li, P148, 115, 146, 33/4, 1.4, 0.45, null, 3, true);               // strong buttress piers
  bandP(l2, P148, 142.5, 1.2, 0.5);
  prismP(li, offP(P148, -0.2), 146, 148.6, false);                            // parapet / balustrade zone
  bandP(l2, P148, 148.2, 0.6, 0.35);
  // the four corner pinnacles (to 152.5)
  for (const [x, z] of [[33.2, 8.0], [33.4, -18.9], [58.4, 7.9], [58.6, -18.9]]){ const X = x - OX, Z = z - OZ;
    cylP(li, X, Z, 1.55, 1.4, 148.6, 150.6, 8, true); cylP(go, X, Z, 1.1, 0.15, 150.6, 154.5, 8, false); }
  // octagonal gilded pyramid 148.6..181 on a short drum, lantern to 187.5
  const OCT = T([[33.9, -0.6], [33.8, -10.4], [40.9, -17.5], [51.1, -17.3], [57.7, -10.2], [57.4, -0.4], [50.8, 6.4], [41.0, 6.5]], OX, OZ);
  const [ocx, ocz] = cenP(OCT);
  prismP(l2, OCT, 148.6, 151.2, false);
  bandP(li, OCT, 150.6, 0.8, 0.3);
  const lev = [[1.0, 151.4], [0.82, 158], [0.62, 165], [0.42, 172], [0.2, 179], [0.13, 181]];
  for (let k = 0; k < lev.length - 1; k++) frustP(go, scaleP(OCT, lev[k][0], ocx, ocz), lev[k][1], scaleP(OCT, lev[k + 1][0], ocx, ocz), lev[k + 1][1], false);
  // tile ribs on the hips (darker)
  for (let i = 0; i < 8; i++){ const a = OCT[i]; segP(l2, [a[0], 151.4, a[1]], [ocx + (a[0] - ocx)*0.13, 181, ocz + (a[1] - ocz)*0.13], 0.18, 4); }
  cylP(la, ocx, ocz, 1.5, 1.5, 181, 184.5, 8, true);
  cylP(go, ocx, ocz, 1.7, 0.3, 184.5, 186.3, 8, false);
  cylP(go, ocx, ocz, 0.12, 0.05, 186.3, 187.5, 6, false);
  B.flush(g); return g; }};
place('nynylife', 40.7429, -73.9861, 46, -6);

// ===================================================================================================================
// nyappellate — Appellate Division Courthouse (1900, James Brown Lord): white marble Beaux-Arts palazzo, 3 storeys,
// the hexastyle Corinthian portico with pediment on E 25th St, the tetrastyle loggia on Madison Ave, balustrade with
// statues (abstract robed figures, no faces). Frame = nyappellate anchor (grid), origin = footprint centre.
LANDMARKS.nyappellate = {zh:'纽约州最高法院上诉庭', en:'Appellate Division Courthouse', cat:'old', r:30, h:24,
  lt:{m:0, c:'#fff2dc', k:0.9, e:0.75, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB(), OX = -2.0, OZ = -30.4;
  const MAR = '#efebe2', MAR2 = '#dcd6ca', WIN = {c:'#4f5359', m:1, fh:4.5, cw:2.4}, ROOF = '#8d8b88', STAT = '#e6e1d6';
  const ma = B.p(MAR), m2 = B.p(MAR2), wi = B.p(WIN), rf = B.p(ROOF), st = B.p(STAT);
  const X = x => x - OX, Z = z => z - OZ;
  const BODY = T([[-24.1, -16.0], [-24.1, -44.7], [-4.5, -44.8], [-4.5, -34.7], [5.5, -34.7], [5.5, -44.8], [20.4, -44.8], [20.5, -16.0]], OX, OZ);
  prismP(m2, BODY, -5, 0.3, false);
  // rusticated basement 0..4.6, main order 4.6..16.6, entablature 16.6..18.8, attic/balustrade 18.8..20.4
  wallsP(wi, BODY, 0.3, 18.8); flatP(rf, BODY, 18.8);
  for (let y = 0.9; y < 4.6; y += 0.75) bandP(ma, BODY, y - 0.35, 0.5, 0.12);
  bandP(ma, BODY, 0.3, 0.6, 0.18);
  bandP(m2, BODY, 4.3, 0.6, 0.35);
  stripsP(ma, BODY, 4.6, 16.6, 3.6, 0.95, 0.35, null, 3, true);               // pilasters
  for (let i = 0; i < BODY.length; i++){ const F = edgeF(BODY, i); if (F.L < 5) continue; const n = Math.round(F.L/3.6);   // window surrounds
    for (let k = 0; k < n; k++){ const u = (k + 0.5)*F.L/n; faceRect(m2, F, u - 1.0, u + 1.0, 9.6, 10.4, 0.18); faceRect(m2, F, u - 0.95, u + 0.95, 14.2, 14.7, 0.16);
      faceRect(ma, F, u - 0.7, u + 0.7, 1.4, 3.6, 0.13); } }
  bandP(ma, BODY, 16.6, 1.0, 0.4); bandP(m2, BODY, 17.6, 1.2, 0.75);         // entablature + cornice
  // balustrade
  const BAL = offP(BODY, -0.2);
  bandP(ma, BAL, 18.8, 0.35, 0.05); bandP(ma, BAL, 19.95, 0.3, 0.1);
  stripsP(m2, BAL, 19.15, 19.95, 0.45, 0.16, 0.0, null, 2, true);
  // E 25th St portico (south face z = -16): 6 columns on a podium, pediment, stair
  const pz = Z(-16.0) + 2.2, px0 = X(-9.5), px1 = X(5.5);
  abox(m2, px0 - 1.2, px1 + 1.2, 0.3, 4.6, Z(-16.0) - 0.2, pz + 1.3);
  for (let s = 0; s < 6; s++) abox(ma, px0 - 2.5 + s*0.15, px1 + 2.5 - s*0.15, 0, 0.3 + s*0.28, pz + 1.3 + (5 - s)*0.38, pz + 1.3 + (6 - s)*0.38);
  for (let k = 0; k < 6; k++) columnP(ma, px0 + (px1 - px0)*k/5, pz, 4.6, 12.0, 0.55, 10);
  abox(ma, px0 - 1.0, px1 + 1.0, 16.6, 18.8, Z(-16.0) - 0.5, pz + 1.0);
  { const A = [px0 - 1.2, 18.8, pz + 1.15], Bq = [px1 + 1.2, 18.8, pz + 1.15], C = [(px0 + px1)/2, 22.4, pz + 1.15];
    const A2 = [A[0], 18.8, Z(-16.0) - 0.3], B2 = [Bq[0], 18.8, Z(-16.0) - 0.3], C2 = [C[0], 22.4, Z(-16.0) - 0.3];
    triP(ma, A, Bq, C); quadP(m2, A, C, C2, A2); quadP(m2, C, Bq, B2, C2); }
  // pediment group (abstract) + roof-line statues
  statueP(st, (px0 + px1)/2, 22.3, pz + 0.4, 1.0);
  // Madison Ave loggia (west face x = -24.1): 4 columns
  const lx = X(-24.1) - 1.6;
  abox(m2, lx - 0.4, X(-24.1), 0.3, 4.6, Z(-28.2), Z(-16.6));
  for (let k = 0; k < 4; k++) columnP(ma, lx + 0.3, Z(-27.0) + (Z(-17.8) - Z(-27.0))*k/3, 4.6, 12.0, 0.5, 10);
  abox(ma, lx - 0.2, X(-24.1), 16.6, 18.8, Z(-28.2), Z(-16.6));
  for (let s = 0; s < 6; s++) abox(ma, lx - 0.4 - (6 - s)*0.36, lx - 0.4 - (5 - s)*0.36, 0, 0.3 + s*0.28, Z(-28.6), Z(-16.2));
  // statues on the balustrade: corners + over the loggia + along the street fronts
  const SP = [[-23.0, -17.0], [19.4, -17.0], [-23.0, -43.6], [19.4, -43.6], [-23.0, -20.0], [-23.0, -24.0], [-23.0, -36], [-14, -17.0], [-5.5, -17.0], [2.0, -17.0], [11, -17.0]];
  for (const [x, z] of SP) statueP(st, X(x), 20.25, Z(z), 1.0);
  // skylight / roof structures
  abox(m2, X(-12), X(2), 18.8, 20.6, Z(-34), Z(-24)); frustP(ma, T(R4(-11, 1, -33, -25), OX, OZ), 20.6, T(R4(-8, -2, -31, -27), OX, OZ), 22, true);
  B.flush(g); return g; }};
place('nyappellate', 40.74195, -73.9867, -2.0, -30.4);
// ===================================================================================================================
// nymoynihan — Moynihan Train Hall in the James A. Farley Building (1912 McKim, Mead & White + 1935 annex): the granite
// block 8th - 9th Ave, W 31st - 33rd St; the 8th Ave front with the monumental stair and the 85 m colonnade of 20
// Corinthian columns between the corner pavilions (stepped attic roofs at the four corners), pilastered side fronts, the
// 2021 Moynihan Train Hall skylight (four glazed vaults on the restored trusses) in the middle of the 1912 building, the
// new 31st / 33rd St entrance canopies. Frame = nymoynihan anchor (grid); origin = block centre.
LANDMARKS.nymoynihan = {zh:'莫伊尼汉列车大厅（法利大楼）', en:'Moynihan Train Hall (James A. Farley Building)', cat:'old', r:132, h:39,
  lt:{m:0, c:'#ffeccc', k:0.8, e:0.7, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB(), OX = -12.5, OZ = -112;
  const GRA = '#d9d1c1', GRA2 = '#c6bdab', WIN = {c:'#4d535a', m:1, fh:4.6, cw:2.6}, ROOF = '#8c8984', PH = '#a59d8f';
  const SKY = {c:'#a8c2cc', glow:'#ffe6bf', gk:0.6}, TRUSS = '#e8e8e4', CAN = {c:'#9fb4bf', glow:'#fff1d6', gk:0.5};
  const gr = B.p(GRA), g2 = B.p(GRA2), wi = B.p(WIN), rf = B.p(ROOF), ph = B.p(PH), sk = B.p(SKY), tr = B.p(TRUSS), ca = B.p(CAN);
  const X = x => x - OX, Z = z => z - OZ, Q = P => T(P, OX, OZ);
  const xW = -126.9, xE = 101.6, zN = -53.0, zS = -170.9;
  prismP(g2, Q(R4(xW, xE + 0.3, zS, zN)), -5, 0.3, false);
  // ---- 1935 annex (west half): 27 m ring, 31 m core, penthouses
  const ANX = Q(R4(xW, -10, zS + 0.4, zN - 0.4));
  wallsP(wi, ANX, 0.3, 27);
  for (let y = 0.9; y < 6.2; y += 0.9) bandP(gr, ANX, y - 0.45, 0.6, 0.1);
  stripsP(gr, ANX, 6.2, 24.5, 4.6, 1.5, 0.3, i => i !== 1, 3, true);
  bandP(g2, ANX, 6.0, 0.6, 0.3); bandP(gr, ANX, 24.5, 1.2, 0.35); bandP(g2, ANX, 25.7, 1.3, 0.7);
  flatP(rf, ANX, 27);
  prismP(ph, Q(R4(-115.6, -20.1, -156.6, -67.4)), 27, 31, false);
  for (const [x0, x1, z0, z1, y0, y1] of [[-105.7, -92.8, -146.5, -116.8, 31, 36.5], [-105.4, -97, -87.4, -70.5, 31, 36.5], [-54.8, -43.9, -81.8, -70.3, 31, 36.5],
    [-54.6, -43.7, -144.4, -133, 31, 36.5], [-93, -57.1, -130.4, -119.7, 31, 38.5], [-93.1, -57.2, -104.8, -94.2, 31, 38.5], [-54.9, -39.7, -130.1, -94.3, 31, 38.5], [-93.1, -57.2, -119.7, -104.8, 31, 34]])
    abox(ph, X(x0), X(x1), y0, y1, Z(z0), Z(z1));
  // ---- 1912 building (east half): outer ring 27 m round the frame (32 m) round the train hall
  const E0 = -10, hx0 = 25.0, hx1 = 72.6, hz0 = -146.6, hz1 = -77.2;
  const SIDE = [[E0, xE - 9.1, zS, zS + 15.5], [E0, xE - 9.1, zN - 15.5, zN], [E0, 6.2, zS + 15.5, zN - 15.5], [89.6, xE - 9.1, zS + 15.5, zN - 15.5]];
  for (const [x0, x1, z0, z1] of SIDE) prismP(rf, Q(R4(x0, x1, z0, z1)), 0.3, 27, false);
  for (const [x0, x1, z0, z1] of [[6.2, 89.6, -156.2, hz0], [6.2, 89.6, hz1, -67.4], [6.2, hx0, hz0, hz1], [hx1, 89.6, hz0, hz1]]) prismP(g2, Q(R4(x0, x1, z0, z1)), 0.3, 32, false);
  // facades of the 1912 block: 31st / 33rd St (south / north) and the corner pavilions
  const FR = Q(R4(E0, xE, zS, zN));
  for (const i of [0, 2]){ const F = edgeF(FR, i), n = Math.round(F.L/4.6);
    faceRect(wi, F, 0, F.L, 0.3, 27, 0.02);
    for (let k = 0; k <= n; k++){ const u = k*F.L/n; faceRect(gr, F, u - 0.8, u + 0.8, 6.2, 23.2, 0.35, 0.35); faceRect(g2, F, u - 1.05, u + 1.05, 22.6, 23.4, 0.5, 0.5); }
    for (let k = 0; k < n; k++){ const u = (k + 0.5)*F.L/n; faceRect(g2, F, u - 1.4, u + 1.4, 12.6, 13.4, 0.25); faceRect(g2, F, u - 1.3, u + 1.3, 18.2, 18.9, 0.22); }
    for (let y = 0.9; y < 6.2; y += 0.9) faceRect(gr, F, 0, F.L, y - 0.45, y + 0.15, 0.12);
    faceRect(g2, F, 0, F.L, 5.8, 6.4, 0.45); faceRect(gr, F, 0, F.L, 23.4, 25.6, 0.3); faceRect(g2, F, -0.6, F.L + 0.6, 25.6, 27, 0.75); }
  // ---- 8th Ave front: pavilions, loggia wall, 20 columns, entablature, attic, the stair
  const zc0 = zS + 15.5, zc1 = zN - 15.5;
  for (const [z0, z1] of [[zS, zc0], [zc1, zN]]){
    abox(wi, X(xE - 9.1), X(xE), 0.3, 27, Z(z0), Z(z1));
    const P = Q(R4(xE - 9.1, xE, z0, z1)), F = edgeF(P, 1);
    faceRect(gr, F, 0, F.L, 0.3, 6.2, 0.12); faceRect(gr, F, 0, 2.2, 6.2, 23.4, 0.3); faceRect(gr, F, F.L - 2.2, F.L, 6.2, 23.4, 0.3);
    faceShapeP(gr, F, [[2.2, 6.2], [F.L - 2.2, 6.2], [F.L - 2.2, 23.4], [2.2, 23.4]], [archPts(F.L/2, 6.6, 14.5, 8).map(p => [p[0], p[1] + 6.6])], 0.3);
    faceRect(gr, F, 0, F.L, 23.4, 25.6, 0.35); faceRect(g2, F, -0.6, F.L + 0.6, 25.6, 27, 0.8);
    // stepped attic
    const cx = (xE - 4.6), cz = (z0 + z1)/2; let s = 13;
    for (let k = 0; k < 6; k++){ abox(g2, X(cx) - s/2, X(cx) + s/2, 27 + k*0.7, 27.7 + k*0.7, Z(cz) - s/2, Z(cz) + s/2); s *= 0.8; }
  }
  const xw = xE - 9.1, xc = xE - 5.6;
  abox(wi, X(xw - 0.5), X(xw), 3.9, 22.4, Z(zc0), Z(zc1));
  for (let k = 0; k < 18; k++){ const z = zc0 + (zc1 - zc0)*(k + 0.5)/18; abox(gr, X(xw) - 0.3, X(xw) + 0.4, 3.9, 21.6, Z(z) - 0.75, Z(z) + 0.75); }   // pilasters behind
  for (let k = 0; k < 20; k++){ const z = zc0 + 1.4 + (zc1 - zc0 - 2.8)*k/19; columnP(gr, X(xc), Z(z), 3.9, 16.2, 0.8, 10); }
  abox(gr, X(xw), X(xc + 1.3), 20.1, 23.4, Z(zc0), Z(zc1));                      // entablature
  abox(g2, X(xw), X(xc + 1.9), 23.4, 24.2, Z(zc0) - 0.3, Z(zc1) + 0.3);
  abox(gr, X(xw), X(xc + 1.1), 24.2, 27, Z(zc0), Z(zc1));                        // attic (inscription band left blank)
  abox(g2, X(xw), X(xc + 1.5), 26.3, 27.2, Z(zc0), Z(zc1));
  flatP(rf, Q(R4(xw, xc + 1.5, zc0, zc1)), 27.25);
  abox(g2, X(xw), X(xc + 1.6), 0.3, 3.9, Z(zc0), Z(zc1));                        // podium
  for (let s = 0; s < 12; s++) abox(gr, X(xc + 1.6) + s*0.32, X(xc + 1.6) + (s + 1)*0.32, 0.3, 3.9 - s*0.3, Z(zc0) + 2, Z(zc1) - 2);
  for (const z of [zc0 + 1.2, zc1 - 1.2]) abox(gr, X(xc + 1.6), X(xE + 2.2), 0.3, 4.4, Z(z) - 1.2, Z(z) + 1.2);   // stair cheek blocks
  // ---- train hall: four glazed vaults (axis along x), five arched trusses, the diagrid
  const nV = 4, vw = (hz1 - hz0)/nV, ys = 27.4, yc = 34.2;
  for (let v = 0; v < nV; v++){ const za = hz0 + v*vw, n = 10;
    for (let i = 0; i < n; i++){ const t0 = i/n, t1 = (i + 1)/n, a0 = PI*t0, a1 = PI*t1;
      const z0 = za + vw*(1 - Math.cos(a0))/2, z1 = za + vw*(1 - Math.cos(a1))/2, y0 = ys + Math.sin(a0)*(yc - ys), y1 = ys + Math.sin(a1)*(yc - ys);
      quadP(sk, [X(hx0), y0, Z(z0)], [X(hx1), y0, Z(z0)], [X(hx1), y1, Z(z1)], [X(hx0), y1, Z(z1)]);
      for (let m = 0; m <= 12; m++){ const x = hx0 + (hx1 - hx0)*m/12; segP(tr, [X(x), y0 + 0.08, Z(z0)], [X(x), y1 + 0.08, Z(z1)], 0.09, 3); }
      segP(tr, [X(hx0), y0 + 0.08, Z(z0)], [X(hx1), y0 + 0.08, Z(z0)], 0.08, 3); }
    // gable ends
    const end = []; for (let i = 0; i <= n; i++){ const a = PI*i/n; end.push([za + vw*(1 - Math.cos(a))/2, ys + Math.sin(a)*(yc - ys)]); }
    for (const x of [hx0, hx1]) for (let i = 0; i < n; i++) triP(sk, [X(x), ys, Z(za + vw/2)], [X(x), end[i][1], Z(end[i][0])], [X(x), end[i + 1][1], Z(end[i + 1][0])]);
  }
  for (let v = 0; v <= nV; v++){ const z = hz0 + v*vw; abox(tr, X(hx0), X(hx1), ys - 1.2, ys + 0.9, Z(z) - 0.7, Z(z) + 0.7);
    for (let m = 0; m <= 6; m++){ const x = hx0 + (hx1 - hx0)*m/6; abox(tr, X(x) - 0.25, X(x) + 0.25, ys + 0.9, ys + 2.6, Z(z) - 0.35, Z(z) + 0.35); } }
  abox(rf, X(hx0) - 0.5, X(hx1) + 0.5, 24, ys - 1.2, Z(hz0) - 0.5, Z(hz1) + 0.5);
  // ---- Moynihan entrances on 31st / 33rd St: glass canopies over the doors (midblock of the 1912 building)
  for (const [z, s] of [[zS, 1], [zN, -1]]){ const z0 = Z(z) + s*0.4, z1 = Z(z) + s*4.6;
    abox(ca, X(28), X(70), 6.6, 7.2, Math.min(z0, z1), Math.max(z0, z1));
    for (const x of [30, 44, 56, 68]) abox(tr, X(x) - 0.2, X(x) + 0.2, 0.3, 6.6, Math.min(z0, z1) + (s > 0 ? 3.8 : 0), Math.min(z0, z1) + (s > 0 ? 4.2 : 0.4)); }
  B.flush(g); return g; }};
place('nymoynihan', 40.7506, -73.9964, -12.5, -112);
const NYK_PARTS = [[20.0,[[12.6,4.9],[12.7,-4.7],[29.9,-4.8],[29.9,4.8]]],[20.0,[[-29.8,17.5],[-29.6,-17.2],[-24.4,-17.4],[-24.4,-4.2],[-14.0,-4.2],[-14.1,4.5],[-24.5,4.4],[-24.6,17.5]]],[20.0,[[4.8,30.0],[4.8,17.3],[12.6,17.4],[12.7,30.1]]],[20.0,[[-14.0,-17.2],[-14.1,-29.9],[-6.2,-30.0],[-6.2,-17.2]]],[20.0,[[4.9,-17.1],[4.7,-30.0],[12.6,-30.0],[12.8,-17.2]]],[20.0,[[-14.3,30.1],[-14.2,17.3],[-6.4,17.4],[-6.5,30.0]]],[70.0,[[12.7,30.1],[12.7,27.9],[26.1,27.9],[26.2,4.9],[29.9,4.8],[29.8,30.0]]],[70.0,[[-29.8,30.0],[-29.8,26.1],[-26.0,26.2],[-26.0,27.2],[-14.2,27.2],[-14.3,30.1]]],[70.0,[[-29.6,-25.9],[-29.6,-30.0],[-14.1,-29.9],[-14.1,-27.0],[-25.8,-27.0],[-25.8,-25.9]]],[70.0,[[12.7,-27.8],[12.6,-30.0],[29.8,-30.1],[29.9,-4.8],[26.4,-4.8],[26.1,-28.0]]],[83.0,[[-17.5,27.1],[-17.5,24.8],[-14.3,24.8],[-14.2,27.2]]],[83.0,[[-6.5,30.0],[-6.4,24.6],[4.7,24.7],[4.8,30.0]]],[83.0,[[-17.3,-24.6],[-17.3,-27.0],[-14.1,-27.0],[-14.0,-24.6]]],[83.0,[[12.7,-25.8],[12.7,-27.8],[16.1,-27.8],[16.1,-25.9]]],[83.0,[[-6.2,-24.4],[-6.2,-30.0],[4.7,-30.0],[4.9,-24.3]]],[83.0,[[-24.6,14.1],[-24.5,4.4],[-23.5,4.4],[-23.6,14.0]]],[83.0,[[12.7,27.9],[12.7,26.0],[16.2,26.0],[16.1,28.0]]],[83.0,[[-24.4,-4.2],[-24.5,-13.8],[-23.5,-13.8],[-23.4,-4.2]]],[83.0,[[22.4,27.9],[22.7,4.9],[26.2,4.9],[26.1,27.9]]],[83.0,[[22.7,-4.8],[22.3,-27.9],[26.1,-28.0],[26.4,-4.8]]],[83.0,[[-29.8,26.1],[-29.7,24.2],[-26.5,24.3],[-26.6,25.1],[-23.3,25.1],[-23.3,27.2],[-26.0,27.2],[-26.0,26.2]]],[83.0,[[-29.6,-24.0],[-29.6,-25.9],[-25.8,-25.9],[-25.8,-27.0],[-23.1,-27.0],[-23.1,-24.9],[-26.4,-24.8],[-26.4,-24.0]]],[97.0,[[18.8,11.7],[18.8,4.9],[22.7,4.9],[22.5,12.9],[21.1,11.7]]],[97.0,[[18.9,-4.8],[18.9,-11.6],[21.3,-11.7],[22.6,-12.9],[22.7,-4.8]]],[97.0,[[-29.6,-17.2],[-29.6,-24.0],[-26.4,-24.0],[-26.4,-24.8],[-23.1,-24.9],[-23.1,-27.0],[-17.3,-27.0],[-17.3,-24.6],[-14.0,-24.6],[-14.1,-19.6],[-15.3,-20.6],[-22.4,-20.6],[-23.3,-19.6],[-23.5,-13.8],[-24.5,-13.8],[-24.4,-17.4]]],[97.0,[[-29.7,24.2],[-29.8,17.5],[-24.6,17.5],[-24.6,14.1],[-23.6,14.0],[-23.5,19.8],[-22.6,20.8],[-15.5,20.8],[-14.2,19.8],[-14.3,24.8],[-17.5,24.8],[-17.5,27.1],[-23.3,27.2],[-23.3,25.1],[-26.6,25.1],[-26.5,24.3]]],[97.0,[[-23.4,-4.2],[-23.5,-13.8],[-22.4,-12.9],[-22.4,-4.2]]],[97.0,[[-23.6,14.0],[-23.5,4.4],[-22.5,4.4],[-22.6,13.1]]],[97.0,[[12.7,26.0],[12.7,20.3],[13.8,21.7],[21.1,21.7],[22.5,20.5],[22.4,27.9],[16.1,28.0],[16.2,26.0]]],[97.0,[[12.7,-20.1],[12.7,-25.8],[16.1,-25.9],[16.1,-27.8],[22.3,-27.9],[22.5,-20.5],[21.2,-21.6],[13.9,-21.5]]],[108.0,[[16.2,-4.8],[16.2,-11.6],[18.9,-11.6],[18.9,-4.8]]],[108.0,[[16.2,11.7],[16.1,4.9],[18.8,4.9],[18.8,11.7]]],[108.0,[[-22.6,13.1],[-22.5,4.4],[-21.3,4.5],[-21.5,13.1]]],[108.0,[[-22.4,-4.2],[-22.4,-12.9],[-21.3,-12.9],[-21.3,-4.3]]],[110.0,[[12.8,-17.2],[12.7,-20.1],[13.9,-21.5],[21.2,-21.6],[22.5,-20.5],[22.6,-12.9],[21.3,-11.7],[16.2,-11.6],[16.2,-17.3]]],[110.0,[[12.7,20.3],[12.6,17.4],[16.1,17.4],[16.2,11.7],[21.1,11.7],[22.5,12.9],[22.5,20.5],[21.1,21.7],[13.8,21.7]]],[110.0,[[-6.2,-21.3],[-6.2,-24.4],[4.9,-24.3],[4.9,-21.2]]],[110.0,[[-6.4,24.6],[-6.4,21.5],[4.7,21.6],[4.7,24.7]]],[110.0,[[-23.5,19.8],[-23.6,14.0],[-22.6,13.1],[-21.5,13.1],[-21.5,16.4],[-17.4,16.5],[-17.4,17.3],[-14.2,17.3],[-14.2,19.8],[-15.5,20.8],[-22.6,20.8]]],[110.0,[[-23.5,-13.8],[-23.3,-19.6],[-22.4,-20.6],[-15.3,-20.6],[-14.1,-19.6],[-14.0,-17.2],[-17.2,-17.1],[-17.2,-16.3],[-21.3,-16.2],[-21.3,-12.9],[-22.4,-12.9]]],[121.0,[[-6.4,21.5],[-6.4,17.4],[4.8,17.3],[4.7,21.6]]],[121.0,[[-6.2,-17.2],[-6.2,-21.3],[4.9,-21.2],[4.9,-17.1]]],[121.0,[[12.6,17.4],[12.6,4.9],[16.1,4.9],[16.1,17.4]]],[121.0,[[12.7,-4.7],[12.8,-17.2],[16.2,-17.3],[16.2,-4.8]]],[121.0,[[-21.5,16.4],[-21.3,4.5],[-14.1,4.5],[-14.2,17.3],[-17.4,17.3],[-17.4,16.5]]],[121.0,[[-21.3,-4.3],[-21.3,-16.2],[-17.2,-16.3],[-17.2,-17.1],[-14.0,-17.2],[-14.0,-4.2]]],[135.0,[[-14.2,17.3],[-14.0,-17.2],[12.8,-17.2],[12.6,17.4]]],[143.0,[[-10.1,10.7],[-10.0,-11.0],[6.5,-11.2],[6.5,10.6]]]];
// ===================================================================================================================
// nynewyorker — The New Yorker Hotel (1930, Sugarman & Berger, 43 storeys): buff-brick Art Deco tower on the SW corner of
// 8th Ave / W 34th St, built from the 48 OSM building parts (setbacks at 20, 70, 83, 97, 108, 110, 121, 135, 143 m),
// continuous brick piers with recessed window strips, parapet bands on every setback, and the big sign on the west side
// above the 121 m terraces: steel frame and its red outline glow only (no letters). Frame = nynewyorker anchor (grid), origin = footprint centre (10.6, 13.7).
LANDMARKS.nynewyorker = {zh:'纽约客酒店', en:'The New Yorker Hotel', cat:'old', r:44, h:146,
  lt:{m:1, c:'#ffe2b0', k:0.7, e:0.4}, build(){
  const g = new THREE.Group(), B = mkB();
  const BRK = '#bba27f', BRK2 = '#a88f6c', WIN = {c:'#4f5257', m:1, fh:3.1, cw:2.3}, ROOF = '#8a857d', BASE = '#9c8a70';
  const CROWN = {c:'#d8c6a2', m:0, lc:'#ffe2b0', lk:1.1}, STEEL = '#3d3b3a', NEON = {c:'#8a2018', glow:'#ff2c1c', gk:1.8};
  const br = B.p(BRK), b2 = B.p(BRK2), wi = B.p(WIN), rf = B.p(ROOF), bs = B.p(BASE), cr = B.p(CROWN), stl = B.p(STEEL), ne = B.p(NEON);
  const RING = T([[-19.2, 43.7], [-19.0, -16.3], [40.4, -16.4], [40.4, 43.7]], 10.6, 13.7);
  prismP(bs, RING, -5, 0.3, false);
  for (const [top, P] of NYK_PARTS){
    const y1 = top, area = Math.abs(area2(P));
    if (top <= 20){ wallsP(wi, P, 0.3, y1); flatP(rf, P, y1); bandP(bs, P, 0.3, 5.2, 0.12); stripsP(br, P, 5.2, y1, 2.4, 0.8, 0.18, null, 2, true);
      for (let y = 8.3; y < y1 - 0.5; y += 3.1) bandP(b2, P, y - 0.9, 0.9, 0.08); bandP(b2, P, y1 - 1.0, 1.0, 0.25); continue; }
    wallsP(wi, P, 0.3, y1); flatP(rf, P, y1);
    if (area < 12) continue;
    stripsP(br, P, 5.2, y1 - 1.5, 2.35, 0.85, 0.18, null, 1.6, true);
    for (let y = 8.3; y < y1 - 2; y += 3.1) bandP(b2, P, y - 0.95, 0.95, 0.07);
    bandP(top >= 121 ? cr : br, P, y1 - 2.4, 2.4, 0.22);                        // parapet band on each setback
    bandP(b2, P, y1 - 0.35, 0.5, 0.3);
    bandP(bs, P, 0.3, 5.2, 0.12);
  }
  // crown: the 143 m top floodlit with its tank housing; the big sign on the WEST side above the 121 m terraces (it faces
  // New Jersey): steel lattice frame + red outline glow only, no letters
  const CT = T([[0.5, 24.4], [0.6, 2.7], [17.1, 2.5], [17.1, 24.3]], 10.6, 13.7);
  prismP(cr, offP(CT, -3.0), 143, 145.2, false);
  const sx = -14.2 + 1.2, z0 = -15.8, z1 = 15.8, sy0 = 135.3, sy1 = 142.6;
  for (let z = z0; z <= z1 + 0.01; z += (z1 - z0)/16){ segP(stl, [sx, sy0, z], [sx, sy1, z], 0.13, 4); segP(stl, [sx + 1.4, sy0, z], [sx + 0.2, sy1, z], 0.1, 4); }
  for (const y of [sy0 + 0.3, (sy0 + sy1)/2, sy1 - 0.2]) segP(stl, [sx, y, z0], [sx, y, z1], 0.14, 4);
  for (const y of [sy0 + 0.6, sy1 - 0.5]) segP(ne, [sx - 0.3, y, z0 + 0.3], [sx - 0.3, y, z1 - 0.3], 0.11, 4);
  for (const z of [z0 + 0.3, z1 - 0.3]) segP(ne, [sx - 0.3, sy0 + 0.6, z], [sx - 0.3, sy1 - 0.5, z], 0.11, 4);
  aviP(B.p(RED), [[sx, z0], [sx, z1]], sy1);
  { const [ccx, ccz] = cenP(CT); aviP(B.p(RED), [[ccx, ccz]], 145.2); }
  B.flush(g); return g; }};
place('nynewyorker', 40.7529, -73.9937, 10.6, 13.7);

// ===================================================================================================================
// ny1pennplaza — One Penn Plaza (1972, Kahn & Jacobs, 57 storeys, 229 m): the long dark slab on W 34th St with the
// dark-bronze aluminium piers, the shallow south bay (to 219 m), the 50 m base and the 30 m east wing toward 7th Ave.
// Frame = ny1pennplaza anchor (grid), origin = slab centre (78.3, 4.4).
LANDMARKS.ny1pennplaza = {zh:'宾州广场一号', en:'One Penn Plaza', cat:'new', r:98, h:233,
  lt:{m:1, c:'#ffe6c0', k:0.6, e:0.4}, build(){
  const g = new THREE.Group(), B = mkB(), OX = 78.3, OZ = 4.4;
  const GLS = {c:'#3a4148', m:1, fh:3.75, cw:1.6}, PIER = '#6b5b4b', PIER2 = '#4a4038', ROOF = '#77736e', BASEG = {c:'#3c4247', m:1, fh:4.2, cw:3.0};
  const gl = B.p(GLS), pi = B.p(PIER), p2 = B.p(PIER2), rf = B.p(ROOF), bg = B.p(BASEG);
  const Q = P => T(P, OX, OZ);
  const SLAB = Q(R4(31.3, 125.3, -8.1, 16.8)), BAY = Q(R4(39.8, 116.9, 16.6, 20.8));
  prismP(p2, Q([[31.3, 16.8], [31.3, -7.9], [39.9, -8.0], [40.0, -11.9], [77.3, -12.0], [77.3, -17.5], [114.0, -17.5], [114.1, -26.1], [170.5, -26.0], [170.4, 34.3], [114.0, 34.6], [114.0, 26.1], [77.3, 26.2], [77.3, 20.7], [39.9, 20.8], [39.8, 16.8]]), -5, 0.3, false);
  for (const [P, y1] of [[SLAB, 229], [BAY, 219]]){
    wallsP(gl, P, 0.3, y1); flatP(rf, P, y1);
    stripsP(pi, P, 8, y1 - 9, 1.55, 0.42, 0.3, null, 2, true);
    bandP(p2, P, 0.3, 8, 0.1); bandP(pi, P, y1 - 9, 9, 0.32);                    // lobby band, mechanical crown
    stripsP(p2, P, y1 - 9, y1, 0.9, 0.25, 0.42, null, 2, true);
  }
  const BASE50 = Q([[77.3, 26.2], [77.3, 20.7], [116.9, 20.6], [116.9, 16.6], [125.2, 16.6], [125.3, -8.1], [117.0, -8.1], [117.0, -12.0], [77.3, -12.0], [77.3, -17.5], [152.3, -17.6], [152.2, 26.0]]);
  const WING = Q([[114.0, 34.6], [114.0, 26.1], [152.2, 26.0], [152.3, -17.6], [114.0, -17.5], [114.1, -26.1], [170.5, -26.0], [170.4, 34.3]]);
  for (const [P, y1] of [[BASE50, 50], [WING, 30]]){ wallsP(bg, P, 0.3, y1); flatP(rf, P, y1);
    stripsP(pi, P, 6, y1, 3.1, 0.5, 0.25, null, 2, true); for (let y = 10.2; y < y1; y += 4.2) bandP(p2, P, y - 1.1, 1.1, 0.12); bandP(p2, P, 0.3, 6, 0.08); bandP(pi, P, y1 - 1.5, 1.5, 0.3); }
  abox(bg, 40 - OX, 77.3 - OX, 0.3, 7, -12 - OZ, -8 - OZ);                        // 34th St lobby
  abox(p2, 40 - OX, 77.3 - OX, 7, 7.6, -12.6 - OZ, -8 - OZ);
  // rooftop: mechanical bulkhead, antenna masts, aviation lights
  abox(p2, 60 - OX, 100 - OX, 229, 233, -3 - OZ, 12 - OZ);
  const rd = B.p(RED); aviP(rd, [[33 - OX, -6 - OZ], [123.5 - OX, -6 - OZ], [33 - OX, 15 - OZ], [123.5 - OX, 15 - OZ]], 229);
  B.flush(g); return g; }};
place('ny1pennplaza', 40.7517, -73.9933, 78.3, 4.4);
// ===================================================================================================================
// Manhattan West (Brookfield, SOM): nymanwest = One Manhattan West (2019, 303 m, 67 storeys: rectangular floor plates
// with rounded corners, the east face bowing out and sloping back over the lower 20 floors toward Penn Station, silver
// glass with fine mullions, lit crown) and nymanwest_b = Two Manhattan West (2023, 285 m, 58 storeys: rounded, gently
// tapering, the tall column-free lobby between mega-columns). Frame = nymanwest anchor (grid).
{
const loftTower = (G, M, secs, fh, sp, w) => { for (let k = 0; k < secs.length - 1; k++){ const a = secs[k], b = secs[k + 1];
  shardP(G, M, a.P, a.y, b.P.map(p => [p[0], b.y, p[1]]), fh, sp, w, 0.3); } };
LANDMARKS.nymanwest = {zh:'曼哈顿西区', en:'Manhattan West', cat:'new', r:40, h:305,
  lt:{m:1, c:'#e8f0ff', k:0.7, e:0.4}, build(){
  const g = new THREE.Group(), B = mkB(), OX = 101.5, OZ = 41.3;
  const GL = {c:'#6f8798', m:1, fh:4.1, cw:1.5}, MUL = '#c3ccd2', ROOF = '#7a7c80', CRN = {c:'#dfe8f0', glow:'#eef4ff', gk:0.9};
  const gl = B.p(GL), mu = B.p(MUL), rf = B.p(ROOF), cr = B.p(CRN);
  // plan at height y: west face x = 71.8, north 18.8, south 63.8, east 119.3 + skirt (bows out below ~85 m)
  const sec = y => { const f = y < 86 ? Math.pow(1 - y/86, 1.5) : 0, P = [], r = 3.2;
    for (const p of rrect(71.8, 119.3, 18.8, 63.8, r, 3)){ let [x, z] = p; if (x > 100){ const t = Math.min(1, (x - 100)/19.3), bow = 1 - Math.pow((z - 41.3)/22.5, 2);
        x += t*f*(10.6 + 2.8*Math.max(0, bow)); } P.push([x - OX, z - OZ]); }
    return P; };
  // densify the east side so the bow reads: insert points along the east edge
  const secD = y => { const P = sec(y), out = []; for (let i = 0; i < P.length; i++){ out.push(P[i]); const a = P[i], b = P[(i + 1) % P.length];
      if (a[0] > 15 && b[0] > 15 && Math.abs(b[1] - a[1]) > 20) for (let k = 1; k < 8; k++){ const t = k/8, z = a[1] + (b[1] - a[1])*t, zz = z + OZ, bow = 1 - Math.pow((zz - 41.3)/22.5, 2), f = y < 86 ? Math.pow(1 - y/86, 1.5) : 0;
        out.push([119.3 - OX + f*(10.6 + 2.8*bow), z]); } }
    return out; };
  const ys = [0.3, 14, 28, 42, 56, 70, 86, 296]; const secs = ys.map(y => ({y, P:secD(y)}));
  loftTower(gl, mu, secs, 4.1, 3.0, 0.2);
  const top = secD(296);
  shardP(cr, null, top, 296, top.map(p => [p[0], 303, p[1]]));
  const inner = offP(top, -1.2); prismP(rf, inner, 296, 302.2, false); flatP(rf, top, 296.05);
  stripsP(mu, top, 296, 303, 1.6, 0.25, 0.1, null, 1, true);
  prismP(rf, sec(0.3), -5, 0.3, false);
  // lobby: mullionless glass with fins (structural glass fins)
  bandP(mu, secD(0.3), 13.5, 0.5, 0.15);
  aviP(B.p(RED), [[-25, -18], [13, -18], [-25, 18], [13, 18]], 303);
  B.flush(g); return g; }};
place('nymanwest', 40.7535, -73.9985, 101.5, 41.3);

LANDMARKS.nymanwest_b = {zh:'曼哈顿西区二号楼', en:'Two Manhattan West', cat:'new', r:42, h:287, label:false,
  lt:{m:1, c:'#e8f0ff', k:0.7, e:0.4}, build(){
  const g = new THREE.Group(), B = mkB(), OX = 108.7, OZ = 124.5;
  const GL = {c:'#7c92a1', m:1, fh:4.1, cw:1.5}, MUL = '#ccd3d8', ROOF = '#7a7c80', COL = '#6c6e70', LOB = {c:'#a69a86', glow:'#ffe0b0', gk:0.45};
  const gl = B.p(GL), mu = B.p(MUL), rf = B.p(ROOF), co = B.p(COL), lo = B.p(LOB);
  // rounded plan with slightly bowed sides; shrinks and rounds more toward the top
  const sec = (y) => { const t = y/285, ix = 1.0 + 3.2*t*t, iz = 0.9 + 2.6*t*t, r = 7 + 7*t, x0 = 77.8 + ix, x1 = 139.6 - ix, z0 = 101.6 + iz, z1 = 147.5 - iz;
    return rrect(x0, x1, z0, z1, r, 4).map(([x, z]) => [x - OX, z - OZ]); };
  const ys = [22, 60, 110, 160, 210, 250, 279]; const secs = ys.map(y => ({y, P:sec(y)}));
  loftTower(gl, mu, secs, 4.1, 3.0, 0.2);
  const top = sec(279), CR2 = B.p({c:'#dfe8f0', glow:'#eef4ff', gk:0.7}); shardP(CR2, null, top, 279, top.map(p => [p[0], 285, p[1]])); prismP(rf, offP(top, -1.5), 279, 284.3, false); flatP(rf, top, 279.05);
  bandP(mu, top, 284.2, 0.8, 0.1);
  // lobby 0..22: glass set back, mega-columns at the perimeter, the soffit
  const L0 = sec(22), LIN = offP(L0, -2.2);
  prismP(rf, sec(0.3), -5, 0.3, false);
  wallsP(lo, LIN, 0.3, 22); stripsP(mu, LIN, 0.3, 22, 3.0, 0.12, 0.05, null, 2, true);
  flatP(mu, L0, 21.95);
  for (let i = 0; i < L0.length; i += 4){ const p = L0[i], q = offP(L0, -0.9)[i]; abox(co, q[0] - 1.1, q[0] + 1.1, 0.3, 22, q[1] - 1.1, q[1] + 1.1); }
  aviP(B.p(RED), [[-22, -14], [22, -14], [-22, 14], [22, 14]], 285);
  B.flush(g); return g; }};
place('nymanwest_b', 40.7535, -73.9985, 108.7, 124.5);
}
// ===================================================================================================================
// nyspiral — The Spiral (2022, BIG, 66 Hudson Blvd, 314 m, 66 storeys): full-block podium (W 34th - 35th St, Hudson Blvd
// East - 10th Ave), then the tower built floor by floor: the planted terrace ribbon climbs round the four faces (one face
// per four floors, the setback sweeping diagonally along the face), so the tower steps in continuously; precast terrace
// edges, planters and trees on every new terrace. Frame = nyspiral anchor, grid turned 0.8 deg to fit the block (rot -0.52).
LANDMARKS.nyspiral = {zh:'螺旋大厦', en:'The Spiral', cat:'new', r:60, h:321,
  lt:{m:1, c:'#e9f1ff', k:0.65, e:0.4}, build(){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
  const GL = {c:'#7f95a5', m:1, fh:4.62, cw:1.5}, GL2 = {c:'#90a7b4', m:1, fh:4.62, cw:1.5}, PRE = '#d9d5cc', MUL = '#bfc6cb';
  const GRN = '#6d8c4f', SHR = '#4f6e3a', ROOF = '#868682', LOB = {c:'#a6a196', glow:'#ffe2b6', gk:0.45};
  const gl = B.p(GL), g2 = B.p(GL2), pr = B.p(PRE), mu = B.p(MUL), gn = B.p(GRN), sh = B.p(SHR), rf = B.p(ROOF), lo = B.p(LOB);
  const E0 = 51.6, W0 = 51.6, N0 = 28.6, S0 = 28.6;                       // block half-extents round the origin
  prismP(rf, R4(-W0, E0, -N0, S0), -5, 0.3, false);
  // podium: 9 m lobby + 5 floors
  const POD = R4(-W0 + 0.3, E0 - 0.3, -N0 + 0.3, S0 - 0.3);
  wallsP(lo, offP(POD, -1.0), 0.3, 9.2); flatP(pr, POD, 9.2); bandP(pr, POD, 8.6, 0.8, 0.1);
  stripsP(mu, offP(POD, -1.0), 0.3, 9.2, 3.0, 0.14, 0.05, null, 2, true);
  for (let y = 9.2; y < 32; y += 4.6){ wallsP(gl, POD, y, y + 4.6); bandP(pr, POD, y + 4.0, 0.6, 0.12); stripsP(mu, POD, y, y + 4.0, 3.0, 0.18, 0.08, null, 2, false); }
  flatP(gn, POD, 32.0);
  // tower: faces S (+z, x increasing), E (+x, z decreasing), N (-z, x decreasing), W (-x, z increasing)
  const STEP = [1.9, 6.3, 1.9, 6.3], ST0 = [3.5, 7.0, 3.5, 7.0];          // S, E, N, W step depths; the first setback off the podium
  const NF = 61, FH = 4.62, Y0 = 32;
  const box = (o, x0, x1, z0, z1, y0, y1) => { if (x1 - x0 < 0.2 || z1 - z0 < 0.2) return; abox(o, x0, x1, y0, y1, z0, z1); };
  for (let k = 0; k < NF; k++){
    const y0 = Y0 + k*FH, y1 = y0 + FH, q = Math.floor(k/4), s = (k % 4)/4, f = q % 4;
    const c = [0, 1, 2, 3].map(ff => q > ff ? Math.floor((q - 1 - ff)/4) + 1 : 0);   // completed steps per face (quarters before q)
    const off = c.map((n, ff) => ST0[ff] + n*STEP[ff]);
    let xs0 = -W0 + off[3], xs1 = E0 - off[1], zs0 = -N0 + off[2], zs1 = S0 - off[0];   // outer rect of this floor
    // inner rect: the active face stepped by its depth
    let xi0 = xs0, xi1 = xs1, zi0 = zs0, zi1 = zs1;
    if (f === 0) zi1 -= STEP[0]; else if (f === 1) xi1 -= STEP[1]; else if (f === 2) zi0 += STEP[2]; else xi0 += STEP[3];
    const top = k === NF - 1;
    const IN = R4(xi0, xi1, zi0, zi1);
    wallsP(k % 2 ? gl : g2, IN, y0, y1); flatP(top ? rf : pr, IN, y1 - 0.02);
    bandP(pr, IN, y1 - 0.6, 0.6, 0.12);
    stripsP(mu, IN, y0, y1 - 0.6, 3.0, 0.18, 0.08, null, 2, false);
    // the not-yet-stepped strip of the active face (fraction 1 - s at the far end); its roof is the new terrace next floor
    let S = null;
    if (f === 0){ const L = xs1 - xs0; S = [xs0 + s*L, xs1, zi1, zs1]; }
    else if (f === 1){ const L = zs1 - zs0; S = [xi1, xs1, zs0, zs1 - s*L]; }
    else if (f === 2){ const L = xs1 - xs0; S = [xs0, xs1 - s*L, zs0, zi0]; }
    else { const L = zs1 - zs0; S = [xs0, xi0, zs0 + s*L, zs1]; }
    const SP = R4(S[0], S[1], S[2], S[3]);
    if (S[1] - S[0] > 0.3 && S[3] - S[2] > 0.3){ wallsP(gl, SP, y0, y1); flatP(gn, SP, y1 + 0.05); bandP(pr, SP, y1 - 0.6, 0.85, 0.12); stripsP(mu, SP, y0, y1 - 0.6, 3.0, 0.18, 0.08, null, 1.2, false); }
    // planting on the band uncovered at this floor's top (one quarter of the face), trees + shrubs, glass guard
    const nxt = (k % 4) === 3;   // after the last quarter the whole remaining strip becomes terrace
    let T0 = null;
    if (k < NF - 1){
      const s2 = nxt ? 1 : s + 0.25;
      if (f === 0){ const L = xs1 - xs0; T0 = [xs0 + s*L, xs0 + s2*L, zi1, zs1]; }
      else if (f === 1){ const L = zs1 - zs0; T0 = [xi1, xs1, zs1 - s2*L, zs1 - s*L]; }
      else if (f === 2){ const L = xs1 - xs0; T0 = [xs1 - s2*L, xs1 - s*L, zs0, zi0]; }
      else { const L = zs1 - zs0; T0 = [xs0, xi0, zs0 + s*L, zs0 + s2*L]; }
      const along = (f === 0 || f === 2), L2 = along ? T0[1] - T0[0] : T0[3] - T0[2], n = Math.max(1, Math.round(L2/6));
      for (let m = 0; m < n; m++){ const t = (m + 0.3 + rng()*0.4)/n;
        const x = along ? T0[0] + (T0[1] - T0[0])*t : (T0[0] + T0[1])/2 + (f === 1 ? 0.6 : -0.6)*(T0[1] - T0[0])/4;
        const z = along ? (T0[2] + T0[3])/2 + (f === 0 ? 0.25 : -0.25)*(T0[3] - T0[2]) : T0[2] + (T0[3] - T0[2])*t;
        if (rng() < 0.55){ cylP(sh, x, z, 0.12, 0.12, y1, y1 + 1.6, 4, false); cylP(gn, x, z, 1.3, 0.2, y1 + 1.4, y1 + 3.6, 6, true); }
        else box(sh, x - 1.2, x + 1.2, z - 0.5, z + 0.5, y1, y1 + 0.9); }
    }
  }
  // rooftop: mechanical screen + crown terrace
  const yT = Y0 + NF*FH;
  const qT = Math.floor((NF - 1)/4), cT = [0, 1, 2, 3].map(ff => qT > ff ? Math.floor((qT - 1 - ff)/4) + 1 : 0);
  const oT = cT.map((n, ff) => ST0[ff] + n*STEP[ff]);
  const RT = R4(-W0 + oT[3] + 6, E0 - oT[1] - 6, -N0 + oT[2] + 5, S0 - oT[0] - 5);
  prismP(mu, RT, yT, yT + 5.5, false); stripsP(rf, RT, yT, yT + 5.5, 1.2, 0.3, 0.05, null, 1, true);
  aviP(B.p(RED), [[RT[0][0], RT[0][1]], [RT[2][0], RT[2][1]]], yT + 5.5);
  B.flush(g); return g; }};
{ const p = LL(40.7556, -73.9995, 12.75, 37.35); SG_PLACES.push({type:'nyspiral', lat:p.lat, lon:p.lon, rot:-0.52}); }
// ===================================================================================================================
// Jacob K. Javits Convention Center (1986, I. M. Pei & Partners / James Ingo Freed; 2013 re-glazing and green roof; 2021
// north expansion). Split into three compact keys so the hulls stay tight: nyjavits = the original Pei building
// (34th - 38th St: stepped glass-and-space-frame volumes, the Crystal Palace on 11th Ave, sedum green roofs, the
// 12th Ave lower level with truck docks), nyjavits_b = the 2021 expansion (38th - 40th St: glass halls, rooftop
// pavilion, rooftop farm and terrace), nyjavits_c = the link between them and the 11th Ave wing. Frame = nyjavits
// anchor (grid); every key uses the same builder with its own origin.
{
const JGL = {c:'#62798a', glow:'#fff0d2', gk:0.32}, JGL2 = {c:'#7891a2', glow:'#fff0d2', gk:0.32}, JFR = '#cdd2d5', JRF = '#7d8a5c', JRF2 = '#6f7d51';
const JCON = '#a29d94', JDOCK = '#3f4246', JPV = {c:'#9fb6c2', glow:'#fff2d8', gk:0.55}, JFARM = '#5f7d3c', JSOIL = '#7a6650';
// a space-frame glass volume: glass walls, 3.05 m square grid of frame members on every face, frame band + green roof
function jVol(B, P, y0, y1, gl, roof){
  const g = B.p(gl), f = B.p(JFR), r = B.p(roof || JRF);
  wallsP(g, P, y0, y1); flatP(r, P, y1);
  stripsP(f, P, y0, y1, 3.05, 0.22, 0.1, null, 1.2, true);
  for (let y = y0 + 3.05; y < y1 - 0.4; y += 3.05) bandP(f, P, y - 0.11, 0.22, 0.1);
  bandP(f, P, y1 - 0.9, 1.0, 0.18);
}
function jPlinth(B, P, yb){ const c = B.p(JCON), d = B.p(JDOCK); prismP(c, P, yb, 0.3, false); bandP(c, P, -0.3, 0.6, 0.15);
  for (let i = 0; i < P.length; i++){ const F = edgeF(P, i); if (F.L < 12) continue; const n = Math.floor(F.L/9);
    for (let k = 0; k < n; k++){ const u = (k + 0.5)*F.L/n; faceRect(d, F, u - 2.2, u + 2.2, yb + 0.6, Math.min(-1.5, yb + 5.2), 0.05); } } }
const jS = 1.3;   // OSM part heights scaled to the real section (halls 15.5 / 23.5 / 32.5 m, Crystal Palace to 46 m)
LANDMARKS.nyjavits = {zh:'贾维茨会展中心', en:'Jacob K. Javits Convention Center', cat:'new', r:188, h:47,
  lt:{m:0, c:'#eef4ff', k:0.5, e:0.8}, build(){
  const g = new THREE.Group(), B = mkB(), OX = -12, OZ = 22, Q = P => T(P, OX, OZ);
  const BASE = Q([[-122.4, 160.8], [-122.1, -116.0], [73.7, -116.0], [73.6, 19.9], [97.9, 19.8], [101.2, 22.7], [101.2, 103.5], [98.4, 106.0], [74.0, 106.0], [74.0, 131.6], [73.1, 160.7]]);
  jPlinth(B, Q(R4(-135.5, 73.8, -116, 160.8)), -10);
  jPlinth(B, Q(R4(73.8, 101.2, 19.9, 106)), -10);
  jVol(B, BASE, 0.3, 12*jS, JGL);
  // 12th Ave side: the low dock strip
  const DK = Q(R4(-135.5, -122.4, -115.7, 160.8)); prismP(B.p(JCON), DK, 0.3, 7, false); flatP(B.p(JRF2), DK, 7.02);
  { const F = edgeF(DK, 3), d = B.p(JDOCK), n = Math.floor(F.L/8); for (let k = 0; k < n; k++){ const u = (k + 0.5)*F.L/n; faceRect(d, F, u - 2.4, u + 2.4, 0.3, 5.2, 0.05); } }
  const P18 = Q([[-122.4, 104.7], [-122.2, 21.2], [-91.2, 21.3], [-91.8, 49.4], [15.5, 49.5], [15.3, 21.0], [42.9, 21.3], [42.9, -6.4], [73.7, -6.3], [73.6, 19.9], [97.9, 19.8], [101.2, 22.7], [101.2, 103.5], [98.4, 106.0], [74.0, 106.0], [74.0, 131.6], [43.0, 131.6], [42.8, 105.8], [16.1, 105.8], [15.8, 78.8], [-92.2, 77.9], [-92.5, 105.2]]);
  jVol(B, P18, 12*jS, 18*jS, JGL, '#c3c5bf');
  jVol(B, Q([[15.8, 78.8], [15.5, 49.5], [42.9, 50.0], [42.9, 21.3], [73.6, 19.9], [71.8, 49.6], [101.2, 49.6], [101.2, 79.6], [71.8, 79.4], [74.0, 106.0], [42.8, 105.8], [42.9, 79.2]]), 18*jS, 25*jS, JGL2, JGL2);
  jVol(B, Q(R4(-122.3, -91.8, 49.4, 77.9)), 18*jS, 25*jS, JGL2);
  // Crystal Palace: stepped glass cubes to 46 m
  jVol(B, Q(R4(42.9, 71.8, 49.6, 79.4)), 25*jS, 33*jS, JGL2, JGL2);
  jVol(B, Q(R4(47.4, 67.3, 54.1, 74.9)), 33*jS, 38, JGL2, JGL2);
  jVol(B, Q(R4(51.9, 62.8, 58.6, 70.4)), 38, 46, JGL2, JGL2);
  // the 11th Ave entrance canopy of the Crystal Palace
  abox(B.p(JFR), 101.2 - OX, 104.6 - OX, 5.8, 6.6, 52 - OZ, 77 - OZ);
  // sedum roof texture: darker patches on the big flat roofs
  const r2 = B.p(JRF2), rng = LMCTX.rng;
  for (let k = 0; k < 40; k++){ const x = -110 + rng()*170, z = -100 + rng()*250; if (x > 10 && x < 75 && z > 15 && z < 110) continue;
    if ((z > 15 && z < 110 && x < 45) || (x > 40 && z > -10)) continue; const y = 12*jS; abox(r2, x - OX, x + 6 + rng()*10 - OX, y + 0.02, y + 0.12, z - OZ, z + 6 + rng()*14 - OZ); }
  B.flush(g); return g; }};
LANDMARKS.nyjavits_b = {zh:'贾维茨会展中心扩建', en:'Javits Center expansion', cat:'new', r:126, h:40, label:false,
  lt:{m:0, c:'#eef4ff', k:0.5, e:0.8}, build(){
  const g = new THREE.Group(), B = mkB(), OX = -33, OZ = -212, Q = P => T(P, OX, OZ);
  const MAIN = Q([[-88.4, -158.9], [-88.4, -180.9], [-135.3, -180.3], [-134.4, -279.8], [69.3, -281.0], [69.6, -220.9], [57.5, -221.0], [57.5, -143.5], [-67.5, -143.5], [-67.5, -153.3], [-83.8, -153.2], [-83.7, -158.9]]);
  jPlinth(B, MAIN, -10);
  jVol(B, MAIN, 0.3, 27, JGL2, JRF2);
  // raised hall volume and the glass rooftop pavilion (west, over the Hudson) + terrace, rooftop farm (east)
  jVol(B, Q(R4(-60, 40, -268, -190)), 27, 32, JGL);
  jVol(B, Q(R4(-128, -96, -272, -226)), 27, 35, JPV, JFR);
  abox(B.p(JFR), -130 - OX, -94 - OX, 35, 35.8, -274 - OZ, -224 - OZ);
  abox(B.p(JCON), -128 - OX, -96 - OX, 27, 27.4, -224 - OZ, -186 - OZ);
  const fm = B.p(JFARM), so = B.p(JSOIL);
  for (let k = 0; k < 14; k++){ const z = -270 + k*5.4; abox(k % 3 ? fm : so, 42 - OX, 66 - OX, 27, 27.5, z - OZ, z + 3.8 - OZ); }
  for (const [x, z] of [[0, -230], [-40, -230], [20, -200]]) abox(B.p(JFR), x - 6 - OX, x + 6 - OX, 32, 36, z - 4 - OZ, z + 4 - OZ);   // mechanical
  B.flush(g); return g; }};
LANDMARKS.nyjavits_c = {zh:'贾维茨会展中心连接体', en:'Javits Center link', cat:'new', r:96, h:24, label:false,
  lt:{m:0, c:'#eef4ff', k:0.5, e:0.8}, build(){
  const g = new THREE.Group(), B = mkB(), OX = 20, OZ = -134, Q = P => T(P, OX, OZ);
  const LINK = Q(R4(-67.5, 73.7, -143.4, -116.1)), WING = Q(R4(57.6, 106.9, -168.4, -140.3));
  jPlinth(B, LINK, -10); jPlinth(B, Q(R4(57.6, 106.9, -168.4, -143.4)), -10);
  jVol(B, LINK, 0.3, 12*jS, JGL);
  jVol(B, WING, 0.3, 22, JGL2, JRF2);
  abox(B.p(JFR), 106.9 - OX, 110.4 - OX, 5.8, 6.6, -164 - OZ, -144 - OZ);
  B.flush(g); return g; }};
place('nyjavits', 40.7578, -74.0022, -12, 22);
place('nyjavits_b', 40.7578, -74.0022, -33, -212);
place('nyjavits_c', 40.7578, -74.0022, 20, -134);
}
// ===================================================================================================================
// Port Authority Bus Terminal (1950; north wing and the steel X-braced frame 1979): nyportauth = the north wing
// (8th Ave, W 41st - 42nd St: the giant dark-steel X-truss frame on the 8th Ave and 42nd St fronts, glass behind, the
// street canopy, roof parking deck), nyportauth_b = the 1950 south wing (W 40th - 41st St, 8th - 9th Ave: the X-frame on
// 8th Ave, the ribbed concrete bus decks with long open slots, ramp portals toward the Lincoln Tunnel on the west end).
// Two keys keep the hulls off the McGraw-Hill Building and the post office in the notch. Frame = nyportauth anchor (grid).
{
const PA_FR = '#5a524b', PA_FR2 = '#48413b', PA_GL = {c:'#3f4c55', glow:'#ffe4b8', gk:0.4}, PA_CON = '#a39b8f', PA_CON2 = '#8e877c';
const PA_ROOF = '#6f6e6b', PA_SLOT = '#2f3133', PA_LINE = '#d8d4c4', PA_CAN = {c:'#b7b2a8', glow:'#fff0d8', gk:0.35};
// X-braced frame on an edge F from s0..s1: columns every bay, girders at levels ys, X in each panel
function paX(B, F, s0, s1, ys, bay, off){
  const fr = B.p(PA_FR), f2 = B.p(PA_FR2), n = Math.max(1, Math.round((s1 - s0)/bay)), w = (s1 - s0)/n;
  for (let k = 0; k <= n; k++){ const s = s0 + k*w; faceRect(fr, F, s - 0.75, s + 0.75, 0, ys[ys.length - 1] + 0.8, off + 0.9, 1.5); }
  for (const y of ys) faceRect(fr, F, s0 - 0.75, s1 + 0.75, y - 0.7, y + 0.7, off + 0.8, 1.2);
  for (let k = 0; k < n; k++){ const a = s0 + k*w, b = a + w;
    for (let l = 0; l < ys.length - 1; l++){ const y0 = ys[l], y1 = ys[l + 1];
      segP(f2, F.at(a + 0.6, y0 + 0.5, off + 0.5), F.at(b - 0.6, y1 - 0.5, off + 0.5), 0.7, 4);
      segP(f2, F.at(b - 0.6, y0 + 0.5, off + 0.5), F.at(a + 0.6, y1 - 0.5, off + 0.5), 0.7, 4); } }
}
function paBody(B, P, yTop, glassEdges){
  const c = B.p(PA_CON), c2 = B.p(PA_CON2), sl = B.p(PA_SLOT), gl = B.p(PA_GL), rf = B.p(PA_ROOF), ln = B.p(PA_LINE);
  prismP(c2, P, -5, 0.3, false);
  for (let i = 0; i < P.length; i++){ const F = edgeF(P, i), a = P[i], b = P[(i + 1) % P.length];
    const q = [[a[0], 0.3, a[1]], [b[0], 0.3, b[1]], [b[0], yTop, b[1]], [a[0], yTop, a[1]]];
    if (glassEdges.includes(i)){ quadP(gl, ...q); for (let y = 6; y < yTop - 1; y += 3.6) faceRect(c2, F, 0, F.L, y - 0.35, y, 0.1); continue; }
    quadP(c, ...q);
    for (const y of [7.5, 13.5, 19.5, 25.5, 31.5]) if (y < yTop - 2) faceRect(sl, F, 1.5, F.L - 1.5, y, y + 2.6, 0.05);   // open bus-deck slots
    for (let u = 4; u < F.L - 2; u += 4) faceRect(c2, F, u - 0.3, u + 0.3, 6.5, yTop - 1, 0.18);                  // ribs
    faceRect(c2, F, -0.2, F.L + 0.2, yTop - 1.2, yTop + 1.1, 0.3); }
  flatP(rf, P, yTop);
  // roof parking deck: parapet + stripes + light poles
  bandP(c2, offP(P, -0.3), yTop, 1.1, 0.0);
}
LANDMARKS.nyportauth = {zh:'港务局巴士总站', en:'Port Authority Bus Terminal', cat:'new', r:76, h:46,
  lt:{m:0, c:'#ffe8c8', k:0.55, e:0.7}, build(){
  const g = new THREE.Group(), B = mkB(), OX = -37, OZ = -7.5, Q = P => T(P, OX, OZ);
  const P = Q([[-90.6, -46.2], [19.4, -46.4], [19.5, 31.5], [-87.0, 31.5], [-87.1, -16.2], [-90.6, -16.1]]);   // west edge kept 3.6 m off the McGraw-Hill Building
  paBody(B, P, 37, [0, 1]);
  // the chamfered corner toward 41st St above the McGraw-Hill Building's base (kept above 25 m so the hull stays clear)
  { const W = Q([[-87.0, 15.8], [-87.0, 31.5], [-97.5, 31.5]]); prismP(B.p(PA_CON), W, 25.5, 37, true); flatP(B.p(PA_ROOF), W, 37); }
  // X frames on 42nd St (edge 0) and 8th Ave (edge 1)
  for (const i of [0, 1]){ const F = edgeF(P, i); paX(B, F, 2.0, F.L - 2.0, [6.5, 21.5, 36.5], i === 1 ? 13 : 14.2, 0.2);
    faceRect(B.p(PA_CAN), F, 0, F.L, 4.6, 5.2, 4.2, 4.0); }
  const ln = B.p(PA_LINE);
  for (let x = -85; x < 15; x += 5.5) abox(ln, x - OX, x + 0.15 - OX, 37.02, 37.06, -40 - OZ, -20 - OZ);
  for (let x = -85; x < 15; x += 5.5) abox(ln, x - OX, x + 0.15 - OX, 37.02, 37.06, 5 - OZ, 25 - OZ);
  for (const [x, z] of [[-60, -10], [-20, -10], [5, -10]]) cylP(B.p(PA_FR2), x - OX, z - OZ, 0.15, 0.15, 37, 45, 4, false);
  B.flush(g); return g; }};
LANDMARKS.nyportauth_b = {zh:'港务局巴士总站南楼', en:'Port Authority Bus Terminal south wing', cat:'new', r:133, h:42, label:false,
  lt:{m:0, c:'#ffe8c8', k:0.55, e:0.7}, build(){
  const g = new THREE.Group(), B = mkB(), OX = -103.7, OZ = 62.3, Q = P => T(P, OX, OZ);
  const P = Q([[-226.8, 31.8], [19.5, 31.6], [19.5, 92.3], [-226.9, 93.1]]);
  paBody(B, P, 33, [1]);
  { const F = edgeF(P, 1); paX(B, F, 1.5, F.L - 1.5, [6.5, 19.5, 32.5], 13, 0.2); faceRect(B.p(PA_CAN), F, 0, F.L, 4.6, 5.2, 4.2, 4.0); }
  // ramp portals on the west end (the bus ramps toward the Lincoln Tunnel leave the upper decks here)
  { const F = edgeF(P, 3), sl = B.p(PA_SLOT), c2 = B.p(PA_CON2); for (const [u, y] of [[14, 13], [30, 19], [46, 13]]){ faceRect(sl, F, u - 5, u + 5, y, y + 5.2, 0.06); faceRect(c2, F, u - 5.8, u + 5.8, y + 5.2, y + 6.2, 0.4, 0.6); } }
  const ln = B.p(PA_LINE);
  for (let x = -215; x < 10; x += 5.5) abox(ln, x - OX, x + 0.15 - OX, 33.02, 33.06, 40 - OZ, 58 - OZ);
  for (let x = -215; x < 10; x += 5.5) abox(ln, x - OX, x + 0.15 - OX, 33.02, 33.06, 66 - OZ, 84 - OZ);
  for (let x = -200; x < 10; x += 40) cylP(B.p(PA_FR2), x - OX, 62 - OZ, 0.15, 0.15, 33, 41, 4, false);
  B.flush(g); return g; }};
place('nyportauth', 40.7569, -73.9905, -37, -7.5);
place('nyportauth_b', 40.7569, -73.9905, -103.7, 62.3);
}
}
