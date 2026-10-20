// ===== lm18 / group C: Beach Road, Marina Centre and the Sports Hub =====
// The Gateway, Golden Mile Complex, South Beach, Suntec City, Singapore Indoor Stadium, National Stadium (remake).
// Block-scoped: only LANDMARKS and SG_PLACES are touched. Real dimensions in metres; y = 0 is the ground.
// Every model is built in map-aligned local axes (rot 0: local +x = east, local +z = south) straight from the real
// OSM / Overture footprints, so the plan sits on the real buildings without a turn.
{
const PI = Math.PI, HP = PI/2, TAU = PI*2;
const lerp = (a, b, t) => a + (b - a)*t, cl01 = t => t < 0 ? 0 : t > 1 ? 1 : t, sm = t => { t = cl01(t); return t*t*(3 - 2*t); };
// triangle batches: many small parts of one colour spec become one LTris call
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const quadP = (o, a, b, c, d) => o.push(...a, ...b, ...c, ...a, ...c, ...d);
const triP = (o, a, b, c) => o.push(...a, ...b, ...c);
const sub = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]], add = (a, b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]], mul = (a, s) => [a[0]*s, a[1]*s, a[2]*s];
const crs = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const nrm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0]/l, a[1]/l, a[2]/l]; };
// n-sided prism round the segment a-b
function segP(o, a, b, r, n){
  n = n || 4; const L = Math.hypot(b[0]-a[0], b[1]-a[1], b[2]-a[2]); if (L < 1e-4) return; const d = nrm(sub(b, a));
  const up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], u = nrm(crs(d, up)), v = crs(d, u);
  const ring = p => { const R = []; for (let i = 0; i < n; i++){ const t = (i + 0.5)/n*TAU, c = Math.cos(t)*r, s = Math.sin(t)*r; R.push([p[0]+u[0]*c+v[0]*s, p[1]+u[1]*c+v[1]*s, p[2]+u[2]*c+v[2]*s]); } return R; };
  const A = ring(a), B = ring(b);
  for (let i = 0; i < n; i++){ const j = (i+1) % n; quadP(o, A[i], A[j], B[j], B[i]); }
}
const polyP = (o, pts, r, n) => { for (let i = 0; i < pts.length - 1; i++) segP(o, pts[i], pts[i+1], r, n); };
// box (w along x, d along z) standing on y, turned ry, into a batch
function boxP(o, w, h, d, x, y, z, ry){
  const R = rotP(x, z, ry || 0), hw = w/2, hd = d/2;
  const P = [R(-hw, y, -hd), R(hw, y, -hd), R(hw, y, hd), R(-hw, y, hd), R(-hw, y+h, -hd), R(hw, y+h, -hd), R(hw, y+h, hd), R(-hw, y+h, hd)];
  for (const [a, b, c, e] of [[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]) quadP(o, P[a], P[b], P[c], P[e]);
}
// box between two plan points a, b ([x, z]) of width w, from y0 to y1
function wallP(o, a, b, w, y0, y1){
  const dx = b[0]-a[0], dz = b[1]-a[1], L = Math.hypot(dx, dz); if (L < 1e-3) return;
  boxP(o, L, y1 - y0, w, (a[0]+b[0])/2, y0, (a[1]+b[1])/2, Math.atan2(-dz, dx));
}
// plan polygon helpers ([x, z] points)
const cenP = P => { let x = 0, z = 0; for (const p of P){ x += p[0]; z += p[1]; } return [x/P.length, z/P.length]; };
const areaP = P => { let a = 0; for (let i = 0; i < P.length; i++){ const p = P[i], q = P[(i+1) % P.length]; a += p[0]*q[1] - q[0]*p[1]; } return a/2; };
const lerpP = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const ellP = (a, b, n, cx, cz, a0) => { const P = []; for (let i = 0; i < n; i++){ const t = (a0 || 0) + i/n*TAU; P.push([(cx || 0) + Math.cos(t)*a, (cz || 0) + Math.sin(t)*b]); } return P; };
// offset a simple polygon by d (positive = outwards) with mitred corners
function offP(P, d){
  const s = areaP(P) > 0 ? 1 : -1, n = P.length, out = [];
  for (let i = 0; i < n; i++){
    const a = P[(i - 1 + n) % n], b = P[i], c = P[(i + 1) % n];
    const e1 = nrm([b[0]-a[0], 0, b[1]-a[1]]), e2 = nrm([c[0]-b[0], 0, c[1]-b[1]]);
    // outward normals for x east / z south plan coordinates
    const n1 = [-e1[2]*s, e1[0]*s], n2 = [-e2[2]*s, e2[0]*s];
    let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
    const k = 1/Math.max(0.25, mx*n1[0] + mz*n1[1]);
    out.push([b[0] - mx*d*k, b[1] - mz*d*k]);
  }
  return out;
}
// vertical walls of a closed plan polygon between y0 and y1; caps triangulated (any simple polygon)
const wallsP = (o, P, y0, y1) => { for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; quadP(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); } };
function capP(o, P, y){
  const tr = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
  for (const [a, b, c] of tr) triP(o, [P[a][0], y, P[a][1]], [P[b][0], y, P[b][1]], [P[c][0], y, P[c][1]]);
}
const prismP = (o, P, y0, y1, bottom) => { wallsP(o, P, y0, y1); capP(o, P, y1); if (bottom) capP(o, P, y0); };
// horizontal bands round a plan polygon every `step` m between y0 and y1 (vertical quads just proud of the wall)
function bandsP(o, P, y0, y1, step, bh, off){
  const c = cenP(P); off = off || 0.12;
  for (let i = 0; i < P.length; i++){
    const a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], L = Math.hypot(ex, ez); if (L < 0.3) continue;
    let nx = ez/L, nz = -ex/L; if (nx*((a[0]+b[0])/2 - c[0]) + nz*((a[1]+b[1])/2 - c[1]) < 0){ nx = -nx; nz = -nz; }
    for (let y = y0 + step; y < y1 - 0.4; y += step) quadP(o, [a[0]+nx*off, y, a[1]+nz*off], [b[0]+nx*off, y, b[1]+nz*off], [b[0]+nx*off, y+bh, b[1]+nz*off], [a[0]+nx*off, y+bh, a[1]+nz*off]);
  }
}
// vertical mullion strips round a plan polygon every `sp` m (flat strips just proud of the wall)
function mullP(o, P, y0, y1, sp, w, off){
  const c = cenP(P); off = off || 0.15;
  for (let i = 0; i < P.length; i++){
    const a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], L = Math.hypot(ex, ez); if (L < 1) continue;
    let nx = ez/L, nz = -ex/L; if (nx*((a[0]+b[0])/2 - c[0]) + nz*((a[1]+b[1])/2 - c[1]) < 0){ nx = -nx; nz = -nz; }
    const n = Math.max(1, Math.round(L/sp));
    for (let k = 0; k <= n; k++){ const t = k/n, x = a[0] + ex*t + nx*off, z = a[1] + ez*t + nz*off, hx = ex/L*w/2, hz = ez/L*w/2;
      quadP(o, [x - hx, y0, z - hz], [x + hx, y0, z + hz], [x + hx, y1, z + hz], [x - hx, y1, z - hz]); }
  }
}
// smooth parametric surface f(u, v) -> [x, y, z], one indexed mesh (double sided)
function surf(g, nu, nv, f, col){
  const P = [], I = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) P.push(...f(i/nu, j/nv));
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++){ const a = j*(nu+1) + i, b = a + 1, c = a + nu + 2, d = a + nu + 1; I.push(a, b, c, a, c, d); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setIndex(I); geo.computeVertexNormals();
  return lmAdd(g, geo, typeof col === 'string' ? {c:col, ds:true} : Object.assign({ds:true}, col), 0, 0, 0);
}
function surfP(o, nu, nv, f){
  const G = []; for (let j = 0; j <= nv; j++){ const R = []; for (let i = 0; i <= nu; i++) R.push(f(i/nu, j/nv)); G.push(R); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) quadP(o, G[j][i], G[j][i+1], G[j+1][i+1], G[j+1][i]);
}
function treeP(B, x, y, z, s, crown){
  segP(B.p('#5d4a3a'), [x, y, z], [x, y + 3*s, z], 0.28*s, 4);
  const c = B.p(crown || '#557f3c'), R = 2.4*s, cy = y + 4.2*s, top = [x, cy + R*0.75, z], bot = [x, cy - R*0.55, z], ring = [];
  for (let i = 0; i < 6; i++){ const a = i/6*TAU; ring.push([x + Math.cos(a)*R, cy, z + Math.sin(a)*R]); }
  for (let i = 0; i < 6; i++){ const j = (i+1) % 6; triP(c, top, ring[j], ring[i]); triP(c, bot, ring[i], ring[j]); }
}

