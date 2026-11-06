// ======================================================================================================
// City Brush lm40 — group sg40f (the West): Jurong Lake Gardens (Lakeside Garden, Japanese Garden sites), Jurong Town Hall,
// one-north (Fusionopolis One, Biopolis, The Star Vista, Mediacorp Campus), Pasir Panjang Power Station, the Former Ford
// Factory, the Former Bukit Timah Railway Station and its truss bridge, and the Malaysia–Singapore Second Link.
// Every plan is the real OSM footprint (ref_sg40f.json, local metres +x east, +z south around the ref anchor); models are
// placed with rot 0 (or the stated rot) and origin at the stated ref-local point. No text, logos or brand colours.
// ======================================================================================================
{
const PI = Math.PI, HP = PI/2;
const RD = __DATA__;
const SD = __SITES__;
// ---------- helpers ----------
const plc = (key, A, ox, oz, rot) => SG_PLACES.push({type:key, lat:+(A[0] - oz/110574).toFixed(7), lon:+(A[1] + ox/111290.5).toFixed(7), rot:rot || 0});
const sub = (ring, ox, oz) => ring.map(p => [p[0] - ox, p[1] - oz]);
const sArea = R => { let a = 0; for (let i = 0; i < R.length; i++){ const p = R[i], q = R[(i+1) % R.length]; a += p[0]*q[1] - q[0]*p[1]; } return a/2; };
const cen = R => { let a = 0, cx = 0, cz = 0; for (let i = 0; i < R.length; i++){ const p = R[i], q = R[(i+1) % R.length], f = p[0]*q[1] - q[0]*p[1]; a += f; cx += (p[0] + q[0])*f; cz += (p[1] + q[1])*f; } return [cx/(3*a), cz/(3*a)]; };
// outward normal of edge i of ring R
const nrm = (R, i) => { const p = R[i], q = R[(i+1) % R.length], dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz) || 1, s = sArea(R) > 0 ? 1 : -1; return [s*dz/l, -s*dx/l]; };
// polygon offset by d (miter, clamped) — for near-convex rings
const offR = (R, d) => R.map((p, i) => { const a = nrm(R, (i - 1 + R.length) % R.length), b = nrm(R, i); let mx = a[0] + b[0], mz = a[1] + b[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml; const c = Math.max(0.5, mx*b[0] + mz*b[1]); return [p[0] + mx*d/c, p[1] + mz*d/c]; });
// batched boxes: A = flat triangle array; box L (local x) x H x W (local z), base y0, rotated ry like three.js rotation.y
function bxT(A, cx, y0, cz, L, H, W, ry){
  const c = Math.cos(ry || 0), s = Math.sin(ry || 0), hx = L/2, hz = W/2, y1 = y0 + H;
  const P = (x, z) => [cx + x*c + z*s, cz - x*s + z*c];
  const q = [P(-hx, -hz), P(hx, -hz), P(hx, hz), P(-hx, hz)];
  const v = (k, y) => [q[k][0], y, q[k][1]];
  const quad = (a, b, cc, d) => A.push(...a, ...b, ...cc, ...a, ...cc, ...d);
  for (let k = 0; k < 4; k++){ const k2 = (k + 1) % 4; quad(v(k, y0), v(k2, y0), v(k2, y1), v(k, y1)); }
  quad(v(0, y1), v(1, y1), v(2, y1), v(3, y1)); quad(v(0, y0), v(3, y0), v(2, y0), v(1, y0));
}
// a thin box between two plan points (a wall / band / beam along an edge), offset o along the outward normal n
function segT(A, x0, z0, x1, z1, y0, H, W, o, n){ const nx = n ? n[0]*o : 0, nz = n ? n[1]*o : 0, L = Math.hypot(x1 - x0, z1 - z0); if (L < 0.05) return;
  bxT(A, (x0 + x1)/2 + nx, y0, (z0 + z1)/2 + nz, L, H, W, Math.atan2(-(z1 - z0), x1 - x0)); }
const quadT = (A, a, b, c, d) => A.push(...a, ...b, ...c, ...a, ...c, ...d);
const flush = (g, A, col) => { if (A.length) LTris(g, A, col); };
// generic facade on a ring: floor bands every fh from y0 to y1, mullions every cw, both batched
function facade(Ab, Am, R, y0, y1, fh, cw, bh, md, o){
  for (let i = 0; i < R.length; i++){
    const p = R[i], q = R[(i+1) % R.length], n = nrm(R, i), L = Math.hypot(q[0] - p[0], q[1] - p[1]); if (L < 1.5) continue;
    if (Ab) for (let y = y0 + fh; y < y1 - 0.5; y += fh) segT(Ab, p[0], p[1], q[0], q[1], y - bh/2, bh, 0.3, (o || 0) + 0.15, n);
    if (Am){ const k = Math.max(1, Math.round(L/cw)); for (let j = 1; j < k; j++){ const t = j/k, x = p[0] + (q[0] - p[0])*t, z = p[1] + (q[1] - p[1])*t; bxT(Am, x + n[0]*((o || 0) + md/2), y0, z + n[1]*((o || 0) + md/2), 0.22, y1 - y0, md, Math.atan2(-(q[1] - p[1]), q[0] - p[0])); } }
  }
}
// a flat roof plate with a parapet
function roofP(g, R, y, col, pcol, ph){ LPoly(g, R, y - 0.4, 0.4, col); if (pcol){ const A = []; for (let i = 0; i < R.length; i++){ const p = R[i], q = R[(i+1) % R.length]; segT(A, p[0], p[1], q[0], q[1], y, ph || 1.1, 0.35, -0.18, nrm(R, i)); } flush(g, A, pcol); } }
// rooftop plant boxes inside a ring (deterministic positions from the rng)
function plant(g, R, y, n, col, rng){ const c = cen(R); let bx = 1e9, Bx = -1e9, bz = 1e9, Bz = -1e9; for (const p of R){ bx = Math.min(bx, p[0]); Bx = Math.max(Bx, p[0]); bz = Math.min(bz, p[1]); Bz = Math.max(Bz, p[1]); }
  const pip = (x, z) => { let ins = false; for (let i = 0, j = R.length - 1; i < R.length; j = i++){ const a = R[i], b = R[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0])*(z - a[1])/(b[1] - a[1]) + a[0]) ins = !ins; } return ins; };
  const A = []; let k = 0;
  for (let t = 0; t < n*8 && k < n; t++){ const x = c[0] + (rng() - 0.5)*(Bx - bx)*0.6, z = c[1] + (rng() - 0.5)*(Bz - bz)*0.6; if (!pip(x, z)) continue; bxT(A, x, y, z, 3 + rng()*5, 1.8 + rng()*2, 2.5 + rng()*4, 0); k++; }
  flush(g, A, col); }
const pipR = (R, x, z) => { let ins = false; for (let i = 0, j = R.length - 1; i < R.length; j = i++){ const a = R[i], b = R[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0])*(z - a[1])/(b[1] - a[1]) + a[0]) ins = !ins; } return ins; };

