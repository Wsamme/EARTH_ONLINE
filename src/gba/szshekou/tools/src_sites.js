
// distance from point to polyline
function dPL(x, z, P){ let d = Infinity; for (let i = 0; i + 1 < P.length; i++){ const a = P[i], b = P[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx*dx + dz*dz || 1, t = clamp(((x - a[0])*dx + (z - a[1])*dz)/L2, 0, 1);
  d = Math.min(d, Math.hypot(x - a[0] - dx*t, z - a[1] - dz*t)); } return d; }
// spatial index of road segments (20 m buckets): near(x, z, m) = within half-width + m of any segment
function SegIndex(roads, pad){
  const C = 20, M = new Map(), key = (i, j) => i*100003 + j;
  for (const r of roads) for (let k = 0; k + 1 < r.P.length; k++){ const a = r.P[k], b = r.P[k + 1], e = r.w/2 + pad;
    for (let i = Math.floor((Math.min(a[0], b[0]) - e)/C); i <= Math.floor((Math.max(a[0], b[0]) + e)/C); i++) for (let j = Math.floor((Math.min(a[1], b[1]) - e)/C); j <= Math.floor((Math.max(a[1], b[1]) + e)/C); j++){
      const kk = key(i, j); if (!M.has(kk)) M.set(kk, []); M.get(kk).push([a, b, r.w/2]); } }
  return {near(x, z, m){ const L = M.get(key(Math.floor(x/C), Math.floor(z/C))); if (!L) return false;
    for (const [a, b, hw] of L){ const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx*dx + dz*dz || 1, t = clamp(((x - a[0])*dx + (z - a[1])*dz)/L2, 0, 1); if (Math.hypot(x - a[0] - dx*t, z - a[1] - dz*t) < hw + m) return true; } return false; }};
}
// a box house on a plan ring (vertex-coloured walls), flat roof with a parapet; returns nothing
function vbHouse(V, Rf, R, y0, y1, wall, roofc){
  V.c(wall); const P = R;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[j], b = P[i]; V.q(0, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); }
  V.c(roofc || wall); let idx; try { idx = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []); } catch (e){ idx = []; }
  for (const t of idx){ const a = P[t[0]], b = P[t[1]], c = P[t[2]]; V.t(0, [a[0], y1, a[1]], [b[0], y1, b[1]], [c[0], y1, c[1]]); }
}

// windows on the facades of a house ring: rows per floor (fh), one window every ~3 m, dark glass with a lighter frame
function vbWindows(V, R, y0, y1, fh, rng){
  const sg = polyArea(R) > 0 ? 1 : -1;
  for (let i = 0; i < R.length; i++){ const a = R[i], b = R[(i + 1) % R.length], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); if (l < 3.2) continue;
    const ex = dx/l, ez = dz/l, m = [(a[0] + b[0])/2, (a[1] + b[1])/2], o = pip(R, m[0] + ez*0.4, m[1] - ex*0.4) ? -0.12 : 0.12, nx = ez*o, nz = -ex*o, n = Math.floor(l/3.0), st = (l - n*3.0)/2 + 1.5;
    for (let y = y0 + 1.0; y + 1.6 < y1; y += fh){ for (let k = 0; k < n; k++){ const c = st + k*3.0, x = a[0] + ex*c + nx, z = a[1] + ez*c + nz;
      V.c(rng() < 0.15 ? '#8d939a' : '#3e464e'); V.q(0, [x - ex*0.7, y, z - ez*0.7], [x + ex*0.7, y, z + ez*0.7], [x + ex*0.7, y + 1.5, z + ez*0.7], [x - ex*0.7, y + 1.5, z - ez*0.7]); } } }
}
// ================= Nantou Ancient City (南头古城, site) =================
// The walled seat of Xin'an County: walls built 1394 (Ming); about 680 m E-W x 500 m N-S at its widest; the south gate (seal-script
// name over the arch, not drawn) stands between the houses; the Dongguan Guild Hall, the Xinguo Wengong Temple, the Guandi Temple
// outside the south gate (Shenzhen Government Online, eyeshenzhen, shenzhenshopper). Today a dense urban village of 3-7-storey
// houses round the restored Qing lanes. Plan: OSM w219961346 (the protected area), its streets (Zhongshan South / East / West
// Streets, Chunjing Street ...), the 92 OSM footprints inside (rebuilt at this build's heights); the rest of each block is filled
// with houses of the village's kind (sizes and storeys from the usual village plots: estimates, not individual buildings).
// The south gate (OSM w1183877518): granite / brick gate block about 7 m high with an arched passage 4.5 m high (estimates).
const NTS = {vh:{m:1, lc:'#ffe2b8', lk:0.35, fh:3.0, cw:2.4}, tile:{c:'#5d5f5e', m:0, lc:'#ffd6a0', lk:0.3}, brick:{c:'#8a8b86', m:0, lc:'#ffd6a0', lk:0.7, e:0.6}, gran:{c:'#b8b2a3', m:0, lc:'#ffd6a0', lk:0.7, e:0.6},
  dark:'#2f2f2e', ridge:'#4a4c4b', lant:{c:'#d23a22', glow:'#ff8a40', gk:1.8}, wood:'#6d4a30', pole:'#7f8384', tr:'#6b553f', cr:'#4e7a3c'};