// =====================================================================================================================
// The Gateway (Beach Road, I. M. Pei with Chua Ka Seng & Partners, 1990): two 37-storey, 150 m office towers on
// parallelogram plans with 45-degree acute corners (40 m faces, 56 m diagonal faces), mirror images of each other across
// the NW-SE diagonal; their diagonal faces stand 48 m apart and frame the gateway between them. Seen along the diagonal
// only one face shows, so from Beach Road / the Ophir Road junction each tower reads as a paper-thin sheet.
// Dark reflective blue-grey glass, silver aluminium spandrel bands at every floor, a two-storey recessed lobby.
// Plans from the real footprints (OSM): West tower 'W', East tower 'E' = W mirrored (x <-> z).
LANDMARKS.sggateway = {zh:'门户大厦', en:'The Gateway', cat:'new', r:80, h:150,
  lt:{m:1, c:'#d6e4ff', k:0.6, fh:4.05}, build(){
  const g = new THREE.Group(), B = mkB(), H = 150, FH = 4.05, LB = 8.1;
  const glass = {c:'#3f4c5a', m:1, fh:4.05, cw:3.0}, band = {c:'#a9b2b9', m:0, lk:0.12}, alu = {c:'#c4cacf', m:0, lk:0.35};
  const lobby = {c:'#5a6670', glow:'#ffe2b0', gk:0.55}, gran = '#a8a39a', pave = '#c2bdb2';
  const W = [[-74.3, -0.8], [-34.3, -0.8], [5.2, 38.9], [-34.8, 38.9]], E = W.map(p => [p[1], p[0]]);
  const tower = (P, nt) => {
    const Pi = offP(P, -1.6);
    // recessed two-storey lobby with granite-clad corner piers, then the glass shaft
    prismP(B.p(lobby), Pi, -5, LB, false);
    for (const p of P) segP(B.p(gran), [p[0], -5, p[1]], [p[0], LB, p[1]], 1.1, 6);
    LPoly(g, P, LB, H - LB, glass);
    bandsP(B.p(band), P, LB - FH, H - 2.5, FH, 1.15, 0.1);
    mullP(B.p(band), P, LB, H - 2.6, 3.0, 0.16, 0.13);
    // lobby soffit band, crown band and the knife-edge corner trims
    bandsP(B.p(alu), P, LB - 1.2, LB + 0.1, 1.2, 1.2, 0.12);
    bandsP(B.p(alu), P, H - 4.2, H, 2.4, 2.4, 0.12);
    for (const p of P) segP(B.p(alu), [p[0], LB, p[1]], [p[0], H, p[1]], 0.22, 4);
    // entrance canopy in the notch of the long face
    const a = lerpP(P[2], P[3], 0.37), b = lerpP(P[2], P[3], 0.63), c = cenP(P), dx = (a[0]+b[0])/2 - c[0], dz = (a[1]+b[1])/2 - c[1], dl = Math.hypot(dx, dz);
    const ox = dx/dl*nt, oz = dz/dl*nt;
    capP(B.p(alu), [a, b, [b[0] + ox, b[1] + oz], [a[0] + ox, a[1] + oz]], 5.2);
    segP(B.p(alu), [a[0] + ox*0.85, 0, a[1] + oz*0.85], [a[0] + ox*0.85, 5.2, a[1] + oz*0.85], 0.25, 6);
    segP(B.p(alu), [b[0] + ox*0.85, 0, b[1] + oz*0.85], [b[0] + ox*0.85, 5.2, b[1] + oz*0.85], 0.25, 6);
    // roof: parapet top and plant screen set back
    capP(B.p('#6c747a'), offP(P, -0.3), H - 0.05);
    prismP(B.p('#7d858b'), offP(P, -7), H - 0.05, H + 2.5);
  };
  tower(W, 4.5); tower(E, 4.5);
  // the low link block between the towers (granite and dark glass) and the forecourt with its feng-shui pools
  const L = [[-9.8, -7.8], [-2.1, -0.1], [3.9, -5.6], [5.7, -4.3], [8.2, -6.8], [4.4, -9.6], [8.7, -14.3], [-4.3, -26.8], [-20.1, -11.6], [-12.8, -4.3]];
  prismP(B.p(gran), L, -5, 4.2); prismP(B.p({c:'#4c5862', glow:'#ffe2b0', gk:0.35}), offP(L, -0.6), 4.2, 7.6); prismP(B.p('#8e8a84'), L, 7.6, 8.3);
  const court = [[-74.3, -0.8], [-34.3, -0.8], [-0.8, -34.3], [-0.8, -74.3], [38.4, -35.1], [38.4, 3.9], [5.2, 38.9], [-34.8, 38.9]];
  prismP(B.p(pave), offP(court, -0.5), -5, 0.08);
  for (const [x, z, w, d] of [[-22, 14, 16, 6], [14, -22, 6, 16]]) boxP(B.p({c:'#5b7c88', glow:'#3c6a80', gk:0.25}), w, 0.12, d, x, 0.08, z, PI/4);
  const rng = LMCTX.rng;
  for (let i = 0; i < 6; i++){ const c = lerp(-38, 30, (i + 0.5)/6); for (const s of [-1, 1]){ const x = c + s*13, z = c - s*13; if (Math.hypot(x + 5, z + 10) > 16) treeP(B, x + (rng() - 0.5)*2, 0.08, z, 1.1); } }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'sggateway', lat:1.298580, lon:103.859164, rot:0});