// ======================================================================================================
// ★ Jurong Town Hall (Lim Chong Keat / Architects Team 3, 1971-74; national monument 2015) — w96764520
// Two elongated, staggered five-storey blocks with chamfered ends (longer block ≈ 140 m = "460 ft"), the upper floors sloping
// outwards, window fins for sun shading, off-white brutalist concrete; the clock tower (58 m, NHB) rises from the roof of the
// building on the long south-west side with the digital "score board" clock face on its south-west elevation and a small
// viewing platform on top; the VIP penthouse on the longer block. Frame: rot = −33.76° so local +x runs along the blocks
// (ESE) and local +z points south-west (the clock-tower side). Origin = footprint centroid.
// ======================================================================================================
{
const A0 = RD.sgjurongtownhall.a, RING = RD.sgjurongtownhall.b.w96764520.r, AX = [0.8313574, 0.55573813], NX = [-AX[1], AX[0]];
const ROT = -Math.atan2(AX[1], AX[0]);
const UV = RING.map(p => [p[0]*AX[0] + p[1]*AX[1], p[0]*NX[0] + p[1]*NX[1]]);
// the two blocks (indices into UV): north-east block 0..14 (closing through the middle), south-west block 14..23 + 0
const BN = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(i => UV[i]);
const BS = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map(i => UV[i]);
LANDMARKS.sgjurongtownhall = {zh:'裕廊镇大会堂', en:'Jurong Town Hall (Trade Association Hub)', cat:'old', r:90, h:58,
  lt:{m:0, c:'#ffe6c2', k:0.55, e:0.6, anim:'breathe'},
  build(){
    const g = new THREE.Group(), rng = LMCTX.rng;
    const CON = '#e4dfd3', CON2 = '#d6d0c2', GL = {c:'#3e4954', m:1, fh:4.2, cw:2.0, lk:0.9}, DK = '#2b3036', FIN = '#ece8dc';
    const H0 = 4.6, FH = 4.2, NF = 4, RT = H0 + FH*NF, OUT = 2.4;     // ground floor, four sloping upper floors, roof at 21.4 m
    for (const B of [BN, BS]){
      // foundation / lower ground on the slope
      LPoly(g, offR(B, -1.2), -6, 6 + H0, DK);
      LPoly(g, offR(B, -1.2), -6, 1.2, CON2);
      // ground-floor columns along the edges (recessed glazing behind)
      const Ac = []; for (let i = 0; i < B.length; i++){ const p = B[i], q = B[(i+1) % B.length], L = Math.hypot(q[0] - p[0], q[1] - p[1]), n = nrm(B, i), k = Math.max(1, Math.round(L/7.5));
        for (let j = 0; j <= k; j++){ const t = j/k, x = p[0] + (q[0] - p[0])*t - n[0]*0.6, z = p[1] + (q[1] - p[1])*t - n[1]*0.6; bxT(Ac, x, 0, z, 1.1, H0, 1.1, 0); } }
      flush(g, Ac, CON);
      // sloping upper floors: lofted outward, each floor a glazed band under a concrete spandrel that leans out
      const secs = [], Ab = [], Af = [], Ag = [];
      for (let f = 0; f <= NF; f++){ const y = H0 + FH*f, d = OUT*f/NF; secs.push(offR(B, d).map(p => [p[0], y, p[1]])); }
      // glazing skin slightly inside, spandrel bands outside
      for (let f = 0; f < NF; f++){
        const ya = H0 + FH*f, yb = ya + FH, Ra = offR(B, OUT*f/NF - 0.35), Rb = offR(B, OUT*(f + 1)/NF - 0.35);
        for (let i = 0; i < B.length; i++){ const j = (i + 1) % B.length; quadT(Ag, [Ra[i][0], ya, Ra[i][1]], [Ra[j][0], ya, Ra[j][1]], [Rb[j][0], yb, Rb[j][1]], [Rb[i][0], yb, Rb[i][1]]); }
        // spandrel: the lower 1.5 m of each floor, a leaning concrete band
        const Rs = offR(B, OUT*(f + 0.4)/NF), Rt = offR(B, OUT*f/NF);
        for (let i = 0; i < B.length; i++){ const j = (i + 1) % B.length; quadT(Ab, [Rt[i][0], ya - 0.2, Rt[i][1]], [Rt[j][0], ya - 0.2, Rt[j][1]], [Rs[j][0], ya + 1.6, Rs[j][1]], [Rs[i][0], ya + 1.6, Rs[i][1]]); }
        // vertical sun-shading fins on the window band, every 2.0 m, leaning with the wall
        const Rf0 = offR(B, OUT*(f + 0.4)/NF + 0.05), Rf1 = offR(B, OUT*(f + 1)/NF + 0.05);
        for (let i = 0; i < B.length; i++){ const j = (i + 1) % B.length, L = Math.hypot(B[j][0] - B[i][0], B[j][1] - B[i][1]), n = nrm(B, i), k = Math.max(1, Math.round(L/2.0));
          for (let m = 1; m < k; m++){ const t = m/k, a = [Rf0[i][0] + (Rf0[j][0] - Rf0[i][0])*t, ya + 1.6, Rf0[i][1] + (Rf0[j][1] - Rf0[i][1])*t], b = [Rf1[i][0] + (Rf1[j][0] - Rf1[i][0])*t, yb - 0.2, Rf1[i][1] + (Rf1[j][1] - Rf1[i][1])*t];
            quadT(Af, a, b, [b[0] + n[0]*0.9, b[1], b[2] + n[1]*0.9], [a[0] + n[0]*0.9, a[1], a[2] + n[1]*0.9]); } }
      }
      flush(g, Ag, GL); flush(g, Ab, CON); flush(g, Af, FIN);
      // floor slabs (inside the skin) and the roof with its deep parapet
      LPoly(g, offR(B, OUT - 0.3), RT - 0.4, 0.4, CON2);
      const Ap = []; const Rr = offR(B, OUT + 0.1); for (let i = 0; i < Rr.length; i++){ const p = Rr[i], q = Rr[(i+1) % Rr.length]; segT(Ap, p[0], p[1], q[0], q[1], RT - 0.6, 2.2, 0.5, -0.25, nrm(Rr, i)); } flush(g, Ap, CON);
      // the concourse roof light / plant on the roofs
      plant(g, offR(B, -6), RT, 6, CON2, rng);
    }
    // the bridge floors between the two blocks (concourse / conference hall): a lower glazed link with a roof light
    { const Ab = []; bxT(Ab, -2, 0, 0, 80, RT - 4, 6, 0); flush(g, Ab, CON2); LBox(g, 30, 3.0, 8, -8, RT - 4, 0, {c:'#9fb4c4', op:0.75, glow:'#ffe2b0', gk:0.35}); }
    // the VIP penthouse on the longer (south-west) block, with its roofed terrace
    { const y = RT + 1.6; LBox(g, 30, 3.6, 11, -10, y, 16, GL); LBox(g, 36, 0.6, 16, -10, y + 3.6, 16, CON); const Ac = []; for (let x = -27; x <= 7; x += 4) for (const z of [9, 23]) bxT(Ac, x, y, z, 0.4, 3.6, 0.4, 0); flush(g, Ac, CON); }
    // ★ the clock tower: a staircase shaft rising from the roof to 58 m on the south-west (local +z) side
    { const tx = 14, tz = 22, W = 7.5, D = 6.0, TOP = 58;
      LBox(g, W, TOP - 4, D, tx, 0, tz, CON);
      const Af = []; for (let k = -2; k <= 2; k++) bxT(Af, tx + k*1.45, RT, tz + D/2 + 0.35, 0.3, TOP - 12 - RT, 0.7, 0); flush(g, Af, FIN);   // vertical fins on the south-west face
      for (let k = -1; k <= 1; k++) LBox(g, 0.25, TOP - 12 - RT, 0.6, tx - W/2 - 0.3, RT, tz + k*1.8, FIN);
      // the digital "score board" clock face (abstract lit segments, no numerals) on the south-west elevation
      LBox(g, W - 0.6, 6.4, 0.4, tx, TOP - 11.5, tz + D/2 + 0.2, DK);
      const As = []; for (let k = 0; k < 4; k++){ const cx = tx - 2.7 + k*1.8 + (k > 1 ? 0.25 : 0); bxT(As, cx, TOP - 10.6, tz + D/2 + 0.45, 1.1, 0.22, 0.1, 0); bxT(As, cx, TOP - 8.0, tz + D/2 + 0.45, 1.1, 0.22, 0.1, 0); bxT(As, cx, TOP - 5.6, tz + D/2 + 0.45, 1.1, 0.22, 0.1, 0); bxT(As, cx - 0.55, TOP - 10.4, tz + D/2 + 0.45, 0.2, 4.6, 0.1, 0); bxT(As, cx + 0.55, TOP - 10.4, tz + D/2 + 0.45, 0.2, 4.6, 0.1, 0); }
      flush(g, As, {c:'#d9a54a', glow:'#ffb648', gk:1.6});
      // lift motor room and the small viewing platform on top
      LBox(g, W + 0.8, 1.0, D + 0.8, tx, TOP - 5, tz, CON2); LBox(g, W - 2, 3.0, D - 1.5, tx, TOP - 4, tz, CON);
      LBox(g, W + 1.2, 0.35, D + 1.2, tx, TOP - 1.0, tz, CON2);
      const Ar = []; for (const [x0, z0, x1, z1] of [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]]) segT(Ar, tx + x0*(W/2 + 0.5), tz + z0*(D/2 + 0.5), tx + x1*(W/2 + 0.5), tz + z1*(D/2 + 0.5), TOP - 0.65, 0.65, 0.08, 0); flush(g, Ar, DK);
      LCyl(g, 0.25, 0.25, 0.6, tx, TOP - 0.1, tz, {c:'#c22', glow:'#ff2a1a', gk:2}, 6); }
    // entrance steps / ramp on the north-west end (conference hall backstage side)
    LBox(g, 10, 1.2, 22, -68, -0.8, 0, CON2);
    return g;
  }};
plc('sgjurongtownhall', A0, 0, 0, ROT);
}

