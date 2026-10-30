// ===== lm34/sgx_hero — five hero landmarks for the Singapore page (City Brush)
// All five are new (none of these keys existed). Each one sits on its real OSM footprint,
// rot 0, local +x east and +z south. y = 0 is the ground the app places the model on.
// No logos, brand marks or writing on the models. Heights below are the published figures
// (Wikipedia / the building's own infobox), except the mosque domes, which are sized from
// the footprint because no dome height is published, and SOTA, whose 50 m is the OSM height
// tag on this same footprint.
//
//   sgmillenia    ★ Millenia Tower        OSM way/48035153   1 Temasek Avenue     roof 218 m, 41 storeys
//   sgcentennial  ★ Centennial Tower      OSM way/155988210  3 Temasek Avenue     roof 158 m, 37 storeys
//   sgcapital     ★ Capital Tower         OSM way/47345009   168 Robinson Road    roof 254 m, 52 storeys
//   sgsota        ★ School of the Arts    OSM way/107937797  1 Zubir Said Drive   OSM height 50 m
//   sgmalabar     ★ Malabar Mosque        OSM way/531916524  471 Victoria Street  blue tile, gold onion domes
//
// Block-scoped: only LANDMARKS and SG_PLACES are touched.
{
const PI = Math.PI, TAU = PI * 2;
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const quadP = (o, a, b, c, d) => o.push(a[0],a[1],a[2], b[0],b[1],b[2], c[0],c[1],c[2], a[0],a[1],a[2], c[0],c[1],c[2], d[0],d[1],d[2]);
const triP = (o, a, b, c) => o.push(a[0],a[1],a[2], b[0],b[1],b[2], c[0],c[1],c[2]);
const ctr = P => { let x = 0, z = 0; for (const p of P){ x += p[0]; z += p[1]; } return [x / P.length, z / P.length]; };
const scaleRing = (P, s, c) => { c = c || ctr(P); return P.map(p => [c[0] + (p[0] - c[0]) * s, c[1] + (p[1] - c[1]) * s]); };
// walls between two rings of the same length (a closed plan at two heights)
function loftP(o, A, yA, B, yB){ const n = A.length; for (let i = 0; i < n; i++){ const j = (i + 1) % n; quadP(o, [A[i][0], yA, A[i][1]], [A[j][0], yA, A[j][1]], [B[j][0], yB, B[j][1]], [B[i][0], yB, B[i][1]]); } }
function capP(o, P, y){ const c = ctr(P); for (let i = 0; i < P.length; i++){ const j = (i + 1) % P.length; triP(o, [c[0], y, c[1]], [P[i][0], y, P[i][1]], [P[j][0], y, P[j][1]]); } }
// four corners of a roughly square plan: vertices far from the centre and not bunched on one side
function far4(P){
  const c = ctr(P), V = P.map(p => ({p, d: Math.hypot(p[0] - c[0], p[1] - c[1]), a: Math.atan2(p[1] - c[1], p[0] - c[0])}));
  V.sort((a, b) => b.d - a.d); const pick = [];
  for (const v of V){ if (pick.every(q => Math.abs(Math.atan2(Math.sin(v.a - q.a), Math.cos(v.a - q.a))) > 0.7)) pick.push(v); if (pick.length === 4) break; }
  return pick.map(v => v.p);
}
// a round-arch outline in a facade (u across, v up), for the blue mosque's openings
function archO(hw, ht){ const n = 7, rise = Math.min(hw, ht * 0.45), P = [[-hw, 0], [hw, 0], [hw, ht - rise]];
  for (let i = 0; i <= n; i++){ const a = PI * (1 - i / n); P.push([Math.cos(a) * hw, ht - rise + Math.sin(a) * rise]); } P.push([-hw, ht - rise]); return P; }
const sArea = P => { let A = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length]; A += a[0] * b[1] - b[0] * a[1]; } return A / 2; };
// one facade frame per edge: u runs along the edge, w points outward
function edgesF(P){ const sg = sArea(P) > 0 ? 1 : -1, out = [];
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-6, ex = (b[0] - a[0]) / L, ez = (b[1] - a[1]) / L, nx = ez * sg, nz = -ex * sg;
    out.push({L, a, ex, ez, nx, nz, F:(u, v, w) => [a[0] + ex * u + nx * (w || 0), v, a[1] + ez * u + nz * (w || 0)]}); }
  return out; }
