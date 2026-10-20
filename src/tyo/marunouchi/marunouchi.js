// ===== City Brush v37 — Tokyo landmarks: Marunouchi / Tokyo Station / Nihonbashi (ty_a). Real OSM footprints, rot 0 (local x east,
// z south). No logos, names or signage. Built from tyo/marunouchi/src by build.sh.
{
// ---------- ty_a shared helpers (Marunouchi / palace). Everything is in local metres, rot 0: +x east, +z south. ----------
const PI = Math.PI, TAU = PI*2, HP = PI/2, D2R = PI/180;
// the app puts a landmark's y = 0 on the highest ground within r (+0.6 m); gl(x, z) = the real ground there in local metres.
// Outside the app (model-only kit, node check) the ground is flat (gl = 0, top = 0).
const mkGround = (lat, lon, r) => {
  if (typeof hC !== 'function' || typeof sgXY !== 'function') return {gl:() => 0, top:0, flat:true, abs:y => y};
  const q = sgXY(lat, lon), X = q[0], Y = q[1]; let hi = -Infinity;
  for (let a = 0; a < 12; a++) for (const f of [0, 0.35, 0.7]) hi = Math.max(hi, hC(X + Math.cos(a/12*TAU)*r*f, Y + Math.sin(a/12*TAU)*r*f));
  const top = hi + 0.6; return {gl:(x, z) => hC(X + x, Y - z) - top, top, flat:false, abs:y => y - top};
};
// batches of raw triangles per colour spec (one LTris per spec)
const mkBatch = () => { const m = new Map(); return {
  a(col){ let v = m.get(col); if (!v){ v = []; m.set(col, v); } return v; },
  flush(g){ for (const [c, v] of m) if (v.length) LTris(g, v, c); m.clear(); }}; };
const quad = (a, p, q, r, s) => { a.push(p[0], p[1], p[2], q[0], q[1], q[2], r[0], r[1], r[2], p[0], p[1], p[2], r[0], r[1], r[2], s[0], s[1], s[2]); };
const tri3 = (a, p, q, r) => { a.push(p[0], p[1], p[2], q[0], q[1], q[2], r[0], r[1], r[2]); };
// frame round (cx, cz): u along the axis at angle ang (CCW from east seen from above), v across (+v = u turned 90 deg clockwise)
const F = (cx, cz, ang) => { const c = Math.cos(ang), s = Math.sin(ang); return (u, v) => [cx + u*c + v*s, cz - u*s + v*c]; };
const F3 = (cx, cz, ang) => { const f = F(cx, cz, ang); return (u, y, v) => { const p = f(u, v); return [p[0], y, p[1]]; }; };
const cen = P => { let x = 0, z = 0; for (const p of P){ x += p[0]; z += p[1]; } return [x/P.length, z/P.length]; };
const sarea = P => { let s = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) s += (P[j][0] - P[i][0])*(P[j][1] + P[i][1]); return s/2; };
const inPoly = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0])*(z - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; };
const bbox = P => { let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity; for (const p of P){ a = Math.min(a, p[0]); b = Math.min(b, p[1]); c = Math.max(c, p[0]); d = Math.max(d, p[1]); } return [a, b, c, d]; };
const lerp = (a, b, t) => a + (b - a)*t;
// oriented box: centre (cx, cz), axis angle ry, length L along, width W across, y0..y1 (no bottom face)
function obox(a, cx, cz, ry, L, W, y0, y1){
  const f = F(cx, cz, ry), hl = L/2, hw = W/2, P = [f(-hl, -hw), f(hl, -hw), f(hl, hw), f(-hl, hw)];
  for (let i = 0; i < 4; i++){ const p = P[i], q = P[(i + 1) % 4]; quad(a, [p[0], y0, p[1]], [q[0], y0, q[1]], [q[0], y1, q[1]], [p[0], y1, p[1]]); }
  quad(a, [P[0][0], y1, P[0][1]], [P[1][0], y1, P[1][1]], [P[2][0], y1, P[2][1]], [P[3][0], y1, P[3][1]]);
}
// box in a frame f (centre u, v), L along u, W along v
const fbox = (a, f, ang, u, v, L, W, y0, y1) => { const c = f(u, v); obox(a, c[0], c[1], ang, L, W, y0, y1); };
function capP(a, P, y, down){
  const V = P.map(p => new THREE.Vector2(p[0], p[1])), T = THREE.ShapeUtils.triangulateShape(V, []);
  for (const t of T){ const A = [P[t[0]][0], y, P[t[0]][1]], B = [P[t[1]][0], y, P[t[1]][1]], C = [P[t[2]][0], y, P[t[2]][1]]; if (down) tri3(a, A, C, B); else tri3(a, A, B, C); }
}
function prism(a, P, y0, y1, cap, bot){
  const n = P.length;
  for (let i = 0; i < n; i++){ const p = P[i], q = P[(i + 1) % n]; quad(a, [p[0], y0, p[1]], [q[0], y0, q[1]], [q[0], y1, q[1]], [p[0], y1, p[1]]); }
  if (cap !== false) capP(a, P, y1);
  if (bot) capP(a, P, y0, true);
}
// skin between two rings with the same vertex count (lower ring P at y0, upper Q at y1)
function skin(a, P, y0, Q, y1){ const n = P.length; for (let i = 0; i < n; i++){ const j = (i + 1) % n; quad(a, [P[i][0], y0, P[i][1]], [P[j][0], y0, P[j][1]], [Q[j][0], y1, Q[j][1]], [Q[i][0], y1, Q[i][1]]); } }
const nrm = (p, q, s) => { const dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz) || 1; return s > 0 ? [dz/l, -dx/l] : [-dz/l, dx/l]; };
function offsetRing(P, d){
  const n = P.length, s = sarea(P) > 0 ? 1 : -1, out = [];
  for (let i = 0; i < n; i++){
    const p = P[(i + n - 1) % n], q = P[i], r = P[(i + 1) % n];
    const n1 = nrm(p, q, s), n2 = nrm(q, r, s); let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
    const k = Math.max(0.35, mx*n1[0] + mz*n1[1]); out.push([q[0] + mx*d/k, q[1] + mz*d/k]);
  }
  return out;
}
const lowUnder = (gl, P) => { let m = Infinity; for (let i = 0; i < P.length; i++){ const p = P[i], q = P[(i + 1) % P.length]; m = Math.min(m, gl(p[0], p[1]), gl((p[0] + q[0])/2, (p[1] + q[1])/2)); } return m; };
// a plinth from below the lowest ground under the ring up to y1
const plinth = (a, gl, P, y1, extra) => { const lo = Math.min(-0.3, lowUnder(gl, P)) - (extra === undefined ? 1.2 : extra); if (lo < y1 - 0.05) prism(a, P, lo, y1, true); return lo; };
// window panes on every edge of a ring (rows of panes just outside the walls)
function ringWins(a, P, y0, floors, fh, bay, ww, wh, minL, sill, out){
  const s = sarea(P) > 0 ? 1 : -1, n = P.length, o = out || 0.07;
  for (let i = 0; i < n; i++){
    const p = P[i], q = P[(i + 1) % n], L = Math.hypot(q[0] - p[0], q[1] - p[1]); if (L < (minL || 4)) continue;
    const N = nrm(p, q, s), k = Math.max(1, Math.floor(L/bay)), dx = (q[0] - p[0])/L, dz = (q[1] - p[1])/L;
    for (let j = 0; j < k; j++){ const m = (j + 0.5)*L/k, cx = p[0] + dx*m + N[0]*o, cz = p[1] + dz*m + N[1]*o, hx = dx*ww/2, hz = dz*ww/2;
      for (let f = 0; f < floors; f++){ const yb = y0 + f*fh + (sill === undefined ? fh*0.3 : sill), yt = yb + wh;
        quad(a, [cx - hx, yb, cz - hz], [cx + hx, yb, cz + hz], [cx + hx, yt, cz + hz], [cx - hx, yt, cz - hz]); } }
  }
}
// vertical fins / mullions round a ring: thin boxes standing proud of the walls
function ringFins(a, P, y0, y1, bay, w, d, minL){
  const s = sarea(P) > 0 ? 1 : -1, n = P.length;
  for (let i = 0; i < n; i++){
    const p = P[i], q = P[(i + 1) % n], L = Math.hypot(q[0] - p[0], q[1] - p[1]); if (L < (minL || 3)) continue;
    const N = nrm(p, q, s), k = Math.max(1, Math.round(L/bay)), ang = Math.atan2(-(q[1] - p[1]), q[0] - p[0]);
    for (let j = 1; j < k; j++){ const t = j/k, cx = p[0] + (q[0] - p[0])*t + N[0]*d/2, cz = p[1] + (q[1] - p[1])*t + N[1]*d/2; obox(a, cx, cz, ang, w, d, y0, y1); }
  }
}
// horizontal band (string course / spandrel / cornice) round a ring, outset d
function band(a, P, y0, y1, d){ prism(a, offsetRing(P, d), y0, y1, false); }
// a sloped skin (hip roof) over a convex-ish ring: the ring at y0 shrinks by inset to y1 (flat top)
function hipSkin(a, P, y0, y1, inset){ const Q = offsetRing(P, -inset); skin(a, P, y0, Q, y1); capP(a, Q, y1); return Q; }
// a beam (square section) between two points
function beam(a, p, q, w, h){
  const dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2], L = Math.hypot(dx, dy, dz) || 1;
  let ux = -dz, uz = dx, ul = Math.hypot(ux, uz); if (ul < 1e-6){ ux = 1; uz = 0; ul = 1; } ux /= ul; uz /= ul;
  const vx = dy*uz/L - 0, vy = (dz*ux - dx*uz)/L, vz = -dy*ux/L;     // v = d x u / L
  const hw = w/2, hh = (h || w)/2, C = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]];
  const P = C.map(c => [p[0] + ux*c[0] + vx*c[1], p[1] + vy*c[1], p[2] + uz*c[0] + vz*c[1]]), Q = C.map(c => [q[0] + ux*c[0] + vx*c[1], q[1] + vy*c[1], q[2] + uz*c[0] + vz*c[1]]);
  for (let i = 0; i < 4; i++){ const j = (i + 1) % 4; quad(a, P[i], P[j], Q[j], Q[i]); }
}
// a vertical cylinder (n sides) into a batch
function cyl(a, r0, r1, x, z, y0, y1, n, cap){
  n = n || 10;
  for (let i = 0; i < n; i++){ const t0 = i/n*TAU, t1 = (i + 1)/n*TAU, c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
    quad(a, [x + c0*r0, y0, z + s0*r0], [x + c1*r0, y0, z + s1*r0], [x + c1*r1, y1, z + s1*r1], [x + c0*r1, y1, z + s0*r1]);
    if (cap) tri3(a, [x, y1, z], [x + c1*r1, y1, z + s1*r1], [x + c0*r1, y1, z + s0*r1]); }
}
// a stone retaining wall (ishigaki) along a polyline: face battered outward towards side sd (+1 = right of the direction), y from yb to yt
function ishigaki(a, pts, yb, yt, th, bat, sd){
  for (let i = 0; i + 1 < pts.length; i++){
    const p = pts[i], q = pts[i + 1], dx = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dx, dz); if (L < 0.3) continue;
    const nx = -dz/L*sd, nz = dx/L*sd, ybp = typeof yb === 'function' ? yb(p) : yb, ybq = typeof yb === 'function' ? yb(q) : yb, ytp = typeof yt === 'function' ? yt(p) : yt, ytq = typeof yt === 'function' ? yt(q) : yt;
    const bp = (ytp - ybp)*bat, bq = (ytq - ybq)*bat;
    const A0 = [p[0] + nx*bp, ybp, p[1] + nz*bp], B0 = [q[0] + nx*bq, ybq, q[1] + nz*bq], A1 = [p[0], ytp, p[1]], B1 = [q[0], ytq, q[1]];
    quad(a, A0, B0, B1, A1);                                           // battered face
    const A2 = [p[0] - nx*th, ytp, p[1] - nz*th], B2 = [q[0] - nx*th, ytq, q[1] - nz*th];
    quad(a, A1, B1, B2, A2);                                           // top
    quad(a, A2, B2, [B2[0], ybq, B2[2]], [A2[0], ybp, A2[2]]);          // back
  }
}
// a Japanese tiled roof over an oriented rectangle using the kit's eave() (curved irimoya / hip)
const jroof = (g, cx, cz, ry, L, W, y, o) => eave(g, Object.assign({x:cx, z:cz, ry:ry, L, W, y, over:1.4, h:Math.max(1.6, W*0.33), pw:1.3, lift:0.35, fas:0.3, n:5}, o));
// gable roof skin over an oriented rectangle (straight), into a batch: ridge along u
function gableB(a, f3, u0, u1, v0, v1, y0, y1, ov){
  ov = ov || 0; const vm = (v0 + v1)/2;
  quad(a, f3(u0 - ov, y0, v0 - ov), f3(u1 + ov, y0, v0 - ov), f3(u1 + ov, y1, vm), f3(u0 - ov, y1, vm));
  quad(a, f3(u1 + ov, y0, v1 + ov), f3(u0 - ov, y0, v1 + ov), f3(u0 - ov, y1, vm), f3(u1 + ov, y1, vm));
}
function gableEnds(a, f3, u0, u1, v0, v1, y0, y1){ const vm = (v0 + v1)/2; tri3(a, f3(u0, y0, v0), f3(u0, y1, vm), f3(u0, y0, v1)); tri3(a, f3(u1, y0, v1), f3(u1, y1, vm), f3(u1, y0, v0)); }
// straight hip roof over an oriented rectangle into a batch (ridge along the long side)
function hipB(a, f3, u0, u1, v0, v1, y0, y1, ov){
  ov = ov || 0; u0 -= ov; u1 += ov; v0 -= ov; v1 += ov; const hw = (v1 - v0)/2, vm = (v0 + v1)/2, r0 = Math.min(u0 + hw, (u0 + u1)/2), r1 = Math.max(u1 - hw, (u0 + u1)/2);
  quad(a, f3(u0, y0, v0), f3(u1, y0, v0), f3(r1, y1, vm), f3(r0, y1, vm)); quad(a, f3(u1, y0, v1), f3(u0, y0, v1), f3(r0, y1, vm), f3(r1, y1, vm));
  tri3(a, f3(u0, y0, v1), f3(u0, y0, v0), f3(r0, y1, vm)); tri3(a, f3(u1, y0, v0), f3(u1, y0, v1), f3(r1, y1, vm));
}
// minimum-area-ish oriented rectangle of a ring (angle of the longest edge): returns {ang, cx, cz, L, W}
function orect(P){
  let best = null;
  for (let i = 0; i < P.length; i++){
    const p = P[i], q = P[(i + 1) % P.length], ang = Math.atan2(-(q[1] - p[1]), q[0] - p[0]), c = Math.cos(ang), s = Math.sin(ang);
    let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
    for (const r of P){ const u = r[0]*c - r[1]*s, v = r[0]*s + r[1]*c; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
    const A = (u1 - u0)*(v1 - v0); if (!best || A < best.A){ const uc = (u0 + u1)/2, vc = (v0 + v1)/2; best = {A, ang, cx:uc*c + vc*s, cz:-uc*s + vc*c, L:u1 - u0, W:v1 - v0}; }
  }
  if (best.W > best.L){ const t = best.L; best.L = best.W; best.W = t; best.ang += HP; }
  return best;
}

// ---- copied from the kit base (block-scoped there, so each module carries its own copy): eave, row, ring4, dormer, kara, pine, tree, batter, circ, horse ----
const eave = (g, o) => {
  const R = rotP(o.x || 0, o.z || 0, o.ry || 0), n = o.n || 5, nt = o.nt || 5, ov = o.over || 0, pw = o.pw || 1.6, lift = o.lift || 0;
  const hl0 = o.L/2 + ov, hw0 = o.W/2 + ov, kk = o.k !== undefined ? o.k : Math.max(0, hl0 - hw0), gab = o.gab || 0;
  const ext = u => gab ? (u < gab ? hl0 + (kk - hl0)*u/gab : kk) : hl0 + (kk - hl0)*u;
  const ring = (u, dy) => {
    const a = ext(u), b = hw0*(1 - u), y = o.y + o.h*Math.pow(u, pw) + dy, lu = lift*Math.pow(1 - u, 2), P = [];
    const C = [[-a, -b], [a, -b], [a, b], [-a, b]];
    for (let s = 0; s < 4; s++){ const A = C[s], B = C[(s+1) % 4]; for (let i = 0; i < n; i++){ const t = i/n, c = Math.pow(Math.abs(2*t - 1), 4), f = 1 + 0.035*c*(1 - u)*(lift ? 1 : 0); P.push(R((A[0] + (B[0] - A[0])*t)*f, y + lu*c, (A[1] + (B[1] - A[1])*t)*f)); } }
    return P;
  };
  const secs = []; if (o.fas) secs.push(ring(0, -o.fas)); for (let i = 0; i <= nt; i++) secs.push(ring(i/nt, 0));
  LLoft(g, secs, o.col, false);
  const yt = o.y + o.h;
  if (gab && o.gcol){ const yg = o.y + o.h*Math.pow(gab, pw), bg = hw0*(1 - gab)*0.92; for (const s of [-1, 1]){ const x = s*(kk + 0.06); LTris(g, [...R(x, yg, -bg), ...R(x, yg, bg), ...R(x, yt - 0.15, 0)], o.gcol); } }
  if (o.ridge && kk > 0.5) LBeam(g, R(-kk - 0.3, yt, 0), R(kk + 0.3, yt, 0), o.ridge, o.rcol || o.col, 6);
  return yt;
};
// a row of n panels (windows, doors) along a facade; the facade runs along local x through (cx, cz), rotated by ry, local +z outward
const row = (g, cx, cz, ry, len, y, w, h, n, col, out, d) => { const R = rotP(cx, cz, ry); for (let i = 0; i < n; i++){ const x = n === 1 ? 0 : -len/2 + len*i/(n - 1), p = R(x, 0, out || 0); LBox(g, w, h, d || 0.4, p[0], y, p[2], col, ry); } };
// windows on all four faces of a box (L along x, W along z)
const ring4 = (g, cx, cz, L, W, y, w, h, nx, nz, col, inset) => { const m = inset || 1.2; for (const s of [-1, 1]){ row(g, cx, cz + s*W/2, s > 0 ? 0 : PI, L - 2*m, y, w, h, nx, col, 0.05); row(g, cx + s*L/2, cz, s > 0 ? HP : -HP, W - 2*m, y, w, h, nz, col, 0.05); } };
// Gothic pinnacle
const pin = (g, x, y, z, w, h, col, seg) => { LBox(g, w, h*0.4, w, x, y, z, col); LCone(g, w*0.72, h*0.6, x, y + h*0.4, z, col, seg || 4, PI/4); };
// round-headed opening outline (width 2hw, total height ht)
const rArch = (hw, ht, n) => { const P = [[-hw, 0], [hw, 0], [hw, ht - hw]]; for (let i = 1; i < n; i++){ const a = PI*i/n; P.push([Math.cos(a)*hw, ht - hw + Math.sin(a)*hw]); } P.push([-hw, ht - hw]); return P; };
// Japanese / Chinese gable dormer on a facade (local frame of the facade: x along, z outward)
const dormer = (g, R, ry, x, y, z, w, h, d, roof, wall) => { const c = R(x, 0, z); gable(g, c[0], c[2], d, w, y, h, roof, ry + HP); if (wall) LTris(g, [...R(x - w*0.42, y + 0.1, z + d/2 + 0.06), ...R(x + w*0.42, y + 0.1, z + d/2 + 0.06), ...R(x, y + h*0.86, z + d/2 + 0.06)], wall); };
// cusped (kara-hafu) gable on a facade: a bell-curved roof band with a plaster panel below
const kara = (g, R, ry, x, y, z, w, h, d, roof, wall) => {
  const n = 12, top = [], bot = []; for (let i = 0; i <= n; i++){ const s = -1 + 2*i/n, f = 0.5*(1 + Math.cos(PI*s)); top.push([s*w/2, h*f + 0.55]); bot.push([s*w/2*0.96, h*f]); }
  const c = R(x, 0, z); LShape(g, [...top, ...bot.reverse()], d, c[0], y, c[2], roof, ry);
  if (wall){ const P = []; for (let i = 0; i <= n; i++){ const s = -0.8 + 1.6*i/n; P.push([s*w/2, h*0.5*(1 + Math.cos(PI*s))]); } const c2 = R(x, 0, z + d/2 - 0.2); LShape(g, [[-0.4*w, -0.8], ...P, [0.4*w, -0.8]], 0.3, c2[0], y, c2[2], wall, ry); }
};
// a Japanese pine: trunk and flat clumps
const pine = (g, x, y, z, s, r) => { LCyl(g, 0.25*s, 0.35*s, 4*s, x, y, z, '#5b4636', 6); for (let k = 0; k < 3; k++) LSph(g, (1.9 - k*0.45)*s, x + (r() - 0.5)*1.6*s, y + (2.8 + k*1.3)*s, z + (r() - 0.5)*1.6*s, '#3d5a37', 0.45, 10); };
const tree = (g, x, y, z, s, col) => { LCyl(g, 0.3*s, 0.4*s, 3*s, x, y, z, '#5b4a3a', 6); LSph(g, 2.6*s, x, y + 4*s, z, col || '#5f7f4a', 0.9, 10); };
// rectangular frustum lofted through a concave curve (castle bases, battered walls)
const batter = (g, cx, cz, L0, W0, L1, W1, y0, h, col, pw, ns) => { const secs = []; ns = ns || 6; for (let i = 0; i <= ns; i++){ const u = i/ns, f = 1 - Math.pow(1 - u, pw || 1), a = (L0 + (L1 - L0)*f)/2, b = (W0 + (W1 - W0)*f)/2, y = y0 + h*u; secs.push([[cx - a, y, cz - b], [cx + a, y, cz - b], [cx + a, y, cz + b], [cx - a, y, cz + b]]); } return LLoft(g, secs, col, true); };

const circ = (r, n) => { const P = []; for (let i = 0; i < (n || 16); i++){ const a = i/(n || 16)*PI*2; P.push([Math.cos(a)*r, Math.sin(a)*r]); } return P; };
const semi = (r, n) => { const P = [[r, 0]]; for (let i = 1; i < n; i++){ const a = PI*i/n; P.push([Math.cos(a)*r, Math.sin(a)*r]); } P.push([-r, 0]); return P; };
const ogee = (hw, h, n) => { const P = []; n = n || 8; for (let i = 0; i <= 2*n; i++){ const s = -1 + i/n, u = 1 - Math.abs(s); P.push([s*hw, h*(u - 0.17*Math.sin(2*PI*u))]); } return P; };
// an opening or panel on a facade frame R (local x along, z outward): pointed (p), round (r) or any outline
const ap = (g, R, ry, x, y, z, pts, col, d) => { const c = R(x, 0, z); return LShape(g, pts, d || 0.4, c[0], y, c[2], col, ry); };
const bx = (g, R, ry, x, y, z, w, h, d, col) => { const c = R(x, 0, z); return LBox(g, w, h, d, c[0], y, c[2], col, ry); };
// a horse (with optional rider) in bronze, facing local +x; s = scale (1 = a 4.8 m long horse)
const horse = (g, x, y, z, ry, s, col, rider) => {
  const R = rotP(x, z, ry), B = (lx, ly, lz, w, h, d) => { const p = R(lx*s, 0, lz*s); LBox(g, w*s, h*s, d*s, p[0], y + ly*s, p[2], col, ry); }, Bm = (a, b, r) => { const p = R(a[0]*s, 0, a[2]*s), q = R(b[0]*s, 0, b[2]*s); LBeam(g, [p[0], y + a[1]*s, p[2]], [q[0], y + b[1]*s, q[2]], r*s, col, 6); };
  B(0, 2.2, 0, 4.6, 1.9, 1.5);
  for (const [lx, lz] of [[1.7, -0.45], [1.7, 0.45], [-1.7, -0.45], [-1.7, 0.45]]) B(lx, 0, lz, 0.4, 2.3, 0.4);
  Bm([1.9, 3.6, 0], [2.9, 5.1, 0], 0.5); Bm([2.8, 5.2, 0], [3.7, 4.5, 0], 0.38); Bm([-2.3, 3.6, 0], [-2.9, 2.0, 0], 0.22);
  if (rider){ Bm([0.1, 4.0, 0], [0.2, 6.0, 0], 0.55); const h = R(0.25*s, 0, 0); LSph(g, 0.42*s, h[0], y + 6.5*s, h[2], col, 1, 8); for (const sz of [-1, 1]) Bm([0.1, 4.3, sz*0.6], [0.4, 3.0, sz*0.75], 0.2); }
};
// a low building on any (simple) ring: walls to wallH, a roof skin from the eave line (outset ov) up to an inset flat ridge
function roofedRing(B, P, y0, wallH, rise, inset, ov, wallCol, roofCol){
  prism(B.a(wallCol), P, y0, y0 + wallH, false);
  const E = offsetRing(P, ov), T = offsetRing(P, -inset);
  skin(B.a(roofCol), E, y0 + wallH, T, y0 + wallH + rise); capP(B.a(roofCol), T, y0 + wallH + rise);
  capP(B.a(roofCol), E, y0 + wallH - 0.05, true);
}
// generated by tools/gen.py — real OSM footprints in local metres (x east, z south) round each anchor
const D_MARU = {"ring":[[-51.0,35.1],[22.7,55.3],[27.3,52.7],[50.3,-32.0],[48.4,-35.9],[-26.2,-56.3]],"tower":[[-37.5,-2.2],[-30.7,-0.4],[-32.6,6.5],[17.9,20.0],[19.9,12.8],[27.0,14.7],[35.0,-15.0],[27.8,-16.9],[29.6,-23.8],[-20.8,-37.3],[-22.7,-30.3],[-29.5,-32.1]]};
const D_SHIN = {"ring":[[-51.2,37.8],[17.9,55.5],[22.2,54.8],[26.0,52.7],[28.7,49.1],[49.3,-29.4],[49.1,-33.2],[48.0,-36.1],[45.5,-38.5],[39.1,-40.6],[-25.5,-57.9]],"parts":[{"b":0.0,"t":170.0,"r":[[-19.0,23.9],[9.3,31.6],[12.2,21.2],[-16.2,13.5]]},{"b":0.0,"t":170.0,"r":[[-5.9,-29.6],[23.1,-21.7],[25.0,-28.5],[-4.0,-36.4]]},{"b":0.0,"t":164.0,"r":[[-39.9,29.3],[-37.1,30.0],[-38.1,33.6],[18.8,49.0],[19.8,45.3],[22.8,46.1],[27.9,27.5],[24.6,26.6],[25.1,24.7],[-31.4,9.4],[-32.2,11.9],[-34.9,11.2]]},{"b":34.0,"t":201.0,"r":[[-33.8,4.9],[-30.5,5.8],[-31.4,9.4],[25.1,24.7],[25.9,21.7],[29.2,22.6],[39.1,-13.7],[36.0,-14.6],[36.9,-18.0],[-19.7,-33.4],[-20.6,-30.3],[-23.9,-31.2]]}]};
const D_JP = {"ring":[[-60.0,29.0],[1.6,45.1],[4.8,32.9],[61.3,48.1],[66.8,28.1],[33.6,-31.9],[28.5,-37.5],[24.9,-39.5],[21.4,-40.7],[-42.8,-57.8],[-46.3,-45.0],[-40.9,-43.5]],"parts":[{"b":0.0,"t":200.0,"r":[[-60.0,29.0],[1.6,45.1],[20.7,-27.3],[-40.9,-43.5]]},{"b":0.0,"t":28.0,"r":[[-46.3,-45.0],[20.7,-27.3],[50.7,26.0],[9.6,14.9],[4.8,32.9],[61.3,48.1],[66.8,28.1],[33.6,-31.9],[28.5,-37.5],[24.9,-39.5],[21.4,-40.7],[-42.8,-57.8]]},{"b":0.0,"t":28.0,"r":[[9.6,14.9],[50.7,26.0],[20.7,-27.3]]}]};
const D_TOKI = {"ring":[[-32.9,17.4],[-29.1,18.6],[-30.8,26.1],[-19.6,29.4],[-19.9,31.2],[11.3,39.8],[16.5,38.5],[19.8,34.7],[33.5,-11.1],[32.3,-11.5],[34.5,-18.0],[4.1,-27.4],[8.8,-41.6],[-12.5,-48.0]]};
const D_GRAN = {"ring":[[-49.7,125.0],[-38.7,128.7],[47.2,-89.8],[18.7,-99.0]]};
const D_NIHON = {"ring":[[-18.3,20.3],[-15.8,20.8],[-13.2,21.3],[-9.7,21.9],[-1.2,23.6],[3.6,24.5],[6.5,25.1],[9.4,25.6],[18.3,-20.3],[15.8,-20.7],[13.0,-21.3],[9.0,-22.1],[0.1,-23.8],[-4.9,-24.7],[-7.1,-25.1],[-9.4,-25.6]]};
// ===== Tokyo Station Marunouchi Building (Tatsuno Kingo, 1914; third storey and domes restored 2012) =====
// On the OSM footprint of the station building (r4856156): the main block between the two domes is 21.3 m deep (its OSM part),
// the octagonal domed halls (circumradius 20.2 m) stand at the north and south exits 198.6 m apart, the central (imperial)
// entrance with its porte-cochère faces the plaza (west). Dome part 37.6 m (JR East, creation-era / restored figures).
// Axis frame: u along the building (+u = NNE, 72.8 deg from east), v across (+v = the tracks side, -v = the Marunouchi plaza).
{
const C0 = [7.5, -13.85], ANG = 72.8*D2R;
const BRICK = '#a5503a', STONE = '#ebe5d5', SLATE = '#3f4449', COP = '#6f9886', PLINTH = '#cfc7b6';
const WIN = {c:'#2b2e33', glow:'#f7c983', gk:0.55};
LANDMARKS.tytokyostation = {zh:'东京站丸之内站舍', en:'Tokyo Station Marunouchi Building', cat:'old', r:150, h:38,
  lt:{m:0, c:'#ffd6a0', k:1.05, e:0.5},
  build(){
    const g = new THREE.Group(), B = mkBatch(), f = F(C0[0], C0[1], ANG), f3 = F3(C0[0], C0[1], ANG);
    const V0 = -10.4, V1 = 10.9, VM = (V0 + V1)/2;
    const box = (col, u0, u1, v0, v1, y0, y1) => fbox(B.a(col), f, ANG, (u0 + u1)/2, (v0 + v1)/2, u1 - u0, v1 - v0, y0, y1);
    // windows on the long faces of a block (front -v / back +v), floors at the given sill heights
    const wins = (u0, u1, v, out, sills, wh, bay, ww) => {
      const n = Math.max(1, Math.floor((u1 - u0)/bay)), a = B.a(WIN);
      for (let i = 0; i < n; i++){ const u = u0 + (i + 0.5)*(u1 - u0)/n;
        for (const y of sills) quad(a, f3(u - ww/2, y, v + out), f3(u + ww/2, y, v + out), f3(u + ww/2, y + wh, v + out), f3(u - ww/2, y + wh, v + out)); }
    };
    // white stone bands (string courses) on a block
    const bands = (u0, u1, v0, v1, ys, d) => { for (const [y0, y1] of ys) box(STONE, u0 - d, u1 + d, v0 - d, v1 + d, y0, y1); };
    // a wing block: three storeys of red brick with white bands, mansard roof, dormers
    const wing = (u0, u1, wallTop, roofTop, dorm) => {
      box(BRICK, u0, u1, V0, V1, 0, wallTop);
      box(PLINTH, u0, u1, V0 - 0.35, V1 + 0.35, 0, 1.4);
      bands(u0, u1, V0, V1, [[6.6, 7.2], [13.0, 13.5], [wallTop - 0.5, wallTop + 0.4]], 0.25);
      for (const [v, o] of [[V0, -0.08], [V1, 0.08]]) wins(u0 + 1, u1 - 1, v, o, [2.0, 8.6, 14.8], 3.3, 3.8, 1.6);
      // mansard roof
      hipB(B.a(SLATE), f3, u0, u1, V0, V1, wallTop + 0.4, roofTop, 0.5);
      if (dorm) for (let u = u0 + 6; u < u1 - 4; u += 11) for (const s of [-1, 1]){
        const v = s < 0 ? V0 + 2.2 : V1 - 2.2, y0 = wallTop + 1.2;
        box(STONE, u - 1.1, u + 1.1, v - 0.9, v + 0.9, y0, y0 + 2.4);
        gableB(B.a(SLATE), f3, u - 1.4, u + 1.4, v - 1.1, v + 1.1, y0 + 2.4, y0 + 3.4);
      }
    };
    // pavilion: a slightly projecting bay with a taller pyramidal / hipped roof
    const pavilion = (uc, hw, proj, wallTop, roofTop, spire) => {
      box(BRICK, uc - hw, uc + hw, V0 - proj, V1 + proj, 0, wallTop);
      box(PLINTH, uc - hw, uc + hw, V0 - proj - 0.35, V1 + proj + 0.35, 0, 1.4);
      bands(uc - hw, uc + hw, V0 - proj, V1 + proj, [[6.6, 7.2], [13.0, 13.5], [wallTop - 0.6, wallTop + 0.5]], 0.3);
      for (const s of [-1, 1]) for (const e of [-1, 1]){
        const u0 = e > 0 ? uc + hw - 0.9 : uc - hw - 0.25, u1 = e > 0 ? uc + hw + 0.25 : uc - hw + 0.9;
        box(STONE, u0, u1, s < 0 ? V0 - proj - 0.3 : V1 + proj - 0.6, s < 0 ? V0 - proj + 0.6 : V1 + proj + 0.3, 1.4, wallTop - 0.6); }
      for (const [v, o] of [[V0 - proj, -0.08], [V1 + proj, 0.08]]) wins(uc - hw + 1.2, uc + hw - 1.2, v, o, [2.0, 8.6, 14.8], 3.3, 3.4, 1.5);
      hipB(B.a(SLATE), f3, uc - hw, uc + hw, V0 - proj, V1 + proj, wallTop + 0.5, roofTop, 0.5);
      if (spire){ const c = f(uc, VM); cyl(B.a(COP), 0.9, 0.5, c[0], c[1], roofTop - 0.6, roofTop + 1.6, 8, true); cyl(B.a(COP), 0.15, 0.05, c[0], c[1], roofTop + 1.6, roofTop + spire, 6); }
    };
    // octagonal domed hall: drum, arched windows, ribbed ogee dome, lantern (flats face the axis directions)
    const dome = (uc) => {
      const c = f(uc, 0.13), R = 20.2, oct = r => { const P = []; for (let i = 0; i < 8; i++){ const t = ANG + (22.5 + 45*i)*D2R; P.push([c[0] + Math.cos(t)*r, c[1] - Math.sin(t)*r]); } return P; };
      const P = oct(R);
      prism(B.a(BRICK), P, 0, 22.4, false);
      prism(B.a(PLINTH), oct(R + 0.35), 0, 1.5, false);
      for (const [y0, y1] of [[6.6, 7.2], [13.0, 13.5], [21.6, 22.8]]) prism(B.a(STONE), oct(R + 0.3), y0, y1, false);
      // corner quoins
      for (let i = 0; i < 8; i++){ const p = P[i], t = Math.atan2(-(p[1] - c[1]), p[0] - c[0]); obox(B.a(STONE), p[0] + Math.cos(t)*0.15, p[1] - Math.sin(t)*0.15, t, 1.2, 1.2, 1.5, 21.6); }
      // arched windows on the 4 outer flats (front, back and the two diagonals away from the body), round-headed
      const aw = B.a(WIN);
      for (let i = 0; i < 8; i++){
        const p = P[i], q = P[(i + 1) % 8], mx = (p[0] + q[0])/2, mz = (p[1] + q[1])/2, el = Math.hypot(q[0] - p[0], q[1] - p[1]), ex = (q[0] - p[0])/el, ez = (q[1] - p[1])/el;
        const nx = (mx - c[0])/18.66*0.1, nz = (mz - c[1])/18.66*0.1;
        for (const k of [-1, 0, 1]){
          const cx = mx + ex*k*4.2 + nx, cz = mz + ez*k*4.2 + nz, hw = 0.85;
          for (const [y0, hgt] of [[2.0, 3.6], [8.4, 3.8], [14.6, 4.6]]){
            quad(aw, [cx - ex*hw, y0, cz - ez*hw], [cx + ex*hw, y0, cz + ez*hw], [cx + ex*hw, y0 + hgt, cz + ez*hw], [cx - ex*hw, y0 + hgt, cz - ez*hw]);
            for (let s = 0; s < 6; s++){ const a0 = PI*s/6, a1 = PI*(s + 1)/6;
              tri3(aw, [cx, y0 + hgt, cz], [cx + ex*Math.cos(a0)*hw, y0 + hgt + Math.sin(a0)*hw, cz + ez*Math.cos(a0)*hw], [cx + ex*Math.cos(a1)*hw, y0 + hgt + Math.sin(a1)*hw, cz + ez*Math.cos(a1)*hw]); }
          }
        }
      }
      // roof: an octagonal ogee (bell) dome from the drum to the lantern
      const prof = [[19.8, 22.8], [19.0, 24.2], [17.4, 26.0], [15.0, 28.0], [12.2, 30.0], [9.0, 31.9], [6.0, 33.5], [3.6, 34.7], [2.3, 35.3]];
      for (let k = 0; k + 1 < prof.length; k++) skin(B.a(SLATE), oct(prof[k][0]), prof[k][1], oct(prof[k + 1][0]), prof[k + 1][1]);
      // copper ribs on the 8 hips and a ring of oval dormers
      for (let i = 0; i < 8; i++){ const t = ANG + (22.5 + 45*i)*D2R; for (let k = 0; k + 1 < prof.length; k++){ const r0 = prof[k][0] + 0.12, r1 = prof[k + 1][0] + 0.12; beam(B.a(COP), [c[0] + Math.cos(t)*r0, prof[k][1], c[1] - Math.sin(t)*r0], [c[0] + Math.cos(t)*r1, prof[k + 1][1], c[1] - Math.sin(t)*r1], 0.35); } }
      for (let i = 0; i < 8; i++){ const t = ANG + 45*i*D2R, r = 15.9, x = c[0] + Math.cos(t)*r, z = c[1] - Math.sin(t)*r;
        obox(B.a(STONE), x, z, t + HP, 2.2, 1.4, 27.0, 29.2); obox(B.a(WIN), x + Math.cos(t)*0.72, z - Math.sin(t)*0.72, t + HP, 1.3, 0.1, 27.4, 28.8); }
      // lantern and finial
      cyl(B.a(STONE), 2.3, 2.1, c[0], c[1], 35.3, 36.2, 8, false); cyl(B.a(COP), 2.2, 0.6, c[0], c[1], 36.2, 37.1, 8, true); cyl(B.a(COP), 0.18, 0.06, c[0], c[1], 37.1, 37.6, 6);
      // corner pinnacles on the drum
      for (let i = 0; i < 8; i++){ const p = P[i]; cyl(B.a(STONE), 0.55, 0.55, p[0], p[1], 22.8, 24.2, 6, true); cyl(B.a(COP), 0.5, 0.05, p[0], p[1], 24.2, 25.8, 6); }
    };
    // ---- the composition (symmetric about the central entrance at u = 0) ----
    wing(-79.6, -21.0, 20.2, 25.6, true); wing(21.0, 79.6, 20.2, 25.6, true);
    // central entrance block: taller walls, a high hipped roof with a lantern, the porte-cochère of the imperial entrance
    pavilion(0, 21, 0.9, 21.6, 30.4, 3.8);
    box(STONE, -3.4, 3.4, -18.7, V0 - 0.9, 0, 6.2); box(SLATE, -3.8, 3.8, -19.1, V0 - 0.9, 6.2, 6.8);
    for (const s of [-1, 1]) box(STONE, s*3.0 - 0.45, s*3.0 + 0.45, -18.6, -17.7, 0, 6.2);
    // pavilions on the wings and the dome wings
    for (const s of [-1, 1]){ pavilion(s*50.3, 7.0, 0.6, 21.0, 28.0, 2.2); pavilion(s*79.6 + s*3.5, 4.2, 0.4, 20.8, 27.0, 0); }
    wing(-95.6, -83.8, 20.2, 25.6, false); wing(83.8, 95.6, 20.2, 25.6, false);
    dome(-99.3); dome(99.3);
    // the end wings beyond the domes
    wing(-129.0, -115.0, 20.2, 25.6, true); wing(115.0, 132.0, 20.2, 25.6, true);
    pavilion(-125.0, 4.6, 0.5, 20.8, 27.2, 1.6); pavilion(128.0, 4.6, 0.5, 20.8, 27.2, 1.6);
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'tytokyostation', lat:35.681249, lon:139.765977, rot:0});
}
// ===== the Marunouchi towers: Marunouchi Building, Shin-Marunouchi Building, JP Tower (KITTE), Tokiwabashi Tower =====
{
// spandrel bands every floor round a ring (outset d), from y0 to y1
const floorBands = (a, P, y0, y1, fh, bh, d) => { for (let y = y0 + fh - bh; y < y1 - 0.5; y += fh) band(a, P, y, y + bh, d); };
const GLS = {c:'#8f9ca6', m:1}, GLS2 = {c:'#7f93a3', m:1}, ALU = {c:'#d9dde0', m:0, lk:0.35}, ROOFC = '#9a9fa3', DARK = '#2a2e33';
const RED = {c:'#b02a20', glow:'#ff2a1a', gk:2.2};
// aviation lights on the corners of a roof ring
const avi = (a, P, y, n) => { const step = Math.max(1, Math.floor(P.length/(n || 4))); for (let i = 0; i < P.length; i += step){ const p = P[i]; obox(a, p[0], p[1], 0, 0.7, 0.7, y, y + 0.7); } };

// ---------- Marunouchi Building (2002, 37 floors, 179 m): 31 m stone podium on the old Marubiru line, tower set back ----------
LANDMARKS.tymarubiru = {zh:'丸之内大厦', en:'Marunouchi Building', cat:'new', r:65, h:179, lt:{m:1, c:'#ffe7c4', k:0.6},
  build(){
    const g = new THREE.Group(), B = mkBatch(), P = D_MARU.ring, T = D_MARU.tower, STN = {c:'#d8ccb4', m:0, lk:0.45}, WINP = {c:'#30353b', glow:'#f5cf94', gk:0.5};
    // podium: 9 floors of warm stone with deep windows, a plinth, a cornice at 31 m
    prism(B.a(STN), P, 0, 31, true); band(B.a('#bfb39c'), P, 0, 4.2, 0.3); band(B.a('#e4dac6'), P, 30.0, 31.6, 0.45);
    for (const y of [4.6, 26.6]) band(B.a('#cbbfa7'), P, y, y + 0.5, 0.25);
    ringWins(B.a(WINP), P, 4.2, 8, 3.3, 3.0, 1.8, 2.1, 6, 0.6);
    // the ground floor shop fronts (dark glass)
    ringWins(B.a({c:'#3a4148', glow:'#ffd9a0', gk:0.8}), P, 0.3, 1, 4, 6.0, 5.0, 3.3, 6, 0.3, 0.32);
    // tower: notched-corner plan, light glass with white floor bands, set back above the podium
    prism(B.a(GLS), T, 31, 171.5, false);
    floorBands(B.a(ALU), T, 31, 171.5, 4.2, 0.7, 0.18);
    ringFins(B.a(ALU), T, 31, 171.5, 6.0, 0.25, 0.4, 5);
    // crown: a recessed plant storey behind louvres, a thin lit top band, the roof
    const T2 = offsetRing(T, -1.6); prism(B.a({c:'#c9ced2', m:0, lk:0.6, lc:'#eef4ff'}), T2, 171.5, 178.2, true); band(B.a({c:'#f2f4f2', glow:'#f4f0e6', gk:0.6}), T, 171.5, 172.3, 0.25);
    band(B.a('#e8eaea'), T, 177.6, 179.0, 0.1); capP(B.a(ROOFC), T, 171.6);
    avi(B.a(RED), T2, 178.2, 4);
    B.flush(g); return g; }};
SG_PLACES.push({type:'tymarubiru', lat:35.68105, lon:139.763812, rot:0});

// ---------- Shin-Marunouchi Building (2007, Hopkins; 38 floors, 197.6 m): 34 m podium, glass tower with a lit crown ----------
LANDMARKS.tyshinmaru = {zh:'新丸之内大厦', en:'Shin-Marunouchi Building', cat:'new', r:66, h:198, lt:{m:1, c:'#e3eeff', k:0.6},
  build(){
    const g = new THREE.Group(), B = mkBatch(), P = D_SHIN.ring, PT = D_SHIN.parts;
    const main = PT.find(q => q.b === 34).r, slab = PT.find(q => q.t === 164).r, cores = PT.filter(q => q.t === 170).map(q => q.r);
    const POD = {c:'#c9b79c', m:0, lk:0.45}, WINP = {c:'#2f353b', glow:'#f3cf98', gk:0.5};
    // podium: stone-faced with a regular window grid, a glazed top storey and a cornice
    prism(B.a(POD), P, 0, 34, true); band(B.a('#b4a487'), P, 0, 5.0, 0.3);
    ringWins(B.a(WINP), P, 5.0, 7, 3.6, 2.6, 1.7, 2.3, 6, 0.6);
    band(B.a(GLS2), P, 30.2, 33.4, 0.08); band(B.a('#e6dfd0'), P, 33.4, 34.6, 0.4);
    ringWins(B.a({c:'#3a4148', glow:'#ffd9a0', gk:0.8}), P, 0.3, 1, 4.5, 6.0, 5.0, 3.6, 6, 0.3, 0.32);
    // tower: the main glass block with fine vertical fins, the lower north slab, the two service cores standing proud
    prism(B.a(GLS2), main, 34, 189.5, false); ringFins(B.a(ALU), main, 34, 189.5, 3.2, 0.2, 0.55, 5); floorBands(B.a({c:'#cfd6dc', m:0, lk:0.3}), main, 34, 189.5, 4.2, 0.35, 0.12);
    prism(B.a(GLS2), slab, 34, 162.5, false); ringFins(B.a(ALU), slab, 34, 162.5, 3.2, 0.2, 0.55, 5); capP(B.a(ROOFC), slab, 162.5); band(B.a('#e9ecee'), slab, 162.0, 164.0, 0.15);
    for (const c of cores){ prism(B.a({c:'#b9bfc4', m:0, lk:0.4}), c, 34, 170, true); }
    // crown: a glazed lantern above the main block, lit white at night
    const M2 = offsetRing(main, -2.2);
    prism(B.a({c:'#cfe0ea', glow:'#e9f3ff', gk:0.85, op:0.92}), M2, 189.5, 196.4, false); capP(B.a(ROOFC), main, 189.6);
    band(B.a('#eef0ef'), main, 189.0, 190.2, 0.2); band(B.a('#eef0ef'), M2, 196.4, 197.6, 0.1); capP(B.a(ROOFC), M2, 197.0);
    avi(B.a(RED), M2, 197.6, 4);
    B.flush(g); return g; }};
SG_PLACES.push({type:'tyshinmaru', lat:35.682581, lon:139.764305, rot:0});

// ---------- JP Tower (2012, Jahn; 38 floors, 200 m) behind the kept facade of the Tokyo Central Post Office (1931, Yoshida Tetsurō) ----------
LANDMARKS.tyjptower = {zh:'JP塔', en:'JP Tower', cat:'new', r:81, h:200, lt:{m:1, c:'#e6efff', k:0.6},
  build(){
    const g = new THREE.Group(), B = mkBatch(), PT = D_JP.parts, TQ = PT.find(q => q.t === 200).r, POD = PT.filter(q => q.t === 28).map(q => q.r);
    const TILE = {c:'#eeece4', m:0, lk:0.55}, WINP = {c:'#2d343a', glow:'#f6d39c', gk:0.5};
    // the former post office: five storeys of white tile with the regular grid of square windows, flat roof garden
    for (const P of POD){ prism(B.a(TILE), P, 0, 27.4, true); band(B.a('#d9d6cc'), P, 26.8, 28.0, 0.3); ringWins(B.a(WINP), P, 1.0, 5, 5.2, 3.2, 2.2, 2.6, 5, 1.2); }
    capP(B.a({c:'#8aa67f', m:0, lk:0.1}), POD[0], 28.05);
    // the tower: its plan is the OSM part; the two faces towards the station square are folded outward in two facets
    const [A, Bq, Cq, Dq] = TQ, sg = sarea(TQ) > 0 ? 1 : -1;
    const fold = (p, q, k) => { const n = nrm(p, q, sg); return [(p[0] + q[0])/2 + n[0]*k, (p[1] + q[1])/2 + n[1]*k]; };
    const ring = [A, Bq, fold(Bq, Cq, 3.2), Cq, fold(Cq, Dq, 3.2), Dq];
    prism(B.a(GLS), ring, 0, 192, false);
    floorBands(B.a({c:'#cfd5da', m:0, lk:0.3}), ring, 30, 192, 4.2, 0.35, 0.12);
    ringFins(B.a(ALU), ring, 30, 192, 4.2, 0.18, 0.35, 5);
    // the crown: the folded faces rise into a sloped glass top
    const top = offsetRing(ring, -1.5); prism(B.a({c:'#b9c4cc', m:0, lk:0.6, lc:'#eaf2ff'}), top, 192, 198.6, true); band(B.a('#eceeee'), ring, 191.4, 192.6, 0.2);
    avi(B.a(RED), top, 198.6, 4);
    B.flush(g); return g; }};
SG_PLACES.push({type:'tyjptower', lat:35.67975, lon:139.764791, rot:0});

// ---------- Tokiwabashi Tower (2021, 38 floors, 212 m) — Tokyo Torch ----------
LANDMARKS.tytokiwabashi = {zh:'常盘桥塔', en:'Tokiwabashi Tower', cat:'new', r:52, h:212, lt:{m:1, c:'#e6efff', k:0.6},
  build(){
    const g = new THREE.Group(), B = mkBatch(), P = D_TOKI.ring, T = offsetRing(P, -1.2);
    const STN = {c:'#cfc6b6', m:0, lk:0.45};
    // a stone-faced base, then the glass shaft with white vertical lines, a thin open crown frame
    prism(B.a(STN), P, 0, 13.5, true); ringWins(B.a({c:'#384047', glow:'#ffd9a0', gk:0.8}), P, 0.4, 2, 6.4, 5.5, 4.4, 5.0, 6, 0.4, 0.32);
    prism(B.a(GLS), T, 13.5, 204, false); ringFins(B.a(ALU), T, 13.5, 204, 3.0, 0.22, 0.45, 4); floorBands(B.a({c:'#cdd4d9', m:0, lk:0.3}), T, 13.5, 204, 4.4, 0.32, 0.12);
    capP(B.a(ROOFC), T, 204);
    const T2 = offsetRing(T, -0.4); band(B.a({c:'#e6e9ea', m:0, lk:0.7, lc:'#eef4ff'}), T2, 204, 212, 0.05);
    ringFins(B.a({c:'#e6e9ea', m:0, lk:0.7, lc:'#eef4ff'}), T2, 204, 212, 2.2, 0.3, 0.4, 4);
    avi(B.a(RED), T2, 211.4, 4);
    B.flush(g); return g; }};
SG_PLACES.push({type:'tytokiwabashi', lat:35.684224, lon:139.770618, rot:0});
}
// ===== Tokyo Station Yaesu Entrance — the GranRoof (2013): a long white membrane canopy over the 2nd-floor pedestrian deck =====
// On the OSM outline (w145412784, 234 m long, 30 m wide at the north end narrowing to 12 m at the south). The app draws the deck's
// footpath at 6.6 m; the deck slab here stops just under it. Steel masts along the station side carry arms that hold the
// membrane bays; the eave rises towards the Yaesu street side. Ground floor: the glazed station entrance and shops.
{
const MEM = {c:'#fbfaf7', ds:true, glow:'#f4efe4', gk:0.35}, STL = '#e3e5e6', GLZ = {c:'#7e8f9b', glow:'#ffe2b0', gk:0.7}, SLAB = '#bdb8ae';
LANDMARKS.tygranroof = {zh:'东京站八重洲口 GranRoof', en:'Tokyo Station Yaesu Entrance (GranRoof)', cat:'new', r:136, h:29,
  lt:{m:0, c:'#fff4e2', k:0.8, e:0.6},
  build(){
    const g = new THREE.Group(), B = mkBatch(), [S0, S1, N1, N0] = D_GRAN.ring;    // S0 south-west, S1 south-east, N1 north-east, N0 north-west
    // param (t along 0 = south .. 1 = north, w across 0 = west / station .. 1 = east / street)
    const at = (t, w) => { const a = [lerp(S0[0], N0[0], t), lerp(S0[1], N0[1], t)], b = [lerp(S1[0], N1[0], t), lerp(S1[1], N1[1], t)]; return [lerp(a[0], b[0], w), lerp(a[1], b[1], w)]; };
    const P3 = (t, w, y) => { const p = at(t, w); return [p[0], y, p[1]]; };
    const len = Math.hypot(N0[0] - S0[0], N0[1] - S0[1]), NB = 18;
    // ground floor: glazed entrance hall and shop fronts along the street side, low on the station side
    for (let i = 0; i < NB; i++){ const t0 = i/NB + 0.004, t1 = (i + 1)/NB - 0.004;
      quad(B.a(GLZ), P3(t0, 0.93, 0.3), P3(t1, 0.93, 0.3), P3(t1, 0.93, 5.6), P3(t0, 0.93, 5.6)); }
    // deck slab (top 6.4) with a glass balustrade on the street edge
    const D0 = [at(0, 0), at(1, 0), at(1, 1), at(0, 1)].map(p => p);
    prism(B.a(SLAB), [at(0, 0), at(0, 1), at(1, 1), at(1, 0)], 5.6, 6.4, true);
    for (let i = 0; i < NB*2; i++){ const t0 = i/(NB*2), t1 = (i + 1)/(NB*2); quad(B.a({c:'#a9c0c8', op:0.55, ds:true}), P3(t0, 0.995, 6.4), P3(t1, 0.995, 6.4), P3(t1, 0.995, 7.5), P3(t0, 0.995, 7.5)); }
    // columns under the deck
    for (let i = 0; i <= NB; i++) for (const w of [0.15, 0.75]){ const p = at(i/NB, w); cyl(B.a(STL), 0.45, 0.45, p[0], p[1], 0, 5.6, 8); }
    // masts on the station side, arms over the deck, the membrane bays between them (saddle-shaped, eave rising to the street)
    const yM = 28.0, yW = t => 16.0 + 1.5*Math.sin(t*PI), yE = t => 25.0 + 1.6*Math.sin(t*PI);
    for (let i = 0; i <= NB; i++){
      const t = i/NB, base = at(t, 0.04), top = [base[0], yM, base[1]];
      cyl(B.a(STL), 0.55, 0.55, base[0], base[1], 6.4, yM, 8);
      // arm from the mast head to the street edge, and a tie down to the deck
      beam(B.a(STL), top, P3(t, 1.02, yE(t) + 0.3), 0.55, 0.7);
      beam(B.a(STL), P3(t, 0.04, 16.0), P3(t, 1.0, yE(t)), 0.3, 0.3);
      beam(B.a(STL), P3(t, 0.98, 6.4), P3(t, 1.0, yE(t)), 0.35, 0.35);
    }
    for (let i = 0; i < NB; i++){
      const t0 = i/NB, t1 = (i + 1)/NB, tm = (t0 + t1)/2, NW = 6, NT = 4;
      // membrane surface: high along the arms, sagging between them (a saddle per bay)
      const Y = (t, w) => { const ft = Math.sin((t - t0)/(t1 - t0)*PI); const yArm = lerp(yW(t), yE(t), w); return yArm - 1.3*ft*Math.sin(w*PI*0.9 + 0.1); };
      for (let a = 0; a < NT; a++) for (let b = 0; b < NW; b++){
        const ta = lerp(t0, t1, a/NT), tb = lerp(t0, t1, (a + 1)/NT), wa = b/NW, wb = (b + 1)/NW;
        quad(B.a(MEM), P3(ta, wa, Y(ta, wa)), P3(tb, wa, Y(tb, wa)), P3(tb, wb, Y(tb, wb)), P3(ta, wb, Y(ta, wb)));
      }
      void tm;
    }
    // a white fascia along the street-side eave
    for (let i = 0; i < NB*3; i++){ const t0 = i/(NB*3), t1 = (i + 1)/(NB*3); quad(B.a(MEM), P3(t0, 1.0, yE(t0)), P3(t1, 1.0, yE(t1)), P3(t1, 1.0, yE(t1) - 1.4), P3(t0, 1.0, yE(t0) - 1.4)); }
    void D0; void len;
    B.flush(g); return g; }};
SG_PLACES.push({type:'tygranroof', lat:35.680176, lon:139.76819, rot:0});
}
// ===== Nihonbashi (1911): granite twin-arch bridge, 49 m long and 27 m wide, bronze kirin and lions, ornate lamp posts =====
// On the OSM bridge outline (w550689172). The app draws Chūō-dōri's deck; with the deck fix (nihonbashi_deck_fix.py) the road on the
// bridge is at 4.5 m above the river (the river surface in the app is at 0.25 m). The Shuto Expressway viaduct above is the app's.
// Axis frame: u along Chūō-dōri (+u = NNE, 79 deg from east), v across (+v = east / downstream).
{
const GR = {c:'#c9c2b4', m:0}, GR2 = '#b3ab9c', BRZ = {c:'#4c5a4c', m:0, lk:0.35}, GLOBE = {c:'#f2ecd8', glow:'#ffe2a6', gk:1.6}, DECKC = '#8a8780';
LANDMARKS.tynihonbashi = {zh:'日本桥', en:'Nihonbashi Bridge', cat:'old', r:40, h:15, water:true,
  lt:{m:0, c:'#ffd9a0', k:1.05, e:0.55},
  build(){
    const g = new THREE.Group(), B = mkBatch(), G = mkGround(35.684068, 139.774503, 40);
    const ANG = 79.0*D2R, f = F(0, 0, ANG), f3 = F3(0, 0, ANG);
    const yD = G.flat ? 4.5 : G.abs(4.5), yW = G.flat ? 0.25 : G.abs(0.25), yB = yW - 1.5;    // road surface, water, below the water
    const HL = 24.4, HW = 13.6, PIER = 2.6;                      // half length, half width (with the footways), half the central pier
    const SP = HL - 2.0 - PIER;                                   // each arch span between the pier and the abutment face
    // the arch barrels: two segmental arches, springing just above the water, crown 1.1 m under the road
    const crown = yD - 1.15, spring = yW + 0.6;
    const archY = (u, uc, hs) => { const x = (u - uc)/hs; return spring + (crown - spring)*Math.sqrt(Math.max(0, 1 - x*x)); };
    for (const s of [-1, 1]){
      const uc = s*(PIER + SP/2), hs = SP/2, N = 14;
      // spandrel walls on both faces (from the arch curve up to the road), and the barrel underside
      for (const v of [-HW, HW]){
        const a = B.a(GR);
        for (let i = 0; i < N; i++){ const u0 = uc - hs + 2*hs*i/N, u1 = uc - hs + 2*hs*(i + 1)/N;
          quad(a, f3(u0, archY(u0, uc, hs), v), f3(u1, archY(u1, uc, hs), v), f3(u1, yD, v), f3(u0, yD, v)); }
        // the voussoir ring standing a little proud
        for (let i = 0; i < N; i++){ const u0 = uc - hs + 2*hs*i/N, u1 = uc - hs + 2*hs*(i + 1)/N, o = v < 0 ? -0.25 : 0.25;
          quad(B.a(GR2), f3(u0, archY(u0, uc, hs), v + o), f3(u1, archY(u1, uc, hs), v + o), f3(u1, archY(u1, uc, hs) + 0.9, v + o), f3(u0, archY(u0, uc, hs) + 0.9, v + o)); }
      }
      for (let i = 0; i < N; i++){ const u0 = uc - hs + 2*hs*i/N, u1 = uc - hs + 2*hs*(i + 1)/N;
        quad(B.a(GR2), f3(u0, archY(u0, uc, hs), -HW), f3(u0, archY(u0, uc, hs), HW), f3(u1, archY(u1, uc, hs), HW), f3(u1, archY(u1, uc, hs), -HW)); }
    }
    // central pier with cutwaters, abutments into both banks
    fbox(B.a(GR), f, ANG, 0, 0, PIER*2, HW*2 + 0.4, yB, yD);
    for (const s of [-1, 1]){ const c = f(0, s*(HW + 1.6)); cyl(B.a(GR), 2.0, 2.0, c[0], c[1], yB, spring + 0.8, 4); }
    for (const s of [-1, 1]) fbox(B.a(GR), f, ANG, s*(HL - 1.0), 0, 2.0, HW*2 + 0.6, yB, yD);
    // the deck edge (a cornice) and the granite balustrades
    for (const v of [-HW, HW]){ fbox(B.a(GR2), f, ANG, 0, v, HL*2, 0.9, yD - 0.6, yD); fbox(B.a(GR), f, ANG, 0, v + (v < 0 ? 0.25 : -0.25), HL*2, 0.55, yD, yD + 1.15); fbox(B.a(GR2), f, ANG, 0, v + (v < 0 ? 0.25 : -0.25), HL*2, 0.75, yD + 1.15, yD + 1.35); }
    capP(B.a(DECKC), [f(-HL, -HW), f(HL, -HW), f(HL, HW), f(-HL, HW)], yD - 0.05);
    // the kirin lamp pillars over the central pier (both sides) and the four lion pillars at the ends
    for (const v of [-HW - 0.2, HW + 0.2]){
      const c = f(0, v);
      fbox(B.a(GR), f, ANG, 0, v, 3.4, 2.4, yD, yD + 2.0); fbox(B.a(GR2), f, ANG, 0, v, 2.6, 1.8, yD + 2.0, yD + 2.4);
      // bronze lamp column with four arms of lamps, the winged kirin on top
      cyl(B.a(BRZ), 0.55, 0.75, c[0], c[1], yD + 2.4, yD + 6.4, 8); cyl(B.a(BRZ), 0.85, 0.55, c[0], c[1], yD + 6.4, yD + 6.9, 8, true);
      for (let k = 0; k < 4; k++){ const t = ANG + PI/4 + k*HP, x = c[0] + Math.cos(t)*1.3, z = c[1] - Math.sin(t)*1.3;
        beam(B.a(BRZ), [c[0], yD + 5.6, c[1]], [x, yD + 5.9, z], 0.16); cyl(B.a(GLOBE), 0.32, 0.32, x, z, yD + 5.9, yD + 6.6, 8, true); }
      cyl(B.a(GLOBE), 0.42, 0.42, c[0], c[1], yD + 6.9, yD + 7.7, 8, true);
      // kirin: a crouched body with raised wings (bronze), facing along the road
      const k3 = F3(c[0], c[1], ANG);
      fbox(B.a(BRZ), f, ANG, 0, v, 1.6, 0.6, yD + 7.7, yD + 8.5);
      for (const w of [-1, 1]) tri3(B.a(BRZ), k3(-0.6, yD + 8.3, w*0.2), k3(0.5, yD + 8.4, w*0.25), k3(-0.9, yD + 9.8, w*1.1));
      fbox(B.a(BRZ), f, ANG, 0.75, v, 0.5, 0.4, yD + 8.5, yD + 9.1);
    }
    for (const su of [-1, 1]) for (const v of [-HW - 0.2, HW + 0.2]){
      const u = su*(HL - 1.2), c = f(u, v);
      fbox(B.a(GR), f, ANG, u, v, 2.2, 2.2, yD, yD + 2.6); fbox(B.a(GR2), f, ANG, u, v, 2.6, 2.6, yD + 2.6, yD + 2.9);
      // lion holding the city shield (abstract), bronze, and the end lamp post
      fbox(B.a(BRZ), f, ANG, u, v, 1.4, 0.7, yD + 2.9, yD + 3.7); fbox(B.a(BRZ), f, ANG, u - su*0.45, v, 0.55, 0.6, yD + 3.7, yD + 4.4);
      const lc = f(u + su*0.2, v + (v < 0 ? 1.4 : -1.4));
      cyl(B.a(BRZ), 0.16, 0.22, lc[0], lc[1], yD, yD + 4.6, 8); cyl(B.a(GLOBE), 0.35, 0.35, lc[0], lc[1], yD + 4.6, yD + 5.3, 8, true);
    }
    // footway lamps along the balustrade
    for (const u of [-12, 12]) for (const v of [-HW + 0.3, HW - 0.3]){ const c = f(u, v); cyl(B.a(BRZ), 0.12, 0.16, c[0], c[1], yD + 1.35, yD + 4.4, 6); cyl(B.a(GLOBE), 0.3, 0.3, c[0], c[1], yD + 4.4, yD + 5.0, 8, true); }
    B.flush(g); return g; }};
SG_PLACES.push({type:'tynihonbashi', lat:35.684068, lon:139.774503, rot:0});
}
}
