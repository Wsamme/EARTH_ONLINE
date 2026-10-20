// ===== bay/ggb — the Golden Gate Bridge (1937) and Fort Point (1861) for the City Brush San Francisco Bay Area map (v22).
// Keys:
//   ggbridge  the whole bridge: two Art Deco towers (227 m above the water, stepped cellular legs, four portal struts
//             above the deck, X-bracing below), the south tower's elliptical fender, main cables (0.92 m, 27.4 m apart,
//             saddles, cable bands), suspenders every 15.24 m, the 7.6 m stiffening trusses with floor beams and bracing,
//             sidewalks, the outer railing, roadway lamp standards, the concrete pylons S1/S2/N1/N2, both anchorages with
//             their cable housings, the two-hinged steel arch over Fort Point (97 m) with its spandrel posts, the Marin
//             approach (five 53.4 m deck-truss spans on four-legged steel towers, plate girders to Vista Point) and the
//             San Francisco approach (deck trusses / plate girders on steel bents, curving east to the toll plaza)
//   fortpoint the three-tier brick fort under the arch: casemates, barbette tier, courtyard, the 1864 lighthouse
// The road deck itself is the app's (the two one-way freeway ribbons of OSM "Golden Gate Bridge"); everything here is
// built round it: the truss tops sit just under the app's road surface (67.18 m above the water on the suspended spans).
// Frame of all bridge keys: t = metres along the towers' centre line from mid-span (+ toward San Francisco = south),
// lat = metres across (+ east). Local x = lat, local z = t - t0 (t0 = the key's station on the axis), y = metres above
// the sea: build() reads the base height the app picked (LMCTX.u.base) and shifts the model down by it, so every part
// sits at its absolute height whatever r is (and the floodlight gradient runs from the water to the tower tops).
{
const PI = Math.PI, TAU = PI*2;
// ---------- the bridge axis in world metres (sgXY: x = (lon + 122.19)*88300, y = (lat - 37.625)*110989)
const MX = -25480.09, MY = 21616.056;                 // mid-span (half way between the tower centres)
const UX = 0.0926198, UY = -0.9957016;                // +t (toward the San Francisco tower)
const VX = 0.9957016, VY = 0.0926198;                 // +lat (east)
// the app's terrain round the bridge (its 90 m grid, metres; ground = max(-0.3, bilinear)): footings reach the real ground
const GI0 = 112, GJ0 = 624, GNI = 11, GNJ = 35, GH = [-23,-18.3,-14.9,-10.3,-0.3,-0.3,-0.3,54.9,55.1,52.1,46.8,-24.8,-19.3,-15.3,-11,-0.3,-0.3,-0.3,56.6,53.8,49.4,38.2,-27,-21.8,-16.7,-11.1,-0.3,-0.3,-0.3,52,-0.3,-0.3,-0.3,-28.6,-22.4,-17.3,-11.4,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-27.7,-22.6,-17.6,-12,-7.6,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-27.5,-23,-17.9,-12.8,-8.3,-0.3,-0.3,-0.3,-0.3,-10.2,-15.3,-27.4,-22.9,-17,-11.3,-9.3,-0.3,-0.3,-0.3,-0.3,-23.5,-27.3,-28.2,-22.7,-18.7,-13,-10.3,-7.5,-6.4,-7.7,-22.3,-36.1,-42.5,-31.8,-25.4,-22,-17.4,-0.3,-0.3,-0.3,-0.3,-38.7,-57.7,-56.3,-41,-33.6,-26.3,-22.8,-0.3,-0.3,-0.3,-0.3,-63.5,-74,-73,-48.6,-48.6,-39.1,-30.8,-0.3,-0.3,-0.3,-0.3,-81.1,-84.6,-82.8,-66.9,-66.6,-60.9,-58.9,-59.6,-62.4,-72.6,-84.2,-96.3,-95.4,-85.4,-81.6,-75.3,-74.5,-75.8,-79.2,-87.4,-96,-104.6,-108.5,-100.1,-89.7,-97.3,-94.7,-92.7,-94.4,-97.2,-100.2,-99.5,-108.2,-107.3,-101.8,-92.9,-101,-99,-97.7,-96.1,-94.7,-97,-101.6,-104.3,-106.7,-100.1,-94.1,-97.4,-94.7,-91.7,-89.4,-90,-94.7,-100.3,-105.5,-98.4,-98.2,-94.1,-96.6,-95,-93.5,-91.5,-90.3,-94.6,-98.9,-103.5,-93.8,-99.3,-98.7,-99.2,-96.1,-91.6,-90.7,-93.5,-95,-98.1,-101.2,-98.6,-102.1,-96,-79.1,-77.1,-72.5,-72.7,-81.6,-91.8,-96.2,-100.6,-99.5,-96.5,-92.3,-61.3,-57.1,-57.4,-55.3,-65.5,-83.2,-92.9,-88.5,-86,-87.5,-85.4,-42.9,-42.2,-42.8,-42,-49.5,-59.7,-60,-64.4,-84.8,-83.9,-83.9,-28.8,-30.1,-31.7,-34.1,-31.7,-37.4,-38.5,-62,-88.7,-87.7,-78.2,-21.7,-19.6,-20.6,-0.3,-0.3,-0.3,-0.3,-52.1,-78.8,-74.5,-80.7,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-33.8,-56,-66.5,-69,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-24.1,-54.5,-56.9,-53.6,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-28.2,-58,-62.7,-51.3,-0.3,127.8,141.8,95.6,-0.3,-0.3,-16.3,-35.4,-55.4,-61,-46.3,92.4,127.6,113.6,84.6,-0.3,-0.3,-0.3,-27.3,-50.2,-54.5,-36.3,128.3,124.2,87.7,52.8,-0.3,-0.3,-0.3,-25.4,-45.1,-46,-27.3,123.1,80.4,55.4,30.9,-0.3,-0.3,-0.3,-27.3,-34.7,-34.5,-20.9,97.4,70,47.6,25.4,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,100.4,69.7,49.6,43.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,102.4,82.3,75.3,76.3,75.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,87.3,77.2,69.1,67,48.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,80.5,45.4,31.7,23.2,13.2,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3];
const gnd = (t, l) => {
  const x = MX + t*UX + l*VX, y = MY + t*UY + l*VY;
  let fx = (x + 36000)/90 - GI0, fy = (y + 36000)/90 - GJ0;
  fx = Math.min(GNI - 1.0001, Math.max(0, fx)); fy = Math.min(GNJ - 1.0001, Math.max(0, fy));
  const i = fx | 0, j = fy | 0, u = fx - i, v = fy - j, k = j*GNI + i;
  return Math.max(-0.3, (GH[k]*(1 - u) + GH[k+1]*u)*(1 - v) + (GH[k+GNI]*(1 - u) + GH[k+GNI+1]*u)*v);
};
// ---------- the app's road surface (m above the sea) along the bridge; side -1 = the west ribbon (southbound), +1 = east
// (northbound), 0 = the middle. Suspended spans, arch and anchorages: level 67.18 (OSM elev 67.3 on the -0.3 m water
// ground + 0.18 surface offset). South approach: the OSM ramps of each ribbon. Marin side: level to the north approach,
// easing to the ground at Vista Point (see the report: the OSM ramp there follows a far too low smoothed DEM).
const DECK = 67.18;
const RS_W = [[1128.4,67.18],[1152.5,65.7],[1176.2,62.9],[1188,61.4],[1201.7,59.7],[1215.4,58],[1228.6,56.3],[1241.8,54.6],[1254.3,53],[1268.2,51.1],[1282.1,49.3],[1296,47.4],[1309.8,45.4]];
const RS_E = [[1171.6,67.18],[1183.4,66.2],[1197.1,64.5],[1210.8,62.8],[1224,61.1],[1237.2,59.4],[1249.7,57.8],[1262.8,56],[1275.9,54.2],[1289.4,52.3],[1302.9,50.4]];
function deckZ(t, side){
  if (t > 1100){
    if (!side) return Math.min(deckZ(t, -1), deckZ(t, 1));
    const T = side < 0 ? RS_W : RS_E; if (t <= T[0][0]) return DECK;
    for (let i = 1; i < T.length; i++) if (t <= T[i][0]){ const a = T[i-1], b = T[i]; return a[1] + (b[1] - a[1])*(t - a[0])/(b[0] - a[0]); }
    return T[T.length - 1][1];
  }
  if (t < -1340){ const tE = side < 0 ? -1405.6 : side > 0 ? -1406.9 : -1406.3, zE = side < 0 ? 66.24 : side > 0 ? 66.85 : 66.55;
    return DECK + (zE - DECK)*Math.min(1, (-1340 - t)/(-1340 - tE)); }
  return DECK;
}
// the OSM centre lines of the two ribbons on the approaches ([lat, t])
const LN_SW = [[-4.4,1103.6],[-4.4,1128.4],[-3.3,1152.5],[-0.1,1176.2],[2.1,1188],[5.8,1201.7],[9.7,1215.4],[14.5,1228.6],[19.4,1241.8],[25,1254.3],[32,1268.2],[38.8,1282.1],[46.7,1296],[54.6,1309.8]];
const LN_SE = [[4.4,1099.1],[4.4,1123.9],[5.6,1147.9],[8.6,1171.6],[10.9,1183.4],[14.7,1197.1],[18.4,1210.8],[23.3,1224],[28.2,1237.2],[33.9,1249.7],[40.9,1262.8],[47.9,1275.9],[56.1,1289.4],[64.4,1302.9]];
const LN_NW = [[-5,-1087.6],[-5,-1110],[-5,-1132.3],[-5.1,-1154.7],[-5.1,-1177.1],[-5.1,-1199.4],[-5.2,-1221.8],[-6.6,-1236.7],[-7.9,-1251.5],[-10.7,-1266.1],[-13.4,-1280.7],[-17.4,-1295.3],[-21.4,-1309.8],[-27.2,-1324.4],[-32.9,-1339],[-39.5,-1352.2],[-46,-1365.3],[-53.5,-1378.1],[-62.9,-1391.8],[-72.2,-1405.6]];
const LN_NE = [[4.2,-1087.6],[4.2,-1110.7],[4,-1133.9],[4,-1157],[3.8,-1180.1],[3.8,-1203.2],[3.6,-1226.3],[2.3,-1241.2],[0.9,-1256.1],[-1.5,-1270.5],[-4.9,-1285],[-8.2,-1299.5],[-12.6,-1314.3],[-18.4,-1328.9],[-24.2,-1343.5],[-30.7,-1356.7],[-37.2,-1369.8],[-48.9,-1388.4],[-60.7,-1406.9]];
// ---------- colours (few materials)
const OR = '#c0362c', ORD = '#8f2a22';      // International Orange; the same paint in the leg recesses / strut webs (shade)
const CON = {c:'#cdc5b3', lk:0.5}, CONW = {c:'#a9a294', lk:0.55}, CONP = {c:'#bbb3a2', lk:0.45};   // pylon / anchorage concrete, weathered pier and fender concrete (dimmer at night)
const WALK = '#8f8b85';
const RED = {c:'#a81010', glow:'#ff2a14', gk:2.6}, LAMPH = {c:'#efe0bd', glow:'#ffb050', gk:1.5};
// ---------- triangle batches (one LTris call per colour)
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const q4 = (o, a, b, c, d) => o.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2]);
const t3 = (o, a, b, c) => o.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
// axis-aligned box (x = lat, z = t); bottom face optional
function box(o, x0, x1, y0, y1, z0, z1, bot){
  const A = [x0, y0, z0], B_ = [x1, y0, z0], C = [x1, y0, z1], D = [x0, y0, z1], E = [x0, y1, z0], F = [x1, y1, z0], G = [x1, y1, z1], H = [x0, y1, z1];
  q4(o, E, H, G, F); q4(o, A, E, F, B_); q4(o, B_, F, G, C); q4(o, C, G, H, D); q4(o, D, H, E, A); if (bot) q4(o, A, B_, C, D);
}
// member between two points: half width w across (horizontal), half height h in the member's vertical plane
function beam(o, a, b, w, h, caps){
  let dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]; const L = Math.hypot(dx, dy, dz); if (L < 1e-4) return;
  dx /= L; dy /= L; dz /= L;
  let sx = -dz, sz = dx; const sl = Math.hypot(sx, sz); if (sl < 1e-3){ sx = 1; sz = 0; } else { sx /= sl; sz /= sl; }
  const ux = -sz*dy, uy = sz*dx - sx*dz, uz = sx*dy;
  const P = (p, i, j) => [p[0] + sx*w*i + ux*h*j, p[1] + uy*h*j, p[2] + sz*w*i + uz*h*j];
  const a1 = P(a, -1, -1), a2 = P(a, 1, -1), a3 = P(a, 1, 1), a4 = P(a, -1, 1), b1 = P(b, -1, -1), b2 = P(b, 1, -1), b3 = P(b, 1, 1), b4 = P(b, -1, 1);
  q4(o, a1, a2, b2, b1); q4(o, a2, a3, b3, b2); q4(o, a3, a4, b4, b3); q4(o, a4, a1, b1, b4);
  if (caps){ q4(o, a1, a4, a3, a2); q4(o, b1, b2, b3, b4); }
}
// vertical prism of a plan polygon ([x, z] points); y0 / y1 numbers or functions (x, z) => y; top cap (and bottom)
function prism(o, P, y0, y1, top, bot){
  const n = P.length, Y0 = P.map(p => typeof y0 === 'function' ? y0(p[0], p[1]) : y0), Y1 = P.map(p => typeof y1 === 'function' ? y1(p[0], p[1]) : y1);
  for (let i = 0; i < n; i++){ const j = (i + 1) % n, a = P[i], b = P[j]; q4(o, [a[0], Y0[i], a[1]], [b[0], Y0[j], b[1]], [b[0], Y1[j], b[1]], [a[0], Y1[i], a[1]]); }
  if (top === false && !bot) return;
  const tri = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
  for (const t of tri){
    if (top !== false) t3(o, [P[t[0]][0], Y1[t[0]], P[t[0]][1]], [P[t[1]][0], Y1[t[1]], P[t[1]][1]], [P[t[2]][0], Y1[t[2]], P[t[2]][1]]);
    if (bot) t3(o, [P[t[0]][0], Y0[t[0]], P[t[0]][1]], [P[t[2]][0], Y0[t[2]], P[t[2]][1]], [P[t[1]][0], Y0[t[1]], P[t[1]][1]]);
  }
}
// stepped cruciform section of a tower leg: half widths a[] across (decreasing), half lengths b[] along (increasing)
function crossP(a, b){
  const n = a.length, P = [[a[0], -b[0]], [a[0], b[0]]];
  for (let k = 1; k < n; k++) P.push([a[k], b[k-1]], [a[k], b[k]]);
  P.push([-a[n-1], b[n-1]]);
  for (let k = n - 1; k >= 1; k--) P.push([-a[k], b[k-1]], [-a[k-1], b[k-1]]);
  P.push([-a[0], -b[0]]);
  for (let k = 1; k < n; k++) P.push([-a[k], -b[k-1]], [-a[k], -b[k]]);
  P.push([a[n-1], -b[n-1]]);
  for (let k = n - 1; k >= 1; k--){ P.push([a[k], -b[k-1]]); if (k > 1) P.push([a[k-1], -b[k-1]]); }
  return P;
}
// smooth round tube along a polyline (cables): its own geometry with smooth normals
function tubeGeo(pts, r, n){
  const pos = [], nor = [], R = pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]; const L = Math.hypot(dx, dy, dz) || 1; dx /= L; dy /= L; dz /= L;
    let sx = -dz, sz = dx; const sl = Math.hypot(sx, sz) || 1; sx /= sl; sz /= sl;
    const ux = -sz*dy, uy = sz*dx - sx*dz, uz = sx*dy, ring = [];
    for (let k = 0; k < n; k++){ const th = k/n*TAU, c = Math.cos(th), s = Math.sin(th), nx = sx*c + ux*s, ny = uy*s, nz = sz*c + uz*s; ring.push([p[0] + nx*r, p[1] + ny*r, p[2] + nz*r, nx, ny, nz]); }
    return ring; });
  for (let i = 0; i < R.length - 1; i++) for (let k = 0; k < n; k++){
    const k2 = (k + 1) % n, v = [R[i][k], R[i][k2], R[i+1][k2], R[i][k], R[i+1][k2], R[i+1][k]];
    for (const p of v){ pos.push(p[0], p[1], p[2]); nor.push(p[3], p[4], p[5]); }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return geo;
}
// night sprites (the app's lamp texture; they follow the app's street-lamp fade)
function sprites(g, pts, rgb, size){
  if (!pts.length) return;
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const col = new Float32Array(pts.length); for (let i = 0; i < col.length; i += 3){ col[i] = rgb[0]; col[i+1] = rgb[1]; col[i+2] = rgb[2]; }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({size, map:typeof lampTex !== 'undefined' ? lampTex : null, vertexColors:true, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending, sizeAttenuation:true});
  const p = new THREE.Points(geo, mat); p.renderOrder = 6;
  p.onBeforeRender = () => { mat.opacity = typeof matLamp !== 'undefined' ? Math.min(1, matLamp.opacity*1.1) : (NIGHT.uNight.value > 0.5 ? 1 : 0); };
  g.add(p);
}
// a key's frame: the model is built in absolute (lat, height above the sea, t); the inner group undoes the base height
function frame(t0, l0, keepLight){
  const g = new THREE.Group(), s = new THREE.Group(), u = (typeof LMCTX !== 'undefined' && LMCTX && LMCTX.u) ? LMCTX.u : null;
  s.position.set(-(l0 || 0), u && u.base ? -u.base.value : 0, -t0); g.add(s);
  if (u && u.base && !keepLight){ u.base.value = -2; u.top.value = 228; }      // floodlight gradient: from the water up to the tower tops
  return [g, s];
}
// polyline path in plan ([x = lat, z = t]); at(d) -> point and unit tangent; nrm -> unit normal pointing east (+lat)
function mkPath(pts){
  const S = [0]; for (let i = 1; i < pts.length; i++) S.push(S[i-1] + Math.hypot(pts[i][0] - pts[i-1][0], pts[i][1] - pts[i-1][1]));
  const L = S[S.length - 1];
  const at = d => { d = Math.max(0, Math.min(L, d)); let lo = 1, hi = S.length - 1; while (lo < hi){ const m = (lo + hi) >> 1; if (S[m] < d) lo = m + 1; else hi = m; }
    const a = pts[lo-1], b = pts[lo], f = (d - S[lo-1])/((S[lo] - S[lo-1]) || 1), dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1;
    let nx = dz/l, nz = -dx/l; if (nx < 0){ nx = -nx; nz = -nz; }
    return {x:a[0] + dx*f, z:a[1] + dz*f, tx:dx/l, tz:dz/l, nx, nz}; };
  return {L, at};
}
// mid line of two ribbons (resampled at equal arc fractions)
function midLine(A, Bl, n){ const PA = mkPath(A), PB = mkPath(Bl), out = []; for (let k = 0; k <= n; k++){ const a = PA.at(PA.L*k/n), b = PB.at(PB.L*k/n); out.push([(a.x + b.x)/2, (a.z + b.z)/2]); } return out; }

