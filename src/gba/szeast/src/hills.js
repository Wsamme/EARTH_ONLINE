// ================= Yantian Port (盐田港), Yantian International Container Terminals (site) =================
// One of the world's biggest container ports: 16 deep-water berths on about 8 km of waterfront, over 70 quay cranes (mostly
// super-post-Panamax), a 373 ha yard (Wikipedia, YICT). Built on the port area (OSM w261283912) and its sea edge (the OSM
// coastline along it, 8.6 km): ship-to-shore cranes every ~115 m along the quay faces, container stacks in blocks aligned to the
// nearest quay behind a 70 m apron, rubber-tyred gantries over some blocks, high-mast floodlights. Crane and stack layout
// is generic (positions change with operations); crane size from the super-post-Panamax class (estimates). Night: floodlights,
// crane lights.
Object.assign(SITES, {szyantian:{zh:'盐田港', en:'Yantian Port', lat:22.574667, lon:114.267919, r:2300, keep:D.szyantian.keep, keepRoads:[11, 12], h:80,
  lt:{m:0, c:'#fff0d8', k:0.9, e:0.4},
  build(ctx){
    const g = new THREE.Group(), B = mkB(), V = mkV(), d = D.szyantian, gy = ctx.gy, rng = ctx.rng, P = d.port;
    const CR = {c:'#d6d9d8', lc:'#fff2dc', lk:1.0}, CR2 = '#2f4a6a', MH = '#e6e6e0', RTG = {c:'#d9b13a', lc:'#ffe6a8', lk:0.8}, MAST = '#8d9192', LAMP = {c:'#fff6e0', glow:'#fff1d0', gk:2.4};
    const CC = ['#b5452f', '#2d5f8a', '#6c7a3a', '#c9c3b6', '#8a4f2a', '#3d8a7a', '#c48a2a', '#7a2f2f', '#556b7d', '#d8d4cc', '#2f6f3f', '#9a9590'];
    ctx.paint(P, [150, 148, 142]);
    // the quay segments (long straight runs of the sea edge)
    const segs = []; for (const Q of d.quay) for (let i = 1; i < Q.length; i++){ const a = Q[i-1], b = Q[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 150) continue;
      const ex = (b[0] - a[0])/L, ez = (b[1] - a[1])/L; let nx = ez, nz = -ex; const m = [(a[0] + b[0])/2 + nx*20, (a[1] + b[1])/2 + nz*20]; if (pip(P, m[0], m[1])){ nx = -nx; nz = -nz; }   // n: towards the sea
      segs.push({a, b, L, ex, ez, nx, nz, ang:Math.atan2(ez, ex)}); }
    const F = (s, u, v) => [s.a[0] + s.ex*u - s.nx*v, s.a[1] + s.ez*u - s.nz*v];   // v inland
    // ---- ship-to-shore cranes
    let nCr = 0;
    for (const s of segs){ for (let u = 60; u < s.L - 50; u += 115){ const [x, z] = F(s, u, 6), y = Math.max(0.5, gy(x, z)), R = (du, dv, yy) => { const q = F(s, u + du, 6 + dv); return [q[0], yy, q[1]]; };
        nCr++;
        // portal legs (30 m gauge across the quay, 18 m along), sill beams, portal beam
        for (const du of [-9, 9]){ for (const dv of [0, 30]) segP(B.p(CR), R(du, dv, y), R(du, dv, y + 44), 0.9, 4); segP(B.p(CR), R(du, 0, y + 1.5), R(du, 30, y + 1.5), 0.7, 4); segP(B.p(CR), R(du, 0, y + 44), R(du, 30, y + 44), 0.8, 4); }
        for (const dv of [0, 30]) segP(B.p(CR), R(-9, dv, y + 44), R(9, dv, y + 44), 0.8, 4);
        // the boom over the water (outreach ~65 m) and the backreach girder, at 47 m
        for (const du of [-4, 4]) segP(B.p(CR), R(du, -66, y + 47), R(du, 46, y + 47), 0.7, 4);
        for (let dv = -60; dv <= 40; dv += 10) segP(B.p(CR), R(-4, dv, y + 47), R(4, dv, y + 47), 0.3, 4);
        // A-frame apex over the landside legs, forestays to the boom tip, backstays
        const ap = R(0, 30, y + 76); for (const du of [-9, 9]){ segP(B.p(CR), R(du, 30, y + 44), ap, 0.7, 4); segP(B.p(CR), R(du, 0, y + 44), R(0, 8, y + 68), 0.6, 4); }
        segP(B.p(CR), R(0, 8, y + 68), ap, 0.6, 4);
        segP(B.p(CR2), R(0, 8, y + 68), R(0, -66, y + 47.6), 0.25, 4); segP(B.p(CR2), R(0, 8, y + 68), R(0, -30, y + 47.6), 0.25, 4); segP(B.p(CR2), ap, R(0, 46, y + 47.6), 0.25, 4);
        // machinery house on the backreach, trolley and spreader
        const mh = F(s, u, 6 + 38); boxP(B.p(MH), 10, 4.5, 12, mh[0], y + 47.7, mh[1], -s.ang);
        const tv = -20 + rng()*50, tr = F(s, u, 6 + tv); boxP(B.p(CR2), 6, 2.5, 5, tr[0], y + 44.5, tr[1], -s.ang);
        const sp = F(s, u, 6 + tv); boxP(B.p('#d7a72e'), 3, 1, 12, sp[0], y + 18 + rng()*20, sp[1], -s.ang);
        LSph(g, 0.6, ap[0], ap[1] + 0.8, ap[2], AVI, 1, 6); const tip = R(0, -66, y + 48.5); LSph(g, 0.5, tip[0], tip[1], tip[2], AVI, 1, 6);
        for (const dv of [-60, -30, 0, 30]){ const q = R(0, dv, y + 46); ctx.lamp(q[0], q[1], q[2], [255, 240, 215]); }
      } }
    // ---- container stacks: blocks of 6 rows aligned to the nearest quay, 70-330 m inland
    const nearSeg = (x, z) => { let best = null, db = 1e9; for (const s of segs){ const dd = dSeg(x, z, s.a, s.b); if (dd < db){ db = dd; best = s; } } return [best, db]; };
    const inner = offP(P, 25); let nBlk = 0;
    for (const s of segs){ for (let u = 30; u < s.L - 30; u += 68){ for (let v = 72; v < 330; v += 34){
        const [x, z] = F(s, u, v); if (!pip(inner, x, z)) continue; const [ns] = nearSeg(x, z); if (ns !== s) continue; if (rng() < 0.08) continue;
        const y = gy(x, z) + 0.2; nBlk++;
        for (let r = 0; r < 6; r++) for (let k = 0; k < 2; k++){ const q = F(s, u - 15 + k*30, v - 7.5 + r*3.0), hgt = 2.6*(1 + Math.floor(rng()*5)), col = CC[Math.floor(rng()*CC.length)];
          vAdd(V, col, t => boxP(t, 29, hgt, 2.5, q[0], y, q[1], -s.ang)); }
        if (rng() < 0.22){ const q0 = F(s, u, v - 11), q1 = F(s, u, v + 11), yy = y + 18; for (const du of [-12, 12]){ const a = F(s, u + du, v - 11), b = F(s, u + du, v + 11); segP(B.p(RTG), [a[0], y, a[1]], [a[0], yy, a[1]], 0.5, 4); segP(B.p(RTG), [b[0], y, b[1]], [b[0], yy, b[1]], 0.5, 4); segP(B.p(RTG), [a[0], yy, a[1]], [b[0], yy, b[1]], 0.6, 4); }
          segP(B.p(RTG), [q0[0], yy, q0[1]], [q1[0], yy, q1[1]], 0.3, 4); }
      } } }
    // ---- high-mast floodlights over the yard
    for (const s of segs) for (let u = 90; u < s.L - 60; u += 190) for (const v of [60, 200, 340]){ const [x, z] = F(s, u, v); if (!pip(inner, x, z)) continue; const [ns] = nearSeg(x, z); if (ns !== s) continue;
      const y = gy(x, z); segP(B.p(MAST), [x, y, z], [x, y + 35, z], 0.5, 6); boxP(B.p(LAMP), 4, 1.2, 1.2, x, y + 35, z, -s.ang); ctx.lamp(x, y + 34, z, [255, 236, 200]); }
    B.flush(g); vFlush(g, V, {ds:false, lc:'#fff0d8', lk:0.5});
    return g;
  }}});

