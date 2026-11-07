

// ======================================================================================================
// Capella Singapore (Foster + Partners with DP Architects, 2009). fosterandpartners.com: two 1880s Tanah Merah military
// buildings — white, tall pitched terracotta roofs — restored as the resort's gateway; the new hotel extends from both sides of
// them in a continuous plan curving round garden courtyards, its top level with the colonial roofs, under a shallow curved
// roof canopy (which gains an extra storey) that overhangs to shelter the walkways; facades of horizontal brise-soleil in earth
// tones. OSM: w116818220 = the two colonial blocks (with their north porches), w116818069 = Foster's curving wing (the two
// loops), w163201812 = the small round pavilion in the east courtyard (OSM h 6.8). The villas (OSM, unmodelled) stay as they are.
// Colonial blocks: two storeys with verandahs on square piers, hipped roofs; ridge 15.9 m (OSM). Night: warm floodlight
// on the white colonial blocks (breathe), lit rooms in the wing.
// ======================================================================================================
{
const LAT = 1.249698, LON = 103.824432, RR = 100;
const WING = [[-42.9,-17.2],[-44.7,-5.3],[-49.5,-5.9],[-53.1,-4.7],[-59.0,0.0],[-64.4,8.3],[-64.4,13.7],[-63.2,19.6],[-58.5,24.9],[-51.3,27.9],[-44.7,27.3],[-28.0,21.4],[-25.6,22.0],[-7.1,22.6],[8.4,29.7],[16.8,36.2],[19.8,36.8],[31.7,54.6],[37.7,58.7],[44.8,61.1],[52.0,60.5],[57.4,58.2],[62.1,55.2],[65.7,50.4],[68.1,44.5],[68.7,34.4],[63.3,23.8],[58.6,19.6],[58.6,16.6],[50.8,14.3],[53.2,3.0],[62.7,6.0],[72.3,13.1],[78.9,22.0],[82.4,33.2],[82.4,42.1],[80.7,49.9],[77.7,56.4],[72.9,62.9],[67.5,67.6],[60.4,71.8],[47.2,74.8],[40.1,73.6],[32.9,71.2],[21.5,62.9],[8.4,44.5],[0.7,40.4],[-15.5,35.0],[-23.2,34.4],[-29.8,35.6],[-42.3,41.0],[-54.3,41.0],[-65.6,36.8],[-72.2,30.3],[-77.6,17.8],[-77.0,1.8],[-70.4,-7.1],[-62.0,-14.2],[-54.3,-16.6]];
const AXA = 0.1697, AX = [Math.cos(AXA), Math.sin(AXA)];       // long axis of the colonial blocks (u east-south-east)
const U = (u, v) => [u*AX[0] - v*AX[1], u*AX[1] + v*AX[0]];  // block frame -> plan
LANDMARKS.sgcapella = {zh:'嘉佩乐酒店', en:'Capella Singapore', cat:'old', r:RR, h:16, lt:{m:0, c:'#ffe2b8', k:0.75, e:0.6, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB();
  const WHT = {c:'#f2f0e8', m:0, lk:0.8}, TER = {c:'#a5553b', m:0, lk:0.35}, WIN = {c:'#4b545b', glow:'#ffd9a6', gk:0.4}, PIER = {c:'#e9e6dc', m:0, lk:0.7};
  const GLW = {c:'#58676c', m:1, fh:3.6, cw:3.2, lc:'#ffe4c0', lk:0.5}, LOUV = {c:'#9a8467', m:0, lk:0.2}, CAN = {c:'#dcd8cf', m:0, lk:0.35}, SLAB = {c:'#ece9e1', m:0, lk:0.3};
  const BASE = {c:'#a69f90', m:0, lk:0.1}, GRN = {c:'#5d8a4a', m:0, lk:0};
  const yb = -5;
  // ---- the two colonial blocks: [u0, u1, v0, v1] in the block frame, north porches [u0, u1, v0]
  const BLK = [[-45.2, -1.5, -8.5, 10.9, [-28.1, -13.6, -13.3]], [0.5, 52.3, -7.4, 10.4, [20.6, 29.2, -13.4]]];
  const H1 = 4.8, H2 = 9.4, EV = 9.9, RID = 15.9, VER = 2.6;
  for (const [u0, u1, v0, v1, po] of BLK){
    const cu = (u0 + u1)/2, cv = (v0 + v1)/2, hu = (u1 - u0)/2, hv = (v1 - v0)/2, c = U(cu, cv);
    const outer = rectR(c, AX, hu, hv), inner = rectR(c, AX, hu - VER, hv - VER);
    // plinth, core walls (white) with windows, floors, verandah floors
    wallP(B.p(BASE), outer, yb, 0.6); flatPoly(B.p(SLAB), outer, 0.6);
    wallP(B.p(WHT), inner, 0.6, EV); flatPoly(B.p(SLAB), outer, H1 + 0.05);
    edgeBands(B.p(WHT), outer, H1 - 0.35, H1 + 0.35, 0.02);
    // tall windows / french doors on both floors
    for (const [ya, yb2] of [[1.2, H1 - 0.9], [H1 + 0.9, H2 - 0.6]]) edgeFins(B.p(WIN), inner, ya, yb2, 3.2, 1.35, 0.06);
    // verandah piers (ground) and posts (upper), the upper balustrade
    for (let i = 0; i < 4; i++){ const a = outer[i], b = outer[(i+1) % 4], L = Math.hypot(b[0]-a[0], b[1]-a[1]), n = Math.round(L/3.6);
      for (let k = 0; k <= n; k++){ const t = k/n, p = [lerp(a[0], b[0], t), lerp(a[1], b[1], t)], q = [lerp(p[0], c[0], 0.35/hu*0), lerp(p[1], c[1], 0)];
        const ins = [p[0] + (c[0] - p[0])*(0.35/Math.hypot(c[0] - p[0], c[1] - p[1])), p[1] + (c[1] - p[1])*(0.35/Math.hypot(c[0] - p[0], c[1] - p[1]))];
        boxP(B.p(PIER), 0.7, H1 - 0.35, 0.7, ins[0], 0.6, ins[1], Math.atan2(-AX[1], AX[0]));
        boxP(B.p(PIER), 0.4, EV - H1 - 0.35, 0.4, ins[0], H1 + 0.35, ins[1], Math.atan2(-AX[1], AX[0])); } }
    edgeBands(B.p(PIER), rectR(c, AX, hu - 0.35, hv - 0.35), H1 + 0.35, H1 + 1.35, 0);
    edgeBands(B.p(WHT), outer, EV - 0.6, EV, 0.05);
    // the tall hipped terracotta roof over the verandahs (eaves overhang 0.9 m)
    hipP(B.p(TER), c, AX, hu, hv, EV, RID, 0.9);
    // the north porch: two storeys, its own hipped roof
    const [pu0, pu1, pv0] = po, pc = U((pu0 + pu1)/2, (pv0 + v0)/2), phu = (pu1 - pu0)/2, phv = (v0 - pv0)/2;
    const PR = rectR(pc, AX, phu, phv);
    wallP(B.p(BASE), PR, yb, 0.6); flatPoly(B.p(SLAB), PR, 0.6); flatPoly(B.p(SLAB), PR, H1 + 0.05);
    for (const [k, t] of [[0, 0.02], [1, 0.36], [2, 0.64], [3, 0.98]]){ const p = U(lerp(pu0, pu1, t), pv0 + 0.5);
      boxP(B.p(PIER), 0.8, H1 - 0.35, 0.8, p[0], 0.6, p[1], Math.atan2(-AX[1], AX[0])); boxP(B.p(PIER), 0.45, EV - H1 - 0.35, 0.45, p[0], H1 + 0.35, p[1], Math.atan2(-AX[1], AX[0])); }
    edgeBands(B.p(PIER), PR, H1 + 0.35, H1 + 1.35, -0.2);
    hipP(B.p(TER), pc, AX, phu, phv, EV - 0.4, EV + 3.6, 0.6);
  }
  // ---- Foster's wing: four levels (the top one under the curved canopy), glass behind earth-tone brise-soleil bands
  { const P = WING, y0 = 0.6, LV = [0.6, 4.2, 7.8, 11.4], yT = 14.6;
    wallP(B.p(BASE), P, yb, y0); wallP(B.p(GLW), P, y0, yT); flatPoly(B.p(SLAB), P, yT);
    for (const y of LV.slice(1)) edgeBands(B.p(SLAB), P, y - 0.25, y + 0.25, 0.35);
    // brise-soleil: three slender horizontal louvre bands per level, held 0.9 m off the glass
    for (const y of LV) for (const f of [0.95, 1.75, 2.55]) edgeBands(B.p(LOUV), P, y + f, y + f + 0.22, 0.9);
    edgeFins(B.p(LOUV), P, y0, yT, 4.5, 0.12, 1.0);
    // the shallow curved roof canopy: an outset plate on a slight camber, deep fascia, slim columns at the overhang
    const O = offRing(P, 2.2), yc = yT + 0.9;
    flatPoly(B.p(CAN), O, yc + 0.45); wallP(B.p(CAN), O, yc, yc + 0.45); flatPoly(B.p(CAN), O, yc);
    for (let i = 0; i < O.length; i += 2){ const p = O[i]; boxP(B.p(SLAB), 0.3, yc - y0, 0.3, p[0], y0, p[1], 0); }
    // the garden courtyards inside the loops (lawns)
    for (const [c, r] of [[[-58.8, 15.8], 9.5], [[54.5, 39.5], 13.5]]){ const o = B.p(GRN), n = 18; for (let i = 0; i < n; i++){ const a0 = i/n*TAU, a1 = (i+1)/n*TAU;
      triP(o, [c[0], 0.35, c[1]], [c[0] + Math.cos(a1)*r, 0.35, c[1] + Math.sin(a1)*r], [c[0] + Math.cos(a0)*r, 0.35, c[1] + Math.sin(a0)*r]); } }
  }
  // ---- round pavilion in the east courtyard (OSM w163201812, h 6.8)
  { const c = [46.6, 37.4], r = 4.1, n = 16, gl = B.p(GLW), cn = B.p(CAN);
    for (let i = 0; i < n; i++){ const a0 = i/n*TAU, a1 = (i+1)/n*TAU;
      quadP(gl, [c[0] + Math.cos(a0)*r, 0.4, c[1] + Math.sin(a0)*r], [c[0] + Math.cos(a1)*r, 0.4, c[1] + Math.sin(a1)*r], [c[0] + Math.cos(a1)*r, 6.0, c[1] + Math.sin(a1)*r], [c[0] + Math.cos(a0)*r, 6.0, c[1] + Math.sin(a0)*r]);
      triP(cn, [c[0], 6.8, c[1]], [c[0] + Math.cos(a1)*(r + 1.2), 6.0, c[1] + Math.sin(a1)*(r + 1.2)], [c[0] + Math.cos(a0)*(r + 1.2), 6.0, c[1] + Math.sin(a0)*(r + 1.2)]); } }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'sgcapella', lat:1.249698, lon:103.824432, rot:0});
}