Object.assign(SITES, {sznantou:{zh:'南头古城', en:'Nantou Ancient City', lat:D.sznantou.lat, lon:D.sznantou.lon, r:313, keep:D.sznantou.area, keepRoads:[11, 12], h:70,
  lt:{m:1, c:'#ffe2b8', k:0.45, fh:3.0, cw:2.4},
  build(ctx){
    const T = D.sznantou, g = new THREE.Group(), B = Batch(), V = VB(NTS.vh), gy = ctx.gy, rng = ctx.rng, A = T.area;
    const roads = T.roads.map(([c, P]) => ({c, P, w:c <= 10 ? 7 : c === 11 ? 4.5 : 3.6}));
    // lanes: stone paving
    for (const r of roads) ctx.line(r.P, r.w, r.c <= 10 ? [176, 170, 160] : [196, 188, 172]);
    const special = [T.gate, T.guild, T.xinguo, T.xinguo2].map(R => grow(R, 3));
    const inSpecial = (x, z) => special.some(R => pip(R, x, z));
    const SI = SegIndex(roads, 4.5), nearRoad = (x, z, m) => SI.near(x, z, m);
    const mainSt = (x, z) => roads.some(r => r.c <= 10 && dPL(x, z, r.P) < 13) || dPL(x, z, [[-34, 144], [-37, 122], [-42, 63], [-47, -62]]) < 13;
    const WALLS = ['#d9d2c4', '#e4dfd4', '#cfc6b4', '#bfb7a8', '#e8e4da', '#c9bda6', '#d6d8d4', '#b9a88f'];
    // 1) the real footprints inside (this build's heights)
    const realR = [];
    for (const [R, h] of T.b){ const c = centroid(R); if (inSpecial(c[0], c[1])) continue; realR.push(grow(R, 1.2));
      let lo = Infinity; for (const p of R) lo = Math.min(lo, gy(p[0], p[1])); const y0 = lo - 1, y1 = lo + h, wc = WALLS[Math.floor(rng()*WALLS.length)];
      if (h <= 8){ vbHouse(V, null, R, y0, lo + h*0.62, wc, '#7a7a76'); const O = orect(R); gableRoof(B, NTS.tile, null, O.cx, O.cz, O.ux, O.uz, O.L, O.W, lo + h*0.62, h*0.38, 0.4); }
      else { vbHouse(V, null, R, y0, y1, wc, '#9a978f'); vbHouse(V, null, grow(R, -0.25), y1, y1 + 1.0, wc, '#9a978f'); vbWindows(V, R, lo, y1, 3.0, rng); } }
    const inReal = (x, z) => realR.some(R => pip(R, x, z));
    // 2) infill: plots on a grid aligned with Zhongshan South Street
    const ux = Math.sin(0.06), uz = -Math.cos(0.06), vx = -uz, vz = ux, Ai = grow(A, -3), cell = 10.4;
    for (let a = -260; a < 260; a += cell) for (let b = -260; b < 260; b += cell){
      const ja = (rng() - 0.5)*0.8, jb = (rng() - 0.5)*0.8, cx = (a + ja)*vx + (b + jb)*ux, cz = (a + ja)*vz + (b + jb)*uz;
      if (!pip(Ai, cx, cz) || inSpecial(cx, cz) || inReal(cx, cz)) continue;
      const w = 8.6 + rng()*1.0, d = 8.4 + rng()*1.6, P = [[-w/2, -d/2], [w/2, -d/2], [w/2, d/2], [-w/2, d/2]].map(([s, t]) => [cx + vx*s + ux*t, cz + vz*s + uz*t]);
      if (P.some(p => !pip(A, p[0], p[1]) || nearRoad(p[0], p[1], 0.6) || inReal(p[0], p[1]) || inSpecial(p[0], p[1]))) { if (nearRoad(cx, cz, 0.6) || rng() < 0.5) continue; }
      if (nearRoad(cx, cz, 2.5)) continue;
      let lo = Infinity; for (const p of P) lo = Math.min(lo, gy(p[0], p[1]));
      const old = mainSt(cx, cz) && rng() < 0.75;
      if (old){   // restored Qing / Republic house: 1-2 storeys, grey brick, grey tile gable roof, ridge along the street
        const fl = rng() < 0.5 ? 1 : 2, e = lo + 3.6*fl + 0.6;
        vbHouse(V, null, P, lo - 1, e, rng() < 0.6 ? '#8f908a' : '#d7d0c0', '#6d6e6a');
        gableRoof(B, NTS.tile, null, cx, cz, vx, vz, w, d, e, 2.4, 0.45);
        obox(B, NTS.ridge, cx, cz, vx, vz, w + 0.6, 0.35, e + 2.35, e + 2.7);
      } else {    // village house: 3-7 storeys, flat roof, a stair hut on top
        const fl = 2 + Math.floor(rng()*6.5*rng() + rng()*1.5), y1 = lo + fl*3.0 + 0.6, wc = WALLS[Math.floor(rng()*WALLS.length)];
        vbHouse(V, null, P, lo - 1, y1, wc, '#a39f96'); vbWindows(V, P, lo + 0.6, y1, 3.0, rng);
        if (rng() < 0.55){ const s = 2.6; vbHouse(V, null, [[-s, -s], [s, -s], [s, s], [-s, s]].map(([p, q]) => [cx + vx*(p*0.6 + w*0.2) + ux*q*0.6, cz + vz*(p*0.6 + w*0.2) + uz*q*0.6]), y1, y1 + 2.6, wc, '#a39f96'); }
      }
    }
    // 3) the south gate: gate block with an arched passage, crenellated parapet, short wall stubs
    { const O = orect(T.gate), lo = Math.min(...T.gate.map(p => gy(p[0], p[1]))), y0 = lo - 1, H = lo + 7.0, pu = O.W < O.L ? [O.uz*-1, O.ux] : [O.ux, O.uz];
      // passage runs N-S (along the street): the block is split round a 3.8 m wide arch
      const ax = -O.uz, az = O.ux;      // across the long side = the passage direction when the long side is E-W
      const half = 1.9;
      for (const sg of [-1, 1]){ const s0 = sg*half, s1 = sg*O.L/2, m = (s0 + s1)/2; obox(B, NTS.gran, O.cx + O.ux*m, O.cz + O.uz*m, O.ux, O.uz, Math.abs(s1 - s0), O.W, y0, H); }
      obox(B, NTS.gran, O.cx, O.cz, O.ux, O.uz, 2*half + 0.02, O.W, lo + 4.5 + 0.9, H);
      // the arch (semicircle) as stepped blocks
      for (let k = 0; k < 8; k++){ const a0 = k/8*PI, a1 = (k + 1)/8*PI, x0 = -Math.cos(a0)*half, x1 = -Math.cos(a1)*half, yA = lo + 3.6 + Math.sin((a0 + a1)/2)*0.9;
        const m = (x0 + x1)/2; obox(B, NTS.gran, O.cx + O.ux*m, O.cz + O.uz*m, O.ux, O.uz, Math.abs(x1 - x0) + 0.02, O.W, yA, lo + 5.5); }
      obox(B, NTS.dark, O.cx, O.cz, O.ux, O.uz, 2*half, O.W - 0.6, lo - 0.2, lo + 0.05);
      // brick parapet with crenels
      for (let s = -O.L/2; s < O.L/2 - 0.5; s += 1.6) for (const t of [-O.W/2 + 0.35, O.W/2 - 0.35]){ const x = O.cx + O.ux*(s + 0.5) - O.uz*t, z = O.cz + O.uz*(s + 0.5) + O.ux*t; obox(B, NTS.brick, x, z, O.ux, O.uz, 1.0, 0.7, H, H + 1.1); }
      obox(B, NTS.brick, O.cx, O.cz, O.ux, O.uz, O.L, O.W, H - 0.4, H + 0.05);
      for (const sg of [-1, 1]){ const m = sg*(O.L/2 + 4), x = O.cx + O.ux*m, z = O.cz + O.uz*m, yl = Math.min(gy(x, z), lo); obox(B, NTS.brick, x, z, O.ux, O.uz, 8, O.W - 1.5, yl - 1, lo + 6.0); }
      for (const sg of [-1, 1]){ const t = sg*(O.W/2 + 0.6), x = O.cx - O.uz*t, z = O.cz + O.ux*t; LSph(g, 0.5, x + O.ux*2.6, lo + 4.2, z + O.uz*2.6, NTS.lant, 1.2, 8); LSph(g, 0.5, x - O.ux*2.6, lo + 4.2, z - O.uz*2.6, NTS.lant, 1.2, 8); }
    }
    // 4) Lingnan halls: the Dongguan Guild Hall and the Xinguo Wengong Temple (grey brick, grey tile gables, ridge ornaments)
    for (const R of [T.guild, T.xinguo, T.xinguo2]){ const O = orect(R), lo = Math.min(...R.map(p => gy(p[0], p[1]))), e = lo + 5.8;
      obox(B, NTS.gran, O.cx, O.cz, O.ux, O.uz, O.L + 0.6, O.W + 0.6, lo - 1, lo + 0.5);
      obox(B, NTS.brick, O.cx, O.cz, O.ux, O.uz, O.L, O.W, lo + 0.5, e);
      // roofs: two parallel gables across the depth (halls one behind the other)
      const n = O.W > 12 ? 2 : 1;
      for (let k = 0; k < n; k++){ const t = -O.W/2 + O.W*(k + 0.5)/n, cx = O.cx - O.uz*t, cz = O.cz + O.ux*t; gableRoof(B, NTS.tile, NTS.brick, cx, cz, O.ux, O.uz, O.L, O.W/n, e, 3.0, 0.5);
        obox(B, NTS.ridge, cx, cz, O.ux, O.uz, O.L + 0.4, 0.5, e + 2.9, e + 3.6);
        for (const sg of [-1, 1]){ const x = cx + O.ux*sg*O.L/2, z = cz + O.uz*sg*O.L/2; obox(B, NTS.brick, x, z, O.ux, O.uz, 0.5, O.W/n + 0.6, e - 0.2, e + 3.8); } }
      for (const sg of [-0.25, 0.25]){ const x = O.cx + O.ux*sg*O.L - O.uz*(O.W/2 + 0.4), z = O.cz + O.uz*sg*O.L + O.ux*(O.W/2 + 0.4); LSph(g, 0.45, x, lo + 3.8, z, NTS.lant, 1.25, 8); }
    }
    // 5) lanterns strung over the main streets (restored lanes), lamps, trees in the squares
    for (const r of roads){ if (r.c > 12) continue; const P = r.P;
      for (let i = 0; i + 1 < P.length; i++){ const a = P[i], b = P[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
        for (let d = 5; d < l; d += r.c <= 10 ? 16 : 11){ const x = a[0] + (b[0] - a[0])*d/l, z = a[1] + (b[1] - a[1])*d/l; if (!pip(A, x, z)) continue; const y = gy(x, z);
          if (r.c === 12 && mainSt(x, z)){ LSph(g, 0.38, x, y + 5.2, z, NTS.lant, 1.2, 6); ctx.lamp(x, y + 5.2, z, [255, 150, 90]); }
          else if (r.c <= 11){ const nx = -(b[1] - a[1])/l*(r.w/2 + 0.6), nz = (b[0] - a[0])/l*(r.w/2 + 0.6); abox(B, NTS.pole, x + nx - 0.1, x + nx + 0.1, y, y + 6, z + nz - 0.1, z + nz + 0.1); ctx.lamp(x + nx, y + 6.1, z + nz, [255, 220, 170]); } } } }
    for (let k = 0, n = 0; k < 900 && n < 40; k++){ const x = -240 + rng()*480, z = -200 + rng()*390; if (!pip(Ai, x, z) || !nearRoad(x, z, 4) || nearRoad(x, z, 1.2) || inReal(x, z)) continue; ctx.tree(x, z, 2.6 + rng()*1.6, rng() < 0.5 ? 'raintree' : 'd'); n++; }
    V.flush(g); B.flush(g); return g; }}});

// ================= Qianhai Stone Park (前海石公园, site) =================
// The Qianhai Stone: about 2.8 m high, 2.1 m wide and 0.65 m thick, shaped like a sail, on the bank of the Guiwan River in
// Qianwan, standing alone on the tidal flats in 2012 (Xinhua, 18 May 2021). The park: a broad waterfront lawn, a coastal boardwalk,
// a 230 m urban beach of about 3 600 m2 with irregular stones at the water's edge (Shenzhen Government Online). Plan: OSM w542328084,
// the stone node, the park's paths. The beach's exact position along the shore is approximate.
const QSS = {bld:{c:'#d9d4c8', m:1, lc:'#ffe8c8', lk:0.4}, stone:{c:'#8e8578', m:0, lc:'#ffe8c8', lk:0.9, e:0.8}, stoneB:'#9d968b', deck:'#a07a55', rail:'#d8d4cc', rock:'#8d887f', pole:'#7f8384', lamp:{c:'#fff4dc', glow:'#ffe0ac', gk:1.6}};
Object.assign(SITES, {szqianhaistone:{zh:'前海石公园', en:'Qianhai Stone Park', lat:D.szqianhaistone.lat, lon:D.szqianhaistone.lon, r:410, keep:D.szqianhaistone.park, keepRoads:[11, 12], h:12,
  lt:{m:0, c:'#ffe8c8', k:0.6, e:0.8},
  build(ctx){
    const T = D.szqianhaistone, g = new THREE.Group(), B = Batch(), gy = ctx.gy, rng = ctx.rng, P = T.park;
    ctx.paint(P, [132, 170, 98]);
    for (const [c, L] of T.roads) ctx.line(L, c === 11 ? 4.5 : 3.2, [214, 206, 188]);
    // the waterfront edge: the park ring's edge facing the bay (north-west side: the edges whose outward normal points west / north-west)
    const sea = [];
    for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); if (l < 2) continue;
      let nx = dz/l, nz = -dx/l; const m = [(a[0] + b[0])/2, (a[1] + b[1])/2]; if (pip(P, m[0] + nx*3, m[1] + nz*3)){ nx = -nx; nz = -nz; }
      if (nx*-0.75 + nz*-0.66 > 0.5) sea.push([a, b, nx, nz, l]); }
    // boardwalk along the water edge, with a rail and lamps; the beach on the southern part, rocks at the water's edge
    let run = 0;
    for (const [a, b, nx, nz, l] of sea){ const ex = (b[0] - a[0])/l, ez = (b[1] - a[1])/l;
      for (let d = 0; d < l; d += 6){ const e = Math.min(l, d + 6), p = [a[0] + ex*d - nx*4, a[1] + ez*d - nz*4], q = [a[0] + ex*e - nx*4, a[1] + ez*e - nz*4], y = Math.max(0, gy(p[0], p[1]));
        const beach = run > 120 && run < 350;
        if (beach){ ctx.paint([[a[0] + ex*d, a[1] + ez*d], [a[0] + ex*e, a[1] + ez*e], [q[0] - nx*10, q[1] - nz*10], [p[0] - nx*10, p[1] - nz*10]], [222, 206, 170]);
          for (let k = 0; k < 2; k++){ const s = rng()*6, x = a[0] + ex*(d + s) + nx*0.5, z = a[1] + ez*(d + s) + nz*0.5; obox(B, QSS.rock, x, z, ex, ez, 1.2 + rng(), 0.9 + rng()*0.6, -0.8, 0.4 + rng()*0.5); } }
        else { sbox(B, QSS.deck, p, q, 6.0, y - 0.6, y + 0.55); sbox(B, QSS.rail, [p[0] + nx*3, p[1] + nz*3], [q[0] + nx*3, q[1] + nz*3], 0.12, y + 0.55, y + 1.6); }
        if (Math.round(run/6) % 4 === 0){ const x = p[0] - nx*3.6, z = p[1] - nz*3.6, yy = gy(x, z); abox(B, QSS.pole, x - 0.09, x + 0.09, yy, yy + 4.5, z - 0.09, z + 0.09); lampBox(B, QSS.lamp, x, yy + 4.5, z, 0.4); ctx.lamp(x, yy + 4.6, z, [255, 228, 180]); }
        run += e - d; } }
    // a small paved plaza round the stone
    { const [x, z] = T.stone; ctx.paint(Array.from({length:16}, (_, i) => [x + Math.cos(i/16*TAU)*12, z + Math.sin(i/16*TAU)*12]), [204, 198, 186]); }
    // the stone: sail-like slab on a low granite base, facing the Qianhai towers to the east
    { const [x, z] = T.stone, y = gy(x, z), w = 2.1, h = 2.8, t = 0.65;
      abox(B, QSS.stoneB, x - 2.2, x + 2.2, y - 0.4, y + 0.25, z - 1.3, z + 1.3);
      const out = [[-w/2, 0], [w/2, 0], [w*0.46, h*0.42], [w*0.2, h*0.86], [-w*0.05, h], [-w*0.32, h*0.8], [-w*0.5, h*0.35]];
      const ex = 0, ez = 1;   // the slab's face points east: its width runs north-south
      const Pt = (p, s) => [x + ez*0 + s*1, y + 0.25 + p[1], z + p[0]];
      for (let i = 0; i < out.length; i++){ const a = out[i], b = out[(i + 1) % out.length];
        B.q(QSS.stone, [x - t/2, y + 0.25 + a[1], z + a[0]], [x - t/2, y + 0.25 + b[1], z + b[0]], [x + t/2, y + 0.25 + b[1], z + b[0]], [x + t/2, y + 0.25 + a[1], z + a[0]]); }
      for (const s of [-t/2, t/2]){ for (let i = 1; i + 1 < out.length; i++){ const a = out[0], b = out[i], c = out[i + 1]; B.t(QSS.stone, [x + s, y + 0.25 + a[1], z + a[0]], [x + s, y + 0.25 + b[1], z + b[0]], [x + s, y + 0.25 + c[1], z + c[0]]); } }
      for (const [dx, dz] of [[-2.6, -1.6], [2.6, -1.6], [-2.6, 1.6], [2.6, 1.6]]) lampBox(B, QSS.lamp, x + dx, y, z + dz, 0.3);
    }
    // the park building (OSM footprint, this build's height)
    for (const [R, h] of T.b || []){ let lo = Infinity; for (const p of R) lo = Math.min(lo, gy(p[0], p[1])); prism(B, QSS.bld, R, lo - 0.5, lo + Math.min(h, 8), {top:QSS.rail}); }
    // trees: groves on the lawn, palms along the paths
    const Pin = grow(P, -8);
    for (let k = 0, n = 0; k < 3000 && n < 120; k++){ const x = -300 + rng()*600, z = -300 + rng()*600; if (!pip(Pin, x, z)) continue;
      if (T.roads.some(([c, L]) => dPL(x, z, L) < 3.5)) continue; if (Math.hypot(x - T.stone[0], z - T.stone[1]) < 30) continue;
      const nearPath = T.roads.some(([c, L]) => dPL(x, z, L) < 7); if (!nearPath && rng() < 0.6) continue;
      ctx.tree(x, z, 2.4 + rng()*1.5, nearPath && rng() < 0.5 ? 'palm' : 'raintree'); n++; }
    B.flush(g); return g; }}});

