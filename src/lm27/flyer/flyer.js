// ===== City Brush v30 — the Singapore Flyer, turning (lm27 "flyer"; Singapore only, loaded after lm22/marina/marina.js) =====
// Singapore Flyer (2008, Kisho Kurokawa / DP Architects; engineering Arup with Mitsubishi Heavy Industries): 165 m overall,
// 150 m wheel, 28 air-conditioned cylindrical capsules (~7 m x 4 m) mounted OUTBOARD of the rim and kept level, a slim
// "third generation" 2-D ladder-truss rim (two 864 mm CHS chords side by side, rungs and diagonals), 112 prestressed spoke
// cables (4 per capsule node: two to their own side of the rim, two crossed to the opposite side) from a wide hub, the hub
// turning on a 2.6 m x 25.25 m spindle carried between two 2.85 m tubular pylons (2 deg inward lean) founded in the courtyard
// of the three-storey doughnut-shaped terminal, the pylon heads stabilised at spindle level by four 6-cable stays anchored in
// the courtyard, where the tropical rainforest garden with its water features grows under the wheel; boarding from decks at
// the third storey (on steel towers, bridges to the terminal). Night: colour-changing LED fixtures on the spokes and capsules
// (a rim outline, lit spokes, colour-washed capsule frames, warm lit cabins) — modelled as a slow programme of LED scenes.
//
// The wheel TURNS: one revolution in 5.5 minutes (the real wheel takes ~30-32 min per turn, which looks frozen on screen), in
// the real direction since the 2008 feng-shui reversal (capsules rise on the east side, cross the top towards the city and come
// down over the CBD / Marina Bay; i.e. clockwise seen from Marina Centre). The angle comes from the wall clock, so every
// viewer and every rebuild shows the same position.
// How: build() returns the static landmark (terminal, courtyard, pylons, spindle, stays, decks), which the app merges per
// material as usual (lmMerge). The moving part is built at the same time but kept OFF the merged tree (g.userData.flyRig);
// a HOOKS.frame hook attaches it to the placed landmark group on the next frame and from then on only sets one rotation
// (the wheel: rim, spokes, hub, capsule forks — one merged mesh) and 28 instance translations (the level capsules — one
// InstancedMesh). Both use one small custom Lambert material each (vertex colours + a light-class attribute; the LED scene is
// computed in the fragment shader from a few shared uniforms), so the moving part costs 2 draw calls (+2 in the shadow pass)
// and < 0.05 ms per frame. Shadows follow automatically (object transforms / instancing). When the landmark is rebuilt
// (city switch, reset, rebuildLandmarks) its old group leaves the scene; the hook notices, frees the rig's materials and
// forgets it, and the new build brings a new rig. Without the app hooks (offline tools, in-situ kit) the wheel is baked
// into the static model at angle 0. window.SGFlyer = {angle(), period, stats(), rigs()} for tests.
// Model frame: origin = the wheel's ground point under the hub, y = 0 ground, wheel in the local x-y plane, axle along z;
// rot turns local +x to the wheel's real bearing (38 deg north of east, towards the NE end); local -z faces Raffles Avenue.
{
const FLY_CITY = (typeof document !== 'undefined' && document.querySelector) ? ((document.querySelector('meta[name="citybrush-map"]') || {}).content || 'sg') : 'sg';
if (FLY_CITY === 'sg'){
const PI = Math.PI, TAU = PI*2;
const clamp01 = t => t < 0 ? 0 : t > 1 ? 1 : t;
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const nrm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0]/l, a[1]/l, a[2]/l]; };
const mix = (a, b, t) => [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];
// triangle batches keyed by colour spec (+ light class for the moving part)
const mkB = () => { const M = new Map(); return {
  p(col, L){ const k = (typeof col === 'string' ? col : JSON.stringify(col)) + '|' + (L || 0); let e = M.get(k); if (!e){ e = {col, L:L || 0, a:[]}; M.set(k, e); } return e.a; },
  all(){ return [...M.values()]; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const quadP = (o, a, b, c, d) => { o.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2]); };
const triP = (o, a, b, c) => { o.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); };
// n-sided prism round the segment a-b
const segP = function(o, a, b, r0, n, r1){
  n = n || 4; if (r1 === undefined) r1 = r0;
  const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2], L = Math.hypot(dx, dy, dz); if (L < 1e-4) return;
  const d = [dx/L, dy/L, dz/L], up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const u = nrm(cross(d, up)), v = cross(d, u);
  const ring = (p, rr) => { const R = []; for (let i = 0; i < n; i++){ const t = (i + 0.5)/n*TAU, c = Math.cos(t)*rr, s = Math.sin(t)*rr; R.push([p[0]+u[0]*c+v[0]*s, p[1]+u[1]*c+v[1]*s, p[2]+u[2]*c+v[2]*s]); } return R; };
  const A = ring(a, r0), Bq = ring(b, Math.max(r1, 0.001));
  for (let i = 0; i < n; i++){ const j = (i+1) % n; quadP(o, A[i], A[j], Bq[j], Bq[i]); }
};
// tube swept along a circle (centre c, radius R, in the plane of unit vectors e1, e2), ns sides, NS segments (a0..a1)
const ringT = function(o, c, e1, e2, R, rt, NS, ns, a0, a1, ph){
  const n = cross(e1, e2); a0 = a0 || 0; a1 = a1 === undefined ? TAU : a1; ph = ph || 0;
  const P = (a, b) => { const ca = Math.cos(a), sa = Math.sin(a), rr = R + rt*Math.cos(b), h = rt*Math.sin(b); return [c[0] + rr*(ca*e1[0] + sa*e2[0]) + h*n[0], c[1] + rr*(ca*e1[1] + sa*e2[1]) + h*n[1], c[2] + rr*(ca*e1[2] + sa*e2[2]) + h*n[2]]; };
  for (let i = 0; i < NS; i++){ const t0 = a0 + (a1 - a0)*i/NS, t1 = a0 + (a1 - a0)*(i+1)/NS;
    for (let j = 0; j < ns; j++){ const b0 = ph + j/ns*TAU, b1 = ph + (j+1)/ns*TAU; quadP(o, P(t0, b0), P(t1, b0), P(t1, b1), P(t0, b1)); } }
};
const EX = [1, 0, 0], EY = [0, 1, 0], EZ = [0, 0, 1];
// box (w along x, d along z) standing on y, turned ry
const boxP = function(o, w, h, d, x, y, z, ry){
  const c = Math.cos(ry || 0), s = Math.sin(ry || 0), hw = w/2, hd = d/2, y1 = y + h;
  const ax = x - hw*c - hd*s, az = z + hw*s - hd*c, bx = x + hw*c - hd*s, bz = z - hw*s - hd*c, cx = x + hw*c + hd*s, cz = z - hw*s + hd*c, dx = x - hw*c + hd*s, dz = z + hw*s + hd*c;
  o.push(ax, y, az, bx, y, bz, cx, y, cz, ax, y, az, cx, y, cz, dx, y, dz,
    ax, y1, az, dx, y1, dz, cx, y1, cz, ax, y1, az, cx, y1, cz, bx, y1, bz,
    ax, y, az, ax, y1, az, bx, y1, bz, ax, y, az, bx, y1, bz, bx, y, bz,
    bx, y, bz, bx, y1, bz, cx, y1, cz, bx, y, bz, cx, y1, cz, cx, y, cz,
    cx, y, cz, cx, y1, cz, dx, y1, dz, cx, y, cz, dx, y1, dz, dx, y, dz,
    dx, y, dz, dx, y1, dz, ax, y1, az, dx, y, dz, ax, y1, az, ax, y, az);
};
const ICO = (() => { const P = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]], F = [[0,2,4],[4,2,1],[1,2,5],[5,2,0],[4,3,0],[1,3,4],[5,3,1],[0,3,5]], out = [];
  for (const [a, b, d] of F){ const A = P[a], Bv = P[b], D = P[d], ab = nrm(mix(A, Bv, 0.5)), bd = nrm(mix(Bv, D, 0.5)), da = nrm(mix(D, A, 0.5));
    for (const t of [[A, ab, da], [ab, Bv, bd], [da, bd, D], [ab, bd, da]]) for (const v of t) out.push(v[0], v[1], v[2]); } return out; })();
