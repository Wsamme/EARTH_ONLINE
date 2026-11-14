const PI = Math.PI, TAU = PI*2;
// ---------- batching: triangles per colour spec, flushed into one LTris call each ----------
function Bt(){ const M = new Map();
  const arr = col => { const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; };
  return { arr,
    q(col, a, b, c, d){ const o = arr(col); o.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2]); },
    t(col, a, b, c){ arr(col).push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); },
    flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; }
function obox(B, col, cx, cz, ux, uz, L, W, y0, y1, noBot){
  const l = Math.hypot(ux, uz) || 1; ux /= l; uz /= l; const vx = -uz, vz = ux, a = L/2, b = W/2;
  const P = (s, t) => [cx + ux*s + vx*t, 0, cz + uz*s + vz*t];
  const c = [P(-a, -b), P(a, -b), P(a, b), P(-a, b)];
  const lo = c.map(p => [p[0], y0, p[2]]), hi = c.map(p => [p[0], y1, p[2]]);
  for (let i = 0; i < 4; i++){ const j = (i + 1)%4; B.q(col, lo[i], lo[j], hi[j], hi[i]); }
  B.q(col, hi[0], hi[1], hi[2], hi[3]); if (!noBot) B.q(col, lo[3], lo[2], lo[1], lo[0]);
}
const abox = (B, col, x0, x1, y0, y1, z0, z1) => obox(B, col, (x0 + x1)/2, (z0 + z1)/2, 1, 0, x1 - x0, z1 - z0, y0, y1);
function cap(B, col, ring, y){
  const V = ring.map(p => new THREE.Vector2(p[0], p[1])), tr = THREE.ShapeUtils.triangulateShape(V, []);
  for (const [a, b, c] of tr) B.t(col, [V[a].x, y, V[a].y], [V[b].x, y, V[b].y], [V[c].x, y, V[c].y]);
}
function ext(B, col, ring, y0, y1, topCol, bot){
  const n = ring.length;
  for (let i = 0; i < n; i++){ const a = ring[i], b = ring[(i + 1)%n]; B.q(col, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); }
  if (topCol !== null) cap(B, topCol || col, ring, y1);
  if (bot) cap(B, bot, ring, y0);
}
function loft(B, col, R, capLast){
  for (let i = 0; i < R.length - 1; i++){ const a = R[i], b = R[i + 1], n = a.length;
    for (let k = 0; k < n; k++){ const k2 = (k + 1)%n; B.q(col, a[k], a[k2], b[k2], b[k]); } }
  if (capLast){ const r = R[R.length - 1], n = r.length, c = [0, 0, 0]; for (const p of r){ c[0] += p[0]/n; c[1] += p[1]/n; c[2] += p[2]/n; }
    for (let k = 0; k < n; k++) B.t(col, r[k], r[(k + 1)%n], c); }
}
function cylw(B, col, x, z, r0, r1, y0, y1, n, capTop){
  const P = (r, y, k) => [x + Math.cos(k/n*TAU)*r, y, z + Math.sin(k/n*TAU)*r];
  for (let k = 0; k < n; k++){ B.q(col, P(r0, y0, k), P(r0, y0, k + 1), P(r1, y1, k + 1), P(r1, y1, k)); if (capTop) B.t(capTop, P(r1, y1, k), P(r1, y1, k + 1), [x, y1, z]); }
}
const ringArea = R => { let s = 0; for (let i = 0; i < R.length; i++){ const p = R[i], q = R[(i + 1)%R.length]; s += p[0]*q[1] - q[0]*p[1]; } return s/2; };
const centroid = R => { let a = 0, cx = 0, cz = 0; for (let i = 0; i < R.length; i++){ const p = R[i], q = R[(i + 1)%R.length], f = p[0]*q[1] - q[0]*p[1]; a += f; cx += (p[0] + q[0])*f; cz += (p[1] + q[1])*f; } return a ? [cx/(3*a), cz/(3*a)] : R[0]; };
function grow(R, d){ const n = R.length, o = ringArea(R) > 0 ? 1 : -1;
  return R.map((p, i) => { const a = R[(i + n - 1)%n], b = R[(i + 1)%n];
    const e1 = [p[0] - a[0], p[1] - a[1]], e2 = [b[0] - p[0], b[1] - p[1]], l1 = Math.hypot(...e1) || 1, l2 = Math.hypot(...e2) || 1;
    const n1 = [o*e1[1]/l1, -o*e1[0]/l1], n2 = [o*e2[1]/l2, -o*e2[0]/l2], m = [n1[0] + n2[0], n1[1] + n2[1]], ml = Math.hypot(...m) || 1, cs = (m[0]*n1[0] + m[1]*n1[1])/ml;
    const k = d/Math.max(0.35, cs); return [p[0] + m[0]/ml*k, p[1] + m[1]/ml*k]; }); }
