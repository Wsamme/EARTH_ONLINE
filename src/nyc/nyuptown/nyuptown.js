// ===== nyc/nyuptown: Morningside Heights, Harlem, Washington Heights and the Harlem River (City Brush v29, New York 1:1) =====
// The Cathedral of St. John the Divine, Riverside Church, General Grant National Memorial, Columbia University (Low Memorial
// Library with the steps and Alma Mater; Butler Library as a second, unlabelled key), City College's Shepard Hall, the Met
// Cloisters in Fort Tryon Park, and the High Bridge (1848 aqueduct, 1928 steel arch) with the High Bridge Water Tower (second,
// unlabelled key). Every model sits on its real OSM footprint (refs: nyc/ref_nyuptown.json). No text, no logos, no people.
{
const PI = Math.PI, TAU = PI*2, HP = PI/2;
// ---------------- triangle batches: everything of one colour spec becomes one LTris call ----------------
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const Q = (o, a, b, c, d) => o.push(...a, ...b, ...c, ...a, ...c, ...d);
const T3 = (o, a, b, c) => o.push(...a, ...b, ...c);
// axis-aligned box
function abox(o, x0, x1, y0, y1, z0, z1, noBot){
  const P = [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]];
  const F = noBot ? [[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]] : [[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]];
  for (const [a, b, c, d] of F) Q(o, P[a], P[b], P[c], P[d]);
}
// rotated box: w along local x (after rotation ry about y), d along z, base at y
function rbox(o, w, h, d, x, y, z, ry){
  const c = Math.cos(ry || 0), s = Math.sin(ry || 0), R = (u, v) => [x + u*c + v*s, z - u*s + v*c], hw = w/2, hd = d/2;
  const q = [R(-hw, -hd), R(hw, -hd), R(hw, hd), R(-hw, hd)];
  const P = [...q.map(p => [p[0], y, p[1]]), ...q.map(p => [p[0], y + h, p[1]])];
  for (const [a, b, cc, e] of [[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]) Q(o, P[a], P[b], P[cc], P[e]);
}
// extruded plan polygon [[x, z], ...]: walls + triangulated top
function prism(o, P, y0, y1, top = true, ot){
  const n = P.length;
  for (let i = 0; i < n; i++){ const a = P[i], b = P[(i + 1) % n]; Q(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); }
  if (top){ const T = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
    for (const t of T) T3(ot || o, [P[t[0]][0], y1, P[t[0]][1]], [P[t[1]][0], y1, P[t[1]][1]], [P[t[2]][0], y1, P[t[2]][1]]); }
}
function flat(o, P, y){ const T = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []); for (const t of T) T3(o, [P[t[0]][0], y, P[t[0]][1]], [P[t[1]][0], y, P[t[1]][1]], [P[t[2]][0], y, P[t[2]][1]]); }
// cylinder / regular prism (r or [rBottom, rTop]), n sides
function cyl(o, x, z, r, y0, y1, n, top = true, a0 = 0){
  const rb = Array.isArray(r) ? r[0] : r, rt = Array.isArray(r) ? r[1] : r;
  for (let i = 0; i < n; i++){ const t0 = a0 + i/n*TAU, t1 = a0 + (i + 1)/n*TAU;
    Q(o, [x + Math.cos(t0)*rb, y0, z + Math.sin(t0)*rb], [x + Math.cos(t1)*rb, y0, z + Math.sin(t1)*rb], [x + Math.cos(t1)*rt, y1, z + Math.sin(t1)*rt], [x + Math.cos(t0)*rt, y1, z + Math.sin(t0)*rt]);
    if (top && rt > 0) T3(o, [x, y1, z], [x + Math.cos(t1)*rt, y1, z + Math.sin(t1)*rt], [x + Math.cos(t0)*rt, y1, z + Math.sin(t0)*rt]); }
}
// surface of revolution [[r, y], ...] (full, or the arc a0..a1)
function lathe(o, pts, x, z, n, a0 = 0, a1){
  const span = a1 === undefined ? TAU : a1 - a0;
  for (let k = 0; k < pts.length - 1; k++){ const [r0, y0] = pts[k], [r1, y1] = pts[k + 1];
    for (let i = 0; i < n; i++){ const t0 = a0 + i/n*span, t1 = a0 + (i + 1)/n*span;
      Q(o, [x + Math.cos(t0)*r0, y0, z + Math.sin(t0)*r0], [x + Math.cos(t1)*r0, y0, z + Math.sin(t1)*r0], [x + Math.cos(t1)*r1, y1, z + Math.sin(t1)*r1], [x + Math.cos(t0)*r1, y1, z + Math.sin(t0)*r1]); } }
}
// beam between two points (n-sided prism)
function seg(o, a, b, r, n = 4){
  const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2], L = Math.hypot(dx, dy, dz); if (L < 1e-4) return;
  const d = [dx/L, dy/L, dz/L], up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let ux = d[1]*up[2]-d[2]*up[1], uy = d[2]*up[0]-d[0]*up[2], uz = d[0]*up[1]-d[1]*up[0]; const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
  const vx = d[1]*uz-d[2]*uy, vy = d[2]*ux-d[0]*uz, vz = d[0]*uy-d[1]*ux;
  const ring = p => { const R = []; for (let i = 0; i < n; i++){ const t = (i + 0.5)/n*TAU, c = Math.cos(t)*r, s = Math.sin(t)*r; R.push([p[0]+ux*c+vx*s, p[1]+uy*c+vy*s, p[2]+uz*c+vz*s]); } return R; };
  const A = ring(a), Bq = ring(b); for (let i = 0; i < n; i++){ const j = (i + 1) % n; Q(o, A[i], A[j], Bq[j], Bq[i]); }
}
// gable roofs over x0..x1 / z0..z1 from eaves y to ridge y + h; ridge along x (gableX) or z (gableZ); ends closed (oe: gable-end batch)
function gableX(o, x0, x1, z0, z1, y, h, oe){ const zm = (z0 + z1)/2, e = oe || o;
  Q(o, [x0, y, z0], [x1, y, z0], [x1, y + h, zm], [x0, y + h, zm]); Q(o, [x1, y, z1], [x0, y, z1], [x0, y + h, zm], [x1, y + h, zm]);
  T3(e, [x0, y, z0], [x0, y + h, zm], [x0, y, z1]); T3(e, [x1, y, z1], [x1, y + h, zm], [x1, y, z0]); }
function gableZ(o, x0, x1, z0, z1, y, h, oe){ const xm = (x0 + x1)/2, e = oe || o;
  Q(o, [x0, y, z1], [x0, y, z0], [xm, y + h, z0], [xm, y + h, z1]); Q(o, [x1, y, z0], [x1, y, z1], [xm, y + h, z1], [xm, y + h, z0]);
  T3(e, [x0, y, z0], [x1, y, z0], [xm, y + h, z0]); T3(e, [x1, y, z1], [x0, y, z1], [xm, y + h, z1]); }
// hipped roof over an axis-aligned rectangle (ridge along the longer side)
function hipR(o, x0, x1, z0, z1, y, h){
  const L = x1 - x0, W = z1 - z0, xm = (x0 + x1)/2, zm = (z0 + z1)/2;
  if (L >= W){ const k = (L - W)/2, r1 = [x0 + W/2, y + h, zm], r2 = [x1 - W/2, y + h, zm];
    Q(o, [x0, y, z0], [x1, y, z0], r2, r1); Q(o, [x1, y, z1], [x0, y, z1], r1, r2); T3(o, [x0, y, z1], [x0, y, z0], r1); T3(o, [x1, y, z0], [x1, y, z1], r2); if (k < 0) return; }
  else { const r1 = [xm, y + h, z0 + L/2], r2 = [xm, y + h, z1 - L/2];
    Q(o, [x0, y, z1], [x0, y, z0], r1, r2); Q(o, [x1, y, z0], [x1, y, z1], r2, r1); T3(o, [x0, y, z0], [x1, y, z0], r1); T3(o, [x1, y, z1], [x0, y, z1], r2); }
}
// pyramid roof over a regular n-gon
function pyr(o, x, z, r, y, h, n, a0 = 0){ for (let i = 0; i < n; i++){ const t0 = a0 + i/n*TAU, t1 = a0 + (i + 1)/n*TAU;
  T3(o, [x + Math.cos(t0)*r, y, z + Math.sin(t0)*r], [x, y + h, z], [x + Math.cos(t1)*r, y, z + Math.sin(t1)*r]); } }
// pinnacle: square shaft and spirelet (w = width)
function pinn(o, x, y, z, w, h){ const r = w*0.7071; cyl(o, x, z, r, y, y + h*0.5, 4, false, PI/4); pyr(o, x, z, r*1.08, y + h*0.5, h*0.5, 4, PI/4); }
// ---------------- wall faces: fc(A -> B), outward normal on the right-hand side seen from above (x east, z south) ----------------
const fc = (ax, az, bx, bz) => { const L = Math.hypot(bx - ax, bz - az), tx = (bx - ax)/L, tz = (bz - az)/L; return {ax, az, tx, tz, nx:-tz, nz:tx, L}; };
const fp = (F, u, y, d = 0) => [F.ax + F.tx*u + F.nx*d, y, F.az + F.tz*u + F.nz*d];
// outward face tangent to a circle / polygon: centre (cx, cz), direction a, distance r, half length hl (u = hl at the tangent point)
const radF = (cx, cz, a, r, hl) => { const x = cx + Math.cos(a)*r, z = cz + Math.sin(a)*r; return fc(x - Math.sin(a)*hl, z + Math.cos(a)*hl, x + Math.sin(a)*hl, z - Math.cos(a)*hl); };
// window / opening outlines (du, y), convex, counter-clockwise: 'p' pointed, 'r' round, 's' square
function outl(w, y0, y1, kind, n = 5){
  const hw = w/2, P = [[-hw, y0], [hw, y0]];
  if (kind === 's'){ P.push([hw, y1], [-hw, y1]); return P; }
  if (kind === 'r'){ for (let i = 0; i <= n; i++){ const a = PI*i/n; P.push([Math.cos(a)*hw, y1 + Math.sin(a)*hw]); } return P; }
  // pointed (two arcs of radius w*0.8 centred at the opposite springing points, shifted)
  const R = w*0.85, cxL = hw - R, cxR = -hw + R, top = Math.sqrt(R*R - cxR*cxR);
  for (let i = 0; i <= n; i++){ const x = hw - (hw)*i/n; P.push([x, y1 + Math.sqrt(Math.max(0, R*R - (x - cxL)*(x - cxL)))]); }
  for (let i = 1; i <= n; i++){ const x = -hw*i/n; P.push([x, y1 + Math.sqrt(Math.max(0, R*R - (x - cxR)*(x - cxR)))]); }
  return P;
}
// a flat polygon on a face (fan from the centroid), centred at u, pushed out by d
function onF(o, F, u, P, d = 0.08){ let cu = 0, cy = 0; for (const p of P){ cu += p[0]/P.length; cy += p[1]/P.length; }
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length]; T3(o, fp(F, u + cu, cy, d), fp(F, u + a[0], a[1], d), fp(F, u + b[0], b[1], d)); } }
// a box standing on a face: centred at u, width w, from y0 to y1, depth dd out of the wall
function bF(o, F, u, w, y0, y1, dd, d0 = 0){ const A = fp(F, u - w/2, y0, d0), Bq = fp(F, u + w/2, y0, d0), C = fp(F, u + w/2, y0, d0 + dd), D = fp(F, u - w/2, y0, d0 + dd);
  const up = p => [p[0], y1, p[2]]; Q(o, up(A), up(D), up(C), up(Bq)); Q(o, A, Bq, up(Bq), up(A)); Q(o, Bq, C, up(C), up(Bq)); Q(o, C, D, up(D), up(C)); Q(o, D, A, up(A), up(D)); }
// a band (string course / cornice) along the whole face
function bandF(o, F, y, h, dd, u0 = 0, u1){ bF(o, F, (u0 + (u1 === undefined ? F.L : u1))/2, (u1 === undefined ? F.L : u1) - u0, y, y + h, dd); }
// a row of windows along a face: n windows evenly in u0..u1
function winRow(o, F, u0, u1, n, w, y0, y1, kind, d = 0.08){ const st = (u1 - u0)/n; for (let i = 0; i < n; i++) onF(o, F, u0 + st*(i + 0.5), outl(w, y0, y1, kind), d); }
// a disc on a face (rose windows, clock faces): radius R at height yc; spokes (n) in the frame batch
function rose(og, ofr, F, u, yc, R, n, d = 0.1){
  const P = []; for (let i = 0; i < 24; i++){ const a = i/24*TAU; P.push([Math.cos(a)*R, yc + Math.sin(a)*R]); } onF(og, F, u, P, d);
  for (let i = 0; i < n; i++){ const a = i/n*TAU; const p0 = fp(F, u + Math.cos(a)*R*0.22, yc + Math.sin(a)*R*0.22, d + 0.05), p1 = fp(F, u + Math.cos(a)*R, yc + Math.sin(a)*R, d + 0.05); seg(ofr, p0, p1, R*0.025, 3); }
  for (let i = 0; i < 24; i++){ const a0 = i/24*TAU, a1 = (i + 1)/24*TAU; for (const rr of [R*0.22, R*0.62, R]) seg(ofr, fp(F, u + Math.cos(a0)*rr, yc + Math.sin(a0)*rr, d + 0.05), fp(F, u + Math.cos(a1)*rr, yc + Math.sin(a1)*rr, d + 0.05), R*0.03, 3); }
}
// crenellated parapet along a face: merlons of width mw every st
function crenF(o, F, y, h, st, mw, th = 0.5, u0 = 0, u1){ const e = u1 === undefined ? F.L : u1; bF(o, F, (u0 + e)/2, e - u0, y, y + h*0.45, th, -th);
  for (let u = u0 + st/2; u < e - mw/2; u += st) bF(o, F, u, mw, y + h*0.45, y + h, th, -th); }
// the faces of an axis-aligned rectangle, outside to the right: s (+z side), e (+x), n (-z), w (-x)
const rectF = (x0, x1, z0, z1) => ({s:fc(x0, z1, x1, z1), e:fc(x1, z1, x1, z0), n:fc(x1, z0, x0, z0), w:fc(x0, z0, x0, z1)});
// placement: model origin given in ref-local metres (x east, z south) around a ref anchor
const LLp = (lat0, lon0, ox, oz) => ({lat:+(lat0 - oz/111048).toFixed(7), lon:+(lon0 + ox/84516).toFixed(7)});
const place = (type, lat0, lon0, ox, oz, rot) => { const p = LLp(lat0, lon0, ox, oz); SG_PLACES.push({type, lat:p.lat, lon:p.lon, rot:+rot.toFixed(4)}); };
const AVI = {c:'#b02018', glow:'#ff2a1a', gk:2.2};

