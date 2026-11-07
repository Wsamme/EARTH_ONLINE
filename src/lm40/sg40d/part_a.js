// ===== City Brush lm40 — group sg40d (Singapore: Orchard, Tanglin & Newton): 12 new landmarks =====
// Paragon, Wisma Atria, 313@Somerset, Hilton Singapore Orchard, Shaw House, Emerald Hill (terraces, split into row keys),
// Chesed-El Synagogue, Newton Food Centre, Orchard Road Presbyterian Church, St George's Church, Lucky Plaza and the
// Dempsey Hill site (former Tanglin Barracks). Every plan is traced from the real OSM footprints of SC/lm40/ref_sg40d.json
// (local metres around each ref anchor, +x east, +z south); every key is placed with rot 0, so the model axes are the ref axes.
// No logos, names, signs or text on any model; shopfronts and screens are plain colour fields.
{
const PI = Math.PI, HP = PI/2, TAU = PI*2;
// ref-local point (metres east / south of an anchor) -> lat / lon
const LL = (a, x, z) => [+(a[0] - z/110574).toFixed(6), +(a[1] + x/111290.5).toFixed(6)];
const sh = (P, O) => P.map(p => [p[0] - O[0], p[1] - O[1]]);
// triangle batches: many small parts of one colour become one LTris call
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const quad = (o, a, b, c, d) => o.push(...a, ...b, ...c, ...a, ...c, ...d);
const tri = (o, a, b, c) => o.push(...a, ...b, ...c);
function segP(o, a, b, r, n){
  n = n || 4; const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2], L = Math.hypot(dx, dy, dz); if (L < 1e-4) return;
  const d = [dx/L, dy/L, dz/L], up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let ux = d[1]*up[2]-d[2]*up[1], uy = d[2]*up[0]-d[0]*up[2], uz = d[0]*up[1]-d[1]*up[0]; const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
  const vx = d[1]*uz-d[2]*uy, vy = d[2]*ux-d[0]*uz, vz = d[0]*uy-d[1]*ux;
  const ring = p => { const R = []; for (let i = 0; i < n; i++){ const t = (i + 0.5)/n*TAU, c = Math.cos(t)*r, s = Math.sin(t)*r; R.push([p[0]+ux*c+vx*s, p[1]+uy*c+vy*s, p[2]+uz*c+vz*s]); } return R; };
  const A = ring(a), B = ring(b);
  for (let i = 0; i < n; i++){ const j = (i+1) % n; quad(o, A[i], A[j], B[j], B[i]); }
}
// oriented box (centre cx, cz, bottom y0); ry = rotation about +y like LBox
function boxT(o, cx, y0, cz, w, h, d, ry){
  const c = Math.cos(ry || 0), s = Math.sin(ry || 0), P = (x, y, z) => [cx + x*c + z*s, y, cz - x*s + z*c];
  const hw = w/2, hd = d/2, y1 = y0 + h;
  const A = P(-hw, y0, -hd), B = P(hw, y0, -hd), C = P(hw, y0, hd), D = P(-hw, y0, hd), E = P(-hw, y1, -hd), F = P(hw, y1, -hd), G = P(hw, y1, hd), H = P(-hw, y1, hd);
  quad(o, E, H, G, F); quad(o, A, B, F, E); quad(o, B, C, G, F); quad(o, C, D, H, G); quad(o, D, A, E, H);
}
// box spanning from point a to point b (x-z) of width w (across), heights y0..y1
function slabT(o, a, b, w, y0, y1){
  const dx = b[0]-a[0], dz = b[1]-a[1], L = Math.hypot(dx, dz); if (L < 1e-3) return;
  boxT(o, (a[0]+b[0])/2, y0, (a[1]+b[1])/2, L, y1 - y0, w, Math.atan2(-dz, dx));
}
function flatT(o, P, y, down){
  const t2 = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
  for (const t of t2){ const a = P[t[0]], b = P[t[1]], c = P[t[2]]; if (down) o.push(a[0], y, a[1], c[0], y, c[1], b[0], y, b[1]); else o.push(a[0], y, a[1], b[0], y, b[1], c[0], y, c[1]); }
}
function wallT(o, P, y0, y1, open){
  const f = (v, p) => typeof v === 'function' ? v(p) : v;
  for (let i = 0; i < P.length - (open ? 1 : 0); i++){ const a = P[i], b = P[(i+1) % P.length]; quad(o, [a[0], f(y0, a), a[1]], [b[0], f(y0, b), b[1]], [b[0], f(y1, b), b[1]], [a[0], f(y1, a), a[1]]); }
}
const areaS = P => { let A = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; A += a[0]*b[1] - b[0]*a[1]; } return A/2; };
// polygon offset (miter, clamped): d > 0 grows the ring outwards
function offP(P, d){
  const sg = areaS(P) > 0 ? 1 : -1, out = [];
  for (let i = 0; i < P.length; i++){
    const p0 = P[(i - 1 + P.length) % P.length], p1 = P[i], p2 = P[(i+1) % P.length];
    let ax = p1[0]-p0[0], az = p1[1]-p0[1], bx = p2[0]-p1[0], bz = p2[1]-p1[1]; const la = Math.hypot(ax, az) || 1, lb = Math.hypot(bx, bz) || 1; ax /= la; az /= la; bx /= lb; bz /= lb;
    const n1 = [az*sg, -ax*sg], n2 = [bz*sg, -bx*sg]; let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
    const k = d/Math.max(0.4, mx*n1[0] + mz*n1[1]); out.push([p1[0] + mx*k, p1[1] + mz*k]);
  }
  return out;
}
const prismT = (ow, ot, P, y0, y1) => { wallT(ow, P, y0, y1); flatT(ot, P, y1); };
// edges with outward normals: cb(a, b, L, u[x,z], n[x,z], i)
function edges(P, cb){ const sg = areaS(P) > 0 ? 1 : -1; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], L = Math.hypot(b[0]-a[0], b[1]-a[1]); if (L < 0.05) continue; const u = [(b[0]-a[0])/L, (b[1]-a[1])/L]; cb(a, b, L, u, [u[1]*sg, -u[0]*sg], i); } }
// a vertical quad on an edge: from t0..t1 (m along a->b), y0..y1, pushed out by off along the normal
function panT(o, a, u, n, t0, t1, y0, y1, off){ const p = t => [a[0] + u[0]*t + n[0]*off, a[1] + u[1]*t + n[1]*off]; const A = p(t0), B = p(t1); quad(o, [A[0], y0, A[1]], [B[0], y0, B[1]], [B[0], y1, B[1]], [A[0], y1, A[1]]); }
// a small box standing out of an edge: centre at t along the edge, width w, depth d (outwards from off), y0..y1
function finT(o, a, u, n, t, w, d, y0, y1, off){ const cx = a[0] + u[0]*t + n[0]*(off + d/2), cz = a[1] + u[1]*t + n[1]*(off + d/2); boxT(o, cx, y0, cz, w, y1 - y0, d, Math.atan2(-u[1], u[0])); }
const ngon = (n, r, cx, cz, a0) => { const P = []; for (let i = 0; i < n; i++){ const a = (a0 || 0) + i/n*TAU; P.push([(cx || 0) + Math.cos(a)*r, (cz || 0) + Math.sin(a)*r]); } return P; };
function latheT(o, prof, n, cx, cz, a0, a1){
  a0 = a0 || 0; a1 = a1 === undefined ? TAU : a1;
  for (let i = 0; i < n; i++){ const t0 = a0 + (a1 - a0)*i/n, t1 = a0 + (a1 - a0)*(i+1)/n, c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
    for (let k = 0; k < prof.length - 1; k++){ const p = prof[k], q = prof[k+1];
      quad(o, [cx + p[0]*c0, p[1], cz + p[0]*s0], [cx + p[0]*c1, p[1], cz + p[0]*s1], [cx + q[0]*c1, q[1], cz + q[0]*s1], [cx + q[0]*c0, q[1], cz + q[0]*s0]); } }
}
// gable / hip roof over a rotated rectangle (centre, length L along ry, width W), eave y, rise h, overhang ov; hip k (0 gable .. 0.5 pyramid)
function roofT(oR, oG, cx, cz, L, W, y, h, ry, ov, hip){
  const c = Math.cos(ry || 0), s = Math.sin(ry || 0), P = (x, yy, z) => [cx + x*c + z*s, yy, cz - x*s + z*c];
  const a = L/2 + (ov || 0), b = W/2 + (ov || 0), e = (hip || 0)*W, yt = y + h;
  const A = P(-a, y, -b), B = P(a, y, -b), C = P(a, y, b), D = P(-a, y, b), R0 = P(-a + e, yt, 0), R1 = P(a - e, yt, 0);
  quad(oR, A, R0, R1, B); quad(oR, C, R1, R0, D); tri(oR, B, R1, C); tri(oR, D, R0, A);
  if (!hip && oG){ const a2 = L/2, b2 = W/2; tri(oG, P(-a2, y, b2), P(-a2, y, -b2), P(-a2, yt, 0)); tri(oG, P(a2, y, -b2), P(a2, y, b2), P(a2, yt, 0)); }
}
// curtain-wall tower on polygon P: glass core inset, floor bands and fins on the outline
function towerT(B, P, y0, y1, o){
  const fh = o.fh || 3.6, bh = o.bh || 1.0, inset = o.inset === undefined ? 0.35 : o.inset;
  wallT(B.p(o.glass), offP(P, -inset), y0, y1);
  if (o.band) for (let y = y0 + (o.b0 === undefined ? fh - bh : o.b0); y < y1 - 0.2; y += fh) wallT(B.p(o.band), P, y, Math.min(y1, y + bh));
  if (o.fin) edges(P, (a, b, L, u, n) => { const k = Math.max(1, Math.round(L/(o.cw || 3))); for (let i = (o.fin0 ? 0 : 1); i < k + (o.fin0 ? 1 : 0); i++) finT(B.p(o.fin), a, u, n, L*i/k, o.fw || 0.25, o.fd || 0.35, y0, y1, -inset); });
  flatT(B.p(o.roof || o.band || o.glass), P, y1);
}
// solid prism with ribbon windows (punched look): walls of col, glass ribbons slightly proud
function ribbonT(B, P, y0, y1, o){
  wallT(B.p(o.wall), P, y0, y1); flatT(B.p(o.roof || o.wall), P, y1);
  const fh = o.fh || 3.6, wh = o.wh || 1.6;
  for (let y = y0 + (o.w0 || (fh - wh)/2); y + wh <= y1 - 0.3; y += fh) edges(P, (a, b, L, u, n) => { if (L < (o.minL || 4)) return; const m = o.margin || 1.2; panT(B.p(o.glass), a, u, n, m, L - m, y, y + wh, 0.06); });
}
const rooftopT = (B, col, P, y, r) => { // roof plant boxes inside P (from its bbox)
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of P){ x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
  return {x0, x1, z0, z1};
};
// lowest-floor foundation down to y = -6
const footT = (B, col, P, y1) => { wallT(B.p(col), P, -6, y1 === undefined ? 0.3 : y1); };
// app terrain baked round a model: the 70 m nodes (decimetres) -> h(x, y) = the app's hC, top(r, X, Y) = the app's model base
const terrK = T => {
  const hAtB = (x, y) => {
    const fx = Math.min(T.nx - 1.0001, Math.max(0, (x + 28000)/70 - T.i0)), fy = Math.min(T.ny - 1.0001, Math.max(0, (y + 28000)/70 - T.j0));
    const i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j, H = T.H, n = T.nx;
    return ((H[j*n+i]*(1-u) + H[j*n+i+1]*u)*(1-v) + (H[(j+1)*n+i]*(1-u) + H[(j+1)*n+i+1]*u)*v)/10;
  };
  const h = (x, y) => Math.max(-0.3, hAtB(x, y));
  const top = (r, X, Y) => { let hi = -1e9; for (let a = 0; a < 12; a++) for (const f of [0, 0.35, 0.7]) hi = Math.max(hi, h(X + Math.cos(a/12*TAU)*r*f, Y + Math.sin(a/12*TAU)*r*f)); return hi + 0.6; };
  return {h, top};
};

