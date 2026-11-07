// ================= Masjid Al-Abrar (阿布拉回教堂), 192 Telok Ayer Street =================
// Founded 1827 as a thatched hut; the present brick building 1850-55, renovated 1986-89 (roots.gov.sg): a frontage of three
// shophouse widths with the five-foot-way built into the facade; two tall octagonal minarets flanking the main entrance, each
// topped with a crescent and star; the parapet with decorative merlon cresting now runs across the full front; the 1986-89
// works added an upper floor and a large jack roof over the prayer hall, the courtyard was roofed over; large French louvred
// windows with coloured-glass fanlights. Wall / trim colours are not documented (white with green trim assumed).
// OSM footprint w172904416 (25.8 x 15.6 m). Local frame: +x = front towards Telok Ayer Street (ESE).
LANDMARKS.sgalabrar = {zh:'阿布拉回教堂', en:'Masjid Al-Abrar', cat:'old', r:16, h:17,
  lt:{m:0, c:'#ffe2b8', k:1.2, e:0.6, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB();
    const WALL = '#f1ece0', TRIM = '#fbf8f0', BASE = '#c9c1b0', GRN = '#4e8a62', ROOF = '#8b8478', DARK = '#3f3a33',
      GOLD = {c:'#d6a33a', lc:'#ffd27e', lk:1.3, glow:'#b98a2e', gk:0.5}, WIN = {c:'#4d5a52', glow:'#ffd08a', gk:0.45}, FAN = {c:'#3d6fd0', glow:'#9fc4ff', gk:0.5};
    const X0 = -12.9, X1 = 12.9, Z0 = -7.8, Z1 = 7.8, G1 = 4.6, G2 = 8.6, PT = 9.6;
    prismP(B.p(BASE), [[12.9,7.8],[-12.5,7.8],[-12.9,-7.8],[12.5,-7.8]], -5, 0.35);
    const XF = X1 - 2.0;                                     // the five-foot-way runs inside the front wall
    bxP(B.p(WALL), X0, XF, 0.35, G1, Z0, Z1);
    bxP(B.p(WALL), X0, X1, G1, G2, Z0, Z1);                  // upper floor over the five-foot-way
    bxP(B.p(TRIM), X0, X1 + 0.15, G1 - 0.1, G1 + 0.35, Z0, Z1);
    // five-foot-way arcade: piers and arches on the street front
    { const F = fX(X1, 1, 0);
      for (const zc of [-5.2, 0, 5.2]){ const hw = zc === 0 ? 1.8 : 1.6;
        slabP(B.p(TRIM), mv(archFill(hw, 2.8, G1 - 0.1, 10), zc, 0), F, -0.3, 0.05);
        for (const q of [-1, 1]) slabP(B.p(WALL), rectO(zc + q*hw, zc + q*(hw + 0.45), 0.35, G1 - 0.1), F, -0.3, 0.05); }
      for (const q of [-1, 1]) slabP(B.p(WALL), rectO(q*7.4, q*7.8, 0.35, G1), F, -0.3, 0.05);
      const Fi = fX(XF, 1, 0);
      shapeP(B.p(DARK), mv(rArchO(1.1, 3.6, 8), 0, 0.35), Fi, 0.02);                                   // main door
      for (const zc of [-5.2, 5.2]) for (const q of [-1, 1]){ shapeP(B.p(WIN), rectO(zc + q*1.1 - 0.5, zc + q*1.1 + 0.5, 0.9, 3.2), Fi, 0.02); shapeP(B.p(FAN), mv(semi(0.5, 6), zc + q*1.1, 3.2), Fi, 0.03); }
      // upper floor: French louvred windows with coloured fanlights, pilasters
      for (const zc of [-5.2, 0, 5.2]) for (const q of [-1, 1]){ const u = zc + q*1.25;
        shapeP(B.p(WIN), rectO(u - 0.55, u + 0.55, G1 + 0.8, G1 + 2.8), F, 0.03); shapeP(B.p(FAN), mv(semi(0.55, 6), u, G1 + 2.8), F, 0.04);
        slabP(B.p(TRIM), rectO(u - 0.7, u + 0.7, G1 + 0.65, G1 + 0.8), F, 0, 0.1); slabP(B.p(GRN), mv(semi(0.7, 6), u, G1 + 2.85), F, 0, 0.06); }
      for (const u of [-7.6, -2.6, 2.6, 7.6]) slabP(B.p(TRIM), rectO(u - 0.22, u + 0.22, G1, G2), F, 0, 0.14);
      slabP(B.p(TRIM), rectO(Z0, Z1, G2 - 0.3, G2), F, 0, 0.2);
    }
    // parapet with merlon cresting across the full front, returning a little along the sides
    { const P = [[X1 + 0.05, Z0], [X1 + 0.05, Z1]]; bxP(B.p(WALL), X1 - 0.3, X1 + 0.05, G2, PT, Z0, Z1); bxP(B.p(GRN), X1 - 0.35, X1 + 0.1, PT - 0.2, PT, Z0, Z1);
      for (let z = Z0 + 0.4; z < Z1 - 0.2; z += 0.8){ if (Math.abs(Math.abs(z) - 2.6) < 0.9) continue; boxP(B.p(TRIM), 0.3, 0.45, 0.42, X1 - 0.12, PT, z, 0); latheP(B.p(TRIM), [[0.12, PT + 0.45], [0.16, PT + 0.6], [0.02, PT + 0.85]], X1 - 0.12, z, 4); }
      for (const s of [-1, 1]) bxP(B.p(WALL), X1 - 4, X1, G2, PT - 0.4, s*Z1 - 0.15, s*Z1 + 0.15); }
    // the two octagonal minarets flanking the main entrance
    for (const s of [-1, 1]){ const x = X1 - 0.55, z = s*2.6, r8 = 0.85, oct = (r, y0, y1, col) => latheP(B.p(col), [[r, y0], [r, y1]], x, z, 8, PI/8);
      oct(r8, 0.35, 12.4, WALL); latheP(B.p(TRIM), [[0, 12.4], [r8, 12.4]], x, z, 8, PI/8);
      for (const y of [G1 - 0.1, G2 - 0.3, PT]) latheP(B.p(TRIM), [[r8 + 0.12, y], [r8 + 0.12, y + 0.3], [r8, y + 0.32]], x, z, 8, PI/8);
      latheP(B.p(GRN), [[r8 + 0.45, 12.4], [r8 + 0.45, 12.65], [r8, 12.75]], x, z, 8, PI/8);                    // balcony
      for (let i = 0; i < 8; i++){ const a = (i + 0.5)/8*TAU; segP(B.p(TRIM), [x + Math.cos(a)*(r8 + 0.35), 12.65, z + Math.sin(a)*(r8 + 0.35)], [x + Math.cos(a)*(r8 + 0.35), 13.3, z + Math.sin(a)*(r8 + 0.35)], 0.05, 3); }
      for (let i = 0; i < 8; i++){ const a = (i + 0.5)/8*TAU; shapeP(B.p(DARK), mv(rArchO(0.18, 0.9, 5), 0, 9.9), fA(x + Math.cos(a)*r8*0.93, z + Math.sin(a)*r8*0.93, a + HP), 0.02); }
      oct(0.62, 12.75, 14.3, WALL);
      latheP(B.p(GRN), [[0.68, 14.3], [0.8, 14.55], [0.74, 14.95], [0.48, 15.4], [0.18, 15.8], [0.05, 16.05]], x, z, 8, PI/8);
      segP(B.p(GOLD), [x, 16.0, z], [x, 16.45, z], 0.04, 4);
      // crescent and star
      slabP(B.p(GOLD), CRES.map(p => [p[0]*0.55, p[1]*0.55 + 16.75]), fX(x, 1, z), -0.04, 0.04);
      slabP(B.p(GOLD), star(5, 0.14, 0.06, HP).map(p => [p[0] + 0.12, p[1] + 16.78]), fX(x, 1, z), -0.04, 0.05);
    }
    // jack roof over the prayer hall: hipped roof with a raised clerestory along the ridge
    hipRoof(g, -2.0, 0, 21.4, 15.2, G2, 2.4, ROOF, 0, 0.5);
    bxP(B.p(TRIM), -9.5, 5.5, G2 + 1.9, G2 + 2.9, -2.2, 2.2);
    for (let k = 0; k < 9; k++) for (const s of [-1, 1]) shapeP(B.p(WIN), rectO(-8.9 + k*1.6, -8.1 + k*1.6, G2 + 2.0, G2 + 2.75), fZ(s*2.2, s, 0), 0.02);
    hipRoof(g, -2.0, 0, 15.8, 5.2, G2 + 2.9, 1.1, ROOF, 0, 0.3);
    B.flush(g);
    return g;
  }};
