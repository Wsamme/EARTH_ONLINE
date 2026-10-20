// ===== nyc/nyharlem: Harlem, Washington Heights and Inwood (City Brush v32, New York 1:1) =====
// The Apollo Theater (facade, marquee and blade sign: shape and lights only), the Hotel Theresa, the Adam Clayton Powell Jr.
// State Office Building with its plaza, the Harlem Fire Watchtower on the Acropolis of Marcus Garvey Park, the Abyssinian
// Baptist Church, the Morris-Jumel Mansion, Yeshiva University's Zysman Hall, the United Palace, the Dyckman Farmhouse and the
// Henry Hudson Bridge (fixed steel arch, two decks; fitted to the corrected deck profile of nyharlem_deck_fix.py).
// Every model sits on its real OSM footprint (refs: nyc/ref_nyharlem*.json). No text, no logos, no people.
// Frames: Manhattan-grid buildings use rot = -0.5079 (local +x = along the cross streets to the east-south-east, +z = the
// avenue direction to the south-south-west); the origin is the centre of the footprint's bounding rectangle.
{
const PI = Math.PI, TAU = PI*2, HP = PI/2;
// ---------------- triangle batches: everything of one colour spec becomes one LTris call ----------------
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const Q = (o, a, b, c, d) => o.push(...a, ...b, ...c, ...a, ...c, ...d);
const T3 = (o, a, b, c) => o.push(...a, ...b, ...c);
function abox(o, x0, x1, y0, y1, z0, z1, noBot){
  const P = [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]];
  const F = noBot ? [[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]] : [[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]];
  for (const [a, b, c, d] of F) Q(o, P[a], P[b], P[c], P[d]);
}
function rbox(o, w, h, d, x, y, z, ry){
  const c = Math.cos(ry || 0), s = Math.sin(ry || 0), R = (u, v) => [x + u*c + v*s, z - u*s + v*c], hw = w/2, hd = d/2;
  const q = [R(-hw, -hd), R(hw, -hd), R(hw, hd), R(-hw, hd)];
  const P = [...q.map(p => [p[0], y, p[1]]), ...q.map(p => [p[0], y + h, p[1]])];
  for (const [a, b, cc, e] of [[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]) Q(o, P[a], P[b], P[cc], P[e]);
}
function prism(o, P, y0, y1, top = true, ot){
  const n = P.length;
  for (let i = 0; i < n; i++){ const a = P[i], b = P[(i + 1) % n]; Q(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); }
  if (top){ const T = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
    for (const t of T) T3(ot || o, [P[t[0]][0], y1, P[t[0]][1]], [P[t[1]][0], y1, P[t[1]][1]], [P[t[2]][0], y1, P[t[2]][1]]); }
}
const blk = (o, ot, x0, x1, y0, y1, z0, z1) => prism(o, [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], y0, y1, true, ot);
function cyl(o, x, z, r, y0, y1, n, top = true, a0 = 0){
  const rb = Array.isArray(r) ? r[0] : r, rt = Array.isArray(r) ? r[1] : r;
  for (let i = 0; i < n; i++){ const t0 = a0 + i/n*TAU, t1 = a0 + (i + 1)/n*TAU;
    Q(o, [x + Math.cos(t0)*rb, y0, z + Math.sin(t0)*rb], [x + Math.cos(t1)*rb, y0, z + Math.sin(t1)*rb], [x + Math.cos(t1)*rt, y1, z + Math.sin(t1)*rt], [x + Math.cos(t0)*rt, y1, z + Math.sin(t0)*rt]);
    if (top && rt > 0) T3(o, [x, y1, z], [x + Math.cos(t1)*rt, y1, z + Math.sin(t1)*rt], [x + Math.cos(t0)*rt, y1, z + Math.sin(t0)*rt]); }
}
function lathe(o, pts, x, z, n, a0 = 0, a1){
  const span = a1 === undefined ? TAU : a1 - a0;
  for (let k = 0; k < pts.length - 1; k++){ const [r0, y0] = pts[k], [r1, y1] = pts[k + 1];
    for (let i = 0; i < n; i++){ const t0 = a0 + i/n*span, t1 = a0 + (i + 1)/n*span;
      Q(o, [x + Math.cos(t0)*r0, y0, z + Math.sin(t0)*r0], [x + Math.cos(t1)*r0, y0, z + Math.sin(t1)*r0], [x + Math.cos(t1)*r1, y1, z + Math.sin(t1)*r1], [x + Math.cos(t0)*r1, y1, z + Math.sin(t0)*r1]); } }
}
function seg(o, a, b, r, n = 4){
  const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2], L = Math.hypot(dx, dy, dz); if (L < 1e-4) return;
  const d = [dx/L, dy/L, dz/L], up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let ux = d[1]*up[2]-d[2]*up[1], uy = d[2]*up[0]-d[0]*up[2], uz = d[0]*up[1]-d[1]*up[0]; const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
  const vx = d[1]*uz-d[2]*uy, vy = d[2]*ux-d[0]*uz, vz = d[0]*uy-d[1]*ux;
  const ring = p => { const R = []; for (let i = 0; i < n; i++){ const t = (i + 0.5)/n*TAU, c = Math.cos(t)*r, s = Math.sin(t)*r; R.push([p[0]+ux*c+vx*s, p[1]+uy*c+vy*s, p[2]+uz*c+vz*s]); } return R; };
  const A = ring(a), Bq = ring(b); for (let i = 0; i < n; i++){ const j = (i + 1) % n; Q(o, A[i], A[j], Bq[j], Bq[i]); }
}
function gableX(o, x0, x1, z0, z1, y, h, oe){ const zm = (z0 + z1)/2, e = oe || o;
  Q(o, [x0, y, z0], [x1, y, z0], [x1, y + h, zm], [x0, y + h, zm]); Q(o, [x1, y, z1], [x0, y, z1], [x0, y + h, zm], [x1, y + h, zm]);
  T3(e, [x0, y, z0], [x0, y + h, zm], [x0, y, z1]); T3(e, [x1, y, z1], [x1, y + h, zm], [x1, y, z0]); }
function gableZ(o, x0, x1, z0, z1, y, h, oe){ const xm = (x0 + x1)/2, e = oe || o;
  Q(o, [x0, y, z1], [x0, y, z0], [xm, y + h, z0], [xm, y + h, z1]); Q(o, [x1, y, z0], [x1, y, z1], [xm, y + h, z1], [xm, y + h, z0]);
  T3(e, [x0, y, z0], [x1, y, z0], [xm, y + h, z0]); T3(e, [x1, y, z1], [x0, y, z1], [xm, y + h, z1]); }
function hipR(o, x0, x1, z0, z1, y, h){
  const L = x1 - x0, W = z1 - z0, xm = (x0 + x1)/2, zm = (z0 + z1)/2;
  if (L >= W){ const r1 = [x0 + W/2, y + h, zm], r2 = [x1 - W/2, y + h, zm];
    Q(o, [x0, y, z0], [x1, y, z0], r2, r1); Q(o, [x1, y, z1], [x0, y, z1], r1, r2); T3(o, [x0, y, z1], [x0, y, z0], r1); T3(o, [x1, y, z0], [x1, y, z1], r2); }
  else { const r1 = [xm, y + h, z0 + L/2], r2 = [xm, y + h, z1 - L/2];
    Q(o, [x0, y, z1], [x0, y, z0], r1, r2); Q(o, [x1, y, z0], [x1, y, z1], r2, r1); T3(o, [x0, y, z0], [x1, y, z0], r1); T3(o, [x1, y, z1], [x0, y, z1], r2); }
}
function pyr(o, x, z, r, y, h, n, a0 = 0){ for (let i = 0; i < n; i++){ const t0 = a0 + i/n*TAU, t1 = a0 + (i + 1)/n*TAU;
  T3(o, [x + Math.cos(t0)*r, y, z + Math.sin(t0)*r], [x, y + h, z], [x + Math.cos(t1)*r, y, z + Math.sin(t1)*r]); } }
function pinn(o, x, y, z, w, h){ const r = w*0.7071; cyl(o, x, z, r, y, y + h*0.5, 4, false, PI/4); pyr(o, x, z, r*1.08, y + h*0.5, h*0.5, 4, PI/4); }
// ---------------- wall faces: fc(A -> B), outward normal on the right-hand side seen from above (x east, z south) ----------------
const fc = (ax, az, bx, bz) => { const L = Math.hypot(bx - ax, bz - az), tx = (bx - ax)/L, tz = (bz - az)/L; return {ax, az, tx, tz, nx:-tz, nz:tx, L}; };
const fp = (F, u, y, d = 0) => [F.ax + F.tx*u + F.nx*d, y, F.az + F.tz*u + F.nz*d];
const radF = (cx, cz, a, r, hl) => { const x = cx + Math.cos(a)*r, z = cz + Math.sin(a)*r; return fc(x - Math.sin(a)*hl, z + Math.cos(a)*hl, x + Math.sin(a)*hl, z - Math.cos(a)*hl); };
function outl(w, y0, y1, kind, n = 5){
  const hw = w/2, P = [[-hw, y0], [hw, y0]];
  if (kind === 's'){ P.push([hw, y1], [-hw, y1]); return P; }
  if (kind === 'r'){ for (let i = 0; i <= n; i++){ const a = PI*i/n; P.push([Math.cos(a)*hw, y1 + Math.sin(a)*hw]); } return P; }
  const R = w*0.85, cxL = hw - R, cxR = -hw + R;
  for (let i = 0; i <= n; i++){ const x = hw - (hw)*i/n; P.push([x, y1 + Math.sqrt(Math.max(0, R*R - (x - cxL)*(x - cxL)))]); }
  for (let i = 1; i <= n; i++){ const x = -hw*i/n; P.push([x, y1 + Math.sqrt(Math.max(0, R*R - (x - cxR)*(x - cxR)))]); }
  return P;
}
function onF(o, F, u, P, d = 0.08){ let cu = 0, cy = 0; for (const p of P){ cu += p[0]/P.length; cy += p[1]/P.length; }
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length]; T3(o, fp(F, u + cu, cy, d), fp(F, u + a[0], a[1], d), fp(F, u + b[0], b[1], d)); } }
// convex outline P [[du, y]...] extruded between d0 and d1 off the face (gables, arches, panels)
function extF(o, F, u, P, d0, d1){ onF(o, F, u, P, d1); onF(o, F, u, P, d0);
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length]; Q(o, fp(F, u + a[0], a[1], d0), fp(F, u + b[0], b[1], d0), fp(F, u + b[0], b[1], d1), fp(F, u + a[0], a[1], d1)); } }
function bF(o, F, u, w, y0, y1, dd, d0 = 0){ const A = fp(F, u - w/2, y0, d0), Bq = fp(F, u + w/2, y0, d0), C = fp(F, u + w/2, y0, d0 + dd), D = fp(F, u - w/2, y0, d0 + dd);
  const up = p => [p[0], y1, p[2]]; Q(o, up(A), up(D), up(C), up(Bq)); Q(o, A, Bq, up(Bq), up(A)); Q(o, Bq, C, up(C), up(Bq)); Q(o, C, D, up(D), up(C)); Q(o, D, A, up(A), up(D)); }
function bandF(o, F, y, h, dd, u0 = 0, u1){ bF(o, F, (u0 + (u1 === undefined ? F.L : u1))/2, (u1 === undefined ? F.L : u1) - u0, y, y + h, dd); }
function winRow(o, F, u0, u1, n, w, y0, y1, kind, d = 0.08){ const st = (u1 - u0)/n; for (let i = 0; i < n; i++) onF(o, F, u0 + st*(i + 0.5), outl(w, y0, y1, kind), d); }
function crenF(o, F, y, h, st, mw, th = 0.5, u0 = 0, u1){ const e = u1 === undefined ? F.L : u1; bF(o, F, (u0 + e)/2, e - u0, y, y + h*0.45, th, -th);
  for (let u = u0 + st/2; u < e - mw/2; u += st) bF(o, F, u, mw, y + h*0.45, y + h, th, -th); }
const rectF = (x0, x1, z0, z1) => ({s:fc(x0, z1, x1, z1), e:fc(x1, z1, x1, z0), n:fc(x1, z0, x0, z0), w:fc(x0, z0, x0, z1)});
// faces of any ring, outward to the right
const ringF = P => { let a = 0; for (let i = 0; i < P.length; i++){ const p = P[i], q = P[(i + 1) % P.length]; a += p[0]*q[1] - q[0]*p[1]; }
  const R = a > 0 ? P.slice().reverse() : P; return R.map((p, i) => { const q = R[(i + 1) % R.length]; return fc(p[0], p[1], q[0], q[1]); }); };
const LLp = (lat0, lon0, ox, oz) => ({lat:+(lat0 - oz/111048).toFixed(7), lon:+(lon0 + ox/84516).toFixed(7)});
const place = (type, lat0, lon0, ox, oz, rot) => { const p = LLp(lat0, lon0, ox, oz); SG_PLACES.push({type, lat:p.lat, lon:p.lon, rot:+rot.toFixed(4)}); };
const GRID = -0.5079;
// a simple low-poly tree (trunk + two cones)
function treeAt(TK, LV, x, y, z, h, rng){ const s = h*(0.85 + rng()*0.3); cyl(TK, x, z, 0.18*s/8, y - 0.5, y + s*0.4, 5, false); cyl(LV, x, z, [s*0.32, s*0.06], y + s*0.3, y + s, 6, false, rng()*TAU); cyl(LV, x, z, [s*0.26, 0.0], y + s*0.55, y + s*1.08, 6, false, rng()*TAU); }

