// ===== lm22/tanjongpagar: Guoco Tower, CapitaSpring, Asia Square, The Sail @ Marina Bay, Lau Pa Sat and The Fullerton Hotel,
// upgraded (City Brush v24, the real Singapore at 1:1). Every model is built in the real map frame: local +x = east, +z = south,
// rot 0, on the real OSM footprints (lm18/ref_F1.json, lm18/ref_F2.json, lm20/ref_W2.json; FD below, relative to each origin).
// Towers whose grid is turned use a local frame F(u, y, v) -> [x, y, z]. Block-scoped: only LANDMARKS and SG_PLACES are touched.
{
const PI = Math.PI, HP = PI/2, TAU = PI*2;
const FD = {"guoco":{"POD":[[56.1,-32.3],[61.5,21.7],[-54.3,33.5],[-61.5,-22.8]],"TW":[[-9.5,-24.6],[51.9,-31.1],[57.3,21.7],[-3.6,27.6]],"HOT":[[-10.7,-24.6],[-8.3,0.9],[-48.3,5.1],[-50.7,-20.4]],"TOP":[[-6.6,0.9],[-9.5,-24.6],[51.9,-31.1],[54.9,-6.2]],"_place":[1.27702,103.845472]},"capitaspring":{"POD":[[-30.3,-30.5],[-26.7,-31.7],[-22.0,-30.5],[-10.0,-31.7],[1.9,-44.7],[24.0,-47.7],[24.0,40.1],[21.0,44.8],[16.9,48.4],[14.5,49.5],[9.7,50.1],[1.3,47.8],[-33.3,-13.9],[-30.3,-15.7],[-33.3,-19.2],[-34.5,-24.0]],"TW":[[4.3,-37.0],[24.0,-10.9],[24.0,25.8],[-4.0,37.1],[-33.3,-13.9]],"_place":[1.283874,103.850041]},"lauPaSat":{"OCT":[[-39.4,-6.0],[-25.0,-29.7],[4.8,-36.2],[29.3,-20.8],[33.5,5.9],[20.3,27.2],[-4.2,36.7],[-31.6,21.3]],"K1":[[15.0,30.8],[17.3,37.3],[4.8,41.5],[1.8,35.5]],"K0":[[38.8,-7.2],[40.0,-4.2],[39.4,-1.8],[38.2,-0.6],[34.1,-1.8],[32.9,-4.8],[34.1,-7.2],[37.0,-7.8]],"parts":[[0.0,9.0,[[0.0,0.0],[-39.4,-6.0],[-25.0,-29.7]]],[0.0,9.0,[[0.0,0.0],[-31.6,21.3],[-39.4,-6.0]]],[0.0,9.0,[[0.0,0.0],[4.8,-36.2],[29.3,-20.8]]],[0.0,9.0,[[0.0,0.0],[33.5,5.9],[20.3,27.2]]],[0.0,9.0,[[-31.6,21.3],[0.0,0.0],[-4.2,36.7]]],[0.0,9.0,[[0.0,0.0],[-25.0,-29.7],[4.8,-36.2]]],[0.0,9.0,[[0.0,0.0],[20.3,27.2],[-4.2,36.7]]],[0.0,9.0,[[0.0,0.0],[29.3,-20.8],[33.5,5.9]]]],"_place":[1.280616,103.850503],"oct":[0.1466,36.77]},"asiasquare":{"SITE":[[6.3,-105.9],[92.3,-51.4],[94.0,-42.5],[-0.9,104.0],[-9.2,105.8],[-91.0,53.6],[-92.8,44.7],[-2.1,-103.5]],"T1":[[23.0,-86.9],[77.9,-52.5],[47.5,-5.1],[-6.8,-39.5]],"T2":[[-37.3,10.9],[17.6,45.3],[-12.8,92.8],[-67.7,58.9]],"parts":[[20.0,195.0,[[23.0,-86.9],[41.5,-75.7],[32.0,-59.7],[13.5,-71.5]]],[20.0,228.0,[[-57.6,42.9],[-39.1,54.2],[-49.2,70.2],[-67.7,58.9]]],[20.0,185.0,[[2.7,-54.9],[21.2,-43.6],[11.7,-27.6],[-6.8,-39.5]]],[20.0,216.0,[[-37.3,10.9],[-18.8,22.8],[-28.9,38.8],[-47.4,26.3]]],[20.0,173.0,[[-18.8,22.8],[-1.5,33.4],[-11.0,48.9],[-28.9,38.8]]],[20.0,221.0,[[59.4,-64.4],[77.9,-52.5],[68.4,-37.1],[49.3,-49.0]]],[20.0,183.0,[[-11.0,48.9],[7.5,60.7],[-2.7,77.3],[-21.8,65.5]]],[20.0,225.0,[[-47.4,26.3],[-28.9,38.8],[-39.1,54.2],[-57.6,42.9]]],[20.0,215.0,[[21.2,-43.6],[39.1,-32.4],[29.0,-17.0],[11.7,-27.6]]],[20.0,216.0,[[-39.1,54.2],[-21.8,65.5],[-31.9,81.5],[-49.2,70.2]]],[20.0,173.0,[[-1.5,33.4],[17.6,45.3],[7.5,60.7],[-11.0,48.9]]],[20.0,193.0,[[49.3,-49.0],[68.4,-37.1],[57.6,-20.5],[39.1,-32.4]]],[20.0,207.0,[[39.1,-32.4],[57.6,-20.5],[47.5,-5.1],[29.0,-17.0]]],[20.0,200.0,[[21.2,-43.6],[32.0,-59.7],[49.3,-49.0],[39.1,-32.4]]],[20.0,221.0,[[13.5,-71.5],[32.0,-59.7],[21.2,-43.6],[2.7,-54.9]]],[20.0,193.0,[[41.5,-75.7],[59.4,-64.4],[49.3,-49.0],[32.0,-59.7]]],[20.0,216.0,[[-21.8,65.5],[-2.7,77.3],[-12.8,92.8],[-31.9,81.5]]]]},"thesail":{"MBT":[[5.3,-59.1],[14.9,-55.6],[25.0,-50.2],[35.8,-42.5],[44.1,-34.8],[54.9,-21.2],[46.5,-16.4],[44.7,-18.2],[38.8,-14.0],[34.0,-17.0],[33.4,-15.8],[28.6,-18.2],[-4.8,-39.5],[-4.2,-40.7],[-9.6,-43.7],[-8.4,-52.0],[-9.6,-60.9]],"CPT":[[45.9,6.7],[32.8,30.4],[23.8,39.9],[20.3,36.4],[16.1,39.9],[10.1,29.2],[13.1,25.1],[10.1,22.7],[19.7,7.3],[25.0,0.8],[30.4,-3.4]],"POD":[[-22.1,-25.9],[-11.4,-24.1],[-0.6,-17.6],[4.7,-33.6],[7.7,-31.8],[1.7,-15.2],[10.1,-5.1],[15.5,12.6],[10.1,22.7],[13.1,25.1],[10.1,29.2],[16.1,39.9],[20.3,36.4],[23.2,39.9],[3.5,50.6],[-2.4,51.8],[-4.2,47.6],[-6.0,49.4],[-44.8,23.9],[-49.0,16.2],[-50.2,9.1],[-48.4,0.8],[-31.7,-25.9]]}};
// every material double-sided so that extrusions and triangle batches of one colour share one material
const dsS = c => typeof c === 'string' ? {c, ds:true} : Object.assign({ds:true}, c);
const LPolyD = (g, P, y0, h, col) => LPoly(g, P, y0, h, dsS(col)), LBoxD = (g, w, h, d, x, y, z, col, ry) => LBox(g, w, h, d, x, y, z, dsS(col), ry);
const LCylD = (g, rt, rb, h, x, y, z, col, seg, ry) => LCyl(g, rt, rb, h, x, y, z, dsS(col), seg, ry), LSphD = (g, r, x, y, z, col, sy, seg) => LSph(g, r, x, y, z, dsS(col), sy, seg);
const LShapeD = (g, pts, depth, x, y, z, col, ry) => LShape(g, pts, depth, x, y, z, dsS(col), ry), LBeamD = (g, a, b, r, col, seg) => LBeam(g, a, b, r, dsS(col), seg);
const quadP = (o, a, b, c, d) => o.push(...a, ...b, ...c, ...a, ...c, ...d), triP = (o, a, b, c) => o.push(...a, ...b, ...c);
const lerp = (a, b, t) => a + (b - a)*t, cl01 = t => t < 0 ? 0 : t > 1 ? 1 : t;
// ---- triangle batches: many small parts of one colour spec become one LTris call
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const Q = (o, a, b, c, d) => o.push(...a, ...b, ...c, ...a, ...c, ...d);
const T3 = (o, a, b, c) => o.push(...a, ...b, ...c);
// n-sided prism round a segment (columns, rails, members), optional end radius r1
function segP(o, a, b, r, n, r1){
  n = n || 6; const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2], L = Math.hypot(dx, dy, dz); if (L < 1e-4) return;
  const d = [dx/L, dy/L, dz/L], up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let ux = d[1]*up[2]-d[2]*up[1], uy = d[2]*up[0]-d[0]*up[2], uz = d[0]*up[1]-d[1]*up[0]; const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
  const vx = d[1]*uz-d[2]*uy, vy = d[2]*ux-d[0]*uz, vz = d[0]*uy-d[1]*ux;
  const ring = (p, rr) => { const R = []; for (let i = 0; i < n; i++){ const t = (i + 0.5)/n*TAU, c = Math.cos(t)*rr, s = Math.sin(t)*rr; R.push([p[0]+ux*c+vx*s, p[1]+uy*c+vy*s, p[2]+uz*c+vz*s]); } return R; };
  const A = ring(a, r), B2 = ring(b, r1 === undefined ? r : r1);
  for (let i = 0; i < n; i++){ const j = (i+1) % n; Q(o, A[i], A[j], B2[j], B2[i]); }
}
// solid of revolution into a batch: profile [[r, y], ...] round (cx, cz), n sides
function latheP(o, prof, cx, cz, n, a0){
  a0 = a0 || 0; const R = prof.map(([r, y]) => { const ring = []; for (let i = 0; i < n; i++){ const t = a0 + i/n*TAU; ring.push([cx + Math.cos(t)*r, y, cz + Math.sin(t)*r]); } return ring; });
  for (let k = 0; k < R.length - 1; k++) for (let i = 0; i < n; i++){ const j = (i+1) % n; Q(o, R[k][i], R[k][j], R[k+1][j], R[k+1][i]); }
}
// ---- local frames: F(u, y, v) -> [x, y, z]; +u at plan angle a (x east, z south), +v = +u turned 90 deg towards +z
const frame = (ox, oz, a) => { const c = Math.cos(a), s = Math.sin(a); const f = (u, y, v) => [ox + u*c - v*s, y, oz + u*s + v*c]; f.P = (u, v) => [ox + u*c - v*s, oz + u*s + v*c];
  f.L = (x, z) => [(x - ox)*c + (z - oz)*s, -(x - ox)*s + (z - oz)*c]; f.a = a; return f; };
