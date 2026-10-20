// ===== bay/sfpark2 — Golden Gate Park, Lands End, Mount Davidson and Aquatic Park landmarks (City Brush v29, Bay Area 1:1 map).
// Keys: sfacademy (California Academy of Sciences, 2008), sfteagarden (Japanese Tea Garden), sfwindmill (Dutch Windmill, 1903) +
// sfwindmill2 (Murphy Windmill, 1908), sfbandshell (Spreckels Temple of Music, 1900), sfcliffhouse (Cliff House, 1909) +
// sfcliffhouse2 (Sutro Baths ruins), sfdavidson (Mount Davidson Cross, 1934), sfhyde (Hyde Street Pier and its historic ships) +
// sfhyde2 (Aquatic Park Bathhouse, 1939).
// Every model is built at ABSOLUTE heights above the sea: build() reads the base height the app picked (LMCTX.u.base; the kit
// computes the same value from the app's DEM, so offline stats match the app) and shifts an inner group down by it. The app's
// ground (90 m DEM, hC = max(-0.3, bilinear)) is embedded below as small patches, so parts sit on the real terrain / sea level.
// No text, logos or brand marks anywhere.
{
const PI = Math.PI, TAU = PI*2;
// ---------- the app's ground: raw 90 m DEM patches [i0, j0, nx, ny, heights] (world grid indices)
const DEM = {
  academy:[127, 576, 5, 6, [75.9,76.8,75.7,72.3,71.9,75.7,75.7,77,76.6,77,75,77.3,75.4,77.7,82.9,72,73.6,77.3,77.7,80.6,74.7,71.3,74.2,76.8,83,75,73.9,74.4,76.6,79.7]],
  tea:[123, 577, 5, 5, [86.3,86.3,73.5,75.7,75.7,86.3,86.3,86.3,75.1,75,86.3,86.3,86.3,75.2,72,73.5,70.8,69.6,75.7,74.7,77.6,71,71.1,72.5,75]],
  band:[125, 577, 4, 4, [73.5,75.7,75.7,75.7,86.3,75.1,75,77.3,86.3,75.2,72,73.6,69.6,75.7,74.7,71.3]],
  dutch:[85, 578, 4, 4, [-0.3,7.9,11.4,13.7,7.5,9.1,11.2,13.5,7.2,9,14.9,13.5,7.8,9.4,11.8,13.1]],
  murphy:[86, 571, 4, 4, [7.9,8.4,10.7,12.5,7.9,8.5,9.7,13.5,9,8.9,9.5,12.7,9.1,10.1,10.7,13.7]],
  cliff:[78, 585, 9, 9, [-6.9,-6.2,-3.5,-1.7,-0.3,-0.3,-0.3,8.5,9.9,-6.2,-5.8,-3.6,-1.6,-0.3,-0.3,-0.3,9.5,28.8,-5.7,-4,-2.3,-1.6,-0.3,-0.3,-0.3,24.7,41.7,-5.6,-0.3,-0.3,-0.3,-0.3,-0.3,48.7,52.9,53.9,-5.3,-0.3,-0.3,-0.3,-0.3,-0.3,56.4,53.8,59.4,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,39.6,48,59.5,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,35.5,50.4,58,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,44.8,51.6,61.7,-0.3,-0.3,-4.4,-0.3,-0.3,-0.3,50.6,59.7,70.7]],
  dav:[139, 537, 6, 6, [229.1,233.8,235.6,223.3,202.8,177.9,243.3,238.3,237,224.4,203.9,192.1,221.4,252.8,259.6,242.3,220.6,206.7,235.7,275.1,270.8,271,235.7,216.4,235.8,239.2,236.2,262.5,242.7,218.7,194.5,211.1,216.2,232,231.5,209.5]],
  hyde:[168, 624, 10, 9, [-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,10.9,7.1,6.1,5.5,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-3.2,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-4.4,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-2.3,-4.3,-4.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-10.2,-7.8,-5.8,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-12.2,-13.2,-13.9,-13.2,-11.5,-0.3,-0.3,-0.3,-0.3,-0.3,-13,-13.1,-13.2,-14.1,-16.6,-0.3,-0.3,-0.3,-0.3,-14.4,-14.3,-13.9,-14,-14,-14.8,-15.4,-15.4,-15.8,-15.6,-14.6]],
  bath:[169, 622, 4, 5, [23.8,21.1,21.7,25.7,-0.3,-0.3,-0.3,18.6,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-3.2,-0.3,-0.3]]
};
const wXY = (lat, lon) => [(lon + 122.19)*88300, (lat - 37.625)*110989];
function hRaw(d, X, Y){
  const D = DEM[d]; let fx = (X + 36000)/90 - D[0], fy = (Y + 36000)/90 - D[1];
  fx = Math.min(D[2] - 1.0001, Math.max(0, fx)); fy = Math.min(D[3] - 1.0001, Math.max(0, fy));
  const i = fx | 0, j = fy | 0, u = fx - i, v = fy - j, H = D[4], n = D[2], q = j*n + i;
  return Math.max(-0.3, (H[q]*(1 - u) + H[q + 1]*u)*(1 - v) + (H[q + n]*(1 - u) + H[q + n + 1]*u)*v);
}
// placements: [lat, lon, rot, r, dem patch]
const PL = {
  sfacademy:[37.769832, -122.466093, 0.7295, 95, 'academy'],
  sfbandshell:[37.7698687, -122.4685622, -0.8378, 34, 'band'],
  sfteagarden:[37.7702, -122.4704, 0, 96, 'tea'],
  sfwindmill:[37.770441, -122.509406, 0, 17, 'dutch'],
  sfwindmill2:[37.765002, -122.508696, 0, 36, 'murphy'],
  sfcliffhouse:[37.7785045, -122.514, 0, 62, 'cliff'],
  sfcliffhouse2:[37.779937, -122.51377, 0, 76, 'cliff'],
  sfdavidson:[37.73834, -122.454769, 0, 26, 'dav'],
  sfhyde:[37.809715, -122.42216, 2.3736, 105, 'hyde'],
  sfhyde2:[37.8064089, -122.4238975, 0.1606, 45, 'bath']
};
// the VISIBLE ground: the app's terrain mesh (two triangles per 90 m cell, diagonal (i, j)-(i+1, j+1)) differs from the
// bilinear hC by up to several metres on curved cells, so parts are set on the mesh and founded down to the lower of the two
function hMesh(d, X, Y){
  const D = DEM[d]; let fx = (X + 36000)/90 - D[0], fy = (Y + 36000)/90 - D[1];
  fx = Math.min(D[2] - 1.0001, Math.max(0, fx)); fy = Math.min(D[3] - 1.0001, Math.max(0, fy));
  const i = fx | 0, j = fy | 0, u = fx - i, v = fy - j, H = D[4], n = D[2], q = j*n + i, a = H[q], b = H[q + 1], c = H[q + n + 1], e = H[q + n];
  return u >= v ? a + (b - a)*u + (c - b)*v : a + (c - e)*u + (e - a)*v;
}
const toW = (k, x, z) => { const P = PL[k], A = wXY(P[0], P[1]), c = Math.cos(P[2]), s = Math.sin(P[2]); return [A[0] + x*c + z*s, A[1] - (-x*s + z*c)]; };
// gm = the visible ground (mesh); gl = never-buried level (max of mesh and hC); glo = foundation level (min of both)
function gm(k, x, z){ const w = toW(k, x, z); return hMesh(PL[k][4], w[0], w[1]); }
function gl(k, x, z){ const w = toW(k, x, z); return Math.max(hRaw(PL[k][4], w[0], w[1]), hMesh(PL[k][4], w[0], w[1])); }
function glo(k, x, z){ const w = toW(k, x, z); return Math.min(hRaw(PL[k][4], w[0], w[1]), hMesh(PL[k][4], w[0], w[1])); }
// the height the app gives local y = 0 (highest ground within r at 0, 0.35 r, 0.7 r, + 0.6 m)
function baseOf(k){
  const u = LMCTX && LMCTX.u && LMCTX.u.base; if (u && u.value !== 0) return u.value;
  const P = PL[k], A = wXY(P[0], P[1]); let hi = -1e9;
  for (let a = 0; a < 12; a++) for (const f of [0, 0.35, 0.7]) hi = Math.max(hi, hRaw(P[4], A[0] + Math.cos(a/12*TAU)*P[3]*f, A[1] + Math.sin(a/12*TAU)*P[3]*f));
  return hi + 0.6;
}
function frame(g, k){ const s = new THREE.Group(); s.position.y = -baseOf(k); g.add(s); return s; }
const place = k => SG_PLACES.push({type:k, lat:PL[k][0], lon:PL[k][1], rot:PL[k][2]});
// ---------- triangle batches: one LTris call per colour
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
// current local transform (a stack of plan rotations + offsets) applied by every primitive
let TF = null; const TFS = [];
const V = (x, y, z) => TF ? TF(x, y, z) : [x, y, z];
// push a frame: origin (cx, cy, cz), local +x along plan angle th (atan2(dz, dx), z south)
function pushT(cx, cy, cz, th){ const c = Math.cos(th || 0), s = Math.sin(th || 0), up = TF; TFS.push(TF);
  TF = (x, y, z) => { const X = cx + x*c - z*s, Y = cy + y, Z = cz + x*s + z*c; return up ? up(X, Y, Z) : [X, Y, Z]; }; }
const popT = () => { TF = TFS.pop(); };
const q4 = (o, a, b, c, d) => o.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2]);
const t3 = (o, a, b, c) => o.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
function box(o, x0, x1, y0, y1, z0, z1, bot){
  const A = V(x0, y0, z0), B = V(x1, y0, z0), C = V(x1, y0, z1), D = V(x0, y0, z1), E = V(x0, y1, z0), F = V(x1, y1, z0), G = V(x1, y1, z1), H = V(x0, y1, z1);
  q4(o, E, H, G, F); q4(o, A, B, F, E); q4(o, B, C, G, F); q4(o, C, D, H, G); q4(o, D, A, E, H); if (bot) q4(o, A, D, C, B);
}
const bc = (o, cx, y0, cz, w, h, d) => box(o, cx - w/2, cx + w/2, y0, y0 + h, cz - d/2, cz + d/2);
// oriented box: centre (cx, cz), long axis at plan angle th
function obox(o, cx, cz, L, W, y0, y1, th){
  const c = Math.cos(th || 0), s = Math.sin(th || 0), l = L/2, w = W/2, P = (u, v, y) => V(cx + u*c - v*s, y, cz + u*s + v*c);
  const A = P(-l, -w, y0), B = P(l, -w, y0), C = P(l, w, y0), D = P(-l, w, y0), E = P(-l, -w, y1), F = P(l, -w, y1), G = P(l, w, y1), H = P(-l, w, y1);
  q4(o, E, H, G, F); q4(o, A, B, F, E); q4(o, B, C, G, F); q4(o, C, D, H, G); q4(o, D, A, E, H);
}
// slanted quad slab between two 3-D points (a member of square-ish section, half-width w)
function beam(o, a, b, w, wy){
  let dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]; const L = Math.hypot(dx, dy, dz); if (L < 1e-4) return; dx /= L; dy /= L; dz /= L;
  let sx = -dz, sz = dx; const sl = Math.hypot(sx, sz); if (sl < 1e-3){ sx = 1; sz = 0; } else { sx /= sl; sz /= sl; }
  const ux = dy*sz, uy = dz*sx - dx*sz, uz = -dy*sx, h = wy || w;
  const P = (p, s1, s2) => V(p[0] + sx*w*s1 + ux*h*s2, p[1] + uy*h*s2, p[2] + sz*w*s1 + uz*h*s2);
  const A = [P(a, -1, -1), P(a, 1, -1), P(a, 1, 1), P(a, -1, 1)], B = [P(b, -1, -1), P(b, 1, -1), P(b, 1, 1), P(b, -1, 1)];
  for (let i = 0; i < 4; i++) q4(o, A[i], A[(i + 1) % 4], B[(i + 1) % 4], B[i]);
}
// frustum / cylinder about a vertical axis (n sides, optional top cap)
function cyl(o, x, z, r0, r1, y0, y1, n, cap, a0){
  a0 = a0 || 0; for (let i = 0; i < n; i++){ const a = a0 + i/n*TAU, b = a0 + (i + 1)/n*TAU;
    const A = V(x + Math.cos(a)*r0, y0, z + Math.sin(a)*r0), B = V(x + Math.cos(b)*r0, y0, z + Math.sin(b)*r0), C = V(x + Math.cos(b)*r1, y1, z + Math.sin(b)*r1), D = V(x + Math.cos(a)*r1, y1, z + Math.sin(a)*r1);
    q4(o, A, B, C, D); if (cap && r1 > 0) t3(o, V(x, y1, z), D, C); }
}
// surface of revolution: prof = [[r, y], ...]
function lathe(o, x, z, prof, n, a0, a1){
  a0 = a0 || 0; const span = a1 === undefined ? TAU : a1 - a0;
  for (let i = 0; i < n; i++){ const a = a0 + i/n*span, b = a0 + (i + 1)/n*span, ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
    for (let k = 0; k < prof.length - 1; k++){ const [r0, y0] = prof[k], [r1, y1] = prof[k + 1];
      q4(o, V(x + ca*r0, y0, z + sa*r0), V(x + cb*r0, y0, z + sb*r0), V(x + cb*r1, y1, z + sb*r1), V(x + ca*r1, y1, z + sa*r1)); } }
}
// ellipsoid blob (trees, bushes, rocks)
function blob(o, x, y, z, rx, ry, rz, nu, nv, j, rng){
  nu = nu || 7; nv = nv || 4; const P = [];
  for (let v = 0; v <= nv; v++){ const t = v/nv*PI, row = []; for (let u = 0; u < nu; u++){ const a = u/nu*TAU, f = j && v > 0 && v < nv ? 1 + (rng() - 0.5)*j : 1;
    row.push(V(x + Math.sin(t)*Math.cos(a)*rx*f, y + Math.cos(t)*ry*f, z + Math.sin(t)*Math.sin(a)*rz*f)); } P.push(row); }
  for (let v = 0; v < nv; v++) for (let u = 0; u < nu; u++) q4(o, P[v][u], P[v][(u + 1) % nu], P[v + 1][(u + 1) % nu], P[v + 1][u]);
}
// extruded plan polygon [[x, z], ...] from y0 to y1 (walls + top cap, optional bottom)
function triPoly(pts){ return THREE.ShapeUtils.triangulateShape(pts.map(p => new THREE.Vector2(p[0], p[1])), []); }
function capP(o, pts, y, down){ for (const f of triPoly(pts)){ const a = V(pts[f[0]][0], y, pts[f[0]][1]), b = V(pts[f[1]][0], y, pts[f[1]][1]), c = V(pts[f[2]][0], y, pts[f[2]][1]); down ? t3(o, a, c, b) : t3(o, a, b, c); } }
function walls(o, pts, y0, y1, open){ const n = pts.length; for (let i = 0; i < (open ? n - 1 : n); i++){ const a = pts[i], b = pts[(i + 1) % n]; q4(o, V(a[0], y0, a[1]), V(b[0], y0, b[1]), V(b[0], y1, b[1]), V(a[0], y1, a[1])); } }
function prism(o, pts, y0, y1, bot){ walls(o, pts, y0, y1); capP(o, pts, y1); if (bot) capP(o, pts, y0, true); }
// a disc / short cylinder on an arbitrary axis (centre c, unit normal nrm): portholes, wheels, round windows
function disc(o, c, nrm, r, h, n, capOnly){
  let ax = [1, 0, 0]; if (Math.abs(nrm[0]) > 0.9) ax = [0, 0, 1];
  let u = [nrm[1]*ax[2] - nrm[2]*ax[1], nrm[2]*ax[0] - nrm[0]*ax[2], nrm[0]*ax[1] - nrm[1]*ax[0]]; const ul = Math.hypot(...u); u = u.map(q => q/ul);
  const w = [nrm[1]*u[2] - nrm[2]*u[1], nrm[2]*u[0] - nrm[0]*u[2], nrm[0]*u[1] - nrm[1]*u[0]];
  const P = (a, t) => V(c[0] + (Math.cos(a)*u[0] + Math.sin(a)*w[0])*r + nrm[0]*t, c[1] + (Math.cos(a)*u[1] + Math.sin(a)*w[1])*r + nrm[1]*t, c[2] + (Math.cos(a)*u[2] + Math.sin(a)*w[2])*r + nrm[2]*t);
  const top = V(c[0] + nrm[0]*h, c[1] + nrm[1]*h, c[2] + nrm[2]*h);
  for (let i = 0; i < n; i++){ const a = i/n*TAU, b = (i + 1)/n*TAU; if (!capOnly) q4(o, P(a, 0), P(b, 0), P(b, h), P(a, h)); t3(o, top, P(a, h), P(b, h)); }
}
// simple park tree: trunk + 2-3 crown blobs; kind 0 broadleaf, 1 conifer (Monterey cypress / pine: flat layered), 2 eucalyptus (tall)
function tree(B, x, y, z, s, r, kind, cT, cL){
  const o = B.p(cT);
  if (kind === 2){ cyl(o, x, z, 0.35*s, 0.22*s, y - 0.5, y + 9*s, 5); for (let k = 0; k < 3; k++) blob(B.p(cL), x + (r() - 0.5)*3*s, y + (7.5 + k*3.4)*s, z + (r() - 0.5)*3*s, (2.0 - k*0.35)*s, 2.6*s, (1.8 - k*0.3)*s, 6, 4, 0.45, r); return; }
  cyl(o, x, z, 0.3*s, 0.2*s, y - 0.5, y + (kind ? 3 : 3.2)*s, 5);
  if (kind === 1){ for (let k = 0; k < 3; k++){ const a = r()*TAU, d = (k ? 1.4 : 0)*s; blob(B.p(cL), x + Math.cos(a)*d, y + (3.2 + k*1.3)*s, z + Math.sin(a)*d, (3.2 - k*0.6)*s, 1.1*s, (3.0 - k*0.6)*s, 7, 3, 0.25, r); } return; }
  blob(B.p(cL), x, y + 4.6*s, z, 2.8*s, 2.4*s, 2.8*s, 7, 4, 0.3, r); blob(B.p(cL), x + (r() - 0.5)*2*s, y + 6*s, z + (r() - 0.5)*2*s, 1.9*s, 1.7*s, 1.9*s, 6, 3, 0.3, r);
}
const lerp = (a, b, t) => a + (b - a)*t;
const area = P => { let s = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) s += (P[j][0] + P[i][0])*(P[j][1] - P[i][1]); return s/2; };
// windows along every edge of a plan polygon (outward side), a row between y0 and y1
function winRows(o, P, y0, y1, step, w, minL){
  const sg = area(P) > 0 ? 1 : -1;
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < (minL || 3)) continue;
    const tx = (b[0] - a[0])/L, tz = (b[1] - a[1])/L, nx = tz*sg, nz = -tx*sg, n = Math.floor((L - 1)/step);
    for (let k = 0; k < n; k++){ const u = (L - (n - 1)*step)/2 + k*step, cx = a[0] + tx*u + nx*0.06, cz = a[1] + tz*u + nz*0.06; pushT(cx, 0, cz, Math.atan2(tz, tx)); box(o, -w/2, w/2, y0, y1, -0.08, 0.08); popT(); } }
}


