// GENERATED from hk/shenzhen/shenzhen.js by gbareal/tools/mkhklm.py - do not edit
// ===== hk/shenzhen — City Brush v37 Hong Kong map: the Shenzhen skyline towers seen across the boundary (agent hk_e)
// Keys: hkpingan (Ping An Finance Center), hkcrtower (China Resources Tower), hkkingkey (KK100). (The fourth Shenzhen target,
// hkszbaybridge, lives in hk/bridges/bridges.js with the other long viaducts.)
// Each tower stands on its OSM footprint (local x = east, z = south, rot 0), heights from OSM / Wikipedia: Ping An 599.1 m
// (115 storeys, observation deck 562.5 m), China Resources Tower 392.5 m (68 storeys, top floor 345 m), KK100 441.8 m
// (100 storeys, top floor 427 m).
{
/* gba: this module runs in the Hong Kong frame (x_gba = x_hk + 7000.0, y_gba = y_hk + -35000.0): frame shims (gbareal/tools/mkhklm.py) */
const sgXY = (lat, lon) => { const q = _gbaXY(lat, lon); return [q[0] - 7000.0, q[1] - -35000.0]; };
const hC = (x, y) => _gbaHC(x + 7000.0, y + -35000.0), hAt = (x, y) => _gbaHAt(x + 7000.0, y + -35000.0);
const SGRoads = _gbaRoadsHK;

const PI = Math.PI, TAU = PI*2;
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const q4 = (o, a, b, c, d) => o.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2]);
const t3 = (o, a, b, c) => o.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
function loft(o, R, cap, apex){
  for (let i = 0; i < R.length - 1; i++){ const a = R[i], b = R[i + 1], n = a.length; for (let k = 0; k < n; k++){ const k2 = (k + 1) % n; q4(o, a[k], a[k2], b[k2], b[k]); } }
  if (cap){ const r = R[R.length - 1], n = r.length; let c = apex; if (!c){ c = [0, 0, 0]; for (const p of r){ c[0] += p[0]/n; c[1] += p[1]/n; c[2] += p[2]/n; } } for (let k = 0; k < n; k++) t3(o, r[k], r[(k + 1) % n], c); }
}
// a strip of quads standing out from a polyline of [x, y, z] points (fins, ribs): outward direction per point o[] ([x, z]), depth d, half width w
function fin(o, pts, outs, d, w){
  const S = pts.map((p, i) => { const [ox, oz] = outs[i], l = Math.hypot(ox, oz) || 1, ux = ox/l, uz = oz/l, tx = -uz, tz = ux;
    return [[p[0] - tx*w, p[1], p[2] - tz*w], [p[0] - tx*w + ux*d, p[1], p[2] - tz*w + uz*d], [p[0] + tx*w + ux*d, p[1], p[2] + tz*w + uz*d], [p[0] + tx*w, p[1], p[2] + tz*w]]; });
  for (let i = 0; i < S.length - 1; i++){ const a = S[i], b = S[i + 1]; q4(o, a[0], a[1], b[1], b[0]); q4(o, a[1], a[2], b[2], b[1]); q4(o, a[2], a[3], b[3], b[2]); }
}
const box = (o, x0, x1, y0, y1, z0, z1) => { const A = [x0, y0, z0], B_ = [x1, y0, z0], C = [x1, y0, z1], D = [x0, y0, z1], E = [x0, y1, z0], F = [x1, y1, z0], G = [x1, y1, z1], H = [x0, y1, z1];
  q4(o, E, H, G, F); q4(o, A, E, F, B_); q4(o, B_, F, G, C); q4(o, C, G, H, D); q4(o, D, H, E, A); };
function sprites(g, pts, rgb, size){
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const col = new Float32Array(pts.length); for (let i = 0; i < col.length; i += 3){ col[i] = rgb[0]; col[i+1] = rgb[1]; col[i+2] = rgb[2]; }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({size, map:typeof lampTex !== 'undefined' ? lampTex : null, vertexColors:true, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending, sizeAttenuation:true});
  const p = new THREE.Points(geo, mat); p.renderOrder = 6;
  p.onBeforeRender = () => { mat.opacity = typeof matLamp !== 'undefined' ? Math.min(1, matLamp.opacity*1.1) : (NIGHT.uNight.value > 0.5 ? 1 : 0); };
  g.add(p);
}