const F0 = frame(0, 0, 0);
// box from local min/max (u, y, v) corners in frame F (no bottom face unless bot)
function bxF(o, F, u0, u1, y0, y1, v0, v1, bot){
  const P = [F(u0,y0,v0), F(u1,y0,v0), F(u1,y0,v1), F(u0,y0,v1), F(u0,y1,v0), F(u1,y1,v0), F(u1,y1,v1), F(u0,y1,v1)];
  Q(o, P[4], P[7], P[6], P[5]); Q(o, P[0], P[4], P[5], P[1]); Q(o, P[1], P[5], P[6], P[2]); Q(o, P[2], P[6], P[7], P[3]); Q(o, P[3], P[7], P[4], P[0]); if (bot) Q(o, P[0], P[1], P[2], P[3]);
}
// box of size w x h x d centred at (x, z), base y, turned ry (rotP convention)
function boxP(o, w, h, d, x, y, z, ry){
  const R = rotP(x, z, ry || 0), hw = w/2, hd = d/2;
  const P = [R(-hw, y, -hd), R(hw, y, -hd), R(hw, y, hd), R(-hw, y, hd), R(-hw, y+h, -hd), R(hw, y+h, -hd), R(hw, y+h, hd), R(-hw, y+h, hd)];
  for (const [a, b, c, e] of [[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]) Q(o, P[a], P[b], P[c], P[e]);
}
// ---- plan polygons ([x, z] points)
const area2 = P => { let s = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; s += a[0]*b[1] - b[0]*a[1]; } return s/2; };
const cenP = P => { let x = 0, z = 0; for (const p of P){ x += p[0]; z += p[1]; } return [x/P.length, z/P.length]; };
const rectP = (w, d, cx, cz, ry) => { const R = rotP(cx || 0, cz || 0, ry || 0); return [[-w/2, -d/2], [w/2, -d/2], [w/2, d/2], [-w/2, d/2]].map(p => { const q = R(p[0], 0, p[1]); return [q[0], q[2]]; }); };
const rectL = (F, u0, u1, v0, v1) => [F.P(u0, v0), F.P(u1, v0), F.P(u1, v1), F.P(u0, v1)];
const polyL = (F, P) => P.map(p => F.P(p[0], p[1]));
const ngon = (n, r, cx, cz, a0) => { const P = []; for (let i = 0; i < n; i++){ const a = (a0 || 0) + i/n*TAU; P.push([(cx || 0) + Math.cos(a)*r, (cz || 0) + Math.sin(a)*r]); } return P; };
// inward offset by d (negative grows), mitred and clamped
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
// outward unit normal of edge i
const outN = (P, i) => { const s = area2(P) > 0 ? 1 : -1, a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], l = Math.hypot(ex, ez) || 1; return [ez/l*s, -ex/l*s]; };
const inPoly = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0]-a[0])*(z-a[1])/(b[1]-a[1]) + a[0]) c = !c; } return c; };
const dSeg = (x, z, a, b) => { const ex = b[0]-a[0], ez = b[1]-a[1], L2 = ex*ex + ez*ez || 1, t = cl01(((x-a[0])*ex + (z-a[1])*ez)/L2); return Math.hypot(x - a[0] - ex*t, z - a[1] - ez*t); };
const dPoly = (P, x, z) => { let d = 1e9; for (let i = 0; i < P.length; i++) d = Math.min(d, dSeg(x, z, P[i], P[(i+1) % P.length])); return d; };
const triang = P => THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
// walls of a plan polygon from y0 up to ytop (a number or f(x, z)) and its top, into a batch
function prismP(o, P, y0, ytop, noTop){
  const f = typeof ytop === 'function' ? ytop : () => ytop;
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; Q(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], f(b[0], b[1]), b[1]], [a[0], f(a[0], a[1]), a[1]]); }
  if (!noTop) for (const t of triang(P)) for (const k of t){ const p = P[k]; o.push(p[0], f(p[0], p[1]), p[1]); }
}
// walls of a plan polygon between two height functions (or numbers)
function wallP(o, P, y0, y1){ const f0 = typeof y0 === 'function' ? y0 : () => y0, f1 = typeof y1 === 'function' ? y1 : () => y1;
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; Q(o, [a[0], f0(a[0], a[1]), a[1]], [b[0], f0(b[0], b[1]), b[1]], [b[0], f1(b[0], b[1]), b[1]], [a[0], f1(a[0], a[1]), a[1]]); } }
const flatP = (o, P, y) => { for (const t of triang(P)) for (const k of t){ const p = P[k]; o.push(p[0], y, p[1]); } };
// floor bands round a plan polygon every `step` m between y0 and y1 (vertical quads just proud of the wall); edges(i) filters edges
function bandsP(o, P, y0, y1, step, bh, off, edges){
  off = off || 0.12;
  for (let i = 0; i < P.length; i++){ if (edges && !edges(i)) continue;
    const a = P[i], b = P[(i+1) % P.length]; if (Math.hypot(b[0]-a[0], b[1]-a[1]) < 0.3) continue; const [nx, nz] = outN(P, i);
    for (let y = y0 + step; y < y1 - 0.3; y += step) Q(o, [a[0]+nx*off, y, a[1]+nz*off], [b[0]+nx*off, y, b[1]+nz*off], [b[0]+nx*off, y+bh, b[1]+nz*off], [a[0]+nx*off, y+bh, a[1]+nz*off]);
  }
}
// one band round a plan polygon at y..y+h, `off` proud of the walls
function bandAt(o, P, y, h, off, edges){
  off = off || 0.1;
  for (let i = 0; i < P.length; i++){ if (edges && !edges(i)) continue; const a = P[i], b = P[(i+1) % P.length]; if (Math.hypot(b[0]-a[0], b[1]-a[1]) < 0.2) continue; const [nx, nz] = outN(P, i);
    Q(o, [a[0]+nx*off, y, a[1]+nz*off], [b[0]+nx*off, y, b[1]+nz*off], [b[0]+nx*off, y+h, b[1]+nz*off], [a[0]+nx*off, y+h, a[1]+nz*off]); }
}
// vertical strips (mullions / piers) standing `off` proud of the walls, about `sp` apart, `w` wide; y0, y1 numbers or f(x, z)
function mullP(o, P, y0, y1, sp, w, off, edges){
  for (let i = 0; i < P.length; i++){ if (edges && !edges(i)) continue;
    const a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], L = Math.hypot(ex, ez); if (L < sp*0.6) continue;
    const [nx, nz] = outN(P, i), n = Math.max(1, Math.round(L/sp)), ux = ex/L, uz = ez/L, yy0 = typeof y0 === 'function' ? y0 : () => y0, yy1 = typeof y1 === 'function' ? y1 : () => y1;
    for (let k = 0; k <= n; k++){ const t = k/n, x = a[0] + ex*t + nx*off, z = a[1] + ez*t + nz*off, p = [x - ux*w/2, z - uz*w/2], q = [x + ux*w/2, z + uz*w/2];
      Q(o, [p[0], yy0(x, z), p[1]], [q[0], yy0(x, z), q[1]], [q[0], yy1(x, z), q[1]], [p[0], yy1(x, z), p[1]]); }
  }
}
// a lit line along the top edge of a polygon (crowns at night)
function edgeLineP(o, P, f, r, open){ const n = open ? P.length - 1 : P.length; for (let i = 0; i < n; i++){ const a = P[i], b = P[(i+1) % P.length]; segP(o, [a[0], f(a[0], a[1]) + r, a[1]], [b[0], f(b[0], b[1]) + r, b[1]], r, 4); } }
const triPoly = (o, P, f) => { for (const t of triang(P)) for (const k of t){ const p = P[k]; o.push(p[0], f(p[0], p[1]), p[1]); } };
// ---------- a "face": a vertical wall plane, u along it (from point A), d outwards, y up ----------
// fc(ax, az, bx, bz): wall from A to B; outward normal = the right-hand side walking A->B seen from above (+z drawn downwards)
const fc = function(ax, az, bx_, bz){ const L = Math.hypot(bx_ - ax, bz - az), tx = (bx_ - ax)/L, tz = (bz - az)/L; return {ax, az, tx, tz, nx:-tz, nz:tx, L}; };
const fcL = (F, u0, v0, u1, v1) => { const a = F.P(u0, v0), b = F.P(u1, v1); return fc(a[0], a[1], b[0], b[1]); };
// faces of a local rectangle, outside to the right: f (+v), r (+u), b (-v), l (-u)
const rectFL = (F, u0, u1, v0, v1) => ({f:fcL(F, u0, v1, u1, v1), r:fcL(F, u1, v1, u1, v0), b:fcL(F, u1, v0, u0, v0), l:fcL(F, u0, v0, u0, v1)});
// faces of a plan polygon with the outside to the right
const facesP = P => { const s = area2(P) > 0 ? 1 : -1, out = []; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; out.push(s < 0 ? fc(a[0], a[1], b[0], b[1]) : fc(b[0], b[1], a[0], a[1])); } return out; };
const fp = (F, u, y, d) => [F.ax + F.tx*u + F.nx*d, y, F.az + F.tz*u + F.nz*d];
// box in face coordinates
function fbx(o, F, u0, u1, y0, y1, d0, d1){
  const P = [fp(F,u0,y0,d0), fp(F,u1,y0,d0), fp(F,u1,y0,d1), fp(F,u0,y0,d1), fp(F,u0,y1,d0), fp(F,u1,y1,d0), fp(F,u1,y1,d1), fp(F,u0,y1,d1)];
  Q(o, P[4], P[7], P[6], P[5]); Q(o, P[0], P[4], P[5], P[1]); Q(o, P[1], P[5], P[6], P[2]); Q(o, P[2], P[6], P[7], P[3]); Q(o, P[3], P[7], P[4], P[0]); Q(o, P[0], P[1], P[2], P[3]);
}
// flat panel on the face at depth d
const frect = (o, F, u0, u1, y0, y1, d) => Q(o, fp(F,u0,y0,d), fp(F,u1,y0,d), fp(F,u1,y1,d), fp(F,u0,y1,d));
// round-headed panel: rectangle up to the springing ys, half circle above
function farch(o, F, uc, y0, w, ys, d, n){
  n = n || 6; const r = w/2; frect(o, F, uc - r, uc + r, y0, ys, d);
  for (let i = 0; i < n; i++){ const a = PI*i/n, b = PI*(i+1)/n; T3(o, fp(F, uc, ys, d), fp(F, uc + Math.cos(a)*r, ys + Math.sin(a)*r, d), fp(F, uc + Math.cos(b)*r, ys + Math.sin(b)*r, d)); }
}
// arch ring (voussoirs) round a round-headed opening: band of width bw outside radius r, springing ys
function farchRing(o, F, uc, ys, r, bw, d, n){
  n = n || 8; for (let i = 0; i < n; i++){ const a = PI*i/n, b = PI*(i+1)/n;
    Q(o, fp(F, uc + Math.cos(a)*r, ys + Math.sin(a)*r, d), fp(F, uc + Math.cos(a)*(r + bw), ys + Math.sin(a)*(r + bw), d), fp(F, uc + Math.cos(b)*(r + bw), ys + Math.sin(b)*(r + bw), d), fp(F, uc + Math.cos(b)*r, ys + Math.sin(b)*r, d)); }
}
// open arcade: n round arches between u0 and u1 on piers of width pw, springing at ys, wall up to yt, thickness d0..d1
function farcade(o, F, u0, u1, n, y0, ys, yt, pw, d0, d1, seg){
  seg = seg || 6; const bw = (u1 - u0)/n, r = (bw - pw)/2;
  for (let k = 0; k <= n; k++){ const u = u0 + k*bw; fbx(o, F, Math.max(u0, u - pw/2), Math.min(u1, u + pw/2), y0, yt, d0, d1); }
  for (let k = 0; k < n; k++){ const uc = u0 + (k + 0.5)*bw;
    for (let i = 0; i < seg; i++){ const a = PI - PI*i/seg, b = PI - PI*(i+1)/seg, ua = uc + Math.cos(a)*r, ub = uc + Math.cos(b)*r, ya = ys + Math.sin(a)*r, yb = ys + Math.sin(b)*r;
      for (const d of [d0, d1]) Q(o, fp(F, ua, ya, d), fp(F, ub, yb, d), fp(F, ub, yt, d), fp(F, ua, yt, d));
      Q(o, fp(F, ua, ya, d0), fp(F, ub, yb, d0), fp(F, ub, yb, d1), fp(F, ua, ya, d1)); }
  }
}
// round column at u, depth d on the face
function fcol(o, F, u, d, y0, y1, r, n){ const c = fp(F, u, 0, d); segP(o, [c[0], y0, c[2]], [c[0], y1, c[2]], r, n || 8); }
// balustrade / railing along the face
function frail(o, F, u0, u1, y, h, d, sp){ fbx(o, F, u0, u1, y + h - 0.12, y + h, d - 0.06, d + 0.06); const n = Math.max(1, Math.round((u1 - u0)/(sp || 1.2))); for (let i = 0; i <= n; i++){ const u = u0 + i*(u1 - u0)/n; fbx(o, F, u - 0.04, u + 0.04, y, y + h, d - 0.04, d + 0.04); } }
// triangular pediment on a face: base u0..u1 at y, apex height h, depth d0..d1
function fped(o, F, u0, u1, y, h, d0, d1){
  const um = (u0 + u1)/2;
  for (const d of [d0, d1]) T3(o, fp(F, u0, y, d), fp(F, u1, y, d), fp(F, um, y + h, d));
  Q(o, fp(F, u0, y, d0), fp(F, um, y + h, d0), fp(F, um, y + h, d1), fp(F, u0, y, d1)); Q(o, fp(F, um, y + h, d0), fp(F, u1, y, d0), fp(F, u1, y, d1), fp(F, um, y + h, d1));
}
// hipped roof on a local rectangle (frame F) at eaves height y, rise h, overhang ov; ridge along the longer side
function hipF(o, F, u0, u1, v0, v1, y, h, ov){
  ov = ov || 0; u0 -= ov; u1 += ov; v0 -= ov; v1 += ov; const L = u1 - u0, W = v1 - v0, cu = (u0 + u1)/2, cv = (v0 + v1)/2;
  if (L >= W){ const k = (L - W)/2, a = F(cu - k, y + h, cv), b = F(cu + k, y + h, cv);
    Q(o, F(u0, y, v1), F(u1, y, v1), b, a); Q(o, F(u1, y, v0), F(u0, y, v0), a, b); T3(o, F(u0, y, v0), F(u0, y, v1), a); T3(o, F(u1, y, v1), F(u1, y, v0), b); }
  else { const k = (W - L)/2, a = F(cu, y + h, cv - k), b = F(cu, y + h, cv + k);
    Q(o, F(u1, y, v1), F(u1, y, v0), a, b); Q(o, F(u0, y, v0), F(u0, y, v1), b, a); T3(o, F(u0, y, v1), F(u1, y, v1), b); T3(o, F(u1, y, v0), F(u0, y, v0), a); }
}
// gabled roof on a local rectangle, ridge along u (ax 'u') or v; gable triangles into ow
function gabF(o, ow, F, u0, u1, v0, v1, y, h, ax, ov){
  ov = ov || 0;
  if (ax === 'u'){ const cv = (v0 + v1)/2; Q(o, F(u0 - ov, y, v1 + ov), F(u1 + ov, y, v1 + ov), F(u1 + ov, y + h, cv), F(u0 - ov, y + h, cv)); Q(o, F(u1 + ov, y, v0 - ov), F(u0 - ov, y, v0 - ov), F(u0 - ov, y + h, cv), F(u1 + ov, y + h, cv));
    if (ow){ T3(ow, F(u0, y, v0), F(u0, y, v1), F(u0, y + h, cv)); T3(ow, F(u1, y, v1), F(u1, y, v0), F(u1, y + h, cv)); } }
  else { const cu = (u0 + u1)/2; Q(o, F(u1 + ov, y, v1 + ov), F(u1 + ov, y, v0 - ov), F(cu, y + h, v0 - ov), F(cu, y + h, v1 + ov)); Q(o, F(u0 - ov, y, v0 - ov), F(u0 - ov, y, v1 + ov), F(cu, y + h, v1 + ov), F(cu, y + h, v0 - ov));
    if (ow){ T3(ow, F(u0, y, v1), F(u1, y, v1), F(cu, y + h, v1)); T3(ow, F(u1, y, v0), F(u0, y, v0), F(cu, y + h, v0)); } }
}
// trees into batches
function treeP(B, x, y, z, s, crown, trunk){
  segP(B.p(trunk || '#5d4a3a'), [x, y - 1, z], [x, y + 3*s, z], 0.28*s, 4);
  const c = B.p(crown || '#4f7f3a'), R = 2.4*s, cy = y + 4.2*s, top = [x, cy + R*0.75, z], bot = [x, cy - R*0.55, z], ring = [];
  for (let i = 0; i < 6; i++){ const a = i/6*TAU; ring.push([x + Math.cos(a)*R, cy, z + Math.sin(a)*R]); }
  for (let i = 0; i < 6; i++){ const j = (i+1) % 6; T3(c, top, ring[j], ring[i]); T3(c, bot, ring[i], ring[j]); }
}
function palmP(B, x, y, z, s, r, crown){
  const top = [x + (r() - 0.5)*1.2*s, y + 7*s, z + (r() - 0.5)*1.2*s];
  segP(B.p('#5d4a3a'), [x, y - 1, z], top, 0.22*s, 4);
  const f = B.p(crown || '#4f7f3a');
  for (let i = 0; i < 7; i++){ const a = i/7*TAU + r(), c = Math.cos(a), sn = Math.sin(a), L = 3.2*s;
    T3(f, top, [top[0] + c*L - sn*0.5*s, top[1] - 1.2*s, top[2] + sn*L + c*0.5*s], [top[0] + c*L + sn*0.5*s, top[1] - 1.2*s, top[2] + sn*L - c*0.5*s]); }
}
const sm = t => { t = cl01(t); return t*t*(3 - 2*t); };
const scaleP = (P, s, c) => { c = c || cenP(P); return P.map(p => [c[0] + (p[0]-c[0])*s, c[1] + (p[1]-c[1])*s]); };
// scatter trees inside a polygon (avoid(x, z) -> true skips a spot)
function treesIn(B, P, n, y, s, r, avoid, crown){
  const xs = P.map(p => p[0]), zs = P.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
  for (let t = 0, k = 0; t < n*12 && k < n; t++){ const x = lerp(x0, x1, r()), z = lerp(z0, z1, r()); if (!inPoly(P, x, z) || dPoly(P, x, z) < 2 || (avoid && avoid(x, z))) continue;
    treeP(B, x, typeof y === 'function' ? y(x, z) : y, z, s*(0.8 + 0.5*r()), crown); k++; }
}
// fins along every face of plan P (outward), about sp apart; every `ev`-th fin deeper; top = number or f(face, u) -> y
function finRing(o, oD, P, y0, top, sp, w, d, ev, wD, dD, skip){
  for (const Fa of facesP(P)){ if (Fa.L < 0.5 || (skip && skip(Fa))) continue; const n = Math.max(1, Math.round(Fa.L/sp));
    for (let k = 0; k <= n; k++){ const u = Fa.L*k/n, deep = ev && (k % ev === 0), yt = typeof top === 'function' ? top(Fa, u) : top; if (yt <= y0 + 0.1) continue;
      const ww = deep ? wD : w, dd = deep ? dD : d; fbx(deep ? oD : o, Fa, u - ww/2, u + ww/2, y0, yt, 0, dd); } }
}
// a horizontal band on every face of P at y..y+h standing d0..d1 from the wall (cornices, slab edges, rails)
function ringBand(o, P, y, h, d0, d1, skip){ for (const Fa of facesP(P)){ if (Fa.L < 0.3 || (skip && skip(Fa))) continue; fbx(o, Fa, -Math.max(0, d1)*0.0, Fa.L, y, y + h, d0, d1); } }
// face midpoint in a frame (for filters)
const fmid = (Fa, T) => T.L(Fa.ax + Fa.tx*Fa.L/2, Fa.az + Fa.tz*Fa.L/2);
const polyP = (o, pts, r, n, closed) => { for (let i = 0; i < pts.length - 1; i++) segP(o, pts[i], pts[i+1], r, n); if (closed) segP(o, pts[pts.length-1], pts[0], r, n); };

