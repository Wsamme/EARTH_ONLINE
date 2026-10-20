// ===== lm18/b: museums and Bugis — National Museum of Singapore, Old Hill Street Police Station, Asian Civilisations Museum
// (Empress Place Building), DUO, Parkview Square, National Library. Block-scoped: only LANDMARKS and SG_PLACES are touched.
// Real dimensions in metres, y = 0 is the ground (main floor) level; plans are the real OSM footprints in each model's frame.
{
const PI = Math.PI, HP = PI/2, TAU = PI*2;
const lerp = (a, b, t) => a + (b - a)*t, cl01 = t => t < 0 ? 0 : t > 1 ? 1 : t;
// triangle batches: many small parts of one colour spec become one LTris call
// (a growable Float32Array keeps the big batches out of the garbage collector's way)
const FBuf = function(){ this.a = new Float32Array(4608); this.n = 0; }
FBuf.prototype.push = function(){ const k = arguments.length; if (this.n + k > this.a.length){ const b = new Float32Array(Math.max(this.a.length*2, this.n + k)); b.set(this.a); this.a = b; } for (let i = 0; i < k; i++) this.a[this.n++] = arguments[i]; return this.n; };
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:new FBuf()}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.n) LTris(g, e.a.a.subarray(0, e.a.n), e.col); M.clear(); } }; };
const quadP = (o, a, b, c, d) => o.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2]);
const triP = (o, a, b, c) => o.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
// box (w along x, d along z) standing on y, turned ry, into a batch
const boxP = function(o, w, h, d, x, y, z, ry){
  const R = rotP(x, z, ry || 0), hw = w/2, hd = d/2;
  const P = [R(-hw, y, -hd), R(hw, y, -hd), R(hw, y, hd), R(-hw, y, hd), R(-hw, y+h, -hd), R(hw, y+h, -hd), R(hw, y+h, hd), R(-hw, y+h, hd)];
  for (const [a, b, c, e] of [[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]) quadP(o, P[a], P[b], P[c], P[e]);
}
// n-sided prism round the segment a-b
const segP = function(o, a, b, r, n){
  n = n || 4; const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2], L = Math.hypot(dx, dy, dz); if (L < 1e-4) return;
  const d = [dx/L, dy/L, dz/L], up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let ux = d[1]*up[2]-d[2]*up[1], uy = d[2]*up[0]-d[0]*up[2], uz = d[0]*up[1]-d[1]*up[0]; const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
  const vx = d[1]*uz-d[2]*uy, vy = d[2]*ux-d[0]*uz, vz = d[0]*uy-d[1]*ux;
  const ring = p => { const R = []; for (let i = 0; i < n; i++){ const t = (i + 0.5)/n*TAU, c = Math.cos(t)*r, s = Math.sin(t)*r; R.push([p[0]+ux*c+vx*s, p[1]+uy*c+vy*s, p[2]+uz*c+vz*s]); } return R; };
  const A = ring(a), Bq = ring(b);
  for (let i = 0; i < n; i++){ const j = (i+1) % n; quadP(o, A[i], A[j], Bq[j], Bq[i]); }
}
// plan polygons ([x, z] points)
const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const wallsP = (o, P, y0, y1) => { for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; quadP(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); } };
const V2 = p => new THREE.Vector2(p[0], p[1]);
const capP = function(o, P, y, holes){ const H = holes || [], tri = THREE.ShapeUtils.triangulateShape(P.map(V2), H.map(h => h.map(V2))), A = P.concat(...H); for (const t of tri) for (const i of t) o.push(A[i][0], y, A[i][1]); }
const prismP = function(o, P, y0, y1, bottom){ wallsP(o, P, y0, y1); capP(o, P, y1); if (bottom) capP(o, P, y0); }
const cenP = P => { let x = 0, z = 0; for (const p of P){ x += p[0]; z += p[1]; } return [x/P.length, z/P.length]; };
// offset a simple polygon outward by d (miter joins)
const offP = function(P, d){
  const n = P.length, c = cenP(P), out = [];
  let A = 0; for (let i = 0; i < n; i++){ const a = P[i], b = P[(i+1) % n]; A += a[0]*b[1] - b[0]*a[1]; } const s = A > 0 ? 1 : -1;
  for (let i = 0; i < n; i++){
    const p = P[(i + n - 1) % n], q = P[i], r = P[(i+1) % n];
    const e1 = [q[0]-p[0], q[1]-p[1]], e2 = [r[0]-q[0], r[1]-q[1]], l1 = Math.hypot(...e1) || 1, l2 = Math.hypot(...e2) || 1;
    const n1 = [s*e1[1]/l1, -s*e1[0]/l1], n2 = [s*e2[1]/l2, -s*e2[0]/l2], m = [n1[0]+n2[0], n1[1]+n2[1]], ml = Math.hypot(...m) || 1;
    const k = d/Math.max(0.35, (m[0]*n1[0] + m[1]*n1[1])/ml); out.push([q[0] + m[0]/ml*k, q[1] + m[1]/ml*k]);
  }
  return out;
}
// wall frame along a -> b ([x, z]); n points away from `ins` (a point inside the building)
const WF = function(a, b, ins){
  const dx = b[0]-a[0], dz = b[1]-a[1], L = Math.hypot(dx, dz), u = [dx/L, dz/L]; let n = [u[1], -u[0]];
  if (ins && n[0]*(ins[0]-a[0]) + n[1]*(ins[1]-a[1]) > 0) n = [-n[0], -n[1]];
  return {a, b, u, n, L, ry:Math.atan2(-u[1], u[0]), P:(t, y, d) => [a[0] + u[0]*t + n[0]*(d || 0), y, a[1] + u[1]*t + n[1]*(d || 0)]};
}
const wbox = (o, F, t, y, w, h, d0, dep) => { const c = F.P(t, 0, d0 + dep/2); boxP(o, w, h, Math.abs(dep), c[0], y, c[2], F.ry); };
const wquad = (o, F, t0, t1, y0, y1, d) => quadP(o, F.P(t0, y0, d), F.P(t1, y0, d), F.P(t1, y1, d), F.P(t0, y1, d));
// arched (round-topped) panel centred at t, width w, from y0 up to the crown y1, at wall offset d
const warch = function(o, F, t, w, y0, y1, d, n){
  n = n || 6; const r = w/2, ys = y1 - r, pts = [[t - r, y0], [t + r, y0], [t + r, ys]];
  for (let i = 1; i < n; i++){ const a = PI*i/n; pts.push([t + Math.cos(a)*r, ys + Math.sin(a)*r]); } pts.push([t - r, ys]);
  const c = F.P(t, (y0 + ys)/2, d); for (let i = 0; i < pts.length; i++){ const p = pts[i], q = pts[(i+1) % pts.length]; triP(o, c, F.P(p[0], p[1], d), F.P(q[0], q[1], d)); }
}
// solid arch ring: the voussoir band round a round-headed opening (w wide, crown y1), band width bw, projecting dep
const warchRing = function(o, F, t, w, y1, bw, d0, dep, n){
  n = n || 6; const r = w/2, ys = y1 - r;
  for (let i = 0; i < n; i++){ const a0 = PI*i/n, a1 = PI*(i+1)/n;
    const P = (a, rr, d) => F.P(t + Math.cos(a)*rr, ys + Math.sin(a)*rr, d);
    quadP(o, P(a0, r, d0 + dep), P(a0, r + bw, d0 + dep), P(a1, r + bw, d0 + dep), P(a1, r, d0 + dep));
    quadP(o, P(a0, r + bw, d0), P(a1, r + bw, d0), P(a1, r + bw, d0 + dep), P(a0, r + bw, d0 + dep)); }
}
// triangular pediment prism: base t0..t1 at y, apex height h, from wall offset d0 projecting dep
const wped = function(o, F, t0, t1, y, h, d0, dep){
  const tm = (t0 + t1)/2, A = F.P(t0, y, d0 + dep), Bq = F.P(t1, y, d0 + dep), C = F.P(tm, y + h, d0 + dep), A0 = F.P(t0, y, d0), B0 = F.P(t1, y, d0), C0 = F.P(tm, y + h, d0);
  triP(o, A, Bq, C); quadP(o, A, C, C0, A0); quadP(o, C, Bq, B0, C0); quadP(o, A0, B0, Bq, A);
}
// hipped roof (ridge along the longer side) and gable roof (ridge along local x) into batches
const hipP = function(o, cx, cz, L, W, y, h, ry, over){
  if (W > L) return hipP(o, cx, cz, W, L, y, h, (ry || 0) + HP, over);
  const R = rotP(cx, cz, ry || 0), hl = L/2 + (over || 0), hw = W/2 + (over || 0), k = Math.max(0, hl - hw);
  const A = R(-hl, y, -hw), Bq = R(hl, y, -hw), C = R(hl, y, hw), D = R(-hl, y, hw), r1 = R(-k, y + h, 0), r2 = R(k, y + h, 0);
  quadP(o, A, Bq, r2, r1); quadP(o, C, D, r1, r2); triP(o, D, A, r1); triP(o, Bq, C, r2);
}
const gableP = function(o, ow, cx, cz, L, W, y, h, ry, over){
  const R = rotP(cx, cz, ry || 0), hl = L/2, hw = W/2 + (over || 0);
  const A = R(-hl, y, -hw), Bq = R(hl, y, -hw), C = R(hl, y, hw), D = R(-hl, y, hw), r1 = R(-hl, y + h, 0), r2 = R(hl, y + h, 0);
  quadP(o, A, Bq, r2, r1); quadP(o, C, D, r1, r2);
  const w0 = R(-hl, y, -W/2), w1 = R(-hl, y, W/2), w2 = R(hl, y, -W/2), w3 = R(hl, y, W/2);
  triP(ow, w0, w1, r1); triP(ow, w2, w3, r2);
}
// surface of revolution into a batch: profile [[r, y], ...]
const latheP = function(o, prof, cx, y0, cz, n, a0, a1){
  a0 = a0 || 0; a1 = a1 === undefined ? TAU : a1;
  for (let i = 0; i < n; i++){ const t0 = a0 + (a1 - a0)*i/n, t1 = a0 + (a1 - a0)*(i+1)/n;
    for (let j = 0; j < prof.length - 1; j++){ const [r0, h0] = prof[j], [r1, h1] = prof[j+1], P = (r, h, a) => [cx + Math.cos(a)*r, y0 + h, cz + Math.sin(a)*r];
      quadP(o, P(r0, h0, t0), P(r0, h0, t1), P(r1, h1, t1), P(r1, h1, t0)); } }
}
// balustrade along a wall frame from t0 to t1: base rail, balusters, top rail, pedestals at the given positions
const balP = function(o, F, t0, t1, y, d, h, posts){
  h = h || 1.15; wbox(o, F, (t0 + t1)/2, y, t1 - t0, 0.22, d - 0.3, 0.42); wbox(o, F, (t0 + t1)/2, y + h - 0.2, t1 - t0, 0.2, d - 0.32, 0.44);
  for (let t = t0 + 0.3; t < t1 - 0.2; t += 0.5) wbox(o, F, t, y + 0.22, 0.17, h - 0.42, d - 0.25, 0.25);
  for (const t of posts || []) wbox(o, F, t, y, 0.62, h + 0.08, d - 0.36, 0.5);
}

