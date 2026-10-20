// City Brush v37 — Tokyo landmarks, group asakusa (agent ty_c): Tokyo Skytree, Solamachi, the East Tower, Sensō-ji (Kaminarimon,
// Hōzōmon, Main Hall, five-storey pagoda), Nakamise (site), the riverside beer hall and tower (generic forms, no brand).
{
// ---------- shared batch helpers (one LTris call per colour spec) ----------
const PI = Math.PI, TAU = 2*Math.PI, HP = Math.PI/2;
const mkB = function(){
  const M = new Map();
  const a = spec => { const k = typeof spec === 'string' ? spec : JSON.stringify(spec); let e = M.get(k); if (!e){ e = {spec, p:[]}; M.set(k, e); } return e.p; };
  a.flush = g => { for (const e of M.values()) if (e.p.length) LTris(g, e.p, e.spec); M.clear(); };
  return a;
}
const tri = (p, a, b, c) => { p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); };
const quad = (p, a, b, c, d) => { tri(p, a, b, c); tri(p, a, c, d); };
// frame: local (u along, w across) rotated by ry about y around (cx, cz); returns [x, y, z]
const FR = (cx, cz, ry) => { const c = Math.cos(ry || 0), s = Math.sin(ry || 0); return (u, y, w) => [cx + u*c + w*s, y, cz - u*s + w*c]; };
// box in a frame f: centre (u, w), size du x dw, from y0 to y1
const fbox = function(p, f, u, w, du, dw, y0, y1, top){
  const a = f(u - du/2, y0, w - dw/2), b = f(u + du/2, y0, w - dw/2), c = f(u + du/2, y0, w + dw/2), d = f(u - du/2, y0, w + dw/2);
  const A = f(u - du/2, y1, w - dw/2), B = f(u + du/2, y1, w - dw/2), C = f(u + du/2, y1, w + dw/2), D = f(u - du/2, y1, w + dw/2);
  quad(p, a, b, B, A); quad(p, b, c, C, B); quad(p, c, d, D, C); quad(p, d, a, A, D); if (top !== false) quad(p, A, B, C, D);
}
const box = (p, cx, cz, w, d, y0, y1, ry) => fbox(p, FR(cx, cz, ry), 0, 0, w, d, y0, y1);
// polygon prism [[x, z], ...] from y0 to y1 (walls + top cap, optional bottom)
const prism = function(p, P, y0, y1, top, bot){
  const n = P.length;
  for (let i = 0; i < n; i++){ const a = P[i], b = P[(i + 1) % n]; quad(p, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); }
  if (top !== false || bot){ const T = THREE.ShapeUtils.triangulateShape(P.map(q => new THREE.Vector2(q[0], q[1])), []);
    for (const t of T){ const A = P[t[0]], Bq = P[t[1]], C = P[t[2]]; if (top !== false) tri(p, [A[0], y1, A[1]], [Bq[0], y1, Bq[1]], [C[0], y1, C[1]]); if (bot) tri(p, [A[0], y0, A[1]], [Bq[0], y0, Bq[1]], [C[0], y0, C[1]]); } }
}
// flat polygon at height y
const flat = function(p, P, y){ const T = THREE.ShapeUtils.triangulateShape(P.map(q => new THREE.Vector2(q[0], q[1])), []); for (const t of T){ const A = P[t[0]], Bq = P[t[1]], C = P[t[2]]; tri(p, [A[0], y, A[1]], [Bq[0], y, Bq[1]], [C[0], y, C[1]]); } }
// square-section beam between two points (half-width r)
const beam = function(p, A, Bq, r){
  const d = [Bq[0] - A[0], Bq[1] - A[1], Bq[2] - A[2]], L = Math.hypot(...d); if (L < 1e-4) return;
  const t = [d[0]/L, d[1]/L, d[2]/L], up = Math.abs(t[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let u = [t[1]*up[2] - t[2]*up[1], t[2]*up[0] - t[0]*up[2], t[0]*up[1] - t[1]*up[0]]; const lu = Math.hypot(...u); u = u.map(q => q/lu*r);
  const v = [t[1]*u[2] - t[2]*u[1], t[2]*u[0] - t[0]*u[2], t[0]*u[1] - t[1]*u[0]];
  const C = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([a, b]) => [u[0]*a + v[0]*b, u[1]*a + v[1]*b, u[2]*a + v[2]*b]);
  for (let i = 0; i < 4; i++){ const c0 = C[i], c1 = C[(i + 1) % 4]; quad(p, [A[0] + c0[0], A[1] + c0[1], A[2] + c0[2]], [A[0] + c1[0], A[1] + c1[1], A[2] + c1[2]], [Bq[0] + c1[0], Bq[1] + c1[1], Bq[2] + c1[2]], [Bq[0] + c0[0], Bq[1] + c0[1], Bq[2] + c0[2]]); }
}
// loft through closed rings of [x, y, z] (same count), optional top cap
const loft = function(p, S, cap){
  const n = S[0].length;
  for (let s = 0; s < S.length - 1; s++) for (let i = 0; i < n; i++){ const j = (i + 1) % n; quad(p, S[s][i], S[s][j], S[s + 1][j], S[s + 1][i]); }
  if (cap){ const T = S[S.length - 1], c = [0, 0, 0]; for (const q of T){ c[0] += q[0]/n; c[1] += q[1]/n; c[2] += q[2]/n; } for (let i = 0; i < n; i++) tri(p, c, T[i], T[(i + 1) % n]); }
}
// surface of revolution: profile [[r, y], ...] around (cx, cz), n segments
const lathe = function(p, prof, n, cx, cz, a0, a1){
  a0 = a0 || 0; a1 = a1 === undefined ? TAU : a1; const full = Math.abs(a1 - a0 - TAU) < 1e-6;
  for (let i = 0; i < n; i++){ const t0 = a0 + (a1 - a0)*i/n, t1 = a0 + (a1 - a0)*(i + 1)/n;
    for (let k = 0; k < prof.length - 1; k++){ const [r0, y0] = prof[k], [r1, y1] = prof[k + 1];
      quad(p, [cx + Math.cos(t0)*r0, y0, cz - Math.sin(t0)*r0], [cx + Math.cos(t1)*r0, y0, cz - Math.sin(t1)*r0], [cx + Math.cos(t1)*r1, y1, cz - Math.sin(t1)*r1], [cx + Math.cos(t0)*r1, y1, cz - Math.sin(t0)*r1]); } }
  return full;
}
const cyl = (p, cx, cz, r0, r1, y0, y1, n, cap) => { lathe(p, cap ? [[0, y0], [r0, y0], [r1, y1], [0, y1]] : [[r0, y0], [r1, y1]], n, cx, cz); };
// offset a ring outward by d (convex-ish rings)
const offRing = function(P, d){ const n = P.length, out = []; let A = 0; for (let i = 0; i < n; i++){ const a = P[i], b = P[(i + 1) % n]; A += a[0]*b[1] - b[0]*a[1]; } const s = A > 0 ? 1 : -1;
  for (let i = 0; i < n; i++){ const a = P[(i + n - 1) % n], b = P[i], c = P[(i + 1) % n];
    const n1 = [(b[1] - a[1]), -(b[0] - a[0])], n2 = [(c[1] - b[1]), -(c[0] - b[0])], l1 = Math.hypot(...n1) || 1, l2 = Math.hypot(...n2) || 1;
    const m = [n1[0]/l1 + n2[0]/l2, n1[1]/l1 + n2[1]/l2], lm = Math.hypot(...m) || 1, cs = (n1[0]*n2[0] + n1[1]*n2[1])/(l1*l2), k = d/Math.max(0.35, Math.sqrt((1 + cs)/2));
    out.push([b[0] + s*m[0]/lm*k, b[1] + s*m[1]/lm*k]); }
  return out; }
const inPoly = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0])*(z - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; };
// East-Asian curved roof sheet over a rectangle (frame f, centre u0,w0, L x W at eave height y, rise h); irimoya when gab>0
const eaveRoof = function(B, f, o){
  const n = o.n || 6, nt = o.nt || 6, pw = o.pw || 1.7, lift = o.lift || 0, hl0 = o.L/2, hw0 = o.W/2, kk = o.k !== undefined ? o.k : Math.max(0, hl0 - hw0), gab = o.gab || 0;
  const ext = u => gab ? (u < gab ? hl0 + (kk - hl0)*u/gab : kk) : hl0 + (kk - hl0)*u;
  const ring = (u, dy) => { const a = ext(u), b = hw0*(1 - u), y = o.y + o.h*Math.pow(u, pw) + dy, P = [], C = [[-a, -b], [a, -b], [a, b], [-a, b]];
    for (let s = 0; s < 4; s++){ const A = C[s], Bq = C[(s + 1) % 4]; for (let i = 0; i < n; i++){ const t = i/n, cc = Math.pow(Math.abs(2*t - 1), 3), lu = lift*cc*Math.pow(1 - u, 2); P.push(f((o.u || 0) + A[0] + (Bq[0] - A[0])*t, y + lu, (o.w || 0) + A[1] + (Bq[1] - A[1])*t)); } }
    return P; };
  const S = []; if (o.fas) S.push(ring(0, -o.fas)); for (let i = 0; i <= nt; i++) S.push(ring(i/nt, 0));
  loft(B(o.col), S, !gab && kk < 0.01);
  const yt = o.y + o.h;
  if (gab){ const yg = o.y + o.h*Math.pow(gab, pw), bg = hw0*(1 - gab); for (const s of [-1, 1]){ const x = (o.u || 0) + s*kk; tri(B(o.gcol || o.col), f(x, yg, (o.w || 0) - bg), f(x, yg, (o.w || 0) + bg), f(x, yt, o.w || 0)); } }
  if (o.ridge && kk > 0.3){ fbox(B(o.rcol || o.col), f, o.u || 0, o.w || 0, 2*kk + o.ridge*2, o.ridge, yt - o.ridge*0.3, yt + o.ridge*1.1); }
  return yt;
}

