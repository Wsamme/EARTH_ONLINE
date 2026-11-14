
// ---------- a tapering tower loft: ring R (local [x, z]) scaled about c by sc(y) at the heights ys ----------
const scaleR = (R, c, f) => R.map(p => [c[0] + (p[0] - c[0])*f, c[1] + (p[1] - c[1])*f]);
function towerLoft(B, col, R, c, ys, sc, capCol){ const rings = ys.map(y => scaleR(R, c, sc(y)).map(p => [p[0], y, p[1]])); loft(B, col, rings, false);
  if (capCol) cap(B, capCol, scaleR(R, c, sc(ys[ys.length - 1])), ys[ys.length - 1]); }
function mullionsT(B, col, R, c, sc, step, d, w, ys){ // mullions following a taper: one fin per point along each edge
  const n = R.length;
  for (let i = 0; i < n; i++){ const a = R[i], b = R[(i + 1)%n], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 1) continue; const k = Math.max(1, Math.round(L/step));
    for (let j = 1; j < k; j++){ const f = j/k, p = [a[0] + (b[0] - a[0])*f, a[1] + (b[1] - a[1])*f], o = [p[0] - c[0], p[1] - c[1]];
      const nx = (b[1] - a[1])/L, nz = -(b[0] - a[0])/L, s = nx*o[0] + nz*o[1] > 0 ? 1 : -1;
      const pts = ys.map(y => { const q = scaleR([p], c, sc(y))[0]; return [q[0], y, q[1]]; });
      fin(B, col, pts, pts.map(() => [s*nx, s*nz]), d, w); } }
}

// ================= SEG Plaza (Hua Yi Designing Consultants, 2000) =================
// 291.6 m roof, 71 floors plus the helipad on 72/F; floors 1-10 the SEG electronics market, 11 a refuge floor, 19 / 34 / 49 / 63
// plant and refuge floors; concrete core with concrete-filled steel tube columns (Wikipedia). The original 64 m mast (355.8 m to
// the tip) was taken down after the May 2021 shaking; its replacement's height is not published, so only the roof equipment and
// the helipad are drawn. OSM w64896107: the octagonal tower (0-291.6 m) at the north-east corner of the 31.6 m podium.
const SEGT = [[-10.3, -21.2], [5.1, -36.8], [21.4, -37.0], [37.0, -21.4], [37.2, -6.2], [22.4, 9.6], [6.2, 10.4], [-10.0, -5.7]];
const SEGP = [[-37.6, -32.3], [-32.4, -37.7], [3.7, -38.1], [5.1, -36.8], [21.4, -37.0], [37.0, -21.4], [37.2, -6.2], [38.3, -5.1], [38.7, 31.7], [34.1, 36.5], [-23.1, 37.2], [-37.0, 24.1]];
LANDMARKS.szseg = {zh:'赛格广场', en:'SEG Plaza', cat:'new', r:54, h:292, lt:{m:1, c:'#e4ecf5', k:0.75},
  build(){
    const g = new THREE.Group(), B = Bt(), c = centroid(SEGT);
    const GL = {c:'#5f6b75', m:1, fh:4.05, cw:3.0}, POD = {c:'#6e7b84', m:1, fh:3.2, cw:3.6}, MUL = {c:'#b9c0c5', m:0, lk:0.3},
      BAND = '#8c959b', ROOF = '#8a8d8e', CROWN = {c:'#c3cad0', m:0, lc:'#dfeaff', lk:1.0, glow:'#cfe0ff', gk:0.3}, LOB = {c:'#45525a', glow:'#ffe6c0', gk:0.5},
      PAD = '#7b8287';
    const HT = 291.6, fy = n => 31.6 + (n - 11)*(HT - 31.6 - 8)/(71 - 11);   // floor n (11..71) base height
    // podium (the electronics market) and the tower
    ext(B, POD, SEGP, 0, 31.6, ROOF); bands(B, BAND, SEGP, [6.2, 12.6, 18.9, 25.2, 31.2], 0.7, 0.25);
    ext(B, LOB, grow(SEGP, -0.8), 0, 5.2, null);
    ext(B, GL, SEGT, 31.6, HT - 8, ROOF);
    mullions(B, MUL, SEGT, 3.0, 0.45, 0.35, 31.6, HT - 8, true);
    bands(B, BAND, SEGT, [fy(11), fy(19), fy(34), fy(49), fy(63)].map(y => y + 2), 3.4, 0.3);
    // crown: the top two storeys glazed and set in, the parapet ring, roof plant and the helipad deck
    ext(B, CROWN, grow(SEGT, -1.2), HT - 8, HT - 1.2, null);
    ext(B, CROWN, grow(SEGT, 0.3), HT - 1.2, HT, ROOF);
    ext(B, '#9ea4a8', grow(SEGT, -9), HT, HT + 4.5, ROOF);
    cylw(B, PAD, c[0], c[1], 10, 10, HT + 5.2, HT + 6.0, 24, PAD);
    for (let k = 0; k < 6; k++){ const a = k/6*TAU; LBeam(g, [c[0] + Math.cos(a)*6, HT + 4.5, c[1] + Math.sin(a)*6], [c[0] + Math.cos(a)*9.2, HT + 5.2, c[1] + Math.sin(a)*9.2], 0.3, '#8a8d8e', 6); }
    for (const p of SEGT) redLight(B, c[0] + (p[0] - c[0])*0.97, HT, c[1] + (p[1] - c[1])*0.97, 0.3);
    ext(B, '#b3ada1', grow(SEGP, 0.6), -3, 0.6, null);
    B.flush(g);
    beacons(g, SEGT.filter((p, i) => i % 2 === 0).flatMap(p => [c[0] + (p[0] - c[0])*0.97, HT + 1, c[1] + (p[1] - c[1])*0.97]), [1, 0.18, 0.1], 9);
    return g;
  }};