// =====================================================================================================================
// Golden Mile Complex (Design Partnership: Gan Eng Oon, William Lim, Tay Kheng Soon, 1973), 5001 Beach Road: the
// brutalist 'vertical city' - a 16-storey, 118 m long reinforced-concrete slab whose south-east (sea) side steps down in
// terraces, one storey (3.3 m) per step, from the 53 m roof to the 4-storey shopping podium; flat north-west face with
// strip windows, solid end walls showing the stepped section, service cores at both ends (the NE lift core rises to
// 60 m), the round car-park ramp drum at the NE end of the podium. All levels and widths from the OSM building parts.
// Local axes: +x along the slab (towards NE, 37 deg north of east), +z towards the sea (SE). Origin = middle of the slab.
LANDMARKS.goldenmile = {zh:'黄金坊大厦', en:'Golden Mile Complex', cat:'new', r:105, h:60,
  lt:{m:1, c:'#ffe6c4', k:0.55, fh:3.3, cw:2.4}, build(){
  const g = new THREE.Group(), B = mkB(), S0 = 65, T0 = 32;
  const conc = {c:'#b4aea3', m:0, lk:0.25}, concD = {c:'#8f8a82', m:0, lk:0.2}, glass = {c:'#3c4449', m:1, fh:3.3, cw:2.4};
  const shop = {c:'#4d555a', glow:'#ffd9a0', gk:0.6}, green = '#5f7f45', roofc = '#9b968d';
  const P = (s, t) => [s - S0, t - T0];
  // the stepped section (t across the slab, y up), extruded along the slab
  const TS = [15.9, 18.9, 22.1, 24.6, 28.2, 31.2, 35.0, 38.8, 42.2, 46.3, 51.0], HS = [53.4, 46.8, 43.5, 40.2, 36.9, 33.6, 30.3, 27.0, 23.7, 20.4, 17.1];
  const sec = [[0, -5], [0, 53.4]];
  for (let k = 0; k < TS.length; k++){ sec.push([TS[k], HS[k]]); if (k + 1 < HS.length) sec.push([TS[k], HS[k + 1]]); }
  sec.push([TS[TS.length - 1], 13.8], [63.4, 13.8], [63.4, -5]);
  const extr = (o, S, s0, s1) => {
    for (let i = 0; i < S.length; i++){ const a = S[i], b = S[(i+1) % S.length]; quadP(o, [s0 - S0, a[1], a[0] - T0], [s1 - S0, a[1], a[0] - T0], [s1 - S0, b[1], b[0] - T0], [s0 - S0, b[1], b[0] - T0]); }
    const tr = THREE.ShapeUtils.triangulateShape(S.map(p => new THREE.Vector2(p[0], p[1])), []);
    for (const s of [s0, s1]) for (const [a, b, c] of tr) triP(o, [s - S0, S[a][1], S[a][0] - T0], [s - S0, S[b][1], S[b][0] - T0], [s - S0, S[c][1], S[c][0] - T0]);
  };
  const SA = 5.5, SB = 123.7;
  extr(B.p(conc), sec, SA, SB);
  // north-west face: continuous strip windows above the podium, shop windows below
  const strip = (o, s0, s1, t, y0, y1) => quadP(o, [s0 - S0, y0, t - T0], [s1 - S0, y0, t - T0], [s1 - S0, y1, t - T0], [s0 - S0, y1, t - T0]);
  for (let y = 13.2 + 0.9; y < 52; y += 3.3) strip(B.p(glass), SA + 1.2, SB - 1.2, -0.06, y, y + 1.75);
  for (const y of [0.6, 7.4]) strip(B.p(shop), SA + 1.2, SB - 1.2, -0.06, y, y + 3.6);
  // the terraces: glazed risers, concrete parapets with planters, cross walls between the units
  for (let k = 0; k < TS.length - 1; k++){
    const t = TS[k] + 0.06, y0 = HS[k + 1], y1 = HS[k];
    strip(B.p(glass), SA + 0.6, SB - 0.6, t, y0 + 0.15, y1 - 1.0);
    const tn = TS[k + 1];
    boxP(B.p(concD), SB - SA, 1.05, 0.35, (SA + SB)/2 - S0, y0, tn - 0.2 - T0);
    boxP(B.p(green), SB - SA - 1, 0.45, 0.9, (SA + SB)/2 - S0, y0, tn - 0.9 - T0);
    for (let s = SA + 7.4; s < SB - 3; s += 7.4) boxP(B.p(conc), 0.4, (y1 - y0)*0.85, tn - TS[k], s - S0, y0, (TS[k] + tn)/2 - T0);
  }
  // top step (two storeys) and the roof
  strip(B.p(glass), SA + 0.6, SB - 0.6, TS[0] + 0.06, HS[1] + 3.45, HS[0] - 1.0);
  strip(B.p(glass), SA + 0.6, SB - 0.6, TS[0] + 0.06, HS[1] + 0.15, HS[1] + 2.3);
  boxP(B.p(concD), SB - SA, 1.2, 0.4, (SA + SB)/2 - S0, 53.4, 0.2 - T0);
  boxP(B.p(concD), SB - SA, 1.2, 0.4, (SA + SB)/2 - S0, 53.4, TS[0] - 0.2 - T0);
  for (const s of [30, 62, 94]) boxP(B.p(roofc), 9, 3.2, 7, s - S0, 53.4, 8 - T0);
  // podium front (sea side): two shop levels behind deep concrete bands, the podium roof terrace
  strip(B.p(shop), SA + 0.6, SB - 0.6, 63.46, 0.4, 4.4); strip(B.p(shop), SA + 0.6, SB - 0.6, 63.46, 6.8, 10.2);
  for (let s = SA + 7.4; s < SB; s += 7.4) boxP(B.p(concD), 0.8, 13.8, 1.0, s - S0, 0, 63.6 - T0);
  boxP(B.p(concD), SB - SA, 1.2, 0.4, (SA + SB)/2 - S0, 13.8, 63.2 - T0);
  // south-west end: full-height stair core and the corner shop block
  const core1 = [P(0, 0), P(5.6, 0), P(5.6, 16.2), P(0.5, 16.2)];
  prismP(B.p(concD), core1, -5, 55.2);
  for (let y = 4; y < 52; y += 3.3) boxP(B.p(glass), 0.2, 1.4, 6, -0.06 - S0, y, 8 - T0);
  const tip = [P(-11.6, 62.0), P(-11.5, 53.9), P(-13.8, 52.9), P(-13.3, 50.3), P(5.6, 51.1), P(6.0, 63.4)];
  prismP(B.p(conc), tip, -5, 17.1); wallsP(B.p(shop), offP(tip, 0.06), 0.6, 4.6);
  prismP(B.p(conc), [P(5.4, 47.5), P(5.6, 63.4), P(6.0, 63.4), P(6.0, 47.5)], -5, 17.1);
  // north-east end: the lift core rising above the roof, the low wing and the round car-park ramp
  const core2 = [P(123.6, 12.8), P(132.1, 13.0), P(132.1, 26.5), P(123.6, 26.3)];
  prismP(B.p(concD), core2, -5, 60);
  for (let y = 15; y < 58; y += 3.3) boxP(B.p(glass), 0.2, 1.3, 4.5, 132.16 - S0, y, 19.7 - T0);
  const wing = [P(123.6, 12.8), P(132.1, 13.0), P(132.3, 17.5), P(147.5, 17.4), P(147.4, 64.1), P(123.6, 63.4)];
  prismP(B.p(conc), wing, -5, 13.8);
  wallsP(B.p(shop), offP(wing, 0.06), 0.6, 4.6);
  const dc = P(151.2, 30.7), DR = 13.4;
  LCyl(g, DR - 0.6, DR - 0.6, 15, dc[0], -5, dc[1], concD, 28);
  for (let y = 0; y <= 10.5; y += 3.5) LCyl(g, DR, DR, 0.9, dc[0], y + 1.9, dc[1], conc, 28);
  // forecourt paving along the podium
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'goldenmile', lat:1.302725, lon:103.865084, rot:0.6475});