function bands(B, col, R, ys, th, d){ const G = grow(R, d); for (const y of ys) ext(B, col, G, y - th/2, y + th/2, null); }
function mullions(B, col, R, step, d, w, y0, y1, corners){
  const n = R.length, o = ringArea(R) > 0 ? 1 : -1;
  for (let i = 0; i < n; i++){ const a = R[i], b = R[(i + 1)%n], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.5) continue;
    const ux = (b[0] - a[0])/L, uz = (b[1] - a[1])/L, nx = o*uz, nz = -o*ux, k = Math.max(1, Math.round(L/step));
    for (let j = corners ? 0 : 1; j < k; j++){ const f = j/k, x = a[0] + (b[0] - a[0])*f + nx*d/2, z = a[1] + (b[1] - a[1])*f + nz*d/2; obox(B, col, x, z, nx, nz, d, w, y0, y1, true); } }
}
// columns round a ring at spacing step (a colonnade), square section w
function colonnade(B, col, R, step, w, y0, y1){
  const n = R.length;
  for (let i = 0; i < n; i++){ const a = R[i], b = R[(i + 1)%n], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < step*0.6) continue;
    const k = Math.max(1, Math.round(L/step)), ux = (b[0] - a[0])/L, uz = (b[1] - a[1])/L;
    for (let j = 0; j < k; j++){ const f = (j + 0.5)/k; obox(B, col, a[0] + (b[0] - a[0])*f, a[1] + (b[1] - a[1])*f, ux, uz, w, w, y0, y1, true); } }
}
const scaleR = (R, c, f) => R.map(p => [c[0] + (p[0] - c[0])*f, c[1] + (p[1] - c[1])*f]);
function beacons(g, pts, rgb, size){
  if (!pts.length) return;
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const col = new Float32Array(pts.length); for (let i = 0; i < col.length; i += 3){ col[i] = rgb[0]; col[i + 1] = rgb[1]; col[i + 2] = rgb[2]; }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({size, map:typeof lampTex !== 'undefined' ? lampTex : null, vertexColors:true, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending, sizeAttenuation:true});
  const p = new THREE.Points(geo, mat); p.renderOrder = 6;
  p.onBeforeRender = () => { mat.opacity = typeof matLamp !== 'undefined' ? Math.min(1, matLamp.opacity*1.1) : (NIGHT.uNight.value > 0.5 ? 1 : 0); };
  g.add(p);
}
const RED = {c:'#a81010', glow:'#ff2a14', gk:2.4};
function redLight(B, x, y, z, s){ abox(B, RED, x - s, x + s, y, y + 2*s, z - s, z + s); }
const pip = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0])*(z - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; };
const pbb = P => { let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; for (const p of P){ x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); } return [x0, z0, x1, z1]; };
// hip roof over an oriented rectangle (centre cx, cz; axis ux, uz; L x W) from eave y0 to ridge y1, ridge along the long axis
function hipRoofR(B, col, cx, cz, ux, uz, L, W, y0, y1){
  const vx = -uz, vz = ux, P = (s, t, y) => [cx + ux*s + vx*t, y, cz + uz*s + vz*t], a = L/2, b = W/2, r = Math.max(0, a - b);
  const c = [P(-a, -b, y0), P(a, -b, y0), P(a, b, y0), P(-a, b, y0)], r0 = P(-r, 0, y1), r1 = P(r, 0, y1);
  B.q(col, c[0], c[1], r1, r0); B.q(col, c[2], c[3], r0, r1); B.t(col, c[1], c[2], r1); B.t(col, c[3], c[0], r0);
  B.q(col, c[3], c[2], c[1], c[0]);
}
// frame of a 4-point ring: centre, unit long axis u, length L, width W
function rframe(R){ const c = centroid(R), e0 = [R[1][0] - R[0][0], R[1][1] - R[0][1]], e1 = [R[2][0] - R[1][0], R[2][1] - R[1][1]];
  const l0 = Math.hypot(...e0), l1 = Math.hypot(...e1);
  return l0 >= l1 ? {c, u:[e0[0]/l0, e0[1]/l0], L:l0, W:l1} : {c, u:[e1[0]/l1, e1[1]/l1], L:l1, W:l0}; }
const fP = (F, s, t) => [F.c[0] + F.u[0]*s - F.u[1]*t, F.c[1] + F.u[1]*s + F.u[0]*t];
const LL = (lat, lon, x, z) => [lat - z/110734.9, lon + x/103014.2];

// ================= Minying International Trade Center T2 =================
// T2 422.6 m, 96 floors, opened 2021: the tallest building in Dongguan (targets.json, verified). Footprint OSM w1287829518 (a 45.7 m
// square turned ~10 deg; T1 / T3 and the mall podium stay the app's buildings). Form after photos as remembered, approximate: a
// square shaft with cut corners, two slight setbacks up the height, a tapering glazed crown and a spire; vertical mullions; the
// crown lit at night (aviation lights on top). The setback heights and the crown proportions are approximations.
const MY = D.minying;
LANDMARKS.dgminying = {zh:'民盈·国贸中心', en:'Minying International Trade Center', cat:'new', r:46, h:422.6, lt:{m:1, c:'#e8eefa', k:0.8, anim:'cycle', c2:'#ffe2b0'},
  build(){
    const g = new THREE.Group(), B = Bt(), c = centroid(MY.r);
    const GL = {c:'#7f97a8', m:1, fh:4.1, cw:2.2}, GLC = {c:'#a3b8c8', m:0, lc:'#dbe9ff', lk:0.9, glow:'#bcd6f6', gk:0.7},
      FIN = {c:'#cfd5d9', m:0, lk:0.35}, LINE = {c:'#e3e9ec', glow:'#eef5ff', gk:1.3}, BASE = '#b4afa5', ROOF = '#9aa0a3';
    // chamfered plan: cut each corner by fraction ch of the side
    const cham = (f, ch) => { const R = scaleR(MY.r, c, f), out = [];
      for (let i = 0; i < 4; i++){ const a = R[i], b = R[(i + 1)%4]; out.push([a[0] + (b[0] - a[0])*ch, a[1] + (b[1] - a[1])*ch], [a[0] + (b[0] - a[0])*(1 - ch), a[1] + (b[1] - a[1])*(1 - ch)]); }
      return out; };
    const seg = [[0, 140, 1.0], [141.5, 270, 0.955], [271.5, 355, 0.91]];
    for (const [y0, y1, f] of seg){ const R = cham(f, 0.14); ext(B, GL, R, y0 === 0 ? -3 : y0, y1, ROOF); mullions(B, FIN, R, 3.2, 0.55, 0.35, y0 + 1, y1, true);
      bands(B, LINE, R, [y1 - 0.4], 0.8, 0.5); ext(B, FIN, grow(R, 0.4), y1, y1 + 1.5, ROOF);
      const fy = []; for (let y = y0 + 8.8; y < y1 - 3; y += 8.8) fy.push(y); bands(B, FIN, R, fy, 0.45, 0.15); }
    // tapering crown 356.5 -> 398, then the spire to 422.6
    const cy = [356.5, 368, 380, 390, 398], cf = [0.9, 0.84, 0.74, 0.6, 0.42];
    loft(B, GLC, cy.map((y, i) => cham(cf[i], 0.14).map(p => [p[0], y, p[1]])), true);
    for (let k = 0; k < 8; k++){ const pts = cy.map((y, i) => { const p = cham(cf[i], 0.14)[k]; return [p[0], y, p[1]]; });
      for (let i = 0; i < pts.length - 1; i++){ const a = pts[i], b = pts[i + 1]; B.q(LINE, [a[0] - 0.3, a[1], a[2]], [a[0] + 0.3, a[1], a[2]], [b[0] + 0.3, b[1], b[2]], [b[0] - 0.3, b[1], b[2]]); B.q(LINE, [a[0], a[1], a[2] - 0.3], [a[0], a[1], a[2] + 0.3], [b[0], b[1], b[2] + 0.3], [b[0], b[1], b[2] - 0.3]); } }
    cylw(B, FIN, c[0], c[1], 2.2, 0.35, 398, 422.2, 8, FIN);
    ext(B, BASE, grow(cham(1.0, 0.14), 0.3), -3, 0.6, BASE);
    redLight(B, c[0], 422.2, c[1], 0.4);
    B.flush(g); beacons(g, [c[0], 423.5, c[1]], [1, 0.18, 0.1], 16);
    return g;
  }};