SG_PLACES.push({type:'szseg', lat:22.544056, lon:114.082338, rot:0});

// ================= Citymark Centre (KPF, 2022) =================
// 388.3 m, 70 floors (Wikipedia / CTBUH). The volume "gradually tapers as it ascends", with "straight lines and rigid edges" and
// "prominent grooves" where the residential terraces sit; the crown's "edges expand and extend upward" with a parapet built into
// the volume; at night vertical light strips run top to bottom (30/70 bright to dark), fading upward on the crown, with warm
// horizontal strips at the sky lobbies and illuminated triangular forms at the crown (KPF, LPA lighting). OSM w1271754601: the
// 41 m plan with the four corner grooves.
const CMR = [[-20.2, -9.2], [-15.1, -11.2], [-12.2, -15.6], [-10.5, -20.5], [10.6, -20.8], [14.8, -11.6], [20.0, -9.7], [20.2, 8.9], [15.4, 12.1], [12.6, 15.6], [10.8, 20.4], [-9.9, 20.6], [-11.5, 16.0], [-14.9, 12.9], [-20.1, 9.9]];
LANDMARKS.szcitymark = {zh:'城脉中心', en:'Citymark Centre', cat:'new', r:30, h:388.3, lt:{m:1, c:'#e8f0ff', k:0.8},
  build(){
    const g = new THREE.Group(), B = Bt(), c = centroid(CMR);
    const GL = {c:'#8fa3b2', m:1, fh:4.6, cw:3.0}, TER = {c:'#6c7a84', m:1, fh:4.6, cw:2.6}, FIN = {c:'#cfd5d9', m:0, lk:0.3},
      LINE = {c:'#d7dde0', glow:'#eef5ff', gk:1.3}, WARM = {c:'#cdbfa8', glow:'#ffd49a', gk:0.8}, CR = {c:'#b8c6d0', m:0, lc:'#e6f0ff', lk:0.9},
      TRI = {c:'#dfe6ea', glow:'#f2f8ff', gk:1.0}, ROOF = '#8b8f91', BASE = '#b7b0a3', LOB = {c:'#48545c', glow:'#ffe6c0', gk:0.55};
    const HR = 362, sc = y => 1 - 0.16*Math.pow(Math.min(y, 388.3)/388.3, 1.15);
    const ys = [0, 60, 120, 180, 240, 300, HR];
    // the shaft (the faces) and the groove infill set back 1.6 m
    towerLoft(B, GL, CMR, c, ys, sc, null);
    // crown: faces carried up past the roof as a parapet, highest at the groove edges (the triangular forms)
    const top = scaleR(CMR, c, sc(HR)), n = CMR.length;
    const edge = [0, 3, 4, 6, 7, 10, 11, 14];          // the points at the ends of the four flat faces (groove edges)
    for (let i = 0; i < n; i++){ const a = top[i], b = top[(i + 1)%n], ya = edge.includes(i) ? 388.3 : 383, yb = edge.includes((i + 1)%n) ? 388.3 : 383;
      const flat = (edge.includes(i) && edge.includes((i + 1)%n)) && Math.hypot(b[0] - a[0], b[1] - a[1]) > 15;
      if (flat){ const m = [(a[0] + b[0])/2, (a[1] + b[1])/2];
        B.q(CR, [a[0], HR, a[1]], [m[0], HR, m[1]], [m[0], 381, m[1]], [a[0], ya, a[1]]); B.q(CR, [m[0], HR, m[1]], [b[0], HR, b[1]], [b[0], yb, b[1]], [m[0], 381, m[1]]);
        // the lit triangle on each face
        const o = [m[0] - c[0], m[1] - c[1]], l = Math.hypot(...o), ox = o[0]/l*0.25, oz = o[1]/l*0.25, k = 0.55;
        B.t(TRI, [a[0] + (m[0] - a[0])*(1 - k) + ox, 368, a[1] + (m[1] - a[1])*(1 - k) + oz], [m[0] + ox, 368, m[1] + oz], [a[0] + ox*1.2, 386, a[1] + oz*1.2]);
        B.t(TRI, [m[0] + ox, 368, m[1] + oz], [b[0] + (m[0] - b[0])*(1 - k) + ox, 368, b[1] + (m[1] - b[1])*(1 - k) + oz], [b[0] + ox*1.2, 386, b[1] + oz*1.2]);
      } else B.q(CR, [a[0], HR, a[1]], [b[0], HR, b[1]], [b[0], yb, b[1]], [a[0], ya, a[1]]); }
    cap(B, ROOF, top, HR);
    ext(B, '#9aa0a3', grow(scaleR(CMR, c, sc(HR)*0.55), 0), HR, HR + 9, ROOF);
    // mullion fins; every third a vertical light strip (fading out on the crown)
    mullionsT(B, FIN, CMR, c, sc, 1.6, 0.35, 0.12, [6, 120, 240, HR]);
    mullionsT(B, LINE, CMR, c, sc, 5.2, 0.6, 0.3, [6, 120, 240, 330]);
    // terraces in the grooves: horizontal slabs every 4.6 m on the groove faces
    for (let y = 30; y < HR - 10; y += 4.6) bands(B, TER, scaleR(CMR, c, sc(y)), [y], 0.35, 0.25);
    // warm sky-lobby strips (two, positions approximate)
    bands(B, WARM, scaleR(CMR, c, sc(128)), [128], 1.0, 0.45); bands(B, WARM, scaleR(CMR, c, sc(250)), [250], 1.0, 0.45);
    // base
    ext(B, LOB, grow(CMR, -0.5), 0, 8, null); ext(B, BASE, grow(CMR, 1.0), -3, 0.8, null);
    for (const i of [0, 3, 7, 11]) redLight(B, top[i][0], 388.3, top[i][1], 0.3);
    B.flush(g);
    beacons(g, [0, 3, 7, 11].flatMap(i => [top[i][0], 389.2, top[i][1]]), [1, 0.18, 0.1], 9);
    return g;
  }};
