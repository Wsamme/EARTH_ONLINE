
// ================= Longhua cultural centre: Shenzhen Art Museum (new) and Shenzhen Library North (KSP Juergen Engel Architekten) =========
// Facts: both by KSP Juergen Engel (eyeshenzhen 26 Oct 2023; competition won 2015, dezeen 27 Nov 2015: two buildings on a six-metre
// stone base round a public plaza). Art museum: ~66 000 m2, 18 halls, 13.9 m high halls on the 1st floor, a 3 900 m2 semi-outdoor
// sculpture hall on the 2nd floor, natural light on the 3rd (eyeshenzhen). Library North: opened 28 Dec 2023, 6 floors above ground
// + 3 below, ~72 000 m2, white facade (Wikipedia), white diamond-lattice elements across the whole building (ourchinastory).
// Footprints OSM w1178327405 (museum), w1178327404 (library), w1299259311 (the joint base / podium between them). Heights are not
// published: museum ~40 m and library ~40 m (6 floors on the 6 m base) are estimates.
LANDMARKS.szartmuseum = {zh:'深圳美术馆新馆', en:'Shenzhen Art Museum (new building)', cat:'new', r:88, h:40,
  lt:{m:0, c:'#fff3e0', k:0.55, e:0.5},
  build(){
    const g = new THREE.Group(), B = mkB(), FP = D.art.fp, f = oframe(FP);
    const WH = {c:'#ecebe6', m:0, lk:0.5}, WH2 = {c:'#dedcd5', m:0, lk:0.45}, GL = {c:'#5d6f7c', glow:'#ffe0b4', gk:0.55}, STONE = '#c6bfb1',
      MUL = '#c8ccce', DARK = '#3b4248', GRN = '#647f50', SKY = {c:'#c9d4da', glow:'#fff1d8', gk:0.4};
    const P = (u, v) => [f.c[0] + u*f.ux - v*f.uz, f.c[1] + u*f.uz + v*f.ux], hl = f.L/2, hw = f.W/2;
    const rect = (u0, u1, v0, v1) => [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)];
    // stone base storey (0-6 m) with the glazed 1st-floor halls set into it
    const R0 = rect(-hl, hl, -hw, hw);
    prism(B.p(STONE), R0, 0, 1.2, true);
    prism(B.p(GL), rect(-hl + 2, hl - 2, -hw + 2, hw - 2), 1.2, 14, false); mullions(B.p(MUL), rect(-hl + 2, hl - 2, -hw + 2, hw - 2), 1.2, 14, 4.5, 0, 0.3);
    for (let u = -hl + 6; u < hl - 3; u += 17.6) for (const v of [-hw + 6, hw - 6]){ const c = P(u, v); abox(B.p(WH), c[0] - 0.9, c[0] + 0.9, 1.2, 14, c[1] - 0.9, c[1] + 0.9); }
    // the white upper body (3rd / 4th floors) floats over the 2nd-floor semi-outdoor sculpture hall
    prism(B.p(WH2), rect(-hl, hl, -hw, hw), 14, 15.2, true, true);
    prism(B.p(GL), rect(-hl + 9, hl - 9, -hw + 9, hw - 9), 15.2, 22, false);
    for (let u = -hl + 4; u < hl - 2; u += 11.7) for (const v of [-hw + 4, hw - 4]){ const c = P(u, v); seg(B.p(WH), [c[0], 15.2, c[1]], [c[0], 22, c[1]], 0.6, 8); }
    for (let u = -hl + 15; u < hl - 10; u += 18) for (let v = -hw + 16; v < hw - 12; v += 18){ const c = P(u, v); abox(B.p(GRN), c[0] - 3, c[0] + 3, 15.2, 16.2, c[1] - 3, c[1] + 3); }
    const UP = rect(-hl, hl, -hw, hw);
    prism(B.p(WH), UP, 22, 40, true, true);
    // the white skin: shallow vertical ribs in a 3 m rhythm and two dark reveal lines
    for (let i = 0; i < 4; i++){ const a = UP[i], b = UP[(i + 1) % 4], l = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(l/3.0), [nx, nz] = edgeN(UP, i);
      for (let k = 1; k < n; k++){ const t = k/n, x = lerp(a[0], b[0], t) + nx*0.05, z = lerp(a[1], b[1], t) + nz*0.05;
        q4(B.p(WH2), [x, 22.4, z], [x + nx*0.45, 22.4, z + nz*0.45], [x + nx*0.45, 39.6, z + nz*0.45], [x, 39.6, z]); }
      for (const y of [30.6, 31.2]) q4(B.p(DARK), [a[0] + nx*0.06, y, a[1] + nz*0.06], [b[0] + nx*0.06, y, b[1] + nz*0.06], [b[0] + nx*0.06, y + 0.25, b[1] + nz*0.06], [a[0] + nx*0.06, y + 0.25, a[1] + nz*0.06]); }
    // roof: the 3rd-floor daylight halls under ridge-light strips
    for (let u = -hl + 8; u < hl - 8; u += 12){ const a = P(u, -hw + 8), b = P(u + 6, -hw + 8), c = P(u + 6, hw - 8), d = P(u, hw - 8);
      q4(B.p(SKY), [a[0], 40.1, a[1]], [b[0], 40.1, b[1]], [c[0], 40.1, c[1]], [d[0], 40.1, d[1]]); }
    prism(B.p(WH), offP(UP, -0.4), 40, 41.2, false);
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'szartmuseum', lat:PLC.szartmuseum.lat, lon:PLC.szartmuseum.lon, rot:PLC.szartmuseum.rot});

