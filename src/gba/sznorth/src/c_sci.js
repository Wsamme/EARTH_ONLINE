
// ---------------- plan clipping: region of polygon P with x >= c (handles several crossings) ----------------
function clipX(P, c){   // -> {tris:[[a,b,c]...], edges:[[a,b]...], cuts:[[z0,z1]...]} in [x, z]
  const tris = [], edges = [], cuts = [], xs = [];
  for (const t of triang(P)){ let poly = t.map(k => P[k]); const out = [];
    for (let i = 0; i < poly.length; i++){ const a = poly[i], b = poly[(i + 1) % poly.length], ia = a[0] >= c, ib = b[0] >= c;
      if (ia) out.push(a); if (ia !== ib){ const t2 = (c - a[0])/(b[0] - a[0]); out.push([c, a[1] + (b[1] - a[1])*t2]); } }
    for (let i = 1; i < out.length - 1; i++) tris.push([out[0], out[i], out[i + 1]]); }
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], ia = a[0] >= c, ib = b[0] >= c;
    if (ia && ib) edges.push([a, b]);
    else if (ia !== ib){ const t2 = (c - a[0])/(b[0] - a[0]), m = [c, a[1] + (b[1] - a[1])*t2]; edges.push(ia ? [a, m] : [m, b]); xs.push(m[1]); } }
  xs.sort((a, b) => a - b); for (let i = 0; i + 1 < xs.length; i += 2) cuts.push([xs[i], xs[i + 1]]);
  return {tris, edges, cuts};
}
// Sutherland-Hodgman clip of a polygon to x >= c (use only where the line crosses the outline twice)
function clipXP(P, c){ const out = []; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], ia = a[0] >= c, ib = b[0] >= c;
  if (ia) out.push(a); if (ia !== ib){ const t = (c - a[0])/(b[0] - a[0]); out.push([c, a[1] + (b[1] - a[1])*t]); } } return out; }