SG_PLACES.push({type:'dgminying', lat:23.01419, lon:113.758135, rot:0});

// ================= TBA Tower (Global Trade Plaza) =================
// 289 m, 68 floors, 2013 (targets.json, verified). Footprint OSM w1458006477: a 54 m rounded diamond (28 points). Form approximate:
// the glazed shaft rises on its real plan, tapering slightly, and closes in a narrowing crown with a mast; lit windows, a lit crown.
const TB = D.tba;
LANDMARKS.dgtba = {zh:'环球经贸中心（台商大厦）', en:'Dongguan TBA Tower', cat:'new', r:43, h:289, lt:{m:1, c:'#e6f0f8', k:0.75, anim:'cycle', c2:'#bfe4ff'},
  build(){
    const g = new THREE.Group(), B = Bt(), c = centroid(TB.r);
    const GL = {c:'#6f8a9c', m:1, fh:4.0, cw:2.4}, GLC = {c:'#9db6c7', m:0, lc:'#d6e8ff', lk:0.9, glow:'#b8d6f4', gk:0.7},
      FIN = {c:'#cdd3d7', m:0, lk:0.35}, LINE = {c:'#e3e9ec', glow:'#eef5ff', gk:1.3}, BASE = '#b4afa5';
    const sc = y => y < 230 ? 1 - 0.06*y/230 : y < 268 ? 0.94 - 0.24*(y - 230)/38 : 0.7 - 0.45*(y - 268)/9;
    const ys = [0, 60, 120, 180, 230], R = y => scaleR(TB.r, c, sc(y)).map(p => [p[0], y, p[1]]);
    loft(B, GL, ys.map(R), false); loft(B, GLC, [230, 242, 255, 268, 277].map(R), true);
    for (const y of [60, 120, 180]) bands(B, FIN, scaleR(TB.r, c, sc(y)), [y], 1.2, 0.3);
    for (let y = 8.5; y < 228; y += 8.5) if (y % 60 > 4) bands(B, FIN, scaleR(TB.r, c, sc(y)), [y], 0.4, 0.12);
    for (let k = 0; k < TB.r.length; k += 2){ const pts = ys.concat([242, 255, 268]).map(y => { const p = scaleR(TB.r, c, sc(y))[k]; return [p[0], y, p[1]]; });
      for (let i = 0; i < pts.length - 1; i++){ const a = pts[i], b = pts[i + 1], col = k % 7 === 0 ? LINE : FIN;
        B.q(col, [a[0] - 0.3, a[1], a[2]], [a[0] + 0.3, a[1], a[2]], [b[0] + 0.3, b[1], b[2]], [b[0] - 0.3, b[1], b[2]]); B.q(col, [a[0], a[1], a[2] - 0.3], [a[0], a[1], a[2] + 0.3], [b[0], b[1], b[2] + 0.3], [b[0], b[1], b[2] - 0.3]); } }
    cylw(B, FIN, c[0], c[1], 1.4, 0.3, 276, 288.8, 8, FIN);
    ext(B, BASE, grow(TB.r, 0.4), -3, 0.6, BASE);
    redLight(B, c[0], 288.8, c[1], 0.35);
    B.flush(g); beacons(g, [c[0], 290, c[1]], [1, 0.18, 0.1], 14);
    return g;
  }};
SG_PLACES.push({type:'dgtba', lat:23.011877, lon:113.754965, rot:0});

