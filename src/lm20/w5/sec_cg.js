
// ======================================================================================================
// Chinese Garden (Yu Hwa Yuan, Prof. Yuen-chen Yu, 1975; Jurong Lake Gardens, renewed 2024): the garden island in Jurong
// Lake in Song-dynasty imperial style. Modelled: the seven-storey Cloud(-Piercing) Pagoda (Ru Yun Ta, 48 m, octagonal, after
// the Linggu Temple pagoda) on its terrace with the twelve zodiac figures; the Twin Pagodas by the lake (the broad Cloud
// Draping Tower and the slender Moon Receiving Tower, three storeys); the 13-arch White Rainbow Bridge (after the Summer
// Palace 17-arch bridge) from the green-roofed garden gate on the Lakeside Garden shore; the Grand Arch halls round their
// koi-pond courtyard; the Tea House pavilions and the Stone Boat on the lotus pond; the walled Suzhou-style Bonsai Garden
// with the Pavilion on the Rocks; the bronze Confucius statue; the island's paths (redrawn: the app hides paths under a
// landmark) and trees. Placement: rot 0, origin 40 m west of 1.33861 N, 103.72951 E (all plans in metres from that point,
// shifted by OX). The map ground is flat here (0.9 m; the lake surface 1.18 m). Night: floodlit pagodas, red lanterns.
// ======================================================================================================
{
const OX = -40, RR = 268, LAT = 1.33861, LON = 103.72951 + OX/111290.5;
const PATHS = [[-123.0,132.0,0,-140.5,106.0,0],[-140.5,106.0,0,-148.0,94.0,0],[-178.5,47.5,0,-146.0,51.0,0],[22.0,114.0,0,17.5,102.0,0],[-2.5,112.0,0,-11.5,92.5,0,-23.0,80.0,0],[2.5,64.5,0,-2.0,49.5,0],[16.5,61.5,0,19.5,95.0,0,17.5,102.0,0],[17.5,102.0,0,16.5,104.0,0,-2.5,112.0,0],[-2.5,112.0,0,-7.5,113.5,0],[-7.5,113.5,0,-20.0,113.0,0,-25.5,111.0,0],[-25.5,111.0,0,-55.5,92.0,0],[-55.5,92.0,0,-59.5,79.5,0,-56.5,55.5,0],[54.0,61.0,0,66.5,54.0,0],[66.5,54.0,0,85.0,42.5,0],[64.0,51.0,0,70.5,36.5,0],[70.5,36.5,0,59.0,21.0,0],[59.0,21.0,0,57.0,19.0,0],[70.5,36.5,0,81.5,35.5,0],[57.0,49.0,0,53.5,55.0,0,54.0,61.0,0],[54.0,61.0,0,55.5,74.5,0,62.0,92.5,0,65.0,93.0,0,72.5,85.5,0],[47.5,29.5,0,52.0,43.0,0,57.0,49.0,0],[57.0,49.0,0,64.0,51.0,0],[64.0,51.0,0,66.5,54.0,0],[66.5,54.0,0,80.5,78.0,0,86.0,69.0,0,86.5,48.0,0,85.0,42.5,0],[85.0,42.5,0,81.5,35.5,0],[81.5,35.5,0,80.5,23.5,0,76.5,15.5,0,69.0,15.0,0,59.0,21.0,0],[59.0,21.0,0,47.5,29.5,0],[47.5,29.5,0,39.0,32.5,0,40.5,40.5,0,39.0,46.5,0,29.5,54.0,0,16.5,61.5,0],[16.5,61.5,0,2.5,64.5,0],[2.5,64.5,0,-17.0,66.0,0],[-17.0,66.0,0,-38.0,61.5,0],[-38.0,61.5,0,-56.5,55.5,0],[-56.5,55.5,0,-65.5,52.0,0],[-65.5,52.0,0,-78.5,47.0,0],[54.0,15.5,0.0,49.5,8.0,0.0,47.0,3.5,0.2,43.0,-13.5,1.2,37.5,-16.0,1.6,20.5,-11.5,2.6],[20.5,-11.5,2.6,0.5,-12.0,1.4],[0.5,-12.0,1.4,-8.5,-13.0,1.0],[34.0,19.5,0.8,24.5,1.5,1.8],[24.5,1.5,1.8,20.5,-11.5,2.6],[20.5,-11.5,2.6,19.0,-28.5,3.6],[19.0,-28.5,3.6,19.5,-45.0,2.6,20.0,-61.5,1.6],[20.0,-61.5,1.6,20.5,-84.5,0.4],[20.5,-84.5,0.4,20.5,-92.5,0.0,20.5,-100.5,0.0,21.0,-116.5,0.0,23.0,-126.5,0.0,32.0,-149.0,0.0],[-4.5,40.5,0,-5.0,32.5,0,-1.5,15.5,0],[-37.0,19.5,0,-31.5,24.0,0,-19.0,24.5,0,-1.5,15.5,0],[-1.5,15.5,0.2,11.5,8.5,1.0,24.5,1.5,1.8],[-15.5,-5.5,0,-7.5,5.0,0],[-8.5,-13.0,0,-13.0,-7.5,0],[-12.0,-21.0,0,-9.0,-21.5,0,-8.5,-24.0,0],[-65.5,52.0,0,-62.0,40.5,0,-37.0,19.5,0],[-37.0,19.5,0,-19.0,4.0,0,-13.0,7.0,0,-7.5,5.0,0],[-7.5,5.0,0.4,-4.0,2.0,0.6,0.5,-12.0,1.4],[-17.0,66.0,0,-18.5,72.5,0,-23.0,80.0,0],[-23.0,80.0,0,-28.5,82.0,0,-34.0,80.5,0],[-34.0,80.5,0,-37.0,77.0,0,-38.0,61.5,0],[-25.5,111.0,0,-20.0,107.5,0,-14.0,108.5,0,-7.5,113.5,0],[-98.0,121.0,0,-121.5,116.0,0,-140.5,106.0,0],[-113.5,96.5,0,-109.0,99.0,0,-102.5,108.0,0,-93.5,107.0,0],[-93.5,107.0,0,-55.5,92.0,0],[-55.5,92.0,0,-34.0,80.5,0],[-107.5,72.5,0,-109.0,87.5,0,-113.5,96.5,0],[-113.5,96.5,0,-117.5,97.5,0,-137.0,94.0,0,-148.0,94.0,0],[-142.5,58.0,0,-138.5,59.0,0,-137.5,44.5,0,-141.5,44.0,0],[-119.5,-12.0,0,-99.5,-48.0,0],[-99.5,-48.0,0,-86.0,-71.0,0,-79.0,-77.5,0],[-79.0,-77.5,0,-17.0,-90.5,0],[-109.5,32.5,0,-116.0,-1.5,0,-119.5,-12.0,0],[-119.5,-12.0,0,-143.0,-26.5,0,-148.0,-27.0,0],[-165.5,105.0,0,-150.0,122.0,0,-134.0,130.5,0,-123.0,132.0,0],[-123.0,132.0,0,-107.0,131.0,0,-98.0,121.0,0],[-98.0,121.0,0,-93.5,107.0,0],[-104.5,44.5,0,-106.5,63.5,0],[-100.5,37.5,0,-95.0,30.5,0,-92.5,15.0,0,-93.0,-4.5,0,-99.5,-48.0,0],[-90.5,42.5,0,-100.5,37.5,0],[-100.5,37.5,0,-109.5,32.5,0],[-109.5,32.5,0,-133.0,31.0,0,-136.0,32.5,0,-141.0,36.5,0,-141.5,44.0,0,-145.0,43.5,0,-146.0,51.0,0],[-79.0,-77.5,0,-87.5,-91.5,0,-104.0,-108.0,0],[-104.0,-108.0,0,-120.0,-122.0,0],[-6.0,-28.5,0,2.0,-33.5,0,7.5,-45.5,0,7.5,-89.0,0],[20.5,-84.5,0.4,13.0,-87.0,0.0,7.5,-89.0,0.0],[7.5,-89.0,0,-5.0,-86.5,0],[7.0,-61.0,1.0,20.0,-61.5,1.6],[19.0,-28.5,3.6,38.0,-31.0,4.6,57.0,-33.5,5.6],[64.0,-143.0,0.0,73.5,-131.5,0.0,77.5,-127.0,0.4,83.0,-114.5,1.2,89.0,-102.0,1.8],[89.0,-102.0,1.8,89.5,-82.5,3.0,90.0,-63.5,4.0,91.0,-44.5,5.0],[91.0,-44.5,5.0,99.0,-30.0,4.2,102.5,-23.0,3.6,106.5,-15.5,3.2,115.5,-5.5,2.4,124.5,4.0,2.0],[124.5,4.0,2.0,140.0,15.0,0.8,151.0,17.5,0.2,153.0,17.0,0.2,155.5,16.5,0.0,175.5,14.5,0.0],[209.5,-82.5,0,161.5,-112.5,0],[161.5,-112.5,0,112.0,-137.5,0,64.0,-143.0,0],[64.0,-143.0,0,32.0,-149.0,0],[-104.0,-108.0,0,-130.5,-76.0,0,-136.0,-66.5,0,-148.0,-27.0,0],[89.0,-102.0,1.8,99.0,-98.5,1.2,108.5,-89.5,0.6,115.5,-82.5,0.0,117.5,-80.0,0.0,131.0,-70.0,0.0],[173.0,-105.0,0,164.5,-96.5,0,157.0,-106.0,0],[157.0,-106.0,0,137.5,-111.0,0,109.5,-128.5,0,104.5,-133.0,0,103.0,-138.5,0],[157.0,-106.0,0,161.5,-112.5,0],[168.0,-68.0,0,172.5,-62.0,0,168.0,-50.0,0,154.0,-48.0,0,146.0,-58.5,0,152.0,-71.5,0,164.5,-73.0,0,168.0,-68.0,0],[195.5,-91.0,0,175.0,-73.5,0],[81.0,-41.0,5.6,91.0,-44.5,5.0],[91.0,-44.5,5.0,105.5,-49.5,4.2,120.5,-55.0,3.2,123.0,-42.5,2.6,125.5,-30.0,1.8,134.0,-21.5,1.2,146.0,-17.5,0.6,155.0,-14.5,0.0,157.5,-13.5,0.0,164.5,-15.5,0.0,170.5,-23.5,0.0,175.5,-21.5,0.0,177.5,-18.5,0.0,177.0,-5.5,0.0,184.5,7.0,0.0],[124.5,4.0,2.0,106.0,8.5,3.0],[-143.0,66.0,0,-161.0,64.5,0,-162.5,67.5,0,-162.5,83.0,0,-160.0,85.0,0,-144.0,85.0,0,-142.5,83.5,0,-142.5,58.0,0,-146.5,58.0,0,-146.0,51.0,0],[-100.5,37.5,0,-104.5,44.5,0],[175.0,-73.5,0,168.0,-68.0,0],[148.5,-64.5,0,138.0,-69.0,0,131.0,-70.0,0,120.5,-55.0,0],[184.5,7.0,0,188.5,11.5,0],[170.5,-23.5,0,160.5,-49.0,0],[39.0,32.5,0,34.0,19.5,0],[57.0,19.0,0,54.0,15.5,0],[-2.0,49.5,0,-4.5,40.5,0],[-78.5,47.0,0,-90.5,42.5,0],[-106.5,63.5,0,-107.5,72.5,0],[-5.0,-86.5,0,-17.0,-90.5,0],[57.0,-33.5,5.6,69.0,-37.5,5.6,81.0,-41.0,5.6],[106.0,8.5,3.0,93.5,16.0,1.6,80.5,23.5,0.4],[72.5,85.5,0,80.5,78.0,0],[-120.0,-122.0,0,-125.0,-126.0,0]];
// 25 m water mask (Jurong Lake and the ponds), rows from z = MZ0 southwards, columns from x = MX0 eastwards (reference frame)
const MX0 = -322.06, MZ0 = -214.35, MASK = 'wwwwwwwwwwwwww....ww...|wwwwwwwwww.........w...|wwwwwwwww...........ww.|..wwwwww.............ww|....wwww......ww......w|....www....ww.ww.......|....www...www.ww.......|...www...wwww..w.......|...www...wwww...w......|...ww.....w.....w......|...ww............w.....|...ww....w.......ww....|...www...w......wwww...|.w.wwww........wwwwwww.|....wwww..wwwwwwwwwwwww|....wwwwwwwwwwwwwwwwwww|.....wwwwwwwwwww.....ww'.split('|');
const ISL = [[-125,-135],[-97,-150],[-75,-185],[10,-200],[115,-205],[150,-175],[172,-140],[182,-90],[186,-40],[182,20],[163,70],[138,108],[60,118],[-20,122],[-90,145],[-128,138],[-132,90],[-142,40],[-150,-20],[-140,-90]];
const wet = (x, z) => { const i = Math.floor((x - MX0)/25), j = Math.floor((z - MZ0)/25); return j >= 0 && j < MASK.length && i >= 0 && i < MASK[0].length && MASK[j][i] === 'w'; };
LANDMARKS.chinesegarden = {zh:'裕华园', en:'Chinese Garden (Jurong Lake Gardens)', cat:'old', r:RR, h:48, water:true, lt:{m:0, c:'#ffd69c', k:0.95, e:0.8, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB(), r = LMCTX.rng;
  const G = -0.6, WL = -0.32;                                 // map ground and lake level (local)
  const WALL = {c:'#efe6d1', m:0, lk:0.8}, RED = {c:'#a3332b', m:0, lk:0.6}, RG = {c:'#3f7550', m:0, lk:0.35}, RGR = {c:'#5d6266', m:0, lk:0.3}, GOLD = {c:'#c9a246', m:0, lc:'#ffe2a0', lk:1.2};
  const MARB = {c:'#ece9e1', m:0, lk:0.7}, STONE = {c:'#b3ada0', m:0, lk:0.3}, PATHC = {c:'#cfc6b2', m:0, lk:0.1}, WOOD = {c:'#5e3a2a', m:0, lk:0.2}, BRONZE = {c:'#5f4b33', m:0, lk:0.9};
  const LANT = {c:'#d8462d', glow:'#ff6a3a', gk:1.4}, DARK = {c:'#2d2622', glow:'#ffb565', gk:0.35}, LEAF = {c:'#4f7c41', m:0, lk:0}, LEAF2 = {c:'#5f8d4a', m:0, lk:0}, TRUNK = {c:'#5b4a3a', m:0, lk:0};
  const L = (x, z) => [x - OX, z];                              // reference frame -> local
  const solid = [];                                             // footprints kept free of trees
  // ---------- builders ----------
  // Chinese hip roof over an L x W rectangle (centre cx, cz, turned ry) from the eave at y up h to the ridge; ov overhang, lift corner upturn
  const hipR = (col, cx, cz, Lr, Wr, y, h, ry, ov, lift, ridgeCol) => {
    const o = B.p(col), c = Math.cos(ry || 0), s = Math.sin(ry || 0), R = (x, yy, z) => [cx + x*c + z*s, yy, cz - x*s + z*c];
    const hl0 = Lr/2 + ov, hw0 = Wr/2 + ov, kk = Math.max(0, hl0 - hw0), n = 6, nt = 5;
    const ring = (u, dy) => { const a = hl0 + (kk - hl0)*u, b = hw0*(1 - u), yy = y + h*Math.pow(u, 1.7) + dy, lu = lift*Math.pow(1 - u, 2), P = [], C = [[-a, -b], [a, -b], [a, b], [-a, b]];
      for (let q = 0; q < 4; q++){ const A = C[q], Bc = C[(q+1) % 4]; for (let i = 0; i < n; i++){ const t = i/n, cc = Math.pow(Math.abs(2*t - 1), 4); P.push(R((A[0] + (Bc[0]-A[0])*t)*(1 + 0.03*cc*(1 - u)), yy + lu*cc, (A[1] + (Bc[1]-A[1])*t)*(1 + 0.03*cc*(1 - u)))); } }
      return P; };
    let prev = ring(0, -0.45), cur = ring(0, 0);
    for (let i = 0; i < prev.length; i++){ const j = (i+1) % prev.length; quadP(o, prev[i], prev[j], cur[j], cur[i]); }
    prev = cur;
    for (let k = 1; k <= nt; k++){ cur = ring(k/nt, 0); for (let i = 0; i < prev.length; i++){ const j = (i+1) % prev.length; quadP(o, prev[i], prev[j], cur[j], cur[i]); } prev = cur; }
    if (kk > 0.3) segP(B.p(ridgeCol || col), R(-kk - 0.4, y + h + 0.15, 0), R(kk + 0.4, y + h + 0.15, 0), 0.32, 4);
  };
  // octagonal concave roof ring from radius R0 (eave, at y) to R1 (at y + h); lift = corner upturn
  const OCT = k => k/8*TAU + PI/8;
  const octR = (col, cx, cz, R0, R1, y, h, lift) => {
    const o = B.p(col), n = 5, nt = 4;
    const ring = (u, dy) => { const rr = R0 + (R1 - R0)*Math.pow(u, 0.75), yy = y + h*Math.pow(u, 1.6) + dy, lu = lift*Math.pow(1 - u, 2), P = [];
      for (let k = 0; k < 8; k++){ const a0 = OCT(k), a1 = OCT(k+1); for (let i = 0; i < n; i++){ const t = i/n, cc = Math.pow(Math.abs(2*t - 1), 4), f = 1 + 0.05*cc*(1 - u);
        const x = (Math.cos(a0) + (Math.cos(a1) - Math.cos(a0))*t)*rr*f, z = (Math.sin(a0) + (Math.sin(a1) - Math.sin(a0))*t)*rr*f; P.push([cx + x, yy + lu*cc, cz + z]); } }
      return P; };
    let prev = ring(0, -0.4), cur = ring(0, 0);
    for (let i = 0; i < prev.length; i++){ const j = (i+1) % prev.length; quadP(o, prev[i], prev[j], cur[j], cur[i]); }
    prev = cur;
    for (let k = 1; k <= nt; k++){ cur = ring(k/nt, 0); for (let i = 0; i < prev.length; i++){ const j = (i+1) % prev.length; quadP(o, prev[i], prev[j], cur[j], cur[i]); } prev = cur; }
  };
  const octPts = (cx, cz, rr) => { const P = []; for (let k = 0; k < 8; k++) P.push([cx + Math.cos(OCT(k))*rr, cz + Math.sin(OCT(k))*rr]); return P; };
  // octagonal storey: cream walls, red corner columns, a red door / window panel on each face
  const octStorey = (cx, cz, rr, y0, hh, open) => {
    const P = octPts(cx, cz, rr); wallP(B.p(WALL), P, y0, y0 + hh);
    for (let k = 0; k < 8; k++){ const a = P[k], b = P[(k+1) % 8], mx = (a[0]+b[0])/2, mz = (a[1]+b[1])/2, nx = Math.cos((OCT(k)+OCT(k+1))/2), nz = Math.sin((OCT(k)+OCT(k+1))/2);
      segP(B.p(RED), [a[0], y0, a[1]], [a[0], y0 + hh, a[1]], 0.28 + rr*0.012, 6);
      const w = Math.hypot(b[0]-a[0], b[1]-a[1])*0.3, tx = (b[0]-a[0])/Math.hypot(b[0]-a[0], b[1]-a[1]), tz = (b[1]-a[1])/Math.hypot(b[0]-a[0], b[1]-a[1]), h0 = y0 + (open ? 0.1 : hh*0.25), h1 = y0 + hh*0.8;
      quadP(B.p(RED), [mx - tx*w + nx*0.06, h0, mz - tz*w + nz*0.06], [mx + tx*w + nx*0.06, h0, mz + tz*w + nz*0.06], [mx + tx*w + nx*0.06, h1, mz + tz*w + nz*0.06], [mx - tx*w + nx*0.06, h1, mz - tz*w + nz*0.06]);
      quadP(B.p(DARK), [mx - tx*w*0.7 + nx*0.1, h0 + 0.3, mz - tz*w*0.7 + nz*0.1], [mx + tx*w*0.7 + nx*0.1, h0 + 0.3, mz + tz*w*0.7 + nz*0.1], [mx + tx*w*0.7 + nx*0.1, h1 - 0.3, mz + tz*w*0.7 + nz*0.1], [mx - tx*w*0.7 + nx*0.1, h1 - 0.3, mz - tz*w*0.7 + nz*0.1]);
    }
    edgeBands(B.p(RED), P, y0 + hh - 0.7, y0 + hh, 0.12);
  };
  // balcony railing round an octagon of radius rr at y
  const octRail = (cx, cz, rr, y) => { const P = octPts(cx, cz, rr), o = B.p(RED); for (let k = 0; k < 8; k++){ const a = P[k], b = P[(k+1) % 8]; segP(o, [a[0], y + 1.0, a[1]], [b[0], y + 1.0, b[1]], 0.07, 4);
      for (let t = 0; t <= 1.001; t += 0.25){ const x = a[0] + (b[0]-a[0])*t, z = a[1] + (b[1]-a[1])*t; segP(o, [x, y, z], [x, y + 1.0, z], 0.05, 3); } } flatPoly(B.p(STONE), P, y); };
  // a pagoda: storeys of radius rb(k) and height hs(k) on a base at y0, eaves, balconies, a top roof and a gilded finial
  const pagoda = (cx, cz, y0, ns, rb, hs, eav, topH, fin) => {
    let y = y0;
    for (let k = 0; k < ns; k++){
      const rr = rb(k), hh = hs(k);
      if (k > 0) octRail(cx, cz, rr + 1.1, y);
      octStorey(cx, cz, rr, y, hh, k === 0); y += hh;
      flatPoly(B.p(STONE), octPts(cx, cz, rr + 0.4), y - 0.05);
      // bracket band and the eave
      wallP(B.p(RED), octPts(cx, cz, rr + 0.25), y, y + 0.55);
      if (k < ns - 1){ octR(RG, cx, cz, rr + eav, rb(k+1) + 0.2, y + 0.55, 1.5 + rr*0.06, 0.75 + rr*0.05);
        for (let q = 0; q < 8; q++){ const a = OCT(q), d = (rr + eav)*1.02; boxP(B.p(LANT), 0.42, 0.6, 0.42, cx + Math.cos(a)*d, y + 0.55 + 0.75 + rr*0.05 - 1.1, cz + Math.sin(a)*d, a); } }
      y += 0.55 + (k < ns - 1 ? 0.7 : 0);
    }
    octR(RG, cx, cz, rb(ns - 1) + eav, 0.25, y, topH, 0.9);
    const yt = y + topH, f = fin/6.2; LLathe(g, [[0, 0], [0.9, 0], [1.0, 0.5], [0.55, 1.0], [0.5, 1.6], [1.1, 2.1], [0.6, 2.7], [0.35, 3.2], [0.8, 3.6], [0.3, 4.1], [0.15, 5.6], [0.32, 5.85], [0.0, 6.2]].map(q => [q[0]*Math.sqrt(f), q[1]*f]), cx, yt - 0.3, cz, GOLD, 8);
    return yt + fin;
  };
  // rectangular hall: walls with red columns, a dark door band at the front, hip roof (double eave if dbl)
  const hall = (cx, cz, Lh, Wh, ry, y0, hh, roofC, dbl, base) => {
    const c = Math.cos(ry), s = Math.sin(ry), R = (x, z) => [cx + x*c + z*s, cz - x*s + z*c];
    const P = [R(-Lh/2, -Wh/2), R(Lh/2, -Wh/2), R(Lh/2, Wh/2), R(-Lh/2, Wh/2)]; solid.push(P.map(p => [p[0], p[1]]));
    if (base){ const PB = [R(-Lh/2 - base, -Wh/2 - base), R(Lh/2 + base, -Wh/2 - base), R(Lh/2 + base, Wh/2 + base), R(-Lh/2 - base, Wh/2 + base)]; prismP(B.p(STONE), B.p(STONE), PB, G - 0.3, y0); }
    prismP(B.p(WALL), B.p(WALL), P, y0, y0 + hh);
    const nc = Math.max(2, Math.round(Lh/3.6));
    for (let i = 0; i <= nc; i++){ const x = -Lh/2 + Lh*i/nc; for (const zz of [-Wh/2 - 0.35, Wh/2 + 0.35]){ const p = R(x, zz); segP(B.p(RED), [p[0], y0, p[1]], [p[0], y0 + hh, p[1]], 0.26, 6); } }
    for (const zz of [-Wh/2 - 0.05, Wh/2 + 0.05]){ const a = R(-Lh/2 + 0.6, zz), b = R(Lh/2 - 0.6, zz); quadP(B.p(DARK), [a[0], y0 + 0.2, a[1]], [b[0], y0 + 0.2, b[1]], [b[0], y0 + hh*0.72, b[1]], [a[0], y0 + hh*0.72, a[1]]);
      quadP(B.p(RED), [a[0], y0 + hh*0.72, a[1]], [b[0], y0 + hh*0.72, b[1]], [b[0], y0 + hh, b[1]], [a[0], y0 + hh, a[1]]); }
    if (dbl){ hipR(roofC, cx, cz, Lh + 0.6, Wh + 0.6, y0 + hh, 1.4, ry, 1.6, 0.5); const y2 = y0 + hh + 1.6; prismP(B.p(RED), B.p(WALL), [R(-Lh/2 + 1.5, -Wh/2 + 1.5), R(Lh/2 - 1.5, -Wh/2 + 1.5), R(Lh/2 - 1.5, Wh/2 - 1.5), R(-Lh/2 + 1.5, Wh/2 - 1.5)], y0 + hh, y2 + 1.4);
      hipR(roofC, cx, cz, Lh - 2.4, Wh - 2.4, y2 + 1.4, Math.min(Wh*0.32, 4.6), ry, 1.4, 0.6); }
    else hipR(roofC, cx, cz, Lh, Wh, y0 + hh, Math.min(Wh*0.36, 4.2), ry, 1.3, 0.55);
  };
  // small open pavilion (hexagonal / square) with a pointed roof
  const kiosk = (cx, cz, rr, y0, n) => { const P = []; for (let k = 0; k < n; k++){ const a = k/n*TAU; P.push([cx + Math.cos(a)*rr, cz + Math.sin(a)*rr]); } flatPoly(B.p(STONE), P, y0 + 0.4); wallP(B.p(STONE), P, G, y0 + 0.4); solid.push(P);
    for (const p of P) segP(B.p(RED), [p[0]*0.88 + cx*0.12, y0 + 0.4, p[1]*0.88 + cz*0.12], [p[0]*0.88 + cx*0.12, y0 + 3.6, p[1]*0.88 + cz*0.12], 0.17, 6);
    const o = B.p(RG), top = [cx, y0 + 3.6 + rr*0.75, cz]; for (let k = 0; k < n; k++){ const a = P[k], b = P[(k+1) % n], A = [cx + (a[0]-cx)*1.35, y0 + 3.5 + 0.35, cz + (a[1]-cz)*1.35], Bq = [cx + (b[0]-cx)*1.35, y0 + 3.5 + 0.35, cz + (b[1]-cz)*1.35], m = [(A[0]+Bq[0])/2*0.97 + cx*0.03, y0 + 3.5, (A[2]+Bq[2])/2*0.97 + cz*0.03]; triP(o, A, m, top); triP(o, m, Bq, top); }
    LCone(g, 0.25, 1.0, top[0], top[1] - 0.1, top[2], GOLD, 6); };
  const lantern = (x, y, z) => { boxP(B.p(LANT), 0.55, 0.75, 0.55, x, y, z, 0); };

  // ---------- the Cloud Pagoda on its terrace ----------
  { const C = L(159.5, -60.5), y0 = G + 3.9, T = octPts(C[0], C[1], 16);
    prismP(B.p(MARB), B.p(STONE), T, G - 0.4, y0); edgeBands(B.p(STONE), T, y0 - 0.5, y0 - 0.2, 0.15); solid.push(octPts(C[0], C[1], 19));
    // balustrade and four flights of steps
    { const o = B.p(MARB); for (let k = 0; k < 8; k++){ const a = T[k], b = T[(k+1) % 8]; segP(o, [a[0], y0 + 0.9, a[1]], [b[0], y0 + 0.9, b[1]], 0.12, 4); for (let t = 0; t < 1; t += 0.125){ const x = a[0] + (b[0]-a[0])*t, z = a[1] + (b[1]-a[1])*t; boxP(o, 0.3, 1.0, 0.3, x, y0, z, 0); } } }
    for (let k = 0; k < 4; k++){ const a = k*HP, dx = Math.cos(a), dz = Math.sin(a); for (let st = 0; st < 9; st++){ const d = 15.2 + st*0.75; boxP(B.p(MARB), Math.abs(dx) > 0.5 ? 0.8 : 7, y0 - G - st*0.43, Math.abs(dx) > 0.5 ? 7 : 0.8, C[0] + dx*d, G - 0.2, C[1] + dz*d, 0); } }
    pagoda(C[0], C[1], y0, 7, k => 7.3 - 0.42*k, k => k === 0 ? 6.2 : 3.9, 2.7, 3.0, 4.6);
    // the twelve zodiac figures round the terrace
    for (let k = 0; k < 12; k++){ const a = k/12*TAU + 0.13, x = C[0] + Math.cos(a)*22, z = C[1] + Math.sin(a)*22; boxP(B.p(STONE), 1.3, 1.1, 1.3, x, G, z, a); ico(B.p(BRONZE), [x, G + 2.0, z], 0.65, 0.95); }
    for (let k = 0; k < 8; k++){ const a = OCT(k) - PI/8; lantern(C[0] + Math.cos(a)*15.5, y0 + 1.1, C[1] + Math.sin(a)*15.5); } }

  // ---------- the Twin Pagodas by the lake (on a stone terrace at the water's edge) ----------
  { const T1 = L(-133, -110), T2 = L(-112, -123);
    const TER = [L(-148, -100), L(-120, -96), L(-96, -114), L(-104, -136), L(-130, -134), L(-150, -118)]; prismP(B.p(STONE), B.p(STONE), TER, G - 1.2, G + 1.0); solid.push(TER);
    { const o = B.p(MARB); for (let k = 0; k < TER.length; k++){ const a = TER[k], b = TER[(k+1) % TER.length]; segP(o, [a[0], G + 1.9, a[1]], [b[0], G + 1.9, b[1]], 0.1, 4); for (let t = 0; t < 1; t += 0.2){ boxP(o, 0.25, 0.9, 0.25, a[0] + (b[0]-a[0])*t, G + 1.0, a[1] + (b[1]-a[1])*t, 0); } } }
    pagoda(T1[0], T1[1], G + 1.0, 3, k => 5.2 - 0.6*k, k => k === 0 ? 4.8 : 3.9, 2.3, 2.8, 3.4);       // Cloud Draping Tower (broad)
    pagoda(T2[0], T2[1], G + 1.0, 3, k => 3.5 - 0.35*k, k => k === 0 ? 4.8 : 4.0, 1.9, 2.6, 3.0);      // Moon Receiving Tower (slender)
    for (const p of TER) lantern(p[0], G + 1.9, p[1]); }

  // ---------- the White Rainbow Bridge (13 arches) and the garden gate on the Lakeside Garden shore ----------
  { const A0 = L(-255, 41), A1 = L(-123, 132), LEN = Math.hypot(A1[0]-A0[0], A1[1]-A0[1]), ux = (A1[0]-A0[0])/LEN, uz = (A1[1]-A0[1])/LEN, nx = -uz, nz = ux;
    const S0 = 4, S1 = LEN - 6, W = 7.2, NA = 13, SW0 = 24, SW1 = 128;           // deck ends, width, arches between SW0..SW1 (over the water)
    const deck = s => G + 0.25 + 4.9*Math.pow(Math.sin(PI*clamp01((s - S0)/(S1 - S0))), 0.8);
    const P3 = (s, w, y) => [A0[0] + ux*s + nx*w, y, A0[1] + uz*s + nz*w];
    const mb = B.p(MARB), st = B.p(STONE);
    // arch layout: spans grow towards the middle
    const wts = []; for (let i = 0; i < NA; i++) wts.push(1 + 0.45*Math.sin(PI*(i + 0.5)/NA)); const tw = wts.reduce((a, b) => a + b, 0);
    const piers = [SW0]; for (let i = 0; i < NA; i++) piers.push(piers[i] + (SW1 - SW0)*wts[i]/tw);
    const pw = 1.6;                                                                                  // pier width
    // deck slab, parapets (white balustrades), approach ramps down to the ground
    for (let s = S0; s < S1 - 0.01; s += 2){ const s2 = Math.min(S1, s + 2), y1 = deck(s), y2 = deck(s2);
      quadP(mb, P3(s, -W/2, y1), P3(s2, -W/2, y2), P3(s2, W/2, y2), P3(s, W/2, y1));
      for (const w of [-W/2 - 0.1, W/2 + 0.1]){ quadP(mb, P3(s, w, y1 + 1.05), P3(s2, w, y2 + 1.05), P3(s2, w, y2 + 1.3), P3(s, w, y1 + 1.3)); boxP(mb, 0.32, 1.25, 0.32, P3(s, w, 0)[0], y1, P3(s, w, 0)[2], 0); }
      // outside the arch run the bridge is a solid embankment
      if (s < SW0 || s2 > SW1) for (const w of [-W/2, W/2]) quadP(mb, P3(s, w, WL - 1), P3(s2, w, WL - 1), P3(s2, w, y2), P3(s, w, y1));
    }
    // spandrel walls with the arch openings, arch vaults and the piers with cutwaters
    for (let i = 0; i < NA; i++){
      const a = piers[i] + pw/2, b = piers[i+1] - pw/2, c = (a + b)/2, ra = (b - a)/2, ys = WL + 0.2, n = 10;
      const ytop = sd => deck(sd) - 0.05;
      for (const w of [-W/2, W/2]){ const o = mb;
        for (let k = 0; k < n; k++){ const t0 = PI - PI*k/n, t1 = PI - PI*(k+1)/n, s0 = c + Math.cos(t0)*ra, s1 = c + Math.cos(t1)*ra, h0 = ys + Math.sin(t0)*ra*1.05, h1 = ys + Math.sin(t1)*ra*1.05;
          quadP(o, P3(s0, w, h0), P3(s1, w, h1), P3(s1, w, ytop(s1)), P3(s0, w, ytop(s0)));
          quadP(st, P3(s0, -W/2, h0), P3(s1, -W/2, h1), P3(s1, W/2, h1), P3(s0, W/2, h0)); } }
      // the arch ring (voussoirs) picked out
      { const R1 = []; for (let k = 0; k <= n; k++){ const t = PI - PI*k/n; R1.push([c + Math.cos(t)*(ra + 0.25), ys + Math.sin(t)*(ra + 0.25)*1.05]); } for (const w of [-W/2 - 0.08, W/2 + 0.08]) polyP(st, R1.map(q => P3(q[0], w, q[1])), 0.18, 4); }
    }
    for (let i = 0; i <= NA; i++){ const s = piers[i], y = deck(s); for (const w of [-W/2, W/2]){ quadP(mb, P3(s - pw/2, w, WL - 1), P3(s + pw/2, w, WL - 1), P3(s + pw/2, w, y), P3(s - pw/2, w, y)); }
      quadP(mb, P3(s - pw/2, -W/2, WL - 1), P3(s - pw/2, W/2, WL - 1), P3(s - pw/2, W/2, WL + 0.2), P3(s - pw/2, -W/2, WL + 0.2)); quadP(mb, P3(s + pw/2, -W/2, WL - 1), P3(s + pw/2, W/2, WL - 1), P3(s + pw/2, W/2, WL + 0.2), P3(s + pw/2, -W/2, WL + 0.2));
      for (const sg of [-1, 1]) triP(st, P3(s - pw/2, sg*W/2, WL + 0.6), P3(s + pw/2, sg*W/2, WL + 0.6), P3(s, sg*(W/2 + 1.4), WL + 0.6)); }
    // lanterns on the newel posts at both ends and the crown
    for (const s of [S0 + 1, S1 - 1, (S0 + S1)/2]) for (const w of [-W/2 - 0.1, W/2 + 0.1]){ const p = P3(s, w, 0); boxP(mb, 0.6, 1.8, 0.6, p[0], deck(s), p[2], 0); lantern(p[0], deck(s) + 1.8, p[2]); }
    // the garden gate at the shore end: three arched openings, red walls, a green-tiled hip roof, a pair of lions
    { const gc = P3(-8, 0, 0), ry = Math.atan2(-nz, nx), Lg = 17, Wg = 5.5, hg = 6.2, c = Math.cos(ry), s = Math.sin(ry), R = (x, z) => [gc[0] + x*c + z*s, gc[2] - x*s + z*c];
      const P = [R(-Lg/2, -Wg/2), R(Lg/2, -Wg/2), R(Lg/2, Wg/2), R(-Lg/2, Wg/2)]; prismP(B.p(RED), B.p(RED), P, G - 0.3, G + hg); solid.push(P);
      for (const zz of [-Wg/2 - 0.06, Wg/2 + 0.06]) for (const [x, w, h] of [[-5.2, 2.4, 3.4], [0, 3.4, 4.4], [5.2, 2.4, 3.4]]){ const o = B.p(DARK), n = 6, pts = [];
        for (let k = 0; k <= n; k++){ const t = PI - PI*k/n; pts.push([x + Math.cos(t)*w/2, G + h - w/2 + Math.sin(t)*w/2]); }
        for (let k = 0; k < n; k++){ const a = R(pts[k][0], zz), b = R(pts[k+1][0], zz); quadP(o, [a[0], G, a[1]], [b[0], G, b[1]], [b[0], pts[k+1][1], b[1]], [a[0], pts[k][1], a[1]]); } }
      edgeBands(B.p(WALL), P, G + hg - 1.1, G + hg - 0.4, 0.1);
      hipR(RG, gc[0], gc[2], Lg, Wg, G + hg, 2.6, ry, 1.5, 0.6);
      for (const sg of [-1, 1]){ const p = R(sg*4.0, Wg/2 + 3.5); boxP(B.p(STONE), 1.3, 1.4, 2.0, p[0], G, p[1], ry); ico(B.p(MARB), [p[0], G + 2.3, p[1]], 0.75, 1.0); }
      lantern(R(-Lg/2, Wg/2 + 0.6)[0], G + 4, R(-Lg/2, Wg/2 + 0.6)[1]); lantern(R(Lg/2, Wg/2 + 0.6)[0], G + 4, R(Lg/2, Wg/2 + 0.6)[1]); } }

  // ---------- the Grand Arch halls round the koi-pond courtyard (facing the bridge, south) ----------
  { const ry = -0.03;
    hall(...L(-134, 58.5), 40, 11, ry, G + 1.6, 6.0, RG, true, 1.6);          // the arch hall (front, with the gateway)
    hall(...L(-147, 47), 9, 13, ry, G + 0.9, 4.2, RG, false, 0.8);
    hall(...L(-121, 47), 9, 11, ry, G + 0.9, 4.2, RG, false, 0.8);
    hall(...L(-134, 41.5), 22, 6, ry, G + 0.9, 4.2, RG, false, 0.8);
    flatPoly(B.p(STONE), [L(-142, 44), L(-126, 44), L(-126, 52), L(-142, 52)], G + 0.25);
    // the broad flights of steps towards the bridge
    for (let st = 0; st < 6; st++) boxP(B.p(MARB), 30, 1.6 - st*0.27, 1.0, ...[L(-134, 66.5 + st)[0], G, L(-134, 66.5 + st)[1]], ry);
    // the gateway arch in the front hall: a tall dark opening and a raised roof over it
    { const p = L(-134, 64.2); quadP(B.p(DARK), [p[0] - 2.6, G + 1.6, p[1]], [p[0] + 2.6, G + 1.6, p[1]], [p[0] + 2.6, G + 6.4, p[1]], [p[0] - 2.6, G + 6.4, p[1]]); }
    for (const x of [-152, -116]) lantern(...[L(x, 65)[0], G + 4.5, L(x, 65)[1]]); }

  // ---------- Tea House pavilions and the Stone Boat on the lotus pond ----------
  { hall(...L(-12.9, -16.2), 9.6, 6, 1.48, G + 0.5, 3.6, RG, false, 0.5);
    hall(...L(-8.3, -29.9), 11.5, 4.8, 1.42, G + 0.5, 3.4, RG, false, 0.5);
    hall(...L(-10.5, -4), 14, 5.5, -0.87, G + 0.5, 3.6, RG, false, 0.5);
    hall(...L(-21.5, 1.5), 9, 5, 0.7, G + 0.5, 3.4, RG, false, 0.5);
    // the pavilion hall on the west bank of the pond (two wings)
    hall(...L(-79, -57), 21, 12, 0.91, G + 0.6, 4.4, RG, true, 0.8);
    hall(...L(-72, -38), 20, 7.5, -0.66, G + 0.6, 4.0, RG, false, 0.8);
    // the Stone Boat: a marble hull in the pond with a two-storey pavilion on its deck
    { const C = L(-46, -38), ry = 1.25, c = Math.cos(ry), s = Math.sin(ry), R = (x, z) => [C[0] + x*c + z*s, C[1] - x*s + z*c];
      const hull2 = []; for (let k = 0; k <= 12; k++){ const t = k/12, x = -12 + 24*t, w = 3.2*Math.pow(Math.sin(PI*Math.min(1, t*1.15 + 0.02)), 0.5); hull2.push([x, w]); }
      const P = [...hull2.map(q => R(q[0], q[1])), ...hull2.slice().reverse().map(q => R(q[0], -q[1]))].filter(p => !isNaN(p[0]));
      prismP(B.p(MARB), B.p(STONE), P, WL - 0.6, WL + 1.3); solid.push(P);
      hall(...R(-1.5, 0), 11, 4.4, ry, WL + 1.3, 3.2, RG, true, 0); } }

  // ---------- the Bonsai Garden: white walls with grey tile copings, halls, the Pavilion on the Rocks ----------
  { const W = [[90.3,38.4],[93,43.7],[97.2,66.8],[94.5,90.3],[62,115.5],[36.3,58.2],[48,47.9],[48.3,43.1],[43.8,31],[28.9,-0.5],[25.3,-12.6],[24.1,-25.1],[59,-31.6],[76,6.9]].map(p => L(p[0], p[1]));
    for (let i = 0; i < W.length; i++){ const a = W[i], b = W[(i+1) % W.length], Lw = Math.hypot(b[0]-a[0], b[1]-a[1]); if (Lw < 1) continue; const ry = Math.atan2(-(b[1]-a[1]), b[0]-a[0]);
      boxP(B.p(WALL), Lw, 2.6, 0.45, (a[0]+b[0])/2, G, (a[1]+b[1])/2, ry); boxP(B.p(RGR), Lw + 0.4, 0.35, 1.1, (a[0]+b[0])/2, G + 2.6, (a[1]+b[1])/2, ry); }
    // moon gate on the west wall
    hall(...L(79.3, 63.3), 11, 8, -1.19, G + 0.6, 4.0, RGR, false, 0.6);
    hall(...L(89.5, 42.2), 6, 5, -1.15, G + 0.4, 3.2, RGR, false, 0.4);
    hall(...L(52.1, -28.3), 9, 6, 0.23, G + 0.4, 3.4, RGR, false, 0.4);
    hall(...L(66, 98), 10, 6, 0.65, G + 0.4, 3.4, RGR, false, 0.4);
    // the rocky crag with its pavilion and the cave
    { const C = L(52, 22), o = B.p(STONE); for (let k = 0; k < 7; k++){ const a = k/7*TAU, d = 3 + r()*2; ico(o, [C[0] + Math.cos(a)*d, G + 1.6 + r(), C[1] + Math.sin(a)*d], 3.2 + r(), 2.6); } ico(o, [C[0], G + 3.4, C[1]], 4.2, 3.4); solid.push(octPts(C[0], C[1], 8));
      kiosk(C[0], C[1], 2.4, G + 5.6, 6); }
    // potted bonsai on low stands along the courtyards
    for (let k = 0; k < 40; k++){ const x = 30 + r()*65, z = -20 + r()*120, q = L(x, z); if (!pip(W, q[0], q[1]) || solid.some(P => pip(P, q[0], q[1]))) continue; boxP(B.p(STONE), 0.8, 0.7, 0.8, q[0], G, q[1], 0); ico(B.p(LEAF), [q[0], G + 1.3, q[1]], 0.7, 0.4); } }

  // ---------- the Confucius statue ----------
  { const C = L(-64, 38.7); boxP(B.p(STONE), 4, 2.4, 4, C[0], G, C[1], 0.4); boxP(B.p(STONE), 3.2, 0.5, 3.2, C[0], G + 2.4, C[1], 0.4); solid.push(octPts(C[0], C[1], 4));
    LLathe(g, [[0, 0], [1.35, 0], [1.2, 1.8], [1.0, 3.6], [1.15, 4.6], [0.95, 5.4], [0.5, 5.75], [0.3, 6.0], [0, 6.0]], C[0], G + 2.9, C[1], BRONZE, 10);
    LSph(g, 0.62, C[0], G + 9.6, C[1], BRONZE, 1.1, 10); LCyl(g, 0.5, 0.45, 0.5, C[0], G + 10.1, C[1], BRONZE, 8);
    boxP(B.p(BRONZE), 1.4, 1.0, 0.8, C[0] + 0.3, G + 6.6, C[1] + 0.5, 0.4); }

  // ---------- other pavilions and halls of the garden ----------
  hall(...L(65.3, -156.1), 18, 11, -0.19, G + 0.6, 4.2, RG, false, 0.8);
  kiosk(...L(10, -118), 3.2, G + 0.2, 8); kiosk(...L(118, -30), 2.6, G + 0.2, 6); kiosk(...L(-95, 112), 2.8, G + 0.2, 6); kiosk(...L(150, 0), 2.6, G + 0.2, 4);

  // ---------- the island's paths (redrawn, [x, z, bridge height] per vertex), footbridges, lanterns along them ----------
  { const o = B.p(PATHC); let cnt = 0;
    for (const F of PATHS){ const Q = []; for (let i = 0; i < F.length; i += 3) Q.push([F[i] - OX, F[i+1], Math.min(F[i+2], 1.3)]);
      for (let i = 0; i < Q.length - 1; i++){ const a = Q[i], b = Q[i+1], Lp = Math.hypot(b[0]-a[0], b[1]-a[1]); if (Lp < 0.3) continue; const nx = -(b[1]-a[1])/Lp*1.4, nz = (b[0]-a[0])/Lp*1.4;
        const ya = G + 0.07 + a[2], yb = G + 0.07 + b[2], br = a[2] > 0.15 || b[2] > 0.15;
        quadP(br ? B.p(MARB) : o, [a[0] - nx, ya, a[1] - nz], [a[0] + nx, ya, a[1] + nz], [b[0] + nx, yb, b[1] + nz], [b[0] - nx, yb, b[1] - nz]);
        if (br){ for (const sg of [-1, 1]){ segP(B.p(RED), [a[0] + nx*sg, ya + 0.95, a[1] + nz*sg], [b[0] + nx*sg, yb + 0.95, b[1] + nz*sg], 0.06, 4);
            for (let t = 0; t <= Lp; t += 2.5){ const f = t/Lp, x = a[0] + (b[0]-a[0])*f + nx*sg, z = a[1] + (b[1]-a[1])*f + nz*sg, y = ya + (yb - ya)*f; segP(B.p(RED), [x, Math.min(y, WL), z], [x, y + 0.95, z], 0.06, 4); } }
          quadP(B.p(STONE), [a[0] - nx, ya - 0.35, a[1] - nz], [b[0] - nx, yb - 0.35, b[1] - nz], [b[0] - nx, yb, b[1] - nz], [a[0] - nx, ya, a[1] - nz]);
          quadP(B.p(STONE), [a[0] + nx, ya - 0.35, a[1] + nz], [b[0] + nx, yb - 0.35, b[1] + nz], [b[0] + nx, yb, b[1] + nz], [a[0] + nx, ya, a[1] + nz]); }
        if (!br && Lp > 18 && (cnt++ % 3) === 0){ const x = (a[0]+b[0])/2 + nx*1.6, z = (a[1]+b[1])/2 + nz*1.6; segP(B.p(WOOD), [x, G, z], [x, G + 2.4, z], 0.06, 4); lantern(x, G + 2.4, z); } } } }

  // ---------- trees on the island (not in the water, on paths or in buildings) ----------
  { const segs = []; for (const F of PATHS) for (let i = 0; i < F.length - 3; i += 3) segs.push([F[i] - OX, F[i+1], F[i+3] - OX, F[i+4]]);
    const nearPath = (x, z, d) => segs.some(sg => { const ax = sg[2]-sg[0], az = sg[3]-sg[1], l2 = ax*ax + az*az || 1, t = clamp01(((x-sg[0])*ax + (z-sg[1])*az)/l2), px = sg[0] + ax*t - x, pz = sg[1] + az*t - z; return px*px + pz*pz < d*d; });
    for (let k = 0; k < 900; k++){
      const x = -150 + r()*340, z = -205 + r()*340; if (!pip(ISL, x, z) || wet(x, z) || wet(x + 6, z) || wet(x - 6, z) || wet(x, z + 6) || wet(x, z - 6)) continue;
      const q = L(x, z); if (solid.some(P => pip(P, q[0], q[1])) || nearPath(q[0], q[1], 3.2) || Math.hypot(x - 159.5, z + 60.5) < 26 || (x < -110 && z > 30 && z < 75)) continue;
      treeP(B, q[0], G, q[1], 0.9 + r()*0.8, r, TRUNK, r() < 0.5 ? LEAF : LEAF2); } }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'chinesegarden', lat:LAT, lon:LON, rot:0});
}
