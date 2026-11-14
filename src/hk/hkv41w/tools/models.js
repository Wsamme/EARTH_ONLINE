// ---- hkv41w models. Data: FD[key] = {lat, lon, r, base, G (ground minus base, local grid), parts:[[base_m, height_m, ring, wall]]}
// heights and footprints are the map's OSM-derived building data; massing / colour / facade details are approximations from
// general knowledge of each building (style only, no measured facts).
const PL = {}; for (const k in FD) PL['hk41w_' + k] = {lat:FD[k].lat, lon:FD[k].lon, rot:0};
const gK = k => gL(k);
const partsOf = k => FD[k].parts.map(p => ({b:p[0], h:p[1], P:clean(p[2]), wall:p[3]}));
const gAt = (gf, P) => { const c = cenP(P); return gf(c[0], c[1]); };
const hexOf = w => '#' + w.map(v => Math.max(0, Math.min(255, v | 0)).toString(16).padStart(2, '0')).join('');
const WIN = {c:'#33404a', glow:'#ffdcae', gk:0.55};
const avl = (g, P, y) => { const c = cenP(P); avLights(g, [[c[0], y + 0.6, c[1]]], 0.45); };
// a generic stepped / plain shaft: body prism from y0 to y1, spandrel bands every fh, optional vertical piers, a parapet
function shaft(B, P, y0, y1, o){
  prismP(B.p(o.body), P, y0, y1, false, true);
  if (o.band) bandsP(B.p(o.band), P, y0 + (o.fh || 3.6), y1 - 1.5, o.fh || 3.6, o.bh || 0.7, 0.1);
  if (o.pier) mullP(B.p(o.pier), P, y0, y1 - 0.5, o.psp || 3, o.pw || 0.5, 0.06, o.pd || 0.3);
  if (o.par) edgeP(B.p(o.par), P, y1, 0.5, o.parh || 1.2, 0);
}

// ===== Standard Chartered Bank Building (Des Voeux Road Central, west of the HSBC Main Building). The OSM building parts give a
// tower stepping back in tiers (75, 97, 119, 141, 163 m) with a small top part to 185 m. Polished grey-pink granite with vertical
// strip windows of dark glass; each setback finished by a lit parapet (approximate styling).
LANDMARKS.hk41w_stanchart = {zh:'渣打银行大厦', en:'Standard Chartered Bank Building', cat:'new', r:40, h:185,
  lt:{m:1, c:'#ffe6c2', k:0.5, fh:3.8, cw:1.5}, build(){
  const g = new THREE.Group(), B = mkB(), gf = gK('stanchart'), Ps = partsOf('stanchart');
  const out = Ps.find(p => p.h < 20), g0 = gAt(gf, out.P);
  const GR = {c:'#a99a92', m:1, fh:3.8, cw:2.2}, GRL = {c:'#c9bdb4', m:0, lk:0.3}, PAR = {c:'#ddd3c9', glow:'#fff1d8', gk:0.7};
  // podium: the whole plot, stone with a glazed ground floor
  prismP(B.p({c:'#9c8f87', m:0, lk:0.3}), out.P, (x, z) => gf(x, z) - 2, g0 + out.h, false, true);
  winsP(B.p(WIN), out.P, g0 + 0.8, g0 + 5.8, 6, 3.2, 2.6, 4.6, 0.08);
  const tiers = Ps.filter(p => p.h >= 20).sort((a, b) => a.h - b.h);
  let prev = g0 + out.h;
  for (const t of tiers){
    const P = t.P, top = g0 + t.h, lo = prev; prev = top;
    if (t.h >= 180){ // the top part: a slim lantern and mast
      prismP(B.p(GRL), P, lo - 1, top - 3, false, true); prismP(B.p({c:'#e8e0d6', glow:'#fff4dc', gk:0.9}), clean(offP(P, -0.4)), top - 3, top);
      const c = cenP(P); LCylD(g, 0.25, 0.4, 8, c[0], top, c[1], '#bfc4c8', 6); avl(g, P, top + 8); continue; }
    shaft(B, P, g0 + out.h - 0.5, top, {body:GR, pier:GRL, psp:2.6, pw:0.55, pd:0.35, par:PAR, parh:1.4});
  }
  B.flush(g); return g; }};

