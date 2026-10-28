
// ================= China Resources Tower (华润大厦, "Spring Bamboo", Houhai; KPF / Arup, 2018) =================
// OSM w529272473: a circle 73.3 m across (r 36.6). 392.5 m, top floor 345 m, 68 floors (Wikipedia). 56 slender external steel
// columns ring the column-free round floors (WSP, KPF via Dezeen); at the base they gather into a diagrid whose triangles frame the
// entrance portals; near the top the diagrid is followed by 28 columns that rise on and close over a 68.4 m high sky hall (Dezeen).
// The drum bulges a little and draws in to the bamboo-shoot point. Night: the columns are lines of white light; in the bay light
// show they take the show colours (anim 'show'); the sky hall glows; aviation light on the tip.
const CR_R = prof([[0, 35.9], [26, 36.4], [90, 36.7], [170, 36.6], [225, 35.6], [258, 33.8], [286, 31.2], [310, 28.2], [330, 24.9], [346, 21.4], [358, 17.8], [368, 14.0], [376, 10.4], [382, 7.1], [387, 4.1], [390.5, 1.8], [392.5, 0.05]]);
LANDMARKS.hkcrtower = {zh:'华润大厦', en:'China Resources Tower', cat:'new', r:40, h:392.5, lt:{m:1, c:'#e8f0ff', k:0.85, anim:'show', c2:'#78c6ff'},
  build(){
    const g = new THREE.Group(), B = Bt(), H = 392.5, NS = 56, dA = TAU/NS, CD = 1.45;
    const GL = {c:'#8fa1ad', m:1, fh:4.5, cw:3.2}, HALL = {c:'#b4c6d2', m:0, lk:0.5, glow:'#dfeaff', gk:0.42}, COL = {c:'#e4e5e2', m:0, lk:0.8, glow:'#e6eeff', gk:0.2},
      BASE = {c:'#b8b2a7', lk:0.35}, DARK = {c:'#3c454c'}, SOFF = {c:'#d9d6cf', m:0, lk:0.7};
    const P = (th, y, dr) => { const r = Math.max(0.05, CR_R(y) + (dr || 0)); return [Math.cos(th)*r, y, Math.sin(th)*r]; };
    const N = th => [Math.cos(th), Math.sin(th)];
    const Y1 = 272, Y2 = 300, Y3 = 324;                     // diagrid band 272-324 m, 28 columns above (sky hall 324-392.5)
    // glass drum (lit windows) to 324 m, then the sky-hall glazing to the tip
    const ring = (y, dr, n) => { const R = []; for (let k = 0; k < n; k++) R.push(P((k + 0.5)/n*TAU, y, dr)); return R; };
    loft(B, GL, [0, 10, 40, 90, 140, 190, 230, 258, 286, 310, Y3].map(y => ring(y, -CD, NS)));
    loft(B, HALL, [Y3, 336, 346, 358, 368, 376, 382, 387, 390.5].map(y => ring(y, -CD*0.8, 28)), [0, 391.2, 0]);
    // lobby: dark glass recess at the foot of the portals, a stone plinth ring and a soffit
    loft(B, DARK, [0, 14].map(y => ring(y, -CD - 0.6, NS)));
    loft(B, BASE, [-4, 0.4].map(y => ring(y, 3.5, NS)));
    // ---- the 56 columns ----
    const wC = y => y < Y1 ? 0.6 : 0.5;                     // half width (m)
    const colPath = (k, ys, thOf) => { const pts = [], outs = [], ws = []; for (const y of ys){ const th = thOf(y); pts.push(P(th, y)); outs.push(N(th)); ws.push(wC(y)); } rib(B, COL, pts, outs, CD, ws); };
    const ysMid = [0, 4, 8, 12, 16, 20, 24, 28, 40, 70, 110, 150, 190, 225, 250, Y1];
    for (let k = 0; k < NS; k++){
      const th0 = k*dA, pc = (Math.floor(k/2)*2 + 0.5)*dA;          // pairs (2j, 2j+1) meet at the ground: V's with portal triangles between
      colPath(k, ysMid, y => y >= 28 ? th0 : lerp(pc, th0, Math.pow(y/28, 0.8)));
    }
    // ---- diagrid band: 56 nodes at Y1 -> 56 nodes at Y2 (offset half a bay) -> 28 nodes at Y3 ----
    const seg3 = (thA, yA, thB, yB) => { const n = 4, pts = [], outs = [], ws = []; for (let i = 0; i <= n; i++){ const t = i/n, th = lerp(thA, thB, t), y = lerp(yA, yB, t); pts.push(P(th, y)); outs.push(N(th)); ws.push(0.5); } rib(B, COL, pts, outs, CD, ws); };
    for (let k = 0; k < NS; k++){ const th = k*dA; seg3(th, Y1, th + dA/2, Y2); seg3(th, Y1, th - dA/2, Y2); }
    for (let k = 0; k < NS; k++){ const th = (k + 0.5)*dA, j = Math.floor(k/2); const tt = (j*2 + 1)*dA; seg3(th, Y2, tt, Y3); }
    // ring beams at the diagrid nodes
    for (const y of [Y1, Y2, Y3]){ const R0 = [], R1 = []; for (let k = 0; k <= NS; k++){ const th = k*dA; R0.push(P(th, y - 0.6, 0.02)); R1.push(P(th, y + 0.6, 0.02)); } for (let k = 0; k < NS; k++) B.q(COL, R0[k], R0[k + 1], R1[k + 1], R1[k]); }
    // ---- 28 columns over the sky hall, closing to the point ----
    const ysTop = [Y3, 336, 346, 358, 368, 376, 382, 387, 390.5];
    for (let j = 0; j < 28; j++){ const th = (j*2 + 1)*dA; const pts = [], outs = [], ws = []; for (const y of ysTop){ pts.push(P(th, y)); outs.push(N(th)); ws.push(lerp(0.55, 0.22, (y - Y3)/(390.5 - Y3))); } rib(B, COL, pts, outs, Math.min(CD, 1.2), ws); }
    // the tip
    loft(B, COL, [ring(390.0, 0.25, 12), ring(392.0, -1.2, 12)], [0, H, 0]);
    const AV = avia(B, g, [[0, H, 0]]);
    B.flush(g); lights(g, AV, [1, 0.16, 0.1], 16);
    return g;
  }};
SG_PLACES.push({type:'hkcrtower', lat:22.517785, lon:113.941611, rot:0});
