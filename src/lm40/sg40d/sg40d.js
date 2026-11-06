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

// ======================================================================================================
// Wisma Atria (435 Orchard Road, 1986, DP Architects): a 5-level retail podium (4 above ground + basement) and a 22-storey
// office tower (offices on floors 10-22) (archello / singaporeofficespace). 2012 facelift: a faceted, crystalline glass
// enclosure up to 7.5 m in front of the old structure, ultra-clear glass with matte-aluminium cladding, a goal-post frame,
// grand monolithic stairs up to the level-2 entrances, upper-level backdrop cladding in blue horizontal strips (indesignlive,
// archello). Plan: OSM w172518503 with its parts (tower outline with stepped corners). Tower storey heights estimated.
// ======================================================================================================
{
const A0 = [1.303697, 103.833224], O = [0, 0];
const FP = sh([[-49.5,-53.5],[61.6,5.2],[37.1,54.4],[31.1,57.3],[26.4,53.8],[-8.9,21.2],[-63.8,-19.1],[-64.4,-24.5]], O);
const TW = sh([[30.5,-5.5],[49.0,4.0],[46.7,8.1],[50.2,9.9],[47.8,14.7],[52.6,17.0],[44.9,30.7],[39.5,28.3],[37.7,31.8],[35.3,30.7],[33.5,33.6],[15.0,24.1],[16.8,20.6],[14.4,19.4],[16.8,15.8],[12.0,13.5],[19.8,-0.8],[24.0,1.6],[26.4,-2.5],[28.7,-1.4]], O);
const TOPA = sh([[26.4,-2.5],[50.2,9.9],[47.8,14.7],[52.6,17.0],[44.9,30.7],[39.5,28.3],[37.7,31.8],[14.4,19.4],[16.8,15.8],[12.0,13.5],[19.8,-0.8],[24.0,1.6]], O);
const TOPB = sh([[19.8,-0.8],[52.6,17.0],[44.9,30.7],[12.0,13.5]], O);
const [LAT, LON] = LL(A0, O[0], O[1]);
LANDMARKS.sgwismaatria = {zh:'威士马广场', en:'Wisma Atria', cat:'new', r:84, h:92,
  lt:{m:0, c:'#ffeed6', k:0.3, e:0.6}, build(){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
  const ALU = '#b9bcbe', ALU2 = '#9fa3a6', BLUE = '#2f5f9a', GLC = {c:'#93b3bf', op:0.78, ds:true, glow:'#fff2dc', gk:0.35}, BACK = {c:'#4f5c66', m:1, fh:5, cw:4, lc:'#ffeccc', lk:0.8};
  const TWC = '#d9dbd8', TWG = {c:'#35546e', m:1, fh:3.8, cw:3.0}, STAIR = {c:'#cfccc4', glow:'#bcd8ff', gk:0.25}, ROOF = '#9b9a95', DARK = '#3e4448';
  const H = 21;
  footT(B, ALU2, FP);
  // podium body: original structure set back 7.5 m behind the faceted front on Orchard Road (the long NE face, edge 0)
  const FPb = FP.map(p => p.slice()); { const a = FP[0], b = FP[1], L = Math.hypot(b[0]-a[0], b[1]-a[1]), n = [(b[1]-a[1])/L, -(b[0]-a[0])/L]; for (const k of [0, 1]){ FPb[k][0] -= n[0]*7.5; FPb[k][1] -= n[1]*7.5; } }
  wallT(B.p(ALU), FPb, 0, H); flatT(B.p(ROOF), FPb, H);
  edges(FPb, (a, b, L, u, n, i) => {
    if (i === 0){
      // upper backdrop: blue horizontal strips on hollow-channel cladding (14 - 21 m)
      for (let y = 14.2; y < H; y += 1.15) panT(B.p(BLUE), a, u, n, 0, L, y, y + 0.55, 0.05);
      panT(B.p(BACK), a, u, n, 0.5, L - 0.5, 2.5, 14, -0.4);
      // the faceted glass enclosure: a folded skin of triangles, depth 2 - 7 m in front of the old line, 2.5 - 14.5 m high
      const N = 18, dep = k => 2.0 + 5.0*Math.abs(Math.sin(k*1.7 + 0.4)), top = k => 13 + 1.6*Math.abs(Math.cos(k*1.3));
      let prev = null;
      for (let k = 0; k <= N; k++){
        const t = L*k/N, d = (k === 0 || k === N) ? 0.3 : dep(k), ht = top(k);
        const bot = [a[0] + u[0]*t + n[0]*d, 2.4, a[1] + u[1]*t + n[1]*d], mid = [a[0] + u[0]*t + n[0]*(d*0.6), ht, a[1] + u[1]*t + n[1]*(d*0.6)], back = [a[0] + u[0]*t, ht + 0.6, a[1] + u[1]*t];
        if (prev){ tri(B.p(GLC), prev.bot, bot, mid); tri(B.p(GLC), prev.bot, mid, prev.mid); tri(B.p(GLC), prev.mid, mid, back); tri(B.p(GLC), prev.mid, back, prev.back);
          segP(B.p(ALU), prev.bot, bot, 0.12, 3); segP(B.p(ALU), prev.mid, mid, 0.12, 3); }
        segP(B.p(ALU), bot, mid, 0.14, 3); segP(B.p(ALU), mid, back, 0.12, 3);
        prev = {bot, mid, back};
      }
      // goal-post frame: two main columns and the beam
      for (const t of [L*0.3, L*0.7]) finT(B.p(ALU2), a, u, n, t, 1.4, 1.4, 0, 15.5, 5.5);
      { const p0 = [a[0] + u[0]*L*0.3 + n[0]*6.2, a[1] + u[1]*L*0.3 + n[1]*6.2], p1 = [a[0] + u[0]*L*0.7 + n[0]*6.2, a[1] + u[1]*L*0.7 + n[1]*6.2]; slabT(B.p(ALU2), p0, p1, 1.4, 14.6, 15.6); }
      // grand stairs up to the level-2 entrances (monolithic, also a flood barrier)
      for (let s = 0; s < 8; s++){ const dd = 7.5 + (8 - s)*0.9; panT(B.p(STAIR), a, u, n, L*0.36, L*0.64, 0, 0.3*(s + 1), dd);
        const pA = [a[0] + u[0]*L*0.36 + n[0]*dd, a[1] + u[1]*L*0.36 + n[1]*dd], pB = [a[0] + u[0]*L*0.64 + n[0]*dd, a[1] + u[1]*L*0.64 + n[1]*dd], pC = [pB[0] - n[0]*0.8, pB[1] - n[1]*0.8], pD = [pA[0] - n[0]*0.8, pA[1] - n[1]*0.8];
        flatT(B.p(STAIR), [pA, pB, pC, pD], 0.3*(s + 1)); }
      { const pA = [a[0] + u[0]*L*0.36, a[1] + u[1]*L*0.36], pB = [a[0] + u[0]*L*0.64, a[1] + u[1]*L*0.64]; flatT(B.p(STAIR), [pA, pB, [pB[0] + n[0]*1.7, pB[1] + n[1]*1.7], [pA[0] + n[0]*1.7, pA[1] + n[1]*1.7]], 2.4); }
    } else if (L > 4){
      for (let y = 5; y < H - 1; y += 5) panT(B.p(BACK), a, u, n, 1, L - 1, y, y + 2.2, 0.06);
      panT(B.p(DARK), a, u, n, 1.2, L - 1.2, 0, 4, 0.07);
    }
  });
  // office tower (22 storeys): light cladding bands, blue-grey glass ribbons, stepped-corner plan; stepped crown
  const y0 = H, y1 = 84;
  wallT(B.p(TWG), offP(TW, -0.25), y0, y1);
  for (let y = y0 + 2.4; y < y1; y += 3.8) wallT(B.p(TWC), TW, y, Math.min(y1, y + 1.4));
  edges(TW, (a, b, L, u, n) => { if (L < 3) finT(B.p(TWC), a, u, n, L/2, L, 0.3, y0, y1, -0.25); });
  flatT(B.p(ROOF), TW, y1);
  wallT(B.p(TWC), TOPA, y1, 88); flatT(B.p(ROOF), TOPA, 88);
  wallT(B.p(TWC), offP(TOPB, -2.5), 88, 92); flatT(B.p(ROOF), offP(TOPB, -2.5), 92);
  B.flush(g); return g; }};
SG_PLACES.push({type:'sgwismaatria', lat:LAT, lon:LON, rot:0});
}

// ======================================================================================================
// Lucky Plaza (304 Orchard Road): a 30-storey commercial-cum-residential building by BEP Akitek, podium opened 1977, apartment
// block 1981 (Wikipedia); an "open vertical bazaar" of stacked galleries round a high open space, wide glass shopfronts.
// Plan: OSM w172518492 (podium, 8 floors) with its parts (H-shaped apartment tower 26.4 m - roof, roof house). Podium setbacks,
// colours and the tower's balconies are not verified (kept plain: light podium bands, cream tower with window rows).
// ======================================================================================================
{
const A0 = [1.304483, 103.833981], O = [0, -5];
const FP = sh([[3.0,-44.9],[1.2,-40.8],[9.0,-36.6],[10.2,-39.6],[55.5,7.3],[57.9,17.9],[35.8,58.9],[-61.5,7.3],[-22.7,-65.7],[-12.5,-60.3]], O);
const TW = sh([[7.8,15.0],[11.4,7.3],[16.1,9.6],[20.3,3.1],[15.5,0.2],[20.3,-8.1],[43.0,4.3],[38.8,12.6],[34.6,10.2],[31.1,17.9],[36.4,20.3],[31.1,28.0]], O);
const RH = sh([[32.3,4.9],[25.1,17.9],[17.9,14.4],[25.1,1.3]], O);
const [LAT, LON] = LL(A0, O[0], O[1]);
LANDMARKS.sgluckyplaza = {zh:'幸运商业中心', en:'Lucky Plaza', cat:'new', r:84, h:97,
  lt:{m:0, c:'#ffe7c2', k:0.3, e:0.6}, build(){
  const g = new THREE.Group(), B = mkB();
  const POD = '#d8d2c6', POD2 = '#bdb5a8', GL = {c:'#56646c', m:1, fh:3.4, cw:3.2, lc:'#ffeccc', lk:0.8}, TWC = '#e6e0d2', TWG = {c:'#4a5258', m:1, fh:3.0, cw:2.6};
  const ROOF = '#9d9a93', DARK = '#3d4246';
  const H = 27;
  footT(B, POD2, FP);
  wallT(B.p(POD), FP, 0, H); flatT(B.p(ROOF), FP, H);
  wallT(B.p(POD2), FP, H, H + 1.1);
  edges(FP, (a, b, L, u, n) => {
    if (L < 4) return;
    const front = n[1] > 0.4;      // Orchard Road (south-west) frontage: wide glass shopfront bands on all 8 floors
    for (let y = 0.6, f = 0; y < H - 1; y += 3.4, f++) panT(B.p(f === 0 ? DARK : GL), a, u, n, 0.8, L - 0.8, y + 0.5, y + (front ? 2.9 : 2.0), 0.07);
    if (front) for (let y = 3.4; y < H; y += 3.4) panT(B.p(POD2), a, u, n, 0, L, y - 0.2, y + 0.3, 0.3);
  });
  // apartment tower: 22 residential floors over the 8-floor podium (~93 m), window rows on every face
  const y0 = H, y1 = H + 22*3.0;
  wallT(B.p(TWC), TW, y0, y1); flatT(B.p(ROOF), TW, y1);
  edges(TW, (a, b, L, u, n) => { for (let y = y0 + 0.9; y < y1 - 1; y += 3.0){ if (L > 5){ const k = Math.floor((L - 1.2)/2.6); for (let i = 0; i < k; i++){ const t = (L - k*2.6)/2 + i*2.6; panT(B.p(TWG), a, u, n, t + 0.35, t + 2.25, y, y + 1.5, 0.05); } } else panT(B.p(TWG), a, u, n, 0.5, L - 0.5, y, y + 1.5, 0.05); } });
  wallT(B.p(TWC), TW, y1, y1 + 1.2);
  wallT(B.p(TWC), RH, y1, y1 + 4); flatT(B.p(ROOF), RH, y1 + 4);
  B.flush(g); return g; }};
SG_PLACES.push({type:'sgluckyplaza', lat:LAT, lon:LON, rot:0});
}