// ================= Shenzhen Reservoir dam (深圳水库) (site) =================
// The reservoir that stores Dongjiang water for Shenzhen and Hong Kong: compacted earth dam, 30 m high, the whole structure
// nearly 1 000 m with the second earth dam closing a col on the west side; completed 4 March 1960 (industrialhistoryhk). Built
// on the main dam (OSM waterway=dam a17025245) and the west auxiliary dam (w51191239): an embankment with a crest road and
// parapet, a stone-pitched upstream face, a grassed downstream face with berms, the memorial stele (东深供水纪念碑, OSM n5800085489).
// The letters on the dam face (OSM r8509796) are left out (no text). The spillway is not located in OSM and is left out.
// Night: crest lamps.
Object.assign(SITES, {szreservoir:{zh:'深圳水库', en:'Shenzhen Reservoir', lat:22.582947, lon:114.152482, r:1600, keep:D.szreservoir.keep, keepRoads:[10, 11, 12], h:34,
  lt:{m:0, c:'#ffe6c0', k:0.6},
  build(ctx){
    const g = new THREE.Group(), B = mkB(), d = D.szreservoir, gy = ctx.gy;
    const GRASS = '#6f8f55', PITCH = '#9a978e', CREST = '#b5b0a4', PAR = '#d2cdc0';
    const dam = (Pd, crestW) => {
      const O = obb(Pd), c = Math.cos(O.ang), s = Math.sin(O.ang), N = Math.max(8, Math.round(2*O.a/12)), lakeSide = [];
      // spine: the middle of the dam outline across its long axis, sampled every ~12 m
      const sp = [];
      for (let i = 0; i <= N; i++){ const u = -O.a + 2*O.a*i/N, Q = clipStrip(Pd.map(p => [p[0] - O.cx, p[1] - O.cz]).map(([x, z]) => [x*c + z*s, -x*s + z*c]).map(([uu, vv]) => [vv, uu]), 0, u - 3, u + 3);
        if (!Q.length) continue; let v0 = 1e9, v1 = -1e9; for (const q of Q){ v0 = Math.min(v0, q[0]); v1 = Math.max(v1, q[0]); }
        const vm = (v0 + v1)/2, hw = (v1 - v0)/2, X = (vv) => [O.cx + c*u - s*vv, O.cz + s*u + c*vv]; sp.push({u, vm, hw, X}); }
      // crest height: highest ground across the dam + 4 m (the DEM smooths the embankment)
      let top = -1e9; for (const p of sp) for (const vv of [-p.hw, 0, p.hw]){ const q = p.X(p.vm + vv); top = Math.max(top, gy(q[0], q[1])); } top += 4;
      let sa = 0; for (const p of sp){ const a = p.X(p.vm - p.hw), b = p.X(p.vm + p.hw); sa += gy(a[0], a[1]) - gy(b[0], b[1]); }
      const LA = sa > 0;   // the side with the higher ground (the lake surface) is upstream
      const sec = p => { const a = p.X(p.vm - p.hw), b = p.X(p.vm + p.hw), ga = gy(a[0], a[1]), gb = gy(b[0], b[1]), ca = p.X(p.vm - crestW/2), cb = p.X(p.vm + crestW/2);
        return {A:[a[0], ga - 2, a[1]], Ca:[ca[0], top, ca[1]], Cb:[cb[0], top, cb[1]], Bv:[b[0], gb - 2, b[1]], lakeA:LA}; };
      for (let i = 1; i < sp.length; i++){ const p = sec(sp[i-1]), q = sec(sp[i]);
        quadP(B.p(p.lakeA ? PITCH : GRASS), p.A, q.A, q.Ca, p.Ca); quadP(B.p(CREST), p.Ca, q.Ca, q.Cb, p.Cb); quadP(B.p(p.lakeA ? GRASS : PITCH), p.Cb, q.Cb, q.Bv, p.Bv);
        // parapets on both crest edges
        for (const [e0, e1] of [[p.Ca, q.Ca], [p.Cb, q.Cb]]) quadP(B.p(PAR), [e0[0], top, e0[2]], [e1[0], top, e1[2]], [e1[0], top + 1.1, e1[2]], [e0[0], top + 1.1, e0[2]]);
        // berms on the downstream face (thin lighter bands)
        const dn = p.lakeA ? ['Cb', 'Bv'] : ['Ca', 'A'];
        for (const f of [0.35, 0.68]){ const L = (P1, P2) => [P1[0] + (P2[0] - P1[0])*f, P1[1] + (P2[1] - P1[1])*f + 0.15, P1[2] + (P2[2] - P1[2])*f];
          const a0 = L(p[dn[0]], p[dn[1]]), a1 = L(q[dn[0]], q[dn[1]]); segP(B.p(PAR), a0, a1, 0.4, 4); }
        if (i % 3 === 0) for (const e of [p.Ca, p.Cb]) ctx.lamp(e[0], top + 4, e[2], [255, 220, 170]);
      }
      return top;
    };
    dam(d.dam, 9); dam(d.dam2, 7);
    // the memorial stele beside the dam
    { const [x, z] = d.stele, y = gy(x, z); boxP(B.p(PAR), 6, 0.8, 4, x, y - 0.3, z, 0.4); boxP(B.p('#bdb7aa'), 3.2, 6.5, 0.9, x, y + 0.5, z, 0.4); boxP(B.p(PAR), 3.8, 0.5, 1.3, x, y + 7.0, z, 0.4); }
    B.flush(g);
    return g;
  }}});

