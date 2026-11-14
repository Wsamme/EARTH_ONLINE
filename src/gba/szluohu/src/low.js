
// ---------- generic helpers for the low buildings ----------
// a frame along a ring: local axes of an edge
const edgeOf = (R, i) => { const a = R[i], b = R[(i + 1)%R.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); return {a, b, L, ux:(b[0] - a[0])/L, uz:(b[1] - a[1])/L}; };
const ringArea = R => { let s = 0; for (let i = 0; i < R.length; i++){ const p = R[i], q = R[(i + 1)%R.length]; s += p[0]*q[1] - q[0]*p[1]; } return s/2; };
// folded (saw-tooth) glass curtain wall in front of an edge: n folds, depth d, from y0 to y1, fold edges as light mullions
function foldWall(B, col, mul, a, b, out, n, d, y0, y1){
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0])/L, uz = (b[1] - a[1])/L;
  for (let k = 0; k < n; k++){ const s0 = k/n*L, s1 = (k + 0.5)/n*L, s2 = (k + 1)/n*L;
    const P0 = [a[0] + ux*s0, a[1] + uz*s0], P1 = [a[0] + ux*s1 + out[0]*d, a[1] + uz*s1 + out[1]*d], P2 = [a[0] + ux*s2, a[1] + uz*s2];
    B.q(col, [P0[0], y0, P0[1]], [P1[0], y0, P1[1]], [P1[0], y1, P1[1]], [P0[0], y1, P0[1]]);
    B.q(col, [P1[0], y0, P1[1]], [P2[0], y0, P2[1]], [P2[0], y1, P2[1]], [P1[0], y1, P1[1]]);
    obox(B, mul, P1[0], P1[1], ux, uz, 0.35, 0.35, y0, y1, true); obox(B, mul, P0[0], P0[1], ux, uz, 0.5, 0.5, y0, y1, true);
    for (let y = y0 + 4.2; y < y1 - 1; y += 4.2){ B.q(mul, [P0[0], y, P0[1]], [P1[0], y, P1[1]], [P1[0], y + 0.3, P1[1]], [P0[0], y + 0.3, P0[1]]); B.q(mul, [P1[0], y, P1[1]], [P2[0], y, P2[1]], [P2[0], y + 0.3, P2[1]], [P1[0], y + 0.3, P1[1]]); }
  }
}

