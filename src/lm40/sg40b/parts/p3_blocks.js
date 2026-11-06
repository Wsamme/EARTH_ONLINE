// ---------------- shared: slab / curtain-wall blocks on real plan polygons ----------------
// residential slab (HDB): dark window band behind, a lit-window core material; per floor a spandrel / parapet band (bandH of fh)
function slabBlock(B, P, y0, y1, fh, cols, o){
  o = o || {}; const nF = Math.max(1, Math.round((y1 - y0)/fh)), f = (y1 - y0)/nF;
  prismP(B.p(cols.win), offP(P, 0.35), y0, y1);
  for (let i = 0; i < nF; i++){ const y = y0 + i*f; wallP(B.p(i % (o.alt || 1e9) === 0 && i ? cols.band2 || cols.band : cols.band), offP(P, -0.05), y + f*0.02, y + f*(o.bandH || 0.42)); }
  // vertical piers (party walls / columns) along each edge
  if (o.pier) for (const [x, z, a, L] of alongP(P, o.pier)) for (const s of [-0.5, 0.5]) boxP(B.p(cols.band), 0.35, y1 - y0, 0.55, x + Math.cos(a)*L*s, y0, z + Math.sin(a)*L*s, -a);
  prismP(B.p(cols.band), offP(P, -0.05), y1, y1 + (o.par || 1.1));
  capP(B.p(cols.roof || cols.band), offP(P, 0.3), y1 + 0.3);
}
// curtain wall: glass prism, aluminium spandrel bands every floor, mullions every `mw` m
function cwBlock(B, P, y0, y1, fh, cols, mw){
  const nF = Math.max(1, Math.round((y1 - y0)/fh)), f = (y1 - y0)/nF;
  prismP(B.p(cols.glass), P, y0, y1);
  for (let i = 1; i <= nF; i++){ const y = y0 + i*f; wallP(B.p(cols.alu), offP(P, -0.12), y - 0.75, y - 0.05); }
  if (mw) for (const [x, z, a, L] of alongP(P, mw)) boxP(B.p(cols.alu), 0.14, y1 - y0, 0.3, x, y0, z, -a);
  prismP(B.p(cols.alu), offP(P, -0.15), y1, y1 + 1.2); capP(B.p(cols.roof || cols.alu), P, y1 + 0.2);
}