// ---------- temple parts ----------
// curved hip / hip-and-gable (irimoya) roof in frame f. o: {u, w, L, W, y (eave edge), h (rise), k (ridge half-length), gab (0..1:
// where the gable starts), pw (concavity), lift (corner upturn), col, und (underside colour), hip (hip-ridge colour), rw (ridge width)}
const tRoof = (B, f, o) => {
  const n = o.n || 6, nt = o.nt || 7, pw = o.pw || 1.7, lift = o.lift || 0, hl0 = o.L/2, hw0 = o.W/2, kk = o.k !== undefined ? o.k : 0, gab = o.gab || 0;
  const u0 = o.u || 0, w0 = o.w || 0;
  const ext = u => gab ? (u < gab ? hl0 + (kk - hl0)*u/gab : kk) : hl0 + (kk - hl0)*u;
  const yAt = u => o.y + o.h*Math.pow(u, pw);
  const ring = (u, dy, sc) => { const a = ext(u), b = hw0*(1 - u), y = yAt(u) + dy, P = [], C = [[-a, -b], [a, -b], [a, b], [-a, b]], cor = [];
    for (let s = 0; s < 4; s++){ const A = C[s], Bq = C[(s + 1) % 4]; for (let i = 0; i < n; i++){ const t = i/n, cc = Math.pow(Math.abs(2*t - 1), 3), lu = lift*cc*Math.pow(1 - u, 2.2);
      const q = f(u0 + (A[0] + (Bq[0] - A[0])*t)*(sc || 1), y + lu, w0 + (A[1] + (Bq[1] - A[1])*t)*(sc || 1)); P.push(q); if (i === 0) cor.push(q); } }
    return {P, cor}; };
  const top = gab ? Math.round(gab*nt) : nt, S = [], U = [], H = [[], [], [], []];
  for (let i = 0; i <= top; i++){ const r = ring(i/nt, 0); S.push(r.P); r.cor.forEach((q, s) => H[s].push(q)); if (o.und && i/nt <= 0.45) U.push(ring(i/nt, -0.35, 0.995).P); }
  if (o.fas){ const r = ring(0, -o.fas); S.unshift(r.P); }
  loft(B(o.col), S, false); if (o.und && U.length > 1) loft(B(o.und), U, false);
  const yt = o.y + o.h;
  if (gab){ // upper gable part: two sloped planes from the gable line up to the ridge + the gable triangles
    const ug = top/nt, yg = yAt(ug), bg = hw0*(1 - ug), N = 4;
    for (const s of [-1, 1]){ const S2 = []; for (let i = 0; i <= N; i++){ const t = i/N, w = s*bg*(1 - t), y = yg + (yt - yg)*Math.pow(t, 1.2); S2.push([f(u0 - kk - 0.6, y, w0 + w), f(u0 + kk + 0.6, y, w0 + w)]); }
      for (let i = 0; i < N; i++) quad(B(o.col), S2[i][0], S2[i][1], S2[i + 1][1], S2[i + 1][0]); }
    for (const s of [-1, 1]){ const x = u0 + s*(kk + 0.3); const pts = [f(x, yg, w0 - bg)]; for (let i = 1; i < 4; i++){ const t = i/4; pts.push(f(x, yg + (yt - yg)*Math.pow(t, 1.2), w0 - bg*(1 - t))); } pts.push(f(x, yt, w0));
      for (let i = 3; i >= 1; i--){ const t = i/4; pts.push(f(x, yg + (yt - yg)*Math.pow(t, 1.2), w0 + bg*(1 - t))); } pts.push(f(x, yg, w0 + bg));
      for (let i = 1; i < pts.length - 1; i++) tri(B(o.gcol || o.col), pts[0], pts[i], pts[i + 1]);
      for (let i = 0; i < pts.length - 1; i++) beam(B(o.hip || o.col), pts[i], pts[i + 1], 0.22); }
  }
  if (o.hip) for (const h of H) for (let i = 0; i < h.length - 1; i++) beam(B(o.hip), h[i], h[i + 1], o.rw ? o.rw*0.45 : 0.3);
  if (kk > 0.3) fbox(B(o.hip || o.col), f, u0, w0, 2*kk + 1.2, o.rw || 0.8, yt - 0.3, yt + (o.rw || 0.8)*1.1);
  return yt;
};
// straight-ridged gable roof (kirizuma), ridge along u; concave slopes
const gRoof = (B, f, o) => {
  const N = 6, pw = o.pw || 1.5, hl = o.L/2, hw = o.W/2, u0 = o.u || 0, w0 = o.w || 0;
  for (const s of [-1, 1]){ const S = [], U = []; for (let i = 0; i <= N; i++){ const t = i/N, w = s*hw*(1 - t), y = o.y + o.h*Math.pow(t, pw); S.push([f(u0 - hl, y, w0 + w), f(u0 + hl, y, w0 + w)]); U.push([f(u0 - hl + 0.2, y - 0.3, w0 + w*0.99), f(u0 + hl - 0.2, y - 0.3, w0 + w*0.99)]); }
    for (let i = 0; i < N; i++){ quad(B(o.col), S[i][0], S[i][1], S[i + 1][1], S[i + 1][0]); if (o.und && i < N/2) quad(B(o.und), U[i][0], U[i][1], U[i + 1][1], U[i + 1][0]); }
    for (const e of [0, 1]) for (let i = 0; i < N; i++) beam(B(o.hip || o.col), S[i][e], S[i + 1][e], 0.28); }
  for (const e of [-1, 1]){ const x = u0 + e*(hl - 0.6), pts = []; for (let i = 0; i <= N; i++){ const t = i/N; pts.push(f(x, o.y + o.h*Math.pow(t, pw) - 0.4, w0 - hw*(1 - t)*0.92)); } for (let i = N - 1; i >= 0; i--){ const t = i/N; pts.push(f(x, o.y + o.h*Math.pow(t, pw) - 0.4, w0 + hw*(1 - t)*0.92)); }
    for (let i = 1; i < pts.length - 1; i++) tri(B(o.gcol || o.col), pts[0], pts[i], pts[i + 1]); }
  const yt = o.y + o.h; fbox(B(o.hip || o.col), f, u0, w0, o.L + 0.4, o.rw || 0.7, yt - 0.25, yt + (o.rw || 0.7)*1.2);
  return yt;
};
// round column (8 sides) and a lantern (chōchin): red body with black rims, glowing at night
const col8 = (p, x, z, r, y0, y1) => cyl(p, x, z, r, r, y0, y1, 8);
const chochin = (B, c, r, y0, h, RED, BLK) => {
  const prof = []; for (let i = 0; i <= 8; i++){ const t = i/8, rr = r*(0.86 + 0.14*Math.sin(PI*t)); prof.push([rr, y0 + 0.28 + (h - 0.56)*t]); }
  lathe(B(RED), prof, 16, c[0], c[2]); cyl(B(BLK), c[0], c[2], r*0.9, r*0.9, y0, y0 + 0.3, 16, true); cyl(B(BLK), c[0], c[2], r*0.88, r*0.88, y0 + h - 0.3, y0 + h, 16, true);
};
// lattice screen (kōshi) in frame f along u at w, from u0..u1, y0..y1
const koshi = (p, f, u0, u1, w, y0, y1, step) => { for (let u = u0; u <= u1 + 1e-6; u += step) fbox(p, f, u, w, 0.13, 0.13, y0, y1); for (const y of [y0, y1]) fbox(p, f, (u0 + u1)/2, w, u1 - u0, 0.16, y - 0.09, y + 0.09); };
// the same across w (at u)
const koshiW = (p, f, w0, w1, u, y0, y1, step) => { for (let w = w0; w <= w1 + 1e-6; w += step) fbox(p, f, u, w, 0.13, 0.13, y0, y1); for (const y of [y0, y1]) fbox(p, f, u, (w0 + w1)/2, 0.16, w1 - w0, y - 0.09, y + 0.09); };
// a low footbridge deck with railings along a path line [[x, z], ...] (sites; y absolute from gy)
const deckLine = (B, P, gy, w, col, rail) => { let y = -1e9; for (const q of P) y = Math.max(y, gy(q[0], q[1])); y += 0.9;
  for (let i = 0; i < P.length - 1; i++){ const a = P[i], b = P[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.2) continue; const f = FR((a[0] + b[0])/2, (a[1] + b[1])/2, Math.atan2(-(b[1] - a[1]), b[0] - a[0]));
    fbox(B(col), f, 0, 0, L + 0.3, w, y - 0.35, y); if (rail) for (const s of [-1, 1]){ fbox(B(rail), f, 0, s*(w/2 - 0.08), L + 0.3, 0.12, y + 0.85, y + 1.0); for (let t = -L/2; t <= L/2; t += 2) fbox(B(rail), f, t, s*(w/2 - 0.08), 0.12, 0.12, y, y + 0.95); } }
  for (const q of [P[0], P[P.length - 1]]){ const yg = gy(q[0], q[1]); if (y - yg > 0.3) box(B(col), q[0], q[1], w, w, yg - 0.5, y - 0.3, 0); } };