// =====================================================================================================================
// California Academy of Sciences (Renzo Piano, 2008): a 161 x 103 m glass pavilion under one flat roof 11 m up, its 2.5-acre
// living roof rising into seven green hills — the two big domes over the Rainforest sphere (south-west) and the Morrison
// Planetarium (north-east), two more steep domes and three gentle swells — dotted with round porthole skylights; the
// glass-roofed central piazza between the big domes; a perimeter canopy of glass with photovoltaic cells on slender white
// columns, deepest over the entrance porch facing the Music Concourse (north-west, local -z). Plan from the OSM outline
// (the notched-corner rectangle), turned 41.8 degrees. Night: the glass walls glow from inside, a soft warm uplight.
// =====================================================================================================================
{
const K = 'sfacademy', F = 77.0, RT = F + 10.7;           // floor level and roof (canopy) top, absolute metres
const XE = 78, ZF = -51, ZB = 52, XS = 80.5, ZS = 48.3;  // canopy edges (long sides at z = ZF / ZB, short sides at x = +-XS)
const GL = {c:'#62798a', glow:'#ffd9a8', gk:0.55, lk:0.35}, MUL = '#e9ecea', PV = {c:'#4d5a69', lk:0.1}, SOF = '#dcdfdb', FAS = '#f3f4f1';
const G1 = {c:'#6b8c47', lk:0.12}, G2 = {c:'#7a9850', lk:0.12}, G3 = {c:'#5d7d40', lk:0.12}, PG = {c:'#26313b', glow:'#ffe2b0', gk:0.28}, RIM = '#c9cdca';
const PZ = {c:'#a8c0c8', op:0.6, glow:'#fff0d2', gk:0.3}, STN = '#b9b1a2', PAV = '#cbc6ba', INF = '#6a6760', STL = '#565c60';
// the seven hills: [x, z, radius, height]
const HILLS = [[-32, -2, 18.5, 12.5], [32, -2, 18.5, 12.5], [-58, 22, 11.5, 7.5], [57, -22, 11.5, 7.5], [-55, -26, 13, 4.2], [56, 27, 13, 4.0], [3, 33, 12, 3.2]];
const PZX = 13.5, PZZ0 = -17, PZZ1 = 15;                 // the piazza's glass roof
const RX0 = -75, RX1 = 75, RZ0 = -41, RZ1 = 48.5;     // the planted roof
const hillH = (x, z) => { let h = 0; for (const [hx, hz, R, H] of HILLS){ const d = Math.hypot(x - hx, z - hz)/R; if (d < 1) h += H*Math.pow(1 - d*d, 1.5); } return h; };
const roofY = (x, z) => RT + 0.25 + hillH(x, z);
LANDMARKS.sfacademy = {zh:'加州科学院', en:'California Academy of Sciences', cat:'new', r:PL[K][3], h:24, lt:{m:0, c:'#ffe2bc', k:0.35, e:0.3},
  build(){
    const g = new THREE.Group(), s = frame(g, K), B = mkB(), r = LMCTX.rng, gy = (x, z) => gl(K, x, z);
    // canopy outline with the notched corners
    const CAN = [[-XE, ZF], [XE - 1, ZF], [XE - 1, -ZS], [XS, -ZS], [XS, ZS], [XE - 1, ZS], [XE - 1, ZB], [-XE, ZB], [-XE, ZS], [-XS, ZS], [-XS, -ZS], [-XE, -ZS]];
    // glass walls (inset under the canopy; the entrance porch on the concourse side is the deepest)
    const WX = 74, WZ0 = -41, WZ1 = 47.5;
    const lowest = -1.5 + Math.min(glo(K, -XE, ZF), glo(K, XE, ZF), glo(K, -XE, ZB), glo(K, XE, ZB), glo(K, 0, ZF), glo(K, 0, ZB), glo(K, -XS, 0), glo(K, XS, 0), gy(-XE, ZF), gy(XE, ZF), gy(-XE, ZB), gy(XE, ZB), gy(0, ZF), gy(0, ZB), gy(-XS, 0), gy(XS, 0));
    // podium / paving: the porch floor all round, stepping down to the park where the ground falls away
    prism(B.p(STN), CAN, lowest - 2, F - 0.25); capP(B.p(PAV), CAN, F - 0.2);
    for (let i = 0; i < 6; i++){ const z = ZF - 0.4 - i*0.45; if (F - 0.25 - (i + 1)*0.16 < gy(0, z) - 0.2) break; box(B.p(PAV), -22, 22, lowest - 1, F - 0.25 - (i + 1)*0.16, z - 0.45, z); }
    // the glass box: mullions every 3 m, transoms
    const WALL = [[-WX, WZ0], [WX, WZ0], [WX, WZ1], [-WX, WZ1]];
    walls(B.p(GL), WALL, F - 0.2, RT - 0.6);
    { const o = B.p(MUL);
      for (let i = 0; i < 4; i++){ const a = WALL[i], b = WALL[(i + 1) % 4], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(L/3);
        for (let k = 0; k <= n; k++){ const t = k/n, x = lerp(a[0], b[0], t), z = lerp(a[1], b[1], t); bc(o, x, F - 0.2, z, 0.22, RT - 0.4 - F, 0.22); }
        for (const y of [F + 3.6, F + 7.2]){ const nx = (b[1] - a[1])/L, nz = -(b[0] - a[0])/L; obox(o, (a[0] + b[0])/2 + nx*0.05, (a[1] + b[1])/2 + nz*0.05, L, 0.18, y, y + 0.16, Math.atan2(b[1] - a[1], b[0] - a[0])); } }
      // entrance doors: a darker frame band at the centre of the concourse front
      box(o, -9, 9, F + 3.3, F + 3.6, WZ0 - 0.25, WZ0 - 0.05); }
    // a few solid, stone-clad bays at the back (service side)
    for (const x of [-60, -36, 20, 46]) box(B.p(STN), x, x + 12, F - 0.2, RT - 0.6, WZ1 - 0.1, WZ1 + 0.35);
    // interior hints seen through the glass: floor, a mezzanine edge, the two spheres' lower parts
    { const o = B.p(INF); box(o, -WX + 0.5, WX - 0.5, F - 0.2, F + 0.02, WZ0 + 0.5, WZ1 - 0.5); box(o, -WX + 1, -20, F + 4.6, F + 5.0, WZ0 + 1, WZ0 + 6); box(o, 20, WX - 1, F + 4.6, F + 5.0, WZ0 + 1, WZ0 + 6);
      lathe(o, -32, -2, [[0, F], [9, F + 1.5], [12.6, F + 5.5], [13.5, F + 9]], 16);
      lathe(o, 32, -2, [[0, F], [9, F + 1.5], [12.6, F + 5.5], [13.5, F + 9]], 16); }
    // slender white columns along the canopy edges
    { const o = B.p(FAS);
      for (let x = -72; x <= 72.1; x += 9){ cyl(o, x, ZF + 1.2, 0.22, 0.22, F - 0.25, RT - 0.6, 6); cyl(o, x, ZB - 1.2, 0.22, 0.22, F - 0.25, RT - 0.6, 6); }
      for (let z = -40; z <= 40.1; z += 10){ cyl(o, -XS + 1.2, z, 0.22, 0.22, F - 0.25, RT - 0.6, 6); cyl(o, XS - 1.2, z, 0.22, 0.22, F - 0.25, RT - 0.6, 6); } }
    // the roof slab: white soffit, a thin bright fascia, the PV glass band on top round the planted roof
    capP(B.p(SOF), CAN, RT - 0.6, true); walls(B.p(FAS), CAN, RT - 0.6, RT + 0.05);
    { const o = B.p(PV), IN = [[RX0, RZ0], [RX1, RZ0], [RX1, RZ1], [RX0, RZ1]];
      // band = canopy minus the planted rectangle
      const tri = THREE.ShapeUtils.triangulateShape(CAN.map(p => new THREE.Vector2(p[0], p[1])), [IN.slice().reverse().map(p => new THREE.Vector2(p[0], p[1]))]), all = CAN.concat(IN.slice().reverse());
      for (const f of tri) t3(o, V(all[f[0]][0], RT + 0.05, all[f[0]][1]), V(all[f[1]][0], RT + 0.05, all[f[1]][1]), V(all[f[2]][0], RT + 0.05, all[f[2]][1]));
      // the cells' grid: thin light lines over the dark glass
      const ol = B.p(RIM);
      for (let x = -XE + 2; x < XE - 1; x += 4){ box(ol, x, x + 0.12, RT + 0.05, RT + 0.1, ZF + 0.3, RZ0 - 0.3); box(ol, x, x + 0.12, RT + 0.05, RT + 0.1, RZ1 + 0.3, ZB - 0.3); }
      for (let z = -ZS + 2; z < ZS; z += 4){ box(ol, -XS + 0.3, RX0 - 0.3, RT + 0.05, RT + 0.1, z, z + 0.12); box(ol, RX1 + 0.3, XS - 0.3, RT + 0.05, RT + 0.1, z, z + 0.12); }
      walls(B.p(RIM), IN, RT + 0.05, RT + 0.45); }
    // the living roof: a heightfield of three greens, the piazza left open
    { const S = 1.5, nx = Math.round((RX1 - RX0)/S), nz = Math.round((RZ1 - RZ0)/S), sx = (RX1 - RX0)/nx, sz = (RZ1 - RZ0)/nz, GC = [G1, G2, G3];
      for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++){ const x0 = RX0 + i*sx, x1 = x0 + sx, z0 = RZ0 + j*sz, z1 = z0 + sz, xm = (x0 + x1)/2, zm = (z0 + z1)/2;
        if (Math.abs(xm) < PZX && zm > PZZ0 && zm < PZZ1) continue;
        const n = Math.sin(xm*0.21 + Math.sin(zm*0.17)*2.1) + Math.sin(zm*0.29 - xm*0.07)*0.8 + (r() - 0.5)*0.9, c = GC[n > 0.55 ? 1 : n < -0.6 ? 2 : 0];
        q4(B.p(c), V(x0, roofY(x0, z0), z0), V(x0, roofY(x0, z1), z1), V(x1, roofY(x1, z1), z1), V(x1, roofY(x1, z0), z0)); } }
    // porthole skylights on the domes (rings round the four steep hills, a few on the gentle ones)
    { const pg = B.p(PG), rim = B.p(RIM);
      const put = (x, z, rr) => { const e = 0.6, hx = (roofY(x + e, z) - roofY(x - e, z))/(2*e), hz = (roofY(x, z + e) - roofY(x, z - e))/(2*e), L = Math.hypot(hx, 1, hz), n = [-hx/L, 1/L, -hz/L], y = roofY(x, z);
        disc(rim, [x, y - 0.15, z], n, rr + 0.18, 0.35, 10); disc(pg, [x + n[0]*0.36, y - 0.15 + n[1]*0.36, z + n[2]*0.36], n, rr, 0.06, 10, true); };
      for (const [hx, hz, nr] of [[-32, -2, [0, 4.5, 8.5, 12.5]], [32, -2, [0, 4.5, 8.5, 12.5]], [-58, 22, [0, 4.5, 8.5]], [57, -22, [0, 4.5, 8.5]], [-55, -26, [5, 9]], [56, 27, [5, 9]], [3, 33, [6]]])
        for (const d of nr){ const m = d ? Math.round(d*0.95) : 1; for (let k = 0; k < m; k++){ const a = k/m*TAU + d*0.3; put(hx + Math.cos(a)*d, hz + Math.sin(a)*d, d > 10 ? 0.7 : 0.85); } } }
    // the piazza: a gently domed glass lens on a steel grid, the courtyard floor below
    { const o = B.p(PZ), st = B.p(STL), py = (x, z) => RT + 0.4 + 1.6*Math.cos(x/PZX*PI/2)*Math.cos(((z - (PZZ0 + PZZ1)/2)/((PZZ1 - PZZ0)/2))*PI/2);
      const nx = 9, nz = 10;
      for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++){ const x0 = -PZX + i*2*PZX/nx, x1 = x0 + 2*PZX/nx, z0 = PZZ0 + j*(PZZ1 - PZZ0)/nz, z1 = z0 + (PZZ1 - PZZ0)/nz;
        q4(o, V(x0, py(x0, z0), z0), V(x0, py(x0, z1), z1), V(x1, py(x1, z1), z1), V(x1, py(x1, z0), z0));
        beam(st, [x0, py(x0, z0) + 0.05, z0], [x1, py(x1, z0) + 0.05, z0], 0.07); beam(st, [x0, py(x0, z0) + 0.05, z0], [x0, py(x0, z1) + 0.05, z1], 0.07); }
      walls(B.p(RIM), [[-PZX, PZZ0], [PZX, PZZ0], [PZX, PZZ1], [-PZX, PZZ1]], RT - 0.2, RT + 0.6);
      walls(B.p(GL), [[-PZX, PZZ0], [PZX, PZZ0], [PZX, PZZ1], [-PZX, PZZ1]], F, RT - 0.2);
      box(B.p(PAV), -PZX, PZX, F, F + 0.05, PZZ0, PZZ1);
      for (let k = 0; k < 4; k++) tree(B, -8 + k*5.3, F, -6 + (k % 2)*9, 0.8, r, 0, STL, G3); }
    // landscaping round the base: lawn edges and a few park trees off the corners (inside the plan only)
    for (const [x, z] of [[-76, -46], [76, -46], [-76, 46], [76, 46]]) blob(B.p(G3), x, Math.max(gy(x, z), F - 0.3) + 0.4, z, 1.6, 0.8, 1.6, 6, 3);
    B.flush(s);
    return g; }};