// =====================================================================================================================
// National Museum of Singapore (1887, H. E. McCallum; 1907 rear range, 1916 wing; 2006 extension by W Architects).
// The neo-Palladian front block faces Stamford Road (north-east): 74 m long, two tall storeys with Doric pilasters below
// and Ionic above, pedimented windows, balustraded parapet, pedimented end pavilions, a carriage porch and behind it the
// 16-sided rotunda drum with its stained-glass windows and the fish-scale zinc dome (27 m). Behind: the parallel 1907 range
// (with the 1916 wing to the south-east) and the glass-and-steel extension towards Fort Canning: the 11 m Glass Passage,
// the 24 m x 16 m Glass Rotunda and the perforated-metal wing. Local +z = north-east (Stamford Road front), +x = north-west.
// The site rises towards Fort Canning: everything stands on a stone plinth that runs down to y = -6.
LANDMARKS.natmuseum = {zh:'新加坡国家博物馆', en:'National Museum of Singapore', cat:'old', r:94, h:27.5,
  lt:{m:0, c:'#ffd6a0', k:0.9, e:0.25}, build(){
  const g = new THREE.Group(), B = mkB();
  const wall = '#ebe4d2', trim = '#f6f2e8', dark = '#3d4146', roof = '#8a5646', zinc = {c:'#a3aaae', lk:1.5}, stone = '#cdc4b0';
  const glass = {c:'#9db8c4', glow:'#fff0d8', gk:0.28}, steel = '#e4e6e4', mesh = '#9a9d9b', perf = '#b7b1a3';
  const W = B.p(wall), T = B.p(trim), DK = B.p(dark), RF = B.p(roof), ST = B.p(stone);
  const AX = -6.45;                                            // the axis of the front block (rotunda, porch)
  const F0 = 0.9, G1 = 6.6, S1 = 7.3, U1 = 12.9, E1 = 14.3;   // plinth top, ground storey, string course, upper storey, cornice
  // a classical two-storey facade on wall frame F from t0 to t1 with nb bays
  const facade = (F, t0, t1, nb, o) => {
    o = o || {}; const bw = (t1 - t0)/nb;
    wbox(T, F, (t0 + t1)/2, G1, t1 - t0 + 0.6, S1 - G1, 0, 0.3);                       // string course
    wbox(T, F, (t0 + t1)/2, U1, t1 - t0 + 0.6, E1 - U1 - 0.4, 0, 0.22);                // frieze
    wbox(T, F, (t0 + t1)/2, E1 - 0.42, t1 - t0 + 1.2, 0.42, 0, 0.62);                  // cornice
    wbox(ST, F, (t0 + t1)/2, -6, t1 - t0 + 0.6, F0 + 6, 0, 0.32);                      // plinth
    for (let i = 0; i <= nb; i++){ const t = t0 + i*bw;
      if (!o.noPil){ wbox(T, F, t, F0, 0.85, G1 - F0, 0, 0.26); wbox(T, F, t, S1, 0.72, U1 - S1, 0, 0.22); wbox(T, F, t, U1 - 0.45, 1.0, 0.45, 0, 0.32); } }
    for (let i = 0; i < nb; i++){ const t = t0 + (i + 0.5)*bw;
      if (o.door && i === (nb >> 1)) { warch(DK, F, t, 2.6, F0, 5.9, 0.04); warchRing(T, F, t, 2.6, 5.9, 0.35, 0, 0.12); }
      else { warch(DK, F, t, 1.7, 1.9, 5.5, 0.04); warchRing(T, F, t, 1.7, 5.5, 0.3, 0, 0.1); wbox(T, F, t, 1.7, 2.1, 0.22, 0, 0.18); }
      wquad(DK, F, t - 0.82, t + 0.82, 8.3, 11.4, 0.04); wbox(T, F, t, 8.1, 2.1, 0.2, 0, 0.18);
      wbox(T, F, t - 0.95, 8.3, 0.22, 3.1, 0, 0.1); wbox(T, F, t + 0.95, 8.3, 0.22, 3.1, 0, 0.1);
      if (i % 2) wped(T, F, t - 1.25, t + 1.25, 11.6, 0.75, 0, 0.22); else wbox(T, F, t, 11.6, 2.4, 0.35, 0, 0.24);
    }
    if (o.bal) { const posts = []; for (let i = 0; i <= nb; i++) posts.push(t0 + i*bw); balP(T, F, t0, t1, E1, 0, 1.15, posts); }
  };
  // a rectangular block: walls, plinth, facades on chosen sides, roof
  const block = (x0, z0, x1, z1, sides, o) => {
    o = o || {}; const P = rect(x0, z0, x1, z1), c = [(x0 + x1)/2, (z0 + z1)/2];
    prismP(W, P, -6, o.top || E1);
    const Fs = {n:WF([x0, z0], [x1, z0], c), s:WF([x1, z1], [x0, z1], c), w:WF([x0, z1], [x0, z0], c), e:WF([x1, z0], [x1, z1], c)};
    for (const k in sides) if (sides[k]) { const F = Fs[k]; facade(F, 0, F.L, sides[k], o); }
    return Fs;
  };
  // ---- front block (1887) ----
  const ZP0 = 27.0, ZP1 = 42.3, ZW0 = 28.6, ZW1 = 40.7;
  const pav = s => { const x0 = s < 0 ? AX - 36.95 : AX + 24.55, x1 = x0 + 12.4;
    const Fs = block(x0, ZP0, x1, ZP1, {s:3, n:3, [s < 0 ? 'w' : 'e']:3}, {bal:false});
    // pediment on the front (the Victorian coat of arms is left out), roof ridge running back from it
    const F = Fs.s; wped(T, F, -0.4, F.L + 0.4, E1, 3.7, 0, 0.7); wped(W, F, 0.6, F.L - 0.6, E1 + 0.42, 2.9, 0.05, 0.6);
    gableP(RF, W, (x0 + x1)/2, (ZP0 + ZP1)/2, ZP1 - ZP0 - 0.4, x1 - x0 + 0.4, E1, 3.7, HP, 0.2);
    const Fb = Fs[s < 0 ? 'w' : 'e']; balP(T, Fb, 0.3, Fb.L - 0.3, E1, 0, 1.15, [0.3, Fb.L - 0.3]);
    // paired corner pilasters
    for (const t of [0.35, F.L - 0.35]) { wbox(T, F, t, F0, 1.2, G1 - F0, 0, 0.4); wbox(T, F, t, S1, 1.1, U1 - S1, 0, 0.35); }
  };
  pav(-1); pav(1);
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? AX - 24.55 : AX + 11.2, x1 = s < 0 ? AX - 11.2 : AX + 24.55;
    block(x0, ZW0, x1, ZW1, {s:3, n:3}, {bal:true});
    hipP(RF, (x0 + x1)/2, (ZW0 + ZW1)/2, x1 - x0 + 0.2, ZW1 - ZW0 + 0.2, E1, 3.0, 0, 0);
  }
  // centre block with the rotunda and the carriage porch
  const XC0 = AX - 11.2, XC1 = AX + 11.2, ZC0 = 23.7, ZC1 = 45.4, CZ = 34.6;
  { const Fs = block(XC0, ZC0, XC1, ZC1, {s:5}, {door:true, top:E1 + 1.2});
    const F = Fs.s; wbox(W, F, F.L/2, E1, F.L, 1.6, 0, 0.3); // attic in front of the drum
    // porch: three arches in front, one each side; columned loggia above; pediment
    const px0 = AX - 7.5, px1 = AX + 7.5, pz1 = 52.2;
    prismP(W, rect(px0, ZC1, px1, pz1), -6, E1);
    const Fp = WF([px1, pz1], [px0, pz1], [AX, ZC1]), Fl = WF([px0, pz1], [px0, ZC1], [AX, ZC1]), Fr = WF([px1, ZC1], [px1, pz1], [AX, ZC1]);
    for (const [Fx, n] of [[Fp, 3], [Fl, 1], [Fr, 1]]) {
      const bw = Fx.L/n; wbox(ST, Fx, Fx.L/2, -6, Fx.L + 0.6, F0 + 6, 0, 0.32);
      for (let i = 0; i < n; i++){ const t = (i + 0.5)*bw; warch(DK, Fx, t, bw*0.62, F0, 5.8, 0.05); warchRing(T, Fx, t, bw*0.62, 5.8, 0.4, 0, 0.15); }
      for (let i = 0; i <= n; i++) wbox(T, Fx, i*bw, F0, 1.0, G1 - F0, 0, 0.35);
      wbox(T, Fx, Fx.L/2, G1, Fx.L + 0.7, S1 - G1, 0, 0.36);
      wquad(DK, Fx, 0.6, Fx.L - 0.6, S1 + 0.3, U1 - 0.2, 0.05);
      wbox(T, Fx, Fx.L/2, U1, Fx.L + 0.6, E1 - U1 - 0.4, 0, 0.25); wbox(T, Fx, Fx.L/2, E1 - 0.42, Fx.L + 1.2, 0.42, 0, 0.66);
    }
    // the loggia columns (paired, Corinthian-ish) standing in front of the dark recess
    for (const t of [0.7, 1.7, 5.2, 6.2, 8.8, 9.8, 13.3, 14.3]) { const c = Fp.P(t, 0, 0.5); LCyl(g, 0.34, 0.38, U1 - S1 - 0.6, c[0], S1, c[2], trim, 10); boxP(T, 0.95, 0.6, 0.95, c[0], U1 - 0.6, c[2]); }
    balP(T, Fp, 0.6, Fp.L - 0.6, S1 + 0.2, 0.55, 1.0, [0.6, 4.0, 11.0, 14.4]);
    wped(T, Fp, -0.5, Fp.L + 0.5, E1, 3.1, 0, 0.75); wped(W, Fp, 0.6, Fp.L - 0.6, E1 + 0.42, 2.4, 0.05, 0.6);
    // front steps down to the lawn
    for (let k = 0; k < 8; k++) boxP(ST, 19 - k*0.0, 0.5, 6.8 - k*0.75, AX, -4.1 + k*0.5, pz1 + 3.4 - k*0.375);
    // the rotunda: 16-sided drum with arched stained-glass windows, cornice, fish-scale zinc dome with ribs, lantern
    const RD = 8.2, Y0 = E1 + 0.4, Y1 = 20.6, nS = 16, glassS = {c:'#6d5a3e', glow:'#ffbe6a', gk:0.9};
    latheP(W, [[RD, 0], [RD, Y1 - Y0]], AX, Y0, CZ, nS);
    for (let i = 0; i < nS; i++){ const a = (i + 0.5)/nS*TAU, ca = Math.cos(a), sa = Math.sin(a), ux = -sa, uz = ca;
      const Fd = {P:(t, y, d) => [AX + ca*(RD + (d || 0)) + ux*t, y, CZ + sa*(RD + (d || 0)) + uz*t], ry:Math.atan2(-uz, ux)};
      warch(B.p(glassS), Fd, 0, 1.45, Y0 + 1.1, Y1 - 0.9, 0.04); warchRing(T, Fd, 0, 1.45, Y1 - 0.9, 0.22, 0, 0.1);
      const b = i/nS*TAU, c0 = [AX + Math.cos(b)*RD, 0, CZ + Math.sin(b)*RD]; boxP(T, 0.7, Y1 - Y0, 0.7, c0[0], Y0, c0[2], -b); }
    latheP(T, [[RD + 0.1, 0], [RD + 0.75, 0.25], [RD + 0.75, 0.6], [RD, 0.6]], AX, Y1, CZ, 32);
    const dome = []; for (let k = 0; k <= 10; k++){ const th = k/10*HP; dome.push([Math.max(0.01, RD*Math.cos(th)), 0.6 + 4.6*Math.sin(th)]); }
    latheP(B.p(zinc), dome, AX, Y1, CZ, 32);
    for (let i = 0; i < nS; i++){ const a = i/nS*TAU; const pts = dome.slice(0, 9).map(([r, y]) => [AX + Math.cos(a)*(r + 0.1), Y1 + y + 0.05, CZ + Math.sin(a)*(r + 0.1)]); for (let k = 0; k < pts.length - 1; k++) segP(B.p(zinc), pts[k], pts[k+1], 0.13, 4); }
    latheP(T, [[1.4, 0], [1.4, 0.25], [1.1, 0.25], [1.1, 0.9], [1.3, 0.9], [1.3, 1.1], [0.6, 1.35], [0.1, 1.75], [0.04, 1.95]], AX, Y1 + 5.0, CZ, 12);
    latheP(B.p(zinc), [[RD + 0.1, 0], [RD + 0.1, 0.01]], AX, Y1 + 0.6, CZ, 32);
    // flat roof of the centre block and the corridor behind it (glass-roofed by W Architects)
    prismP(W, rect(AX - 4.6, 12.8, AX + 4.6, ZC0), -6, 12.6); gableP(B.p(glass), W, AX, (12.8 + ZC0)/2, 9.6, ZC0 - 12.8, 12.6, 2.2, HP, 0.2);
  }
  // ---- the 1907 rear range and the 1916 wing: two storeys, hipped tile roofs ----
  const RR = [[-89.3, -0.2], [77.1, -0.2], [77.1, 14.4], [53.9, 14.4], [53.9, 20.2], [42.5, 20.2], [42.5, 13.0], [-89.4, 13.0]];
  prismP(W, RR, -6, 13.2);
  { const Ff = WF([77.1, 14.4], [53.9, 14.4], [60, 5]), Fb = WF([-89.3, -0.2], [77.1, -0.2], [0, 6]), Ff2 = WF([42.5, 13.0], [-89.4, 13.0], [0, 6]), Fst = WF([53.9, 20.2], [42.5, 20.2], [48, 15]);
    const Fe = WF([77.1, -0.2], [77.1, 14.7], [0, 6]), Fw = WF([-89.4, 13.8], [-89.3, -0.2], [0, 6]);
    const simple = (F, t0, t1, nb) => { const bw = (t1 - t0)/nb;
      wbox(T, F, (t0 + t1)/2, 6.2, t1 - t0, 0.6, 0, 0.25); wbox(T, F, (t0 + t1)/2, 12.5, t1 - t0 + 0.4, 0.7, 0, 0.5); wbox(ST, F, (t0 + t1)/2, -6, t1 - t0, F0 + 6, 0, 0.3);
      for (let i = 0; i < nb; i++){ const t = t0 + (i + 0.5)*bw; warch(DK, F, t, 1.6, 1.9, 5.4, 0.04); wquad(DK, F, t - 0.75, t + 0.75, 7.9, 11.1, 0.04); wbox(T, F, t, 11.2, 2.0, 0.3, 0, 0.18); }
      for (let i = 0; i <= nb; i += 2) wbox(T, F, t0 + i*bw, F0, 0.7, 11.6, 0, 0.2); };
    simple(Ff, 0, Ff.L, 5); simple(Fe, 0, Fe.L, 3); simple(Fw, 0, Fw.L, 3); simple(Ff2, 0, Ff2.L, 28); simple(Fst, 0, Fst.L, 2); simple(Fb, 0, Fb.L, 36);
  }
  hipP(RF, -6.15, 6.6, 166.4, 13.6, 13.2, 3.4, 0, 0.35); hipP(RF, 48.2, 17.3, 11.4, 5.8, 13.2, 2.4, 0, 0.3);
  // ---- the 2006 extension towards Fort Canning ----
  const GL = B.p(glass), SL = B.p(steel);
  const glassBox = (P, y1, step) => {      // glass walls with white mullions and transoms, glass roof with beams
    wallsP(GL, P, F0, y1); capP(GL, P, y1); wallsP(ST, P, -6, F0);
    for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], L = Math.hypot(b[0]-a[0], b[1]-a[1]), n = Math.max(1, Math.round(L/step));
      for (let k = 0; k <= n; k++){ const x = lerp(a[0], b[0], k/n), z = lerp(a[1], b[1], k/n); segP(SL, [x, F0, z], [x, y1 + 0.3, z], 0.16, 4); }
      for (const y of [F0 + 3.6, y1 - 0.2]) segP(SL, [a[0], y, a[1]], [b[0], y, b[1]], 0.14, 4); }
  };
  const P8 = [[30.7, -0.2], [-41.2, -0.2], [-17.1, -28.9], [4.2, -28.5], [4.2, -13.7], [30.9, -13.1]];
  glassBox(P8, 11.2, 3.2);
  for (let x = -36; x < 30; x += 4.5) segP(SL, [x, 11.4, -0.2], [Math.max(x, x < -17 ? x : x), 11.4, x < -17 ? -0.2 - (x + 41.2)*1.19 : (x < 4.2 ? -28.7 : -13.4)], 0.22, 4);
  const P11 = [[-42.0, -0.2], [-41.8, -8.7], [-33.6, -11.1], [-28.8, -18.8], [-30.9, -29.1], [-17.1, -28.9], [-41.2, -0.2]];
  glassBox(P11, 10.2, 3.2);
  // Glass Rotunda: a 24 m glass drum round a steel-mesh drum, 16 m high
  { const cx = -41.2, cz = -21.6, R0 = 12.6;
    latheP(B.p({c:'#a9c6d2', op:0.42, glow:'#cfe6ff', gk:0.25}), [[R0, F0], [R0, 16.6]], cx, 0, cz, 28);
    latheP(B.p(mesh), [[10.4, F0], [10.4, 15.6], [0.01, 15.6]], cx, 0, cz, 24);
    latheP(SL, [[R0 + 0.3, 16.3], [R0 + 0.3, 16.9], [0.01, 17.6]], cx, 0, cz, 28);
    latheP(ST, [[R0 + 0.3, -6], [R0 + 0.3, F0]], cx, 0, cz, 28);
    for (let i = 0; i < 28; i++){ const a = i/28*TAU, x = cx + Math.cos(a)*(R0 + 0.12), z = cz + Math.sin(a)*(R0 + 0.12); segP(SL, [x, F0, z], [x, 16.6, z], 0.13, 4); }
    for (const y of [5.6, 10.6]) latheP(SL, [[R0 + 0.2, y], [R0 + 0.2, y + 0.25]], cx, 0, cz, 28);
  }
  // the perforated-metal wing and the small pavilion beside it
  { const P0 = rect(4.2, -33.6, 64.2, -13.2); prismP(B.p(perf), P0, -6, 7.6); wallsP(ST, offP(P0, 0.05), -6, F0);
    for (let y = 2.2; y < 7.4; y += 1.3) wallsP(B.p('#a39d90'), offP(P0, 0.08), y, y + 0.18);
    const F = WF([64.2, -33.6], [4.2, -33.6], [30, -20]); for (let t = 3; t < 60; t += 6) wquad(DK, F, t, t + 3.2, F0, 3.6, 0.1);
    glassBox(rect(38.9, -46.5, 54.7, -33.6), 4.3, 3.2); }
  B.flush(g);
  return g; }};