const D_NAKA = {"rows":[{"ring":[[-7.8,-17.6],[-3.4,-17.0],[-0.4,-53.3],[-4.9,-53.7]],"c":[-4.12,-35.46],"ang":1.4883,"side":-1,"ws":1,"L":36.5,"W":4.5},{"ring":[[2.1,19.1],[6.4,19.3],[8.8,-9.4],[4.6,-9.9]],"c":[5.47,4.82],"ang":-1.6568,"side":1,"ws":1,"L":29.1,"W":4.3},{"ring":[[5.7,-16.0],[9.4,-15.8],[12.3,-52.8],[8.6,-53.0]],"c":[9.0,-34.4],"ang":1.4926,"side":1,"ws":-1,"L":37.2,"W":3.7},{"ring":[[12.9,-111.1],[17.1,-110.8],[19.3,-137.1],[15.1,-137.4]],"c":[16.1,-124.1],"ang":1.4873,"side":1,"ws":-1,"L":26.4,"W":4.2},{"ring":[[-10.7,16.2],[-6.5,16.4],[-4.0,-10.4],[-8.4,-10.8]],"c":[-7.39,2.74],"ang":-1.6558,"side":-1,"ws":-1,"L":27.1,"W":4.4},{"ring":[[-19.2,117.2],[-15.0,117.4],[-12.3,89.7],[-16.6,89.4]],"c":[-15.77,103.37],"ang":-1.6641,"side":-1,"ws":-1,"L":28.0,"W":4.3},{"ring":[[-0.4,51.8],[3.4,51.9],[6.2,21.2],[2.0,20.8]],"c":[2.82,36.15],"ang":-1.6481,"side":1,"ws":1,"L":31.1,"W":4.2},{"ring":[[-13.5,49.8],[-9.3,50.1],[-7.1,20.2],[-11.0,19.9]],"c":[-10.24,35.18],"ang":-1.6442,"side":-1,"ws":-1,"L":30.0,"W":4.2},{"ring":[[9.2,-64.1],[13.3,-63.8],[15.4,-90.7],[11.3,-91.0]],"c":[12.3,-77.4],"ang":-1.6487,"side":1,"ws":1,"L":27.0,"W":4.1},{"ring":[[-3.7,89.9],[0.3,90.4],[3.0,56.6],[-1.0,56.4]],"c":[-0.35,73.34],"ang":-1.6505,"side":1,"ws":1,"L":33.9,"W":4.0},{"ring":[[-16.3,85.8],[-12.2,86.0],[-10.1,53.9],[-14.0,53.5]],"c":[-13.16,69.92],"ang":-1.6419,"side":-1,"ws":-1,"L":32.4,"W":4.1},{"ring":[[-5.8,118.3],[-2.4,118.6],[-0.2,92.3],[-4.2,91.7]],"c":[-3.13,104.86],"ang":1.4873,"side":1,"ws":-1,"L":26.7,"W":4.0},{"ring":[[11.5,-92.7],[15.9,-92.4],[17.0,-109.1],[12.6,-109.4]],"c":[14.25,-100.9],"ang":1.505,"side":1,"ws":-1,"L":16.7,"W":4.4}],"street":[[-19.7,122.6],[-10.6,123.4],[-2.5,124.1],[-2.2,120.9],[0.3,91.4],[3.6,54.3],[6.5,20.4],[9.3,-11.7],[13.5,-58.7],[16.3,-91.4],[17.9,-109.8],[20.4,-138.6],[20.6,-140.3],[14.6,-140.6],[11.0,-140.9],[7.6,-141.1],[3.0,-80.2],[1.8,-64.5],[1.4,-59.5],[1.1,-55.7],[-5.4,-56.0],[-8.8,-13.2],[-11.3,18.1],[-14.0,51.7],[-16.9,87.6],[-19.4,119.4]],"keep":[[-6.4,-56.1],[-20.7,122.7],[-20.0,123.6],[-2.6,125.1],[-1.6,124.4],[21.6,-140.2],[20.7,-141.3],[7.7,-142.1],[6.7,-141.3],[0.3,-58.1],[-0.8,-56.9],[-5.5,-57.0]]};

const D_SOLA = {"west":[[[-64.0,-33.6],[-113.2,-28.0],[-118.3,-26.3],[-118.3,-23.7],[-121.4,-23.3],[-121.4,-21.1],[-141.2,-18.9],[-168.0,-10.2],[-168.0,26.9],[-162.0,27.3],[-156.6,30.6],[-153.4,36.1],[-152.4,45.1],[-150.0,45.9],[-143.7,46.2],[-64.0,37.6]]],"tower":[[[16.0,-42.8],[-64.0,-33.6],[-64.0,37.6],[-58.8,37.0],[-51.8,20.5],[-52.3,12.0],[-50.4,4.3],[-46.3,-2.5],[-39.6,-8.4],[-30.9,-29.1],[-17.4,-11.2],[-10.4,-7.9],[-4.6,-2.5],[-0.5,4.3],[1.0,9.3],[1.5,13.8],[10.6,25.7],[16.0,22.1]]],"east":[[[181.2,20.4],[188.9,14.1],[190.8,3.8],[188.6,-20.7],[186.0,-20.3],[188.4,6.2],[187.1,11.1],[181.4,15.5],[176.7,17.2],[178.7,21.2]],[[134.0,-23.2],[134.5,-23.9],[180.6,-28.9],[156.8,-71.6],[150.4,-70.3],[138.9,-66.2],[107.7,-58.2],[85.8,-55.8],[70.1,-52.3],[70.2,-49.0],[16.0,-42.8],[16.0,22.1],[36.8,8.4],[42.0,6.9],[53.4,6.3],[57.5,7.2],[70.3,13.8],[73.0,16.2],[75.9,20.2],[138.9,14.3]]],"station":[[[-177.5,-4.6],[-190.6,-3.1],[-206.2,0.8],[-202.9,41.4],[-200.5,43.1],[-168.0,39.9],[-168.0,-10.2],[-177.0,-7.2]]],"west_t":[[[-165.9,39.7],[-164.6,54.9],[-152.2,58.8],[-143.3,59.2],[-64.0,50.7],[-64.0,37.6],[-143.7,46.2],[-150.0,45.9],[-152.4,45.1],[-153.4,36.1],[-156.6,30.6],[-160.8,27.8],[-167.0,26.7],[-168.0,26.9],[-168.0,39.9]]],"tower_t":[[[-56.1,49.8],[-52.4,53.4],[8.6,45.9],[11.7,40.6],[16.0,37.7],[16.0,22.1],[10.6,25.7],[15.1,31.7],[-7.6,34.8],[-12.7,38.4],[-20.2,41.1],[-28.1,41.5],[-33.3,40.4],[-37.9,38.5],[-60.5,41.1],[-58.8,37.0],[-64.0,37.6],[-64.0,50.7]]],"east_t":[[[42.8,19.9],[52.8,19.3],[63.2,24.7],[69.8,33.8],[166.2,24.8],[178.7,21.2],[176.7,17.2],[170.4,19.5],[140.3,22.0],[138.9,14.3],[75.9,20.2],[73.0,16.2],[70.3,13.8],[57.5,7.2],[53.4,6.3],[42.0,6.9],[36.8,8.4],[16.0,22.1],[16.0,37.7]]],"east_ring":[[134.6,-23.3],[140.4,21.4],[170.3,18.9],[181.1,15.0],[186.5,10.9],[187.8,6.2],[185.4,-20.5],[181.0,-20.4],[179.9,-28.2]],"sky":[-25.44,14.59]};

// ===== The riverside beer hall and its brewery's headquarters tower (Azumabashi, Sumida bank), 1989 — generic forms, no brand.
// Hall: polished black granite body whose walls flare outward to the flat roof (Philippe Starck), crowned by the large gilded
// "flame" sculpture (over 300 t); 44.1 m to the top of the flame (OSM height); the body / flame split is estimated.
LANDMARKS.tyasahihall = {zh:'隅田川畔啤酒厅（金色火焰）', en:'Sumida riverside beer hall (golden flame building)', cat:'new', r:27, h:44.1,
  lt:{m:0, c:'#ffd9a8', k:0.75, e:0.5, anim:'none'},
  build(){
    const g = new THREE.Group(), B = mkB(), f = FR(0, 0, 0);
    const BLK = '#202226', GOLD = {c:'#d6a23a', m:0, lc:'#ffe0a0', lk:1.25}, GL = {c:'#2c3238', glow:'#ffd9a8', gk:0.35}, ST = '#5d5f62';
    // podium and the flaring body (32 x 19.5 m at the foot -> 37.3 x 23.9 m at the 25 m roof)
    fbox(B(ST), f, 0, 0, 30.0, 18.6, -2.5, 1.2);
    const S = []; for (let i = 0; i <= 6; i++){ const t = i/6, e = Math.pow(t, 1.6), a = (28 + 9.3*e)/2, b = (17 + 6.9*e)/2, y = 1.2 + 23.8*t;
      S.push([f(-a, y, -b), f(a, y, -b), f(a, y, b), f(-a, y, b)]); }
    loft(B(BLK), S, true);
    // a few small portholes and the glazed entrance at the foot
    for (let i = 0; i < 6; i++) for (const s of [-1, 1]){ const u = -12.5 + i*5; fbox(B(GL), f, u, s*(8.6 + 0.12*(8 + (i % 2)*5)), 1.2, 0.3, 8 + (i % 2)*5, 9.2 + (i % 2)*5); }
    fbox(B(GL), f, 0, 8.6, 10, 0.4, 1.2, 4.6);
    // the flame: a gilded horn lying on the roof, bulbous head at one end, the tail rising and curling at the other
    const N = 22, M = 12, ctr = t => [-14 + 31*t, 25 + 5.6*Math.sin(PI*Math.min(1, t*0.9))*(1 - t*0.35) + 18.5*Math.pow(t, 3), 2.2*Math.sin(t*2.6)],
      rad = t => 6.2*Math.pow(1 - t, 0.75)*(t < 0.12 ? Math.sqrt(t/0.12)*0.85 + 0.15 : 1) + 0.25;
    const R = []; for (let i = 0; i <= N; i++){ const t = i/N, c = ctr(t), c2 = ctr(Math.min(1, t + 0.01)), c1 = ctr(Math.max(0, t - 0.01));
      const d = [c2[0] - c1[0], c2[1] - c1[1], c2[2] - c1[2]], L = Math.hypot(...d), T = d.map(q => q/L);
      let n1 = [-T[1], T[0], 0]; const l1 = Math.hypot(...n1); n1 = n1.map(q => q/l1); const n2 = [T[1]*n1[2] - T[2]*n1[1], T[2]*n1[0] - T[0]*n1[2], T[0]*n1[1] - T[1]*n1[0]];
      const r = rad(t), ring = []; for (let k = 0; k < M; k++){ const a = k/M*TAU, sq = 1 + 0.12*Math.cos(2*a); ring.push(f(c[0] + (n1[0]*Math.cos(a) + n2[0]*Math.sin(a))*r*sq, Math.max(24.6, c[1] + (n1[1]*Math.cos(a) + n2[1]*Math.sin(a))*r*sq), c[2] + (n1[2]*Math.cos(a) + n2[2]*Math.sin(a))*r*sq)); }
      R.push(ring); }
    loft(B(GOLD), R, true);
    B.flush(g); return g; }};
