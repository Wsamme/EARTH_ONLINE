// ===== bay/east: Oakland landmarks for the San Francisco Bay Area 1:1 map (City Brush v22) =====
// Tribune Tower, Oakland City Hall, Paramount Theatre + Fox Oakland Theatre, Oakland California Temple,
// Lake Merritt (Pergola and Colonnade, the Municipal Boathouse, the Necklace of Lights), Oakland Coliseum + Arena.
// Every model is built in a frame aligned with its real OSM footprint (plans below are in that frame, metres; the SG_PLACES
// rot turns the frame onto the map). Block-scoped: only LANDMARKS and SG_PLACES are touched.
{
const PI = Math.PI, HP = PI/2, TAU = PI*2;
// ---------- batching helpers: many small parts -> one LTris call per material ----------
function TB(){
  const a = [];
  const q4 = (p, q, r, s) => { a.push(p[0], p[1], p[2], q[0], q[1], q[2], r[0], r[1], r[2], p[0], p[1], p[2], r[0], r[1], r[2], s[0], s[1], s[2]); };
  const T = {a, ds:false,
    tri(p, q, r){ T.ds = true; a.push(p[0], p[1], p[2], q[0], q[1], q[2], r[0], r[1], r[2]); },
    quad(p, q, r, s){ T.ds = true; q4(p, q, r, s); },
    // closed box w (x) * h (y) * d (z), bottom centre at x, y, z, turned by ry about y (outward winding: single-sided)
    box(w, h, d, x, y, z, ry){
      const c = Math.cos(ry || 0), s = Math.sin(ry || 0), P = (u, v, t) => [x + u*c + t*s, y + v, z - u*s + t*c];
      const hw = w/2, hd = d/2, A = P(-hw, 0, -hd), B = P(hw, 0, -hd), C = P(hw, 0, hd), D = P(-hw, 0, hd), E = P(-hw, h, -hd), F = P(hw, h, -hd), G = P(hw, h, hd), H = P(-hw, h, hd);
      q4(E, H, G, F); q4(A, B, C, D); q4(D, C, G, H); q4(B, A, E, F); q4(C, B, F, G); q4(A, D, H, E);
    },
    // vertical quad on the wall line p0 -> p1 ([x, z]) pushed out by off along n, from u0..u1 (0-1 along) and y0..y1
    wq(p0, p1, n, off, u0, u1, y0, y1){
      const x0 = p0[0] + (p1[0] - p0[0])*u0 + n[0]*off, z0 = p0[1] + (p1[1] - p0[1])*u0 + n[1]*off, x1 = p0[0] + (p1[0] - p0[0])*u1 + n[0]*off, z1 = p0[1] + (p1[1] - p0[1])*u1 + n[1]*off;
      T.quad([x0, y0, z0], [x1, y0, z1], [x1, y1, z1], [x0, y1, z0]);
    },
    out(g, col){ if (a.length) LTris(g, a, typeof col === 'string' ? {c:col, ds:T.ds} : Object.assign({}, col, {ds:T.ds || !!col.ds})); a.length = 0; T.ds = false; }};
  return T;
}
// outward unit normal of the edge p0 -> p1 of a polygon whose centre is (cx, cz)
const nrm = (p0, p1, cx, cz) => { let nx = p1[1] - p0[1], nz = -(p1[0] - p0[0]); const L = Math.hypot(nx, nz) || 1; nx /= L; nz /= L;
  const mx = (p0[0] + p1[0])/2 - cx, mz = (p0[1] + p1[1])/2 - cz; if (nx*mx + nz*mz < 0){ nx = -nx; nz = -nz; } return [nx, nz]; };
const cen = P => { let x = 0, z = 0; for (const p of P){ x += p[0]; z += p[1]; } return [x/P.length, z/P.length]; };
// windows on every edge of a plan polygon: floors from y0 every fh (n floors), bays of about bw metres, window ww x wh
// lit windows (random, seeded) go to L, dark ones to D
function winsPoly(P, y0, fh, n, bw, ww, wh, D, L, pLit, skipE, sill){
  const r = LMCTX.rng, [cx, cz] = cen(P);
  for (let e = 0; e < P.length; e++){
    if (skipE && skipE.includes(e)) continue;
    const p0 = P[e], p1 = P[(e + 1) % P.length], len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]); if (len < bw*0.8) continue;
    const nb = Math.max(1, Math.round(len/bw)), n2 = nrm(p0, p1, cx, cz), hu = ww/len/2;
    for (let f = 0; f < n; f++) for (let b = 0; b < nb; b++){
      const u = (b + 0.5)/nb, y = y0 + f*fh + (sill === undefined ? (fh - wh)*0.55 : sill);
      (r() < (pLit === undefined ? 0.35 : pLit) ? L : D).wq(p0, p1, n2, 0.06, u - hu, u + hu, y, y + wh);
    }
  }
}
// clock dial facing along the local direction ry (0 = +z): white face, dark hands at 10:10
function dial(g, R, x, y, z, ry, face, hand){
  const geo = new THREE.CylinderGeometry(R, R, 0.3, 28); geo.rotateX(HP); lmAdd(g, geo, face, x, y, z, ry);
  const c = Math.cos(ry), s = Math.sin(ry), fx = x + s*0.2, fz = z + c*0.2;
  LBox(g, R*1.02, R*0.1, 0.12, fx, y - R*0.05, fz, hand, ry);
  const geo2 = new THREE.CylinderGeometry(R*1.08, R*1.08, 0.2, 28); geo2.rotateX(HP); lmAdd(g, geo2, hand, x - s*0.06, y, z - c*0.06, ry);
  const h1 = new THREE.BoxGeometry(0.16, R*0.82, 0.1); h1.translate(0, R*0.38, 0); h1.rotateZ(0.95); lmAdd(g, h1, hand, fx, y, fz, ry);
  const h2 = new THREE.BoxGeometry(0.2, R*0.6, 0.1); h2.translate(0, R*0.28, 0); h2.rotateZ(-1.05); lmAdd(g, h2, hand, fx, y, fz, ry);
}
// outlines (x-y plane) for LShape: round-headed opening, half disc
const rA = (hw, ht, n) => { const P = [[-hw, 0], [hw, 0], [hw, ht - hw]]; for (let i = 1; i < n; i++){ const a = PI*i/n; P.push([Math.cos(a)*hw, ht - hw + Math.sin(a)*hw]); } P.push([-hw, ht - hw]); return P; };
const sD = (r, n) => { const P = [[r, 0]]; for (let i = 1; i < n; i++){ const a = PI*i/n; P.push([Math.cos(a)*r, Math.sin(a)*r]); } P.push([-r, 0]); return P; };
const lmPlace = (type, lat, lon, rot) => SG_PLACES.push({type, lat, lon, rot});