// =====================================================================================================================
// Old Hill Street Police Station (1934, Frank Dorrington Ward; now the Ministry building at 140 Hill Street). A massive
// six-storey neoclassical block wrapping the corner of Hill Street and River Valley Road: the chamfered main front faces the
// junction (entrance with pediment), a long wing runs up River Valley Road, two inner courtyards (the western one glass-roofed
// as the atrium). Ground floor of round arches, Doric pilasters spanning two storeys, the top floor on corbels with
// cantilevered balconies, flat roof (playgrounds for the children of the officers). Its signature: the 927 windows whose
// louvred shutters are painted in rainbow colours. Local +z = south-east (Hill Street), +x = north-east, -x = River Valley Road.
LANDMARKS.hillstreet = {zh:'旧禧街警察局', en:'Old Hill Street Police Station', cat:'old', r:86, h:30.5,
  lt:{m:0, c:'#ffe0b8', k:0.85, e:0.35}, build(){
  const g = new THREE.Group(), B = mkB();
  const wall = '#eeebe2', trim = '#f9f8f3', dark = '#3a3d42', stone = '#d6d0c2', roofc = '#a9a69e';
  const RB = ['#d8312e', '#ef8a22', '#f1c61d', '#3a9e4a', '#2f6fc0', '#7b4fb0'].map(c => B.p(c));
  const W = B.p(wall), T = B.p(trim), DK = B.p(dark), ST = B.p(stone), RF = B.p(roofc);
  const OUT = [[-16.6, 33.0], [52.1, 33.0], [51.9, -16.6], [49.1, -16.6], [49.1, -18.6], [1.9, -18.6], [1.8, -23.1], [-9.6, -23.1], [-9.6, -16.4],
    [-38.35, -16.4], [-38.3, -66.6], [-51.1, -66.6], [-50.8, -1.7]];
  const CA = [[-36.7, -4.4], [-6, -4.4], [-6, 21], [-11.6, 21]], CB = [[6, -6.6], [40, -6.6], [40, 21], [6, 21]];
  const Y1 = 5.5, FH = 4.25, Y5 = Y1 + 4*FH, Y6 = 26.8, PAR = 28.2, OV = 0.45;
  const IN = [10, 10];
  // the mass: four storeys flush, the top floor oversailing on corbels, parapet
  wallsP(W, OUT, -4, Y5); for (const C of [CA, CB]) wallsP(W, C, 0, PAR - 0.6);
  const OUT6 = offP(OUT, OV); wallsP(W, OUT6, Y5, Y6); capP(W, OUT6, Y5 - 0.01, [CA, CB]);
  wallsP(T, offP(OUT, OV + 0.1), Y6, Y6 + 0.5); wallsP(W, offP(OUT, OV), Y6 + 0.5, PAR); wallsP(W, offP(OUT, OV - 0.4), Y6 + 0.5, PAR);
  capP(RF, offP(OUT, OV - 0.4), Y6 + 0.3, [CA, CB]); capP(T, OUT6, PAR, [offP(OUT, OV - 0.4)]);
  wallsP(ST, offP(OUT, 0.25), -4, 0.9); wallsP(T, offP(OUT, 0.3), Y1 - 0.5, Y1); wallsP(T, offP(OUT, 0.22), Y1 + 2*FH - 0.25, Y1 + 2*FH + 0.15);
  // window shutters: two louvred leaves in one of six colours, white surround, sill
  const shut = (F, t, y, w, h, ci, d) => { d = d || 0; wquad(T, F, t - w/2 - 0.18, t + w/2 + 0.18, y - 0.18, y + h + 0.25, d + 0.03);
    wquad(RB[((ci % 6) + 6) % 6], F, t - w/2, t + w/2, y, y + h, d + 0.07); wquad(DK, F, t - 0.05, t + 0.05, y, y + h, d + 0.09);
    for (let k = 1; k < 4; k++) wquad(T, F, t - w/2, t + w/2, y + h*k/4 - 0.05, y + h*k/4 + 0.03, d + 0.085);
    wbox(T, F, t, y - 0.32, w + 0.6, 0.16, d, 0.22); };
  // one face: n bays from t0 to t1, arches below, four storeys of windows, top floor on corbels; ofs = colour phase
  const face = (F, t0, t1, n, o) => {
    o = o || {}; const bw = (t1 - t0)/n, ph = o.ph || 0;
    for (let i = 0; i < n; i++){ const t = t0 + (i + 0.5)*bw;
      if (!o.noArch){ warch(DK, F, t, Math.min(2.3, bw*0.66), 0.9, Y1 - 0.9, 0.04); warchRing(T, F, t, Math.min(2.3, bw*0.66), Y1 - 0.9, 0.28, 0, 0.12); }
      for (let f = 0; f < 4; f++) shut(F, t, Y1 + f*FH + 1.0, 1.55, 2.55, i + f + ph);
      shut(F, t, Y5 + 1.1, 1.55, 2.45, i + 4 + ph, OV);
      wbox(T, F, t - bw/2 + 0.4, Y5 - 0.7, 0.42, 0.7, 0, OV + 0.05); }
    if (o.pil) for (let i = 0; i <= n; i += o.pil){ const t = t0 + i*bw; wbox(T, F, t, Y1, 0.95, 2*FH - 0.25, 0, 0.3); wbox(T, F, t, Y1 + 2*FH + 0.15, 0.95, 2*FH - 0.15, 0, 0.3);
      wbox(T, F, t, Y1 + 2*FH - 0.6, 1.25, 0.35, 0, 0.42); wbox(T, F, t, Y5 - 0.6, 1.25, 0.35, 0, 0.42); }
    for (let i = 0; i <= n; i++) wbox(ST, F, t0 + i*bw, 0.9, 0.9, Y1 - 1.4, 0, 0.18);
  };
  const ctr = [5, 8];
  const E = (a, b) => WF(a, b, ctr);
  const Fhill = E([52.1, 33.0], [-16.6, 33.0]), Fne = E([51.9, -16.6], [52.1, 33.0]), Fch = E([-16.6, 33.0], [-50.8, -1.7]);
  const Frv = E([-50.8, -1.7], [-51.1, -66.6]), Fend = E([-51.1, -66.6], [-38.3, -66.6]), Fwin = E([-38.3, -66.6], [-38.35, -16.4]);
  const Fnw1 = E([-38.35, -16.4], [-9.6, -16.4]), Fst = E([-9.6, -23.1], [1.8, -23.1]), Fnw2 = E([1.9, -18.6], [49.1, -18.6]);
  face(Fhill, 0, Fhill.L, 20, {pil:2}); face(Fne, 0, Fne.L, 14, {pil:2, ph:2}); face(Frv, 0, Frv.L, 19, {pil:2, ph:4}); face(Fend, 0, Fend.L, 3, {ph:1});
  face(Fwin, 0, Fwin.L, 14, {ph:3}); face(Fnw1, 0, Fnw1.L, 8, {ph:5}); face(Fst, 0, Fst.L, 3, {ph:2}); face(Fnw2, 0, Fnw2.L, 13, {ph:1});
  // the chamfered main front: central section 28 m slightly forward, giant pilasters, entrance with a pediment
  { const F = Fch, L = F.L, c0 = 10.4, c1 = L - 10.4;
    face(F, 0, c0, 3, {pil:1, ph:3}); face(F, c1, L, 3, {pil:1, ph:3});
    wbox(W, F, L/2, -4, c1 - c0, Y5 + 4, 0, 0.9); wbox(W, F, L/2, Y5, c1 - c0 + 0.9, Y6 - Y5, OV, 0.9);
    const G = {P:(t, y, d) => F.P(t, y, (d || 0) + 0.9)}; G.ry = F.ry;
    face(Object.assign({}, F, G), c0, c1, 8, {pil:2, ph:0, noArch:true});
    for (let i = 0; i < 8; i++){ const t = c0 + (i + 0.5)*(c1 - c0)/8; if (i === 3 || i === 4) continue; warch(DK, G, t, 2.0, 0.9, Y1 - 0.9, 0.04); warchRing(T, G, t, 2.0, Y1 - 0.9, 0.28, 0, 0.12); }
    // entrance: tall arched doorway, columns, pediment over it
    warch(DK, G, L/2, 4.2, 0.9, Y1 + 1.0, 0.05); warchRing(T, G, L/2, 4.2, Y1 + 1.0, 0.45, 0, 0.2);
    for (const s of [-1, 1]) { const c = G.P(L/2 + s*3.1, 0, 0.6); LCyl(g, 0.38, 0.42, Y1 + 0.6, c[0], 0.9, c[2], trim, 10); }
    wbox(T, G, L/2, Y1 + 1.4, 8.2, 0.6, 0, 0.8); wped(T, G, L/2 - 4.4, L/2 + 4.4, Y1 + 2.0, 2.2, 0, 0.8);
    wbox(T, G, L/2, Y6 + 0.5, c1 - c0 + 1.0, PAR + 1.2 - Y6 - 0.5, OV - 0.2, 0.6);
    for (let k = 0; k < 7; k++){ const p = G.P(L/2, 0, 1.75 - k*0.25); boxP(ST, 12, 0.7, 3.5 - k*0.5, p[0], -4 + 0.7*k, p[2], F.ry); }
  }
  // cantilevered balconies on the top floor at the corners and the front
  const balc = (F, t, w) => { wbox(T, F, t, Y5 - 0.1, w, 0.35, OV, 1.3); wbox(T, F, t, Y5 + 0.25, w, 1.0, OV + 1.2, 0.1);
    for (const s of [-1, 1]) wbox(T, F, t + s*(w/2 - 0.05), Y5 + 0.25, 0.1, 1.0, OV, 1.3); for (let k = 0; k < 3; k++) wbox(ST, F, t - w/3 + k*w/3, Y5 - 1.0, 0.3, 0.9, OV, 0.9); };
  for (const [F, ts] of [[Fhill, [3.5, 10.4, 58.3, 65.2]], [Fne, [3.6, 46.2]], [Frv, [3.4, 30.7, 61.3]], [Fnw2, [5.4, 41.7]]]) for (const t of ts) balc(F, t, 3.0);
  // courtyards: windows on the inner faces, the western one roofed with glass (the atrium)
  for (const [C, ph] of [[CA, 1], [CB, 3]]) { const cc = cenP(C);
    for (let i = 0; i < C.length; i++){ const a = C[i], b = C[(i+1) % C.length], mid = [(a[0]+b[0])/2, (a[1]+b[1])/2], F = WF(a, b, [2*mid[0] - cc[0], 2*mid[1] - cc[1]]);
      F.n = [-F.n[0], -F.n[1]]; const Pn = F.P; F.P = (t, y, d) => [a[0] + F.u[0]*t + F.n[0]*(d || 0), y, a[1] + F.u[1]*t + F.n[1]*(d || 0)];
      const n = Math.max(1, Math.round(F.L/3.4)); if (F.L < 4) continue;
      for (let k = 0; k < n; k++){ const t = (k + 0.5)*F.L/n; warch(DK, F, t, 1.9, 0.0, Y1 - 1.0, 0.04); for (let f = 0; f < 5; f++) shut(F, t, Y1 + f*FH + 1.0, 1.4, 2.4, k + f + ph); } }
    capP(ST, C, 0.02); }
  { const c = cenP(CA); const gl = B.p({c:'#a8c2cc', glow:'#ffe9c8', gk:0.3});
    capP(gl, offP(CA, 0.3), PAR - 0.4); for (let x = -36; x < -6; x += 3) segP(T, [x, PAR - 0.2, -4.4], [x, PAR - 0.2, Math.min(21, -4.4 + (x + 36.7)*1.03 + 0.01 > 21 ? 21 : 21)], 0.12, 4); }
  // roof: playground parapets, stair and lift houses
  for (const [x, z, w, d] of [[-4, -19, 8, 6], [46, 28, 6, 6], [-44, -60, 6, 5], [-30, 25, 7, 5]]) { boxP(W, w, 3.2, d, x, Y6 + 0.3, z); boxP(T, w + 0.4, 0.3, d + 0.4, x, Y6 + 3.5, z); }
  B.flush(g);
  return g; }};