// =====================================================================================================================
// South Beach (Foster + Partners with Aedas, 2016), Beach Road: two 218 m towers - North Tower (35 storeys, offices)
// and South Tower (45 storeys, JW Marriott hotel + residences) - with split cores and planted sky gardens, louvre
// screens with horizontal shading on their long (east/west) faces, faceted glazing on the narrow ends; between them the
// undulating 'environmental filter' canopy of steel ribbons with aluminium louvres, glass and photovoltaic panels on
// Y-shaped columns, rising over the avenue and dipping where it meets the four conserved 1930s-50s Beach Road Camp
// buildings (Block 1 / South Beach Quarter, the Old Command Block, the drill hall and the NCO Club), all white.
// Local axes: +x along the block (NNE, 57.7 deg north of east), +z towards Nicoll Highway (ESE); plans from OSM.
LANDMARKS.southbeach = {zh:'南滩', en:'South Beach', cat:'new', r:156, h:218,
  lt:{m:1, c:'#e2ecff', k:0.6, fh:4.2, cw:3.0}, build(){
  const g = new THREE.Group(), B = mkB(), rng = LMCTX.rng;
  const glass = {c:'#566a78', m:1, fh:4.2, cw:3.0, ds:true}, glassR = {c:'#5d6f7c', m:1, fh:3.5, cw:2.6, ds:true}, louv = {c:'#eceeee', m:0, lk:0.3, lc:'#e8f0ff'};
  const white = {c:'#efece4', m:0, lk:0.9, lc:'#ffe4c0'}, win = {c:'#46525a', glow:'#ffd9a8', gk:0.45}, steel = {c:'#e8eaea', m:0, lk:0.5, lc:'#fff0d8'};
  const green = '#5d8a45', pave = '#c9c3b6', dark = '#3a4248';
  // ---- the towers: two halves round the split core, faceted ends, louvre screens on the long faces ----
  const tower = (C, sx0, sx1, H, sky, fh, gl) => {
    // C: corners [x0z0 (low x, low z), x1z0, x1z1, x0z1] of the footprint; sx0..sx1 = the central slot along x
    const x0 = Math.min(C[0][0], C[3][0]), x1 = Math.max(C[1][0], C[2][0]), z0 = (C[0][1] + C[1][1])/2, z1 = (C[2][1] + C[3][1])/2;
    const zm = (z0 + z1)/2, D = z1 - z0, sk = (C[1][1] - C[0][1])/(x1 - x0);
    const zz = (x, side) => (side < 0 ? z0 : z1) + sk*(x - (x0 + x1)/2);
    const half = (a, b) => { const P = [[a, zz(a, -1)], [b, zz(b, -1)], [b, zz(b, 1)], [a, zz(a, 1)]]; LPoly(g, P, -5, H + 5, gl); return P; };
    half(x0, sx0); half(sx1, x1);
    // the split core: a recessed dark shaft with the sky bridges
    prismP(B.p(dark), [[sx0 - 0.2, zm - D*0.3], [sx1 + 0.2, zm - D*0.3], [sx1 + 0.2, zm + D*0.3], [sx0 - 0.2, zm + D*0.3]], -5, H - 2);
    for (const y of sky) prismP(B.p(gl), [[sx0, zz(sx0, -1) + 0.5], [sx1, zz(sx1, -1) + 0.5], [sx1, zz(sx1, 1) - 0.5], [sx0, zz(sx0, 1) - 0.5]], y - 4, y);
    // faceted glazing on the narrow ends: alternate up- and down-facing panes, one pair per floor
    for (const [xe, sg] of [[x0, -1], [x1, 1]]) for (let y = 8; y < H - 3; y += fh){
      const za = zz(xe, -1), zb = zz(xe, 1), o = sg*0.9;
      quadP(B.p(gl), [xe, y, za], [xe, y, zb], [xe + o, y + fh*0.55, zb], [xe + o, y + fh*0.55, za]);
      quadP(B.p({c:'#7f95a2', m:0, lk:0.15}), [xe + o, y + fh*0.55, za], [xe + o, y + fh*0.55, zb], [xe, y + fh, zb], [xe, y + fh, za]);
    }
    // louvre screens on the long (east / west) faces: horizontal shading blades and vertical fins on a gently bulging,
    // wind-carved profile; on the avenue side the fins flare out at the foot into the canopy; above the roof the screen
    // rises into a crown that slants up towards the middle of the site (to 218 m)
    const inner = x0 > 0 ? x0 : x1, outer = x0 > 0 ? x1 : x0, HT = 218;
    const T = x => lerp(H + 3, HT, Math.pow(cl01((x - outer)/(inner - outer)), 1.6));
    const inSky = y => sky.some(yg => y > yg - 10 && y < yg);
    for (const side of [-1, 1]) {
      const lv = B.p(louv), off = y => 1.3 + 3.0*Math.sin(PI*cl01(y/HT)) + (side < 0 ? 14*Math.pow(cl01(1 - y/40), 2.4) : 2.0*Math.pow(cl01(1 - y/30), 2));
      for (let y = 7; y < HT; y += 1.3){
        if (inSky(y)) continue;
        // extent along x: full below the roof, limited by the slanting crown above it
        let xa = x0 - 0.6, xb = x1 + 0.6;
        if (y > H + 3){ const f = Math.pow((y - H - 3)/(HT - H - 3), 1/1.6); if (inner > outer) xa = lerp(outer, inner, f); else xb = lerp(outer, inner, f); }
        const o = off(y), zA = zz(xa, side) + side*o, zB = zz(xb, side) + side*o, w = 0.85;
        quadP(lv, [xa, y, zA], [xb, y, zB], [xb, y - 0.3, zB + side*w], [xa, y - 0.3, zA + side*w]);
      }
      // vertical fins (the canopy's ribbons carried up the tower)
      const nf = Math.round((x1 - x0)/5.2);
      for (let k = 0; k <= nf; k++){ const x = lerp(x0 - 0.6, x1 + 0.6, k/nf), top = Math.min(HT, T(x)), pts = [];
        for (let y = side < 0 ? 18 : 4; y <= top + 0.01; y += Math.max(3, (top - 4)/24)) pts.push([x, y, zz(x, side) + side*(off(y) + 0.45)]);
        pts.push([x, top, zz(x, side) + side*(off(top) + 0.45)]);
        for (let i = 0; i < pts.length - 1; i++) segP(B.p(louv), pts[i], pts[i + 1], 0.32, 4); }
    }
    // translucent backing of the crown screen (hides the roof plant), slanting with the crown line
    for (const side of [-1, 1]) for (let k = 0; k < 12; k++){
      const xa = lerp(outer, inner, k/12), xb = lerp(outer, inner, (k + 1)/12), oa = 1.3 + 3.0*Math.sin(PI*H/HT), za = zz(xa, side) + side*oa, zb = zz(xb, side) + side*oa;
      quadP(B.p({c:'#c9d2d6', op:0.55, m:0, lk:0.35, lc:'#e8f0ff'}), [xa, H, za], [xb, H, zb], [xb, T(xb), zb], [xa, T(xa), za]);
    }
    // sky gardens: tall planted openings across both long faces
    for (const yg of sky) for (const side of [-1, 1]) {
      const zf = zz((x0 + x1)/2, side) - side*1.0;
      boxP(B.p({c:'#3d4a40', glow:'#ffe2b0', gk:0.3}), x1 - x0 - 2, 9.6, 0.4, (x0 + x1)/2, yg - 10, zf - side*1.2, Math.atan2(-sk*(x1 - x0), x1 - x0));
      boxP(B.p(green), x1 - x0 - 2, 1.2, 2.4, (x0 + x1)/2, yg - 10, zf, 0);
      for (let i = 0; i < 7; i++) treeP(B, lerp(x0 + 3, x1 - 3, (i + 0.5)/7), yg - 8.8, zf + side*0.2, 1.0, green);
    }
    // roof: plant screen behind the crown
    prismP(B.p({c:'#7f95a2', m:0, lk:0.15}), [[x0 + 4, z0 + 4], [x1 - 4, z0 + 4], [x1 - 4, z1 - 4], [x0 + 4, z1 - 4]], H, H + 4);
  };
  tower([[75.1, -22.7], [127.6, -24.1], [128.6, 4.2], [76.2, 5.6]], 99.0, 105.7, 205, [52, 96, 158], 4.6, glass);
  tower([[-59.1, 16.9], [-0.2, 13.5], [1.0, 37.5], [-57.9, 40.9]], -36.3, -29.5, 205, [70, 104, 150], 3.6, glassR);
  // hotel annex (JW Marriott low block) south-west of the South Tower, with its roof garden
  const ann = [[-59.1, 16.9], [-57.9, 40.9], [-115.9, 43.6], [-117.0, 19.6]];
  prismP(B.p(louv), ann, -5, 17.1);
  bandsP(B.p(win), ann, 0, 15, 4.2, 2.4, 0.08);
  capP(B.p(green), offP(ann, -2), 17.2);
  // ---- conserved camp buildings (white, flat-roofed Art Deco / early modern, long window bands) ----
  const camp = (P, h, fl, tw) => {
    prismP(B.p(white), P, -5, h); bandsP(B.p(win), P, 0, h - 1.4, h/fl, 1.8, 0.07);
    prismP(B.p(white), offP(P, 0.25), h - 0.9, h + 0.6);
    capP(B.p(pave), offP(P, -0.4), h + 0.62);
    if (tw){ const c = cenP(P); boxP(B.p(white), 7, h + 4.5, 7, c[0], -5, c[1], 0); }
  };
  camp([[3.0, -33.7], [-62.5, -31.8], [-63.0, -39.2], [-64.4, -39.1], [-64.7, -45.2], [2.9, -47.0]], 11, 2, true);
  camp([[-85.6, -36.2], [-140.4, -36.2], [-141.8, -57.3], [-86.2, -57.0]], 12.5, 3, false);
  camp([[48.7, -47.7], [50.0, -4.7], [30.0, -4.1], [28.5, -47.7]], 15, 3, false);
  camp([[133.4, -50.3], [134.1, -36.0], [79.6, -33.3], [79.1, -48.5]], 13, 3, true);
  camp([[-79.4, -50.8], [-79.2, -57.2], [-66.8, -57.3], [-66.5, -50.4]], 6.5, 1, false);
  camp([[-82.8, -37.3], [-82.7, -41.6], [-79.2, -41.7], [-79.3, -43.8], [-70.9, -44.1], [-70.9, -50.5], [-66.5, -50.4], [-66.3, -37.9]], 7.5, 2, false);
  // ---- the canopy: undulating ribbons over the avenue ----
  const zLo = -37, zHi = x => lerp(12, 24, sm((x - 2)/14)) - 14*sm((x - 62)/14);
  const Y = (x, z) => {
    let y = 25 + 6*Math.cos(TAU*(x - 32)/104);
    y += 18*Math.exp(-Math.pow((x - 74)/10, 2))*sm((z + 24)/10);            // sweeps up the foot of the North Tower
    y += 14*sm((z - 2)/10)*sm((x + 56)/8)*sm((4 - x)/8);                      // and up the South Tower's avenue face
    return y*(0.52 + 0.48*sm((z - zLo)/16));                                  // dips onto the Beach Road blocks
  };
  const NR = 15, xA = -80, xB = 76, pv = {c:'#33435a', m:0, lk:0.3, lc:'#ffe6c0'};
  for (let i = 0; i < NR; i++){
    const v0 = (i + 0.08)/NR, v1 = (i + 0.92)/NR, col = (i % 4 === 1 && i > 3 && i < 13) ? pv : steel;
    surfP(B.p(col), 52, 1, (u, v) => { const x = lerp(xA, xB, u), z = lerp(zLo, zHi(x), lerp(v0, v1, v)); return [x, Y(x, z), z]; });
    // louvre fins under each ribbon
    for (let k = 0; k <= 52; k++){ const x = lerp(xA, xB, k/52), za = lerp(zLo, zHi(x), v0), zb = lerp(zLo, zHi(x), v1);
      quadP(B.p(steel), [x, Y(x, za), za], [x, Y(x, zb), zb], [x, Y(x, zb) - 0.9, zb], [x, Y(x, za) - 0.9, za]); }
  }
  surf(g, 40, 6, (u, v) => { const x = lerp(xA, xB, u), z = lerp(zLo, zHi(x), v); return [x, Y(x, z) - 0.3, z]; }, {c:'#d4e2e6', op:0.35, m:0, lk:0.4, lc:'#ffe6c0'});
  // edge beams and the Y-shaped columns
  for (const v of [0, 1]){ const pts = []; for (let k = 0; k <= 30; k++){ const x = lerp(xA, xB, k/30), z = lerp(zLo, zHi(x), v); pts.push([x, Y(x, z) - 0.4, z]); } polyP(B.p(steel), pts, 0.45, 5); }
  for (let x = xA + 12; x < xB - 6; x += 22) for (const v of [0.22, 0.7]){
    const z = lerp(zLo, zHi(x), v), y = Y(x, z) - 0.6, k = [x, y*0.62, z];
    if ((x > -64 && x < 4 && z < -31) || (x > 27 && x < 51 && z < -3)) continue;
    segP(B.p(steel), [x, 0, z], k, 0.5, 6);
    segP(B.p(steel), k, [x - 5, y, z - 2.5], 0.32, 5); segP(B.p(steel), k, [x + 5, y, z + 2.5], 0.32, 5);
  }
  // ---- ground: the green avenue, paving, trees ----
  const site = [[128.4, -36.0], [140.4, -46.6], [140.4, 15.2], [133.9, 42.5], [120.3, 49.8], [10.5, 45.0], [-127.7, 48.2], [-137.9, 29.9], [-141.8, -57.3], [-64.7, -45.5], [7.1, -47.0], [28.5, -48.5], [67.1, -50.9], [79.1, -49]];
  prismP(B.p(pave), site, -5, 0.06);
  for (const [x, z, w, d] of [[-12, -12, 22, 12], [62, -14, 16, 18], [-80, 0, 30, 14], [18, 30, 16, 10]]) boxP(B.p(green), w, 0.5, d, x, 0.06, z, 0);
  for (let i = 0; i < 26; i++){ const x = lerp(-128, 128, rng()), z = lerp(-28, 46, rng());
    if ((x > 70 && x < 132 && z < 8) || (x > -62 && x < 4 && z > 10) || (x > -120 && x < -55 && z > 16) || (x > 26 && x < 52 && z < -2)) continue;
    treeP(B, x, 0.06, z, 1.2 + rng()*0.5, green); }
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'southbeach', lat:1.294718, lon:103.855964, rot:1.00706});