// =====================================================================================================================
// Tribune Tower (1923, Edward T. Foulkes; 93 m roof, 22 storeys) on the 1906 six-storey Tribune building, 13th & Franklin:
// orange-brown pressed brick with pinkish-cream terra cotta, a 12-storey shaft, a two-storey arcaded capital with the walkway,
// the set-back clock tower (two stages, four clock faces, corner turrets) under a tall ribbed-copper chateau roof; lit pink at night.
// Frame: +x along 13th Street (ESE), -z faces 13th Street (NNE). Tower 11.8 x 16.6 m at the origin; the base building and
// its seven-storey back part are the real OSM parts.
// =====================================================================================================================
LANDMARKS.tribunetower = {zh:'奥克兰论坛报大楼', en:'Tribune Tower (Oakland)', cat:'old', r:33, h:95,
  lt:{m:0, c:'#ffc89a', k:0.55, e:0.3}, build(){
  const g = new THREE.Group(), r = LMCTX.rng;
  const BR = '#a35a3c', BR2 = '#96513a', RF = '#6d6862', TC = '#ecdcc8', TC2 = '#ddcbb4', DK = {c:'#3a2a26', ds:true};
  const CU = {c:'#5f9e86', glow:'#d23c78', gk:0.55}, CU2 = {c:'#4f8a74', glow:'#c0306a', gk:0.45, ds:true};
  const TOP = {c:'#eddcca', glow:'#ff5c94', gk:0.32};
  const GL = {c:'#2c3239', ds:true}, GLL = {c:'#2c3239', glow:'#ffd29a', gk:0.6, ds:true};
  const FACE = {c:'#f3efe2', glow:'#fff2d0', gk:1.1}, HAND = DK;
  const W = 11.8, D = 16.6, hw = W/2, hd = D/2;
  const tc = TB(), br = TB(), dk = TB(), lit = TB(), drk = TB(), top = TB();
  // ---- the 1906 base building (6 storeys, 19.8 m) and the 7-storey back part (26.2 m) ----
  const BASE = [[22.0, 23.1], [22.2, -8.1], [6.0, -8.3], [5.6, 18.0], [-6.3, 18.0], [-6.4, 23.0]];
  LPoly(g, BASE, -2, 21.8, BR);
  LPoly(g, [[22.4, 23.3], [22.4, -8.5], [5.8, -8.5], [5.8, 17.8], [-6.6, 17.8], [-6.6, 23.3]], 19.6, 0.9, TC);     // cornice
  LPoly(g, [[21.7, 22.8], [21.9, -7.8], [6.3, -8.0], [6.3, 17.6], [-6.0, 17.6], [-6.1, 22.7]], 20.0, 0.75, RF);      // roof
  LPoly(g, [[22.0, 23.1], [22.2, -8.1], [6.0, -8.3], [6.0, 23.0]], -2, 6.2, TC2);                                    // stone ground storey
  winsPoly([[22.0, 23.1], [22.2, -8.1], [6.0, -8.3], [6.0, 23.1]], 4.4, 3.05, 5, 2.6, 1.25, 1.9, drk, lit, 0.4, [3]);
  winsPoly([[22.0, 23.1], [22.2, -8.1], [6.0, -8.3], [6.0, 23.1]], 0.4, 4, 1, 4.2, 3.2, 3.1, dk, dk, 0, [3]);
  for (let y = 4.0; y < 19.5; y += 9.15) LPoly(g, [[22.25, 23.3], [22.45, -8.35], [5.85, -8.55], [5.85, 23.3]], y, 0.35, TC);
  const BACK = [[5.6, 18.0], [5.7, 8.3], [-6.0, 8.3], [-6.3, 18.0]];
  LPoly(g, BACK, -2, 28.2, BR2);
  LPoly(g, [[5.8, 18.2], [5.8, 8.2], [-6.2, 8.2], [-6.5, 18.2]], 25.6, 0.9, TC);
  LPoly(g, [[5.3, 17.7], [5.4, 8.6], [-5.7, 8.6], [-6.0, 17.7]], 26.0, 0.7, RF);
  winsPoly([[5.6, 18.0], [5.7, 8.3], [-6.0, 8.3], [-6.3, 18.0]], 4.2, 3.05, 7, 2.5, 1.2, 1.85, drk, lit, 0.35, [1]);
  LBox(g, 3.2, 2.6, 2.6, 15, 20.5, 8, RF);                       // roof plant on the base building
  // ---- the tower: stone ground storey, five brick storeys level with the base building, the 12-storey shaft ----
  LBox(g, W, 8.4, D, 0, -2, 0, TC2);                                    // stone ground storey (to 6.4 m)
  LBox(g, W + 0.5, 0.7, D + 0.5, 0, 6.2, 0, TC);
  LBox(g, W, 52.1, D, 0, 6.4, 0, BR);                                   // brick 6.4 - 58.5
  for (const sx of [-1, 1]) for (const sz of [-1, 1]){                  // quoins: alternating long / short cream blocks
    let k = 0; for (let y = 6.9; y < 58.2; y += 1.1, k++){ const L = k % 2 ? 0.95 : 1.55;
      tc.box(L, 0.95, 0.25, sx*(hw - L/2 + 0.02), y, sz*(hd + 0.1)); tc.box(0.25, 0.95, L, sx*(hw + 0.1), y, sz*(hd - L/2 + 0.02)); }
  }
  // windows: three bays on the narrow faces, four on the long ones; cream sills and lintels
  const fl = []; for (let f = 0; f < 4; f++) fl.push(6.9 + f*3.3 + 0.75); for (let f = 0; f < 12; f++) fl.push(20.0 + f*3.2 + 0.7);
  for (const y of fl){
    for (const sz of [-1, 1]) for (let b = 0; b < 3; b++){ const x = (b - 1)*3.1; (r() < 0.38 ? lit : drk).box(1.3, 1.95, 0.12, x, y, sz*(hd + 0.02)); tc.box(1.6, 0.18, 0.3, x, y - 0.2, sz*(hd + 0.05)); tc.box(1.6, 0.25, 0.25, x, y + 2.0, sz*(hd + 0.05)); }
    for (const sx of [-1, 1]) for (let b = 0; b < 4; b++){ const z = (b - 1.5)*3.4; (r() < 0.38 ? lit : drk).box(0.12, 1.95, 1.3, sx*(hw + 0.02), y, z); tc.box(0.3, 0.18, 1.6, sx*(hw + 0.05), y - 0.2, z); tc.box(0.25, 0.25, 1.6, sx*(hw + 0.05), y + 2.0, z); }
  }
  // ground storey: arched entrance on 13th Street, shop windows
  LShape(g, archFill(1.9, 3.6, 6.0, 10), 0.4, 0, 0, -hd - 0.15, TC);
  LBox(g, 3.6, 3.6, 0.2, 0, 0, -hd - 0.1, DK);
  for (const x of [-4.1, 4.1]) LBox(g, 2.0, 3.4, 0.2, x, 0.6, -hd - 0.1, GL);
  for (let b = 0; b < 4; b++) LBox(g, 0.2, 3.4, 2.4, -hw - 0.1, 0.6, (b - 1.5)*3.6, GL);
  LBox(g, W + 0.4, 0.6, D + 0.4, 0, 19.6, 0, TC);                       // cornice line of the base building
  LBox(g, W + 0.3, 0.4, D + 0.3, 0, 39.2, 0, TC);
  // ---- the two-storey capital: cream terra cotta arcade, cornice, the 20th-floor walkway with its balustrade ----
  LBox(g, W + 0.4, 1.0, D + 0.4, 0, 58.4, 0, TC);
  LBox(g, W, 7.2, D, 0, 59.2, 0, TOP);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) LBox(g, 1.6, 7.2, 1.6, sx*(hw - 0.5), 59.2, sz*(hd - 0.5), TOP);
  for (const sz of [-1, 1]) for (let b = 0; b < 3; b++) LShape(g, rA(1.05, 5.8, 8), 0.3, (b - 1)*3.2, 59.9, sz*(hd + 0.05), DK);
  for (const sx of [-1, 1]) for (let b = 0; b < 4; b++) LShape(g, rA(1.05, 5.8, 8), 0.3, sx*(hw + 0.05), 59.9, (b - 1.5)*3.6, DK, HP);
  LBox(g, W + 1.2, 0.6, D + 1.2, 0, 66.2, 0, TOP); LBox(g, W + 2.6, 0.5, D + 2.6, 0, 66.8, 0, TOP);
  for (const sz of [-1, 1]) for (let x = -hw - 1.0; x <= hw + 1.01; x += 0.62) top.box(0.24, 0.85, 0.24, x, 67.3, sz*(hd + 1.0));
  for (const sx of [-1, 1]) for (let z = -hd - 1.0; z <= hd + 1.01; z += 0.62) top.box(0.24, 0.85, 0.24, sx*(hw + 1.0), 67.3, z);
  for (const sz of [-1, 1]) top.box(W + 2.3, 0.2, 0.36, 0, 68.15, sz*(hd + 1.0));
  for (const sx of [-1, 1]) top.box(0.36, 0.2, D + 2.3, sx*(hw + 1.0), 68.15, 0);
  // ---- the clock tower: a three-storey stage set back from the shaft with corner turrets, the two-storey clock stage ----
  const W2 = 9.4, D2 = 13.6;
  LBox(g, W2, 9.6, D2, 0, 67.3, 0, TOP);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) LBox(g, 1.2, 9.6, 1.2, sx*(W2/2 - 0.35), 67.3, sz*(D2/2 - 0.35), TOP);
  for (const sz of [-1, 1]) for (let b = 0; b < 2; b++) for (let f = 0; f < 3; f++) (r() < 0.4 ? lit : drk).box(1.1, 2.0, 0.12, (b - 0.5)*3.0, 68.0 + f*3.1, sz*(D2/2 + 0.04));
  for (const sx of [-1, 1]) for (let b = 0; b < 3; b++) for (let f = 0; f < 3; f++) (r() < 0.4 ? lit : drk).box(0.12, 2.0, 1.1, sx*(W2/2 + 0.04), 68.0 + f*3.1, (b - 1)*3.6);
  LBox(g, W2 + 0.8, 0.6, D2 + 0.8, 0, 76.9, 0, TOP);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]){                  // corner turrets on the walkway
    const x = sx*(hw - 0.2), z = sz*(hd - 0.2);
    LCyl(g, 1.1, 1.2, 6.8, x, 67.3, z, TOP, 8, PI/8); LCyl(g, 1.3, 1.3, 0.4, x, 74.1, z, TOP, 8, PI/8);
    LLathe(g, [[1.2, 0], [1.15, 0.7], [0.9, 1.6], [0.5, 2.4], [0.14, 2.9], [0.07, 4.0], [0, 4.1]], x, 74.5, z, CU, 8);
  }
  const W3 = 8.6, D3 = 12.6;
  LBox(g, W3, 6.4, D3, 0, 77.5, 0, TOP);                                 // clock stage 77.5 - 83.9
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) LBox(g, 1.0, 6.4, 1.0, sx*(W3/2 - 0.3), 77.5, sz*(D3/2 - 0.3), TOP);
  for (const sz of [-1, 1]){ dial(g, 2.1, 0, 80.6, sz*(D3/2 + 0.15), sz > 0 ? 0 : PI, FACE, HAND); LShape(g, sD(2.7, 12), 0.6, 0, 83.4, sz*(D3/2 + 0.2), TOP); }
  for (const sx of [-1, 1]){ dial(g, 2.1, sx*(W3/2 + 0.15), 80.6, 0, sx > 0 ? HP : -HP, FACE, HAND); LShape(g, sD(2.7, 12), 0.6, sx*(W3/2 + 0.2), 83.4, 0, TOP, HP); }
  LBox(g, W3 + 1.0, 0.7, D3 + 1.0, 0, 83.6, 0, TOP);
  // ---- the tall chateau roof of ribbed copper, finial and flagpole ----
  const RY0 = 84.3, RY1 = 94.2, L0 = W3 + 0.6, B0 = D3 + 0.6, L1 = 1.2, B1 = 5.0;
  LFrust(g, L0, B0, L1, B1, RY1 - RY0, 0, RY0, 0, CU);
  const rib = TB(), P3 = (u, v, t) => [u*(L0/2 + (L1/2 - L0/2)*t), RY0 + (RY1 - RY0)*t, v*(B0/2 + (B1/2 - B0/2)*t)];
  for (let k = 0; k <= 8; k++){ const u = -1 + 2*k/8; for (const sv of [-1, 1]){ const a = P3(u, sv, 0), b = P3(u, sv, 1); a[2] += sv*0.12; b[2] += sv*0.12; rib.quad([a[0] - 0.09, a[1], a[2]], [a[0] + 0.09, a[1], a[2]], [b[0] + 0.03, b[1], b[2]], [b[0] - 0.03, b[1], b[2]]); } }
  for (let k = 0; k <= 12; k++){ const v = -1 + 2*k/12; for (const su of [-1, 1]){ const a = P3(su, v, 0), b = P3(su, v, 1); a[0] += su*0.12; b[0] += su*0.12; rib.quad([a[0], a[1], a[2] - 0.09], [a[0], a[1], a[2] + 0.09], [b[0], b[1], b[2] + 0.03], [b[0], b[1], b[2] - 0.03]); } }
  rib.out(g, CU2);
  for (const sz of [-1, 1]) for (const sx of [-1, 1]){ const geo = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 12); geo.rotateX(HP); lmAdd(g, geo, GLL, sx*1.6, 88.6, sz*(D3/2 - 1.4), 0); }
  LBox(g, 1.0, 0.5, B1 + 0.3, 0, RY1, 0, CU2);
  for (const sz of [-1, 1]) LLathe(g, [[0.35, 0], [0.3, 0.6], [0.12, 1.2], [0.05, 2.0], [0, 2.1]], 0, RY1 + 0.4, sz*(B1/2 - 0.3), CU2, 8);
  LCyl(g, 0.07, 0.14, 13, 0, RY1 + 0.4, 0, TC, 6);                // flagpole
  LSph(g, 0.25, 0, RY1 + 13.5, 0, CU, 1, 8);
  tc.out(g, TC); br.out(g, BR); dk.out(g, DK); lit.out(g, GLL); drk.out(g, GL); top.out(g, TOP);
  return g; }};
lmPlace('tribunetower', 37.803145, -122.270872, -0.4520);


