// ===== City Brush v38 — Tokyo landmarks and a site: central Tokyo (tyx_central): the Tokyo International Forum, the Bank of
// Japan, Nikolai-dō, Kanda Myōjin, Hie Shrine, the Kachidoki / Eitai / Kiyosu bridges, the Edo-Tokyo Museum, the Kokugikan and
// Hama-rikyū (site). Real OSM footprints, rot 0 (local x east, z south). No logos, names or signage. Built from src/ by build.sh.
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
// ---------- tyx_central helpers (on top of the shared ty_a helpers above) ----------
// world <-> local for an anchor: local x east, z south (rot 0)
const anchorXY = (lat, lon) => typeof sgXY === 'function' ? sgXY(lat, lon) : [(lon - 139.75)*90549.1, (lat - 35.66)*110952.7];
// the app's road ground: the upper bound of both triangulations of the terrain grid (as the roads module draws its decks), >= -0.3
function appG(X, Y){
  if (typeof hAt !== 'function') return 0;
  let T = 70; try { if (typeof TS !== 'undefined' && TS > 1) T = TS; } catch (e){}
  const H = typeof HALF !== 'undefined' ? HALF : 28000, fx = (X + H)/T, fy = (Y + H)/T, i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j;
  const x0 = -H + i*T, y0 = -H + j*T, a = hAt(x0, y0), b = hAt(x0 + T, y0), d = hAt(x0, y0 + T), c = hAt(x0 + T, y0 + T);
  let h = (a + (b - a)*u)*(1 - v) + (d + (c - d)*u)*v; const t = a - b + c - d;
  if (t > 0) h += t*(u >= v ? v*(1 - u) : u*(1 - v)); else if (t < 0){ const w = 1 - u; h -= t*(w >= v ? v*(1 - w) : w*(1 - v)); }
  return h > -0.3 ? h : -0.3;
}
// a bridge deck profile from the app's data: the road line's vertices (u along the axis, e above the ground) with the app's
// monotone cubic; deckAt(u) = the road surface in local y (flat kit: the water at -0.3 + e)
function deckProfile(G, lat, lon, line, ang, off){
  const A = anchorXY(lat, lon), c = Math.cos(ang), s = Math.sin(ang);
  const V = line.p.map((p, k) => ({u:p[0]*c - p[1]*s, e:line.e[k], x:p[0], z:p[1]})).sort((a, b) => a.u - b.u);
  const n = V.length, sl = new Array(n).fill(0);
  for (let q = 1; q < n - 1; q++){ const h0 = V[q].u - V[q-1].u, h1 = V[q+1].u - V[q].u, d0 = (V[q].e - V[q-1].e)/h0, d1 = (V[q+1].e - V[q].e)/h1;
    sl[q] = d0*d1 <= 0 ? 0 : 3*(h0 + h1)/((2*h1 + h0)/d0 + (h1 + 2*h0)/d1); }
  const eAt = u => { if (u <= V[0].u) return V[0].e; if (u >= V[n-1].u) return V[n-1].e; let k = 0; while (k < n - 2 && V[k+1].u < u) k++;
    const h = V[k+1].u - V[k].u, t = (u - V[k].u)/h, t2 = t*t, t3 = t2*t;
    return Math.max(0, (2*t3 - 3*t2 + 1)*V[k].e + (t3 - 2*t2 + t)*h*sl[k] + (-2*t3 + 3*t2)*V[k+1].e + (t3 - t2)*h*sl[k+1]); };
  // the ground under the line at u (the line passes ~ through the axis)
  const v0 = line.p.reduce((a, p) => a + (p[0]*s + p[1]*c), 0)/line.p.length;
  const gAt = u => { if (G.flat) return -0.3; const x = u*c + v0*s, z = -u*s + v0*c; return appG(A[0] + x, A[1] - z); };
  return {eAt, gAt, u0:V[0].u, u1:V[n-1].u, deckAt:u => G.abs(gAt(u) + eAt(u) + (off === undefined ? 0.18 : off))};
}
// a tree crown (low-poly blob) and trunk into batches
function crown(a, x, y, z, r, h, n){ n = n || 7; const R = [[0, -0.05], [0.8, 0.12], [1.0, 0.45], [0.78, 0.8], [0, 1.0]];
  for (let k = 0; k < R.length - 1; k++) for (let i = 0; i < n; i++){ const t0 = i/n*TAU, t1 = (i + 1)/n*TAU, a0 = R[k], a1 = R[k+1];
    const P = (q, t) => [x + Math.cos(t)*q[0]*r, y + q[1]*h, z + Math.sin(t)*q[0]*r]; quad(a, P(a0, t0), P(a0, t1), P(a1, t1), P(a1, t0)); } }
// polygon clipping against a half-plane a*x + b*z <= c (Sutherland-Hodgman)
function clipHalf(P, a, b, c){ const out = [], n = P.length; for (let i = 0; i < n; i++){ const p = P[i], q = P[(i + 1) % n], dp = a*p[0] + b*p[1] - c, dq = a*q[0] + b*q[1] - c;
  if (dp <= 0) out.push(p); if ((dp < 0) !== (dq < 0) && dp !== dq){ const t = dp/(dp - dq); out.push([p[0] + (q[0] - p[0])*t, p[1] + (q[1] - p[1])*t]); } } return out; }
// the extent of a polygon along the line through (px, pz) with direction (dx, dz): [tmin, tmax] of the crossings (or null)
function crossSpan(P, px, pz, dx, dz){ let lo = Infinity, hi = -Infinity; const n = P.length;
  for (let i = 0; i < n; i++){ const a = P[i], b = P[(i + 1) % n], ex = b[0] - a[0], ez = b[1] - a[1], den = dx*ez - dz*ex; if (Math.abs(den) < 1e-9) continue;
    const t = ((a[0] - px)*ez - (a[1] - pz)*ex)/den, w = ((a[0] - px)*dz - (a[1] - pz)*dx)/den; if (w >= 0 && w <= 1){ lo = Math.min(lo, t); hi = Math.max(hi, t); } }
  return lo < hi ? [lo, hi] : null; }