// =====================================================================================================================
// Suntec City (Tsao & McKown with DP Architects, 1995-97), Marina Centre: four 45-storey, 181 m office towers (the
// fingers) and the 18-storey Tower Five (the thumb) laid out like a left hand round the Fountain of Wealth (the
// palm's gold ring: a 21 m silicon-bronze ring, 66 m round, on four inclined 13.8 m bronze legs over its basin), on the
// 4-storey mall podium with its round east and west ends. Blue-green glass with pale spandrel bands; each tower cuts back
// one corner at 90 m and the opposite corner at 150 m (OSM building parts). The convention centre is a separate
// building to the south-west and is left to the map (its plan would swallow the Conrad Centennial).
// Local axes: +x along the tower rows (ESE, 29.7 deg south of east), +z SSW. Origin = centre of the fountain.
LANDMARKS.suntec = {zh:'新达城', en:'Suntec City', cat:'new', r:203, h:181,
  lt:{m:1, c:'#d8f0ea', k:0.6, fh:4.0, cw:3.0}, build(){
  const g = new THREE.Group(), B = mkB();
  const glass = {c:'#4c727c', m:1, fh:4.0, cw:3.0, ds:true}, band = {c:'#b9c6c3', m:0, lk:0.15}, crown = {c:'#c9d6d2', m:0, lk:1.0, lc:'#bfefff'};
  const pod = {c:'#d9d2c3', m:0, lk:0.45, lc:'#ffe2b8', ds:true}, podG = {c:'#48565c', glow:'#ffdcae', gk:0.5, ds:true}, roofc = '#b7b1a5', green = '#6a8f4c';
  const bronze = {c:'#9b7438', m:0, lk:1.2, lc:'#ffd890'};
  // a tower: plan corners in order [a, b, c, d]; corner i1 is cut back at 90 m, corner i2 (opposite) at 150 m
  const tower = (Q, i1, i2, H) => {
    const cut = (P, i) => { const n = P.length, a = P[(i - 1 + n) % n], c = P[i], b = P[(i + 1) % n]; return P.slice(0, i).concat([lerpP(c, a, 0.5), lerpP(c, b, 0.5)], P.slice(i + 1)); };
    const P1 = cut(Q, i1), P2 = (() => { const k = i2 > i1 ? i2 + 1 : i2; return cut(P1, k); })();
    const stage = (P, y0, y1) => { LPoly(g, P, y0, y1 - y0, glass); bandsP(B.p(band), P, y0, y1 - 1, 4.0, 1.2, 0.1); };
    stage(Q, -5, 90); stage(P1, 90, 150); stage(P2, 150, H);
    // sloped glass skylights over the cut corners, lit crown bands at each set-back
    for (const [P, y, i, Pn] of [[Q, 90, i1, P1], [P1, 150, i2 > i1 ? i2 + 1 : i2, P2]]){
      const n = P.length, c = P[i], a = lerpP(c, P[(i - 1 + n) % n], 0.5), b = lerpP(c, P[(i + 1) % n], 0.5);
      triP(B.p(glass), [a[0], y, a[1]], [b[0], y, b[1]], [c[0], y, c[1]]);
      bandsP(B.p(crown), P, y - 2.2, y, 2.2, 2.2, 0.12);
    }
    bandsP(B.p(crown), P2, H - 3.5, H, 3.5, 3.5, 0.12);
    capP(B.p(roofc), P2, H + 0.05);
    const c = cenP(Q); boxP(B.p(roofc), 12, 4, 12, c[0], H - 3.5, c[1], 0);
    // granite base: a two-storey colonnade round the lobby
    bandsP(B.p(pod), Q, -0.5, 9.5, 10, 10, 0.25);
  };
  tower([[-103.6, -55.5], [-59.4, -56.3], [-58.9, -16.9], [-102.9, -15.7]], 3, 1, 181);   // Tower One (west)
  tower([[-62.2, -105.9], [-17.9, -106.5], [-16.9, -66.1], [-62.0, -65.7]], 1, 3, 181);   // Tower Two
  tower([[17.7, -104.3], [63.0, -104.2], [63.3, -59.4], [17.9, -59.4]], 0, 2, 181);       // Tower Three
  tower([[68.2, -56.6], [113.1, -56.3], [112.8, -11.1], [67.4, -11.2]], 2, 0, 181);       // Tower Four (east)
  // Tower Five (18 storeys, the thumb)
  const T5 = [[-107.4, 46.3], [-48.4, 46.1], [-49.1, 105.1], [-107.6, 105.1]];
  LPoly(g, T5, -5, 77, glass); bandsP(B.p(band), T5, 0, 71, 4.0, 1.2, 0.1); bandsP(B.p(crown), T5, 68.5, 72, 3.5, 3.5, 0.12);
  bandsP(B.p(pod), T5, -0.5, 9.5, 10, 10, 0.25); capP(B.p(roofc), T5, 72.05); boxP(B.p(roofc), 22, 4, 22, -78, 72, 75.6, 0);
  // the mall podium (4 storeys) with its round ends
  const PODS = [
    [[-134.3, -55.1], [-133.5, -134.2], [-94.7, -173.5], [-94.0, -153.3], [-75.2, -134.8], [-58.4, -134.1], [-58.3, -148.4], [-24.3, -148.0], [-24.8, -106.6], [-62.1, -105.7], [-61.5, -72.0], [-75.9, -56.3]],
    [[24.4, -108.1], [-24.4, -108.2], [-24.4, -147.9], [24.5, -147.8]],
    [[24.5, -147.8], [59.0, -147.6], [58.6, -133.8], [135.8, -133.4], [176.3, -93.8], [161.1, -78.2], [135, -60], [132.4, -50.3], [130.9, -32.3], [116.4, -33.6], [117.0, -64.0], [111.8, -59.7], [101.7, -59.4], [102.2, -56.2], [72.5, -56.3], [72.3, -60.4], [63.3, -68.9], [63.0, -104.2], [23.8, -104.4]],
    [[-103.6, -55.5], [-102.9, -15.7], [-98.1, -15.8], [-98.7, 46.0], [-107.4, 46.3], [-107.6, 105.1], [-86.2, 105.1], [-85.3, 121.0], [-124.2, 121.0], [-124.8, 102.6], [-116.9, 96.0], [-113.5, 88.7], [-113.0, 77.4], [-116.9, 69.4], [-119.2, 66.6], [-127.4, 63.1], [-129.9, 55.0], [-135.5, 50.0], [-134.3, -55.1]]];
  for (const P of PODS){
    prismP(B.p(pod), P, -5, 21); bandsP(B.p(podG), P, 0.3, 19, 5.2, 3.2, 0.08);
    prismP(B.p(pod), offP(P, 0.2), 20.2, 22); capP(B.p(roofc), offP(P, -0.5), 22.02);
  }
  // round ends: the east drum (domed) and the west rotunda by the convention centre
  LCyl(g, 30.5, 30.5, 27, 162.5, -5, -48, pod, 40); for (const y of [4.6, 10.4, 16.2]) LCyl(g, 30.65, 30.65, 3.2, 162.5, y, -48, podG, 40);
  LDome(g, 29, 162.5, 22, -48, band, 0.28, 40);
  LCyl(g, 21, 21, 31, -135, -5, 86, pod, 36); for (const y of [4, 10, 16, 22]) LCyl(g, 21.15, 21.15, 3.4, -135, y, 86, podG, 36);
  LCyl(g, 20, 21, 2, -135, 26, 86, pod, 36);
  prismP(B.p(pod), [[-145, 106], [-132, 106], [-131.9, 121.0], [-145.0, 121.0]], -5, 22);
  // roof gardens and skylights on the podium
  for (const [x, z, w, d] of [[-115, -95, 26, 40], [0, -128, 30, 22], [95, -110, 50, 22], [-118, 0, 18, 70]]) boxP(B.p(green), w, 0.6, d, x, 22, z, 0);
  for (const [x, z, w, d] of [[-80, -120, 16, 10], [40, -125, 14, 12], [140, -95, 18, 10]]) boxP(B.p(podG), w, 2.5, d, x, 22, z, 0);
  // ---- the Fountain of Wealth in its round court: basin, stepped terraces, ring on four inclined legs ----
  const FR = 17.5;
  LRing(g, FR - 3, FR - 3, FR, FR, -5, 1.2, pod, 40);
  LRing(g, FR - 6, FR - 6, FR - 3, FR - 3, -5, 0.6, pod, 40);
  LCyl(g, FR - 6, FR - 6, 5.25, 0, -5, 0, {c:'#5f8c9a', glow:'#3a8ab0', gk:0.5}, 40);
  LRing(g, 10.0, 10.0, 11.0, 11.0, 12.4, 13.8, bronze, 48);
  LRing(g, 10.2, 10.2, 10.8, 10.8, 11.4, 12.4, bronze, 48);
  for (let k = 0; k < 4; k++){ const a = PI/4 + k*HP; segP(B.p(bronze), [Math.cos(a)*5.2, 0.25, Math.sin(a)*5.2], [Math.cos(a)*10.5, 12.6, Math.sin(a)*10.5], 0.75, 8); }
  segP(B.p({c:'#dff1ff', glow:'#cfeeff', gk:0.9}), [0, 0.25, 0], [0, 9, 0], 0.5, 6);
  // plaza paving round the court (the open south side of the 'palm')
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'suntec', lat:1.294769, lon:103.858919, rot:-0.5184});

