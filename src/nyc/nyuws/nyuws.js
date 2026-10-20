// ===== nyc/nyuws: Central Park West twin towers, the Upper West Side, Museum Mile and Gracie Mansion (City Brush v32, New York 1:1) =====
// The San Remo, The Beresford, The Eldorado, The Majestic (Central Park West), The Ansonia (Broadway), the Soldiers' and Sailors'
// Monument (Riverside Park), Cooper Hewitt (the Carnegie Mansion), The Jewish Museum (the Warburg Mansion), the Museum of the City
// of New York and Gracie Mansion (Carl Schurz Park).
// Every model is built in its own footprint frame: origin = the centre of the real OSM footprint's bounding box in the Manhattan
// street grid (rot measured on the footprint, ~ -0.506): local +x = along the streets to the east-south-east (towards Central
// Park for the Central Park West buildings), local +z = along the avenues to the south-south-west (downtown).
// Footprints: nyc/ref_nyuws.json, ref_nyuws_1.json (San Remo), ref_nyuws_2.json (Eldorado), ref_nyuws_4.json (the Monument).
// No names, inscriptions, logos or text anywhere; no statues of people.
{
const PI = Math.PI, TAU = PI*2, HP = PI/2;
// ---------------- triangle batches: everything of one colour spec becomes one LTris call ----------------
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const quad = (o, a, b, c, d) => o.push(...a, ...b, ...c, ...a, ...c, ...d);
const tri = (o, a, b, c) => o.push(...a, ...b, ...c);
const abox = (o, x0, x1, y0, y1, z0, z1, noBot) => {
  const P = [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]];
  const F = noBot ? [[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]] : [[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]];
  for (const [a, b, c, d] of F) quad(o, P[a], P[b], P[c], P[d]);
};
const rbox = (o, w, h, d, x, y, z, ry) => {
  const c = Math.cos(ry || 0), s = Math.sin(ry || 0), R = (u, v) => [x + u*c + v*s, z - u*s + v*c], hw = w/2, hd = d/2;
  const q = [R(-hw, -hd), R(hw, -hd), R(hw, hd), R(-hw, hd)], P = [...q.map(p => [p[0], y, p[1]]), ...q.map(p => [p[0], y + h, p[1]])];
  for (const [a, b, cc, e] of [[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]) quad(o, P[a], P[b], P[cc], P[e]);
};
const flat = (o, P, y, down) => { const T = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
  for (const t of T){ const a = [P[t[0]][0], y, P[t[0]][1]], b = [P[t[1]][0], y, P[t[1]][1]], c = [P[t[2]][0], y, P[t[2]][1]]; if (down) tri(o, a, c, b); else tri(o, a, b, c); } };
const prism = (o, P, y0, y1, top = true, bot = false) => {
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length]; quad(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); }
  if (top) flat(o, P, y1); if (bot) flat(o, P, y0, true);
};
const cyl = (o, x, z, r, y0, y1, n, top = true, a0 = 0) => {
  const rb = Array.isArray(r) ? r[0] : r, rt = Array.isArray(r) ? r[1] : r;
  for (let i = 0; i < n; i++){ const t0 = a0 + i/n*TAU, t1 = a0 + (i + 1)/n*TAU;
    quad(o, [x + Math.cos(t0)*rb, y0, z + Math.sin(t0)*rb], [x + Math.cos(t1)*rb, y0, z + Math.sin(t1)*rb], [x + Math.cos(t1)*rt, y1, z + Math.sin(t1)*rt], [x + Math.cos(t0)*rt, y1, z + Math.sin(t0)*rt]);
    if (top && rt > 0) tri(o, [x, y1, z], [x + Math.cos(t1)*rt, y1, z + Math.sin(t1)*rt], [x + Math.cos(t0)*rt, y1, z + Math.sin(t0)*rt]); }
};
const lathe = (o, pts, x, z, n, a0 = 0, span = TAU) => {
  for (let k = 0; k < pts.length - 1; k++){ const [r0, y0] = pts[k], [r1, y1] = pts[k + 1];
    for (let i = 0; i < n; i++){ const t0 = a0 + i/n*span, t1 = a0 + (i + 1)/n*span;
      quad(o, [x + Math.cos(t0)*r0, y0, z + Math.sin(t0)*r0], [x + Math.cos(t1)*r0, y0, z + Math.sin(t1)*r0], [x + Math.cos(t1)*r1, y1, z + Math.sin(t1)*r1], [x + Math.cos(t0)*r1, y1, z + Math.sin(t0)*r1]); } }
};
const seg = (o, a, b, r, n = 4) => {
  const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2], L = Math.hypot(dx, dy, dz); if (L < 1e-4) return;
  const d = [dx/L, dy/L, dz/L], up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let ux = d[1]*up[2]-d[2]*up[1], uy = d[2]*up[0]-d[0]*up[2], uz = d[0]*up[1]-d[1]*up[0]; const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
  const vx = d[1]*uz-d[2]*uy, vy = d[2]*ux-d[0]*uz, vz = d[0]*uy-d[1]*ux;
  const ring = p => { const R = []; for (let i = 0; i < n; i++){ const t = (i + 0.5)/n*TAU, c = Math.cos(t)*r, s = Math.sin(t)*r; R.push([p[0]+ux*c+vx*s, p[1]+uy*c+vy*s, p[2]+uz*c+vz*s]); } return R; };
  const A = ring(a), Bq = ring(b); for (let i = 0; i < n; i++){ const j = (i + 1) % n; quad(o, A[i], A[j], Bq[j], Bq[i]); }
};
const area = P => { let s = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length]; s += a[0]*b[1] - b[0]*a[1]; } return s/2; };
// wall mapping through plan segment a->b: (u along the wall, y, out) -> 3-D point; sgn +1 = outward is left of a->b
const wmap = (a, b, sgn) => { const dx = b[0]-a[0], dz = b[1]-a[1], L = Math.hypot(dx, dz) || 1, ux = dx/L, uz = dz/L, nx = uz*sgn, nz = -ux*sgn;
  const f = (u, y, out) => [a[0] + ux*u + nx*(out || 0), y, a[1] + uz*u + nz*(out || 0)]; f.L = L; f.n = [nx, nz]; f.u = [ux, uz]; return f; };
const wrect = (o, W, u0, u1, y0, y1, off) => quad(o, W(u0, y0, off), W(u1, y0, off), W(u1, y1, off), W(u0, y1, off));
const wbox = (o, W, u0, u1, y0, y1, out0, out1) => { const P = [W(u0, y0, out0), W(u1, y0, out0), W(u1, y0, out1), W(u0, y0, out1)].map(p => [p[0], p[2]]); prism(o, P, y0, y1, true); };
const warch = (o, W, u, y0, hw, ht, off, n = 8) => { const P = [[u - hw, y0], [u + hw, y0], [u + hw, y0 + ht - hw]];
  for (let i = 1; i < n; i++){ const t = PI*i/n; P.push([u + Math.cos(t)*hw, y0 + ht - hw + Math.sin(t)*hw]); } P.push([u - hw, y0 + ht - hw]);
  for (let i = 1; i < P.length - 1; i++) tri(o, W(P[0][0], P[0][1], off), W(P[i][0], P[i][1], off), W(P[i + 1][0], P[i + 1][1], off)); };
const ledgeP = (o, P, y0, y1, out) => { const s = area(P) > 0 ? 1 : -1, n = P.length, Q = [];
  for (let i = 0; i < n; i++){ const p = P[(i + n - 1) % n], c = P[i], q = P[(i + 1) % n];
    const d1 = norm2([c[0]-p[0], c[1]-p[1]]), d2 = norm2([q[0]-c[0], q[1]-c[1]]), n1 = [d1[1]*s, -d1[0]*s], n2 = [d2[1]*s, -d2[0]*s];
    let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml; const k = out/Math.max(0.35, mx*n1[0] + mz*n1[1]);
    Q.push([c[0] + mx*k, c[1] + mz*k]); }
  prism(o, Q, y0, y1, true, true); return Q; };
const norm2 = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0]/l, v[1]/l]; };
const rect = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const hipR = (o, x0, x1, z0, z1, y0, h, ix, iz, cap = true) => {
  const B = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], T = [[x0 + ix, y0 + h, z0 + iz], [x1 - ix, y0 + h, z0 + iz], [x1 - ix, y0 + h, z1 - iz], [x0 + ix, y0 + h, z1 - iz]];
  for (let i = 0; i < 4; i++){ const j = (i + 1) % 4; quad(o, B[i], B[j], T[j], T[i]); }
  if (cap && (x1 - x0 - 2*ix) > 0.05 && (z1 - z0 - 2*iz) > 0.05) quad(o, T[0], T[3], T[2], T[1]);
};
const treeB = (oT, oL, x, y, z, s) => { abox(oT, x - 0.2*s, x + 0.2*s, y, y + 2.6*s, z - 0.2*s, z + 0.2*s, true);
  lathe(oL, [[0, y + 1.6*s], [1.9*s, y + 2.6*s], [2.2*s, y + 3.9*s], [1.4*s, y + 5.2*s], [0, y + 5.7*s]], x, z, 6, 0.3); };
const mirZ = P => P.map(p => [p[0], -p[1]]).reverse();
const mirX = P => P.map(p => [-p[0], p[1]]).reverse();
// keep the part of P with x >= k (Sutherland-Hodgman against one vertical line; fine for the rectilinear U / E plans used here)
const clipX = (P, k) => { const o = [];
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], ia = a[0] >= k, ib = b[0] >= k;
    if (ia) o.push(a); if (ia !== ib){ const t = (k - a[0])/(b[0] - a[0]); o.push([k, a[1] + t*(b[1] - a[1])]); } }
  return o.filter((p, i) => { const q = o[(i + o.length - 1) % o.length]; return Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.05; }); };
// a masonry mass on plan P from y0 to y1 with punched windows (floors fh from yw; bays ~bay; window ww x wh), roof cap, cornice
// o: {wall, roof, fh, yw, bay, ww, wh, pl, stripe, sw, cor:[h, out], corC, par, edge(i, W) -> false to skip the windows of an edge}
const WIN = '#2b2c2e', LIT = {c:'#3c3328', glow:'#ffcf8f', gk:0.8};
const mass = (B, rng, P, y0, y1, o) => {
  prism(B.p(o.wall), P, y0, y1, false);
  if (o.roof) flat(B.p(o.roof), P, y1);
  if (o.fh){ const s = area(P) > 0 ? 1 : -1, yw = o.yw !== undefined ? o.yw : y0, nf = Math.floor((y1 - yw + 0.3)/o.fh), Wd = B.p(WIN), Wl = B.p(LIT);
    for (let i = 0; i < P.length; i++){ const W = wmap(P[i], P[(i + 1) % P.length], s); if (W.L < (o.minL || 2.4)) continue; if (o.edge && o.edge(i, W) === false) continue;
      const n = Math.max(1, Math.round(W.L/o.bay)), st = W.L/n, ww = Math.min(o.ww, st - 0.5); if (ww < 0.5) continue;
      if (o.stripe) for (let k = 0; k < n; k++){ const u = (k + 0.5)*st; wrect(B.p(o.stripe), W, u - (o.sw || ww/2 + 0.25), u + (o.sw || ww/2 + 0.25), yw + 0.2, yw + nf*o.fh - 0.2, 0.03); }
      for (let f = 0; f < nf; f++){ const y = yw + f*o.fh + (o.fh - o.wh)*0.5;
        for (let k = 0; k < n; k++){ const u = (k + 0.5)*st; wrect(rng() < (o.pl !== undefined ? o.pl : 0.3) ? Wl : Wd, W, u - ww/2, u + ww/2, y, y + o.wh, 0.06);
          if (o.sill) wrect(B.p(o.sill), W, u - ww/2 - 0.12, u + ww/2 + 0.12, y - 0.16, y, 0.09); } } } }
  if (o.cor) ledgeP(B.p(o.corC || o.wall), P, y1 - o.cor[0], y1, o.cor[1]);
  if (o.par) prism(B.p(o.corC || o.wall), P, y1, y1 + o.par, false);
};
// horizontal bands round a polygon at heights ys (height hb), offset out
const bandsP = (o, P, ys, hb, off) => { const s = area(P) > 0 ? 1 : -1;
  for (const y of ys) for (let i = 0; i < P.length; i++){ const W = wmap(P[i], P[(i + 1) % P.length], s); if (W.L < 0.2) continue; wrect(o, W, -off, W.L + off, y, y + hb, off); } };
// vertical strips at the corners of a polygon (quoins / piers): width w on each side of every corner
const cornersP = (o, P, y0, y1, w, off) => { const s = area(P) > 0 ? 1 : -1;
  for (let i = 0; i < P.length; i++){ const W = wmap(P[i], P[(i + 1) % P.length], s); if (W.L < 2*w + 0.5) continue; wrect(o, W, -off, w, y0, y1, off); wrect(o, W, W.L - w, W.L + off, y0, y1, off); } };
// window on the face of a cylinder (centre cx, cz, radius r) at angle t: half width hw, y0..y1
const cwin = (o, cx, cz, r, t, hw, y0, y1) => { const c = Math.cos(t), s = Math.sin(t), px = cx + c*r, pz = cz + s*r;
  quad(o, [px + s*hw, y0, pz - c*hw], [px - s*hw, y0, pz + c*hw], [px - s*hw, y1, pz + c*hw], [px + s*hw, y1, pz - c*hw]); };
const urn = (o, x, y, z, s) => lathe(o, [[0, y], [0.45*s, y], [0.3*s, y + 0.25*s], [0.6*s, y + 0.75*s], [0.4*s, y + 1.25*s], [0.15*s, y + 1.45*s], [0.12*s, y + 1.9*s], [0, y + 2.1*s]], x, z, 8);
const place = (type, lat, lon, rot) => SG_PLACES.push({type, lat, lon, rot});
const AVI = {c:'#b02018', glow:'#ff2a1a', gk:2.2};