SG_PLACES.push({type:'sgalabrar', lat:1.280308, lon:103.847261, rot:-0.4619});

// ================= Jinrikisha Station (人力车站), 1 Neil Road =================
// Built 1903 for the Municipal rickshaw department under Municipal Engineer Samuel Tomlinson and Municipal Architect D.M. Craik
// (remembersingapore; Wikipedia): a triangular corner site at the junction of Neil Road and Tanjong Pagar Road, Ionic
// pilasters and a curved pediment marking the corner, a square tower above it topped by an octagonal cupola; originally
// exposed brick (unusual then), since painted; restored by URA in 1987. Storey heights are estimates (two storeys).
// OSM footprint w172814077 (the apex piece of the wedge); the party walls with the shophouses behind are set 0.6-0.8 m in so
// that the hull does not hide them. Local frame: +x along
// Tanjong Pagar Road towards the junction (NNE), the corner at +x, Neil Road on the -z side.
LANDMARKS.sgjinrikisha = {zh:'人力车站', en:'Jinrikisha Station', cat:'old', r:25, h:21.5,
  lt:{m:0, c:'#ffd8a8', k:1.35, e:0.6, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB();
    const BRICK = '#a8553e', TRIM = '#efe6d2', BASE = '#9c8f7e', ROOF = '#7b5a48', DARK = '#3b302a', CUP = '#8e9a8c',
      WIN = {c:'#4b3a2e', glow:'#ffc77a', gk:0.5}, SHUT = '#5d6d5a', LAMP = {c:'#fff2cc', glow:'#ffd890', gk:1.6};
    const RING = [[-1.9,-19.9],[21.8,4.6],[21.1,6.6],[19.6,8.2],[-21.0,8.2],[-22.2,1.1],[-14.6,-0.3],[-17.5,-3.4]];
    const G1 = 5.0, G2 = 9.6, CT = 10.4;
    prismP(B.p(BASE), RING, -5, 0.4);
    const IN = offP(RING, 0.15);
    prismP(B.p(BRICK), IN, 0.4, G2);
    prismP(B.p(TRIM), offP(RING, -0.15), G2, G2 + 0.35); prismP(B.p(BRICK), offP(RING, 0.05), G2 + 0.35, CT); prismP(B.p(TRIM), offP(RING, -0.1), CT, CT + 0.25);
    capP(B.p(ROOF), offP(RING, 0.6), CT - 0.1);
    prismP(B.p(TRIM), offP(RING, -0.08), G1 - 0.2, G1 + 0.15);                                   // string course
    prismP(B.p(TRIM), offP(RING, -0.05), 0.4, 1.0);                                              // plinth band
    // street fronts: Neil Road (edge 1) and Tanjong Pagar Road (edge 4); bays with pilasters, arched ground windows, shuttered upper windows
    const E = edgesF(RING);
    for (const ei of [0, 3]){ const e = E[ei], n = Math.max(2, Math.round(e.L/3.8)), bw = e.L/n;
      for (let k = 0; k <= n; k++){ const u = k*bw; if (u < 0.6 || u > e.L - 0.6) continue; slabP(B.p(TRIM), rectO(u - 0.28, u + 0.28, 1.0, G2), e.F, 0, 0.18); slabP(B.p(TRIM), rectO(u - 0.4, u + 0.4, G2 - 0.55, G2 - 0.25), e.F, 0, 0.26); }   // Ionic pilasters with capitals
      for (let k = 0; k < n; k++){ const u = (k + 0.5)*bw;
        shapeP(B.p(DARK), mv(rArchO(0.95, 3.4, 8), u, 1.0), e.F, 0.02); slabP(B.p(TRIM), mv(archFill(1.15, 3.45, 3.75, 8), u, 0.0), e.F, 0, 0.08);
        shapeP(B.p(WIN), rectO(u - 0.7, u + 0.7, G1 + 0.7, G2 - 1.0), e.F, 0.02);
        for (const q of [-1, 1]) shapeP(B.p(SHUT), rectO(u + q*0.72, u + q*1.15, G1 + 0.7, G2 - 1.0), e.F, 0.05);
        slabP(B.p(TRIM), rectO(u - 0.85, u + 0.85, G2 - 0.95, G2 - 0.75), e.F, 0, 0.1); }
    }
    // the rounded corner: entrance, pilasters and the curved pediment
    { const cx = 20.9, cz = 6.9, ang = Math.atan2(0.40, 0.92), F = fA(cx, cz, ang + HP);
      shapeP(B.p(DARK), mv(rArchO(1.2, 3.8, 8), 0, 0.6), F, 0.05);
      for (const q of [-1, 1]) slabP(B.p(TRIM), rectO(q*1.55 - 0.3, q*1.55 + 0.3, 0.6, G2), F, 0, 0.3);
      shapeP(B.p(WIN), rectO(-0.8, 0.8, G1 + 0.6, G2 - 1.0), F, 0.08);
      // curved (segmental) pediment over the corner bay
      const SEG = []; for (let i = 0; i <= 12; i++){ const t = i/12; SEG.push([-2.3 + 4.6*t, 1.35*Math.sin(PI*t)]); }
      slabP(B.p(TRIM), mv(SEG, 0, CT + 0.25), F, -0.4, 0.3);
      slabP(B.p(BRICK), mv(SEG.map(p => [p[0]*0.82, p[1]*0.72]), 0, CT + 0.3), F, -0.4, 0.36);
    }
    // square tower behind the corner, octagonal cupola
    { const tx = 16.6, tz = 4.3, tr = Math.atan2(0.40, 0.92), s = 2.6, T0 = CT, T1 = 15.8;
      boxP(B.p(BRICK), 2*s, T1 - T0 + 1, 2*s, tx, T0 - 1, tz, -tr);
      boxP(B.p(TRIM), 2*s + 0.5, 0.45, 2*s + 0.5, tx, T1, tz, -tr); boxP(B.p(TRIM), 2*s + 0.25, 0.3, 2*s + 0.25, tx, T0 + 0.1, tz, -tr);
      for (const [px, pz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]){ const c = Math.cos(-tr), sn = Math.sin(-tr), ox = px*(s - 0.1), oz = pz*(s - 0.1); boxP(B.p(TRIM), 0.55, T1 - T0, 0.55, tx + ox*c + oz*sn, T0, tz - ox*sn + oz*c, -tr); }
      for (let k = 0; k < 4; k++){ const a = -tr + k*HP, c = Math.cos(a), sn = Math.sin(a), F = fA(tx + c*(s + 0.01), tz - sn*(s + 0.01), HP - a);
        shapeP(B.p(WIN), mv(rArchO(0.75, 2.8, 8), 0, T0 + 1.2), F, 0.02); slabP(B.p(TRIM), mv(archFill(0.95, T0 + 3.25, T0 + 3.55, 8), 0, 0), F, 0, 0.06);
        shapeP(B.p(DARK), circ(0.55, 12).map(p => [p[0], p[1] + T1 - 0.9]), F, 0.02); }
      // octagonal cupola: drum with openings, dome, lantern and finial
      latheP(B.p(TRIM), [[2.0, T1 + 0.45], [2.0, T1 + 0.75], [1.75, T1 + 0.8]], tx, tz, 8, PI/8);
      latheP(B.p(TRIM), [[1.7, T1 + 0.8], [1.7, T1 + 2.6]], tx, tz, 8, PI/8);
      for (let i = 0; i < 8; i++){ const a = (i + 0.5)/8*TAU, ap = 1.7*Math.cos(PI/8) + 0.01; shapeP(B.p(DARK), mv(rArchO(0.4, 1.4, 6), 0, T1 + 1.0), fA(tx + Math.cos(a)*ap, tz + Math.sin(a)*ap, a + HP), 0); }
      latheP(B.p(TRIM), [[1.95, T1 + 2.6], [1.95, T1 + 2.85], [1.7, T1 + 2.9]], tx, tz, 8, PI/8);
      latheP(B.p(CUP), [[1.75, T1 + 2.9], [1.62, T1 + 3.6], [1.25, T1 + 4.3], [0.7, T1 + 4.85], [0.3, T1 + 5.05]], tx, tz, 8, PI/8);
      latheP(B.p(TRIM), [[0.3, T1 + 5.05], [0.3, T1 + 5.45], [0.38, T1 + 5.5], [0.06, T1 + 5.8]], tx, tz, 8);
      segP(B.p(DARK), [tx, T1 + 5.8, tz], [tx, T1 + 6.0, tz], 0.04, 4);
      LSph(g, 0.22, tx, T1 + 5.8, tz, LAMP, 1, 8);
    }
    B.flush(g);
    return g;
  }};
