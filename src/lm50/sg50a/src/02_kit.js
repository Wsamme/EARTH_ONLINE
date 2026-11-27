// ---- lm50/sg50a kit: tower facade helpers (batched; one LTris per colour spec) ----
// foundation skirt down to y = -5 under a plan polygon
const foundP = (o, P, y1) => wallP(o, P, -5, y1 == null ? 0.3 : y1);
// plain block: walls + roof cap
function blkP(B, P, y0, y1, wall, roof){ wallP(B.p(wall), P, y0, y1); capP(B.p(roof || wall), P, y1); }
// punched windows: on every edge longer than minL, rectangles ww x wh centred in bays of ~`bay` m, one per storey (fh), proud by w
// o.skip(e, i) -> true leaves an edge bare; o.end: bays to leave at each edge end (filled by o.endCol panels if given)
function winP(B, P, y0, y1, fh, bay, ww, wh, col, o){
  o = o || {}; const E = edgesF(P);
  E.forEach((e, i) => {
    if (e.L < (o.minL || 2.2) || (o.skip && o.skip(e, i))) return;
    const n = Math.max(1, Math.round(e.L/bay)), bw = e.L/n, end = Math.min(o.end || 0, Math.floor((n - 1)/2));
    for (let y = y0; y + fh <= y1 + 0.01; y += fh) for (let k = 0; k < n; k++){
      const u = (k + 0.5)*bw, isEnd = k < end || k >= n - end;
      if (isEnd && !o.endCol) continue;
      shapeP(B.p(isEnd ? o.endCol : col), rectO(u - ww/2, u + ww/2, y + (fh - wh)*0.55, y + (fh - wh)*0.55 + wh), e.F, o.w || 0.06);
    }
  });
}
// horizontal spandrel ribbons (height sh every fh) round a plan polygon, proud by w
function ribP(o, P, y0, y1, fh, sh, w){ for (let y = y0; y < y1 - 0.2; y += fh) bandAtP(o, P, y, Math.min(sh, y1 - y), w || 0.05); }
// floor-edge slabs / balcony ledges: a thin ring d m proud of plan P every fh m (walls + top + underside strip)
function ledgeP(o, P, y0, y1, fh, d, t){ const Q = offP(P, -d); for (let y = y0; y < y1 - 0.3; y += fh){ wallP(o, Q, y, y + t); capP(o, Q, y + t); } }
// per-edge wall material: walls of edges with f(e, i) -> colour spec (null = default)
function wallsByEdge(B, P, y0, y1, def, f){ edgesF(P).forEach((e, i) => { const c = (f && f(e, i)) || def; quadP(B.p(c), [e.a[0], y0, e.a[1]], [e.b[0], y0, e.b[1]], [e.b[0], y1, e.b[1]], [e.a[0], y1, e.a[1]]); }); }
// vertical fins on every edge (every `bay` m), d deep, t thick
function finsP(o, P, y0, y1, bay, d, t, skip){ edgesF(P).forEach((e, i) => { if (e.L < 1.5 || (skip && skip(e, i))) return; const n = Math.max(1, Math.round(e.L/bay)), bw = e.L/n;
  for (let k = 1; k < n; k++) slabP(o, rectO(k*bw - t/2, k*bw + t/2, y0, y1), e.F, 0, d); }); }
