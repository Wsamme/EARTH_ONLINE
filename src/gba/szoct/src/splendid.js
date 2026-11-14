// ---------- Splendid China Folk Village 锦绣中华民俗村 (30 ha miniature park, mostly 1:15; the China Folk Culture Village) ----------
// The park outline (w236402467) and its OSM halls, ponds and woods. Only miniatures and village houses with an OSM point are built,
// at those points: a short section of the Great Wall (长城模型), the Mogao Caves (敦煌莫高窟模型), the folk-village houses (白族民居,
// 哈尼寨, 独龙族, 水寨, 白塔, 石林奇欢, 千手观音, 猴园) and the Horse Battle Arena outline. Miniatures OSM does not locate are left out.
function cnHall(B, S, F, w, d, h, wallC, roofC, levels){
  fbox(B, F, S.flood, RGB('#d9d2c2'), 0, 0, w + 1.6, d + 1.6, -0.6, 1.0);
  let y = 0.4; for (let i = 0; i < (levels || 1); i++){ const s = 1 - i*0.22; fbox(B, F, S.flood, RGB(wallC), 0, 0, w*s, d*s, y, h); fcnroof(B, F, S.plain, RGB(roofC), 0, 0, w*s, d*s, y + h, Math.min(w, d)*s*0.42, Math.min(w, d)*0.12); y += h + Math.min(w, d)*s*0.3; }
}
function pagoda(B, S, F, r, n, hs, wallC, roofC){ let y = 0; fcyl(B, F, S.flood, RGB('#cfc7b5'), 0, 0, r*1.4, -0.5, 0.9, 8);
  for (let i = 0; i < n; i++){ const s = 1 - i*0.07; fcyl(B, F, S.flood, RGB(wallC), 0, 0, r*s, y + 0.4, hs, 8); flathe(B, F, S.plain, RGB(roofC), 0, 0, y + 0.4 + hs, [[r*s*1.5, 0], [r*s*0.7, hs*0.35], [0, hs*0.4]], 8, 1, 1, PI/8); y += hs*1.05; }
  fcyl(B, F, S.gold, RGB('#c9a657'), 0, 0, 0.12, y + 0.4, hs*1.2, 6, 0.03); }