function shapeP(o, pts, F, w){
  // fan from the first point — arch outlines are convex enough
  for (let i = 1; i < pts.length - 1; i++){ const A = F(pts[0][0], pts[0][1], w), B = F(pts[i][0], pts[i][1], w), C = F(pts[i + 1][0], pts[i + 1][1], w); triP(o, A, B, C); }
}
function slabP(o, pts, F, w0, w1){ shapeP(o, pts, F, w1); for (let i = 0; i < pts.length; i++){ const a = pts[i], b = pts[(i + 1) % pts.length]; quadP(o, F(a[0], a[1], w0), F(b[0], b[1], w0), F(b[0], b[1], w1), F(a[0], a[1], w1)); } }
// cut a plan into the strip where v (across the short axis) is between v0 and v1
function frameOf(P){
  const c = ctr(P); let xx = 0, zz = 0, xz = 0;
  for (const p of P){ const x = p[0] - c[0], z = p[1] - c[1]; xx += x * x; zz += z * z; xz += x * z; }
  let ang = 0.5 * Math.atan2(2 * xz, xx - zz), c0 = Math.cos(ang), s0 = Math.sin(ang), vu = 0, vv = 0;
  for (const p of P){ const x = p[0] - c[0], z = p[1] - c[1], u = x * c0 + z * s0, v = -x * s0 + z * c0; vu += u * u; vv += v * v; }
  if (vv > vu) ang += PI / 2;
  const co = Math.cos(ang), si = Math.sin(ang);
  const L = (x, z) => [(x - c[0]) * co + (z - c[1]) * si, -(x - c[0]) * si + (z - c[1]) * co];
  return {L};
}
function clipHalf(P, inside, hit){ if (!P.length) return []; const out = [];
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], ia = inside(a), ib = inside(b);
    if (ia && ib) out.push(b); else if (ia && !ib) out.push(hit(a, b)); else if (!ia && ib){ out.push(hit(a, b)); out.push(b); } }
  return out;
}
function clipBand(P, vOf, v0, v1){
  const hit = (a, b, v) => { const va = vOf(a), vb = vOf(b), t = (v - va) / ((vb - va) || 1e-6); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; };
  let Q = clipHalf(P, p => vOf(p) >= v0 - 1e-4, (a, b) => hit(a, b, v0));
  Q = clipHalf(Q, p => vOf(p) <= v1 + 1e-4, (a, b) => hit(a, b, v1));
  return Q.filter((p, i) => Math.hypot(p[0] - Q[(i + Q.length - 1) % Q.length][0], p[1] - Q[(i + Q.length - 1) % Q.length][1]) > 0.4);
}
const GLASS = (c, fh) => ({c, m:1, fh: fh || 4.0, cw:3.0, ds:true});
const RED = {c:'#ffb0b0', glow:'#ff2a2a', gk:2.4, m:0, ds:true};

