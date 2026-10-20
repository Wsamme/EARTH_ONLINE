// ===== lm29/nushalls/nusbt: NUS Bukit Timah campus — the former Raffles College (1928, Cyril Farey & Graham Dawbarn) =====
// Singapore landmark keys (City Brush v32). The college is laid out on one axis running north-east → south-west: the
// Oei Tiong Ham Building (the grand gateway with the college hall) fronts the lower quadrangle; the Manasseh Meyer Building
// (pylon-like central tower, cupolas with flattened domes at both ends) separates it from the upper quadrangle, which the
// Federal Building and the Eu Tong Sen Building close on two more sides and Block B on the fourth. Later: Block A (now the
// Li Ka Shing Building, 1940s), the Library (now the C J Koh Law Library, 1950s), the Tower Block (the 1966 science tower),
// the lecture theatres, the multipurpose auditorium and the moot court. Two-storey cream blocks with round-arched loggias on the
// ground floor, column-and-balustrade verandahs above, tall shuttered windows, hipped red-tile roofs with deep eaves.
// Keys: nusbt (upper quadrangle: Manasseh Meyer, Eu Tong Sen, Federal Building, Block B + the quadrangle garden; labelled),
// nusbt_oth (Oei Tiong Ham Building), nusbt_lib (C J Koh Law Library + Angsana 1/2), nusbt_lks (Li Ka Shing Building, Tower
// Block, Thinking Corner), nusbt_lt (Lecture Theatres, Multipurpose Auditorium, Moot Court) — all label:false except nusbt.
// Frame: every building is axis-aligned in the campus grid (u along the Manasseh Meyer Building towards the south-east, v
// towards the north-east, metres, origin = the ref anchor 1.3188 N 103.8176 E); a key's local x = u − U0, z = −(v − V0),
// SG rot = −48.9° (local +x → bearing 131°, local −z → bearing 41°). No names, crests or lettering on the models.
{
const PI = Math.PI, HP = PI/2, TAU = PI*2;
const AX = 48.9*PI/180, UX = Math.cos(AX), UZ = Math.sin(AX);          // u axis in ref local (east, south)
const ROT = -AX;
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const Q = (o, a, b, c, d) => o.push(...a, ...b, ...c, ...a, ...c, ...d);
const T3 = (o, a, b, c) => o.push(...a, ...b, ...c);
const bx = (o, x0, x1, y0, y1, z0, z1) => { const P = [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]];
  Q(o, P[4], P[7], P[6], P[5]); Q(o, P[0], P[4], P[5], P[1]); Q(o, P[1], P[5], P[6], P[2]); Q(o, P[2], P[6], P[7], P[3]); Q(o, P[3], P[7], P[4], P[0]); };
const segP = (o, a, b, r, n) => { n = n || 6; const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2], L = Math.hypot(dx, dy, dz); if (L < 1e-4) return;
  const d = [dx/L, dy/L, dz/L], up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let ux = d[1]*up[2]-d[2]*up[1], uy = d[2]*up[0]-d[0]*up[2], uz = d[0]*up[1]-d[1]*up[0]; const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
  const vx = d[1]*uz-d[2]*uy, vy = d[2]*ux-d[0]*uz, vz = d[0]*uy-d[1]*ux, A = [], B = [];
  for (let i = 0; i < n; i++){ const t = (i + 0.5)/n*TAU, c = Math.cos(t)*r, s = Math.sin(t)*r; A.push([a[0]+ux*c+vx*s, a[1]+uy*c+vy*s, a[2]+uz*c+vz*s]); B.push([b[0]+ux*c+vx*s, b[1]+uy*c+vy*s, b[2]+uz*c+vz*s]); }
  for (let i = 0; i < n; i++){ const j = (i+1) % n; Q(o, A[i], A[j], B[j], B[i]); } };
const latheP = (o, prof, cx, cz, n, a0, sy) => { a0 = a0 || 0; for (let k = 0; k < prof.length - 1; k++){ const [r0, y0] = prof[k], [r1, y1] = prof[k + 1];
  for (let i = 0; i < n; i++){ const t0 = a0 + i/n*TAU, t1 = a0 + (i + 1)/n*TAU, c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
    Q(o, [cx + c0*r0, y0, cz + s0*r0], [cx + c1*r0, y0, cz + s1*r0], [cx + c1*r1, y1, cz + s1*r1], [cx + c0*r1, y1, cz + s0*r1]); } } };
