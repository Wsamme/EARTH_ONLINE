
// ---------------- Hakka walled-house kit: grey-tiled roofs, white-washed / grey brick walls, corner towers ----------------
const HK = {WALL:{c:'#d9d4c8', m:0, lk:0.55}, WALL2:{c:'#b9b2a4', m:0, lk:0.5}, BRICK:{c:'#8d8a84', m:0, lk:0.45}, ROOF:'#53514d', ROOF2:'#615e58',
  RIDGE:'#3e3c39', BASE:'#9c968a', DOOR:'#3a2c22', WIN:{c:'#2b2723', glow:'#ffb35a', gk:0.55}, LANT:{c:'#c0392b', glow:'#ff7a3a', gk:1.6}, COURT:'#b7b0a2'};
// a building on outline R (any quadrilateral-ish ring): walls to eave e, a roof (gable along its long axis or hip), small windows
function hakkaHouse(B, R, e, rise, kind, wall){
  const f = oframe(R); wall = wall || HK.WALL;
  prism(B.p(HK.BASE), R, -2, 0.6, false);
  prism(B.p(wall), R, 0.6, e, false);
  if (kind === 'hip') hipF(B.p(HK.ROOF), f, e, rise, 0.6); else if (kind === 'flat') flat(B.p(HK.ROOF2), R, e);
  else { gableF(B.p(HK.ROOF), B.p(wall), f, e, rise, 0.55); const P = (u, v, y) => [f.c[0] + u*f.ux - v*f.uz, y, f.c[1] + u*f.uz + v*f.ux];
    seg(B.p(HK.RIDGE), P(-f.L/2 - 0.5, 0, e + rise + 0.1), P(f.L/2 + 0.5, 0, e + rise + 0.1), 0.22, 4); }
  // small high windows (lit at night) along the long walls
  const P = (u, v, y) => [f.c[0] + u*f.ux - v*f.uz, y, f.c[1] + u*f.uz + v*f.ux];
  if (f.L > 6) for (let u = -f.L/2 + 2.5; u < f.L/2 - 1.5; u += 4.2) for (const sv of [-1, 1]){ const v = sv*(f.W/2 + 0.06), y = Math.min(e - 1.2, 3.2);
    q4(B.p(HK.WIN), P(u, v, y), P(u + 0.8, v, y), P(u + 0.8, v, y + 0.9), P(u, v, y + 0.9)); }
  return f;
}
// a corner tower (diaolou-like): square, `fl` storeys of ~3.5 m, small windows / gun slits, hip roof
function hakkaTower(B, R, fl){
  const f = oframe(R), e = 0.6 + fl*3.5; prism(B.p(HK.BASE), R, -2, 0.6, false); prism(B.p(HK.WALL), R, 0.6, e, false);
  const P = (u, v, y) => [f.c[0] + u*f.ux - v*f.uz, y, f.c[1] + u*f.uz + v*f.ux];
  for (let k = 1; k <= fl; k++) for (const [su, sv] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){ const u = su*(f.L/2 + 0.06), v = sv*(f.W/2 + 0.06), y = 0.6 + k*3.5 - 2.2;
    if (su) q4(B.p(HK.WIN), P(u, -0.35, y), P(u, 0.35, y), P(u, 0.35, y + 1.0), P(u, -0.35, y + 1.0)); else q4(B.p(HK.WIN), P(-0.35, v, y), P(0.35, v, y), P(0.35, v, y + 1.0), P(-0.35, v, y + 1.0)); }
  prism(B.p(HK.WALL2), offP(R, -0.25), e - 0.6, e, false);
  hipF(B.p(HK.ROOF), f, e, Math.min(f.L, f.W)*0.32, 0.7);
  return e;
}