SG_PLACES.push({type:'sgjinrikisha', lat:1.280235, lon:103.843868, rot:1.3393});

// ================= Maxwell Food Centre (麦士威熟食中心), 1 Kadayanallur Street =================
// Opened as Maxwell Market on 17 November 1928 at Maxwell Road / South Bridge Road; renovated 1986-87 and again 2000-01
// (ID Architects), reopened as Maxwell Food Centre with 103 stalls; floor area 3,365 m2 (Wikipedia). An open-sided hawker hall:
// a column grid under a long hipped roof with a raised, louvred jack roof along the ridge, the stall rows inside. Roof and
// column colours and heights are not documented (estimates). OSM footprint w47298639 (80.5 x 41.4 m, a small annex at the west
// end). Local frame: +x along the hall (SE).
LANDMARKS.sgmaxwell = {zh:"麦士威熟食中心", en:"Maxwell Food Centre", cat:"old", r:49, h:12,
  lt:{m:0, c:'#ffe0b0', k:0.9, e:0.8},
  build(){
    const g = new THREE.Group(), B = mkB();
    const COL = '#e9e2d2', BASE = '#a49b8b', ROOF = '#5e5a55', ROOF2 = '#6b6660', STALL = '#cfc6b4', DARK = '#3d3833', TILE = '#b9aa94',
      LIT = {c:'#f3e6c8', glow:'#ffe2a6', gk:0.9}, SIGN = {c:'#d8cdb4', glow:'#fff0cf', gk:0.7};
    const X0 = -39.5, X1 = 41.0, Z0 = -20.7, Z1 = 20.7, EV = 5.6;
    prismP(B.p(BASE), [[-39.7,3.9],[-45.2,3.8],[-45.0,-6.3],[-39.1,-6.7],[-39.5,-20.7],[41.0,-20.7],[41.0,20.7],[-39.5,20.7]], -5, 0.35);
    capP(B.p(TILE), rectXZ(X0 + 0.2, X1 - 0.2, Z0 + 0.2, Z1 - 0.2), 0.36);
    // column grid and edge beams
    const nx = 12, nz = 6;
    for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++){ const x = X0 + 0.5 + (X1 - X0 - 1)*i/nx, z = Z0 + 0.5 + (Z1 - Z0 - 1)*j/nz; if (j > 0 && j < nz && i > 0 && i < nx && (j % 2)) continue; boxP(B.p(COL), 0.55, EV - 0.35, 0.55, x, 0.35, z, 0); }
    for (const z of [Z0 + 0.5, Z1 - 0.5]) bxP(B.p(COL), X0 + 0.2, X1 - 0.2, EV - 0.6, EV, z - 0.3, z + 0.3);
    for (const x of [X0 + 0.5, X1 - 0.5]) bxP(B.p(COL), x - 0.3, x + 0.3, EV - 0.6, EV, Z0 + 0.2, Z1 - 0.2);
    // stall rows (back-to-back blocks with lit counters), aisles between
    for (const zc of [-13.2, -4.4, 4.4, 13.2]) for (let i = 0; i < 6; i++){ const x0 = X0 + 4 + i*12.6, x1 = x0 + 10.8;
      bxP(B.p(STALL), x0, x1, 0.36, 2.7, zc - 1.6, zc + 1.6); bxP(B.p(DARK), x0 - 0.1, x1 + 0.1, 2.7, 3.1, zc - 1.75, zc + 1.75);
      for (const s of [-1, 1]) shapeP(B.p(SIGN), rectO(x0 + 0.3, x1 - 0.3, 2.25, 2.65), fZ(zc + s*1.6, s, (x0 + x1)/2 - (x0 + x1)/2), 0.03);
      for (const s of [-1, 1]) shapeP(B.p(LIT), rectO(x0 + 0.3, x1 - 0.3, 1.0, 1.25), fZ(zc + s*1.6, s, 0), 0.05); }
    // annex at the west end (service block)
    bxP(B.p(COL), -45.0, X0 + 0.2, 0.35, 3.6, -6.3, 3.8); bxP(B.p(ROOF2), -45.3, X0 + 0.2, 3.6, 3.85, -6.6, 4.1);
    // long hipped roof, then the raised louvred jack roof along the ridge
    hipRoof(g, (X0 + X1)/2, 0, X1 - X0, Z1 - Z0, EV, 4.6, ROOF, 0, 1.6);
    const JX0 = X0 + 14, JX1 = X1 - 14, JW = 9.0, JY = EV + 4.6*0.55;
    bxP(B.p(DARK), JX0, JX1, JY - 0.3, JY + 1.3, -JW/2 + 0.3, JW/2 - 0.3);
    for (let x = JX0 + 0.6; x < JX1 - 0.4; x += 1.2) for (const s of [-1, 1]) boxP(B.p(COL), 0.12, 1.3, 0.1, x, JY, s*(JW/2 - 0.25), 0);
    hipRoof(g, (JX0 + JX1)/2, 0, JX1 - JX0 + 1.2, JW + 1.4, JY + 1.3, 1.6, ROOF2, 0, 0.2);
    B.flush(g);
    return g;
  }};
SG_PLACES.push({type:'sgmaxwell', lat:1.280358, lon:103.844735, rot:-0.8504});