// colour specs (≤ 16 per key)
const C = {
  wall:'#efe6d1', trim:'#f9f5ec', base:'#bdb6a7', roof:'#b25f3b', ridge:'#97492e', dark:'#3b4246',
  win:{c:'#3d4a50', m:1, fh:4.4, cw:3.4}, shut:'#5d7663', floor:'#cfc6b2', lawn:'#79a058', path:'#dcd5c5',
  trunk:'#6c5a48', leaf:'#4f7d3e', leaf2:'#5f8d45', lamp:{c:'#fff1d6', glow:'#ffd9a0', gk:1.4}, glass:{c:'#7e97a3', m:1, fh:4.0, cw:2.0}, metal:'#8c969a',
};
// ---------- the building kit (all in campus u/v, converted to key-local x/z by the frame) ----------
const kit = (U0, V0) => {
  const B = mkB(), L = (u, y, v) => [u - U0, y, V0 - v];
  const box = (col, u0, u1, y0, y1, v0, v1) => bx(B.p(col), u0 - U0, u1 - U0, y0, y1, V0 - v1, V0 - v0);
  // a face of a rectangle: side 'v+' | 'v-' | 'u+' | 'u-'; F(t, y, d) = point at t along the face (t from 0), d outward
  const face = (R, side) => { const [u0, u1, v0, v1] = R;
    if (side === 'v+') return {len:u1 - u0, F:(t, y, d) => L(u0 + t, y, v1 + d)};
    if (side === 'v-') return {len:u1 - u0, F:(t, y, d) => L(u1 - t, y, v0 - d)};
    if (side === 'u+') return {len:v1 - v0, F:(t, y, d) => L(u1 + d, y, v1 - t)};
    return {len:v1 - v0, F:(t, y, d) => L(u0 - d, y, v0 + t)}; };
  const quadF = (col, F, t0, t1, y0, y1, d) => Q(B.p(col), F(t0, y0, d), F(t1, y0, d), F(t1, y1, d), F(t0, y1, d));
  const slabF = (col, F, t0, t1, y, d0, d1) => Q(B.p(col), F(t0, y, d0), F(t1, y, d0), F(t1, y, d1), F(t0, y, d1));
  const sideF = (col, F, t, y0, y1, d0, d1) => Q(B.p(col), F(t, y0, d0), F(t, y0, d1), F(t, y1, d1), F(t, y1, d0));
  // round-arched loggia across a face: piers, arches (spandrels + soffits) on the outer plane, the verandah wall D behind
  const arcade = (fc, t0, t1, y0, h, s, D, o) => { o = o || {}; const F = fc.F, n = Math.max(1, Math.round((t1 - t0)/s)), bw = (t1 - t0)/n, p = o.pier || 0.9, w = bw/2 - p/2, hs = Math.min(h - w - 0.6, o.spring || 2.6), m = 7;
    const W = C.wall, T = C.trim;
    for (let k = 0; k < n; k++){ const a = t0 + k*bw, c = a + bw/2;
      quadF(W, F, a, c - w, y0, y0 + hs, 0); quadF(W, F, c + w, a + bw, y0, y0 + hs, 0);
      sideF(W, F, c - w, y0, y0 + hs, 0, -0.7); sideF(W, F, c + w, y0, y0 + hs, 0, -0.7);
      // impost band
      quadF(T, F, a - 0.02, c - w + 0.1, y0 + hs - 0.25, y0 + hs, 0.06); quadF(T, F, c + w - 0.1, a + bw + 0.02, y0 + hs - 0.25, y0 + hs, 0.06);
      for (let i = 0; i < m; i++){ const th0 = PI - i/m*PI, th1 = PI - (i + 1)/m*PI, x0 = c + Math.cos(th0)*w, x1 = c + Math.cos(th1)*w, z0 = y0 + hs + Math.sin(th0)*w, z1 = y0 + hs + Math.sin(th1)*w;
        const tA = a + i/m*bw, tB = a + (i + 1)/m*bw;
        Q(B.p(W), F(x0, z0, 0), F(x1, z1, 0), F(tB, y0 + h, 0), F(tA, y0 + h, 0));
        Q(B.p(T), F(x0, z0, 0), F(x1, z1, 0), F(x1, z1, -0.7), F(x0, z0, -0.7));
        // archivolt ring (slightly proud)
        const r2 = w + 0.35, X0 = c + Math.cos(th0)*r2, X1 = c + Math.cos(th1)*r2, Z0 = y0 + hs + Math.sin(th0)*r2, Z1 = y0 + hs + Math.sin(th1)*r2;
        Q(B.p(T), F(x0, z0, 0.05), F(x1, z1, 0.05), F(X1, Z1, 0.05), F(X0, Z0, 0.05)); }
      // the verandah wall behind: a door / window per bay
      if (D > 0){ quadF(o.doorC || C.win, F, c - 0.8, c + 0.8, y0 + 0.05, y0 + Math.min(hs + 0.4, h - 0.5), -D + 0.04); quadF(T, F, c - 1.0, c + 1.0, y0 + Math.min(hs + 0.4, h - 0.5), y0 + Math.min(hs + 0.65, h - 0.3), -D + 0.06); } }
    if (D > 0){ quadF(W, F, t0, t1, y0 - 0.3, y0 + h, -D); slabF(C.floor, F, t0, t1, y0 + 0.02, 0, -D); slabF(C.trim, F, t0, t1, y0 + h - 0.02, 0, -D);
      sideF(W, F, t0, y0 - 0.3, y0 + h, 0, -D); sideF(W, F, t1, y0 - 0.3, y0 + h, 0, -D); } else quadF(C.dark, F, t0, t1, y0, y0 + h, -0.65); };
  // upper verandah: square columns per bay, balustrade, entablature; the room wall D behind with tall windows
  const verandah = (fc, t0, t1, y0, h, s, D) => { const F = fc.F, n = Math.max(1, Math.round((t1 - t0)/s)), bw = (t1 - t0)/n, T = C.trim, W = C.wall;
    for (let k = 0; k <= n; k++){ const t = t0 + k*bw, cw = k === 0 || k === n ? 0.55 : 0.4;
      Q(B.p(W), F(t - cw, y0, 0), F(t + cw, y0, 0), F(t + cw, y0 + h, 0), F(t - cw, y0 + h, 0)); sideF(W, F, t - cw, y0, y0 + h, 0, -0.6); sideF(W, F, t + cw, y0, y0 + h, 0, -0.6);
      if (k < n){ const c = t + bw/2;
        quadF(C.win, F, c - 0.75, c + 0.75, y0 + 0.15, y0 + 3.1, -D + 0.04); quadF(C.shut, F, c - 1.35, c - 0.8, y0 + 0.15, y0 + 3.1, -D + 0.06); quadF(C.shut, F, c + 0.8, c + 1.35, y0 + 0.15, y0 + 3.1, -D + 0.06);
        // balustrade: rail, plinth and balusters
        const a = t + 0.45, b = t + bw - 0.45; quadF(T, F, a, b, y0 + 0.95, y0 + 1.1, 0.02); slabF(T, F, a, b, y0 + 1.1, 0.02, -0.25); quadF(T, F, a, b, y0, y0 + 0.2, 0.02);
        const nb = Math.max(2, Math.floor((b - a)/0.32)); for (let j = 0; j < nb; j++){ const x = a + (j + 0.5)*(b - a)/nb; quadF(T, F, x - 0.07, x + 0.07, y0 + 0.2, y0 + 0.95, -0.05); } } }
    quadF(T, F, t0 - 0.1, t1 + 0.1, y0 + h - 0.75, y0 + h, 0.04);                 // entablature
    quadF(W, F, t0, t1, y0, y0 + h, -D); slabF(C.floor, F, t0, t1, y0 + 0.02, 0, -D); slabF(T, F, t0, t1, y0 + h - 0.75, 0, -D);
    sideF(W, F, t0, y0, y0 + h, 0, -D); sideF(W, F, t1, y0, y0 + h, 0, -D); };
  // plain wall with tall shuttered windows on each floor (fl = list of [y0, h])
  const windows = (fc, t0, t1, fl, s, o) => { o = o || {}; const F = fc.F, n = Math.max(1, Math.round((t1 - t0)/s)), bw = (t1 - t0)/n, T = C.trim;
    for (const [y0, h] of fl){ const wy0 = y0 + (o.sill || 0.9), wy1 = Math.min(y0 + h - 0.7, wy0 + (o.wh || 2.7));
      for (let k = 0; k < n; k++){ const c = t0 + (k + 0.5)*bw, ww = o.ww || 0.7;
        quadF(o.wc || C.win, F, c - ww, c + ww, wy0, wy1, 0.03);
        quadF(T, F, c - ww - 0.18, c + ww + 0.18, wy1, wy1 + 0.22, 0.07); quadF(T, F, c - ww - 0.12, c + ww + 0.12, wy0 - 0.15, wy0, 0.09);
        if (!o.noShut){ quadF(C.shut, F, c - ww - 0.62, c - ww - 0.08, wy0, wy1, 0.06); quadF(C.shut, F, c + ww + 0.08, c + ww + 0.62, wy0, wy1, 0.06); }
        if (o.arch){ // semicircular fanlight
          const r = ww, m = 5; for (let i = 0; i < m; i++){ const a0 = PI - i/m*PI, a1 = PI - (i + 1)/m*PI; Q(B.p(C.win), F(c + Math.cos(a0)*r, wy1 + 0.22 + Math.sin(a0)*r, 0.03), F(c + Math.cos(a1)*r, wy1 + 0.22 + Math.sin(a1)*r, 0.03), F(c + Math.cos(a1)*r*0.2, wy1 + 0.22, 0.03), F(c + Math.cos(a0)*r*0.2, wy1 + 0.22, 0.03)); } } } } };
  // hipped roof over a rectangle with an overhang, fascia and ridge
  const hip = (u0, u1, v0, v1, y, pitch, ov, col) => { const a0 = u0 - ov, a1 = u1 + ov, b0 = v0 - ov, b1 = v1 + ov, Lu = a1 - a0, Lv = b1 - b0, o = B.p(col || C.roof);
    const along = Lu >= Lv, hw = (along ? Lv : Lu)/2, h = hw*pitch, cu = (a0 + a1)/2, cv = (b0 + b1)/2;
    const r1 = along ? L(a0 + hw, y + h, cv) : L(cu, y + h, b0 + hw), r2 = along ? L(a1 - hw, y + h, cv) : L(cu, y + h, b1 - hw);
    const A = L(a0, y, b0), Bq = L(a1, y, b0), Cq = L(a1, y, b1), D = L(a0, y, b1);
    if (along){ Q(o, A, Bq, r2, r1); Q(o, Cq, D, r1, r2); T3(o, D, A, r1); T3(o, Bq, Cq, r2); } else { Q(o, Bq, Cq, r2, r1); Q(o, D, A, r1, r2); T3(o, A, Bq, r1); T3(o, Cq, D, r2); }
    // fascia + soffit
    const T = B.p(C.trim); Q(T, L(a0, y - 0.35, b0), L(a1, y - 0.35, b0), L(a1, y, b0), L(a0, y, b0)); Q(T, L(a1, y - 0.35, b0), L(a1, y - 0.35, b1), L(a1, y, b1), L(a1, y, b0));
    Q(T, L(a1, y - 0.35, b1), L(a0, y - 0.35, b1), L(a0, y, b1), L(a1, y, b1)); Q(T, L(a0, y - 0.35, b1), L(a0, y - 0.35, b0), L(a0, y, b0), L(a0, y, b1));
    Q(T, L(a0, y - 0.35, b0), L(a1, y - 0.35, b0), L(a1, y - 0.35, b1), L(a0, y - 0.35, b1));
    // ridge and hip rolls, and a few darker tile courses across the slopes
    const R = B.p(C.ridge); segP(R, r1, r2, 0.16, 4); for (const [p, q] of [[A, r1], [D, r1], [Bq, r2], [Cq, r2]]) segP(R, p, q, 0.11, 4);
    const cr = [[A, r1], [Bq, r2], [Cq, r2], [D, r1]], lp = (p, q, f, dy) => [p[0] + (q[0] - p[0])*f, p[1] + (q[1] - p[1])*f + dy, p[2] + (q[2] - p[2])*f];
    for (const f of [0.22, 0.45, 0.68]) for (let i = 0; i < 4; i++){ const [p0, q0] = cr[i], [p1, q1] = cr[(i + 1) % 4]; Q(R, lp(p0, q0, f, 0.06), lp(p1, q1, f, 0.06), lp(p1, q1, f + 0.035, 0.06), lp(p0, q0, f + 0.035, 0.06)); }
    return y + h; };
  // plinth / terrace podium under a rectangle down to y = -dn
  const plinth = (u0, u1, v0, v1, dn, top, col) => box(col || C.base, u0, u1, -dn, top, v0, v1);
  // simple tree: trunk + two-tier crown
  const tree = (u, v, s) => { const p = L(u, 0, v); segP(B.p(C.trunk), [p[0], -0.5, p[2]], [p[0], 3.2*s, p[2]], 0.28*s, 5);
    latheP(B.p(C.leaf), [[0.2*s, 2.4*s], [3.2*s, 3.6*s], [3.6*s, 5.0*s], [2.6*s, 6.6*s], [0.2*s, 7.4*s]], p[0], p[2], 7, (u*7 + v) % 1);
    latheP(B.p(C.leaf2), [[0.2*s, 5.4*s], [2.0*s, 6.4*s], [1.4*s, 7.8*s], [0.1*s, 8.2*s]], p[0] + 0.7*s, p[2] - 0.5*s, 6); };
  // two-storey Raffles College block: rectangle R, loggia + verandah on the listed faces, windows on the others
  // ground-floor loggias of wide round arches on the listed faces carry the upper storey (tall louvred windows, no pilasters);
  // windows on the other faces; cornice; hipped tile roof pitched high for air circulation
  const college = (R, o) => { const [u0, u1, v0, v1] = R, h1 = o.h1 || 4.6, h2 = o.h2 || 4.4, H = h1 + h2, D = o.D || 3.0, s = o.bay || 4.0;
    plinth(u0 - 0.6, u1 + 0.6, v0 - 0.6, v1 + 0.6, o.dn || 5, 0.6);
    const ver = o.ver || [], ins = s2 => ver.includes(s2) ? D : 0, cu0 = u0 + ins('u-'), cu1 = u1 - ins('u+'), cv0 = v0 + ins('v-'), cv1 = v1 - ins('v+');
    box(C.wall, cu0, cu1, 0.6, 0.6 + h1, cv0, cv1);
    box(C.wall, u0, u1, 0.6 + h1 - 0.3, H + 0.6, v0, v1);
    for (const side of ['v+', 'v-', 'u+', 'u-']){ const fc = face(R, side), F = fc.F;
      if (ver.includes(side)){ arcade(fc, 0, fc.len, 0.6, h1, s, D); windows(fc, 0, fc.len, [[0.6 + h1, h2]], s, {ww:0.8, wh:2.6, sill:0.8, arch:o.archWin}); }
      else { const fcc = face([cu0, cu1, cv0, cv1], side); windows(fcc, 0, fcc.len, [[0.6, h1]], o.wbay || 3.4, {arch:o.archWin}); windows(fc, 0, fc.len, [[0.6 + h1, h2]], o.wbay || 3.4, {arch:o.archWin}); }
      quadF(C.trim, F, -0.1, fc.len + 0.1, 0.6 + h1 - 0.15, 0.6 + h1 + 0.2, 0.1);
      quadF(C.trim, F, -0.15, fc.len + 0.15, H + 0.1, H + 0.6, 0.12); }                  // cornice
    const top = hip(u0, u1, v0, v1, H + 0.6, o.pitch || 0.75, o.ov || 1.3);
    return {H:H + 0.6, top}; };
  return {B, L, box, face, quadF, slabF, sideF, arcade, verandah, windows, hip, plinth, tree, college};
};
// ---------- the upper quadrangle (labelled key) ----------
const U0 = -20, V0 = -46;
LANDMARKS.nusbt = {zh:'新加坡国立大学武吉知马校区（法学院）', en:'NUS Bukit Timah Campus (Faculty of Law, former Raffles College)', cat:'old', r:96, h:28,
  lt:{m:0, c:'#ffe6c2', k:0.45, e:0.4},
  build(){ const g = new THREE.Group(), K = kit(U0, V0), {B, L, box, face, quadF} = K;
    // ---- Manasseh Meyer Building: u -55.5..26.2, v 8.6..20.8; loggias on both long faces; tower over the axis, cupolas at the ends ----
    const mm = K.college([-55.5, 26.2, 8.6, 20.8], {ver:['v-', 'v+'], D:2.6, bay:3.9, h1:4.8, h2:4.6, dn:6});
    const ax = -14.7, Ht = mm.H;
    // central pylon tower: a battered (tapering) square shaft with recessed vertical slots, a cornice, an upper stage with
    // paired openings, a second cornice and a low pyramid cap
    { const cx = ax - U0, cz = V0 - 14.7, r2 = Math.SQRT2, y0 = Ht - 2, y1 = Ht + 9.4, h0 = 3.8, h1 = 3.2, hwAt = y => h0 + (h1 - h0)*(y - y0)/(y1 - y0);
      latheP(B.p(C.wall), [[h0*r2, y0], [h1*r2, y1]], cx, cz, 4, PI/4);
      bx(B.p(C.trim), cx - 3.55, cx + 3.55, y1, y1 + 0.5, cz - 3.55, cz + 3.55);
      latheP(B.p(C.wall), [[2.75*r2, y1 + 0.5], [2.6*r2, Ht + 12.7]], cx, cz, 4, PI/4);
      bx(B.p(C.trim), cx - 2.95, cx + 2.95, Ht + 12.7, Ht + 13.1, cz - 2.95, cz + 2.95);
      latheP(B.p(C.roof), [[3.05*r2, Ht + 13.1], [0.15, Ht + 14.9]], cx, cz, 4, PI/4);
      segP(B.p(C.metal), [cx, Ht + 14.8, cz], [cx, Ht + 16.3, cz], 0.07, 4);
      const S = B.p(C.dark), sa = Ht + 4.6, sb = Ht + 8.6, da = hwAt(sa) + 0.03, db = hwAt(sb) + 0.03;
      for (const sg of [-1, 1]) for (const k of [-1.5, 0, 1.5]){
        Q(S, [cx + k - 0.32, sa, cz + sg*da], [cx + k + 0.32, sa, cz + sg*da], [cx + k + 0.32, sb, cz + sg*db], [cx + k - 0.32, sb, cz + sg*db]);
        Q(S, [cx + sg*da, sa, cz + k - 0.32], [cx + sg*da, sa, cz + k + 0.32], [cx + sg*db, sb, cz + k + 0.32], [cx + sg*db, sb, cz + k - 0.32]); }
      for (const sg of [-1, 1]) for (const k of [-0.9, 0.9]){ const d = 2.68;
        Q(S, [cx + k - 0.45, Ht + 10.6, cz + sg*d], [cx + k + 0.45, Ht + 10.6, cz + sg*d], [cx + k + 0.45, Ht + 12.2, cz + sg*d], [cx + k - 0.45, Ht + 12.2, cz + sg*d]);
        Q(S, [cx + sg*d, Ht + 10.6, cz + k - 0.45], [cx + sg*d, Ht + 10.6, cz + k + 0.45], [cx + sg*d, Ht + 12.2, cz + k + 0.45], [cx + sg*d, Ht + 12.2, cz + k - 0.45]); } }
    // end cupolas: octagonal drums with arched openings and flattened domes on square bases at both roof ends
    for (const uc of [-51.5, 22.2]){ const cx = uc - U0, cz = V0 - 14.7, y0 = Ht + 1.5;
      bx(B.p(C.wall), cx - 2.6, cx + 2.6, y0, y0 + 2.4, cz - 2.6, cz + 2.6); bx(B.p(C.trim), cx - 2.85, cx + 2.85, y0 + 2.4, y0 + 2.75, cz - 2.85, cz + 2.85);
      latheP(B.p(C.wall), [[2.1, y0 + 2.75], [2.1, y0 + 5.3]], cx, cz, 8, PI/8);
      for (let i = 0; i < 8; i++){ const a = (i + 0.5)/8*TAU + PI/8 - PI/8, c = Math.cos(a), s = Math.sin(a); Q(B.p(C.dark), [cx + c*2.13 - s*0.5, y0 + 3.1, cz + s*2.13 + c*0.5], [cx + c*2.13 + s*0.5, y0 + 3.1, cz + s*2.13 - c*0.5], [cx + c*2.13 + s*0.5, y0 + 4.7, cz + s*2.13 - c*0.5], [cx + c*2.13 - s*0.5, y0 + 4.7, cz + s*2.13 + c*0.5]); }
      latheP(B.p(C.trim), [[2.4, y0 + 5.3], [2.45, y0 + 5.6], [2.2, y0 + 5.65]], cx, cz, 8, PI/8);
      latheP(B.p(C.roof), [[2.25, y0 + 5.65], [2.05, y0 + 6.3], [1.5, y0 + 6.85], [0.8, y0 + 7.15], [0.05, y0 + 7.25]], cx, cz, 12);
      segP(B.p(C.metal), [cx, y0 + 7.2, cz], [cx, y0 + 8.3, cz], 0.06, 4); }
    // the central passage through the building on the axis (a taller arch on both faces)
    for (const side of ['v-', 'v+']){ const fc = face([-55.5, 26.2, 8.6, 20.8], side), t = side === 'v+' ? ax + 55.5 : 26.2 - ax; quadF(C.trim, fc.F, t - 2.6, t + 2.6, 0.6, 1.0, 0.25); }
    // ---- Eu Tong Sen Building: main bar u -52.3..23.2, v -107.7..-89.0 + the south-west wing; loggia facing the quadrangle ----
    K.college([-52.3, 23.2, -107.2, -89.0], {ver:['v+'], D:2.8, bay:3.9, dn:5});
    K.college([-22.9, -9.2, -113.6, -107.0], {h1:4.6, h2:4.4, dn:5, pitch:0.5, ov:1.0});
    // ---- Federal Building: u 18.8..37.5, v -81.3..-1.1; loggia facing the quadrangle (u-) ----
    K.college([18.8, 37.5, -81.3, -1.1], {ver:['u-'], D:2.8, bay:3.9, dn:5});
    // corner link between Eu Tong Sen and Federal (covered passage, the real 4.8 m roof at the south corner)
    { box(C.wall, 18.8, 24.5, -4, 4.2, -89.2, -81.0); const fc = face([18.8, 24.5, -89.2, -81.0], 'u+'); K.arcade(fc, 0, fc.len, 0.2, 4.0, 4.1, 0); K.hip(17.8, 25.5, -90, -80.3, 4.6, 0.5, 0.6); }
    // ---- Block B (later teaching block): u -76.6..-55.5, v -107.7..0.6, five storeys, loggia to the quadrangle on the ground floor ----
    { const R = [-72.8, -55.5, -105.3, 0.6]; K.plinth(-73.4, -54.9, -106, 1.2, 5, 0.6);
      box(C.wall, -72.8, -58.4, 0.6, 17.4, -105.3, 0.6); box(C.wall, -76.6, -60.3, 0.6, 17.4, -107.7, -96.7);
      const fq = face(R, 'u+'); K.arcade(fq, 0, fq.len, 0.6, 4.4, 4.2, 2.9);
      box(C.wall, -58.6, -55.5, 4.9, 5.2, -105.3, 0.6);
      const fl = [[5.0, 3.1], [8.1, 3.1], [11.2, 3.1], [14.3, 3.1]];
      { const fc = face([-72.8, -58.4, -105.3, 0.6], 'u+'); K.windows({len:fc.len, F:(t, y, d) => fc.F(t, y, d)}, 0, fc.len, fl, 3.3, {ww:0.8, wh:1.9, sill:0.8, noShut:true}); }
      { const fc = face([-72.8, -58.4, -96.7, 0.6], 'u-'); K.windows(fc, 0, fc.len, [[0.6, 4.4], ...fl], 3.3, {ww:0.8, wh:1.9, sill:0.8, noShut:true}); }
      for (const side of ['v+']){ const fc = face([-72.8, -58.4, -105.3, 0.6], side); K.windows(fc, 0, fc.len, [[0.6, 4.4], ...fl], 3.4, {ww:0.8, wh:1.9, noShut:true}); }
      { const fc = face([-76.6, -60.3, -107.7, -96.7], 'v-'); K.windows(fc, 0, fc.len, [[0.6, 4.4], ...fl], 3.4, {ww:0.8, wh:1.9, noShut:true}); }
      for (let y = 4.9; y < 17; y += 3.1) for (const side of ['u+', 'u-']){ const fc = face([-72.8, -58.4, -105.3, 0.6], side); quadF(C.trim, fc.F, 0, fc.len, y - 0.1, y + 0.12, 0.1); }
      K.hip(-72.8, -58.4, -105.3, 0.6, 17.4, 0.42, 1.2); K.hip(-76.6, -60.3, -107.7, -96.7, 17.2, 0.45, 1.0); }
    // ---- the quadrangle garden: lawn, the axial walk and cross walk, a perimeter path, specimen trees ----
    { const o = B.p(C.lawn), p = B.p(C.path), u0 = -55.3, u1 = 18.6, v0 = -88.8, v1 = 8.4;
      Q(o, L(u0 + 3, 0.15, v0 + 3), L(u1 - 3, 0.15, v0 + 3), L(u1 - 3, 0.15, v1 - 3), L(u0 + 3, 0.15, v1 - 3));
      box(C.path, u0, u1, -3.6, 0.0, v0, v1);
      box(C.path, ax - 2.2, ax + 2.2, 0.0, 0.25, v0 + 3, v1 - 3); box(C.path, u0 + 3, u1 - 3, 0.0, 0.25, -42.5, -38.5);
      // low hedges along the lawn edges
      for (const [a, b2, c, d] of [[u0 + 3, ax - 2.2, v0 + 3, v0 + 3.6], [ax + 2.2, u1 - 3, v0 + 3, v0 + 3.6], [u0 + 3, ax - 2.2, v1 - 3.6, v1 - 3], [ax + 2.2, u1 - 3, v1 - 3.6, v1 - 3]]) box(C.leaf, a, b2, 0.1, 0.9, c, d);
      for (const [u, v, s] of [[-45, -78, 1.15], [8, -78, 1.0], [-45, -3, 1.05], [8, -2, 1.1], [-30, -62, 0.8], [0, -20, 0.85]]) K.tree(u, v, s);
      // lamp posts along the axial walk
      for (const v of [-80, -62, -20, -2]){ const q = L(ax + 3.2, 0, v); segP(B.p(C.metal), [q[0], 0, q[2]], [q[0], 3.6, q[2]], 0.08, 4); bx(B.p(C.lamp), q[0] - 0.22, q[0] + 0.22, 3.6, 4.1, q[2] - 0.22, q[2] + 0.22); } }
    // small service shed on the outer side of the Federal Building (real 4.2 m roof)
    box(C.wall, 38.4, 42.0, -4, 3.6, -45.5, -32.6); K.hip(38.4, 42.0, -45.5, -32.6, 3.6, 0.5, 0.5);
    B.flush(g); return g; }};
