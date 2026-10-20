// ===== bay/sfdt2 — six San Francisco landmarks for the City Brush Bay Area 1:1 map (v29, wave lm26)
// Keys: sfmoma (SFMOMA: Botta's 1995 stepped brick museum with the striped, obliquely cut oculus + Snohetta's 2016 rippled white
// extension behind it), sfoldmint (the Old U.S. Mint, 1874, Greek Revival "Granite Lady"), sfdewey (Dewey Monument, 1903, and the
// Union Square plaza with its palms and pavilions), sfcolumbus (Columbus Tower / Sentinel Building, 1907, copper-green flatiron),
// sfsspp (Saints Peter and Paul Church, 1924, twin white spires on Washington Square), sflefty (Lefty O'Doul Bridge, 1933 Strauss
// heel-trunnion bascule over Mission Creek; the road deck is the app's own).
// (sfpier39 is not built here: Pier 39 — shops, the two-tier carousel and the sea-lion floats — is already modelled by
//  bay/sfwater as pier39 / pier39b / pier39c.)
// Every model is built in the local frame of its reference anchor (x east, z south, metres; bay/ref_sfdt2.json, the church in
// bay/ref_sfdt2_1.json) on the real OSM footprints, then placed with rot 0 so that the model origin is the structure's centre.
// Buildings on a rotated street grid get an inner group turned to the grid (u along the street, v across). No text or logos.
{
const PI = Math.PI, TAU = PI*2, HP = PI/2;
const ANC = {sfmoma:[37.7857, -122.4011], sfoldmint:[37.78275, -122.407], sfdewey:[37.78795, -122.4075], sfcolumbus:[37.7966, -122.40545],
  sfsspp:[37.8016, -122.4103], sflefty:[37.7765, -122.3893]};
const place = (k, ox, oz) => SG_PLACES.push({type:k, lat:+(ANC[k][0] - oz/110989).toFixed(7), lon:+(ANC[k][1] + ox/88300).toFixed(7), rot:0});
const baseNow = () => (LMCTX && LMCTX.u && LMCTX.u.base) ? LMCTX.u.base.value : 0;
// ref frame inside the model group (origin moved to the placement point ox, oz)
function frame(g, ox, oz, dy){ const s = new THREE.Group(); s.position.set(-ox, dy || 0, -oz); g.add(s); return s; }
// building frame in the ref frame: centre (cx, cz); local x (u) points at angle th from +x towards +z, local z (v) at th + 90 deg
function bframe(s, cx, cz, th){ const b = new THREE.Group(); b.position.set(cx, 0, cz); b.rotation.y = -th; s.add(b); return b; }
// ---------- triangle batches: one LTris call per colour per group
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const q4 = (o, a, b, c, d) => o.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2]);
const t3 = (o, a, b, c) => o.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
function box(o, x0, x1, y0, y1, z0, z1, bot){
  const A = [x0, y0, z0], B = [x1, y0, z0], C = [x1, y0, z1], D = [x0, y0, z1], E = [x0, y1, z0], F = [x1, y1, z0], G = [x1, y1, z1], H = [x0, y1, z1];
  q4(o, E, H, G, F); q4(o, A, B, F, E); q4(o, B, C, G, F); q4(o, C, D, H, G); q4(o, D, A, E, H); if (bot) q4(o, A, D, C, B);
}
// oriented box: centre (cx, cz), long axis at angle th (x towards z), length L, width W
function obox(o, cx, cz, L, W, y0, y1, th){
  const c = Math.cos(th || 0), s = Math.sin(th || 0), l = L/2, w = W/2, P = (u, v, y) => [cx + u*c - v*s, y, cz + u*s + v*c];
  const A = P(-l, -w, y0), B = P(l, -w, y0), C = P(l, w, y0), D = P(-l, w, y0), E = P(-l, -w, y1), F = P(l, -w, y1), G = P(l, w, y1), H = P(-l, w, y1);
  q4(o, E, H, G, F); q4(o, A, B, F, E); q4(o, B, C, G, F); q4(o, C, D, H, G); q4(o, D, A, E, H);
}
// square-section member between two 3-D points (half width w)
function beam(o, a, b, w){
  let dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]; const L = Math.hypot(dx, dy, dz); if (L < 1e-4) return; dx /= L; dy /= L; dz /= L;
  let sx = -dz, sz = dx; const sl = Math.hypot(sx, sz); if (sl < 1e-3){ sx = 1; sz = 0; } else { sx /= sl; sz /= sl; }
  const ux = -sz*dy, uy = sz*dx - sx*dz, uz = sx*dy, P = (p, i, j) => [p[0] + sx*w*i + ux*w*j, p[1] + uy*w*j, p[2] + sz*w*i + uz*w*j];
  const a1 = P(a, -1, -1), a2 = P(a, 1, -1), a3 = P(a, 1, 1), a4 = P(a, -1, 1), b1 = P(b, -1, -1), b2 = P(b, 1, -1), b3 = P(b, 1, 1), b4 = P(b, -1, 1);
  q4(o, a1, a2, b2, b1); q4(o, a2, a3, b3, b2); q4(o, a3, a4, b4, b3); q4(o, a4, a1, b1, b4);
}
const area2 = R => { let s = 0; for (let i = 0; i < R.length; i++){ const a = R[i], b = R[(i+1) % R.length]; s += a[0]*b[1] - b[0]*a[1]; } return s/2; };
function cap(o, R, y, holes){
  const H = holes || [], tri = THREE.ShapeUtils.triangulateShape(R.map(p => new THREE.Vector2(p[0], p[1])), H.map(h => h.map(p => new THREE.Vector2(p[0], p[1]))));
  const all = R.concat(...H);
  for (const [a, b, c] of tri) t3(o, [all[a][0], y, all[a][1]], [all[c][0], y, all[c][1]], [all[b][0], y, all[b][1]]);
}
function walls(o, R, y0, y1){ const n = R.length; for (let i = 0; i < n; i++){ const a = R[i], b = R[(i+1) % n]; q4(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); } }
function prism(o, R, y0, y1, top){ walls(o, R, y0, y1); if (top !== false) cap(o, R, y1); }
// ring offset (positive = outward), miter limited
function offRing(R, d){
  const s = area2(R) > 0 ? 1 : -1, n = R.length, out = [];
  for (let i = 0; i < n; i++){
    const p = R[(i + n - 1) % n], c = R[i], q = R[(i+1) % n];
    const e1 = [c[0] - p[0], c[1] - p[1]], e2 = [q[0] - c[0], q[1] - c[1]], l1 = Math.hypot(...e1) || 1, l2 = Math.hypot(...e2) || 1;
    const n1 = [s*e1[1]/l1, -s*e1[0]/l1], n2 = [s*e2[1]/l2, -s*e2[0]/l2];
    let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
    const k = Math.min(3, 1/Math.max(0.3, mx*n1[0] + mz*n1[1]));
    out.push([c[0] + mx*d*k, c[1] + mz*d*k]);
  }
  return out;
}
// strip between two rings at heights ya (ring A) and yb (ring B)
function ringStrip(o, A, B, ya, yb){ const n = A.length; for (let i = 0; i < n; i++){ const j = (i+1) % n; q4(o, [A[i][0], ya, A[i][1]], [A[j][0], ya, A[j][1]], [B[j][0], yb, B[j][1]], [B[i][0], yb, B[i][1]]); } }
// projecting band (cornice / string course) around a ring
function band(o, R, y0, y1, out){ const Ro = offRing(R, out); walls(o, Ro, y0, y1); ringStrip(o, R, Ro, y0, y0); ringStrip(o, R, Ro, y1, y1); }
// openings along the edges of a ring: quads parallel to each wall, 'off' outside it; fn(i, t, L) may veto one
function winRow(o, R, y, h, w, step, off, minL, fn){
  const s = area2(R) > 0 ? 1 : -1, n = R.length;
  for (let i = 0; i < n; i++){
    const a = R[i], b = R[(i+1) % n], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz); if (L < (minL || 2.5)) continue;
    const ux = dx/L, uz = dz/L, nx = s*uz, nz = -s*ux, k = Math.max(1, Math.floor(L/step)), sp = L/k;
    for (let j = 0; j < k; j++){
      const t = sp*(j + 0.5); if (fn && !fn(i, t, L)) continue;
      const cx = a[0] + ux*t + nx*off, cz = a[1] + uz*t + nz*off;
      q4(o, [cx - ux*w/2, y, cz - uz*w/2], [cx + ux*w/2, y, cz + uz*w/2], [cx + ux*w/2, y + h, cz + uz*w/2], [cx - ux*w/2, y + h, cz - uz*w/2]);
    }
  }
}
// flat quad on an axis plane: 'x' face at x (spanning z0..z1), or 'z' face at z (spanning x0..x1)
const fx = (o, x, z0, z1, y0, y1) => q4(o, [x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0]);
const fz = (o, z, x0, x1, y0, y1) => q4(o, [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]);
// round-arched opening outline (half width hw, springing at ys, crown at ys + hw) as a flat panel at plane z (facing +/-z)
function archZ(o, cx, z, hw, y0, ys, n){ n = n || 8; const P = [[cx - hw, y0], [cx + hw, y0]]; for (let i = 0; i <= n; i++){ const a = PI*i/n; P.push([cx + Math.cos(a)*hw, ys + Math.sin(a)*hw]); }
  // fan: bottom rectangle + half disc
  q4(o, [cx - hw, y0, z], [cx + hw, y0, z], [cx + hw, ys, z], [cx - hw, ys, z]);
  for (let i = 0; i < n; i++){ const a0 = PI*i/n, a1 = PI*(i+1)/n; t3(o, [cx, ys, z], [cx + Math.cos(a0)*hw, ys + Math.sin(a0)*hw, z], [cx + Math.cos(a1)*hw, ys + Math.sin(a1)*hw, z]); } }
function archX(o, x, cz, hw, y0, ys, n){ n = n || 8;
  q4(o, [x, y0, cz - hw], [x, y0, cz + hw], [x, ys, cz + hw], [x, ys, cz - hw]);
  for (let i = 0; i < n; i++){ const a0 = PI*i/n, a1 = PI*(i+1)/n; t3(o, [x, ys, cz], [x, ys + Math.sin(a0)*hw, cz + Math.cos(a0)*hw], [x, ys + Math.sin(a1)*hw, cz + Math.cos(a1)*hw]); } }