place(K);
}


// =====================================================================================================================
// Spreckels Temple of Music (Reid & Reid, 1900): the Colusa-sandstone bandshell at the south-west end of the Music Concourse,
// facing north-east down the concourse (local -z). The central pavilion: a raised stage under a great round arch with a
// coffered half-dome shell, paired Corinthian columns on pedestals either side, a full entablature, a tall attic with the two
// relief panels and a stepped crowning block (~22 m); colonnaded wings left and right (Ionic columns, entablature and
// balustrade) ending in solid end piers. Plan from the OSM outline (the cross-shaped footprint, axis turned 48 degrees).
// Night: warm floodlight.
// =====================================================================================================================
{
const K = 'sfbandshell', F = 74.3;
const SA = {c:'#cbbd9e', lk:1.0}, SA2 = '#ae9f82', SA3 = {c:'#ddd2b8', lk:1.0}, DK = '#5b5246', STG = '#8b7a62', STP = '#bfb6a3';
LANDMARKS.sfbandshell = {zh:'斯普雷克尔斯音乐殿', en:'Spreckels Temple of Music', cat:'old', r:PL[K][3], h:24, lt:{m:0, c:'#ffd9a6', k:0.8, e:0.35, anim:'breathe'},
  build(){
    const g = new THREE.Group(), s = frame(g, K), B = mkB(), gy = (x, z) => gl(K, x, z), r = LMCTX.rng;
    const XC = -0.15, lo = Math.min(glo(K, -28, 3), glo(K, 26, 3), glo(K, 0, 13.8), glo(K, 0, -6.3), glo(K, 0, 0)) - 1.5, ST = F + 1.6;
    const sa = B.p(SA), sa2 = B.p(SA2), sa3 = B.p(SA3);
    // ---- the central pavilion block (x -9 .. 8.7, z -3.4 .. 13.8)
    const X0 = -9, X1 = 8.7, ZF = -3.4, ZK = 13.8, AW = 6.5, AS = ST + 8.6, AT = AS + AW;     // arch half-width, springing, crown
    box(sa2, X0, X1, lo, ST, -6.3, ZK);                                        // the stage podium
    box(B.p(STG), X0 + 0.6, X1 - 0.6, ST, ST + 0.05, -6.1, 6);                 // stage floor
    for (let i = 0; i < 6; i++) box(B.p(STP), XC - 7, XC + 7, lo, ST - 0.27*(i + 1), -6.3 - 0.35*(i + 1), -6.3 - 0.35*i);  // steps down to the concourse
    // the shell: semicircular apse walls + coffered quarter-sphere, inner face lighter
    { const cz = 2.6, o = B.p(SA3), n = 14;
      for (let i = 0; i < n; i++){ const a0 = PI*i/n, a1 = PI*(i + 1)/n, p0 = [XC - Math.cos(a0)*AW, cz + Math.sin(a0)*AW], p1 = [XC - Math.cos(a1)*AW, cz + Math.sin(a1)*AW];
        q4(o, V(p0[0], ST, p0[1]), V(p1[0], ST, p1[1]), V(p1[0], AS, p1[1]), V(p0[0], AS, p0[1]));
        for (let k = 0; k < 6; k++){ const b0 = PI/2*k/6, b1 = PI/2*(k + 1)/6, P = (a, b) => V(XC - Math.cos(a)*Math.cos(b)*AW, AS + Math.sin(b)*AW, cz + Math.sin(a)*Math.cos(b)*AW);
          q4((i + k) % 2 ? o : sa, P(a0, b0), P(a1, b0), P(a1, b1), P(a0, b1)); } }
      // the barrel between the apse and the front arch
      for (let i = 0; i < n; i++){ const a0 = PI*i/n, a1 = PI*(i + 1)/n, P = (a, z) => V(XC - Math.cos(a)*AW, AS + Math.sin(a)*AW, z);
        q4(i % 2 ? o : sa, P(a0, ZF), P(a1, ZF), P(a1, cz), P(a0, cz)); }
      walls(o, [[XC - AW, ZF], [XC - AW, cz]], ST, AS, true); walls(o, [[XC + AW, cz], [XC + AW, ZF]], ST, AS, true);
      // the block's mass round the shell: side piers, back, attic
      box(sa, X0, XC - AW, ST, AT + 1.2, ZF, ZK); box(sa, XC + AW, X1, ST, AT + 1.2, ZF, ZK); box(sa, XC - AW, XC + AW, ST, AT + 1.2, cz + AW, ZK);
      { const P = []; for (let i = 0; i <= 12; i++){ const a = PI*i/12; P.push([XC - Math.cos(a)*AW, AS + Math.sin(a)*AW]); }
        // spandrel / attic over the arch: front face with the arch cut out
        const Q = [[XC - AW, AS], ...P, [XC + AW, AS], [XC + AW, AT + 1.2], [XC - AW, AT + 1.2]];
        for (const f of triPoly(Q)) t3(sa, V(Q[f[0]][0], Q[f[0]][1], ZF), V(Q[f[1]][0], Q[f[1]][1], ZF), V(Q[f[2]][0], Q[f[2]][1], ZF));
        box(sa, XC - AW, XC + AW, AT, AT + 1.2, ZF, cz + AW);
        // archivolt: a moulded band round the arch
        for (let i = 0; i < 12; i++) beam(sa3, [P[i][0], P[i][1], ZF - 0.25], [P[i + 1][0], P[i + 1][1], ZF - 0.25], 0.35, 0.3);
        bc(sa3, XC, AT - 0.9, ZF - 0.3, 1.0, 1.6, 0.6); }                       // keystone
    }
    // paired Corinthian columns on pedestals either side of the arch, entablature, attic, cornice, crowning block
    { const EY = AT + 1.2;
      for (const sx of [-1, 1]){ const xc = sx < 0 ? (X0 + XC - AW)/2 : (X1 + XC + AW)/2;
        for (const dx of [-0.72, 0.72]){ const x = xc + dx; bc(sa, x, ST, ZF - 0.9, 1.35, 1.8, 1.35); cyl(sa3, x, ZF - 0.9, 0.5, 0.42, ST + 1.8, EY - 1.3, 10); box(sa3, x - 0.7, x + 0.7, EY - 1.3, EY - 0.05, ZF - 1.6, ZF - 0.2); bc(sa, x, ST + 1.8, ZF - 0.9, 1.15, 0.4, 1.15); } }
      // entablature over the columns and across the front, then the attic and cornice
      box(sa, X0 - 0.2, X1 + 0.2, EY - 0.05, EY + 1.4, ZF - 1.8, ZK + 0.2); box(sa3, X0 - 0.5, X1 + 0.5, EY + 1.4, EY + 1.95, ZF - 2.1, ZK + 0.5);
      box(sa, X0 + 0.3, X1 - 0.3, EY + 1.95, EY + 5.2, ZF - 0.8, ZK - 0.3);                        // attic
      for (const sx of [-1, 1]) box(sa3, XC + sx*4.6 - 2.4, XC + sx*4.6 + 2.4, EY + 2.5, EY + 4.6, ZF - 1.0, ZF - 0.75);   // relief panels
      for (const sx of [-1, 1]) box(sa2, XC + sx*4.6 - 1.9, XC + sx*4.6 + 1.9, EY + 2.8, EY + 4.3, ZF - 1.05, ZF - 0.95);
      box(sa3, X0, X1, EY + 5.2, EY + 5.8, ZF - 1.2, ZK + 0.1);                                    // cornice
      box(sa, XC - 5.2, XC + 5.2, EY + 5.8, EY + 7.0, ZF - 0.4, ZK - 2);                            // stepped crown
      box(sa3, XC - 3.6, XC + 3.6, EY + 7.0, EY + 7.6, ZF - 0.5, ZK - 3);
      for (const sx of [-1, 1]) cyl(sa3, XC + sx*7.4, ZF - 0.4, 0.55, 0.3, EY + 5.8, EY + 7.0, 8, true);   // urns on the corners
    }
    // ---- the colonnaded wings (x -28.1 .. -9 and 8.7 .. 26.2, z -3.5 .. 3.2)
    for (const [xa, xb] of [[-28.1, -9], [8.7, 26.2]]){ const WY = F + 0.9, EY2 = WY + 7.2, zf = -3.5, zb = 3.2;
      box(sa2, xa, xb, lo, WY, zf, zb); box(sa, xa, xb, WY, EY2, zb - 1.2, zb);                       // podium, back wall
      const outer = xa < 0 ? xa : xb, ex0 = xa < 0 ? xa : xb - 3, ex1 = xa < 0 ? xa + 3 : xb;
      box(sa, ex0, ex1, WY, EY2 + 1.3, zf, zb);                                                         // end pier
      bc(sa2, (ex0 + ex1)/2, WY + 1.5, zf - 0.02, 1.4, 3.8, 0.1);                                      // its niche
      const c0 = xa < 0 ? xa + 4.2 : xa + 1.4, c1 = xa < 0 ? xb - 1.4 : xb - 4.2, n = 7;
      for (let i = 0; i < n; i++){ const x = c0 + (c1 - c0)*i/(n - 1); cyl(sa3, x, zf + 0.9, 0.34, 0.29, WY + 0.4, EY2 - 0.6, 8); bc(sa, x, WY, zf + 0.9, 0.9, 0.4, 0.9); bc(sa3, x, EY2 - 0.6, zf + 0.9, 0.95, 0.6, 0.95); }
      box(sa, xa, xb, EY2, EY2 + 1.1, zf, zb); box(sa3, xa - 0.1, xb + 0.1, EY2 + 1.1, EY2 + 1.4, zf - 0.25, zb + 0.15);   // entablature + cornice
      // balustrade: plinth, balusters, rail
      box(sa, xa + 0.2, xb - 0.2, EY2 + 1.4, EY2 + 1.65, zf, zf + 0.5);
      for (let x = xa + 0.6; x < xb - 0.4; x += 0.42) cyl(sa3, x, zf + 0.25, 0.1, 0.13, EY2 + 1.65, EY2 + 2.35, 5);
      box(sa, xa + 0.2, xb - 0.2, EY2 + 2.35, EY2 + 2.55, zf - 0.05, zf + 0.55);
      box(sa2, xa + 0.3, xb - 0.3, WY, WY + 0.06, zf + 0.2, zb - 1.2);                                 // colonnade floor
      // shadowed back wall with blind arches
      for (let i = 0; i < n - 1; i++){ const x = c0 + (c1 - c0)*(i + 0.5)/(n - 1); bc(B.p(DK), x, WY + 0.6, zb - 1.25, 1.5, 4.6, 0.05); }
    }
    // a few plane trees of the concourse bosque in front (pollarded, low)
    for (const [x, z] of [[-24, -14], [-12, -16], [12, -16], [24, -14]]) { const y = gm(K, x, z); cyl(B.p('#6a5b4a'), x, z, 0.3, 0.22, y - 0.5, y + 3.2, 5); blob(B.p({c:'#5f7a42', lk:0.3}), x, y + 4.4, z, 2.3, 1.5, 2.3, 7, 3, 0.25, r); }
    B.flush(s);
    return g; }};
place(K);
}


