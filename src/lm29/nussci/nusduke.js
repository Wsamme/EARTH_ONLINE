// ===== lm29/nussci/nusduke.js — Duke-NUS Medical School, Outram (City Brush v32, Singapore landmark key `dukenus`) =====
//  dukenus - the Khoo Teck Puat Building of Duke-NUS Medical School (2009, CPG Consultants with RMJM), 8 College Road on the
//            SGH campus: an 11-storey research tower at the north corner, two long laboratory slabs (8 and 7 storeys) split by
//            the eight-storey glass atrium, and the raised teaching block floating on pilotis over the entrance plaza. Light
//            ceramic-tile cladding, deep horizontal aluminium sunshades and vertical fins over blue-green glass, roof plant.
// Built in the real map frame on the OSM footprint and parts (ref lm26/ref_sgdukenus.json: local +x east, +z south, rot 0).
// Only LANDMARKS and SG_PLACES are touched. No names or lettering on the model.
{
const PI = Math.PI, TAU = PI*2;
// ---- triangle batches (one LTris call per colour spec) ----
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const quadP = (o, a, b, c, d) => o.push(...a, ...b, ...c, ...a, ...c, ...d);
const tri2 = P => THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
const capP = (o, P, y) => { for (const [a, b, c] of tri2(P)) o.push(P[a][0], y, P[a][1], P[b][0], y, P[b][1], P[c][0], y, P[c][1]); };
const wallP = (o, P, y0, y1) => { const n = P.length; for (let i = 0; i < n; i++){ const a = P[i], b = P[(i + 1) % n]; quadP(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); } };
const prismP = (o, P, y0, y1, bot) => { wallP(o, P, y0, y1); capP(o, P, y1); if (bot) capP(o, P, y0); };
function boxP(o, w, h, d, x, y, z, ry){ const c = Math.cos(ry || 0), s = Math.sin(ry || 0), hw = w/2, hd = d/2, R = (px, py, pz) => [x + px*c + pz*s, py, z - px*s + pz*c];
  const P = [R(-hw, y, -hd), R(hw, y, -hd), R(hw, y, hd), R(-hw, y, hd), R(-hw, y + h, -hd), R(hw, y + h, -hd), R(hw, y + h, hd), R(-hw, y + h, hd)];
  for (const [a, b, e, f] of [[0, 1, 2, 3], [4, 7, 6, 5], [0, 4, 5, 1], [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 4, 0]]) quadP(o, P[a], P[b], P[e], P[f]); }
function cylP(o, r0, r1, y0, y1, x, z, n){ for (let i = 0; i < n; i++){ const a = i/n*TAU, b = (i + 1)/n*TAU; quadP(o, [x + Math.cos(a)*r0, y0, z + Math.sin(a)*r0], [x + Math.cos(b)*r0, y0, z + Math.sin(b)*r0], [x + Math.cos(b)*r1, y1, z + Math.sin(b)*r1], [x + Math.cos(a)*r1, y1, z + Math.sin(a)*r1]); } }
const sarea = P => { let a = 0; for (let i = 0; i < P.length; i++){ const p = P[i], q = P[(i + 1) % P.length]; a += p[0]*q[1] - q[0]*p[1]; } return a/2; };
// edges with outward normals (any winding)
const edges = P => { const s = sarea(P) > 0 ? 1 : -1, out = []; for (let i = 0; i < P.length; i++){ const a = P[i], c = P[(i + 1) % P.length], L = Math.hypot(c[0] - a[0], c[1] - a[1]), ux = (c[0] - a[0])/L, uz = (c[1] - a[1])/L;
  out.push({a, c, L, ux, uz, nn:s > 0 ? [uz, -ux] : [-uz, ux]}); } return out; };
const EP = (e, t, off) => [e.a[0] + e.ux*t + e.nn[0]*off, e.a[1] + e.uz*t + e.nn[1]*off];
const eq = (o, e, t0, t1, y0, y1, off) => { const A = EP(e, t0, off), B = EP(e, t1, off); quadP(o, [A[0], y0, A[1]], [B[0], y0, B[1]], [B[0], y1, B[1]], [A[0], y1, A[1]]); };
const efin = (o, e, t, w, d, y0, y1, off0) => { off0 = off0 || 0; eq(o, e, t - w/2, t + w/2, y0, y1, off0 + d); const A0 = EP(e, t - w/2, off0), A1 = EP(e, t - w/2, off0 + d), B0 = EP(e, t + w/2, off0), B1 = EP(e, t + w/2, off0 + d);
  quadP(o, [A0[0], y0, A0[1]], [A1[0], y0, A1[1]], [A1[0], y1, A1[1]], [A0[0], y1, A0[1]]); quadP(o, [B1[0], y0, B1[1]], [B0[0], y0, B0[1]], [B0[0], y1, B0[1]], [B1[0], y1, B1[1]]); };
const eblade = (o, e, t0, t1, y, th, d, off0) => { off0 = off0 || 0; const A0 = EP(e, t0, off0), B0 = EP(e, t1, off0), A1 = EP(e, t0, off0 + d), B1 = EP(e, t1, off0 + d);
  quadP(o, [A0[0], y + th, A0[1]], [B0[0], y + th, B0[1]], [B1[0], y + th, B1[1]], [A1[0], y + th, A1[1]]); quadP(o, [A1[0], y, A1[1]], [B1[0], y, B1[1]], [B1[0], y + th, B1[1]], [A1[0], y + th, A1[1]]); quadP(o, [A0[0], y, A0[1]], [B0[0], y, B0[1]], [B1[0], y, B1[1]], [A1[0], y, A1[1]]); };
const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t];
const inset = (P, d) => { const c = P.reduce((s, p) => [s[0] + p[0]/P.length, s[1] + p[1]/P.length], [0, 0]); return P.map(p => { const dx = p[0] - c[0], dz = p[1] - c[1], L = Math.hypot(dx, dz); return [p[0] - dx/L*d*1.41, p[1] - dz/L*d*1.41]; }); };