// =====================================================================================================================
// Apollo Theater (George Keister, 1913-14; 253 W 125th Street): L-shaped plan - the 50 ft (15.3 m) frontage on 125th
// Street with the three-storey white glazed terracotta facade (four bays between fluted Ionic and paneled Tuscan pilasters,
// a dentil cornice over the ground floor, a Greek-fret frieze and a modillioned metal cornice), the long narrow lobby wing,
// the brick auditorium block behind (34.5 x 26 m, north end on 126th Street). The 2005 marquee over the western half of the
// facade (lit white panels framed by red and chaser bulbs) and the red-and-yellow vertical blade sign at the west end - shape
// and lights only, no letters. Frame: rot = -0.5079, +z = 125th Street (front), origin = centre of the OSM outline's box.
LANDMARKS.nyapollo = {zh:'阿波罗剧院', en:'Apollo Theater', cat:'old', r:39, h:21,
  lt:{m:0, c:'#ffe2b6', k:0.75, e:0.85}, build(){
  const g = new THREE.Group(), B = mkB();
  const TC = B.p({c:'#ebe4d2', m:0, lk:1.0}), TD = B.p({c:'#d2c8b2', m:0, lk:0.8}), BR = B.p({c:'#86594a', m:0, lk:0.3}), BD = B.p({c:'#6a4639', m:0, lk:0.2});
  const GL = B.p({c:'#1f2731', m:0, lk:0.1}), SH = B.p({c:'#40382c', glow:'#ffd8a0', gk:0.8}), RF = B.p('#55524d'), ST = B.p('#2a2b2f');
  const MQ = B.p({c:'#f6f1e8', glow:'#fff1d6', gk:1.5}), BL = B.p({c:'#ffe8a6', glow:'#ffd27a', gk:2.4}), RD = B.p({c:'#b3211b', glow:'#d8281f', gk:1.0});
  // (the auditorium block behind is the second key nyapollo_b, so that the two convex hulls leave the neighbour in the L free)
  // lobby wing (three storeys) and the terracotta front building
  blk(BR, RF, -17.3, -2.0, -3, 13.6, -4.4, 22.6);
  blk(TC, RF, -17.3, -2.0, -3, 14.6, 22.6, 30.4);
  abox(TD, -17.45, -1.85, 14.6, 14.85, 22.45, 30.6);
  const F = fc(-17.3, 30.4, -2.0, 30.4);
  // ground floor: entrance doors (west), the semicircular box office, the glass storefront (east)
  bF(GL, F, 4.3, 6.4, 0.0, 3.5, 0.06); bF(SH, F, 4.3, 6.4, 3.5, 4.5, 0.06);
  bF(SH, F, 11.7, 6.4, 0.3, 4.4, 0.06); for (const u of [8.4, 11.7, 15.0]) bF(ST, F, u, 0.25, 0, 4.5, 0.12);
  lathe(GL, [[1.3, 0.0], [1.3, 2.9]], -17.3 + 4.3, 30.4, 8, 0, PI); lathe(ST, [[1.45, 2.9], [1.45, 3.2], [0.0, 3.2]], -17.3 + 4.3, 30.4, 8, 0, PI);
  // dentil cornice over the ground floor
  bandF(TD, F, 4.75, 0.55, 0.45); for (let u = 0.3; u < F.L - 0.2; u += 0.5) bF(TD, F, u, 0.22, 4.55, 4.75, 0.38);
  // pilasters (paneled Tuscan at the ends, fluted Ionic between) with capitals and bases
  const PU = [0.55, 4.1, 7.65, 11.2, 14.75];
  for (let i = 0; i < 5; i++){ const u = PU[i], w = (i === 0 || i === 4) ? 0.95 : 0.75;
    bF(TD, F, u, w + 0.15, 5.3, 5.8, 0.36); bF(TC, F, u, w, 5.8, 12.55, 0.28); bF(TD, F, u, w + 0.35, 12.55, 13.1, 0.42);
    if (i > 0 && i < 4) for (const k of [-0.22, 0, 0.22]) bF(TD, F, u + k, 0.07, 6.0, 12.4, 0.32); else bF(TD, F, u, w - 0.4, 6.2, 12.2, 0.32); }
  // four bays: square windows on the second and third storeys, spandrels with shields
  for (const c of [2.33, 5.88, 9.43, 12.98]){
    onF(GL, F, c, outl(2.25, 6.15, 8.7, 's'), 0.06); onF(GL, F, c, outl(2.25, 9.6, 12.1, 's'), 0.06);
    bF(TD, F, c, 2.45, 8.75, 9.55, 0.08); bF(TC, F, c, 0.55, 8.85, 9.45, 0.15);
    for (const y of [6.05, 9.5]) bF(TD, F, c, 2.5, y - 0.12, y, 0.14); }
  // Greek-fret frieze, modillions, the metal cornice
  bandF(TD, F, 12.65, 0.75, 0.12); for (let u = 0.4, k = 0; u < F.L - 0.3; u += 0.6, k++) bF(TC, F, u, 0.3, k % 2 ? 12.75 : 13.0, k % 2 ? 13.15 : 13.3, 0.2);
  for (let u = 0.35; u < F.L - 0.2; u += 0.7) bF(TD, F, u, 0.2, 13.4, 13.65, 0.6);
  bandF(TD, F, 13.65, 0.55, 0.78);
  // the marquee (western half): lit panels, red frame line, chaser bulbs, lit soffit, steel cap and tie rods
  const MU = 4.6, MW = 8.6, MD = 3.6;
  bF(MQ, F, MU, MW, 3.95, 5.35, MD); bF(ST, F, MU, MW + 0.2, 5.35, 5.5, MD + 0.1); bF(BL, F, MU, MW - 0.2, 3.84, 3.95, MD - 0.1);
  for (const y of [3.95, 5.2]) bF(BL, F, MU, MW + 0.08, y, y + 0.14, MD + 0.04);
  bF(RD, F, MU, MW + 0.05, 4.52, 4.66, MD + 0.03);
  for (const k of [-1, 1]) seg(ST, fp(F, MU + k*(MW/2 - 0.4), 7.8, 0.1), fp(F, MU + k*(MW/2 - 0.4), 5.45, MD - 0.2), 0.05, 4);
  // the vertical blade sign at the west end: red field, bulb borders, a cap; bracket arms to the wall
  const SU = 1.25, S0 = 0.45, SD = 2.75, SY0 = 6.2, SY1 = 16.6;
  bF(RD, F, SU, 0.62, SY0, SY1, SD, S0);
  bF(BL, F, SU, 0.7, SY1 - 0.18, SY1, SD, S0); bF(BL, F, SU, 0.7, SY0, SY0 + 0.18, SD, S0);
  bF(BL, F, SU, 0.7, SY0, SY1, 0.18, S0 + SD - 0.18); bF(BL, F, SU, 0.7, SY0, SY1, 0.16, S0);
  bF(BL, F, SU, 0.68, SY0 + 0.6, SY1 - 0.6, 0.08, S0 + SD*0.5 - 0.04);
  bF(TD, F, SU, 0.85, SY1, SY1 + 0.45, SD + 0.2, S0 - 0.1); bF(TD, F, SU, 0.85, SY0 - 0.35, SY0, SD + 0.2, S0 - 0.1);
  for (const y of [7.5, 15.2]) bF(ST, F, SU, 0.2, y, y + 0.2, S0 + 0.1, 0);
  B.flush(g);
  return g; }};
place('nyapollo', 40.81, -73.95, 11.5, -9.8, GRID);
// Apollo Theater, second key (unlabelled): the brick auditorium block (34.5 x 26 m) with the raised stage house at the north
// end on 126th Street, coping, roof hatches, pilaster strips and exit doors. Same frame and placement as nyapollo.
LANDMARKS.nyapollo_b = {zh:'阿波罗剧院观众厅', en:'Apollo Theater auditorium', cat:'old', r:39, h:21, label:false,
  lt:{m:0, c:'#ffe2b6', k:0.5, e:0.85}, build(){
  const g = new THREE.Group(), B = mkB();
  const BR = B.p({c:'#86594a', m:0, lk:0.3}), BD = B.p({c:'#6a4639', m:0, lk:0.2}), RF = B.p('#55524d'), ST = B.p('#2a2b2f');
  blk(BR, RF, -17.2, 17.3, -3, 19.4, -30.4, -4.4);
  for (const [x0, x1, z0, z1] of [[-17.5, 17.6, -30.7, -30.1], [-17.5, 17.6, -4.7, -4.1], [-17.5, -16.9, -30.7, -4.1], [17.0, 17.6, -30.7, -4.1]]) abox(BD, x0, x1, 19.4, 20.0, z0, z1);
  blk(BR, RF, -13.5, 13.5, 19.4, 21.0, -30.1, -21.0);
  for (const x of [-9, -2, 5, 11]) abox(ST, x - 1.2, x + 1.2, 19.4, 20.4, -14, -11.6);
  { const F = fc(17.3, -30.4, -17.2, -30.4); for (let u = 2.5; u < F.L; u += 6.0) bF(BD, F, u, 0.8, 0, 19.4, 0.25);
    for (const u of [8, 26]) bF(ST, F, u, 2.4, 0, 2.8, 0.08); }
  B.flush(g);
  return g; }};
place('nyapollo_b', 40.81, -73.95, 11.5, -9.8, GRID);

// =====================================================================================================================
// Hotel Theresa (George & Edward Blum, 1912-13; 2090 Adam Clayton Powell Jr. Blvd): 13 storeys faced with white Flemish-bond
// brick and white terracotta (LPC designation report): the commercial ground floor, the ornate second storey of 13 round-arched
// windows and the third storey above a wide belt course, the six-storey brick shaft, the three-sided projecting bays - four on
// the boulevard front set in pairs near each end, one at either end of the 124th and 125th Street sides - the iron balcony
// across the three street fronts below the top two storeys, and the four tall flat-topped pediments with blind arches over the
// front bays. Lit windows at night, the terracotta crown floodlit. Frame: rot = -0.5079, +x = the boulevard (front),
// -z = 125th Street.
LANDMARKS.nytheresa = {zh:'特蕾莎酒店', en:'Hotel Theresa', cat:'old', r:34, h:54,
  lt:{m:0, c:'#fff3e2', k:0.85, e:0.45}, build(){
  const g = new THREE.Group(), B = mkB();
  const WB = B.p({c:'#e6e2d8', m:0, lk:0.45}), TR = B.p({c:'#f3f0e7', m:0, lk:0.95}), TD = B.p({c:'#d8d2c3', m:0, lk:0.7}), BG = B.p({c:'#cbbd9f', m:0, lk:0.2});
  const PN = B.p({c:'#2a313b', m:1, fh:3.35, cw:1.2}), SF = B.p({c:'#3c3428', glow:'#ffdcae', gk:0.9}), RF = B.p('#6a6862'), IR = B.p('#2e3136');
  const X0 = -9.3, X1 = 9.3, Z0 = -30.2, Z1 = 30.2, Y1 = 5.2, Y2 = 9.4, Y3 = 12.9, FH = 3.35, Y11 = Y3 + 8*FH, YT = Y11 + 2*3.4, H = 51.5;
  blk(WB, RF, X0, X1, -3, YT + 1.2, Z0, Z1);
  const FS = rectF(X0, X1, Z0, Z1);
  // projecting three-sided bays: [face, u]
  const BAYS = {e:[7.0, 12.2, FS.e.L - 12.2, FS.e.L - 7.0], n:[2.2, FS.n.L - 2.2], s:[2.2, FS.s.L - 2.2]};
  for (const key of ['e', 'n', 's', 'w']){
    const F = FS[key], L = F.L, rear = key === 'w';
    const mat = rear ? BG : WB;
    if (rear){ for (let f = 0; f < 10; f++) for (let u = 2; u < L - 1; u += 4.0) onF(PN, F, u, outl(1.2, Y3 + f*FH + 0.8, Y3 + f*FH + 2.6, 's'), 0.06); continue; }
    // ground floor storefronts and the main entrance (centre of the boulevard front)
    for (let u = 1.6; u < L - 1.2; u += 4.4){ bF(SF, F, u + 1.9, 3.6, 0.3, 4.4, 0.05); bF(TR, F, u, 0.6, 0, Y1, 0.18); }
    if (key === 'e') bF(TR, F, L/2, 4.2, 0, 5.0, 0.45);
    bandF(TR, F, Y1 - 0.4, 0.5, 0.35);
    // second storey: round-arched windows in terracotta frames; wide belt course; third storey windows with pediment heads
    const n2 = key === 'e' ? 13 : 4, st2 = (L - 2.0)/n2;
    for (let i = 0; i < n2; i++){ const c = 1.0 + st2*(i + 0.5); onF(TR, F, c, outl(st2*0.78, Y1 + 0.3, Y2 - 1.6, 'r', 6), 0.08); onF(PN, F, c, outl(st2*0.6, Y1 + 0.5, Y2 - 1.6, 'r', 6), 0.14);
      onF(PN, F, c, outl(st2*0.5, Y2 + 0.6, Y3 - 0.9, 's'), 0.06); extF(TR, F, c, [[-st2*0.36, Y3 - 0.85], [st2*0.36, Y3 - 0.85], [0, Y3 - 0.25]], 0.0, 0.18); }
    bF(TR, F, L/2, L, Y1, Y2 - 1.3, 0.1); bandF(TD, F, Y2 - 0.5, 0.9, 0.4); bandF(TR, F, Y2 - 0.65, 0.2, 0.5); bandF(TR, F, Y2 + 0.4, 0.2, 0.5);
    bandF(TR, F, Y3 - 0.15, 0.3, 0.2);
    // shaft windows in bands between the bays; terracotta corner strips
    for (const u of [0.45, L - 0.45]) bF(TR, F, u, 0.9, Y2, YT, 0.12);
    const n = key === 'e' ? 12 : 3, us = [], bays = BAYS[key];
    if (key === 'e'){ for (let i = 0; i < n; i++){ const u = 16.0 + (L - 32.0)*(i + 0.5)/n; us.push(u); } }
    else us.push(L/2 - 3.6, L/2, L/2 + 3.6);
    for (let f = 0; f < 10; f++){ const y = Y3 + f*FH; for (const u of us){ onF(PN, F, u, outl(1.25, y + 0.75, y + 2.65, 's'), 0.06); bF(TD, F, u, 1.45, y + 0.3, y + 0.62, 0.07); } }
    for (let f = 0; f < 2; f++){ const y = Y11 + f*3.4; for (const u of us) onF(PN, F, u, outl(1.25, y + 0.6, y + 2.6, 's'), 0.06); }
    bF(TR, F, L/2, L - 1.8, Y11, YT, 0.08);
    // the bays: three-sided oriels from the third storey to the top, windows on every face, diamond spandrels
    for (const u of bays){ const w = 3.4, dp = 0.95, P = [[u - w/2, 0], [u - w*0.28, dp], [u + w*0.28, dp], [u + w/2, 0]].map(([uu, d]) => { const p = fp(F, uu, 0, d); return [p[0], p[2]]; });
      prism(TR, P, Y2 + 0.4, YT, true, TR);
      const fr = fc(P[1][0], P[1][1], P[2][0], P[2][1]), sl = fc(P[0][0], P[0][1], P[1][0], P[1][1]), sr = fc(P[2][0], P[2][1], P[3][0], P[3][1]);
      for (let f = 0; f < 12; f++){ const y = Y3 + f*FH - (f >= 10 ? 0 : 0), yy = f < 8 ? Y3 + f*FH : Y11 + (f - 8)*3.4; if (yy + 2.7 > YT) break;
        onF(PN, fr, fr.L/2, outl(fr.L*0.62, yy + 0.75, yy + 2.65, 's'), 0.06); for (const sF of [sl, sr]) onF(PN, sF, sF.L/2, outl(sF.L*0.45, yy + 0.75, yy + 2.65, 's'), 0.06);
        if (f > 0 && f < 6) extF(TD, fr, fr.L/2, [[-0.4, yy + 0.15], [0, yy - 0.2], [0.4, yy + 0.15], [0, yy + 0.5]], 0.0, 0.1); }
      // ninth-storey balcony on the bays
      bF(IR, fr, fr.L/2, fr.L + 0.6, Y3 + 5*FH, Y3 + 5*FH + 0.15, 0.6, 0.0); }
    // the iron balcony across the street fronts below the top two storeys, and the cornice
    bF(IR, F, L/2, L, Y11 - 0.1, Y11 + 0.12, 1.4); for (let u = 0.3; u < L; u += 0.5) bF(IR, F, u, 0.04, Y11 + 0.12, Y11 + 1.1, 0.04, 1.32); bF(IR, F, L/2, L, Y11 + 1.05, Y11 + 1.12, 0.06, 1.32);
    bandF(TD, F, YT - 0.2, 0.5, 1.15); bandF(TR, F, YT + 0.3, 0.9, 0.2);
    // the four tall flat-topped pediments with blind arches over the boulevard bays
    if (key === 'e') for (const u of bays){ bF(TR, F, u, 4.4, YT + 0.3, H - 0.4, 0.6, -0.1); bF(TD, F, u, 4.8, H - 0.4, H, 0.75, -0.15);
      onF(TD, F, u, outl(2.8, YT + 1.0, H - 3.0, 'r', 6), 0.55); onF(TR, F, u, outl(1.8, YT + 1.4, H - 3.2, 'r', 6), 0.6); }
  }
  // roof: bulkheads and the water tank
  abox(RF, -6, -1, YT + 1.2, YT + 4.0, -4, 4); abox(RF, -7, -1, YT + 1.2, YT + 3.2, -20, -14);
  cyl(B.p('#6b5444'), -4.0, 16, 2.0, YT + 2.8, YT + 6.6, 10, true); for (const [x, z] of [[-5.4, 14.6], [-2.6, 14.6], [-5.4, 17.4], [-2.6, 17.4]]) seg(IR, [x, YT + 1.2, z], [x, YT + 2.8, z], 0.1, 4);
  pyr(B.p('#6b5444'), -4.0, 16, 2.1, YT + 6.6, 1.0, 10);
  B.flush(g);
  return g; }};