// ======================================================================================================
// ★ Fusionopolis One (Kisho Kurokawa, 2008; Connexis North / Connexis South / Symbiosis) — w175841411 + its 3 tower parts
// Three towers of translucent blue-white glass (CTBUH: Symbiosis 134 m / 24 fl, Connexis North 134 m / 22 fl, Connexis South
// 123 m / 22 fl — the OSM parts give 73–80 m; which part is which tower is an assumption: south-west = Connexis South,
// north = Connexis North, south-east = Symbiosis), structural glazing with metal cover bars, cantilever transfer trusses
// every seven floors (no ground columns under the towers), open central cores, roof gardens, glazed sky bridges between the
// towers (levels approximate), and the silver ovoid Genexis theatre floating between the towers at about five storeys.
// Origin = the ref anchor (rot 0).
// ======================================================================================================
{
const D0 = RD.sgfusionopolis, A0 = D0.a, B0 = D0.b.w175841411, PARTS = B0.p.map(p => p[2]);
LANDMARKS.sgfusionopolis = {zh:'启汇城', en:'Fusionopolis One', cat:'new', r:80, h:134,
  lt:{m:1, c:'#e6f0ff', k:0.8, fh:4.6, cw:2.4},
  build(){
    const g = new THREE.Group(), rng = LMCTX.rng;
    const GL = {c:'#8fb3cf', m:1, fh:4.6, cw:2.4}, GL2 = {c:'#a9c4d8', m:1, fh:4.6, cw:2.4}, WH = {c:'#eef1f3', m:0, lk:0.25}, PODG = {c:'#5f7484', m:1, fh:4.5, cw:3}, MET = '#c9cfd4', GRN = '#5f8a4a', DK = '#3b434a';
    // podium (retail + MRT link): the whole footprint to 18 m, glazed shopfronts, white bands
    const R0 = B0.r; LPoly(g, R0, -5, 5, DK); LPoly(g, R0, 0, 17.6, PODG);
    { const Ab = [], Am = []; facade(Ab, Am, R0, 0, 17.6, 4.4, 6, 0.8, 0.4, 0); flush(g, Ab, WH); flush(g, Am, WH); }
    roofP(g, R0, 18.0, '#b9bec2', WH, 1.1);
    // roof garden on the podium
    LPoly(g, offR(R0, -2), 18.0, 0.5, GRN);
    const HT = [123, 134, 134];
    PARTS.forEach((P, ti) => {
      const H = HT[ti], col = ti === 1 ? GL2 : GL;
      LPoly(g, P, 18, H - 18 - 4, col);
      // white structural frame: floor bands every 4.6 m, mullions every 2.4 m (metal cover bars)
      const Ab = [], Am = [], At = [];
      facade(Ab, Am, P, 18, H - 4, 4.6, 2.4, 0.35, 0.25, 0);
      // transfer-truss storeys every seven floors: deep white bands with diagonals
      for (let lv = 1; lv <= 3; lv++){ const y = 18 + lv*7*4.6; if (y > H - 10) break;
        for (let i = 0; i < P.length; i++){ const p = P[i], q = P[(i+1) % P.length], n = nrm(P, i), L = Math.hypot(q[0] - p[0], q[1] - p[1]); if (L < 3) continue;
          segT(At, p[0], p[1], q[0], q[1], y - 1.4, 0.9, 0.5, 0.35, n); segT(At, p[0], p[1], q[0], q[1], y + 2.6, 0.9, 0.5, 0.35, n);
          const k = Math.max(1, Math.round(L/9)); for (let j = 0; j < k; j++){ const t0 = j/k, t1 = (j + 1)/k, xa = p[0] + (q[0] - p[0])*t0 + n[0]*0.45, za = p[1] + (q[1] - p[1])*t0 + n[1]*0.45, xb = p[0] + (q[0] - p[0])*t1 + n[0]*0.45, zb = p[1] + (q[1] - p[1])*t1 + n[1]*0.45;
            const up = j % 2 ? [y - 0.5, y + 2.6] : [y + 2.6, y - 0.5]; quadT(At, [xa, up[0], za], [xb, up[1], zb], [xb, up[1] + 0.8, zb], [xa, up[0] + 0.8, za]); } } }
      flush(g, Ab, WH); flush(g, Am, WH); flush(g, At, WH);
      // crown: set-back glazed plant level and a white roof frame, roof garden
      const Pi = offR(P, -1.5); LPoly(g, Pi, H - 4, 3.2, {c:'#c9d8e4', m:0, lk:0.6});
      roofP(g, P, H - 0.8, '#d9dde0', WH, 0.9); LPoly(g, offR(P, -3.5), H - 0.8, 0.6, GRN);
      LCyl(g, 0.3, 0.3, 1.0, cen(P)[0], H - 0.2, cen(P)[1], {c:'#c22', glow:'#ff2a1a', gk:2}, 6);
    });
    // glazed sky bridges between the towers (approximate positions and levels)
    { const Ag = [], Aw = [];
      for (const [x0, z0, x1, z1, y] of [[-17.5, 7, -2, 13.5, 64], [-17.5, 4, -2, 11, 96], [15, -19, 18.5, 1.5, 78], [15, -19, 18.5, 1.5, 110]]){
        segT(Ag, x0, z0, x1, z1, y, 4.2, 4.5, 0); segT(Aw, x0, z0, x1, z1, y - 0.6, 0.6, 5.2, 0); segT(Aw, x0, z0, x1, z1, y + 4.2, 0.5, 5.2, 0); }
      flush(g, Ag, {c:'#bcd3e2', m:1, fh:4.2, cw:1.8, op:0.85}); flush(g, Aw, WH); }
    // the silver ovoid Genexis theatre between the towers (~five storeys up), on two splayed legs
    { const S = LSph(g, 1, 6, 26, -4, {c:'#c8cdd2', m:0, lc:'#dfe8ff', lk:0.9}, 1, 24); S.scale.set(13, 8.5, 10); S.rotation.y = 0.6;
      LBeam(g, [2, 18, -3], [4, 19.5, -4], 0.8, MET); LBeam(g, [10, 18, -5], [8, 19.5, -4], 0.8, MET); }
    return g;
  }};
plc('sgfusionopolis', A0, 0, 0, 0);
}

// ======================================================================================================
// Biopolis Phase 1 (2003-04, Zaha Hadid masterplan): seven research blocks of 8-13 storeys linked by sky bridges. Each block
// is its own key on its real footprint so no hull reaches over Biopolis Way / Biopolis Street (secondary keys label:false).
// Heights: storeys × ~3.9 m within the stated 8-13 storey range (Helios the tallest). Glass curtain walls with white
// aluminium frames, plant levels. Sky bridges are drawn only between adjacent blocks at upper levels (levels approximate).
// ======================================================================================================
{
const D0 = RD.sgbiopolis, A0 = D0.a;
const BLK = [
  ['sgbiopolis', 'w168243409', '启奥城', 'Biopolis', 13, '#7fa2b8'],                 // Helios
  ['sgbiopolis_chromos', 'w168243403', '启奥城·Chromos', 'Biopolis — Chromos', 8, '#86a7a6'],
  ['sgbiopolis_centros', 'w168243410', '启奥城·Centros', 'Biopolis — Centros', 9, '#8aa6bd'],
  ['sgbiopolis_nanos', 'w168243411', '启奥城·Nanos', 'Biopolis — Nanos', 9, '#7b9db4'],
  ['sgbiopolis_matrix', 'w168243404', '启奥城·Matrix', 'Biopolis — Matrix', 10, '#86a3a9'],
  ['sgbiopolis_genome', 'w168243405', '启奥城·Genome', 'Biopolis — Genome', 8, '#8ca9bd'],
  ['sgbiopolis_proteos', 'w168243407', '启奥城·Proteos', 'Biopolis — Proteos', 8, '#7fa0b0']];
// sky bridges (ref-local endpoints between facing edges, owner key, level y)
const BRG = {sgbiopolis:[[-14, -28, -4, 6, 30], [-36, -45, -50, -22, 26]], sgbiopolis_centros:[[17, 10, 50, -12, 30], [22, 20, 56, 44, 34]], sgbiopolis_matrix:[[56, 86, 62, 118, 26]]};
for (const [key, osm, zh, en, NF, gc] of BLK){
  const R = D0.b[osm].r, C = cen(R), P = sub(R, C[0], C[1]), FH = 3.9, H = 5.0 + NF*FH;
  let rm = 0; for (const p of P) rm = Math.max(rm, Math.hypot(p[0], p[1]));
  const br = (BRG[key] || []).map(b => [b[0] - C[0], b[1] - C[1], b[2] - C[0], b[3] - C[1], b[4]]);
  for (const b of br) rm = Math.max(rm, Math.hypot(b[2], b[3]) + 3);
  LANDMARKS[key] = {zh, en, cat:'new', r:Math.ceil(rm + 3), h:H + 3, label:key === 'sgbiopolis' ? undefined : false,
    lt:{m:1, c:'#e8f1ff', k:0.75, fh:FH, cw:2.6},
    build(){
      const g = new THREE.Group(), rng = LMCTX.rng, WH = {c:'#e9edf0', m:0, lk:0.2}, GLc = {c:gc, m:1, fh:FH, cw:2.6};
      LPoly(g, P, -5, 5, '#4c565d');
      // glazed ground floor (recessed) with columns, then the curtain-wall body
      LPoly(g, offR(P, -1.5), 0, 5.0, {c:'#4f6270', m:1, fh:5, cw:4});
      const Ac = []; for (let i = 0; i < P.length; i++){ const p = P[i], q = P[(i+1) % P.length], L = Math.hypot(q[0] - p[0], q[1] - p[1]), k = Math.max(1, Math.round(L/8)); for (let j = 0; j < k; j++){ const t = j/k; bxT(Ac, p[0] + (q[0] - p[0])*t, 0, p[1] + (q[1] - p[1])*t, 0.9, 5.0, 0.9, 0); } } flush(g, Ac, WH);
      LPoly(g, P, 5.0, H - 5.0, GLc);
      const Ab = [], Am = []; facade(Ab, Am, P, 5.0, H, FH, 1.8, 0.55, 0.22, 0); flush(g, Ab, WH); flush(g, Am, WH);
      // roof: parapet, set-back plant level with louvres
      roofP(g, P, H, '#c7ccd0', WH, 1.2); const Pi = offR(P, -4); if (Math.abs(sArea(Pi)) > 80){ LPoly(g, Pi, H, 3.0, '#b7bec4'); const Al = []; facade(Al, null, Pi, H, H + 3, 0.5, 9, 0.12, 0.1, 0); flush(g, Al, '#9aa3aa'); }
      plant(g, offR(P, -5), H + (Math.abs(sArea(Pi)) > 80 ? 3 : 0), 4, '#aab2b8', rng);
      // sky bridges to the neighbouring blocks
      if (br.length){ const Ag = [], Aw = []; for (const b of br){ segT(Ag, b[0], b[1], b[2], b[3], b[4], 3.6, 3.6, 0); segT(Aw, b[0], b[1], b[2], b[3], b[4] - 0.6, 0.6, 4.2, 0); segT(Aw, b[0], b[1], b[2], b[3], b[4] + 3.6, 0.4, 4.2, 0); }
        flush(g, Ag, {c:'#b9d0de', m:1, fh:3.6, cw:2.0}); flush(g, Aw, WH); }
      return g;
    }};
  plc(key, A0, C[0], C[1], 0);
}
}