// ---- the OSM parts (local metres round 1.28112 N 103.83417 E) ----
const TWR = [[22.0, -33.2], [40.5, -23.1], [30.3, -4.2], [11.8, -14.2]];        // research tower, 46.8 m
const SLN = [[21.4, 11.3], [-28.8, -16.0], [-20.4, -32.0], [30.3, -4.2]];        // north lab slab, 30.3 m
const SLS = [[21.4, 11.3], [12.4, 27.3], [-37.7, 0.0], [-28.8, -16.0]];          // south lab slab, 36.9 m
const RAI = [[-16.8, 11.3], [7.6, 24.3], [-1.3, 39.7], [-25.8, 26.7]];           // raised teaching block on pilotis, 6.6-20.4 m
const FH = 4.2;

LANDMARKS.dukenus = {zh:'杜克-国大医学院', en:'Duke-NUS Medical School', cat:'new', r:50, h:50, lt:{m:0, c:'#ffe6c8', k:0.35, e:0.45}, build(){
  const g = new THREE.Group(), B = mkB();
  const TILE = '#e8e5dc', TILE2 = '#dedad0', FIN = '#f2f1ec', ALU = '#c4cacd', ROOF = '#b8bcba', PLANT = '#a7aba8', DARK = '#3b454b', GRN = '#5e8a46', PAVE = '#cdc8bd';
  const GLASS = {c:'#4d6e7e', m:1, fh:FH, cw:2.4}, ATR = {c:'#6f97a8', m:1, fh:FH, cw:1.8}, WARM = {c:'#56646c', glow:'#ffcf96', gk:0.85}, LAMP = {c:'#fff3dc', glow:'#ffd9a6', gk:1.5};
  // a block: glass skin (lit), tiled spandrels and corner piers, horizontal sunshades on the long sides, a parapet and roof
  const block = (P, y0, top, o) => { const E = edges(P);
    prismP(B.p(GLASS), P, y0 - (y0 > 1 ? 0 : 5), top);
    for (const e of E){ const long = e.L > 30;
      // tiled spandrel band at every slab, solid tiled corner piers
      for (let y = y0 + FH; y < top - 0.5; y += FH) eq(B.p(o.span || TILE), e, 0, e.L, y - 0.55, y + 0.65, 0.08);
      for (const t of [1.2, e.L - 1.2]) efin(B.p(TILE2), e, t, 2.4, 0.25, y0 - (y0 > 1 ? 0 : 5), top + 1.2);
      // structural piers every ~8.4 m
      const np = Math.max(1, Math.round(e.L/8.4)); for (let k = 1; k < np; k++) efin(B.p(TILE), e, k*e.L/np, 0.7, 0.3, y0, top + 1.2);
      // deep aluminium sunshades on the long sides, slim vertical fins on the short ones
      if (long) for (let y = y0 + FH; y < top - 0.5; y += FH) eblade(B.p(ALU), e, 2.4, e.L - 2.4, y + 0.65, 0.12, 1.1, 0.1);
      else { const nf = Math.round(e.L/1.5); for (let k = 2; k < nf - 1; k++) efin(B.p(FIN), e, k*e.L/nf, 0.12, 0.6, y0 + 0.5, top, 0.05); }
      // window mullions
      { const nm = Math.round(e.L/1.5); for (let k = 1; k < nm; k++){ const t = k*e.L/nm; eq(B.p(ALU), e, t - 0.05, t + 0.05, y0 + 0.3, top, 0.12); } }
      // parapet
      eq(B.p(TILE), e, 0, e.L, top, top + 1.2, 0); }
    capP(B.p(ROOF), P, top + 0.05); };

  // ground: plaza paving and planting beds round the building
  const site = [[-40, -4], [-20, -36], [42, -22], [27, 7], [2, 40], [-30, 34]];
  prismP(B.p(PAVE), site, -1.5, 0.08);
  for (const bed of [[[-38, 0], [-33, -8], [-27, -5], [-32, 4]], [[34, -2], [40, -12], [46, -9], [40, 2]], [[-30, 34], [-22, 38], [-18, 31], [-26, 28]]]){ prismP(B.p(TILE2), bed, 0, 0.6); capP(B.p(GRN), bed, 0.62); }

  // the research tower (11 storeys) and the two lab slabs
  block(TWR, 0, 46.8, {}); block(SLS, 0, 36.9, {}); block(SLN, 0, 30.3, {});
  // the atrium between the slabs: glazed ends and a sloping glass roof from the north slab up to the south slab
  { const a = SLN[0], b = SLN[1], na = [a[0] + (SLN[3][0] - a[0])*0.22, a[1] + (SLN[3][1] - a[1])*0.22], nb = [b[0] + (SLN[2][0] - b[0])*0.22, b[1] + (SLN[2][1] - b[1])*0.22];
    // sloping glazed roof
    quadP(B.p(ATR), [a[0], 36.9, a[1]], [b[0], 36.9, b[1]], [nb[0], 30.5, nb[1]], [na[0], 30.5, na[1]]);
    for (const [p, q] of [[a, na], [b, nb]]) B.p(ATR).push(p[0], 30.5, p[1], q[0], 30.5, q[1], p[0], 36.9, p[1]);
    // glass ends of the atrium (full height, no spandrels) + a lit void
    for (const [p, q] of [[a, na], [b, nb]]){ const e = edges([p, q, [q[0] + 0.01, q[1]]])[0], o = e.nn; quadP(B.p(ATR), [p[0] + o[0]*0.3, 0.2, p[1] + o[1]*0.3], [q[0] + o[0]*0.3, 0.2, q[1] + o[1]*0.3], [q[0] + o[0]*0.3, 30.3, q[1] + o[1]*0.3], [p[0] + o[0]*0.3, 30.3, p[1] + o[1]*0.3]); }
    // roof frame ribs over the atrium
    for (let k = 1; k < 9; k++){ const t = k/9, p = lerp2(a, b, t), q = lerp2(na, nb, t); const o = B.p(FIN); boxP(o, 0.25, 0.35, 0.25, p[0], 36.9, p[1]); const d = [q[0] - p[0], q[1] - p[1]], L = Math.hypot(d[0], d[1]);
      quadP(o, [p[0], 37.1, p[1]], [q[0], 30.7, q[1]], [q[0] + 0.2, 30.7, q[1]], [p[0] + 0.2, 37.1, p[1]]); } }
  // the tower crown: a set-back plant floor behind white louvres, the roof plant
  { const C = inset(TWR, 2.5); prismP(B.p(TILE), C, 46.8, 50, false); const E = edges(C); for (const e of E) for (let y = 47.4; y < 49.8; y += 0.8) eq(B.p(DARK), e, 0.5, e.L - 0.5, y, y + 0.35, 0.05); }
  // rooftop plant on the slabs: air-handling units, exhaust stacks, a roof garden on the north slab
  { const plant = (P, y, n) => { const c = P.reduce((s, p) => [s[0] + p[0]/4, s[1] + p[1]/4], [0, 0]), e = edges(P)[1], ang = Math.atan2(-e.uz, e.ux);
      for (let k = 0; k < n; k++){ const t = (k - (n - 1)/2)*7.5, x = c[0] + e.ux*t, z = c[1] + e.uz*t; boxP(B.p(PLANT), 5.5, 2.4, 3.6, x, y, z, ang); boxP(B.p(DARK), 4.6, 1.0, 0.1, x + e.nn[0]*1.85, y + 0.7, z + e.nn[1]*1.85, ang); } };
    plant(SLS, 36.95, 5);
    const G = inset(SLN, 3.2); capP(B.p(GRN), G, 30.5); for (let k = 0; k < 6; k++){ const p = lerp2(lerp2(G[0], G[1], 0.2 + k*0.12), lerp2(G[3], G[2], 0.2 + k*0.12), 0.5); cylP(B.p(ALU), 0.35, 0.3, 30.4, 34.5, p[0], p[1], 6); }
    for (let k = 0; k < 4; k++){ const p = lerp2(lerp2(TWR[0], TWR[2], 0.35 + k*0.1), lerp2(TWR[1], TWR[3], 0.35 + k*0.1), 0.5); cylP(B.p(ALU), 0.4, 0.34, 50, 54.5, p[0], p[1], 6); } }
  // the raised teaching block: tiled box with a long glass band, carried on round pilotis over the plaza
  { const yb = 6.6, yt = 20.4, E = edges(RAI);
    prismP(B.p(TILE), RAI, yb, yt, true);
    for (const e of E){ eq(B.p(GLASS), e, 1.5, e.L - 1.5, yb + 4.6, yb + 8.4, 0.06); eblade(B.p(ALU), e, 1.2, e.L - 1.2, yb + 8.4, 0.15, 0.9, 0.05);
      for (let t = 2; t < e.L - 1; t += 2.4) eq(B.p(TILE2), e, t, t + 0.25, yb + 1, yb + 4.4, 0.08); eq(B.p(TILE), e, 0, e.L, yt, yt + 1.0, 0); }
    capP(B.p(ROOF), RAI, yt + 0.05);
    for (const [u, v] of [[0.15, 0.2], [0.5, 0.2], [0.85, 0.2], [0.15, 0.8], [0.5, 0.8], [0.85, 0.8]]){ const p = lerp2(lerp2(RAI[0], RAI[1], u), lerp2(RAI[3], RAI[2], u), v); cylP(B.p(FIN), 0.45, 0.45, -1, yb, p[0], p[1], 10); }
    // the lit soffit and the glazed lobby under the block
    const S = inset(RAI, 1.0); capP(B.p(WARM), S, yb - 0.05); for (const [u, v] of [[0.3, 0.5], [0.7, 0.5]]){ const p = lerp2(lerp2(RAI[0], RAI[1], u), lerp2(RAI[3], RAI[2], u), v); boxP(B.p(LAMP), 1.2, 0.08, 1.2, p[0], yb - 0.2, p[1]); } }
  // ground floor: warm lobby glazing on the plaza side of the south slab, a canopy over the drop-off on College Road (east)
  { const e = edges(SLS)[2]; eq(B.p(WARM), e, 4, e.L - 4, 0.2, 3.8, 0.12);
    // a covered walkway along the plaza side: slab canopy on slim columns
    eblade(B.p(FIN), e, 2, e.L - 2, 4.2, 0.35, 3.2, 0); for (let t = 3; t < e.L - 2; t += 6){ const p = EP(e, t, 2.9); cylP(B.p(ALU), 0.16, 0.16, -0.5, 4.2, p[0], p[1], 6); }
    const f = edges(TWR)[1]; eblade(B.p(FIN), f, 2, f.L - 2, 4.2, 0.4, 5.5, 0); for (const t of [3, f.L - 3]){ const p = EP(f, t, 5.1); cylP(B.p(ALU), 0.2, 0.2, -0.5, 4.2, p[0], p[1], 8); }
    eq(B.p(WARM), f, 2.5, f.L - 2.5, 0.2, 3.9, 0.12); }
  // a few rain trees on the west lawn and by the plaza
  for (const [x, z, k] of [[-37, -1, 1.0], [-33, 8, 0.85], [-23, 34, 0.95], [-11, 38, 0.8]]){ cylP(B.p('#5b4a3a'), 0.35*k, 0.28*k, -0.5, 3.4*k, x, z, 6);
    const pr = [[0.2, 0], [2.9, 1.0], [3.4, 2.3], [2.4, 3.6], [0.2, 4.2]].map(([r, h]) => [r*k, 2.6*k + h*k]); for (let j = 0; j < pr.length - 1; j++) cylP(B.p(GRN), pr[j][0], pr[j + 1][0], pr[j][1], pr[j + 1][1], x, z, 8); }
  B.flush(g); return g; }};
SG_PLACES.push({type:'dukenus', lat:1.28112, lon:103.83417, rot:0});
}