// ======================================================================================================
// Hilton Singapore Orchard (former Mandarin Hotel / Mandarin Orchard, 333 Orchard Road). Verified: two towers, Tower 1 (1971)
// 36 floors 144 m and Tower 2 (1973) 40 floors 152 m (Wikipedia infobox); the former revolving restaurant "Top of the M" in a
// "saucer-shaped tower on the hotel's rooftop" (roots.gov.sg postcard text; milelion: levels 38-39, ~170 m above ground);
// lobby and pool on level 5 (milelion); the Mandarin Gallery podium (DP Architects, 2009): a ~152 m long "wavy" glass front on
// Orchard Road with 10 m high glass walls, four storeys, five duplex shopfronts (Straits Times via sgpropertypeople 2009).
// Plans: OSM w41890074 (hotel block) with its tower part 0-152 m, OSM w728368561 (Mandarin Gallery) with its tower part.
// v40 integration check: the saucer stands on the ORIGINAL block, the Orchard Road slab (T1): roots.gov.sg (the saucer on the
// rooftop of the original hotel, a second wing added later), Wikipedia (the original block faces Orchard Road), oyster.com (the
// original block is the Orchard Wing, the Main Tower is newer), milelion (Top of the M, levels 38-39, is in the Orchard Wing).
// The rear slab (T2) gets the plain plant house. Facade bands / colours are not verified (neutral cream + glass).
// ======================================================================================================
{
const A0 = [1.301966, 103.836036], O = [42, -2];
const HOTEL = sh([[48.3,-29.7],[26.2,1.2],[-1.2,55.1],[-45.4,31.4],[0.6,-54.0]], O);
const T2 = sh([[22.1,9.5],[-1.8,53.9],[-20.9,43.8],[2.4,-0.6]], O);
const MG = sh([[-0.0,-52.8],[130.1,14.8],[109.2,41.5],[-17.9,-20.2]], O);
const T1 = sh([[15.5,-39.2],[85.9,-2.4],[76.4,14.8],[5.9,-21.4]], O);
const [LAT, LON] = LL(A0, O[0], O[1]);
LANDMARKS.sghiltonorchard = {zh:'乌节希尔顿酒店（原文华酒店）', en:'Hilton Singapore Orchard (former Mandarin Hotel)', cat:'new', r:102, h:160,
  lt:{m:0, c:'#ffe6c4', k:0.3, e:0.6}, build(){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
  const CREAM = '#e4ddcf', CREAM2 = '#d3cabb', GL = {c:'#3c4752', m:1, fh:3.2, cw:2.6}, MGGL = {c:'#7f98a3', m:1, fh:5.2, cw:4.0, lc:'#ffe9c8', lk:0.75};
  const MULL = '#c9ccce', DARK = '#4a4e52', ROOF = '#9a9890', POOL = {c:'#5fa9bf', glow:'#5fc9e0', gk:0.25}, SAU = {c:'#e9e6de', m:0, lc:'#fff0d8', lk:1.1};
  const SAUG = {c:'#55606a', glow:'#ffd9a0', gk:0.8};
  // --- hotel podium (5 storeys to the level-5 lobby and pool deck)
  footT(B, CREAM2, HOTEL);
  wallT(B.p(CREAM2), HOTEL, 0, 22); flatT(B.p(ROOF), HOTEL, 22);
  edges(HOTEL, (a, b, L, u, n) => { for (let y = 4.5; y < 21; y += 4.4) panT(B.p(GL), a, u, n, 1.5, L - 1.5, y, y + 2.2, 0.07); panT(B.p(DARK), a, u, n, 2, L - 2, 0, 3.8, 0.08); });
  // pool deck on the podium roof beside the level-5 lobby (west part of the hotel block)
  { const c = [-58, 20]; boxT(B.p(POOL), c[0], 22, c[1], 15, 0.35, 6, 0.5); boxT(B.p('#cfc8b9'), c[0], 22, c[1], 22, 0.2, 12, 0.5); }
  // --- Mandarin Gallery: four storeys, the wavy glass front on Orchard Road
  footT(B, CREAM2, MG);
  wallT(B.p(CREAM), MG, 0, 21); flatT(B.p(ROOF), MG, 21);
  edges(MG, (a, b, L, u, n, i) => {
    if (L > 120){ // the Orchard Road frontage (NE): five duplex waves of 10 m glass, mullions every 2 m
      const N = 60, wave = t => 1.1 + 1.3*Math.sin(t/L*5*TAU - HP);
      for (let k = 0; k < N; k++){ const t0 = L*k/N, t1 = L*(k + 1)/N, o0 = wave(t0), o1 = wave(t1);
        const p0 = [a[0] + u[0]*t0 + n[0]*o0, a[1] + u[1]*t0 + n[1]*o0], p1 = [a[0] + u[0]*t1 + n[0]*o1, a[1] + u[1]*t1 + n[1]*o1];
        quad(B.p(MGGL), [p0[0], 0, p0[1]], [p1[0], 0, p1[1]], [p1[0], 10.2, p1[1]], [p0[0], 10.2, p0[1]]);
        quad(B.p(MGGL), [p0[0], 11.0, p0[1]], [p1[0], 11.0, p1[1]], [p1[0], 20.4, p1[1]], [p0[0], 20.4, p0[1]]);
        quad(B.p(MULL), [p0[0], 10.2, p0[1]], [p1[0], 10.2, p1[1]], [p1[0], 11.0, p1[1]], [p0[0], 11.0, p0[1]]);
        quad(B.p(MULL), [p0[0], 20.4, p0[1]], [p1[0], 20.4, p1[1]], [p1[0], 21.4, p1[1]], [p0[0], 21.4, p0[1]]);
        tri(B.p(MULL), [a[0] + u[0]*t0, 21.4, a[1] + u[1]*t0], [p1[0], 21.4, p1[1]], [p0[0], 21.4, p0[1]]); tri(B.p(MULL), [a[0] + u[0]*t0, 21.4, a[1] + u[1]*t0], [a[0] + u[0]*t1, 21.4, a[1] + u[1]*t1], [p1[0], 21.4, p1[1]]);
        if (k % 2 === 0) segP(B.p(MULL), [p0[0], 0, p0[1]], [p0[0], 21, p0[1]], 0.12, 4);
      }
      // the five duplex frames: deeper portals at the wave crests
      for (let k = 0; k < 5; k++){ const t = L*(k + 0.5)/5; finT(B.p(MULL), a, u, n, t - 9, 0.8, 3.0, 0, 21.6, 0); finT(B.p(MULL), a, u, n, t + 9, 0.8, 3.0, 0, 21.6, 0); }
    } else {
      for (let y = 4.5; y < 20; y += 5.2) panT(B.p(MGGL), a, u, n, 1.5, L - 1.5, y, y + 2.8, 0.07);
      panT(B.p(DARK), a, u, n, 2, L - 2, 0, 4, 0.08);
    }
  });
  // --- the two hotel slabs: cream floor bands with dark ribbon glass, solid end walls
  const slab = (P, y0, y1) => {
    wallT(B.p(GL), offP(P, -0.3), y0, y1);
    edges(P, (a, b, L, u, n) => {
      if (L < 30){ // end walls: solid with a recessed vertical strip of windows
        panT(B.p(CREAM), a, u, n, 0, L/2 - 1.6, y0, y1, 0); panT(B.p(CREAM), a, u, n, L/2 + 1.6, L, y0, y1, 0);
        for (let y = y0; y < y1; y += 3.2) panT(B.p(CREAM2), a, u, n, L/2 - 1.6, L/2 + 1.6, y + 2.0, y + 3.2, -0.15);
      } else {
        for (let y = y0 + 1.8; y < y1 - 0.3; y += 3.2) panT(B.p(CREAM), a, u, n, 0, L, y, Math.min(y1, y + 1.55), 0);
        const k = Math.round(L/3.9); for (let i = 1; i < k; i++) finT(B.p(CREAM2), a, u, n, L*i/k, 0.32, 0.4, y0, y1, -0.3);
        panT(B.p(CREAM), a, u, n, 0, 0.8, y0, y1, 0.02); panT(B.p(CREAM), a, u, n, L - 0.8, L, y0, y1, 0.02);
      }
    });
    flatT(B.p(ROOF), P, y1);
    // parapet
    wallT(B.p(CREAM2), P, y1, y1 + 1.4); wallT(B.p(CREAM2), offP(P, -0.4), y1, y1 + 1.4);
  };
  slab(T1, 22, 140);
  slab(T2, 22, 150);
  // Tower 2 (rear) roof: lift / plant houses
  { const c = [(T2[0][0] + T2[2][0])/2, (T2[0][1] + T2[2][1])/2], ry = Math.atan2(-(T2[1][1] - T2[0][1]), T2[1][0] - T2[0][0]);
    boxT(B.p(CREAM2), c[0], 150, c[1], 22, 4, 9, ry); boxT(B.p(ROOF), c[0], 154, c[1], 23, 0.4, 10, ry); }
  // the saucer (former revolving restaurant Top of the M, levels 38-39) on the original Orchard Road block (T1, roof 140 m):
  // the same drum and flared disc, 10 m lower than on the 150 m slab
  { const c = [(T1[0][0] + T1[2][0])/2, (T1[0][1] + T1[2][1])/2];
    latheT(B.p(CREAM2), [[6.0, 140], [6.0, 143.2]], 20, c[0], c[1]);
    latheT(B.p(SAU), [[6.0, 143.2], [12.5, 144.6], [14.2, 145.4]], 32, c[0], c[1]);
    latheT(B.p(SAUG), [[14.2, 145.4], [14.6, 147.6], [14.6, 150.2]], 32, c[0], c[1]);
    latheT(B.p(SAU), [[14.6, 150.2], [14.9, 150.8], [12.5, 152.2], [7.0, 153.4], [4.0, 154.2]], 32, c[0], c[1]);
    latheT(B.p(CREAM2), [[4.0, 154.2], [3.2, 156.6], [0.01, 157.2]], 16, c[0], c[1]);
    segP(B.p('#b9b9b4'), [c[0], 156.6, c[1]], [c[0], 160, c[1]], 0.18, 4);
    for (let k = 0; k < 32; k++){ const t = k/32*TAU; segP(B.p(MULL), [c[0] + Math.cos(t)*14.65, 145.4, c[1] + Math.sin(t)*14.65], [c[0] + Math.cos(t)*14.65, 150.2, c[1] + Math.sin(t)*14.65], 0.1, 3); }
  }
  B.flush(g); return g; }};
SG_PLACES.push({type:'sghiltonorchard', lat:LAT, lon:LON, rot:0});
}