// ================= Dongguan Administrative Center (City Hall) =================
// The four blocks of the administrative centre on their OSM footprints and OSM storey counts: the main building r19166415 (16 storeys,
// 50.6 m in the data = levels x 3.1 + 1) and the north / east / west buildings r19166414 / r19166412 / r19166413 (6 storeys, 19.6 m).
// Anchored on the government compound w619355200 (local frame of that area's centroid). After the target notes: symmetric, facing the
// square's axis, a colonnade round the base and a big flat roof slab over the main block; the cladding and the column rhythm are
// approximations. The three 2-storey link buildings inside the hull are rebuilt on their footprints.
const CH = D.ch;
LANDMARKS.dgcityhall = {zh:'东莞市行政办事中心', en:'Dongguan Administrative Center (City Hall)', cat:'new', r:234, h:54, lt:{m:1, c:'#fff0d8', k:0.65},
  build(){
    const g = new THREE.Group(), B = Bt();
    const WIN = {c:'#c9c4b8', m:1, fh:3.1, cw:2.6}, STONE = {c:'#ddd7ca', m:0, lk:0.35}, ROOF = '#9b9c98', SLAB = {c:'#e6e2d8', m:0, lk:0.45},
      SOFF = {c:'#ece6da', glow:'#ffe6bc', gk:0.5}, COL = {c:'#f0ece2', m:0, lk:0.5}, GLASS = {c:'#4f5e66', glow:'#ffe0ae', gk:0.6}, PLZ = '#bfb8ab';
    const M = CH.main.r;
    // main block: lit windows on 16 storeys, stone fins, a glazed lobby storey recessed behind the colonnade
    ext(B, GLASS, grow(M, -1.5), 0, 9.3, null);
    ext(B, WIN, M, 9.3, 50.6, ROOF); ext(B, STONE, M, -3, 0.4, STONE);
    mullions(B, STONE, M, 4.2, 0.7, 0.6, 9.3, 50.6, true);
    bands(B, STONE, M, [9.6, 31.3], 0.8, 0.4);
    colonnade(B, COL, grow(M, 3.5), 7.5, 1.2, 0.4, 13.4);
    ext(B, SLAB, grow(M, 5), 13.4, 14.6, ROOF, SOFF);
    // the big flat roof slab with deep overhangs, on slender posts
    ext(B, SLAB, grow(M, 7), 53.2, 54.4, ROOF, SOFF);
    colonnade(B, COL, grow(M, 6), 9, 0.7, 50.6, 53.2);
    // the three 6-storey buildings
    for (const k of ['n', 'e', 'w']){ const R = CH[k].r;
      ext(B, WIN, R, -3, 19.6, ROOF); mullions(B, STONE, R, 4.2, 0.5, 0.5, 3.6, 19.6, true);
      bands(B, STONE, R, [3.6, 19.4], 0.8, 0.3); ext(B, SLAB, grow(R, 1.5), 19.6, 20.6, ROOF, SOFF); }
    // the 2-storey links between the blocks (OSM w1389046914 / 15 / 18, 2 storeys, 6.8 m in the data)
    for (const L of CH.links){ ext(B, {c:'#8fa3ae', m:1, fh:3.2, cw:2.6}, L.r, -3, 6.8, ROOF); bands(B, STONE, L.r, [6.5], 0.6, 0.25); }
    // forecourt toward the square (south of the main block)
    const F = [[-46.7, 16.5], [37.0, 38.0], [33, 60], [-50, 39]];
    ext(B, PLZ, F, -2, 0.3, PLZ);
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'dgcityhall', lat:23.023436, lon:113.746648, rot:0});

// ================= Dongguan Central Square (site) =================
// The north part of the central square (OSM park w520278681, 中心广场北区) between the city hall and the cultural buildings: the
// lawns, woods and water basins of the OSM map painted / planted in place, lamps along the paths, fountain jets in the basins
// (positions = the OSM basins; the jets are schematic), and the Conference Building (会议大厦, w520278683) rebuilt on its footprint at
// the data's estimated 15 m. The Exhibition Hall inside the square is its own key (dgexhibition).
const SQ = D.sq;
Object.assign(SITES, {dgsquare:{zh:'东莞中心广场', en:'Dongguan Central Square', lat:SQ.lat, lon:SQ.lon, r:388, keep:SQ.keep, keepRoads:[11, 12], h:15,
  lt:{m:0, c:'#ffe6c0', k:0.45}, build(ctx){
  const g = new THREE.Group(), B = Bt(), gy = ctx.gy, rng = ctx.rng;
  ctx.paint(SQ.keep, [196, 192, 182]);
  const wood = [], water = [];
  for (const a of SQ.areas){ if (a.k === 'grass') ctx.paint(a.r, [112, 150, 84]); else if (a.k === 'wood'){ ctx.paint(a.r, [96, 132, 76]); wood.push(a.r); } else { ctx.paint(a.r, [82, 128, 150]); water.push(a.r); } }
  for (const p of SQ.paths) ctx.line(p.p, p.c === 12 ? 4 : 6, [206, 200, 188]);
  const exh = SQ.b.find(b => b.id === 'w520278682').r, conf = SQ.b.find(b => b.id === 'w520278683').r;
  const avoid = (x, z) => pip(grow(exh, 6), x, z) || pip(grow(conf, 6), x, z) || water.some(W => pip(W, x, z));
  // trees in the woods
  let n = 0;
  for (const P of wood){ const bb = pbb(P), want = Math.min(80, Math.round(Math.abs(ringArea(P))/60)); let k = 0;
    for (let t = 0; t < want*4 && k < want && n < 600; t++){ const x = bb[0] + (bb[2] - bb[0])*rng(), z = bb[1] + (bb[3] - bb[1])*rng(); if (!pip(P, x, z) || avoid(x, z)) continue; ctx.tree(x, z, 2.6 + rng()*1.6, rng() < 0.7 ? 'd' : 'raintree'); k++; n++; } }
  // basins: a low granite rim, a row of fountain jets (lit at night)
  const RIM = {c:'#cfc9bd', m:0, lk:0.4}, JET = {c:'#e8f2f8', glow:'#d8eeff', gk:1.1};
  for (const W of water){ let lo = 1e9; for (const p of W) lo = Math.min(lo, gy(p[0], p[1]));
    const G = grow(W, 0.6), n2 = W.length; for (let i = 0; i < n2; i++){ const a = W[i], b = G[i], c2 = G[(i + 1)%n2], d2 = W[(i + 1)%n2];
      B.q(RIM, [a[0], lo + 0.5, a[1]], [d2[0], lo + 0.5, d2[1]], [c2[0], lo + 0.5, c2[1]], [b[0], lo + 0.5, b[1]]); }
    ext(B, RIM, G, lo - 0.5, lo + 0.5, null);
    const c = centroid(W), A = Math.abs(ringArea(W)); if (A > 300){ const m = Math.min(7, Math.round(A/500)); for (let j = 0; j < m; j++){ const f = (j + 0.5)/m - 0.5, bb = pbb(W), x = c[0] + f*(bb[2] - bb[0])*0.6, z = c[1];
      if (!pip(W, x, z)) continue; cylw(B, JET, x, z, 0.5, 0.08, lo + 0.2, lo + 3.5 + 2*rng(), 6, null); } } }
  // Conference Building (data height 15 m, estimated)
  { let lo = 1e9; for (const p of conf) lo = Math.min(lo, gy(p[0], p[1]));
    const WIN = {c:'#cfc8ba', m:1, fh:4.2, cw:3.0}, ST = {c:'#ded8cb', m:0, lk:0.35};
    ext(B, WIN, conf, lo - 1.5, lo + 15, '#9b9c98'); mullions(B, ST, conf, 6, 0.6, 0.8, lo, lo + 15, true); bands(B, ST, conf, [lo + 14.6], 0.8, 0.4); }
  // lamps along the paths
  let nl = 0;
  for (const p of SQ.paths){ const P = p.p; let acc = 18;
    for (let i = 1; i < P.length && nl < 140; i++){ const a = P[i - 1], b = P[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); let t = acc;
      while (t < L && nl < 140){ const x = a[0] + (b[0] - a[0])*t/L + 2.5*(b[1] - a[1])/L, z = a[1] + (b[1] - a[1])*t/L - 2.5*(b[0] - a[0])/L;
        if (!avoid(x, z)){ const y = gy(x, z); obox(B, '#4a4f53', x, z, 1, 0, 0.22, 0.22, y - 0.4, y + 4.5, true); abox(B, {c:'#f4ecd8', glow:'#ffe3ae', gk:1.6}, x - 0.3, x + 0.3, y + 4.5, y + 4.9, z - 0.3, z + 0.3); ctx.lamp(x, y + 4.7, z, [255, 214, 160]); nl++; }
        t += 36; }
      acc = t - L; } }
  B.flush(g); return g; }}});

