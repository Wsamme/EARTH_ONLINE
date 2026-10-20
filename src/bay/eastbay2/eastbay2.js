// ===== bay/eastbay2: East Bay landmarks for the San Francisco Bay Area 1:1 map (City Brush v29) =====
// Cathedral of Christ the Light, Ronald V. Dellums Federal Building, Claremont Hotel, USS Hornet museum, Treasure Island
// Building One, Sunol Water Temple, Mission San Jose. Every model is built in a frame aligned with its real OSM footprint
// (plans below are in that frame, metres); the SG_PLACES rot turns the frame onto the map. Block-scoped: only LANDMARKS and
// SG_PLACES are touched. No text, insignia or hull numbers anywhere.
{
const PI = Math.PI, HP = PI/2, TAU = PI*2;
// ---------- batching helpers: many small parts -> one LTris call per material ----------
function TB(){
  const a = [];
  const q4 = (p, q, r, s) => { a.push(p[0], p[1], p[2], q[0], q[1], q[2], r[0], r[1], r[2], p[0], p[1], p[2], r[0], r[1], r[2], s[0], s[1], s[2]); };
  const T = {a,
    tri(p, q, r){ a.push(p[0], p[1], p[2], q[0], q[1], q[2], r[0], r[1], r[2]); },
    quad(p, q, r, s){ q4(p, q, r, s); },
    // closed box w (x) * h (y) * d (z), bottom centre at x, y, z, turned by ry about y
    box(w, h, d, x, y, z, ry){
      const c = Math.cos(ry || 0), s = Math.sin(ry || 0), P = (u, v, t) => [x + u*c + t*s, y + v, z - u*s + t*c];
      const hw = w/2, hd = d/2, A = P(-hw, 0, -hd), B = P(hw, 0, -hd), C = P(hw, 0, hd), D = P(-hw, 0, hd), E = P(-hw, h, -hd), F = P(hw, h, -hd), G = P(hw, h, hd), H = P(-hw, h, hd);
      q4(E, H, G, F); q4(A, B, C, D); q4(D, C, G, H); q4(B, A, E, F); q4(C, B, F, G); q4(A, D, H, E);
    },
    // box between two plan points (x, z) with width w, from y0 to y1
    seg(x0, z0, x1, z1, w, y0, y1){ const L = Math.hypot(x1 - x0, z1 - z0); if (L < 1e-3) return; T.box(L, y1 - y0, w, (x0 + x1)/2, y0, (z0 + z1)/2, -Math.atan2(z1 - z0, x1 - x0)); },
    // prism between two 3-D points (square section w), for struts / masts / members
    beam(p, q, w){
      const dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2], L = Math.hypot(dx, dy, dz); if (L < 1e-4) return;
      let ux = dx/L, uy = dy/L, uz = dz/L, ax = Math.abs(uy) < 0.9 ? 0 : 1, ay = Math.abs(uy) < 0.9 ? 1 : 0;
      let sx = uy*0 - uz*ay, sy = uz*ax - ux*0, sz = ux*ay - uy*ax; const sl = Math.hypot(sx, sy, sz); sx /= sl; sy /= sl; sz /= sl;
      const tx = uy*sz - uz*sy, ty = uz*sx - ux*sz, tz = ux*sy - uy*sx, h = w/2;
      const C = (o, s1, s2) => [o[0] + (sx*s1 + tx*s2)*h, o[1] + (sy*s1 + ty*s2)*h, o[2] + (sz*s1 + tz*s2)*h];
      const A = [C(p, -1, -1), C(p, 1, -1), C(p, 1, 1), C(p, -1, 1)], B = [C(q, -1, -1), C(q, 1, -1), C(q, 1, 1), C(q, -1, 1)];
      for (let i = 0; i < 4; i++){ const j = (i + 1) % 4; q4(A[i], A[j], B[j], B[i]); }
    },
    // vertical quad on the wall line p0 -> p1 ([x, z]) pushed out by off along n, from u0..u1 (0-1 along) and y0..y1
    wq(p0, p1, n, off, u0, u1, y0, y1){
      const x0 = p0[0] + (p1[0] - p0[0])*u0 + n[0]*off, z0 = p0[1] + (p1[1] - p0[1])*u0 + n[1]*off, x1 = p0[0] + (p1[0] - p0[0])*u1 + n[0]*off, z1 = p0[1] + (p1[1] - p0[1])*u1 + n[1]*off;
      q4([x0, y0, z0], [x1, y0, z1], [x1, y1, z1], [x0, y1, z0]);
    },
    out(g, col){ if (a.length) LTris(g, a, col); a.length = 0; }};
  return T;
}
// outward unit normal of the edge p0 -> p1 of a polygon whose centre is (cx, cz)
const nrm = (p0, p1, cx, cz) => { let nx = p1[1] - p0[1], nz = -(p1[0] - p0[0]); const L = Math.hypot(nx, nz) || 1; nx /= L; nz /= L;
  const mx = (p0[0] + p1[0])/2 - cx, mz = (p0[1] + p1[1])/2 - cz; if (nx*mx + nz*mz < 0){ nx = -nx; nz = -nz; } return [nx, nz]; };
const cen = P => { let x = 0, z = 0; for (const p of P){ x += p[0]; z += p[1]; } return [x/P.length, z/P.length]; };
// signed-area orientation helper and an outward normal that uses the polygon winding (works for concave plans)
const area2 = P => { let s = 0; for (let i = 0; i < P.length; i++){ const p = P[i], q = P[(i + 1) % P.length]; s += p[0]*q[1] - q[0]*p[1]; } return s; };
const onrm = (P, e) => { const p0 = P[e], p1 = P[(e + 1) % P.length], s = area2(P) > 0 ? 1 : -1; let nx = (p1[1] - p0[1])*s, nz = -(p1[0] - p0[0])*s; const L = Math.hypot(nx, nz) || 1; return [nx/L, nz/L]; };
// window grid on every edge of a plan polygon (outward by winding): floors from y0 every fh (n floors), bays ~bw, window ww x wh
function winsP(P, y0, fh, n, bw, ww, wh, D, L, pLit, skip){
  const r = LMCTX.rng;
  for (let e = 0; e < P.length; e++){
    if (skip && skip(e)) continue;
    const p0 = P[e], p1 = P[(e + 1) % P.length], len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]); if (len < bw*0.75) continue;
    const nb = Math.max(1, Math.round(len/bw)), n2 = onrm(P, e), hu = Math.min(0.45, ww/len/2*nb)/nb;
    for (let f = 0; f < n; f++) for (let b = 0; b < nb; b++){
      const u = (b + 0.5)/nb, y = y0 + f*fh + (fh - wh)*0.55;
      (r() < (pLit === undefined ? 0.3 : pLit) ? L : D).wq(p0, p1, n2, 0.07, u - hu, u + hu, y, y + wh);
    }
  }
}
// app base and ground (local y) at runtime when the app's terrain is there (hC); fall back to offline values otherwise
function e2Base(lat, lon, r){
  if (typeof hC !== 'function') return null;
  const w = typeof sgXY === 'function' ? sgXY(lat, lon) : [(lon + 122.19)*88300, (lat - 37.625)*110989];
  let hi = -Infinity; for (let a = 0; a < 12; a++) for (const f of [0, 0.35, 0.7]) hi = Math.max(hi, hC(w[0] + Math.cos(a/12*TAU)*r*f, w[1] + Math.sin(a/12*TAU)*r*f));
  return {top:hi + 0.6, gy:(rot, lx, lz) => { const c = Math.cos(rot), s = Math.sin(rot), wx = lx*c + lz*s, wz = -lx*s + lz*c; return hC(w[0] + wx, w[1] - wz) - hi - 0.6; }};
}
// outlines (x-y plane) for LShape: round-headed opening
const rA = (hw, ht, n) => { const P = [[-hw, 0], [hw, 0], [hw, ht - hw]]; for (let i = 1; i < n; i++){ const a = PI*i/n; P.push([Math.cos(a)*hw, ht - hw + Math.sin(a)*hw]); } P.push([-hw, ht - hw]); return P; };
const E2P = {};          // placements (lat, lon, rot) per key