// =====================================================================================================================
// The Golden Gate Park windmills at Ocean Beach, both smock mills turned to the ocean wind (sails on the west, local -x):
// - sfwindmill: the Dutch Windmill (1903, north): ~23 m, a tapering octagonal tower of dark-brown wood shingles with white
//   trim on a low brick base, a boat-shaped shingled cap, four lattice sails spanning ~31 m; the round plinth of the Queen
//   Wilhelmina Tulip Garden's lawn at its foot (the OSM circle).
// - sfwindmill2: the Murphy Windmill (1908, south): ~29 m, the largest — a two-storey concrete base with the reefing stage
//   (gallery) round it (the OSM octagon), the slate-clad octagonal tower, the restored copper dome cap, sails spanning ~35 m;
//   the Millwright's Cottage (1909) beside it. Night: soft warm floodlight.
// =====================================================================================================================
{
// generic smock mill. o = {base:[r, h], tower:[r0, r1, h1], cap:'boat'|'dome', capH, hub (height), R (sail radius), sw (sail width), stage:[r, y]}
function smockMill(B, gy0, o, col, r){
  const BR = B.p(col.base), SH = B.p(col.tower), TR = B.p(col.trim), CP = B.p(col.cap), SL = B.p(col.sail), ST = B.p(col.stock), DK = B.p(col.dark);
  const [rb, hb] = o.base, [t0, t1, ht] = o.tower, y0 = gy0, y1 = y0 + hb, y2 = y1 + ht, a8 = PI/8;
  // base (octagonal) down into the ground
  cyl(BR, 0, 0, rb, rb, y0 - 3, y1, 8, true, a8);
  for (let i = 0; i < 8; i++){ const a = i/8*TAU + a8 + PI/8, x = Math.cos(a)*(rb + 0.02), z = Math.sin(a)*(rb + 0.02);       // doors / windows in the base
    if (i % 2 === 0){ pushT(x, 0, z, a + PI/2); box(DK, -0.7, 0.7, y0, y0 + (i === 4 ? 2.6 : 1.4) + (i === 4 ? 0 : 0.9), -0.05, 0.08); popT(); } }
  // the shingled tower: 8 tapering faces + horizontal shingle courses + white corner posts + windows
  lathe(SH, 0, 0, [[t0, y1], [t1, y2]], 8, a8);
  for (let y = y1 + 1.0; y < y2 - 0.3; y += 1.1){ const t = (y - y1)/ht, rr = t0 + (t1 - t0)*t + 0.04; cyl(B.p(col.tower2), 0, 0, rr + 0.05, rr, y, y + 0.12, 8, false, a8); }
  for (let i = 0; i < 8; i++){ const a = i/8*TAU + a8; beam(TR, [Math.cos(a)*(t0 + 0.05), y1, Math.sin(a)*(t0 + 0.05)], [Math.cos(a)*(t1 + 0.05), y2, Math.sin(a)*(t1 + 0.05)], 0.14); }
  for (const f of [0.28, 0.55, 0.8]) for (let i = 0; i < 8; i += 2){ const a = i/8*TAU + a8 + PI/8 + (f > 0.5 ? PI/4 : 0), y = y1 + ht*f, rr = t0 + (t1 - t0)*f + 0.1, x = Math.cos(a)*rr, z = Math.sin(a)*rr;
    pushT(x, 0, z, a + PI/2); box(TR, -0.55, 0.55, y - 0.75, y + 0.75, -0.05, 0.1); box(DK, -0.4, 0.4, y - 0.6, y + 0.6, 0.0, 0.14); popT(); }
  cyl(TR, 0, 0, t1 + 0.25, t1 + 0.25, y2 - 0.2, y2 + 0.15, 8, false, a8);                        // the curb under the cap
  // the stage (gallery) on posts with railing
  if (o.stage){ const [rs, ys] = o.stage; const yy = y0 + ys;
    lathe(B.p(col.stage), 0, 0, [[t0 + (t1 - t0)*((yy - y1)/ht), yy], [rs, yy], [rs, yy + 0.25]], 8, a8);
    for (let i = 0; i < 16; i++){ const a = i/16*TAU, x = Math.cos(a)*(rs - 0.3), z = Math.sin(a)*(rs - 0.3); beam(B.p(col.stage), [x, yy, z], [x*0.55, yy - 2.8, z*0.55], 0.12); }
    cyl(TR, 0, 0, rs, rs, yy + 1.05, yy + 1.15, 16); for (let i = 0; i < 32; i++){ const a = i/32*TAU; bc(TR, Math.cos(a)*rs, yy, Math.sin(a)*rs, 0.08, 1.1, 0.08); } }
  // the cap
  const yc = y2 + 0.15, ch = o.capH;
  if (o.cap === 'dome'){ lathe(CP, 0, 0, [[t1 + 0.5, yc], [t1 + 0.55, yc + 0.5], [t1 + 0.3, yc + ch*0.45], [(t1 + 0.3)*0.7, yc + ch*0.8], [(t1 + 0.3)*0.3, yc + ch*0.97], [0, yc + ch]], 12);
    cyl(TR, 0, 0, 0.15, 0.05, yc + ch, yc + ch + 1.2, 6, true); }
  else { // boat-shaped: a gabled hood, long axis along the windshaft (x), rounded tail
    const L = t1*2 + 2.4, W = t1*2 + 0.9; pushT(0, 0, 0, 0);
    const P = (x, y, z) => V(x, y, z), half = W/2, rid = yc + ch;
    for (let i = 0; i < 8; i++){ const x0 = -L/2 + L*i/8, x1 = x0 + L/8, f = x => 1 - Math.pow(Math.abs(x)/(L/2), 4)*0.35, h0 = f(x0), h1 = f(x1);
      q4(CP, P(x0, yc, -half*h0), P(x1, yc, -half*h1), P(x1, yc + ch*h1, 0), P(x0, yc + ch*h0, 0)); q4(CP, P(x0, yc, half*h0), P(x1, yc, half*h1), P(x1, yc + ch*h1, 0), P(x0, yc + ch*h0, 0)); }
    for (const sx of [-1, 1]){ const x = sx*L/2, h = 1 - 0.35; t3(CP, P(x, yc, -half*h), P(x, yc, half*h), P(x, yc + ch*h, 0)); }
    box(TR, -L/2 - 0.1, -L/2 + 0.3, yc, yc + ch*0.5, -0.9, 0.9);            // the white "beard" board at the front
    popT(); }
  // windshaft, hub and the four lattice sails in front of the cap (plane x = xs), tilted back 8 degrees
  const hy = y0 + o.hub, xs = -(t1 + (o.cap === 'dome' ? 1.4 : 1.8)), R = o.R, sw = o.sw, tilt = 0.14, ang0 = o.ang || 0.35;
  beam(ST, [xs + 0.2, hy, 0], [0.5, hy - 0.25, 0], 0.32);
  for (let k = 0; k < 4; k++){ const a = ang0 + k*PI/2, ca = Math.cos(a), sa = Math.sin(a), d = k % 2 ? 0.25 : -0.25;
    const pt = (s, w) => { const yy = hy + sa*s - ca*w, zz = ca*s + sa*w; return [xs + d - (yy - hy)*Math.sin(tilt), yy, zz]; };
    beam(ST, pt(-0.3, 0), pt(R, 0), 0.26, 0.26);                                          // the stock (whip)
    const s0 = R*0.17, n = Math.round((R - s0)/0.55);
    beam(SL, pt(s0, sw), pt(R, sw), 0.07); beam(SL, pt(s0, sw*0.5), pt(R, sw*0.5), 0.05); beam(SL, pt(s0, -0.35), pt(R, -0.35), 0.06);
    for (let i = 0; i <= n; i++){ const s = s0 + (R - s0)*i/n; beam(SL, pt(s, -0.4), pt(s, sw), 0.06); }
    beam(SL, pt(s0, sw), pt(s0, -0.4), 0.08); }
  disc(ST, [xs - 0.6, hy, 0], [-1, 0, 0], 0.7, 0.5, 8);
}
const WM = {base:'#8a7a6a', tower:'#5b4535', tower2:'#4c392c', trim:'#ece9e0', cap:'#4b3b2f', sail:'#e6e2d6', stock:'#6b4a33', dark:'#2e2a26', stage:'#6e5a46'};
LANDMARKS.sfwindmill = {zh:'荷兰风车', en:'Dutch Windmill', cat:'old', r:PL.sfwindmill[3], h:25, lt:{m:0, c:'#ffd8a8', k:0.55, e:0.3},
  build(){
    const g = new THREE.Group(), s = frame(g, 'sfwindmill'), B = mkB(), r = LMCTX.rng, gy = (x, z) => gl('sfwindmill', x, z), G = Math.max(gy(0, 0), gy(-6, 0), gy(6, 0), gy(0, 6), gy(0, -6));
    // the round lawn terrace of the tulip garden (the OSM circle, r 9.1) with a low stone edge
    cyl(B.p('#9b9284'), 0, 0, 9.1, 9.1, G - 2.5, G + 0.35, 24, false); lathe(B.p({c:'#5f8a3f', lk:0.15}), 0, 0, [[0, G + 0.4], [9.0, G + 0.35]], 24);
    // tulip beds: rings of colour round the foot (red, yellow, pink-white)
    for (let i = 0; i < 18; i++){ const a = i/18*TAU, c = ['#c8302a', '#e8c23a', '#e9a8b8'][i % 3]; obox(B.p(c), Math.cos(a)*7.6, Math.sin(a)*7.6, 2.0, 1.0, G + 0.35, G + 0.6, a + PI/2); }
    smockMill(B, G + 0.35, {base:[6.0, 3.4], tower:[5.4, 3.1, 14.3], cap:'boat', capH:3.4, hub:19.4, R:15.4, sw:2.3, ang:0.3}, WM, r);
    B.flush(s); return g; }};
place('sfwindmill');
const MM = {base:'#cfcac0', tower:'#5d5650', tower2:'#4e4843', trim:'#efece4', cap:{c:'#9b5d3b', lk:0.6}, sail:'#e4e0d4', stock:'#5a4535', dark:'#2e2a26', stage:'#6b5a49'};
LANDMARKS.sfwindmill2 = {zh:'墨菲风车', en:'Murphy Windmill', cat:'old', r:PL.sfwindmill2[3], h:31, lt:{m:0, c:'#ffd8a8', k:0.55, e:0.3},
  build(){
    const g = new THREE.Group(), s = frame(g, 'sfwindmill2'), B = mkB(), r = LMCTX.rng, gy = (x, z) => gl('sfwindmill2', x, z), G = Math.max(gy(0, 0), gy(-8, 0), gy(8, 0), gy(0, 8), gy(0, -8));
    pushT(0, 0, 0, 0.05);                                                                       // the octagon is turned ~3 degrees
    smockMill(B, G, {base:[9.6, 6.6], tower:[7.0, 4.0, 15.6], cap:'dome', capH:5.6, hub:24.4, R:17.4, sw:2.7, stage:[11.4, 6.6], ang:0.5}, MM, r);
    popT();
    // the Millwright's Cottage (1909): a 1.5-storey shingled house with a steep gable roof and a brick chimney
    { const cx = 21.6, cz = -19.1, th = 0.904, y = Math.max(gy(cx, cz), gy(cx + 5, cz - 5)), o = B.p('#8a6b52'), rf = B.p('#4a3c33');
      pushT(cx, 0, cz, th); box(o, -6.3, 6.3, y - 1.5, y + 3.6, -3.8, 3.8); gable(g, 0, 0, 0, 0, 0, 0, '#000');
      const P = (x, yy, z) => V(x, yy, z); q4(rf, P(-6.6, y + 3.6, -4.1), P(6.6, y + 3.6, -4.1), P(6.6, y + 6.6, 0), P(-6.6, y + 6.6, 0)); q4(rf, P(-6.6, y + 3.6, 4.1), P(6.6, y + 3.6, 4.1), P(6.6, y + 6.6, 0), P(-6.6, y + 6.6, 0));
      for (const sx of [-1, 1]) t3(o, P(sx*6.3, y + 3.6, -3.8), P(sx*6.3, y + 3.6, 3.8), P(sx*6.3, y + 6.4, 0));
      box(B.p('#8d4a3a'), 3.2, 4.2, y + 4.5, y + 7.6, -1.2, -0.2);
      for (const x of [-4, -1.2, 1.6, 4.4]) for (const sz of [-1, 1]) box(B.p('#ece9e0'), x - 0.55, x + 0.55, y + 0.9, y + 2.5, sz*3.8 - 0.06, sz*3.8 + 0.06);
      popT(); }
    // a few Monterey cypresses of the park behind (east), low and wind-shaped
    for (const [x, z] of [[24, 8], [30, 0]]) tree(B, x, gm('sfwindmill2', x, z), z, 1.2, r, 1, '#4f4033', {c:'#3f5a36', lk:0.2});
    B.flush(s); return g; }};
place('sfwindmill2');
}


// =====================================================================================================================
// Japanese Tea Garden (1894, Golden Gate Park): the vermilion five-storey pagoda (from the 1915 Panama-Pacific Exposition)
// with its bronze finial, the red Temple Gate before it, the wooden main gate on Hagiwara Tea Garden Drive and the south
// gate, the open tea house and the gift shop, the steep drum bridge (taiko-bashi) over the koi pond, the seated bronze
// Buddha, the Peace Lantern and smaller stone lanterns, the raked-gravel zen garden, the stone paths (the OSM paths) and the
// garden's pines, maples and cherries — every part on the app's ground (the garden falls ~14 m from south to north).
// Plan in the reference frame of the OSM footprints (rot 0, x east, z south). Night: lanterns and a soft warm uplight.
// =====================================================================================================================
{
const K = 'sfteagarden';
const RED = {c:'#b9442d', lk:0.9}, ROOF = '#3c423f', WOOD = '#8c6a4a', STONE = '#9d998f', BRZ = '#5b503c', GOLD = {c:'#a0703f', lk:1.0};
const WAT = {c:'#3d6b66', lk:0.05}, PATH = '#b7af9e', TRK = '#5a4636', PINE = {c:'#33502e', lk:0.2}, MAPLE = {c:'#a5452e', lk:0.2}, LEAF = {c:'#52733b', lk:0.2};
const CHER = {c:'#e7b6c2', lk:0.25}, GRAV = '#d8d2c4', LAMP = {c:'#efe3c4', glow:'#ffcf86', gk:1.2};
const PATHS = [[[65,-40],[72,-42],[77,-38]],[[28,-13],[43,-18],[43,-25],[54,-32],[65,-40],[64,-45],[67,-51],[72,-50],[77,-38],[82,-32]],[[10,24],[8,22],[15,8],[-2,0],[-12,-14]],[[-9,-8],[-12,-2],[-12,8],[-16,16],[-20,19],[-26,17],[-29,11],[-25,2],[-12,-14],[-10,-21],[-1,-29],[18,-41],[22,-41],[29,-40],[30,-33]],[[50,0],[53,-3],[45,-11],[52,-12],[62,-10],[72,-4]],[[19,-8],[28,-1],[31,4],[30,9],[23,19],[30,32],[18,34],[13,46],[26,42],[43,50],[47,43],[48,38],[52,34],[50,30],[40,21],[34,10],[34,7],[48,7]],[[62,-29],[58,-27],[53,-32]],[[13,46],[11,47],[5,44],[8,28]],[[74,-6],[72,-9],[82,-32],[64,-33],[62,-29]],[[51,-31],[46,-39],[37,-34],[21,-31],[18,-28],[19,-8]],[[51,-1],[55,3],[62,3],[65,2],[64,-1],[69,-6]],[[-14,12],[0,20],[8,22]],[[62,-29],[65,-25],[75,-30],[71,-38],[72,-42]],[[-2,0],[6,-6],[12,-8],[19,-8]],[[60,63],[54,56]],[[19,-14],[30,-14]],[[28,-13],[15,2]]];
const GARDEN = [[-36,-30],[-12,-42],[18,-46],[45,-46],[64,-54],[80,-42],[84,-10],[74,8],[66,40],[58,60],[30,58],[2,54],[-18,46],[-36,22],[-40,0]];
const pip = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0])*(z - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; };
// concave square (or oblong) hip roof with upturned corners: eave half-sizes (a, b) at y, top half-sizes (ta, tb) at y + h
function jroof(o, und, a, b, ta, tb, y, h, lift){
  const n = 5, nt = 5, secs = [];
  for (let k = 0; k <= nt; k++){ const u = k/nt, A = a + (ta - a)*u, Bb = b + (tb - b)*u, yy = y + h*Math.pow(u, 1.7), lu = lift*Math.pow(1 - u, 2), C = [[-A, -Bb], [A, -Bb], [A, Bb], [-A, Bb]], P = [];
    for (let s = 0; s < 4; s++){ const p = C[s], q = C[(s + 1) % 4]; for (let i = 0; i < n; i++){ const t = i/n, c = Math.pow(Math.abs(2*t - 1), 4); P.push(V(p[0] + (q[0] - p[0])*t, yy + lu*c, p[1] + (q[1] - p[1])*t)); } }
    secs.push(P); }
  for (let k = 0; k < nt; k++){ const S0 = secs[k], S1 = secs[k + 1], m = S0.length; for (let i = 0; i < m; i++) q4(o, S0[i], S0[(i + 1) % m], S1[(i + 1) % m], S1[i]); }
  // fascia + red soffit under the eave
  const E = secs[0], m = E.length, dn = 0.28; for (let i = 0; i < m; i++){ const p = E[i], q = E[(i + 1) % m]; q4(o, p, q, [q[0], q[1] - dn, q[2]], [p[0], p[1] - dn, p[2]]); }
  const T = secs[nt]; for (let i = 0; i < m; i++) t3(o, V(0, y + h, 0), T[i], T[(i + 1) % m]);
  for (let i = 0; i < m; i++){ const p = E[i], q = E[(i + 1) % m]; t3(und, V(0, y - dn, 0), [p[0], p[1] - dn, p[2]], [q[0], q[1] - dn, q[2]]); }
}
// stone lantern (toro): pedestal, shaft, light box, hexagonal cap, jewel
function lantern(B, x, y, z, s){ const st = B.p(STONE); cyl(st, x, z, 0.5*s, 0.55*s, y - 0.3, y + 0.25*s, 6, true); cyl(st, x, z, 0.16*s, 0.2*s, y + 0.25*s, y + 1.2*s, 6); cyl(st, x, z, 0.42*s, 0.3*s, y + 1.2*s, y + 1.4*s, 6, true);
  cyl(B.p(LAMP), x, z, 0.28*s, 0.28*s, y + 1.4*s, y + 1.85*s, 6); cyl(st, x, z, 0.62*s, 0.08*s, y + 1.85*s, y + 2.25*s, 6, true); blob(st, x, y + 2.35*s, z, 0.12*s, 0.15*s, 0.12*s, 6, 3); }
