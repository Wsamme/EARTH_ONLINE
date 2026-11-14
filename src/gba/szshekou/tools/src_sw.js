
// clip a plan polygon to the slab s0 <= p·u <= s1 (Sutherland-Hodgman, two half-planes)
function clipSlab(P, ux, uz, s0, s1){
  const half = (Q, f) => { const out = []; for (let i = 0; i < Q.length; i++){ const a = Q[i], b = Q[(i + 1) % Q.length], fa = f(a), fb = f(b);
    if (fa >= 0) out.push(a); if ((fa >= 0) !== (fb >= 0)){ const t = fa/(fa - fb); out.push([a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t]); } } return out; };
  let Q = half(P, p => p[0]*ux + p[1]*uz - s0); if (Q.length > 2) Q = half(Q, p => s1 - (p[0]*ux + p[1]*uz)); return Q;
}
// simple tree for landmarks (trunk + two crossed-pyramid crown): B batch, specs {tr, cr}
function lmTree(B, S, x, y, z, h, r){
  abox(B, S.tr, x - 0.2, x + 0.2, y, y + h*0.45, z - 0.2, z + 0.2);
  const c = [x, y + h*0.62, z], t = [x, y + h, z], b = [x, y + h*0.3, z];
  for (let i = 0; i < 6; i++){ const a0 = i/6*TAU, a1 = (i + 1)/6*TAU, p0 = [x + Math.cos(a0)*r, c[1], z + Math.sin(a0)*r], p1 = [x + Math.cos(a1)*r, c[1], z + Math.sin(a1)*r];
    B.t(S.cr, p0, p1, t); B.t(S.cr, p1, p0, b); }
}
function palmTree(B, S, x, y, z, h){
  beam(B, S.tr, [x, y, z], [x + 0.25, y + h, z + 0.15], 0.18);
  for (let i = 0; i < 7; i++){ const a = i/7*TAU, c = [x + 0.25, y + h, z + 0.15], e = [c[0] + Math.cos(a)*3.0, c[1] - 1.2, c[2] + Math.sin(a)*3.0], s = [-Math.sin(a)*0.5, 0, Math.cos(a)*0.5];
    B.q(S.cr, [c[0] + s[0], c[1] + 0.2, c[2] + s[2]], [c[0] - s[0], c[1] + 0.2, c[2] - s[2]], [e[0] - s[0]*0.3, e[1], e[2] - s[2]*0.3], [e[0] + s[0]*0.3, e[1], e[2] + s[2]*0.3]); }
}