SG_PLACES.push({type:'tyasahihall', lat:35.709832, lon:139.8003216, rot:0.9634});

// Tower: 22 storeys, amber glass shaft with a white top (the "glass of beer" with its froth); 95.1 m (OSM height). Plan = the
// real outline with its cut corner.
LANDMARKS.tyasahitower = {zh:'隅田川畔啤酒总部大楼', en:'Sumida riverside brewery headquarters tower', cat:'new', r:30, h:95.1,
  lt:{m:1, c:'#ffe2b0', k:0.55, fh:4.3, cw:3.2},
  build(){
    const g = new THREE.Group(), B = mkB();
    const P = [[-19.43, -19.3], [-19.33, 7.0], [-7.43, 19.3], [19.43, 19.3], [19.27, -19.29]];
    const AMB = {c:'#b98a33', m:1, fh:4.3, cw:3.2}, FR2 = '#8a6a2c', WH = {c:'#f1efe8', m:0, lc:'#fff4dc', lk:0.8}, GL = {c:'#3b3a36', glow:'#ffe6c0', gk:0.5};
    prism(B(GL), offRing(P, -0.6), -2.5, 6.0, false);
    prism(B(AMB), P, 6.0, 78.5, false);
    for (let y = 9.8; y < 78; y += 4.3){ const Q = offRing(P, 0.12); for (let i = 0; i < Q.length; i++){ const a = Q[i], b = Q[(i + 1) % Q.length]; beam(B(FR2), [a[0], y, a[1]], [b[0], y, b[1]], 0.14); } }
    // the white top: four storeys flaring slightly, with a rounded crest
    const Pw = offRing(P, 0.7); prism(B(WH), Pw, 78.5, 93.6, true);
    for (const y of [82.5, 86.5, 90.5]){ const Q = offRing(P, 0.75); for (let i = 0; i < Q.length; i++){ const a = Q[i], b = Q[(i + 1) % Q.length]; beam(B('#9a9890'), [a[0], y, a[1]], [b[0], y, b[1]], 0.22); } }
    prism(B(WH), offRing(P, -1.2), 93.6, 95.1, true);
    // aviation light
    box(B({c:'#c22', glow:'#ff2a1a', gk:2}), 0, 0, 0.8, 0.8, 95.1, 95.9, 0);
    B.flush(g); return g; }};
SG_PLACES.push({type:'tyasahitower', lat:35.7101065, lon:139.8007088, rot:0.9601});

// ===== Nakamise-dōri (仲见世商店街), SITE: the ~250 m approach from Kaminarimon to Hōzōmon between two rows of small shops in
// vermilion-painted two-storey row buildings with tiled roofs (the 13 real OSM row outlines). Generic open shopfronts, plain
// signboards (no names), a pent roof over each shopfront, stone paving and lamps along the street.
Object.assign(SITES, {tynakamise:{zh:'仲见世商店街', en:'Nakamise-dōri', lat:35.712311, lon:139.796497, r:148, keep:D_NAKA.keep, keepRoads:[11, 12], h:9,
  lt:{m:0, c:'#ffc58a', k:0.75, e:0.5, anim:'none'},
  build(ctx){
    const g = new THREE.Group(), B = mkB(), gy = ctx.gy, R = ctx.rng;
    const VW = '#bf4a33', VD = '#9a3526', ROOF = '#596066', RID = '#3e4246', SHOP = {c:'#e8cfa0', glow:'#ffcf8a', gk:0.8}, SH = '#7a2f24',
      SIGN = ['#f1ead8', '#2d2a26', '#e7d9b0', '#b33a2b'], WIN = {c:'#3a3430', glow:'#ffd9a0', gk:0.35}, PAVE = '#b5aea2';
    ctx.paint(D_NAKA.keep, [182, 175, 163]);
    for (const o of D_NAKA.rows){
      const f = FR(o.c[0], o.c[1], o.ang), L = o.L, W = o.W, ws = o.ws, y0 = Math.min(...o.ring.map(q => gy(q[0], q[1]))), hw = W/2;
      // body: ground floor shops (open fronts) and the upper storey
      prism(B(VW), o.ring, y0 - 1.5, y0 + 6.3, false);
      const n = Math.max(2, Math.round(L/3.3)), sw = L/n;
      for (let i = 0; i < n; i++){ const u = -L/2 + sw*(i + 0.5), open = R() < 0.82;
        fbox(B(open ? SHOP : SH), f, u, ws*(hw + 0.02), sw - 0.45, 0.12, y0 + 0.15, y0 + 2.75);
        fbox(B(VD), f, u - sw/2, ws*(hw + 0.08), 0.3, 0.3, y0, y0 + 3.0);
        fbox(B(SIGN[(R()*SIGN.length) | 0]), f, u, ws*(hw + 0.12), sw*0.62, 0.1, y0 + 3.75, y0 + 4.45);
        fbox(B(WIN), f, u, ws*(hw + 0.05), sw*0.42, 0.1, y0 + 4.8, y0 + 5.7); }
      // pent roof over the shopfronts, projecting 1.1 m into the street
      { const a0 = f(-L/2, y0 + 3.55, ws*(hw + 0.0)), a1 = f(L/2, y0 + 3.55, ws*(hw + 0.0)), b0 = f(-L/2, y0 + 3.05, ws*(hw + 1.1)), b1 = f(L/2, y0 + 3.05, ws*(hw + 1.1));
        quad(B(ROOF), a0, a1, b1, b0); beam(B(RID), b0, b1, 0.08); }
      // the roof: a low hip roof with grey tiles
      tRoof(B, f, {L:L + 0.6, W:W + 0.8, y:y0 + 6.2, h:1.9, k:Math.max(0.5, (L - W)/2), pw:1.25, lift:0.2, col:ROOF, hip:RID, rw:0.35, nt:3, n:3});
      // lamps on the street side
      for (let u = -L/2 + 4; u < L/2; u += 9){ const p = f(u, 0, ws*(hw + 1.0)); ctx.lamp(p[0], y0 + 3.0, p[2], [255, 205, 150]); }
    }
    B.flush(g); return g; }}});

// ===== Sensō-ji (浅草寺). Colours: vermilion woodwork, white plaster, grey (titanium) tile roofs; warm night light-up.
// All four face south (+z local); local x runs along the long axis of each real footprint (rot from the OSM outline).
const SJ = {VER:'#b23a2b', ROOF:'#555b61', RID:'#3b3f44', UND:'#8e3326', WALL:'#ece5d5', STONE:'#a8a194', DARK:'#2b2622',
  LANT:{c:'#c8281e', glow:'#ff5a2a', gk:0.95}, BLK:'#1e1b19', GOLD:{c:'#c9a640', glow:'#ffd27a', gk:0.25}, BRZ:'#56685a', GRN:'#4f6b55',
  FUJ:'#4f7a62', RAI:'#a8463a', LAMP:{c:'#f2e6c8', glow:'#ffd9a0', gk:1.1}};
const SJLT = {m:0, c:'#ffc58a', k:1.2, e:0.45, anim:'none'};