const ico = function(o, c, rx, ry, rz){ rz = rz === undefined ? rx : rz; for (let i = 0; i < ICO.length; i += 3) o.push(c[0] + ICO[i]*rx, c[1] + ICO[i+1]*ry, c[2] + ICO[i+2]*rz); };
// ---- plan helpers (local [x, z] points)
const pip = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0]-a[0])*(z-a[1])/(b[1]-a[1]) + a[0]) c = !c; } return c; };
const edgeN = function(P, i){ const a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], L = Math.hypot(ex, ez) || 1; let nx = ez/L, nz = -ex/L; const mx = (a[0]+b[0])/2, mz = (a[1]+b[1])/2; if (pip(P, mx + nx*0.25, mz + nz*0.25)){ nx = -nx; nz = -nz; } return [nx, nz, L, mx, mz]; };
// vertical bands along the edges of P, `off` outside the wall (negative: inside P, i.e. the courtyard side of a hole)
const edgeBands = function(o, P, y0, y1, off){
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], [nx, nz, L] = edgeN(P, i); if (L < 0.4) continue;
    quadP(o, [a[0]+nx*off, y0, a[1]+nz*off], [b[0]+nx*off, y0, b[1]+nz*off], [b[0]+nx*off, y1, b[1]+nz*off], [a[0]+nx*off, y1, a[1]+nz*off]); }
};
// vertical mullions along the edges of P every sp metres (d < 0: on the inside of P)
const edgeFins = function(o, P, y0, y1, sp, w, d){
  let carry = 0;
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], [nx, nz, L] = edgeN(P, i); if (L < 0.4) continue;
    const ry = Math.atan2(-(b[1]-a[1]), b[0]-a[0]);
    for (let s = carry; s < L; s += sp){ const t = s/L; boxP(o, w, y1 - y0, Math.abs(d), a[0] + (b[0]-a[0])*t + nx*d/2, y0, a[1] + (b[1]-a[1])*t + nz*d/2, ry); }
    carry = (carry - L % sp + sp) % sp; }
};
// miter offset of a simple polygon (d > 0 outward, d < 0 inward)
const offRing = function(P, d){
  const n = P.length; let A2 = 0; for (let i = 0; i < n; i++){ const a = P[i], b = P[(i+1) % n]; A2 += a[0]*b[1] - b[0]*a[1]; }
  const sg = A2 > 0 ? 1 : -1, out = [];
  for (let i = 0; i < n; i++){
    const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i+1) % n];
    let ax = p1[0]-p0[0], az = p1[1]-p0[1], bx = p2[0]-p1[0], bz = p2[1]-p1[1]; const la = Math.hypot(ax, az) || 1, lb = Math.hypot(bx, bz) || 1; ax /= la; az /= la; bx /= lb; bz /= lb;
    const n1 = [sg*az, -sg*ax], n2 = [sg*bz, -sg*bx]; let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
    const k = d/Math.max(0.35, mx*n1[0] + mz*n1[1]); out.push([p1[0] + mx*k, p1[1] + mz*k]);
  }
  return out;
};
// extruded plan with holes (rings of [x, z]), y0 .. y0 + h
const DS = c => typeof c === 'string' ? {c, ds:true} : Object.assign({ds:true}, c);
const LPolyH = function(g, P, holes, y0, h, col){
  const sh = new THREE.Shape(P.map(p => new THREE.Vector2(p[0], -p[1])));
  for (const H of holes || []) sh.holes.push(new THREE.Path(H.map(p => new THREE.Vector2(p[0], -p[1]))));
  const geo = new THREE.ExtrudeGeometry(sh, {depth:h, bevelEnabled:false, curveSegments:1});
  const m = lmAdd(g, geo, DS(col), 0, y0, 0); m.rotation.x = -Math.PI/2; return m;
};
// the extent of polygon P along the vertical line x (min z, max z of the crossings)
const zRange = (P, x) => { let lo = Infinity, hi = -Infinity; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; if ((a[0] - x)*(b[0] - x) > 0 || a[0] === b[0]) continue; const z = a[1] + (b[1] - a[1])*(x - a[0])/(b[0] - a[0]); lo = Math.min(lo, z); hi = Math.max(hi, z); } return [lo, hi]; };
const rayHit = (P, c, d) => { let best = Infinity; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], den = d[0]*ez - d[1]*ex; if (Math.abs(den) < 1e-9) continue;
  const t = ((a[0]-c[0])*ez - (a[1]-c[1])*ex)/den, u = ((a[0]-c[0])*d[1] - (a[1]-c[1])*d[0])/den; if (t > 0 && u >= 0 && u <= 1) best = Math.min(best, t); } return best; };

