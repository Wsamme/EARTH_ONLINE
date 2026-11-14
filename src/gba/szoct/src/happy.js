// ---------- Happy Valley Shenzhen 深圳欢乐谷 (opened 1 Oct 1998, 35 ha) ----------
// Rides as structures only (no brand imagery, no mascots, no signage), all placed from OSM: the S&S air-launched coaster 雪域雄鹰 on
// its OSM track ways (60.0 m high, 134 km/h; standing since Oct 2023; the height profile along the track is estimated, only the 60 m
// top is verified), the coaster 密林历险 on its OSM track ways (layers read as heights), the launch tower 太空梭 at its OSM
// drop_tower node ("shoots to 60 m"), the Super Loop ring at 环翼飞车, the water-park outline; the halls on their OSM footprints.
function trackOf(B, S, pts, gy, kRail, kSup, sup){
  // pts: [[x, y, z], ...] absolute; two rails, a spine, ties, and columns to the ground
  let acc = 0;
  for (let i = 1; i < pts.length; i++){ const a = pts[i-1], b = pts[i], dx = b[0] - a[0], dz = b[2] - a[2], L = Math.hypot(dx, dz) || 1e-3, nx = -dz/L*0.6, nz = dx/L*0.6;
    bar(B, S.steel, kRail, [a[0] + nx, a[1], a[2] + nz], [b[0] + nx, b[1], b[2] + nz], 0.22); bar(B, S.steel, kRail, [a[0] - nx, a[1], a[2] - nz], [b[0] - nx, b[1], b[2] - nz], 0.22);
    bar(B, S.steel, kRail, [a[0], a[1] - 0.7, a[2]], [b[0], b[1] - 0.7, b[2]], 0.45);
    acc += Math.hypot(dx, b[1] - a[1], dz);
    if (acc > (sup || 7)){ acc = 0; const g0 = gy(b[0], b[2]); if (b[1] - g0 > 2.5){ bar(B, S.steel, kSup, [b[0], g0 - 0.5, b[2]], [b[0], b[1] - 0.8, b[2]], b[1] - g0 > 25 ? 1.1 : 0.6);
      if (b[1] - g0 > 18){ bar(B, S.steel, kSup, [b[0] + nx*8, g0 - 0.5, b[2] + nz*8], [b[0], b[1]*0.55 + g0*0.45, b[2]], 0.45); bar(B, S.steel, kSup, [b[0] - nx*8, g0 - 0.5, b[2] - nz*8], [b[0], b[1]*0.55 + g0*0.45, b[2]], 0.45); } } } }
}
Object.assign(SITES, {szhappyvalley:{zh:'欢乐谷', en:'Happy Valley Shenzhen', lat:22.544591, lon:113.975607, r:482, keep:D.szhappyvalley.keep, keepRoads:[11, 12], h:66,
  lt:{m:0, c:'#ffd9a6', k:0.7, e:0.6}, build(ctx){
  const g = new THREE.Group(), B = VB(), S = mkSpecs(), gy = ctx.gy, rng = ctx.rng, d = D.szhappyvalley, busy = [];
  const kR = RGB('#d4d8dc'), kS = RGB('#eceeef'), kO = RGB('#c9783a');
  for (const b of d.b){ genBld(B, S, gy, rng, b, {spec:'flood', wall:['#e7c9a0', '#d9b48a', '#c6d3c9', '#e8dccb', '#d6c3a5', '#bfcbd2'], roof:['#9a6a52', '#6f7f6a', '#8b7d70', '#7d8a91'], kind:'auto', hmax:16}); busy.push([...pcent(b.r), Math.sqrt(b.a)*0.7]); }
  const P = name => poiAt(d, name)[0];
  // a track from OSM roller_coaster=track ways (plan exact) with a height profile hf(s, total) along it
  const runTrack = (ways, hf, kr, ks, step) => { const pl = []; for (const w of ways) for (const p of w.pts){ const q = pl[pl.length - 1]; if (!q || Math.hypot(q[0] - p[0], q[1] - p[1]) > 0.3) pl.push(p); }
    const tot = plen(pl), pts = []; for (let t = 0; t <= tot; t += step){ const p = along(pl, t); pts.push([p[0], gy(p[0], p[1]) + hf(t, tot), p[1]]); } trackOf(B, S, pts, gy, kr, ks, 6); return {pl, tot, pts}; };
  // the launched coaster (雪域雄鹰): station side, launch straight, the 60 m top hat on the next straight, the helix, the return
  if (d.bullet){ const L = d.bullet.map(w => plen(w.pts)), c = [0]; for (const l of L) c.push(c[c.length - 1] + l);
    const sm = (a, b, x) => { const t = clamp((x - a)/(b - a), 0, 1); return t*t*(3 - 2*t); };
    const s0 = c[2] + L[2] - 50, top = 60 - 2.5;     // the 50 m straight of way 1426564271
    const hf = s => s < c[1] ? 6 - 3*sm(c[1] - 20, c[1], s)
      : s < c[2] ? 3 : s < s0 ? 3 + 2*sm(c[2], s0, s) : s < s0 + 18 ? lerp(5, top, sm(s0 - 4, s0 + 14, s)) : s < c[3] ? lerp(top, -2, sm(s0 + 18, c[3], s))
      : s < c[4] ? -2 + 18*Math.sin(PI*sm(c[3], c[4], s)) + 10*sm(c[3], c[4], s) : lerp(8, 6, sm(c[4], c[5], s));
    const T = runTrack(d.bullet, hf, kR, kS, 2.5);
    let pk = T.pts[0]; for (const p of T.pts) if (p[1] > pk[1]) pk = p; fbox(B, Fr(pk[0], pk[2], 0, 0), S.red, [1, 1, 1], 0, 0, 0.8, 0.8, pk[1] + 0.5, 0.8);
    for (let i = 0; i < T.pts.length; i += 6) ctx.lamp(T.pts[i][0], T.pts[i][1] + 1.2, T.pts[i][2], [235, 240, 255]);
    for (const p of T.pts) busy.push([p[0], p[2], 6]); }
  // 密林历险: the second coaster on its OSM track (layers 1-3 read as low, mid and high runs)
  if (d.milin){ const L = d.milin.map(w => plen(w.pts)), c = [0]; for (const l of L) c.push(c[c.length - 1] + l);
    const lay = s => { for (let i = 0; i < L.length; i++) if (s <= c[i + 1]) return d.milin[i].layer; return 0; };
    let prev = 3; const T = runTrack(d.milin, s => { const want = 3 + lay(s)*5; prev = lerp(prev, want, 0.12); return prev; }, RGB('#b0743c'), RGB('#7a6450'), 2.0);
    for (const p of T.pts) busy.push([p[0], p[2], 5]); }
  // the launch tower 太空梭 at its OSM node (attraction=drop_tower): shoots to 60 m
  if (d.drop){ const [x, z] = d.drop, y = gy(x, z), F = Fr(x, z, 0, y);
    fbox(B, F, S.flood, RGB('#d9d2c2'), 0, 0, 14, 14, -1, 1.6); fbox(B, F, S.steel, kS, 0, 0, 2.6, 2.6, 0, 64); fbox(B, F, S.steel, RGB('#9aa4ab'), 0, 0, 4.2, 4.2, 64, 2.4);
    for (const s of [-1, 1]) for (const t of [-1, 1]) bar(B, S.steel, kS, F(s*6, 0, t*6), F(s*1.3, 18, t*1.3), 0.5);
    fbox(B, F, S.steel, kO, 0, 0, 5.4, 5.4, 3, 1.6); for (let yy = 4; yy < 64; yy += 4) fbox(B, F, S.glow, [1, 1, 1], 0, 0, 2.7, 2.7, yy, 0.25);
    fbox(B, F, S.red, [1, 1, 1], 0, 0, 0.7, 0.7, 66.4, 0.7); busy.push([x, z, 14]); }
  // the super loop (环翼飞车, a Super Loop ride) at its OSM node
  const SL = P(/环翼飞车/);
  if (SL){ const y = gy(SL[1], SL[2]), F = Fr(SL[1], SL[2], faceTo(d.p, SL[1], SL[2]), y), R = 10.5; let prev = null;
    for (let i = 0; i <= 36; i++){ const a = i/36*TAU, p = F(Math.sin(a)*R, 12 + Math.cos(a)*R, 0); if (prev) bar(B, S.steel, kO, prev, p, 0.7); prev = p; }
    for (const s of [-1, 1]) for (const t of [-1, 1]) bar(B, S.steel, kS, F(s*5, 0, t*4), F(0, 12, t*0.5), 0.6);
    fbox(B, F, S.flood, RGB('#d9d2c2'), 0, 0, 18, 12, -1, 1.4); busy.push([SL[1], SL[2], 14]); }
  // the water park (玛雅水公园) outline as pool deck
  if (d.wpark){ ctx.paint(d.wpark, [206, 214, 206]); busy.push([...pcent(d.wpark), 90]); }
  const avoid = (x, z) => d.w.some(P2 => pip(P2, x, z)) || busy.some(q => Math.hypot(q[0] - x, q[1] - z) < q[2]);
  scatter(ctx, d.wood, 45, 1200, ['d', 'raintree', 'palm', 'd'], 2.2, 4.2, avoid);
  lampsAlong(ctx, d.p, 18, 4.0, [255, 214, 160], 600, avoid);
  B.flush(g); return g; }}});