// ===== The Landmark: Gloucester Tower (Des Voeux Road / Pedder Street corner) and Edinburgh Tower (Queen's Road Central, with
// the hotel) on the stone podium of the Landmark mall. Both towers 159 m in the map data, standing on a 12.4 m podium. Gloucester
// Tower in pale blue-grey glass with a fine grid, Edinburgh Tower in darker bronze glass with light horizontal spandrels
// (approximate styling).
LANDMARKS.hk41w_landmark = {zh:'置地广场（告罗士打大厦、公爵大厦）', en:'The Landmark (Gloucester Tower, Edinburgh Tower)', cat:'new', r:60, h:159,
  lt:{m:1, c:'#fff0d8', k:0.55, fh:3.8, cw:1.6}, build(){
  const g = new THREE.Group(), B = mkB(), gf = gK('landmark'), Ps = partsOf('landmark');
  const pod = Ps.find(p => p.h < 20), towers = Ps.filter(p => p.h > 100);
  const POD = {c:'#c8c0b4', m:0, lk:0.35}, PODR = {c:'#b1aa9f', m:0, lk:0.2};
  for (const t of towers){
    const P = t.P, g0 = gAt(gf, P), yP = g0 + t.b, top = g0 + t.h;
    const isG = t.P.length > 6;   // the 8-point outline is Gloucester Tower (north), the 4-point one Edinburgh Tower (south)
    // the podium under this tower
    prismP(B.p(POD), P, (x, z) => gf(x, z) - 2, yP, false, true);
    winsP(B.p(WIN), P, g0 + 0.8, g0 + 5.6, 6, 4.2, 3.4, 4.4, 0.08);
    bandsP(B.p(PODR), P, yP - 1.2, yP, 9, 1.2, 0.12);
    const Q = clean(offP(P, -1.2));
    if (isG){
      skinP(B, Q, yP, top - 6, {glass:{c:'#8fa6b6', m:1, fh:3.8, cw:1.5}, mull:'#d7dfe4', sp:1.6, mw:0.14, band:'#c3ccd2', fh:3.8, bh:0.35});
      prismP(B.p({c:'#c9d3da', m:0, lk:0.3, glow:'#eaf2ff', gk:0.6}), clean(offP(Q, -1.5)), top - 6, top, false, true);
      edgeP(B.p({c:'#e6edf2', glow:'#f2f7ff', gk:0.9}), Q, top - 6.4, 0.4, 0.8, 0.05);
    } else {
      skinP(B, Q, yP, top - 4, {glass:{c:'#5e5348', m:1, fh:3.8, cw:1.8}, band:'#bfae98', fh:3.8, bh:1.1, pier:'#4a4038', psp:4.5, pw:0.4, pd:0.25});
      prismP(B.p({c:'#a8987f', m:0, lk:0.25}), Q, top - 4, top, false, true);
      edgeP(B.p({c:'#e2d4bf', glow:'#fff0d4', gk:0.8}), Q, top, 0.4, 1.0, 0);
    }
    avl(g, Q, top);
  }
  if (pod){ const g0 = gAt(gf, pod.P); prismP(B.p(POD), pod.P, (x, z) => gf(x, z) - 2, g0 + pod.h, false, true); edgeP(B.p(PODR), pod.P, g0 + pod.h, 0.5, 1.0, 0); }
  B.flush(g); return g; }};

