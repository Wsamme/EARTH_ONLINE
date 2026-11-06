
// =====================================================================================================
// SITES: the Mandai parks (Singapore Zoo, River Wonders, Night Safari, Bird Paradise) and Sungei Buloh Wetland Reserve.
// Keep outlines = the real OSM land-use polygons (zoo / nature_reserve). Every real footprint inside is rebuilt as a park
// pavilion on ctx.gy (OSM ids in SGD40.*.bld); the real service roads and footpaths stay (keepRoads) and are paved under;
// forest is planted off the buildings, paths and water (water mask from the app's 10 m fresh-water / sea rasters).
// No animals, characters, logos or text.
// =====================================================================================================
{
const pip = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0])*(z - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; };
const ringOf = f => { const R = []; for (let i = 0; i < f.length; i += 2) R.push([f[i], f[i + 1]]); return R; };
function waterMask(W){ const a = new Uint8Array(W.nx*W.nz); let k = 0, v = 0; for (const n of W.rle){ if (v) a.fill(1, k, k + n); k += n; v ^= 1; } return (x, z) => { const i = Math.floor((x - W.x0)/W.c), j = Math.floor((z - W.z0)/W.c); return i >= 0 && j >= 0 && i < W.nx && j < W.nz && a[j*W.nx + i] === 1; }; }
// segment grid for distance-to-path queries
function segGrid(paths, cs){
  const G = new Map(), key = (i, j) => i*100003 + j;
  for (const p of paths){ for (let k = 2; k + 3 < p.length; k += 2){ const a = [p[k], p[k + 1]], b = [p[k + 2], p[k + 3]], w = p[0] === 11 ? 3.0 : p[0] === 10 ? 4.0 : 1.6;
    const i0 = Math.floor(Math.min(a[0], b[0])/cs) - 1, i1 = Math.floor(Math.max(a[0], b[0])/cs) + 1, j0 = Math.floor(Math.min(a[1], b[1])/cs) - 1, j1 = Math.floor(Math.max(a[1], b[1])/cs) + 1;
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++){ const q = key(i, j); if (!G.has(q)) G.set(q, []); G.get(q).push([a, b, w]); } } }
  return (x, z) => { const L = G.get(key(Math.floor(x/cs), Math.floor(z/cs))); if (!L) return 1e9; let d = 1e9;
    for (const [a, b, w] of L){ const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx*dx + dz*dz || 1, t = clamp(((x - a[0])*dx + (z - a[1])*dz)/l2, 0, 1), e = Math.hypot(x - a[0] - dx*t, z - a[1] - dz*t) - w; if (e < d) d = e; } return d; };
}
// one park pavilion on a real footprint
function pavilion(g, B, ctx, b, ST){
  const [name, type, h, est, , ob, flat] = b, R = ringOf(flat), A = Math.abs(pArea(R));
  let lo = Infinity; for (const p of R) lo = Math.min(lo, ctx.gy(p[0], p[1]));
  const y0 = lo + 0.15;
  const [cx, cz, L, W, ang] = ob, ry = -ang;
  if (type === 'shed' || (A < 60 && h < 5)){
    // open shelter: posts and a hipped roof
    // open shelter / covered exhibit walk: posts along the real outline, a light roof on the outline itself
    const RI = offs(R, -0.4);
    for (let i = 0; i < RI.length; i++){ const a = RI[i], b = RI[(i + 1) % RI.length], Ls = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(Ls/6));
      for (let k = 0; k < n; k++){ const t = k/n; B.box(ST.post, lerp(a[0], b[0], t), y0 - 1, lerp(a[1], b[1], t), 0.3, 4.0, 0.3, 0); } }
    if (A < 160 && R.length <= 6) hipRoof(g, cx, cz, L, W, y0 + 2.9, Math.min(W*0.35, 2.4), ST.roof2, ry, 0.5);
    else { LPoly(g, offs(R, 0.4), y0 + 2.9, 0.3, ST.roof2); B.band(ST.fascia, offs(R, 0.4), y0 + 2.75, 0.5, 0); }
    return 4;
  }
  const wallH = est ? clamp(h*0.55, 3.4, 9) : clamp(h - Math.min(W*0.3, 5), 3, 30);
  LPoly(g, offs(R, -0.25), y0 - 3, wallH + 3, ST.wall);
  B.band(ST.trim, R, y0 + 0.2, 1.0, 0.05);
  B.band(ST.win, R, y0 + 1.4, Math.min(2.0, wallH - 1.8), 0.08);
  if (A < 1600 && L/W < 4.5 && R.length < 40){
    hipRoof(g, cx, cz, L, W, y0 + wallH, Math.min(W*0.42, 7.5), ST.roof, ry, 1.2);
    LBox(g, L + 2.2, 0.35, W + 2.2, cx, y0 + wallH - 0.35, cz, ST.fascia, ry);
  } else {
    LPoly(g, offs(R, 0.8), y0 + wallH, 0.5, ST.roofFlat);
    B.band(ST.fascia, offs(R, 0.8), y0 + wallH - 0.4, 0.9, 0);
    // a raised clerestory / skylight hip on the long axis
    hipRoof(g, cx, cz, L*0.55, W*0.42, y0 + wallH + 0.5, Math.min(W*0.18, 4), ST.roof, ry, 0);
  }
  return 3;
}
function parkSite(ctx, D, ST, extra){
  const g = new THREE.Group(), B = mkB(), r = ctx.rng, K = D.keep, wet = waterMask(D.wm);
  // ground: forest floor, lawns along the paths, paved paths and service roads
  ctx.paint(K, ST.ground);
  for (const p of D.paths){ const pts = ringOf(p.slice(2)); if (p[0] === 10) continue; ctx.line(pts, p[0] === 11 ? 6.5 : p[1] ? 2.2 : 3.4, p[0] === 11 ? ST.road : ST.path); }
  // buildings
  const BL = D.bld.map(b => ({b, R:ringOf(b[6]), c:b[5]}));
  let calls = 0; for (const o of BL) calls += pavilion(g, B, ctx, o.b, ST);
  if (extra) extra(g, B, BL, wet);
  // lamps along the paths (posts + night points)
  let acc = 0;
  for (const p of D.paths){ if (p[1]) continue; const pts = ringOf(p.slice(2)); for (let i = 0; i < pts.length - 1; i++){ const a = pts[i], b = pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    while (acc < L){ const t = acc/L, x = lerp(a[0], b[0], t) + 2.2, z = lerp(a[1], b[1], t) + 1.2, y = ctx.gy(x, z);
      if (!wet(x, z)){ B.box(ST.post, x, y - 0.5, z, 0.14, ST.lampH + 0.5, 0.14, 0); B.box(ST.lampC, x, y + ST.lampH, z, 0.4, 0.3, 0.4, 0); ctx.lamp(x, y + ST.lampH + 0.2, z, ST.lampRGB); }
      acc += ST.lampStep; } acc -= L; } }
  // forest: jittered grid inside the keep, off water, paths and buildings
  const dpath = segGrid(D.paths, 12), bb = [Infinity, Infinity, -Infinity, -Infinity];
  for (const p of K){ bb[0] = Math.min(bb[0], p[0]); bb[1] = Math.min(bb[1], p[1]); bb[2] = Math.max(bb[2], p[0]); bb[3] = Math.max(bb[3], p[1]); }
  const BG = BL.map(o => ({P:offs(o.R, 3.5), x0:Math.min(...o.R.map(q => q[0])) - 5, x1:Math.max(...o.R.map(q => q[0])) + 5, z0:Math.min(...o.R.map(q => q[1])) - 5, z1:Math.max(...o.R.map(q => q[1])) + 5}));
  const avoid = ST.avoid || [];
  let nt = 0;
  for (let x = bb[0] + 3; x < bb[2]; x += ST.treeStep) for (let z = bb[1] + 3; z < bb[3]; z += ST.treeStep){
    const tx = x + (r() - 0.5)*ST.treeStep*0.8, tz = z + (r() - 0.5)*ST.treeStep*0.8;
    if (!pip(K, tx, tz) || wet(tx, tz) || dpath(tx, tz) < 2.5) continue;
    let hit = false; for (const o of BG){ if (tx < o.x0 || tx > o.x1 || tz < o.z0 || tz > o.z1) continue; if (pip(o.P, tx, tz)){ hit = true; break; } } if (hit) continue;
    for (const a of avoid) if (Math.hypot(tx - a[0], tz - a[1]) < a[2]){ hit = true; break; } if (hit) continue;
    const q = r(); ctx.tree(tx, tz, ST.treeS[0] + r()*ST.treeS[1], q < ST.mix[0] ? 'raintree' : q < ST.mix[1] ? 'palm' : 'd'); nt++;
  }
  B.flush(g);
  g.userData.stats = {trees:nt, bld:BL.length};
  return g;
}
const MANDAI = {ground:[86, 112, 70], path:[186, 172, 142], road:[150, 146, 136], wall:'#b9a98b', trim:'#8d7a5f', win:'#3e3a33', roof:'#4f4439', roof2:'#6b5a42', roofFlat:'#6f6a60', fascia:'#5a4632', post:'#5e4a36', lampC:{c:'#f5e6c0', glow:'#ffcf87', gk:1.2}, lampH:3.2, lampStep:28, lampRGB:[255, 200, 130], treeStep:9.5, treeS:[2.4, 2.2], mix:[0.2, 0.3]};