// ======================================================================================================
// Singapore Oceanarium (Resorts World Sentosa; opened 2012 as S.E.A. Aquarium, reopened expanded 24 Jul 2025 — wikipedia).
// The hall is the former Maritime Experiential Museum building (Michael Graves with DP Architects, 2011–13: a waterfront form
// "reminiscent of the hull of a ship", its ribbed frame casting dappled light, glassy facades glowing at night — michaelgraves.com,
// e-architect); benoy.com: the 2025 "The Waves" canopy integrates with "the ribbed arches of the Oceanarium's main hall".
// Plan = OSM w171984328 (wikipedia's coordinates fall in it). Modelled: the hull-shaped glazed vault on a solid plinth with
// transverse ribbed arches every 4.5 m, glazed gable ends. Vault crown 21 m: an ESTIMATE (no height published). The Waves canopy
// is left out (its position is not in the data). Night: the glazed vault glows (lit interior), ribs floodlit.
// ======================================================================================================
{
const LAT = 1.258448, LON = 103.820347, RR = 82;
const HALL = [[51.8,23.4],[57.8,54.4],[23.6,69.8],[2.6,43.7],[-14.7,8.1],[-20.6,-28.2],[15.9,-43.6],[35.1,-17.5]];
LANDMARKS.sgoceanarium = {zh:'新加坡海洋馆（原S.E.A.海洋馆）', en:'Singapore Oceanarium (former S.E.A. Aquarium)', cat:'new', r:RR, h:22, lt:{m:0, c:'#e8f2ff', k:0.7, e:0.7}, build(){
  const g = new THREE.Group(), B = mkB();
  const GLS = {c:'#79a3b4', glow:'#9fd6ff', gk:0.42, ds:true}, RIB = {c:'#ecebe6', m:0, lk:0.9}, PL = {c:'#c8bba4', m:0, lk:0.35}, BASE = {c:'#a69f90', m:0, lk:0.1};
  const MUL = {c:'#9aa3a6', m:0, lk:0.2}, DK = '#8f8b84';
  const N0 = [(-20.6 + 15.9)/2, (-28.2 - 43.6)/2], S0 = [(57.8 + 23.6)/2, (54.4 + 69.8)/2];
  const L = Math.hypot(S0[0] - N0[0], S0[1] - N0[1]), d = [(S0[0] - N0[0])/L, (S0[1] - N0[1])/L], n = [-d[1], d[0]], C = [(N0[0] + S0[0])/2, (N0[1] + S0[1])/2];
  // width of the plan across the axis at u (intersection of the cross line with the polygon)
  const span = u => { let lo = 1e9, hi = -1e9; const px = C[0] + d[0]*u, pz = C[1] + d[1]*u;
    for (let i = 0; i < HALL.length; i++){ const a = HALL[i], b = HALL[(i+1) % HALL.length];
      const ax = a[0] - px, az = a[1] - pz, bx = b[0] - px, bz = b[1] - pz, ua = ax*d[0] + az*d[1], ub = bx*d[0] + bz*d[1];
      if ((ua <= 0 && ub >= 0) || (ua >= 0 && ub <= 0)){ const t = Math.abs(ub - ua) < 1e-6 ? 0 : ua/(ua - ub), v = (ax + (bx - ax)*t)*n[0] + (az + (bz - az)*t)*n[1]; lo = Math.min(lo, v); hi = Math.max(hi, v); } }
    return [lo, hi]; };
  const U0 = -L/2 + 0.3, U1 = L/2 - 0.3, YP = 3.2, HC = 21;
  const P = (u, s) => { const [lo, hi] = span(u), v = lerp(lo, hi, (s + 1)/2), w = (hi - lo)/2, e = Math.abs(s);
    const y = YP + (HC - YP)*Math.pow(Math.max(0, 1 - Math.pow(e, 2.4)), 0.55)*(0.82 + 0.18*Math.min(1, w/26));
    return [C[0] + d[0]*u + n[0]*v, y, C[1] + d[1]*u + n[1]*v]; };
  // plinth (the solid base course round the hall) and the floor
  wallP(B.p(BASE), HALL, -5, 0.6); wallP(B.p(PL), HALL, 0.6, YP); flatPoly(B.p(DK), HALL, YP);
  edgeBands(B.p(RIB), HALL, YP - 0.3, YP + 0.2, 0.1);
  // the glazed vault
  { const NU = 40, NV = 24; smoothGrid(g, NU, NV, (i, j) => P(lerp(U0, U1, i/NU), lerp(-1, 1, j/NV)), null, GLS);
    // glazing bars along the vault
    const mu = B.p(MUL); for (let j = 1; j < NV; j += 2){ const pts = []; for (let i = 0; i <= NU; i++) pts.push(P(lerp(U0, U1, i/NU), lerp(-1, 1, j/NV))); polyP(mu, pts, 0.07, 3); } }
  // transverse ribbed arches every 4.5 m, standing proud of the glass
  { const rb = B.p(RIB), nr = Math.round((U1 - U0)/4.5);
    for (let k = 0; k <= nr; k++){ const u = lerp(U0, U1, k/nr), pts = [];
      for (let j = 0; j <= 20; j++){ const p = P(u, lerp(-1, 1, j/20)); const up = j === 0 || j === 20 ? 0 : 0.55; pts.push([p[0], p[1] + up, p[2]]); }
      polyP(rb, pts, 0.32, 4);
      for (const s of [-1, 1]){ const p = P(u, s); segP(rb, [p[0], 0.6, p[2]], [p[0], YP + 0.4, p[2]], 0.45, 4); } } }
  // glazed gable ends with mullions
  { const gl = B.p(GLS), mu = B.p(MUL);
    for (const u of [U0, U1]){ const top = []; for (let j = 0; j <= 20; j++) top.push(P(u, lerp(-1, 1, j/20)));
      const c0 = [C[0] + d[0]*u, YP, C[1] + d[1]*u];
      for (let j = 0; j < 20; j++){ const a = top[j], b = top[j+1]; quadP(gl, [a[0], YP, a[2]], [b[0], YP, b[2]], b, a); }
      for (let j = 2; j < 20; j += 2){ const a = top[j]; segP(mu, [a[0], YP, a[2]], a, 0.12, 4); } } }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'sgoceanarium', lat:1.258448, lon:103.820347, rot:0});
}