// ===== The Belcher's (Pok Fu Lam Road / Belcher's Street, Sai Wan): six residential towers (171.5-196.3 m in the map data) on a
// 32 m podium stepping down the hillside. Pale cream and beige walls with rows of windows and bay windows, the tops finished with
// lighter crowns and lit rims (approximate styling).
LANDMARKS.hk41w_belchers = {zh:'宝翠园', en:'The Belcher\'s', cat:'new', r:128, h:196,
  lt:{m:1, c:'#ffd9a4', k:0.55, fh:3, cw:1.4}, build(){
  const g = new THREE.Group(), B = mkB(), gf = gK('belchers'), Ps = partsOf('belchers');
  const pod = Ps.reduce((a, p) => (area2(p.P) ** 2 > area2(a.P) ** 2 ? p : a)), towers = Ps.filter(p => p.h > 100);
  const gP = gMin(gf, pod.P), yP = gP + pod.h;
  prismP(B.p({c:'#b9b1a4', m:0, lk:0.3}), pod.P, (x, z) => gf(x, z) - 2, yP, false, true);
  bandsP(B.p('#8f877c'), pod.P, gP + 4, yP - 1, 4.5, 0.8, 0.1);
  winsP(B.p(WIN), pod.P, gP + 1, yP - 2, 4.5, 6, 4, 1.6, 0.12);
  edgeP(B.p({c:'#ddd6ca', m:0, lk:0.3}), pod.P, yP, 0.5, 1.1, 0);
  // podium roof garden: green patches
  flatP(B.p({c:'#7d9a5c', m:0, lk:0.1}), clean(offP(pod.P, -4)), yP + 0.15);
  for (const t of towers){
    const P = t.P, top = gAt(gf, P) + t.h, y0 = yP - 0.5, col = towers.indexOf(t) % 2 ? '#d6ccbb' : '#cdc2b0';
    prismP(B.p({c:col, m:1, fh:3, cw:1.4}), P, y0, top - 7, false, true);
    bandsP(B.p('#9a9488'), P, y0 + 6, top - 8, 6, 0.45, 0.08);
    const Q = clean(offP(P, -1.2));
    prismP(B.p({c:'#efe9dd', m:0, lk:0.35}), Q, top - 7, top - 1.2, false, true);
    edgeP(B.p({c:'#f6f1e6', glow:'#fff1d6', gk:0.8}), P, top - 7.4, 0.5, 0.9, 0.05);
    prismP(B.p({c:'#d9d2c4', m:0, lk:0.2}), clean(offP(Q, -3)), top - 1.2, top, false, true);
    avl(g, Q, top);
  }
  B.flush(g); return g; }};

// ===== Four Seasons Place and the Four Seasons Hotel (Finance Street, Central reclamation, west of One IFC): the taller block
// (205 m, a 214 m top part in the map data) and the lower hotel block (165 m). Light grey-beige stone frames with blue-grey glass,
// stepped crowns (approximate styling).
LANDMARKS.hk41w_fourseasons = {zh:'四季汇及四季酒店', en:'Four Seasons Place and Four Seasons Hotel', cat:'new', r:62, h:214,
  lt:{m:1, c:'#ffe4bc', k:0.55, fh:3.4, cw:1.5}, build(){
  const g = new THREE.Group(), B = mkB(), gf = gK('fourseasons'), Ps = partsOf('fourseasons');
  const ST = {c:'#cfc8bb', m:1, fh:3.4, cw:1.6}, FR = {c:'#e3ddd1', m:0, lk:0.35}, CR = {c:'#ece6da', glow:'#fff2da', gk:0.8};
  for (const t of Ps){
    const P = t.P, g0 = gAt(gf, P), top = g0 + t.h, small = Math.abs(area2(P)) < 600;
    if (small){ // the top part over the taller block: a stepped crown
      prismP(B.p(FR), P, top - 16, top - 4, false, true); prismP(B.p(CR), clean(offP(P, -1)), top - 4, top, false, true); avl(g, P, top); continue; }
    prismP(B.p(FR), P, (x, z) => gf(x, z) - 2, g0 + 14, false, true);
    winsP(B.p(WIN), P, g0 + 1, g0 + 12, 6.5, 4, 3.2, 5, 0.08);
    shaft(B, clean(offP(P, -0.6)), g0 + 14, top - 5, {body:ST, pier:FR, psp:3.4, pw:0.6, pd:0.3, band:'#b9b3a8', fh:3.4, bh:0.4});
    const Q = clean(offP(P, -2));
    prismP(B.p(FR), Q, top - 5, top, false, true); edgeP(B.p(CR), clean(offP(P, -0.6)), top - 5.4, 0.5, 1, 0.05);
    avl(g, Q, top);
  }
  B.flush(g); return g; }};