// =====================================================================================================================
// Oakland City Hall (1914, Palmer & Hornbostel; Beaux-Arts "wedding cake", 98 m): granite base of three storeys with the
// two-column portico on the plaza, the Greek-cross transitional floors, the ten-storey office shaft (7 x 5 bays, arched top
// floor), the 16th-floor podium with balconies, the niche stage with Ionic columns, the clock stage and the crown cupola.
// Frame: +x along the long axis (NNE), +z = the front on Frank H. Ogawa Plaza (ESE). Plans: the real OSM parts.
// =====================================================================================================================
LANDMARKS.oakcityhall = {zh:'奥克兰市政厅', en:'Oakland City Hall', cat:'old', r:40, h:98,
  lt:{m:0, c:'#ffe7c8', k:0.8, e:0.55, anim:'breathe'}, build(){
  const g = new THREE.Group(), r = LMCTX.rng;
  const GR = '#d9d6cd', GR2 = '#c9c5ba', TC = '#ebe7dc', TC2 = '#dcd7ca', RF = '#8f8b84', DK = '#34383b';
  const GL = '#2e353b', GLL = {c:'#2e353b', glow:'#ffd9a2', gk:0.55};
  const FACE = {c:'#f4f1e6', glow:'#fff4d6', gk:1.2}, HAND = '#1e1f22', BRZ = '#5b5a4c';
  const LAMP = {c:'#e8d9a8', glow:'#ffe2a0', gk:1.4};
  const tc = TB(), gr = TB(), lit = TB(), drk = TB(), dk = TB();
  const X0 = -1.2;                                       // the building's axis of symmetry (OSM parts are within ~2 m of it)
  // ---- base: three storeys of granite (to 16.5 m), parapet balustrade ----
  const BASE0 = [[-31.7, 19.9], [-12.8, 19.9], [-12.8, 20.8], [7.5, 20.8], [27.1, 20.7], [27.1, -19.9], [11.3, -20.5], [11.3, -29.0], [-12.4, -29.1], [-12.6, -21.8], [-31.7, -22.0]];
  const BASEP = [[-31.7, 19.9], [-12.8, 19.9], [-12.8, 20.8], [-8.0, 20.8], [-8.0, 12.2], [2.7, 12.2], [2.7, 20.8], [7.5, 20.8], [27.1, 20.7], [27.1, -19.9], [11.3, -20.5], [11.3, -29.0], [-12.4, -29.1], [-12.6, -21.8], [-31.7, -22.0]];   // with the portico recess
  LPoly(g, BASEP, -2.5, 8.0, GR2);                                                     // rusticated ground storey
  LPoly(g, BASEP, 5.5, 9.7, GR);
  for (let y = 0.9; y < 5.4; y += 0.9) LPoly(g, BASEP.map(p => [p[0] + Math.sign(p[0] - X0)*0.08, p[1] + Math.sign(p[1])*0.08]), y, 0.12, GR);   // rustication joints
  LPoly(g, BASEP.map(p => [p[0] + Math.sign(p[0] - X0)*0.5, p[1] + Math.sign(p[1])*0.5]), 15.2, 1.3, TC);   // cornice
  LPoly(g, BASEP, 16.5, 0.4, RF);
  // windows of the base: three rows (ground floor + two tall upper storeys), skipping the portico front
  const W1 = [[-31.7, 19.9], [-12.8, 19.9]], W2 = [[7.5, 20.8], [27.1, 20.7]];
  for (const [a, b] of [W1, W2]) for (let k = 0; k < 3; k++){ const u = (k + 0.5)/3, x = a[0] + (b[0] - a[0])*u, z = a[1] + 0.06;
    drk.box(2.2, 2.6, 0.12, x, 1.4, z); (r() < 0.4 ? lit : drk).box(2.0, 3.8, 0.12, x, 6.6, z); (r() < 0.4 ? lit : drk).box(2.0, 3.0, 0.12, x, 11.3, z);
    tc.box(2.8, 0.5, 0.4, x, 10.4, z + 0.05); }
  for (let k = 0; k < 4; k++) for (const [a, b] of [W1, W2]){ const x = a[0] + (b[0] - a[0])*k/3; tc.box(1.1, 9.4, 0.5, x, 5.6, a[1] + 0.2); }    // 4 pilasters per wing
  // sides (7 bays, 8 pilasters) and the rear
  for (const sx of [-1, 1]){ const x = sx > 0 ? 27.1 : -31.7;
    for (let k = 0; k < 7; k++){ const z = -20.9 + (k + 0.5)*41.2/7; drk.box(0.12, 2.6, 2.0, x + sx*0.06, 1.4, z); (r() < 0.4 ? lit : drk).box(0.12, 3.8, 1.9, x + sx*0.06, 6.6, z); (r() < 0.4 ? lit : drk).box(0.12, 3.0, 1.9, x + sx*0.06, 11.3, z); }
    for (let k = 0; k <= 7; k++) tc.box(0.5, 9.4, 1.0, x + sx*0.2, 5.6, -20.9 + k*41.2/7); }
  for (const [x0, x1, z] of [[-31.7, -12.6, -21.9], [11.3, 27.1, -20.2], [-12.4, 11.3, -29.05]]){ const n = Math.round((x1 - x0)/4.6);
    for (let k = 0; k < n; k++){ const x = x0 + (k + 0.5)*(x1 - x0)/n; drk.box(2.0, 2.6, 0.12, x, 1.4, z - 0.06); (r() < 0.4 ? lit : drk).box(1.9, 3.8, 0.12, x, 6.6, z - 0.06); (r() < 0.4 ? lit : drk).box(1.9, 3.0, 0.12, x, 11.3, z - 0.06); } }
  // balustrade on the base roof edge
  const bal = (x0, z0, x1, z1, y) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.floor(L/0.55), ry = -Math.atan2(z1 - z0, x1 - x0);
    for (let i = 0; i <= n; i++){ const u = i/n; tc.box(0.22, 0.75, 0.22, x0 + (x1 - x0)*u, y + 0.2, z0 + (z1 - z0)*u); }
    tc.box(L, 0.22, 0.34, (x0 + x1)/2, y + 0.95, (z0 + z1)/2, ry); tc.box(L, 0.2, 0.4, (x0 + x1)/2, y, (z0 + z1)/2, ry); };
  for (let i = 0; i < BASE0.length; i++){ const a = BASE0[i], b = BASE0[(i + 1) % BASE0.length]; if (Math.hypot(b[0] - a[0], b[1] - a[1]) > 2) bal(a[0] + Math.sign(a[0] - X0)*0.2, a[1] + Math.sign(a[1])*0.2, b[0] + Math.sign(b[0] - X0)*0.2, b[1] + Math.sign(b[1])*0.2, 16.9); }
  // ---- the portico on the plaza: two giant fluted granite columns in antis, entablature, steps ----
  const PZ = 20.8, px0 = -12.8, px1 = 7.5, pc = (px0 + px1)/2;
  LBox(g, 10.8, 3.6, 8.7, pc, 12.9, PZ - 4.35, GR); LBox(g, 10.8, 0.4, 8.7, pc, 16.5, PZ - 4.35, RF);   // the portico's ceiling and roof
  for (const sx of [-1, 1]) LBox(g, 4.8, 15.2, 9.2, pc + sx*7.75, -0.2, PZ - 4.6, GR);   // end piers (antae)
  LBox(g, px1 - px0 + 0.8, 2.6, 2.2, pc, 13.0, PZ - 0.9, TC);                          // entablature
  LBox(g, px1 - px0 + 1.2, 0.7, 2.6, pc, 15.4, PZ - 1.0, TC);
  LBox(g, 10.7, 12.6, 0.3, pc, 0.4, PZ - 8.6, DK);                                     // shadowed back wall
  LBox(g, 6.2, 5.8, 0.2, pc, 0.4, PZ - 8.4, BRZ);                                      // bronze and glass entry screen
  for (let k = 0; k < 5; k++) LBox(g, 0.12, 5.2, 0.15, pc - 2.4 + k*1.2, 0.7, PZ - 8.25, '#c9b77a');
  for (const sx of [-1, 1]){ const x = pc + sx*2.65;
    LCyl(g, 1.25, 1.25, 1.0, x, 0.4, PZ - 1.4, GR2, 8, PI/8);                            // octagonal bases
    LCyl(g, 0.95, 1.05, 10.2, x, 1.4, PZ - 1.4, GR, 16);
    for (let k = 0; k < 12; k++){ const a = k/12*TAU; gr.box(0.16, 10.0, 0.16, x + Math.cos(a)*1.0, 1.5, PZ - 1.4 + Math.sin(a)*1.0); }
    LCyl(g, 1.35, 0.95, 1.4, x, 11.6, PZ - 1.4, TC, 12); }                                // composite capitals
  for (let k = 0; k < 3; k++) LBox(g, px1 - px0 + 3 - k*0.6, 0.18, 2.2 - k*0.6, pc, -0.2 + k*0.18, PZ + 1.2 - k*0.3, GR2);   // three low steps
  for (const sx of [-1, 1]){ const x = pc + sx*12.3; LBox(g, 1.4, 2.6, 1.4, x, 0, PZ + 0.9, GR2); LCyl(g, 0.55, 0.45, 1.6, x, 2.6, PZ + 0.9, LAMP, 8); LSph(g, 0.5, x, 4.5, PZ + 0.9, LAMP, 1.2, 8); }
  // ---- transitional Greek-cross floors (16.5 - 26.5 m) ----
  const sh = (L, W, y, h, col, x, z) => LBox(g, L, h, W, X0 + (x || 0), y, z || 0, col);
  sh(31.4, 20.7, 16.5, 10, TC); sh(39, 11, 16.5, 9.2, TC); sh(14, 24.3, 16.5, 9.2, TC);
  sh(39.6, 11.6, 25.7, 0.8, TC2); sh(14.6, 24.9, 25.7, 0.8, TC2);
  for (const [L, W] of [[39, 11], [14, 24.3]]) for (const sz of [-1, 1]){ const n = Math.round(L/3.4); for (let k = 0; k < n; k++){ const x = X0 - L/2 + (k + 0.5)*L/n; for (const y of [17.6, 21.6]) (r() < 0.4 ? lit : drk).box(1.3, 2.4, 0.12, x, y, sz*(W/2 + 0.06)); } }
  for (const [L, W] of [[39, 11], [14, 24.3]]) for (const sx of [-1, 1]){ const n = Math.max(1, Math.round(W/3.4)); for (let k = 0; k < n; k++){ const z = -W/2 + (k + 0.5)*W/n; for (const y of [17.6, 21.6]) (r() < 0.4 ? lit : drk).box(0.12, 2.4, 1.3, X0 + sx*(L/2 + 0.06), y, z); } }
  // ---- office shaft (26.5 - 65.5 m): 7 bays on the long faces, 5 on the ends, paired windows, arched top floor ----
  const SL = 31.4, SW = 20.7, F0 = 26.5, FH = 3.9;
  sh(SL, SW, F0, 39.2, TC);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) sh(2.6, 2.6, F0, 39.2, TC2, sx*(SL/2 - 1.0), sz*(SW/2 - 1.0));    // corner piers
  for (const sz of [-1, 1]) for (let k = 0; k <= 7; k++) tc.box(0.7, 38.6, 0.4, X0 - SL/2 + 1.9 + k*(SL - 3.8)/7, F0 + 0.3, sz*(SW/2 + 0.15));
  for (const sx of [-1, 1]) for (let k = 0; k <= 5; k++) tc.box(0.4, 38.6, 0.7, X0 + sx*(SL/2 + 0.15), F0 + 0.3, -SW/2 + 1.9 + k*(SW - 3.8)/5);
  for (let f = 0; f < 10; f++){ const y = F0 + f*FH + 0.8, top = f === 9;
    for (const sz of [-1, 1]) for (let k = 0; k < 7; k++) for (const d of [-0.85, 0.85]){ const x = X0 - SL/2 + 1.9 + (k + 0.5)*(SL - 3.8)/7 + d;
      if (top) LShape(g, rA(0.55, 2.6, 6), 0.14, x, y, sz*(SW/2 + 0.07), r() < 0.4 ? GLL : GL); else (r() < 0.4 ? lit : drk).box(1.1, 2.3, 0.12, x, y, sz*(SW/2 + 0.06)); }
    for (const sx of [-1, 1]) for (let k = 0; k < 5; k++) for (const d of [-0.75, 0.75]){ const z = -SW/2 + 1.9 + (k + 0.5)*(SW - 3.8)/5 + d;
      if (top) LShape(g, rA(0.5, 2.6, 6), 0.14, X0 + sx*(SL/2 + 0.07), y, z, r() < 0.4 ? GLL : GL, HP); else (r() < 0.4 ? lit : drk).box(0.12, 2.3, 1.0, X0 + sx*(SL/2 + 0.06), y, z); }
    if (f < 9) { sh(SL + 0.2, SW + 0.2, y + 2.6, 0.18, TC2); }
  }
  sh(SL + 0.6, SW + 0.6, 26.5, 0.6, TC2);
  sh(SL + 1.0, SW + 1.0, 65.6, 0.9, TC); sh(SL + 2.4, SW + 2.4, 66.4, 1.1, TC);              // the heavy cornice
  for (const sz of [-1, 1]) for (let x = -SL/2; x <= SL/2; x += 1.2) tc.box(0.3, 0.7, 0.9, X0 + x, 65.7, sz*(SW/2 + 0.7));   // brackets
  for (const sx of [-1, 1]) for (let z = -SW/2; z <= SW/2; z += 1.2) tc.box(0.9, 0.7, 0.3, X0 + sx*(SL/2 + 0.7), 65.7, z);
  sh(SL + 2.0, SW + 2.0, 67.5, 0.3, RF);
  // ---- 16th-floor podium (67.5 - 72 m) with the bracketed cornice and balconies ----
  const PX = -0.9, PL = 20.2, PW = 13.2;
  LBox(g, PL, 4.6, PW, X0 + PX + 1.2, 67.5, 0.45, TC);
  for (const sz of [-1, 1]) for (let k = 0; k < 5; k++) (r() < 0.4 ? lit : drk).box(1.4, 2.2, 0.12, X0 + PX + 1.2 - PL/2 + (k + 0.5)*PL/5, 68.6, 0.45 + sz*(PW/2 + 0.06));
  for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) (r() < 0.4 ? lit : drk).box(0.12, 2.2, 1.4, X0 + PX + 1.2 + sx*(PL/2 + 0.06), 68.6, 0.45 - PW/2 + (k + 0.5)*PW/3);
  LBox(g, PL + 1.6, 0.9, PW + 1.6, X0 + PX + 1.2, 72.1, 0.45, TC);
  const CX = X0 + 0.3, CZ = 0.45, CT = 11.0;                                              // clock tower centre and width
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) LBox(g, 0.5, 1.2, 0.5, CX + sx*(PL/2 + 0.4), 73.0, CZ + sz*(PW/2 + 0.4), TC);
  for (const [x0, z0, x1, z1] of [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]]) bal(CX + x0*(PL/2 + 0.4), CZ + z0*(PW/2 + 0.4), CX + x1*(PL/2 + 0.4), CZ + z1*(PW/2 + 0.4), 73.0);
  // ---- niche stage (73 - 80.5 m): an arched niche flanked by two fluted Ionic columns on each face, balconies ----
  LBox(g, CT, 7.5, CT, CX, 73.0, CZ, TC);
  for (let f = 0; f < 4; f++){ const ry = f*HP, c = Math.cos(ry), s = Math.sin(ry), P = (u, w) => [CX + u*c + w*s, CZ - u*s + w*c];
    const n = P(0, CT/2 + 0.05); LShape(g, rA(1.5, 5.6, 10), 0.3, n[0], 73.6, n[1], DK, ry);
    for (const u of [-2.7, 2.7]){ const q = P(u, CT/2 + 0.75); LCyl(g, 0.42, 0.45, 5.6, q[0], 73.3, q[1], TC, 12); LBox(g, 1.3, 0.5, 1.0, q[0], 78.9, q[1], TC, ry); }
    const b = P(0, CT/2 + 1.6); LBox(g, 6.4, 0.3, 2.2, b[0], 72.9, b[1], TC, ry);
    for (let u = -3; u <= 3.01; u += 0.5){ const q = P(u, CT/2 + 2.6); tc.box(0.18, 0.7, 0.18, q[0], 73.2, q[1]); }
    const rl = P(0, CT/2 + 2.6); tc.box(6.4, 0.2, 0.3, rl[0], 73.9, rl[1], ry); }
  LBox(g, CT + 1.2, 0.9, CT + 1.2, CX, 79.4, CZ, TC); LBox(g, CT + 1.8, 0.6, CT + 1.8, CX, 80.3, CZ, TC2);
  // ---- clock stage (80.9 - 87 m): a dial on each face flanked by volute buttresses carrying torches ----
  LBox(g, CT - 1.2, 6.2, CT - 1.2, CX, 80.9, CZ, TC);
  for (let f = 0; f < 4; f++){ const ry = f*HP, c = Math.cos(ry), s = Math.sin(ry), P = (u, w) => [CX + u*c + w*s, CZ - u*s + w*c];
    const d = P(0, (CT - 1.2)/2 + 0.1); dial(g, 2.15, d[0], 84.0, d[1], ry, FACE, HAND);
    for (const sd of [-1, 1]){ const v = P(sd*(CT/2 - 0.2), CT/2 - 1.6); LShape(g, [[0, 0], [1.3, 0], [1.3, 0.6], [0.6, 2.2], [0.35, 4.6], [0, 4.6]].map(p => [p[0]*sd, p[1]]), 1.2, v[0], 81.0, v[1], TC, ry + HP);
      const t = P(sd*(CT/2 + 0.6), CT/2 - 1.6); LCyl(g, 0.22, 0.12, 1.0, t[0], 81.0, t[1], BRZ, 6); LSph(g, 0.32, t[0], 82.2, t[1], LAMP, 1.4, 8); } }
  LBox(g, CT + 0.2, 1.0, CT + 0.2, CX, 87.0, CZ, TC); LBox(g, CT + 0.8, 0.5, CT + 0.8, CX, 88.0, CZ, TC2);
  // ---- the crown cupola (88.5 - 98 m) ----
  LCyl(g, 3.7, 4.0, 3.2, CX, 88.5, CZ, TC, 8, PI/8);
  for (let k = 0; k < 8; k++){ const a = k/8*TAU; LBox(g, 0.9, 2.4, 0.3, CX + Math.cos(a)*3.75, 88.9, CZ + Math.sin(a)*3.75, k % 2 ? DK : TC2, -a + HP); }
  LCyl(g, 4.2, 4.2, 0.5, CX, 91.7, CZ, TC2, 8, PI/8);
  LLathe(g, [[3.9, 0], [3.8, 1.0], [3.3, 2.2], [2.3, 3.4], [1.2, 4.1], [0.6, 4.3], [0, 4.4]], CX, 92.2, CZ, TC, 16);
  for (let k = 0; k < 8; k++){ const a = k/8*TAU + PI/8; LBeam(g, [CX + Math.cos(a)*4.0, 92.3, CZ + Math.sin(a)*4.0], [CX + Math.cos(a)*2.4, 95.6, CZ + Math.sin(a)*2.4], 0.28, TC2, 5); }
  LCyl(g, 0.7, 0.9, 1.4, CX, 96.4, CZ, TC2, 8); LSph(g, 0.55, CX, 98.2, CZ, '#c8a54e', 1, 10);
  tc.out(g, TC); gr.out(g, GR); lit.out(g, GLL); drk.out(g, GL); dk.out(g, DK);
  return g; }};