// ================= Shenzhen Science and Technology Museum (Zaha Hadid Architects, opened 1 May 2025, Guangming) =================
// Facts: ~128 300 m2 floor area on a ~66 000 m2 plot, 6 floors above ground + 2 below, a 38 m atrium (sz.gov.cn 30 Apr 2025;
// ourchinastory 2 May 2025); a rounded form facing the city at the south-east corner of the science park next to Guangming station,
// extending west into the park as a series of open-air terraces; a central atrium with a large glazed wall over the park; roof
// photovoltaics; 95 888 stainless-steel panels (INCO dual colour) shifting from nebula blue to phantom grey (theplan.it, d5mag,
// sz.gov.cn). Footprint OSM r19390442 (17 055 m2): the rounded east end faces Guangming station (+x here), the two west lobes are the
// terraces. Overall height is not published: ~46 m is an estimate (6 floors, the 38 m atrium); the stepping is interpretive.
LANDMARKS.szscimuseum = {zh:'深圳科学技术馆', en:'Shenzhen Science and Technology Museum', cat:'new', r:130, h:48,
  lt:{m:0, c:'#d9e8ff', k:0.45, e:0.4},
  build(){
    const g = new THREE.Group(), B = mkB(), V = vcB(), FP = D.sci.fp;
    const GLB = {c:'#4f6474', glow:'#ffdcae', gk:0.6}, MUL = '#9aa4ab', TER = '#8f9a8a', PLANT = '#5f7d4b', PV = {c:'#27344a', m:0, lk:0.1},
      GLT = {c:'#5a7183', glow:'#ffe3b8', gk:0.55}, LIP = {c:'#c9cfd4', m:0, lk:0.5, lc:'#e0ecff'}, PAV = '#bdb8ad';
    const blue = hexRGB('#2e4d77'), grey = hexRGB('#98a2ab');
    const colAt = (y, k) => { const t = cl01((y - 6)/40), s = (k % 2) ? 0.04 : 0; return [lerp(blue[0], grey[0], t) + s, lerp(blue[1], grey[1], t) + s, lerp(blue[2], grey[2], t) + s]; };
    // west of x = -57 the outline forks into the two terrace lobes; the main body is the part east of it
    const body = clipXP(FP, -57);
    const L = [ // [y0, y1, plan, inset, clip]
      [6, 12, FP, 0, -1e9], [12, 17, FP, 0, -84], [17, 22, FP, 0, -68],
      [22, 27, body, 0, -50], [27, 32, body, 0.8, -37], [32, 36, body, 2.0, -24], [36, 40, body, 4.0, -10], [40, 43.5, body, 7.0, 6], [43.5, 46, body, 11, 20]];
    let band = 0;
    for (const [y0, y1, P0, ins, c] of L){
      const P = ins > 0 ? offP(P0, ins) : P0, R = clipX(P, c);
      // stainless shell: the band walls, in horizontal panel courses (vertex colours: deep blue low, grey high)
      for (const [a, b] of R.edges){ const n = Math.max(1, Math.round((y1 - y0)/1.25));
        for (let k = 0; k < n; k++){ const ya = lerp(y0, y1, k/n), yb = lerp(y0, y1, (k + 1)/n);
          V.q([a[0], ya, a[1]], [b[0], ya, b[1]], [b[0], yb, b[1]], [a[0], yb, a[1]], colAt(ya, band + k)); } }
      // the cut faces toward the park are glazed (terrace fronts, the atrium wall)
      for (const [z0, z1] of R.cuts){ q4(B.p(GLT), [c, y0, z0], [c, y0, z1], [c, y1, z1], [c, y1, z0]);
        for (let z = z0; z <= z1; z += 3) abox(B.p(MUL), c - 0.3, c, y0, y1, z - 0.1, z + 0.1); }
      // the top of the band: terrace paving (planted edge) where the next band steps back, the roof at the top
      const top = y1 === 46;
      for (const t of R.tris) t3(B.p(top ? '#8e969c' : TER), [t[0][0], y1, t[0][1]], [t[2][0], y1, t[2][1]], [t[1][0], y1, t[1][1]]);
      // a stainless lip at each band top
      for (const [a, b] of R.edges){ const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = dz/l*(area2(P) > 0 ? 1 : -1), nz = -dx/l*(area2(P) > 0 ? 1 : -1);
        q4(B.p(LIP), [a[0], y1 - 0.5, a[1]], [b[0], y1 - 0.5, b[1]], [b[0] + nx*0.6, y1, b[1] + nz*0.6], [a[0] + nx*0.6, y1, a[1] + nz*0.6]); }
      band += 7;
    }
    // planting strips on the terraces (lobes and west steps)
    for (const [y, c0, c1] of [[12, -104, -84], [17, -84, -68], [22, -68, -50], [27, -50, -37], [32, -37, -24]]){
      for (let x = c0 + 2; x < c1 - 1; x += 4){ for (const z of [-50, -38, -26, 24, 30, 36, 42, 50]){ if (pip(FP, x, z) && pip(FP, x + 1.5, z)) abox(B.p(PLANT), x, x + 1.6, y, y + 0.9, z - 2.5, z + 2.5); } } }
    // roof photovoltaics on the top plateau
    for (let x = 24; x < 90; x += 6) for (let z = -50; z < 50; z += 4.5){ let ok = true; for (const [dx, dz] of [[0, 0], [4.5, 0], [0, 3], [4.5, 3]]) if (!pip(offP(body, 13), x + dx, z + dz)) ok = false;
      if (ok){ const y = 46.05; q4(B.p(PV), [x, y + 0.9, z], [x + 4.5, y + 0.9, z], [x + 4.5, y + 0.3, z + 3], [x, y + 0.3, z + 3]); } }
    // glass base (0-6 m), set back under the shell; entrance canopy toward the station (+x)
    const GB = offP(FP, 3.0); prism(B.p(GLB), GB, 0, 6, false);
    mullions(B.p(MUL), GB, 0, 6, 3.0, 0, 0.2);
    // underside of the shell overhang
    flat(B.p('#7b8790'), FP, 6.0);
    // forecourt paving round the base
    prism(B.p(PAV), offP(FP, -8), -1.5, 0.15, true);
    V.flush(g, {m:0, lk:0.42, lc:'#d6e6ff'}); B.flush(g); return g;
  }};
SG_PLACES.push({type:'szscimuseum', lat:PLC.szscimuseum.lat, lon:PLC.szscimuseum.lon, rot:PLC.szscimuseum.rot});