// a vermilion torii between the two post points a, b (local x, z) standing on ground y0; h = height of the kasagi
function torii(B, a, b, y0, h, col, top, sanno){
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), ang = Math.atan2(-(b[1] - a[1]), b[0] - a[0]), cx = (a[0] + b[0])/2, cz = (a[1] + b[1])/2, f = F(cx, cz, ang), f3 = F3(cx, cz, ang);
  const pr = Math.max(0.18, L*0.055), ov = L*0.22;
  for (const s of [-1, 1]){ const p = f(s*L/2, 0); cyl(B.a(col), pr, pr*1.12, p[0], p[1], y0, y0 + h - 0.2, 8); cyl(B.a(top || '#2b2b2b'), pr*1.25, pr*1.25, p[0], p[1], y0, y0 + 0.5, 8); }
  fbox(B.a(col), f, ang, 0, 0, L + ov*0.8, pr*1.6, y0 + h*0.72, y0 + h*0.72 + pr*1.5);                 // nuki
  // kasagi (black capped, slightly upswept ends)
  const k0 = y0 + h - 0.2, w = pr*2.2;
  for (let i = 0; i < 6; i++){ const u0 = -1 + i/3, u1 = -1 + (i + 1)/3, lift = q => 0.35*Math.pow(Math.abs(q), 3)*pr*4;
    const P0 = f3(u0*(L/2 + ov), k0 + lift(u0), -w/2), P1 = f3(u1*(L/2 + ov), k0 + lift(u1), -w/2), Q0 = f3(u0*(L/2 + ov), k0 + lift(u0), w/2), Q1 = f3(u1*(L/2 + ov), k0 + lift(u1), w/2);
    const up = p => [p[0], p[1] + pr*1.4, p[2]];
    quad(B.a(col), P0, P1, up(P1), up(P0)); quad(B.a(col), Q1, Q0, up(Q0), up(Q1)); quad(B.a(top || '#2b2b2b'), up(P0), up(P1), up(Q1), up(Q0)); }
  fbox(B.a(col), f, ang, 0, 0, pr*1.2, pr*1.2, y0 + h*0.72 + pr*1.5, k0);                              // gakuzuka
  if (sanno){ // the Sanno torii: a triangular gable on the kasagi
    for (const s of [-1, 1]) tri3(B.a(col), f3(-L*0.28, k0 + pr*1.4, s*w/2), f3(L*0.28, k0 + pr*1.4, s*w/2), f3(0, k0 + pr*1.4 + L*0.16, s*w/2));
    for (const s of [-1, 1]) quad(B.a(top || '#2b2b2b'), f3(s*L*0.29, k0 + pr*1.45, -w/2 - 0.05), f3(0, k0 + pr*1.45 + L*0.165, -w/2 - 0.05), f3(0, k0 + pr*1.45 + L*0.165, w/2 + 0.05), f3(s*L*0.29, k0 + pr*1.45, w/2 + 0.05));
  }
}
// a shrine / temple hall on an oriented rectangle: stone base, posts + walls, a curved irimoya / hip roof (kit eave via jroof)
function shrineHall(g, B, f, ang, cx, cz, L, W, y0, o){
  o = o || {}; const base = o.base || 0.9, wh = o.wh || 4.5, col = o.col || '#b8352a', wall = o.wall || '#efe6d2', roof = o.roof || '#5d8f7a';
  fbox(B.a(o.stone || '#a49e92'), f, ang, 0, 0, L + 1.2, W + 1.2, y0 - 2.0, y0 + base);
  const yb = y0 + base;
  fbox(B.a(wall), f, ang, 0, 0, L - 0.9, W - 0.9, yb, yb + wh);
  const np = Math.max(2, Math.round(L/2.6)), nq = Math.max(2, Math.round(W/2.6));
  for (let i = 0; i <= np; i++) for (const s of [-1, 1]){ const p = f(-L/2 + L*i/np, s*(W/2 - 0.35)); cyl(B.a(col), 0.22, 0.22, p[0], p[1], yb, yb + wh, 6); }
  for (let i = 1; i < nq; i++) for (const s of [-1, 1]){ const p = f(s*(L/2 - 0.35), -W/2 + W*i/nq); cyl(B.a(col), 0.22, 0.22, p[0], p[1], yb, yb + wh, 6); }
  fbox(B.a(col), f, ang, 0, 0, L - 0.3, W - 0.3, yb + wh - 0.7, yb + wh);                                 // the head beams
  if (o.gold) fbox(B.a(o.gold), f, ang, 0, 0, L - 0.2, W - 0.2, yb + wh - 0.85, yb + wh - 0.7);
  const yt = jroof(g, cx, cz, ang, L, W, yb + wh, Object.assign({col:roof, over:o.over || 1.6, h:o.rh || Math.max(1.8, W*0.36), gab:o.gab === undefined ? 0.45 : o.gab, gcol:o.gcol || wall, ridge:0.35, rcol:o.rcol || roof}, o.ro || {}));
  return {yb, yt};
}
const D_TYX = {"FORUM":{"hb":[[-64.9,110.6],[-26.7,120.7],[-24.2,111.4],[-16.2,113.6],[-8.8,86.0],[-21.4,82.6],[-19.3,74.5],[0.9,79.9],[10.6,43.5],[-2.2,40.1],[0.2,31.3],[23.3,37.5],[35.5,-7.6],[22.3,-11.1],[24.4,-19.0],[55.3,-10.7],[72.2,-73.4],[58.9,-77.0],[60.6,-83.4],[13.3,-96.0],[12.1,-91.6],[-0.3,-94.9],[0.8,-98.7],[-8.0,-101.1]],"parts":[{"b":0.0,"t":61.0,"r":[[-62.4,101.4],[-39.4,107.6],[-31.9,79.8],[-36.7,78.6],[-34.5,70.4],[-29.9,71.7],[-20.1,35.3],[-24.8,34.0],[-22.5,25.3],[-17.4,26.7],[-5.2,-18.5],[-10.7,-19.9],[-8.6,-27.7],[-2.8,-26.2],[14.6,-90.9],[-9.0,-97.2]]},{"b":0.0,"t":47.0,"r":[[-64.9,110.6],[-26.7,120.7],[-24.2,111.4],[-16.2,113.6],[-8.8,86.0],[-36.7,78.6],[-34.5,70.4],[0.9,79.9],[10.6,43.5],[-24.8,34.0],[-22.5,25.3],[23.3,37.5],[35.5,-7.6],[-10.7,-19.9],[-8.6,-27.7],[55.3,-10.7],[72.2,-73.4],[14.0,-88.9],[14.6,-90.9],[-0.3,-94.9],[0.8,-98.7],[-8.0,-101.1]]},{"b":0.0,"t":61.0,"r":[[-9.0,-97.2],[-0.3,-94.9],[0.8,-98.7],[-8.0,-101.1]]},{"b":0.0,"t":61.0,"r":[[-64.9,110.6],[-55.1,113.2],[-52.7,104.0],[-62.4,101.4]]}],"gl":[[1.0,118.1],[3.3,128.4],[13.3,120.2],[52.4,83.8],[66.2,67.2],[85.4,39.9],[108.1,2.8],[118.8,-23.0],[127.0,-45.6],[129.1,-57.7],[129.4,-65.1],[119.5,-67.9],[117.4,-56.6],[100.0,-41.4],[79.0,-20.9],[57.0,5.3],[39.9,30.4],[17.5,70.3]],"gla":[[1.0,118.1],[41.1,79.7],[68.2,46.8],[95.2,1.7],[105.9,-20.9],[115.6,-48.9],[117.4,-56.6],[100.0,-41.4],[79.0,-20.9],[57.0,5.3],[39.9,30.4],[17.5,70.3]],"east":[[3.3,128.4],[13.3,120.2],[52.4,83.8],[66.2,67.2],[85.4,39.9],[108.1,2.8],[118.8,-23.0],[127.0,-45.6],[129.1,-57.7],[129.4,-65.1],[119.5,-67.9],[117.4,-56.6],[115.6,-48.9],[105.9,-20.9],[95.2,1.7],[68.2,46.8],[41.1,79.7],[1.0,118.1]]},"BOJ":{"ring":[[-76.9,-51.2],[-47.1,31.1],[8.5,11.6],[9.7,14.2],[-37.6,31.1],[-16.8,91.1],[75.0,56.3],[52.2,-9.0],[39.1,-3.7],[40.6,2.9],[13.1,12.5],[11.9,10.3],[29.1,4.3],[22.1,-15.3],[33.0,-19.4],[37.9,-6.6],[51.2,-11.2],[23.4,-91.1],[-6.9,-79.0],[-6.6,-76.4]]},"NIK":{"ring":[[-23.5,-0.5],[-22.6,0.6],[-21.2,0.1],[-9.1,5.4],[-8.7,6.9],[-7.9,7.5],[-9.9,12.3],[-5.6,14.1],[-6.4,15.9],[0.0,18.7],[0.8,16.9],[5.1,18.6],[7.1,13.8],[7.9,14.2],[9.3,13.2],[14.1,15.3],[16.2,10.5],[18.9,9.6],[20.0,6.8],[18.9,4.2],[20.9,-0.5],[16.1,-2.5],[15.9,-4.3],[15.0,-4.7],[17.0,-9.4],[12.1,-11.5],[12.9,-13.1],[7.6,-15.4],[6.9,-13.7],[2.1,-15.7],[0.1,-11.1],[-0.7,-11.4],[-2.2,-10.4],[-14.4,-15.6],[-14.5,-16.9],[-16.0,-17.4],[-16.8,-16.3],[-16.5,-15.1],[-17.9,-12.0],[-19.5,-12.7],[-22.3,-6.1],[-20.7,-5.4],[-22.2,-2.0],[-23.0,-1.7]],"parts":[{"t":30.0,"r":[[-4.3,1.0],[-3.5,4.7],[-2.4,6.4],[0.6,8.5],[3.7,9.2],[7.8,8.0],[9.5,6.6],[11.4,2.8],[11.5,0.5],[11.1,-1.5],[8.6,-4.9],[4.8,-6.6],[2.8,-6.6],[0.5,-6.0],[-1.5,-4.7],[-3.8,-1.4]]},{"t":20.0,"r":[[-5.7,1.0],[-3.0,7.9],[3.5,10.6],[10.2,8.1],[13.0,1.4],[10.3,-5.2],[3.5,-8.0],[-2.8,-5.5]]},{"t":18.0,"r":[[-8.1,4.5],[-7.3,6.8],[6.8,12.7],[9.3,11.8],[15.3,-1.6],[14.4,-4.3],[0.3,-10.4],[-2.1,-9.5]]},{"t":23.0,"r":[[-20.1,-8.1],[-19.5,-6.6],[-18.1,-5.8],[-16.5,-5.9],[-15.3,-7.0],[-14.9,-8.6],[-15.6,-10.0],[-17.0,-10.9],[-18.6,-10.7],[-19.8,-9.7]]},{"t":15.0,"r":[[-22.3,-6.1],[-15.9,-3.3],[-13.0,-9.8],[-19.5,-12.7]]},{"t":11.0,"r":[[-23.5,-0.5],[-22.6,0.6],[-21.2,0.1],[-14.0,3.3],[-7.2,-12.5],[-14.4,-15.6],[-14.5,-16.9],[-16.0,-17.4],[-16.8,-16.3],[-16.5,-15.1],[-17.9,-12.0],[-19.5,-12.7],[-22.3,-6.1],[-20.7,-5.4],[-22.2,-2.0],[-23.0,-1.7]]},{"t":15.0,"r":[[-0.5,-9.7],[14.4,-3.3],[17.0,-9.4],[2.1,-15.7]]},{"t":15.0,"r":[[7.6,12.5],[14.1,15.3],[20.9,-0.5],[14.4,-3.3]]},{"t":15.0,"r":[[-14.0,3.3],[-7.3,6.1],[-0.5,-9.7],[-7.2,-12.5]]},{"t":15.0,"r":[[-9.9,12.3],[5.1,18.6],[7.6,12.5],[-7.3,6.1]]},{"t":15.0,"r":[[-7.3,6.1],[7.6,12.5],[14.4,-3.3],[-0.5,-9.7]]}]},"KANDA":{"prec":[[-22.8,-55.9],[28.7,-60.5],[28.3,-67.4],[57.2,-69.1],[60.3,-50.6],[35.1,56.2],[33.4,62.3],[3.5,55.3],[-6.8,71.2],[-36.1,54.6],[-77.7,14.1],[-56.8,-6.4],[-39.6,-24.1],[-28.6,-34.2]],"core":[[56.6,-68.6],[55.1,-69.7],[29.2,-67.7],[26.3,-67.0],[26.6,-62.3],[-6.1,-59.4],[-15.0,-57.1],[-29.7,-37.7],[-30.4,-35.3],[-36.1,-29.2],[-49.7,-7.2],[-38.0,0.4],[-36.9,4.0],[-55.6,32.8],[-57.2,34.2],[-39.1,50.8],[-27.3,58.6],[-18.1,62.5],[3.6,58.8],[4.4,57.6],[7.1,58.2],[33.4,53.2],[45.8,7.9],[57.7,-55.4]],"bld":[{"id":"w89431872","n":"魚河岸水神社","t":"religious","h":10.0,"r":[[-43.6,-1.7],[-36.0,3.7],[-31.8,-2.1],[-39.4,-7.5]],"q":[-37.7,-1.9,-0.6178,9.39,7.16]},{"id":"w89431873","n":"江戸神社","t":"religious","h":7.5,"r":[[-27.5,-24.0],[-19.9,-18.9],[-14.1,-27.4],[-21.7,-32.5]],"q":[-20.8,-25.7,0.972,10.36,9.15]},{"id":"w89431874","n":"氏子神輿庫","t":"industrial","h":10.0,"r":[[29.4,-66.2],[30.5,-53.5],[56.2,-55.5],[55.2,-68.2]],"q":[42.8,-60.85,0.0777,25.89,12.75]},{"id":"w89431875","n":"一の宮・二の宮奉安庫","t":"apartment","h":11.5,"r":[[-16.2,-51.1],[-16.0,-42.9],[-13.8,-42.9],[-13.7,-40.9],[-1.4,-41.1],[-1.5,-43.1],[0.6,-43.2],[0.4,-51.4],[-1.6,-51.4],[-1.7,-56.3],[-14.0,-56.0],[-13.9,-51.2]],"q":[-7.83,-48.55,0.0244,16.6,15.2]},{"id":"w89431877","n":"御社殿","t":"religious","h":11.0,"r":[[-14.1,-10.2],[-10.1,-7.6],[-11.2,-5.8],[-9.5,-4.7],[-12.7,0.1],[-8.8,2.6],[-10.0,4.3],[3.9,13.4],[5.4,11.2],[9.1,13.6],[11.6,9.8],[13.6,11.1],[15.6,8.1],[20.7,11.5],[30.4,-3.2],[24.1,-7.2],[31.3,-18.2],[8.9,-32.8],[0.5,-20.1],[-5.1,-23.8]],"q":[9.01,-8.02,0.9911,41.45,41.07]},{"id":"w89431879","n":"明神会館","t":"apartment","h":18.0,"r":[[10.9,41.3],[15.5,42.5],[13.4,50.2],[23.3,52.8],[24.1,49.9],[32.4,52.1],[44.3,7.6],[29.3,3.6],[24.7,20.7],[21.3,19.8],[17.9,32.6],[13.5,31.4]],"q":[26.55,28.29,1.3095,49.14,23.61]},{"id":"w89431880","n":"","t":"house","h":6.5,"r":[[-25.2,56.0],[-17.8,61.0],[-14.4,55.9],[-21.8,50.9]],"q":[-19.8,55.95,-0.5942,8.97,6.13]},{"id":"w89431884","n":"随神門","t":"apartment","h":7.0,"r":[[-38.2,49.6],[-26.6,57.3],[-19.7,46.9],[-31.3,39.2]],"q":[-28.95,48.25,-0.586,13.93,12.48]},{"id":"w89431886","n":"祖霊社","t":"house","h":7.5,"r":[[34.3,-36.3],[41.3,-35.0],[42.3,-40.4],[35.4,-41.8]],"q":[38.34,-38.35,-0.1974,7.12,5.61]},{"id":"w89431887","n":"","t":"house","h":6.5,"r":[[-49.3,38.2],[-36.9,46.3],[-33.5,41.2],[-45.9,33.1]],"q":[-41.4,39.7,-0.5786,14.87,6.13]},{"id":"w89431889","n":"小舟町八雲神社","t":"religious","h":11.5,"r":[[-41.0,-11.6],[-32.3,-5.4],[-27.5,-12.0],[-36.3,-18.3]],"q":[-34.28,-11.82,-0.6213,10.82,8.18]},{"id":"w89431891","n":"祭務所","t":"office","h":7.0,"r":[[-12.9,46.9],[-3.5,52.9],[3.7,41.9],[-5.7,35.8]],"q":[-4.6,44.4,0.9954,13.23,11.21]},{"id":"w91234941","n":"神田明神資料館","t":"civic","h":13.0,"r":[[-11.1,-28.2],[0.8,-20.7],[10.6,-36.1],[1.4,-41.9],[-0.4,-39.0],[-3.1,-40.8]],"q":[-0.25,-32.15,1.0051,18.3,14.08]},{"id":"w91234942","n":"大伝馬町八雲神社","t":"religious","h":11.5,"r":[[-30.8,-15.6],[-25.6,-12.1],[-21.8,-17.7],[-27.0,-21.2]],"q":[-26.3,-16.65,0.9746,6.79,6.27]},{"id":"w91234945","n":"三の宮奉安庫","t":"house","h":6.5,"r":[[28.9,-50.8],[29.3,-45.3],[38.7,-46.1],[38.3,-51.6]],"q":[33.8,-48.45,0.0849,9.5,5.51]},{"id":"w1228847930","n":"","t":"shed","h":3.0,"r":[[-58.9,30.6],[-51.2,37.5],[-32.6,8.6],[-40.8,3.3]],"q":[-46.16,20.3,0.997,34.37,10.21]},{"id":"w1281919659","n":"","t":"house","h":8.5,"r":[[-17.0,53.3],[-7.6,59.3],[-3.5,52.9],[-12.9,46.9]],"q":[-10.25,53.1,-0.5681,11.16,7.6]},{"id":"w1362264669","n":"","t":"house","h":8.0,"r":[[-18.8,-4.9],[-13.0,-1.1],[-10.5,-5.0],[-16.3,-8.8]],"q":[-14.65,-4.95,-0.58,6.98,4.63]},{"id":"w1362264671","n":"","t":"house","h":8.0,"r":[[-39.9,-20.9],[-36.2,-18.5],[-31.2,-25.9],[-34.9,-28.4]],"q":[-35.57,-23.42,0.9766,9.01,4.47]},{"id":"w1362264672","n":"","t":"house","h":6.5,"r":[[-34.8,-19.1],[-31.5,-16.9],[-28.6,-21.2],[-31.9,-23.4]],"q":[-31.7,-20.15,0.9774,5.21,3.97]},{"id":"w1362264673","n":"","t":"house","h":7.5,"r":[[-48.3,-6.6],[-44.5,-4.2],[-41.9,-8.1],[-45.7,-10.5]],"q":[-45.1,-7.35,0.9828,4.8,4.49]},{"id":"w1362264677","n":"","t":"house","h":7.0,"r":[[40.1,-41.2],[48.2,-39.7],[50.2,-50.3],[42.2,-51.9]],"q":[45.19,-45.76,1.377,10.9,8.24]}],"torii":[[[-14.9,-25.2],[-18.0,-20.4]],[[-19.0,-14.8],[-21.3,-11.4]],[[-24.4,-8.2],[-26.6,-4.8]],[[-29.3,2.7],[-30.9,5.0]],[[29.7,-37.7],[32.5,-37.0]],[[15.2,-44.0],[18.9,-43.9]],[[7.8,-44.9],[10.3,-44.9]],[[-20.1,-43.4],[-17.3,-43.5]]],"steps":[[[44.1,61.3],[13.7,54.0]]]},"HIE":{"prec":[[96.5,-38.3],[98.2,-33.0],[91.4,-16.7],[79.9,23.7],[75.3,38.5],[72.5,47.0],[57.6,57.2],[41.9,58.8],[41.2,102.6],[35.6,103.2],[0.5,90.4],[-22.3,77.8],[-46.6,62.8],[-60.4,55.3],[-75.3,34.6],[-76.5,29.0],[-85.1,-11.0],[-85.7,-26.7],[-84.9,-38.8],[-78.8,-60.6],[-73.5,-70.8],[-67.8,-76.8],[-61.6,-79.3],[-54.9,-81.3],[-47.4,-81.8],[-31.7,-81.7],[-16.9,-80.7],[14.6,-72.6],[27.0,-68.9],[39.6,-64.9],[83.5,-44.5]],"core":[[-53.7,-60.6],[-55.5,-58.3],[-56.3,-47.8],[-49.4,8.3],[-48.6,10.0],[-9.7,42.9],[27.2,45.3],[55.5,44.9],[57.6,44.0],[58.5,42.2],[59.8,26.3],[23.0,-39.6],[19.2,-41.9],[-34.5,-59.0]],"bld":[{"id":"w145497911","n":"宝物殿","t":"religious","h":7.5,"r":[[40.2,40.3],[55.5,41.9],[57.0,27.5],[41.6,26.1]],"q":[48.56,33.9,-0.1038,15.46,14.48]},{"id":"w145497912","n":"","t":"religious","h":9.5,"r":[[-24.7,-36.0],[-10.4,-34.7],[-9.6,-43.4],[-23.9,-44.7]],"q":[-17.15,-39.7,-0.0907,14.37,8.74]},{"id":"w145497922","n":"","t":"house","h":8.0,"r":[[-6.6,23.4],[-1.7,23.8],[-1.3,19.0],[-6.2,18.6]],"q":[-3.95,21.2,-0.0815,4.92,4.82]},{"id":"w145497929","n":"","t":"apartment","h":11.5,"r":[[-53.3,-48.2],[-35.9,-47.0],[-35.4,-56.1],[-52.5,-57.8]],"q":[-44.21,-52.28,-0.0831,17.44,9.63]},{"id":"w145497934","n":"","t":"shed","h":3.5,"r":[[-7.4,-34.5],[4.4,-33.3],[5.3,-43.2],[-6.4,-44.3]],"q":[-1.0,-38.84,-0.1013,11.86,9.94]},{"id":"w509411446","n":"","t":"apartment","h":10.0,"r":[[3.3,-23.8],[16.6,-22.3],[17.5,-32.1],[20.3,-31.8],[20.9,-37.5],[18.2,-37.9],[18.3,-39.0],[5.3,-40.4]],"q":[12.19,-31.24,1.4585,16.79,16.0]},{"id":"w509411452","n":"","t":"house","h":8.5,"r":[[21.2,27.2],[28.4,27.9],[29.4,19.5],[21.9,18.8]],"q":[25.26,23.36,1.4777,8.46,7.53]},{"id":"w509411453","n":"神門","t":"apartment","h":10.0,"r":[[20.7,18.5],[30.4,19.5],[32.4,0.5],[22.7,-0.6]],"q":[26.55,9.46,1.4665,19.2,9.76]},{"id":"w509411454","n":"","t":"commercial","h":24.5,"r":[[-6.9,-16.8],[-5.6,-16.6],[-6.0,-11.6],[3.3,-10.7],[3.4,-11.4],[25.4,-9.1],[24.4,-0.6],[31.1,0.0],[32.6,-15.4],[3.6,-18.6],[3.7,-19.3],[-4.9,-20.2],[-4.9,-19.6],[-6.5,-19.9]],"q":[12.33,-10.18,-0.1341,39.92,15.76]},{"id":"w509411455","n":"山王夢御殿","t":"religious","h":8.5,"r":[[-38.7,-9.0],[-30.8,-8.1],[-30.5,-11.3],[-20.8,-10.4],[-20.9,-8.2],[-7.8,-6.8],[-7.7,-8.5],[-6.5,-8.4],[-5.7,-16.5],[-7.1,-16.7],[-6.5,-21.3],[-37.4,-24.3]],"q":[-22.07,-15.03,-0.0968,32.31,15.49]},{"id":"w509411457","n":"本殿","t":"religious","h":7.5,"r":[[-46.4,7.9],[-37.3,8.9],[-37.1,8.3],[-34.9,8.5],[-35.5,14.2],[-33.1,14.3],[-33.4,18.0],[-24.1,18.8],[-23.7,16.3],[-12.5,17.3],[-11.9,12.8],[-9.1,13.1],[-8.8,10.0],[-8.3,10.0],[-7.7,2.6],[-8.2,2.5],[-8.0,-1.5],[-10.6,-1.7],[-10.2,-6.2],[-21.5,-7.2],[-21.4,-9.9],[-30.1,-10.8],[-30.4,-6.6],[-33.9,-7.0],[-34.4,-1.3],[-36.1,-1.5],[-36.1,-2.3],[-45.4,-3.3]],"q":[-26.91,4.03,-0.089,38.14,28.98]},{"id":"w1302172012","n":"","t":"office","h":21.0,"r":[[-8.7,40.1],[-6.6,39.3],[27.2,42.3],[28.4,28.2],[-7.2,24.8]],"q":[9.92,34.16,-0.0952,35.95,15.37]}],"torii":[[[75.3,12.8],[74.7,19.1]],[[-99.8,9.2],[-96.9,19.7]],[[-19.6,-31.0],[-14.0,-30.5]]],"inari":[[-63.4,-39.1],[-79.2,-20.5],[-81.9,-13.9],[-83.9,-15.0],[-84.7,-20.4],[-87.0,-20.7]],"otoko":[[41.1,11.4],[55.2,12.7],[77.7,16.0],[86.1,17.3]],"nishi":[[-77.7,31.0],[-74.9,32.1],[-56.8,55.7],[-38.5,63.9],[-26.6,67.9],[-14.5,69.7]]},"EDO":{"box":[[-87.0,14.1],[71.7,51.8],[75.1,35.3],[70.9,34.4],[78.8,0.9],[83.5,1.8],[87.1,-13.7],[-71.6,-52.2],[-75.2,-36.2],[-70.1,-34.8],[-78.2,-1.5],[-83.1,-3.0]],"pod":[[-182.5,15.1],[-28.5,47.9],[-28.2,46.4],[-11.4,48.8],[20.2,51.7],[60.0,52.4],[69.2,51.2],[71.7,51.8],[82.8,2.6],[107.1,0.7],[103.8,-28.9],[50.6,-24.4],[-17.5,-40.7],[-15.3,-50.3],[-3.7,-56.7],[-8.1,-62.8],[-14.0,-66.5],[-20.5,-68.0],[-27.7,-67.3],[-34.2,-64.1],[-26.1,-53.2],[-28.6,-43.7],[-71.4,-53.8],[-62.5,-94.6],[-108.0,-105.3],[-119.7,-51.1],[-138.6,-55.7],[-138.8,-54.0],[-164.3,-59.9],[-176.0,-13.3],[-127.6,-1.5],[-129.2,6.1],[-177.3,-6.0]]},"KOKU":{"ring":[[-57.4,17.5],[-51.6,18.9],[-52.7,23.8],[-44.0,37.4],[25.2,54.7],[39.9,46.0],[56.7,-22.5],[47.4,-37.1],[-21.2,-53.4],[-35.8,-44.4],[-37.0,-40.1],[-43.1,-41.6]]},"KACHI":{"decks":[{"c":4,"p":[[70.8,101.1],[56.1,81.3],[41.3,61.5],[26.5,41.6],[11.7,21.8],[-3.0,2.0],[-17.8,-17.9],[-32.6,-37.7],[-47.4,-57.5],[-62.1,-77.3],[-76.9,-97.2]],"e":[0.6,3.6,6.6,9.0,9.0,9.0,9.0,9.0,6.6,3.6,0.6]},{"c":4,"p":[[-70.2,-101.1],[-55.4,-81.4],[-40.7,-61.7],[-25.9,-41.9],[-11.1,-22.2],[3.6,-2.4],[18.4,17.3],[33.1,37.0],[47.9,56.8],[62.7,76.5],[77.4,96.3]],"e":[0.6,3.6,6.6,9.0,9.0,9.0,9.0,9.0,6.6,3.6,0.6]},{"c":12,"p":[[-82.2,-91.4],[-67.4,-71.7],[-52.6,-52.0],[-37.7,-32.3],[-22.9,-12.6],[-8.1,7.1],[6.7,26.7],[21.5,46.4],[36.3,66.1],[51.1,85.8],[65.9,105.5]],"e":[0.6,3.6,6.6,9.0,9.0,9.0,9.0,9.0,6.6,3.6,0.6]},{"c":12,"p":[[-64.1,-104.8],[-49.3,-85.0],[-34.6,-65.2],[-19.8,-45.4],[-5.0,-25.6],[9.7,-5.8],[24.5,13.9],[39.3,33.7],[54.0,53.5],[68.8,73.3],[83.6,93.1]],"e":[0.6,3.6,6.6,9.0,9.0,9.0,9.0,9.0,6.6,3.6,0.6]}]},"EITAI":{"decks":[{"c":12,"p":[[93.9,35.7],[70.2,29.5],[46.6,23.3],[23.0,17.1],[-0.6,10.9],[-24.2,4.7],[-47.9,-1.5],[-71.5,-7.8],[-95.1,-14.0]],"e":[0.6,3.6,6.5,9.0,9.0,9.0,6.5,3.6,0.6]},{"c":12,"p":[[-87.4,-34.0],[-64.9,-28.1],[-42.4,-22.2],[-20.0,-16.2],[2.5,-10.3],[25.0,-4.4],[47.5,1.5],[69.9,7.4],[92.4,13.3]],"e":[0.6,3.4,6.2,9.0,9.0,9.0,6.2,3.4,0.6]},{"c":4,"p":[[-88.7,-26.7],[-66.1,-21.0],[-43.4,-15.2],[-20.8,-9.4],[1.9,-3.7],[24.5,2.1],[47.1,7.9],[69.8,13.6],[92.4,19.4]],"e":[0.6,3.4,6.2,9.0,9.0,9.0,6.2,3.4,0.6]},{"c":4,"p":[[90.2,27.6],[67.6,21.8],[45.1,16.0],[22.5,10.1],[-0.0,4.3],[-22.6,-1.5],[-45.2,-7.3],[-67.7,-13.1],[-90.3,-19.0]],"e":[0.6,3.4,6.2,9.0,9.0,9.0,6.2,3.4,0.6]}]},"KIYO":{"decks":[{"c":6,"p":[[-78.8,-50.5],[-59.1,-37.9],[-39.4,-25.3],[-19.7,-12.6],[0.0,-0.0],[19.7,12.6],[39.4,25.2],[59.1,37.8],[78.8,50.4]],"e":[0.6,3.4,6.3,9.0,9.0,9.0,6.3,3.4,0.6]},{"c":12,"p":[[72.7,59.9],[53.0,47.3],[33.3,34.7],[13.6,22.1],[-6.1,9.4],[-25.8,-3.2],[-45.5,-15.8],[-65.2,-28.4],[-84.9,-41.0]],"e":[0.6,3.4,6.3,9.0,9.0,9.0,6.3,3.4,0.6]},{"c":12,"p":[[85.0,40.9],[65.3,28.3],[45.6,15.6],[25.9,3.0],[6.2,-9.6],[-13.5,-22.2],[-33.2,-34.8],[-52.9,-47.4],[-72.6,-60.1]],"e":[0.6,3.4,6.3,9.0,9.0,9.0,6.3,3.4,0.6]}]},"HAMA":{"keep":[[-345.3,96.9],[-203.2,201.6],[-43.1,310.0],[246.8,123.4],[241.3,120.2],[245.9,116.9],[250.8,120.9],[303.8,86.6],[379.2,17.2],[343.9,-15.5],[331.9,-4.7],[315.6,-19.3],[327.1,-31.0],[82.8,-257.5],[-40.9,-366.4]],"water":[[[6.7,-124.3],[8.8,-117.5],[16.8,-107.3],[33.3,-95.8],[51.8,-79.4],[53.4,-82.2],[61.8,-77.0],[63.8,-80.4],[67.8,-77.9],[65.9,-74.6],[72.2,-70.3],[125.5,-17.9],[133.7,-25.8],[82.5,-77.0],[72.7,-85.3],[70.6,-82.3],[66.5,-85.4],[68.7,-89.1],[11.9,-143.2],[72.8,-238.7],[67.1,-243.7],[58.4,-232.0],[49.0,-237.7],[22.4,-201.8],[-8.3,-155.7],[-11.0,-147.5],[-16.4,-142.2],[-2.4,-129.3]],[[20.7,51.0],[25.1,53.2],[40.7,54.8],[47.6,53.7],[63.4,44.8],[71.1,42.6],[76.9,43.0],[86.5,47.2],[90.9,53.2],[93.4,51.6],[97.5,50.8],[102.8,53.4],[104.2,54.8],[110.5,47.2],[116.1,47.4],[121.1,49.9],[125.1,51.0],[134.1,44.6],[139.6,43.0],[155.2,43.9],[161.4,42.1],[169.5,37.7],[181.4,23.8],[185.9,22.7],[196.9,27.5],[201.3,26.6],[204.8,27.8],[207.7,30.4],[210.1,37.3],[212.9,40.8],[216.9,40.6],[229.5,32.4],[227.0,30.0],[228.8,20.2],[223.9,9.2],[214.5,1.2],[209.8,-10.8],[206.3,-15.7],[200.6,-18.5],[195.1,-18.7],[187.4,-15.7],[189.2,-12.5],[187.5,-9.6],[180.2,-6.3],[172.0,-1.0],[168.7,2.9],[163.6,5.0],[148.8,14.0],[143.8,13.4],[143.4,11.1],[144.9,9.8],[143.6,7.6],[133.2,14.0],[115.6,15.1],[96.4,17.6],[91.4,13.3],[91.0,10.9],[92.9,7.4],[79.3,13.6],[73.8,13.4],[70.7,10.9],[70.0,8.5],[71.8,5.6],[70.5,3.6],[51.5,8.7],[47.3,8.2],[36.5,3.4],[33.5,6.0],[36.8,10.0],[35.4,13.6],[31.1,17.1],[14.7,20.4],[7.0,20.9],[2.2,24.4],[5.9,34.8],[13.0,38.8],[16.1,45.7]],[[-289.0,70.6],[-279.7,70.3],[-276.2,77.7],[-267.5,81.8],[-264.8,89.0],[-256.2,85.1],[-255.7,78.4],[-258.7,75.2],[-255.6,70.8],[-239.2,73.3],[-215.8,68.5],[-222.7,66.0],[-222.0,61.4],[-218.7,57.9],[-213.5,57.2],[-213.0,52.3],[-204.4,44.2],[-207.4,40.9],[-208.3,35.2],[-214.6,34.0],[-219.1,27.2],[-218.4,21.0],[-207.9,19.0],[-206.6,13.2],[-222.8,17.0],[-227.6,13.7],[-231.3,16.1],[-237.8,14.3],[-242.5,7.4],[-247.0,9.4],[-249.6,14.7],[-254.1,13.7],[-272.7,21.0],[-286.3,39.7],[-295.2,47.1],[-300.8,57.8],[-295.5,66.3],[-292.8,69.1]],[[237.4,119.0],[238.7,117.6],[240.5,119.5],[245.3,116.1],[243.6,114.2],[246.0,112.5],[241.4,106.9],[243.1,105.5],[239.1,101.9],[236.6,101.7],[227.5,96.2],[225.1,99.2],[228.3,103.7],[228.4,108.6]],[[-150.8,176.3],[-150.4,182.1],[-144.7,188.7],[-136.8,192.4],[-131.9,197.1],[-132.6,212.1],[-129.2,217.3],[-116.3,219.9],[-113.9,219.4],[-110.5,215.9],[-107.0,218.4],[-109.7,223.4],[-103.3,226.3],[-100.6,223.9],[-91.0,229.7],[-85.6,229.6],[-79.3,227.4],[-75.8,223.7],[-69.8,214.6],[-67.6,209.7],[-66.9,205.5],[-63.9,200.9],[-59.5,197.8],[-56.6,193.8],[-53.1,193.8],[-51.3,195.5],[-46.9,194.4],[-43.0,191.6],[-37.2,194.7],[-34.8,198.6],[-27.5,204.9],[-13.4,204.9],[-8.1,209.5],[-3.1,215.2],[2.9,217.2],[11.9,216.4],[16.7,220.8],[21.1,219.5],[25.1,214.4],[34.1,211.5],[46.3,202.9],[48.0,198.9],[48.2,194.9],[49.6,192.5],[54.4,190.7],[63.2,191.8],[69.2,188.5],[81.7,177.4],[83.9,171.0],[83.4,164.1],[82.8,159.5],[78.4,148.0],[79.7,141.1],[82.6,137.5],[87.6,139.3],[97.6,144.9],[107.9,151.9],[115.4,154.4],[121.5,153.0],[127.1,149.1],[131.7,143.5],[137.4,138.2],[150.9,131.4],[159.4,128.9],[179.9,124.9],[188.5,121.4],[196.9,112.1],[200.4,100.3],[211.2,94.2],[218.7,94.8],[221.0,91.7],[199.3,86.9],[195.1,84.0],[187.4,75.8],[183.0,74.5],[175.1,75.4],[165.6,79.8],[150.6,91.1],[122.9,99.2],[116.9,99.9],[112.8,103.2],[111.2,106.8],[113.6,117.9],[113.6,126.0],[110.5,127.8],[107.2,126.0],[99.3,117.0],[87.9,113.9],[75.1,119.2],[60.3,127.6],[52.8,135.8],[51.7,140.9],[53.5,148.4],[52.4,152.6],[43.4,149.3],[34.3,151.0],[25.8,159.2],[9.3,199.5],[6.6,202.6],[3.1,203.5],[-0.4,200.4],[-5.1,194.4],[-11.4,191.8],[-18.7,190.2],[-25.1,190.9],[-30.2,189.3],[-33.7,185.6],[-37.9,183.1],[-41.4,178.7],[-41.4,172.5],[-37.0,164.3],[-24.4,147.1],[-19.4,136.9],[-19.1,129.1],[-23.6,127.1],[-23.1,122.1],[-16.5,122.1],[-15.9,111.6],[-17.2,106.6],[-33.7,104.6],[-43.4,100.3],[-57.9,91.9],[-68.5,83.5],[-78.8,77.6],[-100.6,53.0],[-109.0,42.6],[-111.9,36.6],[-115.9,9.8],[-111.0,2.0],[-108.9,-6.6],[-116.1,-12.5],[-130.7,-5.1],[-134.1,-0.2],[-130.3,12.2],[-119.5,11.0],[-116.1,45.4],[-119.1,55.0],[-126.0,63.6],[-135.2,78.6],[-143.1,88.6],[-147.6,92.0],[-152.6,97.9],[-154.6,103.7],[-154.4,110.7],[-152.8,115.4],[-146.9,119.8],[-143.8,123.6],[-143.1,130.5],[-148.8,136.2],[-156.6,134.0],[-170.0,134.4],[-171.8,149.9],[-170.2,158.1],[-164.3,168.3],[-154.6,170.1]]],"isl":[],"forest":[[[77.7,-259.5],[1.5,-330.0],[-4.5,-323.0],[63.6,-265.5],[59.1,-258.9],[69.7,-250.0]],[[-132.7,-168.5],[-111.2,-163.2],[-101.4,-163.6],[-96.3,-162.5],[-89.5,-156.9],[-75.3,-154.1],[-73.3,-157.1],[-73.8,-159.6],[-77.8,-161.6],[-90.6,-163.5],[-94.1,-166.1],[-94.9,-171.9],[-85.0,-189.5],[-80.8,-192.5],[-77.0,-191.8],[-66.4,-181.4],[-61.3,-183.1],[-59.2,-186.5],[-60.2,-191.1],[-72.2,-203.6],[-73.1,-209.0],[-72.9,-212.6],[-71.9,-214.0],[-55.5,-218.4],[-50.9,-220.3],[-48.7,-223.6],[-46.8,-233.4],[-45.1,-253.5],[-41.9,-258.2],[-21.3,-268.5],[-21.2,-273.5],[-27.9,-281.3],[-33.7,-276.2],[-47.8,-274.6],[-62.9,-280.1],[-68.0,-276.7],[-75.1,-262.3],[-91.8,-269.3],[-74.9,-295.2],[-70.6,-292.5],[-56.0,-317.9],[-35.3,-301.9],[-21.8,-314.9],[-57.0,-340.5],[-167.5,-172.0],[-159.4,-166.8],[-149.7,-177.1],[-143.4,-173.1]],[[-146.6,-135.0],[-139.9,-134.0],[-138.4,-134.6],[-135.4,-137.9],[-132.7,-138.2],[-126.9,-130.9],[-120.6,-130.5],[-116.4,-127.5],[-109.3,-118.9],[-95.1,-109.4],[-86.2,-100.2],[-77.7,-99.3],[-71.6,-96.1],[-70.2,-96.5],[-65.2,-104.2],[-55.0,-114.9],[-58.4,-125.5],[-58.1,-130.7],[-59.7,-133.3],[-62.4,-133.8],[-70.9,-132.2],[-73.0,-130.0],[-75.8,-120.1],[-78.3,-119.2],[-92.9,-139.6],[-93.0,-141.1],[-90.0,-146.6],[-90.1,-149.3],[-91.0,-150.8],[-94.4,-152.6],[-106.7,-152.8],[-112.2,-154.6],[-117.0,-158.1],[-126.5,-159.9],[-134.3,-162.8],[-137.9,-162.6],[-150.3,-144.3],[-149.9,-139.3]],[[70.0,24.2],[54.4,24.1],[54.7,31.6],[68.7,32.0],[72.6,28.1]],[[-249.9,57.9],[-237.1,49.9],[-236.7,42.7],[-238.2,38.3],[-246.1,36.3],[-257.7,42.9],[-260.4,42.5],[-262.4,48.1],[-260.3,55.4],[-254.3,58.7]],[[-2.2,277.4],[-5.1,276.0],[-7.2,276.1],[-13.6,278.7],[-15.3,277.9],[-21.5,269.6],[-25.4,268.5],[-28.0,268.8],[-35.0,272.3],[-42.9,282.7],[-51.0,278.4],[-48.3,272.6],[-51.2,266.3],[-74.0,267.0],[-78.1,268.6],[-84.4,266.4],[-97.4,253.9],[-119.7,222.1],[-123.3,221.9],[-129.4,219.6],[-132.2,216.5],[-134.2,211.9],[-133.8,199.1],[-151.9,186.8],[-156.0,187.1],[-160.9,181.9],[-160.1,173.1],[-169.0,167.6],[-172.8,160.4],[-173.7,150.9],[-172.2,135.6],[-174.2,117.9],[-169.4,115.3],[-166.2,107.9],[-165.6,101.1],[-166.0,92.2],[-163.5,85.8],[-153.2,77.4],[-149.3,69.9],[-151.5,63.5],[-159.5,54.6],[-163.1,49.4],[-156.6,46.7],[-136.2,43.9],[-128.8,41.9],[-125.8,36.1],[-124.3,27.8],[-118.7,25.2],[-120.2,12.9],[-130.7,14.0],[-171.4,-2.3],[-177.9,-5.7],[-168.0,-21.5],[-160.4,-16.7],[-147.7,-35.7],[-157.5,-41.9],[-174.4,-27.6],[-191.0,-36.0],[-193.7,-38.9],[-195.6,-48.2],[-196.8,-49.8],[-214.6,-46.2],[-218.4,-46.8],[-221.9,-48.4],[-225.0,-51.5],[-227.1,-62.5],[-226.8,-65.8],[-225.4,-68.4],[-218.4,-71.9],[-214.2,-75.3],[-206.4,-92.2],[-195.7,-99.3],[-194.0,-102.3],[-194.5,-112.6],[-192.9,-114.4],[-187.7,-117.4],[-180.1,-119.0],[-178.4,-118.2],[-176.0,-114.0],[-174.5,-112.7],[-169.6,-113.5],[-167.2,-114.7],[-156.5,-127.6],[-162.4,-131.1],[-158.4,-138.4],[-181.5,-152.6],[-344.7,96.9],[-43.4,308.4],[-2.3,280.9]],[[288.9,-32.9],[296.8,-21.9],[317.5,-37.7],[84.7,-252.6],[77.7,-242.6],[130.6,-194.0],[191.6,-140.0],[237.3,-93.7]],[[-107.3,-7.9],[-108.9,-0.0],[-114.9,10.3],[-111.3,35.5],[-108.6,42.1],[-101.8,49.5],[-88.6,34.6],[-82.3,33.9],[-80.2,34.4],[-75.4,36.7],[-43.4,67.8],[-39.4,72.5],[-32.6,76.2],[-19.6,79.7],[-13.4,79.5],[-8.0,72.8],[10.3,83.8],[6.5,97.3],[18.2,118.4],[21.3,122.2],[25.8,123.7],[33.5,121.2],[41.4,114.1],[51.9,94.8],[54.7,91.2],[64.5,82.0],[82.5,89.6],[90.6,83.1],[92.6,79.6],[96.1,76.3],[109.1,69.2],[114.4,73.3],[115.9,77.1],[121.0,79.6],[127.8,79.0],[130.7,82.0],[136.0,81.9],[139.6,79.9],[140.2,75.1],[137.5,63.2],[137.3,56.9],[141.4,55.4],[143.3,56.4],[151.7,70.9],[156.2,71.6],[160.5,68.4],[160.7,63.0],[163.0,59.5],[172.1,59.7],[177.6,61.2],[183.9,67.0],[193.0,73.7],[205.1,80.2],[209.9,82.6],[225.9,86.1],[230.6,93.1],[240.0,95.5],[238.6,90.3],[243.4,82.2],[269.2,73.7],[282.9,77.3],[287.5,77.4],[297.1,75.5],[306.2,68.5],[311.6,62.9],[314.8,52.4],[315.3,21.6],[313.0,17.4],[261.4,-23.8],[207.6,-73.7],[185.7,-95.1],[166.1,-74.7],[144.6,-122.9],[142.0,-121.6],[146.4,-106.2],[149.2,-102.6],[146.4,-95.9],[149.5,-90.6],[143.4,-82.0],[146.0,-69.0],[145.3,-58.4],[138.7,-52.6],[133.0,-43.5],[129.1,-33.6],[120.9,-22.9],[72.0,-69.9],[65.4,-72.4],[40.7,-89.3],[36.9,-84.4],[46.4,-80.9],[54.3,-75.7],[57.5,-71.7],[58.9,-67.8],[59.0,-64.9],[53.2,-59.4],[39.1,-57.7],[27.1,-61.0],[14.9,-55.6],[7.6,-54.5],[-4.1,-56.8],[-7.9,-55.9],[-13.8,-50.5],[-23.0,-54.1],[-27.7,-61.1],[-30.1,-69.6],[-34.0,-71.0],[-38.5,-68.7],[-41.7,-61.8],[-44.2,-53.6],[-49.4,-24.2],[-75.6,11.4],[-89.3,0.5],[-91.0,-3.8],[-88.4,-9.4],[-78.8,-18.7],[-73.7,-29.0],[-73.7,-37.4],[-75.3,-43.2],[-108.6,-69.6],[-122.1,-54.2],[-128.8,-37.4],[-136.2,-13.4],[-136.2,-8.8],[-133.3,-6.8],[-118.6,-14.0],[-113.3,-14.2]],[[184.8,2.6],[183.0,7.1],[184.7,10.0],[191.0,9.8],[199.5,7.5],[196.2,0.0]],[[172.2,138.9],[165.7,139.3],[158.0,143.2],[168.6,154.4],[176.6,149.9],[178.5,139.7]],[[165.4,155.7],[155.8,146.5],[154.1,145.8],[152.2,146.0],[150.5,147.3],[142.2,156.7],[143.7,163.5],[145.7,166.5],[147.6,166.1]],[[110.9,166.8],[111.3,161.3],[108.7,154.0],[88.2,141.6],[82.2,141.4],[80.2,143.5],[79.4,147.0],[84.7,162.7],[84.6,174.0],[82.1,178.7],[68.5,191.3],[74.6,195.5],[87.3,189.2],[108.6,171.6]]],"grass":[[[-12.8,-236.2],[-11.4,-236.8],[-9.6,-240.9],[-3.4,-268.0],[-3.8,-269.1],[-7.0,-269.4],[-16.2,-265.2],[-19.3,-261.6],[-16.6,-240.3],[-15.5,-237.4]],[[-19.3,-241.5],[-20.5,-251.8],[-22.4,-260.1],[-23.4,-260.6],[-40.1,-253.8],[-39.5,-251.4],[-20.7,-241.2]],[[-74.0,-161.0],[-72.5,-159.5],[-71.9,-157.5],[-73.1,-153.6],[-75.0,-153.1],[-87.8,-155.5],[-87.8,-154.7],[-82.5,-152.4],[-77.8,-151.6],[-70.3,-151.4],[-68.2,-152.4],[-61.0,-164.5],[-56.6,-178.5],[-52.7,-186.3],[-42.0,-197.1],[-34.8,-200.7],[-29.5,-204.7],[-15.3,-222.0],[-14.1,-225.4],[-14.5,-230.6],[-16.7,-235.3],[-22.9,-239.7],[-33.7,-244.7],[-42.8,-250.3],[-44.0,-250.0],[-47.4,-220.3],[-49.3,-218.4],[-52.7,-217.3],[-66.6,-214.4],[-69.9,-210.9],[-70.9,-208.2],[-70.6,-204.0],[-59.2,-190.7],[-57.7,-185.8],[-57.8,-180.5],[-59.8,-179.2],[-62.7,-179.4],[-63.2,-180.6],[-67.1,-180.9],[-76.7,-190.1],[-78.9,-191.4],[-80.7,-191.3],[-84.2,-188.8],[-93.4,-172.0],[-92.9,-166.6],[-92.1,-165.5],[-90.0,-164.2],[-77.7,-162.4]],[[-56.0,-141.6],[-47.2,-134.4],[-45.1,-129.0],[-42.3,-128.3],[-36.2,-141.0],[-31.4,-145.4],[1.4,-195.2],[3.2,-201.2],[2.6,-207.3],[0.6,-211.1],[-8.2,-220.6],[-10.2,-221.4],[-12.5,-220.4],[-21.9,-207.3],[-26.6,-202.0],[-30.1,-199.2],[-41.6,-192.6],[-46.0,-188.2],[-51.7,-179.9],[-61.9,-152.2]],[[-103.1,-98.6],[-88.1,-89.4],[-81.9,-88.4],[-74.3,-89.3],[-68.3,-91.7],[-46.3,-123.1],[-45.7,-126.0],[-50.9,-135.2],[-58.7,-140.0],[-65.3,-149.0],[-77.3,-149.0],[-88.0,-151.2],[-93.5,-154.7],[-96.0,-157.3],[-99.3,-158.9],[-113.3,-158.9],[-114.8,-157.4],[-111.5,-154.6],[-105.6,-152.8],[-94.4,-152.8],[-90.6,-150.9],[-89.8,-149.5],[-89.6,-146.9],[-92.7,-140.4],[-92.2,-138.8],[-78.9,-120.2],[-76.4,-120.3],[-73.5,-130.0],[-71.0,-132.4],[-61.7,-134.2],[-58.6,-132.8],[-57.9,-130.8],[-58.1,-125.6],[-54.7,-114.6],[-56.8,-111.7],[-64.5,-104.1],[-70.5,-95.5],[-71.6,-95.4],[-79.2,-99.2],[-85.7,-99.3],[-95.4,-109.0],[-109.0,-118.0],[-118.7,-128.4],[-120.8,-130.1],[-127.0,-130.4],[-133.1,-137.6],[-135.6,-137.3],[-138.4,-134.0],[-141.6,-133.7],[-146.1,-134.5],[-146.5,-133.8],[-139.7,-127.6],[-120.3,-112.0]],[[-103.5,-88.0],[-104.0,-93.6],[-107.7,-97.6],[-145.4,-127.7],[-148.8,-128.4],[-150.7,-127.9],[-159.3,-119.5],[-110.5,-79.4],[-104.6,-86.0]],[[-215.4,-47.2],[-197.4,-51.4],[-195.0,-50.0],[-192.3,-39.7],[-174.1,-28.8],[-157.3,-43.1],[-140.6,-32.5],[-126.0,-62.2],[-114.6,-76.5],[-161.7,-112.0],[-167.3,-113.2],[-175.2,-111.8],[-178.1,-117.1],[-181.0,-117.9],[-184.2,-117.5],[-191.6,-113.9],[-192.9,-111.5],[-193.3,-106.9],[-192.4,-103.9],[-194.3,-99.0],[-197.9,-95.3],[-203.3,-92.8],[-205.7,-90.1],[-208.0,-86.6],[-213.0,-74.3],[-215.9,-71.4],[-219.6,-70.1],[-225.2,-66.6],[-225.5,-59.2],[-224.1,-54.1],[-218.5,-48.8]],[[-54.6,-62.7],[-61.5,-67.3],[-64.6,-68.0],[-67.8,-66.0],[-68.4,-61.9],[-65.9,-52.7],[-64.4,-51.3],[-59.7,-50.8],[-55.5,-53.1],[-52.7,-56.4]],[[-87.6,-8.9],[-90.0,-3.4],[-88.8,-0.3],[-86.1,0.9],[-81.3,0.7],[-65.5,-26.2],[-63.8,-33.1],[-63.2,-41.0],[-65.0,-45.7],[-73.3,-49.4],[-76.1,-51.6],[-102.7,-79.3],[-109.2,-70.8],[-74.3,-43.3],[-72.2,-40.1],[-73.4,-28.1],[-78.8,-17.9]],[[-55.4,66.4],[-55.4,64.7],[-61.1,62.0],[-63.3,61.9],[-64.6,63.3],[-62.0,69.5]],[[-87.2,65.1],[-75.7,76.0],[-71.4,70.9],[-75.1,65.8],[-83.1,61.8]],[[-45.1,82.4],[-38.1,83.1],[-43.1,75.6],[-47.6,67.0],[-50.1,66.6],[-61.3,71.0],[-60.7,73.1],[-56.1,76.8]],[[-39.0,100.9],[-16.9,106.1],[-15.0,111.7],[-16.0,122.3],[-20.4,122.7],[-21.2,127.3],[-18.5,128.3],[-18.9,137.1],[-24.5,147.9],[-35.2,162.6],[-40.6,172.9],[-40.2,179.2],[-38.0,181.3],[-32.6,184.3],[-28.4,185.0],[-21.5,169.3],[-17.1,148.2],[-10.0,120.2],[-9.4,111.6],[-10.5,106.9],[-14.7,101.3],[-19.6,98.0],[-26.4,94.9],[-28.9,94.1],[-31.3,98.9],[-42.2,94.0],[-40.0,89.2],[-52.1,82.8],[-66.9,72.4],[-68.3,72.2],[-73.9,79.2],[-65.4,84.1],[-59.2,89.4],[-45.4,98.1]],[[-16.0,163.0],[0.5,144.6],[-0.3,141.4],[-8.7,128.0],[-9.8,128.8],[-12.0,136.4],[-17.8,159.9],[-17.6,162.5]],[[-27.5,212.2],[-27.1,209.5],[-29.5,204.6],[-32.3,204.3],[-37.7,211.7],[-38.5,214.0],[-33.2,218.9]],[[-102.0,240.0],[-98.7,240.2],[-90.2,236.0],[-72.1,230.8],[-51.7,220.7],[-41.0,212.1],[-34.5,200.5],[-40.1,195.3],[-43.6,194.6],[-48.0,196.9],[-50.2,197.2],[-53.1,194.9],[-55.7,194.5],[-59.7,200.0],[-65.0,203.6],[-65.4,207.8],[-67.5,213.1],[-74.7,223.7],[-77.9,226.9],[-84.3,229.5],[-93.4,230.3],[-101.5,227.4],[-108.5,226.8],[-110.1,223.4],[-108.4,219.7],[-111.3,217.3],[-113.9,219.8],[-112.4,224.9],[-105.2,236.8]],[[-34.4,249.6],[-29.9,249.0],[-14.5,239.0],[0.0,237.0],[17.0,229.0],[-0.4,225.4],[-11.6,224.6],[-22.3,222.0],[-27.9,222.1],[-32.0,223.2],[-33.4,224.5],[-34.8,231.9],[-39.2,236.8],[-43.0,235.4],[-39.2,231.0],[-34.9,222.3],[-34.9,220.4],[-40.7,216.0],[-41.9,216.2],[-48.4,221.8],[-70.8,233.0],[-71.0,234.4],[-66.1,237.0]],[[-67.5,256.9],[-65.5,257.5],[-58.4,253.9],[-56.4,255.5],[-57.0,259.3],[-56.5,261.0],[-54.4,262.5],[-51.0,261.7],[-41.0,256.8],[-37.4,254.4],[-36.9,252.9],[-38.2,251.0],[-76.9,235.8],[-79.4,235.8],[-85.6,237.5],[-97.2,243.7],[-82.8,258.2],[-77.0,259.3],[-73.0,257.2]],[[-25.0,267.1],[-20.3,268.6],[-15.5,275.0],[-13.3,276.6],[-4.3,274.6],[-3.4,273.2],[-7.3,267.9],[-20.9,260.2],[-31.3,255.4],[-33.7,255.8],[-38.4,260.2],[-46.3,265.0],[-42.0,274.6],[-39.8,275.3],[-38.3,274.6],[-35.7,270.7],[-31.9,268.2]],[[1.4,-226.4],[5.2,-229.0],[7.7,-232.0],[9.7,-237.6],[1.1,-247.6],[-3.4,-249.2],[-7.5,-234.9],[-8.0,-229.6],[-7.1,-227.7],[-5.0,-226.1]],[[87.7,-220.2],[95.9,-217.4],[84.4,-228.4],[82.2,-228.5],[76.1,-217.6],[76.6,-212.4],[86.2,-219.9]],[[98.5,-120.6],[109.5,-137.0],[105.1,-146.9],[102.2,-158.3],[100.2,-162.2],[95.7,-166.9],[74.7,-184.3],[65.4,-195.6],[65.1,-197.2],[66.5,-200.1],[75.3,-209.3],[74.0,-213.3],[72.9,-214.0],[71.1,-213.4],[61.7,-201.8],[59.8,-198.2],[59.3,-194.6],[60.4,-191.9],[57.8,-189.3],[56.0,-193.1],[56.1,-198.6],[76.4,-227.2],[76.7,-233.8],[76.2,-235.4],[73.2,-238.5],[12.9,-143.1],[69.8,-90.1],[77.7,-100.5],[85.2,-106.3]],[[161.3,-146.6],[157.3,-143.1],[145.2,-123.0],[164.9,-79.1],[183.2,-96.8],[169.9,-115.9],[168.1,-122.6],[165.6,-148.4]],[[210.7,-79.5],[222.6,-64.9],[233.9,-66.2],[238.7,-69.9],[239.7,-72.1],[239.7,-83.9],[202.7,-122.4],[194.5,-114.1],[183.6,-123.5],[192.6,-132.3],[184.1,-142.1],[170.8,-150.1],[172.0,-128.9],[174.7,-118.1],[186.4,-103.6]],[[294.1,-18.3],[268.7,-47.4],[242.2,-80.2],[241.9,-71.6],[240.0,-68.5],[236.8,-66.0],[225.1,-62.4],[277.8,-15.0],[298.9,-2.4],[300.9,-2.4],[301.5,-3.8],[300.4,-7.7]],[[320.9,60.9],[322.4,59.6],[322.9,60.3],[373.9,16.4],[344.1,-13.8],[332.3,-3.3],[328.0,-6.9],[324.6,-3.4],[319.5,8.4],[317.5,15.9],[319.2,43.3],[317.9,57.5]],[[257.9,87.5],[261.2,86.8],[264.1,83.7],[267.2,81.4],[270.3,80.7],[273.1,78.2],[270.9,76.3],[263.8,77.4],[242.8,84.9],[239.1,90.4],[240.9,95.7],[254.1,95.9],[256.5,93.7],[256.3,90.2]],[[281.6,87.1],[275.9,79.4],[264.0,90.3],[257.2,98.2],[246.4,97.7],[242.6,99.4],[250.7,107.4],[255.0,109.7],[257.8,110.1],[286.9,90.2]],[[-2.8,105.7],[2.1,106.9],[6.9,106.9],[7.6,106.2],[3.0,97.9],[-2.3,93.5],[-6.8,93.6],[-12.6,96.2],[-12.5,98.4],[-8.9,102.3]],[[153.5,140.4],[164.5,135.7],[179.6,136.1],[183.3,134.6],[185.2,133.3],[210.2,104.3],[218.9,98.5],[220.0,97.0],[216.4,95.1],[211.3,95.3],[201.6,100.3],[200.4,102.0],[198.1,111.4],[196.7,113.8],[194.0,117.4],[188.6,122.2],[183.0,124.9],[169.7,128.1],[159.4,129.6],[147.1,133.8],[144.8,135.4],[151.7,140.4]],[[-6.5,122.9],[-0.3,122.1],[2.7,126.3],[6.0,121.8],[8.6,122.1],[9.5,123.4],[12.9,122.9],[14.9,124.2],[15.9,128.1],[17.0,129.1],[26.2,124.8],[21.0,122.9],[11.8,111.3],[8.5,109.8],[1.7,108.7],[-4.0,106.9],[-7.3,108.1],[-7.1,121.8]],[[235.3,121.7],[220.3,102.9],[217.3,102.7],[215.4,103.9],[210.4,108.3],[190.2,132.0],[182.5,139.8],[180.3,144.1],[178.9,150.3],[179.3,155.5],[180.5,158.0],[182.1,158.3],[235.0,124.9]],[[1.9,140.3],[5.3,140.1],[14.5,131.7],[14.7,128.9],[13.7,125.0],[11.8,124.5],[9.9,125.2],[3.9,130.6],[2.0,130.0],[2.2,127.4],[-0.5,123.1],[-5.7,125.1],[-6.0,127.1],[-3.4,133.5]],[[-14.4,189.7],[-5.7,192.4],[-2.0,196.2],[1.9,201.3],[4.4,202.1],[6.6,201.7],[8.3,200.0],[11.1,194.3],[18.1,177.7],[20.8,168.4],[25.2,159.0],[30.3,152.3],[33.5,150.1],[39.8,148.5],[51.9,151.2],[52.8,147.1],[50.9,140.0],[52.0,135.6],[57.6,128.8],[64.7,123.3],[79.4,116.5],[87.7,113.5],[90.7,113.6],[99.5,116.3],[101.3,117.6],[107.3,125.4],[109.5,124.9],[110.8,127.0],[113.1,125.9],[113.1,119.6],[109.1,115.8],[94.1,107.1],[72.0,105.8],[68.5,106.4],[52.1,114.2],[32.8,126.1],[20.8,130.3],[4.9,144.2],[-12.1,161.6],[-18.9,170.9],[-26.6,189.6],[-24.6,190.1]],[[123.7,166.7],[148.0,146.0],[149.2,144.2],[148.7,142.4],[141.8,137.0],[136.2,140.8],[130.6,147.1],[121.7,153.8],[115.2,155.2],[111.9,154.5],[110.5,156.1],[112.1,161.8],[112.0,165.4],[109.1,172.8],[95.4,183.8],[94.4,186.2],[99.0,184.3]],[[105.1,191.0],[120.3,179.4],[133.0,165.6],[137.2,159.0],[130.0,163.7],[124.1,169.2],[104.1,185.0],[76.7,198.0],[80.7,199.1],[88.3,198.8]],[[2.2,223.4],[11.6,226.2],[20.1,227.0],[45.6,210.2],[54.1,204.2],[54.9,202.4],[59.9,199.8],[61.4,200.4],[69.4,198.5],[73.6,195.7],[67.2,191.6],[63.5,192.6],[51.9,192.5],[49.6,194.3],[49.3,199.0],[48.3,201.9],[46.4,204.1],[36.8,211.2],[25.8,215.4],[20.9,220.9],[16.2,221.7],[14.6,221.3],[11.6,217.8],[0.6,217.9],[-2.8,216.9],[-10.6,208.7],[-15.3,206.5],[-18.6,206.0],[-25.2,206.6],[-24.0,211.9],[-29.6,217.7],[-30.6,220.4],[-22.2,220.4]],[[-8.5,263.1],[2.5,273.1],[5.2,272.5],[176.1,162.0],[177.5,160.0],[177.3,150.7],[146.0,167.7],[143.9,166.8],[141.1,158.1],[128.2,174.6],[117.2,185.0],[105.9,193.1],[93.4,200.2],[85.3,201.9],[71.8,202.0],[61.2,203.7],[27.4,226.4],[-1.3,240.3],[-10.0,240.6],[-14.8,241.9],[-20.8,244.8],[-27.9,250.0],[-28.0,252.2]]],"flower":[[[84.6,-195.7],[89.1,-192.0],[106.6,-185.5],[110.4,-191.3],[116.9,-197.8],[95.9,-217.3],[87.0,-220.1],[76.7,-212.3],[80.5,-200.9]],[[93.5,-187.8],[85.3,-192.4],[81.2,-196.0],[78.7,-199.8],[75.5,-208.2],[74.3,-208.1],[66.2,-199.6],[65.3,-197.6],[66.3,-194.1],[74.8,-184.3],[92.5,-169.6]],[[101.7,-159.7],[105.2,-147.0],[109.6,-137.1],[114.7,-143.3],[123.3,-147.2],[129.7,-154.1],[118.9,-170.2],[110.9,-178.8],[104.4,-183.5],[95.3,-186.9],[94.2,-169.4],[94.8,-167.8],[100.2,-162.2]],[[118.2,-130.6],[115.0,-126.2],[117.2,-124.6],[120.4,-129.0]],[[115.1,-114.5],[112.7,-111.2],[115.0,-109.5],[117.4,-112.9]],[[121.6,-111.0],[119.6,-112.7],[114.2,-106.1],[116.2,-104.4]],[[114.0,-101.0],[115.6,-103.1],[112.2,-105.7],[113.9,-107.9],[111.5,-109.8],[108.1,-105.4]],[[100.1,-106.8],[96.9,-102.9],[98.8,-101.4],[101.9,-105.4]],[[90.5,-102.0],[99.8,-94.5],[101.6,-96.7],[93.9,-102.8],[98.3,-108.2],[96.7,-109.6]],[[102.6,-98.1],[104.3,-100.5],[106.5,-98.9],[108.1,-101.2],[103.6,-104.5],[100.2,-99.8]],[[118.5,-103.6],[115.4,-99.4],[117.0,-98.1],[120.2,-102.3]],[[107.6,-94.3],[109.6,-93.0],[112.7,-97.5],[109.6,-99.6],[108.0,-97.2],[109.1,-96.4]],[[113.4,-89.9],[114.9,-91.7],[117.7,-89.5],[119.6,-91.8],[114.7,-95.9],[111.2,-91.7]],[[104.6,-97.8],[101.2,-93.5],[113.7,-83.9],[116.9,-88.1],[114.9,-89.6],[113.5,-87.7],[104.8,-94.4],[106.3,-96.4]],[[-124.6,149.3],[-124.4,152.1],[-118.5,151.1],[-115.6,146.5],[-120.8,143.3]],[[-120.6,160.3],[-116.5,154.2],[-118.7,152.9],[-124.1,154.1],[-122.7,163.9],[-119.3,164.4],[-118.3,163.9],[-117.8,162.2]],[[136.2,-147.3],[131.2,-152.6],[124.2,-145.1],[117.2,-142.1],[114.0,-138.4],[139.0,-127.2],[148.6,-139.7],[142.0,-142.8]],[[128.5,-125.1],[126.4,-126.7],[124.7,-124.5],[126.8,-122.9]],[[124.9,-118.3],[126.9,-120.8],[122.4,-124.3],[124.0,-126.4],[122.0,-127.9],[118.4,-123.4]],[[130.2,-123.7],[128.2,-121.2],[131.7,-118.9],[133.4,-121.6]],[[135.2,-123.3],[139.8,-120.5],[138.3,-117.5],[141.5,-115.1],[139.9,-112.6],[144.5,-108.2],[144.9,-106.7],[143.2,-104.3],[147.5,-100.8],[148.7,-102.8],[146.2,-106.0],[141.0,-123.9],[116.5,-135.8],[110.8,-129.1],[113.7,-127.2],[117.8,-132.6],[125.3,-127.4],[126.1,-128.4],[134.3,-122.5]],[[118.6,-119.0],[116.3,-115.6],[118.5,-114.1],[120.8,-117.5]],[[132.5,-112.8],[135.0,-116.1],[132.5,-118.0],[131.5,-116.8],[128.3,-119.2],[126.7,-117.1]],[[120.7,-114.0],[124.1,-111.5],[122.5,-109.4],[124.8,-107.7],[128.0,-112.0],[122.3,-116.2]],[[130.4,-110.1],[125.2,-103.2],[127.5,-101.5],[132.7,-108.3]],[[121.4,-107.2],[119.8,-105.3],[121.9,-103.7],[123.4,-105.6]],[[130.3,-98.4],[128.5,-99.6],[126.4,-96.6],[128.2,-95.4]],[[124.1,-92.1],[126.0,-94.5],[123.8,-96.2],[126.5,-99.6],[123.9,-101.6],[119.3,-95.8]],[[127.2,-93.1],[125.8,-91.2],[128.8,-89.0],[130.2,-90.8]],[[117.0,-84.8],[122.6,-80.3],[124.3,-82.4],[120.3,-85.6],[123.2,-89.2],[121.5,-90.5]],[[126.8,-82.8],[125.9,-81.7],[128.3,-79.9],[131.1,-83.4],[124.9,-88.2],[123.0,-85.8]],[[124.4,-75.3],[127.0,-78.6],[124.6,-80.5],[122.9,-78.3],[116.3,-83.5],[115.4,-82.4]],[[128.8,-159.2],[134.4,-152.7],[143.8,-144.9],[150.6,-142.4],[159.8,-150.2],[165.3,-151.5],[164.3,-154.7],[162.8,-156.8],[118.7,-195.9],[112.1,-190.3],[108.7,-183.6],[117.6,-175.2]],[[135.6,-121.1],[133.9,-118.7],[135.8,-117.3],[137.5,-119.7]],[[137.5,-116.1],[134.3,-111.6],[136.4,-110.1],[139.6,-114.5]],[[143.3,-107.6],[139.1,-110.5],[137.7,-108.4],[141.8,-105.5]],[[134.0,-106.9],[132.5,-104.8],[135.9,-102.3],[137.4,-104.3]],[[139.3,-94.4],[143.4,-99.9],[138.8,-103.3],[137.3,-101.1],[139.5,-99.5],[136.9,-96.1]],[[129.9,-101.2],[133.2,-98.7],[129.9,-94.2],[132.1,-92.6],[137.1,-99.3],[131.5,-103.4]],[[135.7,-94.4],[130.7,-87.6],[133.0,-86.0],[138.0,-92.7]],[[143.2,-94.0],[139.6,-88.9],[144.2,-85.6],[147.8,-90.6]],[[142.9,-83.6],[137.8,-87.0],[136.6,-85.3],[141.7,-81.8]],[[134.7,-83.7],[129.6,-77.2],[132.0,-75.4],[137.0,-82.0]],[[138.6,-80.7],[136.3,-77.5],[138.5,-75.8],[140.9,-79.0]],[[135.5,-71.9],[139.0,-69.6],[141.4,-73.1],[139.3,-74.5],[138.7,-73.6],[137.3,-74.5]],[[131.2,-71.3],[129.3,-68.5],[134.0,-65.5],[135.8,-68.3]],[[137.0,-66.9],[135.6,-64.7],[137.4,-63.5],[138.8,-65.8]]],"paths":[[[-65.6,-151.6],[-58.1,-166.0],[-55.5,-174.8],[-52.9,-181.5],[-48.9,-187.5],[-41.8,-194.3],[-29.9,-201.0],[-24.2,-206.9],[-11.2,-224.6],[-12.0,-233.1],[-16.9,-236.8],[2.4,0]],[[-16.9,-236.8],[-18.3,-242.1],[-18.9,-249.5],[-21.4,-263.0],[-49.3,-254.8],[-41.8,-251.4],[-37.2,-248.1],[-24.4,-241.7],[-16.9,-236.8],[2.4,0]],[[-11.2,-224.6],[-4.6,-221.5],[9.6,-217.3],[2.4,0]],[[70.1,103.9],[93.2,105.1],[101.2,109.1],[113.6,117.9],[2.4,0]],[[153.3,143.4],[146.2,149.7],[139.8,156.5],[136.1,163.3],[127.4,173.9],[117.2,183.5],[110.1,189.0],[103.9,193.0],[89.8,200.1],[84.1,200.6],[76.1,200.1],[58.1,203.1],[46.7,211.6],[37.3,217.9],[13.5,232.2],[-1.7,238.9],[-13.4,239.9],[-23.9,245.4],[-32.4,252.0],[2.4,0]],[[69.3,-84.9],[72.7,-90.0],[79.3,-98.2],[86.1,-104.0],[102.8,-123.0],[114.1,-139.9],[117.1,-143.2],[122.2,-144.9],[125.1,-147.1],[130.8,-154.0],[121.1,-168.9],[110.5,-181.0],[104.4,-185.2],[94.5,-188.3],[86.1,-192.5],[79.9,-200.5],[76.9,-207.8],[74.7,-217.1],[74.7,-221.1],[79.0,-227.8],[82.8,-232.8],[168.4,-154.2],[2.4,0]],[[7.5,-202.7],[3.7,-192.8],[-6.0,-179.5],[-26.7,-148.0],[-34.4,-137.6],[-42.5,-124.1],[2.4,0]],[[-148.2,-172.2],[-155.7,-162.9],[-163.9,-150.7],[-163.2,-143.9],[-146.9,-131.7],[-102.9,-96.3],[-94.5,-91.2],[-76.6,-77.9],[2.4,0]],[[110.8,96.2],[89.4,97.3],[78.9,99.7],[70.1,103.9],[66.1,106.3],[56.7,110.6],[29.9,125.8],[19.9,129.3],[13.0,135.0],[-4.4,150.9],[-16.1,164.6],[-18.5,165.7],[-28.0,190.0],[2.4,0]],[[74.9,-240.2],[82.8,-232.8],[2.4,0]],[[-148.2,-172.2],[-132.3,-200.1],[-117.3,-221.9],[-109.0,-235.6],[-91.5,-260.2],[-85.1,-268.0],[-75.5,-281.4],[-44.6,-300.9],[-31.1,-288.9],[2.4,0]],[[-94.5,-91.2],[-114.8,-71.2],[-123.3,-60.5],[-131.6,-41.7],[-137.8,-31.4],[2.4,0]],[[241.1,-84.3],[240.4,-81.8],[240.4,-79.0],[241.2,-75.1],[240.9,-72.2],[239.6,-69.9],[234.7,-65.6],[222.1,-62.6],[205.7,-81.9],[201.0,-83.9],[178.3,-108.1],[171.5,-116.6],[169.8,-123.2],[167.5,-149.3],[166.9,-150.2],[168.4,-154.2],[179.5,-147.8],[193.1,-137.4],[203.0,-127.2],[210.5,-117.5],[234.3,-93.6],[241.1,-84.3],[2.4,0]],[[241.1,-84.3],[245.1,-78.7],[259.8,-61.0],[296.3,-18.8],[298.6,-14.9],[312.6,0.3],[315.8,18.5],[2.4,0]],[[16.2,-287.4],[-0.5,-285.2],[-1.9,-283.2],[-0.7,-274.5],[-6.4,-245.3],[-9.3,-236.4],[-12.0,-233.1],[2.4,0]],[[-76.6,-77.9],[-65.1,-73.3],[-56.9,-68.2],[-52.9,-64.8],[-51.6,-62.7],[-50.1,-59.2],[-49.3,-55.3],[-50.1,-51.1],[-55.0,-41.4],[-56.0,-33.6],[-59.6,-24.5],[-79.8,8.1],[-82.6,16.4],[-84.8,27.8],[-84.5,36.0],[-82.1,44.1],[-71.8,58.1],[-72.8,63.3],[-73.9,64.4],[-67.7,71.0],[2.4,0]],[[-55.0,-41.4],[-63.0,-47.5],[-65.8,-49.0],[-68.5,-51.8],[-71.5,-57.5],[-73.6,-63.4],[-76.6,-77.9],[-66.6,-89.2],[-61.6,-96.0],[-42.5,-124.1],[-46.2,-128.4],[-50.2,-135.8],[-52.0,-137.0],[2.4,0]],[[-56.1,243.0],[-72.6,235.8],[-75.3,233.9],[-84.1,235.3],[-96.8,240.8],[-101.5,242.2],[-103.8,241.7],[-113.7,225.0],[-114.9,219.8],[2.4,0]],[[17.9,131.2],[15.6,129.8],[14.1,124.3],[12.6,123.6],[8.8,124.7],[2.4,0]],[[-27.1,-124.8],[-20.9,-125.8],[-15.2,-125.5],[-9.9,-124.2],[-6.5,-120.7],[-5.8,-116.6],[-3.9,-110.9],[-1.4,-106.2],[5.6,-99.0],[8.3,-90.6],[14.5,-85.6],[24.6,-80.5],[2.4,0]],[[-32.4,252.0],[-39.5,257.7],[-49.7,263.4],[2.4,0]],[[222.1,-62.6],[260.1,-27.1],[274.3,-14.5],[302.3,4.0],[2.4,0]],[[-30.8,-127.2],[-27.1,-124.8],[-29.5,-117.0],[-31.7,-107.1],[-32.1,-96.7],[-31.5,-88.9],[-27.3,-77.6],[-26.8,-68.4],[-25.3,-63.5],[-21.4,-56.8],[-15.3,-54.4],[-8.2,-59.7],[2.4,0]],[[219.8,100.2],[215.8,101.9],[211.4,105.1],[198.3,121.4],[191.2,129.2],[186.2,134.0],[180.8,138.3],[166.8,137.4],[158.9,139.6],[153.3,143.4],[2.4,0]],[[101.2,109.1],[105.6,102.4],[110.8,96.2],[128.3,89.5],[137.0,87.1],[143.9,84.7],[151.3,81.0],[164.4,70.7],[170.4,68.2],[178.1,68.4],[182.1,69.7],[188.6,74.4],[195.8,78.2],[202.8,79.9],[208.6,82.5],[213.7,86.1],[223.4,90.0],[226.7,91.8],[2.4,0]],[[-21.4,-263.0],[-14.8,-267.4],[-0.7,-274.5],[2.4,0]],[[-148.7,130.9],[-163.5,119.8],[-166.6,116.2],[-163.2,98.9],[-160.6,89.1],[2.4,0]],[[-75.7,79.4],[-70.0,72.6],[-66.6,70.3],[-61.3,75.2],[-52.4,80.8],[-44.4,84.1],[-34.8,85.0],[-27.6,89.4],[-19.5,95.4],[-14.7,99.8],[-7.8,104.6],[-8.3,110.1],[-8.3,124.3],[-10.7,127.7],[-14.6,141.4],[-17.1,152.1],[-19.1,163.0],[-18.5,165.7],[2.4,0]],[[-128.6,145.0],[-134.7,141.2],[2.4,0]],[[-97.6,108.8],[-96.5,106.4],[-96.1,100.4],[-93.6,95.5],[2.4,0]],[[-123.7,164.0],[-124.7,159.6],[-127.0,156.1],[-128.1,151.9],[-128.6,145.0],[-117.6,130.1],[2.4,0]],[[219.8,100.2],[239.4,124.2],[1.5,276.8],[-5.3,267.1],[2.4,0]],[[222.1,-62.6],[210.8,-58.8],[187.0,-52.5],[176.2,-50.6],[152.5,-36.4],[149.8,-33.1],[148.1,-29.8],[145.0,-25.2],[139.0,-21.2],[130.0,-13.9],[123.8,-15.5],[119.2,-17.7],[63.7,-71.3],[56.4,-73.0],[40.3,-79.0],[31.1,-80.3],[24.6,-80.5],[16.1,-66.8],[12.3,-64.6],[1.1,-63.0],[-8.2,-59.7],[2.4,0]],[[78.2,90.5],[80.6,85.9],[86.5,80.2],[2.4,0]],[[179.1,162.9],[178.1,153.3],[178.1,148.6],[178.8,143.7],[180.8,138.3],[2.4,0]],[[-7.8,104.6],[-1.7,106.7],[10.8,109.5],[18.9,109.4],[28.0,107.8],[38.0,107.8],[49.1,108.6],[56.7,110.6],[2.4,0]],[[-49.7,263.4],[-54.2,264.0],[-60.7,263.4],[2.4,0]],[[315.3,16.1],[330.0,22.0],[339.9,30.2],[2.4,0]],[[71.1,86.9],[78.1,76.3],[84.2,74.2],[2.4,0]],[[-29.7,28.1],[-34.5,24.8],[-56.1,20.8],[-25.5,-27.1],[-15.3,-54.4],[2.4,0]],[[-60.7,263.4],[-64.2,263.2],[-78.3,264.7],[-79.6,264.1],[2.4,0]],[[-101.5,242.2],[-96.2,251.0],[-92.1,256.7],[-85.2,259.3],[2.4,0]],[[315.8,18.5],[317.5,42.3],[316.4,61.4],[300.7,82.5],[291.5,90.1],[251.3,116.2],[2.4,0]],[[258.3,60.9],[248.9,68.1],[249.1,78.0],[245.7,81.8],[230.5,87.6],[226.7,91.8],[2.4,0]],[[-142.0,-25.1],[-148.9,-13.5],[-152.6,-4.9],[-149.2,0.8],[-145.4,10.8],[-146.4,27.7],[-148.6,39.0],[-154.6,52.8],[-145.4,54.7],[-151.9,64.7],[-156.3,72.7],[-159.6,82.6],[-160.6,89.1],[2.4,0]],[[257.8,93.2],[261.7,88.4],[2.4,0]],[[275.0,77.8],[272.9,80.8],[271.0,82.3],[265.9,84.2],[2.4,0]],[[-145.4,54.7],[-138.8,46.6],[-127.5,41.3],[-120.2,27.0],[2.4,0]],[[-49.7,263.4],[-45.2,275.1],[2.4,0]],[[-145.4,10.8],[-127.6,17.8],[-122.5,24.7],[-120.2,27.0],[2.4,0]],[[243.6,96.9],[255.8,97.0],[257.8,93.2],[2.4,0]],[[248.9,68.1],[232.4,80.5],[221.7,82.8],[213.7,86.1],[2.4,0]],[[-110.8,25.2],[-102.5,26.6],[-92.1,30.1],[-84.5,36.0],[2.4,0]],[[275.0,77.8],[283.7,66.8],[286.9,59.7],[291.8,45.4],[294.1,30.9],[302.3,4.0],[312.6,0.3],[325.6,-11.7],[2.4,0]],[[235.1,97.1],[243.6,96.9],[2.4,0]],[[77.4,63.2],[74.3,53.6],[2.4,0]],[[65.4,84.2],[66.8,78.6],[69.6,72.7],[74.2,68.2],[77.4,63.2],[2.4,0]],[[-31.3,221.7],[-26.0,221.3],[-20.6,221.6],[-12.0,223.4],[-2.5,224.2],[19.8,228.6],[2.4,0]],[[-32.6,200.4],[-36.4,207.8],[-40.4,214.0],[-48.3,220.4],[-75.3,233.9],[2.4,0]],[[139.8,156.5],[135.3,158.0],[124.0,167.6],[101.9,184.3],[97.2,186.9],[79.2,195.3],[68.9,201.2],[2.4,0]],[[-40.4,214.0],[-34.1,219.9],[2.4,0]],[[-156.2,-138.7],[-138.8,-167.1],[2.4,0]],[[-56.1,243.0],[-32.4,252.0],[-19.0,258.8],[-5.3,267.1],[2.4,0]],[[-8.3,124.3],[-5.6,132.4],[-0.6,139.8],[3.3,143.9],[2.4,0]],[[-17.7,97.1],[-12.6,94.8],[-7.6,91.8],[-4.3,91.1],[-0.3,92.4],[5.7,99.6],[10.8,109.5],[2.4,0]],[[258.3,111.4],[251.0,110.0],[246.2,106.1],[242.9,101.2],[241.4,100.0],[237.0,98.8],[226.7,91.8],[2.4,0]],[[275.7,77.1],[282.0,85.6],[285.4,87.6],[291.5,90.1],[2.4,0]],[[-117.5,225.9],[-114.2,223.9],[2.4,0]],[[-128.1,151.9],[-123.6,153.1],[-119.8,152.6],[2.4,0]],[[187.0,-52.5],[218.9,-33.8],[234.0,-16.6],[235.5,-8.6],[240.8,5.7],[245.8,12.3],[253.1,38.1],[256.1,54.3],[258.3,60.9],[273.5,71.9],[2.4,0]],[[245.8,12.3],[260.1,-27.1],[2.4,0]],[[-239.1,87.9],[-235.7,84.6],[-223.5,85.6],[-218.9,83.4],[-216.7,79.7],[-211.0,72.0],[-204.3,64.6],[-199.0,56.8],[-193.2,49.3],[-191.4,44.8],[-190.5,34.8],[-188.9,32.0],[2.4,0]],[[-193.7,169.9],[-191.2,172.9],[2.4,0]],[[-191.2,172.9],[-188.7,174.4],[2.4,0]],[[-171.9,77.2],[-174.8,82.8],[-176.3,87.9],[-178.9,92.9],[-182.1,97.7],[-183.6,106.5],[-183.7,111.7],[-182.9,116.0],[-179.7,119.6],[-175.0,122.6],[2.4,0]],[[-221.9,85.0],[-213.7,90.4],[2.4,0]],[[-207.6,91.1],[-203.7,90.3],[-196.8,91.8],[2.4,0]],[[-213.7,90.4],[-207.6,91.1],[2.4,0]],[[-199.9,69.2],[-196.5,76.3],[2.4,0]],[[-258.0,97.4],[-258.2,101.5],[-257.3,105.8],[-255.4,111.2],[-250.9,112.1],[-242.6,115.0],[-232.6,120.8],[2.4,0]],[[-195.6,166.5],[-193.7,169.9],[2.4,0]],[[-204.3,64.6],[-199.9,69.2],[2.4,0]],[[-233.1,146.9],[-217.3,121.8],[-186.0,76.7],[-165.8,45.5],[2.4,0]],[[-8.2,-59.7],[-4.2,-67.1],[-3.8,-72.9],[-6.7,-77.3],[-7.7,-79.6],[-7.5,-81.6],[-8.2,-83.7],[-11.6,-89.1],[-12.1,-90.9],[-11.2,-95.0],[-8.7,-99.1],[-8.2,-100.8],[-8.5,-102.4],[-14.3,-105.2],[-16.1,-107.6],[-16.7,-109.7],[-16.7,-113.0],[-15.2,-125.5],[2.4,0]],[[-13.7,65.7],[-46.3,63.8],[2.4,0]],[[-56.1,20.8],[-68.4,16.3],[-78.4,6.2],[2.4,0]],[[-34.5,24.8],[-25.1,10.8],[-10.4,-5.9],[5.7,-17.8],[28.5,-19.9],[71.0,-27.1],[85.6,-28.6],[108.1,-23.9],[119.2,-17.7],[2.4,0]],[[-103.8,241.7],[-109.8,241.3],[-127.9,234.1],[-135.0,228.3],[2.4,0]],[[273.7,-44.6],[273.3,-33.1],[272.8,-29.1],[270.0,-24.1],[267.3,-20.9],[2.4,0]],[[93.4,-169.4],[94.5,-188.3],[2.4,0]],[[120.4,-198.3],[116.9,-196.7],[111.2,-191.3],[108.8,-188.1],[106.7,-183.5],[2.4,0]],[[151.3,-140.3],[139.4,-125.9],[113.0,-138.1],[2.4,0]],[[-34.8,85.0],[-42.9,73.6],[-47.6,64.8],[2.4,0]],[[2.5,127.1],[0.5,123.4],[-0.3,122.7],[-1.4,122.5],[-3.9,123.5],[-8.3,124.3],[2.4,0]],[[-108.6,25.5],[-112.5,10.4],[-89.8,2.1],[-81.9,3.1],[-78.4,6.2],[2.4,0]],[[189.8,-127.5],[167.5,-149.3],[2.4,0]],[[59.1,-190.8],[57.8,-193.3],[57.5,-196.2],[57.9,-198.9],[65.7,-208.6],[74.7,-221.1],[2.4,0]],[[-0.3,92.4],[2.3,86.1],[7.2,78.7],[2.4,0]],[[55.3,-256.3],[67.8,-245.7],[2.4,0]],[[124.6,-74.2],[119.8,-68.2],[134.2,-57.6],[141.0,-66.4],[2.4,0]],[[86.1,-104.0],[124.6,-74.2],[126.8,-76.8],[148.8,-60.6],[2.4,0]],[[-240.8,92.5],[-239.1,87.9],[2.4,0]],[[-242.6,115.0],[-240.2,108.4],[-239.8,103.7],[-241.1,101.4],[-240.8,92.5],[2.4,0]],[[-152.8,79.1],[-147.1,72.6],[-129.4,48.7],[2.4,0]],[[-160.6,89.1],[-152.8,79.1],[2.4,0]],[[-129.4,48.7],[-127.2,47.0],[-125.0,43.8],[-123.1,32.6],[2.4,0]],[[-167.2,48.0],[-159.6,50.5],[-154.6,52.8],[2.4,0]],[[-186.0,76.7],[-183.5,77.2],[-178.5,76.7],[-158.5,78.6],[2.4,0]],[[-189.4,81.6],[-196.5,76.3],[2.4,0]],[[-188.9,32.0],[-185.8,26.3],[-185.8,17.3],[2.4,0]],[[-199.6,28.8],[-203.9,27.0],[2.4,0]],[[-190.5,34.8],[-192.4,32.5],[-199.6,28.8],[-196.6,24.7],[-196.4,20.6],[2.4,0]],[[-237.2,85.7],[-248.4,78.8],[2.4,0]],[[-190.6,139.5],[-199.1,128.5],[-202.6,125.6],[-217.3,121.8],[-220.4,120.5],[-229.7,121.2],[-232.6,120.8],[2.4,0]],[[-185.8,17.3],[-180.4,-3.2],[2.4,0]],[[-216.1,2.3],[-213.2,-7.2],[-209.3,-17.0],[2.4,0]],[[-227.5,-7.6],[-220.4,-22.1],[2.4,0]],[[-152.6,-4.9],[-158.9,-2.7],[-166.6,-1.0],[-171.1,-1.0],[-180.4,-3.2],[-238.0,-30.7],[2.4,0]],[[-125.8,229.6],[-122.4,228.5],[-117.5,225.9],[2.4,0]],[[-166.6,116.2],[-175.0,122.6],[-181.0,125.7],[-184.7,129.2],[-188.2,133.6],[-190.6,139.5],[-190.3,142.0],[-186.6,148.0],[-186.0,150.3],[-186.0,164.6],[-186.5,168.3],[-189.3,176.0],[-189.2,178.8],[-179.6,187.6],[-173.6,195.7],[-170.4,201.8],[-159.5,212.4],[-147.8,219.1],[-135.0,228.3],[-125.8,229.6],[2.4,0]],[[166.9,-150.2],[163.3,-149.8],[161.2,-148.8],[151.3,-140.3],[144.7,-142.5],[137.6,-147.8],[130.8,-154.0],[2.4,0]],[[179.1,162.9],[169.8,158.3],[158.4,147.4],[151.7,142.3],[2.4,0]],[[-185.8,17.3],[-180.5,20.9],[-175.9,33.7],[-172.5,39.4],[-165.8,45.5],[2.4,0]],[[-184.4,10.8],[-180.7,11.8],[2.4,0]],[[-258.9,93.7],[-258.0,97.4],[2.4,0]],[[265.9,84.2],[261.7,88.4],[2.4,0]],[[341.1,31.4],[348.6,39.3],[2.4,0]],[[313.5,-21.5],[308.9,-17.0],[2.4,0]],[[310.1,-25.0],[305.8,-21.1],[312.4,-12.4],[312.6,0.3],[2.4,0]],[[-55.1,-138.7],[-59.2,-142.8],[-61.4,-147.2],[-65.6,-151.6],[-71.4,-149.6],[-80.8,-150.2],[-88.8,-152.5],[-96.4,-159.5],[-106.6,-160.4],[-116.9,-160.5],[-125.5,-161.5],[-138.8,-167.1],[2.4,0]],[[-89.8,2.1],[-92.2,-1.4],[-93.1,-5.6],[-92.6,-9.4],[-92.9,-11.1],[-95.5,-16.0],[-115.5,-29.5],[-130.1,-45.1],[2.4,0]],[[-143.6,52.6],[-142.1,55.9],[-149.5,75.3],[2.4,0]],[[270.9,74.8],[279.5,65.1],[286.9,59.7],[2.4,0]],[[249.1,78.0],[253.4,79.5],[2.4,0]],[[245.7,81.8],[266.3,75.3],[270.9,74.8],[275.0,77.8],[2.4,0]],[[60.8,-72.0],[64.8,-78.0],[2.4,0]],[[-0.5,-285.2],[-7.7,-291.2],[1.1,-301.3],[2.4,0]],[[-1.9,-283.2],[-11.0,-290.8],[2.4,0]],[[-73.9,64.4],[-81.8,60.2],[2.4,0]],[[-66.6,70.3],[-61.7,70.2],[-47.6,64.8],[-46.3,63.8],[-29.7,28.1],[-25.7,38.9],[-24.6,50.2],[-22.5,54.8],[-13.7,65.7],[31.4,93.4],[43.6,93.8],[55.0,85.9],[65.4,84.2],[78.2,90.5],[93.6,95.2],[103.5,96.7],[2.4,0]],[[151.7,142.3],[144.5,137.2],[2.4,0]],[[151.4,-59.1],[154.2,-57.8],[176.2,-50.6],[2.4,0]],[[154.2,-57.8],[140.2,-27.0],[139.0,-21.2],[2.4,0]],[[-23.4,-350.3],[-33.9,-338.6],[-20.6,-325.6],[4.0,0]],[[-49.7,-64.6],[-48.0,-66.7],[2.4,0]],[[-48.0,-66.7],[-45.6,-70.1],[-44.6,-76.3],[2.4,0]],[[-85.2,259.3],[-79.6,264.1],[2.4,0]],[[-20.6,-325.6],[3.8,-302.2],[26.9,-274.1],[32.9,-263.6],[38.7,-257.0],[55.3,-256.3],[2.4,0]],[[-13.4,239.9],[-15.7,236.2],[-27.0,226.5],[-31.3,221.7],[2.4,0]],[[226.7,91.8],[224.7,93.4],[2.4,0]],[[316.4,61.4],[321.9,58.4],[325.4,59.9],[348.6,39.3],[371.9,17.3],[2.4,0]],[[-3.8,-72.9],[-1.5,-78.2],[8.3,-90.6],[2.4,0]],[[-49.3,-254.8],[-55.5,-256.2],[-63.9,-261.9],[-69.4,-261.8],[-74.3,-258.6],[-82.5,-256.8],[-91.5,-260.2],[2.4,0]],[[38.7,-257.0],[9.6,-217.3],[7.5,-202.7],[2.4,0]],[[-38.2,-131.3],[-32.5,-128.2],[2.4,0]],[[-138.8,-167.1],[-148.2,-172.2],[2.4,0]],[[-163.9,-150.7],[-165.1,-165.4],[-170.1,-168.1],[2.4,0]]],"bridges":[{"n":"海手お伝い橋","p":[[113.6,117.9],[124.2,125.3],[125.3,124.2],[143.3,136.4]],"w":"wood"},{"n":"中島橋","p":[[-134.7,141.2],[-148.7,130.9]],"w":""},{"n":"","p":[[-28.0,190.0],[-32.6,200.4]],"w":""},{"n":"","p":[[-117.6,130.1],[-109.1,119.8],[-107.7,121.0],[-97.6,108.8]],"w":"wood"},{"n":"お伝い橋","p":[[-93.6,95.5],[-85.3,87.0],[-83.9,88.2],[-75.7,79.4]],"w":"wood"},{"n":"お伝い橋","p":[[-114.9,219.8],[-118.3,197.6],[-116.6,197.3],[-118.3,186.2],[-120.2,186.5],[-123.7,164.0]],"w":"wood"},{"n":"三問橋","p":[[-118.4,26.5],[-110.8,25.2]],"w":""},{"n":"","p":[[-137.8,-31.4],[-142.0,-25.1]],"w":""},{"n":"","p":[[-34.1,219.9],[-31.3,221.7]],"w":""},{"n":"","p":[[224.7,93.4],[220.9,98.6]],"w":""},{"n":"","p":[[67.8,-245.7],[74.9,-240.2]],"w":"wood"},{"n":"","p":[[-52.0,-137.0],[-55.1,-138.7]],"w":""},{"n":"","p":[[64.8,-78.0],[69.3,-84.9]],"w":""},{"n":"","p":[[148.8,-60.6],[151.4,-59.1]],"w":""}],"bld":[{"n":"休憩所","r":[[-0.4,-72.5],[10.5,-65.5],[18.8,-78.0],[7.9,-85.1]],"q":[9.2,-75.28,0.9876,15.11,12.94]},{"n":"旧稲生神社","r":[[190.0,-123.1],[194.5,-118.7],[198.5,-122.8],[193.9,-127.2]],"q":[194.21,-122.94,-0.7724,6.32,5.67]},{"n":"浜離宮恩賜庭園サービスセンター","r":[[-22.6,-285.9],[-14.3,-278.7],[-7.7,-286.2],[-16.0,-293.4]],"q":[-15.16,-286.05,-0.7161,11.1,9.95]},{"n":"芳梅亭","r":[[-51.2,-83.3],[-41.6,-74.5],[-36.4,-80.1],[-46.0,-88.9]],"q":[-43.8,-81.7,-0.7413,13.05,7.66]},{"n":"中島の御茶屋","r":[[-122.3,140.0],[-120.4,141.1],[-121.4,142.6],[-115.3,146.5],[-119.0,152.3],[-116.2,154.1],[-118.6,157.8],[-109.9,163.3],[-105.3,156.1],[-108.0,154.4],[-106.2,151.6],[-108.5,150.2],[-106.4,146.9],[-110.4,144.4],[-108.8,141.8],[-112.3,139.6],[-111.7,138.7],[-116.8,135.5],[-117.2,136.1],[-119.0,135.0]],"q":[-113.22,148.89,-1.37,29.63,14.14]},{"n":"鷹の御茶屋","r":[[-73.4,49.7],[-70.4,52.8],[-72.6,54.9],[-66.2,61.5],[-59.1,54.7],[-70.1,43.4],[-73.2,46.4]],"q":[-68.14,52.48,-0.7995,15.7,9.82]},{"n":"","r":[[-49.6,278.4],[-43.5,281.4],[-41.3,277.1],[-47.4,274.0]],"q":[-45.45,277.71,-0.4627,6.82,4.87]},{"n":"松の御茶屋","r":[[-41.4,93.5],[-31.8,98.0],[-28.5,91.2],[-38.2,86.7]],"q":[-34.98,92.35,-0.4436,10.71,7.56]},{"n":"","r":[[309.0,-26.2],[315.0,-19.9],[323.4,-28.0],[317.4,-34.2]],"q":[316.21,-27.08,0.766,11.68,8.71]},{"n":"","r":[[-73.6,251.7],[-71.9,254.1],[-69.1,252.3],[-71.1,250.0]],"q":[-71.36,252.03,0.6083,3.33,3.02]},{"n":"売札所","r":[[-161.4,-131.2],[-157.2,-128.6],[-155.4,-131.5],[-153.8,-130.5],[-151.4,-134.5],[-157.2,-138.0]],"q":[-156.36,-132.84,1.0236,8.05,6.79]},{"n":"燕の御茶屋","r":[[-95.7,57.1],[-88.2,64.2],[-80.1,55.4],[-87.8,48.6]],"q":[-87.98,56.3,0.8324,11.97,10.34]},{"n":"","r":[[-14.1,-278.0],[-11.3,-275.3],[-6.3,-280.3],[-9.2,-283.1]],"q":[-10.22,-279.16,0.8008,7.08,3.92]},{"n":"濱見世","r":[[17.3,-90.2],[20.8,-87.8],[22.4,-90.2],[18.9,-92.5]],"q":[19.86,-90.16,-0.5858,4.2,2.79]},{"n":"","r":[[-10.7,80.0],[-5.8,83.1],[-2.4,77.8],[-7.2,74.7]],"q":[-6.53,78.87,0.9948,6.31,5.74]},{"n":"","r":[[98.4,-114.9],[102.1,-112.3],[104.6,-115.8],[107.3,-113.9],[114.1,-123.5],[110.5,-126.0],[106.6,-120.5],[103.8,-122.5]],"q":[106.26,-119.2,0.9522,16.11,7.83]},{"n":"","r":[[-119.0,-41.6],[-116.7,-40.1],[-113.8,-44.5],[-116.0,-46.0]],"q":[-116.39,-43.04,0.981,5.35,2.74]},{"n":"","r":[[-116.6,-37.6],[-111.5,-34.1],[-107.7,-39.5],[-112.8,-43.0]],"q":[-112.13,-38.55,0.9623,6.58,6.2]},{"n":"","r":[[-180.8,12.9],[-178.8,13.3],[-178.3,11.2],[-180.3,10.8]],"q":[-179.54,12.06,1.359,2.12,2.04]},{"n":"","r":[[25.6,-90.1],[29.0,-87.5],[31.7,-91.2],[28.3,-93.7]],"q":[28.66,-90.61,0.9264,4.57,4.25]},{"n":"","r":[[31.3,-88.1],[34.5,-85.9],[36.8,-89.0],[33.5,-91.3]],"q":[34.04,-88.57,-0.6089,3.93,3.88]},{"n":"","r":[[-4.4,83.8],[-0.7,86.2],[2.6,81.1],[-1.1,78.7]],"q":[-0.88,82.45,0.9944,6.13,4.4]},{"n":"","r":[[-27.1,-289.5],[-25.7,-288.3],[-26.7,-287.1],[-18.9,-280.3],[-17.7,-281.7],[-22.6,-285.9],[-18.8,-290.3],[-23.1,-294.0]],"q":[-21.02,-287.18,-0.7179,12.17,7.56]},{"n":"","r":[[-42.5,-265.2],[-40.2,-258.2],[-34.8,-260.0],[-37.1,-267.0]],"q":[-38.64,-262.6,-1.2609,7.37,5.67]},{"n":"","r":[[-116.5,-48.6],[-113.3,-45.9],[-108.6,-51.5],[-111.8,-54.2]],"q":[-112.55,-50.06,0.8776,7.29,4.15]},{"n":"","r":[[-77.8,-287.3],[-74.8,-284.5],[-68.7,-291.0],[-71.8,-293.8]],"q":[-73.27,-289.16,0.8256,8.92,4.17]},{"n":"","r":[[-72.9,-296.7],[-64.5,-289.2],[-45.3,-310.3],[-53.7,-317.8]],"q":[-59.11,-303.5,0.8319,28.56,11.25]},{"n":"","r":[[-42.6,-286.9],[-38.7,-283.0],[-34.1,-287.6],[-38.1,-291.5]],"q":[-38.37,-287.26,0.7856,6.44,5.53]},{"n":"","r":[[-39.9,-279.3],[-36.0,-275.1],[-31.8,-278.9],[-32.6,-279.8],[-31.3,-280.9],[-34.4,-284.3]],"q":[-35.21,-279.67,0.7319,7.41,5.79]},{"n":"","r":[[1.2,-30.1],[5.1,-30.0],[5.2,-33.5],[1.3,-33.5]],"q":[3.2,-31.76,-0.0085,3.89,3.44]},{"n":"藤棚","r":[[-54.5,-147.2],[-46.0,-140.5],[-42.5,-144.9],[-51.0,-151.6]],"q":[-48.51,-146.04,-0.6689,10.89,5.68]}],"walls":[[[-345.3,96.9],[-338.8,101.7],[-332.4,106.4],[-325.9,111.2],[-319.4,116.0],[-313.0,120.7],[-306.5,125.5],[-300.1,130.2],[-293.6,135.0],[-287.2,139.8],[-280.7,144.5],[-274.3,149.3],[-267.8,154.0],[-261.3,158.8],[-254.9,163.6],[-248.4,168.3],[-242.0,173.1],[-235.5,177.8],[-229.1,182.6],[-222.6,187.3],[-216.2,192.1],[-209.7,196.9],[-203.2,201.6],[-196.6,206.1],[-189.9,210.7],[-183.2,215.2],[-176.6,219.7],[-169.9,224.2],[-163.2,228.7],[-156.6,233.2],[-149.9,237.8],[-143.2,242.3],[-136.5,246.8],[-129.9,251.3],[-123.2,255.8],[-116.5,260.3],[-109.9,264.9],[-103.2,269.4],[-96.5,273.9],[-89.8,278.4],[-83.2,282.9],[-76.5,287.4],[-69.8,292.0],[-63.2,296.5],[-56.5,301.0],[-49.8,305.5],[-43.1,310.0],[-36.4,305.7],[-29.7,301.4],[-22.9,297.0],[-16.2,292.7],[-9.4,288.3],[-2.7,284.0],[4.0,279.6],[10.8,275.3],[17.5,271.0],[24.3,266.6],[31.0,262.3],[37.8,257.9],[44.5,253.6],[51.2,249.3],[58.0,244.9],[64.7,240.6],[71.5,236.2],[78.2,231.9],[85.0,227.6],[91.7,223.2],[98.4,218.9],[105.2,214.5],[111.9,210.2],[118.7,205.8],[125.4,201.5],[132.1,197.2],[138.9,192.8],[145.6,188.5],[152.4,184.1],[159.1,179.8],[165.9,175.5],[172.6,171.1],[179.3,166.8],[186.1,162.4],[192.8,158.1],[199.6,153.8],[206.3,149.4],[213.1,145.1],[219.8,140.7],[226.5,136.4],[233.3,132.1],[240.0,127.7],[246.8,123.4],[241.3,120.2],[245.9,116.9],[250.8,120.9],[258.3,116.0],[265.9,111.1],[273.5,106.2],[281.0,101.3],[288.6,96.4],[296.2,91.5],[303.8,86.6],[310.0,80.8],[316.3,75.0],[322.6,69.2],[328.9,63.5],[335.2,57.7],[341.5,51.9],[347.7,46.1],[354.0,40.3],[360.3,34.5],[366.6,28.7],[372.9,23.0],[379.2,17.2],[373.3,11.7],[367.4,6.3],[361.5,0.8],[355.6,-4.6],[349.7,-10.1],[343.9,-15.5],[337.9,-10.1],[331.9,-4.7],[323.8,-12.0],[315.6,-19.3],[321.4,-25.2],[327.1,-31.0],[321.2,-36.6],[315.2,-42.1],[309.2,-47.6],[303.3,-53.1],[297.3,-58.7],[291.4,-64.2],[285.4,-69.7],[279.4,-75.2],[273.5,-80.8],[267.5,-86.3],[261.6,-91.8],[255.6,-97.3],[249.6,-102.8],[243.7,-108.4],[237.7,-113.9],[231.8,-119.4],[225.8,-124.9],[219.8,-130.5],[213.9,-136.0],[207.9,-141.5],[202.0,-147.0],[196.0,-152.6],[190.0,-158.1],[184.1,-163.6],[178.1,-169.1],[172.2,-174.6],[166.2,-180.2],[160.2,-185.7],[154.3,-191.2],[148.3,-196.7],[142.4,-202.3],[136.4,-207.8],[130.4,-213.3],[124.5,-218.8],[118.5,-224.3],[112.6,-229.9],[106.6,-235.4],[100.6,-240.9],[94.7,-246.4],[88.7,-252.0],[82.8,-257.5],[76.6,-262.9],[70.4,-268.4],[64.2,-273.8],[58.0,-279.3],[51.8,-284.7],[45.7,-290.2],[39.5,-295.6],[33.3,-301.1],[27.1,-306.5],[20.9,-312.0],[14.7,-317.4],[8.6,-322.9],[2.4,-328.3],[-3.8,-333.7],[-10.0,-339.2],[-16.2,-344.6],[-22.4,-350.1],[-28.5,-355.5],[-34.7,-361.0],[-40.9,-366.4],[-45.3,-359.7],[-49.7,-353.0],[-54.1,-346.3]],[[-261.5,-30.7],[-265.9,-23.9],[-270.3,-17.2],[-274.7,-10.5],[-279.1,-3.8],[-283.5,2.9],[-287.9,9.6],[-292.3,16.3],[-296.7,23.1],[-301.2,29.8],[-305.6,36.5],[-310.0,43.2],[-314.4,49.9],[-318.8,56.6],[-323.2,63.4],[-327.6,70.1],[-332.0,76.8],[-336.4,83.5],[-340.9,90.2],[-345.3,96.9]]],"trees":[[-333.6,90.5,4.3,"d"],[-324.8,86.8,5.0,"d"],[-329.5,96.6,3.4,"d"],[-325.5,99.6,3.3,"p"],[-324.9,107.6,2.8,"d"],[-318.4,69.4,5.0,"d"],[-315.7,84.4,3.9,"d"],[-320.6,89.0,3.9,"d"],[-316.9,101.2,3.8,"d"],[-307.6,50.9,3.7,"p"],[-306.4,59.0,4.1,"p"],[-308.1,65.8,3.3,"p"],[-309.9,71.7,3.7,"s"],[-311.9,81.2,5.1,"d"],[-312.8,91.0,4.7,"d"],[-311.8,98.1,5.0,"d"],[-313.0,107.4,3.4,"d"],[-307.5,120.3,3.5,"d"],[-297.9,48.8,3.6,"d"],[-303.4,64.6,3.9,"p"],[-299.4,71.8,3.5,"p"],[-301.4,83.6,5.2,"d"],[-300.1,94.3,5.1,"d"],[-299.2,99.2,4.2,"d"],[-301.4,119.3,3.1,"s"],[-287.3,27.2,4.9,"d"],[-294.9,35.4,5.0,"d"],[-294.6,72.4,3.3,"d"],[-293.8,81.5,3.2,"p"],[-290.0,95.6,3.5,"d"],[-287.8,102.9,3.0,"d"],[-287.4,110.1,2.9,"d"],[-290.5,117.8,2.7,"p"],[-293.0,130.6,4.1,"d"],[-284.5,11.3,5.2,"d"],[-280.8,23.5,3.0,"d"],[-280.7,28.5,3.2,"d"],[-283.4,76.7,2.6,"p"],[-283.7,82.6,3.1,"p"],[-280.1,92.7,3.4,"d"],[-285.9,98.8,3.5,"d"],[-282.9,110.9,3.4,"d"],[-280.5,120.9,3.5,"d"],[-280.6,127.8,3.0,"p"],[-283.9,136.3,2.9,"d"],[-271.6,-9.5,3.4,"p"],[-276.0,5.5,3.4,"d"],[-273.2,13.9,3.4,"d"],[-271.9,81.4,4.2,"d"],[-269.7,96.3,3.8,"d"],[-269.4,107.0,2.9,"d"],[-276.3,127.2,4.0,"d"],[-274.3,136.0,3.1,"p"],[-266.5,-16.2,3.5,"d"],[-262.8,-2.9,3.7,"d"],[-260.3,-0.2,4.3,"d"],[-266.6,12.5,3.6,"p"],[-262.4,109.1,3.8,"s"],[-264.3,126.4,5.1,"d"],[-261.6,139.9,3.0,"s"],[-261.3,148.3,3.3,"p"],[-259.1,-23.4,3.9,"d"],[-256.7,-14.1,5.1,"s"],[-251.3,-7.3,4.5,"d"],[-251.3,-0.9,4.4,"d"],[-257.9,48.8,3.0,"p"],[-252.4,87.1,3.6,"d"],[-255.0,92.8,3.1,"p"],[-255.2,98.6,3.0,"d"],[-253.0,117.5,3.3,"d"],[-255.7,129.0,2.8,"p"],[-255.1,145.8,4.1,"p"],[-256.0,151.7,3.8,"p"],[-247.7,-40.6,4.8,"d"],[-244.9,-33.0,3.5,"d"],[-248.6,-16.1,2.8,"p"],[-243.3,-6.7,3.7,"d"],[-244.9,6.0,3.7,"d"],[-247.5,48.3,4.2,"d"],[-248.2,94.4,3.0,"d"],[-243.7,100.6,4.3,"d"],[-243.0,119.2,4.6,"d"],[-249.4,127.0,4.5,"d"],[-245.7,138.0,5.1,"d"],[-244.1,149.0,2.9,"p"],[-248.7,155.8,4.6,"d"],[-233.6,-55.2,4.1,"p"],[-241.1,-46.2,4.0,"d"],[-234.6,-7.2,2.8,"d"],[-235.1,0.7,3.6,"d"],[-235.9,11.2,2.9,"p"],[-235.9,94.9,4.6,"d"],[-237.9,114.5,5.0,"d"],[-240.2,130.9,4.7,"d"],[-238.2,135.9,3.4,"p"],[-234.7,142.7,3.0,"d"],[-233.9,152.7,4.1,"p"],[-228.3,-66.1,2.8,"d"],[-228.3,-62.3,3.9,"d"],[-231.5,-51.5,5.1,"d"],[-230.0,-42.9,3.0,"p"],[-225.6,-31.0,3.4,"p"],[-225.5,2.6,3.3,"d"],[-232.1,74.7,3.6,"p"],[-227.1,89.1,5.2,"d"],[-225.3,100.1,4.6,"d"],[-224.4,111.6,2.7,"p"],[-227.2,146.5,2.9,"d"],[-231.0,157.9,4.7,"d"],[-226.7,164.7,3.2,"d"],[-221.5,-75.5,3.8,"d"],[-218.3,-43.1,3.3,"p"],[-219.5,-30.4,5.0,"d"],[-220.1,-14.1,4.5,"d"],[-218.0,9.4,5.2,"d"],[-222.8,75.2,3.2,"p"],[-217.2,94.5,4.5,"d"],[-222.2,112.8,4.1,"p"],[-221.9,138.6,3.5,"d"],[-216.8,145.9,3.9,"d"],[-219.0,159.5,3.6,"m"],[-217.2,161.2,4.5,"d"],[-216.6,172.6,4.1,"d"],[-223.1,181.6,3.5,"d"],[-207.2,-103.4,4.5,"d"],[-210.3,-97.1,3.9,"d"],[-210.0,-87.2,3.0,"p"],[-214.1,-80.0,3.6,"p"],[-206.9,-30.7,5.1,"d"],[-209.9,-24.3,3.4,"p"],[-211.1,3.7,5.1,"d"],[-209.5,21.2,5.0,"d"],[-208.9,27.3,3.6,"d"],[-209.0,54.3,3.1,"p"],[-212.2,86.1,2.7,"p"],[-214.0,95.0,2.9,"d"],[-211.7,108.6,4.3,"d"],[-213.9,129.1,3.0,"p"],[-208.5,135.0,3.4,"s"],[-212.0,149.9,3.2,"d"],[-212.4,153.9,5.2,"d"],[-208.9,165.6,4.0,"d"],[-213.8,173.5,2.9,"d"],[-214.0,186.4,3.2,"d"],[-197.6,-120.2,4.2,"p"],[-204.1,-106.2,4.7,"d"],[-204.8,-95.4,4.3,"d"],[-205.3,-55.4,3.0,"p"],[-197.3,-41.3,3.4,"d"],[-201.4,-31.7,3.8,"m"],[-202.7,-25.3,3.3,"p"],[-199.8,-18.2,3.3,"s"],[-200.3,-9.1,3.2,"d"],[-199.4,3.1,2.9,"s"],[-204.5,7.9,3.7,"p"],[-200.9,23.4,4.3,"d"],[-205.0,35.9,3.1,"d"],[-200.4,50.2,4.4,"d"],[-197.5,81.9,3.9,"d"],[-201.2,110.7,4.3,"d"],[-199.8,123.5,3.9,"d"],[-201.2,131.0,4.0,"m"],[-202.1,137.4,2.9,"s"],[-202.1,143.2,3.2,"d"],[-201.9,156.4,3.5,"d"],[-202.3,167.7,4.9,"d"],[-201.4,170.6,3.8,"p"],[-204.7,184.0,4.3,"d"],[-204.9,195.1,4.7,"d"],[-191.2,-120.3,4.6,"d"],[-194.5,-111.4,3.3,"d"],[-193.9,-106.0,2.6,"p"],[-194.7,-90.5,4.2,"d"],[-195.3,-40.0,3.0,"d"],[-195.5,-34.1,4.2,"s"],[-189.1,-20.8,3.9,"d"],[-190.0,-14.1,3.8,"d"],[-192.1,-4.7,4.7,"d"],[-189.7,-0.7,3.2,"d"],[-188.6,10.0,4.2,"d"],[-194.0,22.8,3.9,"p"],[-195.5,41.6,4.6,"d"],[-193.0,56.7,3.4,"d"],[-190.9,62.4,4.1,"d"],[-194.8,103.6,3.3,"m"],[-195.3,107.9,4.1,"p"],[-192.5,116.6,4.4,"d"],[-190.5,130.8,3.9,"d"],[-190.8,148.3,3.1,"d"],[-195.9,154.7,3.0,"d"],[-189.6,169.8,3.5,"d"],[-195.2,183.3,3.2,"d"],[-195.4,187.7,4.5,"d"],[-189.9,197.2,4.6,"d"],[-183.6,-141.2,4.8,"d"],[-180.4,-136.0,4.2,"d"],[-180.0,-127.0,5.1,"d"],[-184.8,-93.4,3.8,"p"],[-184.0,-24.7,5.1,"d"],[-179.8,-12.2,3.4,"d"],[-185.6,31.4,3.4,"d"],[-185.3,40.9,3.0,"d"],[-179.5,51.3,4.6,"d"],[-181.1,56.6,4.4,"d"],[-184.7,66.7,3.3,"s"],[-179.7,87.0,3.9,"p"],[-182.7,89.2,3.9,"p"],[-186.9,98.1,4.9,"d"],[-179.3,110.1,4.5,"d"],[-184.3,120.7,3.8,"p"],[-185.6,137.2,3.1,"d"],[-181.7,176.9,4.9,"d"],[-182.4,190.4,4.4,"d"],[-181.9,210.4,4.8,"m"],[-176.2,-143.7,3.6,"d"],[-171.2,-120.1,2.7,"p"],[-173.6,-117.8,3.1,"m"],[-172.5,-105.2,2.9,"d"],[-177.8,-9.1,4.3,"d"],[-177.1,16.8,3.7,"d"],[-170.7,28.1,3.0,"d"],[-178.0,39.4,4.5,"d"],[-176.4,49.1,3.0,"p"],[-170.9,69.0,3.7,"d"],[-171.0,71.1,4.9,"d"],[-174.8,102.5,4.1,"d"],[-177.8,110.1,4.8,"d"],[-176.3,118.7,4.1,"d"],[-172.7,135.4,3.5,"d"],[-173.8,143.3,2.9,"d"],[-177.3,159.0,3.2,"p"],[-170.7,171.2,3.0,"d"],[-171.8,183.4,4.3,"d"],[-173.5,201.7,2.8,"p"],[-175.8,206.7,4.9,"d"],[-167.6,-161.8,3.9,"p"],[-169.1,-140.8,5.0,"d"],[-163.3,-134.2,4.6,"d"],[-167.2,-120.5,3.2,"p"],[-161.6,-113.8,3.5,"d"],[-163.5,-35.6,3.8,"d"],[-162.5,-24.1,4.1,"d"],[-162.2,6.1,4.0,"d"],[-165.6,9.0,3.3,"d"],[-167.0,18.2,4.1,"d"],[-167.9,30.7,4.0,"d"],[-164.4,36.9,3.3,"d"],[-161.5,57.5,3.1,"p"],[-166.3,65.0,3.2,"d"],[-165.3,87.5,3.0,"d"],[-169.1,93.3,4.7,"d"],[-168.6,194.4,5.0,"s"],[-165.7,201.7,3.7,"d"],[-165.7,212.5,3.9,"d"],[-164.8,220.9,5.1,"d"],[-156.4,-170.8,3.0,"p"],[-159.4,-100.2,3.3,"d"],[-158.3,-49.2,3.4,"p"],[-152.7,-34.0,3.9,"m"],[-160.2,11.4,4.6,"d"],[-158.2,19.8,3.8,"d"],[-154.8,29.0,3.1,"d"],[-156.3,36.6,4.0,"m"],[-154.4,44.8,3.3,"d"],[-154.4,84.9,3.0,"d"],[-158.8,116.1,3.6,"p"],[-154.7,174.0,3.7,"p"],[-158.3,183.5,3.3,"p"],[-158.3,190.0,3.1,"p"],[-157.8,200.1,4.6,"d"],[-154.1,212.0,3.9,"s"],[-156.7,219.8,3.3,"p"],[-155.8,227.7,3.5,"d"],[-143.6,-149.0,2.8,"p"],[-148.2,-142.4,3.2,"d"],[-148.0,-95.7,3.1,"p"],[-148.5,-35.5,5.1,"d"],[-145.9,-9.7,3.1,"p"],[-150.3,7.8,2.9,"p"],[-150.5,22.4,4.0,"d"],[-148.3,43.8,4.8,"d"],[-150.4,121.7,3.9,"p"],[-147.1,126.9,2.7,"p"],[-148.5,192.8,3.8,"d"],[-147.1,197.0,3.2,"d"],[-147.5,213.5,3.8,"p"],[-143.5,217.7,2.6,"p"],[-147.5,225.7,4.0,"p"],[-139.0,-201.6,3.0,"d"],[-136.3,-181.4,5.1,"d"],[-136.4,-157.3,4.8,"d"],[-134.5,-147.2,4.6,"d"],[-137.1,-138.8,5.1,"d"],[-135.2,-106.7,4.3,"d"],[-138.7,-19.0,4.3,"d"],[-138.1,1.0,3.4,"p"],[-136.9,18.8,4.6,"d"],[-140.6,30.3,3.4,"p"],[-140.1,57.6,2.8,"p"],[-135.8,74.8,2.7,"p"],[-136.0,201.6,3.1,"d"],[-141.6,209.0,2.9,"m"],[-136.2,215.5,3.3,"m"],[-139.1,235.4,3.7,"d"],[-128.3,-221.4,3.4,"d"],[-132.6,-217.0,4.9,"d"],[-125.5,-194.4,3.7,"d"],[-130.8,-189.9,3.9,"d"],[-126.2,-168.4,4.6,"d"],[-127.3,-151.6,3.1,"d"],[-127.5,-143.4,3.6,"p"],[-126.0,-130.6,3.7,"p"],[-129.8,-30.9,4.2,"p"],[-132.7,-26.7,5.0,"d"],[-131.5,-15.5,3.5,"p"],[-130.8,32.8,3.0,"s"],[-125.6,49.4,2.9,"p"],[-131.2,57.1,2.7,"p"],[-128.0,161.0,3.8,"p"],[-128.3,226.5,4.3,"d"],[-125.9,240.2,3.0,"d"],[-128.8,243.4,2.8,"d"],[-117.6,-229.9,3.3,"d"],[-121.8,-222.4,4.0,"p"],[-124.1,-217.2,2.8,"d"],[-121.5,-207.4,3.6,"d"],[-122.9,-192.6,3.3,"d"],[-122.3,-182.5,3.2,"p"],[-116.4,-173.7,2.9,"d"],[-119.9,-168.5,4.8,"s"],[-122.3,-155.6,3.3,"d"],[-116.6,-148.1,2.9,"d"],[-116.8,-143.0,4.0,"d"],[-121.5,-115.9,2.8,"d"],[-121.0,-56.5,3.0,"d"],[-117.2,-20.8,3.8,"p"],[-119.7,-16.3,3.9,"p"],[-120.8,41.1,3.7,"p"],[-118.2,233.3,3.6,"d"],[-118.4,244.4,3.6,"d"],[-112.4,-247.0,3.6,"p"],[-110.0,-244.2,3.7,"s"],[-110.5,-220.9,3.7,"d"],[-113.1,-215.1,3.0,"d"],[-109.0,-194.1,4.0,"d"],[-115.1,-186.3,3.1,"d"],[-112.5,-177.6,3.1,"d"],[-108.5,-133.9,5.0,"m"],[-107.5,-121.3,3.8,"d"],[-108.5,-64.3,3.3,"d"],[-112.1,-22.1,4.9,"s"],[-111.0,-13.5,4.4,"d"],[-111.5,245.0,4.5,"d"],[-112.0,254.7,3.3,"d"],[-98.4,-258.2,4.4,"d"],[-102.1,-250.2,4.4,"d"],[-102.3,-233.4,4.6,"d"],[-98.5,-220.5,3.1,"d"],[-100.4,-215.9,3.4,"d"],[-106.1,-195.7,4.4,"d"],[-101.5,-182.9,4.6,"d"],[-104.5,-171.8,4.0,"p"],[-102.2,-152.1,4.8,"d"],[-101.8,-137.6,4.2,"d"],[-102.9,-129.2,5.0,"d"],[-100.8,-124.6,4.5,"d"],[-101.1,-81.1,3.0,"p"],[-101.1,-58.3,4.4,"d"],[-104.5,-36.4,3.2,"d"],[-101.4,-24.1,4.3,"d"],[-100.0,-13.7,3.4,"p"],[-101.1,-9.5,4.4,"d"],[-103.9,11.5,3.2,"s"],[-104.3,21.6,3.1,"d"],[-98.7,233.5,3.2,"p"],[-100.7,266.3,3.8,"p"],[-92.2,-280.1,3.7,"d"],[-89.3,-268.9,3.0,"p"],[-91.4,-256.5,2.9,"p"],[-95.4,-248.9,3.1,"p"],[-90.1,-239.4,3.3,"d"],[-92.8,-227.9,3.5,"d"],[-95.2,-220.3,4.5,"d"],[-90.2,-216.9,4.9,"d"],[-92.9,-204.4,5.0,"d"],[-92.5,-193.5,3.8,"p"],[-93.2,-188.0,4.3,"s"],[-96.7,-177.3,3.5,"d"],[-92.9,-150.1,4.2,"m"],[-93.0,-142.5,3.9,"d"],[-95.2,-135.8,4.4,"d"],[-96.5,-120.2,4.1,"d"],[-94.9,-112.6,2.9,"m"],[-89.9,-52.2,4.2,"s"],[-93.0,-40.2,4.4,"d"],[-95.2,-34.4,3.9,"p"],[-91.4,-20.7,3.6,"d"],[-89.9,-18.6,2.8,"p"],[-95.6,-4.6,4.1,"d"],[-93.0,7.7,5.0,"d"],[-90.2,22.3,3.4,"m"],[-92.8,35.5,2.8,"p"],[-94.3,51.0,3.6,"p"],[-96.3,95.9,2.7,"p"],[-96.9,231.4,3.7,"d"],[-95.3,237.5,2.8,"p"],[-95.2,256.7,3.5,"d"],[-94.0,266.9,5.0,"d"],[-81.6,-289.3,3.7,"d"],[-82.7,-275.8,3.3,"p"],[-81.1,-263.5,4.4,"d"],[-81.0,-261.1,2.6,"p"],[-83.3,-242.6,4.1,"d"],[-84.5,-230.8,4.8,"d"],[-86.0,-224.9,4.9,"m"],[-85.0,-214.8,4.1,"p"],[-80.6,-201.6,5.1,"d"],[-86.9,-193.5,4.4,"d"],[-82.9,-177.9,3.1,"p"],[-86.9,-161.7,3.3,"d"],[-84.8,-119.5,4.3,"d"],[-82.1,-112.6,3.1,"p"],[-80.7,-103.5,5.0,"d"],[-84.1,-61.2,5.2,"s"],[-82.5,-50.9,3.1,"p"],[-87.6,-43.4,3.0,"d"],[-87.2,-29.8,3.9,"d"],[-85.4,-24.5,4.1,"p"],[-87.9,23.2,3.2,"d"],[-86.1,238.9,3.7,"p"],[-87.0,262.9,3.2,"d"],[-85.4,276.4,2.9,"d"],[-75.0,-307.3,3.3,"d"],[-78.2,-265.4,4.8,"d"],[-74.2,-262.2,4.0,"p"],[-77.1,-246.0,4.9,"d"],[-79.2,-241.8,4.0,"d"],[-78.9,-227.7,3.6,"d"],[-71.9,-221.9,3.5,"p"],[-75.7,-216.0,3.9,"d"],[-78.0,-196.6,5.2,"d"],[-75.4,-122.0,3.4,"p"],[-75.1,-117.0,5.1,"d"],[-71.6,-104.4,3.5,"d"],[-77.0,-99.8,3.5,"d"],[-78.4,-60.9,3.9,"p"],[-75.0,-37.1,3.6,"d"],[-79.0,13.9,4.8,"d"],[-71.5,21.0,3.8,"p"],[-79.1,27.9,3.2,"d"],[-71.4,36.3,5.2,"d"],[-73.9,69.2,3.7,"p"],[-71.3,222.4,2.9,"p"],[-75.6,227.6,3.3,"d"],[-72.3,269.7,4.5,"d"],[-76.4,283.2,3.5,"d"],[-67.3,-318.4,3.2,"p"],[-67.0,-309.7,4.4,"d"],[-67.6,-265.1,2.9,"p"],[-63.3,-255.8,3.3,"d"],[-68.6,-245.6,2.8,"d"],[-65.8,-240.8,3.9,"p"],[-69.2,-227.7,3.2,"d"],[-68.4,-224.9,3.4,"d"],[-68.1,-216.5,3.3,"p"],[-70.2,-193.2,4.0,"d"],[-66.6,-184.8,3.0,"d"],[-68.0,-130.0,2.9,"d"],[-68.3,-120.1,3.4,"p"],[-68.1,-115.6,4.0,"d"],[-70.1,-106.3,4.1,"d"],[-63.1,-87.9,3.1,"d"],[-65.3,2.7,3.9,"d"],[-64.7,13.4,5.0,"d"],[-62.5,21.5,3.3,"d"],[-68.5,29.8,5.0,"d"],[-63.6,34.9,4.0,"s"],[-67.1,75.9,4.3,"d"],[-62.4,85.1,3.4,"p"],[-62.9,213.3,2.6,"p"],[-69.3,216.6,3.0,"p"],[-64.3,246.3,3.3,"d"],[-66.5,258.4,3.5,"p"],[-69.9,284.7,3.2,"p"],[-65.1,286.8,3.6,"d"],[-57.1,-323.1,3.7,"d"],[-60.9,-278.2,4.9,"d"],[-55.8,-266.1,3.5,"p"],[-54.9,-261.2,3.0,"d"],[-56.8,-246.1,3.8,"p"],[-54.1,-236.7,3.9,"d"],[-57.7,-230.6,3.5,"p"],[-57.8,-222.3,3.9,"p"],[-55.6,-215.5,2.7,"p"],[-58.4,-186.6,3.5,"p"],[-60.3,-180.3,5.1,"d"],[-58.1,-117.7,3.2,"d"],[-56.4,-96.9,4.5,"s"],[-54.7,-76.3,2.9,"p"],[-57.1,-51.9,3.1,"s"],[-59.7,-39.6,3.4,"p"],[-59.4,-34.4,3.0,"d"],[-61.0,-5.9,2.9,"p"],[-58.9,5.5,4.0,"d"],[-58.9,8.9,2.8,"d"],[-59.2,31.3,4.2,"d"],[-55.6,42.0,4.1,"d"],[-55.0,275.2,4.5,"d"],[-53.3,282.6,3.2,"d"],[-56.4,292.3,3.6,"p"],[-44.6,-335.9,2.7,"p"],[-46.9,-330.5,4.2,"d"],[-51.5,-323.8,3.1,"d"],[-51.7,-265.4,4.7,"d"],[-47.2,-240.1,3.9,"d"],[-49.2,-229.3,5.0,"s"],[-45.1,-21.9,2.9,"s"],[-48.5,-16.6,5.2,"d"],[-46.4,-1.2,3.5,"d"],[-49.4,16.6,3.1,"d"],[-51.5,28.8,3.4,"m"],[-49.3,35.1,3.0,"d"],[-48.5,57.2,3.8,"p"],[-50.2,88.7,3.9,"d"],[-52.0,207.1,3.7,"p"],[-46.2,255.6,5.2,"d"],[-44.8,284.4,4.1,"d"],[-49.7,293.4,3.6,"s"],[-48.7,300.4,2.9,"d"],[-37.0,-355.4,2.9,"d"],[-37.3,-346.1,3.0,"d"],[-37.9,-337.8,4.9,"d"],[-41.8,-327.2,3.0,"d"],[-37.2,-323.9,3.0,"d"],[-36.7,-313.8,3.5,"d"],[-40.2,-222.7,3.0,"d"],[-35.5,-174.6,4.7,"d"],[-36.9,-167.8,4.2,"d"],[-35.9,-92.6,5.1,"d"],[-40.8,-88.5,4.2,"d"],[-36.1,-69.3,3.6,"d"],[-35.5,-59.3,4.3,"d"],[-42.9,-51.7,3.3,"d"],[-41.5,-42.9,4.5,"d"],[-42.5,-30.7,4.7,"d"],[-40.3,-25.5,5.0,"d"],[-39.3,-16.0,3.2,"d"],[-36.4,-5.4,3.1,"p"],[-39.7,4.8,5.2,"d"],[-41.6,9.7,4.1,"d"],[-41.3,29.0,3.0,"p"],[-40.4,38.3,5.1,"d"],[-36.2,56.5,4.1,"d"],[-39.0,172.2,3.0,"d"],[-35.9,279.1,3.9,"d"],[-38.5,292.1,4.8,"d"],[-40.0,297.7,3.1,"d"],[-32.3,-332.2,3.7,"p"],[-29.9,-322.8,3.8,"p"],[-32.9,-308.5,2.8,"d"],[-27.5,-280.1,2.9,"p"],[-33.2,-253.3,4.1,"p"],[-30.3,-167.1,3.7,"p"],[-31.5,-56.9,4.0,"d"],[-31.6,-53.1,4.6,"d"],[-31.3,-38.6,3.7,"d"],[-32.0,-36.7,4.7,"d"],[-31.4,-13.6,3.2,"d"],[-28.0,-8.0,4.2,"d"],[-30.7,0.2,5.0,"m"],[-31.8,10.1,3.7,"d"],[-29.4,37.2,3.2,"d"],[-28.6,60.0,3.8,"p"],[-31.5,68.9,5.1,"d"],[-26.4,165.8,2.8,"p"],[-28.7,215.7,2.9,"p"],[-33.9,274.5,3.1,"d"],[-28.8,285.4,3.3,"d"],[-32.9,293.6,3.8,"p"],[-23.1,-340.1,2.9,"s"],[-24.4,-320.1,3.1,"p"],[-24.7,-308.4,4.4,"s"],[-18.1,-231.9,3.8,"d"],[-17.8,-183.1,4.7,"d"],[-20.3,-129.2,2.8,"p"],[-23.6,-99.9,3.1,"d"],[-18.2,-89.1,4.4,"d"],[-23.6,-50.4,3.7,"d"],[-23.9,-41.7,3.1,"d"],[-20.3,-32.4,4.1,"p"],[-20.8,-15.3,3.7,"d"],[-23.1,-8.2,4.1,"d"],[-24.6,26.7,5.1,"d"],[-18.2,35.7,4.9,"d"],[-20.2,69.1,4.5,"d"],[-19.0,75.6,3.3,"d"],[-18.8,216.1,3.9,"p"],[-23.2,270.1,4.6,"d"],[-23.3,279.6,3.7,"p"],[-24.3,287.7,4.4,"d"],[-10.9,-321.5,3.8,"d"],[-10.8,-312.5,3.8,"p"],[-11.7,-301.3,3.1,"d"],[-11.1,-220.8,4.9,"s"],[-9.5,-162.3,3.2,"p"],[-13.9,-154.4,3.8,"s"],[-13.3,-112.9,4.1,"p"],[-11.4,-98.9,4.4,"d"],[-15.6,-74.8,3.9,"p"],[-13.6,-46.4,3.9,"p"],[-9.6,-35.0,2.9,"m"],[-12.8,-25.5,5.2,"d"],[-11.5,-8.8,5.0,"d"],[-9.9,-0.6,4.7,"d"],[-15.1,12.2,3.7,"d"],[-13.4,19.8,4.1,"d"],[-15.7,31.2,2.8,"d"],[-10.0,42.1,3.9,"d"],[-10.2,44.2,3.2,"d"],[-12.6,55.4,3.8,"d"],[-14.5,75.1,4.2,"d"],[-12.4,116.3,3.9,"p"],[-13.8,179.4,4.7,"m"],[-12.9,189.4,3.6,"p"],[-14.7,283.3,5.0,"d"],[-4.4,-314.7,3.4,"p"],[-4.4,-269.9,3.1,"d"],[-4.6,-214.9,4.1,"d"],[-4.0,-177.8,2.8,"p"],[-2.0,-66.7,2.9,"p"],[-0.1,-53.8,3.6,"d"],[-1.6,-42.5,4.8,"d"],[0.2,-21.0,4.9,"d"],[-5.4,-12.5,3.2,"p"],[0.3,-3.4,4.3,"d"],[-3.9,11.8,3.5,"p"],[-6.1,24.1,4.5,"d"],[-3.9,32.0,4.5,"d"],[-0.3,35.9,3.2,"d"],[-0.9,46.3,3.5,"d"],[-4.4,54.7,4.5,"d"],[-6.3,65.6,4.8,"d"],[-5.3,190.2,5.2,"d"],[-0.3,221.0,3.3,"p"],[3.8,-321.7,3.8,"d"],[5.2,-244.3,3.3,"s"],[8.7,-185.5,3.1,"p"],[2.7,-117.9,3.4,"p"],[9.6,-52.9,4.6,"d"],[2.2,-38.6,3.1,"p"],[2.7,-22.2,4.1,"d"],[6.4,-14.3,5.0,"d"],[8.2,-4.5,3.3,"d"],[8.8,0.7,4.6,"d"],[2.7,11.3,3.3,"d"],[5.8,18.1,3.0,"p"],[6.5,47.8,4.1,"d"],[6.7,59.4,3.9,"d"],[2.1,64.1,3.5,"p"],[8.8,82.2,4.6,"d"],[8.3,97.6,3.0,"p"],[4.5,245.5,4.0,"p"],[17.6,-310.9,3.0,"m"],[18.6,-301.7,3.9,"p"],[18.2,-273.4,4.0,"p"],[13.8,-256.3,3.1,"d"],[14.5,-201.7,3.5,"p"],[12.5,-199.1,3.3,"p"],[14.9,-143.6,4.8,"s"],[16.4,-55.0,5.0,"d"],[11.3,-44.9,3.9,"d"],[18.5,-36.9,3.4,"d"],[16.0,-28.0,4.7,"d"],[17.1,-3.1,3.9,"d"],[11.3,2.2,4.9,"d"],[16.7,13.9,3.8,"d"],[17.2,56.3,3.4,"p"],[13.3,66.8,4.3,"d"],[12.0,76.4,3.3,"p"],[15.5,89.8,3.1,"d"],[11.1,165.3,3.3,"p"],[15.6,248.7,3.9,"d"],[20.3,-302.4,3.1,"p"],[26.2,-247.7,3.3,"p"],[24.2,-153.7,3.0,"d"],[20.7,-54.1,4.8,"d"],[24.5,-44.1,3.7,"s"],[20.6,-37.1,5.1,"m"],[25.3,-26.6,3.9,"d"],[23.9,-8.7,3.8,"p"],[22.5,5.7,3.2,"d"],[25.2,11.4,3.0,"d"],[23.7,58.9,3.0,"d"],[27.4,65.6,3.8,"d"],[22.6,72.1,4.3,"d"],[23.4,103.4,4.1,"p"],[27.5,117.8,2.6,"p"],[25.3,228.4,3.0,"p"],[31.6,-285.4,3.6,"p"],[31.7,-239.1,4.0,"d"],[29.6,-234.4,3.5,"p"],[36.3,-224.9,3.0,"p"],[28.8,-213.4,3.4,"p"],[32.8,-168.2,3.9,"d"],[36.0,-160.5,3.7,"p"],[32.6,-152.7,3.1,"d"],[30.9,-129.2,3.0,"s"],[30.1,-71.4,3.8,"d"],[34.7,-56.7,4.9,"d"],[36.4,-51.9,3.9,"d"],[30.8,-40.5,3.9,"d"],[28.9,-30.9,5.0,"d"],[34.9,-28.3,2.8,"d"],[29.2,-4.8,2.8,"d"],[29.2,15.3,4.0,"d"],[35.4,65.0,2.9,"p"],[30.5,70.9,4.2,"d"],[34.3,99.3,2.9,"d"],[31.4,114.1,5.2,"d"],[32.2,120.2,3.6,"d"],[36.1,143.7,2.8,"p"],[31.7,214.7,3.9,"d"],[40.2,-285.6,5.2,"d"],[45.6,-268.7,4.3,"d"],[45.3,-187.1,3.7,"d"],[41.3,-148.2,4.1,"d"],[38.6,-125.8,2.8,"p"],[40.0,-61.0,4.2,"p"],[39.8,-55.4,3.0,"d"],[39.6,-44.8,3.5,"d"],[44.0,-34.4,4.9,"d"],[41.2,-25.7,3.0,"s"],[43.2,-12.8,5.2,"d"],[40.4,-3.1,4.1,"d"],[40.1,1.0,3.5,"p"],[38.3,68.5,4.8,"d"],[43.9,77.5,3.9,"d"],[42.4,87.4,3.4,"d"],[42.1,99.6,3.3,"d"],[38.3,112.8,5.1,"d"],[45.5,146.5,3.8,"p"],[52.1,-275.2,4.1,"p"],[49.3,-264.1,5.1,"d"],[46.8,-250.3,5.1,"d"],[51.6,-201.5,4.3,"d"],[47.8,-193.8,3.3,"p"],[47.0,-183.4,5.2,"s"],[47.1,-123.4,4.2,"s"],[54.2,-115.1,2.7,"p"],[47.8,-47.6,5.2,"d"],[48.7,-39.4,3.9,"d"],[51.1,-32.0,4.5,"d"],[50.5,-15.7,3.4,"d"],[49.7,-3.0,4.4,"d"],[51.6,5.4,3.2,"d"],[53.3,58.3,2.8,"p"],[49.1,67.0,3.8,"d"],[48.1,72.8,3.6,"d"],[51.3,82.2,3.6,"p"],[53.4,92.3,2.9,"p"],[47.3,103.5,3.8,"d"],[50.1,129.0,4.2,"p"],[48.6,138.3,2.9,"d"],[50.2,145.5,2.9,"p"],[51.8,211.6,3.5,"p"],[62.9,-261.5,4.2,"s"],[58.9,-248.6,3.0,"d"],[60.3,-237.1,3.3,"p"],[56.2,-189.6,3.2,"d"],[62.5,-132.9,3.2,"p"],[57.3,-106.1,3.5,"p"],[57.4,-75.5,4.0,"d"],[62.8,-61.3,3.9,"d"],[62.7,-48.2,5.1,"s"],[56.6,-39.9,3.9,"d"],[62.3,-13.8,3.9,"p"],[58.5,-3.1,4.9,"d"],[62.1,0.3,4.6,"d"],[63.0,29.2,2.6,"p"],[60.0,49.5,2.8,"d"],[59.1,63.7,3.4,"d"],[57.4,74.2,3.8,"s"],[56.1,80.0,4.2,"d"],[63.4,90.9,5.1,"d"],[58.7,217.5,3.8,"d"],[68.9,-263.6,3.2,"d"],[66.4,-254.7,5.2,"d"],[65.1,-253.1,4.8,"d"],[67.4,-216.1,5.2,"m"],[65.8,-154.3,3.4,"p"],[64.9,-108.5,2.8,"p"],[72.5,-97.6,3.2,"d"],[65.3,-64.0,3.4,"m"],[66.7,-52.5,3.8,"d"],[71.5,-39.7,5.1,"d"],[67.6,-29.9,3.2,"d"],[70.8,-20.5,4.7,"d"],[71.5,-18.2,4.2,"d"],[68.2,49.6,2.9,"d"],[68.4,55.0,2.9,"p"],[72.4,64.7,4.6,"d"],[65.7,89.3,2.8,"p"],[65.0,120.5,3.1,"p"],[74.5,-257.9,3.8,"p"],[78.9,-246.8,2.7,"p"],[78.5,-159.3,4.0,"p"],[78.8,-60.4,3.3,"p"],[74.2,-41.1,3.4,"d"],[74.7,-33.7,4.5,"d"],[76.8,-17.6,4.5,"d"],[76.9,-9.2,3.8,"d"],[80.0,1.6,3.1,"d"],[78.1,7.7,3.5,"p"],[78.5,83.5,2.9,"p"],[77.9,186.0,2.9,"p"],[78.2,193.0,3.8,"d"],[75.0,202.6,3.3,"d"],[82.8,-246.1,4.7,"d"],[84.0,-124.3,3.0,"p"],[85.3,-38.5,4.3,"d"],[89.7,-37.3,3.2,"d"],[83.7,-14.0,4.9,"s"],[89.7,0.7,2.8,"d"],[88.5,54.0,3.9,"p"],[85.0,62.2,3.8,"p"],[82.8,113.0,3.9,"p"],[86.9,143.4,3.0,"d"],[90.6,162.6,3.3,"d"],[88.7,173.4,3.3,"d"],[83.8,179.8,2.9,"d"],[86.1,189.4,3.8,"m"],[95.6,-231.4,5.0,"d"],[96.8,-67.0,3.1,"p"],[96.0,-43.9,3.0,"d"],[99.7,-30.8,5.1,"d"],[95.9,-23.5,2.7,"p"],[96.2,-6.0,2.9,"d"],[98.7,5.8,4.0,"d"],[96.3,14.0,3.3,"d"],[96.1,53.3,5.1,"d"],[98.6,63.5,3.1,"d"],[92.7,89.1,5.0,"d"],[98.1,148.8,3.4,"p"],[97.9,153.3,5.2,"d"],[99.3,166.3,3.3,"d"],[98.2,174.6,2.8,"d"],[94.5,180.8,3.6,"d"],[108.4,-219.4,2.9,"d"],[101.2,-129.8,3.1,"d"],[107.2,-19.4,3.7,"d"],[101.2,-3.2,3.0,"d"],[105.5,3.8,3.8,"d"],[106.8,8.7,4.1,"d"],[103.5,63.0,4.1,"p"],[107.4,121.6,3.9,"p"],[101.0,150.0,5.2,"d"],[102.4,159.5,5.1,"d"],[107.7,166.5,4.9,"d"],[104.9,174.2,3.4,"d"],[110.8,-225.3,3.5,"m"],[116.7,-215.5,2.9,"d"],[113.8,-55.2,3.1,"d"],[117.3,-8.9,4.7,"d"],[114.5,0.0,4.8,"d"],[114.0,13.7,4.2,"p"],[110.3,54.9,4.4,"d"],[113.9,68.8,5.1,"d"],[114.4,83.7,4.4,"d"],[110.0,167.0,3.5,"m"],[120.0,-210.8,5.0,"d"],[121.7,-207.7,3.6,"d"],[121.2,-52.9,3.9,"p"],[126.3,-44.5,3.5,"p"],[124.8,-4.6,4.3,"m"],[123.5,0.3,5.0,"d"],[125.9,12.8,3.6,"p"],[126.1,54.4,3.9,"p"],[125.1,68.0,5.1,"d"],[121.8,76.7,3.2,"d"],[125.9,84.9,4.0,"d"],[132.5,-206.4,5.0,"d"],[129.1,-196.7,4.2,"d"],[131.0,-34.4,3.0,"d"],[128.4,-2.9,3.0,"p"],[133.1,4.5,5.0,"d"],[133.4,55.2,2.8,"p"],[131.2,66.0,3.4,"p"],[130.7,73.5,4.1,"p"],[134.5,80.4,3.6,"d"],[133.8,93.8,3.5,"p"],[134.1,184.9,4.5,"d"],[142.3,-194.5,4.0,"d"],[137.2,-188.0,4.7,"d"],[143.9,-49.3,4.1,"p"],[137.1,-36.9,3.6,"d"],[139.4,-16.3,3.1,"s"],[140.4,-6.8,4.7,"d"],[140.3,0.9,3.1,"s"],[137.6,49.6,3.5,"d"],[139.9,53.5,4.9,"d"],[138.0,65.3,2.9,"p"],[148.7,-189.4,4.8,"d"],[146.3,-180.2,5.1,"m"],[147.2,-98.2,3.8,"d"],[150.5,-66.4,3.9,"d"],[152.0,-23.3,4.9,"d"],[149.1,-15.1,4.9,"s"],[146.7,-6.2,3.8,"d"],[152.8,6.4,3.4,"d"],[149.0,7.7,4.0,"d"],[147.5,47.4,4.1,"d"],[150.6,54.2,4.2,"d"],[148.9,67.3,2.8,"d"],[150.7,149.3,5.1,"d"],[152.1,152.8,4.8,"d"],[151.4,161.8,3.8,"p"],[158.3,-178.6,3.2,"d"],[159.7,-169.2,4.9,"m"],[155.0,-97.0,4.5,"d"],[155.5,-85.6,3.3,"d"],[155.4,-75.6,3.0,"d"],[156.0,-66.2,4.3,"d"],[158.8,-60.1,3.2,"p"],[161.9,-39.4,3.0,"d"],[159.0,-36.5,3.0,"d"],[154.8,-26.9,3.7,"d"],[155.5,3.7,5.1,"d"],[161.8,53.8,3.3,"d"],[156.8,83.1,3.3,"p"],[160.9,131.9,4.4,"d"],[160.2,156.3,4.8,"s"],[164.3,-171.8,4.8,"d"],[169.9,-160.0,2.9,"m"],[164.0,-63.5,4.3,"d"],[167.0,-48.0,5.1,"d"],[168.3,-29.8,4.8,"d"],[171.5,-25.7,3.3,"p"],[164.3,-16.9,4.2,"d"],[164.6,-6.9,4.2,"d"],[165.6,2.1,3.9,"d"],[166.0,44.3,4.5,"d"],[169.4,58.7,2.9,"d"],[169.8,73.2,4.0,"p"],[169.9,130.2,2.9,"m"],[168.0,140.2,3.5,"d"],[168.1,142.8,3.8,"d"],[178.1,-159.8,3.8,"d"],[174.5,-77.7,4.7,"d"],[179.2,-66.5,3.9,"d"],[175.0,-62.1,4.0,"d"],[175.9,-47.5,4.2,"d"],[177.7,-39.3,3.6,"d"],[175.0,-31.7,4.7,"d"],[178.8,-25.2,3.7,"d"],[175.4,-17.7,3.9,"d"],[176.9,40.5,3.8,"d"],[173.6,49.0,4.6,"d"],[180.3,57.8,3.5,"d"],[177.3,71.0,3.9,"p"],[186.6,-134.9,3.3,"d"],[189.3,-87.5,5.0,"d"],[187.9,-78.3,3.9,"d"],[188.3,-65.7,2.9,"d"],[188.1,-58.0,4.5,"d"],[186.5,-39.0,4.1,"d"],[182.6,-25.1,3.4,"d"],[187.7,-18.7,3.4,"p"],[184.7,28.7,2.7,"p"],[183.4,49.1,4.6,"s"],[188.8,54.1,3.2,"d"],[183.7,66.5,5.0,"d"],[188.2,123.2,3.6,"p"],[185.9,127.9,2.6,"p"],[185.9,141.5,2.8,"p"],[198.5,-145.3,3.3,"d"],[192.6,-116.2,3.8,"p"],[193.3,-102.5,2.9,"d"],[194.8,-74.5,3.9,"d"],[198.7,-69.2,2.7,"p"],[198.3,-52.0,3.9,"d"],[192.8,-44.2,4.3,"d"],[194.0,-37.0,2.8,"d"],[193.4,-24.6,2.8,"d"],[195.9,31.4,3.4,"p"],[192.9,37.1,2.9,"d"],[194.5,51.1,4.0,"d"],[197.7,59.1,2.9,"d"],[191.1,63.0,3.5,"d"],[197.8,74.9,4.9,"m"],[196.7,81.4,3.7,"p"],[197.2,118.7,2.7,"p"],[202.6,-140.1,4.5,"d"],[203.6,-131.8,3.2,"d"],[202.9,-107.8,2.6,"p"],[200.4,-72.4,4.3,"d"],[203.1,-48.0,3.6,"p"],[202.3,-39.3,2.9,"d"],[205.6,-36.6,4.8,"d"],[203.6,-24.4,3.1,"p"],[200.7,36.6,4.4,"d"],[202.9,50.4,3.9,"d"],[201.4,69.4,3.7,"p"],[201.2,71.1,4.3,"d"],[215.8,-126.9,3.9,"d"],[213.6,-107.8,5.0,"d"],[210.3,-44.2,2.8,"d"],[209.7,-29.9,3.8,"d"],[213.2,-21.0,3.4,"d"],[210.4,-16.2,2.9,"d"],[208.7,45.7,5.0,"d"],[211.8,60.5,3.7,"d"],[209.4,65.7,4.9,"d"],[211.6,76.2,3.8,"d"],[214.4,81.5,4.9,"d"],[217.9,-124.4,4.3,"d"],[224.5,-111.0,3.3,"d"],[221.2,-88.5,3.5,"d"],[221.6,-67.5,3.8,"d"],[220.5,-44.5,3.8,"d"],[221.3,-19.2,3.0,"p"],[224.2,-9.3,3.2,"s"],[221.3,48.7,4.0,"p"],[221.7,53.0,3.8,"d"],[218.7,63.7,4.3,"d"],[224.6,73.4,4.5,"d"],[223.7,85.7,3.1,"d"],[223.0,119.7,4.5,"m"],[224.1,125.0,4.0,"p"],[230.9,-108.1,4.3,"d"],[233.0,-99.6,3.4,"d"],[228.1,-71.7,3.4,"p"],[227.7,-51.2,4.5,"m"],[234.6,-44.2,4.5,"d"],[232.7,-36.6,4.1,"d"],[231.5,-15.8,4.3,"s"],[232.9,3.1,3.8,"d"],[230.1,10.1,4.0,"d"],[233.3,35.2,3.8,"d"],[228.1,43.9,3.0,"p"],[230.5,55.1,3.0,"p"],[232.8,63.8,5.1,"d"],[230.4,74.9,4.9,"d"],[232.6,91.9,3.8,"p"],[238.8,-57.5,3.4,"d"],[242.7,-39.6,3.9,"d"],[236.1,-35.0,4.2,"d"],[239.6,-23.6,4.7,"d"],[239.4,-18.0,4.4,"d"],[241.9,-10.1,3.6,"d"],[242.7,3.4,4.5,"d"],[239.0,11.8,2.8,"d"],[238.0,20.1,3.6,"p"],[237.9,31.9,4.8,"d"],[242.3,40.2,2.9,"s"],[236.2,46.0,4.3,"d"],[243.0,53.2,3.4,"p"],[236.7,64.9,3.5,"d"],[236.8,73.5,4.3,"d"],[239.5,94.5,4.0,"d"],[246.9,-87.7,4.2,"d"],[246.3,-14.4,3.3,"d"],[252.1,9.4,3.5,"d"],[249.8,38.8,3.2,"d"],[246.2,47.9,4.2,"d"],[246.7,59.9,3.1,"d"],[246.1,66.3,3.6,"d"],[255.2,-90.7,4.4,"d"],[256.5,-58.2,2.9,"p"],[261.4,-18.8,4.4,"d"],[256.9,-9.8,3.2,"s"],[261.3,6.3,5.0,"d"],[256.6,9.3,4.8,"d"],[260.8,17.6,4.7,"d"],[255.6,32.7,3.0,"d"],[256.4,42.0,3.8,"d"],[261.3,47.0,4.2,"d"],[259.3,70.9,3.9,"p"],[264.2,-78.7,3.2,"d"],[269.4,-71.4,3.7,"d"],[268.3,-58.6,4.1,"d"],[263.1,-18.1,3.7,"d"],[266.0,-9.1,4.6,"d"],[264.3,4.4,3.1,"m"],[270.6,8.0,3.9,"d"],[264.8,21.6,4.7,"d"],[265.5,29.3,4.0,"d"],[270.2,38.8,4.1,"d"],[263.8,51.5,4.8,"d"],[268.1,60.5,3.2,"p"],[269.0,65.4,3.9,"d"],[269.6,90.1,3.5,"p"],[278.8,-70.1,2.8,"p"],[272.5,-60.3,3.9,"p"],[279.0,-48.3,3.5,"d"],[278.3,-18.4,4.4,"d"],[275.1,-3.2,4.4,"d"],[275.4,4.0,5.1,"d"],[278.0,8.5,4.5,"d"],[278.5,21.1,4.8,"d"],[276.3,29.0,4.2,"d"],[279.5,37.5,2.8,"p"],[274.1,51.2,4.3,"d"],[274.6,56.1,3.6,"d"],[272.2,66.9,2.9,"d"],[276.4,83.1,3.9,"d"],[273.9,90.9,4.7,"d"],[281.9,-67.7,2.9,"d"],[285.9,-56.9,4.8,"m"],[282.0,-53.0,3.4,"s"],[285.2,-42.8,5.2,"d"],[288.6,3.4,4.2,"d"],[283.1,11.6,3.0,"d"],[283.2,22.4,4.0,"p"],[281.9,33.4,4.9,"d"],[287.4,37.0,4.7,"d"],[285.5,44.2,3.0,"p"],[284.4,76.1,5.0,"d"],[290.0,-56.7,4.7,"d"],[297.4,-48.4,3.0,"d"],[294.0,-40.5,4.0,"d"],[294.2,-31.4,3.8,"d"],[297.4,-25.1,5.1,"d"],[292.5,2.6,4.0,"p"],[297.4,11.3,3.5,"d"],[289.8,17.6,3.2,"d"],[297.5,37.7,2.9,"d"],[294.9,45.6,3.7,"d"],[296.3,53.1,5.2,"d"],[295.9,62.7,5.2,"s"],[292.3,71.9,3.3,"d"],[300.5,-42.3,5.0,"d"],[305.7,-37.1,3.1,"d"],[302.9,1.4,3.5,"d"],[303.3,11.3,4.4,"m"],[300.5,19.2,3.2,"p"],[305.8,28.3,3.1,"d"],[301.5,42.0,2.8,"p"],[302.1,48.0,3.7,"d"],[300.6,58.8,4.5,"d"],[301.2,62.8,2.9,"d"],[309.0,-41.8,3.2,"s"],[314.8,-12.7,2.7,"p"],[309.7,35.7,3.2,"d"],[314.5,53.6,4.1,"p"],[310.7,63.4,3.1,"d"],[317.0,-13.8,3.9,"d"],[319.0,5.3,4.9,"d"],[319.2,62.6,3.7,"p"],[341.9,36.9,4.1,"d"],[348.7,-6.5,4.0,"p"],[350.4,24.2,3.2,"s"]],"named":{"三百年の松":[32.0,-277.3],"潮入の池":[-64.0,75.2],"庚申堂鴨場":[117.5,25.1],"新銭座鴨場":[-252.0,46.3],"中島の御茶屋":[-113.4,149.1],"燕の御茶屋":[-88.0,56.3],"中の御門":[-159.0,-153.9],"松の御茶屋":[-35.0,92.4],"横堀":[95.6,143.5],"鷹の御茶屋":[-67.2,52.7],"水上バス発着場":[328.2,-14.7],"大手門":[-13.1,-303.6],"将軍お上がり場":[317.4,66.6]},"ponds":[[[237.4,119.0],[238.7,117.6],[240.5,119.5],[245.3,116.1],[243.6,114.2],[246.0,112.5],[241.4,106.9],[243.1,105.5],[239.1,101.9],[236.6,101.7],[227.5,96.2],[225.1,99.2],[228.3,103.7],[228.4,108.6]],[[20.7,51.0],[25.1,53.2],[40.7,54.8],[47.6,53.7],[63.4,44.8],[71.1,42.6],[76.9,43.0],[86.5,47.2],[90.9,53.2],[93.4,51.6],[97.5,50.8],[102.8,53.4],[104.2,54.8],[110.5,47.2],[116.1,47.4],[121.1,49.9],[125.1,51.0],[134.1,44.6],[139.6,43.0],[155.2,43.9],[161.4,42.1],[169.5,37.7],[181.4,23.8],[185.9,22.7],[196.9,27.5],[201.3,26.6],[204.8,27.8],[207.7,30.4],[210.1,37.3],[212.9,40.8],[216.9,40.6],[229.5,32.4],[227.0,30.0],[228.8,20.2],[223.9,9.2],[214.5,1.2],[209.8,-10.8],[206.3,-15.7],[200.6,-18.5],[195.1,-18.7],[187.4,-15.7],[189.2,-12.5],[187.5,-9.6],[180.2,-6.3],[172.0,-1.0],[168.7,2.9],[163.6,5.0],[148.8,14.0],[143.8,13.4],[143.4,11.1],[144.9,9.8],[143.6,7.6],[133.2,14.0],[115.6,15.1],[96.4,17.6],[91.4,13.3],[91.0,10.9],[92.9,7.4],[79.3,13.6],[73.8,13.4],[70.7,10.9],[70.0,8.5],[71.8,5.6],[70.5,3.6],[51.5,8.7],[47.3,8.2],[36.5,3.4],[33.5,6.0],[36.8,10.0],[35.4,13.6],[31.1,17.1],[14.7,20.4],[7.0,20.9],[2.2,24.4],[5.9,34.8],[13.0,38.8],[16.1,45.7]],[[-150.8,176.3],[-150.4,182.1],[-144.7,188.7],[-136.8,192.4],[-131.9,197.1],[-132.6,212.1],[-129.2,217.3],[-116.3,219.9],[-113.9,219.4],[-110.5,215.9],[-107.0,218.4],[-109.7,223.4],[-103.3,226.3],[-100.6,223.9],[-91.0,229.7],[-85.6,229.6],[-79.3,227.4],[-75.8,223.7],[-69.8,214.6],[-67.6,209.7],[-66.9,205.5],[-63.9,200.9],[-59.5,197.8],[-56.6,193.8],[-53.1,193.8],[-51.3,195.5],[-46.9,194.4],[-43.0,191.6],[-37.2,194.7],[-34.8,198.6],[-27.5,204.9],[-13.4,204.9],[-8.1,209.5],[-3.1,215.2],[2.9,217.2],[11.9,216.4],[16.7,220.8],[21.1,219.5],[25.1,214.4],[34.1,211.5],[46.3,202.9],[48.0,198.9],[48.2,194.9],[49.6,192.5],[54.4,190.7],[63.2,191.8],[69.2,188.5],[81.7,177.4],[83.9,171.0],[83.4,164.1],[82.8,159.5],[78.4,148.0],[79.7,141.1],[82.6,137.5],[87.6,139.3],[97.6,144.9],[107.9,151.9],[115.4,154.4],[121.5,153.0],[127.1,149.1],[131.7,143.5],[137.4,138.2],[150.9,131.4],[159.4,128.9],[179.9,124.9],[188.5,121.4],[196.9,112.1],[200.4,100.3],[211.2,94.2],[218.7,94.8],[221.0,91.7],[199.3,86.9],[195.1,84.0],[187.4,75.8],[183.0,74.5],[175.1,75.4],[165.6,79.8],[150.6,91.1],[122.9,99.2],[116.9,99.9],[112.8,103.2],[111.2,106.8],[113.6,117.9],[113.6,126.0],[110.5,127.8],[107.2,126.0],[99.3,117.0],[87.9,113.9],[75.1,119.2],[60.3,127.6],[52.8,135.8],[51.7,140.9],[53.5,148.4],[52.4,152.6],[43.4,149.3],[34.3,151.0],[25.8,159.2],[9.3,199.5],[6.6,202.6],[3.1,203.5],[-0.4,200.4],[-5.1,194.4],[-11.4,191.8],[-18.7,190.2],[-25.1,190.9],[-30.2,189.3],[-33.7,185.6],[-37.9,183.1],[-41.4,178.7],[-41.4,172.5],[-37.0,164.3],[-24.4,147.1],[-19.4,136.9],[-19.1,129.1],[-23.6,127.1],[-23.1,122.1],[-16.5,122.1],[-15.9,111.6],[-17.2,106.6],[-33.7,104.6],[-43.4,100.3],[-57.9,91.9],[-68.5,83.5],[-78.8,77.6],[-100.6,53.0],[-109.0,42.6],[-111.9,36.6],[-115.9,9.8],[-111.0,2.0],[-108.9,-6.6],[-116.1,-12.5],[-130.7,-5.1],[-134.1,-0.2],[-130.3,12.2],[-119.5,11.0],[-116.1,45.4],[-119.1,55.0],[-126.0,63.6],[-135.2,78.6],[-143.1,88.6],[-147.6,92.0],[-152.6,97.9],[-154.6,103.7],[-154.4,110.7],[-152.8,115.4],[-146.9,119.8],[-143.8,123.6],[-143.1,130.5],[-148.8,136.2],[-156.6,134.0],[-170.0,134.4],[-171.8,149.9],[-170.2,158.1],[-164.3,168.3],[-154.6,170.1]],[[6.7,-124.3],[8.8,-117.5],[16.8,-107.3],[33.3,-95.8],[51.8,-79.4],[53.4,-82.2],[61.8,-77.0],[63.8,-80.4],[67.8,-77.9],[65.9,-74.6],[72.2,-70.3],[125.5,-17.9],[133.7,-25.8],[82.5,-77.0],[72.7,-85.3],[70.6,-82.3],[66.5,-85.4],[68.7,-89.1],[11.9,-143.2],[72.8,-238.7],[67.1,-243.7],[58.4,-232.0],[49.0,-237.7],[22.4,-201.8],[-8.3,-155.7],[-11.0,-147.5],[-16.4,-142.2],[-2.4,-129.3]],[[-289.0,70.6],[-279.7,70.3],[-276.2,77.7],[-267.5,81.8],[-264.8,89.0],[-256.2,85.1],[-255.7,78.4],[-258.7,75.2],[-255.6,70.8],[-239.2,73.3],[-215.8,68.5],[-222.7,66.0],[-222.0,61.4],[-218.7,57.9],[-213.5,57.2],[-213.0,52.3],[-204.4,44.2],[-207.4,40.9],[-208.3,35.2],[-214.6,34.0],[-219.1,27.2],[-218.4,21.0],[-207.9,19.0],[-206.6,13.2],[-222.8,17.0],[-227.6,13.7],[-231.3,16.1],[-237.8,14.3],[-242.5,7.4],[-247.0,9.4],[-249.6,14.7],[-254.1,13.7],[-272.7,21.0],[-286.3,39.7],[-295.2,47.1],[-300.8,57.8],[-295.5,66.3],[-292.8,69.1]]],"holes":[[[71.9,23.6],[73.5,26.7],[72.8,30.9],[68.6,33.2],[54.3,32.7],[53.6,31.3],[53.7,24.3],[54.4,23.1],[70.7,22.9]],[[196.8,-0.6],[198.6,1.9],[200.3,8.0],[198.2,9.3],[195.0,9.3],[190.3,10.5],[185.4,11.1],[183.5,10.4],[182.4,7.4],[182.5,4.1],[184.2,1.7],[193.6,-1.1]],[[-246.1,36.3],[-238.2,38.3],[-236.7,42.7],[-237.1,49.9],[-249.9,57.9],[-254.3,58.7],[-260.3,55.4],[-262.4,48.1],[-260.4,42.5],[-257.7,42.9]],[[-121.6,130.4],[-119.1,129.7],[-117.6,130.1],[-112.2,132.1],[-110.8,133.9],[-108.4,142.1],[-110.0,144.4],[-106.1,147.1],[-106.7,148.2],[-104.4,151.3],[-104.3,152.6],[-106.3,155.2],[-104.5,156.3],[-104.6,157.0],[-101.2,159.8],[-105.2,165.9],[-108.3,163.8],[-110.5,167.0],[-116.8,162.7],[-118.4,163.0],[-118.1,164.0],[-120.4,164.6],[-123.7,164.0],[-126.1,164.4],[-128.9,162.5],[-132.3,166.8],[-140.4,160.0],[-136.9,154.9],[-136.9,152.6],[-138.8,146.1],[-141.6,143.3],[-135.2,136.0],[-124.2,134.0]],[[-99.2,91.7],[-96.9,92.0],[-96.3,93.3],[-93.6,95.5],[-92.1,97.7],[-93.8,100.7],[-93.5,104.2],[-90.8,108.3],[-93.5,110.9],[-95.5,110.3],[-99.0,107.8],[-99.2,104.4],[-104.2,104.3],[-106.2,103.1],[-104.9,100.6],[-106.9,97.8],[-108.1,93.6],[-103.1,91.3],[-101.7,92.6]],[[-82.8,85.7],[-87.2,87.6],[-89.5,85.9],[-87.9,82.6],[-83.3,82.6]]]}};
// ===== Tokyo International Forum (Rafael Viñoly, 1996): the Glass Hall and the four hall blocks =====
// On the real OSM outlines: the hall blocks w144508545 (parts: the street-side strip 61 m, the rest 47 m) and the Glass Hall
// w144508541 (the lens-shaped atrium part 60 m tall, the conference strip along the railway 37 m). The atrium roof is a 208 m
// ship-hull truss with fishbone ribs at 3.5 m resting on two 50 m columns (Obayashi works record); glass walls on cable trusses.
// Anchor = the hall-block centroid, rot 0 (local x east, z south). r covers the Glass Hall too.
{
const LAT = 35.676897, LON = 139.763586, RR = 146;
LANDMARKS.tyforum = {zh:'东京国际论坛', en:'Tokyo International Forum', cat:'new', r:RR, h:61,
  lt:{m:1, c:'#e6eefc', k:0.75},
  build(){
    const g = new THREE.Group(), B = mkBatch(), G = mkGround(LAT, LON, RR), D = D_TYX.FORUM, gl = G.gl;
    const GRAN = {c:'#b4ada1', m:0, lc:'#f3ead8', lk:0.45}, GRAN2 = {c:'#99928a', m:0, lk:0.35}, WIN = {c:'#55636e', m:1, fh:4.4, cw:3.4},
      GLS = {c:'#6c8190', m:1, fh:4.4, cw:3.0}, STEEL = {c:'#d9dde0', m:0, lc:'#eef4ff', lk:0.85, e:0.6}, ROOF = '#8e959b', DARK = '#3e464d',
      ATR = {c:'#a9c2d2', op:0.34, ds:true, glow:'#d9e8ff', gk:0.42}, MUL = {c:'#cfd5da', m:0, lc:'#f2f6ff', lk:0.6}, TRK = '#5b4a3c', LEAF = {c:'#56723f', m:0, lk:0.25}, COLM = {c:'#e4e6e6', m:0, lc:'#ffffff', lk:1.1};
    const hb = D.hb, gc = cen(hb), g0 = gl(gc[0], gc[1]);
    // ---- the hall blocks: the 61 m strip on the street side, the 47 m blocks towards the plaza, two stair towers
    const parts = D.parts.slice().sort((a, b) => b.r.length - a.r.length);
    for (const p of D.parts){
      const P = p.r, c = cen(P), y0 = plinth(B.a(GRAN2), gl, P, gl(c[0], c[1]) - 0.2, 1.5), top = gl(c[0], c[1]) + p.t, tall = p.t > 55, big = P.length > 8;
      prism(B.a(tall ? GRAN : GLS), P, gl(c[0], c[1]) - 0.3, top, true);
      if (big && tall){
        // granite street front: deep-set square windows in a grid, a taller glazed ground floor
        ringWins(B.a(WIN), P, gl(c[0], c[1]), Math.floor(p.t/4.4) - 1, 4.4, 4.2, 2.6, 2.4, 6, 1.3, 0.08);
        for (let y = 8.8; y < p.t - 2; y += 8.8) band(B.a(GRAN2), P, gl(c[0], c[1]) + y, gl(c[0], c[1]) + y + 0.45, 0.25);
        band(B.a(GRAN2), P, top - 1.6, top, 0.35);
      } else if (big){
        // the plaza-side blocks: glass curtain walls between granite piers, granite floor bands every second floor
        ringFins(B.a(GRAN), P, gl(c[0], c[1]), top - 1.2, 7.2, 0.9, 0.7, 5);
        for (let y = 8.8; y < p.t - 2; y += 8.8) band(B.a(GRAN), P, gl(c[0], c[1]) + y, gl(c[0], c[1]) + y + 0.7, 0.3);
        band(B.a(GRAN), P, top - 2.0, top, 0.35);
        band(B.a(GRAN2), P, gl(c[0], c[1]) - 0.3, gl(c[0], c[1]) + 1.2, 0.2);
      }
      void y0;
    }
    // roof plant on the blocks (kept low, set back)
    { const P = parts[0].r, c = cen(P), t = gl(c[0], c[1]) + parts[0].t; const q = orect(P);
      for (const s of [-0.3, 0, 0.3]){ const f = F(q.cx, q.cz, q.ang); fbox(B.a(ROOF), f, q.ang, s*q.L, 0, 14, Math.min(10, q.W*0.5), t, t + 3.2); } }
    // ---- the Glass Hall
    const GA = D.gla, tipS = GA[0], tipN = GA.reduce((a, p) => (p[1] < a[1] ? p : a), GA[0]);
    const ax = tipN[0] - tipS[0], az = tipN[1] - tipS[1], AL = Math.hypot(ax, az), dx = ax/AL, dz = az/AL, nx = -dz, nz = dx;   // n = across (towards the east side)
    const mid = [(tipS[0] + tipN[0])/2, (tipS[1] + tipN[1])/2], gm = gl(mid[0], mid[1]), yR = gm + 60, yE = gm + 37;
    const at = s => [mid[0] + dx*s, mid[1] + dz*s];                 // s along the axis from the middle (- = south)
    const span = s => { const p = at(s), r = crossSpan(GA, p[0], p[1], nx, nz); return r; };
    // the glass walls of the atrium (from below the lowest ground to the roof edge), mullions on the 3.5 m rib grid, transoms
    const GAo = GA;
    for (let i = 0; i < GAo.length; i++){ const p = GAo[i], q = GAo[(i + 1) % GAo.length], yb0 = gl(p[0], p[1]) - 0.6, yb1 = gl(q[0], q[1]) - 0.6;
      quad(B.a(ATR), [p[0], yb0, p[1]], [q[0], yb1, q[1]], [q[0], yR - 0.4, q[1]], [p[0], yR - 0.4, p[1]]); }
    ringFins(B.a(MUL), GAo, gm - 0.5, yR - 0.4, 3.5, 0.22, 0.45, 2);
    for (let y = gm + 7; y < yR - 2; y += 7) band(B.a(MUL), GAo, y, y + 0.22, 0.12);
    // the roof: a slightly cambered steel lid with a fascia, over the atrium lens
    { const n = 40, Lh = AL/2, top = [], low = [];
      for (let i = 0; i <= n; i++){ const s = -Lh + AL*i/n, r = span(s); if (!r) continue; top.push([s, r[0], r[1]]); }
      for (let i = 0; i + 1 < top.length; i++){ const [s0, a0, b0] = top[i], [s1, a1, b1] = top[i + 1], P0 = at(s0), P1 = at(s1), cam = s => 0.9*(1 - Math.pow(s/Lh, 2));
        const A0 = [P0[0] + nx*a0, yR + cam(s0)*0.2, P0[1] + nz*a0], B0 = [P0[0] + nx*b0, yR + cam(s0)*0.2, P0[1] + nz*b0], A1 = [P1[0] + nx*a1, yR + cam(s1)*0.2, P1[1] + nz*a1], B1 = [P1[0] + nx*b1, yR + cam(s1)*0.2, P1[1] + nz*b1];
        const C0 = [P0[0] + nx*(a0 + b0)/2, yR + cam(s0), P0[1] + nz*(a0 + b0)/2], C1 = [P1[0] + nx*(a1 + b1)/2, yR + cam(s1), P1[1] + nz*(a1 + b1)/2];
        quad(B.a(ROOF), A0, A1, C1, C0); quad(B.a(ROOF), C0, C1, B1, B0);
        // fascia
        quad(B.a(STEEL), [A0[0], yR - 1.4, A0[2]], [A1[0], yR - 1.4, A1[2]], A1, A0); quad(B.a(STEEL), [B1[0], yR - 1.4, B1[2]], [B0[0], yR - 1.4, B0[2]], B0, B1); }
      void low; }
    // the ship-hull truss: a keel curving down between the two columns, fishbone ribs every 3.5 m up to the roof edges
    const colS = 62, keelY = s => { const t = Math.abs(s)/(AL/2); return yR - 3.2 - 9.5*Math.max(0, 1 - t*t*1.05); };
    let prevK = null;
    for (let s = -AL/2 + 4; s <= AL/2 - 4; s += 3.5){
      const r = span(s); if (!r) continue; const P = at(s), cm = (r[0] + r[1])/2, K = [P[0] + nx*cm, keelY(s), P[1] + nz*cm];
      const W0 = [P[0] + nx*(r[0] + 0.8), yR - 1.5, P[1] + nz*(r[0] + 0.8)], E0 = [P[0] + nx*(r[1] - 0.8), yR - 1.5, P[1] + nz*(r[1] - 0.8)];
      const Mw = [(W0[0] + K[0])/2, (W0[1] + K[1])/2 + (yR - K[1])*0.22, (W0[2] + K[2])/2], Me = [(E0[0] + K[0])/2, (E0[1] + K[1])/2 + (yR - K[1])*0.22, (E0[2] + K[2])/2];
      beam(B.a(STEEL), W0, Mw, 0.35); beam(B.a(STEEL), Mw, K, 0.35); beam(B.a(STEEL), K, Me, 0.35); beam(B.a(STEEL), Me, E0, 0.35);
      beam(B.a(STEEL), K, [K[0], yR - 1.2, K[2]], 0.18);
      if (prevK){ beam(B.a(COLM), prevK, K, 1.2); }
      prevK = K;
    }
    // the two columns: tapered at both ends (1.3 m to 4.5 m diameter), 50 m tall, carrying the keel
    for (const sc of [-colS, colS]){ const P = at(sc), r = span(sc), cm = r ? (r[0] + r[1])/2 : 0, x = P[0] + nx*cm, z = P[1] + nz*cm, y0 = gl(x, z) - 0.3, y1 = keelY(sc);
      const N = 8; for (let i = 0; i < N; i++){ const t0 = i/N, t1 = (i + 1)/N, rr = t => 0.65 + 1.6*Math.sin(PI*t); cyl(B.a(COLM), rr(t0), rr(t1), x, z, y0 + (y1 - y0)*t0, y0 + (y1 - y0)*t1, 14); }
      // the column head: four struts spreading into the keel
      for (const k of [-1, 1]) for (const w of [-1, 1]){ const Q = at(sc + k*9), r2 = span(sc + k*9); if (!r2) continue; const c2 = (r2[0] + r2[1])/2 + w*4; beam(B.a(COLM), [x, y1 - 1, z], [Q[0] + nx*c2, keelY(sc + k*9) + 0.5, Q[1] + nz*c2], 0.5); } }
    // the conference strip along the railway (37 m): glazed rooms behind a curved wall, its roof
    { const P = D.east, c = cen(P), y0 = gl(c[0], c[1]) - 0.3;
      plinth(B.a(GRAN2), gl, P, y0, 1.5);
      prism(B.a({c:'#8da5b4', m:1, fh:4.4, cw:3.0}), P, y0, yE, true);
      for (let y = gm + 4.4; y < yE - 1; y += 4.4) band(B.a(MUL), P, y, y + 0.35, 0.12);
      ringFins(B.a(MUL), P, y0, yE - 1, 3.5, 0.2, 0.3, 3);
      band(B.a(STEEL), P, yE - 1.2, yE + 0.3, 0.2);
      // the atrium's glass continues above the strip
      for (let i = 0; i < GA.length; i++){ void i; } }
    // ---- the plaza: a row of zelkova trees between the hall blocks and the Glass Hall
    { const W = GA.slice(0).sort((a, b) => b[1] - a[1]).filter(p => (p[0] - mid[0])*nx + (p[1] - mid[1])*nz < 0);
      for (let s = -AL/2 + 12; s < AL/2 - 10; s += 9.5){ const r = span(s); if (!r) continue; const P = at(s), off = r[0] - 9.5, x = P[0] + nx*off, z = P[1] + nz*off;
        if (inPoly(hb, x, z) || inPoly(hb, x + nx*-4, z + nz*-4)) continue; const y = gl(x, z);
        cyl(B.a(TRK), 0.28, 0.35, x, z, y - 0.3, y + 4.5, 6); crown(B.a(LEAF), x, y + 3.2, z, 4.2, 7.5, 7); }
      void W; }
    void gc; void g0;
    B.flush(g); return g; }};
SG_PLACES.push({type:'tyforum', lat:LAT, lon:LON, rot:0});
}
// ===== Bank of Japan Head Office (Nihonbashi Hongokuchō): the Main Building (Tatsuno Kingo, 1896), its 1930s extensions and the
// 1973 new building =====
// On the real OSM outline r3069611 (two blocks joined by a link). The south-east block is the old building: the Main Building is
// three storeys, granite to the first floor and andesite above, a U (コの字) round a forecourt that opens to the south behind a low
// screen wall with an arched gate; the dome over the centre of the front, a four-column portico under it, paired Corinthian
// columns and plain pediments on the wing ends, gabled copper roofs (Chuo City / Bank of Japan pages). East of it the Nigō-kan and
// Sangō-kan (1932-38) in the same dress. The north-west block is the new building (1973, 10 floors above ground).
// Heights: storey heights, the dome and the new building's 40 m are estimates. rot 0 (local x east, z south).
{
const LAT = 35.686572, LON = 139.771535, RR = 100;
LANDMARKS.tyboj = {zh:'日本银行本店', en:'Bank of Japan Head Office', cat:'old', r:RR, h:41,
  lt:{m:0, c:'#ffe2b8', k:0.85, e:0.55},
  build(){
    const g = new THREE.Group(), B = mkBatch(), G = mkGround(LAT, LON, RR), gl = G.gl, R = D_TYX.BOJ.ring;
    const GRAN = {c:'#bdb6a8', m:0}, AND = {c:'#cfc8b8', m:0}, RUST = {c:'#a9a294', m:0}, DARK = '#3b3f44', WIN = {c:'#4a5058', glow:'#ffd9a0', gk:0.35},
      COP = {c:'#6f9e8a', m:0, lk:0.5}, COPD = '#5a8774', NEWG = {c:'#a8a196', m:1, fh:3.9, cw:3.2}, NEWW = {c:'#4f565c', m:1, fh:3.9, cw:3.2}, ROOFF = '#9a9892', STONE = '#9a9488';
    // the two blocks of the outline
    const NW = [R[0], R[1], R[2], R[11], R[12], R[13], R[14], R[15], R[16], R[17], R[18], R[19]];
    const SE = [R[4], R[5], R[6], R[7]];
    // ---- the new building (1973): 10 floors in granite, deep vertical piers, a recessed top floor
    { const P = NW, c = cen(P), y0 = gl(c[0], c[1]), lo = plinth(B.a(RUST), gl, P, y0, 1.2), H = 40;
      prism(B.a(NEWG), P, y0, y0 + H - 4, true);
      ringFins(B.a(GRAN), P, y0 + 4.5, y0 + H - 4.5, 3.2, 0.9, 0.9, 6);
      for (let k = 1; k < 9; k++) band(B.a(GRAN), P, y0 + 4.5 + k*3.9 - 0.5, y0 + 4.5 + k*3.9, 0.35);
      band(B.a(RUST), P, y0 - 0.2, y0 + 4.5, 0.2);
      const Q = offsetRing(P, -3.0); prism(B.a(NEWW), Q, y0 + H - 4, y0 + H, false); capP(B.a(ROOFF), Q, y0 + H); capP(B.a(ROOFF), P, y0 + H - 3.95); band(B.a(GRAN), P, y0 + H - 4.6, y0 + H - 3.6, 0.5);
      void lo; }
    // ---- the old building frame: u along the south front (west -> east), n northwards into the block
    const A = SE[0], Bc = SE[1], C = SE[2], ux = (C[0] - Bc[0]), uz = (C[1] - Bc[1]), uL = Math.hypot(ux, uz), ANG = Math.atan2(-uz, ux);
    const f = F(Bc[0], Bc[1], ANG), p2 = (u, n) => f(u, -n), f3 = (u, y, n) => { const p = f(u, -n); return [p[0], y, p[1]]; };
    const box = (col, u0, u1, n0, n1, y0, y1) => fbox(B.a(col), f, ANG, (u0 + u1)/2, -(n0 + n1)/2, u1 - u0, n1 - n0, y0, y1);
    const toUN = (x, z) => { const dx = x - Bc[0], dz = z - Bc[1], c = Math.cos(ANG), s = Math.sin(ANG); return [dx*c - dz*s, -(dx*s + dz*c)]; };
    const nA = toUN(A[0], A[1])[1], nD = toUN(SE[3][0], SE[3][1])[1];
    const yF = gl(...p2(30, 30)) + 0.3;                                       // the Main Building's ground floor level
    const lo = Math.min(...SE.map(p => gl(p[0], p[1]))) - 1.5;
    // plinth / rusticated basement under the whole old block (the app's ground falls away to the west here)
    prism(B.a(RUST), SE, lo, yF, true);
    const Y1 = yF + 6.2, Y2 = yF + 17.0, YC = yF + 18.4;                       // first floor top, attic line, cornice
    // ---- the Main Building: west wing (u 0..16), east wing (u 44..60), the north main block (u 16..44, n 24..62), the forecourt
    const NB = Math.min(nA, 62) - 0.5;
    const blocks = [[0, 16, 0, NB], [44, 60, 0, NB + 0.3], [16, 44, 24, NB]];
    for (const [u0, u1, n0, n1] of blocks){
      box(GRAN, u0, u1, n0, n1, yF - 0.3, Y1);                                // granite ground floor (rusticated: bands)
      for (let y = yF + 0.9; y < Y1 - 0.3; y += 0.9) { box(RUST, u0 - 0.12, u1 + 0.12, n0 - 0.12, n1 + 0.12, y, y + 0.12); }
      box(AND, u0, u1, n0, n1, Y1, Y2);                                       // andesite upper floors
      box(GRAN, u0 - 0.5, u1 + 0.5, n0 - 0.5, n1 + 0.5, Y1, Y1 + 0.6);        // string course
      box(GRAN, u0 - 0.9, u1 + 0.9, n0 - 0.9, n1 + 0.9, Y2, YC);              // entablature + cornice
      // gabled copper roof along the block's long side
      const long = (u1 - u0) > (n1 - n0), f3b = (a, y, b) => long ? f3(a, y, b) : f3(b, y, a);
      const a0 = long ? u0 : n0, a1 = long ? u1 : n1, b0 = long ? n0 : u0, b1 = long ? n1 : u1, rh = Math.min(6.5, (b1 - b0)*0.32);
      const fb = (a, y, b) => long ? f3(a, y, b) : f3(b, y, a);
      quad(B.a(COP), fb(a0 - 0.6, YC, b0 - 0.6), fb(a1 + 0.6, YC, b0 - 0.6), fb(a1 + 0.6, YC + rh, (b0 + b1)/2), fb(a0 - 0.6, YC + rh, (b0 + b1)/2));
      quad(B.a(COP), fb(a1 + 0.6, YC, b1 + 0.6), fb(a0 - 0.6, YC, b1 + 0.6), fb(a0 - 0.6, YC + rh, (b0 + b1)/2), fb(a1 + 0.6, YC + rh, (b0 + b1)/2));
      for (const a of [a0, a1]) tri3(B.a(AND), fb(a, YC, b0), fb(a, YC + rh, (b0 + b1)/2), fb(a, YC, b1));
      void f3b;
      // windows: round-headed on the ground floor, tall on the 2nd / 3rd floors, on every face
      const faces = [[u0, n0, u1, n0], [u1, n0, u1, n1], [u1, n1, u0, n1], [u0, n1, u0, n0]];
      for (const [pa, qa, pb, qb] of faces){ const L = Math.hypot(pb - pa, qb - qa), k = Math.floor(L/4.2), du = (pb - pa)/L, dn = (qb - qa)/L, ou = dn*0.12, on = -du*0.12;
        for (let i = 0; i < k; i++){ const m = (i + 0.5)*L/k, cu = pa + du*m + ou, cn = qa + dn*m + on;
          for (const [y0, y1, w] of [[yF + 1.6, yF + 4.8, 1.4], [Y1 + 1.3, Y1 + 4.6, 1.3], [Y1 + 6.0, Y1 + 9.0, 1.2]]){
            const P0 = f3(cu - du*w/2, y0, cn - dn*w/2), P1 = f3(cu + du*w/2, y0, cn + dn*w/2); quad(B.a(WIN), P0, P1, [P1[0], y1, P1[2]], [P0[0], y1, P0[2]]); } } }
    }
    // paired Corinthian columns and a plain pediment on each wing end facing the street (south, n = 0)
    for (const [u0, u1] of [[0, 16], [44, 60]]){
      const um = (u0 + u1)/2;
      for (const du of [-5.2, -4.0, 4.0, 5.2]){ const p = p2(um + du, -1.0); cyl(B.a(AND), 0.48, 0.52, p[0], p[1], Y1 + 0.6, Y2 - 0.2, 10); box(GRAN, um + du - 0.65, um + du + 0.65, -1.65, -0.35, Y2 - 0.6, Y2 - 0.1); }
      box(GRAN, u0 - 0.9, u1 + 0.9, -1.8, 0, Y2, YC);
      tri3(B.a(AND), f3(u0 - 0.9, YC, -1.6), f3(u1 + 0.9, YC, -1.6), f3(um, YC + 4.2, -1.6)); quad(B.a(COPD), f3(u0 - 1.2, YC, -2.0), f3(um, YC + 4.4, -2.0), f3(um, YC + 4.4, 3.0), f3(u0 - 1.2, YC, 3.0)); quad(B.a(COPD), f3(um, YC + 4.4, -2.0), f3(u1 + 1.2, YC, -2.0), f3(u1 + 1.2, YC, 3.0), f3(um, YC + 4.4, 3.0));
    }
    // the four-column portico at the centre of the main block's front (on the forecourt) and the dome above it
    { const um = 30, nF = 24;
      box(GRAN, um - 7, um + 7, nF - 3.5, nF, yF - 0.3, yF + 1.0);                          // the entrance steps
      for (const du of [-4.5, -1.5, 1.5, 4.5]){ const p = p2(um + du, nF - 2.6); cyl(B.a(AND), 0.62, 0.68, p[0], p[1], yF + 1.0, Y2 - 0.4, 12); }
      box(GRAN, um - 6.4, um + 6.4, nF - 3.4, nF, Y2 - 0.6, YC);
      tri3(B.a(AND), f3(um - 6.4, YC, nF - 3.3), f3(um + 6.4, YC, nF - 3.3), f3(um, YC + 3.6, nF - 3.3));
      // square drum, then the copper dome with a lantern
      const dc = p2(um, nF + 5.5);
      box(AND, um - 5.0, um + 5.0, nF + 0.5, nF + 10.5, YC, YC + 4.0); box(GRAN, um - 5.5, um + 5.5, nF, nF + 11, YC + 4.0, YC + 4.7);
      const prof = []; for (let i = 0; i <= 10; i++){ const t = i/10*HP; prof.push([5.3*Math.cos(t), YC + 4.7 + 6.4*Math.sin(t)]); }
      LLathe(g, prof.map(q => [Math.max(0.01, q[0]), q[1] - (YC + 4.7)]), dc[0], YC + 4.7, dc[1], COP, 16);
      cyl(B.a(AND), 1.1, 1.1, dc[0], dc[1], YC + 11.0, YC + 13.2, 8); LCone(g, 1.45, 1.6, dc[0], YC + 13.2, dc[1], COP, 8); cyl(B.a(COPD), 0.12, 0.12, dc[0], dc[1], YC + 14.6, YC + 16.0, 4); }
    // the forecourt screen wall with its arched gate and loophole windows
    { const yW = yF + 4.6;
      box(GRAN, 16, 27.2, -0.2, 1.4, yF - 0.3, yW); box(GRAN, 32.8, 44, -0.2, 1.4, yF - 0.3, yW);
      box(GRAN, 26.4, 33.6, -0.4, 1.6, yF - 0.3, yW + 2.6); // the gate block
      const P = []; for (let i = 0; i <= 8; i++){ const t = PI*i/8; P.push([Math.cos(t)*2.2, 3.0 + Math.sin(t)*2.2]); }
      const gc = p2(30, -0.45); LShape(g, [[-2.2, 0], [2.2, 0], ...P.slice(0)], 0.3, gc[0], yF, gc[1], DARK, ANG);
      for (const u of [18.5, 21, 23.5, 36.5, 39, 41.5]){ const P0 = f3(u - 0.2, yF + 2.2, -0.26), P1 = f3(u + 0.2, yF + 2.2, -0.26); quad(B.a(DARK), P0, P1, [P1[0], yF + 3.4, P1[2]], [P0[0], yF + 3.4, P0[2]]); }
      box(GRAN, 15.6, 44.4, -0.5, 1.7, yW, yW + 0.45); }
    // ---- the 1930s extensions east of the Main Building (u 60 .. the east end), four storeys in the same granite / andesite dress
    { let P = SE.slice(); const c = Math.cos(ANG), s = Math.sin(ANG);
      // half-plane u >= 60.5 :  u = (x - Bx)*c - (z - Bz)*s  ->  -c*x + s*z <= -(60.5 + Bx*c - Bz*s)
      P = clipHalf(P, -c, s, -(60.5 + Bc[0]*c - Bc[1]*s));
      const Ye = yF + 20.5;
      prism(B.a(GRAN), P, yF - 0.3, Y1, false); prism(B.a(AND), P, Y1, Ye, false); capP(B.a(ROOFF), offsetRing(P, 0.9), Ye + 1.2);
      band(B.a(GRAN), P, Y1, Y1 + 0.6, 0.5); band(B.a(GRAN), P, Ye, Ye + 1.2, 0.9);
      ringWins(B.a(WIN), P, yF, 1, 6.2, 4.2, 1.4, 3.2, 6, 1.6, 0.12); ringWins(B.a(WIN), P, Y1, 3, 4.6, 4.2, 1.3, 3.0, 6, 1.0, 0.12);
      // paired pilasters on the street front
      ringFins(B.a(AND), P, Y1 + 0.6, Ye, 8.4, 1.0, 0.45, 12); }
    void nD; void uL;
    B.flush(g); return g; }};
SG_PLACES.push({type:'tyboj', lat:LAT, lon:LON, rot:0});
}
// ===== Holy Resurrection Cathedral, Nikolai-dō (1891; Shchurupov / Josiah Conder): Byzantine cross plan, the green copper dome
// (34.5 m) and the bell tower at the west end (37.7 m) — heights from the Chiyoda City guide =====
// On the real OSM outline r4080936 and its parts: the dome over the 15.8 m central part, the bell tower over its 5 m part, the
// narthex between. The altar end faces east-south-east (axis -24.7 deg from east). Storey / drum heights are estimates.
{
const LAT = 35.698022, LON = 139.765501, RR = 32;
LANDMARKS.tynikolai = {zh:'尼古拉堂', en:'Holy Resurrection Cathedral (Nikolai-dō)', cat:'old', r:RR, h:37.7,
  lt:{m:0, c:'#ffe6bf', k:1.0, e:0.5},
  build(){
    const g = new THREE.Group(), B = mkBatch(), G = mkGround(LAT, LON, RR), gl = G.gl;
    const WALL = {c:'#dccfb1', m:0}, TRIM = {c:'#efe7d4', m:0}, BASE = '#9f978a', COP = {c:'#5f9d86', m:0, lk:0.6}, COPD = '#4f8a74', WIN = {c:'#3c4248', glow:'#ffcf8a', gk:0.55}, GOLD = {c:'#d4b05a', glow:'#ffe0a0', gk:0.5};
    const ANG = -24.7*D2R, C0 = [3.6, 1.3], f = F(C0[0], C0[1], ANG), f3 = F3(C0[0], C0[1], ANG);
    const y0 = gl(C0[0], C0[1]) + 0.2, lo = Math.min(...D_TYX.NIK.ring.map(p => gl(p[0], p[1]))) - 1.2;
    const box = (col, u0, u1, v0, v1, ya, yb) => fbox(B.a(col), f, ANG, (u0 + u1)/2, (v0 + v1)/2, u1 - u0, v1 - v0, ya, yb);
    // plinth under the whole outline; the small annex on the north-west (r7904409)
    { const A = [[-27.2, 9.6], [-23.6, 11.1], [-23.9, 11.9], [-18.6, 14.1], [-18.1, 12.9], [-16.3, 12.6], [-15.8, 11.5], [-16.9, 9.9], [-16.3, 8.5], [-25.3, 5.1]], ya = gl(-21, 10);
      prism(B.a(BASE), A, Math.min(lo, ya - 1.2), ya + 0.4, true); prism(B.a(WALL), A, ya + 0.4, ya + 4.6, false); hipSkin(B.a(COP), offsetRing(A, 0.4), ya + 4.6, ya + 6.0, 2.2); }
    prism(B.a(BASE), D_TYX.NIK.ring, lo, y0 + 0.9, true);
    // round-headed windows on a face (u0..u1 at v = vf, outward sign so) or (v0..v1 at u = uf)
    const winsU = (u0, u1, vf, so, ya, h, w, n) => { for (let i = 0; i < n; i++){ const u = u0 + (u1 - u0)*(i + 0.5)/n, P = []; P.push([-w/2, 0], [w/2, 0]); for (let k = 0; k <= 6; k++){ const t = PI*k/6; P.push([Math.cos(t)*w/2, h - w/2 + Math.sin(t)*w/2]); }
      const c = f(u, vf + so*0.06); LShape(g, P, 0.12, c[0], ya, c[1], WIN, ANG); } };
    const winsV = (v0, v1, uf, so, ya, h, w, n) => { for (let i = 0; i < n; i++){ const v = v0 + (v1 - v0)*(i + 0.5)/n, P = []; P.push([-w/2, 0], [w/2, 0]); for (let k = 0; k <= 6; k++){ const t = PI*k/6; P.push([Math.cos(t)*w/2, h - w/2 + Math.sin(t)*w/2]); }
      const c = f(uf + so*0.06, v); LShape(g, P, 0.12, c[0], ya, c[1], WIN, ANG + HP); } };
    // ---- the cross: crossing (u -8..8, v -8..8) to 18 m, the four arms to 15 m with round-arched gables, the apse
    const Y15 = y0 + 15, Y18 = y0 + 18;
    box(WALL, -8, 8, -8, 8, y0, Y18);
    box(WALL, -12.5, 9, -6.5, 6.5, y0, Y15);          // west - east arm
    box(WALL, -6.5, 6.5, -13.8, 13.8, y0, Y15);       // north - south arms
    box(TRIM, -8.3, 8.3, -8.3, 8.3, Y18 - 0.8, Y18);
    for (const [u0, u1, v0, v1] of [[-12.8, 9.3, -6.8, 6.8], [-6.8, 6.8, -14.1, 14.1]]) box(TRIM, u0, u1, v0, v1, Y15 - 0.7, Y15);
    // copper roofs of the arms (low hips) and the crossing
    hipB(B.a(COP), f3, -12.8, 9.3, -6.8, 6.8, Y15, Y15 + 2.6, 0.3);
    { const f3r = (u, y, v) => f3(v, y, u); hipB(B.a(COP), f3r, -14.1, 14.1, -6.8, 6.8, Y15, Y15 + 2.6, 0.3); }
    // the apse: a half-round end to the east with a half dome
    { const ac = f(9, 0); const P = []; for (let i = 0; i <= 10; i++){ const t = -HP + PI*i/10; P.push([9 + Math.cos(t)*6.2, Math.sin(t)*6.2]); }
      const ring = P.map(q => f(q[0], q[1])); prism(B.a(WALL), ring, y0, y0 + 13, true); band(B.a(TRIM), ring, y0 + 12.4, y0 + 13, 0.2);
      for (let i = 0; i < 10; i++){ const a = P[i], b = P[i + 1], A2 = f3(a[0], y0 + 13, a[1]), B2 = f3(b[0], y0 + 13, b[1]), T = f3(9, y0 + 17.2, 0); tri3(B.a(COP), A2, B2, T); }
      void ac; }
    // the arms' round-arched gable windows and the tall nave windows
    winsU(-12, 8, -6.5, -1, y0 + 4, 6.5, 1.6, 4); winsU(-12, 8, 6.5, 1, y0 + 4, 6.5, 1.6, 4);
    winsV(-13, 13, -6.5, -1, y0 + 4, 6.5, 1.6, 4); winsV(-13, 13, 6.5, 1, y0 + 4, 6.5, 1.6, 4);
    winsU(-6, 6, -13.8, -1, y0 + 4.5, 8.0, 2.0, 3); winsU(-6, 6, 13.8, 1, y0 + 4.5, 8.0, 2.0, 3);
    // ---- the drum (16 arched windows) and the great dome to 34.5 m with its lantern and cross
    { const c = f(0, 0), Yd = Y18, Rr = 7.6;
      cyl(B.a(WALL), Rr, Rr, c[0], c[1], Yd, Yd + 5.2, 24); cyl(B.a(TRIM), Rr + 0.35, Rr + 0.35, c[0], c[1], Yd + 5.2, Yd + 5.8, 24);
      for (let i = 0; i < 16; i++){ const t = i/16*TAU, P = [[-0.55, 0], [0.55, 0]]; for (let k = 0; k <= 5; k++){ const a = PI*k/5; P.push([Math.cos(a)*0.55, 2.9 + Math.sin(a)*0.55]); }
        LShape(g, P, 0.12, c[0] + Math.cos(t)*(Rr + 0.05), Yd + 1.2, c[1] + Math.sin(t)*(Rr + 0.05), WIN, -t + HP); }
      const prof = []; for (let i = 0; i <= 12; i++){ const a = i/12*HP; prof.push([Math.max(0.02, (Rr + 0.2)*Math.cos(a)), 7.6*Math.sin(a)]); }
      LLathe(g, prof, c[0], Yd + 5.8, c[1], COP, 24);
      // ribs on the dome
      for (let i = 0; i < 16; i++){ const t = i/16*TAU; for (let k = 0; k < 6; k++){ const a0 = k/6*HP, a1 = (k + 1)/6*HP;
        beam(B.a(COPD), [c[0] + Math.cos(t)*(Rr + 0.3)*Math.cos(a0), Yd + 5.8 + 7.6*Math.sin(a0), c[1] + Math.sin(t)*(Rr + 0.3)*Math.cos(a0)], [c[0] + Math.cos(t)*(Rr + 0.3)*Math.cos(a1), Yd + 5.8 + 7.6*Math.sin(a1), c[1] + Math.sin(t)*(Rr + 0.3)*Math.cos(a1)], 0.18); } }
      const Yl = Yd + 13.4; cyl(B.a(WALL), 1.3, 1.3, c[0], c[1], Yl - 0.4, Yl + 1.8, 10); LDome(g, 1.5, c[0], Yl + 1.8, c[1], COP, 1.0, 10);
      const yc = y0 + 34.5; cyl(B.a(GOLD), 0.1, 0.1, c[0], c[1], Yl + 3.2, yc, 4); const cc = f3(0, yc - 1.0, 0), ca = f3(-0.7, yc - 1.0, 0), cb = f3(0.7, yc - 1.0, 0); beam(B.a(GOLD), ca, cb, 0.12); beam(B.a(GOLD), f3(-0.45, yc - 1.9, 0.0), f3(0.45, yc - 1.6, 0), 0.1); void cc; }
    // ---- the narthex (u -20.5..-12.5, 11 m) and the bell tower (5.6 m square at u = -23.2) to 37.7 m
    box(WALL, -21.0, -12.5, -7.2, 7.2, y0, y0 + 11); box(TRIM, -21.3, -12.3, -7.5, 7.5, y0 + 10.4, y0 + 11);
    hipB(B.a(COP), f3, -21.3, -12.3, -7.5, 7.5, y0 + 11, y0 + 13, 0.2);
    winsV(-6, 6, -21.0, -1, y0 + 3.5, 5.0, 1.4, 3);
    { const ut = -23.2, hw = 2.9, Yt = y0 + 24.5;
      box(WALL, ut - hw, ut + hw, -hw, hw, y0, Yt); box(TRIM, ut - hw - 0.3, ut + hw + 0.3, -hw - 0.3, hw + 0.3, y0 + 14.8, y0 + 15.4); box(TRIM, ut - hw - 0.35, ut + hw + 0.35, -hw - 0.35, hw + 0.35, Yt - 0.6, Yt);
      // the door and the belfry arches on all four faces
      { const c = f(ut - hw - 0.05, 0), P = [[-1.2, 0], [1.2, 0]]; for (let k = 0; k <= 6; k++){ const a = PI*k/6; P.push([Math.cos(a)*1.2, 3.4 + Math.sin(a)*1.2]); } LShape(g, P, 0.15, c[0], y0 + 0.9, c[1], WIN, ANG + HP); }
      winsV(-hw, hw, ut - hw, -1, y0 + 17.2, 5.2, 1.3, 2); winsV(-hw, hw, ut + hw, 1, y0 + 17.2, 5.2, 1.3, 2); winsU(ut - hw, ut + hw, -hw, -1, y0 + 17.2, 5.2, 1.3, 2); winsU(ut - hw, ut + hw, hw, 1, y0 + 17.2, 5.2, 1.3, 2);
      // octagonal lantern, the green tented dome, the cross at 37.7 m
      const c = f(ut, 0); cyl(B.a(WALL), 2.2, 2.2, c[0], c[1], Yt, Yt + 3.0, 8); cyl(B.a(TRIM), 2.45, 2.45, c[0], c[1], Yt + 3.0, Yt + 3.4, 8);
      const prof = [[2.5, 0], [2.4, 1.0], [1.9, 2.6], [1.1, 3.9], [0.4, 4.8], [0.02, 5.4]]; LLathe(g, prof, c[0], Yt + 3.4, c[1], COP, 12);
      const yc = y0 + 37.7; cyl(B.a(GOLD), 0.1, 0.1, c[0], c[1], Yt + 8.6, yc, 4); beam(B.a(GOLD), f3(ut - 0.6, yc - 0.9, 0), f3(ut + 0.6, yc - 0.9, 0), 0.11); beam(B.a(GOLD), f3(ut - 0.4, yc - 1.8, 0), f3(ut + 0.4, yc - 1.5, 0), 0.09); }
    B.flush(g); return g; }};
SG_PLACES.push({type:'tynikolai', lat:LAT, lon:LON, rot:0});
}
// ===== Kanda Myōjin and Hie Shrine: the shrine precincts on their real OSM buildings =====
// Every real building inside the precinct is rebuilt on its own outline (OSM names): the main halls in the gongen-zukuri form
// (worship hall, the stone room, the inner sanctuary under green copper irimoya roofs, vermilion posts, white walls, gold trim),
// the gates, the sub-shrines (small vermilion halls), the offices / halls / storehouses as plain white-walled buildings with dark
// roofs. The precinct court is a paved stone terrace (the app's ground slopes across it). Heights are estimates.
{
const VER = {c:'#bf3a2c', m:0, lk:0.75}, WHITE = {c:'#efe8d8', m:0}, COP = {c:'#5f9a84', m:0, lk:0.45}, COPD = '#4d8370', GOLD = {c:'#d7b257', glow:'#ffe1a0', gk:0.35},
  STONE = {c:'#aaa498', m:0, lk:0.4}, PAVE = '#bdb6a8', TILE = '#4e5257', PLAIN = {c:'#e4ddcd', m:1, fh:3.4, cw:2.6}, DOOR = {c:'#4a3a2e', glow:'#ffc480', gk:0.25}, LANT = {c:'#d9d3c2', glow:'#ffcf87', gk:1.1}, LEAF = {c:'#557140', m:0, lk:0.2}, TRK = '#5a4838';
// the gongen-zukuri main hall on the rectangle q = [cx, cz, ang, L, W] (u along the shrine axis, +u towards the sanctuary when dir = 1)
function gongen(g, B, q, y0, dir, o){
  o = o || {}; const [cx, cz, a0, L, W] = q, ang = a0 + (dir < 0 ? PI : 0), f = F(cx, cz, ang), f3 = F3(cx, cz, ang);
  const L2 = L/2, Wh = Math.min(W*0.62, 26), Wi = Wh*0.36, Wn = Wh*0.72;
  // the stone platform over the whole outline, the vermilion fence (tamagaki) round the sanctuary half
  fbox(B.a(STONE), f, ang, 0, 0, L, W, y0 - 3, y0 + 0.8);
  const yb = y0 + 0.8;
  for (const s of [-1, 1]) fbox(B.a(VER), f, ang, L*0.18, s*(W/2 - 1.2), L*0.6, 0.35, yb, yb + 2.2);
  fbox(B.a(VER), f, ang, L2 - 1.2, 0, 0.35, W - 2.4, yb, yb + 2.2);
  for (const s of [-1, 1]) fbox(B.a(COPD), f, ang, L*0.18, s*(W/2 - 1.2), L*0.6 + 0.6, 1.0, yb + 2.2, yb + 2.6);
  // the worship hall (haiden) at the front, the stone room (ishi-no-ma), the sanctuary (honden) behind
  const uh0 = -L2 + 3.5, uh1 = uh0 + L*0.34, ui1 = uh1 + L*0.12, un1 = Math.min(L2 - 3, ui1 + L*0.3);
  const H = (u0, u1, w, wh, rh, gab) => shrineHall(g, B, f, ang, cx + ((u0 + u1)/2)*Math.cos(ang), cz - ((u0 + u1)/2)*Math.sin(ang), u1 - u0, w, yb, {base:0.6, wh, rh, col:VER, wall:WHITE, roof:COP, rcol:COPD, gold:GOLD, gab, over:1.8, stone:STONE});
  const hh = H(uh0, uh1, Wh, o.wh || 5.6, Math.max(3.2, Wh*0.4), 0.5);
  H(uh1, ui1, Wi, (o.wh || 5.6) - 0.8, 2.2, 0.0);
  const hn = H(ui1, un1, Wn, (o.wh || 5.6) + 0.4, Math.max(3.0, Wn*0.42), 0.5);
  // the front porch (kōhai) with a cusped kara-hafu gable, the steps
  { const uf = uh0 - 2.6, yr = yb + 0.6 + (o.wh || 5.6), cw = Math.min(10, Wh*0.42);
    for (const s of [-1, 1]){ const p = f(uf, s*cw/2); cyl(B.a(VER), 0.28, 0.28, p[0], p[1], yb, yr - 0.3, 8); }
    fbox(B.a(VER), f, ang, uf + 1.2, 0, 3.0, cw + 0.6, yr - 0.8, yr - 0.2);
    jroof(g, cx + (uf + 1.4)*Math.cos(ang), cz - (uf + 1.4)*Math.sin(ang), ang + HP, cw + 0.4, 4.4, yr - 0.3, {col:COP, h:1.6, over:0.8, gab:0, lift:0.1});
    const Rf = rotP(cx, cz, ang - HP); kara(g, Rf, ang - HP, 0, yr + 0.9, -(uf - 0.9), cw + 1.2, 1.5, 1.2, COP, GOLD);
    fbox(B.a(STONE), f, ang, uf - 3.0, 0, 3.5, cw + 1.5, yb - 1.6, yb - 0.1); }
  // a chidori-hafu (triangular dormer gable) on the front slope of the worship hall's roof
  { const Rf = rotP(cx, cz, ang - HP), yr = yb + 0.6 + (o.wh || 5.6) + 1.6, uc = uh0 + (uh1 - uh0)*0.35; dormer(g, Rf, ang - HP, 0, yr, -uc, Wh*0.36, 2.4, 2.2, COP, WHITE); }
  // gold ridge ornaments
  for (const u of [uh0 + 0.5, uh1 - 0.5]){ const p = f(u, 0); cyl(B.a(GOLD), 0.25, 0.25, p[0], p[1], hh.yt - 0.2, hh.yt + 0.7, 6); }
  for (const u of [ui1 + 0.5, un1 - 0.5]) for (const s of [-1, 1]){ const p0 = f3(u, hn.yt - 0.1, 0), p1 = f3(u, hn.yt + 1.6, s*1.1); beam(B.a(GOLD), p0, p1, 0.14); }   // chigi
  return {f, ang, yb, uFront:uh0 - 4};
}
// a plain building (office, hall, storehouse) on its ring: white walls with lit windows, a dark hipped roof
function plainHall(B, gl, b, yT, hmax, col){
  const P = b.r, c = cen(P), y0 = Math.min(yT, gl(c[0], c[1])), h = Math.min(b.h, hmax);
  prism(B.a(STONE), P, Math.min(-0.5, lowUnder(gl, P)) - 1.2 + (yT - yT), y0 + 0.4, true);
  prism(B.a(col || PLAIN), P, y0 + 0.4, y0 + h - 1.6, false);
  const E = offsetRing(P, 0.9), T = offsetRing(P, -Math.min(3, b.q[4]*0.3));
  skin(B.a(TILE), E, y0 + h - 1.8, T, y0 + h); capP(B.a(TILE), T, y0 + h); capP(B.a(TILE), E, y0 + h - 1.85, true);
}
// a small sub-shrine on its ring: vermilion hall, green gable roof, facing dir (angle) if given
function subShrine(g, B, b, y0){
  const [cx, cz, ang, L, W] = b.q, f = F(cx, cz, ang);
  const s = Math.min(1, Math.sqrt(L*W)/9);
  shrineHall(g, B, f, ang, cx, cz, Math.max(3, L - 1.2), Math.max(2.6, W - 1.2), y0, {base:0.5 + 0.4*s, wh:2.4 + 1.6*s, rh:1.4 + 1.4*s, col:VER, wall:WHITE, roof:COP, rcol:COPD, gab:0.5, over:0.8 + 0.6*s, stone:STONE});
}
// a two-storey vermilion gate (rōmon) on q, passage along its short axis
function romon(g, B, q, y0, W2, two){
  const [cx, cz, ang, L] = q, W = W2, f = F(cx, cz, ang), f3 = F3(cx, cz, ang);
  fbox(B.a(STONE), f, ang, 0, 0, L + 1.0, W + 2.0, y0 - 2.5, y0 + 0.5);
  const yb = y0 + 0.5, h1 = 5.0;
  for (let i = 0; i <= 3; i++) for (const s of [-1, 0, 1]){ const p = f(-L/2 + 0.6 + (L - 1.2)*i/3, s*(W/2 - 0.5)); cyl(B.a(VER), 0.34, 0.34, p[0], p[1], yb, yb + h1, 8); }
  for (const s of [-1, 1]) fbox(B.a(VER), f, ang, s*(L/2 - 0.6 - (L - 1.2)/6), 0, (L - 1.2)/3 - 0.4, W - 1.4, yb, yb + h1 - 0.6);   // the side bays (guardian niches)
  fbox(B.a(GOLD), f, ang, 0, 0, L - 0.4, W - 0.4, yb + h1 - 0.5, yb + h1 - 0.3);
  fbox(B.a(VER), f, ang, 0, 0, L, W, yb + h1 - 0.3, yb + h1 + 0.6);
  if (two){
    const yt1 = jroof(g, cx, cz, ang, L + 1.2, W + 1.2, yb + h1 + 0.6, {col:COP, h:1.0, over:1.2, gab:0, lift:0.2, k:0});
    void yt1;
    // the upper storey with its balcony railing
    const y2 = yb + h1 + 1.4; fbox(B.a(VER), f, ang, 0, 0, L - 1.6, W - 1.6, y2, y2 + 3.6); fbox(B.a(WHITE), f, ang, 0, 0, L - 2.2, W - 2.2, y2 + 0.8, y2 + 3.0);
    for (const s of [-1, 1]){ fbox(B.a(VER), f, ang, 0, s*(W/2 - 0.5), L - 0.8, 0.2, y2 + 0.8, y2 + 1.0); fbox(B.a(VER), f, ang, s*(L/2 - 0.5), 0, 0.2, W - 0.8, y2 + 0.8, y2 + 1.0); }
    jroof(g, cx, cz, ang, L - 0.8, W - 0.8, y2 + 3.6, {col:COP, h:3.4, over:2.0, gab:0.5, gcol:WHITE, ridge:0.3, rcol:COPD});
  } else jroof(g, cx, cz, ang, L - 0.2, W - 0.2, yb + h1 + 0.6, {col:COP, h:3.0, over:1.8, gab:0.5, gcol:WHITE, ridge:0.3, rcol:COPD});
  void f3;
}
// a stone lantern (tōrō) with a glowing fire box
function lantern(B, x, z, y, s){ s = s || 1; cyl(B.a(STONE), 0.45*s, 0.55*s, x, z, y, y + 0.4*s, 6); cyl(B.a(STONE), 0.16*s, 0.2*s, x, z, y + 0.4*s, y + 1.4*s, 6);
  cyl(B.a(STONE), 0.45*s, 0.35*s, x, z, y + 1.4*s, y + 1.6*s, 6); cyl(B.a(LANT), 0.3*s, 0.3*s, x, z, y + 1.6*s, y + 2.2*s, 6); cyl(B.a(STONE), 0.62*s, 0.1*s, x, z, y + 2.2*s, y + 2.7*s, 6); }
// the stone terrace of a precinct court: top yT, walls down to below the lowest ground, a stone coping
function terrace(B, gl, P, yT){ const lo = Math.min(yT - 0.5, lowUnder(gl, P)) - 1.5; prism(B.a(STONE), P, lo, yT - 0.08, false); capP(B.a(PAVE), P, yT - 0.05); band(B.a(STONE), P, yT - 0.05, yT + 0.35, 0.15); }

// ---------------- Kanda Myōjin: the main hall (1934, reinforced concrete in the gongen form) faces the Zuishinmon gate to the south-west
const K_LAT = 35.701975, K_LON = 139.767848, K_R = 94;
LANDMARKS.tykandamyojin = {zh:'神田明神', en:'Kanda Myōjin', cat:'old', r:K_R, h:22,
  lt:{m:0, c:'#ffc98a', k:1.0, e:0.6},
  build(){
    const g = new THREE.Group(), B = mkBatch(), G = mkGround(K_LAT, K_LON, K_R), gl = G.gl, D = D_TYX.KANDA;
    const hall = D.bld.find(b => b.n === '御社殿'), gate = D.bld.find(b => b.n === '随神門');
    const yT = gl(hall.q[0], hall.q[1]) + 0.3;
    terrace(B, gl, D.core, yT);
    // the main hall: its axis from the gate to the hall (about 56 deg from east), the front towards the gate
    const ax = Math.atan2(-(hall.q[1] - gate.q[1]), hall.q[0] - gate.q[0]);
    const q = [hall.q[0], hall.q[1], ax, Math.max(hall.q[3], hall.q[4]), Math.min(hall.q[3], hall.q[4])];
    const M = gongen(g, B, q, yT, 1, {wh:7.2});
    // the Zuishinmon: two storeys, vermilion
    romon(g, B, [gate.q[0], gate.q[1], ax + HP, gate.q[3]], yT, 7.6, true);
    for (const b of D.bld){
      if (b === hall || b === gate) continue;
      const c = cen(b.r), y0 = Math.min(yT, gl(c[0], c[1]) + 0.1);
      if (b.t === 'religious') subShrine(g, B, b, yT);
      else if (b.t === 'shed') plainHall(B, gl, Object.assign({}, b, {r:offsetRing(b.r, -1.5)}), yT, 4.0, WHITE);   // (kept clear of the EDOCCO building next to it)
      else plainHall(B, gl, b, yT, b.n === '明神会館' ? 18 : 12);
      void y0;
    }
    // the water basin pavilion (temizuya): a copper roof on four posts
    { const x = -33.9, z = 36.8, f = F(x, z, ax); for (const s of [-1, 1]) for (const t of [-1, 1]){ const p = f(s*2.2, t*1.6); cyl(B.a(VER), 0.18, 0.18, p[0], p[1], yT, yT + 2.8, 6); }
      fbox(B.a(STONE), f, ax, 0, 0, 2.4, 1.4, yT, yT + 0.8); jroof(g, x, z, ax, 4.8, 3.6, yT + 2.8, {col:COP, h:1.4, over:0.8, gab:0.5, gcol:VER}); }
    // the sub-shrines' torii, stone lanterns along the approach, the ginkgo trees of the court
    for (const t of D.torii){ const L = Math.hypot(t[1][0] - t[0][0], t[1][1] - t[0][1]); torii(B, t[0], t[1], yT, 2.6 + L*0.55, VER); }
    for (const k of [-1, 1]) for (let i = 0; i < 4; i++){ const u = -46 + i*6.5, p = F(hall.q[0], hall.q[1], ax)(u, k*7.5); if (inPoly(D.core, p[0], p[1])) lantern(B, p[0], p[1], yT, 1.0); }
    for (const [x, z, r] of [[-26, 22, 5.5], [0.5, -54, 4.5], [12, 48, 6], [-12, 30, 3.5]]){ const y = yT; cyl(B.a(TRK), 0.4, 0.55, x, z, y, y + 6, 6); crown(B.a(LEAF), x, y + 5, z, r, r*2.0, 7); }
    void M;
    B.flush(g); return g; }};
SG_PLACES.push({type:'tykandamyojin', lat:K_LAT, lon:K_LON, rot:0});

// ---------------- Hie Shrine (Akasaka): the main hall (rebuilt 1958) faces east to the Shinmon gate and the Otokozaka stairs; the
// Sanno torii (a torii with a triangular gable) at the entrances; the tunnel of vermilion torii on the Inari approach (about 90
// torii, tabi-mag) on its OSM line.
const H_LAT = 35.674742, H_LON = 139.739863, H_R = 116;
LANDMARKS.tyhie = {zh:'日枝神社', en:'Hie Shrine', cat:'old', r:H_R, h:20,
  lt:{m:0, c:'#ffc98a', k:1.0, e:0.6},
  build(){
    const g = new THREE.Group(), B = mkBatch(), G = mkGround(H_LAT, H_LON, H_R), gl = G.gl, D = D_TYX.HIE;
    const hall = D.bld.find(b => b.n === '本殿'), gate = D.bld.find(b => b.n === '神門');
    const yT = gl(hall.q[0], hall.q[1]) + 1.5;
    terrace(B, gl, D.core, yT);
    // wooded slopes round the terrace (the shrine stands on a hill): a skirt from the coping down to the ground
    { const P = D.core, E = offsetRing(P, 5.0), n = P.length;
      for (let i = 0; i < n; i++){ const j = (i + 1) % n, a = P[i], b = P[j], c = E[i], d = E[j];
        quad(B.a({c:'#6d7f52', m:0, lk:0.2}), [a[0], yT - 0.1, a[1]], [b[0], yT - 0.1, b[1]], [d[0], gl(d[0], d[1]) - 0.6, d[1]], [c[0], gl(c[0], c[1]) - 0.6, c[1]]); }
      const r = LMCTX.rng; for (let i = 0; i < n; i++){ const a = P[i], b = P[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
        for (let s = 3; s < L - 2; s += 7){ const t = s/L, c = E[i], d = E[(i + 1) % n], x = c[0] + (d[0] - c[0])*t + (r() - 0.5)*2, z = c[1] + (d[1] - c[1])*t + (r() - 0.5)*2, y = gl(x, z) - 0.3, rr = 3 + r()*2.5;
          cyl(B.a(TRK), 0.3, 0.42, x, z, y, y + 5, 6); crown(B.a(LEAF), x, y + 4, z, rr, rr*2.2, 7); } } }
    const ax = Math.atan2(-(gate.q[1] - hall.q[1]), gate.q[0] - hall.q[0]);   // from the hall towards the Shinmon (east)
    const q = [hall.q[0], hall.q[1], ax + PI, Math.max(hall.q[3], hall.q[4]), Math.min(hall.q[3], hall.q[4])];
    gongen(g, B, q, yT, 1, {wh:5.8});
    romon(g, B, [gate.q[0], gate.q[1], ax + HP, gate.q[3]], yT, gate.q[4], false);
    for (const b of D.bld){
      if (b === hall || b === gate) continue;
      if (b.t === 'religious' && b.q[3]*b.q[4] < 200) subShrine(g, B, b, yT);
      else if (b.t === 'religious'){ const f = F(b.q[0], b.q[1], b.q[2]); shrineHall(g, B, f, b.q[2], b.q[0], b.q[1], b.q[3] - 1, b.q[4] - 1, yT, {base:0.7, wh:4.6, rh:3.2, col:VER, wall:WHITE, roof:COP, rcol:COPD, gab:0.5, over:1.5, stone:STONE}); }
      else if (b.t === 'shed') plainHall(B, gl, b, yT, 4.0, WHITE);
      else plainHall(B, gl, b, yT, b.q[3] > 30 ? 9.0 : 8.0, {c:'#e9e1cf', m:0});
    }
    // vermilion corridors on the south and north sides of the court (on their buildings' outlines: low walls with posts)
    for (const t of D.torii){ const L = Math.hypot(t[1][0] - t[0][0], t[1][1] - t[0][1]), c = [(t[0][0] + t[1][0])/2, (t[0][1] + t[1][1])/2], y = Math.min(yT, gl(c[0], c[1]) + 0.1);
      torii(B, t[0], t[1], inPoly(D.core, c[0], c[1]) ? yT : gl(c[0], c[1]) - 0.1, 3.0 + L*0.62, VER, '#2b2b2b', L > 6); void y; }
    // the torii tunnel of the Inari approach: about 90 torii along the steps
    { const P = D.inari; let acc = 0; const segs = []; for (let i = 0; i + 1 < P.length; i++){ const L = Math.hypot(P[i+1][0] - P[i][0], P[i+1][1] - P[i][1]); segs.push([P[i], P[i+1], acc, L]); acc += L; }
      const N = 90, step = acc/N;
      for (let k = 0; k < N; k++){ const s = (k + 0.5)*step, sg = segs.find(q => s >= q[2] && s <= q[2] + q[3]) || segs[segs.length - 1], t = (s - sg[2])/sg[3];
        const x = sg[0][0] + (sg[1][0] - sg[0][0])*t, z = sg[0][1] + (sg[1][1] - sg[0][1])*t, dx = (sg[1][0] - sg[0][0])/sg[3], dz = (sg[1][1] - sg[0][1])/sg[3], hw = 1.05;
        const a = [x - dz*hw, z + dx*hw], b = [x + dz*hw, z - dx*hw], y = gl(x, z) - 0.05;
        // a slim torii: two posts, the nuki, the black-capped kasagi
        for (const p of [a, b]) fbox(B.a(VER), F(p[0], p[1], 0), 0, 0, 0, 0.2, 0.2, y - 0.3, y + 2.5);
        const ang = Math.atan2(-(b[1] - a[1]), b[0] - a[0]), ff = F(x, z, ang);
        fbox(B.a(VER), ff, ang, 0, 0, 2.5, 0.16, y + 2.0, y + 2.16); fbox(B.a(VER), ff, ang, 0, 0, 2.9, 0.26, y + 2.42, y + 2.62); fbox(B.a('#2b2b2b'), ff, ang, 0, 0, 3.0, 0.3, y + 2.62, y + 2.72); } }
    // stone lanterns on the court
    { const f = F(hall.q[0], hall.q[1], ax); for (const k of [-1, 1]) for (const u of [26, 34, 42]){ const p = f(u, k*6.5); if (inPoly(D.core, p[0], p[1])) lantern(B, p[0], p[1], yT, 1.0); } }
    B.flush(g); return g; }};
SG_PLACES.push({type:'tyhie', lat:H_LAT, lon:H_LON, rot:0});
}
// ===== The Sumida bridges: Kachidoki (1940), Eitai (1926), Kiyosu (1928) — the steel structures round the app's road decks =====
// The app draws each road deck from OSM with one profile along the axis (9.0 m above the water over the river, ramps to the
// banks). The models read that profile from the data (deckProfile: the app's monotone cubic over its ground) and build the
// girders, arches / chains, towers, piers, railings and lamps to meet it. Local frame: u along the bridge axis, v across.
// Dimensions: lengths, widths, spans, structure types (Tokyo Metropolitan Government Bureau of Construction, Chuo City, Bunka-isan
// Online, Engineering Japan); colours and night lighting (Bureau of Construction lighting / colour plan). Arch rises, the
// Kiyosu tower height and member sizes are estimates from photographs.
{
// a solid strip (rib / girder) along u at lateral v (width w) between the curves yt(u) and yb(u), sampled at us
function ribStrip(a, f3, us, yt, yb, v, w){
  for (let i = 0; i + 1 < us.length; i++){ const u0 = us[i], u1 = us[i + 1], t0 = yt(u0), t1 = yt(u1), b0 = yb(u0), b1 = yb(u1);
    for (const s of [-1, 1]){ const vv = v + s*w/2; quad(a, f3(u0, b0, vv), f3(u1, b1, vv), f3(u1, t1, vv), f3(u0, t0, vv)); }
    quad(a, f3(u0, t0, v - w/2), f3(u1, t1, v - w/2), f3(u1, t1, v + w/2), f3(u0, t0, v + w/2));
    quad(a, f3(u0, b0, v + w/2), f3(u1, b1, v + w/2), f3(u1, b1, v - w/2), f3(u0, b0, v - w/2)); }
}
const stations = (u0, u1, n) => { const o = []; for (let i = 0; i <= n; i++) o.push(u0 + (u1 - u0)*i/n); return o; };
// a railing along u (posts every 2 m, top rail, a mid rail) following the deck
function railing(B, f3, u0, u1, v, deck, col, h){
  h = h || 1.15; const n = Math.max(1, Math.round((u1 - u0)/2));
  for (let i = 0; i <= n; i++){ const u = u0 + (u1 - u0)*i/n, y = deck(u); beam(B.a(col), f3(u, y - 0.1, v), f3(u, y + h, v), 0.1); }
  for (let i = 0; i < n; i++){ const ua = u0 + (u1 - u0)*i/n, ub = u0 + (u1 - u0)*(i + 1)/n;
    beam(B.a(col), f3(ua, deck(ua) + h, v), f3(ub, deck(ub) + h, v), 0.12, 0.08); beam(B.a(col), f3(ua, deck(ua) + h*0.45, v), f3(ub, deck(ub) + h*0.45, v), 0.05); }
}
// a pier in the river: a rectangle u0..u1 with round cutwaters at both v ends, from the river bed to yTop
function pier(B, f, ang, uc, Lu, Wv, yb, yt, col, capCol){
  fbox(B.a(col), f, ang, uc, 0, Lu, Wv - Lu, yb, yt);
  for (const s of [-1, 1]){ const c = f(uc, s*(Wv - Lu)/2); cyl(B.a(col), Lu/2, Lu/2, c[0], c[1], yb, yt, 12, true); }
  fbox(B.a(capCol || col), f, ang, uc, 0, Lu + 0.6, Wv - Lu + 0.6, yt - 0.8, yt);
}
// a lamp post on the bridge
function bLamp(B, f3, u, v, y, h, col, lamp){ const p = f3(u, y, v); cyl(B.a(col), 0.14, 0.22, p[0], p[2], y, y + h, 8); cyl(B.a(col), 0.32, 0.32, p[0], p[2], y, y + 0.9, 8);
  for (const s of [-1, 1]){ const q = f3(u, y + h - 0.4, v + s*0.7); beam(B.a(col), [p[0], y + h - 0.6, p[2]], q, 0.08); cyl(B.a(lamp), 0.24, 0.24, q[0], q[2], q[1] - 0.25, q[1] + 0.35, 8, true); } }

// ---------------- Kachidoki Bridge: two steel solid-rib tied arches (about 86 m each) either side of the Chicago-type double-leaf
// bascule span (movable part 51.6 m, last opened 1970), total 246 m, width 26.6 m; white arches, light grey railings; the operator
// houses on the sidewalks by the bascule piers. Piers on the OSM outline's breaks (u = ±21.3 .. ±34.9).
const KA_LAT = 35.662259, KA_LON = 139.774895, KA_R = 130, KA_ANG = 126.68*D2R;
LANDMARKS.tykachidoki = {zh:'胜哄桥', en:'Kachidoki Bridge', cat:'old', r:KA_R, h:24, water:true,
  lt:{m:0, c:'#f2f5ff', k:0.95, e:0.65},
  build(){
    const g = new THREE.Group(), B = mkBatch(), G = mkGround(KA_LAT, KA_LON, KA_R), D = D_TYX.KACHI;
    const road = D.decks.find(d => d.c <= 10), DP = deckProfile(G, KA_LAT, KA_LON, road, KA_ANG, 0.18), deck = DP.deckAt;
    const f = F(0, 0, KA_ANG), f3 = F3(0, 0, KA_ANG), wY = G.abs(-0.3), bed = wY - 4.5;
    const ARC = {c:'#e9ebe7', m:0, lc:'#f4f7ff', lk:1.05}, RAIL = {c:'#c3c7c6', m:0, lk:0.5}, GIR = {c:'#d9dcd8', m:0, lk:0.7}, SOFF = '#77797a', GRAN = {c:'#a7a196', m:0, lk:0.45},
      HUT = {c:'#dcd8ce', m:0}, HWIN = {c:'#4c5560', glow:'#ffd9a8', gk:0.9}, LAMP = {c:'#fff3dc', glow:'#fff0d0', gk:1.6}, DARK = '#5c5f60';
    const HW = 13.2, VR = 9.4, P0 = 21.3, P1 = 34.9, AE = 123.0;
    // the deck slab, its edge girders, cross girders under the deck, the footway cantilevers (the surfaces themselves are the app's)
    const dS = u => deck(u) - 0.3;
    for (const s of [-1, 1]){
      const us = stations(-AE, AE, 60);
      ribStrip(B.a(GIR), f3, us, u => dS(u) + 0.05, u => dS(u) - 1.0, s*HW, 0.5);                     // fascia
      ribStrip(B.a(SOFF), f3, us, u => dS(u), u => dS(u) - 0.55, s*(HW - 6.5), HW*1.0);                   // slab underside (each half)
    }
    for (let u = -AE + 3; u < AE - 2; u += 6.6){ const y = dS(u); fbox(B.a(SOFF), f, KA_ANG, u, 0, 0.5, HW*2 - 1, y - 1.6, y - 0.5); }
    // ---- the two tied arches (solid ribs) in the planes v = ±VR, between the bascule piers and the abutments
    for (const side of [-1, 1]){
      const ua = side*P1, ub = side*AE, rise = 12.5, N = 26, us = stations(ua, ub, N);
      const ya = deck(ua) + 0.6, yb = deck(ub) + 0.6, t = u => (u - ua)/(ub - ua);
      const ribC = u => { const k = t(u); return ya + (yb - ya)*k + rise*4*k*(1 - k); };
      const dep = u => { const k = t(u); return 1.9 + 1.1*Math.pow(Math.abs(2*k - 1), 2); };
      for (const s of [-1, 1]){
        ribStrip(B.a(ARC), f3, us, u => ribC(u) + dep(u)/2, u => ribC(u) - dep(u)/2, s*VR, 1.0);              // rib
        ribStrip(B.a(ARC), f3, us, u => deck(u) + 1.0, u => deck(u) - 1.6, s*VR, 0.9);                         // tie girder
        // hangers every panel (I-sections), the end posts
        for (let i = 1; i < N; i++){ if (i % 2) continue; const u = us[i], y0 = deck(u) + 1.0, y1 = ribC(u) - dep(u)/2; if (y1 - y0 < 0.6) continue;
          fbox(B.a(ARC), f, KA_ANG, u, s*VR, 0.55, 0.45, y0, y1); }
        for (const ue of [ua, ub]) fbox(B.a(ARC), f, KA_ANG, ue + (ue === ua ? side*0.8 : -side*0.8), s*VR, 1.8, 1.1, deck(ue) - 1.6, deck(ue) + 2.4);
      }
      // floor beams under the arch spans to the ties
      void ribC;
    }
    // ---- the bascule span: two leaves meeting at u = 0, deep plate girders under the deck (deepest at the piers / trunnions)
    for (const s of [-1, 1]){
      const us = stations(-P0 - 2, P0 + 2, 22);
      ribStrip(B.a(GIR), f3, us, u => deck(u) - 0.3, u => deck(u) - 1.4 - 2.6*Math.pow(Math.abs(u)/P0, 2), s*VR, 0.7);
      ribStrip(B.a(GIR), f3, us, u => deck(u) - 0.3, u => deck(u) - 1.2 - 1.8*Math.pow(Math.abs(u)/P0, 2), s*3.2, 0.5);
    }
    fbox(B.a(DARK), f, KA_ANG, 0, 0, 0.12, HW*2, deck(0) - 0.29, deck(0) - 0.24);                        // the leaf joint
    // ---- the bascule piers (counterweight pits inside) with cutwaters, the abutments
    for (const s of [-1, 1]){ pier(B, f, KA_ANG, s*(P0 + P1)/2, P1 - P0, 34, bed, deck(s*(P0 + P1)/2) - 0.5, GRAN, GRAN);
      fbox(B.a(GRAN), f, KA_ANG, s*(AE + 1.5), 0, 3.4, HW*2 + 2, bed, deck(s*AE) - 0.2); }
    // ---- the operator houses (four small huts on the sidewalks over the piers), lamp posts, railings
    for (const s of [-1, 1]) for (const w of [-1, 1]){
      const uc = s*(P0 + P1)/2, vc = w*(HW + 2.2), y = deck(uc) - 0.3;
      fbox(B.a(GRAN), f, KA_ANG, uc, vc, 6.0, 4.4, y - 1.2, y);
      fbox(B.a(HUT), f, KA_ANG, uc, vc, 4.8, 3.6, y, y + 3.4);
      for (const du of [-1.4, 0, 1.4]) fbox(B.a(HWIN), f, KA_ANG, uc + du, vc + w*1.83, 0.9, 0.06, y + 1.2, y + 2.6);
      hipB(B.a(GIR), f3, uc - 2.8, uc + 2.8, vc - 2.2, vc + 2.2, y + 3.4, y + 4.6, 0.2);
      bLamp(B, f3, s*P0 - s*0.5, w*(HW - 0.4), deck(s*P0) - 0.2, 7.5, RAIL, LAMP);
      bLamp(B, f3, s*(AE - 2), w*(HW - 0.4), deck(s*(AE - 2)) - 0.2, 6.5, RAIL, LAMP);
    }
    for (const w of [-1, 1]) railing(B, f3, -AE, AE, w*(HW - 0.2), u => deck(u) - 0.12, RAIL);
    B.flush(g); return g; }};
SG_PLACES.push({type:'tykachidoki', lat:KA_LAT, lon:KA_LON, rot:0});

// ---------------- Eitai Bridge: a steel through tied arch over the main span (the first Japanese arch over 100 m), side spans
// on deep girders, total 184.7 m, width 25.6 m; pale blue arch, light grey-blue railings; at night blue light on the arch and the
// side girders, white up-lights on the hangers.
const EI_LAT = 35.676304, EI_LON = 139.787558, EI_R = 100, EI_ANG = 165.27*D2R;
LANDMARKS.tyeitai = {zh:'永代桥', en:'Eitai Bridge', cat:'old', r:EI_R, h:28, water:true,
  lt:{m:0, c:'#cfe0ff', k:0.9, e:0.6},
  build(){
    const g = new THREE.Group(), B = mkBatch(), G = mkGround(EI_LAT, EI_LON, EI_R), D = D_TYX.EITAI;
    const road = D.decks.find(d => d.c <= 10), deck = deckProfile(G, EI_LAT, EI_LON, road, EI_ANG, 0.18).deckAt;
    const f = F(0, 0, EI_ANG), f3 = F3(0, 0, EI_ANG), wY = G.abs(-0.3), bed = wY - 4.5;
    const ARC = {c:'#9fc4df', m:0, lc:'#4d8cff', lk:1.35, e:0.7}, HANG = {c:'#c9d6de', m:0, lc:'#ffffff', lk:1.15}, RAIL = {c:'#b9c5cd', m:0, lk:0.45}, GIRS = {c:'#94b9d4', m:0, lc:'#4d8cff', lk:1.1}, SOFF = '#6f777c', GRAN = {c:'#a49f95', m:0, lk:0.4}, LAMP = {c:'#fff3dc', glow:'#f2f6ff', gk:1.5};
    const U0 = -0.5, HW = 12.5, VR = 12.25, PC = 50.3, PH = 3.6, AE = 93.2, uL = U0 - AE + 0.3, uR = U0 + AE - 0.6;
    const dS = u => deck(u) - 0.3;
    // the deck slab and fascia
    for (const s of [-1, 1]){ const us = stations(uL, uR, 56); ribStrip(B.a(SOFF), f3, us, u => dS(u), u => dS(u) - 0.6, s*(HW - 6.2), HW); }
    for (let u = uL + 2; u < uR - 1; u += 5){ const y = dS(u); fbox(B.a(SOFF), f, EI_ANG, u, 0, 0.45, HW*2 - 1, y - 1.5, y - 0.6); }
    // ---- the main arch: ribs spring at the piers below the deck (a balanced, helmet-shaped arch), rise to about 18 m over the deck
    const ua = U0 - PC + PH, ub = U0 + PC - PH, N = 30, us = stations(ua, ub, N), rise = 18.0;
    const yS = Math.min(deck(ua), deck(ub)) - 2.6, yC = deck(U0) + rise;
    const ribC = u => { const k = (u - ua)/(ub - ua), x = 2*k - 1; return yS + (yC - yS)*(1 - x*x)*(1 + 0.18*(1 - x*x)) /1.18*1.0; };
    const dep = u => { const k = (u - ua)/(ub - ua); return 2.0 + 1.6*Math.pow(Math.abs(2*k - 1), 1.5); };
    for (const s of [-1, 1]){
      ribStrip(B.a(ARC), f3, us, u => ribC(u) + dep(u)/2, u => ribC(u) - dep(u)/2, s*VR, 0.95);
      ribStrip(B.a(ARC), f3, stations(ua, ub, 24), u => deck(u) + 0.9, u => deck(u) - 1.7, s*VR, 0.8);    // the tie / deck girder
      for (let i = 1; i < N; i++){ const u = us[i], y0 = deck(u) + 0.9, y1 = ribC(u) - dep(u)/2; if (y1 - y0 < 0.8) continue; fbox(B.a(HANG), f, EI_ANG, u, s*VR, 0.4, 0.4, y0, y1); }
    }
    // the upper lateral bracing: struts and X-braces across between the ribs where the clearance allows
    for (let i = 2; i < N - 1; i += 2){ const u = us[i], y = ribC(u) + dep(u)/2 - 0.6; if (y - deck(u) < 8.5) continue;
      beam(B.a(ARC), f3(u, y, -VR), f3(u, y, VR), 0.55, 0.9);
      const u2 = us[i + 2] || u; if (i + 2 < N && ribC(u2) + dep(u2)/2 - 0.6 - deck(u2) >= 8.5){ const y2 = ribC(u2) + dep(u2)/2 - 0.6; beam(B.a(ARC), f3(u, y, -VR), f3(u2, y2, VR), 0.3); beam(B.a(ARC), f3(u, y, VR), f3(u2, y2, -VR), 0.3); } }
    // ---- the side spans: deep girders whose curved soffit rises from the piers to the banks
    for (const side of [-1, 1]){ const u0 = U0 + side*(PC + PH), u1 = side < 0 ? uL : uR, uss = stations(Math.min(u0, u1), Math.max(u0, u1), 16);
      const depth = u => { const k = Math.abs(u - u0)/Math.abs(u1 - u0); return 1.6 + 4.0*Math.pow(1 - k, 2); };
      for (const v of [-VR, -4.2, 4.2, VR]) ribStrip(B.a(Math.abs(v) > 6 ? GIRS : SOFF), f3, uss, u => deck(u) - 0.3 + (Math.abs(v) > 6 ? 1.2 : 0), u => deck(u) - 0.3 - depth(u), v, Math.abs(v) > 6 ? 0.8 : 0.5); }
    // ---- the piers with cutwaters, the abutments
    for (const s of [-1, 1]){ pier(B, f, EI_ANG, U0 + s*PC, PH*2, 31, bed, Math.min(deck(U0 + s*PC), yS) - 0.8, GRAN); fbox(B.a(GRAN), f, EI_ANG, s < 0 ? uL - 1.5 : uR + 1.5, 0, 3.2, HW*2 + 2, bed, deck(s < 0 ? uL : uR) - 0.2); }
    // railings (inside the ribs over the main span), lamps
    for (const w of [-1, 1]){ railing(B, f3, uL, uR, w*(HW - 0.75), u => deck(u) - 0.12, RAIL);
      for (const u of [uL + 3, U0 - PC - 0.5, U0 + PC + 0.5, uR - 3]) bLamp(B, f3, u, w*(HW - 0.75), deck(u) - 0.2, 6.8, RAIL, LAMP); }
    B.flush(g); return g; }};
SG_PLACES.push({type:'tyeitai', lat:EI_LAT, lon:EI_LON, rot:0});

// ---------------- Kiyosu Bridge: a self-anchored suspension bridge hung from high-tensile steel eyebar chains, spans
// 47.4 + 91.44 + 47.4 m (186.2 m), width 25.9 m, modelled on the Hindenburg Bridge at Cologne; the chains are anchored at both ends
// of the stiffening girders; painted blue-violet; at night white light on the chains, warm white below, the tower portals lit.
const KI_LAT = 35.682412, KI_LON = 139.791894, KI_R = 100, KI_ANG = -32.63*D2R;
LANDMARKS.tykiyosu = {zh:'清洲桥', en:'Kiyosu Bridge', cat:'old', r:KI_R, h:28, water:true,
  lt:{m:0, c:'#f4f6ff', k:0.9, e:0.6},
  build(){
    const g = new THREE.Group(), B = mkBatch(), G = mkGround(KI_LAT, KI_LON, KI_R), D = D_TYX.KIYO;
    const road = D.decks.find(d => d.c <= 10), deck = deckProfile(G, KI_LAT, KI_LON, road, KI_ANG, 0.18).deckAt;
    const f = F(0, 0, KI_ANG), f3 = F3(0, 0, KI_ANG), wY = G.abs(-0.3), bed = wY - 4.5;
    const STL = {c:'#8f9fd2', m:0, lc:'#ffffff', lk:1.2, e:0.7}, GIRK = {c:'#8797cc', m:0, lc:'#ffd9a8', lk:0.9}, RAIL = {c:'#9ba9d6', m:0, lk:0.45}, SOFF = '#6c7178', GRAN = {c:'#a49f95', m:0, lk:0.4}, PIN = '#6e7cb0', LAMP = {c:'#fff3dc', glow:'#fff0d4', gk:1.5};
    const HW = 12.9, VC = 12.45, UT = 45.72, AE = 93.1, HT = 17.0;
    const dS = u => deck(u) - 0.3;
    for (const s of [-1, 1]){ const us = stations(-AE, AE, 56); ribStrip(B.a(SOFF), f3, us, u => dS(u), u => dS(u) - 0.6, s*(HW - 6.4), HW); }
    for (let u = -AE + 2; u < AE - 1; u += 4.57){ const y = dS(u); fbox(B.a(SOFF), f, KI_ANG, u, 0, 0.4, HW*2 - 1, y - 1.3, y - 0.6); }
    // the stiffening plate girders along both edges (top a little above the deck, under the chains)
    for (const s of [-1, 1]) ribStrip(B.a(GIRK), f3, stations(-AE - 0.5, AE + 0.5, 60), u => deck(u) + 1.0, u => deck(u) - 2.2, s*VC, 0.7);
    // the towers: two box legs per tower with a crossbeam and an arched portal beam, saddles on top
    const yTT = u => deck(u) + HT;
    for (const su of [-1, 1]){ const u = su*UT, y0 = deck(u) - 2.0, yt = yTT(u);
      for (const s of [-1, 1]){ const c = f(u, s*VC); fbox(B.a(STL), f, KI_ANG, u, s*VC, 2.2, 1.5, y0, yt - 1.0); fbox(B.a(STL), f, KI_ANG, u, s*VC, 2.8, 2.0, yt - 1.0, yt + 0.6); void c; }
      fbox(B.a(STL), f, KI_ANG, u, 0, 1.3, VC*2, yt - 2.6, yt - 1.0);
      // the arched portal below the crossbeam
      const n = 14; for (let i = 0; i < n; i++){ const v0 = -VC + 0.8 + (2*VC - 1.6)*i/n, v1 = -VC + 0.8 + (2*VC - 1.6)*(i + 1)/n, ar = v => yt - 2.6 - 3.2*(1 - Math.sqrt(Math.max(0, 1 - Math.pow(v/(VC - 0.8), 2))));   // the arched opening: highest at the middle, haunched at the legs
        const a = f3(u, ar(v0), v0), b = f3(u, ar(v1), v1); const a2 = [a[0], a[1] - 0.9, a[2]], b2 = [b[0], b[1] - 0.9, b[2]], at = [a[0], yt - 2.6, a[2]], bt = [b[0], yt - 2.6, b[2]];
        quad(B.a(STL), a2, b2, b, a); quad(B.a(STL), a, b, b2, a2); quad(B.a(STL), a, b, bt, at); quad(B.a(STL), at, bt, b, a); }
      for (const s of [-1, 1]){ const c = f3(u, yt + 0.6, s*VC); cyl(B.a(PIN), 0.9, 0.9, c[0], c[2], yt + 0.6, yt + 1.4, 10, true); }
    }
    // the eyebar chains: parabolas from the girder ends up to the tower tops and down to the middle of the main span
    const yMid = deck(0) + 1.9;
    const chainY = u => { const a = Math.abs(u); if (a <= UT){ const k = a/UT; return yMid + (yTT(UT*Math.sign(u || 1)) + 0.6 - yMid)*k*k; }
      const k = (a - UT)/(AE - UT), yA = yTT(UT*Math.sign(u)) + 0.6, yE = deck(Math.sign(u)*AE) + 0.9, s0 = 0.55; return yA + (yE - yA)*(k*(1 - s0) + s0*k*k); };
    for (const s of [-1, 1]){
      const us = stations(-AE, AE, 72); ribStrip(B.a(STL), f3, us, u => chainY(u) + 0.75, u => chainY(u) - 0.75, s*VC, 0.55);
      for (let i = 1; i < 72; i += 3){ const u = us[i], c = f3(u, chainY(u), s*VC + s*0.35); cyl(B.a(PIN), 0.35, 0.35, c[0], c[2], c[1] - 0.25, c[1] + 0.25, 8, true); }
      // hangers every 4.57 m from the chain to the girder top
      for (let u = -AE + 4.57; u < AE - 2; u += 4.57){ if (Math.abs(Math.abs(u) - UT) < 1.6) continue; const y0 = deck(u) + 1.0, y1 = chainY(u) - 0.75; if (y1 - y0 < 0.3) continue; fbox(B.a(STL), f, KI_ANG, u, s*VC, 0.3, 0.3, y0, y1); }
      // the anchorages at the girder ends
      fbox(B.a(STL), f, KI_ANG, s*0 + AE - 1.0, s*VC, 2.4, 1.2, deck(AE) - 2.2, deck(AE) + 2.2); fbox(B.a(STL), f, KI_ANG, -AE + 1.0, s*VC, 2.4, 1.2, deck(-AE) - 2.2, deck(-AE) + 2.2);
    }
    // piers under the towers, abutments
    for (const s of [-1, 1]){ pier(B, f, KI_ANG, s*UT, 7.0, 31, bed, deck(s*UT) - 2.0, GRAN); fbox(B.a(GRAN), f, KI_ANG, s*(AE + 1.8), 0, 3.6, HW*2 + 2, bed, deck(s*AE) - 0.2); }
    for (const w of [-1, 1]){ railing(B, f3, -AE, AE, w*(VC - 0.75), u => deck(u) - 0.12, RAIL);
      for (const u of [-AE + 3, -UT - 4, UT + 4, AE - 3]) bLamp(B, f3, u, w*(VC - 0.75), deck(u) - 0.2, 6.5, RAIL, LAMP); }
    B.flush(g); return g; }};
SG_PLACES.push({type:'tykiyosu', lat:KI_LAT, lon:KI_LON, rot:0});
}
// ===== Ryōgoku: the Edo-Tokyo Museum (Kikutake Kiyonori, 1993) and the Ryōgoku Kokugikan (1985) =====
{
// ---------------- Edo-Tokyo Museum: 62.2 m tall; the museum box stands on four legs (composite "H" sections, 14 m deep) 19.2 m above
// the plaza and cantilevers 36 m beyond them; the shape of a raised storehouse under a temple-like roof, clad in whitish-silver
// fluorine-coated square panels; the red escalator from the plaza (Wikipedia). On the OSM outlines: the box w76187056 and the
// podium under the plaza w181376633 (its height in the app is a 27 m estimate; here the plaza is at 9.5 m, an estimate).
const E_LAT = 35.696443, E_LON = 139.796076, E_R = 186;
LANDMARKS.tyedotokyo = {zh:'江户东京博物馆', en:'Edo-Tokyo Museum', cat:'new', r:E_R, h:62.2,
  lt:{m:0, c:'#eef2ff', k:0.75, e:0.7},
  build(){
    const g = new THREE.Group(), B = mkBatch(), G = mkGround(E_LAT, E_LON, E_R), gl = G.gl, D = D_TYX.EDO;
    const PAN = {c:'#d5d8d8', m:0, lc:'#f2f5ff', lk:0.8}, JOINT = '#9da3a6', ROOF = {c:'#bfc5c8', m:0, lc:'#f2f5ff', lk:0.6}, DARKR = '#7c8387', UNDER = '#5e6366',
      LEG = {c:'#c6c8c6', m:0, lk:0.6}, POD = {c:'#b2aea6', m:0, lk:0.4}, PAVE = '#c2bcb1', RED = {c:'#c0392b', m:0, lk:0.6, glow:'#ff6a4a', gk:0.25}, WIN = {c:'#465058', glow:'#ffe2b0', gk:0.5}, LEAF = {c:'#5a7444', m:0, lk:0.2}, TRK = '#5b4a3a', GLS = {c:'#5d6c76', m:1, fh:4.5, cw:3.0};
    const box = D.box, c0 = cen(box), g0 = gl(c0[0], c0[1]), q = orect(box), f = F(q.cx, q.cz, q.ang), f3 = F3(q.cx, q.cz, q.ang);
    const yP = g0 + 9.5, yb = yP + 19.2, yE = g0 + 51.5, yTop = g0 + 62.2;
    // ---- the podium under the plaza: concrete walls, a glazed ground floor, the paved plaza with its parapet
    { const P = D.pod, lo = Math.min(-0.5, lowUnder(gl, P)) - 1.5;
      prism(B.a(POD), P, lo, yP, false); capP(B.a(PAVE), P, yP);
      band(B.a(GLS), P, g0 - 0.2, g0 + 4.2, 0.05); band(B.a(POD), P, yP - 0.2, yP + 1.1, 0.1);
      // planted trees on the plaza (away from the box)
      const r = LMCTX.rng; const [x0, z0, x1, z1] = bbox(P);
      for (let x = x0 + 8; x < x1 - 6; x += 13) for (let z = z0 + 8; z < z1 - 6; z += 13){ if (!inPoly(P, x, z) || inPoly(offsetRing(box, 6), x, z) || r() < 0.55) continue;
        if (!inPoly(P, x + 4, z) || !inPoly(P, x - 4, z) || !inPoly(P, x, z + 4) || !inPoly(P, x, z - 4)) continue;
        cyl(B.a(TRK), 0.25, 0.32, x, z, yP, yP + 3.5, 6); crown(B.a(LEAF), x, yP + 2.6, z, 3.0, 5.0, 7); } }
    // ---- the four legs ("H" sections), standing on the plaza
    for (const su of [-1, 1]) for (const sv of [-1, 1]){ const u = su*45, v = sv*21;
      for (const w of [-1, 1]) fbox(B.a(LEG), f, q.ang, u, v + w*2.6, 14, 1.6, yP, yb + 0.5);
      fbox(B.a(LEG), f, q.ang, u, v, 1.8, 5.2, yP, yb + 0.5);
      fbox(B.a(POD), f, q.ang, u, v, 15, 7.4, yP, yP + 0.8); }
    // ---- the box: a belly that widens upwards to the full outline at the eaves, then the roof
    const R0 = offsetRing(box, -4.5), R1 = offsetRing(box, -1.2), R2 = box, ringAt = y => { const t = (y - yb)/(yE - yb), a = t < 0.35 ? R0 : R1, b = t < 0.35 ? R1 : R2, k = t < 0.35 ? t/0.35 : (t - 0.35)/0.65; return a.map((p, i) => [lerp(p[0], b[i][0], k), lerp(p[1], b[i][1], k)]); };
    capP(B.a(UNDER), R0, yb, true);
    const yM = yb + (yE - yb)*0.35;
    skin(B.a(PAN), R0, yb, R1, yM); skin(B.a(PAN), R1, yM, R2, yE - 4.2);
    // the panel joints (a square grid) on the walls
    for (let y = yb + 3.4; y < yE - 4.5; y += 3.4){ const P = ringAt(y); band(B.a(JOINT), offsetRing(P, 0.06), y, y + 0.14, 0); }
    { const n = R0.length; for (let i = 0; i < n; i++){ const j = (i + 1) % n, L = Math.hypot(R2[j][0] - R2[i][0], R2[j][1] - R2[i][1]), k = Math.floor(L/3.4);
      for (let m = 1; m < k; m++){ const t = m/k, A = [lerp(R0[i][0], R0[j][0], t), lerp(R0[i][1], R0[j][1], t)], Bm = [lerp(R1[i][0], R1[j][0], t), lerp(R1[i][1], R1[j][1], t)], C = [lerp(R2[i][0], R2[j][0], t), lerp(R2[i][1], R2[j][1], t)];
        const nx = A[0] - C[0], nz = A[1] - C[1], nl = Math.hypot(nx, nz) || 1, o = 0.06/nl;
        beam(B.a(JOINT), [A[0] - nx*o, yb + 0.2, A[1] - nz*o], [Bm[0] - nx*o*0.3, yM, Bm[1] - nz*o*0.3], 0.14); beam(B.a(JOINT), [Bm[0] - nx*o*0.3, yM, Bm[1] - nz*o*0.3], [C[0] - nx*o*0.1, yE - 4.4, C[1] - nz*o*0.1], 0.14); } } }
    // the library floor's window band under the eaves, the eave fascia
    prism(B.a(WIN), offsetRing(R2, -0.3), yE - 4.2, yE - 0.8, false); prism(B.a(PAN), R2, yE - 0.8, yE, false);
    // the roof: overhanging eaves, a concave temple-like slope up to the ridge level, a darker top
    { const E = offsetRing(R2, 2.4), M = offsetRing(R2, -6), T = offsetRing(R2, -15), yR1 = yE + 5.8;
      capP(B.a(UNDER), E, yE - 0.05, true); prism(B.a(PAN), E, yE, yE + 0.9, false);
      skin(B.a(ROOF), E, yE + 0.9, M, yR1); skin(B.a(ROOF), M, yR1, T, yTop - 0.6); capP(B.a(DARKR), T, yTop - 0.6); band(B.a(PAN), T, yTop - 0.6, yTop, 0.0); }
    // ---- the red escalator tube from the plaza up into the belly
    { const a = f3(-8, yP + 0.2, -44), b = f3(-8, yb - 0.5, -12); beam(B.a(RED), a, b, 5.0, 4.4); fbox(B.a(RED), f, q.ang, -8, -45.5, 5.6, 4.0, yP, yP + 4.8); }
    void c0;
    B.flush(g); return g; }};
SG_PLACES.push({type:'tyedotokyo', lat:E_LAT, lon:E_LON, rot:0});

// ---------------- Ryōgoku Kokugikan: the sumo hall (completed January 1985, about 11,000 seats): a square plan with cut corners
// under a large Japanese-style hipped roof in green, with a raised upper roof over the ring (kotobank); on the OSM outline w76187058.
// The wall and roof heights (about 40 m to the top) are estimates.
const K_LAT2 = 35.696927, K_LON2 = 139.793483, K_R2 = 67;
LANDMARKS.tykokugikan = {zh:'两国国技馆', en:'Ryōgoku Kokugikan', cat:'new', r:K_R2, h:40,
  lt:{m:0, c:'#ffe2b8', k:0.85, e:0.55},
  build(){
    const g = new THREE.Group(), B = mkBatch(), G = mkGround(K_LAT2, K_LON2, K_R2), gl = G.gl, ring = D_TYX.KOKU.ring;
    const WALL = {c:'#dcd3c2', m:0}, WALL2 = {c:'#cbc1ae', m:0}, ROOF = {c:'#5d9178', m:0, lk:0.5}, RIDGE = '#467a63', WIN = {c:'#4a5258', glow:'#ffdcae', gk:0.55}, BASE = '#9e978b', CAN = {c:'#c4bba9', m:0};
    const q = orect(ring), f = F(q.cx, q.cz, q.ang), g0 = gl(q.cx, q.cz), lo = Math.min(-0.5, lowUnder(gl, ring)) - 1.2;
    // the chamfered square (from the outline's rectangle), its offsets for the roof tiers
    const oct = (L, W, c) => [[-L/2 + c, -W/2], [L/2 - c, -W/2], [L/2, -W/2 + c], [L/2, W/2 - c], [L/2 - c, W/2], [-L/2 + c, W/2], [-L/2, W/2 - c], [-L/2, -W/2 + c]].map(p => f(p[0], p[1]));
    const L = q.L - 1.0, W = q.W - 1.0, C = 13, P = oct(L, W, C);
    prism(B.a(BASE), ring, lo, g0 + 0.6, true);
    const yW = g0 + 14.5;
    prism(B.a(WALL), P, g0 + 0.6, yW, false);
    band(B.a(WALL2), P, g0 + 0.6, g0 + 4.2, 0.25); band(B.a(WIN), P, g0 + 9.0, g0 + 12.0, 0.08); band(B.a(WALL2), P, yW - 1.0, yW, 0.3);
    ringFins(B.a(WALL2), P, g0 + 4.2, yW - 1.0, 4.2, 0.5, 0.35, 6);
    // entrance canopies on the long sides
    for (const s of [-1, 1]) fbox(B.a(CAN), f, q.ang, 0, s*(W/2 + 2.5), 26, 5, g0 + 4.6, g0 + 5.4);
    // the lower roof: eaves out 3 m, a concave slope to the upper tier; the lantern band; the upper hipped roof
    const E = oct(L + 6, W + 6, C + 1.2), M = oct(L - 22, W - 22, C - 3), T = oct(L - 44, W - 44, Math.max(3, C - 7));
    const y1 = yW + 0.6, y2 = g0 + 24, y3 = g0 + 31;
    capP(B.a(WALL2), E, yW + 0.05, true); prism(B.a(ROOF), E, yW, y1, false);
    skin(B.a(ROOF), E, y1, M, y2); skin(B.a(ROOF), M, y2, T, y3);
    // the raised band (vents) and the upper roof
    const T2 = oct(L - 47, W - 47, Math.max(2.5, C - 8));
    prism(B.a(WALL), T2, y3 - 0.2, y3 + 2.4, false); band(B.a(WIN), T2, y3 + 0.5, y3 + 1.9, 0.05);
    const U0 = oct(L - 42, W - 42, Math.max(3, C - 7)), U1 = oct(L - 60, W - 60, 2), yt = g0 + 40;
    capP(B.a(WALL2), U0, y3 + 2.4, true); skin(B.a(ROOF), U0, y3 + 2.4, U1, yt - 0.5); capP(B.a(ROOF), U1, yt - 0.5);
    // ridges on the hips of both tiers
    for (let i = 0; i < 8; i++){ if (i % 2) continue; beam(B.a(RIDGE), [E[i][0], y1 + 0.1, E[i][1]], [M[i][0], y2 + 0.1, M[i][1]], 0.45); beam(B.a(RIDGE), [M[i][0], y2 + 0.1, M[i][1]], [T[i][0], y3 + 0.1, T[i][1]], 0.45);
      beam(B.a(RIDGE), [U0[i][0], y3 + 2.5, U0[i][1]], [U1[i][0], yt - 0.4, U1[i][1]], 0.35); const j = i + 1; beam(B.a(RIDGE), [E[j][0], y1 + 0.1, E[j][1]], [M[j][0], y2 + 0.1, M[j][1]], 0.45); beam(B.a(RIDGE), [M[j][0], y2 + 0.1, M[j][1]], [T[j][0], y3 + 0.1, T[j][1]], 0.45); beam(B.a(RIDGE), [U0[j][0], y3 + 2.5, U0[j][1]], [U1[j][0], yt - 0.4, U1[j][1]], 0.35); }
    B.flush(g); return g; }};
SG_PLACES.push({type:'tykokugikan', lat:K_LAT2, lon:K_LON2, rot:0});
}
// ===== Hama-rikyū Gardens (浜離宮恩賜庭園), SITE: the Edo-period shogun's bayside garden, 25 ha on the OSM park outline w7836744 =====
// Shioiri-no-ike, the tidal pond fed by sea water (the only one left in Tokyo), with the Nakajima teahouse (first built 1707, the
// present one 1983) on its island reached by the 118 m hinoki O-tsutai-bashi bridge (veltra / Tokyo Parks); the Matsu (2010), Tsubame (2015) and Taka
// (2018) teahouses rebuilt on the shore; the duck-hunting ponds (1778, 1791); the 300-year pine; the outer stone sea walls; the
// flower fields; the water-bus pier on the Sumida side (Tokyo Metropolitan Government Bureau of Construction). The ponds, woods,
// lawns, flower beds and paths are painted from their OSM polygons and lines (no keepRoads: several path lines carry bridge decks),
// the bridges and garden houses are rebuilt on their OSM lines / outlines (heights estimated). The Shiodome towers stay real.
Object.assign(SITES, {tyhamarikyu:{zh:'滨离宫恩赐庭园', en:'Hama-rikyū Gardens', lat:35.659949, lon:139.763513, r:400, keep:D_TYX.HAMA.keep, h:14,
  lt:{m:0, c:'#ffcf9a', k:0.7, e:0.5},
  build(ctx){
    const g = new THREE.Group(), B = mkBatch(), gy = ctx.gy, D = D_TYX.HAMA;
    const ST = {c:'#9f998d', m:0, lk:0.35}, STD = '#878175', WOOD = '#76604a', WOODD = '#5a4838', ROOF = '#4d5358', THAT = '#8a7a58', WALL = '#e9e1cd', SHOJI = {c:'#e8e0c8', glow:'#ffe0b0', gk:0.35}, RID = '#3a3e42', WIST = '#6f8f58', LAMP = {c:'#f3ead4', glow:'#ffd9a0', gk:1.0};
    ctx.paint(D.keep, [126, 146, 96]);
    for (const P of D.forest) ctx.paint(P, [88, 114, 76]);
    for (const P of D.grass) ctx.paint(P, [140, 162, 104]);
    for (const P of D.flower) ctx.paint(P, [178, 172, 96]);
    for (const P of D.water) ctx.paint(P, [112, 150, 156]);
    for (const P of D.holes || []) ctx.paint(P, [104, 128, 84]);          // the islands in the ponds (the water rings' holes)
    for (const P of D.paths){ const w = P[P.length - 1][0]; ctx.line(P.slice(0, -1), w, [208, 196, 168]); }
    const KT = {d:'d', p:'pine', m:'maple', s:'sakura'};
    for (const [x, z, s, k] of D.trees) ctx.tree(x, z, s, KT[k] || 'd');
    // the outer stone sea walls (where the garden meets the moats, the canal and the bay)
    for (const W of D.walls){ if (W.length < 2) continue;
      const m = Math.floor(W.length/2), a = W[m - 1] || W[0], b = W[m], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, mx = (a[0] + b[0])/2, mz = (a[1] + b[1])/2;
      const sd = inPoly(D.keep, mx - dz/l*3, mz + dx/l*3) ? -1 : 1;     // the face looks out of the garden
      ishigaki(B.a(ST), W, p => Math.min(gy(p[0], p[1]), -0.3) - 1.8, p => Math.max(gy(p[0], p[1]), 0.6) + 0.9, 1.4, 0.18, sd); }
    // stone edging round the ponds
    for (const P of D.water.concat(D.holes || [])){ if (P.length < 4) continue; const L = P.concat([P[0]]); for (let i = 0; i + 1 < L.length; i++){ const a = L[i], b = L[i + 1], y = Math.min(gy(a[0], a[1]), gy(b[0], b[1]));
      const ang = Math.atan2(-(b[1] - a[1]), b[0] - a[0]), len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.8) continue; obox(B.a(STD), (a[0] + b[0])/2, (a[1] + b[1])/2, ang, len + 0.3, 0.6, y - 0.9, y + 0.25); } }
    // the bridges: hinoki plank decks on posts with low rails (O-tsutai-bashi to the Nakajima teahouse, the others)
    for (const br of D.bridges){ const P = br.p; if (P.length < 2) continue;
      const y = Math.max(gy(P[0][0], P[0][1]), gy(P[P.length - 1][0], P[P.length - 1][1]), 0.4) + 0.75, wide = /お伝い/.test(br.n) ? 2.6 : 2.0;
      for (let i = 0; i + 1 < P.length; i++){ const a = P[i], b = P[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.3) continue;
        const ang = Math.atan2(-(b[1] - a[1]), b[0] - a[0]), f = F((a[0] + b[0])/2, (a[1] + b[1])/2, ang);
        fbox(B.a(WOOD), f, ang, 0, 0, len + 0.4, wide, y - 0.25, y);
        for (const s of [-1, 1]){ fbox(B.a(WOODD), f, ang, 0, s*(wide/2 - 0.08), len + 0.4, 0.12, y + 0.75, y + 0.88); }
        const n = Math.max(1, Math.round(len/3)); for (let k = 0; k <= n; k++){ const u = -len/2 + len*k/n; for (const s of [-1, 1]){ const p = f(u, s*(wide/2 - 0.1)); cyl(B.a(WOODD), 0.1, 0.12, p[0], p[1], Math.min(gy(p[0], p[1]), -0.3) - 1.0, y + 0.88, 5); } } } }
    // the garden houses on their OSM outlines
    for (const o of D.bld){ const [cx, cz, a, L, W] = o.q, y0 = Math.min(...o.r.map(p => gy(p[0], p[1]))), f = F(cx, cz, a), n = o.n || '';
      const tea = /御茶屋|芳梅亭/.test(n), thatch = /鷹の御茶屋|燕の御茶屋/.test(n), shrine = /神社/.test(n), trellis = /藤棚/.test(n), big = L*W > 220;
      if (trellis){ for (const sx of [-1, 1]) for (const sz of [-1, 1]){ const p = f(sx*(L/2 - 0.4), sz*(W/2 - 0.4)); cyl(B.a(WOODD), 0.12, 0.12, p[0], p[1], y0, y0 + 2.6, 5); }
        fbox(B.a(WIST), f, a, 0, 0, L, W, y0 + 2.6, y0 + 2.9); continue; }
      const wh = tea ? 2.9 : big ? 3.8 : 2.8;
      prism(B.a(ST), o.r, y0 - 1.0, y0 + (tea ? 0.6 : 0.3), true);
      prism(B.a(tea ? SHOJI : WALL), offsetRing(o.r, -0.4), y0 + 0.3, y0 + wh, false);
      if (tea) for (const s of [-1, 1]) fbox(B.a(WOODD), f, a, 0, s*(W/2 - 0.35), L - 0.7, 0.12, y0 + 0.6, y0 + wh - 0.3);
      jroof(g, cx, cz, a, L + 1.4, W + 1.4, y0 + wh, {col:thatch ? THAT : shrine ? '#5f9a84' : ROOF, h:thatch ? Math.max(2.2, W*0.42) : Math.max(1.4, W*0.3), k:Math.max(0.2, (L - W)/2), gab:thatch ? 0 : 0.5, pw:thatch ? 1.0 : 1.4, lift:thatch ? 0 : 0.25, gcol:WALL, ridge:0.3, rcol:thatch ? THAT : RID, over:1.0, nt:4, n:3}); }
    // the 300-year pine: a wide, low-spreading black pine propped on crutches
    { const p = D.named['三百年の松']; if (p){ const y = gy(p[0], p[1]), r = ctx.rng;
      LCyl(g, 0.5, 0.75, 4.0, p[0], y, p[1], '#5b4636', 7);
      for (let k = 0; k < 7; k++){ const t = k/7*TAU + r()*0.4, L = 7 + r()*5, x = p[0] + Math.cos(t)*L, z = p[1] + Math.sin(t)*L, yb = y + 3.0 + r()*1.2;
        LBeam(g, [p[0], y + 3.5, p[1]], [x, yb, z], 0.32, '#5b4636', 5); LSph(g, 2.6 + r()*1.2, x, yb + 0.9, z, '#2f5530', 0.45, 7);
        if (k % 2 === 0){ LBeam(g, [x*0.6 + p[0]*0.4, gy(x, z), z*0.6 + p[1]*0.4], [x*0.6 + p[0]*0.4, yb - 0.3, z*0.6 + p[1]*0.4], 0.12, WOODD, 4); } }
      LSph(g, 3.4, p[0], y + 5.6, p[1], '#2f5530', 0.5, 8); } }
    // the water-bus pier on the Sumida side: a pontoon, the covered gangway
    { const p = D.named['水上バス発着場']; if (p){ const y = -0.1; obox(B.a('#8a8f92'), p[0] + 8, p[1], 0.3, 22, 7, y - 0.6, y + 0.6); obox(B.a(ROOF), p[0] + 8, p[1], 0.3, 18, 5, y + 3.0, y + 3.3);
      for (const dx of [-8, 0, 8]) for (const dz of [-2.2, 2.2]) cyl(B.a('#c9ccce'), 0.1, 0.1, p[0] + 8 + dx, p[1] + dz, y + 0.6, y + 3.0, 5);
      obox(B.a('#8a8f92'), p[0] - 2, p[1], 0.3, 12, 2.4, y + 0.4, y + 1.0); } }
    // lamps at the gates and along the main paths
    for (const k of ['大手門', '中の御門']){ const p = D.named[k]; if (!p) continue; for (const s of [-1, 1]){ const x = p[0] + s*6, z = p[1], y = gy(x, z); cyl(B.a(STD), 0.12, 0.15, x, z, y, y + 3.4, 6); cyl(B.a(LAMP), 0.3, 0.3, x, z, y + 3.4, y + 4.0, 6, true); ctx.lamp(x, y + 3.8, z, [255, 214, 160]); }
      // the gate's stone walls (masugata)
      for (const s of [-1, 1]){ const x = p[0] + s*11, z = p[1], y = gy(x, z); obox(B.a(ST), x, z, 0.62, 10, 4, y - 1, y + 3.2); } }
    const lab = (k, dy, zh, en) => { const p = D.named[k]; return p ? {x:p[0], z:p[1], y:gy(p[0], p[1]) + dy, zh, en} : null; };
    g.userData.labels = [lab('中島の御茶屋', 9, '中岛御茶屋', 'Nakajima Teahouse'), lab('潮入の池', 6, '潮入之池', 'Shioiri Pond')].filter(Boolean);
    B.flush(g); return g; }}});
}