lmPlace('oakcityhall', 37.805323, -122.272551, 1.1301);


// ---------- vertex-coloured quads (mosaics, painted panels) ----------
function VQ(){
  const P = [], C = [];
  const V = {quad(a, b, c, d, col){ P.push(...a, ...b, ...c, ...a, ...c, ...d); for (let i = 0; i < 6; i++) C.push(col[0], col[1], col[2]); },
    out(g, spec){ if (!P.length) return; const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); geo.computeVertexNormals();
      lmAdd(g, geo, Object.assign({c:'#ffffff', vc:true}, spec), 0, 0, 0, 0); P.length = 0; C.length = 0; }};
  return V;
}
const hx = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255)/255, (n >> 8 & 255)/255, (n & 255)/255]; };
// a lit blade sign without lettering: ivory blade, a vertical neon band and gold border tubes on both faces, bulbs on the edge
function blade(g, x, y0, y1, z0, dep, th, NE, GO, BU, IV, ry){
  const c = Math.cos(ry || 0), s = Math.sin(ry || 0), P = (u, w) => [x + u*c + w*s, z0 - u*s + w*c];
  const m = P(0, dep/2); LBox(g, th, y1 - y0, dep, m[0], y0, m[1], IV, ry);
  for (const sd of [-1, 1]){
    const q = P(sd*(th/2 + 0.04), dep/2); LBox(g, 0.08, y1 - y0 - 1.6, dep*0.42, q[0], y0 + 0.8, q[1], NE, ry);
    for (const w of [0.18, dep - 0.18]){ const b = P(sd*(th/2 + 0.05), w); LBox(g, 0.1, y1 - y0 - 0.5, 0.12, b[0], y0 + 0.25, b[1], GO, ry); }
    for (let y = y0 + 1.2; y < y1 - 1; y += 2.3){ const b = P(sd*(th/2 + 0.05), dep/2); LBox(g, 0.1, 0.1, dep*0.6, b[0], y, b[1], GO, ry); }
  }
  const e = P(0, dep + 0.02); LBox(g, th*0.7, y1 - y0 - 0.4, 0.1, e[0], y0 + 0.2, e[1], BU, ry);
}

// =====================================================================================================================
// Paramount Theatre (1931, Timothy Pflueger; Art Deco): the 15.6 m wide Broadway facade, its 33 m tile mosaic of two colossal
// puppeteers in a deep-red tile frame, the tall vertical sign (here a lit neon band, no letters), the V-shaped marquee; the
// plain lobby block and the 27 m auditorium with the 29 m stage house behind. Frame: +z = the facade on Broadway (ESE),
// +x along Broadway (NNE). Plan: the real OSM outline.
// =====================================================================================================================
LANDMARKS.paramount = {zh:'派拉蒙剧院（奥克兰）', en:'Paramount Theatre (Oakland)', cat:'old', r:53, h:36,
  lt:{m:0, c:'#ffd9b0', k:0.7, e:0.6}, build(){
  const g = new THREE.Group(), r = LMCTX.rng;
  const ST = {c:'#d6c9ae', lk:0.16}, ST2 = {c:'#c7b99c', lk:0.16}, RF = '#7f7b74', RED = '#8c1d1d', DK = '#2a2624';
  const NE = {c:'#c42a2a', glow:'#ff3326', gk:2.0}, GO = {c:'#d4a63c', glow:'#ffcf5a', gk:1.6}, BU = {c:'#f0e2b0', glow:'#fff0b8', gk:2.2}, IV = {c:'#efe6cf', glow:'#ffe7c4', gk:0.25};
  // auditorium + lobby block (the OSM outline), auditorium roof 27 m, stage house 29.5 m
  const AUD = [[-20.4, -22.5], [-16.2, -22.4], [-17.6, -1.4], [-16.7, 15.6], [-7.2, 15.4], [8.5, 16.8], [22.7, 12.2], [18.1, -16.7], [16.4, -25.4], [14.1, -32.4], [13.2, -46.0], [-20.5, -37.1]];
  LPoly(g, AUD, -2, 29, ST);
  LPoly(g, [[-20.5, -37.1], [13.2, -46.0], [14.1, -32.4], [-20.4, -26.5]], 27, 2.5, ST2);                          // stage house
  LPoly(g, AUD.map(p => [p[0]*0.97, p[1]*0.98]), 27, 0.5, RF);
  for (let k = 0; k < 7; k++){ const z = -40 + k*8.5; LBox(g, 0.5, 26, 1.2, 19.5 - Math.max(0, -z - 17)*0.18, 0, z, ST2); }        // plain pilasters on the side
  LBox(g, 1.0, 0.8, 30, 0, 27, -6, '#8a8680');                                                                     // the truss cover on the roof
  // lobby block (to 22 m) behind the facade
  LPoly(g, [[-7.2, 15.4], [8.5, 16.8], [8.4, 45.6], [-6.9, 45.6]], -2, 24, ST);
  LPoly(g, [[-6.9, 15.9], [8.0, 17.2], [7.9, 45.2], [-6.5, 45.2]], 22, 0.4, RF);
  for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) for (let f = 0; f < 4; f++) LBox(g, 0.12, 2.0, 1.4, sd > 0 ? 8.5 : -7.1, 3 + f*4.6, 22 + k*7.5, DK);
  // the two-storey shop building on Broadway next to the lobby (its footprint falls under the theatre's ground plan, so it is
  // rebuilt here as it is: 7 m, shop fronts below, two rows of windows)
  const NB = [[-19.2, 46.8], [-6.9, 46.2], [-7.2, 15.4], [-19.8, 15.5]];
  LPoly(g, NB, -2, 9.0, ST2); LPoly(g, NB.map(p => [p[0] + (p[0] < -10 ? 0.25 : -0.25), p[1] + (p[1] > 30 ? -0.25 : 0.25)]), 6.8, 0.3, RF);
  for (let k = 0; k < 4; k++){ const x = -18.2 + k*2.9; LBox(g, 2.4, 3.2, 0.12, x, 0.3, 46.86 - (x + 19.2)*0.0488, {c:'#3a3530', glow:'#ffd9a0', gk:0.6}); LBox(g, 1.6, 1.6, 0.12, x, 4.4, 46.86 - (x + 19.2)*0.0488, DK); }
  // ---- the facade (z = 46.2): red tile frame, central mosaic panel rising to a stepped apex, the sign ----
  const FZ = 46.2, FX = 0.6, FW = 15.6;
  LBox(g, FW, 22.5, 0.8, FX, 6.3, FZ - 0.4, RED);                                                                  // red tile background
  for (const sd of [-1, 1]) LBox(g, 0.7, 28.4, 1.2, FX + sd*(FW/2 - 0.35), 0, FZ - 0.5, RED);                       // side piers
  const MW = 10.4, M0 = 8.2, MH = 24.6;                                                                            // mosaic panel: 10.4 m wide, 8.2 - 32.8 m
  const stepTop = u => { const a = Math.abs(u); return a < 0.12 ? 1 : a < 0.36 ? 0.965 : a < 0.62 ? 0.93 : a < 0.85 ? 0.895 : 0.86; };
  LBox(g, MW + 1.6, MH*0.86 + 0.6, 0.9, FX, M0 - 0.6, FZ - 0.3, RED);
  for (let i = 0; i < 5; i++){ const a = [0.12, 0.36, 0.62, 0.85, 1.0][i], b = [0, 0.12, 0.36, 0.62, 0.85][i], top = M0 + MH*stepTop((a + b)/2);
    for (const sd of [-1, 1]){ const xm = FX + sd*(a + b)/2*MW/2, w = (a - b)*MW/2 + (i === 0 ? 0 : 0.02); if (i === 0 && sd > 0) continue; LBox(g, i === 0 ? MW*0.24 + 0.8 : w + 0.4, top - M0 + 0.8, 0.9, i === 0 ? FX : xm, M0 - 0.2, FZ - 0.3, RED); } }
  // the mosaic itself: two colossal figures in blue-green and gold robes on a gold sunburst, ~0.5 m tiles
  const V = VQ(), NX = 26, NY = 60, tz = FZ + 0.18;
  const C = {bg1:hx('#d7b259'), bg2:hx('#e9d08f'), bg3:hx('#c79a43'), rb1:hx('#2f8c8a'), rb2:hx('#2b5f8e'), rb3:hx('#3fa38f'), gold:hx('#e0b343'), dark:hx('#1d2a33'), skin:hx('#c99a6a'), red:hx('#9c2a25')};
  const fig = (u, v, sd) => { // u in [-1, 1] across the panel, figure centred at sd*0.52
    const x = (u - sd*0.52)/0.48, vv = v;
    if (vv > 0.8 && vv < 0.9 && x*x/0.09 + (vv - 0.85)*(vv - 0.85)/0.0025 < 1) return C.skin;                // head
    if (vv > 0.79 && vv < 0.93 && x*x/0.16 + (vv - 0.86)*(vv - 0.86)/0.0049 < 1) return C.gold;               // halo
    const w = vv > 0.78 ? 0 : vv > 0.72 ? 0.55 : 0.55 - (0.72 - vv)*0.42;                                      // shoulders to hem
    if (vv > 0.06 && Math.abs(x) < w){ if (vv < 0.11 || (vv > 0.7 && vv < 0.74)) return C.gold; const st = Math.floor((x + 1)*4.5); return st % 3 === 0 ? C.rb1 : st % 3 === 1 ? C.rb2 : C.rb3; }
    if (vv > 0.74 && vv < 0.97 && Math.abs(Math.abs(x) - (0.5 + (vv - 0.74)*1.3)) < 0.1) return C.rb2;           // raised arms
    if (vv > 0.12 && vv < 0.95 && Math.abs(Math.abs(x) - 0.82) < 0.025 && Math.floor(vv*40) % 2 === 0) return C.gold;   // marionette strings
    if (vv > 0.04 && vv < 0.14 && Math.abs(Math.abs(x) - 0.82) < 0.12) return C.red;                          // marionettes
    return null; };
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++){
    const u0 = -1 + 2*i/NX, u1 = -1 + 2*(i + 1)/NX, v0 = j/NY, v1 = (j + 1)/NY, uc = (u0 + u1)/2, vc = (v0 + v1)/2;
    if (vc > stepTop(uc)*0.995 || Math.abs(uc) < 0.08) continue;
    let col = fig(uc, vc, uc < 0 ? -1 : 1);
    if (!col){ const a = Math.atan2(uc, 1.15 - vc), ray = Math.floor((a + 2)*9) % 3; col = ray === 0 ? C.bg1 : ray === 1 ? C.bg2 : C.bg3; }
    const k = 0.9 + 0.2*r(), cc = [col[0]*k, col[1]*k, col[2]*k], x0 = FX + u0*MW/2, x1 = FX + u1*MW/2, y0 = M0 + v0*MH, y1 = M0 + v1*MH;
    V.quad([x0, y0, tz], [x1, y0, tz], [x1, y1, tz], [x0, y1, tz], cc);
  }
  V.out(g, {lk:0.9});
  for (let k = 0; k < 9; k++) LBox(g, 0.18, 0.18, 0.25, FX + (k - 4)*0.55, 33.3 + Math.cos((k - 4)*0.4)*1.2, FZ, GO);
  // the vertical sign: blade from 7.2 m to 36 m, projecting 3.6 m, crowned by a stepped finial
  blade(g, FX, 7.2, 34.6, FZ + 0.1, 3.6, 1.1, NE, GO, BU, IV, 0);
  LBox(g, 1.3, 0.9, 3.2, FX, 34.6, FZ + 1.9, GO); LBox(g, 0.9, 0.8, 2.2, FX, 35.5, FZ + 1.6, GO);
  // V-shaped marquee over the entrance, bulb-lined edges, lit soffit
  const MQ = 6.2;
  for (const sd of [-1, 1]){ const a = [FX + sd*FW/2, FZ], b = [FX, FZ + MQ], L = Math.hypot(b[0] - a[0], b[1] - a[1]), ry = -Math.atan2(b[1] - a[1], b[0] - a[0]);
    LBox(g, L, 2.0, 0.4, (a[0] + b[0])/2, 4.4, (a[1] + b[1])/2, IV, ry); LBox(g, L, 0.18, 0.5, (a[0] + b[0])/2, 4.5, (a[1] + b[1])/2, BU, ry); LBox(g, L, 0.18, 0.5, (a[0] + b[0])/2, 6.2, (a[1] + b[1])/2, BU, ry);
    LBox(g, L, 0.5, 0.45, (a[0] + b[0])/2, 5.2, (a[1] + b[1])/2, NE, ry); }
  LTris(g, [FX - FW/2, 4.4, FZ, FX, 4.4, FZ + MQ, FX + FW/2, 4.4, FZ], {c:'#e8dcc0', glow:'#fff1c8', gk:1.0});
  LTris(g, [FX - FW/2, 6.4, FZ, FX + FW/2, 6.4, FZ, FX, 6.4, FZ + MQ], '#8a857c');
  LBox(g, FW - 1.6, 4.2, 0.3, FX, 0, FZ - 1.2, {c:'#3a3228', glow:'#ffd9a0', gk:0.6});                                // lit lobby doors (recessed)
  LBox(g, FW, 0.3, 2.0, FX, 4.2, FZ - 0.9, ST2);
  return g; }};