// ---------- Oei Tiong Ham Building: the grand gateway and college hall ----------
LANDMARKS.nusbt_oth = {zh:'王仲涵大楼', en:'Oei Tiong Ham Building', cat:'old', r:68, h:21, label:false,
  lt:{m:0, c:'#ffe6c2', k:0.45, e:0.4},
  build(){ const g = new THREE.Group(), U = -12.5, V = 75, K = kit(U, V), {B, L, box, face, quadF} = K;
    // wings: two-storey arcaded blocks on both sides of the central hall, loggias to the lower quadrangle (v-)
    K.college([-61.4, -33.0, 66.0, 85.9], {ver:['v-', 'v+'], D:2.8, bay:3.9, dn:7});
    K.college([4.3, 32.2, 66.3, 85.8], {ver:['v-', 'v+'], D:2.8, bay:3.9, dn:7});
    K.college([31.8, 36.4, 71.7, 79.4], {h1:4.6, h2:4.4, dn:7, pitch:0.5, ov:0.6});
    // central hall: taller block u -33..4.3 with tall arched windows, a gateway arch on the axis through both faces
    { const u0 = -33.0, u1 = 4.3, v0 = 63.4, v1 = 84.0, H = 13.6, ax = -14.7; K.plinth(u0 - 0.8, u1 + 0.8, v0 - 0.8, v1 + 1.6, 7, 0.6);
      box(C.wall, u0, u1, 0.6, H, v0, v1);
      for (const side of ['v-', 'v+']){ const fc = face([u0, u1, v0, v1], side), t = side === 'v+' ? ax - u0 : u1 - ax;
        // gateway: a tall round arch, its dark passage, rusticated piers either side
        const w = 2.6, hs = 4.2, F = fc.F; quadF(C.dark, F, t - w, t + w, 0.6, 0.6 + hs, 0.02);
        for (let i = 0; i < 8; i++){ const a0 = PI - i/8*PI, a1 = PI - (i + 1)/8*PI; Q(B.p(C.dark), F(t + Math.cos(a0)*w, 0.6 + hs + Math.sin(a0)*w, 0.02), F(t + Math.cos(a1)*w, 0.6 + hs + Math.sin(a1)*w, 0.02), F(t, 0.6 + hs, 0.02), F(t, 0.6 + hs, 0.02));
          const r2 = w + 0.55; Q(B.p(C.trim), F(t + Math.cos(a0)*w, 0.6 + hs + Math.sin(a0)*w, 0.12), F(t + Math.cos(a1)*w, 0.6 + hs + Math.sin(a1)*w, 0.12), F(t + Math.cos(a1)*r2, 0.6 + hs + Math.sin(a1)*r2, 0.12), F(t + Math.cos(a0)*r2, 0.6 + hs + Math.sin(a0)*r2, 0.12)); }
        for (const sg of [-1, 1]){ for (let y = 0.6; y < 0.6 + hs + 2.4; y += 0.9) quadF(C.trim, F, t + sg*w + (sg < 0 ? -1.3 : 0), t + sg*w + (sg < 0 ? 0 : 1.3), y, y + 0.7, 0.1);
          // pilasters framing the frontispiece
          quadF(C.trim, F, t + sg*7.2 - 0.5, t + sg*7.2 + 0.5, 0.6, H - 0.6, 0.18); }
        // the hall's tall arched windows above and either side
        K.windows({len:fc.len, F}, 0, t - 8.2, [[0.6, 4.6], [5.2, 8.0]], 3.6, {ww:0.8, wh:4.6, sill:1.4, arch:true, noShut:true});
        K.windows({len:fc.len, F}, t + 8.2, fc.len, [[0.6, 4.6], [5.2, 8.0]], 3.6, {ww:0.8, wh:4.6, sill:1.4, arch:true, noShut:true});
        K.windows({len:fc.len, F}, t - 6.6, t + 6.6, [[7.2, 6.0]], 3.3, {ww:0.75, wh:3.2, sill:1.0, arch:true, noShut:true});
        // frontispiece attic: stepped parapet over the gateway
        quadF(C.wall, F, t - 7.7, t + 7.7, H, H + 1.6, 0.18); quadF(C.trim, F, t - 7.9, t + 7.9, H + 1.6, H + 1.95, 0.24); quadF(C.wall, F, t - 3.4, t + 3.4, H + 1.95, H + 3.1, 0.18); quadF(C.trim, F, t - 3.6, t + 3.6, H + 3.1, H + 3.4, 0.24);
        quadF(C.trim, F, -0.15, fc.len + 0.15, H - 0.6, H, 0.12); }
      for (const side of ['u-', 'u+']){ const fc = face([u0, u1, v0, v1], side); quadF(C.trim, fc.F, -0.15, fc.len + 0.15, H - 0.6, H, 0.12); }
      K.hip(u0, u1, v0, v1, H, 0.62, 1.2);
      // the gateway passage through the building (dark vault)
      box(C.dark, ax - 2.6, ax + 2.6, 0.6, 4.8, v0 - 0.05, v1 + 0.05); }
    // the lower quadrangle between the Manasseh Meyer Building and the gateway: lawn, the axial walk, a cross walk, trees
    { const u0 = -54, u1 = 21, v0 = 23.5, v1 = 61.5, ax = -14.7; box(C.path, u0, u1, -4.0, 0.0, v0, v1);
      Q(B.p(C.lawn), L(u0 + 2.5, 0.15, v0 + 2.5), L(u1 - 2.5, 0.15, v0 + 2.5), L(u1 - 2.5, 0.15, v1 - 2.5), L(u0 + 2.5, 0.15, v1 - 2.5));
      box(C.path, ax - 2.4, ax + 2.4, 0.0, 0.25, v0 + 2.5, v1 - 2.5); box(C.path, u0 + 2.5, u1 - 2.5, 0.0, 0.25, 40.5, 44.0);
      for (const [u, v, s] of [[-44, 32, 1.1], [10, 32, 1.0], [-44, 54, 1.15], [11, 54, 1.05], [-29, 50, 0.8]]) K.tree(u, v, s); }
    // the drop-off apron of the circular drive on the Bukit Timah Road side (the drive itself stays the app's road) and two trees
    { box(C.path, -38, 6, -4.0, 0.1, 86.3, 95.2); for (const [u, v] of [[-44, 90.5], [15, 90.5]]) K.tree(u, v, 1.0); }
    // the small annexe at the lower quadrangle (real 4.9 m roof)
    // carriage porch in front of the gateway (the real 4.9 m roof on the axis): four columns, a hipped roof
    { for (const [u, v] of [[-21.2, 82], [-15.6, 82], [-21.2, 87.0], [-15.6, 87.0]]){ const p = L(u, 0, v); segP(B.p(C.trim), [p[0], -4, p[2]], [p[0], 3.6, p[2]], 0.32, 8); }
      box(C.trim, -21.8, -15.0, 3.6, 4.1, 81.4, 87.6); K.hip(-21.8, -15.0, 81.4, 87.6, 4.1, 0.5, 0.4); }
    B.flush(g); return g; }};