// ===== Guoco Tower, Tanjong Pagar Centre (SOM with Architects 61, 2016): Singapore's tallest, 290 m to the top of its crown,
// 64 storeys. The tower tapers as it rises (SOM): notched corners that deepen at the level-20 corner sky gardens, then the strong
// setback two-thirds of the way up - office floors with the full plan (62 x 53 m, OSM) to the louvred transfer belt at ~180 m,
// above it only the north half carries the 26 storeys of the Wallich Residence to the roof (280 m), so the east and west
// profiles step like the characters they were drawn from (entry / people). The fins run on past the roof as an open screen that
// steps up in three tiers to 290 m and glows white at night. Silver-blue glass behind dense white aluminium fins (a deep fin
// every fourth), the planted residents' terrace and lap pool on the setback; the six-storey podium with the 20-storey hotel block
// (to 100 m) on its west end, stepping down to Chinatown, and the City Room canopy (timber soffit, PV glass) on the Urban Park
// side (east). Built in the tower's frame (u along the north face, v to the south).
LANDMARKS.guoco = {zh:'国浩大厦', en:'Guoco Tower', cat:'new', r:67, h:290, lt:{m:1, c:'#e6f0ff', k:0.75}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.guoco, rng = LMCTX.rng;
  const W = D.TW, a = Math.atan2(W[1][1] - W[0][1], W[1][0] - W[0][0]), c0 = cenP(W), T = frame(c0[0], c0[1], a);
  const GL = {c:'#566a7b', m:1, fh:4.3, cw:3.0}, GLR = {c:'#5b7181', m:1, fh:3.6, cw:2.6}, FIN = '#e1e5e6', FIND = FIN, SPN = '#7d8e9b';
  const LOU = '#8e999f', CRN = {c:'#eef2f3', glow:'#e6f0ff', gk:1.1}, STONE = '#cbc6bb', GLZ = {c:'#40525c', glow:'#ffdfae', gk:0.62};
  const HOTG = {c:'#6c7f89', m:1, fh:3.4, cw:2.6}, LAWN = '#6c9a52', TIMB = {c:'#b0855a', glow:'#ffcf96', gk:0.4}, POOL = {c:'#5fb0c8', glow:'#2a6a80', gk:0.5};
  const RED = {c:'#c22', glow:'#ff2a1a', gk:2}, GOP = {c:'#b7cfd9', op:0.5};
  const fin = B.p(FIN), finD = B.p(FIND), spn = B.p(SPN), lou = B.p(LOU), crn = B.p(CRN), stone = B.p(STONE), glz = B.p(GLZ);
  const U = 30.8, V = 26.45, VT = -1.0, N = 3.0, YB0 = 176, YB1 = 183, YR = 280;
  const notched = (u0, u1, v0, v1, n) => [[u0 + n, v0], [u1 - n, v0], [u1 - n, v0 + n], [u1, v0 + n], [u1, v1 - n], [u1 - n, v1 - n], [u1 - n, v1], [u0 + n, v1], [u0 + n, v1 - n], [u0, v1 - n], [u0, v0 + n], [u0 + n, v0 + n]].map(p => T.P(p[0], p[1]));
  // the shaft tapers as it rises: the corner notches deepen at the level-20 sky gardens (YM), then the strong setback at ~180 m
  const YM = 92, N2 = 5.2, OFF0 = notched(-U, U, -V, V, N), OFF = notched(-U, U, -V, V, N2), RES = notched(-U, U, -V, VT, N2), STH = rectL(T, -U, U, VT, V);
  // ---------------- plinth and podium (west of the tower), the hotel block ----------------
  LPolyD(g, rectL(T, -82.4, 35.0, -28.8, 27.0), -4, 4.3, STONE);
  const PW = rectL(T, -82.4, -U, -28.8, 27.0);
  LPolyD(g, offP(PW, 1.6), 0.2, 7, GLZ);                                         // the street-level shopfronts and lobbies
  LPolyD(g, PW, 7, 23, HOTG);
  { const o = B.p(FIN); finRing(o, o, PW, 7, 30, 1.3, 0.2, 0.55, 0, 0, 0, Fa => Fa.L < 3);
    for (const Fa of facesP(PW)){ if (Fa.L < 3) continue; fbx(stone, Fa, 0, Fa.L, 6.4, 7.4, 0, 1.4); fbx(stone, Fa, 0, Fa.L, 29.2, 30.6, 0, 0.9);
      const n = Math.max(1, Math.round(Fa.L/8.4)); for (let k = 0; k <= n; k++){ const u = Fa.L*k/n; fbx(stone, Fa, u - 0.5, u + 0.5, 0, 6.4, 0.2, 1.2); } } }
  flatP(B.p(LAWN), offP(PW, 1.0), 30.25);
  // the hotel pool and deck on the south part of the podium roof, trees
  { const pl = rectL(T, -70, -44, 8, 15); flatP(B.p(POOL), pl, 30.45); prismP(B.p(FIN), offP(pl, -1.2), 30.2, 30.4, false); }
  const HT = rectL(T, -72.5, -32.3, -26.5, -0.9);
  treesIn(B, offP(PW, 2), 26, 30.3, 0.95, rng, (x, z) => inPoly(offP(HT, -3), x, z) || inPoly(offP(rectL(T, -70, -44, 8, 15), -2), x, z));
  LPolyD(g, HT, 30, 70, HOTG);
  bandsP(B.p(FIN), HT, 30, 100, 3.4, 0.45, 0.35);
  { const o = B.p(FIN); finRing(o, o, HT, 30.5, 99.5, 2.4, 0.25, 0.5, 0, 0, 0); }
  prismP(stone, offP(HT, -0.4), 100, 101.6); prismP(lou, offP(HT, 4), 100, 104.5); flatP(lou, offP(HT, 4), 104.5);
  // ---------------- the tower ----------------
  // lobby (15 m, lit) and the City Room's glass wall facing the park
  LPolyD(g, offP(OFF0, 1.4), 0, 15, GLZ);
  finRing(fin, finD, OFF0, 0, 15, 4.5, 0.6, 0.9, 0, 0, 0);
  // office shaft: glass, spandrel lines, fins (a deep one every fourth), corner notches; the louvred transfer belt
  LPolyD(g, OFF0, 15, YM - 15, GL); LPolyD(g, OFF, YM, YB0 - YM, GL);
  bandsP(spn, OFF0, 15, YM, 4.3, 0.45, 0.06); bandsP(spn, OFF, YM, YB0, 4.3, 0.45, 0.06);
  finRing(fin, finD, OFF0, 15, YM, 1.5, 0.26, 0.55, 4, 0.45, 1.05); finRing(fin, finD, OFF, YM + 0.6, YB0, 1.5, 0.26, 0.55, 4, 0.45, 1.05);
  for (const Fa of facesP(OFF0)) if (Fa.L > 1){ fbx(stone, Fa, 0, Fa.L, 15, 16.2, 0, 1.45); fbx(finD, Fa, 0, Fa.L, YM - 0.5, YM + 0.2, 0, 1.2); }
  // the corner sky gardens on the ledges where the notches step in: lawn, shrubs, small trees, a glass balustrade
  flatP(B.p(LAWN), OFF0, YM + 0.25);
  for (const [su, sv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]){ const cu = su*(U - N - (N2 - N)/2), cv = sv*(V - N - (N2 - N)/2);
    for (const [pu, pv] of [[cu, cv], [cu, sv*(V - 1.4)], [su*(U - 1.4), cv]]){ const p = T(pu, 0, pv); treeP(B, p[0], YM + 0.25, p[2], 0.5, '#4f7f3a', '#5d4a3a'); } }
  LPolyD(g, offP(OFF, 0.5), YB0, YB1 - YB0, LOU);
  for (let y = YB0 + 0.4; y < YB1 - 0.3; y += 0.7) bandAt(lou, OFF, y, 0.22, 0.25);
  for (const Fa of facesP(OFF)) if (Fa.L > 1){ fbx(finD, Fa, 0, Fa.L, YB0 - 0.4, YB0 + 0.3, 0, 1.45); fbx(finD, Fa, 0, Fa.L, YB1 - 0.2, YB1 + 0.5, 0, 1.45); }
  // the residents' terrace on the south half of the setback: lawn, trees, a lap pool, a glass balustrade behind the fin screen
  flatP(B.p(LAWN), offP(STH, 1.2), YB1 + 0.55);
  { const lp = rectL(T, -22, 6, 10, 15.5); flatP(B.p(POOL), lp, YB1 + 0.75); prismP(B.p(FIN), offP(lp, -1), YB1 + 0.5, YB1 + 0.7, false);
    treesIn(B, offP(STH, 2.5), 20, YB1 + 0.5, 0.75, rng, (x, z) => inPoly(offP(lp, -2), x, z) || dPoly(RES, x, z) < 2.5); }
  const southFace = Fa => fmid(Fa, T)[1] < VT + 0.3;
  { const o = B.p(GOP); for (const Fa of facesP(STH)){ if (southFace(Fa)) continue; fbx(o, Fa, 0, Fa.L, YB1 + 0.5, YB1 + 1.8, -0.9, -0.8); } }
  finRing(fin, finD, notched(-U, U, VT + 0.1, V, N2), YB1, YB1 + 3.5, 1.5, 0.26, 0.55, 4, 0.45, 1.05, southFace);
  // Wallich Residence: the north half to the roof
  LPolyD(g, RES, YB1, YR - YB1, GLR);
  bandsP(spn, RES, YB1, YR, 3.6, 0.4, 0.06);
  finRing(fin, finD, RES, YB1, YR, 1.5, 0.26, 0.55, 4, 0.45, 1.05);
  // ---------------- the crown: three tiers of fin screen (lit), plant behind ----------------
  flatP(lou, offP(RES, 0.3), YR + 0.1);
  prismP(lou, rectL(T, -24, 24, -21.5, -5.5), YR, YR + 5.2);
  const tiers = [[U, YR + 3.6], [19.5, YR + 6.9], [9.5, YR + 10]];
  for (let k = 0; k < tiers.length; k++){ const [uh, yt] = tiers[k], y0 = k ? tiers[k-1][1] : YR, P = k ? rectL(T, -uh, uh, -V, VT) : RES;
    finRing(crn, crn, P, y0, yt, 1.5, 0.26, 0.55, 4, 0.45, 1.05, k ? (Fa => { const m = fmid(Fa, T); return Math.abs(Math.abs(m[0]) - uh) > 0.5; }) : null);
    // cross screens closing the higher tiers at u = +-uh
    if (k) for (const s of [-1, 1]){ const Fa = fcL(T, s*uh, s > 0 ? VT : -V, s*uh, s > 0 ? -V : VT); const n = Math.round(Fa.L/1.5);
      for (let i = 0; i <= n; i++){ const u = Fa.L*i/n; fbx(crn, Fa, u - 0.14, u + 0.14, y0 - 0.2, yt, -0.35, 0.35); } }
    for (const Fa of facesP(P)) if (Fa.L > 0.5) fbx(crn, Fa, 0, Fa.L, yt - 0.35, yt, 0, 1.0); }
  { const p = T(0, 0, (-V + VT)/2); segP(lou, [p[0], YR + 5.2, p[2]], [p[0], YR + 10.4, p[2]], 0.12, 5); LSphD(g, 0.5, p[0], YR + 10.9, p[2], RED, 1, 6); }
  // ---------------- the City Room canopy on the park side (east) ----------------
  bxF(B.p(TIMB), T, U, U + 6.2, 15.2, 15.9, -21, 21, true);
  bxF(B.p(GOP), T, U + 6.2, U + 7.4, 15.4, 15.8, -21, 21, true);
  for (let v = -18; v <= 18.1; v += 6){ const p = T(U + 6.0, 0, v); segP(B.p(FIN), [p[0], 0, p[2]], [p[0], 15.3, p[2]], 0.35, 8); }
  B.flush(g);
  return g; }};

