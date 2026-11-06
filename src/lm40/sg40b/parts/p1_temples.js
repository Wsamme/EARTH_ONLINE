const circ = (r, n) => { const P = []; for (let i = 0; i < (n || 16); i++){ const a = i/(n || 16)*PI*2; P.push([Math.cos(a)*r, Math.sin(a)*r]); } return P; };
const semi = (r, n) => { const P = [[r, 0]]; for (let i = 1; i < n; i++){ const a = PI*i/n; P.push([Math.cos(a)*r, Math.sin(a)*r]); } P.push([-r, 0]); return P; };
// ---------------- shared Chinese-temple pieces (ridges, porcelain figures, lanterns, lattices) ----------------
// decorated ridge along local x (turned ry about (cx, cz)): roll + face panel; tail = Hokkien swallowtail ends curling up;
// curl = short Teochew / Cantonese end curls; town = dense cut-and-paste porcelain miniature houses, pagodas and figures
function tRidge(B, V, Rn, PAL, cx, cz, a, yr, sag, ry, o){
  o = o || {}; const RC = o.rc || '#3f7b54', TL = o.tl || '#8f4c36';
  const c = Math.cos(ry || 0), s = Math.sin(ry || 0), Rr = (x, y, z) => [cx + x*c + z*s, y, cz - x*s + z*c], yc = x => yr + sag*Math.pow(Math.min(1, Math.abs(x)/a), 2);
  const N = 8; for (let i = 0; i < N; i++){ const x0 = -a + 2*a*i/N, x1 = -a + 2*a*(i + 1)/N; segP(B.p(RC), Rr(x0, yc(x0), 0), Rr(x1, yc(x1), 0), 0.3, 4); const pm = Rr((x0 + x1)/2, 0, 0); boxP(B.p(TL), 2*a/N, 0.6, 0.44, pm[0], yc((x0 + x1)/2) - 0.6, pm[2], ry || 0); }
  if (o.tail){ const T = [[a*0.9, 0], [a + 0.4, 0.15], [a + 0.9, 0.55], [a + 1.25, 1.15], [a + 1.4, 1.75], [a + 1.45, 2.1]];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let k = 0; k < T.length - 1; k++){ const p0 = T[k], p1 = T[k+1];
      segP(B.p(RC), Rr(sx*p0[0], yc(a) + p0[1], sz*0.1*k), Rr(sx*p1[0], yc(a) + p1[1], sz*0.1*(k + 1)), 0.25 - k*0.03, 4); } }
  if (o.curl) for (const sx of [-1, 1]){ const P = [[a - 0.2, 0], [a + 0.25, 0.15], [a + 0.5, 0.55], [a + 0.45, 0.95], [a + 0.2, 1.05]];
    for (let k = 0; k < P.length - 1; k++) segP(B.p(RC), Rr(sx*P[k][0], yc(a) + P[k][1], 0), Rr(sx*P[k+1][0], yc(a) + P[k+1][1], 0), 0.26 - k*0.03, 4); }
  // cut-and-paste porcelain panel on both faces of the ridge
  { const n = Math.max(2, Math.round(2*a/1.4)); for (let i = 0; i < n; i++){ const x0 = -a*0.88 + 1.76*a*i/n, x1 = -a*0.88 + 1.76*a*(i + 0.9)/n, pa = Rr(x0, 0, 0.25), pb = Rr(x1, 0, 0.25), pc = Rr(x0, 0, -0.25), pd = Rr(x1, 0, -0.25), y0 = yc((x0 + x1)/2) - 0.5, col = PAL[(i*3 + 1) % PAL.length];
    vAdd(V, col, t => { quadP(t, [pa[0], y0, pa[2]], [pb[0], y0, pb[2]], [pb[0], y0 + 0.4, pb[2]], [pa[0], y0 + 0.4, pa[2]]); quadP(t, [pd[0], y0, pd[2]], [pc[0], y0, pc[2]], [pc[0], y0 + 0.4, pc[2]], [pd[0], y0 + 0.4, pd[2]]); }); } }
  if (o.figs) for (let i = 1; i < 2*a/0.8 - 1; i++){ const x = -a + i*0.8; if (Math.abs(x) < (o.gap || 1.0)) continue; const p = Rr(x, yc(x) + 0.28, 0), hh = 0.55 + Rn()*0.35, c1 = PAL[Math.floor(Rn()*PAL.length)], c2 = PAL[Math.floor(Rn()*PAL.length)];
    vAdd(V, c1, t => { boxP(t, 0.36, hh*0.62, 0.28, p[0], p[1], p[2], ry || 0); boxP(t, 0.56, 0.1, 0.22, p[0], p[1] + hh*0.45, p[2], ry || 0); });
    vAdd(V, c2, t => { boxP(t, 0.18, hh*0.22, 0.18, p[0], p[1] + hh*0.62, p[2], ry || 0); }); }
  // Teochew "town" ridge: one- and two-storey miniature buildings, pagodas and opera figures crowded along the ridge
  if (o.town){ const n = Math.round(2*a/0.62); for (let i = 0; i < n; i++){ const x = -a + 0.3 + (2*a - 0.6)*i/(n - 1); if (Math.abs(x) < (o.gap || 0)) continue;
      const p = Rr(x, yc(x) + 0.28, 0), k = (i*7 + Math.floor(Rn()*3)) % 6, cw = PAL[(i*5 + 2) % PAL.length], cr = PAL[(i*3 + 5) % PAL.length];
      if (k < 3){ const st = k === 2 ? 2 : 1, w = 0.5, h1 = 0.42;   // miniature hall / two-storey house: wall + roof
        for (let j = 0; j < st; j++){ vAdd(V, cw, t => boxP(t, w*(1 - 0.15*j), h1, 0.34, p[0], p[1] + j*(h1 + 0.14), p[2], ry || 0)); vAdd(V, cr, t => boxP(t, w*(1.25 - 0.15*j), 0.12, 0.48, p[0], p[1] + h1 + j*(h1 + 0.14), p[2], ry || 0)); } }
      else if (k === 3){ for (let j = 0; j < 4; j++) vAdd(V, j % 2 ? cr : cw, t => boxP(t, 0.36 - j*0.06, 0.28, 0.36 - j*0.06, p[0], p[1] + j*0.32, p[2], ry || 0)); }   // pagoda
      else { const hh = 0.5 + Rn()*0.3; vAdd(V, cw, t => { boxP(t, 0.22, hh*0.6, 0.2, p[0], p[1], p[2], ry || 0); }); vAdd(V, cr, t => { boxP(t, 0.34, 0.09, 0.16, p[0], p[1] + hh*0.42, p[2], ry || 0); boxP(t, 0.13, hh*0.22, 0.13, p[0], p[1] + hh*0.6, p[2], ry || 0); }); }
    } }
}
// two porcelain dragons along a ridge (local x, turned ry) facing a centre ornament (pearl on a rod when pearl)
function tDragons(B, V, cx, cz, a, yr, sag, ry, pearl, GOLD){
  const c = Math.cos(ry || 0), s = Math.sin(ry || 0), Rr = (x, y, z) => [cx + x*c + z*s, y, cz - x*s + z*c], yc = x => yr + sag*Math.pow(Math.min(1, Math.abs(x)/a), 2);
  for (const sx of [-1, 1]){ let prev = null; const N = 16;
    for (let i = 0; i <= N; i++){ const t = i/N, x = sx*(0.9 + t*a*0.78), p = Rr(x, yc(x) + 0.5 + 0.38*Math.sin(t*TAU*1.5 + 0.6) + 0.3*(1 - t)*(1 - t), 0.16*Math.sin(t*TAU*1.5));
      if (prev){ const rr = 0.3 - 0.17*t; vAdd(V, '#2f8f5a', o => segP(o, prev, p, rr, 5)); if (i % 2 === 0) vAdd(V, i % 4 ? '#e9c33b' : '#3d6fd0', o => boxP(o, 0.1, rr*1.4, 0.07, p[0], p[1] + rr*0.6, p[2], ry || 0)); }
      prev = p; }
    const h = Rr(sx*0.85, yc(0.85) + 0.85, 0);
    vAdd(V, '#2f8f5a', o => boxP(o, 0.62, 0.38, 0.38, h[0], h[1], h[2], ry || 0));
    vAdd(V, '#d23b2c', o => boxP(o, 0.22, 0.48, 0.44, h[0] + c*sx*0.28, h[1] + 0.08, h[2] - s*sx*0.28, ry || 0));
  }
  if (pearl){ segP(B.p(GOLD), [cx, yr, cz], [cx, yr + 1.25, cz], 0.04, 4); latheP(B.p(GOLD), [[0.04, yr + 1.05], [0.3, yr + 1.2], [0.36, yr + 1.45], [0.25, yr + 1.7], [0.04, yr + 1.8]], cx, cz, 8);
    vAdd(V, '#d23b2c', o => { for (let k = 0; k < 6; k++){ const a2 = k/6*TAU; segP(o, [cx, yr + 1.45, cz], [cx + Math.cos(a2)*0.6, yr + 1.6 + 0.3*Math.abs(Math.sin(a2)), cz + Math.sin(a2)*0.1], 0.05, 3); } }); }
  else latheP(B.p(GOLD), [[0.25, yr + 0.2], [0.32, yr + 0.5], [0.2, yr + 0.8], [0.04, yr + 1.0]], cx, cz, 8);
}
const tLantern = (B, LANT, GOLD, x, y, z, s) => { s = s || 1; latheP(B.p(LANT), [[0.05, y - 1.1*s], [0.28*s, y - 1.0*s], [0.34*s, y - 0.78*s], [0.28*s, y - 0.56*s], [0.05, y - 0.48*s]], x, z, 8); segP(B.p(GOLD), [x, y - 0.48*s, z], [x, y - 0.05, z], 0.02, 3); };
const tLattice = (B, WIN, FR, F, u0, u1, v0, v1) => { shapeP(B.p(WIN), rectO(u0, u1, v0, v1), F, 0.04); const n = Math.max(2, Math.round((u1 - u0)/0.3)); for (let j = 1; j < n; j++) shapeP(B.p(FR), rectO(lerp(u0, u1, j/n) - 0.035, lerp(u0, u1, j/n) + 0.035, v0, v1), F, 0.07); };
// stone lion (seated guardian, simplified): plinth, body, head, mane
function tLion(B, ST, x, y, z, ry, s){ s = s || 1; boxP(B.p(ST), 0.9*s, 0.5*s, 0.7*s, x, y, z, ry); boxP(B.p(ST), 0.62*s, 0.7*s, 0.5*s, x, y + 0.5*s, z, ry); boxP(B.p(ST), 0.55*s, 0.45*s, 0.5*s, x, y + 1.2*s, z, ry); boxP(B.p(ST), 0.66*s, 0.22*s, 0.56*s, x, y + 1.25*s, z, ry); }