// ---------- C J Koh Law Library + Angsana 1 / 2 ----------
LANDMARKS.nusbt_lib = {zh:'高景辉法律图书馆', en:'C J Koh Law Library', cat:'old', r:40, h:17, label:false,
  lt:{m:0, c:'#ffe6c2', k:0.4, e:0.4},
  build(){ const g = new THREE.Group(), U = 39, V = 43.5, K = kit(U, V), {B, L, box, face, quadF} = K;
    // the library: three storeys, reading rooms with tall windows and deep sunshade hoods, hipped tile roof
    { const u0 = 41.1, u1 = 54.5, v0 = 14.0, v1 = 73.2, H = 13.4; K.plinth(u0 - 0.6, u1 + 0.6, v0 - 0.6, v1 + 0.6, 6, 0.6);
      box(C.wall, u0, u1, 0.6, H, v0, v1); box(C.wall, 36.4, u0, 0.6, 9.6, 57.1, 71.9);
      const fl = [[0.6, 4.4], [5.0, 4.2], [9.2, 4.2]];
      for (const side of ['u-', 'u+', 'v-', 'v+']){ const fc = face([u0, u1, v0, v1], side); K.windows(fc, 0, fc.len, fl, side[0] === 'u' ? 3.0 : 3.3, {ww:0.95, wh:2.9, sill:0.7, noShut:true});
        for (const [y] of fl.slice(1)) { quadF(C.trim, fc.F, -0.1, fc.len + 0.1, y - 0.12, y + 0.12, 0.6); K.slabF(C.trim, fc.F, -0.1, fc.len + 0.1, y + 0.12, 0, 0.6); }
        quadF(C.trim, fc.F, -0.15, fc.len + 0.15, H - 0.5, H, 0.12); }
      K.hip(u0, u1, v0, v1, H, 0.55, 1.3); K.hip(36.4, u0, 57.1, 71.9, 9.6, 0.5, 0.8);
      const fe = face([36.4, u0, 57.1, 71.9], 'u-'); K.windows(fe, 0, fe.len, [[0.6, 4.4], [5.0, 4.2]], 3.2, {ww:0.8, noShut:true}); }
    // Angsana 1 and 2: small two-storey pavilions on the lower quadrangle, verandah to the quad
    K.college([23.9, 34.8, 23.1, 38.3], {ver:['u-'], D:2.4, bay:3.6, h1:4.2, h2:4.0, dn:5, pitch:0.6, ov:1.0});
    K.college([23.9, 34.4, 51.0, 59.4], {h1:4.0, h2:3.6, dn:5, pitch:0.6, ov:1.0});
    B.flush(g); return g; }};