// disc (rose window) in a z plane
function discZ(o, cx, cy, z, r, n){ for (let i = 0; i < n; i++){ const a0 = TAU*i/n, a1 = TAU*(i+1)/n; t3(o, [cx, cy, z], [cx + Math.cos(a0)*r, cy + Math.sin(a0)*r, z], [cx + Math.cos(a1)*r, cy + Math.sin(a1)*r, z]); } }
// cylinder / cone surfaces into a batch
function cylB(o, cx, cz, r0, r1, y0, y1, n, a0){ a0 = a0 || 0; for (let i = 0; i < n; i++){ const a = a0 + TAU*i/n, b = a0 + TAU*(i+1)/n;
  q4(o, [cx + Math.cos(a)*r0, y0, cz + Math.sin(a)*r0], [cx + Math.cos(b)*r0, y0, cz + Math.sin(b)*r0], [cx + Math.cos(b)*r1, y1, cz + Math.sin(b)*r1], [cx + Math.cos(a)*r1, y1, cz + Math.sin(a)*r1]); } }
function discB(o, cx, cz, r, y, n, a0){ a0 = a0 || 0; for (let i = 0; i < n; i++){ const a = a0 + TAU*i/n, b = a0 + TAU*(i+1)/n; t3(o, [cx, y, cz], [cx + Math.cos(b)*r, y, cz + Math.sin(b)*r], [cx + Math.cos(a)*r, y, cz + Math.sin(a)*r]); } }
// lathe profile [[r, y], ...] into a batch
function latheB(o, cx, cz, P, n, a0){ for (let k = 0; k < P.length - 1; k++) cylB(o, cx, cz, P[k][0], P[k+1][0], P[k][1], P[k+1][1], n, a0); }
// pyramid (square or n-gon) roof
function pyrB(o, cx, cz, r, y0, h, n, a0){ for (let i = 0; i < n; i++){ const a = a0 + TAU*i/n, b = a0 + TAU*(i+1)/n; t3(o, [cx + Math.cos(a)*r, y0, cz + Math.sin(a)*r], [cx + Math.cos(b)*r, y0, cz + Math.sin(b)*r], [cx, y0 + h, cz]); } }
// a Canary Island date palm: trunk + a crown of arching fronds
function palm(oT, oF, x, y, z, h, r){
  const lean = (r() - 0.5)*0.6, la = r()*TAU, tx = x + Math.cos(la)*lean, tz = z + Math.sin(la)*lean;
  cylB(oT, x, z, 0.42, 0.34, y, y + h*0.55, 6); cylB(oT, x, z, 0.34, 0.36, y + h*0.55, y + h, 6);
  // leaf-base knob
  cylB(oT, tx, tz, 0.36, 0.75, y + h - 0.2, y + h + 0.6, 6); cylB(oT, tx, tz, 0.75, 0.2, y + h + 0.6, y + h + 1.2, 6);
  const n = 16, top = [tx, y + h + 0.8, tz];
  for (let i = 0; i < n; i++){
    const a = TAU*i/n + r()*0.3, L = 4.2 + r()*1.1, up = (i % 2 ? 0.55 : 0.15) + r()*0.25, ca = Math.cos(a), sa = Math.sin(a), w = 0.55;
    let prev = top, pl = [top[0] - sa*0.1, top[1], top[2] + ca*0.1], pr = [top[0] + sa*0.1, top[1], top[2] - ca*0.1];
    for (let k = 1; k <= 4; k++){
      const t = k/4, d = L*t, yy = top[1] + up*L*t - 1.9*t*t*L/4.6, ww = w*Math.sin(PI*Math.min(0.95, t*0.9 + 0.1));
      const c = [top[0] + ca*d, yy, top[2] + sa*d], l = [c[0] - sa*ww, c[1] - 0.12, c[2] + ca*ww], rr = [c[0] + sa*ww, c[1] - 0.12, c[2] - ca*ww];
      q4(oF, pl, l, c, prev); q4(oF, prev, c, rr, pr); prev = c; pl = l; pr = rr;
    }
  }
}

// =====================================================================================================================
// Columbus Tower / Sentinel Building (1907, Salfield & Kohlberg): a slim triangular flatiron at Kearny Street and Columbus
// Avenue, its rounded prow pointing north up Columbus, clad in copper sheet weathered to a pale verdigris green, white window
// sashes, a cream masonry ground floor with shopfronts, a main cornice under an attic storey, and a copper cupola over the prow.
// Footprint = OSM "Sentinel Building" (ref_sfdt2 / sfcolumbus); the south wall is a party wall with the Golden Coin Building.
// =====================================================================================================================
LANDMARKS.sfcolumbus = {zh:'哥伦布大厦（哨兵大厦）', en:'Columbus Tower (Sentinel Building)', cat:'old', r:16, h:35,
  lt:{m:0, c:'#ffe2b8', k:0.55, e:0.4},
  build(){
    const g = new THREE.Group(), s = frame(g, 36.5, 5.0), B = mkB(), r = LMCTX.rng;
    const COP = {c:'#6fa391'}, COP2 = {c:'#5a8d7b'}, CREAM = '#e4dccb', SASH = '#f1eee6', GLASS = {c:'#2d3a3c', m:1, fh:3.25, cw:1.9, lk:0.4},
      SHOP = {c:'#2f2b26', glow:'#ffcf8f', gk:0.8}, ROOF = '#6b6f6c', DOME = {c:'#79ad9a'};
    // footprint: Kearny face (west), Columbus face (north-east), party wall (south); prow arc around C
    const C = [30.65, -0.95], RP = 2.55, R = [];
    for (let i = 0; i <= 12; i++){ const a = PI + (PI*0.955)*i/12; R.push([C[0] + Math.cos(a)*RP, C[1] + Math.sin(a)*RP]); }
    R.push([46.7, 10.3], [46.1, 11.0], [31.2, 13.5], [29.0, 0.8]);
    const yG = 4.4, fl = 3.3, nF = 6, yC = yG + nF*fl, yA = yC + 1.0, yT = yA + 3.2;
    // walls: cream base, copper shaft, attic
    walls(B.p(CREAM), R, -4, yG); walls(B.p(COP), R, yG, yC); walls(B.p(COP), R, yA, yT); cap(B.p(ROOF), R, yT - 0.05);
    band(B.p(CREAM), R, yG - 0.5, yG, 0.25);                      // ground-floor cornice
    band(B.p(SASH), R, yC, yC + 0.35, 0.3); band(B.p(COP2), R, yC + 0.35, yA, 0.75);   // main cornice
    band(B.p(COP2), R, yT - 0.4, yT + 0.25, 0.45); walls(B.p(COP), offRing(R, 0.02), yT + 0.25, yT + 0.75);   // top cornice + parapet
    // string courses at each floor
    for (let k = 1; k < nF; k++) band(B.p(COP2), R, yG + k*fl - 0.18, yG + k*fl + 0.06, 0.1);
    // windows (skip the party wall = edge index R.length - 2): white sash frame + glass
    const okW = (i) => i !== 14;
    for (let k = 0; k < nF; k++){ const y = yG + k*fl + 0.75;
      winRow(B.p(SASH), R, y - 0.12, 2.15, 1.38, 1.85, 0.05, 2.5, okW); winRow(B.p(GLASS), R, y, 1.9, 1.1, 1.85, 0.09, 2.5, okW);
      // three windows round the prow
      for (const a of [PI*1.17, PI*1.5, PI*1.83]){ const cx = C[0] + Math.cos(a)*(RP + 0.08), cz = C[1] + Math.sin(a)*(RP + 0.08), tx = -Math.sin(a), tz = Math.cos(a);
        q4(B.p(GLASS), [cx - tx*0.5, y, cz - tz*0.5], [cx + tx*0.5, y, cz + tz*0.5], [cx + tx*0.5, y + 1.9, cz + tz*0.5], [cx - tx*0.5, y + 1.9, cz - tz*0.5]); } }
    // attic windows (small, square)
    winRow(B.p(GLASS), R, yA + 0.9, 1.3, 0.9, 1.85, 0.06, 2.5, okW);
    // vertical copper piers between the window pairs (Kearny and Columbus faces)
    for (const [a, b] of [[R[12], R[13]], [R[15], R[16]]]){ const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.floor(L/3.7);
      for (let j = 1; j < n; j++){ const t = j/n, x = a[0] + (b[0] - a[0])*t, z = a[1] + (b[1] - a[1])*t; obox(B.p(COP2), x, z, 0.5, 0.5, yG, yC, Math.atan2(b[1] - a[1], b[0] - a[0])); } }
    // ground floor: shopfronts (dark, lit at night) between cream piers
    winRow(B.p(SHOP), R, 0.4, 3.1, 2.6, 3.4, 0.06, 3, okW);
    // the prow turret: copper drum above the roof, dome, lantern and finial
    latheB(B.p(COP), C[0], C[1], [[RP + 0.05, yT - 0.3], [RP + 0.05, yT + 1.6]], 16);
    latheB(B.p(COP2), C[0], C[1], [[RP + 0.45, yT + 1.6], [RP + 0.45, yT + 2.0], [RP + 0.1, yT + 2.1]], 16);
    latheB(B.p(DOME), C[0], C[1], [[RP + 0.1, yT + 2.1], [RP*0.95, yT + 2.9], [RP*0.78, yT + 3.6], [RP*0.5, yT + 4.2], [RP*0.2, yT + 4.5], [0.3, yT + 4.55]], 16);
    cylB(B.p(COP2), C[0], C[1], 0.3, 0.3, yT + 4.5, yT + 5.3, 8); latheB(B.p(DOME), C[0], C[1], [[0.38, yT + 5.3], [0.28, yT + 5.6], [0.08, yT + 6.2]], 8);
    // small round windows in the drum
    for (let i = 0; i < 6; i++){ const a = PI + PI*i/5*0.95, cx = C[0] + Math.cos(a)*(RP + 0.1), cz = C[1] + Math.sin(a)*(RP + 0.1), tx = -Math.sin(a), tz = Math.cos(a);
      q4(B.p(GLASS), [cx - tx*0.35, yT + 0.4, cz - tz*0.35], [cx + tx*0.35, yT + 0.4, cz + tz*0.35], [cx + tx*0.35, yT + 1.3, cz + tz*0.35], [cx - tx*0.35, yT + 1.3, cz - tz*0.35]); }
    B.flush(s);
    return g; }};
place('sfcolumbus', 36.5, 5.0);