// ================= bridge parts =================
const TW = 640.25, LEG = 13.8, CAB = 13.7;            // tower centres (t), leg centre and cable planes (lat)
const YS = 220.5, YM = 69.2, YP = 80.5, FS = 10.5;    // cable centre at the saddles, at mid-span, at pylons S1/N1; side-span sag
const TS1 = 981.4, TN1 = -985.0, TSE = 1112, YSE = 68.8, TNE = -1012, YNE = 67.8;   // pylon cable points, anchorage entries
const TRT = DECK - 0.18, TRD = 7.6;                    // stiffening truss top (just under the road surface) and depth
function cableY(t){
  if (Math.abs(t) <= TW) return YM + (YS - YM)*(t/TW)*(t/TW);
  if (t > 0){ if (t <= TS1){ const u = (t - TW)/(TS1 - TW); return YS + (YP - YS)*u - 4*FS*u*(1 - u); } return YP + (YSE - YP)*(t - TS1)/(TSE - TS1); }
  if (t >= TN1){ const u = (-t - TW)/(-TN1 - TW); return YS + (YP - YS)*u - 4*FS*u*(1 - u); }
  return YP + (YNE - YP)*(TN1 - t)/(TN1 - TNE);
}
// suspender stations: main span every 50 ft from mid-span, side spans every 50 ft from the towers
const SUSP = (() => { const s = []; for (let k = -41; k <= 41; k++) s.push(k*15.24); for (let k = 1; k <= 21; k++) s.push(TW + k*15.24, -TW - k*15.24); return s.sort((a, b) => a - b); })();
// tower legs: [y0, y1, half widths across, half lengths along] (the OSM building parts of both towers, symmetrised)
const TIERS = [[13, 21, [4.8, 3.75, 2.65], [2.8, 4.85, 7.8]], [21, 74, [3.75, 2.65, 1.6], [1.85, 3.7, 6.95]], [74, 123, [3.75, 2.65, 1.6], [1.85, 3.7, 5.85]],
  [123, 162, [3.75, 2.7, 1.6], [1.85, 2.8, 4.9]], [162, 195, [2.7, 1.6], [1.85, 4.9]], [195, 225, [1.6], [3.7]]];
