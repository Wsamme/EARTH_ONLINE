// ===== bay/sfwater — San Francisco waterfront and park landmarks for the City Brush Bay Area 1:1 map (v22).
// Keys: oraclepark (ballpark, 2000), chasecenter (arena, 2019), alcatraz (the island and its buildings), pier39 / pier39b /
// pier39c (Pier 39: the entrance, the middle, and the end with the carousel and the sea-lion floats of K-Dock),
// ghirardelli (Ghirardelli Square), deyoung (de Young Museum, 2005), conservatory (Conservatory of Flowers, 1879).
// Every model is built in the reference frame of bay/ref_sfwater.json (x east, z south, metres from the reference anchor) on
// the real OSM footprints, at absolute heights above the sea: build() reads the base height the app picked (LMCTX.u.base)
// and shifts an inner group down by it, so terraces, fields and decks sit at their real levels whatever the terrain under r.
// No text, logos or brand marks anywhere (the ballpark's bottle and the square's sign letters are left out).
{
const PI = Math.PI, TAU = PI*2;
// ---------- the app's ground (90 m DEM patches, raw values; hC = max(-0.3, bilinear)) around the sites on land
const DEM = {
  oraclepark:[-17598.19, 17047.91, 201, 586, 8, 8, [-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,4.5,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-5.7,6.2,4.8,-0.3,-0.3,-0.3,-0.3,-0.3,-5.8,6.9,6.6,4.8,4.1,-0.3,-0.3,-0.3,-7.4,7.9,7.5,6.2,4.4,-0.3,-0.3,-0.3,-6.2,10.3,9,7,5.3,-0.3,-0.3,-0.3,-0.3,11.8,10.7,9,4.3,-0.3,-0.3,-0.3,-0.3]],
  chase:[-17456.91, 15871.43, 204, 574, 5, 6, [4.8,4.2,-0.3,-0.3,-0.3,4.5,4.1,4,-0.3,-0.3,4.4,4,2.2,-0.3,-0.3,4.1,3.9,3.6,3.4,-0.3,3.8,3.5,3.7,-0.3,-0.3,3.2,3.5,3.5,-0.3,-0.3]],
  ghirardelli:[-20565.07, 20077.91, 169, 621, 6, 5, [26.3,26.3,29.1,35.2,38.8,40.3,23.8,21.1,21.7,25.7,26.6,27.9,-0.3,-0.3,-0.3,18.6,18.2,20.1,-0.3,-0.3,-0.3,-0.3,-0.3,10.9,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3]],
  deyoung:[-24600.38, 16248.79, 124, 578, 6, 6, [86.3,86.3,75.1,75,77.3,75.4,86.3,86.3,75.2,72,73.6,77.3,70.8,69.6,75.7,74.7,71.3,74.2,71,71.1,72.5,75,73.9,74.4,67.9,64.1,74.2,74.4,72,73.8,70.5,70,69.8,70.9,70.9,72.6]],
  conservatory:[-23858.66, 16381.98, 133, 580, 5, 5, [77.9,81,80.1,74.8,74.9,74.3,72.8,72.1,73.9,75.3,80.6,77.5,77.2,74.6,76.5,77.3,75.3,71.1,83.4,86.9,70.8,71.3,71.4,73.6,79.5]]
};
// reference anchors of bay/ref_sfwater.json (lat, lon); a key's origin is the anchor moved by (ox east, oz south) metres
const REF = {oraclepark:[37.7786, -122.3893], chase:[37.768, -122.3877], alcatraz:[37.8267, -122.423], pier39:[37.8087, -122.4098],
  ghirardelli:[37.8059, -122.4229], deyoung:[37.7714, -122.4686], conservatory:[37.7726, -122.4602]};
const place = (type, ref, ox, oz) => SG_PLACES.push({type, lat:+(REF[ref][0] - oz/110989).toFixed(7), lon:+(REF[ref][1] + ox/88300).toFixed(7), rot:0});
function gnd(k, x, z){
  const D = DEM[k]; if (!D) return -0.3;
  let fx = (D[0] + x + 36000)/90 - D[2], fy = (D[1] - z + 36000)/90 - D[3];
  fx = Math.min(D[4] - 1.0001, Math.max(0, fx)); fy = Math.min(D[5] - 1.0001, Math.max(0, fy));
  const i = fx | 0, j = fy | 0, u = fx - i, v = fy - j, H = D[6], n = D[4], q = j*n + i;
  return Math.max(-0.3, (H[q]*(1 - u) + H[q+1]*u)*(1 - v) + (H[q+n]*(1 - u) + H[q+n+1]*u)*v);
}
// the height the app gives local y = 0 (highest ground within r at 0, 0.35 r, 0.7 r, + 0.6 m); the model kit passes base 0
function baseOf(k, ox, oz, r){
  const u = LMCTX && LMCTX.u && LMCTX.u.base; if (u && u.value !== 0) return u.value;
  let lo = 1e9; for (let a = 0; a < 12; a++) for (const f of [0, 0.35, 0.7]) lo = Math.min(lo, gnd(k, ox + Math.cos(a/12*TAU)*r*f, oz - Math.sin(a/12*TAU)*r*f));
  return lo + 0.6;       // kit preview only: sit the model on its lowest ground (the app uses the highest)
}
// inner group in the reference frame at absolute heights
function frame(g, k, ox, oz, r){ const B = baseOf(k, ox, oz, r), s = new THREE.Group(); s.position.set(-ox, -B, -oz); g.add(s); return s; }
// ---------- triangle batches: one LTris call per colour
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const q4 = (o, a, b, c, d) => o.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2]);
const t3 = (o, a, b, c) => o.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t];
function box(o, x0, x1, y0, y1, z0, z1, bot){
  const A = [x0, y0, z0], B = [x1, y0, z0], C = [x1, y0, z1], D = [x0, y0, z1], E = [x0, y1, z0], F = [x1, y1, z0], G = [x1, y1, z1], H = [x0, y1, z1];
  q4(o, E, H, G, F); q4(o, A, B, F, E); q4(o, B, C, G, F); q4(o, C, D, H, G); q4(o, D, A, E, H); if (bot) q4(o, A, D, C, B);
}
// oriented box: centre (cx, cz), long axis at angle th in the plan (x east, z south), length L, width W
function obox(o, cx, cz, L, W, y0, y1, th, bot){
  const c = Math.cos(th || 0), s = Math.sin(th || 0), l = L/2, w = W/2, P = (u, v, y) => [cx + u*c - v*s, y, cz + u*s + v*c];
  const A = P(-l, -w, y0), B = P(l, -w, y0), C = P(l, w, y0), D = P(-l, w, y0), E = P(-l, -w, y1), F = P(l, -w, y1), G = P(l, w, y1), H = P(-l, w, y1);
  q4(o, E, H, G, F); q4(o, A, B, F, E); q4(o, B, C, G, F); q4(o, C, D, H, G); q4(o, D, A, E, H); if (bot) q4(o, A, D, C, B);
}
// box along a plan segment a-b, width w
function sbox(o, a, b, w, y0, y1, ext){ const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz); if (L < 1e-3) return; obox(o, (a[0] + b[0])/2, (a[1] + b[1])/2, L + (ext || 0), w, y0, y1, Math.atan2(dz, dx)); }
// member between two 3-D points (square section, half width w)
function beam(o, a, b, w){
  let dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]; const L = Math.hypot(dx, dy, dz); if (L < 1e-4) return; dx /= L; dy /= L; dz /= L;
  let sx = -dz, sz = dx; const sl = Math.hypot(sx, sz); if (sl < 1e-3){ sx = 1; sz = 0; } else { sx /= sl; sz /= sl; }
  const ux = -sz*dy, uy = sz*dx - sx*dz, uz = sx*dy, P = (p, i, j) => [p[0] + sx*w*i + ux*w*j, p[1] + uy*w*j, p[2] + sz*w*i + uz*w*j];
  const a1 = P(a, -1, -1), a2 = P(a, 1, -1), a3 = P(a, 1, 1), a4 = P(a, -1, 1), b1 = P(b, -1, -1), b2 = P(b, 1, -1), b3 = P(b, 1, 1), b4 = P(b, -1, 1);
  q4(o, a1, a2, b2, b1); q4(o, a2, a3, b3, b2); q4(o, a3, a4, b4, b3); q4(o, a4, a1, b1, b4);
}
const area2 = R => { let s = 0; for (let i = 0; i < R.length; i++){ const a = R[i], b = R[(i+1) % R.length]; s += a[0]*b[1] - b[0]*a[1]; } return s/2; };
// polygon cap at height y (ear clipping, concave rings fine)
function cap(o, R, y){
  const tri = THREE.ShapeUtils.triangulateShape(R.map(p => new THREE.Vector2(p[0], p[1])), []);
  for (const [a, b, c] of tri) t3(o, [R[a][0], y, R[a][1]], [R[c][0], y, R[c][1]], [R[b][0], y, R[b][1]]);
}
function walls(o, R, y0, y1, open){ const n = R.length; for (let i = 0; i < (open ? n - 1 : n); i++){ const a = R[i], b = R[(i+1) % n]; q4(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); } }
function prism(o, R, y0, y1, top){ walls(o, R, y0, y1); if (top !== false) cap(o, R, y1); }
// sloped walls (base follows a function of the plan point)
function wallsG(o, R, yb, y1){ const n = R.length; for (let i = 0; i < n; i++){ const a = R[i], b = R[(i+1) % n]; q4(o, [a[0], yb(a), a[1]], [b[0], yb(b), b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); } }
// ring offset (positive = outward), simple miter
function offRing(R, d){
  const s = area2(R) > 0 ? 1 : -1, n = R.length, out = [];
  for (let i = 0; i < n; i++){
    const p = R[(i + n - 1) % n], c = R[i], q = R[(i+1) % n];
    let e1 = [c[0] - p[0], c[1] - p[1]], e2 = [q[0] - c[0], q[1] - c[1]]; const l1 = Math.hypot(...e1) || 1, l2 = Math.hypot(...e2) || 1;
    const n1 = [s*e1[1]/l1, -s*e1[0]/l1], n2 = [s*e2[1]/l2, -s*e2[0]/l2]; let m = [n1[0] + n2[0], n1[1] + n2[1]]; const ml = Math.hypot(...m) || 1; m = [m[0]/ml, m[1]/ml];
    const k = Math.min(3, 1/Math.max(0.3, m[0]*n1[0] + m[1]*n1[1])); out.push([c[0] + m[0]*d*k, c[1] + m[1]*d*k]);
  }
  return out;
}
// facade decals on a ring: features placed along each edge, standing off the wall by d (outward)
function edgeFrame(R, i){
  const s = area2(R) > 0 ? 1 : -1, a = R[i], b = R[(i+1) % R.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const t = [(b[0] - a[0])/L, (b[1] - a[1])/L]; return {a, b, L, t, n:[s*t[1], -s*t[0]]};
}
// rectangle on an edge frame E: u0..u1 along, y0..y1, offset d
function rectE(o, E, u0, u1, y0, y1, d){
  const P = (u, y) => [E.a[0] + E.t[0]*u + E.n[0]*d, y, E.a[1] + E.t[1]*u + E.n[1]*d];
  q4(o, P(u0, y0), P(u1, y0), P(u1, y1), P(u0, y1));
}
// round-headed opening: width w centred at u, sill y0, springing ys (top = ys + w/2)
function archE(o, E, u, w, y0, ys, d, seg){
  const P = (uu, y) => [E.a[0] + E.t[0]*uu + E.n[0]*d, y, E.a[1] + E.t[1]*uu + E.n[1]*d];
  q4(o, P(u - w/2, y0), P(u + w/2, y0), P(u + w/2, ys), P(u - w/2, ys));
  const n = seg || 6, c = P(u, ys); for (let k = 0; k < n; k++){ const a0 = PI*k/n, a1 = PI*(k + 1)/n; t3(o, c, P(u + Math.cos(a0)*w/2, ys + Math.sin(a0)*w/2), P(u + Math.cos(a1)*w/2, ys + Math.sin(a1)*w/2)); }
}
// a grid of openings on every edge of a ring: floors from y0 (height fh), bays of width bay, opening w x h; fn(o, E, u, y) or rect
function grid(o, R, y0, nf, fh, bay, w, h, d, opts){
  opts = opts || {};
  for (let i = 0; i < R.length; i++){
    const E = edgeFrame(R, i); if (E.L < (opts.minL || bay*0.8)) continue; if (opts.skip && opts.skip(E, i)) continue;
    const nb = Math.max(1, Math.floor(E.L/bay)), st = E.L/nb;
    for (let f = 0; f < nf; f++) for (let k = 0; k < nb; k++){
      const u = st*(k + 0.5), y = y0 + f*fh + (opts.sill || 0);
      if (opts.arch) archE(o, E, u, w, y, y + h - w/2, d, opts.seg); else rectE(o, E, u - w/2, u + w/2, y, y + h, d);
    }
  }
}
// ray (p + t n) against a ring: nearest t > 0
function rayRing(p, n, R){
  let best = Infinity;
  for (let i = 0; i < R.length; i++){
    const a = R[i], b = R[(i+1) % R.length], ex = b[0] - a[0], ez = b[1] - a[1], den = n[0]*ez - n[1]*ex; if (Math.abs(den) < 1e-9) continue;
    const t = ((a[0] - p[0])*ez - (a[1] - p[1])*ex)/den, u = ((a[0] - p[0])*n[1] - (a[1] - p[1])*n[0])/den;
    if (t > 0 && u >= 0 && u <= 1 && t < best) best = t;
  }
  return best;
}
function pip(R, x, z){ let c = false; for (let i = 0, j = R.length - 1; i < R.length; j = i++){ const a = R[i], b = R[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0])*(z - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; }
// resample a polyline to n points (by arc length)
function resample(P, n){
  const L = [0]; for (let i = 1; i < P.length; i++) L.push(L[i-1] + Math.hypot(P[i][0] - P[i-1][0], P[i][1] - P[i-1][1]));
  const T = L[L.length - 1], out = []; let j = 0;
  for (let k = 0; k < n; k++){ const s = T*k/(n - 1); while (j < P.length - 2 && L[j+1] < s) j++; const u = (s - L[j])/((L[j+1] - L[j]) || 1); out.push(lerp2(P[j], P[j+1], Math.min(1, Math.max(0, u)))); }
  return out;
}
// palm (Willie Mays Plaza, Pier 39): trunk and a crown of drooping fronds
function palm(B, x, y, z, h, r, trunk, leaf){
  const o = B.p(trunk); obox(o, x, z, 0.55, 0.55, y, y + h, r()*PI);
  const L = B.p(leaf), top = [x, y + h, z], n = 9;
  for (let k = 0; k < n; k++){ const a = k/n*TAU + r(), c = Math.cos(a), s = Math.sin(a), l = 3.6 + r()*1.2, w = 0.75;
    const m = [x + c*l*0.55, y + h + 0.6, z + s*l*0.55], e = [x + c*l, y + h - 1.4, z + s*l], sd = [-s*w, 0, c*w];
    t3(L, top, [m[0] + sd[0], m[1], m[2] + sd[2]], [m[0] - sd[0], m[1], m[2] - sd[2]]); t3(L, [m[0] + sd[0], m[1], m[2] + sd[2]], e, [m[0] - sd[0], m[1], m[2] - sd[2]]); }
}
// round tree (crown as an octahedron-ish blob)
function blob(o, x, y, z, rx, ry){
  const P = [[x + rx, y, z], [x, y, z + rx], [x - rx, y, z], [x, y, z - rx]], T = [x, y + ry, z], D = [x, y - ry*0.6, z];
  for (let k = 0; k < 4; k++){ const a = P[k], b = P[(k+1) % 4]; t3(o, a, b, T); t3(o, b, a, D); }
}
// ---------- a rotating light beam (lighthouse): a chain of soft additive light sprites along each beam, widening with the
// distance and fading out, turned about the lantern in the vertex shader (one Points object: the app never merges points,
// so it keeps its own late draw order and is drawn over the transparent water)
function lmBeam(g, c, len, w0, k1, nb, period, col, k){
  const pos = [], cl = [], ps = [], C = new THREE.Color(col);
  for (let b = 0; b < nb; b++){
    const a = b*TAU/nb, ca = Math.cos(a), sa = Math.sin(a);
    for (let d = 1.5; d < len; ){ const w = w0 + k1*d, f = Math.pow(1 - d/len, 1.4)*(k || 0.5);
      pos.push(c[0] + ca*d, c[1], c[2] + sa*d); cl.push(C.r*f, C.g*f, C.b*f); ps.push(3.0*w); d += Math.max(0.5, w*0.3); }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3)); geo.setAttribute('psize', new THREE.Float32BufferAttribute(ps, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(c[0], c[1], c[2]), len + 60);
  const mat = new THREE.PointsMaterial({size:1, map:lampTex, vertexColors:true, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, sizeAttenuation:true});
  const U = {uT:LMT, uP:{value:period}, uC:{value:new THREE.Vector3(c[0], c[1], c[2])}, uN:NIGHT.uNight};
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('uniform float size;', 'uniform float size;\nuniform float uT; uniform float uP; uniform vec3 uC; uniform float uN;\nattribute float psize;')
      .replace('#include <color_vertex>', '#include <color_vertex>\nvColor *= uN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n{ float a = uT*6.2831853/uP; float c = cos(a), s = sin(a); vec3 o = transformed - uC; transformed = uC + vec3(o.x*c - o.z*s, o.y, o.x*s + o.z*c); }')
      .replace('gl_PointSize = size;', 'gl_PointSize = size*psize;');
  };
  LMCTX.mats.set('beam|' + LMCTX.mats.size, mat);
  const p = new THREE.Points(geo, mat); p.renderOrder = 7; g.add(p); return p;
}

// =====================================================================================================================
// Oracle Park (2000, HOK Sport): red-brick and dark-green-steel ballpark on McCovey Cove. The three-deck grandstand wraps
// the infield from the left-field corner (2nd & King) round home plate to the right-field corner; the brick concourse
// facade follows King Street and the Willie Mays Plaza with the two 122 ft clock towers at 3rd & King and 2nd & King;
// light towers rise from the King Street and Third Street sides; the 24 ft brick right-field wall carries the arcade
// over the cove; bleachers in left field, the scoreboard in centre field, a generic four-fingered glove in the fan lot,
// 24 palms on the plaza. Field from the OSM pitch (home plate, foul lines, infield dirt) and the real fence distances.
// =====================================================================================================================
{
const K = 'oraclepark', OX = -35, OZ = 5, R0 = 178, YF = 2.8;
const HP = [-55.9, 26.45], UL = [0.644, -0.765], UR = [0.768, 0.641];
const FP = (a, b) => [HP[0] + a*UL[0] + b*UR[0], HP[1] + a*UL[1] + b*UR[1]];
const FD = (th, d) => { const c = Math.cos(th*PI/180), s = Math.sin(th*PI/180); return FP(d*c, d*s); };     // fence point at angle th from the LF line
// building outline (OSM): 2nd & King .. King St .. 3rd & King .. Willie Mays Plaza .. Lefty O'Doul .. the cove .. Seals Plaza .. the fan lot
const RING = [[-166.1,86.1],[-134.6,41.3],[-138.6,37.6],[-135.8,33.6],[-147.8,22.8],[-98.2,-28.2],[1.1,-127.7],[37.4,-93.3],[130,-2.1],[130.6,0.3],[127.9,6.9],[125.8,10],[121.1,14.7],[115.5,18],[117.5,47],[6.1,102],[-49,126.8],[-51.4,125.6],[-78.9,139.4],[-101.8,124.5],[-105.8,130.3],[-127.8,113.9],[-132,119.8]];
const INFIELD = [[-57.6,25.9],[-57.2,27.8],[-56.2,29.2],[-54.6,30.1],[-52.7,30.1],[-51.9,29.8],[-25.3,52],[-20.8,50],[-16.8,47.2],[-13.3,44],[-10.5,40.3],[-8.4,36.1],[-6.8,31.7],[-6.1,26.8],[-6.1,22],[-7,17.2],[-8.5,12.7],[-11,8.4],[-14.1,4.7],[-17.5,1.5],[-21.5,-1],[-25.8,-2.8],[-30.2,-4.1],[-52.5,22.4],[-54.3,22.3],[-56.1,23.1],[-57.3,24.8]];
const FENCE = [FD(0, 103.3), FD(17, 107.9), FD(33, 121.6), FD(45, 119.2), FD(62, 126.5), FD(90, 94.2)];
const BRICK = {c:'#9c4b36', lk:0.75}, BRICK2 = {c:'#7e3a2a', lk:0.6}, STEEL = '#30483b', SEAT = {c:'#2e5140', lk:0.3}, CONC = '#c9c3b6', RISER = CONC,
  GRASS = {c:'#4f8d3d', glow:'#4c9a3c', gk:0.55}, DIRT = {c:'#b0805a', glow:'#8a5e3e', gk:0.4}, WHITE = {c:'#f2f0ea', glow:'#ffffff', gk:0.5},
  GLASS = {c:'#38454e', glow:'#ffcf8c', gk:0.45}, LAMP = {c:'#f4f2e8', glow:'#fffaf0', gk:3.2}, DARK = '#23302a', ROOF = {c:'#8e8a82', lk:0.2},
  BOARD = {c:'#1d2326', glow:'#5d7f96', gk:0.7}, GLOVE = '#7a4b2c', TRUNK = GLOVE, LEAF = '#4d6a35', GRASS2 = {c:'#5a9a45', glow:'#55a844', gk:0.55};
LANDMARKS.oraclepark = {zh:'甲骨文球场', en:'Oracle Park', cat:'new', r:R0, h:72, lt:{m:0, c:'#ffd6a0', k:0.6},
  build(){
    const g = new THREE.Group(), s = frame(g, K, OX, OZ, R0), B = mkB(), r = LMCTX.rng;
    const gy = (x, z) => gnd(K, x, z);
    // ---- the playing field: grass floor inside the stands' front edge and the fence, warning track, infield, lines
    const S = [];
    for (let a = 116; a > 0.01; a -= 4) S.push({p:FP(a, -16), n:[-UR[0], -UR[1]]});
    const a0 = Math.atan2(-UR[1], -UR[0]); let da = Math.atan2(-UL[1], -UL[0]) - a0; while (da > PI) da -= TAU; while (da < -PI) da += TAU;
    for (let i = 0; i <= 8; i++){ const t = a0 + da*i/8; S.push({p:[HP[0] + 16*Math.cos(t), HP[1] + 16*Math.sin(t)], n:[Math.cos(t), Math.sin(t)]}); }
    for (let b = 4; b <= 92; b += 4) S.push({p:FP(-16, b), n:[-UL[0], -UL[1]]});
    const FIELD = S.map(q => q.p).concat([FENCE[5], FENCE[4], FENCE[3], FENCE[2], FENCE[1], FENCE[0]]);
    cap(B.p(GRASS), FIELD, YF);
    walls(B.p(CONC), FIELD, YF - 4, YF);
    // mowing stripes (lighter bands across the outfield)
    { const o = B.p(GRASS2);
      for (let k = 0; k < 9; k++){ const d0 = 40 + k*9, d1 = d0 + 4.5, P = []; for (let th = 2; th <= 88; th += 4) P.push(FD(th, d0)); for (let th = 88; th >= 2; th -= 4) P.push(FD(th, d1));
        const C = P.map(p => { const v = [p[0] - HP[0], p[1] - HP[1]], th = Math.atan2(v[0]*UR[0] + v[1]*UR[1], v[0]*UL[0] + v[1]*UL[1])*180/PI, lim = th < 17 ? 103.3 + (107.9 - 103.3)*th/17 : th < 33 ? 107.9 + 13.7*(th - 17)/16 : th < 45 ? 121.6 - 2.4*(th - 33)/12 : th < 62 ? 119.2 + 7.3*(th - 45)/17 : 126.5 - 32.3*(th - 62)/28, d = Math.hypot(...v);
          return d > lim - 5 ? [HP[0] + v[0]/d*(lim - 5), HP[1] + v[1]/d*(lim - 5)] : p; });
        cap(o, C, YF + 0.02); } }
    // warning track along the fence
    { const o = B.p(DIRT); for (let i = 0; i < FENCE.length - 1; i++){ const a = FENCE[i], b = FENCE[i+1], ia = lerp2(a, HP, 4.6/Math.hypot(a[0] - HP[0], a[1] - HP[1])), ib = lerp2(b, HP, 4.6/Math.hypot(b[0] - HP[0], b[1] - HP[1]));
      q4(o, [a[0], YF + 0.04, a[1]], [b[0], YF + 0.04, b[1]], [ib[0], YF + 0.04, ib[1]], [ia[0], YF + 0.04, ia[1]]); } }
    cap(B.p(DIRT), INFIELD, YF + 0.05);
    { const o = B.p(GRASS), P = [FP(3.9, 3.9), FP(25.3, 3.9), FP(25.3, 25.3), FP(3.9, 25.3)]; cap(o, P, YF + 0.08); }    // the infield grass inside the base paths
    { const o = B.p(DIRT), m = FP(13.04, 13.04); const P = []; for (let k = 0; k < 14; k++) P.push([m[0] + Math.cos(k/14*TAU)*2.7, m[1] + Math.sin(k/14*TAU)*2.7]); cap(o, P, YF + 0.35); walls(o, P, YF, YF + 0.35); }
    { const o = B.p(WHITE); const ln = (p, q, w) => { const d = [q[0] - p[0], q[1] - p[1]], L = Math.hypot(...d), n = [-d[1]/L*w, d[0]/L*w]; q4(o, [p[0] + n[0], YF + 0.12, p[1] + n[1]], [q[0] + n[0], YF + 0.12, q[1] + n[1]], [q[0] - n[0], YF + 0.12, q[1] - n[1]], [p[0] - n[0], YF + 0.12, p[1] - n[1]]); };
      ln(HP, FENCE[0], 0.08); ln(HP, FENCE[5], 0.08);
      for (const [a, b] of [[27.43, 0], [27.43, 27.43], [0, 27.43]]){ const c = FP(a, b); obox(o, c[0], c[1], 0.45, 0.45, YF, YF + 0.16, Math.atan2(UL[1], UL[0])); }
      obox(o, HP[0], HP[1], 0.5, 0.5, YF, YF + 0.14, Math.atan2(UL[1], UL[0]) + PI/4); }
    // ---- the grandstand: lower deck, club level, upper deck, stepped; front edge S, depth limited by the outline
    const N = S.length, prof = [];
    for (let i = 0; i < N; i++){
      const q = S[i], dmax = rayRing(q.p, q.n, RING) - 1.5, dl = Math.max(0, Math.min(24, dmax)), up = dmax > 40 ? Math.min(43, dmax) : 0;
      const P = [[0, YF], [0, YF + 1.3]], K1 = 12, yl = YF + 1.3, yh = YF + 1.3 + dl*0.36;
      for (let k = 0; k < K1; k++){ const d0 = dl*k/K1, d1 = dl*(k + 1)/K1, y1 = yl + (yh - yl)*(k + 1)/K1; P.push([d0, y1], [d1, y1]); }
      prof.push({P, dl, up, yh, q});
    }
    const at = (i, d, y) => { const q = S[i]; return [q.p[0] + q.n[0]*d, y, q.p[1] + q.n[1]*d]; };
    // lower deck: risers (concrete) and treads (seats)
    for (let i = 0; i < N - 1; i++){
      const A = prof[i], C = prof[i+1];
      for (let k = 0; k < A.P.length - 1; k++){
        const o = B.p(k === 0 ? DARK : (k % 2 ? RISER : SEAT));
        q4(o, at(i, A.P[k][0], A.P[k][1]), at(i + 1, C.P[k][0], C.P[k][1]), at(i + 1, C.P[k+1][0], C.P[k+1][1]), at(i, A.P[k+1][0], A.P[k+1][1]));
      }
      // the back of the lower deck: club glass under the upper deck, or a parapet and the concourse wall
      const yb = Math.min(A.yh, C.yh);
      if (A.up && C.up){
        q4(B.p(GLASS), at(i, A.dl, A.yh), at(i + 1, C.dl, C.yh), at(i + 1, C.dl, YF + 19), at(i, A.dl, YF + 19));
        // upper deck: fascia, soffit, 14 steps up to the back, rail, back wall
        const f0 = A.dl - 2.5, f1 = C.dl - 2.5;
        q4(B.p(STEEL), at(i, f0, YF + 19), at(i + 1, f1, YF + 19), at(i + 1, f1, YF + 22.6), at(i, f0, YF + 22.6));
        q4(B.p(DARK), at(i, f0, YF + 19), at(i + 1, f1, YF + 19), at(i + 1, C.up, YF + 36.5), at(i, A.up, YF + 36.5));
        const K2 = 14;
        for (let k = 0; k < K2; k++){
          const da0 = f0 + (A.up - f0)*k/K2, da1 = f0 + (A.up - f0)*(k + 1)/K2, dc0 = f1 + (C.up - f1)*k/K2, dc1 = f1 + (C.up - f1)*(k + 1)/K2;
          const y0 = YF + 22.6 + 17.4*k/K2, y1 = YF + 22.6 + 17.4*(k + 1)/K2;
          q4(B.p(RISER), at(i, da0, y0), at(i + 1, dc0, y0), at(i + 1, dc0, y1), at(i, da0, y1));
          q4(B.p(SEAT), at(i, da0, y1), at(i + 1, dc0, y1), at(i + 1, dc1, y1), at(i, da1, y1));
        }
        q4(B.p(STEEL), at(i, A.up, YF + 40), at(i + 1, C.up, YF + 40), at(i + 1, C.up, YF + 41.6), at(i, A.up, YF + 41.6));
        q4(B.p(STEEL), at(i, A.up, YF + 36.5), at(i + 1, C.up, YF + 36.5), at(i + 1, C.up, YF + 40), at(i, A.up, YF + 40));
        if (i % 3 === 0){ const p = at(i, A.up - 0.6, 0); obox(B.p(STEEL), p[0], p[2], 1.0, 1.0, 27.5, YF + 37, 0); const pm = at(i, (A.up + f0)/2, 0); obox(B.p(STEEL), pm[0], pm[2], 0.9, 0.9, A.yh, YF + 28, 0); }
        if (i % 2 === 0){ const p = at(i, A.up - 0.4, YF + 41.6); beam(B.p(STEEL), p, [p[0], p[1] + 3.2, p[2]], 0.12); }
      } else {
        q4(B.p(STEEL), at(i, A.dl, A.yh), at(i + 1, C.dl, C.yh), at(i + 1, C.dl, C.yh + 1.1), at(i, A.dl, A.yh + 1.1));
        q4(B.p(BRICK2), at(i, A.dl, YF), at(i + 1, C.dl, YF), at(i + 1, C.dl, C.yh), at(i, A.dl, A.yh));
      }
      // light poles on the upper deck rim every few samples: thin masts with small lamps (the main banks are the towers)
    }
    // upper deck end walls where it starts and stops
    for (let i = 0; i < N; i++){
      const A = prof[i], nb = prof[i - 1], na = prof[i + 1];
      if (A.up && (!nb || !nb.up || !na || !na.up)){
        const o = B.p(STEEL), f0 = A.dl - 2.5; q4(o, at(i, f0, YF + 19), at(i, A.up, YF + 24), at(i, A.up, YF + 41.6), at(i, f0, YF + 22.6)); q4(o, at(i, A.dl, A.yh), at(i, A.up, A.yh), at(i, A.up, YF + 24), at(i, A.dl, YF + 19));
      }
    }
    // dugouts: dark openings in the front wall along both lines
    { const o = B.p(DARK); for (const [i0, i1] of [[18, 23], [43, 48]]) for (let i = i0; i < i1; i++) q4(o, at(i, -0.05, YF), at(i + 1, -0.05, YF), at(i + 1, -0.05, YF + 1.1), at(i, -0.05, YF + 1.1)); }
    // ---- the concourse building behind the stands: brick facade with arches up to 15 m, green steel frame to 27 m, roof
    const back = []; for (let i = N - 1; i >= 0; i--){ const A = prof[i]; back.push([S[i].p[0] + S[i].n[0]*(A.up || A.dl), S[i].p[1] + S[i].n[1]*(A.up || A.dl)]); }
    const OUT = [RING[6], RING[5], RING[4], RING[3], RING[2], RING[1], RING[0], RING[22], RING[21], RING[20], RING[19], RING[18], RING[17], RING[16]];
    const YR = 27.5;
    cap(B.p(ROOF), OUT.concat(back), YR);
    { const RP = OUT.concat(back), o = B.p(CONC); for (let k = 0; k < 40; k++){ const i = (r()*OUT.length) | 0, j = (r()*back.length) | 0, p = lerp2(OUT[i], back[j], 0.25 + r()*0.5);
        if (pip(RP, p[0], p[1])) obox(o, p[0], p[1], 2 + r()*4, 2 + r()*3, YR, YR + 1 + r()*1.5, r()*PI); } }
    { const ob = B.p(BRICK), od = B.p(DARK), os = B.p(STEEL);
      for (let i = 0; i < OUT.length - 1; i++){
        const a = OUT[i], b = OUT[i+1], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 1) continue;
        const ya = Math.min(gy(...a), gy(...b)) - 1.5;
        q4(ob, [a[0], ya, a[1]], [b[0], ya, b[1]], [b[0], 15, b[1]], [a[0], 15, a[1]]);
        const t = [(b[0] - a[0])/L, (b[1] - a[1])/L], E = {a, b, L, t, n:[t[1], -t[0]]};
        // outward normal: away from the field centre
        const mid = lerp2(a, b, 0.5), fc = FP(45, 45); if ((mid[0] - fc[0])*E.n[0] + (mid[1] - fc[1])*E.n[1] < 0) E.n = [-E.n[0], -E.n[1]];
        const inset = (u, d) => [a[0] + t[0]*u - E.n[0]*d, b[1]*0 + a[1] + t[1]*u - E.n[1]*d];
        // recessed steel level (dark void behind a frame)
        const i0 = inset(0, 1.6), i1 = inset(L, 1.6);
        q4(od, [i0[0], 15, i0[1]], [i1[0], 15, i1[1]], [i1[0], YR, i1[1]], [i0[0], YR, i0[1]]);
        const nb = Math.max(1, Math.round(L/9));
        for (let k = 0; k <= nb; k++){ const p = lerp2(a, b, k/nb); obox(os, p[0], p[1], 0.9, 0.9, 15, YR + 0.5, Math.atan2(t[1], t[0])); }
        for (const yy of [15, 21.2, YR - 0.4]) { const pa = [a[0], a[1]], pb = [b[0], b[1]]; sbox(os, pa, pb, 0.7, yy, yy + 0.7); }
        // brick: two tiers of arched openings, a cornice
        for (let k = 0; k < nb; k++){ const u = (k + 0.5)*L/nb; archE(od, E, u, 4.4, Math.max(ya + 1.5, gy(...lerp2(a, b, (k + 0.5)/nb))), 7.4, 0.08, 6); archE(od, E, u, 3.0, 10.8, 12.6, 0.08, 5); }
        sbox(B.p(CONC), a, b, 1.6, 14.6, 15.4);
      }
    }
    // ---- the two 122 ft clock towers: 3rd & King (Willie Mays Plaza) and 2nd & King
    for (const T of [[[-147.8,22.8],[-139.4,14.2],[-129.6,23],[-137.7,31.9]], [[-10.7,-115.9],[1.1,-127.7],[10.2,-118.7],[-1.1,-106.8]]]){
      const c = [(T[0][0] + T[2][0])/2, (T[0][1] + T[2][1])/2], y0 = Math.min(...T.map(p => gy(...p))) - 1.5, ob = B.p(BRICK);
      const sh = T.map(p => lerp2(p, c, 0.12)), sh2 = T.map(p => lerp2(p, c, 0.22));
      prism(ob, T, y0, 4.5); walls(ob, sh, 4.5, 30); cap(B.p(CONC), sh, 30.4); walls(B.p(CONC), sh, 29.4, 30.4);
      for (const yy of [8.5, 16.5]) walls(B.p(CONC), offRing(sh, 0.15), yy, yy + 0.6);
      // clock faces near the top of each side, tall arched windows below
      for (let i = 0; i < 4; i++){ const E = edgeFrame(sh, i), m = E.L/2; const o = B.p(WHITE), P = [];
        for (let k = 0; k < 16; k++) P.push([E.a[0] + E.t[0]*(m + Math.cos(k/16*TAU)*2.1) + E.n[0]*0.12, 25.2 + Math.sin(k/16*TAU)*2.1, E.a[1] + E.t[1]*(m + Math.cos(k/16*TAU)*2.1) + E.n[1]*0.12]);
        const cc = [E.a[0] + E.t[0]*m + E.n[0]*0.12, 25.2, E.a[1] + E.t[1]*m + E.n[1]*0.12]; for (let k = 0; k < 16; k++) t3(o, cc, P[k], P[(k+1) % 16]);
        archE(B.p(DARK), E, m, 2.2, 10, 15, 0.1, 5); archE(B.p(DARK), E, m, 2.2, 18, 21, 0.1, 5); }
      // open steel lantern and flagpole on top
      const os = B.p(STEEL); for (const p of sh2) obox(os, p[0], p[1], 0.6, 0.6, 30.4, 35.2); prism(os, sh2.map(p => lerp2(p, c, -0.06)), 35.2, 36, true);
      obox(os, c[0], c[1], 0.25, 0.25, 36, 44);
    }
    // ---- light towers: lattice masts and a bank of lamps facing the field
    const fieldC = FP(55, 55);
    const bank = (p0, p1, yb, yt, ytop) => {
      const os = B.p(STEEL), ol = B.p(LAMP), L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), t = [(p1[0] - p0[0])/L, (p1[1] - p0[1])/L];
      let n = [t[1], -t[0]]; const m = lerp2(p0, p1, 0.5); if ((fieldC[0] - m[0])*n[0] + (fieldC[1] - m[1])*n[1] < 0) n = [-n[0], -n[1]];
      for (const f of [0.08, 0.5, 0.92]){ const p = lerp2(p0, p1, f); obox(os, p[0], p[1], 1.6, 1.6, yb, ytop - 6, Math.atan2(t[1], t[0])); }
      // the bank frame, tilted toward the field
      const P = (u, h, d) => [p0[0] + t[0]*u + n[0]*d, h, p0[1] + t[1]*u + n[1]*d];
      q4(os, P(0, ytop - 7.5, -0.6), P(L, ytop - 7.5, -0.6), P(L, ytop, -2.2), P(0, ytop, -2.2));
      const nr = 5, nc = Math.round(L/2.4);
      for (let a = 0; a < nr; a++) for (let b = 0; b < nc; b++){
        const u = (b + 0.5)*L/nc, h = ytop - 7.0 + (a + 0.5)*7.0/nr, d = -0.6 - 1.6*(h - (ytop - 7.5))/7.5 + 0.35, c0 = P(u, h, d);
        box(ol, c0[0] - 0.55, c0[0] + 0.55, h - 0.5, h + 0.5, c0[2] - 0.55, c0[2] + 0.55);
      }
      // cross bracing between the masts
      for (const [fa, fb] of [[0.08, 0.5], [0.5, 0.92]]){ const pa = lerp2(p0, p1, fa), pb = lerp2(p0, p1, fb);
        for (let y = yb; y < ytop - 10; y += 9){ beam(os, [pa[0], y, pa[1]], [pb[0], y + 9, pb[1]], 0.25); beam(os, [pb[0], y, pb[1]], [pa[0], y + 9, pa[1]], 0.25); } }
    };
    bank([-98.2, -28.2], [-73.7, -52.7], YR, 0, 70); bank([-54.4, -67.1], [-25.3, -89.3], YR, 0, 70); bank([-86.6, 83.9], [-46.3, 111.4], YF + 41, 0, 70);
    // ---- left-field corner block (2nd & King gate) between the stands' end and the bleachers
    { const P = [back[back.length - 1], RING[6], RING[7], [35.4, -72.7], FENCE[0], S[0].p]; walls(B.p(BRICK), P, YF - 2, 13.5); cap(B.p(ROOF), P, 13.5); walls(B.p(CONC), offRing(P, 0.2), 13.1, 13.9); grid(B.p(DARK), P, YF + 1, 1, 0, 9, 4.0, 7.5, 0.08, {arch:true}); }
    // ---- left-field bleachers (fence P0..P33 up to the bleacher back line), centre-field garden
    { const F = resample([FENCE[0], FENCE[1], FENCE[2]], 24), Bk = resample([[35.4, -72.7], [93.5, -15.4]], 24), K3 = 14;
      for (let i = 0; i < 23; i++){
        const pt = (j, k) => { const f = j === i ? 0 : 1, a = F[j], b = Bk[j], u = 0.72*k/K3; return lerp2(a, b, u); };
        for (let k = 0; k < K3; k++){
          const y0 = YF + 2.4 + 7.6*k/K3, y1 = YF + 2.4 + 7.6*(k + 1)/K3, a0 = pt(i, k), b0 = pt(i + 1, k), a1 = pt(i, k + 1), b1 = pt(i + 1, k + 1);
          q4(B.p(RISER), [a0[0], y0, a0[1]], [b0[0], y0, b0[1]], [b0[0], y1, b0[1]], [a0[0], y1, a0[1]]);
          q4(B.p(SEAT), [a0[0], y1, a0[1]], [b0[0], y1, b0[1]], [b1[0], y1, b1[1]], [a1[0], y1, a1[1]]);
        }
        const e0 = pt(i, K3), e1 = pt(i + 1, K3);
        q4(B.p(CONC), [e0[0], YF + 10, e0[1]], [e1[0], YF + 10, e1[1]], [Bk[i+1][0], YF + 10, Bk[i+1][1]], [Bk[i][0], YF + 10, Bk[i][1]]);
        q4(B.p(BRICK), [Bk[i][0], 0, Bk[i][1]], [Bk[i+1][0], 0, Bk[i+1][1]], [Bk[i+1][0], YF + 11.2, Bk[i+1][1]], [Bk[i][0], YF + 11.2, Bk[i][1]]);
        q4(B.p(BRICK2), [F[i][0], YF, F[i][1]], [F[i+1][0], YF, F[i+1][1]], [F[i+1][0], YF + 2.4, F[i+1][1]], [F[i][0], YF + 2.4, F[i][1]]);
      }
      // centre field: the garden terrace behind the wall, up to the scoreboard
      const GP = [FENCE[2], FENCE[3], FENCE[4], [98.3, 46.5], [93.5, -15.4]]; prism(B.p(LEAF), GP, YF, YF + 3.2); walls(B.p(BRICK2), [FENCE[2], FENCE[3], FENCE[4]], YF, YF + 3.4, true);
      const op = B.p(GRASS2); for (let k = 0; k < 10; k++){ const p = lerp2(lerp2(FENCE[3], [96, 15], 0.35), lerp2(FENCE[3], [96, 15], 0.8), k/9); obox(op, p[0], p[1] + ((k % 2) ? 12 : -12), 4, 2.2, YF + 3.2, YF + 4.1, 1.5); }
    }
    // ---- right field: the 24 ft brick wall with the arcade on top, open to McCovey Cove
    { const W0 = FENCE[4], W1 = FENCE[5], E0 = [98.3, 46.5], E1 = [6.1, 102], n = 18, ob = B.p(BRICK), od = B.p(DARK);
      walls(ob, [W0, W1], YF, YF + 7.3, true);
      const ins = resample([W0, W1], n + 1), out = resample([[90, 50.6], [10, 100]], n + 1);
      for (let i = 0; i < n; i++){
        const a = ins[i], b = ins[i+1], c = out[i], d = out[i+1];
        // arcade walkway and two rows of seats on top of the wall
        q4(B.p(SEAT), [a[0], YF + 8.2, a[1]], [b[0], YF + 8.2, b[1]], [lerp2(b, d, 0.45)[0], YF + 9.0, lerp2(b, d, 0.45)[1]], [lerp2(a, c, 0.45)[0], YF + 9.0, lerp2(a, c, 0.45)[1]]);
        q4(B.p(CONC), [lerp2(a, c, 0.45)[0], YF + 9.0, lerp2(a, c, 0.45)[1]], [lerp2(b, d, 0.45)[0], YF + 9.0, lerp2(b, d, 0.45)[1]], [d[0], YF + 9.0, d[1]], [c[0], YF + 9.0, c[1]]);
        q4(B.p(STEEL), [a[0], YF + 7.3, a[1]], [b[0], YF + 7.3, b[1]], [b[0], YF + 8.2, b[1]], [a[0], YF + 8.2, a[1]]);
        // the outer brick face on the Portwalk: arched knotholes at the walk, the arcade's arches above, a cornice
        q4(ob, [c[0], -0.5, c[1]], [d[0], -0.5, d[1]], [d[0], YF + 15.2, d[1]], [c[0], YF + 15.2, c[1]]);
        const E = {a:c, t:[(d[0] - c[0])/Math.hypot(d[0] - c[0], d[1] - c[1]), (d[1] - c[1])/Math.hypot(d[0] - c[0], d[1] - c[1])], n:[0, 0]}; E.n = [E.t[1], -E.t[0]]; if (E.n[1] < 0) E.n = [-E.n[0], -E.n[1]];
        const L = Math.hypot(d[0] - c[0], d[1] - c[1]);
        archE(od, E, L/2, 3.0, 1.6, 4.4, 0.1, 5); archE(od, E, L/2, 4.0, YF + 9.0, YF + 12.4, 0.1, 6);
        E.n = [-E.n[0], -E.n[1]]; archE(od, E, L/2, 4.0, YF + 9.0, YF + 12.4, 0.1, 6);
        sbox(B.p(CONC), c, d, 1.2, YF + 14.6, YF + 15.4, 0.4);
        // brick piers of the arcade on the field side
        obox(ob, a[0], a[1], 1.4, 1.4, YF + 8.2, YF + 14.6, Math.atan2(b[1] - a[1], b[0] - a[0]));
        sbox(ob, lerp2(a, c, 0.1), lerp2(b, d, 0.1), 1.0, YF + 13.4, YF + 14.6);
        q4(B.p(CONC), [lerp2(a, c, 0.75)[0], YF + 15.2, lerp2(a, c, 0.75)[1]], [lerp2(b, d, 0.75)[0], YF + 15.2, lerp2(b, d, 0.75)[1]], [d[0], YF + 15.2, d[1]], [c[0], YF + 15.2, c[1]]);
        if (i % 3 === 1){ const m = lerp2(lerp2(a, c, 0.5), lerp2(b, d, 0.5), 0.5); obox(B.p(STEEL), m[0], m[1], 0.3, 0.3, YF + 15.2, YF + 19.5, 0); obox(B.p(LAMP), m[0], m[1], 1.2, 0.5, YF + 19.5, YF + 20.2, Math.atan2(b[1] - a[1], b[0] - a[0])); }
      }
      // the four fountain pillars on the wall
      for (const f of [0.15, 0.38, 0.62, 0.85]){ const p = lerp2(W0, W1, f); obox(ob, p[0], p[1], 1.6, 1.6, YF + 7.3, YF + 11.5, 0.6); obox(B.p(CONC), p[0], p[1], 2.0, 2.0, YF + 11.5, YF + 12.1, 0.6); }
      // out-of-town scoreboard (dark panel) on the wall
      { const p = lerp2(W0, W1, 0.5), th = Math.atan2(W1[1] - W0[1], W1[0] - W0[0]); obox(B.p(BOARD), p[0] - Math.sin(th)*0.3, p[1] + Math.cos(th)*0.3, 18, 0.3, YF + 1.6, YF + 6.2, th); }
      // end wall between the arcade and the right-field corner of the stands
      prism(ob, [W1, [6.1, 102], [-4, 106.6], S[N - 1].p], YF - 1, YF + 9.0);
    }
    // ---- centre-field scoreboard on its steel frame, a bank of lamps on top
    { const p0 = [95.15, -15.55], p1 = [99.9, 45.85], os = B.p(STEEL), L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), th = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
      const c = lerp2(p0, p1, 0.5); obox(B.p(BOARD), c[0] - 0.9, c[1], 46, 0.6, YF + 13, YF + 28, th); obox(os, c[0] + 0.6, c[1], L, 2.6, YF + 11.5, YF + 30, th);
      for (const f of [0.06, 0.3, 0.5, 0.7, 0.94]){ const p = lerp2(p0, p1, f); obox(os, p[0], p[1], 1.4, 2.4, -0.5, YF + 11.5, th); }
      obox(B.p(BRICK), c[0] + 0.6, c[1], L, 3.0, -0.5, YF + 4, th);
      bank(lerp2(p0, p1, 0.2), lerp2(p0, p1, 0.8), YF + 30, 0, YF + 41); }
    // ---- the fan lot: a generic four-fingered fielder's glove (8 m), the little ballfield
    { const c = [111.5, -0.7], y = gy(...c) + 0.3, o = B.p(GLOVE), dir = Math.atan2(HP[1] - c[1], HP[0] - c[0]);
      const P = (u, v, h) => [c[0] + Math.cos(dir)*u - Math.sin(dir)*v, y + h, c[1] + Math.sin(dir)*u + Math.cos(dir)*v];
      // the mitt (8 m tall, 10 m wide): a padded palm, four fingers and a thumb, laced, on a low pedestal
      const pm = LSph(s, 3.4, c[0], y + 3.6, c[1], GLOVE, 1, 14); pm.scale.set(0.42, 1.12, 1.25); pm.rotation.y = -dir;
      const fp = (u, v, h) => P(u, v, h);
      for (const [v, h, lean] of [[-2.55, 7.6, -0.5], [-0.85, 8.3, -0.15], [0.85, 8.1, 0.15], [2.5, 7.3, 0.5]]){ const a0 = fp(0, v*0.82, 5.2), a1 = fp(-0.25, v + lean, h - 0.7); LBeam(s, a0, a1, 0.82, GLOVE, 10); LSph(s, 0.82, a1[0], a1[1], a1[2], GLOVE, 1, 10); }
      { const a0 = fp(0.1, 3.0, 2.6), a1 = fp(-0.5, 4.6, 5.0); LBeam(s, a0, a1, 0.9, GLOVE, 10); LSph(s, 0.9, a1[0], a1[1], a1[2], GLOVE, 1, 10); }
      for (const v of [-1.7, 0, 1.7]) beam(B.p(DARK), fp(-0.9, v, 6.6), fp(-0.9, v + 0.5, 7.4), 0.12);
      beam(B.p(DARK), fp(-1.3, -3.2, 1.4), fp(-1.3, 3.2, 1.4), 0.25);
      obox(B.p(CONC), c[0], c[1], 6, 6, y - 1, y + 0.5, dir);
      const m = [57.3, -66.0]; obox(B.p(GRASS), m[0], m[1], 15, 15, YF - 0.5, YF + 0.1, 0.78); obox(B.p(DIRT), m[0] - 2, m[1] + 2, 5, 5, YF, YF + 0.15, 0.78); }
    // retired cable car No. 44 beyond right-centre
    { const c = [95.5, 50.9], th = Math.atan2(53.7 - 48.1, 91.2 - 99.7); obox(B.p(BRICK2), c[0], c[1], 8.3, 2.5, 1.2, 3.4, th); obox(B.p(WHITE), c[0], c[1], 8.6, 2.7, 3.4, 4.3, th); obox(B.p(DARK), c[0], c[1], 8.6, 2.0, 0.4, 1.2, th); }
    // ---- Willie Mays Plaza: the 24 palms
    { const o = [-170, 52], u = [Math.cos(-0.82), Math.sin(-0.82)], v = [-u[1], u[0]];
      for (let a = 0; a < 6; a++) for (let b = 0; b < 4; b++){ const x = o[0] + u[0]*(a - 2.5)*7.5 + v[0]*(b - 1.5)*7.5, z = o[1] + u[1]*(a - 2.5)*7.5 + v[1]*(b - 1.5)*7.5;
        if (pip(RING, x, z)) continue; palm(B, x, gy(x, z), z, 10 + r()*2.5, r, TRUNK, LEAF); } }
    B.flush(s);
    return g; }};