// ---------- footprints (metres from the anchor, +x east, +z south) ----------
const SGMILLENIA = {lat:1.2926332, lon:103.8603017, r:37.5, way:48035153, P:[[-28.26,8.6],[8.79,28.03],[18.73,9.32],[28.02,-8.16],[-9.03,-27.58],[-18.25,-10.23]]};
const SGCENTENNIAL = {lat:1.2934365, lon:103.8602859, r:44.6, way:155988210, P:[[-35.17,-6.54],[-29.05,5.73],[-21.8,13.71],[-14.93,18.37],[-12.25,16.51],[-9.03,17.03],[-6.68,19.55],[-6.95,22.75],[8.34,28.16],[23.94,27.64],[24.07,26.14],[22.37,26.08],[22.42,24.22],[26.18,23.63],[27.15,19.19],[31.52,13.77],[30.49,10.58],[32.07,8.96],[32.57,9.77],[34.26,9.16],[29.67,-0.17],[23.13,-8.58],[14.36,-14.85],[12.65,-12.84],[8.12,-13.51],[6.03,-15.51],[6.55,-18.99],[-2.33,-23.24],[-14.06,-24.74],[-24.9,-23.83],[-24.63,-22.62],[-23.67,-22.77],[-23.69,-20.71],[-27.01,-20.03],[-29.03,-13.87],[-32.63,-10.02],[-31.59,-7.5]]};
const SGCAPITAL = {lat:1.2776741, lon:103.8476538, r:53.4, way:47345009, P:[[-43.63,12.38],[-36.25,16.94],[-0.36,39.17],[7.43,43.98],[8.99,41.5],[31.51,5.6],[39.44,-7.07],[22.65,-17.47],[25.24,-21.59],[10.13,-30.95],[7.83,-27.26],[-11.34,-39.13],[-19.56,-26],[-42.08,9.91]]};
const SGSOTA = {lat:1.2992411, lon:103.8486383, r:83.4, way:107937797, P:[[-48.92,-48.24],[-43.2,-36.25],[-29.33,-25.08],[-45.44,-4.78],[-43.31,-3.01],[-45.18,-0.48],[-36.86,6.07],[-34.9,3.69],[-32.72,5.16],[-31.88,3.93],[-26.99,20.61],[-32.26,27.51],[-30.12,29.22],[-31.29,30.81],[-23.35,37.61],[-22.32,36.56],[-20.34,38.23],[-14.93,31.37],[-1.1,36.52],[-3.56,39.25],[-1.04,41.39],[-2.21,42.9],[5.47,48.68],[6.49,47.66],[9.24,48.78],[34.84,15.82],[36.04,16.96],[41.67,9.76],[40.34,8.69],[66.13,-24.58],[64.06,-26.06],[66.47,-29.55],[12.22,-74.4],[10.97,-72.99],[8.13,-73.78],[4.93,-69.62]]};
const SGMALABAR = {lat:1.3051674, lon:103.8597777, r:36.3, way:531916524, P:[[-20.11,8.47],[-5.09,27.79],[21.19,7.24],[20.84,2.82],[6.9,-17.51],[2.11,-11.44],[1.73,-7.16],[-5.63,-8.42],[-10.91,-3.2],[-11.04,1.42]]};

const place = k => { const D = {sgmillenia:SGMILLENIA, sgcentennial:SGCENTENNIAL, sgcapital:SGCAPITAL, sgsota:SGSOTA, sgmalabar:SGMALABAR}[k]; SG_PLACES.push({type:k, lat:D.lat, lon:D.lon, rot:0}); };

// ================= ★ Millenia Tower (Kevin Roche, 1996) =================
// Published account (Georges Binder, Tall Buildings of Asia and Australia): a square plan standing
// on four lit cylinders around a glass lobby five storeys high, with a big pyramidal roof.
// Roof 218 m, 41 storeys. The pyramid and the four glowing cylinders are what you recognise.
LANDMARKS.sgmillenia = {zh:'美年大厦', en:'Millenia Tower', cat:'new', r:SGMILLENIA.r, h:218, lt:{m:1, c:'#e4eef8', k:0.72}, build(){
  const g = new THREE.Group(), B = mkB(), P = SGMILLENIA.P, c = ctr(P);
  const STONE = {c:'#ddd6c8', m:0, lk:0.3, ds:true}, CYL = {c:'#f6f1e6', glow:'#ffe6b4', gk:1.45, m:0, ds:true};
  const LOB = {c:'#c5dde2', m:0, glow:'#fff1d4', gk:0.85, ds:true}, GL = GLASS('#8eacb4', 4.0);
  const PY = {c:'#d7e2e6', m:1, fh:8, cw:5, glow:'#f7fbff', gk:0.55, ds:true}, RIB = {c:'#f4f7f8', glow:'#fff6dc', gk:1.15, m:0};
  // plaza and a foundation, so a slope does not leave the tower standing on air
  LPoly(g, scaleRing(P, 1.06, c), -10, 10.3, STONE);
  // four illuminated cylinders: the tower "rests" on them, and they frame the lobby
  for (const p of far4(P)) LCyl(g, 3.3, 3.7, 22, p[0], 0, p[1], CYL, 18);
  LPoly(g, scaleRing(P, 0.62, c), 0.4, 21.2, LOB);
  // office shaft, set in from the cylinders
  const S = scaleRing(P, 0.86, c);
  LPoly(g, S, 22, 148, GL);
  for (let y = 36; y < 166; y += 18) LPoly(g, scaleRing(S, 1.025, c), y, 0.4, {c:'#eceae4', m:0, lk:0.25, ds:true});
  // the pyramidal roof, 170 m to 218 m, following the real plan as it tapers
  const y0 = 170, top = scaleRing(S, 0.07, c);
  loftP(B.p(PY), S, y0, top, 214); capP(B.p(PY), top, 214);
  // a rib along each hip of the pyramid, from the eave up to the tip
  for (const p of far4(S)){ const q = [c[0] + (p[0] - c[0]) * 0.07, c[1] + (p[1] - c[1]) * 0.07];
    LBeam(g, [p[0], y0 + 0.4, p[1]], [q[0], 214.4, q[1]], 0.55, RIB, 5); }
  LCyl(g, 0.15, 0.7, 4.2, c[0], 214, c[1], RED, 8);
  B.flush(g); return g;
}};
place('sgmillenia');