// ===== CapitaSpring (BIG + Carlo Ratti Associati with RSP, 2021): 280 m, 51 storeys on the old Golden Shoe car park site. The tower
// follows the irregular site (OSM: a five-sided plan) above the eight-storey podium (Market Street hawker centre on levels 2-3,
// car park above), all of it wrapped in one veil of slender vertical aluminium fins (~1.1 m apart, pale champagne) in front
// of dark glass. The veil lifts into arches over the 18 m City Room on Market Street and peels open like a curtain round
// the four-storey, 35 m tall Green Oasis (~92-126 m): the fins bow out and part, revealing the planted terraces and the
// spiralling promenade round the core; at the top the fins run on as a screen round the Sky Garden (urban farm, trees,
// pavilion). At night lit windows, the oasis glowing green-gold, a warm crown.
LANDMARKS.capitaspring = {zh:'凯德·春', en:'CapitaSpring', cat:'new', r:57, h:280, lt:{m:1, c:'#ffe9cc', k:0.6}, build(){
  const g = new THREE.Group(), B = mkB(), F = FD.capitaspring, r = LMCTX.rng;
  const TW = F.TW, POD = F.POD, O0 = 92, O1 = 127, TOPY = 270, H = 280, PH = 27;
  const gl = {c:'#435763', m:1, fh:4.2, cw:2.2}, finC = {c:'#dcd2c3', m:0, lc:'#ffdcb0', lk:0.35}, Fn = B.p(finC), sl = '#d3cfc6';
  const lit = {c:'#3e4c54', glow:'#ffe0b0', gk:0.75}, GR1 = {c:'#4f8a37', glow:'#2d6a1c', gk:0.45}, GR2 = {c:'#6b9f45', glow:'#4a7d26', gk:0.35}, TRK = '#5d4a3a';
  const gr1 = B.p(GR1), gr2 = B.p(GR2), sla = B.p(sl), litP = B.p(lit), tc = cenP(TW);
  LPolyD(g, POD, -4, 4.2, '#c9c3b5');
  // podium body (hawker centre, car park) and the tower body, set back behind the veil; dark glass, slab lines
  const P1 = offP(POD, 0.9), T1 = offP(TW, 0.9);
  LPolyD(g, P1, 0, 6, lit); LPolyD(g, P1, 6, PH - 6, gl); flatP(B.p(GR2), offP(POD, 1.2), PH + 0.05);
  LPolyD(g, T1, PH, O0 - PH, gl); LPolyD(g, T1, O1, TOPY - O1, gl);
  bandsP(sla, T1, PH, O0, 4.2, 0.35, 0.05); bandsP(sla, T1, O1, TOPY, 4.2, 0.35, 0.05); bandsP(sla, P1, 6, PH, 4.6, 0.4, 0.05);
  // ---- the Green Oasis: thick slabs, the lit core, four planted terraces stepping round a spiral promenade, trees
  LPolyD(g, offP(TW, 0.5), O0 - 1.4, 1.4, sl); LPolyD(g, offP(TW, 0.5), O1 - 1.2, 1.2, sl);
  LPolyD(g, scaleP(TW, 0.34, tc), O0, O1 - O0, lit);
  for (let k = 0; k < 4; k++){ const y = O0 + k*8.6, Pk = scaleP(TW, 0.86 - k*0.04, tc);
    LPolyD(g, Pk, y - 0.6, 0.6, sl); flatP(gr2, Pk, y + 0.02);
    // planting along the edge of each terrace and hanging greenery under it
    for (const Fa of facesP(Pk)) if (Fa.L > 2){ fbx(gr1, Fa, 0.4, Fa.L - 0.4, y, y + 1.1, -1.6, 0.3); fbx(gr2, Fa, 0.5, Fa.L - 0.5, y - 2.4, y - 0.6, -0.2, 0.25); }
    for (let t = 0; t < 26; t++){ const s = 0.5 + 0.38*r(), j = Math.floor(r()*Pk.length), p = Pk[j], q = Pk[(j+1) % Pk.length], u = r(), x = tc[0] + (lerp(p[0], q[0], u) - tc[0])*s/(0.86 - k*0.04), z = tc[1] + (lerp(p[1], q[1], u) - tc[1])*s/(0.86 - k*0.04);
      if (inPoly(scaleP(TW, 0.4, tc), x, z)) continue; treeP(B, x, y, z, 0.7 + 0.5*r(), t % 3 ? GR1 : GR2, TRK); } }
  { const P = []; for (let k = 0; k <= 64; k++){ const t = k/64, a = t*TAU*2.2, rr = 0.52, i = Math.floor(((a/TAU) % 1)*TW.length), p = TW[i], q = TW[(i+1) % TW.length], u = ((a/TAU)*TW.length) % 1;
      P.push([tc[0] + (lerp(p[0], q[0], u) - tc[0])*rr, O0 + 0.6 + t*(O1 - O0 - 4), tc[1] + (lerp(p[1], q[1], u) - tc[1])*rr]); }
    polyP(B.p(lit), P, 0.9, 4); }
  // ---- the veil: fins ~1.1 m apart round tower and podium; they bow out and part round the oasis and lift into arches over the City Room
  const bO = y => sm((y - (O0 - 14))/14)*(1 - sm((y - O1)/14));
  const edgeFins = (P, y0, y1, oasis, cityRoom, skip) => {
    for (let i = 0; i < P.length; i++){
      const a = P[i], b = P[(i+1) % P.length], L = Math.hypot(b[0]-a[0], b[1]-a[1]); if (L < 3 || (skip && skip(a, b))) continue;
      const ux = (b[0]-a[0])/L, uz = (b[1]-a[1])/L, [nx, nz] = outN(P, i), n = Math.round(L/0.95), wo = Math.min(13, L*0.3), city = cityRoom && nx > 0.8;
      for (let k = 0; k <= n; k++){
        const u = -L/2 + L*k/n, side = Math.sign(u) || 1, dist = Math.abs(u), Ds = L/2, uo = side*(wo + dist*(Ds - wo)/Ds);
        const yb = city ? y0 + 7 + 11*Math.pow(Math.max(0, 1 - dist/(L*0.42)), 0.6) : y0;
        const pts = []; let y = yb;
        while (true){ const t = oasis ? bO(y) : 0, uu = lerp(u, uo, t), out = 0.6 + t*(1.6 + 2.6*Math.max(0, 1 - Math.abs(uu)/(wo + 8)));
          pts.push([(a[0] + b[0])/2 + ux*uu + nx*out, y, (a[1] + b[1])/2 + uz*uu + nz*out]);
          if (y >= y1 - 0.01) break; const step = (oasis && y > O0 - 16 && y < O1 + 16) ? 2.5 : y < yb + 24 ? 4 : 30; y = Math.min(y1, y + step); }
        for (let j = 0; j < pts.length - 1; j++){ const p = pts[j], q = pts[j+1], w = 0.14, d = 0.55;
          Q(Fn, [p[0] - ux*w, p[1], p[2] - uz*w], [p[0] + ux*w, p[1], p[2] + uz*w], [q[0] + ux*w, q[1], q[2] + uz*w], [q[0] - ux*w, q[1], q[2] - uz*w]);
          Q(Fn, [p[0] + nx*d, p[1], p[2] + nz*d], [p[0] - nx*d, p[1], p[2] - nz*d], [q[0] - nx*d, q[1], q[2] - nz*d], [q[0] + nx*d, q[1], q[2] + nz*d]); }
      }
    }
  };
  edgeFins(TW, 0, H, true, true);
  edgeFins(POD, 0, PH + 1.2, false, false, (a, b) => dPoly(TW, (a[0] + b[0])/2, (a[1] + b[1])/2) < 2.5);
  // the City Room behind the arches: a tall lit glass wall, its soffit
  { let bi = 0, bx = -1; for (let i = 0; i < TW.length; i++){ const [nx] = outN(TW, i); if (nx > bx){ bx = nx; bi = i; } }
    const a = TW[bi], b = TW[(bi+1) % TW.length], [nx, nz] = outN(TW, bi);
    Q(B.p({c:'#62808d', glow:'#ffe6c0', gk:0.85}), [a[0] - nx*1.5, 0.3, a[1] - nz*1.5], [b[0] - nx*1.5, 0.3, b[1] - nz*1.5], [b[0] - nx*1.5, 18, b[1] - nz*1.5], [a[0] - nx*1.5, 18, a[1] - nz*1.5]); }
  // ---- top: the Sky Garden behind the fin screen: urban farm beds, trees, the glass pavilion, a lit cornice, warning light
  LPolyD(g, T1, TOPY, 1, sl); flatP(gr2, offP(TW, 2), TOPY + 1.05);
  for (let k = 0; k < 10; k++) boxP(gr1, 7, 0.6, 1.5, tc[0] - 14 + (k % 5)*6.2, TOPY + 1.0, tc[1] + 10 + Math.floor(k/5)*3.2, 0);
  treesIn(B, offP(TW, 5), 18, TOPY + 1.0, 0.95, r, (x, z) => Math.abs(x - tc[0] + 6) < 12 && Math.abs(z - tc[1] + 10) < 7, GR1);
  LBoxD(g, 18, 5, 10, tc[0] - 6, TOPY + 1, tc[1] - 10, lit); boxP(sla, 21, 0.5, 13, tc[0] - 6, TOPY + 6, tc[1] - 10, 0);
  for (const Fa of facesP(TW)) if (Fa.L > 2) fbx(B.p({c:'#efe6d6', glow:'#ffe2b8', gk:0.7}), Fa, 0, Fa.L, H - 0.6, H, 0.1, 1.1);
  LSphD(g, 0.5, tc[0] + 10, H + 0.6, tc[1], {c:'#c22', glow:'#ff2a1a', gk:2}, 1, 6);
  B.flush(g);
  return g; }};

