{
// ---- triangle batcher: one LTris per colour spec ------------------------------------------------------------------------
function m4TB(){ const B = new Map(); return {
  t(col, ...pts){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = B.get(k); if (!e){ e = {col, p:[]}; B.set(k, e); } for (const q of pts) e.p.push(q[0], q[1], q[2]); },
  q(col, a, b, c, d){ this.t(col, a, b, c, a, c, d); },
  // oriented box: centre-bottom (x, y, z), length L along unit (ux, uz), height h, depth d across
  box(col, x, y, z, ux, uz, L, h, d, nobot){ const vx = -uz, vz = ux, l = L/2, w = d/2;
    const P = (a, b, yy) => [x + ux*a + vx*b, yy, z + uz*a + vz*b];
    const A = P(-l, -w, y), Bq = P(l, -w, y), C = P(l, w, y), D = P(-l, w, y), A2 = P(-l, -w, y + h), B2 = P(l, -w, y + h), C2 = P(l, w, y + h), D2 = P(-l, w, y + h);
    this.q(col, A, Bq, B2, A2); this.q(col, Bq, C, C2, B2); this.q(col, C, D, D2, C2); this.q(col, D, A, A2, D2); this.q(col, A2, B2, C2, D2); if (!nobot) this.q(col, A, D, C, Bq); },
  // axis box x0..x1, y0..y1, z0..z1
  abox(col, x0, y0, z0, x1, y1, z1){ this.box(col, (x0 + x1)/2, y0, (z0 + z1)/2, 1, 0, x1 - x0, y1 - y0, z1 - z0); },
  // vertical n-gon prism (cylinder) radius r
  cyl(col, x, y, z, r, h, n, r2){ n = n || 8; const rt = r2 === undefined ? r : r2;
    for (let i = 0; i < n; i++){ const a = i/n*Math.PI*2, b = (i + 1)/n*Math.PI*2;
      this.q(col, [x + Math.cos(a)*r, y, z + Math.sin(a)*r], [x + Math.cos(b)*r, y, z + Math.sin(b)*r], [x + Math.cos(b)*rt, y + h, z + Math.sin(b)*rt], [x + Math.cos(a)*rt, y + h, z + Math.sin(a)*rt]);
      if (rt > 0) this.t(col, [x, y + h, z], [x + Math.cos(a)*rt, y + h, z + Math.sin(a)*rt], [x + Math.cos(b)*rt, y + h, z + Math.sin(b)*rt]); } },
  // flat polygon at height y (triangulated)
  flat(col, P, y){ const tr = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
    for (const f of tr) this.t(col, [P[f[0]][0], y, P[f[0]][1]], [P[f[1]][0], y, P[f[1]][1]], [P[f[2]][0], y, P[f[2]][1]]); },
  // walls of a polygon from y0 to y1 (+ top cap unless cap === false)
  prism(col, P, y0, y1, cap, capCol){ const n = P.length;
    for (let i = 0; i < n; i++){ const a = P[i], b = P[(i + 1) % n]; this.q(col, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); }
    if (cap !== false) this.flat(capCol || col, P, y1); },
  flush(g, ox, oz){ for (const e of B.values()) if (e.p.length){ if (ox || oz) for (let i = 0; i < e.p.length; i += 3){ e.p[i] -= ox || 0; e.p[i + 2] -= oz || 0; } LTris(g, e.p, e.col); } B.clear(); }
}; }
// ---- polygon helpers ([x, z] points, local metres) ------------------------------------------------------------------------
function m4Area(P){ let s = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length]; s += a[0]*b[1] - b[0]*a[1]; } return s/2; }
function m4Edges(P){ const sg = m4Area(P) > 0 ? 1 : -1, E = [];
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1e-6;
    E.push({i, a, b, L, ux:dx/L, uz:dz/L, nx:sg*dz/L, nz:-sg*dx/L}); } return E; }
function m4Off(P, d){ const E = m4Edges(P), n = P.length, Q = [];       // miter offset (+d outward)
  for (let i = 0; i < n; i++){ const e1 = E[(i - 1 + n) % n], e2 = E[i]; let mx = e1.nx + e2.nx, mz = e1.nz + e2.nz; const k = 1 + e1.nx*e2.nx + e1.nz*e2.nz;
    if (k < 0.15){ Q.push([P[i][0] + e2.nx*d, P[i][1] + e2.nz*d]); continue; } Q.push([P[i][0] + mx/k*d, P[i][1] + mz/k*d]); } return Q; }
function m4Rect(x0, z0, x1, z1){ return [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]; }
// windows on every edge of P (or the edges for which o.on(e) is true): quads standing o.out outside the wall
// o: {y0, y1, fh (floor height), bw (bay width), wf (window width fraction), hf (height fraction), sill (fraction), col, out, min (min edge length), arch}
function m4Win(T, P, o){ const E = m4Edges(P), out = o.out === undefined ? 0.06 : o.out;
  for (const e of E){ if (e.L < (o.min || 2.5) || (o.on && !o.on(e))) continue;
    const nb = Math.max(1, Math.round((e.L - (o.edge || 0)*2)/o.bw)), bw = (e.L - (o.edge || 0)*2)/nb, ww = bw*(o.wf || 0.55);
    for (let y = o.y0; y + o.fh*0.5 <= o.y1 + 0.01; y += o.fh){ const ya = y + o.fh*(o.sill === undefined ? 0.2 : o.sill), yb = Math.min(o.y1, ya + o.fh*(o.hf || 0.6));
      for (let k = 0; k < nb; k++){ const c = (o.edge || 0) + bw*(k + 0.5), cx = e.a[0] + e.ux*c + e.nx*out, cz = e.a[1] + e.uz*c + e.nz*out;
        if (o.skip && o.skip(e, k, nb, y)) continue;
        const ax = cx - e.ux*ww/2, az = cz - e.uz*ww/2, bx = cx + e.ux*ww/2, bz = cz + e.uz*ww/2;
        T.q(o.col, [ax, ya, az], [bx, ya, bz], [bx, yb, bz], [ax, yb, az]);
        if (o.arch){ const r = ww/2, n = 6; for (let j = 0; j < n; j++){ const t0 = j/n*Math.PI, t1 = (j + 1)/n*Math.PI;
          T.t(o.col, [cx, yb, cz], [cx + e.ux*Math.cos(t0)*r, yb + Math.sin(t0)*r, cz + e.uz*Math.cos(t0)*r], [cx + e.ux*Math.cos(t1)*r, yb + Math.sin(t1)*r, cz + e.uz*Math.cos(t1)*r]); } }
        if (o.frame) T.q(o.frame, [ax - e.ux*0.12, ya - 0.18, az - e.uz*0.12], [bx + e.ux*0.12, ya - 0.18, bz + e.uz*0.12], [bx + e.ux*0.12 + e.nx*0.12, ya, bz + e.uz*0.12 + e.nz*0.12], [ax - e.ux*0.12 + e.nx*0.12, ya, az - e.uz*0.12 + e.nz*0.12]);
      } } } }
// is (x, z) at height y inside one of the parts [[base, top, ring], ...] (other than skip)?
function m4Pip(P, x, z){ let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0])*(z - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; }
function m4Covered(parts, x, z, y, skip){ for (const q of parts){ if (q === skip) continue; if (y >= Math.max(q[0], -5) - 0.01 && y < q[1] - 0.05 && m4Pip(q[2], x, z)) return true; } return false; }
// horizontal band (cornice / string course) round P: depth d outward, from y to y + h
function m4Band(T, P, y, h, d, col, on){ const Q = m4Off(P, d), n = P.length, E = m4Edges(P);
  for (let i = 0; i < n; i++){ if (on && !on(E[i])) continue; const j = (i + 1) % n, a = P[i], b = P[j], A = Q[i], B = Q[j];
    T.q(col, [A[0], y, A[1]], [B[0], y, B[1]], [B[0], y + h, B[1]], [A[0], y + h, A[1]]);
    T.q(col, [a[0], y + h, a[1]], [b[0], y + h, b[1]], [B[0], y + h, B[1]], [A[0], y + h, A[1]]);
    T.q(col, [a[0], y, a[1]], [b[0], y, b[1]], [B[0], y, B[1]], [A[0], y, A[1]]); } }
// classic New York rooftop water tank on a steel stand
function m4Tank(T, x, y, z, r, h, wood, steel){ for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) T.box(steel, x + dx*r*0.6, y, z + dz*r*0.6, 1, 0, 0.25, 3.2, 0.25);
  T.abox(steel, x - r*0.85, y + 3.0, z - r*0.85, x + r*0.85, y + 3.25, z + r*0.85); T.cyl(wood, x, y + 3.25, z, r, h, 10); T.cyl(wood, x, y + 3.25 + h, z, r*1.04, r*0.7, 10, 0.05); }
// low-poly street tree
function m4Tree(T, x, y, z, s, leaf, trunk){ T.box(trunk, x, y, z, 1, 0, 0.3*s, 1.4*s, 0.3*s);
  const cy = y + 1.9*s, R = s; const V = [[0, R, 0], [R, 0, 0], [0, 0, R], [-R, 0, 0], [0, 0, -R], [0, -R*0.7, 0]];
  const F = [[0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1], [5, 2, 1], [5, 3, 2], [5, 4, 3], [5, 1, 4]];
  for (const f of F) T.t(leaf, ...f.map(i => [x + V[i][0], cy + V[i][1], z + V[i][2]])); }
// vertical window strips (window columns with recessed spandrels, Art Deco style) on the edges of P from y0 to y1
function m4VStrips(T, P, y0, y1, bw, wf, col, on, out){ const E = m4Edges(P), o = out === undefined ? 0.06 : out;
  for (const e of E){ if (e.L < 2 || (on && !on(e))) continue; const n = Math.max(1, Math.round(e.L/bw)), b = e.L/n, w = b*wf;
    for (let k = 0; k < n; k++){ const c = b*(k + 0.5), cx = e.a[0] + e.ux*c + e.nx*o, cz = e.a[1] + e.uz*c + e.nz*o;
      T.q(col, [cx - e.ux*w/2, y0, cz - e.uz*w/2], [cx + e.ux*w/2, y0, cz + e.uz*w/2], [cx + e.ux*w/2, y1, cz + e.uz*w/2], [cx - e.ux*w/2, y1, cz - e.uz*w/2]); } } }
// zigzag (triangle) frieze round P at y, height h: alternating triangles of colours a / b
function m4Zig(T, P, y, h, tw, a, b, out){ const E = m4Edges(P), o = out === undefined ? 0.08 : out;
  for (const e of E){ const n = Math.max(2, Math.round(e.L/tw)), w = e.L/n;
    for (let k = 0; k < n; k++){ const p = t => [e.a[0] + e.ux*t + e.nx*o, e.a[1] + e.uz*t + e.nz*o], A = p(k*w), B = p((k + 1)*w), M = p((k + 0.5)*w);
      T.t(a, [A[0], y, A[1]], [B[0], y, B[1]], [M[0], y + h, M[1]]); T.t(b, [A[0], y + h, A[1]], [M[0], y + h, M[1]], [A[0], y, A[1]]); T.t(b, [M[0], y + h, M[1]], [B[0], y + h, B[1]], [B[0], y, B[1]]); } } }
// window on a plane: centre (cx, cz) on a wall with unit direction (ux, uz) and outward normal (nx, nz); width w, sill y0,
// springing y1; kind 'p' pointed (lancet), 'r' round arch, 's' square; out = offset from the wall
function m4Opening(T, col, cx, cz, ux, uz, nx, nz, w, y0, y1, kind, out){ const o = out === undefined ? 0.06 : out, x = cx + nx*o, z = cz + nz*o, h = w/2;
  T.q(col, [x - ux*h, y0, z - uz*h], [x + ux*h, y0, z + uz*h], [x + ux*h, y1, z + uz*h], [x - ux*h, y1, z - uz*h]);
  if (kind === 'p'){ const n = 5; for (let j = 0; j < n; j++){ const f = t => { const a = t*Math.PI/3; return [Math.cos(a)*w - h, Math.sin(a)*w]; };
      const L0 = f(j/n), L1 = f((j + 1)/n); const R0 = [-L0[0], L0[1]], R1 = [-L1[0], L1[1]];
      T.t(col, [x, y1, z], [x + ux*L0[0], y1 + L0[1], z + uz*L0[0]], [x + ux*L1[0], y1 + L1[1], z + uz*L1[0]]);
      T.t(col, [x, y1, z], [x + ux*R1[0], y1 + R1[1], z + uz*R1[0]], [x + ux*R0[0], y1 + R0[1], z + uz*R0[0]]); } }
  else if (kind === 'r'){ const n = 8; for (let j = 0; j < n; j++){ const a0 = j/n*Math.PI, a1 = (j + 1)/n*Math.PI;
      T.t(col, [x, y1, z], [x + ux*Math.cos(a0)*h, y1 + Math.sin(a0)*h, z + uz*Math.cos(a0)*h], [x + ux*Math.cos(a1)*h, y1 + Math.sin(a1)*h, z + uz*Math.cos(a1)*h]); } } }
// round window (rose / oculus) in a plane: centre (cx, y, cz), radius r, plane direction (ux, uz), offset along (nx, nz)
function m4Rose(T, col, cx, y, cz, r, ux, uz, nx, nz, n, tr){ const x = cx + nx*0.07, z = cz + nz*0.07; n = n || 16;
  for (let j = 0; j < n; j++){ const a0 = j/n*Math.PI*2, a1 = (j + 1)/n*Math.PI*2; T.t(col, [x, y, z], [x + ux*Math.cos(a0)*r, y + Math.sin(a0)*r, z + uz*Math.cos(a0)*r], [x + ux*Math.cos(a1)*r, y + Math.sin(a1)*r, z + uz*Math.cos(a1)*r]); }
  if (tr) for (let j = 0; j < n; j += 2){ const a = j/n*Math.PI*2; T.box(tr, x + nx*0.05 + ux*Math.cos(a)*r*0.5, y + Math.sin(a)*r*0.5 - 0.08, z + nz*0.05 + uz*Math.cos(a)*r*0.5, ux*Math.cos(a) - 0*uz, uz*Math.cos(a), 0.01 + r, 0.16, 0.12); } }
// steep gable roof over a rectangle (ridge along x or z), eaves at y0, ridge at y1; gable end walls in wall colour
function m4Gable(T, x0, z0, x1, z1, y0, y1, along, roof, wall, ov){ const o = ov || 0.6;
  if (along === 'x'){ const zc = (z0 + z1)/2; T.q(roof, [x0 - o, y0 - o*0.6, z0 - o], [x1 + o, y0 - o*0.6, z0 - o], [x1 + o, y1, zc], [x0 - o, y1, zc]); T.q(roof, [x1 + o, y0 - o*0.6, z1 + o], [x0 - o, y0 - o*0.6, z1 + o], [x0 - o, y1, zc], [x1 + o, y1, zc]);
    if (wall){ T.t(wall, [x0, y0, z0], [x0, y0, z1], [x0, y1, zc]); T.t(wall, [x1, y0, z1], [x1, y0, z0], [x1, y1, zc]); } }
  else { const xc = (x0 + x1)/2; T.q(roof, [x0 - o, y0 - o*0.6, z1 + o], [x0 - o, y0 - o*0.6, z0 - o], [xc, y1, z0 - o], [xc, y1, z1 + o]); T.q(roof, [x1 + o, y0 - o*0.6, z0 - o], [x1 + o, y0 - o*0.6, z1 + o], [xc, y1, z1 + o], [xc, y1, z0 - o]);
    if (wall){ T.t(wall, [x0, y0, z0], [x1, y0, z0], [xc, y1, z0]); T.t(wall, [x1, y0, z1], [x0, y0, z1], [xc, y1, z1]); } } }