// ======================================================================================================
// ★ The Star Vista & The Star Performing Arts Centre (Aedas / Andrew Bromberg, 2012) — w104352121 and its 14 OSM parts
// 15 levels (Mott MacDonald), ~16 storeys (Architect Magazine): three retail levels as open terraces, the 5,000-seat theatre
// box held aloft on a forest of columns above them, the sculpted, sliced shell with its sharply defined lines of light at
// night, the 33 m open entrance foyer with the glass canopy and the inward-curved glass screen on the east, the outdoor
// amphitheatre five floors up. OSM part heights (max 40.2 m) are scaled ×1.4 to the 15 levels (top ≈ 56 m, an estimate).
// Origin = the ref anchor (rot 0).
// ======================================================================================================
{
const D0 = RD.sgstarvista, A0 = D0.a, B0 = D0.b.w104352121, VS = 1.4;
LANDMARKS.sgstarvista = {zh:'星宇表演艺术中心（星宇坊）', en:'The Star Vista & Star Performing Arts Centre', cat:'new', r:96, h:57,
  lt:{m:1, c:'#ffeccc', k:0.6, fh:4.2, cw:3},
  build(){
    const g = new THREE.Group(), rng = LMCTX.rng;
    const SHELL = {c:'#646a70', m:0, lk:0.15}, SHELL2 = {c:'#8a9096', m:0, lk:0.15}, LINE = {c:'#d8dde2', glow:'#f2f6ff', gk:1.1}, SHOP = {c:'#4f5a63', m:1, fh:4.2, cw:3.5}, GRN = '#5d8a48', TER = '#c9c3b6', COL = '#cfd2d4';
    const R0 = B0.r; LPoly(g, R0, -5, 5, '#4a4f54'); LPoly(g, offR(R0, -1.0), 0, 4.6, SHOP);
    const parts = B0.p.map(p => ({b:p[1]*VS > 50 ? 41.6 : p[0]*VS, t:p[1]*VS, r:p[2]})).sort((a, b) => a.b - b.b);
    const Al = [], Ag = [];
    for (const p of parts){
      const h = p.t - p.b; if (h < 0.5) continue;
      if (p.t <= 25){ // retail terraces: glazed shopfronts set back, terrace slab with planting at the edge
        LPoly(g, offR(p.r, -1.2), p.b, h - 0.6, SHOP); LPoly(g, p.r, p.t - 0.6, 0.6, TER);
        for (let i = 0; i < p.r.length; i++){ const a = p.r[i], b = p.r[(i+1) % p.r.length]; segT(Ag, a[0], a[1], b[0], b[1], p.t, 0.9, 1.4, -0.9, nrm(p.r, i)); }
      } else {        // the theatre box and the roof hall: the sculpted shell with horizontal sliced bands (lit lines at night)
        LPoly(g, p.r, p.b, h, p.t > 50 ? SHELL2 : SHELL);
        for (let y = p.b + 2.2; y < p.t - 0.5; y += 2.8) for (let i = 0; i < p.r.length; i++){ const a = p.r[i], b = p.r[(i+1) % p.r.length]; if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 4) continue; segT(Al, a[0], a[1], b[0], b[1], y, 0.18, 0.12, 0.08, nrm(p.r, i)); }
        // edge lines: the "sharply defined lines of light" tracing the top edges of the shell
        for (let i = 0; i < p.r.length; i++){ const a = p.r[i], b = p.r[(i+1) % p.r.length]; segT(Al, a[0], a[1], b[0], b[1], p.t - 0.25, 0.3, 0.3, 0.1, nrm(p.r, i)); }
      }
    }
    flush(g, Ag, GRN); flush(g, Al, LINE);
    // the forest of canted columns under the theatre box (inside the footprint)
    { const Ac = []; for (let k = 0; k < 30; k++){ const x = -55 + rng()*95, z = -38 + rng()*80; if (!pipR(R0, x, z)) continue; LBeam(g, [x, 4.6, z], [x + (rng() - 0.5)*4, 23, z + (rng() - 0.5)*4], 0.55, COL, 6); } }
    // the east entrance: 33 m open foyer behind an inward-curved glass screen, under a glass canopy, with monumental columns
    { const pts = []; for (let i = 0; i <= 10; i++){ const t = i/10, z = -38 + 66*t, x = 66 + 8*Math.sin(t*PI) - 4; pts.push([x, z]); }
      const Ag2 = []; for (let i = 0; i < pts.length - 1; i++){ const a = pts[i], b = pts[i+1]; quadT(Ag2, [a[0], 0, a[1]], [b[0], 0, b[1]], [b[0] - 3, 33, b[1]], [a[0] - 3, 33, a[1]]); }
      flush(g, Ag2, {c:'#a6bccb', m:1, fh:4.5, cw:2.2, op:0.7});
      for (const z of [-30, -12, 8, 24]) LCyl(g, 1.0, 1.3, 33, 72, 0, z, COL, 10);
      LBox(g, 18, 0.6, 76, 76, 33, -5, {c:'#c4d6e0', op:0.7, ds:true}); }
    // the outdoor amphitheatre five floors up on the west terraces: stepped seating
    for (let k = 0; k < 6; k++) LBox(g, 26 - k*2.4, 0.5, 2.2, -48, 21 + k*0.5, 8 + k*2.2, TER);
    return g;
  }};
plc('sgstarvista', A0, 0, 0, 0);
}

// ======================================================================================================
// Mediacorp Campus (Maki and Associates + DP Architects, 2015) — w352920078
// A 12-storey, ~225 m long building on the oblong site: the Broadcast Theatre (1,549 seats) and the Broadcast Centre below,
// the Corporate Office hovering above them around its four-storey atrium; bead-blasted, semi-reflective stainless-steel
// facade (silver by day). Height ≈ 12 storeys × 4.4 m = 53 m (estimate; OSM has no height). Origin = footprint centroid.
// ======================================================================================================
{
const D0 = RD.sgmediacorp, A0 = D0.a, R = D0.b.w352920078.r, C = cen(R), P = sub(R, C[0], C[1]);
LANDMARKS.sgmediacorp = {zh:'新传媒大厦', en:'Mediacorp Campus', cat:'new', r:135, h:53,
  lt:{m:1, c:'#eaf2ff', k:0.7, fh:4.4, cw:3.0},
  build(){
    const g = new THREE.Group(), rng = LMCTX.rng;
    const SS = {c:'#b9bec3', m:0, lk:0.35}, SS2 = {c:'#a7adb2', m:0, lk:0.3}, GL = {c:'#7f8c96', m:1, fh:4.4, cw:3.0}, DK = '#3e454b';
    LPoly(g, P, -6, 6, DK);
    LPoly(g, offR(P, -2.0), 0, 6.0, {c:'#5b6874', m:1, fh:6, cw:4});
    // the broadcast podium (theatre + broadcast centre) and the office floating above, both in stainless steel with window strips
    LPoly(g, P, 6.0, 25, SS2); LPoly(g, offR(P, 0.8), 31.0, 21.5, SS);
    const Aw = [], Ab = [];
    for (let y = 9; y < 52; y += 4.4){ if (y > 29 && y < 33) continue; const Rr = y > 31 ? offR(P, 0.85) : offR(P, 0.05);
      for (let i = 0; i < Rr.length; i++){ const a = Rr[i], b = Rr[(i+1) % Rr.length]; segT(Aw, a[0], a[1], b[0], b[1], y, 1.25, 0.08, 0.05, nrm(Rr, i)); } }
    flush(g, Aw, GL);
    { const Am = []; facade(null, Am, offR(P, 0.8), 31.0, 52.5, 4.4, 3.0, 0, 0.25, 0); facade(null, Am, offR(P, 0.0), 6.0, 31.0, 4.4, 6.0, 0, 0.25, 0); flush(g, Am, {c:'#cfd3d6', m:0, lk:0.3}); }
    // the recessed gap between podium and office (a shadow line)
    { const Ag = []; const Rr = offR(P, -1.2); for (let i = 0; i < Rr.length; i++){ const a = Rr[i], b = Rr[(i+1) % Rr.length]; segT(Ag, a[0], a[1], b[0], b[1], 30.8, 0.4, 0.2, 0, nrm(Rr, i)); } flush(g, Ag, DK); }
    roofP(g, offR(P, 0.8), 52.5, '#c5c9cc', SS, 1.0); plant(g, offR(P, -8), 52.5, 10, '#9ea5ab', rng);
    return g;
  }};
plc('sgmediacorp', A0, C[0], C[1], 0);
}

// ======================================================================================================
// Pasir Panjang Power Station — the hall on OSM w765761861 ("Pasir Panjang Power Station B" in OSM; whether it is the 1953 'A'
// or the 1965 'B' is not certain). Fair-faced red brickwork with precast concrete trims, tall glazed windows with concrete
// vertical fins (Docomomo SG for 'A'), the cavernous turbine hall; the 235 ft chimneys were demolished in the 1990s and are not
// modelled. Hall height ~20 m (estimate). Origin = footprint centroid.
// ======================================================================================================
{
const D0 = RD.sgppps, A0 = D0.a, R = D0.b.w765761861.r, C = cen(R), P = sub(R, C[0], C[1]);
LANDMARKS.sgppps = {zh:'巴西班让发电站', en:'Pasir Panjang Power Station', cat:'old', r:74, h:21,
  lt:{m:0, c:'#ffd9a8', k:0.6, e:0.5, anim:'breathe'},
  build(){
    const g = new THREE.Group();
    const BR = '#9c4a33', BR2 = '#8a4130', TR = '#e3ddd0', GL = {c:'#3c4650', m:1, fh:5, cw:3.2}, RF = '#7d8084';
    LPoly(g, P, -5, 5, BR2); LPoly(g, P, 0, 19.5, BR);
    const Aw = [], Af = [], At = [];
    for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], n = nrm(P, i), L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 6) continue;
      const k = Math.floor(L/4.2); const ry = Math.atan2(-(b[1] - a[1]), b[0] - a[0]);
      for (let j = 0; j < k; j++){ const t = (j + 0.5)/k, x = a[0] + (b[0] - a[0])*t, z = a[1] + (b[1] - a[1])*t;
        bxT(Aw, x + n[0]*0.06, 3.0, z + n[1]*0.06, 2.4, 13.5, 0.1, ry);                 // tall glazed window
        bxT(Af, x + n[0]*0.5 + (b[0] - a[0])/L*1.55, 2.6, z + n[1]*0.5 + (b[1] - a[1])/L*1.55, 0.35, 14.3, 1.0, ry);   // concrete fin
        bxT(At, x + n[0]*0.15, 2.6, z + n[1]*0.15, 2.9, 0.4, 0.3, ry); }               // precast sill
      segT(At, a[0], a[1], b[0], b[1], 17.6, 0.6, 0.4, 0.2, n); segT(At, a[0], a[1], b[0], b[1], 19.5, 0.8, 0.5, 0.2, n); }
    flush(g, Aw, GL); flush(g, Af, TR); flush(g, At, TR);
    // roof: low-pitched metal roof with a long clerestory monitor along the hall
    LPoly(g, offR(P, -0.2), 20.3, 0.5, RF);
    plant(g, P, 20.8, 7, '#6c7378', LMCTX.rng);
    return g;
  }};