LANDMARKS.szlibnorth = {zh:'深圳图书馆北馆', en:'Shenzhen Library North Branch (Second Library)', cat:'new', r:120, h:40,
  lt:{m:0, c:'#fff3e0', k:0.5, e:0.5},
  build(){
    const g = new THREE.Group(), B = mkB(), L = D.lib, FP = L.fp;
    const WH = {c:'#f0efea', m:0, lk:0.55}, GL = {c:'#56697a', glow:'#ffe0b0', gk:0.6}, STONE = '#c3bcae', PAV = '#b9b2a4', DARK = '#39424a';
    // the joint stone base (6 m) under the library and the plaza toward the museum; its top is the public plaza
    prism(B.p(STONE), L.pod, -1.5, 6, true);
    for (let i = 0; i < L.pod.length; i++){ const a = L.pod[i], b = L.pod[(i + 1) % L.pod.length], [nx, nz, ux, uz, l] = edgeN(L.pod, i);
      for (let s = 3; s < l - 2; s += 7.5) q4(B.p(GL), [a[0] + ux*s + nx*0.05, 0.6, a[1] + uz*s + nz*0.05], [a[0] + ux*(s + 4.5) + nx*0.05, 0.6, a[1] + uz*(s + 4.5) + nz*0.05],
        [a[0] + ux*(s + 4.5) + nx*0.05, 4.8, a[1] + uz*(s + 4.5) + nz*0.05], [a[0] + ux*s + nx*0.05, 4.8, a[1] + uz*s + nz*0.05]); }
    // the library body: glass behind a white diamond lattice, 6 m to 40 m
    const yb = 6, yt = 40, IN = offP(FP, 1.2);
    prism(B.p(GL), IN, yb, yt - 0.2, false);
    prism(B.p(WH), IN, yt - 0.2, yt, true);
    const step = 5.4, hh = 6.8;   // lattice cell: 5.4 m wide, 6.8 m high (one storey of ~5.6 m + offset)
    for (let i = 0; i < FP.length; i++){ const a = FP[i], b = FP[(i + 1) % FP.length], [nx, nz, ux, uz, l] = edgeN(FP, i); if (l < 2) continue;
      const pt = (s, y, d) => [a[0] + ux*s + nx*d, y, a[1] + uz*s + nz*d];
      const n = Math.max(1, Math.round(l/step)), st = l/n;
      for (let y = yb; y < yt - 0.5; y += hh) for (let k = 0; k < n; k++){ const s0 = k*st, s1 = s0 + st, sm2 = (s0 + s1)/2, y1 = Math.min(yt, y + hh), ym = (y + y1)/2;
        // two diagonals per cell, a 0.35 m deep white member
        for (const [p0, p1] of [[[s0, y], [sm2, ym]], [[sm2, ym], [s1, y]], [[s0, y1], [sm2, ym]], [[sm2, ym], [s1, y1]]]){
          const A0 = pt(p0[0], p0[1], 0.1), A1 = pt(p1[0], p1[1], 0.1), C0 = pt(p0[0], p0[1], 0.75), C1 = pt(p1[0], p1[1], 0.75);
          q4(B.p(WH), A0, A1, C1, C0);
          q4(B.p(WH), [C0[0] - ux*0.28, C0[1], C0[2] - uz*0.28], [C1[0] - ux*0.28, C1[1], C1[2] - uz*0.28], [C1[0] + ux*0.28, C1[1], C1[2] + uz*0.28], [C0[0] + ux*0.28, C0[1], C0[2] + uz*0.28]); }
      }
      for (let y = yb; y <= yt; y += hh) q4(B.p(WH), pt(0, y, 0.1), pt(l, y, 0.1), pt(l, y + 0.45, 0.8), pt(0, y + 0.45, 0.8));
    }
    // the reading-room roof light
    const c = cenP(FP); abox(B.p({c:'#c9d3d9', glow:'#fff0d2', gk:0.45}), c[0] - 14, c[0] + 14, yt, yt + 1.2, c[1] - 10, c[1] + 10);
    // plaza paving and a low parapet on the podium edge
    prism(B.p(PAV), offP(L.pod, 0.6), 6, 6.12, true);
    prism(B.p(STONE), L.pod, 6, 7.1, false);
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'szlibnorth', lat:PLC.szlibnorth.lat, lon:PLC.szlibnorth.lon, rot:PLC.szlibnorth.rot});