// =====================================================================================================================
// Cathedral of St. John the Divine (Heins & LaFarge 1892-1911, Romanesque-Byzantine choir and crossing; Ralph Adams Cram
// 1916-41, French Gothic nave and west front). 183 m long; west front 63 m wide on Amsterdam Avenue with five portals, the
// 12 m rose window, the St. Peter (north, ~54 m) and St. Paul (south, ~69 m) towers - both unfinished, flat-topped; the nave
// with its copper roof (ridge ~53 m), outer aisles with gabled bays and buttresses; the crossing with the low Guastavino tile
// dome (28 m); the unfinished north transept stub; the granite choir with the apse, ambulatory and seven radiating chapels.
// Frame: local +x = the cathedral axis to the east-south-east (altar), +z = south (110th Street side); origin = ref point
// (20, 6). rot = -28.2 deg (measured on the OSM footprint).
LANDMARKS.nystjohn = {zh:'圣约翰神明座堂', en:'Cathedral of St. John the Divine', cat:'old', r:100, h:70,
  lt:{m:0, c:'#ffe2b8', k:0.95, e:0.5, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB();
  const lime = {c:'#c9c0ae', m:0, lk:0.95}, limeD = {c:'#b3aa98', m:0, lk:0.8}, gran = {c:'#a1978a', m:0, lk:0.85};
  const cu = {c:'#647a70', m:0, lk:0.3}, tileR = {c:'#5a6c64', m:0, lk:0.3}, dome = {c:'#93603f', m:0, lk:0.55};
  const glass = {c:'#2b323c', glow:'#ffbf7a', gk:0.12}, roseG = {c:'#352f4a', glow:'#ffc98c', gk:0.55}, door = '#4f4030', dark = '#3b3a38';
  const L = B.p(lime), LD = B.p(limeD), G = B.p(gran), CU = B.p(cu), TR = B.p(tileR), DM = B.p(dome), GL = B.p(glass), DR = B.p(door), DK = B.p(dark);
  const Z0 = 1.3, FB = -7;                  // nave axis; foundations
  // ---------------- west front: towers + nave gable end (front face x = -88.6) ----------------
  const XF = -88.6, XT = -74.0;
  const towers = [[-26.9, -13.5, 54, -28.7], [17.0, 30.9, 69, 32.4]];
  for (const [z0, z1, top, zx] of towers){
    abox(L, XF, XT, FB, top, z0, z1);
    const F = rectF(XF, XT, z0, z1), zc = (z0 + z1)/2, w = z1 - z0;
    // corner buttresses (stepped): on the west front and on the outer side, as on the footprint
    for (const zb of [z0 + 1.4, z1 - 1.4]){
      abox(LD, XF - 3.4, XF + 0.2, FB, top - 10, zb - 1.5, zb + 1.5); abox(LD, XF - 2.2, XF + 0.2, top - 10, top - 3, zb - 1.2, zb + 1.2); }
    const zo = zx < 0 ? z0 : z1;
    for (const xb of [XF + 1.2, XT - 1.3]){ abox(LD, xb - 1.2, xb + 1.2, FB, top - 10, Math.min(zo, zx), Math.max(zo, zx)); abox(LD, xb - 0.9, xb + 0.9, top - 10, top - 3, Math.min(zo, zx*0.5 + zo*0.5), Math.max(zo, zx*0.5 + zo*0.5)); }
    // tower portal (pointed, deep), windows of the stages
    const W = F.w; onF(DK, W, w/2, outl(5.0, 0, 9.5, 'p'), 0.1); onF(DR, W, w/2, outl(3.8, 0, 8.6, 'p'), 0.25);
    bF(LD, W, w/2, 7.2, 0, 15.5, 1.2); onF(DK, W, w/2, outl(5.0, 0, 9.5, 'p'), 1.3); onF(DR, W, w/2, outl(3.6, 0, 8.4, 'p'), 1.36);
    winRow(GL, W, 2, w - 2, 2, 2.4, 20, 30, 'p'); winRow(GL, W, 2, w - 2, 2, 2.6, 36, 47, 'p');
    winRow(GL, F[z0 < 0 ? 'n' : 's'], 2, (XT - XF) - 2, 2, 2.4, 20, 30, 'p'); winRow(GL, F[z0 < 0 ? 'n' : 's'], 2, (XT - XF) - 2, 2, 2.6, 36, 47, 'p');
    if (top > 60){ winRow(DK, W, 1.5, w - 1.5, 2, 3.0, 52, 64, 'p', 0.1); winRow(DK, F.s, 1.5, (XT - XF) - 1.5, 2, 3.0, 52, 64, 'p', 0.1);
      winRow(DK, F.n, 1.5, (XT - XF) - 1.5, 2, 3.0, 52, 64, 'p', 0.1); winRow(DK, F.e, 1.5, w - 1.5, 2, 3.0, 52, 64, 'p', 0.1); }
    for (const k of ['w', 'n', 's', 'e']){ bandF(LD, F[k], 17, 0.8, 0.5); bandF(LD, F[k], 33, 0.8, 0.5); if (top > 60) bandF(LD, F[k], 50, 0.9, 0.5); crenF(LD, F[k], top, 1.6, 2.4, 1.2, 0.5);
      // tracery: a mullion in every lancet of the two stages, hood moulds over the pairs
      const f = F[k]; if (k === 'e') continue; const st = (f.L - 4)/2;
      for (let i = 0; i < 2; i++){ const u = 2 + st*(i + 0.5); for (const [y0, y1] of [[20, 31.6], [36, 49]]) seg(LD, fp(f, u, y0, 0.16), fp(f, u, y1, 0.16), 0.11, 3);
        if (top > 60) seg(LD, fp(f, u, 52, 0.16), fp(f, u, 66, 0.16), 0.13, 3); }
      for (const y of [33.9, 51.0]) bF(LD, f, f.L/2, f.L - 3.0, y - 0.9, y - 0.5, 0.35); }
    // the unfinished top: flat roof with a rough coping
    abox(LD, XF + 1, XT - 1, top - 0.2, top + 0.3, z0 + 1, z1 - 1);
  }
  // nave gable end between the towers: rose window, central portal with gabled frame, side portals, buttresses
  const NZ0 = -13.5, NZ1 = 17.0, NEAV = 37, NRID = 53;
  const FW = fc(XF, NZ0, XF, NZ1);          // west face, u from the north (z = -13.5) to the south
  bF(LD, FW, 15.25, 15.6, 21.5, 39.0, 0.5);          // the great arch round the rose window
  onF(DK, FW, 15.25, outl(14.2, 22.2, 30.5, 'p', 8), 0.55);
  rose(B.p(roseG), LD, FW, 15.25, 30.5, 6.1, 16, 0.62);
  bF(LD, FW, 15.25, 13.6, 0, 15.5, 1.7);              // central portal block (Portal of Paradise)
  for (let k = 0; k < 3; k++) onF(k % 2 ? LD : DK, FW, 15.25, outl(10.0 - k*1.2, 0, 11.8 - k*0.5, 'p', 6), 1.74 + k*0.03);
  onF(DR, FW, 15.25, outl(6.4, 0, 9.6, 'p'), 1.84); bF(LD, FW, 15.25, 0.9, 0, 9.0, 0.5, 1.8);     // bronze doors and trumeau
  // gabled frame (wimperg) over the central portal
  { const a = fp(FW, 15.25 - 6.8, 16.0, 2.0), b = fp(FW, 15.25 + 6.8, 16.0, 2.0), c = fp(FW, 15.25, 22.5, 2.0);
    const a2 = fp(FW, 15.25 - 6.8, 16.0, 0), b2 = fp(FW, 15.25 + 6.8, 16.0, 0), c2 = fp(FW, 15.25, 22.5, 0);
    T3(LD, a, b, c); Q(LD, a2, a, c, c2); Q(LD, b, b2, c2, c); }
  for (const u of [4.6, 25.9]){ onF(DK, FW, u, outl(4.4, 0, 8.0, 'p'), 0.8); onF(DR, FW, u, outl(3.2, 0, 7.2, 'p'), 0.86); bF(LD, FW, u, 6.6, 0, 11.5, 0.7);
    onF(GL, FW, u, outl(3.0, 15, 25, 'p'), 0.1); }
  for (const u of [9.0, 21.5]){ bF(LD, FW, u, 2.2, FB, 41, 3.0); pinn(LD, ...fp(FW, u, 41, 1.5).slice(0, 1), 41, fp(FW, u, 41, 1.5)[2], 1.8, 7); }
  bandF(LD, FW, 15.5, 0.6, 0.4); bandF(LD, FW, 36.0, 1.0, 0.5);
  // gallery of statues' niches under the gable
  for (let i = 0; i < 9; i++) onF(DK, FW, 15.25 - 8 + i*2.0, outl(1.1, 39.2, 41.5, 'p', 3), 0.12);
  // ---------------- nave (central vessel + outer aisles) ----------------
  const XC = -12.4;                          // crossing starts
  abox(L, XF, XC, FB, NEAV, NZ0, NZ1, true);
  gableX(CU, XF + 0.2, XC, NZ0 - 0.8, NZ1 + 0.8, NEAV, NRID - NEAV, L);
  bandF(LD, rectF(XF, XC, NZ0, NZ1).s, NEAV - 1.2, 1.2, 0.6); bandF(LD, rectF(XF, XC, NZ0, NZ1).n, NEAV - 1.2, 1.2, 0.6);
  const AS = [[-20.9, NZ0, -1], [NZ1, 23.5, 1]];
  const nb = 8, bay = (XC - XT)/nb;
  for (const [z0, z1, s] of AS){
    abox(L, XT, XC, FB, 20, z0, z1, true);
    const zo = s < 0 ? z0 : z1, zi = s < 0 ? z1 : z0;
    Q(CU, [XT, 20, zo + s*0.4], [XC, 20, zo + s*0.4], [XC, 25.5, zi], [XT, 25.5, zi]);
    const Fo = s < 0 ? rectF(XT, XC, z0, z1).n : rectF(XT, XC, z0, z1).s;            // outer aisle wall
    const Fc = s < 0 ? rectF(XF, XC, NZ0, NZ1).n : rectF(XF, XC, NZ0, NZ1).s;        // clerestory wall
    const uo = u => s < 0 ? (XC - XT) - u : u, uc = u => s < 0 ? (XC - XT) - u : (XT - XF) + u;
    for (let i = 0; i < nb; i++){ const um = (i + 0.5)*bay;
      onF(GL, Fo, uo(um) - 1.6, outl(2.4, 4, 13.5, 'p'), 0.08); onF(GL, Fo, uo(um) + 1.6, outl(2.4, 4, 13.5, 'p'), 0.08);
      // gabled dormer bay on the aisle wall
      const a = fp(Fo, uo(um) - 3.2, 20, 0.05), b = fp(Fo, uo(um) + 3.2, 20, 0.05), c = fp(Fo, uo(um), 25.0, 0.05);
      T3(L, a, b, c); const a1 = fp(Fo, uo(um) - 3.2, 20, -2.5), b1 = fp(Fo, uo(um) + 3.2, 20, -2.5), c1 = fp(Fo, uo(um), 25.0, -2.5);
      Q(CU, a, c, c1, a1); Q(CU, c, b, b1, c1); onF(GL, Fo, uo(um), outl(1.6, 20.4, 22.4, 'p', 3), 0.1);
      // clerestory pair (with mullions)
      onF(GL, Fc, uc(um) - 1.7, outl(2.6, 26.5, 34, 'p'), 0.08); onF(GL, Fc, uc(um) + 1.7, outl(2.6, 26.5, 34, 'p'), 0.08);
      for (const du of [-1.7, 1.7]){ seg(LD, fp(Fc, uc(um) + du, 26.5, 0.14), fp(Fc, uc(um) + du, 35.0, 0.14), 0.09, 3); seg(LD, fp(Fo, uo(um) + du*0.94, 4, 0.14), fp(Fo, uo(um) + du*0.94, 14.4, 0.14), 0.08, 3); }
    }
    for (let i = 0; i <= nb; i++){ const u = i*bay;
      bF(LD, Fo, uo(u), 1.6, FB, 22.5, 1.2); pinn(LD, fp(Fo, uo(u), 0, 0.6)[0], 22.5, fp(Fo, uo(u), 0, 0.6)[2], 1.4, 5.0);
      if (i > 0 && i < nb){ bF(LD, Fc, uc(u), 1.8, 24, 36, 1.4); pinn(LD, fp(Fc, uc(u), 0, 0.7)[0], 36, fp(Fc, uc(u), 0, 0.7)[2], 1.4, 5.5); } }
    bandF(LD, Fo, 19.2, 0.8, 0.5); bandF(LD, Fo, 2.0, 0.6, 0.35);
  }
  // ---------------- crossing with the Guastavino dome ----------------
  const XC1 = 33.0, CZ0 = -17.5, CZ1 = 21.0, xd = (XC + XC1)/2, zd = (CZ0 + CZ1)/2;
  abox(G, XC, XC1, FB, 38, CZ0, CZ1, true);
  { const F = rectF(XC, XC1, CZ0, CZ1);
    for (const k of ['n', 's']){ const f = F[k], m = f.L/2; onF(GL, f, m, outl(9.0, 18, 31, 'r', 8), 0.1); bF(LD, f, m, 12.5, 16, 34.5, 0.4); onF(GL, f, m, outl(9.0, 18, 31, 'r', 8), 0.5);
      bandF(G, f, 37, 1.0, 0.5); for (const u of [3, f.L - 3]) bF(G, f, u, 3.5, FB, 39, 1.0); }
    bandF(G, F.e, 37, 1.0, 0.5); }
  // the batten-seam copper dome (Ennead, 2022) over the 1909 Guastavino tile dome: 40.6 m across, still brown copper
  const DP = [[19.7, 38.0], [19.5, 40.6], [18.5, 44.1], [16.5, 47.3], [13.5, 50.0], [9.7, 52.0], [5.3, 53.2], [2.0, 53.6], [0.0, 53.7]];
  lathe(DM, DP, xd, zd, 40);
  for (let i = 0; i < 40; i++){ const a = i/40*TAU; for (let k = 1; k < DP.length - 2; k++){ const p0 = DP[k], p1 = DP[k + 1];
    seg(B.p({c:'#7a4c35', m:0, lk:0.45}), [xd + Math.cos(a)*(p0[0] + 0.08), p0[1], zd + Math.sin(a)*(p0[0] + 0.08)], [xd + Math.cos(a)*(p1[0] + 0.08), p1[1], zd + Math.sin(a)*(p1[0] + 0.08)], 0.07, 3); } }
  cyl(B.p({c:'#7a4c35', m:0, lk:0.45}), xd, zd, 19.8, 37.6, 38.1, 40, false);
  cyl(DM, xd, zd, [2.3, 1.6], 53.5, 54.3, 16, true);
  // low wall on the unbuilt south transept side
  abox(G, -12.7, 24.7, FB, 12, CZ1, 23.6);
  // ---------------- north transept (one-third built, flat-roofed) ----------------
  { const x0 = -9.4, x1 = 33.3, z0 = -41.0, z1 = CZ0;
    abox(L, x0, x1, FB, 30, z0, z1, true); flat(LD, [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], 30.05);
    const F = rectF(x0, x1, z0, z1);
    winRow(GL, F.n, 1, F.n.L - 1, 4, 3.2, 8, 24, 'p'); winRow(GL, F.w, 2, F.w.L - 2, 2, 3.0, 8, 22, 'p'); winRow(GL, F.e, 2, F.e.L - 2, 2, 3.0, 8, 22, 'p');
    for (const xb of [7.7, 23.85]){ abox(LD, xb - 1.6, xb + 1.6, FB, 33, -46.0, z0 + 0.5); pinn(LD, xb, 33, -44.2, 2.2, 7); }
    for (const k of ['n', 'w', 'e']) crenF(LD, F[k], 30, 1.5, 2.2, 1.1, 0.4);
    bandF(LD, F.n, 4.5, 0.5, 0.3); }
  abox(L, -12.4, -4.0, FB, 18, -25.9, CZ0, true); flat(LD, [[-12.4, -25.9], [-4, -25.9], [-4, CZ0], [-12.4, CZ0]], 18.05);
  // ---------------- choir, ambulatory, chapels and apse (granite) ----------------
  const QZ0 = -7.2, QZ1 = 9.8, QE = 33, QR = 46, XA = 62.0, zA = (QZ0 + QZ1)/2, RA = (QZ1 - QZ0)/2;
  abox(G, XC1, XA, FB, QE, QZ0, QZ1, true);
  gableX(TR, XC1, XA, QZ0 - 0.6, QZ1 + 0.6, QE, QR - QE, G);
  lathe(G, [[RA, FB], [RA, QE]], XA, zA, 10, -HP, HP);
  lathe(TR, [[RA + 0.6, QE], [0.01, QR]], XA, zA, 10, -HP, HP);
  { const F = rectF(XC1, XA, QZ0, QZ1);
    for (const k of ['n', 's']){ winRow(GL, F[k], 1, F[k].L - 1, 5, 2.4, 21, 29.5, 'r'); bandF(G, F[k], QE - 1.2, 1.2, 0.6); bandF(G, F[k], 19.5, 0.6, 0.4); }
    for (let i = 0; i < 5; i++){ const a = -HP + (i + 0.5)/5*PI, x = XA + Math.cos(a)*(RA + 0.08), z = zA + Math.sin(a)*(RA + 0.08), F2 = fc(x - Math.sin(a), z + Math.cos(a), x + Math.sin(a), z - Math.cos(a));
      onF(GL, F2, 1, outl(2.0, 21, 29, 'r'), 0.1); } }
  // choir aisles / side chapels
  prism(G, [[33.4, -29.7], [62.2, -29.7], [62.2, QZ0], [33.4, QZ0]], FB, 18, true, B.p(tileR));
  prism(G, [[42.3, 36.0], [42.3, QZ1], [64.3, QZ1], [64.3, 33.0]], FB, 21, true, B.p(tileR));
  prism(G, [[32.7, 24.8], [32.7, QZ1], [42.3, QZ1], [42.3, 24.8]], FB, 15, true, B.p(tileR));
  hipR(TR, 33.4, 62.2, -29.7, QZ0, 18, 3.5); hipR(TR, 42.3, 64.3, QZ1, 36.0, 21, 4.5);
  { const F1 = rectF(33.4, 62.2, -29.7, QZ0), F2 = rectF(42.3, 64.3, QZ1, 36.0);
    winRow(GL, F1.n, 1, F1.n.L - 1, 6, 2.0, 6, 14, 'r'); winRow(GL, F2.s, 1, F2.s.L - 1, 5, 2.2, 6, 16.5, 'r'); winRow(GL, F2.e, 4, F2.e.L - 2, 3, 2.0, 6, 15, 'r');
    for (const f of [F1.n, F2.s]) for (let u = 0; u <= f.L + 0.1; u += f.L/ (f === F1.n ? 6 : 5)) bF(G, f, u, 1.4, FB, f === F1.n ? 17 : 20, 0.9); }
  // the copper angel Gabriel with his trumpet on the east end of the choir roof
  { const ax = XA + RA*0.2, ay = QR - 1.6, ang = B.p({c:'#5e8a78', m:0, lk:0.7});
    cyl(ang, ax, zA, [0.45, 0.3], ay, ay + 2.4, 6); cyl(ang, ax, zA, 0.28, ay + 2.4, ay + 2.9, 6);
    T3(ang, [ax, ay + 2.2, zA], [ax + 0.4, ay + 3.6, zA - 1.6], [ax, ay + 1.0, zA - 0.8]); T3(ang, [ax, ay + 2.2, zA], [ax + 0.4, ay + 3.6, zA + 1.6], [ax, ay + 1.0, zA + 0.8]);
    seg(ang, [ax, ay + 2.5, zA], [ax + 1.6, ay + 3.2, zA], 0.07, 4); }
  // ambulatory ring and the seven radiating chapels
  lathe(G, [[15.0, FB], [15.0, 17.5]], XA, zA, 14, -HP, HP); lathe(TR, [[15.6, 17.5], [RA, 22.5]], XA, zA, 14, -HP, HP);
  for (let i = 0; i < 7; i++){ const a = -HP + i/6*PI, cx = XA + Math.cos(a)*20.2, cz = zA + Math.sin(a)*20.2;
    if (i === 0 || i === 6) continue;
    cyl(G, cx, cz, 5.6, FB, 14.5, 8, false, a + PI/8); pyr(TR, cx, cz, 6.0, 14.5, 4.2, 8, a + PI/8);
    for (let k = -1; k <= 1; k++){ const b = a + k*0.62, x = cx + Math.cos(b)*5.25, z = cz + Math.sin(b)*5.25, F2 = fc(x - Math.sin(b), z + Math.cos(b), x + Math.sin(b), z - Math.cos(b));
      onF(GL, F2, 1, outl(1.5, 5, 11, 'r'), 0.12); } }
  // ---------------- the Town Building south of the crossing (inside the hull; kept as a plain block on its footprint) ----------------
  { const P = [[-14.8, 51.9], [-14.5, 31.1], [-4.2, 31.3], [-3.6, 22.1], [-2.2, 22.2], [-2.8, 36.5], [6.5, 36.6], [6.5, 28.0], [26.0, 28.4], [25.5, 56.2], [6.2, 55.9], [6.3, 46.8], [-4.8, 46.7], [-4.8, 51.9]];
    const TB = B.p({c:'#b8a68e', m:0, lk:0.45}); prism(TB, P, FB, 16.9, true, B.p('#7d746a'));
    for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], Lq = Math.hypot(b[0] - a[0], b[1] - a[1]); if (Lq < 6) continue;
      const F = fc(b[0], b[1], a[0], a[1]), n = Math.floor(Lq/3.2); for (let f = 0; f < 4; f++) winRow(GL, F, 0.8, Lq - 0.8, n, 1.3, 2.0 + f*3.7, 4.2 + f*3.7, 's', 0.08); } }
  // ---------------- base course, steps on Amsterdam Avenue ----------------
  for (let k = 0; k < 5; k++) abox(LD, XF - 4.2 - (4 - k)*0.9, XF - 3.3, -1.2 + k*0.3, -0.9 + k*0.3, -13.0, 17.0);
  B.flush(g);
  return g; }};