// ================= Yueh Hai Ching Temple (粤海清庙), Phillip Street =================
// Teochew temple, present buildings 1852-55 (national monument 1996, restored 2011-14, UNESCO Award of Merit). Two identical
// temples side by side, each with its own entrance: Tian Hou (Mazu) and Xuan Tian Shang Di, each on the three-hall plan with a
// covered courtyard between the entrance hall and the main hall. Teochew roofs with relatively straight ridges crowded with
// cut-and-paste porcelain (qian ci) sculpture: miniature buildings, pagodas and opera figures forming a Chinese town; the Shang
// Di ridge has two dragons flanking a blazing pearl on a metal rod, the Mazu ridge a ridge of dragons. Red purlins and doors,
// gold on eaveboards and door gods, green on the boundary-wall tiles (Wikipedia; roots.gov.sg).
// OSM footprint w171999290 (24 x 21.4 m). Local frame: +x = front towards Phillip Street (ENE), the two temples side by side
// along z. Night: warm breathing floodlight, red lanterns.
LANDMARKS.sgyuehhai = {zh:'粤海清庙', en:'Yueh Hai Ching Temple', cat:'old', r:19, h:11.5,
  lt:{m:0, c:'#ffcf98', k:1.35, e:0.7, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), V = mkV(), Rn = LMCTX.rng;
    const GRAN = '#a7a196', WALL = '#e4ddd0', RED = '#8e2c21', TILE = '#7f5a45', GT = '#3f7b54', DARK = '#3a302a', PAVE = '#c6bfb2',
      GOLD = {c:'#d6a640', lc:'#ffd27e', lk:1.3}, WIN = {c:'#7d3524', glow:'#ffb35c', gk:0.55}, LANT = {c:'#d8382a', glow:'#ff4a22', gk:2.4};
    const PAL = ['#3f7b54', '#d23b2c', '#e9c33b', '#3d6fd0', '#f3efe5', '#e690a2', '#2f8f8a', '#e8873b'];
    const RING = [[-12.1,10.7],[-11.9,-10.7],[12.1,-10.7],[11.9,10.6]], FY = 0.6;
    prismP(B.p(GRAN), RING, -5, 0.3); capP(B.p(PAVE), RING, 0.31);
    for (const s of [-1, 1]){
      const z0 = s < 0 ? -10.6 : 0.35, z1 = s < 0 ? -0.35 : 10.6, zc = (z0 + z1)/2, hw = (z1 - z0)/2;
      // ---- entrance hall (front porch recessed 1.4 m behind granite columns) ----
      { const x0 = 6.4, x1 = 11.9, xf = x1 - 1.4;
        bxP(B.p(GRAN), x0, x1, 0.3, FY, z0, z1);
        bxP(B.p(WALL), x0, xf, FY, 5.2, z0, z1); bxP(B.p(GRAN), x0 - 0.02, xf + 0.02, FY, 1.5, z0 - 0.02, z1 + 0.02);
        for (const zz of [z0 + 0.25, z1 - 0.25]) bxP(B.p(WALL), xf, x1, FY, 5.2, zz - 0.25, zz + 0.25);       // porch side walls
        const F = fX(xf, 1, zc);
        shapeP(B.p(DARK), rectO(-1.7, 1.7, FY, 4.3), F, 0.02);
        for (const q of [-1, 1]){ shapeP(B.p(RED), rectO(q*0.05, q*1.6, FY + 0.3, 4.2), F, 0.06); vAdd(V, q > 0 ? '#3d6fd0' : '#3f7b54', t => shapeP(t, rectO(q*0.35, q*1.3, FY + 1.1, 3.4), F, 0.08)); vAdd(V, '#d6a640', t => shapeP(t, rectO(q*0.55, q*1.1, FY + 1.6, 2.9), F, 0.09)); }
        for (const q of [-1, 1]) tLattice(B, WIN, RED, F, q*3.0 - 0.8, q*3.0 + 0.8, 2.0, 3.4);                  // round-headed side windows simplified
        vAdd(V, '#e9c33b', t => shapeP(t, rectO(-1.2, 1.2, 4.45, 4.95), F, 0.04));                             // name board (blank)
        for (const zq of [zc - 2.4, zc + 2.4]) latheP(B.p(GRAN), [[0.36, FY], [0.36, FY + 0.3], [0.26, FY + 0.42], [0.24, 5.2]], x1 - 0.45, zq, 8);
        bxP(B.p(RED), xf, x1, 4.8, 5.3, z0 + 0.2, z1 - 0.2);                                                    // painted eaveboard
        vAdd(V, '#d6a640', t => boxP(t, 0.06, 0.32, 2*hw - 0.6, x1 + 0.02, 4.86, zc, 0));
        const yr = roofP(B.p(TILE), (x0 + x1)/2, zc, hw + 0.5, (x1 - x0)/2 + 0.6, hw + 0.5, 0, 5.2, 2.3, {ry:HP, gab:0.001, gcol:B.p(WALL), sag:0.12, pw:1.35, fas:0.28, fo:B.p(GT)});
        tRidge(B, V, Rn, PAL, (x0 + x1)/2, zc, hw + 0.3, yr + 0.22, 0.12, HP, {curl:true, town:true, gap:0.9});
        tDragons(B, V, (x0 + x1)/2, zc, hw + 0.3, yr + 0.22, 0.12, HP, false, GOLD);
        for (const zq of [zc - 3.2, zc - 1.1, zc + 1.1, zc + 3.2]) tLantern(B, LANT, GOLD, x1 - 0.8, 5.0, zq);
      }
      // ---- covered courtyard (worship pavilion) with side corridors ----
      { const x0 = -1.2, x1 = 6.4;
        for (const zz of [z0 + 0.9, z1 - 0.9]){ bxP(B.p(WALL), x0, x1, FY, 4.2, zz - 0.9, zz + 0.9); const r2 = roofP(B.p(TILE), (x0 + x1)/2, zz, (x1 - x0)/2 + 0.2, 1.3, (x1 - x0)/2 + 0.2, 0, 4.2, 0.9, {gab:0.001, gcol:B.p(WALL), pw:1.3, fas:0.18, fo:B.p(GT)}); }
        for (const xq of [x0 + 0.6, x1 - 0.6]) for (const zq of [zc - 2.2, zc + 2.2]) latheP(B.p(RED), [[0.24, FY], [0.22, 5.6]], xq, zq, 8);
        bxP(B.p(RED), x0 + 0.3, x1 - 0.3, 5.3, 5.7, zc - 2.5, zc + 2.5);
        const yr = roofP(B.p(TILE), (x0 + x1)/2, zc, (x1 - x0)/2 + 0.5, 3.2, (x1 - x0)/2 - 1.0, 0, 5.6, 1.5, {lift:0.35, pw:1.4, fas:0.2, fo:B.p(GT), hips:B.p(GT)});
        tRidge(B, V, Rn, PAL, (x0 + x1)/2, zc, (x1 - x0)/2 - 1.0, yr + 0.15, 0.05, 0, {curl:true, figs:true});
        latheP(B.p('#6c5a45'), [[0.5, FY], [0.75, FY + 0.45], [0.8, FY + 0.85], [0.62, FY + 1.1], [0, FY + 1.15]], 2.6, zc, 10);   // incense urn
      }
      // ---- main hall (higher, deeper) ----
      { const x0 = -11.9, x1 = -1.2;
        bxP(B.p(GRAN), x0, x1, 0.3, FY + 0.35, z0, z1);
        bxP(B.p(WALL), x0, x1, FY + 0.35, 6.4, z0, z1); bxP(B.p(GRAN), x0 - 0.02, x1 + 0.02, FY + 0.35, 1.6, z0 - 0.02, z1 + 0.02);
        const F = fX(x1, 1, zc);
        for (let k = -2; k <= 2; k++) tLattice(B, WIN, RED, F, k*1.95 - 0.8, k*1.95 + 0.8, FY + 0.5, 5.2);
        bxP(B.p(RED), x1, x1 + 0.4, 5.8, 6.4, z0 + 0.2, z1 - 0.2);
        const yr = roofP(B.p(TILE), (x0 + x1)/2, zc, hw + 0.55, (x1 - x0)/2 + 0.7, hw + 0.55, 0, 6.4, 3.0, {ry:HP, gab:0.001, gcol:B.p(WALL), sag:0.15, pw:1.35, fas:0.32, fo:B.p(GT)});
        tRidge(B, V, Rn, PAL, (x0 + x1)/2, zc, hw + 0.35, yr + 0.25, 0.15, HP, {curl:true, town:true, gap:1.0});
        tDragons(B, V, (x0 + x1)/2, zc, hw + 0.35, yr + 0.25, 0.15, HP, s > 0, GOLD);
        for (const zq of [zc - 2.6, zc + 2.6]) tLantern(B, LANT, GOLD, x1 + 0.7, 6.2, zq);
      }
    }
    // party wall between the two temples, coped with green tiles
    bxP(B.p(WALL), -11.9, 11.9, FY, 5.0, -0.35, 0.35); bxP(B.p(GT), -11.9, 11.9, 5.0, 5.25, -0.45, 0.45);
    B.flush(g); vFlush(g, V);
    return g;
  }};
