

// ======================================================================================================
// Mapletree Business City, Alexandra Road (MBC I 2010, MBC II 2016; DCA Architects for MBC II). MBC II (architizer): a
// 30-storey office tower over a terraced podium with a 250 m curved facade, a planted elevated deck and landscaped terraces;
// Wikipedia's tallest list: MBC II 155 m, 30 floors. MPACT: column-free floor plates, 3.2 m floor-to-ceiling. Plans and heights:
// OSM — MBC II tower w775267652 (155 m used), its podium blocks w775267649 / 650 / 651 (9 / 7 / 6 floors, 4.5 m floor to floor),
// the site deck w775267627; MBC I — the main slab w172481794 with the tiered building parts of w775267628 (17.1 / 20.4 / 30.3 /
// 46.8 m, roof plant to 50.1 m, the lower floors open under a portal on the south face), the 18-floor blocks w327590776 and
// w172481882 and the 2-floor block w327590771 (OSM heights), the plinth w327590773, and the block w1150420152 at Alexandra Road
// (OSM h 14.4, estimated). Glazed bands with white slab edges and mullions, planted terrace edges. Night: lit office windows,
// lit crown frame on the MBC II tower.
// ======================================================================================================
{
const S = F => F;
const T2 = S([[98.7,-46.0],[125.0,-85.1],[180.5,-48.4],[154.3,-9.2]]);
const P9 = S([[52.8,-101.7],[55.8,-109.5],[109.5,-88.7],[104.1,-79.8],[116.7,-72.7],[107.1,-58.5],[86.8,-67.3],[81.4,-53.1],[46.8,-64.4],[33.7,-66.8],[42.6,-105.9]]);
const P7 = S([[-10.5,-119.5],[-9.9,-127.2],[44.4,-114.2],[34.9,-71.5],[17.0,-76.8],[-1.6,-80.4],[-11.1,-81.6],[-24.2,-81.6],[-18.3,-120.7]]);
const P6 = S([[-84.6,-132.0],[-21.2,-129.7],[-22.3,-120.8],[-18.2,-120.7],[-23.6,-85.7],[-86.4,-88.6],[-88.8,-118.9],[-84.7,-119.6]]);
const DK2 = S([[-23.6,-85.8],[-24.1,-81.7],[-11.1,-81.7],[17.0,-76.9],[34.9,-71.6],[33.8,-66.8],[46.8,-64.5],[81.4,-53.3],[86.8,-67.5],[107.2,-58.5],[98.9,-46.0],[110.8,-38.3],[108.4,-30.0],[110.8,34.1],[-144.9,-80.9],[-131.2,-112.4],[-131.8,-121.4],[-121.7,-142.0],[-123.4,-143.1],[-131.7,-143.1],[-150.9,-139.1],[-142.5,-155.2],[-118.0,-161.7],[-109.1,-161.8],[-91.1,-196.1],[24.2,-143.4],[97.6,-117.9],[139.4,-96.5],[198.0,-53.1],[196.2,-45.4],[176.4,-5.0],[154.2,-9.1],[180.4,-48.3],[125.0,-85.0],[116.6,-72.6],[104.0,-79.8],[109.3,-88.6],[55.8,-109.3],[52.7,-101.6],[42.5,-105.8],[44.3,-114.1],[-9.8,-127.1],[-10.5,-119.4],[-22.5,-120.6],[-21.4,-129.5],[-84.4,-131.9],[-84.4,-119.5],[-88.6,-118.8],[-86.2,-88.8]]);
const M_LO = S([[-50.5,38.2],[-63.6,34.6],[-63.6,-7.4],[62.3,28.1],[51.6,67.3],[1.4,53.0],[6.2,36.4],[-45.7,22.2]]);   // 0-17.1 and 19.8-30.3 (south portal open)
const M_FULL = S([[51.6,67.3],[-63.6,34.7],[-63.6,-7.4],[62.3,28.1]]);
const M_W = S([[-121.0,18.0],[-110.2,-20.5],[-63.6,-7.5],[-63.6,34.4]]);
const M_PL1 = S([[48.0,27.5],[40.2,55.4],[-63.6,26.4],[-63.6,-3.7]]), M_PL2 = S([[-97.7,-16.9],[-69.6,-9.2],[-70.8,-5.7],[-63.6,-3.7],[-63.6,26.1],[-106.6,13.9]]);
const B18A = S([[73.2,162.8],[12.1,146.8],[23.4,103.9],[84.5,120.0]]), B18B = S([[-222.4,18.6],[-125.1,61.3],[-141.9,99.9],[-239.2,57.2]]);
const B2 = S([[-3.8,126.0],[-96.5,100.6],[-90.6,79.1],[2.1,104.5]]);
const BAX = S([[116.7,4.4],[127.4,15.1],[135.2,18.6],[144.7,24.6],[137.5,43.0],[130.4,44.1],[123.8,42.4],[113.1,30.5],[110.7,30.5],[110.1,-0.9]]);
const PL1 = S([[15.9,132.5],[-4.0,126.0],[1.9,104.7],[-90.4,79.3],[-96.4,100.5],[-105.5,98.2],[-100.2,77.5],[-132.4,77.4],[-125.3,61.4],[-222.5,18.6],[-216.4,8.5],[-141.3,44.0],[-137.2,35.2],[-130.0,31.0],[-120.9,17.9],[51.5,67.1],[62.3,28.0],[115.5,57.1],[120.3,61.3],[122.1,64.3],[121.5,72.6],[119.7,77.4],[100.0,113.6],[86.9,109.5],[84.4,120.2],[23.6,104.2]]);
// clip a plan to the half plane x < c (side -1) or x >= c (side +1)
const clipX = (P, c, side) => { const out = [], inside = p => side < 0 ? p[0] < c : p[0] >= c;
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], ia = inside(a), ib = inside(b);
    if (ia) out.push(a); if (ia !== ib){ const t = (c - a[0])/(b[0] - a[0]); out.push([c, a[1] + (b[1] - a[1])*t]); } }
  return out; };