// =====================================================================================================================
// Singapore Indoor Stadium (Kenzo Tange with RSP, 1989), Kallang: a 12,000-seat arena on a rhombic plan (diagonals
// about 232 m N-S and 142 m E-W), roofed by a stainless-steel space frame that rises in stepped, pagoda-like tiers to a
// 45 m ridge along the long diagonal; dark clerestory glazing in each step, glazed walls under the eaves, the entrance
// terraces at the north corner and the bridge to Stadium Walk on the east. Plan from the OSM footprint.
// Built in map axes (rot 0): the long diagonal runs NNW-SSE.
LANDMARKS.indoorstadium = {zh:'新加坡室内体育馆', en:'Singapore Indoor Stadium', cat:'new', r:130, h:45,
  lt:{m:0, c:'#e4eeff', k:0.95, e:0.6}, build(){
  const g = new THREE.Group(), B = mkB();
  const steel = {c:'#cfd3d6', m:0, lk:1.0, lc:'#dfe9ff'}, steelD = {c:'#9aa1a6', m:0, lk:0.7, lc:'#dfe9ff'};
  const clere = {c:'#3b4652', glow:'#9fc4ff', gk:0.55}, wall = {c:'#56636c', glow:'#ffe2b8', gk:0.5}, gran = {c:'#b8b2a6', m:0, lk:0.5}, pave = '#c6c0b4';
  const N = [-43.8, -110.0], E = [63.4, -28.2], S = [45.1, 104.0], W = [-64.6, 34.0];
  // a point of the rhombus: s along the long diagonal (-1 = N, +1 = S), t along the short one (-1 = W, +1 = E)
  const D = (s, t) => [(s > 0 ? s*S[0] : -s*N[0]) + (t > 0 ? t*E[0] : -t*W[0]), (s > 0 ? s*S[1] : -s*N[1]) + (t > 0 ? t*E[1] : -t*W[1])];
  const dia = (ra, rb) => [D(-ra, 0), D(0, rb), D(ra, 0), D(0, -rb)];
  const P3 = (p, y) => [p[0], y, p[1]];
  const K = 6, Y0 = 13, Y1 = 42.5, dy = (Y1 - Y0)/K;
  const RA = k => 1 - 0.6*k/K, RB = k => 1 - 0.9*k/K;
  for (let k = 0; k < K; k++){
    const y = Y0 + k*dy, O = dia(RA(k), RB(k)), I = dia(RA(k + 1) + 0.012, RB(k + 1) + 0.02), M = dia(lerp(RA(k), RA(k + 1), 0.62), lerp(RB(k), RB(k + 1), 0.62));
    const ym = y + dy*0.5, yi = y + dy*0.72;
    for (let i = 0; i < 4; i++){ const j = (i + 1) % 4;
      quadP(B.p(steel), P3(O[i], y), P3(O[j], y), P3(M[j], ym), P3(M[i], ym));      // steep lower slope of the tier
      quadP(B.p(steel), P3(M[i], ym), P3(M[j], ym), P3(I[j], yi), P3(I[i], yi));     // flatter upper slope
      quadP(B.p(clere), P3(I[i], yi), P3(I[j], yi), P3(I[j], y + dy), P3(I[i], y + dy)); // clerestory step
      // eave fascia under each tier's lower edge
      quadP(B.p(steelD), P3(O[i], y), P3(O[j], y), P3(O[j], y - (k ? 0.9 : 1.6)), P3(O[i], y - (k ? 0.9 : 1.6)));
    }
    if (k + 1 < K){ const O2 = dia(RA(k + 1), RB(k + 1)); for (let i = 0; i < 4; i++){ const j = (i + 1) % 4; quadP(B.p(steelD), P3(I[i], y + dy), P3(I[j], y + dy), P3(O2[j], y + dy), P3(O2[i], y + dy)); } }
  }
  // the ridge: a long hipped cap along the N-S diagonal
  { const T = dia(RA(K), RB(K)), y = Y0 + K*dy, a = D(-RA(K)*0.8, 0), b = D(RA(K)*0.8, 0), yr = 45;
    triP(B.p(steel), P3(T[0], y), P3(a, yr), P3(T[3], y)); triP(B.p(steel), P3(T[0], y), P3(T[1], y), P3(a, yr));
    triP(B.p(steel), P3(T[2], y), P3(T[3], y), P3(b, yr)); triP(B.p(steel), P3(T[2], y), P3(b, yr), P3(T[1], y));
    quadP(B.p(steel), P3(T[1], y), P3(b, yr), P3(a, yr), P3(T[1], y)); quadP(B.p(steel), P3(a, yr), P3(T[1], y), P3(b, yr), P3(b, yr));
    quadP(B.p(steel), P3(T[3], y), P3(a, yr), P3(b, yr), P3(T[3], y)); }
  // standing-seam ribs down the lowest tiers (radial lines from the centre)
  for (let i = 0; i < 4; i++) for (let k = 1; k < 12; k++){
    const f = k/12, sA = [1, 0, -1, 0][i], tA = [0, 1, 0, -1][i], sB = [0, -1, 0, 1][i], tB = [1, 0, -1, 0][i];
    const p = (r) => D(lerp(sA, sB, f)*r, lerp(tA, tB, f)*r);
    const y0 = Y0, y1 = Y0 + dy*0.5; const a = p(1), b = p(lerp(1, RA(1), 0.62));
    segP(B.p(steelD), [a[0], y0 + 0.2, a[1]], [b[0], y1 + 0.2, b[1]], 0.18, 4);
  }
  // walls under the eaves: glazed with a granite base; the footprint plinth with the north entrance terraces
  const FP = [[-64.5, -69.2], [-75.2, -95.3], [-57.3, -101.9], [-61.5, -111.9], [-43.6, -118.5], [-40.0, -110.2], [-6.0, -123.8], [-1.2, -110.8], [-16.7, -104.8], [-8.3, -82.9], [63.3, -28.3], [99.1, -33.1], [66.9, -19.4], [60.9, -9.9], [46.0, 97.4], [41.8, 88.5], [35.8, 91.5], [39.4, 100.4], [-60.9, 36.3], [-55.5, 34.5], [-58.5, 26.8], [-63.9, 29.2], [-52.5, -49.7], [-48.9, -53.8], [-56.1, -72.2]];
  prismP(B.p(gran), FP, -5, 1.0);
  const WL = dia(0.93, 0.92);
  prismP(B.p(wall), WL, 1.0, Y0 - 0.5);
  for (let i = 0; i < 4; i++){ const a = WL[i], b = WL[(i + 1) % 4], n = Math.round(Math.hypot(b[0] - a[0], b[1] - a[1])/7.5);
    for (let k = 0; k <= n; k++){ const p = lerpP(a, b, k/n); segP(B.p(steelD), [p[0], 1, p[1]], [p[0], Y0 - 0.3, p[1]], 0.35, 4); } }
  // entrance terraces and canopy at the north corner, the east bridge
  prismP(B.p(gran), [[-64.5, -69.2], [-75.2, -95.3], [-57.3, -101.9], [-61.5, -111.9], [-43.6, -118.5], [-40.0, -110.2], [-6.0, -123.8], [-1.2, -110.8], [-16.7, -104.8], [-8.3, -82.9], [-40, -80]], 1.0, 3.6);
  capP(B.p(steelD), [[-58, -95], [-44, -112], [-8, -116], [-14, -96]], 9.5);
  for (const p of [[-56, -96], [-44, -110], [-10, -114], [-15, -97]]) segP(B.p(steelD), [p[0], 3.6, p[1]], [p[0], 9.5, p[1]], 0.5, 6);
  prismP(B.p(gran), [[63.3, -28.3], [99.1, -33.1], [66.9, -19.4]], 1.0, 6.5);
  for (const [P, h] of [[[[66.3, 16.2], [74.6, 16.7], [74.0, 34.5], [65.1, 34.5]], 9.6], [[[36.4, -50.9], [44.8, -58.0], [48.4, -53.8], [40.6, -46.7]], 8.8]]){
    prismP(B.p(gran), P, -5, h - 1); prismP(B.p(steelD), offP(P, 0.6), h - 1, h); }
  prismP(B.p(pave), offP([[-75.2, -95.3], [-43.6, -118.5], [-6.0, -123.8], [63.3, -28.3], [99.1, -33.1], [60.9, -9.9], [46.0, 97.4], [-60.9, 36.3]], -1), -5, 0.06);
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'indoorstadium', lat:1.300734, lon:103.874321, rot:0});