// ---------------------------------------------------------------------------------------------------------------------
// placement and the real footprints (OSM, lm18/ref_F1.json targets.flyer: [east, north] metres around 1.2894 N, 103.86323 E)
const HE = -11.65, HN = 1.15, ROT = 0.6629;   // hub ground point; the real wheel strip runs 38 deg north of east
const cR = Math.cos(ROT), sR = Math.sin(ROT);
const W = F => { const P = []; for (let i = 0; i < F.length; i += 2){ const de = F[i] - HE, dn = F[i+1] - HN; P.push([de*cR + dn*sR, de*sR - dn*cR]); } return P; };
const L1 = [51.7,16.1,55.9,8.4,57.1,0.7,55.9,-14.7,52.9,-24.2,48.1,-32.5,35.6,-41.4,24.8,-45.0,9.9,-47.4,-8.0,-49.1,-27.1,-49.1,-42.0,-48.0,-52.2,-45.6,-59.3,-40.8,-64.1,-34.9,-65.3,-29.6,-61.7,-12.4,-55.7,-2.9,-46.8,7.8,-30.7,36.8,-22.3,45.1,-14.0,49.9,-3.8,53.4,2.8,54.0,9.9,52.9,17.7,49.3,23.7,44.6,32.6,32.7,48.1,20.8];
const L2 = [-19.9,42.8,-12.2,46.9,-3.2,49.9,2.2,50.5,8.1,49.3,14.7,46.3,20.1,42.2,29.0,30.3,44.5,19.1,51.1,8.4,52.3,-6.4,51.1,-13.0,48.7,-21.3,44.0,-28.4,38.6,-33.1,33.2,-36.7,23.1,-39.7,8.7,-42.0,-8.6,-43.8,-27.7,-43.8,-42.0,-42.6,-51.0,-40.8,-56.9,-36.7,-60.5,-31.9,-61.7,-28.4,-58.1,-13.6,-52.8,-4.7,-43.8,6.0,-36.6,16.7,-27.1,35.1];
const L3 = [-17.5,40.4,-11.6,44.0,-3.8,46.3,0.4,46.9,5.1,45.7,9.9,43.4,14.1,40.4,23.1,29.1,37.4,18.5,42.2,10.2,43.4,-2.3,40.4,-14.7,36.2,-20.1,32.0,-24.2,27.2,-27.2,18.9,-29.6,-9.8,-33.1,-40.2,-32.5,-47.4,-30.8,-51.6,-27.8,-54.0,-24.8,-54.6,-22.5,-52.2,-10.0,-47.4,-2.9,-39.0,6.6,-31.3,19.6,-24.1,33.9];
const PADS = [[48.7,43.4,44.0,49.3,30.0,46.0,38.0,34.0], [-71.9,-40.8,-67.1,-47.4,-55.0,-46.5,-62.0,-36.0]];
// ---- the wheel (metres; wheel frame: origin at the hub centre, x-y = wheel plane, z = axle)
const CY = 90;            // hub height: 165 m top - 75 m (150 m wheel)
const RR = 69.4;          // rim chord centre-line radius (two 864 mm CHS chords side by side = the 2-D ladder truss)
const RT = 0.432;         // chord tube radius
const ZC = 3.2;           // chords at z = +-ZC
const RC = 72.95;         // capsule axis radius (outboard of the rim): capsule top 90 + 72.95 + 2.05 = 165 m
const CAPR = 2.05, CAPL = 3.3;   // capsule radius, half length (cylinder; shallow domed glass ends beyond)
const ZR = 2.7, RG = 2.34;       // the capsule bearing rings (collars) at z = +-ZR, ring radius
const NCAP = 28, NSEG = 168;     // capsules / rim nodes, rim segments
const ZH = 8.0, RH = 4.0;        // hub flanges (spoke anchors) at z = +-ZH, radius
const PERIOD = 330;              // seconds per revolution (real wheel ~30 min; sped up ~5.5x so the motion reads)
const DIR = 1;                   // +1: counter-clockwise about local +z = clockwise from Marina Centre (the post-2008 direction)
const flyAngle = () => DIR*((Date.now() % (PERIOD*1000))/(PERIOD*1000))*TAU;

// colours (day) of the moving part
const C_ST = '#eceef0', C_ST2 = '#dfe3e6', C_LED = '#c9ced3', C_CAB = '#89939a', C_ACC = '#b9c0c6';
const C_GL1 = '#b5ccd8', C_GL2 = '#7d9cab', C_GL3 = '#8fb0bf', C_BEL = '#e3e6e8';
// light classes (aL attribute): 0 floodlit steel, 1 LED band, 2 spoke cable, 3 capsule glass (lit cabin), 4 capsule frame
// (LED-washed), 5 accent lamp, 6 unlit
let WHEEL_CACHE = null, CAP_CACHE = null;
function wheelBatches(){
  const B = mkB(), rp = (a, r, z) => [Math.cos(a)*r, Math.sin(a)*r, z];
  const ST = B.p(C_ST, 0), ST2 = B.p(C_ST2, 0);
  // the ladder truss: two chords, an LED band on the outer face of each, rungs (heavy at the capsule nodes), diagonals
  for (const s of [-1, 1]){ ringT(B.p(C_ST, 4), [0, 0, s*ZC], EX, EY, RR, RT, NSEG, 8);
    ringT(B.p(C_LED, 1), [0, 0, s*(ZC + RT + 0.16)], EX, EY, RR, 0.22, NSEG, 4, 0, TAU, PI/4); }
  const bay = TAU/NCAP;
  for (let k = 0; k < NCAP; k++){ const a = k*bay;
    for (let j = 0; j < 4; j++){ const aj = a + j*bay/4, an = a + (j+1)*bay/4;
      segP(j ? ST2 : ST, rp(aj, RR, -ZC), rp(aj, RR, ZC), j ? 0.24 : 0.36, j ? 6 : 8);
      const sd = (j % 2) ? 1 : -1; segP(ST2, rp(aj, RR, sd*ZC), rp(an, RR, -sd*ZC), 0.19, 6); }
    // node castings on both chords (spoke anchors + capsule fork seat)
    for (const s of [-1, 1]) segP(ST, rp(a, RR - 0.95, s*ZC), rp(a, RR + 0.7, s*ZC), 0.55, 6);
  }
  // capsule forks: per node and side, a bearing ring (outer race of the capsule collar) and three arms back to the chord node
  for (let k = 0; k < NCAP; k++){ const a = k*bay, ca = Math.cos(a), sa = Math.sin(a), rad = [ca, sa, 0], tan = [-sa, ca, 0];
    for (const s of [-1, 1]){
      const C = [ca*RC, sa*RC, s*ZR];
      ringT(ST, C, EX, EY, RG, 0.19, 20, 4, 0, TAU, PI/4);
      const node = [ca*(RR + RT), sa*(RR + RT), s*ZC];
      for (const q of [-1, 0, 1]){ const b = PI + q*0.95, end = [C[0] + RG*(Math.cos(b)*rad[0] + Math.sin(b)*tan[0]), C[1] + RG*(Math.cos(b)*rad[1] + Math.sin(b)*tan[1]), s*ZR];
        const st = [node[0] + tan[0]*q*0.8, node[1] + tan[1]*q*0.8, node[2]]; segP(ST2, st, end, q ? 0.17 : 0.22, 6); }
    }
  }
  // spokes: 112 cables, 4 per node — each hub flange to its own chord, and one crossed to the opposite chord (offset on the hub)
  const CAB = B.p(C_CAB, 2), ACC = B.p(C_ACC, 5);
  for (let k = 0; k < NCAP; k++){ const a = k*bay;
    for (const [sh, sr, da] of [[1, 1, 0], [-1, -1, 0], [1, -1, 0.045], [-1, 1, -0.045]]){
      const h = rp(a + da, RH, sh*ZH), r = rp(a, RR - 0.6, sr*ZC), d = [r[0]-h[0], r[1]-h[1], r[2]-h[2]], L = Math.hypot(d[0], d[1], d[2]);
      const m = [r[0] - d[0]/L*1.6, r[1] - d[1]/L*1.6, r[2] - d[2]/L*1.6];
      segP(CAB, h, m, 0.11, 4); segP(ACC, m, r, 0.17, 4);         // the cable, and the LED accent at its rim end
    }
  }
  // the hub: a drum round the spindle with two wide flanges (spoke anchor rings), stiffening ribs, an LED ring on each flange
  { const n = 28;
    for (let i = 0; i < n; i++){ const a0 = i/n*TAU, a1 = (i+1)/n*TAU;
      quadP(ST, rp(a0, 2.3, -8.7), rp(a1, 2.3, -8.7), rp(a1, 2.3, 8.7), rp(a0, 2.3, 8.7));
      for (const s of [-1, 1]){ const z0 = s*(ZH - 0.35), z1 = s*(ZH + 0.35);
        quadP(ST, rp(a0, 4.5, z0), rp(a1, 4.5, z0), rp(a1, 4.5, z1), rp(a0, 4.5, z1));
        for (const z of [z0, z1]) quadP(ST, rp(a0, 1.35, z), rp(a1, 1.35, z), rp(a1, 4.5, z), rp(a0, 4.5, z));
        quadP(ST, rp(a0, 1.35, s*8.7), rp(a1, 1.35, s*8.7), rp(a1, 2.3, s*8.7), rp(a0, 2.3, s*8.7)); }
    }
    for (const s of [-1, 1]){ ringT(B.p(C_LED, 1), [0, 0, s*(ZH + 0.4)], EX, EY, 4.5, 0.12, 40, 4);
      for (let i = 0; i < 14; i++){ const a = (i + 0.5)/14*TAU; triP(ST2, rp(a - 0.05, 2.3, s*2.5), rp(a, 4.4, s*(ZH - 0.4)), rp(a + 0.05, 2.3, s*(ZH - 0.4))); } }
  }
  return B.all();
}
// one capsule, level, axis along z, centred on its axis point
function capsuleBatches(){
  const B = mkB(), NA = 28, ZE = CAPL, R = CAPR;
  const P = (a, r, z) => [Math.cos(a)*r, Math.sin(a)*r, z];
  const belly = a => { const d = Math.abs(((a + PI/2) % TAU + TAU + PI) % TAU - PI); return d < 0.86; };   // lower 100 deg: floor + air-con, opaque
  for (let i = 0; i < NA; i++){ const a0 = i/NA*TAU, a1 = (i+1)/NA*TAU, am = (a0 + a1)/2, s = Math.sin(am);
    const o = belly(am) ? B.p(C_BEL, 4) : s > 0.55 ? B.p(C_GL1, 3) : B.p(C_GL2, 3);
    quadP(o, P(a0, R, -ZE), P(a1, R, -ZE), P(a1, R, ZE), P(a0, R, ZE));
    // shallow domed glass ends
    for (const e of [-1, 1]){ const rr = [1, 0.78, 0.45, 0], dz = [0, 0.2, 0.33, 0.37], oe = belly(am) ? B.p(C_BEL, 4) : B.p(C_GL3, 3);
      for (let q = 0; q < 3; q++){ const A = P(a0, R*rr[q], e*(ZE + dz[q])), Bq = P(a1, R*rr[q], e*(ZE + dz[q])), C = P(a1, R*rr[q+1], e*(ZE + dz[q+1])), D = P(a0, R*rr[q+1], e*(ZE + dz[q+1]));
        if (q === 2) triP(oe, A, Bq, C); else quadP(oe, A, Bq, C, D); } }
  }
  const F = B.p(C_ST, 4);
  // end frames, two intermediate frame rings, longitudinal mullions, the sill lines, door frames in the ends
  for (const z of [-ZE, ZE]) ringT(F, [0, 0, z], EX, EY, R + 0.02, 0.14, NA, 4, 0, TAU, PI/4);
  for (const z of [-1.1, 1.1]) ringT(F, [0, 0, z], EX, EY, R + 0.02, 0.06, NA, 4, 0, TAU, PI/4);
  for (const a of [PI/2, PI/2 + 0.75, PI/2 - 0.75, PI/2 + 1.5, PI/2 - 1.5, PI/2 + 2.3, PI/2 - 2.3]){ const r = R + 0.05, w = a === PI/2 ? 0.1 : 0.06;
    segP(F, P(a, r, -ZE), P(a, r, ZE), w, 4); }
  for (const e of [-1, 1]){ for (const x of [-0.62, 0.62]) segP(F, [x, -1.62, e*(ZE + 0.22)], [x, 1.25, e*(ZE + 0.33)], 0.05, 4);
    segP(F, [-0.62, 1.25, e*(ZE + 0.33)], [0.62, 1.25, e*(ZE + 0.33)], 0.05, 4); }
  return B.all();
}