// ---- Kaminarimon (雷门), 1960: gable-roofed eight-legged gate, 11.7 m high, 11.4 m wide (en.wikipedia), about 6 m deep
// (69.3 m2); the red lantern 3.9 m high, 3.3 m wide, about 700 kg; Fūjin (east) and Raijin (west) in the front bays,
// Tenryū and Kinryū at the back. The roof outline is the OSM footprint (17.5 x 12.5 m).
LANDMARKS.tykaminarimon = {zh:'雷门', en:'Kaminarimon', cat:'old', r:17, h:11.7, lt:SJLT,
  build(){
    const g = new THREE.Group(), B = mkB(), f = FR(0, 0, 0), S = SJ;
    fbox(B(S.STONE), f, 0, 0, 12.8, 7.6, -2.5, 0.45);
    fbox(B('#9e978b'), f, 0, 7.5, 18.0, 13.0, -2.5, -0.35);                         // stone forecourt paving in front of the gate
    const U = [-5.7, -2.2, 2.2, 5.7], Wr = [-3.05, 0, 3.05];
    for (const u of U) for (const w of Wr) col8(B(S.VER), u, w, w === 0 ? 0.42 : 0.34, 0.45, 6.3);
    for (const u of U){ fbox(B(S.STONE), f, u, -3.05, 0.9, 0.9, 0.3, 0.7); fbox(B(S.STONE), f, u, 3.05, 0.9, 0.9, 0.3, 0.7); }
    // tie beams and bracket band
    for (const w of Wr) fbox(B(S.VER), f, 0, w, 12.4, 0.45, 5.6, 6.3);
    for (const u of U) fbox(B(S.VER), f, u, 0, 0.45, 6.9, 5.6, 6.3);
    fbox(B(S.VER), f, 0, 0, 12.6, 7.3, 6.3, 6.75);
    for (let i = 0; i < 13; i++){ const u = -6 + i; for (const w of [-3.4, 3.4]) fbox(B(S.VER), f, u, w, 0.55, 0.9, 6.75, 7.3); }
    for (let i = 0; i < 7; i++){ const w = -3 + i; for (const u of [-6.05, 6.05]) fbox(B(S.VER), f, u, w, 0.9, 0.55, 6.75, 7.3); }
    fbox(B(S.WALL), f, 0, 0, 12.0, 6.6, 6.75, 7.25);
    // side bays: lattice screens front and back, the statues behind
    for (const s of [-1, 1]){ const uc = s*3.95;
      koshi(B(S.VER), f, uc - 1.6, uc + 1.6, 3.05, 0.6, 4.6, 0.32); koshi(B(S.VER), f, uc - 1.6, uc + 1.6, -3.05, 0.6, 4.6, 0.32);
      fbox(B(S.VER), f, uc, 3.05, 3.5, 0.3, 4.6, 5.6); fbox(B(S.VER), f, uc, -3.05, 3.5, 0.3, 4.6, 5.6);
      fbox(B(S.DARK), f, uc, 0, 3.4, 0.25, 0.45, 5.6);                               // partition on the centre line
      fbox(B(S.STONE), f, uc, 1.6, 2.4, 2.0, 0.45, 1.3); fbox(B(S.STONE), f, uc, -1.6, 2.4, 2.0, 0.45, 1.3);
      // the gods: a rough seated / dancing figure each side (front), the dragon gods at the back
      const fc = s > 0 ? S.FUJ : S.RAI; fbox(B(fc), f, uc, 1.5, 1.3, 1.0, 1.3, 3.4); cyl(B(fc), uc, 1.5, 0.5, 0.45, 3.4, 4.2, 8, true);
      cyl(B(s > 0 ? S.GRN : S.GOLD), uc, 1.2, 1.25, 1.1, 3.8, 4.4, 10);                  // the wind bag / drum ring
      fbox(B(S.DARK), f, uc, -1.6, 1.0, 0.9, 1.3, 3.8); cyl(B(S.DARK), uc, -1.6, 0.42, 0.4, 3.8, 4.5, 8, true); }
    // the great lantern in the central bay
    chochin(B, f(0, 0, 0), 1.65, 2.2, 3.9, S.LANT, S.BLK); fbox(B(S.BLK), f, 0, 0, 0.3, 0.3, 6.1, 6.3); fbox(B(S.DARK), f, 0, 0, 1.6, 1.6, 2.05, 2.22);
    // gable roof: eaves 7.4 m, ridge 11.2 m (+ ridge tiles to 11.7)
    gRoof(B, f, {L:17.46, W:12.5, y:7.35, h:3.9, pw:1.55, col:S.ROOF, und:S.UND, hip:S.RID, gcol:S.WALL, rw:0.5});
    fbox(B(S.RID), f, -8.6, 0, 0.6, 0.9, 10.9, 11.7); fbox(B(S.RID), f, 8.6, 0, 0.6, 0.9, 10.9, 11.7);
    fbox(B(S.BLK), f, 0, 3.35, 1.7, 0.15, 6.35, 7.25);                                   // the name board (plain)
    B.flush(g); return g; }};
SG_PLACES.push({type:'tykaminarimon', lat:35.7111335, lon:139.796368, rot:-0.0803});

// ---- Hōzōmon (宝藏门), 1964: two-storey gate (nijūmon), 22.7 m high, 21 m wide, 8 m deep (en.wikipedia); hip-and-gable
// roof; the red lantern 3.75 m x 2.7 m between two copper lanterns 2.75 m; the Niō (5.45 m) in the outer front bays; the
// two straw sandals (4.5 x 1.5 m) on the north face. Upper roof outline = the OSM footprint (31.5 x 18.1 m).
LANDMARKS.tyhozomon = {zh:'宝藏门', en:'Hōzōmon', cat:'old', r:19, h:22.7, lt:SJLT,
  build(){
    const g = new THREE.Group(), B = mkB(), f = FR(0, 0, 0), S = SJ;
    fbox(B(S.STONE), f, 0, 0, 23.4, 10.4, -2.5, 0.6);
    const U = [-10.5, -6.3, -2.1, 2.1, 6.3, 10.5], Wr = [-4, 0, 4];
    for (const u of U) for (const w of Wr) col8(B(S.VER), u, w, 0.5, 0.6, 8.1);
    for (const w of Wr) fbox(B(S.VER), f, 0, w, 21.6, 0.55, 6.9, 7.6);
    for (const u of U) fbox(B(S.VER), f, u, 0, 0.55, 8.6, 6.9, 7.6);
    // outer bays: walls with the Niō (front) and storerooms (back)
    for (const s of [-1, 1]){ const uc = s*8.4;
      fbox(B(S.WALL), f, s*10.5, 0, 0.35, 8, 0.6, 6.9); fbox(B(S.DARK), f, uc, 0, 4.0, 0.3, 0.6, 6.9);
      koshi(B(S.VER), f, uc - 1.9, uc + 1.9, 4.0, 1.4, 6.6, 0.35); fbox(B(S.VER), f, uc, 4.0, 4.0, 0.3, 0.6, 1.4);
      fbox(B(S.STONE), f, uc, 2.0, 2.6, 2.4, 0.6, 1.4); fbox(B(S.RAI), f, uc, 2.0, 1.4, 1.0, 1.4, 5.4); cyl(B(S.RAI), uc, 2.0, 0.55, 0.5, 5.4, 6.6, 8, true);
      fbox(B(S.WALL), f, uc, -4.0, 4.0, 0.3, 0.6, 6.9);
      // straw sandals on the north wall
      fbox(B('#c9b27a'), f, uc, -4.25, 1.5, 0.3, 1.2, 5.7); }
    // lanterns: red chōchin in the centre, copper tsuri-dōrō in the flanking passages
    chochin(B, f(0, 0, 0), 1.35, 3.15, 3.75, S.LANT, S.BLK);
    for (const s of [-1, 1]){ const c = f(s*4.2, 0, 0); cyl(B(S.BRZ), c[0], c[2], 0.9, 0.7, 4.2, 5.6, 6); cyl(B(S.BRZ), c[0], c[2], 0.6, 1.25, 5.6, 6.6, 6); cyl(B(S.BRZ), c[0], c[2], 0.15, 0.15, 6.6, 6.9, 6);
      cyl(B(S.LAMP), c[0], c[2], 0.72, 0.62, 4.4, 5.5, 6); }
    // bracket band and the lower (pent) roof at the first floor
    fbox(B(S.VER), f, 0, 0, 22.2, 9.2, 7.6, 8.3);
    for (let i = 0; i < 23; i++) for (const w of [-4.7, 4.7]) fbox(B(S.VER), f, -11 + i, w, 0.55, 1.0, 8.15, 8.55);
    for (let i = 0; i < 9; i++) for (const u of [-11.1, 11.1]) fbox(B(S.VER), f, u, -4 + i, 1.0, 0.55, 8.15, 8.55);
    tRoof(B, f, {L:28.6, W:15.8, y:8.1, h:1.9, k:10.8, pw:1.3, lift:0.35, col:S.ROOF, und:S.UND, hip:S.RID, rw:0.35, nt:3});
    // upper storey: balcony with railing, walls with white panels and windows
    fbox(B(S.VER), f, 0, 0, 23.2, 10.0, 9.4, 10.0);
    for (let i = 0; i <= 23; i++){ for (const w of [-4.95, 4.95]) fbox(B(S.VER), f, -11.5 + i, w, 0.16, 0.16, 10.0, 11.0); }
    for (let i = 0; i <= 10; i++){ for (const u of [-11.55, 11.55]) fbox(B(S.VER), f, u, -5 + i, 0.16, 0.16, 10.0, 11.0); }
    for (const w of [-4.95, 4.95]) fbox(B(S.VER), f, 0, w, 23.2, 0.2, 10.9, 11.1); for (const u of [-11.55, 11.55]) fbox(B(S.VER), f, u, 0, 0.2, 10.1, 10.9, 11.1);
    fbox(B(S.WALL), f, 0, 0, 20.4, 7.4, 10.0, 15.2);
    for (const u of U) for (const w of [-3.8, 3.8]) col8(B(S.VER), u*0.97, w, 0.38, 10.0, 15.4);
    for (const u of [-8.2, -4.1, 0, 4.1, 8.2]) for (const w of [-3.75, 3.75]) { koshi(B(S.GRN), f, u - 1.1, u + 1.1, w*1.01, 11.4, 13.9, 0.28); fbox(B(S.VER), f, u, w, 3.4, 0.25, 14.4, 15.2); }
    for (const w of [-3.8, 3.8]) fbox(B(S.VER), f, 0, w, 20.8, 0.4, 15.0, 15.6);
    // upper bracket band and the hip-and-gable roof: eaves 16.2 m, ridge 22.7 m
    fbox(B(S.VER), f, 0, 0, 21.4, 8.6, 15.6, 16.3);
    for (let i = 0; i < 21; i++) for (const w of [-4.6, 4.6]) fbox(B(S.VER), f, -10 + i, w, 0.6, 1.2, 16.2, 16.8);
    for (let i = 0; i < 8; i++) for (const u of [-10.9, 10.9]) fbox(B(S.VER), f, u, -3.5 + i, 1.2, 0.6, 16.2, 16.8);
    tRoof(B, f, {L:31.5, W:18.05, y:16.2, h:5.7, k:7.2, gab:0.55, pw:1.6, lift:0.55, col:S.ROOF, und:S.UND, hip:S.RID, gcol:S.VER, rw:0.75});
    for (const s of [-1, 1]){ fbox(B(S.RID), f, s*7.6, 0, 0.9, 1.0, 22.0, 22.9); }
    B.flush(g); return g; }};