// =====================================================================================================================
// Old United States Mint, "The Granite Lady" (1874, Alfred B. Mullett), Fifth and Mission: sober Greek Revival on an E-shaped
// plan round a closed courtyard — a rusticated granite basement, two storeys of grey sandstone with tall pedimented-less windows
// in plain architraves, wing corners marked by pilasters, a full entablature, and the central Doric hexastyle portico with its
// pediment over a grand flight of granite steps, facing Fifth Street (north-east). Footprint = OSM "Old San Francisco Mint".
// Built in the building frame: u along Fifth Street (south-east), v across (south-west); the portico is at v = -29.
// =====================================================================================================================
LANDMARKS.sfoldmint = {zh:'旧金山旧铸币厂', en:'Old U.S. Mint (San Francisco)', cat:'old', r:44, h:21,
  lt:{m:0, c:'#ffdcae', k:0.95, e:0.4},
  build(){
    const g = new THREE.Group(), s = frame(g, -21.0, 2.4), b = bframe(s, -21.0, 2.4, 44.74*PI/180), B = mkB();
    const GRAN = {c:'#8f8c86'}, SAND = {c:'#c4bdac'}, TRIM = '#d2cbba', GLASS = '#2a2e32', ROOF = '#76726b', STEP = '#a19d95';
    // the body without the portico projection (portico: u -8.7 .. 11.4, v -29 .. -21.3)
    const Rw = [[-32.6,23.8],[-32.5,12.7],[-30.2,12.6],[-30.1,-12.9],[-33.9,-12.9],[-33.8,-26.3],[-20.4,-26.4],[-20.5,-21.2],[-8.7,-21.3],
      [11.3,-21.4],[22.0,-21.5],[22.0,-24.6],[33.5,-24.7],[33.4,-13.5],[30.2,-13.4],[30.1,13.7],[34.5,13.8],[34.5,24.1],[9.3,24.2],[9.3,28.9],[-9.6,28.9],[-9.7,23.8]];
    const HOLE = [[-17, -8.5], [-17, 12.5], [17.5, 12.5], [17.5, -8.5]];
    const yB = 4.0, yE = 14.3, yC = 16.7, yP = 17.5;
    walls(B.p(GRAN), Rw, -3.5, yB); band(B.p(GRAN), Rw, yB - 0.35, yB, 0.18);
    walls(B.p(SAND), Rw, yB, yE);
    for (const y of [1.0, 2.0, 3.0]) band(B.p('#77746e'), Rw, y - 0.06, y + 0.06, 0.03);   // rusticated joints
    band(B.p(TRIM), Rw, yE, yE + 1.0, 0.12); walls(B.p(SAND), offRing(Rw, 0.05), yE + 1.0, yC - 0.6); band(B.p(TRIM), Rw, yC - 0.6, yC, 0.65);
    walls(B.p(SAND), Rw, yC, yP); band(B.p(TRIM), Rw, yP - 0.2, yP, 0.12);
    cap(B.p(ROOF), Rw, yP - 0.3, [HOLE]);
    // courtyard
    walls(B.p(SAND), HOLE, 0.3, yP - 0.3); cap(B.p(STEP), HOLE, 0.3); band(B.p(TRIM), HOLE, yE, yE + 0.6, -0.15);
    winRow(B.p(GLASS), HOLE, 1.5, 2.6, 1.3, 3.6, 0.05, 3); winRow(B.p(GLASS), HOLE, 5.6, 3.4, 1.4, 3.6, 0.05, 3); winRow(B.p(GLASS), HOLE, 10.4, 2.9, 1.4, 3.6, 0.05, 3);
    // windows: architrave + glass, two main storeys and the basement (not on the portico wall, edge 8)
    const notP = i => i !== 8;
    winRow(B.p(TRIM), Rw, 4.75, 4.35, 2.1, 3.6, 0.06, 3, notP); winRow(B.p(GLASS), Rw, 5.0, 3.8, 1.45, 3.6, 0.1, 3, notP);
    winRow(B.p(TRIM), Rw, 9.75, 3.95, 2.1, 3.6, 0.06, 3, notP); winRow(B.p(GLASS), Rw, 10.0, 3.4, 1.45, 3.6, 0.1, 3, notP);
    winRow(B.p(TRIM), Rw, 9.45, 0.3, 2.4, 3.6, 0.1, 3, notP);
    winRow(B.p(GLASS), Rw, 1.3, 1.7, 1.1, 3.6, 0.08, 3, notP);
    // corner pilasters (antae) on every corner of the wings
    for (let i = 0; i < Rw.length; i++){ const [x, z] = Rw[i]; if (i === 8 || i === 9) continue; box(B.p(SAND), x - 0.6, x + 0.6, yB, yE, z - 0.6, z + 0.6); box(B.p(TRIM), x - 0.7, x + 0.7, yE - 0.5, yE, z - 0.7, z + 0.7); }
    // ---- the portico: podium, steps, six Doric columns, entablature, pediment
    const u0 = -8.7, u1 = 11.4, uc = (u0 + u1)/2, vF = -25.6, vW = -21.3;
    box(B.p(GRAN), u0, u1, -3.5, yB, vF, vW);
    for (let k = 0; k < 9; k++){ const y = yB*(k + 1)/9, v0 = -29.0 + 0.4*k; box(B.p(STEP), u0 - 0.4, u1 + 0.4, -3.5, y, v0, v0 + 0.42); }
    for (const x of [u0 - 0.9, u1 + 0.9]) box(B.p(GRAN), x - 0.5, x + 0.5, -3.5, yB + 0.6, -29.2, vW);   // cheek walls
    // the wall behind the columns: central door, two windows each side
    fz(B.p(GLASS), vW - 0.08, uc - 1.3, uc + 1.3, yB, yB + 5.2); fz(B.p(TRIM), vW - 0.05, uc - 1.9, uc + 1.9, yB, yB + 6.0);
    for (const dx of [-6.2, 6.2]){ fz(B.p(TRIM), vW - 0.05, uc + dx - 1.0, uc + dx + 1.0, 5.0, 9.2); fz(B.p(GLASS), vW - 0.08, uc + dx - 0.7, uc + dx + 0.7, 5.3, 8.9);
      fz(B.p(TRIM), vW - 0.05, uc + dx - 1.0, uc + dx + 1.0, 10.0, 13.6); fz(B.p(GLASS), vW - 0.08, uc + dx - 0.7, uc + dx + 0.7, 10.3, 13.3); }
    const vc = -24.55, cr = 0.78;
    for (let k = 0; k < 6; k++){ const x = uc + (k - 2.5)*3.3;
      box(B.p(SAND), x - 0.95, x + 0.95, yB, yB + 0.3, vc - 0.95, vc + 0.95);
      // fluted shaft (20 facets), slight entasis
      latheB(B.p(SAND), x, vc, [[cr, yB + 0.3], [cr*0.97, yB + 4], [cr*0.84, 13.55]], 20, PI/20);
      latheB(B.p(TRIM), x, vc, [[cr*0.84, 13.55], [cr*1.12, 13.95], [cr*1.2, 14.0]], 20);
      box(B.p(TRIM), x - 1.0, x + 1.0, 14.0, yE, vc - 1.0, vc + 1.0); }
    // entablature over the portico (architrave, frieze with triglyph rhythm, cornice)
    box(B.p(TRIM), u0 - 0.1, u1 + 0.1, yE, yE + 1.0, vF + 0.05, vW); box(B.p(SAND), u0, u1, yE + 1.0, yC - 0.6, vF + 0.1, vW);
    for (let x = u0 + 0.4; x < u1 - 0.2; x += 1.65) box(B.p(TRIM), x, x + 0.55, yE + 1.0, yC - 0.6, vF, vF + 0.1);
    box(B.p(TRIM), u0 - 0.6, u1 + 0.6, yC - 0.6, yC, vF - 0.55, vW);
    // pediment: tympanum + raking cornices; a gable roof behind it
    const ph = 3.4, pw = (u1 - u0)/2 + 0.6, tyB = B.p(SAND), rk = B.p(TRIM), rf = B.p(ROOF);
    t3(tyB, [uc - pw + 0.6, yC, vF + 0.1], [uc + pw - 0.6, yC, vF + 0.1], [uc, yC + ph - 0.45, vF + 0.1]);
    for (const sg of [-1, 1]){ const a = [uc + sg*pw, yC, vF - 0.55], c = [uc, yC + ph, vF - 0.55];
      q4(rk, a, c, [c[0], c[1] - 0.6, c[2]], [a[0] - sg*0.75, a[1], a[2]]);
      q4(rf, [uc + sg*pw, yC, vF - 0.55], [uc, yC + ph, vF - 0.55], [uc, yC + ph, vW + 1.5], [uc + sg*pw, yC, vW + 1.5]); }
    B.flush(b);
    return g; }};
place('sfoldmint', -21.0, 2.4);

