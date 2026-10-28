
// ================= Shenzhen North Railway Station (HSR station opened 26 Dec 2011) =================
// Facts (Wikipedia "Shenzhen North railway station"; archello "Shenzhen North Railway Station"): 11 platforms / 20 tracks (nine
// islands, two side platforms); upper-entry / upper-exit through the elevated waiting hall over the tracks; HSR platforms at
// ~90 m above sea, Line 4 / 6 metro platforms at ~106 m, running elevated N-S along the east side under the big roof; the mega roof
// (~400 x 200 m) is double-layered, bands of aluminium and glass, a curving surface running east-west across the whole station and
// joining the two squares, cantilevering ~50 m east as a giant portico that wraps the elevated metro station into the east facade.
// Layout from OSM: station footprint w1212433645 (the 200 x 400 m roof part + the platform canopies along the tracks), metro station
// w370233869, the 20 track stops (railway=stop) give the tracks; columns stand between the tracks of neighbouring islands.
// Heights not published: waiting hall floor +9 m (the elevated passage), metro platforms +16 m (106 - 90 m), roof 27-40 m above the
// platforms and canopies ~13-15 m are estimates. Frame: +x along the tracks (SE), -z = east side (metro, east square), +z = west square.
LANDMARKS.sznorthstation = {zh:'深圳北站', en:'Shenzhen North Railway Station', cat:'new', r:300, h:46,
  lt:{m:0, c:'#fff1dc', k:0.35, e:0.6},
  build(){
    const g = new THREE.Group(), B = mkB(), N = D.ns, G = grid(N.g);
    const CONC = '#a29e96', PLAT = '#c9c4b9', BAL = '#5b5852', RAIL = '#8d9196', YEL = '#c8a032',
      CANT = {c:'#d5d8da', m:0, lk:0.2}, CANU = '#bcc0c3', SKY = {c:'#7f92a1', glow:'#d6e6ff', gk:0.32},
      COL = {c:'#dfe2e2', m:0, lk:0.35}, HGL = {c:'#55697a', glow:'#ffd7a0', gk:0.5}, MUL = '#c7ccd0',
      RAL = {c:'#cdd2d6', m:0, lk:0.22, lc:'#fff0dc'}, RGL = {c:'#596b79', glow:'#ffdcaa', gk:0.75}, FAS = {c:'#e4e6e7', m:0, lk:0.45},
      RUND = '#b5b9bc', MET = {c:'#b3b9be', m:0, lk:0.3}, MGL = {c:'#4d6070', glow:'#cfe4ff', gk:0.6}, LED = {c:'#eef3f6', glow:'#f4f8ff', gk:1.3};
    // rail / platform level: just above the highest ground under the footprint (the station stands on a podium)
    let gmax = -1e9; for (let x = -225; x <= 225; x += 15) for (let z = -200; z <= 200; z += 15) if (pip(N.fp, x, z)) gmax = Math.max(gmax, G(x, z));
    const yR = gmax + 0.3, XH = 102.3, XW = 227;              // hall half length along x; canopy ends
    const zE = -97.6, zW = 164.6;                             // canopy edges (east / west) from the footprint
    // podium (the station deck): walls down into the ground
    prism(B.p(CONC), N.fp, yR - 14, yR, true);
    // tracks and platforms
    const T = N.stops.slice().sort((a, b) => a - b), plats = [], cols = [];
    for (let i = 0; i < T.length - 1; i++){ const gap = T[i + 1] - T[i]; if (gap > 10.5) plats.push([T[i] + 1.9, T[i + 1] - 1.9]); else cols.push((T[i] + T[i + 1])/2); }
    plats.push([T[0] - 10.5, T[0] - 1.9]); plats.push([T[T.length - 1] + 1.9, T[T.length - 1] + 10.5]);
    for (const z of T){ abox(B.p(BAL), -XW + 2, XW - 2, yR, yR + 0.35, z - 1.6, z + 1.6);
      for (const s of [-0.72, 0.72]) abox(B.p(RAIL), -XW + 2, XW - 2, yR + 0.35, yR + 0.55, z + s - 0.05, z + s + 0.05); }
    for (const [z0, z1] of plats){ abox(B.p(PLAT), -XW + 6, XW - 6, yR, yR + 1.25, z0, z1);
      for (const z of [z0 + 0.6, z1 - 0.6]) abox(B.p(YEL), -XW + 6, XW - 6, yR + 1.25, yR + 1.29, z - 0.2, z + 0.2); }
    // column lines across the station: between neighbouring islands' tracks, plus the canopy edges
    const CL = [zE].concat(cols, [zW]).sort((a, b) => a - b);
    // ---- platform canopies (both ends): one shallow vault per bay between column lines, skylight strip on each crown ----
    const yC = yR + 12.8, rise = 2.2;
    for (const sg of [-1, 1]){
      const xa = sg > 0 ? XH : -XW, xb = sg > 0 ? XW : -XH;
      for (let b = 0; b < CL.length - 1; b++){
        const z0 = CL[b], z1 = CL[b + 1], w = z1 - z0, n = 8, Y = t => yC + rise*Math.sin(PI*t), Z = t => z0 + w*t;
        for (let k = 0; k < n; k++){ const ta = k/n, tb = (k + 1)/n, sky = (k === 3 || k === 4);
          q4(B.p(sky ? SKY : CANT), [xa, Y(ta), Z(ta)], [xb, Y(ta), Z(ta)], [xb, Y(tb), Z(tb)], [xa, Y(tb), Z(tb)]);
          if (!sky) q4(B.p(CANU), [xa, Y(ta) - 0.6, Z(ta)], [xa, Y(tb) - 0.6, Z(tb)], [xb, Y(tb) - 0.6, Z(tb)], [xb, Y(ta) - 0.6, Z(ta)]); }
        // the gutter beam on the column line and the vault ends
        abox(B.p(COL), xa, xb, yC - 1.0, yC + 0.15, z0 - 0.5, z0 + 0.5);
        const xe = sg > 0 ? xb : xa; for (let k = 0; k < n; k++){ const ta = k/n, tb = (k + 1)/n; q4(B.p(FAS), [xe, Y(ta) - 0.7, Z(ta)], [xe, Y(tb) - 0.7, Z(tb)], [xe, Y(tb) + 0.05, Z(tb)], [xe, Y(ta) + 0.05, Z(ta)]); }
        // light lines under the vault over the platforms
        abox(B.p(LED), xa + 2, xb - 2, yC - 0.75, yC - 0.6, z0 + w*0.5 - 0.3, z0 + w*0.5 + 0.3);
      }
      abox(B.p(COL), xa, xb, yC - 1.0, yC + 0.15, zW - 0.5, zW + 0.5);
      for (let x = xa + 10; x < xb - 3; x += 21.5) for (const z of CL) seg(B.p(COL), [x, yR, z], [x, yC - 0.9, z], z === zE || z === zW ? 0.45 : 0.55, 8);
    }
    // ---- elevated waiting hall over the tracks (+9 m) on the same column lines ----
    const yH = yR + 9.0;
    abox(B.p(CONC), -XH, XH, yH - 2.2, yH, zE, zW);
    for (let x = -XH + 12; x < XH - 3; x += 21.5) for (const z of cols) { seg(B.p(COL), [x, yR, z], [x, yH - 2.2, z], 0.8, 8); }
    // ---- the mega roof: curving across the station (z), slightly crowned along x; bands of aluminium and glass ----
    const RZ = [[201.5, 27], [150, 33], [60, 39.5], [-30, 37.5], [-117, 36.5], [-165, 37.5], [-201.5, 39]];
    const rz = z => { // Catmull-Rom through RZ (z descending)
      let i = 0; while (i < RZ.length - 2 && z < RZ[i + 1][0]) i++;
      const p0 = RZ[Math.max(0, i - 1)], p1 = RZ[i], p2 = RZ[i + 1], p3 = RZ[Math.min(RZ.length - 1, i + 2)], t = (p1[0] - z)/(p1[0] - p2[0]);
      const t2 = t*t, t3_ = t2*t; return 0.5*((2*p1[1]) + (-p0[1] + p2[1])*t + (2*p0[1] - 5*p1[1] + 4*p2[1] - p3[1])*t2 + (-p0[1] + 3*p1[1] - 3*p2[1] + p3[1])*t3_); };
    const RY = (x, z) => yR + rz(z) + 2.0*(1 - (x/XH)*(x/XH));
    const ZR0 = -201.5, ZR1 = 201.5, nz = 56, ZZ = k => lerp(ZR0, ZR1, k/nz);
    const bands = []; for (let x = -XH; x < XH - 0.1;){ const xa = x, xb = Math.min(XH, x + 10.2); bands.push([xa, xb, 0]); x = xb; if (x < XH - 0.1){ const xc = Math.min(XH, x + 3.4); bands.push([x, xc, 1]); x = xc; } }
    for (const [xa, xb, gl] of bands) for (let k = 0; k < nz; k++){ const za = ZZ(k), zb = ZZ(k + 1);
      const A = [xa, RY(xa, za), za], Bq = [xb, RY(xb, za), za], C = [xb, RY(xb, zb), zb], E = [xa, RY(xa, zb), zb];
      q4(B.p(gl ? RGL : RAL), A, E, C, Bq);
      if (!gl) q4(B.p(RUND), [xa, A[1] - 2.6, za], [xb, Bq[1] - 2.6, za], [xb, C[1] - 2.6, zb], [xa, E[1] - 2.6, zb]);
      else { // glass band: the inner layer shows as a lit soffit strip
        q4(B.p(RGL), [xa, A[1] - 2.6, za], [xb, Bq[1] - 2.6, za], [xb, C[1] - 2.6, zb], [xa, E[1] - 2.6, zb]);
        abox(B.p(FAS), xa - 0.15, xa + 0.15, A[1] - 0.1, A[1] + 0.35, za, zb); } }
    // fascia round the roof edge
    for (const x of [-XH, XH]) for (let k = 0; k < nz; k++){ const za = ZZ(k), zb = ZZ(k + 1); q4(B.p(FAS), [x, RY(x, za) - 2.7, za], [x, RY(x, zb) - 2.7, zb], [x, RY(x, zb) + 0.15, zb], [x, RY(x, za) + 0.15, za]); }
    for (const z of [ZR0, ZR1]) for (let i = 0; i < 24; i++){ const xa = lerp(-XH, XH, i/24), xb = lerp(-XH, XH, (i + 1)/24);
      q4(B.p(FAS), [xa, RY(xa, z) - 2.7, z], [xb, RY(xb, z) - 2.7, z], [xb, RY(xb, z) + 0.15, z], [xa, RY(xa, z) + 0.15, z]); }
    // ---- hall enclosure: glass walls under the roof ----
    const zHe = -117.0, zHw = 192.0;
    const wallZ = (z, y0) => { for (let i = 0; i < 30; i++){ const xa = lerp(-XH + 0.6, XH - 0.6, i/30), xb = lerp(-XH + 0.6, XH - 0.6, (i + 1)/30);
      q4(B.p(HGL), [xa, y0, z], [xb, y0, z], [xb, RY(xb, z) - 2.6, z], [xa, RY(xa, z) - 2.6, z]); } };
    wallZ(zHe, yR); wallZ(zHw, yR);
    for (const x of [-XH + 0.6, XH - 0.6]) for (let k = 0; k < nz; k++){ const za = ZZ(k), zb = ZZ(k + 1); if (zb < zHe || za > zHw) continue;
      const a = Math.max(za, zHe), b = Math.min(zb, zHw), y0a = (a > zE && a < zW) ? yH : yR, y0b = (b > zE && b < zW) ? yH : yR;
      q4(B.p(HGL), [x, y0a, a], [x, y0b, b], [x, RY(x, b) - 2.6, b], [x, RY(x, a) - 2.6, a]); }
    for (let x = -XH + 0.6; x <= XH - 0.5; x += 6.0) for (const z of [zHe, zHw]) abox(B.p(MUL), x - 0.15, x + 0.15, yR, RY(x, z) - 2.6, z - 0.35, z + 0.35);
    for (const x of [-XH + 0.6, XH - 0.6]) for (let z = zHe; z <= zHw; z += 6.0) abox(B.p(MUL), x - 0.35, x + 0.35, (z > zE && z < zW) ? yH : yR, RY(x, z) - 2.6, z - 0.15, z + 0.15);
    for (const z of [zHe, zHw]) for (let y = yR + 9; y < yR + 30; y += 9) abox(B.p(MUL), -XH + 0.6, XH - 0.6, y, y + 0.4, z - 0.4, z + 0.4);
    // west station building between the canopies' west edge and the west facade (ground floor + hall)
    abox(B.p(CONC), -XH + 1, XH - 1, yR, yH, zW + 0.5, zW + 3);
    // ---- the roof's columns: tree columns in the hall and the east portico row ----
    const tree = (x, z, y0, y1) => { seg(B.p(COL), [x, y0, z], [x, y1 - 7, z], 1.1, 10);
      for (const [dx, dz] of [[6, 6], [-6, 6], [6, -6], [-6, -6]]) seg(B.p(COL), [x, y1 - 7.2, z], [x + dx, RY(x + dx, z + dz) - 2.6, z + dz], 0.55, 6); };
    for (const x of [-56, 0, 56]) for (const z of [-62, 12, 86, 160]) tree(x, z, yH, RY(x, z));
    for (const x of [-84, -42, 0, 42, 84]) tree(x, -178, yR, RY(x, -178));
    // ---- elevated metro station (Lines 4 / 6) wrapped under the east part of the roof ----
    const M = N.metro, mb = bbP(M), yM = yR + 13.2;
    for (let x = mb[0] + 8; x < mb[2] - 4; x += 20) for (const z of [mb[1] + 8, (mb[1] + mb[3])/2, mb[3] - 8]) abox(B.p(CONC), x - 1.1, x + 1.1, yR, yM - 1.5, z - 1.1, z + 1.1);
    abox(B.p(CONC), mb[0], mb[2], yM - 1.6, yM, mb[1], mb[3]);
    abox(B.p(MET), mb[0], mb[2], yM, yM + 1.0, mb[1], mb[3]);
    const yMt = yR + 26.5;
    for (const [z0, z1] of [[mb[1], mb[1] + 0.4], [mb[3] - 0.4, mb[3]]]) abox(B.p(MGL), mb[0] + 0.3, mb[2] - 0.3, yM + 1, yMt - 1.5, z0, z1);
    for (const x of [mb[0], mb[2]]) abox(B.p(MGL), x - 0.2, x + 0.2, yM + 1, yMt - 1.5, mb[1], mb[3]);
    for (let x = mb[0]; x <= mb[2]; x += 3.0) for (const z of [mb[1], mb[3]]) abox(B.p(MET), x - 0.6, x + 0.6, yM + 1, yMt - 1.5, z - 0.5, z + 0.5);
    abox(B.p(MET), mb[0] - 1, mb[2] + 1, yMt - 1.5, yMt, mb[1] - 1, mb[3] + 1);
    for (let x = mb[0] + 5; x < mb[2] - 4; x += 10) abox(B.p(LED), x, x + 6, yMt - 1.6, yMt - 1.5, mb[1] + 6, mb[3] - 6);
    // the east concourse at grade under the roof (between the tracks and the metro): entrance box with glass front
    abox(B.p(HGL), -XH + 1, XH - 1, yR, yR + 8.5, zHe + 0.3, zE - 1);
    // ---- night: roof edge light line, lit soffit of the portico ----
    for (const z of [ZR0 + 0.3, ZR1 - 0.3]) for (let i = 0; i < 24; i++){ const xa = lerp(-XH, XH, i/24), xb = lerp(-XH, XH, (i + 1)/24);
      q4(B.p(LED), [xa, RY(xa, z) - 2.75, z], [xb, RY(xb, z) - 2.75, z], [xb, RY(xb, z) - 2.45, z], [xa, RY(xa, z) - 2.45, z]); }
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'sznorthstation', lat:PLC.sznorthstation.lat, lon:PLC.sznorthstation.lon, rot:PLC.sznorthstation.rot});
