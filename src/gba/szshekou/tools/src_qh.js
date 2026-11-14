
// ================= Shimao Qianhai Centre (世茂前海中心) =================
// Gensler, completed 2020; 294.3 m to the tip, 63 floors (CTBUH Skyscraper Center). Form (archiposition / Gensler): a square plan
// split in two halves with a recessed joint, tapering while it rotates 45 degrees as it rises; the two volumes separate at the
// crown and show the axis between them; cool, highly reflective glass against warm copper-coloured metal. Plan: OSM w773895107.
// The taper ratio (top side 0.72 of the base) and the crown split heights are estimates.
const SMS = {glass:{c:'#6e8593', m:1, lc:'#dfe9ff', lk:0.55, fh:4.4, cw:3.0}, cop:{c:'#a8734a', m:0, lc:'#ffc890', lk:0.9, e:0.8}, slot:{c:'#8a5e3c', glow:'#ffb870', gk:0.9},
  roof:'#8f9aa1', mull:'#a9b3b8', base:{c:'#59666f', glow:'#ffdcaa', gk:0.45}, red:{c:'#b01810', glow:'#ff2a14', gk:2.2}, stone:'#c9c4ba'};
LANDMARKS.szqhshimao = {zh:'世茂前海中心', en:'Shimao Qianhai Centre', cat:'new', r:42, h:294.3,
  lt:{m:1, c:'#dfe9ff', k:0.55, anim:'cycle', c2:'#ffcf9a'},
  build(){
    const T = D.szqhshimao, g = new THREE.Group(), B = Batch(), bs = baseOf(T, 38), gl = bs.gl;
    const O = orect(T.out), H = 294.3, th0 = Math.atan2(O.uz, O.ux), Lh = O.L/2 - 0.6, Wh = O.W/2 - 0.6, gap = 2.4;
    let lo = 0; for (const p of T.out) lo = Math.min(lo, gl(p[0], p[1]));
    const NL = 30, crown0 = 268;
    // section of one half at height y: four corners (u, v) rotated and scaled; side = +1 / -1
    const sec = (y, side) => { const t = clamp(y/H, 0, 1), th = th0 + (PI/4)*t, k = 1 - 0.28*t, c = Math.cos(th), s = Math.sin(th);
      // the crown: the halves lean apart above crown0
      const sp = Math.max(0, y - crown0)/(H - crown0)*2.5*side;
      const Q = [[-Lh, gap/2], [Lh, gap/2], [Lh, Wh], [-Lh, Wh]].map(([u, v]) => { const vv = (v*k)*side + sp, uu = u*k; return [O.cx + uu*c - vv*s, O.cz + uu*s + vv*c]; });
      return Q; };
    for (const side of [1, -1]){
      const top = side > 0 ? H : H - 7.5;
      const lev = []; for (let i = 0; i <= NL; i++) lev.push(Math.min(top, i*top/NL));
      for (let i = 0; i < NL; i++){ const y0 = i === 0 ? lo - 0.5 : lev[i], y1 = lev[i + 1], A = sec(lev[i], side), C = sec(y1, side);
        for (let k = 0; k < 4; k++){ const j = (k + 1) & 3, sp = k === 0 ? SMS.cop : SMS.glass;
          B.q(sp, [A[k][0], y0, A[k][1]], [A[j][0], y0, A[j][1]], [C[j][0], y1, C[j][1]], [C[k][0], y1, C[k][1]]); } }
      // sloped top: high at the outer face, low at the joint
      const Tq = sec(top, side), yIn = top - 9;
      B.q(SMS.roof, [Tq[0][0], yIn, Tq[0][1]], [Tq[1][0], yIn, Tq[1][1]], [Tq[2][0], top, Tq[2][1]], [Tq[3][0], top, Tq[3][1]]);
      B.q(SMS.cop, [Tq[0][0], top - 0.5, Tq[0][1]], [Tq[1][0], top - 0.5, Tq[1][1]], [Tq[1][0], yIn, Tq[1][1]], [Tq[0][0], yIn, Tq[0][1]]);
      for (const k of [2, 3]) lampBox(B, SMS.red, Tq[k][0] - 0.4, top - 0.8, Tq[k][1] - 0.4, 0.8);
      // vertical mullion lines on the glass faces (every ~1/8 of a face), proud of the glass
      for (let i = 0; i < NL; i++){ const A = sec(lev[i], side), C = sec(lev[i + 1], side);
        for (const k of [1, 2, 3]){ const j = (k + 1) & 3; for (let f = 1; f < 8; f++){ const t = f/8, p = [lerp(A[k][0], A[j][0], t), lerp(A[k][1], A[j][1], t)], q = [lerp(C[k][0], C[j][0], t), lerp(C[k][1], C[j][1], t)];
          beam(B, SMS.mull, [p[0], lev[i], p[1]], [q[0], lev[i + 1], q[1]], 0.13); } } }
      // vertical copper fins at the corners of the outer face
      for (let i = 0; i < NL; i++){ const A = sec(lev[i], side), C = sec(lev[i + 1], side); for (const k of [2, 3]) beam(B, SMS.cop, [A[k][0], lev[i], A[k][1]], [C[k][0], lev[i + 1], C[k][1]], 0.45); }
    }
    // the joint: a recessed copper spine, lit at night, up to the crown
    for (let i = 0; i < NL; i++){ const y0 = i*H/NL, y1 = Math.min(H - 6, (i + 1)*H/NL); if (y1 <= y0) break; const a = sec(y0, 1), c = sec(y1, 1), a2 = sec(y0, -1), c2 = sec(y1, -1);
      const m = (P, Q, k) => [(P[k][0] + Q[k][0])/2, (P[k][1] + Q[k][1])/2];
      B.q(SMS.slot, [m(a, a2, 0)[0], y0, m(a, a2, 0)[1]], [m(a, a2, 1)[0], y0, m(a, a2, 1)[1]], [m(c, c2, 1)[0], y1, m(c, c2, 1)[1]], [m(c, c2, 0)[0], y1, m(c, c2, 0)[1]]); }
    // lobby: a glazed base and a stone apron round the footprint
    prism(B, SMS.base, grow(T.out, 0.3), lo - 0.5, 9, {top:SMS.roof});
    B.flush(g); return g; }};