// ---------- Singapore Zoo (1973): open-concept zoo on the Upper Seletar Reservoir peninsula; OSM zoo polygon (231,232 m2) ----------
Object.assign(SITES, {sgzoo:{zh:'新加坡动物园', en:'Singapore Zoo', lat:SGD40.sgzoo.lat, lon:SGD40.sgzoo.lon, r:430, keep:SGD40.sgzoo.keep, keepRoads:[11, 12], h:25,
  lt:{m:0, c:'#ffe0b0', k:0.35, e:0.5},
  build(ctx){ return parkSite(ctx, SGD40.sgzoo, MANDAI); }}});

// ---------- River Wonders (2013): OSM zoo polygon (76,481 m2) between the Zoo and the Night Safari; Giant Panda Forest and Amazon Flooded Forest halls ----------
Object.assign(SITES, {sgriverwonders:{zh:'河川生态园', en:'River Wonders', lat:SGD40.sgriverwonders.lat, lon:SGD40.sgriverwonders.lon, r:285, keep:SGD40.sgriverwonders.keep, keepRoads:[11, 12], h:25,
  lt:{m:0, c:'#ffe0b0', k:0.35, e:0.5},
  build(ctx){ return parkSite(ctx, SGD40.sgriverwonders, MANDAI); }}});

