
// ======================================================================================================
// Wisma Atria (435 Orchard Road, 1986, DP Architects): a 5-level retail podium (4 above ground + basement) and a 22-storey
// office tower (offices on floors 10-22) (archello / singaporeofficespace). 2012 facelift: a faceted, crystalline glass
// enclosure up to 7.5 m in front of the old structure, ultra-clear glass with matte-aluminium cladding, a goal-post frame,
// grand monolithic stairs up to the level-2 entrances, upper-level backdrop cladding in blue horizontal strips (indesignlive,
// archello). Plan: OSM w172518503 with its parts (tower outline with stepped corners). Tower storey heights estimated.
// ======================================================================================================
{
const A0 = [1.303697, 103.833224], O = [0, 0];
const FP = sh([[-49.5,-53.5],[61.6,5.2],[37.1,54.4],[31.1,57.3],[26.4,53.8],[-8.9,21.2],[-63.8,-19.1],[-64.4,-24.5]], O);
const TW = sh([[30.5,-5.5],[49.0,4.0],[46.7,8.1],[50.2,9.9],[47.8,14.7],[52.6,17.0],[44.9,30.7],[39.5,28.3],[37.7,31.8],[35.3,30.7],[33.5,33.6],[15.0,24.1],[16.8,20.6],[14.4,19.4],[16.8,15.8],[12.0,13.5],[19.8,-0.8],[24.0,1.6],[26.4,-2.5],[28.7,-1.4]], O);
const TOPA = sh([[26.4,-2.5],[50.2,9.9],[47.8,14.7],[52.6,17.0],[44.9,30.7],[39.5,28.3],[37.7,31.8],[14.4,19.4],[16.8,15.8],[12.0,13.5],[19.8,-0.8],[24.0,1.6]], O);
const TOPB = sh([[19.8,-0.8],[52.6,17.0],[44.9,30.7],[12.0,13.5]], O);
const [LAT, LON] = LL(A0, O[0], O[1]);
LANDMARKS.sgwismaatria = {zh:'威士马广场', en:'Wisma Atria', cat:'new', r:84, h:92,
  lt:{m:0, c:'#ffeed6', k:0.3, e:0.6}, build(){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
  const ALU = '#b9bcbe', ALU2 = '#9fa3a6', BLUE = '#2f5f9a', GLC = {c:'#93b3bf', op:0.78, ds:true, glow:'#fff2dc', gk:0.35}, BACK = {c:'#4f5c66', m:1, fh:5, cw:4, lc:'#ffeccc', lk:0.8};
  const TWC = '#d9dbd8', TWG = {c:'#35546e', m:1, fh:3.8, cw:3.0}, STAIR = {c:'#cfccc4', glow:'#bcd8ff', gk:0.25}, ROOF = '#9b9a95', DARK = '#3e4448';
  const H = 21;
  footT(B, ALU2, FP);
  // podium body: original structure set back 7.5 m behind the faceted front on Orchard Road (the long NE face, edge 0)
  const FPb = FP.map(p => p.slice()); { const a = FP[0], b = FP[1], L = Math.hypot(b[0]-a[0], b[1]-a[1]), n = [(b[1]-a[1])/L, -(b[0]-a[0])/L]; for (const k of [0, 1]){ FPb[k][0] -= n[0]*7.5; FPb[k][1] -= n[1]*7.5; } }
  wallT(B.p(ALU), FPb, 0, H); flatT(B.p(ROOF), FPb, H);
  edges(FPb, (a, b, L, u, n, i) => {
    if (i === 0){
      // upper backdrop: blue horizontal strips on hollow-channel cladding (14 - 21 m)
      for (let y = 14.2; y < H; y += 1.15) panT(B.p(BLUE), a, u, n, 0, L, y, y + 0.55, 0.05);
      panT(B.p(BACK), a, u, n, 0.5, L - 0.5, 2.5, 14, -0.4);
      // the faceted glass enclosure: a folded skin of triangles, depth 2 - 7 m in front of the old line, 2.5 - 14.5 m high
      const N = 18, dep = k => 2.0 + 5.0*Math.abs(Math.sin(k*1.7 + 0.4)), top = k => 13 + 1.6*Math.abs(Math.cos(k*1.3));
      let prev = null;
      for (let k = 0; k <= N; k++){
        const t = L*k/N, d = (k === 0 || k === N) ? 0.3 : dep(k), ht = top(k);
        const bot = [a[0] + u[0]*t + n[0]*d, 2.4, a[1] + u[1]*t + n[1]*d], mid = [a[0] + u[0]*t + n[0]*(d*0.6), ht, a[1] + u[1]*t + n[1]*(d*0.6)], back = [a[0] + u[0]*t, ht + 0.6, a[1] + u[1]*t];
        if (prev){ tri(B.p(GLC), prev.bot, bot, mid); tri(B.p(GLC), prev.bot, mid, prev.mid); tri(B.p(GLC), prev.mid, mid, back); tri(B.p(GLC), prev.mid, back, prev.back);
          segP(B.p(ALU), prev.bot, bot, 0.12, 3); segP(B.p(ALU), prev.mid, mid, 0.12, 3); }
        segP(B.p(ALU), bot, mid, 0.14, 3); segP(B.p(ALU), mid, back, 0.12, 3);
        prev = {bot, mid, back};
      }
      // goal-post frame: two main columns and the beam
      for (const t of [L*0.3, L*0.7]) finT(B.p(ALU2), a, u, n, t, 1.4, 1.4, 0, 15.5, 5.5);
      { const p0 = [a[0] + u[0]*L*0.3 + n[0]*6.2, a[1] + u[1]*L*0.3 + n[1]*6.2], p1 = [a[0] + u[0]*L*0.7 + n[0]*6.2, a[1] + u[1]*L*0.7 + n[1]*6.2]; slabT(B.p(ALU2), p0, p1, 1.4, 14.6, 15.6); }
      // grand stairs up to the level-2 entrances (monolithic, also a flood barrier)
      for (let s = 0; s < 8; s++){ const dd = 7.5 + (8 - s)*0.9; panT(B.p(STAIR), a, u, n, L*0.36, L*0.64, 0, 0.3*(s + 1), dd);
        const pA = [a[0] + u[0]*L*0.36 + n[0]*dd, a[1] + u[1]*L*0.36 + n[1]*dd], pB = [a[0] + u[0]*L*0.64 + n[0]*dd, a[1] + u[1]*L*0.64 + n[1]*dd], pC = [pB[0] - n[0]*0.8, pB[1] - n[1]*0.8], pD = [pA[0] - n[0]*0.8, pA[1] - n[1]*0.8];
        flatT(B.p(STAIR), [pA, pB, pC, pD], 0.3*(s + 1)); }
      { const pA = [a[0] + u[0]*L*0.36, a[1] + u[1]*L*0.36], pB = [a[0] + u[0]*L*0.64, a[1] + u[1]*L*0.64]; flatT(B.p(STAIR), [pA, pB, [pB[0] + n[0]*1.7, pB[1] + n[1]*1.7], [pA[0] + n[0]*1.7, pA[1] + n[1]*1.7]], 2.4); }
    } else if (L > 4){
      for (let y = 5; y < H - 1; y += 5) panT(B.p(BACK), a, u, n, 1, L - 1, y, y + 2.2, 0.06);
      panT(B.p(DARK), a, u, n, 1.2, L - 1.2, 0, 4, 0.07);
    }
  });
  // office tower (22 storeys): light cladding bands, blue-grey glass ribbons, stepped-corner plan; stepped crown
  const y0 = H, y1 = 84;
  wallT(B.p(TWG), offP(TW, -0.25), y0, y1);
  for (let y = y0 + 2.4; y < y1; y += 3.8) wallT(B.p(TWC), TW, y, Math.min(y1, y + 1.4));
  edges(TW, (a, b, L, u, n) => { if (L < 3) finT(B.p(TWC), a, u, n, L/2, L, 0.3, y0, y1, -0.25); });
  flatT(B.p(ROOF), TW, y1);
  wallT(B.p(TWC), TOPA, y1, 88); flatT(B.p(ROOF), TOPA, 88);
  wallT(B.p(TWC), offP(TOPB, -2.5), 88, 92); flatT(B.p(ROOF), offP(TOPB, -2.5), 92);
  B.flush(g); return g; }};
SG_PLACES.push({type:'sgwismaatria', lat:LAT, lon:LON, rot:0});
}