// ================= Ping An Finance Center (Futian, 2017) =================
// OSM footprint w535860513: a 76.5 m square whose corners are notched (the eight mega-columns stand in the notches, paired at
// each corner); the shaft tapers gently, the faces then draw in to a stepped crown and the spire tip at 599.1 m. Stainless-steel
// ribs (1 700 t of stainless steel cladding: Wikipedia) run up the corner edges into the crown; glass between.
const PA_PLAN = W => { const a = W*0.534, b = W*0.822, c = W*0.579, P = [];
  for (let q = 0; q < 4; q++){ const r = q*PI/2, cs = Math.cos(r), sn = Math.sin(r), R = (x, z) => [x*cs - z*sn, x*sn + z*cs];
    P.push(R(W, -a), R(W, a), R(b, c), R(b, b), R(c, b)); }
  return P; };    // 20 points, counter-clockwise from the east face
LANDMARKS.hkpingan = {zh:'平安金融中心', en:'Ping An Finance Center', cat:'new', r:46, h:599.1, lt:{m:1, c:'#e6efff', k:0.8},
  build(){
    const g = new THREE.Group(), B = mkB();
    const GL = {c:'#a4b0b9', m:1, fh:4.5, cw:3.0}, SS = {c:'#d5d9dc', m:0, lk:0.9, glow:'#e4ecff', gk:0.55}, SS2 = {c:'#c4c9cd', m:0, lk:0.7}, CROWN = {c:'#9aa7b1', m:0, lk:0.9},
      BASE = {c:'#b3aea4', lk:0.4}, RED = {c:'#a81010', glow:'#ff2a14', gk:2.4};
    // half width of the faces with height: 38.2 m at the base, 31 m at 540 m, drawing in to the crown
    const Wy = y => y <= 540 ? 38.2 - 7.2*Math.pow(y/540, 1.15) : y <= 568 ? 31 - 5*((y - 540)/28) : y <= 584 ? 26 - 9*((y - 568)/16) : 17 - 13*((y - 584)/7);
    const ys = [0, 60, 120, 200, 280, 360, 440, 500, 540, 556, 568, 576, 584, 591];
    const ring = y => PA_PLAN(Wy(y)).map(p => [p[0], y, -p[1]]);
    loft(B.p(GL), ys.slice(0, 11).map(ring), false);
    loft(B.p(CROWN), ys.slice(10).map(ring), true, [0, 592, 0]);
    // spire tip
    loft(B.p(SS), [[0, 591, 0], [0, 599.1, 0]].map((c, i) => { const r = i ? 0.25 : 3.2, R = []; for (let k = 0; k < 8; k++){ const th = k/8*TAU; R.push([c[0] + Math.cos(th)*r, c[1], c[2] + Math.sin(th)*r]); } return R; }), true, [0, 599.1, 0]);
    // corner ribs: on the 8 notch edges and the 8 face ends, from 12 m up to the crown, converging
    const oR = B.p(SS), oR2 = B.p(SS2);
    const rys = [12, 60, 120, 200, 280, 360, 440, 500, 540, 556, 568, 576, 584, 590];
    for (let q = 0; q < 4; q++) for (const j of [2, 4, 0, 1]){ const idx = q*5 + j;
      const pts = rys.map(y => { const p = PA_PLAN(Wy(y))[idx]; return [p[0], y, -p[1]]; }), outs = pts.map(p => [p[0], p[2]]);
      fin(j === 2 || j === 4 ? oR : oR2, pts, outs, j === 2 || j === 4 ? 1.6 : 0.8, j === 2 || j === 4 ? 0.9 : 0.45); }
    // vertical mullion fins on the four faces (every ~2.9 m), up to the crown
    const mys = [12, 120, 280, 440, 540, 556];
    for (let q = 0; q < 4; q++) for (let k = -6; k <= 6; k++){ const f = k/6.5;
      const pts = mys.map(y => { const W = Wy(y), a = W*0.534, r = q*PI/2, x = W + 0.05, z = f*a; return [x*Math.cos(r) - z*Math.sin(r), y, -(x*Math.sin(r) + z*Math.cos(r))]; });
      const outs = mys.map(() => { const r = q*PI/2; return [Math.cos(r), -Math.sin(r)]; }); fin(oR2, pts, outs, 0.5, 0.18); }
    // plinth / lobby base
    loft(B.p(BASE), [PA_PLAN(39.0).map(p => [p[0], -4, -p[1]]), PA_PLAN(39.0).map(p => [p[0], 12, -p[1]])], false);
    box(B.p(RED), -0.4, 0.4, 599.1, 599.9, -0.4, 0.4);
    B.flush(g); sprites(g, [0, 600.1, 0], [1.0, 0.18, 0.1], 18);
    return g;
  }};