// ===== Asia Square (Denton Corker Marshall, 2011 / 2013): two square towers on one "ice block" podium between Marina View and
// Shenton Way. Each tower is a cluster of nine shafts (3 x 3 OSM parts) drawn up to different heights, so the tops step;
// carbon-black pleated glass with spandrels patched at random in greys that vary by shaft. Tower 1 (north, 43 storeys) is
// 229 m, Tower 2 (south, 46 storeys, the hotel on top: four shafts stop at the level-35 pool deck, the L of five runs on)
// 221 m - the OSM shaft heights are rescaled to those roofs. The podium is a white fritted-glass box lifted one floor above
// the street (shopfronts behind columns below), 20 m high, its roof with random skylights, planters and the two towers.
LANDMARKS.asiasquare = {zh:'亚洲广场', en:'Asia Square', cat:'new', r:112, h:229, lt:{m:1, c:'#e4ecf8', k:0.7}, build(){
  const g = new THREE.Group(), B = mkB(), F = FD.asiasquare, rng = LMCTX.rng;
  const GL = {c:'#2f3842', m:1, fh:4.2, cw:3.0}, SP = ['#505962', '#68717a', '#838c94'], PLT = '#5b636b', REV = '#1c2024';
  const CAP = '#a9b0b6', ROOF = '#50555b', PV = {c:'#27354d', lk:0.2};
  const PG = {c:'#d9e0e4', glow:'#ffefd4', gk:0.32}, WH = '#eceeee', GF = {c:'#3a454e', glow:'#ffdcae', gk:0.55}, GRN = '#5b7f45', SKY = {c:'#a6bcc8', glow:'#fff0d4', gk:0.7};
  const RED = {c:'#c22', glow:'#ff2a1a', gk:2};
  // ---------------- podium ----------------
  const PO = offP(F.SITE, 1.5), PIN = offP(PO, 3.2);
  LPolyD(g, PIN, -5, 11, GF);                                     // shopfronts and lobbies under the lifted glass box
  LPolyD(g, PO, 5.6, 0.45, WH);                                   // soffit of the overhang
  LPolyD(g, PO, 6.05, 13.95, PG);                                 // the white fritted glass box
  flatP(B.p('#9b9e9c'), offP(PO, 0.5), 20.06);                     // its roof deck
  { const o = B.p(WH); mullP(o, PO, 6.05, 20, 1.8, 0.16, 0.06); bandsP(o, PO, 6.05, 20, 4.65, 0.22, 0.07); bandsP(o, PO, 19.2, 21, 10, 0.8, 0.08);
    // columns under the overhang
    for (const Fa of facesP(PO)){ const n = Math.max(1, Math.round(Fa.L/9)); for (let k = 0; k <= n; k++) fcol(o, Fa, Fa.L*k/n, -1.6, 0, 5.7, 0.45, 8); }
    // parapet planters along the roof edge
    const gr = B.p(GRN); for (const Fa of facesP(PO)) if (Fa.L > 6){ fbx(o, Fa, 1, Fa.L - 1, 20, 20.9, -2.6, -2.3); fbx(gr, Fa, 1.2, Fa.L - 1.2, 20, 20.75, -2.3, -0.6); } }
  // skylights scattered over the podium roof (not on the towers)
  { const T1 = F.T1, T2 = F.T2, o = B.p(SKY);
    for (let k = 0, n = 0; k < 900 && n < 70; k++){ const x = lerp(-95, 95, rng()), z = lerp(-108, 108, rng());
      if (!inPoly(PO, x, z) || dPoly(PO, x, z) < 6 || dPoly(T1, x, z) < 4 || dPoly(T2, x, z) < 4 || inPoly(T1, x, z) || inPoly(T2, x, z)) continue;
      boxP(o, 3 + rng()*4, 0.5, 2.2 + rng()*2, x, 20, z, 0.56 + (rng() < 0.5 ? 0 : HP)); n++; } }
  // ---------------- the two towers: 3 x 3 shafts each ----------------
  const tower = (R, scale, fill, lo) => {
    const [A, Bq, C, Dq] = R, P = (s, t) => [(1-s)*(1-t)*A[0] + s*(1-t)*Bq[0] + s*t*C[0] + (1-s)*t*Dq[0], (1-s)*(1-t)*A[1] + s*(1-t)*Bq[1] + s*t*C[1] + (1-s)*t*Dq[1]];
    const ux = Bq[0] - A[0], uz = Bq[1] - A[1], vx = Dq[0] - A[0], vz = Dq[1] - A[1], L2u = ux*ux + uz*uz, L2v = vx*vx + vz*vz;
    const H = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (const [b, t, ring] of F.parts){ const c = cenP(ring), s = ((c[0] - A[0])*ux + (c[1] - A[1])*uz)/L2u, tt = ((c[0] - A[0])*vx + (c[1] - A[1])*vz)/L2v;
      if (s > 0 && s < 1 && tt > 0 && tt < 1) H[Math.floor(s*3)][Math.floor(tt*3)] = 20 + (t - 20)*scale; }
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (!H[i][j]) H[i][j] = 20 + (fill - 20)*scale;
    if (lo) lo(H);
    const cell = (i, j) => [P(i/3, j/3), P((i+1)/3, j/3), P((i+1)/3, (j+1)/3), P(i/3, (j+1)/3)];
    const hN = (i, j) => (i < 0 || j < 0 || i > 2 || j > 2) ? 20 : H[i][j];
    let top = [0, 0, 0];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++){
      const Pc = cell(i, j), Ht = H[i][j], sh = (i*3 + j*7) % 3;
      if (Ht > top[0]) top = [Ht, ...cenP(Pc)];
      LPolyD(g, Pc, 19.5, Ht - 19.5, GL);
      // edges: 0 (t = j/3 side, neighbour j-1), 1 (s side, i+1), 2 (j+1), 3 (i-1)
      const nb = [[i, j - 1], [i + 1, j], [i, j + 1], [i - 1, j]];
      for (let e = 0; e < 4; e++){
        const y0 = hN(...nb[e]); if (Ht <= y0 + 0.5) continue;
        const a = Pc[e], b = Pc[(e + 1) % 4], Fa = fc(b[0], b[1], a[0], a[1]);     // outside to the right (cells run counter to fc)
        const Fo = (Fa.nx*((a[0] + b[0])/2 - cenP(Pc)[0]) + Fa.nz*((a[1] + b[1])/2 - cenP(Pc)[1]) < 0) ? fc(a[0], a[1], b[0], b[1]) : Fa;
        // spandrels in grey patches (shade per bay, biased per shaft), pleat mullions, the coping
        const nb2 = Math.max(1, Math.round(Fo.L/3.0)), bw = Fo.L/nb2;
        for (let y = y0 + 4.2; y < Ht - 2; y += 4.2) for (let k = 0; k < nb2; k++){ const r = rng(), s2 = r < 0.55 ? sh : r < 0.8 ? (sh + 1) % 3 : (sh + 2) % 3;
          frect(B.p(SP[s2]), Fo, k*bw, (k + 1)*bw, y - 1.25, y, 0.08); }
        for (let k = 0; k <= nb2*2; k++){ const u = k*bw/2; if (k % 2) frect(B.p(PLT), Fo, u - 0.09, u + 0.09, y0, Ht - 1.2, 0.13); else fbx(B.p(PLT), Fo, u - 0.11, u + 0.11, y0, Ht - 1.2, 0, 0.55); }
        fbx(B.p(CAP), Fo, -0.15, Fo.L + 0.15, Ht - 1.3, Ht + 0.35, -0.1, 0.18);
        if (y0 <= 20.5) fbx(B.p(REV), Fo, -0.45, 0.45, 20, Ht - 1.3, -0.05, 0.16);          // the reveal between shafts
      }
      flatP(B.p(ROOF), offP(Pc, 0.3), Ht + 0.2);
      // photovoltaic rows on the roofs
      const c = cenP(Pc), ang = Math.atan2(Bq[1] - A[1], Bq[0] - A[0]);
      for (let r = -2; r <= 2; r++){ const q = [c[0] - Math.sin(ang)*r*3.2, c[1] + Math.cos(ang)*r*3.2]; boxP(B.p(PV), 15, 0.5, 1.6, q[0], Ht + 0.25, q[1], -ang); }
    }
    LSphD(g, 0.5, top[1], top[0] + 2.2, top[2], RED, 1, 6); LCylD(g, 0.12, 0.12, 2, top[1], top[0] + 0.3, top[2], CAP, 5);
  };
  tower(F.T1, 209/201, 200, null);
  tower(F.T2, 201/208, 173, null);
  B.flush(g);
  return g; }};


// ===== The Sail @ Marina Bay (NBBJ with Peter Pran, 2008): two slender residential glass towers rising from a sculpted
// podium like wind-blown sails - Marina Bay Tower (70 storeys, 245 m, plan a curved wedge from its straight "mast" end at
// Raffles Quay to a sharp tip at Marina Boulevard) and Central Park Tower (63 storeys, 215 m, mast end to the north, tip to the
// south), the two curved faces open to the bay and the straight faces forming the canyon. Blue-green glass with white slab
// edges every floor and fins on the curved faces; each roof slopes down from the mast to the tip like the head of a sail,
// the curved glass running on above it as a screen with a lit edge. The six-storey podium (car park behind green walls,
// clubhouse deck with pools and tennis courts) sits between them. Plans are the real OSM footprints.
LANDMARKS.thesail = {zh:'滨海湾帆船大厦', en:'The Sail @ Marina Bay', cat:'new', r:70, h:245, lt:{m:1, c:'#dcecff', k:0.6}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.thesail, rng = LMCTX.rng;
  const GL = {c:'#6a90aa', m:1, fh:3.3, cw:2.4}, WH = '#e9eef0', FIN = WH, GF = {c:'#3d4a52', glow:'#ffdcae', gk:0.5}, SCR = {c:'#a7c4d3', glow:'#8fc8ff', gk:0.32}, LED = {c:'#e8f4ff', glow:'#a8dcff', gk:1.2};
  const CON = '#cfcabf', CP = '#45494c', GRN = '#557a43', DECK = '#b8b3a6', POOL = {c:'#4aa3c8', glow:'#3fb4ff', gk:0.35}, CRT = GRN, ROOF = '#6f757a';
  const mid = (p, q) => [(p[0] + q[0])/2, (p[1] + q[1])/2];
  const tower = (P, mast, tip, Hm, Ht, curve, scrH) => {
    const ax = [tip[0] - mast[0], tip[1] - mast[1]], L2 = ax[0]*ax[0] + ax[1]*ax[1];
    const sOf = (x, z) => cl01(((x - mast[0])*ax[0] + (z - mast[1])*ax[1])/L2), roof = (x, z) => Hm - (Hm - Ht)*Math.pow(sOf(x, z), 1.35);
    const gl = B.p(GL); prismP(gl, P, -5, roof, true); triPoly(B.p(ROOF), offP(P, 0.6), (x, z) => roof(x, z) + 0.15);
    wallP(B.p(WH), offP(P, 0.4), roof, (x, z) => roof(x, z) + 1.0);                    // parapet
    // slab edges every 3.5 m (stopping under the sloping roof), fins on the curved face, mullions elsewhere
    const wh = B.p(WH);
    for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], [nx, nz] = outN(P, i), ym = Math.min(roof(...a), roof(...b)) - 0.6;
      if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 0.4) continue;
      for (let y = 3.5; y < ym; y += 3.5) Q(wh, [a[0]+nx*0.1, y, a[1]+nz*0.1], [b[0]+nx*0.1, y, b[1]+nz*0.1], [b[0]+nx*0.1, y+0.5, b[1]+nz*0.1], [a[0]+nx*0.1, y+0.5, a[1]+nz*0.1]); }
    const onCurve = i => curve.includes(i) && curve.includes((i + 1) % P.length);
    const C = curve.map(i => P[i]), top = (x, z) => roof(x, z) + scrH*(1 - 0.62*sOf(x, z));
    // deep white fins up the curved (sail) face, running on past the roof into the sail head; mullions on the straight faces
    { const fo = B.p(FIN), Fs = facesP(P);
      for (let i = 0; i < P.length; i++){ if (!onCurve(i)) continue; const Fa = Fs[i], n = Math.max(1, Math.round(Fa.L/2.4));
        for (let k = 0; k <= n; k++){ const u = Fa.L*k/n, q = fp(Fa, u, 0, 0); fbx(fo, Fa, u - 0.17, u + 0.17, 0.5, top(q[0], q[2]) - 0.25, 0, 0.8); } } }
    mullP(B.p(FIN), P, 0, (x, z) => roof(x, z) - 0.2, 1.6, 0.12, 0.12, i => !onCurve(i));
    // the sail head: the curved glass runs on above the roof, highest at the mast, framed in white with a lit top edge
    const sc = B.p(SCR), led = B.p(LED);
    for (let k = 0; k < C.length - 1; k++){ const a = C[k], b = C[k+1]; Q(sc, [a[0], roof(...a) - 0.5, a[1]], [b[0], roof(...b) - 0.5, b[1]], [b[0], top(...b), b[1]], [a[0], top(...a), a[1]]);
      segP(wh, [a[0], top(...a) - 0.35, a[1]], [b[0], top(...b) - 0.35, b[1]], 0.38, 4); segP(led, [a[0], top(...a) + 0.1, a[1]], [b[0], top(...b) + 0.1, b[1]], 0.16, 4); }
    // the white rib up the tip of the sail
    { const b = C[C.length - 1]; segP(wh, [b[0], 0, b[1]], [b[0], top(...b), b[1]], 0.4, 6); }
    // the mast edge: a white vertical rib up the straight end, crowned by the highest point
    { const a = C[0]; segP(B.p(WH), [a[0], 0, a[1]], [a[0], top(...a) + 1.2, a[1]], 0.45, 6); LSphD(g, 0.45, a[0], top(...a) + 1.8, a[1], {c:'#c22', glow:'#ff2a1a', gk:2}, 1, 6); }
    // ground floor glazing and canopy
    bandAt(B.p(GF), P, 0, 3.4, 0.15);
  };
  const M = D.MBT, Cp = D.CPT;
  tower(M, mid(M[14], M[16]), M[5], 230, 207, [16, 0, 1, 2, 3, 4, 5], 15);
  tower(Cp, mid(Cp[10], Cp[0]), mid(Cp[2], Cp[4]), 202, 181, [10, 0, 1, 2], 13);
  // ---------------- the podium ----------------
  const P = D.POD, H = 24.5;
  LPolyD(g, P, -5, H + 5, CON); flatP(B.p(DECK), offP(P, 0.4), H + 0.05);
  for (let y = 4.5; y < H - 2; y += 3.4) bandAt(B.p(CP), P, y, 1.5, 0.06);
  bandAt(B.p(GF), P, 0, 4.0, 0.08); bandAt(B.p(WH), P, H - 1.2, 1.4, 0.15);
  // green walls on the long faces
  { const gr = B.p(GRN); const Fs = facesP(P); for (const Fa of Fs) if (Fa.L > 12) for (let u = 2; u < Fa.L - 6; u += 9) if (rng() < 0.7) frect(gr, Fa, u, u + 6, 5.5, H - 2, 0.12); }
  // the clubhouse deck: pools, a tennis court, trees and palms, sun shelters
  { const c = cenP(P); const pool = rectP(26, 7, c[0] - 8, c[1] + 6, -0.95); flatP(B.p(POOL), pool, H + 0.12);
    prismP(B.p(WH), offP(pool, -0.6), H, H + 0.1, true);
    // the tennis court: the first spot (searching out from the deck centre) where it sits clear of the edge, pool and towers
    let cc = [c[0] - 26, c[1] + 16];
    for (let k = 0; k < 400; k++){ const t = k*0.7, q = [c[0] - 14 + Math.cos(t)*k*0.12, c[1] + 8 + Math.sin(t)*k*0.12], R = rectP(30, 17, q[0], q[1], -0.95);
      if (R.every(p => inPoly(P, p[0], p[1]) && !inPoly(M, p[0], p[1]) && !inPoly(Cp, p[0], p[1]) ) && Math.hypot(q[0] - cenP(pool)[0], q[1] - cenP(pool)[1]) > 23){ cc = q; break; } }
    const crt = rectP(24, 11, cc[0], cc[1], -0.95); flatP(B.p(CRT), crt, H + 0.1);
    for (const q of [rectP(23, 0.15, cc[0], cc[1], -0.95), rectP(0.15, 10, cc[0], cc[1], -0.95)]) flatP(B.p(WH), q, H + 0.14);
    for (let k = 0, n = 0; k < 400 && n < 26; k++){ const x = lerp(-60, 30, rng()), z = lerp(-40, 70, rng());
      if (!inPoly(P, x, z) || dPoly(P, x, z) < 2.5 || inPoly(offP(pool, -2), x, z) || inPoly(offP(crt, -2), x, z) || inPoly(M, x, z) || inPoly(Cp, x, z) || dPoly(M, x, z) < 2 || dPoly(Cp, x, z) < 2) continue;
      if (rng() < 0.5) palmP(B, x, H, z, 0.75, rng); else treeP(B, x, H, z, 0.7); n++; }
    bxF(B.p(WH), frame(c[0] + 6, c[1] - 6, -0.95), -6, 6, H, H + 4.2, -3, 3); }
  // forecourt and drop-off paving round the towers
  { const all = [...M, ...Cp, ...P]; let hull = []; { const pts = all.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0]), lo = [], up = [];
      for (const p of pts){ while (lo.length >= 2 && cr(lo[lo.length-2], lo[lo.length-1], p) <= 0) lo.pop(); lo.push(p); }
      for (let i = pts.length - 1; i >= 0; i--){ const p = pts[i]; while (up.length >= 2 && cr(up[up.length-2], up[up.length-1], p) <= 0) up.pop(); up.push(p); } up.pop(); lo.pop(); hull = lo.concat(up); }
    LPolyD(g, hull, -1.5, 1.55, DECK);
    for (let k = 0, n = 0; k < 300 && n < 9; k++){ const x = lerp(-40, 60, rng()), z = lerp(-70, 40, rng());
      if (!inPoly(offP(hull, 3), x, z) || inPoly(offP(P, -2), x, z) || inPoly(offP(M, -3), x, z) || inPoly(offP(Cp, -3), x, z)) continue; treeP(B, x, 0, z, 0.8); n++; } }
  B.flush(g);
  return g; }};


