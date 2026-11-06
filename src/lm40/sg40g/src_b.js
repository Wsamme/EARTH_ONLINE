
// =====================================================================================================
// HSBC TreeTop Walk, MacRitchie (2004, reopened 2021): free-standing steel suspension walkway, 250 m long with a 150 m
// central suspended span and supported approach spans, 0.8 m wide, up to 25 m above the forest floor (sg101.gov.sg,
// littledayout.com, defencepioneer.sg). Laid on the real path line "TreeTop Walk" (OSM, local metres of the ref anchor).
// The app's terrain has no valley under it (70 m grid), so the height above ground is compressed to ~13 m at the towers.
// =====================================================================================================
{
const E0 = [105.9, 30.7], W0 = [-106.0, -30.7];
// ground (local, from the app terrain relative to the model base 49.15 m) along the walk, s = 0 east .. 1 west
const GR = [-9.04, -8.38, -7.49, -6.56, -5.63, -4.67, -3.7, -2.73, -1.91, -2.22];
const grd = s => { const f = clamp(s, 0, 1)*(GR.length - 1), i = Math.min(GR.length - 2, Math.floor(f)); return lerp(GR[i], GR[i + 1], f - i); };
LANDMARKS.sgtreetop = {zh:'麦里芝树顶吊桥', en:'HSBC TreeTop Walk (MacRitchie)', cat:'new', r:130, h:22, lt:{m:0, c:'#cfe0d0', k:0.25, e:0.6},
  build(){
    const g = new THREE.Group(), B = mkB();
    const STEEL = '#6f7a74', STEEL2 = '#56605b', DECK = '#8a8d86', MESH = {c:'#3d4743', op:0.55, ds:true}, CABLE = '#2f3532', CONC = '#a8a497';
    const dx = W0[0] - E0[0], dz = W0[1] - E0[1], L = Math.hypot(dx, dz), ux = dx/L, uz = dz/L, nx = -uz, nz = ux;
    const at = s => [E0[0] + dx*s, E0[1] + dz*s];
    const sT1 = (L - 150)/2/L, sT2 = 1 - sT1;
    const yEnd1 = grd(0) + 5.0, yEnd2 = grd(1) + 5.4, yT1 = grd(sT1) + 13, yT2 = grd(sT2) + 13, SAG = 3.2;
    const deckY = s => s <= sT1 ? lerp(yEnd1, yT1, s/sT1) : s >= sT2 ? lerp(yT2, yEnd2, (s - sT2)/(1 - sT2)) : (() => { const t = (s - sT1)/(sT2 - sT1); return lerp(yT1, yT2, t) - SAG*4*t*(1 - t); })();
    const HW = 0.4, RH = 1.25, N = 110;
    // deck, side mesh and handrails, laid in short straight pieces
    for (let i = 0; i < N; i++){
      const s0 = i/N, s1 = (i + 1)/N, p0 = at(s0), p1 = at(s1), y0 = deckY(s0), y1 = deckY(s1);
      const a = [p0[0] + nx*HW, y0, p0[1] + nz*HW], b = [p1[0] + nx*HW, y1, p1[1] + nz*HW], c = [p1[0] - nx*HW, y1, p1[1] - nz*HW], d = [p0[0] - nx*HW, y0, p0[1] - nz*HW];
      B.quad(DECK, a, b, c, d);
      B.quad(STEEL2, [a[0], a[1] - 0.3, a[2]], [b[0], b[1] - 0.3, b[2]], [c[0], c[1] - 0.3, c[2]], [d[0], d[1] - 0.3, d[2]]);
      for (const sd of [1, -1]){
        const q0 = [p0[0] + nx*HW*sd, y0, p0[1] + nz*HW*sd], q1 = [p1[0] + nx*HW*sd, y1, p1[1] + nz*HW*sd];
        B.quad(MESH, q0, q1, [q1[0], y1 + RH, q1[2]], [q0[0], y0 + RH, q0[2]]);
        B.beam(STEEL, [q0[0], y0 + RH, q0[2]], [q1[0], y1 + RH, q1[2]], 0.04);
        B.beam(STEEL2, [q0[0], y0 - 0.15, q0[2]], [q1[0], y1 - 0.15, q1[2]], 0.06);
        if (i % 2 === 0) B.beam(STEEL, [q0[0], y0, q0[2]], [q0[0], y0 + RH, q0[2]], 0.035);
      }
      // cross frames under the deck
      if (i % 2 === 0) B.beam(STEEL2, [p0[0] + nx*0.7, y0 - 0.35, p0[1] + nz*0.7], [p0[0] - nx*0.7, y0 - 0.35, p0[1] - nz*0.7], 0.05);
    }
    // two steel towers (portal frames with bracing) at the ends of the central span
    const TH = 7.0, TW = 1.6;
    for (const sT of [sT1, sT2]){
      const p = at(sT), yd = deckY(sT), gy = grd(sT) - 3;
      for (const sd of [1, -1]){
        const base = [p[0] + nx*TW*1.8*sd, gy, p[1] + nz*TW*1.8*sd], top = [p[0] + nx*TW*sd, yd + TH, p[1] + nz*TW*sd];
        B.beam(STEEL, base, top, 0.22);
        B.beam(STEEL, [base[0] + ux*2.4, gy, base[2] + uz*2.4], top, 0.16); B.beam(STEEL, [base[0] - ux*2.4, gy, base[2] - uz*2.4], top, 0.16);
        B.box(CONC, base[0], gy - 1, base[2], 2.4, 1.6, 2.4, 0);
      }
      for (const fy of [yd - 1.2, yd + TH - 0.3]) B.beam(STEEL, [p[0] + nx*TW, fy, p[1] + nz*TW], [p[0] - nx*TW, fy, p[1] - nz*TW], 0.18);
      for (let k = 0; k < 4; k++){ const y0 = gy + k*(yd - 1.2 - gy)/4, y1 = gy + (k + 1)*(yd - 1.2 - gy)/4; B.beam(STEEL2, [p[0] + nx*TW*1.8, y0, p[1] + nz*TW*1.8], [p[0] - nx*TW*1.7, y1, p[1] - nz*TW*1.7], 0.07); B.beam(STEEL2, [p[0] - nx*TW*1.8, y0, p[1] - nz*TW*1.8], [p[0] + nx*TW*1.7, y1, p[1] + nz*TW*1.7], 0.07); }
    }
    // main cables (one each side) over the towers, sagging to just above the handrail at mid-span, hangers every ~3 m
    const cabY = s => { const t = (s - sT1)/(sT2 - sT1); return lerp(yT1 + TH, yT2 + TH, t) - (TH - RH - 0.4 + SAG)*4*t*(1 - t) - 0; };
    for (const sd of [1, -1]){
      let prev = null;
      for (let k = 0; k <= 40; k++){ const s = lerp(sT1, sT2, k/40), p = at(s), w = lerp(TW, HW + 0.12, Math.sin(PI*k/40)), q = [p[0] + nx*w*sd, cabY(s), p[1] + nz*w*sd];
        if (prev) B.beam(CABLE, prev, q, 0.06);
        if (k > 0 && k < 40) B.beam(CABLE, q, [p[0] + nx*(HW + 0.02)*sd, deckY(s) - 0.2, p[1] + nz*(HW + 0.02)*sd], 0.018);
        prev = q; }
      // backstays to ground anchors beyond the towers
      for (const [sT, dir] of [[sT1, -1], [sT2, 1]]){ const p = at(sT), top = [p[0] + nx*TW*sd, deckY(sT) + TH, p[1] + nz*TW*sd], sa = sT + dir*0.09, pa = at(sa), anc = [pa[0] + nx*3*sd, grd(sa) - 0.5, pa[1] + nz*3*sd];
        B.beam(CABLE, top, anc, 0.06); B.box(CONC, anc[0], anc[1] - 1.5, anc[2], 2.2, 2.0, 2.2, 0); }
      // lateral stays from the deck out to the hillsides (wind guys) at quarter points of the span
      for (const t of [0.3, 0.5, 0.7]){ const s = lerp(sT1, sT2, t), p = at(s), d0 = [p[0] + nx*HW*sd, deckY(s) - 0.3, p[1] + nz*HW*sd], gs = grd(s), an = [p[0] + nx*16*sd, gs - 0.5, p[1] + nz*16*sd]; B.beam(CABLE, d0, an, 0.025); }
    }
    // approach spans: single steel trestle posts with cross-heads every ~12 m
    for (const [sa, sb] of [[0.02, sT1 - 0.02], [sT2 + 0.02, 0.98]]){
      const n = Math.max(1, Math.round((sb - sa)*L/12));
      for (let k = 0; k <= n; k++){ const s = lerp(sa, sb, k/n), p = at(s), yd = deckY(s), gy = grd(s) - 2;
        B.beam(STEEL, [p[0], gy, p[1]], [p[0], yd - 0.35, p[1]], 0.16);
        B.beam(STEEL2, [p[0] + nx*0.9, yd - 0.4, p[1] + nz*0.9], [p[0] - nx*0.9, yd - 0.4, p[1] - nz*0.9], 0.09);
        B.beam(STEEL2, [p[0] + nx*1.4, gy, p[1] + nz*1.4], [p[0], yd - 2.5, p[1]], 0.06); B.beam(STEEL2, [p[0] - nx*1.4, gy, p[1] - nz*1.4], [p[0], yd - 2.5, p[1]], 0.06);
        B.box(CONC, p[0], gy - 1, p[1], 1.4, 1.2, 1.4, 0); }
    }
    // end landings (stair heads) at both hilltops
    for (const s of [0, 1]){ const p = at(s), yd = deckY(s); B.box(DECK, p[0], yd - 0.25, p[1], 3.2, 0.25, 3.2, -Math.atan2(uz, ux)); B.beam(STEEL, [p[0], grd(s) - 2, p[1]], [p[0], yd - 0.25, p[1]], 0.2); }
    B.flush(g);
    return g; }};
SG_PLACES.push({type:'sgtreetop', lat:1.360995, lon:103.811593, rot:0});
}