// ---------- Li Ka Shing Building (Block A), Tower Block, Thinking Corner ----------
LANDMARKS.nusbt_lks = {zh:'李嘉诚大楼', en:'Li Ka Shing Building', cat:'old', r:48, h:20, label:false,
  lt:{m:0, c:'#ffe6c2', k:0.4, e:0.4},
  build(){ const g = new THREE.Group(), U = -76, V = 40, K = kit(U, V), {B, L, box, face, quadF} = K;
    // Li Ka Shing Building: four storeys, the long faces with verandahs on the lower two floors, hipped roof
    { const u0 = -83.5, u1 = -66.9, v0 = 25.1, v1 = 71.6, H = 15.8; K.plinth(u0 - 0.6, u1 + 0.6, v0 - 0.6, v1 + 0.6, 10, 0.6);
      box(C.wall, u0, u1, 0.6, H, v0, v1);
      const fl = [[0.6, 3.8], [4.4, 3.8], [8.2, 3.8], [12.0, 3.6]];
      for (const side of ['u-', 'u+', 'v-', 'v+']){ const fc = face([u0, u1, v0, v1], side); K.windows(fc, 0, fc.len, fl, 3.3, {ww:0.75, wh:2.3, sill:0.8});
        for (const [y] of fl.slice(1)) quadF(C.trim, fc.F, -0.1, fc.len + 0.1, y - 0.12, y + 0.14, 0.1);
        quadF(C.trim, fc.F, -0.15, fc.len + 0.15, H - 0.5, H, 0.12); }
      K.hip(u0, u1, v0, v1, H, 0.5, 1.2); }
    // Tower Block (1966): four storeys, flat roof behind a parapet, a grid of sunshade fins and slab edges
    { const u0 = -96.0, u1 = -57.5, v0 = 8.2, v1 = 23.8, H = 14.6; K.plinth(u0 - 0.5, u1 + 0.5, v0 - 0.5, v1 + 0.5, 10, 0.6);
      box(C.wall, u0, u1, 0.6, H + 0.8, v0, v1);
      for (const side of ['u-', 'u+', 'v-', 'v+']){ const fc = face([u0, u1, v0, v1], side), F = fc.F, n = Math.round(fc.len/1.6);
        for (let y = 1.2; y < H - 1; y += 3.5){ quadF(C.win, F, 0.4, fc.len - 0.4, y + 0.7, y + 2.8, 0.03); quadF(C.trim, F, -0.05, fc.len + 0.05, y + 2.85, y + 3.15, 0.7); K.slabF(C.trim, F, -0.05, fc.len + 0.05, y + 3.15, 0, 0.7); }
        for (let k = 0; k <= n; k++){ const t = k*fc.len/n; quadF(C.trim, F, t - 0.08, t + 0.08, 1.2, H, 0.55); K.sideF(C.trim, F, t, 1.2, H, 0, 0.55); } }
      box('#b9bcb8', u0 + 0.4, u1 - 0.4, H + 0.1, H + 0.3, v0 + 0.4, v1 - 0.4); box(C.metal, -80, -73, H + 0.3, H + 2.6, 13, 19); }
    // Thinking Corner: a single-storey glass pavilion with a broad hipped roof
    { const u0 = -66.0, u1 = -58.0, v0 = 36.0, v1 = 57.6; box(C.base, u0, u1, -7, 0.5, v0, v1);
      for (const side of ['u-', 'u+', 'v-', 'v+']){ const fc = face([u0, u1, v0, v1], side); quadF(C.glass, fc.F, 0.2, fc.len - 0.2, 0.5, 3.2, 0.02); }
      box(C.wall, u0, u1, 3.2, 3.7, v0, v1); K.hip(u0, u1, v0, v1, 3.7, 0.45, 1.2); }
    B.flush(g); return g; }};