// ================= ★ Centennial Tower =================
// Kevin Roche, completed 1997, reclad in 2015 by Thom Mayne. 158 m, 37 storeys.
// The plan is the real rounded OSM footprint (an oval with a bite taken out of one side).
// The current skin is a plain glass curtain wall with horizontal spandrels — the 2015 cladding —
// rather than a guess at a folded pattern the sources do not describe.
LANDMARKS.sgcentennial = {zh:'盛年大厦', en:'Centennial Tower', cat:'new', r:SGCENTENNIAL.r, h:158, lt:{m:1, c:'#dce8f2', k:0.7}, build(){
  const g = new THREE.Group(), P = SGCENTENNIAL.P, c = ctr(P);
  const STONE = {c:'#d5dbe0', m:0, lk:0.28, ds:true}, GL = GLASS('#9eb4be', 3.75), BAND = {c:'#e7eef2', m:0, lk:0.35, ds:true};
  const LOU = {c:'#c5ced4', m:0, lk:0.4, ds:true};
  LPoly(g, scaleRing(P, 1.03, c), -8, 8.4, {c:'#cfc8bc', m:0, lk:0.2, ds:true});
  LPoly(g, P, 0, 8, STONE);
  LPoly(g, scaleRing(P, 0.98, c), 8, 138, GL);
  for (let y = 16; y < 142; y += 14) LPoly(g, scaleRing(P, 1.012, c), y, 0.38, BAND);
  // plant screen on the roof, inset, with a few louvre bands
  const C = scaleRing(P, 0.82, c);
  LPoly(g, C, 146, 10, LOU);
  for (let y = 147.2; y < 155; y += 1.6) LPoly(g, scaleRing(C, 1.03, c), y, 0.28, {c:'#8e99a1', m:0, lk:0.5, ds:true});
  LCyl(g, 0.12, 0.45, 2.4, c[0], 156, c[1], RED, 6);
  return g;
}};
place('sgcentennial');

// ================= ★ Capital Tower (RSP, 2000) =================
// 254 m roof, 52 storeys, 168 Robinson Road. The office shaft is dark glass.
// Above the occupied floors the roof becomes an open cage of vertical ribs, lit at night.
// There is no logo and no lettering on the cage.
LANDMARKS.sgcapital = {zh:'资金大厦', en:'Capital Tower', cat:'new', r:SGCAPITAL.r, h:254, lt:{m:1, c:'#d5e2f4', k:0.7}, build(){
  const g = new THREE.Group(), P = SGCAPITAL.P, c = ctr(P);
  const POD = {c:'#c8c2b6', m:0, lk:0.3, ds:true}, GL = GLASS('#4e6578', 4.05);
  const BAND = {c:'#d9d4c8', m:0, lk:0.35, ds:true};
  const FIN = {c:'#f4f1e8', glow:'#fff3cc', gk:1.35, m:0, ds:true}, CORE = GLASS('#8ea4b4', 4.2);
  LPoly(g, scaleRing(P, 1.04, c), -8, 8.3, {c:'#b7b1a4', m:0, ds:true});
  LPoly(g, P, 0, 14, POD);
  // a glass lobby set inside the stone base, slightly proud on purpose so the entrance reads
  LPoly(g, scaleRing(P, 0.55, c), 0.3, 12, {c:'#d5e4ea', m:0, glow:'#fff0d0', gk:0.7, ds:true});
  const S = scaleRing(P, 0.9, c);
  LPoly(g, S, 14, 218, GL);
  for (let y = 28; y < 226; y += 22) LPoly(g, scaleRing(S, 1.02, c), y, 0.55, BAND);
  // crown: an inner glass lantern and a ring of lit vertical ribs, 232 m to 254 m
  LPoly(g, scaleRing(S, 0.72, c), 230, 20, CORE);
  const crown = scaleRing(S, 0.92, c);
  for (const e of edgesF(crown)){ const n = Math.max(2, Math.round(e.L / 8));
    for (let k = 0; k < n; k++){ const u = e.L * (k + 0.5) / n, p = e.F(u, 232, 0.4);
      LBox(g, 1.05, 22, 1.35, p[0], 232, p[2], FIN, -Math.atan2(e.ez, e.ex)); } }
  LPoly(g, scaleRing(crown, 1.01, c), 252.5, 1.3, FIN);
  LCyl(g, 0.2, 0.55, 2.2, c[0], 253.5, c[1], RED, 6);
  return g;
}};
place('sgcapital');