// ======================================================================================================
// 313@somerset (313 Orchard Road, completed Dec 2009): eight retail levels (KONE reference) above Somerset MRT station.
// Plan: OSM w52236347 with its parts (main block 0-36.9 m, the north-east corner block 0-17.1 m, the low link to Discovery
// Walk 0-7.2 m). Facade (glass grid on Orchard Road, solid flanks) kept generic: the real cladding pattern is not verified.
// ======================================================================================================
{
const A0 = [1.301019, 103.838369], O = [0, 0];
const MAIN = sh([[31.1,15.6],[22.1,52.4],[-35.8,40.5],[-35.2,37.0],[-44.7,35.2],[-16.7,6.1],[-11.3,-6.9],[-30.4,-16.4],[-44.7,-27.7],[-29.8,-52.0],[1.8,-37.1],[21.5,-28.8],[57.9,-17.0],[50.8,6.1],[47.8,19.8]], O);
const NE = sh([[29.3,24.5],[31.1,15.6],[47.8,19.8],[46.0,28.7]], O);
const LINK = sh([[-66.8,-45.4],[-30.4,-16.4],[-11.3,-6.9],[-15.5,3.2],[-29.2,-3.3],[-49.5,-19.9],[-50.7,-18.8],[-75.8,-41.3]], O);
const [LAT, LON] = LL(A0, O[0], O[1]);
LANDMARKS.sg313somerset = {zh:'313@索美塞', en:'313@Somerset', cat:'new', r:70, h:40,
  lt:{m:0, c:'#ffeed8', k:0.3, e:0.6}, build(){
  const g = new THREE.Group(), B = mkB();
  const WALL = '#d6d3cc', WALL2 = '#b8b4ac', GL = {c:'#5f7480', m:1, fh:4.6, cw:3.6, lc:'#fff0d8', lk:0.85}, FR = '#e9e8e3', ROOF = '#999891', DARK = '#3b4045', GLC = {c:'#9fbac4', op:0.6, ds:true};
  const H = 37;
  footT(B, WALL2, MAIN);
  wallT(B.p(WALL), MAIN, 0, H); flatT(B.p(ROOF), MAIN, H); wallT(B.p(WALL2), MAIN, H, H + 1.4);
  edges(MAIN, (a, b, L, u, n) => {
    if (L < 4) return;
    const front = n[1] < -0.45;    // Orchard Road (north) frontage: a full glass wall with a white grid
    if (front){
      panT(B.p(GL), a, u, n, 0.4, L - 0.4, 0.3, H - 1, 0.25);
      const k = Math.max(2, Math.round(L/4.6)); for (let i = 0; i <= k; i++) finT(B.p(FR), a, u, n, 0.4 + (L - 0.8)*i/k, 0.35, 0.6, 0, H - 0.6, 0.25);
      for (let y = 4.6; y < H; y += 4.6) panT(B.p(FR), a, u, n, 0.4, L - 0.4, y - 0.35, y + 0.35, 0.55);
    } else {
      for (let y = 5; y < H - 2; y += 4.6) panT(B.p(GL), a, u, n, 1.2, L - 1.2, y, y + 1.6, 0.07);
      panT(B.p(DARK), a, u, n, 1.4, L - 1.4, 0, 4.4, 0.08);
    }
  });
  // the north-west corner to Orchard Road / Discovery Walk: a tall glass entrance hall with a canopy
  { const a = MAIN[9], b = MAIN[10]; // (-29.8,-52) -> (1.8,-37.1)
    const L = Math.hypot(b[0]-a[0], b[1]-a[1]), u = [(b[0]-a[0])/L, (b[1]-a[1])/L], n = [u[1], -u[0]]; const nn = n[1] > 0 ? [-n[0], -n[1]] : n;
    const P = [[a[0] + u[0]*3, a[1] + u[1]*3], [a[0] + u[0]*15, a[1] + u[1]*15], [a[0] + u[0]*15 + nn[0]*2.5, a[1] + u[1]*15 + nn[1]*2.5], [a[0] + u[0]*3 + nn[0]*2.5, a[1] + u[1]*3 + nn[1]*2.5]];
    wallT(B.p(GLC), P, 0.3, 26); flatT(B.p(FR), P, 26); wallT(B.p(FR), P, 25.4, 26.4);
    const C = [[a[0] - u[0]*2 + nn[0]*2.5, a[1] - u[1]*2 + nn[1]*2.5], [a[0] + u[0]*20 + nn[0]*2.5, a[1] + u[1]*20 + nn[1]*2.5], [a[0] + u[0]*20 + nn[0]*6, a[1] + u[1]*20 + nn[1]*6], [a[0] - u[0]*2 + nn[0]*6, a[1] - u[1]*2 + nn[1]*6]];
    flatT(B.p(FR), C, 5.5); flatT(B.p(FR), C, 5.2, true);
  }
  // the lower north-east block (0-17 m)
  footT(B, WALL2, NE); wallT(B.p(WALL), NE, 0, 17); flatT(B.p(ROOF), NE, 17);
  edges(NE, (a, b, L, u, n) => { for (let y = 5; y < 16; y += 4.6) panT(B.p(GL), a, u, n, 1, L - 1, y, y + 1.6, 0.07); });
  // (the low link block to Discovery Walk, OSM part 0-7.2 m, is left to the map: its hull would hide Pan Pacific Serviced Suites)
  B.flush(g); return g; }};
SG_PLACES.push({type:'sg313somerset', lat:LAT, lon:LON, rot:0});
}

// ======================================================================================================
// Shaw House (350 Orchard Road, corner of Scotts Road, opened 1993): a 21-storey office building on a 6-storey retail /
// entertainment podium (corporatespace), the Lido cineplex on levels 5-6 (orchard trail blog). Plan: OSM w41889431 with its
// parts: podium 0-13.8 m, the cinema levels 13.2-23.7 m over the whole site, the office tower part on the west corner (a wedge
// with a curved inner face). Tower = 15 floors over the podium, two stepped setbacks at the top (the "stepped office tower" of
// the brief's hint; the real step count is not verified); granite / glass colours not verified (neutral warm grey).
// ======================================================================================================
{
const A0 = [1.305791, 103.831507], O = [0, -2];
const FP = sh([[44.3,23.8],[38.9,30.9],[35.4,32.7],[21.6,38.0],[13.9,38.0],[6.7,36.9],[-51.8,9.6],[-53.6,5.4],[-48.2,-7.0],[-48.8,-8.2],[-27.3,-46.8],[58.6,-1.7]], O);
const TW = sh([[-52.4,4.8],[-41.1,-20.1],[-26.7,-45.6],[0.1,-29.6],[-7.0,-22.4],[-15.4,-11.8],[-25.5,5.4],[-29.7,17.3]], O);
const [LAT, LON] = LL(A0, O[0], O[1]);
LANDMARKS.sgshawhouse = {zh:'邵氏大厦', en:'Shaw House', cat:'new', r:66, h:82,
  lt:{m:0, c:'#ffe9c8', k:0.3, e:0.6}, build(){
  const g = new THREE.Group(), B = mkB();
  const GRAN = '#c9bfb2', GRAN2 = '#ada294', GL = {c:'#3e5462', m:1, fh:3.7, cw:3.0}, GLP = {c:'#5f727c', m:1, fh:4.4, cw:3.6, lc:'#ffeccc', lk:0.8}, ROOF = '#9b968d', DARK = '#3a3f43';
  const SCR = {c:'#55606b', glow:'#9ec4ff', gk:0.5};
  footT(B, GRAN2, FP);
  // podium (retail 0-13.8 m) and the cinema levels (to 23.7 m): granite with glass bands, a plain lit panel on the corner (no image)
  wallT(B.p(GRAN), FP, 0, 23.7); flatT(B.p(ROOF), FP, 23.7); wallT(B.p(GRAN2), FP, 23.7, 25);
  edges(FP, (a, b, L, u, n) => { if (L < 4) return;
    for (let y = 4.6; y < 13; y += 4.4) panT(B.p(GLP), a, u, n, 1, L - 1, y, y + 2.6, 0.07);
    panT(B.p(DARK), a, u, n, 1.2, L - 1.2, 0, 4.2, 0.08);
    panT(B.p(GRAN2), a, u, n, 0, L, 13.4, 14.2, 0.25);
    for (let x = 2; x < L - 2; x += 4) panT(B.p(GRAN2), a, u, n, x, x + 0.6, 14.2, 23.7, 0.12);
  });
  // office tower: 15 floors over the podium, stepping in twice at the top
  const steps = [[23.7, 68.1, 0], [68.1, 75.5, -2.2], [75.5, 79.2, -4.4]];
  for (const [y0, y1, d] of steps){
    const P = d ? offP(TW, d) : TW;
    wallT(B.p(GL), offP(P, -0.3), y0, y1);
    for (let y = y0 + 2.3; y < y1; y += 3.7) wallT(B.p(GRAN), P, y, Math.min(y1, y + 1.3));
    edges(P, (a, b, L, u, n) => { const k = Math.max(1, Math.round(L/3.7)); for (let i = 0; i <= k; i++) finT(B.p(GRAN), a, u, n, L*i/k, i === 0 || i === k ? 1.2 : 0.45, 0.45, y0, y1, -0.3); });
    flatT(B.p(ROOF), P, y1); wallT(B.p(GRAN2), P, y1, y1 + 1.0);
  }
  { const P = offP(TW, -9); wallT(B.p(GRAN2), P, 79.2, 82); flatT(B.p(ROOF), P, 82); }
  B.flush(g); return g; }};
SG_PLACES.push({type:'sgshawhouse', lat:LAT, lon:LON, rot:0});
}

// ---------- heritage helpers ----------
// round-arched opening outline (width w, springing height hs, apex = hs + w/2), as an x-y shape for LShape-like batching
const archPts = (w, hs, n) => { const P = [[-w/2, 0], [w/2, 0], [w/2, hs]]; for (let i = 1; i < n; i++){ const a = PI*i/n; P.push([Math.cos(a)*w/2, hs + Math.sin(a)*w/2]); } P.push([-w/2, hs]); return P; };
// a flat x-y shape placed on an edge at t (centre) with its plane offset off along the normal; triangulated into a batch
function shapeOnEdge(o, a, u, n, t, P, y0, off){
  const tr = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
  const W = p => [a[0] + u[0]*(t + p[0]) + n[0]*off, y0 + p[1], a[1] + u[1]*(t + p[0]) + n[1]*off];
  for (const q of tr) tri(o, W(P[q[0]]), W(P[q[2]]), W(P[q[1]]));
}
// an arch ring (archivolt) round a round-arched opening: thin band of width bw
function archRing(o, a, u, n, t, w, hs, bw, y0, off, nseg){
  nseg = nseg || 8; const r0 = w/2, r1 = w/2 + bw;
  const W = (x, y) => [a[0] + u[0]*(t + x) + n[0]*off, y0 + y, a[1] + u[1]*(t + x) + n[1]*off];
  for (let i = 0; i < nseg; i++){ const a0 = PI*i/nseg, a1 = PI*(i+1)/nseg;
    quad(o, W(Math.cos(a0)*r0, hs + Math.sin(a0)*r0), W(Math.cos(a1)*r0, hs + Math.sin(a1)*r0), W(Math.cos(a1)*r1, hs + Math.sin(a1)*r1), W(Math.cos(a0)*r1, hs + Math.sin(a0)*r1)); }
}
// a column (shaft + base + capital) between y0 and y1 at x, z
function colT(o, oc, x, z, y0, y1, r, seg){ seg = seg || 8; latheT(o, [[r*1.35, y0], [r*1.35, y0 + 0.35], [r*1.05, y0 + 0.5], [r, y0 + 0.6], [r*0.9, y1 - 0.55], [r*1.0, y1 - 0.5]], seg, x, z); latheT(oc || o, [[r*1.0, y1 - 0.5], [r*1.45, y1 - 0.15], [r*1.5, y1]], seg, x, z); }