lmPlace('paramount', 37.809804, -122.268551, 1.0891);

// =====================================================================================================================
// Fox Oakland Theatre (1928, Weeks & Day; "Brahmanic" temple tower in Art Deco): the 15 m entrance tower rising to 35 m with
// its colour-tiled domed crown and corner turrets, the gilded marquee and a tall blade sign (lit, no letters), the three-
// storey office front (16 m) and one-storey shop wings round the 25 m concrete theatre. Frame: +z = Telegraph Avenue (ESE),
// +x along Telegraph (NNE), -x = 19th Street. Plan: the real OSM outline (66 x 78 m).
// =====================================================================================================================
LANDMARKS.foxoakland = {zh:'奥克兰福克斯剧院', en:'Fox Oakland Theatre', cat:'old', r:52, h:36,
  lt:{m:0, c:'#ffdcb4', k:0.75, e:0.5}, build(){
  const g = new THREE.Group(), r = LMCTX.rng;
  const CR = {c:'#ddcfb2', lk:0.4}, CR2 = {c:'#cdbd9c', lk:0.4}, CO = {c:'#c9c0ae', lk:0.12}, RF = '#7d7973', DK = '#2b2a2a', GOLD = {c:'#c99a3a', glow:'#ffcc66', gk:0.35};
  const DOME = {c:'#3a8a8c', glow:'#6fd0c8', gk:0.25}, SHOP = {c:'#3a3530', glow:'#ffdca8', gk:0.7}, GL = {c:'#2e353a', ds:true}, GLL = {c:'#2e353a', glow:'#ffd7a0', gk:0.6, ds:true};
  const NE = {c:'#c62b2b', glow:'#ff3a2a', gk:2.0}, GO = {c:'#d8aa40', glow:'#ffd060', gk:1.6}, BU = {c:'#f1e3b4', glow:'#fff1bc', gk:2.2}, IV = {c:'#f2ece0', glow:'#fff0d8', gk:0.3};
  const lit = TB(), drk = TB(), cr = TB();
  const FZ = 39.4;
  // the theatre: concrete box (118 x 198 ft), roof 25 m, stage house 29 m at the back
  LBox(g, 37, 27, 62, 0, -2, -7, CO); LBox(g, 37.6, 0.4, 62.6, 0, 25, -7, RF);
  LBox(g, 40, 31.5, 15, 0, -2, -31, CO); LBox(g, 40.4, 0.4, 15.4, 0, 29.5, -31, RF);
  // shop wings (7.6 m) round the sides and back, office front (16 m, three storeys) on Telegraph
  const SH = [[-33.5, -38.3], [32.8, -38.3], [33.1, 30.5], [24.2, 39.4], [-24.1, 39.4], [-33.8, 29.1]];
  LPoly(g, SH, -2, 9.6, CR2); LPoly(g, SH.map(p => [p[0]*0.995, p[1]*0.995]), 7.6, 0.6, RF);
  winsPoly(SH, 0.5, 4, 1, 4.5, 3.2, 3.2, drk, lit, 0.5, [0]);
  for (const sd of [-1, 1]){
    const P = sd > 0 ? [[8.5, 39.4], [24.2, 39.4], [33.1, 30.5], [33.0, 22], [8.5, 22]] : [[-8.5, 39.4], [-8.5, 22], [-33.7, 22], [-33.8, 29.1], [-24.1, 39.4]];
    LPoly(g, P, -2, 18, CR); LPoly(g, P.map(p => [p[0] + (p[0] - sd*20)*0.01, p[1] + (p[1] - 31)*0.02]), 15.4, 1.0, CR2);
    winsPoly(P, 8.0, 3.6, 2, 3.0, 1.5, 2.2, drk, lit, 0.4, sd > 0 ? [3, 4] : [0, 1]);
    for (let x = 9.5; x < 24; x += 3.0) cr.box(0.6, 1.2, 0.5, sd*x, 16.4, FZ + 0.1);           // parapet merlons echoing the tower
    for (let k = 0; k < 4; k++) LBox(g, 3.2, 3.6, 0.15, sd*(11 + k*3.8), 0.6, FZ + 0.08, SHOP);   // shop fronts
  }
  // ---- entrance tower (15 x 15 m to 26 m), the temple crown to 35 m ----
  const TW = 17, TD = 16, TZ = FZ - TD/2;
  LBox(g, TW, 28, TD, 0, -2, TZ, CR);
  for (const sd of [-1, 1]) LBox(g, 2.4, 28.5, TD + 0.6, sd*(TW/2 - 1.0), -2, TZ, CR2);                                  // flanking piers
  LShape(g, [[-4.6, 0], [4.6, 0], [4.6, 11], [3.2, 14.2], [0, 16.4], [-3.2, 14.2], [-4.6, 11]], 0.5, 0, 6.8, FZ + 0.05, GOLD);  // the great pointed arch
  LShape(g, [[-3.9, 0], [3.9, 0], [3.9, 10.4], [2.7, 13.2], [0, 15.2], [-2.7, 13.2], [-3.9, 10.4]], 0.4, 0, 7.3, FZ + 0.25, {c:'#2b4a5a', glow:'#ffcf8a', gk:0.55});   // glazed grille
  for (let y = 8.5; y < 21; y += 1.6) for (let x = -3.2; x <= 3.21; x += 1.6) cr.box(0.12, 0.12, 0.15, x, y, FZ + 0.48);
  for (let k = 0; k < 8; k++){ const y = 24.6 - (k % 2)*0.5; cr.box(1.0, 1.6, 0.6, -7.4 + k*2.1, y, FZ + 0.15); }             // cresting
  LBox(g, TW + 0.8, 0.9, TD + 0.8, 0, 25.6, TZ, CR2);
  // stepped temple crown with the colour-tiled dome and four corner turrets
  LBox(g, TW - 2.4, 2.4, TD - 2.4, 0, 26.5, TZ, CR); LBox(g, TW - 4.6, 1.6, TD - 4.6, 0, 28.9, TZ, GOLD);
  LLathe(g, [[5.4, 0], [5.6, 1.0], [5.3, 2.4], [4.4, 3.9], [3.0, 5.1], [1.6, 5.9], [0.6, 6.3], [0.2, 7.2], [0.08, 8.4], [0, 8.5]], 0, 30.5, TZ, DOME, 16);
  for (let k = 0; k < 16; k++){ const a = k/16*TAU; LBeam(g, [Math.cos(a)*5.5, 31.0, TZ + Math.sin(a)*5.5], [Math.cos(a)*1.6, 36.4, TZ + Math.sin(a)*1.6], 0.16, GOLD, 4); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]){ const x = sx*(TW/2 - 1.6), z = TZ + sz*(TD/2 - 1.6);
    LCyl(g, 0.9, 1.0, 2.6, x, 26.5, z, CR2, 8); LLathe(g, [[1.1, 0], [1.2, 0.6], [0.9, 1.5], [0.4, 2.3], [0.1, 3.2], [0, 3.3]], x, 29.1, z, DOME, 8); }
  LSph(g, 0.45, 0, 39.2, TZ, BU, 1, 10);                                                  // the beacon ball
  // gilded marquee over the sidewalk, bulb rows, lit soffit
  LBox(g, 22, 2.2, 5.6, 0, 4.4, FZ + 2.8, GOLD); LBox(g, 22.4, 0.2, 6.0, 0, 4.3, FZ + 2.9, BU); LBox(g, 22.4, 0.2, 6.0, 0, 6.6, FZ + 2.9, BU);
  LBox(g, 21.6, 0.9, 0.1, 0, 5.0, FZ + 5.66, NE);
  LBox(g, 21.4, 0.15, 5.3, 0, 4.25, FZ + 2.75, BU);
  LBox(g, 14, 4.0, 0.3, 0, 0.2, FZ + 0.1, SHOP);
  // the vertical blade sign above the marquee (no lettering)
  blade(g, 0, 7.0, 24.5, FZ + 0.6, 3.0, 1.0, NE, GO, BU, IV, 0);
  LBox(g, 1.1, 1.0, 2.6, 0, 24.5, FZ + 1.9, GO);
  lit.out(g, GLL); drk.out(g, GL); cr.out(g, CR);
  return g; }};
lmPlace('foxoakland', 37.80807, -122.27054, 1.3736);


// ---------- ground under a placed landmark: the app's base height (highest ground within r + 0.6) and hC, when available ----------
function appBase(lat, lon, r){
  if (typeof hC !== 'function') return null;
  const w = typeof sgXY === 'function' ? sgXY(lat, lon) : [(lon + 122.19)*88300, (lat - 37.625)*110989];
  let hi = -Infinity; for (let a = 0; a < 12; a++) for (const f of [0, 0.35, 0.7]) hi = Math.max(hi, hC(w[0] + Math.cos(a/12*TAU)*r*f, w[1] + Math.sin(a/12*TAU)*r*f));
  return {x:w[0], y:w[1], top:hi + 0.6, gy:(lx, lz) => hC(w[0] + lx, w[1] - lz) - hi - 0.6};      // gy: local ground height (rot 0 frames)
}
let necklaceLineMat = null;

