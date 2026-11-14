// ===== hk/hkv41e (City Brush v41): east Hong Kong Island towers and the Academy for Performing Arts on their real footprints.
// Footprints and heights: the app's own building data (hk_bld0, OSM-derived), decoded by hk/hkv41e/dec.js + prep.js; every plan
// below is that footprint ring (local metres round its bbox centre, +x east, +z south, rot 0). Heights = the data heights, set so
// the model's roof meets ground + data height at the footprint centre (dy = app 'top' minus ground there). Facade rhythm, crown
// shapes and colours are approximations from general knowledge of the buildings, not measured. No text, signs or logos.
{
const D = __D__;
const NAMES = {
  hk41ehighcliff:['晓庐', 'Highcliff'], hk41esummit:['御峰', 'The Summit'], hk41eislandresort:['蓝湾半岛', 'Island Resort'],
  hk41egrandprom:['嘉亨湾', 'Grand Promenade'], hk41etunglin:['东莲觉苑', 'Tung Lin Kok Yuen'], hk41epaktai:['湾仔北帝庙', 'Pak Tai Temple, Wan Chai'],
  hk41etinhau:['铜锣湾天后古庙', 'Causeway Bay Tin Hau Temple'], hk41elawuk:['罗屋民俗馆', 'Law Uk Folk Museum'], hk41ehkapa:['香港演艺学院', 'Hong Kong Academy for Performing Arts']
};
const SC = (R, s) => R.map(p => [p[0]*s, p[1]*s]);
const rAvg = R => R.reduce((a, p) => a + Math.hypot(p[0], p[1]), 0)/R.length;
const OUT = (R, d) => SC(R, 1 + d/Math.max(4, rAvg(R)));            // approximate offset (rings are compact)
// a residential / office tower on ring R: body of glass (lit windows), a floor band every fh, pilasters, then a crown
function tower(g, R, Ht, deep, S){
  const fh = S.fh || 3.1, cH = S.cH || 12, bodyH = Ht - cH;
  const glass = {c:S.glass, fh, cw:S.cw || 2.2}, band = {c:S.band, m:0, lk:0.12}, dark = '#4a4c4e';
  LPoly(g, R, -deep, deep + 0.2, dark);
  LPoly(g, OUT(R, 0.3), 0, S.lobby || 6, {c:S.base || S.band, m:0, lk:0.5});          // lobby / base course
  LPoly(g, R, 0, bodyH, glass);
  const RB = OUT(R, S.bandOut || 0.35);
  for (let y = (S.lobby || 6) + fh; y < bodyH - 0.5; y += fh) LPoly(g, RB, y - (S.bandH || 0.7), S.bandH || 0.7, band);
  if (S.pil){ const n = R.length, st = Math.max(1, Math.round(n/S.pil)); const RP = OUT(R, 0.5);
    for (let i = 0; i < n; i += st){ const p = RP[i]; LBox(g, 1.1, bodyH - 6, 1.1, p[0], 6, p[1], band); } }
  // crown
  let y = bodyH;
  const steps = S.steps || [0.94, 0.86];
  const sh = cH*0.55/steps.length;
  for (const s of steps){ LPoly(g, SC(R, s), y, sh, glass); LPoly(g, SC(OUT(R, 0.3), s), y + sh - 0.8, 0.8, band); y += sh; }
  const top = Ht - y, Rt = SC(R, S.capS || 0.8);
  if (S.crown === 'fin'){            // open fins round a curved crown, lit from inside at night
    LPoly(g, SC(R, (S.capS || 0.8)*0.8), y, top*0.6, '#6a7076');
    const n = Rt.length, st = Math.max(1, Math.round(n/18));
    for (let i = 0; i < n; i += st) LBox(g, 0.7, top, 0.7, Rt[i][0], y, Rt[i][1], {c:S.band, glow:S.glow, gk:0.5});
    LRingPoly(g, Rt, Ht - 1.2, 1.2, {c:S.band, glow:S.glow, gk:0.9});
  } else if (S.crown === 'frame'){   // roof plant box inside a cornice frame on posts
    LPoly(g, SC(R, (S.capS || 0.8)*0.75), y, top*0.7, S.band);
    const n = Rt.length, st = Math.max(1, Math.round(n/8));
    for (let i = 0; i < n; i += st) LBox(g, 1.4, top, 1.4, Rt[i][0], y, Rt[i][1], S.band);
    LRingPoly(g, Rt, Ht - 2, 2, {c:S.band, glow:S.glow, gk:0.6});
  } else {                           // stepped glass cap with a lit rim
    LPoly(g, Rt, y, top - 1, glass); LPoly(g, SC(R, (S.capS || 0.8)*0.7), Ht - 1, 1, {c:S.band, glow:S.glow, gk:0.8});
  }
}
// a thin band following ring R (outer ring only, as wall quads 0.6 m thick)
function LRingPoly(g, R, y0, h, col){
  const pos = [], n = R.length, Ri = SC(R, 0.94);
  const q = (A, B, C, E) => pos.push(...A, ...B, ...C, ...A, ...C, ...E);
  for (let i = 0; i < n; i++){ const j = (i + 1) % n, a = R[i], b = R[j], c = Ri[i], d = Ri[j];
    q([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y0 + h, b[1]], [a[0], y0 + h, a[1]]);
    q([d[0], y0, d[1]], [c[0], y0, c[1]], [c[0], y0 + h, c[1]], [d[0], y0 + h, d[1]]);
    q([a[0], y0 + h, a[1]], [b[0], y0 + h, b[1]], [d[0], y0 + h, d[1]], [c[0], y0 + h, c[1]]); }
  return LTris(g, pos, col);
}
const STY = {
  // Highcliff: slim blue-grey glass shaft, fine white floor lines, a lit curved crown of fins (approximation)
  hk41ehighcliff:{glass:'#5d7d94', band:'#e4e8ea', fh:3.1, cH:16, steps:[0.95, 0.9], crown:'fin', capS:0.86, glow:'#dfe9ff', pil:6},
  // The Summit: green-blue glass with grey floor lines, a stepped tapering top (approximation)
  hk41esummit:{glass:'#4d7779', band:'#c8ced1', fh:3.1, cH:20, steps:[0.92, 0.82, 0.72], capS:0.6, glow:'#c8fff4', pil:5},
  // Island Resort: cream-and-blue residential towers with corner pilasters and a framed roof (approximation)
  hk41eislandresort:{glass:'#8ea6ba', band:'#ece6d8', base:'#cfc5b2', fh:2.95, bandH:1.3, cH:14, steps:[0.93], crown:'frame', capS:0.82, glow:'#ffe2b0', pil:8},
  // Grand Promenade: blue glass with white floor lines and a lit curved crown (approximation)
  hk41egrandprom:{glass:'#3f6680', band:'#dfe3e6', fh:3.0, cH:16, steps:[0.94, 0.86], crown:'fin', capS:0.8, glow:'#cfe6ff', pil:6}
};
const sty = k => STY[k] || STY[k.replace(/_[a-z]$/, '')];
const mainOf = k => k.replace(/_[a-z]$/, '');
for (const k of Object.keys(D)){
  if (!STY[k] && !STY[mainOf(k)]) continue;
  const d = D[k], Ht = Math.max(20, d.h - d.dy), main = mainOf(k), nm = NAMES[main];
  LANDMARKS[k] = Object.assign({zh:nm[0], en:nm[1], cat:'new', r:d.r, h:Ht, lt:{m:1, c:sty(k).glow, k:0.55}}, k === main ? {} : {label:false}, {
    build(){ const g = new THREE.Group(); tower(g, d.ring, Ht, d.deep, sty(k)); return g; }});
  SG_PLACES.push({type:k, lat:d.ll[0], lon:d.ll[1], rot:0});
}
// Hong Kong Academy for Performing Arts: the data footprint at the data height; exposed concrete frame, dark glazed bands,
// a recessed glazed ground storey and a parapet (approximation of the concrete-and-glass look).
{
  const d = D.hk41ehkapa, Ht = Math.max(8, d.h - d.dy), nm = NAMES.hk41ehkapa;
  LANDMARKS.hk41ehkapa = {zh:nm[0], en:nm[1], cat:'new', r:d.r, h:Ht, lt:{m:0, c:'#ffe1b8', k:0.55, e:0.4},
    build(){
      const g = new THREE.Group(), R = d.ring, conc = '#bdb7ab', glass = {c:'#36424c', glow:'#ffd9a8', gk:0.25};
      LPoly(g, R, -d.deep, d.deep + 0.2, '#6d6a64');
      LPoly(g, SC(R, 0.985), 0, 4.5, glass);
      LPoly(g, R, 4.5, Ht - 4.5, conc);
      for (const y of [7.5, 7.5 + (Ht - 9)/2]) if (y + 2.2 < Ht - 1.5) LPoly(g, OUT(R, 0.15), y, 2.2, glass);
      LRingPoly(g, OUT(R, 0.2), Ht, 1.1, conc);
      // exposed concrete columns round the perimeter, about every 6 m
      const RP = OUT(R, 0.45);
      for (let i = 0; i < RP.length; i++){ const a = RP[i], b = RP[(i + 1) % RP.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.floor(L/6);
        for (let j = 0; j <= n; j++){ const t = n ? j/n : 0; LBox(g, 0.8, Ht - 4.5, 0.8, a[0] + (b[0] - a[0])*t, 4.5, a[1] + (b[1] - a[1])*t, conc); } }
      return g; }};
  SG_PLACES.push({type:'hk41ehkapa', lat:d.ll[0], lon:d.ll[1], rot:0});
}
// Tung Lin Kok Yuen: a Buddhist temple on its wedge-shaped lot (data footprint, data height). Ochre plastered walls with red
// window bays, green glazed tile eaves and stepped hip roofs, and a double-eaved roof over the wide (north) end. Colours and
// roof form are approximations of the temple's Chinese-revival look, not measured.
{
  const d = D.hk41etunglin, Ht = Math.max(8, d.h - d.dy), nm = NAMES.hk41etunglin;
  LANDMARKS.hk41etunglin = {zh:nm[0], en:nm[1], cat:'old', r:d.r, h:Ht + 4, lt:{m:0, c:'#ffd9a0', k:0.7, anim:'breathe'},
    build(){
      const g = new THREE.Group(), R = d.ring, wall = '#d9c08a', red = '#9a2f22', tile = '#3f7a4e', ridge = '#2f5f3c', eH = Ht - 2.4;
      LPoly(g, R, -d.deep, d.deep + 0.2, '#8a8174');
      LPoly(g, OUT(R, 0.4), 0, 1.2, '#b9b0a0');                       // granite plinth
      LPoly(g, R, 1.2, eH - 1.2, wall);
      for (const y of [2.2, 2.2 + (eH - 3)/2]) LPoly(g, OUT(R, 0.12), y, (eH - 3)/2 - 1.2, {c:red, glow:'#ffcf8a', gk:0.15});
      LPoly(g, OUT(R, 0.12), eH - 1.6, 0.5, wall);                    // frieze
      LPoly(g, OUT(R, 1.3), eH, 0.45, tile);                         // projecting eave
      LPoly(g, SC(R, 0.9), eH + 0.45, 0.9, tile);
      LPoly(g, SC(R, 0.78), eH + 1.35, 0.8, tile);
      LPoly(g, SC(R, 0.62), eH + 2.15, 0.6, ridge);
      // double-eaved roof over the wide north end of the lot
      let cx = 0, cz = 0, n = 0; for (const p of R) if (p[1] < -12){ cx += p[0]; cz += p[1]; n++; }
      if (n){ cx /= n; cz /= n;
        LBox(g, 13, 3.0, 9, cx, eH + 0.4, cz, wall);
        LFrust(g, 16, 12, 11, 7, 1.6, cx, eH + 3.4, cz, tile);
        LBox(g, 10, 1.6, 6, cx, eH + 5.0, cz, red);
        LFrust(g, 13, 9, 3, 1.2, 2.6, cx, eH + 6.6, cz, tile);
        LBox(g, 4.5, 0.5, 0.6, cx, eH + 9.2, cz, ridge); }
      return g; }};
  SG_PLACES.push({type:'hk41etunglin', lat:d.ll[0], lon:d.ll[1], rot:0});
}
// ---- three heritage buildings with pitched Chinese roofs: walls on the data footprint, halls aligned to the footprint's axis
// (ry from its long edge). Data heights: Pak Tai 15 m (taken as the main ridge), Tin Hau 3.7 m (an OSM one-storey default: taken
// as the eave height, the roof rises above it), Law Uk 6.8 m (ridge). Hall layout, roof pitch and colours are approximations.
function hallRoof(g, ry, u, v, L, W, yE, rh, tile, rc, alongV, plain){
  const P = rotP(0, 0, ry)(u, 0, v), r = alongV ? ry - Math.PI/2 : ry;
  LBox(g, L - 0.6, 0.35, W - 0.6, P[0], yE - 0.35, P[2], '#5a4a40', r);                     // eave board / soffit
  gable(g, P[0], P[2], L, W, yE, rh, tile, r);
  LBox(g, L + 0.2, 0.5, 0.45, P[0], yE + rh - 0.1, P[2], rc, r);                             // main ridge
  const R2 = rotP(P[0], P[2], r);
  if (!plain) for (const e of [-1, 1]){ const q = R2(e*(L/2 + 0.1), 0, 0); LBox(g, 0.6, 0.7, 0.5, q[0], yE + rh + 0.2, q[2], rc, r); }  // upturned ridge ends
}
function temple(g, R, deep, yW, wall, plinth){
  LPoly(g, R, -deep, deep + 0.2, '#7d766c');
  LPoly(g, OUT(R, 0.35), 0, 0.6, plinth);
  LPoly(g, R, 0.6, yW - 0.6, wall);
  LPoly(g, OUT(R, 0.06), yW - 0.9, 0.55, {c:'#e8e2d2', m:0, lk:0.4});                     // painted frieze under the eaves
}
const HER = {
  hk41epaktai(g, d){
    const ry = -0.078, top = Math.max(8, d.h - d.dy), tile = '#4f7d55', rc = '#c9b48a';
    temple(g, d.ring, d.deep, top - 5.0, '#8f8a82', '#b8b2a6');
    hallRoof(g, ry, 0.5, -8.2, 17, 11.5, top - 4.6, 2.8, tile, rc);  // walls top at top - 5.0, all eaves at or above it                        // front hall over the wide north part
    hallRoof(g, ry, -12, -8.2, 10, 11, top - 5.0, 2.2, tile, rc); hallRoof(g, ry, 13, -7.6, 10, 9.5, top - 5.0, 2.2, tile, rc);
    hallRoof(g, ry, 1.0, 6.5, 16.5, 14.5, top - 3.8, 3.4, tile, rc);                       // main hall, uphill to the south
    const P = rotP(0, 0, ry)(0.5, 0, -14.4); LBox(g, 4.2, 3.4, 0.4, P[0], 0.6, P[2], {c:'#3b2a22', glow:'#ffcc88', gk:0.3}, ry);  // doorway
  },
  hk41etinhau(g, d){
    const ry = -0.241, yW = Math.max(3.7, d.h), tile = '#5b7f5c', rc = '#cdb88c';
    temple(g, d.ring, d.deep, yW, '#9a958c', '#b9b3a7');
    hallRoof(g, ry, 0, -4.4, 18.6, 7.6, yW, 2.0, tile, rc);
    hallRoof(g, ry, 0, 3.6, 18.6, 9.4, yW + 0.6, 2.4, tile, rc);
    const P = rotP(0, 0, ry)(0, 0, -8.2); LBox(g, 3.2, 2.8, 0.4, P[0], 0.6, P[2], {c:'#3b2a22', glow:'#ffcc88', gk:0.3}, ry);
  },
  hk41elawuk(g, d){
    const ry = 0.577, top = Math.max(5, d.h - d.dy), tile = '#55534f', rc = '#6b6863';
    temple(g, d.ring, d.deep, top - 1.9, '#b4aa98', '#9e978a');
    hallRoof(g, ry, -0.15, -1.85, 16.8, 7.6, top - 1.9, 1.9, tile, rc, false, true);                    // main row, ridge along the long side
    hallRoof(g, ry, -5.95, 3.9, 4.8, 5.4, top - 1.9, 1.5, tile, rc, true, true);                 // side wings round the front yard
    hallRoof(g, ry, 5.55, 3.9, 4.8, 5.4, top - 1.9, 1.5, tile, rc, true, true);
  }
};
for (const k of Object.keys(HER)){
  const d = D[k], nm = NAMES[k], top = k === 'hk41etinhau' ? Math.max(3.7, d.h) + 3.4 : Math.max(5, d.h - d.dy);
  LANDMARKS[k] = {zh:nm[0], en:nm[1], cat:'old', r:d.r, h:top, lt:{m:0, c:'#ffd6a0', k:0.75}, build(){ const g = new THREE.Group(); HER[k](g, d); return g; }};
  SG_PLACES.push({type:k, lat:d.ll[0], lon:d.ll[1], rot:0});
}
}