SG_PLACES.push({type:'sgyuehhai', lat:1.284555, lon:103.849318, rot:-0.3310});

// ================= Siang Cho Keong Temple (仙祖宫), 66 Amoy Street =================
// Small Hokkien temple completed in 1869 (URA conservation portal), at the foot of Ann Siang Hill, once facing the sea: curved
// roof ridges with outward-sweeping swallowtail ends, unglazed clay tiles (URA); a pair of guardian lions in front
// (penang-traveltips). Layout (front hall, air-well, main hall) and colours are not documented: modelled in the usual Hokkien
// arrangement. OSM footprint w692636295 (14.6 x 9.5 m). Local frame: +x = front towards Amoy Street (ESE).
LANDMARKS.sgsiangcho = {zh:'仙祖宫', en:'Siang Cho Keong Temple', cat:'old', r:11, h:11,
  lt:{m:0, c:'#ffcf98', k:1.3, e:0.7, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), V = mkV(), Rn = LMCTX.rng;
    const GRAN = '#a29c91', WALL = '#e7e1d4', RED = '#8e2c21', TILE = '#9a5a3e', GT = '#8a4a34', DARK = '#3a302a',
      GOLD = {c:'#d6a640', lc:'#ffd27e', lk:1.3}, WIN = {c:'#7d3524', glow:'#ffb35c', gk:0.55}, LANT = {c:'#d8382a', glow:'#ff4a22', gk:2.4};
    const PAL = ['#3f7b54', '#d23b2c', '#e9c33b', '#3d6fd0', '#f3efe5', '#e8873b'];
    const RING = [[-7.2,-4.7],[7.4,-4.7],[6.9,4.9],[-7.2,4.6]], FY = 0.9;
    prismP(B.p(GRAN), RING, -5, FY);
    for (let k = 0; k < 3; k++) bxP(B.p(GRAN), 7.1 + k*0.0, 7.5 + k*0.35 - 0.0, 0, FY - k*0.3, -1.6, 1.6);   // front steps
    // front hall
    { const x0 = 2.2, x1 = 7.0, xf = 6.0, zc = 0, hw = 4.5;
      bxP(B.p(WALL), x0, xf, FY, 5.0, -hw, hw); bxP(B.p(GRAN), x0 - 0.02, xf + 0.02, FY, 1.8, -hw - 0.02, hw + 0.02);
      for (const zz of [-hw + 0.3, hw - 0.3]) bxP(B.p(WALL), xf, x1, FY, 5.0, zz - 0.3, zz + 0.3);
      const F = fX(xf, 1, 0);
      shapeP(B.p(DARK), rectO(-1.3, 1.3, FY, 3.9), F, 0.02);
      for (const q of [-1, 1]){ shapeP(B.p(RED), rectO(q*0.04, q*1.2, FY + 0.25, 3.8), F, 0.06); vAdd(V, q > 0 ? '#3d6fd0' : '#3f7b54', t => shapeP(t, rectO(q*0.3, q*1.0, FY + 1.0, 3.1), F, 0.08)); }
      for (const q of [-1, 1]) tLattice(B, WIN, RED, F, q*2.6 - 0.6, q*2.6 + 0.6, 2.2, 3.3);
      bxP(B.p(RED), xf, x1, 4.6, 5.1, -hw + 0.3, hw - 0.3);
      for (const zq of [-1.9, 1.9]) latheP(B.p(GRAN), [[0.3, FY], [0.3, FY + 0.25], [0.21, FY + 0.35], [0.2, 5.0]], x1 - 0.35, zq, 8);
      const yr = roofP(B.p(TILE), (x0 + x1)/2, zc, hw + 0.4, (x1 - x0)/2 + 0.5, hw + 0.4, 0, 5.0, 2.0, {ry:HP, gab:0.001, gcol:B.p(WALL), sag:0.45, pw:1.45, fas:0.25, fo:B.p(GT)});
      tRidge(B, V, Rn, PAL, (x0 + x1)/2, zc, hw + 0.2, yr + 0.2, 0.45, HP, {tail:true, figs:true, rc:'#8a4a34', tl:'#9a5a3e'});
      for (const zq of [-2.6, 0, 2.6]) tLantern(B, LANT, GOLD, x1 - 0.6, 4.8, zq, 0.9);
    }
    // air-well side walls and the main hall
    for (const zz of [-4.2, 4.2]) bxP(B.p(WALL), -0.6, 2.2, FY, 3.8, zz - 0.35, zz + 0.35);
    { const x0 = -7.1, x1 = -0.6, hw = 4.55;
      bxP(B.p(WALL), x0, x1, FY, 5.8, -hw, hw); bxP(B.p(GRAN), x0 - 0.02, x1 + 0.02, FY, 1.6, -hw - 0.02, hw + 0.02);
      const F = fX(x1, 1, 0); for (const q of [-1, 0, 1]) tLattice(B, WIN, RED, F, q*2.4 - 0.8, q*2.4 + 0.8, FY + 0.4, 4.6);
      const yr = roofP(B.p(TILE), (x0 + x1)/2, 0, hw + 0.45, (x1 - x0)/2 + 0.6, hw + 0.45, 0, 5.8, 2.4, {ry:HP, gab:0.001, gcol:B.p(WALL), sag:0.5, pw:1.45, fas:0.28, fo:B.p(GT)});
      tRidge(B, V, Rn, PAL, (x0 + x1)/2, 0, hw + 0.25, yr + 0.2, 0.5, HP, {tail:true, figs:true, rc:'#8a4a34', tl:'#9a5a3e'});
      latheP(B.p(GOLD), [[0.25, yr + 0.3], [0.32, yr + 0.6], [0.2, yr + 0.9], [0.04, yr + 1.1]], (x0 + x1)/2, 0, 8);
    }
    for (const s of [-1, 1]) tLion(B, GRAN, 7.9, 0, s*2.1, HP, 0.9);
    B.flush(g); vFlush(g, V);
    return g;
  }};