// Art Deco portal strut: recessed web with a frame of bands and vertical fins on both faces
function portal(o, hx, y0, y1, tc, th, od){
  const tr = th - 0.45, band = Math.min(1.4, (y1 - y0)*0.17);
  box(od || o, -hx, hx, y0, y1, tc - tr, tc + tr, true);
  for (const s of [-1, 1]){ const z0 = s < 0 ? tc - th : tc + tr, z1 = s < 0 ? tc - tr : tc + th;
    box(o, -hx, hx, y1 - band, y1, z0, z1); box(o, -hx, hx, y0, y0 + band, z0, z1, true);
    const nf = Math.max(3, Math.round(2*hx/2.4)); for (let k = 1; k < nf; k++){ const x = -hx + 2*hx*k/nf; box(o, x - 0.32, x + 0.32, y0 + band, y1 - band, z0, z1); } }
  // stepped crest on the top strut and a moulding line under every strut
  box(o, -hx, hx, y1, y1 + 0.5, tc - th - 0.25, tc + th + 0.25);
}
function tower(B, L, tc, fender){
  const o = B.p(OR), oc = B.p(CONW);
  // pier: rounded ends, 42 m across, 20 m along, 13 m above the water
  const P = []; for (let k = 0; k <= 8; k++){ const a = -PI/2 + PI*k/8; P.push([11.1 + Math.cos(a)*10.1, tc + Math.sin(a)*10.1]); }
  for (let k = 0; k <= 8; k++){ const a = PI/2 + PI*k/8; P.push([-11.1 + Math.cos(a)*10.1, tc + Math.sin(a)*10.1]); }
  prism(oc, P, -8, 13);
  prism(oc, P.map(p => [p[0]*0.985, tc + (p[1] - tc)*0.95]), 13, 13.6);
  if (fender){   // the elliptical fender (300 x 155 ft) round the south pier, 3 m wall, 4.6 m above the water
    const n = 72, A = 45.7, Bb = 23.6, w = 3;
    for (let k = 0; k < n; k++){ const a0 = k/n*TAU, a1 = (k + 1)/n*TAU;
      const o0 = [Math.cos(a0)*A, Math.sin(a0)*Bb], o1 = [Math.cos(a1)*A, Math.sin(a1)*Bb], i0 = [Math.cos(a0)*(A - w), Math.sin(a0)*(Bb - w)], i1 = [Math.cos(a1)*(A - w), Math.sin(a1)*(Bb - w)];
      q4(oc, [o0[0], -3, tc + o0[1]], [o1[0], -3, tc + o1[1]], [o1[0], 4.6, tc + o1[1]], [o0[0], 4.6, tc + o0[1]]);
      q4(oc, [i1[0], -3, tc + i1[1]], [i0[0], -3, tc + i0[1]], [i0[0], 4.6, tc + i0[1]], [i1[0], 4.6, tc + i1[1]]);
      q4(oc, [o0[0], 4.6, tc + o0[1]], [o1[0], 4.6, tc + o1[1]], [i1[0], 4.6, tc + i1[1]], [i0[0], 4.6, tc + i0[1]]); }
    L.red.push(0, 6.5, tc - Bb, -A, 6.5, tc, A, 6.5, tc);
  }
  // legs: six stepped tiers each, with a moulded ledge at every setback
  for (const sx of [-1, 1]){
    for (const [y0, y1, a, b] of TIERS){ const P = crossP(a, b), od = B.p(ORD), n = P.length, A = a[0], Bz = b[b.length - 1];
      for (let i = 0; i < n; i++){ const p = P[i], q = P[(i + 1) % n], out = (Math.abs(Math.abs(p[0]) - A) < 0.01 && Math.abs(Math.abs(q[0]) - A) < 0.01) || (Math.abs(Math.abs(p[1]) - Bz) < 0.01 && Math.abs(Math.abs(q[1]) - Bz) < 0.01);
        const x0 = sx*LEG + p[0], z0 = tc + p[1], x1 = sx*LEG + q[0], z1 = tc + q[1]; q4(out ? o : od, [x0, y0, z0], [x1, y0, z1], [x1, y1, z1], [x0, y1, z0]); }
      const tri = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
      for (const t of tri) t3(o, [sx*LEG + P[t[0]][0], y1, tc + P[t[0]][1]], [sx*LEG + P[t[1]][0], y1, tc + P[t[1]][1]], [sx*LEG + P[t[2]][0], y1, tc + P[t[2]][1]]); }
    for (const yl of [74, 123, 162, 195]){ const [, , a, b] = TIERS.find(T => T[1] === yl); box(o, sx*LEG - a[0] - 0.12, sx*LEG + a[0] + 0.12, yl - 0.6, yl, tc - b[0] - 0.12, tc + b[0] + 0.12); }
    // saddle housing on the leg top, the red aviation lights on it
    box(o, sx*LEG - 1.95, sx*LEG + 1.95, 225, 226.2, tc - 4.3, tc + 4.3);
    box(o, sx*LEG - 1.35, sx*LEG + 1.35, 226.2, 227, tc - 3.1, tc + 3.1);
    const r = B.p(RED); for (const dz of [-2.5, 2.5]){ box(r, sx*LEG - 0.3, sx*LEG + 0.3, 227, 227.7, tc + dz - 0.3, tc + dz + 0.3); L.red.push(sx*LEG, 227.9, tc + dz); }
  }
  // portal struts above the deck (between the leg inner faces), Art Deco faces
  const od = B.p(ORD); portal(o, LEG - 3.75, 111, 121, tc, 1.85, od); portal(o, LEG - 3.75, 151, 161, tc, 1.85, od); portal(o, LEG - 2.7, 185, 193, tc, 1.85, od); portal(o, LEG - 1.6, 215, 223, tc, 1.85, od);
  // below the deck: struts, two panels of X-bracing, the deck strut under the trusses
  const hx = LEG - 3.75;
  box(o, -hx, hx, 21.2, 25, tc - 1.85, tc + 1.85, true); box(o, -hx, hx, 40.6, 43, tc - 1.85, tc + 1.85, true); box(o, -hx, hx, TRT - TRD - 4.2, TRT - TRD, tc - 2.6, tc + 2.6, true);
  for (const [ya, yb] of [[25, 40.6], [43, TRT - TRD - 4.2]]){ beam(o, [-hx, ya, tc], [hx, yb, tc], 0.8, 0.65); beam(o, [hx, ya, tc], [-hx, yb, tc], 0.8, 0.65); }
  // walkway round the outside of each leg at deck level, with its railing
  const ow = B.p(WALK);
  for (const sx of [-1, 1]){ const x0 = sx > 0 ? 10.9 : -21.4, x1 = sx > 0 ? 21.4 : -10.9; box(ow, x0, x1, TRT - 0.05, DECK + 0.14, tc - 9.9, tc + 9.9, true);
    const xr = sx*21.3; rail(B, [[xr, tc - 9.9], [xr, tc + 9.9]], DECK + 0.14); rail(B, [[sx*13.3, tc - 9.9], [xr, tc - 9.9]], DECK + 0.14); rail(B, [[sx*13.3, tc + 9.9], [xr, tc + 9.9]], DECK + 0.14);
    box(o, x0, x1, TRT - 1.4, TRT - 0.05, tc - 9.9, tc - 9.3, true); box(o, x0, x1, TRT - 1.4, TRT - 0.05, tc + 9.3, tc + 9.9, true); }
}
// outer railing along a plan polyline at a fixed walk level y: posts, two rails, closely spaced balusters
function rail(B, pts, y, yf, col){
  const o = B.p(col || OR), P = mkPath(pts), Y = d => yf ? yf(d) : y, n = Math.max(1, Math.ceil(P.L/3.8));
  for (let k = 0; k < n; k++){ const d0 = P.L*k/n, d1 = P.L*(k + 1)/n, a = P.at(d0), b = P.at(d1), ya = Y(d0), yb = Y(d1);
    beam(o, [a.x, ya + 1.2, a.z], [b.x, yb + 1.2, b.z], 0.09, 0.07); beam(o, [a.x, ya + 0.12, a.z], [b.x, yb + 0.12, b.z], 0.05, 0.05);
    box(o, a.x - 0.08, a.x + 0.08, ya, ya + 1.28, a.z - 0.08, a.z + 0.08);
    const m = Math.max(1, Math.round((d1 - d0)/0.55));
    for (let j = 1; j < m; j++){ const d = d0 + (d1 - d0)*j/m, c = P.at(d), yc = Y(d), ex = c.tx*0.025, ez = c.tz*0.025;
      q4(o, [c.x - ex, yc + 0.17, c.z - ez], [c.x + ex, yc + 0.17, c.z + ez], [c.x + ex, yc + 1.13, c.z + ez], [c.x - ex, yc + 1.13, c.z - ez]); } }
  const e = P.at(P.L); box(o, e.x - 0.08, e.x + 0.08, Y(P.L), Y(P.L) + 1.28, e.z - 0.08, e.z + 0.08);
}
// one side of the deck edge along a path (side -1 west, +1 east): sidewalk slab, outer railing, lamp standards.
// off(d): lateral offset of the ribbon's outer edge; zf(d): road surface; skip(t): no lamp there
function walkway(B, L, P, side, off, zf, skip, d0, d1){
  const ow = B.p(WALK), o = B.p(OR), lh = B.p(LAMPH); d0 = d0 || 0; d1 = d1 === undefined ? P.L : d1;
  const n = Math.max(1, Math.ceil((d1 - d0)/4)), Q = [];
  for (let k = 0; k <= n; k++){ const d = d0 + (d1 - d0)*k/n, a = P.at(d), w = off(d), y = zf(d) + 0.14, sx = side*a.nx, sz = side*a.nz;
    Q.push({d, y, i:[a.x + sx*(w - 0.3), a.z + sz*(w - 0.3)], o:[a.x + sx*(w + 2.35), a.z + sz*(w + 2.35)], r:[a.x + sx*(w + 2.25), a.z + sz*(w + 2.25)], l:[a.x + sx*(w + 0.55), a.z + sz*(w + 0.55)], sx, sz, a}); }
  for (let k = 0; k < n; k++){ const A = Q[k], C = Q[k+1];
    q4(ow, [A.i[0], A.y, A.i[1]], [C.i[0], C.y, C.i[1]], [C.o[0], C.y, C.o[1]], [A.o[0], A.y, A.o[1]]);
    q4(ow, [A.o[0], A.y, A.o[1]], [C.o[0], C.y, C.o[1]], [C.o[0], C.y - 0.42, C.o[1]], [A.o[0], A.y - 0.42, A.o[1]]);
    q4(ow, [A.o[0], A.y - 0.42, A.o[1]], [C.o[0], C.y - 0.42, C.o[1]], [C.i[0], C.y - 0.42, C.i[1]], [A.i[0], A.y - 0.42, A.i[1]]); }
  rail(B, Q.map(q => q.r), 0, d => { const f = Math.min(n, d/((d1 - d0)/n)), k = Math.min(n - 1, Math.floor(f)); return Q[k].y + (Q[k+1].y - Q[k].y)*(f - k); });
  // lamp standards every 100 ft on the curb side of the walk; amber heads over the roadway
  const first = Math.ceil((P.at(d0).z + 2000)/30.48)*30.48 - 2000;
  for (let k = 0; k <= n; k++){ const A = Q[k]; if (k && Q[k-1] && Math.floor((Q[k-1].a.z + 2000.5)/30.48) === Math.floor((A.a.z + 2000.5)/30.48)) continue;
    if (k === 0 && Math.abs(A.a.z - first) > 4) continue; if (skip && skip(A.a.z)) continue;
    const bx = A.l[0], bz = A.l[1], y0 = A.y, ix = -A.sx, iz = -A.sz;
    box(o, bx - 0.17, bx + 0.17, y0, y0 + 0.9, bz - 0.17, bz + 0.17);
    beam(o, [bx, y0 + 0.9, bz], [bx, y0 + 7.4, bz], 0.11, 0.11);
    beam(o, [bx, y0 + 7.4, bz], [bx + ix*0.7, y0 + 7.95, bz + iz*0.7], 0.07, 0.07); beam(o, [bx + ix*0.7, y0 + 7.95, bz + iz*0.7], [bx + ix*1.6, y0 + 8.05, bz + iz*1.6], 0.07, 0.07);
    const hx = bx + ix*1.85, hz = bz + iz*1.85; box(lh, hx - 0.45, hx + 0.45, y0 + 7.8, y0 + 8.1, hz - 0.45, hz + 0.45, true);
    L.lamp.push(hx, y0 + 7.6, hz);
  }
}
// stiffening / deck truss along a path at lateral offset off: chords, verticals, Warren diagonals; returns the panel points
function truss(B, P, d0, d1, off, topf, depth, panel){
  const o = B.p(OR), n = Math.max(1, Math.round((d1 - d0)/panel)), pts = [];
  for (let k = 0; k <= n; k++){ const d = d0 + (d1 - d0)*k/n, a = P.at(d), yt = topf(d); pts.push({x:a.x + a.nx*off, z:a.z + a.nz*off, yt, yb:yt - depth, a}); }
  for (let k = 0; k < n; k++){ const A = pts[k], C = pts[k+1];
    beam(o, [A.x, A.yt - 0.42, A.z], [C.x, C.yt - 0.42, C.z], 0.46, 0.42);
    beam(o, [A.x, A.yb + 0.42, A.z], [C.x, C.yb + 0.42, C.z], 0.46, 0.42);
    if (k % 2) beam(o, [A.x, A.yt - 0.8, A.z], [C.x, C.yb + 0.8, C.z], 0.3, 0.24); else beam(o, [A.x, A.yb + 0.8, A.z], [C.x, C.yt - 0.8, C.z], 0.3, 0.24); }
  for (const A of pts) beam(o, [A.x, A.yb + 0.8, A.z], [A.x, A.yt - 0.8, A.z], 0.3, 0.26);
  return pts;
}
// floor beams and bottom lateral bracing between two trusses' panel points
function floor(B, Lp, Rp, ytop){
  const o = B.p(OR);
  for (let k = 0; k < Lp.length; k++){ const a = Lp[k], b = Rp[k]; beam(o, [a.x, a.yt - 2.7, a.z], [b.x, b.yt - 2.7, b.z], 0.28, 0.75);
    if (k < Lp.length - 1){ const c = k % 2 ? Rp[k+1] : Lp[k+1], e = k % 2 ? a : b; beam(o, [e.x, e.yb + 0.45, e.z], [c.x, c.yb + 0.45, c.z], 0.16, 0.16); } }
}
// plate girder along a path (approach spans): web + flanges
function girder(B, P, d0, d1, off, topf, depth){
  const o = B.p(OR), n = Math.max(1, Math.ceil((d1 - d0)/6)), pts = [];
  for (let k = 0; k <= n; k++){ const d = d0 + (d1 - d0)*k/n, a = P.at(d), yt = topf(d); pts.push({x:a.x + a.nx*off, z:a.z + a.nz*off, yt, yb:yt - depth, a}); }
  for (let k = 0; k < n; k++){ const A = pts[k], C = pts[k+1];
    beam(o, [A.x, (A.yt + A.yb)/2, A.z], [C.x, (C.yt + C.yb)/2, C.z], 0.12, depth/2);
    beam(o, [A.x, A.yb + 0.15, A.z], [C.x, C.yb + 0.15, C.z], 0.42, 0.15); beam(o, [A.x, A.yt - 0.15, A.z], [C.x, C.yt - 0.15, C.z], 0.42, 0.15); }
  for (let k = 0; k <= n; k += 1){ const A = pts[k]; beam(o, [A.x, A.yb + 0.3, A.z], [A.x, A.yt - 0.3, A.z], 0.3, 0.1); }
  return pts;
}
// four-legged steel tower (approach viaducts): battered legs, struts and X-bracing panels, cap girder under the trusses
function steelTower(B, a, hw, hl, ytop){
  const o = B.p(OR), corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const topP = corners.map(([i, j]) => [a.x + a.nx*i*hw + a.tx*j*hl, a.z + a.nz*i*hw + a.tz*j*hl]);
  let g0 = Infinity; for (const p of topP) g0 = Math.min(g0, gnd(p[1], p[0]));
  const H = ytop - g0, spread = 0.045*H;
  const botP = corners.map(([i, j]) => [a.x + a.nx*i*(hw + spread) + a.tx*j*(hl + spread*0.5), a.z + a.nz*i*(hw + spread) + a.tz*j*(hl + spread*0.5)]);
  const legAt = (k, f) => [botP[k][0] + (topP[k][0] - botP[k][0])*f, g0 - 2 + (ytop - g0 + 2)*f, botP[k][1] + (topP[k][1] - botP[k][1])*f];
  for (let k = 0; k < 4; k++){ beam(o, legAt(k, 0), legAt(k, 1), 0.65, 0.65); const g = gnd(botP[k][1], botP[k][0]); box(B.p(CONW), botP[k][0] - 1.6, botP[k][0] + 1.6, g - 2, g + 1.2, botP[k][1] - 1.6, botP[k][1] + 1.6); }
  const np = Math.max(1, Math.round(H/11));
  for (let p = 0; p <= np; p++){ const f = p/np;
    if (p > 0 || H < 6) for (let k = 0; k < 4; k++) beam(o, legAt(k, f), legAt((k + 1) % 4, f), 0.3, 0.3);
    if (p < np) for (let k = 0; k < 4; k++){ const k2 = (k + 1) % 4, f2 = (p + 1)/np; beam(o, legAt(k, f), legAt(k2, f2), 0.18, 0.18); beam(o, legAt(k2, f), legAt(k, f2), 0.18, 0.18); } }
}
// cable housing (concrete, sloping top where a main cable dives into the anchorage)
function housing(o, x0, x1, t0, t1, ya, yb){ prism(o, [[x0, t0], [x1, t0], [x1, t1], [x0, t1]], (x, z) => gnd(z, x) - 3, (x, z) => ya + (yb - ya)*(z - t0)/(t1 - t0)); }
// Art Deco pylon above the deck: fluted shaft, stepped crown
function pylon(B, tc, x0, x1, yb, yt, hl){
  const o = B.p(CON); hl = hl || 5;
  for (const s of [-1, 1]){ const xa = Math.min(s*x0, s*x1), xb = Math.max(s*x0, s*x1), w = xb - xa;
    box(o, xa, xb, yb, yt, tc - hl, tc + hl);
    for (let k = 1; k <= 3; k++){ const z = tc - hl + 2*hl*k/4; box(o, s > 0 ? xb : xa - 0.3, s > 0 ? xb + 0.3 : xa, yb + 1, yt - 2.2, z - 0.35, z + 0.35); }
    for (let k = 1; k <= 2; k++){ const x = xa + w*k/3; for (const zz of [tc - hl - 0.3, tc + hl]) box(o, x - 0.35, x + 0.35, yb + 1, yt - 2.2, zz, zz + 0.3); }
    box(o, xa - 0.35, xb + 0.35, yt - 2.2, yt - 1.4, tc - hl - 0.35, tc + hl + 0.35);
    box(o, xa + 0.3, xb - 0.3, yt, yt + 1.1, tc - hl + 0.4, tc + hl - 0.4); box(o, xa + 0.9, xb - 0.9, yt + 1.1, yt + 1.9, tc - hl + 1.2, tc + hl - 1.2); }
}
// Art Deco panels on a big concrete face from a to b ([x, z]), a hair proud of it on the outward side
function panels(o, a, b, y0, y1, sp){
  const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ux = dx/L, uz = dz/L, n = Math.max(1, Math.round(L/sp)), w = L/n;
  const mx = (a[0] + b[0])/2, mz = (a[1] + b[1])/2; let nx = uz, nz = -ux; if (nx*(mx - 0) + nz*0 < 0 && Math.abs(nx) > 0.5) { nx = -nx; nz = -nz; } else if (Math.abs(nx) <= 0.5 && nz*(mz - 1000*Math.sign(mz)) < 0){ nx = -nx; nz = -nz; }
  for (let k = 0; k < n; k++){ const c0 = k*w + 0.8, c1 = (k + 1)*w - 0.8, p0 = [a[0] + ux*c0 + nx*0.08, a[1] + uz*c0 + nz*0.08], p1 = [a[0] + ux*c1 + nx*0.08, a[1] + uz*c1 + nz*0.08];
    q4(o, [p0[0], y0, p0[1]], [p1[0], y0, p1[1]], [p1[0], y1, p1[1]], [p0[0], y1, p0[1]]); }
}
// massive fluted concrete pier (pylons S1/S2 under the deck)
function bigPier(B, t0, t1, hx, y0, y1){
  const o = B.p(CON); box(o, -hx, hx, y0, y1, t0, t1);
  const nf = 7; for (let k = 1; k < nf; k++){ const x = -hx + 2*hx*k/nf; box(o, x - 0.5, x + 0.5, y0 + 2, y1 - 3, t0 - 0.45, t0); box(o, x - 0.5, x + 0.5, y0 + 2, y1 - 3, t1, t1 + 0.45); }
  for (const s of [-1, 1]) for (let k = 1; k < 3; k++){ const z = t0 + (t1 - t0)*k/3; box(o, s > 0 ? hx : -hx - 0.45, s > 0 ? hx + 0.45 : -hx, y0 + 2, y1 - 3, z - 0.6, z + 0.6); }
  box(o, -hx - 0.5, hx + 0.5, y1 - 3, y1 - 2, t0 - 0.5, t1 + 0.5);
}
// the two-hinged steel arch over Fort Point (97 m) with its spandrel posts up to the deck structure
function arch(B, ta, tb){
  const o = B.p(OR), tc = (ta + tb)/2, hs = (tb - ta)/2, yS = 7, yC = 47, dep = 5.4, n = 16, X = 13.0;
  const yb = t => yS + (yC - yS)*(1 - ((t - tc)/hs)*((t - tc)/hs)), ytop = t => yb(t) + dep*(0.85 + 0.15*Math.abs((t - tc)/hs));
  for (const sx of [-1, 1]){ const x = sx*X, ys = [];
    for (let k = 0; k <= n; k++){ const t = ta + (tb - ta)*k/n; ys.push([t, yb(t), ytop(t)]); }
    for (let k = 0; k < n; k++){ const A = ys[k], C = ys[k+1];
      beam(o, [x, A[1], A[0]], [x, C[1], C[0]], 0.7, 0.55); beam(o, [x, A[2], A[0]], [x, C[2], C[0]], 0.7, 0.5);
      if (k % 2) beam(o, [x, A[1], A[0]], [x, C[2], C[0]], 0.4, 0.3); else beam(o, [x, A[2], A[0]], [x, C[1], C[0]], 0.4, 0.3); }
    for (let k = 1; k < n; k++){ const A = ys[k]; beam(o, [x, A[1], A[0]], [x, A[2], A[0]], 0.4, 0.3);
      if (A[2] < TRT - TRD - 0.5){ beam(o, [x, A[2], A[0]], [x, TRT - TRD, A[0]], 0.5, 0.45);
        if (k < n - 1 && ys[k+1][2] < TRT - TRD - 4) beam(o, [x, A[2] + 0.5, A[0]], [x, TRT - TRD - 0.5, ys[k+1][0]], 0.25, 0.2); } } }
  // lateral struts and plan bracing between the ribs
  for (let k = 0; k <= n; k++){ const t = ta + (tb - ta)*k/n; beam(o, [-X, ytop(t) - 0.4, t], [X, ytop(t) - 0.4, t], 0.3, 0.45);
    if (k < n){ const t2 = ta + (tb - ta)*(k + 1)/n; beam(o, [k % 2 ? -X : X, yb(t) + 0.4, t], [k % 2 ? X : -X, yb(t2) + 0.4, t2], 0.2, 0.2); } }
}