// ================= Shenzhen Grand Theatre (opened May 1989) =================
// One of the eight cultural facilities built by the government in the Special Zone's first years (sz.gov.cn); a theatre with a
// main hall of over 1 600 seats, a concert hall and an exhibition space; glass curtain walls in a "folded cubic design"
// (Wikipedia). OSM w179274427 (92 x 149 m, the open court on the east). Heights are estimates (none published): the halls
// under a 22 m roof slab, the stage tower to 34 m; the main front faces south to Shennan Road.
const GT = [[-43.2, -73.8], [49.2, -74.8], [49.8, -26.3], [18.2, -25.9], [18.6, 13.4], [25.3, 13.4], [25.4, 19.5], [48.2, 19.2], [48.9, 73.8], [-41.4, 74.8]];
LANDMARKS.szgrandtheatre = {zh:'深圳大剧院', en:'Shenzhen Grand Theatre', cat:'new', r:105, h:34, lt:{m:1, c:'#ffe7c4', k:0.6},
  build(){
    const g = new THREE.Group(), B = Bt();
    const GLF = {c:'#7f98a6', m:1, fh:4.2, cw:3.0}, MUL = {c:'#d9dcda', m:0, lk:0.4}, WALL = {c:'#d8d2c4', m:0, lk:0.35}, ROOF = '#9a9d9b',
      SLAB = {c:'#e4e1d8', m:0, lk:0.5}, SOFF = {c:'#ece7dc', glow:'#ffe4b8', gk:0.45}, FLY = {c:'#cfc8b8', m:0, lc:'#ffe6c8', lk:0.6}, PLZ = '#bdb6a8',
      LOB = {c:'#56646c', glow:'#ffe2b4', gk:0.65};
    // the body: tiled walls, a strip of glazing under the roof slab
    ext(B, WALL, GT, -1.5, 21, ROOF);
    // a glazed clerestory band under the roof slab all round, tiled piers
    ext(B, GLF, grow(GT, 0.12), 14.5, 20.5, null); mullions(B, WALL, grow(GT, 0.12), 6.0, 0.5, 0.9, 14.5, 20.5, true);
    // the folded glass fronts: the long south face and the west face, glowing lobbies behind
    foldWall(B, GLF, MUL, [49.0, 74.0], [-41.4, 74.8], [0, 1], 12, 2.6, 0.5, 21);
    foldWall(B, GLF, MUL, [-41.4, 74.8], [-43.2, -73.8], [-1, 0], 16, 2.2, 0.5, 15);
    foldWall(B, GLF, MUL, [18.6, 13.4], [18.2, -25.9], [1, 0], 5, 1.8, 0.5, 21);
    abox(B, LOB, -40, 47, 0.3, 6, 72, 73.8);
    // the big flat roof slab with deep overhangs on the glass fronts
    const slab = [[-47.5, -76.5], [51.5, -77], [52, 78.5], [-46, 79.5]];
    ext(B, SLAB, slab, 21, 23.2, ROOF, SOFF);
    // the stage tower over the main hall (middle-north), and the plant on the roof
    ext(B, FLY, [[-26, -58], [16, -58], [16, -20], [-26, -20]], 23.2, 34, ROOF);
    ext(B, '#a3a7a5', [[-30, 0], [0, 0], [0, 30], [-30, 30]], 23.2, 26.5, ROOF);
    // the forecourt on Shennan Road: paving, low steps, lamps
    ext(B, PLZ, [[-41, 75], [49, 74], [49, 92], [-41, 92]], -1, 0.35, PLZ);
    for (let x = -36; x <= 44; x += 16){ obox(B, '#7d8285', x, 88, 1, 0, 0.3, 0.3, 0.35, 6.5, true); abox(B, {c:'#fff1d6', glow:'#ffe7b8', gk:1.6}, x - 0.4, x + 0.4, 6.5, 7.0, 87.6, 88.4); }
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'szgrandtheatre', lat:22.545274, lon:114.100443, rot:0});

// ================= Shenzhen Old Museum (opened November 1988; the Ancient Art museum since the 2020 refit) =================
// Tongxin Road 6, beside Lizhi Park; one of "Shenzhen's ten historic buildings of the reform era" (sz.gov.cn). The anchor is
// the museum grounds w183106483; the hall is OSM w247967138 (62 x 50 m, stepped corners). Form after the target notes (a low
// pavilion block under a big overhanging roof; no published description found): three storeys (16 m, estimate), a deep flat
// roof with a raised skylight lantern, pale stone walls with tall window strips, the entrance facing south.
const MS = {ring:[[-5.0, -15.8], [3.8, -16.1], [3.7, -25.1], [13.4, -25.3], [13.3, -29.1], [45.7, -29.5], [45.9, -19.1], [52.6, -19.1], [52.5, -9.5], [57.0, -9.5], [57.3, 9.2], [46.7, 9.3], [46.7, 15.2], [39.6, 15.1], [39.6, 20.3], [5.6, 20.7], [5.2, 10.4], [-0.2, 10.3], [-0.4, -0.9], [-4.8, -1.6]]};
{ const c = centroid(MS.ring); MS.c = c; MS.ll = LL(22.545051, 114.096241, c[0], c[1]); }
LANDMARKS.szmuseumold = {zh:'深圳博物馆古代艺术馆', en:'Shenzhen Museum (Ancient Art, old building)', cat:'new', r:45, h:22, lt:{m:0, c:'#ffe2b8', k:0.5, e:0.7},
  build(){
    const g = new THREE.Group(), B = Bt(), R = shift(MS.ring, -MS.c[0], -MS.c[1]);
    const ST = {c:'#e2dccd', m:0, lk:0.45}, WIN = {c:'#5d6a70', m:1, fh:5.0, cw:2.4}, ROOF = {c:'#d4cfc3', m:0, lk:0.4}, SOFF = {c:'#ddd6c6', glow:'#ffdcaa', gk:0.35},
      LAN = {c:'#9fb2bb', m:0, glow:'#ffe8c4', gk:0.45}, RF = '#9b9e9b', STEP = '#c9c1b0';
    ext(B, ST, R, -2, 15.5, RF);
    // tall window strips on every edge longer than 6 m
    for (let i = 0; i < R.length; i++){ const e = edgeOf(R, i); if (e.L < 6) continue; const k = Math.floor(e.L/5.5), o = ringArea(R) > 0 ? 1 : -1, nx = o*e.uz, nz = -o*e.ux;
      for (let j = 0; j < k; j++){ const f = (j + 0.5)/k, x = e.a[0] + (e.b[0] - e.a[0])*f + nx*0.12, z = e.a[1] + (e.b[1] - e.a[1])*f + nz*0.12; obox(B, WIN, x, z, e.ux, e.uz, 1.8, 0.3, 2.5, 13.5, true); } }
    // the big roof: a thick slab overhanging 4 m, a raised lantern over the central hall
    const G = grow(R, 4.0); ext(B, ROOF, G, 15.5, 17.6, RF, SOFF); bands(B, ROOF, G, [17.9], 0.6, 0.25);
    const lan = [[-12, -10], [12, -10], [12, 10], [-12, 10]]; ext(B, LAN, lan, 17.6, 21, RF); ext(B, ROOF, grow(lan, 1.5), 21, 22, RF);
    // entrance on the south: steps and a porch on four columns
    const s = R.reduce((m, p) => Math.max(m, p[1]), -1e9);
    ext(B, STEP, [[-14, s], [14, s], [14, s + 7], [-14, s + 7]], -1, 0.9, STEP);
    for (const x of [-10, -3.4, 3.4, 10]) obox(B, ST, x, s + 5, 1, 0, 1.0, 1.0, 0.9, 15.5, true);
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'szmuseumold', lat:MS.ll[0], lon:MS.ll[1], rot:0});