// =====================================================================================================================
// Cathedral of Christ the Light (2008, Craig W. Hartman / SOM), Lake Merritt, Oakland: a vesica-piscis vessel of
// glass-veiled Douglas-fir ribs, 41 m (136 ft) high. Each long side is a conical shell (straight sloping outer ribs, 13 a
// side) over an arc of a circle centred beyond the other side; the two shells meet at the ends in recessed, pointed
// "truncated vesica" windows - the Omega window (the 58 ft image of Christ in perforated aluminium, here abstract light)
// towards Grand Avenue and the Alpha window over the entrance; a vesica oculus crowns it. Concrete reliquary walls form the
// base, on the raised plaza (Peter Walker) over the mausoleum and conference centre, with the chancery and the pavilion.
// Frame: +x along the cathedral's axis towards 21st Street (SSE), +z towards Harrison Street (WSW); the cathedral's
// centre is at (-39, -21) from the origin (the middle of the whole site); plans from the real OSM outlines.
// =====================================================================================================================
E2P.oakcathedral = {lat:37.810168, lon:-122.263195, rot:-1.20005};
LANDMARKS.oakcathedral = {zh:'基督之光主教座堂', en:'Cathedral of Christ the Light', cat:'new', r:92, h:42,
  lt:{m:0, c:'#fff0d8', k:0.5, e:0.6}, build(){
  const g0 = new THREE.Group(), g = new THREE.Group(), r = LMCTX.rng, P = E2P.oakcathedral;
  g.position.set(-39, 0, -21); g0.add(g);
  const B = e2Base(P.lat, P.lon, 92), gy0 = B ? B.gy(P.rot, 0, 0) : -4.2;
  const PL = gy0 + 3.8;                                   // plaza level (3.8 m above the streets)
  const CON = '#c5c0b6', CON2 = '#b3ada3', PAV = '#d8d3c8', SH = {c:'#d6dde0', glow:'#ffe6bf', gk:0.22};
  const RIB = '#a9b2b6', OM = {c:'#bdb6a4', glow:'#ffd790', gk:0.9}, AL = {c:'#aebcc2', glow:'#ffe4b8', gk:0.5};
  const OC = {c:'#9fb4bd', glow:'#fff0d0', gk:0.5}, GL = {c:'#7f98a2', glow:'#ffe0b0', gk:0.45}, GLW = {c:'#2f3a42', m:1, fh:4.2, cw:1.8};
  // ---- the raised plaza over the mausoleum / conference centre (the real complex outline) ----
  const SITE = [[84.6, 91.2], [-12.7, 26.8], [-11.7, 25.1], [-24.6, 16.5], [-30.1, 11.0], [-33.0, 6.7], [-33.8, 0.5], [-32.4, -10.4], [-6.5, -48.3], [37.7, -15.2],
    [40.7, -10.5], [43.0, -2.2], [53.0, 3.8], [108.1, 39.7], [104.6, 44.7], [112.3, 49.8]];
  LPoly(g, SITE, PL - 9, 9, CON2);
  LPoly(g, SITE.map(p => [p[0], p[1]]), PL - 0.02, 0.06, PAV);
  const pw = TB(), dk = TB();
  // parapet / balustrade round the plaza edge and a band of mausoleum windows below it
  for (let e = 0; e < SITE.length; e++){
    const p0 = SITE[e], p1 = SITE[(e + 1) % SITE.length], n2 = onrm(SITE, e), L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    pw.seg(p0[0], p0[1], p1[0], p1[1], 0.5, PL, PL + 1.1);
    if (L > 12) for (let t = 4; t < L - 4; t += 6) dk.wq(p0, p1, n2, 0.06, t/L, (t + 3.6)/L, PL - 3.2, PL - 1.0);
  }
  // ---- chancery (13.4 m, three storeys) and the glass pavilion on the plaza ----
  const CH = [[84.6, 91.2], [70.9, 81.9], [92.8, 49.1], [106.5, 58.4]];
  LPoly(g, CH, PL - 1, gy0 + 13.4 - PL + 1, PAV);
  const cw = TB(); winsP(CH, PL + 0.5, 3.4, 3, 2.4, 1.9, 2.5, cw, cw, 0); cw.out(g, GLW);
  LPoly(g, CH.map(p => [p[0] + (p[0] > 90 ? 0.4 : -0.4), p[1]]), gy0 + 13.4, 0.5, CON);
  const PV = [[42.8, 63.7], [18.8, 47.7], [26.4, 36.3], [50.3, 52.3]];
  LPoly(g, PV, PL, 3.0, GL); LPoly(g, PV.map(p => [p[0] + (p[0] - 34.6)*0.06, p[1] + (p[1] - 50)*0.06]), PL + 3.0, 0.45, CON);
  // ---- the cathedral: vesica plan, conical side shells, pointed end windows, oculus ----
  const R0 = 37.8, ZC = 15.8, RT = 19.6, H = 35.5, Y0 = PL + 4.6, XC = 18.1, KV = 1.04;     // base radius, centre offset, top radius, shell height
  const NH = 14, NA = 22;
  const lim = z => XC + KV*Math.abs(z);                                                        // the V notch planes at the ends
  // arc (side s) at height h: points phi in [-pm, pm]; x = R sin(phi), z = s*(R cos(phi) - ZC)
  const arc = (h, s) => {
    const R = R0 - (R0 - RT)*h/H, f = ph => Math.abs(R*Math.sin(ph)) - lim(R*Math.cos(ph) - ZC);
    let a = 0, b = Math.acos(Math.min(1, ZC/R));                                               // tip where z = 0
    if (f(b) <= 0) return {R, pm:b, cut:false};
    for (let i = 0; i < 40; i++){ const m = (a + b)/2; if (f(m) > 0) b = m; else a = m; }
    return {R, pm:(a + b)/2, cut:true};
  };
  const pt = (h, s, R, ph) => [R*Math.sin(ph), Y0 + h, s*(R*Math.cos(ph) - ZC)];
  const sh = [], rb = TB(), lv = TB(), om = TB(), al = TB();
  const rows = []; for (let i = 0; i <= NH; i++){ const h = H*i/NH; rows.push([h, arc(h, 1)]); }
  for (const s of [-1, 1]){
    for (let i = 0; i < NH; i++){
      const [h0, A0] = rows[i], [h1, A1] = rows[i + 1];
      for (let k = 0; k < NA; k++){
        const t0 = -1 + 2*k/NA, t1 = -1 + 2*(k + 1)/NA;
        const p00 = pt(h0, s, A0.R, A0.pm*t0), p01 = pt(h0, s, A0.R, A0.pm*t1), p10 = pt(h1, s, A1.R, A1.pm*t0), p11 = pt(h1, s, A1.R, A1.pm*t1);
        sh.push(...p00, ...p01, ...p11, ...p00, ...p11, ...p10);
      }
      // 13 outer ribs a side (straight, sloping), and the horizontal louvre lines
      for (let k = 0; k < 13; k++){
        const t = -1 + 2*(k + 0.5)/13, a = pt(h0, s, A0.R + 0.25, A0.pm*t), b = pt(h1, s, A1.R + 0.25, A1.pm*t);
        const da = 0.32/A0.R, db = 0.28/A1.R;
        rb.quad(pt(h0, s, A0.R + 0.25, A0.pm*t - da), pt(h0, s, A0.R + 0.25, A0.pm*t + da), pt(h1, s, A1.R + 0.25, A1.pm*t + db), pt(h1, s, A1.R + 0.25, A1.pm*t - db));
      }
    }
    for (let j = 1; j < 3*NH; j++){
      const h = H*j/(3*NH), A = arc(h, 1);
      for (let k = 0; k < NA; k++){ const t0 = -1 + 2*k/NA, t1 = -1 + 2*(k + 1)/NA, a = pt(h, s, A.R + 0.12, A.pm*t0), b = pt(h, s, A.R + 0.12, A.pm*t1);
        lv.quad(a, b, [b[0], b[1] + 0.16, b[2]], [a[0], a[1] + 0.16, a[2]]); }
    }
  }
  LTris(g, sh, SH);
  rb.out(g, RIB); lv.out(g, '#e6ebec');
  // end windows: the V-shaped recesses between the shell ends (pointed "truncated vesicae"); -x = Omega (Grand Avenue)
  for (let i = 0; i < NH; i++){
    const [h0, A0] = rows[i], [h1, A1] = rows[i + 1]; if (!A0.cut) continue;
    for (const e of [-1, 1]){
      const T = e < 0 ? om : al;
      const q0 = pt(h0, 1, A0.R, e*A0.pm), q1 = pt(h1, 1, A1.R, e*A1.pm), c0 = [e*XC, Y0 + h0, 0], c1 = [e*XC, Y0 + h1, 0];
      if (!A1.cut){ c1[0] = e*Math.sqrt(A1.R*A1.R - ZC*ZC); q1[0] = c1[0]; q1[2] = 0; }
      for (const s of [-1, 1]) T.quad([q0[0], q0[1], s*q0[2]], c0, c1, [q1[0], q1[1], s*q1[2]]);
    }
  }
  om.out(g, OM); al.out(g, AL);
  // mullions on the end windows
  const mw = TB();
  for (const e of [-1, 1]) for (let i = 0; i < NH; i++){ const [h0, A0] = rows[i]; if (!A0.cut) continue; const q0 = pt(h0, 1, A0.R, e*A0.pm);
    for (const s of [-1, 1]) mw.beam([q0[0] - e*0.1, q0[1], s*q0[2]], [e*XC - e*0.1, q0[1], 0], 0.18); }
  mw.out(g, RIB);
  // the oculus at the top: a vesica skylight ringed by a rim
  const AT = rows[NH][1], top = [], ring = TB();
  for (const s of [-1, 1]) for (let k = 0; k < NA; k++){ const a = pt(H, s, AT.R, AT.pm*(-1 + 2*k/NA)), b = pt(H, s, AT.R, AT.pm*(-1 + 2*(k + 1)/NA)); top.push(0, Y0 + H + 0.9, 0, ...a, ...b);
    ring.quad(a, b, [b[0], b[1] + 1.0, b[2]], [a[0], a[1] + 1.0, a[2]]); }
  LTris(g, top.map((v, i) => i % 3 === 1 ? v + 0.6 : v), OC); ring.out(g, RIB);
  // concrete reliquary walls: the base of the vessel (plan = the shell's base arcs, cut by the V notches)
  const A0 = rows[0][1], base = [];
  for (let k = 0; k <= NA; k++){ const p = pt(0, 1, A0.R + 0.7, A0.pm*(1 - 2*k/NA)); base.push([p[0], p[2]]); }
  base.push([-XC - 0.7, 0]);
  for (let k = 0; k <= NA; k++){ const p = pt(0, -1, A0.R + 0.7, A0.pm*(-1 + 2*k/NA)); base.push([p[0], p[2]]); }
  base.push([XC + 0.7, 0]);
  LPoly(g, base, PL - 0.5, Y0 - PL + 0.5, CON);
  // the low entrance / chapel wings in the end notches (3.8 m parts)
  for (const e of [-1, 1]) LPoly(g, [[e*18.1, 0], [e*28.6, 9.7], [e*31.4, 4.6], [e*31.8, 0.4], [e*31.3, -4.0], [e*29.4, -9.0]], PL - 0.2, 3.6, CON2);
  pw.out(g, PAV); dk.out(g, {c:'#2c3338', glow:'#ffe0b0', gk:0.3});
  // the plaza garden: a row of olive trees
  const tr = TB(), tl = TB();
  for (let k = 0; k < 9; k++){ const x = 48 + k*6.2, z = 22 + k*3.8; tr.box(0.4, 2.6, 0.4, x, PL, z, 0); tl.box(3.2, 2.4, 3.2, x, PL + 2.2, z, 0.5); }
  tr.out(g, '#6b5a48'); tl.out(g, '#7d9068');
  return g0; }};