place('oraclepark', 'oraclepark', OX, OZ);
}

// =====================================================================================================================
// Chase Center (2019, MANICA): the arena on its Mission Bay plaza. A glass ground floor under fourteen stacked white
// aluminium drums ("overlapping conical elliptical bands in varying orientations"), each band leaning in and tilted a
// little, so the shingled skin swoops; a shallow domed roof with a glass summit band. Night: the bands washed in cool
// white, the gaps between them glowing, the lobby glass warm.
// =====================================================================================================================
{
const K = 'chase', OX = 25, OZ = 12, R0 = 96;
const RING = [[-54.3,19.4],[-52.9,8.3],[-51.6,3.4],[-47.8,-6.9],[-45.2,-12.9],[-39.2,-23.2],[-35.9,-27.9],[-28.7,-36.3],[-25.2,-39.7],[-8.8,-52.6],[6.1,-60.2],[12.8,-62.7],[22,-65],[31.1,-66.5],[39.3,-66.9],[48.6,-66.4],[63.2,-63.4],[70.9,-60.6],[83.9,-53.9],[90.5,-48.9],[81.6,-38],[89.5,-26.5],[93.4,-18.6],[97.3,-9.1],[101.7,7.8],[103.2,17.9],[103.6,38.7],[101.7,49.3],[97.3,61.2],[86.5,80],[70.1,69.4],[56.9,79.2],[51.5,82.6],[35.7,88.7],[27.5,90.5],[19.5,91.6],[11.1,91.8],[2.4,90.5],[-6.5,88.5],[-13.4,85.7],[-20.3,81.9],[-27.9,76.7],[-32.8,72.1],[-43.2,58.7],[-47.7,49.1],[-51.1,35.3],[-51.5,19.8]];
const WHITE = {c:'#ecece7', lk:0.75}, WHITE2 = {c:'#dcdcd5', lk:0.7}, GAP = {c:'#7d8288', glow:'#d6e6ff', gk:0.9}, GL = {c:'#4d5c66', glow:'#ffd29a', gk:0.8},
  MULL = '#c8cac6', ROOFC = {c:'#b4b5b0', lk:0.25}, STONE = '#bdb6aa', SUMMIT = {c:'#3f4c55', glow:'#cfe0ff', gk:0.7};
LANDMARKS.chasecenter = {zh:'大通中心', en:'Chase Center', cat:'new', r:R0, h:42, lt:{m:0, c:'#e2eaff', k:0.55, e:0.4},
  build(){
    const g = new THREE.Group(), s = frame(g, K, OX, OZ, R0), B = mkB();
    // the drum's plan: rays from the centre to the convex hull of the outline (the entrances' notches stay in the glass floor)
    const C = [25.4, 12.6], H = [];
    { const P = RING.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0])*(b[1] - o[1]) - (a[1] - o[1])*(b[0] - o[0]), lo = [], up = [];
      for (const p of P){ while (lo.length >= 2 && cr(lo[lo.length-2], lo[lo.length-1], p) <= 0) lo.pop(); lo.push(p); }
      for (let i = P.length - 1; i >= 0; i--){ const p = P[i]; while (up.length >= 2 && cr(up[up.length-2], up[up.length-1], p) <= 0) up.pop(); up.push(p); }
      lo.pop(); up.pop(); H.push(...lo, ...up); }
    const NT = 80, RH = []; for (let k = 0; k < NT; k++){ const a = k/NT*TAU; RH.push(rayRing(C, [Math.cos(a), Math.sin(a)], H)); }
    const YP = 4.3, Y0 = YP + 7.2, NB = 14, BH = 2.1;
    // podium and plaza edge
    prism(B.p(STONE), RING, -1, YP); 
    // glass ground floor with mullions, set back under the first band
    const GR = offRing(RING, -2.4); walls(B.p(GL), GR, YP, Y0 + 0.2); { const o = B.p(MULL); for (let i = 0; i < GR.length; i++){ const E = edgeFrame(GR, i), n = Math.max(1, Math.round(E.L/3)); for (let k = 0; k < n; k++){ const p = lerp2(E.a, E.b, k/n); obox(o, p[0], p[1], 0.25, 0.25, YP, Y0, 0); } } }
    const kOf = t => 0.985 + 0.12*t - 0.27*Math.pow(t, 2.5);
    const pt = (i, k, sc, y) => { const a = k/NT*TAU, b = BAND[i]; return [b.cx + Math.cos(a)*RH[k]*sc, y + b.A*Math.cos(a - b.ph), b.cz + Math.sin(a)*RH[k]*sc]; };
    const BAND = []; for (let i = 0; i < NB; i++){ const t = i/(NB - 1), ps = i*2.39996; BAND.push({cx:C[0] + Math.cos(ps)*2.2*t - 2.5*t*t, cz:C[1] + Math.sin(ps)*2.2*t + 1.5*t*t, A:i ? 0.6 + 0.9*t : 0, ph:2.3 + 0.25*Math.sin(i*1.7), k:kOf(t), y:Y0 + i*BH}); }
    // underside of the first band over the glass
    for (let k = 0; k < NT; k++){ const k2 = (k + 1) % NT, a = pt(0, k, BAND[0].k + 0.012, Y0), b = pt(0, k2, BAND[0].k + 0.012, Y0), gA = lerp2(C, [a[0], a[2]], 0.965), gB = lerp2(C, [b[0], b[2]], 0.965);
      q4(B.p(WHITE2), a, b, [gB[0], Y0, gB[1]], [gA[0], Y0, gA[1]]); }
    for (let i = 0; i < NB; i++){
      const b = BAND[i], o = B.p(i === NB - 1 ? SUMMIT : (i % 2 ? WHITE : WHITE2));
      for (let k = 0; k < NT; k++){
        const k2 = (k + 1) % NT;
        q4(o, pt(i, k, b.k + 0.012, b.y), pt(i, k2, b.k + 0.012, b.y), pt(i, k2, b.k - 0.01, b.y + BH + 0.25), pt(i, k, b.k - 0.01, b.y + BH + 0.25));
        if (i){ // the shadow gap under the band's lower edge, lit at night
          const pb = BAND[i-1]; q4(B.p(GAP), pt(i, k, b.k + 0.012, b.y), pt(i, k2, b.k + 0.012, b.y), pt(i - 1, k2, pb.k - 0.01, b.y + 0.02), pt(i - 1, k, pb.k - 0.01, b.y + 0.02)); }
      }
    }
    // shallow dome over the bowl
    { const b = BAND[NB - 1], yt = b.y + BH + 0.25, o = B.p(ROOFC), NR = 6;
      for (let j = 0; j < NR; j++) for (let k = 0; k < NT; k++){
        const k2 = (k + 1) % NT, s0 = (b.k - 0.01)*(1 - j/NR), s1 = (b.k - 0.01)*(1 - (j + 1)/NR), y0 = yt + 3.4*Math.sin(PI/2*j/NR), y1 = yt + 3.4*Math.sin(PI/2*(j + 1)/NR);
        const P = (kk, sc, y) => { const a = kk/NT*TAU; return [b.cx + Math.cos(a)*RH[kk]*sc, y + (sc > 0.4 ? b.A*Math.cos(a - b.ph)*sc/b.k : 0), b.cz + Math.sin(a)*RH[kk]*sc]; };
        if (j < NR - 1) q4(o, P(k, s0, y0), P(k2, s0, y0), P(k2, s1, y1), P(k, s1, y1)); else t3(o, P(k, s0, y0), P(k2, s0, y0), [b.cx, y1, b.cz]);
      }
      // standing-seam ribs radiating over the roof
      { const orb = B.p('#a9aaa5'); for (let k = 0; k < NT; k += 2){ const a = k/NT*TAU; for (let j = 1; j < NR - 1; j++){ const s0 = (b.k - 0.01)*(1 - j/NR), s1 = (b.k - 0.01)*(1 - (j + 1)/NR), tl = sc => sc > 0.4 ? b.A*Math.cos(a - b.ph)*sc/b.k : 0, y0 = yt + 3.4*Math.sin(PI/2*j/NR) + 0.08 + tl(s0), y1 = yt + 3.4*Math.sin(PI/2*(j + 1)/NR) + 0.08 + tl(s1);
        beam(orb, [b.cx + Math.cos(a)*RH[k]*s0, y0, b.cz + Math.sin(a)*RH[k]*s0], [b.cx + Math.cos(a)*RH[k]*s1, y1, b.cz + Math.sin(a)*RH[k]*s1], 0.18); } } }
      // roof plant screens
      for (const [x, z, w, d] of [[10, 0, 14, 8], [42, 24, 10, 10], [24, 30, 8, 6]]) obox(B.p(WHITE2), x, z, w, d, yt + 2.2, yt + 4.4, 0.4); }
    // the two glazed entrance atria in the outline's notches (north-east and south-east)
    for (const P of [[[83.9,-53.9],[90.5,-48.9],[81.6,-38],[89.5,-26.5],[76,-36]], [[97.3,61.2],[86.5,80],[70.1,69.4],[56.9,79.2],[74,62]]]){
      walls(B.p(GL), P, YP, YP + 15); cap(B.p(WHITE2), P, YP + 15); }
    B.flush(s);
    return g; }};