LANDMARKS.sfteagarden = {zh:'日本茶园', en:'Japanese Tea Garden', cat:'old', r:PL[K][3], h:18, lt:{m:0, c:'#ffd29a', k:0.55, e:0.4},
  build(){
    const g = new THREE.Group(), s = frame(g, K), B = mkB(), r = LMCTX.rng, gy = (x, z) => gm(K, x, z);
    const red = B.p(RED), roof = B.p(ROOF), wood = B.p(WOOD);
    // ---- the five-storey pagoda (square, turned 21.7 degrees)
    { const cx = 0, cz = 9.9, y0 = Math.max(gy(-4, 10), gy(4, 10), gy(0, 6), gy(0, 14)); pushT(cx, 0, cz, 0.379);
      box(B.p(STONE), -4.15, 4.15, y0 - 2, y0 + 0.6, -4.15, 4.15); for (const sz of [-1, 1]) box(B.p(STONE), -1.5, 1.5, y0 - 2, y0 + 0.35, sz*4.15 - (sz > 0 ? 0 : 0.9), sz*4.15 + (sz > 0 ? 0.9 : 0));
      let y = y0 + 0.6; const BODY = [2.7, 2.35, 2.05, 1.8, 1.55], HB = [2.4, 1.35, 1.3, 1.25, 1.2];
      for (let k = 0; k < 5; k++){ const a = BODY[k];
        box(red, -a, a, y, y + HB[k], -a, a);                                       // the storey's red walls
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) bc(B.p(RED), sx*a, y, sz*a, 0.3, HB[k], 0.3);
        for (const sz of [-1, 1]) for (let i = -1; i <= 1; i++) box(B.p(GRAV), i*a*0.55 - a*0.18, i*a*0.55 + a*0.18, y + HB[k]*0.25, y + HB[k]*0.8, sz*a - 0.04, sz*a + 0.04);   // white plaster panels
        for (const sx of [-1, 1]) for (let i = -1; i <= 1; i++) box(B.p(GRAV), sx*a - 0.04, sx*a + 0.04, y + HB[k]*0.25, y + HB[k]*0.8, i*a*0.55 - a*0.18, i*a*0.55 + a*0.18);
        y += HB[k]; box(red, -a - 0.25, a + 0.25, y, y + 0.25, -a - 0.25, a + 0.25);   // bracket band
        const ea = a + (k === 0 ? 1.9 : 1.5), nb = k < 4 ? BODY[k + 1]*0.95 : 0.55, rh = k === 0 ? 1.25 : 1.0;
        jroof(roof, red, ea, ea, nb, nb, y + 0.25, rh, 0.55); for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(B.p(GOLD), sx*ea*0.97, sz*ea*0.97, 0.13, 0.17, y + 0.05, y + 0.5, 6, true); y += 0.25 + rh; }
      // the finial (sorin): base, nine rings, water-flame and jewel
      const sp = B.p(GOLD); box(sp, -0.5, 0.5, y - 0.1, y + 0.35, -0.5, 0.5); cyl(sp, 0, 0, 0.42, 0.42, y + 0.35, y + 0.75, 8, true); cyl(sp, 0, 0, 0.09, 0.09, y + 0.75, y + 4.2, 6);
      for (let i = 0; i < 9; i++) cyl(sp, 0, 0, 0.36 - i*0.012, 0.36 - i*0.012, y + 1.0 + i*0.28, y + 1.1 + i*0.28, 8, true);
      blob(sp, 0, y + 3.85, 0, 0.32, 0.3, 0.32, 8, 4); blob(sp, 0, y + 4.3, 0, 0.16, 0.22, 0.16, 6, 3);
      popT(); }
    // ---- the red Temple Gate in front of the pagoda (posts, tie beams, small hip roof)
    { const y = gy(8.7, 25.9); pushT(8.7, 0, 25.9, 0.419);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(red, sx*2.6, sz*1.6, 0.2, 0.2, y - 0.5, y + 3.3, 8);
      for (const sz of [-1, 1]) box(red, -3.1, 3.1, y + 2.7, y + 3.1, sz*1.6 - 0.15, sz*1.6 + 0.15); box(red, -2.9, 2.9, y + 3.1, y + 3.4, -1.8, 1.8);
      jroof(roof, red, 4.0, 2.9, 1.8, 0.4, y + 3.4, 1.4, 0.45); popT(); }
    // ---- the main gate on the drive (east): a two-tier roofed wooden gate, its passage running north-east / south-west
    { const y = Math.max(gy(75.5, -3.2), gy(72, -1)); pushT(75.5, 0, -3.2, -PI/4);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(wood, sx*2.9, sz*2.2, 0.26, 0.26, y - 0.5, y + 4.6, 8);
      for (const sx of [-1, 1]) cyl(wood, sx*1.6, 0, 0.22, 0.22, y - 0.5, y + 4.6, 8);
      for (const sz of [-1, 1]) box(wood, -3.4, 3.4, y + 3.9, y + 4.4, sz*2.2 - 0.18, sz*2.2 + 0.18);
      box(wood, -3.3, 3.3, y + 4.4, y + 5.0, -2.5, 2.5); box(B.p(GRAV), -2.6, 2.6, y + 5.0, y + 6.0, -1.9, 1.9);
      jroof(roof, wood, 4.6, 3.6, 3.4, 2.5, y + 5.0, 0.9, 0.35); jroof(roof, wood, 3.9, 3.0, 2.2, 0.3, y + 6.0, 2.0, 0.55);
      box(B.p(STONE), -3.6, 3.6, y - 1, y + 0.15, -2.8, 2.8); popT(); }
    // ---- the south gate
    { const y = gy(53.4, 53); pushT(53.4, 0, 53, -0.768);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(wood, sx*3.9, sz*1.8, 0.22, 0.22, y - 0.5, y + 3.6, 8);
      for (const sz of [-1, 1]) box(wood, -4.4, 4.4, y + 3.0, y + 3.4, sz*1.8 - 0.15, sz*1.8 + 0.15);
      jroof(roof, wood, 5.0, 2.8, 2.9, 0.4, y + 3.6, 1.6, 0.4); popT(); }
    // ---- the tea house (open sides, low hip roof) and the gift shop
    { const y = Math.max(gy(51, -21), gy(47, -21), gy(55, -21)); pushT(51.1, 0, -21.2, -0.742);
      box(B.p(STONE), -4.2, 4.2, y - 1.5, y + 0.5, -4.2, 4.2); box(wood, -4.0, 4.0, y + 0.5, y + 0.7, -4.0, 4.0);
      for (let i = 0; i < 4; i++) for (const sx of [-1, 1]){ cyl(wood, sx*3.7, -3.7 + i*2.47, 0.15, 0.15, y + 0.7, y + 3.3, 6); cyl(wood, -3.7 + i*2.47, sx*3.7, 0.15, 0.15, y + 0.7, y + 3.3, 6); }
      box(B.p(GRAV), -3.2, 3.2, y + 0.7, y + 3.0, 0.5, 3.2); box(wood, -3.9, 3.9, y + 3.3, y + 3.6, -3.9, 3.9);
      jroof(roof, wood, 5.2, 5.2, 1.2, 0.2, y + 3.6, 2.3, 0.4); popT(); }
    { const y = gy(53, -36.5); pushT(53, 0, -36.5, -0.68); box(wood, -3.0, 3.0, y - 1, y + 3.0, -2.4, 2.4); box(B.p(GRAV), -2.6, 2.6, y + 0.9, y + 2.4, 2.38, 2.46);
      jroof(roof, wood, 3.8, 3.2, 1.6, 0.2, y + 3.0, 1.7, 0.3); popT(); }
    { const y = gy(-28.6, -18.9); pushT(-28.6, 0, -18.9, -1.02); box(wood, -3.0, 3.0, y - 1, y + 2.4, -2.2, 2.2); jroof(roof, wood, 3.6, 2.8, 2.6, 0.2, y + 2.4, 1.2, 0.2); popT(); }
    // ---- ponds (terrain-following water sheets with stone rims) and the drum bridge
    const PONDS = [[44, -31, 13, 6.5, -0.65], [39, 25, 9, 6, 0.3], [4, -20, 9, 5.5, 0.5], [-20, 30, 6, 4, 0.2]];
    for (const [px, pz, ra, rb, th] of PONDS){ const n = 16, P = []; for (let i = 0; i < n; i++){ const a = i/n*TAU, f = 1 + 0.18*Math.sin(a*3 + px), c = Math.cos(th), sn = Math.sin(th), u = Math.cos(a)*ra*f, v = Math.sin(a)*rb*f; P.push([px + u*c - v*sn, pz + u*sn + v*c]); }
      const w = B.p(WAT), st = B.p(STONE); for (let i = 0; i < n; i++){ const a = P[i], b = P[(i + 1) % n]; { const m0 = [lerp(px, a[0], 0.5), lerp(pz, a[1], 0.5)], m1 = [lerp(px, b[0], 0.5), lerp(pz, b[1], 0.5)], H = (x, z) => gy(x, z) + 0.22;
          t3(w, V(px, H(px, pz), pz), V(m0[0], H(...m0), m0[1]), V(m1[0], H(...m1), m1[1])); q4(w, V(m0[0], H(...m0), m0[1]), V(a[0], H(...a), a[1]), V(b[0], H(...b), b[1]), V(m1[0], H(...m1), m1[1])); }
        if (i % 2 === 0) blob(st, a[0], gy(a[0], a[1]) + 0.2, a[1], 0.7 + r()*0.5, 0.4, 0.6 + r()*0.4, 6, 3, 0.3, r); } }
    { const L = 10, H = 3.2, W = 1.0, y = Math.max(gy(41, -36), gy(47, -28)); pushT(44, 0, -32, 0.927);   // the OSM segment (41, -36) - (47, -28)
      const prof = u => y + 0.2 + H*Math.sqrt(Math.max(0, 1 - (2*u - 1)*(2*u - 1))) , n = 14;
      for (let i = 0; i < n; i++){ const u0 = i/n, u1 = (i + 1)/n, x0 = -L/2 + L*u0, x1 = -L/2 + L*u1, y0 = prof(u0), y1 = prof(u1);
        q4(wood, V(x0, y0, -W), V(x1, y1, -W), V(x1, y1, W), V(x0, y0, W)); q4(wood, V(x0, y0 - 0.35, -W), V(x1, y1 - 0.35, -W), V(x1, y1, -W), V(x0, y0, -W)); q4(wood, V(x0, y0 - 0.35, W), V(x1, y1 - 0.35, W), V(x1, y1, W), V(x0, y0, W));
        for (const sz of [-1, 1]) beam(wood, [x0, y0 + 0.9, sz*W], [x1, y1 + 0.9, sz*W], 0.06); if (i % 2 === 0) for (const sz of [-1, 1]) bc(wood, x0, y0, sz*W, 0.14, 1.0, 0.14); }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(wood, sx*(L/2 - 1.2), sz*(W - 0.1), 0.18, 0.18, y - 1.5, prof(0.5 + sx*0.38) - 0.3, 6);
      popT(); }
    // ---- the bronze Buddha (seated, on a stone pedestal) and the Peace Lantern
    { const x = 32.9, z = -12.1, y = gy(x, z), st = B.p(STONE), bz = B.p(BRZ);
      box(st, x - 1.8, x + 1.8, y - 0.5, y + 1.2, z - 1.8, z + 1.8); box(st, x - 1.4, x + 1.4, y + 1.2, y + 1.9, z - 1.4, z + 1.4);
      lathe(bz, x, z, [[1.35, y + 1.9], [1.45, y + 2.2], [1.2, y + 2.5], [0.95, y + 2.6], [0, y + 2.6]], 12);            // lotus seat
      lathe(bz, x, z, [[1.15, y + 2.6], [1.1, y + 3.1], [0.78, y + 3.6], [0.72, y + 4.3], [0.42, y + 4.65], [0, y + 4.7]], 10);   // the body
      blob(bz, x, y + 5.05, z, 0.38, 0.45, 0.38, 8, 5); blob(bz, x, y + 5.5, z, 0.2, 0.2, 0.2, 6, 3); }
    { const x = -15.7, z = 10.2, y = gy(x, z), st = B.p(STONE);
      box(st, x - 1.0, x + 1.0, y - 0.4, y + 0.4, z - 1.0, z + 1.0); cyl(st, x, z, 0.3, 0.38, y + 0.4, y + 1.5, 6); cyl(st, x, z, 0.75, 0.55, y + 1.5, y + 1.75, 6, true);
      box(B.p(LAMP), x - 0.45, x + 0.45, y + 1.75, y + 2.35, z - 0.45, z + 0.45); cyl(st, x, z, 1.15, 0.1, y + 2.35, y + 2.85, 6, true); blob(st, x, y + 2.95, z, 0.18, 0.22, 0.18, 6, 3); }
    for (const [x, z] of [[24, 26], [55, -28], [12, -30], [-6, 30], [38, 4], [66, -8], [-24, 6]]) lantern(B, x, gy(x, z), z, 1.0);
    // ---- the zen garden: raked gravel with three stones, south of the pagoda
    { const P = [[-8, 34], [6, 32], [10, 44], [-4, 48], [-14, 42]], c = [-2, 40], gv = B.p(GRAV);
      for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length]; t3(gv, V(c[0], gy(...c) + 0.1, c[1]), V(a[0], gy(...a) + 0.1, a[1]), V(b[0], gy(...b) + 0.1, b[1])); }
      for (const [x, z, k] of [[-4, 38, 1.2], [3, 41, 0.8], [-9, 43, 0.9]]) blob(B.p(STONE), x, gy(x, z) + 0.3, z, k, k*0.8, k*0.9, 7, 4, 0.35, r); }
    // ---- stone paths (the OSM garden paths), clipped to the garden
    { const pv = B.p(PATH);
      for (const L of PATHS) for (let i = 0; i < L.length - 1; i++){ const a = L[i], b = L[i + 1], m = [(a[0] + b[0])/2, (a[1] + b[1])/2]; if (!pip(GARDEN, m[0], m[1])) continue;
        const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), n = Math.max(1, Math.round(len/3)), nx = -dz/len*0.8, nz = dx/len*0.8;
        for (let k = 0; k < n; k++){ const p0 = [a[0] + dx*k/n, a[1] + dz*k/n], p1 = [a[0] + dx*(k + 1)/n, a[1] + dz*(k + 1)/n];
          q4(pv, V(p0[0] - nx, gy(p0[0] - nx, p0[1] - nz) + 0.1, p0[1] - nz), V(p1[0] - nx, gy(p1[0] - nx, p1[1] - nz) + 0.1, p1[1] - nz), V(p1[0] + nx, gy(p1[0] + nx, p1[1] + nz) + 0.1, p1[1] + nz), V(p0[0] + nx, gy(p0[0] + nx, p0[1] + nz) + 0.1, p0[1] + nz)); } } }
    // ---- the garden's trees: cloud-pruned pines, red maples, cherries, broadleaf shade trees; a bamboo fence along the drive
    { const busy = [[0, 10, 8], [8.7, 25.9, 5], [75.5, -3.2, 10], [53.4, 53, 8], [51, -21, 8], [53, -36.5, 5], [33, -12, 4], [-15.7, 10.2, 3], [44, -31, 9], [39, 25, 7], [4, -20, 7], [-20, 30, 5], [-2, 40, 8]];
      let placed = 0;
      for (let k = 0; k < 400 && placed < 95; k++){ const x = -40 + r()*124, z = -46 + r()*106; if (!pip(GARDEN, x, z)) continue;
        if (busy.some(([bx, bz, rr]) => Math.hypot(x - bx, z - bz) < rr)) continue;
        if (PATHS.some(L => L.some((p, i) => i < L.length - 1 && segD(x, z, p, L[i + 1]) < 1.6))) continue;
        const y = gy(x, z), q = r(); placed++;
        if (q < 0.34) tree(B, x, y, z, 0.75 + r()*0.4, r, 1, TRK, PINE);
        else if (q < 0.55) tree(B, x, y, z, 0.6 + r()*0.3, r, 0, TRK, MAPLE);
        else if (q < 0.68) tree(B, x, y, z, 0.65 + r()*0.3, r, 0, TRK, CHER);
        else if (q < 0.9) tree(B, x, y, z, 0.9 + r()*0.5, r, 0, TRK, LEAF);
        else blob(B.p(LEAF), x, y + 0.6, z, 1.4 + r(), 0.9, 1.2 + r(), 7, 3, 0.3, r); }
      // the bamboo fence on the east boundary
      for (let i = 0; i < GARDEN.length; i++){ const a = GARDEN[i], b = GARDEN[(i + 1) % GARDEN.length]; if (!(a[0] > 55 && b[0] > 55)) continue; const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1])/2);
        for (let k = 0; k < n; k++){ const p = [lerp(a[0], b[0], k/n), lerp(a[1], b[1], k/n)], q = [lerp(a[0], b[0], (k + 1)/n), lerp(a[1], b[1], (k + 1)/n)], y0 = gy(...p), y1 = gy(...q);
          if (Math.hypot((p[0] + q[0])/2 - 75.5, (p[1] + q[1])/2 + 3.2) < 5.5) continue;
          q4(wood, V(p[0], y0 - 0.3, p[1]), V(q[0], y1 - 0.3, q[1]), V(q[0], y1 + 1.8, q[1]), V(p[0], y0 + 1.8, p[1])); } } }
    B.flush(s);
    return g; }};
function segD(x, z, a, b){ const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx*dx + dz*dz || 1, t = Math.max(0, Math.min(1, ((x - a[0])*dx + (z - a[1])*dz)/L2)); return Math.hypot(x - a[0] - dx*t, z - a[1] - dz*t); }
place(K);
}


