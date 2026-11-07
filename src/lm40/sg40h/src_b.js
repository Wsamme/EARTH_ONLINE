// ================================================================ Benjamin Sheares Bridge (4 keys along the ECP viaduct)
// The app draws the real ECP deck (both carriageways, parapets) at its data height (7.2 m above the ground); this model adds what
// is under and on it: the tapered H trestles (23 spans over the line), the box girders under each carriageway, median lamps.
const SH = (() => {
  const A = D.sh.a, B = D.sh.b, LA = plen(A), E = D.sh.e, SPAN = LA/23;
  const anc = [1.293701, 103.863695];
  const pieces = [['sgsheares', 590, 1100], ['sgsheares2', 0, 415], ['sgsheares3', 415, 590], ['sgsheares4', 1100, LA]];
  const sOn = (P, x, z) => { let best = [1e9, 0], acc = 0; for (let i = 1; i < P.length; i++){ const a = P[i-1], b = P[i], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), L2 = l*l || 1; let u = ((x - a[0])*dx + (z - a[1])*dz)/L2; u = Math.max(0, Math.min(1, u)); const d = Math.hypot(x - a[0] - dx*u, z - a[1] - dz*u); if (d < best[0]) best = [d, acc + l*u]; acc += l; } return best[1]; };
  const out = {};
  for (const [key, s0, s1] of pieces){
    const m = pAt(A, (s0 + s1)/2), o = [m[0], m[1]];
    out[key] = {o, ll:LL40(anc[0], anc[1], o[0], o[1]), s0, s1};
  }
  function build(key){
    const P = out[key], o = P.o, g = new THREE.Group(), T = mkT();
    const DY = P.dy || 0, top = E - 2.3 + DY, gb = top - 2.1;       // slab bottom of the app deck, girder soffit
    const L = (p) => [p[0] - o[0], p[1] - o[1]];
    // box girders under each carriageway, sampled every 8 m
    for (const [Ln, sa, sb] of [[A, P.s0, P.s1], [B, Math.min(sOn(B, ...pAt(A, P.s0)), sOn(B, ...pAt(A, P.s1))), Math.max(sOn(B, ...pAt(A, P.s0)), sOn(B, ...pAt(A, P.s1)))]]){
      const n = Math.max(2, Math.ceil((sb - sa)/8));
      let prev = null;
      for (let i = 0; i <= n; i++){
        const q = pAt(Ln, sa + (sb - sa)*i/n), c = L(q), vx = -q[3], vz = q[2];
        const sec = [[c[0] + vx*6.2, top, c[1] + vz*6.2], [c[0] + vx*3.4, gb, c[1] + vz*3.4], [c[0] - vx*3.4, gb, c[1] - vz*3.4], [c[0] - vx*6.2, top, c[1] - vz*6.2]];
        if (prev){ for (let k = 0; k < 3; k++) T.q(k === 1 ? 'soff' : 'gird', prev[k], sec[k], sec[k+1], prev[k+1]); }
        prev = sec;
      }
    }
    // tapered H trestles: one leg under each carriageway, a cross-head under the girders and a mid-height tie
    for (let k = 1; k < 23; k++){
      const s = k*SPAN; if (s < P.s0 || s >= P.s1) continue;
      const qa = pAt(A, s), nb = nearOn(B, qa[0], qa[1]), pa = L(qa), pb = L([nb[1], nb[2]]);
      const ux = qa[2], uz = qa[3];
      for (const p of [pa, pb]){
        const legs = [[p[0], -7, p[1], 1.0, 1.4], [p[0], gb - 0.9, p[1], 1.5, 2.4]];
        const vx = -uz, vz = ux, cnr = (c, a, b) => [[c[0] + ux*a + vx*b, c[1], c[2] + uz*a + vz*b], [c[0] - ux*a + vx*b, c[1], c[2] - uz*a + vz*b], [c[0] - ux*a - vx*b, c[1], c[2] - uz*a - vz*b], [c[0] + ux*a - vx*b, c[1], c[2] + uz*a - vz*b]];
        const lo = cnr(legs[0], legs[0][3], legs[0][4]), hi = cnr(legs[1], legs[1][3], legs[1][4]);
        for (let j = 0; j < 4; j++) T.q('pier', lo[j], lo[(j + 1) % 4], hi[(j + 1) % 4], hi[j]);
        T.ob('pier', p[0], p[1], ux, uz, 1.9, 3.6, gb - 0.9, gb, false, true);      // bearing head
      }
      const mid = [(pa[0] + pb[0])/2, (pa[1] + pb[1])/2], dx = pb[0] - pa[0], dz = pb[1] - pa[1], l = Math.hypot(dx, dz) || 1;
      T.ob('pier', mid[0], mid[1], dx/l, dz/l, l/2, 0.9, gb - 2.0, gb - 0.9, false, true);     // cross-head
      T.ob('pier', mid[0], mid[1], dx/l, dz/l, l/2 - 1, 0.6, (gb - 7)/2 - 0.6, (gb - 7)/2 + 0.6, false, true);   // H tie
    }
    // median lamp posts every 45 m (double outreach arms), between the two carriageways
    for (let s = Math.ceil(P.s0/45)*45 + 20; s < P.s1; s += 45){
      const qa = pAt(A, s), nb = nearOn(B, qa[0], qa[1]), c = L([(qa[0] + nb[1])/2, (qa[1] + nb[2])/2]), dx = nb[1] - qa[0], dz = nb[2] - qa[1], l = Math.hypot(dx, dz) || 1;
      const y0 = E + DY - 0.2, y1 = y0 + 11;
      T.cyl('pole', c[0], c[1], y0, y1, 0.18, 0.12, 6);
      for (const sg of [-1, 1]){ const ex = c[0] + dx/l*sg*2.6, ez = c[1] + dz/l*sg*2.6; T.beam('pole', [c[0], y1 - 0.2, c[1]], [ex, y1 + 0.3, ez], 0.07); T.ob('lamp', ex, ez, dx/l, dz/l, 0.45, 0.2, y1 + 0.05, y1 + 0.3); }
    }
    if (key === 'sgsheares') keepers(T, key, o);
    T.flush(g, {kp:'#cfcac0', kr:'#9a9890', gird:'#c3bfb5', soff:'#9d9a92', pier:'#b9b4a9', pole:'#8e959b', lamp:{c:'#eeeeea', glow:'#ffd9a0', gk:1.8}});
    return g;
  }
  return {out, build};
})();
for (const k of Object.keys(SH.out)){
  const P = SH.out[k];
  LANDMARKS[k] = Object.assign({zh:'本杰明·薛尔斯大桥', en:'Benjamin Sheares Bridge', cat:'new', r:Math.round((P.s1 - P.s0)/2 + 40), h:29,
    lt:{m:0, c:'#fff0d8', k:0.22, e:0.5}, build(){ return SH.build(k); }}, k === 'sgsheares' ? {} : {label:false});
  SG_PLACES.push({type:k, lat:P.ll[0], lon:P.ll[1], rot:0});
}