// ---- the moving part: geometry (merged batches -> position, normal, colour, aL), materials, rig
function batchGeo(list, bake){
  let n = 0; for (const e of list) n += e.a.length/3;
  const pos = new Float32Array(n*3), nor = new Float32Array(n*3), col = new Float32Array(n*3), al = new Float32Array(n), c = new THREE.Color();
  let v = 0;
  for (const e of list){ const A = e.a; c.set(e.col);
    for (let i = 0; i < A.length; i += 9){
      const ux = A[i+3]-A[i], uy = A[i+4]-A[i+1], uz = A[i+5]-A[i+2], wx = A[i+6]-A[i], wy = A[i+7]-A[i+1], wz = A[i+8]-A[i+2];
      let nx = uy*wz - uz*wy, ny = uz*wx - ux*wz, nz = ux*wy - uy*wx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      for (let k = 0; k < 3; k++){ pos[v*3] = A[i+k*3]; pos[v*3+1] = A[i+k*3+1]; pos[v*3+2] = A[i+k*3+2]; nor[v*3] = nx; nor[v*3+1] = ny; nor[v*3+2] = nz; col[v*3] = c.r; col[v*3+1] = c.g; col[v*3+2] = c.b; al[v] = e.L; v++; }
    } }
  return {pos, nor, col, al, n};
}
function mkGeo(D){
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(D.pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(D.nor, 3));
  g.setAttribute('color', new THREE.BufferAttribute(D.col, 3)); g.setAttribute('aL', new THREE.BufferAttribute(D.al, 1));
  return g;
}
// shared uniforms of all Flyer rigs (the LED programme is the same for everyone)
const FU = {t:{value:0}, th:{value:0}, w:{value:null}};
const FLY_GLSL_HEAD = `
uniform float uNight; uniform float uDim; uniform float uShow; uniform float uFT; uniform float uTh; uniform vec4 uW;
varying float vL; varying vec3 vQ; varying vec3 vC;
vec3 flyHue(float h){ return clamp(abs(mod(h*6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }
vec3 flyLed(float a, float rf){
  float t = uFT, u = a*0.15915494;
  vec3 c0 = mix(vec3(1.0), flyHue(0.6 + 0.09*sin(t*0.05) + 0.04*sin(u*6.2832 + t*0.11)), 0.72);
  vec3 c1 = mix(vec3(1.0), flyHue(fract(u - t*0.021)), 0.82);
  float pu = pow(0.5 + 0.5*sin((rf*4.0 - t*0.55)*6.2832), 5.0);
  vec3 c2 = mix(vec3(1.0), flyHue(fract(0.52 + t*0.009)), 0.78)*(0.28 + 0.95*pu);
  float sct = step(0.5, fract(u*7.0 + t*0.035));
  float h3 = fract(0.83 + t*0.006);
  vec3 c3 = mix(mix(vec3(1.0), flyHue(h3), 0.8), mix(vec3(1.0), flyHue(fract(h3 + 0.5)), 0.7), sct);
  return (c0*uW.x + c1*uW.y + c2*uW.z + c3*uW.w)*(0.85 + 0.3*uShow);
}`;
const FLY_GLSL_EM = `
{
  float fa = atan(vQ.y, vQ.x)` + ` - uTh*CAPS_TH;
  float rf = CAPS_RF;
  vec3 led = flyLed(fa, rf);
  vec3 em = vec3(0.0);
  if (vL < 0.5) em = diffuseColor.rgb*vec3(0.82, 0.88, 1.0)*0.26 + led*0.05;
  else if (vL < 1.5) em = led*1.55;
  else if (vL < 2.5) em = led*(0.12 + 0.95*rf*rf);
  else if (vL < 3.5) em = vec3(1.0, 0.94, 0.84)*(0.3 + 0.62*smoothstep(-1.0, 1.9, vC.y)) + led*0.2;
  else if (vL < 4.5) em = led*0.38 + diffuseColor.rgb*0.1;
  else if (vL < 5.5) em = led*2.1;
  else em = diffuseColor.rgb*0.9;
  totalEmissiveRadiance += em*uNight*uDim;
}`;
function flyMat(caps){
  const m = new THREE.MeshLambertMaterial({color:0xffffff, vertexColors:true, side:THREE.DoubleSide});
  m.onBeforeCompile = sh => {
    sh.uniforms.uNight = NIGHT.uNight; sh.uniforms.uDim = (typeof LMS !== 'undefined' && LMS.dim) || {value:1}; sh.uniforms.uShow = (typeof LMS !== 'undefined' && LMS.show) || {value:0};
    sh.uniforms.uFT = FU.t; sh.uniforms.uTh = FU.th; sh.uniforms.uW = FU.w;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aL;\nvarying float vL;\nvarying vec3 vQ;\nvarying vec3 vC;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvL = aL;\nvC = position;\n' + (caps ? 'vQ = instanceMatrix[3].xyz;' : 'vQ = transformed;'));
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + FLY_GLSL_HEAD)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + FLY_GLSL_EM.replace('CAPS_TH', caps ? '1.0' : '0.0').replace('CAPS_RF', caps ? '1.0' : 'clamp(length(vQ.xy)/' + RR.toFixed(1) + ', 0.0, 1.0)'));
  };
  m.customProgramCacheKey = () => 'sgflyer-v2-' + (caps ? 'caps' : 'wheel');
  return m;
}
const RIGS = new Set();
let FLY_STATS = {frames:0, ms:0, built:0, disposed:0};
function makeRig(){
  if (!WHEEL_CACHE) WHEEL_CACHE = batchGeo(wheelBatches());
  if (!CAP_CACHE) CAP_CACHE = batchGeo(capsuleBatches());
  const root = new THREE.Group(); root.name = 'sgFlyerWheel'; root.position.set(0, CY, 0);
  const mw = flyMat(false), mc = flyMat(true);
  const wheel = new THREE.Mesh(mkGeo(WHEEL_CACHE), mw); wheel.castShadow = true; wheel.receiveShadow = true;
  const gc = mkGeo(CAP_CACHE); gc.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), RC + CAPR + 4);
  const caps = new THREE.InstancedMesh(gc, mc, NCAP); caps.castShadow = true; caps.receiveShadow = true;
  if (caps.instanceMatrix.setUsage) caps.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const M = new THREE.Matrix4(); for (let k = 0; k < NCAP; k++){ M.makeTranslation(Math.cos(k/NCAP*TAU)*RC, Math.sin(k/NCAP*TAU)*RC, 0); caps.setMatrixAt(k, M); }
  root.add(wheel, caps);
  FLY_STATS.built++;
  return {root, wheel, caps, mats:[mw, mc], g:null, on:false, wait:0, th:-1};
}
function rigPose(R, th){
  R.wheel.rotation.z = th;
  const A = R.caps.instanceMatrix.array;
  for (let k = 0; k < NCAP; k++){ const a = k/NCAP*TAU + th; A[k*16 + 12] = Math.cos(a)*RC; A[k*16 + 13] = Math.sin(a)*RC; }
  R.caps.instanceMatrix.needsUpdate = true; R.th = th;
}
function rigDispose(R){
  if (R.root.parent) R.root.parent.remove(R.root);
  R.wheel.geometry.dispose(); R.caps.geometry.dispose(); if (R.caps.dispose) R.caps.dispose();
  for (const m of R.mats) m.dispose();
  FLY_STATS.disposed++;
}
// the static wheel (offline tools / pages without the app hooks): baked at angle th, merged by colour like any landmark
function bakeWheel(g, th){
  const c = Math.cos(th), s = Math.sin(th), Bk = mkB();
  for (const e of wheelBatches()){ const o = Bk.p(e.col, 0), A = e.a; for (let i = 0; i < A.length; i += 3) o.push(A[i]*c - A[i+1]*s, CY + A[i]*s + A[i+1]*c, A[i+2]); }
  const capL = capsuleBatches();
  for (let k = 0; k < NCAP; k++){ const a = k/NCAP*TAU + th, px = Math.cos(a)*RC, py = CY + Math.sin(a)*RC;
    for (const e of capL){ const o = Bk.p(e.col, 0), A = e.a; for (let i = 0; i < A.length; i += 3) o.push(A[i] + px, A[i+1] + py, A[i+2]); } }
  Bk.flush(g);
}
const flyLive = () => typeof HOOKS !== 'undefined' && HOOKS && HOOKS.frame && typeof lmMeshes !== 'undefined' && typeof NIGHT !== 'undefined';

