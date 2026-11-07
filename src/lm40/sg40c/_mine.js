// ---- sg40c helpers ----
const rngL = () => LMCTX.rng();
// Sutherland-Hodgman: polygon P clipped by the half plane a*x + b*z <= c
function clipH(P, a, b, c){ const out = []; for (let i = 0; i < P.length; i++){ const p = P[i], q = P[(i+1) % P.length], dp = a*p[0] + b*p[1] - c, dq = a*q[0] + b*q[1] - c;
  if (dp <= 0) out.push(p); if ((dp < 0) !== (dq < 0) && Math.abs(dp - dq) > 1e-9){ const t = dp/(dp - dq); out.push([p[0] + (q[0] - p[0])*t, p[1] + (q[1] - p[1])*t]); } } return out; }
// P clipped by the band s0 <= d.p <= s1, t0 <= n.p <= t1 (d, n unit vectors)
function clipST(P, d, n, s0, s1, t0, t1){ let Q = P; Q = clipH(Q, d[0], d[1], s1); Q = clipH(Q, -d[0], -d[1], -s0); Q = clipH(Q, n[0], n[1], t1); Q = clipH(Q, -n[0], -n[1], -t0); return Q; }
// windows: rectangles on every edge of plan P (outward offset w), storeys from y0 (fh tall), bays ~bay m, window fw x wh, sill
function winP(o, P, y0, nf, fh, bay, fw, wh, sill, w, minL){ for (const E of edgesF(P)){ if (E.L < (minL || 2.5)) continue; const n = Math.max(1, Math.round(E.L/bay)), ww = Math.min(fw, E.L/n - 0.4);
  for (let f = 0; f < nf; f++){ const v = y0 + f*fh + sill; for (let j = 0; j < n; j++){ const u = (j + 0.5)*E.L/n; shapeP(o, rectO(u - ww/2, u + ww/2, v, v + wh), E.F, w || 0.05); } } } }
// horizontal bands on every edge (spandrels, cornices): a slab between offsets 0..dw from y to y + h
function bandP(o, P, y, h, dw){ for (const E of edgesF(P)) slabP(o, rectO(-0.02, E.L + 0.02, y, y + h), E.F, 0, dw); }
// a frame turned by angle a: (u, v) plan coordinates -> (x, z)
const frm = a => { const c = Math.cos(a), s = Math.sin(a); return {X:(u, v) => [u*c - v*s, u*s + v*c], R:(u, y, v) => [u*c - v*s, y, u*s + v*c], rect:(u0, u1, v0, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(p => [p[0]*c - p[1]*s, p[0]*s + p[1]*c])}; };
// gable roof in frame Fr: ridge along u (u0..u1), eaves at v0, v1 (overhang ov), eave height y, rise h, slight sag of the slopes;
// the two gable-end triangles go to batch gw (wall colour) if given. along='v' turns it (ridge along v).
function gableR(o, Fr, u0, u1, v0, v1, y, h, ov, gw, along, sag){
  const R = along === 'v' ? (a, yy, b) => Fr.R(b, yy, a) : Fr.R; if (along === 'v'){ [u0, u1, v0, v1] = [v0, v1, u0, u1]; }
  const vm = (v0 + v1)/2, N = 3, sg = sag === undefined ? 0.12 : sag;
  const prof = []; for (let i = 0; i <= N; i++){ const t = i/N; prof.push([t, y + h*t - (i > 0 && i < N ? sg*h*Math.sin(PI*t) : 0)]); }
  for (const side of [-1, 1]){ const ve = side < 0 ? v0 - ov : v1 + ov;
    for (let i = 0; i < N; i++){ const [ta, ya] = prof[i], [tb, yb] = prof[i+1], va = ve + (vm - ve)*ta, vb = ve + (vm - ve)*tb, ya2 = ya - (i === 0 ? ov*h/((v1 - v0)/2) : 0);
      quadP(o, R(u0 - ov, ya2, va), R(u1 + ov, ya2, va), R(u1 + ov, yb, vb), R(u0 - ov, yb, vb)); } }
  if (gw) for (const u of [u0, u1]) triP(gw, R(u, y, v0), R(u, y, v1), R(u, y + h, vm));
}
// prism of a frame rectangle
const rectPrism = (o, Fr, u0, u1, v0, v1, y0, y1) => prismP(o, Fr.rect(u0, u1, v0, v1), y0, y1);
// generic storeyed block on plan P: walls, a band at each floor, windows (bay, width, height), parapet, roof cap
function blkP(B, P, y0, nf, fh, C, o){ o = o || {}; const yt = y0 + nf*fh;
  prismP(B.p(C.WALL), P, y0, yt, false); capP(B.p(C.ROOF || C.WALL), P, yt);
  for (let f = 1; f < nf; f++) if (C.BAND) bandP(B.p(C.BAND), P, y0 + f*fh - 0.3, 0.35, o.bd || 0.12);
  winP(B.p(C.WIN), P, y0 + (o.skip0 ? fh : 0), nf - (o.skip0 ? 1 : 0), fh, o.bay || 3.2, o.ww || 2.0, o.wh || fh*0.55, o.sill || fh*0.25, 0.05, 2.5);
  if (o.par !== false) parP(B.p(C.TRIM || C.WALL), P, yt, yt + (o.par || 1.0), 0.25);
  return yt; }