// ===== Central Market (Queen's Road Central / Des Voeux Road Central): the long market hall, here at its map-data height of
// 10.3 m; pale cream walls with long horizontal window bands and a flat roof with a parapet (approximate styling of the
// streamlined facade).
LANDMARKS.hk41w_centralmkt = {zh:'中环街市', en:'Central Market', cat:'heritage', r:54, h:10,
  lt:{m:0, c:'#fff0d6', k:0.45, e:0.6}, build(){
  const g = new THREE.Group(), B = mkB(), gf = gK('centralmkt'), P = partsOf('centralmkt')[0].P, g0 = gMin(gf, P), top = g0 + 10.3;
  prismP(B.p({c:'#e8e1cf', m:0, lk:0.4}), P, (x, z) => gf(x, z) - 2, top, false, true);
  bandsP(B.p({c:'#4a5a5c', glow:'#ffe6bf', gk:0.5}), P, g0 + 1.2, top - 1.2, 4.4, 2.2, 0.08);
  bandsP(B.p('#cfc6b0'), P, g0 + 3.6, top - 1, 4.4, 0.35, 0.16);
  edgeP(B.p({c:'#f2ecdc', m:0, lk:0.4}), P, top, 0.5, 0.9, 0);
  const Q = clean(offP(P, -6)); prismP(B.p({c:'#c9c2b0', m:0, lk:0.25}), Q, top, top + 0.6, false, true);
  B.flush(g); return g; }};

// ===== Sheung Wan Municipal Services Building (Queen Street / Morrison Street, Sheung Wan; it houses the Sheung Wan Civic Centre
// named on the map): a broad block at its map-data height of 38.2 m. Grey-white concrete with long horizontal window bands, a
// glazed ground floor and rooftop plant (approximate styling).
LANDMARKS.hk41w_swmsb = {zh:'上环市政大厦', en:'Sheung Wan Municipal Services Building', cat:'new', r:40, h:38,
  lt:{m:1, c:'#fff0d8', k:0.45, fh:4.2, cw:2}, build(){
  const g = new THREE.Group(), B = mkB(), gf = gK('swmsb'), t = partsOf('swmsb')[0], P = t.P, g0 = gMin(gf, P), top = g0 + t.h;
  prismP(B.p({c:'#c9c7bf', m:1, fh:4.2, cw:2.2}), P, (x, z) => gf(x, z) - 2, top - 3, false, true);
  winsP(B.p(WIN), P, g0 + 0.8, g0 + 5, 5, 4, 3.4, 4, 0.08);
  bandsP(B.p('#e4e2da'), P, g0 + 6, top - 4, 4.2, 1.4, 0.14);
  edgeP(B.p({c:'#e8e6de', m:0, lk:0.35}), P, top - 3, 0.5, 1.0, 0);
  const c = cenP(P), RP = B.p({c:'#a9a79f', m:0, lk:0.2}); boxP(RP, 14, 3, 9, c[0] - 6, top - 3, c[1], 0); boxP(RP, 8, 4.5, 8, c[0] + 8, top - 3, c[1] + 2, 0);
  B.flush(g); return g; }};

// ===== Three Pacific Place (Queen's Road East, at the eastern edge of Admiralty, linked to Pacific Place): an office tower of
// 182 m in the map data on its 20-point footprint. Blue-grey glass curtain wall with fine vertical mullions and heavier piers,
// a recessed glazed top with a lit rim; a stone-clad lobby base (approximate styling).
LANDMARKS.hk41w_threepp = {zh:'太古广场三座', en:'Three Pacific Place', cat:'new', r:34, h:182,
  lt:{m:1, c:'#e4ecff', k:0.55, fh:4, cw:1.5}, build(){
  const g = new THREE.Group(), B = mkB(), gf = gK('threepp'), t = partsOf('threepp')[0], P = t.P, g0 = gAt(gf, P), top = g0 + t.h;
  prismP(B.p({c:'#bdb8ae', m:0, lk:0.3}), P, (x, z) => gf(x, z) - 2, g0 + 12, false, true);
  winsP(B.p(WIN), P, g0 + 0.8, g0 + 9, 9, 4.5, 3.8, 7.5, 0.08);
  skinP(B, P, g0 + 12, top - 8, {glass:{c:'#7d93a6', m:1, fh:4, cw:1.5}, mull:'#c9d3db', sp:1.5, mw:0.12, pier:'#9fb0bd', psp:6, pw:0.5, pd:0.3});
  const Q = clean(offP(P, -1.5));
  prismP(B.p({c:'#8ea3b4', m:0, lk:0.2, glow:'#eaf1ff', gk:0.5}), Q, top - 8, top, false, true);
  edgeP(B.p({c:'#e8eef3', glow:'#f3f8ff', gk:0.9}), P, top - 8.4, 0.5, 0.9, 0.05);
  avl(g, Q, top);
  B.flush(g); return g; }};

for (const k in PL) SG_PLACES.push({type:k, lat:PL[k].lat, lon:PL[k].lon, rot:PL[k].rot});