// ================================================================ Koon Seng Road terrace houses (both rows, Joo Chiat Rd to Tembeling Rd)
function koonRow(row, rowN){
  return function(){
    const g = new THREE.Group(), T = mkT(), PAL = ['pk', 'mi', 'sk', 'ye', 'pe', 'li'];
    row.u.forEach((u, idx0) => { const idx = idx0 + rowN*7;
      const p0 = u[0], p1 = u[1], p2 = u[2], p3 = u[3], ring = [p0, p1, p2, p3];
      const fm = lerp2(p0, p1, 0.5), bm = lerp2(p2, p3, 0.5), w = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), dd = Math.hypot(bm[0] - fm[0], bm[1] - fm[1]);
      const ex = (p1[0] - p0[0])/w, ez = (p1[1] - p0[1])/w, nx = (bm[0] - fm[0])/dd, nz = (bm[1] - fm[1])/dd;     // along the front / into the house
      const P = (s, t) => [fm[0] + ex*s + nx*t, fm[1] + ez*s + nz*t];
      const V = (s, y, t) => { const p = P(s, t); return [p[0], y, p[1]]; };
      const fq = (c, s0, s1, y0, y1, t) => { T.q(c, V(s0, y0, t), V(s1, y0, t), V(s1, y1, t), V(s0, y1, t)); };
      const fbox = (c, s, t, hs, ht, y0, y1) => { const p = P(s, t); T.ob(c, p[0], p[1], ex, ez, hs, ht, y0, y1); };
      const col = PAL[(idx*5 + (u[4].charCodeAt(u[4].length - 1))) % PAL.length], setA = rowN === 0, hw = w/2;
      // body (party walls hidden), ground floor 4.3, upper floor to 7.9, parapet 8.7
      T.prism('wh', ring, -1.5, 7.9, 'rf');
      fq(col, -hw + 0.05, hw - 0.05, 0, 8.7, -0.06);
      // pilasters, floor cornice, top cornice, parapet coping
      for (const s of [-hw + 0.28, hw - 0.28]) fbox('wh', s, -0.2, 0.26, 0.2, 0, 8.9);
      fbox('wh', 0, -0.25, hw, 0.22, 4.2, 4.6); fbox('wh', 0, -0.3, hw, 0.28, 7.5, 7.95); fbox('wh', 0, -0.15, hw, 0.18, 8.6, 8.9);
      // ground floor: door with pintu pagar half-doors, two windows with tile / stucco surrounds, bat-shaped vent
      fq('tb', -0.75, 0.75, 0, 3.0, -0.1); fq('tl', -0.7, 0.7, 0.45, 2.1, -0.16);
      fbox('wh', 0, -0.12, 0.95, 0.06, 3.0, 3.25);
      fq('dk', -0.35, 0.35, 3.45, 3.85, -0.1);
      for (const s of [-hw*0.62, hw*0.62]){
        if (setA) fq('ti', s - 0.75, s + 0.75, 0.6, 3.2, -0.09); else fq('wh', s - 0.7, s + 0.7, 2.95, 3.5, -0.11);
        fq('gl', s - 0.45, s + 0.45, 0.9, 2.8, -0.13); fbox('tb', s, -0.14, 0.5, 0.05, 0.82, 0.9);
      }
      // upper floor: three French windows with timber shutters and a slatted timber balustrade
      const ns = w >= 5.2 ? 3 : 2;
      for (let k = 0; k < ns; k++){
        const s = -hw + w*(k + 0.5)/ns;
        fq('gl', s - 0.42, s + 0.42, 4.9, 7.1, -0.1); fq('tb', s - 0.48, s + 0.48, 7.1, 7.3, -0.11);
        fq('tl', s - 0.85, s - 0.47, 4.9, 7.1, -0.14); fq('tl', s + 0.47, s + 0.85, 4.9, 7.1, -0.14);
        if (!setA) fq('wh', s - 0.5, s + 0.5, 7.25, 7.48, -0.16);
      }
      for (let s = -hw + 0.5; s <= hw - 0.5; s += 0.32) fbox('tb', s, -0.35, 0.05, 0.05, 4.6, 5.55);
      fbox('tb', 0, -0.35, hw - 0.4, 0.07, 5.5, 5.62);
      // parapet pediment (stucco set) or tile frieze (tile set)
      if (!setA){ T.tri('wh', V(-1.2, 8.9, -0.17), V(1.2, 8.9, -0.17), V(0, 9.75, -0.17)); fq('ti', -0.5, 0.5, 8.0, 8.5, -0.32); }
      else fq('ti', -hw + 0.6, hw - 0.6, 8.05, 8.5, -0.31);
      // pitched clay-tile roof over the front house (ridge parallel to the street), lower roof over the rear wing
      const rt = Math.min(12, dd*0.5), r1 = V(-hw, 8.4, 0.4), r2 = V(hw, 8.4, 0.4), k1 = V(-hw, 11.0, rt*0.5), k2 = V(hw, 11.0, rt*0.5), b1 = V(-hw, 7.9, rt), b2 = V(hw, 7.9, rt);
      T.q('rf', r1, r2, k2, k1); T.q('rf', k1, k2, b2, b1); T.tri('wh', r1, k1, b1); T.tri('wh', r2, k2, b2);
      T.q('rf', V(-hw, 7.6, rt), V(hw, 7.6, rt), V(hw, 6.8, dd), V(-hw, 6.8, dd));
      // forecourt: low front wall with gate posts (front garden)
      for (const [a, b] of [[-hw, -0.85], [0.85, hw]]) T.ob('wh', ...P((a + b)/2, -3.2), ex, ez, (b - a)/2, 0.12, 0, 1.1);
      for (const s of [-0.95, 0.95]) fbox('wh', s, -3.2, 0.16, 0.16, 0, 1.45);
      fbox('tl', 0, -3.2, 0.75, 0.04, 0.1, 1.15);
      T.q('fl', V(-hw, 0.03, -3.1), V(hw, 0.03, -3.1), V(hw, 0.03, 0), V(-hw, 0.03, 0));
    });
    T.flush(g, {wh:'#f1ede4', rf:'#a5523a', tb:'#5b3a25', tl:'#a8784c', dk:'#3b3530', ti:'#3f8a8c', fl:'#c9b8a0',
      gl:{c:'#2d3a44', glow:'#ffcf8a', gk:1.1},
      pk:'#f2b9c2', mi:'#b7dcc5', sk:'#b5d3ea', ye:'#f3dd96', pe:'#f5c49e', li:'#d1c0e3'});
    return g;
  };
}
[['sgkoonseng', 'n', 0], ['sgkoonseng2', 's', 1]].forEach(([k, side, n]) => {
  const row = D.koon[side], ll = LL40(1.31105, 103.90281, row.o[0], row.o[1]), rr = Math.ceil(Math.max(...row.u.map(u => Math.max(...u.slice(0, 4).map(p => Math.hypot(p[0], p[1]))))) + 6);
  LANDMARKS[k] = Object.assign({zh:'坤成路店屋', en:'Koon Seng Road terrace houses', cat:'old', r:rr, h:11, lt:{m:0, c:'#ffe3bd', k:0.45, e:0.8}, build:koonRow(row, n)}, n ? {label:false} : {});
  SG_PLACES.push({type:k, lat:ll[0], lon:ll[1], rot:0});
});