// =====================================================================================================================
// Saints Peter and Paul Church (1924, Charles Fantoni), 666 Filbert Street, facing south over Washington Square: a cream-white
// Romanesque-revival basilica — a tall nave with clerestory and lower aisles behind a twin-towered front, a gabled centre with
// the round-arched main portal (mosaic tympanum) and a big rose window, and the two 58 m (191 ft) spires: square towers with
// arched belfries, an octagonal pinnacled stage and ribbed octagonal spires with crosses. Floodlit white at night.
// Footprint = OSM "Saints Peter and Paul Church" (bay/ref_sfdt2_1.json, anchor 37.8016, -122.4103); frame turned to the street
// grid (u east along Filbert, v south; the facade is at v = +25).
// =====================================================================================================================
LANDMARKS.sfsspp = {zh:'圣彼得与圣保罗教堂', en:'Saints Peter and Paul Church', cat:'old', r:38, h:59,
  lt:{m:0, c:'#fff0d6', k:0.95, e:0.55},
  build(){
    const g = new THREE.Group(), s = frame(g, 5.6, -0.1), b = bframe(s, 5.6, -0.1, -8.96*PI/180), B = mkB(), r = LMCTX.rng;
    const ST = {c:'#ece6d8'}, TR = '#d8cfbb', RF = '#5f5c58', GL = '#2b303a', DR = '#3b2c22', MOS = {c:'#b8955a'}, ROSE = {c:'#34405c', glow:'#ffcf8a', gk:0.55}, BELL = '#4a4540';
    const uW0 = -15.4, uW1 = -8.0, uE0 = 10.1, uE1 = 17.5, vF = 25.0, vT = 17.6, vR = -23.1, uc = 1.05, uN0 = -6.3, uN1 = 8.4;
    const st = B.p(ST), tr = B.p(TR), rf = B.p(RF), gl = B.p(GL);
    // plinth (the ground falls about 4 m to the west along Filbert)
    box(st, uW0, uE1, -8, 0.6, vR, vF); box(B.p(ST), -24.3, uW0, -8, 0.6, vR, -13.2);
    // front steps across the centre and the tower doors
    for (let k = 0; k < 5; k++){ const y = 0.6 - 0.45*(k + 1); box(tr, uW0 + 1, uE1 - 1, -8, y + 0.45, vF + 0.4*k, vF + 0.4*(k + 1)); }
    // annex behind the school (west, rear)
    box(st, -24.3, uW0, 0.6, 10, vR, -13.2); box(rf, -24.5, uW0, 10, 10.4, vR - 0.2, -13.0);
    winRow(gl, [[-24.3, vR], [-24.3, -13.2], [uW0, -13.2], [uW0, vR]], 3, 2.2, 1.2, 3, 0.05, 2.5); winRow(gl, [[-24.3, vR], [-24.3, -13.2], [uW0, -13.2], [uW0, vR]], 6.6, 2.2, 1.2, 3, 0.05, 2.5);
    // aisles: walls, lean-to roofs, arched windows, buttresses
    const yA = 12.5, yN = 21.5, yRidge = 27.0;
    for (const [u0, u1, out] of [[uW0, uN0, -1], [uN1, uE1, 1]]){
      box(st, u0, u1, 0.6, yA, vR, vT);
      const ue = out < 0 ? u0 : u1, ui = out < 0 ? u1 : u0;
      q4(rf, [ue - out*0.4, yA, vR - 0.3], [ue - out*0.4 + out*0.8, yA - 0.3, vR - 0.3], [ue + out*0.4, yA - 0.3, vT], [ue + out*0.4 - out*0.8, yA, vT]);
      q4(rf, [ue + out*0.4, yA - 0.2, vR - 0.3], [ui, yA + 3.2, vR - 0.3], [ui, yA + 3.2, vT], [ue + out*0.4, yA - 0.2, vT]);
      for (let v = vR + 3.5; v < vT - 2; v += 5.4){ archX(gl, ue + out*0.06, v, 1.0, 3.2, 8.6, 6); archX(tr, ue + out*0.03, v, 1.35, 2.9, 8.6, 6);
        box(tr, ue - 0.5 + out*0.25, ue + 0.5 + out*0.25, 0.6, yA - 1.5, v + 2.7 - 0.45, v + 2.7 + 0.45); }
      band(tr, [[u0, vR], [u0, vT], [u1, vT], [u1, vR]], yA - 0.6, yA, 0.25);
    }
    // nave: clerestory walls, windows, gable roof
    box(st, uN0, uN1, 0.6, yN, vR, vF - 1);
    for (const [ue, out] of [[uN0, -1], [uN1, 1]]) for (let v = vR + 3.5; v < vT - 2; v += 5.4){ archX(gl, ue + out*0.06, v, 1.05, 15.0, 18.8, 6); archX(tr, ue + out*0.03, v, 1.4, 14.7, 18.8, 6); }
    band(tr, [[uN0, vR], [uN0, vF - 1], [uN1, vF - 1], [uN1, vR]], yN - 0.6, yN, 0.3);
    { const a = uN0 - 0.6, c = uN1 + 0.6; q4(rf, [a, yN, vR - 0.5], [uc, yRidge, vR - 0.5], [uc, yRidge, vF - 1], [a, yN, vF - 1]); q4(rf, [c, yN, vR - 0.5], [uc, yRidge, vR - 0.5], [uc, yRidge, vF - 1], [c, yN, vF - 1]);
      t3(st, [uN0, yN, vR], [uN1, yN, vR], [uc, yRidge - 0.4, vR]); }
    // rear wall: a small rose and a plain gable coping
    discZ(gl, uc, 16.5, vR - 0.06, 1.8, 16);
    // ---- the front: centre gable wall between the towers
    const yG = 22.5, yApex = 30.0;
    box(st, uW1, uE0, 0.6, yG, vF - 1.6, vF);
    { const f = vF + 0.02; t3(st, [uW1, yG, vF - 1.6], [uE0, yG, vF - 1.6], [uc, yApex, vF - 1.6]); t3(st, [uW1, yG, f], [uE0, yG, f], [uc, yApex, f]);
      for (const sg of [-1, 1]){ const a = [sg < 0 ? uW1 : uE0, yG, f + 0.4], c = [uc, yApex + 0.5, f + 0.4];
        q4(tr, a, c, [c[0], c[1] - 0.7, c[2]], [a[0] - sg*0.9, a[1], a[2]]); q4(tr, a, c, [c[0], c[1], vF - 1.8], [a[0], a[1], vF - 1.8]); } }
    band(tr, [[uW1, vF - 1.6], [uW1, vF], [uE0, vF], [uE0, vF - 1.6]], yG - 0.7, yG, 0.35);
    // main portal: archivolt, door, mosaic tympanum; a frieze band; the rose window
    archZ(tr, uc, vF + 0.08, 3.4, 0.6, 7.2, 10); archZ(DR ? B.p(DR) : tr, uc, vF + 0.14, 2.3, 0.6, 5.6, 10); archZ(B.p(MOS), uc, vF + 0.16, 2.3, 5.6, 5.6, 10);
    fz(B.p(DR), vF + 0.18, uc - 2.3, uc + 2.3, 0.6, 5.6);
    box(tr, uW1, uE0, 10.6, 11.6, vF, vF + 0.25);
    discZ(tr, uc, 16.0, vF + 0.08, 3.7, 24); discZ(B.p(ROSE), uc, 16.0, vF + 0.16, 3.0, 24);
    for (let i = 0; i < 12; i++){ const a = TAU*i/12; beam(tr, [uc + Math.cos(a)*0.5, 16.0 + Math.sin(a)*0.5, vF + 0.22], [uc + Math.cos(a)*3.0, 16.0 + Math.sin(a)*3.0, vF + 0.22], 0.09); }
    discZ(tr, uc, 16.0, vF + 0.23, 0.55, 10);
    // small arcade of three windows above the portal
    for (const dx of [-2.6, 0, 2.6]){ archZ(gl, uc + dx, vF + 0.12, 0.7, 8.4, 9.8, 6); }
    // gable cross and the shoulder pinnacles
    box(tr, uc - 0.12, uc + 0.12, yApex, yApex + 2.6, vF - 0.9, vF - 0.66); box(tr, uc - 0.7, uc + 0.7, yApex + 1.6, yApex + 1.85, vF - 0.9, vF - 0.66);
    // ---- the twin towers
    for (const [u0, u1] of [[uW0, uW1], [uE0, uE1]]){
      const cx = (u0 + u1)/2, cz = (vT + vF)/2, hw = (u1 - u0)/2, R4 = [[u0, vT], [u0, vF], [u1, vF], [u1, vT]], yT = 34.5;
      box(st, u0, u1, 0.6, yT, vT, vF);
      // corner buttress strips
      for (const [x, z] of R4) box(st, x - 0.55, x + 0.55, 0.6, yT - 1.0, z - 0.55, z + 0.55);
      for (const y of [8.6, 17.6, 26.2]) band(tr, R4, y - 0.45, y, 0.65);
      band(tr, R4, yT - 1.0, yT, 0.8);
      // openings: side door on the front, tall window, round window, the belfry pair on each face
      archZ(tr, cx, vF + 0.08, 1.7, 0.6, 4.4, 8); archZ(B.p(DR), cx, vF + 0.14, 1.2, 0.6, 4.2, 8);
      for (const f of [0, 1, 2, 3]){
        const P = (t, y, o) => f === 0 ? [cx + t, y, vF + o] : f === 1 ? [cx + t, y, vT - o] : f === 2 ? [u0 - o, y, cz + t] : [u1 + o, y, cz + t];
        const arch = (hw2, y0, ys, o, oo) => { const n = 6; q4(oo, P(-hw2, y0, o), P(hw2, y0, o), P(hw2, ys, o), P(-hw2, ys, o));
          for (let i = 0; i < n; i++){ const a0 = PI*i/n, a1 = PI*(i+1)/n; t3(oo, P(0, ys, o), P(Math.cos(a0)*hw2, ys + Math.sin(a0)*hw2, o), P(Math.cos(a1)*hw2, ys + Math.sin(a1)*hw2, o)); } };
        if (f !== 0) arch(0.65, 11.0, 15.4, 0.08, gl); else arch(0.65, 11.5, 15.4, 0.08, gl);
        arch(0.95, 19.6, 22.6, 0.08, gl); arch(1.3, 19.3, 22.6, 0.04, tr);
        for (const dx of [-1.55, 1.55]){ arch(1.05, 27.2, 31.6, 0.1, B.p(BELL)); arch(1.4, 26.9, 31.6, 0.05, tr); }
      }
      // octagonal pinnacled stage, spire with ribs, finial and cross
      const ro = hw*0.86, a8 = PI/8, y1 = yT, y2 = yT + 6.2, y3 = 56.0;
      cylB(st, cx, cz, ro, ro, y1, y2, 8, a8); discB(tr, cx, cz, ro + 0.35, y2 + 0.5, 8, a8); cylB(tr, cx, cz, ro + 0.35, ro + 0.35, y2, y2 + 0.5, 8, a8);
      for (let i = 0; i < 8; i++){ const a = a8 + TAU*i/8 + TAU/16, x = cx + Math.cos(a)*(ro*0.93 + 0.06), z = cz + Math.sin(a)*(ro*0.93 + 0.06), tx = -Math.sin(a), tz = Math.cos(a);
        const o = B.p(BELL); q4(o, [x - tx*0.55, y1 + 1.0, z - tz*0.55], [x + tx*0.55, y1 + 1.0, z + tz*0.55], [x + tx*0.55, y2 - 1.3, z + tz*0.55], [x - tx*0.55, y2 - 1.3, z - tz*0.55]);
        t3(o, [x - tx*0.55, y2 - 1.3, z - tz*0.55], [x + tx*0.55, y2 - 1.3, z + tz*0.55], [x, y2 - 0.6, z]); }
      for (const [x, z] of R4){ const px = x + (cx - x)*0.12, pz = z + (cz - z)*0.12; box(st, px - 0.55, px + 0.55, y1, y1 + 2.6, pz - 0.55, pz + 0.55); pyrB(st, px, pz, 0.62, y1 + 2.6, 4.2, 4, PI/4); }
      pyrB(st, cx, cz, ro*0.97, y2 + 0.5, y3 - y2 - 0.5, 8, a8);
      // a ring of small pinnacles round the spire's foot, and tracery slots up the spire faces
      for (let i = 0; i < 8; i++){ const a = a8 + TAU*i/8, x = cx + Math.cos(a)*(ro + 0.15), z = cz + Math.sin(a)*(ro + 0.15); box(tr, x - 0.22, x + 0.22, y2 + 0.5, y2 + 1.6, z - 0.22, z + 0.22); pyrB(tr, x, z, 0.3, y2 + 1.6, 1.5, 4, a); }
      for (let i = 0; i < 8; i++){ const am = a8 + TAU*(i + 0.5)/8, fr = ro*0.97*Math.cos(PI/8);
        for (const [t0, t1] of [[0.12, 0.3], [0.38, 0.52], [0.6, 0.7]]){ const y0 = y2 + 0.5 + (y3 - y2 - 0.5)*t0, y1 = y2 + 0.5 + (y3 - y2 - 0.5)*t1, r0 = fr*(1 - t0) + 0.05, r1 = fr*(1 - t1) + 0.05, w0 = 0.42*(1 - t0), w1 = 0.42*(1 - t1);
          const P = (rr, y, w) => [cx + Math.cos(am)*rr - Math.sin(am)*w, y, cz + Math.sin(am)*rr + Math.cos(am)*w];
          q4(B.p(BELL), P(r0, y0, -w0), P(r0, y0, w0), P(r1, y1, w1*0.2), P(r1, y1, -w1*0.2)); } }
      for (let i = 0; i < 8; i++){ const a = a8 + TAU*i/8; beam(tr, [cx + Math.cos(a)*ro*0.98, y2 + 0.5, cz + Math.sin(a)*ro*0.98], [cx, y3 - 0.2, cz], 0.13);
        // crockets / small gabled lucarnes on alternate faces
        if (i % 2 === 0){ const am = a + TAU/16, x = cx + Math.cos(am)*ro*0.72, z = cz + Math.sin(am)*ro*0.72; pyrB(st, x, z, 0.55, y2 + 3.6, 2.2, 4, am + PI/4); } }
      latheB(tr, cx, cz, [[0.3, y3 - 0.4], [0.42, y3], [0.42, y3 + 0.35], [0.12, y3 + 0.6]], 8);
      box(tr, cx - 0.1, cx + 0.1, y3 + 0.5, y3 + 2.7, cz - 0.1, cz + 0.1); box(tr, cx - 0.65, cx + 0.65, y3 + 1.8, y3 + 2.0, cz - 0.1, cz + 0.1);
    }
    B.flush(b);
    // the narrow 15 m house against the church's east wall (its outline falls under the church's ground plan)
    { const R = [[23.9, 3.4], [31.4, 2.2], [34.8, 22.7], [28.4, 23.7], [28.1, 21.8], [26.9, 22.0], [25.8, 15.0], [27.0, 14.8], [26.2, 10.2], [25.1, 10.4]], C = mkB();
      walls(C.p(TR), R, -6, 13.6); cap(C.p(RF), R, 14.2); walls(C.p(TR), offRing(R, 0.3), 13.6, 14.2);
      for (let y = 1.0; y < 12; y += 3.1) winRow(C.p(GL), R, y, 1.8, 1.1, 2.4, 0.06, 2.8);
      // and the small house behind it (north-east of the church), which the hull then covers too
      const R2 = [[21.4, -17.8], [28.0, -18.9], [29.5, -9.8], [22.9, -8.7]];
      walls(C.p(TR), R2, -6, 5.4); walls(C.p(TR), offRing(R2, 0.25), 5.4, 6.0); cap(C.p(RF), R2, 5.8);
      winRow(C.p(GL), R2, 1.2, 1.7, 1.1, 2.6, 0.06, 2.8); winRow(C.p(GL), R2, 3.6, 1.4, 1.1, 2.6, 0.06, 2.8);
      C.flush(s); }
    return g; }};