// gothic pinnacle: square shaft + pyramid
function m4Pinn(T, col, x, y, z, s, h){ T.abox(col, x - s/2, y, z - s/2, x + s/2, y + h*0.45, z + s/2); T.cyl(col, x, y + h*0.45, z, s*0.71, h*0.55, 4, 0.02); }
// =====================================================================================================================
// One57 (157 W 57th St, 2014, Christian de Portzamparc, 306 m): a cluster of glass slabs whose tops curve down like a
// waterfall from the 306 m summit on the north (park) side toward 57th Street and Sixth Avenue; the facades are vertical
// stripes of glass in several shades of blue and silver (the "pixelated" skin); the hotel podium on 57th Street with its
// canopy, the lower 58th Street wing. Slabs follow the real OSM building parts. Frame: rot = the Midtown grid,
// local +x = east-south-east along 57th St (toward Sixth Ave), +z = south-south-west (57th St side at z ~ +25).
const O57 = [40.765517, -73.979036, -0.5021];
// glass slab with a curved (quarter-ellipse) top falling by D toward axis 'x' or 'z' (+1 / -1); vertical colour stripes
function m4CurveSlab(T, x0, x1, z0, z1, yb, H, cv, cols, rng, sw, band){
  const ax = cv ? cv.ax : 'x', dir = cv ? cv.dir : 1, D = cv ? cv.D : 0, sw0 = sw || 1.6;
  const top = (x, z) => { if (!D) return H; let t = ax === 'x' ? (x - x0)/(x1 - x0) : (z - z0)/(z1 - z0); if (dir < 0) t = 1 - t; t = Math.min(1, Math.max(0, t)); return H - D*(1 - Math.sqrt(Math.max(0, 1 - t*t))); };
  const pick = () => { const u = rng(); return u < 0.36 ? cols[0] : u < 0.66 ? cols[1] : (u < 0.84 || !cols[4]) ? cols[2] : cols[4]; };
  const side = (ax0, az0, ax1, az1) => { const L = Math.hypot(ax1 - ax0, az1 - az0), n = Math.max(1, Math.round(L/sw0));
    for (let i = 0; i < n; i++){ const t0 = i/n, t1 = (i + 1)/n, xa = ax0 + (ax1 - ax0)*t0, za = az0 + (az1 - az0)*t0, xb = ax0 + (ax1 - ax0)*t1, zb = az0 + (az1 - az0)*t1;
      T.q(pick(), [xa, yb, za], [xb, yb, zb], [xb, top(xb, zb), zb], [xa, top(xa, za), za]); } };
  side(x0, z1, x1, z1); side(x1, z1, x1, z0); side(x1, z0, x0, z0); side(x0, z0, x0, z1);
  // horizontal silver floor-slab lines (one quad per floor and side, clipped under the curved top)
  if (band) for (const [ax0, az0, ax1, az1, nx, nz] of [[x0, z1, x1, z1, 0, 1], [x1, z1, x1, z0, 1, 0], [x1, z0, x0, z0, 0, -1], [x0, z0, x0, z1, -1, 0]]){
    const N = 24, P = t => [ax0 + (ax1 - ax0)*t + nx*0.08, az0 + (az1 - az0)*t + nz*0.08];
    for (let y = yb + band.dy; y < H - 1; y += band.dy){ let ta = -1, tb = -1;
      for (let i = 0; i <= N; i++){ const t = i/N, q = [ax0 + (ax1 - ax0)*t, az0 + (az1 - az0)*t]; if (top(q[0], q[1]) > y + 0.6){ if (ta < 0) ta = t; tb = t; } }
      if (ta < 0 || tb - ta < 0.02) continue; const A = P(ta), B = P(tb);
      T.q(band.col, [A[0], y, A[1]], [B[0], y, B[1]], [B[0], y + band.h, B[1]], [A[0], y + band.h, A[1]]); } }
  // the curved roof: a grid of glass cells — stripes run on over the curve (one colour per column), slab lines across
  const N = D ? 14 : 1, W = ax === 'x' ? z1 - z0 : x1 - x0, nc = D ? Math.max(1, Math.round(W/sw0)) : 1;
  const ccol = []; for (let c = 0; c < nc; c++) ccol.push(D ? pick() : (cols[3] || cols[1]));
  for (let i = 0; i < N; i++){ const t0 = i/N, t1 = (i + 1)/N;
    for (let c = 0; c < nc; c++){ const u0 = c/nc, u1 = (c + 1)/nc;
      if (ax === 'x'){ const xa = x0 + (x1 - x0)*t0, xb = x0 + (x1 - x0)*t1, za = z0 + (z1 - z0)*u0, zb = z0 + (z1 - z0)*u1;
        T.q(ccol[c], [xa, top(xa, za), za], [xb, top(xb, za), za], [xb, top(xb, zb), zb], [xa, top(xa, zb), zb]); }
      else { const za = z0 + (z1 - z0)*t0, zb = z0 + (z1 - z0)*t1, xa = x0 + (x1 - x0)*u0, xb = x0 + (x1 - x0)*u1;
        T.q(ccol[c], [xa, top(xa, za), za], [xa, top(xa, zb), zb], [xb, top(xb, zb), zb], [xb, top(xb, za), za]); } }
    if (band && D && i > 0){ if (ax === 'x'){ const x = x0 + (x1 - x0)*t0, y = top(x, z0) + 0.06; T.q(band.col, [x - 0.15, y, z0], [x + 0.15, y, z0], [x + 0.15, y, z1], [x - 0.15, y, z1]); }
      else { const z = z0 + (z1 - z0)*t0, y = top(x0, z) + 0.06; T.q(band.col, [x0, y, z - 0.15], [x0, y, z + 0.15], [x1, y, z + 0.15], [x1, y, z - 0.15]); } } }
  return top; }
LANDMARKS.nyone57 = {zh:'One57 大厦', en:'One57', cat:'new', r:60, h:306,
  lt:{m:1, c:'#dfe8f6', k:0.7},
  build(){
    const g = new THREE.Group(), T = m4TB(), rng = LMCTX.rng;
    const G1 = {c:'#4f7096', m:1, fh:3.6, cw:2.2}, G2 = {c:'#7f9dbe', m:1, fh:3.6, cw:2.2}, G3 = {c:'#aebdcb', m:1, fh:3.6, cw:2.2};
    const ROOF = {c:'#6f8fb2', m:1, fh:3.6, cw:2.2}, STONE = '#9a9894', MET = '#c9ced2', DARK = '#2c3238';
    const G4 = {c:'#8c949b', m:1, fh:3.6, cw:2.2}, cols = [G1, G2, G3, ROOF, G4], BND = {col:MET, dy:3.6, h:0.32};
    // foundations / plinth
    T.prism(STONE, [[-23.7, -5.0], [-18.7, -5.0], [-18.7, -20.7], [2.2, -20.7], [2.2, -5.0], [33.8, -5.05], [33.5, 25.2], [-23.7, 25.3]], -5, 0.3, true);
    // the cascade (heights from the real building parts)
    m4CurveSlab(T, -18.7, 2.2, -20.7, 2.9, 0.3, 306, {ax:'z', dir:1, D:9}, cols, rng, 1.6, BND);          // summit slab (north)
    m4CurveSlab(T, -18.7, 10.6, 2.9, 14.6, 0.3, 298.6, {ax:'z', dir:1, D:66}, cols, rng, 1.6, BND);      // falls toward 57th St
    m4CurveSlab(T, 10.6, 23.7, 2.9, 14.6, 0.3, 236, {ax:'x', dir:1, D:62}, cols, rng, 1.6, BND);         // falls toward Sixth Ave
    m4CurveSlab(T, 23.7, 32.5, 2.9, 14.9, 0.3, 128, {ax:'x', dir:1, D:46}, cols, rng, 1.6, BND);
    m4CurveSlab(T, -3.7, 23.6, 14.6, 18.0, 0.3, 226.8, {ax:'z', dir:1, D:96}, cols, rng, 1.6, BND);
    m4CurveSlab(T, 7.5, 32.4, 18.0, 21.6, 0.3, 119.8, {ax:'z', dir:1, D:58}, cols, rng, 1.6, BND);
    m4CurveSlab(T, -18.8, -3.7, 14.6, 18.0, 0.3, 95, {ax:'z', dir:1, D:38}, cols, rng, 1.6, BND);
    m4CurveSlab(T, -18.8, 7.5, 18.0, 21.6, 0.3, 92, {ax:'z', dir:1, D:40}, cols, rng, 1.6, BND);
    // hotel podium on 57th St and the low wings (glass and silver panels)
    const P1 = [G3, G2, G3, MET];
    m4CurveSlab(T, -18.9, -6.1, 21.6, 25.2, 0.3, 45, null, P1, rng, 2.2);
    m4CurveSlab(T, -6.1, 32.4, 21.6, 25.3, 0.3, 35, null, P1, rng, 2.2);
    m4CurveSlab(T, 2.0, 32.5, -3.2, 2.9, 0.3, 30, null, P1, rng, 2.2);
    m4CurveSlab(T, -23.7, -18.7, -5.0, 25.2, 0.3, 30, null, P1, rng, 2.2);
    T.abox(MET, -18.9, 306, -20.9, 2.4, 306.6, -20.4);
    // the undulating vertical glass strips ("waterfall") over the 57th St hotel entrance, and the rippled canopy
    for (let k = 0; k < 9; k++){ const x = -8 + k*2.0, amp = 0.7*Math.sin(k*0.9);
      for (let j = 0; j < 8; j++){ const y0 = 5.2 + j*2.4, y1 = y0 + 2.4, o0 = 25.4 + 0.5 + amp*Math.sin(j*0.8), o1 = 25.4 + 0.5 + amp*Math.sin((j + 1)*0.8);
        T.q(k % 2 ? G3 : G2, [x - 0.9, y0, o0], [x + 0.9, y0, o0], [x + 0.9, y1, o1], [x - 0.9, y1, o1]); } }
    for (let j = 0; j < 10; j++){ const x0 = -10 + j*2, x1 = x0 + 2, w0 = 0.35*Math.sin(j*1.3), w1 = 0.35*Math.sin((j + 1)*1.3);
      T.q(MET, [x0, 4.8 + w0, 25.3], [x1, 4.8 + w1, 25.3], [x1, 4.8 + w1, 28.4], [x0, 4.8 + w0, 28.4]); }
    // 57th St entrance canopy and the dark ground-floor glass
    T.q({c:DARK, glow:'#ffe2b8', gk:0.5}, [-18.8, 0.3, 25.35], [32.3, 0.3, 25.35], [32.3, 5.5, 25.35], [-18.8, 5.5, 25.35]);
    // aviation lights on the summit
    for (const [x, z] of [[-18, -20], [1.6, -20], [-18, 2.4], [1.6, 2.4]]) T.cyl({c:'#c22', glow:'#ff2a1a', gk:2}, x, 306.6, z, 0.25, 0.5, 6);
    T.flush(g);
    return g; }};