// ================= ★ School of the Arts (WOHA) =================
// The school moved into this campus in January 2010 (1 Zubir Said Drive).
// The OSM footprint is one long block. Above a shared podium it is cut into three parallel bars
// — the raised "fingers" — with open sky between them and a perforated screen of horizontal fins.
// Bar tops follow the 50 m height tagged on this footprint.
LANDMARKS.sgsota = {zh:'新加坡艺术学院', en:'School of the Arts', cat:'new', r:SGSOTA.r, h:50, lt:{m:1, c:'#e7efe4', k:0.55, fh:3.5, cw:2.6}, build(){
  const g = new THREE.Group(), P = SGSOTA.P, c = ctr(P);
  const CONC = {c:'#d2cdc2', m:0, lk:0.25, ds:true}, BASE = GLASS('#b9c3bc', 4.2);
  const BAR = GLASS('#8f978f', 3.4), FIN = {c:'#6e756f', m:0, lk:0.45, ds:true}, GAP = {c:'#c5ddd8', m:0, glow:'#fff0d2', gk:0.4, ds:true};
  LPoly(g, scaleRing(P, 1.02, c), -12, 12.4, {c:'#b7b3a8', m:0, ds:true});
  LPoly(g, P, 0, 5.2, BASE);
  LPoly(g, scaleRing(P, 0.985, c), 5.2, 9.6, CONC);
  // three bars across the short axis of the real plan
  const F = frameOf(P), vOf = p => F.L(p[0], p[1])[1];
  let v0 = 1e9, v1 = -1e9; for (const p of P){ const v = vOf(p); if (v < v0) v0 = v; if (v > v1) v1 = v; }
  // gaps wide enough that the three bars read as separate fingers from the street
  const gap = (v1 - v0) * 0.13, w = ((v1 - v0) - 2 * gap) / 3;
  for (let i = 0; i < 3; i++){
    const a = v0 + i * (w + gap), b = a + w;
    const Q = clipBand(P, vOf, a, b);
    if (Q.length < 3) continue;
    LPoly(g, Q, 14.6, 35.2, BAR);
    // the perforated screen reads, at this distance, as a stack of horizontal fins
    const qc = ctr(Q);
    for (let y = 18; y < 48; y += 3.2) LPoly(g, scaleRing(Q, 1.015, qc), y, 0.18, FIN);
    LPoly(g, scaleRing(Q, 0.96, qc), 49.2, 0.7, {c:'#9aa397', m:0, ds:true});
  }
  // a low glass link so the three bars read as one school, not three towers
  LPoly(g, scaleRing(P, 0.55, c), 14.6, 4.2, GAP);
  return g;
}};
place('sgsota');