plc('sgppps', A0, C[0], C[1], 0);
}

// ======================================================================================================
// ★ Former Ford Factory (1941, Emile Brizay; national monument) — the preserved front block w243443837 (Upper Bukit Timah Road)
// Art Deco white facade, two storeys, the raised central entrance tower with vertical fins and flagpole, horizontal window
// bands with dark steel frames on the wings, flat roofs behind parapets. Only the front block survived (rear demolished 1997).
// Frame: local +x along the block (NNW), local +z = the east front towards the forecourt. Dimensions of the tower and the
// window bands are estimates from photos (not published). No people, no names.
// ======================================================================================================
{
const D0 = RD.sgfordfactory, A0 = D0.a, R = D0.b.w243443837.r, C = cen(R);
const ax = [R[0][0] - R[1][0], R[0][1] - R[1][1]], al = Math.hypot(ax[0], ax[1]), AX = [ax[0]/al, ax[1]/al];        // SSE -> NNW? R[1] is south
const ROT = Math.atan2(-AX[1], AX[0]) ;
const UV = R.map(p => { const q = [p[0] - C[0], p[1] - C[1]]; return [q[0]*AX[0] + q[1]*AX[1], -q[0]*AX[1] + q[1]*AX[0]]; });
let Lh = 0, Wh = 0; for (const p of UV){ Lh = Math.max(Lh, Math.abs(p[0])); Wh = Math.max(Wh, Math.abs(p[1])); }
LANDMARKS.sgfordfactory = {zh:'旧福特车厂', en:'Former Ford Factory', cat:'old', r:50, h:17,
  lt:{m:0, c:'#fff1dc', k:0.7, e:0.7, anim:'breathe'},
  build(){
    const g = new THREE.Group();
    const WH = '#f1efe8', WH2 = '#e2dfd6', FR = {c:'#3a4248', m:1, fh:4.2, cw:1.6}, BS = '#bdb7aa', DK = '#4a4f54';
    const L = Lh*2 - 0.5, W = Wh*2 - 0.4, HW = 9.6;
    // plinth / foundation and the two-storey wings
    LBox(g, L + 0.6, 5.2, W + 0.6, 0, -5, 0, BS);
    LBox(g, L, HW, W, 0, 0, 0, WH);
    LBox(g, L + 0.3, 0.8, W + 0.3, 0, 0, 0, BS);                                    // base course
    // window bands on both long faces: ground and first floor, steel windows with fine vertical mullions
    const Aw = [], Am = [], Ab = [];
    for (const s of [1, -1]) for (const [y0, hh] of [[1.4, 2.6], [5.6, 2.6]]){
      for (const [u0, u1] of [[-L/2 + 2, -8.5], [8.5, L/2 - 2]]){
        bxT(Aw, (u0 + u1)/2, y0, s*(W/2 + 0.02), u1 - u0, hh, 0.1, 0);
        for (let u = u0; u <= u1 + 0.01; u += 1.25) bxT(Am, u, y0, s*(W/2 + 0.08), 0.1, hh, 0.12, 0);
        bxT(Am, (u0 + u1)/2, y0 + hh*0.55, s*(W/2 + 0.08), u1 - u0, 0.08, 0.12, 0);
        bxT(Ab, (u0 + u1)/2, y0 - 0.25, s*(W/2 + 0.25), u1 - u0 + 0.4, 0.25, 0.5, 0);       // sill ledge
        bxT(Ab, (u0 + u1)/2, y0 + hh + 0.15, s*(W/2 + 0.4), u1 - u0 + 0.6, 0.18, 0.8, 0); }   // thin Art Deco hood
    }
    flush(g, Aw, FR); flush(g, Am, DK); flush(g, Ab, WH2);
    // parapet with the stepped Art Deco coping
    { const A = []; segT(A, -L/2, -W/2, L/2, -W/2, HW, 1.0, 0.35, 0.18, [0, -1]); segT(A, -L/2, W/2, L/2, W/2, HW, 1.0, 0.35, 0.18, [0, 1]); segT(A, -L/2, -W/2, -L/2, W/2, HW, 1.0, 0.35, 0, null); segT(A, L/2, -W/2, L/2, W/2, HW, 1.0, 0.35, 0, null);
      for (const u of [-L/2 + 0.6, L/2 - 0.6]) bxT(A, u, HW, 0, 1.2, 1.6, W + 0.6, 0); flush(g, A, WH2); }
    LBox(g, L - 1, 0.3, W - 1, 0, HW - 0.1, 0, '#9b9d9e');
    // ★ the central entrance tower on the front (+z): stepped massing, five vertical fins, the entrance canopy and doors
    { const TW = 14, TD = W + 3.0, TZ = 1.5;
      LBox(g, TW, 13.2, TD, 0, 0, TZ, WH); LBox(g, TW - 3, 2.0, TD - 2.4, 0, 13.2, TZ - 0.6, WH); LBox(g, TW - 6, 1.2, TD - 4.8, 0, 15.2, TZ - 1.2, WH2);
      const Af = []; for (let k = -2; k <= 2; k++) bxT(Af, k*1.7, 4.4, TZ + TD/2 + 0.3, 0.45, 10.8 - Math.abs(k)*0.8, 0.6, 0); flush(g, Af, WH2);
      LBox(g, 6.6, 6.0, 0.15, 0, 4.6, TZ + TD/2 + 0.02, FR);                                            // tall glazed panel behind the fins
      LBox(g, 10, 0.4, 3.6, 0, 3.6, TZ + TD/2 + 1.8, WH2);                                              // canopy
      LBox(g, 5.0, 3.0, 0.12, 0, 0.6, TZ + TD/2 + 0.02, DK);                                            // doors
      for (const s of [-1, 1]) LBox(g, 0.9, 12.6, 0.9, s*(TW/2 - 0.45), 0, TZ + TD/2 - 0.1, WH2);       // corner pilasters
      LCyl(g, 0.08, 0.1, 8, 0, 16.4, TZ - 1.2, '#cfd2d4', 6);                                          // flagpole
      for (const s of [-1, 1]) LBox(g, 6, 0.9, 0.2, s*5.0, 0, TZ + TD/2 + 1.6, BS); }                 // low steps cheeks
    // the forecourt step and ramp
    LBox(g, 16, 0.45, 2.4, 0, -0.3, W/2 + 2.6, BS);
    return g;
  }};
plc('sgfordfactory', A0, C[0], C[1], ROT + PI);
}

// ======================================================================================================
// Former Bukit Timah Railway Station (1932; restored, reopened 1 July 2022) — w241116507 on the Rail Corridor
// Small single-storey station "in the style of traditional small town stations": brick building with a clay-tiled hipped roof
// whose eaves extend over the side platform (east, track side), timber doors and windows; one side platform, a few metres of
// track kept in the former track bed. Materials and roof form from photos (not in the cited texts). Origin = footprint centroid.
// ======================================================================================================
{
const D0 = RD.sgbtrailstn, A0 = D0.a, R = D0.b.w241116507.r, C = cen(R);
const ROT = Math.atan2(R[0][0] - R[3][0], R[0][1] - R[3][1]);   // footprint runs ~N-S; local +z = south
LANDMARKS.sgbtrailstn = {zh:'旧武吉知马火车站', en:'Former Bukit Timah Railway Station', cat:'old', r:30, h:8,
  lt:{m:0, c:'#ffdcae', k:0.6, e:0.8, anim:'breathe'},
  build(){
    const g = new THREE.Group();
    const BRK = '#a0553d', CR = '#efe6d2', TL = '#a8553a', TM = '#6e4a33', PL = '#b9b2a4', RL = '#5d5650', SL = '#6f655a';
    const L = 25.4, W = 7.0;
    LBox(g, W + 0.4, 5.6, L + 0.4, 0, -5, 0, PL);
    LBox(g, W, 3.9, L, 0, 0.6, 0, BRK);
    LBox(g, W + 0.1, 0.5, L + 0.1, 0, 0.6, 0, '#7b3f2d');
    // windows and doors (timber, cream frames) on both long faces
    const Aw = [], Af = [];
    for (const s of [1, -1]) for (let z = -10.5; z <= 10.6; z += 3.0){ const door = Math.abs(z) < 2 || Math.abs(z - 7.5) < 0.6; bxT(Aw, s*(W/2 + 0.03), door ? 0.65 : 1.6, z, 0.08, door ? 2.6 : 1.7, door ? 1.5 : 1.3, 0); bxT(Af, s*(W/2 + 0.06), (door ? 0.65 : 1.6) - 0.1, z, 0.1, (door ? 2.6 : 1.7) + 0.25, (door ? 1.5 : 1.3) + 0.25, 0); }
    flush(g, Af, CR); flush(g, Aw, TM);
    // hipped clay-tile roof; the east (track side) eave extends over the platform on timber brackets
    hipRoof(g, 0.9, 0, L + 1.6, W + 5.6, 4.5, 2.6, TL, HP, 0);
    { const A = []; for (let z = -11; z <= 11.1; z += 3.7){ bxT(A, W/2 + 2.4, 0.6, z, 0.25, 3.9, 0.25, 0); bxT(A, W/2 + 1.2, 3.9, z, 2.6, 0.22, 0.22, 0); } flush(g, A, TM); }
    // the side platform on the track side (east, local +x) and a few metres of kept track
    LBox(g, 6.4, 0.9, 40, W/2 + 3.2, -0.3, 0, PL); LBox(g, 0.4, 0.1, 40, W/2 + 6.3, 0.6, 0, '#e2d36a');
    { const A = []; for (let z = -8; z <= 8; z += 0.7) bxT(A, W/2 + 9.2, -0.2, z, 2.6, 0.22, 0.25, 0); flush(g, A, SL);
      const B = []; for (const x of [W/2 + 8.48, W/2 + 9.92]) bxT(B, x, 0.02, 0, 0.08, 0.16, 16.5, 0); flush(g, B, RL); }
    // the old token-exchange stand by the platform edge
    LCyl(g, 0.08, 0.08, 1.4, W/2 + 6.0, 0.6, -14, RL, 6);
    return g;
  }};
plc('sgbtrailstn', A0, C[0], C[1], ROT);
}