// ================= the suspension bridge =================
LANDMARKS.ggbridge = {zh:'金门大桥', en:'Golden Gate Bridge', cat:'old', r:1000, h:227, lt:{m:0, c:'#ffbd78', k:1.35, e:0.4, anim:'breathe'},
  build(){
    const [g, s] = frame(0), B = mkB(), L = {lamp:[], red:[], grn:[]};
    for (const tc of [-TW, TW]) tower(B, L, tc, tc > 0);
    // stiffening trusses, floor beams and bracing: side spans, main span, and over the Fort Point arch
    const runs = [[-980.3, -TW - 7.2], [-TW + 7.2, TW - 7.2], [TW + 7.2, 975], [989, 1086]];
    for (const [ta, tb] of runs){ const P = mkPath([[0, ta], [0, tb]]), n = Math.round((tb - ta)/7.62);
      const Lp = truss(B, P, 0, P.L, -CAB, () => TRT, TRD, P.L/n), Rp = truss(B, P, 0, P.L, CAB, () => TRT, TRD, P.L/n); floor(B, Lp, Rp); }
    // main cables (smooth tubes) with cable bands; suspenders (two ropes per band)
    const ct = [TNE, TN1]; for (let t = TN1 + 6; t < -TW; t += 6) ct.push(t); ct.push(-TW);
    for (let t = -TW + 8; t < TW; t += 8) ct.push(t); ct.push(TW); for (let t = TW + 6; t < TS1; t += 6) ct.push(t); ct.push(TS1, TSE);
    for (const sx of [-1, 1]) lmAdd(s, tubeGeo(ct.map(t => [sx*CAB, cableY(t), t]), 0.46, 10), {c:OR, ds:true}, 0, 0, 0);
    const o = B.p(OR);
    for (const t of SUSP) for (const sx of [-1, 1]){ const x = sx*CAB, yc = cableY(t);
      box(o, x - 0.55, x + 0.55, yc - 0.56, yc + 0.56, t - 0.45, t + 0.45);
      for (const dz of [-0.22, 0.22]) box(o, x - 0.06, x + 0.06, TRT, yc - 0.45, t + dz - 0.06, t + dz + 0.06); }
    for (const sx of [-1, 1]) L.red.push(sx*CAB, cableY(TW) + 1.2, TW + 6, sx*CAB, cableY(-TW) + 1.2, -TW - 6);
    L.grn.push(0, TRT - TRD - 0.6, 0); L.red.push(-CAB, TRT - TRD - 0.6, TW - 30, CAB, TRT - TRD - 0.6, -TW + 30);
    // pylons S1 / S2 (concrete piers under the deck where the arch springs, Art Deco pylons above), the south anchorage
    const oc = B.p(CON), ow = B.p(CONW);
    bigPier(B, 975, 989, 17.6, -3, TRT - TRD + 0.2); bigPier(B, 1086, 1100, 17.6, -3, TRT - TRD + 0.2);
    for (const [t0, t1] of [[975, 989], [1086, 1100]]){ box(oc, -17.6, 17.6, TRT - TRD + 0.2, TRT - 1.9, t0, t1); }
    pylon(B, 981.4, 13.4, 18.0, TRT - 1.9, 85, 5); pylon(B, 1094.6, 13.4, 18.4, TRT - 1.9, 85, 5);
    const sTop = (x, z) => Math.min(DECK, deckZ(z, -1), deckZ(z, 1)) - 1.95;
    prism(oc, [[-14.5, 1100], [15.4, 1100], [18.2, 1200.3], [-21.7, 1199.7], [-21.8, 1159.5], [-14.8, 1159.6]], -3, sTop);
    for (let k = 0; k < 9; k++){ const z = 1106 + k*10; for (const x of [15.4 + (18.2 - 15.4)*(z - 1100)/100, z < 1159.5 ? -14.6 : -21.75]) box(oc, x - 0.45, x + 0.45, 0, sTop(x, z) - 1.2, z - 0.7, z + 0.7); }
    for (const sx of [-1, 1]) housing(oc, sx > 0 ? 13.35 : -16.4, sx > 0 ? 16.4 : -13.35, 1100, 1150, 72.6, 64.6);
    { const op = B.p(CONP); panels(op, [15.4, 1100], [18.2, 1200.3], 3, 53, 11); panels(op, [-14.5, 1100], [-14.8, 1159.6], 3, 58, 11); panels(op, [-21.8, 1159.5], [-21.7, 1199.7], 3, 53, 11);
      panels(op, [18.2, 1200.3], [-21.7, 1199.7], 3, 53, 10); }
    // the Fort Point arch between the pylons
    arch(B, 989, 1086);
    // north anchorage block between pylons N1 and N2 (stepped plan from OSM), cable housings, pylons
    const NA = [[-24.2, -1089.6], [24.2, -1089.6], [24.2, -1080], [22.8, -1080], [22.8, -1046], [19.5, -1046], [19.5, -1011], [12.5, -1011], [12.5, -990], [17.4, -990], [17.4, -980],
      [-17.4, -980], [-17.4, -990], [-12.5, -990], [-12.5, -1011], [-19.5, -1011], [-19.5, -1046], [-22.8, -1046], [-22.8, -1080], [-24.2, -1080]];
    prism(oc, NA, (x, z) => gnd(z, x) - 4, TRT - 1.9);
    for (let k = 0; k < 8; k++){ const z = -1085 + k*12.5; for (const sx of [-1, 1]){ const w = z < -1080 ? 24.2 : z < -1046 ? 22.8 : z < -1011 ? 19.5 : z < -990 ? 12.5 : 17.4, x = sx*w;
      box(oc, x - 0.45, x + 0.45, gnd(z, x) - 1, TRT - 3, z - 0.7, z + 0.7); } }
    for (const sx of [-1, 1]) housing(oc, sx > 0 ? 13.35 : -16.4, sx > 0 ? 16.4 : -13.35, -990, -1032, 78.5, TRT - 1.9);
    { const op = B.p(CONP); for (const sx of [-1, 1]) for (const [w, z0, z1] of [[19.5, -1011, -1046], [22.8, -1046, -1080]]){ const x = sx*w, g0 = Math.max(gnd(z0, x), gnd(z1, x));
        panels(op, [x, z0], [x, z1], g0 + 3, 59, 11); }
      panels(op, [-24.2, -1089.6], [24.2, -1089.6], Math.max(gnd(-1089.6, -24.2), gnd(-1089.6, 24.2)) + 3, 59, 9.7); }
    pylon(B, -985.0, 13.4, 17.6, TRT - 1.9, 85, 4.8); pylon(B, -1084.6, 19.2, 24.2, TRT - 1.9, 85, 5);
    // deck edges: sidewalks, railings and lamps from the north anchorage to the south anchorage (both sides)
    const skip = t => Math.abs(Math.abs(t) - TW) < 13 || (t > 970 && t < 993) || (t > 1082 && t < 1104) || (t < -976 && t > -996) || t < -1076;
    const P = mkPath([[0, -1089.6], [0, 1100]]);
    for (const sx of [-1, 1]){
      for (const [d0, d1] of [[0, -TW - 9.9 + 1089.6], [-TW + 9.9 + 1089.6, TW - 9.9 + 1089.6], [TW + 9.9 + 1089.6, P.L]])
        walkway(B, L, P, sx, () => 11.2, () => DECK, skip, d0, d1);
    }
    approachNorth(B, L); approachSouth(B, L);
    B.flush(s);
    sprites(s, L.lamp, [1, 0.68, 0.3], 10); sprites(s, L.red, [1, 0.1, 0.06], 16); sprites(s, L.grn, [0.2, 1, 0.35], 10);
    return g;
  }};