// ======================================================================================================
// Chesed-El Synagogue (2 Oxley Rise, 1905, national monument): Late Renaissance style by R. A. J. Bidwell of Swan & Maclaren;
// a spacious three-arched porte-cochere as the grand entrance; arches, Corinthian columns and large arched windows; floral
// plasterwork, continuous cornices; the ark on a raised platform at the west end (roots.gov.sg national monuments, NHB).
// Plan: OSM w172748756 (the hall, the polygonal west bay of the ark, the half-octagon porch on the east towards Oxley Rise:
// its three faces carry the three arches). Storey heights, the parapet and the roof colour are estimates; white walls with
// pale grey mouldings (colours not verified).
// ======================================================================================================
{
const A0 = [1.297254, 103.842623], O = [0, 0];
const FP = sh([[13.9,10.9],[-13.8,11.6],[-13.8,5.1],[-15.0,5.0],[-18.6,2.0],[-18.0,-2.2],[-15.6,-4.6],[-14.4,-4.7],[-14.4,-10.5],[13.2,-11.7],[13.3,-7.0],[18.0,-2.8],[18.0,2.0],[13.9,6.2]], O);
const HALL = [[13.6,-11.5],[13.6,11.1],[-14.1,11.4],[-14.1,-10.7]].reverse();
const APSE = [[-14.1,-4.7],[-15.6,-4.6],[-18.0,-2.2],[-18.6,2.0],[-15.0,5.0],[-14.1,5.1]];
const PORCH = [[13.4,-7.0],[18.0,-2.8],[18.0,2.0],[13.6,6.2]];
const [LAT, LON] = LL(A0, O[0], O[1]);
LANDMARKS.sgchesedel = {zh:'赫塞德埃尔犹太会堂', en:'Chesed-El Synagogue', cat:'old', r:24, h:17,
  lt:{m:0, c:'#fff1dc', k:0.75, e:0.75, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB();
  const WH = '#f0ede5', MO = '#d9d4c8', MO2 = '#c4beb1', WIN = {c:'#4c5862', glow:'#ffe2b0', gk:0.35}, ROOF = '#8e8c86', STEP = '#c9c3b6', DOOR = '#5d4632';
  const Y1 = 6.2, Y2 = 11.4, YC = 12.4, YP = 13.4;
  footT(B, MO2, FP, 0.6);
  flatT(B.p(STEP), FP, 0.6);
  // hall body (two storeys: ground floor and the women's gallery)
  wallT(B.p(WH), HALL, 0.6, YC);
  // plinth, string course, entablature and cornice running round the hall, apse and porch
  for (const P of [HALL, APSE]){
    wallT(B.p(MO2), offP(P, 0.12), 0, 1.3);
    wallT(B.p(MO), offP(P, 0.15), Y1 - 0.2, Y1 + 0.45);
    wallT(B.p(MO), offP(P, 0.15), Y2, Y2 + 0.5); wallT(B.p(MO), offP(P, 0.45), Y2 + 0.5, YC);
    flatT(B.p(MO), offP(P, 0.45), YC);
  }
  // bays of pilasters and large arched windows on the long north and south walls and the west end
  edges(HALL, (a, b, L, u, n, i) => {
    const east = n[0] > 0.7;
    const nb = Math.max(2, Math.round(L/4.6));
    for (let k = 0; k <= nb; k++){ const t = L*k/nb; if (east && Math.abs(t - L/2) < 7) continue;
      finT(B.p(MO), a, u, n, t, k === 0 || k === nb ? 1.2 : 0.7, 0.3, 1.3, Y1 - 0.2, 0); finT(B.p(MO), a, u, n, t, k === 0 || k === nb ? 1.1 : 0.6, 0.28, Y1 + 0.45, Y2, 0);
      finT(B.p(MO2), a, u, n, t, 0.95, 0.4, Y2 - 0.6, Y2, 0); }
    for (let k = 0; k < nb; k++){ const t = L*(k + 0.5)/nb; if (east && Math.abs(t - L/2) < 7) continue;
      if (Math.abs(n[0]) > 0.7 && !east && Math.abs(t - L/2) < 6) continue;      // the ark bay on the west
      shapeOnEdge(B.p(WIN), a, u, n, t, archPts(1.9, 3.4, 8), 1.6, 0.05); archRing(B.p(MO), a, u, n, t, 1.9, 3.4, 0.28, 1.6, 0.1);
      shapeOnEdge(B.p(WIN), a, u, n, t, archPts(1.7, 2.6, 8), Y1 + 0.9, 0.05); archRing(B.p(MO), a, u, n, t, 1.7, 2.6, 0.25, Y1 + 0.9, 0.1);
      finT(B.p(MO), a, u, n, t, 2.4, 0.25, 1.35, 1.6, 0); }
  });
  // the polygonal ark bay on the west: blind arches, cornice, balustrade
  wallT(B.p(WH), APSE, 0.6, YC, true);
  edges(APSE.concat([]), (a, b, L, u, n, i) => { if (i === APSE.length - 1 || L < 1.5) return; shapeOnEdge(B.p(MO2), a, u, n, L/2, archPts(Math.min(1.6, L*0.5), 3.0, 6), Y1 + 0.9, 0.04); });
  flatT(B.p(ROOF), APSE, YC);
  // parapet with balusters round the hall roof, a raised central panel over the porch side
  const par = (P, y, h) => { const Q = offP(P, 0.3); wallT(B.p(MO), Q, y, y + 0.25); wallT(B.p(MO), Q, y + h - 0.25, y + h); edges(Q, (a, b, L, u, n) => { const k = Math.floor(L/0.45); for (let i = 1; i < k; i++) finT(B.p(WH), a, u, n, L*i/k, 0.16, 0.16, y + 0.25, y + h - 0.25, -0.08); }); };
  par(HALL, YC, 1.0); par(APSE, YC, 1.0);
  // hipped roof over the hall, behind the parapet
  roofT(B.p(ROOF), null, -0.3, -0.2, 26.4, 21.2, YC + 0.2, 4.3, 0, -0.3, 0.32);
  // the three-arched porte-cochere (half octagon) on Oxley Rise: paired Corinthian columns at the corners, arches on each face
  { const P = PORCH, y0 = 0.6, yt = 7.0;
    flatT(B.p(STEP), offP(P.concat([[13.6, 6.2]]).slice(0, 4), 0.6), 0.75);
    edges(P, (a, b, L, u, n, i) => { if (i === P.length - 1) return;   // open back side joins the hall
      const w = Math.min(3.0, L - 1.6), hs = 3.4;
      // arch spandrel wall: the face wall with an arched opening (built as the wall minus the arch: two piers + head)
      const half = (L - w)/2;
      panT(B.p(WH), a, u, n, 0, half, y0, yt, 0); panT(B.p(WH), a, u, n, L - half, L, y0, yt, 0);
      // head above the arch: a strip of triangles from the arch curve up to yt
      { const m = 10, W = (x, y) => [a[0] + u[0]*(L/2 + x), y0 + y, a[1] + u[1]*(L/2 + x)];
        for (let k = 0; k < m; k++){ const a0 = PI - PI*k/m, a1 = PI - PI*(k + 1)/m; const x0 = Math.cos(a0)*w/2, x1 = Math.cos(a1)*w/2;
          quad(B.p(WH), W(x0, hs + Math.sin(a0)*w/2), W(x1, hs + Math.sin(a1)*w/2), W(x1, yt - y0), W(x0, yt - y0)); } }
      archRing(B.p(MO), a, u, n, L/2, w, hs, 0.35, y0, 0.08, 10);
      for (const s of [-1, 1]) for (const d of [0.35, 0.95]){ const t = s < 0 ? d : L - d; colT(B.p(MO), B.p(MO2), a[0] + u[0]*t + n[0]*0.45, a[1] + u[1]*t + n[1]*0.45, y0, yt - 0.8, 0.22, 8); }
      panT(B.p(MO), a, u, n, -0.2, L + 0.2, yt - 0.8, yt, 0.6);
      // the upper storey of the porch: pilasters and an arched window, then cornice
      panT(B.p(WH), a, u, n, 0, L, yt, Y2, 0.1);
      shapeOnEdge(B.p(WIN), a, u, n, L/2, archPts(1.5, 2.2, 8), yt + 0.8, 0.15); archRing(B.p(MO), a, u, n, L/2, 1.5, 2.2, 0.25, yt + 0.8, 0.2);
      for (const t of [0.3, L - 0.3]) finT(B.p(MO), a, u, n, t, 0.6, 0.3, yt, Y2, 0.1);
    });
    flatT(B.p(ROOF), P, Y2 + 0.4); flatT(B.p(WH), P, yt, true);
    wallT(B.p(MO), offP(P, 0.5), Y2, YC, true);
    // a raised attic with a small pediment over the porch front (the M-monogram panels are left plain)
    const a = P[1], b = P[2]; const ax = (a[0] + b[0])/2 + 0.4, az = (a[1] + b[1])/2;
    boxT(B.p(WH), ax, YC, az, 1.2, 1.6, 6.4, 0);
    { const o = B.p(MO); const z0 = az - 3.4, z1 = az + 3.4, yb = YC + 1.6, yt2 = yb + 1.5; tri(o, [ax + 0.65, yb, z0], [ax + 0.65, yb, z1], [ax + 0.65, yt2, az]); tri(o, [ax - 0.65, yb, z1], [ax - 0.65, yb, z0], [ax - 0.65, yt2, az]);
      quad(o, [ax - 0.65, yb, z0], [ax + 0.65, yb, z0], [ax + 0.65, yt2, az], [ax - 0.65, yt2, az]); quad(o, [ax + 0.65, yb, z1], [ax - 0.65, yb, z1], [ax - 0.65, yt2, az], [ax + 0.65, yt2, az]); }
    // entrance doors behind the porch
    panT(B.p(DOOR), [13.6, -1.4], [0, 1], [1, 0], 0, 2.8, 0.75, 4.2, 0.05);
  }
  B.flush(g); return g; }};
SG_PLACES.push({type:'sgchesedel', lat:LAT, lon:LON, rot:0});
}