// =====================================================================================================================
// Mount Davidson Cross (1934): the plain 103-ft (31.4 m) reinforced-concrete Latin cross on the city's highest summit, its
// broad face to the east (arms north-south), the upright tapering slightly and rising well above the short arms; a stepped
// Art-Deco podium on the round summit platform with its steps, on the rocky chert knoll, inside a ring of the summit's
// tall eucalyptus. No figures, no inscriptions. Night: the floodlights (even, cool white).
// =====================================================================================================================
{
const K = 'sfdavidson';
const CON = {c:'#dcdad3', lk:1.1}, CON2 = {c:'#c9c6bd', lk:0.9}, ROCK = '#8f877b', ROCK2 = '#7a7468', PLAT = '#b8b3a8', TRK = '#8a8070', EUC = {c:'#55684a', lk:0.12}, EUC2 = {c:'#4a5d42', lk:0.12};
LANDMARKS.sfdavidson = {zh:'戴维森山十字架', en:'Mount Davidson Cross', cat:'old', r:PL[K][3], h:33, lt:{m:0, c:'#f4f1ff', k:0.9, e:0.75},
  build(){
    const g = new THREE.Group(), s = frame(g, K), B = mkB(), r = LMCTX.rng, gy = (x, z) => gl(K, x, z);
    let hi = -1e9, lo = 1e9; for (let a = 0; a < 16; a++) for (const d of [0, 6, 11]){ const x = Math.cos(a/16*TAU)*d, z = Math.sin(a/16*TAU)*d; hi = Math.max(hi, gl(K, x, z)); lo = Math.min(lo, glo(K, x, z)); }
    const Y = hi + 1.2;                                                  // the platform on top of the knoll
    // the rocky knoll: an irregular lathe of rock from below the lowest ground up to the platform, outcrops round it
    { const n = 18, rings = [[16, lo - 6], [14.5, lo - 1], [12.5, (lo + Y)/2], [11, Y - 0.8], [10.2, Y - 0.3]], P = rings.map(([rr, y], k) => { const R = []; for (let i = 0; i < n; i++){ const a = i/n*TAU, f = 1 + (k < 4 ? (r() - 0.5)*0.22 : 0); R.push(V(Math.cos(a)*rr*f, y, Math.sin(a)*rr*f)); } return R; });
      for (let k = 0; k < P.length - 1; k++) for (let i = 0; i < n; i++) q4(B.p(k % 2 ? ROCK : ROCK2), P[k][i], P[k][(i + 1) % n], P[k + 1][(i + 1) % n], P[k + 1][i]);
      for (let i = 0; i < 14; i++){ const a = r()*TAU, d = 11 + r()*5, x = Math.cos(a)*d, z = Math.sin(a)*d; blob(B.p(ROCK), x, gm(K, x, z) + 0.4, z, 1.2 + r()*1.6, 0.8 + r()*1.0, 1.0 + r()*1.4, 6, 3, 0.4, r); } }
    // the round platform (19 m across) with two steps, and the steps down to the east
    cyl(B.p(PLAT), 0, 0, 9.6, 9.6, Y - 0.6, Y - 0.3, 32, true); cyl(B.p(PLAT), 0, 0, 9.2, 9.2, Y - 0.3, Y, 32, true);
    for (let i = 0; i < 5; i++) box(B.p(PLAT), 9.0 + i*0.45, 9.45 + i*0.45, Y - 2.4, Y - 0.6 - i*0.3, -5.3, 5.3);
    // stepped Art-Deco podium
    const co = B.p(CON), c2 = B.p(CON2);
    box(c2, -3.4, 3.4, Y, Y + 0.9, -3.4, 3.4); box(co, -2.8, 2.8, Y + 0.9, Y + 2.1, -2.8, 2.8); box(c2, -2.3, 2.3, Y + 2.1, Y + 2.6, -2.3, 2.3);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(co, sx*2.8 - 0.25, sx*2.8 + 0.25, Y + 0.9, Y + 2.3, sz*2.8 - 0.25, sz*2.8 + 0.25);   // corner piers
    box(c2, 3.38, 3.42, Y + 0.25, Y + 0.7, -1.0, 1.0);                                          // the plaque's place (plain)
    // the cross: the upright (3.0 m broad face east-west seen, 2.3 m deep) tapering, the arms north-south (span 11 m)
    const y0 = Y + 2.6, yT = Y + 31.4 + 1.0, yA0 = y0 + 19.6, yA1 = yA0 + 2.7;
    { const P = (w, d, y) => [[-d/2, y, -w/2], [d/2, y, -w/2], [d/2, y, w/2], [-d/2, y, w/2]].map(p => V(...p)), A = P(3.0, 2.3, y0), Bt = P(2.45, 1.95, yT);
      for (let i = 0; i < 4; i++) q4(co, A[i], A[(i + 1) % 4], Bt[(i + 1) % 4], Bt[i]); q4(co, Bt[0], Bt[1], Bt[2], Bt[3]);
      // arms (slightly tapering to the tips), with a shallow chamfer line
      for (const sz of [-1, 1]){ const zi = sz*1.25, zo = sz*5.5, a = [[-0.98, yA0, zi], [0.98, yA0, zi], [0.98, yA1, zi], [-0.98, yA1, zi]], b = [[-0.9, yA0 + 0.12, zo], [0.9, yA0 + 0.12, zo], [0.9, yA1 - 0.08, zo], [-0.9, yA1 - 0.08, zo]];
        const A2 = a.map(p => V(...p)), B2 = b.map(p => V(...p)); for (let i = 0; i < 4; i++) q4(co, A2[i], A2[(i + 1) % 4], B2[(i + 1) % 4], B2[i]); q4(co, B2[0], B2[1], B2[2], B2[3]); }
      // faint vertical reveals on the faces (form-work joints)
      for (const sx of [-1, 1]) for (const z of [-0.5, 0.5]) beam(c2, [sx*1.16, y0 + 0.3, z], [sx*0.99, yT - 0.4, z*0.82], 0.03); }
    // the summit's eucalyptus round the clearing (more open to the east, toward the city)
    for (let i = 0; i < 17; i++){ const a = (i/17)*TAU + r()*0.2; if (Math.cos(a) > 0.55) continue; const d = 13 + r()*6, x = Math.cos(a)*d, z = Math.sin(a)*d, y = gm(K, x, z);
      tree(B, x, y, z, 1.5 + r()*0.5, r, 2, TRK, i % 2 ? EUC : EUC2); }
    B.flush(s); return g; }};
place(K);
}


// =====================================================================================================================
// Lands End: sfcliffhouse — the Cliff House (1909, restored 2004 to its neoclassical look): the white two-storey block on
// the rock above Ocean Beach with its parapet and rows of tall windows, the lower storeys stepping down the cliff on the
// ocean side, the narrow north wing under the North Observation Deck, the 2004 glass-and-concrete wing on the south-east,
// and the Camera Obscura (the "giant camera") on the terrace to the west — on its rocky headland, rebuilt here from the
// surf up because the app's 90 m ground has the coast flat at sea level. Plan = the OSM outline (rot 0).
// sfcliffhouse2 — the Sutro Baths ruins (1896, burnt 1966) in the cove below: the concrete sea wall and walkway along the
// ocean, the outlines of the pools (some with standing water), stubs of walls and stairs, the roofless boiler room, the
// tunnel portal in the north rock. Night: the Cliff House floodlit warm, its windows lit; the ruins dark.
// =====================================================================================================================
{
const K = 'sfcliffhouse', YS = 9.5;     // the street / main floor level of the Cliff House above the sea (compromise: the app's road here is at sea level)
const WH = {c:'#efece4', lk:0.9}, WH2 = {c:'#dcd7cb', lk:0.8}, WIN = {c:'#3a4650', glow:'#ffd9a0', gk:0.75}, ROCK = '#6f675c', ROCK2 = '#5d564d', CON = '#9c968b', GLS = {c:'#55656e', glow:'#ffe2b6', gk:0.5}, RAIL = '#d0d0cc', DK = '#3a3632', CAM = {c:'#c9b48e', lk:0.7};
const FOOT = [[-20.5,-19.0],[-10.6,-23.5],[-10.6,-39.8],[-8.5,-38.6],[-2.6,-33.3],[0.2,-28.4],[1.0,-25.8],[1.4,-20.7],[0.8,-16.0],[-0.6,-11.8],[2.6,-4.9],[6.9,-6.9],[18.2,17.4],[21.3,15.9],[24.4,22.5],[12.4,28.0],[9.3,21.4],[-1.9,26.6],[-4.3,21.5],[-10.3,24.3],[-12.9,17.9],[-15.6,7.2],[-16.5,-4.2],[-16.2,-7.7],[-15.5,-8.0]];
const MAIN = [[-16.5,-8.0],[0.8,-8.0],[2.6,-4.9],[6.9,-6.9],[12.0,4.0],[9.0,22.0],[-1.9,26.6],[-4.3,21.5],[-10.3,24.3],[-12.9,17.9],[-15.6,7.2]];
const NWING = [[-20.5,-19.0],[-10.6,-23.5],[-10.6,-39.8],[-8.5,-38.6],[-2.6,-33.3],[0.2,-28.4],[1.0,-25.8],[1.4,-20.7],[0.8,-16.0],[-0.6,-11.8],[0.8,-8.0],[-16.5,-8.0],[-16.2,-7.7]];
const SWING = [[6.9,-6.9],[18.2,17.4],[21.3,15.9],[24.4,22.5],[12.4,28.0],[9.3,21.4],[9.0,22.0],[12.0,4.0]];
// a rock mass lofted through irregular rings (plan polygon grown by `grow` at the bottom)
function rockMass(B, P, ybot, ytop, grow, r){
  const n = P.length, c = P.reduce((s, p) => [s[0] + p[0]/n, s[1] + p[1]/n], [0, 0]), rings = [[grow, ybot], [grow*0.75, lerp(ybot, ytop, 0.35)], [grow*0.45, lerp(ybot, ytop, 0.7)], [0.6, ytop]];
  const R = rings.map(([gw, y], k) => P.map(p => { const dx = p[0] - c[0], dz = p[1] - c[1], d = Math.hypot(dx, dz) || 1, f = gw*(k < 3 ? 0.7 + r()*0.6 : 1); return V(p[0] + dx/d*f, y + (k > 0 && k < 3 ? (r() - 0.5)*1.5 : 0), p[1] + dz/d*f); }));
  for (let k = 0; k < R.length - 1; k++) for (let i = 0; i < n; i++) q4(B.p(k % 2 ? ROCK : ROCK2), R[k][i], R[k][(i + 1) % n], R[k + 1][(i + 1) % n], R[k + 1][i]);
  const T = R[R.length - 1], cc = V(c[0], ytop + 0.3, c[1]); for (let i = 0; i < n; i++) t3(B.p(ROCK), cc, T[i], T[(i + 1) % n]);
}
LANDMARKS.sfcliffhouse = {zh:'悬崖屋', en:'Cliff House', cat:'old', r:PL[K][3], h:22, lt:{m:0, c:'#ffdcae', k:0.75, e:0.4, anim:'breathe'},
  build(){
    const g = new THREE.Group(), s = frame(g, K), B = mkB(), r = LMCTX.rng;
    // the headland: rock from the surf up to the terrace, wider at the bottom on the ocean side
    const HEAD = [[-34,-30],[-24,-46],[-10,-48],[4,-36],[8,-14],[16,-8],[28,14],[30,30],[14,36],[-4,34],[-26,40],[-36,24],[-38,0]];
    rockMass(B, HEAD, -4, YS - 2.2, 7, r);
    // craggy ledges and a rocky bank falling to the road on the east side, boulders round the foot
    for (let i = 0; i < HEAD.length; i++){ const p = HEAD[i], q = HEAD[(i + 1) % HEAD.length], m = [(p[0] + q[0])/2, (p[1] + q[1])/2], d = Math.hypot(m[0] + 4, m[1]) || 1, ox = (m[0] + 4)/d, oz = m[1]/d;
      const y = YS*(0.25 + r()*0.45); blob(B.p(i % 2 ? ROCK : ROCK2), m[0] + ox*4, y, m[1] + oz*4, 3 + r()*2.5, YS*0.4 + r()*2, 3 + r()*2.5, 7, 4, 0.45, r); }
    { const E = [[8, -14], [20, 2], [30, 26], [16, 34]], o = B.p(ROCK2);
      for (let i = 0; i < E.length - 1; i++){ const a = E[i], b = E[i + 1], n = [(b[1] - a[1]), -(b[0] - a[0])], L = Math.hypot(...n), ux = n[0]/L*7, uz = n[1]/L*7;
        q4(o, V(a[0], YS - 2.2, a[1]), V(b[0], YS - 2.2, b[1]), V(b[0] + ux, -0.6, b[1] + uz), V(a[0] + ux, -0.6, a[1] + uz)); } }
    capP(B.p(CON), HEAD.map(p => [p[0]*0.97, p[1]*0.97]), YS - 2.0);                     // the terrace level (paved) round the building
    for (let i = 0; i < 16; i++){ const a = r()*TAU, d = 28 + r()*8, x = Math.cos(a)*d - 6, z = Math.sin(a)*d*0.9; if (x > 20) continue; blob(B.p(i % 2 ? ROCK : ROCK2), x, -1, z, 2 + r()*3, 2 + r()*3.5, 2 + r()*3, 7, 4, 0.4, r); }
    // the lower storeys stepping down the cliff on the ocean (west) side
    { const LOW = [[-17.5,-8.0],[-4,-8.0],[-4,22.5],[-10.3,25.3],[-13.9,18.4],[-16.6,7.2]], wh = B.p(WH2);
      prism(wh, LOW, YS - 7.5, YS - 0.4); winRows(B.p(WIN), LOW, YS - 6.6, YS - 4.8, 2.6, 1.4, 4); winRows(B.p(WIN), LOW, YS - 3.6, YS - 1.4, 2.6, 1.6, 4);
      box(B.p(RAIL), -18.2, -17.4, YS - 4.0, YS - 3.0, -7.5, 7.0); }
    // the 1909 block: two storeys above the street, parapet with a cornice, rows of tall windows
    { const wh = B.p(WH); prism(wh, MAIN, YS - 0.5, YS + 7.6);
      winRows(B.p(WIN), MAIN, YS + 0.7, YS + 3.0, 2.3, 1.5); winRows(B.p(WIN), MAIN, YS + 4.0, YS + 6.6, 2.3, 1.5);
      const sg = area(MAIN) > 0 ? 1 : -1, grow = MAIN.map((p, i) => p);   // cornice + parapet: a slightly larger outline
      walls(B.p(WH2), MAIN.map(p => [p[0]*1.012 - 0.05, p[1]*1.01]), YS + 7.6, YS + 8.1); walls(wh, MAIN, YS + 8.1, YS + 9.1); capP(B.p(CON), MAIN, YS + 7.7);
      // the entrance canopy on the street (east) side
      box(B.p(DK), 3.6, 8.0, YS + 3.0, YS + 3.3, 0.5, 6.5); }
    // the north wing with the observation deck on its roof (railings)
    { prism(B.p(WH), NWING, YS - 3.5, YS + 3.6); winRows(B.p(WIN), NWING, YS - 2.6, YS - 0.8, 2.6, 1.5, 4); winRows(B.p(WIN), NWING, YS + 0.6, YS + 2.8, 2.2, 1.6, 4);
      walls(B.p(RAIL), NWING, YS + 3.6, YS + 4.6); }
    // the 2004 wing: a glass box with white concrete frame and deck
    { prism(B.p(GLS), SWING, YS - 0.5, YS + 6.6); walls(B.p(WH), SWING, YS + 6.6, YS + 7.6); capP(B.p(CON), SWING, YS + 7.0);
      for (let i = 0; i < SWING.length; i++){ const p = SWING[i]; box(B.p(WH), p[0] - 0.3, p[0] + 0.3, YS - 0.5, YS + 6.6, p[1] - 0.3, p[1] + 0.3); }
      walls(B.p(WH), SWING.map(p => [p[0], p[1]]), YS + 3.0, YS + 3.4); }
    // the Camera Obscura on the terrace west of the house: a box with the lens turret on top
    { const cx = -20.4, cz = 26.9, y = YS - 2.0, cm = B.p(CAM); pushT(cx, 0, cz, 0.38);
      box(cm, -2.8, 2.8, y, y + 3.2, -2.6, 2.6); box(B.p(DK), -2.0, 2.0, y + 0.2, y + 2.4, 2.62, 2.66); box(cm, -1.5, 1.5, y + 3.2, y + 4.8, -1.2, 1.2); box(B.p(DK), -1.0, 1.0, y + 4.8, y + 5.3, -0.8, 0.8);
      cyl(B.p(DK), 0, 0, 0.55, 0.55, y + 5.3, y + 5.9, 10, true); popT(); }
    // railings round the terrace edge on the ocean side
    { const o = B.p(RAIL); for (let i = 0; i < HEAD.length; i++){ const a = HEAD[i], b = HEAD[(i + 1) % HEAD.length]; if (a[0] > 6 && b[0] > 6) continue; beam(o, [a[0]*0.96, YS - 1.0, a[1]*0.96], [b[0]*0.96, YS - 1.0, b[1]*0.96], 0.05); } }
    B.flush(s); return g; }};
place(K);
LANDMARKS.sfcliffhouse2 = {zh:'苏特罗浴场遗址', en:'Sutro Baths', cat:'old', r:PL.sfcliffhouse2[3], h:14, lt:{m:0, c:'#ffd6a0', k:0.25},
  build(){
    const g = new THREE.Group(), s = frame(g, 'sfcliffhouse2'), B = mkB(), r = LMCTX.rng, con = B.p(CON), dk = B.p('#7d776c'), wat = B.p({c:'#2f5a5a', lk:0.05});
    // the outer sea wall with the walkway on top (west and north), concrete footings along the east under the slope
    const X0 = -25.5, X1 = 24, Z0 = -40.5, Z1 = 54.5;
    box(con, X0 - 2.2, X0 + 0.6, -3, 3.4, Z0, Z1 + 1); box(con, X0, X1, -3, 3.0, Z0 - 2.0, Z0 + 0.5); box(con, X0, X1 - 6, -3, 2.0, Z1 - 0.5, Z1 + 1.5);
    box(con, X1 - 0.5, X1 + 1.5, -3, 2.4, Z0, Z1);
    // pools: water at sea level inside the low dividing walls
    for (const [x0, x1, z0, z1] of [[X0 + 1, 6, Z0 + 1, -6], [X0 + 1, 6, -5, 22], [X0 + 1, -4, 23, Z1 - 1], [7, X1 - 1, Z0 + 1, 10], [-3, X1 - 1, 23, 40]]){
      box(wat, x0, x1, -1, 0.35, z0, z1); walls(dk, [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], -1, 1.2); }
    // the stepped terraces / foundations of the east side climbing toward the road, wall stubs and stair flights
    for (let i = 0; i < 3; i++) box(con, X1 - 13 + i*4.5, X1 - 9 + i*4.5, 0.2, 1.4 + i*1.7, Z0 + 4 + i*3, Z1 - 3 - i*4);
    for (let i = 0; i < 26; i++){ const x = X0 + 2 + r()*(X1 - X0 - 4), z = Z0 + 2 + r()*(Z1 - Z0 - 4), h = 0.8 + r()*3.2, w = 0.6 + r()*0.6, L = 2 + r()*7; if (r() < 0.5) box(con, x, x + L, 0.3, h, z, z + w); else box(con, x, x + w, 0.3, h, z, z + L); }
    for (let i = 0; i < 8; i++){ const z = -30 + i*10; box(dk, X0 + 0.8, X0 + 1.6, 0.4, 2.6, z, z + 0.8); }    // column stubs along the sea wall
    // the boiler room (roofless) at the north end, the tunnel portal in the rock beyond
    pushT(7.4, 0, -47.9, -1.15); box(con, -7.5, 7.5, -1, 4.2, -3.6, -3.0); box(con, -7.5, 7.5, -1, 4.2, 3.0, 3.6); box(con, -7.5, -6.9, -1, 4.2, -3.6, 3.6); box(con, 6.9, 7.5, -1, 3.0, -3.6, 3.6);
    for (let k = -2; k <= 2; k++) box(B.p('#2a2724'), k*2.6 - 0.6, k*2.6 + 0.6, 1.2, 3.0, 3.58, 3.66); popT();
    { const P = [[-30, -62], [-12, -64], [8, -60], [16, -54], [-2, -50], [-22, -52]]; rockMass(B, P, -4, 9, 5, r); box(B.p('#1f1d1b'), -24.5, -21.5, -0.5, 3.6, -51.6, -51.2); }
    // rocks of the cove along the outside of the sea wall
    for (let i = 0; i < 18; i++){ const z = Z0 - 10 + r()*(Z1 - Z0 + 10), x = X0 - 6 - r()*10; blob(B.p(i % 2 ? ROCK : ROCK2), x, -0.8, z, 1.5 + r()*2.5, 1 + r()*2, 1.5 + r()*2.5, 6, 3, 0.4, r); }
    B.flush(s); return g; }};
place('sfcliffhouse2');
}