Object.assign(SITES, {szsplendid:{zh:'锦绣中华民俗村', en:'Splendid China Folk Village', lat:22.533737, lon:113.983901, r:770, keep:D.szsplendid.keep, keepRoads:[11, 12], h:30,
  lt:{m:0, c:'#ffd6a0', k:0.7, e:0.5}, build(ctx){
  const g = new THREE.Group(), B = VB(), S = mkSpecs(), gy = ctx.gy, rng = ctx.rng, d = D.szsplendid, busy = [];
  const onWater = (x, z) => d.w.some(P => pip(P, x, z));
  // the OSM halls: Chinese halls with grey tile roofs in the folk village, plainer roofs for the theatre and the service blocks
  for (const b of d.b){ const big = b.a > 1500;
    genBld(B, S, gy, rng, b, big ? {spec:'flood', wall:['#e9e2d3', '#e2d6c0'], roof:['#5d6662', '#6d6a63'], kind:'flat', hmax:16} : {spec:'flood', wall:['#efe9dd', '#e6dccb', '#b8574a', '#d9cbb0'], roof:['#4f5652', '#5d6662', '#6a5146'], kind:'cn', hmax:9});
    busy.push([...pcent(b.r), Math.sqrt(b.a)*0.7]); }
  // the Great Wall miniature at its OSM point (长城模型): only a short section with two watchtowers is modelled round the point,
  // because its real alignment over the rise is not mapped
  const GW = poiAt(d, /长城/)[0];
  if (GW){ const C = RGB('#a59c8a'), Cd = RGB('#8b8273'), ang = faceTo(d.p, GW[1], GW[2]) + HP, pts = [];
    for (let i = 0; i <= 8; i++){ const u = -28 + i*7; pts.push([GW[1] + Math.cos(ang)*u, GW[2] + Math.sin(ang)*u]); }
    for (let i = 1; i < pts.length; i++){ const a = pts[i-1], b = pts[i], ya = gy(a[0], a[1]), yb = gy(b[0], b[1]), L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const F = Fr((a[0] + b[0])/2, (a[1] + b[1])/2, ang, Math.min(ya, yb) - 0.6); fbox(B, F, S.flood, C, 0, 0, L + 0.3, 0.6, 0, 1.2 + Math.abs(ya - yb));
      for (let k = 0; k < 3; k++) for (const sv of [-0.26, 0.26]) fbox(B, F, S.flood, Cd, -L/2 + L*(k + 0.5)/3, sv, 0.3, 0.1, 1.2 + Math.abs(ya - yb), 0.25);
      if (i === 1 || i === pts.length - 1){ fbox(B, F, S.flood, Cd, i === 1 ? -L/2 : L/2, 0, 1.4, 1.4, 0, 2.6 + Math.abs(ya - yb)); ctx.lamp(b[0], yb + 3, b[1], [255, 205, 140]); } }
    busy.push([GW[1], GW[2], 32]); }
  // the Mogao Caves miniature at its OSM point (敦煌莫高窟模型): a cliff face with cave openings and the red nine-storey pavilion
  const MG = poiAt(d, /莫高窟/)[0];
  if (MG){ const y = gy(MG[1], MG[2]), F = Fr(MG[1], MG[2], faceTo(d.p, MG[1], MG[2]), y), R = RGB('#b99a6e');
    fbox(B, F, S.flood, R, 0, -2, 26, 5, -0.6, 5.2); for (let i = 0; i < 9; i++) for (let k = 0; k < 2; k++) fbox(B, F, S.dark, RGB('#4a3a2a'), -11 + i*2.6, 0.52, 0.9, 0.1, 1.0 + k*2.0, 1.1);
    for (let i = 0; i < 5; i++){ const w = 4.2 - i*0.45; fbox(B, F, S.flood, RGB('#a8473a'), 0, 1.4, w, 2.4, i*1.25, 1.0); fcnroof(B, F, S.plain, RGB('#4f5652'), 0, 1.4, w, 2.4, i*1.25 + 1.0, 0.5, 0.35); }
    busy.push([MG[1], MG[2], 16]); }
  // Horse Battle Arena on its OSM outline: the ring and low stands
  if (d.arena){ ctx.paint(d.arena, [196, 172, 132]); const [lo, hi] = groundSpan(gy, d.arena); prism(B, S.flood, RGB('#cbbfa6'), inset(d.arena, -0.5), lo - 1, hi + 1.2, null);
    prism(B, S.plain, RGB('#bdb4a0'), inset(d.arena, -4.5), lo - 1, hi + 3.2, null); busy.push([...pcent(d.arena), 30]); }
  // the folk village at its OSM points
  const FV = [[/白族/, (F) => { for (let i = 0; i < 4; i++){ const u = (i % 2)*9 - 4.5, v = Math.floor(i/2)*9 - 4.5; fbox(B, F, S.wall, RGB('#f2f0ea'), u, v, 7, 5, 0, 5.2); fgable(B, F, S.plain, RGB('#4f5652'), u, v, 7, 5, 5.2, 2.0, 0.5); } }],
    [/哈尼/, (F) => { for (let i = 0; i < 6; i++){ const a = i/6*TAU, u = Math.cos(a)*11, v = Math.sin(a)*11; fbox(B, F, S.flood, RGB('#b38a62'), u, v, 4.5, 4.5, 0, 3.2); fpyr(B, F, S.plain, RGB('#8a7a52'), u, v, 6.4, 6.4, 3.2, 3.6, 0); } }],
    [/独龙/, (F) => { for (let i = 0; i < 4; i++){ const u = i*7 - 10; for (const s of [-1, 1]) for (const s2 of [-1, 1]) fcyl(B, F, S.plain, RGB('#7a5a3c'), u + s*2, s2*1.8, 0.15, 0, 2.2, 5); fbox(B, F, S.flood, RGB('#a88a5c'), u, 0, 5, 4.4, 2.2, 2.4); fgable(B, F, S.plain, RGB('#8f7f58'), u, 0, 6, 5, 4.6, 3.0, 0.4); } }],
    [/水寨/, (F) => { for (let i = 0; i < 5; i++){ const u = i*8 - 16; fbox(B, F, S.plain, RGB('#6b4a34'), u, 0, 6, 5, -1, 3.2); fbox(B, F, S.wall, RGB('#a8784c'), u, 0, 5.4, 4.4, 2.2, 2.6); fcnroof(B, F, S.plain, RGB('#4f5652'), u, 0, 5.4, 4.4, 4.8, 2.2, 0.8); } }],
    [/白塔/, (F) => { fbox(B, F, S.flood, RGB('#efece4'), 0, 0, 9, 9, -0.5, 3.2); flathe(B, F, S.flood, RGB('#f4f2ec'), 0, 0, 2.7, [[3.4, 0], [3.6, 1.0], [3.2, 3.6], [2.2, 5.4], [0.9, 6.0], [0.9, 6.8], [0.7, 7.2]], 14);
      fcyl(B, F, S.flood, RGB('#f4f2ec'), 0, 0, 0.8, 9.9, 4.6, 10, 0.35); fcyl(B, F, S.gold, RGB('#c9a657'), 0, 0, 1.4, 14.5, 0.4, 10, 1.1); }],
    [/石林/, (F, rng) => { for (let i = 0; i < 26; i++){ const u = (rng() - 0.5)*30, v = (rng() - 0.5)*24, h = 3 + rng()*7; flathe(B, F, S.flood, RGB('#8f8c86'), u, v, -0.5, [[1.6 + rng(), 0], [1.2, h*0.5], [0.7, h*0.9], [0.2, h]], 5); } }],
    [/千手观音/, (F) => { fbox(B, F, S.flood, RGB('#d9d2c2'), 0, 0, 8, 8, -0.4, 1.6); flathe(B, F, S.gold, RGB('#c9a657'), 0, 0, 1.2, [[1.6, 0], [1.3, 2.0], [2.0, 3.2], [1.1, 4.2], [0.6, 5.4], [0, 6.0]], 10); }]];
  for (const [name, x, z] of d.poi) for (const [re, fn] of FV){ if (!re.test(name)) continue; const y = gy(x, z), F = Fr(x, z, faceTo(d.p, x, z), y - 0.2); fn(F, rng); busy.push([x, z, 22]); ctx.lamp(x, y + 3, z, [255, 190, 120]); break; }
  // landscape
  const avoid = (x, z) => onWater(x, z) || busy.some(q => Math.hypot(q[0] - x, q[1] - z) < q[2]);
  scatter(ctx, d.wood, 50, 2200, ['d', 'd', 'raintree', 'palm', 'pine'], 2.2, 4.4, avoid);
  lampsAlong(ctx, d.p, 26, 3.6, [255, 196, 130], 700, avoid);
  B.flush(g); return g; }}});