SG_PLACES.push({type:'tyhozomon', lat:35.7139335, lon:139.796656, rot:-0.0795});
// the four pavilions (amulet / fortune offices and the like) in two symmetric pairs on either side of the court between Hōzōmon and
// the Main Hall: one storey, vermilion posts, hip-and-gable roofs on the real OSM outlines; heights estimated. Unlabelled sub-key.
LANDMARKS.tyhozomon_b = {zh:'浅草寺授与所', en:'Sensō-ji pavilions', cat:'old', r:32, h:8.2, label:false, lt:SJLT,
  build(){
    const g = new THREE.Group(), B = mkB(), S = SJ;
    // pavilion centred (cx, cz), du across (x), dw along (z): stone base, white walls, vermilion posts, hip-and-gable roof
    const pav = (cx, cz, du, dw, open) => { const f = FR(cx, cz, 0), f9 = FR(cx, cz, HP);
      fbox(B(S.STONE), f, 0, 0, du, dw, -2.5, 0.45); fbox(B(S.WALL), f, 0, 0, du - 2, dw - 2, 0.45, 3.9);
      const nu = Math.max(2, Math.round((du - 2)/2.6)), nw = Math.max(2, Math.round((dw - 2)/3.2));
      for (let i = 0; i <= nu; i++) for (const s of [-1, 1]) col8(B(S.VER), cx - (du - 2)/2 + i*(du - 2)/nu, cz + s*(dw - 2)/2, 0.2, 0.45, 4.1);
      for (let i = 1; i < nw; i++) for (const s of [-1, 1]) col8(B(S.VER), cx + s*(du - 2)/2, cz - (dw - 2)/2 + i*(dw - 2)/nw, 0.2, 0.45, 4.1);
      fbox(B(S.LAMP), f, open*(du/2 - 1.05), 0, 0.12, dw - 4, 1.0, 2.9);          // the open counter facing the court
      fbox(B(S.VER), f, 0, 0, du - 1.4, dw - 1.4, 3.9, 4.3);
      tRoof(B, f9, {L:dw - 0.1, W:du, y:4.2, h:3.5, k:Math.max(1, (dw - du)/2 + 1), gab:0.5, pw:1.5, lift:0.4, col:S.ROOF, und:S.UND, hip:S.RID, gcol:S.VER, rw:0.4, nt:5}); };
    pav(-10.0, 0, 9.7, 14.6, 1); pav(10.0, 0, 9.7, 14.6, -1);                     // OSM w99157051 / w99157053
    pav(-9.2, -20.1, 8.3, 13.3, 1); pav(9.7, -20.4, 10.3, 14.1, -1);              // OSM w99157059 / w173154781
    B.flush(g); return g; }};
SG_PLACES.push({type:'tyhozomon_b', lat:35.7141763, lon:139.7966826, rot:-0.0795});

// ---- Main Hall (本堂, Kannon-dō), rebuilt 1958 in reinforced concrete, 29.4 m (OSM height): the very tall hip-and-gable roof
// (re-tiled in titanium 2009-10), raised floor with the veranda, the wide front stair under the porch roof and the great red
// lantern (4.5 m high, 3.5 m wide, ja.wikipedia). Roof outline = the OSM footprint (48.7 x 48 m).
LANDMARKS.tysensoji = {zh:'浅草寺本堂', en:'Sensō-ji Main Hall', cat:'old', r:35, h:29.4, lt:SJLT,
  build(){
    const g = new THREE.Group(), B = mkB(), f = FR(0, 0, 0), S = SJ;
    // raised base and the front stair
    fbox(B(S.STONE), f, 0, -1.5, 38.4, 33.6, -2.5, 2.6);
    for (let i = 0; i < 9; i++) fbox(B(S.STONE), f, 0, 15.2 + i*0.85, 20, 0.85, -2.5, 2.6 - (i + 1)*0.29);
    // veranda with railing, the hall body
    fbox(B(S.VER), f, 0, -1.5, 37.0, 32.2, 2.6, 3.0);
    for (const s of [-1, 1]){ for (let i = 0; i <= 36; i++){ const u = -18 + i; if (s > 0 && Math.abs(u) < 10.2) continue; fbox(B(S.VER), f, u, -1.5 + s*15.95, 0.15, 0.15, 3.0, 4.0); }
      fbox(B(S.VER), f, s > 0 ? 0 : 0, -1.5 + s*15.95, 36.2, 0.2, 3.9, 4.1); }
    for (const s of [-1, 1]){ for (let i = 0; i <= 31; i++) fbox(B(S.VER), f, s*18.35, -17 + i, 0.15, 0.15, 3.0, 4.0); fbox(B(S.VER), f, s*18.35, -1.5, 0.2, 31.8, 3.9, 4.1); }
    fbox(B(S.WALL), f, 0, -2.5, 31.0, 25.0, 3.0, 12.6);
    // columns all round (bays 3.4 m) and the dark lattice doors of the outer sanctuary at the front
    for (let i = 0; i <= 9; i++){ const u = -15.3 + i*3.4; for (const w of [-15.0, 10.0, 12.6]) col8(B(S.VER), u, w, 0.5, 3.0, 12.6); }
    for (let i = 1; i < 8; i++){ const w = -15 + i*3.15; for (const u of [-15.3, 15.3]) col8(B(S.VER), u, w, 0.5, 3.0, 12.6); }
    for (let i = 0; i < 9; i++){ const u = -13.6 + i*3.4; koshi(B(S.DARK), f, u - 1.4, u + 1.4, 10.05, 3.4, 9.2, 0.3); fbox(B(S.VER), f, u, 10.05, 3.0, 0.3, 9.2, 10.4); }
    for (let i = 0; i < 9; i++){ const u = -13.6 + i*3.4; for (const w of [-15.05]) fbox(B(S.VER), f, u, w, 3.0, 0.3, 8.8, 10.4); }
    for (const w of [-15, 10, 12.6]) fbox(B(S.VER), f, 0, w, 31.4, 0.6, 10.4, 11.2);
    for (const u of [-15.3, 15.3]) fbox(B(S.VER), f, u, -1.2, 0.6, 28.4, 10.4, 11.2);
    // brackets under the eaves
    fbox(B(S.VER), f, 0, -1.2, 32.6, 29.6, 11.6, 12.6);
    for (let i = 0; i < 33; i++){ for (const w of [-15.6, 13.2]) fbox(B(S.VER), f, -16 + i, w, 0.6, 1.3, 12.6, 13.6); }
    for (let i = 0; i < 28; i++){ for (const u of [-16.1, 16.1]) fbox(B(S.VER), f, u, -14.8 + i, 1.3, 0.6, 12.6, 13.6); }
    // the main roof: eaves about 13 m, ridge 29.4 m; ridge along x (gables east and west)
    tRoof(B, f, {L:46.8, W:43.2, w:-2.4, y:12.9, h:16.0, k:9.0, gab:0.52, pw:1.75, lift:0.9, col:S.ROOF, und:S.UND, hip:S.RID, gcol:S.VER, rw:1.0, nt:8, n:7});
    for (const s of [-1, 1]) fbox(B(S.RID), f, s*9.8, -2.4, 1.3, 1.4, 28.6, 29.6);
    // the porch roof over the stair (to the south edge of the outline) on four posts
    for (const u of [-9.2, -3.1, 3.1, 9.2]){ col8(B(S.VER), u, 21.2, 0.42, 0.4, 10.6); fbox(B(S.STONE), f, u, 21.2, 1.1, 1.1, -0.5, 0.4); }
    fbox(B(S.VER), f, 0, 21.2, 19.6, 0.5, 9.8, 10.6); fbox(B(S.VER), f, 0, 17.0, 19.6, 0.5, 9.8, 10.6);
    { const N = 5, P = []; for (let i = 0; i <= N; i++){ const t = i/N; P.push([19.0 + t*4.9, 13.6 - 2.6*Math.pow(t, 0.8)]); }
      for (let i = 0; i < N; i++){ const [w0, y0] = P[i], [w1, y1] = P[i + 1]; quad(B(S.ROOF), f(-11, y0, w0), f(11, y0, w0), f(11, y1, w1), f(-11, y1, w1)); quad(B(S.UND), f(-10.8, y0 - 0.35, w0), f(10.8, y0 - 0.35, w0), f(10.8, y1 - 0.35, w1), f(-10.8, y1 - 0.35, w1));
        for (const s of [-1, 1]) beam(B(S.RID), f(s*11, y0, w0), f(s*11, y1, w1), 0.25); } }
    // the great lantern in the porch
    chochin(B, f(0, 0, 18.6), 1.75, 5.3, 4.5, S.LANT, S.BLK);
    // two large bronze incense / lantern stands in front are left out (in the courtyard, not in the outline)
    B.flush(g); return g; }};
SG_PLACES.push({type:'tysensoji', lat:35.7147337, lon:139.7967476, rot:-0.1009});