// ================= Hehu Xinju, Luoruihe, Longgang (Qing Hakka walled house; Longgang Hakka Folk Museum) =================
// Facts: begun in the Qianlong reign, the main complex completed in Jiaqing 22 (1817) by the Luo family (Luo Ruifeng); ~25 000 m2 in
// all, the walled house itself ~15 000 m2, in three parts: the crescent pond, the threshing ground and the enclosure; two concentric
// enclosures round a central "three halls, two side rows" mansion, the ancestral hall at its heart ("nine courts, eighteen wells,
// ten pavilions and running corridors") (lg.gov.cn; bendibao). Every piece here is an OSM building of the house (58 footprints
// round w1088961704; corner squares = the corner towers); the half-moon pond (OSM w1088961705, drawn by the map) lies in front (+x).
// Storey heights and roof forms are estimates from the Hakka type. Night: warm floodlight and red lanterns at the gates.
LANDMARKS.szhehu = {zh:'鹤湖新居', en:'Hehu Xinju (Longgang Hakka walled house)', cat:'old', r:110, h:16,
  lt:{m:0, c:'#ffc98a', k:0.85, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), H = D.hehu;
    // courtyards / threshing ground: a paved ground slab under the whole house and in front of it
    const allP = []; for (const b of H.b) for (const p of b.r) allP.push(p);
    const bb = bbP(allP);
    abox(B.p(HK.COURT), bb[0] - 1, bb[2] + 1, -1.5, 0.15, bb[1] - 1, bb[3] + 1);
    for (const b of H.b){
      const f = oframe(b.r), asp = f.L/Math.max(1, f.W), c = f.c;
      const corner = b.a < 140 && asp < 1.8 && (Math.abs(c[0]) > bb[2] - 14 || Math.abs(c[1]) > bb[3] - 14);
      if (corner){ hakkaTower(B, b.r, 4); continue; }
      if (b.a < 60){ hakkaHouse(B, b.r, 3.6, 1.4, 'gable'); continue; }
      const outer = Math.abs(c[0]) > bb[2] - 12 || Math.abs(c[1]) > bb[3] - 12;            // the outer enclosure rows: two storeys
      const hall = !outer && Math.abs(c[1]) < 12 && f.W > 7;                                 // halls on the central axis
      if (outer) hakkaHouse(B, b.r, 6.8, 2.2, 'gable', HK.WALL);
      else if (hall) hakkaHouse(B, b.r, 6.2, 2.8, 'gable', HK.WALL2);
      else hakkaHouse(B, b.r, asp > 3 ? 5.6 : 4.8, 1.9, 'gable', asp > 3 ? HK.WALL : HK.WALL2);
    }
    // the main gate on the front (+x) with lanterns
    const gx = bb[2] + 0.5; abox(B.p(HK.DOOR), gx - 0.2, gx + 0.25, 0.6, 4.2, -2.2, 2.2);
    for (const z of [-3.2, 3.2]){ abox(B.p(HK.LANT), gx + 0.6, gx + 1.4, 3.6, 4.6, z - 0.4, z + 0.4); }
    sprites(g, [gx + 1, 4.1, -3.2, gx + 1, 4.1, 3.2], [1, 0.45, 0.2], 3);
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'szhehu', lat:PLC.szhehu.lat, lon:PLC.szhehu.lon, rot:PLC.szhehu.rot});