// ================= Qianhai Shenzhen-Hong Kong Youth Innovation Hub (前海深港青年梦工场, site) =================
// Central zone opened Dec 2014; designed by the Hong Kong architect Rocco Ho Chow Lai (何周礼); 8 buildings in a university-campus
// layout linked by passages and covered walkways, landscaped balconies on every building (ourchinastory.com). Plan: OSM area
// w376516134 and its 8+ OSM footprints (rebuilt here: 3-4 storeys, 15 m in this build; storey heights and colours are estimates).
const QHS = {wall:{c:'#e9e7e1', m:1, lc:'#e8f0ff', lk:0.4, fh:4.2, cw:3.0}, glass:{c:'#5b6f7c', glow:'#ffd9a6', gk:0.55}, frame:'#9da3a6', green:'#5f8a45', roof:'#b9bcb8', canopy:'#d9dbd8', lamp:{c:'#fff4dc', glow:'#ffe0ac', gk:1.5}};
Object.assign(SITES, {szqhhub:{zh:'前海深港青年梦工场', en:'Qianhai Shenzhen-Hong Kong Youth Innovation Hub', lat:D.szqhhub.lat, lon:D.szqhhub.lon, r:175, keep:D.szqhhub.area, keepRoads:[11, 12], h:20,
  lt:{m:1, c:'#e8f0ff', k:0.4},
  build(ctx){
    const T = D.szqhhub, g = new THREE.Group(), B = Batch(), gy = ctx.gy, rng = ctx.rng;
    ctx.paint(grow(T.area, -2), [150, 178, 120]);
    for (const [c, L] of T.roads) ctx.line(L, c === 11 ? 5 : 3, [206, 200, 190]);
    const cents = [];
    for (const [R, h] of T.b){ const c = centroid(R); if (!pip(T.area, c[0], c[1])) continue; cents.push(c);
      let lo = Infinity; for (const p of R) lo = Math.min(lo, gy(p[0], p[1])); const H = lo + Math.max(12, Math.min(h, 16)), n = Math.max(3, Math.round((H - lo)/4.2));
      prism(B, QHS.wall, R, lo - 0.8, H, {top:QHS.green});
      // glazed bands and green balcony edges on each floor
      const G = grow(R, 0.08), Gb = grow(R, 0.9);
      for (let f = 0; f < n; f++){ const y = lo + f*(H - lo)/n;
        for (let i = 0; i < G.length; i++){ const a = G[i], b = G[(i + 1) % G.length]; if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 3) continue;
          B.q(QHS.glass, [a[0], y + 1.0, a[1]], [b[0], y + 1.0, b[1]], [b[0], y + 3.4, b[1]], [a[0], y + 3.4, a[1]]);
          if (f > 0 && (i + f) % 3 === 0){ const p = Gb[i], q = Gb[(i + 1) % Gb.length]; sbox(B, QHS.green, p, q, 1.0, y, y + 0.7); } } }
      prism(B, QHS.roof, grow(R, 0.05), H, H + 0.9, {noTop:true});
    }
    // covered walkways linking neighbouring buildings
    for (let i = 0; i < cents.length; i++){ let best = -1, bd = 1e9; for (let j = 0; j < cents.length; j++){ if (j === i) continue; const d = Math.hypot(cents[j][0] - cents[i][0], cents[j][1] - cents[i][1]); if (d < bd){ bd = d; best = j; } }
      if (best < 0 || bd > 90 || best < i) continue; const a = cents[i], b = cents[best], y = Math.max(gy(a[0], a[1]), gy(b[0], b[1]));
      sbox(B, QHS.canopy, a, b, 4.0, y + 3.6, y + 4.0); const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      for (let d = 0; d < l; d += 6){ const x = a[0] + (b[0] - a[0])*d/l, z = a[1] + (b[1] - a[1])*d/l; abox(B, QHS.frame, x - 0.12, x + 0.12, y, y + 3.6, z - 0.12, z + 0.12); } }
    const Ain = grow(T.area, -5);
    for (let k = 0, n = 0; k < 1500 && n < 60; k++){ const x = -220 + rng()*440, z = -220 + rng()*440; if (!pip(Ain, x, z)) continue;
      if (T.b.some(([R]) => pip(grow(R, 3), x, z)) || T.roads.some(([c, L]) => dPL(x, z, L) < 3)) continue; ctx.tree(x, z, 2.4 + rng()*1.4, rng() < 0.3 ? 'palm' : 'raintree'); n++; }
    for (const [c, L] of T.roads) for (let i = 0; i + 1 < L.length; i++){ const a = L[i], b = L[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); for (let d = 6; d < l; d += 22){ const x = a[0] + (b[0] - a[0])*d/l + 2, z = a[1] + (b[1] - a[1])*d/l; if (!pip(T.area, x, z)) continue; const y = gy(x, z); abox(B, QHS.frame, x - 0.08, x + 0.08, y, y + 4, z - 0.08, z + 0.08); lampBox(B, QHS.lamp, x, y + 4, z, 0.35); ctx.lamp(x, y + 4.1, z, [255, 228, 180]); } }
    B.flush(g); return g; }}});