// ===== The San Remo (1930, Emery Roth), 145-146 Central Park West between 74th and 75th Streets. 27 storeys, 122 m: a 17-storey
// U-shaped base of beige brick round the T-shaped court to the west (three storeys of rusticated limestone, setbacks with slate
// terraces at the 14th, 16th and 17th storeys), and two 10-storey towers on Central Park West, each crowned by a Corinthian temple
// after the Choragic Monument of Lysicrates: a square two-storey stage with arched openings, eight pedestals with tall urns, a
// circular colonnade round the drum, a dentilled entablature with a balustraded terrace, a round podium and the 22 ft copper
// lantern with windows on four sides and its finial. The two temples are floodlit at night. Canopies on the two CPW entrances.
// Footprint: ref_nyuws_1.json building 50 (2210 m2). Central Park West = +x face.
LANDMARKS.nysanremo = {zh:'圣雷莫公寓', en:'The San Remo', cat:'old', r:42, h:121,
  lt:{m:0, c:'#ffd9a8', k:0.3, e:0.35}, build(){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
  const BR = {c:'#cdbb9a', m:0, lk:0.14}, ST = {c:'#d8cfbe', m:0, lk:0.5}, SL = '#5a6067', CR = {c:'#e7ddc9', glow:'#ffdcaa', gk:0.36}, CRd = {c:'#d9cdb6', glow:'#ffd49a', gk:0.3},
    CU = {c:'#6f9c88', glow:'#bff0d8', gk:0.14}, LAN = {c:'#4c4536', glow:'#ffd38a', gk:1.1}, DK = '#3a3a3c';
  const P = [[-22.6, 30.8], [-22.6, 13.0], [-18.9, 13.0], [-18.9, 4.8], [-2.7, 4.7], [-2.7, 14.0], [5.9, 13.9], [5.9, -13.8], [-3.4, -13.7], [-3.4, -4.8], [-16.2, -4.8], [-16.1, -13.1], [-19.4, -13.1], [-19.4, -30.8], [22.6, -30.8], [22.6, 30.8]];
  const fl = f => f <= 1 ? 0 : 4.8 + (f - 2)*3.3;   // bottom of storey f
  const W0 = {fh:3.3, bay:2.7, ww:1.25, wh:1.85, pl:0.3, sill:'#e6dccb'};
  // ground floor + rusticated limestone storeys 2-3
  mass(B, rng, P, -5, fl(4), Object.assign({}, W0, {wall:ST, yw:fl(2), cor:[0.6, 0.35]}));
  { const s = area(P) > 0 ? 1 : -1; for (let i = 0; i < P.length; i++){ const W = wmap(P[i], P[(i + 1) % P.length], s); if (W.L < 4) continue;
      const n = Math.round(W.L/3.4), st = W.L/n; for (let k = 0; k < n; k++){ const u = (k + 0.5)*st; warch(rng() < 0.5 ? B.p(LIT) : B.p(WIN), W, u, 0.6, 0.85, 3.4, 0.06, 6); }
      for (const y of [1.2, 2.4, 3.6, 6.0, 7.6, 9.2]) wrect(B.p(CRd), W, 0, W.L, y, y + 0.12, 0.04); } }
  // brick body to the 13th storey; setbacks (slate terraces) at the 14th, 16th and 17th
  mass(B, rng, P, fl(4), fl(14), Object.assign({}, W0, {wall:BR, roof:SL, yw:fl(4), cor:[0.8, 0.5], corC:CRd}));
  bandsP(B.p(CRd), P, [fl(5) - 0.2, fl(12) - 0.3], 0.4, 0.12);
  const P2 = clipX(P, -12), P3 = clipX(P, -3.4);
  mass(B, rng, P2, fl(14), fl(16), Object.assign({}, W0, {wall:BR, roof:SL, cor:[0.5, 0.3], corC:CRd, par:1.0}));
  mass(B, rng, P3, fl(16), fl(17), Object.assign({}, W0, {wall:BR, roof:SL, par:1.0, corC:CRd}));
  mass(B, rng, rect(6.5, 20.4, -12, 12), fl(17), fl(18), Object.assign({}, W0, {wall:BR, roof:SL, par:1.0, corC:CRd}));
  // the two towers (storeys 17-27), L-shaped round the court
  const TS = [[5.5, 11.6], [22.0, 11.6], [22.0, 30.2], [0.6, 30.2], [0.6, 15.6], [5.5, 15.6]];
  for (const T of [TS, mirZ(TS)]){
    mass(B, rng, T, fl(17), fl(28), Object.assign({}, W0, {wall:BR, roof:SL, yw:fl(17), cor:[0.9, 0.55], corC:CRd}));
    cornersP(B.p(CRd), T, fl(17), fl(28) - 0.9, 0.9, 0.08);
    bandsP(B.p(CRd), T, [fl(24) - 0.25], 0.5, 0.15);
    // terracotta balconies on the 24th storey of the park face
    const W = wmap([22.0, T[1][1]], [22.0, T[2][1]], area(T) > 0 ? 1 : -1); for (const u of [4.5, 9.3, 14.1]) wbox(B.p(CRd), W, u - 1.6, u + 1.6, fl(24) - 0.3, fl(24) + 0.9, 0, 0.9);
  }
  // the temples
  const temple = (cx, cz, y) => {
    const Cr = B.p(CR), Cd = B.p(CRd), Cu = B.p(CU), S = 7.4, Q = rect(cx - S, cx + S, cz - S, cz + S), s = area(Q) > 0 ? 1 : -1;
    prism(Cr, Q, y, y + 5.4, false); flat(B.p(SL), Q, y + 5.4);
    for (let i = 0; i < 4; i++){ const W = wmap(Q[i], Q[(i + 1) % 4], s); for (const u of [3.6, 7.4, 11.2]) warch(B.p(LAN), W, u, y + 0.7, 1.05, 3.9, 0.06, 8);
      wrect(Cd, W, -0.1, 1.0, y, y + 5.4, 0.1); wrect(Cd, W, W.L - 1.0, W.L + 0.1, y, y + 5.4, 0.1); }
    ledgeP(Cd, Q, y + 5.0, y + 5.8, 0.55);
    const y1 = y + 5.8;
    for (const a of [-1, 1]) for (const b of [-4.6, 4.6]) for (const [px, pz] of [[cx + a*6.6, cz + b], [cx + b, cz + a*6.6]]){ abox(Cr, px - 0.7, px + 0.7, y1, y1 + 2.0, pz - 0.7, pz + 0.7, true); urn(Cr, px, y1 + 2.0, pz, 1.25); }
    cyl(Cr, cx, cz, 6.4, y1, y1 + 1.0, 24);
    cyl(Cd, cx, cz, 4.7, y1 + 1.0, y1 + 6.9, 16, false);
    for (let k = 0; k < 8; k++) cwin(B.p(LAN), cx, cz, 4.75, (k + 0.5)/8*TAU, 0.7, y1 + 2.2, y1 + 5.2);
    for (let k = 0; k < 12; k++){ const t = k/12*TAU, x = cx + Math.cos(t)*5.75, z = cz + Math.sin(t)*5.75;
      cyl(Cr, x, z, 0.4, y1 + 1.4, y1 + 5.6, 6, false); abox(Cr, x - 0.5, x + 0.5, y1 + 1.0, y1 + 1.4, z - 0.5, z + 0.5, true); abox(Cr, x - 0.55, x + 0.55, y1 + 5.6, y1 + 6.1, z - 0.55, z + 0.55, true); }
    cyl(Cr, cx, cz, 6.45, y1 + 6.1, y1 + 7.6, 24); cyl(Cd, cx, cz, 6.6, y1 + 7.2, y1 + 7.6, 24);
    cyl(Cd, cx, cz, 6.3, y1 + 7.6, y1 + 8.6, 24, false);
    cyl(Cr, cx, cz, 3.9, y1 + 7.6, y1 + 10.4, 16); cyl(Cd, cx, cz, 4.2, y1 + 10.0, y1 + 10.5, 16);
    cyl(Cu, cx, cz, 2.7, y1 + 10.5, y1 + 16.9, 12, false);
    for (let k = 0; k < 4; k++) cwin(B.p(LAN), cx, cz, 2.75, k*HP + PI/4, 0.75, y1 + 11.6, y1 + 15.6);
    lathe(Cu, [[3.0, y1 + 16.9], [2.9, y1 + 17.5], [2.2, y1 + 18.7], [1.1, y1 + 19.5], [0.3, y1 + 19.9], [0, y1 + 20.0]], cx, cz, 12);
    seg(Cu, [cx, y1 + 19.9, cz], [cx, y1 + 23.2, cz], 0.14, 4); lathe(Cu, [[0, y1 + 21.2], [0.45, y1 + 21.6], [0, y1 + 22.0]], cx, cz, 6);
  };
  temple(11.3, 20.9, fl(28)); temple(11.3, -20.9, fl(28));
  // entrance canopies on Central Park West
  for (const z of [-8.5, 8.5]){ abox(B.p(DK), 22.6, 26.4, 3.3, 3.6, z - 1.7, z + 1.7); for (const dz of [-1.5, 1.5]) seg(B.p(DK), [26.2, 0, z + dz], [26.2, 3.3, z + dz], 0.06, 4); }
  B.flush(g); return g; }};
place('nysanremo', 40.7780144, -73.9751520, -0.5059);

// ===== The Eldorado (1931, Margon & Holder with Emery Roth), 300 Central Park West between 90th and 91st Streets. 29 storeys, 119 m:
// a 17-storey base round the court to the west and two 12-storey Art Deco towers on the park front, six bays wide. Three storeys of
// yellow cast stone with the three angled bronze arches of the entrance; above, tan brick with the bays of brown-brick spandrels
// running up as dark vertical stripes, setbacks above the 14th (the centre, with an Art Deco balustrade), 16th and 17th storeys;
// the tower corners step back above the 27th and the towers above the 28th, then the stepped, ribbed "Flash Gordon" finials of
// painted metal. Footprint: ref_nyuws_2.json building 60 (2792 m2). Central Park West = +x face.
LANDMARKS.nyeldorado = {zh:'埃尔多拉多公寓', en:'The Eldorado', cat:'old', r:44, h:119,
  lt:{m:0, c:'#ffd9a8', k:0.3, e:0.35}, build(){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
  const BR = {c:'#cdb38c', m:0, lk:0.14}, BN = '#8e6d50', ST = {c:'#d7c08f', m:0, lk:0.5}, SL = '#5a6067', TC = {c:'#dcc596', m:0, lk:0.4},
    FIN = {c:'#b39a62', glow:'#ffd690', gk:0.42}, FIN2 = {c:'#8f7a4c', glow:'#ffc870', gk:0.3}, BRZ = {c:'#6b5636', glow:'#ffc070', gk:0.4};
  const P = [[-28.8, 30.7], [-28.8, 12.6], [-26.3, 12.6], [-26.2, 5.5], [-9.2, 5.5], [-9.2, 14.0], [12.0, 14.0], [12.1, 6.7], [5.0, 6.7], [5.0, -6.2], [12.0, -6.2], [12.0, -13.8], [-9.3, -13.7], [-9.3, -0.5], [-24.1, -0.5], [-24.0, -12.4], [-26.5, -12.4], [-26.6, -19.7], [-27.1, -19.7], [-27.1, -29.1], [-19.8, -29.1], [-19.7, -30.6], [28.8, -30.7], [28.8, 30.7]];
  const fl = f => f <= 1 ? 0 : 4.5 + (f - 2)*3.2;
  const W0 = {fh:3.2, bay:2.6, ww:1.2, wh:1.8, pl:0.3, sill:'#dcc89e'};
  mass(B, rng, P, -5, fl(4), Object.assign({}, W0, {wall:ST, yw:fl(2), cor:[0.7, 0.35]}));
  { const s = area(P) > 0 ? 1 : -1; for (let i = 0; i < P.length; i++){ const W = wmap(P[i], P[(i + 1) % P.length], s); if (W.L < 4) continue;
      const n = Math.round(W.L/3.2), st = W.L/n; for (let k = 0; k < n; k++){ const u = (k + 0.5)*st; wrect(rng() < 0.5 ? B.p(LIT) : B.p(WIN), W, u - 0.9, u + 0.9, 0.7, 3.8, 0.06); } } }
  // the entrance: three angled bronze arches in the middle of the park front
  { const W = wmap([28.8, -30.7], [28.8, 30.7], area(P) > 0 ? 1 : -1); for (const u of [27.0, 30.7, 34.4]){ wbox(B.p(ST), W, u - 1.9, u + 1.9, 0, 7.6, 0, 0.5);
      const Q = [[u - 1.5, 0], [u + 1.5, 0], [u + 1.5, 5.2], [u, 6.9], [u - 1.5, 5.2]]; for (let i = 1; i < 4; i++) tri(B.p(BRZ), W(Q[0][0], Q[0][1], 0.56), W(Q[i][0], Q[i][1], 0.56), W(Q[i + 1][0], Q[i + 1][1], 0.56)); } }
  // brick body with the brown spandrel stripes, frieze above the 3rd storey
  mass(B, rng, P, fl(4), fl(15), Object.assign({}, W0, {wall:BR, roof:SL, yw:fl(4), stripe:BN, sw:0.85, cor:[0.6, 0.35], corC:TC}));
  bandsP(B.p(TC), P, [fl(4) + 0.05], 0.7, 0.1);
  const P2 = [[-14, 30.7], [-14, 12.6], [5, 12.6], [5, -12.6], [-14, -12.6], [-14, -30.6], [28.8, -30.6], [28.8, -12.6], [26.0, -12.6], [26.0, 12.6], [28.8, 12.6], [28.8, 30.7]];
  mass(B, rng, P2, fl(15), fl(17), Object.assign({}, W0, {wall:BR, roof:SL, stripe:BN, sw:0.85, par:1.1, corC:TC}));
  const P3 = [[0, 30.4], [0, 9.6], [6.5, 9.6], [6.5, -9.6], [0, -9.6], [0, -30.4], [28.3, -30.4], [28.3, -9.6], [23.5, -9.6], [23.5, 9.6], [28.3, 9.6], [28.3, 30.4]];
  mass(B, rng, P3, fl(17), fl(18), Object.assign({}, W0, {wall:BR, roof:SL, par:1.1, corC:TC}));
  // the towers: six bays on the park; corners chamfered back above the 27th, the top storeys set back above the 28th
  const tower = sz => {
    const T = sz > 0 ? rect(6.2, 28.4, 9.8, 30.3) : rect(6.2, 28.4, -30.3, -9.8), cz = sz*20.05, cx = 17.3;
    mass(B, rng, T, fl(18), fl(28), Object.assign({}, W0, {wall:BR, roof:SL, yw:fl(18), bay:2.75, stripe:BN, sw:0.85, edge:(i, W) => true}));
    cornersP(B.p(TC), T, fl(18), fl(28), 0.8, 0.1);
    const T2 = [[cx - 9.6, cz - 8.8], [cx + 9.6, cz - 8.8], [cx + 10.6, cz - 7.8], [cx + 10.6, cz + 7.8], [cx + 9.6, cz + 8.8], [cx - 9.6, cz + 8.8], [cx - 10.6, cz + 7.8], [cx - 10.6, cz - 7.8]];
    mass(B, rng, T2, fl(28), fl(29), Object.assign({}, W0, {wall:BR, roof:SL, yw:fl(28), stripe:BN, sw:0.85, par:1.2, corC:TC}));
    const T3 = rect(cx - 7.4, cx + 7.4, cz - 6.6, cz + 6.6);
    mass(B, rng, T3, fl(29), fl(31), Object.assign({}, W0, {wall:BR, roof:SL, yw:fl(29), bay:2.4, stripe:BN, sw:0.8, cor:[0.5, 0.25], corC:TC}));
    // the finial: stepped, ribbed tiers of painted metal and the spike
    const y0 = fl(31), F = B.p(FIN), F2 = B.p(FIN2);
    const tiers = [[5.6, 3.2], [4.4, 3.0], [3.2, 3.0], [2.1, 2.8], [1.2, 2.6]]; let y = y0;
    for (const [hw, h] of tiers){ abox(F2, cx - hw, cx + hw, y, y + h, cz - hw, cz + hw, true);
      for (const a of [-1, 1]) for (let k = -2; k <= 2; k++){ const t = k/2.5*hw; abox(F, cx + t - 0.18, cx + t + 0.18, y, y + h + 0.6, cz + a*hw - 0.25, cz + a*hw + 0.25, true); abox(F, cx + a*hw - 0.25, cx + a*hw + 0.25, y, y + h + 0.6, cz + t - 0.18, cz + t + 0.18, true); }
      for (const a of [-1, 1]) for (const b of [-1, 1]) abox(F, cx + a*hw - 0.45, cx + a*hw + 0.45, y, y + h + 1.2, cz + b*hw - 0.45, cz + b*hw + 0.45, true);
      y += h; }
    lathe(F, [[0.9, y], [0.6, y + 2.5], [0.35, y + 5.0], [0, y + 7.6]], cx, cz, 8);
  };
  tower(1); tower(-1);
  // the Art Deco balustrade on the 14th-storey setback in the middle of the park front
  for (let k = 0; k < 14; k++){ const z = -11.5 + k*23/13; abox(B.p(TC), 28.6, 29.0, fl(15), fl(15) + 1.3, z - 0.35, z + 0.35, true); }
  abox(B.p(TC), 28.5, 29.1, fl(15) + 1.3, fl(15) + 1.6, -12, 12);
  B.flush(g); return g; }};