// ======================================================================================================
// ★ Bukit Timah Truss Bridge (1932, United Engineers; conserved 2015, restored 2021) — the Rail Corridor bridge line over
// Dunearn Road and Bukit Timah Road. A 45 m steel through truss (littledayout) on concrete abutments, rails and sleepers kept,
// railings added in 2021. Warren-with-verticals panels, dark painted steel (truss type and colour from photos). The app draws
// the path deck (elev 6.6 m); the truss sits around it. Frame: local +z along the line (south), origin on the line between the
// two roads.
// ======================================================================================================
{
const P0 = [3, -42], P1 = [8, 46], dl = Math.hypot(P1[0] - P0[0], P1[1] - P0[1]), DIR = [(P1[0] - P0[0])/dl, (P1[1] - P0[1])/dl];
const MID = [P0[0] + DIR[0]*41, P0[1] + DIR[1]*41];
const ROT = Math.atan2(DIR[0], DIR[1]);    // local +z -> DIR
LANDMARKS.sgbttruss = {zh:'武吉知马铁桁桥', en:'Bukit Timah Truss Bridge', cat:'old', r:32, h:13,
  lt:{m:0, c:'#ffe2b8', k:0.45, e:0.8},
  build(){
    const g = new THREE.Group();
    const ST = '#2e3236', ST2 = '#3a3f44', CON = '#a9a49a', RL = '#5d5650', SL = '#5b4a3a';
    const DECK = 6.6, SPAN = 45, HW = 2.7, TH = 6.0, NP = 9, pw = SPAN/NP;
    // two trusses, one each side of the track
    const A = [], B = [];
    for (const s of [-1, 1]){ const x = s*HW;
      LBox(g, 0.5, 1.1, SPAN + 0.6, x, DECK - 1.15, 0, ST);                              // bottom chord (deep girder)
      LBox(g, 0.55, 0.6, SPAN - 2*pw, x, DECK + TH - 0.3, 0, ST);                        // top chord
      for (let i = 0; i <= NP; i++){ const z = -SPAN/2 + i*pw;
        if (i > 0 && i < NP) LBeam(g, [x, DECK - 0.1, z], [x, DECK + TH - 0.3, z], 0.16, ST2, 4);                 // verticals
      }
      // end posts and Warren diagonals
      LBeam(g, [x, DECK - 0.2, -SPAN/2], [x, DECK + TH - 0.3, -SPAN/2 + pw], 0.24, ST, 4); LBeam(g, [x, DECK - 0.2, SPAN/2], [x, DECK + TH - 0.3, SPAN/2 - pw], 0.24, ST, 4);
      for (let i = 1; i < NP - 1; i++){ const za = -SPAN/2 + i*pw, zb = za + pw; if (i % 2) LBeam(g, [x, DECK + TH - 0.3, za], [x, DECK - 0.1, zb], 0.17, ST2, 4); else LBeam(g, [x, DECK - 0.1, za], [x, DECK + TH - 0.3, zb], 0.17, ST2, 4); }
      // rivet / gusset plates at the panel points
      for (let i = 0; i <= NP; i++) bxT(A, x + s*0.3, DECK - 0.7, -SPAN/2 + i*pw, 0.06, 1.0, 0.9, 0);
    }
    flush(g, A, ST2);
    // top lateral bracing and portal frames, floor beams under the deck
    for (let i = 1; i < NP; i++){ const z = -SPAN/2 + i*pw; LBox(g, 2*HW, 0.35, 0.3, 0, DECK + TH - 0.5, z, ST); LBox(g, 2*HW + 0.6, 0.6, 0.35, 0, DECK - 1.2, z, ST); }
    for (let i = 1; i < NP - 1; i++){ const z = -SPAN/2 + i*pw; LBeam(g, [-HW, DECK + TH - 0.4, z], [HW, DECK + TH - 0.4, z + pw], 0.09, ST2, 4); LBeam(g, [HW, DECK + TH - 0.4, z], [-HW, DECK + TH - 0.4, z + pw], 0.09, ST2, 4); }
    for (const s of [-1, 1]){ const z = s*(SPAN/2 - pw); LBox(g, 2*HW, 0.9, 0.4, 0, DECK + TH - 1.6, z, ST); }
    // rails on sleepers (kept on the bridge), the 2021 railings inside the trusses
    { const S = []; for (let z = -SPAN/2; z <= SPAN/2; z += 0.65) bxT(S, 0, DECK - 0.05, z, 2.5, 0.16, 0.24, 0); flush(g, S, SL);
      const Rr = []; for (const x of [-0.72, 0.72]) bxT(Rr, x, DECK + 0.1, 0, 0.08, 0.15, SPAN, 0); for (const x of [-HW + 0.45, HW - 0.45]){ bxT(Rr, x, DECK + 1.1, 0, 0.06, 0.06, SPAN, 0); for (let z = -SPAN/2; z <= SPAN/2; z += 2.5) bxT(Rr, x, DECK, z, 0.06, 1.1, 0.06, 0); } flush(g, Rr, RL); }
    // concrete abutments with wing walls at both ends, down below the road level
    for (const s of [-1, 1]){ LBox(g, 2*HW + 3.0, DECK - 1.0 + 6, 3.2, 0, -6, s*(SPAN/2 + 1.0), CON); LBox(g, 0.8, DECK - 1.0 + 6, 7, -(HW + 1.9), -6, s*(SPAN/2 + 3.6), CON); LBox(g, 0.8, DECK - 1.0 + 6, 7, HW + 1.9, -6, s*(SPAN/2 + 3.6), CON); }
    return g;
  }};
plc('sgbttruss', [1.3368, 103.78105], MID[0], MID[1], ROT);
}