place('nystjohn', 40.8038, -73.9619, 20.0, 6.0, -28.2*PI/180);

// =====================================================================================================================
// Riverside Church (Allen, Pelton & Collens with Henry C. Pelton, 1927-30; French Gothic after Chartres): Indiana limestone.
// The nave runs north-south along Riverside Drive (five bays, clerestory, steep terne-metal roof), the chancel with its
// polygonal apse and two entrance pavilions to the north (122nd Street); the 120 m tower over the main entrance near the south
// end: a square base with the west portal (archivolts, pediment, seven niches, rose window) rising in five setback stages,
// becoming an octagon, belfry of the 74-bell carillon, four slender corner niches, an arcaded railing round the observation
// deck and a shallow conical roof with aviation lights. The one-and-a-half-storey cloister passage runs east to Claremont Avenue.
// Frame: local -z = north-north-east along Riverside Drive (the avenue grid), +x = east-south-east; origin = ref point (-2, 7);
// rot = -29.4 deg (measured on the OSM footprint).
LANDMARKS.nyriverside = {zh:'河滨教堂', en:'Riverside Church', cat:'old', r:62, h:120,
  lt:{m:0, c:'#ffe4bf', k:0.9, e:0.62, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB();
  const lime = {c:'#d2c9b6', m:0, lk:0.95}, limeD = {c:'#bcb29e', m:0, lk:0.8}, roof = {c:'#545b5d', m:0, lk:0.25};
  const glass = {c:'#2a313b', glow:'#ffcb8a', gk:0.16}, bell = {c:'#262a30', glow:'#ffd9a0', gk:0.35}, door = '#4a3a2a', dark = '#3a3936';
  const L = B.p(lime), LD = B.p(limeD), RF = B.p(roof), GL = B.p(glass), BL = B.p(bell), DR = B.p(door), DK = B.p(dark);
  const FB = -6.5;
  // ---------------- nave (five bays) ----------------
  const NX0 = -12.6, NX1 = 5.4, AX0 = -17.6, AX1 = 10.4, NV0 = -40.0, NV1 = 13.0, EAV = 31, RID = 44;
  abox(L, NX0, NX1, FB, EAV, NV0, NV1, true); gableZ(RF, NX0 - 0.6, NX1 + 0.6, NV0, NV1, EAV, RID - EAV, L);
  for (const [x0, x1, s] of [[AX0, NX0, -1], [NX1, AX1, 1]]){
    abox(L, x0, x1, FB, 16, NV0, NV1, true); const xo = s < 0 ? x0 : x1, xi = s < 0 ? x1 : x0;
    Q(RF, [xo - s*-0.4, 16, NV0], [xo - s*-0.4, 16, NV1], [xi, 19.5, NV1], [xi, 19.5, NV0]);
    const Fo = s < 0 ? rectF(x0, x1, NV0, NV1).w : rectF(x0, x1, NV0, NV1).e, Fc = s < 0 ? rectF(NX0, NX1, NV0, NV1).w : rectF(NX0, NX1, NV0, NV1).e;
    const nb = 5, bay = (NV1 - NV0)/nb;
    for (let i = 0; i < nb; i++){ const um = (i + 0.5)*bay;
      onF(GL, Fo, um, outl(4.2, 4, 12.5, 'p'), 0.08); onF(GL, Fc, um, outl(5.6, 21, 29.5, 'p'), 0.08);
      for (const du of [-1.4, 1.4]) seg(LD, fp(Fc, um + du, 21, 0.14), fp(Fc, um + du, 32.0, 0.14), 0.1, 3);
      seg(LD, fp(Fo, um, 4, 0.14), fp(Fo, um, 15.0, 0.14), 0.1, 3); seg(LD, fp(Fc, um - 2.8, 26.8, 0.15), fp(Fc, um + 2.8, 26.8, 0.15), 0.09, 3);
      bF(LD, Fc, um, 0.35, 21, 30, 0.12, 0.08); }
    for (let i = 0; i <= nb; i++){ const u = i*bay;
      bF(LD, Fo, u, 2.0, FB, 18.5, 1.6); const pb = fp(Fo, u, 0, 0.8); pinn(LD, pb[0], 18.5, pb[2], 1.6, 6);
      if (i > 0 && i < nb){ bF(LD, Fc, u, 1.6, 19.5, 29, 1.0); const pc = fp(Fc, u, 0, 0.5); pinn(LD, pc[0], 29, pc[2], 1.3, 4.5); } }
    bandF(LD, Fo, 15.2, 0.8, 0.4); bandF(LD, Fc, EAV - 1.0, 1.0, 0.5);
  }
  // ---------------- chancel: polygonal apse with clerestory, ambulatory, two entrance pavilions ----------------
  const ac = [(NX0 + NX1)/2, NV0], ra = (NX1 - NX0)/2;
  for (let i = 0; i < 5; i++){ const a0 = PI + i/5*PI, a1 = PI + (i + 1)/5*PI;
    const A = [ac[0] + Math.cos(a0)*ra, ac[1] + Math.sin(a0)*ra], Bq = [ac[0] + Math.cos(a1)*ra, ac[1] + Math.sin(a1)*ra];
    Q(L, [A[0], FB, A[1]], [Bq[0], FB, Bq[1]], [Bq[0], EAV, Bq[1]], [A[0], EAV, A[1]]); T3(RF, [A[0], EAV, A[1]], [Bq[0], EAV, Bq[1]], [ac[0], RID, ac[1]]);
    const F = fc(A[0], A[1], Bq[0], Bq[1]); onF(GL, F, F.L/2, outl(3.0, 21, 29, 'p'), 0.08); }
  lathe(L, [[ra + 5.4, FB], [ra + 5.4, 15]], ac[0], ac[1], 10, PI, TAU); lathe(RF, [[ra + 5.8, 15], [ra, 19]], ac[0], ac[1], 10, PI, TAU);
  for (const [x0, x1] of [[AX0, -10.5], [3.5, AX1]]){ abox(L, x0, x1, FB, 19, -49.6, -41.5); hipR(RF, x0, x1, -49.6, -41.5, 19, 3.5);
    const F = rectF(x0, x1, -49.6, -41.5); onF(DK, F.n, F.n.L/2, outl(3.0, 0, 5.5, 'p'), 0.1); winRow(GL, F.n, 0.5, F.n.L - 0.5, 2, 1.6, 9, 15, 'p'); }
  // ---------------- the tower: square base over the narthex, five setback stages, octagonal crown ----------------
  const TX0 = AX0, TX1 = AX1, TV0 = NV1, TV1 = 41.2, tx = (TX0 + TX1)/2, tv = (TV0 + TV1)/2;
  const stage = (h0, h1, half, inset, nWin, wW, kind, isBell) => {
    abox(L, tx - half + inset, tx + half - inset, h0, h1, tv - half + inset, tv + half - inset, true);
    const F = rectF(tx - half + inset, tx + half - inset, tv - half + inset, tv + half - inset);
    for (const k of ['n', 'e', 's', 'w']){ winRow(isBell ? BL : GL, F[k], 2.5, F[k].L - 2.5, nWin, wW, h0 + 2.5, h1 - 3.5 - wW*0.6, kind, 0.08); bandF(LD, F[k], h1 - 1.0, 1.0, 0.45); }
    // corner buttresses with pinnacles
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]){ const cx = tx + sx*(half - 0.9), cz = tv + sz*(half - 0.9);
      abox(LD, cx - 1.3, cx + 1.3, h0, h1 + 0.5, cz - 1.3, cz + 1.3, true); pinn(LD, cx, h1 + 0.5, cz, 1.8, 6.5); }
  };
  // base (0..44): walls between corner buttresses
  abox(L, TX0 + 1.2, TX1 - 1.2, FB, 44, TV0, TV1 - 1.2, true);
  for (const [cx, cz] of [[TX0 + 1.6, TV0 + 1.6], [TX1 - 1.6, TV0 + 1.6], [TX1 - 1.6, TV1 - 1.6], [TX0 + 1.6, TV1 - 1.6]]){
    abox(LD, cx - 1.6, cx + 1.6, FB, 40, cz - 1.6, cz + 1.6, true); abox(LD, cx - 1.2, cx + 1.2, 40, 46, cz - 1.2, cz + 1.2, true); pinn(LD, cx, 46, cz, 1.8, 6); }
  { const F = rectF(TX0 + 1.2, TX1 - 1.2, TV0, TV1 - 1.2), W = F.w, m = W.L/2;
    // the west portal on Riverside Drive: five archivolts under a pediment, seven niches, rose window
    bF(LD, W, m, 13.0, 0, 17.0, 1.6); for (let k = 0; k < 4; k++) onF(k % 2 ? LD : DK, W, m, outl(9.6 - k*1.3, 0, 10.5 - k*0.4, 'p', 6), 1.64 + k*0.03);
    onF(DR, W, m, outl(4.8, 0, 7.6, 'p'), 1.78); bF(LD, W, m, 0.8, 0, 7.0, 0.5, 1.7);
    { const a = fp(W, m - 6.5, 17, 1.6), b = fp(W, m + 6.5, 17, 1.6), c = fp(W, m, 21.5, 1.6), a2 = fp(W, m - 6.5, 17, 0), b2 = fp(W, m + 6.5, 17, 0), c2 = fp(W, m, 21.5, 0); T3(LD, a, b, c); Q(LD, a2, a, c, c2); Q(LD, b, b2, c2, c); }
    for (let i = 0; i < 7; i++) onF(DK, W, m - 7.2 + i*2.4, outl(1.6, 22.5, 25.5, 'p', 3), 0.1);
    rose(B.p({c:'#353048', glow:'#ffd08f', gk:0.5}), LD, W, m, 33.0, 4.8, 12, 0.12);
    for (const k of ['n', 'e', 's']){ winRow(GL, F[k], 3, F[k].L - 3, 2, 3.4, 6, 18, 'p'); winRow(GL, F[k], 3, F[k].L - 3, 2, 3.4, 26, 38, 'p'); }
    winRow(GL, W, 2.5, 7.5, 1, 2.6, 26, 38, 'p'); winRow(GL, W, W.L - 7.5, W.L - 2.5, 1, 2.6, 26, 38, 'p');
    for (const k of ['n', 'e', 's', 'w']){ bandF(LD, F[k], 43.0, 1.0, 0.5); bandF(LD, F[k], 1.5, 0.6, 0.3); }
    // office windows of the tower's lower floors (small, lit at night)
  }
  stage(44, 61, 13.0, 0.4, 2, 3.2, 'p');
  stage(61, 77, 12.0, 0.4, 4, 1.5, 'p');
  stage(77, 91, 11.0, 0.4, 3, 2.2, 'p', true);
  stage(91, 100, 10.2, 0.4, 4, 1.4, 'r', true);
  // octagon (100..108) with five slender windows per face, corner niches, arcaded railing, conical roof
  const ro = 9.0;
  cyl(L, tx, tv, ro, 100, 108, 8, true, PI/8);
  for (let i = 0; i < 8; i++){ const a = PI/8 + i/8*TAU + PI/8, x = tx + Math.cos(a)*ro*Math.cos(PI/8), z = tv + Math.sin(a)*ro*Math.cos(PI/8);
    const F = fc(x - Math.sin(a)*3, z + Math.cos(a)*3, x + Math.sin(a)*3, z - Math.cos(a)*3);
    winRow(BL, F, 0.6, 5.4, 3, 0.9, 101.5, 105.5, 'r', 0.08); }
  cyl(LD, tx, tv, ro + 0.6, 108, 108.7, 8, true, PI/8);
  for (let i = 0; i < 32; i++){ const a = i/32*TAU, rr = ro + 0.35; seg(LD, [tx + Math.cos(a)*rr, 108.7, tv + Math.sin(a)*rr], [tx + Math.cos(a)*rr, 110.0, tv + Math.sin(a)*rr], 0.14, 3); }
  lathe(LD, [[ro + 0.45, 110.0], [ro + 0.45, 110.4]], tx, tv, 16);
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]){ const cx = tx + sx*8.2, cz = tv + sz*8.2;
    cyl(LD, cx, cz, 0.9, 98, 112, 6); for (let k = 0; k < 4; k++){ const a = k*HP + PI/4; seg(LD, [cx + Math.cos(a)*1.2, 108, cz + Math.sin(a)*1.2], [cx + Math.cos(a)*1.2, 113.5, cz + Math.sin(a)*1.2], 0.15, 3); }
    cyl(LD, cx, cz, 1.4, 113.5, 114.2, 6); cyl(LD, cx, cz, [1.2, 0.05], 114.2, 117.5, 6); }
  lathe(RF, [[ro - 0.3, 110.4], [6.0, 113.0], [2.5, 115.6], [0.6, 116.4], [0.0, 116.6]], tx, tv, 16);
  seg(DK, [tx, 116.5, tv], [tx, 119.5, tv], 0.12, 4); abox(B.p(AVI), tx - 0.35, tx + 0.35, 119.3, 120.0, tv - 0.35, tv + 0.35);
  for (const [sx, sz] of [[-1, -1], [1, 1]]) abox(B.p(AVI), tx + sx*8.2 - 0.3, tx + sx*8.2 + 0.3, 117.3, 117.9, tv + sz*8.2 - 0.3, tv + sz*8.2 + 0.3);
  // ---------------- east annex and the cloister passage to Claremont Avenue ----------------
  abox(L, TX1 - 1.2, 18.9, FB, 26, 23.1, 44.8, true); flat(LD, [[TX1 - 1.2, 23.1], [18.9, 23.1], [18.9, 44.8], [TX1 - 1.2, 44.8]], 26.05);
  { const F = rectF(TX1 - 1.2, 18.9, 23.1, 44.8); winRow(GL, F.e, 1, F.e.L - 1, 5, 1.4, 4, 9, 'p'); winRow(GL, F.e, 1, F.e.L - 1, 5, 1.4, 13, 20, 'p'); crenF(LD, F.e, 26, 1.2, 1.8, 0.9, 0.35); crenF(LD, F.s, 26, 1.2, 1.8, 0.9, 0.35); }
  abox(L, TX1 - 1.2, 22.9, FB, 9, 8.7, 23.1, true); abox(L, 22.9, 40.6, FB, 9, 17.5, 23.2, true);
  gableX(RF, TX1 - 1.2, 40.6, 17.3, 23.4, 9, 2.6, L); flat(LD, [[TX1 - 1.2, 8.7], [22.9, 8.7], [22.9, 17.3], [TX1 - 1.2, 17.3]], 9.05);
  { const F = rectF(22.9, 40.6, 17.5, 23.2); winRow(DK, F.n, 0.5, F.n.L - 0.5, 4, 2.6, 0, 5.2, 'p'); winRow(DK, F.s, 0.5, F.s.L - 0.5, 4, 2.6, 0, 5.2, 'p');
    onF(DR, F.e, F.e.L/2, outl(2.6, 0, 4.6, 'p'), 0.1); }
  B.flush(g);
  return g; }};
