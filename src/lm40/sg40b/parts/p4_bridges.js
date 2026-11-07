// ---------------- shared bridge pieces ----------------
// deck profile: y at local x (ends at y0, crown rise at mid)
const bProf = (L, y0, rise) => x => y0 + rise*(1 - Math.pow(2*x/L, 2));
function bDeck(B, col, L, W, prof, th, n, zf){ n = n || 12; zf = zf || (() => 0); for (let i = 0; i < n; i++){ const x0 = -L/2 + L*i/n, x1 = -L/2 + L*(i + 1)/n, o = B.p(col);
  const P = (x, y, z) => [x, y, z + zf(x)]; const a = prof(x0), b = prof(x1);
  quadP(o, P(x0, a, -W/2), P(x1, b, -W/2), P(x1, b, W/2), P(x0, a, W/2));   // top
  quadP(o, P(x0, a - th, W/2), P(x1, b - th, W/2), P(x1, b - th, -W/2), P(x0, a - th, -W/2));
  for (const s of [-1, 1]) quadP(o, P(x0, a - th, s*W/2), P(x1, b - th, s*W/2), P(x1, b, s*W/2), P(x0, a, s*W/2)); } }
function bLamp(B, POST, LAMP, x, y, z, h){ segP(B.p(POST), [x, y, z], [x, y + h, z], 0.07, 6); latheP(B.p(POST), [[0.18, y], [0.14, y + 0.5], [0.08, y + 0.7]], x, z, 6); latheP(B.p(LAMP), [[0.05, y + h], [0.24, y + h + 0.1], [0.26, y + h + 0.45], [0.18, y + h + 0.6], [0.04, y + h + 0.7]], x, z, 6); }

// ================= Ord Bridge (奥德桥), Clarke Quay / Robertson Quay =================
// Pedestrian bridge over the Singapore River, completed July 1886 and opened that year, replacing the ABC Bridge; a steel truss
// bridge "designed in simple form with symmetrical balustrades and girders" (Wikipedia; remembersingapore). Conserved by URA
// (2008). Extent from the bridge path line in the refs (44 m between the two quays). Deck width, truss depth and the paint colour
// are not documented (estimates). Local frame: x along the bridge (towards the north-east bank), deck centred on z = 0.
LANDMARKS.sgordbr = {zh:'奥德桥', en:'Ord Bridge', cat:'old', r:26, h:5.5,
  lt:{m:0, c:'#ffe2b8', k:1.0, e:0.8},
  build(){
    const g = new THREE.Group(), B = mkB();
    const STEEL = '#4f5d5a', DECK = '#8b7f70', STONE = '#a59e91', POST = '#2f3533', LAMP = {c:'#fff2cc', glow:'#ffd890', gk:1.8}, RAIL = '#5a6965';
    const L = 40, W = 3.6, prof = bProf(L, 0.1, 1.7), th = 0.35;
    bDeck(B, DECK, L, W, prof, th, 14);
    // two lattice side girders forming the balustrades: top and bottom chords, Warren diagonals, posts
    for (const s of [-1, 1]){ const z = s*(W/2 + 0.12), n = 20, top = x => prof(x) + 1.15, bot = x => prof(x) - 0.75;
      for (let i = 0; i < n; i++){ const x0 = -L/2 + L*i/n, x1 = -L/2 + L*(i + 1)/n;
        segP(B.p(STEEL), [x0, top(x0), z], [x1, top(x1), z], 0.09, 4); segP(B.p(STEEL), [x0, bot(x0), z], [x1, bot(x1), z], 0.12, 4);
        segP(B.p(STEEL), [x0, bot(x0), z], [(x0 + x1)/2, top((x0 + x1)/2), z], 0.05, 4); segP(B.p(STEEL), [(x0 + x1)/2, top((x0 + x1)/2), z], [x1, bot(x1), z], 0.05, 4);
        segP(B.p(STEEL), [x0, bot(x0), z], [x0, top(x0), z], 0.06, 4);
        segP(B.p(RAIL), [x0, prof(x0) + 0.55, z], [x1, prof(x1) + 0.55, z], 0.03, 3); }
      segP(B.p(STEEL), [L/2, bot(L/2), z], [L/2, top(L/2), z], 0.08, 4);
      boxP(B.p(STEEL), L, 0.05, 0.22, 0, top(0) + 0.0, z, 0); }
    // cross girders under the deck
    for (let i = 0; i <= 10; i++){ const x = -L/2 + L*i/10; boxP(B.p(STEEL), 0.25, 0.5, W + 0.3, x, prof(x) - th - 0.45, 0, 0); }
    // stone abutments on both quays, lamps at the four corners
    for (const sx of [-1, 1]){ const x = sx*(L/2 + 1.2); bxP(B.p(STONE), x - 1.6, x + 1.6, -5, prof(sx*L/2) - 0.05, -W/2 - 0.6, W/2 + 0.6);
      capP(B.p(DECK), rectXZ(x - 1.6, x + 1.6, -W/2, W/2), prof(sx*L/2));
      for (const s of [-1, 1]){ bxP(B.p(STONE), x - 0.45, x + 0.45, prof(sx*L/2), prof(sx*L/2) + 1.3, s*(W/2 + 0.15) - 0.4, s*(W/2 + 0.15) + 0.4); bLamp(B, POST, LAMP, x, prof(sx*L/2) + 1.3, s*(W/2 + 0.15), 2.6); } }
    B.flush(g);
    return g;
  }};