// ---------- Night Safari (1994): the two OSM zoo polygons west of River Wonders (160,956 + 116,975 m2); dim moonlight-style lamps on the trails ----------
Object.assign(SITES, {sgnightsafari:{zh:'夜间野生动物园', en:'Night Safari', lat:SGD40.sgnightsafari.lat, lon:SGD40.sgnightsafari.lon, r:485, keep:SGD40.sgnightsafari.keep, keepRoads:[11, 12], h:25,
  lt:{m:0, c:'#d8e4ff', k:0.25, e:0.5},
  build(ctx){ return parkSite(ctx, SGD40.sgnightsafari, Object.assign({}, MANDAI, {lampC:{c:'#dfe8ff', glow:'#bcd0ff', gk:0.8}, lampRGB:[170, 190, 255], lampH:2.6, lampStep:24, roof:'#5a4a36', roof2:'#7a6544'})); }}});

// ---------- Bird Paradise (2023): OSM zoo polygons 80,462 + 57,184 m2 west of the Mandai lake road; eight walk-through aviaries ----------
// Aviary nets are centred on the named aviary POIs; their real outlines are not in the data, so each net is kept modest
// (radius = min(38 m, 0.55 x the distance to the nearest other aviary), clipped to the park) - an approximation.
{
const AV = ['Heart of Africa', 'Kuok Group Wings of Asia', 'Lory Loft', 'Mysterious Papua', 'Amazonian Jewels', 'Songs of the Forest', 'Hong Leong Foundation Crimson Wetlands', 'Australia Outback', 'Winged Sanctuary'];
const BPST = Object.assign({}, MANDAI, {ground:[90, 118, 74], wall:'#d8d3c6', trim:'#9c968a', roof:'#5d625c', roof2:'#6e6a5e', roofFlat:'#8a8c86', fascia:'#6d6f6a', treeStep:9.0});
Object.assign(SITES, {sgbirdparadise:{zh:'飞禽公园', en:'Bird Paradise', lat:SGD40.sgbirdparadise.lat, lon:SGD40.sgbirdparadise.lon, r:350, keep:SGD40.sgbirdparadise.keep, keepRoads:[11, 12], h:32,
  lt:{m:0, c:'#ffe4b8', k:0.35, e:0.5},
  build(ctx){
    const D = SGD40.sgbirdparadise, K = D.keep;
    const av = D.pois.filter(p => AV.includes(p[0])).map(p => [p[2], p[3]]);
    const NET = {c:'#2a2f2b', op:0.32, ds:true}, MAST = '#e4e6e3', CAB = '#9ea3a0';
    const extra = (g, B) => {
      for (const c of av){
        let dn = 1e9; for (const o of av) if (o !== c) dn = Math.min(dn, Math.hypot(o[0] - c[0], o[1] - c[1]));
        const Ra = Math.min(38, 0.55*dn), n = 14, gc = ctx.gy(c[0], c[1]), top = [c[0], gc + 24, c[1]], rim = [];
        for (let k = 0; k < n; k++){ const a = k/n*TAU; let rr = Ra; let x = c[0] + Math.cos(a)*rr, z = c[1] + Math.sin(a)*rr;
          for (let it = 0; it < 6 && !pip(K, x, z); it++){ rr *= 0.75; x = c[0] + Math.cos(a)*rr; z = c[1] + Math.sin(a)*rr; }
          rim.push([x, ctx.gy(x, z), z]); }
        B.beam(MAST, [c[0], gc - 1, c[1]], top, 0.45);
        for (let k = 0; k < n; k++){ const p = rim[k], q = rim[(k + 1) % n], pt = [p[0], p[1] + 10, p[2]], qt = [q[0], q[1] + 10, q[2]];
          B.tri(NET, top, pt, qt); B.quad(NET, [p[0], p[1], p[2]], [q[0], q[1], q[2]], qt, pt);
          B.beam(MAST, [p[0], p[1] - 1, p[2]], pt, 0.18); B.beam(CAB, top, pt, 0.05); B.beam(CAB, pt, qt, 0.05);
          ctx.lamp(p[0], p[1] + 9.5, p[2], [255, 214, 160]); }
      }
    };
    return parkSite(ctx, D, Object.assign({}, BPST, {avoid:[]}), extra); }}});
}