// =====================================================================================================================
// Ronald V. Dellums Federal Building (1993, Kaplan McLaughlin Diaz), 1301 Clay Street, Oakland: two identical 18-storey
// towers (81.7 m to the roof, 100 m with the spires) with chamfered corners, buff stone and punched windows, set-back tops and
// pyramid roofs that echo the Alameda County Courthouse; three-storey podiums (one holds the federal courthouse), a glass
// rotunda between them on the 13th Street walk and a sky bridge high above it.
// Frame: +x along 14th Street (ESE), +z towards 12th Street (SSW); the rotunda at the origin; plans from the real OSM parts.
// =====================================================================================================================
E2P.oakfederal = {lat:37.804898, lon:-122.274823, rot:-0.45884};
LANDMARKS.oakfederal = {zh:'罗纳德·V·德勒姆斯联邦大楼', en:'Ronald V. Dellums Federal Building', cat:'new', r:96, h:100,
  lt:{m:0, c:'#ffe9cc', k:0.4, e:0.35}, build(){
  const g = new THREE.Group(), r = LMCTX.rng;
  const ST = '#e0d4c0', ST2 = '#d0c2ab', DKS = '#b3a48c', RFG = {c:'#71877f', lc:'#e8f0e8', lk:0.5}, MT = '#9aa0a4';
  const WIN = {c:'#4a5560', m:1, fh:4.4, cw:1.7}, GLS = {c:'#9cc0cc', glow:'#ffe2b0', gk:0.55, op:0.62}, MUL = '#d6d8d6';
  const TN = [[-23.9, -22.1], [-23.9, -50.7], [-11.1, -60.9], [15.5, -60.6], [25.0, -52.2], [25.3, -22.7], [14.8, -12.2], [-13.7, -12.0]];
  const TS = [[-23.5, 21.7], [-14.9, 12.0], [14.8, 12.1], [24.9, 22.6], [24.8, 50.8], [14.1, 60.5], [-15.4, 60.9], [-23.9, 51.5]];
  const PN = [[-23.9, -50.7], [-24.0, -70.1], [29.1, -70.0], [29.2, -65.6], [37.0, -65.6], [37.0, -69.7], [56.6, -70.0], [56.6, -66.0], [60.7, -66.1], [61.2, -45.5],
    [57.0, -45.3], [57.2, -41.4], [37.4, -40.9], [37.4, -44.9], [25.3, -44.6], [25.0, -52.2], [15.5, -60.6], [-11.1, -60.9]];
  const PS = [[-24.0, 69.4], [-23.9, 51.5], [-15.4, 60.9], [14.1, 60.5], [24.8, 50.8], [25.1, 40.5], [64.3, 40.2], [63.8, 69.9]];
  const PM = [[-23.9, -11.7], [-23.9, -22.1], [-13.7, -12.0]], PM2 = [[-23.5, 21.7], [-23.4, 12.2], [-14.9, 12.0]];
  const inset = (P, d) => { const [cx, cz] = cen(P); return P.map(p => { const dx = p[0] - cx, dz = p[1] - cz, L = Math.hypot(dx, dz); return [p[0] - dx/L*d, p[1] - dz/L*d]; }); };
  const wd = TB(), st = TB(), bd = TB();
  for (const T of [TN, TS]){
    LPoly(g, T, -5, 81, ST);
    const T2 = inset(T, 1.6); LPoly(g, T2, 76, 5.7, ST2);
    const [cx, cz] = cen(T);
    // floor bands and corner piers
    for (let y = 13.4; y < 76; y += 4.4) for (let e = 0; e < T.length; e++){ const n2 = onrm(T, e); st.wq(T[e], T[(e + 1) % T.length], n2, 0.12, 0, 1, y - 0.5, y); }
    for (const p of T){ const dx = p[0] - cx, dz = p[1] - cz, L = Math.hypot(dx, dz); st.box(2.0, 76.6, 2.0, p[0] + dx/L*0.3, -0.5, p[1] + dz/L*0.3, Math.atan2(dz, dx)); }
    winsP(T, 13.4, 4.4, 14, 3.1, 1.7, 2.7, wd, wd, 0);
    winsP(T2, 76.4, 5.3, 1, 3.6, 2.2, 3.6, wd, wd, 0);
    // cornices at the set-back and the roof line
    LPoly(g, inset(T, -0.6), 75.6, 1.0, DKS); LPoly(g, inset(T2, -0.7), 81.2, 0.9, DKS);
    // the pyramid roof over the octagon (to 93 m) and its spire (to 100 m)
    const R = inset(T2, -0.4), ap = [cx, 95.5, cz], pos = [];
    for (let i = 0; i < R.length; i++){ const a = R[i], b = R[(i + 1) % R.length]; pos.push(a[0], 82.1, a[1], b[0], 82.1, b[1], ...ap); }
    LTris(g, pos, RFG);
    LCyl(g, 0.8, 1.5, 2.6, cx, 93.6, cz, MT, 8); LCyl(g, 0.12, 0.6, 4.8, cx, 96.0, cz, MT, 8);
    LBox(g, 0.4, 0.4, 0.4, cx, 100.7, cz, {c:'#b02020', glow:'#ff2a1a', gk:2});
  }
  wd.out(g, WIN); st.out(g, DKS);
  // podiums (three storeys, 13.4 m): stone base, window band, cornice
  const pw = TB(), pd = TB();
  for (const P of [PN, PS, PM, PM2]){
    LPoly(g, P, -5, 18.4, ST2); LPoly(g, inset(P, -0.4), 13.0, 0.8, DKS);
    winsP(P, 0.6, 4.2, 3, 3.2, 2.2, 2.9, pw, pw, 0, e => { const p0 = P[e], p1 = P[(e + 1) % P.length]; return Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) < 6; });
  }
  pw.out(g, {c:'#3d4852', m:1, fh:4.2, cw:2.0});
  // the glass rotunda on the 13th Street walk: drum of glass between stone piers, a ribbed glass dome
  const RR = 12.3, RH = 21;
  LCyl(g, RR, RR, RH, 0, 0, 0, GLS, 32);
  const mu = TB();
  for (let i = 0; i < 24; i++){ const a = i/24*TAU; mu.box(0.45, RH, 0.6, Math.cos(a)*(RR + 0.1), 0, Math.sin(a)*(RR + 0.1), -a); }
  for (let y = 4.4; y < RH; y += 4.2){ const pts = []; for (let i = 0; i < 32; i++){ const a0 = i/32*TAU, a1 = (i + 1)/32*TAU; mu.seg(Math.cos(a0)*(RR + 0.15), Math.sin(a0)*(RR + 0.15), Math.cos(a1)*(RR + 0.15), Math.sin(a1)*(RR + 0.15), 0.35, y, y + 0.35); } }
  for (let i = 0; i < 32; i++){ const a0 = i/32*TAU, a1 = (i + 1)/32*TAU; mu.seg(Math.cos(a0)*(RR + 0.3), Math.sin(a0)*(RR + 0.3), Math.cos(a1)*(RR + 0.3), Math.sin(a1)*(RR + 0.3), 1.0, RH - 0.2, RH + 1.0); }
  for (let i = 0; i < 16; i++){ const a = i/16*TAU; mu.beam([Math.cos(a)*RR, RH + 0.9, Math.sin(a)*RR], [Math.cos(a)*RR*0.55, RH + 4.6, Math.sin(a)*RR*0.55], 0.35); mu.beam([Math.cos(a)*RR*0.55, RH + 4.6, Math.sin(a)*RR*0.55], [0, RH + 6.2, 0], 0.3); }
  mu.out(g, MUL);
  LLathe(g, [[RR, RH + 0.9], [RR*0.55, RH + 4.6], [0.01, RH + 6.2]], 0, 0, 0, GLS, 32);
  // sky bridge between the towers (38.4 - 45.4 m), above the rotunda
  bd.box(3.8, 7.0, 24.4, 0, 38.4, 0, 0); bd.out(g, ST2);
  const bg = TB(); for (const s of [-1, 1]) bg.quad([s*1.95, 39.6, -12], [s*1.95, 39.6, 12], [s*1.95, 44.2, 12], [s*1.95, 44.2, -12]); bg.out(g, {c:'#5a6a74', glow:'#ffe2b0', gk:0.4});
  return g; }};

// =====================================================================================================================
// Claremont Hotel (1915, Charles W. Dickey; now Claremont Club & Spa): the huge white Tudor-Revival wooden hotel on the
// Berkeley-Oakland hills, 279 rooms, six-storey ranges under steep dark gabled roofs with cross gables and dormers, and the
// 49 m (160 ft) central tower with its four gables, steep pyramid roof and cupola facing the Bay. The hillside rises ~15 m
// from the front lawn to the back, so every range has its own floor level and white foundation walls down the slope.
// Frame: +x along the main (south-west) front, +z = the front (towards the Bay); built from the real OSM outline.
// =====================================================================================================================
E2P.claremont = {lat:37.859455, lon:-122.24208, rot:-0.83827};
// offline ground (local y, rel. to the app base) for the fallback when the app terrain is not there
const CL_G = [[36, 45, -21.5], [0, 49, -25.1], [74, 49, -18.5], [36, 30, -19.5], [36, 10, -16.6], [36, -25, -10.0], [0, 0, -18.8], [-30, -15, -18.9],
  [-60, -20, -19.7], [-85, -30, -19.2], [60, -15, -9.7], [70, 20, -14.8], [-20, -35, -15.5], [-60, -40, -17.7], [66, 10, -14.0], [27, -20, -10.8]];