SG_PLACES.push({type:'sgordbr', lat:1.290942, lon:103.844058, rot:1.0454});

// ================= Jiak Kim Bridge (爵金桥), Robertson Quay =================
// Pedestrian bridge over the upper Singapore River at Jiak Kim Street, opened 1999, designed by CPG Corporation: a single-arch
// (cable arch) bridge with nine steel cables holding the deck from the span, painted white or ash (Wikipedia; penang-traveltips).
// Extent from the bridge path line in the refs (47 m). Arch rise, deck width and which side the arch rib stands on are not
// documented: the rib is modelled along the downstream side, leaning over the deck; the deck follows the real path line. Local frame: x along the bridge (towards the
// Kim Seng Park bank, ENE).
LANDMARKS.sgjiakkim = {zh:'爵金桥', en:'Jiak Kim Bridge', cat:'new', r:28, h:11,
  lt:{m:0, c:'#eef3ff', k:1.1, e:0.8},
  build(){
    const g = new THREE.Group(), B = mkB();
    const WHITE = {c:'#e6e6e0', lc:'#e8f0ff', lk:1.2}, DECK = '#9c958a', STONE = '#a59e91', CABLE = '#bfc1bd', RAIL = '#d8d8d2', POST = '#6c6f6d', LAMP = {c:'#fff2cc', glow:'#ffe6b0', gk:1.6};
    const L = 44, W = 4.0, prof = bProf(L, 0.1, 1.5), th = 0.45;
    // the deck follows the real path line, which bends ~3 m upstream at mid-river: centreline offset zf(x)
    const ZP = [[-23.6, 0], [-15.8, -1.1], [-0.4, -3.2], [23.6, 0]], zf = x => { for (let i = 0; i < ZP.length - 1; i++){ const a = ZP[i], b = ZP[i+1]; if (x <= b[0] || i === ZP.length - 2){ const t = Math.max(0, Math.min(1, (x - a[0])/(b[0] - a[0]))); return a[1] + (b[1] - a[1])*t; } } return 0; };
    bDeck(B, DECK, L, W, prof, th, 16, zf);
    for (const s of [-1, 1]) for (let i = 0; i < 22; i++){ const x0 = -L/2 + L*i/22, x1 = -L/2 + L*(i + 1)/22, z0 = zf(x0) + s*(W/2 - 0.05), z1 = zf(x1) + s*(W/2 - 0.05);
      segP(B.p(WHITE), [x0, prof(x0) - th - 0.25, z0], [x1, prof(x1) - th - 0.25, z1], 0.28, 4);
      segP(B.p(RAIL), [x0, prof(x0) + 1.1, z0], [x1, prof(x1) + 1.1, z1], 0.04, 4); segP(B.p(RAIL), [x0, prof(x0), z0], [x0, prof(x0) + 1.1, z0], 0.025, 3); }
    // the single arch rib springing from the two banks, its plane leaning over the deck; nine cables to the deck edge
    const SP = L/2 + 1.0, RISE = 9.5, zb = W/2 + 0.6, lean = -1.4, arch = t => { const x = -SP + 2*SP*t, y = 0.3 + RISE*(1 - Math.pow(2*t - 1, 2)); return [x, y, zb + lean*(y/RISE)]; };
    let prev = arch(0); for (let i = 1; i <= 24; i++){ const p = arch(i/24); segP(B.p(WHITE), prev, p, 0.38, 6); prev = p; }
    for (let k = 1; k <= 9; k++){ const t = 0.5 + (k - 5)*0.085, a = arch(t), x = a[0]; segP(B.p(CABLE), a, [x, prof(x) - 0.2, zf(x) + W/2 - 0.1], 0.035, 3); }
    for (const sx of [-1, 1]){ const x = sx*(L/2 + 1.4); bxP(B.p(STONE), x - 1.8, x + 1.8, -5, prof(sx*L/2) - 0.05, -W/2 - 0.6, W/2 + 1.6); capP(B.p(DECK), rectXZ(x - 1.8, x + 1.8, -W/2, W/2), prof(sx*L/2));
      for (const s of [-1, 1]) bLamp(B, POST, LAMP, x, prof(sx*L/2), s*(W/2 + 0.2), 3.6); }
    B.flush(g);
    return g;
  }};
SG_PLACES.push({type:'sgjiakkim', lat:1.292236, lon:103.835705, rot:0.5586});