// ---------------------------------------------------------------------------------------------------------------------
LANDMARKS.flyer = {zh:'新加坡摩天观景轮', en:'Singapore Flyer', cat:'new', r:86, h:165, lt:{m:0, c:'#dde6ff', k:0.42, e:0.45, anim:'none'}, build(){
  const g = new THREE.Group(), B = mkB(), r = LMCTX.rng;
  const GL = {c:'#7c97a2', glow:'#ffcf94', gk:0.48, lk:0.12}, SLAB = '#eef0ee', ROOF = '#c6cac8', GRN = '#64904f', LEAF = '#4b7a37', LEAF2 = '#2f5f34', TRUNK = '#6a5a48';
  const CONC = '#cfcbc3', ST = '#e6e9eb', CABLE = '#8b9399', PAVE = '#cbc4b4', WATER = {c:'#3e7f8c', glow:'#2a6f86', gk:0.25}, ROCK = '#837a6c', DECK = '#a9aba8', CANOPY = {c:'#d5dfe4', glow:'#fff0d4', gk:0.55};
  const P1 = W(L1), P2 = W(L2), P3 = W(L3);
  // ---- the courtyard (the doughnut's hole): the top level inset 9 m, limited to a lens along the wheel; open to the sky
  const COUR = (() => { const IN = offRing(P3, -9), c0 = [-2, 5], out = [], A = 40, Bz = 24, ex = 2.6;
    for (let i = 0; i < 72; i++){ const a = i/72*TAU, d = [Math.cos(a), Math.sin(a)], r1 = rayHit(IN, c0, d), r2 = Math.pow(Math.pow(Math.abs(d[0]/A), ex) + Math.pow(Math.abs(d[1]/Bz), ex), -1/ex);
      const rr = Math.min(r1, r2); out.push([c0[0] + d[0]*rr, c0[1] + d[1]*rr]); }
    return out; })();
  // ---- terminal: three stepped glass storeys round the courtyard, white slab edges and mullions on both faces, planted terraces
  const lv = [[P1, -5, 7], [P2, 7, 14], [P3, 14, 21]];
  lv.forEach(([P, y0, y1], i) => {
    LPolyH(g, P, [COUR], y0, y1 - 0.9 - y0, GL);
    LPolyH(g, P, [COUR], y1 - 0.9, 0.9, ROOF);
    for (const [Q, s] of [[P, 1], [COUR, -1]]){
      edgeBands(B.p(SLAB), Q, y1 - 0.95, y1 + 0.3, s*0.28);
      edgeFins(B.p(SLAB), Q, (i ? y0 : 0.2), y1 - 0.95, 2.4, 0.16, s*0.3);
      if (!i) edgeBands(B.p(CONC), Q, -5, 0.25, s*0.06);
      if (i) edgeBands(B.p(SLAB), Q, y0, y0 + 0.5, s*0.2);
    }
    // a slim eave round the outer edge of each level
    const E = offRing(P, i ? 1.3 : 0.6); for (let k = 0; k < P.length; k++){ const a = P[k], b = P[(k+1) % P.length], c = E[(k+1) % P.length], d = E[k];
      quadP(B.p(SLAB), [a[0], y1 + 0.3, a[1]], [b[0], y1 + 0.3, b[1]], [c[0], y1 + 0.3, c[1]], [d[0], y1 + 0.3, d[1]]);
      quadP(B.p(SLAB), [d[0], y1 - 0.05, d[1]], [c[0], y1 - 0.05, c[1]], [c[0], y1 + 0.3, c[1]], [d[0], y1 + 0.3, d[1]]); }
    // planters along the terrace this level forms where the next one steps back
    if (i < 2){ const Q = lv[i+1][0]; for (let k = 0; k < P.length; k++){ const a = P[k], b = P[(k+1) % P.length], m = [(a[0]+b[0])/2, (a[1]+b[1])/2]; if (pip(Q, m[0], m[1])) continue;
      const [nx, nz, L] = edgeN(P, k); if (L < 3) continue; const ux = (b[0]-a[0])/L, uz = (b[1]-a[1])/L, cx = m[0] - nx*1.9, cz = m[1] - nz*1.9;
      boxP(B.p(GRN), L*0.92, 0.75, 2.2, cx, y1 + 0.3, cz, Math.atan2(-uz, ux));
      for (let d = 1.5; d < L - 0.8; d += 2.6) ico(B.p(LEAF), [a[0] + ux*d - nx*1.9, y1 + 1.35, a[1] + uz*d - nz*1.9], 0.95 + r()*0.4, 0.7);
      for (let d = 3; d < L - 2; d += 9) { const x = a[0] + ux*d - nx*1.9, z = a[1] + uz*d - nz*1.9; segP(B.p(TRUNK), [x, y1 + 1, z], [x, y1 + 3.4, z], 0.16, 5); ico(B.p(LEAF2), [x, y1 + 4.2, z], 1.7 + r()*0.5, 1.2); } } }
  });
  // roof of the top level: planted band along the courtyard edge, a ring of skylight strips, a walkway inside the parapet
  { const In = offRing(COUR, 3.2), Mid = offRing(COUR, 7.5), Mid2 = offRing(COUR, 9.0), Pw = offRing(P3, -1.6);
    for (let k = 0; k < COUR.length; k++){ const k1 = (k+1) % COUR.length, a = COUR[k], b = COUR[k1];
      quadP(B.p(GRN), [a[0], 21.35, a[1]], [b[0], 21.35, b[1]], [In[k1][0], 21.35, In[k1][1]], [In[k][0], 21.35, In[k][1]]);
      if (k % 3 !== 2 && pip(P3, Mid[k][0], Mid[k][1]) && pip(P3, Mid2[k1][0], Mid2[k1][1])) quadP(B.p(GL), [Mid[k][0], 21.4, Mid[k][1]], [Mid[k1][0], 21.4, Mid[k1][1]], [Mid2[k1][0], 21.4, Mid2[k1][1]], [Mid2[k][0], 21.4, Mid2[k][1]]); }
    for (let k = 0; k < P3.length; k++){ const k1 = (k+1) % P3.length, a = P3[k], b = P3[k1]; quadP(B.p(PAVE), [a[0], 21.33, a[1]], [b[0], 21.33, b[1]], [Pw[k1][0], 21.33, Pw[k1][1]], [Pw[k][0], 21.33, Pw[k][1]]); } }
  // roof plant on the top level (low boxes, kept away from the courtyard edge)
  for (const [x, z, w, d] of [[-30, -18, 7, 4], [22, -22, 8, 4.5], [30, 30, 6, 6], [-14, 34, 7, 4]]) if (pip(P3, x, z) && !pip(offRing(COUR, 6), x, z)) boxP(B.p(ROOF), w, 1.6, d, x, 21.3, z, 0.2);
  // the wheel strip's paved ends beyond the terminal
  for (const F of PADS) LPolyH(g, W(F), [], -0.6, 0.75, PAVE);
  // ---- courtyard: the tropical rainforest garden with its water features, under the wheel
  LPolyH(g, COUR, [], -5, 5.15, GRN);
  const avoid = [];   // [x, z, r] kept clear of trees
  // pylons: two 2.85 m tubes either side of the wheel, 2 deg inward lean, founded in the courtyard; bearing housings at the top
  for (const s of [-1, 1]){
    const zt = s*12.0, zb = s*(12.0 + 93*Math.tan(2*PI/180));
    LBeam(g, [0, -4, zb], [0, CY - 1.6, zt], 1.425, DS(ST), 20);
    LBox(g, 7, 1.4, 7, 0, -0.6, zb, DS(CONC));
    LBeam(g, [0, CY, s*10.45], [0, CY, s*13.2], 2.05, DS(ST), 20);      // bearing housing (spindle end)
    LBox(g, 4.6, 2.2, 3.0, 0, CY - 3.4, s*11.9, DS(ST));
    segP(B.p(ST), [0, CY - 2.0, s*10.7], [0, CY - 2.0, s*13.1], 2.15, 8);
    avoid.push([0, zb, 5]);
  }
  LBeam(g, [0, CY, -12.62], [0, CY, 12.62], 1.3, DS(ST), 18);               // spindle (2.6 m x 25.25 m)
  // four stays (six locked-coil cables each) from the pylon heads to anchor blocks in the courtyard
  for (const sx of [-1, 1]) for (const sz of [-1, 1]){
    const x = sx*22, zr = zRange(COUR, x), za = sz > 0 ? Math.min(sz*17, zr[1] - 3) : Math.max(sz*17, zr[0] + 3);
    const top = [sx*1.2, CY - 1.0, sz*12.9], bot = [x, 1.6, za];
    for (let q = 0; q < 6; q++){ const ox = ((q % 2) - 0.5)*0.32, oz = (Math.floor(q/2) - 1)*0.32; segP(B.p(CABLE), [top[0] + ox, top[1], top[2] + oz], [bot[0] + ox, bot[1], bot[2] + oz], 0.09, 4); }
    boxP(B.p(CONC), 4.2, 2.0, 4.2, x, -0.4, za, 0); segP(B.p(ST), [x, 1.4, za], [bot[0] - sx*0.8, 2.6, za], 0.5, 6);
    avoid.push([x, za, 3.5]);
  }
  // ---- boarding: decks at the third storey either side of the wheel bottom on steel towers, canopies, bridges to the terminal
  for (const s of [-1, 1]){
    const z0 = s*4.4, z1 = s*10.8, zm = (z0 + z1)/2;
    boxP(B.p(DECK), 32, 0.6, 6.4, 0, 14.4, zm, 0);
    for (const x of [-10, 10]){ for (const dx of [-1.2, 1.2]) for (const dz of [-1.2, 1.2]) segP(B.p(ST), [x + dx, 0, s*7.6 + dz], [x + dx, 14.4, s*7.6 + dz], 0.2, 6);
      for (let y = 0; y < 14; y += 3.6) for (const [ax, az, bx, bz] of [[-1.2, -1.2, 1.2, -1.2], [-1.2, 1.2, 1.2, 1.2], [-1.2, -1.2, -1.2, 1.2], [1.2, -1.2, 1.2, 1.2]])
        segP(B.p(ST), [x + ax, y, s*7.6 + az], [x + bx, y + 3.6, s*7.6 + bz], 0.07, 4);
      avoid.push([x, s*7.6, 3]); }
    for (let x = -16; x <= 16; x += 2) segP(B.p(SLAB), [x, 15, z1 - s*0.15], [x, 16.1, z1 - s*0.15], 0.04, 4);
    segP(B.p(SLAB), [-16, 16.1, z1 - s*0.15], [16, 16.1, z1 - s*0.15], 0.06, 4);
    // the drive deck: a curved composite deck following the rim's lowest arc on each side (it roofs the boarding deck; lit
    // soffit at night), on a triangular CHS truss and posts; drive bogies on its inner edge with tyres against the rim chords
    { const yb = x => CY - Math.sqrt(RR*RR - x*x) - RT - 0.95, zi = s*4.3, zo = s*9.6, N = 20, X0 = -20, X1 = 20, D = B.p(CANOPY), T = B.p(ST);
      for (let k = 0; k < N; k++){ const xa = X0 + (X1 - X0)*k/N, xb = X0 + (X1 - X0)*(k+1)/N, ya = yb(xa), yb2 = yb(xb);
        quadP(D, [xa, ya + 0.55, zi], [xb, yb2 + 0.55, zi], [xb, yb2 + 0.55, zo], [xa, ya + 0.55, zo]);
        quadP(D, [xa, ya, zi], [xb, yb2, zi], [xb, yb2, zo], [xa, ya, zo]);
        for (const z of [zi, zo]) quadP(D, [xa, ya, z], [xb, yb2, z], [xb, yb2 + 0.55, z], [xa, ya + 0.55, z]);
        // truss: two top chords under the deck edges, a bottom chord 2.2 m lower, diagonals
        const zb = s*7.0; segP(T, [xa, ya - 2.2, zb], [xb, yb2 - 2.2, zb], 0.17, 6);
        for (const z of [s*4.7, s*9.2]){ segP(T, [xa, ya - 0.1, z], [xb, yb2 - 0.1, z], 0.13, 5); segP(T, [xa, ya - 0.1, z], [xb, yb2 - 2.2, zb], 0.08, 4); } }
      for (const x of [X0, X1]){ const y = yb(x); quadP(D, [x, y, zi], [x, y, zo], [x, y + 0.55, zo], [x, y + 0.55, zi]); }
      for (const x of [-15, -5, 5, 15]) segP(T, [x, 15, s*9.2], [x, yb(x) - 0.1, s*9.2], 0.28, 8);
      for (const x of [-12.5, -4.2, 4.2, 12.5]){ const y = yb(x) + 0.55, a = Math.asin(x/RR);
        boxP(B.p(DECK), 2.6, 1.15, 1.1, x, y, s*5.0, a);
        for (const dx of [-0.75, 0.75]){ const xx = x + dx*Math.cos(a), yy = y + 0.7 + dx*Math.sin(a); segP(B.p(CABLE), [xx, yy - 0.42, s*(ZC + RT + 0.5)], [xx, yy + 0.42, s*(ZC + RT + 0.5)], 0.5, 8); } } }
    // two boarding bridges per side across the courtyard to the terminal's third storey
    for (const x of [-9, 9]){ const zr = zRange(COUR, x), ze = s > 0 ? zr[1] + 1.5 : zr[0] - 1.5, zc = (z1 + ze)/2, len = Math.abs(ze - z1);
      boxP(B.p(DECK), 3.4, 0.55, len, x, 14.45, zc, 0);
      for (const dx of [-1.7, 1.7]) boxP(B.p(SLAB), 0.14, 1.05, len, x + dx, 15, zc, 0);
      boxP(B.p(CANOPY), 4.0, 0.25, len, x, 18.3, zc, 0);
      for (const dx of [-1.8, 1.8]) for (let k = 0; k <= 2; k++){ const z = z1 + (ze - z1)*(0.1 + 0.4*k); segP(B.p(ST), [x + dx, 15, z], [x + dx, 18.3, z], 0.1, 5); } }
  }
  // the rainforest: tall canopy trees, palms, tree ferns, a pond with a rock waterfall, a boardwalk loop
  const pondC = [-17, 9];
  { const PD = []; for (let i = 0; i < 20; i++){ const a = i/20*TAU, rr = 1 + 0.18*Math.sin(a*3 + 1) + 0.1*Math.sin(a*5); PD.push([pondC[0] + Math.cos(a)*7.5*rr, pondC[1] + Math.sin(a)*4.6*rr]); }
    LPolyH(g, PD, [], 0.05, 0.25, WATER);
    for (let i = 0; i < PD.length; i += 2){ const p = PD[i]; ico(B.p(ROCK), [p[0], 0.4, p[1]], 0.8 + r()*0.6, 0.55); }
    // the waterfall: a rock wall with water sheets
    const wf = [pondC[0] - 6.5, pondC[1] - 1.5];
    for (let k = 0; k < 6; k++) ico(B.p(ROCK), [wf[0] + (r() - 0.5)*3.5, 1.2 + k*0.75, wf[1] + (r() - 0.5)*2.6], 2.2 - k*0.22, 1.4);
    for (const dz of [-0.8, 0.9]) quadP(B.p(WATER), [wf[0] + 1.6, 0.4, wf[1] + dz - 0.6], [wf[0] + 1.6, 0.4, wf[1] + dz + 0.6], [wf[0] + 0.9, 5.2, wf[1] + dz + 0.5], [wf[0] + 0.9, 5.2, wf[1] + dz - 0.5]);
    avoid.push([pondC[0], pondC[1], 8.5], [wf[0], wf[1], 3.5]);
    // boardwalk: a loop round the pond and out to the bridges' feet
    const BW = []; for (let i = 0; i <= 40; i++){ const a = i/40*TAU; BW.push([pondC[0] + Math.cos(a)*11, pondC[1] + Math.sin(a)*7.5]); }
    for (let i = 0; i < 40; i++){ const a = BW[i], b = BW[i+1], dx = b[0]-a[0], dz = b[1]-a[1], L = Math.hypot(dx, dz), nx = -dz/L*1.1, nz = dx/L*1.1;
      if (!pip(COUR, a[0], a[1])) continue; quadP(B.p(PAVE), [a[0]+nx, 0.32, a[1]+nz], [b[0]+nx, 0.32, b[1]+nz], [b[0]-nx, 0.32, b[1]-nz], [a[0]-nx, 0.32, a[1]-nz]); }
  }
  const hMax = (x, z) => { let m = 30; if (Math.abs(z) < 12.5 && Math.abs(x) < 17.5) m = 12.6;
    if (Math.abs(z) < 6) m = Math.min(m, CY - Math.sqrt(Math.max(0, 76*76 - x*x)) - 1.2);
    for (const bx of [-9, 9]) if (Math.abs(x - bx) < 3.6 && Math.abs(z) > 10) m = Math.min(m, 13.2);
    return m; };
  { const ok = (x, z, m) => { if (!pip(COUR, x, z)) return false; for (const [ax, az, ar] of avoid) if (Math.hypot(x - ax, z - az) < ar + m) return false;
      for (let i = 0; i < COUR.length; i += 3){ const p = COUR[i]; if (Math.hypot(x - p[0], z - p[1]) < m + 0.6) return false; } return true; };
    let placed = 0;
    for (let t = 0; t < 700 && placed < 58; t++){ const x = -40 + r()*76, z = -20 + r()*48, kind = r();
      if (kind < 0.55){ const s = 0.85 + r()*0.55, R = 2.6*s; if (!ok(x, z, R*0.7)) continue;
        const h = Math.min(6 + r()*5*s, hMax(x, z) - R); if (h < 3) continue; segP(B.p(TRUNK), [x, 0.2, z], [x + (r() - 0.5)*0.8, h, z + (r() - 0.5)*0.8], 0.28*s, 5, 0.2*s);
        ico(B.p(r() < 0.5 ? LEAF : LEAF2), [x, h + R*0.35, z], R, R*0.62); ico(B.p(LEAF), [x + R*0.45, h - 0.4, z - R*0.3], R*0.6, R*0.45); placed++; }
      else if (kind < 0.78){ if (!ok(x, z, 2)) continue; const h = Math.min(7 + r()*5, hMax(x, z) - 0.8); if (h < 4) continue; const lean = (r() - 0.5)*0.5, la = r()*TAU, top = [x + Math.cos(la)*lean*h*0.25, h, z + Math.sin(la)*lean*h*0.25];
        segP(B.p(TRUNK), [x, 0.2, z], top, 0.25, 5, 0.18);
        const o = B.p(LEAF2); for (let i = 0; i < 8; i++){ const a = i/8*TAU + r(), L = 3 + r()*1.4, ca = Math.cos(a), sa = Math.sin(a), m = [top[0] + ca*L*0.55, top[1] + 0.5, top[2] + sa*L*0.55], e = [top[0] + ca*L, top[1] - 1.2, top[2] + sa*L], w = 0.6;
          triP(o, top, [m[0] - sa*w, m[1], m[2] + ca*w], e); triP(o, top, e, [m[0] + sa*w, m[1], m[2] - ca*w]); } placed++; }
      else { if (!ok(x, z, 1.4)) continue; const h = 2 + r()*1.6; segP(B.p(TRUNK), [x, 0.2, z], [x, h, z], 0.16, 4);
        const o = B.p(GRN); for (let i = 0; i < 7; i++){ const a = i/7*TAU + r(), ca = Math.cos(a), sa = Math.sin(a), e = [x + ca*2.1, h - 0.7, z + sa*2.1], m = [x + ca*1.1, h + 0.25, z + sa*1.1];
          triP(o, [x, h, z], [m[0] - sa*0.45, m[1], m[2] + ca*0.45], e); triP(o, [x, h, z], e, [m[0] + sa*0.45, m[1], m[2] - ca*0.45]); }
        ico(B.p(GRN), [x + 1.2, 0.6, z - 0.8], 1.1, 0.6); placed++; }
    }
    // understorey shrubs
    for (let t = 0; t < 260; t++){ const x = -40 + r()*76, z = -20 + r()*48; if (!ok(x, z, 0.4)) continue; ico(B.p(r() < 0.5 ? GRN : LEAF), [x, 0.5, z], 0.9 + r()*0.9, 0.55 + r()*0.3); }
  }
  B.flush(g);
  // ---- the turning wheel
  if (flyLive()){ const R = makeRig(); R.g = g; g.userData.flyRig = R; RIGS.add(R); }
  else bakeWheel(g, 0);
  return g; }};