SG_PLACES.push({type:'szqhshimao', lat:D.szqhshimao.lat, lon:D.szqhshimao.lon, rot:0});

// ================= Qianhai International Conference Center (前海国际会议中心) =================
// Designed by Meng Jianmin; 40 000 m2; a tiered, curved roof of coloured glass in several transmittances that recalls the glazed
// tile roof of a Lingnan building (8 407 m2 / 10 000 m2 in two reports), with colonnades, low walls and waterscapes; main hall on the
// first floor, a multi-function hall on the second (Qianhai Authority news, 2020-21). Plan: OSM w858787224. Heights (eaves 13.5 m,
// ridge 27 m) and the roof's colour are estimates.
const QCS = {roof:{c:'#8ea2a8', m:0, lc:'#ffe6c2', lk:0.45, e:0.7}, roofL:{c:'#a2b2b5', m:0, lc:'#ffe6c2', lk:0.4}, rib:'#d9dcd8', col:{c:'#e7e4dc', m:0, lc:'#fff0d8', lk:0.6},
  glass:{c:'#506470', glow:'#ffd9a6', gk:1.1}, stone:'#d6d1c6', water:{c:'#6f97a6'}, wall:'#cdc6b7', soff:'#bfc3c1', lamp:{c:'#fff4dc', glow:'#ffe0ac', gk:1.5}};
