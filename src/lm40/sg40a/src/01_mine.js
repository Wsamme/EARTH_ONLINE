// ---- lm40/sg40a helpers ----
// model origin at local (cx, cz) of a ref anchor -> SG_PLACES lat/lon (rot 0: model axes = map axes, +x east, +z south)
const LL40 = (alat, alon, cx, cz) => ({lat:+(alat - cz/110574).toFixed(7), lon:+(alon + cx/111290.5).toFixed(7)});
// curtain-wall facade on every edge of plan P between y0 and y1: vertical mullions (every `bay` m, `fd` deep) and floor bands
// (every `fh` m); o = {mul, band, bay, fd, fw, fh, bh, skip(e) -> true to leave an edge bare, yb (first band), bands:false}
function facadeP(B, P, y0, y1, o){
  const E = edgesF(P), fw = o.fw || 0.09, fd = o.fd || 0.35, bh = o.bh || 0.5;
  for (const e of E){
    if (e.L < 0.6 || (o.skip && o.skip(e))) continue;
    if (o.mul){ const nb = Math.max(1, Math.round(e.L/(o.bay || 3))), bw = e.L/nb;
      for (let k = (o.ends ? 0 : 1); k <= (o.ends ? nb : nb - 1); k++) slabP(B.p(o.mul), rectO(k*bw - fw, k*bw + fw, y0, y1), e.F, 0, fd); }
    if (o.band && o.bands !== false){ for (let y = (o.yb != null ? o.yb : y0 + o.fh); y < y1 - 0.3; y += o.fh) shapeP(B.p(o.band), rectO(0, e.L, y - bh/2, y + bh/2), e.F, o.bo || 0.06); }
  }
}
// vertical corner posts of plan P (round, radius r) between y0 and y1
function cornersP(o, P, y0, y1, r){ for (const p of P) segP(o, [p[0], y0, p[1]], [p[0], y1, p[1]], r, 6); }
// rectangle of half-sizes (a along angle ang, b across) centred at (cx, cz)
const rectA = (cx, cz, a, b, ang) => { const c = Math.cos(ang), s = Math.sin(ang); return [[-a, -b], [a, -b], [a, b], [-a, b]].map(([u, v]) => [cx + u*c - v*s, cz + u*s + v*c]); };
// polygon centroid (area-weighted)
const pcen = P => { let A = 0, x = 0, z = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], k = a[0]*b[1] - b[0]*a[1]; A += k; x += (a[0] + b[0])*k; z += (a[1] + b[1])*k; } return [x/(3*A), z/(3*A)]; };
// shift a list of polygons so (cx, cz) becomes the origin
const shAll = (L, c) => L.map(P => shP(P, c[0], c[1]));
// lamp standard: pole + lantern (pole, lamp batches)
function lampP(oP, oL, x, y, z, h, r){ segP(oP, [x, y, z], [x, y + h, z], r || 0.09, 6); latheP(oL, [[0.01, y + h - 0.1], [0.32, y + h], [0.3, y + h + 0.5], [0.01, y + h + 0.6]], x, z, 6); }