SG_PLACES.push({type:'flyer', lat:1.2894 + HN/110574, lon:103.86323 + HE/111290.5, rot:ROT});

// ---- per frame: attach new rigs to their placed landmark, turn the wheel, keep the capsules level, drop rigs of removed landmarks
const FW = new THREE.Vector4(1, 0, 0, 0); FU.w.value = FW; let FLY_FORCE = null;
function flyFrame(){
  if (!RIGS.size) return;
  const t0 = performance.now(), now = Date.now(), th = flyAngle();
  // LED programme: four scenes of 45 s with 6 s cross-fades (ambient drift, rainbow rim, spoke pulses, two-tone sectors)
  const T = (now % 7200000)/1000, cyc = FLY_FORCE !== null ? FLY_FORCE + 0.5 : T/45, i = Math.floor(cyc) % 4, f = cyc - Math.floor(cyc), x = clamp01((f - (1 - 6/45))/(6/45)), xs = x*x*(3 - 2*x);
  FW.set(0, 0, 0, 0); FW.setComponent(i, 1 - xs); FW.setComponent((i + 1) % 4, FW.getComponent((i + 1) % 4) + xs);
  FU.t.value = T; FU.th.value = th;
  for (const R of RIGS){
    if (!R.on){
      if (R.g.parent){ R.g.add(R.root); R.on = true; }
      else { if (++R.wait > 600){ rigDispose(R); RIGS.delete(R); } continue; }
    } else if (!R.g.parent){ rigDispose(R); RIGS.delete(R); continue; }
    rigPose(R, th);
  }
  FLY_STATS.frames++; FLY_STATS.ms += performance.now() - t0;
}
if (typeof HOOKS !== 'undefined' && HOOKS && HOOKS.frame){
  HOOKS.frame.push(flyFrame);
  // this module owns the Flyer's night look (its own LED programme): keep the static structure's floodlight steady even if an
  // earlier light-show table (lm20/core) gave the old model a colour cycle
  if (HOOKS.boot) HOOKS.boot.push(() => { if (LANDMARKS.flyer && LANDMARKS.flyer.lt) LANDMARKS.flyer.lt = Object.assign({}, LANDMARKS.flyer.lt, {anim:'none'}); });
}
if (typeof window !== 'undefined') window.SGFlyer = {
  period:PERIOD, angle:flyAngle, scene(i){ FLY_FORCE = (i === null || i === undefined) ? null : (i|0) % 4; return FLY_FORCE; },
  rigs:() => RIGS.size,
  // wheel angle (rad) actually applied to the first live rig, its capsule 0 world position, and frame cost
  stats(){ const R = [...RIGS][0]; let cap = null;
    if (R && R.on){ R.caps.updateMatrixWorld(true); const m = new THREE.Matrix4(); R.caps.getMatrixAt(0, m); const v = new THREE.Vector3().setFromMatrixPosition(m).applyMatrix4(R.caps.matrixWorld); cap = [+v.x.toFixed(2), +v.y.toFixed(2), +v.z.toFixed(2)]; }
    return {rigs:RIGS.size, on:R ? R.on : false, th:R ? +R.th.toFixed(4) : null, cap0:cap, frames:FLY_STATS.frames, msPerFrame:FLY_STATS.frames ? +(FLY_STATS.ms/FLY_STATS.frames).toFixed(4) : 0,
      built:FLY_STATS.built, disposed:FLY_STATS.disposed, tris:R ? {wheel:R.wheel.geometry.attributes.position.count/3, caps:NCAP*R.caps.geometry.attributes.position.count/3} : null, w:FW.toArray().map(v => +v.toFixed(2))}; }
};
}
}