const XC = -63.6;      // MBC I: the line between the main slab's east part (sgmbc) and its west wing (sgmbcw)
const mbcBuild = (part, OX, OZ) => {
  const g = new THREE.Group(), B = mkB(), sh = P => P.map(p => [p[0] - OX, p[1] - OZ]);
  const GL = {c:'#86a3a9', m:1, fh:4.5, cw:3.0, lc:'#e8f0ff', lk:0.5}, FR = {c:'#e3e5e2', m:0, lk:0.2}, RF = '#8e9193', BASE = {c:'#a39d92', m:0, lk:0.1};
  const GRN = {c:'#5b8748', m:0, lk:0}, DECK = {c:'#b9b4aa', m:0, lk:0.1}, CROWN = {c:'#e9ecee', m:0, lc:'#f2f6ff', lk:1.2, glow:'#eef4ff', gk:0.45}, BEAC = {c:'#c22', glow:'#ff2a1a', gk:2};
  const y0 = 0, yb = -5, PLH = 4.5;
  const blk = (P, ya, yt, fh, mull) => glassBlock(B, sh(P), yb, ya, yt, {gl:GL, fr:FR, rf:RF, base:BASE, fh, mull, par:1.0});
  const deck = P => { P = sh(P); wallP(B.p(BASE), P, yb, PLH - 0.4); flatPoly(B.p(DECK), P, PLH - 0.4); edgeBands(B.p(GRN), P, PLH - 0.4, PLH + 0.4, -0.8); };
  const top18 = P => { P = sh(P); const c = cen(P); prismP(B.p(FR), B.p(RF), P.map(p => [lerp(p[0], c[0], 0.25), lerp(p[1], c[1], 0.25)]), 60.6, 64.5); };
  if (part === 'A'){
    deck(DK2); deck(clipX(PL1, XC, 1));
    // ---- MBC II: terraced podium (6 / 7 / 9 floors) and the tower
    blk(P6, y0, 27.0, 4.5, 3.0); blk(P7, y0, 31.5, 4.5, 3.0); blk(P9, y0, 40.5, 4.5, 3.0);
    for (const [P, y] of [[P6, 27.0], [P7, 31.5], [P9, 40.5]]) edgeBands(B.p(GRN), sh(P), y + 0.3, y + 1.2, -0.9);
    blk(T2, y0, 135, 4.5, 1.6);
    { const T = sh(T2), c = cen(T), inset = T.map(p => [lerp(p[0], c[0], 0.12), lerp(p[1], c[1], 0.12)]);
      // crown: an open white frame screening the roof plant, 135 -> 155 m, lit at night
      prismP(B.p(FR), B.p(RF), inset, 135, 146);
      edgeBands(B.p(CROWN), T, 136.5, 155, 0.3);
      edgeFins(B.p(CROWN), T, 135, 155, 2.4, 0.5, 0.5);
      boxP(B.p(BEAC), 0.5, 0.6, 0.5, c[0], 155, c[1], 0);
      for (const y of [36, 72, 108]) edgeBands(B.p(GRN), T, y - 0.2, y + 0.9, 0.5); }
    // ---- MBC I main slab (east of XC): tiered, open portal at the south face on the lower floors
    blk(M_LO, y0, 30.3, 4.4, 3.0);
    glassBlock(B, sh(M_FULL), 16.5, 16.5, 20.4, {gl:GL, fr:FR, rf:RF, fh:4.4, mull:3.0, par:0});
    glassBlock(B, sh(M_FULL), 29.7, 29.7, 46.8, {gl:GL, fr:FR, rf:RF, fh:4.4, mull:3.0});
    flatPoly(B.p(FR), sh(M_FULL), 29.7); flatPoly(B.p(FR), sh(M_FULL), 16.5);
    prismP(B.p(FR), B.p(RF), sh(M_PL1), 46.8, 50.1);
    { const v = sh([[-45.7,22.2],[6.2,36.4],[1.4,53.0],[-50.5,38.2]]);
      for (let k = 0; k <= 6; k++){ const t = k/6, a = [lerp(v[3][0], v[2][0], t), lerp(v[3][1], v[2][1], t)]; boxP(B.p(FR), 1.2, 29.7, 1.2, a[0], 0, a[1], 0); } }
    blk(B18A, y0, 60.6, 3.37, 2.0); top18(B18A); blk(BAX, y0, 14.4, 4.6, 3.0);
  } else {
    deck(clipX(PL1, XC, -1));
    blk(M_W, y0, 46.8, 4.4, 3.0); prismP(B.p(FR), B.p(RF), sh(M_PL2), 46.8, 50.1);
    blk(B18B, y0, 60.6, 3.37, 2.0); top18(B18B); blk(B2, y0, 8.5, 4.2, 3.0);
  }
  B.flush(g);
  return g; };