// =====================================================================================================
// Toa Payoh Dragon Playground (Lorong 6, 1979, HDB designer Khor Ean Ghee): orange mosaic-tiled dragon in a sand pit, a
// terrazzo-clad head with terrazzo slides, multicoloured steel rings along the body for children to climb through
// (en.wikipedia, roots.gov.sg, littledayout.com). POI only in the data: size and heading are estimated from photos.
// =====================================================================================================
{
LANDMARKS.sgtpdragon = {zh:'大巴窑龙形游乐场', en:'Toa Payoh Dragon Playground', cat:'old', r:16, h:5.2, lt:{m:0, c:'#ffe0b0', k:0.6, e:0.7},
  build(){
    const g = new THREE.Group(), B = mkB();
    const SAND = '#d8c49a', KERB = '#b9b3a6', OR = '#e2742c', OR2 = '#c95a1e', YEL = '#f1c232', WH = '#f4f1e8', TZ = '#b8b5ae', DK = '#2a2420', RINGS = ['#d23b2e', '#f2b02a', '#2e6fb5', '#3d9a4a', '#d23b2e', '#f2b02a'];
    // sand pit with a low kerb
    const pit = []; for (let i = 0; i < 28; i++){ const a = i/28*TAU; pit.push([Math.cos(a)*13.2, Math.sin(a)*6.4]); }
    LPoly(g, offs(pit, 0.5), -3, 3.35, KERB); LPoly(g, pit, -3, 3.3, SAND);
    // head (east end): terrazzo-clad block with snout, open mouth, eyes, horns; slides down both sides
    const hx = 7.6;
    LBox(g, 3.2, 3.6, 3.0, hx, 0.3, 0, OR);
    LBox(g, 2.6, 1.0, 2.6, hx + 2.4, 1.5, 0, OR2);   // upper jaw / snout
    LBox(g, 2.4, 0.5, 2.4, hx + 2.2, 0.55, 0, OR2);  // lower jaw
    LBox(g, 2.2, 0.35, 2.2, hx + 2.2, 1.05, 0, DK);  // open mouth
    for (const s of [-1, 1]){ LSph(g, 0.42, hx + 1.4, 3.5, s*1.0, WH, 1, 10); LSph(g, 0.2, hx + 1.75, 3.55, s*1.05, DK, 1, 8);
      LCone(g, 0.3, 1.4, hx - 0.6, 3.9, s*0.9, YEL, 6); for (let k = 0; k < 4; k++) LBox(g, 0.18, 0.4, 0.18, hx + 3.3, 1.5 - 0.35, s*(0.3 + k*0.28), WH); }
    LBox(g, 3.4, 0.4, 3.2, hx, 3.9, 0, OR2);
    // terrazzo slides from the head platform, both sides
    for (const s of [-1, 1]){ const a = [hx - 0.2, 3.3, s*1.5], b = [hx - 0.2, 0.4, s*5.4]; const w = 0.6;
      B.quad(TZ, [a[0] - w, a[1], a[2]], [a[0] + w, a[1], a[2]], [b[0] + w, b[1], b[2]], [b[0] - w, b[1], b[2]]);
      for (const e of [-w, w]) B.quad(TZ, [a[0] + e, a[1], a[2]], [b[0] + e, b[1], b[2]], [b[0] + e, b[1] + 0.35, b[2]], [a[0] + e, a[1] + 0.35, a[2]]);
      B.quad(TZ, [a[0] - w, a[1] - 0.25, a[2]], [a[0] + w, a[1] - 0.25, a[2]], [b[0] + w, b[1] - 0.25, b[2]], [b[0] - w, b[1] - 0.25, b[2]]); }
    // body: steel-ribbed back - rings of multicoloured steel, spine bars between them, descending to the tail
    const ringX = [4.6, 2.2, -0.2, -2.6, -5.0, -7.2], ringR = [1.55, 1.5, 1.45, 1.35, 1.2, 1.0];
    for (let k = 0; k < ringX.length; k++){
      const x = ringX[k], R = ringR[k], c = RINGS[k], yc = R + 0.2; let prev = null;
      for (let j = 0; j <= 18; j++){ const a = j/18*TAU, p = [x, yc + Math.sin(a)*R, Math.cos(a)*R]; if (prev) B.beam(c, prev, p, 0.07); prev = p; }
      for (let j = 0; j < 4; j++){ const y = 0.5 + j*0.55; if (y > yc + R - 0.2) break; B.beam(c, [x - 0.02, y, -R*0.85], [x + 0.02, y, R*0.85], 0.04); }
    }
    for (const a of [HP, HP - 0.6, HP + 0.6]) { let prev = null; for (let k = 0; k < ringX.length; k++){ const R = ringR[k], p = [ringX[k], R + 0.2 + Math.sin(a)*R, Math.cos(a)*R]; if (prev) B.beam(OR2, prev, p, 0.06); prev = p; } B.beam(OR2, [ringX[0], ringR[0] + 0.2 + Math.sin(a)*ringR[0], Math.cos(a)*ringR[0]], [hx - 1.6, 2.9, Math.cos(a)*1.2], 0.06); }
    // tail
    LBox(g, 2.2, 0.9, 1.0, -9.0, 0.3, 0, OR); LCone(g, 0.6, 1.6, -10.4, 0.3, 0, OR2, 6);
    LBox(g, 1.2, 0.5, 0.7, -10.2, 1.2, 0, YEL);
    B.flush(g);
    return g; }};
SG_PLACES.push({type:'sgtpdragon', lat:1.331937, lon:103.854387, rot:0});
}