// ======================================================================================================
// Lucky Plaza (304 Orchard Road): a 30-storey commercial-cum-residential building by BEP Akitek, podium opened 1977, apartment
// block 1981 (Wikipedia); an "open vertical bazaar" of stacked galleries round a high open space, wide glass shopfronts.
// Plan: OSM w172518492 (podium, 8 floors) with its parts (H-shaped apartment tower 26.4 m - roof, roof house). Podium setbacks,
// colours and the tower's balconies are not verified (kept plain: light podium bands, cream tower with window rows).
// ======================================================================================================
{
const A0 = [1.304483, 103.833981], O = [0, -5];
const FP = sh([[3.0,-44.9],[1.2,-40.8],[9.0,-36.6],[10.2,-39.6],[55.5,7.3],[57.9,17.9],[35.8,58.9],[-61.5,7.3],[-22.7,-65.7],[-12.5,-60.3]], O);
const TW = sh([[7.8,15.0],[11.4,7.3],[16.1,9.6],[20.3,3.1],[15.5,0.2],[20.3,-8.1],[43.0,4.3],[38.8,12.6],[34.6,10.2],[31.1,17.9],[36.4,20.3],[31.1,28.0]], O);
const RH = sh([[32.3,4.9],[25.1,17.9],[17.9,14.4],[25.1,1.3]], O);
const [LAT, LON] = LL(A0, O[0], O[1]);
LANDMARKS.sgluckyplaza = {zh:'幸运商业中心', en:'Lucky Plaza', cat:'new', r:84, h:97,
  lt:{m:0, c:'#ffe7c2', k:0.3, e:0.6}, build(){
  const g = new THREE.Group(), B = mkB();
  const POD = '#d8d2c6', POD2 = '#bdb5a8', GL = {c:'#56646c', m:1, fh:3.4, cw:3.2, lc:'#ffeccc', lk:0.8}, TWC = '#e6e0d2', TWG = {c:'#4a5258', m:1, fh:3.0, cw:2.6};
  const ROOF = '#9d9a93', DARK = '#3d4246';
  const H = 27;
  footT(B, POD2, FP);
  wallT(B.p(POD), FP, 0, H); flatT(B.p(ROOF), FP, H);
  wallT(B.p(POD2), FP, H, H + 1.1);
  edges(FP, (a, b, L, u, n) => {
    if (L < 4) return;
    const front = n[1] > 0.4;      // Orchard Road (south-west) frontage: wide glass shopfront bands on all 8 floors
    for (let y = 0.6, f = 0; y < H - 1; y += 3.4, f++) panT(B.p(f === 0 ? DARK : GL), a, u, n, 0.8, L - 0.8, y + 0.5, y + (front ? 2.9 : 2.0), 0.07);
    if (front) for (let y = 3.4; y < H; y += 3.4) panT(B.p(POD2), a, u, n, 0, L, y - 0.2, y + 0.3, 0.3);
  });
  // apartment tower: 22 residential floors over the 8-floor podium (~93 m), window rows on every face
  const y0 = H, y1 = H + 22*3.0;
  wallT(B.p(TWC), TW, y0, y1); flatT(B.p(ROOF), TW, y1);
  edges(TW, (a, b, L, u, n) => { for (let y = y0 + 0.9; y < y1 - 1; y += 3.0){ if (L > 5){ const k = Math.floor((L - 1.2)/2.6); for (let i = 0; i < k; i++){ const t = (L - k*2.6)/2 + i*2.6; panT(B.p(TWG), a, u, n, t + 0.35, t + 2.25, y, y + 1.5, 0.05); } } else panT(B.p(TWG), a, u, n, 0.5, L - 0.5, y, y + 1.5, 0.05); } });
  wallT(B.p(TWC), TW, y1, y1 + 1.2);
  wallT(B.p(TWC), RH, y1, y1 + 4); flatT(B.p(ROOF), RH, y1 + 4);
  B.flush(g); return g; }};
SG_PLACES.push({type:'sgluckyplaza', lat:LAT, lon:LON, rot:0});
}