// ======================================================================================================
// Orchard Road Presbyterian Church (3 Orchard Road, 1878): neo-Classical; the tower and entrance portico face Orchard Road
// (north-west, towards the Penang Road junction); the porch arch on double Ionic columns with a smaller arch on the upper
// facade echoing it; a Palladian window as the dominant motif; the tower topped by a cupola; a high-pitched roof with double
// eaves; later extensions altered the side facades (URA conservation portal). Plan: OSM w172090787 with its parts: the 1878
// church on the west lobe (front slice + nave + side room), the newer halls on the rest at the mapped part heights.
// Tower / cupola heights and the colours (white, grey roofs) are estimates.
// ======================================================================================================
{
const A0 = [1.297797, 103.847446], O = [-8, 0];
const RING = sh([[3.6,-23.4],[6.5,-26.9],[14.3,-21.0],[11.3,-16.9],[15.5,-13.3],[7.1,-2.0],[13.1,3.3],[28.6,-16.9],[45.4,-3.8],[24.5,23.5],[4.2,17.5],[4.8,16.4],[3.6,15.2],[6.5,12.2],[-0.6,6.9],[-7.2,15.2],[-22.1,3.9],[-33.4,17.5],[-52.6,5.1],[-41.8,-9.1],[-37.0,-5.6],[-31.7,-12.1],[-17.9,-1.4],[-10.2,-10.9],[-13.2,-12.7],[-1.8,-27.5]], O);
const PARTS = [
  [sh([[7.1,-2.0],[13.1,3.3],[6.5,12.2],[-0.6,6.9]], O), 7.2],
  [sh([[22.7,-8.5],[39.4,3.9],[34.0,11.0],[17.3,-1.4]], O), 7.2],
  [sh([[3.6,15.2],[17.3,-1.4],[34.0,11.0],[24.5,23.5],[4.2,17.5],[4.8,16.4]], O), 10.5]];
// the small unnamed annex in the notch between the old church and the halls (OSM way without id, 5.7 m in the data)
const ANNEX = sh([[-20.9,-5.0],[-28.7,-10.9],[-23.3,-18.6],[-18.5,-15.7],[-20.9,-11.5],[-17.9,-9.1]], O);
const [LAT, LON] = LL(A0, O[0], O[1]);
// church frame: front (NW face) centre F, axis U (front -> back), across V
const F = [(-52.6 - 41.8)/2 - O[0], (5.1 - 9.1)/2 - O[1]];
const U = (() => { const d = [(-17.9 - 22.1)/2 - (-47.2), (-1.4 + 3.9)/2 - (-2.0)]; const L = Math.hypot(d[0], d[1]); return [d[0]/L, d[1]/L]; })();
const V = [-U[1], U[0]];
const CW = (s, t) => [F[0] + U[0]*s + V[0]*t, F[1] + U[1]*s + V[1]*t];        // s along the axis from the front, t across
const RY = Math.atan2(-U[1], U[0]);
LANDMARKS.sgorpc = {zh:'乌节路长老会堂', en:'Orchard Road Presbyterian Church', cat:'old', r:58, h:27,
  lt:{m:0, c:'#fff0da', k:0.7, e:0.7, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB();
  const WH = '#f2efe8', MO = '#d6d1c5', MO2 = '#bfb9ac', ROOF = '#7d7f80', ROOF2 = '#8f8d87', WIN = {c:'#4a5560', glow:'#ffe0ae', gk:0.35}, DOOR = '#5a4431', HALLW = '#ece8de';
  footT(B, MO2, RING, 0.3);
  // the newer halls: the whole outline as a single-storey base, the mapped higher parts over it, simple hipped roofs
  wallT(B.p(HALLW), RING, 0, 4.4); flatT(B.p(ROOF2), RING, 4.4); wallT(B.p(MO), RING, 4.4, 5.0);
  edges(RING, (a, b, L, u, n) => { if (L < 3) return; const k = Math.floor(L/3.2); for (let i = 0; i < k; i++){ const t = (L - k*3.2)/2 + 3.2*i + 1.6; panT(B.p(WIN), a, u, n, t - 0.7, t + 0.7, 1.0, 3.2, 0.05); } });
  footT(B, MO2, ANNEX, 0.3); wallT(B.p(HALLW), ANNEX, 0.3, 4.6); flatT(B.p(ROOF2), ANNEX, 4.6); wallT(B.p(MO), ANNEX, 4.6, 5.2);
  for (const [P, h] of PARTS){ wallT(B.p(HALLW), P, 4.4, h); wallT(B.p(MO), offP(P, 0.1), h - 0.5, h);
    edges(P, (a, b, L, u, n) => { if (L < 4) return; const k = Math.floor(L/3.2); for (let i = 0; i < k; i++){ const t = (L - k*3.2)/2 + 3.2*i + 1.6; panT(B.p(WIN), a, u, n, t - 0.7, t + 0.7, 5.6, h - 1.2, 0.05); } });
    const c = P.reduce((s, p) => [s[0] + p[0]/P.length, s[1] + p[1]/P.length], [0, 0]);
    const e = Math.atan2(-(P[1][1] - P[0][1]), P[1][0] - P[0][0]), L1 = Math.hypot(P[1][0] - P[0][0], P[1][1] - P[0][1]), W1 = Math.hypot(P[2][0] - P[1][0], P[2][1] - P[1][1]);
    roofT(B.p(ROOF2), null, c[0], c[1], L1 - 1, W1 - 1, h, 2.4, e, 0.4, 0.3); }
  // ---- the 1878 church: nave 26 m x 15 m behind the front, walls to 8.5 m, high-pitched roof with double eaves
  const NL = 26.5, NW = 15.2, WALLH = 8.6;
  const R = (s, y, t) => { const p = CW(s, t); return [p[0], y, p[1]]; };
  boxT(B.p(WH), ...(p => [p[0], 0, p[1]])(CW(NL/2 + 1, 0)), NL - 2, WALLH, NW, RY);
  // pilasters and tall round-arched windows on both side walls
  for (const sd of [-1, 1]){
    const a = CW(2, sd*NW/2), u = U, n = [V[0]*sd, V[1]*sd];
    for (let k = 0; k <= 6; k++) finT(B.p(MO), a, u, n, 2 + k*3.6, 0.7, 0.3, 0.3, WALLH, 0);
    for (let k = 0; k < 6; k++){ const t = 3.8 + k*3.6; shapeOnEdge(B.p(WIN), a, u, n, t, archPts(1.5, 3.4, 8), 1.6, 0.05); archRing(B.p(MO), a, u, n, t, 1.5, 3.4, 0.22, 1.6, 0.1); }
    panT(B.p(MO), a, u, n, -1, NL - 1, WALLH - 0.7, WALLH, 0.3);
  }
  // roof: lower eave skirt and the main steep roof above it (double eaves)
  { const c = CW(NL/2 + 1, 0); roofT(B.p(ROOF), null, c[0], c[1], NL - 2, NW, WALLH, 1.0, RY, 1.2, 0.03);
    roofT(B.p(ROOF), B.p(WH), c[0], c[1], NL - 2.6, NW - 2.4, WALLH + 0.6, 6.4, RY, 0.3, 0); }
  // side room on the south-west flank (OSM part), lean-to roof
  { const c = CW(15, -NW/2 - 2.2); boxT(B.p(WH), c[0], 0, c[1], 18, 4.6, 4.2, RY); const p0 = CW(6, -NW/2 - 4.6), p1 = CW(24, -NW/2 - 4.6), p2 = CW(24, -NW/2), p3 = CW(6, -NW/2);
    quad(B.p(ROOF), [p0[0], 4.6, p0[1]], [p1[0], 4.6, p1[1]], [p2[0], 6.0, p2[1]], [p3[0], 6.0, p3[1]]); }
  // ---- the front (north-west): a classical front block, the portico, the Palladian window, the tower with a cupola
  const FW = 15.6, FD = 6.6, FH = 10.2;
  { const c = CW(FD/2, 0); boxT(B.p(WH), c[0], 0, c[1], FD, FH, FW, RY); }
  const fa = CW(0, -FW/2), fu = V, fn = [-U[0], -U[1]];           // the front face: t across from the south-west corner
  panT(B.p(MO), fa, fu, fn, 0, FW, 0, 1.0, 0.1);
  panT(B.p(MO), fa, fu, fn, -0.2, FW + 0.2, FH - 1.0, FH, 0.25);
  for (const t of [0.4, FW - 0.4]) finT(B.p(MO), fa, fu, fn, t, 0.9, 0.35, 0.4, FH - 1, 0);
  // side windows of the front block, ground and upper
  for (const t of [2.2, FW - 2.2]){ shapeOnEdge(B.p(WIN), fa, fu, fn, t, archPts(1.3, 2.4, 8), 1.2, 0.05); shapeOnEdge(B.p(WIN), fa, fu, fn, t, archPts(1.1, 1.6, 8), 5.6, 0.05); }
  // the Palladian window (central arch, two flat-topped side lights) on the upper front, with its pilasters
  { const t = FW/2, y = 5.0;
    shapeOnEdge(B.p(WIN), fa, fu, fn, t, archPts(1.6, 2.2, 10), y, 0.05); archRing(B.p(MO), fa, fu, fn, t, 1.6, 2.2, 0.3, y, 0.12, 10);
    for (const s of [-1.6, 1.6]) shapeOnEdge(B.p(WIN), fa, fu, fn, t + s, [[-0.5, 0], [0.5, 0], [0.5, 2.2], [-0.5, 2.2]], y, 0.05);
    for (const s of [-2.25, -0.95, 0.95, 2.25]) finT(B.p(MO), fa, fu, fn, t + s, 0.28, 0.3, y - 0.2, y + 2.4, 0);
    panT(B.p(MO), fa, fu, fn, t - 2.5, t + 2.5, y - 0.45, y - 0.1, 0.3);
  }
  // the portico: an arch on double Ionic columns, projecting 3.4 m, with a small arch in the upper attic echoing it
  { const pd = 3.4, t = FW/2, pw = 6.4, ph = 6.0;
    const pa = CW(-pd, -pw/2);
    for (const s of [-1, 1]) for (const d of [0.4, 1.05]){ const p = CW(-pd + 0.5, s*(pw/2 - d)); colT(B.p(MO), B.p(MO2), p[0], p[1], 0.3, ph - 1.2, 0.24, 8); }
    { const p = CW(-pd/2, 0); boxT(B.p(WH), p[0], ph - 1.2, p[1], pd, 1.2, pw, RY); boxT(B.p(MO), p[0], ph, p[1], pd + 0.4, 0.35, pw + 0.4, RY); }
    archRing(B.p(MO), pa, fu, fn, pw/2, 3.0, 2.9, 0.35, 0.3, -0.05, 10);
    { const o = B.p(WH), m = 10; for (let k = 0; k < m; k++){ const a0 = PI - PI*k/m, a1 = PI - PI*(k + 1)/m, x0 = Math.cos(a0)*1.5, x1 = Math.cos(a1)*1.5;
        const W2 = (x, y) => { const p = CW(-pd - 0.02, x); return [p[0], y, p[1]]; };
        quad(o, W2(x0, 3.2 + Math.sin(a0)*1.5), W2(x1, 3.2 + Math.sin(a1)*1.5), W2(x1, ph - 1.2), W2(x0, ph - 1.2)); } }
    for (const s of [-1, 1]){ const p = CW(-pd/2, s*(pw/2 - 0.75)); boxT(B.p(WH), p[0], 0.3, p[1], pd, ph - 1.5, 1.5 - 0.2, RY); }
    // attic over the porch with the smaller arch
    { const p = CW(-pd/2 + 0.2, 0); boxT(B.p(WH), p[0], ph + 0.35, p[1], pd - 0.4, 2.4, 3.6, RY); const aa = CW(-pd + 0.2, -1.8); shapeOnEdge(B.p(WIN), aa, fu, fn, 1.8, archPts(1.2, 1.0, 8), ph + 0.6, 0.05); }
    // entrance door
    shapeOnEdge(B.p(DOOR), fa, fu, fn, t, archPts(2.0, 2.4, 8), 0.3, 0.05);
  }
  // the tower over the front centre (square, two stages), the cupola on top
  { const c = CW(FD/2, 0), tw = 5.0;
    boxT(B.p(WH), c[0], FH, c[1], tw, 5.2, tw, RY); boxT(B.p(MO), c[0], FH + 5.0, c[1], tw + 0.5, 0.5, tw + 0.5, RY);
    boxT(B.p(WH), c[0], FH + 5.5, c[1], tw - 0.8, 4.2, tw - 0.8, RY); boxT(B.p(MO), c[0], FH + 9.6, c[1], tw - 0.2, 0.45, tw - 0.2, RY);
    // belfry openings: dark arches on the four faces of the upper stage
    const hh = (tw - 0.8)/2 + 0.03;
    for (const [nr, d] of [[[-U[0], -U[1]], V], [[U[0], U[1]], [-V[0], -V[1]]], [V, U], [[-V[0], -V[1]], [-U[0], -U[1]]]]){
      const a2 = [c[0] + nr[0]*hh - d[0]*hh, c[1] + nr[1]*hh - d[1]*hh]; shapeOnEdge(B.p(WIN), a2, d, nr, hh, archPts(1.3, 1.8, 8), FH + 6.2, 0); }
    latheT(B.p(MO2), [[2.0, FH + 10.05], [2.0, FH + 10.6], [1.85, FH + 11.6], [1.4, FH + 12.4], [0.7, FH + 13.0], [0.2, FH + 13.4], [0.01, FH + 13.5]], 12, c[0], c[1]);
    latheT(B.p(MO), [[0.18, FH + 13.4], [0.18, FH + 14.4], [0.45, FH + 14.7], [0.01, FH + 15.1]], 6, c[0], c[1]);
    segP(B.p(MO2), [c[0], FH + 15, c[1]], [c[0], FH + 16.6, c[1]], 0.06, 3);
  }
  B.flush(g); return g; }};
SG_PLACES.push({type:'sgorpc', lat:LAT, lon:LON, rot:0});
}

// ======================================================================================================
// St George's Church (44 Minden Road, Tanglin, 1910-1913, national monument): "unadorned Romanesque" garrison church by
// Capt. William H. Stanbury; fair-faced red brick inside and out, materials imported from England; large arches along either
// side of the nave, clerestory openings, a large single-gabled roof on exposed hardwood trusses, stained glass behind the altar
// (roots.gov.sg, Wikipedia). Plan: OSM w170086728 (fitted as a 37.5 m x 21 m nave-and-aisles rectangle, the small east
// annex at its mapped notch). Arch / wall heights and the tile colour are estimates.
// ======================================================================================================
{
const A0 = [1.304737, 103.815101], O = [-1.0, -1.0];
const [LAT, LON] = LL(A0, O[0], O[1]);
const AX = 97*PI/180, U = [Math.cos(AX), Math.sin(AX)], V = [-U[1], U[0]], RY = Math.atan2(-U[1], U[0]);
const CW = (s, t) => [U[0]*s + V[0]*t, U[1]*s + V[1]*t];
LANDMARKS.sgstgeorge = {zh:'圣乔治教堂', en:"St George's Church (Tanglin)", cat:'old', r:26, h:16,
  lt:{m:0, c:'#ffe7c8', k:0.6, e:0.7, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB();
  const BR = '#a5543c', BR2 = '#8e4632', TILE = '#8a4633', DARK = {c:'#3b3633', glow:'#ffdca8', gk:0.3}, SG = {c:'#4f5a7a', glow:'#ffcf96', gk:0.5}, STONE = '#cdbfa8';
  const LN = 37.5, AW = 21, NWD = 10.4, YE = 6.0, YN = 10.6, YR = 15.6;
  const fp = [CW(-LN/2, -AW/2), CW(LN/2, -AW/2), CW(LN/2, AW/2), CW(-LN/2, AW/2)];
  footT(B, BR2, fp, 0.4); flatT(B.p(STONE), fp, 0.4);
  // aisles: arcaded outer walls of large round arches on brick piers (open verandahs), lean-to roofs
  for (const sd of [-1, 1]){
    const a = CW(-LN/2, sd*AW/2), u = U, n = [V[0]*sd, V[1]*sd];
    const nb = 8, bw = LN/nb;
    for (let k = 0; k <= nb; k++) finT(B.p(BR), a, u, n, k*bw, 1.1, 0.9, 0.4, YE, -0.9);
    for (let k = 0; k < nb; k++){ const t = (k + 0.5)*bw, w = bw - 1.1;
      // arch head: brick spandrel above the opening
      const m = 8, W = (x, y) => [a[0] + u[0]*(t + x), y, a[1] + u[1]*(t + x)];
      for (let j = 0; j < m; j++){ const a0 = PI - PI*j/m, a1 = PI - PI*(j + 1)/m; const x0 = Math.cos(a0)*w/2, x1 = Math.cos(a1)*w/2;
        quad(B.p(BR), W(x0, 2.6 + Math.sin(a0)*w/2), W(x1, 2.6 + Math.sin(a1)*w/2), W(x1, YE), W(x0, YE)); }
      archRing(B.p(BR2), a, u, n, t, w, 2.6, 0.3, 0, 0.02, 8);
      // inner aisle wall (the nave arcade seen through the arches) with dark openings
      const ai = CW(-LN/2, sd*(NWD/2 + 0.4));
      shapeOnEdge(B.p(DARK), ai, u, n, t, archPts(w*0.8, 2.6, 8), 0.4, 0.05);
    }
    wallT(B.p(BR), [CW(-LN/2, sd*NWD/2), CW(LN/2, sd*NWD/2), CW(LN/2, sd*(NWD/2 + 0.5)), CW(-LN/2, sd*(NWD/2 + 0.5))], 0.4, YN);
    // aisle lean-to roof
    const r0 = CW(-LN/2 - 0.6, sd*(AW/2 + 0.8)), r1 = CW(LN/2 + 0.6, sd*(AW/2 + 0.8)), r2 = CW(LN/2 + 0.6, sd*NWD/2), r3 = CW(-LN/2 - 0.6, sd*NWD/2);
    quad(B.p(TILE), [r0[0], YE - 0.3, r0[1]], [r1[0], YE - 0.3, r1[1]], [r2[0], YN - 1.6, r2[1]], [r3[0], YN - 1.6, r3[1]]);
    panT(B.p(BR2), a, u, n, 0, LN, YE - 0.6, YE, 0.1);
    // clerestory openings in the nave walls
    const ac = CW(-LN/2, sd*(NWD/2 + 0.5));
    for (let k = 0; k < nb; k++) shapeOnEdge(B.p(DARK), ac, u, n, (k + 0.5)*bw, archPts(1.4, 0.4, 8), YN - 1.5, 0.03);
  }
  // nave gable roof
  { roofT(B.p(TILE), B.p(BR), 0, 0, LN, NWD + 0.5, YN, YR - YN, RY, 0.7, 0); }
  // the two gable ends: brick walls across nave and aisles, a large round-arched window (stained glass behind the altar)
  for (const se of [-1, 1]){
    const a = CW(se*LN/2, -se*AW/2), u = [V[0]*se, V[1]*se], n = [U[0]*se, U[1]*se];
    panT(B.p(BR), a, u, n, 0, AW, 0.4, YE, 0.02);
    // the aisle ends: arch openings
    for (const t of [2.6, AW - 2.6]) shapeOnEdge(B.p(DARK), a, u, n, t, archPts(2.8, 2.2, 8), 0.4, 0.06);
    shapeOnEdge(B.p(SG), a, u, n, AW/2, archPts(3.6, 7.0, 10), 2.0, 0.08); archRing(B.p(BR2), a, u, n, AW/2, 3.6, 7.0, 0.4, 2.0, 0.12, 10);
    for (const t of [AW/2 - 2.8, AW/2 + 2.8]) finT(B.p(BR2), a, u, n, t, 0.8, 0.5, 0.4, YN + 1.2, 0);
  }
  // the small annex at the north-east notch of the plan (vestry / porch)
  { const c = [12.4 - O[0], -9.6 - O[1]]; boxT(B.p(BR), c[0], 0, c[1], 5.6, 4.4, 6.6, RY); roofT(B.p(TILE), B.p(BR), c[0], c[1], 6.6, 5.6, 4.4, 2.0, RY + HP, 0.4, 0); }
  B.flush(g); return g; }};
SG_PLACES.push({type:'sgstgeorge', lat:LAT, lon:LON, rot:0});
}