// ================= the Marin approach viaduct =================
function approachNorth(B, L){
    const MID = midLine(LN_NW, LN_NE, 64), P = mkPath(MID), zf = d => deckZ(P.at(d).z, 0);
    const d5 = 5*53.4, dEnd = P.L - 2;
    // five deck-truss spans from the anchorage (N2) on four-legged towers, then plate girders onto the hillside
    const Lp = truss(B, P, 0, d5, -CAB, d => zf(d) - 0.18, TRD, 7.63), Rp = truss(B, P, 0, d5, CAB, d => zf(d) - 0.18, TRD, 7.63); floor(B, Lp, Rp);
    for (const off of [-CAB, -5, 5, CAB]) girder(B, P, d5, dEnd, off, d => zf(d) - 0.18, 2.6);
    for (let d = d5; d <= dEnd; d += 6){ const a = P.at(d), y = zf(d) - 1.6; beam(B.p(OR), [a.x - a.nx*CAB, y, a.z - a.nz*CAB], [a.x + a.nx*CAB, y, a.z + a.nz*CAB], 0.2, 0.5); }
    for (let k = 1; k <= 5; k++){ const d = k*53.4, a = P.at(d); steelTower(B, a, 11.5, 4.2, zf(d) - 0.18 - TRD);
      beam(B.p(OR), [a.x - a.nx*CAB, zf(d) - 0.18 - TRD - 0.9, a.z - a.nz*CAB], [a.x + a.nx*CAB, zf(d) - 0.18 - TRD - 0.9, a.z + a.nz*CAB], 0.6, 0.9); }
    { const d = d5 + (dEnd - d5)*0.5, a = P.at(d), yt = zf(d) - 2.8; steelTower(B, a, 11, 1.4, yt); beam(B.p(OR), [a.x - a.nx*CAB, yt - 0.6, a.z - a.nz*CAB], [a.x + a.nx*CAB, yt - 0.6, a.z + a.nz*CAB], 0.6, 0.6); }
    { const a = P.at(dEnd), oc = B.p(CON), pts = [-15, 15].map(w => [a.x + a.nx*w, a.z + a.nz*w]), g0 = Math.min(...pts.map(p => gnd(p[1], p[0])));
      const A = [[a.x - a.nx*15 - a.tx*3, a.z - a.nz*15 - a.tz*3], [a.x + a.nx*15 - a.tx*3, a.z + a.nz*15 - a.tz*3], [a.x + a.nx*15 + a.tx*4, a.z + a.nz*15 + a.tz*4], [a.x - a.nx*15 + a.tx*4, a.z - a.nz*15 + a.tz*4]];
      prism(oc, A, g0 - 3, zf(dEnd) - 2.6); }
    // sidewalks, railings, lamps (the ribbons' outer edges lie 11.1 m off the mid line)
    for (const sx of [-1, 1]) walkway(B, L, P, sx, () => 11.2, zf, null, 0, dEnd);
}

