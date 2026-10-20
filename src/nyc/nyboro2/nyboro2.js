// ===== nyc/nyboro2: Brooklyn, Queens, the Bronx, Staten Island and Newark landmarks (City Brush v33, New York 1:1) ==========
// Brooklyn Academy of Music (Peter Jay Sharp Building + Harvey Theater), Brooklyn Public Library Central Library, Brooklyn Navy
// Yard (Building 77 + Dock 72), MoMA PS1, Kingsbridge Armory, Loew's Paradise Theatre, Bronx Zoo (Astor Court: the Zoo Center
// dome, the Lion House, the Primate House, the two Administration buildings, the old Bird House, the Sea Lion Pool and the
// Rainey Memorial Gates), Staten Island Borough Hall, Fort Wadsworth (Battery Weed + Fort Tompkins), Newark Penn Station.
// Every model is built in its own frame on its real OSM footprint (rings from SC/nyc/ref_nyboro2*.json, see tools/).
// Block-scoped: only LANDMARKS and SG_PLACES are touched. No names, logos, letters or readable text on any model (marquees and
// signs are lit frames only; no animal figures).
{
// ---- triangle batcher: one LTris per colour spec ------------------------------------------------------------------------
function nb2TB(){ const B = new Map(); return {
  t(col, ...pts){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = B.get(k); if (!e){ e = {col, p:[]}; B.set(k, e); } for (const q of pts) e.p.push(q[0], q[1], q[2]); },
  q(col, a, b, c, d){ this.t(col, a, b, c, a, c, d); },
  // oriented box: centre-bottom (x, y, z), length L along unit (ux, uz), height h, depth d across
  box(col, x, y, z, ux, uz, L, h, d, nobot){ const vx = -uz, vz = ux, l = L/2, w = d/2;
    const P = (a, b, yy) => [x + ux*a + vx*b, yy, z + uz*a + vz*b];
    const A = P(-l, -w, y), Bq = P(l, -w, y), C = P(l, w, y), D = P(-l, w, y), A2 = P(-l, -w, y + h), B2 = P(l, -w, y + h), C2 = P(l, w, y + h), D2 = P(-l, w, y + h);
    this.q(col, A, Bq, B2, A2); this.q(col, Bq, C, C2, B2); this.q(col, C, D, D2, C2); this.q(col, D, A, A2, D2); this.q(col, A2, B2, C2, D2); if (!nobot) this.q(col, A, D, C, Bq); },
  abox(col, x0, y0, z0, x1, y1, z1){ this.box(col, (x0 + x1)/2, y0, (z0 + z1)/2, 1, 0, x1 - x0, y1 - y0, z1 - z0); },
  // vertical n-gon prism / frustum
  cyl(col, x, y, z, r, h, n, r2, a0){ n = n || 8; a0 = a0 || 0; const rt = r2 === undefined ? r : r2;
    for (let i = 0; i < n; i++){ const a = a0 + i/n*Math.PI*2, b = a0 + (i + 1)/n*Math.PI*2;
      this.q(col, [x + Math.cos(a)*r, y, z + Math.sin(a)*r], [x + Math.cos(b)*r, y, z + Math.sin(b)*r], [x + Math.cos(b)*rt, y + h, z + Math.sin(b)*rt], [x + Math.cos(a)*rt, y + h, z + Math.sin(a)*rt]);
      if (rt > 0) this.t(col, [x, y + h, z], [x + Math.cos(a)*rt, y + h, z + Math.sin(a)*rt], [x + Math.cos(b)*rt, y + h, z + Math.sin(b)*rt]); } },
  // surface of revolution [[r, y], ...] about (x, z)
  lathe(col, x, y, z, prof, n){ n = n || 16;
    for (let j = 0; j + 1 < prof.length; j++){ const [r0, y0] = prof[j], [r1, y1] = prof[j + 1];
      for (let i = 0; i < n; i++){ const a = i/n*Math.PI*2, b = (i + 1)/n*Math.PI*2;
        this.q(col, [x + Math.cos(a)*r0, y + y0, z + Math.sin(a)*r0], [x + Math.cos(b)*r0, y + y0, z + Math.sin(b)*r0], [x + Math.cos(b)*r1, y + y1, z + Math.sin(b)*r1], [x + Math.cos(a)*r1, y + y1, z + Math.sin(a)*r1]); } } },
  flat(col, P, y){ const tr = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
    for (const f of tr) this.t(col, [P[f[0]][0], y, P[f[0]][1]], [P[f[1]][0], y, P[f[1]][1]], [P[f[2]][0], y, P[f[2]][1]]); },
  // walls of a polygon from y0 to y1 (+ top cap unless cap === false); y0 may be a function (x, z) -> bottom
  prism(col, P, y0, y1, cap, capCol){ const n = P.length, f = typeof y0 === 'function' ? y0 : () => y0;
    for (let i = 0; i < n; i++){ const a = P[i], b = P[(i + 1) % n]; this.q(col, [a[0], f(a[0], a[1]), a[1]], [b[0], f(b[0], b[1]), b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); }
    if (cap !== false) this.flat(capCol || col, P, y1); },
  flush(g){ for (const e of B.values()) if (e.p.length) LTris(g, e.p, e.col); B.clear(); }
}; }
// ---- polygon helpers ([x, z] points, local metres) ------------------------------------------------------------------------
function nb2Area(P){ let s = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length]; s += a[0]*b[1] - b[0]*a[1]; } return s/2; }
function nb2Edges(P){ const sg = nb2Area(P) > 0 ? 1 : -1, E = [];
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1e-6;
    E.push({i, a, b, L, ux:dx/L, uz:dz/L, nx:sg*dz/L, nz:-sg*dx/L}); } return E; }
function nb2Off(P, d){ const E = nb2Edges(P), n = P.length, Q = [];
  for (let i = 0; i < n; i++){ const e1 = E[(i - 1 + n) % n], e2 = E[i]; const mx = e1.nx + e2.nx, mz = e1.nz + e2.nz, k = 1 + e1.nx*e2.nx + e1.nz*e2.nz;
    if (k < 0.15){ Q.push([P[i][0] + e2.nx*d, P[i][1] + e2.nz*d]); continue; } Q.push([P[i][0] + mx/k*d, P[i][1] + mz/k*d]); } return Q; }
function nb2Rect(x0, z0, x1, z1){ return [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]; }
function nb2Pip(P, x, z){ let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0])*(z - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; }
// a window (optionally arched) on the face of edge e at distance u along it, width w, from ya to yb (yb = springing line)
function nb2Win1(T, e, u, w, ya, yb, col, out, arch, frame){ out = out === undefined ? 0.07 : out;
  const cx = e.a[0] + e.ux*u + e.nx*out, cz = e.a[1] + e.uz*u + e.nz*out, ax = cx - e.ux*w/2, az = cz - e.uz*w/2, bx = cx + e.ux*w/2, bz = cz + e.uz*w/2;
  T.q(col, [ax, ya, az], [bx, ya, bz], [bx, yb, bz], [ax, yb, az]);
  if (arch){ const r = w/2, n = 6, k = arch === true ? 1 : arch; for (let j = 0; j < n; j++){ const t0 = j/n*Math.PI, t1 = (j + 1)/n*Math.PI;
    T.t(col, [cx, yb, cz], [cx + e.ux*Math.cos(t0)*r, yb + Math.sin(t0)*r*k, cz + e.uz*Math.cos(t0)*r], [cx + e.ux*Math.cos(t1)*r, yb + Math.sin(t1)*r*k, cz + e.uz*Math.cos(t1)*r]); } }
  if (frame){ const fo = out + 0.05; T.box(frame, e.a[0] + e.ux*u + e.nx*fo, ya - 0.25, e.a[1] + e.uz*u + e.nz*fo, e.ux, e.uz, w + 0.5, 0.25, 0.25); }
}
// rows of windows on every edge of P for which o.on(e): {y0, y1, fh, bw, wf, hf, sill, col, out, min, arch, frame, edge, skip}
function nb2Win(T, P, o){ const E = nb2Edges(P);
  for (const e of E){ if (e.L < (o.min || 2.5) || (o.on && !o.on(e))) continue;
    const ed = o.edge || 0, nb = Math.max(1, Math.round((e.L - ed*2)/o.bw)), bw = (e.L - ed*2)/nb, ww = bw*(o.wf || 0.55);
    for (let y = o.y0, fl = 0; y + o.fh*0.5 <= o.y1 + 0.01; y += o.fh, fl++){ const ya = y + o.fh*(o.sill === undefined ? 0.2 : o.sill), yb = Math.min(o.y1, ya + o.fh*(o.hf || 0.6));
      for (let k = 0; k < nb; k++){ if (o.skip && o.skip(e, k, nb, fl)) continue; nb2Win1(T, e, ed + bw*(k + 0.5), ww, ya, o.arch ? yb - ww/2 : yb, o.col, o.out, o.arch, o.frame); } } } }
// horizontal band round P: depth d outward, from y to y + h (on = edge filter)
function nb2Band(T, P, y, h, d, col, on){ const Q = nb2Off(P, d), n = P.length, E = nb2Edges(P);
  for (let i = 0; i < n; i++){ if (on && !on(E[i])) continue; const j = (i + 1) % n, a = P[i], b = P[j], A = Q[i], B = Q[j];
    T.q(col, [A[0], y, A[1]], [B[0], y, B[1]], [B[0], y + h, B[1]], [A[0], y + h, A[1]]);
    T.q(col, [a[0], y + h, a[1]], [b[0], y + h, b[1]], [B[0], y + h, B[1]], [A[0], y + h, A[1]]);
    T.q(col, [a[0], y, a[1]], [b[0], y, b[1]], [B[0], y, B[1]], [A[0], y, A[1]]); } }
// crenellations (merlons) along the edges of P at height y: merlon width mw, gap gw, height h, thickness d (inset from the face)
function nb2Merlons(T, P, y, h, mw, gw, d, col, on){ for (const e of nb2Edges(P)){ if (on && !on(e)) continue; const n = Math.max(1, Math.floor((e.L + gw)/(mw + gw))), s = (e.L - n*mw)/Math.max(1, n - 1);
  for (let k = 0; k < n; k++){ const u = n === 1 ? e.L/2 : mw/2 + k*(mw + s); T.box(col, e.a[0] + e.ux*u - e.nx*d/2, y, e.a[1] + e.uz*u - e.nz*d/2, e.ux, e.uz, mw, h, d); } } }
// hip roof over an axis rectangle (ridge along the longer side), eaves at y, rise h
function nb2Hip(T, col, x0, z0, x1, z1, y, h){ const w = x1 - x0, d = z1 - z0;
  if (w >= d){ const r = d/2, a = [x0 + r, y + h, (z0 + z1)/2], b = [x1 - r, y + h, (z0 + z1)/2];
    T.q(col, [x0, y, z0], [x1, y, z0], b, a); T.q(col, [x1, y, z1], [x0, y, z1], a, b); T.t(col, [x0, y, z1], [x0, y, z0], a); T.t(col, [x1, y, z0], [x1, y, z1], b); }
  else { const r = w/2, a = [(x0 + x1)/2, y + h, z0 + r], b = [(x0 + x1)/2, y + h, z1 - r];
    T.q(col, [x1, y, z0], [x1, y, z1], b, a); T.q(col, [x0, y, z1], [x0, y, z0], a, b); T.t(col, [x0, y, z0], [x1, y, z0], a); T.t(col, [x1, y, z1], [x0, y, z1], b); } }
// mansard / frustum over an axis rectangle: from (x0..x1, z0..z1) at y up by h, inset i on every side (flat top)
function nb2Mans(T, col, x0, z0, x1, z1, y, h, i, top){ const a = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], b = [[x0 + i, z0 + i], [x1 - i, z0 + i], [x1 - i, z1 - i], [x0 + i, z1 - i]];
  for (let k = 0; k < 4; k++){ const j = (k + 1) % 4; T.q(col, [a[k][0], y, a[k][1]], [a[j][0], y, a[j][1]], [b[j][0], y + h, b[j][1]], [b[k][0], y + h, b[k][1]]); }
  T.q(top || col, [b[0][0], y + h, b[0][1]], [b[1][0], y + h, b[1][1]], [b[2][0], y + h, b[2][1]], [b[3][0], y + h, b[3][1]]); }
// gable (pitched) roof over an axis rect, ridge along x (ax = 'x') or z
function nb2Gable(T, col, end, x0, z0, x1, z1, y, h, ax){ if (ax === 'z'){ const xm = (x0 + x1)/2;
    T.q(col, [x0, y, z0], [x0, y, z1], [xm, y + h, z1], [xm, y + h, z0]); T.q(col, [x1, y, z1], [x1, y, z0], [xm, y + h, z0], [xm, y + h, z1]);
    T.t(end, [x0, y, z0], [xm, y + h, z0], [x1, y, z0]); T.t(end, [x1, y, z1], [xm, y + h, z1], [x0, y, z1]); }
  else { const zm = (z0 + z1)/2;
    T.q(col, [x1, y, z0], [x0, y, z0], [x0, y + h, zm], [x1, y + h, zm]); T.q(col, [x0, y, z1], [x1, y, z1], [x1, y + h, zm], [x0, y + h, zm]);
    T.t(end, [x0, y, z0], [x0, y, z1], [x0, y + h, zm]); T.t(end, [x1, y, z1], [x1, y, z0], [x1, y + h, zm]); } }
// ground (relative to the model's base) from an embedded grid: G = {x0, z0, st, nx, v:[rows of nx values, z-major]}
function nb2Gnd(G){ const nz = G.v.length/G.nx; return (x, z) => { const fx = Math.min(G.nx - 1.001, Math.max(0, (x - G.x0)/G.st)), fz = Math.min(nz - 1.001, Math.max(0, (z - G.z0)/G.st)), i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, V = G.v, n = G.nx;
  return (V[j*n + i]*(1 - u) + V[j*n + i + 1]*u)*(1 - v) + (V[(j + 1)*n + i]*(1 - u) + V[(j + 1)*n + i + 1]*u)*v; }; }
// low-poly tree
function nb2Tree(T, x, y, z, s, leaf, trunk){ T.box(trunk, x, y, z, 1, 0, 0.35*s, 1.6*s, 0.35*s);
  const cy = y + 2.3*s, R = 1.3*s, V = [[0, R, 0], [R, 0, 0], [0, 0, R], [-R, 0, 0], [0, 0, -R], [0, -R*0.7, 0]];
  for (const f of [[0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1], [5, 2, 1], [5, 3, 2], [5, 4, 3], [5, 1, 4]]) T.t(leaf, ...f.map(i => [x + V[i][0], cy + V[i][1], z + V[i][2]])); }