// ================= Yulan Grand Theatre =================
// On its OSM footprint w520281241 (a 125 x 145 m rounded plan with two notches). After the target notes: a shell-like roof over the
// glass foyer (the name is the yulan, the city flower). The data height (10 m) is a class default, not the building's: the shell
// rising to ~34 m and the stage tower inside are estimates; the petal ribs of the shell are an approximation.
const YL = D.yulan;
LANDMARKS.dgyulan = {zh:'玉兰大剧院', en:'Yulan Grand Theatre', cat:'new', r:86, h:36, lt:{m:1, c:'#ffe8c8', k:0.65},
  build(){
    const g = new THREE.Group(), B = Bt(), R = YL.r, c = centroid(R);
    const GLF = {c:'#7b93a1', m:1, fh:4.5, cw:3.0}, MUL = {c:'#dcdfdd', m:0, lk:0.4}, SHELL = {c:'#e9e6df', m:0, lk:0.55, lc:'#fff1dc'},
      RIB = {c:'#f4f2ec', glow:'#fff0d6', gk:0.45}, ROOF = '#a4a7a5', PLZ = '#c2bbae', STONE = {c:'#d8d2c4', m:0, lk:0.35};
    // the glazed foyer ring all round, stone base
    ext(B, STONE, grow(R, 0.4), -3, 0.5, STONE);
    ext(B, GLF, R, 0.5, 11, null); mullions(B, MUL, R, 4.5, 0.4, 0.35, 0.5, 11, true);
    // the shell: a dome lofted over the plan from the eave (11 m) to ~34 m, with radial ribs (petals)
    const hs = [11, 17, 23, 28, 31.5, 33.6], fs = [1.02, 0.93, 0.78, 0.58, 0.36, 0.12];
    const ring = (i) => scaleR(R, c, fs[i]).map(p => [p[0], hs[i], p[1]]);
    loft(B, SHELL, hs.map((h, i) => ring(i)), true);
    for (let k = 0; k < R.length; k += 3){ for (let i = 0; i < hs.length - 1; i++){ const a = ring(i)[k], b = ring(i + 1)[k];
      B.q(RIB, [a[0] - 0.5, a[1] + 0.3, a[2]], [a[0] + 0.5, a[1] + 0.3, a[2]], [b[0] + 0.5, b[1] + 0.3, b[2]], [b[0] - 0.5, b[1] + 0.3, b[2]]);
      B.q(RIB, [a[0], a[1] + 0.3, a[2] - 0.5], [a[0], a[1] + 0.3, a[2] + 0.5], [b[0], b[1] + 0.3, b[2] + 0.5], [b[0], b[1] + 0.3, b[2] - 0.5]); } }
    // the eave lip over the foyer
    ext(B, RIB, grow(R, 2.5), 10.6, 11.6, null, SHELL);
    // stage tower block rising through the shell's back (north) (estimate)
    abox(B, STONE, c[0] - 16, c[0] + 16, 11, 36, c[1] - 46, c[1] - 18); cap(B, ROOF, [[c[0] - 16, c[1] - 46], [c[0] + 16, c[1] - 46], [c[0] + 16, c[1] - 18], [c[0] - 16, c[1] - 18]], 36.05);
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'dgyulan', lat:23.016749, lon:113.74271, rot:0});

// ================= Dongguan Library =================
// On its OSM footprint w520281240 (a 129 x 94 m rectangle on the square's axis). After the target notes: a glass-and-stone block with
// a big atrium. The data height (10 m) is a class default: the 24 m body and the raised atrium roof are estimates.
const LB = D.library;
LANDMARKS.dglibrary = {zh:'东莞图书馆', en:'Dongguan Library', cat:'new', r:83, h:28, lt:{m:1, c:'#fff2dc', k:0.7},
  build(){
    const g = new THREE.Group(), B = Bt(), R = LB.r, F = rframe(R);
    const GLF = {c:'#7d95a3', m:1, fh:4.8, cw:3.2}, STONE = {c:'#d9d3c6', m:0, lk:0.4}, ROOF = '#9fa2a0', SKY = {c:'#bcd0dc', m:0, glow:'#ffeccc', gk:0.7}, MUL = {c:'#dcdfdd', m:0, lk:0.4};
    ext(B, GLF, R, -3, 24, ROOF); mullions(B, MUL, R, 3.2, 0.35, 0.3, 0.5, 24, false);
    // stone frame: corner piers, the parapet and a deep stone band at the second-floor line
    for (const [s, t] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]){ const p = fP(F, s*(F.L/2 - 5), t*(F.W/2 - 5)); obox(B, STONE, p[0], p[1], F.u[0], F.u[1], 10.4, 10.4, -3, 24.6); }
    bands(B, STONE, R, [9.8, 23.4], 1.6, 0.35);
    // the atrium: a raised glazed roof lantern over the centre
    const A = [fP(F, -F.L*0.28, -F.W*0.2), fP(F, F.L*0.28, -F.W*0.2), fP(F, F.L*0.28, F.W*0.2), fP(F, -F.L*0.28, F.W*0.2)];
    ext(B, SKY, A, 24, 28, SKY); mullions(B, MUL, A, 4, 0.3, 0.3, 24, 28, true);
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'dglibrary', lat:23.016116, lon:113.746731, rot:0});

