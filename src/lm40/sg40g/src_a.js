// ---------- shared helpers (block-scoped) ----------
const PI = Math.PI, HP = PI/2, TAU = PI*2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a)*t;
const pArea = P => { let s = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length]; s += a[0]*b[1] - b[0]*a[1]; } return s/2; };
const pCen = P => { let x = 0, z = 0; for (const p of P){ x += p[0]; z += p[1]; } return [x/P.length, z/P.length]; };
// miter offset of a closed ring (d > 0 grows it), miter length clamped
function offs(P, d){
  const n = P.length, sg = pArea(P) > 0 ? -1 : 1, out = [];
  for (let i = 0; i < n; i++){
    const a = P[(i - 1 + n) % n], b = P[i], c = P[(i + 1) % n];
    let e1x = b[0] - a[0], e1z = b[1] - a[1], e2x = c[0] - b[0], e2z = c[1] - b[1];
    const l1 = Math.hypot(e1x, e1z) || 1, l2 = Math.hypot(e2x, e2z) || 1; e1x /= l1; e1z /= l1; e2x /= l2; e2z /= l2;
    const n1x = sg*e1z, n1z = -sg*e1x, n2x = sg*e2z, n2z = -sg*e2x;
    let mx = n1x + n2x, mz = n1z + n2z; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
    const k = clamp(1/Math.max(0.35, mx*n1x + mz*n1z), 1, 2.2);
    out.push([b[0] + mx*d*k, b[1] + mz*d*k]);
  }
  return out;
}
// triangle batcher: one LTris per colour spec
function mkB(){
  const M = new Map();
  const B = {
    add(col, arr){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } const A = e.a; for (let i = 0; i < arr.length; i++) A.push(arr[i]); },
    tri(col, a, b, c){ B.add(col, [a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]]); },
    quad(col, a, b, c, d){ B.add(col, [a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2]]); },
    // oriented box: centre x,z, bottom y, size w (along ry dir) h d
    box(col, x, y, z, w, h, d, ry){ const c = Math.cos(ry || 0), s = Math.sin(ry || 0), P = (u, v, yy) => [x + u*c + v*s, yy, z - u*s + v*c];
      const hw = w/2, hd = d/2, y1 = y + h, a = P(-hw, -hd, y), b = P(hw, -hd, y), cc = P(hw, hd, y), dd = P(-hw, hd, y), e = P(-hw, -hd, y1), f = P(hw, -hd, y1), gg = P(hw, hd, y1), hh = P(-hw, hd, y1);
      B.quad(col, a, b, f, e); B.quad(col, b, cc, gg, f); B.quad(col, cc, dd, hh, gg); B.quad(col, dd, a, e, hh); B.quad(col, e, f, gg, hh); },
    // square-section member between two points
    beam(col, a, b, r){ const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz); if (L < 1e-3) return;
      const ux = dx/L, uy = dy/L, uz = dz/L; let px = -uz, py = 0, pz = ux; if (Math.abs(uy) > 0.9){ px = 1; py = 0; pz = 0; } const pl = Math.hypot(px, py, pz); px /= pl; py /= pl; pz /= pl;
      const qx = uy*pz - uz*py, qy = uz*px - ux*pz, qz = ux*py - uy*px, C = [];
      for (const [s, t] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) C.push([px*s*r + qx*t*r, py*s*r + qy*t*r, pz*s*r + qz*t*r]);
      for (let i = 0; i < 4; i++){ const p = C[i], q = C[(i + 1) % 4]; B.quad(col, [a[0] + p[0], a[1] + p[1], a[2] + p[2]], [a[0] + q[0], a[1] + q[1], a[2] + q[2]], [b[0] + q[0], b[1] + q[1], b[2] + q[2]], [b[0] + p[0], b[1] + p[1], b[2] + p[2]]); } },
    // vertical band along a closed ring (outer face strip)
    band(col, P, y0, h, d){ const R = d ? offs(P, d) : P; for (let i = 0; i < R.length; i++){ const a = R[i], b = R[(i + 1) % R.length]; B.quad(col, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y0 + h, b[1]], [a[0], y0 + h, a[1]]); } },
    flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); }
  };
  return B;
}
const rotXZ = (x, z, a) => [x*Math.cos(a) - z*Math.sin(a), x*Math.sin(a) + z*Math.cos(a)];