place('sfsspp', 5.6, -0.1);

// =====================================================================================================================
// San Francisco Museum of Modern Art, 151 Third Street. Mario Botta's 1995 building: symmetric, nearly windowless red-brick
// blocks stepping back in tiers towards the middle, a striped black-and-white granite entrance, and the central striped
// cylinder cut on a slant into an elliptical skylight (the oculus, 130 ft up) facing Yerba Buena Gardens across Third Street.
// Behind it, Snohetta's 2016 extension (ten storeys, from Minna to Howard Street): a tall white slab of rippled panels in
// horizontal bands, its roofline pinched over the oculus, a few window slots, a lower glazed gallery on Howard Street.
// Footprints = OSM "San Francisco Museum of Modern Art" and its parts (ref_sfdt2 / sfmoma). Building frame: u along Third
// Street (south-east), v across (south-west, towards Third Street); the Botta front is at v = 45.7.
// The extension's low floors stop 5 m short of the W hotel at the Howard Street end so that the hotel stays visible.
// =====================================================================================================================
LANDMARKS.sfmoma = {zh:'旧金山现代艺术博物馆', en:'San Francisco Museum of Modern Art (SFMOMA)', cat:'new', r:72, h:57,
  lt:{m:0, c:'#ffd9b0', k:0.8, e:0.4},
  build(){
    const OX = 42.4, OZ = -13.9, g = new THREE.Group(), s = frame(g, OX, OZ), b = bframe(s, 38.8, -21.7, 44.7*PI/180), B = mkB(), r = LMCTX.rng;
    const BR = {c:'#8e4c37'}, BR2 = '#743f2e', RB = '#8e8880', SW = '#ecebe6', SB = '#29292a', SKY = {c:'#5b6670', glow:'#ffe3b5', gk:0.9},
      SNO = {c:'#f1f1ed', lc:'#e6eeff', lk:0.7}, SNG = {c:'#36424c', m:1, fh:4.6, cw:3.0, lk:0.3}, GRN = '#53703f', DK = '#1d1e20', GLO = {c:'#3d4954', glow:'#ffe2b8', gk:0.55};
    const br = B.p(BR), br2 = B.p(BR2), rb = B.p(RB);
    // ---------------- Botta: three stepped tiers (front at v = 45.7, back against the extension at v = -3.6)
    const uc = -10.1, vB = -3.6, T = [[-42.6, 22.3, 45.7, -4, 11.0], [-37.0, 16.8, 39.5, 11.0, 16.5], [-31.4, 11.2, 33.3, 16.5, 21.5]];
    for (const [u0, u1, vf, y0, y1] of T){
      box(br, u0, u1, y0, y1, vB, vf);
      box(rb, u0 + 0.05, u1 - 0.05, y1, y1 + 0.12, vB + 0.05, vf - 0.05);
      // patterned brick: darker coursing bands on the front and the two sides
      for (let y = y0 + 1.6; y < y1 - 0.5; y += 1.6){ const yy = Math.max(y, 0.5);
        fz(br2, vf + 0.04, u0, u1, yy, yy + 0.32); fx(br2, u0 - 0.04, vB, vf, yy, yy + 0.32); fx(br2, u1 + 0.04, vB, vf, yy, yy + 0.32); }
      // capping band of each tier
      box(br2, u0 - 0.15, u1 + 0.15, y1 - 0.7, y1, vB, vf + 0.15);
    }
    // a dark granite plinth along the street
    box(B.p(DK), -42.7, 22.4, -1, 1.2, 45.6, 45.8);
    // a few square windows near the corners of the upper tiers
    for (const [u0, u1, vf, y0, y1] of T.slice(1)) for (const x of [u0 + 2.2, u1 - 2.2]) fz(B.p(DK), vf + 0.06, x - 0.9, x + 0.9, y1 - 3.6, y1 - 1.8);
    // the entrance: a striped granite frame round a deep dark opening
    for (let k = 0; k < 18; k++){ const y = k*0.62; fz(B.p(k % 2 ? SW : SB), 45.76, uc - 8.2, uc + 8.2, y, y + 0.62); }
    fz(B.p(DK), 45.8, uc - 5.6, uc + 5.6, 0, 7.4);
    for (let k = 0; k < 6; k++){ const y = 11.2 + k*0.62; fz(B.p(k % 2 ? SB : SW), 45.76, uc - 3.0, uc + 3.0, y, y + 0.62); }
    // ---------------- the oculus: striped cylinder cut on a slant, elliptical skylight
    { const vc = 14.6, R = 9.3, n = 36, yt = v => 34.6 + (vc - v)*0.43;
      for (let k = 0; ; k++){ const y0 = 20.2 + k*1.15, y1 = y0 + 1.15; if (y0 > 39.5) break; const o = B.p(k % 2 ? SB : SW);
        for (let i = 0; i < n; i++){ const a0 = TAU*i/n, a1 = TAU*(i+1)/n, P0 = [uc + Math.cos(a0)*R, vc + Math.sin(a0)*R], P1 = [uc + Math.cos(a1)*R, vc + Math.sin(a1)*R];
          const h0 = Math.min(y1, yt(P0[1])), h1 = Math.min(y1, yt(P1[1])); if (h0 <= y0 && h1 <= y0) continue;
          q4(o, [P0[0], y0, P0[1]], [P1[0], y0, P1[1]], [P1[0], Math.max(y0, h1), P1[1]], [P0[0], Math.max(y0, h0), P0[1]]); } }
      const sk = B.p(SKY), rim = B.p(SW);
      for (let i = 0; i < n; i++){ const a0 = TAU*i/n, a1 = TAU*(i+1)/n, P = (a, rr) => [uc + Math.cos(a)*rr, yt(vc + Math.sin(a)*rr) + 0.05, vc + Math.sin(a)*rr];
        t3(sk, [uc, yt(vc) + 0.05, vc], P(a0, R*0.94), P(a1, R*0.94)); q4(rim, P(a0, R*0.94), P(a1, R*0.94), P(a1, R + 0.05), P(a0, R + 0.05));
        // skylight mullions
        if (i % 3 === 0) beam(rim, [uc, yt(vc) + 0.1, vc], P(a0, R*0.94), 0.06); }
    }
    // ---------------- Snohetta extension
    const top = u => 56.5 - 9.5*Math.exp(-Math.pow((u - uc)/13, 2)) - (u > 44 ? (u - 44)*0.36 : 0) - (u < -32 ? (-32 - u)*0.25 : 0);
    const vE = u => u < 27 ? -33.6 : -33.6 + (u - 27)*0.105;             // the east face
    const wStart = u => u < -42.6 || u > 22.3 ? 0 : (u > -31.4 && u < 11.2 ? 21.1 : (u > -37 && u < 16.8 ? 16.1 : 10.6));   // the Botta in front
    const vW = (u, y) => (u > 52 && y < 25) ? -8.5 : -3.6;               // keep the low floors off the W hotel
    const sno = B.p(SNO), bh = 1.3;
    const rip = (u, y, k) => 0.26*Math.sin(u*0.3 + k*0.22) + 0.1*Math.sin(u*0.95 + k*1.1);
    // west face, in 2 m columns and 1.3 m bands; each band leans out 0.3 m (horizontal ridges), the ripple moves along the band
    for (let u = -42.1; u < 66.5 - 1e-6; u += 2){
      const u1 = Math.min(66.5, u + 2), ys = Math.min(wStart(u), wStart(u1 - 0.01)), tA = top(u), tB = top(u1);
      for (let k = 0; ; k++){
        const y0 = k*bh, y1 = y0 + bh; if (y0 >= Math.max(tA, tB)) break; if (y1 <= ys) continue;
        const ya = Math.max(y0, ys), A0 = Math.min(ya, tA), B0 = Math.min(ya, tB), A1 = Math.min(y1, tA), B1 = Math.min(y1, tB);
        const v0 = vW(u, ya), v1 = vW(u1 - 0.01, ya);
        q4(sno, [u, A0, v0 + rip(u, y0, k)*0.4], [u1, B0, v1 + rip(u1, y0, k)*0.4], [u1, B1, v1 + 0.3 + rip(u1, y0, k)], [u, A1, v0 + 0.3 + rip(u, y0, k)]);
        if (y1 < Math.min(tA, tB)) q4(sno, [u, y1, v0 + 0.3 + rip(u, y0, k)], [u1, y1, v1 + 0.3 + rip(u1, y0, k)], [u1, y1, v1 + rip(u1, y1, k + 1)*0.4], [u, y1, v0 + rip(u, y1, k + 1)*0.4]);
      }
      // the step at the Howard Street end (low floors set back)
      if (u >= 52) q4(sno, [u, 25, -8.5], [u1, 25, -8.5], [u1, 25, -3.3], [u, 25, -3.3]);
      // east face (rippled bands too)
      const e0 = vE(u), e1 = vE(u1);
      for (let k = 0; ; k++){ const y0 = k*bh, y1 = y0 + bh; if (y0 >= Math.max(tA, tB)) break;
        const A1 = Math.min(y1, tA), B1 = Math.min(y1, tB), A0 = Math.min(y0, tA), B0 = Math.min(y0, tB);
        q4(sno, [u, A0, e0 - rip(u, y0, k + 3)*0.4], [u1, B0, e1 - rip(u1, y0, k + 3)*0.4], [u1, B1, e1 - 0.3 - rip(u1, y0, k + 3)], [u, A1, e0 - 0.3 - rip(u, y0, k + 3)]);
        if (y1 < Math.min(tA, tB)) q4(sno, [u, y1, e0 - 0.3 - rip(u, y0, k + 3)], [u1, y1, e1 - 0.3 - rip(u1, y0, k + 3)], [u1, y1, e1 - rip(u1, y1, k + 4)*0.4], [u, y1, e0 - rip(u, y1, k + 4)*0.4]); }
      // roof (follows the pinched top line)
      q4(B.p(RB), [u, tA, vW(u, 99) + 0.3], [u1, tB, vW(u1, 99) + 0.3], [u1, tB, e1 - 0.3], [u, tA, e0 - 0.3]);
    }
    // north (Minna Street) and south (Howard Street) ends
    for (const [u, sg] of [[-42.1, -1], [66.5, 1]]){ const t = top(u), vw = sg > 0 ? -8.5 : -3.6;
      for (let k = 0; ; k++){ const y0 = k*bh, y1 = Math.min(t, y0 + bh); if (y0 >= t) break; const v0 = (sg > 0 && y0 >= 25) ? -3.6 : vw;
        for (let v = vE(u); v < v0 - 1e-6; v += 2){ const vv = Math.min(v0, v + 2);
          q4(sno, [u + sg*0.4*rip(v, y0, k), y0, v], [u + sg*0.4*rip(vv, y0, k), y0, vv], [u + sg*(0.3 + rip(vv, y0, k)), y1, vv], [u + sg*(0.3 + rip(v, y0, k)), y1, v]); } } }
    // Howard Street: the glass-walled ground-floor gallery
    box(B.p(GLO), 56.0, 66.9, 0, 7.6, -29.0, -8.5);
    // window slots (west and east faces), a lit lobby band, the green wall on the east terrace
    const sng = B.p(SNG);
    for (const [u0, u1, y0, h] of [[-36, -22, 31.5, 2.6], [18, 40, 36.0, 2.2], [26, 46, 27.5, 2.2], [-30, -8, 44.5, 2.0]]) for (let u = u0; u < u1; u += 2)
      q4(sng, [u, y0, -3.6 + 0.75], [u + 2, y0, -3.6 + 0.75], [u + 2, y0 + h, -3.6 + 0.75], [u, y0 + h, -3.6 + 0.75]);
    for (const [u0, u1, y0, h] of [[-40, -6, 8.0, 3.2], [-24, 30, 30.0, 3.4], [10, 60, 40.5, 2.6], [30, 62, 18.5, 3.0], [-38, 0, 46.5, 2.4]]) for (let u = u0; u < u1; u += 2)
      q4(sng, [u, y0, vE(u) - 0.75], [u + 2, y0, vE(u + 2) - 0.75], [u + 2, y0 + h, vE(u + 2) - 0.75], [u, y0 + h, vE(u) - 0.75]);
    for (let u = -4; u < 22; u += 2) q4(B.p(GRN), [u, 13.0, vE(u) - 0.8], [u + 2, 13.0, vE(u + 2) - 0.8], [u + 2, 22.0, vE(u + 2) - 0.8], [u, 22.0, vE(u) - 0.8]);
    // the low wing along the mid-block promenade (north-east)
    box(B.p(SNO), -42.1, 7.2, -2, 7.0, -39.0, -33.4); box(rb, -42.1, 7.2, 7.0, 7.3, -39.0, -33.4);
    for (let u = -40; u < 6; u += 3) fz(sng, -39.06, u, u + 2.2, 1.0, 5.6);
    // the W hotel's rear podium strip falls under this plan (its outline is hidden with the museum): rebuilt up to the
    // point where the plan must stop short of the hotel tower
    { const o = B.p('#b8b3aa'); box(o, 28.5, 51.5, -2, 7.0, -3.6, 3.9); box(rb, 28.5, 51.5, 7.0, 7.25, -3.6, 3.9);
      for (let u = 30; u < 50; u += 3) fz(B.p(DK), 3.96, u, u + 1.8, 2.2, 5.4); }
    // foundations under the extension
    box(B.p(SNO), -42.1, 52, -4, 0.2, -33.4, -3.7); box(B.p(SNO), 52, 66.5, -4, 0.2, -29.4, -8.6);
    B.flush(b);
    return g; }};