place('nyriverside', 40.81205, -73.963, -2.0, 7.0, -29.4*PI/180);

// =====================================================================================================================
// General Grant National Memorial (John Hemenway Duncan, 1890-97): the largest mausoleum in North America, white granite.
// A 27.4 m square base with the Doric portico on the south front (six columns between antae, steps flanked by eagles'
// pedestals), the attic over the entrance with the sculpture group (left plain), a circular drum ringed by an Ionic
// colonnade and the stepped conical roof (46.9 m). Frame: +z = south (the entrance, towards 122nd Street), rot = -21 deg.
LANDMARKS.nygrant = {zh:'格兰特将军国家纪念堂', en:'General Grant National Memorial', cat:'old', r:36, h:47,
  lt:{m:0, c:'#fff0d8', k:1.0, e:0.55, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB();
  const gr = {c:'#d9d5cb', m:0, lk:1.0}, grD = {c:'#c3beb2', m:0, lk:0.85}, dark = '#3b3a37', bronze = '#4a3f33', pave = {c:'#bdb7ab', m:0, lk:0.35};
  const G = B.p(gr), GD = B.p(grD), DK = B.p(dark), BR = B.p(bronze), PV = B.p(pave);
  const S = 13.45, FB = -4.5, YB = 1.2;                  // half side, foundation, top of the stylobate
  // stylobate and plaza with the steps to the south
  abox(GD, -S - 0.6, S + 0.6, FB, YB, -S - 0.6, S + 0.6, true);
  for (let k = 0; k < 6; k++) abox(GD, -9.5, 9.5, FB, YB - k*0.2, S + 0.6 + k*0.42, S + 1.02 + k*0.42);
  for (const sx of [-1, 1]) abox(G, sx*10.6 - 1.1, sx*10.6 + 1.1, FB, YB + 2.0, S + 0.6, S + 3.2, true);
  abox(PV, -24, 24, -2.6, 0.05, -22, 25, true);
  // the base block: walls with a recessed portico on the south, cornice and attic
  const YC = 22.0;
  abox(G, -S, S, YB, YC, -S, S - 4.6, true);
  for (const sx of [-1, 1]) abox(G, sx*(S - 2.0) - 2.0, sx*(S - 2.0) + 2.0, YB, YC, S - 4.6, S, true);       // antae
  abox(GD, -S + 4.0, S - 4.0, YB, YB + 0.3, S - 4.6, S);
  // six Doric columns (fluted look: 12 sides)
  for (let i = 0; i < 6; i++){ const x = -8.0 + i*3.2; cyl(G, x, S - 1.6, [0.85, 0.72], YB + 0.3, YC - 2.6, 12, false); abox(GD, x - 0.9, x + 0.9, YC - 2.6, YC - 2.2, S - 2.5, S - 0.7); }
  // the bronze doors in the recess
  { const F = fc(-S, S - 4.6, S, S - 4.6); onF(DK, F, S, outl(4.4, YB + 0.3, YB + 9.5, 's'), 0.06); onF(BR, F, S, outl(3.6, YB + 0.3, YB + 8.8, 's'), 0.1); }
  // entablature, cornice, the attic block over the portico and the stepped attic of the cube
  abox(GD, -S - 0.4, S + 0.4, YC - 2.2, YC - 0.8, -S - 0.4, S + 0.4); abox(G, -S - 0.8, S + 0.8, YC - 0.8, YC, -S - 0.8, S + 0.8);
  { const F = rectF(-S, S, -S, S); for (const k of ['n', 'e', 'w']){ winRow(DK, F[k], 4, F[k].L - 4, 1, 2.0, 9, 15, 's', 0.06); bF(GD, F[k], F[k].L/2, 7.0, YB, YC - 2.2, 0.5); } }
  abox(G, -S + 0.6, S - 0.6, YC, YC + 2.4, -S + 0.6, S - 0.6, true);
  abox(G, -8.5, 8.5, YC, YC + 4.6, S - 2.2, S + 0.2, true); abox(GD, -9.0, 9.0, YC + 4.6, YC + 5.1, S - 2.4, S + 0.4);
  for (const sx of [-1, 1]){ cyl(GD, sx*4.6, S - 0.6, 0.9, YC + 4.6, YC + 6.4, 8); cyl(GD, sx*4.6, S - 0.6, 0.5, YC + 6.4, YC + 7.1, 8); }
  // the drum: Ionic peristyle round a solid core, entablature and the stepped cone
  const Y0 = YC + 2.4, RC = 9.2, RP = 11.3, NCOL = 24, YCOL = Y0 + 11.6;
  cyl(GD, 0, 0, 12.3, Y0, Y0 + 0.9, 32, true);
  cyl(G, 0, 0, RC, Y0 + 0.9, YCOL + 2.0, 32, false);
  for (let i = 0; i < 12; i++){ const a = (i + 0.5)/12*TAU, F = radF(0, 0, a, RC, 1);
    onF(DK, F, 1, outl(1.3, Y0 + 3.5, Y0 + 8.0, 'r', 3), 0.06); }
  for (let i = 0; i < NCOL; i++){ const a = i/NCOL*TAU, x = Math.cos(a)*RP, z = Math.sin(a)*RP;
    cyl(G, x, z, [0.55, 0.47], Y0 + 0.9, YCOL - 0.6, 10, false); cyl(GD, x, z, 0.72, YCOL - 0.6, YCOL, 4, false, a + PI/4); }
  lathe(GD, [[RP + 0.95, YCOL], [RP + 0.95, YCOL + 1.4], [RP + 1.35, YCOL + 1.9], [RP + 1.35, YCOL + 2.3], [RC + 1.0, YCOL + 2.3]], 0, 0, 32);
  // stepped cone
  const steps = [[RC + 1.0, YCOL + 2.3], [RC + 0.2, YCOL + 3.5], [RC - 1.0, YCOL + 4.7], [RC - 2.2, YCOL + 5.9], [RC - 3.4, YCOL + 7.0], [RC - 4.6, YCOL + 8.0], [RC - 5.8, YCOL + 9.0], [2.6, YCOL + 9.6]];
  const prof = []; for (let k = 0; k < steps.length; k++){ prof.push(steps[k]); if (k < steps.length - 1) prof.push([steps[k][0], steps[k + 1][1]]); }
  prof.push([0, steps[steps.length - 1][1] + 0.5]);
  lathe(G, prof, 0, 0, 32);
  B.flush(g);
  return g; }};
place('nygrant', 40.8134, -73.9631, 4.15, -6.05, -21*PI/180);