// =====================================================================================================================
// Asian Civilisations Museum — the Empress Place Building (1867 court house by J. F. A. McNair, extended 1880, 1904 and 1920)
// on the north bank of the Singapore River. A chain of white neo-Palladian wings in a zig-zag plan: two tall storeys with
// pilasters, arched ground-floor windows and hooded upper windows, pedimented gable ends towards the river and Empress
// Place, a two-storey Doric/Ionic verandah on the river front, and hipped and gabled red-tiled roofs.
// Local +z = south-west (the river), -z = Empress Place / Victoria Theatre, +x = south-east (Cavenagh Bridge).
LANDMARKS.acm = {zh:'亚洲文明博物馆', en:'Asian Civilisations Museum', cat:'old', r:74, h:21,
  lt:{m:0, c:'#ffd8a8', k:0.9, e:0.3}, build(){
  const g = new THREE.Group(), B = mkB();
  const W = B.p('#f2efe6'), T = B.p('#fbfaf5'), DK = B.p('#3b443f'), RF = B.p('#a8553a'), ST = B.p('#d9d3c4');
  const EV = 13.8, G1 = 7.0, S1 = 7.6, U1 = 13.0, F0 = 0.9;
  // wings [x0, z0, x1, z1, ridge along z?, pediment ends (n = -z, s = +z)]
  const BL = [[-61.2, -37.7, -44.7, -10.8, 1, 'n'], [-70.0, -10.7, -22.1, 0.4, 0, ''], [-47.25, 0.4, -22.0, 6.4, 0, ''], [-60.6, 0.4, -47.25, 12.6, 1, 's'],
    [-47.25, 6.4, -37.45, 28.5, 1, 's'], [-22.1, -30.3, -7.35, 18.5, 1, 'ns'], [-7.35, -16.6, 24.0, 0.0, 0, ''], [-7.35, -37.7, -1.2, -16.6, 1, 'n'],
    [-1.1, 5.2, 23.75, 31.0, 1, 's'], [23.75, -24.4, 42.0, 41.4, 1, 'ns'], [42.0, -16.2, 58.4, 12.0, 0, ''], [58.4, -11.15, 65.7, 6.8, 1, '']];
  const inside = (x, z, skip) => BL.some((b, i) => i !== skip && x > b[0] + 0.05 && x < b[2] - 0.05 && z > b[1] + 0.05 && z < b[3] - 0.05);
  const VER = 8;                                       // the river-front wing whose south face carries the verandah
  BL.forEach((b, bi) => {
    const [x0, z0, x1, z1, rz, ped] = b, c = [(x0 + x1)/2, (z0 + z1)/2], w = x1 - x0, d = z1 - z0;
    const zf = bi === VER ? z1 - 3.4 : z1;           // the verandah is recessed into the footprint
    prismP(W, rect(x0, z0, x1, zf), -2, EV);
    const faces = [[[x0, z0], [x1, z0], 'n'], [[x1, zf], [x0, zf], 's'], [[x0, zf], [x0, z0], 'w'], [[x1, z0], [x1, zf], 'e']];
    for (const [a, e, k] of faces){
      const F = WF(a, e, c), n = Math.max(1, Math.round(F.L/4.3)), bw = F.L/n, ex = t => { const p = F.P(t, 0, 0.7); return !inside(p[0], p[2], bi); };
      if (!ex(F.L/2) && !ex(bw/2) && !ex(F.L - bw/2)) continue;
      wbox(ST, F, F.L/2, -2, F.L + 0.5, F0 + 2, 0, 0.25); wbox(T, F, F.L/2, G1, F.L + 0.5, S1 - G1, 0, 0.28);
      wbox(T, F, F.L/2, U1, F.L + 0.5, EV - U1, 0, 0.32);
      for (let i = 0; i < n; i++){ const t = (i + 0.5)*bw; if (!ex(t)) continue;
        warch(DK, F, t, 1.75, 1.8, 5.9, 0.04); warchRing(T, F, t, 1.75, 5.9, 0.3, 0, 0.1); wbox(T, F, t, 1.55, 2.2, 0.25, 0, 0.18);
        wquad(DK, F, t - 0.85, t + 0.85, 8.4, 11.9, 0.04); wbox(T, F, t, 8.2, 2.2, 0.2, 0, 0.2); wbox(T, F, t, 12.1, 2.5, 0.28, 0, 0.32);
        for (const s of [-1, 1]) wbox(T, F, t + s*1.0, 8.4, 0.2, 3.5, 0, 0.1);
        if (ex(t - bw/2 - 0.3) || i === 0) { wbox(T, F, t - bw/2, F0, 0.75, G1 - F0, 0, 0.22); wbox(T, F, t - bw/2, S1, 0.65, U1 - S1, 0, 0.2); }
        if (i === n - 1) { wbox(T, F, t + bw/2, F0, 0.75, G1 - F0, 0, 0.22); wbox(T, F, t + bw/2, S1, 0.65, U1 - S1, 0, 0.2); } }
      // pedimented gable end
      if (ped.includes(k) && rz){ const hp = Math.min(w, 18)*0.27; wped(T, F, -0.6, F.L + 0.6, EV, hp + 0.25, 0, 0.75); wped(W, F, 0.5, F.L - 0.5, EV + 0.4, hp - 0.4, 0.05, 0.6);
        warch(DK, F, F.L/2, 1.4, EV + 0.9, EV + 0.9 + 1.4, 0.7, 6); }
    }
    // roofs: gables (ridge along z) with pediment ends, hips elsewhere
    if (rz){ const hr = w*0.27, R = rotP(c[0], c[1], HP); const zz0 = ped.includes('n') ? z0 : z0 - 0.9, zz1 = ped.includes('s') ? z1 : z1 + 0.9;
      if (ped) gableP(RF, W, c[0], (zz0 + zz1)/2, zz1 - zz0, w, EV, hr, HP, 0.9);
      else hipP(RF, c[0], c[1], w, d, EV, hr, 0, 0.9); }
    else hipP(RF, c[0], c[1], w, d, EV, Math.min(w, d)*0.27, 0, 0.9);
  });
  // the river verandah: two storeys of paired columns, balustrade, the wing's pediment above
  { const [x0, z0, x1, z1] = BL[VER], F = WF([x1, z1], [x0, z1], [(x0 + x1)/2, z0]), n = 7, bw = F.L/n;
    wquad(DK, F, 0.3, F.L - 0.3, F0, U1, -3.38); prismP(ST, rect(x0, z1 - 3.4, x1, z1), -2, F0); prismP(T, rect(x0, z1 - 3.4, x1, z1), G1, S1);
    for (let i = 0; i <= n; i++){ const t = i*bw, p = F.P(t, 0, -0.5); LCyl(g, 0.36, 0.42, G1 - F0, p[0], F0, p[2], '#fbfaf5', 10); LCyl(g, 0.3, 0.34, U1 - S1 - 0.5, p[0], S1, p[2], '#fbfaf5', 10);
      boxP(T, 1.0, 0.5, 1.0, p[0], U1 - 0.5, p[2]); }
    balP(T, F, 0.2, F.L - 0.2, S1, -0.5, 1.05, []);
    wbox(T, F, F.L/2, U1, F.L + 0.5, EV - U1, -0.9, 1.2);
  }
  B.flush(g);
  return g; }};