// ================= the San Francisco approach =================
function approachSouth(B, L){
    for (const [LN, side] of [[LN_SW, -1], [LN_SE, 1]]){
      const P = mkPath(LN.map(p => [p[0], p[1]])), zf = d => deckZ(P.at(d).z, side);
      // start of the structure: the end of the south anchorage block (t = 1200)
      let dA = 0; while (dA < P.L && P.at(dA).z < 1200) dA += 0.5;
      const dEnd = P.L - 1.5, sp = [dA, dA + 38.1, dA + 76.2, dEnd];
      for (const off of [-4.1, 4.1]){
        const Ap = truss(B, P, sp[0], sp[2], off, d => zf(d) - 0.18, 5.2, 6.35);
        girder(B, P, sp[2], dEnd, off, d => zf(d) - 0.18, 2.3); }
      for (let d = dA; d <= dEnd; d += 6.35){ const a = P.at(d), y = zf(d) - 1.3; beam(B.p(OR), [a.x - a.nx*4.4, y, a.z - a.nz*4.4], [a.x + a.nx*4.4, y, a.z + a.nz*4.4], 0.18, 0.45); }
      for (const [d, dep] of [[sp[1], 5.2], [sp[2], 5.2], [(sp[2] + dEnd)/2, 2.3]]){ const a = P.at(d), yt = zf(d) - 0.18 - dep; if (yt - gnd(a.z, a.x) < 3) continue;
        steelTower(B, a, 4.1, 2.2, yt); beam(B.p(OR), [a.x - a.nx*5, yt - 0.7, a.z - a.nz*5], [a.x + a.nx*5, yt - 0.7, a.z + a.nz*5], 0.55, 0.7); }
      { const a = P.at(dEnd), oc = B.p(CON), w = 7.5, A = [[a.x - a.nx*w - a.tx*3, a.z - a.nz*w - a.tz*3], [a.x + a.nx*w - a.tx*3, a.z + a.nz*w - a.tz*3], [a.x + a.nx*w + a.tx*3, a.z + a.nz*w + a.tz*3], [a.x - a.nx*w + a.tx*3, a.z - a.nz*w + a.tz*3]];
        prism(oc, A, gnd(a.z, a.x) - 3, zf(dEnd) - 2.5); }
      // the outer edge of each ribbon: sidewalk, railing, lamps (from the south anchorage on)
      let dW = 0; while (dW < P.L && P.at(dW).z < 1100) dW += 0.5;
      walkway(B, L, P, side, () => 6.7, zf, t => t < 1104, dW, dEnd);
    }
}