// ================= Pingshan Performing Arts Center (OPEN Architecture, completed 2019) =================
// Facts (openarch.com; archdaily 947881): 23 542 m2; an intentionally cubic "drama box" round a 1 200-seat grand theatre; a double
// skin of perforated aluminium V-sections; a winding outdoor public promenade from the ground-floor plaza up to a planted roof
// garden, linking a cafe, black box, rehearsal rooms, an outdoor theatre (north-west corner) and gardens on several levels; the
// fly tower, clad in dark red-toned wood, rises through the roof garden as its backdrop. Footprint: the 84 x 78 m building OSM
// w1258071571 inside the planted area w878478259 named after it. Height (~26 m, fly tower ~36 m) and the skin colour are estimates.
LANDMARKS.szpingshantheatre = {zh:'坪山大剧院', en:'Pingshan Grand Theater', cat:'new', r:75, h:36,
  lt:{m:0, c:'#ffe9cc', k:0.5, e:0.6},
  build(){
    const g = new THREE.Group(), B = mkB(), FP = D.pst.fp, f = oframe(FP);
    const SKIN = {c:'#c4c6c4', m:0, lk:0.45}, SKIN2 = {c:'#b0b3b2', m:0, lk:0.4}, GL = {c:'#4f6170', glow:'#ffd9a6', gk:0.7}, WOOD = {c:'#6e2f26', m:0, lk:0.5, lc:'#ffb37a'},
      GRN = '#5f7a49', PAV = '#a9a397', RAMP = '#b9b4a8', RAIL = '#d7d9d8', LAMP = {c:'#f6e6c8', glow:'#ffd9a0', gk:1.2};
    const P = (u, v) => [f.c[0] + u*f.ux - v*f.uz, f.c[1] + u*f.uz + v*f.ux], hl = f.L/2, hw = f.W/2, H = 26;
    const rect = (u0, u1, v0, v1) => [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)];
    // the box: inner glass volume + the perforated V-section skin (vertical folds in a 1.2 m rhythm, a band of openings per level)
    const IN = rect(-hl + 2.5, hl - 2.5, -hw + 2.5, hw - 2.5); prism(B.p(GL), IN, 0, H - 0.3, false);
    const SK = rect(-hl, hl, -hw, hw);
    for (let i = 0; i < 4; i++){ const a = SK[i], b = SK[(i + 1) % 4], [nx, nz, ux, uz, l] = edgeN(SK, i), n = Math.round(l/1.2);
      for (let k = 0; k < n; k++){ const s0 = k*l/n, s1 = (k + 1)*l/n, sm2 = (s0 + s1)/2;
        // openings: the promenade cuts and ground floor (where the skin stops)
        const cut = (y) => (y < 5.5 && (k % 22 < 8)) || ((i === 0 || i === 3) && Math.abs(y - (6 + (s0/l)*16)) < 3.2);
        for (let y = 0; y < H; y += 2.6){ const y1 = Math.min(H, y + 2.6); if (cut(y + 1.3)) continue;
          const A0 = [a[0] + ux*s0, y, a[1] + uz*s0], A1 = [a[0] + ux*s1, y, a[1] + uz*s1], M0 = [a[0] + ux*sm2 + nx*0.45, y, a[1] + uz*sm2 + nz*0.45];
          q4(B.p(k % 2 ? SKIN : SKIN2), A0, M0, [M0[0], y1, M0[2]], [A0[0], y1, A0[2]]); q4(B.p(k % 2 ? SKIN2 : SKIN), M0, A1, [A1[0], y1, A1[2]], [M0[0], y1, M0[2]]); } }
      // the promenade: a ramp rising along this face (south and west faces), with a rail and lights
      if (i === 0 || i === 3) for (let s = 0; s < l - 4; s += 4){ const y0 = 6 + (s/l)*16 - 1.4, y1 = 6 + ((s + 4)/l)*16 - 1.4, a0 = [a[0] + ux*s, a[1] + uz*s], a1 = [a[0] + ux*(s + 4), a[1] + uz*(s + 4)];
        q4(B.p(RAMP), [a0[0] - nx*0.5, y0, a0[1] - nz*0.5], [a1[0] - nx*0.5, y1, a1[1] - nz*0.5], [a1[0] - nx*3.5, y1, a1[1] - nz*3.5], [a0[0] - nx*3.5, y0, a0[1] - nz*3.5]);
        q4(B.p(RAIL), [a0[0] - nx*0.4, y0 + 1.1, a0[1] - nz*0.4], [a1[0] - nx*0.4, y1 + 1.1, a1[1] - nz*0.4], [a1[0] - nx*0.4, y1 + 1.2, a1[1] - nz*0.4], [a0[0] - nx*0.4, y0 + 1.2, a0[1] - nz*0.4]);
        if (s % 12 === 0) abox(B.p(LAMP), a0[0] - nx*3.2 - 0.15, a0[0] - nx*3.2 + 0.15, y0 + 2.6, y0 + 2.8, a0[1] - nz*3.2 - 0.15, a0[1] - nz*3.2 + 0.15); }
    }
    // roof garden with planting beds, terraces cut into the north-west corner (the outdoor theatre), the wood-clad fly tower
    prism(B.p('#8f9188'), SK, H - 0.3, H, true);
    for (let u = -hl + 5; u < hl - 5; u += 9) for (let v = -hw + 5; v < hw - 5; v += 9){ if (Math.abs(u) < 18 && Math.abs(v) < 16) continue; const c = P(u, v); abox(B.p(GRN), c[0] - 3, c[0] + 3, H, H + 0.8, c[1] - 3, c[1] + 3); }
    for (let k = 0; k < 5; k++){ const R = rect(-hl, -hl + 14 - k*2.4, hw - 16 + k*2.6, hw); prism(B.p(PAV), R, H - 1.8*(5 - k), H - 1.8*(4 - k), true); }
    const FT = rect(-12, 12, -10, 10); prism(B.p(WOOD), FT, H, 36, true);
    for (let i = 0; i < 4; i++){ const a = FT[i], b = FT[(i + 1) % 4], [nx, nz, ux, uz, l] = edgeN(FT, i);
      for (let s = 0.6; s < l; s += 1.2) q4(B.p({c:'#5a2620', m:0, lk:0.45, lc:'#ffb37a'}), [a[0] + ux*s + nx*0.05, H, a[1] + uz*s + nz*0.05], [a[0] + ux*(s + 0.35) + nx*0.05, H, a[1] + uz*(s + 0.35) + nz*0.05], [a[0] + ux*(s + 0.35) + nx*0.05, 36, a[1] + uz*(s + 0.35) + nz*0.05], [a[0] + ux*s + nx*0.05, 36, a[1] + uz*s + nz*0.05]); }
    // plaza round the box
    prism(B.p(PAV), offP(SK, -9), -1.2, 0.12, true);
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'szpingshantheatre', lat:PLC.szpingshantheatre.lat, lon:PLC.szpingshantheatre.lon, rot:PLC.szpingshantheatre.rot});