// ================================================================ Geylang Serai Market (2009): two storeys under a linear three-tiered hipped roof
LANDMARKS.sggeylangserai = {zh:'芽笼士乃巴刹', en:'Geylang Serai Market', cat:'new', r:98, h:20,
  lt:{m:0, c:'#ffe1b4', k:0.4, e:0.6},
  build(){
    const g = new THREE.Group(), T = mkT(), m = D.gsm.m, b = obb(m);
    const ux = b.ux, uz = b.uz, vx = -uz, vz = ux, P = (s, t, y) => [b.cx + ux*s + vx*t, y, b.cz + uz*s + vz*t];
    T.prism('pl', m, -3, 0.6);
    // ground floor: inset market hall, perimeter columns with screens above, open lower half
    const inn = offR(m, -2.2);
    T.prism('dk', inn, 0.6, 6.0, 'pl');
    for (let i = 0; i < m.length; i++){
      const a = m[i], c = m[(i + 1) % m.length], L = Math.hypot(c[0] - a[0], c[1] - a[1]); if (L < 3) continue;
      const n = Math.max(1, Math.round(L/6)), [nx, nz] = outN(m, i);
      for (let k = 0; k <= n; k++){ const p = lerp2(a, c, k/n); T.box('co', p[0] - nx*0.4, 0.6, p[1] - nz*0.4, 0.7, 10.6, 0.7); }
      // upper floor: decorative screens (batik / geometric motifs) between the columns, a slab edge at the food-centre level
      T.q('wa', [a[0], 6.0, a[1]], [c[0], 6.0, c[1]], [c[0], 6.7, c[1]], [a[0], 6.7, a[1]]);
      for (let k = 0; k < n; k++){
        const p = lerp2(a, c, k/n), q = lerp2(a, c, (k + 1)/n), e = 0.15;
        T.q('sc', [p[0] + nx*e, 7.0, p[1] + nz*e], [q[0] + nx*e, 7.0, q[1] + nz*e], [q[0] + nx*e, 10.6, q[1] + nz*e], [p[0] + nx*e, 10.6, p[1] + nz*e]);
        for (let j = 1; j < 4; j++){ const r = lerp2(p, q, j/4), e2 = 0.22;
          T.q('mo', [r[0] + nx*e2 - (q[0] - p[0])/16, 8.8, r[1] + nz*e2 - (q[1] - p[1])/16], [r[0] + nx*e2, 8.1, r[1] + nz*e2], [r[0] + nx*e2 + (q[0] - p[0])/16, 8.8, r[1] + nz*e2 + (q[1] - p[1])/16], [r[0] + nx*e2, 9.5, r[1] + nz*e2]); }
        T.q('wa', [p[0] + nx*0.05, 3.6, p[1] + nz*0.05], [q[0] + nx*0.05, 3.6, q[1] + nz*0.05], [q[0] + nx*0.05, 6.0, q[1] + nz*0.05], [p[0] + nx*0.05, 6.0, p[1] + nz*0.05]);
      }
    }
    T.walls('sc', inn, 6.7, 11.0); T.cap('dk', m, 11.0);
    // three tiers: wide eave skirt, clerestory grilles between tiers, top hipped roof with ventilation gablets
    const tier = (hl0, hw0, y0, hl1, hw1, y1) => {
      const o = [P(-hl0, -hw0, y0), P(hl0, -hw0, y0), P(hl0, hw0, y0), P(-hl0, hw0, y0)], i = [P(-hl1, -hw1, y1), P(hl1, -hw1, y1), P(hl1, hw1, y1), P(-hl1, hw1, y1)];
      for (let k = 0; k < 4; k++){ T.q('rf', o[k], o[(k + 1) % 4], i[(k + 1) % 4], i[k]); T.q('so', o[k], o[(k + 1) % 4], [o[(k + 1) % 4][0], y0 - 0.35, o[(k + 1) % 4][2]], [o[k][0], y0 - 0.35, o[k][2]]); }
    };
    const hl = b.L/2, hwd = b.W/2;
    tier(hl + 1.2, hwd + 0.8, 11.0, hl - 5, hwd - 6, 14.8);
    T.ob('gr', b.cx, b.cz, ux, uz, hl - 5.6, hwd - 6.6, 14.6, 15.9);
    tier(hl - 4.5, hwd - 6.0, 15.9, hl - 10, hwd - 12, 18.2);
    T.ob('gr', b.cx, b.cz, ux, uz, hl - 10.8, hwd - 12.8, 18.0, 18.8);
    { const H = hwd - 12, k = hl - 12 - H*0.5, r1 = P(-k, 0, 20.2), r2 = P(k, 0, 20.2), a = P(-(hl - 10.5), -H, 18.8), c = P(hl - 10.5, -H, 18.8), d = P(hl - 10.5, H, 18.8), e = P(-(hl - 10.5), H, 18.8);
      T.q('rf', a, c, r2, r1); T.q('rf', d, e, r1, r2); T.tri('rf', e, a, r1); T.tri('rf', c, d, r2);
      for (const sg of [-1, 1]){ const kk = sg*k; T.tri('gr', P(kk + sg*0.05, -1.8, 19.3), P(kk + sg*0.05, 1.8, 19.3), P(kk + sg*0.05, 0, 20.2)); }
      T.beam('rd', r1, r2, 0.22); }
    T.flush(g, {pl:'#b9b2a5', dk:'#4d453c', co:'#f0ebe0', wa:'#e9dcc0', sc:'#8a5a34', mo:'#c99a4a', rf:'#8c4a32', so:'#6d4a36', gr:'#3e352c', rd:'#6a3826', cp:'#d9d2c4', cd:'#3d4044'});
    return g;
  }};