// =====================================================================================================================
// Lake Merritt: the Pergola and Colonnade at El Embarcadero (1913; a 165-degree colonnade of paired Tuscan columns carrying
// trellis beams round the head of the lake's east arm, three tile-roofed loggias: a central one facing the water and two at
// the ends), and the
// Necklace of Lights: 126 lamp posts round the 3.2-mile shore (the real shoreline, 40 m apart) with strings of ~4000 warm
// pearl bulbs swagged between them. The lake and the parks are already in the map. Frame: rot 0, origin = the centre of the
// colonnade's arc (in the water). The necklace is made of points and lines only, so it hides nothing.
// =====================================================================================================================
const NECK = [-1160.2, 91.0, -1156.3, 51.1, -1147.0, 12.2, -1132.7, -25.2, -1119.1, -62.8, -1114.1, -102.5, -1106.0, -141.7, -1095.1, -180.3, -1082.6, -218.4, -1061.4, -251.1, -1022.7, -256.4, -993.3, -230.1, -984.8, -191.7, -987.2, -151.8, -994.0, -112.3, -998.9, -72.5, -1002.3, -32.6, -1005.9, 7.3, -1010.9, 47.1, -1010.4, 87.0, -1003.1, 126.3, -984.2, 161.0, -948.4, 167.9, -912.4, 181.8, -902.8, 219.8, -884.7, 253.2, -855.7, 280.8, -831.5, 312.5, -814.9, 349.0, -795.1, 383.8, -762.7, 400.9, -724.4, 390.6, -687.5, 378.0, -653.9, 356.2, -619.1, 346.7, -585.0, 335.0, -566.0, 303.2, -568.5, 263.2, -567.8, 223.9, -546.3, 195.1, -531.4, 158.1, -499.2, 136.1, -460.2, 128.2, -420.3, 130.9, -380.8, 133.1, -341.0, 129.1, -301.3, 133.3, -262.5, 135.7, -230.6, 111.6, -199.5, 86.3, -169.0, 60.6, -143.9, 29.8, -107.9, 13.8, -68.0, 10.7, -36.6, -13.8, -4.7, -35.8, 27.8, -15.3, 28.6, 21.2, 20.6, 60.2, 2.8, 95.7, -11.6, 133.0, -30.1, 167.8, -40.3, 206.4, -45.8, 245.6, -52.7, 284.7, -69.7, 320.7, -86.3, 355.0, -104.6, 390.1, -134.0, 415.9, -171.6, 424.0, -205.1, 442.1, -244.6, 445.7, -277.3, 467.9, -304.5, 497.3, -322.3, 532.8, -335.5, 570.6, -348.4, 608.4, -373.0, 640.0, -398.3, 670.8, -419.9, 703.5, -412.5, 740.7, -402.8, 779.5, -399.5, 819.3, -416.4, 854.2, -436.0, 887.8, -471.1, 906.3, -510.8, 908.1, -550.2, 901.4, -590.1, 904.1, -629.0, 913.3, -666.3, 927.8, -700.5, 948.6, -732.6, 972.5, -761.2, 1000.5, -784.7, 1032.9, -805.9, 1066.9, -841.2, 1078.9, -872.1, 1061.5, -905.9, 1041.6, -938.1, 1019.5, -976.4, 1009.9, -1008.1, 985.6, -1025.8, 950.3, -1029.2, 910.9, -1022.1, 872.0, -1024.9, 832.3, -1011.6, 795.1, -1014.9, 755.3, -1012.7, 715.9, -1007.1, 678.9, -991.3, 647.7, -979.8, 609.7, -968.3, 571.5, -959.4, 532.5, -945.4, 495.3, -944.2, 455.8, -968.5, 424.3, -994.3, 393.7, -1023.8, 366.9, -1055.9, 343.0, -1076.0, 310.3, -1089.5, 272.6, -1109.7, 238.5, -1134.0, 207.3, -1148.2, 169.9, -1157.8, 131.0];
const LM_LAT = 37.808304, LM_LON = -122.250002;
LANDMARKS.lakemerritt = {zh:'梅里特湖（藤架柱廊与"光之项链"）', en:'Lake Merritt · Pergola and Necklace of Lights', cat:'old', r:46, h:10,
  lt:{m:0, c:'#ffe2b8', k:0.85, e:0.7}, build(){
  const g = new THREE.Group(), r = LMCTX.rng;
  const WH = '#ebe6d8', WH2 = '#dcd6c6', PV = '#cfc8b6', TL = '#93492f';
  const B = appBase(LM_LAT, LM_LON, 46);
  const cb = TB(), bm = TB();
  const R1 = 37.2, R2 = 41.6, RM = (R1 + R2)/2, AX = -46.5*PI/180, HS = 82.5*PI/180;
  const at = (rad, a) => [Math.cos(a)*rad, Math.sin(a)*rad];
  // terrace under the colonnade (down to -3.5 m on the slope), the pavement on top
  LRing(g, R1 - 1.6, R1 - 1.6, R2 + 1.4, R2 + 1.4, -3.5, 0.15, PV, 60, AX - HS - 0.08, AX + HS + 0.08);
  // colonnade: paired columns on both rows, architraves, radial pergola beams with an overhang, purlins
  const segs = [[AX - HS + 0.115, AX - 0.255], [AX + 0.255, AX + HS - 0.115]];
  for (const [a0, a1] of segs){
    const n = Math.round((a1 - a0)*R2/3.6);
    for (let i = 0; i <= n; i++){ const a = a0 + (a1 - a0)*i/n;
      for (const rad of [R1, R2]) for (const d of [-0.36, 0.36]){ const q = at(rad, a + d/rad);
        cb.box(0.62, 0.3, 0.62, q[0], 0.15, q[1], -a); cb.box(0.42, 3.2, 0.42, q[0], 0.45, q[1], -a); cb.box(0.6, 0.28, 0.6, q[0], 3.65, q[1], -a); } }
    const m = Math.ceil((a1 - a0)*R2/2.0);
    for (const rad of [R1, R2]) for (let i = 0; i < m; i++){ const aa = a0 + (a1 - a0)*(i + 0.5)/m, q = at(rad, aa), L = (a1 - a0)/m*rad + 0.05;
      bm.box(L, 0.55, 0.5, q[0], 3.93, q[1], -aa + HP); }
    const k = Math.round((a1 - a0)*RM/1.15);
    for (let i = 0; i <= k; i++){ const aa = a0 + (a1 - a0)*i/k, q = at(RM, aa); bm.box(0.22, 0.42, R2 - R1 + 2.2, q[0], 4.48, q[1], -aa + HP); }
    for (const rad of [R1 + 0.9, RM, R2 - 0.9]) for (let i = 0; i < m; i++){ const aa = a0 + (a1 - a0)*(i + 0.5)/m, q = at(rad, aa); bm.box((a1 - a0)/m*rad + 0.05, 0.14, 0.14, q[0], 4.9, q[1], -aa + HP); }
    for (let i = 0; i < m; i += 2){ const aa = a0 + (a1 - a0)*(i + 0.5)/m, q = at(RM, aa); cb.box(2.6, 0.45, 0.6, q[0], 0.15, q[1], -aa + HP); }   // benches
  }
  // pavilions: a frame of piers and columns, entablature, solid roof with a low parapet
  const pav = (a, rad, L, W, H) => { const c = at(rad, a), ry = -a + HP, P = (u, w) => [c[0] + u*Math.cos(ry) + w*Math.sin(ry), c[1] - u*Math.sin(ry) + w*Math.cos(ry)];
    LBox(g, L + 1.2, 3.65, W + 1.2, c[0], -3.5, c[1], PV, ry);
    for (const su of [-1, 1]) for (const sw of [-1, 1]){ const q = P(su*(L/2 - 0.6), sw*(W/2 - 0.6)); LBox(g, 1.2, H - 1.4, 1.2, q[0], 0.15, q[1], WH2, ry); }
    const nl = Math.max(1, Math.round((L - 2.4)/2.6)), nw = Math.max(1, Math.round((W - 2.4)/2.6));
    for (let i = 1; i < nl; i++) for (const sw of [-1, 1]){ const q = P(-L/2 + 0.6 + (L - 1.2)*i/nl, sw*(W/2 - 0.6)); cb.box(0.5, H - 1.4, 0.5, q[0], 0.15, q[1], ry); }
    for (let i = 1; i < nw; i++) for (const su of [-1, 1]){ const q = P(su*(L/2 - 0.6), -W/2 + 0.6 + (W - 1.2)*i/nw); cb.box(0.5, H - 1.4, 0.5, q[0], 0.15, q[1], ry); }
    LBox(g, L, 1.0, W, c[0], H - 1.25, c[1], WH, ry); LBox(g, L + 0.6, 0.35, W + 0.6, c[0], H - 0.25, c[1], WH2, ry);
    hipRoof(g, c[0], c[1], L, W, H + 0.1, Math.min(L, W)*0.3, TL, ry, 0.7);                         // red tile hip roof
    return P; };
  pav(AX - HS + 0.02, 39.2, 8.3, 8.3, 5.4); pav(AX + HS - 0.02, 39.2, 8.3, 8.3, 5.4);
  const P = pav(AX, 36.1, 18, 11, 6.2);
  LCyl(g, 2.2, 2.4, 0.7, P(0, 0)[0], 0.15, P(0, 0)[1], WH2, 16); LCyl(g, 0.5, 0.7, 1.4, P(0, 0)[0], 0.85, P(0, 0)[1], WH, 10);   // the old fountain
  // steps from the central pavilion down to the water
  const wl = B ? -0.05 - B.top : -2.4;
  for (let k = 0; k < 8; k++){ const y = -k*0.4, q = P(0, -5.5 - 0.9 - k*0.55); if (y < wl - 0.2) break; LBox(g, 12 - k*0.2, 0.4, 0.9, q[0], y - 0.25, q[1], PV, -AX + HP); }
  cb.out(g, WH); bm.out(g, WH);
  // ---- the Necklace of Lights ----
  const NP = NECK.length/2, gy = B ? B.gy : () => 0, bulbs = [], globes = [], posts = [];
  const tops = []; for (let i = 0; i < NP; i++){ const x = NECK[2*i], z = NECK[2*i + 1], y = Math.max(gy(x, z), wl + 0.6); tops.push([x, y, z]); posts.push(x, y, z, x, y + 4.0, z); globes.push(x, y + 4.25, z); }
  for (let i = 0; i < NP; i++){ const a = tops[i], b = tops[(i + 1) % NP], L = Math.hypot(b[0] - a[0], b[2] - a[2]), n = Math.max(2, Math.round(L/1.25)), sag = 0.9 + L*0.006;
    for (let k = 1; k < n; k++){ const u = k/n; bulbs.push(a[0] + (b[0] - a[0])*u, a[1] + 3.7 + (b[1] - a[1])*u - sag*4*u*(1 - u), a[2] + (b[2] - a[2])*u); } }
  lmSparkle(g, bulbs, 3.0, 1e-7); lmSparkle(g, globes, 6.0, 1e-7);
  for (const fx of LMCTX.fx.slice(-2)) fx.ph.fill(PI/2);              // steady lights (not twinkling): sin(t*1e-7 + pi/2) ~ 1
  if (!necklaceLineMat) necklaceLineMat = new THREE.LineBasicMaterial({color:0x3b4440});
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(posts, 3));
  g.add(new THREE.LineSegments(lg, necklaceLineMat));
  return g; }};
lmPlace('lakemerritt', LM_LAT, LM_LON, 0);

// =====================================================================================================================
// Lake Merritt Municipal Boathouse (1909 pumping station by John Galen Howard, boathouse wings by Walter Reed 1913; today a
// restaurant): cream stucco, red clay tile hip roofs, tall arched windows, the two wings reaching the shore round two boat
// slips, and the 52 m dock out into the lake. Frame: +x towards the lake (ESE), wings at -z (north) and +z (south).
// =====================================================================================================================
const BH_LAT = 37.80222, BH_LON = -122.26148;
LANDMARKS.lmboathouse = {zh:'梅里特湖船屋', en:'Lake Merritt Boathouse', cat:'old', r:62, h:14,
  lt:{m:0, c:'#ffdcb0', k:0.7, e:0.6}, build(){
  const g = new THREE.Group(), r = LMCTX.rng;
  const WL = '#ece2cc', WL2 = '#ddd1b6', TL = '#8f4632', TL2 = '#86412f', DK = '#2f2b29', WD = '#8a6a4c', WD2 = '#6e5440';
  const GL = '#2f3437', GLL = {c:'#2f3437', glow:'#ffd29a', gk:0.7};
  const B = appBase(BH_LAT, BH_LON, 62), wl = B ? Math.min(-0.05 - B.top, -0.4) : -2.5;
  const lit = TB(), drk = TB(), wd = TB();
  // central block (the pumping station): two storeys, tall arched windows, hip roof
  LBox(g, 23.2, 10.0 - wl, 27.2, -8.8, wl, 0.4, WL); LBox(g, 23.8, 0.6, 27.8, -8.8, 9.6, 0.4, WL2);
  hipRoof(g, -8.8, 0.4, 27.2, 23.2, 10.2, 4.6, TL, HP, 0.9);
  for (let k = 0; k < 5; k++){ const z = -10.5 + k*5.2; for (const sx of [-1, 1]) LShape(g, rA(1.2, 7.2, 8), 0.2, sx > 0 ? 2.85 : -20.45, 1.2, z, r() < 0.55 ? GLL : GL, HP); }
  for (let k = 0; k < 4; k++){ const x = -17.5 + k*5.8; for (const sz of [-1, 1]) LShape(g, rA(1.2, 7.2, 8), 0.2, x, 1.2, 0.4 + sz*13.65, r() < 0.55 ? GLL : GL); }
  LBox(g, 5, 3.2, 0.4, -8.8, 0, 14.2, DK); LShape(g, archFill(2.5, 3.2, 4.4, 10), 0.6, -8.8, 0, 14.25, WL2);   // entrance on the south side
  // wings to the shore: one and a half storeys, boat-bay arches on the slips, hip roofs
  for (const sz of [-1, 1]){ const zc = sz*21.3, x0 = -5.9, x1 = 21.4, L = x1 - x0;
    LBox(g, L, 7.6 - wl, 13.4, (x0 + x1)/2, wl, zc, WL); LBox(g, L + 0.6, 0.5, 14.0, (x0 + x1)/2, 7.4, zc, WL2);
    hipRoof(g, (x0 + x1)/2, zc, L, 13.4, 7.8, 3.8, TL2, 0, 0.8);
    for (let k = 0; k < 5; k++){ const x = x0 + 3 + k*5.2;
      LShape(g, rA(1.7, 4.4 - wl, 8), 0.3, x, wl + 0.1, zc - sz*6.72, DK);                                    // boat bays on the slip side
      (r() < 0.5 ? lit : drk).box(1.6, 1.8, 0.12, x, 4.9, zc - sz*6.76); (r() < 0.5 ? lit : drk).box(1.6, 1.8, 0.12, x, 4.9, zc + sz*6.76);
      if (k < 4) LShape(g, rA(1.0, 3.0, 6), 0.2, x + 2.6, 0.6, zc + sz*6.75, r() < 0.5 ? GLL : GL); }
    LShape(g, rA(2.6, 5.6, 10), 0.3, x1 + 0.05, 0.4, zc, GLL, HP);                                                    // the lake-end window
  }
  // quay between the wings, the two slips, the long dock (on piles) into the lake
  LBox(g, 5.6, 0.6 - wl, 30, 5.5, wl, 0.4, '#bdb5a5');
  const DY = wl + 1.1;
  LBox(g, 53, 0.35, 10.2, 34.5, DY, 0.9, WD);
  for (let x = 9; x <= 60; x += 3.4) for (const z of [-3.9, 0.9, 5.7]) wd.box(0.32, 1.3, 0.32, x, wl - 0.2, z);
  for (let x = 8.5; x <= 60.5; x += 1.6) for (const z of [-4.0, 5.8]) wd.box(0.12, 1.05, 0.12, x, DY + 0.35, z);
  for (const z of [-4.0, 5.8]) wd.box(52.4, 0.12, 0.14, 34.5, DY + 1.35, z); wd.box(0.14, 0.12, 9.8, 60.6, DY + 1.35, 0.9);
  for (let k = 0; k < 6; k++){ const x = 14 + k*8; LCyl(g, 0.06, 0.08, 3.4, x, DY + 0.35, -3.9, '#3a3d3e', 5); LSph(g, 0.24, x, DY + 3.9, -3.9, {c:'#f2e6c4', glow:'#ffe7b0', gk:1.4}, 1, 8); }
  for (const sz of [-1, 1]) LBox(g, 14, 0.3, 0.4, 14.8, DY - 0.2, sz*12.7 + 0.4, WD2);                              // slip fenders
  lit.out(g, GLL); drk.out(g, GL); wd.out(g, WD2);
  return g; }};
lmPlace('lmboathouse', BH_LAT, BH_LON, -0.2758);