// ================= Keyuan Garden (site) =================
// One of the four great Lingnan gardens, built in 1850 by Zhang Jingxiu (targets.json). The park w619355190 with its OSM ponds; the
// garden's building cluster mapped as w945753534 (3 storeys in OSM, 10.3 m) rebuilt as grey-brick Lingnan halls under grey-tiled
// roofs, with the look-out pavilion (Ke Lou) as a taller square tower; which part of the footprint the tower stands on, and the
// roof forms, are approximations. The Lingnan Art Museum w520511683 is rebuilt on its footprint at the data's estimated 15 m.
const KY = D.ky;
Object.assign(SITES, {dgkeyuan:{zh:'可园', en:'Keyuan Garden', lat:KY.lat, lon:KY.lon, r:219, keep:KY.keep, keepRoads:[11, 12], h:16,
  lt:{m:0, c:'#ffd8a8', k:0.5, anim:'breathe'}, build(ctx){
  const g = new THREE.Group(), B = Bt(), gy = ctx.gy, rng = ctx.rng;
  const BRICK = {c:'#8e8c86', m:0, lk:0.45}, TILE = '#55575a', RIDGE = '#3f4346', TIMB = {c:'#6e3b2a', m:0, lk:0.4}, LANT = {c:'#c8321e', glow:'#ff7a3a', gk:1.3}, STONE = {c:'#cbc5b8', m:0, lk:0.35};
  const water = [];
  for (const a of KY.areas){ if (a.k === 'water'){ ctx.paint(a.r, [86, 124, 118]); water.push(a.r); } }
  const kb = KY.b.find(b => b.id === 'w945753534'), am = KY.b.find(b => b.id === 'w520511683');
  if (kb){ const R = kb.r; let lo = 1e9, hi = -1e9; for (const p of R){ const y = gy(p[0], p[1]); lo = Math.min(lo, y); hi = Math.max(hi, y); }
    ext(B, STONE, grow(R, 0.3), lo - 1, hi + 0.4, STONE);
    ext(B, BRICK, R, hi + 0.4, hi + 6.4, null);
    // roofs: an overhanging tiled eave band and a raised ridge mass over a shrunk plan
    ext(B, TILE, grow(R, 0.9), hi + 6.4, hi + 6.9, TILE, TILE);
    const S = grow(R, -1.6); ext(B, TILE, S, hi + 6.9, hi + 8.3, RIDGE);
    // red timber doors and lanterns at intervals along the walls
    const n = R.length, o = ringArea(R) > 0 ? 1 : -1;
    for (let i = 0; i < n; i += 3){ const a = R[i], b = R[(i + 1)%n], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 6) continue;
      const ux = (b[0] - a[0])/L, uz = (b[1] - a[1])/L, nx = o*uz, nz = -o*ux, mx = (a[0] + b[0])/2, mz = (a[1] + b[1])/2;
      obox(B, TIMB, mx + nx*0.15, mz + nz*0.15, ux, uz, 2.2, 0.3, hi + 0.4, hi + 3.4, true);
      cylw(B, LANT, mx + nx*0.9 + ux*1.8, mz + nz*0.9 + uz*1.8, 0.3, 0.3, hi + 3.2, hi + 3.9, 8, null); ctx.lamp(mx + nx*1.2, hi + 3.6, mz + nz*1.2, [255, 180, 110]); }
    // the look-out pavilion: a square grey-brick tower on the east arm (position approximate), body to the data height 10.3 m, hip roof
    const tx = 88, tz = -33, tu = [0.917, -0.398];
    obox(B, BRICK, tx, tz, tu[0], tu[1], 8, 8, hi + 0.4, hi + 10.3);
    for (const y of [hi + 3.6, hi + 7.0]) obox(B, TILE, tx, tz, tu[0], tu[1], 9.6, 9.6, y, y + 0.35);
    hipRoofR(B, TILE, tx, tz, tu[0], tu[1], 9.8, 9.8, hi + 10.3, hi + 12.6);
    obox(B, RIDGE, tx, tz, tu[0], tu[1], 0.8, 0.8, hi + 12.4, hi + 13.2);
    for (const [s, t] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) obox(B, TIMB, tx + tu[0]*s*4.05 - tu[1]*t*4.05, tz + tu[1]*s*4.05 + tu[0]*t*4.05, s ? -tu[1] : tu[0], s ? tu[0] : tu[1], 1.6, 0.25, hi + 7.6, hi + 9.4, true);
    ctx.lamp(tx, hi + 11, tz, [255, 196, 130]); }
  if (am){ const R = am.r; let lo = 1e9; for (const p of R) lo = Math.min(lo, gy(p[0], p[1]));
    ext(B, {c:'#c9c3b6', m:1, fh:4.5, cw:3.2}, R, lo - 1, lo + 15, '#8f918f'); bands(B, STONE, R, [lo + 14.6], 0.8, 0.4); ext(B, TILE, grow(R, 0.8), lo + 15, lo + 15.6, TILE); }
  // trees in the garden (avoiding water and buildings), lanterns along the pond edges
  const avoid = (x, z) => water.some(W => pip(grow(W, 1.5), x, z)) || (kb && pip(grow(kb.r, 4), x, z)) || (am && pip(grow(am.r, 4), x, z));
  const bb = pbb(KY.keep); let n = 0;
  for (let t = 0; t < 900 && n < 160; t++){ const x = bb[0] + (bb[2] - bb[0])*rng(), z = bb[1] + (bb[3] - bb[1])*rng(); if (!pip(grow(KY.keep, -4), x, z) || avoid(x, z)) continue; ctx.tree(x, z, 2.2 + rng()*1.6, rng() < 0.75 ? 'd' : 'palm'); n++; }
  for (const W of water){ for (let i = 0; i < W.length; i += 2){ const [x, z] = grow(W, 1.2)[i], y = gy(x, z); obox(B, STONE, x, z, 1, 0, 0.5, 0.5, y - 0.3, y + 1.0, true); cylw(B, LANT, x, z, 0.28, 0.28, y + 1.0, y + 1.6, 6, null); } }
  B.flush(g); return g; }}});

