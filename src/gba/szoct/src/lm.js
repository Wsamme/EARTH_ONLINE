// ---------- OCT Tower 华侨城大厦 (KPF, 2020; 300 m, 60 floors, top floor 269.9 m) ----------
// The real footprint (OSM w694439493): an elongated hexagon, west prow cut flat, east prow sharp. Fins on the north (NW, N, NE)
// and south (SSW) faces, smooth glass on the east and west prows; a lobby on a maze of large pillars; sky lobbies; the crown:
// the curtain wall rises past the 269.9 m top floor to 300 m round a glowing diamond-shaped event floor.
const OCT_P = [[-32.6, -8.0], [-18.9, -26.8], [4.2, -31.8], [39.4, 18.3], [24.6, 28.0], [-31.2, 13.5]];
LANDMARKS.szocttower = {zh:'华侨城大厦', en:'OCT Tower', cat:'new', r:48, h:300, lt:{m:1, c:'#e6eeff', k:0.65},
  build(){
    const g = new THREE.Group(), B = VB();
    const GL = {c:'#ffffff', vc:true, m:1, fh:4.5, cw:1.5}, FIN = {c:'#ffffff', vc:true, m:0, lk:0.35, lc:'#dfe8ff'}, ST = {c:'#ffffff', vc:true, m:0, lk:0.6, lc:'#fff0dc'},
          CROWN = {c:'#f2efe8', glow:'#fff4e2', gk:0.85}, GLS = {c:'#ffffff', vc:true, m:0, lk:0.2, op:0.62, glow:'#e6edff', gk:0.5}, RED = {c:'#aa1111', glow:'#ff2a1a', gk:2.2}, DK = {c:'#ffffff', vc:true, m:0, lk:0};
    const kG = RGB('#93a9ba'), kGd = RGB('#5f7484'), kF = RGB('#d8dcdf'), kS = RGB('#d9d2c4'), kSl = RGB('#cfcabe'), kR = RGB('#8f9497');
    const P = OCT_P, n = P.length, H0 = 14, H1 = 272, TOPS = [288, 291, 295, 300, 297, 290];
    const FINS = new Set([1, 2, 4]);                 // edges B-C (N), C-D (NE), E-F (SSW) carry fins; A-B, D-E, F-A are the smooth prows
    const out = i => { const a = P[i], b = P[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz); return [dz/L, -dx/L, L]; };   // outward normal (ring is clockwise in x-z)
    // podium plinth and stone-clad lobby on pillars (glass inset 2 m behind the pillar line)
    prism(B, ST, kSl, inset(P, -3), -3, 0.6, kSl);
    const PI2 = inset(P, 2.2); prism(B, GL, kGd, PI2, 0.6, H0, null);
    for (let i = 0; i < n; i++){ const a = P[i], b = P[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.round(L/8.5));
      for (let j = 0; j <= k; j++){ if (j === k && i < n) continue; const t = j/k, x = lerp(a[0], b[0], t), z = lerp(a[1], b[1], t), F = Fr(x, z, Math.atan2(b[1] - a[1], b[0] - a[0]), 0); fbox(B, F, ST, kS, 0, -0.9, 1.8, 1.8, 0.6, H0 - 0.6); } }
    prism(B, ST, kS, P, H0 - 1.2, H0, kSl);              // transfer band over the lobby
    // tower shaft in bands (sky lobbies recessed and darker at ~92 m and ~182 m)
    const bands = [[H0, 92], [92, 99, 1], [99, 182], [182, 189, 1], [189, H1]];
    for (const [y0, y1, sky] of bands) prism(B, GL, sky ? kGd : kG, sky ? inset(P, 0.8) : P, y0, y1, null);
    prism(B, ST, kSl, inset(P, 0.3), H1 - 1.0, H1, kR);   // roof slab
    // fins: vertical steel shading fins every 1.5 m; depth grows across each face and down the tower (a gradient)
    for (let i = 0; i < n; i++){ if (!FINS.has(i)) continue;
      const a = P[i], b = P[(i + 1) % n], [nx, nz, L] = out(i), ang = Math.atan2(b[1] - a[1], b[0] - a[0]), m = Math.floor(L/1.5);
      for (let j = 1; j < m; j++){ const t = j/m, x = lerp(a[0], b[0], t), z = lerp(a[1], b[1], t), F = Fr(x, z, ang, 0);
        for (let s = 0; s < 8; s++){ const y0 = H0 + (H1 + 12 - H0)*s/8, y1 = H0 + (H1 + 12 - H0)*(s + 1)/8, dep = 0.25 + 1.05*(0.5 + 0.5*Math.sin(t*PI))*(1 - s/10);
          if (y0 >= 92 && y0 < 99 || y0 >= 182 && y0 < 189) continue;
          // the fin sits proud of the glass: v points inwards for a clockwise ring, so offset along -v
          fbox(B, F, FIN, kF, 0, -dep/2, 0.22, dep, y0, y1 - y0); } } }
    // crown: the glass screen continues to faceted tops (300 m at the east prow), round a glowing diamond event floor
    for (let i = 0; i < n; i++){ const j = (i + 1) % n, a = P[i], b = P[j];
      const A = [a[0], H1, a[1]], Bq = [b[0], H1, b[1]], C = [b[0], TOPS[j], b[1]], E = [a[0], TOPS[i], a[1]];
      B.quad(GLS, kG, A, Bq, C, E);
      // mullion cap along the faceted top edge
      bar(B, FIN, kF, [a[0], TOPS[i], a[1]], [b[0], TOPS[j], b[1]], 0.6); bar(B, FIN, kF, [a[0], H1, a[1]], [a[0], TOPS[i], a[1]], 0.7); }
    const c = pcent(P), DIA = [[c[0] - 20, c[1] + 2], [c[0] - 2, c[1] - 12], [c[0] + 21, c[1] + 4], [c[0] + 2, c[1] + 13]];
    const crown = VB(); prism(crown, CROWN, [1, 1, 1], DIA, H1, H1 + 8, [1, 1, 1]);
    // aviation lights at the crown's high points
    for (const i of [2, 3, 4]){ const p = inset(P, 0.6)[i]; fbox(B, Fr(p[0], p[1], 0, 0), RED, [1, 1, 1], 0, 0, 0.9, 0.9, TOPS[i], 0.9); }
    B.flush(g); crown.flush(g); return g; }};