// =====================================================================================================================
// Hyde Street Pier (San Francisco Maritime NHP), sfhyde: the outer timber pier on its piles (the OSM outline; local +x runs
// out along the pier to the north-west, +z = the north-east side) with the historic ships moored along it, all floating at
// the map's sea level: the 1886 full-rigged ship Balclutha (black steel hull, white band, three masts with yards and furled
// sails, bowsprit and jib-boom) and the three-masted schooner C.A. Thayer on the west side; the 1890 side-wheel ferry Eureka
// (white two-deck superstructure on her wide guards, paddle boxes, walking beam, the tall black stack, a pilot house at each
// end) and the steam tug Hercules on the east side; the scow schooner Alma across the end (her OSM outline).
// sfhyde2: the Aquatic Park Bathhouse (1939, streamline moderne, now the Maritime Museum): the white "ocean liner" with
// rounded ends, the stepped decks with railings and ribbon windows, the porthole windows of the top deck, the pilot-house
// crown. Night: pier lamps, the ships' riding lights, the bathhouse floodlit white with lit windows.
// =====================================================================================================================
{
const K = 'sfhyde', PD = 3.2;            // pier deck (absolute)
const HB = '#1f2124', HR = '#7c3326', WS = {c:'#eeebe2', lk:0.8}, DECK = '#9c835e', MAST = '#cdbf9c', YARD = '#2b2a28', SAIL = {c:'#e9e4d6', lk:0.6}, LINE = '#3a3633';
const PIER = '#8b8478', PILE = '#5b5248', WIN = {c:'#33404a', glow:'#ffd79a', gk:0.6}, STK = '#1c1c1c', LAMP = {c:'#fff2d0', glow:'#ffd27a', gk:2.0}, GRN = '#3f5541', WOOD2 = '#76593f', BUFF = {c:'#c4a066', lk:0.6};
// ---- a ship's hull along local x (stern -L/2, bow +L/2): half-beam profile, sheer, U sections; colour by height band
function hull(B, L, Bm, yK, yD, o){
  o = o || {}; const ns = 26, nm = 7, sheer = o.sheer || 0.8, cf = o.cols, fine = o.fine || 0.3, scow = o.scow;
  const mir = t => o.dbl ? (t < 0.5 ? 1 - t : t) : t;
  const W0 = t => { const sb = scow ? 0.92 : 0.62; if (t < 0.22) return Bm/2*(sb + (1 - sb)*Math.sin(PI/2*t/0.22)); if (t > 1 - fine) return Bm/2*Math.pow(Math.max(0, Math.cos(PI/2*(t - 1 + fine)/fine)), scow ? 0.25 : 0.75)*(scow ? 0.85 : 1) + (scow ? 0 : 0.05); return Bm/2; }, W = t => W0(mir(t));
  const yd = t => { const u = mir(t); return yD + sheer*Math.pow(2*t - 1, 2) + (u > 0.85 ? (u - 0.85)*(o.bowRise || 3) : 0); };
  const yk = t => o.dbl ? yK + (mir(t) > 0.9 ? (mir(t) - 0.9)/0.1*(yD - yK)*0.55 : 0) : yK + (t > 0.9 ? (t - 0.9)/0.1*(yD - yK)*(scow ? 0.75 : 0.55) : 0) + (t < 0.06 ? (0.06 - t)/0.06*(yD - yK)*0.45 : 0);
  const S = []; for (let i = 0; i <= ns; i++){ const t = i/ns, x = -L/2 + L*t, w = W(t), a = yd(t), b = yk(t), P = [];
    for (let k = 0; k <= nm; k++){ const s = k/nm, y = a - (a - b)*s, hw = w*Math.sqrt(Math.max(0, 1 - Math.pow(s, scow ? 10 : 5))); P.push([x, y, hw]); } S.push(P); }
  for (let i = 0; i < ns; i++) for (let k = 0; k < nm; k++) for (const sz of [-1, 1]){ const a = S[i][k], b = S[i + 1][k], c = S[i + 1][k + 1], d = S[i][k + 1], ym = (a[1] + c[1])/2;
    const col = cf(ym, a[1] - yD), A = V(a[0], a[1], sz*a[2]), Bq = V(b[0], b[1], sz*b[2]), C = V(c[0], c[1], sz*c[2]), D = V(d[0], d[1], sz*d[2]); q4(B.p(col), A, Bq, C, D); }
  // transom / stern face and the deck
  for (let k = 0; k < nm; k++){ const a = S[0][k], b = S[0][k + 1]; q4(B.p(cf(a[1], a[1] - yD)), V(a[0], a[1], -a[2]), V(a[0], a[1], a[2]), V(b[0], b[1], b[2]), V(b[0], b[1], -b[2])); }
  const dk = B.p(o.deck || DECK); for (let i = 0; i < ns; i++){ const a = S[i][0], b = S[i + 1][0]; q4(dk, V(a[0], a[1] - 0.15, -a[2]), V(b[0], b[1] - 0.15, -b[2]), V(b[0], b[1] - 0.15, b[2]), V(a[0], a[1] - 0.15, a[2])); }
  // bulwarks with a white or black rail
  if (o.bulw){ const bw = B.p(o.bulwC || HB); for (let i = 0; i < ns; i++) for (const sz of [-1, 1]){ const a = S[i][0], b = S[i + 1][0]; q4(bw, V(a[0], a[1], sz*a[2]), V(b[0], b[1], sz*b[2]), V(b[0], b[1] + o.bulw, sz*b[2]), V(a[0], a[1] + o.bulw, sz*a[2])); } }
  return {yd, W};
}
// a mast of stacked tapering spars with tops and crosstrees; returns the heights of its doublings
function mast(B, x, y0, segs, col){ let y = y0; const o = B.p(col); for (const [h, r0, r1, ov] of segs){ cyl(o, x, 0, r0, r1, y - (ov || 0), y + h, 8); y += h - (ov || 0)*0; box(B.p(YARD), x - 1.0, x + 1.0, y - 0.35, y - 0.15, -1.2, 1.2); } return y; }
// a yard with a furled sail bundle under it
function yard(B, x, y, len, furl){ beam(B.p(YARD), [x, y, -len/2], [x, y, len/2], 0.17); if (furl) beam(B.p(SAIL), [x + 0.15, y - 0.35, -len*0.44], [x + 0.15, y - 0.35, len*0.44], 0.32, 0.3); }
const shroud = (B, a, b) => beam(B.p(LINE), a, b, 0.045);
// ---- the Balclutha (1886): 78 m hull + jib-boom, beam 11.8 m, three masts ~44 m
function balclutha(B){
  const L = 78, Bm = 11.8, yD = 2.6;
  const cols = (y, dy) => y < 0.2 ? HR : (dy > -1.25 && dy < -0.55 ? WS : HB);
  const H = hull(B, L, Bm, -4.5, yD, {cols, bulw:1.2, sheer:0.6, fine:0.28, bowRise:2.5});
  // poop and forecastle decks, deck houses, hatches
  box(B.p(DECK), -39, -24, yD + 1.6, yD + 1.8, -5.2, 5.2); box(B.p(HB), -38.6, -24, yD, yD + 1.6, -5.4, 5.4); box(B.p(WS), -24.2, -23.8, yD, yD + 1.7, -5.0, 5.0);
  box(B.p(DECK), 29, 38, yD + 2.2, yD + 2.4, -4.6, 4.6); box(B.p(HB), 29, 36.5, yD + 0.6, yD + 2.2, -5.0, 5.0);
  box(B.p(WS), -6, 6, yD, yD + 2.4, -2.4, 2.4); box(B.p(DECK), -6.3, 6.3, yD + 2.4, yD + 2.6, -2.7, 2.7); box(B.p(WS), 13, 18, yD, yD + 2.0, -2, 2);
  for (const x of [-15, 9, 21]) box(B.p(WOOD2), x - 2, x + 2, yD, yD + 0.7, -2.2, 2.2);
  box(B.p(WS), -33, -29, yD + 1.8, yD + 3.6, -1.6, 1.6);                        // wheel house / chart house on the poop
  // the three masts: lower mast, topmast, topgallant-royal
  const MS = [[22, 0.97], [1, 1.0], [-18, 0.82]];
  for (const [mx, f] of MS){ const y0 = yD;
    const segs = [[17*f, 0.42*f, 0.36*f, 0], [13*f, 0.3*f, 0.24*f, 0], [13*f, 0.18*f, 0.08*f, 0]]; mast(B, mx, y0, segs, MAST);
    const yards = [[11.5, 26], [17.5, 23], [22.5, 21], [28, 17], [32.5, 14], [36.5, 11]];
    for (const [yy, len] of yards) yard(B, mx, y0 + yy*f, len*f, true);
    // shrouds to the rails and back-stays aft
    for (const sz of [-1, 1]){ for (let k = -2; k <= 1; k++) shroud(B, [mx + k*0.9 - 0.6, yD + 1.0, sz*(Bm/2 - 0.1)], [mx, y0 + 16.5*f, sz*0.4]);
      for (let k = 0; k < 2; k++) shroud(B, [mx - 6 - k*2, yD + 1.0, sz*(Bm/2 - 0.1)], [mx, y0 + (29.5 + k*6)*f, sz*0.2]); } }
  // fore-and-aft stays, bowsprit and jib-boom, spanker gaff and boom on the mizzen
  const bowX = L/2, bowY = H.yd(1) + 0.4;
  beam(B.p(MAST), [bowX - 3, bowY, 0], [bowX + 17, bowY + 5.5, 0], 0.3);
  shroud(B, [22, yD + 42.8*0.97, 0], [bowX + 17, bowY + 5.5, 0]); shroud(B, [22, yD + 16.5*0.97, 0], [bowX + 6, bowY + 1.8, 0]); shroud(B, [22, yD + 29*0.97, 0], [bowX + 12, bowY + 3.8, 0]);
  shroud(B, [1, yD + 43, 0], [22, yD + 30*0.97, 0]); shroud(B, [1, yD + 17, 0], [22, yD + 11*0.97, 0]); shroud(B, [-18, yD + 35, 0], [1, yD + 28, 0]); shroud(B, [-18, yD + 14, 0], [1, yD + 10, 0]);
  beam(B.p(YARD), [-18, yD + 4, 0], [-38, yD + 3.5, 0], 0.16); beam(B.p(YARD), [-18, yD + 12, 0], [-33, yD + 9.5, 0], 0.14); beam(B.p(SAIL), [-19, yD + 4.3, 0], [-36, yD + 3.9, 0], 0.32, 0.3);
  // white figurehead / trailboards at the bow, riding light
  beam(B.p(WS), [bowX - 1.2, bowY - 0.6, 0], [bowX + 1.6, bowY + 0.8, 0], 0.25); box(B.p(LAMP), bowX + 15.6, bowX + 16, bowY + 5.2, bowY + 5.6, -0.2, 0.2);
}
// ---- C.A. Thayer (1895): three-masted schooner, 48 m hull, black, gaff rig with furled sails, bowsprit
function thayer(B){
  const L = 47.5, Bm = 10.9, yD = 2.2, cols = (y, dy) => y < 0.15 ? HR : HB;
  const H = hull(B, L, Bm, -3.6, yD, {cols, bulw:0.9, sheer:0.9, fine:0.32, bowRise:2.0, bulwC:WS});
  box(B.p(WS), -22, -15, yD, yD + 2.2, -3.0, 3.0); box(B.p(WS), 8, 13, yD, yD + 2.0, -2.2, 2.2); box(B.p(DECK), -22.3, -14.7, yD + 2.2, yD + 2.4, -3.3, 3.3);
  for (const [mx, h] of [[13, 30], [0, 31], [-13, 30]]){ cyl(B.p(MAST), mx, 0, 0.32, 0.22, yD, yD + h*0.72, 8); cyl(B.p(MAST), mx, 0, 0.18, 0.08, yD + h*0.68, yD + h, 6);
    beam(B.p(YARD), [mx, yD + 2.5, 0], [mx - 12, yD + 2.8, 0], 0.14); beam(B.p(SAIL), [mx - 0.5, yD + 3.0, 0], [mx - 11.5, yD + 3.2, 0], 0.4, 0.35); beam(B.p(YARD), [mx, yD + h*0.66, 0], [mx - 9, yD + h*0.66 - 3, 0], 0.12);
    for (const sz of [-1, 1]) for (let k = 0; k < 3; k++) shroud(B, [mx + k*0.9 - 0.9, yD + 0.8, sz*(Bm/2 - 0.2)], [mx, yD + h*0.68, 0]); }
  const bowX = L/2, bowY = H.yd(1) + 0.3; beam(B.p(MAST), [bowX - 2, bowY, 0], [bowX + 12, bowY + 3.5, 0], 0.24);
  shroud(B, [13, yD + 30, 0], [bowX + 12, bowY + 3.5, 0]); shroud(B, [13, yD + 21, 0], [bowX + 5, bowY + 1.4, 0]); shroud(B, [0, yD + 30, 0], [13, yD + 22, 0]); shroud(B, [-13, yD + 29, 0], [0, yD + 21, 0]);
}
// ---- Eureka (1890): double-ended side-wheel ferry, 84 m, guards 23.8 m wide
function eureka(B){
  const L = 84, Bm = 12.8, yD = 1.9, cols = (y, dy) => y < 0.1 ? HR : HB;
  hull(B, L, Bm, -3.0, yD - 0.4, {cols, sheer:0.25, fine:0.3, dbl:true});
  const GW = 11.9, G = x => GW*Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(x)/(L/2 - 1), 5)));
  const OUT = []; for (let i = 0; i <= 24; i++){ const x = -L/2 + 1 + (L - 2)*i/24; OUT.push([x, -G(x)]); } for (let i = 24; i >= 0; i--){ const x = -L/2 + 1 + (L - 2)*i/24; OUT.push([x, G(x)]); }
  const ws = B.p(WS), win = B.p(WIN);
  prism(B.p(HB), OUT, yD - 0.6, yD); walls(ws, OUT, yD, yD + 0.25);                                          // the guards (main deck edge)
  // main deck house (freight / car deck): white sides with openings; saloon deck house above with rows of windows
  const MH = OUT.map(([x, z]) => [x*0.9, z*0.88]);
  prism(ws, MH, yD, yD + 3.6); winRows(win, MH, yD + 1.2, yD + 2.6, 2.4, 1.3, 3);
  capP(B.p(DECK), OUT.map(([x, z]) => [x*0.94, z*0.94]), yD + 3.75); walls(ws, OUT.map(([x, z]) => [x*0.94, z*0.94]), yD + 3.6, yD + 4.6);
  const SH = OUT.map(([x, z]) => [x*0.74, z*0.7]); prism(ws, SH, yD + 3.75, yD + 6.9); winRows(win, SH, yD + 4.6, yD + 6.2, 1.6, 1.0, 3);
  capP(B.p(WS), SH.map(([x, z]) => [x*1.03, z*1.06]), yD + 7.0); walls(ws, SH.map(([x, z]) => [x*1.03, z*1.06]), yD + 6.9, yD + 7.2);
  // pilot houses at both ends
  for (const sx of [-1, 1]){ const x = sx*28; box(ws, x - 2.0, x + 2.0, yD + 7.2, yD + 9.6, -2.2, 2.2); for (const z of [-1.2, 0, 1.2]) box(win, x + sx*2.0 - 0.06, x + sx*2.0 + 0.06, yD + 8.2, yD + 9.2, z - 0.45, z + 0.45);
    box(B.p(WS), x - 2.4, x + 2.4, yD + 9.6, yD + 9.9, -2.6, 2.6); box(B.p(LAMP), x - 0.15, x + 0.15, yD + 9.9, yD + 10.3, -0.15, 0.15); }
  // paddle boxes on both sides amidships
  for (const sz of [-1, 1]){ const P = []; for (let i = 0; i <= 12; i++){ const a = PI*i/12; P.push([Math.cos(a)*6.4, yD - 0.2 + Math.sin(a)*5.8]); }
    for (const zz of [GW - 0.4, GW + 0.9]){ const z = sz*zz; for (const f of triPoly(P)) t3(ws, V(P[f[0]][0], P[f[0]][1], z), V(P[f[1]][0], P[f[1]][1], z), V(P[f[2]][0], P[f[2]][1], z)); }
    for (let i = 0; i < 12; i++){ const a = P[i], b = P[i + 1]; q4(ws, V(a[0], a[1], sz*(GW - 0.4)), V(b[0], b[1], sz*(GW - 0.4)), V(b[0], b[1], sz*(GW + 0.9)), V(a[0], a[1], sz*(GW + 0.9))); }
    for (let i = 1; i < 12; i += 2){ const a = PI*i/12; beam(B.p(BUFF), [0, yD + 0.3, sz*(GW + 0.95)], [Math.cos(a)*5.9, yD - 0.2 + Math.sin(a)*5.3, sz*(GW + 0.95)], 0.12); } }
  // the walking beam on its A-frame gallows, the tall black stack with its steam pipe
  const yb = yD + 7.2; for (const sz of [-1, 1]){ beam(B.p(WOOD2), [-3.5, yb, sz*1.8], [0, yb + 8.4, sz*0.5], 0.22); beam(B.p(WOOD2), [3.5, yb, sz*1.8], [0, yb + 8.4, sz*0.5], 0.22); }
  { const D = [[-6.5, yb + 8.4], [0, yb + 10.0], [6.5, yb + 8.4], [0, yb + 6.8]], o = B.p(STK);
    for (let i = 0; i < 4; i++){ const a = D[i], b = D[(i + 1) % 4]; beam(o, [a[0], a[1], 0], [b[0], b[1], 0], 0.16); }
    beam(o, [-6.5, yb + 8.4, 0], [6.5, yb + 8.4, 0], 0.2); beam(o, [0, yb + 6.8, 0], [0, yb + 10.0, 0], 0.14); disc(o, [0, yb + 8.4, -0.6], [0, 0, 1], 0.5, 1.2, 8);
    for (const sx of [-1, 1]) beam(o, [sx*6.5, yb + 8.4, 0], [sx*6.3, yb + 1.0, 0], 0.12); }
  cyl(B.p(STK), -10, 0, 1.05, 1.05, yb, yb + 14.5, 12); cyl(B.p(STK), -10, 0, 1.25, 1.25, yb + 14.5, yb + 15.2, 12); cyl(B.p(PIER), -11.4, 0, 0.2, 0.2, yb, yb + 13.5, 6);
  // flagstaffs at the ends
  for (const sx of [-1, 1]) cyl(B.p(MAST), sx*(L/2 - 4), 0, 0.08, 0.05, yD + 4.6, yD + 12, 5);
}
// ---- Hercules (1907): steam tug, 41 m, black hull, white/buff upperworks, tall buff funnel with a black top
function hercules(B){
  const L = 41, Bm = 8.8, yD = 1.7, cols = (y, dy) => y < 0.1 ? HR : HB;
  const H = hull(B, L, Bm, -3.4, yD, {cols, bulw:0.8, sheer:0.7, fine:0.35, bowRise:2.0});
  box(B.p(WS), -12, 9, yD, yD + 2.6, -3.0, 3.0); box(B.p(WS), 4, 9, yD + 2.6, yD + 5.2, -2.2, 2.2); box(B.p(WS), 3.6, 9.4, yD + 5.2, yD + 5.45, -2.6, 2.6);
  for (const z of [-1.2, 0, 1.2]) box(B.p(WIN), 9.0, 9.1, yD + 3.6, yD + 4.6, z - 0.4, z + 0.4);
  cyl(B.p(BUFF), -2, 0, 1.0, 1.0, yD + 2.6, yD + 10.5, 10); cyl(B.p(STK), -2, 0, 1.05, 1.05, yD + 10.5, yD + 12, 10);
  cyl(B.p(MAST), 12, 0, 0.18, 0.1, yD + 0.8, yD + 13, 6); cyl(B.p(MAST), -10, 0, 0.12, 0.07, yD + 2.6, yD + 9, 6);
  for (const x of [-14, -8]) cyl(B.p(PIER), x, 1.8, 0.35, 0.35, yD + 2.6, yD + 4.2, 6);
}
// ---- Alma (1891): scow schooner, 18 m, flat square-ended hull, two gaff masts with tan furled sails
function alma(B){
  const L = 18.6, Bm = 6.8, yD = 1.3, cols = (y, dy) => y < 0.05 ? HR : (dy > -0.35 ? WS : GRN);
  hull(B, L, Bm, -1.3, yD, {cols, bulw:0.45, sheer:0.35, fine:0.18, scow:true, bowRise:1.0});
  box(B.p(WS), -7.4, -4.2, yD, yD + 1.3, -1.6, 1.6);
    for (const [mx, h] of [[3.4, 19], [-2.6, 20]]){ cyl(B.p(MAST), mx, 0, 0.2, 0.12, yD, yD + h, 8); beam(B.p(YARD), [mx, yD + 1.6, 0], [mx - (mx > 0 ? 5.6 : 9.6), yD + 1.9, 0], 0.11);
    beam(B.p(BUFF), [mx - 0.4, yD + 2.1, 0], [mx - (mx > 0 ? 5.2 : 9.0), yD + 2.3, 0], 0.32, 0.3); beam(B.p(YARD), [mx, yD + h*0.75, 0], [mx - 5, yD + h*0.62, 0], 0.09);
    for (const sz of [-1, 1]) shroud(B, [mx - 0.3, yD + 0.4, sz*(Bm/2 - 0.1)], [mx, yD + h*0.78, 0]); }
  beam(B.p(MAST), [L/2 - 0.5, yD + 0.9, 0], [L/2 + 6, yD + 2.4, 0], 0.16); shroud(B, [3.4, yD + 19, 0], [L/2 + 6, yD + 2.4, 0]);
}
LANDMARKS.sfhyde = {zh:'海德街码头历史船只', en:'Hyde Street Pier', cat:'old', r:PL[K][3], h:40, lt:{m:0, c:'#ffe0b4', k:0.35, e:0.5},
  build(){
    const g = new THREE.Group(), s = frame(g, K), B = mkB(), r = LMCTX.rng;
    // ---- the pier: timber deck on piles along the OSM outline (outer section and the knee), stringer, bollards, lamps, sheds
    const PO = [[-96,-7.2],[-80,-7.1],[-80.1,-2.3],[65.2,-4.6],[65.2,-7.2],[76.7,-7.4],[76.7,-4.6],[84,-4.7],[84,1.3],[-91.8,5.6],[-96,5.8]];
    prism(B.p(PIER), PO, PD - 0.6, PD); walls(B.p(PILE), PO, PD - 0.9, PD - 0.55);
    { const pl = B.p(PILE); for (let x = -94; x <= 82; x += 3.5){ const zs = x < -80 ? -6.9 : -2.3 - 2.3*(x + 80)/145, zn = 5.6 - 4.3*(x + 92)/176; for (const z of [zs + 0.3, (zs + zn)/2, zn - 0.3]) cyl(pl, x, z, 0.22, 0.22, -3.5, PD - 0.6, 6); } }
    { const bo = B.p(YARD); for (let x = -90; x <= 82; x += 9){ const zs = x < -80 ? -6.9 : -2.3 - 2.3*(x + 80)/145, zn = 5.6 - 4.3*(x + 92)/176; cyl(bo, x, zs + 0.45, 0.22, 0.22, PD, PD + 0.6, 6); cyl(bo, x + 4, zn - 0.45, 0.22, 0.22, PD, PD + 0.6, 6); } }
    for (let x = -88; x <= 80; x += 24){ const zn = 5.6 - 4.3*(x + 92)/176 - 0.6; cyl(B.p(GRN), x, zn, 0.1, 0.08, PD, PD + 4.6, 6); box(B.p(LAMP), x - 0.25, x + 0.25, PD + 4.5, PD + 5.1, zn - 0.25, zn + 0.25); }
    box(B.p(WOOD2), -70, -60, PD, PD + 3.2, -1.6, 3.6); gableRoof(B, -65, 1.0, 10.6, 5.8, PD + 3.2, 1.6, LINE);             // small timber sheds on the pier
    box(B.p(WOOD2), 66, 76, PD, PD + 3.0, -6.8, -3.2); gableRoof(B, 71, -5.0, 10.6, 4.2, PD + 3.0, 1.4, LINE);
    // ---- the ships (sea level 0)
    pushT(28, 0, -9.8, 0); balclutha(B); popT();
    pushT(-48, 0, -8.8, PI); thayer(B); popT();
    pushT(40, 0, 15.3, 0); eureka(B); popT();
    pushT(-40, 0, 9.3, 0); hercules(B); popT();
    pushT(89.9, 0, 12.8, PI/2 + 0.04); alma(B); popT();
    B.flush(s); return g; }};