SG_PLACES.push({type:'sggeylangserai', lat:1.3167226, lon:103.8982196, rot:0});
LANDMARKS.sggeylangserai2 = {zh:'芽笼士乃巴刹', en:'Geylang Serai Market', cat:'new', r:52, h:21, label:false, lt:{m:0, c:'#ffe1b4', k:0.3, e:0.6},
  build(){
    const g = new THREE.Group(), T = mkT(), cp = D.gsm.cp;
    // multi-storey car park behind the market (six decks)
    T.prism('cp', cp, -3, 18.1, 'pl');
    for (let y = 3.0; y < 18; y += 3.0) facade(T, cp, y - 1.6, y - 0.4, {band:'cd', fh:100, b0:0, bh:1.2, bd:0.12});
    T.walls('cp', offR(cp, -0.05), 18.1, 19.2);
    // landscaped roof garden (Archnet: car park with a landscaped roof)
    const ins = offR(cp, -2.0); T.cap('gn', ins, 18.25);
    const bb = obb(cp); for (let k = -3; k <= 3; k++) for (const t of [-1, 1]){ const x = bb.cx + bb.ux*k*bb.L/8 - bb.uz*t*bb.W/5, z = bb.cz + bb.uz*k*bb.L/8 + bb.ux*t*bb.W/5; if (inPoly(ins, x, z)){ T.cyl('tk', x, z, 18.2, 19.4, 0.15, 0.15, 5); T.ob('tr', x, z, 1, 0, 1.4, 1.4, 19.4, 21.2); } }
    T.flush(g, {pl:'#b9b2a5', cp:'#d9d2c4', cd:'#3d4044', gn:'#6d8f52', tk:'#5b4a3a', tr:'#4f7a3e'});
    return g;
  }};
