// ================= Marina Bay Cruise Centre Singapore (2012, RSP + Bermello Ajamil & Partners), Marina Coastal Drive =================
// Wikiwand / RSP / MBCCS: opened Oct 2012, 3 floors, a low terminal with "cubistic, undulating roofs inspired by waves" that form a
// grand entrance where they meet the ground-transport hall; a 395 m x 18 m berth (OSM 'pier' area, drawn by the app), car park behind.
// Plans: OSM w510913019 (terminal, 14.4 m) with its five raised roof parts (17.1 / 20.4 m), and the car park w187888615 with its
// three deck parts (10.5 / 13.8 / 17.1 m). The raised parts are modelled as wedges rising towards the sea (wave crests); the
// glazing split and the colours are estimates. Gangways / aerobridges on the berth are left out (positions not in the data).
// Night: the glass halls glow, the roof waves floodlit cool white.
{
const A0 = [1.265726, 103.860819];
const TER0 = [[86.6,35.4],[10.2,91.1],[-90.1,-42.9],[-80.0,-42.3],[-74.6,-44.1],[-20.3,-83.2],[-17.9,-92.1],[-17.3,-97.5]];
const WAV0 = [[[4.8,-49.4],[18.5,-30.5],[-28.0,4.5],[-42.9,-14.5],[-18.5,-21.0],[-10.7,-25.7]], [[40.6,-19.8],[47.2,-10.9],[23.9,6.3],[16.8,-3.2],[29.3,-6.2],[32.9,-8.5]],
  [[50.8,21.7],[59.1,32.4],[41.8,44.3],[34.7,34.8],[46.0,32.4]], [[21.5,42.5],[29.3,53.1],[12.6,65.0],[5.4,55.5],[16.2,53.1]], [[-5.3,13.4],[1.2,22.9],[-21.5,39.5],[-29.2,30.6],[-16.7,27.1],[-13.1,24.7]]];
const WTOP = [20.4, 20.4, 17.1, 17.1, 20.4];
const CP0 = [[-74.6,-44.1],[-150.4,-145.5],[-114.6,-156.2],[-91.3,-189.4],[-20.3,-83.2]];
const CPP0 = [[[-66.2,-118.2],[-39.4,-80.3],[-48.9,-67.8],[-65.6,-64.3],[-91.3,-101.0]], [[-86.5,-174.0],[-25.6,-86.8],[-75.2,-51.8],[-139.1,-133.1],[-103.8,-142.0]]];
const C0 = [-28, -52];
const [TER, CP, ...rest] = shAll([TER0, CP0, ...WAV0, ...CPP0], C0), WAV = rest.slice(0, 5), CPP = rest.slice(5);
LANDMARKS.sgmbcc = {zh:'滨海湾邮轮中心', en:'Marina Bay Cruise Centre Singapore', cat:'new', r:158, h:20.4,
  lt:{m:0, c:'#e6f0ff', k:0.75, e:0.8}, build(){
  const g = new THREE.Group(), B = mkB();
  const WALL = {c:'#d7d9d6', m:0}, GLS = {c:'#7f9ea6', m:0, glow:'#ffe7c4', gk:0.65}, ROOF = {c:'#c9cdcf', m:0, lk:0.5}, ROOF2 = {c:'#aeb6ba', m:0, lk:0.5}, MUL = '#e8eae8',
    FOUND = '#a9a59c', DECK = '#8c8a84', CPW = {c:'#c4c1b8', m:0, lk:0.3}, CAN = {c:'#e9ebea', m:0}, COLM = '#bcb9b0';
  // ---- terminal hall: solid base, glazed upper hall on the long sides, flat roof at 14.4 m ----
  wallP(B.p(FOUND), TER, -5, 0.3); capP(B.p(FOUND), TER, 0.3);
  prismP(B.p(WALL), TER, 0.3, 5.5);
  prismP(B.p(GLS), offP(TER, 0.8), 5.5, 13.4);
  const E = edgesF(TER);
  for (const e of E){ if (e.L < 8) continue; const n = Math.round(e.L/4.5);
    for (let k = 0; k <= n; k++) slabP(B.p(MUL), rectO(k*e.L/n - 0.15, k*e.L/n + 0.15, 5.5, 13.4), e.F, -0.8, 0.1);
    shapeP(B.p(MUL), rectO(0, e.L, 9.3, 9.7), e.F, -0.7); }
  prismP(B.p(ROOF2), offP(TER, -1.2), 13.4, 14.4);
  // ---- the roof waves: each raised part a wedge rising from the flat roof to its crest towards the sea (SE) ----
  const ax = Math.atan2(TER[0][1] - TER[1][1], TER[0][0] - TER[1][0]);   // across the building, towards the berth side
  const dx = Math.cos(ax), dz = Math.sin(ax);
  WAV.forEach((P, i) => {
    const pr = P.map(p => p[0]*dx + p[1]*dz), lo = Math.min(...pr), hi = Math.max(...pr), top = WTOP[i] + 1.5;
    const yAt = p => 14.4 + (top - 14.4)*Math.pow(Math.min(1, Math.max(0, ((p[0]*dx + p[1]*dz) - lo)/(hi - lo))), 0.8);
    const Q = offP(P, -1.0);
    // sloped roof plane + side walls (glazed clerestory under the crest)
    const tris = THREE.ShapeUtils.triangulateShape(Q.map(p => new THREE.Vector2(p[0], p[1])), []);
    for (const [a, b, c] of tris) triP(B.p(ROOF), [Q[a][0], yAt(Q[a]), Q[a][1]], [Q[b][0], yAt(Q[b]), Q[b][1]], [Q[c][0], yAt(Q[c]), Q[c][1]]);
    for (let k = 0; k < Q.length; k++){ const a = Q[k], b = Q[(k + 1) % Q.length];
      quadP(B.p(GLS), [a[0], 14.4, a[1]], [b[0], 14.4, b[1]], [b[0], yAt(b) - 0.6, b[1]], [a[0], yAt(a) - 0.6, a[1]]);
      quadP(B.p(CAN), [a[0], yAt(a) - 0.6, a[1]], [b[0], yAt(b) - 0.6, b[1]], [b[0], yAt(b) + 0.05, b[1]], [a[0], yAt(a) + 0.05, a[1]]); }
    // standing-seam ribs along the slope
    seams(Q, yAt, 0.12);
  });
  // seam lines on the flat roof (between the waves)
  function seams(Q, yf, dy){ const px = -dz, pz = dx, pr = Q.map(p => p[0]*px + p[1]*pz), ql = Q.map(p => p[0]*dx + p[1]*dz);
    const a0 = Math.min(...pr), a1 = Math.max(...pr), b0 = Math.min(...ql), b1 = Math.max(...ql);
    for (let t = a0 + 1.5; t < a1; t += 3.0){ let prev = null;
      for (let s = b0; s <= b1 + 0.01; s += 3.0){ const x = px*t + dx*s, z = pz*t + dz*s, ins = inPolyS(Q, x, z);
        const p = ins ? [x, yf([x, z]) + dy, z] : null; if (p && prev) segP(B.p(ROOF2), prev, p, 0.07, 3); prev = p; } } }
  seams(offP(TER, 1.5), () => 14.4, 0.05);
  // ---- car park: three stepped decks with open sides ----
  wallP(B.p(FOUND), CP, -5, 0.3); capP(B.p(FOUND), CP, 0.3);
  for (const [P, top] of [[CP, 10.5], [CPP[1], 13.8], [CPP[0], 17.1]]){
    for (let y = 3.5; y <= top + 0.01; y += 3.5){ const yy = Math.min(y, top); prismP(B.p(DECK), P, yy - 0.5, yy); bandAtP(B.p(CPW), P, yy - 0.5, 1.6, 0.05); }
    for (const [x, z] of alongP(P, 8)) segP(B.p(COLM), [x, 0.3, z], [x, top, z], 0.35, 4);
  }
  B.flush(g); return g; }};
const PL = LL40(A0[0], A0[1], C0[0], C0[1]);
SG_PLACES.push({type:'sgmbcc', lat:PL.lat, lon:PL.lon, rot:0});
}