// ======================================================================================================
// Malaysia–Singapore Second Link (1998) — the motorway bridge from Tuas across the Johor Strait (1,920 m over water; the
// Singapore portion is the first ~150 m, the rest is in Malaysian waters). Dual three-lane carriageway, 25 m wide, precast
// concrete box-girder segments; lights on the piers. The app draws the two carriageway decks (elev up to 26 m); this model adds
// a box girder under each carriageway, piers (regular ~55 m spacing: an approximation, the real span arrangement incl. the
// 165 m navigation span is not modelled), pier caps, parapet lamps. Three keys along the line (secondary keys label:false), the
// Johor shore end is left out. Local frame: rot 0, coordinates in metres from the key origin on the line.
// ======================================================================================================
{
const A0 = [1.350279, 103.633847];
// carriageway centre lines with the app's deck height (from ref roads, Laluan Kedua … both directions)
const LA = {p:[[-1481,-1104],[-1182,-882],[-1162,-867],[-405,-304],[-386,-289],[-67,-52]], e:[0.6,25.2,26,26,25.2,0.6]};
const LB = {p:[[-1490,-1093],[-1173,-857],[-1154,-842],[-401,-283],[-381,-268],[-72,-42]], e:[0.6,25,26,26,25.9,0.6]};
const at = (L, s) => { // point and elev at arc length s from the Singapore end (last vertex)
  const P = L.p.slice().reverse(), E = L.e.slice().reverse(); let acc = 0;
  for (let i = 0; i < P.length - 1; i++){ const d = Math.hypot(P[i+1][0] - P[i][0], P[i+1][1] - P[i][1]); if (acc + d >= s || i === P.length - 2){ const t = Math.min(1, (s - acc)/d); return [P[i][0] + (P[i+1][0] - P[i][0])*t, P[i][1] + (P[i+1][1] - P[i][1])*t, E[i] + (E[i+1] - E[i])*t]; } acc += d; }
};
// the deck in the app follows a smooth (monotone cubic) profile; our vertex elevations are its control values (ramps linear)
const KEYS = [['sgsecondlink', 30, 560], ['sgsecondlink_2', 560, 1100], ['sgsecondlink_3', 1100, 1640]];
for (const [key, s0, s1] of KEYS){
  const m = at(LA, (s0 + s1)/2), mb = at(LB, (s0 + s1)/2), O = [(m[0] + mb[0])/2, (m[1] + mb[1])/2];
  LANDMARKS[key] = {zh:'马新第二通道大桥', en:'Malaysia–Singapore Second Link', cat:'new', r:Math.ceil((s1 - s0)/2 + 16), h:30, label:key === 'sgsecondlink' ? undefined : false,
    lt:{m:0, c:'#ffe7c4', k:0.35, e:0.9},
    build(){
      const g = new THREE.Group(), CON = '#b9b5ab', CON2 = '#a19d94', LMP = {c:'#e8e2c8', glow:'#ffe0a0', gk:1.6};
      const Ag = [], Ap = [], Al = [];
      for (const L of [LA, LB]){
        const STEP = 6;
        for (let s = s0; s < s1; s += STEP){ const a = at(L, s), b = at(L, Math.min(s1, s + STEP)), x0 = a[0] - O[0], z0 = a[1] - O[1], x1 = b[0] - O[0], z1 = b[1] - O[1];
          const ya = Math.max(a[2] - 0.35, 0.3), yb = Math.max(b[2] - 0.35, 0.3), dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz) || 1, nx = -dz/l, nz = dx/l;
          // trapezoid box girder: top flange 12.4 m, webs sloping to a 6.5 m soffit, depth 3.2 m
          const D = Math.min(3.2, Math.max(0.6, Math.min(ya, yb) - 0.2)), T = 6.2, Bh = 3.25;
          const P = (x, z, y, o) => [x + nx*o, y, z + nz*o];
          quadT(Ag, P(x0, z0, ya, T), P(x1, z1, yb, T), P(x1, z1, yb - 0.45, T), P(x0, z0, ya - 0.45, T));
          quadT(Ag, P(x0, z0, ya, -T), P(x0, z0, ya - 0.45, -T), P(x1, z1, yb - 0.45, -T), P(x1, z1, yb, -T));
          quadT(Ag, P(x0, z0, ya - 0.45, T), P(x1, z1, yb - 0.45, T), P(x1, z1, yb - 0.45, Bh + 0.6), P(x0, z0, ya - 0.45, Bh + 0.6));
          quadT(Ag, P(x0, z0, ya - 0.45, -T), P(x0, z0, ya - 0.45, -Bh - 0.6), P(x1, z1, yb - 0.45, -Bh - 0.6), P(x1, z1, yb - 0.45, -T));
          quadT(Ag, P(x0, z0, ya - 0.45, Bh + 0.6), P(x1, z1, yb - 0.45, Bh + 0.6), P(x1, z1, yb - D, Bh), P(x0, z0, ya - D, Bh));
          quadT(Ag, P(x0, z0, ya - 0.45, -Bh - 0.6), P(x0, z0, ya - D, -Bh), P(x1, z1, yb - D, -Bh), P(x1, z1, yb - 0.45, -Bh - 0.6));
          quadT(Ag, P(x0, z0, ya - D, Bh), P(x1, z1, yb - D, Bh), P(x1, z1, yb - D, -Bh), P(x0, z0, ya - D, -Bh));
          // lamp posts on the outer parapet every 36 m
          if (Math.round(s) % 36 < STEP && ya > 3){ const o = L === LA ? T - 0.3 : -T + 0.3, q = P(x0, z0, ya, o); bxT(Al, q[0], ya + 0.9, q[2], 0.25, 9, 0.25, 0); bxT(Al, q[0] - nx*Math.sign(o)*0.9, ya + 9.6, q[2] - nz*Math.sign(o)*0.9, 0.5, 0.35, 0.5, 0); }
        }
        // piers every 55 m (approximation) with a hammerhead cap and a pile cap at the water line
        for (let s = Math.ceil(s0/55)*55; s < s1; s += 55){ const a = at(L, s); if (a[2] < 2.5) continue; const x = a[0] - O[0], z = a[1] - O[1], ry = Math.atan2(-(at(L, s + 1)[1] - a[1]), at(L, s + 1)[0] - a[0]);
          const top = a[2] - 3.6; bxT(Ap, x, -5, z, 3.0, top + 5, 5.0, ry); bxT(Ap, x, top - 1.6, z, 3.4, 1.6, 9.0, ry); bxT(Ap, x, -5, z, 7.5, 5.6, 9.5, ry);
          bxT(Al, x, top - 2.4, z, 0.6, 0.4, 0.6, ry); }
      }
      flush(g, Ag, CON); flush(g, Ap, CON2); flush(g, Al, LMP);
      return g;
    }};
  plc(key, A0, O[0], O[1], 0);
}
}