// =====================================================================================================================
// Columbia University, Morningside campus (McKim, Mead & White). Low Memorial Library (1895-97): a Greek-cross plan in
// Indiana limestone and granite on its terrace, the portico of ten Ionic columns facing south, the raised central block and
// the drum with the shallow granite saucer dome; in front the Low Steps with the plaza, the two fountains and Alma Mater
// (Daniel Chester French, 1903) on her pedestal. Butler Library (James Gamble Rogers, 1934) faces it across South Field:
// a long limestone block with the giant Ionic colonnade of fourteen columns on its north front (its frieze left plain).
// Frames: local +z = south (towards Butler / 116th Street), +x = east-south-east along the street grid, rot = -29 deg.
LANDMARKS.nycolumbia = {zh:'哥伦比亚大学洛氏纪念图书馆', en:'Columbia University – Low Memorial Library', cat:'old', r:90, h:34,
  lt:{m:0, c:'#ffe6c4', k:0.95, e:0.5, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB();
  const lime = {c:'#d6cebd', m:0, lk:0.95}, limeD = {c:'#c2b9a6', m:0, lk:0.8}, gran = {c:'#b4aea2', m:0, lk:0.85}, pave = {c:'#b7ad9c', m:0, lk:0.3};
  const glass = {c:'#2d343c', glow:'#ffd29a', gk:0.25}, dark = '#3d3c39', bronze = {c:'#5a4b36', m:0, lk:0.6}, water = {c:'#5d7d8c', glow:'#7fb6d8', gk:0.25}, lamp = {c:'#fff1d6', glow:'#ffe2b0', gk:1.0};
  const L = B.p(lime), LD = B.p(limeD), G = B.p(gran), PV = B.p(pave), GL = B.p(glass), DK = B.p(dark), BZ = B.p(bronze);
  const FB = -3.5, cx = -0.5, cz = -1.0;
  // ---------------- terrace, the Low Steps, the plaza ----------------
  abox(PV, -36, 36, FB, 0.0, -36, 31.5, true);
  const flight = (x0, x1, v0, v1, y0, y1, n) => { for (let k = 0; k < n; k++){ const a = v0 + (v1 - v0)*k/n, b = v0 + (v1 - v0)*(k + 1)/n, y = y0 + (y1 - y0)*(k + 1)/n; abox(PV, x0, x1, FB, y, Math.min(a, b), Math.max(a, b), true); } };
  flight(-27, 27, 31.5, 41.0, -0.15, -1.2, 7);
  abox(PV, -40, 40, FB, -1.2, 41.0, 73.0, true);
  flight(-36, 36, 73.0, 82.0, -1.35, -2.25, 6);
  for (const sx of [-1, 1]){ abox(LD, sx*28 - 1.0, sx*28 + 1.0, FB, 0.9, 31.5, 41.0); abox(LD, sx*37 - 1.0, sx*37 + 1.0, FB, -0.4, 73.0, 82.0); }
  // fountains (diamond pools) and lamp standards on the plaza
  for (const sx of [-1, 1]){ const fx = sx*23.5, fz = 69.5, P = [[fx, fz - 4.5], [fx + 4.5, fz], [fx, fz + 4.5], [fx - 4.5, fz]];
    prism(LD, P, -1.2, -0.75, false); flat(B.p(water), P.map(p => [fx + (p[0] - fx)*0.85, fz + (p[1] - fz)*0.85]), -0.85); cyl(LD, fx, fz, 0.5, -1.2, 0.3, 8); }
  for (const x of [-33, -12, 12, 33]) for (const z of [44, 70]){ seg(BZ, [x, -1.2, z], [x, 3.2, z], 0.09, 4); abox(B.p(lamp), x - 0.25, x + 0.25, 3.2, 3.8, z - 0.25, z + 0.25); }
  // Alma Mater: the seated bronze figure on her granite pedestal, arms raised, sceptre (simplified)
  { const ax = -0.7, az = 50.8; abox(G, ax - 1.8, ax + 1.8, -1.2, 0.9, az - 1.6, az + 1.6); abox(G, ax - 1.3, ax + 1.3, 0.9, 2.3, az - 1.2, az + 1.2);
    abox(BZ, ax - 1.0, ax + 1.0, 2.3, 3.2, az - 0.9, az + 0.9); abox(BZ, ax - 0.55, ax + 0.55, 3.2, 4.3, az - 0.45, az + 0.35); cyl(BZ, ax, az, 0.26, 4.3, 4.85, 8);
    seg(BZ, [ax - 0.5, 4.0, az], [ax - 1.2, 4.6, az + 0.3], 0.13, 4); seg(BZ, [ax + 0.5, 4.0, az], [ax + 1.2, 4.8, az + 0.2], 0.13, 4); seg(BZ, [ax + 1.25, 3.1, az + 0.25], [ax + 1.25, 5.6, az + 0.25], 0.05, 4);
    abox(BZ, ax - 0.9, ax + 0.9, 2.3, 2.9, az + 0.6, az + 1.5); }
  // ---------------- the library: Greek cross (0..20 m) on a rusticated base ----------------
  const RING = [[-29.8, 17.2], [-29.8, -17.3], [-21.1, -17.3], [-17.3, -21.6], [-17.4, -30.3], [17.5, -30.4], [17.6, -21.5], [21.4, -17.2], [29.9, -17.3], [29.4, 17.2], [21.1, 17.1], [17.3, 21.2], [17.3, 25.0], [-17.2, 25.0], [-17.1, 21.1], [-21.1, 17.2]];
  prism(L, RING, FB, 20.0, true, B.p(limeD));
  for (let i = 0; i < RING.length; i++){ const a = RING[i], b = RING[(i + 1) % RING.length], Lq = Math.hypot(b[0] - a[0], b[1] - a[1]); if (Lq < 3) continue;
    const F = fc(b[0], b[1], a[0], a[1]);
    bandF(LD, F, 0, 3.0, 0.3); bandF(LD, F, 16.6, 0.9, 0.5); bandF(LD, F, 19.2, 0.8, 0.45);
    if (Lq > 8){ const n = Math.max(1, Math.round(Lq/6.5)); winRow(GL, F, 1.5, Lq - 1.5, n, 2.2, 4.5, 8.0, 's'); winRow(GL, F, 1.5, Lq - 1.5, n, 2.0, 10.5, 13.2, 's');
      for (let k = 0; k <= n; k++) bF(LD, F, 1.5 + (Lq - 3)*k/n, 0.9, 3.0, 16.6, 0.25); } }
  // balustrade on the roofs of the arms
  for (let i = 0; i < RING.length; i++){ const a = RING[i], b = RING[(i + 1) % RING.length], Lq = Math.hypot(b[0] - a[0], b[1] - a[1]); if (Lq < 3) continue;
    const F = fc(b[0], b[1], a[0], a[1]); bF(LD, F, Lq/2, Lq, 20.0, 20.3, 0.5, -0.5); bF(LD, F, Lq/2, Lq, 21.0, 21.25, 0.5, -0.5);
    for (let u = 0.4; u < Lq - 0.2; u += 0.65) bF(LD, F, u, 0.22, 20.3, 21.0, 0.25, -0.35); }
  // the south portico: ten Ionic columns before the recessed wall, entablature and attic (plain frieze)
  abox(L, -14.6, 14.1, FB, 0.6, 25.0, 30.5, true);
  for (let i = 0; i < 10; i++){ const x = -13.2 + i*2.93; cyl(L, x, 29.0, [0.66, 0.58], 0.6, 13.6, 12, false); abox(LD, x - 0.85, x + 0.85, 13.6, 14.2, 28.15, 29.85); abox(LD, x - 0.8, x + 0.8, 0.6, 1.1, 28.2, 29.8); }
  abox(LD, -14.6, 14.1, 14.2, 16.2, 27.9, 30.3); abox(L, -14.9, 14.4, 16.2, 17.1, 27.6, 30.6); abox(L, -14.6, 14.1, 17.1, 20.0, 25.0, 30.0, true);
  { const F = fc(-17.2, 25.0, 17.3, 25.0); onF(DK, F, 17.25, outl(3.6, 0.6, 7.5, 's'), 0.06); onF(B.p('#4d3f2f'), F, 17.25, outl(2.8, 0.6, 6.8, 's'), 0.1);
    for (const u of [9.5, 25.0]) onF(GL, F, u, outl(2.2, 3.5, 9.5, 's'), 0.06); }
  // central raised block (20..25 m) and the drum with the saucer dome
  const IN = [[-17.7, 8.9], [-18.0, -10.7], [-15.9, -10.7], [-10.8, -15.5], [-10.8, -18.1], [9.5, -18.3], [9.5, -16.0], [14.8, -11.0], [16.3, -11.0], [16.4, 8.7], [14.2, 8.7], [8.5, 14.1], [8.5, 16.2], [-10.5, 16.2], [-10.5, 14.3], [-16.1, 8.8]];
  prism(L, IN, 18.0, 25.0, true, B.p(limeD));
  for (let i = 0; i < IN.length; i++){ const a = IN[i], b = IN[(i + 1) % IN.length], Lq = Math.hypot(b[0] - a[0], b[1] - a[1]); if (Lq < 4) continue;
    const F = fc(b[0], b[1], a[0], a[1]); bandF(LD, F, 24.2, 0.8, 0.4); if (Lq > 12) onF(GL, F, Lq/2, outl(7.0, 20.8, 22.2, 'r', 6), 0.06); }
  const dx = -0.6, dz = -1.3;
  cyl(L, dx, dz, 15.2, 24.5, 28.6, 32, false); lathe(LD, [[15.6, 27.8], [15.6, 28.6], [15.9, 28.9], [15.2, 29.1]], dx, dz, 32);
  for (let i = 0; i < 16; i++){ const a = (i + 0.5)/16*TAU, F = radF(dx, dz, a, 15.2, 1.2);
    onF(GL, F, 1.2, outl(1.3, 25.3, 27.2, 'r', 3), 0.06); }
  lathe(G, [[15.2, 29.1], [14.2, 30.2], [12.2, 31.3], [9.4, 32.2], [6.0, 32.8], [2.5, 33.1], [0.0, 33.2]], dx, dz, 36);
  cyl(LD, dx, dz, 2.2, 33.0, 33.5, 16); cyl(LD, dx, dz, [1.6, 0.4], 33.5, 34.0, 16);
  B.flush(g);
  return g; }};
place('nycolumbia', 40.808, -73.9622, 30.8, -24.7, -29*PI/180);

LANDMARKS.nycolumbia_b = {zh:'哥伦比亚大学巴特勒图书馆', en:'Columbia University – Butler Library', cat:'old', r:50, h:32, label:false,
  lt:{m:0, c:'#ffe6c4', k:0.85, e:0.5, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB();
  const lime = {c:'#d5ccba', m:0, lk:0.95}, limeD = {c:'#c0b7a4', m:0, lk:0.8}, roof = {c:'#8d877c', m:0, lk:0.2};
  const glass = {c:'#2b323a', glow:'#ffdcae', gk:0.3}, dark = '#3c3b38';
  const L = B.p(lime), LD = B.p(limeD), GL = B.p(glass), DK = B.p(dark);
  const FB = -3.5, X0 = -40.1, X1 = 40.1, Z0 = -24.6, Z1 = 25.3, H = 31.4;
  abox(L, X0, X1, FB, 26.0, Z0, Z1, true); flat(B.p(roof), [[X0, Z0], [X1, Z0], [X1, Z1], [X0, Z1]], 26.05);
  abox(L, -29.7, 29.9, FB, 26.0, -25.5, Z0, true);
  // attic storey set back, and the upper stack block
  abox(L, X0 + 1.5, X1 - 1.5, 26.0, H - 1.2, Z0 + 1.5, Z1 - 1.5, true); flat(B.p(roof), [[X0 + 1.5, Z0 + 1.5], [X1 - 1.5, Z0 + 1.5], [X1 - 1.5, Z1 - 1.5], [X0 + 1.5, Z1 - 1.5]], H - 1.15);
  abox(L, -20, 20, H - 1.2, H, -8, 12, true);
  const F = rectF(X0, X1, Z0, Z1), Fa = rectF(X0 + 1.5, X1 - 1.5, Z0 + 1.5, Z1 - 1.5);
  for (const k of ['n', 'e', 's', 'w']){ bandF(LD, F[k], 0, 6.5, 0.3); bandF(LD, F[k], 6.5, 0.5, 0.45); bandF(LD, F[k], 21.6, 4.4, 0.35); bandF(LD, F[k], 25.6, 0.6, 0.6);
    winRow(GL, Fa[k], 1, Fa[k].L - 1, Math.round(Fa[k].L/3.2), 1.3, 27.0, 29.0, 's'); }
  // side wings: windows in rows; the south and end faces
  for (const k of ['e', 'w', 's']){ const f = F[k], n = Math.round(f.L/4.2); winRow(GL, f, 1.5, f.L - 1.5, n, 1.8, 2.0, 4.8, 's'); winRow(GL, f, 1.5, f.L - 1.5, n, 1.8, 8.5, 12.5, 's'); winRow(GL, f, 1.5, f.L - 1.5, n, 1.8, 14.5, 19.5, 's'); }
  { const f = F.n; for (const [u0, u1] of [[0, 10.4], [f.L - 10.4, f.L]]){ winRow(GL, f, u0 + 1.2, u1 - 1.2, 2, 1.8, 2.0, 4.8, 's'); winRow(GL, f, u0 + 1.2, u1 - 1.2, 2, 1.8, 8.5, 12.5, 's'); winRow(GL, f, u0 + 1.2, u1 - 1.2, 2, 1.8, 14.5, 19.5, 's'); } }
  // the north colonnade: fourteen Ionic columns before tall windows, entablature with the plain frieze
  const Fn = fc(29.9, -25.5, -29.7, -25.5);
  for (let i = 0; i < 13; i++) onF(GL, Fn, 2.3 + (i + 0.5)*(Fn.L - 4.6)/13, outl(2.3, 8.0, 19.8, 's'), 0.06);
  for (let i = 0; i < 14; i++){ const x = 28.4 - i*(56.8/13), z = -26.8; cyl(L, x, z, [0.78, 0.68], 6.5, 20.2, 12, false); abox(LD, x - 0.95, x + 0.95, 20.2, 20.8, z - 0.95, z + 0.95); abox(LD, x - 0.9, x + 0.9, 6.5, 7.1, z - 0.9, z + 0.9); }
  abox(LD, -29.7, 29.9, 20.8, 22.4, -27.9, -25.5); abox(L, -30.0, 30.2, 22.4, 25.4, -27.6, -25.5); abox(LD, -30.3, 30.5, 25.4, 26.2, -28.1, -25.5);
  for (const x of [-12, 0, 12]){ onF(DK, Fn, 29.9 - x, outl(3.0, 0, 5.2, 's'), 0.06); }
  for (let k = 0; k < 4; k++) abox(LD, -14 - k*0.3, 14 + k*0.3, FB, 0 - k*0.18, -25.5 - (k + 1)*0.4, -25.5 - k*0.4);
  B.flush(g);
  return g; }};
place('nycolumbia_b', 40.808, -73.9622, -83.55, 180.98, -29*PI/180);

// ---------------- polygon helpers for irregular plans ----------------
const pip = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0])*(z - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; };
// outward faces of a polygon's edges (longer than minL)
function facesOut(P, minL = 2){ const out = [];
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length]; if (Math.hypot(b[0] - a[0], b[1] - a[1]) < minL) continue;
    let F = fc(a[0], a[1], b[0], b[1]); const m = fp(F, F.L/2, 0, 0.3); if (pip(P, m[0], m[2])) F = fc(b[0], b[1], a[0], a[1]); out.push(F); } return out; }