// ================= ★ Malabar Mosque, the Blue Mosque (A.H. Siddique, 1963) =================
// Blue lapis-tile walls (the tiles date from the 1995 renovation) and golden onion domes.
// Wikipedia records a single minaret two metres tall, with its own small golden cap — not a pair
// of tall towers — so that is what is modelled. Dome sizes are taken from the footprint:
// no published dome height was found. The plan already faces the way the real building does.
LANDMARKS.sgmalabar = {zh:'马拉巴回教堂', en:'Malabar Mosque', cat:'old', r:SGMALABAR.r, h:32, lt:{m:0, c:'#d7e2ff', k:0.95, e:0.45, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB(), P = SGMALABAR.P, c = ctr(P);
  const BLUE = {c:'#1a468f', m:0, lc:'#d5e4ff', lk:0.9, ds:true}, BLUE2 = {c:'#2456a8', m:0, lc:'#d5e4ff', lk:0.9, ds:true};
  const WHITE = {c:'#f6f2e8', m:0, lk:0.7, ds:true}, DARK = {c:'#1a2230', glow:'#ffd9a6', gk:0.28, m:0, ds:true};
  const GOLD = {c:'#e0b03a', glow:'#ffd56a', gk:1.15, m:0, ds:true}, GOLD2 = {c:'#f0cb6a', glow:'#ffe08a', gk:1.3, m:0};
  LPoly(g, scaleRing(P, 1.04, c), -6, 6.5, {c:'#c9c3b4', m:0, ds:true});
  // two-storey prayer block (the hall is on the upper floor) in two blues, like tile courses
  LPoly(g, P, 0, 6.2, BLUE);
  LPoly(g, scaleRing(P, 0.992, c), 6.2, 5.4, BLUE2);
  LPoly(g, scaleRing(P, 1.015, c), 11.4, 0.7, WHITE);
  LPoly(g, scaleRing(P, 1.01, c), 5.9, 0.45, WHITE);
  // arched openings on every long wall
  for (const e of edgesF(P)){ if (e.L < 8) continue; const n = Math.max(2, Math.round(e.L / 4.4)), bw = e.L / n;
    for (let k = 0; k < n; k++){ const u = bw * (k + 0.35);
      for (const yb of [1.1, 6.8]){ const ht = yb < 3 ? 3.6 : 3.3, hw = Math.min(1.15, bw * 0.32);
        const F = (uu, vv, w) => e.F(u + uu, yb + vv, w);
        slabP(B.p(WHITE), archO(hw + 0.18, ht + 0.2), F, 0.02, 0.28);
        shapeP(B.p(DARK), archO(hw, ht), F, 0.34); } } }
  // golden onion domes: one large, and a smaller one toward each corner
  const onion = r => [[r * 0.25, 0], [r * 0.9, r * 0.15], [r * 1.05, r * 0.55], [r * 0.85, r * 0.95], [r * 0.4, r * 1.4], [r * 0.1, r * 1.72], [0.04, r * 1.9]];
  const domeAt = (x, z, r, y) => { LCyl(g, r * 0.55, r * 0.7, r * 0.45, x, y, z, WHITE, 16); LLathe(g, onion(r), x, y + r * 0.4, z, GOLD, 22); LCyl(g, 0.06, 0.12, r * 0.55, x, y + r * 0.4 + r * 1.85, z, GOLD2, 6); };
  domeAt(c[0], c[1], 6.4, 12.1);
  for (const p of far4(scaleRing(P, 0.58, c))) domeAt(p[0], p[1], 2.5, 12.1);
  // the single 2 m minaret, with a small golden cap, standing on the roof at one corner
  const m = far4(P)[0];
  LCyl(g, 0.42, 0.5, 2.0, m[0], 12.2, m[1], WHITE, 10);
  LLathe(g, onion(0.55), m[0], 14.2, m[1], GOLD, 12);
  B.flush(g); return g;
}};
place('sgmalabar');

// Test handle used to frame screenshots. It only moves the camera the app already has.
window.__sgx = {
  ready(){ return landmarks.some(L => L.type === 'sgmillenia' && L.top != null) && landmarks.some(L => L.type === 'sgmalabar' && L.top != null); },
  names(){ return landmarks.filter(L => ['sgmillenia','sgcentennial','sgcapital','sgsota','sgmalabar'].includes(L.type)).map(L => ({type:L.type, top:+L.top.toFixed(2), x:+L.x.toFixed(1), y:+L.y.toFixed(1), h:LANDMARKS[L.type].h})); },
  // heading 0: camera sits south of the building. dist is metres. night uses 21:30.
  look(type, dist, heading, elev, night){
    const L = landmarks.find(q => q.type === type); if (!L) return false;
    const aimY = (L.top || 0) + Math.min(LANDMARKS[type].h * 0.42, 90);
    const horiz = Math.cos(elev) * dist, vert = Math.sin(elev) * dist;
    camera.position.set(L.x + Math.sin(heading) * horiz, aimY + vert, -L.y + Math.cos(heading) * horiz);
    controls.target.set(L.x, aimY, -L.y);
    if (controls.update) controls.update();
    tod = night ? 21.3 : 11.5; todPlay = false; applyTime();
    return true;
  }
};
}