SG_PLACES.push({type:'szcitymark', lat:22.560966, lon:114.100107, rot:0});

// ================= Baoneng Center (2018 / 2020) =================
// 327.3 m, top floor 296.4 m, 65 floors (CTBUH via skydb; Wikipedia gives 71). Beyond the height and the chamfered-square OSM
// plan w612995536 (44 m) no description of the form was found: drawn plainly, a gridded glass shaft to the top floor and an open
// crown screen to the full height.
const BNR = [[-21.9, -17.0], [-16.2, -21.9], [16.4, -22.8], [21.3, -17.0], [21.0, 16.1], [16.2, 22.8], [-13.3, 22.7], [-20.8, 18.4]];
LANDMARKS.szbaoneng = {zh:'宝能中心', en:'Baoneng Center', cat:'new', r:30, h:327.3, lt:{m:1, c:'#e6eefa', k:0.75},
  build(){
    const g = new THREE.Group(), B = Bt(), c = centroid(BNR);
    const GL = {c:'#7f97a8', m:1, fh:4.5, cw:3.0}, MUL = {c:'#c9d0d4', m:0, lk:0.3}, CR = {c:'#c2cbd1', m:0, lc:'#e2ecff', lk:1.0, glow:'#d6e6ff', gk:0.25},
      ROOF = '#8b8f91', BASE = '#b5aea2', LOB = {c:'#46525a', glow:'#ffe6c0', gk:0.55};
    const HT = 300;
    ext(B, LOB, grow(BNR, -0.6), 0, 9, null);
    ext(B, GL, BNR, 9, HT, ROOF);
    mullions(B, MUL, BNR, 3.0, 0.4, 0.3, 9, HT, true);
    bands(B, MUL, BNR, [9, 60, 120, 180, 240, HT - 0.5], 1.0, 0.2);
    // crown screen: vertical blades round the edge to 327.3 m, an inner plant block
    const G = grow(BNR, -0.4); mullions(B, CR, G, 1.8, 0.6, 0.4, HT, 327.3, true);
    bands(B, CR, G, [HT + 9, HT + 18, 326.8], 0.8, 0.3);
    ext(B, '#a2a8ab', grow(BNR, -8), HT, HT + 14, ROOF);
    ext(B, BASE, grow(BNR, 1.0), -3, 0.8, null);
    for (const i of [0, 2, 4, 6]) redLight(B, G[i][0], 327.3, G[i][1], 0.3);
    B.flush(g);
    beacons(g, [0, 2, 4, 6].flatMap(i => [G[i][0], 328.2, G[i][1]]), [1, 0.18, 0.1], 9);
    return g;
  }};
SG_PLACES.push({type:'szbaoneng', lat:22.566564, lon:114.104773, rot:0});