// =====================================================================================================================
// City College of New York - Shepard Hall (George B. Post, 1903-07): Collegiate Gothic in dark Manhattan schist (excavated
// for the subway) with white glazed terracotta trim - window surrounds, string courses, crenellated parapets, pinnacles.
// The plan is a crescent: the central block with the Great Hall (gabled slate roof, the apse to the west), the entrance front
// with the tower towards Convent Avenue, and two curved wings ending in pavilions with corner turrets.
// Frame: +x = east-north-east (the entrance and tower, Convent Avenue), +z = south-south-east; origin = ref point (31, -36);
// rot = +16 deg (the plan's symmetry axis measured on the OSM footprint).
LANDMARKS.nyccny = {zh:'纽约城市学院谢泼德楼', en:'City College of New York – Shepard Hall', cat:'old', r:86, h:48,
  lt:{m:0, c:'#ffe9cc', k:0.8, e:0.55, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB();
  const schist = {c:'#57595b', m:0, lk:0.55}, tc = {c:'#e9e7df', m:0, lk:1.0}, slate = {c:'#3d444a', m:0, lk:0.25};
  const glass = {c:'#262c33', glow:'#ffd79c', gk:0.28}, door = '#3e3328';
  const S = B.p(schist), W = B.p(tc), SL = B.p(slate), GL = B.p(glass), DR = B.p(door);
  const FB = -7.5;
  // a window with a white terracotta surround (and sill), the glass in front of the wall
  const win = (F, u, w, y0, y1, kind) => { onF(W, F, u, outl(w + 0.5, y0 - 0.35, y1, kind), 0.05); onF(GL, F, u, outl(w, y0, y1, kind), 0.1); };
  const floorsY = [[1.6, 3.9], [5.9, 8.6], [10.3, 13.0], [14.7, 17.4], [18.9, 20.4]];
  const dressFace = (F, nWin, top, opts = {}) => { const m = 1.2, n = nWin || Math.max(1, Math.floor((F.L - 2*m)/3.4)); if (F.L < 3) return;
    for (const [y0, y1] of floorsY){ if (y1 > top - 1) continue; for (let i = 0; i < n; i++) win(F, m + (F.L - 2*m)*(i + 0.5)/n, 1.25, y0, y1, y1 > 18 ? 'p' : 's'); }
    bandF(W, F, 4.6, 0.35, 0.18); bandF(W, F, 9.4, 0.3, 0.15); bandF(W, F, top - 1.0, 0.5, 0.3); crenF(W, F, top, 1.4, 1.5, 0.75, 0.45);
    if (opts.butt) for (let i = 0; i <= n; i++){ const u = m + (F.L - 2*m)*i/n; bF(S, F, u, 0.7, FB, top - 1.5, 0.45); const pp = fp(F, u, 0, 0.25); pinn(W, pp[0], top - 1.5, pp[2], 0.6, 3.4); } };
  // ---------------- the two curved wings ----------------
  const wingN = {inner:[[7.7, -16.0], [7.2, -27.2], [4.5, -36.9], [-0.3, -46.0], [-7.7, -53.5]], outer:[[27.2, -15.5], [25.8, -19.5], [22.8, -39.9], [14.6, -58.0], [5.7, -66.8]],
    pav:[[-12.0, -49.1], [-23.7, -60.7], [-1.3, -83.1], [10.5, -71.6]]};
  const mir = P => P.map(p => [p[0], -p[1]]);
  const wingS = {inner:mir(wingN.inner), outer:mir(wingN.outer), pav:mir(wingN.pav)};
  const WT = 21.5;
  for (const Wg of [wingN, wingS]){
    const P = [...Wg.inner, ...Wg.outer.slice().reverse()];
    prism(S, P, FB, WT, false);
    // pitched slate roof following the curve (ridge on the mid line)
    for (let i = 0; i < Wg.inner.length - 1; i++){ const a = Wg.inner[i], b = Wg.inner[i + 1], c = Wg.outer[i], d = Wg.outer[i + 1];
      const ma = [(a[0] + c[0])/2, (a[1] + c[1])/2], mb = [(b[0] + d[0])/2, (b[1] + d[1])/2];
      Q(SL, [a[0], WT, a[1]], [b[0], WT, b[1]], [mb[0], WT + 4.5, mb[1]], [ma[0], WT + 4.5, ma[1]]); Q(SL, [c[0], WT, c[1]], [d[0], WT, d[1]], [mb[0], WT + 4.5, mb[1]], [ma[0], WT + 4.5, ma[1]]); }
    for (const F of facesOut(P, 4)) dressFace(F, 0, WT, {butt:true});
    // end pavilion with octagonal corner turrets
    prism(S, Wg.pav, FB, 23.5, true, SL);
    const c = [Wg.pav.reduce((s, p) => s + p[0], 0)/4, Wg.pav.reduce((s, p) => s + p[1], 0)/4];
    for (const F of facesOut(Wg.pav, 4)) dressFace(F, 0, 23.5);
    // hipped slate roof of the pavilion
    { const [p0, p1, p2, p3] = Wg.pav, r1 = [(p0[0] + p1[0])/2*0.35 + c[0]*0.65, (p0[1] + p1[1])/2*0.35 + c[1]*0.65], r2 = [(p2[0] + p3[0])/2*0.35 + c[0]*0.65, (p2[1] + p3[1])/2*0.35 + c[1]*0.65];
      const Y = 23.5, H = 6.0, P3 = p => [p[0], Y, p[1]], R1 = [r1[0], Y + H, r1[1]], R2 = [r2[0], Y + H, r2[1]];
      Q(SL, P3(p1), P3(p2), R2, R1); Q(SL, P3(p3), P3(p0), R1, R2); T3(SL, P3(p0), P3(p1), R1); T3(SL, P3(p2), P3(p3), R2); }
    for (const p of Wg.pav){ const tx = p[0] + (c[0] - p[0])*0.06, tz = p[1] + (c[1] - p[1])*0.06;
      cyl(S, tx, tz, 2.2, FB, 26.5, 8, false, PI/8); cyl(W, tx, tz, 2.45, 26.5, 27.2, 8, true, PI/8);
      for (let k = 0; k < 8; k++){ const a = k/8*TAU + PI/8; abox(W, tx + Math.cos(a)*2.1 - 0.35, tx + Math.cos(a)*2.1 + 0.35, 27.2, 28.2, tz + Math.sin(a)*2.1 - 0.35, tz + Math.sin(a)*2.1 + 0.35); }
      pinn(W, tx, 27.2, tz, 0.9, 4.2); for (const y of [9.4, 18.5]) cyl(W, tx, tz, 2.3, y, y + 0.35, 8, false, PI/8); }
  }
  // ---------------- the central block with the Great Hall ----------------
  const CX0 = -27.0, CX1 = 27.2, CZ0 = -16.0, CZ1 = 16.0, CT = 24.0;
  abox(S, CX0, CX1, FB, CT, CZ0, CZ1, true);
  gableX(SL, CX0 - 0.2, CX1, CZ0 - 0.5, CZ1 + 0.5, CT, 10.5, S);
  { const F = rectF(CX0, CX1, CZ0, CZ1);
    for (const k of ['n', 's']){ const f = F[k]; for (let i = 0; i < 3; i++){ const u = f.L*0.2 + i*f.L*0.12; win(f, u, 1.3, 1.6, 3.9, 's'); }
      // the Great Hall's tall traceried windows (between buttresses)
      for (let i = 0; i < 5; i++){ const u = 9 + i*8.6; win(f, u, 3.4, 9.0, 19.5, 'p'); seg(W, fp(f, u, 9, 0.14), fp(f, u, 21.4, 0.14), 0.12, 3); bF(S, f, u + 4.3, 1.2, FB, CT + 1.5, 0.7); const pp = fp(f, u + 4.3, 0, 0.35); pinn(W, pp[0], CT + 1.5, pp[2], 1.0, 4.5); }
      bandF(W, f, 4.6, 0.35, 0.18); bandF(W, f, CT - 1.0, 0.5, 0.3); crenF(W, f, CT, 1.4, 1.5, 0.75, 0.45); } }
  // west end: transept arms and the apse
  abox(S, -36.5, CX0, FB, 22, -20.8, 19.9, true); flat(SL, [[-36.5, -20.8], [CX0, -20.8], [CX0, 19.9], [-36.5, 19.9]], 22.05);
  for (const F of facesOut([[-36.5, -20.8], [CX0, -20.8], [CX0, 19.9], [-36.5, 19.9]], 4)) if (F.nx < 0.5) dressFace(F, 0, 22);
  { const AP = [[-36.4, -13.5], [-41.8, -13.2], [-47.8, -9.6], [-50.9, -4.0], [-51.0, 2.7], [-47.4, 8.7], [-42.0, 11.9], [-36.5, 12.4]];
    prism(S, AP, FB, 21, false); const ac = [-36.5, -0.5];
    for (let i = 0; i < AP.length - 1; i++){ const a = AP[i], b = AP[i + 1]; T3(SL, [a[0], 21, a[1]], [b[0], 21, b[1]], [ac[0], 29, ac[1]]);
      const F = fc(b[0], b[1], a[0], a[1]); win(F, F.L/2, 1.8, 9, 17.5, 'p'); bandF(W, F, 20.4, 0.6, 0.3); bandF(W, F, 4.6, 0.35, 0.18); } }
  // ---------------- the entrance front and the tower ----------------
  abox(S, CX1, 36.6, FB, 26, -15.5, 15.3, true); flat(SL, [[CX1, -15.5], [36.6, -15.5], [36.6, 15.3], [CX1, 15.3]], 26.05);
  { const F = rectF(CX1, 36.6, -15.5, 15.3);
    // the great entrance arch, flanking windows
    bF(W, F.e, F.e.L/2, 9.0, -4.5, 9.5, 0.6); onF(B.p('#2a2724'), F.e, F.e.L/2, outl(5.6, -4.5, 5.6, 'p', 6), 0.65); onF(DR, F.e, F.e.L/2, outl(4.2, -4.5, 3.2, 's'), 0.7);
    for (const u of [4.0, 7.5, F.e.L - 7.5, F.e.L - 4.0]) for (const [y0, y1] of floorsY) win(F.e, u, 1.3, y0, y1, y1 > 18 ? 'p' : 's');
    for (let k = 0; k < 6; k++) abox(W, 36.6 + 0.4 + k*0.5, 36.6 + 0.9 + k*0.5, FB, -0.4 - k*0.6, -5, 5);
    for (const k of ['e', 'n', 's']){ bandF(W, F[k], 4.6, 0.35, 0.18); bandF(W, F[k], 25.0, 0.5, 0.3); crenF(W, F[k], 26, 1.4, 1.5, 0.75, 0.45); }
    dressFace(F.n, 2, 26); dressFace(F.s, 2, 26); }
  const TX0 = 25.0, TX1 = 36.2, TZ0 = -6.6, TZ1 = 6.6, TT = 42.0, tcx = (TX0 + TX1)/2;
  abox(S, TX0, TX1, 26, TT, TZ0, TZ1, true); flat(SL, [[TX0, TZ0], [TX1, TZ0], [TX1, TZ1], [TX0, TZ1]], TT - 0.5);
  { const F = rectF(TX0, TX1, TZ0, TZ1);
    for (const k of ['n', 'e', 's', 'w']){ const f = F[k]; win(f, f.L/2 - 2.1, 1.6, 28, 35.5, 'p'); win(f, f.L/2 + 2.1, 1.6, 28, 35.5, 'p'); bandF(W, f, 36.8, 0.5, 0.3); bandF(W, f, 30.6, 0.3, 0.2);
      crenF(W, f, TT, 1.6, 1.6, 0.8, 0.5); }
    win(F.e, F.e.L/2, 4.2, 17.0, 23.5, 'p'); }
  for (const [x, z] of [[TX0, TZ0], [TX1, TZ0], [TX1, TZ1], [TX0, TZ1]]){ cyl(S, x, z, 1.6, 20, TT + 2.6, 8, false, PI/8); cyl(W, x, z, 1.85, TT + 2.6, TT + 3.2, 8, true, PI/8);
    for (let k = 0; k < 8; k++){ const a = k/8*TAU + PI/8; abox(W, x + Math.cos(a)*1.55 - 0.28, x + Math.cos(a)*1.55 + 0.28, TT + 3.2, TT + 4.0, z + Math.sin(a)*1.55 - 0.28, z + Math.sin(a)*1.55 + 0.28); }
    pinn(W, x, TT + 3.2, z, 0.8, 3.6); for (const y of [30.6, 36.8]) cyl(W, x, z, 1.75, y, y + 0.35, 8, false, PI/8); }
  for (const x of [TX0 + 2.8, TX1 - 2.8]) for (const z of [TZ0, TZ1]) pinn(W, x, TT + 1.6, z, 0.6, 2.8);
  B.flush(g);
  return g; }};
place('nyccny', 40.8202, -73.9486, 31.0, -36.0, 16*PI/180);