// ================= Ying'en Gate =================
// The surviving west gate of the old walled city (Ming), on its OSM footprint w520439670 (22 x 35 m, turned). A brick-and-stone gate
// base with the arched passage through it and a tiled gate tower on top; the total height is the data's 10.3 m (an estimate from
// the mapped storeys); the split between base and tower and the roof form are approximations.
const YE = D.yingen;
LANDMARKS.dgyingen = {zh:'迎恩门城楼', en:"Ying'en Gate", cat:'old', r:30, h:10.3, lt:{m:0, c:'#ffd8a8', k:0.6, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = Bt(), F = rframe(YE.r);
    const BRICK = {c:'#8d8a82', m:0, lk:0.45}, STONE = {c:'#bdb6a8', m:0, lk:0.4}, RED_W = {c:'#9a3a28', m:0, lk:0.4}, TILE = '#4f5254', RIDGE = '#3c3f41', DARK = '#26282a', COLR = {c:'#8a2e20', m:0, lk:0.4};
    const [ux, uz] = F.u, vx = -uz, vz = ux, cx = F.c[0], cz = F.c[1];
    // the gate base (wall along the long axis), stone footing, crenellated parapet
    obox(B, STONE, cx, cz, ux, uz, F.L, F.W, -3, 0.8);
    obox(B, BRICK, cx, cz, ux, uz, F.L - 0.4, F.W - 0.4, 0.8, 5.6);
    for (let s = -F.L/2 + 1; s <= F.L/2 - 1; s += 2.2) for (const t of [-1, 1]){ const x = cx + ux*s + vx*t*(F.W/2 - 0.6), z = cz + uz*s + vz*t*(F.W/2 - 0.6); obox(B, BRICK, x, z, ux, uz, 1.2, 0.8, 5.6, 6.4, true); }
    // the arched passage through the base (dark arch faces on both sides)
    for (const t of [-1, 1]){ const ox = cx + vx*t*(F.W/2 - 0.15), oz = cz + vz*t*(F.W/2 - 0.15), P = (s, y) => [ox + ux*s, y, oz + uz*s], n = 8, r = 2.3;
      const pts = [P(-r, 0.8)]; for (let k = 0; k <= n; k++){ const a = PI - k/n*PI; pts.push(P(Math.cos(a)*r, 3.0 + Math.sin(a)*r)); } pts.push(P(r, 0.8));
      const c0 = P(0, 1.8); for (let k = 0; k < pts.length - 1; k++) B.t(DARK, pts[k], pts[k + 1], c0); B.t(DARK, pts[pts.length - 1], pts[0], c0); }
    // the gate tower: red walls and columns, one storey, hip roof with upturned ridge ends up to 10.3 m
    const TL = F.L*0.62, TW = F.W*0.55;
    obox(B, STONE, cx, cz, ux, uz, TL + 1.2, TW + 1.2, 5.6, 6.0);
    obox(B, RED_W, cx, cz, ux, uz, TL - 1.2, TW - 1.2, 6.0, 8.2);
    for (let s = -TL/2; s <= TL/2 + 0.01; s += TL/5) for (const t of [-1, 1]) obox(B, COLR, cx + ux*s + vx*t*TW/2, cz + uz*s + vz*t*TW/2, ux, uz, 0.45, 0.45, 6.0, 8.2, true);
    hipRoofR(B, TILE, cx, cz, ux, uz, TL + 2.6, TW + 2.6, 8.2, 10.0);
    obox(B, RIDGE, cx, cz, ux, uz, Math.max(1, TL + 2.6 - TW - 2.6), 0.6, 9.9, 10.3);
    for (const s of [-1, 1]){ const r = (TL - TW)/2; obox(B, RIDGE, cx + ux*s*r, cz + uz*s*r, ux, uz, 0.7, 0.7, 9.9, 10.3 + 0.3); }
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'dgyingen', lat:23.044825, lon:113.745342, rot:0});

// ================= Dongguan Exhibition Hall =================
// On its OSM footprint w520278682 (a 98 m square on the central square, turned with the axis) at the data's 15 m (estimate). Form
// approximate: a stone podium, a glazed hall under a deep flat roof slab, an entrance canopy toward the axis.
const EX = D.exhibition;
LANDMARKS.dgexhibition = {zh:'东莞市展览馆', en:'Dongguan Exhibition Hall', cat:'new', r:71, h:16.5, lt:{m:1, c:'#fff0d8', k:0.6},
  build(){
    const g = new THREE.Group(), B = Bt(), R = EX.r;
    const GLF = {c:'#7f97a5', m:1, fh:5.0, cw:3.4}, STONE = {c:'#d6d0c3', m:0, lk:0.4}, SLAB = {c:'#e4e0d6', m:0, lk:0.45}, SOFF = {c:'#ece6da', glow:'#ffe6bc', gk:0.5}, ROOF = '#9b9d9b';
    ext(B, STONE, grow(R, 1.5), -3, 1.2, STONE);
    ext(B, GLF, grow(R, -2), 1.2, 15, null); mullions(B, STONE, grow(R, -2), 6, 0.8, 0.9, 1.2, 15, true);
    ext(B, SLAB, grow(R, 1.0), 15, 16.5, ROOF, SOFF);
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'dgexhibition', lat:23.019177, lon:113.743531, rot:0});