// ===== Lau Pa Sat (Telok Ayer Market, James MacRitchie 1894; cast iron by Walter MacFarlane, Glasgow): the octagonal Victorian
// market hall (~74 m across) - white cast-iron colonnade with arched filigree screens, a ring of pitched roofs, eight radial
// passageways under raised gabled roofs ending in eight gabled entrances, the windowed central lantern and the slender clock
// tower (four clock faces, filigree pavilion, wind vane). On Boon Tat Street beside it the evening satay street: smoking
// stalls under red awnings and rows of tables on the closed road. Octagon fitted to the OSM outline.
LANDMARKS.lauPaSat = {zh:'老巴刹', en:'Lau Pa Sat', cat:'old', r:71, h:34, lt:{m:0, c:'#ffd9a0', k:1.0, e:0.62, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB(), F = FD.lauPaSat, r = LMCTX.rng;
  const [a0, R] = F.oct, AP = R*Math.cos(PI/8);
  const iron = '#f1efe8', roof = '#8f6a5f', roof2 = '#7f5d54', dark = {c:'#3e3b37', glow:'#ffc77a', gk:0.75}, stone = '#cfc8b9';
  const V = (rad, k) => [Math.cos(a0 + k*PI/4)*rad, Math.sin(a0 + k*PI/4)*rad];          // octagon vertex k at circumradius rad
  const M = (ap, k) => { const a = a0 + (k + 0.5)*PI/4; return [Math.cos(a)*ap, Math.sin(a)*ap]; };   // side midpoint at apothem ap
  const oct = rad => [0, 1, 2, 3, 4, 5, 6, 7].map(k => V(rad, k));
  // plinth and floor
  LPolyD(g, oct(R + 1.2), -3, 3.4, stone);
  // interior: the lit market (dark walls glowing at night) behind the colonnade
  LPolyD(g, oct(R - 4.2), 0.4, 6.6, dark);
  // ---- outer colonnade: cast-iron columns with capitals, arched filigree spandrels, a cornice and the eaves
  const col = B.p(iron), lace = col, lamp = {c:'#fbf8ee', glow:'#fff2d0', gk:1.2}, glz = {c:'#5a5650', glow:'#ffd08a', gk:0.7}, grill = '#3b3836';
  for (let k = 0; k < 8; k++){
    const p = V(R - 0.6, k), q = V(R - 0.6, k + 1), L = Math.hypot(q[0]-p[0], q[1]-p[1]), n = 8;
    for (let i = 0; i <= n; i++){ const t = i/n, x = lerp(p[0], q[0], t), z = lerp(p[1], q[1], t);
      segP(col, [x, 0.4, z], [x, 6.4, z], 0.17, 6); boxP(col, 0.7, 0.3, 0.7, x, 6.2, z, -(a0 + (k + 0.5)*PI/4)); boxP(col, 0.6, 0.4, 0.6, x, 0.4, z, -(a0 + (k + 0.5)*PI/4)); }
    // arches between the columns
    for (let i = 0; i < n; i++){ const pts = []; for (let j = 0; j <= 8; j++){ const t = (i + j/8)/n, x = lerp(p[0], q[0], t), z = lerp(p[1], q[1], t); pts.push([x, 4.9 + Math.sin(PI*j/8)*1.1, z]); } polyP(lace, pts, 0.09, 4); }
    // the spandrel band (filigree) and the cornice
    const nx = Math.cos(a0 + (k + 0.5)*PI/4), nz = Math.sin(a0 + (k + 0.5)*PI/4);
    quadP(lace, [p[0] + nx*0.15, 6.0, p[1] + nz*0.15], [q[0] + nx*0.15, 6.0, q[1] + nz*0.15], [q[0] + nx*0.15, 6.8, q[1] + nz*0.15], [p[0] + nx*0.15, 6.8, p[1] + nz*0.15]);
    boxP(col, L + 1.2, 0.45, 1.0, (p[0] + q[0])/2 + nx*0.2, 6.8, (p[1] + q[1])/2 + nz*0.2, -(a0 + (k + 0.5)*PI/4) + HP);
  }
  // ---- ring roof over the eight sectors: pitched from the eaves (7.2 m) up to the clerestory (11.5 m)
  const ringRoof = (Ro, Ri, y0, y1, c) => { const o = B.p(c); for (let k = 0; k < 8; k++){ const A = V(Ro, k), Bq = V(Ro, k + 1), C = V(Ri, k + 1), D = V(Ri, k); quadP(o, [A[0], y0, A[1]], [Bq[0], y0, Bq[1]], [C[0], y1, C[1]], [D[0], y1, D[1]]); } };
  ringRoof(R + 1.4, R*0.62, 7.2, 9.9, roof);
  // the louvred clerestory ring between the two roof rings (it glows with the market's lights at night), the upper ring
  { const Cq = oct(R*0.62); LPolyD(g, Cq, 9.5, 2.0, dark); for (let y = 9.75; y < 11.4; y += 0.4) bandAt(col, Cq, y, 0.13, 0.06); mullP(col, Cq, 9.5, 11.5, 2.2, 0.16, 0.08);
    for (let k = 0; k < 8; k++){ const p = V(R*0.62, k); segP(col, [p[0], 9.5, p[1]], [p[0], 11.5, p[1]], 0.16, 5); } }
  ringRoof(R*0.62 + 1.0, R*0.36, 11.4, 12.7, roof);
  // ---- eight radial passageways under raised gabled roofs, each ending in a gabled entrance on the facade
  for (let k = 0; k < 8; k++){
    const ang = a0 + (k + 0.5)*PI/4, ry = -ang, L = AP - 7.5, cx = Math.cos(ang)*(7.5 + L/2 + 0.6), cz = Math.sin(ang)*(7.5 + L/2 + 0.6);
    // walls of the raised nave (clerestory with lit windows) and its gable roof
    LBoxD(g, L, 4.2, 8.4, cx, 7.4, cz, iron, ry);
    bandsP(B.p(glz), rectP(L, 8.4, cx, cz, ry), 8.0, 11.0, 1.2, 1.6, 0.05);
    gable(g, cx, cz, L + 1.2, 10.4, 11.6, 3.6, roof2, ry);
    // the entrance gable on the facade: a pediment with fretwork, an arched portal
    const ex = Math.cos(ang)*(AP + 0.9), ez = Math.sin(ang)*(AP + 0.9), ER = rotP(ex, ez, ry);
    // an open cast-iron portal: two piers with paired columns, the arch with filigree spandrels and roundels, the frieze
    for (const s of [-1, 1]){ boxP(col, 2.2, 9.6, 1.7, ...(() => { const q = ER(0, 0, s*4.75); return [q[0], 0, q[2]]; })(), ry);
      for (const t of [-0.55, 0.55]){ const q = ER(1.25, 0, s*(4.3 + t*0.0) + t*0.5); segP(col, [q[0], 0.4, q[2]], [q[0], 9.4, q[2]], 0.2, 6); } }
    { const q = ER(0, 0, 0); boxP(col, 2.2, 1.8, 11.2, q[0], 7.8, q[2], ry); }
    LShapeD(g, [[-3.9, 7.8], [-3.9, 5.2], ...Array.from({length:13}, (_, j) => [-3.9*Math.cos(PI*j/12), 5.2 + 2.1*Math.sin(PI*j/12)]), [3.9, 5.2], [3.9, 7.8]], 0.35, ...(() => { const q = ER(0.6, 0, 0); return [q[0], 0, q[2]]; })(), iron, ry + HP);
    { const P = []; for (let j = 0; j <= 12; j++){ const q = ER(1.0, 5.2 + 1.85*Math.sin(PI*j/12), -3.65*Math.cos(PI*j/12)); P.push(q); } polyP(B.p(grill), P, 0.08, 4);
      for (const s of [-1, 1]){ const R = []; for (let j = 0; j < 10; j++){ const t = j/10*TAU; R.push(ER(1.0, 7.0 + Math.sin(t)*0.42, s*3.0 + Math.cos(t)*0.42)); } polyP(B.p(grill), R, 0.06, 3, true); } }
    // the lattice in the pediment
    for (let j = -4; j <= 4; j++){ const zb = j*1.1, ht = 3.6*(1 - Math.abs(zb)/5.4); if (ht < 0.4) continue; const q0 = ER(1.2, 9.9, zb), q1 = ER(1.2, 9.7 + ht, zb); segP(B.p(grill), q0, q1, 0.05, 3); }
    LShapeD(g, [[-5.6, 9.6], [5.6, 9.6], [0, 13.6]], 2.3, ex, 0, ez, iron, ry + HP);
    const fp = ER(1.3, 0, 0); LCylD(g, 0.9, 0.9, 0.25, fp[0], 10.6, fp[2], lamp, 16);   // roundel in the pediment
    gable(g, ex, ez, 2.6, 12.0, 9.6, 4.0, roof2, ry);
  }
  // ---- central lantern (windowed drum) and its roof
  const C1 = oct(10.2);
  LPolyD(g, C1, 9, 6.5, iron);
  bandsP(B.p(glz), C1, 10.2, 15.0, 1.6, 1.1, 0.06);
  mullP(B.p(iron), C1, 9, 15.5, 1.3, 0.25, 0.1);
  ringRoof(11.4, 4.2, 15.5, 18.2, roof);
  // ---- the clock tower: an octagonal shaft, four clock faces, a filigree pavilion with an ogee cap and the wind vane
  LPolyD(g, oct(3.5), 18, 6.8, iron);
  boxP(B.p(stone), 7.6, 0.5, 7.6, 0, 24.6, 0, -a0 - PI/8);
  for (let i = 0; i < 4; i++){ const a = a0 + PI/8 + i*HP, c = Math.cos(a), s = Math.sin(a);
    LBeamD(g, [c*3.2, 22.1, s*3.2], [c*3.55, 22.1, s*3.55], 1.25, lamp, 20);
    LBeamD(g, [c*3.1, 22.1, s*3.1], [c*3.45, 22.1, s*3.45], 1.42, grill, 20); }
  for (let k = 0; k < 8; k++){ const p = V(3.3, k); segP(col, [p[0], 25.1, p[1]], [p[0], 28.6, p[1]], 0.13, 5); }
  LPolyD(g, oct(2.4), 25.1, 3.5, lamp);
  LLathe(g, [[0, 0], [3.9, 0], [3.6, 0.5], [2.6, 1.6], [1.9, 2.6], [1.1, 3.4], [0.35, 4.2], [0.2, 5.4], [0, 5.6]], 0, 28.6, 0, roof2, 8);
  segP(col, [0, 33.5, 0], [0, 34.4, 0], 0.07, 4); boxP(col, 1.6, 0.08, 0.3, 0.4, 34.0, 0, 0.5);
  // ---- kiosks on the forecourt (Indian Grill & Bar and the one by Raffles Quay, OSM)
  LPolyD(g, F.K1, 0, 4.4, glz); prismP(B.p(roof), offP(F.K1, -0.6), 4.4, 5.2);
  LPolyD(g, F.K0, 0, 2.3, glz); prismP(B.p(roof), offP(F.K0, -0.5), 2.3, 3.0);
  // ---- the satay street on Boon Tat Street: stalls with smoking grills along the kerb, tables and stools on the road
  const s0 = [-91.5, 13.8], s1 = [6.3, 73.8], ux = (s1[0]-s0[0])/Math.hypot(s1[0]-s0[0], s1[1]-s0[1]), uz = (s1[1]-s0[1])/Math.hypot(s1[0]-s0[0], s1[1]-s0[1]), nx = uz, nz = -ux;
  const at = (t, off) => [s0[0] + (s1[0]-s0[0])*t + nx*off, s0[1] + (s1[1]-s0[1])*t + nz*off], ryS = Math.atan2(-uz, ux);
  const awn = B.p({c:'#c8352c', glow:'#ff6a3a', gk:0.55}), awn2 = B.p({c:'#e0b030', glow:'#ffcf60', gk:0.55}), cart = B.p('#cfd0cd'), smoke = B.p({c:'#e9e9e4', op:0.22});
  for (let i = 0; i < 9; i++){ const t = 0.64 + i*0.03, p = at(t, 6.2);
    boxP(cart, 2.6, 1.0, 1.6, p[0], 0, p[1], ryS); boxP(B.p(grill), 2.4, 0.15, 1.2, p[0], 1.0, p[1], ryS);
    for (const s of [-1, 1]){ const q = [p[0] + ux*s*1.3 + nx*0.7, p[1] + uz*s*1.3 + nz*0.7]; segP(cart, [q[0], 0, q[1]], [q[0], 2.6, q[1]], 0.05, 3); }
    boxP(i % 2 ? awn : awn2, 3.4, 0.25, 2.8, p[0] - nx*0.4, 2.6, p[1] - nz*0.4, ryS);
    // grill smoke: two crossed, widening wisps drifting up through the awning edge
    { const cx = p[0] - nx*0.3, cz = p[1] - nz*0.3, lean = (r() - 0.5)*0.8;
      for (const t of [0, HP]){ const a2 = ryS + t + r()*0.4, ca = Math.cos(a2), sa = -Math.sin(a2);
        Q(smoke, [cx - ca*0.5, 1.2, cz - sa*0.5], [cx + ca*0.5, 1.2, cz + sa*0.5], [cx + ca*1.3 + lean, 4.6, cz + sa*1.3], [cx - ca*1.3 + lean, 4.6, cz - sa*1.3]); } } }
  const tab = cart, stool = awn;
  for (let i = 0; i < 12; i++) for (const off of [1.6, -1.6]){ const t = 0.64 + i*0.022, p = at(t, off);
    segP(tab, [p[0], 0, p[1]], [p[0], 0.72, p[1]], 0.06, 4); LCylD(g, 0.55, 0.55, 0.05, p[0], 0.72, p[1], '#cfd0cd', 10);
    for (let k = 0; k < 4; k++){ const a = k*HP + 0.4, q = [p[0] + Math.cos(a)*0.95, p[1] + Math.sin(a)*0.95]; boxP(stool, 0.35, 0.45, 0.35, q[0], 0, q[1], a); } }
  // string lights over the street
  { const P = []; for (let i = 0; i <= 12; i++){ const t = 0.63 + i*0.022, p = at(t, 4); P.push([p[0], 4.2 - Math.sin(i*PI/3)*0.25, p[1]]); } polyP(B.p(lamp), P, 0.08, 3); }
  B.flush(g);
  return g; }};