// =====================================================================================================================
// The Met Cloisters (Charles Collens, 1934-38): a medieval-style monastery on the hilltop of Fort Tryon Park, granite and
// limestone with low red-tile roofs. The square tower over the north-east (after Saint-Geraud at Monsempron), the
// Fuentidueña Chapel with its apse to the north, the Romanesque and Gothic halls, the Cuxa Cloister on the main level with its
// arcaded galleries round the garden, the Bonnefont and Trie cloister gardens on the lower level to the south, ramparts and
// retaining walls down the steep slope to the west and south. Frame: rot = -20 deg (measured on the OSM footprint),
// +z = south-south-west, origin = the ref anchor.
LANDMARKS.nycloisters = {zh:'大都会修道院博物馆', en:'The Met Cloisters', cat:'old', r:66, h:36,
  lt:{m:0, c:'#ffe1b4', k:0.7, e:0.4, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB();
  const stone = {c:'#b8b0a1', m:0, lk:0.75}, stoneD = {c:'#9f978a', m:0, lk:0.6}, tile = {c:'#9b5c43', m:0, lk:0.3}, col = {c:'#ddd5c4', m:0, lk:0.8};
  const glass = {c:'#2b2f35', glow:'#ffcf94', gk:0.22}, dark = '#33312e', grass = {c:'#5d7a46', m:0, lk:0.15}, pave = {c:'#a69f92', m:0, lk:0.3};
  const S = B.p(stone), SD = B.p(stoneD), T = B.p(tile), C = B.p(col), GL = B.p(glass), DK = B.p(dark), GR = B.p(grass), PV = B.p(pave);
  const FB = -12, LOW = -7.0;
  const arcade = (F, u0, u1, n, y0, y1, d = 0.08) => { for (let i = 0; i < n; i++) onF(DK, F, u0 + (u1 - u0)*(i + 0.5)/n, outl((u1 - u0)/n*0.62, y0, y1, 'r', 4), d); };
  const hall = (x0, x1, z0, z1, y0, eav, rh, ax, wins) => { abox(S, x0, x1, y0, eav, z0, z1, true); if (ax) gableX(T, x0 - 0.4, x1 + 0.4, z0 - 0.5, z1 + 0.5, eav, rh, S); else gableZ(T, x0 - 0.5, x1 + 0.5, z0 - 0.4, z1 + 0.4, eav, rh, S);
    if (wins){ const F = rectF(x0, x1, z0, z1); for (const k of ['n', 'e', 's', 'w']){ const f = F[k]; const n = Math.floor(f.L/4.5); if (n > 0) winRow(GL, f, 1, f.L - 1, n, 0.9, eav - 4.5, eav - 2.2, 'r'); } } };
  // ---------------- the main (upper) level: halls round the Cuxa Cloister ----------------
  const CU = [-13.0, 7.0, -4.5, 13.5];                     // Cuxa garden x0, x1, z0, z1
  abox(SD, -27.5, 21.0, FB, 0.0, -16.3, 18.5, true);       // platform / substructure of the main level
  hall(-27.5, -19.0, -16.3, 18.5, 0, 8.5, 2.6, false, true);         // west range
  hall(-19.0, 18.5, -16.3, -9.0, 0, 9.0, 2.8, true, true);           // north range (Romanesque hall)
  hall(12.0, 21.0, -9.0, 18.5, 0, 7.5, 2.4, false, true);            // east range
  hall(-19.0, 12.0, 17.0, 18.5, 0, 6.0, 0.8, true, false);
  // Cuxa cloister: garden, the arcaded walks with red-tile lean-to roofs
  flat(GR, [[CU[0], CU[2]], [CU[1], CU[2]], [CU[1], CU[3]], [CU[0], CU[3]]], 0.15);
  flat(PV, [[-19.0, -9.0], [12.0, -9.0], [12.0, CU[2]], [-19.0, CU[2]]], 0.08); flat(PV, [[-19.0, CU[3]], [12.0, CU[3]], [12.0, 17.0], [-19.0, 17.0]], 0.08);
  flat(PV, [[-19.0, CU[2]], [CU[0], CU[2]], [CU[0], CU[3]], [-19.0, CU[3]]], 0.08); flat(PV, [[CU[1], CU[2]], [12.0, CU[2]], [12.0, CU[3]], [CU[1], CU[3]]], 0.08);
  for (const [a, b] of [[[CU[0], CU[2]], [CU[1], CU[2]]], [[CU[1], CU[2]], [CU[1], CU[3]]], [[CU[1], CU[3]], [CU[0], CU[3]]], [[CU[0], CU[3]], [CU[0], CU[2]]]]){
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(L/1.9);
    for (let i = 0; i <= n; i++){ const x = a[0] + (b[0] - a[0])*i/n, z = a[1] + (b[1] - a[1])*i/n; cyl(C, x, z, 0.2, 0.6, 3.0, 6, false); abox(C, x - 0.32, x + 0.32, 3.0, 3.35, z - 0.32, z + 0.32); }
    const dx = (b[0] - a[0])/L, dz = (b[1] - a[1])/L, nx = dz, nz = -dx;     // outward from the garden (clockwise loop)
    abox(S, Math.min(a[0], b[0]) - 0.3, Math.max(a[0], b[0]) + 0.3, 0, 0.6, Math.min(a[1], b[1]) - 0.3, Math.max(a[1], b[1]) + 0.3);
    abox(S, Math.min(a[0], b[0]) - 0.3, Math.max(a[0], b[0]) + 0.3, 3.35, 4.3, Math.min(a[1], b[1]) - 0.3, Math.max(a[1], b[1]) + 0.3);
    const o = 4.6; Q(T, [a[0] - dx*0.4, 4.3, a[1] - dz*0.4], [b[0] + dx*0.4, 4.3, b[1] + dz*0.4], [b[0] + dx*0.4 + nx*o, 6.2, b[1] + dz*0.4 + nz*o], [a[0] - dx*0.4 + nx*o, 6.2, a[1] - dz*0.4 + nz*o]); }
  cyl(S, (CU[0] + CU[1])/2, (CU[2] + CU[3])/2, 0.9, 0.15, 0.9, 8); cyl(B.p({c:'#5d7d8c', glow:'#7fb6d8', gk:0.2}), (CU[0] + CU[1])/2, (CU[2] + CU[3])/2, 0.75, 0.9, 0.95, 8);
  for (const [x, z] of [[-8, 1], [2, 1], [-8, 8], [2, 8]]){ cyl(B.p('#5b4a3a'), x, z, 0.15, 0.15, 2.0, 5); cyl(GR, x, z, [1.4, 0.2], 1.6, 4.2, 7); }
  // ---------------- the north-west: Fuentidueña Chapel (apse to the north), Langon chapel, entrance hall ----------------
  hall(-7.8, 3.0, -34.0, -16.3, -1.0, 11.0, 3.6, false, true);
  lathe(S, [[5.2, -1.0], [5.2, 9.5]], -2.4, -34.0, 8, PI, TAU); lathe(T, [[5.6, 9.5], [0.05, 13.5]], -2.4, -34.0, 8, PI, TAU);
  for (let i = 0; i < 3; i++){ const a = PI + (i + 1)/4*PI, x = -2.4 + Math.cos(a)*5.25, z = -34 + Math.sin(a)*5.25; const F = fc(x - Math.sin(a), z + Math.cos(a), x + Math.sin(a), z - Math.cos(a)); onF(GL, F, 1, outl(0.8, 4.5, 7.5, 'r'), 0.08); }
  hall(-19.5, -7.8, -32.8, -16.3, -1.0, 8.0, 2.8, false, true);
  hall(-30.0, -19.5, -15.4, -7.6, -1.0, 7.5, 2.4, true, true);
  lathe(S, [[3.6, FB], [3.6, 6.5]], -29.5, -11.5, 8, HP, 3*HP); lathe(T, [[3.9, 6.5], [0.05, 9.0]], -29.5, -11.5, 8, HP, 3*HP);
  // ---------------- the east wing with the Froville arcade ----------------
  hall(17.5, 35.2, -17.5, -6.4, -2.0, 8.5, 2.8, true, false);
  { const F = rectF(17.5, 35.2, -17.5, -6.4); arcade(F.e, 0.6, F.e.L - 0.6, 5, 1.2, 5.0); arcade(F.n, 0.8, F.n.L - 0.8, 6, 1.2, 5.0); winRow(GL, F.s, 1, F.s.L - 1, 4, 1.4, 2.0, 5.5, 'p'); }
  abox(SD, 17.5, 35.2, FB, -2.0, -17.5, -6.4, true);
  // ---------------- the tower (after Saint-Geraud at Monsempron) ----------------
  const TX0 = 3.4, TX1 = 16.6, TZ0 = -28.3, TZ1 = -16.4, TT = 31.0, tx = (TX0 + TX1)/2, tz = (TZ0 + TZ1)/2;
  abox(S, TX0, TX1, FB, TT, TZ0, TZ1, true);
  { const F = rectF(TX0, TX1, TZ0, TZ1);
    for (const k of ['n', 'e', 's', 'w']){ const f = F[k]; onF(GL, f, f.L/2, outl(1.0, 10, 13, 'r'), 0.08); onF(GL, f, f.L/2, outl(1.2, 16, 19.5, 'r'), 0.08);
      onF(DK, f, f.L/2 - 2.6, outl(2.0, 23.2, 27.5, 'r', 5), 0.08); onF(DK, f, f.L/2 + 2.6, outl(2.0, 23.2, 27.5, 'r', 5), 0.08); seg(C, fp(f, f.L/2 - 2.6, 23.2, 0.15), fp(f, f.L/2 - 2.6, 26.6, 0.15), 0.13, 4); seg(C, fp(f, f.L/2 + 2.6, 23.2, 0.15), fp(f, f.L/2 + 2.6, 26.6, 0.15), 0.13, 4);
      bandF(SD, f, 21.8, 0.5, 0.3); bandF(SD, f, TT - 0.8, 0.8, 0.45); bandF(SD, f, 14.8, 0.4, 0.25);
      for (const u of [0.6, f.L - 0.6]) bF(SD, f, u, 1.2, FB, 21.8, 0.5); } }
  hipR(T, TX0 - 0.6, TX1 + 0.6, TZ0 - 0.6, TZ1 + 0.6, TT, 3.6);
  // ---------------- the lower level to the south: Bonnefont and Trie cloister gardens, ramparts ----------------
  abox(SD, -27.3, 21.0, FB - 4, LOW, 18.5, 36.5, true); abox(SD, -21.0, 20.9, FB - 4, LOW, 36.5, 50.3, true);
  // Bonnefont (west half, overlooking the Hudson): garden with a gallery on two sides
  flat(GR, [[-25.5, 21.0], [-4.0, 21.0], [-4.0, 34.5], [-25.5, 34.5]], LOW + 0.15); flat(PV, [[-27.3, 18.5], [-2.0, 18.5], [-2.0, 36.5], [-27.3, 36.5]], LOW + 0.06);
  for (let i = 0; i <= 10; i++){ const x = -25.5 + i*2.15; cyl(C, x, 20.4, 0.17, LOW, LOW + 2.6, 6, false); }
  abox(S, -26.0, -3.0, LOW + 2.6, LOW + 3.3, 19.6, 21.2); Q(T, [-26.4, LOW + 3.3, 21.6], [-2.6, LOW + 3.3, 21.6], [-2.6, LOW + 4.6, 18.5], [-26.4, LOW + 4.6, 18.5]);
  // Trie (east half): enclosed garden with arcaded walks and a red-tile roof round it
  const TR = [-1.5, 19.0, 22.5, 47.5];
  abox(S, -2.0, 20.9, LOW, LOW + 4.2, 19.0, 21.0, true); abox(S, -2.0, 20.9, LOW, LOW + 4.2, 48.3, 50.3, true); abox(S, 18.9, 20.9, LOW, LOW + 4.2, 21.0, 48.3, true); abox(S, -2.0, 0.0, LOW, LOW + 4.2, 21.0, 48.3, true);
  flat(GR, [[TR[0] + 2, TR[2]], [TR[1] - 2, TR[2]], [TR[1] - 2, TR[3]], [TR[0] + 2, TR[3]]], LOW + 0.15);
  for (const [x0, x1, z0, z1] of [[0, 18.9, 21.0, 23.0], [0, 18.9, 46.3, 48.3], [0, 2.0, 23.0, 46.3], [16.9, 18.9, 23.0, 46.3]]) flat(T, [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], LOW + 4.25);
  { const F = rectF(-2.0, 20.9, 19.0, 50.3); arcade(F.s, 1, F.s.L - 1, 7, LOW + 0.5, LOW + 2.8); arcade(F.e, 1, F.e.L - 1, 9, LOW + 0.5, LOW + 2.8); }
  // ramparts: battered retaining walls and crenellations on the west and the south (down the slope)
  for (const F of [fc(-27.3, 18.5, -27.3, 36.5), fc(-27.3, 36.5, -21.0, 36.5), fc(-21.0, 50.3, 20.9, 50.3), fc(20.9, 50.3, 20.9, 18.5)].map(F => F)){
    // wall face orientation: make it outward (west / south / east)
    const Fo = F.nx < -0.5 || F.nz > 0.5 || F.nx > 0.5 ? F : fc(F.ax + F.tx*F.L, F.az + F.tz*F.L, F.ax, F.az);
    crenF(SD, Fo, LOW, 1.3, 1.6, 0.8, 0.5); bandF(SD, Fo, FB - 4, (LOW - FB + 4) - 1.0, 0.6); }
  { const F = fc(-27.5, -16.3, -27.5, 18.5); crenF(SD, fc(-27.5, 18.5, -27.5, -16.3).nx < 0 ? fc(-27.5, 18.5, -27.5, -16.3) : F, 8.5, 0.01, 2, 1, 0.01); }
  // the entrance drive arch on the north and a terrace
  abox(SD, -22.0, -9.0, FB, -1.0, -40.0, -32.8, true); abox(S, -21.0, -17.0, -1.0, 5.5, -40.0, -37.5, true); abox(S, -14.0, -10.0, -1.0, 5.5, -40.0, -37.5, true);
  abox(S, -21.0, -10.0, 5.5, 7.0, -40.0, -37.5, true); onF(DK, fc(-21.0, -40.0, -10.0, -40.0).nz < 0 ? fc(-21.0, -40.0, -10.0, -40.0) : fc(-10.0, -40.0, -21.0, -40.0), 5.5, outl(3.0, -1.0, 4.0, 'r', 5), 0.06);
  B.flush(g);
  return g; }};
place('nycloisters', 40.8649, -73.9318, 0.0, 0.0, -20*PI/180);

// =====================================================================================================================
// The High Bridge (John B. Jervis, 1837-48, the Croton Aqueduct over the Harlem River; the five river arches replaced in
// 1927-28 by one steel arch; reopened as a walkway in 2015): Maine granite piers and semicircular arches, the steel arch of
// ~133 m between the two river piers, the brick walkway between parapets 42.7 m above the river, Victorian lamp posts; the
// arches are lit at night. The app's 70 m terrain is smoother than the real banks: the Manhattan end rests on a rock bluff
// (Highbridge Park's schist cliff) rising to the water tower; on the Bronx side the arcade continues up the slope to the
// abutment near University Avenue. Every road below (Harlem River Drive and its viaduct, the Greenway, Exterior Street,
// the Metro-North Hudson Line, the Major Deegan Expressway and its ramps, Sedgwick Avenue) passes between the piers.
// Frame: local +x = along the bridge to the Bronx (east-south-east, rot = -6.89 deg, the OSM bridge outline), +z = south-
// south-west; origin = 179 m along the bridge from its Manhattan end. Heights are planned in
// world metres: the app places y = 0 at the highest ground within r (computed offline: 24.32 m).
const HB = {base:24.32, s0:179.0,
  // ground along the axis every 10 m from s = -100 (min over +-12 m and the max), world metres
  gmin:[55.0, 47.5, 39.2, 31.0, 22.7, 14.5, 6.2, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, 1.4, 3.3, 5.2, 7.0, 8.9, 10.8, 12.7, 15.1, 17.6, 19.8, 22.1, 24.4, 26.8, 29.2, 31.5, 33.8, 36.0, 38.3, 40.5, 42.6, 44.7],
  gwide:[54.7, 46.6, 38.7, 30.8, 22.8, 14.7, 6.5, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, 1.2, 3.0, 4.9, 6.8, 8.6, 10.5, 12.4, 14.9, 17.4, 19.5, 21.5, 23.6, 25.8, 28.0, 30.5, 32.9, 35.3, 37.7, 40.0, 42.3, 44.2],
  gmax:[55.9, 47.7, 39.8, 32.0, 24.2, 16.3, 8.3, 3.2, 2.5, 1.8, 1.1, 0.6, 0.2, -0.1, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, 0.1, 2.0, 3.8, 5.7, 7.6, 9.5, 11.3, 13.3, 15.4, 17.7, 20.4, 23.1, 25.8, 28.6, 31.4, 33.6, 35.6, 37.6, 39.5, 41.4, 43.3, 45.2]};