// =====================================================================================================================
// Parkview Square (2002, James Adams with DP Architects; after New York's 1929 Chanin Building): the "Gotham" Art Deco office
// slab on North Bridge Road, 144 m to the roof. A 61 x 26.5 m slab of dark brown granite and bronze: a 15 m lobby storey,
// a shaft of full-height granite piers with bronze spandrels and dark glass, then a stepped crown of setbacks with buttresses
// and spires (the eight statues on the crown are left out). In front, towards North Bridge Road, the raised granite plaza
// with fountains, lamps and the railed forecourt. Local +x = north-east, -z = north-west (North Bridge Road), +z = DUO side.
LANDMARKS.parkview = {zh:'百汇广场', en:'Parkview Square', cat:'new', r:52, h:152,
  lt:{m:1, c:'#ffcf88', k:0.8}, build(){
  const g = new THREE.Group(), B = mkB();
  const gran = {c:'#4b4039', m:0, lc:'#ffc27a', lk:1.1}, gran2 = {c:'#66574a', m:0, lc:'#ffc27a', lk:1.2}, bron = {c:'#8c6b3e', m:0, lc:'#ffbf6a', lk:1.1};
  const glass = {c:'#2c343a', m:1, fh:4.3, cw:3.05}, crown = {c:'#6e5c4b', m:0, lc:'#ffc46e', lk:1.5, glow:'#ffa940', gk:0.45}, gold = {c:'#b08a4a', glow:'#ffcf80', gk:0.6};
  const GR = B.p(gran), G2 = B.p(gran2), BR = B.p(bron), GL = B.p(glass), CR = B.p(crown), GD = B.p(gold), PV = B.p('#b9ad9c');
  const X0 = -30.65, X1 = 30.3, Z0 = 9.9, Z1 = 36.45, cx = (X0 + X1)/2, cz = (Z0 + Z1)/2, Wd = X1 - X0, Dp = Z1 - Z0;
  const LOB = 15.2, SH = 116.0, FH = 4.3;
  // tier: a granite-framed glass box with piers, bronze spandrels and corner buttresses
  const tier = (w, d, y0, y1, step, piers, spand) => {
    const P = rect(cx - w/2, cz - d/2, cx + w/2, cz + d/2); prismP(GL, P, y0, y1); capP(GR, P, y1 + 0.01);
    for (let i = 0; i < 4; i++){ const a = P[i], b = P[(i+1) % 4], F = WF(a, b, [cx, cz]), n = Math.max(2, Math.round(F.L/step)), bw = F.L/n;
      for (let k = 1; k < n; k++) { if (k % 2 === 0 && piers === GR) { wbox(G2, F, k*bw, y0, 1.15, y1 - y0 + 1.2, 0, 0.85); } else wbox(piers, F, k*bw, y0, 0.7, y1 - y0, 0, 0.45); }
      if (spand) for (let y = y0 + FH; y < y1 - 1; y += FH) for (let k = 0; k < n; k++) wquad(spand, F, k*bw + 0.5, (k+1)*bw - 0.5, y - 1.05, y + 0.05, 0.12);
      wbox(GR, F, 0, y0, 1.9, y1 - y0, -0.95, 1.6); }
    wallsP(G2, offP(P, 0.35), y1 - 0.9, y1 + 0.5);
  };
  // lobby storey: tall bronze-framed openings between granite piers
  { const P = rect(X0, Z0, X1, Z1); prismP(GR, P, -3, LOB); wallsP(G2, offP(P, 0.3), -3, 1.2); wallsP(G2, offP(P, 0.45), LOB - 1.4, LOB);
    for (let i = 0; i < 4; i++){ const a = P[i], b = P[(i+1) % 4], F = WF(a, b, [cx, cz]), n = Math.round(F.L/6.1), bw = F.L/n;
      for (let k = 0; k < n; k++){ const t = (k + 0.5)*bw; wquad(GL, F, t - 1.9, t + 1.9, 1.2, 12.2, 0.06); wquad(BR, F, t - 1.9, t + 1.9, 9.6, 10.1, 0.1);
        for (const s of [-1, 0, 1]) wbox(BR, F, t + s*1.9, 1.2, 0.18, 11.0, 0, 0.14); wped(BR, F, t - 2.1, t + 2.1, 12.2, 1.4, 0, 0.2); }
      for (let k = 0; k <= n; k++) wbox(G2, F, k*bw, 1.2, 1.3, LOB - 2.6, 0, 0.5); }
    // the main entrance towards the plaza: a tall bronze portal with a stepped granite surround
    const F = WF([X1, Z0], [X0, Z0], [cx, cz]);
    wbox(G2, F, F.L/2, -3, 13, LOB + 4.5, 0, 1.4); wquad(BR, F, F.L/2 - 4, F.L/2 + 4, 1.2, 13.5, 1.45); wquad(GD, F, F.L/2 - 2.8, F.L/2 + 2.8, 1.2, 9.5, 1.5);
    for (let k = 0; k < 4; k++) wbox(G2, F, F.L/2, LOB + 1.5 + k*0.7, 11 - k*2.4, 0.7, 0, 1.6);
  }
  // shaft and the stepped crown
  tier(Wd, Dp, LOB, SH, 3.05, GR, BR);
  tier(Wd - 6, Dp - 4, SH, 126, 3.05, GR, BR);
  tier(Wd - 18, Dp - 9, 126, 135, 2.6, CR, BR);
  tier(Wd - 32, Dp - 13, 135, 144, 2.2, CR, null);
  // buttresses and spires at each setback, a central finial
  const spire = (x, y, z, h, r) => { latheP(CR, [[r, 0], [r, h*0.35], [r*0.7, h*0.35], [r*0.7, h*0.6], [r*0.4, h*0.6], [0.05, h]], x, y, z, 8); };
  for (const [w, d, y, h] of [[Wd, Dp, SH, 9], [Wd - 6, Dp - 4, 126, 8], [Wd - 18, Dp - 9, 135, 7], [Wd - 32, Dp - 13, 144, 5.5]])
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const x = cx + sx*(w/2 - 0.9), z = cz + sz*(d/2 - 0.9); boxP(CR, 2.2, 3.0, 2.2, x, y, z); spire(x, y + 3.0, z, h, 0.9); }
  for (const sx of [-1, 1]) for (const k of [0, 1, 2]) { const x = cx + sx*(Wd/2 - 9 - k*7); for (const sz of [-1, 1]) { const z = cz + sz*(Dp/2 - 0.3); boxP(CR, 1.3, 7 - k*1.5, 1.3, x, SH, z); } }
  latheP(CR, [[3.2, 0], [3.2, 1.2], [2.0, 1.2], [2.0, 2.8], [1.1, 2.8], [0.08, 6.0]], cx, 144, cz, 8);
  latheP(GD, [[0.25, 0], [0.25, 0.01]], cx, 150, cz, 6);
  // plaza: raised granite forecourt with fountain basins and lamps; railed edge and gate piers on North Bridge Road
  { const Pz = [[-31.0, -27.1], [30.0, -28.0], [30.3, 9.9], [-30.65, 9.9]]; prismP(PV, Pz, -3, 1.0);
    for (let k = 0; k < 4; k++) boxP(PV, 30 - k*0.0, 0.25, 1.2, cx, 0.75 - k*0.25 - 0.25, -27.6 - k*0.0);
    for (const x of [-16, 16]) { latheP(G2, [[4.2, 0], [4.2, 0.7], [3.8, 0.7], [3.8, 0.4], [0.01, 0.4]], x, 1.0, -9, 20); latheP(B.p({c:'#7fa6b4', glow:'#bfe2ff', gk:0.25}), [[3.8, 0.55], [0.01, 0.55]], x, 1.0, -9, 20);
      latheP(BR, [[0.9, 0], [0.5, 1.2], [1.4, 1.6], [0.2, 2.8], [0.01, 3.2]], x, 1.0, -9, 10); }
    for (let x = -26; x <= 26; x += 8.6) for (const z of [-20, 2]) { segP(BR, [x, 1.0, z], [x, 5.2, z], 0.12, 6); boxP(GD, 0.55, 0.8, 0.55, x, 5.2, z); }
    const Pg = [[30.0, -28.0], [-35.6, -26.8], [-34.3, -31.4], [-30.9, -34.7], [-27.1, -35.8], [31.4, -37.6], [36.4, -34.2], [38.4, -27.8]];
    prismP(PV, Pg, -3, 0.6);
    const F = WF([-33.5, -33.2], [35.0, -35.4], [0, -20]);
    wbox(G2, F, F.L/2, 0.6, F.L, 0.9, 0, 0.6);
    for (let t = 0.8; t < F.L; t += 0.35) wbox(BR, F, t, 1.5, 0.06, 1.6, 0.25, 0.06);
    wbox(BR, F, F.L/2, 3.0, F.L, 0.1, 0.2, 0.12);
    for (let t = 0; t <= F.L + 0.1; t += F.L/8) { wbox(G2, F, t, 0.6, 1.1, 3.3, -0.25, 1.1); const p = F.P(t, 0, 0.3); boxP(GD, 0.7, 0.9, 0.7, p[0], 3.9, p[2]); }
  }
  // rear (south-east) canopy
  prismP(G2, [[8.1, 36.4], [5.1, 38.4], [-1.3, 41.3], [-9.3, 40.6], [-15.1, 36.4]], -3, 0.6); prismP(BR, [[9.0, 36.4], [5.4, 39.0], [-1.3, 42.0], [-9.6, 41.3], [-16.0, 36.4]], 5.8, 6.4);
  for (const x of [-12, -4, 4]) segP(BR, [x, 0.6, 40.2], [x, 5.8, 40.2], 0.18, 6);
  B.flush(g);
  return g; }};