// ===== The Fullerton Hotel: own block with the f1 helpers (their conventions differ from the ones above)
{
const lerp = (a, b, t) => a + (b - a)*t;
const clamp01 = t => t < 0 ? 0 : t > 1 ? 1 : t;
const add = (a, b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]], sub = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]], mul = (a, s) => [a[0]*s, a[1]*s, a[2]*s];
const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2], cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const vlen = a => Math.hypot(a[0], a[1], a[2]), nrm = a => { const l = vlen(a) || 1; return [a[0]/l, a[1]/l, a[2]/l]; };
const mix = (a, b, t) => [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];
// triangle batches keyed by the full colour spec: many small parts of one material become one LTris call
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const quadP = (o, a, b, c, d) => { o.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2]); };
const triP = (o, a, b, c) => { o.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); };
// n-sided prism round the segment a-b (radii r0 at a, r1 at b)
const segP = function(o, a, b, r0, n, r1){
  n = n || 4; if (r1 === undefined) r1 = r0;
  const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2], L = Math.hypot(dx, dy, dz); if (L < 1e-4) return;
  const d = [dx/L, dy/L, dz/L], up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const u = nrm(cross(d, up)), v = cross(d, u);
  const ring = (p, rr) => { const R = []; for (let i = 0; i < n; i++){ const t = (i + 0.5)/n*TAU, c = Math.cos(t)*rr, s = Math.sin(t)*rr; R.push([p[0]+u[0]*c+v[0]*s, p[1]+u[1]*c+v[1]*s, p[2]+u[2]*c+v[2]*s]); } return R; };
  const A = ring(a, r0), Bq = ring(b, Math.max(r1, 0.001));
  for (let i = 0; i < n; i++){ const j = (i+1) % n; quadP(o, A[i], A[j], Bq[j], Bq[i]); }
}
const polyP = (o, pts, r, n, closed) => { for (let i = 0; i < pts.length - 1; i++) segP(o, pts[i], pts[i+1], r, n); if (closed) segP(o, pts[pts.length-1], pts[0], r, n); };
// box (w along x, d along z) standing on y, turned ry
const boxP = function(o, w, h, d, x, y, z, ry){
  const c = Math.cos(ry || 0), s = Math.sin(ry || 0), hw = w/2, hd = d/2, y1 = y + h;
  const ax = x - hw*c - hd*s, az = z + hw*s - hd*c, bx = x + hw*c - hd*s, bz = z - hw*s - hd*c, cx = x + hw*c + hd*s, cz = z - hw*s + hd*c, dx = x - hw*c + hd*s, dz = z + hw*s + hd*c;
  o.push(ax, y, az, bx, y, bz, cx, y, cz, ax, y, az, cx, y, cz, dx, y, dz,
    ax, y1, az, dx, y1, dz, cx, y1, cz, ax, y1, az, cx, y1, cz, bx, y1, bz,
    ax, y, az, ax, y1, az, bx, y1, bz, ax, y, az, bx, y1, bz, bx, y, bz,
    bx, y, bz, bx, y1, bz, cx, y1, cz, bx, y, bz, cx, y1, cz, cx, y, cz,
    cx, y, cz, cx, y1, cz, dx, y1, dz, cx, y, cz, dx, y1, dz, dx, y, dz,
    dx, y, dz, dx, y1, dz, ax, y1, az, dx, y, dz, ax, y1, az, ax, y, az);
}
// smooth parametric surface f(u, v) -> [x, y, z] as one indexed (smooth-shaded) mesh
const surf = function(g, nu, nv, f, col){
  const P = [], I = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) P.push(...f(i/nu, j/nv));
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++){ const a = j*(nu+1) + i, b = a + 1, c = a + nu + 2, d = a + nu + 1; I.push(a, b, c, a, c, d); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setIndex(I); geo.computeVertexNormals();
  return lmAdd(g, geo, typeof col === 'string' ? {c:col, ds:true} : Object.assign({ds:true}, col), 0, 0, 0);
}
const capP = (o, loop, c) => { if (!c){ c = [0, 0, 0]; for (const p of loop){ c[0] += p[0]/loop.length; c[1] += p[1]/loop.length; c[2] += p[2]/loop.length; } } for (let i = 0; i < loop.length; i++) o.push(...c, ...loop[i], ...loop[(i+1) % loop.length]); };
// low-poly ball into a batch, round-headed tree, palm
const ICO = (() => { const P = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]], F = [[0,2,4],[4,2,1],[1,2,5],[5,2,0],[4,3,0],[1,3,4],[5,3,1],[0,3,5]], out = [];
  for (const [a, b, d] of F){ const A = P[a], Bv = P[b], D = P[d], ab = nrm(mix(A, Bv, 0.5)), bd = nrm(mix(Bv, D, 0.5)), da = nrm(mix(D, A, 0.5));
    for (const t of [[A, ab, da], [ab, Bv, bd], [da, bd, D], [ab, bd, da]]) for (const v of t) out.push(v[0], v[1], v[2]); } return out; })();
const ico = function(o, c, rx, ry){ for (let i = 0; i < ICO.length; i += 3) o.push(c[0] + ICO[i]*rx, c[1] + ICO[i+1]*ry, c[2] + ICO[i+2]*rx); }
const treeP = function(B, x, y, z, s, r, trunkC, leafC){ segP(B.p(trunkC), [x, y, z], [x, y + 2.6*s, z], 0.22*s, 5); const k = 2.1*s*(0.85 + 0.3*r()); ico(B.p(leafC), [x, y + 3.6*s, z], k, k*0.8); }
const palm = function(B, x, y, z, h, r, trunkC, leafC){
  const lean = (r() - 0.5)*0.5, la = r()*TAU, top = [x + Math.cos(la)*lean*h*0.25, y + h, z + Math.sin(la)*lean*h*0.25];
  segP(B.p(trunkC), [x, y, z], top, 0.28, 5, 0.2);
  const o = B.p(leafC), nf = 7;
  for (let i = 0; i < nf; i++){ const a = i/nf*TAU + r(), L = 2.6 + r()*1.4, ca = Math.cos(a), sa = Math.sin(a);
    const m = [top[0] + ca*L*0.55, top[1] + 0.5, top[2] + sa*L*0.55], e = [top[0] + ca*L, top[1] - 1.1, top[2] + sa*L], w = 0.55;
    triP(o, top, [m[0] - sa*w, m[1], m[2] + ca*w], e); triP(o, top, e, [m[0] + sa*w, m[1], m[2] - ca*w]); }
}
// ---- plan helpers (local [x, z] points)
const toXZ = (F, OE, ON) => { const P = []; for (let i = 0; i < F.length; i += 2) P.push([F[i] - OE, ON - F[i+1]]); return P; };
const pip = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0]-a[0])*(z-a[1])/(b[1]-a[1]) + a[0]) c = !c; } return c; };
const cen = P => { let x = 0, z = 0; for (const p of P){ x += p[0]; z += p[1]; } return [x/P.length, z/P.length]; };
const perim = P => { let L = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; L += Math.hypot(b[0]-a[0], b[1]-a[1]); } return L; };
const chaikin = (P, k) => { for (let it = 0; it < k; it++){ const Q = []; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; Q.push([a[0]*0.75 + b[0]*0.25, a[1]*0.75 + b[1]*0.25], [a[0]*0.25 + b[0]*0.75, a[1]*0.25 + b[1]*0.75]); } P = Q; } return P; };
const resample = function(P, n){
  const seg = []; let L = 0;
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], l = Math.hypot(b[0]-a[0], b[1]-a[1]); seg.push([a, b, L, l]); L += l; }
  const out = []; let j = 0;
  for (let k = 0; k < n; k++){ const s = k*L/n; while (j < seg.length - 1 && seg[j][2] + seg[j][3] < s) j++; const [a, b, s0, l] = seg[j], t = l > 0 ? clamp01((s - s0)/l) : 0; out.push([a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t]); }
  return out;
}
// outward unit normal of edge i of plan P (tested against the polygon, so concave plans work)
const edgeN = function(P, i){ const a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], L = Math.hypot(ex, ez) || 1; let nx = ez/L, nz = -ex/L; const mx = (a[0]+b[0])/2, mz = (a[1]+b[1])/2; if (pip(P, mx + nx*0.25, mz + nz*0.25)){ nx = -nx; nz = -nz; } return [nx, nz, L, mx, mz]; }
// vertical bands along the edges of plan P, `off` outside the wall, y0..y1; skip(mx, mz, nx, nz) drops an edge
const edgeBands = function(o, P, y0, y1, off, skip){
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], [nx, nz, L, mx, mz] = edgeN(P, i); if (L < 0.6 || (skip && skip(mx, mz, nx, nz))) continue;
    quadP(o, [a[0]+nx*off, y0, a[1]+nz*off], [b[0]+nx*off, y0, b[1]+nz*off], [b[0]+nx*off, y1, b[1]+nz*off], [a[0]+nx*off, y1, a[1]+nz*off]); }
}
// vertical fins / mullions along the edges of P every sp metres
const edgeFins = function(o, P, y0, y1, sp, w, d, skip){
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], [nx, nz, L, mx, mz] = edgeN(P, i); if (L < 2 || (skip && skip(mx, mz, nx, nz))) continue;
    const n = Math.max(1, Math.round(L/sp)), ry = Math.atan2(-(b[1]-a[1]), b[0]-a[0]);
    for (let k = 0; k <= n; k++){ const t = k/n; boxP(o, w, y1 - y0, d, a[0] + (b[0]-a[0])*t + nx*d/2, y0, a[1] + (b[1]-a[1])*t + nz*d/2, ry); } }
}
// flat polygon at height y (fan from the centroid; convex / star-shaped plans only)
const flatP = function(o, P, y){ const c = cen(P); for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; triP(o, [c[0], y, c[1]], [b[0], y, b[1]], [a[0], y, a[1]]); } }


// miter offset of a simple polygon (d > 0 outward, d < 0 inward)
const offRing = function(P, d){
  const n = P.length; let A2 = 0; for (let i = 0; i < n; i++){ const a = P[i], b = P[(i+1) % n]; A2 += a[0]*b[1] - b[0]*a[1]; }
  const sg = A2 > 0 ? 1 : -1, out = [];
  for (let i = 0; i < n; i++){
    const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i+1) % n];
    let ax = p1[0]-p0[0], az = p1[1]-p0[1], bx = p2[0]-p1[0], bz = p2[1]-p1[1]; const la = Math.hypot(ax, az) || 1, lb = Math.hypot(bx, bz) || 1; ax /= la; az /= la; bx /= lb; bz /= lb;
    const n1 = [sg*az, -sg*ax], n2 = [sg*bz, -sg*bx]; let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
    const k = d/Math.max(0.35, mx*n1[0] + mz*n1[1]); out.push([p1[0] + mx*k, p1[1] + mz*k]);
  }
  return out;
}
// prism ring band (outer ring O, inner ring I, same count) between y0 and y1: outer face, top and soffit
const bandRing = function(o, O, I, y0, y1){ const n = O.length; for (let i = 0; i < n; i++){ const j = (i+1) % n, a = O[i], b = O[j], c = I[j], d = I[i];
  quadP(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); quadP(o, [a[0], y1, a[1]], [b[0], y1, b[1]], [c[0], y1, c[1]], [d[0], y1, d[1]]); quadP(o, [d[0], y0, d[1]], [c[0], y0, c[1]], [b[0], y0, b[1]], [a[0], y0, a[1]]); } }