// ================= Fort Point =================
// OSM footprint (lat, t): the brick fort's outer walls and its courtyard (an inner ring), its west wall 1-2 m east of the
// bridge axis, under the arch; the two notches in the courtyard are the granite spiral-stair towers
const FPO = [[-7.1,1021.8],[2.2,1027.7],[1.1,1069],[4.6,1071.3],[67.9,1036.5],[68.4,1015.3],[77.6,1010.1],[78.8,1005.9],[74.9,999.3],[70.7,997.9],[61.5,1003.1],[50.5,996.3],[45.8,996.3],[9.5,1016.1],[0.3,1010.2],[-4.3,1011],[-8.2,1017.7]];
const FPI = [[11,1037.8],[15.7,1030.4],[17.2,1030.8],[18.3,1030.2],[18.7,1028.5],[17.8,1027.1],[22.8,1019.3],[47.6,1005.8],[52,1013.2],[50.8,1015.4],[51.1,1016.7],[53.3,1018.1],[54.6,1017.7],[58.9,1025.4],[58.1,1028.6],[13.9,1052.9],[10.8,1051.1]];
// openings along a wall (a dark recess plane just proud of the face): rows at heights ys, spacing sp, size w x h
function openings(o, a, b, out, ys, sp, w, h, end){
  const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ux = dx/L, uz = dz/L, nx = out[0]*0.06, nz = out[1]*0.06, m = Math.floor((L - 2*end)/sp);
  if (m < 0) return; const s0 = (L - m*sp)/2;
  for (let k = 0; k <= m; k++){ const c = s0 + k*sp, x = a[0] + ux*c + nx, z = a[1] + uz*c + nz;
    for (const y of ys) q4(o, [x - ux*w/2, y, z - uz*w/2], [x + ux*w/2, y, z + uz*w/2], [x + ux*w/2, y + h, z + uz*w/2], [x - ux*w/2, y + h, z - uz*w/2]); }
}
const outN = (P, i, inward) => { const a = P[i], b = P[(i + 1) % P.length], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz);
  let ar = 0; for (let k = 0; k < P.length; k++){ const p = P[k], q = P[(k + 1) % P.length]; ar += p[0]*q[1] - q[0]*p[1]; }
  const sg = ar > 0 ? 1 : -1, nx = sg*dz/l, nz = -sg*dx/l; return inward ? [-nx, -nz] : [nx, nz]; };