// ================= Shenzhen Railway Station (new station building opened October 1991) =================
// A surface station of three levels (B1, ground, first floor) with elevated waiting over the tracks: in from east and west,
// out below ground; the long-distance waiting hall on the upper level; the station square on each side; the front "like an
// open window", glass and tile on the east and west sides, the big glass arch gate under the red steel frame of the great
// canopy (maigoo; Wikipedia: 1991 building, 6 platforms / 8 tracks). OSM w174194694 (133 x 214 m) spans the tracks; the
// Guangshen line runs through it. Heights are estimates: halls to 24 m, the arch to 31 m. The arch's characters are left out.
const ST_ = {u:[0.1325, 0.9912], L:107, W:67};
const stP = (s, t) => [ST_.u[0]*s - ST_.u[1]*t, ST_.u[1]*s + ST_.u[0]*t];   // s along the tracks (south +), t across (west +)
LANDMARKS.szstation = {zh:'深圳站', en:'Shenzhen Railway Station', cat:'new', r:142, h:31, lt:{m:1, c:'#fff0d8', k:0.6},
  build(){
    const g = new THREE.Group(), B = Bt(), [ux, uz] = ST_.u;
    const TILE = {c:'#ddd6c8', m:0, lk:0.35}, GLS = {c:'#6f8a99', m:1, fh:5.5, cw:3.2}, HALL = {c:'#7d93a0', m:1, fh:6.0, cw:3.6}, ROOF = '#9a9c9a',
      REDS = {c:'#b8221c', m:0, lk:0.5}, ARCH = {c:'#8fb0c4', m:0, glow:'#ffe8c8', gk:0.55}, COL = '#bfb9ad', PLAT = '#a29d94', CAN = {c:'#c9cbc8', m:0, lk:0.35, ds:true},
      SOFF = {c:'#e6e1d5', glow:'#ffe6be', gk:0.4}, PLZ = '#b9b2a4';
    const R = (s0, s1, t0, t1) => [stP(s0, t0), stP(s1, t0), stP(s1, t1), stP(s0, t1)];
    // tracks zone (the four OSM tracks lie at t = -12, -6.5, -1.5 and 13): platforms and their canopies
    for (const [t0, t1] of [[-23, -16], [2.5, 9.5], [17, 24]]){ ext(B, PLAT, R(-104, 104, t0, t1), -0.5, 1.1, PLAT);
      for (let s = -100; s <= 100; s += 12){ const [x, z] = stP(s, (t0 + t1)/2); obox(B, COL, x, z, ux, uz, 0.5, 0.5, 1.1, 7, true); }
      const [x, z] = stP(0, (t0 + t1)/2); obox(B, CAN, x, z, ux, uz, 208, t1 - t0 + 5, 7, 7.5); }
    // the east block (main front) and the west block, full height from the ground
    ext(B, TILE, R(-104, 104, -66, -30), -1.5, 22, ROOF);
    ext(B, TILE, R(-104, 104, 30, 67), -1.5, 20, ROOF);
    // the elevated waiting hall over the tracks (first floor), on columns between the tracks
    ext(B, HALL, R(-62, 62, -30, 30), 10.5, 22, ROOF, '#c8c3b8');
    for (let s = -56; s <= 56; s += 14) for (const t of [-19.5, 6, 20.5]){ const [x, z] = stP(s, t); obox(B, COL, x, z, ux, uz, 1.4, 1.4, 1.1, 10.5, true); }
    // facades: glass bands and tiled piers on the east and west sides
    for (const [tt, out, h] of [[-66, -1, 22], [67, 1, 20]]){
      for (let s = -100; s <= 100; s += 8){ const [x, z] = stP(s, tt + out*0.25); obox(B, TILE, x, z, ux, uz, 1.6, 0.8, 0, h, true); }
      for (const [y0, y1] of [[3, 8], [11, 18]]){ const [x, z] = stP(0, tt + out*0.12); obox(B, GLS, x, z, ux, uz, 200, 0.3, y0, y1, true); } }
    // the main east front: the big glass arch gate in the middle, under the red steel frame of the great canopy
    const tE = -66.4, nA = 18, AR = 15, AY = 16;
    for (let k = 0; k < nA; k++){ const a0 = PI*k/nA, a1 = PI*(k + 1)/nA, s0 = -AR*Math.cos(a0), s1 = -AR*Math.cos(a1), y0 = AY + AR*Math.sin(a0)*1.0, y1 = AY + AR*Math.sin(a1)*1.0;
      const p0 = stP(s0, tE - 0.4), p1 = stP(s1, tE - 0.4); B.q(ARCH, [p0[0], 0.4, p0[1]], [p1[0], 0.4, p1[1]], [p1[0], y1, p1[1]], [p0[0], y0, p0[1]]);
      const q0 = stP(s0, tE - 1.2), q1 = stP(s1, tE - 1.2); B.q(TILE, [q0[0], y0, q0[1]], [q1[0], y1, q1[1]], [q1[0], y1 + 1.6, q1[1]], [q0[0], y0 + 1.6, q0[1]]); }
    for (let s = -AR + 3; s < AR; s += 3){ const [x, z] = stP(s, tE - 0.7); obox(B, TILE, x, z, ux, uz, 0.3, 0.4, 0.4, AY + Math.sqrt(Math.max(0, AR*AR - s*s)), true); }
    for (const sg of [-1, 1]){ const [x, z] = stP(sg*(AR + 2.5), tE - 1.5); obox(B, TILE, x, z, ux, uz, 5, 3, 0, 31, true); }
    // the red space-frame canopy in front of the arch: a deck with chords and posts
    const cs0 = -42, cs1 = 42, ct0 = tE - 26, ct1 = tE - 1;
    { const [x, z] = stP(0, (ct0 + ct1)/2); obox(B, CAN, x, z, ux, uz, cs1 - cs0, ct1 - ct0, 13.2, 13.6); obox(B, SOFF, x, z, ux, uz, cs1 - cs0 - 1, ct1 - ct0 - 1, 12.9, 13.2); }
    for (let s = cs0; s <= cs1; s += 6) for (const t of [ct0, (ct0 + ct1)/2, ct1]){ const a = stP(s, t); if (s + 6 <= cs1){ const b = stP(s + 6, t); LBeam(g, [a[0], 13.9, a[1]], [b[0], 13.9, b[1]], 0.22, REDS, 4); LBeam(g, [a[0], 15.6, a[1]], [b[0], 15.6, b[1]], 0.22, REDS, 4); LBeam(g, [a[0], 13.9, a[1]], [b[0], 15.6, b[1]], 0.15, REDS, 4); } }
    for (let s = cs0; s <= cs1; s += 6){ const a = stP(s, ct0), b = stP(s, ct1); LBeam(g, [a[0], 15.6, a[1]], [b[0], 15.6, b[1]], 0.2, REDS, 4); }
    for (const s of [cs0 + 3, -14, 14, cs1 - 3]){ const [x, z] = stP(s, ct0 + 3); LBeam(g, [x, 0, z], [x, 13.6, z], 0.55, REDS, 8); }
    // the east square: paving and lamps
    ext(B, PLZ, R(-104, 104, -96, -66), -1, 0.3, PLZ);
    for (let s = -90; s <= 90; s += 20){ const [x, z] = stP(s, -88); obox(B, '#7d8285', x, z, 1, 0, 0.35, 0.35, 0.3, 9, true); abox(B, {c:'#fff1d6', glow:'#ffe7b8', gk:1.6}, x - 0.5, x + 0.5, 9, 9.6, z - 0.5, z + 0.5); }
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'szstation', lat:22.534486, lon:114.112111, rot:0});