// the lower 58th Street wing as its own key (keeps the hidden-building hull off the neighbours in the notch)
LANDMARKS.nyone57_b = {zh:'One57 大厦', en:'One57', cat:'new', r:45, h:30, label:false,
  lt:{m:1, c:'#dfe8f6', k:0.7},
  build(){
    const g = new THREE.Group(), T = m4TB(), rng = LMCTX.rng;
    const G2 = {c:'#7f9dbe', m:1, fh:3.6, cw:2.2}, G3 = {c:'#aebdcb', m:1, fh:3.6, cw:2.2}, MET = '#c9ced2', P1 = [G3, G2, G3, MET];
    T.prism('#9a9894', [[-23.7, -36.4], [3.2, -36.3], [2.2, -20.7], [-18.7, -20.7], [-18.7, -5.0], [-23.7, -5.0]], -5, 0.3, true);
    m4CurveSlab(T, -23.7, 2.1, -36.4, -20.7, 0.3, 30, null, P1, rng, 2.2);
    m4CurveSlab(T, -23.7, -18.7, -20.7, -5.0, 0.3, 30, null, P1, rng, 2.2);
    T.q({c:'#2c3238', glow:'#ffe2b8', gk:0.5}, [-23.6, 0.3, -36.45], [2.0, 0.3, -36.45], [2.0, 4.8, -36.45], [-23.6, 4.8, -36.45]);
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nyone57', lat:O57[0], lon:O57[1], rot:O57[2]});
SG_PLACES.push({type:'nyone57_b', lat:O57[0], lon:O57[1], rot:O57[2]});
// =====================================================================================================================
// 220 Central Park South (2019, Robert A. M. Stern Architects): the 70-storey Alabama-limestone tower on West 58th St
// (to 290 m) with its stepped crown (corner setbacks at 259 / 274 / 285 m, the arched lantern storeys, urns), and the
// 18-storey "villa" on Central Park South that steps down in terraces toward the park; the low link between them and the
// 58th St entrance pavilion. All volumes on the real OSM parts. Frame: Midtown grid, +x east-south-east, +z toward 58th
// St (south-south-west); the park side is -z.
const C220 = [40.767002, -73.98061, -0.5008];
// stone block with punched windows: walls (+ cap) from y0 to y1 on polygon P, window grid on its edges, top cornice
function m4Block(T, P, y0, y1, o){
  T.prism(o.wall, P, y0, y1, true, o.roof || o.wall);
  if (o.win && y1 - y0 > 4) m4Win(T, P, {y0:Math.max(y0, o.wy0 || y0) + (o.sill0 || 0), y1:y1 - (o.top || 1.2), fh:o.fh || 3.5, bw:o.bw || 2.6, wf:o.wf || 0.5, hf:o.hf || 0.66, col:o.win, out:0.05, min:o.min || 2.2, arch:o.arch, frame:o.frame});
  if (o.cor) m4Band(T, P, y1 - 0.7, 0.7, o.corD || 0.35, o.cor);
}
LANDMARKS.ny220cps = {zh:'中央公园南220号', en:'220 Central Park South', cat:'new', r:60, h:291,
  lt:{m:1, c:'#ffe6c2', k:0.6, fh:3.5, cw:2.4},
  build(){
    const g = new THREE.Group(), T = m4TB();
    const LS = {c:'#ddd4c2', m:1, fh:3.5, cw:2.4}, LS2 = {c:'#cfc5b2', m:0, lc:'#ffe9c8', lk:0.9}, WIN = {c:'#55616d', m:1, fh:3.5, cw:2.4};
    const CROWN = {c:'#e3dbc9', m:0, lc:'#fff0d4', lk:1.25}, ROOF = '#8d8a84', DARK = '#262a2e', GRN = '#5f7a4a';
    const R = m4Rect;
    // plinth over the whole lot
    T.prism(ROOF, [[-29.4, 25.4], [-29.3, -4.9], [13.5, -4.85], [13.6, 21.3], [9.1, 25.4]], -5, 0.4, true);
    // ---- the tower: shaft to 259 m with vertical piers, punched windows
    const S = R(-29.4, 3.8, 9.3, 21.4);
    m4Block(T, S, 0.4, 259, {wall:LS, win:WIN, fh:3.55, bw:2.45, wf:0.42, hf:0.6, wy0:12});
    for (let x = -29.4 + 4.85; x < 9.2; x += 4.85){ T.abox(LS2, x - 0.35, 12, 3.45, x + 0.35, 257, 3.8); T.abox(LS2, x - 0.35, 12, 21.4, x + 0.35, 257, 21.75); }
    for (let z = 3.8 + 4.4; z < 21.3; z += 4.4){ T.abox(LS2, -29.75, 12, z - 0.35, -29.4, 257, z + 0.35); T.abox(LS2, 9.3, 12, z - 0.35, 9.65, 257, z + 0.35); }
    // base storeys: rusticated, taller windows; string courses on the shaft
    m4Band(T, S, 11.4, 0.9, 0.5, LS2); for (const y of [46, 120, 196]) m4Band(T, S, y, 0.6, 0.3, LS2);
    m4Band(T, S, 257.5, 1.5, 0.55, CROWN);
    // ---- the crown (from the real parts): ends to 274, inner corners to 285, the core cross to 290
    const crownBlk = (x0, z0, x1, z1, y0, y1) => { const P = R(x0, z0, x1, z1); m4Block(T, P, y0, y1, {wall:CROWN, win:WIN, fh:y1 - y0 > 12 ? 7.5 : 4.5, bw:2.3, wf:0.5, hf:0.82, arch:true, cor:CROWN, corD:0.45});
      for (const [x, z] of [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]){ T.cyl(CROWN, x, y1, z, 0.55, 0.9, 8); T.cyl(CROWN, x, y1 + 0.9, z, 0.3, 1.0, 8, 0.05); } };
    crownBlk(-29.4, 9.7, -24.8, 16.95, 259, 274); crownBlk(4.7, 9.7, 9.3, 16.95, 259, 274);
    for (const [x0, x1] of [[-24.8, -20], [0, 4.7]]) for (const [z0, z1] of [[3.8, 9.7], [16.95, 21.4]]) crownBlk(x0, z0, x1, z1, 259, 285);
    crownBlk(-24.8, 9.7, 4.7, 16.95, 259, 290); crownBlk(-20, 3.8, 0, 9.7, 259, 290); crownBlk(-20, 16.95, 0, 21.4, 259, 290);
    T.abox(ROOF, -19, 290, 10.5, -1, 291.2, 16.2);
    // east side bay to 165 m and the 58th St entrance pavilion
    m4Block(T, R(9.3, 7.9, 13.6, 21.3), 0.4, 165, {wall:LS, win:WIN, fh:3.55, bw:2.2, wf:0.5, hf:0.7, cor:LS2});
    m4Block(T, R(-29.4, 21.3, 9.1, 25.4), 0.4, 13.5, {wall:LS2, win:{c:DARK, glow:'#ffd9a0', gk:0.5}, fh:6.2, bw:3.8, wf:0.55, hf:0.8, arch:true, cor:LS2});
    // the low link (garden court with planting) between tower and villa
    m4Block(T, R(-29.3, -4.9, 13.5, 3.8), 0.4, 4.5, {wall:LS2, cor:LS2});
    T.abox(GRN, -27.5, 4.5, -3.8, 6, 4.9, 2.8);
    for (const x of [-24, -17, -10, -3, 4]) m4Tree(T, x, 4.9, -0.5, 1.6, '#4f733f', '#5b4b3c');
    T.cyl({c:'#c22', glow:'#ff2a1a', gk:2}, -10, 291.2, 13.3, 0.25, 0.5, 6);
    T.flush(g);
    return g; }};
// the villa on Central Park South as its own key (so the hull does not swallow Gainsborough Studios in the notch)
LANDMARKS.ny220cps_b = {zh:'中央公园南220号', en:'220 Central Park South', cat:'new', r:49, h:85, label:false,
  lt:{m:1, c:'#ffe6c2', k:0.6, fh:3.5, cw:2.4},
  build(){
    const g = new THREE.Group(), T = m4TB();
    const LS = {c:'#ddd4c2', m:1, fh:3.5, cw:2.4}, LS2 = {c:'#cfc5b2', m:0, lc:'#ffe9c8', lk:0.9}, WIN = {c:'#55616d', m:1, fh:3.5, cw:2.4};
    const ROOF = '#8d8a84', DARK = '#262a2e', GRN = '#5f7a4a', R = m4Rect;
    T.prism(ROOF, [[8.3, -4.8], [8.5, -35.6], [31.0, -35.5], [30.7, -12.3], [13.5, -12.35], [13.5, -4.85]], -5, 0.4, true);
    // ---- the villa on Central Park South: limestone terraces (real part heights), stepping toward the park
    const V = [
      [8.3, -19.5, 30.8, -12.3, 45], [8.4, -35.6, 31.0, -31.1, 27], [8.4, -31.1, 13.0, -29.3, 54], [13.0, -31.1, 17.3, -28.7, 49.5], [17.3, -31.1, 26.9, -28.8, 54], [26.9, -31.1, 31.0, -28.9, 49.5],
      [8.4, -29.3, 13.0, -26.7, 63], [13.0, -28.8, 31.0, -26.7, 67.5], [8.4, -26.7, 16.9, -22.8, 76], [16.9, -26.8, 26.8, -23.2, 72], [26.8, -26.8, 31.0, -23.2, 76],
      [8.4, -22.8, 13.1, -20.5, 78], [13.0, -23.3, 16.8, -19.5, 80], [16.8, -23.3, 27.3, -19.4, 84], [27.3, -23.2, 30.9, -19.4, 80], [8.3, -14, 13.5, -4.8, 45]];
    for (const [x0, z0, x1, z1, h] of V) m4Block(T, R(x0, z0, x1, z1), 0.4, h, {wall:LS, win:WIN, fh:3.4, bw:2.5, wf:0.55, hf:0.68, wy0:8, cor:LS2, min:2.5});
    m4Band(T, R(8.4, -35.6, 31.0, -12.3), 8, 0.8, 0.4, LS2);
    // terrace railings / planters on the stepped roofs facing the park
    for (const [z, y] of [[-35.4, 27], [-31, 54], [-28.8, 67.5], [-26.7, 76]]) T.abox(GRN, 8.6, y, z, 30.8, y + 0.9, z + 0.6);
    // ground-floor shopfronts / lobby glow on CPS
    T.q({c:DARK, glow:'#ffd9a0', gk:0.55}, [9, 0.5, -35.66], [30.5, 0.5, -35.66], [30.5, 6.5, -35.66], [9, 6.5, -35.66]);
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'ny220cps', lat:C220[0], lon:C220[1], rot:C220[2]});
SG_PLACES.push({type:'ny220cps_b', lat:C220[0], lon:C220[1], rot:C220[2]});
// =====================================================================================================================
// Fuller Building (41 E 57th St, 1929, Walker & Gillette; 40 storeys, 150 m): Art Deco "black, grey and white" — the six
// black-granite base storeys with bronze spandrels over the whole corner lot (Madison Ave x 57th St), the limestone mid
// storeys with setbacks (floors 10-21; north face flush), the continuous rectangular tower above floor 20 with window
// columns and recessed dark spandrels, black vertical lines and the black-and-white zigzag friezes of the crown with the
// round windows; the 57th St entrance bay (no lettering, no sculpture group). Brick on the north / east walls.
// Frame: Midtown grid, +x east-south-east (toward Park Ave), -x = Madison Ave front, +z = 57th St front.
const FUL = [40.762346, -73.971829, -0.5075];
LANDMARKS.nyfuller = {zh:'富勒大厦', en:'Fuller Building', cat:'old', r:40, h:151,
  lt:{m:1, c:'#ffe7c4', k:0.6, fh:3.7, cw:2.6},
  build(){
    const g = new THREE.Group(), T = m4TB();
    const GRAN = {c:'#232528', m:0, lc:'#ffe7c4', lk:0.35}, BRZ = {c:'#6a5232', glow:'#ffd9a0', gk:0.35}, LS = {c:'#d7d3c9', m:1, fh:3.7, cw:2.6};
    const LSF = {c:'#e0dcd2', m:0, lc:'#fff2dc', lk:1.0, e:0.5}, BLK = {c:'#1e2023', m:0, lc:'#fff2dc', lk:0.25}, WIN = {c:'#3d444b', m:1, fh:3.7, cw:2.6};
    const BRICK = {c:'#9c8c78', m:1, fh:3.7, cw:2.6}, ROOF = '#5d5d5c';
    const LOT = [[-23.76, 11.78], [-23.67, -10.47], [6.69, -10.42], [6.62, -14.04], [22.2, -14.01], [22.12, 11.78]];
    const NB = e => e.nz < -0.7 || (e.nx > 0.7);                       // north / east faces (brick)
    const SW = e => !NB(e);
    // floors 1-6: black granite base, shopfront glass + bronze spandrels in the bays (south and west)
    T.prism(GRAN, LOT, -5, 23, true, ROOF);
    m4VStrips(T, LOT, 0.4, 21.5, 3.8, 0.74, BRZ, SW, 0.06);
    for (const e of m4Edges(LOT)) if (NB(e)) T.q(BRICK, [e.a[0] + e.nx*0.03, 0.4, e.a[1] + e.nz*0.03], [e.b[0] + e.nx*0.03, 0.4, e.b[1] + e.nz*0.03], [e.b[0] + e.nx*0.03, 23, e.b[1] + e.nz*0.03], [e.a[0] + e.nx*0.03, 23, e.a[1] + e.nz*0.03]);
    m4Win(T, LOT, {y0:4.6, y1:22.6, fh:3.7, bw:3.2, wf:0.42, hf:0.6, col:WIN, out:0.06, min:3, on:NB});
    m4Band(T, LOT, 22.2, 0.9, 0.3, LSF, SW);                         // limestone key band between floors 5 and 6
    T.q({c:'#1a1c1e', glow:'#ffe2b0', gk:0.8}, [-11.2, 0.4, 11.85], [-6.4, 0.4, 11.85], [-6.4, 11, 11.85], [-11.2, 11, 11.85]);   // the 57th St entrance (3 storeys)
    T.abox(BRZ, -11.4, 11, 11.8, -6.2, 11.6, 12.2);
    // floors 7-10: full lot; south / west limestone with five centred bays on 57th St, north / east brick
    const L2 = LOT;
    T.prism(LS, L2, 23, 38, true, ROOF); m4VStrips(T, L2, 23.6, 37.6, 3.1, 0.42, WIN, SW);
    m4Win(T, L2, {y0:23.6, y1:37.6, fh:3.7, bw:3.2, wf:0.42, hf:0.6, col:WIN, out:0.05, min:3, on:NB});
    for (const e of m4Edges(L2)) if (NB(e)) T.q(BRICK, [e.a[0] + e.nx*0.03, 23, e.a[1] + e.nz*0.03], [e.b[0] + e.nx*0.03, 23, e.b[1] + e.nz*0.03], [e.b[0] + e.nx*0.03, 38, e.b[1] + e.nz*0.03], [e.a[0] + e.nx*0.03, 38, e.a[1] + e.nz*0.03]);
    // setbacks at floors 11, 13 and 15 (south / west / east; the north face stays on the lot line)
    const SB = (d, dE) => [[-23.7 + d, 11.78 - d], [-23.7 + d, -10.45], [22.1 - dE, -10.45], [22.1 - dE, 11.78 - d]];
    const tiers = [[38, 45.5, 1.6, 2.2], [45.5, 53, 3.4, 4.6], [53, 60.5, 5.2, 7.0]];
    for (const [y0, y1, d, dE] of tiers){ const P = SB(d, dE); T.prism(LS, P, y0, y1, true, ROOF); m4VStrips(T, P, y0 + 0.6, y1 - 0.6, 3.1, 0.42, WIN); m4Band(T, P, y1 - 0.5, 0.5, 0.25, LSF); }
    // floors 16-21: a setback on 57th St nearly every floor, the two centre bays projecting
    const TX0 = -12.8, TX1 = 6.8, TZ0 = -10.45, TZ1 = 8.2;
    for (let i = 0; i < 5; i++){ const y0 = 60.5 + i*3.7, y1 = y0 + 3.7, z1 = 11.78 - 7.0 - i*0.8, P = [[TX0 - 4 + i*0.8, z1], [TX0 - 4 + i*0.8, TZ0], [TX1 + 4 - i*0.8, TZ0], [TX1 + 4 - i*0.8, z1]];
      T.prism(LS, P, y0, y1, true, ROOF); m4VStrips(T, P, y0 + 0.5, y1 - 0.5, 3.1, 0.42, WIN); }
    T.abox(LS, -4.4, 60.5, 4.5, -1.6, 78, 6.2);
    // floors 21-40: the tower (six bays on west, south and east), window columns with recessed dark spandrels
    const TW = m4Rect(TX0, TZ0, TX1, TZ1);
    T.prism(LS, TW, 78.9, 141, true, ROOF);
    m4VStrips(T, TW, 79.5, 132, 3.2, 0.46, WIN, e => e.nz > -0.7);
    m4VStrips(T, TW, 79.5, 132, 3.2, 0.3, WIN, e => e.nz < -0.7);
    m4Zig(T, TW, 76.4, 2.4, 1.6, BLK, LSF);                                          // black geometric band over floor 20
    for (const e of m4Edges(TW)) for (const t of [0.12, 0.88]) { const x = e.a[0] + e.ux*e.L*t + e.nx*0.08, z = e.a[1] + e.uz*e.L*t + e.nz*0.08;
      T.q(BLK, [x - e.ux*0.35, 120, z - e.uz*0.35], [x + e.ux*0.35, 120, z + e.uz*0.35], [x + e.ux*0.35, 137, z + e.uz*0.35], [x - e.ux*0.35, 137, z - e.uz*0.35]); }  // black vertical lines
    m4Band(T, TW, 137, 0.5, 0.9, LSF);                                                // floor 38 balconies
    m4Zig(T, TW, 138.2, 2.6, 1.3, BLK, LSF);                                          // sunburst / zigzag frieze, floor 39
    for (const e of m4Edges(TW)){ const cx = (e.a[0] + e.b[0])/2 + e.nx*0.1, cz = (e.a[1] + e.b[1])/2 + e.nz*0.1;  // round window at floor 39
      for (let j = 0; j < 12; j++){ const a0 = j/12*Math.PI*2, a1 = (j + 1)/12*Math.PI*2, P = a => [cx + e.ux*Math.cos(a)*1.1, 139.5 + Math.sin(a)*1.1, cz + e.uz*Math.cos(a)*1.1];
        T.t({c:'#30363c', glow:'#fff0d0', gk:0.7}, [cx, 139.5, cz], P(a0), P(a1)); } }
    // crown: setbacks at floors 38 / 40 with black-and-white triangle friezes, mechanical penthouse
    const C1 = m4Rect(TX0 + 1.3, TZ0 + 1.3, TX1 - 1.3, TZ1 - 1.3), C2 = m4Rect(TX0 + 3.0, TZ0 + 3.0, TX1 - 3.0, TZ1 - 3.0);
    T.prism(LSF, C1, 141, 146, true, ROOF); m4Zig(T, C1, 141.4, 2.2, 1.1, BLK, LSF); m4VStrips(T, C1, 143.8, 145.6, 2.4, 0.5, WIN);
    T.prism(LSF, C2, 146, 150.2, true, ROOF); m4Zig(T, C2, 146.4, 1.8, 0.9, LSF, BLK); m4Band(T, C2, 149.6, 0.6, 0.25, BLK);
    T.cyl({c:'#c22', glow:'#ff2a1a', gk:2}, -3, 150.2, -1.1, 0.25, 0.6, 6);
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nyfuller', lat:FUL[0], lon:FUL[1], rot:FUL[2]});
// =====================================================================================================================
// London Terrace (1930, Farrar & Watmough): the full-block brick apartment complex between 23rd and 24th Streets and
// Ninth and Tenth Avenues — ten 16-storey blocks along the two streets (London Terrace Gardens / Towers) behind small
// front gardens, the two end buildings on the avenues with their stepped corner towers (to ~71 m, octagonal lanterns),
// the arcaded top storeys and rooftop water-tank houses, terra-cotta cornices, the shops on Ninth Avenue, the private
// garden court in the middle with the low pool building. Heights and plans from the real OSM parts.
// Frame: Midtown grid; origin = block centre; +x east-south-east (Ninth Ave at x = +122), +z south-south-west (23rd St).
const LTB = [40.747445, -74.002488, -0.502];
LANDMARKS.nylondonterrace = {zh:'伦敦排屋公寓', en:'London Terrace', cat:'old', r:128, h:71,
  lt:{m:1, c:'#ffe1b8', k:0.6, fh:2.9, cw:2.2},
  build(){
    const g = new THREE.Group(), T = m4TB();
    const BR = {c:'#985a41', m:1, fh:2.9, cw:2.2}, BR2 = {c:'#8a4f39', m:1, fh:2.9, cw:2.2}, TC = {c:'#cdb48c', m:0, lc:'#ffe8c8', lk:0.7};
    const WIN = {c:'#3c3a39', m:1, fh:2.9, cw:2.2}, ROOF = '#5b5550', SHOP = {c:'#2a2c2e', glow:'#ffd9a2', gk:0.7};
    const LAWN = '#6a8a4e', PATH = '#a59e90', FENCE = '#2a2c2d', LEAF = '#4e7440', TRUNK = '#5b4b3c';
    const tr = (P, sx, cx) => P.map(p => [cx + sx*p[0], p[1]]);
    const blk = (P, y0, y1, w, opt) => { T.prism(w, P, y0, y1, true, ROOF); if (y1 - y0 > 3) m4Win(T, P, Object.assign({y0:y0 + 0.9, y1:y1 - 0.6, fh:2.9, bw:2.6, wf:0.46, hf:0.58, col:WIN, out:0.05, min:2.4}, opt || {})); };
    // plinth for the whole block
    T.prism(ROOF, m4Rect(-122.2, -30.7, 122.2, 30.0), -5, 0.3, true, '#8f8a80');
    // ---- the two end buildings (Ninth Ave: as mapped; Tenth Ave: its mirror image)
    const S45 = [[-19.11, 29.92], [-19.0, 12.86], [1.14, 12.99], [1.15, 8.64], [18.97, 8.68], [18.89, 29.94]];
    const N45 = [[-18.97, -8.48], [-18.9, -29.97], [19.14, -29.86], [19.01, -4.12], [0.98, -4.15], [1.08, -8.54]];
    const M10 = [[-19.0, 12.86], [-18.97, -8.48], [1.08, -8.54], [0.98, -4.15], [19.01, -4.12], [18.97, 8.68], [1.15, 8.64], [1.14, 12.99]];
    const S57 = [[-16.0, 27.07], [-15.88, 15.03], [1.18, 15.13], [1.15, 8.64], [16.24, 8.69], [16.1, 27.36]];
    const N57 = [[-15.97, -10.7], [-15.85, -27.31], [16.25, -27.25], [16.06, -4.1], [0.98, -4.15], [1.04, -10.68]];
    const S60 = [[-14.69, 25.1], [-14.51, 17.93], [5.09, 17.9], [5.09, 9.79], [14.27, 9.89], [14.22, 15.62], [16.04, 15.68], [16.04, 23.29], [14.06, 25.51], [5.33, 25.4], [5.31, 27.0], [-7.04, 27.0], [-6.98, 25.2]];
    const N60 = S60.map(p => [p[0], -p[1] - 0.6]).reverse();
    const ST = [[-4.57, 26.27], [-4.45, 19.02], [3.98, 19.41], [4.05, 17.66], [8.61, 17.67], [8.61, 22.23], [3.24, 22.21], [3.22, 26.33]];
    const NT = [[-4.29, -18.94], [-4.25, -25.92], [2.74, -25.88], [2.75, -19.61], [7.27, -19.7], [7.26, -17.64], [8.87, -17.61], [8.84, -13.71], [2.44, -13.74], [2.43, -17.5], [-0.66, -17.51], [-0.71, -18.85]];
    for (const [sx, cx] of [[1, 103.0], [-1, -103.1]]){
      const f = P => { const Q = tr(P, sx, cx); return sx < 0 ? Q.reverse() : Q; };
      blk(f(S45), 0.3, 45, BR); blk(f(N45), 0.3, 45, BR); blk(f(M10), 0.3, 10, BR2, {fh:4.6, hf:0.7});
      m4Band(T, f(S45), 44.2, 0.9, 0.4, TC); m4Band(T, f(N45), 44.2, 0.9, 0.4, TC); m4Band(T, f(S45), 9.6, 0.6, 0.3, TC); m4Band(T, f(N45), 9.6, 0.6, 0.3, TC);
      blk(f(S57), 45, 57, BR2, {fh:6, hf:0.62, arch:true, bw:3.0}); blk(f(N57), 45, 57, BR2, {fh:6, hf:0.62, arch:true, bw:3.0});
      m4Band(T, f(S57), 56.3, 0.7, 0.35, TC); m4Band(T, f(N57), 56.3, 0.7, 0.35, TC);
      blk(f(S60), 57, 60, BR, {fh:3}); blk(f(N60), 57, 60, BR, {fh:3});
      // the corner towers: arcaded stage, cornice, octagonal lantern with a small dome
      for (const [P, oz] of [[ST, 22.7], [NT, -22.6]]){ const Q = f(P); blk(Q, 60, 66, BR, {fh:6, hf:0.62, arch:true, bw:2.0, wf:0.5}); m4Band(T, Q, 65.4, 0.6, 0.35, TC);
        const ox = cx + sx*(-0.6); T.cyl(BR, ox, 66, oz, 2.25, 4.0, 8); for (let j = 0; j < 8; j++){ const a = (j + 0.5)/8*Math.PI*2; T.box({c:'#3a3633', glow:'#ffcf8a', gk:0.5}, ox + Math.cos(a)*2.2, 66.8, oz + Math.sin(a)*2.2, -Math.sin(a), Math.cos(a), 0.9, 2.2, 0.1); }
        T.cyl(TC, ox, 70, oz, 2.5, 0.5, 8); T.cyl(ROOF, ox, 70.5, oz, 2.2, 1.8, 8, 0.3); T.cyl(TC, ox, 72.3, oz, 0.12, 1.2, 4); }
      // shops / lobbies along the avenue face
      const xa = cx + sx*19.05; T.q(SHOP, [xa + sx*0.06, 0.4, -29.5], [xa + sx*0.06, 0.4, 29.5], [xa + sx*0.06, 4.2, 29.5], [xa + sx*0.06, 4.2, -29.5]);
    }
    // ---- the ten blocks along 24th St (north, -z) and 23rd St (south, +z): x ranges and depths from the real footprints
    const XS = [[-84.0, -50.4], [-50.4, -16.9], [-16.9, 16.7], [16.7, 50.3], [50.3, 84.0]];
    for (const [z0, z1, pz0, pz1, tz0, tz1] of [[-24.8, -8.9, -23.5, -11.0, -19.1, -13.1], [12.9, 28.9, 15.0, 27.4, 17.0, 23.1]]){
      for (const [x0, x1] of XS){ const P = m4Rect(x0, z0, x1, z1);
        blk(P, 0.3, 47, BR); m4Band(T, P, 46.2, 0.8, 0.4, TC); m4Band(T, P, 3.6, 0.5, 0.25, TC);
        // shallow projecting bays on the street face (every other pair of windows)
        const zf = z0 < 0 ? z0 : z1, s = z0 < 0 ? -1 : 1;
        for (let x = x0 + 4.2; x < x1 - 3; x += 8.4) T.abox(BR2, x - 1.6, 4.1, Math.min(zf, zf + s*0.6), x + 1.6, 44, Math.max(zf, zf + s*0.6));
        // rooftop: the arcaded penthouse storey and the water-tank house with its arched top
        const cxm = (x0 + x1)/2, w = (x1 - x0) - 8.6;
        const PH = m4Rect(cxm - w/2, pz0 < pz1 ? pz0 : pz1, cxm + w/2, pz0 < pz1 ? pz1 : pz0); blk(PH, 47, 51.5, BR2, {fh:4.5, hf:0.62, arch:true, bw:2.6}); m4Band(T, PH, 51.0, 0.5, 0.3, TC);
        const TH = m4Rect(cxm - 3.1, Math.min(tz0, tz1), cxm + 3.1, Math.max(tz0, tz1)); blk(TH, 51.5, 58.5, BR, {fh:7, hf:0.55, arch:true, bw:2.0, wf:0.42});
        T.cyl(ROOF, cxm, 58.5, (tz0 + tz1)/2, 4.0, 1.5, 4, 0.2);
      } }
    // front gardens with low fences on 24th St, the stoops on 23rd St
    T.abox(LAWN, -84, 0.3, -30.4, 84, 0.55, -25.0);
    for (const x of [-84, 84]) T.abox(FENCE, x - 0.05, 0.3, -30.5, x + 0.05, 1.2, -24.9);
    T.abox(FENCE, -84, 1.1, -30.55, 84, 1.2, -30.45); for (let x = -84; x <= 84; x += 1.2) T.abox(FENCE, x, 0.3, -30.53, x + 0.05, 1.2, -30.47);
    for (let x = -80; x < 82; x += 12) m4Tree(T, x, 0.55, -27.8, 1.5, LEAF, TRUNK);
    // the garden court: lawns, paths, trees; the low pool / club building in the middle
    T.abox(LAWN, -84, 0.3, -8.9, 84, 0.45, 12.9);
    T.abox(PATH, -84, 0.46, 0.8, 84, 0.52, 3.2); T.abox(PATH, -40, 0.46, -8.9, -38, 0.52, 12.9); T.abox(PATH, 38, 0.46, -8.9, 40, 0.52, 12.9);
    blk([[-8.0, -9.6], [7.3, -9.6], [7.3, 13.5], [-8.0, 13.5]], 0.3, 10, BR2, {fh:5, hf:0.7, arch:true, bw:3.2});
    m4Band(T, m4Rect(-8, -9.6, 7.3, 13.5), 9.5, 0.5, 0.3, TC);
    for (const [x, z] of [[-75, -4], [-62, 7], [-50, -3], [-27, 8], [-18, -4], [20, 7], [28, -5], [52, 7], [63, -3], [76, 6], [-70, 9], [70, -6]]) m4Tree(T, x, 0.45, z, 2.4, LEAF, TRUNK);
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nylondonterrace', lat:LTB[0], lon:LTB[1], rot:LTB[2]});
// =====================================================================================================================
// Chelsea Piers (Piers 59-61 on the Hudson, 1910 / rebuilt 1995 as the sports complex): the long head house along the
// West Side Highway (12 m rear section, 17 m street section, the taller pier-head fronts with their big arched windows),
// the Pier 61 and Pier 60 sheds (20 m, a raised roof monitor down the middle, clerestory window bands, corrugated metal
// siding, the low west-end pavilions), and Pier 59: the four-level golf tee building and the driving range over the
// pier with its tall poles and plain netting, turf and target greens. Split into three compact keys so the hidden-
// building hulls stay on the piers (nychelseapiers = Pier 61 + north head house, _b = Pier 60, _c = Pier 59 / golf).
// Frame (shared by the three keys, from the real footprints): local +x = east (the head house front on the highway at
// x = 111), +z = south; each key is built round its own centre.
const CPO = [40.7468, -74.0097, -0.1353];
function m4CPll(x, z){ const c = Math.cos(CPO[2]), s = Math.sin(CPO[2]), X = x*c + z*s, Z = -x*s + z*c; return [+(CPO[0] - Z/111048).toFixed(6), +(CPO[1] + X/84516).toFixed(6)]; }
function m4CPmat(){ return {
  SHED:{c:'#c9cdca', m:0, lc:'#e6eefc', lk:0.35}, SHED2:{c:'#b3b9b8', m:0, lc:'#e6eefc', lk:0.3}, TRIM:'#3b4954', ROOF:'#7b7e7c', DECK:'#8b8882', PILE:'#3a3834',
  WIN:{c:'#2e3944', glow:'#d4e6ff', gk:0.5}, WARM:{c:'#33302c', glow:'#ffd9a0', gk:0.7}, FRONT:{c:'#d8d6cf', m:0, lc:'#fff0d8', lk:0.8}}; }
// a pier shed: box with vertical siding ribs, a clerestory window band, optional raised monitor [z0, z1, h]
function m4Shed(T, M, x0, x1, z0, z1, h, mon){
  T.prism(M.SHED, m4Rect(x0, z0, x1, z1), 0.3, h, true, M.ROOF);
  const P = m4Rect(x0, z0, x1, z1);
  m4VStrips(T, P, 0.3, h - 0.4, 2.4, 0.12, M.SHED2, null, 0.08);                      // siding ribs
  for (const e of m4Edges(P)){ const o = 0.1, A = [e.a[0] + e.nx*o, e.a[1] + e.nz*o], B = [e.b[0] + e.nx*o, e.b[1] + e.nz*o];
    T.q(M.WIN, [A[0], h - 5.2, A[1]], [B[0], h - 5.2, B[1]], [B[0], h - 2.4, B[1]], [A[0], h - 2.4, A[1]]);           // clerestory band
    T.q(M.TRIM, [A[0], h - 0.9, A[1]], [B[0], h - 0.9, B[1]], [B[0], h, B[1]], [A[0], h, A[1]]); }                   // coping
  m4Win(T, P, {y0:1.0, y1:4.2, fh:3.4, bw:7.5, wf:0.5, hf:0.85, col:M.WIN, out:0.12, min:6});                       // ground-floor openings
  for (let x = x0 + 12; x < x1 - 4; x += 12) for (const [z, s] of [[z0, -1], [z1, 1]]) T.abox(M.TRIM, x - 0.35, 0.3, Math.min(z, z + s*0.45), x + 0.35, h - 0.9, Math.max(z, z + s*0.45));   // steel pilasters
  for (let x = x0 + 18; x < x1 - 10; x += 36){ T.abox(M.ROOF, x, h, (z0 + z1)/2 - (z1 - z0)*0.42, x + 5, h + 2.2, (z0 + z1)/2 - (z1 - z0)*0.3); }                  // rooftop plant
  { const zc = (z0 + z1)/2, w = (z1 - z0)*0.62; T.q(M.WIN, [x0 - 0.12, 2, zc - w/2], [x0 - 0.12, 2, zc + w/2], [x0 - 0.12, h - 3, zc + w/2], [x0 - 0.12, h - 3, zc - w/2]);
    for (let k = 0; k <= 6; k++) T.abox(M.TRIM, x0 - 0.3, 2, zc - w/2 + k*w/6 - 0.12, x0 - 0.05, h - 3, zc - w/2 + k*w/6 + 0.12); }        // the glazed west end
  if (mon){ const Q = m4Rect(x0 + 6, mon[0], x1 - 1, mon[1]); T.prism(M.SHED2, Q, h, mon[2], true, M.ROOF);
    for (const e of m4Edges(Q)) if (e.L > 20){ const o = 0.08; T.q(M.WIN, [e.a[0] + e.nx*o, h + 0.8, e.a[1] + e.nz*o], [e.b[0] + e.nx*o, h + 0.8, e.b[1] + e.nz*o], [e.b[0] + e.nx*o, mon[2] - 0.8, e.b[1] + e.nz*o], [e.a[0] + e.nx*o, mon[2] - 0.8, e.a[1] + e.nz*o]); } }
}
// pier deck on piles
function m4Deck(T, M, x0, x1, z0, z1){ T.abox(M.DECK, x0, -0.9, z0, x1, 0.3, z1); T.abox(M.PILE, x0 + 0.5, -5, z0 + 0.5, x1 - 0.5, -0.9, z1 - 0.5);
  for (let x = x0; x <= x1; x += 6){ T.abox(M.ROOF, x, 0.3, z0 - 0.02, x + 0.08, 1.3, z0 + 0.06); T.abox(M.ROOF, x, 0.3, z1 - 0.06, x + 0.08, 1.3, z1 + 0.02); }
  T.abox(M.ROOF, x0, 1.2, z0 - 0.02, x1, 1.3, z0 + 0.06); T.abox(M.ROOF, x0, 1.2, z1 - 0.06, x1, 1.3, z1 + 0.02); }
// head-house section x 45..111 between z0 and z1, with the pier-head front (taller, arched window) between f0 and f1
function m4Head(T, M, z0, z1, f0, f1, fh){
  T.prism(M.SHED2, m4Rect(45, z0, 88, z1), 0.3, 12, true, M.ROOF);
  T.prism(M.FRONT, m4Rect(88, z0, 111.4, z1), 0.3, 17, true, M.ROOF);
  m4Win(T, m4Rect(88, z0, 111.4, z1), {y0:1, y1:16, fh:4.6, bw:3.6, wf:0.5, hf:0.62, col:M.WIN, out:0.06, min:5, on:e => e.nx > 0.7});
  m4Band(T, m4Rect(88, z0, 111.4, z1), 16.3, 0.7, 0.3, M.TRIM);
  T.q(M.WARM, [111.48, 0.3, z0 + 1], [111.48, 0.3, z1 - 1], [111.48, 3.6, z1 - 1], [111.48, 3.6, z0 + 1]);
  if (f0 !== undefined){ const P = m4Rect(88, f0, 111.4, f1); T.prism(M.FRONT, P, 0.3, fh, true, M.ROOF); m4Band(T, P, fh - 0.8, 0.8, 0.35, M.TRIM);
    const zc = (f0 + f1)/2, r = (f1 - f0)*0.36, yb = fh - 4 - r;                         // the great arched window of the pier head
    T.q(M.WIN, [111.5, 5, zc - r], [111.5, 5, zc + r], [111.5, yb, zc + r], [111.5, yb, zc - r]);
    for (let j = 0; j < 12; j++){ const a0 = j/12*Math.PI, a1 = (j + 1)/12*Math.PI; T.t(M.WIN, [111.5, yb, zc], [111.5, yb + Math.sin(a0)*r, zc + Math.cos(a0)*r], [111.5, yb + Math.sin(a1)*r, zc + Math.cos(a1)*r]); }
    for (let k = -2; k <= 2; k++) T.abox(M.TRIM, 111.4, 5, zc + k*r*0.4 - 0.12, 111.6, yb + Math.sqrt(Math.max(0, 1 - (k*0.4)*(k*0.4)))*r, zc + k*r*0.4 + 0.12); }
}
function m4CPgroup(cx, cz, fn){ const g = new THREE.Group(), T = m4TB(), M = m4CPmat(); fn(T, M); T.flush(g, cx, cz); return g; }
const CPA = [-20, -121], CPB = [-19, 21], CPC = [-20, 136];
LANDMARKS.nychelseapiers = {zh:'切尔西码头', en:'Chelsea Piers', cat:'old', r:160, h:25,
  lt:{m:0, c:'#e6eefc', k:0.35},
  build(){ return m4CPgroup(CPA[0], CPA[1], (T, M) => {
    m4Deck(T, M, -153, 45, -112, -72.6); m4Shed(T, M, -133.8, 45, -110.1, -74.6, 20, [-98.8, -87.3, 24.5]);
    T.prism(M.SHED2, m4Rect(-152.1, -111.7, -133.8, -74.7), 0.3, 7, true, M.ROOF); T.prism(M.SHED, m4Rect(-146, -105.9, -133.8, -76.8), 7, 14, true, M.ROOF);
    m4Win(T, m4Rect(-146, -105.9, -133.8, -76.8), {y0:8, y1:13.4, fh:5.4, bw:3.2, wf:0.7, hf:0.8, col:M.WIN, out:0.06, min:5});   // the west-end pavilion
    m4Head(T, M, -153.6, -36.5, -110.1, -74.6, 25); m4Head(T, M, -205.3, -153.6, -205.3, -194.2, 25);
    T.prism(M.FRONT, m4Rect(73, -170.3, 87.9, -157.3), 12, 22, true, M.ROOF);
  }); }};
LANDMARKS.nychelseapiers_b = {zh:'切尔西码头', en:'Chelsea Piers', cat:'old', r:145, h:25, label:false,
  lt:{m:0, c:'#e6eefc', k:0.35},
  build(){ return m4CPgroup(CPB[0], CPB[1], (T, M) => {
    m4Deck(T, M, -150, 45, 2.1, 42.4); m4Shed(T, M, -134.7, 45, 4.1, 40.4, 20, [16.3, 27.1, 24.5]);
    T.prism(M.SHED2, m4Rect(-149, 4.1, -134.7, 40.0), 0.3, 12, true, M.ROOF);
    m4Win(T, m4Rect(-149, 4.1, -134.7, 40.0), {y0:2, y1:11, fh:4.5, bw:3.0, wf:0.7, hf:0.8, col:M.WIN, out:0.06, min:5});
    m4Head(T, M, -36.5, 79.2, 4.1, 40.4, 25);
  }); }};
LANDMARKS.nychelseapiers_c = {zh:'切尔西码头高尔夫练习场', en:'Chelsea Piers golf range', cat:'old', r:146, h:40, label:false,
  lt:{m:0, c:'#e6eefc', k:0.35},
  build(){ return m4CPgroup(CPC[0], CPC[1], (T, M) => {
    const TURF = '#5f8f4a', TURF2 = '#6fa257', NET = {c:'#2b2f31', op:0.32, ds:true}, POLE = '#55595b', WHITE = '#e8e8e2', LAMP = {c:'#dfe6ea', glow:'#fff6dc', gk:1.6};
    // head house and the tee building (four open levels facing the range)
    m4Head(T, M, 79.1, 194.2, 118.2, 155.4, 25);
    T.prism(M.SHED, m4Rect(22.5, 118.2, 45, 155.4), 0.3, 20, true, M.ROOF); T.prism(M.SHED2, m4Rect(22.5, 131.4, 45, 142.8), 20, 24.5, true, M.ROOF);
    for (let l = 0; l < 4; l++){ const y = 0.6 + l*4.6;
      T.q(M.WARM, [22.4, y + 0.6, 119], [22.4, y + 0.6, 154.6], [22.4, y + 3.9, 154.6], [22.4, y + 3.9, 119]);
      T.abox(M.TRIM, 21.6, y + 4.0, 118.2, 22.5, y + 4.6, 155.4);
      for (let z = 120; z < 155; z += 2.6) T.abox(M.SHED2, 21.9, y + 0.6, z, 22.5, y + 4.0, z + 0.15); }
    // the range over Pier 59: deck, turf, target greens, distance markers
    m4Deck(T, M, -152, 22.5, 114.5, 159);
    T.abox(TURF, -150, 0.3, 116, 22.4, 0.5, 157);
    for (const [x, z, r] of [[-30, 128, 5], [-62, 146, 6], [-95, 126, 7], [-125, 143, 8]]){ T.cyl(TURF2, x, 0.5, z, r, 0.12, 14); T.cyl(WHITE, x, 0.62, z, 0.5, 0.1, 6); }
    for (const x of [-20, -55, -90, -120]) T.abox(WHITE, x, 0.5, 116.4, x + 0.4, 1.4, 117.2);
    // tall poles and plain netting along both sides and across the far end (no text, no logos)
    const H = 40, PX = [], ZS = [116, 157];
    for (let x = 18; x >= -150; x -= 21) PX.push(x); if (PX[PX.length - 1] > -150) PX.push(-150);
    for (const z of ZS) for (const x of PX){ T.cyl(POLE, x, 0.5, z, 0.45, H, 8, 0.3); T.box(LAMP, x, H - 3, z + (z < 130 ? 0.8 : -0.8), 1, 0, 1.4, 0.6, 0.8); }
    for (const z of [126, 136.5, 147]){ T.cyl(POLE, -150, 0.5, z, 0.45, H, 8, 0.3); }
    for (const z of ZS) T.q(NET, [18, 1, z], [-150, 1, z], [-150, H, z], [18, H, z]);
    T.q(NET, [-150, 1, 116], [-150, 1, 157], [-150, H, 157], [-150, H, 116]);
    for (const z of ZS) T.abox(POLE, -150, H - 0.15, z - 0.1, 18, H + 0.05, z + 0.1);
    T.abox(POLE, -150.1, H - 0.15, 116, -149.9, H + 0.05, 157);
  }); }};
for (const [k, c] of [['nychelseapiers', CPA], ['nychelseapiers_b', CPB], ['nychelseapiers_c', CPC]]){ const ll = m4CPll(c[0], c[1]); SG_PLACES.push({type:k, lat:ll[0], lon:ll[1], rot:CPO[2]}); }
// =====================================================================================================================
// Saint Thomas Church Fifth Avenue (1913, Cram, Goodhue & Ferguson; French High Gothic in Kentucky limestone): the tall
// nave under a steep slate roof with buttresses and the five tall tripartite windows plus clerestory on the 53rd Street
// side; the asymmetric Fifth Avenue front — the deep pointed portal between big buttresses, the great rose window above
// it, the gable; the square south-east tower at the corner of 53rd Street with its paired belfry lancets, buttresses,
// pierced parapet and corner pinnacles; the narrow north aisle; the lower west end. No figures, no lettering.
// Frame: Midtown grid; +x east-south-east (the Fifth Ave front at x ~ 36-39), +z south-south-west (53rd St at z ~ +15).
const STT = [40.76085, -73.976265, -0.5001];
LANDMARKS.nystthomas = {zh:'第五大道圣托马斯教堂', en:'Saint Thomas Church Fifth Avenue', cat:'old', r:45, h:55,
  lt:{m:0, c:'#ffe3b8', k:0.75, e:0.4},
  build(){
    const g = new THREE.Group(), T = m4TB();
    const LS = {c:'#cbc2b0'}, LS2 = {c:'#bdb39f'}, ROOF = '#575d5a', WIN = {c:'#2f3438', glow:'#ffcf8e', gk:0.4}, DOOR = '#3a2c22', DARK = '#3b3d3f';
    const ZN = -15.2, ZS = 14.65, XW = -31, XF = 35.4, WALL = 25, RIDGE = 37;
    // plinth
    T.prism(LS2, [[-39.1, 15.1], [-39.0, -3.9], [-34.4, -3.9], [-34.3, -9.1], [-31.0, -9.0], [-31.0, -15.2], [35.7, -15.2], [35.6, -8.9], [38.9, -8.8], [38.8, 2.7], [35.4, 2.75], [35.3, 15.0]], -5, 0.5, true);
    // nave + aisles: one tall body to the eaves, steep roof (ridge along x), the north aisle slightly lower
    T.prism(LS, m4Rect(XW, ZN + 4.5, XF, ZS), 0.5, WALL, false);
    T.prism(LS2, m4Rect(XW, ZN, XF, ZN + 4.5), 0.5, 15, true, ROOF);
    m4Gable(T, XW, ZN + 4.5, XF - 0.5, ZS, WALL, RIDGE, 'x', ROOF, LS, 0.5);
    m4Band(T, m4Rect(XW, ZN + 4.5, XF, ZS), WALL - 1.2, 1.2, 0.35, LS2);
    // flèche / ridge cresting
    T.abox(DARK, XW, RIDGE - 0.1, -0.35 + (ZN + 4.5 + ZS)/2 - 0.0, XF - 1, RIDGE + 0.5, 0.35 + (ZN + 4.5 + ZS)/2);
    // south side (53rd St): buttresses between five bays; tall tripartite gallery windows; clerestory lancets above
    const bays = 5, bx0 = XW + 3, bx1 = 22, bw = (bx1 - bx0)/bays;
    for (let k = 0; k <= bays; k++){ const x = bx0 + k*bw; T.abox(LS2, x - 0.9, 0.5, ZS, x + 0.9, WALL - 2, ZS + 2.2); m4Pinn(T, LS2, x, WALL - 2, ZS + 1.1, 1.2, 5); }
    for (let k = 0; k < bays; k++){ const x = bx0 + (k + 0.5)*bw;
      for (const dx of [-1.6, 0, 1.6]) m4Opening(T, WIN, x + dx, ZS, 1, 0, 0, 1, 1.25, 4.5, 13 + (dx ? 0 : 1.2), 'p');
      for (const dx of [-1.3, 1.3]) m4Opening(T, WIN, x + dx, ZS, 1, 0, 0, 1, 1.1, 16, 21.5, 'p');
      if (k >= 1 && k <= 3) m4Opening(T, DOOR, x, ZS + 2.2, 1, 0, 0, 1, 2.2, 0.5, 3.6, 'p'); }
    // north side: aisle windows and clerestory
    for (let k = 0; k < bays; k++){ const x = bx0 + (k + 0.5)*bw; m4Opening(T, WIN, x, ZN, -1, 0, 0, -1, 2.2, 4, 11, 'p'); for (const dx of [-1.3, 1.3]) m4Opening(T, WIN, x + dx, ZN + 4.5, -1, 0, 0, -1, 1.1, 16.5, 21.5, 'p'); }
    // west end (chancel / sacristies on the real plan), lower, with a gable
    T.prism(LS2, [[-39.1, 15.1], [-39.0, -3.9], [-34.4, -3.9], [-34.3, -9.1], [XW, -9.0], [XW, 15.0]], 0.5, 18, true, ROOF);
    T.prism(LS2, m4Rect(-34.3, ZN, XW, -9.0), 0.5, 15, true, ROOF);
    // ---- Fifth Avenue front: the projecting portal block (z -8.9..2.7), big buttresses, rose window, gable
    const PZ0 = -8.9, PZ1 = 2.7, PC = (PZ0 + PZ1)/2;
    T.prism(LS, m4Rect(XF, PZ0, 38.85, PZ1), 0.5, 24, true, LS2);
    for (const z of [PZ0 - 0.6, PZ1 + 0.6]){ T.abox(LS2, XF, 0.5, z - 1.2, 39.6, 30, z + 1.2); m4Pinn(T, LS2, 37.8, 30, z, 1.6, 7); }
    // the portal: stepped archivolts (nested pointed arches) and the doors
    for (let i = 0; i < 4; i++) m4Opening(T, i % 2 ? LS : LS2, 38.85 + 0.05 + i*0.02, PC, 0, 1, 1, 0, 8.4 - i*1.4, 0.5, 9.5 - i*0.4, 'p', 0.05 + i*0.03);
    m4Opening(T, DOOR, 38.85, PC, 0, 1, 1, 0, 3.0, 0.5, 6.0, 'p', 0.2);
    T.abox(LS2, 38.85, 0.5, PC - 0.25, 39.2, 6.4, PC + 0.25);                                           // trumeau (plain)
    // the gallery of niches over the portal (plain, no figures), then the rose window
    for (let k = -3; k <= 3; k++) m4Opening(T, LS2, 38.85, PC + k*1.35, 0, 1, 1, 0, 0.9, 13.5, 15.5, 'p', 0.15);
    m4Rose(T, WIN, 38.85, 21, PC, 4.6, 0, 1, 1, 0, 20);
    for (let j = 0; j < 8; j++){ const a = j/8*Math.PI; T.box(LS2, 38.95, 21 - 0.12, PC, 0, 1, 0.01, 0.24, 0.24); T.box(LS2, 38.98, 21 + Math.sin(a)*2.3 - 0.1, PC + Math.cos(a)*2.3, Math.cos(a), Math.sin(a), 0.2, 0.2, 0.2); }
    m4Rose(T, LS2, 38.9, 21, PC, 1.2, 0, 1, 1, 0, 12);
    // front gable over the nave end
    T.t(LS, [XF + 0.02, WALL, ZN + 4.5], [XF + 0.02, WALL, ZS], [XF + 0.02, RIDGE + 1.5, (ZN + 4.5 + ZS)/2]);
    T.abox(LS2, 36.6, 24, PZ0, 38.85, 26, PZ1);
    m4Opening(T, LS2, XF, (ZN + 4.5 + ZS)/2 - 1.5, 0, 1, 1, 0, 1.3, 28, 31.5, 'p', 0.08);
    T.cyl(LS2, XF + 0.3, RIDGE + 1.5, (ZN + 4.5 + ZS)/2, 0.35, 2.4, 6, 0.05);
    // the north end of the front: narrow wall with the north entrance
    m4Opening(T, DOOR, XF, ZN + 2.4, 0, 1, 1, 0, 1.8, 0.5, 3.8, 'p');
    m4Opening(T, WIN, XF, ZN + 2.4, 0, 1, 1, 0, 1.4, 6.5, 12.5, 'p');
    // ---- the south-east tower (x 23.4..35.4, z 2.7..14.65), buttressed, belfry stage, pierced parapet, pinnacles
    const TX0 = 23.4, TX1 = XF, TZ0 = 2.75, TZ1 = ZS + 0.6, TOP = 48, tc = [(TX0 + TX1)/2, (TZ0 + TZ1)/2];
    T.prism(LS, m4Rect(TX0, TZ0, TX1 + 0.4, TZ1), 0.5, TOP, true, ROOF);
    for (const y of [14, 24, 31]) m4Band(T, m4Rect(TX0, TZ0, TX1 + 0.4, TZ1), y, 0.7, 0.3, LS2);
    for (const [x, z, dx, dz] of [[TX1 + 0.4, TZ1, 1, 1], [TX1 + 0.4, TZ0, 1, -1], [TX0, TZ1, -1, 1]]){                // corner buttresses
      T.abox(LS2, Math.min(x, x + dx*1.6) , 0.5, Math.min(z, z - dz*2.2), Math.max(x, x + dx*1.6), 41, Math.max(z, z - dz*2.2));
      T.abox(LS2, Math.min(x, x - dx*2.2), 0.5, Math.min(z, z + dz*1.6), Math.max(x, x - dx*2.2), 41, Math.max(z, z + dz*1.6)); }
    for (const [cx, cz, ux, uz, nx, nz] of [[TX1 + 0.4, tc[1], 0, 1, 1, 0], [tc[0], TZ1, 1, 0, 0, 1], [tc[0], TZ0, -1, 0, 0, -1], [TX0, tc[1], 0, -1, -1, 0]]){
      for (const d of [-1.6, 1.6]) m4Opening(T, WIN, cx + ux*d, cz + uz*d, ux, uz, nx, nz, 2.0, 33, 42, 'p');   // paired belfry lancets
      m4Opening(T, WIN, cx, cz, ux, uz, nx, nz, 1.4, 17, 23, 'p'); }
    m4Opening(T, DOOR, TX1 + 0.4, tc[1], 0, 1, 1, 0, 2.4, 0.5, 4.8, 'p');                                      // chantry entrance on Fifth
    const PP = m4Rect(TX0 - 0.4, TZ0 - 0.4, TX1 + 0.8, TZ1 + 0.4);
    m4Band(T, PP, TOP - 0.6, 0.6, 0.25, LS2);
    for (const e of m4Edges(PP)) for (let t = 0.8; t < e.L - 0.4; t += 1.0){ const x = e.a[0] + e.ux*t, z = e.a[1] + e.uz*t; T.box(LS2, x, TOP, z, e.ux, e.uz, 0.5, 1.6, 0.35); }  // pierced parapet
    for (const [x, z] of [[TX0 - 0.4, TZ0 - 0.4], [TX1 + 0.8, TZ0 - 0.4], [TX1 + 0.8, TZ1 + 0.4], [TX0 - 0.4, TZ1 + 0.4]]) m4Pinn(T, LS2, x, TOP - 0.6, z, 1.6, 7.5);
    for (const [x, z] of [[tc[0], TZ0 - 0.4], [tc[0], TZ1 + 0.4], [TX0 - 0.4, tc[1]], [TX1 + 0.8, tc[1]]]) m4Pinn(T, LS2, x, TOP, z, 0.9, 4);
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nystthomas', lat:STT[0], lon:STT[1], rot:STT[2]});
// =====================================================================================================================
// Church of St. Paul the Apostle (1876-85, Jeremiah O'Rourke / Fr. George Deshon; Paulist Fathers): the fortress-like
// basilica of rough grey granite ashlar (stone from the old Croton Aqueduct reservoir) on Columbus Avenue at 60th St —
// the broad front between two square, flat-topped towers (corner turrets, belfry lancets), three round-arched portals,
// the large plain relief panel over the centre portal (no figures), the rose window and the gable; the long nave under a
// slate roof with buttresses and lancet windows, the low chapels along the south side, the west wings round the apse.
// Frame: Midtown grid; +x east-south-east (the Columbus Ave front at x = 45), -z = 60th St (north), +z toward 59th St.
const SPA = [40.769888, -73.985143, -0.502];
LANDMARKS.nystpaulapostle = {zh:'圣保禄宗徒堂', en:'Church of St. Paul the Apostle', cat:'old', r:52, h:44,
  lt:{m:0, c:'#ffe2b6', k:0.7, e:0.45},
  build(){
    const g = new THREE.Group(), T = m4TB();
    const GR = {c:'#8f8d87'}, GR2 = {c:'#7e7c77'}, TRIM = {c:'#a7a49b'}, ROOF = '#4c514f', WIN = {c:'#2e3236', glow:'#ffcf8e', gk:0.4}, DOOR = '#3b2d22';
    const XF = 45.3, ZN = -18.7, ZS = 15.9, XA = -36.8, WALL = 22, RIDGE = 34;
    T.prism(GR2, [[-45.62, 19.0], [-45.53, 7.32], [-36.84, 7.34], [-40.42, 2.92], [-40.4, -3.71], [-37.66, -6.81], [-45.45, -6.87], [-45.15, -20.26], [-30.07, -20.22], [-30.06, -17.71], [-21.38, -17.69], [-21.33, -18.85], [34.57, -18.62], [34.52, -19.97], [45.4, -19.89], [45.23, 20.13], [33.91, 20.07], [33.93, 15.95], [-1.75, 15.8], [-2.0, 20.73], [-4.42, 20.69], [-4.41, 22.17], [-15.2, 22.04], [-15.28, 18.78], [-21.32, 18.79], [-21.28, 22.19], [-29.38, 22.18], [-29.27, 19.27], [-32.0, 19.29], [-32.02, 22.15], [-39.9, 22.14], [-39.8, 19.0]], -5, 0.5, true);
    // nave with buttresses and lancets; slate roof
    T.prism(GR, m4Rect(XA, ZN, 34, ZS), 0.5, WALL, false);
    m4Gable(T, XA, ZN, 34, ZS, WALL, RIDGE, 'x', ROOF, GR, 0.6);
    m4Band(T, m4Rect(XA, ZN, 34, ZS), WALL - 1.0, 1.0, 0.4, TRIM);
    const nb = 7, bw = (32 - XA)/nb;
    for (let k = 0; k <= nb; k++){ const x = XA + 1 + k*bw; T.abox(GR2, x - 0.8, 0.5, ZN - 1.8, x + 0.8, WALL - 3, ZN); T.abox(GR2, x - 0.8, 11, ZS, x + 0.8, WALL - 3, ZS + 1.2); }
    for (let k = 0; k < nb; k++){ const x = XA + 1 + (k + 0.5)*bw;
      for (const d of [-1.1, 1.1]) m4Opening(T, WIN, x + d, ZN, -1, 0, 0, -1, 1.3, 9, 17.5, 'p');
      for (const d of [-1.1, 1.1]) m4Opening(T, WIN, x + d, ZS, 1, 0, 0, 1, 1.2, 12.5, 18.5, 'p'); }
    // low side chapels along the south (real bumps of the plan) with lean-to roofs
    T.prism(GR2, m4Rect(-39.9, ZS, -2.0, 19.0), 0.5, 10, true, ROOF);
    T.q(ROOF, [-40.2, 10, 19.3], [-1.7, 10, 19.3], [-1.7, 12.2, ZS], [-40.2, 12.2, ZS]);
    // west end: the apse between two gabled wings
    for (const [z0, z1] of [[7.3, 19.0], [-20.3, -6.9]]){ T.prism(GR, m4Rect(-45.6, z0, XA, z1), 0.5, 15, false); m4Gable(T, -45.6, z0, XA, z1, 15, 21, 'x', ROOF, GR, 0.4);
      m4Opening(T, WIN, -45.6, (z0 + z1)/2, 0, -1, -1, 0, 1.6, 6, 11.5, 'p'); }
    const AP = [[XA, 7.3], [-40.4, 2.9], [-40.4, -3.7], [XA - 0.8, -6.8]];
    T.prism(GR, [...AP, [XA, -6.8]].reverse(), 0.5, 19, true, ROOF);
    T.q(ROOF, [-40.6, 19, 3.0], [-40.6, 19, -3.8], [XA, RIDGE - 4, -1], [XA, RIDGE - 4, 0.5]); T.t(ROOF, [XA, 19, 7.4], [-40.6, 19, 3.0], [XA, RIDGE - 4, 0.5]); T.t(ROOF, [-40.6, 19, -3.8], [XA - 0.8, 19, -6.9], [XA, RIDGE - 4, -1]);
    // ---- the front block on Columbus Avenue: centre (z -8.9..9.1) with gable, two towers at the corners
    const FZ0 = -8.9, FZ1 = 9.1, FC = 0.1;
    T.prism(GR, m4Rect(34, FZ0, XF, FZ1), 0.5, 26, false);
    T.t(GR, [XF, 26, FZ0], [XF, 26, FZ1], [XF, 35.5, FC]); T.t(GR, [34, 26, FZ1], [34, 26, FZ0], [34, 35.5, FC]);
    T.q(ROOF, [XF + 0.4, 26, FZ0 - 0.3], [34, 26, FZ0 - 0.3], [34, 35.5, FC], [XF + 0.4, 35.5, FC]); T.q(ROOF, [34, 26, FZ1 + 0.3], [XF + 0.4, 26, FZ1 + 0.3], [XF + 0.4, 35.5, FC], [34, 35.5, FC]);
    for (let i = 0; i < 12; i++){ const t0 = i/12, t1 = (i + 1)/12;                                    // stepped gable coping
      for (const s of [-1, 1]){ const za = FC + s*(1 - t0)*(FZ1 - FC), zb = FC + s*(1 - t1)*(FZ1 - FC); T.abox(TRIM, XF - 0.2, 26 + t0*9.5, Math.min(za, zb), XF + 0.5, 26 + t1*9.5 + 0.4, Math.max(za, zb)); } }
    T.cyl(TRIM, XF - 0.2, 35.5, FC, 0.6, 2.4, 4, 0.1);
    // portals: centre round-arched and deep (stepped orders), two lesser side portals; the steps
    for (let i = 0; i < 3; i++) m4Opening(T, i % 2 ? GR2 : TRIM, XF, FC, 0, 1, 1, 0, 5.6 - i*1.0, 0.5, 6.5, 'r', 0.06 + i*0.03);
    m4Opening(T, DOOR, XF, FC, 0, 1, 1, 0, 2.8, 0.5, 5.5, 'r', 0.18);
    for (const z of [-5.6, 5.8]){ m4Opening(T, TRIM, XF, z, 0, 1, 1, 0, 2.8, 0.5, 4.8, 'r', 0.06); m4Opening(T, DOOR, XF, z, 0, 1, 1, 0, 1.8, 0.5, 4.2, 'r', 0.12); }
    T.abox(GR2, XF, -0.6, -11, XF + 2.4, 0.5, 11.2); T.abox(GR2, XF + 2.4, -0.6, -9, XF + 3.4, 0.1, 9.2);
    // the great relief panel over the centre portal: a plain recessed field in a moulded frame (no figures)
    T.abox(TRIM, XF, 10.5, -5.2, XF + 0.25, 18.5, 5.4); T.abox({c:'#9c998f', m:0, lc:'#fff0d4', lk:1.0}, XF + 0.25, 11.0, -4.7, XF + 0.32, 18.0, 4.9);
    m4Rose(T, WIN, XF, 23.0, FC, 2.6, 0, 1, 1, 0, 16); m4Rose(T, TRIM, XF + 0.02, 23.0, FC, 0.8, 0, 1, 1, 0, 10);
    for (let j = 0; j < 8; j++){ const a = j/8*Math.PI*2; T.box(TRIM, XF + 0.12, 23.0 + Math.sin(a)*1.7 - 0.1, FC + Math.cos(a)*1.7, Math.cos(a), Math.sin(a), 1.5, 0.2, 0.18); }
    // the two towers: square, flat-topped, corner turrets, string courses, belfry lancets
    for (const [z0, z1] of [[-19.9, FZ0], [FZ1, 20.1]]){ const P = m4Rect(34, z0, XF, z1), zc = (z0 + z1)/2, xc = (34 + XF)/2, H = 41.7;
      T.prism(GR, P, 0.5, H - 1.5, true, ROOF);
      for (const y of [12, 26, 31]) m4Band(T, P, y, 0.7, 0.3, TRIM);
      m4Band(T, P, H - 2.5, 1.0, 0.5, TRIM);
      for (const e of m4Edges(P)) for (let t = 0.6; t < e.L - 0.3; t += 1.2){ T.box(GR, e.a[0] + e.ux*t + e.nx*0.2, H - 1.5, e.a[1] + e.uz*t + e.nz*0.2, e.ux, e.uz, 0.7, 1.4, 0.5); }   // crenellated parapet
      for (const [x, z] of [[34, z0], [XF, z0], [XF, z1], [34, z1]]){ T.cyl(GR2, x, 0.5, z, 1.0, H + 0.6, 8); T.cyl(ROOF, x, H + 1.1, z, 1.1, 2.4, 8, 0.05); }
      for (const [cx, cz, ux, uz, nx, nz] of [[XF, zc, 0, 1, 1, 0], [xc, z0 < 0 ? z0 : z1, 1, 0, 0, z0 < 0 ? -1 : 1], [34, zc, 0, -1, -1, 0]]){
        for (const d of [-1.3, 1.3]) m4Opening(T, WIN, cx + ux*d, cz + uz*d, ux, uz, nx, nz, 1.6, 31.8, 37.5, 'p');
        m4Opening(T, WIN, cx, cz, ux, uz, nx, nz, 1.2, 15, 21, 'p'); m4Opening(T, WIN, cx, cz, ux, uz, nx, nz, 0.9, 6, 9.5, 'p'); } }
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nystpaulapostle', lat:SPA[0], lon:SPA[1], rot:SPA[2]});
// =====================================================================================================================
// Marble Collegiate Church (1851-54, Samuel A. Warner; Romanesque Revival with Gothic trim, faced in Tuckahoe marble):
// the nave along West 29th Street under a gable roof, the Fifth Avenue front with the central tower — square marble
// stages with corner buttresses and round-arched openings, the clock stage (plain dials), the octagonal belfry and the
// tall slender spire with its weathervane; the tall windows of two round-headed lancets under one round arch, the
// buttresses, the west wing, the iron fence and lawn strip along Fifth Avenue and 29th Street.
// Frame: Midtown grid; +x east-south-east (the Fifth Ave front at x ~ 21.6, tower to 24.5), +z toward 29th St.
const MCC = [40.745676, -73.98713, -0.502];
LANDMARKS.nymarblecoll = {zh:'大理石学院教堂', en:'Marble Collegiate Church', cat:'old', r:36, h:62,
  lt:{m:0, c:'#ffe8c8', k:0.75, e:0.45},
  build(){
    const g = new THREE.Group(), T = m4TB();
    const MB = {c:'#d2d0c8'}, MB2 = {c:'#bfbcb2'}, ROOF = '#55595a', WIN = {c:'#33393d', glow:'#ffcf8e', gk:0.4}, DOOR = '#3d2e24';
    const SP = {c:'#8f9493', m:0, lc:'#fff0d8', lk:0.9}, CLK = {c:'#f1efe6', glow:'#fff6e0', gk:0.9}, FENCE = '#26292a', LAWN = '#62844a';
    const RING = [[-20.24, 15.5], [-20.16, -14.09], [11.7, -14.01], [11.7, -9.45], [21.64, -9.42], [21.59, -2.44], [24.46, -2.42], [24.4, 5.37], [21.53, 5.35], [21.53, 12.2], [-10.2, 12.16], [-10.21, 15.47]];
    T.prism(MB2, RING, -5, 0.4, true);
    // nave (x -10.2..21.6, z -9.5..12.2): marble walls, gable roof along the nave, buttresses and paired round-headed lancets
    const NZ0 = -9.5, NZ1 = 12.2, NX0 = -10.2, NX1 = 21.6, W = 12.5, R = 20.5;
    T.prism(MB, m4Rect(NX0, NZ0, NX1, NZ1), 0.4, W, false);
    m4Gable(T, NX0, NZ0, NX1, NZ1, W, R, 'x', ROOF, MB, 0.5);
    m4Band(T, m4Rect(NX0, NZ0, NX1, NZ1), W - 0.7, 0.7, 0.3, MB2);
    for (let k = 0; k < 6; k++){ const x = NX0 + 2.8 + k*5.1;
      T.abox(MB2, x - 0.5, 0.4, NZ1, x + 0.5, W - 0.8, NZ1 + 0.9);
      if (k < 5){ const xm = x + 2.55;
        m4Opening(T, MB2, xm, NZ1, 1, 0, 0, 1, 2.6, 2.6, 8.9, 'r', 0.04);
        for (const d of [-0.6, 0.6]) m4Opening(T, WIN, xm + d, NZ1, 1, 0, 0, 1, 0.95, 2.8, 8.0, 'r', 0.08); } }
    // north side low aisle (x -10.2..11.7, z -14.1..-9.5)
    T.prism(MB2, m4Rect(-10.2, -14.1, 11.7, NZ0), 0.4, 9.2, true, ROOF);
    for (let x = -7; x < 10; x += 4.2) m4Opening(T, WIN, x, -14.1, -1, 0, 0, -1, 1.1, 3, 6.6, 'r');
    // west wing (x -20.2..-10.2) with its own gable across the lot
    T.prism(MB, m4Rect(-20.2, -14.1, NX0, 15.5), 0.4, W, false);
    m4Gable(T, -20.2, -14.1, NX0, 15.5, W, R, 'z', ROOF, MB, 0.5);
    for (const z of [-8, 1, 10]) m4Opening(T, WIN, -20.2, z, 0, -1, -1, 0, 1.6, 3, 8.5, 'r');
    m4Opening(T, WIN, -15.2, 15.5, 1, 0, 0, 1, 2.2, 3, 8.5, 'r'); m4Rose(T, WIN, -15.2, 15.5, 15.55, 1.4, 1, 0, 0, 1, 12);
    // Fifth Avenue front: gable end of the nave, side doors, windows; quoins
    for (const z of [NZ0 + 3.0, NZ1 - 3.0]){ m4Opening(T, DOOR, NX1, z, 0, 1, 1, 0, 1.8, 0.4, 3.8, 'r', 0.08); m4Opening(T, WIN, NX1, z, 0, 1, 1, 0, 1.4, 5.5, 9.5, 'r'); }
    for (const z of [NZ0, NZ1]) for (let y = 0.4; y < W; y += 1.0) T.abox(MB2, NX1 - 0.4, y, z - (z < 0 ? 0.3 : -0.3) - 0.3, NX1 + 0.15, y + 0.5, z - (z < 0 ? 0.3 : -0.3) + 0.3);
    // ---- the central tower (x 16.7..24.5, z -2.4..5.4): square stages to 35 m, octagonal belfry, spire to ~60 m
    const TX0 = 16.75, TX1 = 24.45, TZ0 = -2.43, TZ1 = 5.36, tx = (TX0 + TX1)/2, tz = (TZ0 + TZ1)/2;
    T.prism(MB, m4Rect(TX0, TZ0, TX1, TZ1), 0.4, 28, true, ROOF);
    T.prism(MB, m4Rect(TX0 + 0.3, TZ0 + 0.3, TX1 - 0.3, TZ1 - 0.3), 28, 35, true, ROOF);
    for (const [x, z] of [[TX0, TZ0], [TX1, TZ0], [TX1, TZ1], [TX0, TZ1]]){ T.abox(MB2, x - 0.6, 0.4, z - 0.6, x + 0.6, 27, z + 0.6); m4Pinn(T, MB2, x, 27, z, 1.0, 3.2); }
    for (const y of [9.5, 19, 27.6]) m4Band(T, m4Rect(TX0, TZ0, TX1, TZ1), y, 0.6, 0.3, MB2);
    m4Opening(T, DOOR, TX1, tz, 0, 1, 1, 0, 2.6, 0.4, 5.6, 'r', 0.08); m4Opening(T, MB2, TX1, tz, 0, 1, 1, 0, 3.4, 0.4, 5.9, 'r', 0.04);
    for (const [cx, cz, ux, uz, nx, nz] of [[TX1, tz, 0, 1, 1, 0], [tx, TZ1, 1, 0, 0, 1], [tx, TZ0, -1, 0, 0, -1], [TX0, tz, 0, -1, -1, 0]]){
      m4Opening(T, WIN, cx, cz, ux, uz, nx, nz, 1.6, 11, 17, 'r');
      for (const d of [-0.9, 0.9]) m4Opening(T, WIN, cx + ux*d, cz + uz*d, ux, uz, nx, nz, 1.0, 20.5, 25.5, 'r');
      m4Rose(T, CLK, cx, 31.6, cz, 1.6, ux, uz, nx*1.5, nz*1.5, 16); }                                     // plain clock dials
    // octagonal belfry with round-arched louvres, small corner pinnacles, then the spire and weathervane
    T.cyl(MB, tx, 35, tz, 3.6, 0.6, 8); T.cyl(MB, tx, 35.6, tz, 3.2, 10.4, 8);
    for (let j = 0; j < 8; j++){ const a = (j + 0.5)/8*Math.PI*2, ux = -Math.sin(a), uz = Math.cos(a); m4Opening(T, WIN, tx + Math.cos(a)*2.96, tz + Math.sin(a)*2.96, ux, uz, Math.cos(a), Math.sin(a), 1.2, 38, 43, 'r', 0.04);
      m4Pinn(T, MB2, tx + Math.cos(j/8*Math.PI*2)*3.3, 46, tz + Math.sin(j/8*Math.PI*2)*3.3, 0.5, 2.2); }
    T.cyl(MB2, tx, 46, tz, 3.4, 0.6, 8);
    T.cyl(SP, tx, 46.6, tz, 2.9, 13.4, 8, 0.12);
    T.cyl('#8a7a4a', tx, 60, tz, 0.07, 2.0, 4); T.box('#8a7a4a', tx, 61.2, tz, 1, 0, 1.0, 0.5, 0.06);
    // lawn strips and the iron fence along Fifth Avenue and 29th Street
    T.abox(LAWN, NX1 + 0.1, 0.4, -9.4, NX1 + 2.6, 0.55, -3.0); T.abox(LAWN, NX1 + 0.1, 0.4, 6.0, NX1 + 2.6, 0.55, 12.1);
    for (const [a, b] of [[[NX1 + 2.7, -9.4], [NX1 + 2.7, -2.6]], [[NX1 + 2.7, 5.6], [NX1 + 2.7, 14.2]], [[NX1 + 2.7, 14.2], [-10.2, 14.2]]]){ const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
      T.box(FENCE, (a[0] + b[0])/2, 1.2, (a[1] + b[1])/2, dx/L, dz/L, L, 0.08, 0.08);
      for (let u = 0; u <= L; u += 0.4) T.box(FENCE, a[0] + dx/L*u, 0.4, a[1] + dz/L*u, dx/L, dz/L, 0.04, 1.0, 0.04); }
    T.abox(LAWN, -10.1, 0.4, 12.3, NX1 + 2.6, 0.55, 14.1);
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nymarblecoll', lat:MCC[0], lon:MCC[1], rot:MCC[2]});
// =====================================================================================================================
// The Morgan Library & Museum (Madison Ave at 36th St): the 1906 McKim, Mead & White library on 36th Street — a low
// Renaissance palazzo of pink-tinged marble with the recessed Palladian entrance (arch on paired Ionic columns), niches,
// pilasters, cornice and attic; the 1928 Annex at the Madison Ave corner in the same marble; the 1852 brownstone
// J. P. Morgan Jr. house at the 37th St corner; Renzo Piano's 2006 additions in pale steel panels and glass — the Madison
// Ave entrance pavilion, the glass-roofed central court, the small gallery cube set back from 36th St behind its garden,
// and the 37th St pavilion. All on the real footprints. Frame: Midtown grid; -x = Madison Ave, +z = 36th St, -z = 37th.
const MRG = [40.74925, -73.98128, -0.502];
LANDMARKS.nymorgan = {zh:'摩根图书馆与博物馆', en:'The Morgan Library & Museum', cat:'old', r:57, h:24,
  lt:{m:0, c:'#ffe6c2', k:0.75, e:0.5},
  build(){
    const g = new THREE.Group(), T = m4TB();
    const MAR = {c:'#dccfbf'}, MAR2 = {c:'#cbbca9'}, BROWN = {c:'#7b5c4a'}, BROWN2 = '#6a4d3d', STEEL = {c:'#e3e1da', m:0, lc:'#fff3e0', lk:0.6};
    const GLS = {c:'#8fa3ad', glow:'#ffe6c0', gk:0.5}, GLR = {c:'#b8c7cd', op:0.55}, WIN = {c:'#30363a', glow:'#ffd7a0', gk:0.4}, ROOF = '#76736d', DOOR = '#3a2d23', LAWN = '#62844a', LEAF = '#4e7440', TRUNK = '#5b4b3c';
    const RN = [[-24.95, 13.86], [-24.89, 2.54], [-20.91, 2.52], [-20.96, -1.1], [-22.21, -1.1], [-24.28, -2.59], [-29.61, -2.52], [-29.63, -17.11], [4.69, -17.35], [4.63, -15.38], [15.91, -15.41], [15.99, 13.63]];
    const RS = [[-31.23, 39.21], [-31.34, 19.88], [-22.26, 19.8], [-22.3, 16.4], [-21.18, 16.36], [-21.19, 13.85], [18.41, 13.68], [18.46, 12.51], [21.32, 12.54], [21.33, 11.51], [31.57, 11.47], [31.58, 17.51], [43.84, 17.4], [43.98, 33.86], [8.86, 34.09], [8.79, 22.95], [6.64, 22.99], [6.56, 25.54], [-0.82, 25.6], [-0.8, 22.74], [-2.72, 22.77], [-2.59, 39.01]];
    T.prism(MAR2, RN, -5, 0.4, true); T.prism(MAR2, RS, -5, 0.4, true);
    // ---- the McKim library (x 8.8..44, z 17.4..34.1): marble palazzo, front on 36th St
    const LX0 = 8.85, LX1 = 43.95, LZ0 = 17.45, LZ1 = 34.0, LH = 13.2, lc = (LX0 + LX1)/2;
    const PW = 9.0, LB = [[LX0, LZ0], [LX1, LZ0], [LX1, LZ1], [lc + PW/2, LZ1], [lc + PW/2, LZ1 - 3.0], [lc - PW/2, LZ1 - 3.0], [lc - PW/2, LZ1], [LX0, LZ1]];
    T.prism(MAR, LB, 0.4, LH, true, ROOF);
    m4Band(T, m4Rect(LX0, LZ0, LX1, LZ1), 0.4, 1.4, 0.35, MAR2);                         // base course
    m4Band(T, m4Rect(LX0, LZ0, LX1, LZ1), LH - 2.0, 1.0, 0.6, MAR2);                     // cornice
    T.prism(MAR, m4Rect(LX0 + 0.8, LZ0 + 0.8, LX1 - 0.8, LZ1 - 0.8), LH, LH + 1.6, true, ROOF);   // low attic
    for (const x of [LX0 + 0.8, LX0 + 6.2, LX1 - 6.2, LX1 - 0.8]) T.abox(MAR2, x - 0.45, 1.8, LZ1, x + 0.45, LH - 2, LZ1 + 0.3);   // pilasters
    for (const x of [LX0 + 3.5, LX1 - 3.5]){ m4Opening(T, MAR2, x, LZ1 + 0.3, 1, 0, 0, 1, 1.6, 3.2, 7.4, 'r', 0.02); T.abox(MAR2, x - 1.4, 9.0, LZ1, x + 1.4, 10.4, LZ1 + 0.15); }   // niches + panels
    // the recessed Palladian portico: a deep loggia with the round arch on paired columns
    T.abox(MAR, lc - PW/2, 9.6, LZ1 - 3.0, lc + PW/2, LH, LZ1);
    m4Opening(T, DOOR, lc, LZ1 - 2.85, 1, 0, 0, 1, 3.0, 0.4, 7.2, 'r', 0.02);
    for (const s of [-1, 1]) for (const d of [3.0, 4.0]){ T.cyl(MAR2, lc + s*d, 1.4, LZ1 - 0.6, 0.35, 6.6, 10); T.abox(MAR2, lc + s*d - 0.5, 8.0, LZ1 - 1.1, lc + s*d + 0.5, 8.5, LZ1 - 0.1); }
    for (let j = 0; j <= 8; j++){ const a = j/8*Math.PI; T.box(MAR2, lc + Math.cos(a)*2.0, 8.5 + Math.sin(a)*1.6, LZ1 - 0.6, -Math.sin(a), Math.cos(a), 0.6, 0.5, 0.7); }
    T.abox(MAR2, lc - PW/2 - 1, 0.4, LZ1, lc + PW/2 + 1, 1.4, LZ1 + 2.0);                // the steps
    for (const s of [-1, 1]) T.abox(MAR2, lc + s*(PW/2 + 1.6) - 0.8, 0.4, LZ1 + 0.4, lc + s*(PW/2 + 1.6) + 0.8, 2.6, LZ1 + 2.6);   // plain plinths (no figures)
    // ---- the 1928 Annex at the Madison Ave corner (x -31.3..-2.6, z 19.8..39.2)
    const AP = [[-31.3, 19.85], [-2.65, 19.85], [-2.6, 39.05], [-31.25, 39.2]];
    T.prism(MAR, AP, 0.4, 14.1, true, ROOF); m4Band(T, AP, 0.4, 1.4, 0.35, MAR2); m4Band(T, AP, 12.0, 1.0, 0.55, MAR2);
    T.prism(MAR, [[-30.4, 20.7], [-3.5, 20.7], [-3.5, 38.2], [-30.4, 38.3]], 14.1, 15.4, true, ROOF);
    for (let k = 0; k < 4; k++){ const z = 23.5 + k*4.4; m4Opening(T, WIN, -31.3, z, 0, -1, -1, 0, 1.6, 3.5, 8.8, 's'); }
    for (const x of [-26.5, -22.5, -11.5, -7.5]) m4Opening(T, WIN, x, 39.15, 1, 0, 0, 1, 1.6, 3.5, 8.8, 's');
    for (const d of [-1.2, 1.2]) T.cyl(MAR2, -17 + d, 1.4, 39.6, 0.35, 8.0, 10);                // the Annex entrance (columns in antis)
    T.abox(DOOR, -18.8, 0.4, 39.1, -15.2, 7.5, 39.2);
    // ---- the 1852 brownstone Morgan house at the 37th St corner (x -29.6..-8, z -17.2..-1)
    const MH = [[-29.6, -17.15], [-8.0, -17.2], [-8.0, -1.0], [-22.2, -1.1], [-24.3, -2.6], [-29.6, -2.55]];
    T.prism(BROWN, MH, 0.4, 19, true, ROOF); m4Band(T, MH, 18.0, 1.0, 0.6, BROWN2); m4Band(T, MH, 3.2, 0.5, 0.25, BROWN2);
    m4Win(T, MH, {y0:1.2, y1:17.5, fh:4.1, bw:3.0, wf:0.42, hf:0.6, col:WIN, out:0.05, min:3, frame:BROWN2});
    T.abox(BROWN2, -26, 0.4, -19.8, -22, 3.2, -17.2);                                          // the stoop
    // ---- Renzo Piano 2006: Madison Ave entrance pavilion, glass central court, gallery cube, 37th St pavilion
    const EP = [[-24.95, 13.86], [-24.89, 2.54], [-20.91, 2.52], [-20.96, -1.1], [-8.0, -1.0], [-8.0, 13.8]];
    T.prism(STEEL, EP, 0.4, 15.5, true, ROOF);
    T.q(GLS, [-24.98, 0.4, 3.0], [-24.98, 0.4, 13.4], [-24.98, 12.5, 13.4], [-24.98, 12.5, 3.0]);
    for (let z = 3.0; z <= 13.5; z += 2.6) T.abox('#b9b7b0', -25.1, 0.4, z - 0.06, -24.95, 12.5, z + 0.06);
    T.abox(STEEL, -26.2, 12.5, 2.0, -24.9, 13.1, 14.0);
    const NP = [[-8.0, -17.2], [4.69, -17.35], [4.63, -15.38], [15.91, -15.41], [15.99, 13.63], [-8.0, 13.8]];
    T.prism(STEEL, NP, 0.4, 23.6, true, ROOF);
    m4VStrips(T, NP, 1.2, 22.8, 4.2, 0.14, GLS, e => e.nz < -0.7 || e.nx > 0.7);
    for (const y of [6.2, 12, 17.8]) m4Band(T, NP, y, 0.25, 0.08, '#b9b7b0');
    // the central court (x -21..31.6, z 11.5..19.9): glass walls and a glass roof on a light steel grid
    const CZ0 = 13.7, CZ1 = 19.8;
    T.prism(GLS, m4Rect(-21.1, CZ0, 8.8, CZ1), 0.4, 13.6, false); T.prism(GLS, m4Rect(18.4, 11.5, 31.5, 17.4), 0.4, 12.6, false);
    T.flat(GLR, m4Rect(-21.1, CZ0, 8.8, CZ1), 13.6); T.flat(GLR, m4Rect(18.4, 11.5, 31.5, 17.4), 12.6);
    for (let x = -21; x <= 8.8; x += 3) T.abox('#b9b7b0', x - 0.06, 13.5, CZ0, x + 0.06, 13.75, CZ1);
    T.prism(GLS, m4Rect(8.8, 13.7, 18.4, 17.45), 0.4, 13.6, false); T.flat(GLR, m4Rect(8.8, 13.7, 18.4, 17.45), 13.6);
    // the gallery cube set back from 36th St behind its little garden
    T.prism(STEEL, m4Rect(-2.6, 19.85, 8.8, 25.55), 0.4, 9.2, true, ROOF);
    T.abox(LAWN, -2.5, 0.4, 25.6, 8.7, 0.55, 34.0); for (const x of [0.5, 5.5]) m4Tree(T, x, 0.55, 30, 1.6, LEAF, TRUNK);
    T.flush(g);
    return g; }};
SG_PLACES.push({type:'nymorgan', lat:MRG[0], lon:MRG[1], rot:MRG[2]});
// =====================================================================================================================
// General Theological Seminary, Chelsea Square (Charles C. Haight, 1883-1902; the close modelled on Oxford): the red-
// brick Gothic Revival ranges with brownstone trim, steep slate roofs, gables and dormers along West 21st Street (with
// the gate tower), Hoffman Hall on Tenth Avenue (today a hotel), the 1836 fieldstone West Building and its neighbours on
// the 20th Street side, and in the middle of the lawn the Chapel of the Good Shepherd (1888) with its 40 m bell tower
// modelled on Magdalen College's (octagonal corner turrets with short spires, crenellated parapet, paired belfry
// lancets); the lawn, paths, old trees, the low wall and railing on 20th Street. The modern Chelsea Enclave on Ninth
// Avenue is left as the real building. Frame: Midtown grid; +x east-south-east (Ninth Ave), -z = 21st St, +z = 20th St.
const GTS = [40.745576, -74.004059, -0.502], GTO = [0, -16];
LANDMARKS.nygts = {zh:'圣公会总神学院', en:'General Theological Seminary', cat:'old', r:110, h:41,
  lt:{m:0, c:'#ffdcae', k:0.38, e:0.45},
  build(){
    const g = new THREE.Group(), T = m4TB();
    const BR = {c:'#8e4a36'}, BR2 = {c:'#7c3f2e'}, BS = {c:'#8a6f5a'}, FS = {c:'#8d877b'}, SLATE = '#4b4f52', WIN = {c:'#2f3337', glow:'#ffd29a', gk:0.45};
    const DOOR = '#3a2c22', LAWN = '#5f8a48', PATH = '#a8a194', LEAF = '#4b7340', TRUNK = '#5b4b3c', FENCE = '#26292a';
    // a collegiate range: walls to the eaves, pointed / square windows with brownstone bands, steep slate roof with gables
    const range = (x0, z0, x1, z1, eave, ridge, wall, opt) => { const o = opt || {}, P = m4Rect(x0, z0, x1, z1), along = (x1 - x0) >= (z1 - z0) ? 'x' : 'z';
      T.prism(wall, P, -4, eave, false);
      m4Gable(T, x0, z0, x1, z1, eave, ridge, along, SLATE, wall, 0.5);
      m4Band(T, P, eave - 0.6, 0.6, 0.25, BS); m4Band(T, P, 1.0, 0.5, 0.2, BS);
      m4Win(T, P, {y0:1.6, y1:eave - 1.0, fh:o.fh || 3.6, bw:o.bw || 3.2, wf:0.42, hf:0.62, col:WIN, out:0.05, min:3, frame:BS, arch:o.arch});
      if (o.dorm){ const n = Math.floor(((along === 'x' ? x1 - x0 : z1 - z0) - 4)/o.dorm); for (let k = 0; k < n; k++){ const t = 2 + (k + 0.5)*o.dorm;
        for (const s of [-1, 1]){ if (along === 'x'){ const x = x0 + t, z = s < 0 ? z0 : z1; T.abox(wall, x - 1.3, eave - 0.5, Math.min(z, z - s*1.6), x + 1.3, eave + 2.6, Math.max(z, z - s*1.6)); T.t(wall, [x - 1.3, eave + 2.6, z], [x + 1.3, eave + 2.6, z], [x, eave + 4.4, z]);
            T.q(SLATE, [x - 1.5, eave + 2.5, z + s*0.2], [x, eave + 4.5, z + s*0.2], [x, eave + 4.5, z - s*2.6], [x - 1.5, eave + 2.5, z - s*2.6]); T.q(SLATE, [x, eave + 4.5, z + s*0.2], [x + 1.5, eave + 2.5, z + s*0.2], [x + 1.5, eave + 2.5, z - s*2.6], [x, eave + 4.5, z - s*2.6]);
            m4Opening(T, WIN, x, z, 1, 0, 0, s, 1.1, eave + 0.3, eave + 2.0, 'p', 0.05); }
          else { const z = z0 + t, x = s < 0 ? x0 : x1; T.abox(wall, Math.min(x, x - s*1.6), eave - 0.5, z - 1.3, Math.max(x, x - s*1.6), eave + 2.6, z + 1.3); T.t(wall, [x, eave + 2.6, z - 1.3], [x, eave + 2.6, z + 1.3], [x, eave + 4.4, z]);
            m4Opening(T, WIN, x, z, 0, 1, s, 0, 1.1, eave + 0.3, eave + 2.0, 'p', 0.05); } } } }
      if (o.chim) for (const t of o.chim){ const x = along === 'x' ? x0 + t*(x1 - x0) : (x0 + x1)/2, z = along === 'x' ? (z0 + z1)/2 : z0 + t*(z1 - z0); T.abox(BR2, x - 0.8, ridge - 2, z - 0.6, x + 0.8, ridge + 2.2, z + 0.6); } };
    // ---- West 21st Street: the long ranges (#9 with its south wing and gate tower, #26 up to the Enclave)
    range(-11.3, -44.3, 52.4, -30.5, 17, 25, BR, {dorm:6.5, chim:[0.15, 0.5, 0.85]});
    range(17.8, -31.7, 29.1, -14.4, 15, 21, BR, {chim:[0.6]});
    range(52.4, -43.8, 104.0, -33.6, 13, 19.5, BR, {dorm:6.2, chim:[0.3, 0.6]});
    // the gate tower on 21st St (x 20..27)
    const GX0 = 20, GX1 = 27, GZ0 = -45.0, GZ1 = -38;
    T.prism(BR, m4Rect(GX0, GZ0, GX1, GZ1), 0.3, 33.5, true, SLATE); m4Band(T, m4Rect(GX0, GZ0, GX1, GZ1), 24, 0.6, 0.3, BS); m4Band(T, m4Rect(GX0, GZ0, GX1, GZ1), 33, 0.7, 0.35, BS);
    m4Opening(T, DOOR, (GX0 + GX1)/2, GZ0, -1, 0, 0, -1, 3.2, 0.3, 4.2, 'p'); m4Opening(T, BS, (GX0 + GX1)/2, GZ0, -1, 0, 0, -1, 4.2, 0.3, 4.6, 'p', 0.03);
    for (const y of [10, 17, 26.5]) m4Opening(T, WIN, (GX0 + GX1)/2, GZ0, -1, 0, 0, -1, 1.8, y, y + 3.6, 'p');
    for (const e of m4Edges(m4Rect(GX0, GZ0, GX1, GZ1))) for (let t = 0.5; t < e.L; t += 1.1) T.box(BS, e.a[0] + e.ux*t + e.nx*0.15, 33.7, e.a[1] + e.uz*t + e.nz*0.15, e.ux, e.uz, 0.6, 1.1, 0.4);
    for (const [x, z] of [[GX0, GZ0], [GX1, GZ0], [GX1, GZ1], [GX0, GZ1]]){ T.cyl(BS, x, 0.3, z, 0.8, 34.6, 8); T.cyl(SLATE, x, 34.9, z, 0.85, 2.0, 8, 0.05); }
    // ---- Hoffman Hall on Tenth Avenue (north range along 21st St + west range along Tenth Ave)
    range(-103.9, -44.9, -15.6, -32.6, 16, 23.9, BR, {dorm:7, chim:[0.1, 0.4, 0.7, 0.95]});
    range(-97.8, -32.6, -80.3, 11.4, 16, 23.9, BR, {dorm:7, chim:[0.3, 0.8]});
    for (const z of [-24.2, 1.6]){ T.cyl(BR2, -98.8, 0.3, z, 2.3, 19, 8); T.cyl(SLATE, -98.8, 19, z, 2.5, 4.5, 8, 0.1); }      // bay turrets on Tenth Ave
    for (const z of [-24, 1.8]) T.cyl(BR2, -79.6, 0.3, z, 1.6, 17.5, 8);
    // ---- the 20th Street side: the 1836 West Building (fieldstone) and the brick houses west of it
    range(-40.1, -13.0, -5.1, 4.5, 10.5, 15.9, FS, {arch:true, chim:[0.25, 0.75]});
    for (const [xa, xb, ya, yb] of [[-39.8, -31, 0.3, 9.6], [-24, -16.5, 0.3, 7.5], [-11.5, -5.4, 0.3, 9.9]]) T.q(LEAF, [xa, ya, 4.62], [xb, ya, 4.62], [xb, yb, 4.62], [xa, yb, 4.62]);   // ivy on the West Building
    range(-65.4, -15.8, -46.0, 10.6, 9, 12.9, BR, {chim:[0.5]});
    range(-46.0, -13.2, -40.0, 2.1, 9, 12.9, BR2);
    // ---- the Chapel of the Good Shepherd (x 46..75.3, z -6.5..12.2) and its tower (north-west corner)
    const CX0 = 48.2, CX1 = 71.7, CZ0 = -3.3, CZ1 = 11.5;
    range(CX0, CZ0, CX1, CZ1, 11, 19.5, BR, {fh:9, bw:4.2, arch:false});
    for (let k = 0; k < 5; k++){ const x = CX0 + 3 + k*4.4; for (const [z, s] of [[CZ1, 1], [CZ0, -1]]){ T.abox(BR2, x - 0.5, 0.3, Math.min(z, z + s*1.0), x + 0.5, 9.5, Math.max(z, z + s*1.0)); m4Opening(T, WIN, x + 2.2, z, 1, 0, 0, s, 1.6, 3, 8.6, 'p'); } }
    T.prism(BR, [[71.6, -2.75], [75.3, -2.75], [75.3, 4.3], [71.6, 4.37]], 0.3, 9.5, true, SLATE);           // chancel bay
    m4Opening(T, WIN, 71.7, 4.1, 0, 1, 1, 0, 3.2, 3.5, 9.5, 'p'); m4Opening(T, WIN, CX1 + 0.05, 8.0, 0, 1, 1, 0, 2.4, 4, 10, 'p');
    T.prism(BR, [[48.25, 1.24], [47.67, 1.21], [46.02, 2.58], [46.0, 5.66], [48.24, 6.83]], 0.3, 7, true, SLATE);      // west porch
    m4Opening(T, DOOR, 46.0, 4.1, 0, -1, -1, 0, 1.8, 0.3, 3.8, 'p');
    m4Rose(T, WIN, CX0 - 0.02, 13.5, 4.1, 2.0, 0, -1, -1, 0, 14);
    for (const [x, z] of [[CX0, CZ1], [CX1, CZ1], [CX1, CZ0]]){ T.cyl(BR2, x, 0.3, z, 0.7, 13.2, 8); T.cyl(BS, x, 13.2, z, 0.75, 1.0, 8); }   // brick corner turrets
    // the bell tower: square brick shaft, brownstone bands, paired belfry lancets, crenellated parapet, octagonal turrets with spires
    const TX0 = 48.2, TX1 = 55.0, TZ0 = -6.5, TZ1 = 0.4, TH = 35, tc = [(TX0 + TX1)/2, (TZ0 + TZ1)/2];
    T.prism(BR, m4Rect(TX0, TZ0, TX1, TZ1), -4, TH, true, SLATE);
    for (const y of [11, 20, 25.5, TH - 1.2]) m4Band(T, m4Rect(TX0, TZ0, TX1, TZ1), y, 0.6, 0.25, BS);
    for (const [cx, cz, ux, uz, nx, nz] of [[tc[0], TZ0, -1, 0, 0, -1], [TX0, tc[1], 0, -1, -1, 0], [TX1, tc[1], 0, 1, 1, 0], [tc[0], TZ1, 1, 0, 0, 1]]){
      for (const d of [-1.0, 1.0]) m4Opening(T, WIN, cx + ux*d, cz + uz*d, ux, uz, nx, nz, 1.3, 26.5, 32.5, 'p');
      m4Opening(T, WIN, cx, cz, ux, uz, nx, nz, 1.1, 14, 18.5, 'p'); }
    const PP = m4Rect(TX0 - 0.2, TZ0 - 0.2, TX1 + 0.2, TZ1 + 0.2);
    for (const e of m4Edges(PP)) for (let t = 1.2; t < e.L - 1.0; t += 1.0) T.box(BS, e.a[0] + e.ux*t, TH, e.a[1] + e.uz*t, e.ux, e.uz, 0.55, 1.2, 0.4);
    for (const [x, z] of [[TX0, TZ0], [TX1, TZ0], [TX1, TZ1], [TX0, TZ1]]){ T.cyl(BS, x, 0.3, z, 0.95, TH + 1.6, 8); T.cyl(BS, x, TH + 1.6, z, 1.0, 0.5, 8); T.cyl(BS, x, TH + 2.1, z, 0.85, 3.6, 8, 0.05); }
    for (const [x, z] of [[tc[0], TZ0 - 0.2], [tc[0], TZ1 + 0.2], [TX0 - 0.2, tc[1]], [TX1 + 0.2, tc[1]]]) m4Pinn(T, BS, x, TH + 1.2, z, 0.5, 2.4);
    // ---- the close: lawn, paths, trees, the low wall and railing on 20th Street
    T.flat(LAWN, [[-80.2, -30.0], [90, -33.4], [90, 13.5], [-76.3, 13.5]], 0.35);
    T.abox(PATH, -76, 0.36, -20.5, 88, 0.42, -18.5); T.abox(PATH, 30, 0.36, -30, 32, 0.42, 13.5); T.abox(PATH, -2, 0.36, -30, 0, 0.42, -13);
    T.abox(PATH, 40, 0.36, -6.5, 78, 0.42, -5.4);
    T.abox(FS, -76.3, 0.3, 13.2, 90, 1.2, 13.8); for (let x = -76; x <= 90; x += 0.5) T.abox(FENCE, x, 1.2, 13.45, x + 0.04, 2.3, 13.55); T.abox(FENCE, -76.3, 2.2, 13.43, 90, 2.3, 13.57);
    for (const [x, z, s] of [[-70, -24, 3.0], [-55, -22, 2.6], [-25, -24, 3.2], [5, -22, 3.0], [12, 8, 3.4], [-8, 9, 2.8], [38, -24, 3.0], [42, 8, 2.6], [80, -24, 3.0], [84, 6, 2.8], [62, -12, 2.6], [-60, 8, 2.4], [25, -2, 2.8]]) m4Tree(T, x, 0.35, z, s, LEAF, TRUNK);
    T.flush(g, GTO[0], GTO[1]);
    return g; }};
SG_PLACES.push({type:'nygts', lat:GTS[0], lon:GTS[1], rot:GTS[2]});
}