LANDMARKS.szqhconf = {zh:'前海国际会议中心', en:'Qianhai International Conference Center', cat:'new', r:96, h:27,
  lt:{m:0, c:'#ffe6c2', k:0.8, e:0.7},
  build(){
    const T = D.szqhconf, g = new THREE.Group(), B = Batch(), bs = baseOf(T, 96), gl = bs.gl;
    const R = T.out; let lo = 0; for (const p of R) lo = Math.min(lo, gl(p[0], p[1]));
    const O = orect(R), y0 = 1.2;
    // stone podium on the footprint
    prism(B, QCS.stone, R, lo - 0.6, y0, {top:QCS.stone});
    // the hall: glass walls set back inside the colonnade
    const C = {cx:O.cx, cz:O.cz, ux:O.ux, uz:O.uz, L:O.L - 26, W:O.W - 26};
    obox(B, QCS.glass, C.cx, C.cz, C.ux, C.uz, C.L, C.W, y0, 13.0, {top:QCS.soff});
    obox(B, QCS.wall, C.cx, C.cz, C.ux, C.uz, C.L + 0.4, C.W + 0.4, 6.4, 7.1);
    // colonnade: slender columns along the eaves line
    const E = {L:O.L - 6, W:O.W - 6};
    for (const [len, wid, along] of [[E.L, E.W, true], [E.W, E.L, false]]) {
      const n = Math.round(len/7.5);
      for (let k = 0; k <= n; k++) for (const sg of [-1, 1]){ const a = -len/2 + len*k/n, b = sg*wid/2; const [u, v] = along ? [a, b] : [b, a];
        const x = O.cx + O.ux*u - O.uz*v, z = O.cz + O.uz*u + O.ux*v; LCyl(g, 0.45, 0.45, 12.6, x, y0, z, QCS.col, 8); } }
    // the tiered roof: a wide lower eave over the colonnade, an upper hip-and-gable roof, glass ribs like tile rows
    skirt(B, QCS.roofL, O, O.L + 2, O.W + 2, 13.0, O.L - 30, O.W - 30, 17.5);
    cap(B, QCS.soff, [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [O.cx + O.ux*a*(O.L/2 + 1) - O.uz*b*(O.W/2 + 1), O.cz + O.uz*a*(O.L/2 + 1) + O.ux*b*(O.W/2 + 1)]), 12.95, true);
    obox(B, QCS.wall, O.cx, O.cz, O.ux, O.uz, O.L - 30, O.W - 30, 17.0, 19.0);
    hipRoof2(B, QCS.roof, O.cx, O.cz, O.ux, O.uz, O.L - 22, O.W - 22, 18.6, 27 - 18.6, 1.4, 0.55);
    ridge(B, {ridge:QCS.rib}, O, O.L - 22, O.W - 22, 27, 0.55);
    // tile-row ribs on the upper roof (lines down the slopes, front and back)
    { const L = O.L - 22, W = O.W - 22, hl = L/2, hw = W/2, rl = hl - hw*0.55, y = 18.6, h = 27 - 18.6;
      for (let a = -hl + 3; a < hl - 2; a += 4.5) for (const sg of [-1, 1]){ const ar = clamp(a, -rl, rl), P = (u, v, yy) => [O.cx + O.ux*u - O.uz*v, yy, O.cz + O.uz*u + O.ux*v];
        beam(B, QCS.rib, P(a, sg*hw, y + 0.15), P(ar, 0, y + h + 0.1), 0.12); } }
    // waterscapes: reflecting pools along the two long sides (inside the plan)
    for (const sg of [-1, 1]){ const v = sg*(O.W/2 - 6), x = O.cx - O.uz*v, z = O.cz + O.ux*v; obox(B, QCS.water, x, z, O.ux, O.uz, O.L*0.6, 6, y0, y0 + 0.08); }
    // lamps along the podium edge
    const G = grow(R, -1.2); for (let i = 0; i < G.length; i++){ const a = G[i], b = G[(i + 1) % G.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); for (let d = 4; d < l; d += 14) lampBox(B, QCS.lamp, a[0] + (b[0] - a[0])*d/l, y0, a[1] + (b[1] - a[1])*d/l, 0.4); }
    B.flush(g); return g; }};
SG_PLACES.push({type:'szqhconf', lat:D.szqhconf.lat, lon:D.szqhconf.lon, rot:0});
