// ---------------- site helpers: real footprints rebuilt (absolute heights from ctx.gy) ----------------
// a low town building on its real footprint P: plinth to the low side, walls (window-lit material), ground-floor shopfront,
// parapet, flat roof with a few roof sheds / water tanks; opts: {wall, roof, shop, h, fh, sheds, rng, par}
function townBld(B, P, gy, o){
  const [lo, hi] = groundSpan(gy, P), y0 = lo - 1.5, yg = hi + 0.15, yt = hi + o.h;
  wallP(B.p(o.wall), P, y0, yt); capP(B.p(o.roof), P, yt);
  if (o.par !== false) wallP(B.p(o.trim || o.roof), offP(P, 0.25), yt, yt + 0.9);
  const E = edgesF(P);
  if (o.shop) for (const e of E){ if (e.L < 3) continue; quadP(B.p(o.shop), e.F(0.3, yg + 0.2, 0.06), e.F(e.L - 0.3, yg + 0.2, 0.06), e.F(e.L - 0.3, yg + 3.0, 0.06), e.F(0.3, yg + 3.0, 0.06));
    if (o.awn) quadP(B.p(o.awn), e.F(0.2, yg + 3.4, 0.05), e.F(e.L - 0.2, yg + 3.4, 0.05), e.F(e.L - 0.2, yg + 3.0, 1.4), e.F(0.2, yg + 3.0, 1.4)); }
  if (o.band) for (let y = yg + (o.fh || 3.2); y < yt - 1; y += (o.fh || 3.2)) for (const e of E) if (e.L > 2) quadP(B.p(o.band), e.F(0, y - 0.12, 0.05), e.F(e.L, y - 0.12, 0.05), e.F(e.L, y + 0.12, 0.05), e.F(0, y + 0.12, 0.05));
  if (o.sheds && o.rng){ const A = Math.abs(sArea(P)); if (A > 60 && o.rng() < 0.6){ const c = ctr(P), O = obb(P); if (pip(P, c[0], c[1])) boxP(B.p(o.trim || o.roof), Math.min(3.5, O.a), 2.4, Math.min(3, O.b), c[0], yt, c[1], -O.ang); }
    if (A > 40 && o.rng() < 0.45){ const c = ctr(P); latheP(B.p(o.tank || '#c9ccc9'), [[0.8, yt], [0.8, yt + 1.6]], c[0] + 1.2, c[1] - 1.0, 8); } }
  return {lo, hi, yt};
}
// hip / gable tiled roof on the OBB of a footprint (heritage houses), walls on the real outline
function tileHouse(B, P, gy, o){
  const O0 = obb(P);
  if ((O0.fill < 0.72 || O0.b > (o.maxb || 8)) && !o.noSplit && Math.abs(sArea(P)) > 60){ let r = null; for (const Q of strips(P, 2*(o.maxb || 8)*0.8)){ const q = tileHouse(B, Q, gy, Object.assign({}, o, {noSplit:true})); r = r || q; } if (r) return r; }
  const [lo, hi] = groundSpan(gy, P), y0 = lo - 1.2, yw = hi + o.w, O = O0;
  wallP(B.p(o.wall), P, y0, yw);
  if (O.fill > 0.7 && O.b > 1.5){ const ov = o.ov || 0.5, rh = Math.min(o.rh || 4, O.b*0.75), a1 = o.hip ? Math.max(0.2, O.a - O.b) : O.a + ov;
    roofP(B.p(o.tile), O.cx, O.cz, O.a + ov, O.b + ov, a1, 0, yw, rh, {ry:-O.ang, pw:1.15, ridge:o.ridge ? B.p(o.ridge) : null, rr:0.18, nt:3, n:2, sag:o.sag || 0});
    if (!o.hip){ const c = Math.cos(O.ang), s = Math.sin(O.ang); for (const sx of [-1, 1]){ const X = (u, v) => [O.cx + c*sx*O.a - s*v, 0, O.cz + s*sx*O.a + c*v]; const p0 = X(0, -O.b), p1 = X(0, O.b), p2 = X(0, 0);
      triP(B.p(o.gable || o.wall), [p0[0], yw, p0[2]], [p1[0], yw, p1[2]], [p2[0], yw + rh*(O.b/(O.b + ov)), p2[2]]); } } }
  else { capP(B.p(o.flat || o.wall), P, yw); skirtP(B.p(o.tile), P, yw - 0.1, 0.9, 0.4, Math.min(1.2, O.b*0.4)); }
  return {lo, hi, yw};
}
// a paved ribbon draped on the ground along a polyline (the ground texture is ~31 m/px, too coarse for lanes): width w, dy above ground
function ribbonP(o, L, w, gy, dy, step){ step = step || 3; const len = plen(L); if (len < 0.5) return; const n = Math.max(1, Math.ceil(len/step)); let prev = null;
  for (let i = 0; i <= n; i++){ const p = along(L, len*i/n), nx = -Math.sin(p[2])*w/2, nz = Math.cos(p[2])*w/2, a = [p[0] + nx, 0, p[1] + nz], b = [p[0] - nx, 0, p[1] - nz];
    a[1] = gy(a[0], a[2]) + dy; b[1] = gy(b[0], b[2]) + dy; if (prev) quadP(o, prev[0], prev[1], b, a); prev = [a, b]; } }