place('sfmoma', 42.4, -13.9);

// =====================================================================================================================
// Union Square and the Dewey Monument (1903, Newton Tharp; Victory by Robert Aitken): a ~30 m granite Corinthian column on a
// stepped pedestal, crowned by the bronze Victory with trident and wreath, in the middle of the granite plaza (2002 redesign).
// The square falls about 5 m from Post & Powell (north-west) to Geary & Stockton (south-east): the plaza sits on terraces —
// raised lawns along Post, the paved central plaza, broad steps down to Geary — with its Canary Island palms, glass pavilions
// (cafes, the ticket booth) on their real footprints, the Central Subway headhouse at the south-east corner, lamp posts.
// Frame: the monument at the origin, turned to the street grid (u east along Post/Geary, v south). Square = OSM "Union Square".
// =====================================================================================================================
LANDMARKS.sfdewey = {zh:'杜威纪念碑与联合广场', en:'Dewey Monument & Union Square', cat:'old', r:80, h:31,
  lt:{m:0, c:'#ffe7c4', k:0.8, e:0.45},
  build(){
    const g = new THREE.Group(), s = frame(g, -1.8, 1.6), b = bframe(s, -1.8, 1.6, -9.1*PI/180), B = mkB(), r = LMCTX.rng;
    const GR = {c:'#c7c3b9'}, GR2 = '#a7a399', LAWN = '#6e8b48', MON = {c:'#ddd8cc', lk:1.35}, BRZ = {c:'#927b4b', lk:1.2}, GLS = {c:'#3a4650', glow:'#ffd9a6', gk:0.6},
      ROOFW = '#e9e9e5', TRK = '#7b6b56', FRD = '#5c7a3d', POST = '#2b2b2b', LAMP = {c:'#f4e6c8', glow:'#ffe2b0', gk:1.6};
    const SQ = [[-60.1,-26.1],[-60.1,25.8],[-57.3,32.7],[-53.9,36.1],[-50.2,38.3],[-45.7,39.3],[47.1,39.3],[52.0,37.9],[55.9,35.4],[59.1,31.4],[60.7,26.0],
      [60.7,-25.8],[59.7,-30.3],[57.2,-33.6],[53.0,-37.3],[45.9,-38.9],[-47.9,-38.9],[-51.5,-37.6],[-55.4,-34.8],[-58.6,-31.4]];
    // clip the (convex) square to a rectangle
    const clip = (u0, u1, v0, v1) => { let P = SQ.slice();
      for (const [ax, val, keepLess] of [[0, u0, false], [0, u1, true], [1, v0, false], [1, v1, true]]){
        const out = []; for (let i = 0; i < P.length; i++){ const a = P[i], c = P[(i+1) % P.length], ina = keepLess ? a[ax] <= val : a[ax] >= val, inc = keepLess ? c[ax] <= val : c[ax] >= val;
          if (ina) out.push(a); if (ina !== inc){ const t = (val - a[ax])/(c[ax] - a[ax]); out.push([a[0] + (c[0] - a[0])*t, a[1] + (c[1] - a[1])*t]); } }
        P = out; } return P; };
    const gr = B.p(GR), gr2 = B.p(GR2), lawn = B.p(LAWN);
    const terrace = (u0, u1, v0, v1, y, topCol) => { const P = clip(u0, u1, v0, v1); if (P.length < 3) return P; walls(gr2, P, -8, y); cap(B.p(topCol || GR), P, y); return P; };
    // levels: N (Post, lawns) +0.3, W -0.1, central plaza -0.4, E -0.4, S terraces -1.4 / -2.6 / -3.8
    const yN = 0.3, yW = -0.1, yC = -0.4, yE = -0.4, yS1 = -1.4, yS2 = -2.6, yS3 = -3.8;
    terrace(-60.1, 42.6, -38.9, -19.0, yN, LAWN); terrace(-60.1, -42.4, -19.0, 15.2, yW); terrace(-42.4, 42.6, -19.0, 15.2, yC);
    terrace(42.6, 60.7, -38.9, 15.2, yE); terrace(-60.1, 60.7, 15.2, 23.0, yS1); terrace(-60.1, 60.7, 23.0, 31.0, yS2); terrace(-60.1, 60.7, 31.0, 39.3, yS3);
    // the N lawns get a granite walk along Post Street and paths across
    { const P = clip(-60.1, 42.6, -38.9, -35.5); cap(gr, P, yN + 0.03); }
    for (const u of [-30, 0, 30]) box(gr, u - 2.5, u + 2.5, yN - 0.2, yN + 0.04, -38, -19);
    // steps: N lawns down to the plaza, the plaza down the Geary terraces (broad centre flights), E band edge to Stockton
    const steps = (u0, u1, vA, vB, yA, yB, n) => { for (let k = 0; k < n; k++){ const y = yA + (yB - yA)*(k + 1)/n, va = vA + (vB - vA)*k/n, vb = vA + (vB - vA)*(k + 1)/n; box(gr2, u0, u1, -8, y, Math.min(va, vb), Math.max(va, vb) + (vB > vA ? 0.02 : 0)); } };
    steps(-28, 28, -20.8, -19.0, yN, yC, 2);
    steps(-38, 38, 15.2, 17.6, yC, yS1, 3); steps(-24, 24, 23.0, 25.4, yS1, yS2, 3); steps(-24, 24, 31.0, 33.4, yS2, yS3, 3);
    // planted beds on the terrace sides
    for (const [u0, u1, v0, v1, y] of [[-56, -26, 17.6, 22.6, yS1], [26, 56, 17.6, 22.6, yS1], [-52, -26, 25.4, 30.6, yS2], [26, 54, 25.4, 30.6, yS2]]) box(lawn, u0, u1, y, y + 0.45, v0, v1);
    // paving joints on the central plaza
    for (let u = -40; u <= 40; u += 8) box(gr2, u - 0.12, u + 0.12, yC, yC + 0.02, -19, 15.2);
    for (let v = -16; v <= 14; v += 6) box(gr2, -42.4, 42.6, yC, yC + 0.02, v - 0.12, v + 0.12);
    // ---------------- the Dewey Monument
    { const P = yC, mon = B.p(MON), brz = B.p(BRZ);
      for (let k = 0; k < 3; k++){ const w = 9.0 - k*0.8; box(mon, -w/2, w/2, P + k*0.3, P + (k + 1)*0.3, -w/2, w/2); }
      const p0 = P + 0.9;
      box(mon, -3.0, 3.0, p0, p0 + 0.5, -3.0, 3.0); box(mon, -2.6, 2.6, p0 + 0.5, p0 + 4.1, -2.6, 2.6);
      for (const [x, z, L, W] of [[0, 2.63, 2.2, 0.05], [0, -2.63, 2.2, 0.05], [2.63, 0, 0.05, 2.2], [-2.63, 0, 0.05, 2.2]]) box(brz, x - L/2, x + L/2, p0 + 1.4, p0 + 3.0, z - W/2, z + W/2);   // bronze plaques
      box(mon, -2.95, 2.95, p0 + 4.1, p0 + 4.7, -2.95, 2.95); box(mon, -1.9, 1.9, p0 + 4.7, p0 + 5.7, -1.9, 1.9);
      const c0 = p0 + 5.7;
      latheB(mon, 0, 0, [[1.35, c0], [1.35, c0 + 0.3], [1.2, c0 + 0.45], [1.05, c0 + 0.55], [1.12, c0 + 0.75], [0.96, c0 + 0.95]], 20);
      latheB(mon, 0, 0, [[0.96, c0 + 0.95], [0.93, c0 + 6.0], [0.86, c0 + 12.0], [0.8, c0 + 15.6]], 20);
      latheB(mon, 0, 0, [[0.88, c0 + 15.6], [0.88, c0 + 15.85], [0.8, c0 + 15.95]], 20);
      const k0 = c0 + 15.95;
      // Corinthian capital: bell, two rows of acanthus, volutes, abacus
      latheB(mon, 0, 0, [[0.8, k0], [0.86, k0 + 0.8], [1.02, k0 + 1.5], [1.2, k0 + 1.95]], 16);
      for (let row = 0; row < 2; row++) for (let i = 0; i < 8; i++){ const a = TAU*(i + row*0.5)/8, rr = 0.86 + row*0.06, y0 = k0 + 0.1 + row*0.55, h = 0.75,
        x = Math.cos(a)*rr, z = Math.sin(a)*rr, tx = -Math.sin(a)*0.32, tz = Math.cos(a)*0.32, ox = Math.cos(a)*0.45, oz = Math.sin(a)*0.45;
        q4(mon, [x - tx, y0, z - tz], [x + tx, y0, z + tz], [x + tx + ox*0.6, y0 + h*0.7, z + tz + oz*0.6], [x - tx + ox*0.6, y0 + h*0.7, z - tz + oz*0.6]);
        t3(mon, [x - tx + ox*0.6, y0 + h*0.7, z - tz + oz*0.6], [x + tx + ox*0.6, y0 + h*0.7, z + tz + oz*0.6], [x + ox, y0 + h, z + oz]); }
      for (let i = 0; i < 4; i++){ const a = PI/4 + HP*i; LSph(b, 0.24, Math.cos(a)*1.25, k0 + 1.75, Math.sin(a)*1.25, MON, 1, 8); }
      box(mon, -1.45, 1.45, k0 + 1.95, k0 + 2.35, -1.45, 1.45);
      // statue base and the Victory: on tiptoe, wreath raised in the right hand, trident in the left
      const s0 = k0 + 2.35;
      latheB(mon, 0, 0, [[0.85, s0], [0.85, s0 + 0.35], [0.62, s0 + 0.45], [0.62, s0 + 0.95], [0.75, s0 + 1.05]], 16);
      const f0 = s0 + 1.05;
      latheB(brz, 0, 0, [[0.12, f0], [0.42, f0 + 0.3], [0.55, f0 + 0.9], [0.42, f0 + 1.5], [0.3, f0 + 1.9], [0.36, f0 + 2.1], [0.2, f0 + 2.25], [0.02, f0 + 2.3]], 10);
      LSph(b, 0.17, 0, f0 + 2.48, 0, BRZ, 1.15, 10);
      // flowing drapery behind
      t3(brz, [0, f0 + 1.8, -0.25], [-0.75, f0 + 0.6, -0.55], [0.55, f0 + 0.3, -0.5]);
      beam(brz, [0.25, f0 + 2.05, 0], [0.5, f0 + 2.75, 0.05], 0.06); beam(brz, [0.5, f0 + 2.75, 0.05], [0.42, f0 + 3.25, 0.05], 0.05);
      latheB(brz, 0.42, 0.05, [[0.32, f0 + 3.28], [0.38, f0 + 3.34], [0.32, f0 + 3.4], [0.26, f0 + 3.34], [0.32, f0 + 3.28]], 10);
      beam(brz, [-0.28, f0 + 1.95, 0], [-0.62, f0 + 1.4, 0.05], 0.06); beam(brz, [-0.66, f0 - 0.2, 0.05], [-0.66, f0 + 3.6, 0.05], 0.04);
      for (const dx of [-0.16, 0, 0.16]) beam(brz, [-0.66 + dx, f0 + 3.45, 0.05], [-0.66 + dx, f0 + 3.95, 0.05], 0.03);
      beam(brz, [-0.82, f0 + 3.45, 0.05], [-0.5, f0 + 3.45, 0.05], 0.03);
    }
    // ---------------- pavilions on their real footprints (glass, white roof slab)
    const pav = (R, h, y) => { walls(B.p(GLS), R, y, y + h - 0.55); walls(B.p(ROOFW), offRing(R, 0.5), y + h - 0.55, y + h); cap(B.p(ROOFW), offRing(R, 0.5), y + h); cap(B.p(ROOFW), offRing(R, 0.5), y + h - 0.55); };
    pav([[48.4,7.8],[55.8,6.2],[55.7,11.5],[53.5,12.3],[53.4,14.3],[51.7,15.1]], 5.0, yE);
    pav([[44.5,-4.9],[46.2,-11.4],[49.4,-17.6],[53.7,-15.1],[53.3,-11.8],[55.2,-10.9],[55.8,-8.8],[55.4,-5.3],[53.5,-6.1],[53.4,-3.6]], 6.0, yE);
    pav([[42.7,-5.2],[44.6,-12.2],[47.8,-18.5],[49.4,-17.6],[46.2,-11.4],[44.5,-4.9]], 3.1, yE);
    pav([[42.6,5.9],[53.6,4.3],[53.5,6.7],[48.4,7.8],[51.7,15.1],[53.4,14.3],[53.4,16.1],[47.8,19.6],[44.6,13.1]], 2.8, yE);
    pav([[-53.2,-13.2],[-51.2,-14.1],[-48.6,-7.3],[-53.5,-5.8]], 3.0, yW);
    pav([[-53.3,3.6],[-44.1,5.1],[-44.7,9.0],[-45.8,12.4],[-49.2,18.9],[-53.3,16.5]], 4.0, yW);
    pav([[-49.2,18.9],[-45.8,12.4],[-44.7,9.0],[-44.1,5.1],[-41.8,5.5],[-43.3,11.7],[-46.0,17.7],[-47.4,19.8]], 3.0, yW);
    pav([[-53.1,-16.2],[-46.9,-19.2],[-43.6,-11.8],[-42.6,-7.2],[-42.4,-3.4],[-53.7,-3.1],[-53.5,-5.8],[-48.6,-7.3],[-51.2,-14.1],[-53.2,-13.2]], 3.7, yW);
    pav([[-6.7,-17.4],[-5.2,-24.3],[-1.7,-24.9],[-1.6,-25.3],[1.9,-25.3],[1.9,-24.7],[5.5,-24.3],[7.2,-17.5],[4.7,-18.3],[0.2,-18.9],[-4.5,-18.2]], 3.5, yN);
    // the Central Subway headhouse (south-east corner): glass box under a deep canopy
    pav([[24.4,29.0],[41.0,29.1],[41.0,38.2],[30.8,38.1],[30.7,35.8],[24.4,35.8]], 3.8, yS3);
    // ---------------- palms and lamp posts
    const oT = B.p(TRK), oF = B.p(FRD);
    for (const [u, v, y] of [[-45, -29, yN], [-31, -29, yN], [-17, -29, yN], [17, -29, yN], [31, -29, yN], [-53, -29, yN], [58.3, -30, yE], [58.3, -14, yE], [58.3, 0, yE],
      [-56, 23.5, yS1], [-52, 27.5, yS2], [54, 21, yS1], [-54.5, -21.5, yN], [-56.5, 1, yW], [58.3, 12, yE]])
      palm(oT, oF, u, y, v, 9.5 + r()*4.5, r);
    for (const [u, v] of [[-40, -17], [-20, -17], [20, -17], [40, -17], [-40, 13], [-20, 13], [20, 13], [40, 13]]){
      cylB(B.p(POST), u, v, 0.12, 0.09, yC, yC + 4.4, 6); latheB(B.p(LAMP), u, v, [[0.18, yC + 4.4], [0.3, yC + 4.7], [0.28, yC + 5.1], [0.05, yC + 5.3]], 6); }
    B.flush(b);
    return g; }};