place('nytheresa', 40.8093, -73.9495, 48.3, 60.7, GRID);

// =====================================================================================================================
// Adam Clayton Powell Jr. State Office Building (Ifill Johnson Hanchard, 1973; 163 W 125th Street): the 19-storey Brutalist
// tower (89 m) at the north of the block, set back from 125th Street behind its broad plaza at the corner of Adam Clayton
// Powell Jr. Boulevard. Massive granite-clad concrete piers carry a dark, reflective black-and-bronze curtain wall; at the
// base the piers splay out like buttresses and lift the tower off the plaza over a glazed lobby; rectangular glass volumes
// cantilever from the narrow ends; a recessed mechanical floor under the heavy granite cornice crowns it. Plaza: granite
// paving, planters with trees, plain flagpoles. Frame: rot = -0.5079, +z = 125th Street, -x = the boulevard.
const ACP_R = [[-30.9,8.2],[-30.9,-8.6],[-28.3,-8.6],[-28.2,-10.3],[-25.9,-10.3],[-25.9,-12.3],[-23.6,-12.3],[-23.6,-10.7],[-21.9,-10.7],[-22.0,-12.1],[-17.7,-12.1],[-17.7,-10.5],[-16.0,-10.5],[-16.0,-11.8],[-8.5,-11.8],[-8.4,-11.4],[-6.5,-11.4],[-6.5,-12.1],[6.9,-12.2],[6.9,-11.7],[16.1,-11.8],[16.0,-10.6],[17.7,-10.6],[17.8,-12.2],[21.8,-12.3],[21.8,-10.5],[23.6,-10.5],[23.7,-12.1],[25.9,-12.1],[26.0,-10.2],[28.3,-10.2],[28.2,-8.4],[30.9,-8.5],[30.9,8.1],[28.1,8.1],[28.1,9.7],[25.8,9.7],[25.8,11.7],[23.7,11.7],[23.8,10.1],[22.0,10.1],[22.0,11.4],[17.9,11.4],[17.9,10.4],[15.8,10.4],[15.7,11.3],[13.3,11.3],[13.3,10.3],[11.3,10.3],[11.2,12.2],[-11.2,12.3],[-11.2,10.4],[-13.4,10.4],[-13.4,11.4],[-15.8,11.5],[-15.8,10.4],[-17.6,10.4],[-17.6,11.4],[-22.1,11.4],[-22.1,9.9],[-23.7,10.0],[-23.7,11.8],[-26.0,11.8],[-26.0,10.2],[-28.2,10.1],[-28.2,8.2]];
LANDMARKS.nyacpsob = {zh:'小亚当·克莱顿·鲍威尔州政府办公大楼', en:'Adam Clayton Powell Jr. State Office Building', cat:'new', r:62, h:89,
  lt:{m:1, c:'#fff2dc', k:0.6, fh:3.9, cw:1.5}, build(){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
  const CO = B.p({c:'#8f867b', m:0, lk:0.5}), CD = B.p({c:'#776f65', m:0, lk:0.35}), PN = B.p({c:'#2a2622', m:1, fh:3.95, cw:1.5}), MU = B.p({c:'#5b4a35', m:0, lk:0.2});
  const LB = B.p({c:'#3a3428', glow:'#ffe2b8', gk:0.9}), PV = B.p({c:'#a9a395', m:0, lk:0.12}), RF = B.p('#5d5a55'), GR = B.p({c:'#5a7845', m:0, lk:0.08}), TK = B.p('#5b4a3a'), LV = B.p({c:'#4f6e3e', m:0, lk:0.08}), ME = B.p('#7d8083');
  const Y1 = 8.0, FH = 3.95, NF = 18, YT = Y1 + 0.4 + NF*FH, YM = YT + 3.6, H = 88.9;
  // plaza (granite paving) from the tower to 125th Street and the boulevard building lines, with a low step
  abox(PV, -40, 31, -2.0, 0.22, -16.5, 45.5, true);
  abox(CD, -40, 31, 0.22, 0.5, 44.6, 45.5); abox(CD, -40.0, -39.1, 0.22, 0.5, -16.5, 45.5);
  // glazed lobby under the lifted tower
  blk(LB, RF, -27.0, 27.0, 0.22, Y1, -9.2, 9.2);
  abox(CD, -31.2, 31.2, Y1 - 0.8, Y1, -12.4, 12.4);
  // the curtain-wall tower on the OSM outline (the cantilevered end volumes start above the lobby), bronze spandrels and mullions
  prism(PN, ACP_R, Y1, YT, true, RF);
  const FR = ringF(ACP_R);
  for (const F of FR){ if (F.L < 1.0) continue;
    for (let f = 0; f <= NF; f++){ const y = Y1 + 0.4 + f*FH; bF(MU, F, F.L/2, F.L, y - 0.45, y + 0.35, 0.07); }
    for (let u = 1.5; u < F.L - 0.4; u += 1.5) bF(MU, F, u, 0.12, Y1, YT, 0.1); }
  // granite piers on the long faces, splayed at the base like buttresses; corner piers at the ends
  const PX = [-26.9, -18.6, -9.3, 0.0, 9.3, 18.6, 26.9];
  for (const x of PX) for (const sg of [-1, 1]){
    const zi = sg*9.6, zo = sg*13.0;
    abox(CO, x - 1.1, x + 1.1, Y1, YT, Math.min(zi, zo), Math.max(zi, zo), true);
    // the splayed foot: wider and further out at the ground
    const P0 = [[x - 1.1, zi], [x + 1.1, zi], [x + 1.6, sg*14.8], [x - 1.6, sg*14.8]], P1 = [[x - 1.1, zi], [x + 1.1, zi], [x + 1.1, zo], [x - 1.1, zo]];
    for (let i = 0; i < 4; i++){ const j = (i + 1) % 4; Q(CO, [P0[i][0], 0.22, P0[i][1]], [P0[j][0], 0.22, P0[j][1]], [P1[j][0], Y1, P1[j][1]], [P1[i][0], Y1, P1[i][1]]); }
    abox(CD, x - 1.3, x + 1.3, Y1 + 2.0, Y1 + 2.6, Math.min(zi, zo) - 0.1, Math.max(zi, zo) + 0.1); }
  for (const x of [-28.2, 28.2]) for (const sg of [-1, 1]) abox(CO, x - 1.4, x + 1.4, 0.22, YT, sg > 0 ? 8.0 : -11.6, sg > 0 ? 11.6 : -8.0, true);
  // recessed mechanical floor and the heavy granite cornice
  prism(CD, [[-29.6, -9.6], [29.6, -9.6], [29.6, 9.6], [-29.6, 9.6]], YT, YM, false);
  for (let u = -28; u <= 28; u += 4) for (const sg of [-1, 1]) abox(ME, u - 0.6, u + 0.6, YT + 0.6, YM - 0.6, sg*9.6 - 0.1, sg*9.6 + 0.1);
  blk(CO, RF, -31.6, 31.6, YM, H, -13.2, 13.2);
  for (const z of [-13.2, 13.2]) abox(CD, -31.8, 31.8, YM - 0.1, YM + 0.5, z - 0.25, z + 0.25);
  abox(ME, -10, 10, H, H + 1.8, -5, 5, true);
  // plaza furniture: planters with trees, benches, flagpoles
  for (const [x, z] of [[-34, 16], [-34, 27], [-34, 38], [-22, 38], [-10, 38], [2, 38], [14, 38], [25, 38], [-22, 20], [14, 20]]){
    abox(CD, x - 2.2, x + 2.2, 0.22, 0.9, z - 2.2, z + 2.2); abox(GR, x - 1.9, x + 1.9, 0.9, 0.95, z - 1.9, z + 1.9);
    treeAt(TK, LV, x, 0.95, z, 8 + rng()*3, rng); }
  for (const x of [-6, -3, 0]) { cyl(ME, x, 17.5, [0.09, 0.05], 0.22, 14.5, 6, true); }
  for (const [x0, x1] of [[-28, -16], [4, 16]]) abox(CD, x0, x1, 0.22, 0.65, 27, 28.2);
  B.flush(g);
  return g; }};
place('nyacpsob', 40.8097, -73.9488, 116.7, 54.0, GRID);

// =====================================================================================================================
// Harlem Fire Watchtower (Julius H. Kroehl after James Bogardus, 1856): the last of the city's cast-iron fire towers, 47 ft
// (14.3 m), an octagonal frame of eight slender columns tied by three tiers of girts with arched brackets, the spiral stair in
// the middle, the open lookout gallery with its railing and the great alarm bell hung under the small copper roof (restored
// 2015-19). It stands on the Acropolis, the New Deal stone plaza on the rock summit of Mount Morris in Marcus Garvey Park:
// granite retaining walls and parapet, wide steps from several sides, the schist outcrop and the park's trees around.
// Frame: unrotated, origin = the tower (OSM "Mount Morris" summit point).
LANDMARKS.nyfirewatch = {zh:'哈莱姆火警瞭望塔', en:'Harlem Fire Watchtower', cat:'old', r:26, h:19,
  lt:{m:0, c:'#ffe4bc', k:0.9, e:0.6, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
  const IR = B.p({c:'#4b524e', m:0, lk:0.9}), IL = B.p({c:'#5f6762', m:0, lk:0.9}), BZ = B.p({c:'#9c7a3c', m:0, lk:0.9}), CU = B.p({c:'#5f8a78', m:0, lk:0.7});
  const GN = B.p({c:'#a49f95', m:0, lk:0.55}), GD = B.p({c:'#8c877d', m:0, lk:0.4}), RK = B.p({c:'#6e6a62', m:0, lk:0.15}), RL = B.p({c:'#7f7a70', m:0, lk:0.15});
  const PV = B.p({c:'#9a9488', m:0, lk:0.25}), GS = B.p({c:'#5c7845', m:0, lk:0.06}), TK = B.p('#5b4a3a'), LV = B.p({c:'#4c6a3a', m:0, lk:0.06});
  const YP = 2.6;                                                     // plaza level (local)
  // the rock: an irregular schist dome from the park ground up to the plaza, grass and trees on its flanks
  { const NA = 14, rings = [[22.5, -10.0], [19.0, -4.5], [15.8, YP - 1.2]];
    const pts = rings.map(([r, y], k) => { const R = []; for (let i = 0; i < NA; i++){ const a = i/NA*TAU, rr = r*(1 + (rng() - 0.5)*0.16); R.push([Math.cos(a)*rr, y + (rng() - 0.5)*(k < 2 ? 1.8 : 0.3), Math.sin(a)*rr]); } return R; });
    for (let k = 0; k < 2; k++) for (let i = 0; i < NA; i++){ const j = (i + 1) % NA; Q(k === 0 ? GS : (i % 3 ? RK : RL), pts[k][i], pts[k][j], pts[k + 1][j], pts[k + 1][i]); }
    for (let i = 0; i < NA; i++){ const a = i/NA*TAU; if (i % 2) treeAt(TK, LV, Math.cos(a)*20.5, -6.5 + rng(), Math.sin(a)*20.5, 9 + rng()*4, rng); } }
  // the plaza: retaining wall (octagonal), coping and parapet, paving, the steps on four sides
  const RP = 13.2; cyl(GN, 0, 0, [RP + 0.4, RP], -3.0, YP, 8, false, PI/8); cyl(GD, 0, 0, RP + 0.15, YP - 0.25, YP, 8, false, PI/8);
  cyl(PV, 0, 0, RP, YP - 0.05, YP, 8, true, PI/8);
  for (let k = 0; k < 8; k++){ const a0 = PI/8 + k/8*TAU, a1 = a0 + TAU/8, R0 = RP/Math.cos(0) ;
    const p0 = [Math.cos(a0)*RP, Math.sin(a0)*RP], p1 = [Math.cos(a1)*RP, Math.sin(a1)*RP];
    if (k % 2 === 0){ const F = fc(p0[0], p0[1], p1[0], p1[1]);
      bF(GN, F, F.L*0.18, F.L*0.36, YP, YP + 0.9, 0.45, -0.45); bF(GN, F, F.L*0.82, F.L*0.36, YP, YP + 0.9, 0.45, -0.45);
      for (let s = 0; s < 7; s++) bF(GD, F, F.L/2, F.L*0.28, YP - 0.4*(s + 1), YP - 0.4*s, 0.42, 0.42*s);
    } else { const F = fc(p0[0], p0[1], p1[0], p1[1]); bF(GN, F, F.L/2, F.L, YP, YP + 0.9, 0.45, -0.45); }
    if (k % 2 === 0) for (const s of [0, 1]) bF(GD, fc(p0[0], p0[1], p1[0], p1[1]), s ? fc(p0[0], p0[1], p1[0], p1[1]).L*0.36 : fc(p0[0], p0[1], p1[0], p1[1]).L*0.64, 0.3, YP + 0.9, YP + 1.05, 0.5, -0.5); }
  // the tower: an iron footing ring, 8 columns (slightly battered), three girts with arched brackets, the stair, the gallery
  const T0 = YP, RC0 = 2.55, RC1 = 2.05, LV0 = [T0 + 0.3, T0 + 4.9, T0 + 9.4], TOP = T0 + 9.4;
  cyl(GD, 0, 0, RC0 + 0.6, T0, T0 + 0.3, 8, true, PI/8);
  const colP = (k, y) => { const t = (y - T0)/(TOP - T0), r = RC0 + (RC1 - RC0)*t, a = k/8*TAU; return [Math.cos(a)*r, y, Math.sin(a)*r]; };
  for (let k = 0; k < 8; k++){ seg(IR, colP(k, T0 + 0.3), colP(k, TOP + 3.0), 0.11, 6);
    for (const y of [T0 + 0.3, LV0[1], LV0[2]]) cyl(IL, colP(k, y)[0], colP(k, y)[2], 0.2, y, y + 0.35, 6, true); }
  for (const y of LV0) for (let k = 0; k < 8; k++){ const a = colP(k, y + 0.5), b = colP((k + 1) % 8, y + 0.5);
    seg(IR, a, b, 0.09, 4);
    // arched bracket under each girt (a shallow arc of short segments)
    if (y > T0 + 1){ const m = 6; let prev = null; for (let i = 0; i <= m; i++){ const t = i/m, s = Math.sin(t*PI), p = [a[0] + (b[0] - a[0])*t, y + 0.5 - 0.65 + s*0.55, a[2] + (b[2] - a[2])*t]; if (prev) seg(IL, prev, p, 0.045, 3); prev = p; } }
    // diagonal ties in the lower tiers
    if (y < TOP - 1){ const c = colP((k + 1) % 8, y + 4.0); if (k % 2 === 0) seg(IL, a, c, 0.035, 3); } }
  // central newel and the spiral stair
  cyl(IR, 0, 0, 0.16, T0, TOP, 8, false);
  { let prev = null; for (let i = 0; i <= 64; i++){ const t = i/64, a = t*TAU*3.0, y = T0 + 0.3 + t*(TOP - T0 - 0.4), p = [Math.cos(a)*1.05, y, Math.sin(a)*1.05];
      if (i % 2 === 0) seg(IL, [Math.cos(a)*0.16, y, Math.sin(a)*0.16], p, 0.05, 3); if (prev) seg(IR, prev, [p[0]*1.4, p[1] + 0.9, p[2]*1.4], 0.025, 3); prev = [p[0]*1.4, p[1] + 0.9, p[2]*1.4]; } }
  // the lookout gallery: floor, railing, the bell frame, the bell, the copper roof with its finial
  cyl(IL, 0, 0, RC1 + 0.55, TOP - 0.15, TOP + 0.1, 8, true, PI/8);
  for (let k = 0; k < 16; k++){ const a = k/16*TAU, r = RC1 + 0.5; seg(IR, [Math.cos(a)*r, TOP + 0.1, Math.sin(a)*r], [Math.cos(a)*r, TOP + 1.1, Math.sin(a)*r], 0.03, 3); }
  lathe(IR, [[RC1 + 0.52, TOP + 1.05], [RC1 + 0.52, TOP + 1.15]], 0, 0, 16);
  for (let k = 0; k < 8; k++) seg(IR, colP(k, TOP + 3.0), [0, TOP + 3.1, 0], 0.07, 4);
  seg(IR, [0, TOP + 3.1, 0], [0, TOP + 2.55, 0], 0.06, 4);
  lathe(BZ, [[0.0, TOP + 2.55], [0.42, TOP + 2.5], [0.5, TOP + 2.2], [0.56, TOP + 1.75], [0.72, TOP + 1.42], [0.78, TOP + 1.3], [0.0, TOP + 1.3]], 0, 0, 12);
  lathe(CU, [[RC1 + 0.85, TOP + 3.0], [RC1 + 0.3, TOP + 3.5], [0.3, TOP + 4.5], [0.12, TOP + 4.7]], 0, 0, 8, PI/8);
  lathe(IR, [[0.12, TOP + 4.7], [0.2, TOP + 4.95], [0.0, TOP + 5.3]], 0, 0, 6);
  B.flush(g);
  return g; }};