const hbG = (T, s) => { const f = Math.min(T.length - 1.0001, Math.max(0, (s + 100)/10)), i = Math.floor(f), t = f - i; return T[i]*(1 - t) + T[i + 1]*t; };
LANDMARKS.nyhighbridge = {zh:'高桥', en:'High Bridge', cat:'old', r:275, h:32,
  lt:{m:0, c:'#ffe3b8', k:1.0, e:0.85, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
  const gran = {c:'#aaa294', m:0, lk:1.0}, granL = {c:'#bdb5a6', m:0, lk:1.0}, granD = {c:'#8f887c', m:0, lk:0.7}, brick = {c:'#8d5a46', m:0, lk:0.5};
  const steel = {c:'#848b84', m:0, lk:0.9}, steelD = {c:'#6c736c', m:0, lk:0.6}, walk = {c:'#9a6a55', m:0, lk:0.2}, rock = {c:'#6f6a62', m:0, lk:0.25}, rockL = {c:'#827b70', m:0, lk:0.25};
  const grass = {c:'#5f7a48', m:0, lk:0.1}, post = '#2f3a33', lamp = {c:'#fff1d6', glow:'#ffdba0', gk:1.4}, tree = {c:'#4e6b3c', m:0, lk:0.1};
  const GR = B.p(gran), GL = B.p(granL), GD = B.p(granD), BR = B.p(brick), ST = B.p(steel), SD = B.p(steelD), WK = B.p(walk), RK = B.p(rock), RL = B.p(rockL), GS = B.p(grass), PO = B.p(post), LP = B.p(lamp);
  const Y = h => h - HB.base, X = s => s - HB.s0;                   // world height -> local, along-bridge s -> local x
  const YD = 42.7, YM = 41.6, YC = 39.4, HW = 3.8;                   // walkway, top of the masonry, arch crowns, half width of the spandrels
  const gmin = s => hbG(HB.gmin, s), gwide = s => hbG(HB.gwide, s);
  // ---------------- stone arcade ----------------
  const piers = [[16.0, 23.6, 'W'], [155.6, 169.5, 'E'], [193.9, 198.5], [222.9, 227.5], [242.7, 247.3], [270.3, 274.9], [303.0, 307.6], [322.6, 327.2], [338.4, 343.0], [357.6, 362.2], [375.7, 380.3], [393.8, 398.4], [414.0, 418.6]];
  const spans = [[0.0, 16.0], [169.5, 193.9], [198.5, 222.9], [227.5, 242.7], [247.3, 270.3], [274.9, 303.0], [307.6, 322.6], [327.2, 338.4], [343.0, 357.6], [362.2, 375.7], [380.3, 393.8], [398.4, 414.0], [418.6, 430.0]];
  for (const [s0, s1] of spans){
    const R = (s1 - s0)/2, sc = (s0 + s1)/2, ys = YC - R, n = Math.max(10, Math.round(R*2.2));
    const arc = []; for (let i = 0; i <= n; i++){ const a = PI - PI*i/n; arc.push([sc + Math.cos(a)*R, ys + Math.sin(a)*R]); }
    const outline = [[s0, ys], ...arc.slice(1, -1), [s1, ys], [s1, YM], [s0, YM]];
    const T = THREE.ShapeUtils.triangulateShape(outline.map(p => new THREE.Vector2(p[0], p[1])), []);
    for (const w of [-HW, HW]) for (const t of T) T3(GR, ...t.map(k => [X(outline[k][0]), Y(outline[k][1]), w]));
    for (let i = 0; i < n; i++){ const a = arc[i], b = arc[i + 1]; Q(GD, [X(a[0]), Y(a[1]), -HW], [X(b[0]), Y(b[1]), -HW], [X(b[0]), Y(b[1]), HW], [X(a[0]), Y(a[1]), HW]);
      // voussoir ring, slightly proud, both faces
      const ca = [(a[0] - sc)/R, (a[1] - ys)/R], cb = [(b[0] - sc)/R, (b[1] - ys)/R], k = 1.0;
      for (const w of [-HW - 0.12, HW + 0.12]) Q(GL, [X(a[0]), Y(a[1]), w], [X(b[0]), Y(b[1]), w], [X(b[0] + cb[0]*k), Y(b[1] + cb[1]*k), w], [X(a[0] + ca[0]*k), Y(a[1] + ca[1]*k), w]); }
    // impost bands at the springing
    for (const sx of [s0, s1]) abox(GL, X(sx) - (sx === s0 ? 0 : 0.5), X(sx) + (sx === s0 ? 0.5 : 0), Y(ys - 0.5), Y(ys), -HW - 0.2, HW + 0.2);
  }
  // stone piers (battered base); the two big river piers of the steel arch
  for (const [a, b, kind] of piers){
    const bot = Math.min(gmin(a), gmin(b)) - 2.5, top = YM;
    if (kind){
      const hw = 7.5, hw2 = 6.2;
      abox(GR, X(a), X(b), Y(-4), Y(9.0), -hw, hw, true);
      if (kind === 'E'){ for (const sg of [-1, 1]){ const xs = sg < 0 ? X(a) : X(b); prism(GR, [[xs, -hw], [xs + sg*4.0, 0], [xs, hw]].map(p => sg < 0 ? p : p), Y(-4), Y(9.0), true); } }
      abox(GR, X(a) + 0.4, X(b) - 0.4, Y(9.0), Y(top), -hw2, hw2, true); abox(GL, X(a), X(b), Y(8.4), Y(9.0), -hw - 0.2, hw + 0.2);
      abox(GL, X(a) - 0.2, X(b) + 0.2, Y(top - 0.9), Y(top), -hw2 - 0.4, hw2 + 0.4);
      for (const w of [-hw2, hw2]){ const F = w < 0 ? fc(X(b), w, X(a), w) : fc(X(a), w, X(b), w); bF(GL, F, F.L/2, F.L*0.42, Y(9.0), Y(top - 0.9), 0.3); }
      continue; }
    abox(GR, X(a) - 0.7, X(b) + 0.7, Y(bot), Y(Math.max(bot + 4, gmin(a) + 6)), -HW - 1.0, HW + 1.0, true);
    abox(GR, X(a), X(b), Y(bot), Y(top), -HW - 0.35, HW + 0.35, true);
    abox(GL, X(a) - 0.25, X(b) + 0.25, Y(top - 0.8), Y(top), -HW - 0.5, HW + 0.5);
  }
  // abutments: Manhattan (s -6..0) and the Bronx end (s 430..447)
  abox(GR, X(-6.0), X(0.0), Y(gmin(-3) - 2.5), Y(YM), -HW - 1.2, HW + 1.2, true);
  abox(GR, X(430.0), X(443.0), Y(gmin(430) - 2.5), Y(YM), -HW - 0.6, HW + 0.6, true);
  for (const [a, b] of [[430, 443]]) for (let k = 0; k < 4; k++) abox(GD, X(b) + k*0.9, X(b) + (k + 1)*0.9, Y(gmin(b) - 1), Y(YM - 0.4 - k*0.5), -HW, HW, true);
  // ---------------- the steel arch (1928): two ribs, spandrel columns, bracing, the deck ----------------
  const SA = 23.6, SB = 155.6, SM = (SA + SB)/2, HL = (SB - SA)/2, ysp = 6.0, yi = 35.6;
  const intra = s => ysp + (yi - ysp)*(1 - Math.pow((s - SM)/HL, 2)), depth = s => 3.0 + 1.6*Math.pow((s - SM)/HL, 2);
  const NR = 40, RW = 2.7, RB = 0.6;
  for (const w of [-RW, RW]){
    for (let i = 0; i < NR; i++){ const a = SA + (SB - SA)*i/NR, b = SA + (SB - SA)*(i + 1)/NR, ya = intra(a), yb = intra(b), ta = ya + depth(a), tb = yb + depth(b);
      const P = (s, y, ww) => [X(s), Y(y), ww];
      Q(ST, P(a, ya, w - RB), P(b, yb, w - RB), P(b, tb, w - RB), P(a, ta, w - RB)); Q(ST, P(a, ya, w + RB), P(b, yb, w + RB), P(b, tb, w + RB), P(a, ta, w + RB));
      Q(SD, P(a, ya, w - RB), P(b, yb, w - RB), P(b, yb, w + RB), P(a, ya, w + RB)); Q(SD, P(a, ta, w - RB), P(b, tb, w - RB), P(b, tb, w + RB), P(a, ta, w + RB));
      // web stiffener lines on the outer faces
      if (i % 2 === 0){ const wo = w < 0 ? w - RB - 0.05 : w + RB + 0.05; seg(SD, P(a, ya + 0.2, wo), P(a, ta - 0.2, wo), 0.08, 3); } }
  }
  // spandrel columns (pairs) and their struts, cross bracing between the ribs, floor beams
  const NP = 16;
  for (let i = 0; i <= NP; i++){ const s = SA + (SB - SA)*i/NP, top = intra(s) + depth(s);
    if (top < 39.6 - 0.8) for (const w of [-RW, RW]) abox(ST, X(s) - 0.35, X(s) + 0.35, Y(top), Y(39.6), w - 0.4, w + 0.4, true);
    if (top < 39.6 - 3) seg(SD, [X(s), Y(top + 0.5), -RW], [X(s), Y(39.2), RW], 0.12, 3);
    abox(SD, X(s) - 0.3, X(s) + 0.3, Y(intra(s) + depth(s)*0.4), Y(intra(s) + depth(s)*0.6), -RW, RW, true);
    if (i < NP){ const s2 = SA + (SB - SA)*(i + 1)/NP, ya = intra(s) + depth(s)*0.5, yb = intra(s2) + depth(s2)*0.5;
      seg(SD, [X(s), Y(ya), -RW], [X(s2), Y(yb), RW], 0.11, 3); seg(SD, [X(s), Y(ya), RW], [X(s2), Y(yb), -RW], 0.11, 3); } }
  // the deck over the steel span: girders and slab
  abox(ST, X(SA - 1.0), X(SB + 1.0), Y(39.6), Y(41.0), -HW, HW, true);
  for (const w of [-HW - 0.05, HW + 0.05]) abox(SD, X(SA - 1.0), X(SB + 1.0), Y(39.9), Y(40.7), w - 0.06, w + 0.06);
  abox(GD, X(SA - 1.0), X(SB + 1.0), Y(41.0), Y(YM), -HW + 0.2, HW - 0.2, true);
  // ---------------- walkway, parapets, lamps along the whole bridge ----------------
  const W0 = -6.0, W1 = 443.0;
  abox(WK, X(W0), X(W1), Y(YM), Y(YD), -HW + 0.4, HW - 0.4, true);
  for (const sg of [-1, 1]){
    // stone parts: brick parapet with granite coping and the cornice; steel part: railing
    for (const [a, b, stone] of [[W0, SA - 1.0, true], [SA - 1.0, SB + 1.0, false], [SB + 1.0, W1, true]]){
      if (stone){ abox(BR, X(a), X(b), Y(YM), Y(YD + 0.95), sg*(HW - 0.4) - 0.2, sg*(HW - 0.4) + 0.2 + sg*0.35); abox(GL, X(a), X(b), Y(YD + 0.95), Y(YD + 1.15), sg*(HW - 0.4) - 0.3, sg*(HW - 0.4) + 0.3 + sg*0.35);
        abox(GL, X(a), X(b), Y(YM - 0.7), Y(YM), sg*HW - 0.4, sg*HW + 0.45*sg + 0.0 + (sg > 0 ? 0 : 0)); }
      else { for (let s = a; s <= b + 0.01; s += 2.4) abox(PO, X(s) - 0.06, X(s) + 0.06, Y(YD), Y(YD + 1.25), sg*(HW - 0.5) - 0.06, sg*(HW - 0.5) + 0.06);
        for (const y of [YD + 1.2, YD + 0.65]) abox(PO, X(a), X(b), Y(y), Y(y + 0.07), sg*(HW - 0.5) - 0.04, sg*(HW - 0.5) + 0.04); }
    }
  }
  for (let s = W0 + 8, k = 0; s < W1 - 4; s += 22, k++){ const w = (k % 2 ? 1 : -1)*(HW - 0.85);
    abox(PO, X(s) - 0.18, X(s) + 0.18, Y(YD), Y(YD + 0.5), w - 0.18, w + 0.18); seg(PO, [X(s), Y(YD + 0.5), w], [X(s), Y(YD + 3.6), w], 0.07, 5);
    abox(LP, X(s) - 0.22, X(s) + 0.22, Y(YD + 3.6), Y(YD + 4.2), w - 0.22, w + 0.22); cyl(PO, X(s), w, [0.32, 0.05], YD + 4.2 - HB.base, YD + 4.5 - HB.base, 4, false, PI/4); }
  // ---------------- the Manhattan bluff (Highbridge Park's wooded schist cliff) from the abutment to the water tower ----------------
  { const secs = []; const NS = 18, SA0 = -92, SB0 = -2.0, wood = B.p({c:'#56704a', m:0, lk:0.12});
    for (let i = 0; i <= NS; i++){ const s = SA0 + (SB0 - SA0)*i/NS, top = Math.max(YD - 0.3, gmin(s) + 0.2), bot = Math.min(gwide(s), YD) - 3.0, hh = top - bot;
      const wt = 9.5 + rng()*1.5, wb = 18.0 + hh*0.62 + rng()*3.0, jr = () => (rng() - 0.5)*1.6;
      secs.push([[X(s) + jr()*0.5, Y(bot), -wb], [X(s) + jr(), Y(bot + hh*0.35), -wb*0.62 + jr()], [X(s) + jr(), Y(bot + hh*0.75), -wt - hh*0.18 + jr()], [X(s), Y(top), -wt],
        [X(s), Y(top), wt], [X(s) + jr(), Y(bot + hh*0.75), wt + hh*0.18 + jr()], [X(s) + jr(), Y(bot + hh*0.35), wb*0.62 + jr()], [X(s) + jr()*0.5, Y(bot), wb]]); }
    const mat = [RL, RK, wood, GS, wood, RK, RL];
    for (let i = 0; i < NS; i++){ const A = secs[i], Bq = secs[i + 1]; for (let k = 0; k < 7; k++) Q(mat[k], A[k], Bq[k], Bq[k + 1], A[k + 1]); }
    // the river-side cliff face under the abutment: bare rock
    const E = secs[NS], ec = [X(SB0 + 1.2), (E[0][1] + E[3][1])/2, 0]; for (let k = 0; k < 7; k++) T3(k === 3 ? GS : RK, E[k], E[k + 1], ec);
    // the path to the tower on top, trees of the park on the top and the wooded slopes
    for (let i = 0; i < NS; i++){ const A = secs[i], Bq = secs[i + 1]; Q(WK, [A[3][0], A[3][1] + 0.12, -2.2], [Bq[3][0], Bq[3][1] + 0.12, -2.2], [Bq[3][0], Bq[3][1] + 0.12, 2.2], [A[3][0], A[3][1] + 0.12, 2.2]); }
    for (let i = 1; i < NS; i++) for (const sg of [-1, 1]) for (const [k0, k1] of [[3, 2], [2, 1]]){ if (k0 === 3 && i % 2) continue;
      const A = secs[i], k = sg < 0 ? k0 : 7 - k0, k2 = sg < 0 ? k1 : 7 - k1, f = 0.25 + rng()*0.5, p = [A[k][0] + (A[k2][0] - A[k][0])*f, A[k][1] + (A[k2][1] - A[k][1])*f, A[k][2] + (A[k2][2] - A[k][2])*f];
      if (k0 === 3) p[2] = sg*(5.0 + rng()*3.5); const hgt = 5 + rng()*5;
      cyl(B.p('#5b4a3a'), p[0], p[2], 0.25, p[1] - 0.5, p[1] + hgt*0.45, 5); cyl(B.p(tree), p[0] + (rng() - 0.5), p[2], [hgt*0.34, 0.3], p[1] + hgt*0.32, p[1] + hgt, 7); }
  }
  B.flush(g);
  return g; }};
{ const th = 6.89*PI/180, s = HB.s0, ox = -108.0 + Math.cos(th)*s, oz = -27.5 + Math.sin(th)*s; place('nyhighbridge', 40.8422, -73.9303, ox, oz, -th); }

// High Bridge Water Tower (John B. Jervis, 1866-72): an octagonal granite shaft in the Romanesque Revival manner on the cliff
// of Highbridge Park, string courses and arched slit windows of the stair, the arcaded belvedere and the octagonal roof with
// its lantern (~61 m). Second key of the High Bridge (unlabelled). Frame: unrotated, origin = the OSM outline's centroid.
LANDMARKS.nyhighbridge_tower = {zh:'高桥水塔', en:'High Bridge Water Tower', cat:'old', r:10, h:62, label:false,
  lt:{m:0, c:'#ffe1b0', k:1.0, e:0.7, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB();
  const gran = {c:'#b6ae9f', m:0, lk:1.0}, granL = {c:'#c8c0b0', m:0, lk:1.0}, roof = {c:'#4f5753', m:0, lk:0.35}, dark = '#2e2d2b', glow = {c:'#3a342c', glow:'#ffd69a', gk:0.6};
  const G = B.p(gran), GL = B.p(granL), RF = B.p(roof), DK = B.p(dark);
  const a0 = 5*PI/180, FB = -14;
  const R = y => 5.6 - 0.35*Math.max(0, Math.min(1, (y - 6)/38));       // gentle taper of the shaft (vertex radius)
  cyl(GL, 0, 0, 6.3, FB, 1.2, 8, true, a0); cyl(G, 0, 0, [6.0, 5.75], 1.2, 6.0, 8, false, a0);
  lathe(G, [[R(6), 6], [R(44), 44]].map(p => p), 0, 0, 8, a0);
  for (const y of [6.0, 15.0, 24.0, 33.0, 42.0]) cyl(GL, 0, 0, R(y) + 0.3, y, y + 0.6, 8, false, a0);
  // corner pilasters and arched slit windows (spiral stair), door on the east (to the bridge)
  for (let k = 0; k < 8; k++){ const a = a0 + k/8*TAU; seg(GL, [Math.cos(a)*(R(6) + 0.05), 6, Math.sin(a)*(R(6) + 0.05)], [Math.cos(a)*(R(44) + 0.05), 44, Math.sin(a)*(R(44) + 0.05)], 0.28, 4);
    const am = a + PI/8, ra = R(20)*Math.cos(PI/8), F = radF(0, 0, am, ra, 2);
    for (let j = 0; j < 4; j++){ const y = 9 + j*9 + (k % 2)*4.2; if (y < 42) onF(DK, F, 2, outl(0.7, y, y + 2.2, 'r', 3), 0.15); } }
  { const am = a0 + PI/8 + 7/8*TAU, ra = 5.75*Math.cos(PI/8) + 0.06, F = radF(0, 0, am, ra, 2);
    onF(DK, F, 2, outl(1.8, 1.2, 3.6, 'r', 4), 0.1); }
  // corbel table and the belvedere with two arched openings per face
  lathe(GL, [[R(44), 44], [6.1, 45.2], [6.1, 45.6]], 0, 0, 8, a0);
  cyl(G, 0, 0, 6.0, 45.6, 51.0, 8, false, a0);
  for (let k = 0; k < 8; k++){ const am = a0 + PI/8 + k/8*TAU, ra = 6.0*Math.cos(PI/8), F = radF(0, 0, am, ra, 2.3);
    onF(B.p(glow), F, 1.45, outl(1.1, 46.4, 49.2, 'r', 4), 0.08); onF(B.p(glow), F, 3.15, outl(1.1, 46.4, 49.2, 'r', 4), 0.08); }
  lathe(GL, [[6.0, 51.0], [6.6, 51.4], [6.6, 51.9], [6.2, 52.1]], 0, 0, 8, a0);
  // octagonal roof, lantern and finial
  lathe(RF, [[6.5, 52.1], [3.6, 55.6], [1.6, 57.6], [1.2, 57.8]], 0, 0, 8, a0);
  cyl(GL, 0, 0, 1.2, 57.8, 59.4, 8, false, a0); for (let k = 0; k < 8; k++){ const a = a0 + k/8*TAU; }
  lathe(RF, [[1.5, 59.4], [0.12, 61.2]], 0, 0, 8, a0); seg(DK, [0, 61.2, 0], [0, 62.0, 0], 0.05, 4);
  B.flush(g);
  return g; }};
place('nyhighbridge_tower', 40.8422, -73.9303, -196.2, -37.4, 0);

}