place('sfdewey', -1.8, 1.6);

// =====================================================================================================================
// Lefty O'Doul Bridge (Third Street Bridge, 1933, Strauss heel-trunnion bascule): a 143 ft single-leaf riveted steel truss
// over Mission Creek beside the ballpark. The leaf's two trusses rise towards the heel at the north pier; there a steel tower
// on each side carries the huge concrete counterweight high above Third Street, linked to the leaf. Timber fenders line the
// channel, a little 1930s operator's house stands at the south-east corner. The road deck (and its ramps) is the app's own:
// the trusses stand just outside the drawn carriageways and the structure is fitted to the deck height (6.6 m above the water).
// Frame: u along Third Street from the south (leaf toe) to the north (heel, tower), v across (east-north-east).
// =====================================================================================================================
{
const LO = [-69.934, -6.008], LD = [-0.53240, -0.84649], LTH = Math.atan2(LD[1], LD[0]);
const LOX = LO[0] + 36*LD[0], LOZ = LO[1] + 36*LD[1];
LANDMARKS.sflefty = {zh:'莱夫蒂·欧杜尔桥', en:"Lefty O'Doul Bridge", cat:'old', r:54, h:30,
  lt:{m:0, c:'#ffe0b0', k:0.65, e:0.5},
  build(){
    const base = baseNow(), g = new THREE.Group(), s = frame(g, LOX, LOZ), b = bframe(s, LO[0], LO[1], LTH), B = mkB();
    const ST = {c:'#6f7d86'}, ST2 = '#5c6870', CW = {c:'#a9a59b'}, CON = '#b4afa4', TIM = '#6a5642', HOUSE = {c:'#ddd5c3'}, HWIN = {c:'#33393d', glow:'#ffd9a0', gk:0.7},
      LAMP = {c:'#f2e6cc', glow:'#ffe3b0', gk:1.8}, RED = {c:'#a01010', glow:'#ff2a1a', gk:2.2}, GRN = {c:'#107a20', glow:'#30ff60', gk:2.0};
    const DK = 6.3 - base, WL = -0.3 - base, rampN = u => DK - 0.055*Math.max(0, u - 45.5), rampS = u => DK - 0.055*Math.max(0, -u);
    const st = B.p(ST), st2 = B.p(ST2), con = B.p(CON);
    const VW = -14.7, VE = 13.7;                                          // truss planes, outside the drawn deck
    // ---- the leaf: two trusses, toe at u = 1.8, heel at u = 45.5
    const u0 = 1.8, u1 = 45.5, n = 8, yb = DK - 0.35, ytop = u => DK + 5.0 + (u - u0)/(u1 - u0)*5.8;
    for (const v of [VW, VE]){
      const P = []; for (let i = 0; i <= n; i++){ const u = u0 + (u1 - u0)*i/n; P.push([u, ytop(u)]); }
      beam(st, [u0 - 0.3, yb, v], [u1 + 0.3, yb, v], 0.45);                               // bottom chord
      beam(st, [P[0][0] + 1.6, P[0][1], v], [u1, P[n][1], v], 0.45);                      // top chord
      beam(st, [u0, yb, v], [P[0][0] + 1.6, P[0][1], v], 0.42);                          // inclined end post
      for (let i = 1; i <= n; i++){ const [u, y] = P[i]; beam(st2, [u, yb, v], [u, y, v], 0.28);
        const up = i === 1 ? P[0][0] + 1.6 : P[i - 1][0], yp = P[i - 1][1];
        if (i % 2) beam(st2, [up, yp, v], [u, yb, v], 0.22); else beam(st2, [up, yb, v], [u, y, v], 0.22); }
      // gusset-ish batten plates and a top cap rail
      for (let i = 0; i <= n; i++){ const [u, y] = P[i]; box(st2, u - 0.5, u + 0.5, y - 0.6, y + 0.15, v - 0.5, v + 0.5); }
      // the heel: deep end frame and the trunnion bearing
      box(st, u1 - 0.6, u1 + 0.6, yb - 1.2, P[n][1] + 0.4, v - 0.55, v + 0.55);
      box(st, u1 - 1.0, u1 + 1.0, yb - 2.2, yb - 0.2, v - 0.9, v + 0.9);
    }
    // floor beams under the deck at every panel point, and the toe/heel cross girders
    for (let i = 0; i <= n; i++){ const u = u0 + (u1 - u0)*i/n; box(st2, u - 0.35, u + 0.35, DK - 1.6, DK - 0.45, VW, VE); }
    box(st, u0 - 0.4, u0 + 0.6, DK - 2.0, DK - 0.45, VW, VE); box(st, u1 - 0.6, u1 + 0.6, DK - 2.2, DK - 0.45, VW, VE);
    for (const v of [VW + 5, -2, VE - 5]) box(st2, u0, u1, DK - 1.25, DK - 0.45, v - 0.3, v + 0.3);      // stringers
    // ---- piers: south rest pier, north heel pier (both under the deck), timber fenders along the channel
    box(con, -1.5, u0 + 0.6, WL - 3, rampS(-1.5) - 0.6, VW - 1.2, VE + 1.2);
    box(con, u1 - 1.2, u1 + 5.0, WL - 3, rampN(u1 + 5) - 2.4, VW - 1.2, VE + 1.2);
    for (const [uf, sg] of [[u0 + 1.2, 1], [u1 - 1.8, -1]]){ const o = B.p(TIM);
      box(o, uf - 0.25, uf + 0.25, WL - 0.8, WL + 2.4, VW - 10, VE + 10);
      for (let v = VW - 10; v <= VE + 10; v += 3) box(o, uf - 0.35 + sg*0.3, uf + 0.35 + sg*0.3, WL - 1.5, WL + 2.7, v - 0.25, v + 0.25); }
    // ---- the towers and the counterweight
    const yT = DK + 20.5, cu = 52.5;
    for (const v of [VW, VE]){
      const fb = [u1 - 0.2, WL], ff = [cu - 1.0, yT], bb = [cu + 8.5, WL], bf = [cu + 1.2, yT];
      beam(st, [fb[0], DK - 2, v], [ff[0], ff[1], v], 0.55); beam(st, [bb[0], WL, v], [bf[0], bf[1], v], 0.55);
      box(con, bb[0] - 1.6, bb[0] + 1.6, WL - 3, WL + 1.2, v - 1.6, v + 1.6);
      for (const t of [0.3, 0.55, 0.8]){ const ya = WL + (yT - WL)*t, ua = fb[0] + (ff[0] - fb[0])*Math.max(0, (ya - (DK - 2))/(yT - (DK - 2))), ub = bb[0] + (bf[0] - bb[0])*t;
        beam(st2, [ua, ya, v], [ub, ya, v], 0.25); }
      beam(st2, [fb[0] + 1.5, DK + 3, v], [bb[0] - 2.3, WL + (yT - WL)*0.55, v], 0.2); beam(st2, [bb[0] - 1, WL + 3, v], [ff[0] + 0.6, WL + (yT - WL)*0.8, v], 0.2);
      // counterweight trunnion bearing on the tower top
      box(st, cu - 1.6, cu + 1.6, yT - 0.4, yT + 0.8, v - 0.8, v + 0.8); box(st2, cu - 0.8, cu + 0.8, yT + 0.3, yT + 1.5, v - 1.1, v + 1.1);
      // counterweight frame arms and the link down to the leaf heel
      beam(st, [cu, yT + 0.4, v], [cu + 6.8, DK + 13.2, v], 0.45); beam(st, [cu, yT + 0.4, v], [cu - 4.2, DK + 15.5, v], 0.45);
      beam(st2, [cu - 4.2, DK + 15.5, v], [u1 - 0.5, ytop(u1) + 0.2, v], 0.38);
    }
    // overhead cross girders between the tower tops, and the concrete counterweight block
    box(st, cu - 1.2, cu + 1.2, yT - 0.2, yT + 1.4, VW, VE); box(st2, cu + 5, cu + 6.2, DK + 12.4, DK + 13.4, VW, VE);
    { const cw = B.p(CW); box(cw, cu - 2.6, cu + 6.4, DK + 12.6, DK + 19.0, VW + 0.7, VE - 0.7, true);
      box(B.p(CON), cu - 2.9, cu + 6.7, DK + 18.6, DK + 19.2, VW + 0.4, VE - 0.4); }
    // ---- the north approach girders (fitted under the app's ramp) and their bents
    for (const v of [VW + 0.6, VE - 0.6]) for (let u = u1 + 0.6; u < 76; u += 3){ const ua = u, ub = Math.min(76, u + 3);
      q4(st2, [ua, rampN(ua) - 0.4, v], [ub, rampN(ub) - 0.4, v], [ub, rampN(ub) - 1.6, v], [ua, rampN(ua) - 1.6, v]); }
    for (const u of [62.5, 75]){ box(con, u - 0.6, u + 0.6, WL - 2, rampN(u) - 1.6, VW, VE); }
    // railings on the trusses' inner faces (sidewalk level) and lamp posts
    for (const v of [VW + 0.5, VE - 0.5]){ beam(st2, [u0, DK + 1.1, v], [u1, DK + 1.1, v], 0.06); }
    for (const u of [8, 24, 40]) for (const v of [VW - 0.7, VE + 0.7]){ beam(st2, [u, DK, v], [u, DK + 6.0, v], 0.1); box(B.p(LAMP), u - 0.4, u + 0.4, DK + 5.6, DK + 6.4, v - 0.4, v + 0.4); }
    // navigation lights: red on the leaf toe, green on the fenders
    for (const v of [VW - 0.6, VE + 0.6]) box(B.p(RED), u0 - 0.2, u0 + 0.3, DK - 1.4, DK - 0.9, v - 0.25, v + 0.25);
    for (const [uf, v] of [[u0 + 1.2, VW - 10], [u0 + 1.2, VE + 10], [u1 - 1.8, VW - 10], [u1 - 1.8, VE + 10]]) box(B.p(GRN), uf - 0.3, uf + 0.3, WL + 2.7, WL + 3.3, v - 0.3, v + 0.3);
    // ---- the operator's house (OSM footprint, south-east corner): concrete base, glazed control room, flat roof
    { const R = [[4.6, 13.9], [4.6, 18.2], [-1.7, 18.2], [-1.6, 21.8], [-12.0, 22.0], [-11.9, 12.0], [-3.1, 12.0], [-3.1, 14.0]], h0 = WL;
      walls(B.p(HOUSE), R, h0 - 1, h0 + 4.2); band(B.p(CON), R, h0 + 4.0, h0 + 4.5, 0.2); walls(B.p(HOUSE), R, h0 + 4.5, h0 + 7.0); cap(B.p(CON), offRing(R, 0.5), h0 + 7.4);
      walls(B.p(CON), offRing(R, 0.5), h0 + 7.0, h0 + 7.4); winRow(B.p(HWIN), R, h0 + 4.9, 1.7, 1.4, 1.9, 0.06, 2); winRow(B.p(HWIN), R, h0 + 1.2, 1.8, 1.0, 3.2, 0.06, 3);
      box(B.p(CON), -12.3, 4.9, WL - 2, WL + 0.4, 11.4, 22.4); }
    // the little machinery tower at the north-east corner (OSM footprint, 10.6 m)
    { const R = [[64.9, 12.0], [64.8, 16.4], [57.0, 16.4], [57.0, 12.0]];
      walls(B.p(HOUSE), R, WL - 1, WL + 10.0); cap(B.p(CON), offRing(R, 0.4), WL + 10.6); walls(B.p(CON), offRing(R, 0.4), WL + 10.0, WL + 10.6);
      winRow(B.p(HWIN), R, WL + 7.4, 1.6, 1.2, 1.9, 0.06, 2); winRow(B.p(HWIN), R, WL + 3.2, 1.6, 0.9, 3.0, 0.06, 2); }
    B.flush(b);
    return g; }};
place('sflefty', LOX, LOZ);
}
}