// =====================================================================================================
// SkyVille@Dawson (WOHA, 2015): three 47-storey diamond towers (four angled wings round a court each) on the real OSM
// outlines (w440538818 / w440538815 / w408163451, outline w440538817); 147.8 m (skyscrapercenter / Architectural Record);
// 11-storey "villages" with an open sky garden between them, roof gardens with PV frames. All precast concrete.
// =====================================================================================================
{
const FH = 3.0, TOP = 147.8, ROOF = 141.6;
// storeys 1-11 village, 12 garden, 13-23, 24 garden, 25-35, 36 garden, 37-47
const GARD = [12, 24, 36];
LANDMARKS.sgskyville = {zh:'达士敦天空村', en:'SkyVille@Dawson', cat:'new', r:96, h:TOP, lt:{m:1, c:'#ffe7c4', k:0.75},
  build(){
    const g = new THREE.Group(), B = mkB();
    const WIN = {c:'#aeb6ba', m:1, fh:FH, cw:2.4}, SLAB = '#f1f0ec', FIN = '#e4e2dc', DARK = '#6c7478', GRN = '#557f43', GRN2 = '#6b9a52', PV = {c:'#2c3442'}, STEEL = '#9aa0a4';
    const T = [SV1, SV2, SV3];
    for (const R of T){
      const core = offs(R, -0.7), inner = offs(R, -2.6);
      // void deck (open ground floor with columns) + foundation
      LPoly(g, inner, -5, 5 + FH, DARK);
      // villages
      let s0 = 1;
      for (const gs of [...GARD, 48]){
        const y0 = (s0 - 1)*FH, y1 = (gs - 1)*FH;
        if (s0 === 1) LPoly(g, core, FH, y1 - FH, WIN); else LPoly(g, core, y0, y1 - y0, WIN);
        s0 = gs + 1;
      }
      // sky-garden storeys: deep recess
      for (const gs of GARD) LPoly(g, inner, (gs - 1)*FH, FH, DARK);
      // slab edges every storey, sunshade ledges every storey (horizontal shades)
      for (let s = 1; s <= 48; s++){ const y = (s - 1)*FH; B.band(SLAB, R, y - 0.45, 0.75, 0.08); if (s > 1 && !GARD.includes(s - 1)) B.band(FIN, R, y + 1.95, 0.22, 0.6); }
      // vertical fins (precast mullions) at every outline corner + mid-span on long edges
      for (let i = 0; i < R.length; i++){
        const a = R[i], b = R[(i + 1) % R.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const n = L > 9 ? Math.round(L/4.5) : 1;
        for (let k = 0; k < n; k++){ const t = (k + 0.5)/n, x = lerp(a[0], b[0], t), z = lerp(a[1], b[1], t), ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
          for (const [v0, v1] of [[1, 11], [13, 23], [25, 35], [37, 47]]) B.box(FIN, x, (v0 - 1)*FH, z, 0.5, (v1 - v0 + 1)*FH, 1.0, -ang); }
      }
      // ground-floor columns
      for (let i = 0; i < R.length; i += 3){ const p = offs(R, -1.6)[i]; B.box(SLAB, p[0], 0, p[1], 0.8, FH, 0.8, 0); }
    }
    // sky gardens: the shared outline as garden slabs between the towers, planters and trees
    const O = SVO, r = LMCTX.rng;
    for (const gs of GARD){
      const y = (gs - 1)*FH;
      LPoly(g, offs(O, 0.2), y - 0.6, 0.6, SLAB);
      B.band(SLAB, O, y, 1.1, 0.25);
      for (let k = 0; k < 40; k++){
        const R = T[k % 3], c = pCen(R), p = R[(k*7) % R.length], t = 0.25 + r()*0.45, x = lerp(c[0], p[0], t), z = lerp(c[1], p[1], t);
        LSph(g, 1.6 + r()*1.2, x, y + 1.6, z, k % 2 ? GRN : GRN2, 0.8, 7);
      }
      // garden-level columns at the outline corners
      for (let i = 0; i < O.length; i += 2){ const p = offs(O, -1.2)[i]; B.box(STEEL, p[0], y, p[1], 0.7, FH - 0.6, 0.7, 0); }
    }
    // roof: slab, parapet, roof garden, PV arrays on steel frames up to the top
    LPoly(g, offs(O, 0.2), ROOF - 0.6, 0.6, SLAB);
    for (const R of T){ LPoly(g, offs(R, -0.7), (47*FH), ROOF - 47*FH, DARK); B.band(SLAB, R, ROOF, 1.2, 0.2); }
    for (let k = 0; k < 30; k++){ const R = T[k % 3], c = pCen(R), p = R[(k*11) % R.length], t = 0.2 + r()*0.5; LSph(g, 1.4 + r(), lerp(c[0], p[0], t), ROOF + 1.2, lerp(c[1], p[1], t), GRN, 0.7, 7); }
    for (const R of T){
      const c = pCen(R);
      for (let i = -2; i <= 2; i++){ for (const s of [-1, 1]){ B.beam(STEEL, [c[0] + i*5, ROOF, c[1] + s*7], [c[0] + i*5, TOP - 0.4, c[1] + s*7], 0.18); } }
      B.box(STEEL, c[0], TOP - 0.6, c[1], 24, 0.25, 16, 0);
      B.box(PV, c[0], TOP - 0.35, c[1], 23, 0.2, 15, 0);
    }
    B.flush(g);
    return g; }};
SG_PLACES.push({type:'sgskyville', lat:1.295811, lon:103.809898, rot:0});
}

// =====================================================================================================
// Sun Yat Sen Nanyang Memorial Hall (Wan Qing Yuan, 1902; national monument): two-storey villa, open verandahs at the front
// and sides, Corinthian columns, continuous storey cornices, arched windows/doors, louvred windows, curved porte-cochere
// (roots.gov.sg MUSE "Monument Focus"). Real OSM outline w271791487; the curved lobe on the west side is the porch.
// =====================================================================================================
{
LANDMARKS.sgsunyatsen = {zh:'晚晴园（孙中山南洋纪念馆）', en:'Sun Yat Sen Nanyang Memorial Hall', cat:'old', r:30, h:13, lt:{m:0, c:'#ffe2b8', k:0.8, e:0.6, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB();
    const WALL = '#f1ece0', CORN = '#fbf8f0', ROOFC = '#8e5a45', LOUV = '#3f5a4c', COL = '#faf7ef', RAIL = '#2e2e2c', BASE = '#c9c2b4';
    const R = SYS, G1 = 4.4, G2 = 8.4;
    // axes of the villa (long axis v ~ north-north-east)
    const v = [0.26, 0.966], u = [0.966, -0.26];
    LPoly(g, offs(R, 0.3), -5, 5.5, BASE);
    LPoly(g, offs(R, -0.4), 0.5, G2 - 0.5, WALL);
    // cornices
    B.band(CORN, R, G1 - 0.35, 0.5, 0.3); B.band(CORN, R, G2 - 0.5, 0.6, 0.45);
    LPoly(g, offs(R, 0.35), G1 - 0.15, 0.15, CORN);
    // arched openings: dark louvred windows with white arched surrounds on every long wall, both storeys
    const RW = offs(R, -0.33);
    for (let i = 0; i < RW.length; i++){
      const a = RW[i], b = RW[(i + 1) % RW.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 3.2) continue;
      const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), n = Math.max(1, Math.floor(L/3.1));
      for (let k = 0; k < n; k++){ const t = (k + 0.5)/n, x = lerp(a[0], b[0], t), z = lerp(a[1], b[1], t);
        for (const y0 of [1.1, G1 + 0.6]){
          B.box(LOUV, x, y0, z, 1.25, 2.3, 0.12, -ang);
          B.box(CORN, x, y0 + 2.3, z, 1.55, 0.35, 0.18, -ang);
          B.box(CORN, x, y0 - 0.15, z, 1.6, 0.15, 0.25, -ang);
        }
      }
    }
    // roofs: hipped over the west and east blocks, low hips over the bays
    const roofRect = (cx, cz, L, W, h) => hipRoof(g, cx, cz, L, W, G2 + 0.1, h, ROOFC, -Math.atan2(v[1], v[0]), 0.9);
    roofRect(-8.0, 4.0, 22.5, 13.6, 4.2);     // west block
    roofRect(6.9, -3.6, 34.0, 13.4, 4.6);     // east block
    roofRect(15.6, -2.6, 9.8, 4.6, 2.0);      // east bay
    // curved porte-cochere on the west lobe: columns on a half ring, flat roof with balustrade (first-floor verandah)
    const pc = [-16.6, 5.6];
    LCyl(g, 4.4, 4.4, 0.5, pc[0], G1 - 0.4, pc[1], CORN, 24);
    for (let k = 0; k <= 6; k++){ const a = PI*0.5 + PI*k/6 + Math.atan2(u[1], u[0]), x = pc[0] + Math.cos(a)*3.9, z = pc[1] + Math.sin(a)*3.9;
      LCyl(g, 0.24, 0.28, G1 - 0.8, x, 0.5, z, COL, 10); LBox(g, 0.7, 0.4, 0.7, x, G1 - 0.8, z, CORN);
      LCyl(g, 0.2, 0.22, G2 - G1 - 0.6, x, G1 + 0.1, z, COL, 10); LBox(g, 0.6, 0.35, 0.6, x, G2 - 0.6, z, CORN); }
    for (let k = 0; k < 6; k++){ const a0 = PI*0.5 + PI*k/6 + Math.atan2(u[1], u[0]), a1 = a0 + PI/6;
      B.beam(RAIL, [pc[0] + Math.cos(a0)*3.9, G1 + 1.0, pc[1] + Math.sin(a0)*3.9], [pc[0] + Math.cos(a1)*3.9, G1 + 1.0, pc[1] + Math.sin(a1)*3.9], 0.06);
      for (let j = 0; j < 4; j++){ const a = a0 + (a1 - a0)*j/4; B.beam(RAIL, [pc[0] + Math.cos(a)*3.9, G1 + 0.1, pc[1] + Math.sin(a)*3.9], [pc[0] + Math.cos(a)*3.9, G1 + 1.0, pc[1] + Math.sin(a)*3.9], 0.03); } }
    LCyl(g, 4.5, 4.6, 0.4, pc[0], G2 - 0.3, pc[1], CORN, 24);
    // front verandah: Corinthian columns along the west face of the west block (both storeys) with cast-iron balustrade
    const wa = [-17.9, -5.4], wb = [-11.9, 17.2];
    for (let k = 0; k <= 6; k++){ const t = k/6, x = lerp(wa[0], wb[0], t) - u[0]*0.9, z = lerp(wa[1], wb[1], t) - u[1]*0.9;
      if (Math.hypot(x - pc[0], z - pc[1]) < 4.6) continue;
      LCyl(g, 0.25, 0.28, G1 - 0.6, x, 0.5, z, COL, 10); LBox(g, 0.66, 0.4, 0.66, x, G1 - 0.6, z, CORN);
      LCyl(g, 0.21, 0.23, G2 - G1 - 0.6, x, G1 + 0.1, z, COL, 10); LBox(g, 0.58, 0.35, 0.58, x, G2 - 0.6, z, CORN); }
    B.beam(RAIL, [wa[0] - u[0]*0.9, G1 + 1.0, wa[1] - u[1]*0.9], [wb[0] - u[0]*0.9, G1 + 1.0, wb[1] - u[1]*0.9], 0.07);
    // steps
    LBox(g, 3.2, 0.5, 2.4, pc[0] - 4.9*u[0], 0.0, pc[1] - 4.9*u[1], BASE, -Math.atan2(u[1], u[0]));
    B.flush(g);
    return g; }};
SG_PLACES.push({type:'sgsunyatsen', lat:1.328116, lon:103.847183, rot:0});
}