// ======================================================================================================
// Palawan Beach: the rope suspension bridge to the islet and its two lookout towers (wikipedia Pulau Palawan: a simple
// suspension bridge links the islet, which has two lookout towers; atlasobscura: two large wooden towers joined by a walkway,
// viewing decks over the Singapore Strait). Bridge = the OSM footway line (89 m) from the beach to the islet; towers = the OSM
// footprint w163201852 (two ~10.7 m squares joined by a narrow link). Timber posts and planked deck hung from sagging main
// ropes with hangers and rope side-nets; the towers as two-level timber frames with viewing decks, the link walkway at the
// upper deck and pyramid roofs — tower deck heights (3.6 / 7.2 m) and roof apex (11.5 m) are ESTIMATES (none published).
// ======================================================================================================
{
const LAT = 1.248374, LON = 103.821745, RR = 80;
const BA = [32.2, -31.0], BI = [-32.2, 31.0];
const SQ = [[[-50.8,44.0],[-59.1,37.5],[-52.5,29.2],[-44.2,36.3]], [[-36.4,38.7],[-28.1,45.8],[-34.6,54.1],[-43.0,47.0]]];
LANDMARKS.sgpalawanbr = {zh:'巴拉湾吊桥与瞭望塔', en:'Palawan Beach suspension bridge & lookout towers', cat:'new', r:RR, h:12, lt:{m:0, c:'#ffd9a0', k:0.5, e:0.8}, build(){
  const g = new THREE.Group(), B = mkB(), r = LMCTX.rng;
  const TIM = {c:'#8b6b49', m:0, lk:0.3}, TIM2 = {c:'#6f553b', m:0, lk:0.2}, ROPE = {c:'#c2ad86', m:0, lk:0.2}, NET = {c:'#b7a27c', op:0.55, ds:true};
  const ROOF = {c:'#5e4b3a', m:0, lk:0.1}, SAND = {c:'#d8cba8', m:0, lk:0}, LAMP = {c:'#ffe2b0', glow:'#ffcf80', gk:1.2};
  // ---- the bridge
  const L = Math.hypot(BI[0] - BA[0], BI[1] - BA[1]), d = [(BI[0] - BA[0])/L, (BI[1] - BA[1])/L], n = [-d[1], d[0]];
  const S0 = 2.5, S1 = L - 2.5, YE = 1.7, SAG = 0.7, W = 0.85;
  const at = (s, w, y) => [BA[0] + d[0]*s + n[0]*w, y, BA[1] + d[1]*s + n[1]*w];
  const deckY = s => YE - SAG*(1 - Math.pow((2*(s - S0)/(S1 - S0) - 1), 2));
  { const tm = B.p(TIM), t2 = B.p(TIM2), rp = B.p(ROPE), nt = B.p(NET);
    // planks and the two stringers
    for (let s = S0; s < S1 - 0.2; s += 0.55){ const y = deckY(s + 0.2); boxP(tm, 0.42, 0.08, 2*W + 0.2, ...[at(s + 0.2, 0, 0)[0]], y - 0.08, at(s + 0.2, 0, 0)[2], Math.atan2(-d[1], d[0])); }
    for (const w of [-W, W]){ const pts = []; for (let s = S0; s <= S1 + 0.01; s += 2) pts.push(at(s, w, deckY(s) - 0.12)); polyP(t2, pts, 0.1, 4); }
    // posts (a pair at each end), main ropes, hand ropes, hangers, side nets
    const PH = 4.2;
    for (const s of [S0 - 0.6, S1 + 0.6]) for (const w of [-W - 0.25, W + 0.25]){ const p = at(s, w, 0); segP(tm, [p[0], -1.5, p[2]], [p[0], YE + PH, p[2]], 0.2, 6); }
    for (const s of [S0 - 0.6, S1 + 0.6]) segP(t2, at(s, -W - 0.25, YE + PH - 0.3), at(s, W + 0.25, YE + PH - 0.3), 0.12, 4);
    for (const w of [-W - 0.15, W + 0.15]){
      const main = [], hand = [];
      for (let k = 0; k <= 40; k++){ const s = lerp(S0 - 0.6, S1 + 0.6, k/40), t = 2*k/40 - 1; main.push(at(s, w, YE + PH - 0.2 - (PH - 1.45)*(1 - t*t))); hand.push(at(s, w, deckY(Math.min(S1, Math.max(S0, s))) + 1.05)); }
      polyP(rp, main, 0.05, 3); polyP(rp, hand, 0.04, 3);
      for (let k = 1; k < 40; k++){ const a = main[k], s = lerp(S0 - 0.6, S1 + 0.6, k/40); if (s < S0 || s > S1) continue; segP(rp, [a[0], deckY(s), a[2]], a, 0.02, 3); }
      for (let k = 0; k < 40; k++){ const s0 = lerp(S0 - 0.6, S1 + 0.6, k/40), s1 = lerp(S0 - 0.6, S1 + 0.6, (k+1)/40); if (s0 < S0 || s1 > S1) continue;
        quadP(nt, at(s0, w, deckY(s0)), at(s1, w, deckY(s1)), hand[k+1], hand[k]); } }
    // landing platforms and the ground anchors
    for (const [s, dir] of [[S0, -1], [S1, 1]]){ const c = at(s + dir*1.4, 0, 0); boxP(tm, 2.6, YE + 1.5, 2.6, c[0], -1.5, c[2], Math.atan2(-d[1], d[0])); }
    // two lanterns at the bridge heads
    for (const s of [S0 - 0.6, S1 + 0.6]) for (const w of [-W - 0.25, W + 0.25]){ const p = at(s, w, YE + PH); boxP(B.p(LAMP), 0.3, 0.4, 0.3, p[0], p[1], p[2], 0); }
  }
  // ---- the islet pad under the towers and the two lookout towers with the link walkway
  { const all = [...SQ[0], ...SQ[1]], c = cen(all);
    const pad = []; for (let i = 0; i < 20; i++){ const a = i/20*TAU; let R = 0; for (const p of all) R = Math.max(R, (p[0] - c[0])*Math.cos(a) + (p[1] - c[1])*Math.sin(a)); pad.push([c[0] + Math.cos(a)*(R + 4), c[1] + Math.sin(a)*(R + 4)]); }
    wallP(B.p(SAND), pad, -1.5, 0.15); flatPoly(B.p(SAND), pad, 0.15);
    const YD = [0.5, 3.6, 7.2], YR = 9.9, YA = 11.5;
    for (const Q of SQ){
      const qc = cen(Q), ax0 = [Q[1][0] - Q[0][0], Q[1][1] - Q[0][1]], ql = Math.hypot(ax0[0], ax0[1]), ax = [ax0[0]/ql, ax0[1]/ql], ry = Math.atan2(-ax[1], ax[0]);
      const hs = 5.1, inner = rectR(qc, ax, hs, hs);
      // posts: corners and mid-sides
      for (let i = 0; i < 4; i++){ const a = inner[i], b = inner[(i+1) % 4];
        for (const t of [0, 0.5]){ const p = [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]; boxP(B.p(TIM), 0.35, YR, 0.35, p[0], 0, p[1], ry); } }
      // decks with railings, cross bracing
      for (const y of YD){ const o = B.p(TIM2); boxP(o, 2*hs, 0.2, 2*hs, qc[0], y - 0.2, qc[1], ry);
        if (y > 1){ edgeBands(B.p(TIM), inner, y + 0.95, y + 1.1, 0.02); edgeFins(B.p(TIM), inner, y, y + 1.0, 1.0, 0.07, 0.07); } }
      for (let i = 0; i < 4; i++){ const a = inner[i], b = inner[(i+1) % 4]; segP(B.p(TIM2), [a[0], 0.6, a[1]], [b[0], YD[1] - 0.2, b[1]], 0.08, 4); segP(B.p(TIM2), [b[0], 0.6, b[1]], [a[0], YD[1] - 0.2, a[1]], 0.08, 4); }
      // stair flights along one side
      { const s0 = [qc[0] + ax[0]*-3.8 + -ax[1]*3.4, qc[1] + ax[1]*-3.8 + ax[0]*3.4];
        for (let k = 0; k < 14; k++){ const t = k/14; boxP(B.p(TIM2), 0.3, 0.12, 1.1, s0[0] + ax[0]*t*6.5, YD[0] + t*(YD[1] - YD[0]), s0[1] + ax[1]*t*6.5, ry); }
        for (let k = 0; k < 14; k++){ const t = k/14; boxP(B.p(TIM2), 0.3, 0.12, 1.1, s0[0] + ax[0]*(6.5 - t*6.5), YD[1] + t*(YD[2] - YD[1]), s0[1] + ax[1]*(6.5 - t*6.5) - 0*ax[0], ry); } }
      // pyramid roof
      { const o = B.p(ROOF), R = rectR(qc, ax, hs + 0.9, hs + 0.9), apex = [qc[0], YA, qc[1]];
        for (let i = 0; i < 4; i++){ const a = R[i], b = R[(i+1) % 4]; triP(o, [a[0], YR, a[1]], [b[0], YR, b[1]], apex); } }
      boxP(B.p(LAMP), 0.3, 0.3, 0.3, qc[0], YR - 0.6, qc[1], 0);
    }
    // the link walkway between the towers at the upper deck
    { const a = cen(SQ[0]), b = cen(SQ[1]); barP(B.p(TIM2), a, b, 2.2, 0.25, YD[2] - 0.25);
      for (const s of [-1, 1]){ const dd = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(dd[0], dd[1]), nn = [-dd[1]/l*1.1*s, dd[0]/l*1.1*s];
        segP(B.p(TIM), [a[0] + nn[0], YD[2] + 1.05, a[1] + nn[1]], [b[0] + nn[0], YD[2] + 1.05, b[1] + nn[1]], 0.06, 4); } }
  }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'sgpalawanbr', lat:1.248374, lon:103.821745, rot:0});
}