// ================= Luohu Port (the joint inspection building, Lo Wu crossing) =================
// The border crossing beside the railway station, integrated with Lo Wu station (MTR) and Luohu station (Shenzhen Metro); the
// joint inspection building, the station and the footbridge date from the 1983 rebuilding programme (maigoo); the footbridge to
// Hong Kong is now "an enclosed, two-storey walkway" over the Shenzhen River, beside the rail truss bridge (Wikipedia, Lo Wu
// Bridge). Volumes from the OSM parts of w189787553: the main block 0-28.5 m with the raised hall 0-34.7 m, the 9.9 m wing to
// the south (towards the bridge).
const LP = {main:[[-57.3, -39.7], [40.0, -55.4], [51.9, 17.6], [29.2, 21.3], [29.8, 24.9], [-22.7, 33.4], [-23.3, 29.7], [-45.4, 33.3]],
  hall:[[-46.5, -31.9], [32.5, -44.6], [41.7, 12.1], [-37.3, 24.8]], hall2:[[-41.3, -28.1], [28.7, -39.4], [36.5, 8.4], [-33.6, 19.6]],
  wing:[[-45.4, 33.3], [-23.3, 29.7], [-22.7, 33.4], [29.8, 24.9], [29.2, 21.3], [51.9, 17.6], [52.8, 23.3], [30.0, 26.9], [35.4, 60.4], [23.6, 62.3], [24.1, 65.6], [9.5, 67.6], [9.1, 64.6], [-1.9, 66.4], [-6.8, 36.6], [-22.0, 39.0], [-22.5, 35.4], [-44.5, 38.9]]};