SG_PLACES.push({type:'szocttower', lat:22.537558, lon:113.977542, rot:0});

// ---------- He Xiangning Art Museum 何香凝美术馆 (1997) ----------
// Low white two-storey stone-and-glass block on its OSM outline (r17068951), a skylit central court, a pool and a shaded
// entrance colonnade on the Shennan Road (north) side.
const HXN_P = [[-33.6, -15.3], [-33.5, -25.4], [-25.2, -21.5], [-16.4, -19.1], [2.7, -18.4], [2.7, -15.1], [34.9, -14.9], [34.7, 14.0], [9.0, 13.9], [8.9, 20.8], [-2.3, 20.7], [-2.3, 23.7], [-17.4, 23.7], [-17.4, 19.8], [-25.6, 19.8], [-25.6, -0.9], [-31.2, -0.9], [-31.1, -15.3]];
LANDMARKS.szhexiangning = {zh:'何香凝美术馆', en:'He Xiangning Art Museum', cat:'new', r:44, h:13, lt:{m:0, c:'#ffe6c4', k:0.75, e:0.6},
  build(){
    const g = new THREE.Group(), B = VB();
    const WH = {c:'#ffffff', vc:true, m:0, lk:0.8, lc:'#ffe9cc'}, GL = {c:'#ffffff', vc:true, m:1, fh:4.2, cw:2.0}, DK = {c:'#ffffff', vc:true, m:0, lk:0},
          WAT = {c:'#7fb4c6'}, LIT = {c:'#f6efe0', glow:'#ffe2b8', gk:0.7};
    const kW = RGB('#eeece6'), kW2 = RGB('#e2dfd6'), kG = RGB('#6f8794'), kR = RGB('#cfccc4'), kSt = RGB('#c9c3b5');
    const P = HXN_P;
    prism(B, WH, kSt, inset(P, -1.2), -2.5, 0.5, kSt);                 // stone plinth
    prism(B, WH, kW, P, 0.5, 9.6, kR);                                  // two storeys of white stone
    prism(B, WH, kW2, inset(P, -0.25), 9.6, 10.4, kW2);                 // coping
    // window bands: a dark glass strip on each storey, set just proud of the walls
    const G1 = inset(P, -0.08);
    for (const [y0, y1] of [[1.6, 3.6], [5.6, 7.9]]) for (let i = 0; i < G1.length; i++){ const a = G1[i], b = G1[(i + 1) % G1.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 6) continue;
      const t0 = 1.4/L, t1 = 1 - 1.4/L; B.quad(GL, kG, [lerp(a[0], b[0], t0), y0, lerp(a[1], b[1], t0)], [lerp(a[0], b[0], t1), y0, lerp(a[1], b[1], t1)], [lerp(a[0], b[0], t1), y1, lerp(a[1], b[1], t1)], [lerp(a[0], b[0], t0), y1, lerp(a[1], b[1], t0)]); }
    // central skylit court: a glass lantern over the middle of the east wing
    const F = Fr(9, -1, 0, 10.4); fpyr(B, F, GL, kG, 0, 0, 16, 13, 0, 2.6, 12, 9); fbox(B, F, WH, kW2, 0, 0, 12.4, 9.4, 2.6, 0.4);
    // entrance colonnade facing north (Shennan Road): thin white columns under a flat canopy, a reflecting pool
    const E = Fr(-12, -19.1, 0, 0);
    for (let i = 0; i < 7; i++) fcyl(B, E, WH, kW, -15 + i*5, -6.5, 0.32, 0.5, 6.5, 8);
    fbox(B, E, WH, kW2, 0, -3.6, 33, 7.6, 7.0, 0.6);
    fbox(B, E, LIT, [1, 1, 1], 0, 0.06, 7, 0.12, 0.6, 4.4);            // lit lobby doors
    fbox(B, Fr(16, -23.5, 0, 0), WH, kSt, 0, 0, 30, 7.5, 0.0, 0.5); fbox(B, Fr(16, -23.5, 0, 0), WAT, [1, 1, 1], 0, 0, 28.6, 6.1, 0.5, 0.06);
    // roof plant behind a screen
    fbox(B, Fr(-14, 6, 0, 10.4), WH, kW2, 0, 0, 9, 6, 0, 2.2);
    B.flush(g); return g; }};
SG_PLACES.push({type:'szhexiangning', lat:22.535975, lon:113.976736, rot:0});