place('nyeldorado', 40.7883557, -73.9676918, -0.5069);

// ===== The Majestic (1931, Irwin S. Chanin / Jacques Delamarre), 115 Central Park West between 71st and 72nd Streets. 30 storeys,
// 105 m, Art Deco: a 19-storey base round the garden court to the west (light-grey cast stone below, rose-and-black granite water
// table, tan and brown brick above), setbacks from the 14th storey with cantilevered terraces and metal railings, and two towers
// on the park front whose corners are wrapped by bands of corner windows (cantilevered slabs, striated brick between the bands);
// strong horizontal lines of the terraces against vertical brick piers; on top, square-headed abstract crowns to the east and the
// rounded "dynamo" water-tank enclosures to the west. Footprint: ref_nyuws.json (nymajestic) building 29 (2901 m2). CPW = +x.
LANDMARKS.nymajestic = {zh:'马杰斯蒂克公寓', en:'The Majestic', cat:'old', r:48, h:106,
  lt:{m:0, c:'#ffd9a8', k:0.3, e:0.35}, build(){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
  const BR = {c:'#ccb289', m:0, lk:0.14}, BN = '#8b6a4b', ST = {c:'#c9c6bd', m:0, lk:0.5}, GR = '#5a3f3c', SL = '#5a6067', TC = {c:'#d9c7a1', m:0, lk:0.4},
    CRN = {c:'#d6c39c', glow:'#ffd9a0', gk:0.3}, RL = '#77797a';
  const P = [[-21.2, 31.2], [-21.3, 13.4], [-15.5, 13.3], [-15.5, 6.0], [-0.8, 6.0], [-0.8, 14.8], [14.6, 14.9], [14.6, -13.9], [4.9, -14.0], [4.9, -5.6], [-7.1, -5.6], [-7.2, -13.2], [-16.3, -13.2], [-16.3, -3.7], [-29.1, -3.8], [-29.1, -12.6], [-29.9, -12.7], [-30.0, -18.7], [-32.7, -18.7], [-32.8, -31.2], [32.8, -31.2], [32.7, 31.2]];
  const fl = f => f <= 1 ? 0 : 4.8 + (f - 2)*3.25;
  const W0 = {fh:3.25, bay:2.7, ww:1.3, wh:1.8, pl:0.3, sill:'#ddd2bb'};
  prism(B.p(GR), P, -5, 0.9, false);
  mass(B, rng, P, 0.9, fl(4), Object.assign({}, W0, {wall:ST, yw:fl(2), cor:[0.6, 0.3]}));
  { const s = area(P) > 0 ? 1 : -1; for (let i = 0; i < P.length; i++){ const W = wmap(P[i], P[(i + 1) % P.length], s); if (W.L < 4) continue;
      const n = Math.round(W.L/3.3), st = W.L/n; for (let k = 0; k < n; k++){ const u = (k + 0.5)*st; wrect(rng() < 0.5 ? B.p(LIT) : B.p(WIN), W, u - 1.0, u + 1.0, 1.2, 4.0, 0.06); } } }
  mass(B, rng, P, fl(4), fl(14), Object.assign({}, W0, {wall:BR, roof:SL, yw:fl(4), cor:[0.5, 0.3], corC:TC}));
  bandsP(B.p(BN), P, [fl(6) - 0.5, fl(8) - 0.5, fl(10) - 0.5, fl(12) - 0.5], 0.45, 0.04);
  const P2 = [[-18, 31.2], [-18, 13.4], [8, 13.4], [8, -13.4], [-18, -13.4], [-18, -31.2], [32.7, -31.2], [32.7, -12.0], [29.7, -12.0], [29.7, 12.0], [32.7, 12.0], [32.7, 31.2]];
  mass(B, rng, P2, fl(14), fl(18), Object.assign({}, W0, {wall:BR, roof:SL, cor:[0.35, 0.9], corC:TC}));
  bandsP(B.p(RL), P2, [fl(14) + 0.35], 0.75, 0.95); bandsP(B.p(TC), P2, [fl(16) - 0.3], 0.3, 0.6);
  const P3 = [[2, 31.0], [2, 10.4], [9, 10.4], [9, -10.0], [2, -10.0], [2, -31.0], [32.3, -31.0], [32.3, -10.0], [26.5, -10.0], [26.5, 10.4], [32.3, 10.4], [32.3, 31.0]];
  mass(B, rng, P3, fl(18), fl(20), Object.assign({}, W0, {wall:BR, roof:SL, cor:[0.3, 0.8], corC:TC}));
  bandsP(B.p(RL), P3, [fl(18) + 0.35], 0.75, 0.85);
  // the towers with the wrapped corner windows
  const tower = (z0, z1) => {
    const x0 = 6.0, x1 = 32.3, T = rect(x0, x1, z0, z1), s = area(T) > 0 ? 1 : -1, y0 = fl(20), y1 = fl(31), cx = (x0 + x1)/2, cz = (z0 + z1)/2;
    prism(B.p(BR), T, y0, y1, false); flat(B.p(SL), T, y1);
    for (let i = 0; i < 4; i++){ const W = wmap(T[i], T[(i + 1) % 4], s), L = W.L, cw = 3.4, n = Math.round((L - 2*cw - 2)/2.6), st = (L - 2*cw - 2)/n;
      for (let f = 0; f < 11; f++){ const y = y0 + f*3.25 + 0.65;
        wrect(B.p(BN), W, -0.02, cw, y - 0.55, y + 2.35, 0.03); wrect(B.p(BN), W, L - cw, L + 0.02, y - 0.55, y + 2.35, 0.03);
        wrect(rng() < 0.32 ? B.p(LIT) : B.p(WIN), W, -0.06, cw - 0.3, y, y + 1.8, 0.07); wrect(rng() < 0.32 ? B.p(LIT) : B.p(WIN), W, L - cw + 0.3, L + 0.06, y, y + 1.8, 0.07);
        for (let k = 0; k < n; k++){ const u = cw + 1 + (k + 0.5)*st; wrect(rng() < 0.3 ? B.p(LIT) : B.p(WIN), W, u - 0.65, u + 0.65, y, y + 1.8, 0.06); } }
      for (let k = 0; k <= n; k++){ const u = cw + 1 + k*st; wrect(B.p(TC), W, u - 0.22, u + 0.22, y0, y1 - 0.5, 0.12); }
      for (let f = 1; f <= 11; f++) wrect(B.p(TC), W, -0.1, cw + 0.3, y0 + f*3.25 - 0.3, y0 + f*3.25, 0.25), wrect(B.p(TC), W, L - cw - 0.3, L + 0.1, y0 + f*3.25 - 0.3, y0 + f*3.25, 0.25); }
    ledgeP(B.p(TC), T, y1 - 0.6, y1, 0.35);
    // the crown: square-headed abstract piers on the east, the rounded "dynamo" to the west
    const C = B.p(CRN), y2 = y1;
    abox(C, cx - 2, x1 - 1.5, y2, y2 + 4.2, z0 + 1.5, z1 - 1.5, true);
    for (const z of [z0 + 2.2, cz - 3.5, cz, cz + 3.5, z1 - 2.2]) abox(C, x1 - 2.6, x1 - 1.0, y2, y2 + 6.2, z - 0.6, z + 0.6, true);
    for (const z of [z0 + 2.2, z1 - 2.2]) abox(C, x1 - 9, x1 - 1.0, y2 + 4.2, y2 + 5.0, z - 0.6, z + 0.6, true);
    const R = (z1 - z0)/2 - 2.6;
    for (let k = 0; k < 14; k++){ const t0 = k/14*PI, t1 = (k + 1)/14*PI;
      quad(C, [x0 + 2, y2 + Math.sin(t0)*R*0.8, cz + Math.cos(t0)*R], [cx - 2, y2 + Math.sin(t0)*R*0.8, cz + Math.cos(t0)*R], [cx - 2, y2 + Math.sin(t1)*R*0.8, cz + Math.cos(t1)*R], [x0 + 2, y2 + Math.sin(t1)*R*0.8, cz + Math.cos(t1)*R]); }
    for (const x of [x0 + 2, cx - 2]){ const o = []; for (let k = 0; k < 14; k++){ const t0 = k/14*PI, t1 = (k + 1)/14*PI; tri(C, [x, y2, cz], [x, y2 + Math.sin(t0)*R*0.8, cz + Math.cos(t0)*R], [x, y2 + Math.sin(t1)*R*0.8, cz + Math.cos(t1)*R]); } }
    for (let k = 1; k < 6; k++){ const x = x0 + 2 + k*(cx - x0 - 4)/6; for (let j = 0; j < 14; j++){ const t0 = j/14*PI, t1 = (j + 1)/14*PI;
      quad(C, [x - 0.2, y2 + Math.sin(t0)*(R + 0.3)*0.8, cz + Math.cos(t0)*(R + 0.3)], [x + 0.2, y2 + Math.sin(t0)*(R + 0.3)*0.8, cz + Math.cos(t0)*(R + 0.3)], [x + 0.2, y2 + Math.sin(t1)*(R + 0.3)*0.8, cz + Math.cos(t1)*(R + 0.3)], [x - 0.2, y2 + Math.sin(t1)*(R + 0.3)*0.8, cz + Math.cos(t1)*(R + 0.3)]); } }
  };
  tower(10.4, 31.0); tower(-31.0, -9.4);
  // entrance canopies on the three streets
  for (const [x0, x1, z0, z1] of [[32.7, 35.6, -1.6, 1.6], [-4, 4, 31.2, 33.8], [-4, 4, -33.8, -31.2]]) abox(B.p(RL), x0, x1, 3.4, 3.7, z0, z1);
  B.flush(g); return g; }};
place('nymajestic', 40.7760579, -73.9767075, -0.5115);

