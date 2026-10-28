// ---------- OCT-LOFT 华侨城创意文化园 (1980s OCT factory blocks, converted from 2004; opened 2005) ----------
// The Loft blocks on their OSM footprints as 4-6 storey concrete-frame factories (OSM gives several of them 69-106 m, which is not
// real: they are rebuilt at factory heights), raw concrete grids, red brick and dark painted infill, climbing vines, roof plant and
// the banyans along the lanes.
Object.assign(SITES, {szoctloft:{zh:'华侨城创意文化园', en:'OCT-LOFT Creative Culture Park', lat:22.541787, lon:113.988277, r:359, keep:D.szoctloft.keep, keepRoads:[11, 12], h:30,
  lt:{m:1, c:'#ffdcb0', k:0.6, e:0.5}, build(ctx){
  const g = new THREE.Group(), B = VB(), S = mkSpecs(), gy = ctx.gy, rng = ctx.rng, d = D.szoctloft, busy = [];
  const SPEC = {c:'#ffffff', vc:true, m:1, fh:4.5, cw:3.2};
  for (const b of d.b){ const fl = b.a > 3000 ? 5 : b.a > 1200 ? 4 : 3, h = (b.h && b.h <= 26) ? b.h : fl*4.6 + 1;
    const brick = rng() < 0.35, wall = brick ? PICK(rng, ['#9c5a44', '#a8644a', '#8f4f3c']) : PICK(rng, ['#b9b7b0', '#a9a7a0', '#c8c5bc', '#5d6063']);
    const [lo, hi] = groundSpan(gy, b.r), top = hi + h, P = b.r, kw = RGB(wall);
    prism(B, SPEC, kw, P, lo - 1.5, top, RGB('#8d8f8c'), S.plain);
    prism(B, S.plain, RGB('#c9c7c0'), inset(P, -0.15), top, top + 0.8, null);
    // concrete frame: pilasters every ~6 m and floor-slab edges on the long faces
    const kc = RGB('#d2d0c8');
    for (let i = 0; i < P.length; i++){ const a = P[i], q = P[(i + 1) % P.length], L = Math.hypot(q[0] - a[0], q[1] - a[1]); if (L < 10) continue; const ang = Math.atan2(q[1] - a[1], q[0] - a[0]), n = Math.round(L/6);
      for (let j = 0; j <= n; j++){ const t = j/n, F = Fr(lerp(a[0], q[0], t), lerp(a[1], q[1], t), ang, lo); fbox(B, F, S.flood, kc, 0, -0.25, 0.6, 0.5, hi - lo, top - hi + 0.8); }
      const F = Fr((a[0] + q[0])/2, (a[1] + q[1])/2, ang, hi); for (let k = 1; k < Math.round(h/4.6); k++) fbox(B, F, S.flood, kc, 0, -0.2, L, 0.4, k*4.6 - 0.3, 0.45);
      if (rng() < 0.3){ const t0 = rng()*0.6, F2 = Fr(lerp(a[0], q[0], t0 + 0.15), lerp(a[1], q[1], t0 + 0.15), ang, hi); fbox(B, F2, S.plain, RGB(PICK(rng, ['#4f6f3a', '#5d7d44', '#3f5f32'])), 0, -0.35, Math.min(L*0.3, 12), 0.25, 0, h*(0.4 + rng()*0.5)); } }
    if (b.a > 900) fbox(B, Fr(...[obb(P).cx, obb(P).cz], obb(P).ang, top), S.steel, RGB('#9da3a6'), 0, 0, Math.min(obb(P).L*0.25, 12), Math.min(obb(P).W*0.3, 8), 0.8, 2.6);
    busy.push([...pcent(P), Math.sqrt(b.a)*0.7]); }
  // banyans along the lanes, lamps
  const avoid = (x, z) => busy.some(q => Math.hypot(q[0] - x, q[1] - z) < q[2]);
  for (const L of d.p){ const len = plen(L); for (let t = 6; t < len; t += 13){ const p = along(L, t), s = (Math.floor(t/13) % 2 ? 1 : -1)*5.5, x = p[0] - Math.sin(p[2])*s, z = p[1] + Math.cos(p[2])*s; if (!avoid(x, z) && pip(d.keep, x, z)) ctx.tree(x, z, 3.4 + rng()*1.8, 'raintree'); } }
  scatter(ctx, d.grass, 60, 150, ['d', 'raintree'], 2.6, 4.2, avoid);
  lampsAlong(ctx, d.p, 18, 4.0, [255, 200, 140], 300, avoid);
  B.flush(g); return g; }}});