// local frame helper for a ring: place it relative to a key's origin
const NB2_GLASS = {c:'#3c4a55', m:1, fh:4.0, cw:3.0}, NB2_WARMWIN = {c:'#2d2a27', glow:'#ffcf8a', gk:0.35};
// =====================================================================================================================
// Brooklyn Public Library, Central Library (1941, Githens & Keally; Grand Army Plaza): Art Deco limestone in the shape of an
// open book — the long wings along Eastern Parkway and Flatbush Avenue meet in the concave front on the plaza, where the
// entrance (a 15 m tall recess with the gilded bronze screen) stands between two tall limestone pylons carrying gilded low
// reliefs; plain ashlar walls with tall narrow window strips, a flat roof with the low penthouse, the rounded
// south end, the fan of steps down to the plaza. Frame: world axes (x east, z south) round the footprint's centroid.
LANDMARKS.nybpl = {zh:'布鲁克林公共图书馆中央馆', en:'Brooklyn Public Library, Central Library', cat:'old', r:80, h:31,
  lt:{m:0, c:'#ffe6c2', k:0.6, e:0.5},
  build(){
    const g = new THREE.Group(), T = nb2TB();
    const P = [[-46.5,-13.2],[-40.8,-15.8],[-35.6,-19.2],[-31.1,-23.5],[-27.3,-28.5],[-24.4,-34.0],[-22.4,-39.9],[-21.4,-46.1],[-21.5,-52.2],[50.2,-46.4],[48.8,-30.1],[39.0,-30.9],[39.0,-31.4],[22.4,-32.8],[21.6,-22.6],[25.8,-22.2],[23.8,-13.4],[31.9,-10.7],[29.0,-3.1],[25.1,4.1],[17.6,13.8],[11.7,19.5],[6.4,13.1],[0.5,17.4],[-1.7,13.4],[-10.9,18.5],[0.1,38.5],[3.4,36.7],[4.7,31.6],[27.7,37.8],[20.7,66.3],[20.0,66.4],[18.8,70.3],[16.2,73.4],[14.2,74.8],[11.1,75.8],[7.0,75.6],[3.2,73.9],[0.4,71.0],[-0.6,68.8],[-1.1,69.1]];
    const LIME = '#d9d1bf', LIME2 = '#c8bfab', BASE = '#b5ad9c', ROOF = '#8d8a84', DARK = '#3a3a38';
    const WIN = {c:'#2c3135', glow:'#ffd9a0', gk:0.3}, GOLD = {c:'#c9a443', glow:'#ffcf6e', gk:0.55}, BRONZE = {c:'#5b4a2e', glow:'#ffc36a', gk:0.25};
    const H = 24.0, E = nb2Edges(P);
    // arc of the concave front: circle through P0, P4, P8
    const cc = (a, b, c) => { const d = 2*(a[0]*(b[1] - c[1]) + b[0]*(c[1] - a[1]) + c[0]*(a[1] - b[1])), s = q => q[0]*q[0] + q[1]*q[1];
      return [(s(a)*(b[1] - c[1]) + s(b)*(c[1] - a[1]) + s(c)*(a[1] - b[1]))/d, (s(a)*(c[0] - b[0]) + s(b)*(a[0] - c[0]) + s(c)*(b[0] - a[0]))/d]; };
    const C = cc(P[0], P[4], P[8]), R = Math.hypot(P[4][0] - C[0], P[4][1] - C[1]);
    const ang = q => Math.atan2(q[1] - C[1], q[0] - C[0]), a0 = ang(P[0]), a8 = ang(P[8]);
    let da = a8 - a0; while (da > Math.PI) da -= 2*Math.PI; while (da < -Math.PI) da += 2*Math.PI;
    const am = a0 + da/2, AP = a => [C[0] + Math.cos(a)*R, C[1] + Math.sin(a)*R];
    // main mass: walls from the foundation, flat roof
    T.prism(LIME, P, -6.5, H, true, ROOF);
    nb2Band(T, P, -6.5, 5.0, 0.45, BASE);                                                   // granite base (the plaza side is ~4.5 m low)
    nb2Band(T, P, H - 1.6, 0.7, 0.35, LIME2); nb2Band(T, P, H - 0.2, 0.5, 0.15, LIME2);   // cornice and coping
    const outer = e => e.i === 8 || e.i === P.length - 1;                                   // the Eastern Parkway and Flatbush fronts
    const arcE = e => e.i < 8;
    // tall narrow window strips in groups along the two long fronts, two tiers
    for (const e of E){ if (!outer(e)) continue; const n = Math.floor((e.L - 8)/3.2);
      for (let k = 0; k < n; k++){ if (k % 6 === 5) continue; const u = 4 + (e.L - 8)*(k + 0.5)/n;
        nb2Win1(T, e, u, 1.25, 1.5, 9.5, WIN, 0.08); nb2Win1(T, e, u, 1.25, 11.2, 18.6, WIN, 0.08);
        T.box(LIME2, e.a[0] + e.ux*u + e.nx*0.12, 9.5, e.a[1] + e.uz*u + e.nz*0.12, e.ux, e.uz, 1.6, 1.7, 0.25); } }
    // back faces: smaller windows
    nb2Win(T, P, {y0:0, y1:H - 2, fh:4.2, bw:3.4, wf:0.4, hf:0.55, col:WIN, on:e => !outer(e) && !arcE(e) && e.L > 6});
    // low penthouse over the junction of the wings (roof plant)
    T.prism(LIME2, [[-6, -40], [18, -38], [14, -18], [-2, -12], [-14, -24]], H, H + 3.2, true, ROOF);
    // the concave front: plain ashlar, rises higher in the middle; pylons and the gilded entrance screen
    const NA = 18; const ring = [];
    for (let i = 0; i <= NA; i++) ring.push(AP(a0 + da*i/NA));
    const back = []; for (let i = NA; i >= 0; i--){ const a = a0 + da*i/NA; back.push([C[0] + Math.cos(a)*(R + 9), C[1] + Math.sin(a)*(R + 9)]); }
    const FR = ring.map(p => [p[0] + (p[0] - C[0])/R*(-0.4), p[1] + (p[1] - C[1])/R*(-0.4)]).concat(back);
    T.prism(LIME, FR, -6.5, H + 4.5, true, ROOF); nb2Band(T, FR, H + 3.0, 0.8, 0.35, LIME2, e => e.i < NA);
    // stepped vertical ribs across the curved wall (Art Deco piers)
    for (let i = 1; i < NA; i++){ if (Math.abs(i - NA/2) < 3.2) continue; const a = a0 + da*i/NA, p = AP(a), nx = (C[0] - p[0])/R, nz = (C[1] - p[1])/R;
      T.box(LIME2, p[0] - nx*0.2, -1.5, p[1] - nz*0.2, -nz, nx, 0.8, H + 3, 0.9); }
    // pylons: two tall slabs either side of the entrance, carrying gilded relief panels; the recessed screen between them
    const ent = AP(am), enx = (C[0] - ent[0])/R, enz = (C[1] - ent[1])/R, eux = -enz, euz = enx;   // enx/enz points out to the plaza
    for (const s of [-1, 1]){ const px = ent[0] + eux*s*10.5 + enx*1.2, pz = ent[1] + euz*s*10.5 + enz*1.2;
      T.box(LIME, px, -5, pz, eux, euz, 8.5, H + 7.5, 4.0);
      T.box(LIME2, px, H + 2.5, pz, eux, euz, 9.0, 0.6, 4.4);
      for (let k = 0; k < 4; k++){ const y = 6 + k*4.6;                                   // gilded low-relief panels (abstract)
        T.box(GOLD, px + enx*2.02, y, pz + enz*2.02, eux, euz, 5.6, 3.6, 0.12);
        for (let j = 0; j < 3; j++) T.box(GOLD, px + enx*2.1 + eux*(j - 1)*1.6, y + 0.6 + (j % 2)*0.8, pz + enz*2.1 + euz*(j - 1)*1.6, eux, euz, 0.9, 1.6, 0.2); } }
    // the entrance recess: deep frame, the tall gilded screen (grid of panels), bronze doors below
    T.box(DARK, ent[0] + enx*0.5, -1.5, ent[1] + enz*0.5, eux, euz, 12.5, 17.5, 0.3);
    const sx = ent[0] + enx*0.75, sz = ent[1] + enz*0.75;
    for (let r = 0; r < 7; r++) for (let c = -3; c <= 3; c++){ const y = 4.6 + r*1.75;
      T.box(GOLD, sx + eux*c*1.62, y, sz + euz*c*1.62, eux, euz, 1.38, 1.5, 0.25);
      if ((r + c) % 2 === 0) T.box(GOLD, sx + eux*c*1.62 + enx*0.15, y + 0.4, sz + euz*c*1.62 + enz*0.15, eux, euz, 0.6, 0.7, 0.25); }
    T.box(GOLD, sx, 16.9, sz, eux, euz, 12, 0.5, 0.4);
    for (let c = -2; c <= 2; c++) T.box(BRONZE, sx + eux*c*2.2 + enx*0.1, -1.5, sz + euz*c*2.2 + enz*0.1, eux, euz, 1.8, 5.6, 0.2);
    // plain band over the entrance (no lettering) and the cap of the central front
    T.box(LIME2, ent[0] + enx*0.3, H - 1.0, ent[1] + enz*0.3, eux, euz, 16, 2.2, 0.8);
    // fan of steps from the plaza up to the doors
    for (let k = 0; k < 7; k++){ const rr = 2.5 + k*1.6, y = -1.5 - k*0.55;
      const arcP = []; for (let i = 0; i <= 10; i++){ const a = Math.atan2(enz, enx) - 1.0 + 2.0*i/10; arcP.push([ent[0] + Math.cos(a)*rr, ent[1] + Math.sin(a)*rr]); }
      for (let i = 0; i < 10; i++){ const p = arcP[i], q = arcP[i + 1];
        T.q(BASE, [ent[0] + (p[0] - ent[0])*0.0, y, ent[1]], [p[0], y, p[1]], [q[0], y, q[1]], [ent[0], y, ent[1]]);
        T.q(LIME2, [p[0], y, p[1]], [q[0], y, q[1]], [q[0], y - 0.55, q[1]], [p[0], y - 0.55, p[1]]); } }
    // roof plant
    T.abox('#9a9790', 30, H, -42, 44, H + 3.2, -34); T.abox('#9a9790', 2, H, 30, 14, H + 2.6, 44);
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nybpl', lat:40.6722389, lon:-73.9681101, rot:0});
// =====================================================================================================================
// Kingsbridge Armory (1912-17, Pilcher & Tachau; the Bronx): the huge red-brick drill hall (≈ 180 x 90 m) under its curved
// four-centred steel roof (≈ 39 m), the tall (nine-storey) walls with piers, stone-framed slit windows, turrets above the corbels, the corbelled stone string
// course, crenellated parapets and corner turrets, the glazed arched ends of the roof; on the south front (West Kingsbridge
// Road) the castle-like headhouse: crenellated two-storey office wing with the entrance and two tall semi-engaged round towers
// with conical roofs, low round towers with cupolas and square towers where it meets the hall. Frame: x along the hall
// (east-south-east), +z = south = the headhouse front.
LANDMARKS.nykingsbridge = {zh:'金斯布里奇军械库', en:'Kingsbridge Armory', cat:'old', r:110, h:40,
  lt:{m:0, c:'#ffd7a8', k:0.55, e:0.45},
  build(){
    const g = new THREE.Group(), T = nb2TB();
    const BR = '#8b4433', BR2 = '#7a3a2c', ST = '#cbbfa7', ROOF = '#5f666b', ROOF2 = '#6c7479', GLZ = {c:'#aab6b4', glow:'#ffe4b0', gk:0.25}, SLATE = '#4a4f55';
    const WIN = {c:'#2e3034', glow:'#ffd29a', gk:0.3}, CU = '#5d7f70';
    const X0 = -90.6, X1 = 89.7, Z0 = -49.7, Z1 = 40.0, WH = 25.0, RT = 39.4, F = -4.5;
    const HALL = [[X0, Z0], [X1, Z0], [X1, Z1], [X0, Z1]];
    T.prism(BR, HALL, F, WH, false);
    nb2Band(T, HALL, F, 5.5, 0.35, BR2);                                       // water table / base
    nb2Band(T, HALL, WH - 2.2, 0.9, 0.55, ST);                                 // corbelled stone string course
    for (let k = 0; k < 4; k++) nb2Band(T, HALL, WH - 3.2 + k*0.25 - 0.9, 0.25, 0.12 + k*0.11, ST);
    T.prism(BR, nb2Rect(X0, Z0, X1, Z1), WH - 1.3, WH + 1.2, false);
    nb2Merlons(T, HALL, WH + 1.2, 1.4, 1.6, 1.2, 0.8, BR);                     // crenellated parapet
    // buttresses with stone caps, slit windows between them (long sides); arched ends of the roof glazed
    const E = nb2Edges(HALL);
    for (const e of E){ const n = Math.round(e.L/9.0);
      for (let k = 0; k <= n; k++){ const u = e.L*k/n, x = e.a[0] + e.ux*u, z = e.a[1] + e.uz*u;
        T.box(BR2, x + e.nx*0.6, F, z + e.nz*0.6, e.ux, e.uz, 1.6, WH - 3.4 - F, 1.2);
        if (k % 2 === 0 && k > 0 && k < n){ const tx = x + e.nx*0.9, tz = z + e.nz*0.9;                      // turrets above the corbels
          T.cyl(BR, tx, WH - 3.4, tz, 1.5, 7.6, 8); T.cyl(ST, tx, WH - 3.6, tz, 1.25, 0.6, 8, 1.6); T.cyl(ST, tx, WH + 4.2, tz, 1.75, 0.45, 8);
          for (let m = 0; m < 6; m++){ const a = m/6*Math.PI*2; T.box(BR, tx + Math.cos(a)*1.45, WH + 4.65, tz + Math.sin(a)*1.45, -Math.sin(a), Math.cos(a), 0.9, 0.9, 0.4); } } }
      for (let k = 0; k < n; k++){ const u = e.L*(k + 0.5)/n;
        for (const du of [-1.4, 1.4]){ nb2Win1(T, e, u + du, 0.75, 3.5, 7.5, WIN, 0.07); nb2Win1(T, e, u + du, 0.75, 10.0, 14.5, WIN, 0.07); nb2Win1(T, e, u + du, 0.75, 16.5, 19.5, WIN, 0.07); }
        nb2Win1(T, e, u, 2.2, 14.6, 15.0, ST, 0.12); nb2Win1(T, e, u, 2.2, 7.5, 7.9, ST, 0.12); nb2Win1(T, e, u, 2.2, 19.6, 20.0, ST, 0.12); } }
    // the roof: a four-centred vault across z, running along x; a continuous monitor along the ridge
    const NV = 14, prof = [];
    for (let i = 0; i <= NV; i++){ const t = i/NV, a = Math.PI*t; const z = (Z0 + Z1)/2 - Math.cos(a)*(Z1 - Z0)/2*0.995;
      const s = Math.sin(a), y = WH + (RT - WH)*Math.pow(s, 0.62); prof.push([z, y]); }
    const RX0 = X0 + 1.2, RX1 = X1 - 1.2;
    for (let i = 0; i < NV; i++){ const [z0, y0] = prof[i], [z1, y1] = prof[i + 1];
      T.q(i % 2 ? ROOF : ROOF2, [RX0, y0, z0], [RX1, y0, z0], [RX1, y1, z1], [RX0, y1, z1]); }
    // roof ribs (the trusses read through the metal)
    for (let k = 0; k <= 20; k++){ const x = RX0 + (RX1 - RX0)*k/20;
      for (let i = 0; i < NV; i++){ const [z0, y0] = prof[i], [z1, y1] = prof[i + 1];
        T.q(SLATE, [x - 0.25, y0 + 0.08, z0], [x + 0.25, y0 + 0.08, z0], [x + 0.25, y1 + 0.08, z1], [x - 0.25, y1 + 0.08, z1]); } }
    T.abox(GLZ, RX0 + 6, RT - 0.3, -6, RX1 - 6, RT + 1.6, 1.0); T.abox(ROOF, RX0 + 5.5, RT + 1.6, -6.4, RX1 - 5.5, RT + 1.9, 1.4);
    // arched end walls of the roof: glazed fan (corrugated panels) in a brick frame
    for (const x of [RX0 - 0.6, RX1 + 0.6]){ const s = x < 0 ? -1 : 1;
      for (let i = 0; i < NV; i++){ const [z0, y0] = prof[i], [z1, y1] = prof[i + 1];
        T.q(GLZ, [x, WH, z0], [x, WH, z1], [x, y1, z1], [x, y0, z0]); }
      for (let k = 1; k < 10; k++){ const z = Z0 + (Z1 - Z0)*k/10, yt = prof.reduce((m, p) => Math.abs(p[0] - z) < Math.abs(m[0] - z) ? p : m)[1];
        T.box(BR2, x + s*0.1, WH, z, 0, 1, 0.5, yt - WH, 0.5); } }
    // corner turrets of the hall
    for (const [x, z] of [[X0, Z0], [X1, Z0], [X0, Z1], [X1, Z1]]){ T.cyl(BR, x, F, z, 3.0, WH + 5, 10); T.cyl(ST, x, WH + 0.5, z, 3.5, 0.8, 10);
      nb2Merlons(T, (() => { const p = []; for (let i = 0; i < 10; i++){ const a = i/10*Math.PI*2; p.push([x + Math.cos(a)*3.3, z + Math.sin(a)*3.3]); } return p; })(), WH + 5, 1.3, 1.0, 0.9, 0.6, BR); }
    // north-east stair tower (the footprint's notch)
    T.prism(BR, nb2Rect(80.0, -62.8, 89.8, -49.7), F, WH + 7, true, SLATE); nb2Merlons(T, nb2Rect(80.0, -62.8, 89.8, -49.7), WH + 7, 1.4, 1.4, 1.0, 0.7, BR);
    nb2Win(T, nb2Rect(80.0, -62.8, 89.8, -49.7), {y0:2, y1:WH + 5, fh:5, bw:3.2, wf:0.3, hf:0.6, col:WIN, on:e => e.nz < -0.5 || e.nx > 0.5});
    // ---- the headhouse (south front): office wing x -49.5..49.2, z 40..53.6 ----
    const HH = [[-55.5, 39.5], [55.9, 39.5], [55.9, 49.4], [49.2, 53.6], [-49.5, 53.6], [-55.5, 51.7]], HHT = 15.5;
    T.prism(BR, HH, F, HHT, true, SLATE); nb2Band(T, HH, F, 5.0, 0.3, BR2);
    nb2Band(T, HH, HHT - 1.6, 0.7, 0.45, ST); nb2Merlons(T, HH, HHT, 1.5, 1.6, 1.1, 0.8, BR, e => e.nz > 0.3);
    nb2Win(T, HH, {y0:1.0, y1:HHT - 2.5, fh:6.0, bw:4.2, wf:0.42, hf:0.62, col:WIN, frame:ST, on:e => e.nz > 0.5,
      skip:(e, k, nb) => Math.abs((k + 0.5)/nb - 0.5)*e.L < 15});
    // the entrance between the round towers: a stone-framed arch with the iron gates, the plain terracotta panel above
    T.abox(ST, -6.0, F, 53.4, 6.0, 12.5, 54.4); T.abox('#2a2522', -3.4, -2.3, 54.2, 3.4, 6.2, 54.6);
    for (let i = 0; i < 6; i++){ const t0 = i/6*Math.PI, t1 = (i + 1)/6*Math.PI; T.t('#2a2522', [0, 6.2, 54.6], [Math.cos(t0)*3.4, 6.2 + Math.sin(t0)*3.4, 54.6], [Math.cos(t1)*3.4, 6.2 + Math.sin(t1)*3.4, 54.6]); }
    T.abox('#a6553f', -3.6, 10.0, 54.4, 3.6, 12.0, 54.7);
    nb2Merlons(T, nb2Rect(-6.0, 53.4, 6.0, 54.4), 12.5, 1.2, 1.2, 0.8, 1.0, ST);
    // two tall semi-engaged round towers with conical roofs flanking the entrance
    for (const x of [-9.3, 9.7]){ const z = 58.5; T.cyl(BR, x, F, z, 4.9, 30.5 - F, 16); T.cyl(ST, x, 22.5, z, 5.3, 0.9, 16);
      for (let k = 0; k < 4; k++) T.cyl(ST, x, 23.4 + k*0.3, z, 5.3 + k*0.22, 0.3, 16);
      T.cyl(SLATE, x, 30.5, z, 5.6, 8.5, 16, 0.15); T.cyl(ST, x, 39.0, z, 0.15, 1.6, 6, 0.05);
      nb2Win(T, (() => { const p = []; for (let i = 0; i < 16; i++){ const a = i/16*Math.PI*2; p.push([x + Math.cos(a)*4.9, z + Math.sin(a)*4.9]); } return p; })(),
        {y0:2, y1:22, fh:5.5, bw:4, wf:0.3, hf:0.55, col:WIN, min:1.5, on:e => e.nz > 0.3}); }
    // low round towers with cupolas at the ends of the headhouse, and square towers where it meets the hall
    for (const [x, z] of [[-61.6, 45.9], [60.6, 45.3]]){ T.cyl(BR, x, F, z, 3.9, 21 - F, 14); T.cyl(ST, x, 20.0, z, 4.3, 0.8, 14);
      T.cyl(SLATE, x, 21, z, 4.4, 4.5, 14, 1.6); T.cyl(CU, x, 25.5, z, 1.6, 2.2, 8); T.cyl(CU, x, 27.7, z, 1.9, 1.6, 8, 0.1); }
    for (const x of [-52.5, 52.5]){ T.prism(BR, nb2Rect(x - 4, 36.5, x + 4, 44.5), F, 25.5, true, SLATE); nb2Band(T, nb2Rect(x - 4, 36.5, x + 4, 44.5), 23.5, 0.6, 0.35, ST);
      nb2Merlons(T, nb2Rect(x - 4, 36.5, x + 4, 44.5), 25.5, 1.4, 1.3, 1.0, 0.6, BR);
      nb2Win(T, nb2Rect(x - 4, 36.5, x + 4, 44.5), {y0:3, y1:22, fh:5.5, bw:4, wf:0.3, hf:0.6, col:WIN, on:e => e.nz > 0.5}); }
    T.abox(BR2, -3.6, -2.7, 54.4, 3.6, -2.3, 57.0);                                     // entrance landing
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nykingsbridge', lat:40.8683548, lon:-73.8981877, rot:-0.5309});
// =====================================================================================================================
// Brooklyn Navy Yard — two compact keys so the hulls stay tight:
//  nynavyyard   Building 77 (1942): the 16-storey, once windowless, poured-concrete warehouse (≈ 104 x 55 m, 64 m to the
//               roof, the mechanical penthouse above); flat pilaster strips, the wartime blank walls now cut with a regular grid
//               of windows, the loading-dock canopy at the base. Frame: x along the long side (north), z across (east = -z).
//  nynavyyard_b Dock 72 (2018, S9 Architecture): the long 16-storey office slab on the old dry-dock site, raised over the flood
//               zone on rows of V-shaped columns under its ship-shaped underbelly, white frame grid with dark glass, terraced
//               green setbacks stepping down towards the water, the exposed social stairs, the rooftop pavilion. Frame: x along the slab (south-east), z across.
LANDMARKS.nynavyyard = {zh:'布鲁克林海军造船厂', en:'Brooklyn Navy Yard', cat:'old', r:62, h:70,
  lt:{m:0, c:'#ffe2b8', k:0.35, e:0.6},
  build(){
    const g = new THREE.Group(), T = nb2TB();
    const CON = '#c3bcae', CON2 = '#b3ab9c', CON3 = '#a59d8e', ROOF = '#8a8780', WIN = {c:'#39414a', m:1, fh:4.0, cw:3.2}, STL = '#4e5254';
    const X = 51.9, Z = 27.6, TOP = 64.0, F = -4.0;
    const P = nb2Rect(-X, -Z, X, Z);
    T.prism(CON, P, F, TOP, true, ROOF);
    nb2Band(T, P, F, 5.0, 0.25, CON3);
    nb2Band(T, P, TOP - 1.2, 1.2, 0.3, CON2);
    // pilaster strips and the window grid (16 floors)
    for (const e of nb2Edges(P)){ const nb = Math.round(e.L/6.5), bw = e.L/nb;
      for (let k = 0; k <= nb; k++){ const u = bw*k; T.box(CON2, e.a[0] + e.ux*u + e.nx*0.25, 4.5, e.a[1] + e.uz*u + e.nz*0.25, e.ux, e.uz, 1.1, TOP - 5.7, 0.5); }
      for (let f = 1; f < 16; f++){ const y = 4.5 + (f - 1)*3.72;
        for (let k = 0; k < nb; k++){ const u0 = bw*k;
          for (const du of [0.28, 0.72]) nb2Win1(T, e, u0 + bw*du, bw*0.3, y + 0.9, y + 2.9, WIN, 0.06); } }
      // ground floor: loading bays
      for (let k = 0; k < nb; k++) nb2Win1(T, e, bw*(k + 0.5), bw*0.6, 0.2, 3.6, '#4b4d4f', 0.06); }
    // loading dock canopy along the east side
    T.abox(STL, -40, 4.2, -Z - 3.5, 40, 4.6, -Z); for (let x = -38; x <= 38; x += 8) T.abox(STL, x - 0.15, 0, -Z - 3.4, x + 0.15, 4.2, -Z - 3.1);
    // mechanical penthouse and the water tank structure on the roof
    T.prism(CON2, nb2Rect(-20, -14, 20, 14), TOP, TOP + 5.5, true, ROOF); nb2Band(T, nb2Rect(-20, -14, 20, 14), TOP + 5.0, 0.5, 0.2, CON);
    T.abox(CON3, 26, TOP, -10, 36, TOP + 3.2, 4); T.cyl(STL, -32, TOP, 8, 3.2, 4.5, 10);
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nynavyyard', lat:40.6985659, lon:-73.9711496, rot:1.5140});

LANDMARKS.nynavyyard_b = {zh:'72号码头大楼', en:'Dock 72', cat:'new', r:88, h:62, label:false,
  lt:{m:1, c:'#ffe7c4', k:0.6},
  build(){
    const g = new THREE.Group(), T = nb2TB();
    const WH = {c:'#e4e3de', m:0}, WH2 = {c:'#cfcdc6', m:0}, GL = {c:'#2f3e4c', m:1, fh:3.4, cw:3.0}, GL2 = {c:'#40566a', m:1, fh:3.4, cw:3.0}, GRN = {c:'#5d7d48', m:0}, ROOF = {c:'#8d8b85', m:0}, COL = {c:'#d8d6cf', m:0}, STAIR = {c:'#c8452f', m:0};
    const L = 81.2, D = 13.6, F = -2.0, B = 8.0, FH = 3.35;          // raised base: first office floor at 8 m
    // floors: [x0, x1] per level (terraced setbacks at both ends)
    const NF = 14, top = B + NF*FH;
    const span = f => { const s0 = f >= 6 ? (f - 5)*5.6 : 0, s1 = f >= 12 ? (f - 11)*4.5 : 0; return [-L + s0, L - s1]; };   // steps down to the water (-x)
    for (let f = 0; f < NF; f++){ const [x0, x1] = span(f), y = B + f*FH;
      // glass band
      T.abox(f % 3 === 1 ? GL2 : GL, x0 + 0.35, y + 0.4, -D + 0.35, x1 - 0.35, y + FH, D - 0.35);
      // slab edge (white frame)
      T.abox(WH, x0, y, -D, x1, y + 0.45, D);
      // vertical fins of the grid every 3 m
      for (let x = x0; x <= x1 + 0.01; x += (x1 - x0)/Math.round((x1 - x0)/3.05)) for (const z of [-D, D]) T.box(WH2, x, y + 0.4, z, 1, 0, 0.35, FH - 0.4, 0.5);
      for (const x of [x0, x1]) for (let z = -D; z <= D + 0.01; z += 2*D/9) T.box(WH2, x, y + 0.4, z, 0, 1, 0.35, FH - 0.4, 0.5);
      // green terraces on the setbacks
      if (f >= 6){ const [px0, px1] = span(f - 1); if (x0 > px0) T.abox(GRN, px0 + 0.4, y + 0.45, -D + 0.6, x0 - 0.2, y + 0.9, D - 0.6); if (x1 < px1) T.abox(GRN, x1 + 0.2, y + 0.45, -D + 0.6, px1 - 0.4, y + 0.9, D - 0.6); } }
    const [tx0, tx1] = span(NF - 1);
    T.abox(ROOF, tx0, top, -D, tx1, top + 0.5, D);
    // rooftop event pavilion (glass box with a white roof plate) and a planted deck
    T.abox(GL2, tx0 + 6, top + 0.5, -D + 3, tx0 + 26, top + 5.0, D - 3); T.abox(WH, tx0 + 4.5, top + 5.0, -D + 1.8, tx0 + 27.5, top + 5.6, D - 1.8);
    T.abox(GRN, tx0 + 28, top + 0.5, -D + 1, tx1 - 4, top + 0.9, D - 1);
    // the raised base: recessed glazed lobby on V-shaped columns
    T.abox({c:'#33424e', glow:'#ffe3bb', gk:0.5}, -L + 6, F, -D + 4.5, L - 6, B, D - 4.5);
    T.abox(WH, -L, B - 0.9, -D, L, B, D);
    // the ship-shaped underbelly: the soffit drops like a hull towards the centre line
    for (const s of [-1, 1]) T.q(WH2, [-L, B - 0.9, s*D], [L, B - 0.9, s*D], [L - 6, B - 2.6, s*2], [-L + 6, B - 2.6, s*2]);
    T.q(WH2, [-L + 6, B - 2.6, -2], [L - 6, B - 2.6, -2], [L - 6, B - 2.6, 2], [-L + 6, B - 2.6, 2]);
    for (const s of [-1, 1]){ const x = s*L, x2 = s*(L - 6); T.t(WH2, [x, B - 0.9, -D], [x, B - 0.9, D], [x2, B - 2.6, 2]); T.t(WH2, [x, B - 0.9, -D], [x2, B - 2.6, 2], [x2, B - 2.6, -2]); }
    const nv = 13;
    for (let k = 0; k <= nv; k++){ const x = -L + 4 + (2*L - 8)*k/nv;
      for (const z of [-D + 1.2, D - 1.2]){ for (const s of [-1, 1]){
        const a = [x, 0, z], b = [x + s*3.0, B - 0.9, z];
        T.q(COL, [a[0] - 0.45, F, a[2] - 0.45], [a[0] + 0.45, F, a[2] - 0.45], [b[0] + 0.45, b[1], b[2] - 0.45], [b[0] - 0.45, b[1], b[2] - 0.45]);
        T.q(COL, [a[0] + 0.45, F, a[2] + 0.45], [a[0] - 0.45, F, a[2] + 0.45], [b[0] - 0.45, b[1], b[2] + 0.45], [b[0] + 0.45, b[1], b[2] + 0.45]);
        T.q(COL, [a[0] - 0.45, F, a[2] + 0.45], [a[0] - 0.45, F, a[2] - 0.45], [b[0] - 0.45, b[1], b[2] - 0.45], [b[0] - 0.45, b[1], b[2] + 0.45]);
        T.q(COL, [a[0] + 0.45, F, a[2] - 0.45], [a[0] + 0.45, F, a[2] + 0.45], [b[0] + 0.45, b[1], b[2] + 0.45], [b[0] + 0.45, b[1], b[2] - 0.45]); } } }
    // exposed social stairs behind the glass on the long faces (warm-coloured zigzag)
    for (const z of [-D + 0.7, D - 0.7]) for (const x0 of [-35, 18]) for (let f = 0; f < 9; f++){ const y = B + f*FH, xs = x0 + (f % 2)*6;
      T.q(STAIR, [xs, y + 0.5, z], [xs + 6, y + FH, z], [xs + 6, y + FH + 0.4, z], [xs, y + 0.9, z]); }
    // waterside entrance canopy and the ferry landing walk at the north-west end
    T.abox(WH, -L - 6, B - 2.2, -6, -L, B - 1.8, 6);
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nynavyyard_b', lat:40.7007740, lon:-73.9725399, rot:-0.8529});
// =====================================================================================================================
// Brooklyn Academy of Music — two keys:
//  nybam    the Peter Jay Sharp Building (1908, Herts & Tallant; 30 Lafayette Avenue): Renaissance Revival, a high grey granite
//           base with the five entrance arches under the glass marquee (lights only, no letters), cream brick with polychrome
//           terracotta above: the tall arched windows of the piano nobile between paired pilasters, the coloured terracotta
//           frieze (plain tiles, no lettering), the deep bracketed cornice; the light court splitting the upper floors, the fly
//           tower of the opera house at the back. Frame: x along Lafayette Avenue (east), -z = north = the front.
//  nybam_b  the Harvey Theater (1904, the former Majestic; 651 Fulton Street): the tall red-brick auditorium box with the
//           stage house, the arched-window entrance block on Fulton Street and its marquee frame. label:false.
LANDMARKS.nybam = {zh:'布鲁克林音乐学院', en:'Brooklyn Academy of Music', cat:'old', r:46, h:31,
  lt:{m:0, c:'#ffe1b4', k:0.6, e:0.5},
  build(){
    const g = new THREE.Group(), T = nb2TB();
    const CREAM = '#e3d6b6', CREAM2 = '#d4c5a2', GRAN = '#8f8c86', GRAN2 = '#7c7974', TC = '#c9a77a', ROOF = '#7f7d78';
    const BLUE = '#4f7c95', GREEN = '#6f8f63', OCHRE = '#c79a45', WIN = {c:'#2b2f33', glow:'#ffd59a', gk:0.4}, GLOW = {c:'#e8e4d8', glow:'#fff1d0', gk:1.2};
    const P = [[-26.3,-29.9],[27.8,-30.0],[27.8,30.8],[5.6,30.8],[5.6,-11.0],[0.7,-10.9],[0.7,30.8],[-28.4,30.8]], H = 21.7, F = -3.0;
    T.prism(CREAM, P, F, H, true, ROOF);
    const E = nb2Edges(P), front = e => e.nz < -0.9;
    // granite base
    nb2Band(T, P, F, 3.0 + 4.6, 0.3, GRAN);
    nb2Band(T, P, 4.4, 0.5, 0.45, GRAN2);
    // front: five entrance arches in the base, the marquee
    const fe = E[0];
    for (let k = 0; k < 5; k++){ const u = fe.L*(0.18 + 0.16*k); nb2Win1(T, fe, u, 3.2, -1.5, 1.6, '#3a2f28', 0.32, true); }
    T.abox('#d9d7d0', -22, 2.6, -33.4, 22, 3.0, -29.6); T.abox(GLOW, -21.6, 2.45, -33.2, 21.6, 2.62, -29.8);
    for (const x of [-21, -7, 7, 21]) T.abox('#3b3d3f', x - 0.12, -1.8, -33.2, x + 0.12, 2.6, -33.0);
    // piano nobile: seven tall arched windows between paired pilasters, terracotta surrounds
    for (let k = 0; k < 7; k++){ const u = 7 + (fe.L - 14)*(k + 0.5)/7;
      nb2Win1(T, fe, u, 3.0, 6.2, 12.6, WIN, 0.12, true, TC);
      T.box(TC, fe.a[0] + fe.ux*u + fe.nx*0.2, 6.0, fe.a[1] + fe.uz*u + fe.nz*0.2, fe.ux, fe.uz, 4.0, 0.35, 0.4);
      for (const s of [-1, 1]) T.box(CREAM2, fe.a[0] + fe.ux*(u + s*2.65) + fe.nx*0.22, 5.0, fe.a[1] + fe.uz*(u + s*2.65) + fe.nz*0.22, fe.ux, fe.uz, 0.7, 10.4, 0.45); }
    // end pavilions: square windows in pairs
    for (const u of [3.4, fe.L - 3.4]) for (const y of [6.4, 10.4]) nb2Win1(T, fe, u, 1.6, y, y + 2.4, WIN, 0.1, false, TC);
    // polychrome terracotta frieze (plain coloured tiles, no lettering) and the bracketed cornice
    nb2Band(T, P, 15.2, 0.4, 0.25, TC, front);
    { const n = 26; for (let k = 0; k < n; k++){ const u = 1 + (fe.L - 2)*(k + 0.5)/n, col = [BLUE, OCHRE, GREEN, OCHRE][k % 4];
        T.box(col, fe.a[0] + fe.ux*u + fe.nx*0.1, 15.8, fe.a[1] + fe.uz*u + fe.nz*0.1, fe.ux, fe.uz, (fe.L - 2)/n*0.8, 2.0, 0.2); } }
    nb2Band(T, P, 18.2, 0.6, 0.6, TC); nb2Band(T, P, 18.8, 1.1, 1.3, CREAM2, front); nb2Band(T, P, 19.9, 0.5, 1.5, TC, front);
    for (let k = 0; k <= 30; k++){ const u = fe.L*k/30; T.box(TC, fe.a[0] + fe.ux*u + fe.nx*0.7, 18.4, fe.a[1] + fe.uz*u + fe.nz*0.7, fe.ux, fe.uz, 0.35, 0.9, 1.2); }
    T.abox(CREAM, -26.3, H, -30.0, 27.8, H + 1.4, -28.6);                                    // parapet / attic band
    for (let k = 0; k < 8; k++){ const x = -24 + k*6.8; T.abox(OCHRE, x - 0.6, H + 1.4, -30.0, x + 0.6, H + 2.3, -29.0); }
    // sides and back: segmental windows on three upper floors
    nb2Win(T, P, {y0:5.2, y1:H - 3, fh:4.6, bw:3.6, wf:0.42, hf:0.58, col:WIN, on:e => !front(e) && e.L > 8});
    nb2Band(T, P, H - 1.2, 0.6, 0.35, TC, e => !front(e));
    // fly tower of the opera house (west half, back) and the roof structures
    const FT = nb2Rect(-25, 10, -4, 29.5);
    T.prism(CREAM2, FT, H, 31.0, true, ROOF); nb2Band(T, FT, 30.2, 0.8, 0.25, TC);
    T.abox('#8a8780', 10, H, 0, 22, H + 3.2, 14); T.abox('#8a8780', -20, H, -18, -10, H + 2.4, -8);
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nybam', lat:40.6864657, lon:-73.9776977, rot:0.1503});

LANDMARKS.nybam_b = {zh:'BAM 哈维剧院', en:'BAM Harvey Theater', cat:'old', r:50, h:30, label:false,
  lt:{m:0, c:'#ffd6a6', k:0.45, e:0.4},
  build(){
    const g = new THREE.Group(), T = nb2TB();
    const BR = '#8a4c3a', BR2 = '#77402f', ST = '#cdbfa4', ROOF = '#6f6d69', WIN = {c:'#2c2c2e', glow:'#ffcf8e', gk:0.35}, GLOW = {c:'#e8e2d2', glow:'#fff0cc', gk:1.3};
    // the auditorium box (-15.2..15.2, -18.2..18.3), the stage house at its north end
    const A = nb2Rect(-15.2, -18.2, 15.2, 18.3);
    T.prism(BR, A, -3, 23.5, true, ROOF); nb2Band(T, A, 22.5, 1.0, 0.3, BR2);
    for (const e of nb2Edges(A)){ const n = Math.round(e.L/4.5); for (let k = 0; k <= n; k++){ const u = e.L*k/n; T.box(BR2, e.a[0] + e.ux*u + e.nx*0.25, 0, e.a[1] + e.uz*u + e.nz*0.25, e.ux, e.uz, 0.9, 22.5, 0.5); } }
    T.prism(BR, nb2Rect(-14.5, -18.2, 14.5, -6), 23.5, 29.5, true, ROOF); nb2Band(T, nb2Rect(-14.5, -18.2, 14.5, -6), 28.8, 0.7, 0.25, BR2);
    // the entrance block on Fulton Street (14 m): brick with stone trim, arched windows, the marquee frame (lights, no letters)
    const L = [[-33.8,30.3],[-22.8,13.9],[-22.9,-1.7],[-15.2,-1.6],[-15.2,18.3],[-16.7,18.3],[-27.6,34.4]];
    T.prism(BR, L, -3, 14.1, true, ROOF); nb2Band(T, L, 13.2, 0.9, 0.35, ST); nb2Band(T, L, -3, 6.5, 0.2, '#6d6a66');
    const EL = nb2Edges(L), fr = EL[6];                                                       // the Fulton Street face (from (-27.6,34.4) to (-33.8,30.3))
    nb2Win(T, L, {y0:4.5, y1:12.5, fh:8, bw:3.4, wf:0.55, hf:0.85, col:WIN, arch:true, on:e => e.i === 6 || e.i === 0 || e.i === 5});
    { const e = EL[6], mid = e.L/2, cx = e.a[0] + e.ux*mid + e.nx*1.6, cz = e.a[1] + e.uz*mid + e.nz*1.6;     // marquee over the door
      T.box('#2f3133', cx, 4.0, cz, e.ux, e.uz, e.L*0.8, 1.2, 3.0); T.box(GLOW, cx + e.nx*1.52, 4.15, cz + e.nz*1.52, e.ux, e.uz, e.L*0.76, 0.9, 0.05);
      T.box(GLOW, cx, 3.85, cz, e.ux, e.uz, e.L*0.76, 0.15, 2.8);
      nb2Win1(T, e, mid, e.L*0.6, 0.0, 3.6, {c:'#3a3530', glow:'#ffe2b0', gk:0.8}, 0.08); }
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nybam_b', lat:40.6885847, lon:-73.9786935, rot:0.1070});
// =====================================================================================================================
// Staten Island Borough Hall (1904-06, Carrère & Hastings; 10 Richmond Terrace, St. George): a Louis XIII chateau in red
// brick with limestone quoins, window surrounds and a rusticated base; the harbour front with its central block between two
// projecting pavilions, all under steep slate mansard roofs with dormers; the raised court reached by a long flight of stairs
// from the ferry side; the tall clock tower rising from the centre of the west elevation (clock faces, open lantern, domed
// copper cap). Frame: -z = east-north-east = the harbour front, +z = the west elevation with the tower.
LANDMARKS.nysiborohall = {zh:'史泰登岛区政厅', en:'Staten Island Borough Hall', cat:'old', r:36, h:46,
  lt:{m:0, c:'#ffdcae', k:0.6, e:0.45},
  build(){
    const g = new THREE.Group(), T = nb2TB();
    const BR = '#9b4a37', LS = '#dcd3bf', LS2 = '#c9bfa8', SL = '#4b5056', CU = '#5f8b79', WIN = {c:'#2b2e31', glow:'#ffd59a', gk:0.35}, CLK = {c:'#efe9d8', glow:'#fff3d6', gk:1.0};
    const F = -8.0, B0 = -0.5, EV = 11.0;                       // foundation, top of the rusticated base, eaves
    const P = [[-29.4,11.0],[-29.2,-17.8],[-16.4,-17.8],[-16.4,-8.4],[17.7,-8.3],[17.7,-16.6],[29.7,-16.5],[29.6,11.9],[19.2,11.8],[19.1,13.9],[-17.7,13.9],[-17.7,10.9]];
    T.prism(BR, P, F, EV, false);
    nb2Band(T, P, F, B0 - F, 0.25, LS);                                                    // rusticated limestone base
    for (let y = -5; y < B0; y += 0.9) nb2Band(T, P, y, 0.12, 0.3, LS2);
    nb2Band(T, P, B0, 0.45, 0.35, LS2); nb2Band(T, P, 5.0, 0.3, 0.12, LS); nb2Band(T, P, EV - 0.8, 0.8, 0.5, LS);
    // limestone quoins at every corner
    for (const p of P) for (let y = B0 + 0.4; y < EV - 0.8; y += 1.1) T.box(LS, p[0], y, p[1], 1, 0, 1.4 - (Math.round(y/1.1) % 2)*0.5, 0.55, 1.4 - (Math.round(y/1.1) % 2)*0.5);
    // windows: two storeys with limestone surrounds, arched on the main floor; base windows
    nb2Win(T, P, {y0:B0 + 0.4, y1:EV - 1.0, fh:5.1, bw:3.3, wf:0.42, hf:0.68, sill:0.16, col:WIN, frame:LS, min:5, edge:1.2});
    nb2Win(T, P, {y0:-4.2, y1:B0 - 0.3, fh:3.8, bw:3.3, wf:0.36, hf:0.55, col:WIN, min:5, edge:1.2, on:e => e.nz < -0.5});
    // mansard roofs: central block and the two pavilions (taller)
    nb2Mans(T, SL, -17.7, -8.4, 19.2, 13.9, EV, 6.5, 3.2, '#5a5f64');
    for (const [x0, x1, z0, z1] of [[-29.4, -16.4, -17.8, 11.0], [17.7, 29.7, -16.6, 11.9]]){
      T.abox(BR, x0, EV, z0, x1, EV + 0.6, z1); nb2Mans(T, SL, x0, z0, x1, z1, EV + 0.6, 7.6, 3.6, '#5a5f64');
      T.abox(LS2, (x0 + x1)/2 - 0.3, EV + 8.2, z0 + 4, (x0 + x1)/2 + 0.3, EV + 8.9, z1 - 4);
      for (const [cx, cz] of [[x0 + 2.5, z0 + 6], [x1 - 2.5, z1 - 6]]) T.abox(BR, cx - 0.7, EV + 4, cz - 0.7, cx + 0.7, EV + 9.6, cz + 0.7); }
    // dormers on the mansards (harbour side and west side)
    const dorm = (x, z, nz) => { T.box(LS, x, EV + 0.6, z, 1, 0, 2.0, 3.0, 1.6); T.box(WIN, x, EV + 1.0, z + nz*0.82, 1, 0, 1.2, 1.9, 0.02);
      T.q(LS2, [x - 1.1, EV + 3.6, z - 0.9], [x + 1.1, EV + 3.6, z - 0.9], [x, EV + 4.6, z - 0.9], [x, EV + 4.6, z - 0.9]); T.box(LS2, x, EV + 3.4, z, 1, 0, 2.3, 0.3, 1.8); };
    for (let x = -13; x <= 15; x += 4) { dorm(x, -6.6, -1); dorm(x, 12.2, 1); }
    for (const x of [-25.5, -20.3, 21.6, 26.0]) dorm(x, x < 0 ? -16.0 : -14.8, -1);
    // the raised court between the pavilions (harbour side) with balustrade and the long flight of stairs
    T.abox(LS2, -16.4, F, -17.5, 17.7, B0 - 0.6, -8.4);
    for (let x = -16; x <= 17.3; x += 0.9) T.abox(LS, x - 0.12, B0 - 0.6, -17.6, x + 0.12, B0 + 0.4, -17.4);
    T.abox(LS, -16.4, B0 + 0.4, -17.7, -4.2, B0 + 0.7, -17.3); T.abox(LS, 5.5, B0 + 0.4, -17.7, 17.7, B0 + 0.7, -17.3);
    for (let k = 0; k < 12; k++){ const y = B0 - 0.6 - k*0.42, z = -17.5 - k*0.55; T.abox(LS2, -4.2, F, z - 0.55, 5.5, y, z); }
    // entrance portal in the centre of the harbour block
    T.abox(LS, -3.5, B0, -8.9, 4.8, 8.2, -8.2); nb2Win1(T, {a:[-3.5, -8.95], ux:1, uz:0, nx:0, nz:-1}, 4.15, 2.6, B0 + 0.2, 4.6, '#3c2f27', 0.02, true);
    // ---- the clock tower on the west elevation ----
    const tx = 0.7, tz = 10.5, tw = 7.4;
    const TW = nb2Rect(tx - tw/2, tz - tw/2, tx + tw/2, tz + tw/2);
    T.prism(LS2, TW, F, B0, false); T.prism(BR, TW, B0, 31.0, false); nb2Band(T, TW, EV - 0.8, 0.8, 0.5, LS);
    for (const p of TW) for (let y = EV; y < 30; y += 1.1) T.box(LS, p[0], y, p[1], 1, 0, 1.3 - (Math.round(y/1.1) % 2)*0.45, 0.55, 1.3 - (Math.round(y/1.1) % 2)*0.45);
    nb2Win(T, TW, {y0:EV + 1, y1:24, fh:4.8, bw:7.4, wf:0.28, hf:0.62, col:WIN, frame:LS, arch:true});
    nb2Band(T, TW, 24.4, 0.6, 0.35, LS); nb2Band(T, TW, 30.4, 0.9, 0.55, LS);
    for (const e of nb2Edges(TW)){ const cx = e.a[0] + e.ux*e.L/2 + e.nx*0.08, cz = e.a[1] + e.uz*e.L/2 + e.nz*0.08;   // clock faces (plain discs)
      for (let i = 0; i < 16; i++){ const a0 = i/16*Math.PI*2, a1 = (i + 1)/16*Math.PI*2, r = 2.3, yc = 27.6;
        T.t(CLK, [cx, yc, cz], [cx + e.ux*Math.cos(a0)*r, yc + Math.sin(a0)*r, cz + e.uz*Math.cos(a0)*r], [cx + e.ux*Math.cos(a1)*r, yc + Math.sin(a1)*r, cz + e.uz*Math.cos(a1)*r]); }
      T.box('#2a2a2a', cx + e.nx*0.05, 27.5, cz + e.nz*0.05, e.ux, e.uz, 0.18, 1.7, 0.05); T.box('#2a2a2a', cx + e.nx*0.06, 27.5, cz + e.nz*0.06, e.ux, e.uz, 1.3, 0.18, 0.05); }
    // open lantern: corner piers, arches, balustrade; domed copper cap with a finial
    T.abox(LS2, tx - 3.9, 31.3, tz - 3.9, tx + 3.9, 31.8, tz + 3.9);
    for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) T.abox(LS, tx + dx*3.2 - 0.6, 31.8, tz + dz*3.2 - 0.6, tx + dx*3.2 + 0.6, 37.0, tz + dz*3.2 + 0.6);
    T.abox(SL, tx - 2.5, 31.8, tz - 2.5, tx + 2.5, 37.0, tz + 2.5);
    T.abox(LS, tx - 3.9, 37.0, tz - 3.9, tx + 3.9, 37.8, tz + 3.9);
    T.lathe(CU, tx, 37.8, tz, [[3.7, 0], [3.6, 1.2], [3.1, 2.6], [2.2, 3.9], [1.0, 4.8], [0.35, 5.2], [0.3, 6.6], [0.0, 7.6]], 12);
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nysiborohall', lat:40.6424108, lon:-74.0760510, rot:-1.0318});
// =====================================================================================================================
// Newark Penn Station (1935-37, McKim, Mead & White; Raymond Plaza): the Art Deco / stripped-Classical limestone headhouse on
// Raymond Plaza West — grey Indiana limestone on a pink granite base, the two full-height arched entrances in pink granite
// surrounds under pediment parapets with lit clocks, tall tripartite windows between stylised pilasters, the plain frieze (no
// lettering), the marquee over the southern doors — and behind it the elevated track level: the concrete viaduct deck carried
// over Market Street, the bus lanes and Raymond Boulevard on rows of columns (the streets stay open), the enclosed concourse
// under the middle, buff brick platform walls with window bands and the arched steel train shed with its skylight over the
// middle, five island platforms with butterfly canopies beyond it (lit at night), lamp posts. Frame: x along the tracks (north-east), -z = north-west = Raymond Plaza West.
LANDMARKS.nynewarkpenn = {zh:'纽瓦克宾州车站', en:'Newark Penn Station', cat:'old', r:198, h:27,
  lt:{m:0, c:'#ffe2b8', k:0.55, e:0.5},
  build(){
    const g = new THREE.Group(), T = nb2TB();
    const LS = '#d8cfbb', LS2 = '#c5bba5', CONC = '#a9a59c', CONC2 = CONC, ROOF = '#7c7a75', STL = '#4f565c', CAN = '#6b7177', BALL = '#5b5650', PLAT = '#b3aea3';
    const WIN = {c:'#2b3034', glow:'#ffd9a2', gk:0.45}, CLK = {c:'#eee6d2', glow:'#fff2d0', gk:1.2}, BUFF = '#cdb27e', SHED = '#6b7177', GLASS = {c:'#9fb3bd', glow:'#ffe6c0', gk:0.4}, LAMP = {c:'#f0ead8', glow:'#fff2d2', gk:1.6}, BRZ = {c:'#4f4130', glow:'#ffc775', gk:0.3};
    const F = -6.5, DB = 2.4, DT = 3.4;                                // street foundation, deck bottom / top (street ≈ -3.5 .. -5)
    // ---- the track deck: x -190..170, z -34..40, supported by columns; enclosed concourse under the middle ----
    const DK = [[-191.9,-10.9],[-182.2,-13.1],[-86.5,-28.5],[-19.9,-33.8],[72.0,-37.5],[122.8,-36.2],[173.0,-33.3],[169.4,38.3],[-5.4,38.3],[-53.3,38.7],[-126.4,43.4],[-129.0,39.8],[-184.5,46.0],[-192.8,-7.5]];
    T.prism(CONC, DK, DB, DT, true, BALL); nb2Band(T, DK, DT, 1.1, 0.05, CONC2);          // deck slab + parapet
    // columns on a grid under the deck except where the enclosed concourse is
    const zAt = (x, lo) => { let best = lo ? -1e9 : 1e9; for (const e of nb2Edges(DK)){ const x0 = Math.min(e.a[0], e.b[0]), x1 = Math.max(e.a[0], e.b[0]); if (x < x0 || x > x1 || x1 - x0 < 1) continue;
      const z = e.a[1] + (e.b[1] - e.a[1])*(x - e.a[0])/(e.b[0] - e.a[0]); if (lo ? (z < 0 && z > best) : (z > 0 && z < best)) best = z; } return best; };
    // streets and bus lanes that pass under the deck (local polylines from the ref): no columns within 4 m of them
    const RD = [[[-122,-110],[-88,-58],[-78,-41]], [[-36,39],[-20,52],[-22,38],[-64,-30],[-78,-41],[-76,-29],[-40,32],[-36,39]], [[131,50],[137,5],[136,-14],[133,-27],[123,-51],[113,-66]],
      [[104,-78],[115,-47],[125,-21],[130,3]], [[-164,-18],[-148,-29],[-121,-41],[-98,-55],[-88,-58]], [[-39,40],[-40,50]], [[86,-57],[81,-37]], [[86,-57],[91,-38]], [[86,-57],[101,-37]],
      [[101,-37],[113,-8],[113,38]], [[101,-37],[102,38]], [[113,38],[113,49]], [[102,38],[103,49]], [[92,39],[92,48]], [[81,38],[81,48]], [[128,-39],[136,-52]], [[184,-35],[152,-39],[128,-39]], [[77,-3],[113,-3]]];
    const nearRoad = (x, z) => { for (const L of RD) for (let i = 0; i + 1 < L.length; i++){ const a = L[i], b = L[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx*dx + dz*dz || 1;
      const t = Math.max(0, Math.min(1, ((x - a[0])*dx + (z - a[1])*dz)/l2)); if (Math.hypot(x - a[0] - dx*t, z - a[1] - dz*t) < 4.5) return true; } return false; };
    for (let x = -186; x <= 166; x += 10){ const z0 = zAt(x, true) + 1.5, z1 = zAt(x, false) - 1.5; if (!(z1 > z0)) continue;
      const enclosed = x > -12 && x < 74;
      for (let z = z0; z <= z1 + 0.01; z += (z1 - z0)/Math.max(1, Math.round((z1 - z0)/12))){ if (enclosed || nearRoad(x, z)) continue; T.box(CONC2, x, F, z, 1, 0, 1.2, DB - F, 1.2); } }
    // enclosed concourse under the middle of the deck (limestone/brick walls with windows)
    const CC = nb2Rect(-12, -34, 74, 38);
    T.prism(LS2, CC, F, DB, false); nb2Win(T, CC, {y0:-3.5, y1:DB - 0.5, fh:5.5, bw:4.5, wf:0.6, hf:0.75, col:WIN, on:e => e.nz > 0.5 || Math.abs(e.nx) > 0.5});
    // ---- the headhouse on Raymond Plaza West: grey limestone on a pink granite base, two full-height arched entrances with
    //      pediment parapets and clocks, tall tripartite windows between stylised pilasters, the plain frieze (no lettering) ----
    const HHW = nb2Rect(-20.2, -59.6, 71.9, -33.8), HH = 19.5, PINK = '#b98f84';
    T.prism(LS, HHW, F, HH, true, ROOF); nb2Band(T, HHW, F, 3.6, 0.3, PINK); nb2Band(T, HHW, HH - 3.0, 2.2, 0.2, LS2); nb2Band(T, HHW, HH - 0.4, 0.5, 0.4, LS);
    const fe = nb2Edges(HHW)[0], fz = -59.6;                                                   // the plaza front (z = -59.6), from x -20.2 to 71.9
    const ARCH = [6.5, 46.5];                                                                   // centres of the two arches
    // pilasters and tall tripartite windows (aluminium-trimmed, flower spandrels) in the bays between and beside the arches
    for (let x = -18; x <= 70; x += 6.0){ if (ARCH.some(ax => Math.abs(x - ax) < 8.5)) continue;
      T.abox(LS2, x - 0.5, -2.4, fz - 0.6, x + 0.5, HH - 3.2, fz);
      if (x + 6 <= 70 && !ARCH.some(ax => Math.abs(x + 3 - ax) < 8.5)){ const cx = x + 3;
        for (const dx of [-1.3, 0, 1.3]) T.abox(WIN, cx + dx - 0.55, 0.6, fz - 0.08, cx + dx + 0.55, 11.0, fz - 0.02);
        T.abox(LS2, cx - 2.0, 5.6, fz - 0.14, cx + 2.0, 6.4, fz - 0.06); T.abox(LS2, cx - 2.0, 11.0, fz - 0.14, cx + 2.0, 11.4, fz - 0.06);
        T.abox(WIN, cx - 1.9, 12.4, fz - 0.08, cx + 1.9, 14.8, fz - 0.02); } }
    for (const ax of ARCH){
      // pink granite surround, the arch opening (glazed above the doors), pediment parapet with the clock
      T.abox(PINK, ax - 7.0, -2.4, fz - 0.9, ax + 7.0, HH + 1.0, fz - 0.1);
      const A = []; for (let i = 0; i <= 12; i++){ const t = Math.PI*i/12; A.push([ax + Math.cos(t)*4.6, 11.5 + Math.sin(t)*4.6]); }
      T.abox(WIN, ax - 4.6, -2.3, fz - 1.0, ax + 4.6, 11.5, fz - 0.92);
      for (let i = 0; i < 12; i++) T.t(WIN, [ax, 11.5, fz - 1.0], [A[i][0], A[i][1], fz - 1.0], [A[i + 1][0], A[i + 1][1], fz - 1.0]);
      for (let k = 0; k < 4; k++) T.abox(BRZ, ax - 4.0 + k*2.1, -2.3, fz - 1.06, ax - 2.4 + k*2.1, 1.6, fz - 1.0);
      for (let i = 0; i < 12; i += 2) T.box(LS2, (A[i][0] + A[i + 1][0])/2, (A[i][1] + A[i + 1][1])/2 - 0.3, fz - 1.1, 1, 0, 0.5, 0.6, 0.3);
      T.q(LS, [ax - 7.4, HH + 1.0, fz - 0.95], [ax + 7.4, HH + 1.0, fz - 0.95], [ax, HH + 4.8, fz - 0.95], [ax, HH + 4.8, fz - 0.95]);
      T.q(LS, [ax + 7.4, HH + 1.0, fz - 0.95], [ax + 7.4, HH + 1.0, fz + 1.0], [ax, HH + 4.8, fz + 1.0], [ax, HH + 4.8, fz - 0.95]);
      T.q(LS, [ax - 7.4, HH + 1.0, fz + 1.0], [ax - 7.4, HH + 1.0, fz - 0.95], [ax, HH + 4.8, fz - 0.95], [ax, HH + 4.8, fz + 1.0]);
      T.abox(LS, ax - 7.4, HH, fz - 0.95, ax + 7.4, HH + 1.0, fz + 1.0);
      for (let i = 0; i < 16; i++){ const a0 = i/16*Math.PI*2, a1 = (i + 1)/16*Math.PI*2, r = 1.25, yc = HH + 2.1;
        T.t(CLK, [ax, yc, fz - 1.0], [ax + Math.cos(a0)*r, yc + Math.sin(a0)*r, fz - 1.0], [ax + Math.cos(a1)*r, yc + Math.sin(a1)*r, fz - 1.0]); } }
    // marquee over the southern doors
    T.abox(LS2, ARCH[0] - 6, 2.4, -63.2, ARCH[0] + 6, 2.9, fz - 1.0); T.abox(LAMP, ARCH[0] - 5.7, 2.25, -63.0, ARCH[0] + 5.7, 2.4, fz - 1.2);
    // ---- the platform level: buff brick enclosure walls with window bands and the arched steel train shed over the middle ----
    const SX0 = -40, SX1 = 95, SZ0 = -33.6, SZ1 = 37.6, SW = DT + 7.0, SC_ = DT + 11.5;
    for (const z of [SZ0, SZ1]){ T.abox(BUFF, SX0, DT, z - 0.35, SX1, SW, z + 0.35);
      T.abox(GLASS, SX0 + 1, DT + 3.2, z + (z < 0 ? -0.4 : 0.36), SX1 - 1, DT + 5.6, z + (z < 0 ? -0.36 : 0.4)); }
    const NS = 12, sh = []; for (let i = 0; i <= NS; i++){ const t = i/NS; sh.push([SZ0 + (SZ1 - SZ0)*t, SW + (SC_ - SW)*Math.sin(Math.PI*t)]); }
    for (let i = 0; i < NS; i++){ const [z0, y0] = sh[i], [z1, y1] = sh[i + 1]; const sky = i === NS/2 - 1 || i === NS/2;
      T.q(sky ? GLASS : SHED, [SX0, y0, z0], [SX1, y0, z0], [SX1, y1, z1], [SX0, y1, z1]); }
    for (let x = SX0; x <= SX1 + 0.1; x += (SX1 - SX0)/15) for (let i = 0; i < NS; i++){ const [z0, y0] = sh[i], [z1, y1] = sh[i + 1];
      T.q(STL, [x - 0.3, y0 - 0.9, z0], [x + 0.3, y0 - 0.9, z0], [x + 0.3, y1 - 0.9, z1], [x - 0.3, y1 - 0.9, z1]); T.q(STL, [x - 0.3, y0 + 0.05, z0], [x + 0.3, y0 + 0.05, z0], [x + 0.3, y1 + 0.05, z1], [x - 0.3, y1 + 0.05, z1]); }
    for (const x of [SX0, SX1]) for (let i = 0; i < NS; i++){ const [z0, y0] = sh[i], [z1, y1] = sh[i + 1]; T.q(BUFF, [x, SW, z0], [x, SW, z1], [x, y1, z1], [x, y0, z0]); }
    // ---- the platforms and canopies on the deck ----
    const PZ = [-25, -10, 5, 20, 33], xStart = zz => { for (let x = -190; x < 60; x += 2) if (zAt(x, true) < zz && zAt(x, false) > zz) return x + 2; return 60; };
    for (const pz of PZ){ const xa = Math.max(-150, xStart(pz - 4)), xb = 160;
      T.abox(PLAT, xa, DT, pz - 3.0, xb, DT + 1.1, pz + 3.0);
      for (let x = xa + 5; x <= xb - 5; x += 10){ if (x > SX0 - 1 && x < SX1 + 1) continue; T.box(STL, x, DT + 1.1, pz, 1, 0, 0.3, 4.2, 0.3); }
      // butterfly roof: two planes sloping to the centre gutter
      for (const [c0, c1] of [[xa + 2, SX0 - 1], [SX1 + 1, xb - 2]]){ if (c1 - c0 < 5) continue;
        T.q(CAN, [c0, DT + 5.9, pz - 4.0], [c1, DT + 5.9, pz - 4.0], [c1, DT + 5.3, pz], [c0, DT + 5.3, pz]);
        T.q(CAN, [c0, DT + 5.3, pz], [c1, DT + 5.3, pz], [c1, DT + 5.9, pz + 4.0], [c0, DT + 5.9, pz + 4.0]);
        T.abox(LAMP, c0 + 1, DT + 5.05, pz - 0.25, c1 - 1, DT + 5.25, pz + 0.25); }              // light strip under the gutter
      T.abox(LAMP, SX0 + 2, SW - 0.4, pz - 0.25, SX1 - 2, SW - 0.2, pz + 0.25);                // lamps hung in the shed
      // stair / elevator heads down to the concourse
      for (const x of [0, 30, 60]) T.abox(LS2, x - 3, DT + 1.1, pz - 1.6, x + 3, DT + 4.3, pz + 1.6); }
    // rails between the platforms
    for (const z of [-31.5, -17.5, -2.5, 12.5, 26.5]) for (const dz of [-1.6, 1.6]){ const xa = xStart(z + dz - 1);
      T.abox(BALL, xa, DT, z + dz - 0.75, 168, DT + 0.12, z + dz + 0.75);
      for (const s of [-0.72, 0.72]) T.abox(STL, xa, DT + 0.12, z + dz + s - 0.04, 168, DT + 0.3, z + dz + s + 0.04); }
    // catenary masts every 40 m along the outer edges
    for (let x = -180; x <= 160; x += 40){ for (const z of [-33.5, 44]) { if (z > 40 && x < -130) continue; T.box(STL, x, DT, z, 1, 0, 0.35, 8.5, 0.35); }
      T.box(STL, x, DT + 8.2, 5, 0, 1, 77, 0.3, 0.3); }
    // lamp posts on Raymond Plaza West
    for (let x = -14; x <= 68; x += 12){ T.box(STL, x, -2.8, -62.6, 1, 0, 0.16, 5.0, 0.16); T.box(LAMP, x, 2.2, -62.6, 1, 0, 0.5, 0.6, 0.5); }
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nynewarkpenn', lat:40.7342281, lon:-74.1643355, rot:0.7389});
// =====================================================================================================================
// Fort Wadsworth (Staten Island, under the Verrazzano-Narrows Bridge) — two keys:
//  nyfortwadsworth    Battery Weed (1847-61): the granite water battery on The Narrows, a trapezoid of three seaward faces with
//                     round corner bastions, three tiers of casemate gunports plus the barbette parapet on top, the casemate
//                     arcades facing the parade, the low gorge wall with the sally port and the gate house; the small light
//                     tower (Fort Wadsworth Light) on the north-east bastion. Frame: rot 0.7277, the seaward faces at +x.
//  nyfortwadsworth_b  Fort Tompkins (1847-76): the pentagonal granite fort on the bluff above — high outer walls with musket
//                     loopholes, the casemated ranges round the sunken parade with their arched doors and windows, the
//                     earth-covered (grass) roof, the sally port on the landward point. label:false. The walls follow the
//                     ground (embedded terrain grid; the bluff falls away at the north-west corner).
LANDMARKS.nyfortwadsworth = {zh:'沃兹沃斯堡', en:'Fort Wadsworth', cat:'old', r:80, h:22,
  lt:{m:0, c:'#ffe4be', k:0.5, e:0.6},
  build(){
    const g = new THREE.Group(), T = nb2TB();
    const GR = '#bdb6a8', GR2 = '#a9a294', GR3 = '#8f897d', DK = '#2a2826', GRASS = '#6f8a52', LAMP = {c:'#f3eedf', glow:'#fff4d4', gk:2.0}, WH = '#e9e6de';
    const P = [[6.8,-75.0],[7.9,-74.8],[10.4,-69.3],[11.3,-69.9],[19.9,-55.5],[16.7,-50.0],[35.1,-18.7],[39.5,-18.5],[42.3,-14.4],[42.3,-9.7],[39.5,-5.7],[34.9,-5.2],[11.3,36.0],[13.5,39.7],[11.2,44.5],[7.5,46.8],[1.7,46.5],[-0.1,42.9],[-47.9,42.9],[-49.9,47.0],[-62.4,48.1],[-62.8,47.5],[-50.6,27.9],[-45.0,27.8],[-43.7,25.6],[-43.0,25.7],[-36.6,14.3],[-27.3,19.6],[-33.7,31.6],[-8.7,31.0],[-6.3,30.3],[-3.8,28.9],[-4.2,27.9],[-3.5,26.0],[-1.5,24.9],[0.3,25.4],[1.0,26.3],[4.8,23.2],[7.6,19.4],[20.6,-4.4],[21.4,-7.6],[21.2,-9.0],[20.4,-9.1],[18.8,-10.6],[18.8,-12.8],[20.3,-14.6],[21.2,-14.6],[20.5,-20.0],[18.8,-24.0],[8.2,-42.1],[1.2,-30.9],[-7.8,-36.4],[-4.3,-42.4],[-6.6,-47.3],[-3.0,-53.6],[-3.6,-54.4]];
    const F = -5.0, TOP = 14.0;
    T.prism(GR, P, F, TOP, true, GR2);
    nb2Band(T, P, F, 1.8, 0.4, GR3);                                                      // footing at the water line
    nb2Band(T, P, TOP - 0.6, 0.6, 0.3, GR2);                                              // coping
    // outer (seaward) faces: three tiers of casemate embrasures; parade faces: arcades
    const E = nb2Edges(P), cx = 6, cz = 0;
    const outer = e => { const mx = (e.a[0] + e.b[0])/2 - cx, mz = (e.a[1] + e.b[1])/2 - cz; return e.nx*mx + e.nz*mz > 0 && e.L > 6; };
    for (const e of E){ if (e.L < 5) continue; const n = Math.floor(e.L/3.4);
      for (let k = 0; k < n; k++){ const u = e.L*(k + 0.5)/n;
        if (outer(e)){ for (const y of [0.6, 4.6, 8.6]){ nb2Win1(T, e, u, 0.9, y, y + 1.2, DK, 0.06); T.box(GR2, e.a[0] + e.ux*u + e.nx*0.12, y - 0.3, e.a[1] + e.uz*u + e.nz*0.12, e.ux, e.uz, 1.6, 0.3, 0.25); } }
        else { if (k % 2) continue; for (const y of [-0.5, 3.6, 7.7]) nb2Win1(T, e, u, 2.2, y, y + 2.2, DK, 0.06, true, GR2); } } }
    // string courses between the tiers and the barbette parapet with embrasure notches on the outer faces
    nb2Band(T, P, 3.4, 0.35, 0.2, GR2, outer); nb2Band(T, P, 7.4, 0.35, 0.2, GR2, outer); nb2Band(T, P, 11.4, 0.4, 0.25, GR2, outer);
    for (const e of E){ if (!outer(e)) continue; const n = Math.floor(e.L/4.5);
      for (let k = 0; k < n; k++){ const u = e.L*(k + 0.5)/n; T.box(GR, e.a[0] + e.ux*u - e.nx*0.6, TOP, e.a[1] + e.uz*u - e.nz*0.6, e.ux, e.uz, 3.0, 1.4, 1.2); } }
    // gorge wall with the sally port closing the parade on the land side, the gate house
    const ga = [-3.6, -54.4], gb = [-50.6, 27.9], gl = Math.hypot(gb[0] - ga[0], gb[1] - ga[1]), gux = (gb[0] - ga[0])/gl, guz = (gb[1] - ga[1])/gl;
    T.box(GR, (ga[0] + gb[0])/2, F, (ga[1] + gb[1])/2, gux, guz, gl, 6.5 - F, 2.2);
    T.box(GR2, (ga[0] + gb[0])/2, 6.5, (ga[1] + gb[1])/2, gux, guz, gl, 0.5, 2.6);
    { const mx = ga[0] + gux*gl*0.47, mz = ga[1] + guz*gl*0.47; T.box(GR2, mx, F, mz, gux, guz, 7, 9.5 - F, 3.2); T.box(DK, mx - guz*1.62, 0, mz + gux*1.62, gux, guz, 3.2, 4.0, 0.05); T.box(DK, mx + guz*1.62, 0, mz - gux*1.62, gux, guz, 3.2, 4.0, 0.05); }
    const GH = [[-17.0,-18.5],[-8.7,-13.7],[-17.7,2.0],[-26.0,-2.8]];
    T.prism(GR, GH, F, 7.0, true, GR2);
    { const gh = nb2Off(GH, 0.4); const yy = 7.0; for (let i = 0; i < 4; i++){ const a = gh[i], b = gh[(i + 1) % 4]; T.q('#5b5e60', [a[0], yy, a[1]], [b[0], yy, b[1]], [(-17.3 + b[0])/2, yy + 2.6, (-8.2 + b[1])/2], [(-17.3 + a[0])/2, yy + 2.6, (-8.2 + a[1])/2]); } }
    nb2Win(T, GH, {y0:0, y1:6.5, fh:3.2, bw:3.0, wf:0.4, hf:0.6, col:DK});
    // the parade: grass inside the walls
    T.flat(GRASS, [[-36.6,14.3],[-27.3,19.6],[-33.7,31.6],[-8.7,31.0],[7.6,19.4],[20.6,-4.4],[18.8,-24.0],[8.2,-42.1],[1.2,-30.9],[-7.8,-36.4],[-4.3,-42.4],[-3.6,-54.4],[-27,-14]], -2.2);
    // Fort Wadsworth Light: a short white tower with the lantern on the north-east bastion
    T.cyl(WH, 37.0, TOP, -11.8, 1.9, 6.0, 10, 1.6); T.cyl('#3a3a3a', 37.0, TOP + 6.0, -11.8, 2.2, 0.4, 10);
    T.cyl(LAMP, 37.0, TOP + 6.4, -11.8, 1.2, 1.7, 8); T.cyl('#4a4d4f', 37.0, TOP + 8.1, -11.8, 1.5, 1.2, 8, 0.15);
    for (let k = 0; k < 10; k++){ const a = k/10*Math.PI*2; T.box('#3a3a3a', 37.0 + Math.cos(a)*2.1, TOP + 6.4, -11.8 + Math.sin(a)*2.1, 1, 0, 0.08, 1.0, 0.08); }
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nyfortwadsworth', lat:40.6055112, lon:-74.0541716, rot:0.7277});

LANDMARKS.nyfortwadsworth_b = {zh:'汤普金斯堡', en:'Fort Tompkins', cat:'old', r:100, h:8, label:false,
  lt:{m:0, c:'#ffe1b8', k:0.45, e:0.55},
  build(){
    const g = new THREE.Group(), T = nb2TB();
    const GR = '#b7b0a1', GR2 = '#a39c8e', DK = '#2a2826', GRASS = '#6d8750', GRASS2 = '#7b9659', EARTH = '#7d7a5c';
    const gnd = nb2Gnd({"x0":-100.0,"z0":-40.0,"st":10.0,"nx":21,"v":[-33.0,-29.1,-25.3,-21.6,-17.9,-14.2,-10.6,-7.0,-5.9,-5.8,-6.9,-8.2,-9.0,-9.1,-8.5,-7.4,-5.6,-4.8,-4.6,-4.2,-3.8,-29.8,-25.9,-22.1,-18.3,-14.6,-11.0,-7.3,-5.5,-5.4,-5.3,-5.2,-5.7,-6.5,-6.7,-6.4,-5.3,-4.6,-4.4,-4.1,-3.8,-3.3,-25.0,-22.6,-18.8,-15.1,-11.3,-7.7,-5.2,-5.0,-4.9,-4.8,-4.7,-4.7,-4.7,-5.0,-4.8,-4.2,-4.1,-4.0,-3.7,-3.4,-3.0,-19.7,-17.9,-15.5,-11.7,-8.0,-4.8,-4.7,-4.6,-4.5,-4.4,-4.3,-4.2,-4.1,-4.0,-3.9,-3.9,-3.8,-3.7,-3.4,-3.1,-2.7,-14.9,-13.2,-11.0,-8.2,-4.6,-4.3,-4.2,-4.1,-4.0,-3.9,-3.8,-3.7,-3.6,-3.5,-3.6,-3.6,-3.6,-3.4,-3.2,-2.9,-2.5,-10.7,-9.2,-7.1,-4.4,-3.8,-3.8,-3.7,-3.6,-3.5,-3.4,-3.3,-3.2,-3.1,-3.1,-3.2,-3.3,-3.4,-3.2,-3.0,-2.8,-2.4,-7.1,-5.7,-3.7,-2.8,-3.1,-3.2,-3.2,-3.1,-3.0,-2.9,-2.8,-2.7,-2.6,-2.7,-2.8,-2.9,-3.1,-3.2,-3.0,-2.7,-2.4,-4.0,-2.8,-1.8,-2.2,-2.4,-2.6,-2.6,-2.6,-2.5,-2.4,-2.3,-2.2,-2.2,-2.3,-2.4,-2.5,-2.6,-2.8,-3.0,-2.7,-2.5,-1.6,-0.8,-1.2,-1.6,-1.9,-2.1,-2.2,-2.1,-2.0,-1.9,-1.8,-1.8,-1.8,-1.9,-1.9,-2.0,-2.2,-2.3,-2.5,-2.7,-2.7,0.3,-0.3,-0.8,-1.2,-1.5,-1.7,-1.8,-1.8,-1.6,-1.4,-1.3,-1.3,-1.3,-1.4,-1.5,-1.6,-1.7,-1.8,-2.0,-2.4,-2.6,0.7,0.1,-0.4,-0.9,-1.2,-1.4,-1.5,-1.5,-1.4,-1.3,-1.0,-0.8,-0.9,-0.9,-1.0,-1.1,-1.2,-1.3,-1.7,-2.1,-2.4]});
    const P = [[-81.6,37.2],[-94.0,-33.2],[93.7,-33.2],[81.5,37.0],[0.2,51.5]];
    const TOP = 5.5, ROOFT = 7.0, PAR = -2.5, D = 17;                        // wall top, roof crest, parade level, range depth
    const IN = nb2Off(P, -D);
    // outer walls: granite down to the ground (a tall retaining face where the bluff falls away)
    const segs = 6;
    for (const e of nb2Edges(P)){ const n = Math.max(2, Math.ceil(e.L/segs));
      for (let k = 0; k < n; k++){ const u0 = e.L*k/n, u1 = e.L*(k + 1)/n, a = [e.a[0] + e.ux*u0, e.a[1] + e.uz*u0], b = [e.a[0] + e.ux*u1, e.a[1] + e.uz*u1];
        const sa = gnd(a[0], a[1]) - 1.2, sb = gnd(b[0], b[1]) - 1.2;
        T.q(GR, [a[0], sa, a[1]], [b[0], sb, b[1]], [b[0], TOP, b[1]], [a[0], TOP, a[1]]);
        for (let y = -8; y > Math.min(sa, sb) + 1; y -= 6) T.q(GR2, [a[0] + e.nx*0.25, Math.max(y - 0.4, sa), a[1] + e.nz*0.25], [b[0] + e.nx*0.25, Math.max(y - 0.4, sb), b[1] + e.nz*0.25], [b[0] + e.nx*0.25, Math.max(y, sb), b[1] + e.nz*0.25], [a[0] + e.nx*0.25, Math.max(y, sa), a[1] + e.nz*0.25]);
        // musket loopholes in two rows
        const m = Math.max(1, Math.round((u1 - u0)/3));
        for (let j = 0; j < m; j++){ const u = u0 + (u1 - u0)*(j + 0.5)/m; for (const y of [-1.2, 2.2]) if (y > Math.max(sa, sb) + 0.8) nb2Win1(T, e, u, 0.35, y, y + 1.3, DK, 0.05); } } }
    nb2Band(T, P, TOP - 0.5, 0.5, 0.35, GR2); nb2Band(T, P, 1.0, 0.3, 0.15, GR2);
    // the earth-covered roof of the casemate ranges: from the outer parapet up to the crest and down to the inner walls
    const MID = nb2Off(P, -D*0.45), n = P.length;
    for (let i = 0; i < n; i++){ const j = (i + 1) % n;
      T.q(GRASS, [P[i][0], TOP, P[i][1]], [P[j][0], TOP, P[j][1]], [MID[j][0], ROOFT, MID[j][1]], [MID[i][0], ROOFT, MID[i][1]]);
      T.q(GRASS2, [MID[i][0], ROOFT, MID[i][1]], [MID[j][0], ROOFT, MID[j][1]], [IN[j][0], TOP - 0.5, IN[j][1]], [IN[i][0], TOP - 0.5, IN[i][1]]); }
    // inner walls of the ranges round the parade: arched doors and windows; the sunken grass parade
    T.prism(GR, IN, PAR - 0.5, TOP - 0.5, false);
    nb2Win(T, IN, {y0:PAR, y1:TOP - 1.2, fh:3.6, bw:4.2, wf:0.38, hf:0.7, col:DK, arch:true, out:-0.07, frame:GR2});
    T.flat(GRASS2, IN, PAR - 0.4);
    // the sally port on the landward point
    { const a = P[4]; T.box(GR2, a[0], gnd(a[0], a[1]) - 1, a[1] - 1.5, 1, 0, 9, TOP + 1.8 - gnd(a[0], a[1]) + 1, 4); T.box(DK, a[0], gnd(a[0], a[1]), a[1] + 0.6, 1, 0, 3.4, 3.6, 0.1); }
    // a few chimneys / ventilators on the roof
    for (const [x, z] of [[-40, -15], [0, -18], [40, -15], [-45, 22], [45, 22]]) T.abox(GR2, x - 0.8, ROOFT - 1, z - 0.8, x + 0.8, ROOFT + 1.4, z + 0.8);
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nyfortwadsworth_b', lat:40.6050303, lon:-74.0565215, rot:-0.8915});
// =====================================================================================================================
// Loew's Paradise Theatre (1929, John Eberson; 2403 Grand Concourse, the Bronx): the atmospheric movie palace. On the Grand
// Concourse the cream terracotta Baroque frontispiece — two storeys of Corinthian pilasters with blue and salmon accents, the
// clock niche over the centre bay (the horse-and-rider group is left out), balustrades over the outer bays, urns on the
// parapet, the curved pediment — over the marquee (frame and bulbs only, no letters) and the sunburst panel; the three-storey
// lobby block, the two-storey shop range to the south, and behind them the tall brick auditorium (wedge-shaped inside, the
// stage house at the south end) reaching to Creston Avenue. Frame: +z = east-south-east = the Grand Concourse, +x = north.
LANDMARKS.nyparadise = {zh:'洛氏天堂剧院', en:"Loew's Paradise Theatre", cat:'old', r:46, h:27,
  lt:{m:0, c:'#ffdcae', k:0.55, e:0.45},
  build(){
    const g = new THREE.Group(), T = nb2TB();
    const BR = '#9a5a43', BR2 = '#86503b', TC = '#eadcc0', TC2 = '#d9c8a6', BLUE = '#4f78a8', SALM = '#d99a84', ROOF = '#6f6c67';
    const WIN = {c:'#2c2f33', glow:'#ffd294', gk:0.4}, BULB = {c:'#f6eccf', glow:'#fff0c8', gk:2.2}, SUN = {c:'#e8c86a', glow:'#ffd76e', gk:1.4}, SHOP = {c:'#4f5a5d', glow:'#ffe0b0', gk:0.9};
    const F = -2.5, P = [[-32.3,-27.5],[31.6,-26.6],[31.6,2.4],[34.5,2.4],[34.6,26.3],[-33.5,26.3]];
    // the auditorium: the whole back of the lot, tall brick box, stage house at the south (-x) end
    const AU = [[-32.3,-27.5],[31.6,-26.6],[31.6,10.5],[-33.0,10.5]];
    T.prism(BR, AU, F, 21.0, true, ROOF); nb2Band(T, AU, 20.2, 0.8, 0.3, TC2); nb2Band(T, AU, F, 3.0, 0.2, BR2);
    for (const e of nb2Edges(AU)){ const n = Math.round(e.L/6); for (let k = 0; k <= n; k++){ const u = e.L*k/n; T.box(BR2, e.a[0] + e.ux*u + e.nx*0.2, 0, e.a[1] + e.uz*u + e.nz*0.2, e.ux, e.uz, 1.0, 20.2, 0.4); } }
    T.prism(BR, nb2Rect(-32.3, -26.5, -18, 10.0), 21.0, 26.5, true, ROOF); nb2Band(T, nb2Rect(-32.3, -26.5, -18, 10.0), 25.9, 0.6, 0.25, TC2);
    // shop range (south of the lobby) on the Concourse: two storeys, shopfronts
    const SR = [[-33.0, 10.5], [-1.0, 10.5], [-1.0, 26.3], [-33.5, 26.3]];
    T.prism(TC2, SR, F, 9.5, true, ROOF); nb2Band(T, SR, 8.8, 0.7, 0.35, TC); nb2Band(T, SR, 3.9, 0.35, 0.25, TC);
    nb2Win(T, SR, {y0:4.3, y1:8.4, fh:4.1, bw:3.2, wf:0.6, hf:0.75, col:WIN, on:e => e.nz > 0.5});
    { const e = nb2Edges(SR)[2]; const n = 6; for (let k = 0; k < n; k++) nb2Win1(T, e, e.L*(k + 0.5)/n, e.L/n*0.8, -1.7, 3.5, SHOP, 0.06); }
    // lobby block: three storeys of brick with terracotta trim
    const LB = [[-1.0, 10.5], [34.5, 10.5], [34.6, 26.3], [-1.0, 26.3]];
    T.prism(BR, LB, F, 15.5, true, ROOF); nb2Band(T, LB, 14.8, 0.7, 0.35, TC); nb2Band(T, LB, F, 3.2, 0.25, TC2);
    nb2Win(T, LB, {y0:4.0, y1:14.2, fh:5.0, bw:3.4, wf:0.45, hf:0.6, col:WIN, frame:TC2, on:e => e.nz < -0.5 || e.nx > 0.5});
    // the frontispiece on the Concourse (x -1..34.6 at z 26.3): cream terracotta, pilasters, pediment, clock niche
    const zf = 26.3, x0 = 1.0, x1 = 33.0, cx = (x0 + x1)/2;
    T.abox(TC, x0, F, zf - 0.6, x1, 20.0, zf + 0.6);
    T.abox(TC2, x0 - 0.3, 4.8, zf, x1 + 0.3, 5.5, zf + 1.0); T.abox(TC2, x0 - 0.3, 17.3, zf, x1 + 0.3, 18.3, zf + 1.4);
    for (let k = 0; k <= 8; k++){ const x = x0 + 1 + (x1 - x0 - 2)*k/8;                    // Corinthian pilasters with capitals
      T.abox(TC2, x - 0.45, 5.5, zf + 0.6, x + 0.45, 16.6, zf + 1.1); T.abox(BLUE, x - 0.6, 16.6, zf + 0.6, x + 0.6, 17.3, zf + 1.25); }
    for (let k = 0; k < 8; k++){ const x = x0 + 1 + (x1 - x0 - 2)*(k + 0.5)/8; if (k === 3 || k === 4) continue;
      T.abox(WIN, x - 1.1, 7.0, zf + 0.62, x + 1.1, 11.0, zf + 0.7); T.abox(WIN, x - 1.1, 12.3, zf + 0.62, x + 1.1, 15.6, zf + 0.7);
      T.abox(SALM, x - 1.3, 11.3, zf + 0.62, x + 1.3, 12.0, zf + 0.75); }
    // centre bay: tall arched window under the clock niche
    nb2Win1(T, {a:[cx - 5, zf + 0.6], ux:1, uz:0, nx:0, nz:1}, 5, 3.6, 6.5, 12.0, WIN, 0.12, true, TC2);
    T.abox(TC2, cx - 2.6, 13.6, zf + 0.6, cx + 2.6, 19.8, zf + 1.6); T.abox('#7a6a55', cx - 1.8, 14.0, zf + 1.55, cx + 1.8, 18.6, zf + 1.65);
    for (let i = 0; i < 14; i++){ const a0 = i/14*Math.PI*2, a1 = (i + 1)/14*Math.PI*2, r = 1.25, yc = 16.4;   // clock face (plain)
      T.t({c:'#f2ead6', glow:'#fff3d8', gk:0.9}, [cx, yc, zf + 1.7], [cx + Math.cos(a0)*r, yc + Math.sin(a0)*r, zf + 1.7], [cx + Math.cos(a1)*r, yc + Math.sin(a1)*r, zf + 1.7]); }
    // balustrades over the outer bays, urns, the curved pediment (segmental) with blue tympanum
    for (const [a, b] of [[x0, cx - 5], [cx + 5, x1]]){ T.abox(TC2, a, 20.0, zf - 0.4, b, 20.3, zf + 0.6);
      for (let x = a + 0.4; x < b; x += 0.8) T.abox(TC, x - 0.15, 20.3, zf - 0.2, x + 0.15, 21.2, zf + 0.3); T.abox(TC2, a, 21.2, zf - 0.4, b, 21.5, zf + 0.6); }
    for (const x of [x0 + 0.5, cx - 5, cx + 5, x1 - 0.5]){ T.cyl(TC2, x, 21.5, zf, 0.45, 0.5, 8); T.lathe(TC, x, 22.0, zf, [[0.3, 0], [0.6, 0.5], [0.55, 1.1], [0.25, 1.4], [0.35, 1.6], [0, 1.9]], 8); }
    { const n = 12, r = 6.2, y0 = 20.0; for (let i = 0; i < n; i++){ const a0 = Math.PI*(0.15 + 0.7*i/n), a1 = Math.PI*(0.15 + 0.7*(i + 1)/n);
        const p0 = [cx + Math.cos(a0)*r, y0 - 3.6 + Math.sin(a0)*r], p1 = [cx + Math.cos(a1)*r, y0 - 3.6 + Math.sin(a1)*r];
        T.q(TC2, [p0[0], p0[1], zf - 0.5], [p1[0], p1[1], zf - 0.5], [p1[0], p1[1] + 0.8, zf - 0.5], [p0[0], p0[1] + 0.8, zf - 0.5]);
        T.q(TC2, [p0[0], p0[1] + 0.8, zf - 0.5], [p1[0], p1[1] + 0.8, zf - 0.5], [p1[0], p1[1] + 0.8, zf + 1.3], [p0[0], p0[1] + 0.8, zf + 1.3]);
        T.q(TC2, [p0[0], p0[1], zf + 1.3], [p1[0], p1[1], zf + 1.3], [p1[0], p1[1] + 0.8, zf + 1.3], [p0[0], p0[1] + 0.8, zf + 1.3]);
        T.t(BLUE, [cx, y0, zf + 1.25], [p0[0], Math.max(y0, p0[1]), zf + 1.25], [p1[0], Math.max(y0, p1[1]), zf + 1.25]); } }
    // the marquee: a deep canopy with rows of bulbs (no letters) and the sunburst panel above the doors
    T.abox('#d9d2bf', x0 + 4, 4.0, zf + 0.6, x1 - 4, 5.2, zf + 5.2); T.abox(BULB, x0 + 4.1, 3.85, zf + 0.8, x1 - 4.1, 4.0, zf + 5.0);
    for (const yy of [4.25, 4.75]) T.abox(BULB, x0 + 4, yy, zf + 5.2, x1 - 4, yy + 0.14, zf + 5.3);
    for (const xx of [x0 + 4, x1 - 4]) for (const yy of [4.25, 4.75]) T.abox(BULB, xx - 0.07, yy, zf + 0.6, xx + 0.07, yy + 0.14, zf + 5.2);
    T.abox(BLUE, cx - 4.5, 5.6, zf + 1.1, cx + 4.5, 6.4, zf + 1.3);
    for (let i = 0; i < 9; i++){ const a = Math.PI*(i + 0.5)/9, w = 0.07; T.t(SUN, [cx, 6.45, zf + 1.36], [cx + Math.cos(a - w)*4.2, 6.45 + Math.sin(a - w)*2.4, zf + 1.36], [cx + Math.cos(a + w)*4.2, 6.45 + Math.sin(a + w)*2.4, zf + 1.36]); }
    for (let k = 0; k < 5; k++) T.abox({c:'#4b3b2a', glow:'#ffd08a', gk:0.6}, cx - 7 + k*2.9 - 1.1, -1.9, zf + 0.62, cx - 7 + k*2.9 + 1.1, 3.4, zf + 0.7);
    // roof plant over the lobby (as built: air-conditioning housings)
    T.abox('#8b8781', 10, 15.5, 12.5, 22, 18.0, 20.5);
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nyparadise', lat:40.8605721, lon:-73.8988479, rot:1.1914});
// =====================================================================================================================
// MoMA PS1 (the 1892-1906 First Ward School, Long Island City): four storeys of Romanesque Revival red brick with terracotta
// string courses, round-arched windows on the top floor and segmental ones below, the heavy cornice, the U-shaped plan opening
// to the courtyard, the square corner tower (once with the clock and bell) under its pyramidal cap; the grey concrete
// courtyard walls (the triangular walled court towards Jackson Avenue) and the small Brutalist concrete entrance addition.
// Frame: +x = north-north-east (46th Avenue side), -z = west-north-west (21st Street), the U opens to +z.
LANDMARKS.nyps1 = {zh:'MoMA PS1 当代艺术中心', en:'MoMA PS1', cat:'old', r:48, h:28,
  lt:{m:0, c:'#ffd9a6', k:0.5, e:0.5},
  build(){
    const g = new THREE.Group(), T = nb2TB();
    const BR = '#a04a35', BR2 = '#8c3f2d', TC = '#c99d74', ST = '#b9ad98', ROOF = '#5c5a57', CONC = '#a9a7a1', CONC2 = '#94928c', WIN = {c:'#2a2d30', glow:'#ffe0b0', gk:0.35};
    const P = [[-29.4,-19.0],[30.6,-19.0],[30.6,-10.2],[30.2,-10.3],[30.3,23.6],[13.1,23.7],[13.1,-7.9],[7.6,-8.0],[7.6,-4.0],[1.3,-4.0],[1.2,-8.0],[-6.6,-8.0],[-6.6,20.0],[-10.1,20.1],[-10.2,23.4],[-24.7,23.5],[-24.7,20.1],[-29.2,20.1]];
    const F = -2.5, H = 18.0;
    T.prism(BR, P, F, H, true, ROOF);
    nb2Band(T, P, F, 3.6, 0.25, ST);                                                     // stone basement
    for (const y of [4.6, 8.8, 13.0]) nb2Band(T, P, y, 0.35, 0.12, TC);
    nb2Band(T, P, H - 1.4, 0.5, 0.35, TC); nb2Band(T, P, H - 0.9, 0.9, 0.7, BR2);       // corbel table and cornice
    nb2Win(T, P, {y0:0.4, y1:12.9, fh:4.2, bw:3.2, wf:0.45, hf:0.62, col:WIN, frame:TC, min:3});
    nb2Win(T, P, {y0:13.2, y1:H - 1.6, fh:3.6, bw:3.2, wf:0.45, hf:0.75, col:WIN, arch:true, min:3});
    // the corner tower (south-west corner): taller square shaft, belfry openings, pyramidal cap
    const TW = nb2Rect(-29.9, -19.6, -22.9, -12.6);
    T.prism(BR, TW, F, 24.0, false); nb2Band(T, TW, F, 3.6, 0.3, ST); nb2Band(T, TW, H - 1.4, 0.5, 0.4, TC);
    nb2Win(T, TW, {y0:H + 0.4, y1:23.4, fh:5.0, bw:7.0, wf:0.42, hf:0.85, col:WIN, arch:true});
    nb2Band(T, TW, 23.4, 0.6, 0.4, TC);
    T.q(ROOF, [-30.3, 24, -20.0], [-22.5, 24, -20.0], [-26.4, 28.5, -16.1], [-26.4, 28.5, -16.1]); T.q(ROOF, [-22.5, 24, -20.0], [-22.5, 24, -12.2], [-26.4, 28.5, -16.1], [-26.4, 28.5, -16.1]);
    T.q(ROOF, [-22.5, 24, -12.2], [-30.3, 24, -12.2], [-26.4, 28.5, -16.1], [-26.4, 28.5, -16.1]); T.q(ROOF, [-30.3, 24, -12.2], [-30.3, 24, -20.0], [-26.4, 28.5, -16.1], [-26.4, 28.5, -16.1]);
    // chimneys
    for (const [x, z] of [[-18, -12], [24, -12], [-15, 12], [22, 15]]) T.abox(BR2, x - 0.8, H, z - 0.8, x + 0.8, H + 3.0, z + 0.8);
    // the walled court (concrete): tall walls round the triangle, inner partitions forming outdoor galleries, an open top
    const CT = [[-30.4,23.4],[1.8,23.4],[-21.1,42.3],[-30.4,32.0]];
    for (const e of nb2Edges(CT)) T.box(CONC, (e.a[0] + e.b[0])/2 - e.nx*0.3, F, (e.a[1] + e.b[1])/2 - e.nz*0.3, e.ux, e.uz, e.L, 10.3 - F, 0.6);
    T.box(CONC2, -12, F, 28.5, 1, 0, 14, 6.0 - F, 0.4); T.box(CONC2, -20.5, F, 33, 0, 1, 9, 6.0 - F, 0.4);
    T.flat('#8f8c86', CT, -1.8);
    nb2Band(T, CT, 10.0, 0.3, 0.15, CONC2);
    // concrete entrance addition at the end of the east wing
    const AD = nb2Rect(13.1, 23.7, 18.5, 36.9);
    T.prism(CONC, AD, F, 4.3, true, CONC2); T.abox({c:'#3d4448', glow:'#ffe6c0', gk:0.7}, 13.0, 0, 26, 13.1, 3.2, 34);
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nyps1', lat:40.7455621, lon:-73.9478241, rot:1.3234});
// =====================================================================================================================
// Bronx Zoo — Astor Court (1899-1910, Heins & LaFarge) as compact keys on the real footprints (buildings, gates and pools
// only, no animal figures): buff brick and limestone Beaux-Arts animal houses with tall round-arched windows, rusticated
// bases, cornices and balustrades, copper and tile roofs —
//  nybronxzoo    the Zoo Center (former Elephant House, 1908): cruciform hall under the great ribbed dome with its lantern,
//                apsidal ends.                                                    (primary label: the Bronx Zoo)
//  nybronxzoo_b  the Lion House (1903, now Madagascar!): the long house with its central pedimented pavilion and apses.
//  nybronxzoo_c  the Primate House (1901).          nybronxzoo_e / _f  the two Administration buildings at the court's head.
//  nybronxzoo_i  the Rockefeller Fountain (1910) in Fountain Circle at the court's head (basins and jets, no figures).
//  nybronxzoo_g  the court's east pavilion.         nybronxzoo_h  the circular Sea Lion Pool in the middle of the court (stone rim,
//                balustrade, rock islands, paving).  nybronxzoo_d  the Rainey Memorial Gates (1934, Paul Manship): the
//                green bronze double-arched gate and screens (stylised plant forms only, the animal figures left out)
//                between the two granite gatekeepers' lodges.
// Frames: each building's long side along local x (the court axis runs NNE-SSW).
{
const ZB = '#d9c79c', ZB2 = '#c9b68a', ZL = '#e3dccb', ZL2 = '#cfc7b2', ZCU = '#6f9a86', ZTILE = '#a5654a', ZROOF = '#77736b';
const ZWIN = {c:'#2d2f30', glow:'#ffd9a0', gk:0.35};
// generic Astor Court house: walls of ring P to eaves H, limestone base, arched windows, cornice + balustrade
function nb2ZooHouse(T, P, H, o){ o = o || {};
  const F = o.F === undefined ? -3 : o.F;
  T.prism(ZB, P, F, H, true, ZROOF);
  nb2Band(T, P, F, 2.0 - F, 0.3, ZL);
  for (let y = -0.5; y < 1.8; y += 0.6) nb2Band(T, P, y, 0.1, 0.36, ZL2);
  nb2Band(T, P, H - 1.4, 0.5, 0.35, ZL); nb2Band(T, P, H - 0.9, 0.6, 0.6, ZL2);
  nb2Win(T, P, {y0:2.3, y1:H - 1.8, fh:H - 4.1, bw:o.bw || 4.2, wf:0.42, hf:0.8, sill:0.05, col:ZWIN, arch:true, min:4, frame:ZL});
  if (o.bal !== false){ const Q = nb2Off(P, -0.4); for (const e of nb2Edges(Q)){ if (e.L < 3) continue; const n = Math.floor(e.L/0.75);
      for (let k = 0; k < n; k++){ const u = e.L*(k + 0.5)/n; T.box(ZL, e.a[0] + e.ux*u, H, e.a[1] + e.uz*u, e.ux, e.uz, 0.22, 0.9, 0.22); }
      T.box(ZL2, (e.a[0] + e.b[0])/2, H + 0.9, (e.a[1] + e.b[1])/2, e.ux, e.uz, e.L, 0.25, 0.45); } }
}
function nb2Circ(cx, cz, r, n, a0, a1){ const P = []; a0 = a0 || 0; a1 = a1 === undefined ? Math.PI*2 : a1; for (let i = 0; i < n; i++){ const a = a0 + (a1 - a0)*i/n; P.push([cx + Math.cos(a)*r, cz + Math.sin(a)*r]); } return P; }

LANDMARKS.nybronxzoo = {zh:'布朗克斯动物园', en:'Bronx Zoo', cat:'old', r:30, h:22,
  lt:{m:0, c:'#ffe0b4', k:0.55, e:0.5},
  build(){
    const g = new THREE.Group(), T = nb2TB();
    // wings with apsidal ends, central cross block, the dome
    const WG = [[-22.0, -10.5], [22.0, -10.5], [22.0, 10.5], [-22.0, 10.5]];
    nb2ZooHouse(T, WG, 11.0, {bw:4.4});
    for (const s of [-1, 1]){ const A = nb2Circ(s*22.0, 0, 4.7, 9, s < 0 ? Math.PI/2 : -Math.PI/2, s < 0 ? Math.PI*1.5 : Math.PI/2); A.push([s*22.0, s < 0 ? -4.7 : 4.7]);
      T.prism(ZB, A, -3, 9.0, true, ZROOF); nb2Band(T, A, -3, 5.0, 0.25, ZL); nb2Band(T, A, 8.3, 0.7, 0.4, ZL2);
      T.lathe(ZTILE, s*22.0, 9.0, 0, [[4.7, 0], [3.6, 2.2], [0, 3.0]], 10); }
    const CB = [[-11.5, -12.1], [11.5, -12.1], [11.5, 12.1], [-11.5, 12.1]];
    nb2ZooHouse(T, CB, 13.0, {bw:3.8});
    for (const s of [-1, 1]){ const z = s*12.1; T.abox(ZL, -5.5, -3, z - (s > 0 ? 0 : 0.8), 5.5, 13.6, z + (s > 0 ? 0.8 : 0));     // entrance frontispieces
      nb2Win1(T, {a:[-5.5, z + s*0.8], ux:1, uz:0, nx:0, nz:s}, 5.5, 4.4, 0.2, 7.5, ZWIN, 0.05, true, ZL2);
      T.q(ZL2, [-6.0, 13.6, z + s*0.9], [6.0, 13.6, z + s*0.9], [0, 16.0, z + s*0.9], [0, 16.0, z + s*0.9]); }
    // drum and the ribbed dome with the lantern
    T.cyl(ZB, 0, 13.0, 0, 9.4, 3.2, 20); T.cyl(ZL2, 0, 15.9, 0, 9.8, 0.5, 20);
    for (let i = 0; i < 20; i++){ const a = (i + 0.5)/20*Math.PI*2; nb2Win1(T, {a:[Math.cos(a)*9.42 - Math.sin(a)*0.7, Math.sin(a)*9.42 + Math.cos(a)*0.7], ux:Math.sin(a), uz:-Math.cos(a), nx:Math.cos(a), nz:Math.sin(a)}, 0.7, 1.1, 13.6, 15.2, ZWIN, 0.02); }
    const prof = []; for (let i = 0; i <= 8; i++){ const t = i/8*Math.PI/2; prof.push([9.2*Math.cos(t), 4.3*Math.sin(t)]); }
    T.lathe(ZCU, 0, 16.4, 0, prof, 20);
    for (let i = 0; i < 10; i++){ const a = i/10*Math.PI*2; for (let k = 0; k < 8; k++){ const p0 = prof[k], p1 = prof[k + 1];
      T.q(ZL2, [Math.cos(a)*p0[0]*1.01 - Math.sin(a)*0.18, 16.4 + p0[1] + 0.05, Math.sin(a)*p0[0]*1.01 + Math.cos(a)*0.18], [Math.cos(a)*p0[0]*1.01 + Math.sin(a)*0.18, 16.4 + p0[1] + 0.05, Math.sin(a)*p0[0]*1.01 - Math.cos(a)*0.18],
        [Math.cos(a)*p1[0]*1.01 + Math.sin(a)*0.18, 16.4 + p1[1] + 0.05, Math.sin(a)*p1[0]*1.01 - Math.cos(a)*0.18], [Math.cos(a)*p1[0]*1.01 - Math.sin(a)*0.18, 16.4 + p1[1] + 0.05, Math.sin(a)*p1[0]*1.01 + Math.cos(a)*0.18]); } }
    T.cyl(ZL, 0, 20.6, 0, 1.6, 1.4, 10); T.lathe(ZCU, 0, 22.0, 0, [[1.8, 0], [1.2, 0.8], [0.2, 1.4], [0.1, 2.2], [0, 2.4]], 10);
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nybronxzoo', lat:40.8514942, lon:-73.8794366, rot:-0.5022});

LANDMARKS.nybronxzoo_b = {zh:'布朗克斯动物园狮子馆', en:'Bronx Zoo Lion House', cat:'old', r:42, h:16, label:false,
  lt:{m:0, c:'#ffe0b4', k:0.5, e:0.5},
  build(){
    const g = new THREE.Group(), T = nb2TB();
    const P = [[-37.3,-15.4],[-29.9,-15.4],[-29.9,-11.9],[-6.6,-11.9],[-6.6,-13.9],[-3.2,-17.4],[1.9,-17.3],[5.1,-13.9],[5.1,-12.0],[29.0,-12.0],[29.0,-16.2],[35.8,-16.3],[35.9,-12.0],[36.8,-12.0],[36.7,-6.2],[38.4,-6.3],[38.4,0.5],[35.6,0.5],[35.5,4.7],[30.0,4.7],[29.7,13.2],[27.9,15.9],[25.1,17.4],[21.8,17.4],[19.5,16.3],[17.8,14.4],[16.9,11.9],[6.3,11.9],[6.3,16.6],[-6.7,16.6],[-6.7,12.3],[-17.5,12.3],[-17.5,13.1],[-18.7,15.4],[-21.9,17.7],[-25.9,17.8],[-29.4,15.5],[-30.0,13.9],[-30.0,11.7],[-30.7,11.7],[-30.8,2.1],[-37.0,2.1],[-37.0,-1.1],[-37.8,-1.0],[-37.8,-11.9],[-37.3,-11.9]];
    nb2ZooHouse(T, P, 10.3, {bw:4.6});
    // hipped tile roof over the main range, raised central pavilions with pediments on both long fronts
    nb2Hip(T, ZTILE, -29.5, -11.5, 29.5, 11.5, 11.2, 4.2);
    for (const s of [-1, 1]){ const z0 = s < 0 ? -17.4 : 11.9, z1 = s < 0 ? -11.9 : 16.6;
      T.abox(ZL, -6.6, 10.3, z0, 6.3, 13.4, z1); nb2Gable(T, ZTILE, ZL, -7.0, z0 - 0.3, 6.7, z1 + 0.3, 13.4, 3.0, 'z');
      nb2Win1(T, {a:[-6.6, s < 0 ? z0 : z1], ux:1, uz:0, nx:0, nz:s}, 6.45, 4.6, 0.0, 6.8, ZWIN, 0.06, true, ZL2); }
    for (const [x, z] of [[23.5, 12.5], [-23.5, 12.5]]) T.lathe(ZTILE, x, 10.3, z, [[6.0, 0], [4.0, 2.0], [0, 3.0]], 10);
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nybronxzoo_b', lat:40.8526190, lon:-73.8791645, rot:1.0548});

LANDMARKS.nybronxzoo_c = {zh:'布朗克斯动物园灵长类馆', en:'Bronx Zoo Primate House', cat:'old', r:28, h:13, label:false,
  lt:{m:0, c:'#ffe0b4', k:0.5, e:0.5},
  build(){
    const g = new THREE.Group(), T = nb2TB();
    const P = [[-24.4,-8.6],[-19.6,-8.6],[-19.5,-10.3],[-9.3,-10.2],[-9.2,-8.6],[9.4,-8.6],[9.4,-9.8],[19.6,-9.8],[19.5,-8.5],[24.2,-8.5],[24.1,4.9],[19.6,4.9],[19.2,10.9],[17.9,12.8],[15.3,14.1],[12.4,14.0],[9.7,11.9],[8.9,9.7],[8.9,5.3],[-9.4,5.3],[-9.4,9.6],[-10.8,12.2],[-13.3,13.5],[-16.2,13.3],[-17.7,12.5],[-19.2,10.7],[-19.6,9.7],[-19.6,4.6],[-24.4,4.4]];
    nb2ZooHouse(T, P, 8.9, {bw:4.0});
    nb2Hip(T, ZTILE, -24, -8.3, 24, 4.6, 9.8, 3.4);
    for (const x of [-14.5, 14.5]){ T.abox(ZL, x - 5, 8.9, -10.3, x + 5, 11.2, -8.4); nb2Gable(T, ZTILE, ZL, x - 5.3, -10.6, x + 5.3, -4, 11.2, 2.2, 'z'); }
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nybronxzoo_c', lat:40.8522930, lon:-73.8783966, rot:1.0758});

LANDMARKS.nybronxzoo_e = {zh:'布朗克斯动物园行政楼（西）', en:'Bronx Zoo Administration Building', cat:'old', r:30, h:16, label:false,
  lt:{m:0, c:'#ffe0b4', k:0.5, e:0.5},
  build(){
    const g = new THREE.Group(), T = nb2TB();
    const P = [[-23.5,-11.5],[-17.6,-11.5],[-17.6,-14.2],[6.6,-14.2],[6.6,-15.3],[13.4,-15.4],[13.4,-14.1],[17.1,-14.1],[17.1,-9.0],[18.7,-9.0],[18.7,-1.6],[23.2,-1.7],[23.2,9.1],[18.7,9.1],[18.7,16.2],[2.0,16.2],[2.0,12.5],[-16.1,12.5],[-19.1,10.1],[-19.1,4.4],[-23.5,4.4]];
    nb2ZooHouse(T, P, 12.3, {bw:3.8, F:-9.5});
    nb2Hip(T, ZTILE, -17.5, -13.8, 18.5, 12.2, 13.2, 3.8);
    T.abox(ZL, 18.7, -9.5, -1.6, 23.6, 14.0, 9.1); nb2Gable(T, ZTILE, ZL, 18.5, -1.9, 23.9, 9.4, 14.0, 2.4, 'x');
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nybronxzoo_e', lat:40.8534132, lon:-73.8786285, rot:1.0573});

LANDMARKS.nybronxzoo_f = {zh:'布朗克斯动物园行政楼（东）', en:'Bronx Zoo Administration Building (east)', cat:'old', r:18, h:17, label:false,
  lt:{m:0, c:'#ffe0b4', k:0.5, e:0.5},
  build(){
    const g = new THREE.Group(), T = nb2TB();
    const P = [[-7.9,-12.4],[8.3,-12.4],[8.2,-5.6],[12.5,-5.6],[12.5,5.5],[8.3,5.5],[8.4,12.2],[-8.5,12.2],[-8.6,5.2],[-12.6,5.2],[-12.6,-5.6],[-8.0,-5.6]];
    nb2ZooHouse(T, P, 13.1, {bw:3.6, F:-5});
    nb2Hip(T, ZTILE, -8.2, -12.2, 8.2, 12.0, 14.0, 3.0); nb2Hip(T, ZTILE, -12.4, -5.4, 12.3, 5.3, 14.0, 2.6);
    T.cyl(ZCU, 0, 16.0, 0, 1.6, 1.8, 8, 0.2);
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nybronxzoo_f', lat:40.8531286, lon:-73.8777032, rot:1.0781});

LANDMARKS.nybronxzoo_g = {zh:'布朗克斯动物园阿斯特庭院东馆', en:'Bronx Zoo Astor Court pavilion', cat:'old', r:18, h:16, label:false,
  lt:{m:0, c:'#ffe0b4', k:0.5, e:0.5},
  build(){
    const g = new THREE.Group(), T = nb2TB();
    const P = [[-9.8,-10.9],[10.1,-10.7],[10.1,-7.3],[13.6,-7.4],[13.6,10.1],[-13.8,10.1],[-13.7,-7.4],[-9.8,-7.5]];
    nb2ZooHouse(T, P, 12.7, {bw:3.8});
    nb2Hip(T, ZTILE, -13.5, -7.2, 13.4, 9.9, 13.6, 3.4);
    T.abox(ZL, -6, 12.7, -10.9, 6, 15.0, -9.6); nb2Gable(T, ZTILE, ZL, -6.3, -11.2, 6.3, -5, 15.0, 2.0, 'z');
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nybronxzoo_g', lat:40.8526244, lon:-73.8777541, rot:1.0811});

LANDMARKS.nybronxzoo_h = {zh:'布朗克斯动物园海狮池', en:'Bronx Zoo Sea Lion Pool', cat:'old', r:20, h:3, label:false,
  lt:{m:0, c:'#ffe6c4', k:0.4, e:0.8},
  build(){
    const g = new THREE.Group(), T = nb2TB();
    const WAT = {c:'#3f7186', glow:'#2a6f8e', gk:0.15}, ROCK = '#7d776d', PAVE = '#c9c1ae';
    const OV = nb2Circ(0, 0, 12.5, 32);
    T.prism(ZL2, nb2Circ(0, 0, 18.5, 32), -2.2, -0.15, true, PAVE);           // paving round the pool
    T.prism(ZL2, OV, -1.5, 0.45, false); T.flat(WAT, OV.map(p => [p[0]*0.97, p[1]*0.96]), 0.05);
    nb2Band(T, OV, 0.45, 0.25, 0.4, ZL);
    // balustrade on the rim
    const BQ = nb2Off(OV, 0.9);
    for (const e of nb2Edges(BQ)){ const n = Math.max(1, Math.floor(e.L/0.7)); for (let k = 0; k < n; k++){ const u = e.L*(k + 0.5)/n; T.box(ZL, e.a[0] + e.ux*u, -0.15, e.a[1] + e.uz*u, e.ux, e.uz, 0.2, 0.85, 0.2); }
      T.box(ZL2, (e.a[0] + e.b[0])/2, 0.7, (e.a[1] + e.b[1])/2, e.ux, e.uz, e.L, 0.2, 0.4); }
    // rock islands
    for (const [x, z, r, h] of [[-3, 2, 3.0, 1.6], [4, -3, 2.3, 1.2], [5, 5, 1.5, 0.9]]) T.cyl(ROCK, x, -0.4, z, r, h, 7, r*0.35);
    // lamp standards at the ends
    for (let k = 0; k < 4; k++){ const a = Math.PI/4 + k*Math.PI/2, x = Math.cos(a)*16, z = Math.sin(a)*16; T.cyl('#3d3f3c', x, -0.15, z, 0.12, 4.2, 6); T.cyl({c:'#f2ecd8', glow:'#fff1cc', gk:1.6}, x, 4.0, z, 0.35, 0.6, 8); }
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nybronxzoo_h', lat:40.85297, lon:-73.87836, rot:1.0600});

LANDMARKS.nybronxzoo_d = {zh:'雷尼纪念门', en:'Rainey Memorial Gates', cat:'old', r:16, h:11, label:false,
  lt:{m:0, c:'#ffdcae', k:0.6, e:0.6},
  build(){
    const g = new THREE.Group(), T = nb2TB();
    const vd = (col, x, y, z, r, n) => { for (let i = 0; i < n; i++){ const a = i/n*Math.PI*2, b = (i + 1)/n*Math.PI*2; T.t(col, [x, y, z], [x + Math.cos(a)*r, y + Math.sin(a)*r, z], [x + Math.cos(b)*r, y + Math.sin(b)*r, z]); } };
    const GRN = '#bdb8ad', GRN2 = '#a9a498', BRZ = {c:'#3f6b57', glow:'#a8e8c8', gk:0.12}, BRZ2 = {c:'#5d8f74', glow:'#c0f0d4', gk:0.15}, SL = '#5a5e60';
    // two granite gatekeepers' lodges
    for (const s of [-1, 1]){ const x = s*11.5; T.abox(GRN, x - 3.0, -1.5, -2.6, x + 3.0, 4.6, 2.6); T.abox(GRN2, x - 3.3, 4.6, -2.9, x + 3.3, 5.1, 2.9);
      nb2Hip(T, SL, x - 3.3, -2.9, x + 3.3, 2.9, 5.1, 2.0); nb2Win1(T, {a:[x - 3.0, -2.6], ux:1, uz:0, nx:0, nz:-1}, 3.0, 1.3, 1.0, 3.0, '#2b2c2d', 0.05, true); }
    // gate piers and the arched bronze gate: stylised tree and vine forms (no animals)
    for (const s of [-1, 1]) { T.abox(GRN2, s*4.6 - 0.6, -1.5, -0.6, s*4.6 + 0.6, 6.5, 0.6); T.abox(GRN, s*4.6 - 0.75, 6.5, -0.75, s*4.6 + 0.75, 6.9, 0.75); }
    const A = []; for (let i = 0; i <= 12; i++){ const a = Math.PI*i/12; A.push([Math.cos(a)*4.0, 6.4 + Math.sin(a)*3.8]); }
    for (let i = 0; i < 12; i++) T.q(BRZ, [A[i][0], A[i][1], -0.12], [A[i + 1][0], A[i + 1][1], -0.12], [A[i + 1][0], A[i + 1][1] + 0.35, -0.12], [A[i][0], A[i][1] + 0.35, -0.12]);
    for (let i = 0; i < 12; i++){ const a0 = Math.PI*i/12, a1 = Math.PI*(i + 1)/12, R0 = 4.55, R1 = 4.95;                 // the outer arch of the double arch
      T.q(BRZ2, [Math.cos(a0)*R0, 6.4 + Math.sin(a0)*R0*0.95, 0.1], [Math.cos(a1)*R0, 6.4 + Math.sin(a1)*R0*0.95, 0.1], [Math.cos(a1)*R1, 6.4 + Math.sin(a1)*R1*0.95, 0.1], [Math.cos(a0)*R1, 6.4 + Math.sin(a0)*R1*0.95, 0.1]); }
    for (const s of [-1, 1]){ T.abox(BRZ, s*2.0 - 2.0, -0.2, -0.1, s*2.0 + 2.0, 0.15, 0.1);                        // the two leaves (closed)
      for (let k = 0; k <= 8; k++){ const x = s*0.1 + s*k*0.48; T.abox(BRZ, x - 0.04, 0, -0.06, x + 0.04, 6.4, 0.06); }
      for (const y of [1.6, 3.4, 5.2]) T.abox(BRZ, s*0.1 - 0.0 + (s < 0 ? -3.9 : 0), y, -0.06, (s < 0 ? -0.1 : 3.9) + 0, y + 0.1, 0.06); }
    // stylised tree in the tympanum: trunk and leaf discs; vine scrolls in the side screens
    T.abox(BRZ2, -0.12, 0.2, -0.15, 0.12, 9.2, 0.15);
    for (const [x, y, r] of [[0, 9.0, 1.1], [-1.4, 8.1, 0.8], [1.4, 8.1, 0.8], [-2.4, 7.0, 0.6], [2.4, 7.0, 0.6], [0, 7.6, 0.7]]) { vd(BRZ2, x, y, -0.16, r, 8); vd(BRZ2, x, y, 0.16, r, 8); }
    for (const s of [-1, 1]){ T.abox(GRN2, s*5.2, -1.5, -0.4, s*8.5, 0.5, 0.4); T.abox(BRZ, s*5.2, 0.5, -0.05, s*8.5, 3.6, 0.05);
      for (let k = 0; k < 4; k++){ const x = s*(5.6 + k*0.8); vd(BRZ2, x, 2.1, -0.08, 0.35, 8); } }
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nybronxzoo_d', lat:40.85505, lon:-73.87774, rot:0});

LANDMARKS.nybronxzoo_i = {zh:'洛克菲勒喷泉', en:'Rockefeller Fountain', cat:'old', r:12, h:9, label:false,
  lt:{m:0, c:'#fff0d6', k:0.7, e:0.7},
  build(){
    const g = new THREE.Group(), T = nb2TB();
    const MAR = '#e6e1d4', MAR2 = '#cfc8b8', WAT = {c:'#5f93a8', glow:'#3d86a8', gk:0.25}, JET = {c:'#dfeff4', glow:'#bfe6ff', gk:0.5, op:0.55};
    // the 1910 Italian marble fountain: wide lower basin, the shaft with the tiers, the top bowl and jets (figures left out)
    T.lathe(MAR2, 0, 0, 0, [[9.7, -2.2], [9.7, 0.75], [9.1, 0.75], [9.1, 0.3]], 24); T.cyl(WAT, 0, 0.0, 0, 9.15, 0.5, 24);
    T.lathe(MAR, 0, 0.6, 0, [[2.2, 0], [1.8, 1.0], [1.1, 1.6], [0.9, 3.0], [1.2, 3.4], [4.2, 3.9], [4.4, 4.3], [3.8, 4.4], [0.8, 4.6], [0.6, 6.0], [0.9, 6.3], [2.2, 6.6], [2.3, 6.9], [0.5, 7.0], [0.3, 8.0], [0, 8.4]], 16);
    T.cyl(WAT, 0, 4.42, 0, 3.8, 0.02, 16); T.cyl(WAT, 0, 6.85, 0, 2.1, 0.02, 12);
    // jets: the spout from the top and the fall from the upper bowls
    T.cyl(JET, 0, 8.3, 0, 0.18, 1.6, 6, 0.05);
    T.lathe(JET, 0, 0.7, 0, [[4.25, 3.7], [4.5, 2.2], [4.9, 0.0]], 16);
    T.lathe(JET, 0, 0.7, 0, [[2.3, 6.2], [2.6, 5.0], [3.3, 3.75]], 12);
    for (let k = 0; k < 8; k++){ const a = k/8*Math.PI*2; T.cyl(MAR2, Math.cos(a)*7.2, 0.6, Math.sin(a)*7.2, 0.45, 1.0, 6, 0.3); }
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nybronxzoo_i', lat:40.85385, lon:-73.87773, rot:0});
}
}
