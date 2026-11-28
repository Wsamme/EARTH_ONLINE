// ---- lm50/sg50b helpers ----
// shift a ref entry {A, r, p:[{r, b, t}]} so local (C) becomes the model origin
const PREP = (d, C) => ({r:shP(d.r, C[0], C[1]), p:(d.p || []).map(q => ({r:shP(q.r, C[0], C[1]), b:q.b, t:q.t}))});
// hip roof (straight planes) over the frame rectangle u0..u1 x v0..v1 at y, rise h, eaves overhang ov; gable roof when gab
function hipF(o, F, u0, u1, v0, v1, y, h, ov, gab){
  ov = ov || 0; u0 -= ov; u1 += ov; v0 -= ov; v1 += ov;
  const L = u1 - u0, W = v1 - v0, k = gab ? 0 : Math.min(L, W)/2, vm = (v0 + v1)/2, um = (u0 + u1)/2;
  const A = F(u0, y, v0), B = F(u1, y, v0), C = F(u1, y, v1), Dd = F(u0, y, v1);
  let r1, r2;
  if (L >= W){ r1 = F(u0 + k, y + h, vm); r2 = F(u1 - k, y + h, vm); quadP(o, A, B, r2, r1); quadP(o, C, Dd, r1, r2); triP(o, Dd, A, r1); triP(o, B, C, r2); }
  else { r1 = F(um, y + h, v0 + k); r2 = F(um, y + h, v1 - k); quadP(o, B, C, r2, r1); quadP(o, Dd, A, r1, r2); triP(o, A, B, r1); triP(o, C, Dd, r2); }
}
// cap between an outer polygon and holes (plan [x, z]) at y
function capHoleP(o, P, H, y){ const T = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), H.map(h => h.map(p => new THREE.Vector2(p[0], p[1])))); const A = P.concat(...H);
  for (const [a, b, c] of T) o.push(A[a][0], y, A[a][1], A[b][0], y, A[b][1], A[c][0], y, A[c][1]); }
// frame box of a facade frame F(u, v, w) (edgesF / fA style): u0..u1 along, v0..v1 up, w0..w1 out
const fbox = (o, F, u0, u1, v0, v1, w0, w1) => slabP(o, rectO(u0, u1, v0, v1), F, w0, w1);
// a residential slab: walls, corridor / balcony ledges every fh, window ribbons, roof; s = {wall, gl, ledge, roof, fh, ww}
function slab50(B, P, y0, y1, s){
  const fh = s.fh || 3;
  wallP(B.p(s.wall), P, y0, y1); capP(B.p(s.roof || ROOF50), P, y1);
  ribP(B.p(s.gl), P, y0 + fh*0.35, y1 - 0.4, fh, fh*0.45, 0.04);
  if (s.ledge) ledgeP(B.p(s.ledge), P, y0 + fh, y1, fh, s.ld || 0.8, 0.25);
  if (s.par !== false) wallP(B.p(s.wall), offP(P, -0.2), y1, y1 + (s.par || 1.1));
}
// simple low block with punched windows and a parapet; s = {wall, gl, fh, roof, par, bay}
function low50(B, P, y0, y1, s){
  wallP(B.p(s.wall), P, y0, y1); capP(B.p(s.roof || ROOF50), P, y1);
  if (s.gl) winP(B, P, y0 + (s.w0 || 1), y1 - 0.6, s.fh || 4, s.bay || 3.2, s.ww || 1.8, s.wh || (s.fh || 4)*0.5, s.gl, {minL:3});
  if (s.par) wallP(B.p(s.wall), P, y1, y1 + s.par);
}
// a shop / lobby glazing band round plan P from y0 to y1, set in by d
function lobby50(B, P, y0, y1, d){ const Q = offP(P, d == null ? 0.6 : d); wallP(B.p(LOB50), Q, y0, y1); }
// lit window spec shorthand
const GLs = (c, fh, cw) => ({c, m:1, fh:fh || 4, cw:cw || 2.4});
// stone / concrete spec shorthand
const STs = (c, lk) => ({c, m:0, lk:lk == null ? 0.35 : lk});