// ======================================================================================================
// SITES — Jurong Lake Gardens: the Japanese Garden island (Seiwaen, 1973; rejuvenated, reopened Sep 2024) and the Lakeside
// Garden (2019; 53 ha). Keep polygons from the ref land-use areas (the Japanese Garden island = the two park polygons of the
// island, 13 ha; the Lakeside Garden = its park polygon minus the chinesegarden model's hull + 10 m). The real paths, bridges and
// boardwalks stay (keepRoads 11, 12: drawn by the app). Every real footprint inside a keep is hidden by the app, so each one is
// rebuilt here on its own outline (pavilions, the Guesthouse, the Breathing Gallery …); trees avoid the paths.
// ======================================================================================================
{
const tooNear = (paths, x, z, d) => { for (const L of paths) for (let i = 0; i < L.length - 1; i++){ const a = L[i], b = L[i+1], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx*dx + dz*dz || 1; let t = ((x - a[0])*dx + (z - a[1])*dz)/l2; t = t < 0 ? 0 : t > 1 ? 1 : t; if (Math.hypot(a[0] + dx*t - x, a[1] + dz*t - z) < d) return true; } return false; };
const nearB = (bs, x, z, d) => { for (const b of bs){ if (pipR(b.r, x, z)) return true; for (const p of b.r) if (Math.hypot(p[0] - x, p[1] - z) < d) return true; } return false; };
const wet = (W, x, z) => { for (const P of W) for (const [dx, dz] of [[0, 0], [2.5, 0], [-2.5, 0], [0, 2.5], [0, -2.5]]) if (pipR(P, x + dx, z + dz)) return true; return false; };
const lowY = (ctx, R) => { let y = 1e9; for (const p of R) y = Math.min(y, ctx.gy(p[0], p[1])); return y; };
const hiY = (ctx, R) => { let y = -1e9; for (const p of R) y = Math.max(y, ctx.gy(p[0], p[1])); return y; };
// a park pavilion on a real outline: timber posts, glazed or open walls, a deep overhanging roof
function pav(g, ctx, R, h, o){
  const y0 = lowY(ctx, R), y1 = hiY(ctx, R) + 0.2, C = cen(R);
  LPoly(g, R, y0 - 2, y1 - y0 + 2.3, o.base || '#b8b2a5');
  if (o.wall) LPoly(g, offR(R, -1.0), y1 + 0.3, h - 0.6, o.wall);
  const A = []; for (let i = 0; i < R.length; i++){ const p = R[i], q = R[(i+1) % R.length], L = Math.hypot(q[0] - p[0], q[1] - p[1]), k = Math.max(1, Math.round(L/(o.bay || 4))); for (let j = 0; j < k; j++){ const t = j/k; bxT(A, p[0] + (q[0] - p[0])*t, y1 + 0.3, p[1] + (q[1] - p[1])*t, 0.3, h - 0.3, 0.3, 0); } } flush(g, A, o.post || '#7a5638');
  const Rr = offR(R, o.over || 1.6); LPoly(g, Rr, y1 + h, 0.35, o.eave || '#6b4c34');
  if (o.hip){ // a low hipped / pyramid roof over the plate
    const top = Rr.map(p => [C[0] + (p[0] - C[0])*0.25, y1 + h + o.hip, C[1] + (p[1] - C[1])*0.25]), A2 = [];
    for (let i = 0; i < Rr.length; i++){ const j = (i + 1) % Rr.length; quadT(A2, [Rr[i][0], y1 + h + 0.35, Rr[i][1]], [Rr[j][0], y1 + h + 0.35, Rr[j][1]], top[j], top[i]); }
    for (let i = 1; i < top.length - 1; i++) A2.push(...top[0], ...top[i], ...top[i+1]);
    flush(g, A2, o.roof || '#4f5257');
  } else LPoly(g, offR(R, (o.over || 1.6) - 0.3), y1 + h + 0.35, 0.25, o.roof || '#d9d6cf');
  if (o.lamp) ctx.lamp(C[0], y1 + h - 0.6, C[1], [255, 214, 160]);
  return y1;
}
// --- Japanese Garden ---
{
const J = SD.jp, KEEP = J.keep;
Object.assign(SITES, {sgjapanesegarden:{zh:'星和园（日本公园）', en:'Japanese Garden (Jurong Lake Gardens)', lat:J.a[0], lon:J.a[1], r:360, keep:KEEP, keepRoads:[11, 12], h:18,
  lt:{m:0, c:'#ffd9a4', k:0.7, e:0.8, anim:'breathe'},
  build(ctx){
    const g = new THREE.Group(), rng = ctx.rng;
    // ground: lawn over the island, a raked-gravel dry garden and moss beds by the Floral Garden (west), the water-lily terraces (east)
    const byO = {}; for (const b of J.b) byO[b.o] = b;
    // the Guesthouse (mass-engineered timber hall, up to 1,000 people) — w1347736353
    if (byO.w1347736353){ const b = byO.w1347736353; pav(g, ctx, b.r, 7.0, {wall:{c:'#8b6a4a', m:1, fh:7, cw:2.2}, post:'#a77d52', eave:'#8a6544', roof:'#3f4246', hip:3.2, over:2.4, bay:3.0, lamp:true}); }
    // the Teahouse on its hill next to the Guesthouse — w1347736352 (+ the small w1347736351)
    for (const o of ['w1347736352', 'w1347736351']) if (byO[o]) pav(g, ctx, byO[o].r, o === 'w1347736352' ? 3.6 : 2.6, {wall:{c:'#d9cbb0', m:1, fh:3.6, cw:1.8}, post:'#6b4a32', eave:'#5d4330', roof:'#3d3f42', hip:1.8, over:1.4, bay:2.2, lamp:true});
    // the Resthouse: an open Japanese-style structure facing the large pond — w190010167
    if (byO.w190010167) pav(g, ctx, byO.w190010167.r, 3.8, {post:'#6b4a32', eave:'#5a4230', roof:'#45484c', hip:2.6, over:2.2, bay:3.4, lamp:true});
    // every other footprint inside the island: small timber pavilions / kiosks / toilets
    for (const b of J.b) if (!['w1347736353', 'w1347736352', 'w1347736351', 'w190010167'].includes(b.o)) pav(g, ctx, b.r, 3.0, {wall:{c:'#cdbf9f', m:0}, post:'#6b4a32', eave:'#5a4230', roof:'#45484c', hip:1.2, over:1.0, bay:2.5});
    // stone lanterns (tōrō, Seiwaen heritage feature) along the paths, deterministic spots beside the walks
    const Ast = [], Acap = [];
    let n = 0; for (let t = 0; t < 400 && n < 22; t++){ const L = J.paths[Math.floor(rng()*J.paths.length)]; if (L.length < 2) continue; const i = Math.floor(rng()*(L.length - 1)), a = L[i], b = L[i+1], f = rng(), dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, s = rng() < 0.5 ? 1 : -1;
      const x = a[0] + dx*f - dz/l*2.6*s, z = a[1] + dz*f + dx/l*2.6*s; if (!pipR(KEEP, x, z) || nearB(J.b, x, z, 3) || wet(J.water, x, z)) continue; const y = ctx.gy(x, z);
      bxT(Ast, x, y, z, 0.9, 0.35, 0.9, 0); bxT(Ast, x, y + 0.35, z, 0.32, 0.9, 0.32, 0); bxT(Ast, x, y + 1.25, z, 0.75, 0.2, 0.75, 0); bxT(Ast, x, y + 1.45, z, 0.6, 0.5, 0.6, 0.785); bxT(Acap, x, y + 1.95, z, 1.25, 0.22, 1.25, 0.785); bxT(Acap, x, y + 2.17, z, 0.45, 0.3, 0.45, 0.785);
      ctx.lamp(x, y + 1.7, z, [255, 200, 130]); n++; }
    flush(g, Ast, {c:'#9a968c', glow:'#ffcf8a', gk:0.25}); flush(g, Acap, '#8c887e');
    // rock clusters of the dry/rock garden in the Floral Garden (west of the island, from the area by the Lakeside entrance)
    { const A = []; for (let k = 0; k < 26; k++){ const x = -205 + rng()*50, z = -20 + rng()*60; if (!pipR(KEEP, x, z) || tooNear(J.paths, x, z, 2.5) || wet(J.water, x, z)) continue; const s = 0.6 + rng()*1.4; bxT(A, x, ctx.gy(x, z) - 0.3, z, s*1.6, s, s*1.2, rng()*PI); } flush(g, A, '#7f7c74'); }
    // trees: pines, flowering trees and rain trees across the island, off the paths and buildings
    let tN = 0; for (let t = 0; t < 2600 && tN < 520; t++){ const x = -250 + rng()*540, z = -230 + rng()*460; if (!pipR(KEEP, x, z) || tooNear(J.paths, x, z, 3.2) || nearB(J.b, x, z, 4) || wet(J.water, x, z)) continue; const r = rng();
      ctx.tree(x, z, 2.2 + rng()*2.2, r < 0.35 ? 'pine' : r < 0.5 ? 'sakura' : r < 0.6 ? 'maple' : r < 0.85 ? 'raintree' : 'd'); tN++; }
    // path lamps
    for (let k = 0; k < J.paths.length; k += 3){ const L = J.paths[k], p = L[Math.floor(L.length/2)]; if (pipR(KEEP, p[0], p[1])) ctx.lamp(p[0], ctx.gy(p[0], p[1]) + 3.5, p[1], [255, 226, 180]); }
    return g;
  }}});
}
// --- Lakeside Garden ---
{
const K = SD.lk, KEEP = K.keep;
Object.assign(SITES, {sglakeside:{zh:'裕廊湖花园·湖畔花园', en:'Lakeside Garden (Jurong Lake Gardens)', lat:K.a[0], lon:K.a[1], r:720, keep:KEEP, keepRoads:[11, 12], h:20,
  lt:{m:0, c:'#ffe0b0', k:0.6, e:0.8},
  build(ctx){
    const g = new THREE.Group(), rng = ctx.rng;
    // ground: the open lawns and grasslands, the woods and meadow (land-use areas), all inside the keep
    for (const a of K.areas) ctx.paint(a.r, a.k === 'wood' ? [86, 120, 72] : a.k === 'meadow' ? [150, 160, 102] : a.k === 'garden' ? [110, 150, 88] : [132, 166, 100]);
    const byO = {}; for (const b of K.b) byO[b.o] = b;
    // named buildings on their outlines
    const big = {w722269882:{h:7.5, wall:{c:'#d8dcdf', m:1, fh:3.75, cw:2.5}, roof:'#e6e4de', over:2.0},        // PAssion WaVe (waterfront activity centre)
      w722269881:{h:6.5, wall:{c:'#cfd5d8', m:1, fh:6.5, cw:2.6}, roof:'#4e5155', hip:2.0, over:3.0},               // Entrance Pavilion (Lakeside Garden North)
      w1159195808:{h:6.0, wall:{c:'#b99a72', m:1, fh:6, cw:2.4}, roof:'#4a4d51', hip:2.4, over:2.6},                // Gardenhouse
      w722269868:{h:4.0, roof:'#3f6b8a', hip:1.4, over:1.6},                                                      // Play Pavilion
      w722269793:{h:4.2, wall:{c:'#cdd3d6', m:1, fh:4.2, cw:3}, roof:'#6f9a58', over:0.6}};                       // ActiveSG gym with the rooftop lookout deck (green roof)
    for (const b of K.b){ const o = big[b.o] || {h:Math.min(4.5, Math.max(3, (b.h || 4)*0.4)), wall:b.a > 150 ? {c:'#d2cbbb', m:0} : null, roof:'#55585c', hip:b.a > 60 ? 1.0 : 0, over:1.0};
      pav(g, ctx, b.r, o.h, {wall:o.wall, roof:o.roof, hip:o.hip, over:o.over, post:'#806043', eave:'#6b4c34', bay:3.5, lamp:b.a > 300}); }
    // the rooftop lookout deck of the ActiveSG Park building: railing round the green roof
    if (byO.w722269793){ const b = byO.w722269793, y = hiY(ctx, b.r) + 0.2 + 4.2 + 0.6, A = []; for (let i = 0; i < b.r.length; i++){ const p = b.r[i], q = b.r[(i+1) % b.r.length]; segT(A, p[0], p[1], q[0], q[1], y, 1.1, 0.08, -0.3, nrm(b.r, i)); } flush(g, A, '#c9ccce'); }
    // trees: dense in the woods (freshwater swamp forest, Forest Ramble), scattered over the grasslands and along the paths
    let n = 0;
    for (const a of K.areas){ if (a.k !== 'wood') continue; let bx = 1e9, Bx = -1e9, bz = 1e9, Bz = -1e9; for (const p of a.r){ bx = Math.min(bx, p[0]); Bx = Math.max(Bx, p[0]); bz = Math.min(bz, p[1]); Bz = Math.max(Bz, p[1]); }
      for (let t = 0; t < 900; t++){ const x = bx + rng()*(Bx - bx), z = bz + rng()*(Bz - bz); if (!pipR(a.r, x, z) || tooNear(K.paths, x, z, 2.8) || nearB(K.b, x, z, 3) || wet(K.water, x, z)) continue; ctx.tree(x, z, 2.4 + rng()*2.4, rng() < 0.3 ? 'palm' : rng() < 0.6 ? 'raintree' : 'd'); n++; } }
    for (let t = 0; t < 9000 && n < 1500; t++){ const L = K.paths[Math.floor(rng()*K.paths.length)]; if (L.length < 2) continue; const i = Math.floor(rng()*(L.length - 1)), a = L[i], b = L[i+1], f = rng(), dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, s = rng() < 0.5 ? 1 : -1, o = 5 + rng()*14;
      const x = a[0] + dx*f - dz/l*o*s, z = a[1] + dz*f + dx/l*o*s; if (!pipR(KEEP, x, z) || tooNear(K.paths, x, z, 3) || nearB(K.b, x, z, 4) || wet(K.water, x, z)) continue; const r = rng(); ctx.tree(x, z, 2.2 + rng()*2.6, r < 0.5 ? 'raintree' : r < 0.7 ? 'palm' : 'd'); n++; }
    // path lamps
    for (let k = 0; k < K.paths.length; k += 2){ const L = K.paths[k], p = L[Math.floor(L.length/2)]; if (pipR(KEEP, p[0], p[1])) ctx.lamp(p[0], ctx.gy(p[0], p[1]) + 4, p[1], [255, 226, 180]); }
    return g;
  }}});
}
}
}