SG_PLACES.push({type:'sgsiangcho', lat:1.279922, lon:103.846579, rot:-0.4667});

// ================= Fuk Tak Chi Museum (福德祠), 76 Telok Ayer Street =================
// One of the oldest Chinese temples in Singapore (built in brick in 1825, renovated and expanded 1854, 1862 and 1869), founded by
// the Cantonese and Hakka communities; converted into the Fuk Tak Chi Museum in 1998 within Far East Square (culturepaedia
// singaporeccc; chinatown.sg). Anchored on the Far East Square piece that holds the museum POI (w372148466, 23 x 8 m; walls set
// 0.6-1.0 m in from the party walls so that the hull keeps the neighbouring shophouses): a front
// hall and a main hall behind an air-well, gable roofs with modest end curls. Roof colours are not documented (green glazed
// tiles assumed as in the target note). Local frame: +x = front towards Telok Ayer Street (SE).
LANDMARKS.sgfuktakchi = {zh:'福德祠', en:'Fuk Tak Chi Museum', cat:'old', r:13, h:9.5,
  lt:{m:0, c:'#ffcf98', k:1.3, e:0.7, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), V = mkV(), Rn = LMCTX.rng;
    const GRAN = '#a29c91', WALL = '#e6dfd0', RED = '#8e2c21', TILE = '#4f7a57', GT = '#2f5f45', DARK = '#3a302a',
      GOLD = {c:'#d6a640', lc:'#ffd27e', lk:1.3}, WIN = {c:'#7d3524', glow:'#ffb35c', gk:0.55}, LANT = {c:'#d8382a', glow:'#ff4a22', gk:2.4};
    const PAL = ['#3f7b54', '#d23b2c', '#e9c33b', '#3d6fd0', '#f3efe5', '#e8873b'];
    const RING = [[-11.5,3.35],[-11.1,-3.35],[11.5,-3.35],[11.5,3.35]], FY = 0.45, hw = 3.35;
    prismP(B.p(GRAN), RING, -5, FY);
    // front hall
    { const x0 = 5.6, x1 = 11.4, xf = 10.2;
      bxP(B.p(WALL), x0, xf, FY, 4.8, -hw, hw); bxP(B.p(GRAN), x0 - 0.02, xf + 0.02, FY, 1.7, -hw - 0.02, hw + 0.02);
      for (const zz of [-hw + 0.25, hw - 0.25]) bxP(B.p(WALL), xf, x1, FY, 4.8, zz - 0.25, zz + 0.25);
      const F = fX(xf, 1, 0);
      shapeP(B.p(DARK), rectO(-1.2, 1.2, FY, 3.6), F, 0.02);
      for (const q of [-1, 1]){ shapeP(B.p(RED), rectO(q*0.04, q*1.1, FY + 0.25, 3.5), F, 0.06); vAdd(V, '#d6a640', t => shapeP(t, rectO(q*0.3, q*0.9, FY + 1.1, 2.8), F, 0.08)); }
      for (const q of [-1, 1]) tLattice(B, WIN, RED, F, q*2.5 - 0.55, q*2.5 + 0.55, 2.0, 3.2);
      bxP(B.p(RED), xf, x1, 4.4, 4.9, -hw + 0.25, hw - 0.25);
      for (const zq of [-1.7, 1.7]) latheP(B.p(GRAN), [[0.28, FY], [0.28, FY + 0.25], [0.2, FY + 0.35], [0.19, 4.8]], x1 - 0.35, zq, 8);
      const yr = roofP(B.p(TILE), (x0 + x1)/2, 0, hw + 0.35, (x1 - x0)/2 + 0.5, hw + 0.35, 0, 4.8, 2.0, {ry:HP, gab:0.001, gcol:B.p(WALL), sag:0.15, pw:1.4, fas:0.25, fo:B.p(GT)});
      tRidge(B, V, Rn, PAL, (x0 + x1)/2, 0, hw + 0.15, yr + 0.2, 0.15, HP, {curl:true, figs:true, rc:GT, tl:TILE});
      for (const zq of [-1.9, 1.9]) tLantern(B, LANT, GOLD, x1 - 0.6, 4.6, zq, 0.9);
    }
    for (const zz of [-3.6, 3.6]) bxP(B.p(WALL), 1.8, 5.6, FY, 3.6, zz - 0.35, zz + 0.35);
    { const x0 = -11.3, x1 = 1.8;
      bxP(B.p(WALL), x0, x1, FY, 5.6, -hw, hw); bxP(B.p(GRAN), x0 - 0.02, x1 + 0.02, FY, 1.5, -hw - 0.02, hw + 0.02);
      const F = fX(x1, 1, 0); for (const q of [-1, 0, 1]) tLattice(B, WIN, RED, F, q*2.2 - 0.7, q*2.2 + 0.7, FY + 0.4, 4.4);
      const yr = roofP(B.p(TILE), (x0 + x1)/2, 0, hw + 0.4, (x1 - x0)/2 + 0.5, hw + 0.4, 0, 5.6, 2.3, {ry:HP, gab:0.001, gcol:B.p(WALL), sag:0.18, pw:1.4, fas:0.28, fo:B.p(GT)});
      tRidge(B, V, Rn, PAL, (x0 + x1)/2, 0, hw + 0.2, yr + 0.2, 0.18, HP, {curl:true, figs:true, rc:GT, tl:TILE});
      latheP(B.p(GOLD), [[0.25, yr + 0.3], [0.32, yr + 0.6], [0.2, yr + 0.9], [0.04, yr + 1.1]], (x0 + x1)/2, 0, 8);
    }
    B.flush(g); vFlush(g, V);
    return g;
  }};