// a square spire with openwork faces: lofted square tapering from w0 at y0 to a point at y1; perforations on each face go to H
function spire(g, x, z, y0, y1, w0, wT, col, H, ny, nx, prof){
  const secs = [], N = 12;
  for (let i = 0; i <= N; i++){ const t = i/N, w = wT + (w0 - wT)*Math.pow(1 - t, prof || 1.25), y = y0 + (y1 - y0)*t;
    secs.push([[x - w/2, y, z - w/2], [x + w/2, y, z - w/2], [x + w/2, y, z + w/2], [x - w/2, y, z + w/2]]); }
  LLoft(g, secs, col, true);
  if (!H) return;
  for (let j = 0; j < ny; j++){ const t0 = (j + 0.25)/ny*0.82, t1 = (j + 0.75)/ny*0.82, wa = wT + (w0 - wT)*Math.pow(1 - t0, prof || 1.25), wb = wT + (w0 - wT)*Math.pow(1 - t1, prof || 1.25), ya = y0 + (y1 - y0)*t0, yb = y0 + (y1 - y0)*t1;
    const n = Math.max(1, Math.round(nx*(wa/w0)));
    for (let f = 0; f < 4; f++) for (let k = 0; k < n; k++){ const ua = -0.5 + (k + 0.3)/n, ub = -0.5 + (k + 0.7)/n;
      const P = (u, w, y) => { const o = w/2 + 0.04; return f === 0 ? [x + u*w, y, z + o] : f === 1 ? [x + o, y, z - u*w] : f === 2 ? [x - u*w, y, z - o] : [x - o, y, z + u*w]; };
      H.quad(P(ua, wa, ya), P(ub, wa, ya), P(ub, wb, yb), P(ua, wb, yb)); } }
}
const palm = (g, x, y, z, h, r) => { LCyl(g, 0.22, 0.32, h, x, y, z, '#7a6650', 6); for (let k = 0; k < 7; k++){ const a = k/7*TAU + r()*0.5; LBeam(g, [x, y + h, z], [x + Math.cos(a)*2.6, y + h - 0.9, z + Math.sin(a)*2.6], 0.32, '#4f7a3a', 4); } LSph(g, 0.7, x, y + h, z, '#56803f', 0.8, 8); };

// =====================================================================================================================
// Oakland California Temple (1964, Harold W. Burton; Sierra White granite): the stylobate (6.4 m) with the annex wings,
// the temple of a central block with east and west wings, five openwork spires (central 52 m, four corner spires 29 m above
// the forecourt) clad in gold and blue mosaic and lit from inside at night, the sculpted panels on the north and south fronts,
// the forecourt with its reflecting pool fed by a waterfall from the stylobate. Frame: rot -5 deg (the plan is square to
// it), -z = north (uphill), +z = the forecourt (south). Ground here falls ~10 m to the south-west.
// =====================================================================================================================
LANDMARKS.oaktemple = {zh:'奥克兰加州圣殿（后期圣徒）', en:'Oakland California Temple', cat:'old', r:71, h:52,
  lt:{m:0, c:'#fff3dc', k:0.95, e:0.75}, build(){
  const g = new THREE.Group(), r = LMCTX.rng;
  const GR = '#e8e6e0', GR2 = '#d9d6ce', GR3 = '#c9c5bb', RF = '#b9b5ad', DK = '#3a4552', WT = {c:'#6d9fb5', glow:'#9fd8ff', gk:0.25};
  const SP = {c:'#eee6cf', glow:'#ffe2a0', gk:0.3}, HOLE = {c:'#40567a', glow:'#ffc457', gk:1.25}, GOLD = {c:'#d9b25a', glow:'#ffd27a', gk:0.8};
  const hl = TB(), gr = TB(), dk = TB();
  const SY = 3.0, FY = SY - 6.4, LOW = -16;
  // stylobate and the annex wings to the north
  const ST = [[-30.7, 18.5], [-30.7, 24.8], [29.0, 24.4], [29.0, 18.3], [31.5, 18.3], [31.4, -23.5], [22.0, -23.5], [21.7, -67.1], [10.7, -66.9], [11.8, -29.3], [-12.6, -29.2], [-12.9, -66.6], [-22.4, -66.5], [-22.1, -55.8], [-32.2, -55.6], [-32.0, -48.4], [-21.8, -48.3], [-21.6, -22.7], [-32.6, -22.7], [-32.2, 18.4]];
  LPoly(g, ST, LOW, SY - LOW, GR2);
  LPoly(g, ST.map(p => [p[0]*1.004, p[1]*1.004]), SY - 0.6, 0.7, GR);                                                   // coping
  for (const [x0, x1] of [[-22.4, -12.9], [10.7, 21.7]]){ LBox(g, x1 - x0 - 0.4, 5.0, 36, (x0 + x1)/2, SY, -48.2, GR); LBox(g, x1 - x0, 0.5, 36.4, (x0 + x1)/2, SY + 5.0, -48.2, GR3);
    for (let k = 0; k < 8; k++) for (const sx of [x0 - 0.05, x1 + 0.05]) dk.box(0.12, 2.6, 2.0, sx, SY + 1.0, -64 + k*4.4); }
  LBox(g, 62.2, 0.5, 0.3, 0.2, SY - 2.2, 24.75, GR3);                                                                   // a band across the stylobate front
  // the temple: central block 28.8 x 33.4, east and west wings 14 x 15.8, central bays projecting on the north and south
  const TY = SY + 10.2;
  LBox(g, 28.8, TY - SY, 31.4, -0.0, SY, 0.3, GR);
  LBox(g, 16.4, TY - SY + 0.8, 33.4, 0, SY, 0.3, GR);
  for (const sx of [-1, 1]) LBox(g, 13.9, 7.6, 15.8, sx*21.2, SY, 0.2, GR);
  for (const sx of [-1, 1]) LBox(g, 14.5, 0.6, 16.4, sx*21.2, SY + 7.6, 0.2, GR3);
  LBox(g, 29.4, 0.7, 32.0, 0, TY, 0.3, GR3); LBox(g, 17.0, 0.8, 34.0, 0, TY + 0.8, 0.3, GR3);
  // tall slit windows in grilles round the walls, the sculpted panels (north and south)
  // no windows (the walls were designed without openings): shallow granite grille panels and pilasters instead
  const gp = TB();
  for (const sz of [-1, 1]) for (const x of [-12.4, -10.2, 10.2, 12.4]) gp.box(1.1, 7.6, 0.3, x, SY + 1.2, 0.3 + sz*15.75);
  for (const sx of [-1, 1]) for (const z of [-12, -9.6, 10.2, 12.6]) gp.box(0.3, 7.6, 1.1, sx*14.45, SY + 1.2, z);
  for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) gp.box(0.3, 5.0, 1.2, sx*28.2, SY + 1.2, -5.0 + k*3.4);
  for (const sz of [-1, 1]) for (let k = 0; k < 7; k++) gp.box(0.45, 6.6, 0.5, -26 + k*2.3 + (k > 3 ? 38.9 : 0) - (k > 3 ? 0 : 0), SY + 0.3, 0.2 + sz*8.0);
  gp.out(g, GR3);
  for (const sz of [-1, 1]){ const z = 0.3 + sz*16.75; LBox(g, 10.7, 4.0, 0.5, 0, SY + 5.4, z, GR2);
    for (let k = 0; k < 9; k++){ const x = -4.6 + k*1.15; gr.box(0.55, 2.6 + (k % 3)*0.5, 0.3, x, SY + 5.8, z + sz*0.3); }       // the figures in relief
    dk.box(4.4, 3.6, 0.12, 0, SY + 0.2, z + sz*0.1); }
  // central tower: chamfered square block on the roof, stepped base, the openwork spire to 52 m above the forecourt
  const CX = -0.9, CZ = -3.5, TIP = FY + 51.8;
  LCyl(g, 8.6, 8.6, 6.2, CX, TY, CZ, GR, 8, PI/8);
  LCyl(g, 8.9, 8.9, 0.7, CX, TY + 6.2, CZ, GR3, 8, PI/8);
  for (let f = 0; f < 4; f++){ const a = f*HP; for (let k = -2; k <= 2; k++){ const c = Math.cos(a), s = Math.sin(a), u = k*1.55, w = 7.97;
    dk.box(0.8, 4.4, 0.12, CX + u*c + w*s, TY + 0.9, CZ - u*s + w*c, -a); } }
  LBox(g, 11.2, 2.4, 11.2, CX, TY + 6.9, CZ, GR); LBox(g, 9.0, 1.6, 9.0, CX, TY + 9.3, CZ, GR2);
  spire(g, CX, CZ, TY + 10.9, TIP, 8.2, 0.25, SP, hl, 11, 6, 1.15);
  LCyl(g, 0.06, 0.18, 2.4, CX, TIP - 0.4, CZ, GOLD, 6);
  // four corner spires (29 m above the forecourt)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]){ const x = sx*13.4, z = 0.3 + sz*13.5, tip = FY + 29.3;
    LBox(g, 4.6, 2.8, 4.6, x, TY, z, GR); LBox(g, 5.0, 0.5, 5.0, x, TY + 2.8, z, GR3);
    spire(g, x, z, TY + 3.3, tip, 3.6, 0.12, SP, hl, 6, 3, 1.15); }
  // forecourt to the south: granite terrace, the reflecting pool, the waterfall from the stylobate, side stairs, palms
  LBox(g, 26.4, FY - LOW, 28, 0, LOW, 38.8, GR2); LBox(g, 26.8, 0.4, 28.4, 0, FY - 0.3, 38.8, GR);
  LBox(g, 10.2, 0.3, 24.6, 0, FY + 0.05, 39.0, GR3); LBox(g, 9.75, 0.32, 24.0, 0, FY + 0.1, 39.0, WT);
  LBox(g, 9.75, SY - FY - 0.2, 0.25, 0, FY + 0.2, 25.0, WT);                                                                // the waterfall sheet
  for (const sx of [-1, 1]) for (let k = 0; k < 16; k++){ const y = FY + k*0.4; LBox(g, 3.6, 0.4, 0.5, sx*16.0, y, 26.6 + 7.6 - k*0.5, GR2); }   // side stairs up the stylobate
  for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) palm(g, sx*11.6, FY, 30 + k*8.5, 9 + r()*1.5, r);
  hl.out(g, HOLE); gr.out(g, GR); dk.out(g, DK);
  return g; }};
lmPlace('oaktemple', 37.80782, -122.19910, -0.0873);