// ================= Sea World (海上世界) with the Minghua (明华轮) =================
// The ship: OSM w105683429 ("Minghua", 168.5 m bow tip to stern on the ring, 22.4 m beam), bow to the north-east, landlocked in the
// plaza with the water basin (w261597655) on its south-east side. Ex-Ancerville (Chantiers de l'Atlantique, Saint-Nazaire, 1962),
// 168 m x 22 m, white hull since 1980, at Shekou since 1983, 9 decks, now a hotel with bars and restaurants (Wikipedia; maigoo).
// Built with two large funnels (techno-science / Wikipedia fr), here side by side abaft midships; in the Burns Philp refit she lost her
// lifeboats and davits and her portholes became four rows of large windows on each side (cruiseshipodyssey); earthed up to the
// waterline at Shekou. Deck heights, the superstructure tiers and the masts are estimates; the funnels' present colours are not
// verified, so they are white with dark caps. No name or text on the hull.
const SWS = {
  hull:{c:'#f3f3ef', m:0, lc:'#fff2dc', lk:0.8, e:0.55}, boot:'#7d2b25', deck:'#b9a688', supT:'#e6e5df', sup:{c:'#f6f6f2', m:0, lc:'#fff2dc', lk:0.75, e:0.6},
  win:{c:'#3d4a55', glow:'#ffcf8a', gk:1.25}, port:{c:'#2f3a44', glow:'#ffd9a0', gk:1.0}, rail:{c:'#e8e8e2', ds:true}, fun:{c:'#f1f0ea', m:0, lc:'#fff1d8', lk:0.55, e:0.7},
  cap:'#2b2d30', mast:'#d9d9d3', boat:'#e46c1f', red:{c:'#b01810', glow:'#ff2a14', gk:2.0}, lamp:{c:'#fff4dc', glow:'#ffe2b0', gk:1.6},
  jet:{c:'#eef6ff', op:0.55, glow:'#9fd4ff', gk:0.9, ds:true}, tr:'#6f5a43', cr:'#4f7d3e', palm:'#5f8a3c', pave:'#d8d2c4'
};
function buildMinghua(g, B, gy){
  const R = D.szseaworld.ship;
  // axis: stern centre -> bow tip
  const bow = R.reduce((a, p) => p[0] - p[1] > a[0] - a[1] ? p : a), st = [-22.4, 54.0];
  let ux = bow[0] - st[0], uz = bow[1] - st[1]; const Ls = Math.hypot(ux, uz); ux /= Ls; uz /= Ls; const vx = -uz, vz = ux;
  const S = p => (p[0] - st[0])*ux + (p[1] - st[1])*uz;                // 0 at the stern .. 168 at the bow
  const Pw = (s, t) => [st[0] + ux*s + vx*t, st[1] + uz*s + vz*t];
  let ymin = Infinity; for (const p of R) ymin = Math.min(ymin, gy(p[0], p[1]));
  const y0 = Math.min(ymin, 0) - 0.4;                                      // keel line just under the plaza / basin floor
  const DK = 10.6, deck = (x, z) => { const s = S([x, z])/Ls; return y0 + DK + 1.6*Math.pow(clamp((s - 0.55)/0.45, 0, 1), 2) + 0.5*Math.pow(clamp((0.2 - s)/0.2, 0, 1), 2); };
  // hull: walls on the real outline, boot-topping band at the bottom
  prism(B, SWS.boot, R, y0, y0 + 1.6, {noTop:true});
  prism(B, SWS.hull, R, y0 + 1.6, deck, {top:SWS.deck});
  // bulwark at the bow and a rail round the deck edge
  const Rin = grow(R, -0.25);
  for (let i = 0; i < Rin.length; i++){ const a = Rin[i], b = Rin[(i + 1) % Rin.length], sa = S(a)/Ls, bw = sa > 0.82 ? 1.3 : 1.0;
    B.q(sa > 0.82 ? SWS.hull : SWS.rail, [a[0], deck(a[0], a[1]), a[1]], [b[0], deck(b[0], b[1]), b[1]], [b[0], deck(b[0], b[1]) + bw, b[1]], [a[0], deck(a[0], a[1]) + bw, a[1]]); }
  // the hull sides: four rows of large windows (the portholes were replaced by large windows in the Burns Philp refit)
  for (let i = 0; i < R.length; i++){ const a = R[i], b = R[(i + 1) % R.length], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); if (l < 8) continue;
    const ex = dx/l, ez = dz/l, nx = ez, nz = -ex, sgn = (nx*(a[0] - st[0] - ux*S(a)) + nz*(a[1] - st[1] - uz*S(a))) > 0 ? 0.08 : -0.08;
    for (let d = 2.0; d < l - 2.5; d += 3.0){ const x = a[0] + ex*d + nx*sgn, z = a[1] + ez*d + nz*sgn, sp = S([x, z])/Ls; if (sp < 0.07 || sp > 0.88) continue;
      for (const yy of [y0 + 2.4, y0 + 4.5, y0 + 6.6, y0 + 8.7]){ const h = 1.1; B.q(SWS.port, [x - ex*1.0, yy, z - ez*1.0], [x + ex*1.0, yy, z + ez*1.0], [x + ex*1.0, yy + h, z + ez*1.0], [x - ex*1.0, yy + h, z - ez*1.0]); } } }
  // superstructure tiers (s from the stern, inset from the hull side, height): promenade, boat deck, upper deck, bridge
  const yd = y0 + DK + 0.4, tiers = [[18, 144, 1.4, 3.1], [26, 136, 2.4, 3.0], [44, 130, 3.6, 2.9], [70, 127, 4.6, 2.8], [110, 126, 5.2, 2.7]];
  let yb = yd; const tierP = [];
  for (const [s0, s1, ins, h] of tiers){
    let P = clipSlab(grow(R, -ins), ux, uz, S(st) + s0 + st[0]*ux + st[1]*uz, s1 + st[0]*ux + st[1]*uz);
    if (P.length < 3) continue;
    prism(B, SWS.sup, P, yb, yb + h, {top:SWS.supT}); tierP.push({P, yb, h});
    // window band (just proud of the wall)
    const W = grow(P, 0.06);
    for (let i = 0; i < W.length; i++){ const a = W[i], b = W[(i + 1) % W.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 1.5) continue;
      B.q(SWS.win, [a[0], yb + 0.9, a[1]], [b[0], yb + 0.9, b[1]], [b[0], yb + 2.0, b[1]], [a[0], yb + 2.0, a[1]]); }
    yb += h;
  }
  // the bridge wings and the wheelhouse front windows (deeper band)
  { const s = 125.5, [cx, cz] = Pw(s, 0); obox(B, SWS.sup, cx, cz, vx, vz, 22.4, 2.2, yd + 8.5, yd + 9.3); }
  // funnels: two, side by side abaft midships (Ancerville's "deux grandes cheminées"); colours today not verified: white, dark caps
  for (const tf of [-4.2, 4.2]){ const s0 = 66, top = yb + 7.5, base = yd + 8.4, sec = (y) => { const k = (y - base)/(top - base); return {c:Pw(s0 - k*2.0, tf), a:4.6 - 0.6*k, b:2.2 - 0.3*k}; };
    const n = 12, lev = [base, base + (top - base)*0.55, top - 1.3, top];
    for (let li = 0; li < lev.length - 1; li++){ const A = sec(lev[li]), C = sec(lev[li + 1]), sp = li === lev.length - 2 ? SWS.cap : SWS.fun;
      for (let i = 0; i < n; i++){ const a0 = i/n*TAU, a1 = (i + 1)/n*TAU, P = (Q, a, y) => [Q.c[0] + ux*Math.cos(a)*Q.a + vx*Math.sin(a)*Q.b, y, Q.c[1] + uz*Math.cos(a)*Q.a + vz*Math.sin(a)*Q.b];
        B.q(sp, P(A, a0, lev[li]), P(A, a1, lev[li]), P(C, a1, lev[li + 1]), P(C, a0, lev[li + 1])); } }
    const T = sec(top); cap(B, SWS.cap, Array.from({length:n}, (_, i) => { const a = i/n*TAU; return [T.c[0] + ux*Math.cos(a)*T.a + vx*Math.sin(a)*T.b, T.c[1] + uz*Math.cos(a)*T.a + vz*Math.sin(a)*T.b]; }), top); }
  // masts: on the bridge top and on the after deck; a jack staff at the bow
  { const [mx, mz] = Pw(118, 0); beam(B, SWS.mast, [mx, yb, mz], [mx - ux*1.2, yb + 11, mz - uz*1.2], 0.25); beam(B, SWS.mast, [mx - ux*0.6 - vx*3, yb + 7, mz - uz*0.6 - vz*3], [mx - ux*0.6 + vx*3, yb + 7, mz - uz*0.6 + vz*3], 0.12);
    lampBox(B, SWS.red, mx - ux*1.2 - 0.3, yb + 11, mz - uz*1.2 - 0.3, 0.6);
    const [ax, az] = Pw(28, 0); beam(B, SWS.mast, [ax, yd + 2.9, az], [ax, yd + 9.5, az], 0.2);
    const [bx, bz] = Pw(166, 0); beam(B, SWS.mast, [bx, deck(bx, bz) + 1, bz], [bx, deck(bx, bz) + 6, bz], 0.08); }
  // mooring bollards / winch houses on the fore deck
  { const [fx, fz] = Pw(150, 0); obox(B, SWS.sup, fx, fz, ux, uz, 4, 6, deck(fx, fz), deck(fx, fz) + 1.6); }
  // lights along the deck edges (strings of bulbs at night)
  for (const T of tierP){ const P = T.P; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let d = 1; d < l; d += 4) lampBox(B, SWS.lamp, a[0] + (b[0] - a[0])*d/l, T.yb + T.h - 0.15, a[1] + (b[1] - a[1])*d/l, 0.22); } }
  return {ux, uz, st, top:yb + 7.5};
}
Object.assign(SITES, {szseaworld:{zh:'海上世界（明华轮）', en:'Sea World (the Minghua ship)', lat:D.szseaworld.lat, lon:D.szseaworld.lon, r:246, keep:D.szseaworld.keep, h:37,
  lt:{m:0, c:'#ffe9c8', k:0.5, e:0.6},
  build(ctx){
    const g = new THREE.Group(), B = Batch(), T = D.szseaworld, gy = ctx.gy;
    // plaza paving round the ship, then the basin (the app may draw the basin as water too)
    ctx.paint(grow(T.ship, 16), [214, 208, 196]);
    ctx.paint(T.basin, [143, 181, 202]);
    const S = buildMinghua(g, B, gy);
    // fountain jets in the basin (OSM fountain nodes)
    T.foun.forEach((f, i) => { const y = gy(f[0], f[1]); LCone(g, 1.2, 3 + 2*(i % 2), f[0], y, f[1], SWS.jet, 8); LCyl(g, 0.25, 0.5, 6 + 1.5*(i % 3), f[0], y, f[1], SWS.jet, 6); });
    // palms and lamps along the plaza edge on the ship's north-west (land) side
    const E = grow(T.ship, 9);
    for (let i = 0; i < E.length; i++){ const a = E[i], b = E[(i + 1) % E.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      for (let d = 0; d < l; d += 13){ const x = a[0] + (b[0] - a[0])*d/l, z = a[1] + (b[1] - a[1])*d/l; if (pip(T.basin, x, z) || pip(grow(T.basin, 4), x, z)) continue;
        const k = Math.floor(d/13 + i) % 2; if (k) ctx.tree(x, z, 2.6, 'palm'); else { const y = gy(x, z); B.q(SWS.mast, [x - 0.08, y, z], [x + 0.08, y, z], [x + 0.08, y + 4.5, z], [x - 0.08, y + 4.5, z]); lampBox(B, SWS.lamp, x, y + 4.5, z, 0.4); ctx.lamp(x, y + 4.6, z, [255, 226, 176]); } } }
    B.flush(g); return g; }}});