// ================= Chinatown Complex (牛车水大厦), 335 Smith Street =================
// HDB complex opened 1 October 1983 ($18 million, ~1.35 ha): wet market in the basement, shops on the first floor, the cooked
// food centre (Singapore's largest hawker centre) on the second floor, a multi-storey car park; two L-shaped HDB blocks of 21
// and 25 storeys stand on it (NLB Infopedia); upgraded 2008. OSM: the complex w47298646 (podium; a 12 m part in the south),
// the 21-storey L block w171985729 (parts 9.9-69.9 m) and the 25-storey L block w870261058 / w171985727 (lift cores to 83 m).
// Colours are not documented: a brown-tiled podium and cream blocks with brown spandrels are assumed. Local frame = the ref
// frame round the anchor (+x east, +z south, rot 0). Night: lit flat windows, lit food-centre openings.
LANDMARKS.sgchinatowncx = {zh:'牛车水大厦', en:'Chinatown Complex', cat:'new', r:80, h:84,
  lt:{m:1, c:'#fff0d6', k:0.55, fh:2.8, cw:2.4},
  build(){
    const g = new THREE.Group(), B = mkB();
    const POD = {c:'#9a6a52', m:0, lc:'#ffe0b8', lk:0.5}, POD2 = {c:'#c9b8a2', m:0, lc:'#ffe0b8', lk:0.5}, DARK = {c:'#3a3430', m:0}, GLOW = {c:'#e9d9b6', glow:'#ffd896', gk:0.8, m:0},
      WIN = {c:'#4d555a', m:1, fh:2.8, cw:2.4}, BAND = {c:'#e4dccb', m:0, lc:'#fff0d6', lk:0.25}, BAND2 = {c:'#9a6a52', m:0}, ROOF = {c:'#8d8880', m:0}, CORE = {c:'#e4dccb', m:0, lc:'#fff0d6', lk:0.3};
    const CX = [[-69.2,12.5],[-71.6,10.1],[-71.0,7.6],[-53.0,-23.9],[-18.3,-4.9],[-20.0,-1.9],[-16.6,0.4],[-14.3,-3.7],[-11.3,-2.0],[-8.4,-7.1],[-42.3,-29.0],[-45.3,-29.6],[-46.5,-31.5],[-46.0,-33.2],[-47.7,-35.0],[-31.6,-54.7],[-30.4,-57.6],[-27.4,-59.4],[-21.4,-67.2],[20.5,-42.3],[22.9,-39.3],[24.7,-32.7],[23.5,-26.7],[17.6,-17.3],[21.6,-15.0],[34.8,-38.1],[67.7,-17.9],[69.5,-14.3],[51.5,16.6],[26.4,3.1],[24.6,6.0],[16.3,1.9],[11.6,10.6],[52.2,33.7],[32.4,68.8]];
    const SOUTH = [[6.1,1.1],[-42.3,-29.1],[-44.1,-29.1],[-45.2,-29.9],[-45.2,-37.9],[-31.5,-54.6],[-30.3,-57.6],[-27.3,-59.4],[-21.4,-67.1],[20.4,-42.2],[24.0,-36.2],[23.4,-26.7]];
    const WT = [[-46.5,22.0],[-45.3,19.4],[-42.3,20.6],[-31.7,2.9],[-51.2,-7.6],[-52.4,-5.9],[-54.9,-6.5],[-53.7,-9.5],[-56.1,-10.7],[-55.5,-12.5],[-57.3,-14.3],[-54.2,-19.7],[-51.9,-18.6],[-51.2,-19.7],[-49.5,-18.6],[-48.9,-19.7],[-47.1,-19.2],[-46.4,-20.3],[-38.6,-15.6],[-38.6,-14.4],[-36.4,-13.3],[-36.2,-13.8],[-27.9,-9.0],[-28.3,-8.4],[-27.4,-7.9],[-26.7,-8.5],[-24.3,-7.3],[-24.8,-6.0],[-21.3,-4.2],[-24.8,1.7],[-19.5,4.7],[-22.4,9.4],[-21.3,10.1],[-26.1,17.8],[-26.7,17.8],[-27.8,20.1],[-27.2,20.7],[-31.4,28.5],[-33.2,29.7]];
    const ET = [[41.3,-21.4],[46.1,-17.8],[44.9,-16.7],[41.3,-18.4],[35.9,-9.0],[49.1,-1.2],[50.3,-3.6],[52.1,-4.2],[53.3,-3.0],[51.5,-0.1],[55.6,2.9],[49.1,14.2],[38.3,8.2],[39.5,6.5],[27.6,-0.1],[24.6,4.7],[21.6,3.5],[21.0,2.9],[22.8,-0.7],[19.2,-3.0],[21.6,-6.6],[19.8,-7.8],[29.4,-22.0],[28.2,-23.2],[33.0,-30.9],[34.2,-30.3],[36.5,-34.5],[46.1,-29.1]];
    const PT = 9.9;
    // ---- podium: market / shops / food centre / car park, horizontal bands of openings ----
    prismP(B.p(POD), CX, -5, PT);
    wallP(B.p(DARK), offP(CX, -0.1), 0.0, 3.2);                                                   // shop fronts under the canopy
    wallP(B.p(POD2), offP(CX, -0.9), 3.2, 3.8);                                                   // canopy band round the base
    wallP(B.p(GLOW), offP(CX, -0.08), 5.0, 7.6);                                                  // food-centre openings (second storey)
    wallP(B.p(POD2), offP(CX, -0.15), PT - 0.5, PT + 0.6);
    capP(B.p(ROOF), CX, PT + 0.05);
    for (const [x, z, a, L] of alongP(CX, 6.0)) if (L > 2) boxP(B.p(POD), 0.6, 4.2, 0.4, x, 3.8, z, -a);        // piers between the openings
    prismP(B.p(POD), SOUTH, PT, 12.0); wallP(B.p(GLOW), offP(SOUTH, -0.08), PT + 0.4, 11.5); capP(B.p(ROOF), SOUTH, 12.05);
    // food-centre roof: raised ventilation clerestories (jack roofs) over the hawker hall
    for (const [cx, cz, ry] of [[-6, -38, 0.53], [8, -25, 0.53], [-24, -22, 0.53]]){ boxP(B.p(DARK), 16, 1.4, 5, cx, 12.0, cz, ry); hipRoof(g, cx, cz, 17, 6.2, 13.4, 1.4, '#7b746c', ry, 0.2); }
    // ---- the two L-shaped residential blocks (21 and 25 storeys) ----
    const cols = {win:WIN, band:BAND, band2:BAND2, roof:ROOF};
    slabBlock(B, WT, PT, 69.0, 69.0/21 > 0 ? (69.0 - PT)/21 : 2.8, cols, {bandH:0.45, alt:4, pier:7.5, par:0.9});
    slabBlock(B, ET, PT, 80.2, (80.2 - PT)/25, cols, {bandH:0.45, alt:4, pier:7.5, par:0.9});
    // lift cores and water tanks on the roofs (OSM parts)
    prismP(B.p(CORE), [[-51.8,-18.4],[-55.4,-12.5],[-57.2,-13.7],[-54.2,-19.6]], 69.0, 72.5); prismP(B.p(CORE), [[-53.6,-9.5],[-51.2,-7.8],[-52.4,-6.0],[-54.8,-7.2]], 69.0, 72.5);
    prismP(B.p(CORE), [[53.3,7.7],[55.6,2.9],[56.8,3.5],[55.1,8.2]].map(p => [p[0] - 1.6, p[1] + 0.2]), 80.2, 83.6); prismP(B.p(CORE), [[41.9,-31.5],[43.1,-32.1],[46.7,-29.7],[46.1,-29.1]].map(p => [p[0] - 0.8, p[1] + 0.9]), 80.2, 83.6);
    for (const [x, z] of [[-38, -6], [-36, 12], [36, -18], [40, 2]]) boxP(B.p(CORE), 4.5, 2.6, 4.5, x, (x < 0 ? 69.0 : 80.2) + 0.3, z, x < 0 ? -0.5 : 0.53);
    B.flush(g);
    return g;
  }};