LANDMARKS.claremont = {zh:'克莱蒙特酒店', en:'Claremont Hotel (Claremont Club & Spa)', cat:'old', r:100, h:36,
  lt:{m:0, c:'#fff2dc', k:0.78, e:0.5}, build(){
  const g = new THREE.Group(), r = LMCTX.rng, P = E2P.claremont;
  const B = e2Base(P.lat, P.lon, 100);
  const gy = (x, z) => { if (B) return B.gy(P.rot, x, z); let bw = 0, bv = 0; for (const [a, b, v] of CL_G){ const w = 1/(1 + (a - x)**2 + (b - z)**2); bw += w; bv += w*v; } return bv/bw; };
  const WH = '#f0eee6', WH2 = '#e2dfd5', RF = '#62676d', RF2 = '#575c62', TR = '#d6d2c6';
  const GL = {c:'#2a3036'}, GLL = {c:'#2a3036', glow:'#ffd7a0', gk:0.75};
  const wl = TB(), rf = TB(), dk = TB(), lit = TB(), tr = TB();
  const FH = 3.4;
  // one hotel range: a white box along a -> b (width w) from the foundation up to the eaves, windows, a gabled roof with
  // dormers; floor = gy at the range's middle, foundation down to the lowest ground under it - 3
  function range(a, b, w, n, o){
    o = o || {};
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), c = dx/L, s = -dz/L, ry = Math.atan2(-dz, dx);
    const cx = (a[0] + b[0])/2, cz = (a[1] + b[1])/2, Q = (u, y, t) => [cx + u*c + t*s, y, cz - u*s + t*c];
    let lo = Infinity; for (const u of [-L/2, 0, L/2]) for (const t of [-w/2, w/2]){ const q = Q(u, 0, t); lo = Math.min(lo, gy(q[0], q[2])); }
    const fl = o.floor !== undefined ? o.floor : gy(cx, cz) + 0.3, y0 = lo - 3, top = fl + n*FH;
    wl.box(L, top - y0, w, cx, y0, cz, ry);
    tr.box(L + 0.6, 0.5, w + 0.6, cx, top - 0.5, cz, ry);                     // eave band
    tr.box(L + 0.3, 0.35, w + 0.3, cx, fl + FH - 0.2, cz, ry);                // first-floor band
    // windows on the long faces and on the ends; the hidden storeys under the ground get none
    for (const t of [-1, 1]){
      const nb = Math.max(1, Math.floor(L/3.3));
      for (let f = 0; f < n; f++) for (let k = 0; k < nb; k++){
        const u = -L/2 + (k + 0.5)*L/nb, y = fl + f*FH + 0.9, q = Q(u, 0, t*w/2); if (y < gy(q[0], q[2]) + 0.4) continue;
        const A = Q(u - 0.62, y, t*(w/2 + 0.07)), Bq = Q(u + 0.62, y, t*(w/2 + 0.07)), C = Q(u + 0.62, y + 1.75, t*(w/2 + 0.07)), D = Q(u - 0.62, y + 1.75, t*(w/2 + 0.07));
        (r() < 0.28 ? lit : dk).quad(A, Bq, C, D);
        tr.quad(Q(u - 0.82, y - 0.3, t*(w/2 + 0.035)), Q(u + 0.82, y - 0.3, t*(w/2 + 0.035)), Q(u + 0.82, y + 1.95, t*(w/2 + 0.035)), Q(u - 0.82, y + 1.95, t*(w/2 + 0.035)));
      }
      const nb2 = Math.max(1, Math.floor(w/3.4));
      for (let f = 0; f < n; f++) for (let k = 0; k < nb2; k++){
        const tt = -w/2 + (k + 0.5)*w/nb2, y = fl + f*FH + 0.9, q = Q(t*L/2, 0, tt); if (y < gy(q[0], q[2]) + 0.4) continue;
        const A = Q(t*(L/2 + 0.07), y, tt - 0.62), Bq = Q(t*(L/2 + 0.07), y, tt + 0.62), C = Q(t*(L/2 + 0.07), y + 1.75, tt + 0.62), D = Q(t*(L/2 + 0.07), y + 1.75, tt - 0.62);
        (r() < 0.28 ? lit : dk).quad(A, Bq, C, D);
        tr.quad(Q(t*(L/2 + 0.035), y - 0.3, tt - 0.82), Q(t*(L/2 + 0.035), y - 0.3, tt + 0.82), Q(t*(L/2 + 0.035), y + 1.95, tt + 0.82), Q(t*(L/2 + 0.035), y + 1.95, tt - 0.82));
      }
    }
    // roof: steep gable (or hip) along the range, with dormers on both slopes
    const rh = o.rh || w*0.48;
    if (o.flat){ tr.box(L + 0.4, 1.1, w + 0.4, cx, top, cz, ry); return {top, fl, Q, L, w, ry}; }
    if (o.hip) hipRoof(g, cx, cz, L, w, top, rh, RF, ry, 0.7); else gable(g, cx, cz, L + 1.4, w + 1.6, top, rh, RF, ry);
    if (!o.hip) for (const e of [-1, 1]){                                     // gable ends: white infill, half-timber posts
      const yb = top, A = Q(e*(L/2 + 0.05), yb, -w/2), Bq = Q(e*(L/2 + 0.05), yb, w/2), C = Q(e*(L/2 + 0.05), yb + rh*0.96, 0);
      wl.tri(A, Bq, C);
      for (let k = -2; k <= 2; k++){ const tt = k*w/6, hh = rh*(1 - Math.abs(tt)/(w/2))*0.92; tr.box(0.3, hh, 0.3, ...Q(e*(L/2 + 0.12), yb, tt), ry); }
      for (const tt of [-w/7, w/7]){ const q = Q(e*(L/2 + 0.1), yb + rh*0.35, tt); (r() < 0.35 ? lit : dk).quad(Q(e*(L/2 + 0.12), yb + rh*0.2, tt - 0.6), Q(e*(L/2 + 0.12), yb + rh*0.2, tt + 0.6), Q(e*(L/2 + 0.12), yb + rh*0.45, tt + 0.6), Q(e*(L/2 + 0.12), yb + rh*0.45, tt - 0.6)); }
    }
    const nd = Math.max(1, Math.floor((L - 6)/(o.dsp || 7)));
    for (let k = 0; k < nd; k++) for (const t of [-1, 1]){
      if (o.noDormer && o.noDormer(t)) continue;
      const u = -L/2 + 3 + (k + 0.5)*(L - 6)/nd, tt = t*w*0.3, yb = top + rh*0.22;
      const q = Q(u, yb, tt); wl.box(2.4, 2.2, 3.0, q[0], yb, q[2], ry);
      gable(g, q[0], q[2], 3.6, 2.6, yb + 2.2, 1.5, RF2, ry + HP);
      const f0 = Q(u - 0.55, yb + 0.4, tt + t*1.52), f1 = Q(u + 0.55, yb + 0.4, tt + t*1.52), f2 = Q(u + 0.55, yb + 1.8, tt + t*1.52), f3 = Q(u - 0.55, yb + 1.8, tt + t*1.52);
      (r() < 0.3 ? lit : dk).quad(f0, f1, f2, f3);
    }
    return {top, fl, Q, L, w, ry, rh};
  }
  // cross gable projecting from a range face (at u along it, on side t), width cw, rising to the ridge
  function xgable(R, u, t, cw, proj){
    const q0 = R.Q(u, 0, t*(R.w/2 + proj/2)), lo = gy(q0[0], q0[2]) - 3;
    wl.box(cw, R.top - lo, proj, q0[0], lo, q0[2], R.ry);
    gable(g, q0[0], q0[2], proj + 2, cw + 1.2, R.top, R.rh*0.92, RF, R.ry + HP);
    const F = (du, y) => R.Q(u + du, y, t*(R.w/2 + proj + 0.06));
    wl.tri(F(-cw/2, R.top), F(cw/2, R.top), F(0, R.top + R.rh*0.88));
    for (const du of [-cw/3, 0, cw/3]) tr.box(0.3, R.rh*(1 - Math.abs(du)/(cw/2))*0.85, 0.3, ...F(du, R.top), R.ry);
    tr.box(cw, 0.35, 0.3, ...F(0, R.top + R.rh*0.3), R.ry);
    for (let f = 0; f < 6; f++){ const y = R.fl + f*FH + 0.9; if (y < gy(q0[0], q0[2]) + 0.4) continue;
      for (const du of [-cw*0.28, 0, cw*0.28]) (r() < 0.3 ? lit : dk).quad(F(du - 0.7, y), F(du + 0.7, y), F(du + 0.7, y + 1.8), F(du - 0.7, y + 1.8)); }
  }
  // ---- the ranges (plan from the real outline) ----
  const fF = gy(36, 45) + 0.4;
  const R1 = range([-2.5, 40.4], [64.5, 40.4], 18.4, 5, {floor:fF});                      // main front range
  const R2 = range([55.5, 30], [55.5, -8], 15, 5, {floor:gy(56, 10) + 0.3});             // east range
  const R2b = range([69.5, 49], [69.5, 20], 10.5, 6, {floor:fF});                          // front-right pavilion
  const R3 = range([-2.5, -19.5], [46.5, -19.5], 15, 5, {floor:gy(22, -20) + 0.3});       // back range
  range([2, 9], [-31.5, -13], 15, 5);                                                      // north-west wing (angled)
  const R5 = range([-58, -32], [3, -32], 14.5, 5, {floor:gy(-25, -32) + 0.3});            // north range
  range([-72, -16.5], [-40, -16.5], 13.5, 4);                                              // west range
  {   // the north-west pavilion with a hipped roof
    const a = [-86, -16.5], b = [-71.5, -39.5];
    range(a, b, 19, 5, {hip:true, rh:8.5});
  }
  range([-2, 10.5], [48.5, 10.5], 40, 2, {flat:true, floor:gy(23, 10) + 0.3});             // courtyard wing (lobby, ballroom)
  for (const u of [-29, -15, 15, 28]) xgable(R1, u, 1, 9.5, 2.2);                          // cross gables on the front
  xgable(R5, 6, -1, 9, 2); xgable(R3, -18, -1, 9, 2);
  // enclosed veranda along the front (a glazed one-storey porch)
  {
    const lo = gy(36, 51) - 3;
    for (const [x0, x1] of [[-1, 22], [40, 63]]){
      wl.box(x1 - x0, fF + 4 - lo, 3.0, (x0 + x1)/2, lo, 50.2, 0); tr.box(x1 - x0 + 0.5, 0.45, 3.4, (x0 + x1)/2, fF + 4, 50.2, 0);
      for (let x = x0 + 1.2; x < x1 - 1; x += 2.6) (r() < 0.4 ? lit : dk).quad([x, fF + 0.9, 51.76], [x + 1.8, fF + 0.9, 51.76], [x + 1.8, fF + 3.3, 51.76], [x, fF + 3.3, 51.76]);
    }
  }
  // ---- the central tower: square shaft, four gables, steep pyramid roof, cupola and flagpole (49 m above the lawn) ----
  {
    const TX = 31, TZ = 43.5, TW = 12.6, tb = gy(TX, TZ + 7) - 3, t1 = fF + 37;
    wl.box(TW, t1 - tb, TW, TX, tb, TZ, 0);
    tr.box(TW + 0.8, 0.6, TW + 0.8, TX, t1 - 0.6, TZ, 0); tr.box(TW + 0.4, 0.4, TW + 0.4, TX, fF + 21, TZ, 0);
    for (const [nx, nz] of [[0, 1], [1, 0], [0, -1], [-1, 0]]){
      const F = (du, y, o) => [TX + nx*(TW/2 + (o || 0.06)) + nz*du, y, TZ + nz*(TW/2 + (o || 0.06)) - nx*du];
      for (let f = (nz > 0 ? 1 : 5); f < 10; f++) for (const du of [-3.9, -1.3, 1.3, 3.9]){ const y = fF + f*FH + 0.9; (r() < 0.35 ? lit : dk).quad(F(du - 0.6, y), F(du + 0.6, y), F(du + 0.6, y + 1.8), F(du - 0.6, y + 1.8)); }
      // gable on each face of the top storey
      gable(g, TX + nx*TW*0.32, TZ + nz*TW*0.32, TW*0.36 + 1.2, 9.2, t1, 4.2, RF, nx ? 0 : HP);
      wl.tri(F(-4.4, t1, 0.75), F(4.4, t1, 0.75), F(0, t1 + 4.0, 0.75));
      for (const du of [-2.2, 0, 2.2]) tr.box(0.3, 4.0*(1 - Math.abs(du)/4.4)*0.9, 0.3, ...F(du, t1, 0.85), 0);
      (r() < 0.6 ? lit : dk).quad(F(-0.8, t1 + 0.6, 0.86), F(0.8, t1 + 0.6, 0.86), F(0.8, t1 + 2.3, 0.86), F(-0.8, t1 + 2.3, 0.86));
    }
    LCone(g, TW*0.8, 12.5, TX, t1, TZ, RF, 4, PI/4);
    // entrance porch at the foot of the tower
    wl.box(11, fF + 4.6 - tb, 4.6, TX, tb, TZ + TW/2 + 2.3, 0); tr.box(11.8, 0.6, 5.2, TX, fF + 4.6, TZ + TW/2 + 2.3, 0);
    for (const dx of [-3.2, 0, 3.2]) lit.quad([TX + dx - 1.0, fF + 0.2, TZ + TW/2 + 4.66], [TX + dx + 1.0, fF + 0.2, TZ + TW/2 + 4.66], [TX + dx + 1.0, fF + 3.4, TZ + TW/2 + 4.66], [TX + dx - 1.0, fF + 3.4, TZ + TW/2 + 4.66]);
    const ct = t1 + 9.6;
    LCyl(g, 1.7, 1.9, 2.6, TX, ct, TZ, WH, 8); LCone(g, 2.3, 3.0, TX, ct + 2.6, TZ, RF2, 8);
    LCyl(g, 0.12, 0.16, 5, TX, ct + 5.4, TZ, TR, 5);
    LBox(g, 0.5, 0.5, 0.5, TX, ct + 10.3, TZ, {c:'#b02020', glow:'#ff3020', gk:1.5});
  }
  wl.out(g, WH); tr.out(g, TR); dk.out(g, GL); lit.out(g, GLL);
  // chimneys on the main roofs
  const ch = TB();
  for (const [x, z, y] of [[8, 36, R1.top], [62, 44, R1.top], [56, 12, R2.top], [20, -16, R3.top], [-30, -30, R5.top]]) ch.box(1.6, 6.5, 2.4, x, y, z, 0);
  ch.out(g, WH2);
  return g; }};