// ---- Five-storey pagoda (五重塔), rebuilt 1973 (reinforced concrete): the tower about 48 m on a base about 5 m high holding the
// memorial hall (ja.wikipedia), 53.32 m in all (OSM). The base here is the real outline of the low building that wraps the
// pagoda court (OSM w675582837) and the court under the pagoda. First roof = the OSM outline (18.4 x 18.1 m).
LANDMARKS.typagoda = {zh:'浅草寺五重塔', en:'Sensō-ji Five-storey Pagoda', cat:'old', r:47, h:53.3, lt:SJLT,
  build(){
    const g = new THREE.Group(), B = mkB(), f = FR(0, 0, 0), S = SJ;
    // base (5 m): the wrapped wings (real outline, local frame) and the court platform under the tower
    const BASE = [[-21.0,30.8], [20.2,31.0], [20.3,21.3], [31.6,21.3], [31.6,22.9], [39.9,23.0], [39.9,11.1], [31.4,11.1], [31.4,12.5], [20.7,12.5], [20.7,8.0], [22.9,8.0], [23.0,-7.7], [21.0,-7.7], [21.1,-21.7], [-11.1,-21.8], [-11.2,-12.0], [11.2,-11.9], [11.0,21.2], [-11.5,21.1], [-11.3,1.9], [-20.8,1.8]];
    const COURT = [[-11.2,-12.0], [11.2,-11.9], [11.0,21.2], [-11.5,21.1], [-11.3,1.9]];
    prism(B(S.WALL), BASE, -2.5, 4.4, true); prism(B(S.WALL), COURT, -2.5, 4.4, false); flat(B(S.STONE), COURT, 4.4);
    prism(B(S.STONE), offRing(BASE, 0.15), -2.5, 0.9, false);
    for (const P of [BASE, COURT]){ const n = P.length; for (let i = 0; i < n; i++){ const a = P[i], b = P[(i + 1) % n]; beam(B(S.ROOF), [a[0], 4.6, a[1]], [b[0], 4.6, b[1]], 0.35); } }
    prism(B(S.ROOF), BASE.map(q => q), 4.4, 4.75, true);
    // tower: five storeys (body widths 7.6 -> 5.4 m), roofs 18.4 -> 13.6 m with upturned corners
    const T = [[7.6, 18.3, 5.0, 4.4], [7.05, 17.1, 12.3, 3.4], [6.5, 15.9, 18.6, 3.3], [5.95, 14.8, 24.8, 3.2], [5.4, 13.6, 30.9, 3.1]];
    fbox(B(S.STONE), f, 0, 0, 10.2, 10.2, 4.75, 5.3);
    for (let k = 0; k < 5; k++){ const [bw, rw, y0, wh] = T[k], h2 = bw/2;
      // veranda (first storey) / railing deck (upper storeys)
      if (k === 0){ fbox(B(S.VER), f, 0, 0, bw + 2.2, bw + 2.2, 5.3, 5.8); }
      else { fbox(B(S.VER), f, 0, 0, bw + 1.2, bw + 1.2, y0, y0 + 0.35); for (const s of [-1, 1]){ fbox(B(S.VER), f, 0, s*(h2 + 0.55), bw + 1.2, 0.12, y0 + 0.9, y0 + 1.0); fbox(B(S.VER), f, s*(h2 + 0.55), 0, 0.12, bw + 1.2, y0 + 0.9, y0 + 1.0); } }
      const yb = k === 0 ? 5.8 : y0 + 0.35, yt = yb + wh;
      fbox(B(S.WALL), f, 0, 0, bw - 0.4, bw - 0.4, yb, yt);
      for (const a of [-1, -1/3, 1/3, 1]) for (const b of [-1, 1]){ col8(B(S.VER), a*h2, b*h2, 0.24, yb, yt); col8(B(S.VER), b*h2, a*h2, 0.24, yb, yt); }
      for (const s of [-1, 1]){ fbox(B(S.DARK), f, 0, s*(h2 - 0.15), bw*0.3, 0.2, yb, yt - 0.6); fbox(B(S.DARK), f, s*(h2 - 0.15), 0, 0.2, bw*0.3, yb, yt - 0.6);
        koshi(B(S.GRN), f, -h2*0.62, -h2*0.36, s*(h2 - 0.1), yb + 0.9, yt - 0.9, 0.18); koshi(B(S.GRN), f, h2*0.36, h2*0.62, s*(h2 - 0.1), yb + 0.9, yt - 0.9, 0.18); }
      // brackets
      fbox(B(S.VER), f, 0, 0, bw + 0.3, bw + 0.3, yt, yt + 0.5); fbox(B(S.VER), f, 0, 0, bw + 1.3, bw + 1.3, yt + 0.5, yt + 1.05); fbox(B(S.WALL), f, 0, 0, bw + 2.2, bw + 2.2, yt + 1.05, yt + 1.45);
      tRoof(B, f, {L:rw, W:rw, y:yt + 1.2, h:k === 4 ? 4.2 : 1.85, k:0, pw:k === 4 ? 1.3 : 1.25, lift:0.7, col:S.ROOF, und:S.UND, hip:S.RID, rw:0.45, nt:4, n:6});
    }
    // sōrin (finial): base box, inverted bowl, nine rings, the water flame and the jewel at 53.3 m
    const ys = 35.85 + 3.2; fbox(B(S.ROOF), f, 0, 0, 2.2, 2.2, ys - 0.4, ys + 0.6);
    lathe(B(S.GOLD), [[0.2, ys + 0.6], [1.05, ys + 0.7], [0.95, ys + 1.4], [0.35, ys + 1.6]], 10, 0, 0);
    cyl(B(S.GOLD), 0, 0, 0.22, 0.16, ys + 1.6, 53.0, 8);
    for (let i = 0; i < 9; i++){ const y = ys + 2.2 + i*0.95; cyl(B(S.GOLD), 0, 0, 0.95 - i*0.035, 0.95 - i*0.035, y, y + 0.32, 12, true); }
    for (let k = 0; k < 4; k++){ const a = k*HP + PI/4; beam(B(S.GOLD), [Math.cos(a)*0.3, ys + 11.0, -Math.sin(a)*0.3], [Math.cos(a)*1.0, ys + 12.6, -Math.sin(a)*1.0], 0.1); }
    LSph(g, 0.45, 0, 52.7, 0, S.GOLD, 1.2, 10);
    B.flush(g); return g; }};
SG_PLACES.push({type:'typagoda', lat:35.7141024, lon:139.7960352, rot:-0.0926});

// ===== Tokyo Skytree (东京晴空塔), 634 m, 2012. Steel lattice on a triangular plan (one side about 68 m) that morphs into a
// circle at 320 m (ja.wikipedia); Tembō Deck floors 340 / 345 / 350 m, Tembō Galleria 445 / 450 m, gain tower (antenna mast,
// outer diameter about 6 m) from about 497 m to the 634 m top. Colour "Skytree White" (a bluish white). The triangle is oriented
// on the real OSM base triangle (vertices at 97 deg, 217 deg, 337 deg from east). rot 0: local = world axes.
LANDMARKS.tyskytree = {zh:'东京晴空塔', en:'Tokyo Skytree', cat:'new', r:41, h:634,
  lt:{m:0, c:'#9fd8ff', k:1.15, e:0.75, anim:'cycle', c2:'#a274ff'},
  build(){
    const g = new THREE.Group(), B = mkB();
    const W = '#e9eff5', CORE = '#b7bfc7', MET = '#a8b0b8', GL = {c:'#4a5966', glow:'#e4f2ff', gk:0.9}, PODG = {c:'#6f7d8a', glow:'#ffe2bc', gk:0.4}, POD = '#d6dce1',
      ANT = {c:'#e3e8ec', m:0, lc:'#ffffff', lk:1.0}, RED = {c:'#c22', glow:'#ff2a1a', gk:2.2};
    const PV = 97.1*PI/180, RV = 68/Math.sqrt(3), RI = RV/2;            // vertex angle, circumradius 39.3 m, inradius 19.6 m
    const P = (phi, r, y) => [Math.cos(phi)*r, y, -Math.sin(phi)*r];
    // section radius at angle phi and height y
    const RC = [[320, 17.5], [334, 17.6], [366, 16.6], [440, 13.3], [458, 12.7], [497, 5.6]];
    const rUp = y => { for (let i = 0; i < RC.length - 1; i++){ const [y0, r0] = RC[i], [y1, r1] = RC[i + 1]; if (y <= y1) return r0 + (r1 - r0)*(y - y0)/(y1 - y0); } return 5.6; };
    const rad = (phi, y) => {
      if (y >= 320) return rUp(y);
      const t = y/320, s = 1 - Math.pow(1 - t, 1.6), ri = RI + (17.5 - RI)*t, rc = 17.5 + 3.2*(1 - t);
      let d = ((phi - PV - PI/3) % (2*PI/3) + 4*PI) % (2*PI/3) - PI/3;   // angle from the nearest face normal
      const rT = ri/Math.cos(d);
      return rT*(1 - s) + rc*s;
    };
    // ---- lattice: 30 columns (10 per face, the three corners heavier), X bracing per band, ring trusses
    const NC = 30, colA = j => PV + j*TAU/NC;
    const LV = []; for (let y = 0; y <= 320; y += 16) LV.push(y); LV.push(328);
    const LV2 = [366, 381, 396, 411, 426, 440], LV3 = [458, 471, 484, 497];
    const band = (ys, rw) => {
      for (let k = 0; k < ys.length; k++){ const y = ys[k];
        for (let j = 0; j < NC; j++){ const a = colA(j), b = colA(j + 1), A = P(a, rad(a, y), y), Bp = P(b, rad(b, y), y);
          beam(B(W), A, Bp, rw); // ring
          if (k < ys.length - 1){ const y1 = ys[k + 1], A1 = P(a, rad(a, y1), y1), B1 = P(b, rad(b, y1), y1);
            beam(B(W), A, A1, j % 10 === 0 && y < 330 ? 1.25 : 0.55); beam(B(W), A, B1, 0.42); beam(B(W), Bp, A1, 0.42); } } }
    };
    band(LV, 0.5); band(LV2, 0.45); band(LV3, 0.38);
    // the three legs: heavy tubes along the corner lines down to the ground, splayed feet
    for (let k = 0; k < 3; k++){ const a = PV + k*TAU/3; for (let y = 0; y < 160; y += 8){ const A = P(a, rad(a, y), y), A1 = P(a, rad(a, y + 8), y + 8); beam(B(W), A, A1, 1.6); }
      const F = P(a, RV - 2, 0); box(B(POD), F[0], F[2], 5, 5, -3, 4, -a); }
    // ---- core column (8 m) and the elevator shafts inside
    cyl(B(CORE), 0, 0, 4, 4, 0, 372, 12);
    for (let k = 0; k < 4; k++){ const a = PV + PI/4 + k*HP, c = P(a, 7.2, 0); box(B(CORE), c[0], c[2], 3.6, 3.6, 0, k < 2 ? 350 : 340, -a); }
    box(B(CORE), 0, 0, 3.2, 3.2, 350, 446, 0);
    // ---- base: the triangular tower building (OSM parts 0-19 m and 0-38 m) between the legs
    const tri3 = (ri, k) => [0, 1, 2].map(i => { const a = PV + i*TAU/3; const p = P(a, ri*2, 0); return [p[0], p[2]]; });
    const T0 = tri3(RI - 2.5), T1 = tri3(RI - 7);
    prism(B(POD), T0.map(q => [q[0]*0.86, q[1]*0.86]), -3, 19, true);
    for (let i = 0; i < 3; i++){ const a = T0[i], b = T0[(i + 1) % 3]; for (let k = 1; k <= 3; k++){ const y = 1.5 + (k - 1)*5.6;
      const ra = [a[0]*0.87, a[1]*0.87], rb = [b[0]*0.87, b[1]*0.87], m = 0.12; quad(B(PODG), [ra[0] + (rb[0] - ra[0])*m, y, ra[1] + (rb[1] - ra[1])*m], [ra[0] + (rb[0] - ra[0])*(1 - m), y, ra[1] + (rb[1] - ra[1])*(1 - m)], [ra[0] + (rb[0] - ra[0])*(1 - m), y + 3.6, ra[1] + (rb[1] - ra[1])*(1 - m)], [ra[0] + (rb[0] - ra[0])*m, y + 3.6, ra[1] + (rb[1] - ra[1])*m]); } }
    prism(B(PODG), T1.map(q => [q[0]*0.8, q[1]*0.8]), 19, 38, true);
    // ---- Tembō Deck (floors 340, 345, 350): metal fascias and three glass bands, the 350 floor the tallest
    lathe(B(MET), [[17.4, 328], [21.5, 333], [23.6, 337.5], [23.8, 338.2]], 40, 0, 0);
    lathe(B(GL), [[23.8, 338.2], [24.0, 342]], 40, 0, 0);
    lathe(B(MET), [[24.0, 342], [24.3, 344.2]], 40, 0, 0);
    lathe(B(GL), [[24.3, 344.2], [24.5, 347.6]], 40, 0, 0);
    lathe(B(MET), [[24.5, 347.6], [24.9, 349.6]], 40, 0, 0);
    lathe(B(GL), [[24.9, 349.6], [25.4, 356.2]], 40, 0, 0);
    lathe(B(MET), [[25.4, 356.2], [25.2, 358.2], [22.5, 361.5], [16.8, 366.5]], 40, 0, 0);
    for (let i = 0; i < 40; i++){ const a = i/40*TAU; beam(B(MET), P(a, 25.0, 349.8), P(a, 25.45, 356.1), 0.18); }
    // ---- Tembō Galleria (445 / 450 m): the sloping glass tube round the shaft
    lathe(B(MET), [[13.2, 437], [16.0, 440.5], [16.6, 442]], 36, 0, 0);
    lathe(B(GL), [[16.6, 442], [16.9, 452]], 36, 0, 0);
    lathe(B(MET), [[16.9, 452], [16.7, 453.6], [14.6, 456.5], [12.6, 459]], 36, 0, 0);
    for (let i = 0; i < 36; i++){ const a = i/36*TAU; beam(B(MET), P(a, 16.75, 442), P(a + 0.35, 16.95, 452), 0.15); }
    // ---- gain tower (antenna mast) 497-634 m
    lathe(B(W), [[5.8, 495], [4.6, 499], [3.9, 503]], 18, 0, 0);
    cyl(B(ANT), 0, 0, 3.6, 3.0, 503, 590, 16);
    for (let y = 507; y < 586; y += 9){ cyl(B(ANT), 0, 0, 3.95, 3.95, y, y + 2.2, 16); }
    for (let k = 0; k < 6; k++){ const a = k*TAU/6; beam(B(ANT), P(a, 3.5, 503), P(a, 3.0, 590), 0.3); }
    cyl(B(ANT), 0, 0, 3.0, 2.2, 590, 612, 14); cyl(B(ANT), 0, 0, 2.6, 2.6, 598, 603, 14);
    cyl(B(ANT), 0, 0, 2.2, 1.2, 612, 626, 12); cyl(B(ANT), 0, 0, 0.55, 0.25, 626, 633.2, 8, true);
    // aviation lights
    for (const [y, r, n] of [[633.2, 0, 1], [612, 2.3, 4], [590, 3.1, 4], [497, 5.8, 6], [458, 12.8, 6], [366, 16.9, 6]]){
      for (let i = 0; i < n; i++){ const a = i/n*TAU + 0.3, c = n === 1 ? [0, y, 0] : P(a, r + 0.4, y); box(B(RED), c[0], c[2], 0.9, 0.9, c[1], c[1] + 0.9, 0); } }
    B.flush(g); return g; }};