// ================= Dawan Shiju, Pingshan (Qing Hakka walled house of the Zeng family) =================
// Facts (sz.gov.cn "Shenzhen Story" Dec 2022; eyeshenzhen): built 1763-1791; the main building covers ~15 000 m2; a square "dou"
// shaped castle, symmetrical on a central axis, two walls, one inside the other, with three-storey pavilions (watch towers) at the
// four corners of both walls (eight in all); more than 400 rooms; a moon pond in front. Footprint OSM w784652604; the pond OSM
// w784652605 (drawn by the map) lies west of it, so the front and the axis face -x. Ring widths, storey heights and the hall
// layout inside are estimates from the type.
LANDMARKS.szdawan = {zh:'大万世居', en:'Dawan Shiju (Pingshan Hakka walled house)', cat:'old', r:95, h:17,
  lt:{m:0, c:'#ffc98a', k:0.85, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), FP = D.dawan.fp;
    abox(B.p(HK.COURT), -64, 70, -1.5, 0.15, -61, 59);
    // outer enclosure: a ring of two-storey rooms 9 m deep, roofs pitched inward from a tall outer wall
    const ring = (P, d, e, wall) => { const I = offP(P, d);
      for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], c = I[(i + 1) % P.length], dd = I[i];
        // walls
        q4(B.p(wall), [a[0], 0.6, a[1]], [b[0], 0.6, b[1]], [b[0], e + 1.2, b[1]], [a[0], e + 1.2, a[1]]);
        q4(B.p(HK.WALL2), [dd[0], 0.6, dd[1]], [c[0], 0.6, c[1]], [c[0], e - 1.2, c[1]], [dd[0], e - 1.2, dd[1]]);
        // single-pitch roof falling inward
        q4(B.p(HK.ROOF), [a[0], e + 1.2, a[1]], [b[0], e + 1.2, b[1]], [c[0], e - 1.2, c[1]], [dd[0], e - 1.2, dd[1]]);
        // windows on the inner face
        const [nx, nz, ux, uz, l] = edgeN(I, i);
        for (let s = 3; s < l - 3; s += 4.5){ const x = dd[0] + ux*s - nx*0.06, z = dd[1] + uz*s - nz*0.06;
          q4(B.p(HK.WIN), [x, 2.4, z], [x + ux*0.9, 2.4, z + uz*0.9], [x + ux*0.9, 3.4, z + uz*0.9], [x, 3.4, z]);
          q4(B.p(HK.WIN), [x, 5.4, z], [x + ux*0.9, 5.4, z + uz*0.9], [x + ux*0.9, 6.2, z + uz*0.9], [x, 6.2, z]); } }
      return I; };
    const P0 = FP, I0 = ring(P0, 9, 7.6, HK.BRICK);
    const P1 = offP(P0, 21), I1 = ring(P1, 7, 6.8, HK.WALL);
    // eight three-storey corner towers: at the corners of both rings
    const corners = (P) => { const out = []; for (let i = 0; i < P.length; i++){ const a = P[(i + P.length - 1) % P.length], b = P[i], c = P[(i + 1) % P.length];
      const t1 = Math.atan2(b[1] - a[1], b[0] - a[0]), t2 = Math.atan2(c[1] - b[1], c[0] - b[0]); let d = Math.abs(t2 - t1); if (d > PI) d = TAU - d; if (d > 0.6) out.push(b); } return out; };
    const tw = (p, s) => { const cx = p[0], cz = p[1], c = cenP(P0), dx = c[0] - cx, dz = c[1] - cz, l = Math.hypot(dx, dz), x = cx + dx/l*s*0.7, z = cz + dz/l*s*0.7;
      return [[x - s/2, z - s/2], [x + s/2, z - s/2], [x + s/2, z + s/2], [x - s/2, z + s/2]]; };
    const C0 = corners(P0).slice(0, 4), C1 = corners(P1).slice(0, 4);
    for (const p of C0) hakkaTower(B, tw(p, 9), 3);
    for (const p of C1) hakkaTower(B, tw(p, 7.5), 3);
    // the central axis (-x = front): gate hall, middle hall, ancestral hall, with side rows between the inner ring and the halls
    const halls = [[-30, 12, 22, 6.4], [-8, 14, 24, 7.2], [16, 15, 24, 8.2]];
    for (const [u, L, W, e] of halls) hakkaHouse(B, [[u - L/2, -W/2], [u + L/2, -W/2], [u + L/2, W/2], [u - L/2, W/2]], e, 2.6, 'gable', HK.WALL2);
    for (const sv of [-1, 1]) for (let u = -38; u < 30; u += 17){ const v0 = sv*16, v1 = sv*24; hakkaHouse(B, [[u, Math.min(v0, v1)], [u + 15, Math.min(v0, v1)], [u + 15, Math.max(v0, v1)], [u, Math.max(v0, v1)]], 4.8, 1.8, 'gable'); }
    // the front gate (west wall) with lanterns
    const fx = Math.min(...FP.map(p => p[0])) - 0.3;
    abox(B.p(HK.DOOR), fx - 0.3, fx + 0.2, 0.6, 4.6, -2.4, 2.4);
    for (const z of [-3.4, 3.4]) abox(B.p(HK.LANT), fx - 1.4, fx - 0.6, 4.0, 5.0, z - 0.4, z + 0.4);
    sprites(g, [fx - 1, 4.5, -3.4, fx - 1, 4.5, 3.4], [1, 0.45, 0.2], 3);
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'szdawan', lat:PLC.szdawan.lat, lon:PLC.szdawan.lon, rot:PLC.szdawan.rot});