// sgmbc: MBC II and the east part of MBC I; origin at the centre of its extent (ref point + (23.5, -16.5))
LANDMARKS.sgmbc = {zh:'丰树商业城', en:'Mapletree Business City', cat:'new', r:216, h:155, lt:{m:1, c:'#e8f0ff', k:0.6}, build(){ return mbcBuild('A', 23.5, -16.5); }};
SG_PLACES.push({type:'sgmbc', lat:1.275549, lon:103.799611, rot:0});
// sgmbcw (label:false): the west wing of MBC I's main slab and the west 18-floor block, split off so that the convex hull of the
// model does not cover the low buildings between MBC I and MBC II (Skylight Building etc.); origin = ref point + (-118.5, 52.8)
LANDMARKS.sgmbcw = {zh:'丰树商业城（西座）', en:'Mapletree Business City I (west blocks)', label:false, cat:'new', r:138, h:65, lt:{m:1, c:'#e8f0ff', k:0.6}, build(){ return mbcBuild('B', -118.5, 52.8); }};
SG_PLACES.push({type:'sgmbcw', lat:1.274922, lon:103.798335, rot:0});
}

// ======================================================================================================
// Keppel Bay Bridge (2008; DCA Architects and TY Lin International; 250 m, Singapore's longest cable-stayed bridge — wikipedia;
// Keppel fact sheet: a main pylon with seven asymmetrical stay cables rising 50 m above the sea, pedestrian walkways on both
// sides, white surfaces, programmable LED lighting; Monash bridge db: steel deck, maximum span 190 m). Alignment = the OSM road
// and the two footway lines (deck ~17 m wide), all hidden under the model and replaced by its own deck (gently cambered, 9 m at
// mid-span — the app's footway profile). The pylon is placed 60 m from the Keppel Island end so that the main span is 190 m;
// WHICH END carries the pylon is not stated by any source found (from recollection of photos: the island end) — check.
// Night: LED colour drift on the white deck, pylon and stays (anim 'cycle').
// ======================================================================================================
{
const LAT = 1.26405, LON = 103.81415, RR = 140;
LANDMARKS.sgkeppelbaybr = {zh:'吉宝湾大桥', en:'Keppel Bay Bridge', cat:'new', r:RR, h:50, lt:{m:0, c:'#f2f5ff', k:0.85, e:0.75, anim:'cycle', c2:'#7fb6ff'}, build(){
  const g = new THREE.Group(), B = mkB();
  const WH = {c:'#f0f1ee', m:0, lk:0.9}, ASP = {c:'#4c4e50', m:0, lk:0}, PAV = {c:'#b8b2a6', m:0, lk:0.1}, LINE = {c:'#e8e8e0', m:0, lk:0.2};
  const CAB = {c:'#d9dcdc', m:0, lk:1.0}, CON = {c:'#c9c5bb', m:0, lk:0.3}, LED = {c:'#e6eef5', glow:'#bcd8ff', gk:0.9}, RAIL = {c:'#9aa0a4', m:0, lk:0.3};
  const A = [98.0, -42.5], Z = [-121.0, 50.5], L0 = Math.hypot(Z[0] - A[0], Z[1] - A[1]), d = [(Z[0] - A[0])/L0, (Z[1] - A[1])/L0], n = [-d[1], d[0]];
  const E = (250 - L0)/2, S0 = -E, S1 = L0 + E, LEN = S1 - S0;
  const pt = (s, w, y) => [A[0] + d[0]*s + n[0]*w, y, A[1] + d[1]*s + n[1]*w];
  const yD = s => 1.4 + 7.6*(1 - Math.pow(2*(s - S0)/LEN - 1, 2));
  const HW = 8.6, ds = 2.5;
  { const as = B.p(ASP), pv = B.p(PAV), wh = B.p(WH), ln = B.p(LINE), ld = B.p(LED), rl = B.p(RAIL);
    for (let s = S0; s < S1 - 0.01; s += ds){ const s2 = Math.min(S1, s + ds), y1 = yD(s), y2 = yD(s2);
      quadP(as, pt(s, -5.6, y1), pt(s2, -5.6, y2), pt(s2, 5.6, y2), pt(s, 5.6, y1));
      for (const [w0, w1] of [[-HW, -5.6], [5.6, HW]]) quadP(pv, pt(s, w0, y1 + 0.18), pt(s2, w0, y2 + 0.18), pt(s2, w1, y2 + 0.18), pt(s, w1, y1 + 0.18));
      for (const w of [-5.6, 5.6]) quadP(wh, pt(s, w, y1), pt(s2, w, y2), pt(s2, w, y2 + 0.18), pt(s, w, y1 + 0.18));
      // box girder: soffit and the white fascias
      quadP(wh, pt(s, -HW, y1 - 1.9), pt(s2, -HW, y2 - 1.9), pt(s2, HW, y2 - 1.9), pt(s, HW, y1 - 1.9));
      for (const w of [-HW, HW]) quadP(wh, pt(s, w, y1 - 1.9), pt(s2, w, y2 - 1.9), pt(s2, w, y2 + 0.2), pt(s, w, y1 + 0.2));
      // lane lines (dashed centre, solid edges) — plain paint, no text
      if (Math.round(s/ds) % 2 === 0) quadP(ln, pt(s, -0.08, y1 + 0.02), pt(s2, -0.08, y2 + 0.02), pt(s2, 0.08, y2 + 0.02), pt(s, 0.08, y1 + 0.02));
      for (const w of [-5.3, 5.3]) quadP(ln, pt(s, w - 0.07, y1 + 0.02), pt(s2, w - 0.07, y2 + 0.02), pt(s2, w + 0.07, y2 + 0.02), pt(s, w + 0.07, y1 + 0.02));
      // LED strip along the fascia
      for (const w of [-HW - 0.03, HW + 0.03]) quadP(ld, pt(s, w, y1 - 0.7), pt(s2, w, y2 - 0.7), pt(s2, w, y2 - 0.45), pt(s, w, y1 - 0.45));
    }
    // parapets: posts, handrail; crash barrier between road and walkway
    for (const w of [-HW + 0.1, HW - 0.1]){ const top = []; for (let s = S0; s <= S1 + 0.01; s += 2.5){ const y = yD(s) + 0.18; segP(rl, pt(s, w, y), pt(s, w, y + 1.15), 0.05, 4); top.push(pt(s, w, y + 1.15)); } polyP(wh, top, 0.08, 4);
      for (const hh of [0.4, 0.8]){ const q = []; for (let s = S0; s <= S1 + 0.01; s += 5) q.push(pt(s, w, yD(s) + 0.18 + hh)); polyP(rl, q, 0.03, 3); } }
    for (const w of [-5.75, 5.75]){ const q = []; for (let s = S0; s <= S1 + 0.01; s += 5) q.push(pt(s, w, yD(s) + 0.55)); polyP(wh, q, 0.2, 4); }
    // lamp posts every 25 m on both walkways
    for (let s = S0 + 10; s < S1 - 5; s += 25) for (const w of [-HW + 0.4, HW - 0.4]){ const y = yD(s) + 0.18; segP(rl, pt(s, w, y), pt(s, w, y + 7), 0.09, 5); boxP(B.p(LED), 0.5, 0.25, 0.5, pt(s, w, 0)[0], y + 7, pt(s, w, 0)[2], 0); }
  }
  // ---- piers and abutments
  { const cc = B.p(CON);
    for (const s of [S0 + 3, S1 - 3]){ const c = pt(s, 0, 0); boxP(cc, 6, yD(s) + 3, 2*HW + 1, c[0], -3, c[2], Math.atan2(-d[1], d[0])); }
    const sP = S1 - 60; for (const w of [-4.5, 4.5]){ const c = pt(sP + 3, w, 0); boxP(cc, 3.5, yD(sP) - 1.9 + 4, 3.5, c[0], -4, c[2], Math.atan2(-d[1], d[0])); } }
  // ---- the pylon: a single white tapered mast on the deck axis, leaning back towards the island; seven stays to the main span
  { const sP = S1 - 60, base = pt(sP, 0, yD(sP)), lean = 0.27, H = 50 - yD(sP), wh = B.p(WH);
    const topP = [base[0] + d[0]*lean*H, 50, base[2] + d[1]*lean*H];
    const sec = (t) => { const p = mix(base, topP, t), a = lerp(2.0, 0.9, t), b = lerp(3.2, 1.4, t); return [p, a, b]; };
    const N = 12; for (let i = 0; i < N; i++){ const [p0, a0, b0] = sec(i/N), [p1, a1, b1] = sec((i+1)/N);
      const C = (p, a, b) => [[p[0] - d[0]*a - n[0]*b, p[1], p[2] - d[1]*a - n[1]*b], [p[0] + d[0]*a - n[0]*b, p[1], p[2] + d[1]*a - n[1]*b], [p[0] + d[0]*a + n[0]*b, p[1], p[2] + d[1]*a + n[1]*b], [p[0] - d[0]*a + n[0]*b, p[1], p[2] - d[1]*a + n[1]*b]];
      const R0 = C(p0, a0, b0), R1 = C(p1, a1, b1); for (let k = 0; k < 4; k++){ const j = (k + 1) % 4; quadP(wh, R0[k], R0[j], R1[j], R1[k]); } }
    { const C = (p, a, b) => [[p[0] - d[0]*a - n[0]*b, p[1], p[2] - d[1]*a - n[1]*b], [p[0] + d[0]*a - n[0]*b, p[1], p[2] + d[1]*a - n[1]*b], [p[0] + d[0]*a + n[0]*b, p[1], p[2] + d[1]*a + n[1]*b], [p[0] - d[0]*a + n[0]*b, p[1], p[2] - d[1]*a + n[1]*b]];
      const R1 = C(topP, 0.9, 1.4); quadP(wh, R1[0], R1[1], R1[2], R1[3]); }
    // pylon foot on the pier below the deck
    segP(B.p(CON), [base[0], -4, base[2]], [base[0], base[1] - 1.9, base[2]], 2.0, 6);
    // stays: anchored up the top third of the pylon, landing on the deck axis (median) every ~22 m of the main span
    const cb = B.p(CAB), ld = B.p(LED);
    for (let k = 0; k < 7; k++){ const t = 0.62 + k*0.055, p = mix(base, topP, t), s = sP - 24 - k*22.5, q = pt(s, 0, yD(s) + 0.3);
      segP(cb, p, q, 0.11, 5); segP(ld, [p[0], p[1] - 0.2, p[2]], [q[0], q[1] + 0.15, q[2]], 0.03, 3); }
    // median strip under the stays
    const md = B.p(WH); for (let s = sP - 182; s < sP + 4; s += 2.5){ const s2 = s + 2.5, y1 = yD(s), y2 = yD(s2); quadP(md, pt(s, -0.7, y1 + 0.25), pt(s2, -0.7, y2 + 0.25), pt(s2, 0.7, y2 + 0.25), pt(s, 0.7, y1 + 0.25)); }
  }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'sgkeppelbaybr', lat:1.26405, lon:103.81415, rot:0});
}