function gableRoof(B, cx, cz, L, W, y, h, col){ const o = B.p(col); q4(o, V(cx - L/2, y, cz - W/2), V(cx + L/2, y, cz - W/2), V(cx + L/2, y + h, cz), V(cx - L/2, y + h, cz)); q4(o, V(cx - L/2, y, cz + W/2), V(cx + L/2, y, cz + W/2), V(cx + L/2, y + h, cz), V(cx - L/2, y + h, cz));
  for (const sx of [-1, 1]) t3(o, V(cx + sx*L/2, y, cz - W/2), V(cx + sx*L/2, y, cz + W/2), V(cx + sx*L/2, y + h, cz)); }
place(K);
// ---- the Aquatic Park Bathhouse (1939)
const BW = {c:'#f3f1ea', lk:0.95}, BW2 = {c:'#dcdad2', lk:0.8}, BWIN = {c:'#33424d', glow:'#ffe2b0', gk:0.6}, BRL = '#cfd3d2', BTR = '#5f8f92';
function stad(L, W, n){ const P = [], r = W/2, c = L/2 - r; for (let i = 0; i <= n; i++){ const a = -PI/2 + PI*i/n; P.push([c + Math.cos(a)*r, Math.sin(a)*r]); } for (let i = 0; i <= n; i++){ const a = PI/2 + PI*i/n; P.push([-c + Math.cos(a)*r, Math.sin(a)*r]); } return P; }
LANDMARKS.sfhyde2 = {zh:'水上公园浴场', en:'Aquatic Park Bathhouse', cat:'old', r:PL.sfhyde2[3], h:16, lt:{m:0, c:'#fff4e2', k:0.8, e:0.5},
  build(){
    const g = new THREE.Group(), s = frame(g, 'sfhyde2'), B = mkB(), gy = (x, z) => gl('sfhyde2', x, z);
    const G = Math.max(gy(-30, 0), gy(0, 0), gy(30, 0), gy(0, -8), gy(0, 8)), lo = Math.min(glo('sfhyde2', -39, 0), glo('sfhyde2', 39, 0), glo('sfhyde2', 0, -9), glo('sfhyde2', 0, 9)) - 1.5;
    const w = B.p(BW), w2 = B.p(BW2), win = B.p(BWIN), rl = B.p(BRL);
    const L1 = stad(77.6, 16.4, 10), L2 = stad(72, 13.0, 10), L3 = stad(44, 9.6, 8), L4 = stad(14, 6.4, 6);
    prism(w2, L1, lo, G + 0.4); prism(w, L1, G + 0.4, G + 4.8); walls(w2, L1.map(p => [p[0]*1.004, p[1]*1.03]), G + 4.6, G + 5.0);
    winRows(win, L1, G + 1.4, G + 3.9, 2.6, 2.0, 2);
    capP(B.p('#c9c4b8'), L1, G + 4.85); walls(rl, L1, G + 4.85, G + 5.9);                                 // the first deck with its railing
    prism(w, L2, G + 4.85, G + 8.6); winRows(win, L2, G + 5.9, G + 7.7, 2.2, 1.7, 2);
    capP(B.p('#c9c4b8'), L2, G + 8.7); walls(rl, L2, G + 8.7, G + 9.7);
    prism(w, L3, G + 8.7, G + 11.9); { const P = L3; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], Lq = Math.hypot(b[0] - a[0], b[1] - a[1]); if (Lq < 3) continue; const n = Math.floor(Lq/2.4);
      for (let k = 0; k < n; k++){ const t = (k + 0.5)/n, x = lerp(a[0], b[0], t), z = lerp(a[1], b[1], t), nz = z > 0 ? 1 : -1; disc(win, [x, G + 10.3, z + nz*0.02], [0, 0, nz], 0.55, 0.06, 8); } } }
    capP(B.p('#c9c4b8'), L3, G + 12.0); walls(rl, L3, G + 12.0, G + 12.9);
    prism(w, L4, G + 12.0, G + 14.6); winRows(win, L4, G + 12.9, G + 14.0, 1.5, 1.0, 1.4); walls(B.p(BTR), L4.map(p => [p[0]*1.02, p[1]*1.04]), G + 14.4, G + 14.8);
    // the bands of blue-green trim, the masts on the roof, the entrance on Beach Street (south)
    walls(B.p(BTR), L1.map(p => [p[0]*1.003, p[1]*1.02]), G + 0.4, G + 0.7); walls(B.p(BTR), L2.map(p => [p[0]*1.003, p[1]*1.02]), G + 8.3, G + 8.55);
    for (const x of [-4, 4]) cyl(rl, x, 0, 0.12, 0.08, G + 14.6, G + 21, 6);
    box(B.p(BTR), -6, 6, G + 3.6, G + 3.9, 8.1, 10.4); box(win, -4, 4, G + 0.5, G + 3.4, 8.15, 8.3);
    // the beach-side terrace and steps (north)
    box(w2, -30, 30, lo, G + 0.4, -12.5, -8); for (let i = 0; i < 4; i++) box(w2, -26, 26, lo, G + 0.1 - i*0.35, -12.5 - (i + 1)*0.5, -12.5 - i*0.5);
    B.flush(s); return g; }};
place('sfhyde2');
}

}