place('chasecenter', 'chase', OX, OZ);
}

// =====================================================================================================================
// Alcatraz Island: the rock itself (the app's terrain there is flat at the water) as a terraced heightfield inside the real
// coastline — cliffs, the summit plateau with retaining walls, the parade ground's rubble terrace, the north-west
// industries bench, the dock — and its buildings on the OSM footprints: the 1912 cellhouse with the dining hall and the
// recreation yard, the administration block, the 1909 lighthouse (84 ft tapered octagon, focal plane 65 m, lantern beam
// sweeping every 5 s), the keeper's and the warden's house ruins, Building 64 (barracks) by the wharf, the 1940 water
// tower, the powerhouse and its chimney, the New and Model Industries buildings, quartermaster, sally port and chapel,
// the officers' club ruin, the dock guard tower, the ferry float. A few windows lit at night.
// =====================================================================================================================
{
const K = 'alcatraz', OX = 0, OZ = -3, R0 = 300;
const COAST = [[-231.5,-157.5],[-229.5,-153],[-231,-149],[-224.5,-139],[-226,-131.5],[-205.5,-120],[-200,-123],[-193.5,-118.5],[-189,-112],[-187.5,-108],[-180,-97.5],[-178.5,-93.5],[-180,-90.5],[-173,-71],[-169.5,-61.5],[-165.5,-52],[-162.5,-46.5],[-161,-44],[-147.5,-28],[-129.5,-20],[-132,-10.5],[-134.5,-3.5],[-137.5,-1],[-138.5,1.5],[-138,4],[-135,7.5],[-133,7.5],[-131,11],[-123,16.5],[-116.5,14],[-113.5,14.5],[-110.5,13],[-106,14.5],[-105.5,16.5],[-90.5,23.5],[-84.5,20],[-79.5,19],[-74.5,19],[-70,23.5],[-66.5,28],[-64.5,32.5],[-65,50],[-67.5,59.5],[-62.5,68],[-47,75],[-31,83],[-24.5,90.5],[-17,92],[-7.5,95],[0.5,97.5],[6,102.5],[19,108.5],[22,119],[26,132],[28,133.5],[31,134.5],[36,134.5],[41.5,137],[43.5,136.5],[48.5,138.5],[75.5,154.5],[99,172.5],[105,176.5],[112.5,179],[122.5,180.5],[133,180],[159,177],[161,179.5],[187.5,170],[191,168],[200.5,163],[204,158],[214.5,144.5],[218.5,137],[227,116],[231,107.5],[229,96.5],[226.5,90],[222.5,64.5],[215.5,56],[212.5,51],[208.5,47.5],[187.5,26.5],[190,23.5],[187.5,22],[171,4.5],[175.5,0],[179.5,-3.5],[179.5,-6.5],[141,-38],[140,-36.5],[134.5,-28.5],[106,-47.5],[101,-41],[96,-44],[91,-55.5],[81,-60.5],[69.5,-65],[65.5,-66],[46.5,-78.5],[29,-86.5],[1,-118],[-10.5,-127.5],[-22,-143.5],[-41,-152.5],[-49,-155.5],[-54.5,-156],[-71,-156],[-80,-165.5],[-88,-170],[-96.5,-179],[-104,-184],[-114,-184],[-125.5,-179],[-143.5,-184],[-154,-183.5],[-159.5,-180.5],[-167,-185.5],[-174.5,-184],[-180,-185],[-185,-187],[-195,-180.5],[-201,-185],[-216,-180.5],[-226.5,-172],[-230.5,-163.5]];
const WHARF = [[123,-12.5],[143.5,2],[151,8.5],[147.5,31],[149.5,34],[169,55],[177.5,55.5],[185.5,49],[194,55],[200,55.5],[205,50.5],[208.5,47.5],[187.5,26.5],[190,23.5],[187.5,22],[171,4.5],[175.5,0],[179.5,-3.5],[179.5,-6.5],[141,-38],[134.5,-28.5]];
// terrace pads: [polygon, level (m above the sea), falloff slope, retaining walls]
const PADS = [
  [[[-62,-50],[-49,-62],[-8,-31],[10,-29],[52,6],[86,22],[106,30],[114,46],[102,59],[64,60],[34,55],[18,47],[-48,17],[-82,-19]], 40, 1.15, 1],     // summit: cellhouse, yard, lighthouse, warden's house
  [[[71,106],[91,106],[114,119],[136,133],[127,156],[154,150],[148,116],[162,107],[184,109],[185,98],[163,75],[140,37],[126,34],[108,66],[122,73],[111,96],[89,91]], 23, 0.9, 1], // parade ground
  [[[38,-55],[50,-79],[76,-60],[68,-44]], 14, 0.8, 1],                                 // sally port and chapel
  [[[34,-62],[14,-84],[-12,-104],[-40,-126],[-66,-122],[-40,-98],[-6,-74],[20,-58]], 20, 0.8, 1],   // electric shop, officers' club
  [[[-82.3,-109],[-73.7,-105.5],[-70.2,-96.9],[-73.7,-88.3],[-82.3,-84.8],[-90.9,-88.3],[-94.4,-96.9],[-90.9,-105.5]], 27, 0.7, 0],   // water tower knoll
  [[[-183,-125],[-160,-138],[-110,-50],[-134,-37]], 10, 0.9, 1],                      // New Industries
  [[[-231,-150],[-215,-169],[-187,-128],[-196,-116],[-226,-134]], 12, 0.9, 1],        // Model Industries
  [[[-168,-184],[-116,-184],[-116,-151],[-168,-151]], 5, 0.9, 1],                     // powerhouse
  [[[-118,-159],[-106,-170],[-77,-146],[-89,-132]], 8, 0.9, 0],                       // quartermaster
  [[[-142,-114],[-121,-93],[-110,-106],[-132,-125]], 13, 0.9, 0],                     // cistern
  [[[74,-24],[88,-39],[152,8],[147,36],[124,32],[126,18]], 4, 1.4, 0],                // Building 64
  [WHARF, 3.2, 1.6, 0]];
const CONC = {c:'#d6ccb4', lk:0.35}, CONC2 = {c:'#c4b9a1', lk:0.3}, RUIN = {c:'#b7a88e', lk:0.3}, DARKW = '#2c2d2b', LITW = {c:'#3b3934', glow:'#ffcf8a', gk:1.3},
  WALLC = CONC2, ROOFC = '#8f8a80', RUST = '#8a6448', TANK = CONC, LAMPC = {c:'#202020', glow:'#fff6dc', gk:3.0}, BLACK = '#1e1f20', TREE = '#4f6038',
  GLOWG = {c:'#4a535a', glow:'#ffdcae', gk:0.5}, B64C = {c:'#d6c79f', lk:0.4}, DGREY = '#6f6a60';
const segDist = (x, z, a, b) => { const ex = b[0] - a[0], ez = b[1] - a[1], L2 = ex*ex + ez*ez || 1, t = Math.max(0, Math.min(1, ((x - a[0])*ex + (z - a[1])*ez)/L2)); return Math.hypot(x - a[0] - ex*t, z - a[1] - ez*t); };
const polyDist = (P, x, z) => { let d = Infinity; for (let i = 0; i < P.length; i++) d = Math.min(d, segDist(x, z, P[i], P[(i+1) % P.length])); return d; };
LANDMARKS.alcatraz = {zh:'恶魔岛', en:'Alcatraz Island', cat:'old', r:R0, h:70, lt:{m:0, c:'#ffcf96', k:0.28},
  build(){
    const g = new THREE.Group(), s = frame(g, K, OX, OZ, R0), B = mkB(), r = LMCTX.rng, base = s.position.y;
    // ---- the rock: heightfield on a 4 m grid, vertex-coloured (rock on the cliffs, scrub, paving on the terraces, rubble)
    const X0 = -240, Z0 = -194, ST = 4, NX = 121, NZ = 98, Hh = new Float32Array(NX*NZ), Pd = new Int8Array(NX*NZ), In = new Uint8Array(NX*NZ);
    // distance to an outline, ignoring edges farther than cap (bounding boxes per edge)
    const prepE = P => P.map((a, i) => { const b = P[(i+1) % P.length]; return [a, b, Math.min(a[0], b[0]), Math.max(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[1], b[1])]; });
    const distCap = (E, x, z, cap) => { let d = cap; for (const e of E){ if (x < e[2] - d || x > e[3] + d || z < e[4] - d || z > e[5] + d) continue; d = Math.min(d, segDist(x, z, e[0], e[1])); } return d; };
    const CE = prepE(COAST), PE = PADS.map(P => prepE(P[0])), PB = PADS.map(P => [Math.min(...P[0].map(p => p[0])), Math.max(...P[0].map(p => p[0])), Math.min(...P[0].map(p => p[1])), Math.max(...P[0].map(p => p[1]))]),
      PMAX = PADS.map(P => Math.max(P[1]/P[2], P[1] < 7 ? (7 - P[1])/0.45 + 1 : 0) + 1);
    const padD = (i, x, z) => { const b = PB[i], m = PMAX[i]; if (x < b[0] - m || x > b[1] + m || z < b[2] - m || z > b[3] + m) return Infinity; return pip(PADS[i][0], x, z) ? 0 : distCap(PE[i], x, z, m); };
    const elev = (x, z) => {
      const inside = pip(COAST, x, z), d = distCap(CE, x, z, 30);
      if (!inside) return {h:Math.max(-9, -0.8 - d*1.3), pad:-1, inside:false};
      let h = 7, pad = -1; const DD = PADS.map((P, i) => padD(i, x, z));
      for (let i = 0; i < PADS.length; i++) if (PADS[i][1] < 7) h = Math.min(h, PADS[i][1] + Math.max(0, DD[i] - 1)*0.45);
      for (let i = 0; i < PADS.length; i++){ const v = PADS[i][1] - PADS[i][2]*DD[i]; if (v > h - 0.01){ if (v > h) h = v; if (DD[i] < 0.01) pad = i; } }
      const dockZone = x > 118 && z > -45 && z < 60;
      const cl = dockZone ? 3.0 + d*1.4 : 2.2 + d*(2.0 + 0.8*Math.sin(x*0.07 + z*0.05));
      return {h:Math.min(h, cl), pad:Math.min(h, cl) < h - 0.5 ? -1 : pad, inside:true};
    };
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++){ const e = elev(X0 + i*ST, Z0 + j*ST), q = j*NX + i; Hh[q] = e.h; Pd[q] = e.pad; In[q] = e.inside ? 1 : 0; }
    { const pos = [], col = [], idx = [], vid = new Int32Array(NX*NZ).fill(-1), cA = new THREE.Color(), cB = new THREE.Color();
      const C_ROCK = new THREE.Color('#7a6e60'), C_ROCK2 = new THREE.Color('#938776'), C_WET = new THREE.Color('#4e473f'), C_SCRUB = new THREE.Color('#68754a'), C_GRASS = new THREE.Color('#8f8c5c'),
        C_PAVE = new THREE.Color('#9a968a'), C_RUBBLE = new THREE.Color('#968d7c');
      const near = q => { const i = q % NX, j = (q / NX) | 0; for (let b = -3; b <= 3; b++) for (let a = -3; a <= 3; a++){ const ii = i + a, jj = j + b; if (ii >= 0 && jj >= 0 && ii < NX && jj < NZ && In[jj*NX + ii]) return true; } return false; };
      for (let q = 0; q < NX*NZ; q++){
        if (!near(q)) continue; const i = q % NX, j = (q / NX) | 0, x = X0 + i*ST, z = Z0 + j*ST, h = Hh[q];
        const hx = Hh[j*NX + Math.min(NX - 1, i + 1)] - Hh[j*NX + Math.max(0, i - 1)], hz = Hh[Math.min(NZ - 1, j + 1)*NX + i] - Hh[Math.max(0, j - 1)*NX + i], sl = Math.hypot(hx, hz)/(2*ST);
        const n = (Math.sin(x*12.9898 + z*78.233)*43758.5453) % 1, w = Math.abs(n);
        if (h < 2.6) cA.copy(C_WET); else if (Pd[q] === 1) cA.copy(C_RUBBLE).lerp(C_PAVE, w*0.5); else if (Pd[q] >= 0 && sl < 0.35) cA.copy(C_PAVE).lerp(C_SCRUB, 0.25 + w*0.3);
        else if (sl > 0.85) cA.copy(C_ROCK).lerp(C_ROCK2, w); else cB.copy(C_SCRUB).lerp(C_GRASS, w), cA.copy(cB).lerp(C_ROCK, Math.max(0, sl - 0.3));
        vid[q] = pos.length/3; pos.push(x, h, z); col.push(cA.r, cA.g, cA.b);
      }
      for (let j = 0; j < NZ - 1; j++) for (let i = 0; i < NX - 1; i++){ const a = vid[j*NX + i], b = vid[j*NX + i + 1], c = vid[(j+1)*NX + i + 1], d = vid[(j+1)*NX + i]; if (a < 0 || b < 0 || c < 0 || d < 0) continue; idx.push(a, d, c, a, c, b); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
      lmAdd(s, geo, {c:'#ffffff', vc:true, lk:0.12}, 0, 0, 0); }
    const H = (x, z) => { const fx = (x - X0)/ST, fz = (z - Z0)/ST, i = Math.max(0, Math.min(NX - 2, fx | 0)), j = Math.max(0, Math.min(NZ - 2, fz | 0)), u = fx - i, v = fz - j;
      return (Hh[j*NX + i]*(1 - u) + Hh[j*NX + i + 1]*u)*(1 - v) + (Hh[(j+1)*NX + i]*(1 - u) + Hh[(j+1)*NX + i + 1]*u)*v; };
    // retaining walls round the walled terraces (where the ground falls away outside)
    for (const P of PADS) if (P[3]){ const o = B.p(WALLC); for (let i = 0; i < P[0].length; i++){ const a = P[0][i], b = P[0][(i+1) % P[0].length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L/6));
      for (let k = 0; k < n; k++){ const p = lerp2(a, b, k/n), q = lerp2(a, b, (k + 1)/n), lo = Math.min(H(...p), H(...q)); if (P[1] - lo < 1.2 || !pip(COAST, ...lerp2(p, q, 0.5))) continue;
        q4(o, [p[0], lo - 1, p[1]], [q[0], lo - 1, q[1]], [q[0], P[1] + 0.9, q[1]], [p[0], P[1] + 0.9, p[1]]); } } }
    // ---- buildings: concrete prisms on their terrace level with a footing into the slope
    const bld = (R, y0, h, col, o2) => { o2 = o2 || {};
      const lo = Math.min(...R.map(p => H(...p))) - 2, ob = B.p(col); walls(ob, R, Math.min(lo, y0 - 1), y0 + h); if (!o2.open) cap(B.p(o2.roof || ROOFC), R, y0 + h);
      if (o2.par) walls(B.p(col), offRing(R, 0.25), y0 + h - 0.2, y0 + h + o2.par);
      if (o2.fl) grid(B.p(o2.wc || DARKW), R, y0 + (o2.sill || 1.0), o2.fl, o2.fh || 3.6, o2.bay || 4, o2.ww || 1.5, o2.wh || 2.1, 0.06, {minL:3});
      if (o2.lit) grid(B.p(LITW), R, y0 + (o2.sill || 1.0) + (o2.fh || 3.6)*(o2.litF || 0), 1, 0, (o2.bay || 4)*o2.lit, o2.ww || 1.5, o2.wh || 2.1, 0.08, {minL:(o2.bay || 4)*o2.lit});
    };
    const shell = (R, y0, h, col, fl, fh) => {       // roofless ruin: two skins with a wall top, empty windows on both faces
      const RI = offRing(R, -0.45), lo = Math.min(...R.map(p => H(...p))) - 1.5, o = B.p(col);
      walls(o, R, lo, y0 + h); walls(o, RI, y0, y0 + h - 0.6); for (let i = 0; i < R.length; i++){ const a = R[i], b = R[(i+1) % R.length], c = RI[(i+1) % R.length], d = RI[i]; q4(o, [a[0], y0 + h, a[1]], [b[0], y0 + h, b[1]], [c[0], y0 + h - 0.6, c[1]], [d[0], y0 + h - 0.6, d[1]]); }
      grid(B.p(DARKW), R, y0 + 1, fl, fh, 3.4, 1.4, 2.2, 0.06, {minL:3}); grid(B.p(DARKW), RI, y0 + 1, fl, fh, 3.4, 1.4, 2.2, -0.06, {minL:3});
      cap(B.p(DGREY), RI, y0 + 0.3);
    };
    // cellhouse (concrete, cream paint, tall barred windows, skylight monitors), dining hall, administration block
    const CELL = [[-34.4,1.6],[-6.3,-25.3],[5.6,-13.1],[13,-20.3],[46.5,14.1],[19,40.5],[7.2,28.4],[-0.8,36.1]];
    const DINE = [[-58.3,-47.7],[-48.9,-56.7],[-43.9,-51.6],[-41.5,-53.9],[-10.1,-21.7],[-24.6,-7.8],[-55.9,-39.9],[-53.3,-42.5]];
    const ADM = [[21.3,38.3],[46.5,14.1],[56.9,24.7],[31.7,48.9]];
    bld(CELL, 40, 14.6, CONC, {par:0.8});
    grid(B.p(DARKW), CELL, 42.2, 1, 0, 5.4, 2.4, 9.6, 0.06, {minL:4});
    grid(B.p(CONC2), CELL, 47.0, 1, 0, 5.4, 2.6, 0.35, 0.1, {minL:4}); grid(B.p(CONC2), CELL, 49.6, 1, 0, 5.4, 2.6, 0.35, 0.1, {minL:4});
    grid(B.p(LITW), CELL, 42.2, 1, 0, 27, 2.4, 9.6, 0.08, {minL:20});
    // skylight monitors over the four cell blocks (along the long axis)
    { const ax = [0.805, 0.594], c0 = [6, 8]; for (const off of [-12, -4.5, 4.5, 12]){ const p = [c0[0] - ax[1]*off, c0[1] + ax[0]*off];
        obox(B.p(CONC2), p[0], p[1], 46, 4.2, 54.6, 56.4, Math.atan2(ax[1], ax[0])); obox(B.p(GLOWG), p[0], p[1], 45, 3.6, 55.2, 56.0, Math.atan2(ax[1], ax[0])); } }
    bld(DINE, 40, 12.6, CONC, {par:0.6, fl:1, fh:0, bay:5, ww:2.2, wh:7.5, sill:2.5});
    bld(ADM, 40, 10.4, CONC2, {par:0.6, fl:3, fh:3.3, bay:3.4, ww:1.4, wh:2.0, lit:3, litF:1});
    // recreation yard: walled, west of the cellhouse against the dining hall, concrete bleacher steps, a guard tower
    { const A = [-55.9, -39.9], Bq = [-24.6, -7.8], nrm = [-0.717, 0.699], C = [Bq[0] + nrm[0]*30, Bq[1] + nrm[1]*30], D = [A[0] + nrm[0]*30, A[1] + nrm[1]*30], Y = [A, Bq, C, D];
      cap(B.p(CONC2), Y, 40.2); const o = B.p(CONC2); walls(o, [Bq, C, D, A], 34, 46.2, true); walls(o, offRing(Y, 0.6).slice(1).concat([offRing(Y, 0.6)[0]]), 34, 46.2);
      for (let k = 0; k < 8; k++){ const f = k/8, p0 = lerp2(D, C, 0.05), p1 = lerp2(D, C, 0.95), w0 = lerp2(p0, lerp2(A, Bq, 0.05), 0.04 + f*0.04), w1 = lerp2(p1, lerp2(A, Bq, 0.95), 0.04 + f*0.04);
        sbox(B.p(CONC2), w0, w1, 1.4, 40.2, 40.2 + 0.5*(8 - k)); }
      const gt = lerp2(D, A, 0.0); obox(B.p(CONC2), gt[0], gt[1], 3.6, 3.6, 46.2, 49.8, 0.8); obox(B.p(GLOWG), gt[0], gt[1], 3.8, 3.8, 47.2, 49.2, 0.8); obox(B.p(ROOFC), gt[0], gt[1], 4.6, 4.6, 49.8, 50.4, 0.8); }
    // lighthouse: tapered octagon on the summit, gallery, black lantern, beam
    { const c = [62.3, 49.5], y0 = 40, o = B.p(CONC), ring = (rr, y, a0) => { const P = []; for (let k = 0; k < 8; k++){ const a = a0 + k/8*TAU; P.push([c[0] + Math.cos(a)*rr, y, c[1] + Math.sin(a)*rr]); } return P; };
      const sec = [[2.7, y0 - 2], [2.6, y0 + 3], [1.75, y0 + 23.4]]; for (let k = 0; k < sec.length - 1; k++){ const A = ring(sec[k][0], sec[k][1], 0.39), Bq = ring(sec[k+1][0], sec[k+1][1], 0.39); for (let i = 0; i < 8; i++) q4(o, A[i], A[(i+1) % 8], Bq[(i+1) % 8], Bq[i]); }
      const G0 = ring(2.9, y0 + 23.4, 0.39), G1 = ring(2.9, y0 + 24.0, 0.39); for (let i = 0; i < 8; i++){ q4(o, G0[i], G0[(i+1) % 8], G1[(i+1) % 8], G1[i]); t3(o, [c[0], y0 + 24, c[1]], G1[i], G1[(i+1) % 8]); }
      const ob = B.p(BLACK), RL = ring(2.85, y0 + 25.0, 0.39); for (let i = 0; i < 8; i++){ beam(ob, [G1[i][0], y0 + 24, G1[i][2]], RL[i], 0.05); beam(ob, RL[i], RL[(i+1) % 8], 0.04); }
      const L0 = ring(1.45, y0 + 24.0, 0), L1 = ring(1.45, y0 + 26.6, 0), ol = B.p(LAMPC); for (let i = 0; i < 8; i++) q4(ol, L0[i], L0[(i+1) % 8], L1[(i+1) % 8], L1[i]);
      for (let i = 0; i < 8; i++){ q4(ob, ring(1.45, y0 + 24.0, 0)[i], ring(1.45, y0 + 24.0, 0)[(i+1) % 8], ring(1.5, y0 + 24.5, 0)[(i+1) % 8], ring(1.5, y0 + 24.5, 0)[i]); t3(ob, ring(1.6, y0 + 26.6, 0)[i], ring(1.6, y0 + 26.6, 0)[(i+1) % 8], [c[0], y0 + 27.9, c[1]]); }
      obox(ob, c[0], c[1], 0.5, 0.5, y0 + 27.9, y0 + 28.6, 0);
      for (let k = 2; k < 22; k += 5) for (const a of [0.39, 0.39 + PI]){ const rr = 2.6 - (k/23.4)*0.85, p = [c[0] + Math.cos(a)*(rr + 0.05), c[1] + Math.sin(a)*(rr + 0.05)]; obox(B.p(DARKW), p[0], p[1], 0.2, 0.7, y0 + k, y0 + k + 1.3, a); }
      lmBeam(g, [c[0] + s.position.x, y0 + 25.3 + s.position.y, c[1] + s.position.z], 480, 0.7, 0.05, 2, 10, '#fff2d0', 0.3); }
    // keeper's house ruin beside the lighthouse, warden's house ruin
    shell([[42.8,45.1],[56.8,31.8],[64.3,39.7],[50.3,53]], 40, 8.2, RUIN, 2, 3.6);
    shell([[85.1,39.7],[95,31.6],[98.8,36.2],[97.7,37.1],[105.7,46.6],[100.8,50.6],[99.6,49.2],[95.6,52.4]], 39, 11.5, RUIN, 3, 3.6);
    obox(B.p(RUIN), 102, 45, 2.2, 1.6, 39, 54, 0.88);      // the warden's house chimney
    // Building 64 (1905 barracks) by the wharf, stepped into the slope; restrooms; the dock guard tower
    { const R64 = [[77.2,-21.1],[87.7,-35.6],[148.8,8.7],[144,32.5],[126.3,29],[128.7,16.3]];
      bld(R64, 4.0, 16.8, B64C, {par:0.6, fl:4, fh:3.9, bay:3.6, ww:1.4, wh:2.2, sill:1.2});
      grid(B.p(LITW), R64, 4.0 + 1.2 + 3.9, 1, 0, 25, 1.4, 2.2, 0.08, {minL:20}); grid(B.p(LITW), R64, 4.0 + 1.2 + 7.8, 1, 0, 19, 1.4, 2.2, 0.08, {minL:18}); }
    bld([[137.9,-24.9],[142.4,-31.7],[152,-25.4],[147.5,-18.6]], 3.4, 4.2, CONC2, {fl:1, bay:3, ww:1.2, wh:1.4, sill:1.6});
    { const c = [106.1, -42.1], y0 = H(...c); for (const [a, b] of [[-1.6, -1.6], [1.6, -1.6], [1.6, 1.6], [-1.6, 1.6]]) beam(B.p(DGREY), [c[0] + a, y0 - 1, c[1] + b], [c[0] + a*0.7, y0 + 10, c[1] + b*0.7], 0.2);
      obox(B.p(B64C), c[0], c[1], 3.8, 3.8, y0 + 10, y0 + 12.6, 0.6); obox(B.p(GLOWG), c[0], c[1], 4.0, 4.0, y0 + 10.8, y0 + 12.2, 0.6); hipRoof(s, c[0], c[1], 4.6, 4.6, y0 + 12.6 - base*0, 1.4, ROOFC, 0.6); }
    // the wharf: concrete deck on the bulkhead, the ferry float and its gangway, lamps
    { prism(B.p(CONC2), WHARF, -1.5, 3.5); const F = [[175,4.5],[193.5,20],[201.5,10.5],[182.5,-4.5]]; prism(B.p(DGREY), F, -0.4, 0.9);
      sbox(B.p(DGREY), [176, 2.5], [167, -4], 2.2, 0.9, 1.3); for (const p of [[150, 5], [165, 20], [182, 38], [196, 50], [132, -18], [158, -20]]){ obox(B.p(BLACK), p[0], p[1], 0.25, 0.25, 3.4, 8.2, 0); obox(B.p(LAMPC), p[0], p[1], 0.6, 0.6, 8.2, 8.8, 0); } }
    // sally port (1857 guardhouse) and the chapel above the road, electric shop, officers' club ruin, morgue
    bld([[45.5,-60],[53.9,-72.1],[64.3,-65.2],[61.6,-61.2],[70.9,-55.1],[65,-47]], 14, 8.5, RUIN, {par:0.5, fl:2, fh:3.4, bay:3.6, ww:1.2, wh:1.8});
    bld([[37.4,-63.6],[46.7,-77],[53.9,-72.1],[44.6,-58.7]], 14, 10.5, CONC, {fl:2, fh:3.8, bay:3.3, ww:1.3, wh:2.4, roof:RUST});
    bld([[14.1,-75.1],[17.8,-80.8],[34.2,-70.1],[30.5,-64.4]], 20, 7.6, CONC2, {par:0.4, fl:2, fh:3.4, bay:3.4});
    shell([[-34.4,-116],[-28.6,-126.2],[-1.4,-111],[-7.2,-100.8]], 20, 3.6, RUIN, 1, 3.6);
    bld([[-54,-63.1],[-49.2,-66.5],[-46.7,-63],[-51.5,-59.6]], H(-50.3, -63) - 0.3, 3.4, CONC2, {});
    // water tower (1940): steel tank on legs, cross-braced
    { const c = [-82.3, -96.9], y0 = 27, ob = B.p(RUST), ot = B.p(TANK);
      for (let k = 0; k < 6; k++){ const a = k/6*TAU + 0.2, p = [c[0] + Math.cos(a)*5.8, c[1] + Math.sin(a)*5.8], q = [c[0] + Math.cos(a)*4.6, c[1] + Math.sin(a)*4.6];
        beam(ob, [p[0], y0 - 1, p[1]], [q[0], y0 + 18, q[1]], 0.32);
        const a2 = (k + 1)/6*TAU + 0.2, p2 = [c[0] + Math.cos(a2)*5.8, c[1] + Math.sin(a2)*5.8], q2 = [c[0] + Math.cos(a2)*4.6, c[1] + Math.sin(a2)*4.6];
        for (const [f0, f1] of [[0, 0.5], [0.5, 1]]){ const A = lerp2(p, q, f0), Bq = lerp2(p2, q2, f1), A2 = lerp2(p, q, f1), B2 = lerp2(p2, q2, f0); beam(ob, [A[0], y0 + 19*f0, A[1]], [Bq[0], y0 + 19*f1 - 1, Bq[1]], 0.1); beam(ob, [B2[0], y0 + 19*f0, B2[1]], [A2[0], y0 + 19*f1 - 1, A2[1]], 0.1); }
        obox(B.p(CONC2), p[0], p[1], 1.4, 1.4, y0 - 1.5, y0 + 0.4, a); }
      const P = []; for (let k = 0; k < 16; k++){ const a = k/16*TAU; P.push([c[0] + Math.cos(a)*6.1, c[1] + Math.sin(a)*6.1]); }
      walls(ot, P, y0 + 18, y0 + 26.5); cap(ot, P, y0 + 18); for (let k = 0; k < 16; k++) t3(ot, [P[k][0], y0 + 26.5, P[k][1]], [P[(k+1) % 16][0], y0 + 26.5, P[(k+1) % 16][1]], [c[0], y0 + 29.2, c[1]]);
      walls(ob, offRing(P, 0.05), y0 + 18.2, y0 + 18.8); obox(ob, c[0], c[1], 0.6, 0.6, y0 + 29, y0 + 30.2, 0); }
    // powerhouse and its chimney, quartermaster warehouse, New and Model Industries, cistern
    { const PW = [[-163.8,-168.1],[-148.9,-168.5],[-149,-170.6],[-141.5,-170.9],[-141.8,-180.3],[-134.7,-180.5],[-134.4,-170],[-119.7,-170.5],[-119.5,-165.3],[-122.6,-155.8],[-148.4,-155],[-148.5,-156.3],[-163.4,-155.8]];
      bld(PW, 5, 10.7, CONC2, {par:0.5, fl:2, fh:4.2, bay:4.2, ww:2.2, wh:2.6});
      const P = []; for (let k = 0; k < 14; k++){ const a = k/14*TAU; P.push([-138.3 + Math.cos(a)*2.2, -176 + Math.sin(a)*2.2]); }
      const Q = P.map(p => lerp2(p, [-138.3, -176], 0.32)); for (let k = 0; k < 14; k++){ const a = P[k], b = P[(k+1) % 14], c = Q[(k+1) % 14], d = Q[k]; q4(B.p(RUIN), [a[0], 14, a[1]], [b[0], 14, b[1]], [c[0], 42, c[1]], [d[0], 42, d[1]]); }
      walls(B.p(BLACK), Q, 41.4, 42.2); }
    bld([[-114.3,-156.8],[-106.8,-166.3],[-80.5,-145.9],[-88,-136.4]], 8, 9.0, CONC2, {par:0.4, fl:2, fh:3.8, bay:4, ww:1.6, wh:2.0});
    bld([[-177.6,-122.4],[-159.8,-132.2],[-114.4,-50.9],[-132.2,-41.1]], 10, 9.0, CONC, {par:0.5, fl:2, fh:4.2, bay:4.4, ww:3.0, wh:2.8});
    shell([[-226.6,-149.5],[-215.1,-164.6],[-200.1,-153.4],[-208.7,-142.2],[-189.9,-128.1],[-195.6,-120.5],[-206.8,-128.9],[-209.7,-125.1],[-224.7,-136.3],[-219,-143.8]], 12, 9.5, CONC2, 2, 4.2);
    prism(B.p(CONC2), [[-140.5,-112],[-121.5,-95.5],[-113,-105],[-132,-121.5]], 10, 13.6);
    // small sheds on the paths
    for (const [x, z, w, d, a] of [[-54.2,-99.8,4,3,1.15],[-108.7,-35.6,4.2,3,1.1],[20.5,85.1,4,4,0.97],[127.4,165.6,3.6,4,0.2],[68.6,58.2,5.4,5,0.86]]){ const y0 = H(x, z); obox(B.p(CONC2), x, z, w, d, y0 - 1, y0 + 3.2, a); }
    // the parade ground's rubble (the 1971 demolition of the guards' apartments): broken slabs and heaps
    { const PG = PADS[1][0]; for (let k = 0; k < 70; k++){ const x = 75 + r()*110, z = 40 + r()*115; if (!pip(PG, x, z)) continue; const y0 = H(x, z), w = 1.5 + r()*4, d = 1 + r()*3;
        if (r() < 0.5) obox(B.p(r() < 0.5 ? CONC2 : RUIN), x, z, w, d, y0 - 0.4, y0 + 0.3 + r()*0.9, r()*PI); else blob(B.p(DGREY), x, y0, z, w*0.5, 0.6 + r()*0.8); } }
    // trees and shrubs of the gardens
    { const o = B.p(TREE); for (let k = 0; k < 140; k++){ const x = -200 + r()*400, z = -170 + r()*340; if (!pip(COAST, x, z) || polyDist(COAST, x, z) < 6) continue;
        let skip = false; for (const P of PADS) if (pip(P[0], x, z)) skip = true; if (skip) continue; const y0 = H(x, z), ry = 1.4 + r()*1.4; blob(o, x, y0 + ry*0.45, z, 2.2 + r()*2.0, ry); } }
    B.flush(s);
    return g; }};