// =====================================================================================================
// Johor-Singapore Causeway (1919-23, opened 1924): 1,056 m rubble embankment across the Johor Strait (granite from
// Pulau Ubin and Bukit Timah), widened 1964, 1976 and 1989-91 (en.wikipedia, BiblioAsia 2024, NLB Infopedia).
// The app draws the carriageways; this model is the embankment: armour-rock revetments on both flanks along the real
// shoreline of the causeway strip in the app's data, kerb walls and street lamps. Two keys along the line:
// sgcauseway (Woodlands shore to the international boundary) and sgcausewayn (the Johor half up to the bridge, label:false).
// =====================================================================================================
{
function cwBuild(ox, oz, z0, z1){
  const g = new THREE.Group(), B = mkB(), r = LMCTX.rng;
  const ROCK = '#7c766b', ROCK2 = '#5e5a52', ROCK3 = '#9a9488', KERB = '#cfccc3', POLE = '#7d8286', LAMP = {c:'#f3efe0', glow:'#ffd9a0', gk:1.6};
  const YT = 0.9, YB = -4.8, RUN = 7.5, YR = -0.65;
  for (const [E, out] of [[CW_W, -1], [CW_E, 1]]){
    const P = E.filter(p => p[1] <= z0 && p[1] >= z1).map(p => [p[0] - ox, p[1] - oz]);
    if (P.length < 2) continue;
    // outward normals (pointing away from the strip)
    const N = P.map((p, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; let nx = -dz/l, nz = dx/l; if (nx*out < 0){ nx = -nx; nz = -nz; } return [nx, nz]; });
    for (let i = 0; i < P.length - 1; i++){
      const a = P[i], b = P[i + 1], na = N[i], nb = N[i + 1];
      const at = [a[0], YT, a[1]], bt = [b[0], YT, b[1]], ab = [a[0] + na[0]*RUN, YB, a[1] + na[1]*RUN], bb = [b[0] + nb[0]*RUN, YB, b[1] + nb[1]*RUN];
      B.quad(i % 3 ? ROCK : ROCK2, at, bt, bb, ab);
      // crest strip between the kerb and the slope
      B.quad(ROCK3, [a[0] - na[0]*1.2, YT + 0.05, a[1] - na[1]*1.2], [b[0] - nb[0]*1.2, YT + 0.05, b[1] - nb[1]*1.2], bt, at);
      // kerb wall
      const ka = [a[0] - na[0]*1.2, a[1] - na[1]*1.2], kb = [b[0] - nb[0]*1.2, b[1] - nb[1]*1.2];
      B.quad(KERB, [ka[0], YR, ka[1]], [kb[0], YR, kb[1]], [kb[0], YT + 1.05, kb[1]], [ka[0], YT + 1.05, ka[1]]);
      B.quad(KERB, [ka[0] - na[0]*0.3, YT + 1.05, ka[1] - na[1]*0.3], [kb[0] - nb[0]*0.3, YT + 1.05, kb[1] - nb[1]*0.3], [kb[0], YT + 1.05, kb[1]], [ka[0], YT + 1.05, ka[1]]);
      // armour rocks on the slope
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(L/1.6);
      for (let k = 0; k < n; k++){ const t = (k + r())/n, u = 0.15 + r()*0.85, x = lerp(a[0], b[0], t) + lerp(na[0], nb[0], t)*RUN*u, z = lerp(a[1], b[1], t) + lerp(na[1], nb[1], t)*RUN*u, y = lerp(YT, YB, u), s = 0.7 + r()*0.8;
        B.box(r() < 0.5 ? ROCK2 : ROCK3, x, y - s*0.4, z, s*1.6, s, s*1.3, r()*PI); }
    }
    // street lamps along the kerb, ~40 m apart, arm over the carriageway
    let acc = 20;
    for (let i = 0; i < P.length - 1; i++){
      const a = P[i], b = P[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), na = N[i];
      while (acc < L){ const t = acc/L, x = lerp(a[0], b[0], t) - na[0]*1.6, z = lerp(a[1], b[1], t) - na[1]*1.6;
        B.beam(POLE, [x, YR, z], [x, YT + 10, z], 0.11); B.beam(POLE, [x, YT + 10, z], [x - na[0]*2.2, YT + 10.4, z - na[1]*2.2], 0.07);
        B.box(LAMP, x - na[0]*2.4, YT + 10.0, z - na[1]*2.4, 0.9, 0.25, 0.45, -Math.atan2(-na[1], -na[0]));
        acc += 40; }
      acc -= L;
    }
  }
  B.flush(g);
  return g;
}
// key 1: Woodlands shore to the boundary (z +60 .. -385 in the ref frame); local origin at ref (-20, -172)
LANDMARKS.sgcauseway = {zh:'新柔长堤', en:'Johor–Singapore Causeway', cat:'old', r:238, h:10, lt:{m:0, c:'#ffd9a8', k:0.3, e:0.5},
  build(){ return cwBuild(-20, -172, 62, -385); }};
SG_PLACES.push({type:'sgcauseway', lat:1.449101 + 172/110574, lon:103.769974 - 20/111290.5, rot:0});
// key 2: the Johor half up to the bridge over the old lock channel (z -385 .. -565); local origin at ref (-130, -478)
LANDMARKS.sgcausewayn = {zh:'新柔长堤（柔佛段）', en:'Johor–Singapore Causeway (Johor half)', cat:'old', r:128, h:10, label:false, lt:{m:0, c:'#ffd9a8', k:0.3, e:0.5},
  build(){ return cwBuild(-130, -478, -380, -566); }};
SG_PLACES.push({type:'sgcausewayn', lat:1.449101 + 478/110574, lon:103.769974 - 130/111290.5, rot:0});
}