// ===== The Beresford (1929, Emery Roth), 211 Central Park West at 81st Street, across 81st Street from the American Museum of Natural
// History. 22 storeys round the court to the west: three storeys of rusticated limestone, beige brick with brick quoins at the
// corners and terracotta trim, band courses above the 9th, 12th and 13th storeys, setbacks with balustraded terraces at the 14th,
// 16th, 18th and 20th storeys (from the 9th at the north-west corner), chimneys; and the three octagonal corner towers above the
// 20th storey (north-east, south-east and south-west): wide faces on the grid with balustrades and big arched windows, narrow
// diagonal faces with finials, pyramidal roofs and copper-and-glass lanterns. Footprint: ref_nyuws.json (nyberesford) building 0.
// Central Park West = +x face, 81st Street = +z face.
LANDMARKS.nyberesford = {zh:'贝瑞斯福德公寓', en:'The Beresford', cat:'old', r:44, h:95,
  lt:{m:0, c:'#ffd9a8', k:0.3, e:0.35}, build(){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
  const BR = {c:'#d0bc9a', m:0, lk:0.14}, ST = {c:'#dcd2bf', m:0, lk:0.5}, SL = '#5a6067', TC = {c:'#e3d7c0', m:0, lk:0.45},
    CR = {c:'#e4d8c2', glow:'#ffdcaa', gk:0.3}, CU = {c:'#5f8a78', glow:'#bff0d8', gk:0.12}, LAN = {c:'#4c4536', glow:'#ffd38a', gk:1.0};
  const P = [[-29.0, 31.1], [-29.0, 15.9], [-24.3, 16.0], [-24.2, 4.0], [-8.1, 4.0], [-8.1, 15.9], [13.6, 15.9], [13.6, 8.3], [6.0, 8.2], [5.9, 2.0], [3.8, 2.0], [3.8, 0.1], [6.0, 0.1], [6.0, -8.1], [13.4, -8.1], [13.4, -16.1], [-8.1, -16.1], [-8.1, -4.1], [-22.6, -4.1], [-22.5, -16.0], [-27.3, -16.0], [-27.3, -31.0], [29.0, -31.1], [28.9, 30.8]];
  const fl = f => f <= 1 ? 0 : 4.6 + (f - 2)*3.2;
  const W0 = {fh:3.2, bay:2.7, ww:1.25, wh:1.8, pl:0.3, sill:'#e6dcc8'};
  mass(B, rng, P, -5, fl(4), Object.assign({}, W0, {wall:ST, yw:fl(2), cor:[0.6, 0.35], corC:TC}));
  { const s = area(P) > 0 ? 1 : -1; for (let i = 0; i < P.length; i++){ const W = wmap(P[i], P[(i + 1) % P.length], s); if (W.L < 4) continue;
      const n = Math.round(W.L/3.4), st = W.L/n; for (let k = 0; k < n; k++){ const u = (k + 0.5)*st; warch(rng() < 0.5 ? B.p(LIT) : B.p(WIN), W, u, 0.6, 0.85, 3.3, 0.06, 6); }
      for (const y of [1.3, 2.6, 5.8, 9.0]) wrect(B.p(TC), W, 0, W.L, y, y + 0.12, 0.04); } }
  // the north-west part stops at the 9th storey
  const PNW = [[-27.3, -16.0], [-8.1, -16.0], [-8.1, -31.0], [-27.3, -31.0]];
  const P1 = [[-29.0, 31.1], [-29.0, 15.9], [-24.3, 16.0], [-24.2, 4.0], [-8.1, 4.0], [-8.1, 15.9], [13.6, 15.9], [13.6, 8.3], [6.0, 8.2], [5.9, 2.0], [3.8, 2.0], [3.8, 0.1], [6.0, 0.1], [6.0, -8.1], [13.4, -8.1], [13.4, -16.1], [-8.1, -16.1], [-8.1, -31.0], [29.0, -31.1], [28.9, 30.8]];
  mass(B, rng, P, fl(4), fl(10), Object.assign({}, W0, {wall:BR, roof:SL, yw:fl(4), cor:[0.6, 0.4], corC:TC}));
  prism(B.p(TC), PNW, fl(10), fl(10) + 1.1, false);
  mass(B, rng, P1, fl(10), fl(14), Object.assign({}, W0, {wall:BR, roof:SL, cor:[0.6, 0.45], corC:TC}));
  cornersP(B.p(TC), P1, fl(4), fl(14) - 0.6, 1.0, 0.07); bandsP(B.p(TC), P1, [fl(10) - 0.35, fl(13) - 0.35, fl(14) - 0.35], 0.35, 0.12);
  // setbacks: 14th, 16th, 18th, 20th
  const P2 = [[-29.0, 31.1], [-29.0, 15.9], [-8.1, 15.9], [13.6, 15.9], [13.6, -16.1], [-1, -16.1], [-1, -31.0], [29.0, -31.1], [28.9, 30.8]];
  mass(B, rng, P2, fl(14), fl(16), Object.assign({}, W0, {wall:BR, roof:SL, cor:[0.4, 0.3], corC:TC, par:1.1}));
  const P3 = [[-27.5, 30.6], [-27.5, 17.0], [12.5, 17.0], [12.5, -15.0], [7, -15.0], [7, -30.6], [28.5, -30.6], [28.5, 30.6]];
  mass(B, rng, P3, fl(16), fl(18), Object.assign({}, W0, {wall:BR, roof:SL, cor:[0.4, 0.3], corC:TC, par:1.1}));
  const P4 = [[-26.5, 30.3], [-26.5, 19.0], [15, 19.0], [15, -19.0], [13.0, -19.0], [13.0, -30.3], [28.3, -30.3], [28.3, 30.3]];
  mass(B, rng, P4, fl(18), fl(20), Object.assign({}, W0, {wall:BR, roof:SL, cor:[0.4, 0.3], corC:TC, par:1.1}));
  cornersP(B.p(TC), P2, fl(14), fl(16), 1.0, 0.07); cornersP(B.p(TC), P3, fl(16), fl(18), 1.0, 0.07); cornersP(B.p(TC), P4, fl(18), fl(20), 1.0, 0.07);
  // chimneys above the 17th storey at the centres of the fronts
  for (const [x, z] of [[0, 28.2], [0, -28.4], [26.0, 0], [-24.0, 28.2]]){ abox(B.p(BR), x - 1.2, x + 1.2, fl(18), fl(21) + 1.2, z - 1.0, z + 1.0, true); abox(B.p(TC), x - 1.45, x + 1.45, fl(21) + 1.2, fl(21) + 1.8, z - 1.25, z + 1.25); }
  // the three octagonal towers
  const tower = (cx, cz) => {
    const R = 8.6, c = 3.0, O = [[cx - R + c, cz - R], [cx + R - c, cz - R], [cx + R, cz - R + c], [cx + R, cz + R - c], [cx + R - c, cz + R], [cx - R + c, cz + R], [cx - R, cz + R - c], [cx - R, cz - R + c]];
    const y0 = fl(20), y1 = fl(23), s = area(O) > 0 ? 1 : -1;
    // the 20th-22nd storeys square, then the octagonal belvedere storeys
    mass(B, rng, rect(cx - R - 1.5, cx + R + 1.5, cz - R - 1.5, cz + R + 1.5), y0, fl(22), Object.assign({}, W0, {wall:BR, roof:SL, par:1.2, corC:TC}));
    cornersP(B.p(TC), rect(cx - R - 1.5, cx + R + 1.5, cz - R - 1.5, cz + R + 1.5), y0, fl(22), 1.0, 0.07);
    const yb = fl(22), yt = yb + 10.5;
    prism(B.p(BR), O, yb, yt, false);
    for (let i = 0; i < 8; i++){ const W = wmap(O[i], O[(i + 1) % 8], s);
      if (i % 2 === 0){ warch(rng() < 0.6 ? B.p(LIT) : B.p(WIN), W, W.L/2, yb + 1.2, 2.0, 7.0, 0.06, 10); wrect(B.p(TC), W, W.L/2 - 2.6, W.L/2 + 2.6, yb + 1.0, yb + 1.25, 0.15);
        wbox(B.p(TC), W, 0.6, W.L - 0.6, yb, yb + 0.3, 0, 1.2); for (let k = 0; k < 9; k++){ const u = 0.9 + k*(W.L - 1.8)/8; wbox(B.p(TC), W, u - 0.15, u + 0.15, yb + 0.3, yb + 1.25, 0.9, 1.2); } wbox(B.p(TC), W, 0.6, W.L - 0.6, yb + 1.25, yb + 1.45, 0.85, 1.25); }
      else { wrect(B.p(TC), W, W.L/2 - 0.8, W.L/2 + 0.8, yb + 2.0, yb + 7.0, 0.08); const p = W(W.L/2, 0, 0.6); abox(B.p(TC), p[0] - 0.45, p[0] + 0.45, yt, yt + 2.2, p[2] - 0.45, p[2] + 0.45, true); urn(B.p(TC), p[0], yt + 2.2, p[2], 0.8); } }
    ledgeP(B.p(TC), O, yt - 0.9, yt, 0.6);
    // pyramidal roof (octagonal) and the copper-and-glass lantern
    const yr = yt, hr = 6.8; for (let i = 0; i < 8; i++){ const a = O[i], b = O[(i + 1) % 8]; tri(B.p(CU), [a[0], yr, a[1]], [b[0], yr, b[1]], [cx, yr + hr, cz]); }
    const yl = yr + hr*0.62; cyl(B.p(CU), cx, cz, [2.0, 1.8], yl, yl + 4.2, 8, false, PI/8);
    for (let k = 0; k < 8; k++) cwin(B.p(LAN), cx, cz, 1.95, (k + 0.5)/8*TAU + PI/8 - PI/8, 0.5, yl + 0.7, yl + 3.4);
    lathe(B.p(CU), [[2.3, yl + 4.2], [1.6, yl + 5.0], [0.6, yl + 5.8], [0, yl + 6.1]], cx, cz, 8, PI/8); seg(B.p(CU), [cx, yl + 6.0, cz], [cx, yl + 8.2, cz], 0.1, 4);
  };
  tower(19.4, 21.4); tower(19.4, -21.4); tower(-17.9, 21.4);
  // canopies (CPW, 81st Street x2, 82nd Street)
  for (const [x0, x1, z0, z1] of [[28.9, 32.6, -1.6, 1.6], [-21, -17.8, 31.1, 34.6], [-3, 0.2, 31.1, 34.6], [6, 9.2, -34.4, -31.1]]) abox(B.p('#3a3a3c'), x0, x1, 3.3, 3.6, z0, z1);
  B.flush(g); return g; }};
place('nyberesford', 40.7825794, -73.9719058, -0.5060);

// offset a polygon by d (d > 0 outward, < 0 inward), mitred corners
const offP = (P, d) => { const s = area(P) > 0 ? 1 : -1, n = P.length, Q = [];
  for (let i = 0; i < n; i++){ const p = P[(i + n - 1) % n], c = P[i], q = P[(i + 1) % n];
    const d1 = norm2([c[0]-p[0], c[1]-p[1]]), d2 = norm2([q[0]-c[0], q[1]-c[1]]), n1 = [d1[1]*s, -d1[0]*s], n2 = [d2[1]*s, -d2[0]*s];
    let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml; const k = d/Math.max(0.35, mx*n1[0] + mz*n1[1]);
    Q.push([c[0] + mx*k, c[1] + mz*k]); } return Q; };
// skin between offset rings of P: prof = [[d, y], ...] (mansards, hipped roofs)
const skinP = (o, P, prof) => { const R = prof.map(([d, y]) => [offP(P, d), y]);
  for (let k = 0; k < R.length - 1; k++){ const [A, ya] = R[k], [Bq, yb] = R[k + 1];
    for (let i = 0; i < P.length; i++){ const j = (i + 1) % P.length; quad(o, [A[i][0], ya, A[i][1]], [A[j][0], ya, A[j][1]], [Bq[j][0], yb, Bq[j][1]], [Bq[i][0], yb, Bq[i][1]]); } }
  return R[R.length - 1][0]; };