// ======================================================================================================
// 313@somerset (313 Orchard Road, completed Dec 2009): eight retail levels (KONE reference) above Somerset MRT station.
// Plan: OSM w52236347 with its parts (main block 0-36.9 m, the north-east corner block 0-17.1 m, the low link to Discovery
// Walk 0-7.2 m). Facade (glass grid on Orchard Road, solid flanks) kept generic: the real cladding pattern is not verified.
// ======================================================================================================
{
const A0 = [1.301019, 103.838369], O = [0, 0];
const MAIN = sh([[31.1,15.6],[22.1,52.4],[-35.8,40.5],[-35.2,37.0],[-44.7,35.2],[-16.7,6.1],[-11.3,-6.9],[-30.4,-16.4],[-44.7,-27.7],[-29.8,-52.0],[1.8,-37.1],[21.5,-28.8],[57.9,-17.0],[50.8,6.1],[47.8,19.8]], O);
const NE = sh([[29.3,24.5],[31.1,15.6],[47.8,19.8],[46.0,28.7]], O);
const LINK = sh([[-66.8,-45.4],[-30.4,-16.4],[-11.3,-6.9],[-15.5,3.2],[-29.2,-3.3],[-49.5,-19.9],[-50.7,-18.8],[-75.8,-41.3]], O);
const [LAT, LON] = LL(A0, O[0], O[1]);
LANDMARKS.sg313somerset = {zh:'313@索美塞', en:'313@Somerset', cat:'new', r:70, h:40,
  lt:{m:0, c:'#ffeed8', k:0.3, e:0.6}, build(){
  const g = new THREE.Group(), B = mkB();
  const WALL = '#d6d3cc', WALL2 = '#b8b4ac', GL = {c:'#5f7480', m:1, fh:4.6, cw:3.6, lc:'#fff0d8', lk:0.85}, FR = '#e9e8e3', ROOF = '#999891', DARK = '#3b4045', GLC = {c:'#9fbac4', op:0.6, ds:true};
  const H = 37;
  footT(B, WALL2, MAIN);
  wallT(B.p(WALL), MAIN, 0, H); flatT(B.p(ROOF), MAIN, H); wallT(B.p(WALL2), MAIN, H, H + 1.4);
  edges(MAIN, (a, b, L, u, n) => {
    if (L < 4) return;
    const front = n[1] < -0.45;    // Orchard Road (north) frontage: a full glass wall with a white grid
    if (front){
      panT(B.p(GL), a, u, n, 0.4, L - 0.4, 0.3, H - 1, 0.25);
      const k = Math.max(2, Math.round(L/4.6)); for (let i = 0; i <= k; i++) finT(B.p(FR), a, u, n, 0.4 + (L - 0.8)*i/k, 0.35, 0.6, 0, H - 0.6, 0.25);
      for (let y = 4.6; y < H; y += 4.6) panT(B.p(FR), a, u, n, 0.4, L - 0.4, y - 0.35, y + 0.35, 0.55);
    } else {
      for (let y = 5; y < H - 2; y += 4.6) panT(B.p(GL), a, u, n, 1.2, L - 1.2, y, y + 1.6, 0.07);
      panT(B.p(DARK), a, u, n, 1.4, L - 1.4, 0, 4.4, 0.08);
    }
  });
  // the north-west corner to Orchard Road / Discovery Walk: a tall glass entrance hall with a canopy
  { const a = MAIN[9], b = MAIN[10]; // (-29.8,-52) -> (1.8,-37.1)
    const L = Math.hypot(b[0]-a[0], b[1]-a[1]), u = [(b[0]-a[0])/L, (b[1]-a[1])/L], n = [u[1], -u[0]]; const nn = n[1] > 0 ? [-n[0], -n[1]] : n;
    const P = [[a[0] + u[0]*3, a[1] + u[1]*3], [a[0] + u[0]*15, a[1] + u[1]*15], [a[0] + u[0]*15 + nn[0]*2.5, a[1] + u[1]*15 + nn[1]*2.5], [a[0] + u[0]*3 + nn[0]*2.5, a[1] + u[1]*3 + nn[1]*2.5]];
    wallT(B.p(GLC), P, 0.3, 26); flatT(B.p(FR), P, 26); wallT(B.p(FR), P, 25.4, 26.4);
    const C = [[a[0] - u[0]*2 + nn[0]*2.5, a[1] - u[1]*2 + nn[1]*2.5], [a[0] + u[0]*20 + nn[0]*2.5, a[1] + u[1]*20 + nn[1]*2.5], [a[0] + u[0]*20 + nn[0]*6, a[1] + u[1]*20 + nn[1]*6], [a[0] - u[0]*2 + nn[0]*6, a[1] - u[1]*2 + nn[1]*6]];
    flatT(B.p(FR), C, 5.5); flatT(B.p(FR), C, 5.2, true);
  }
  // the lower north-east block (0-17 m)
  footT(B, WALL2, NE); wallT(B.p(WALL), NE, 0, 17); flatT(B.p(ROOF), NE, 17);
  edges(NE, (a, b, L, u, n) => { for (let y = 5; y < 16; y += 4.6) panT(B.p(GL), a, u, n, 1, L - 1, y, y + 1.6, 0.07); });
  // (the low link block to Discovery Walk, OSM part 0-7.2 m, is left to the map: its hull would hide Pan Pacific Serviced Suites)
  B.flush(g); return g; }};
SG_PLACES.push({type:'sg313somerset', lat:LAT, lon:LON, rot:0});
}