// ======================================================================================================
// Newton Food Centre (Newton Circus, 1971; rebuilt and reopened 1 July 2006, CPG Consultants): stalls arranged in a horseshoe,
// a semi-outdoor compound with outdoor seating; the new pitched roofs with clay tiles echo the colonial terraces of Monk's Hill
// Terrace (roots.gov.sg, Wikipedia: 83 hawkers). Plan: OSM w41662296 (the bent horseshoe of stall blocks), roofs over each arm.
// Eave / ridge heights estimated.
// ======================================================================================================
{
const A0 = [1.312050, 103.839503], O = [2, -6];
const FP = sh([[-1.4,-43.2],[20.7,-17.1],[36.2,-9.9],[32.6,0.1],[14.1,-7.0],[-1.4,-26.0],[-18.7,-11.7],[-16.3,10.8],[36.2,6.7],[37.4,23.9],[-27.1,28.6],[-31.8,-15.9]], O);
const ARMS = [[[-31.8,-15.9],[-1.4,-43.2],[-1.4,-26.0],[-18.7,-11.7]], [[-1.4,-43.2],[20.7,-17.1],[14.1,-7.0],[-1.4,-26.0]], [[20.7,-17.1],[36.2,-9.9],[32.6,0.1],[14.1,-7.0]],
  [[-27.1,28.6],[-31.8,-15.9],[-18.7,-11.7],[-16.3,10.8]], [[37.4,23.9],[-27.1,28.6],[-16.3,10.8],[36.2,6.7]]].map(q => sh(q, O));
const [LAT, LON] = LL(A0, O[0], O[1]), RR = 50;
// the app terrain here falls ~12 m from south to north across the site (70 m nodes, decimetres): every part stands on it
const TER = {i0:390, j0:394, nx:4, ny:4, H:[185,164,140,117,150,135,118,101,12,12,12,12,12,12,12,12]};
LANDMARKS.sgnewtonfc = {zh:'纽顿熟食中心', en:'Newton Food Centre', cat:'new', r:RR, h:9,
  lt:{m:0, c:'#ffe2b4', k:0.55, e:0.9}, build(){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
  const X = (LON - 103.845)*111290.5, Y = (LAT - 1.315)*110574, G = terrK(TER), TOP = G.top(RR, X, Y);
  const gl = (x, z) => G.h(X + x, Y - z) - TOP, gp = p => gl(p[0], p[1]);
  const WALL = '#ece3cf', COL = '#d9d2c2', TILE = '#b35f3e', TILE2 = '#9c5034', FLOOR = '#b9b2a4', STALL = {c:'#d7c9a8', glow:'#ffe6b8', gk:0.9}, DARK = '#56504a', TAB = '#c9c4ba', GLOW = {c:'#fff2d0', glow:'#ffe8b8', gk:1.2};
  const flatF = (o, P, dy) => { const t2 = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []); for (const t of t2){ const a = P[t[0]], b = P[t[1]], c = P[t[2]]; o.push(a[0], gp(a) + dy, a[1], b[0], gp(b) + dy, b[1], c[0], gp(c) + dy, c[1]); } };
  wallT(B.p(COL), FP, p => gp(p) - 5, p => gp(p) + 0.3); flatF(B.p(FLOOR), FP, 0.3);
  const YE = 4.4, RISE = 3.4;
  for (const Q of ARMS){
    const [o0, o1, i1, i0] = Q;
    const s0 = [o0[0]*0.62 + i0[0]*0.38, o0[1]*0.62 + i0[1]*0.38], s1 = [o1[0]*0.62 + i1[0]*0.38, o1[1]*0.62 + i1[1]*0.38];
    const SB = [o0, o1, s1, s0];
    wallT(B.p(WALL), SB, p => gp(p) + 0.3, p => gp(p) + 3.0); flatF(B.p(COL), SB, 3.0);
    { const L = Math.hypot(s1[0] - s0[0], s1[1] - s0[1]), u = [(s1[0] - s0[0])/L, (s1[1] - s0[1])/L]; const nn = [u[1], -u[0]];
      const c = [(o0[0] + o1[0] + i0[0] + i1[0])/4, (o0[1] + o1[1] + i0[1] + i1[1])/4]; const toC = (c[0] - s0[0])*nn[0] + (c[1] - s0[1])*nn[1]; const n = toC > 0 ? nn : [-nn[0], -nn[1]];
      const k = Math.floor(L/3.1); for (let i = 0; i < k; i++){ const t = (L - k*3.1)/2 + i*3.1 + 1.55, gy = gl(s0[0] + u[0]*t, s0[1] + u[1]*t);
        panT(B.p(STALL), s0, u, n, t - 1.35, t + 1.35, gy + 1.1, gy + 2.6, 0.05); panT(B.p(DARK), s0, u, n, t - 1.35, t + 1.35, gy + 0.3, gy + 1.1, 0.06); }
      const Li = Math.hypot(i1[0] - i0[0], i1[1] - i0[1]), ui = [(i1[0] - i0[0])/Li, (i1[1] - i0[1])/Li]; const ki = Math.max(1, Math.round(Li/6));
      for (let i = 0; i <= ki; i++){ const p = [i0[0] + ui[0]*Li*i/ki, i0[1] + ui[1]*Li*i/ki]; boxT(B.p(COL), p[0], gp(p) + 0.3, p[1], 0.45, YE - 0.3, 0.45, 0); }
      for (let i = 0; i < k; i += 2){ const t = (i + 0.5)/k; const p = [s0[0] + (s1[0] - s0[0])*t, s0[1] + (s1[1] - s0[1])*t], q = [i0[0] + (i1[0] - i0[0])*t, i0[1] + (i1[1] - i0[1])*t];
        const m = [(p[0] + q[0])/2, (p[1] + q[1])/2]; boxT(B.p(TAB), m[0], gp(m) + 0.3, m[1], 1.6, 0.75, 0.9, Math.atan2(-u[1], u[0])); }
      for (let i = 0; i < k; i += 2){ const t = (i + 0.5)/k; const m = [(o0[0] + i0[0])/2 + ((o1[0] + i1[0]) - (o0[0] + i0[0]))/2*t, (o0[1] + i0[1])/2 + ((o1[1] + i1[1]) - (o0[1] + i0[1]))/2*t]; boxT(B.p(GLOW), m[0], gp(m) + YE - 0.4, m[1], 0.5, 0.15, 0.5, 0); }
    }
    const ov = 0.9, mid = (p, q) => [(p[0] + q[0])/2, (p[1] + q[1])/2], ext = (p, q, d) => { const L = Math.hypot(p[0] - q[0], p[1] - q[1]) || 1; return [p[0] + (p[0] - q[0])/L*d, p[1] + (p[1] - q[1])/L*d]; };
    const m0 = mid(o0, i0), m1 = mid(o1, i1);
    const O0 = ext(o0, i0, ov), I0 = ext(i0, o0, ov), O1 = ext(o1, i1, ov), I1 = ext(i1, o1, ov);
    // roof heights follow the ground along the arm (eaves at ground + 4.4 m)
    const y = YE, yt = YE + RISE, P3 = (p, hh, q) => [p[0], hh + gp(q || p), p[1]];
    quad(B.p(TILE), P3(O0, y, o0), P3(O1, y, o1), P3(m1, yt), P3(m0, yt)); quad(B.p(TILE), P3(I1, y, i1), P3(I0, y, i0), P3(m0, yt), P3(m1, yt));
    tri(B.p(WALL), P3(o0, y), P3(m0, yt - 0.1), P3(i0, y)); tri(B.p(WALL), P3(i1, y), P3(m1, yt - 0.1), P3(o1, y));
    segP(B.p(TILE2), P3(m0, yt + 0.1), P3(m1, yt + 0.1), 0.2, 4);
    segP(B.p(WALL), P3(O0, y, o0), P3(O1, y, o1), 0.15, 4); segP(B.p(WALL), P3(I0, y, i0), P3(I1, y, i1), 0.15, 4);
  }
  B.flush(g); return g; }};
SG_PLACES.push({type:'sgnewtonfc', lat:LAT, lon:LON, rot:0});
}