// ===== The Ansonia (1904, Paul E. M. Duboy), 2109 Broadway between 73rd and 74th Streets. Beaux-Arts apartment hotel, 17 storeys:
// fourteen storeys of white brick, limestone and terracotta on a rusticated limestone base (the 27 ft archway on 73rd Street),
// French windows with elaborate iron balconies spanning several bays, cornices, and the three-storey convex slate mansard with two
// rows of dormers and copper trim; round corner turrets swelling out of the corners, carried up through the mansard and crowned by
// domed cupolas with lanterns, finials and widow's walks. Irregular H plan with light courts on 73rd and 74th Streets and the slot
// court to the west; the Broadway front follows the curve of Broadway. Floodlit at night. Footprint: ref_nyuws.json (nyansonia)
// building 0 (3647 m2). Broadway = the slanted +x face, 73rd Street = +z face.
LANDMARKS.nyansonia = {zh:'安索尼亚公寓', en:'The Ansonia', cat:'old', r:52, h:70,
  lt:{m:0, c:'#ffdcae', k:0.55, e:0.45, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
  const LS = {c:'#e4ded0', m:0, lk:0.6}, LS2 = {c:'#d4ccba', m:0, lk:0.6}, SL = {c:'#5a6067', m:0, lk:0.12}, CU = {c:'#7aa391', m:0, lk:0.35}, IR = {c:'#2f3133', m:0, lk:0.1},
    LAN = {c:'#4c4536', glow:'#ffd38a', gk:0.9}, SHOP = {c:'#3a3530', glow:'#ffd9a8', gk:0.55};
  const P = [[-38.0, 32.6], [-37.2, 3.9], [-10.0, 4.5], [-9.9, 1.4], [-13.7, 1.3], [-13.6, -3.2], [-9.8, -3.2], [-9.7, -6.3], [-35.0, -6.0], [-35.2, -32.9], [-23.3, -32.9], [-23.2, -20.4], [-18.1, -20.5], [-18.2, -32.7], [-5.0, -32.9], [-4.9, -20.6], [-0.1, -20.7], [-0.1, -32.8], [18.7, -32.3], [20.0, -30.7], [29.4, 3.2], [36.2, 24.8], [38.0, 27.4], [37.5, 30.3], [35.6, 32.0], [33.1, 32.8], [15.6, 32.5], [15.8, 21.0], [9.6, 21.0], [7.3, 22.7], [7.0, 32.8], [-9.6, 32.7], [-9.5, 20.5], [-20.4, 20.3], [-20.7, 32.9]];
  const yW = 50.0, s = area(P) > 0 ? 1 : -1;
  // base: shopfronts on Broadway, rusticated limestone, the archway on 73rd Street
  prism(B.p(LS2), P, -5, 12.1, false);
  for (let i = 0; i < P.length; i++){ const W = wmap(P[i], P[(i + 1) % P.length], s); if (W.L < 4) continue; const n = Math.round(W.L/3.3), st = W.L/n, bw = i >= 19 && i <= 25;
    for (let k = 0; k < n; k++){ const u = (k + 0.5)*st; if (bw) wrect(B.p(SHOP), W, u - 1.35, u + 1.35, 0.4, 4.2, 0.06); else warch(rng() < 0.4 ? B.p(LIT) : B.p(WIN), W, u, 1.0, 0.8, 3.4, 0.06, 6);
      wrect(rng() < 0.3 ? B.p(LIT) : B.p(WIN), W, u - 0.6, u + 0.6, 6.3, 8.6, 0.06); wrect(rng() < 0.3 ? B.p(LIT) : B.p(WIN), W, u - 0.6, u + 0.6, 9.4, 11.4, 0.06); }
    for (const y of [5.0, 6.0, 7.0, 8.0, 9.0, 10.0]) wrect(B.p(LS), W, 0, W.L, y, y + 0.14, 0.04); }
  { const W = wmap(P[30], P[31], s); wbox(B.p(LS), W, 4.0, 13.0, 0, 9.6, 0, 0.6); warch(B.p(SHOP), W, 8.5, 0, 3.4, 8.2, 0.62, 10); }
  ledgeP(B.p(LS), P, 11.6, 12.4, 0.5);
  // the body: storeys 4-14 with French windows, iron balconies and band courses
  mass(B, rng, P, 12.4, yW, {wall:LS, fh:3.45, yw:12.4, bay:2.5, ww:1.15, wh:2.3, pl:0.3, sill:'#cfc7b5'});
  for (let i = 0; i < P.length; i++){ const W = wmap(P[i], P[(i + 1) % P.length], s); if (W.L < 7) continue;
    for (const f of [0, 3, 5, 7, 9, 10]){ const y = 12.4 + f*3.45 + 0.35;
      wbox(B.p(LS2), W, 0.8, W.L - 0.8, y - 0.25, y, 0, 0.75); wrect(B.p(IR), W, 0.8, W.L - 0.8, y, y + 1.0, 0.74);
      for (const u of [0.8, W.L - 0.8]){ const a = W(u, y, 0.05), b = W(u, y, 0.74); quad(B.p(IR), [a[0], y, a[2]], [b[0], y, b[2]], [b[0], y + 1.0, b[2]], [a[0], y + 1.0, a[2]]); } } }
  bandsP(B.p(LS2), P, [12.4 + 4*3.45 - 0.3, 12.4 + 8*3.45 - 0.3], 0.4, 0.15);
  ledgeP(B.p(LS2), P, yW - 1.0, yW + 0.6, 0.9);
  // the convex mansard (slate, copper cresting) with two rows of dormers
  const top = skinP(B.p(SL), P, [[0.1, yW + 0.6], [-0.9, yW + 3.6], [-2.0, yW + 6.4], [-3.2, yW + 8.8], [-4.4, yW + 10.3]]);
  flat(B.p(SL), top, yW + 10.3); prism(B.p(CU), top, yW + 10.3, yW + 10.9, false);
  for (let i = 0; i < P.length; i++){ const W = wmap(P[i], P[(i + 1) % P.length], s); if (W.L < 5) continue; const n = Math.round((W.L - 2)/3.2), st = (W.L - 2)/n;
    for (let k = 0; k < n; k++){ const u = 1 + (k + 0.5)*st;
      wbox(B.p(LS), W, u - 0.9, u + 0.9, yW + 0.8, yW + 3.6, -2.4, 0.2); wrect(rng() < 0.35 ? B.p(LIT) : B.p(WIN), W, u - 0.55, u + 0.55, yW + 1.1, yW + 3.2, 0.22);
      const a = W(u - 1.0, yW + 3.6, 0.25), b = W(u + 1.0, yW + 3.6, 0.25), c = W(u, yW + 4.6, 0.25), a2 = W(u - 1.0, yW + 3.6, -2.4), b2 = W(u + 1.0, yW + 3.6, -2.4), c2 = W(u, yW + 4.6, -2.4);
      tri(B.p(CU), a, b, c); quad(B.p(CU), a, c, c2, a2); quad(B.p(CU), c, b, b2, c2);
      if (k % 2 === 0){ wbox(B.p(LS), W, u - 0.6, u + 0.6, yW + 5.6, yW + 7.6, -3.6, -1.6); wrect(rng() < 0.3 ? B.p(LIT) : B.p(WIN), W, u - 0.4, u + 0.4, yW + 5.9, yW + 7.2, -1.58); } } }
  // corner turrets with domed cupolas
  const turret = (cx, cz, r) => {
    cyl(B.p(LS), cx, cz, r, 5.0, yW, 20, false);
    for (let f = 0; f < 11; f++) for (let k = 0; k < 8; k++) cwin(rng() < 0.3 ? B.p(LIT) : B.p(WIN), cx, cz, r + 0.05, k/8*TAU, 0.6, 12.4 + f*3.45 + 0.6, 12.4 + f*3.45 + 2.8);
    for (const y of [12.4, 26.2, 40.0]) cyl(B.p(LS2), cx, cz, r + 0.35, y - 0.4, y, 20);
    cyl(B.p(LS2), cx, cz, r + 0.8, yW - 1.0, yW + 0.6, 20);
    cyl(B.p(LS), cx, cz, r - 0.2, yW + 0.6, yW + 8.0, 16, false);
    for (let k = 0; k < 8; k++) cwin(rng() < 0.35 ? B.p(LIT) : B.p(WIN), cx, cz, r - 0.15, k/8*TAU, 0.55, yW + 2.0, yW + 6.0);
    cyl(B.p(LS2), cx, cz, r + 0.2, yW + 7.6, yW + 8.4, 16);
    lathe(B.p(SL), [[r + 0.1, yW + 8.4], [r - 0.3, yW + 10.6], [r*0.72, yW + 12.6], [r*0.4, yW + 13.9], [r*0.2, yW + 14.3]], cx, cz, 16);
    for (let k = 0; k < 8; k++){ const t = k/8*TAU; seg(B.p(CU), [cx + Math.cos(t)*(r + 0.1), yW + 8.4, cz + Math.sin(t)*(r + 0.1)], [cx + Math.cos(t)*r*0.72, yW + 12.6, cz + Math.sin(t)*r*0.72], 0.12, 4); }
    cyl(B.p(CU), cx, cz, r*0.24 + 0.4, yW + 14.3, yW + 14.6, 10); cyl(B.p(IR), cx, cz, r*0.24 + 0.35, yW + 14.6, yW + 15.4, 10, false);
    cyl(B.p(CU), cx, cz, 0.75, yW + 14.6, yW + 16.6, 8, false); for (let k = 0; k < 4; k++) cwin(B.p(LAN), cx, cz, 0.8, k*HP, 0.35, yW + 15.0, yW + 16.2);
    lathe(B.p(CU), [[0.95, yW + 16.6], [0.5, yW + 17.3], [0, yW + 17.6]], cx, cz, 8); seg(B.p(CU), [cx, yW + 17.5, cz], [cx, yW + 19.3, cz], 0.07, 4);
  };
  turret(33.6, 28.9, 4.4); turret(17.2, -29.0, 4.2); turret(-34.4, 29.5, 4.0); turret(-32.0, -29.7, 4.0);
  for (const [x, z] of [[-23.2, 30.3], [-7.1, 30.2], [4.6, 30.3], [18.0, 30.0]]) turret(x, z, 3.2);
  for (const [x, z] of [[-25.6, -30.4], [-15.8, -30.3], [-7.4, -30.4], [2.3, -30.3]]) turret(x, z, 2.8);
  B.flush(g); return g; }};
place('nyansonia', 40.7801505, -73.9821633, -0.506);

// ===== Soldiers' and Sailors' Monument (1902, Stoughton & Stoughton with Paul E. M. Duboy), Riverside Drive at 89th Street. A white
// marble peripteral Corinthian temple after the Choragic Monument of Lysicrates, about 30 m high: the high rusticated circular base
// with the bronze doorway on the east, twelve Corinthian columns round the tall rusticated cella, the full entablature with its
// frieze and the cresting of eagles alternating with cartouches, the low conical roof and the marble finial. It stands on the
// raised plaza at the bend of Riverside Drive (orange stone paving, the plinths at the entrance of the terrace, granite retaining
// walls falling to the park on the west and two cannons on the south side). Inscriptions are not modelled. Floodlit at night.
// Footprint: ref_nyuws_4.json building 46 (diameter 13.2 m); the plaza from the park paths around it.
LANDMARKS.nyssmonument = {zh:'士兵与水手纪念碑', en:"Soldiers' and Sailors' Monument", cat:'old', r:40, h:31,
  lt:{m:0, c:'#fff0d8', k:0.9, e:0.55}, build(){
  const g = new THREE.Group(), B = mkB();
  const MB = {c:'#efece6', m:0, lk:0.95}, MB2 = {c:'#dcd8cf', m:0, lk:0.9}, CEL = {c:'#bdb7ab', m:0, lk:0.7}, GRN = {c:'#9d9a93', m:0, lk:0.4}, PAV = {c:'#c4a283', m:0, lk:0.25}, BRZ = '#4f4535', IRN = '#3c3f40',
    LMP = {c:'#fff2d0', glow:'#ffe3a8', gk:1.4};
  // the plaza and its retaining walls
  const PL = [[-12, -31], [25, -31], [25, 19], [-12, 19]];
  prism(B.p(GRN), PL, -14, -0.25, false); flat(B.p(PAV), PL, -0.25);
  bandsP(B.p(GRN), PL, [-0.6], 0.6, 0.12);
  for (const [a, b] of [[[-12, 19], [-12, -31]], [[25, 19], [-12, 19]], [[-12, -31], [25, -31]]]){ const W = wmap(a, b, 1), L = W.L;
    for (let u = 0.4; u < L; u += 0.9) wbox(B.p(MB2), W, u - 0.12, u + 0.12, 0.05, 0.85, -0.45, -0.2); wbox(B.p(MB2), W, 0, L, 0.85, 1.05, -0.5, -0.15); }
  // the stepped base, the circular podium (rusticated) and the doorway
  for (const [r, y0, y1] of [[10.2, -0.25, 0.25], [9.6, 0.25, 0.75], [9.0, 0.75, 1.25]]) cyl(B.p(GRN), 0, 0, r, y0, y1, 32);
  cyl(B.p(MB2), 0, 0, 7.6, 1.25, 2.0, 32);
  cyl(B.p(MB), 0, 0, 6.6, 2.0, 7.8, 32, false);
  for (let k = 0; k < 6; k++) cyl(B.p(MB2), 0, 0, 6.68, 2.6 + k*0.95, 2.72 + k*0.95, 32, false);
  cyl(B.p(MB2), 0, 0, 7.2, 7.8, 8.6, 32);
  { const W = wmap([6.65, -1.6], [6.65, 1.6], 1); wbox(B.p(MB2), W, -0.4, 3.6, 2.0, 6.6, -0.5, 0.5); warch(B.p(BRZ), W, 1.6, 2.0, 1.1, 3.8, 0.52, 8); }
  // the twelve Corinthian columns, the cella, entablature, cresting, roof, finial
  const y0 = 8.6, yc = 19.2;
  cyl(B.p(CEL), 0, 0, 4.5, y0, yc + 2.6, 24, false);
  for (let k = 0; k < 7; k++) cyl(B.p(MB2), 0, 0, 4.56, y0 + 0.9 + k*1.5, y0 + 1.02 + k*1.5, 24, false);
  for (let k = 0; k < 12; k++){ const t = (k + 0.5)/12*TAU, x = Math.cos(t)*5.9, z = Math.sin(t)*5.9;
    abox(B.p(MB2), x - 0.6, x + 0.6, y0, y0 + 0.5, z - 0.6, z + 0.6, true);
    cyl(B.p(MB), x, z, [0.5, 0.43], y0 + 0.5, yc - 1.2, 10, false);
    lathe(B.p(MB2), [[0.45, yc - 1.2], [0.62, yc - 0.6], [0.8, yc - 0.15], [0.8, yc]], x, z, 8); }
  cyl(B.p(MB), 0, 0, 6.6, yc, yc + 1.0, 32); cyl(B.p(MB2), 0, 0, 6.5, yc + 1.0, yc + 2.2, 32, false); cyl(B.p(MB), 0, 0, 6.95, yc + 2.2, yc + 2.8, 32);
  for (let k = 0; k < 24; k++){ const t = k/24*TAU, x = Math.cos(t)*6.55, z = Math.sin(t)*6.55;
    if (k % 2) lathe(B.p(MB2), [[0, yc + 2.8], [0.32, yc + 2.9], [0.2, yc + 3.3], [0.3, yc + 3.6], [0, yc + 3.9]], x, z, 6); else { rbox(B.p(MB2), 0.9, 0.3, 0.4, x, yc + 2.8, z, -t + HP); rbox(B.p(MB2), 0.55, 0.35, 0.35, x, yc + 3.1, z, -t + HP); lathe(B.p(MB2), [[0.2, yc + 3.45], [0.12, yc + 3.7], [0, yc + 3.8]], x, z, 6); } }
  lathe(B.p(MB), [[6.3, yc + 2.8], [5.2, yc + 3.6], [3.4, yc + 4.8], [1.4, yc + 5.6], [0.9, yc + 5.8]], 0, 0, 24);
  lathe(B.p(MB2), [[0.9, yc + 5.8], [1.2, yc + 6.4], [0.7, yc + 7.0], [1.0, yc + 8.2], [0.55, yc + 9.4], [0.75, yc + 10.0], [0.3, yc + 11.0], [0, yc + 11.6]], 0, 0, 12);
  // terrace plinths at the entrance, cannons on the south side, lamps
  for (const z of [-5.5, 5.5]){ abox(B.p(MB2), 11.5, 13.5, -0.25, 2.2, z - 1.0, z + 1.0, true); abox(B.p(MB), 11.3, 13.7, 2.2, 2.6, z - 1.2, z + 1.2, true); }
  for (const x of [-3.5, 3.5]){ abox(B.p(IRN), x - 0.6, x + 0.6, -0.25, 0.6, 12.0, 13.6, true); seg(B.p(IRN), [x, 0.9, 11.6], [x, 1.1, 15.2], 0.22, 8); for (const d of [-0.65, 0.65]) cyl(B.p(IRN), x + d, 13.2, 0.55, -0.25, -0.2, 8); }
  for (const [x, z] of [[18, -12], [18, 12], [-8, -16], [-8, 16]]){ seg(B.p(IRN), [x, -0.25, z], [x, 3.8, z], 0.08, 6); lathe(B.p(LMP), [[0, 3.8], [0.28, 4.0], [0.3, 4.5], [0, 4.7]], x, z, 6); }
  B.flush(g); return g; }};