// =====================================================================================================================
// USS Hornet museum (Essex-class long-hull carrier, 1943; SCB-27A + SCB-125 angled deck, hurricane bow), moored at Pier 3,
// Alameda Point, starboard side to the pier, bow east. 271 m overall, 28.3 m waterline beam, flight deck ~16.5 m above the
// water (freeboard 52 ft); the island on the starboard side with the stack and the radar mast; the starboard deck-edge elevator lowered to the
// hangar deck (the visitors' way in); a few parked aircraft on deck. Haze grey, dark deck with white landing lines.
// Frame: +x = bow (heading ~4.4 deg south of east), +z = starboard (the pier), origin on the centreline amidships.
// The model floats: the waterline is the map's sea level (world -0.05), found at build time from the app's terrain.
// =====================================================================================================================
E2P.hornet = {lat:37.7727, lon:-122.302891, rot:-0.07665};
LANDMARKS.hornet = {zh:'大黄蜂号航空母舰博物馆', en:'USS Hornet Sea, Air & Space Museum', cat:'old', r:140, h:52,
  lt:{m:0, c:'#dfe6f0', k:0.45, e:0.6}, build(){
  const g = new THREE.Group(), r = LMCTX.rng, P = E2P.hornet;
  const B = e2Base(P.lat, P.lon, 140), WL = B ? Math.min(-0.05 - B.top, -0.2) : -0.35;
  const HD = WL + 7.9, FD = WL + 15.8, FU = FD - 0.8;      // hangar deck, flight deck top / underside (freeboard 52 ft)
  const HULL = '#7f868c', HULL2 = '#737a80', BOOT = '#24272a', DECK = {c:'#3d4144'}, LINE = {c:'#dcdcd4', glow:'#fff6dc', gk:0.12};
  const ISL = '#8b9298', DARK = {c:'#22272b'}, WIN = {c:'#1d2429', glow:'#ffd9a0', gk:0.75}, AC = '#a3aab0', AC2 = '#5d666e';
  const RAD = {c:'#5f6569'}, RED = {c:'#b02020', glow:'#ff2a1a', gk:2}, CAN = {c:'#2b3a46'};
  // ---- hull: lofted sections stern -> bow; [u, keel half-width, waterline, hangar deck, under the flight deck, keel y] ----
  const ST = [[-127, 6, 10.5, 13.2, 14.4, -3], [-118, 9, 12.4, 14.0, 14.6, -3], [-100, 11, 13.6, 14.4, 14.7, -3], [-70, 12, 14.15, 14.5, 14.8, -3],
    [40, 12, 14.15, 14.5, 14.8, -3], [70, 10.5, 13.2, 14.3, 15.0, -3], [92, 7, 10.4, 13.2, 15.1, -3], [108, 3.5, 6.6, 11.2, 14.6, -3],
    [118, 1, 3.0, 8.8, 14.2, -2.5], [125, 0.3, 1.0, 6.6, 13.6, 0.5], [130, 0.2, 0.4, 3.8, 12.6, 4.5], [133, 0.1, 0.2, 1.8, 11.2, 8.5], [135, 0.05, 0.1, 0.8, 8.5, 12.0]];
  const secs = [];
  for (const [u, bk, bw, bh, bt, yk] of ST){
    const yw = Math.max(0, yk + 0.5) + WL, yh = Math.max(HD, yk + 2 + WL);
    secs.push([[u, FU, -bt], [u, yh, -bh], [u, yw, -bw], [u, WL + yk, -bk], [u, WL + yk, bk], [u, yw, bw], [u, yh, bh], [u, FU, bt]]);
  }
  LLoft(g, secs, HULL, true);
  // boot topping (black band at the waterline) as two strips along both sides
  const bt = TB();
  for (let i = 0; i < 8; i++) for (const s of [-1, 1]){
    const a = ST[i], b = ST[i + 1], ka = s*(a[2] + 0.06), kb = s*(b[2] + 0.06);
    bt.quad([a[0], WL - 0.5, ka], [b[0], WL - 0.5, kb], [b[0], WL + 1.0, kb], [a[0], WL + 1.0, ka]);
  }
  bt.out(g, BOOT);
  // transom (stern face) and the open fantail under the flight deck overhang
  const s0 = secs[0]; LTris(g, [...s0[0], ...s0[3], ...s0[4], ...s0[0], ...s0[4], ...s0[7], ...s0[1], ...s0[2], ...s0[3], ...s0[4], ...s0[5], ...s0[6], ...s0[0], ...s0[1], ...s0[3], ...s0[4], ...s0[6], ...s0[7]], HULL2);
  const st = TB();
  for (const v of [-12, -6, 0, 6, 12]) st.box(0.7, FU - HD, 0.7, -133, HD, v);
  st.box(10, 0.6, 28, -132, HD - 0.6, 0);                        // fantail deck
  st.out(g, HULL2);
  // ---- hangar sides: big roller-door openings, sponson catwalks, gun tubs, radio masts ----
  const dk = TB(), hs = TB(), ac = TB(), cl = TB();
  for (let u = -112; u <= 60; u += 21) for (const s of [-1, 1]){
    if (s > 0 && u > -62 && u < -30) continue;                    // the starboard elevator well
    const w = 9 + r()*5, open = r() < 0.45;
    (open ? dk : cl).quad([u - w/2, HD + 0.4, s*14.62], [u + w/2, HD + 0.4, s*14.62], [u + w/2, HD + (open ? 4.6 : 4.2), s*14.62], [u - w/2, HD + (open ? 4.6 : 4.2), s*14.62]);
  }
  for (let u = -105; u <= 75; u += 3.6) for (const s of [-1, 1]) dk.quad([u, FU - 2.3, s*14.83], [u + 1.2, FU - 2.3, s*14.83], [u + 1.2, FU - 1.75, s*14.83], [u, FU - 1.75, s*14.83]);   // gallery-deck ports
  for (const s of [-1, 1]){
    hs.box(232, 0.35, 1.6, -6, FU - 1.6, s*15.5);                  // catwalks under the deck edge
    for (const u of [-118, -96, 52, 74]){                         // gun sponsons with twin 3-inch mounts
      hs.box(7, 3.2, 4.2, u, FU - 4.4, s*16.4); hs.box(7.6, 0.25, 4.8, u, FU - 1.3, s*16.6);
      ac.box(2.4, 1.5, 2.4, u, FU - 1.2, s*16.6);
      for (const d of [-0.45, 0.45]) ac.beam([u + d, FU - 0.6, s*16.6], [u + d + 3.6, FU - 0.2, s*16.6 + s*0.2], 0.16);
    }
    for (const u of [-80, -45, 0, 30, 88]){                       // hinged radio masts, raised at an angle outboard
      if (s > 0 && (u === -45 || u === 30)) continue;
      ac.beam([u, FU - 2, s*15.6], [u + 1, FU + 8, s*20.5], 0.22);
    }
  }
  // portholes along the hull below the hangar deck, hawse pipes at the bow
  for (let u = -110; u <= 62; u += 2.6) for (const s of [-1, 1]) for (const y of [WL + 4.4, WL + 5.9]){ if (r() < 0.25) continue; dk.quad([u, y, s*14.36], [u + 0.5, y, s*14.36], [u + 0.5, y + 0.5, s*14.36], [u, y + 0.5, s*14.36]); }
  for (const s of [-1, 1]){ const v = s*7.3; dk.quad([111, WL + 8.6, v*1.0], [113, WL + 8.6, v*0.86], [113, WL + 10.0, v*0.86], [111, WL + 10.0, v*1.0]); }
  // mooring lines to the bollards on the pier (starboard side)
  for (const [u0, u1] of [[118, 132], [92, 100], [-30, -24], [-62, -70], [-110, -118], [-122, -136]]) ac.beam([u0, HD - 1.0, 14.6], [u1, 1.3, 29.6], 0.16);
  dk.out(g, DARK); hs.out(g, HULL2); cl.out(g, RAD);
  // ---- starboard deck-edge elevator, lowered to the hangar deck (the museum's entrance from the pier) ----
  const el = TB();
  el.box(18.6, 0.8, 13.2, -43.7, HD - 0.8, 22.1);
  el.box(1.0, FU - HD + 0.6, 1.0, -53, HD - 0.8, 28.4); el.box(1.0, FU - HD + 0.6, 1.0, -34.4, HD - 0.8, 28.4);
  el.box(19.6, 1.0, 1.0, -43.7, FU - 1.2, 28.4);
  el.box(19.6, 0.9, 13.6, -43.7, FU - 0.9, 21.8);                 // the overhead platform frame
  el.out(g, HULL2);
  dk.quad([-52, HD + 0.2, 14.66], [-35.5, HD + 0.2, 14.66], [-35.5, FU - 1.8, 14.66], [-52, FU - 1.8, 14.66]); dk.out(g, DARK);
  // ---- flight deck (the real outline) with the white landing lines ----
  const FDP = [[-136.5, -15.4], [-120.6, -16.7], [-86.1, -20.3], [-80.5, -22.9], [-71.4, -24.3], [-54.7, -24.7], [-20.9, -28.1], [-11.1, -29.1], [25.4, -28.9],
    [27.0, -18.9], [62.6, -18.8], [69.2, -16.2], [100.1, -15.8], [133.9, -15.5], [135.5, -13.5], [135.5, 13.5], [133.9, 15.6], [98.2, 15.9], [78.2, 16.2],
    [43.8, 16.5], [32.2, 16.5], [21.1, 18.5], [10.6, 18.5], [-10.0, 16.5], [-26.4, 15.6], [-64.0, 15.4], [-129.5, 15.3], [-136.5, 14.0]];
  LPoly(g, FDP, FU, 0.8, DECK);
  LPoly(g, FDP.map(p => [p[0]*0.995, p[1]*0.95]), FU - 1.2, 0.4, HULL2);
  // the angled-deck sponson: girders and diagonal struts under the port overhang
  const sp = TB();
  for (let u = -52; u <= 22; u += 9){ const vo = -15.6 - Math.max(0, Math.min(13, (u + 60)*0.16)); sp.beam([u, HD + 2.5, -14.6], [u, FU - 0.3, vo + 0.8], 0.55); sp.box(0.6, 1.0, Math.abs(vo) - 14.2, u, FU - 1.0, (vo - 14.6)/2, 0); }
  sp.box(78, 1.2, 0.6, -15, FU - 1.2, -25.5, 0.05);
  sp.out(g, HULL2);
  const ln = TB(), y = FD + 0.04;
  const strip = (u0, v0, u1, v1, w) => { const L = Math.hypot(u1 - u0, v1 - v0), nx = -(v1 - v0)/L*w/2, nz = (u1 - u0)/L*w/2;
    ln.quad([u0 - nx, y, v0 - nz], [u0 + nx, y, v0 + nz], [u1 + nx, y, v1 + nz], [u1 - nx, y, v1 - nz]); };
  for (let u = -20; u < 128; u += 9) strip(u, 0, u + 5, 0, 0.6);                    // axial centreline dashes
  const A0 = [-126, 3.2], A1 = [24, -22.4], aL = Math.hypot(A1[0] - A0[0], A1[1] - A0[1]), ax = (A1[0] - A0[0])/aL, az = (A1[1] - A0[1])/aL;
  for (let t = 0; t < aL - 6; t += 9) strip(A0[0] + ax*t, A0[1] + az*t, A0[0] + ax*(t + 5), A0[1] + az*(t + 5), 0.7);   // angled deck centreline
  for (const o of [-11, 11]) strip(A0[0] - az*o, A0[1] + ax*o, A1[0] - az*o, A1[1] + ax*o, 0.35);                       // its edge lines
  strip(-136, -15.2, -136, 13.8, 0.5); strip(-128, 3.2 - 4, -128, 3.2 + 4, 0.8);
  for (const [u0, u1] of [[76, 92], [-28, -12]]){ strip(u0, -7.5, u1, -7.5, 0.25); strip(u0, 7.5, u1, 7.5, 0.25); strip(u0, -7.5, u0, 7.5, 0.25); strip(u1, -7.5, u1, 7.5, 0.25); }   // centreline elevators
  ln.out(g, LINE);
  // arresting-gear wires across the angled deck (dark lines)
  const aw = TB(), y2 = FD + 0.03;
  for (let k = 0; k < 4; k++){ const t = 18 + k*11, cx = A0[0] + ax*t, cz = A0[1] + az*t;
    aw.quad([cx - az*-12 - ax*0.15, y2, cz + ax*-12 - az*0.15], [cx - az*-12 + ax*0.15, y2, cz + ax*-12 + az*0.15], [cx - az*12 + ax*0.15, y2, cz + ax*12 + az*0.15], [cx - az*12 - ax*0.15, y2, cz + ax*12 - az*0.15]); }
  aw.out(g, BOOT);
  // ---- the island (starboard, forward of amidships): bridge levels, stack, radar mast ----
  const is = TB(), iw = TB(), rd = TB();
  is.box(34, 3.0, 7.6, 23, FD, 13.6); is.box(31, 3.0, 7.0, 23.5, FD + 3, 13.6); is.box(26, 3.0, 6.6, 24, FD + 6, 13.7);
  is.box(14, 3.0, 6.4, 31, FD + 9, 13.7);                                             // navigation bridge
  is.box(9, 2.6, 5.6, 32, FD + 12, 13.7);                                             // flag / pri-fly level
  is.box(3.2, 0.35, 11.4, 34.5, FD + 9.4, 13.7); is.box(3.2, 0.35, 10.2, 34.0, FD + 12.4, 13.7);             // bridge wings
  is.box(5, 2.4, 1.6, 9.5, FD + 9, 9.6);                                              // primary flight control, overhanging the deck
  is.box(1.4, 9, 7.6, 6.2, FD, 13.6);                                                 // aft splinter shield
  for (let k = 0; k < 4; k++) iw.box(k === 3 ? 13.6 : 30 - k*4, 0.9, 7.8 - k*0.4, k === 3 ? 31 : 23.5, FD + 1.6 + k*3, 13.6 - (k === 3 ? 0 : 0));
  iw.box(9.2, 1.0, 5.8, 32, FD + 13.2, 13.7);
  iw.box(5.1, 1.1, 0.2, 9.5, FD + 10.0, 8.8);
  // stack: rises behind the bridge, raked aft, with a dark cap
  const stk = [[11, FD + 9], [22, FD + 9], [21, FD + 19.5], [12.5, FD + 19.5]];
  is.quad([stk[0][0], stk[0][1], 11.2], [stk[1][0], stk[1][1], 11.2], [stk[2][0], stk[2][1], 11.6], [stk[3][0], stk[3][1], 11.6]);
  is.quad([stk[1][0], stk[1][1], 16.2], [stk[0][0], stk[0][1], 16.2], [stk[3][0], stk[3][1], 15.8], [stk[2][0], stk[2][1], 15.8]);
  is.quad([stk[0][0], stk[0][1], 16.2], [stk[0][0], stk[0][1], 11.2], [stk[3][0], stk[3][1], 11.6], [stk[3][0], stk[3][1], 15.8]);
  is.quad([stk[1][0], stk[1][1], 11.2], [stk[1][0], stk[1][1], 16.2], [stk[2][0], stk[2][1], 15.8], [stk[2][0], stk[2][1], 11.6]);
  rd.box(8.6, 1.0, 4.4, 16.8, FD + 19.5, 13.7);
  // the pole mast with its yards and antennas
  const MX = 27.5, MZ = 13.7, MT = FD + 36;
  is.beam([MX, FD + 12, MZ], [MX + 0.5, MT, MZ], 0.9);
  for (const d of [-1, 1]) is.beam([MX - 4.5, FD + 12, MZ + d*2.6], [MX + 0.2, FD + 26, MZ], 0.45);
  is.box(5, 0.4, 5, MX, FD + 21.5, MZ); is.box(3.6, 0.4, 3.6, MX + 0.3, FD + 29, MZ);
  rd.box(0.3, 12, 0.3, MX + 0.1, FD + 22, MZ - 5.5); rd.box(0.3, 4.2, 12, MX + 1.2, FD + 23.5, MZ);        // big bedspring air-search array
  for (let k = 0; k < 7; k++) rd.box(0.25, 0.25, 12, MX + 1.3, FD + 23.6 + k*0.66, MZ);
  rd.box(0.6, 0.3, 16, MX + 0.3, FD + 31, MZ);                                        // yard
  rd.beam([MX + 0.4, FD + 29.4, MZ], [MX + 3.4, FD + 33, MZ], 0.25);
  rd.out(g, RAD);
  const dish = new THREE.SphereGeometry(2.4, 12, 6, 0, TAU, 0, 1.0); dish.rotateZ(-HP); dish.scale(0.45, 1, 1); lmAdd(g, dish, RAD, MX + 3.6, FD + 33, MZ);
  LBox(g, 0.6, 0.6, 0.6, MX + 0.5, MT, MZ, RED);
  is.out(g, ISL); iw.out(g, WIN);
  // ---- parked aircraft: generic jets, a twin-engine patrol plane, a helicopter (no markings) ----
  const cp = TB();
  const jet = (u, v, hd, L, span, sw) => {
    const c = Math.cos(hd), s = Math.sin(hd), Q = (a, h, b) => [u + a*c - b*s, FD + h, v + a*s + b*c];
    ac.beam(Q(-L/2, 1.6, 0), Q(L/2, 1.6, 0), L*0.085); ac.beam(Q(L/2, 1.6, 0), Q(L/2 + 1.6, 1.5, 0), L*0.04);
    ac.tri(Q(-L*0.12, 1.4, 0), Q(-L*0.12 - sw, 1.4, span/2), Q(-L*0.12 - sw - L*0.12, 1.4, span/2)); ac.tri(Q(-L*0.12, 1.4, 0), Q(-L*0.12 - sw - L*0.12, 1.4, -span/2), Q(-L*0.12 - sw, 1.4, -span/2));
    ac.tri(Q(-L*0.12, 1.4, 0), Q(-L*0.12 - sw - L*0.12, 1.4, span/2), Q(-L*0.42, 1.4, 0)); ac.tri(Q(-L*0.12, 1.4, 0), Q(-L*0.42, 1.4, 0), Q(-L*0.12 - sw - L*0.12, 1.4, -span/2));
    ac.tri(Q(-L*0.36, 2.0, 0), Q(-L/2, 2.0, 0), Q(-L/2 - 0.6, 4.4, 0));                                               // fin
    ac.tri(Q(-L*0.4, 1.7, 0), Q(-L/2, 1.7, span*0.2), Q(-L/2, 1.7, -span*0.2));                                       // tailplane
    for (const b of [-span*0.18, span*0.18, 0]) ac.box(0.3, 1.3, 0.3, ...Q(b === 0 ? L*0.35 : -L*0.1, 0, b), 0);
    cp.beam(Q(L*0.18, 2.3, 0), Q(L*0.36, 2.15, 0), 0.75);
  };
  jet(108, -6, 0.5, 13.5, 8.4, 2.8); jet(116, 7, -0.6, 12, 8, 2.2); jet(52, -9.5, 0.25, 16.5, 11, 3.6); jet(-30, -20, 0.95, 15, 10.8, 3.0);
  {   // twin-engine anti-submarine patrol plane, wings folded up
    const u = -66, v = -8, c = Math.cos(0.4), s = Math.sin(0.4), Q = (a, h, b) => [u + a*c - b*s, FD + h, v + a*s + b*c];
    ac.beam(Q(-6.6, 2.0, 0), Q(6.6, 2.0, 0), 1.7); ac.box(1.8, 0.4, 7.6, ...Q(1.2, 2.9, 0), 0.4);
    for (const d of [-1, 1]){ ac.beam(Q(-0.4, 2.2, d*2.6), Q(3.4, 2.2, d*2.6), 1.0); ac.quad(Q(0, 3.2, d*3.8), Q(2.4, 3.2, d*3.8), Q(2.2, 8.4, d*3.2), Q(0.6, 8.4, d*3.2)); }
    ac.tri(Q(-5.6, 2.6, 0), Q(-6.8, 2.6, 0), Q(-7.0, 5.4, 0)); ac.box(1.6, 0.25, 6.4, ...Q(-6.2, 2.6, 0), 0.4);
    cp.beam(Q(4.0, 2.9, 0), Q(5.6, 2.8, 0), 1.0);
  }
  {   // anti-submarine helicopter (Sea King type)
    const u = -100, v = 5, c = Math.cos(-0.2), s = Math.sin(-0.2), Q = (a, h, b) => [u + a*c - b*s, FD + h, v + a*s + b*c];
    ac.box(11, 3.6, 3.2, ...Q(0, 0.6, 0), -0.2); ac.beam(Q(-5.5, 2.6, 0), Q(-10.5, 3.2, 0), 1.0); ac.quad(Q(-10, 3.0, 0), Q(-11.2, 3.2, 0), Q(-11.4, 5.8, 0), Q(-10.6, 5.6, 0));
    ac.box(4.4, 0.9, 1.6, ...Q(1, 4.2, 0), -0.2); ac.box(0.4, 0.8, 0.4, ...Q(1, 5.1, 0), -0.2);
    for (let k = 0; k < 5; k++){ const a = k/5*TAU + 0.3; ac.beam(Q(1, 5.7, 0), Q(1 + Math.cos(a)*9.4, 5.6, Math.sin(a)*9.4), 0.35); }
    cp.box(1.6, 1.2, 3.0, ...Q(5.2, 2.2, 0), -0.2);
  }
  ac.out(g, AC); cp.out(g, CAN);
  // deck furniture: tow tractors, a crane, chocks rows
  const tr = TB();
  for (const [u, v] of [[96, -11], [-48, 9], [-116, -10]]) tr.box(3.4, 1.4, 2.0, u, FD, v);
  tr.box(5, 2.2, 3, 2, FD, 10); tr.beam([2, FD + 2.2, 10], [-6, FD + 9, 10], 0.6);
  tr.out(g, AC2);
  return g; }};

