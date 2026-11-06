// ================= Frasers Tower (2018, DP Architects), 182 Cecil Street =================
// 38 office storeys over a three-storey retail podium, 235 m (PropertyGuru; CTBUH 230.9 m) on the corner of Cecil Street and
// Telok Ayer Street, the former Telok Ayer Performing Arts Centre site (EdgeProp). A contextual prism: the base flares outward and
// the form tapers towards the crown as the core steps in (DP Architects); glass, steel and vertical fins (Pixeo); a cascading,
// planted retail podium ('The Oasis') with terraces; a roof garden ('The Sky'); the park with a fountain in front.
// ANCHOR CORRECTED: T40's w47345029 is 71 Robinson Road (its POIs); the real footprint is OSM w627103707 'Fraser Tower' (tower part
// 0-235 m, podium part 0-10.5 m) next to the Telok Ayer Chinese Methodist Church -> SC/lm40/ref_sg40a_1.json.
// Taper ratio and fin spacing are estimates. Night: lit floors, the fins and crown edge lit white.
{
const A0 = [1.27870, 103.84740];
const SITE0 = [[12.3,27.1],[-30.7,2.2],[-23.6,-9.6],[-30.1,-13.2],[-33.1,-13.2],[-36.1,-10.2],[-40.3,-0.7],[-43.3,-0.2],[-47.4,-2.5],[-48.0,-8.5],[-45.0,-27.4],[-32.5,-62.4],[-0.9,-47.6],[41.5,-22.1]];
const TWR0 = [[-30.7,2.2],[-0.9,-47.6],[41.5,-22.1],[12.3,27.1]];
const POD0 = [[-0.9,-47.6],[-23.6,-9.6],[-30.1,-13.2],[-33.1,-13.2],[-36.1,-10.2],[-40.3,-0.7],[-43.3,-0.2],[-47.4,-2.5],[-48.0,-8.5],[-45.0,-27.4],[-32.5,-62.4]];
const C0 = pcen(TWR0), [SITE, TWR, POD] = shAll([SITE0, TWR0, POD0], C0);
LANDMARKS.sgfraserstower = {zh:'星狮大厦', en:'Frasers Tower', cat:'new', r:66, h:235,
  lt:{m:1, c:'#e6f2ff', k:0.6}, build(){
  const g = new THREE.Group(), B = mkB(), R = LMCTX.rng;
  const GL = {c:'#6e8f9c', m:1, fh:4.5, cw:3.0}, FIN = {c:'#d4dadc', m:0, lc:'#e8f2ff', lk:0.5}, BAND = {c:'#9db0b6', m:0, lk:0.15}, LOB = {c:'#b6c6c8', m:0, glow:'#ffe4bc', gk:0.85},
    PODC = {c:'#cfcdc6', m:0}, FOUND = '#aea89d', PAVE = '#c2bcb0', LEAF = {c:'#4e7e3c', m:0, lk:0.1}, LEAF2 = {c:'#5f8f45', m:0, lk:0.1}, TRK = '#5b4a3a', ROOF = '#8e9291',
    LED = {c:'#eef2f2', m:0, lc:'#e8f2ff', lk:1.4, glow:'#e0ecff', gk:0.3}, LAV = {c:'#c22', glow:'#ff2a1a', gk:2};
  const YL = 11, YT = 235;
  wallP(B.p(FOUND), SITE, -5, 0.3); capP(B.p(PAVE), SITE, 0.3);
  // cascading planted podium: three terraces stepping down to the west
  for (const [d, y] of [[0, 10.5], [5, 7.0], [10, 3.6]]){ const P = offP(POD, d); prismP(B.p(PODC), P, 0.3, y); capP(B.p(LEAF), offP(P, 0.6), y + 0.02);
    for (const [x, z] of alongP(offP(P, 1.2), 4)) if (R() < 0.55) latheP(B.p(LEAF2), [[0.1, y], [1.1, y + 0.4], [0.9, y + 1.3], [0.1, y + 1.6]], x, z, 6, R()*3); }
  prismP(B.p(LOB), offP(POD, 11), 0.3, 3.4);
  for (let i = 0; i < 6; i++){ const p = pcen(POD); treeP(B.p(TRK), B.p(LEAF), p[0] + (R() - 0.5)*14, 10.5, p[1] + (R() - 0.5)*14, 1.2, R); }
  // tower: flared base (the lowest ~8 storeys lean out), then a steady taper to the crown
  const c = pcen(TWR), sc = (P, f) => P.map(p => [c[0] + (p[0] - c[0])*f, c[1] + (p[1] - c[1])*f]);
  const LV = [[0.3, 0.93], [YL, 0.95], [48, 1.0], [YT - 4, 0.86]];
  const rings = LV.map(([y, f]) => sc(TWR, f).map(p => [p[0], y, p[1]]));
  prismP(B.p(LOB), sc(TWR, 0.9), 0.3, YL);
  const ringsGl = rings.slice(1); loftP(B.p(GL), ringsGl, false);
  // fins on every face following the taper, floor lines
  for (let i = 0; i < 4; i++){ const j = (i + 1) % 4; const L = Math.hypot(TWR[j][0] - TWR[i][0], TWR[j][1] - TWR[i][1]), n = Math.round(L/3.0);
    for (let k = 0; k <= n; k++){ const t = k/n, pts = ringsGl.map(r => { const a = r[i], b = r[j]; return [a[0] + (b[0] - a[0])*t, a[1], a[2] + (b[2] - a[2])*t]; });
      const o = pts.map(p => { const dx = p[0] - c[0], dz = p[2] - c[1], l = Math.hypot(dx, dz) || 1; return [p[0] + dx/l*0.45, p[1], p[2] + dz/l*0.45]; });
      for (let q = 0; q < pts.length - 1; q++) quadP(B.p(FIN), pts[q], pts[q+1], o[q+1], o[q]); } }
  for (let y = YL + 4.5; y < YT - 5; y += 4.5){ const f = y < 48 ? 0.95 + 0.05*(y - YL)/(48 - YL) : 1.0 - 0.14*(y - 48)/(YT - 4 - 48); bandAtP(B.p(BAND), sc(TWR, f), y - 0.2, 0.4, 0.05); }
  // crown: roof garden ('The Sky') behind a glass screen; lit edge
  const TOP = sc(TWR, 0.86); wallP(B.p(FIN), TOP, YT - 4, YT); capP(B.p(ROOF), TOP, YT - 3.9); capP(B.p(LEAF), offP(TOP, 2), YT - 3.8);
  for (let i = 0; i < 10; i++){ const x = c[0] + (R() - 0.5)*30, z = c[1] + (R() - 0.5)*30; if (inPolyS(offP(TOP, 3), x, z)) treeP(B.p(TRK), B.p(LEAF), x, YT - 3.8, z, 1.0, R); }
  bandAtP(B.p(LED), TOP, YT - 0.5, 0.5, 0.1); for (const p of TOP) boxP(B.p(LAV), 0.5, 0.5, 0.5, p[0]*0.97 + c[0]*0.03, YT, p[1]*0.97 + c[1]*0.03);
  B.flush(g); return g; }};
const PL = LL40(A0[0], A0[1], C0[0], C0[1]);
SG_PLACES.push({type:'sgfraserstower', lat:PL.lat, lon:PL.lon, rot:0});
}
// ================= URA Centre, 45 Maxwell Road =================
// Headquarters of the Urban Redevelopment Authority with the Singapore City Gallery (POI in the low south-west wing). Plans: OSM
// w47345221 (unnamed in the data, POI 'Singapore City Gallery' inside) with its parts: the 61 m office slab and the 13.8 m wing.
// The separate 10-storey East Wing (w171987820, across the service lane) is left to the app's block. Facade (concrete grid,
// glazing, roof) is not documented in the sources found -> generic, estimated. Night: lit floors.
{
const A0 = [1.279582, 103.845342];
const SLAB0 = [[28.2,34.5],[-26.2,-33.1],[-7.1,-48.5],[47.3,19.7]];
const WING0 = [[-31.5,-31.3],[20.4,33.3],[4.3,47.6],[-25.6,9.0],[-46.5,-24.8]];
const ALL0 = [[-31.5,-31.3],[-22.6,-20.0],[-18.4,-23.6],[-26.2,-33.1],[-7.1,-48.5],[47.3,19.7],[28.2,34.5],[19.8,24.4],[15.6,28.0],[20.4,33.3],[4.3,47.6],[-25.6,9.0],[-46.5,-24.8]];
const C0 = pcen(ALL0), [SLAB, WING, ALL] = shAll([SLAB0, WING0, ALL0], C0);
LANDMARKS.sgura = {zh:'市区重建局大厦', en:'URA Centre', cat:'new', r:58, h:61,
  lt:{m:1, c:'#ffe8c8', k:0.55}, build(){
  const g = new THREE.Group(), B = mkB();
  const CON = {c:'#d8d4ca', m:0, lk:0.2}, CON2 = {c:'#c4bfb3', m:0, lk:0.2}, GL = {c:'#4f6266', m:1, fh:3.9, cw:2.8}, LOB = {c:'#aebfc0', m:0, glow:'#ffe2b8', gk:0.85},
    FOUND = '#aca699', PAVE = '#c2bcb0', ROOF = '#918d86', LEAF = {c:'#4f7d3d', m:0, lk:0.1};
  wallP(B.p(FOUND), ALL, -5, 0.3); capP(B.p(PAVE), ALL, 0.3);
  // gallery wing
  prismP(B.p(LOB), offP(WING, 1.2), 0.3, 5.0); prismP(B.p(CON), WING, 5.0, 13.8); bandAtP(B.p(GL), WING, 7.0, 4.6, 0.04);
  for (const e of edgesF(WING)){ const n = Math.max(1, Math.round(e.L/6)); for (let k = 0; k <= n; k++) slabP(B.p(CON2), rectO(k*e.L/n - 0.4, k*e.L/n + 0.4, 0.3, 13.8), e.F, -1.2, 0.3); }
  capP(B.p(LEAF), offP(WING, 1), 13.82); parP(B.p(CON), WING, 13.8, 14.9, 0.3);
  // office slab: concrete frame, glazed bays, roof plant screen
  prismP(B.p(LOB), offP(SLAB, 1.5), 0.3, 6.0); prismP(B.p(GL), offP(SLAB, 0.4), 6.0, 57.5);
  for (let y = 6.0; y < 57; y += 3.9) bandAtP(B.p(CON), SLAB, y, 1.0, 0.0);
  for (const e of edgesF(SLAB)){ const n = Math.max(1, Math.round(e.L/4.2)); for (let k = 0; k <= n; k++){ const w = k === 0 || k === n ? 1.2 : 0.35; slabP(B.p(CON2), rectO(Math.max(0, k*e.L/n - w), Math.min(e.L, k*e.L/n + w), 0.3, 57.5), e.F, -0.4, 0.3); } }
  prismP(B.p(CON), SLAB, 57.5, 58.4); capP(B.p(ROOF), SLAB, 58.41);
  wallP(B.p(CON2), offP(SLAB, 6), 58.4, 61);
  B.flush(g); return g; }};
const PL = LL40(A0[0], A0[1], C0[0], C0[1]);
SG_PLACES.push({type:'sgura', lat:PL.lat, lon:PL.lon, rot:0});
}