// ======================================================================================================
// Emerald Hill (conservation area off Orchard Road): terrace houses built 1901-1925 and later, Transitional, Late and Art-Deco
// styles, many with ornate pintu pagar (half swing doors), ceramic tilework on the ground-floor fronts, elaborate plasterwork
// ("Chinese Baroque"); Peranakan Place: six two-storey shophouses (c. 1902) at the Orchard Road corner, restored 1985 (URA
// conservation portal, Wikipedia). Every house is built on its own OSM footprint (two-storey houses, h 7 m in the data) with its
// front on the edge nearest Emerald Hill Road; the rows are split into keys so that no hull covers the condominiums and lanes
// between them: sgemeraldhill (the long east row of the lower road, labelled), _b (east row, upper road), _c (west row, upper
// road), _d / _e (two west groups of the lower road), _pp (Peranakan Place and the three houses by it) - secondary keys
// label:false. Facade colours are a pastel palette (the real colours of each house are not verified); forecourt walls left out.
// ======================================================================================================
{
const EHD = {"sgemeraldhill":{"O":[2.8,63.1],"R":[[[-20.6,6.7],[-19.4,2.0],[5.1,9.7],[4.5,13.8]],[[-19.4,2.0],[-18.2,-3.4],[6.3,4.4],[5.1,9.7]],[[8.6,-75.7],[11.0,-79.9],[36.1,-72.1],[34.3,-66.8]],[[-20.6,42.9],[-20.6,37.0],[-0.3,43.5],[-1.5,48.2]],[[-8.7,-38.9],[-6.9,-44.3],[18.8,-34.8],[17.0,-29.4]],[[-19.4,88.0],[-20.0,82.6],[-3.3,87.4],[-3.9,92.7]],[[-2.1,-55.5],[0.3,-60.9],[27.2,-51.4],[24.8,-46.1]],[[-17.6,-8.7],[-16.4,-12.8],[9.2,-5.1],[8.1,-0.4]],[[-20.6,16.2],[-20.6,11.5],[3.9,18.6],[3.9,23.9]],[[-20.6,53.0],[-20.6,47.6],[-1.5,52.4],[-2.1,57.7]],[[-20.0,77.9],[-20.0,72.5],[-3.3,76.1],[-3.3,82.0]],[[-20.0,82.6],[-20.0,77.9],[-3.3,82.0],[-3.3,87.4]],[[-20.6,37.0],[-21.2,32.2],[0.9,38.7],[-0.3,43.5]],[[-21.2,32.2],[-21.2,26.3],[2.1,34.0],[0.9,38.7]],[[-20.6,61.9],[-20.6,57.7],[-2.1,61.9],[-2.7,66.6]],[[13.4,-84.6],[15.8,-89.3],[41.5,-81.0],[39.7,-76.3]],[[-18.2,-3.4],[-17.6,-8.7],[8.1,-0.4],[6.3,4.4]],[[-21.2,26.3],[-21.2,21.5],[3.3,28.7],[2.1,34.0]],[[3.3,-66.2],[5.7,-71.6],[31.9,-62.1],[30.1,-56.7]],[[-20.0,66.6],[-20.6,61.9],[-2.7,66.6],[-2.7,71.4]],[[-20.6,57.7],[-20.6,53.0],[-2.1,57.7],[-2.1,61.9]],[[-20.0,72.5],[-20.0,66.6],[-2.7,71.4],[-3.3,76.1]],[[-20.6,47.6],[-20.6,42.9],[-1.5,48.2],[-1.5,52.4]],[[5.7,-71.6],[8.6,-75.7],[34.3,-66.8],[31.9,-62.1]],[[-16.4,-12.8],[-15.2,-18.2],[11.0,-10.5],[9.2,-5.1]],[[-20.6,11.5],[-20.6,6.7],[4.5,13.8],[3.9,18.6]],[[-3.9,-49.6],[-2.1,-55.5],[24.8,-46.1],[21.8,-40.7]],[[-11.1,-33.0],[-8.7,-38.9],[17.0,-29.4],[15.8,-24.7]],[[-6.9,-44.3],[-3.9,-49.6],[21.8,-40.7],[18.8,-34.8]],[[-15.2,-18.2],[-14.6,-23.5],[12.8,-15.2],[11.0,-10.5]],[[0.3,-60.9],[3.3,-66.2],[30.1,-56.7],[27.2,-51.4]],[[-14.6,-23.5],[-12.8,-28.3],[14.0,-20.6],[12.8,-15.2]],[[-12.8,-28.3],[-11.1,-33.0],[15.8,-24.7],[14.0,-20.6]],[[11.0,-79.9],[13.4,-84.6],[37.9,-76.3],[36.1,-72.1]],[[15.8,-89.3],[18.2,-93.5],[43.3,-85.8],[41.5,-81.0]],[[-21.2,21.5],[-20.6,16.2],[3.9,23.9],[3.3,28.7]]],"pp":[false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false]},"sgemeraldhill_b":{"O":[45.6,-109.5],"R":[[[-13.3,-47.2],[-13.9,-52.0],[11.2,-53.7],[11.2,-49.0]],[[-12.7,19.2],[-12.1,13.3],[17.2,21.0],[17.2,27.5]],[[-10.3,-4.5],[-9.7,-10.4],[16.0,-3.3],[14.2,2.0]],[[-15.6,-66.8],[-16.2,-71.5],[8.8,-73.3],[9.4,-68.6]],[[-13.9,31.1],[-13.3,25.1],[14.8,33.4],[12.4,38.8]],[[-9.1,-16.4],[-10.3,-22.9],[14.8,-24.7],[16.0,-15.2],[17.8,-15.2],[18.4,-8.7]],[[-16.2,-71.5],[-16.8,-76.9],[8.2,-78.6],[8.8,-73.3]],[[-14.5,37.0],[-13.9,31.1],[17.2,40.0],[17.2,46.5]],[[-11.5,7.4],[-10.9,1.4],[18.4,9.1],[18.4,15.1]],[[-14.5,-56.7],[-15.0,-62.0],[10.0,-63.8],[10.6,-58.5]],[[-10.9,1.4],[-10.3,-4.5],[16.0,2.6],[14.2,7.9]],[[-12.1,13.3],[-11.5,7.4],[16.6,15.1],[17.2,21.0]],[[-15.0,-62.0],[-15.6,-66.8],[9.4,-68.6],[10.0,-63.8]],[[-10.9,-28.2],[-12.1,-34.8],[13.0,-36.5],[14.2,-30.6]],[[-12.7,-40.7],[-13.3,-47.2],[11.2,-49.0],[12.4,-42.5]],[[-13.3,25.1],[-12.7,19.2],[19.6,28.1],[18.4,34.0]],[[-10.3,-22.9],[-10.9,-28.2],[14.2,-30.6],[14.8,-24.7]],[[-12.1,-34.8],[-12.7,-40.7],[12.4,-42.5],[13.0,-36.5]],[[-13.9,-52.0],[-14.5,-56.7],[10.6,-58.5],[11.2,-53.7]],[[-9.7,-10.4],[-9.1,-16.4],[16.0,-9.3],[14.2,-3.9]],[[-16.8,57.8],[-15.6,52.4],[12.4,59.5],[10.0,65.5]],[[-12.1,48.3],[-10.9,43.5],[14.2,50.6],[11.8,56.0]],[[-21.0,73.8],[-19.8,68.4],[6.4,76.1],[4.7,81.5]],[[-10.9,43.5],[-9.7,38.8],[10.6,44.7],[10.0,49.5]],[[-19.8,68.4],[-18.0,63.1],[8.2,70.8],[6.4,76.1]],[[-18.0,63.1],[-16.8,57.8],[10.0,65.5],[8.2,70.8]],[[-13.3,53.0],[-12.1,48.3],[13.6,56.0],[12.4,59.5]]],"pp":[false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false]},"sgemeraldhill_c":{"O":[-8.2,-102.9],"R":[[[18.5,-55.0],[18.5,-49.1],[-14.4,-50.8],[-13.8,-56.2]],[[15.5,28.0],[14.9,33.4],[-18.0,31.0],[-17.4,25.7]],[[17.9,-33.1],[17.3,-27.1],[-15.0,-28.9],[-15.0,-34.2]],[[17.9,-10.5],[17.9,-5.2],[-15.0,-7.6],[-14.4,-12.9]],[[20.2,-76.9],[19.6,-71.6],[-13.2,-72.8],[-12.6,-78.7]],[[17.9,-5.2],[17.3,0.2],[-15.6,-2.2],[-15.0,-7.6]],[[11.9,71.9],[11.9,77.8],[-20.9,75.5],[-20.4,69.5]],[[17.3,-27.1],[17.3,-21.8],[-15.6,-23.6],[-15.0,-28.9]],[[12.5,66.6],[11.9,71.9],[-20.4,69.5],[-20.4,64.2]],[[13.1,55.3],[13.1,61.2],[-19.8,58.9],[-19.2,52.9]],[[13.1,61.2],[12.5,66.6],[-20.4,64.2],[-19.8,58.9]],[[14.9,33.4],[14.3,38.7],[-18.0,36.9],[-18.0,31.0]],[[19.6,-71.6],[19.1,-65.7],[-13.2,-67.4],[-13.2,-72.8]],[[16.1,16.8],[15.5,22.7],[-16.8,20.3],[-16.8,14.4]],[[16.7,11.4],[16.1,16.8],[-16.8,14.4],[-16.2,9.1]],[[18.5,-49.1],[18.5,-43.7],[-14.4,-45.5],[-14.4,-50.8]],[[17.9,-38.4],[17.9,-33.1],[-15.0,-34.2],[-15.0,-39.6]],[[17.3,0.2],[16.7,6.1],[-15.6,3.7],[-15.6,-2.2]],[[16.7,6.1],[16.7,11.4],[-16.2,9.1],[-15.6,3.7]],[[15.5,22.7],[15.5,28.0],[-17.4,25.7],[-16.8,20.3]],[[19.1,-60.3],[18.5,-55.0],[-13.8,-56.2],[-13.8,-62.1]],[[14.3,44.6],[13.7,50.0],[-19.2,47.6],[-18.6,42.3]],[[18.5,-43.7],[17.9,-38.4],[-15.0,-39.6],[-14.4,-45.5]],[[19.1,-65.7],[19.1,-60.3],[-13.8,-62.1],[-13.2,-67.4]],[[13.7,50.0],[13.1,55.3],[-19.2,52.9],[-19.2,47.6]],[[14.3,38.7],[14.3,44.6],[-18.6,42.3],[-18.0,36.9]],[[18.5,-16.4],[17.9,-10.5],[-14.4,-12.9],[-14.4,-18.8]]],"pp":[false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false]},"sgemeraldhill_d":{"O":[-42.2,98.3],"R":[[[11.9,1.2],[12.5,5.9],[-11.4,-2.4],[-10.2,-7.1]],[[11.3,-3.0],[11.9,1.2],[-10.2,-7.1],[-9.6,-11.3]],[[12.5,5.9],[12.5,10.7],[-12.6,2.4],[-11.4,-2.4]],[[12.5,10.7],[13.1,16.0],[-10.8,9.5],[-13.2,5.9],[-12.6,2.4]],[[11.3,-8.9],[11.3,-3.0],[-9.6,-11.3],[-8.4,-16.0]]],"pp":[false,false,false,false,false]},"sgemeraldhill_e":{"O":[-42.8,126.5],"R":[[[14.2,-6.9],[14.8,-0.9],[-12.6,-9.8],[-10.8,-15.2]],[[13.7,10.3],[14.8,16.3],[-18.0,5.0],[-16.2,-0.3]],[[13.1,5.0],[13.7,10.3],[-16.2,-0.3],[-14.4,-4.5]],[[14.8,-0.9],[15.4,5.6],[-14.4,-4.5],[-12.6,-9.8]]],"pp":[false,false,false,false]},"sgemeraldhill_pp":{"O":[-12.0,168.4],"R":[[[-7.0,-6.1],[-5.2,-12.0],[21.1,-4.3],[19.3,1.1]],[[-5.2,-12.0],[-3.4,-16.7],[14.5,-11.4],[13.3,-6.7]],[[-17.1,13.5],[-10.6,-7.3],[-7.0,-6.1],[-13.0,14.7]],[[12.7,24.8],[-11.2,18.2],[-13.0,14.7],[-7.0,-6.1],[19.3,1.1]]],"pp":[false,false,false,true]}};
const A0 = [1.30300, 103.83935];
const PAST = ['#efe2b8', '#cfe3d3', '#f2d3c4', '#d6e2ee', '#f3ecd9', '#e8cfdc'];
const SHUT = ['#5f8f7a', '#6683a3'];
// one terrace house on ring R (edge 0 = the front), or a Peranakan Place shophouse block (pp)
function terrace(B, R, rng, pp){
  const a = R[0], b = R[1], W = Math.hypot(b[0]-a[0], b[1]-a[1]), u = [(b[0]-a[0])/W, (b[1]-a[1])/W];
  const sg = areaS(R) > 0 ? 1 : -1, n = [u[1]*sg, -u[0]*sg];
  let D = 0; for (const p of R) D = Math.max(D, -((p[0]-a[0])*n[0] + (p[1]-a[1])*n[1]));
  const TRIM = '#f6f3ea', SIDE = '#e3ddd0', TILE = '#b5583a', DOOR = '#5b3f2c', PAGAR = '#7a5a3c', WIN = {c:'#3e4650', glow:'#ffd9a0', gk:0.8}, DADO = '#4f8f86';
  const FAC = PAST[Math.floor(rng()*PAST.length)], SH = SHUT[Math.floor(rng()*SHUT.length)];
  const YE = pp ? 7.6 : 7.2, ry = Math.atan2(-u[1], u[0]);
  wallT(B.p(SIDE), R, -6, YE);
  // roofs: front block with the ridge parallel to the street (gable ends act as party walls), lower rear block
  const Df = Math.min(D, pp ? 10 : 10.5);
  { const c = [a[0] + u[0]*W/2 - n[0]*Df/2, a[1] + u[1]*W/2 - n[1]*Df/2]; roofT(B.p(TILE), B.p(SIDE), c[0], c[1], W, Df, YE, pp ? 2.6 : 2.3, ry, 0, 0); }
  if (D > Df + 1.5){ const Dr = D - Df, c = [a[0] + u[0]*W/2 - n[0]*(Df + Dr/2), a[1] + u[1]*W/2 - n[1]*(Df + Dr/2)];
    if (pp) flatT(B.p(SIDE), R, YE - 0.6); else roofT(B.p(TILE), B.p(SIDE), c[0], c[1], W, Dr, YE - 1.0, 1.4, ry, 0, 0); }
  else flatT(B.p(SIDE), R, YE - 0.05);
  // front eave
  { const p0 = [a[0] - n[0]*0.02, a[1] - n[1]*0.02], p1 = [b[0], b[1]]; quad(B.p(TILE), [a[0], YE, a[1]], [a[0] + n[0]*0.7, YE - 0.3, a[1] + n[1]*0.7], [b[0] + n[0]*0.7, YE - 0.3, b[1] + n[1]*0.7], [b[0], YE, b[1]]); }
  // facade
  const nb = Math.max(1, Math.round(W/(pp ? 4.15 : 5.4))), bw = W/nb, f = 0.04;
  const y1 = YE - 0.35;
  if (pp){
    // five-foot way: upper floor on columns, the ground-floor shopfronts set back 1.8 m
    panT(B.p(FAC), a, u, n, 0, W, 3.8, y1, f);
    panT(B.p(FAC), a, u, n, 0, W, 0.3, 3.8, -1.8);
    { const P = [[a[0], a[1]], [b[0], b[1]], [b[0] - n[0]*1.8, b[1] - n[1]*1.8], [a[0] - n[0]*1.8, a[1] - n[1]*1.8]]; flatT(B.p(TRIM), P, 3.8, true); flatT(B.p('#b9ad98'), P, 0.32); }
    for (let k = 0; k <= nb; k++) finT(B.p(TRIM), a, u, n, Math.min(W - 0.2, Math.max(0.2, bw*k)), 0.45, 0.45, 0.3, 3.8, -0.4);
  } else panT(B.p(FAC), a, u, n, 0, W, 0.3, y1, f);
  for (let k = 0; k < nb; k++){
    const tc = bw*(k + 0.5), s = Math.min(1, bw/5.4);
    if (pp){
      panT(B.p(DOOR), a, u, n, tc - 0.8, tc + 0.8, 0.3, 2.8, -1.75); for (const d of [-1, 1]) panT(B.p(WIN), a, u, n, tc + d*1.35 - 0.45, tc + d*1.35 + 0.45, 1.0, 2.8, -1.75);
    } else {
      // door with the pintu pagar in front, two windows with tiled dado panels
      panT(B.p(DOOR), a, u, n, tc - 0.65*s, tc + 0.65*s, 0.3, 2.9, f + 0.02);
      panT(B.p(PAGAR), a, u, n, tc - 0.6*s, tc + 0.6*s, 0.7, 2.1, f + 0.16);
      for (const d of [-1, 1]){ const tw = tc + d*bw*0.3;
        panT(B.p(WIN), a, u, n, tw - 0.45*s, tw + 0.45*s, 1.3, 2.9, f + 0.02);
        panT(B.p(SH), a, u, n, tw - 0.85*s, tw - 0.45*s, 1.3, 2.9, f + 0.04); panT(B.p(SH), a, u, n, tw + 0.45*s, tw + 0.85*s, 1.3, 2.9, f + 0.04);
        panT(B.p(DADO), a, u, n, tw - 0.85*s, tw + 0.85*s, 0.35, 1.15, f + 0.03);
        panT(B.p(TRIM), a, u, n, tw - 0.95*s, tw + 0.95*s, 2.95, 3.25, f + 0.08); }
    }
    // upper floor: three French windows with louvred shutters, moulded heads
    for (const d of [-1, 0, 1]){ const tw = tc + d*bw*0.29;
      panT(B.p(WIN), a, u, n, tw - 0.4*s, tw + 0.4*s, 4.4, 6.4, f + 0.02);
      panT(B.p(SH), a, u, n, tw - 0.8*s, tw - 0.4*s, 4.4, 6.4, f + 0.04); panT(B.p(SH), a, u, n, tw + 0.4*s, tw + 0.8*s, 4.4, 6.4, f + 0.04);
      finT(B.p(TRIM), a, u, n, tw, 1.0*s, 0.18, 6.45, 6.75, f);
      finT(B.p(TRIM), a, u, n, tw, 0.9*s, 0.12, 4.25, 4.4, f); }
    // pilasters between the bays
    for (const e of [bw*k, bw*(k + 1)]) finT(B.p(TRIM), a, u, n, Math.min(W - 0.18, Math.max(0.18, e)), 0.36, 0.14, pp ? 3.8 : 0.3, y1, f);
  }
  // string course and the cornice
  panT(B.p(TRIM), a, u, n, 0, W, 3.75, 4.15, f + 0.12);
  panT(B.p(TRIM), a, u, n, 0, W, y1 - 0.15, YE, f + 0.25);
}
const LBL = {sgemeraldhill:true};
const RR = {sgemeraldhill:100, sgemeraldhill_b:86, sgemeraldhill_c:84, sgemeraldhill_d:26, sgemeraldhill_e:26, sgemeraldhill_pp:32};
for (const key of Object.keys(EHD)){
  const D = EHD[key], [LAT, LON] = LL(A0, D.O[0], D.O[1]);
  const def = {zh:'翡翠山', en:'Emerald Hill', cat:'old', r:RR[key], h:10, lt:{m:0, c:'#ffe6c2', k:0.45, e:0.8}, build(){
    const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
    D.R.forEach((R, i) => terrace(B, R, rng, D.pp[i]));
    B.flush(g); return g; }};
  if (!LBL[key]){ def.label = false; def.zh = '翡翠山（' + {sgemeraldhill_b:'北段东侧', sgemeraldhill_c:'北段西侧', sgemeraldhill_d:'南段西侧', sgemeraldhill_e:'南段西侧', sgemeraldhill_pp:'土生华人坊'}[key] + '）'; def.en = 'Emerald Hill (' + {sgemeraldhill_b:'upper east row', sgemeraldhill_c:'upper west row', sgemeraldhill_d:'lower west group', sgemeraldhill_e:'lower west group', sgemeraldhill_pp:'Peranakan Place'}[key] + ')'; }
  LANDMARKS[key] = def;
  SG_PLACES.push({type:key, lat:LAT, lon:LON, rot:0});
}
}