// =====================================================================================================
// Maha Sasana Ramsi Burmese Buddhist Temple (Tai Gin Road; building opened 1991): white hall under a tiered roof with carved
// Burmese teak (roots.gov.sg; en.wikipedia). Real OSM outline w271791505 (46.7 x 18.3 m); entrance on the Tai Gin Road (west) end.
// =====================================================================================================
{
LANDMARKS.sgburmese = {zh:'缅甸玉佛寺', en:'Burmese Buddhist Temple', cat:'old', r:30, h:24, lt:{m:0, c:'#ffd9a0', k:0.85, e:0.5},
  build(){
    const g = new THREE.Group(), B = mkB();
    const WALL = '#f3efe6', TEAK = '#7a4a26', TEAK2 = '#5c3518', GOLD = {c:'#d4a640', glow:'#ffcf6a', gk:0.55}, BASE = '#bdb6a8', RED = '#8d2c22', WIN = '#4a3a2c';
    const R = BBT, ang = Math.atan2(R[1][1] - R[2][1], R[1][0] - R[2][0]);   // long axis, pointing east
    const L = 46.7, W = 18.3, ry = -ang, ux = Math.cos(ang), uz = Math.sin(ang), vx = -uz, vz = ux;
    const P = (s, t) => [s*ux + t*vx, t*vz + s*uz];
    LPoly(g, offs(R, 0.6), -5, 6.0, BASE);
    // storey walls
    LPoly(g, offs(R, -0.3), 1.0, 9.0, WALL);
    B.band('#e8e1d2', R, 5.2, 0.5, 0.25); B.band('#e8e1d2', R, 9.6, 0.6, 0.35);
    // arched windows (dark teak frames) along both long sides
    for (const t of [-1, 1]) for (let k = 0; k < 9; k++){ const s = -L/2 + 3 + k*(L - 6)/8, p = P(s, t*(W/2 + 0.02));
      for (const y0 of [1.8, 6.1]){ B.box(WIN, p[0], y0, p[1], 1.5, 2.4, 0.12, ry); B.box(TEAK, p[0], y0 + 2.4, p[1], 1.9, 0.3, 0.2, ry); } }
    // tiered teak roofs over the hall: three receding gabled tiers with carved fascia bands and gilded ridge finials
    let y = 10.2;
    const tiers = [[L + 2.0, W + 2.4, 2.6], [L*0.72, W*0.72, 2.4], [L*0.46, W*0.48, 2.2]];
    for (const [lt, wt, ht] of tiers){
      const c = P(4.0*(1 - lt/(L + 2)), 0);
      LFrust(g, lt, wt, lt*0.86, wt*0.62, ht*0.55, c[0], y, c[1], TEAK2, ry);
      gable(g, c[0], c[1], lt*0.86, wt*0.62, y + ht*0.55, ht*0.65, TEAK, ry);
      B.box(GOLD, c[0], y + ht*0.55 - 0.18, c[1], lt*0.88, 0.22, wt*0.64, ry);
      for (const s of [-0.5, 0.5]){ const p = P(s*lt*0.86, 0); const q = [c[0] + p[0], c[1] + p[1]]; LCone(g, 0.28, 1.6, q[0], y + ht*1.2 - 0.2, q[1], GOLD, 6); }
      y += ht*0.95;
    }
    // pyatthat spire over the entrance bay (west end): five diminishing tiers and a gilded finial
    const e = P(-L/2 + 5.5, 0);
    let ys = 10.2, s0 = 8.4;
    for (let k = 0; k < 5; k++){
      const sz = s0*(1 - k*0.17);
      LFrust(g, sz, sz, sz*0.66, sz*0.66, 1.3, e[0], ys, e[1], k % 2 ? TEAK2 : TEAK, ry);
      B.box(GOLD, e[0], ys + 1.3, e[1], sz*0.7, 0.18, sz*0.7, ry);
      LBox(g, sz*0.52, 0.8, sz*0.52, e[0], ys + 1.3, e[1], RED, ry);
      ys += 2.1;
    }
    LCone(g, 1.1, 3.0, e[0], ys, e[1], GOLD, 12);
    LCyl(g, 0.05, 0.05, 1.3, e[0], ys + 3.0, e[1], GOLD, 4);
    // entrance porch: steps and a gabled teak porch on four white columns
    const pe = P(-L/2 - 2.0, 0);
    LBox(g, 4.0, 1.0, 7.0, pe[0], 0, pe[1], BASE, ry);
    for (const t of [-2.6, 2.6]) for (const s of [-1.2, 1.2]){ const p = P(-L/2 - 2.0 + s, t); LCyl(g, 0.3, 0.3, 4.6, p[0], 1.0, p[1], WALL, 10); }
    gable(g, pe[0], pe[1], 4.4, 7.6, 5.6, 2.2, TEAK, ry);
    B.box(GOLD, pe[0], 5.45, pe[1], 4.5, 0.2, 7.7, ry);
    B.flush(g);
    return g; }};
SG_PLACES.push({type:'sgburmese', lat:1.328430, lon:103.846942, rot:0});
}