place('nyfirewatch', 40.8043, -73.9437, 7.0, 14.0, 0);

// =====================================================================================================================
// Abyssinian Baptist Church (Charles W. Bolton & Son, 1922-23; 132-142 W 138th Street): Gothic / Tudor Revival, rock-faced
// Manhattan schist in random ashlar trimmed with white terracotta (LPC report). On 138th Street the central gable - three groups
// of three windows at its base, the enormous pointed-arched window divided by two rock-faced piers and crossed by a band of
// Gothic panels, a crenellated gable roofline with a niche at the peak - flanked by two square towers (pointed-arched entrances,
// two window stages, corner buttresses, crenellated parapets with pinnacles); the nave behind under a steep slate roof with
// buttressed side walls; the asymmetrical four-storey community house to the east with its low tower-like entrance bay and
// crenellated parapet. Stained glass glows softly at night, the stone floodlit warm. Frame: rot = -0.5079, -z = 138th Street.
const ABY_R = [[-22.1,14.1],[-22.0,8.7],[-21.5,8.6],[-21.5,-13.6],[16.9,-13.5],[16.9,-14.1],[22.1,-14.1],[22.1,-7.0],[20.3,-6.9],[20.3,12.7],[10.4,12.7],[10.4,0.2],[6.5,0.2],[6.8,14.1]];
LANDMARKS.nyabyssinian = {zh:'阿比西尼亚浸信会教堂', en:'Abyssinian Baptist Church', cat:'old', r:30, h:27,
  lt:{m:0, c:'#ffe3b8', k:0.85, e:0.7}, build(){
  const g = new THREE.Group(), B = mkB();
  const BS = B.p({c:'#7b766d', m:0, lk:0.8}), BD = B.p({c:'#69645c', m:0, lk:0.6}), LS = B.p({c:'#e6e1d6', m:0, lk:1.0}), SL = B.p({c:'#4a4e54', m:0, lk:0.2});
  const SG = B.p({c:'#2c3046', glow:'#f2c88e', gk:0.55}), WN = B.p({c:'#2a3036', m:1, fh:3.6, cw:1.4}), DR = B.p('#4a3324'), RF = B.p('#5c5a57');
  const ZF = -13.6, ZB = 14.1, XW = -21.5, XE = 6.8, YE = 13.0, YR = 21.5;
  // nave walls and the steep slate roof (ridge along z), the rear gable
  blk(BS, RF, XW, XE, -3, YE, ZF + 0.1, ZB);
  bF(LS, fc(XW, ZB, XW, ZF), 13.85, 27.7, YE - 0.6, YE, 0.35); bF(LS, fc(XE, ZF, XE, ZB), 13.85, 27.7, YE - 0.6, YE, 0.35);
  gableZ(SL, XW - 0.5, XE + 0.5, ZF + 0.5, ZB + 0.4, YE, YR - YE, BS);
  // side walls: buttresses and tall pointed windows
  for (const F of [fc(XW, ZB, XW, ZF), fc(XE, ZF, XE, ZB)]){
    for (let u = 0.5; u < F.L; u += 4.6) { bF(BS, F, u, 1.1, -1, YE - 2.2, 1.1); bF(LS, F, u, 1.15, YE - 2.2, YE - 1.6, 0.9); }
    for (let u = 2.8; u < F.L - 6.5; u += 4.6){ onF(SG, F, u, outl(2.0, 3.5, 9.4, 'p'), 0.08); bF(LS, F, u, 2.5, 3.2, 3.5, 0.2); } }
  // the front: central gable wall between the towers
  const FF = fc(XE, ZF, XW, ZF);        // u = 0 at the east tower, normal -z (north)
  const TW = 5.6, GC = FF.L/2;
  bF(BS, FF, GC, FF.L - 2*TW, -3, YE + 1.0, 0.6, -0.6);
  extF(BS, FF, GC, [[-(FF.L/2 - TW), YE + 0.9], [FF.L/2 - TW, YE + 0.9], [0, YR + 1.2]], -0.6, 0.0);
  extF(LS, FF, GC, [[-(FF.L/2 - TW) - 0.1, YE + 0.9], [-(FF.L/2 - TW) + 0.9, YE + 0.9], [0.45, YR + 1.65], [-0.45, YR + 1.65]], 0.0, 0.25);
  extF(LS, FF, GC, [[(FF.L/2 - TW) - 0.9, YE + 0.9], [(FF.L/2 - TW) + 0.1, YE + 0.9], [0.45, YR + 1.65], [-0.45, YR + 1.65]], 0.0, 0.25);
  // the enormous pointed window: terracotta surround, stained glass, two rock-faced piers, the band of Gothic panels
  const GW = FF.L - 2*TW - 3.2;
  onF(LS, FF, GC, outl(GW + 0.9, 5.2, 11.8, 'p', 8), 0.06); onF(SG, FF, GC, outl(GW, 5.5, 11.8, 'p', 8), 0.12);
  for (const k of [-1, 1]) bF(BS, FF, GC + k*GW/6, 0.75, 5.5, 11.8 + GW*0.4, 0.22);
  bF(LS, FF, GC, GW, 10.0, 10.9, 0.2); for (let u = -GW/2 + 0.6; u < GW/2 - 0.4; u += 0.9) onF(BS, FF, GC + u, outl(0.45, 10.15, 10.6, 'p', 3), 0.24);
  bandF(LS, FF, YE + 0.9, 0.35, 0.3, TW, FF.L - TW);
  // base of the gable: three groups of three windows between terracotta piers
  for (const k of [-1, 0, 1]){ for (const j of [-1, 0, 1]) onF(SG, FF, GC + k*4.6 + j*1.15, outl(0.85, 1.4, 3.9, 's'), 0.08); bF(LS, FF, GC + k*4.6, 3.9, 1.2, 1.4, 0.15); bF(LS, FF, GC + k*4.6, 3.9, 3.9, 4.15, 0.15); }
  for (const k of [-1.5, -0.5, 0.5, 1.5]) bF(LS, FF, GC + k*4.6, 0.5, 1.2, 4.15, 0.18);
  bandF(LS, FF, 4.6, 0.35, 0.3, TW, FF.L - TW);
  // crenellated gable roofline and the niche at the peak
  { const half = FF.L/2 - TW, n = 7; for (let i = 0; i < n; i++){ const f0 = i/n, f1 = (i + 0.5)/n;
      for (const sg of [-1, 1]){ const u0 = GC + sg*half*(1 - f0), u1 = GC + sg*half*(1 - f1), y0 = YE + 0.9 + (YR + 1.2 - YE - 0.9)*f0, y1 = YE + 0.9 + (YR + 1.2 - YE - 0.9)*f1;
        bF(LS, FF, (u0 + u1)/2, Math.abs(u1 - u0), Math.max(y0, y1) - 0.2, Math.max(y0, y1) + 0.65, 0.5, -0.5); } }
    bF(LS, FF, GC, 1.4, YR + 0.8, YR + 2.6, 0.5, -0.2); onF(BS, FF, GC, outl(0.7, YR + 1.0, YR + 1.9, 'p', 3), 0.32); }
  // two square towers with buttresses, belfry openings, crenellations and pinnacles
  for (const s of [0, 1]){
    const x0 = s ? XW - 0.3 : XE - TW, x1 = s ? XW + TW : XE + 0.3, z0 = ZF - 0.6, z1 = ZF + TW;
    blk(BS, RF, x0, x1, -3, 23.0, z0, z1);
    for (const [bx, bz] of [[x0, z0], [x1, z0]]) { abox(BD, bx - 0.55, bx + 0.55, -1, 17.0, bz - 0.55, bz + 0.55); abox(LS, bx - 0.6, bx + 0.6, 17.0, 17.4, bz - 0.6, bz + 0.6); }
    const TF = rectF(x0, x1, z0, z1);
    for (const F of [TF.n, TF.e, TF.w, TF.s]){ for (const du of [-0.5, 0.5]) { onF(SG, F, F.L/2 + du, outl(0.7, 7.5, 11.0, 'p'), 0.08); onF(SG, F, F.L/2 + du, outl(0.7, 16.5, 20.4, 'p'), 0.08); }
      onF(LS, F, F.L/2, outl(2.0, 7.3, 11.2, 'p'), 0.05); onF(LS, F, F.L/2, outl(2.0, 16.3, 20.6, 'p'), 0.05);
      bandF(LS, F, 15.6, 0.3, 0.2); crenF(LS, F, 23.0, 1.6, 1.4, 0.8, 0.3); }
    for (const [px, pz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) pinn(LS, px, 23.0, pz, 0.8, 3.4);
    onF(DR, s ? TF.n : TF.n, TF.n.L/2, outl(1.8, 0, 3.0, 'p'), 0.12);
  }
  // the connector and the community house (four storeys, crenellated)
  blk(BS, RF, XE, 10.4, -3, 13.0, ZF, 0.2);
  const CH = [[10.4, 12.7], [10.4, -14.1], [22.1, -14.1], [22.1, -7.0], [20.3, -6.9], [20.3, 12.7]];
  prism(BS, CH, -3, 17.6, true, RF);
  for (const F of ringF(CH)){ if (F.L < 3) continue;
    const n = Math.max(1, Math.round(F.L/3.0)), st = F.L/n;
    for (let f = 0; f < 4; f++){ const y = 1.2 + f*4.0; for (let i = 0; i < n; i++){ onF(LS, F, st*(i + 0.5), outl(1.7, y - 0.2, y + 2.6, 's'), 0.05); onF(WN, F, st*(i + 0.5), outl(1.4, y, y + 2.4, f === 3 ? 'p' : 's'), 0.1); } }
    crenF(LS, F, 17.6, 1.5, 1.6, 0.9, 0.3); bandF(LS, F, 4.6, 0.25, 0.15); }
  { const F = fc(XE, ZF, 10.4, ZF); onF(DR, F, F.L/2, outl(1.6, 0, 2.8, 'p'), 0.1); onF(SG, F, F.L/2, outl(1.4, 4.5, 9.0, 'p'), 0.1); crenF(LS, F, 13.0, 1.3, 1.2, 0.7, 0.3); }
  B.flush(g);
  return g; }};
place('nyabyssinian', 40.8164, -73.9406, -74.2, -26.2, GRID);

// =====================================================================================================================
// Morris-Jumel Mansion (1765, Roger Morris; Manhattan's oldest house): Palladian Georgian country house of painted wood on a
// raised basement, the two-storey portico of four Tuscan columns under a triangular pediment facing south, the Federal
// entrance with fanlight, rusticated wooden quoins, nine-over-nine windows, the low hipped roof with dormers, the
// balustraded roof deck and four brick chimneys, and the two-storey octagonal room at the rear. Set in Roger Morris Park on
// the ridge above the Harlem River. Frame: rot = -0.1623 (the house's own axis), +z = south (the portico).
LANDMARKS.nyjumel = {zh:'莫里斯-朱梅尔宅邸', en:'Morris-Jumel Mansion', cat:'old', r:30, h:15,
  lt:{m:0, c:'#ffe6c0', k:0.8, e:0.9}, build(){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
  const WD = B.p({c:'#ece6d8', m:0, lk:0.9}), WT = B.p({c:'#f8f5ee', m:0, lk:1.0}), QN = B.p({c:'#ddd5c3', m:0, lk:0.8}), SB = B.p({c:'#8e877b', m:0, lk:0.4});
  const RS = B.p({c:'#4f4a45', m:0, lk:0.15}), CH = B.p({c:'#87503e', m:0, lk:0.3}), WN = B.p({c:'#2a2f33', glow:'#ffd9a4', gk:0.3}), DR = B.p('#3c2c22');
  const GS = B.p({c:'#5d7a46', m:0, lk:0.05}), PA = B.p({c:'#b3a88f', m:0, lk:0.1}), TK = B.p('#5b4a3a'), LV = B.p({c:'#4d6b3b', m:0, lk:0.06}), HG = B.p({c:'#3f5a33', m:0, lk:0.05});
  const X0 = -8.5, X1 = 8.5, Z0 = -1.5, Z1 = 10.8, YB = 1.3, YE = 9.6;
  // raised basement (stone) down the slope, wooden walls, quoins, cornice
  blk(SB, SB, X0 - 0.15, X1 + 0.15, -5, YB, Z0 - 0.15, Z1 + 0.15);
  blk(WD, RS, X0, X1, YB, YE, Z0, Z1);
  for (const [x, z] of [[X0, Z0], [X1, Z0], [X0, Z1], [X1, Z1]]) for (let y = YB; y < YE - 0.4; y += 0.7) abox(QN, x - 0.35 - (y % 1.4 < 0.7 ? 0.15 : 0), x + 0.35 + (y % 1.4 < 0.7 ? 0.15 : 0), y, y + 0.55, z - 0.35, z + 0.35);
  const FS = rectF(X0, X1, Z0, Z1);
  for (const key of ['n', 'e', 's', 'w']){ const F = FS[key];
    bandF(WT, F, YE - 0.45, 0.45, 0.4); bandF(WT, F, YB + 4.15, 0.18, 0.1);
    const n = key === 'n' || key === 's' ? 5 : 3, st = F.L/n;
    for (let i = 0; i < n; i++){ const c = st*(i + 0.5);
      if (key === 's' && i === 2) continue;
      if (key === 'n' && i === 2) continue;
      for (const y of [YB + 0.9, YB + 4.8]){ onF(WT, F, c, outl(1.35, y - 0.12, y + 2.25, 's'), 0.06); onF(WN, F, c, outl(1.1, y, y + 2.1, 's'), 0.1); bF(WT, F, c, 1.6, y + 2.25, y + 2.5, 0.16); } } }
  // the front door with fanlight and sidelights (behind the portico); the window over it
  { const F = FS.s; onF(WT, F, F.L/2, outl(2.6, YB, YB + 3.1, 'r', 6), 0.06); onF(DR, F, F.L/2, outl(1.3, YB, YB + 2.6, 's'), 0.12); onF(WN, F, F.L/2, outl(1.3, YB + 2.65, YB + 2.75, 'r', 6), 0.12);
    onF(WT, F, F.L/2, outl(1.4, YB + 4.7, YB + 7.2, 's'), 0.06); onF(WN, F, F.L/2, outl(1.15, YB + 4.8, YB + 7.1, 's'), 0.1); }
  // hipped roof with the flat deck and balustrade, dormers, chimneys
  const HR = 3.4, DK = YE + HR;
  { const xa = X0 - 0.45, xb = X1 + 0.45, za = Z0 - 0.45, zb = Z1 + 0.45, i0 = 2.6;
    const P = [[xa, YE, za], [xb, YE, za], [xb, YE, zb], [xa, YE, zb]], Pt = [[xa + i0*1.7, DK, za + i0*1.4], [xb - i0*1.7, DK, za + i0*1.4], [xb - i0*1.7, DK, zb - i0*1.4], [xa + i0*1.7, DK, zb - i0*1.4]];
    for (let i = 0; i < 4; i++){ const j = (i + 1) % 4; Q(RS, P[i], P[j], Pt[j], Pt[i]); }
    Q(RS, Pt[0], Pt[3], Pt[2], Pt[1]);
    const bx0 = Pt[0][0], bx1 = Pt[1][0], bz0 = Pt[0][2], bz1 = Pt[2][2];
    for (const [a, b] of [[[bx0, bz0], [bx1, bz0]], [[bx1, bz0], [bx1, bz1]], [[bx1, bz1], [bx0, bz1]], [[bx0, bz1], [bx0, bz0]]]){
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(L/0.45);
      seg(WT, [a[0], DK + 0.95, a[1]], [b[0], DK + 0.95, b[1]], 0.07, 4);
      for (let i = 0; i <= n; i++){ const t = i/n; seg(WT, [a[0] + (b[0] - a[0])*t, DK, a[1] + (b[1] - a[1])*t], [a[0] + (b[0] - a[0])*t, DK + 0.9, a[1] + (b[1] - a[1])*t], 0.05, 3); } } }
  for (const x of [-4.2, 4.2]) for (const zf of [Z1, Z0]){ const zz = zf === Z1 ? zf - 0.9 : zf + 0.9, dz = zf === Z1 ? 1 : -1;
    abox(WT, x - 0.8, x + 0.8, YE + 0.2, YE + 2.0, Math.min(zz, zz + dz*1.6), Math.max(zz, zz + dz*1.6)); gableZ(RS, x - 0.95, x + 0.95, Math.min(zz - dz*0.6, zz + dz*1.7), Math.max(zz - dz*0.6, zz + dz*1.7), YE + 2.0, 0.9, WT);
    onF(WN, dz > 0 ? fc(x - 0.8, zz + 1.6, x + 0.8, zz + 1.6) : fc(x + 0.8, zz - 1.6, x - 0.8, zz - 1.6), 0.8, outl(0.9, YE + 0.4, YE + 1.7, 's'), 0.05); }
  for (const [x, z] of [[-6.6, 0.5], [6.6, 0.5], [-6.6, 8.8], [6.6, 8.8]]){ abox(CH, x - 0.55, x + 0.55, YE, DK + 2.0, z - 0.8, z + 0.8); abox(WT, x - 0.65, x + 0.65, DK + 1.8, DK + 2.0, z - 0.9, z + 0.9); }
  // the portico: stone platform and steps, four Tuscan columns, entablature, pediment
  const PZ0 = Z1, PZ1 = 13.2, PX = 4.95;
  abox(SB, -PX, PX, -1.5, YB - 0.15, PZ0, PZ1);
  for (let s = 0; s < 5; s++) abox(SB, -1.6, 1.6, -1.5, YB - 0.15 - s*0.27, PZ1, PZ1 + 0.38*(s + 1));
  abox(WT, -PX, PX, YB - 0.15, YB, PZ0, PZ1);
  for (const x of [-4.2, -1.45, 1.45, 4.2]){ lathe(WT, [[0.42, YB], [0.42, YB + 0.3], [0.33, YB + 0.42], [0.32, YB + 1.0], [0.26, YE - 0.75], [0.33, YE - 0.6], [0.42, YE - 0.45], [0.42, YE - 0.3]], x, PZ1 - 0.55, 10); }
  abox(WT, -PX, PX, YE - 0.3, YE + 0.5, PZ0 - 0.1, PZ1);
  { const F = fc(-PX, PZ1, PX, PZ1); extF(WT, F, F.L/2, [[-PX - 0.15, YE + 0.5], [PX + 0.15, YE + 0.5], [0, YE + 2.65]], -2.5, 0.12);
    extF(QN, F, F.L/2, [[-PX + 0.7, YE + 0.75], [PX - 0.7, YE + 0.75], [0, YE + 2.2]], 0.1, 0.16);
    onF(WN, F, F.L/2, outl(1.0, YE + 1.0, YE + 1.2, 'r', 6), 0.18); }
  gableZ(RS, -PX - 0.2, PX + 0.2, PZ0 - 1.5, PZ1 + 0.2, YE + 0.5, 0.01, WT);
  // the octagonal room at the rear (two storeys) with its own low roof
  { const cx = 0.3, cz = -7.6, R = 4.1;
    blk(SB, SB, -3.3, 3.9, -5, YB, -7.6, Z0); blk(WD, RS, -3.3, 3.9, YB, YE, -7.6, Z0);
    cyl(SB, cx, cz, R, -5, YB, 8, false, PI/8); cyl(WD, cx, cz, R*0.98, YB, YE, 8, false, PI/8);
    cyl(WT, cx, cz, R*0.98 + 0.25, YE - 0.4, YE, 8, false, PI/8);
    lathe(RS, [[R + 0.35, YE], [1.0, YE + 2.4], [0.0, YE + 2.5]], cx, cz, 8, PI/8);
    for (let k = 0; k < 8; k++){ const a = PI/8 + (k + 0.5)/8*TAU; if (Math.sin(a) > 0.3) continue; const F = radF(cx, cz, a, R*0.98*Math.cos(PI/8), 1.5);
      for (const y of [YB + 0.9, YB + 4.8]){ onF(WT, F, 1.5, outl(1.3, y - 0.12, y + 2.2, 's'), 0.06); onF(WN, F, 1.5, outl(1.05, y, y + 2.05, 's'), 0.1); } } }
  // lawn, the gravel path to the portico, hedges, a few trees of the park
  // the hilltop lawn of Roger Morris Park held by a low stone retaining wall (the app's ground falls away to the east)
  { const T = [[-14.5, -16], [14.5, -16], [14.5, 18.5], [-14.5, 18.5]], Bt = [[-18.5, -20], [18.5, -20], [18.5, 22.5], [-18.5, 22.5]];
    for (let i = 0; i < 4; i++){ const j = (i + 1) % 4; Q(GS, [Bt[i][0], -6.5, Bt[i][1]], [Bt[j][0], -6.5, Bt[j][1]], [T[j][0], -0.1, T[j][1]], [T[i][0], -0.1, T[i][1]]); }
    Q(GS, [T[0][0], -0.1, T[0][1]], [T[1][0], -0.1, T[1][1]], [T[2][0], -0.1, T[2][1]], [T[3][0], -0.1, T[3][1]]); }
  abox(PA, -1.6, 1.6, -0.1, -0.03, 14.6, 18.5); abox(PA, -11, 11, -0.1, -0.03, 15.4, 16.6);
  for (const s of [-1, 1]) abox(HG, s*5.5 - 2.5, s*5.5 + 2.5, -0.1, 0.8, 17.2, 17.9);
  for (const [x, z] of [[-12, -13], [11.5, -13.5], [-12.5, 6], [12.5, 9], [-10, 15], [11, -2]]) treeAt(TK, LV, x, -0.1, z, 10 + rng()*4, rng);
  B.flush(g);
  return g; }};
place('nyjumel', 40.8345, -73.9388, 19.4, 3.3, -0.1623);

// =====================================================================================================================
// Yeshiva University, Zysman Hall (the Main Building; Charles B. Meyers, 1928; 2540 Amsterdam Avenue): Moorish / Byzantine
// Revival with Art Deco touches, in blocks of buff-orange coloured stone with cream trim and bands of coloured ceramic tile; the 40 m front on Amsterdam Avenue
// with the domed entrance tower (round-arched portal with a tiled tympanum, an arcaded belvedere, an octagonal drum and the
// ribbed copper dome), octagonal corner turrets with small copper domes, the arcaded top storey, and the long wing to the west
// along 187th Street. Frame: rot = -0.5079, +x = Amsterdam Avenue (front), -z = 187th Street.
const ZYS_R = [[-25.9,8.0],[-26.2,-19.0],[-24.7,-20.5],[-22.6,-20.4],[-21.2,-18.9],[7.4,-19.0],[7.4,-19.5],[23.9,-19.6],[23.9,4.4],[25.4,4.3],[26.1,5.3],[26.2,6.6],[25.2,7.7],[25.5,20.5],[5.2,19.5],[5.1,14.8],[4.2,16.1],[2.7,16.0],[2.0,15.3],[2.0,9.4],[-21.0,9.4],[-21.0,8.0]];
LANDMARKS.nyzysman = {zh:'叶史瓦大学齐斯曼楼', en:'Yeshiva University – Zysman Hall', cat:'old', r:36, h:42,
  lt:{m:0, c:'#ffe2b4', k:0.85, e:0.6}, build(){
  const g = new THREE.Group(), B = mkB();
  const BR = B.p({c:'#c08a5c', m:0, lk:0.7}), BD = B.p({c:'#a8754c', m:0, lk:0.5}), CS = B.p({c:'#e3d7bc', m:0, lk:1.0}), RF = B.p('#6a645c');
  const CU = B.p({c:'#5e8d7a', m:0, lk:0.8}), TB = B.p({c:'#2f5f99', m:0, lk:0.6}), TG = B.p({c:'#c9a143', m:0, lk:0.9}), PN = B.p({c:'#2a2f37', m:1, fh:4.2, cw:1.6}), DR = B.p('#43301f');
  const YE = 21.6, FH = 4.2;
  prism(BR, ZYS_R, -4, YE, true, RF);
  const FR = ringF(ZYS_R);
  for (const F of FR){ if (F.L < 2.5) continue;
    bandF(CS, F, 0.0, 1.0, 0.12); bandF(CS, F, 4.3, 0.35, 0.18);
    // tile band and cornice
    for (let u = 0.3, k = 0; u < F.L - 0.3; u += 0.6, k++) bF(k % 2 ? TB : TG, F, u, 0.6, YE - 1.4, YE - 0.85, 0.08);
    bandF(CS, F, YE - 0.85, 0.85, 0.35); bandF(CS, F, YE, 0.6, 0.2);
    for (let u = 0.6; u < F.L - 0.4; u += 1.2) bF(CS, F, u, 0.5, YE + 0.6, YE + 1.3, 0.2);
    // windows: four storeys of paired windows, the top storey an arcade of round arches
    const n = Math.max(1, Math.round(F.L/3.3)), st = F.L/n;
    for (let i = 0; i < n; i++){ const c = st*(i + 0.5);
      for (let f = 0; f < 4; f++){ const y = 1.3 + f*FH; onF(CS, F, c, outl(st*0.66, y - 0.15, y + 2.65, 's'), 0.05); onF(PN, F, c, outl(st*0.54, y, y + 2.5, 's'), 0.1); }
      onF(CS, F, c, outl(st*0.7, 18.0 - 0.1, 19.2, 'r', 5), 0.05); onF(PN, F, c, outl(st*0.56, 18.0, 19.2, 'r', 5), 0.1);
      if (i > 0) bF(CS, F, st*i, 0.3, 17.8, 19.9, 0.14); } }
  // the entrance tower on Amsterdam Avenue: square shaft, portal, belvedere, octagonal drum, ribbed dome, lantern
  const TX0 = 19.0, TX1 = 26.4, TZ0 = 2.4, TZ1 = 9.6, tcx = (TX0 + TX1)/2, tcz = (TZ0 + TZ1)/2, TY = 31.0;
  blk(BR, RF, TX0, TX1, -4, TY, TZ0, TZ1);
  for (const [x, z] of [[TX0, TZ0], [TX1, TZ0], [TX0, TZ1], [TX1, TZ1]]) abox(BD, x - 0.45, x + 0.45, 0, TY, z - 0.45, z + 0.45);
  const TF = rectF(TX0, TX1, TZ0, TZ1);
  { const F = TF.e; onF(CS, F, F.L/2, outl(5.0, 0, 6.2, 'r', 9), 0.12); onF(TB, F, F.L/2, outl(4.0, 4.6, 6.0, 'r', 9), 0.2); onF(DR, F, F.L/2, outl(3.2, 0, 4.6, 's'), 0.2);
    bF(CS, F, F.L/2, 5.4, 4.5, 4.75, 0.3); }
  for (const F of [TF.e, TF.n, TF.s, TF.w]){
    bandF(CS, F, YE - 0.85, 0.85, 0.4); bandF(CS, F, TY - 0.6, 0.6, 0.4);
    for (let u = 0.4, k = 0; u < F.L - 0.3; u += 0.55, k++) bF(k % 2 ? TG : TB, F, u, 0.55, TY - 1.3, TY - 0.7, 0.12);
    for (const du of [-1.6, 0, 1.6]) { onF(CS, F, F.L/2 + du, outl(1.3, YE + 1.4, YE + 5.6, 'r', 5), 0.06); onF(PN, F, F.L/2 + du, outl(1.0, YE + 1.6, YE + 5.6, 'r', 5), 0.12); }
    if (F !== TF.e) for (let f = 0; f < 4; f++) onF(PN, F, F.L/2, outl(1.2, 1.5 + f*FH, 3.8 + f*FH, 's'), 0.08); }
  cyl(CS, tcx, tcz, 3.7, TY, TY + 0.5, 8, true, PI/8);
  cyl(BR, tcx, tcz, 3.1, TY + 0.5, TY + 3.6, 8, false, PI/8);
  for (let k = 0; k < 8; k++){ const a = PI/8 + (k + 0.5)/8*TAU, F = radF(tcx, tcz, a, 3.1*Math.cos(PI/8), 1.2); onF(PN, F, 1.2, outl(0.9, TY + 1.0, TY + 2.6, 'r', 4), 0.06); }
  cyl(CS, tcx, tcz, 3.35, TY + 3.6, TY + 4.0, 8, false, PI/8);
  { const prof = []; for (let i = 0; i <= 8; i++){ const t = i/8*HP; prof.push([3.2*Math.cos(t)*(1 - 0.12*Math.sin(t)), TY + 4.0 + 4.6*Math.sin(t)]); }
    lathe(CU, prof, tcx, tcz, 16);
    for (let k = 0; k < 8; k++){ const a = k/8*TAU; for (let i = 0; i < 8; i++){ const [r0, y0] = prof[i], [r1, y1] = prof[i + 1];
      seg(CS, [tcx + Math.cos(a)*(r0 + 0.05), y0, tcz + Math.sin(a)*(r0 + 0.05)], [tcx + Math.cos(a)*(r1 + 0.05), y1, tcz + Math.sin(a)*(r1 + 0.05)], 0.07, 3); } } }
  cyl(CS, tcx, tcz, 0.7, TY + 8.6, TY + 9.6, 8, false); lathe(CU, [[0.85, TY + 9.6], [0.0, TY + 10.6]], tcx, tcz, 8); seg(TG, [tcx, TY + 10.6, tcz], [tcx, TY + 11.3, tcz], 0.06, 4);
  // octagonal corner turrets with small copper domes on the Amsterdam front and the 187th Street corner
  for (const [x, z] of [[24.2, -18.6], [24.6, 19.4], [-24.6, -19.2]]){
    cyl(BR, x, z, 2.0, YE - 4, YE + 4.8, 8, false, PI/8); cyl(CS, x, z, 2.2, YE + 4.8, YE + 5.2, 8, false, PI/8);
    for (let k = 0; k < 8; k++){ const a = PI/8 + (k + 0.5)/8*TAU, F = radF(x, z, a, 2.0*Math.cos(PI/8), 0.7); onF(PN, F, 0.7, outl(0.6, YE + 1.4, YE + 3.6, 'r', 3), 0.06); }
    for (let k = 0; k < 8; k++){ const a = PI/8 + (k + 0.5)/8*TAU; bF(k % 2 ? TB : TG, radF(x, z, a, 2.0*Math.cos(PI/8), 0.7), 0.7, 1.4, YE + 4.2, YE + 4.8, 0.06); }
    lathe(CU, [[2.05, YE + 5.2], [1.95, YE + 6.1], [1.4, YE + 7.1], [0.4, YE + 7.7], [0.0, YE + 7.8]], x, z, 12);
    seg(TG, [x, YE + 7.7, z], [x, YE + 8.5, z], 0.05, 4); }
  // roof bulkheads
  abox(RF, -12, -4, YE, YE + 2.4, -14, -8); abox(RF, 8, 14, YE, YE + 2.0, -10, -4);
  B.flush(g);
  return g; }};
place('nyzysman', 40.852, -73.9295, 61.8, 24.3, GRID);

// =====================================================================================================================
// United Palace (Thomas W. Lamb, 1930, built as Loew's 175th Street Theatre; 4140 Broadway): the eclectic "Indo-Moorish"
// movie palace in cream terracotta filling the block between Broadway, 175th and 176th Streets and Wadsworth Avenue. The
// seven-storey auditorium block with pilasters and a muqarnas-like frieze under the cresting, the stage house on Wadsworth,
// the entrance pavilion at the south end of Broadway with the ziggurat-shaped terracotta panel between niche pilasters, the
// marquee wrapping the corner onto 175th Street and the tall vertical sign (lights only, no letters), the two-storey pavilion
// and the pitched-roof retail wing to the north, and the cupola (the "prayer tower") at the north-east corner.
// Frame: rot = -0.5044, +z = 175th Street, the slanted west edge = Broadway.
LANDMARKS.nyunitedpalace = {zh:'联合宫剧院', en:'United Palace', cat:'old', r:46, h:39,
  lt:{m:0, c:'#ffe4bc', k:0.85, e:0.7}, build(){
  const g = new THREE.Group(), B = mkB();
  const TC = B.p({c:'#e4d6b5', m:0, lk:0.9}), TD = B.p({c:'#c8b58e', m:0, lk:0.75}), OR = B.p({c:'#c79f58', m:0, lk:0.9}), RF = B.p('#6c6a63'), RT = B.p({c:'#7b4a38', m:0, lk:0.2});
  const PN = B.p({c:'#2b3036', m:0, lk:0.1}), SF = B.p({c:'#3d3428', glow:'#ffdcac', gk:0.85}), MQ = B.p({c:'#f6f0e2', glow:'#fff0d4', gk:1.5}), BL = B.p({c:'#ffe7a2', glow:'#ffd27a', gk:2.4});
  const RD = B.p({c:'#a8231d', glow:'#d42a1f', gk:1.1}), BZ = B.p('#5a4630'), DM = B.p({c:'#c7a35a', m:0, lk:1.0});
  const Bp = t => [-11.4 - 16.6*t, 31.1 - 59.4*t], XI = -5.0, YA = 27.5;
  // auditorium block and the stage house
  blk(TC, RF, XI, 27.9, -3, YA, -31.1, 31.1);
  blk(TC, RF, 15.0, 27.9, YA, 32.5, -15, 15);
  // west strip along Broadway: entrance pavilion (with the south-west chamfer), small pavilion, the retail wing
  const strip = (t0, t1) => { const a = Bp(t0), b = Bp(t1); return [a, b, [XI, b[1]], [XI, a[1]]]; };
  const ENT = [[-8.0, 31.1], Bp(0.055), Bp(0.27), [XI, Bp(0.27)[1]], [XI, 31.1]];
  prism(TC, ENT, -3, 19.5, true, RF);
  prism(TC, strip(0.27, 0.39), -3, 10.5, true, RF);
  const RET = [Bp(0.39), Bp(1.0), [-25.7, -31.0], [XI, -31.0], [XI, Bp(0.39)[1]]];
  prism(TC, RET, -3, 9.0, true, RF);
  // retail wing: storefronts, second-storey windows between pilasters, the pitched tile roof along Broadway
  { const a = Bp(0.39), b = Bp(1.0), F = fc(b[0], b[1], a[0], a[1]);
    for (let u = 1.5; u < F.L - 1.0; u += 4.2){ bF(SF, F, u + 2.1, 3.4, 0.3, 3.8, 0.05); onF(PN, F, u + 2.1, outl(2.4, 5.0, 7.4, 's'), 0.06); bF(TD, F, u, 0.6, 0, 9.0, 0.2); }
    bandF(TD, F, 4.0, 0.5, 0.3);
    const n = F.nx, m = F.nz, P0 = fp(F, 0, 9.0, 0.6), P1 = fp(F, F.L, 9.0, 0.6), P2 = fp(F, F.L, 12.0, -4.5), P3 = fp(F, 0, 12.0, -4.5);
    Q(RT, P0, P1, P2, P3); T3(RT, P0, P3, fp(F, 0, 9.0, -4.5)); T3(RT, P1, fp(F, F.L, 9.0, -4.5), P2);
    prism(TC, [[P3[0], P3[2]], [P2[0], P2[2]], [XI, P2[2]], [XI, P3[2]]], 9.0, 12.0, true, RF); }
  // entrance pavilion on Broadway: niche pilasters, the ziggurat panel, cresting; the small pavilion with its pointed niche
  { const a = Bp(0.055), b = Bp(0.27), F = fc(b[0], b[1], a[0], a[1]), L = F.L, c = L/2;
    for (const u of [1.0, L - 1.0]){ bF(TD, F, u, 1.6, 0, 19.5, 0.5); onF(PN, F, u, outl(0.8, 8.5, 12.5, 'p'), 0.55); bF(OR, F, u, 1.9, 19.5, 21.5, 0.6, -0.1); pinn(OR, ...[fp(F, u, 0, 0.3)[0], 21.5, fp(F, u, 0, 0.3)[2]], 0.9, 2.6); }
    for (let k = 0; k < 4; k++) bF(k % 2 ? TC : TD, F, c, L - 3.6 - k*2.2, 7.0 + k*2.6, 7.0 + (k + 1)*2.6, 0.25 + k*0.12);
    bF(OR, F, c, 2.2, 17.4, 19.5, 0.8); onF(PN, F, c, outl(1.6, 8.0, 15.0, 'p', 6), 0.8);
    for (let u = 2.6; u < L - 2.5; u += 1.1) extF(TD, F, u, [[-0.4, 19.5], [0.4, 19.5], [0, 21.0]], -0.15, 0.2);
    bF(SF, F, c, L - 4.0, 0.0, 3.6, 0.06); bF(BZ, F, c, 1.6, 0.0, 3.6, 0.12); }
  { const a = Bp(0.27), b = Bp(0.39), F = fc(b[0], b[1], a[0], a[1]); onF(TD, F, F.L/2, outl(2.6, 2.0, 8.0, 'p', 5), 0.15); onF(PN, F, F.L/2, outl(2.0, 2.4, 7.6, 'p', 5), 0.2);
    for (let u = 0.8; u < F.L; u += 1.0) extF(TD, F, u, [[-0.35, 10.5], [0.35, 10.5], [0, 11.6]], -0.1, 0.15); }
  // the marquee around the south-west corner: Broadway, the chamfer, 175th Street
  { const P = [Bp(0.23), Bp(0.055), [-8.0, 31.1], [2.5, 31.1]];
    for (let i = 0; i < P.length - 1; i++){ const F = fc(P[i][0], P[i][1], P[i + 1][0], P[i + 1][1]);
      const G = F;
      bF(MQ, G, G.L/2, G.L + 0.6, 4.6, 6.3, 3.0); bF(BZ, G, G.L/2, G.L + 0.8, 6.3, 6.55, 3.1); bF(BL, G, G.L/2, G.L + 0.4, 4.5, 4.6, 2.9);
      for (const y of [4.6, 6.15]) bF(BL, G, G.L/2, G.L + 0.66, y, y + 0.14, 3.04);
      bF(RD, G, G.L/2, G.L + 0.64, 5.38, 5.52, 3.02); } }
  // the vertical sign: on the Broadway pilasters just north of the corner
  { const a = Bp(0.055), b = Bp(0.27), F = fc(b[0], b[1], a[0], a[1]), u = F.L - 2.4, S0 = 0.6, SD = 2.6, Y0 = 7.0, Y1 = 21.0;
    bF(RD, F, u, 0.8, Y0, Y1, SD, S0);
    bF(BL, F, u, 0.88, Y1 - 0.2, Y1, SD, S0); bF(BL, F, u, 0.88, Y0, Y0 + 0.2, SD, S0); bF(BL, F, u, 0.88, Y0, Y1, 0.18, S0 + SD - 0.18); bF(BL, F, u, 0.88, Y0, Y1, 0.16, S0);
    bF(MQ, F, u, 0.86, Y0 + 0.7, Y1 - 0.7, 0.1, S0 + SD*0.5 - 0.05);
    bF(OR, F, u, 1.0, Y1, Y1 + 0.8, SD + 0.3, S0 - 0.15); bF(OR, F, u, 1.0, Y0 - 0.6, Y0, SD + 0.3, S0 - 0.15); }
  // auditorium elevations: pilasters, the frieze and cresting, windows on the western part of 176th Street, doors
  const AF = rectF(XI, 27.9, -31.1, 31.1);
  for (const key of ['n', 'e', 's', 'w']){ const F = AF[key];
    for (let u = 2.6; u < F.L - 1.0; u += 5.2) bF(TD, F, u, 1.0, 1.5, YA - 1.6, 0.35);
    bandF(TD, F, 0.0, 1.5, 0.25); bandF(TD, F, 5.6, 0.4, 0.3);
    for (let u = 0.35, k = 0; u < F.L - 0.3; u += 0.7, k++) bF(k % 2 ? TD : OR, F, u, 0.5, YA - 1.6, YA - 0.9, 0.42);
    bandF(TC, F, YA - 0.9, 0.9, 0.5);
    for (let u = 0.7; u < F.L - 0.4; u += 1.4) extF(TD, F, u, [[-0.5, YA], [0.5, YA], [0, YA + 1.4]], -0.1, 0.2);
    for (let u = 5.2; u < F.L - 3.0; u += 10.4) onF(BZ, F, u, outl(2.2, 0, 3.2, 's'), 0.3); }
  { const F = AF.n; for (let i = 0; i < 4; i++){ const u = F.L - 3.0 - i*5.2; for (let f = 0; f < 6; f++) onF(PN, F, u, outl(2.4, 6.4 + f*3.4, 8.6 + f*3.4, 's'), 0.06); } }
  { const F = AF.s; for (let i = 0; i < 2; i++) for (let f = 0; f < 5; f++) onF(PN, F, 2.6 + 2.6 + i*5.2, outl(2.2, 9.6 + f*3.4, 11.8 + f*3.4, 's'), 0.06); }
  // the stage house: plain upper walls with a cornice
  for (const F of Object.values(rectF(15.0, 27.9, -15, 15))) { bandF(TD, F, 32.0, 0.5, 0.3); for (let u = 2.0; u < F.L - 1; u += 4.3) bF(TD, F, u, 0.7, YA, 32.0, 0.2); }
  // the cupola at the north-east corner
  { const x = 24.6, z = -27.8, Y = YA + 0.6;
    cyl(TC, x, z, 2.9, YA, Y, 8, true, PI/8); cyl(TC, x, z, 2.3, Y, Y + 4.2, 8, false, PI/8);
    for (let k = 0; k < 8; k++){ const a = PI/8 + (k + 0.5)/8*TAU, F = radF(x, z, a, 2.3*Math.cos(PI/8), 0.9); onF(SF, F, 0.9, outl(1.0, Y + 0.9, Y + 3.0, 'p', 4), 0.06); }
    cyl(OR, x, z, 2.55, Y + 4.2, Y + 4.7, 8, false, PI/8);
    lathe(DM, [[2.4, Y + 4.7], [2.3, Y + 5.6], [1.7, Y + 6.8], [0.7, Y + 7.6], [0.0, Y + 7.8]], x, z, 12);
    seg(OR, [x, Y + 7.7, z], [x, Y + 9.6, z], 0.07, 4); lathe(OR, [[0.0, Y + 8.6], [0.28, Y + 8.85], [0.0, Y + 9.1]], x, z, 8); }
  B.flush(g);
  return g; }};
place('nyunitedpalace', 40.8471, -73.9385, 46.3, 68.3, -0.5044);

// =====================================================================================================================
// Dyckman Farmhouse (c. 1785, William Dyckman; 4881 Broadway at 204th Street): Manhattan's last Dutch Colonial farmhouse -
// fieldstone and brick lower walls, white clapboard gable ends, the gambrel roof whose flared spring eaves sweep out over the
// front and back porches (added 1825), slender porch posts, dormers, brick chimneys at both gable ends, the lower kitchen wing
// at the west end; on its raised garden terrace above Broadway. Frame: rot = +0.3762 (the house's axis), +z = the Broadway
// side (front porch).
LANDMARKS.nydyckman = {zh:'戴克曼农舍', en:'Dyckman Farmhouse Museum', cat:'old', r:16, h:10,
  lt:{m:0, c:'#ffe6c4', k:0.7, e:0.9}, build(){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
  const FS = B.p({c:'#8c8478', m:0, lk:0.5}), FD = B.p({c:'#77706a', m:0, lk:0.4}), CB = B.p({c:'#f1ede4', m:0, lk:0.9}), WT = B.p({c:'#fbf8f2', m:0, lk:0.9});
  const SH = B.p({c:'#5a524c', m:0, lk:0.15}), BK = B.p({c:'#8a4b39', m:0, lk:0.3}), WN = B.p({c:'#2b3034', glow:'#ffd9a0', gk:0.3}), DR = B.p('#3e5a4a'), WD = B.p('#8f7a62');
  const GS = B.p({c:'#5c7a45', m:0, lk:0.05}), TK = B.p('#5b4a3a'), LV = B.p({c:'#4c6a3a', m:0, lk:0.06});
  const X0 = -3.5, X1 = 8.7, Z0 = -4.3, Z1 = 4.3, YW = 3.0, YK = 5.8, ZK = 2.8, YR = 7.4, ZE = 6.8, YEo = 2.5;
  // the garden terrace with its stone retaining wall (front toward Broadway)
  blk(FD, GS, -11.5, 11.0, -5.0, -0.12, -9.0, 9.3);
  // lower walls: fieldstone, brick quoins at the corners
  blk(FS, FS, X0, X1, -0.12, YW, Z0, Z1);
  for (const [x, z] of [[X0, Z0], [X1, Z0], [X0, Z1], [X1, Z1]]) for (let y = 0; y < YW - 0.2; y += 0.5) abox(BK, x - 0.22, x + 0.22, y, y + 0.25, z - 0.22, z + 0.22);
  // gambrel roof with the flared spring eaves over the porches
  const prof = [[ZE, YEo], [Z1, YW], [ZK, YK], [0, YR], [-ZK, YK], [Z0, YW], [-ZE, YEo]];
  for (let i = 0; i < prof.length - 1; i++){ const a = prof[i], b = prof[i + 1]; Q(SH, [X0 - 0.4, a[1], a[0]], [X1 + 0.4, a[1], a[0]], [X1 + 0.4, b[1], b[0]], [X0 - 0.4, b[1], b[0]]); }
  // gable ends: clapboard above the stone, with a small attic window
  for (const x of [X0, X1]){ const P = [[Z1, YW], [ZK, YK], [0, YR], [-ZK, YK], [Z0, YW]];
    for (let i = 1; i < P.length - 1; i++) T3(CB, [x, P[0][1], P[0][0]], [x, P[i][1], P[i][0]], [x, P[i + 1][1], P[i + 1][0]]);
    for (let y = YW + 0.3; y < YK; y += 0.3) abox(WT, x - 0.04, x + 0.04, y, y + 0.03, -(ZK + (YK - y)/(YK - YW)*(Z1 - ZK)) + 0.1, (ZK + (YK - y)/(YK - YW)*(Z1 - ZK)) - 0.1);
    const F = x === X0 ? fc(X0, Z0, X0, Z1) : fc(X1, Z1, X1, Z0); onF(WN, F, F.L/2 - 1.2, outl(0.7, YW + 1.2, YW + 2.2, 's'), 0.06); onF(WN, F, F.L/2 + 1.2, outl(0.7, YW + 1.2, YW + 2.2, 's'), 0.06); }
  // chimneys at both gable ends
  for (const x of [X0 + 0.5, X1 - 0.5]){ abox(BK, x - 0.45, x + 0.45, YK, YR + 1.3, -0.6, 0.6); abox(BK, x - 0.55, x + 0.55, YR + 1.1, YR + 1.3, -0.7, 0.7); }
  // front and back: door, windows (six-over-six), dormers on the lower roof slope
  for (const s of [1, -1]){ const F = s > 0 ? fc(X0, Z1, X1, Z1) : fc(X1, Z0, X0, Z0), c = F.L/2;
    onF(DR, F, c, outl(1.0, 0.0, 2.15, 's'), 0.06); onF(WT, F, c, outl(1.25, 0.0, 2.35, 's'), 0.03);
    for (const du of [-4.2, -2.1, 2.1, 4.2]){ onF(WT, F, c + du, outl(1.15, 0.65, 2.45, 's'), 0.03); onF(WN, F, c + du, outl(0.9, 0.75, 2.35, 's'), 0.06); }
    for (const du of [-2.6, 2.6]){ const xx = (s > 0 ? X0 + c + du : X1 - c - du), zz = s*(ZK + 0.6);
      abox(CB, xx - 0.65, xx + 0.65, YW + 1.4, YW + 2.7, Math.min(zz, s*(Z1 - 0.2)), Math.max(zz, s*(Z1 - 0.2)));
      gableZ(SH, xx - 0.8, xx + 0.8, Math.min(s*(ZK + 0.3), s*(Z1 + 0.1)), Math.max(s*(ZK + 0.3), s*(Z1 + 0.1)), YW + 2.7, 0.6, CB);
      onF(WN, s > 0 ? fc(xx - 0.65, Z1 - 0.15, xx + 0.65, Z1 - 0.15) : fc(xx + 0.65, -Z1 + 0.15, xx - 0.65, -Z1 + 0.15), 0.65, outl(0.75, YW + 1.6, YW + 2.5, 's'), 0.08); }
    // porch: floor, posts, simple rail
    abox(WD, X0 - 0.2, X1 + 0.2, -0.12, 0.35, s > 0 ? Z1 : -ZE + 0.2, s > 0 ? ZE - 0.2 : Z0);
    for (let x = X0; x <= X1 + 0.01; x += (X1 - X0)/5){ abox(WT, x - 0.07, x + 0.07, 0.35, YEo + 0.05, s*(ZE - 0.45) - 0.07, s*(ZE - 0.45) + 0.07); }
    abox(WT, X0, X1, 1.0, 1.06, s*(ZE - 0.45) - 0.04, s*(ZE - 0.45) + 0.04);
    if (s > 0) for (let k = 0; k < 3; k++) abox(FS, (X0 + X1)/2 - 1.0, (X0 + X1)/2 + 1.0, -0.12 - (k + 1)*0.4, 0.35 - (k + 1)*0.42 + 0.0, ZE - 0.2, ZE - 0.2 + 0.4*(k + 1)); }
  // the kitchen wing (west): stone and clapboard, its own gable roof
  { const x0 = -9.0, x1 = X0, z0 = -4.5, z1 = 2.2; blk(FS, FS, x0, x1, -0.12, 2.6, z0, z1); gableX(SH, x0 - 0.3, x1, z0 - 0.4, z1 + 0.4, 2.6, 2.0, CB);
    const F = fc(x0, z1, x1, z1); onF(DR, F, 1.6, outl(0.9, 0, 2.0, 's'), 0.06); onF(WN, F, 4.0, outl(0.8, 0.8, 1.9, 's'), 0.06);
    abox(BK, x0 + 0.2, x0 + 1.0, 2.6, 5.4, -1.6, -0.6); }
  // garden: shrubs and two trees on the terrace
  for (const [x, z] of [[-9.5, 6.5], [10.0, -7.0], [-8.0, -7.5], [10.2, 7.2]]) cyl(LV, x, z, [0.9, 0.2], -0.12, 1.4, 6, true, rng());
  treeAt(TK, LV, -10.0, -0.12, 0.0, 9, rng); treeAt(TK, LV, 9.8, -0.12, 0.5, 8, rng);
  B.flush(g);
  return g; }};
place('nydyckman', 40.8667, -73.9238, 77.4, -74.3, 0.3762);

// =====================================================================================================================
// Henry Hudson Bridge (David B. Steinman, 1936; upper level 1938): the fixed steel arch of 840 ft (256 m) over Spuyten Duyvil
// Creek - two deep plate-girder ribs, 143 ft (43.6 m) clearance under the crown, lateral and sway bracing - carrying the lower
// level (southbound, with the walkway on its west edge) on spandrel posts and the upper level (northbound) on a frame of
// columns above it; the two tall braced steel towers at the arch ends (~160 ft), the steel approach spans on braced bents
// down the slopes of Inwood Hill and Spuyten Duyvil, the concrete approach viaducts (the south approach with the maintenance
// garage, the north approach), the diverging southbound ramp and the service ramp at the Manhattan end, railings and the
// roadway lamps. Painted blue-grey. The road decks themselves are drawn by the app at the heights set by
// nyharlem_deck_fix.py (lower 49.0 m / upper 54.6 m at the crown); this model fits around them.
// Frame: rot = 0.7126, local +x = along the bridge to the Bronx (north-east), +z = south-east; origin = s 0 of the fitted
// axis; heights planned in world metres (the app's base for r = 380 is HHD.base).
// <HHD> generated by tools/hhb_gen.py from nyharlem_deck_fix.py (do not edit by hand)
const HHD = {base:47.09, lat:40.8779187, lon:-73.9219622, rot:0.7126, s0:-390, st:5,
  gmin:[47.5, 47.5, 47.5, 47.4, 47.4, 47.2, 46.3, 44.4, 42.4, 40.5, 38.5, 36.5, 34.4, 32.3, 30.2, 28.1, 25.9, 23.7, 21.4, 19.2, 16.8, 14.5, 12.1, 9.7, 7.2, 4.7, 2.2, -0.2, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.0, 0.4, 0.8, 1.4, 2.1, 2.9, 3.7, 4.7, 5.8, 7.0, 8.3, 9.7, 11.2, 12.8, 14.7, 16.9, 19.0, 21.0, 23.0, 24.7, 26.5, 28.1, 29.7, 31.3, 32.8, 34.3, 35.7, 37.1, 38.4, 39.6, 40.9, 42.0, 43.2, 44.2, 45.3, 46.2, 47.2, 47.6, 48.0, 48.4, 48.8, 49.1, 49.4, 49.7, 50.0, 50.2, 50.4, 50.6, 50.8, 51.0],
  gmax:[55.1, 54.8, 54.1, 53.5, 53.0, 52.5, 52.0, 51.6, 51.2, 50.9, 50.6, 50.3, 48.6, 46.5, 44.4, 42.3, 40.2, 38.0, 35.7, 33.5, 30.8, 28.2, 25.6, 23.0, 20.4, 17.9, 15.4, 12.9, 10.5, 8.1, 5.7, 3.4, 1.1, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.2, -0.0, 0.3, 0.7, 1.2, 1.8, 2.5, 3.4, 4.3, 5.3, 6.5, 7.7, 9.1, 10.5, 12.1, 13.7, 15.5, 17.4, 19.3, 21.2, 23.2, 25.1, 27.1, 28.8, 30.5, 32.1, 33.6, 35.1, 36.6, 38.0, 39.3, 40.6, 41.9, 43.1, 44.2, 45.2, 46.0, 46.9, 47.7, 48.5, 49.3, 50.0, 50.7, 51.4, 51.9, 52.2, 52.5, 52.8, 53.0, 53.2, 53.4, 53.6],
  gc:[51.3, 51.3, 51.2, 51.0, 50.5, 50.0, 49.5, 49.1, 48.8, 47.4, 45.5, 43.5, 41.4, 39.3, 37.2, 35.1, 32.9, 30.7, 28.5, 26.2, 23.9, 21.6, 19.0, 16.4, 13.9, 11.4, 8.9, 6.4, 4.0, 1.6, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.2, -0.0, 0.3, 0.7, 1.2, 1.8, 2.5, 3.3, 4.2, 5.3, 6.4, 7.6, 9.0, 10.4, 11.9, 13.6, 15.3, 17.2, 19.2, 21.2, 23.1, 24.9, 26.6, 28.3, 30.0, 31.5, 33.1, 34.5, 36.0, 37.4, 38.7, 40.0, 41.2, 42.4, 43.6, 44.6, 45.7, 46.6, 47.4, 48.1, 48.9, 49.6, 49.9, 50.3, 50.6, 50.9, 51.2, 51.4, 51.7, 51.9, 52.1, 52.2],
  r307354:[[-251.4, -1.0, 48.21, 4.2], [-273.0, -3.7, 48.24, 13.4], [-292.1, -7.2, 48.29, 20.6], [-311.1, -10.8, 48.36, 27.1], [-331.2, -15.9, 48.46, 32.7], [-351.4, -21.0, 48.57, 37.9], [-369.3, -24.6, 48.66, 41.6]],
  r357720:[[-326.1, 18.1, 56.11, 50.7], [-325.1, 14.0, 55.48, 47.8], [-321.9, 11.9, 54.91, 45.2], [-298.4, 7.8, 51.62, 32.5], [-274.9, 3.6, 49.17, 18.4], [-251.4, -0.6, 48.22, 4.4]],
  r346552:[[-246.4, -9.7, 48.36, -0.3], [-266.5, -14.1, 43.41, 4.3], [-284.2, -21.7, 38.74, 8.6], [-302.0, -29.3, 34.06, 12.5], [-326.7, -32.6, 28.04, 21.4]],
  r307355:[[299.3, -2.2, 49.68, 49.7], [280.9, -0.8, 48.77, 47.5], [274.3, -0.6, 48.56, 46.4], [266.8, -0.4, 48.38, 45.0], [252.7, 0.0, 48.25, 41.9]],
};
// </HHD>
const hhG = (T, s) => { const f = Math.min(T.length - 1.0001, Math.max(0, (s - HHD.s0)/HHD.st)), i = Math.floor(f), t = f - i; return T[i]*(1 - t) + T[i + 1]*t; };
const hhZL = s => 49.0 - 1.4*Math.pow((s - 3.0)/340.0, 2), hhZU = s => hhZL(s) + 5.6;
LANDMARKS.nyhenryhudson = {zh:'亨利·哈德逊大桥', en:'Henry Hudson Bridge', cat:'old', r:380, h:18,
  lt:{m:0, c:'#dfe8ff', k:0.35, e:0.6}, build(){
  const g = new THREE.Group(), B = mkB();
  const ST = B.p({c:'#7c8a94', m:0, lk:0.45}), SD = B.p({c:'#66737c', m:0, lk:0.3}), CO = B.p({c:'#a49f95', m:0, lk:0.25}), CD = B.p({c:'#8b867c', m:0, lk:0.15});
  const RL = B.p('#3e4449'), LP = B.p({c:'#fff1d6', glow:'#ffd9a0', gk:1.6}), NV = B.p({c:'#2a8a3a', glow:'#30ff60', gk:1.6}), NR = B.p({c:'#b02018', glow:'#ff2a1a', gk:1.8});
  const Y = w => w - HHD.base, gmin = s => hhG(HHD.gmin, s), gc = s => hhG(HHD.gc, s);
  const SA = -125.0, SB = 131.0, SC_ = 3.0, HL = 128.0, YS = 2.5, YI = 44.0, RZ = 6.2, RW = 0.6;
  const yi = s => YS + (YI - YS)*(1 - Math.pow((s - SC_)/HL, 2)), dep = s => 3.1 + 2.9*Math.pow((s - SC_)/HL, 2);
  const LB = s => hhZL(s) - 1.95, LT = s => hhZL(s) - 0.05, UB = s => hhZU(s) - 1.95, UT = s => hhZU(s) - 0.05;
  const S_M0 = -251.6, S_M1 = 252.3, S_E0 = -357.7, S_E1 = 322.2, ZE = 7.4;
  // ---------------- the two arch ribs (box section: webs, flanges), stiffener lines ----------------
  const NR_ = 64;
  for (const zc of [-RZ, RZ]){
    for (let i = 0; i < NR_; i++){ const a = SA + (SB - SA)*i/NR_, b = SA + (SB - SA)*(i + 1)/NR_, ya = Y(yi(a)), yb = Y(yi(b)), ta = Y(yi(a) + dep(a)), tb = Y(yi(b) + dep(b));
      for (const w of [zc - RW, zc + RW]) Q(ST, [a, ya, w], [b, yb, w], [b, tb, w], [a, ta, w]);
      Q(SD, [a, ya, zc - RW], [b, yb, zc - RW], [b, yb, zc + RW], [a, ya, zc + RW]); Q(SD, [a, ta, zc - RW], [b, tb, zc - RW], [b, tb, zc + RW], [a, ta, zc + RW]);
      if (i % 2 === 0) for (const w of [zc - RW - 0.05, zc + RW + 0.05]) seg(SD, [a, ya + 0.15, w], [a, ta - 0.15, w], 0.06, 3); }
  }
  // skewbacks (concrete) at the four rib feet and the pier walls between them
  for (const s of [SA, SB]){ const sg = s < 0 ? -1 : 1, g0 = Math.min(gmin(s - 8), gmin(s + 8)) - 3;
    abox(CO, s - 7 + (sg > 0 ? 0 : -3), s + 7 + (sg > 0 ? 3 : 0), Y(g0), Y(YS + 1.5), -RZ - 3.2, RZ + 3.2, true);
    abox(CD, s - 7.5 + (sg > 0 ? 0 : -3), s + 7.5 + (sg > 0 ? 3 : 0), Y(YS + 1.5), Y(YS + 2.0), -RZ - 3.5, RZ + 3.5); }
  // ---------------- panel points of the arch: spandrel posts, sway frames, lateral bracing ----------------
  const NPAN = 16, PAN = [];
  for (let k = 0; k <= NPAN; k++) PAN.push(SA + (SB - SA)*k/NPAN);
  for (let k = 0; k <= NPAN; k++){ const s = PAN[k], top = yi(s) + dep(s), lb = LB(s);
    // lateral bracing between the ribs (struts at both flanges)
    abox(SD, s - 0.35, s + 0.35, Y(yi(s) + 0.1), Y(yi(s) + 0.8), -RZ, RZ); abox(SD, s - 0.35, s + 0.35, Y(top - 0.8), Y(top - 0.1), -RZ, RZ);
    if (k < NPAN){ const s2 = PAN[k + 1]; seg(SD, [s, Y(yi(s) + 0.4), -RZ], [s2, Y(yi(s2) + 0.4), RZ], 0.14, 4); seg(SD, [s, Y(yi(s) + 0.4), RZ], [s2, Y(yi(s2) + 0.4), -RZ], 0.14, 4);
      seg(SD, [s, Y(top - 0.4), -RZ], [s2, Y(yi(s2) + dep(s2) - 0.4), RZ], 0.12, 4); }
    if (k === 0 || k === NPAN) continue;
    const h = lb - top;
    if (h > 0.6){ for (const zc of [-RZ, RZ]) abox(ST, s - 0.5, s + 0.5, Y(top), Y(lb), zc - 0.55, zc + 0.55, true);
      if (h > 4){ seg(SD, [s, Y(top + 0.5), -RZ], [s, Y(lb - 0.5), RZ], 0.13, 4); seg(SD, [s, Y(top + 0.5), RZ], [s, Y(lb - 0.5), -RZ], 0.13, 4); }
      if (h > 12) abox(SD, s - 0.3, s + 0.3, Y(top + h/2 - 0.3), Y(top + h/2 + 0.3), -RZ, RZ); }
  }
  // ---------------- the towers at the arch ends (braced steel, from the skewbacks to the upper deck) ----------------
  for (const s of [SA, SB]){ const sg = s < 0 ? -1 : 1, s0 = s + sg*0.5, s1 = s + sg*7.5, yb = YS + 2.0, yt = UB(s);
    for (const ss of [s0, s1]) for (const zc of [-ZE, ZE]) abox(ST, ss - 0.6, ss + 0.6, Y(yb), Y(yt), zc - 0.6, zc + 0.6, true);
    const nb = Math.max(2, Math.round((yt - yb)/8.5)), dh = (yt - yb)/nb;
    for (let j = 0; j < nb; j++){ const y0 = yb + j*dh, y1 = y0 + dh;
      for (const ss of [s0, s1]){ seg(SD, [ss, Y(y0), -ZE], [ss, Y(y1), ZE], 0.15, 4); seg(SD, [ss, Y(y0), ZE], [ss, Y(y1), -ZE], 0.15, 4); abox(SD, ss - 0.35, ss + 0.35, Y(y1 - 0.5), Y(y1), -ZE, ZE); }
      for (const zc of [-ZE, ZE]){ seg(SD, [s0, Y(y0), zc], [s1, Y(y1), zc], 0.13, 4); seg(SD, [s0, Y(y1), zc], [s1, Y(y0), zc], 0.13, 4); abox(SD, Math.min(s0, s1), Math.max(s0, s1), Y(y1 - 0.5), Y(y1), zc - 0.35, zc + 0.35); } } }
  // ---------------- steel approach spans: braced bents down the slopes ----------------
  const BENTS = [];
  for (let k = 1; k <= 4; k++) BENTS.push(SA - 7.5 - (SA - 7.5 - S_M0)*k/5, SB + 7.5 + (S_M1 - SB - 7.5)*k/5);
  for (const s of BENTS){ const g0 = Math.min(gmin(s - 2), gmin(s + 2)) - 1.5, yt = UB(s), yl = LB(s);
    abox(CO, s - 2.0, s + 2.0, Y(g0 - 1.5), Y(Math.max(g0 + 1.2, -0.3 + 1.2)), -ZE - 2.0, ZE + 2.0, true);
    for (const zc of [-ZE, ZE]) abox(ST, s - 0.55, s + 0.55, Y(g0 + 1), Y(yt), zc - 0.55, zc + 0.55, true);
    const h = yl - g0; if (h > 3){ const nb = Math.max(1, Math.round(h/9)), dh = (yl - g0 - 1)/nb;
      for (let j = 0; j < nb; j++){ const y0 = g0 + 1 + j*dh, y1 = y0 + dh; seg(SD, [s, Y(y0), -ZE], [s, Y(y1), ZE], 0.14, 4); seg(SD, [s, Y(y0), ZE], [s, Y(y1), -ZE], 0.14, 4); abox(SD, s - 0.3, s + 0.3, Y(y1 - 0.4), Y(y1), -ZE, ZE); } } }
  // the concrete abutment piers at the ends of the steel spans
  for (const s of [S_M0, S_M1]){ const g0 = Math.min(gmin(s - 4), gmin(s + 4)) - 2;
    abox(CO, s - 2.5, s + 2.5, Y(g0), Y(LB(s)), -ZE - 1.2, ZE + 1.2, true); abox(CD, s - 2.8, s + 2.8, Y(LB(s) - 0.6), Y(LB(s)), -ZE - 1.5, ZE + 1.5); }
  // ---------------- the deck systems (lower level s S_M0..S_M1, upper level over the whole length) ----------------
  const deck = (s0, s1, bot, top, z0, z1, mat, fasc, n) => { for (let i = 0; i < n; i++){ const a = s0 + (s1 - s0)*i/n, b = s0 + (s1 - s0)*(i + 1)/n;
      const P = (s, y, z) => [s, Y(y), z];
      Q(mat, P(a, top(a), z0), P(b, top(b), z0), P(b, top(b), z1), P(a, top(a), z1));
      Q(mat, P(a, top(a) - 0.3, z0), P(b, top(b) - 0.3, z0), P(b, top(b) - 0.3, z1), P(a, top(a) - 0.3, z1));
      for (const z of [z0, z1]){ Q(fasc, P(a, bot(a), z), P(b, bot(b), z), P(b, top(b) + 0.15, z), P(a, top(a) + 0.15, z));
        Q(fasc, P(a, bot(a), z), P(b, bot(b), z), P(b, bot(b), z + (z > 0 ? -0.5 : 0.5)), P(a, bot(a), z + (z > 0 ? -0.5 : 0.5))); } } };
  deck(S_M0, S_M1, LB, LT, -8.7, 8.1, CO, ST, 80);
  deck(S_E0, S_E1, UB, UT, -7.8, 7.8, CO, ST, 96);
  // floor beams, upper-level columns with knee braces, railings and lamps
  const FB = []; for (let s = S_M0 + 4; s < S_M1 - 2; s += 8.0) FB.push(s);
  for (const s of FB){ abox(SD, s - 0.3, s + 0.3, Y(LB(s)), Y(LT(s) - 0.3), -8.4, 7.8); }
  for (let s = S_E0 + 3; s < S_E1 - 2; s += 8.0) abox(SD, s - 0.3, s + 0.3, Y(UB(s)), Y(UT(s) - 0.3), -7.5, 7.5);
  for (let s = S_M0 + 4; s < S_M1 - 2; s += 16.0) for (const zc of [-8.3, 7.7]){
    abox(ST, s - 0.4, s + 0.4, Y(LT(s)), Y(UB(s)), zc - 0.4, zc + 0.4, true);
    seg(SD, [s - 2.6, Y(UB(s - 2.6) - 0.1), zc], [s, Y(UB(s) - 1.6), zc], 0.1, 3); seg(SD, [s + 2.6, Y(UB(s + 2.6) - 0.1), zc], [s, Y(UB(s) - 1.6), zc], 0.1, 3); }
  const rail = (s0, s1, top, z, n, step) => { for (let s = s0; s <= s1; s += step) abox(RL, s - 0.05, s + 0.05, Y(top(s)), Y(top(s) + 1.1), z - 0.05, z + 0.05, true);
    for (let i = 0; i < n; i++){ const a = s0 + (s1 - s0)*i/n, b = s0 + (s1 - s0)*(i + 1)/n; for (const dy of [1.05, 0.55]) Q(RL, [a, Y(top(a) + dy), z], [b, Y(top(b) + dy), z], [b, Y(top(b) + dy + 0.07), z], [a, Y(top(a) + dy + 0.07), z]); } };
  rail(S_E0, S_E1, UT, -7.7, 60, 2.5); rail(S_E0, S_E1, UT, 7.7, 60, 2.5);
  rail(S_M0, S_M1, LT, -8.6, 50, 2.5); rail(S_M0, S_M1, LT, 8.0, 50, 2.5);
  rail(S_M0, S_M1, LT, -6.0, 50, 5.0);                       // the walkway's separation railing
  for (let s = S_E0 + 10, k = 0; s < S_E1 - 5; s += 32, k++){ const z = (k % 2 ? 1 : -1)*7.5, yt = UT(s);
    seg(RL, [s, Y(yt), z], [s, Y(yt + 9.5), z], 0.1, 5); seg(RL, [s, Y(yt + 9.5), z], [s, Y(yt + 9.5), z*0.75], 0.07, 3); abox(LP, s - 0.35, s + 0.35, Y(yt + 9.1), Y(yt + 9.4), z*0.75 - 0.25, z*0.75 + 0.25); }
  for (let s = S_M0 + 14; s < S_M1 - 5; s += 32) abox(LP, s - 0.3, s + 0.3, Y(UB(s) - 0.15), Y(UB(s) - 0.05), -1.0, 1.0);
  // navigation lights under the crown (centre green, red at the channel edges)
  abox(NV, SC_ - 0.3, SC_ + 0.3, Y(YI - 0.6), Y(YI - 0.1), -RZ - 0.8, -RZ - 0.2); abox(NV, SC_ - 0.3, SC_ + 0.3, Y(YI - 0.6), Y(YI - 0.1), RZ + 0.2, RZ + 0.8);
  for (const s of [-60, 66]) abox(NR, s - 0.3, s + 0.3, Y(yi(s) - 0.6), Y(yi(s) - 0.1), -RZ - 0.8, -RZ - 0.2);
  // ---------------- concrete approach viaducts: Manhattan (with the maintenance garage) and the Bronx ----------------
  const cbent = (s, z0, z1, ytop, g0) => { const hb = ytop - g0; if (hb < 1.0) return;
    for (const zc of [z0 + 0.8, z1 - 0.8]) abox(CO, s - 0.65, s + 0.65, Y(g0 - 1.5), Y(ytop), zc - 0.65, zc + 0.65, true);
    abox(CD, s - 0.8, s + 0.8, Y(ytop - 1.2), Y(ytop), z0, z1); if (hb > 12) abox(CD, s - 0.5, s + 0.5, Y(g0 + hb*0.5 - 0.5), Y(g0 + hb*0.5 + 0.5), z0 + 0.8, z1 - 0.8); };
  for (let s = S_E0 + 6; s < S_M0 - 2; s += 14.5) cbent(s, -7.6, 7.6, UB(s), Math.min(gmin(s), gc(s)) - 0.5);
  for (let s = S_M1 + 7; s < S_E1 - 2; s += 13) cbent(s, -7.6, 7.6, UB(s), Math.min(gmin(s), gc(s)) - 0.5);
  // the garage block under the south approach where the ground is low
  { const s0 = -330, s1 = -268, z0 = -7.4, z1 = 7.4, yt = UB(-299) - 1.5;
    for (let i = 0; i < 6; i++){ const a = s0 + (s1 - s0)*i/6, b = s0 + (s1 - s0)*(i + 1)/6, ga = gmin(a) - 1, gb = gmin(b) - 1, ya = Math.min(yt, ga + 16), yb2 = Math.min(yt, gb + 16);
      if (ya - ga < 3) continue;
      for (const z of [z0, z1]) Q(CO, [a, Y(ga), z], [b, Y(gb), z], [b, Y(yb2), z], [a, Y(ya), z]);
      Q(CD, [a, Y(ya), z0], [b, Y(yb2), z0], [b, Y(yb2), z1], [a, Y(ya), z1]);
      for (const z of [z0 - 0.06, z1 + 0.06]) for (let f = ga + 2; f < ya - 2.5; f += 4.2) Q(RL, [a + 1.5, Y(f), z], [b - 1.5, Y(f), z], [b - 1.5, Y(f + 1.4), z], [a + 1.5, Y(f + 1.4), z]); } }
  // ---------------- the diverging southbound ramp, the service ramp and the walkway's descent (Manhattan), the north ramp ----------------
  // the bridge authority's building at the south approach (OSM, s/t frame): no ramp columns inside it
  const KEEP = [[-305.8, 15.9], [-280.4, 13.0], [-280.9, 19.2], [-285.2, 32.9], [-294.1, 34.4], [-304.7, 19.0]];
  const inP = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const [xi, zi] = P[i], [xj, zj] = P[j]; if ((zi > z) !== (zj > z) && x < (xj - xi)*(z - zi)/(zj - zi) + xi) c = !c; } return c; };
  const ramp = (P, half, colMat) => { for (let i = 0; i < P.length - 1; i++){ const [s0, z0, w0, g0] = P[i], [s1, z1, w1, g1] = P[i + 1], L = Math.hypot(s1 - s0, z1 - z0); if (L < 0.5) continue;
      const nx = -(z1 - z0)/L*half, nz = (s1 - s0)/L*half;
      Q(CO, [s0 + nx, Y(w0 - 0.4), z0 + nz], [s1 + nx, Y(w1 - 0.4), z1 + nz], [s1 - nx, Y(w1 - 0.4), z1 - nz], [s0 - nx, Y(w0 - 0.4), z0 - nz]);
      for (const sg of [1, -1]) { Q(CD, [s0 + sg*nx, Y(w0 - 1.6), z0 + sg*nz], [s1 + sg*nx, Y(w1 - 1.6), z1 + sg*nz], [s1 + sg*nx, Y(w1 + 0.9), z1 + sg*nz], [s0 + sg*nx, Y(w0 + 0.9), z0 + sg*nz]); }
      const n = Math.max(1, Math.round(L/14));
      for (let k = (i === 0 ? 1 : 0); k < n; k++){ const t = k/n, s = s0 + (s1 - s0)*t, z = z0 + (z1 - z0)*t, w = w0 + (w1 - w0)*t, gg = g0 + (g1 - g0)*t;
        if (w - gg > 2.0 && !inP(KEEP, s, z) && !inP(KEEP, s, z - 1.5) && !inP(KEEP, s, z + 1.5)) abox(colMat, s - 0.6, s + 0.6, Y(gg - 1.5), Y(w - 1.6), z - 0.6, z + 0.6, true); } } };
  ramp(HHD.r307354, 5.2, CO); ramp(HHD.r357720, 3.2, CO); ramp(HHD.r307355, 5.2, CO);
  { const P = HHD.r346552; for (let i = 0; i < P.length - 1; i++){ const [s0, z0, w0, g0] = P[i], [s1, z1, w1] = P[i + 1];
      Q(ST, [s0, Y(w0 - 0.25), z0 - 1.1], [s1, Y(w1 - 0.25), z1 - 1.1], [s1, Y(w1 - 0.25), z1 + 1.1], [s0, Y(w0 - 0.25), z0 + 1.1]);
      for (const dz of [-1.1, 1.1]) Q(RL, [s0, Y(w0 + 1.0), z0 + dz], [s1, Y(w1 + 1.0), z1 + dz], [s1, Y(w1 + 1.08), z1 + dz], [s0, Y(w0 + 1.08), z0 + dz]);
      if (w0 - g0 > 2) abox(ST, s0 - 0.3, s0 + 0.3, Y(g0 - 1), Y(w0 - 0.25), z0 - 0.3, z0 + 0.3, true); } }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'nyhenryhudson', lat:HHD.lat, lon:HHD.lon, rot:HHD.rot});
}