SG_PLACES.push({type:'sgfuktakchi', lat:1.282914, lon:103.848738, rot:-0.6374});

// ================= Ying Fo Fui Kun (应和会馆), 98 Telok Ayer Street =================
// Hakka clan association founded 1822; the 1844 reconstruction produced the present two-storey building (national monument):
// a courtyard surrounded by an entrance hall, main hall and adjoining corridors; two Doric columns frame the entrance with an
// arch spanning between them; front windows set higher than a man's height (after Hakka tulou); granite columns carry the upper
// floor (roots.gov.sg). Roof form and colours are not documented: Chinese gable roofs with plain ridges are assumed.
// OSM footprint w125836766 (23 x 12 m). Local frame: +x = front towards Telok Ayer Street (SE).
LANDMARKS.sgyingfo = {zh:'应和会馆', en:'Ying Fo Fui Kun', cat:'old', r:15, h:13,
  lt:{m:0, c:'#ffd6a4', k:1.25, e:0.7, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), V = mkV(), Rn = LMCTX.rng;
    const GRAN = '#a29c91', WALL = '#ece6da', RED = '#8e2c21', TILE = '#6e6a62', GT = '#3f6f55', DARK = '#3a302a', TRIM = '#f6f1e6',
      GOLD = {c:'#d6a640', lc:'#ffd27e', lk:1.3}, WIN = {c:'#5b3324', glow:'#ffbf6e', gk:0.5}, LANT = {c:'#d8382a', glow:'#ff4a22', gk:2.4};
    const PAL = ['#3f7b54', '#d23b2c', '#e9c33b', '#3d6fd0', '#f3efe5'];
    const RING = [[-11.5,-5.9],[11.6,-5.9],[11.5,5.9],[-11.5,6.0]], FY = 0.45, hw = 5.85;
    prismP(B.p(GRAN), RING, -5, FY);
    // entrance hall: two storeys, front wall with the Doric pair and the arch, high windows
    { const x0 = 5.4, x1 = 11.45;
      bxP(B.p(WALL), x0, x1, FY, 8.4, -hw, hw); bxP(B.p(GRAN), x1 - 0.02, x1 + 0.03, FY, 1.0, -hw, hw);
      const F = fX(x1, 1, 0);
      shapeP(B.p(DARK), mv(rArchO(1.3, 4.0, 10), 0, FY), F, 0.02);                    // arched entrance
      slabP(B.p(TRIM), mv(archFill(1.5, 3.3, 3.75, 10), 0, FY), F, 0, 0.12);           // the arch between the columns
      shapeP(B.p(RED), rectO(-1.1, 1.1, FY, 2.9), F, 0.05);                           // doors
      for (const q of [-1, 1]){ latheP(B.p(TRIM), [[0.36, FY], [0.36, FY + 0.35], [0.3, FY + 0.45], [0.26, FY + 3.6], [0.36, FY + 3.75], [0.36, FY + 3.95]], x1 + 0.45, q*1.85, 12); }
      bxP(B.p(TRIM), x1 - 0.02, x1 + 0.85, FY + 3.95, FY + 4.3, -2.3, 2.3);            // entablature over the columns
      for (const q of [-3.9, 3.9]) shapeP(B.p(WIN), rectO(q - 0.5, q + 0.5, 2.3, 3.4), F, 0.03);                 // high ground-floor windows
      for (const q of [-3.9, -1.3, 1.3, 3.9]) { shapeP(B.p(WIN), rectO(q - 0.55, q + 0.55, 5.4, 7.2), F, 0.03); slabP(B.p(TRIM), rectO(q - 0.7, q + 0.7, 5.25, 5.4), F, 0, 0.08); }
      slabP(B.p(TRIM), rectO(-hw, hw, 4.75, 5.0), F, 0, 0.12); slabP(B.p(TRIM), rectO(-hw, hw, 8.05, 8.4), F, 0, 0.15);
      const yr = roofP(B.p(TILE), (x0 + x1)/2, 0, hw + 0.4, (x1 - x0)/2 + 0.5, hw + 0.4, 0, 8.4, 2.4, {ry:HP, gab:0.001, gcol:B.p(WALL), sag:0.1, pw:1.35, fas:0.25, fo:B.p(GT)});
      tRidge(B, V, Rn, PAL, (x0 + x1)/2, 0, hw + 0.2, yr + 0.18, 0.1, HP, {curl:true, rc:GT, tl:TILE});
      for (const zq of [-1.0, 1.0]) tLantern(B, LANT, GOLD, x1 + 0.6, 4.3, zq, 0.8);
    }
    // corridors round the courtyard
    for (const zz of [-hw + 0.9, hw - 0.9]){ bxP(B.p(WALL), -2.0, 5.4, FY, 7.2, zz - 0.9, zz + 0.9); const F = fZ(zz - Math.sign(zz)*0.9, -Math.sign(zz), 1.7);
      for (const u of [-2.4, 0, 2.4]) shapeP(B.p(WIN), rectO(u - 0.6, u + 0.6, 4.6, 6.4), F, 0.03);
      roofP(B.p(TILE), 1.7, zz, 3.9, 1.3, 3.9, 0, 7.2, 1.1, {gab:0.001, gcol:B.p(WALL), pw:1.3, fas:0.2, fo:B.p(GT)}); }
    for (const xq of [-1.2, 1.7, 4.6]) for (const zq of [-3.6, 3.6]) latheP(B.p(GRAN), [[0.24, FY], [0.22, 4.6]], xq, zq, 8);
    // main hall: two storeys, altar hall below, upper hall
    { const x0 = -11.45, x1 = -2.0;
      bxP(B.p(WALL), x0, x1, FY, 9.0, -hw, hw);
      const F = fX(x1, 1, 0); for (const q of [-2.6, 0, 2.6]){ tLattice(B, WIN, RED, F, q - 0.9, q + 0.9, FY + 0.4, 4.0); shapeP(B.p(WIN), rectO(q - 0.7, q + 0.7, 5.4, 7.6), F, 0.03); }
      slabP(B.p(TRIM), rectO(-hw, hw, 4.6, 4.85), F, 0, 0.1);
      const yr = roofP(B.p(TILE), (x0 + x1)/2, 0, hw + 0.45, (x1 - x0)/2 + 0.55, hw + 0.45, 0, 9.0, 2.6, {ry:HP, gab:0.001, gcol:B.p(WALL), sag:0.12, pw:1.35, fas:0.28, fo:B.p(GT)});
      tRidge(B, V, Rn, PAL, (x0 + x1)/2, 0, hw + 0.25, yr + 0.18, 0.12, HP, {curl:true, rc:GT, tl:TILE});
      latheP(B.p(GOLD), [[0.25, yr + 0.3], [0.32, yr + 0.6], [0.2, yr + 0.9], [0.04, yr + 1.1]], (x0 + x1)/2, 0, 8);
    }
    B.flush(g); vFlush(g, V);
    return g;
  }};
SG_PLACES.push({type:'sgyingfo', lat:1.282517, lon:103.848441, rot:-0.6374});