// =====================================================================================================================
// Treasure Island Building One - the Administration Building (1938, George W. Kelham and W. P. Day), the Art Deco /
// Streamline Moderne air terminal of the Golden Gate International Exposition (later NAS Treasure Island): a reinforced
// concrete crescent, two main floors with mezzanines, ribbon windows between vertical piers, the central entrance pavilion
// on the curved front with its tall glazed bays and the round control tower with the aerial beacon on top; the concave
// court faces the city and the Bay Bridge. Frame: map axes (rot 0), origin at the centroid of the real OSM outline.
// =====================================================================================================================
E2P.tibuilding1 = {lat:37.817184, lon:-122.371038, rot:0};
LANDMARKS.tibuilding1 = {zh:'金银岛一号楼（行政大楼）', en:'Treasure Island Building One (Administration Building)', cat:'old', r:70, h:33,
  lt:{m:0, c:'#ffeccc', k:0.7, e:0.55}, build(){
  const g = new THREE.Group(), r = LMCTX.rng, P = E2P.tibuilding1;
  const B = e2Base(P.lat, P.lon, 70), G0 = B ? B.gy(0, 0, 0) : -1.5, F = G0 + 0.4;
  const CR = '#e6dfcf', CR2 = '#d6ccb8', TRM = '#f2eee4', GL = {c:'#3d5361', glow:'#ffe0b0', gk:0.5}, GLT = {c:'#88a8b4', glow:'#ffdcaa', gk:0.55};
  const OX = 66.9, OZ = 27.1;                     // OSM ref coords -> local
  const raw = [[-122.7, -64.6], [-114.3, -68.6], [-106.2, -71.5], [-96.9, -73.1], [-88.1, -73.3], [-78.3, -72.0], [-69.9, -69.5], [-61.8, -66.0], [-55.2, -61.9],
    [-49.5, -57.1], [-44.4, -51.6], [-40.5, -45.8], [-37.2, -39.6], [-34.1, -32.2], [-32.2, -23.6], [-31.5, -14.3], [-32.3, -5.6], [-34.5, 4.2], [-37.9, 12.5],
    [-42.5, 20.0], [-49.1, 27.5], [-56.1, 33.4], [-66.9, 39.6], [-73.0, 35.4], [-78.0, 28.5], [-81.1, 18.6], [-73.3, 14.5], [-69.3, 11.6], [-65.9, 8.2],
    [-63.1, 4.4], [-61.6, 0.5], [-62.0, -7.7], [-61.2, -15.7], [-62.5, -22.9], [-65.6, -29.8], [-70.7, -36.0], [-73.7, -38.4], [-77.0, -40.5], [-84.5, -43.1],
    [-92.3, -48.1], [-97.8, -47.4], [-102.4, -46.2], [-113.0, -41.1], [-117.5, -46.5], [-121.9, -54.3], [-122.4, -58.8]];
  const PL = raw.map(p => [p[0] + OX, p[1] + OZ]);
  const NO = 23;                                  // outer front = points 0..22, inner court = 26..41
  const H1 = 13.6;                                // two floors + mezzanines
  LPoly(g, PL, F - 4, H1 + 4, CR);
  // parapet + cornice band and a second, set-back roof storey along the middle of the crescent
  const pw = TB(), pr = TB(), gl = TB(), gt = TB();
  for (let e = 0; e < PL.length; e++){ const p0 = PL[e], p1 = PL[(e + 1) % PL.length], n2 = onrm(PL, e);
    pr.wq(p0, p1, n2, 0.25, 0, 1, F + H1 - 0.2, F + H1 + 1.1); pr.wq(p0, p1, n2, 0.12, 0, 1, F + 4.3, F + 4.7); }
  // piers + ribbon windows on the outer front and the court side (two window rows: ground floor + upper floor)
  const piers = (i0, i1, out, every) => {
    for (let e = i0; e < i1; e++){
      const p0 = PL[e], p1 = PL[e + 1], n2 = onrm(PL, e), L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), nb = Math.max(1, Math.round(L/every));
      for (let b = 0; b < nb; b++){
        const u0 = b/nb, u1 = (b + 1)/nb, um = (u0 + u1)/2;
        gl.wq(p0, p1, n2, 0.06, u0 + 0.12/nb*2, u1 - 0.12/nb*2, F + 1.0, F + 3.8);
        gl.wq(p0, p1, n2, 0.06, u0 + 0.12/nb*2, u1 - 0.12/nb*2, F + 6.2, F + 11.4);
        const x = p0[0] + (p1[0] - p0[0])*u0 + n2[0]*out/2, z = p0[1] + (p1[1] - p0[1])*u0 + n2[1]*out/2;
        pw.box(0.7, H1 + 0.8, out, x, F, z, -Math.atan2(p1[1] - p0[1], p1[0] - p0[0]));
      }
    }
  };
  piers(0, 22, 0.7, 3.3); piers(26, 42, 0.6, 3.6); piers(22, 26, 0.6, 3.6); piers(42, 45, 0.6, 3.6);
  // horizontal speed lines (Streamline) under the upper windows on the front
  for (let e = 0; e < 22; e++){ const p0 = PL[e], p1 = PL[e + 1], n2 = onrm(PL, e); for (const y of [5.0, 5.5]) pr.wq(p0, p1, n2, 0.4, 0, 1, F + y, F + y + 0.18); }
  // central entrance pavilion on the curved front: taller block with tall glazed bays between fluted piers
  const [ex, ez] = [-38.0 + OX, -41.5 + OZ], ea = Math.atan2(-41.5 + 19, -38 + 83) ;
  { const ux = Math.cos(ea), uz = Math.sin(ea), tx = -uz, tz = ux;        // u: outward (radial), t: along the front
    const Q = (u, y, t) => [ex + ux*u + tx*t, y, ez + uz*u + tz*t], ry = -Math.atan2(tz, tx);
    const cq = Q(-6, 0, 0); pw.box(22, H1 + 6.4 - (F - 3) + F, 16, cq[0], F - 3, cq[2], ry);
    for (let k = -4; k <= 4; k++){ const q = Q(2.2, 0, k*2.4); pw.box(0.8, H1 + 6.0, 1.0, q[0], F, q[2], ry); }
    for (let k = -4; k < 4; k++){ const a = Q(2.05, F + 0.6, k*2.4 + 0.45), b = Q(2.05, F + 0.6, k*2.4 + 1.95), c = Q(2.05, F + H1 + 3.8, k*2.4 + 1.95), d = Q(2.05, F + H1 + 3.8, k*2.4 + 0.45); gt.quad(a, b, c, d); }
    const top = Q(-6, 0, 0); pr.box(23, 1.0, 17, top[0], F + H1 + 6.4, top[2], ry); pr.box(20, 0.9, 14, top[0], F + H1 + 7.4, top[2], ry);
    // relief panels (abstract, no text) flanking the entrance
    for (const s of [-1, 1]){ const q = Q(2.3, 0, s*11.5); pr.box(3.6, 7.5, 0.5, q[0], F + 5.2, q[2], ry); }
    // the round control tower with its glazed cab and the beacon
    const tc = [-48.0 + OX, -37.0 + OZ], tb = F + H1 + 8.3;
    LCyl(g, 3.6, 3.6, tb - F - H1 + 3.5, tc[0], F + H1, tc[1], CR2, 20);
    LCyl(g, 4.4, 4.4, 0.6, tc[0], tb + 3.5, tc[1], TRM, 20);
    LCyl(g, 3.9, 3.6, 3.0, tc[0], tb + 4.1, tc[1], GLT, 16);
    LCyl(g, 4.5, 4.5, 0.5, tc[0], tb + 7.1, tc[1], TRM, 20); LCone(g, 1.4, 1.0, tc[0], tb + 7.6, tc[1], CR2, 12);
    LCyl(g, 0.12, 0.12, 2.6, tc[0], tb + 8.6, tc[1], '#888', 6); LBox(g, 0.55, 0.55, 0.55, tc[0], tb + 11.2, tc[1], {c:'#30a050', glow:'#9cff9c', gk:2.2});
  }
  // the landside entrance on the court (facing the city): a projecting portico of tall piers with glazed bays
  { const cx = -62.2 + OX, cz = -3.8 + OZ, ux = -1, uz = 0.03, tx = -uz, tz = ux, ry = -Math.atan2(tz, tx);
    const Q = (u, y, t) => [cx + ux*u + tx*t, y, cz + uz*u + tz*t];
    const c0 = Q(1.6, 0, 0); pw.box(17, H1 + 3.2 - (F - 3) + F, 3.6, c0[0], F - 3, c0[2], ry);
    for (let k = -3; k <= 3; k++){ const q = Q(3.6, 0, k*2.5); pw.box(0.9, H1 + 2.6, 0.9, q[0], F, q[2], ry); }
    for (let k = -3; k < 3; k++){ const a = Q(3.45, F + 0.4, k*2.5 + 0.5), b = Q(3.45, F + 0.4, k*2.5 + 2.0), c = Q(3.45, F + H1 + 1.6, k*2.5 + 2.0), d = Q(3.45, F + H1 + 1.6, k*2.5 + 0.5); gt.quad(a, b, c, d); }
    const t0 = Q(1.6, 0, 0); pr.box(18, 0.9, 4.4, t0[0], F + H1 + 3.2, t0[2], ry); }
  // stair towers at the two ends of the crescent
  for (const [i, j] of [[0, 45], [22, 23]]){ const a = PL[i], b = PL[j], cx = (a[0] + b[0])/2, cz = (a[1] + b[1])/2; pw.box(7, H1 + 3.4 - (F - 3) + F, 7, cx, F - 3, cz, -Math.atan2(b[1] - a[1], b[0] - a[0])); }
  pw.out(g, TRM); pr.out(g, CR2); gl.out(g, GL); gt.out(g, GLT);
  return g; }};