place('alcatraz', 'alcatraz', OX, OZ);
}

// =====================================================================================================================
// Pier 39 (1978): the two-level timber shopping village on the pier, on its OSM footprints, in three keys so that each
// ground plan stays tight and the marina's docks keep showing: pier39 (the entrance: the aquarium and the first blocks),
// pier39b (the middle), pier39c (the end with the two-tier carousel, and the sea-lion floats of K-Dock beside it). Weathered
// plank walls, lit storefronts, an upper floor set back behind a railed gallery, hipped shingle roofs; the pier deck is the
// app's own. The few marina walkways whose middle point falls inside a ground plan are redrawn exactly (4 m wide, 1.65 m
// above the water) by a little shader whose positions all sit inside the plan, so they don't widen it.
// =====================================================================================================================
{
const P39 = {
  a:{bld:[["Building B",12.9,[[-44.2,-57.6],[-39.7,-59.6],[-42.7,-66.4],[-38.1,-68.4],[-39.1,-70.6],[-37.2,-71.4],[-38.6,-74.8],[-29.9,-78.6],[-26.5,-71],[-24.8,-71.7],[-22.1,-65.6],[-27.2,-63.4],[-24.3,-56.7],[-26.7,-50.8],[-27.5,-52.5],[-33.7,-49.7],[-35.5,-53.8],[-41.3,-51.3]]],["Fog Harbor Fish House",11.8,[[-56.8,-20.5],[-52.1,-50.5],[-30.6,-47.2],[-34.4,-23.3],[-37,-23.7],[-38.3,-15.5],[-40.4,-14.2],[-53.4,-16.2],[-52.8,-19.9]]],["Aquarium of the Bay",15,[[16.4,-15.7],[17,-19.1],[24.4,-18],[26,-27],[25.3,-28.7],[28,-44.1],[35.4,-47.3],[35.9,-45.8],[43.8,-44.6],[44.2,-46.5],[48.9,-45.7],[47.8,-37.4],[60.3,-10.3],[62.8,-11.4],[66,-4.9],[61.3,-2.7],[64.2,3.5],[65.6,3.7],[64.7,9.4],[63.6,9.2],[63.5,9.7],[60.5,9.1],[58.4,23.2],[55.5,22.6],[54.8,26.4],[54.1,26.4],[54.1,26.9],[40,24.7],[40.1,24.2],[35.9,23.6],[34.9,20.2],[35.9,19.5],[28.3,2.3],[25.3,3.6],[22,-3.7],[23.9,-14.6]]],["Building Q",10.6,[[-21.9,10.8],[-20.2,9.3],[-17.7,-7.2],[-12.7,-6.4],[-11.9,-11.9],[-13.7,-14],[-12.9,-19.1],[-11.8,-19.8],[-10,-31.4],[-7.2,-32.6],[-7.5,-33.2],[-9.7,-34],[-11.1,-37.2],[-9.5,-41],[-5,-43],[-7.3,-48],[-9,-48.6],[-11.2,-54],[-9.8,-59.4],[-2.6,-62.8],[-1.9,-64.5],[-0.1,-65.3],[1.8,-64.7],[2.6,-63.1],[2,-61.5],[3.8,-57.5],[5.4,-56.8],[6.2,-55.1],[5.6,-53.6],[7.7,-49.1],[9.3,-48.5],[10.1,-46.8],[9.4,-45.3],[11.4,-41.1],[12.1,-41.4],[16.9,-39.5],[19.4,-34.7],[17.2,-29.5],[14,-28],[14.8,-26.4],[16.3,-27.1],[18.7,-22],[17.3,-21.4],[15.2,-7.6],[13,-7.3],[11.6,3.1],[10.6,3.9],[8.1,18.5],[4.4,18.8],[-18.1,15]]],["Building A",13,[[-59.5,2.5],[-57.4,-11.8],[-43.3,-9.8],[-45.3,4.5]]],["",6.8,[[-56.8,-20.5],[-52.8,-19.9],[-53.4,-16.2],[-42.5,-14.5],[-42.5,-9.7],[-55.7,-11.6],[-54.9,-17.4],[-55.9,-17.5]]]],
    ghost:[[[165.2,-17.6],[53.3,-36.2],[55.2,-47.6]]]},
  b:{bld:[["Building F",13,[[-77.7,-133.2],[-72.2,-136],[-75.4,-142.8],[-73.2,-143.6],[-71.5,-149.7],[-67.2,-151.7],[-57.7,-131.2],[-59,-130.3],[-57.4,-126.6],[-71.7,-120.1]]],["Building G",12,[[-101.7,-183.9],[-91.9,-188.3],[-89.3,-182.7],[-87.2,-183.7],[-80.6,-169.4],[-71.7,-173.5],[-64.7,-158.4],[-74,-154.2],[-76.6,-147.7],[-80.8,-145.8],[-76.7,-136.9],[-84.1,-133.7],[-94.4,-156.5],[-90.1,-158.6]]],["Building I",7,[[-107.7,-198.2],[-93.8,-204.6],[-89.6,-195.7],[-92.4,-194.5],[-91.4,-192.4],[-102.5,-187.3]]],["Building C",7,[[-61.4,-82.7],[-58,-88.6],[-61.2,-95.4],[-55.6,-97.8],[-48.4,-81.8],[-45.7,-80.7],[-41.7,-71.6],[-47.3,-69.2],[-48.8,-69.7],[-54.6,-67.1]]],["Building D",7,[[-53.4,-98.1],[-41.8,-103.3],[-32.6,-83],[-42,-78.8],[-45.1,-85.5],[-47.2,-84.5]]],["Building N",7.1,[[-67.7,-209.8],[-63.2,-211.8],[-63.7,-213.2],[-55.6,-216.5],[-52.5,-210.1],[-40.4,-215.7],[-38.1,-211.4],[-36.7,-212],[-33.9,-206.2],[-37.6,-204.3],[-35.9,-200.9],[-34.9,-197.2],[-34.7,-188.6],[-38.3,-180.3],[-42.3,-176.1],[-50.9,-171.6]]],["Building O",12.4,[[-56.7,-163.6],[-45.1,-168.8],[-34.8,-146.3],[-45.1,-141.7],[-50,-152.4],[-51.3,-151.9]]],["Building E",7,[[-76.2,-116.3],[-65.8,-121.1],[-65.2,-119.8],[-59.5,-122.4],[-56.5,-115.9],[-58.8,-114.8],[-53.1,-102.4],[-60.8,-98.9],[-62.9,-103.4],[-69.3,-100.5],[-71.8,-105.8],[-73.6,-106.7],[-75.4,-111],[-74.7,-112.9]]],["Building H",13.2,[[-86.2,-197.6],[-81.5,-199.7],[-80,-196.6],[-76.5,-198.2],[-69.1,-182.4],[-79.4,-177.6],[-84.5,-188.6],[-82.5,-189.5]]],["Building P",6.8,[[-43.3,-130.4],[-40.9,-136.6],[-41.8,-138.7],[-33.7,-142.3],[-26.5,-126.5],[-27.6,-126],[-25.3,-120.9],[-23.4,-121.8],[-19.1,-112.3],[-20.9,-111.5],[-11.6,-90.7],[-24.6,-84.9],[-31.3,-99.9],[-33.2,-99.1],[-37.3,-108],[-35.3,-108.8],[-40.6,-120.5],[-39.2,-121.2]]]],
    ghost:[[[-15.4,-146.8],[-17.2,-133.9]],[[-20.7,-147.5],[-22.6,-134.8]],[[-157.3,-140.2],[-98.9,-167]],[[-116.8,-94.7],[-75.4,-114.7]],[[120.3,-159],[-31.3,-184.7]],[[-9.4,-130.8],[-25.7,-133.1]],[[136.5,-109],[-22.6,-134.8]],[[-66.4,12.5],[64.8,30.2],[72.4,15.3],[69.5,9.3],[72.7,0.5],[66.4,-1.7],[59.4,-19.9],[57.7,-20.4],[51.3,-34.4],[51.3,-46.9],[39.1,-48.5],[39.4,-51.8],[17.8,-55.2],[5.8,-64.2],[-36,-156.6],[-33.8,-181.4],[-30.5,-189.9],[-31.9,-192.5],[-30.4,-202.8],[-28.1,-205.6],[-26.7,-225.4],[-24.6,-226.9],[-23.4,-233.1],[-24.9,-236.4],[-23.4,-246.3],[-20.8,-249.3],[-20.1,-254.8],[-36.9,-292.3],[-54.3,-298.8],[-54.9,-300]]]},
  c:{bld:[["San Francisco Carousel",10,[[-81.3,-222.9],[-80.8,-224.7],[-79.8,-226.2],[-78.3,-227.3],[-74.8,-227.7],[-73.2,-227.1],[-71,-224.6],[-70.7,-221.3],[-72.4,-218.4],[-73.9,-217.6],[-77.4,-217.3],[-79,-218.1],[-80.4,-219.4],[-81.2,-221.1]]],["Building M",10.6,[[-83,-265.2],[-77.7,-279.8],[-70.1,-283.1],[-69.6,-282],[-61.4,-285.8],[-62.6,-288.7],[-56.1,-291.6],[-43,-286.8],[-39.4,-279],[-38.3,-279.4],[-33.6,-269.2],[-34.6,-268.8],[-27.3,-253.2],[-29.6,-251.9],[-28.2,-246],[-30.6,-239.6],[-37.4,-236.7],[-33.7,-227.6],[-45.5,-222.2],[-55.8,-225.6],[-60.4,-234.8],[-56.7,-236.4],[-58.2,-239.8],[-47.5,-244.5],[-51,-252.3],[-58,-254.8],[-63,-266.5],[-70.4,-263.3],[-69.7,-261.7],[-75.8,-259.1],[-81,-261]]],["Building L",7,[[-79.2,-254],[-64.4,-260.5],[-62.1,-255.3],[-63.4,-254.8],[-61.8,-251.2],[-59.6,-252.2],[-56.5,-245.4],[-67.1,-240.7],[-68.1,-238.2],[-70.3,-237.2],[-73.2,-238.3],[-73.9,-240],[-73.4,-241.1]]],["Building K",7,[[-132.8,-240.9],[-128.8,-242.7],[-130.4,-246.2],[-128.2,-252.1],[-124.7,-253.7],[-125.8,-256.3],[-116.2,-260.6],[-117.6,-263.6],[-102.6,-270.3],[-99.3,-263.2],[-95.2,-265.1],[-88.1,-249.5],[-96.4,-245.8],[-95.3,-243.5],[-103.7,-239.7],[-99.9,-231.3],[-106.5,-228.3],[-104.9,-224.9],[-116.2,-219.8],[-117.7,-223.2],[-123.6,-220.6]]],["Building J",7,[[-111.4,-219],[-105,-221.9],[-104.7,-221.2],[-102,-222.5],[-102.8,-224.3],[-94.7,-228],[-91.5,-221.1],[-90.5,-221.6],[-85.1,-210.2],[-94.5,-205.9],[-94.9,-206.8],[-97.8,-205.5],[-97.4,-204.7],[-104.6,-201.4],[-108.4,-209.8],[-107.4,-210.3]]]],
    ghost:[[[-62.5,-300],[-73.7,-294.9],[-80,-297.1],[-101.5,-287.4],[-103.8,-281.6],[-129.5,-270.2],[-136.5,-251.3],[-140.1,-246.3],[-122.1,-206.4],[-116.7,-206],[-53.9,-67.2],[-66.4,12.5]]]},
  floats:[[[-170.5,-196],[-169.3,-189.9],[-166.4,-190.5],[-167.6,-196.6]],[[-174,-194.2],[-173.5,-188],[-170.6,-188.3],[-171.1,-194.5]],[[-167.2,-197.2],[-165.1,-191.4],[-162.3,-192.4],[-164.4,-198.2]],[[-163.8,-198.6],[-161.1,-193],[-158.4,-194.3],[-161.2,-199.9]],[[-161,-200.1],[-158.1,-194.6],[-155.5,-195.9],[-158.4,-201.4]],[[-157.6,-201.8],[-154.3,-196.5],[-151.8,-198],[-155,-203.3]],[[-154.3,-202.9],[-150.5,-198],[-148.2,-199.7],[-152,-204.7]],[[-156.5,-210.3],[-154.7,-204.4],[-151.9,-205.2],[-153.6,-211.2]],[[-159.2,-208.8],[-157.4,-202.9],[-154.6,-203.7],[-156.4,-209.7]],[[-162.7,-206.8],[-160.7,-200.9],[-157.9,-201.8],[-159.9,-207.7]],[[-165.9,-205.2],[-164.4,-199.2],[-161.6,-199.9],[-163.1,-205.9]],[[-169.4,-203.4],[-167.4,-197.6],[-164.6,-198.5],[-166.6,-204.4]],[[-172.7,-202.2],[-171,-196.2],[-168.2,-197],[-169.9,-203]],[[-176.5,-200.5],[-174.2,-194.7],[-171.4,-195.8],[-173.8,-201.6]],[[-180.8,-205.7],[-176.8,-200.9],[-174.6,-202.8],[-178.6,-207.6]],[[-174.1,-209.2],[-173.2,-203.1],[-170.3,-203.5],[-171.2,-209.7]],[[-171.2,-210],[-169.3,-204.1],[-166.5,-205],[-168.4,-210.9]],[[-168.4,-211.3],[-165.7,-205.7],[-163,-207],[-165.7,-212.5]],[[-165.3,-213.2],[-162.5,-207.7],[-159.9,-209],[-162.7,-214.5]],[[-161.5,-215],[-158.7,-209.4],[-156.1,-210.7],[-158.8,-216.2]],[[-158.3,-217.2],[-156.2,-211.3],[-153.5,-212.3],[-155.5,-218.1]],[[-160.1,-224.3],[-158.5,-218.3],[-155.7,-219],[-157.3,-225]],[[-164.2,-222.7],[-162.1,-216.9],[-159.3,-217.8],[-161.4,-223.7]],[[-168.1,-220.1],[-165.2,-214.6],[-162.6,-215.9],[-165.5,-221.4]],[[-171.1,-218.7],[-169,-212.9],[-166.3,-213.9],[-168.4,-219.7]],[[-174.6,-217.6],[-172.4,-211.9],[-169.6,-212.9],[-171.9,-218.7]],[[-178.2,-216],[-175.6,-210.3],[-173,-211.5],[-175.5,-217.2]],[[-175.5,-224],[-171.3,-219.4],[-169.1,-221.3],[-173.3,-226]],[[-172.6,-225.8],[-168.4,-221.3],[-166.2,-223.2],[-170.4,-227.8]],[[-167.1,-230],[-164.8,-224.2],[-162.1,-225.3],[-164.4,-231]],[[-162.2,-232.3],[-159.1,-227],[-156.5,-228.4],[-159.7,-233.8]],[[-157.3,-236],[-154.5,-230.4],[-151.9,-231.8],[-154.7,-237.3]],[[-153.4,-238.8],[-150.9,-233.1],[-148.2,-234.3],[-150.7,-239.9]],[[-149.2,-241.9],[-147.6,-235.9],[-144.8,-236.6],[-146.3,-242.6]],[[-146.9,-234.1],[-144.6,-228.3],[-141.8,-229.4],[-144.2,-235.2]],[[-143.8,-226.8],[-141.1,-221.2],[-138.4,-222.4],[-141.1,-228]],[[-146.6,-225.4],[-143.9,-219.9],[-141.2,-221.1],[-143.9,-226.7]],[[-143.5,-218.2],[-140.4,-212.8],[-137.8,-214.3],[-140.9,-219.6]],[[-140.1,-219.4],[-136.8,-214.1],[-134.3,-215.7],[-137.6,-220.9]],[[-146.6,-215.4],[-143.5,-210],[-141,-211.4],[-144,-216.8]],[[-143.4,-209.6],[-141.4,-203.7],[-138.6,-204.7],[-140.6,-210.5]],[[-140,-211.6],[-137.6,-205.9],[-134.9,-207],[-137.2,-212.7]],[[-135.4,-212.4],[-132.1,-207.1],[-129.6,-208.6],[-132.9,-213.9]]]
};

const YD = 1.6;
const WOOD = {c:'#8a7963', lk:0.5}, WOOD2 = {c:'#a38d6e', lk:0.45}, TRIMC = '#5a4e41', SHOP = {c:'#3b3731', glow:'#ffc982', gk:0.95}, UPW = {c:'#3a3936', glow:'#ffd7a2', gk:0.5},
  ROOFP = {c:'#5f5b55', lk:0.12}, RAILC = '#cbbb9a', SEALC = '#3f3127', FLOATC = '#9b9488', LAMPP = {c:'#2a2622', glow:'#ffd08a', gk:2.2};
const GHOST_VS = '#include <fog_pars_vertex>\nuniform vec3 uO;\nvoid main(){ vec3 p = uO + color; vec4 mvPosition = modelViewMatrix*vec4(p, 1.0); gl_Position = projectionMatrix*mvPosition;\n#include <fog_vertex>\n}';
const GHOST_FS = '#include <fog_pars_fragment>\nuniform vec3 uCol; uniform float uN;\nvoid main(){ gl_FragColor = vec4(uCol*mix(1.0, 0.13, uN), 1.0);\n#include <fog_fragment>\n}';
// redraw hidden pier walkways (polylines in the reference frame) as 4 m ribbons; o = a point inside the ground plan
function ghostLines(g, s, o, lines, w, y, col){
  const off = [], O = [o[0] + s.position.x, y + s.position.y, o[1] + s.position.z];
  for (const L of lines) for (let i = 0; i < L.length - 1; i++){
    const a = L[i], b = L[i+1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = -dz/l*w/2, nz = dx/l*w/2, e = 0.02;
    const P = (p, k) => [p[0] + nx*k - o[0] - dx/l*e, 0, p[1] + nz*k - o[1] - dz/l*e];
    off.push(...P(a, 1), ...P(b, 1), ...P(b, -1), ...P(a, 1), ...P(b, -1), ...P(a, -1));
  }
  if (!off.length) return;
  let ext = 10; for (let i = 0; i < off.length; i += 3) ext = Math.max(ext, Math.hypot(off[i], off[i+2]));
  const n = off.length/3, pos = []; for (let i = 0; i < n; i++) pos.push(O[0], O[1] + ((i % 3) - 1)*ext, O[2]);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(off, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(n*3), 3));
  const mat = new THREE.ShaderMaterial({uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {uO:{value:new THREE.Vector3(...O)}, uCol:{value:new THREE.Color(col)}, uN:{value:0}}]), vertexShader:GHOST_VS, fragmentShader:GHOST_FS, fog:true, vertexColors:true, side:THREE.DoubleSide});
  mat.uniforms.uN = NIGHT.uNight; LMCTX.mats.set('ghost|' + LMCTX.mats.size, mat);
  g.add(new THREE.Mesh(geo, mat));
}
// a two-level pier building on its footprint: lit storefronts, an upper floor set back behind a railed gallery, hipped roof
function pierBld(B, R, h, r){
  const A = Math.abs(area2(R)); let per = 0; for (let i = 0; i < R.length; i++) per += Math.hypot(R[(i+1) % R.length][0] - R[i][0], R[(i+1) % R.length][1] - R[i][1]);
  // OSM heights here are the eaves (two storeys = 7 m); the hipped roof rises above them
  const wmin = 2*A/per, gal = Math.min(1.6, 0.16*wmin), eave = YD + Math.max(7.2, h - (h > 9 ? 1.5 : 0)), rh = Math.min(3.6, Math.max(2.0, 0.22*wmin)), y1 = YD + 3.9;
  const RU = offRing(R, -gal);
  walls(B.p(WOOD), R, YD - 0.4, y1); grid(B.p(SHOP), R, YD + 0.3, 1, 0, 4.4, 3.1, 2.6, 0.06, {minL:3});
  grid(B.p(TRIMC), R, YD + 3.0, 1, 0, 4.4, 3.5, 0.35, 0.08, {minL:3});
  // gallery floor, railing, posts
  for (let i = 0; i < R.length; i++){ const a = R[i], b = R[(i+1) % R.length], c = RU[(i+1) % R.length], d = RU[i];
    q4(B.p(WOOD2), [a[0], y1, a[1]], [b[0], y1, b[1]], [c[0], y1, c[1]], [d[0], y1, d[1]]);
    q4(B.p(RAILC), [a[0], y1, a[1]], [b[0], y1, b[1]], [b[0], y1 + 1.0, b[1]], [a[0], y1 + 1.0, a[1]]);
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) > 3) obox(B.p(TRIMC), a[0], a[1], 0.3, 0.3, y1, y1 + 1.1, 0); }
  walls(B.p(r() < 0.5 ? WOOD : WOOD2), RU, y1, eave); { const nf = Math.max(1, Math.floor((eave - y1 - 0.6)/3.2)); grid(B.p(UPW), RU, y1 + 0.9, nf, 3.2, 3.4, 1.5, Math.min(1.8, eave - y1 - 1.4), 0.06, {minL:3}); }
  // roof: from a small overhang up to an inset ridge ring
  const RE = offRing(RU, 0.5), RI = offRing(RU, -Math.min(3.4, 0.36*wmin)), o = B.p(ROOFP);
  for (let i = 0; i < RE.length; i++){ const j = (i + 1) % RE.length; q4(o, [RE[i][0], eave, RE[i][1]], [RE[j][0], eave, RE[j][1]], [RI[j][0], eave + rh, RI[j][1]], [RI[i][0], eave + rh, RI[i][1]]); }
  cap(o, RI, eave + rh); walls(B.p(TRIMC), RE, eave - 0.35, eave);
}
const pierKey = (key, sec, OX, OZ, R0, extra) => {
  LANDMARKS[key] = {zh:key === 'pier39' ? '39号码头' : key === 'pier39b' ? '39号码头商店街' : '39号码头旋转木马与海狮',
    en:key === 'pier39' ? 'Pier 39' : key === 'pier39b' ? 'Pier 39 shops' : 'Pier 39 carousel and sea lions', cat:'new', r:R0, h:17, lt:{m:0, c:'#ffd29a', k:0.5},
    build(){
      const g = new THREE.Group(), s = frame(g, 'pier39', OX, OZ, R0), B = mkB(), r = LMCTX.rng;
      for (const [nm, h, R] of P39[sec].bld){ if (/Carousel/.test(nm)) continue; pierBld(B, R, h, r); }
      if (extra) extra(B, s, r);
      B.flush(s);
      ghostLines(g, s, [OX, OZ], P39[sec].ghost, 4, 1.65, '#b9b09f');
      return g; }};
  place(key, 'pier39', OX, OZ);
};
pierKey('pier39', 'a', 0, -20, 76, (B, s, r) => {
  // the entrance plaza's lamp posts and a few palms
  for (const [x, z] of [[-20, 18], [0, 22], [-38, 14], [26, 26]]){ obox(B.p(TRIMC), x, z, 0.25, 0.25, YD, YD + 4.5, 0); obox(B.p(LAMPP), x, z, 0.6, 0.6, YD + 4.5, YD + 5.1, 0); }
});
pierKey('pier39b', 'b', -56, -146, 80, null);
pierKey('pier39c', 'c', -104, -232, 86, (B, s, r) => {
  // the San Francisco Carousel: two-tier, under a striped canopy with a crown, ringed with lights
  { const c = [-76, -222.5], y0 = YD, P = (rr, a, y) => [c[0] + Math.cos(a)*rr, y, c[1] + Math.sin(a)*rr], n = 24;
    const o = B.p(RAILC), oR = B.p({c:'#b8352c', lk:0.5}), oG = B.p({c:'#e9c46a', glow:'#ffd27a', gk:0.6});
    for (let k = 0; k < n; k++){ const a0 = k/n*TAU, a1 = (k + 1)/n*TAU;
      q4(B.p(TRIMC), P(5.4, a0, y0), P(5.4, a1, y0), P(5.4, a1, y0 + 0.7), P(5.4, a0, y0 + 0.7)); t3(B.p(TRIMC), [c[0], y0 + 0.7, c[1]], P(5.4, a0, y0 + 0.7), P(5.4, a1, y0 + 0.7));
      t3(B.p(TRIMC), [c[0], y0 + 4.0, c[1]], P(4.2, a0, y0 + 4.0), P(4.2, a1, y0 + 4.0));
      q4(k % 2 ? o : oR, P(5.7, a0, y0 + 7.2), P(5.7, a1, y0 + 7.2), P(1.2, a1, y0 + 9.3), P(1.2, a0, y0 + 9.3));
      q4(oG, P(5.7, a0, y0 + 6.5), P(5.7, a1, y0 + 6.5), P(5.7, a1, y0 + 7.2), P(5.7, a0, y0 + 7.2));
      q4(oG, P(4.3, a0, y0 + 3.4), P(4.3, a1, y0 + 3.4), P(4.3, a1, y0 + 4.0), P(4.3, a0, y0 + 4.0));
      if (k % 2 === 0){ obox(oG, ...[P(4.9, a0, 0)[0], P(4.9, a0, 0)[2]], 0.18, 0.18, y0 + 0.7, y0 + 6.5, 0); obox(oG, ...[P(3.6, a0, 0)[0], P(3.6, a0, 0)[2]], 0.15, 0.15, y0 + 4.0, y0 + 6.5, 0);
        const hp = P(4.6, a0 + 0.05, 0); obox(B.p(k % 4 ? RAILC : SEALC), hp[0], hp[2], 1.5, 0.45, y0 + 1.6, y0 + 2.5, a0 + PI/2); const hq = P(3.4, a0 + 0.13, 0); obox(B.p(k % 4 ? SEALC : RAILC), hq[0], hq[2], 1.3, 0.4, y0 + 4.8, y0 + 5.6, a0 + PI/2); } }
    LCyl(s, 1.1, 1.3, 7.2, c[0], y0 + 0.7, c[1], RAILC, 12); LCyl(s, 0.4, 1.2, 1.8, c[0], y0 + 9.3, c[1], {c:'#e9c46a', glow:'#ffd27a', gk:0.6}, 12); LSph(s, 0.45, c[0], y0 + 11.3, c[1], {c:'#e9c46a', glow:'#ffd27a', gk:0.6}, 1, 8);
    const sp = []; for (let k = 0; k < 48; k++){ const a = k/48*TAU; sp.push(...P(5.75, a, y0 + 6.85), ...P(4.35, a + 0.06, y0 + 3.7)); } lmSparkle(s, sp, 2.2, 3); }
  // K-Dock: the sea-lion floats and their sunbathers
  { const of = B.p(FLOATC), os = B.p(SEALC);
    for (const F of P39.floats){ const c = [(F[0][0] + F[2][0])/2, (F[0][1] + F[2][1])/2]; prism(of, offRing(F, 0.15), 1.1, 1.75);
      const ax = [F[1][0] - F[0][0], F[1][1] - F[0][1]], L = Math.hypot(...ax), ang = Math.atan2(ax[1], ax[0]), m = 1 + ((r()*3.2) | 0);
      for (let k = 0; k < m; k++){ const t = (k + 0.5)/m - 0.5, p = [c[0] + Math.cos(ang)*t*L*0.75 + (r() - 0.5)*0.8, c[1] + Math.sin(ang)*t*L*0.75 + (r() - 0.5)*0.8], a = ang + PI/2 + (r() - 0.5)*0.9, sl = 1.7 + r()*0.6;
        const fw = [Math.cos(a)*sl/2, Math.sin(a)*sl/2], sd = [-Math.sin(a)*0.32, Math.cos(a)*0.32], y = 1.75, top = [p[0], y + 0.42, p[1]];
        const Q = [[p[0] + fw[0], y + 0.12, p[1] + fw[1]], [p[0] + sd[0], y + 0.05, p[1] + sd[1]], [p[0] - fw[0], y + 0.05, p[1] - fw[1]], [p[0] - sd[0], y + 0.05, p[1] - sd[1]]];
        for (let i = 0; i < 4; i++) t3(os, Q[i], Q[(i+1) % 4], top); } } }
});
}