// ================= Qifeng Park (site) =================
// The hill park on Huangqi Shan (OSM park w520436667): the giant red lantern on the summit is mapped as w1539774065 (山顶灯笼, 71 m2,
// next to the 黄旗山 peak node): a red lantern on a stone plinth on that footprint, total height the data's 12 m (estimate). The three
// mapped shelters (青紫亭, 留靴亭, 廉泉亭) get small pavilions at their nodes (form schematic); the two unnamed buildings the site
// hides are rebuilt on their footprints at the data's 12 m (estimate); lamps along the mapped footpaths.
const QF = D.qf;
Object.assign(SITES, {dgqifeng:{zh:'旗峰公园', en:'Qifeng Park (Huangqi Hill)', lat:QF.lat, lon:QF.lon, r:997, keep:QF.keep, keepRoads:[11, 12], h:14,
  lt:{m:0, c:'#ff9a6a', k:0.6, anim:'breathe'}, build(ctx){
  const g = new THREE.Group(), B = Bt(), gy = ctx.gy;
  const LRED = {c:'#c4261a', glow:'#ff4a24', gk:1.5}, GOLD = {c:'#c9a24a', m:0, lk:0.6, glow:'#ffcc66', gk:0.6}, STONE = {c:'#bdb6a8', m:0, lk:0.4}, TILE = '#4f5254', COLR = {c:'#8a2e20', m:0, lk:0.4};
  const lan = QF.b.find(b => b.zh === '山顶灯笼');
  if (lan){ const R = lan.r, c = centroid(R); let lo = 1e9, hi = -1e9; for (const p of R){ const y = gy(p[0], p[1]); lo = Math.min(lo, y); hi = Math.max(hi, y); }
    let rad = 0; for (const p of R) rad = Math.max(rad, Math.hypot(p[0] - c[0], p[1] - c[1]));
    ext(B, STONE, R, lo - 2, hi + 1.2, STONE);
    const y0 = hi + 1.2, Rl = rad*0.92;
    // the lantern body: an oval of red ribs from 1.2 m to 10.6 m, gold caps and finial to 12 m
    const prof = []; for (let k = 0; k <= 10; k++){ const a = -PI/2 + k/10*PI; prof.push([Math.cos(a)*Rl, y0 + 1.6 + (Math.sin(a) + 1)/2*7.8]); }
    for (let k = 0; k < prof.length - 1; k++){ const [r0, h0] = prof[k], [r1, h1] = prof[k + 1]; cylw(B, LRED, c[0], c[1], Math.max(r0, Rl*0.45), Math.max(r1, Rl*0.45), h0, h1, 16, null); }
    cylw(B, GOLD, c[0], c[1], Rl*0.5, Rl*0.5, y0, y0 + 1.6, 16, GOLD);
    cylw(B, GOLD, c[0], c[1], Rl*0.5, Rl*0.5, y0 + 9.4, y0 + 10.2, 16, GOLD);
    cylw(B, GOLD, c[0], c[1], 0.5, 0.1, y0 + 10.2, hi + 12, 6, null);
    for (let k = 0; k < 8; k++){ const a = k/8*TAU; for (let j = 0; j < prof.length - 1; j++){ const [r0, h0] = prof[j], [r1, h1] = prof[j + 1];
      const p0 = [c[0] + Math.cos(a)*(Math.max(r0, Rl*0.45) + 0.1), h0, c[1] + Math.sin(a)*(Math.max(r0, Rl*0.45) + 0.1)], p1 = [c[0] + Math.cos(a)*(Math.max(r1, Rl*0.45) + 0.1), h1, c[1] + Math.sin(a)*(Math.max(r1, Rl*0.45) + 0.1)];
      B.q(GOLD, [p0[0] - 0.15*Math.sin(a), p0[1], p0[2] + 0.15*Math.cos(a)], [p0[0] + 0.15*Math.sin(a), p0[1], p0[2] - 0.15*Math.cos(a)], [p1[0] + 0.15*Math.sin(a), p1[1], p1[2] - 0.15*Math.cos(a)], [p1[0] - 0.15*Math.sin(a), p1[1], p1[2] + 0.15*Math.cos(a)]); } }
    for (let k = 0; k < 4; k++){ const a = k/4*TAU + PI/4; ctx.lamp(c[0] + Math.cos(a)*(rad + 3), hi + 1, c[1] + Math.sin(a)*(rad + 3), [255, 120, 80]); } }
  // pavilions at the shelter nodes: hexagonal, red columns, tiled roof (schematic)
  for (const p of QF.pois){ if (p.t !== 'shelter') continue; const [x, z] = p.at, y = gy(x, z);
    cylw(B, STONE, x, z, 3.6, 3.6, y - 1.5, y + 0.6, 6, STONE);
    for (let k = 0; k < 6; k++){ const a = k/6*TAU; obox(B, COLR, x + Math.cos(a)*2.9, z + Math.sin(a)*2.9, 1, 0, 0.35, 0.35, y + 0.6, y + 3.6, true); }
    cylw(B, TILE, x, z, 4.2, 0.3, y + 3.6, y + 5.6, 6, null); cylw(B, TILE, x, z, 4.2, 4.2, y + 3.4, y + 3.6, 6, null);
    obox(B, TILE, x, z, 1, 0, 0.5, 0.5, y + 5.4, y + 6.3, true); ctx.lamp(x, y + 3, z, [255, 196, 130]); }
  // the other buildings in the park (data height 12 m, estimated)
  for (const b of QF.b){ if (b === lan) continue; const R = b.r; let lo = 1e9; for (const p of R) lo = Math.min(lo, gy(p[0], p[1]));
    ext(B, {c:'#cbc4b6', m:1, fh:3.6, cw:3.0}, R, lo - 1.5, lo + 12, '#8f918f'); ext(B, TILE, grow(R, 0.6), lo + 12, lo + 12.5, TILE); }
  // lamps along the footpaths (every ~60 m)
  let nl = 0;
  for (const p of QF.paths){ if (p.c !== 12) continue; const P = p.p; let acc = 30;
    for (let i = 1; i < P.length && nl < 160; i++){ const a = P[i - 1], b = P[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); let t = acc;
      while (t < L && nl < 160){ const x = a[0] + (b[0] - a[0])*t/L + 1.8*(b[1] - a[1])/L, z = a[1] + (b[1] - a[1])*t/L - 1.8*(b[0] - a[0])/L, y = gy(x, z);
        obox(B, '#4a4f53', x, z, 1, 0, 0.18, 0.18, y - 0.4, y + 3.2, true); abox(B, {c:'#f4ecd8', glow:'#ffe3ae', gk:1.5}, x - 0.25, x + 0.25, y + 3.2, y + 3.6, z - 0.25, z + 0.25); ctx.lamp(x, y + 3.4, z, [255, 214, 160]); nl++; t += 60; }
      acc = t - L; } }
  B.flush(g); return g; }}});