// ======================================================================================================
// Alexandra Arch (2008, Southern Ridges; NLB Infopedia: 80 m long, 4 m wide, steel and granite, designed like an open fig leaf —
// a curved deck meeting an arch tilted at 70 degrees; lighting.co.jp: indirect washes cycling every 20 minutes from warm white
// to sunset orange to midnight blue). Deck = the OSM footway "Alexandra Arch" (the curved span over Alexandra Road and its west
// switchback ramp) at the app's deck heights (6.6 m over the road), hidden under the model and replaced. The white steel arch
// springs from the two ends of the span and leans over the deck (70 degrees from horizontal) towards the outside of the curve,
// with hangers to the deck edge; arch rise above the deck (~11 m) is an ESTIMATE. Granite-clad abutments; Forest Walk (app)
// continues from the east end at 6.6 m.
// ======================================================================================================
{
const LAT = 1.280189, LON = 103.802439, RR = 61;
const SPAN = [[-15.3,-9.6,3.8],[-3.5,-2.1,5.0],[8.3,5.3,6.2],[27.1,14.5,6.6],[39.5,17.6,6.6],[51.9,20.7,6.6]];
const RAMP = [[-23.1,7.6,0.4],[-7.8,11.5,1.8],[-13.8,-0.4,3.0],[-15.3,-9.6,3.8]];
LANDMARKS.sgalexarch = {zh:'亚历山大拱桥', en:'Alexandra Arch', cat:"new", r:RR, h:16, lt:{m:0, c:"#fff2dc", k:0.9, e:0.8, anim:'cycle', c2:'#ff9a4a'}, build(){
  const g = new THREE.Group(), B = mkB();
  const WH = {c:'#f1f1ee', m:0, lk:1.0}, DECK = {c:'#a7a39b', m:0, lk:0.2}, STL = {c:'#d9dbdb', m:0, lk:0.6}, GRA = {c:'#8d8a86', m:0, lk:0.3};
  const RL = {c:'#7c8286', m:0, lk:0.3}, LED = {c:'#f0e6d4', glow:'#ffd9a0', gk:0.8};
  const yG = -0.6, W = 2.0;
  // smoothed centreline with heights
  const path = (Q, k) => { const P = chaikinOpen(Q.map(p => [p[0], p[1]]), k), H = chaikinOpen(Q.map(p => [p[2], 0]), k).map(p => p[0]); return P.map((p, i) => [p[0], H[i] + yG, p[1]]); };
  const deck = (C, cols) => {
    const dk = B.p(DECK), wh = B.p(WH), rl = B.p(RL), ld = B.p(LED), L = [], R = [];
    for (let i = 0; i < C.length; i++){ const a = C[Math.max(0, i - 1)], b = C[Math.min(C.length - 1, i + 1)], dx = b[0] - a[0], dz = b[2] - a[2], l = Math.hypot(dx, dz) || 1, nx = -dz/l, nz = dx/l;
      L.push([C[i][0] + nx*W, C[i][1], C[i][2] + nz*W, nx, nz]); R.push([C[i][0] - nx*W, C[i][1], C[i][2] - nz*W, nx, nz]); }
    for (let i = 0; i < C.length - 1; i++){ const a = L[i], b = L[i+1], c = R[i+1], e = R[i];
      quadP(dk, a, b, c, e); quadP(wh, [a[0], a[1] - 0.9, a[2]], [b[0], b[1] - 0.9, b[2]], [c[0], c[1] - 0.9, c[2]], [e[0], e[1] - 0.9, e[2]]);
      for (const [p, q] of [[a, b], [e, c]]){ quadP(wh, [p[0], p[1] - 0.9, p[2]], [q[0], q[1] - 0.9, q[2]], [q[0], q[1] + 0.1, q[2]], [p[0], p[1] + 0.1, p[2]]);
        quadP(ld, [p[0], p[1] - 0.6, p[2]], [q[0], q[1] - 0.6, q[2]], [q[0], q[1] - 0.45, q[2]], [p[0], p[1] - 0.45, p[2]]); } }
    for (const S of [L, R]){ const top = []; for (let i = 0; i < S.length; i++){ const p = S[i]; if (i % 2 === 0) segP(rl, [p[0], p[1], p[2]], [p[0], p[1] + 1.2, p[2]], 0.04, 4); top.push([p[0], p[1] + 1.2, p[2]]); }
      polyP(B.p(STL), top, 0.06, 4); const mid = S.map(p => [p[0], p[1] + 0.6, p[2]]); polyP(rl, mid, 0.025, 3); }
    return {L, R};
  };
  const CS = path(SPAN, 3), CR = path(RAMP, 2);
  const span = deck(CS); deck(CR);
  // ramp columns and the span's end piers / granite abutments
  { const gr = B.p(GRA); for (let i = 1; i < CR.length - 1; i += 2){ const p = CR[i]; if (p[1] - yG > 0.8) segP(gr, [p[0], yG - 1, p[2]], [p[0], p[1] - 0.9, p[2]], 0.35, 6); }
    for (const p of [CS[0], CS[CS.length - 1]]) boxP(gr, 5.2, p[1] - yG + 0.5, 5.2, p[0], yG - 1.5, p[2], 0); }
  // the tilted arch: springing from the deck ends, its plane leaning 20 degrees off vertical towards the convex (south) side
  { const a = CS[0], b = CS[CS.length - 1], ch = [b[0] - a[0], b[2] - a[2]], cl = Math.hypot(ch[0], ch[1]), cu = [ch[0]/cl, ch[1]/cl], out = [-cu[1], cu[0]];   // out = right of a->b = south side
    const tilt = 20*PI/180, rise = 11.5, st = B.p(WH), hg = B.p(STL), N = 32, pts = [];
    for (let i = 0; i <= N; i++){ const t = i/N, base = [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)], h = rise*Math.sin(PI*t)*(1 - 0.08*Math.pow(Math.sin(PI*t), 6));
      pts.push([base[0] + out[0]*h*Math.sin(tilt), base[1] + h*Math.cos(tilt), base[2] + out[1]*h*Math.sin(tilt)]); }
    // flattened box section: two tubes side by side
    for (const o of [-0.35, 0.35]) polyP(st, pts.map(p => [p[0] + cu[0]*0 - out[1]*0 + out[0]*o*0.2, p[1] + o, p[2] + out[1]*o*0.2]), 0.42, 6);
    // hangers from the arch to the nearer deck edge
    const E = span.L; for (let i = 3; i < N - 2; i += 2){ const p = pts[i]; let best = E[0], bd = 1e9; for (const q of [...span.L, ...span.R]){ const dd = Math.hypot(q[0] - p[0], q[2] - p[2]); if (dd < bd){ bd = dd; best = q; } } segP(hg, p, [best[0], best[1] + 1.2, best[2]], 0.05, 3); }
  }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'sgalexarch', lat:1.280189, lon:103.802439, rot:0});
}