// =====================================================================================================================
// Ghirardelli Square: the red-brick chocolate factory blocks on the slope above Aquatic Park (Cocoa, Chocolate, Mustard,
// Woolen Mill, Power House, Apartment House, Carousel and the 1916 Clock Tower building modelled on the Chateau de Blois),
// the 1960s Wurster building and plaza pavilions that form the terraced plazas, the fountain plaza; on the Cocoa
// building's roof the big sign's steel frame stands blank and dark (no letters). Buildings on their OSM footprints, each
// on the lowest ground under it (the uphill sides run into the slope), low pavilions topped with plaza paving.
// =====================================================================================================================
{
const K = 'ghirardelli', OX = -5, OZ = 5, R0 = 80;
const BRK = {c:'#a24f3a', lk:0.8}, BRK2 = {c:'#8f4433', lk:0.75}, TRIM = {c:'#e8e1d1', lk:0.8}, WIN = {c:'#2d2b29', glow:'#ffcf96', gk:0.35}, WINL = {c:'#35302a', glow:'#ffcf96', gk:1.1},
  ROOFG = {c:'#7f7b74', lk:0.2}, PAVE = {c:'#c4b8a4', lk:0.3}, SLATE = {c:'#56625f', lk:0.35}, FRAME = '#262626', CLOCK = {c:'#f3efe4', glow:'#fff3d6', gk:1.6}, GREEN = '#5b7a43', BROWN = '#5f4b39', WATER = {c:'#5e7f8f', glow:'#7fb0c8', gk:0.4};
const BL = [ // [name, ring, height (OSM), kind]   kind: b brick, w Wurster (stucco/brick 1960s), p plaza pavilion, t clock tower building
  ['Cocoa', [[-48.7,23.1],[-45.2,22.5],[-43.9,30.4],[-22.1,26.8],[-22.6,24.1],[-18.2,23.4],[-17.7,26.3],[-10,25],[-10.1,24.3],[-5,23.5],[-5.3,21.7],[-2,21.2],[1.9,45.1],[-43.8,52.5]], 22, 'b'],
  ['Chocolate', [[-65,21.6],[-49.5,19.1],[-43.8,52.5],[-59.4,55.1]], 22, 'b'],
  ['Mustard', [[-0.9,27.9],[15,25.1],[14.6,22.6],[19,21.8],[19.5,24.4],[38.5,21.1],[41.5,38.2],[1.9,45.1]], 12, 'b'],
  ['Woolen Mill', [[-68.2,4.8],[-66.9,-11.5],[-43.6,-9.6],[-43.2,-13.6],[-31.9,-12.6],[-32.2,-9],[-23.7,-8.3],[-25,8.3]], 10, 'b'],
  ['Power House', [[-72.7,-27.7],[-36.6,-33.1],[-35.4,-25.3],[-43.8,-24],[-42.3,-13.5],[-43.2,-13.6],[-43.6,-9.6],[-66.9,-11.5],[-68.5,4.8]], 7.5, 'b'],
  ['', [[-68.2,4.8],[-51.6,6.1],[-49.5,19.1],[-65,21.6]], 9, 'b'],
  ['Apartment House', [[39,-12.7],[56.3,-15.4],[58.4,-2.2],[41.1,0.7]], 10.6, 'b'],
  ['Carousel', [[38.4,-16.3],[39.8,-16.5],[39.5,-18.7],[44.6,-19.5],[43.6,-25.7],[44.4,-27.1],[43.1,-35.5],[52.8,-37],[56.3,-15.4],[39,-12.7]], 7, 'b'],
  ['Wurster', [[-29.3,-34.2],[-10.4,-37.3],[-10.8,-39.2],[11.5,-43],[17.8,-43.6],[22.2,-44.7],[27.4,-45.4],[32.7,-46.3],[34.9,-46.1],[36,-39.3],[37,-39.4],[37.9,-34.2],[36.7,-34],[38.3,-24.7],[36.6,-24.4],[36.9,-22.4],[28.1,-20.9],[27.5,-24.3],[2.6,-20.2],[2.7,-19.2],[-7.4,-17.5],[-7.7,-19.5],[-20.4,-17.4],[-20.5,-18.2],[-26.4,-17.2]], 7, 'w'],
  ['Plaza', [[-19,-16.3],[-7.9,-18.2],[-7.6,-16.8],[0.6,-18.2],[1.2,-14.3],[5,-15],[4.3,-19.2],[10.4,-20.3],[10.7,-21.5],[17.8,-22.7],[18.5,-18.7],[11,-17.5],[11.4,-15.7],[17.9,-16.8],[19.8,-5.6],[-16.1,0.5]], 3.8, 'p'],
  ['Infill', [[-22,11.8],[-13.7,10.5],[-13.9,9.2],[5,6.2],[5.6,9.9],[2.7,10.3],[3.2,13.3],[4.7,13],[5.2,16.4],[-20.6,20.5]], 3.8, 'p'],
  ['', [[-6.8,-1.1],[3.5,-2.9],[5,6.2],[-5.4,7.9]], 2.8, 'p'],
  ['', [[38.7,22.6],[41.3,22.2],[43.8,36.1],[41.2,36.5]], 10.6, 'b'],
  ['', [[39.1,8.9],[47.1,7.7],[47.7,11.5],[39.8,12.8]], 3.8, 'p'],
  ['Clock Tower', [[39.8,12.8],[56.3,10.1],[59.6,29.4],[60.1,29.3],[61.2,35.6],[55,36.7],[54.8,35.8],[44,37.6]], 15, 't']];
LANDMARKS.ghirardelli = {zh:'吉尔德利广场', en:'Ghirardelli Square', cat:'old', r:R0, h:42, lt:{m:0, c:'#ffc78f', k:0.85, anim:'breathe'},
  build(){
    const g = new THREE.Group(), s = frame(g, K, OX, OZ, R0), B = mkB(), r = LMCTX.rng, gy = (x, z) => gnd(K, x, z);
    const levels = {};
    for (const [nm, R, h, kind] of BL){
      const gs = R.map(p => gy(...p)), lo = Math.min(...gs), hi = Math.max(...gs);
      let top = Math.max(lo + h, hi + (kind === 'p' ? 0.4 : kind === 'w' ? 0.8 : 3.6)); if (nm === 'Cocoa' || nm === 'Chocolate') top = Math.max(top, hi + 10);
      levels[nm] = {lo, hi, top};
      if (kind === 'p'){ walls(B.p(BRK2), R, lo - 1.5, top); cap(B.p(PAVE), R, top); walls(B.p(TRIM), offRing(R, 0.1), top - 0.1, top + 0.9); grid(B.p(WINL), R, lo + 0.3, 1, 0, 4.2, 3, 2.6, 0.06, {minL:3}); continue; }
      if (kind === 'w'){ walls(B.p(BRK2), R, lo - 1.5, top); cap(B.p(PAVE), R, top); walls(B.p(TRIM), offRing(R, 0.1), top - 0.3, top + 0.9);
        grid(B.p(WINL), R, lo + 0.4, 1, 0, 4.0, 3.2, 2.8, 0.06, {minL:3}); grid(B.p(WIN), R, lo + 4.1, 1, 0, 3.0, 2.2, 2.0, 0.06, {minL:3}); continue; }
      const eave = kind === 't' ? lo + 15 : top;
      walls(B.p(kind === 't' ? BRK2 : BRK), R, lo - 1.5, eave); cap(B.p(ROOFG), R, eave - 0.2);
      const RO = offRing(R, 0.3); walls(B.p(TRIM), RO, eave - 0.7, eave - 0.1); walls(B.p(BRK), offRing(R, 0.15), eave - 0.1, eave + 0.9); walls(B.p(TRIM), offRing(R, 0.2), eave + 0.9, eave + 1.15); walls(B.p(BRK2), offRing(R, -0.25), eave - 0.2, eave + 1.15);
      const nf = Math.max(1, Math.round((eave - lo - 1)/3.9));
      for (let f = 1; f < nf; f++) walls(B.p(TRIM), offRing(R, 0.08), lo + f*3.9 - 0.15, lo + f*3.9 + 0.12);
      grid(B.p(WIN), R, lo + 0.9, nf, 3.9, 3.3, 1.5, 2.5, 0.07, {arch:true, seg:4, minL:3});
      grid(B.p(WINL), R, lo + 0.9 + 3.9*((nf/2) | 0), 1, 0, 3.3*3, 1.5, 2.5, 0.09, {arch:true, seg:4, minL:10});
    }
    // the 1916 clock tower at North Point and Larkin: brick shaft, stone clock stage, steep slate roof with pinnacles
    { const T = [[53.7,30.6],[60.1,29.3],[61.2,35.6],[55,36.7]], c = [57.5, 33.05], L = levels['Clock Tower'], y0 = L.lo, ob = B.p(BRK2), ot = B.p(TRIM);
      walls(ob, T, y0 - 1.5, y0 + 25); const T1 = offRing(T, 0.5); walls(ot, T1, y0 + 25, y0 + 29.4); cap(ot, T1, y0 + 29.4);
      for (const p of T) obox(ot, p[0], p[1], 0.9, 0.9, y0 + 12, y0 + 25, Math.atan2(T[1][1] - T[0][1], T[1][0] - T[0][0]));
      for (let i = 0; i < 4; i++){ const E = edgeFrame(T1, i), m = E.L/2, P = [], cc = [E.a[0] + E.t[0]*m + E.n[0]*0.08, y0 + 27.2, E.a[1] + E.t[1]*m + E.n[1]*0.08];
        for (let k = 0; k < 16; k++) P.push([cc[0] + E.t[0]*Math.cos(k/16*TAU)*1.7, y0 + 27.2 + Math.sin(k/16*TAU)*1.7, cc[2] + E.t[1]*Math.cos(k/16*TAU)*1.7]);
        for (let k = 0; k < 16; k++) t3(B.p(CLOCK), cc, P[k], P[(k+1) % 16]);
        const E0 = edgeFrame(T, i); for (const yy of [y0 + 16, y0 + 20.2]) archE(B.p(WIN), E0, E0.L/2, 1.4, yy, yy + 2.3, 0.08, 4); }
      const RT = offRing(T, 0.7), o = B.p(SLATE), apex = [c[0], y0 + 38.5, c[1]];
      for (let i = 0; i < 4; i++){ const a = RT[i], b = RT[(i+1) % 4]; t3(o, [a[0], y0 + 29.4, a[1]], [b[0], y0 + 29.4, b[1]], apex); }
      for (const p of RT){ obox(ot, p[0], p[1], 1.1, 1.1, y0 + 29.4, y0 + 31.8, 0.2); const q = lerp2(p, c, 0.02); t3(o, [q[0] - 0.6, y0 + 31.8, q[1]], [q[0] + 0.6, y0 + 31.8, q[1]], [q[0], y0 + 34.5, q[1]]); t3(o, [q[0], y0 + 31.8, q[1] - 0.6], [q[0], y0 + 31.8, q[1] + 0.6], [q[0], y0 + 34.5, q[1]]); }
      for (let i = 0; i < 4; i++){ const E = edgeFrame(RT, i), m = lerp2(E.a, E.b, 0.5), d = [m[0] + E.n[0]*-1.2, m[1] + E.n[1]*-1.2]; gable(s, d[0], d[1], 1.6, 1.8, y0 + 31.2, 1.6, SLATE, -Math.atan2(E.t[1], E.t[0]));
        obox(B.p(TRIM), d[0], d[1], 1.2, 0.3, y0 + 30.2, y0 + 31.4, Math.atan2(E.t[1], E.t[0])); }
      obox(B.p(FRAME), c[0], c[1], 0.35, 0.35, y0 + 38.2, y0 + 41.5, 0); }
    // the sign on the Cocoa building's roof: its steel frame along the bay side, blank and dark (the letters are a brand)
    { const L = levels['Cocoa'], y0 = L.top + 1.0, a = [-46.6, 24.6], b = [-3.6, 19.6], o = B.p(FRAME), n = 16;
      for (let k = 0; k <= n; k++){ const p = lerp2(a, b, k/n); obox(o, p[0], p[1], 0.3, 0.3, y0, y0 + 5.6, Math.atan2(b[1] - a[1], b[0] - a[0])); if (k < n){ const q = lerp2(a, b, (k + 1)/n); beam(o, [p[0], y0 + 0.4, p[1]], [q[0], y0 + 5.2, q[1]], 0.08); } }
      for (const yy of [y0 + 0.3, y0 + 2.9, y0 + 5.4]) sbox(o, a, b, 0.25, yy, yy + 0.25);
      for (let k = 0; k < n; k++){ const p = lerp2(a, b, (k + 0.5)/n), q = lerp2(a, b, (k + 0.5)/n + 0.0); beam(o, [p[0], y0 + 5.5, p[1]], [q[0] + 1.4, y0 + 0.2, q[1] + 2.4], 0.06); } }
    // the fountain plaza: a paved terrace round the mermaid fountain, the pool, trees and lamps
    { const FP = [[20,-18],[38.2,-21],[39,-12.7],[41.1,0.7],[42,8],[23,10],[19.8,-5.6]], lv = Math.max(...FP.map(p => gy(...p))) + 0.3;
      prism(B.p(PAVE), FP, lv - 3, lv); walls(B.p(TRIM), offRing(FP, 0.05), lv, lv + 0.7);
      const fc = [32.3, -5.5], P = []; for (let k = 0; k < 8; k++){ const a = k/8*TAU + PI/8; P.push([fc[0] + Math.cos(a)*2.9, fc[1] + Math.sin(a)*2.9]); }
      prism(B.p(TRIM), P, lv, lv + 0.6); cap(B.p(WATER), offRing(P, -0.4), lv + 0.65); obox(B.p(BROWN), fc[0], fc[1], 0.9, 0.9, lv + 0.6, lv + 2.4, 0.4);
      for (const [x, z] of [[24, -14], [36, -16], [26, 4], [38, 4]]) { obox(B.p(BROWN), x, z, 0.4, 0.4, lv, lv + 2.4, 0); blob(B.p(GREEN), x, lv + 4.2, z, 2.4, 2.2); }
      for (const [x, z] of [[22, -8], [40, -8], [30, 7]]) { obox(B.p(FRAME), x, z, 0.2, 0.2, lv, lv + 3.6, 0); obox(B.p(CLOCK), x, z, 0.5, 0.5, lv + 3.6, lv + 4.1, 0); } }
    B.flush(s);
    return g; }};
place('ghirardelli', 'ghirardelli', OX, OZ);
}