// =====================================================================================================================
// National Stadium, Singapore Sports Hub (Arup / DP Architects, 2014) - remake. A 310 m free-span shallow steel dome
// (83 m high) clad in silver insulated metal panels over a lattice of arching beams that criss-cross the exterior and
// land on the ground beyond the facade, framing a covered promenade round the louvred enclosure. Over the pitch the
// dome is open along a 75 m wide slot that runs from beyond the centre out to the water-facing (south-west) edge -
// the 'western gate' that frames the city skyline; the two ETFE halves of the retractable roof (with their 20,000 m2
// LED matrix) sit parked on either side of the slot near the crown, carried by runway trusses that arch over the
// pitch. Inside: the 55,000-seat three-tier bowl of red seats, lower tier continuous, upper tiers open to the gate;
// pitch and athletics track. Dome rings, slot and parked roof halves from the OSM building parts.
// Local axes: +x along the slot towards the north-east (the gate is at -x), +z towards the south-east.
LANDMARKS.sportshub = {zh:'新加坡国家体育场', en:'National Stadium · Sports Hub', cat:'new', r:162, h:83,
  lt:{m:0, c:'#e6efff', k:0.55, e:0.6}, build(){
  const g = new THREE.Group(), B = mkB(), RE = 155, RC = 146, HW = 37.5, XE = 12;
  const panel = {c:'#d5d9dc', m:0, lk:0.62, lc:'#e6efff'}, panelD = {c:'#b4babf', m:0, lk:0.55, lc:'#e6efff'}, rib = {c:'#eef0f1', m:0, lk:0.8, lc:'#e6efff'};
  const led = {c:'#c8d0d8', m:2, lk:0.9}, etfe = {c:'#e9eef0', glow:'#f4f8ff', gk:0.6}, seat = {c:'#9c2a2c', glow:'#ff3a2a', gk:0.12};
  const conc = {c:'#c9c4ba', m:0, lk:0.5}, louv = {c:'#9aa3a8', glow:'#ffe2b8', gk:0.4}, pitch = {c:'#4f8a3c', glow:'#3d7a2c', gk:0.5}, track = {c:'#a0543e', glow:'#7a3a2a', gk:0.25};
  // dome profile: a spherical cap (R 183.8 m, 310 m span) fitted to the OSM ring heights, ~79 m at the slot rim near the crown
  const Yd = r => 85 - 183.8 + Math.sqrt(Math.max(0, 183.8*183.8 - r*r));
  const inOpen = (x, z) => (Math.abs(z) < HW && x < XE) || ((x - XE)*(x - XE) + z*z < HW*HW);
  // distance from the centre to the opening's edge along direction a (from +x)
  const dIn = a => { const c = Math.cos(a), s = Math.abs(Math.sin(a)); const t = s > 1e-6 ? HW/s : 1e9;
    if (t*c < XE) return t; return XE*c + Math.sqrt(Math.max(0, XE*XE*c*c - XE*XE + HW*HW)); };
  const A0 = Math.asin(HW/RC) + 0.004;   // angle (from -x) where the slot leaves the clad dome
  const P = (a, r) => [Math.cos(a)*r, Yd(r), Math.sin(a)*r];
  // the cladding, as panels between the radial ribs (alternate silver tones)
  const NA = 96, NR = 14;
  for (let i = 0; i < NA; i++){
    const a0 = (PI - A0) - (TAU - 2*A0)*i/NA, a1 = (PI - A0) - (TAU - 2*A0)*(i + 1)/NA;
    const o = B.p(i % 2 ? panel : panelD);
    for (let j = 0; j < NR; j++){
      const r00 = lerp(Math.min(dIn(a0), RC), RC, j/NR), r01 = lerp(Math.min(dIn(a0), RC), RC, (j + 1)/NR);
      const r10 = lerp(Math.min(dIn(a1), RC), RC, j/NR), r11 = lerp(Math.min(dIn(a1), RC), RC, (j + 1)/NR);
      quadP(o, P(a0, r00), P(a1, r10), P(a1, r11), P(a0, r01));
    }
  }
  // the opening's rim: a deep fascia carrying the LED band, all round the slot
  const rim = [];
  for (let i = 0; i <= 120; i++){ const a = (PI - A0) - (TAU - 2*A0)*i/120, r = Math.min(dIn(a), RC); rim.push(P(a, r)); }
  for (let i = 0; i < rim.length - 1; i++){ const a = rim[i], b = rim[i + 1];
    quadP(B.p(led), [a[0], a[1] + 0.6, a[2]], [b[0], b[1] + 0.6, b[2]], [b[0], b[1] - 3.0, b[2]], [a[0], a[1] - 3.0, a[2]]); }
  // the outer lattice: two families of arching beams that cross on the dome and land on the ground beyond the facade
  const NB = 40;
  for (const sg of [-1, 1]) for (let i = 0; i < NB; i++){
    const a0 = i/NB*TAU, pts = [];
    for (let k = 0; k <= 16; k++){ const r = lerp(RE, 40, k/16), a = a0 + sg*0.9*(1 - r/RE), x = Math.cos(a)*r, z = Math.sin(a)*r;
      if (inOpen(x, z) || (Math.abs(z) < HW + 2 && x < XE + 2 && r > 20)) break;
      pts.push([x, r > RC ? Yd(RC)*(RE - r)/(RE - RC) : Yd(r) + 0.6, z]); }
    if (pts.length > 1) polyP(B.p(rib), pts, 0.85, 4);
  }
  // concentric purlin rings where the cladding meets the edge and half-way up
  for (const rr of [RC, 118, 90]){ const pts = []; for (let i = 0; i <= 96; i++){ const a = (PI - A0) - (TAU - 2*A0)*i/96; if (rr < dIn(a)) { if (pts.length > 1) polyP(B.p(rib), pts, 0.7, 4); pts.length = 0; continue; } pts.push(P(a, rr)); } if (pts.length > 1) polyP(B.p(rib), pts, 0.7, 4); }
  // the louvred enclosure under the dome edge and the covered promenade
  const RW = 136;
  for (let i = 0; i < 72; i++){ const a0 = i/72*TAU, a1 = (i + 1)/72*TAU, am = (a0 + a1)/2; if (Math.cos(am) < -0.93) continue;
    const y1 = Yd(RW) - 1.5;
    quadP(B.p(louv), [Math.cos(a0)*RW, 0, Math.sin(a0)*RW], [Math.cos(a1)*RW, 0, Math.sin(a1)*RW], [Math.cos(a1)*RW, y1, Math.sin(a1)*RW], [Math.cos(a0)*RW, y1, Math.sin(a0)*RW]);
    for (let k = 0; k < 3; k++){ const a = lerp(a0, a1, (k + 0.5)/3); segP(B.p(conc), [Math.cos(a)*(RW + 0.8), 0, Math.sin(a)*(RW + 0.8)], [Math.cos(a)*(RW + 0.8), y1, Math.sin(a)*(RW + 0.8)], 0.3, 4); } }
  LRing(g, RW - 2, RW - 2, RE, RE, -5, 0.5, conc, 96);
  // ---- inside: pitch, track and the three-tier bowl ----
  LPoly(g, ellP(92, 52, 48), -5, 5.3, track);
  LPoly(g, [[-52.5, -34], [52.5, -34], [52.5, 34], [-52.5, 34]], 0.3, 0.1, pitch);
  for (let k = -5; k <= 5; k += 2) boxP(B.p({c:'#5c9746', glow:'#4a8a38', gk:0.5}), 9.5, 0.12, 68, k*9.5, 0.4, 0, 0);
  // the bowl: elliptical rings from the track edge (95 x 56 m) to the back row (128 x 110 m), rising to ~7 m under
  // the dome all round; three tiers split by concourse fascias; the two upper tiers stop either side of the gate
  const AX = v => lerp(95, 128, v), BZ = v => lerp(56, 110, v);
  const yB = (a, v) => { const r = Math.hypot(Math.cos(a)*AX(1), Math.sin(a)*BZ(1)); return 1 + (Yd(r) - 8)*Math.pow(v, 0.95); };
  const BP = (a, v) => [Math.cos(a)*AX(v), yB(a, v), Math.sin(a)*BZ(v)];
  const TIERS = [[0, 0.4, 0], [0.45, 0.7, 0.42], [0.75, 1, 0.55]];
  for (const [v0, v1, gap] of TIERS){
    const a0 = gap ? PI + gap : 0, a1 = gap ? 3*PI - gap : TAU;
    surf(g, 90, 3, (u, v) => BP(lerp(a0, a1, u), lerp(v0, v1, v)), seat);
    // fascia (front of the tier above) and aisles
    const fa = B.p({c:'#dad6cf', glow:'#ffe6c4', gk:0.35});
    for (let i = 0; i < 90; i++){ const p = BP(lerp(a0, a1, i/90), v0), q = BP(lerp(a0, a1, (i + 1)/90), v0); quadP(fa, p, q, [q[0], q[1] - 2.6, q[2]], [p[0], p[1] - 2.6, p[2]]); }
    for (let i = 0; i < 36; i++){ const a = lerp(a0, a1, (i + 0.5)/36), w = 0.006; const P1 = (v, d) => { const p = BP(a + d, v); return [p[0], p[1] + 0.15, p[2]]; };
      quadP(B.p({c:'#d8d2c8', ds:true}), P1(v0, -w), P1(v0, w), P1(v1, w), P1(v1, -w)); }
  }
  // back wall of the bowl up to the dome, closed except at the gate
  surf(g, 90, 1, (u, v) => { const a = lerp(PI + 0.55, 3*PI - 0.55, u), p = BP(a, 1), r = Math.hypot(p[0], p[2]); return [p[0]*1.005, lerp(p[1] - 1, Yd(r) - 1, v), p[2]*1.005]; }, conc);
  // ---- the retractable roof: runway trusses arching over the pitch, the two ETFE halves parked by the slot ----
  for (const xr of [-28, 40]){ const pts = []; for (let k = 0; k <= 16; k++){ const z = lerp(-HW - 14, HW + 14, k/16), r = Math.hypot(xr, z); pts.push([xr, Math.abs(z) <= HW ? Yd(Math.hypot(xr, HW)) + 1.5 + 2.0*Math.sin(PI*(z + HW)/(2*HW)) : Yd(r) + 1.5, z]); }
    polyP(B.p(rib), pts, 1.1, 6); polyP(B.p(rib), pts.map(p => [p[0] + 3, p[1] - 2.5, p[2]]), 0.6, 4); }
  for (const sg of [-1, 1]){
    // a circular segment: chord on the slot edge from x = -44 to x = 46, arc out to r = 62
    const pts = []; for (let i = 0; i <= 18; i++){ const x = lerp(-44, 46, i/18); pts.push([x, sg*(HW + 0.5)]); }
    const arc = []; for (let i = 0; i <= 18; i++){ const x = lerp(46, -44, i/18), zz = Math.sqrt(Math.max(0, 62*62 - x*x)); arc.push([x, sg*Math.max(HW + 6, zz*0.92)]); }
    const seg = pts.concat(arc), yS = p => Yd(Math.hypot(p[0], p[1])) + 1.8;
    const top = seg.map(p => [p[0], yS(p), p[1]]);
    for (let i = 0; i < 19; i++){ const a = top[i], b = top[i + 1], c = top[37 - i - 1], d = top[37 - i];
      if (c && d) quadP(B.p(etfe), a, b, c, d); }
    for (let i = 0; i < seg.length; i++){ const a = top[i], b = top[(i + 1) % seg.length]; quadP(B.p(led), a, b, [b[0], b[1] - 2.6, b[2]], [a[0], a[1] - 2.6, a[2]]); }
    for (let i = 1; i < 18; i += 2){ const a = top[i], b = top[37 - i]; segP(B.p(rib), [a[0], a[1] + 0.3, a[2]], [b[0], b[1] + 0.3, b[2]], 0.35, 4); }
  }
  // floodlight ring under the rim of the opening
  const fl = []; for (let i = 0; i < 64; i++){ const a = (PI - A0) - (TAU - 2*A0)*(i + 0.5)/64, r = Math.min(dIn(a), RC) + 3; fl.push(Math.cos(a)*r, Yd(r) - 5.5, Math.sin(a)*r); }
  for (let i = 0; i < fl.length; i += 3) boxP(B.p({c:'#f2f2ee', glow:'#ffffff', gk:1.4}), 2.2, 0.8, 2.2, fl[i], fl[i + 1], fl[i + 2], 0);
  B.flush(g);
  return g; }};
SG_PLACES.push({type:'sportshub', lat:1.304440, lon:103.874349, rot:0.7210});
}