SG_PLACES.push({type:'hkpingan', lat:22.53664, lon:114.050355, rot:0});

// ================= China Resources Tower ("Spring Bamboo", Houhai, 2018) =================
// OSM footprint w529272473: a circle 73 m across. A ring of slender columns (56, the published design) runs up the glass drum,
// pairing into V's at the base, and closes over the top floors (345 m) into the pointed bamboo-shoot crown at 392.5 m.
LANDMARKS.hkcrtower = {zh:'华润大厦', en:'China Resources Tower', cat:'new', r:40, h:392.5, lt:{m:1, c:'#e6efff', k:0.8},
  build(){
    const g = new THREE.Group(), B = mkB();
    const GL = {c:'#a6b3bc', m:1, fh:4.4, cw:3.0}, COL = {c:'#e0e1de', m:0, lk:0.8, glow:'#eef3ff', gk:0.5}, DOME = {c:'#9fb0bb', m:0, lk:0.9, glow:'#cfe3ff', gk:0.35},
      BASE = {c:'#b3aea4', lk:0.4}, RED = {c:'#a81010', glow:'#ff2a14', gk:2.4};
    const H = 392.5, R0 = 36.6;
    const Ry = y => y <= 170 ? R0 - 0.6*(y/170) : (R0 - 0.6)*Math.pow(Math.max(0, 1 - Math.pow((y - 170)/(H - 170), 2.0)), 0.62);
    const NS = 56, cr = (y, r) => { const R = []; for (let k = 0; k < NS; k++){ const th = (k + 0.5)/NS*TAU; R.push([Math.cos(th)*r, y, Math.sin(th)*r]); } return R; };
    const gys = [0, 40, 100, 170, 230, 280, 320, 345];
    loft(B.p(GL), gys.map(y => cr(y, Ry(y) - 1.1)), false);
    const dys = [345, 360, 372, 382, 388];
    loft(B.p(DOME), dys.map(y => cr(y, Math.max(0.2, Ry(y) - 1.1))), true, [0, 389.5, 0]);
    // the columns: 56 around, V-pairs at the base (merging over the lowest 24 m), converging to the apex
    const cys = [0, 8, 16, 24, 60, 120, 170, 210, 250, 285, 315, 340, 360, 375, 385, 390];
    const oC = B.p(COL);
    for (let k = 0; k < NS; k++){ const th0 = k/NS*TAU, thp = (Math.floor(k/2)*2 + 1)/NS*TAU;
      const pts = [], outs = [];
      for (const y of cys){ const f = y < 24 ? 1 - y/24 : 0, th = th0*(1 - f) + thp*f, r = Math.max(0.6, Ry(y)); pts.push([Math.cos(th)*r, y, Math.sin(th)*r]); outs.push([Math.cos(th), Math.sin(th)]); }
      fin(oC, pts, outs, 1.25, 0.42); }
    // apex
    loft(oC, [cr(389, 0.9), cr(H, 0.15)], true, [0, H, 0]);
    loft(B.p(BASE), [cr(-4, R0 + 0.6), cr(6, R0 + 0.6)], false);
    box(B.p(RED), -0.4, 0.4, H, H + 0.8, -0.4, 0.4);
    B.flush(g); sprites(g, [0, H + 1.0, 0], [1.0, 0.18, 0.1], 16);
    return g;
  }};
SG_PLACES.push({type:'hkcrtower', lat:22.517785, lon:113.941611, rot:0});