// =====================================================================================================================
// de Young Museum (2005, Herzog & de Meuron): a long low copper-clad block (perforated, dimpled copper plates weathering to
// brown with a green bloom) with courtyards cut into its roof and a deep cantilevered roof over the entrance court, and the
// Hamon tower at its north-east end, 44 m, twisting from the museum's grid at the base to the city's at the top, with the
// glazed observation floor under its roof. Plan and the tower's floor-by-floor outline from OSM.
// =====================================================================================================================
{
const K = 'deyoung', OX = -10, OZ = -12, R0 = 100;
const RING = [[-90,12.3],[25.1,-90.4],[29,-72.1],[36.9,-63.5],[32.6,-59.7],[39.2,-56.7],[41.3,-58.6],[68.8,-28.3],[-38.6,68.7]];
const A0 = [-90, 12.3], U = [0.746, -0.666], V = [0.666, 0.746], UV = (u, v) => [A0[0] + U[0]*u + V[0]*v, A0[1] + U[1]*u + V[1]*v];
// the tower's floor outlines (OSM building parts), heights scaled to the real 44 m
const TWR = [[13,[[11.3,-78.1],[18,-84.1],[36.9,-63.5],[30.1,-57.4]]],[18,[[13,-79.6],[19.8,-85.7],[36.2,-62.9],[29.5,-56.8]]],[23,[[14.8,-81.2],[21.5,-87.2],[35.5,-62.3],[28.8,-56.2]]],
  [28,[[16.5,-82.6],[23.2,-88.7],[34.8,-61.7],[28.1,-55.6]]],[33,[[18.3,-84.3],[25.1,-90.4],[34.1,-61],[27.4,-54.9]]],[38,[[20.2,-86],[26.9,-92],[33.4,-60.3],[26.6,-54.2]]],[46,[[19.7,-86.2],[27.2,-92.9],[33.8,-60.2],[26.4,-53.3]]],[51,[[19.7,-86.2],[27.2,-92.9],[33.8,-60.2],[26.4,-53.3]]]];
const CU = {c:'#6b4b36', lk:0.45}, CU2 = {c:'#86654a', lk:0.45}, CUG = {c:'#5f6852', lk:0.4}, GLS = {c:'#3c474c', glow:'#ffd9a6', gk:0.55}, GLT = {c:'#47545a', glow:'#ffe2b8', gk:0.9}, PAV = '#b9b2a4', TREEC = '#55703f';
function capH(o, outer, holes, y){
  const tri = THREE.ShapeUtils.triangulateShape(outer.map(p => new THREE.Vector2(p[0], p[1])), holes.map(h => h.map(p => new THREE.Vector2(p[0], p[1]))));
  const all = outer.concat(...holes); for (const [a, b, c] of tri) t3(o, [all[a][0], y, all[a][1]], [all[c][0], y, all[c][1]], [all[b][0], y, all[b][1]]);
}
LANDMARKS.deyoung = {zh:'笛洋美术馆', en:'de Young Museum', cat:'new', r:R0, h:46, lt:{m:0, c:'#ffcf9a', k:0.4},
  build(){
    const g = new THREE.Group(), s = frame(g, K, OX, OZ, R0), B = mkB(), r = LMCTX.rng, Y0 = 75.3, YT = Y0 + 13, gy = (x, z) => gnd(K, x, z);
    // the block's walls with the entrance court cut into the south-east side
    const W = [UV(0, 0), UV(154.3, 0.1), UV(145, 16.3), UV(145.2, 28), UV(139.4, 28), UV(142.4, 34.5), UV(145.2, 34.5), UV(145.5, 75.5), UV(84, 75.9), UV(80, 58), UV(52, 58), UV(48, 76.1), UV(0.8, 76.3)];
    walls(B.p(CU), W, Y0 - 3, YT);
    // courtyards cut into the top (lined with glass below, copper above), trees in them
    const CY = [[[20, 20], [42, 18], [44, 38], [22, 40]], [[70, 32], [90, 34], [88, 50], [68, 48]], [[110, 16], [128, 18], [127, 33], [108, 31]]].map(q => q.map(p => UV(...p)));
    for (const C of CY){ walls(B.p(GLS), C, Y0, Y0 + 5.2); walls(B.p(CU), C, Y0 + 5.2, YT); cap(B.p(PAV), C, Y0 + 0.1); const c = lerp2(C[0], C[2], 0.5); for (let k = 0; k < 3; k++){ const p = lerp2(c, C[k], 0.45); obox(B.p('#5a4636'), p[0], p[1], 0.4, 0.4, Y0, Y0 + 3.5, 0); blob(B.p(TREEC), p[0], Y0 + 6, p[1], 3, 3); } }
    // roof: the full plan plus the cantilever over the entrance, courtyards open
    const RF = [UV(0, 0), UV(154.3, 0.1), UV(145, 16.3), UV(145.2, 28), UV(139.4, 28), UV(142.4, 34.5), UV(145.2, 34.5), UV(145.5, 75.5), UV(96, 75.8), UV(94, 88), UV(38, 88), UV(36, 76.2), UV(0.8, 76.3)];
    capH(B.p({c:'#5e4637', lk:0.2}), RF, CY.map(c => c.slice().reverse()), YT); walls(B.p(CU), [UV(96, 75.8), UV(94, 88), UV(38, 88), UV(36, 76.2)], YT - 0.9, YT, true); cap(B.p('#4c3829'), [UV(96, 75.8), UV(94, 88), UV(38, 88), UV(36, 76.2)], YT - 0.9);
    // standing seams of the copper roof (and around the courtyards' openings they simply stop at the voids)
    { const o = B.p(CU2); for (let v = 4; v < 86; v += 5.5) for (let u0 = 1; u0 < 152; u0 += 12){ const u1 = Math.min(u0 + 11.4, v > 76 ? 94 : 152);
        if (v > 76 && (u1 < 38 || u0 > 94)) continue; const a = UV(Math.max(u0, v > 76 ? 38 : 0), v), b = UV(u1, v), m = UV((u0 + u1)/2, v);
        if (CY.some(C => pip(C, ...m)) || !pip(RF, ...m)) continue; sbox(o, a, b, 0.22, YT, YT + 0.12); } }
    // entrance court: glass walls behind, a few slender columns under the cantilever, paving
    walls(B.p(GLS), [UV(84, 75.9), UV(80, 58), UV(52, 58), UV(48, 76.1)], Y0, Y0 + 5.5, true); walls(B.p(CU), [UV(84, 75.9), UV(80, 58), UV(52, 58), UV(48, 76.1)], Y0 + 5.5, YT, true);
    cap(B.p(PAV), [UV(96, 75.8), UV(94, 88), UV(38, 88), UV(36, 76.2), UV(48, 76.1), UV(52, 58), UV(80, 58), UV(84, 75.9)], Y0 + 0.05);
    for (const u of [44, 60, 76, 90]){ const p = UV(u, 86); obox(B.p('#3b3b38'), p[0], p[1], 0.35, 0.35, gy(...p) - 0.5, YT - 0.9, 0); }
    // ground-floor glazing strips and the copper's dimpled, perforated plates (lighter and greener patches)
    { const o = B.p(GLS); grid(o, W, Y0 + 0.2, 1, 0, 26, 9, 4.2, 0.06, {minL:20}); }
    // mottled copper: courses of plates, lighter (perforated), greener (patina) and darker runs
    for (let i = 0; i < W.length; i++){ const E = edgeFrame(W, i); if (E.L < 6) continue;
      for (let y = Y0 + 1.0; y < YT - 0.8; y += 1.05){ let u = r()*2; while (u < E.L - 1){ const l = 0.8 + r()*3.4, q = r();
        if (q < 0.55) rectE(B.p(q < 0.2 ? CUG : q < 0.4 ? CU2 : '#58402f'), E, u, Math.min(E.L - 0.2, u + l), y, y + 0.92, 0.05); u += l + r()*2.5; } } }
    // the Hamon tower: ruled faces between the twisting floor outlines
    { const T = TWR.map(([h, R]) => [Y0 + 13 + (h - 13)*31/38, R]); T.unshift([Y0 - 2, TWR[0][1]]);
      const yG0 = Y0 + 38.2, yG1 = Y0 + 42.4;
      for (let k = 0; k < T.length - 1; k++){ const [ya, Ra] = T[k], [yb, Rb] = T[k+1];
        for (let i = 0; i < 4; i++){ const a0 = Ra[i], a1 = Ra[(i+1) % 4], b0 = Rb[i], b1 = Rb[(i+1) % 4];
          const segs = [[ya, yb]]; const out = [];
          // split the face at the glazed observation band
          let cuts = [ya]; for (const yc of [yG0, yG1]) if (yc > ya && yc < yb) cuts.push(yc); cuts.push(yb);
          for (let c = 0; c < cuts.length - 1; c++){ const t0 = (cuts[c] - ya)/(yb - ya), t1 = (cuts[c+1] - ya)/(yb - ya), mid = (cuts[c] + cuts[c+1])/2, gl = mid > yG0 && mid < yG1;
            const P = (aa, bb, t) => lerp2(aa, bb, t), p00 = P(a0, b0, t0), p10 = P(a1, b1, t0), p11 = P(a1, b1, t1), p01 = P(a0, b0, t1), inset = gl ? 0.6 : 0;
            const cc = lerp2(lerp2(a0, a1, 0.5), lerp2(b0, b1, 0.5), (t0 + t1)/2), cen = lerp2(lerp2(Ra[0], Ra[2], 0.5), lerp2(Rb[0], Rb[2], 0.5), (t0 + t1)/2);
            const sh = q => inset ? lerp2(q, cen, inset/Math.hypot(cc[0] - cen[0], cc[1] - cen[1])) : q;
            const A = sh(p00), Bq = sh(p10), C = sh(p11), D = sh(p01);
            q4(B.p(gl ? GLT : CU), [A[0], cuts[c], A[1]], [Bq[0], cuts[c], Bq[1]], [C[0], cuts[c+1], C[1]], [D[0], cuts[c+1], D[1]]); } } }
      const top = T[T.length - 1][1]; cap(B.p(CU2), top, Y0 + 44); walls(B.p(CU), offRing(top, 0.15), Y0 + 43.2, Y0 + 44.6);
      // floor lines and dimpled patches on the tower
      for (let k = 1; k < T.length - 1; k++){ const [y, R] = T[k]; if (y > Y0 + 14 && (y < yG0 - 0.5 || y > yG1 + 0.5)) walls(B.p(CU2), offRing(R, 0.06), y - 0.12, y + 0.12); }
      for (let k = 0; k < 160; k++){ const f = r(), lev = 1 + ((r()*(T.length - 2)) | 0), [y0, R0b] = T[lev], [y1, R1] = T[Math.min(T.length - 1, lev + 1)], i = (r()*4) | 0;
        const y = y0 + (y1 - y0)*r()*0.7; if (y > yG0 - 1.5 && y < yG1 + 0.5) continue; const t = (y - y0)/((y1 - y0) || 1), a = lerp2(R0b[i], R1[i], t), b = lerp2(R0b[(i+1) % 4], R1[(i+1) % 4], t), E = {a, t:[(b[0] - a[0])/Math.hypot(b[0] - a[0], b[1] - a[1]), (b[1] - a[1])/Math.hypot(b[0] - a[0], b[1] - a[1])]};
        const cen = lerp2(R0b[0], R0b[2], 0.5), m = lerp2(a, b, 0.5); let n = [E.t[1], -E.t[0]]; if ((m[0] - cen[0])*n[0] + (m[1] - cen[1])*n[1] < 0) n = [-n[0], -n[1]]; E.n = n;
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]), u0 = f*(L - 2); rectE(B.p(r() < 0.35 ? CUG : CU2), E, u0, u0 + 1 + r()*1.5, y, y + 0.8 + r()*1.2, 0.08); } }
    // landscaping: palms and tree ferns at the entrance, a few trees by the walls
    for (let k = 0; k < 10; k++){ const p = UV(30 + k*10 + r()*4, 95 + r()*6); if (k % 3 === 0) palm(B, p[0], gy(...p), p[1], 5 + r()*2, r, '#5a4a3a', '#4f6b35'); else { obox(B.p('#5a4636'), p[0], p[1], 0.4, 0.4, gy(...p), gy(...p) + 3, 0); blob(B.p(TREEC), p[0], gy(...p) + 5, p[1], 3.2, 3); } }
    B.flush(s);
    return g; }};