// ---------- Sungei Buloh Wetland Reserve: the OSM nature reserve within 520 m of the Wetland Centre (w98748650); hides and the Aerie lookout on their POIs ----------
{
const SBST = Object.assign({}, MANDAI, {ground:[96, 116, 76], wall:'#a58a66', trim:'#6d543a', roof:'#4e4034', roof2:'#5d4c3a', roofFlat:'#6a5a48', treeStep:8.5, treeS:[2.0, 2.0], mix:[0.08, 0.16], lampStep:45, lampH:2.6});
Object.assign(SITES, {sgsungeibuloh:{zh:'双溪布洛湿地保护区', en:'Sungei Buloh Wetland Reserve', lat:SGD40.sgsungeibuloh.lat, lon:SGD40.sgsungeibuloh.lon, r:525, keep:SGD40.sgsungeibuloh.keep, keepRoads:[11, 12], h:20,
  lt:{m:0, c:'#ffe0b0', k:0.3, e:0.5},
  build(ctx){
    const D = SGD40.sgsungeibuloh, TIM = '#7b5c3e', TIM2 = '#5d4430', RF = '#4b3d31';
    const extra = (g, B, BL, wet) => {
      for (const p of D.pois){
        const [name, kind, x, z] = p, y = ctx.gy(x, z);
        if (kind === 'shelter' || kind === 'bird_hide'){
          // timber hide / shelter on stilts with a pitched roof
          const st = wet(x, z) ? 1.6 : 0.4;
          for (const [u, v] of [[-2, -1.5], [2, -1.5], [2, 1.5], [-2, 1.5]]) B.box(TIM2, x + u, y - 2, z + v, 0.25, st + 2 + 2.6, 0.25, 0);
          B.box(TIM, x, y + st, z, 4.6, 0.2, 3.6, 0);
          B.box(TIM, x, y + st + 0.2, z - 1.7, 4.4, 1.1, 0.12, 0); B.box(TIM, x - 2.2, y + st + 0.2, z, 0.12, 1.1, 3.4, 0); B.box(TIM, x + 2.2, y + st + 0.2, z, 0.12, 1.1, 3.4, 0);
          gable(g, x, z, 5.4, 4.4, y + st + 2.6, 1.4, RF, 0);
        } else if (name === 'Aerie'){
          // lookout tower (timber frame, three platforms)
          for (const [u, v] of [[-2, -2], [2, -2], [2, 2], [-2, 2]]) B.beam(TIM2, [x + u*1.2, y - 2, z + v*1.2], [x + u, y + 9.5, z + v], 0.2);
          for (const hh of [3.2, 6.4, 9.2]) B.box(TIM, x, y + hh, z, 4.6, 0.25, 4.6, 0);
          for (const hh of [4.2, 7.4, 10.2]) B.band(TIM2, [[x - 2.3, z - 2.3], [x + 2.3, z - 2.3], [x + 2.3, z + 2.3], [x - 2.3, z + 2.3]], y + hh - 1.0, 0.12, 0);
          hipRoof(g, x, z, 5.6, 5.6, y + 11.6, 2.0, RF, 0, 0);
          for (const [u, v] of [[-2, -2], [2, -2], [2, 2], [-2, 2]]) B.beam(TIM2, [x + u, y + 9.4, z + v], [x + u, y + 11.6, z + v], 0.12);
        }
      }
    };
    return parkSite(ctx, D, SBST, extra); }}});
}
}