// ======================================================================================================
// Reflections at Bukit Chandu, 31-K Pepys Road (NHB: built 1930 for senior British staff of the Opium Packing Plant, in the style
// of the black-and-white colonial bungalows with art-deco elements; opened 2002 as a WWII interpretive centre on the Battle of
// Pasir Panjang). URA conservation portal: a two-storey Black and White bungalow, symmetrical about the entrance axis; main
// hip-and-gable roof in clay tiles; a front verandah with a full-length open corridor behind it on the upper floor;
// segmental arches on the driveway porch and along the first-storey corridor; timber louvred doors and windows; timber, glass,
// clay tiles and copper. Plan = OSM w121881930 (28.6 x 13.9 m block with the porch projecting 6 m on the south-west front).
// Storey heights are estimates. Night: soft warm floodlight (breathe). No people, no names.
// ======================================================================================================
{
const LAT = 1.279508, LON = 103.794117, RR = 24;
const A0 = [-5.2,-15.8], B0 = [16.2,3.2], C0 = [6.7,13.3];
LANDMARKS.sgbukitchandu = {zh:'鸦片山之役纪念馆', en:'Reflections at Bukit Chandu', cat:'old', r:RR, h:13, lt:{m:0, c:'#ffe3b8', k:0.7, e:0.7, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB();
  const WHT = {c:'#f3f1ea', m:0, lk:0.75}, BLK = {c:'#2a2a2a', m:0, lk:0.1}, TILE = {c:'#9e4e36', m:0, lk:0.3}, WIN = {c:'#3c4247', glow:'#ffd9a6', gk:0.35};
  const BASE = {c:'#a69f90', m:0, lk:0.1}, FL = '#c9c1b0', CU = {c:'#5e8f7e', m:0, lk:0.2};
  const ux = [B0[0] - A0[0], B0[1] - A0[1]], Lu = Math.hypot(ux[0], ux[1]), ax = [ux[0]/Lu, ux[1]/Lu], vx = [C0[0] - B0[0], C0[1] - B0[1]], Lv = Math.hypot(vx[0], vx[1]), av = [vx[0]/Lv, vx[1]/Lv];
  const c = [(A0[0] + C0[0])/2, (A0[1] + C0[1])/2], hu = Lu/2, hv = Lv/2;
  const P = (u, v) => [c[0] + ax[0]*u + av[0]*v, c[1] + ax[1]*u + av[1]*v];            // +v = towards the porch side (south-west)
  const ry = Math.atan2(-ax[1], ax[0]);
  const H1 = 4.2, H2 = 8.0, EV = 8.4, RID = 12.6, VER = 2.4;
  const outer = [P(-hu, -hv), P(hu, -hv), P(hu, hv), P(-hu, hv)], core = [P(-hu, -hv), P(hu, -hv), P(hu, hv - VER), P(-hu, hv - VER)];
  wallP(B.p(BASE), outer, -5, 0.7); flatPoly(B.p(FL), outer, 0.7);
  // white rendered ground floor, black-timber-framed upper floor (the "black and white" look), black string course
  wallP(B.p(WHT), core, 0.7, H1); wallP(B.p(WHT), core, H1, EV);
  edgeBands(B.p(BLK), core, H1 - 0.2, H1 + 0.25, 0.04);
  edgeFins(B.p(BLK), core, H1 + 0.25, EV, 1.6, 0.16, 0.06);
  edgeBands(B.p(BLK), core, EV - 0.45, EV, 0.05);
  for (const [y0, y1] of [[1.3, H1 - 0.7], [H1 + 0.8, EV - 0.8]]) edgeFins(B.p(WIN), core, y0, y1, 2.6, 1.0, 0.07);
  flatPoly(B.p(FL), outer, H1 + 0.02);
  // front verandah: segmental-arched ground-floor corridor, upper open corridor with black posts and balustrade
  { const wh = B.p(WHT), bk = B.p(BLK), nb = 7;
    for (let k = 0; k <= nb; k++){ const u = lerp(-hu + 0.4, hu - 0.4, k/nb), p = P(u, hv - 0.3); boxP(wh, 0.6, H1 - 0.7, 0.6, p[0], 0.7, p[1], ry); boxP(bk, 0.22, EV - H1, 0.22, p[0], H1, p[1], ry); }
    for (let k = 0; k < nb; k++){ const u0 = lerp(-hu + 0.4, hu - 0.4, k/nb), u1 = lerp(-hu + 0.4, hu - 0.4, (k+1)/nb), m = 10;
      for (let i = 0; i < m; i++){ const t0 = i/m, t1 = (i+1)/m, s0 = Math.sin(PI*t0)*0.55, s1 = Math.sin(PI*t1)*0.55;
        const p0 = P(lerp(u0, u1, t0), hv - 0.3), p1 = P(lerp(u0, u1, t1), hv - 0.3);
        quadP(wh, [p0[0], H1 - 1.2 + s0, p0[1]], [p1[0], H1 - 1.2 + s1, p1[1]], [p1[0], H1, p1[1]], [p0[0], H1, p0[1]]); } }
    edgeBands(bk, [P(-hu, hv - 0.3), P(hu, hv - 0.3), P(hu, hv - 0.31), P(-hu, hv - 0.31)], H1 + 0.9, H1 + 1.05, 0);
    for (let k = 0; k <= 40; k++){ const p = P(lerp(-hu, hu, k/40), hv - 0.3); boxP(bk, 0.05, 0.9, 0.05, p[0], H1, p[1], ry); } }
  // the main hip-and-gable roof (clay tiles), copper finials at the corners
  hipP(B.p(TILE), c, ax, hu, hv, EV, RID, 0.9);
  { const gb = B.p(WHT), r0 = Math.max(0, hu - hv);
    for (const s of [-1, 1]){ const t = [c[0] + ax[0]*r0*s, RID, c[1] + ax[1]*r0*s], k = 0.45, q = [P(s*(r0 + hv*k), -hv*k), P(s*(r0 + hv*k), hv*k)];
      const yq = RID - (RID - EV)*k, ap = P(s*(r0 + hv*k), 0), apex = [ap[0], RID, ap[1]], qa = [q[0][0], yq, q[0][1]], qb = [q[1][0], yq, q[1][1]];
      triP(gb, qa, qb, apex); triP(B.p(TILE), t, apex, qa); triP(B.p(TILE), t, qb, apex); } }
  for (const [u, v] of [[-hu - 0.9, -hv - 0.9], [hu + 0.9, -hv - 0.9], [hu + 0.9, hv + 0.9], [-hu - 0.9, hv + 0.9]]){ const p = P(u, v); segP(B.p(CU), [p[0], EV - 0.1, p[1]], [p[0], EV + 0.7, p[1]], 0.07, 4); }
  // the projecting two-storey porch on the axis: segmental driveway arch below, room above, its own gable roof
  { const pu = 5.45, pv0 = hv, pv1 = hv + 6.0, PR = [P(-pu, pv0), P(pu, pv0), P(pu, pv1), P(-pu, pv1)], wh = B.p(WHT), bk = B.p(BLK);
    wallP(B.p(BASE), PR, -5, 0.5); flatPoly(B.p(FL), PR, 0.5);
    for (const s of [-1, 1]) for (const v of [pv0 + 0.5, pv1 - 0.5]){ const p = P(s*(pu - 0.5), v); boxP(wh, 1.0, H1 - 0.5, 1.0, p[0], 0.5, p[1], ry); }
    // segmental arch spandrels on the three open faces
    for (const [u0, u1, v0, v1] of [[-pu, pu, pv1, pv1], [-pu, -pu, pv0, pv1], [pu, pu, pv0, pv1]]){ const m = 12;
      for (let i = 0; i < m; i++){ const t0 = i/m, t1 = (i+1)/m, s0 = Math.sin(PI*t0)*0.9, s1 = Math.sin(PI*t1)*0.9;
        const p0 = P(lerp(u0, u1, t0), lerp(v0, v1, t0)), p1 = P(lerp(u0, u1, t1), lerp(v0, v1, t1));
        quadP(wh, [p0[0], H1 - 1.6 + s0, p0[1]], [p1[0], H1 - 1.6 + s1, p1[1]], [p1[0], H1 + 0.1, p1[1]], [p0[0], H1 + 0.1, p0[1]]); } }
    const UP = [P(-pu, pv0), P(pu, pv0), P(pu, pv1), P(-pu, pv1)];
    flatPoly(B.p(FL), UP, H1 + 0.1); wallP(wh, UP, H1 + 0.1, EV - 0.3); edgeFins(bk, UP, H1 + 0.3, EV - 0.3, 1.4, 0.15, 0.06);
    edgeFins(B.p(WIN), UP, H1 + 0.9, EV - 1.0, 2.2, 0.9, 0.07);
    // gable roof over the porch, ridge across the front
    const ya = EV - 0.3, yr = EV + 3.0, o = 0.6, tl = B.p(TILE);
    const q = (u, v, y) => { const p = P(u, v); return [p[0], y, p[1]]; };
    quadP(tl, q(-pu - o, pv0, ya), q(-pu - o, pv1 + o, ya), q(0, pv1 + o, yr), q(0, pv0, yr));
    quadP(tl, q(pu + o, pv0, ya), q(0, pv0, yr), q(0, pv1 + o, yr), q(pu + o, pv1 + o, ya));
    triP(wh, q(-pu, pv1 + 0.2, ya), q(pu, pv1 + 0.2, ya), q(0, pv1 + 0.2, yr - 0.3));
    for (let k = -3; k <= 3; k++){ const p = q(k*1.2, pv1 + 0.25, ya); segP(bk, p, [p[0], ya + (yr - ya - 0.3)*(1 - Math.abs(k)/4.2), p[2]], 0.06, 4); }
  }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'sgbukitchandu', lat:1.279508, lon:103.794117, rot:0});
}