place('nyssmonument', 40.7920954, -73.9789271, -0.506);

// ===== Cooper Hewitt, Smithsonian Design Museum: the Andrew Carnegie Mansion (1902, Babb, Cook & Willard), 2 East 91st Street at
// Fifth Avenue. Georgian Revival: red brick with limestone quoins and window surrounds over a rusticated limestone ground storey
// with arched openings; the modillioned stone cornice, the balustrade with urns, the copper-sheathed arched dormers and the brick
// chimneys; the Tiffany glass-and-iron canopy over the 91st Street entrance up the curved walk; the lower service wing and the
// metal-and-glass conservatory on the east. The Arthur Ross Terrace and Garden wraps round the south and west: lawn, paths,
// mature trees along the east, the raised terrace walk beside the house, the iron fence with stone posts.
// Footprint: ref_nyuws.json (nycooperhewitt) building 2. Fifth Avenue = -x, 91st Street = -z, 90th Street = +z.
LANDMARKS.nycooperhewitt = {zh:'库珀·休伊特设计博物馆', en:'Cooper Hewitt, Smithsonian Design Museum', cat:'old', r:58, h:24,
  lt:{m:0, c:'#ffdcae', k:0.65, e:0.5}, build(){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
  const BRK = {c:'#a5523d', m:0, lk:0.45}, LS = {c:'#e2dccd', m:0, lk:0.75}, CU = {c:'#6f9c88', m:0, lk:0.3}, SL = '#5c6268', GL = {c:'#9fb4b8', glow:'#ffe2b0', gk:0.5},
    LAWN = '#6f9a50', PATH = '#c8bba3', IRN = '#2f3133', TRK = '#5a4632', LEAF = '#4f7a3c', LEAF2 = '#5f8a45';
  const s = 1;
  // main block (11 x 5 bays): rusticated ground storey, two brick storeys, cornice, balustrade, roof with copper dormers
  const M = rect(-29.1, 4.9, -13.3, 8.0), sM = area(M) > 0 ? 1 : -1;
  prism(B.p(LS), M, -5, 5.4, false); prism(B.p(BRK), M, 5.4, 14.6, false);
  for (let i = 0; i < 4; i++){ const W = wmap(M[i], M[(i + 1) % 4], sM), n = i % 2 ? 5 : 11, st = W.L/n;
    for (let k = 0; k < n; k++){ const u = (k + 0.5)*st; warch(rng() < 0.5 ? B.p(LIT) : B.p(WIN), W, u, 0.9, 0.85, 3.6, 0.06, 6); wrect(B.p(LS), W, u - 0.25, u + 0.25, 4.0, 4.6, 0.12);
      for (const [y, h] of [[6.4, 3.0], [10.6, 2.6]]){ wrect(B.p(LS), W, u - 0.95, u + 0.95, y - 0.3, y + h + 0.45, 0.04); wrect(rng() < 0.35 ? B.p(LIT) : B.p(WIN), W, u - 0.65, u + 0.65, y, y + h, 0.08); } }
    for (const y of [1.8, 3.1]) wrect(B.p(LS), W, 0, W.L, y, y + 0.1, 0.04);
    wrect(B.p(LS), W, -0.1, 1.1, 5.4, 14.6, 0.07); wrect(B.p(LS), W, W.L - 1.1, W.L + 0.1, 5.4, 14.6, 0.07);
    if (i % 2 === 0){ wbox(B.p(LS), W, W.L/2 - 5, W.L/2 + 5, 5.4, 5.8, 0, 1.3); wrect(B.p(IRN), W, W.L/2 - 5, W.L/2 + 5, 5.8, 6.8, 1.28); } }
  bandsP(B.p(LS), M, [5.2], 0.5, 0.1);
  ledgeP(B.p(LS), M, 14.6, 15.6, 0.7);
  for (let i = 0; i < 4; i++){ const W = wmap(M[i], M[(i + 1) % 4], sM); for (let u = 0.3; u < W.L; u += 0.55) wbox(B.p(LS), W, u - 0.1, u + 0.1, 15.6, 16.4, 0.15, 0.45);
    wbox(B.p(LS), W, 0, W.L, 16.4, 16.7, 0.05, 0.55); for (let u = 0; u <= W.L + 0.01; u += W.L/(i % 2 ? 3 : 6)){ wbox(B.p(LS), W, u - 0.35, u + 0.35, 15.6, 16.9, 0.0, 0.6); const p = W(u, 0, 0.3); urn(B.p(LS), p[0], 16.9, p[2], 0.5); } }
  hipR(B.p(SL), -27.6, 3.4, -11.8, 6.5, 15.6, 5.2, 3.4, 3.4);
  for (let i = 0; i < 4; i++){ const W = wmap(M[i], M[(i + 1) % 4], sM), n = i % 2 ? 3 : 7, st = (W.L - 6)/n;
    for (let k = 0; k < n; k++){ const u = 3 + (k + 0.5)*st; wbox(B.p(CU), W, u - 0.8, u + 0.8, 16.0, 18.4, -2.6, -0.8); warch(B.p(CU), W, u, 18.2, 0.8, 1.6, -0.8, 6);
      wrect(rng() < 0.3 ? B.p(LIT) : B.p(WIN), W, u - 0.5, u + 0.5, 16.4, 18.2, -0.78); } }
  for (const [x, z] of [[-26, -9.8], [-26, 4.5], [1.5, -9.8], [1.5, 4.5], [-12, -9.5], [-12, 4.2]]){ abox(B.p(BRK), x - 0.8, x + 0.8, 17, 22.0, z - 0.6, z + 0.6, true); abox(B.p(LS), x - 1.0, x + 1.0, 22.0, 22.5, z - 0.8, z + 0.8); }
  // the Tiffany canopy over the 91st Street entrance, steps and the curved walk
  { const x = -12.1; abox(B.p(LS), x - 3.0, x + 3.0, -0.3, 0.9, -17.5, -13.3); seg(B.p(IRN), [x - 2.4, 0.9, -16.8], [x - 2.4, 4.4, -16.8], 0.08, 6); seg(B.p(IRN), [x + 2.4, 0.9, -16.8], [x + 2.4, 4.4, -16.8], 0.08, 6);
    const C = [[x - 2.8, 4.4, -13.3], [x + 2.8, 4.4, -13.3], [x + 2.8, 4.9, -17.2], [x - 2.8, 4.9, -17.2]]; quad(B.p(GL), ...C); quad(B.p(IRN), [x - 2.9, 4.3, -17.3], [x + 2.9, 4.3, -17.3], [x + 2.9, 4.95, -17.3], [x - 2.9, 4.95, -17.3]); }
  // service wing, conservatory
  mass(B, rng, [[4.9, -12.6], [11.4, -12.6], [11.4, -9.3], [14.5, -9.2], [14.5, -11.7], [26.4, -11.7], [26.4, -0.4], [4.9, -0.4]], -5, 12.0, {wall:BRK, roof:SL, fh:4.2, yw:0.8, bay:3.1, ww:1.2, wh:2.4, pl:0.3, cor:[0.7, 0.5], corC:LS});
  bandsP(B.p(LS), [[4.9, -12.6], [26.4, -12.6], [26.4, -0.4], [4.9, -0.4]], [4.6], 0.4, 0.12);
  prism(B.p(LS), rect(4.9, 20.0, -0.4, 7.6), -5, 1.6, false); flat(B.p(LS), rect(4.9, 20.0, -0.4, 7.6), 1.6);
  prism(B.p(GL), rect(5.2, 19.7, -0.1, 7.3), 1.6, 6.4, false); hipR(B.p(GL), 5.2, 19.7, -0.1, 7.3, 6.4, 2.2, 3.0, 3.0);
  for (let x = 5.2; x <= 19.75; x += 1.45) for (const z of [-0.12, 7.32]) abox(B.p(IRN), x - 0.06, x + 0.06, 1.6, 6.4, z - 0.06, z + 0.06, true);
  mass(B, rng, rect(22.0, 29.1, -0.4, 13.3), -5, 9.0, {wall:BRK, roof:SL, fh:4.2, yw:0.8, bay:3.0, ww:1.2, wh:2.4, pl:0.3, cor:[0.6, 0.4], corC:LS});
  for (let z = 1.0; z < 13; z += 2.2) abox(B.p(LS), 31.7, 32.1, 0, 3.0, z - 0.2, z + 0.2, true);
  for (let z = 0.5; z < 13.5; z += 1.0) abox(B.p(TRK), 29.1, 32.3, 3.0, 3.25, z - 0.08, z + 0.08, true);
  // the museum's townhouses on 90th Street (9 and 11 East 90th Street, real footprint; five storeys of brick over a rusticated
  // marble ground storey, the bowed upper storeys and the columned entry on the street) and the low link to the mansion
  { const T = rect(29.2, 37.1, 11.7, 42.7), BR2 = {c:'#9a5843', m:0, lk:0.45};
    mass(B, rng, T, -5, 23.9, {wall:BR2, roof:SL, fh:3.9, yw:4.6, bay:2.7, ww:1.2, wh:2.3, pl:0.35, cor:[0.7, 0.4], corC:LS});
    prism(B.p(LS), rect(29.15, 37.15, 11.65, 42.75), -5, 4.6, false);
    const W = wmap([37.1, 42.7], [29.2, 42.7], 1); for (const u of [2.0, 6.0]) warch(B.p(LIT), W, u, 0.6, 0.9, 3.2, 0.06, 6);
    for (const x of [31.0, 34.4]) cyl(B.p(LS), x, 43.2, 0.25, 0, 4.0, 8, false);
    abox(B.p(LS), 30.2, 35.6, 4.6, 5.0, 42.7, 43.8, true);
    lathe(B.p(BR2), [[2.6, 5.0], [2.6, 19.5]], 33.1, 42.7, 8, 0, PI); for (let f = 0; f < 4; f++) for (const t of [0.35, 1.57, 2.79]) cwin(rng() < 0.35 ? B.p(LIT) : B.p(WIN), 33.1, 42.7, 2.65, t, 0.5, 5.8 + f*3.6, 7.9 + f*3.6);
    flat(B.p(LS), (() => { const o = [[30.5, 42.7]]; for (let k = 0; k <= 8; k++){ const t = k/8*PI; o.push([33.1 + Math.cos(t)*2.6, 42.7 + Math.sin(t)*2.6]); } return o; })(), 19.5);
    mass(B, rng, [[19.5, 13.3], [29.2, 13.3], [29.2, 24.5], [19.5, 24.5]], -5, 7.5, {wall:BR2, roof:SL, fh:3.6, yw:0.6, bay:3.0, ww:1.1, wh:2.2, pl:0.35, cor:[0.5, 0.3], corC:LS}); }
  // the garden: lawn, paths, terrace walk, trees, fence with stone posts
  const GA = [[-33.0, -20.0], [-29.6, -20.0], [-29.6, 8.6], [17.5, 8.6], [17.5, 42.5], [-33.0, 42.5]];
  prism(B.p(LAWN), GA, -2.5, 0.04);
  for (const P of [rect(-33.0, -29.6, -20.0, 42.5), rect(-29.6, 17.5, 8.6, 12.8), rect(-14.0, -10.5, 12.8, 42.5), rect(-29.6, 17.5, 26.0, 28.4)]) flat(B.p(PATH), P, 0.08);
  prism(B.p(LS), rect(-29.1, 4.9, 8.0, 11.6), -0.5, 1.3, true); for (let x = -28.8; x < 4.8; x += 0.6) abox(B.p(LS), x - 0.08, x + 0.08, 1.3, 2.1, 11.3, 11.5, true); abox(B.p(LS), -29.1, 4.9, 2.1, 2.3, 11.2, 11.6);
  for (const [x, z, sz] of [[10, 18, 1.7], [14, 24, 1.9], [12, 34, 2.0], [15, 40, 1.8], [5, 38, 1.7], [-3, 39, 1.6], [-20, 36, 1.8], [-26, 20, 1.6], [-25, 30, 1.9], [-31.5, -8, 1.5], [-31.5, 2, 1.5], [6, 22, 1.4], [-2, 18, 1.3], [-22, 16, 1.4]])
    treeB(B.p(TRK), B.p(rng() < 0.5 ? LEAF : LEAF2), x, 0, z, sz);
  const FN = [[-33.0, -20.0], [-33.0, 42.5], [17.5, 42.5]];
  for (let i = 0; i < FN.length - 1; i++){ const a = FN[i], b = FN[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(L/6);
    for (let k = 0; k <= n; k++){ const t = k/n, x = a[0] + (b[0] - a[0])*t, z = a[1] + (b[1] - a[1])*t; abox(B.p(LS), x - 0.3, x + 0.3, 0, 1.9, z - 0.3, z + 0.3, true); }
    for (const y of [0.3, 1.5]) quad(B.p(IRN), [a[0], y, a[1]], [b[0], y, b[1]], [b[0], y + 0.08, b[1]], [a[0], y + 0.08, a[1]]);
    const m = Math.round(L/0.25); for (let k = 0; k <= m; k++){ const t = k/m; seg(B.p(IRN), [a[0] + (b[0] - a[0])*t, 0.2, a[1] + (b[1] - a[1])*t], [a[0] + (b[0] - a[0])*t, 1.7, a[1] + (b[1] - a[1])*t], 0.025, 3); } }
  B.flush(g); return g; }};
place('nycooperhewitt', 40.7842911, -73.9577604, -0.5046);

// ===== The Jewish Museum: the Felix M. Warburg House (1908, C. P. H. Gilbert), 1109 Fifth Avenue at 92nd Street, with Kevin Roche's
// 1993 addition that continues the house along Fifth Avenue in the same style. French Gothic (Francois I) chateau of grey Indiana
// limestone: five storeys with hood-moulded mullioned windows, string courses, the steep slate roof with copper cresting, the tall
// stone dormers with pointed gables, crockets and pinnacles, the corner bay on 92nd Street, tall chimney stacks; the flat-roofed
// rear block of the additions to the east. Footprint: ref_nyuws.json (nyjewishmus) building 12. Fifth Avenue = -x, 92nd Street = +z.
LANDMARKS.nyjewishmus = {zh:'犹太博物馆', en:'The Jewish Museum', cat:'old', r:26, h:34,
  lt:{m:0, c:'#ffdcae', k:0.65, e:0.5}, build(){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
  const LS = {c:'#cfc8b8', m:0, lk:0.75}, LS2 = {c:'#bdb5a3', m:0, lk:0.7}, SL = '#4f565e', CU = {c:'#6f9c88', m:0, lk:0.3}, LT = {c:'#3c3328', glow:'#ffd29a', gk:0.8};
  const yE = 21.0;
  // rear block (additions), flat roof
  mass(B, rng, rect(4.5, 15.7, -15.2, 15.2), -5, 27.5, {wall:LS2, roof:SL, fh:4.0, yw:1.0, bay:3.2, ww:1.3, wh:2.4, pl:0.35, cor:[0.6, 0.35], corC:LS});
  // the chateau: walls, windows with hood moulds and mullions, string courses
  const C = rect(-15.7, 4.5, -15.2, 15.2), sC = area(C) > 0 ? 1 : -1;
  prism(B.p(LS), C, -5, yE, false);
  for (let i = 0; i < 4; i++){ const W = wmap(C[i], C[(i + 1) % 4], sC); if (i === 1) continue; const n = Math.round(W.L/3.4), st = W.L/n;
    for (let f = 0; f < 5; f++){ const y = 1.0 + f*4.0;
      for (let k = 0; k < n; k++){ const u = (k + 0.5)*st; if (f === 0 && i === 3 && Math.abs(u - W.L*0.62) < 2.2) continue;
        wrect(rng() < 0.35 ? B.p(LT) : B.p(WIN), W, u - 0.85, u + 0.85, y, y + 2.6, 0.06); wrect(B.p(LS2), W, u - 0.07, u + 0.07, y, y + 2.6, 0.1); wrect(B.p(LS2), W, u - 0.85, u + 0.85, y + 1.7, y + 1.8, 0.1);
        wbox(B.p(LS2), W, u - 1.05, u + 1.05, y + 2.6, y + 2.85, 0, 0.18); } }
    for (const y of [0.6, 4.6, 12.6]) wbox(B.p(LS2), W, 0, W.L, y, y + 0.3, 0, 0.15); }
  // entrance on Fifth Avenue (pointed arch)
  { const W = wmap(C[3], C[0], sC), u = W.L*0.62; wbox(B.p(LS2), W, u - 2.2, u + 2.2, 0, 4.6, 0, 0.4); const A = [[u - 1.5, 0], [u + 1.5, 0], [u + 1.5, 2.6], [u + 0.8, 3.7], [u, 4.1], [u - 0.8, 3.7], [u - 1.5, 2.6]];
    for (let k = 1; k < A.length - 1; k++) tri(B.p(LT), W(A[0][0], A[0][1], 0.42), W(A[k][0], A[k][1], 0.42), W(A[k + 1][0], A[k + 1][1], 0.42)); }
  // corner bay on 92nd Street at Fifth Avenue
  { const x = -11.0, z = 15.2; abox(B.p(LS), x - 2.8, x + 2.8, 4.6, yE + 1.0, z, z + 1.3, true); for (let f = 1; f < 5; f++) abox(rng() < 0.35 ? B.p(LT) : B.p(WIN), x - 1.9, x + 1.9, 1.3 + f*4.0, 3.6 + f*4.0, z + 1.31, z + 1.35); }
  ledgeP(B.p(LS2), C, yE - 0.6, yE + 0.3, 0.4);
  // openwork stone parapet along the eaves (Fifth Avenue, 92nd Street, 91st side) with small pinnacles
  for (let i = 0; i < 4; i++){ if (i === 1) continue; const W = wmap(C[i], C[(i + 1) % 4], sC), L = W.L;
    wbox(B.p(LS), W, 0, L, yE + 0.3, yE + 0.5, -0.1, 0.35); wbox(B.p(LS), W, 0, L, yE + 1.3, yE + 1.5, -0.1, 0.35);
    for (let u = 0.4; u < L; u += 0.7) wbox(B.p(LS2), W, u - 0.1, u + 0.1, yE + 0.5, yE + 1.3, 0.0, 0.25);
    for (let u = 0; u <= L + 0.01; u += L/4){ const p = W(u, 0, 0.12); abox(B.p(LS), p[0] - 0.25, p[0] + 0.25, yE + 0.3, yE + 1.9, p[2] - 0.25, p[2] + 0.25, true); lathe(B.p(LS), [[0.22, yE + 1.9], [0, yE + 3.0]], p[0], p[2], 4, PI/4); } }
  // the steep slate roof with cresting, dormers with pointed gables and pinnacles, chimneys
  hipR(B.p(SL), -15.4, 4.2, -14.9, 14.9, yE + 0.3, 7.6, 4.2, 4.2); hipR(B.p(SL), -11.2, 0.0, -10.7, 10.7, yE + 7.9, 3.0, 5.6, 5.6);
  abox(B.p(CU), -5.7, -5.5, yE + 10.9, yE + 11.5, -5.1, 5.1, true); for (const z of [-5.1, 5.1]) seg(B.p(CU), [-5.6, yE + 10.9, z], [-5.6, yE + 13.0, z], 0.08, 4);
  for (let i = 0; i < 4; i++){ if (i === 1) continue; const W = wmap(C[i], C[(i + 1) % 4], sC), n = i === 3 ? 4 : 3, st = (W.L - 4)/n;
    for (let k = 0; k < n; k++){ const u = 2 + (k + 0.5)*st, h = k % 2 ? 4.2 : 5.6;
      wbox(B.p(LS), W, u - 1.3, u + 1.3, yE - 0.6, yE + h, -2.8, 0.15); wrect(rng() < 0.4 ? B.p(LT) : B.p(WIN), W, u - 0.75, u + 0.75, yE + 0.4, yE + h - 0.8, 0.17);
      const a = W(u - 1.4, yE + h, 0.2), b = W(u + 1.4, yE + h, 0.2), c = W(u, yE + h + 2.6, 0.2), a2 = W(u - 1.4, yE + h, -2.8), b2 = W(u + 1.4, yE + h, -2.8), c2 = W(u, yE + h + 2.6, -2.8);
      tri(B.p(LS), a, b, c); tri(B.p(LS), a2, c2, b2); quad(B.p(SL), a, c, c2, a2); quad(B.p(SL), c, b, b2, c2);
      for (const uu of [u - 1.45, u + 1.45]){ const p = W(uu, 0, 0.1); abox(B.p(LS), p[0] - 0.22, p[0] + 0.22, yE + h - 1.6, yE + h + 0.8, p[2] - 0.22, p[2] + 0.22, true); lathe(B.p(LS), [[0.24, yE + h + 0.8], [0, yE + h + 2.2]], p[0], p[2], 4, PI/4); }
      lathe(B.p(LS), [[0.2, yE + h + 2.5], [0, yE + h + 3.4]], c[0], c[2], 4, PI/4); } }
  for (const [x, z] of [[-3.0, -13.8], [-3.0, 13.8], [2.5, 0]]){ abox(B.p(LS2), x - 0.9, x + 0.9, yE, yE + 12.3, z - 0.7, z + 0.7, true); abox(B.p(LS), x - 1.1, x + 1.1, yE + 12.3, yE + 12.8, z - 0.9, z + 0.9); }
  B.flush(g); return g; }};
place('nyjewishmus', 40.7854051, -73.9571858, -0.5082);

// ===== Museum of the City of New York (1932, Joseph H. Freedlander), 1220 Fifth Avenue between 103rd and 104th Streets. Georgian
// Revival in red brick with white marble trim: an H plan round the forecourt on Fifth Avenue (the paved terrace with its balustrade
// and steps), the recessed centre with a white marble ground storey of three arched doorways, the two-storey colonnade of white
// columns above with the niches on either side (their statues are not modelled), the end wings with marble quoins and Palladian
// windows, the modillioned cornice and balustrade, the slate roof of the centre block. Footprint: ref_nyuws.json (nymcny)
// building 0. Fifth Avenue = -x, 103rd Street = +z.
LANDMARKS.nymcny = {zh:'纽约市博物馆', en:'Museum of the City of New York', cat:'old', r:40, h:28,
  lt:{m:0, c:'#ffdcae', k:0.65, e:0.5}, build(){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
  const BRK = {c:'#a44e39', m:0, lk:0.45}, MB = {c:'#ece8de', m:0, lk:0.85}, SL = '#596067', PAV = '#cfc6b4', LT = {c:'#3c3328', glow:'#ffd29a', gk:0.8};
  const P = [[-23.6, 30.1], [-23.5, 16.3], [-7.9, 16.3], [-7.9, 6.3], [-10.6, 6.3], [-10.6, -6.3], [-7.9, -6.4], [-7.9, -16.5], [-23.4, -16.6], [-23.4, -30.3], [3.8, -30.6], [3.8, -29.4], [23.6, -29.4], [22.7, 29.6], [3.5, 30.6], [3.6, 30.2]];
  const s = area(P) > 0 ? 1 : -1, yC = 20.5;
  prism(B.p(MB), P, -5, 5.0, false); prism(B.p(BRK), P, 5.0, yC, false);
  for (let i = 0; i < P.length; i++){ const W = wmap(P[i], P[(i + 1) % P.length], s); if (W.L < 4) continue; const n = Math.round(W.L/3.6), st = W.L/n;
    for (let k = 0; k < n; k++){ const u = (k + 0.5)*st; warch(rng() < 0.45 ? B.p(LT) : B.p(WIN), W, u, 1.0, 0.8, 3.2, 0.06, 6);
      for (const [y, h] of [[6.2, 2.8], [10.2, 2.8], [14.2, 2.6], [17.6, 1.7]]){ wrect(B.p(MB), W, u - 0.95, u + 0.95, y - 0.3, y - 0.12, 0.08); if (h > 2) wrect(B.p(MB), W, u - 0.95, u + 0.95, y + h, y + h + 0.35, 0.08); wrect(rng() < 0.35 ? B.p(LT) : B.p(WIN), W, u - 0.65, u + 0.65, y, y + h, 0.07); } }
    wrect(B.p(MB), W, -0.05, 0.9, 5.0, yC, 0.06); wrect(B.p(MB), W, W.L - 0.9, W.L + 0.05, 5.0, yC, 0.06); }
  bandsP(B.p(MB), P, [4.8, 13.6], 0.4, 0.1);
  ledgeP(B.p(MB), P, yC - 0.6, yC + 0.4, 0.6);
  for (let i = 0; i < P.length; i++){ const W = wmap(P[i], P[(i + 1) % P.length], s); if (W.L < 3) continue;
    for (let u = 0.3; u < W.L; u += 0.5) wbox(B.p(MB), W, u - 0.09, u + 0.09, yC + 0.4, yC + 1.2, -0.45, -0.15); wbox(B.p(MB), W, 0, W.L, yC + 1.2, yC + 1.45, -0.5, -0.1); }
  hipR(B.p(SL), -7.4, 22.2, -16.0, 16.0, yC + 0.4, 4.4, 5.0, 5.0);
  for (const z of [-23.4, 23.4]) hipR(B.p(SL), -22.9, 22.2, z - 6.6, z + 6.6, yC + 0.4, 2.6, 3.6, 3.6);
  // the recessed centre: arched doorways, the colonnade, the niches, the pediment-like attic
  { const Wc = wmap([-10.6, 6.3], [-10.6, -6.3], s), L = Wc.L;
    wbox(B.p(MB), Wc, -0.2, L + 0.2, -0.5, 5.4, 0, 0.3);
    for (const u of [L/2 - 3.6, L/2, L/2 + 3.6]) warch(B.p(LT), Wc, u, 0, 1.2, 4.2, 0.32, 8);
    wbox(B.p(MB), Wc, -1.0, L + 1.0, 5.4, 6.0, 0, 2.4);
    for (let k = 0; k < 4; k++){ const u = L/2 + (k - 1.5)*3.6, p = Wc(u, 0, 1.6); cyl(B.p(MB), p[0], p[2], [0.42, 0.36], 6.0, 13.2, 10, false); abox(B.p(MB), p[0] - 0.5, p[0] + 0.5, 13.2, 13.7, p[2] - 0.5, p[2] + 0.5, true); }
    wbox(B.p(MB), Wc, -1.0, L + 1.0, 13.7, 15.0, 0, 2.4);
    for (const u of [L/2 - 1.8, L/2 + 1.8]){ wrect(rng() < 0.5 ? B.p(LT) : B.p(WIN), Wc, u - 0.8, u + 0.8, 6.6, 12.6, 0.06); }
    const Wf1 = wmap([-7.9, -6.4], [-7.9, -16.5], s), Wf2 = wmap([-7.9, 16.3], [-7.9, 6.3], s);
    for (const Wf of [Wf1, Wf2]){ warch(B.p('#3a3633'), Wf, Wf.L/2, 6.4, 1.1, 4.6, 0.08, 8); wbox(B.p(MB), Wf, Wf.L/2 - 1.4, Wf.L/2 + 1.4, 6.0, 6.4, 0, 0.5); }
    const T = [[-1.2, 15.0], [L + 1.2, 15.0], [L/2, 17.4]]; tri(B.p(MB), Wc(T[0][0], T[0][1], 2.4), Wc(T[1][0], T[1][1], 2.4), Wc(T[2][0], T[2][1], 2.4)); }
  // wing ends on Fifth Avenue: Palladian windows and quoins
  for (const [a, b] of [[[-23.6, 30.1], [-23.5, 16.3]], [[-23.4, -16.6], [-23.4, -30.3]]]){ const W = wmap(a, b, s), u = W.L/2;
    wbox(B.p(MB), W, u - 3.2, u + 3.2, 9.8, 10.2, 0, 0.3); warch(B.p(LT), W, u, 10.2, 1.2, 4.6, 0.1, 8); wrect(B.p(WIN), W, u - 2.6, u - 1.6, 10.2, 13.2, 0.1); wrect(B.p(WIN), W, u + 1.6, u + 2.6, 10.2, 13.2, 0.1); }
  // the forecourt terrace, balustrade and steps
  const FC = rect(-23.5, -10.6, -16.4, 16.2); prism(B.p(MB), FC, -2, 1.0, false); flat(B.p(PAV), FC, 1.0);
  for (const [a, b] of [[[-23.5, -16.4], [-23.5, -3.0]], [[-23.5, 3.0], [-23.5, 16.2]]]){ const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let t = 0.3; t < L; t += 0.5) abox(B.p(MB), a[0] - 0.08, a[0] + 0.08, 1.0, 1.8, a[1] + t - 0.08, a[1] + t + 0.08, true); abox(B.p(MB), a[0] - 0.2, a[0] + 0.2, 1.8, 2.0, a[1], b[1]); }
  for (let k = 0; k < 5; k++) abox(B.p(MB), -23.5 - (k + 1)*0.4, -23.5 - k*0.4, -1, 1.0 - k*0.2, -3.0, 3.0);
  B.flush(g); return g; }};