LANDMARKS.szluohuport = {zh:'罗湖口岸', en:'Luohu Port (Lo Wu Control Point)', cat:'new', r:75, h:35, lt:{m:1, c:'#eef4ff', k:0.6},
  build(){
    const g = new THREE.Group(), B = Bt();
    const WALL = {c:'#d9d8d2', m:0, lk:0.35}, GL = {c:'#6f8796', m:1, fh:4.6, cw:3.4}, ROOF = '#9b9d9b', HALLC = {c:'#a9bcc6', m:1, fh:6.0, cw:3.8},
      HR = {c:'#e3e2dc', m:0, lk:0.5, glow:'#eaf2ff', gk:0.25}, WING = {c:'#7f95a2', m:1, fh:4.8, cw:3.4}, CAN = {c:'#cfd2d0', m:0, lk:0.4},
      LOB = {c:'#52616a', glow:'#ffe6c0', gk:0.6};
    ext(B, WALL, LP.main, -1.5, 28.5, ROOF);
    // glazed bands round the main block (the halls behind), pale piers
    ext(B, GL, grow(LP.main, 0.15), 4.5, 10.5, null); ext(B, GL, grow(LP.main, 0.15), 14.5, 25.5, null);
    mullions(B, WALL, grow(LP.main, 0.15), 6.0, 0.6, 1.0, 0, 28.5, true);
    ext(B, LOB, grow(LP.main, 0.2), 0, 4.5, null);
    // the raised hall roof (34.7 m) with its lit clerestory
    ext(B, HALLC, LP.hall2, 28.5, 33.2, ROOF);
    ext(B, HR, grow(LP.hall, -0.5), 33.2, 34.7, ROOF);
    // the south wing towards the river
    ext(B, WING, LP.wing, -1.5, 9.9, ROOF); bands(B, CAN, LP.wing, [9.7], 0.6, 0.4);
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'szluohuport', lat:22.530976, lon:114.113333, rot:0});