// ================= Fairy Lake Botanical Garden (仙湖植物园) (site) =================
// The botanical garden round Fairy Lake under Wutong Shan (Hongfa Temple, its own landmark, stands in it). Built on what OSM
// maps: the Longzun pagoda (龙尊塔, a pagoda point) and the Benhuan pagoda (本焕塔, its round footprint near the temple), the
// pavilions 两宜亭 / 望湖亭 / 揽胜亭 / 听雨亭 / 登云亭 (two storeys), the Petrified Forest (化石森林: standing fossil trunks), the
// lakeside: lamps round Fairy Lake, garden trees and palms round the lakes. Pagoda and pavilion sizes are estimates; the
// garden's real buildings stay as the map has them (keep = the modelled features only). Night: lamps, warm pagoda light.
Object.assign(SITES, {szxianhu:{zh:'仙湖植物园', en:'Fairy Lake Botanical Garden', lat:22.580522, lon:114.174475, r:1571, keep:D.szxianhu.keep, keepRoads:[11, 12], h:40,
  lt:{m:0, c:'#ffcf98', k:1.0, e:0.5, anim:'breathe'},
  build(ctx){
    const g = new THREE.Group(), B = mkB(), d = D.szxianhu, gy = ctx.gy, rng = ctx.rng;
    const TILE = {c:'#d9a22c', lc:'#ffd27a', lk:1.0}, GT = '#3f6e55', RED = '#a2322a', WALL = {c:'#e9dcc0', lc:'#ffd9a0'}, STONE = '#a9a397', GOLD = {c:'#d8b04a', lc:'#ffe09a', lk:1.3}, WOOD = '#7a3f2a', FOS = '#7d6f5e';
    // a multi-eaved pagoda (octagonal), n storeys
    const pagoda = (x, z, R0, n, hs, tile) => { const y0 = gy(x, z); let y = y0 - 1.5, r = R0;
      latheP(B.p(STONE), [[R0 + 2, y], [R0 + 2, y0 + 1.2]], x, z, 8, PI/8); capP(B.p(STONE), ringPts(x, z, R0 + 2, 8, PI/8), y0 + 1.2); y = y0 + 1.2;
      for (let i = 0; i < n; i++){ latheP(B.p(WALL), [[r, y], [r, y + hs]], x, z, 8, PI/8);
        for (let k = 0; k < 8; k++){ const a = PI/8 + (k + 0.5)/8*TAU; segP(B.p(RED), [x + Math.cos(a)*r*0.93, y + hs*0.15, z + Math.sin(a)*r*0.93], [x + Math.cos(a)*r*0.93, y + hs*0.7, z + Math.sin(a)*r*0.93], r*0.12, 4); }
        latheP(B.p(tile), [[r + 1.4, y + hs], [r + 0.3, y + hs + 0.9], [r*0.85, y + hs + 1.2]], x, z, 8, PI/8);
        y += hs + 1.2; r *= 0.88; }
      latheP(B.p(GOLD), [[r*0.6, y], [r*0.25, y + 1.5], [0.4, y + 3], [0.1, y + 6]], x, z, 8);
      ctx.lamp(x, y0 + 4, z + R0 + 3, [255, 200, 140]); return y; };
    pagoda(d.longzun[0], d.longzun[1], 4.0, 7, 3.4, TILE);
    { const c = ctr(d.benhuan), r = Math.sqrt(Math.abs(sArea(d.benhuan))/PI); pagoda(c[0], c[1], Math.min(6, r*0.7), 5, 3.6, TILE); }
    // pavilions: round-eaved square tings on stone bases
    const ting = (x, z, a, two) => { const y = gy(x, z); boxP(B.p(STONE), 2*a + 1.5, 1.6, 2*a + 1.5, x, y - 1, z, 0.5);
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]){ const c = Math.cos(0.5), s = Math.sin(0.5), px = x + (sx*a)*c + (sz*a)*s, pz = z - (sx*a)*s + (sz*a)*c; segP(B.p(RED), [px, y + 0.6, pz], [px, y + 3.6, pz], 0.18, 6); }
      let yt = roofP(B.p(TILE), x, z, a + 1.2, a + 1.2, 0.1, 0.1, y + 3.6, 2.2, {ry:0.5, lift:0.6, nt:4, pw:1.6, fas:0.25, fo:B.p(GT)});
      if (two){ for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]){ const c = Math.cos(0.5), s = Math.sin(0.5), px = x + (sx*a*0.8)*c + (sz*a*0.8)*s, pz = z - (sx*a*0.8)*s + (sz*a*0.8)*c; segP(B.p(RED), [px, y + 4.4, pz], [px, y + 6.8, pz], 0.15, 6); }
        yt = roofP(B.p(TILE), x, z, a + 0.8, a + 0.8, 0.1, 0.1, y + 6.8, 2.0, {ry:0.5, lift:0.6, nt:4, pw:1.6, fas:0.2, fo:B.p(GT)}); }
      latheP(B.p(GOLD), [[0.3, yt], [0.15, yt + 0.8], [0.05, yt + 1.2]], x, z, 6); ctx.lamp(x, y + 3, z, [255, 205, 150]); };
    for (const nm in d.pav){ const v = d.pav[nm], P = typeof v[0] === 'number' ? null : v, c = P ? ctr(P) : v, a = P ? cl(Math.sqrt(Math.abs(sArea(P)))/2 - 0.6, 1.8, 4) : 2.4; ting(c[0], c[1], a, nm === '登云亭'); }
    // the Petrified Forest: standing fossil trunks in the garden area
    { const P = d.fossil; let n = 0; for (let t = 0; t < 600 && n < 70; t++){ const [x0, x1, z0, z1] = [Math.min(...P.map(p => p[0])), Math.max(...P.map(p => p[0])), Math.min(...P.map(p => p[1])), Math.max(...P.map(p => p[1]))];
        const x = lerp(x0, x1, rng()), z = lerp(z0, z1, rng()); if (!pip(offP(P, 3), x, z)) continue; const y = gy(x, z), h = 1.5 + rng()*4.5, r = 0.35 + rng()*0.5; n++;
        latheP(B.p(FOS), [[r*1.3, y - 0.5], [r, y + 0.3], [r*0.9, y + h], [r*0.5, y + h + 0.2]], x, z, 6, rng()*3); if (rng() < 0.25) segP(B.p(FOS), [x, y + 0.4, z], [x + (rng() - 0.5)*6, y + 0.5, z + (rng() - 0.5)*6], r*0.8, 5); } }
    // lamps round Fairy Lake and Mirror Lake, palms / garden trees on the lake shores
    for (const L of [d.lake, d.mirror]){ lampsAlong(ctx, L.concat([L[0]]), 24, 3.4, [255, 214, 165], 0);
      for (let i = 0; i < L.length; i++){ if (rng() < 0.45) continue; const a = L[i], b = L[(i+1) % L.length], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1;
        for (const sg of [-1, 1]){ const x = a[0] + sg*dz/l*8, z = a[1] - sg*dx/l*8; if (!pip(L, x, z) && dPoly(L, x, z) > 5) ctx.tree(x, z, 2.6 + rng()*1.6, rng() < 0.35 ? 'palm' : (rng() < 0.5 ? 'raintree' : 'd')); } } }
    // garden planting: trees through the garden away from the lakes, the paths and the buildings (Hongfa's area left to the temple)
    { const HF = [290, 37], wet = [d.lake, d.mirror, d.fern], nearP = lineMask(d.paths.map(L => L.p), 3), nearW = lineMask(wet.map(L => L.concat([L[0]])), 4);
      treesIn(ctx, d.garden, 900, 2.6, 4.6, ['raintree', 'd', 'd', 'palm', 'pine'], (x, z) => nearP(x, z) || nearW(x, z) || wet.some(L => pip(L, x, z)) || Math.hypot(x - HF[0], z - HF[1]) < 175 || d.bc.some(([bx, bz, br]) => Math.hypot(x - bx, z - bz) < br)); }
    B.flush(g);
    return g;
  }}});