SG_PLACES.push({type:'tyskytree', lat:35.7100455, lon:139.810714, rot:0});

// ===== Tokyo Skytree Town (2012): Solamachi, the long commercial complex at the foot of the tower (West Yard with the station
// end, Tower Yard round the tower's base, East Yard under the East Tower), and the 31-storey East Tower (158 m, OSM height).
// The blocks are the real OSM outline (r7967788) minus the tower base, the East Tower and an 8 m strip along the Tōbu viaduct;
// storey heights 5 m, the yard heights (14-36 m) and the river-side terraces are estimates. No shop names or signs.
LANDMARKS.tysolamachi = {zh:'东京晴空街道', en:'Tokyo Solamachi', cat:'new', r:212, h:36,
  lt:{m:1, c:'#ffe6c4', k:0.5, fh:5.0, cw:3.0},
  build(){
    const g = new THREE.Group(), B = mkB(), D = D_SOLA;
    const SOL = '#dadddd', GLS = {c:'#55636f', m:1, fh:5.0, cw:3.0}, GRN = '#6e8d58', RF = '#a7abab', FIN = '#eef0f0', DECK = '#b9b4aa';
    const block = (P, H, garden) => {
      prism(B(SOL), P, -3, 1.2, false);
      for (let y = 1.2; y < H - 0.5; y += 5){ const y1 = Math.min(H, y + 3.4); prism(B(GLS), offRing(P, -0.35), y, y1, false); if (y1 < H) prism(B(SOL), P, y1, Math.min(H, y + 5), false); }
      prism(B(SOL), P, H - 0.2, H + 1.1, false); flat(B(RF), P, H + 1.1);
      if (garden){ const Q = offRing(P, -6); flat(B(GRN), Q, H + 1.25); }
      // vertical louvres on the long faces
      const n = P.length; for (let i = 0; i < n; i++){ const a = P[i], b = P[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 20) continue;
        const nx = (b[1] - a[1])/L, nz = -(b[0] - a[0])/L; for (let t = 4; t < L - 2; t += 6){ const x = a[0] + (b[0] - a[0])*t/L, z = a[1] + (b[1] - a[1])*t/L;
          beam(B(FIN), [x, 1.2, z], [x, H - 0.2, z], 0.18); } }
    };
    for (const P of D.station) block(P, 14, false);
    for (const P of D.west) block(P, 34, false);
    for (const P of D.west_t) block(P, 22, true);
    for (const P of D.tower) block(P, 26, false);
    for (const P of D.tower_t) block(P, 14, true);
    for (const P of D.east) block(P, 36, false);
    for (const P of D.east_t) block(P, 18, true);
    // the river promenade deck along the south edge (low)
    B.flush(g); return g; }};
SG_PLACES.push({type:'tysolamachi', lat:35.710177, lon:139.810995, rot:0});

LANDMARKS.tysolamachieast = {zh:'东京晴空塔东塔', en:'Tokyo Skytree East Tower', cat:'new', r:34, h:158,
  lt:{m:1, c:'#dfe9ff', k:0.6},
  build(){
    const g = new THREE.Group(), B = mkB();
    const P = [[-25.1, -22.9], [-24.14, 22.17], [5.85, 22.9], [17.12, 20.09], [22.83, 16.59], [24.63, 12.05], [25.1, -14.65], [20.82, -15.01], [20.46, -22.9]];
    const SOL = '#dadddd', GLS = {c:'#55636f', m:1, fh:5.0, cw:3.0}, TG = {c:'#7a8a97', m:1, fh:4.2, cw:3.2}, FIN = '#e9ecee', RF = '#9fa4a8';
    // podium (East Yard floors, 36 m) then the office tower set back 1.5 m
    prism(B(SOL), P, -3, 1.2, false);
    for (let y = 1.2; y < 35.5; y += 5){ prism(B(GLS), offRing(P, -0.35), y, y + 3.4, false); prism(B(SOL), P, y + 3.4, Math.min(37.1, y + 5), false); }
    flat(B(RF), P, 37.1);
    const Q = offRing(P, -1.5); prism(B(TG), Q, 37.1, 150.5, false);
    for (let i = 0; i < Q.length; i++){ const a = Q[i], b = Q[(i + 1) % Q.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      for (let t = 0; t <= L; t += 3.2){ const x = a[0] + (b[0] - a[0])*t/L, z = a[1] + (b[1] - a[1])*t/L; beam(B(FIN), [x, 37.1, z], [x, 151, z], 0.16); } }
    for (let y = 41.3; y < 150; y += 4.2){ const R2 = offRing(Q, 0.1); for (let i = 0; i < R2.length; i++){ const a = R2[i], b = R2[(i + 1) % R2.length]; beam(B(FIN), [a[0], y, a[1]], [b[0], y, b[1]], 0.1); } }
    // crown: louvred screen round the plant floors
    const C = offRing(P, -1.3); prism(B(FIN), C, 150.5, 151.4, false); prism(B(RF), offRing(P, -3.5), 151.4, 156.4, true);
    for (let i = 0; i < C.length; i++){ const a = C[i], b = C[(i + 1) % C.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      for (let t = 0; t <= L; t += 1.6){ const x = a[0] + (b[0] - a[0])*t/L, z = a[1] + (b[1] - a[1])*t/L; beam(B(FIN), [x, 151.4, z], [x, 158, z], 0.12); } }
    for (let i = 0; i < C.length; i++){ const a = C[i], b = C[(i + 1) % C.length]; beam(B(FIN), [a[0], 158, a[1]], [b[0], 158, b[1]], 0.2); }
    for (const [x, z] of [[-22, -20], [-21, 19], [19, -19.5], [21, 13]]) box(B({c:'#c22', glow:'#ff2a1a', gk:2}), x, z, 0.8, 0.8, 158, 158.8, 0);
    B.flush(g); return g; }};
SG_PLACES.push({type:'tysolamachieast', lat:35.7102057, lon:139.8127839, rot:0.1077});
}