// =====================================================================================================
// Novena Church (Church of St Alphonsus, 300 Thomson Road): the conserved 1950 main hall by Swan & Maclaren, "eclectic-Modern"
// with a triple-arc front pediment (round stained-glass window and cross in the central arc, dentils), fluted Doric columns
// along the external corridors and the wide side porticoes (URA conservation portal NCTR-00001); expanded 2014-2017.
// Real OSM outline r2303556 (church + 2017 extension); the hall fronts Thomson Road (west).
// =====================================================================================================
{
LANDMARKS.sgnovena = {zh:'诺维娜教堂（圣亚风索堂）', en:'Church of St Alphonsus (Novena Church)', cat:'old', r:88, h:24, lt:{m:0, c:'#fff0d6', k:0.8, e:0.55, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB();
    const WALL = '#f2eee4', TRIM = '#fbfaf5', ROOFC = '#9c9a94', GLASS = {c:'#6f8fb0', glow:'#ffd48a', gk:0.5}, BASE = '#c8c2b6', COLC = '#f7f4ec', DARK = '#6b6760', GOLD = {c:'#d8c27a', glow:'#ffe39a', gk:0.6};
    const R = NOV;
    LPoly(g, offs(R, 0.3), -5, 5.3, BASE);
    // the 2017 extension (east wing) and the hall's walls: 11 m with a cornice, grilles as dark bands
    LPoly(g, offs(R, -0.3), 0.3, 10.7, WALL);
    B.band(TRIM, R, 10.4, 0.8, 0.35);
    LPoly(g, offs(R, -0.6), 11.0, 0.6, '#d9d5cb');
    // main hall: facade line (-44.8, 8.2)-(-59.1, -26.8) on Thomson Road; nave axis points away from it
    const fa = [-44.8, 8.2], fb = [-59.1, -26.8], fx = fb[0] - fa[0], fz = fb[1] - fa[1], FL = Math.hypot(fx, fz), ux = fx/FL, uz = fz/FL, nx = -uz, nz = ux;   // n points into the hall (east)
    const fm = [(fa[0] + fb[0])/2, (fa[1] + fb[1])/2], HL = 34, HW = 22, hc = [fm[0] + nx*HL/2, fm[1] + nz*HL/2], ryN = -Math.atan2(nz, nx);
    LBox(g, HL, 15.5, HW, hc[0], 0.3, hc[1], WALL, ryN);
    gable(g, hc[0], hc[1], HL + 1.0, HW + 1.2, 15.8, 6.2, ROOFC, ryN);
    B.box(TRIM, hc[0], 15.5, hc[1], HL + 1.2, 0.4, HW + 1.4, ryN);
    // clerestory windows along the hall
    for (const t of [-1, 1]) for (let k = 0; k < 7; k++){ const s = -HL/2 + 3 + k*(HL - 6)/6, x = hc[0] + nx*s + ux*t*(HW/2 + 0.05), z = hc[1] + nz*s + uz*t*(HW/2 + 0.05); B.box(GLASS, x, 11.6, z, 2.0, 3.0, 0.12, ryN); }
    // triple-arc front pediment: three round-arch gables on the facade, the central one taller, dentil band, round window, cross
    const fy = 15.5, F = (s, t) => [fm[0] + ux*s - nx*t, fm[1] + uz*s - nz*t], ryF = -Math.atan2(uz, ux);
    LBox(g, HW + 1.0, fy, 1.2, F(0, 0.4)[0], 0.3, F(0, 0.4)[1], WALL, ryF);
    for (const [s, hw, rise] of [[-8.6, 4.4, 3.2], [0, 6.2, 6.2], [8.6, 4.4, 3.2]]){
      const c = F(s, 0.5); const pts = [[-hw, 0]]; for (let i = 1; i < 14; i++){ const a = PI - PI*i/14; pts.push([Math.cos(a)*hw, Math.sin(a)*rise]); } pts.push([hw, 0]);
      LShape(g, pts, 1.3, c[0], fy, c[1], TRIM, ryF);
      const pts2 = pts.map(p => [p[0]*1.04, p[1]*1.04 + 0.15]); LShape(g, pts2, 0.3, F(s, 1.25)[0], fy, F(s, 1.25)[1], '#e6e1d6', ryF);
    }
    for (let k = -14; k <= 14; k++){ const p = F(k*0.9, 1.15); B.box(TRIM, p[0], fy - 0.6, p[1], 0.35, 0.35, 0.3, ryF); }
    { const c = F(0, 1.3); LShape(g, Array.from({length:20}, (_, i) => [Math.cos(i/20*TAU)*1.9, Math.sin(i/20*TAU)*1.9]), 0.25, c[0], fy + 2.6, c[1], GLASS, ryF); }
    { const c = F(0, 0.5); LBox(g, 0.35, 2.4, 0.35, c[0], fy + 6.2, c[1], GOLD, ryF); LBox(g, 1.5, 0.35, 0.35, c[0], fy + 7.6, c[1], GOLD, ryF); }
    // front portico: fluted Doric columns (12-sided shafts) carrying a flat entablature
    for (let k = -5; k <= 5; k++){ const p = F(k*2.4, 3.0); LCyl(g, 0.42, 0.46, 6.4, p[0], 0.3, p[1], COLC, 12); LBox(g, 1.1, 0.4, 1.1, p[0], 6.7, p[1], TRIM, ryF); }
    { const p = F(0, 3.0); LBox(g, 28, 1.0, 1.4, p[0], 7.1, p[1], TRIM, ryF); LBox(g, 28, 0.3, 3.8, F(0, 1.8)[0], 7.8, F(0, 1.8)[1], TRIM, ryF); }
    // side porticoes (late 1950s) along both long sides of the hall: column rows and flat roofs
    for (const t of [-1, 1]){
      for (let k = 0; k < 9; k++){ const s = -HL/2 + 2 + k*(HL - 4)/8, x = hc[0] + nx*s + ux*t*(HW/2 + 3.2), z = hc[1] + nz*s + uz*t*(HW/2 + 3.2); LCyl(g, 0.36, 0.4, 5.4, x, 0.3, z, COLC, 12); }
      const c = [hc[0] + ux*t*(HW/2 + 1.8), hc[1] + uz*t*(HW/2 + 1.8)]; LBox(g, HL, 0.7, 4.0, c[0], 5.7, c[1], TRIM, ryN);
      // grilles (dark lattice) in the hall's side walls
      for (let k = 0; k < 7; k++){ const s = -HL/2 + 3 + k*(HL - 6)/6, x = hc[0] + nx*s + ux*t*(HW/2 + 0.06), z = hc[1] + nz*s + uz*t*(HW/2 + 0.06); B.box(DARK, x, 1.2, z, 2.6, 3.8, 0.1, ryN); }
    }
    B.flush(g);
    return g; }};
SG_PLACES.push({type:'sgnovena', lat:1.321809, lon:103.842826, rot:0});
}