SG_PLACES.push({type:'sgchinatowncx', lat:1.282278, lon:103.843180, rot:0});

// ================= Police Cantonment Complex (警察广东民大厦), 391 New Bridge Road =================
// Public Works Department design (structural engineer CPG, contractor Kajima), built Nov 1997 - May 2001, opened July 2001:
// a 25-storey tower with 6- to 9-storey podium blocks (four blocks A-D), a 4-storey basement, 106,400 m2; an energy-efficient
// aluminium and glass curtain wall; a semicircular structure at the corner depicting a soaring bird's wing (Wikipedia).
// Massing from the OSM building parts of w32507125: tower 85 m, west wing 60 m, podium blocks 20 / 27 / 28 / 34 m, the round
// corner block (20.4 m) at the north tip, a 7.2 m entrance block in the south. The form of the "wing" over the round block is
// an interpretation (an upswept canopy); glass / aluminium tones assumed. Local frame = ref frame (rot 0). Night: lit offices.
LANDMARKS.sgcantonment = {zh:'警察广东民大厦', en:'Police Cantonment Complex', cat:'new', r:82, h:89,
  lt:{m:1, c:'#f4f2ea', k:0.6, fh:3.6, cw:3.0},
  build(){
    const g = new THREE.Group(), B = mkB();
    const GL = {c:'#5d7a88', m:1, fh:3.6, cw:3.0}, GL2 = {c:'#6c8794', m:1, fh:3.6, cw:3.0}, ALU = {c:'#cfd3d4', m:0, lc:'#eef4ff', lk:0.4}, BASE = {c:'#b9b2a5', m:0},
      ROOF = {c:'#8f9294', m:0}, DARK = {c:'#3c4044', m:0}, CROWN = {c:'#dfe3e4', m:0, lc:'#dce8ff', lk:1.1}, LOBBY = {c:'#d9d2bf', glow:'#ffe2b0', gk:0.7, m:0};
    const RING = [[-43.2,-25.1],[-46.2,-31.1],[-6.8,-51.2],[-8.6,-56.0],[-8.6,-60.1],[-7.4,-64.3],[-5.0,-67.8],[-0.8,-70.2],[3.3,-71.4],[7.5,-70.8],[11.1,-68.4],[15.3,-63.1],[15.9,-58.9],[14.7,-53.0],[16.5,-50.0],[18.9,-51.2],[20.7,-48.3],[22.4,-48.9],[60.1,23.5],[58.3,24.7],[64.2,37.1],[43.3,41.9],[46.9,47.8],[35.6,50.2],[32.6,44.3],[25.4,46.6],[26.0,52.0],[-15.8,61.5],[-17.6,51.4],[-45.6,47.8],[14.1,17.6],[-1.4,-13.9],[-23.5,-2.6],[-19.3,5.1],[-56.4,24.1],[-73.7,-9.7]];
    prismP(B.p(BASE), RING, -5, 0.4);
    const PART = {
      east:[[-6.8,-51.2],[-2.6,-48.3],[2.2,-46.5],[6.9,-46.5],[11.7,-48.9],[14.7,-53.0],[16.5,-50.0],[18.9,-51.2],[20.7,-48.3],[22.4,-48.9],[60.1,23.5],[58.3,24.7],[64.2,37.1],[43.3,41.9],[36.8,31.2],[39.2,30.0],[35.6,6.9],[14.1,17.6],[-1.4,-13.9],[-6.2,-11.5],[-10.4,-19.8],[5.1,-27.5]],
      south:[[-45.6,47.8],[35.6,6.9],[39.2,30.0],[36.8,31.2],[28.4,15.2],[19.5,19.9],[32.6,44.3],[11.1,49.0],[-17.6,51.4]],
      west:[[-39.6,-17.4],[-57.5,-7.9],[-47.4,11.6],[-59.9,17.6],[-73.7,-9.7],[-43.2,-25.1]],
      tower:[[-19.3,5.1],[-44.4,17.6],[-57.5,-7.9],[-32.5,-21.0]],
      entr:[[25.4,46.6],[26.0,52.0],[-15.8,61.5],[-17.6,51.4],[11.1,49.0]],
      north:[[-6.8,-51.2],[5.1,-27.5],[-10.4,-19.8],[-6.2,-11.5],[-23.5,-2.6],[-32.5,-21.0],[-39.6,-17.4],[-46.2,-31.1]],
      se:[[36.8,31.2],[46.9,47.8],[35.6,50.2],[19.5,19.9],[28.4,15.2]] };
    const C = {glass:GL, alu:ALU, roof:ROOF}, C2 = {glass:GL2, alu:ALU, roof:ROOF};
    // podium blocks: a 4.5 m lobby storey, then office floors
    for (const [k, h] of [['east', 20.0], ['south', 28.0], ['north', 27.0], ['se', 34.0]]){ const P = offP(PART[k], 0.05);
      prismP(B.p(LOBBY), offP(P, 0.6), 0.4, 4.8); wallP(B.p(ALU), offP(P, -0.05), 4.4, 5.0);
      for (const [x, z, a, L] of alongP(P, 8.4)) if (L > 3) boxP(B.p(ALU), 0.7, 4.4, 0.7, x, 0.4, z, -a);
      cwBlock(B, P, 5.0, h, 3.9, k === 'south' ? C2 : C, 1.6); }
    // west wing (60 m) and the 25-storey tower (85 m) with its crown
    { const P = offP(PART.west, 0.05); prismP(B.p(LOBBY), offP(P, 0.6), 0.4, 4.8); cwBlock(B, P, 4.8, 60.0, 3.45, C2, 1.6); }
    { const P = offP(PART.tower, 0.05); prismP(B.p(LOBBY), offP(P, 0.6), 0.4, 4.8); cwBlock(B, P, 4.8, 85.0, 3.2, C, 1.5);
      // top: recessed plant storey behind an aluminium screen, a thin projecting roof plane
      const P2 = offP(P, 2.0); prismP(B.p(DARK), P2, 85.0, 88.0); wallP(B.p(CROWN), offP(P, 0.4), 85.6, 88.4);
      for (const [x, z, a] of alongP(offP(P, 0.4), 1.2)) boxP(B.p(CROWN), 0.12, 2.8, 0.35, x, 85.6, z, -a);
      prismP(B.p(CROWN), offP(P, -0.8), 88.4, 88.9); }
    // entrance block (7.2 m) with a canopy
    { const P = offP(PART.entr, 0.05); prismP(B.p(LOBBY), P, 0.4, 6.4); prismP(B.p(ALU), offP(P, -0.6), 6.4, 7.2); }
    // the round corner block and its upswept "wing" canopy
    { const cx = 3.6, cz = -58.6, R = 11.6;
      latheP(B.p(GL), [[R - 0.6, 0.4], [R - 0.6, 4.8]], cx, cz, 28); latheP(B.p(LOBBY), [[R - 0.9, 0.4], [R - 0.9, 4.6]], cx, cz, 28);
      latheP(B.p(GL), [[R, 4.8], [R, 20.4]], cx, cz, 28); capP(B.p(ROOF), ringPts(cx, cz, R, 28), 20.4);
      for (let y = 8.7; y < 20; y += 3.9) latheP(B.p(ALU), [[R + 0.12, y - 0.7], [R + 0.12, y]], cx, cz, 28);
      for (let i = 0; i < 28; i++){ const a = i/28*TAU; boxP(B.p(ALU), 0.16, 15.6, 0.3, cx + Math.cos(a)*(R + 0.1), 4.8, cz + Math.sin(a)*(R + 0.1), -a + HP); }
      // canopy: thin shell over the outer (north) half, rising from 21 m at the core to 25 m at the rim
      const o = B.p(CROWN), N = 14, M = 4, a0 = PI*1.05, a1 = PI*1.95, pt = (i, j) => { const a = a0 + (a1 - a0)*i/N, r = R*0.25 + (R + 0.3 - R*0.25)*j/M, t = j/M, lift = 1 - Math.pow(Math.abs(2*i/N - 1), 2)*0.6;
        return [cx + Math.cos(a)*r, 21.0 + 4.2*t*t*lift, cz + Math.sin(a)*r]; };
      for (let i = 0; i < N; i++) for (let j = 0; j < M; j++){ quadP(o, pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)); }
      for (let i = 0; i <= N; i += 2) segP(B.p(ALU), [cx + Math.cos(a0 + (a1 - a0)*i/N)*R*0.3, 20.4, cz + Math.sin(a0 + (a1 - a0)*i/N)*R*0.3], pt(i, M - 1), 0.12, 4);
    }
    B.flush(g);
    return g;
  }};