// ---------- Lecture Theatres, Multipurpose Auditorium, Moot Court (outside Block B) ----------
LANDMARKS.nusbt_lt = {zh:'武吉知马校区讲堂与模拟法庭', en:'Bukit Timah Lecture Theatres & Moot Court', cat:'old', r:58, h:18, label:false,
  lt:{m:0, c:'#ffe6c2', k:0.35, e:0.4},
  build(){ const g = new THREE.Group(), U = -86, V = -61, K = kit(U, V), {B, L, box, face, quadF} = K;
    const hall = (u0, u1, v0, v1, H, pitch) => { K.plinth(u0 - 0.5, u1 + 0.5, v0 - 0.5, v1 + 0.5, 5, 0.6); box(C.wall, u0, u1, 0.6, H, v0, v1);
      for (const side of ['u-', 'u+', 'v-', 'v+']){ const fc = face([u0, u1, v0, v1], side); K.windows(fc, 0, fc.len, [[0.6, 4.2], [4.8, 4.6]], 4.2, {ww:0.8, wh:2.6, sill:1.0});
        quadF(C.trim, fc.F, -0.1, fc.len + 0.1, 4.7, 5.0, 0.1); quadF(C.trim, fc.F, -0.15, fc.len + 0.15, H - 0.5, H, 0.12); }
      return K.hip(u0, u1, v0, v1, H, pitch, 1.2); };
    hall(-96.3, -76.8, -30.4, -6.2, 12.4, 0.5);                 // Lecture Theatres
    hall(-93.0, -72.6, -91.2, -51.4, 11.8, 0.5);                // Multipurpose Auditorium
    // Moot Court: an octagonal-ish chamber with a pyramidal roof and a lantern
    { const cu = -87.8, cv = -104.7, cx = cu - U, cz = V - cv; latheP(B.p(C.base), [[11.6, -5], [11.6, 0.6]], cx, cz, 8, PI/8);
      latheP(B.p(C.wall), [[11.2, 0.6], [11.2, 9.6]], cx, cz, 8, PI/8);
      for (let i = 0; i < 8; i++){ const a = (i + 0.5)/8*TAU, c = Math.cos(a), s = Math.sin(a), R = 10.4*1.0;
        for (const [y0, y1] of [[1.6, 4.0], [5.4, 8.4]]) Q(B.p(C.win), [cx + c*R - s*1.2, y0, cz + s*R + c*1.2], [cx + c*R + s*1.2, y0, cz + s*R - c*1.2], [cx + c*R + s*1.2, y1, cz + s*R - c*1.2], [cx + c*R - s*1.2, y1, cz + s*R + c*1.2]); }
      latheP(B.p(C.trim), [[11.25, 9.6], [12.4, 9.7], [12.4, 10.0]], cx, cz, 8, PI/8);
      latheP(B.p(C.roof), [[12.4, 10.0], [2.2, 14.2], [2.2, 14.3]], cx, cz, 8, PI/8);
      latheP(B.p(C.wall), [[2.0, 14.2], [2.0, 15.6]], cx, cz, 8, PI/8); latheP(B.p(C.roof), [[2.5, 15.6], [0.1, 16.8]], cx, cz, 8, PI/8); }
    B.flush(g); return g; }};
// ---------- placements: key origin (u0, v0) in the campus grid → lat / lon ----------
{ const at = (u, v) => { const x = u*UX + v*UZ, z = u*UZ - v*UX; return {lat:+(1.3188 - z/110574).toFixed(6), lon:+(103.8176 + x/111290.5).toFixed(6)}; };
  const rot = +ROT.toFixed(4);
  SG_PLACES.push(
    Object.assign({type:'nusbt'}, at(-20, -46), {rot}),
    Object.assign({type:'nusbt_oth'}, at(-12.5, 75), {rot}),
    Object.assign({type:'nusbt_lib'}, at(39, 43.5), {rot}),
    Object.assign({type:'nusbt_lks'}, at(-76, 40), {rot}),
    Object.assign({type:'nusbt_lt'}, at(-86, -61), {rot})); }
}