SG_PLACES.push({type:'sggeylangserai2', lat:1.317179, lon:103.8983351, rot:0});

// ================================================================ Paya Lebar Quarter: the mall, PLQ 1 & 2 on their podium, the plaza canopy (PLQ 3: sgplq3)
const plqTower = (T, ring, y0, y1, seed) => {
  T.walls('gl', ring, y0, y1);
  // vertical aluminium fins in a woven (songket-like) rhythm: deep and shallow fins alternating in groups, horizontal slab lines
  facade(T, ring, y0, y1, {fin:'fn', step:1.5, d:0.55, w:0.14, finH:(k, i) => ((k + i*3 + seed) % 7 < 3 ? 1 : 0.62)});
  facade(T, ring, y0, y1, {band:'sp', fh:4.0, bh:0.5, bd:0.2});
  T.cap('rf', ring, y1);
  const ins = offR(ring, -2.5); T.walls('fn', offR(ring, -0.1), y1, y1 + 3.2); T.prism('pm', offR(ring, -6), y1, y1 + 2.4);
  T.walls('cr', ins, y1 + 3.0, y1 + 3.25);
};
LANDMARKS.sgplq = {zh:'巴耶利峇坊', en:'Paya Lebar Quarter', cat:'new', r:125, h:63,
  lt:{m:1, c:'#eaf1f6', k:0.55, fh:4.0, cw:3.0},
  build(){
    const g = new THREE.Group(), T = mkT(), Q = D.plq;
    // mall: glazed shopfront base, songket-patterned panel facade above, landscaped roof terraces
    T.prism('bs', Q.mall, -3, 0.5);
    T.walls('gl', Q.mall, 0.5, 6.5); facade(T, Q.mall, 0.5, 6.5, {fin:'fn', step:3, d:0.3, w:0.25});
    T.walls('ma', Q.mall, 6.5, 24); facade(T, Q.mall, 6.5, 24, {fin:'mb', step:2.4, d:0.4, w:0.6, finH:(k, i) => (k + i) % 4 === 0 ? 1 : 0.55, f0:0});
    facade(T, Q.mall, 6.5, 24, {band:'mb', fh:5.8, bh:0.6, bd:0.25});
    T.cap('rf', Q.mall, 24);
    const mo = obb(Q.mall);
    for (const [s, t, a, b] of [[-18, -18, 16, 14], [16, -14, 14, 16], [-14, 18, 18, 12], [18, 18, 12, 12]]){ const x = mo.cx + mo.ux*s - mo.uz*t, z = mo.cz + mo.uz*s + mo.ux*t; T.ob('gn', x, z, mo.ux, mo.uz, a, b, 24, 24.6); }
    T.walls('cr', offR(Q.mall, -0.2), 24, 25.2);
    // the podium under PLQ 1 & 2 and the two 14-storey towers
    T.prism('bs', Q.pz, -3, 0.5);
    T.walls('gl', Q.pz, 0.5, 6.0); T.walls('ma', Q.pz, 6.0, 14.5); facade(T, Q.pz, 6.0, 14.5, {fin:'mb', step:3, d:0.35, w:0.5});
    T.cap('gn', Q.pz, 14.5);
    plqTower(T, Q.t1, 14.5, 60, 0); plqTower(T, Q.t2, 14.5, 60, 3);
    // plaza: lightweight tensile canopy on slender masts between the mall and the towers
    const xa = Math.max(...Q.mall.map(p => p[0])) + 3, xb = Math.min(...Q.pz.map(p => p[0])) - 3;
    for (let z = -32; z <= 30; z += 15.5){
      for (let x = xa + 4; x < xb - 3; x += 12){
        const c = [x + 6, z + 7.7];
        T.cyl('fn', c[0], c[1], 0.5, 15.5, 0.18, 0.15, 6);
        T.tri('mem', [c[0], 15.8, c[1]], [c[0] - 6, 12.2, c[1] - 7.7], [c[0] + 6, 12.2, c[1] - 7.7]); T.tri('mem', [c[0], 15.8, c[1]], [c[0] + 6, 12.2, c[1] - 7.7], [c[0] + 6, 12.2, c[1] + 7.7]);
        T.tri('mem', [c[0], 15.8, c[1]], [c[0] + 6, 12.2, c[1] + 7.7], [c[0] - 6, 12.2, c[1] + 7.7]); T.tri('mem', [c[0], 15.8, c[1]], [c[0] - 6, 12.2, c[1] + 7.7], [c[0] - 6, 12.2, c[1] - 7.7]);
      }
    }
    keepers(T, 'sgplq');
    T.flush(g, {bs:'#8f8c86', gl:{c:'#5d7684', m:1}, fn:'#d7d9d6', sp:'#9aa3a8', rf:'#6f7478', pm:'#9b9e9e', cr:{c:'#e6edf2', glow:'#dce8ff', gk:0.6}, kp:'#cfcac0', kr:'#9a9890',
      ma:'#cfc8bb', mb:'#a89880', gn:'#6f9255', mem:{c:'#f4f3ee', ds:true, glow:'#fff4e0', gk:0.35}});
    return g;
  }};