// regular-ish plan polygon from a centre, half sizes and angle with corner chamfer c (8 points)
const chamR = (cx, cz, a, b, ang, c) => { const C = Math.cos(ang), S = Math.sin(ang); return [[-a + c, -b], [a - c, -b], [a, -b + c], [a, b - c], [a - c, b], [-a + c, b], [-a, b - c], [-a, -b + c]].map(([u, v]) => [cx + u*C - v*S, cz + u*S + v*C]); };
// scale a polygon about its centroid
const scP = (P, s) => { const c = pcen(P); return P.map(p => [c[0] + (p[0] - c[0])*s, c[1] + (p[1] - c[1])*s]); };
// open lattice crown: posts on the polygon's vertices and along edges, rings at heights, diagonals
function latticeP(o, P, y0, y1, step, r, rings, diag){
  const pts = []; for (const e of edgesF(P)){ const n = Math.max(1, Math.round(e.L/step)); for (let k = 0; k < n; k++){ const t = k/n; pts.push([e.a[0] + (e.b[0] - e.a[0])*t, e.a[1] + (e.b[1] - e.a[1])*t]); } }
  for (const p of pts) segP(o, [p[0], y0, p[1]], [p[0], y1, p[1]], r, 4);
  const R = rings || 2; for (let k = 0; k <= R; k++){ const y = y0 + (y1 - y0)*k/R; for (let i = 0; i < pts.length; i++){ const a = pts[i], b = pts[(i + 1) % pts.length]; segP(o, [a[0], y, a[1]], [b[0], y, b[1]], r*0.8, 4); } }
  if (diag) for (let k = 0; k < R; k++){ const ya = y0 + (y1 - y0)*k/R, yb = y0 + (y1 - y0)*(k + 1)/R; for (let i = 0; i < pts.length; i++){ const a = pts[i], b = pts[(i + 1) % pts.length]; segP(o, [a[0], (k + i) % 2 ? ya : yb, a[1]], [b[0], (k + i) % 2 ? yb : ya, b[1]], r*0.7, 4); } }
}
// aircraft warning lamps on the corners of a polygon at y
function lavP(o, P, y){ for (const p of P) boxP(o, 0.5, 0.6, 0.5, p[0], y, p[1]); }
const LAV50 = {c:'#c22', glow:'#ff2a1a', gk:2};
// street trees round a polygon (outside it), skipping points inside any of the `keep out` polygons
function treesRound(B, P, off, step, s, R, out, T, L){ for (const [x, z] of alongP(offP(P, -off), step)){ if (out && out.some(Q => inPolyS(Q, x, z))) continue; treeP(B.p(T || '#5b4a3a'), B.p(L || {c:'#4f7a3e', m:0, lk:0.1}), x, 0.3, z, s, R); } }
// rectangle (half sizes a, b, turned ang) with re-entrant square notches n at the four corners (12 points)
const notchR = (cx, cz, a, b, ang, n) => { const C = Math.cos(ang), S = Math.sin(ang);
  return [[-a+n,-b],[a-n,-b],[a-n,-b+n],[a,-b+n],[a,b-n],[a-n,b-n],[a-n,b],[-a+n,b],[-a+n,b-n],[-a,b-n],[-a,-b+n],[-a+n,-b+n]].map(([u, v]) => [cx + u*C - v*S, cz + u*S + v*C]); };
// Catmull-Rom subdivision of an open chain of [x, z] points (keeps the end points), n pieces per segment
function crChain(P, n){ const out = []; for (let i = 0; i < P.length - 1; i++){ const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
  for (let k = 0; k < n; k++){ const t = k/n, t2 = t*t, t3 = t2*t; out.push([0, 1].map(j => 0.5*(2*p1[j] + (-p0[j] + p2[j])*t + (2*p0[j] - 5*p1[j] + 4*p2[j] - p3[j])*t2 + (-p0[j] + 3*p1[j] - 3*p2[j] + p3[j])*t3))); } }
  out.push(P[P.length - 1].slice()); return out; }
// tagged plan: [[x, z, tag], ...] -> {P, tags} where tags[i] is the tag of the edge from vertex i to i + 1
const tagP = T => ({P:T.map(t => [t[0], t[1]]), tags:T.map(t => t[2])});
// generic tower shaft on plan P between y0 and y1. s.sty: 'cw' glass + mullions + floor bands; 'rib' glass + spandrel ribbons
// (+ mullions); 'fin' glass + vertical fins + thin bands; 'punch' solid wall (s.fr) with a window grid (s.gl).
// s: {gl, fr, mul, band, fh, bay, sh (ribbon height), fd, fw, ww, wh, roof, cap:false, par (parapet height), minL}
function tw50(B, P, y0, y1, s){
  const fh = s.fh || 4, bay = s.bay || 3;
  if (s.sty === 'punch'){ wallP(B.p(s.fr), P, y0, y1); winP(B, P, y0 + (s.w0 || 0), y1, fh, bay, s.ww || 1.4, s.wh || fh*0.55, s.gl, {minL:s.minL || 2}); }
  else {
    wallP(B.p(s.gl), P, y0, y1);
    if (s.sty === 'rib'){ ribP(B.p(s.fr), P, y0 + fh - (s.sh || 1.2), y1, fh, s.sh || 1.2, 0.06); if (s.mul !== null) facadeP(B, P, y0, y1, {mul:s.mul || s.fr, bay, fd:s.fd || 0.2, fw:s.fw || 0.06, fh}); }
    else if (s.sty === 'fin'){ finsP(B.p(s.mul || s.fr), P, y0, y1, bay, s.fd || 0.6, s.fw || 0.25); ribP(B.p(s.band || s.fr), P, y0 + fh, y1, fh, s.bh || 0.3, 0.04); }
    else facadeP(B, P, y0, y1, {mul:s.mul || s.fr, band:s.band || s.fr, bay, fd:s.fd || 0.25, fw:s.fw || 0.07, fh, bh:s.bh || 0.35});
  }
  if (s.cap !== false) capP(B.p(s.roof || '#8e9192'), P, y1);
  if (s.par){ wallP(B.p(s.fr || s.mul), P, y1, y1 + s.par); }
}