place('nymcny', 40.7925019, -73.9519062, -0.5006);

// ===== Gracie Mansion (1799), the official residence of the Mayor of New York, Carl Schurz Park at East End Avenue and 88th Street.
// Federal-style two-storey wooden country house of pale yellow clapboard with white trim and dark green shutters, facing north-east
// over Hell Gate: the low hipped roof with the white Chinese-lattice railings round the eaves and the roof deck, the chimneys, the
// broad veranda on its slim columns with lattice railings wrapping the house, the fanlit central doorway; the Susan E. Wagner wing
// (1966) to the west in the same style; the lawn, the hedges, trees and the iron fence. Footprint: ref_nyuws.json (nygracie)
// building 2 (rotated ~ -68.5 deg: local -z faces the river, east-north-east).
LANDMARKS.nygracie = {zh:'格雷西官邸', en:'Gracie Mansion', cat:'old', r:36, h:15,
  lt:{m:0, c:'#ffe2b8', k:0.7, e:0.6}, build(){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
  const CLP = {c:'#efe1ae', m:0, lk:0.7}, WH = {c:'#f4f2ea', m:0, lk:0.8}, SH = '#2f4a3a', RF = '#6c6e6c', BRK = '#8e4b3a', LT = {c:'#3c3328', glow:'#ffd29a', gk:0.85},
    LAWN = '#6d9a4e', TRK = '#5a4632', LEAF = '#4f7a3c', LEAF2 = '#5f8a45', IRN = '#2f3133', HEDGE = '#3f6634';
  // the house: core inside the veranda
  const H = rect(-9.6, 10.2, -16.6, -3.6), sH = area(H) > 0 ? 1 : -1, y1 = 3.6, y2 = 7.0;
  prism(B.p(WH), H, -3, 0.8, false); prism(B.p(CLP), H, 0.8, y2, false);
  for (let i = 0; i < 4; i++){ const W = wmap(H[i], H[(i + 1) % 4], sH), n = i % 2 ? 3 : 5, st = W.L/n;
    for (let y = 1.0; y < y2; y += 0.32) wrect(B.p(WH), W, 0, W.L, y, y + 0.05, 0.03);
    for (let k = 0; k < n; k++){ const u = (k + 0.5)*st; const door = i === 0 && k === 2;
      for (const [ya, h] of [[1.2, 2.0], [4.4, 1.8]]){ if (door && ya < 2){ wrect(B.p(WH), W, u - 1.0, u + 1.0, 0.8, 3.4, 0.06); wrect(B.p(LT), W, u - 0.6, u + 0.6, 0.8, 2.9, 0.08); continue; }
        wrect(B.p(WH), W, u - 0.62, u + 0.62, ya - 0.12, ya + h + 0.12, 0.05); wrect(rng() < 0.4 ? B.p(LT) : B.p(WIN), W, u - 0.48, u + 0.48, ya, ya + h, 0.07);
        wrect(B.p(SH), W, u - 1.08, u - 0.66, ya, ya + h, 0.08); wrect(B.p(SH), W, u + 0.66, u + 1.08, ya, ya + h, 0.08); } }
    wrect(B.p(WH), W, -0.1, 0.3, 0.8, y2, 0.08); wrect(B.p(WH), W, W.L - 0.3, W.L + 0.1, 0.8, y2, 0.08); }
  ledgeP(B.p(WH), H, y2 - 0.3, y2 + 0.2, 0.5);
  hipR(B.p(RF), -10.0, 10.6, -17.0, -3.2, y2 + 0.2, 3.0, 4.2, 4.2);
  // lattice railings: round the eaves and the roof deck
  const rail = (P, y, h, open) => { for (let i = 0; i < P.length - (open ? 1 : 0); i++){ const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.round(L/0.9));
      for (const yy of [y, y + h - 0.08]) quad(B.p(WH), [a[0], yy, a[1]], [b[0], yy, b[1]], [b[0], yy + 0.1, b[1]], [a[0], yy + 0.1, a[1]]);
      for (let k = 0; k < n; k++){ const t0 = k/n, t1 = (k + 1)/n, p0 = [a[0] + (b[0] - a[0])*t0, a[1] + (b[1] - a[1])*t0], p1 = [a[0] + (b[0] - a[0])*t1, a[1] + (b[1] - a[1])*t1];
        seg(B.p(WH), [p0[0], y, p0[1]], [p1[0], y + h, p1[1]], 0.03, 3); seg(B.p(WH), [p1[0], y, p1[1]], [p0[0], y + h, p0[1]], 0.03, 3); seg(B.p(WH), [p0[0], y, p0[1]], [p0[0], y + h, p0[1]], 0.04, 3); } } };
  rail(rect(-9.8, 10.4, -16.8, -3.4), y2 + 0.2, 0.9);
  rail(rect(-5.8, 6.4, -12.8, -7.4), y2 + 3.2, 0.9); abox(B.p(RF), -5.8, 6.4, y2 + 3.0, y2 + 3.2, -12.8, -7.4);
  for (const [x, z] of [[-6.5, -10.1], [7.1, -10.1]]){ abox(B.p(BRK), x - 0.7, x + 0.7, y2, y2 + 5.0, z - 0.5, z + 0.5, true); abox(B.p(WH), x - 0.8, x + 0.8, y2 + 5.0, y2 + 5.2, z - 0.6, z + 0.6); }
  // the veranda round the river front and both ends
  const V = [[-12.3, -1.1], [-12.3, -19.4], [12.9, -19.4], [12.9, -1.1], [10.2, -1.1], [10.2, -16.6], [-9.6, -16.6], [-9.6, -1.1]];
  prism(B.p(WH), V, -3, 0.8, false); flat(B.p('#b9b2a2'), V, 0.8);
  const roofY = 4.0; flat(B.p(RF), V, roofY + 0.25); prism(B.p(WH), V, roofY, roofY + 0.25, false);
  const cols = []; for (let x = -12.0; x <= 12.7; x += 2.06) cols.push([x, -19.1]); for (let z = -16.6; z <= -1.3; z += 2.2){ cols.push([-12.0, z]); cols.push([12.6, z]); }
  for (const [x, z] of cols) cyl(B.p(WH), x, z, 0.13, 0.8, roofY, 6, false);
  rail([[-12.0, -1.3], [-12.0, -19.1], [-1.8, -19.1]], 0.8, 0.85, true); rail([[2.4, -19.1], [12.6, -19.1], [12.6, -1.3]], 0.8, 0.85, true);
  for (let k = 0; k < 4; k++) abox(B.p(WH), -1.5 + 0.05*k, 2.1 - 0.05*k, 0.8 - (k + 1)*0.2, 0.8 - k*0.2, -19.4 - (k + 1)*0.35, -19.4 - k*0.35);
  rail([[-12.2, -1.2], [-12.2, -19.3], [12.8, -19.3], [12.8, -1.2]], roofY + 0.25, 0.75, true);
  // the Wagner wing (west)
  const Wg = [[-12.7, -1.1], [3.1, -1.1], [3.1, 19.4], [-12.7, 19.4]];
  prism(B.p(WH), Wg, -3, 0.8, false); prism(B.p(CLP), Wg, 0.8, y2 - 0.4, false);
  { const sW = area(Wg) > 0 ? 1 : -1; for (let i = 0; i < 4; i++){ const W = wmap(Wg[i], Wg[(i + 1) % 4], sW); if (i === 0) continue; const n = Math.round(W.L/3.0), st = W.L/n;
      for (let y = 1.0; y < y2 - 0.4; y += 0.32) wrect(B.p(WH), W, 0, W.L, y, y + 0.05, 0.03);
      for (let k = 0; k < n; k++){ const u = (k + 0.5)*st; for (const [ya, h] of [[1.2, 2.2], [4.3, 1.6]]){ wrect(B.p(WH), W, u - 0.62, u + 0.62, ya - 0.12, ya + h + 0.12, 0.05); wrect(rng() < 0.4 ? B.p(LT) : B.p(WIN), W, u - 0.48, u + 0.48, ya, ya + h, 0.07);
        wrect(B.p(SH), W, u - 1.05, u - 0.66, ya, ya + h, 0.08); wrect(B.p(SH), W, u + 0.66, u + 1.05, ya, ya + h, 0.08); } } } }
  ledgeP(B.p(WH), Wg, y2 - 0.7, y2 - 0.3, 0.45); hipR(B.p(RF), -13.1, 3.5, -1.0, 19.8, y2 - 0.3, 2.6, 3.4, 3.4);
  abox(B.p(BRK), -5.8, -4.4, y2 - 0.3, y2 + 3.2, 8.0, 9.0, true);
  // lawn, hedges, trees, fence
  prism(B.p(LAWN), [[-22, -27], [22, -27], [22, 24], [-22, 24]], -3, 0.03);
  for (const [x0, x1, z0, z1] of [[-21.5, -14.5, 21.5, 23.0], [5.0, 21.5, 21.5, 23.0], [20.5, 22.0, -26.5, 23.0]]) abox(B.p(HEDGE), x0, x1, 0, 1.8, z0, z1, true);
  for (const [x, z, sz] of [[-18, -22, 1.9], [17, -23, 2.0], [18, 2, 1.8], [-18, 6, 1.7], [12, 14, 1.6], [-17, -10, 1.6]]) treeB(B.p(TRK), B.p(rng() < 0.5 ? LEAF : LEAF2), x, 0, z, sz);
  const FN = [[-22, -27], [22, -27], [22, 24], [-22, 24]];
  for (let i = 0; i < 4; i++){ const a = FN[i], b = FN[(i + 1) % 4], L = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.round(L/0.3);
    for (const y of [0.25, 1.6]) quad(B.p(IRN), [a[0], y, a[1]], [b[0], y, b[1]], [b[0], y + 0.07, b[1]], [a[0], y + 0.07, a[1]]);
    for (let k = 0; k <= m; k++){ const t = k/m; seg(B.p(IRN), [a[0] + (b[0] - a[0])*t, 0, a[1] + (b[1] - a[1])*t], [a[0] + (b[0] - a[0])*t, 1.9, a[1] + (b[1] - a[1])*t], 0.025, 3); } }
  B.flush(g); return g; }};
place('nygracie', 40.7760814, -73.9430714, -1.1951);
}