// =====================================================================================================================
// Sunol Water Temple (1910, Willis Polk), Sunol: the round High-Classical pavilion over the meeting of the waters of the
// Spring Valley Water Company, after the Temple of Vesta at Tivoli - twelve white concrete Corinthian columns on a stepped
// circular stylobate, a ring-girder entablature, a conical red-tile roof (18 m, 59 ft), a painted ceiling and the tiled
// cistern in the floor. Frame: round, origin at the centre of the real OSM footprint.
// =====================================================================================================================
E2P.sunoltemple = {lat:37.58548, lon:-121.885487, rot:0};
LANDMARKS.sunoltemple = {zh:'苏诺尔水神庙', en:'Sunol Water Temple', cat:'old', r:9, h:18.2,
  lt:{m:0, c:'#ffe8c4', k:0.85, e:0.55}, build(){
  const g = new THREE.Group();
  const WH = '#efe9da', WH2 = '#e3dccb', ST = '#cfc8b8', TL = '#b25637', TL2 = '#9a4730', CE = {c:'#7f93a6', glow:'#ffe2b8', gk:0.35}, WA = {c:'#2f4a55'};
  const NC = 12, RC = 5.0, YB = 1.05, YS = YB + 0.42, YC = YB + 7.6, YE = YC + 1.0;   // columns: base, shaft, capital, entablature
  // stepped stylobate (foundation down into the ground) and the paved floor with the cistern
  LCyl(g, 6.9, 7.0, 4.35, 0, -4, 0, ST, 40); LCyl(g, 6.45, 6.45, 0.35, 0, 0.35, 0, ST, 40); LCyl(g, 6.0, 6.0, 0.35, 0, 0.7, 0, WH2, 40);
  LRing(g, 1.9, 1.9, 2.25, 2.25, YB, YB + 0.75, WH, 28); LCyl(g, 1.9, 1.9, 0.05, 0, YB - 0.4, 0, WA, 24);
  const cb = TB(), cc = TB();
  for (let i = 0; i < NC; i++){
    const a = i/NC*TAU + PI/NC, x = Math.cos(a)*RC, z = Math.sin(a)*RC;
    cb.box(1.05, 0.22, 1.05, x, YB, z, -a);
    LCyl(g, 0.4, 0.46, 0.2, x, YB + 0.22, z, WH, 12);
    LCyl(g, 0.33, 0.39, YC - YS, x, YS, z, WH, 12);
    // Corinthian capital: a flared bell with two rows of leaves (as notched rings) under a concave abacus
    LCyl(g, 0.56, 0.36, 0.85, x, YC, z, WH2, 12);
    for (let k = 0; k < 8; k++){ const b = k/8*TAU; cc.box(0.18, 0.5, 0.12, x + Math.cos(b)*0.42, YC + 0.08, z + Math.sin(b)*0.42, -b); cc.box(0.18, 0.42, 0.12, x + Math.cos(b + 0.39)*0.5, YC + 0.42, z + Math.sin(b + 0.39)*0.5, -b - 0.39); }
    cb.box(1.2, 0.18, 1.2, x, YC + 0.82, z, -a);
  }
  cb.out(g, WH); cc.out(g, WH2);
  // the ring girder: architrave, plain frieze, dentilled cornice
  LRing(g, 4.4, 4.4, 5.62, 5.62, YE, YE + 0.75, WH, 48);
  LRing(g, 4.4, 4.4, 5.55, 5.55, YE + 0.75, YE + 1.45, WH2, 48);
  LRing(g, 4.3, 4.3, 6.05, 6.05, YE + 1.45, YE + 1.8, WH, 48);
  const dn = TB(); for (let i = 0; i < 72; i++){ const a = i/72*TAU; dn.box(0.2, 0.18, 0.28, Math.cos(a)*5.75, YE + 1.27, Math.sin(a)*5.75, -a); } dn.out(g, WH);
  // painted ceiling (abstract colour field) and the conical red-tile roof with its ribs and finial
  LCyl(g, 4.45, 4.45, 0.12, 0, YE + 0.02, 0, CE, 32);
  const R0 = 6.1, Y0 = YE + 1.8, AP = 17.25;
  LLathe(g, [[R0, Y0], [R0*0.55, Y0 + (AP - Y0)*0.46], [0.3, AP - 0.05], [0.01, AP]], 0, 0, 0, TL, 36);
  const rb = TB();
  for (let i = 0; i < 36; i++){ const a = i/36*TAU, c = Math.cos(a), s = Math.sin(a);
    rb.beam([c*(R0 + 0.06), Y0 + 0.05, s*(R0 + 0.06)], [c*(R0*0.55 + 0.06), Y0 + (AP - Y0)*0.46 + 0.05, s*(R0*0.55 + 0.06)], 0.13);
    rb.beam([c*(R0*0.55 + 0.06), Y0 + (AP - Y0)*0.46 + 0.05, s*(R0*0.55 + 0.06)], [c*0.35, AP - 0.02, s*0.35], 0.11); }
  rb.out(g, TL2);
  LCyl(g, 0.28, 0.4, 0.5, 0, AP - 0.15, 0, WH, 10); LSph(g, 0.3, 0, AP + 0.62, 0, WH, 1, 10);
  return g; }};