// ======================================================================================================
// Shaw House (350 Orchard Road, corner of Scotts Road, opened 1993): a 21-storey office building on a 6-storey retail /
// entertainment podium (corporatespace), the Lido cineplex on levels 5-6 (orchard trail blog). Plan: OSM w41889431 with its
// parts: podium 0-13.8 m, the cinema levels 13.2-23.7 m over the whole site, the office tower part on the west corner (a wedge
// with a curved inner face). Tower = 15 floors over the podium, two stepped setbacks at the top (the "stepped office tower" of
// the brief's hint; the real step count is not verified); granite / glass colours not verified (neutral warm grey).
// ======================================================================================================
{
const A0 = [1.305791, 103.831507], O = [0, -2];
const FP = sh([[44.3,23.8],[38.9,30.9],[35.4,32.7],[21.6,38.0],[13.9,38.0],[6.7,36.9],[-51.8,9.6],[-53.6,5.4],[-48.2,-7.0],[-48.8,-8.2],[-27.3,-46.8],[58.6,-1.7]], O);
const TW = sh([[-52.4,4.8],[-41.1,-20.1],[-26.7,-45.6],[0.1,-29.6],[-7.0,-22.4],[-15.4,-11.8],[-25.5,5.4],[-29.7,17.3]], O);
const [LAT, LON] = LL(A0, O[0], O[1]);
LANDMARKS.sgshawhouse = {zh:'邵氏大厦', en:'Shaw House', cat:'new', r:66, h:82,
  lt:{m:0, c:'#ffe9c8', k:0.3, e:0.6}, build(){
  const g = new THREE.Group(), B = mkB();
  const GRAN = '#c9bfb2', GRAN2 = '#ada294', GL = {c:'#3e5462', m:1, fh:3.7, cw:3.0}, GLP = {c:'#5f727c', m:1, fh:4.4, cw:3.6, lc:'#ffeccc', lk:0.8}, ROOF = '#9b968d', DARK = '#3a3f43';
  const SCR = {c:'#55606b', glow:'#9ec4ff', gk:0.5};
  footT(B, GRAN2, FP);
  // podium (retail 0-13.8 m) and the cinema levels (to 23.7 m): granite with glass bands, a plain lit panel on the corner (no image)
  wallT(B.p(GRAN), FP, 0, 23.7); flatT(B.p(ROOF), FP, 23.7); wallT(B.p(GRAN2), FP, 23.7, 25);
  edges(FP, (a, b, L, u, n) => { if (L < 4) return;
    for (let y = 4.6; y < 13; y += 4.4) panT(B.p(GLP), a, u, n, 1, L - 1, y, y + 2.6, 0.07);
    panT(B.p(DARK), a, u, n, 1.2, L - 1.2, 0, 4.2, 0.08);
    panT(B.p(GRAN2), a, u, n, 0, L, 13.4, 14.2, 0.25);
    for (let x = 2; x < L - 2; x += 4) panT(B.p(GRAN2), a, u, n, x, x + 0.6, 14.2, 23.7, 0.12);
  });
  // office tower: 15 floors over the podium, stepping in twice at the top
  const steps = [[23.7, 68.1, 0], [68.1, 75.5, -2.2], [75.5, 79.2, -4.4]];
  for (const [y0, y1, d] of steps){
    const P = d ? offP(TW, d) : TW;
    wallT(B.p(GL), offP(P, -0.3), y0, y1);
    for (let y = y0 + 2.3; y < y1; y += 3.7) wallT(B.p(GRAN), P, y, Math.min(y1, y + 1.3));
    edges(P, (a, b, L, u, n) => { const k = Math.max(1, Math.round(L/3.7)); for (let i = 0; i <= k; i++) finT(B.p(GRAN), a, u, n, L*i/k, i === 0 || i === k ? 1.2 : 0.45, 0.45, y0, y1, -0.3); });
    flatT(B.p(ROOF), P, y1); wallT(B.p(GRAN2), P, y1, y1 + 1.0);
  }
  { const P = offP(TW, -9); wallT(B.p(GRAN2), P, 79.2, 82); flatT(B.p(ROOF), P, 82); }
  B.flush(g); return g; }};
SG_PLACES.push({type:'sgshawhouse', lat:LAT, lon:LON, rot:0});
}