// =====================================================================================================================
// National Library Building, 100 Victoria Street (2005, Ken Yeang / T. R. Hamzah & Yeang with DP Architects): 16 storeys,
// about 103 m. Two blocks — the curvilinear block towards Victoria Street (programmes; the 615-seat Drama Centre theatre
// is slung over the plaza as a giant shade) and the rectilinear block towards North Bridge Road (the collections) — stand
// either side of a day-lit, open-to-the-sky civic plaza that funnels the north wind through, linked by glass bridges on the
// upper floors. White aluminium sun-shading blades and light shelves wrap the glazed faces; the south-west faces are solid.
// A large flat roof canopy flies over both blocks and the gap, and the glass Pod sits on the 16th-floor roof.
// Local +x = south-east (North Bridge Road), -x = Victoria Street, -z = north-east (Middle Road), +z = south-west (Bain Street).
LANDMARKS.natlibrary = {zh:'新加坡国家图书馆', en:'National Library Building', cat:'new', r:79, h:102,
  lt:{m:1, c:'#e8f2ff', k:0.7}, build(){
  const g = new THREE.Group(), B = mkB();
  const GL = B.p({c:'#86a6ad', m:1, fh:5.6, cw:3.0}), WH = B.p({c:'#f1f3f0', m:0, lc:'#eef4ff', lk:0.4}), SO = B.p({c:'#dcdfdc', m:0, lc:'#e8f0ff', lk:0.5}), GR = B.p('#c8ccca');
  const PV = B.p('#c9c3b6'), GN = B.p('#6c9652'), POD = B.p({c:'#9ec3cf', glow:'#dff0ff', gk:0.55}), ST = B.p('#a4aaab');
  const FH = 5.6, YG = 6.5, NF = 15, TOP = YG + NF*FH;            // 90.5 m roof
  // glazed skin along a polyline: glass wall, a sunshade blade and a light shelf every floor, vertical fins
  const skin = (L, y0, y1, o) => { o = o || {};
    for (let i = 0; i < L.length - 1; i++){ const a = L[i], b = L[i+1], F = WF(a, b, o.ins), n = Math.max(1, Math.round(F.L/(o.fin || 3)));
      for (let y = y0 + FH; y <= y1 + 0.01; y += FH){ wbox(WH, F, F.L/2, y - 0.45, F.L + 0.05, 0.45, 0, o.blade || 1.4); if (!o.noShelf) { wbox(WH, F, F.L/2, y - FH*0.42, F.L + 0.05, 0.14, 0, 1.0); wbox(WH, F, F.L/2, y - FH*0.7, F.L + 0.05, 0.1, 0, 0.6); } }
      for (let k = 0; k <= n; k++) wbox(WH, F, k*F.L/n, y0, 0.3, y1 - y0, 0, o.finD || 0.7); } };
  const solid = (L, y0, y1, ins) => { for (let i = 0; i < L.length - 1; i++){ const a = L[i], b = L[i+1], F = WF(a, b, ins);
      wquad(SO, F, -0.1, F.L + 0.1, y0, y1, 0.12);
      for (let y = y0 + 2*FH; y < y1; y += 2*FH) wbox(GR, F, F.L/2, y - 0.2, F.L, 0.2, 0.1, 0.12); } };
  // ---- the curvilinear block (Victoria Street) ----
  const arc = []; for (let k = 0; k <= 8; k++){ const t = k/8, z = lerp(5.8, -43.5, t); arc.push([-45.3 - 9.2*Math.sin(PI*t), z]); }
  const inner = []; for (let k = 0; k <= 6; k++){ const t = k/6, z = lerp(-38.5, 44.5, t); inner.push([-2.0 - 7.5*Math.sin(PI*t), z]); }
  const PB = [[-45.5, 44.5], ...arc, [-43.5, -50.7], [-35.3, -45.2], ...inner.slice(0).map(p => p).slice(0, 1).map(() => [-1.0, -38.5]), ...inner.slice(1), [-45.5, 44.5]].slice(0, -1);
  const yB = TOP - 2.8;
  prismP(GL, PB, -3, yB); capP(GR, PB, yB + 0.02);
  skin([...arc, [-43.5, -50.7], [-35.3, -45.2], [-1.0, -38.5]], YG, yB, {ins:[-25, 0], blade:1.6});
  skin(inner, YG, yB, {ins:[-30, 0], blade:1.0, fin:2.5});
  solid([[-2.0, 44.5], [-45.5, 44.5]], 0, yB, [-25, 20]); skin([[-45.5, 44.5], [-45.3, 5.8]], YG, yB, {ins:[-25, 20], blade:1.6});
  // ---- the rectilinear block (North Bridge Road) ----
  const PA = [[19.4, -38.7], [23.7, -49.6], [26.4, -51.0], [35.6, -53.0], [40.4, -51.5], [46.4, -37.4], [49.6, 43.4], [47.9, 44.4], [19.4, 44.4]];
  prismP(GL, PA, -3, TOP); capP(GR, PA, TOP + 0.02);
  skin([[19.4, -38.7], [23.7, -49.6], [26.4, -51.0], [35.6, -53.0], [40.4, -51.5], [46.4, -37.4], [49.6, 43.4]], YG, TOP, {ins:[33, 0], blade:1.8, fin:3.2});
  skin([[19.4, 44.4], [19.4, -38.7]], YG, TOP, {ins:[33, 0], blade:0.9, fin:2.4, noShelf:true});
  solid([[49.6, 43.4], [47.9, 44.4], [19.4, 44.4]], 0, TOP, [33, 0]);
  // ground storeys: recessed glass lobbies under the blocks, plinths
  for (const P of [PB, PA]) { wallsP(B.p({c:'#3e474b', m:1, fh:6.5, cw:4}), offP(P, -0.6), 0, YG); wallsP(PV, P, -3, 0.25); }
  // ---- the plaza between the blocks, the low linking block at the south-west end, the Drama Centre theatre slung above ----
  prismP(PV, [[-1.0, -38.5], [19.4, -38.7], [19.4, 44.4], [-2.0, 44.5]], -3, 0.3);
  prismP(SO, [[-9.5, 30], [19.4, 30], [19.4, 44.4], [-2.0, 44.5]], 0, 24.5); capP(GN, [[-9.5, 30], [19.4, 30], [19.4, 44.4], [-2.0, 44.5]], 24.6);
  { const P = [[-8.5, -8], [19.4, -8], [19.4, 30], [-9.5, 30]]; prismP(SO, P, 13, 30.5); capP(GN, P, 30.6);
    const F = WF([19.4, -8], [-8.5, -8], [5, 10]); wquad(GL, F, 3, F.L - 3, 15, 18, 0.05); for (let y = 15; y < 30; y += 3) wbox(GR, F, F.L/2, y, F.L, 0.18, 0, 0.1);
    latheP(SO, [[14, 0], [14, 0.01]], 5, 13, 11, 4);
    for (const x of [-4, 15]) for (const z of [-4, 26]) segP(ST, [x, 0.3, z], [x, 13, z], 0.45, 8); }
  // glass bridges across the gap on the upper floors
  for (const [y, z] of [[42.5, -20], [53.7, 6], [64.9, -28], [76.1, 18], [81.7, -6]]) { const P = rect(-6, z - 3.2, 19.4, z + 3.2); prismP(B.p({c:'#9db7c0', glow:'#fff2d8', gk:0.25}), P, y, y + 4.2); wallsP(WH, offP(P, 0.1), y - 0.4, y + 0.1); wallsP(WH, offP(P, 0.1), y + 4.2, y + 4.6); }
  // roof gardens, plant screens
  capP(GN, offP(PA, -3), TOP + 0.05); boxP(GR, 14, 4, 10, 36, TOP, 20); boxP(GR, 12, 4, 9, -28, yB, 20);
  // ---- the roof canopy: a flat white blade on slender columns, flying over both blocks and the plaza ----
  { const yc = TOP + 9.5, x0 = -14, x1 = 53, z0 = -57, z1 = 41;
    for (const P of [rect(x0, z0, x1, z0 + 1.6), rect(x0, z1 - 1.6, x1, z1), rect(x0, z0, x0 + 1.6, z1), rect(x1 - 1.6, z0, x1, z1)]) prismP(WH, P, yc, yc + 1.4);
    for (let x = x0 + 3; x < x1 - 1; x += 2.6) boxP(WH, 0.7, 1.0, z1 - z0, x, yc + 0.2, (z0 + z1)/2, 0);
    for (let z = z0 + 8; z < z1; z += 16) boxP(GR, x1 - x0, 0.6, 0.5, (x0 + x1)/2, yc - 0.1, z, 0);
    for (const [x, z] of [[-9, -36], [-9, 28], [22, -36], [22, 28], [44, -40], [44, 36]]) segP(ST, [x, x < 0 ? yB : TOP, z], [x, yc, z], 0.4, 8); }
  // ---- the Pod: a glass capsule on the 16th-floor roof at the north corner, cantilevered towards Victoria Street ----
  { const cx = -38, cz = -31, Lp = 28, Wp = 12, y0 = yB + 0.3, ry = 0.3, R = rotP(cx, cz, ry), secs = [];
    for (let k = 0; k <= 8; k++){ const v = k/8, ring = [];
      for (let i = 0; i < 24; i++){ const a = i/24*TAU, ex = Math.cos(a), ez = Math.sin(a), sx = Math.sign(ex)*Math.pow(Math.abs(ex), 0.45)*Lp/2, sz = Math.sign(ez)*Math.pow(Math.abs(ez), 0.45)*Wp/2;
        const sh = Math.sin(v*HP), q = R(sx*(1 - 0.12*v*v), y0 + 7.5*sh, sz*(1 - 0.75*Math.pow(v, 3))); ring.push(q); }
      secs.push(ring); }
    LLoft(g, secs, {c:'#9ec3cf', glow:'#dff0ff', gk:0.55});
    for (let i = 0; i < 24; i += 2) { const p = []; for (let k = 0; k <= 8; k++) p.push(secs[k][i]); for (let k = 0; k < 8; k++) segP(WH, p[k], p[k+1], 0.12, 4); }
    const P = []; for (let i = 0; i < 24; i++) P.push([secs[0][i][0], secs[0][i][2]]); prismP(WH, offP(P, 0.3), y0 - 1.2, y0); }
  B.flush(g);
  return g; }};