// =====================================================================================================================
// Oakland Coliseum (1966, Skidmore, Owings & Merrill): the round concrete bowl set in its grassed berm (the field sits below
// grade; here the field is at grade and the berm is the concourse ring), the lower bowl, the two upper decks with the
// ribbed concrete rim, and "Mount Davis" (1996) - the massive east stand over the outfield with its suite levels and flat
// back; the baseball diamond (home plate west, centre field east), light banks on the rim. Frame: rot 0, origin = centre of
// the real ring (the field opening is centred 5 m south-west of it).
// =====================================================================================================================
LANDMARKS.coliseum = {zh:'奥克兰体育场', en:'Oakland Coliseum', cat:'new', r:160, h:44,
  lt:{m:0, c:'#e8f0ff', k:0.45, e:0.5}, build(){
  const g = new THREE.Group(), r = LMCTX.rng;
  const CO = {c:'#bdb8ad', ds:true}, CO2 = {c:'#a9a49a', ds:true}, CO3 = {c:'#cfcbc2', ds:true}, SEAT = {c:'#2f5a45', ds:true}, SEAT2 = {c:'#28503d', ds:true}, DIRT = '#ad7650', BERM = {c:'#6f8f4f', ds:true}, GRY = '#5a5e63';
  const GLS = {c:'#2b3640', glow:'#ffe2b8', gk:0.45}, LT = {c:'#f4f6f8', glow:'#ffffff', gk:2.4}, FLD = {c:'#4f8a3c', glow:'#2c5a22', gk:0.35}, FLD2 = {c:'#5d9646', glow:'#2c5a22', gk:0.35};
  const GRS = FLD, GRS2 = FLD2;
  const FX = -4, FZ = 5.2;                                       // field opening centre
  const md0 = -42*PI/180, md1 = 33*PI/180;                        // Mount Davis sector (east)
  const ring = (rin, rout, y0, y1, col, a0, a1, n, cx, cz) => { const m = LRing(g, rin, rin, rout, rout, y0, y1, col, n || 72, a0, a1); m.position.x = cx === undefined ? FX : cx; m.position.z = cz === undefined ? FZ : cz; return m; };
  // field: grass, the infield dirt and the diamond, warning track
  LCyl(g, 72, 72, 1.6, FX, -1.2, FZ, DIRT, 48);
  LCyl(g, 67, 67, 1.65, FX, -1.2, FZ, FLD, 48);
  for (let k = 0; k < 9; k++) LBox(g, 132, 0.02, 7.3, FX, 0.45, FZ - 29 + k*7.3, k % 2 ? GRS : GRS2);
  const HX = FX - 57, HZ = FZ;
  LCyl(g, 29, 29, 0.1, HX + 19.4, 0.46, HZ, DIRT, 32); LCyl(g, 20, 20, 0.12, HX + 19.4, 0.47, HZ, GRS, 4, PI/4);
  LCyl(g, 2.8, 2.8, 0.3, HX + 18.4, 0.47, HZ, DIRT, 12); LCyl(g, 4, 4, 0.14, HX + 1.0, 0.47, HZ, DIRT, 12);
  for (const [x, z] of [[19.4, 19.4], [38.8, 0], [19.4, -19.4]]) LBox(g, 0.5, 0.15, 0.5, HX + x, 0.55, HZ + z, CO3);
  // lower bowl: stepped tiers from the field wall (r 70) up to the concourse (r 100, +7.5 m), all round
  ring(70, 72, -1.2, 2.2, CO2, 0, TAU, 96);
  for (let k = 0; k < 12; k++){ const ra = 72 + k*2.4; ring(ra, ra + 2.5, -1.2, 2.2 + k*0.5, k % 2 ? SEAT : SEAT2, 0, TAU, 96); }
  ring(100.8, 104, -1.2, 7.8, CO, 0, TAU, 96);                                                     // concourse ring
  // the berm: grassed earth from the concourse down to the ground, round the original stadium (not under Mount Davis)
  const berm = [], NB = 72; for (let i = 0; i < NB; i++){ const a0 = i/NB*TAU, a1 = (i + 1)/NB*TAU, am = (a0 + a1)/2; if (am > md0 + TAU && am < md1 + TAU) continue; if (am > md0 && am < md1) continue;
    const P = (rad, a, y) => [FX + Math.cos(a)*rad, y, FZ + Math.sin(a)*rad]; berm.push(...P(118, a0, 7.4), ...P(141, a0, -6), ...P(141, a1, -6), ...P(118, a0, 7.4), ...P(141, a1, -6), ...P(118, a1, 7.4)); }
  LTris(g, berm, BERM);
  for (const [a, w] of [[PI, 9], [-PI/2, 7], [PI/2, 7], [2.4, 6]]){ const c = [FX + Math.cos(a)*129, FZ + Math.sin(a)*129]; LBox(g, w, 0.5, 23, c[0], 2.2, c[1], CO3, -a + HP); }   // entry walks over the berm
  // upper decks of the original bowl (everywhere except Mount Davis): club deck and third deck, ribbed outer rim
  const up0 = md1, up1 = md0 + TAU;
  ring(104, 108, 7.5, 9.0, CO, up0, up1, 72);
  for (let k = 0; k < 5; k++){ const ra = 104 + k*2.2; ring(ra, ra + 2.3, 7.8, 9.6 + k*0.9, k % 2 ? SEAT : SEAT2, up0, up1, 72); }
  ring(113, 116, 8.5, 14.6, CO, up0, up1, 72);
  for (let k = 0; k < 6; k++){ const ra = 109 + k*1.8; ring(ra, ra + 1.9, 13.8, 15.4 + k*1.15, k % 2 ? SEAT : SEAT2, up0, up1, 72); }
  ring(118, 120, -6, 23.2, CO, up0, up1, 72);                                                     // outer wall
  ring(117.5, 120.6, 22.6, 24.0, CO3, up0, up1, 72);                                             // rim
  const rb = TB(); for (let a = up0; a < up1; a += 2.6*PI/180){ const x = FX + Math.cos(a)*120.6, z = FZ + Math.sin(a)*120.6; rb.box(1.2, 29.2, 1.6, x, -6, z, -a); }
  rb.out(g, CO2);
  // ramp towers (the round helical ramps) round the outside
  for (const a of [2.0, 2.75, -2.6, -1.9, 1.25]){ const x = FX + Math.cos(a)*131, z = FZ + Math.sin(a)*131; LCyl(g, 8.5, 8.5, 26.5, x, -6, z, CO2, 20); LRing(g, 8.6, 8.6, 9.6, 9.6, 2, 2.9, CO3, 20).position.set(x, 0, z); LRing(g, 8.6, 8.6, 9.6, 9.6, 10, 10.9, CO3, 20).position.set(x, 0, z); LRing(g, 8.6, 8.6, 9.6, 9.6, 18, 18.9, CO3, 20).position.set(x, 0, z); }
  // ---- Mount Davis: east stand over the outfield, rising to 42 m, suite levels, flat back at x = 140 ----
  const MD = [];
  const mdAt = (a, rad) => [FX + Math.cos(a)*rad, FZ + Math.sin(a)*rad];
  const NM = 24;
  for (let i = 0; i < NM; i++){ const a0 = md0 + (md1 - md0)*i/NM, a1 = md0 + (md1 - md0)*(i + 1)/NM;
    // tiers: lower deck already (bowl); middle tiers r 104 -> 118 (y 8 -> 18), suites (18 -> 26), upper tiers r 110 -> 138 (26 -> 42)
    const tier = (ra, rb2, ya, yb, col) => { const A = mdAt(a0, ra), B2 = mdAt(a1, ra), C = mdAt(a1, rb2), D = mdAt(a0, rb2); MD.push([[A[0], ya, A[1]], [B2[0], ya, B2[1]], [C[0], yb, C[1]], [D[0], yb, D[1]], col]); };
    for (let k = 0; k < 6; k++) tier(104 + k*2.4, 106.4 + k*2.4, 8 + k*1.7, 9.7 + k*1.7, k % 2 ? 1 : 2);
    for (let k = 0; k < 9; k++) tier(112 + k*2.7, 114.7 + k*2.7, 25.5 + k*1.75, 27.25 + k*1.75, k % 2 ? 1 : 2);
  }
  const sTris = {1:[], 2:[]};
  for (const [A, B2, C, D, c] of MD){ const T = sTris[c]; T.push(...A, ...B2, ...C, ...A, ...C, ...D); const Ab = [A[0], A[1] - 1.7, A[2]], Bb = [B2[0], B2[1] - 1.7, B2[2]]; T.push(...Ab, ...Bb, ...B2, ...Ab, ...B2, ...A); }
  LTris(g, sTris[1], SEAT); LTris(g, sTris[2], SEAT2);
  // Mount Davis structure: the mass under the tiers, the upper block with the suite bands, the back (the real OSM outline: flat
  // along the east from z -15 to 71, curving round to the north-east), ribs, roof canopy edge, light banks, stair towers
  const mdP = []; for (let i = 0; i <= 12; i++){ const a = md0 + (md1 - md0)*i/12; mdP.push(mdAt(a, 118)); }
  const OUT = [[98.8, -89.0], [115.3, -66.6], [122.9, -54.7], [139.4, -14.7], [143.8, 17.7], [145.1, 41.6], [138.7, 70.7], [125.9, 78.7]];
  LPoly(g, [...mdP.slice().reverse(), ...OUT], -6, 31.5, CO);
  const toF = (p, d) => { const dx = FX - p[0], dz = FZ - p[1], L = Math.hypot(dx, dz); return [p[0] + dx/L*d, p[1] + dz/L*d]; };
  LPoly(g, [...OUT.map(p => toF(p, 20)).reverse(), ...OUT], 25, 17.5, CO2);
  for (let k = 0; k < 2; k++) ring(117.5, 117.8, 18.6 + k*3.4, 21.2 + k*3.4, GLS, md0, md1, 24);                 // two suite levels under the upper tiers
  const rib = TB();
  for (let i = 0; i < OUT.length - 1; i++){ const A = OUT[i], B2 = OUT[i + 1], L = Math.hypot(B2[0] - A[0], B2[1] - A[1]), ry = -Math.atan2(B2[1] - A[1], B2[0] - A[0]), n = Math.max(1, Math.round(L/4.2));
    for (let k = 0; k < n; k++){ const u = (k + 0.5)/n, q = toF([A[0] + (B2[0] - A[0])*u, A[1] + (B2[1] - A[1])*u], -0.5); rib.box(1.2, 48.5, 1.0, q[0], -6, q[1], ry); }
    for (let y = 4; y < 40; y += 6){ const m = toF([(A[0] + B2[0])/2, (A[1] + B2[1])/2], -0.3); LBox(g, L + 0.4, 0.6, 0.5, m[0], y, m[1], CO2, ry); }
    const m = toF([(A[0] + B2[0])/2, (A[1] + B2[1])/2], 4.5); LBox(g, L + 1, 1.0, 9, m[0], 42.5, m[1], CO3, ry); }       // canopy over the top rows
  rib.out(g, CO3);
  for (const i of [2, 5]){ const q = toF(OUT[i], 2); LBox(g, 9, 3.0, 2.0, q[0], 43.6, q[1], GRY, -Math.atan2(OUT[i + 1][1] - OUT[i][1], OUT[i + 1][0] - OUT[i][0])); const q2 = toF(OUT[i], 3.2); LBox(g, 8.2, 2.4, 0.3, q2[0], 43.9, q2[1], LT, -Math.atan2(OUT[i + 1][1] - OUT[i][1], OUT[i + 1][0] - OUT[i][0])); }
  for (const p of [toF(OUT[0], 5), toF(OUT[OUT.length - 1], 5)]) LBox(g, 11, 44, 11, p[0], -6, p[1], CO2);             // stair towers at the ends
  // two outfield scoreboards (dark screens) on the bowl rim either side of Mount Davis
  for (const a of [md0 - 0.16, md1 + 0.16]){ const p = mdAt(a, 112), ry = -a + HP; LBox(g, 44, 11, 1.4, p[0], 24, p[1], GRY, ry); const q = mdAt(a, 111.2); LBox(g, 42, 9.4, 0.2, q[0], 24.8, q[1], {c:'#1d2a36', glow:'#5a8cff', gk:0.35}, ry); for (const d of [-14, 14]){ const s2 = [p[0] + Math.cos(-ry)*d, p[1] + Math.sin(-ry)*d]; LBox(g, 1.6, 24, 1.6, s2[0], 0, s2[1], CO2); } }
  // light banks on the rim of the original bowl
  for (const a of [1.05, 1.75, 2.45, 3.14, -2.45, -1.75, -1.05]){ const p = mdAt(a, 119.5); LCyl(g, 0.5, 0.7, 12, p[0], 23.8, p[1], GRY, 6); LBox(g, 8, 4.2, 1.0, p[0], 35.2, p[1], GRY, -a + HP); const q = mdAt(a, 118.9); LBox(g, 7.4, 3.6, 0.2, q[0], 35.5, q[1], LT, -a + HP); }
  return g; }};
lmPlace('coliseum', 37.751659, -122.2005, 0);

// =====================================================================================================================
// Oakland Arena (1966, Skidmore, Owings & Merrill; renovated 1997 inside the original shell): a 131 m glass drum set behind a
// ring of crossing concrete struts (a continuous X-braced colonnade) that carries the shallow dished roof and its deep
// fascia. At night the glass walls glow. Frame: rot 0, origin = the centre of the drum.
// =====================================================================================================================
LANDMARKS.oakarena = {zh:'奥克兰体育馆', en:'Oakland Arena', cat:'new', r:70, h:32,
  lt:{m:0, c:'#eef3ff', k:0.5, e:0.6}, build(){
  const g = new THREE.Group();
  const CO = '#d2cdc2', CO2 = '#bfb9ad', GLZ = {c:'#3f5560', glow:'#ffe0b0', gk:0.55}, RFC = '#9fa3a6', DK = '#3a3d40';
  const R = 65.4, RG = 59.5;
  LCyl(g, R + 1.5, R + 2.5, 8.2, 0, -8.0, 0, CO2, 64);                                             // podium and plaza edge
  LCyl(g, RG, RG, 22.8, 0, 0, 0, GLZ, 64);                                                          // glass drum
  const mul = TB(); for (let k = 0; k < 96; k++){ const a = k/96*TAU; mul.box(0.25, 22.6, 0.4, Math.cos(a)*(RG + 0.1), 0.2, Math.sin(a)*(RG + 0.1), -a); }
  for (const y of [7.4, 14.8]) for (let k = 0; k < 96; k++){ const a = (k + 0.5)/96*TAU; mul.box(RG*TAU/96, 0.25, 0.35, Math.cos(a)*(RG + 0.1), y, Math.sin(a)*(RG + 0.1), -a + HP); }
  mul.out(g, DK);
  // the X-braced ring: 32 struts each way, from the ground ring to the roof ring, crossing at mid-height
  const NS = 32, xb = TB();
  for (let k = 0; k < NS; k++){ const a0 = k/NS*TAU, a1 = (k + 1)/NS*TAU;
    for (const [aa, ab] of [[a0, a1], [a1, a0]]) LBeam(g, [Math.cos(aa)*(R - 1.2), 0.2, Math.sin(aa)*(R - 1.2)], [Math.cos(ab)*(R - 1.2), 22.6, Math.sin(ab)*(R - 1.2)], 0.75, CO, 6);
    xb.box(2.0, 1.6, 2.0, Math.cos(a0)*(R - 1.2), -0.2, Math.sin(a0)*(R - 1.2), -a0); }
  xb.out(g, CO2);
  LRing(g, R - 3.2, R - 3.2, R + 0.6, R + 0.6, 22.4, 25.6, CO, 64);                                  // compression ring / fascia
  LRing(g, R - 2.6, R - 2.6, R + 0.9, R + 0.9, 25.6, 26.2, CO2, 64);
  LLathe(g, [[R - 2.8, 0], [R - 10, 1.4], [R - 25, 3.4], [R - 42, 5.0], [R - 58, 5.7], [0, 5.9]], 0, 25.4, 0, RFC, 48);   // dished roof
  LCyl(g, 6, 6, 1.6, 0, 31.0, 0, '#8d9194', 16);
  for (const a of [0.4, 2.1, 3.7, 5.3]){ LBox(g, 9, 3.2, 0.4, Math.cos(a)*(R + 0.2), 0, Math.sin(a)*(R + 0.2), {c:'#3a3530', glow:'#ffdba8', gk:0.8}, -a + HP); }   // entrances
  return g; }};
lmPlace('oakarena', 37.750278, -122.202933, 0);

}