place('deyoung', 'deyoung', OX, OZ);
}

// =====================================================================================================================
// Conservatory of Flowers (1879): the white wood-and-glass Victorian glasshouse in Golden Gate Park, a shallow E on an
// east-west axis — the octagonal central pavilion (lower glass walls, clerestory, the white glass dome nearly 60 ft high,
// lantern and turned finial, peaked dormers on its east, west and south faces), the glazed gabled vestibule on the south,
// one-storey arched wings ending in the south-projecting end pavilions with cupolas, the parallel back ranges — on a
// raised masonry base. Plan from the OSM outline (it is rotated 6 degrees off east). Night: lit from inside, and the
// evening colour projections play over the white glass (cycle).
// =====================================================================================================================
{
const K = 'conservatory', OX = -2, OZ = -1, R0 = 45;
const C0 = [-2.5, -2.5], CU = [0.9945, -0.1045], CV = [0.1045, 0.9945], P = (a, b) => [C0[0] + a*CU[0] + b*CV[0], C0[1] + a*CU[1] + b*CV[1]], ANG = Math.atan2(CU[1], CU[0]);
const GLW = {c:'#dde6e5', glow:'#fff0d4', gk:0.5, lk:0.6}, GLR = {c:'#e9efed', glow:'#fff3de', gk:0.42, lk:0.6}, WW = {c:'#f7f6f1', lk:0.9}, FOUND = '#a29b8f', FIN = '#e9e4d6';
LANDMARKS.conservatory = {zh:'花卉温室', en:'Conservatory of Flowers', cat:'old', r:R0, h:22, lt:{m:0, c:'#fff6ea', k:0.9, e:0.5, anim:'cycle', c2:'#c48cff'},
  build(){
    const g = new THREE.Group(), s = frame(g, K, OX, OZ, R0), B = mkB(), r = LMCTX.rng, F = 77.5, gy = (x, z) => gnd(K, x, z);
    const rect = (a0, a1, b0, b1) => [P(a0, b0), P(a1, b0), P(a1, b1), P(a0, b1)];
    // glass walls with white sash bars on a rectangle (a0..a1, b0..b1), height h
    const gwalls = (R, h, bay) => { walls(B.p(GLW), R, F, F + h); walls(B.p(WW), offRing(R, 0.12), F + h - 0.35, F + h); walls(B.p(WW), offRing(R, 0.12), F, F + 0.5);
      for (let i = 0; i < R.length; i++){ const E = edgeFrame(R, i), n = Math.max(1, Math.round(E.L/(bay || 1.25)));
        for (let k = 0; k <= n; k++){ const u = k*E.L/n; rectE(B.p(WW), E, u - (k % 4 ? 0.07 : 0.16), u + (k % 4 ? 0.07 : 0.16), F + 0.5, F + h - 0.35, 0.06); }
        for (const yy of [1.4, h*0.62]) rectE(B.p(WW), E, 0, E.L, F + yy, F + yy + 0.12, 0.06); } };
    // four-centred arched glass roof over a rectangle, ridge along a (axis 'a') or b
    const vault = (a0, a1, b0, b1, y0, rise, axis) => {
      const W = axis === 'a' ? b1 - b0 : a1 - a0, prof = [[-0.5, 0], [-0.42, 0.42], [-0.28, 0.78], [-0.12, 0.96], [0, 1], [0.12, 0.96], [0.28, 0.78], [0.42, 0.42], [0.5, 0]];
      const Q = (t, w, h) => axis === 'a' ? P(a0 + (a1 - a0)*t, (b0 + b1)/2 + w*W) : P((a0 + a1)/2 + w*W, b0 + (b1 - b0)*t);
      const o = B.p(GLR), ow = B.p(WW), L = axis === 'a' ? a1 - a0 : b1 - b0, nr = Math.max(2, Math.round(L/1.9));
      for (let k = 0; k < prof.length - 1; k++){ const [w0, h0] = prof[k], [w1, h1] = prof[k+1], A = Q(0, w0), Bq = Q(1, w0), Cq = Q(1, w1), D = Q(0, w1);
        q4(o, [A[0], y0 + h0*rise, A[1]], [Bq[0], y0 + h0*rise, Bq[1]], [Cq[0], y0 + h1*rise, Cq[1]], [D[0], y0 + h1*rise, D[1]]); }
      for (const t of [0, 1]){ const c = Q(t, 0); for (let k = 0; k < prof.length - 1; k++){ const a = Q(t, prof[k][0]), b = Q(t, prof[k+1][0]); t3(B.p(GLW), [c[0], y0, c[1]], [a[0], y0 + prof[k][1]*rise, a[1]], [b[0], y0 + prof[k+1][1]*rise, b[1]]); } }
      for (let j = 0; j <= nr; j++) for (let k = 0; k < prof.length - 1; k++){ const a = Q(j/nr, prof[k][0]), b = Q(j/nr, prof[k+1][0]); beam(ow, [a[0], y0 + prof[k][1]*rise + 0.05, a[1]], [b[0], y0 + prof[k+1][1]*rise + 0.05, b[1]], j % nr ? 0.07 : 0.16); }
      for (const k of [2, 4, 6]){ const a = Q(0, prof[k][0]), b = Q(1, prof[k][0]); beam(ow, [a[0], y0 + prof[k][1]*rise + 0.06, a[1]], [b[0], y0 + prof[k][1]*rise + 0.06, b[1]], 0.09); }
    };
    // raised masonry base under the whole plan
    const base = [P(-37.6, -16.3), P(35.4, -17.3), P(38.3, -3.8), P(37.3, 17.2), P(25.8, 17.2), P(25.8, 6.7), P(8.8, 6.7), P(4.4, 10.1), P(4.4, 18.6), P(-4.2, 18.6), P(-4.2, 10.1), P(-8.8, 7.2), P(-25.5, 6.7), P(-25.5, 17.4), P(-37.6, 17.4)];
    prism(B.p(FOUND), base, Math.min(...base.map(p => gy(...p))) - 1.2, F); walls(B.p('#b5ad9f'), offRing(base, 0.15), F - 0.25, F + 0.05);
    // back ranges (north), wings, end pavilions
    for (const [a0, a1] of [[-32, -6.2], [5.9, 35]]){ gwalls(rect(a0, a1, -15.9, -7.6), 3.6); vault(a0, a1, -15.9, -7.6, F + 3.6, 2.6, 'a'); }
    obox(B.p(WW), ...P(0, -12.3), 7.6, 9.5, F, F + 5.2, ANG); cap(B.p(GLR), rect(-3.8, 3.8, -17, -7.6), F + 5.2);
    for (const [a0, a1] of [[-25.7, -8.4], [8.4, 26]]){ gwalls(rect(a0, a1, -4.5, 6.4), 4.4); vault(a0, a1, -4.5, 6.4, F + 4.4, 4.0, 'a'); }
    for (const [a0, a1, cx] of [[-37.3, -25.7, -31.5], [26, 37, 31.5]]){ gwalls(rect(a0, a1, -4.2, 16.2), 5.2); vault(a0, a1, -4.2, 16.2, F + 5.2, 4.6, 'b');
      // cupola where the wing meets the end pavilion
      const c = P(cx, 1.0), O = []; for (let k = 0; k < 8; k++){ const a = k/8*TAU + PI/8 + ANG; O.push([c[0] + Math.cos(a)*1.9, c[1] + Math.sin(a)*1.9]); }
      walls(B.p(GLW), O, F + 9.4, F + 11.8); walls(B.p(WW), offRing(O, 0.08), F + 11.6, F + 12.0); for (const p of O) obox(B.p(WW), p[0], p[1], 0.2, 0.2, F + 9.4, F + 11.8, 0);
      for (let k = 0; k < 8; k++) t3(B.p(GLR), [O[k][0], F + 12, O[k][1]], [O[(k+1) % 8][0], F + 12, O[(k+1) % 8][1]], [c[0], F + 13.4, c[1]]); obox(B.p(FIN), c[0], c[1], 0.25, 0.25, F + 13.3, F + 14.3, 0); }
    // south vestibule and porch
    gwalls(rect(-3.9, 4.1, 8.5, 16.8), 4.0); { const c = P(0.1, 12.7); gable(s, c[0], c[1], 9.0, 8.6, F + 4.0, 2.4, GLR, -ANG + PI/2); }
    { const c = P(0, 17.6); obox(B.p(WW), c[0], c[1], 3.4, 1.8, F + 3.1, F + 3.4, ANG); for (const d of [-1.5, 1.5]){ const q = P(d, 18.3); obox(B.p(WW), q[0], q[1], 0.25, 0.25, F, F + 3.2, 0); } gable(s, c[0], c[1], 1.9, 3.8, F + 3.4, 1.0, WW, -ANG + PI/2); }
    // the central octagonal pavilion: lower glass walls with Tudor-arched lights, sloped roof, clerestory, dome, lantern
    { const c = P(0, 1.15), O8 = (rr, a0) => { const Q = []; for (let k = 0; k < 8; k++){ const a = a0 + k/8*TAU + ANG; Q.push([c[0] + Math.cos(a)*rr, c[1] + Math.sin(a)*rr]); } return Q; };
      const R1 = O8(9.47, PI/8), R2 = O8(5.6, PI/8);
      walls(B.p(GLW), R1, F, F + 7.4); walls(B.p(WW), offRing(R1, 0.14), F + 7.0, F + 7.5); walls(B.p(WW), offRing(R1, 0.14), F, F + 0.6);
      for (let i = 0; i < 8; i++){ const E = edgeFrame(R1, i); for (let k = 0; k <= 6; k++){ const u = k*E.L/6; rectE(B.p(WW), E, u - (k % 6 ? 0.08 : 0.2), u + (k % 6 ? 0.08 : 0.2), F + 0.6, F + 7.0, 0.07); }
        for (let k = 0; k < 3; k++){ const u = (k + 0.5)*E.L/3, w = E.L/3 - 0.4; const PP = (uu, y) => [E.a[0] + E.t[0]*uu + E.n[0]*0.09, y, E.a[1] + E.t[1]*uu + E.n[1]*0.09];
          let prev = null; for (let j = 0; j <= 8; j++){ const t = j/8, ang = PI*t, uu = u - Math.cos(ang)*w/2, y = F + 5.0 + Math.sin(ang)*(t < 0.5 ? 1.0 : 1.0)*1.2*(1 - 0.25*Math.abs(Math.cos(ang))); const q = PP(uu, y); if (prev) beam(B.p(WW), prev, q, 0.07); prev = q; } }
        rectE(B.p(WW), E, 0, E.L, F + 1.6, F + 1.75, 0.07); }
      for (let i = 0; i < 8; i++){ const a = R1[i], b = R1[(i+1) % 8], cc = R2[(i+1) % 8], d = R2[i]; q4(B.p(GLR), [a[0], F + 7.4, a[1]], [b[0], F + 7.4, b[1]], [cc[0], F + 9.6, cc[1]], [d[0], F + 9.6, d[1]]); beam(B.p(WW), [a[0], F + 7.45, a[1]], [d[0], F + 9.65, d[1]], 0.14); }
      walls(B.p(GLW), R2, F + 9.6, F + 12.4); walls(B.p(WW), offRing(R2, 0.1), F + 12.1, F + 12.6); for (const q of R2) obox(B.p(WW), q[0], q[1], 0.3, 0.3, F + 9.6, F + 12.4, 0);
      for (let i = 0; i < 8; i++){ const E = edgeFrame(R2, i); for (const u of [E.L/3, 2*E.L/3]) rectE(B.p(WW), E, u - 0.07, u + 0.07, F + 9.6, F + 12.4, 0.06); }
      // the dome (16 sides), ribs and rings, lantern, cap and finial
      const NS = 16, prof = [[5.6, 12.4], [5.45, 13.6], [5.0, 14.8], [4.2, 15.9], [3.2, 16.8], [2.2, 17.4], [1.55, 17.7]], dP = (rr, a) => [c[0] + Math.cos(a)*rr, c[1] + Math.sin(a)*rr];
      for (let k = 0; k < prof.length - 1; k++) for (let j = 0; j < NS; j++){ const a0 = j/NS*TAU + ANG, a1 = (j + 1)/NS*TAU + ANG, A = dP(prof[k][0], a0), Bq = dP(prof[k][0], a1), Cq = dP(prof[k+1][0], a1), D = dP(prof[k+1][0], a0);
        q4(B.p(GLR), [A[0], F + prof[k][1], A[1]], [Bq[0], F + prof[k][1], Bq[1]], [Cq[0], F + prof[k+1][1], Cq[1]], [D[0], F + prof[k+1][1], D[1]]); if (j % 2 === 0) beam(B.p(WW), [A[0], F + prof[k][1] + 0.04, A[1]], [D[0], F + prof[k+1][1] + 0.04, D[1]], 0.1); }
      for (const k of [1, 3]) for (let j = 0; j < NS; j++){ const a = dP(prof[k][0] + 0.03, j/NS*TAU + ANG), b = dP(prof[k][0] + 0.03, (j + 1)/NS*TAU + ANG); beam(B.p(WW), [a[0], F + prof[k][1], a[1]], [b[0], F + prof[k][1], b[1]], 0.07); }
      const L8 = O8(1.55, 0); walls(B.p(GLW), L8, F + 17.7, F + 19.0); for (const q of L8) obox(B.p(WW), q[0], q[1], 0.16, 0.16, F + 17.7, F + 19.0, 0);
      for (let k = 0; k < 8; k++) t3(B.p(WW), [L8[k][0], F + 19.0, L8[k][1]], [L8[(k+1) % 8][0], F + 19.0, L8[(k+1) % 8][1]], [c[0], F + 19.8, c[1]]);
      LLathe(s, [[0.0, 0], [0.32, 0.1], [0.18, 0.5], [0.3, 0.8], [0.12, 1.3], [0.05, 1.6], [0, 1.65]], c[0], F + 19.7, c[1], FIN, 8);
      // peaked dormers on the east, west and south faces
      for (const fa of [0, PI, PI/2]){ const a = fa + ANG, m = [c[0] + Math.cos(a)*8.9, c[1] + Math.sin(a)*8.9]; gable(s, m[0], m[1], 2.6, 5.4, F + 7.4, 3.0, GLR, -a);
        const tng = [-Math.sin(a), Math.cos(a)], fr = [c[0] + Math.cos(a)*10.25, c[1] + Math.sin(a)*10.25];
        beam(B.p(WW), [fr[0] - tng[0]*2.7, F + 7.4, fr[1] - tng[1]*2.7], [fr[0], F + 10.4, fr[1]], 0.12); beam(B.p(WW), [fr[0] + tng[0]*2.7, F + 7.4, fr[1] + tng[1]*2.7], [fr[0], F + 10.4, fr[1]], 0.12);
        obox(B.p(FIN), fr[0], fr[1], 0.2, 0.2, F + 10.3, F + 11.2, 0); } }
    B.flush(s);
    return g; }};
place('conservatory', 'conservatory', OX, OZ);
}
}