LANDMARKS.fortpoint = {zh:'波因特堡', en:'Fort Point', cat:'old', r:62, h:24, lt:{m:0, c:'#ffd6a0', k:0.8, e:0.55, anim:'breathe'},
  build(){
    const [g, s] = frame(1035, 36, true), B = mkB();
    const BR = '#9f513b', GR = '#bab2a2', DK = '#2d2622', FL = '#8c877c', WH = '#ece7dc', BK = '#26292b';
    const ob = B.p(BR), og = B.p(GR), od = B.p(DK), of = B.p(FL), H1 = 14.2;
    // granite sea-wall apron, the brick walls of the three casemate tiers, the barbette tier (roof) round the courtyard
    const ap = FPO.map(p => [p[0], p[1]]), cen = [36, 1035];
    prism(og, ap.map(p => [cen[0] + (p[0] - cen[0])*1.09, cen[1] + (p[1] - cen[1])*1.09]), -1.6, 1.0);
    prism(ob, FPO, -1, H1, false); prism(og, FPO, -1, 1.6, false); prism(ob, FPI, 0.3, H1, false);
    const tri = THREE.ShapeUtils.triangulateShape(FPO.map(p => new THREE.Vector2(p[0], p[1])), [FPI.map(p => new THREE.Vector2(p[0], p[1]))]), AL = FPO.concat(FPI);
    for (const t of tri) t3(of, [AL[t[0]][0], H1, AL[t[0]][1]], [AL[t[1]][0], H1, AL[t[1]][1]], [AL[t[2]][0], H1, AL[t[2]][1]]);
    prism(of, FPI, 0.2, 0.32);
    // granite cordon under the barbette, brick parapet with granite coping on the outer edge
    for (let i = 0; i < FPO.length; i++){ const a = FPO[i], b = FPO[(i + 1) % FPO.length], n = outN(FPO, i), e = [n[0]*0.05, n[1]*0.05], w = [-n[0]*1.2, -n[1]*1.2];
      q4(og, [a[0] + e[0], H1 - 0.9, a[1] + e[1]], [b[0] + e[0], H1 - 0.9, b[1] + e[1]], [b[0] + e[0], H1 - 0.3, b[1] + e[1]], [a[0] + e[0], H1 - 0.3, a[1] + e[1]]);
      q4(ob, [a[0], H1, a[1]], [b[0], H1, b[1]], [b[0], H1 + 1.3, b[1]], [a[0], H1 + 1.3, a[1]]);
      q4(ob, [a[0] + w[0], H1, a[1] + w[1]], [b[0] + w[0], H1, b[1] + w[1]], [b[0] + w[0], H1 + 1.3, b[1] + w[1]], [a[0] + w[0], H1 + 1.3, a[1] + w[1]]);
      q4(og, [a[0], H1 + 1.3, a[1]], [b[0], H1 + 1.3, b[1]], [b[0] + w[0], H1 + 1.3, b[1] + w[1]], [a[0] + w[0], H1 + 1.3, a[1] + w[1]]); }
    // gun embrasures on the water faces (three tiers), barracks windows and the sally port on the gorge (south-east) face
    for (let i = 0; i < FPO.length; i++){ const a = FPO[i], b = FPO[(i + 1) % FPO.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]), n = outN(FPO, i); if (l < 9) continue;
      if (i === 3){ openings(od, a, b, n, [2.3, 6.5, 10.5], 3.5, 1.1, 1.8, 4);
        const c = [(a[0] + b[0])/2 + n[0]*0.09, (a[1] + b[1])/2 + n[1]*0.09], ux = (b[0] - a[0])/l, uz = (b[1] - a[1])/l;
        q4(od, [c[0] - ux*1.9, 0.4, c[1] - uz*1.9], [c[0] + ux*1.9, 0.4, c[1] + uz*1.9], [c[0] + ux*1.9, 4.3, c[1] + uz*1.9], [c[0] - ux*1.9, 4.3, c[1] - uz*1.9]); }
      else openings(od, a, b, n, [2.9, 7.1, 11.3], 5.0, 0.9, 1.25, 2.5); }
    // courtyard: three tiers of arched casemate bays on the inner faces
    for (let i = 0; i < FPI.length; i++){ const a = FPI[i], b = FPI[(i + 1) % FPI.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 8) continue;
      openings(od, a, b, outN(FPI, i, true), [1.0, 5.4, 9.6], 4.2, 2.2, 3.0, 1.6); }
    // spiral-stair towers (granite, rising above the barbette) in the courtyard corners and on the outer corners
    const tw = (x, z, r, y1) => { const P = []; for (let k = 0; k < 10; k++){ const a = k/10*TAU; P.push([x + Math.cos(a)*r, z + Math.sin(a)*r]); } prism(og, P, 0.3, y1); prism(of, P.map(p => [x + (p[0] - x)*1.12, z + (p[1] - z)*1.12]), y1, y1 + 0.35); };
    tw(17.6, 1029.2, 2.3, H1 + 3.0); tw(52.4, 1016.2, 2.3, H1 + 3.0);
    // the 1864 lighthouse on the barbette at the north-west corner: hexagonal iron tower, gallery, lantern, dome
    { const q = [4.5, 1020.8], ow = B.p(WH), ok = B.p(BK), y0 = H1, R = (r, n) => { const P = []; for (let k = 0; k < n; k++){ const a = k/n*TAU; P.push([q[0] + Math.cos(a)*r, q[1] + Math.sin(a)*r]); } return P; };
      for (let k = 0; k < 6; k++){ const a = k/6*TAU; beam(ow, [q[0] + Math.cos(a)*2.2, y0, q[1] + Math.sin(a)*2.2], [q[0] + Math.cos(a)*1.2, y0 + 7.4, q[1] + Math.sin(a)*1.2], 0.12, 0.12); }
      prism(ow, R(0.75, 8), y0, y0 + 7.6);
      prism(ok, R(1.9, 12), y0 + 7.4, y0 + 7.8); rail(B, R(1.8, 12).concat([R(1.8, 12)[0]]), y0 + 7.8, null, BK);
      prism(B.p({c:'#3a4a52'}), R(1.05, 8), y0 + 7.8, y0 + 9.5); prism(ok, R(1.25, 8), y0 + 9.5, y0 + 9.8);
      const C = R(1.25, 8); for (let k = 0; k < 8; k++) t3(ok, [C[k][0], y0 + 9.8, C[k][1]], [C[(k + 1) % 8][0], y0 + 9.8, C[(k + 1) % 8][1]], [q[0], y0 + 11.0, q[1]]); }
    B.flush(s);
    return g;
  }};

// placements: ggbridge at mid-span, the fort on the same axis frame (rot = bearing of the bridge's cross direction, +lat)
SG_PLACES.push({type:'ggbridge', lat:37.8197585, lon:-122.4785627, rot:0.092753});
SG_PLACES.push({type:'fortpoint', lat:37.8105034, lon:-122.4770712, rot:0.092753});
}