// ================= KK100 (Luohu, 2011; TFP Farrells / Arup) =================
// OSM footprint w164033632 (59 x 57 m, its south face curved). The 100-storey shaft (slenderness 9.5 : 1, Wikipedia) has softly
// bulging long faces that swell toward mid-height and draw in toward the top, and a curved glass crown over the top floors
// (top floor 427 m) rising to 441.8 m. Vertical mullion fins on the glass.
LANDMARKS.hkkingkey = {zh:'京基100', en:'KK100', cat:'new', r:41, h:441.8, lt:{m:1, c:'#e6efff', k:0.8},
  build(){
    const g = new THREE.Group(), B = mkB();
    const GL = {c:'#9fb5c3', m:1, fh:4.2, cw:3.0}, FIN = {c:'#d2d7da', m:0, lk:0.8}, CROWN = {c:'#a8bccb', m:0, lk:0.9, glow:'#d7e9ff', gk:0.6},
      BASE = {c:'#b3aea4', lk:0.4}, RED = {c:'#a81010', glow:'#ff2a14', gk:2.4};
    // plan: long faces (north / south) convex, ends (east / west) gently curved; half sizes a (x) and b (z) vary with height
    const HY = 427, plan = (y) => { const f = y/HY, sw = 1 + 0.05*Math.sin(PI*Math.min(1, f/0.8)), top = f > 0.75 ? 1 - 0.13*((f - 0.75)/0.25)**1.4 : 1;
      const a = 29.0*sw*top, b = 23.0*sw*top, bul = 4.0*top, eb = 1.6*top, P = [];
      for (let k = 0; k < 16; k++){ const u = -1 + 2*k/16; P.push([a*u, -(b + bul*(1 - u*u))]); }          // north face (z < 0)
      for (let k = 0; k < 8; k++){ const v = -1 + 2*k/8; P.push([a + eb*(1 - v*v), b*v]); }                 // east end
      for (let k = 0; k < 16; k++){ const u = 1 - 2*k/16; P.push([a*u, b + bul*(1 - u*u)]); }              // south face
      for (let k = 0; k < 8; k++){ const v = 1 - 2*k/8; P.push([-a - eb*(1 - v*v), b*v]); }                // west end
      return P; };
    const ys = [0, 40, 100, 170, 240, 300, 340, 370, 395, 412, 427];
    loft(B.p(GL), ys.map(y => plan(y).map(p => [p[0], y, p[1]])), false);
    // crown: a curved glass roof vaulting over the long axis (edges at 427 m, crest 441.8 m), with gable walls at the ends
    const P0 = plan(HY), oCr = B.p(CROWN), nS = 12, vault = [];
    for (let j = 0; j <= nS; j++){ const u = -1 + 2*j/nS, yv = HY + 14.8*(1 - u*u); vault.push(yv); }
    // the roof surface: interpolate across z between the north and south edges at each x
    for (let i = 0; i < 16; i++){ const xa = P0[i][0], xb = P0[i + 1][0], za = P0[i][1], zb = P0[i + 1][1], zsa = P0[40 - i][1], zsb = P0[39 - i][1];
      for (let j = 0; j < nS; j++){ const u0 = j/nS, u1 = (j + 1)/nS;
        q4(oCr, [xa, vault[j], za + (zsa - za)*u0], [xb, vault[j], zb + (zsb - zb)*u0], [xb, vault[j + 1], zb + (zsb - zb)*u1], [xa, vault[j + 1], za + (zsa - za)*u1]); } }
    for (const sx of [-1, 1]){ const x = sx*Math.abs(P0[16][0]), zn = P0[0][1], zs = -zn;
      for (let j = 0; j < nS; j++){ const z0 = zn + (zs - zn)*j/nS, z1 = zn + (zs - zn)*(j + 1)/nS; q4(oCr, [x, HY, z0], [x, HY, z1], [x, vault[j + 1], z1], [x, vault[j], z0]); } }
    // vertical mullion fins on the long faces every ~3.6 m, up into the crown edge
    const oF = B.p(FIN), fys = [6, 100, 240, 340, 395, 427];
    for (const side of [0, 2]) for (let k = 1; k < 16; k++){ const idx = side === 0 ? k : 24 + k;
      const pts = fys.map(y => { const p = plan(y)[idx]; return [p[0], y, p[1]]; }), outs = pts.map(p => [0, Math.sign(p[2])]);
      fin(oF, pts, outs, 0.6, 0.22); }
    loft(B.p(BASE), [plan(0).map(p => [p[0]*1.03, -4, p[1]*1.03]), plan(0).map(p => [p[0]*1.03, 8, p[1]*1.03])], false);
    box(B.p(RED), -0.4, 0.4, 441.8, 442.6, -0.4, 0.4);
    B.flush(g); sprites(g, [0, 442.8, 0], [1.0, 0.18, 0.1], 16);
    return g;
  }};
SG_PLACES.push({type:'hkkingkey', lat:22.545706, lon:114.101581, rot:0});
}