// ======================================================================================================
// Dempsey Hill (former Tanglin Barracks, Dempsey Road) as a SITE. Verified: ten service barracks built from 1860 (occupied 1867) with
// raised wooden floors, plank walls, square columns and open verandahs round each building; the attap roofs replaced in 1911 by
// red French tiles, which remain; huge roofs for ventilation; the 1934 works kept the square pillars and the French tiling
// (dempseyhill.com history, remembersingapore.org).
// ======================================================================================================
{
const DMP = [{"R":[[-102.6,103.0],[-82.9,91.1],[-48.3,148.6],[-68.0,160.5]],"c":[-75.4,125.8],"L":67.1,"W":23.0,"a":1.029,"f":1.0,"fl":1,"osm":"w170098993"},{"R":[[-47.1,-92.7],[-39.9,-86.8],[-41.1,-85.0],[-35.7,-80.9],[-40.5,-75.0],[-53.7,-85.0]],"c":[-44.1,-83.7],"L":16.5,"W":10.1,"a":-2.455,"f":0.88,"fl":1,"osm":"w241579729"},{"R":[[-60.8,190.1],[-63.2,192.5],[-65.6,189.5],[-70.4,193.7],[-73.4,190.7],[-68.6,186.6],[-71.6,183.0],[-69.2,180.6]],"c":[-68.6,188.7],"L":12.9,"W":9.8,"a":-2.295,"f":0.55,"fl":1,"osm":"-"},{"R":[[-42.3,248.2],[-36.3,243.5],[-23.8,257.1],[-29.8,262.5]],"c":[-33.0,252.7],"L":19.0,"W":8.1,"a":0.852,"f":0.96,"fl":1,"osm":"w170099001"},{"R":[[-14.8,46.6],[6.0,36.5],[34.1,94.1],[13.2,104.1]],"c":[9.7,70.3],"L":64.1,"W":23.2,"a":1.118,"f":1.0,"fl":1,"osm":"w170098983"},{"R":[[-53.1,172.9],[-31.6,161.7],[-0.5,222.1],[-22.6,232.8]],"c":[-27.0,197.5],"L":67.9,"W":24.5,"a":-2.046,"f":0.99,"fl":1,"osm":"w170098980"},{"R":[[-191.6,39.5],[-194.0,46.0],[-198.1,44.8],[-198.7,46.6],[-202.3,45.4],[-199.9,37.1]],"c":[-197.0,42.5],"L":8.8,"W":8.6,"a":1.852,"f":0.85,"fl":1,"osm":"w680380981"},{"R":[[-183.2,65.6],[-195.7,61.4],[-192.8,54.3],[-180.8,58.5]],"c":[-188.2,59.9],"L":13.2,"W":7.7,"a":-2.816,"f":0.97,"fl":1,"osm":"w241578163"},{"R":[[179.2,-48.3],[165.4,-72.6],[172.6,-76.1],[185.7,-51.8]],"c":[175.6,-62.2],"L":27.9,"W":8.0,"a":-2.065,"f":0.96,"fl":1,"osm":"w241260236"},{"R":[[-36.9,110.1],[-17.8,98.2],[17.4,154.5],[-1.7,166.4]],"c":[-9.7,132.3],"L":66.4,"W":22.5,"a":1.012,"f":1.0,"fl":1,"osm":"w170098981"},{"R":[[-56.6,-60.1],[-52.5,-66.7],[-53.7,-67.2],[-50.1,-73.2],[-48.9,-72.6],[-47.7,-75.0],[-38.7,-69.0],[-47.7,-54.8]],"c":[-48.2,-65.1],"L":17.3,"W":11.9,"a":-1.006,"f":0.91,"fl":1,"osm":"w241579728"},{"R":[[-22.6,-72.0],[35.3,-36.4],[23.4,-16.2],[-34.5,-51.8]],"c":[0.4,-44.1],"L":68.4,"W":23.4,"a":0.551,"f":0.99,"fl":1,"osm":"w170098990"},{"R":[[29.3,-57.2],[43.1,-75.5],[98.0,-35.8],[84.9,-17.4]],"c":[63.8,-46.6],"L":68.4,"W":22.9,"a":0.621,"f":0.99,"fl":1,"osm":"w170098991"},{"R":[[-71.0,-30.5],[-70.4,-33.4],[-51.3,-28.7],[-55.4,-12.1],[-59.6,-13.3],[-61.4,-4.4],[-71.0,-6.8],[-70.4,-9.1],[-79.9,-11.5],[-75.1,-31.1]],"c":[-65.9,-18.9],"L":26.0,"W":23.7,"a":1.812,"f":0.88,"fl":1,"osm":"w241577972"},{"R":[[-180.2,81.6],[-189.8,78.6],[-186.8,70.3],[-177.2,73.9]],"c":[-183.5,76.2],"L":10.3,"W":8.8,"a":-2.783,"f":0.96,"fl":1,"osm":"w241578162"},{"R":[[114.1,6.9],[117.1,1.5],[122.5,4.5],[108.1,27.6],[102.8,24.7],[105.7,19.3],[103.4,17.6],[105.2,14.6],[108.1,16.4],[111.7,9.3],[109.3,8.1],[111.1,5.1]],"c":[111.2,13.7],"L":27.6,"W":9.4,"a":-1.013,"f":0.74,"fl":1,"osm":"w680380985"},{"R":[[-70.4,-48.3],[-76.9,-50.6],[-72.8,-63.1],[-66.2,-60.7]],"c":[-71.6,-55.7],"L":13.2,"W":7.0,"a":-1.244,"f":0.98,"fl":1,"osm":"w241579726"},{"R":[[195.3,-88.6],[198.9,-91.0],[203.1,-84.4],[209.6,-89.2],[221.6,-70.8],[212.0,-64.3],[213.2,-62.5],[210.8,-60.7],[214.4,-55.4],[212.0,-53.6],[207.8,-59.5],[200.1,-54.2],[180.4,-83.3],[192.9,-91.6]],"c":[203.6,-73.5],"L":42.3,"W":27.5,"a":0.976,"f":0.73,"fl":1,"osm":"w241260237"},{"R":[[102.2,-77.9],[165.4,-53.0],[157.7,-32.8],[94.4,-58.3]],"c":[130.0,-55.5],"L":68.2,"W":21.6,"a":0.379,"f":0.99,"fl":1,"osm":"w170098992"},{"R":[[-174.8,68.0],[-159.3,50.2],[-105.0,96.4],[-120.5,114.2]],"c":[-139.9,82.2],"L":71.6,"W":23.6,"a":0.705,"f":1.0,"fl":1,"osm":"w170098996"},{"R":[[-17.2,-0.2],[-4.7,-19.2],[48.4,19.9],[35.9,38.9]],"c":[15.6,9.8],"L":67.1,"W":22.7,"a":0.635,"f":0.98,"fl":1,"osm":"w170098986"},{"R":[[-203.5,60.3],[-210.7,75.7],[-225.6,69.1],[-219.0,53.7]],"c":[-214.6,64.8],"L":17.0,"W":16.8,"a":1.976,"f":0.98,"fl":1,"osm":"w680380977"},{"R":[[152.9,-96.3],[149.3,-86.8],[138.0,-91.0],[141.6,-100.5]],"c":[145.4,-93.7],"L":12.1,"W":10.2,"a":0.356,"f":0.99,"fl":1,"osm":"w680380986"},{"R":[[-168.3,48.4],[-171.9,57.3],[-191.6,49.6],[-188.0,40.7]],"c":[-180.0,49.0],"L":21.3,"W":9.6,"a":0.373,"f":0.99,"fl":1,"osm":"w241578161"},{"R":[[-62.6,248.2],[-132.5,169.4],[-124.1,162.3],[-54.3,241.1]],"c":[-93.4,205.3],"L":105.5,"W":11.0,"a":-2.296,"f":0.99,"fl":1,"osm":"w170098999"},{"R":[[-188.0,70.3],[-199.9,66.2],[-198.1,60.8],[-186.2,65.0]],"c":[-193.1,65.6],"L":12.6,"W":5.7,"a":0.332,"f":0.99,"fl":1,"osm":"w241578164"},{"R":[[241.3,-44.1],[237.1,-32.8],[213.8,-42.3],[207.8,-51.2],[217.4,-57.2],[221.6,-51.8]],"c":[224.1,-45.1],"L":34.5,"W":14.8,"a":-2.64,"f":0.74,"fl":1,"osm":"w241260240"},{"R":[[-35.1,105.9],[-38.7,101.2],[-21.4,90.5],[-18.4,95.2]],"c":[-28.5,98.2],"L":20.3,"W":5.9,"a":2.573,"f":0.96,"fl":1,"osm":"-"},{"R":[[4.3,192.5],[26.9,186.6],[31.7,205.5],[40.1,203.2],[44.3,221.0],[34.7,223.3],[39.5,242.9],[44.9,241.7],[47.2,251.8],[21.6,258.3]],"c":[28.4,221.5],"L":68.3,"W":31.9,"a":1.314,"f":0.8,"fl":1,"osm":"w170098979"},{"R":[[46.6,68.0],[58.0,74.5],[50.8,86.9],[39.5,80.4]],"c":[48.7,77.5],"L":14.3,"W":13.1,"a":2.091,"f":0.99,"fl":1,"osm":"w241260234"},{"R":[[114.7,-0.8],[101.0,21.1],[87.8,12.8],[101.0,-8.5]],"c":[101.2,6.0],"L":25.8,"W":15.7,"a":-1.012,"f":0.98,"fl":1,"osm":"w241260239"},{"R":[[-234.0,86.9],[-239.9,84.0],[-219.0,36.5],[-212.5,39.5]],"c":[-226.5,61.7],"L":52.1,"W":7.2,"a":-1.145,"f":0.96,"fl":1,"osm":"w680380980"},{"R":[[-48.9,255.9],[-44.7,252.4],[-34.0,264.8],[-38.1,268.4]],"c":[-41.4,260.4],"L":16.5,"W":5.5,"a":0.858,"f":0.99,"fl":1,"osm":"w170099002"},{"R":[[164.3,-84.4],[157.7,-88.6],[163.7,-98.7],[170.8,-94.5]],"c":[164.2,-91.4],"L":12.0,"W":8.2,"a":2.107,"f":0.96,"fl":1,"osm":"-"},{"R":[[-67.4,-48.3],[-62.6,-58.9],[-48.9,-52.4],[-53.7,-42.3]],"c":[-58.1,-50.5],"L":15.2,"W":11.6,"a":0.425,"f":0.97,"fl":1,"osm":"w241579727"},{"R":[[210.2,-2.6],[201.3,-12.7],[218.6,-28.7],[227.5,-18.6]],"c":[214.4,-15.7],"L":23.9,"W":13.5,"a":-0.746,"f":0.99,"fl":1,"osm":"-"}];
const DKEEP = [[-155.8,47.6],[-217.9,27.6],[-244.4,86.4],[-231.9,91.6],[-223.9,73.2],[-180.7,89.1],[-176.5,81.9],[-119.5,128.9],[-146.8,163.8],[-45.2,284.7],[-14.6,262.6],[-1.5,278.0],[61.4,256.7],[32.7,164.9],[25.8,155.0],[47.3,100.4],[70.9,95.7],[61.2,72.7],[45.5,59.5],[84.1,15.8],[110.9,32.5],[128.2,2.9],[107.4,-11.0],[166.2,-25.0],[173.9,-29.4],[208.6,6.7],[239.7,-25.5],[249.1,-51.1],[207.6,-105.9],[167.3,-99.1],[139.5,-109.8],[126.0,-77.6],[99.6,-85.4],[89.9,-70.0],[39.1,-89.2],[25.9,-97.0],[11.7,-96.6],[-4.5,-85.4],[-23.5,-84.0],[-50.7,-103.5],[-72.8,-71.0],[-89.9,-76.8],[-97.3,-55.8],[-82.0,-46.4],[-90.3,-9.2],[-50.9,13.2],[-53.5,32.1],[-71.4,71.2],[-81.3,75.0],[-93.4,75.4],[-96.0,79.2],[-115.9,72.4]];
const DRD = [[10,[[30,-84],[27,-75],[21,-73],[15,-74],[10,-82],[14,-90],[19,-92],[28,-90],[30,-84]]],[10,[[-47,29],[-36,29],[-28,36],[-28,48],[-34,53],[-43,53],[-51,47],[-50,35],[-44,30]]],[10,[[72,23],[72,27],[69,30],[65,30],[62,27],[65,20],[72,23]]],[11,[[-6,-96],[-2,-99]]],[11,[[-34,53],[-31,64],[7,121]]],[11,[[101,-18],[156,-31],[178,-41]]],[11,[[178,-41],[189,-50],[185,-61]]],[11,[[178,-41],[165,-62]]],[11,[[-217,26],[-227,45]]],[11,[[-157,45],[-163,35]]],[12,[[28,-107],[30,-94]]],[12,[[30,-94],[33,-86],[67,-75],[91,-61]]],[12,[[18,-107],[17,-94],[13,-91],[9,-82],[1,-79],[-20,-77],[-30,-68]]],[12,[[-38,-48],[-2,-28]]],[12,[[-2,-28],[25,-11]]],[12,[[-24,0],[-2,-28]]],[12,[[3,22],[-24,0]]],[12,[[-24,0],[-43,-13]]],[12,[[38,-25],[40,-39],[19,-57],[27,-75]]],[12,[[90,-58],[105,-85],[106,-94]]],[12,[[38,155],[21,167]]],[12,[[54,111],[33,100]]],[12,[[-34,223],[-52,244]]],[12,[[-249,81],[-233,88],[-225,71],[-181,86],[-172,81]]],[12,[[-112,77],[-118,83]]],[12,[[-106,80],[-110,90]]],[12,[[-112,77],[-126,70]]],[12,[[-126,70],[-160,48],[-176,67],[-175,78],[-172,81]]],[12,[[-172,81],[-122,119],[-103,97],[-98,80]]],[12,[[-46,-35],[-56,41],[-53,45]]],[12,[[-96,137],[-147,179]]],[11,[[-45,13],[-54,0],[-84,-10],[-86,-15],[-78,-43],[-40,-34]]],[11,[[71,29],[72,44]]],[11,[[76,82],[80,99]]],[11,[[41,144],[23,143],[17,139],[7,121],[38,95],[37,83],[28,48]]],[11,[[-67,173],[-34,152]]],[11,[[-6,179],[4,224],[1,228],[-20,237],[-25,235],[-34,223],[-67,173]]],[11,[[67,8],[61,16],[25,-11],[32,-20]]],[11,[[32,-20],[37,-25],[40,-25],[66,-7],[72,-1],[67,8]]],[11,[[67,8],[32,-20]]],[11,[[-67,173],[-111,119],[-92,78]]],[11,[[-237,45],[-227,45],[-244,78],[-253,82]]],[10,[[30,-84],[65,-74],[90,-58],[104,-45],[106,-38],[105,-28],[101,-18],[72,23]]],[10,[[-36,29],[3,22],[-27,44]]],[10,[[-47,32],[-38,-48],[-34,-60],[-26,-71],[-20,-76],[-3,-76],[10,-82]]],[10,[[-39,54],[-69,75]]],[10,[[-69,75],[-20,153],[-29,154],[-38,149],[-79,79]]],[10,[[-69,74],[-52,43]]],[10,[[42,160],[20,176],[-6,179]]],[10,[[19,-92],[19,-107]]],[10,[[62,27],[42,45],[34,49],[26,46],[3,22]]],[10,[[-70,76],[-79,79]]],[10,[[-6,179],[-20,153]]],[11,[[-79,79],[-96,78],[-115,70],[-157,45],[-217,26]]]];
// The site: the commercial land-use polygons of the Dempsey Road cluster (OSM areas, merged) as keep; every real building whose
// centroid lies inside is rebuilt on its own OSM footprint (36 ways, listed in the report). The long blocks (1150-1730 m2) are the
// barracks: a raised floor, plank-walled rooms behind open verandahs on square posts, the big hipped roof of red French tiles;
// the smaller ones get plain walls and hipped tile roofs. Real service roads and paths are kept (keepRoads); trees are scattered
// round the edges of the cluster (seeded), off the roads and buildings. Post spacing, eave and ridge heights are estimates.
const A0 = [1.30530, 103.81020];
const pipD = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0])*(z - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; };
const dSeg = (x, z, a, b) => { const ax = b[0] - a[0], az = b[1] - a[1], L = ax*ax + az*az || 1, u = Math.max(0, Math.min(1, ((x - a[0])*ax + (z - a[1])*az)/L)); return Math.hypot(x - a[0] - u*ax, z - a[1] - u*az); };
Object.assign(SITES, {sgdempsey:{zh:'登布西山', en:'Dempsey Hill', lat:A0[0], lon:A0[1], r:300, keep:DKEEP, keepRoads:true, h:16,
  lt:{m:0, c:'#ffe2b4', k:0.5, e:0.8},
  build(ctx){
    const g = new THREE.Group(), B = mkB(), rng = ctx.rng;
    const WALL = '#f1ede3', POST = '#f7f5ef', PLINTH = '#a9a397', FLOOR = '#b8ad9c', TILE = '#b5553b', TILE2 = '#9a4732', WIN = {c:'#44564d', glow:'#ffd9a4', gk:0.55}, DOOR = '#5a4a3a';
    ctx.paint(DKEEP, [196, 192, 178]);
    for (const D of DMP){
      const R = D.R; let g0 = 1e9, g1 = -1e9; for (const p of R){ const h = ctx.gy(p[0], p[1]); g0 = Math.min(g0, h); g1 = Math.max(g1, h); }
      { const h = ctx.gy(D.c[0], D.c[1]); g0 = Math.min(g0, h); g1 = Math.max(g1, h); }
      const big = D.L*D.W > 700 && D.f > 0.9, fl = g1 + (big ? 0.9 : 0.45), ry = -D.a, u = [Math.cos(D.a), Math.sin(D.a)], v = [-u[1], u[0]];
      wallT(B.p(PLINTH), R, g0 - 1.5, fl); flatT(B.p(FLOOR), R, fl);
      const P = (s, t) => [D.c[0] + u[0]*s + v[0]*t, D.c[1] + u[1]*s + v[1]*t];
      if (big){
        // rooms behind the verandahs: inset 2.6 m, walls 3.9 m, windows and doors on every side
        const L2 = D.L - 5.2, W2 = D.W - 5.2, YE = fl + 4.2;
        boxT(B.p(WALL), D.c[0], fl, D.c[1], L2, 3.9, W2, ry);
        const core = [P(-L2/2, -W2/2), P(L2/2, -W2/2), P(L2/2, W2/2), P(-L2/2, W2/2)];
        edges(core, (a, b, Le, uu, n) => { const k = Math.floor(Le/3.3); for (let i = 0; i < k; i++){ const t = (Le - k*3.3)/2 + 3.3*i + 1.65; panT(B.p(i % 3 === 1 ? DOOR : WIN), a, uu, n, t - 0.6, t + 0.6, fl + (i % 3 === 1 ? 0 : 0.8), fl + 2.7, 0.04); } });
        // verandah posts on the outline, a timber rail
        const out = [P(-D.L/2 + 0.3, -D.W/2 + 0.3), P(D.L/2 - 0.3, -D.W/2 + 0.3), P(D.L/2 - 0.3, D.W/2 - 0.3), P(-D.L/2 + 0.3, D.W/2 - 0.3)];
        edges(out, (a, b, Le, uu, n) => { const k = Math.max(1, Math.round(Le/3.3)); for (let i = 0; i < k; i++) boxT(B.p(POST), a[0] + uu[0]*Le*i/k, fl, a[1] + uu[1]*Le*i/k, 0.32, YE - fl, 0.32, ry); });
        wallT(B.p(POST), out, fl + 0.85, fl + 1.0);
        // the big hipped roof, red French tiles, and a ridge vent
        const rise = Math.min(8.5, 0.4*D.W);
        roofT(B.p(TILE), null, D.c[0], D.c[1], D.L, D.W, YE, rise, ry, 0.8, 0.3);
        { const e = 0.3*D.W, a = P(-D.L/2 + e + 2, 0), b = P(D.L/2 - e - 2, 0); if (D.L - 2*e > 6) slabT(B.p(TILE2), a, b, 1.6, YE + rise - 0.2, YE + rise + 0.5); }
        for (const s of [-1, 1]){ const p = P(s*(D.L/2 - 1), 0); ctx.lamp(p[0], fl + 3.4, p[1], [255, 214, 160]); }
      } else {
        const YE = fl + 3.5, Lr = D.f > 0.9 ? D.L : D.L*Math.sqrt(D.f), Wr = D.f > 0.9 ? D.W : D.W*Math.sqrt(D.f);
        wallT(B.p(WALL), R, fl, YE); flatT(B.p(WALL), R, YE - 0.05);
        edges(R, (a, b, Le, uu, n) => { if (Le < 3) return; const k = Math.floor(Le/3); for (let i = 0; i < k; i++){ const t = (Le - k*3)/2 + 3*i + 1.5; panT(B.p(WIN), a, uu, n, t - 0.55, t + 0.55, fl + 0.8, fl + 2.6, 0.04); } });
        roofT(B.p(TILE), null, D.c[0], D.c[1], Lr, Wr, YE, Math.min(6, 0.36*Wr), ry, 0.6, 0.3);
      }
    }
    B.flush(g);
    // trees round the edges of the cluster, off the buildings and the roads
    let n = 0;
    for (let k = 0; k < 2600 && n < 170; k++){
      const x = -250 + rng()*500, z = -120 + rng()*420;
      if (!pipD(DKEEP, x, z)) continue;
      let ok = true;
      for (const D of DMP){ const dx = x - D.c[0], dz = z - D.c[1], s = dx*Math.cos(D.a) + dz*Math.sin(D.a), t = -dx*Math.sin(D.a) + dz*Math.cos(D.a); if (Math.abs(s) < D.L/2 + 5 && Math.abs(t) < D.W/2 + 5){ ok = false; break; } }
      if (!ok) continue;
      for (const r of DRD){ const w = r[0] <= 10 ? 7 : r[0] === 11 ? 5 : 2.5; for (let i = 0; i < r[1].length - 1 && ok; i++) if (dSeg(x, z, r[1][i], r[1][i + 1]) < w) ok = false; if (!ok) break; }
      if (!ok) continue;
      let dE = 1e9; for (let i = 0; i < DKEEP.length; i++) dE = Math.min(dE, dSeg(x, z, DKEEP[i], DKEEP[(i + 1) % DKEEP.length]));
      if (dE > 30 && rng() < 0.75) continue;
      ctx.tree(x, z, 2.6 + rng()*2.0, rng() < 0.7 ? 'raintree' : 'd'); n++;
    }
    return g; }}});
}
}