// =====================================================================================================================
// DUO (2017, Buro Ole Scheeren): DUO Residences (186 m, 50 storeys) and DUO Tower (170 m, 39 storeys: offices and the Andaz
// hotel) on Beach Road at Bugis. The towers are carved by circles: their plaza faces are concave arcs round the public plaza
// between them, their roofs are scooped down in concave curves away from each other (the Tower falls towards Beach Road,
// the Residences towards Ophir Road), and they "dematerialise" at the base where the lower floors are cut back in a concave
// sweep under the cantilevered upper floors. Both are wrapped in the deep white hexagonal honeycomb of sun-shades over
// blue-grey glass. Low podiums (the DUO Galleria) link them along Beach Road and to the west; glass pavilions in the plaza.
// Plans are the real footprints in the map frame: local +x = east, +z = south.
LANDMARKS.duo = {zh:'DUO 双子塔', en:'DUO', cat:'new', r:100, h:186,
  lt:{m:1, c:'#e6f0ff', k:0.65}, build(){
  const g = new THREE.Group(), B = mkB();
  const FR = B.p({c:'#e8ebe9', m:0, lc:'#fff2de', lk:0.45}), SOF = B.p('#d9dddb'), TER = B.p('#c9cdc8'), GN = B.p('#6f9a55'), PV = B.p('#cbc6bb');
  const GLT = B.p({c:'#6f8a97', m:1, fh:4.3, cw:3.6}), GLR = B.p({c:'#738e9a', m:1, fh:3.6, cw:3.6}), DK = B.p({c:'#4a5a62', m:1, fh:4.5, cw:4});
  // keep n.p <= s
  const clipHalf = (P, n, s) => { const out = [], f = p => p[0]*n[0] + p[1]*n[1] - s;
    for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], fa = f(a), fb = f(b); if (fa <= 0) out.push(a);
      if ((fa <= 0) !== (fb <= 0)){ const t = fa/(fa - fb); out.push([a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t]); } }
    return out; };
  const pip = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0])*(z - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; };
  // remove the disk |p - C| < r; the cut follows the circle
  const clipDisk = (P, C, r) => {
    const f = p => r - Math.hypot(p[0] - C[0], p[1] - C[1]), Q = [];
    for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], n = Math.max(1, Math.ceil(Math.hypot(b[0]-a[0], b[1]-a[1])/1.5)); for (let k = 0; k < n; k++) Q.push([lerp(a[0], b[0], k/n), lerp(a[1], b[1], k/n)]); }
    const i0 = Q.findIndex(p => f(p) <= 0); if (i0 < 0) return []; if (!Q.some(p => f(p) > 0)) return P;
    const R = Q.slice(i0).concat(Q.slice(0, i0)), out = []; let X = null;
    for (let i = 0; i < R.length; i++){ const a = R[i], b = R[(i+1) % R.length], fa = f(a), fb = f(b);
      if (fa <= 0) out.push(a);
      if ((fa <= 0) !== (fb <= 0)){ const t = fa/(fa - fb), p = [a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t];
        if (fa <= 0){ X = p; out.push(p); }
        else if (X){ const a0 = Math.atan2(X[1] - C[1], X[0] - C[0]); let d = Math.atan2(p[1] - C[1], p[0] - C[0]) - a0; while (d > PI) d -= TAU; while (d < -PI) d += TAU;
          const am = a0 + d/2; if (!pip(P, C[0] + Math.cos(am)*r*1.001, C[1] + Math.sin(am)*r*1.001)) d = d > 0 ? d - TAU : d + TAU;
          const n = Math.max(1, Math.ceil(Math.abs(d)*r/1.5)); for (let k = 1; k < n; k++){ const an = a0 + d*k/n; out.push([C[0] + Math.cos(an)*r, C[1] + Math.sin(an)*r]); }
          out.push(p); X = null; } } }
    // drop the collinear points left by the densified straight edges
    const S = []; for (let i = 0; i < out.length; i++){ const a = out[(i + out.length - 1) % out.length], b = out[i], c = out[(i+1) % out.length];
      const cr = (b[0]-a[0])*(c[1]-b[1]) - (b[1]-a[1])*(c[0]-b[0]), l = Math.hypot(b[0]-a[0], b[1]-a[1])*Math.hypot(c[0]-b[0], c[1]-b[1]); if (l < 1e-6 || Math.abs(cr)/l > 0.004) S.push(b); }
    return S; };
  const areaP = P => { let A = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; A += a[0]*b[1] - b[0]*a[1]; } return A/2; };
  // honeycomb: pointy-top hexes 3.6 m wide, 8.4 m tall (rows every 6.3 m), deep white frames, clipped to a facade rectangle
  const HW = 3.6, HA = 4.2, HR = 2.1, ROW = HA + HR;
  const member = (o, A, dir, nv, ua, ya, ub, yb, w, d) => {
    const du = ub - ua, dy = yb - ya, L = Math.hypot(du, dy); if (L < 0.05) return; const pu = -dy/L*w/2, py = du/L*w/2;
    const P = (u, y, k) => [A[0] + dir[0]*u + nv[0]*k, y, A[1] + dir[1]*u + nv[1]*k];
    const a1 = P(ua + pu, ya + py, d), a2 = P(ua - pu, ya - py, d), b1 = P(ub + pu, yb + py, d), b2 = P(ub - pu, yb - py, d);
    const a1b = P(ua + pu, ya + py, 0.05), a2b = P(ua - pu, ya - py, 0.05), b1b = P(ub + pu, yb + py, 0.05), b2b = P(ub - pu, yb - py, 0.05);
    quadP(o, a1, b1, b2, a2); quadP(o, a1b, b1b, b1, a1); quadP(o, a2, b2, b2b, a2b); };
  const hexFace = (o, a, b, sg, y0, y1, ph) => {   // sg = sign of the plan polygon's area (sets which side is outside)
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz); if (L < 0.6) return; const dir = [dx/L, dz/L], nv = [sg*dir[1], -sg*dir[0]];
    const u0 = a[0]*dir[0] + a[1]*dir[1] + ph, u1 = u0 + L, A = [a[0] - dir[0]*u0, a[1] - dir[1]*u0];
    const seg = (ua, ya, ub, yb) => { // Liang-Barsky clip to [u0,u1] x [y0,y1]
      let t0 = 0, t1 = 1; const du = ub - ua, dy = yb - ya;
      if ((ua < u0 && ub < u0) || (ua > u1 && ub > u1) || (ya < y0 && yb < y0) || (ya > y1 && yb > y1)) return;
      const lb = (p, q) => { if (Math.abs(p) < 1e-9) return q >= 0; const r = q/p; if (p < 0){ if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; } return true; };
      if (!lb(-du, ua - u0) || !lb(du, u1 - ua) || !lb(-dy, ya - y0) || !lb(dy, y1 - ya)) return;
      member(o, A, dir, nv, ua + du*t0, ya + dy*t0, ua + du*t1, ya + dy*t1, 0.5, 1.0); };
    for (let row = Math.floor(y0/ROW) - 1; row*ROW < y1 + ROW; row++){ const yc = row*ROW, off = (row & 1) ? HW/2 : 0;
      for (let col = Math.floor((u0 - off)/HW) - 1; col*HW + off < u1 + HW; col++){ const cx = col*HW + off;
        seg(cx - HW/2, yc - HA/2, cx - HW/2, yc + HA/2); seg(cx - HW/2, yc + HA/2, cx, yc + HA/2 + HR); seg(cx, yc + HA/2 + HR, cx + HW/2, yc + HA/2); } } };
  // a carved tower: floor plates = Pmax minus the carves at that height; glass walls, honeycomb, terraces and soffits
  const tower = (Pmax, cuts, y0, fh, n, GLx, roofY) => {
    const plan = y => { let P = Pmax; for (const c of cuts){ if (!P.length) break; if (c.n){ const s = c.s(y); if (s !== null) P = clipHalf(P, c.n, s); } else { const r = c.r(y); if (r !== null) P = clipDisk(P, c.C, r); } } return P; };
    const ins = cenP(Pmax), plans = [], runs = new Map(), done = [];
    for (let k = 0; k < n; k++){ const ya = k === 0 ? -4 : y0 + (k - 1)*fh, yb = y0 + k*fh; plans.push([ya, yb, plan(Math.max(1, (ya + yb)/2) + 0.01)]); }
    plans.forEach(([ya, yb, P], k) => {
      if (P.length < 3) return; wallsP(GLx, P, ya, yb);
      const nx = plans[k + 1] ? plans[k + 1][2] : null, pv = plans[k - 1] ? plans[k - 1][2] : null;
      if (!nx || Math.abs(areaP(nx) - areaP(P)) > 2) capP(nx ? TER : SOF, P, yb);
      if (k === 0 || (pv && Math.abs(areaP(pv) - areaP(P)) > 2)) capP(SOF, P, ya + 0.02);
      // honeycomb: an edge that runs on unchanged through consecutive floors gets one lattice over its whole height
      const sg = areaP(P) > 0 ? 1 : -1;
      for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], key = [a[0], a[1], b[0], b[1]].map(v => Math.round(v*20)).join(',');
        const r = runs.get(key); if (r && r.k === k - 1 && Math.abs(r.y1 - ya) < 1e-6){ r.y1 = yb; r.k = k; } else { if (r) done.push(r); runs.set(key, {a, b, y0:ya, y1:yb, k, sg}); } }
      if (yb > 20) wallsP(SOF, offP(P, 0.06), yb - 0.25, yb + 0.05);
    });
    for (const r of done.concat([...runs.values()])) hexFace(FR, r.a, r.b, r.sg, r.y0, r.y1, 0);
    return plans;
  };
  // ---- DUO Tower (offices + Andaz): plan at mid height; the base carve under the north-east cantilever; the roof scooped
  //      by a circle centred over Beach Road from 120 m (south-east) up to the 170 m crest (north-west) ----
  const PT = [[23.2, 33.1], [19.0, 37.8], [17.2, 45.5], [17.2, 63.9], [-4.9, 82.3], [-10.3, 77.0], [-15.6, 73.4], [-24.6, 70.4], [-31.2, 70.4], [-51.5, 47.3], [-51.5, 44.3],
    [-53.8, 35.4], [-62.8, 23.6], [-52.6, 14.7], [-40.7, 24.8], [-30.0, 27.7], [-18.0, 27.7], [14.8, 16.5]];
  const tT = tower(PT, [{n:[0.840, -0.543], s:y => y < 73 ? 3.5 - 13.76*Math.sqrt(1 - Math.pow(y/73, 2)) : null},
    {C:[9.7, 88.9], r:y => y < 120 ? null : 16 + 29*Math.sqrt(Math.max(0, 1 - Math.pow((170 - y)/50, 2)))}], 8.0, 4.3, 39, GLT);
  // ---- DUO Residences: the south-west cantilever over the plaza, the roof scooped down towards Ophir Road ----
  const PR = [[31.5, -68.3], [43.5, -79.6], [48.2, -74.9], [53.0, -72.5], [65.6, -72.5], [77.5, -60.0], [72.7, -53.5], [72.7, -32.7], [76.9, -24.4], [82.9, -17.9],
    [93.0, -12.6], [82.3, 0.5], [78.7, -1.3], [72.7, -0.7], [67.9, 0.5], [63.8, 3.4], [48.8, -9.6], [51.8, -15.6], [53.6, -26.2], [54.2, -33.9], [53.0, -42.2], [50.0, -48.8]];
  const tR = tower(PR, [{n:[-0.560, 0.828], s:y => y < 76 ? -32.9 - 12.25*Math.sqrt(1 - Math.pow(y/76, 2)) : null},
    {n:[0, -1], s:y => y < 98 ? null : 79.6 - 36.6*Math.sqrt(Math.max(0, 1 - Math.pow((186 - y)/88, 2)))}], 6.0, 3.6, 51, GLR);
  // roof parapets and roof gardens on the crests
  for (const [pl, col] of [[tT, GLT], [tR, GLR]]) { const [ya, yb, P] = pl[pl.length - 1]; if (P.length > 2) { wallsP(FR, offP(P, 0.4), yb, yb + 1.6); capP(GN, offP(P, -1.5), yb + 0.3); } }
  // ---- podiums: the Galleria link along Beach Road, the west wing with the drop-off, plaza pavilions ----
  const PS = [[1.1, 20.6], [21.4, 12.9], [40.5, -0.1], [48.8, -9.6], [51.8, -15.6], [52.4, -19.1], [78.7, -1.3], [67.9, 0.5], [30.3, 26.0], [19.0, 37.8], [17.2, 45.5]];
  prismP(DK, PS, -4, 4.4); capP(GN, offP(PS, -0.8), 4.5); wallsP(FR, offP(PS, 0.3), 4.2, 5.0);
  const PW = [[-52.6, 14.7], [-62.8, 23.6], [-53.8, 35.4], [-51.5, 44.3], [-51.5, 47.3], [-92.1, 5.2], [-75.3, -9.6]];
  prismP(DK, PW, -4, 4.4); prismP(FR, offP(PW, 0.4), 6.6, 7.4); capP(GN, PW, 7.45);
  for (const p of PW) segP(SOF, [p[0], 4.4, p[1]], [p[0], 6.6, p[1]], 0.3, 6);
  for (const P of [[[7.1, -17.3], [-3.1, -9.0], [-15.6, -23.9], [-10.3, -28.0], [-4.9, -22.1], [-0.1, -25.6]], [[2.9, -1.3], [-3.1, -9.0], [4.1, -15.0], [10.6, -7.2]]]) {
    prismP(B.p({c:'#9fbcc6', glow:'#fff0d8', gk:0.3}), offP(P, -0.6), 0, 4.6); prismP(FR, offP(P, 0.5), 4.6, 5.3); }
  // plaza: paving, lawn mounds and trees in the round garden between the towers
  const PZ = []; for (let i = 0; i < 40; i++){ const a = i/40*TAU; PZ.push([12 + Math.cos(a)*44, -18 + Math.sin(a)*40]); }
  prismP(PV, PZ, -4, 0.05);
  const rng = LMCTX.rng;
  for (let k = 0; k < 26; k++){ const a = rng()*TAU, rr = 8 + rng()*30, x = 12 + Math.cos(a)*rr, z = -18 + Math.sin(a)*rr*0.9; if (pip(PT, x, z) || pip(PR, x, z) || pip(PS, x, z)) continue;
    segP(B.p('#6b5a48'), [x, 0, z], [x, 4.5, z], 0.25, 5); latheP(GN, [[0.01, 3.5], [2.8, 4.6], [3.0, 6.2], [1.6, 7.4], [0.01, 7.8]], x, 0, z, 7); }
  B.flush(g);
  return g; }};

SG_PLACES.push(
  {type:'natmuseum', lat:1.296563, lon:103.848423, rot:2.2689},
  {type:'hillstreet', lat:1.290704, lon:103.848163, rot:1.0786},
  {type:'acm', lat:1.28741, lon:103.851405, rot:-0.6091},
  {type:'parkview', lat:1.300206, lon:103.857562, rot:0.8029},
  {type:'natlibrary', lat:1.297608, lon:103.854254, rot:-0.672},
  {type:'duo', lat:1.299536, lon:103.85809, rot:0}
);
}