SG_PLACES.push({type:'sgplq', lat:1.3176783, lon:103.8935, rot:0});
LANDMARKS.sgplq3 = {zh:'巴耶利峇坊', en:'Paya Lebar Quarter', cat:'new', r:75, h:56, label:false,
  lt:{m:1, c:'#eaf1f6', k:0.55, fh:4.0, cw:3.0},
  build(){
    const g = new THREE.Group(), T = mkT(), Q = D.plq3;
    T.prism('bs', Q.pod, -3, 0.5); T.walls('gl', Q.pod, 0.5, 6.0); T.walls('ma', Q.pod, 6.0, 20);
    facade(T, Q.pod, 6.0, 20, {fin:'mb', step:3, d:0.35, w:0.5}); T.cap('gn', Q.pod, 20);
    plqTower(T, Q.tw, 20, 56, 5);
    T.flush(g, {bs:'#8f8c86', gl:{c:'#5d7684', m:1}, fn:'#d7d9d6', sp:'#9aa3a8', rf:'#6f7478', pm:'#9b9e9e', cr:{c:'#e6edf2', glow:'#dce8ff', gk:0.6}, ma:'#cfc8bb', mb:'#a89880', gn:'#6f9255'});
    return g;
  }};
SG_PLACES.push({type:'sgplq3', lat:1.3158862, lon:103.8934829, rot:0});