// =====================================================================================================================
// Mission San José (founded 1797): the adobe church of 1809, destroyed in 1868 and rebuilt adobe by adobe in 1982-85 on the
// old foundations - a long whitewashed nave (about 50 x 14.6 m, walls 1.5 m thick) under a red clay-tile gable roof, the
// plain gabled front with its arched door facing Mission Boulevard (the old Camino Real), the unusually short bell tower
// with four bells at the north-west corner, and the stubs of the old annex walls along the north side.
// Frame: +x along the nave towards the sanctuary (east), +z = south; plan from the real OSM outline.
// =====================================================================================================================
E2P.missionsj = {lat:37.533884, lon:-121.919637, rot:0.15567};
LANDMARKS.missionsj = {zh:'圣何塞传教站', en:'Mission San José', cat:'old', r:38, h:17,
  lt:{m:0, c:'#ffe4c0', k:0.62, e:0.6}, build(){
  const g = new THREE.Group(), r = LMCTX.rng, P = E2P.missionsj;
  const B = e2Base(P.lat, P.lon, 38);
  const gy = (x, z) => B ? B.gy(P.rot, x, z) : -1.7 + 1.3*x/25;
  const WH = '#eeeadf', WH2 = '#e2ddcf', OC = '#c48a58', TL = '#a65335', TL2 = '#934830', WD = '#5a3c28', DK = '#2b2622', IR = '#2e2c2a';
  const BEL = {c:'#8a6a3c', glow:'#ffcf80', gk:0.4};
  const F = gy(0, 0) + 0.3, EV = F + 7.4, RH = 4.4;               // floor, eaves, roof rise
  const X0 = -26.6, X1 = 23.7, Z0 = -7.3, Z1 = 7.1, L = X1 - X0, W = Z1 - Z0, CX = (X0 + X1)/2, CZ = (Z0 + Z1)/2;
  const lo = Math.min(gy(X0, Z0), gy(X0, Z1), gy(X1, Z0), gy(X1, Z1)) - 2;
  const wl = TB(), dk = TB(), oc = TB(), tl = TB(), wd = TB();
  wl.box(L, EV - lo, W, CX, lo, CZ, 0);
  // the gable walls (front and back) up to the roof line
  for (const x of [X0 - 0.02, X1 + 0.02]) wl.quad([x, EV, Z0], [x, EV, Z1], [x, EV + RH, CZ], [x, EV + RH, CZ]);
  wl.tri([X0 - 0.02, EV, Z0], [X0 - 0.02, EV, Z1], [X0 - 0.02, EV + RH, CZ]); wl.tri([X1 + 0.02, EV, Z1], [X1 + 0.02, EV, Z0], [X1 + 0.02, EV + RH, CZ]);
  // ochre dado along the base of every wall
  for (const [a, b] of [[[X0, Z0], [X1, Z0]], [[X1, Z0], [X1, Z1]], [[X1, Z1], [X0, Z1]], [[X0, Z1], [X0, Z0]]]){
    const n2 = nrm(a, b, CX, CZ); oc.wq(a, b, n2, 0.05, 0, 1, lo + 1, F + 0.9);
  }
  // red tile roof with tile courses (ridges of the barrel tiles) and an overhang
  gable(g, CX, CZ, L + 1.2, W + 1.6, EV - 0.1, RH + 0.15, TL, 0);
  for (let x = X0 - 0.4; x < X1 + 0.5; x += 0.7) for (const s of [-1, 1]){
    const a = [x, EV - 0.05 + 0.08, CZ + s*(W/2 + 0.8)], b = [x, EV + RH + 0.08, CZ];
    tl.quad(a, [x + 0.22, a[1], a[2]], [x + 0.22, b[1], b[2]], b);
  }
  tl.box(L + 1.3, 0.35, 0.6, CX, EV + RH - 0.05, CZ, 0);
  // front (west): arched door, choir window, the steps down to Mission Boulevard, a small cross on the gable
  const fx = X0 - 0.06;
  LShape(g, rA(1.4, 4.6, 10), 0.3, fx, F, CZ, WD, -HP);
  LShape(g, rA(1.85, 5.2, 10), 0.2, fx - 0.03, F - 0.1, CZ, WH2, -HP);
  dk.quad([fx - 0.05, EV + 0.6, CZ - 0.6], [fx - 0.05, EV + 0.6, CZ + 0.6], [fx - 0.05, EV + 2.0, CZ + 0.6], [fx - 0.05, EV + 2.0, CZ - 0.6]);
  const gf = gy(X0 - 4, CZ); for (let k = 0; F - k*0.3 > gf - 0.2; k++) wl.box(1.6, F - k*0.3 - (gf - 1), 6.4, X0 - 0.8 - k*1.0 - 0.8, gf - 1, CZ, 0);
  wd.box(0.25, 2.2, 0.25, X0 + 0.2, EV + RH + 0.1, CZ, 0); wd.box(0.25, 0.25, 1.3, X0 + 0.2, EV + RH + 1.5, CZ, 0);
  // side windows: small deep-set openings high in the walls; doors on the south side
  for (const x of [-18, -9, 0, 9, 17]) for (const z of [Z0 - 0.05, Z1 + 0.05]){ if (z < 0 && x === 0) continue; const sgn = z < 0 ? -1 : 1;
    dk.quad([x - 0.7, F + 3.6, z], [x + 0.7, F + 3.6, z], [x + 0.7, F + 5.8, z], [x - 0.7, F + 5.8, z]); }
  dk.quad([-4, F, Z1 + 0.06], [-2, F, Z1 + 0.06], [-2, F + 3.2, Z1 + 0.06], [-4, F + 3.2, Z1 + 0.06]);
  // buttresses / stubs of the old annex walls on the north side (the OSM outline), and the north annex
  for (const [a, b] of [[-16.5, -12.4], [5.6, 10.1], [19.1, 23.1]]){
    const cx = (a + b)/2, w = b - a, zs = -11, glo = gy(cx, zs) - 1;
    wl.box(w, F + 3.0 - glo, 3.8, cx, glo, Z0 - 1.85, 0);
    wl.quad([a, F + 3.0, zs], [b, F + 3.0, zs], [b, F + 6.2, Z0], [a, F + 6.2, Z0]);
    wl.tri([a, F + 3.0, zs], [a, F + 6.2, Z0], [a, F + 3.0, Z0]); wl.tri([b, F + 3.0, zs], [b, F + 3.0, Z0], [b, F + 6.2, Z0]);
  }
  { const a = -9.3, b = 2.7, glo = gy(-3, -9) - 1; wl.box(b - a, F + 4.6 - glo, 3.6, (a + b)/2, glo, Z0 - 1.8, 0);
    const p0 = [a - 0.3, F + 4.4, Z0 - 3.9], p1 = [b + 0.3, F + 4.4, Z0 - 3.9], p2 = [b + 0.3, F + 5.8, Z0], p3 = [a - 0.3, F + 5.8, Z0];
    LTris(g, [...p0, ...p1, ...p2, ...p0, ...p2, ...p3], TL2);
    dk.quad([-5.2, F, Z0 - 3.65], [-3.2, F, Z0 - 3.65], [-3.2, F + 2.9, Z0 - 3.65], [-5.2, F + 2.9, Z0 - 3.65]); }
  // the bell tower at the north-west corner: adobe base, belfry with arched openings and four bells, low tile cap, cross
  { const tx = -22.3, tz = -7.6, tw = 7.4, td = 7.6, tb = gy(tx, tz) - 1.5, t1 = F + 10.2, t2 = t1 + 3.8;
    wl.box(tw, t1 - tb, td, tx, tb, tz, 0);
    wl.box(tw + 0.5, 0.45, td + 0.5, tx, t1 - 0.2, tz, 0);
    // belfry: four corner piers and a top band, with the bells inside
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) wl.box(1.5, t2 - t1, 1.5, tx + sx*(tw/2 - 0.75), t1, tz + sz*(td/2 - 0.75), 0);
    for (const sx of [-1, 1]){ wl.box(tw, 1.0, 1.0, tx, t2 - 1.0, tz + sx*(td/2 - 0.5), 0); wl.box(1.0, 1.0, td, tx + sx*(tw/2 - 0.5), t2 - 1.0, tz, 0);
      wl.box(1.2, t2 - 1 - t1, 0.9, tx, t1, tz + sx*(td/2 - 0.45), 0); wl.box(0.9, t2 - 1 - t1, 1.2, tx + sx*(tw/2 - 0.45), t1, tz, 0); }
    wl.box(tw - 0.6, 0.5, td - 0.6, tx, t1, tz, 0);
    // round arches over the eight belfry openings
    const AF = archFill(0.8, t2 - 1.85, t2 - 0.95, 8);
    for (const d of [-1.4, 1.4]) for (const sz of [-1, 1]){
      LShape(g, AF, 0.9, tx + d, 0, tz + sz*(td/2 - 0.45), WH, 0);
      LShape(g, AF, 0.9, tx + sz*(tw/2 - 0.45), 0, tz + d, WH, HP);
    }
    for (const [bx, bz] of [[-1.5, -1.6], [1.5, -1.6], [-1.5, 1.6], [1.5, 1.6]]){ LCone(g, 0.62, 1.05, tx + bx, t2 - 2.15, tz + bz, BEL, 10); wd.box(0.15, 0.4, 0.15, tx + bx, t2 - 1.15, tz + bz, 0); }
    wl.box(tw + 0.6, 0.5, td + 0.6, tx, t2, tz, 0);
    LCone(g, (tw + 0.4)*0.72, 2.0, tx, t2 + 0.5, tz, TL, 4, PI/4);
    wd.box(0.22, 2.0, 0.22, tx, t2 + 2.3, tz, 0); wd.box(0.22, 0.22, 1.1, tx, t2 + 3.6, tz, 0);
    // the old wall stub along the sidewalk north of the tower (the cemetery wall with the marker)
    const glo = gy(-30, -11) - 1; wl.box(8.5, F + 1.4 - glo, 0.8, -30.5, glo, -11.0, 0); tl.box(8.7, 0.25, 1.2, -30.5, F + 1.4, -11, 0);
  }
  wl.out(g, WH); oc.out(g, OC); tl.out(g, TL2); dk.out(g, DK); wd.out(g, IR);
  return g; }};

for (const k of Object.keys(E2P)) if (LANDMARKS[k]) SG_PLACES.push({type:k, lat:E2P[k].lat, lon:E2P[k].lon, rot:E2P[k].rot});
}