SG_PLACES.push({type:'sgcantonment', lat:1.278458, lon:103.839514, rot:0});

// ================= UE Square (联合工程广场), River Valley Road / Clemenceau Avenue =================
// Mixed-use "city within a city" by Architects 61 on the former United Engineers headquarters site (Asian Architect &
// Contractor 1997, via CUHK library). Modelled: the anchor building w172749016 only - the retail podium (13.2 m) and the two
// blocks above it (to 36.9 m) with the roof structures from the OSM parts (36.3-43.5 m). The pitched red-tiled roofs follow
// the target note (not verified). UE Square's office tower (w320637212) and the Residences (w172748774) are not modelled.
// Local frame = ref frame (rot 0), origin at the footprint centre.
LANDMARKS.sguesquare = {zh:'联合工程广场', en:'UE Square', cat:'new', r:46, h:44,
  lt:{m:1, c:'#fff0d6', k:0.55, fh:3.1, cw:2.6},
  build(){
    const g = new THREE.Group(), B = mkB();
    const POD = {c:'#e6ddcc', m:0, lc:'#ffe6c4', lk:0.45}, WIN = {c:'#55606a', m:1, fh:3.1, cw:2.6}, BAND = {c:'#efe9dc', m:0, lc:'#fff0d6', lk:0.2}, BAND2 = {c:'#b3876a', m:0},
      ROOF = {c:'#b0563c', m:0, lc:'#ffcf9e', lk:0.4}, DARK = {c:'#3c3a38', m:0}, SHOP = {c:'#e8d8b8', glow:'#ffe2b0', gk:0.8, m:0}, GREY = {c:'#8d8a84', m:0};
    const O = [-9.0, -50.5];                                    // ref offset of the local origin
    const T = P => P.map(p => [p[0] + O[0], p[1] + O[1]]);
    const RING = T([[46.2,39.4],[18.1,89.4],[10.9,84.6],[6.1,75.1],[-1.7,68.0],[-12.4,64.5],[-21.3,64.5],[-28.0,59.7],[-1.0,11.5]]);
    prismP(B.p(POD), RING, -5, 13.2);
    wallP(B.p(SHOP), offP(RING, -0.06), 0.4, 4.2); wallP(B.p(BAND), offP(RING, -0.9), 4.2, 4.8);
    wallP(B.p(WIN), offP(RING, -0.05), 6.2, 11.8); wallP(B.p(BAND), offP(RING, -0.12), 12.4, 13.6); capP(B.p(GREY), RING, 13.25);
    for (const [x, z, a, L] of alongP(RING, 7.0)) if (L > 3) boxP(B.p(BAND), 0.6, 8.4, 0.5, x, 4.8, z, -a);
    const cols = {win:WIN, band:BAND, band2:BAND2, roof:GREY};
    const A = T([[-24.9,55.5],[-1.0,12.8],[13.3,20.5],[-7.0,57.8],[-13.5,53.7],[-17.1,60.2]]);
    const Bk = T([[31.2,31.2],[45.0,39.5],[20.5,82.2],[12.1,77.4],[15.7,71.5],[9.2,67.9],[19.3,51.0]]);
    slabBlock(B, A, 13.2, 36.9, 3.1, cols, {bandH:0.36, alt:3, pier:6.5, par:0.4});
    slabBlock(B, Bk, 13.2, 36.9, 3.1, cols, {bandH:0.36, alt:3, pier:6.5, par:0.4});
    // pitched roofs over the blocks (hips along each block's long axis) and the raised roof pieces (OSM 36.3-43.5 m)
    const hipOn = (P, y, h, over) => { let best = 0, ang = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L > best){ best = L; ang = Math.atan2(b[1] - a[1], b[0] - a[0]); } }
      const c = Math.cos(ang), s = Math.sin(ang), cc = ctr(P); let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
      for (const p of P){ const dx = p[0] - cc[0], dz = p[1] - cc[1], u = dx*c + dz*s, v = -dx*s + dz*c; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
      const uc = (u0 + u1)/2, vc = (v0 + v1)/2; hipRoof(g, cc[0] + uc*c - vc*s, cc[1] + uc*s + vc*c, u1 - u0, v1 - v0, y, h, ROOF, -ang, over); };
    hipOn(A, 37.0, 3.6, 0.8); hipOn(T([[31.2,31.2],[45.0,39.5],[20.5,82.2],[19.3,81.5],[19.3,51.0]]), 37.0, 3.2, 0.8); hipOn(T([[19.3,51.0],[19.3,81.5],[12.1,77.4],[15.7,71.5],[9.2,67.9]]), 37.0, 2.4, 0.6);
    hipOn(T([[-12.3,32.3],[-8.8,27.0],[-4.0,30.0],[-7.0,35.3]]), 40.4, 3.0, 0.3); hipOn(T([[-17.1,41.2],[-11.1,44.8],[-14.1,50.1],[-20.1,47.2]]), 40.4, 3.0, 0.3);
    B.flush(g);
    return g;
  }};
SG_PLACES.push({type:'sguesquare', lat:1.292143, lon:103.842681, rot:0});
