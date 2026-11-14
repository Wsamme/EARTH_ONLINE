
// ================= Guomao Building (Shenzhen International Trade Centre, 1985) =================
// 160 m, 50 floors, the revolving restaurant on floors 48-49 and a helipad on the roof (Wikipedia); built at "one floor in three
// days" with slip forms (ourchinastory / sz.gov.cn). OSM: the chamfered square shaft w271080469 (36.8 m, 150 m) and the round
// top w771860780 (r 18.2 m, 160 m). Pale tiled piers and dark tinted glass; the drum of the revolving restaurant is glazed all
// round and glows warm at night.
const GM = {u:[0.981, -0.189], H:18.4, ch:3.1, rD:18.2};
const gmP = (s, t) => [GM.u[0]*s - GM.u[1]*t, GM.u[1]*s + GM.u[0]*t];
LANDMARKS.szguomao = {zh:'国贸大厦', en:'Guomao Building (International Foreign Trade Centre)', cat:'new', r:30, h:160, lt:{m:1, c:'#fff0d8', k:0.7, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = Bt(), {H, ch, rD} = GM, [ux, uz] = GM.u;
    const GL = {c:'#4d5559', m:1, fh:3.0, cw:2.4}, PIER = {c:'#dcd8ce', m:0, lk:0.45}, SPAN = '#cfcbc0', ROOF = '#8f9290',
      DRUM = {c:'#5a4f45', m:0, glow:'#ffcf8a', gk:0.85}, DRF = {c:'#e2ddd2', m:0, lk:0.6}, PAD = '#7d8386', PADL = {c:'#e6e6e0', glow:'#fff4d8', gk:0.6},
      BASE = '#b7ae9e', LOB = {c:'#3f4649', glow:'#ffe1b0', gk:0.6};
    // explicit 8-point ring (counter-clockwise in s/t): corners cut by ch
    const ring = h => [gmP(-h + ch, -h), gmP(h - ch, -h), gmP(h, -h + ch), gmP(h, h - ch), gmP(h - ch, h), gmP(-h + ch, h), gmP(-h, h - ch), gmP(-h, -h + ch)];
    const HS = 143;
    ext(B, LOB, ring(H - 0.6), 0, 6, null);
    ext(B, GL, ring(H), 6, HS, ROOF);
    // facade: pale piers every 2.4 m on each face, spandrels each floor, a heavier pier on every chamfer
    mullions(B, PIER, ring(H), 2.45, 0.5, 0.75, 6, HS - 0.5, false);
    for (let y = 9; y < HS - 1; y += 3.0) ext(B, SPAN, grow(ring(H), 0.18), y - 0.55, y + 0.15, null);
    { const R8 = ring(H + 0.35); for (let i = 1; i < 8; i += 2){ const a = R8[i], b = R8[(i + 1)%8];
      obox(B, PIER, (a[0] + b[0])/2, (a[1] + b[1])/2, b[0] - a[0], b[1] - a[1], ch*1.5, 1.1, 0, HS + 1.2, true); } }
    ext(B, DRF, grow(ring(H), 0.5), HS - 1.5, HS + 0.6, ROOF);
    // the revolving restaurant drum (floors 48-49), the roof machinery and the helipad deck
    cylw(B, DRF, 0, 0, rD - 1.2, rD, HS + 0.6, HS + 1.6, 36, null);
    cylw(B, DRUM, 0, 0, rD - 0.6, rD - 0.6, HS + 1.6, HS + 7.4, 36, null);
    for (let k = 0; k < 36; k++){ const a = k/36*TAU; obox(B, DRF, Math.cos(a)*(rD - 0.45), Math.sin(a)*(rD - 0.45), Math.cos(a), Math.sin(a), 0.4, 0.35, HS + 1.6, HS + 7.4, true); }
    cylw(B, DRF, 0, 0, rD - 0.6, rD, HS + 4.3, HS + 4.7, 36, null);
    cylw(B, DRF, 0, 0, rD, rD - 2.5, HS + 7.4, HS + 9.0, 36, ROOF);
    cylw(B, {c:'#b9b6ad', m:0, lk:0.4}, 0, 0, 11.5, 11.5, HS + 9.0, HS + 13.6, 24, ROOF);
    // helipad: a round deck on struts with edge lights (no markings)
    cylw(B, PAD, 0, 0, 14.2, 14.2, HS + 14.4, HS + 15.2, 32, PAD);
    cylw(B, PADL, 0, 0, 14.25, 14.25, HS + 15.2, HS + 15.45, 32, null);
    for (let k = 0; k < 8; k++){ const a = k/8*TAU; LBeam(g, [Math.cos(a)*10.8, HS + 13.6, Math.sin(a)*10.8], [Math.cos(a)*13.6, HS + 14.4, Math.sin(a)*13.6], 0.35, '#8f9290', 6); }
    for (let k = 0; k < 4; k++){ const a = k/4*TAU + PI/4; obox(B, '#8f9290', Math.cos(a)*12.6, Math.sin(a)*12.6, 1, 0, 0.3, 0.3, HS + 15.2, 160); redLight(B, Math.cos(a)*12.6, 160, Math.sin(a)*12.6, 0.3); }
    // base
    ext(B, BASE, grow(ring(H), 1.2), -3, 0.8, null);
    for (const t of [-1, 1]){ const [x, z] = gmP(0, t*(H + 3.5)); obox(B, PIER, x, z, ux, uz, 14, 7, 5.2, 6.0); }
    B.flush(g);
    const bp = []; for (let k = 0; k < 4; k++){ const a = k/4*TAU + PI/4; bp.push(Math.cos(a)*12.6, 160.8, Math.sin(a)*12.6); }
    beacons(g, bp, [1, 0.18, 0.1], 8);
    return g;
  }};
SG_PLACES.push({type:'szguomao', lat:22.543207, lon:114.114661, rot:0});