// ======================================================================================================
// Paragon (290 Orchard Road): verified 6 retail floors (Wikipedia infobox), a medical / office tower of 20 storeys counted from
// the ground (Wikipedia text; infobox: 14 medical floors over the podium), DP Architects' facade works 1999-2009: three glazed
// blocks projecting 4 m beyond the old elevation, a curved glazed entrance on a structural steel frame, ~115 m frontage
// (dpa.com.sg). Plans: OSM w172518496 (Paragon) and w121542055 (Paragon Medical tower). Facade grid colours not verified.
// ======================================================================================================
{
const A0 = [1.303837, 103.835681], O = [-4, 0];
const PAR = sh([[-28.0,50.9],[-31.0,49.1],[-32.8,52.7],[-91.9,22.4],[-74.6,-10.8],[-70.4,-8.4],[-58.4,-33.3],[-44.1,-28.6],[-30.4,-28.6],[-19.6,-32.7],[-10.7,-37.5],[-7.7,-35.7],[18.0,-84.3],[82.5,-51.1],[24.6,59.8],[28.7,62.2],[16.2,85.3],[-4.7,74.0],[0.1,65.7],[-4.1,63.3],[-3.5,70.5],[-10.7,70.5],[-17.2,69.3],[-23.8,65.7],[-30.4,59.8],[-33.4,53.9]], O);
const MED = sh([[75.9,-49.9],[57.4,-14.3],[0.7,-43.4],[18.6,-78.4]], O);
const [LAT, LON] = LL(A0, O[0], O[1]);
LANDMARKS.sgparagon = {zh:'百利宫', en:'Paragon', cat:'new', r:104, h:84,
  lt:{m:0, c:'#ffeccc', k:0.3, e:0.6}, build(){
  const g = new THREE.Group(), B = mkB();
  const STONE = '#ddd5c6', STONE2 = '#c9c0b0', GL = {c:'#5b6d78', m:1, fh:5.0, cw:3.4, lc:'#ffeccc', lk:0.8}, GLT = {c:'#3f505c', m:1, fh:3.8, cw:3.0};
  const FR = '#eceae4', STEEL = '#b6b9bb', ROOF = '#a19d94', DARK = '#3d4246', SHOP = {c:'#6f7a80', glow:'#fff0d6', gk:0.55};
  const H = 30;
  footT(B, STONE2, PAR);
  // podium: stone walls, glass bands on the back / side faces; the Orchard Road (south-west) frontage in glass boxes
  wallT(B.p(STONE), PAR, 0, H); flatT(B.p(ROOF), PAR, H);
  wallT(B.p(STONE2), PAR, H, H + 1.2); wallT(B.p(STONE2), offP(PAR, -0.5), H, H + 1.2);
  const front = (a, n) => n[1] > 0.35;            // faces looking south / south-west towards Orchard Road
  edges(PAR, (a, b, L, u, n) => {
    if (front(a, n) && L > 6){
      // glazed shop boxes: full-height glass with a white frame grid, standing 0.6 m proud
      panT(B.p(GL), a, u, n, 0.3, L - 0.3, 0, H - 2, 0.6);
      const k = Math.max(2, Math.round(L/3.4)); for (let i = 0; i <= k; i++) finT(B.p(FR), a, u, n, 0.3 + (L - 0.6)*i/k, 0.3, 0.5, 0, H - 2, 0.6);
      for (const y of [0, 5.2, 10.2, 15.2, 20.2, H - 2.6]) panT(B.p(FR), a, u, n, 0.3, L - 0.3, y, y + 0.6, 0.85);
      panT(B.p(FR), a, u, n, 0, L, H - 2, H + 1.2, 0.9);
    } else if (L > 4){
      for (let y = 5.5; y < H - 2; y += 5) panT(B.p(GL), a, u, n, 1.2, L - 1.2, y, y + 2.4, 0.06);
      panT(B.p(DARK), a, u, n, 1.5, L - 1.5, 0, 4.2, 0.07);
    }
  });
  // the three glazed blocks on the main frontage: deeper boxes 4 m out, different heights (fronting the long south-west face)
  { const a = PAR[3], b = PAR[2]; // (-91.9, 22.4) -> (-32.8, 52.7)
    const L = Math.hypot(b[0]-a[0], b[1]-a[1]), u = [(b[0]-a[0])/L, (b[1]-a[1])/L], n = [u[1], -u[0]];
    const nn = n[1] < 0 ? [-n[0], -n[1]] : n;
    for (const [t0, t1, hh] of [[4, 20, 24], [24, 42, 28], [46, 62, 20]]){
      const P = [[a[0] + u[0]*t0, a[1] + u[1]*t0], [a[0] + u[0]*t1, a[1] + u[1]*t1], [a[0] + u[0]*t1 + nn[0]*1.6, a[1] + u[1]*t1 + nn[1]*1.6], [a[0] + u[0]*t0 + nn[0]*1.6, a[1] + u[1]*t0 + nn[1]*1.6]];
      wallT(B.p(GL), P, 0.2, hh); flatT(B.p(FR), P, hh);
      edges(P, (p, q, l, uu, n2) => { const k = Math.max(1, Math.round(l/2.6)); for (let i = 0; i <= k; i++) finT(B.p(FR), p, uu, n2, l*i/k, 0.22, 0.25, 0.2, hh, 0); for (let y = 5; y < hh; y += 5) panT(B.p(FR), p, uu, n2, 0, l, y, y + 0.45, 0.2); });
      wallT(B.p(FR), P, hh - 0.2, hh + 0.8);
    }
  }
  // the curved glazed entrance in the arc of the frontage: steel ribs and a glass skin
  { const arc = PAR.slice(19, 26).concat([PAR[0]]); // (-3.5,70.5) ... (-33.4,53.9) -> (-28,50.9)
    for (let i = 0; i < arc.length - 1; i++){ const p = arc[i], q = arc[i + 1];
      quad(B.p(GL), [p[0], 0, p[1]], [q[0], 0, q[1]], [q[0], 16, q[1]], [p[0], 16, p[1]]);
      segP(B.p(STEEL), [p[0], 0, p[1]], [p[0], 17, p[1]], 0.3, 5);
      for (const y of [5.5, 11, 16.5]) segP(B.p(STEEL), [p[0], y, p[1]], [q[0], y, q[1]], 0.2, 4);
    }
    // canopy over the entrance
    const C = arc.map(p => [p[0], p[1]]); const cx = C.reduce((s, p) => s + p[0], 0)/C.length, cz = C.reduce((s, p) => s + p[1], 0)/C.length;
    const C2 = C.map(p => [p[0] + (p[0] - cx)*0.0 + 0, p[1] + 3.5]);
    for (let i = 0; i < C.length - 1; i++) quad(B.p(STEEL), [C[i][0], 6.5, C[i][1]], [C[i+1][0], 6.5, C[i+1][1]], [C2[i+1][0], 6.3, C2[i+1][1]], [C2[i][0], 6.3, C2[i][1]]);
  }
  // medical / office tower: 14 floors over the podium (top ~84 m): stone grid with blue-grey ribbon glass
  { const y0 = H, y1 = H + 14*3.8;
    wallT(B.p(GLT), offP(MED, -0.3), y0, y1);
    edges(MED, (a, b, L, u, n) => {
      for (let y = y0 + 2.4; y < y1; y += 3.8) panT(B.p(STONE), a, u, n, 0, L, y, Math.min(y1, y + 1.4), 0);
      const k = Math.round(L/4.2); for (let i = 0; i <= k; i++) finT(B.p(STONE), a, u, n, L*i/k, i === 0 || i === k ? 1.4 : 0.5, 0.5, y0, y1, -0.3);
    });
    flatT(B.p(ROOF), MED, y1); wallT(B.p(STONE2), MED, y1, y1 + 1.5);
    const c = [(MED[0][0] + MED[2][0])/2, (MED[0][1] + MED[2][1])/2], ry = Math.atan2(-(MED[1][1] - MED[0][1]), MED[1][0] - MED[0][0]);
    boxT(B.p(STONE2), c[0], y1, c[1], 18, 4.5, 14, ry);
  }
  B.flush(g); return g; }};
SG_PLACES.push({type:'sgparagon', lat:LAT, lon:LON, rot:0});
}