// The Fullerton Hotel (former General Post Office, Keys & Dowdeswell, 1928), 37 m. Remade on the real footprint: five
// frontages (the Singapore River, the river mouth, the bay with its curved bow, Fullerton Square, the driveway), each with
// the giant two-storey fluted Doric colonnade over a rusticated grey granite base, entablature with triglyphs and cornice,
// the set-back attic storey; the glazed atrium roof, and the Lighthouse — the round glazed rooftop pavilion with its lantern —
// at the north tip over the river mouth; the riverside loggia. rot 0: local +x east, +z south.
// Main entrance (glass porch, raised portico attic) on the south-west driveway frontage.
// ======================================================================================================
{
const OE = 0, ON = 11;   // origin (E, N) relative to the reference anchor 1.28611 N, 103.85306 E
const X = F => toXZ(F, OE, ON);
const HOT = [-38.5,12.2,-38.5,27,-13.5,69.1,-8.1,75.1,10.4,74.5,18.8,69.7,19.4,65,21.8,64.4,22.4,41.9,27.7,41.9,27.7,35.9,36.1,35.9,39.1,28.8,40.3,19.3,39.7,8.1,36.1,-3.2,27.1,-2.6,27.1,-8.5,21.2,-8.5,18.8,-38.8,16.4,-38.8,15.8,-44.1,12.2,-44.1,13.4,-48.9,-6.9,-53,-7.5,-47.7,-11.7,-48.9,-17.6,-35.8,-20,-37,-37.9,2.7,-34.4,5.1];
// the same outline without the small notches, for the colonnade and the storeys above
const UP = [-38.5,12.2,-38.5,27,-13.5,69.1,-8.1,75.1,10.4,74.5,18.8,69.7,21.6,64.4,22.4,41.9,27.7,41.9,27.7,35.9,36.1,35.9,39.1,28.8,40.3,19.3,39.7,8.1,36.1,-3.2,27.1,-3.2,27.1,-8.5,21.2,-8.5,18.6,-41,13.4,-48.9,-6.9,-53,-11.7,-48.9,-17.6,-35.8,-37.9,2.7];
const LOG = [-13.5,69.1,-34.4,33.6,-47.5,41.3,-20.6,73.9];
const SKY = [0.9,22.9,0.9,3.3,-8.7,3.3,-8.7,22.9];
LANDMARKS.fullerton = {zh:'富丽敦酒店', en:'The Fullerton Hotel', cat:'old', r:68, h:45, lt:{m:0, c:'#ffcf8a', k:1.2, e:0.62, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB(), r = LMCTX.rng;
  const GRAN = {c:'#bcb6a9', ds:true}, GROOVE = {c:'#9d978a', ds:true}, PLAS = {c:'#dcd5c4', ds:true}, COL = {c:'#efe9da', ds:true}, CORN = {c:'#dad2bf', ds:true}, ROOF = {c:'#a3a6a0', ds:true};
  const WIN = {c:'#45433d', glow:'#ffcf87', gk:0.55, ds:true}, GLASS = {c:'#8fa9b3', glow:'#ffe2b4', gk:0.6, ds:true}, BEAC = {c:'#f6efd9', glow:'#fff3cf', gk:1.4, ds:true}, STEEL = {c:'#5a5f63', ds:true};
  const hot = X(HOT), up = X(UP), log = X(LOG), sky = X(SKY);
  const Y0 = 11.4, YC = 25.0, YE = 28.2, YA = 33.4;      // base top, column top, entablature top, attic top
  // ---- rusticated granite base (two storeys), on a plinth that reaches below the ground
  LPoly(g, hot, -3, 3 + Y0, GRAN);
  const gv = B.p(GROOVE), wn = B.p(WIN), cl = B.p(COL), cr = B.p(CORN), pl = B.p(PLAS);
  for (let y = 0.95; y < 10.4; y += 0.95) edgeBands(gv, hot, y, y + 0.13, 0.04);
  for (let i = 0; i < hot.length; i++){ const a = hot[i], b = hot[(i+1) % hot.length], [nx, nz, L] = edgeN(hot, i); if (L < 4) continue;
    const n = Math.max(1, Math.round(L/4.6)), ux = (b[0]-a[0])/L, uz = (b[1]-a[1])/L;
    for (let k = 0; k < n; k++){ const t = (k + 0.5)*L/n, cx = a[0] + ux*t + nx*0.08, cz = a[1] + uz*t + nz*0.08;
      for (const [y0, y1, w] of [[1.3, 4.7, 1.7], [6.0, 9.4, 1.6]]) quadP(wn, [cx - ux*w/2, y0, cz - uz*w/2], [cx + ux*w/2, y0, cz + uz*w/2], [cx + ux*w/2, y1, cz + uz*w/2], [cx - ux*w/2, y1, cz - uz*w/2]);
      // keystone / lintel blocks over the ground-floor openings
      quadP(cr, [cx - ux*1.15, 4.7, cz - uz*1.15], [cx + ux*1.15, 4.7, cz + uz*1.15], [cx + ux*1.15, 5.3, cz + uz*1.15], [cx - ux*1.15, 5.3, cz - uz*1.15]); } }
  bandRing(cr, offRing(up, 0.55), up, 10.5, Y0);                        // string course
  // ---- the giant order: recessed wall with two storeys of windows behind fluted Doric columns
  const inn = offRing(up, -4.0);
  LPoly(g, inn, Y0, YC - Y0, PLAS);
  edgeBands(cl, up, Y0, Y0 + 1.05, -0.35);                                // balustrade between the columns
  for (let i = 0; i < up.length; i++){
    const a = up[i], b = up[(i+1) % up.length], L = Math.hypot(b[0]-a[0], b[1]-a[1]), ux = (b[0]-a[0])/L, uz = (b[1]-a[1])/L, ry = Math.atan2(-uz, ux);
    const [nx, nz] = edgeN(up, i);
    // corner pier
    boxP(cl, 2.2, YC - Y0, 2.2, a[0] - nx*0.9, Y0, a[1] - nz*0.9, ry);
    if (L < 5) continue;
    const n = Math.max(1, Math.round((L - 2.4)/4.5));
    for (let k = 1; k < n; k++){ const t = 1.2 + (L - 2.4)*k/n, x = a[0] + ux*t - nx*0.9, z = a[1] + uz*t - nz*0.9;
      segP(cl, [x, Y0 + 0.9, z], [x, YC - 0.8, z], 0.78, 14, 0.66);
      boxP(cl, 1.9, 0.5, 1.9, x, Y0 + 0.4, z, ry); boxP(cr, 1.75, 0.4, 1.75, x, Y0, z, ry);     // base
      boxP(cr, 1.5, 0.35, 1.5, x, YC - 0.85, z, ry); boxP(cl, 2.0, 0.45, 2.0, x, YC - 0.5, z, ry); }   // echinus + abacus
    // windows of the two storeys behind, one pair per bay
    const ia = inn[i], ib = inn[(i+1) % inn.length], Li = Math.hypot(ib[0]-ia[0], ib[1]-ia[1]); if (Li < 2.5) continue;
    const vx = (ib[0]-ia[0])/Li, vz = (ib[1]-ia[1])/Li, m = Math.max(1, Math.round(Li/4.5));
    for (let k = 0; k < m; k++){ const t = (k + 0.5)*Li/m, cx = ia[0] + vx*t + nx*0.08, cz = ia[1] + vz*t + nz*0.08;
      for (const [y0, y1] of [[12.6, 17.4], [19.0, 23.8]]) quadP(wn, [cx - vx*0.95, y0, cz - vz*0.95], [cx + vx*0.95, y0, cz + vz*0.95], [cx + vx*0.95, y1, cz + vz*0.95], [cx - vx*0.95, y1, cz - vz*0.95]);
      quadP(cr, [cx - vx*1.6, 18.0, cz - vz*1.6], [cx + vx*1.6, 18.0, cz + vz*1.6], [cx + vx*1.6, 18.4, cz + vz*1.6], [cx - vx*1.6, 18.4, cz - vz*1.6]); }
  }
  // ---- entablature: architrave, frieze with triglyphs, projecting cornice
  LPoly(g, up, YC, YE - YC, PLAS);
  edgeBands(cr, up, YC, YC + 0.95, 0.1);
  edgeFins(cr, up, YC + 1.15, YC + 2.45, 1.6, 0.55, 0.16);
  bandRing(cr, offRing(up, 1.05), up, YE - 0.55, YE + 0.3);
  // ---- attic storey, set back, with its windows and cornice; roof
  const att = offRing(up, -1.5);
  LPoly(g, att, YE + 0.3, YA - YE - 0.3, PLAS);
  for (let i = 0; i < att.length; i++){ const a = att[i], b = att[(i+1) % att.length], [nx, nz, L] = edgeN(att, i); if (L < 3) continue; const ux = (b[0]-a[0])/L, uz = (b[1]-a[1])/L, n = Math.max(1, Math.round(L/2.3));
    for (let k = 0; k < n; k++){ const t = (k + 0.5)*L/n, cx = a[0] + ux*t + nx*0.06, cz = a[1] + uz*t + nz*0.06; quadP(wn, [cx - ux*0.6, 29.5, cz - uz*0.6], [cx + ux*0.6, 29.5, cz + uz*0.6], [cx + ux*0.6, 32.0, cz + uz*0.6], [cx - ux*0.6, 32.0, cz - uz*0.6]); } }
  bandRing(cr, offRing(att, 0.5), att, YA - 0.2, YA + 0.6);
  const rf = offRing(att, -0.6); LPoly(g, rf, YA + 0.6, 0.12, ROOF);
  edgeBands(B.p(PLAS), rf, YA + 0.6, YA + 1.5, 0.05);                     // parapet
  // ---- portico of the main entrance on the driveway frontage: projecting bay, raised attic, glass porch
  { const a = up[22], b = up[23];          // (-17.6, -35.8) -> (-37.9, 2.7)
    const L = Math.hypot(b[0]-a[0], b[1]-a[1]), ux = (b[0]-a[0])/L, uz = (b[1]-a[1])/L, [nx, nz] = edgeN(up, 22), ry = Math.atan2(-uz, ux), m = [lerp(a[0], b[0], 0.5), lerp(a[1], b[1], 0.5)];
    const P = (s, d) => [m[0] + ux*s + nx*d, m[1] + uz*s + nz*d];
    { const c = P(0, 1.2); boxP(B.p(GRAN), 20, Y0, 2.4, c[0], 0, c[1], ry); boxP(B.p(PLAS), 20, YE - Y0, 2.4, c[0], Y0, c[1], ry); }
    for (const s of [-8.6, -6.6, 6.6, 8.6]){ const c = P(s, 2.0); segP(cl, [c[0], Y0 + 0.9, c[1]], [c[0], YC - 0.8, c[1]], 0.8, 14, 0.68); boxP(cl, 2.0, 0.45, 2.0, c[0], YC - 0.5, c[1], ry); boxP(cl, 1.9, 0.5, 1.9, c[0], Y0 + 0.4, c[1], ry); }
    { const c = P(0, 1.4); boxP(B.p(PLAS), 21, 5.6, 2.8, c[0], YE, c[1], ry); boxP(cr, 22, 0.6, 3.4, c[0], YE + 5.6, c[1], ry); boxP(cr, 7, 2.6, 0.6, P(0, 2.9)[0], YE + 1.4, P(0, 2.9)[1], ry); }
    // the glass porch canopy on slim steel posts over the driveway
    const c = P(0, 6.5); boxP(B.p(GLASS), 16, 0.3, 9, c[0], 5.4, c[1], ry); boxP(B.p(STEEL), 16.4, 0.5, 0.4, P(0, 10.9)[0], 5.2, P(0, 10.9)[1], ry);
    for (const s of [-7.5, -2.5, 2.5, 7.5]){ const q = P(s, 10.6); segP(B.p(STEEL), [q[0], 0, q[1]], [q[0], 5.4, q[1]], 0.14, 6); } }
  // ---- the sky-lit triangular atrium (the four old air-wells made one): a low glass pyramid on steel ribs over the court
  { const tri = X([-17, 33, 21, 33, 2, -10]), c = cen(tri); LPoly(g, offRing(tri, 1.2), YA + 0.6, 1.2, CORN);
    const o = B.p(GLASS), st = B.p(STEEL), y0 = YA + 1.8, ap = [c[0], YA + 5.4, c[1]];
    for (let i = 0; i < 3; i++){ const a = tri[i], b = tri[(i+1) % 3]; triP(o, [a[0], y0, a[1]], [b[0], y0, b[1]], ap); segP(st, [a[0], y0, a[1]], ap, 0.14, 4);
      for (let k = 1; k < 7; k++){ const t = k/7, q = [a[0] + (b[0]-a[0])*t, y0, a[1] + (b[1]-a[1])*t]; segP(st, q, ap, 0.06, 3); } } }
  for (const [e, n2, w, d] of [[-24, 24, 8, 5], [8, -22, 7, 5], [-4, 50, 6, 4]]){ const q = X([e, n2])[0]; boxP(B.p(ROOF), w, 2.2, d, q[0], YA + 0.7, q[1], 0.5); }
  // ---- the Lighthouse at the north tip: glazed round pavilion, cornice, dome and the lantern with its beacon
  { const q = X([1.5, 64.5])[0], x = q[0], z = q[1], yb = YA + 0.7;
    LCyl(g, 5.6, 5.6, 0.9, x, yb, z, CORN, 24);
    LCyl(g, 4.9, 4.9, 3.6, x, yb + 0.9, z, GLASS, 20);
    for (let k = 0; k < 10; k++){ const a = k/10*TAU; segP(cl, [x + Math.cos(a)*5.0, yb + 0.9, z + Math.sin(a)*5.0], [x + Math.cos(a)*5.0, yb + 4.5, z + Math.sin(a)*5.0], 0.22, 6); }
    LCyl(g, 5.7, 5.4, 0.7, x, yb + 4.5, z, CORN, 24);
    LLathe(g, [[5.2, 0], [4.9, 1.0], [4.0, 2.0], [2.4, 2.7], [1.5, 2.9], [0, 2.95]], x, yb + 5.2, z, CORN, 24);
    LCyl(g, 1.35, 1.35, 2.2, x, yb + 7.9, z, BEAC, 12);
    for (let k = 0; k < 6; k++){ const a = k/6*TAU; segP(B.p(STEEL), [x + Math.cos(a)*1.4, yb + 7.9, z + Math.sin(a)*1.4], [x + Math.cos(a)*1.4, yb + 10.1, z + Math.sin(a)*1.4], 0.07, 4); }
    LCone(g, 1.75, 1.3, x, yb + 10.1, z, STEEL, 12); segP(B.p(STEEL), [x, yb + 11.4, z], [x, yb + 13.2, z], 0.07, 4);
    LCyl(g, 1.9, 1.9, 0.3, x, yb + 7.7, z, STEEL, 12); }
  // flagstaffs on the roof (no flags)
  for (const [e, n2] of [[-30, 20], [12, -40], [24, 30]]){ const q = X([e, n2])[0]; segP(B.p(COL), [q[0], YA + 0.6, q[1]], [q[0], YA + 9.5, q[1]], 0.08, 5); }
  // ---- riverside loggia: granite arcade with a balustraded terrace on top
  { LPoly(g, log, -3, 8.2, GRAN);
    edgeBands(cr, log, 5.0, 5.6, 0.25); edgeBands(B.p(PLAS), log, 5.6, 6.5, 0.05);
    for (let i = 0; i < log.length; i++){ const a = log[i], b = log[(i+1) % log.length], [nx, nz, L] = edgeN(log, i); if (L < 8) continue; const ux = (b[0]-a[0])/L, uz = (b[1]-a[1])/L, n = Math.round(L/4.2);
      for (let k = 0; k < n; k++){ const t = (k + 0.5)*L/n, cx = a[0] + ux*t + nx*0.06, cz = a[1] + uz*t + nz*0.06, P = [[cx - ux*1.3, 0.3, cz - uz*1.3], [cx + ux*1.3, 0.3, cz + uz*1.3]];
        for (let j = 0; j <= 6; j++){ const s = j/6*PI; P.push([cx + ux*Math.cos(s)*1.3, 3.2 + Math.sin(s)*1.3, cz + uz*Math.cos(s)*1.3]); }
        capP(wn, P); } } }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'fullerton', lat:1.28611 + ON/110574, lon:103.85306 + OE/111290.5, rot:0});
}
}
SG_PLACES.push({type:'guoco', lat:1.277020, lon:103.845472, rot:0});
SG_PLACES.push({type:"capitaspring", lat:1.283874, lon:103.850041, rot:0});
SG_PLACES.push({type:'asiasquare', lat:1.278591, lon:103.851032, rot:0});
SG_PLACES.push({type:'thesail', lat:1.280923, lon:103.852698, rot:0});
SG_PLACES.push({type:'lauPaSat', lat:1.280616, lon:103.850503, rot:0});
}