// ================= Big Wutong, the Wutong Shan summit (大梧桐) (site) =================
// The highest peak of Shenzhen, 943.7 m (the app's 70 m grid reads it lower); the summit marker is the large inscribed rock
// "鹏城第一峰" (sz.gov.cn; OSM rock n... at the summit) - modelled as the bare granite boulder, no text; the summit rocks round it
// and the paved summit paths (this build's OSM paths) with their stone steps. Night: none (a mountain top).
Object.assign(SITES, {szwutong:{zh:'大梧桐', en:'Big Wutong (Wutong Shan summit)', lat:22.582278, lon:114.214639, r:330, keep:D.szwutong.keep, keepRoads:[10, 11, 12], h:12,
  lt:{m:0, c:'#ffe2b8', k:0.3},
  build(ctx){
    const g = new THREE.Group(), B = mkB(), d = D.szwutong, gy = ctx.gy, rng = ctx.rng;
    const ROCK = '#9d968a', ROCK2 = '#8a847a', STEP = '#b3ad9f';
    for (const L of d.paths){ ctx.line(L.p, 2.2, [170, 162, 146]); if (dPoly(L.p, d.rock[0], d.rock[1], true) < 220) ribbonP(B.p('#aaa293'), L.p, 2.0, gy, 0.2, 3); }
    // the summit rock: a big rounded granite boulder on a rock platform, smaller boulders round it
    const boulder = (x, z, R, h, col) => { const y = gy(x, z) - 0.6, n = 9, ph = rng()*TAU, P = [];
      for (let j = 0; j <= 4; j++){ const t = j/4, rr = R*(1 - 0.75*t*t)*(0.9 + 0.1*Math.sin(j*1.7)); P.push([rr, y + h*t]); }
      latheP(B.p(col), P, x, z, n, ph); capP(B.p(col), ringPts(x, z, P[4][0], n, ph), P[4][1]); };
    const [rx, rz] = d.rock;
    boulder(rx, rz, 5.5, 6.5, ROCK);
    for (let i = 0; i < 26; i++){ const a = rng()*TAU, r = 6 + rng()*26, x = rx + Math.cos(a)*r, z = rz + Math.sin(a)*r; if (d.paths.some(L => dPoly(L.p, x, z, true) < 2)) continue; boulder(x, z, 0.8 + rng()*2.2, 0.6 + rng()*2.0, rng() < 0.5 ? ROCK : ROCK2); }
    // stone steps on the paths near the summit
    for (const L of d.paths){ const len = plen(L.p); for (let t = 1; t < len; t += 1.8){ const p = along(L.p, t); if (Math.hypot(p[0] - rx, p[1] - rz) > 160) continue; const y = gy(p[0], p[1]); boxP(B.p(STEP), 0.7, 0.25, 2.0, p[0], y - 0.05, p[1], -p[2]); } }
    B.flush(g);
    return g;
  }}});
