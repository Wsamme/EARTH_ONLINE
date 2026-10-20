{
/* ======================================================================================================================
   v20 add-on: aircraft + airport ground operations (Changi, Seletar)
   - 10 aircraft families with real dimensions (fuselage stretch per instance in the shader: A320/A321, 787-9/-10, A350-900/-1000,
     A330-300/-200, 777-300ER/777F), one InstancedMesh per family, generic invented liveries via instance attributes.
   - parked aircraft at the stands (window.SG_STANDS if present, else SGR.base.stands) + cargo stands + Seletar.
   - movements at Changi: arrivals on 02L (3° glide path, flare, roll-out, exit, taxi to a free stand), departures from 02C
     (tug pushback, taxi on the real taxiway graph, line-up, take-off, climb-out), ground collision avoidance.
   - ground crew as instanced boxes (tug, baggage train with ULD dollies, belt loader, catering, fuel, container loader, stairs,
     apron bus, GPU, follow-me car, vans) running turnaround cycles at the stands; amber beacons.
   - lights: nav / beacon / strobe / landing / taxi lights as one additive Points object (flash patterns in the shader).
   World x east, y north; three.js position (x, h, -y). Heading a: math angle (0 = east, π/2 = north) = three.js rotation.y.
   ====================================================================================================================== */
SGR.airMod = true;
const AIR = {built:false, T:0, lastT:-1, stats:{}};
const PI = Math.PI, TAU = 2*Math.PI, D2R = Math.PI/180;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, f) => a + (b - a)*f;
const sstep = (a, b, x) => { const t = clamp((x - a)/(b - a), 0, 1); return t*t*(3 - 2*t); };

/* ---------------------------------------------------------------- geometry builder ----------------------------------------
   lm24 aircraft models (one shared source, SC/lm24/planes/acgeo.js, ported into the Changi, Bay Area and New York modules by
   SC/lm24/planes/port.py; the module-specific variant lists, family keys and liveries are kept from each module).
   Parts are written in the "s frame": s = metres aft of the nose tip, y = height above the ground (gear down), z = starboard.
   The model frame (what the mesh holds) is x = -s (nose along +x), y, z. Vertex attributes: position, normal, color,
   lv (paint channel: 0 vertex colour, 1 livery A, 2 livery B, 3 landing gear + gear doors (hidden when retracted), 4 body (tinted),
   6 fuselage skin (tinted; cabin windows, doors, cheatline and belly are painted per pixel in the fragment shader, in post-stretch
   coordinates, so they stay crisp at the gate and stretch correctly with the A321 / 787-10 / ... plugs), 7 propeller blades,
   8 propeller disc, 9 fin (livery A + fin pattern + tail floodlight at night), 10 nacelle cowl (livery style), 11 cockpit glazing),
   st (stretch zone 0 nose / 1 mid / 2 aft). Geometry is indexed (identical vertices merged: ~3x fewer vertices to light).
   Shapes per family: fuselage cross-section (max-width line, upper / lower lobe superellipses), nose with the windscreen break in
   the crown line (smooth on the 787), projected cockpit glazing (A350 mask), tail cone; wing planform with trailing-edge kink,
   dihedral, twist, slat / flap paint, flap-track fairings, tip devices (sharklet, split scimitar, curved, canted winglet, raked tip,
   wingtip fence); nacelles with intake lip, fan face, spinner, bypass nozzle (chevrons on 737 MAX / 787 / 747-8), core cowl and
   exhaust cone; pylons; fin with dorsal fillet, swept stabilisers; nose / main gear with oleo, braces, bogies and gear doors;
   belly fairing, antennas, APU exhaust. Three levels of detail (LO 0 full, 1 mid, 2 far ≤ ~400 triangles).
   ====================================================================================================================== */
function GB(){ this.P = []; this.N = []; this.C = []; this.L = []; this.S = []; }
GB.prototype.tri = function(a, b, c, na, nb, nc, col, lv, za, zb, zc){
  const ax = -a[0], ay = a[1], az = a[2], bx = -b[0], by = b[1], bz = b[2], cx = -c[0], cy = c[1], cz = c[2];
  const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az;
  const fx = uy*vz - uz*vy, fy = uz*vx - ux*vz, fz = ux*vy - uy*vx;
  if (fx*fx + fy*fy + fz*fz < 1e-12) return;
  const sx = -(na[0] + nb[0] + nc[0]), sy = na[1] + nb[1] + nc[1], sz = na[2] + nb[2] + nc[2];
  const P = this.P, N = this.N;
  const put = (x, y, z, n, zz) => { P.push(x, y, z); N.push(-n[0], n[1], n[2]); this.C.push(col[0], col[1], col[2]); this.L.push(lv); this.S.push(zz); };
  if (fx*sx + fy*sy + fz*sz >= 0){ put(ax, ay, az, na, za); put(bx, by, bz, nb, zb); put(cx, cy, cz, nc, zc); }
  else { put(ax, ay, az, na, za); put(cx, cy, cz, nc, zc); put(bx, by, bz, nb, zb); }
};
const v3 = {
  sub:(a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add:(a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  mul:(a, k) => [a[0]*k, a[1]*k, a[2]*k], dot:(a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2],
  cross:(a, b) => [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]],
  len:a => Math.hypot(a[0], a[1], a[2]), norm:a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0]/l, a[1]/l, a[2]/l]; },
  cen:R => { let x = 0, y = 0, z = 0; for (const p of R){ x += p[0]; y += p[1]; z += p[2]; } return [x/R.length, y/R.length, z/R.length]; }
};
// grid surface: R = rings (each an array of m points), o = {closed, face(i, j, cen) -> [col, lv], zone (number | fn(s)), normals, cap0, cap1, capCol, flat}
GB.prototype.grid = function(R, o){
  const n = R.length, m = R[0].length, closed = o.closed !== false, zf = typeof o.zone === 'function' ? o.zone : (() => o.zone || 0);
  let NR = o.normals;
  if (!NR){
    NR = [];
    const C = R.map(v3.cen);
    for (let i = 0; i < n; i++){
      const row = [];
      for (let j = 0; j < m; j++){
        const p = R[i][j], a = R[Math.max(0, i - 1)][j], b = R[Math.min(n - 1, i + 1)][j];
        const jm = closed ? (j - 1 + m) % m : Math.max(0, j - 1), jp = closed ? (j + 1) % m : Math.min(m - 1, j + 1);
        let nn = v3.cross(v3.sub(b, a), v3.sub(R[i][jp], R[i][jm]));
        const out = v3.sub(p, C[i]);
        if (v3.len(nn) < 1e-9 || v3.len(out) < 1e-6){ const q = C[i === 0 ? 1 : i - 1]; nn = v3.sub(p, q); if (v3.len(out) >= 1e-6 && v3.len(nn) < 1e-9) nn = out; }
        else if (v3.dot(nn, out) < 0) nn = v3.mul(nn, -1);
        row.push(v3.norm(nn));
      }
      NR.push(row);
    }
  }
  const J = closed ? m : m - 1;
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < J; j++){
    const j1 = (j + 1) % m, a = R[i][j], b = R[i + 1][j], c = R[i + 1][j1], d = R[i][j1];
    const cen = [(a[0] + b[0] + c[0] + d[0])/4, (a[1] + b[1] + c[1] + d[1])/4, (a[2] + b[2] + c[2] + d[2])/4];
    const f = o.face(i, j, cen), na = NR[i][j], nb = NR[i + 1][j], nc = NR[i + 1][j1], nd = NR[i][j1];
    let A = na, B = nb, Cn = nc, D = nd;
    if (o.flat){ const fn = v3.norm(v3.cross(v3.sub(c, a), v3.sub(b, d))); const s = v3.dot(fn, v3.add(v3.add(na, nb), v3.add(nc, nd))) < 0 ? -1 : 1; A = B = Cn = D = v3.mul(fn, s); }
    this.tri(a, b, c, A, B, Cn, f[0], f[1], zf(a[0]), zf(b[0]), zf(c[0]));
    this.tri(a, c, d, A, Cn, D, f[0], f[1], zf(a[0]), zf(c[0]), zf(d[0]));
  }
  const cap = (k, k2, col) => {
    const ring = R[k], c = v3.cen(ring), ax = v3.norm(v3.sub(c, v3.cen(R[k2]))), cc = col || o.capCol || o.face(k, 0, c);
    for (let j = 0; j < (closed ? m : m - 1); j++){ const j1 = (j + 1) % m; this.tri(c, ring[j], ring[j1], ax, ax, ax, cc[0], cc[1], zf(c[0]), zf(ring[j][0]), zf(ring[j1][0])); }
  };
  if (o.cap0) cap(0, 1, o.cap0 === true ? null : o.cap0);
  if (o.cap1) cap(n - 1, n - 2, o.cap1 === true ? null : o.cap1);
};
// surface of revolution: profile [[t, r], ...] around axis A through O (radial basis B, C); normals from the profile.
// o.jag = {ringIndex: amplitude}: alternate vertices of that ring are moved ± along the axis (nozzle chevrons)
GB.prototype.lathe = function(O, A, B, C, prof, segs, o){
  const R = [], NR = [], ry = o.ry || 1, rz = o.rz || 1;
  for (let i = 0; i < prof.length; i++){
    const p0 = prof[Math.max(0, i - 1)], p1 = prof[Math.min(prof.length - 1, i + 1)];
    let dt = p1[0] - p0[0], dr = p1[1] - p0[1]; const l = Math.hypot(dt, dr) || 1; dt /= l; dr /= l;
    const nt = -dr, nr = dt, ring = [], nring = [], jg = o.jag ? o.jag[i] || 0 : 0;
    for (let j = 0; j < segs; j++){
      const th = (j/segs)*TAU + (o.rot || 0), cs = Math.cos(th)*ry, sn = Math.sin(th)*rz, t = prof[i][0] + (jg ? (j & 1 ? jg : -jg) : 0), r = prof[i][1];
      ring.push([O[0] + A[0]*t + (B[0]*cs + C[0]*sn)*r, O[1] + A[1]*t + (B[1]*cs + C[1]*sn)*r, O[2] + A[2]*t + (B[2]*cs + C[2]*sn)*r]);
      const cn = Math.cos(th), sm = Math.sin(th);
      nring.push(v3.norm([A[0]*nt + (B[0]*cn + C[0]*sm)*nr, A[1]*nt + (B[1]*cn + C[1]*sm)*nr, A[2]*nt + (B[2]*cn + C[2]*sm)*nr]));
    }
    R.push(ring); NR.push(nring);
  }
  this.grid(R, Object.assign({}, o, {normals:NR, closed:true}));
};
// a round rod between two points (struts, braces, axles)
GB.prototype.rod = function(a, b, r, segs, col, lv, zone){
  const A = v3.norm(v3.sub(b, a)), up = Math.abs(A[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], B = v3.norm(v3.cross(A, up)), C = v3.cross(A, B);
  this.lathe(a, A, B, C, [[0, r], [v3.len(v3.sub(b, a)), r]], segs, {zone, face:() => [col, lv]});
};
// lifting surface: sections [{s (leading edge), y, z, c (chord), tc, inc (incidence, rad: nose up = trailing edge down)}], thickness direction T
const AF_T = [0, 0.02, 0.07, 0.16, 0.3, 0.5, 0.72, 1], AF_T_MID = [0, 0.08, 0.3, 0.6, 1], AF_T_LO = [0, 0.3, 1];
let LO = 0;      // level of detail being built: 0 full, 1 mid (~1/4 of the triangles), 2 far (≤ ~400 triangles)
function afHalf(t){ return 5*(0.2969*Math.sqrt(t) - 0.126*t - 0.3516*t*t + 0.2843*t*t*t - 0.1036*t*t*t*t); }   // NACA 00xx, max ≈ 0.5
GB.prototype.foil = function(secs, T, o){
  const R = [], lower = o.lower === undefined ? 0.75 : o.lower, AT = o.at || (LO === 2 ? AF_T_LO : LO === 1 ? AF_T_MID : AF_T);
  for (const q of secs){
    const ring = [], th = q.tc*q.c, inc = q.inc || 0, ci = Math.cos(inc), si = Math.sin(inc);
    const Tq = q.T || (inc ? [T[0]*ci + si*T[1], T[1]*ci - si*T[0], T[2]] : T), dir = inc ? [ci, -si, 0] : [1, 0, 0], lift = inc ? 0.25*q.c*si : 0;
    const pt = (t, k) => { const h = afHalf(t)*th*k; return [q.s + dir[0]*t*q.c + Tq[0]*h, q.y + lift + dir[1]*t*q.c + Tq[1]*h, q.z + Tq[2]*h]; };
    for (let k = 0; k < AT.length; k++) ring.push(pt(AT[k], 1));
    for (let k = AT.length - 2; k >= 1; k--) ring.push(pt(AT[k], -lower));
    R.push(ring);
  }
  this.grid(R, Object.assign({closed:true}, o));
};
// small box (flat shaded) centred at c with half sizes h (s frame)
GB.prototype.box = function(c, h, col, lv, zone){
  const P = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) P.push([c[0] + sx*h[0], c[1] + sy*h[1], c[2] + sz*h[2]]);
  const F = [[0, 1, 3, 2], [4, 6, 7, 5], [0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3]];
  for (const f of F){
    const a = P[f[0]], b = P[f[1]], cc = P[f[2]], d = P[f[3]], fc = v3.cen([a, b, cc, d]), n = v3.norm(v3.sub(fc, c));
    this.tri(a, b, cc, n, n, n, col, lv, zone, zone, zone); this.tri(a, cc, d, n, n, n, col, lv, zone, zone, zone);
  }
};
// indexed geometry: identical vertices (position, normal, colour, channel, zone; quantised) are merged (integer hash)
GB.prototype.geometry = function(){
  const P = this.P, N = this.N, C = this.C, L = this.L, S = this.S, n = P.length/3, idx = new Uint32Array(n), Q = new Int32Array(n*11), map = new Map(), r = Math.round;
  const p = [], nn = [], cc = [], ll = [], ss = [], first = new Int32Array(n);
  for (let i = 0; i < n; i++){
    const i3 = i*3, o = i*11;
    Q[o] = r(P[i3]*400); Q[o + 1] = r(P[i3 + 1]*400); Q[o + 2] = r(P[i3 + 2]*400); Q[o + 3] = r(N[i3]*300); Q[o + 4] = r(N[i3 + 1]*300); Q[o + 5] = r(N[i3 + 2]*300);
    Q[o + 6] = r(C[i3]*255); Q[o + 7] = r(C[i3 + 1]*255); Q[o + 8] = r(C[i3 + 2]*255); Q[o + 9] = r(L[i]*8); Q[o + 10] = S[i];
    let h = 0x811c9dc5; for (let k = 0; k < 11; k++) h = Math.imul(h ^ Q[o + k], 0x01000193);
    let j = -1, lst = map.get(h);
    if (lst !== undefined){ for (let q = 0; q < lst.length && j < 0; q++){ const v = lst[q], ov = first[v]*11; let eq = true; for (let k = 0; k < 11; k++) if (Q[ov + k] !== Q[o + k]){ eq = false; break; } if (eq) j = v; } }
    if (j < 0){ j = ll.length; first[j] = i; if (lst === undefined) map.set(h, [j]); else lst.push(j);
      p.push(P[i3], P[i3 + 1], P[i3 + 2]); nn.push(N[i3], N[i3 + 1], N[i3 + 2]); cc.push(C[i3], C[i3 + 1], C[i3 + 2]); ll.push(L[i]); ss.push(S[i]); }
    idx[i] = j;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nn, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(cc, 3));
  g.setAttribute('lv', new THREE.Float32BufferAttribute(ll, 1));
  g.setAttribute('st', new THREE.Float32BufferAttribute(ss, 1));
  g.setIndex(new THREE.BufferAttribute(ll.length > 65535 ? idx : new Uint16Array(idx), 1));
  return g;
};
// monotone cubic through [[x, y], ...] (x increasing)
function mcurve(P){
  const n = P.length, d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((P[i + 1][1] - P[i][1])/(P[i + 1][0] - P[i][0]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1]*d[i] <= 0 ? 0 : (d[i - 1] + d[i])/2;
  for (let i = 0; i < n - 1; i++){ if (d[i] === 0){ m[i] = m[i + 1] = 0; continue; } const a = m[i]/d[i], b = m[i + 1]/d[i], h = a*a + b*b; if (h > 9){ const t = 3/Math.sqrt(h); m[i] = t*a*d[i]; m[i + 1] = t*b*d[i]; } }
  return x => { if (x <= P[0][0]) return P[0][1]; if (x >= P[n - 1][0]) return P[n - 1][1]; let i = 0; while (x > P[i + 1][0]) i++;
    const h = P[i + 1][0] - P[i][0], t = (x - P[i][0])/h, t2 = t*t, t3 = t2*t;
    return (2*t3 - 3*t2 + 1)*P[i][1] + (t3 - 2*t2 + t)*h*m[i] + (-2*t3 + 3*t2)*P[i + 1][1] + (t3 - t2)*h*m[i + 1]; };
}
const se = (f, e) => Math.pow(Math.max(0, 1 - Math.pow(1 - Math.min(1, Math.max(0, f)), e)), 1/e);

/* ---------------------------------------------------------------- aircraft families ---------------------------------------- */
const COL = {white:[0.96, 0.96, 0.97], wing:[0.78, 0.79, 0.81], wingLE:[0.64, 0.65, 0.67], flap:[0.70, 0.71, 0.73], dark:[0.07, 0.08, 0.10], win:[0.16, 0.18, 0.22],
  metal:[0.72, 0.73, 0.75], lip:[0.80, 0.81, 0.83], fan:[0.09, 0.09, 0.10], fan2:[0.17, 0.17, 0.19], duct:[0.20, 0.20, 0.22], core:[0.46, 0.46, 0.48], plug:[0.33, 0.32, 0.31],
  tyre:[0.08, 0.08, 0.08], hub:[0.62, 0.63, 0.65], strut:[0.80, 0.80, 0.82], chrome:[0.86, 0.87, 0.89], door:[0.92, 0.92, 0.93], belly:[0.90, 0.90, 0.91],
  prop:[0.12, 0.12, 0.13], disc:[0.30, 0.31, 0.33], apu:[0.20, 0.20, 0.21], glass:[0.07, 0.09, 0.12], mask:[0.04, 0.04, 0.05], spin:[0.58, 0.59, 0.61], ant:[0.30, 0.31, 0.33]};
const FAM = {};
// family table (metres; s = aft of the nose tip). floor = cabin floor height at the doors (= door sill), yBot = belly height.
FAM.a320 = {name:'A320neo', vars:[{name:'A320neo', dF:0, dA:0, w:1}, {name:'A321neo', dF:4.27, dA:2.67, w:0.8}, {name:'A319neo', dF:-1.6, dA:-2.13, w:0.35}], code:'C', L:37.57, W:3.95, H:4.14, yBot:1.68, floor:3.3,
  nose:{len:6.2, tipY:-0.55, ck:[1.9, 3.6, 0.48, 1.02]}, tail:{len:11.2, tipY:1.0, tipR:0.28, tipW:0.22}, doors:[5.0, 31.3], wins:[[6.0, 30.4, 0.98, 1.36]], cheat:[0.45, 0.72],
  plugs:[9.6, 25.6], seg:30,
  wing:{s:12.6, z0:1.85, c0:6.4, zk:6.3, tipZ:17.05, ct:1.5, sweep:27.5, dih:5.1, y0:2.55, tc:[0.15, 0.12, 0.10], tip:'sharklet', tipH:2.43},
  eng:{z:[5.75], R:1.2, len:4.7, fwd:2.7, y:1.78, kind:'fan', short:true}, flaps:3,
  fin:{s:27.6, c0:6.2, ct:2.0, h:5.95, sweep:40}, tp:{s:31.1, c0:3.6, ct:1.3, semi:6.22, sweep:32, dih:6, y:0.55},
  gear:{nose:{s:5.05, r:0.37, n:2}, main:[{s:17.69, z:3.8, r:0.58, ax:1, wpa:2, wsp:0.92}]}};
FAM.b737 = {name:'737-8', vars:[{name:'737-8', dF:0, dA:0, w:1}, {name:'737-800', dF:-0.03, dA:-0.02, w:1}, {name:'737-700', dF:-3.05, dA:-2.79, w:0.8}, {name:'737-9', dF:1.57, dA:1.07, w:0.35}, {name:'737-800BCF', dF:-0.03, dA:-0.02, w:0, freighter:true}], code:'C', L:39.52, W:3.76, H:4.01, yBot:1.80, floor:3.3,
  nose:{len:6.6, tipY:-0.62, ck:[2.0, 3.8, 0.42, 0.98]}, tail:{len:11.5, tipY:0.95, tipR:0.30, tipW:0.30}, doors:[5.0, 34.0], wins:[[6.0, 33.0, 0.96, 1.33]], cheat:[0.42, 0.70],
  plugs:[10.2, 27.6], seg:30,
  wing:{s:14.3, z0:1.8, c0:6.2, zk:5.4, tipZ:17.1, ct:1.25, sweep:27, dih:6, y0:2.45, tc:[0.15, 0.12, 0.10], tip:'scimitar', tipH:2.9},
  eng:{z:[4.9], R:1.1, len:4.5, fwd:2.8, y:1.62, kind:'fan', short:true, flatBot:true}, flaps:3,
  fin:{s:29.4, c0:6.5, ct:1.9, h:6.4, sweep:36, dorsal:3.5}, tp:{s:33.6, c0:3.6, ct:1.2, semi:7.17, sweep:33, dih:7, y:0.55},
  gear:{nose:{s:4.25, r:0.36, n:2}, main:[{s:21.42, z:2.86, r:0.56, ax:1, wpa:2, wsp:0.9}]}};
FAM.b777 = {name:'777-300ER', vars:[{name:'777-300ER', dF:0, dA:0, w:1}, {name:'777F', dF:-5.0, dA:-5.15, w:0, freighter:true}], code:'E', L:73.86, W:6.2, H:6.2, yBot:2.5, floor:4.8,
  nose:{len:9.6, tipY:-0.9, ck:[2.9, 5.3, 0.55, 1.55]}, tail:{len:17.5, tipY:1.35, tipR:0.35, tipW:0.22}, doors:[7.0, 21.0, 38.6, 53.2, 66.2], wins:[[7.8, 66.6, 1.0, 1.45]], cheat:[0.5, 0.82],
  plugs:[24.0, 53.8], seg:36,
  wing:{s:27.5, z0:2.9, c0:14.0, zk:10.6, tipZ:32.4, ct:1.0, sweep:34, dih:6, y0:3.55, tc:[0.14, 0.11, 0.09], tip:'raked', rakeZ:29.0, rakeC:3.3},
  eng:{z:[9.62], R:1.95, len:7.3, fwd:4.3, y:2.85, kind:'fan', core:true}, flaps:4,
  fin:{s:58.2, c0:11.5, ct:3.6, h:9.4, sweep:38}, tp:{s:63.2, c0:6.4, ct:2.0, semi:10.75, sweep:36, dih:7, y:0.65},
  gear:{nose:{s:6.4, r:0.6, n:2}, main:[{s:37.62, z:5.49, r:0.66, ax:3, wpa:2, wsp:1.4, axs:1.45}]}};
FAM.b787 = {name:'787-9', vars:[{name:'787-9', dF:0, dA:0, w:1}, {name:'787-10', dF:3.05, dA:2.42, w:1}], code:'E', L:62.81, W:5.77, H:5.97, yBot:2.55, floor:4.8,
  nose:{len:9.2, tipY:-0.75, ck:[2.6, 4.7, 0.5, 1.42]}, tail:{len:15.3, tipY:1.2, tipR:0.3, tipW:0.3}, doors:[7.0, 21.0, 36.4, 55.0], wins:[[7.8, 55.6, 0.98, 1.55]], cheat:[0.5, 0.8],
  plugs:[24.2, 46.4], seg:36,
  wing:{s:23.6, z0:2.8, c0:13.0, zk:9.6, tipZ:30.06, ct:1.0, sweep:35, dih:5, flex:0.0028, y0:3.55, tc:[0.14, 0.11, 0.085], tip:'raked', rakeZ:27.0, rakeC:3.0},
  eng:{z:[9.7], R:1.66, len:6.4, fwd:3.9, y:2.55, kind:'fan', core:true, chevron:true}, flaps:4,
  fin:{s:48.4, c0:10.6, ct:3.3, h:8.6, sweep:40}, tp:{s:54.0, c0:6.0, ct:1.9, semi:9.9, sweep:37, dih:7, y:0.6},
  gear:{nose:{s:5.9, r:0.56, n:2}, main:[{s:31.5, z:4.9, r:0.64, ax:2, wpa:2, wsp:1.3, axs:1.45}]}};
FAM.a350 = {name:'A350-900', vars:[{name:'A350-900', dF:0, dA:0, w:1}, {name:'A350-1000', dF:4.0, dA:2.94, w:0.3}], code:'E', L:66.8, W:5.96, H:6.09, yBot:2.5, floor:4.8,
  nose:{len:10.0, tipY:-0.85, ck:[2.3, 5.0, 0.32, 1.5], mask:true}, tail:{len:16.0, tipY:1.25, tipR:0.3, tipW:0.3}, doors:[7.0, 21.0, 41.0, 58.4], wins:[[7.8, 58.9, 0.98, 1.48]], cheat:[0.5, 0.8],
  plugs:[24.2, 50.4], seg:36,
  wing:{s:24.0, z0:2.9, c0:14.5, zk:10.6, tipZ:31.0, ct:1.6, sweep:35, dih:5.5, flex:0.0016, y0:3.5, tc:[0.14, 0.11, 0.09], tip:'curved', tipH:3.0},
  eng:{z:[10.1], R:1.82, len:6.9, fwd:4.1, y:2.72, kind:'fan', core:true}, flaps:4,
  fin:{s:51.6, c0:11.0, ct:3.5, h:8.5, sweep:40}, tp:{s:57.6, c0:6.2, ct:2.0, semi:9.3, sweep:36, dih:6, y:0.6},
  gear:{nose:{s:6.5, r:0.58, n:2}, main:[{s:35.2, z:5.3, r:0.66, ax:2, wpa:2, wsp:1.4, axs:1.5}]}};
FAM.b767 = {name:'767-300ER', vars:[{name:'767-300ER', dF:0, dA:0, w:1}, {name:'767-300F', dF:0, dA:0, w:0, freighter:true}], code:'D', L:54.94, W:5.03, H:5.41, yBot:2.3, floor:4.25,
  nose:{len:7.8, tipY:-0.75, ck:[2.3, 4.3, 0.5, 1.32]}, tail:{len:14.2, tipY:1.2, tipR:0.3, tipW:0.24}, doors:[6.5, 18.3, 47.6], wins:[[7.3, 48.2, 1.0, 1.45]], cheat:[0.5, 0.8],
  plugs:[20.0, 42.0], seg:34,
  wing:{s:21.6, z0:2.5, c0:9.4, zk:7.9, tipZ:23.78, ct:2.2, sweep:31.5, dih:6, y0:3.15, tc:[0.15, 0.115, 0.095], tip:null},
  eng:{z:[7.62], R:1.42, len:6.0, fwd:3.4, y:2.3, kind:'fan', core:true}, flaps:3,
  fin:{s:42.6, c0:9.0, ct:3.0, h:7.8, sweep:40}, tp:{s:47.4, c0:5.3, ct:1.8, semi:9.31, sweep:34, dih:7, y:0.6},
  gear:{nose:{s:6.3, r:0.5, n:2}, main:[{s:29.06, z:4.65, r:0.6, ax:2, wpa:2, wsp:1.14, axs:1.42}]}};
FAM.a330 = {name:'A330-300', vars:[{name:'A330-300', dF:0, dA:0, w:1}, {name:'A330-200', dF:-2.6, dA:-2.27, w:0.4}], code:'E', L:63.67, W:5.64, H:5.64, yBot:2.7, floor:4.8,
  nose:{len:8.2, tipY:-0.9, ck:[2.5, 4.5, 0.48, 1.35]}, tail:{len:15.6, tipY:1.2, tipR:0.3, tipW:0.24}, doors:[7.0, 21.0, 38.0, 55.0], wins:[[7.8, 55.6, 1.0, 1.42]], cheat:[0.5, 0.8],
  plugs:[24.0, 46.6], seg:36,
  wing:{s:24.5, z0:2.7, c0:11.2, zk:9.2, tipZ:28.6, ct:1.6, sweep:32, dih:5.4, y0:3.6, tc:[0.14, 0.11, 0.09], tip:'winglet', tipH:2.74},
  eng:{z:[9.37], R:1.56, len:6.3, fwd:3.5, y:2.5, kind:'fan', longCowl:true}, flaps:4,
  fin:{s:49.4, c0:10.0, ct:3.4, h:8.4, sweep:40}, tp:{s:55.4, c0:5.8, ct:2.0, semi:9.7, sweep:34, dih:6, y:0.6},
  gear:{nose:{s:6.0, r:0.56, n:2}, main:[{s:31.6, z:5.35, r:0.63, ax:2, wpa:2, wsp:1.35, axs:1.4}]}};
FAM.a380 = {name:'A380-800', vars:[{name:'A380-800', dF:0, dA:0, w:1}], code:'F', L:72.72, W:7.14, H:8.41, yBot:2.85, floor:5.1, floor2:7.9,
  nose:{len:11.0, tipY:-1.45, ck:[2.7, 4.9, 0.25, 1.05]}, tail:{len:18.5, tipY:1.9, tipR:0.4, tipW:0.3}, doors:[9.0, 22.0, 39.0, 51.5, 63.5], doors2:[28.0, 46.0, 56.0],
  wins:[[9.8, 63.9, 1.0, 1.45]], wins2:[[12.5, 57.5, 0.95, 1.35]], cheat:[0.55, 0.85], plugs:[30, 60], seg:40,
  wing:{s:22.5, z0:3.6, c0:17.7, zk:12.0, tipZ:39.4, ct:3.9, sweep:35.5, dih:5.6, y0:4.2, tc:[0.13, 0.105, 0.09], tip:'fence'},
  eng:{z:[14.3, 25.0], R:1.75, len:6.6, fwd:3.9, y:[3.1, 4.15], kind:'fan', core:true}, flaps:5,
  fin:{s:53.6, c0:15.0, ct:4.5, h:12.9, sweep:40}, tp:{s:58.6, c0:8.5, ct:2.8, semi:15.2, sweep:36, dih:7, y:0.25},
  gear:{nose:{s:6.4, r:0.64, n:2}, main:[{s:38.4, z:6.0, r:0.7, ax:2, wpa:2, wsp:1.45, axs:1.6}, {s:40.6, z:2.1, r:0.7, ax:3, wpa:2, wsp:1.45, axs:1.6}]}};
FAM.b747 = {name:'747-8F', vars:[{name:'747-8F', dF:0, dA:0, w:1, freighter:true}], code:'F', L:76.25, W:6.5, H:7.0, yBot:2.4, floor:5.0,
  nose:{len:10.5, tipY:-0.9, ck:[4.6, 6.7, 3.05, 3.75]}, hump:{s0:1.0, s1:9.5, s2:21.0, s3:36.0, h:1.55}, tail:{len:17.5, tipY:1.45, tipR:0.35, tipW:0.25}, doors:[], wins:[], cheat:[0.5, 0.8],
  plugs:[30, 60], seg:36,
  wing:{s:24.5, z0:3.25, c0:16.0, zk:11.0, tipZ:34.2, ct:1.7, sweep:40, dih:7, y0:3.4, tc:[0.13, 0.105, 0.085], tip:'raked', rakeZ:31.0, rakeC:3.4},
  eng:{z:[12.1, 21.1], R:1.5, len:5.6, fwd:3.3, y:[2.35, 3.45], kind:'fan', core:true}, flaps:5,
  fin:{s:61.0, c0:13.0, ct:3.6, h:10.0, sweep:45}, tp:{s:66.6, c0:7.0, ct:2.2, semi:11.1, sweep:40, dih:7, y:0.6},
  gear:{nose:{s:7.4, r:0.6, n:2}, main:[{s:36.2, z:5.6, r:0.65, ax:2, wpa:2, wsp:1.3, axs:1.45}, {s:38.8, z:1.9, r:0.65, ax:2, wpa:2, wsp:1.3, axs:1.45}]}};
FAM.atr = {name:'ATR 72-600', vars:[{name:'ATR 72-600', dF:0, dA:0, w:1}], code:'C', L:27.17, W:2.57, H:2.75, yBot:0.92, floor:1.35,
  nose:{len:3.9, tipY:-0.3, ck:[1.4, 2.6, 0.3, 0.95]}, tail:{len:9.2, tipY:0.95, tipR:0.2, tipW:0.15}, doors:[23.4], wins:[[5.0, 22.2, 0.92, 1.27]], cheat:[0.45, 0.65],
  plugs:[30, 60], seg:26,
  wing:{s:10.6, z0:0.0, c0:2.57, zk:4.1, tipZ:13.5, ct:1.41, sweep:3, dih:2.5, y0:3.72, tc:[0.18, 0.17, 0.13], tip:null, high:true},
  eng:{z:[4.1], R:0.62, len:5.6, fwd:2.1, y:3.15, kind:'prop', prop:1.96}, flaps:0,
  fin:{s:19.7, c0:4.7, ct:2.6, h:3.5, sweep:32, dorsal:4.0}, tp:{s:24.4, c0:1.9, ct:1.15, semi:3.65, sweep:10, dih:0, T:true},
  gear:{nose:{s:3.5, r:0.32, n:2}, main:[{s:14.27, z:2.05, r:0.43, ax:2, wpa:1, wsp:0, axs:0.95}], pods:true}};
FAM.biz = {name:'Business jet', vars:[{name:'Business jet', dF:0, dA:0, w:1}], code:'C', L:30.4, W:2.6, H:2.65, yBot:1.0, floor:1.55,
  nose:{len:5.4, tipY:-0.32, ck:[2.0, 3.4, 0.38, 1.0]}, tail:{len:10.0, tipY:0.75, tipR:0.2, tipW:0.15}, doors:[3.9], wins:[[6.2, 16.6, 0.65, 1.05]], cheat:[0.3, 0.5],
  plugs:[30, 60], seg:26,
  wing:{s:11.6, z0:1.2, c0:5.0, zk:3.4, tipZ:14.5, ct:1.3, sweep:36, dih:3, y0:1.45, tc:[0.13, 0.11, 0.09], tip:'winglet', tipH:1.6},
  eng:{z:[2.1], R:0.6, len:4.2, fwd:0, y:3.1, kind:'rear', s0:19.6}, flaps:0,
  fin:{s:23.4, c0:4.9, ct:2.8, h:3.9, sweep:45}, tp:{s:26.9, c0:2.4, ct:1.1, semi:5.4, sweep:35, dih:-2, T:true},
  gear:{nose:{s:3.0, r:0.3, n:2}, main:[{s:16.6, z:2.1, r:0.42, ax:1, wpa:2, wsp:0.6}]}};
// light single (a high-wing four-seater: L 8.28, span 11.0, height 2.72) for the general-aviation fields; drawn near the camera only
FAM.c172 = {name:'light single', vars:[{name:'light single', dF:0, dA:0, w:1}], code:'A', L:8.28, W:1.12, H:1.38, yBot:0.62, floor:0.8, nearOnly:true, lodScale:0.45,
  nose:{len:1.75, tipY:-0.08, ck:[1.8, 2.25, 0.02, 0.62]}, tail:{len:4.0, tipY:0.32, tipR:0.1, tipW:0.08}, doors:[], wins:[[2.25, 3.7, 0.25, 0.78]], cheat:[-0.05, 0.08],
  plugs:[30, 60], seg:14,
  wing:{s:2.25, z0:0, c0:1.63, zk:2.6, tipZ:5.5, ct:1.12, sweep:0, dih:1.6, y0:2.02, tc:[0.13, 0.13, 0.12], tip:null, high:true, strut:true},
  eng:{z:[0], R:0.42, len:1.5, fwd:0, y:1.22, kind:'nose', prop:0.94}, flaps:0,
  fin:{s:6.55, c0:1.45, ct:0.75, h:1.3, sweep:38, dorsal:1.3}, tp:{s:7.0, c0:1.05, ct:0.72, semi:1.72, sweep:4, dih:0, y:-0.1},
  gear:{nose:{s:1.0, r:0.22, n:1}, main:[{s:3.2, z:1.27, r:0.26, ax:1, wpa:1, wsp:0}]}};
// lm24 shape / paint data per family:
//  xs [max-width line offset from the centre (m), upper-lobe exponent, lower-lobe exponent] (2 = ellipse, > 2 boxier, < 2 pointier)
//  ne [nose bottom, nose width exponents]; ws windscreen top station (fraction of the cockpit glazing length); ck glazing style;
//  win [pitch, half width, half height, corner radius] of the cabin windows; door [width, height] of the main doors;
//  cargo [width, height] of the lower-deck doors (starboard); frt [s, width, height] main-deck cargo door of freighters (port);
//  mgDoor: main gear strut doors; chev: chevron nozzles; ant: antennas; tc [top, bottom, width] exponents of the tail cone
const FX = {
  a320:{xs:[0.10, 2.0, 2.1], ne:[2.4, 2.15], ws:0.3, ck:'A', win:[0.533, 0.115, 0.165, 0.08], door:[0.81, 1.85], cargo:[1.82, 1.24], frt:[7.0, 3.6, 2.2], mgDoor:1},
  b737:{xs:[0.22, 2.0, 1.85], ne:[2.2, 1.9], ws:0.3, ck:'B', win:[0.508, 0.125, 0.17, 0.09], door:[0.86, 1.83], cargo:[1.22, 0.89], frt:[7.4, 3.4, 2.1], mgDoor:0, chev:1},
  b767:{xs:[0.05, 2.0, 2.05], ne:[2.4, 2.15], ws:0.3, ck:'B', win:[0.508, 0.125, 0.18, 0.09], door:[1.07, 1.88], cargo:[1.75, 1.75], frt:[11.5, 3.4, 2.6], mgDoor:1},
  b777:{xs:[0.0, 2.0, 2.0], ne:[2.5, 2.35], ws:0.3, ck:'B', win:[0.533, 0.14, 0.2, 0.1], door:[1.07, 1.93], cargo:[2.7, 1.7], frt:[52.0, 3.7, 3.05], mgDoor:1},
  b787:{xs:[0.05, 2.0, 2.05], ne:[2.0, 1.85], nwk:1.0, ws:0.55, ck:'787', win:[0.546, 0.135, 0.235, 0.12], door:[1.07, 1.93], cargo:[2.7, 1.7], frt:[44.0, 3.7, 3.05], mgDoor:1, chev:2},
  a350:{xs:[0.05, 2.0, 2.05], ne:[2.4, 2.15], ws:0.4, ck:'A350', win:[0.533, 0.14, 0.2, 0.1], door:[1.07, 1.93], cargo:[2.7, 1.7], frt:[46.0, 3.7, 3.05], mgDoor:1},
  a330:{xs:[0.05, 2.0, 2.05], ne:[2.45, 2.25], ws:0.3, ck:'A', win:[0.533, 0.115, 0.165, 0.08], door:[1.07, 1.93], cargo:[2.7, 1.7], frt:[44.0, 3.6, 2.6], mgDoor:1},
  a380:{xs:[-0.35, 2.25, 2.2], ne:[2.3, 2.35], ws:0.3, ck:'A', win:[0.533, 0.115, 0.165, 0.08], door:[1.07, 1.93], cargo:[2.7, 1.7], frt:[50, 3.7, 3.05], mgDoor:1},
  b747:{xs:[0.0, 2.0, 2.0], ne:[2.5, 2.2], ws:0.3, ck:'B', ws:0.35, hump:{s0:2.6, s1:8.6, s2:21.0, s3:36.0, h:1.55}, win:[0.508, 0.125, 0.18, 0.09], door:[1.07, 1.93], cargo:[2.7, 1.7], frt:[57.0, 3.4, 3.1], mgDoor:1, chev:1},
  atr:{xs:[0.0, 2.1, 2.1], ne:[2.0, 1.8], ws:0.35, ck:'T', win:[0.76, 0.12, 0.17, 0.08], door:[0.72, 1.75], cargo:[1.27, 1.53], frt:[5.5, 2.0, 1.6], mgDoor:0},
  biz:{xs:[0.0, 2.1, 2.1], ne:[2.0, 1.75], ws:0.4, ck:'J', win:[1.0, 0.19, 0.25, 0.17], door:[0.8, 1.6], cargo:[0, 0], frt:[0, 0, 0], mgDoor:0},
  c172:{xs:[0.0, 2.4, 2.4], ne:[2.6, 2.6], ws:0.5, ck:'L', win:[1.45, 0.67, 0.25, 0.08], door:[0, 0], cargo:[0, 0], frt:[0, 0, 0], mgDoor:0, noWs:1}};
for (const k in FX) if (FAM[k]) Object.assign(FAM[k], FX[k]);
// this module's variants of each family (kept from the module)
const MOD_VARS = {a320:[{name:'A320neo', dF:0, dA:0, w:1}, {name:'A321neo', dF:4.27, dA:2.67, w:1}], b737:[{name:'737-8', dF:0, dA:0, w:1}, {name:'737-9', dF:1.57, dA:1.07, w:0.35}], b777:[{name:'777-300ER', dF:0, dA:0, w:1}, {name:'777F', dF:-5.0, dA:-5.15, w:0, freighter:true}], b787:[{name:'787-9', dF:0, dA:0, w:1}, {name:'787-10', dF:3.05, dA:2.42, w:1}], a350:[{name:'A350-900', dF:0, dA:0, w:1}, {name:'A350-1000', dF:4.0, dA:2.94, w:0.3}], a330:[{name:'A330-300', dF:0, dA:0, w:1}, {name:'A330-200', dF:-2.6, dA:-2.27, w:0.4}], a380:[{name:'A380-800', dF:0, dA:0, w:1}], b747:[{name:'747-8F', dF:0, dA:0, w:1, freighter:true}], atr:[{name:'ATR 72-600', dF:0, dA:0, w:1}], biz:[{name:'Business jet', dF:0, dA:0, w:1}]};
for (const k in MOD_VARS) FAM[k].vars = MOD_VARS[k];
const FAM_KEYS = ['a320', 'b737', 'b777', 'b787', 'a350', 'a330', 'a380', 'b747', 'atr', 'biz'];

// derived numbers shared by the geometry, the lights, the ground crew and the kinematics
function famDerive(F){
  const W = F.wing, tw = Math.tan(W.sweep*D2R), L = F.L;
  F.c = F.yBot + F.H/2; F.top = F.yBot + F.H;
  F.wingLE = z => W.s + Math.max(0, z - W.z0)*tw + (W.tip === 'raked' && z > W.rakeZ ? (z - W.rakeZ)*0.9 : 0);
  F.wingC = z => { const te0 = W.s + W.c0; if (z <= W.zk){ return te0 - F.wingLE(z); }
    const f = (z - W.zk)/(W.tipZ - W.zk), lek = F.wingLE(W.zk), ck = te0 - lek; let c = ck + (W.ct - ck)*f;
    if (W.tip === 'raked' && z > W.rakeZ){ const cr = ck + (W.ct - ck)*((W.rakeZ - W.zk)/(W.tipZ - W.zk)); c = lerp(Math.min(cr, W.rakeC), W.ct, (z - W.rakeZ)/(W.tipZ - W.rakeZ)); }
    return c; };
  F.wingY = z => W.y0 + Math.max(0, z - W.z0)*Math.tan(W.dih*D2R) + (W.flex || 0)*Math.max(0, z - W.z0)*Math.max(0, z - W.z0);
  F.semi = W.tipZ + (W.tip === 'sharklet' ? 0.8 : W.tip === 'scimitar' ? 0.35 : W.tip === 'curved' ? 1.4 : W.tip === 'winglet' ? 0.6 : 0);
  F.span = F.semi*2;
  F.xNG = F.gear.nose.s; F.xMG = F.gear.main.reduce((a, m) => a + m.s, 0)/F.gear.main.length;
  F.tipPt = [F.wingLE(W.tipZ) + F.wingC(W.tipZ)*0.5, F.wingY(W.tipZ) + 0.3, W.tipZ];
  F.tailPt = [L, F.c + F.tail.tipY, 0];
  F.finTop = F.fin.h + F.top;
  // lm24: nose crown line through the windscreen (bottom and top at the centre line), tail-cone exponents
  const N = F.nose, ck = N.ck, hh = F.hump ? F.hump.h : 0, rise = F.top + hh - (F.c + N.tipY), den = F.H/2 + hh - N.tipY;
  if (!F.noWs && ck){ const f0 = ck[0]/N.len, h0 = (ck[2] - N.tipY)/den, f1 = (ck[0] + (F.ws || 0.3)*(ck[1] - ck[0]))/N.len, h1 = Math.min(0.9, (ck[3] + 0.1 - N.tipY)/den);
    // radome: a rounded tip blending into a straight-ish ramp up to the windscreen sill (convex, no pinch), then windscreen and roof
    const P = [0, 0.004, 0.015, 0.04, 0.08, 0.14, 0.22, 0.32, 0.45, 0.6, 0.8, 1].map(t => [t*f0, h0*(0.62*se(t, 1.8) + 0.38*t)]);
    F._top = mcurve(P.concat([[f1, h1], [f1 + 0.42*(1 - f1), h1 + 0.8*(1 - h1)], [1, 1]])); }
  else F._top = f => se(f, 1.75);
  F._rise = rise;
  return F;
}
for (const k of FAM_KEYS) famDerive(FAM[k]);

// fuselage cross-section at station s: {s, top, bot, w, yc (max-width line), hu (747 hump)}
function fusStation(F, s){
  const Wh = F.W/2, yTop = F.top, yBot = F.yBot, nose = F.nose, tail = F.tail, yTip = F.c + nose.tipY, s1 = F.L - tail.len, ne = F.ne || [2.6, 2.3];
  let q;
  const H = F.hump; let hu = 0;
  if (H && s >= H.s0 && s <= H.s3) hu = s < H.s1 ? H.h*sstep(H.s0, H.s1, s)*Math.min(1, (s - H.s0)/(H.s1 - H.s0) + 0.35) : s < H.s2 ? H.h : H.h*(1 - sstep(H.s2, H.s3, s));
  if (s < nose.len){ const f = Math.max(0, s)/nose.len; q = {top:Math.max(yTip + 0.02, yTip + (yTop + (H ? H.h : 0) - yTip)*F._top(f) - hu), bot:yTip - (yTip - yBot)*se(f, ne[0])}; const wa = Wh*se(f, ne[1]), wb = (q.top - q.bot)*0.5*(F.nwk || 1.06), kk = 0.22*Wh, hk = Math.max(kk - Math.abs(wa - wb), 0)/kk; q.w = Math.min(wa, wb) - hk*hk*kk*0.25; }
  else if (s <= s1) q = {top:yTop, bot:yBot, w:Wh};
  else { const g = Math.min(1, (s - s1)/tail.len), yT = F.c + tail.tipY; q = {top:yTop - (yTop - (yT + tail.tipR))*Math.pow(g, 1.9), bot:yBot + ((yT - tail.tipR) - yBot)*Math.pow(g, 0.85), w:Wh + (tail.tipW - Wh)*Math.pow(g, 1.25)}; }
  const kc = 0.5 + (F.xs ? F.xs[0] : 0)/F.H;
  q.yc = q.bot + (q.top - q.bot)*kc;
  q.hu = hu; q.s = s; return q;
}
// ring point at angle p (0 = crown, π/2 = starboard side, π = keel)
function fusPt(F, q, p){
  const cp = Math.cos(p), sp = Math.sin(p), X = F.xs || [0, 2, 2], up = cp >= 0, n = up ? X[1] : X[2], a = up ? q.top - q.yc : q.yc - q.bot;
  const ec = (cp < 0 ? -1 : 1)*Math.pow(Math.abs(cp), 2/n), es = (sp < 0 ? -1 : 1)*Math.pow(Math.abs(sp), 2/n), u4 = up ? cp*cp*cp*cp : 0;
  return [q.s, q.yc + a*ec + (q.hu ? q.hu*Math.pow(Math.max(0, cp), 3.2) : 0), q.w*es*(1 - (q.hu > 0 ? 0.2*u4*q.hu/F.hump.h : 0))];
}
// angle φ ∈ [0, π] (starboard side) at which the ring of station q reaches height y
function fusPhi(F, q, y){ let a = 0, b = PI; for (let k = 0; k < 26; k++){ const m = (a + b)/2; if (fusPt(F, q, m)[1] > y) a = m; else b = m; } return (a + b)/2; }
const fusZone = (F, s) => s < F.plugs[0] ? 0 : s < F.plugs[1] ? 1 : 2;
// projections onto the fuselage surface for the cockpit glazing: side view (s, y) -> (s, φ); front view (z, y) -> (s, φ)
function surfSide(F, s, y){ return [s, fusPhi(F, fusStation(F, s), y)]; }
function surfFront(F, z, y){
  let a = 0, b = F.nose.len*1.2;
  for (let k = 0; k < 24; k++){ const m = (a + b)/2, q = fusStation(F, m), top = fusPt(F, q, 0)[1], bot = fusPt(F, q, PI)[1];
    const zz = y < top && y > bot ? fusPt(F, q, fusPhi(F, q, y))[2] : 0; if (zz < z) a = m; else b = m; }
  const s = (a + b)/2; return [s, fusPhi(F, fusStation(F, s), y)];
}
function surfPN(F, s, p, off){
  const q = fusStation(F, s), P = fusPt(F, q, p), A = fusPt(F, fusStation(F, s + 0.02), p), B = fusPt(F, q, p + 0.01);
  let n = v3.norm(v3.cross(v3.sub(A, P), v3.sub(B, P)));
  if (v3.dot(n, v3.sub(P, [s, q.yc, 0])) < 0) n = v3.mul(n, -1);
  return [v3.add(P, v3.mul(n, off)), n];
}
// cockpit glazing styles: front pane outer edge at u = fr[0] (bottom) / fr[1] (top) of the glazing length; side panes
// [u0 bottom, u1 bottom, u0 top, u1 top, v bottom, v top] (u along the glazing, v from the sill y0 to the top y1)
const CKS = {
  A:{zc:0.05, fr:[0.30, 0.36], side:[[0.34, 0.62, 0.40, 0.62, 0.0, 0.98], [0.66, 0.93, 0.66, 0.80, 0.08, 0.84]]},
  B:{zc:0.05, fr:[0.30, 0.40], side:[[0.34, 0.60, 0.44, 0.60, 0.0, 0.95], [0.64, 0.88, 0.64, 0.76, 0.0, 0.72]]},
  787:{zc:0.05, fr:[0.36, 0.55], side:[[0.40, 0.97, 0.59, 0.84, 0.0, 0.9]]},
  A350:{zc:0.05, fr:[0.30, 0.40], side:[[0.34, 0.62, 0.44, 0.62, 0.0, 0.95], [0.66, 0.90, 0.66, 0.78, 0.06, 0.8]], mask:true},
  T:{zc:0.05, fr:[0.36, 0.46], side:[[0.40, 0.78, 0.50, 0.70, 0.0, 0.9]]},
  J:{zc:0.05, fr:[0.36, 0.50], side:[[0.40, 0.80, 0.54, 0.72, 0.0, 0.85]]},
  L:{zc:0.0, fr:[0.0, 0.45], side:[[0.0, 1.0, 0.25, 1.0, 0.0, 1.0]], noFront:true}};
function cockpit(G, F){
  if (LO === 2) return;
  const N = F.nose, ck = N.ck, S = CKS[F.ck || 'A'], s0 = ck[0], s1 = ck[1], y0 = F.c + ck[2], y1 = F.c + ck[3], yT = y1 + 0.1;
  const off = LO ? 0.05 : 0.025, nu = LO ? 2 : 4, nv = LO ? 1 : 3, us = u => s0 + u*(s1 - s0);
  // a pane: corners in projection coordinates (front: [z, y], side: [s, y]) a (bottom fwd / inner), b (bottom aft / outer), c (top aft / outer), d (top fwd / inner)
  const pane = (kind, a, b, c, d, col, lv, o2) => {
    const R = [], NR = [];
    for (let i = 0; i <= nv; i++){ const v = i/nv, row = [], nrow = [];
      for (let j = 0; j <= nu; j++){ const u = j/nu, X = lerp(lerp(a[0], b[0], u), lerp(d[0], c[0], u), v), Y = lerp(lerp(a[1], b[1], u), lerp(d[1], c[1], u), v);
        const sp = kind === 'front' ? surfFront(F, X, Y) : surfSide(F, X, Y), pn = surfPN(F, sp[0], sp[1], o2 || off); row.push(pn[0]); nrow.push(pn[1]); }
      R.push(row); NR.push(nrow); }
    for (const sg of [1, -1]) G.grid(sg > 0 ? R : R.map(r => r.map(q => [q[0], q[1], -q[2]])), {closed:false, normals:sg > 0 ? NR : NR.map(r => r.map(q => [q[0], q[1], -q[2]])), zone:0, face:() => [col, lv]});
  };
  const zAt = (s, y) => { const q = fusStation(F, s); return fusPt(F, q, fusPhi(F, q, y))[2]; };
  if (S.mask){   // the painted mask around the glazing (A350): front and side parts, the glazing on top of it
    const m0 = y0 - 0.14, m1 = y1 + 0.07, zo0 = zAt(us(S.fr[0] - 0.03), m0), zo1 = zAt(us(S.fr[1] - 0.03), m1);
    pane('front', [0.0, m0], [zo0, m0], [zo1, m1], [0.0, Math.min(m1, yT - 0.02)], COL.mask, 0, off*0.6);
    pane('side', [us(S.fr[0] - 0.03), m0], [us(1.06), lerp(m0, m1, 0.25)], [us(0.84), m1], [us(S.fr[1] + 0.07), m1], COL.mask, 0, off*0.6);
  }
  const g = S.mask ? 0.02 : 0.03, zb = zAt(us(S.fr[0]), y0 + 0.02), zt = zAt(us(S.fr[1]), y1);
  if (!S.noFront) pane('front', [S.zc, y0 + 0.02], [zb - g, y0 + 0.02], [zt - g, y1], [S.zc, yT], COL.glass, 11);
  for (const P of S.side) pane('side', [us(P[0]), lerp(y0, y1, P[4])], [us(P[1]), lerp(y0, y1, P[4])], [us(P[3]), lerp(y0, y1, P[5])], [us(P[2]), lerp(y0, y1, P[5])], COL.glass, 11);
}
function fuselageLo(G, F){
  const L = F.L, nose = F.nose, tail = F.tail, s1 = L - tail.len, phis = [];
  for (let k = 0; k < 8; k++) phis.push((k + 0.5)/8*TAU);
  const S = (F.hump ? [0, 0.15, 0.45, 1] : [0, 0.1, 0.3, 0.6, 1]).map(f => f*nose.len);
  for (const p of F.plugs) if (p > nose.len && p < s1) S.push(p);
  for (const g of [0.35, 0.7, 1]) S.push(s1 + g*tail.len);
  if (F.hump) S.push(F.hump.s1, (F.hump.s2 + F.hump.s3)/2);
  S.sort((a, b) => a - b);
  const R = S.map(s => { const q = fusStation(F, s); return phis.map(p => fusPt(F, q, p)); });
  G.grid(R, {closed:true, zone:s => fusZone(F, s), cap0:[COL.white, 6], cap1:[COL.apu, 0], face:() => [COL.white, 6]});
}
function fuselage(G, F){
  if (LO === 2) return fuselageLo(G, F);
  const L = F.L, nose = F.nose, tail = F.tail, s1 = L - tail.len, nseg = LO ? 16 : Math.max(16, Math.round((F.seg || 30)*0.93/2)*2);
  const phis = []; for (let k = 0; k < nseg; k++) phis.push(k/nseg*TAU);
  const S = [];
  for (const f of LO ? [0, 0.02, 0.07, 0.15, 0.27, 0.42, 0.6, 0.8] : [0, 0.006, 0.022, 0.05, 0.09, 0.14, 0.2, 0.28, 0.37, 0.48, 0.61, 0.76, 0.9]) S.push(f*nose.len);
  if (!LO){ const ck = nose.ck; for (const u of [0, 0.3, 0.6, 1]) S.push(ck[0] + u*(ck[1] - ck[0])); }
  // cylinder: plugs, every ≤ 6.5 m (12 m mid level); no station within 4.6 m before a plug (the shrunk variants compress that bay)
  const feat = [nose.len, s1, ...F.plugs.filter(p => p > nose.len && p < s1)].sort((a, b) => a - b), step = LO ? 14 : 12;
  for (let i = 0; i < feat.length; i++){ S.push(feat[i]); if (i + 1 < feat.length){ const a = feat[i], b = feat[i + 1], k = Math.ceil((b - a)/step);
    for (let q = 1; q < k; q++){ const s = a + (b - a)*q/k; if (F.plugs.some(p => p > s && p - s < 4.6)) continue; S.push(s); } } }
  if (F.hump){ const H = F.hump; for (let s = H.s0; s < H.s1; s += LO ? 2.5 : 1.0) S.push(s); for (let s = H.s2; s < H.s3; s += LO ? 5 : 2.5) S.push(s); S.push(H.s1, H.s2, H.s3); }
  for (const g of LO ? [0.15, 0.4, 0.65, 0.86, 1] : [0.08, 0.18, 0.3, 0.43, 0.56, 0.68, 0.79, 0.88, 0.95, 1]) S.push(s1 + g*tail.len);
  S.sort((a, b) => a - b);
  const SS = []; for (const s of S) if (!SS.length || s - SS[SS.length - 1] > 0.1) SS.push(s);
  const R = SS.map(s => { const q = fusStation(F, s); return phis.map(p => fusPt(F, q, p)); });
  G.grid(R, {closed:true, zone:s => fusZone(F, s), cap1:[COL.apu, 0], face:() => [COL.white, 6]});
  // APU exhaust: a short dark pipe out of the tail cone
  if (!LO){ const yT = F.c + tail.tipY, r = Math.min(tail.tipR, tail.tipW)*0.75; G.lathe([L - 0.05, yT, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [[0, r], [0.25, r*0.95], [0.25, r*0.7], [0.05, 0]], 10, {zone:2, face:() => [COL.apu, 0]}); }
  cockpit(G, F);
}
function wingTipDevice(G, F, side){
  if (LO === 2) return;
  const W = F.wing, z = W.tipZ, le = F.wingLE(z), c = F.wingC(z), y = F.wingY(z), sg = side;
  const T = [0, 0, sg], at = LO ? AF_T_MID : null;
  if (W.tip === 'sharklet' || W.tip === 'winglet' || W.tip === 'curved'){
    // [u (aft shift as a fraction of h), spanwise fraction, height fraction, chord fraction]; blended root, swept, canted out
    const h = W.tipH, K = W.tip === 'curved' ? [[0, 0, 0, 1], [0.06, 0.3, 0.12, 0.9], [0.18, 0.62, 0.38, 0.72], [0.38, 0.86, 0.68, 0.52], [0.62, 0.97, 0.9, 0.38], [0.8, 1.0, 1.0, 0.3]] :
      W.tip === 'sharklet' ? [[0, 0, 0, 1], [0.05, 0.28, 0.1, 0.86], [0.16, 0.56, 0.34, 0.66], [0.42, 0.78, 0.7, 0.44], [0.7, 0.9, 1.0, 0.3]] :
      [[0, 0, 0, 1], [0.08, 0.2, 0.18, 0.78], [0.3, 0.42, 0.55, 0.58], [0.62, 0.6, 1.0, 0.36]];
    const KK = LO ? [K[0], K[Math.floor(K.length/2)], K[K.length - 1]] : K;
    const secs = KK.map(k => ({s:le + k[0]*h*0.95 + c*(1 - k[3])*0.55, y:y + k[2]*h, z:sg*(z + k[1]*(F.semi - z)), c:c*k[3], tc:0.09, T:v3.norm([0, -0.35*sg*Math.min(1, k[2]*3), sg])}));
    G.foil(secs, T, {zone:1, face:() => [[1, 1, 1], 1], cap1:true, at});
  } else if (W.tip === 'scimitar'){
    // split tip (737 MAX): upper blade and a shorter lower (ventral) blade
    const up = [[0, 0, 0, 1], [0.08, 0.35, 0.18, 0.8], [0.3, 0.7, 0.55, 0.52], [0.62, 1, 1, 0.3]].map(k => ({s:le + k[0]*2.1*0.9 + c*(1 - k[3])*0.5, y:y + k[2]*2.1, z:sg*(z + k[1]*0.42), c:c*k[3], tc:0.09, T:v3.norm([0, -0.25*sg*Math.min(1, k[2]*3), sg])}));
    G.foil(LO ? [up[0], up[2], up[3]] : up, T, {zone:1, face:() => [[1, 1, 1], 1], cap1:true, at});
    const lo = [[0, 0, 0, 0.62], [0.35, 0.55, -0.55, 0.42], [0.6, 1, -1, 0.24]].map(k => ({s:le + c*0.12 + k[0]*0.9, y:y - 0.08 + k[2]*0.95, z:sg*(z + 0.05 + k[1]*0.32), c:c*k[3], tc:0.09, T:[0, 0.3*sg, sg]}));
    G.foil(LO ? [lo[0], lo[2]] : lo, T, {zone:1, face:() => [[1, 1, 1], 1], cap1:true, at});
  } else if (W.tip === 'fence'){
    const secs = [[-0.9, 0.55], [0, 1], [1.5, 0.45]].map(k => ({s:le + c*(1 - k[1])*0.75, y:y + k[0], z:sg*(z + 0.05), c:c*k[1], tc:0.07, T:[0, 0, sg]}));
    G.foil(secs, T, {zone:1, face:() => [[1, 1, 1], 1], cap0:true, cap1:true, at});
  }
}
function wings(G, F){
  const W = F.wing, zs = [W.z0, W.zk];
  if (W.tip === 'raked' && LO < 2) zs.push(W.rakeZ);
  if (!LO){ zs.push(lerp(W.zk, W.tipZ, 0.35), lerp(W.zk, W.tipZ, 0.7)); if (W.tip === 'raked') zs.push(lerp(W.rakeZ, W.tipZ, 0.55)); }
  zs.push(W.tipZ); zs.sort((a, b) => a - b);
  const inc0 = (W.inc0 ?? (W.high ? 1.5 : 2.5))*D2R, inc1 = (W.inc1 ?? -1.0)*D2R, nJ = LO === 2 ? 4 : LO === 1 ? 8 : 14;
  for (const sg of [1, -1]){
    const secs = zs.map(z => { const f = (z - W.z0)/(W.tipZ - W.z0), tc = f < 0.3 ? lerp(W.tc[0], W.tc[1], f/0.3) : lerp(W.tc[1], W.tc[2], (f - 0.3)/0.7);
      return {s:F.wingLE(z), y:F.wingY(z), z:sg*z, c:F.wingC(z), tc, inc:LO === 2 ? 0 : lerp(inc0, inc1, f)}; });
    if (W.high){ secs.unshift({s:F.wingLE(0), y:F.wingY(0), z:0, c:W.c0, tc:W.tc[0], inc:LO === 2 ? 0 : inc0}); secs.splice(1, 1); }
    // paint: slats (leading edge) darker metal, flaps / ailerons a shade darker than the wing box
    G.foil(secs, [0, 1, 0], {zone:1, cap1:W.tip === 'raked' || !W.tip || LO === 2, face:(i, j) => LO === 2 ? [COL.wing, 0] : LO === 1 ? [j === 0 || j === 7 ? COL.wingLE : j === 3 ? COL.flap : COL.wing, 0] :
      [j <= 1 || j >= nJ - 2 ? COL.wingLE : j === 6 ? COL.flap : COL.wing, 0]});
    wingTipDevice(G, F, sg);
    if (LO === 2) continue;
    if (W.strut){ const zt = W.zk*1.05, st = F.wingLE(zt) + F.wingC(zt)*0.3;
      G.foil([{s:st - 0.15, y:F.yBot + 0.25, z:sg*(F.W/2 - 0.05), c:0.22, tc:0.35}, {s:st, y:F.wingY(zt) - 0.08, z:sg*zt, c:0.22, tc:0.35}], [0, 0.9, -0.43*sg], {zone:1, face:() => [COL.white, 4]}); }
    // flap-track fairings ("canoes") under the trailing edge, reaching behind it
    if (!LO) for (let k = 0; k < F.flaps; k++){
      const z = lerp(W.z0 + 2.4, W.tipZ*0.74, F.flaps > 1 ? k/(F.flaps - 1) : 0.5); if (F.eng.z.some(e => Math.abs(e - z) < F.eng.R*1.25)) continue;
      const te = F.wingLE(z) + F.wingC(z), y = F.wingY(z), c = F.wingC(z), l = c*0.6, h = Math.min(0.42, 0.04*c + 0.1);
      G.lathe([te - l*0.62, y - 0.04, sg*z], [1, 0, 0], [0, 1, 0], [0, 0, 1], [[0, 0.02], [0.2*l, 0.7*h], [0.5*l, h], [0.8*l, 0.75*h], [l, 0.03]], 8, {zone:1, ry:1.5, rz:0.5, face:() => [COL.wing, 0]});
    }
  }
}
// turbofan nacelle (s0 = intake lip, ey = axis height, z = lateral position)
function nacelle(G, F, E, s0, ey, z, zone){
  const R = E.R, Ln = E.len, O = [s0, ey, z], X = [1, 0, 0], Y = [0, 1, 0], Z = [0, 0, 1], ry = E.flatBot ? 0.97 : 1;
  if (LO === 2){ G.lathe(O, X, Y, Z, [[0, 0], [0, 0.86*R], [0.1*Ln, R], [0.72*Ln, 0.9*R], [Ln, 0.42*R], [1.06*Ln, 0]], 5, {zone, ry, face:i => i === 0 ? [COL.fan, 0] : i >= 3 ? [COL.core, 0] : [COL.white, 10]}); return; }
  if (LO === 1){ const ce = E.longCowl ? 0.9*Ln : E.short ? 0.74*Ln : 0.6*Ln;
    G.lathe(O, X, Y, Z, [[0.07*Ln, 0], [0.07*Ln, 0.8*R], [0, 0.9*R], [0.1*Ln, R], [ce, 0.84*R], [ce, 0.6*R], [Ln, 0.44*R], [1.1*Ln, 0.03]], 10, {zone, ry,
      face:i => i === 0 ? [COL.fan, 0] : i === 1 ? [COL.lip, 0] : i <= 3 ? [COL.white, 10] : i === 4 ? [COL.duct, 0] : i === 5 ? [COL.core, 0] : [COL.plug, 0]}); return; }
  const ce = E.longCowl ? 0.9*Ln : E.short ? 0.74*Ln : 0.6*Ln, fanS = 0.085*Ln;
  const prof = [[fanS, 0], [fanS, 0.84*R], [0.03*Ln, 0.86*R], [-0.004*Ln, 0.9*R], [0, 0.955*R], [0.03*Ln, R], [0.18*Ln, 0.995*R], [0.45*Ln, 0.965*R], [ce, 0.86*R]];
  if (E.longCowl) prof.push([ce + 0.004*Ln, 0.6*R], [1.0*Ln, 0.42*R], [1.0*Ln, 0.32*R], [1.13*Ln, 0.03*R]);
  else prof.push([ce + 0.01*Ln, 0.66*R], [0.84*Ln, 0.56*R], [0.94*Ln, 0.48*R], [0.94*Ln, 0.36*R], [1.13*Ln, 0.03*R]);
  const n = prof.length, jag = {};
  if (E.chevron || F.chev){ jag[8] = 0.026*Ln; if (F.chev === 2 && !E.longCowl) jag[11] = 0.014*Ln; }
  G.lathe(O, X, Y, Z, prof, 18, {zone, ry, jag, face:(i, j) => i === 0 ? [(j & 1) ? COL.fan2 : COL.fan, 0] : i === 1 ? [COL.duct, 0] : i <= 4 ? [COL.lip, 0] : i <= 7 ? [COL.white, 10] :
    i === 8 ? [COL.duct, 0] : i === n - 2 ? [COL.plug, 0] : i === n - 3 && !E.longCowl ? [COL.duct, 0] : [COL.core, 0]});
  // spinner (pointed cone with a metallic finish)
  G.lathe([s0 + fanS, ey, z], [-1, 0, 0], Y, Z, [[0, 0.3*R], [0.14*R, 0.25*R], [0.28*R, 0.13*R], [0.36*R, 0.0]], 9, {zone, face:() => [COL.spin, 0]});
}
function engines(G, F){
  const E = F.eng;
  if (E.kind === 'nose'){
    // spinner and a two-blade propeller (blades when parked, a disc when running)
    const y = E.y;
    G.lathe([0.02, y, 0], [-1, 0, 0], [0, 1, 0], [0, 0, 1], [[0, 0.17], [0.12, 0.12], [0.24, 0]], LO ? 6 : 10, {zone:0, face:() => [[0.85, 0.85, 0.86], 0]});
    if (LO === 2) return;
    for (let b = 0; b < 2; b++){ const a = b*PI + 0.5, dy = Math.cos(a), dz = Math.sin(a), r1 = E.prop;
      const secs = [[0.12, 0.13], [r1*0.6, 0.13], [r1, 0.07]].map(q => ({s:-0.05, y:y + dy*q[0], z:dz*q[0], c:q[1], tc:0.14, T:[0.4, -dz*0.9, dy*0.9]}));
      G.foil(secs, [0.4, -dz, dy], {zone:0, face:() => [COL.prop, 7], cap1:true}); }
    G.lathe([-0.04, y, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [[0, 0], [0, E.prop], [0.03, E.prop], [0.03, 0]], LO ? 8 : 16, {zone:0, face:() => [COL.disc, 8]});
    return;
  }
  E.z.forEach((ez, k) => {
    for (const sg of [1, -1]){
      const R = E.R, Ln = E.len, z = sg*ez, ey = Array.isArray(E.y) ? E.y[k] : E.y;
      if (E.kind === 'rear'){
        const s0 = E.s0;
        if (LO === 2){ G.lathe([s0, ey, z], [1, 0, 0], [0, 1, 0], [0, 0, 1], [[0, 0], [0, 0.85*R], [0.12*Ln, R], [0.8*Ln, 0.85*R], [Ln, 0]], 5, {zone:2, face:i => i === 0 ? [COL.fan, 0] : [COL.white, 10]}); continue; }
        const prof = [[0.08*Ln, 0], [0.08*Ln, 0.8*R], [0, 0.88*R], [0.02*Ln, 0.98*R], [0.1*Ln, R], [0.6*Ln, 0.97*R], [0.92*Ln, 0.74*R], [0.95*Ln, 0.62*R], [Ln, 0.5*R], [1.1*Ln, 0.04]];
        G.lathe([s0, ey, z], [1, 0, 0], [0, 1, 0], [0, 0, 1], prof, LO ? 10 : 18, {zone:2, face:i => i === 0 ? [COL.fan, 0] : i <= 2 ? [COL.lip, 0] : i <= 5 ? [COL.white, 10] : i === 6 ? [COL.duct, 0] : [COL.core, 0]});
        // pylon to the fuselage
        G.foil([{s:s0 + Ln*0.3, y:ey, z:sg*(F.W/2*0.8), c:Ln*0.45, tc:0.12}, {s:s0 + Ln*0.32, y:ey, z:sg*(ez - R*0.8), c:Ln*0.4, tc:0.12}], [0, 1, 0], {zone:2, face:() => [COL.white, 4]});
        continue;
      }
      const s0 = F.wingLE(ez) - E.fwd;
      if (E.kind === 'prop'){
        // turboprop nacelle under the high wing: spinner, intake lip under the spinner, long nacelle reaching behind the wing
        const prof = [[0, 0.05], [0.25, 0.26], [0.62, 0.52*R*1.6], [1.0, R*0.93], [1.4, R], [Ln*0.55, R], [Ln*0.8, R*0.85], [Ln, 0.08]];
        G.lathe([s0, ey, z], [1, 0, 0], [0, 1, 0], [0, 0, 1], prof, LO === 2 ? 6 : LO ? 10 : 14, {zone:1, ry:1.22, rz:0.85, face:i => [i < 2 ? COL.spin : COL.white, i < 2 ? 0 : 4]});
        if (LO === 2) continue;
        if (!LO) G.box([s0 + 1.3, ey - R*0.95, z], [0.35, 0.12, 0.22], COL.duct, 0, 1);   // intake under the spinner
        // propeller: 6 blades (parked) and a disc (running)
        const hub = [s0 + 0.55, ey, z];
        for (let b = 0; b < 6; b++){
          const a = b/6*TAU + 0.3, dy = Math.cos(a), dz = Math.sin(a), r0 = 0.32, r1 = E.prop;
          const secs = [[r0, 0.24, 0.3], [r1*0.42, 0.34, 0.15], [r1*0.8, 0.26, -0.05], [r1, 0.1, -0.15]].map(q => ({s:hub[0] - 0.1 + q[2]*0.3, y:hub[1] + dy*q[0], z:hub[2] + dz*q[0], c:q[1], tc:0.1, T:[0.45 - q[2], -dz*0.9, dy*0.9]}));
          G.foil(LO ? [secs[0], secs[1], secs[3]] : secs, [0.4, -dz, dy], {zone:1, face:() => [COL.prop, 7], cap1:true, at:LO ? AF_T_LO : AF_T_MID});
        }
        G.lathe([hub[0], hub[1], hub[2]], [1, 0, 0], [0, 1, 0], [0, 0, 1], [[0, 0], [0, E.prop], [0.04, E.prop], [0.04, 0]], LO ? 10 : 20, {zone:1, face:() => [COL.disc, 8]});
        continue;
      }
      nacelle(G, F, E, s0, ey, z, 1);
      if (LO === 2) continue;
      // pylon: from the top of the nacelle up to the wing, reaching behind the leading edge; aft fairing under the wing
      const wy = F.wingY(ez), le = F.wingLE(ez), wc = F.wingC(ez), pc = Math.min(Ln*0.95, wc*0.55 + E.fwd*0.55);
      G.foil([{s:s0 + 0.16*Ln, y:ey + R*0.72, z, c:Ln*0.8, tc:0.09}, {s:le - E.fwd*0.5, y:wy - 0.08, z, c:pc, tc:0.09}], [0, 0, 1], {zone:1, closed:true, face:() => [COL.white, 4]});
      if (!LO){ const l = Math.min(wc*0.62, Ln*0.95), h = Math.min(0.5, 0.17*R + 0.1);
        G.lathe([le + wc - l*0.7, wy - 0.06, z], [1, 0, 0], [0, 1, 0], [0, 0, 1], [[0, 0.04], [0.15*l, 0.8*h], [0.45*l, h], [0.8*l, 0.6*h], [l, 0.03]], 8, {zone:1, ry:1.5, rz:0.5, face:() => [COL.white, 4]}); }
    }
  });
}
function tail(G, F){
  const fin = F.fin, tf = Math.tan(fin.sweep*D2R), yr = F.top - 0.35, at = LO === 1 ? AF_T_MID : null;
  const fs = LO ? [0, 0.5, 1] : [0, 0.3, 0.65, 0.9, 1];
  const secs = fs.map(f => { const c = lerp(fin.c0, fin.ct, f)*(f > 0.9 ? 1 - (f - 0.9)*1.2 : 1), h = f*fin.h; return {s:fin.s + h*tf + (f > 0.9 ? (f - 0.9)*1.2*lerp(fin.c0, fin.ct, f)*0.6 : 0), y:yr + h + 0.35*(f > 0 ? 1 : 0), z:0, c, tc:0.11}; });
  if (fin.dorsal) secs.unshift({s:fin.s - fin.dorsal, y:yr - 0.1, z:0, c:fin.c0 + fin.dorsal, tc:0.05});
  G.foil(secs, [0, 0, 1], {zone:2, cap1:true, face:() => [[1, 1, 1], 9], at});
  const tp = F.tp, tt = Math.tan(tp.sweep*D2R);
  for (const sg of [1, -1]){
    let base;
    if (tp.T) base = {s:fin.s + fin.h*tf + (fin.ct - tp.c0)*0.4, y:yr + fin.h + 0.3};
    else base = {s:tp.s, y:F.c + tp.y};
    const ff = LO ? [0, 1] : [0, 0.5, 0.92, 1];
    const secs2 = ff.map(f => { const z = f*tp.semi + (tp.T ? 0 : 0.4), c = lerp(tp.c0, tp.ct, f)*(f > 0.92 ? 0.8 : 1); return {s:base.s + z*tt + (f > 0.92 ? lerp(tp.c0, tp.ct, f)*0.12 : 0), y:base.y + z*Math.tan(tp.dih*D2R), z:sg*z, c, tc:0.1}; });
    G.foil(secs2, [0, 1, 0], {zone:2, cap1:true, face:(i, j) => [!LO && i < ff.length - 1 && (j === 6 || j === 7) ? COL.flap : COL.wing, 0], at});
  }
}
function gear(G, F){
  if (LO === 2) return;
  const GR = F.gear, N = GR.nose, nz = F.nose;
  const bellyAt = s => s < nz.len ? fusPt(F, fusStation(F, s), PI)[1] : F.yBot;
  if (LO === 1){ const bz = (s, y, z, hs, hz, r, zn) => G.box([s, r, z], [hs, r, hz], COL.tyre, 3, zn);
    bz(N.s, 0, 0, N.r*0.55, N.r*1.1, N.r, 0); G.box([N.s, (bellyAt(N.s) + N.r*2)/2, 0], [0.08, (bellyAt(N.s) - N.r*2)/2 + 0.2, 0.08], COL.strut, 3, 0);
    for (const M of GR.main) for (const sg of [1, -1]){ const hs = (M.axs || 0)*(M.ax - 1)/2 + M.r*0.9, hz = M.wpa > 1 ? (M.wsp*(M.wpa - 1) + M.r)/2 : M.r*0.35;
      bz(M.s, 0, sg*M.z, hs, hz, M.r, 1); G.box([M.s, (F.yBot + 0.4 + M.r*2)/2, sg*M.z], [0.12, (F.yBot + 0.4 - M.r*2)/2, 0.12], COL.strut, 3, 1); }
    return; }
  const nW = GR.main.reduce((a, M) => a + M.ax*M.wpa*2, 2), ws = nW > 12 ? 8 : 10;
  const wheel = (s, y, z, r, w, zn) => G.lathe([s, y, z - w/2], [0, 0, 1], [1, 0, 0], [0, 1, 0], [[0, 0], [0, 0.5*r], [0.02*w, 0.64*r], [0.14*w, 0.95*r], [0.5*w, r], [0.86*w, 0.95*r], [0.98*w, 0.64*r], [w, 0.5*r], [w, 0]], ws,
    {zone:zn, face:i => [i === 0 || i === 7 ? COL.hub : COL.tyre, 3]});
  // nose gear: oleo (chrome lower part), drag brace, twin wheels on an axle, two bay doors hanging open
  const nb = bellyAt(N.s), nr = Math.max(0.07, N.r*0.2), sa = N.s;
  G.rod([sa, N.r, 0], [sa - 0.05, N.r + (nb - N.r)*0.45, 0], nr*0.8, 6, COL.chrome, 3, 0);
  G.rod([sa - 0.05, N.r + (nb - N.r)*0.4, 0], [sa - 0.12, nb + 0.25, 0], nr, 6, COL.strut, 3, 0);
  G.rod([sa - 0.08, N.r + (nb - N.r)*0.62, 0], [sa - Math.max(0.9, (nb - N.r)*0.7), nb + 0.1, 0], nr*0.5, 6, COL.strut, 3, 0);
  if (N.n > 1){ G.rod([sa, N.r, -N.r*0.8], [sa, N.r, N.r*0.8], nr*0.6, 6, COL.strut, 3, 0); for (const sg of [1, -1]) wheel(sa, N.r, sg*N.r*0.78, N.r, N.r*0.6, 0); }
  else wheel(sa, N.r, 0, N.r, N.r*0.6, 0);
  if (F.code !== 'A'){ const dl = Math.max(0.9, nz.len*0.17), dh = Math.min(0.5, (nb - N.r*2)*0.35 + 0.12), dz = N.r*1.2 + 0.12;
    for (const sg of [1, -1]) G.box([sa - dl*0.3, nb - dh/2 + 0.05, sg*dz], [dl/2, dh/2, 0.025], COL.door, 3, 0); }
  for (const M of GR.main){
    const body = M.z < F.W/2 + 0.2;
    for (const sg of [1, -1]){
      const z = sg*M.z, ax = M.ax, axs = M.axs || 0, wpa = M.wpa, wsp = M.wsp, top = (F.wing.high ? F.yBot + 0.6 : body ? F.yBot + 0.5 : Math.min(F.wingY(M.z) - 0.1, F.yBot + 0.6) + 0.3);
      const r0 = Math.max(0.1, M.r*0.21), ya = M.r + (ax > 1 ? 0.22 : 0);
      G.rod([M.s, ya, z], [M.s, lerp(ya, top, 0.45), z], r0*0.82, 6, COL.chrome, 3, 1);
      G.rod([M.s, lerp(ya, top, 0.4), z], [M.s, top, z], r0, 6, COL.strut, 3, 1);
      // side brace (towards the fuselage) and drag brace (forward)
      if (!F.wing.high){ G.rod([M.s, lerp(ya, top, 0.62), z], [M.s + 0.2, top - 0.05, z - sg*Math.min(1.6, M.z*0.35)], r0*0.45, 6, COL.strut, 3, 1);
        G.rod([M.s, lerp(ya, top, 0.66), z], [M.s - Math.min(1.6, M.r*2.2), top, z + sg*0.1], r0*0.4, 6, COL.strut, 3, 1); }
      if (ax > 1){ G.rod([M.s - axs*(ax - 1)/2 - 0.25, ya - 0.1, z], [M.s + axs*(ax - 1)/2 + 0.25, ya - 0.1, z], r0*0.8, 6, COL.strut, 3, 1); }
      for (let a = 0; a < ax; a++){
        const s = M.s + (a - (ax - 1)/2)*axs;
        if (wpa > 1) G.rod([s, M.r, z - wsp*(wpa - 1)/2], [s, M.r, z + wsp*(wpa - 1)/2], r0*0.5, 6, COL.strut, 3, 1);
        for (let w = 0; w < wpa; w++){ const wz = wpa > 1 ? z + (w - (wpa - 1)/2)*wsp : z; wheel(s, M.r, wz, M.r, M.r*0.58, 1); }
      }
      // strut-mounted gear door on the outboard side of the leg
      if (F.mgDoor && !body){ const dh = (top - ya)*0.62, dl = Math.max(1.0, M.r*2.4); G.box([M.s - 0.05, top - dh/2 - 0.05, z + sg*(r0 + 0.12)], [dl/2, dh/2, 0.03], COL.door, 3, 1); }
    }
  }
  if (GR.pods) for (const sg of [1, -1]) G.lathe([GR.main[0].s - 3.4, F.yBot + 0.55, sg*(F.W/2 - 0.15)], [1, 0, 0], [0, 1, 0], [0, 0, 1], [[0, 0.05], [1.2, 0.55], [4.6, 0.6], [6.4, 0.05]], 12, {zone:1, ry:0.9, rz:0.75, face:() => [COL.white, 4]});
}
// wing-to-body fairing under the wing root (low-wing airliners)
function bellyFairing(G, F){
  if (F.wing.high || LO === 2) return;
  const W = F.wing, s0 = W.s - 0.14*W.c0, len = W.c0*1.36, ry = Math.min(0.4, F.H*0.065), rz = F.W*0.48;
  G.lathe([s0, F.yBot + F.H*0.16, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [[0, 0.02], [0.06*len, 0.5], [0.2*len, 0.88], [0.5*len, 1.0], [0.8*len, 0.86], [0.94*len, 0.45], [len, 0.04]], LO ? 8 : 16,
    {zone:1, ry:ry + F.H*0.16, rz, face:() => [COL.white, 4]});
}
// blade antennas on the crown and the belly, anti-collision beacon housings
function antennas(G, F){
  if (LO || F.code === 'A') return;
  const L = F.L, k = Math.min(1, F.H/4), blade = (s, up, h, c) => { const y0 = up ? F.top - 0.04 : F.yBot + 0.04, d = up ? 1 : -1;
    G.foil([{s, y:y0, z:0, c, tc:0.14}, {s:s + h*0.55, y:y0 + d*h, z:0, c:c*0.5, tc:0.14}], [0, 0, 1], {zone:fusZone(F, s), cap1:true, face:() => [COL.ant, 0], at:AF_T_LO}); };
  blade(F.nose.len + 1.2, true, 0.32*k, 0.42*k); blade(F.wing.s + F.wing.c0*0.2, true, 0.36*k, 0.5*k); blade(F.L - F.tail.len - 2.0, true, 0.3*k, 0.4*k);
  blade(F.nose.len + 2.6, false, 0.28*k, 0.36*k); blade(F.wing.s + F.wing.c0 + 2.0, false, 0.3*k, 0.4*k);
}
function buildFamily(F, lvl){
  const G = new GB(); LO = lvl | 0;
  try { fuselage(G, F); bellyFairing(G, F); wings(G, F); engines(G, F); tail(G, F); gear(G, F); antennas(G, F); } finally { LO = 0; }
  const g = G.geometry(); g.computeBoundingSphere();
  (F.trisL || (F.trisL = []))[lvl | 0] = G.P.length/9; if (!lvl) F.tris = G.P.length/9;
  return g;
}

/* ---------------------------------------------------------------- materials ---------------------------------------------- */
// One material per family (same program; per-family uniforms for the painted fuselage details). Instance attributes: iA (livery A
// + propeller running), iB (livery B), iX (stretch F / A, gear down, body tint (negative: freighter)), iC (livery style).
const AIR_VS_DECL = '#include <common>\nattribute float lv;\nattribute float st;\nattribute vec4 iA;\nattribute vec3 iB;\nattribute vec4 iX;\n';
const AIR_VS_POS = '#include <begin_vertex>\nfloat lvj = floor(lv + 0.5);\ntransformed.x -= (st > 0.5 ? iX.x : 0.0) + (st > 1.5 ? iX.y : 0.0);\n' +
  'if ((lvj == 3.0 && iX.z < 0.5) || (lvj == 7.0 && iA.w > 0.5) || (lvj == 8.0 && iA.w < 0.5)) transformed = vec3(0.0);\n';
const AIR_FS_DECL = '#include <common>\nuniform float uNight;\nuniform vec4 uWin;\nuniform vec4 uWin2;\nuniform vec4 uWinP;\nuniform vec4 uDoor[10];\nuniform vec4 uFrt;\n' +
  'uniform vec4 uBody;\nuniform vec4 uPaint;\nuniform vec4 uFin;\nuniform vec4 uFin2;\nvarying vec4 vE;\nvarying vec4 vMp;\nvarying vec3 vLA;\nvarying vec3 vLB;\nvarying vec2 vSt;\n' +
  'float zsh(float s){ return (s >= uFin2.z ? vSt.x : 0.0) + (s >= uFin2.w ? vSt.y : 0.0); }\n' +
  'float rbox(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }\n' +
  // cabin window row: band [y0, y1], windows from s0 to s1 (post-stretch), returns coverage (filtered to the mean when sub-pixel)
  'float winRow(float s, float y, float s0, float s1, float y0, float y1, float px){\n' +
  '  float P = uWinP.x, yc = (y0 + y1)*0.5, hh = min(uWinP.z, (y1 - y0)*0.5);\n' +
  '  float u = (fract((s - s0)/P) - 0.5)*P;\n' +
  '  float m = 1.0 - smoothstep(-px*0.6, px*0.6, rbox(vec2(u, y - yc), vec2(uWinP.y, hh), uWinP.w));\n' +
  '  float avg = (1.0 - smoothstep(hh - px*0.5, hh + px*0.5, abs(y - yc)))*(2.0*uWinP.y/P)*0.85;\n' +
  '  m = mix(m, avg, smoothstep(0.12*P, 0.45*P, px));\n' +
  '  return m*smoothstep(s0 - px, s0 + px, s)*(1.0 - smoothstep(s1 - px, s1 + px, s));\n}\n';
const AIR_FS_PAINT = '#include <emissivemap_fragment>\n' +
  'float lvf = floor(vE.x + 0.5);\nvec3 dc = diffuseColor.rgb;\n' +
  'if (lvf > 5.5 && lvf < 6.5){\n' +
  '  float s = -vMp.x, y = vMp.y; vec2 fw = fwidth(vMp.xy); float px = clamp(max(fw.x, fw.y), 0.002, 4.0);\n' +
  '  float dF = vSt.x, dA = vSt.y, sh = dF + dA, cs = floor(vE.z + 0.5), bs = floor(vE.w + 0.5), frt = step(vE.y, -0.5);\n' +
  '  float fl = uBody.w, yb = uBody.x, yc = uBody.y;\n' +
  // belly: livery B or light grey below a line on the lower lobe
  '  if (bs > 0.5){ float yl = yb + (yc - yb)*0.5; float k = 1.0 - smoothstep(yl - px, yl + px, y); dc = mix(dc, bs < 1.5 ? vLB : vec3(0.66, 0.68, 0.70)*uBody.z, k); }\n' +
  // cheatline: 1 band, 2 band + pinstripe, 3 band sweeping up towards the fin, 4 window-line band
  '  if (cs > 0.5){\n' +
  '    float sA = uPaint.z, sB = uPaint.w + sh, y0 = fl + uPaint.x, y1 = fl + uPaint.y, k = 0.0;\n' +
  '    if (cs > 3.5){ y0 = uWin.z - 0.13; y1 = uWin.w + 0.1; sB = uWin.y + sh + 1.0; }\n' +
  '    if (cs > 2.5 && cs < 3.5){ float sw = max(0.0, s - (uFin.x + sh - 0.8*uFin2.x)); y0 += sw*0.07; y1 += sw*0.16; sB = uFin.x + sh + uFin2.x; }\n' +
  '    k = smoothstep(y0 - px, y0 + px, y)*(1.0 - smoothstep(y1 - px, y1 + px, y))*smoothstep(sA - px, sA + px, s + (y - y0)*0.6)*(1.0 - smoothstep(sB - px, sB + px, s));\n' +
  '    dc = mix(dc, vLB, k);\n' +
  '    if (cs > 1.5 && cs < 2.5){ float p0 = y0 - 0.17, p1 = y0 - 0.09; float kp = smoothstep(p0 - px, p0 + px, y)*(1.0 - smoothstep(p1 - px, p1 + px, y))*smoothstep(sA - px, sA + px, s)*(1.0 - smoothstep(sB - px, sB + px, s)); dc = mix(dc, vLA, kp); }\n' +
  '  }\n' +
  // cabin windows (not on freighters), doors (outline + door window), lower-deck cargo doors (starboard), freighter main-deck door (port)
  '  float ww = 0.0;\n' +
  '  if (frt < 0.5){ if (uWin.y > uWin.x) ww = winRow(s, y, uWin.x + zsh(uWin.x), uWin.y + zsh(uWin.y), uWin.z, uWin.w, px);\n' +
  '    if (uWin2.y > uWin2.x) ww = max(ww, winRow(s, y, uWin2.x + zsh(uWin2.x), uWin2.y + zsh(uWin2.y), uWin2.z, uWin2.w, px)); }\n' +
  '  float dl = 0.0, dwin = 0.0, lw = clamp(0.05/px, 0.0, 1.0);\n' +
  '  for (int i = 0; i < 10; i++){ vec4 D = uDoor[i]; if (D.z == 0.0) continue; if (D.z < 0.0 && vMp.z < 0.0) continue; if (frt > 0.5 && i > 0 && D.z > 0.0) continue;\n' +
  '    float sc = D.x + zsh(D.x), hw = abs(D.z);\n' +
  '    vec2 q = vec2(s - sc, y - D.y); float d = rbox(q, vec2(hw, D.w), min(0.16, hw*0.3));\n' +
  '    dl = max(dl, 1.0 - smoothstep(0.012, 0.012 + px, abs(d)));\n' +
  '    if (D.z > 0.0 && abs(q.y) < D.w + 0.45){ ww *= smoothstep(hw + 0.12, hw + 0.3, abs(q.x)); dwin = max(dwin, 1.0 - smoothstep(-px*0.6, px*0.6, rbox(q - vec2(0.0, D.w*0.42), vec2(0.09, 0.12), 0.06))); }\n' +
  '  }\n' +
  '  if (frt > 0.5 && uFrt.z > 0.0 && vMp.z < 0.0){ float sc = uFrt.x + zsh(uFrt.x); float d = rbox(vec2(s - sc, y - uFrt.y), uFrt.zw, 0.2); dl = max(dl, 1.0 - smoothstep(0.015, 0.015 + px, abs(d))); }\n' +
  '  dc = mix(dc, vec3(0.33, 0.35, 0.38), dl*0.6*lw);\n' +
  '  dc = mix(dc, vec3(0.09, 0.11, 0.14), max(ww, dwin*lw));\n' +
  '  totalEmissiveRadiance += (ww + dwin*lw*0.6)*uNight*vec3(1.0, 0.78, 0.5)*1.15;\n' +
  '} else if (lvf > 8.5 && lvf < 9.5){\n' +
  // fin: pattern in fin coordinates (v up the fin, u along the chord) + floodlights from the stabilisers at night
  '  float sh = vSt.x + vSt.y; vec2 fw = fwidth(vMp.xy); float px = clamp(max(fw.x, fw.y)/uFin.z, 0.0005, 1.0);\n' +
  '  float v = (vMp.y - uFin.y)/uFin.z, vc = clamp(v, 0.0, 1.0), sLE = uFin.x + sh + vc*uFin.z*uFin.w, ch = mix(uFin2.x, uFin2.y, vc), u = (-vMp.x - sLE)/ch;\n' +
  '  float fp = floor(vMp.w + 0.5); vec3 wt = vec3(0.95)*uBody.z;\n' +
  '  if (fp > 0.5 && fp < 1.5){ float e = vc + u*0.5 - 0.62; dc = mix(wt, vLA, smoothstep(-px, px, e)); dc = mix(dc, vLB, 1.0 - smoothstep(0.03 - px, 0.03 + px, abs(e + 0.06))); }\n' +
  '  else if (fp > 1.5 && fp < 2.5){ float k = max(smoothstep(0.46 - px, 0.46 + px, v)*(1.0 - smoothstep(0.58 - px, 0.58 + px, v)), smoothstep(0.64 - px, 0.64 + px, v)*(1.0 - smoothstep(0.69 - px, 0.69 + px, v))); dc = mix(dc, vLB, k); }\n' +
  '  else if (fp > 2.5 && fp < 3.5){ dc = mix(dc, vLB, smoothstep(0.74 - px, 0.74 + px, v + u*0.12)); }\n' +
  '  else if (fp > 3.5){ float f = fract((v - u*0.55)*2.6); dc = mix(dc, vLB, (smoothstep(0.0, px*2.6, f) - smoothstep(0.24, 0.24 + px*2.6, f))*step(0.18, v)); }\n' +
  '  dc *= 1.0 - 0.12*(1.0 - smoothstep(0.004, 0.004 + px*0.5, abs(u - 0.7)))*clamp(0.02/px, 0.0, 1.0);\n' +
  '  totalEmissiveRadiance += uNight*dc*(0.06 + 0.62*pow(1.0 - vc, 2.2));\n' +
  '} else if (lvf > 10.5 && lvf < 11.5){ totalEmissiveRadiance += uNight*vec3(0.05, 0.07, 0.09); }\n' +
  'totalEmissiveRadiance += uNight*dc*0.13;\n' +
  'diffuseColor.rgb = dc;\n';
function famUniforms(F){
  const v4 = (a, b, c, d) => new THREE.Vector4(a || 0, b || 0, c || 0, d || 0), U = {uWin:{value:v4()}, uWin2:{value:v4()}, uWinP:{value:v4(0.533, 0.12, 0.17, 0.08)},
    uDoor:{value:Array.from({length:10}, () => v4())}, uFrt:{value:v4()}, uBody:{value:v4(1.7, 3.8, 1, 3.3)}, uPaint:{value:v4(0.45, 0.72, 4, 30)}, uFin:{value:v4(28, 5.5, 6, 0.8)}, uFin2:{value:v4(6, 2, 10, 25)}};
  if (!F) return U;
  const w = F.wins && F.wins[0], w2 = F.wins2 && F.wins2[0], wp = F.win || [0.533, 0.12, 0.17, 0.08], kc = 0.5 + (F.xs ? F.xs[0] : 0)/F.H;
  if (w) U.uWin.value.set(w[0], w[1], F.floor + w[2], F.floor + w[3]);
  if (w2) U.uWin2.value.set(w2[0], w2[1], F.floor2 + w2[2], F.floor2 + w2[3]);
  U.uWinP.value.set(wp[0], wp[1], wp[2], wp[3]);
  const D = [], dw = F.door || [1, 1.9];
  for (const s of F.doors || []) D.push([s, F.floor + dw[1]/2 + 0.02, dw[0]/2, dw[1]/2]);
  for (const s of F.doors2 || []) D.push([s, F.floor2 + dw[1]/2 + 0.02, dw[0]/2, dw[1]/2]);
  const cg = F.cargo || [0, 0];
  if (cg[0] > 0 && D.length < 10){ const yc = F.yBot + 0.32 + cg[1]/2, te = F.wing.s + F.wing.c0;
    D.push([lerp(F.doors[0] || F.nose.len, F.wing.s, 0.62), yc, -cg[0]/2, cg[1]/2]);
    if (D.length < 10) D.push([lerp(te, F.L - F.tail.len, 0.3), yc, -cg[0]/2, cg[1]/2]); }
  D.slice(0, 10).forEach((d, i) => U.uDoor.value[i].set(d[0], d[1], d[2], d[3]));
  const fr = F.frt || [0, 0, 0]; if (fr[1] > 0) U.uFrt.value.set(fr[0], F.floor + fr[2]/2 + 0.05, fr[1]/2, fr[2]/2);
  U.uBody.value.set(F.yBot, F.yBot + F.H*kc, 1, F.floor);
  U.uPaint.value.set(F.cheat[0], F.cheat[1], F.nose.len*0.55, F.L - F.tail.len*0.3);
  U.uFin.value.set(F.fin.s, F.top - 0.35, F.fin.h, Math.tan(F.fin.sweep*D2R));
  U.uFin2.value.set(F.fin.c0, F.fin.ct, F.plugs[0], F.plugs[1]);
  return U;
}
function airMatCompile(sh){
  const U = this.userData.U;
  sh.uniforms.uNight = NIGHT.uNight; for (const k in U) sh.uniforms[k] = U[k];
  sh.vertexShader = sh.vertexShader.replace('#include <common>', AIR_VS_DECL + 'attribute float iC;\nvarying vec4 vE;\nvarying vec4 vMp;\nvarying vec3 vLA;\nvarying vec3 vLB;\nvarying vec2 vSt;\n')
    .replace('#include <color_vertex>', '#include <color_vertex>\nfloat lvi = floor(lv + 0.5);\nfloat bt = abs(iX.w);\n' +
      'float sty = floor(iC + 0.5), cst = mod(sty, 5.0), bst = mod(floor(sty/5.0), 3.0), est = mod(floor(sty/15.0), 3.0), fst = floor(sty/45.0);\n' +
      'vE = vec4(lvi, iX.w < 0.0 ? -1.0 : 1.0, cst, bst); vLA = iA.rgb; vLB = iB; vSt = iX.xy;\n' +
      'if (lvi == 1.0 || lvi == 9.0) vColor = iA.rgb; else if (lvi == 2.0) vColor = iB; else if (lvi == 4.0 || lvi == 6.0) vColor *= bt;\n' +
      'else if (lvi == 10.0) vColor = est < 0.5 ? iB : est < 1.5 ? iA.rgb : vec3(0.95)*bt;\n')
    .replace('#include <begin_vertex>', AIR_VS_POS + 'vMp = vec4(transformed, fst);\n');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', AIR_FS_DECL).replace('#include <emissivemap_fragment>', AIR_FS_PAINT);
}
function famMat(F){
  if (F && F._mat) return F._mat;
  const m = new THREE.MeshLambertMaterial({vertexColors:true});
  m.userData.U = famUniforms(F); m.onBeforeCompile = airMatCompile; m.extensions = {derivatives:true};
  if (F) F._mat = m;
  return m;
}
const matAir = famMat(null);
const matAirDepth = new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking});
matAirDepth.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <common>', AIR_VS_DECL).replace('#include <begin_vertex>', AIR_VS_POS); };
// invented liveries: [tail / livery A, cheatline + engines / livery B, body tint (, style)]
const LIVERIES = [
  [[0.10, 0.22, 0.52], [0.10, 0.22, 0.52], 1.0], [[0.72, 0.12, 0.14], [0.96, 0.96, 0.97], 1.0], [[0.05, 0.50, 0.52], [0.05, 0.50, 0.52], 0.99],
  [[0.90, 0.62, 0.12], [0.55, 0.57, 0.6], 1.0], [[0.12, 0.38, 0.22], [0.96, 0.96, 0.97], 0.97], [[0.38, 0.18, 0.48], [0.38, 0.18, 0.48], 1.0],
  [[0.08, 0.12, 0.25], [0.78, 0.62, 0.25], 0.98], [[0.35, 0.62, 0.86], [0.35, 0.62, 0.86], 1.0], [[0.52, 0.10, 0.16], [0.52, 0.10, 0.16], 0.96],
  [[0.92, 0.42, 0.10], [0.92, 0.42, 0.10], 1.0], [[0.22, 0.24, 0.27], [0.96, 0.96, 0.97], 0.93], [[0.80, 0.14, 0.36], [0.96, 0.96, 0.97], 1.0]];
// livery styles (invented patterns, no real schemes): cheatline 0 none / 1 band / 2 band + pinstripe / 3 sweep to the fin / 4 window band,
// belly 0 white / 1 livery B / 2 grey, engines 0 livery B / 1 livery A / 2 white, fin 0 plain / 1 diagonal split / 2 bands / 3 tip / 4 stripes
const LIV_STYLE = [[1, 0, 0, 0], [0, 0, 1, 1], [3, 1, 0, 0], [2, 2, 1, 2], [0, 0, 2, 3], [4, 0, 0, 0], [1, 0, 1, 2], [3, 0, 0, 0], [1, 2, 0, 0],
  [0, 1, 0, 1], [0, 0, 1, 3], [0, 0, 1, 4], [3, 0, 1, 2], [1, 0, 0, 3], [2, 2, 0, 0], [1, 0, 1, 2], [3, 1, 0, 3], [2, 0, 1, 1]];
const livStyle = (liv, L) => { const q = L[3] || LIV_STYLE[liv % LIV_STYLE.length]; return q[0] + 5*q[1] + 15*q[2] + 45*q[3]; };
// one InstancedMesh per family and level of detail with its own instance attributes
function familyMesh(F, cap, lvl){
  const key = '_arr' + (lvl | 0);
  if (!F[key]){ const g0 = buildFamily(F, lvl); F[key] = ['position', 'normal', 'color', 'lv', 'st'].map(k => [k, g0.attributes[k].array, g0.attributes[k].itemSize]); F[key].index = g0.index.array; g0.dispose(); }
  const g = new THREE.BufferGeometry(); for (const [k, a, n] of F[key]) g.setAttribute(k, new THREE.BufferAttribute(a, n));
  g.setIndex(new THREE.BufferAttribute(F[key].index, 1));
  const iA = new THREE.InstancedBufferAttribute(new Float32Array(cap*4), 4), iB = new THREE.InstancedBufferAttribute(new Float32Array(cap*3), 3), iX = new THREE.InstancedBufferAttribute(new Float32Array(cap*4), 4), iC = new THREE.InstancedBufferAttribute(new Float32Array(cap), 1);
  iA.setUsage(THREE.DynamicDrawUsage); iX.setUsage(THREE.DynamicDrawUsage); iB.setUsage(THREE.DynamicDrawUsage); iC.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('iA', iA); g.setAttribute('iB', iB); g.setAttribute('iX', iX); g.setAttribute('iC', iC);
  const im = new THREE.InstancedMesh(g, famMat(F), cap);
  im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  im.customDepthMaterial = matAirDepth; im.castShadow = (lvl | 0) < 2; im.receiveShadow = false; im.frustumCulled = false;
  const zero = new THREE.Matrix4().makeScale(0, 0, 0); for (let i = 0; i < cap; i++) im.setMatrixAt(i, zero);
  im.count = cap;
  return im;
}
function setLivery(im, i, liv, v, gearDown, running){
  const A = im.geometry.attributes.iA, B = im.geometry.attributes.iB, X = im.geometry.attributes.iX, C = im.geometry.attributes.iC, L = LIVERIES[liv % LIVERIES.length];
  A.setXYZW(i, L[0][0], L[0][1], L[0][2], running ? 1 : 0); B.setXYZ(i, L[1][0], L[1][1], L[1][2]);
  X.setXYZW(i, v.dF, v.dA, gearDown ? 1 : 0, (v.freighter ? -1 : 1)*L[2]);
  if (C) { C.setX(i, livStyle(liv % LIVERIES.length, L)); C.needsUpdate = true; }
  A.needsUpdate = B.needsUpdate = X.needsUpdate = true;
}

/* ---------------------------------------------------------------- airport: runways, taxiway graph ------------------------ */
// segregated runway use at Changi, direction 02: arrivals on 02L (west runway), departures from 02C (centre runway)
function rwInfo(r){
  let S = r.a, N = r.b; if (S[1] > N[1]){ const t = S; S = N; N = t; }
  const L = Math.hypot(N[0] - S[0], N[1] - S[1]), u = [(N[0] - S[0])/L, (N[1] - S[1])/L];
  return {S, N, L, u, e:[u[1], -u[0]], hdg:Math.atan2(u[1], u[0]), sig:p => (p[0] - S[0])*u[0] + (p[1] - S[1])*u[1], off:p => (p[0] - S[0])*u[1] - (p[1] - S[1])*u[0], at:s => [S[0] + u[0]*s, S[1] + u[1]*s]};
}
// planar graph from the OSM taxiway centrelines: split at crossings, snap dead ends onto nearby lines (T-junctions), runways as edges
function buildGraph(lines, rws){
  const segs = [];
  lines.forEach((l, li) => { const P = l.P, n = P.length >> 1; for (let i = 0; i < n - 1; i++){ const ax = P[2*i], ay = P[2*i + 1], bx = P[2*i + 2], by = P[2*i + 3]; if (Math.hypot(bx - ax, by - ay) < 0.05) continue; segs.push({ax, ay, bx, by, rw:-1, cuts:[0, 1], fa:i === 0, fb:i === n - 2, li}); } });
  rws.forEach((r, k) => segs.push({ax:r.S[0], ay:r.S[1], bx:r.N[0], by:r.N[1], rw:k, cuts:[0, 1], fa:false, fb:false, li:-1 - k}));
  const CS = 60, grid = new Map(), cell = (x, y) => Math.floor(x/CS)*65536 + Math.floor(y/CS);
  segs.forEach((g, k) => { const x0 = Math.floor(Math.min(g.ax, g.bx)/CS), x1 = Math.floor(Math.max(g.ax, g.bx)/CS), y0 = Math.floor(Math.min(g.ay, g.by)/CS), y1 = Math.floor(Math.max(g.ay, g.by)/CS);
    for (let i = x0; i <= x1; i++) for (let j = y0; j <= y1; j++){ const c = i*65536 + j; let L = grid.get(c); if (!L) grid.set(c, L = []); L.push(k); } });
  // crossings
  for (const [c, L] of grid) for (let a = 0; a < L.length; a++) for (let b = a + 1; b < L.length; b++){
    const g = segs[L[a]], h = segs[L[b]]; if (g.li === h.li) continue;
    const rx = g.bx - g.ax, ry = g.by - g.ay, sx = h.bx - h.ax, sy = h.by - h.ay, d = rx*sy - ry*sx; if (Math.abs(d) < 1e-9) continue;
    const qx = h.ax - g.ax, qy = h.ay - g.ay, t = (qx*sy - qy*sx)/d, u = (qx*ry - qy*rx)/d;
    if (t < -1e-6 || t > 1 + 1e-6 || u < -1e-6 || u > 1 + 1e-6) continue;
    const px = g.ax + rx*t, py = g.ay + ry*t; if (cell(px, py) !== c) continue;
    g.cuts.push(clamp(t, 0, 1)); h.cuts.push(clamp(u, 0, 1));
  }
  // dead ends snapped onto the nearest other line (gaps of a few metres; up to 45 m onto a runway centreline)
  const ends = new Map(), ek = (x, y) => Math.round(x*2)*1e6 + Math.round(y*2);
  for (const g of segs){ let k = ek(g.ax, g.ay); ends.set(k, (ends.get(k) || 0) + 1); k = ek(g.bx, g.by); ends.set(k, (ends.get(k) || 0) + 1); }
  const conn = [];
  for (const g of segs){ if (g.rw >= 0) continue; for (let side = 0; side < 2; side++){
    const x = side ? g.bx : g.ax, y = side ? g.by : g.ay, isEnd = side ? g.fb : g.fa;
    if (!isEnd || ends.get(ek(x, y)) > 1) continue;
    let best = null;
    for (let i = Math.floor((x - 45)/CS); i <= Math.floor((x + 45)/CS); i++) for (let j = Math.floor((y - 45)/CS); j <= Math.floor((y + 45)/CS); j++){ const L = grid.get(i*65536 + j); if (!L) continue;
      for (const k of L){ const h = segs[k]; if (h.li === g.li) continue; const dx = h.bx - h.ax, dy = h.by - h.ay, l2 = dx*dx + dy*dy, t = clamp(((x - h.ax)*dx + (y - h.ay)*dy)/l2, 0, 1), px = h.ax + dx*t, py = h.ay + dy*t, d = Math.hypot(px - x, py - y);
        if (d > (h.rw >= 0 ? 45 : 9)) continue; if (!best || d < best.d) best = {h, t, d, px, py}; } }
    if (best){ best.h.cuts.push(best.t); if (best.d > 0.4) conn.push([x, y, best.px, best.py]); }
  } }
  // nodes (merged within ~1.2 m) and edges
  const NX = [], NY = [], nmap = new Map(), node = (x, y) => { const i = Math.round(x/1.2), j = Math.round(y/1.2);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++){ const id = nmap.get((i + a)*100000 + j + b); if (id !== undefined && Math.hypot(NX[id] - x, NY[id] - y) < 1.25) return id; }
    const id = NX.length; NX.push(x); NY.push(y); nmap.set(i*100000 + j, id); return id; };
  const E = [], eset = new Set(), addE = (a, b, rw) => { if (a === b) return; const k = a < b ? a*1e6 + b : b*1e6 + a; if (eset.has(k)) return; eset.add(k); E.push({a, b, rw, len:Math.hypot(NX[b] - NX[a], NY[b] - NY[a])}); };
  for (const g of segs){ const cs = g.cuts; if (cs.length > 2) cs.sort((a, b) => a - b); let prev = -1, lt = -1;
    for (let q = 0; q < cs.length; q++){ const t = cs[q]; if (t - lt < 1e-6) continue; lt = t; const id = node(g.ax + (g.bx - g.ax)*t, g.ay + (g.by - g.ay)*t); if (prev >= 0) addE(prev, id, g.rw); prev = id; } }
  for (const c of conn) addE(node(c[0], c[1]), node(c[2], c[3]), -1);
  const nN = NX.length, adj = Array.from({length:nN}, () => []);
  E.forEach((e, k) => { adj[e.a].push(k); adj[e.b].push(k); });
  // main component
  const comp = new Int32Array(nN).fill(-1); let best = -1, bestN = 0;
  for (let i = 0, c = 0; i < nN; i++){ if (comp[i] >= 0) continue; let n = 0; const st = [i]; comp[i] = c; while (st.length){ const v = st.pop(); n++; for (const k of adj[v]){ const e = E[k], w = e.a === v ? e.b : e.a; if (comp[w] < 0){ comp[w] = c; st.push(w); } } } if (n > bestN){ bestN = n; best = c; } c++; }
  const rwNode = new Int8Array(nN).fill(-1); for (const e of E) if (e.rw >= 0){ rwNode[e.a] = e.rw; rwNode[e.b] = e.rw; }
  // edge grid for spatial queries
  const eg = new Map(); E.forEach((e, k) => { if (comp[e.a] !== best) return; const x0 = Math.floor(Math.min(NX[e.a], NX[e.b])/CS), x1 = Math.floor(Math.max(NX[e.a], NX[e.b])/CS), y0 = Math.floor(Math.min(NY[e.a], NY[e.b])/CS), y1 = Math.floor(Math.max(NY[e.a], NY[e.b])/CS);
    for (let i = x0; i <= x1; i++) for (let j = y0; j <= y1; j++){ const c = i*65536 + j; let L = eg.get(c); if (!L) eg.set(c, L = []); L.push(k); } });
  return {NX, NY, E, adj, comp, main:best, nMain:bestN, rwNode, eg, CS, use:new Map()};
}
const gNodeP = (G, v) => [G.NX[v], G.NY[v]];
const gOther = (G, k, v) => G.E[k].a === v ? G.E[k].b : G.E[k].a;
// edges near a point (main component)
function gNearEdges(G, x, y, r){ const out = new Set(); for (let i = Math.floor((x - r)/G.CS); i <= Math.floor((x + r)/G.CS); i++) for (let j = Math.floor((y - r)/G.CS); j <= Math.floor((y + r)/G.CS); j++){ const L = G.eg.get(i*65536 + j); if (L) for (const k of L) out.add(k); } return out; }
function gProject(G, k, x, y){ const e = G.E[k], ax = G.NX[e.a], ay = G.NY[e.a], dx = G.NX[e.b] - ax, dy = G.NY[e.b] - ay, l2 = dx*dx + dy*dy || 1, t = clamp(((x - ax)*dx + (y - ay)*dy)/l2, 0, 1); return {k, t, x:ax + dx*t, y:ay + dy*t, d:Math.hypot(ax + dx*t - x, ay + dy*t - y)}; }
// binary heap
function Heap(){ this.k = []; this.v = []; }
Heap.prototype.push = function(key, val){ const K = this.k, V = this.v; let i = K.length; K.push(key); V.push(val); while (i > 0){ const p = (i - 1) >> 1; if (K[p] <= key) break; K[i] = K[p]; V[i] = V[p]; i = p; } K[i] = key; V[i] = val; };
Heap.prototype.pop = function(){ const K = this.k, V = this.v, top = V[0], last = K.length - 1, lk = K[last], lv = V[last]; K.pop(); V.pop(); if (last > 0){ let i = 0; for (;;){ let c = 2*i + 1; if (c >= last) break; if (c + 1 < last && K[c + 1] < K[c]) c++; if (K[c] >= lk) break; K[i] = K[c]; V[i] = V[c]; i = c; } K[i] = lk; V[i] = lv; } return top; };
// route search over directed edges with a turn limit (aircraft cannot turn more than ~100° at a junction).
// start: {v, hx, hy} (node + heading); goal: {v} | {k, t} (point on an edge). Returns the node list incl. the start node, or null.
function gRoute(G, start, goal, opt){
  opt = opt || {};
  const E = G.E, NX = G.NX, NY = G.NY, maxTurn = Math.cos((opt.maxTurn || 100)*D2R), dist = new Map(), prev = new Map(), H = new Heap();
  if (!G.ux){ G.ux = new Float64Array(E.length); G.uy = new Float64Array(E.length); E.forEach((e, k) => { const dx = NX[e.b] - NX[e.a], dy = NY[e.b] - NY[e.a], l = Math.hypot(dx, dy) || 1; G.ux[k] = dx/l; G.uy[k] = dy/l; }); }
  const gx = goal.v !== undefined ? NX[goal.v] : NX[E[goal.k].a] + (NX[E[goal.k].b] - NX[E[goal.k].a])*goal.t, gy = goal.v !== undefined ? NY[goal.v] : NY[E[goal.k].a] + (NY[E[goal.k].b] - NY[E[goal.k].a])*goal.t;
  const hh = v => Math.hypot(NX[v] - gx, NY[v] - gy);
  const cost = (k, from, to) => { const e = E[k]; let c = e.len*(e.rw >= 0 ? 40 : 1);
    if (G.rwNode[to] >= 0 && goal.v !== to && !opt.rwOK) c += 2500;
    const u = G.use.get(k); if (u){ const fwd = e.a === from; if ((fwd && u.r > 0) || (!fwd && u.f > 0)) c *= 6; else c *= 1.15; }
    return c; };
  let bestGoal = null, bestCost = Infinity;
  const expand = (v, hx, hy, c, st) => {
    const hl = Math.hypot(hx, hy) || 1; hx /= hl; hy /= hl;
    if (goal.v !== undefined){ if (v === goal.v && c < bestCost){ bestCost = c; bestGoal = {st, v, extra:null}; } }
    else { const e = E[goal.k]; if (v === e.a || v === e.b){ const fw = v === e.a, dot = (fw ? G.ux[goal.k] : -G.ux[goal.k])*hx + (fw ? G.uy[goal.k] : -G.uy[goal.k])*hy;
      if (st === null || dot >= maxTurn){ const cc = c + e.len*(fw ? goal.t : 1 - goal.t); if (cc < bestCost){ bestCost = cc; bestGoal = {st, v, extra:goal.k}; } } } }
    const A = G.adj[v];
    for (let q = 0; q < A.length; q++){ const k = A[q]; if (st !== null && (st >> 1) === k) continue; const e = E[k], fw = e.a === v, w = fw ? e.b : e.a;
      if ((fw ? G.ux[k] : -G.ux[k])*hx + (fw ? G.uy[k] : -G.uy[k])*hy < maxTurn) continue;
      if (opt.noRw && e.rw >= 0) continue;
      const nc = c + cost(k, v, w), s2 = k*2 + (fw ? 0 : 1);
      if (nc < (dist.get(s2) ?? Infinity)){ dist.set(s2, nc); prev.set(s2, st); H.push(nc + hh(w), s2); } }
  };
  expand(start.v, start.hx, start.hy, 0, null);
  let it = 0;
  while (H.k.length && it++ < 60000){
    const f = H.k[0], st = H.pop(), k = st >> 1, e = E[k], v = (st & 1) ? e.a : e.b, g = dist.get(st);
    if (f > g + hh(v) + 1e-6) continue; if (f >= bestCost) break;
    const u = v === e.a ? e.b : e.a;
    expand(v, NX[v] - NX[u], NY[v] - NY[u], g, st);
  }
  if (!bestGoal) return null;
  const nodes = [bestGoal.v]; let st = bestGoal.st;
  while (st !== null && st !== undefined){ const k = st >> 1, e = E[k], v = (st & 1) ? e.a : e.b; nodes.push(v === e.a ? e.b : e.a); st = prev.get(st); }
  nodes.reverse();
  const out = {nodes, cost:bestCost, edges:[]};
  for (let i = 1; i < nodes.length; i++){ const a = nodes[i - 1], b = nodes[i]; for (const k of G.adj[a]) if (gOther(G, k, a) === b){ out.edges.push(k); break; } }
  if (bestGoal.extra !== null) out.goalEdge = bestGoal.extra;
  return out;
}
// mark / unmark the directed edges of a route as in use (routes of other aircraft avoid running against them)
function gRelease(G, route, upto){ if (!route) return; let i = route.rel || 0; for (; i < Math.min(upto, route.edges.length); i++){ const k = route.edges[i], e = G.E[k], fwd = e.a === route.nodes[i], u = G.use.get(k); if (!u) continue; if (fwd) u.f--; else u.r--; if (u.f <= 0 && u.r <= 0) G.use.delete(k); } route.rel = Math.max(route.rel || 0, i); }
// first edge of a route (from index i0) that other traffic uses in the opposite direction
function gHeadOn(G, route, i0){ for (let i = i0 || 0; i < route.edges.length; i++){ const k = route.edges[i], u = G.use.get(k); if (!u) continue; const fwd = G.E[k].a === route.nodes[i]; if ((fwd && u.r > 0) || (!fwd && u.f > 0)) return i; } return -1; }
function gUse(G, route, sgn){ if (!route) return; if (sgn < 0){ gRelease(G, route, route.edges.length); return; } route.rel = 0;
  for (let i = 0; i < route.edges.length; i++){ const k = route.edges[i], fwd = G.E[k].a === route.nodes[i]; let u = G.use.get(k); if (!u){ u = {f:0, r:0}; G.use.set(k, u); } if (fwd) u.f++; else u.r++; } }

/* ---------------------------------------------------------------- paths: fillets, speed profile, sampling ---------------- */
// round the corners of a polyline with arcs (radius R, limited by the neighbouring segment lengths)
function filletPath(P, R, RR){
  if (P.length < 3) return P.slice();
  const out = [P[0]];
  let lastCut = 0;
  for (let i = 1; i < P.length - 1; i++){
    const A = out[out.length - 1], B = P[i], C = P[i + 1];
    let ux = B[0] - A[0], uy = B[1] - A[1], vx = C[0] - B[0], vy = C[1] - B[1]; const lu = Math.hypot(ux, uy), lv = Math.hypot(vx, vy);
    if (lu < 1e-3 || lv < 1e-3){ continue; }
    ux /= lu; uy /= lu; vx /= lv; vy /= lv;
    const th = Math.acos(clamp(ux*vx + uy*vy, -1, 1)); if (th < 0.02){ out.push(B); continue; }
    let t = ((RR && RR[i]) || R)*Math.tan(th/2); t = Math.min(t, lu*0.98, lv*0.5); const r = t/Math.tan(th/2);
    const p0 = [B[0] - ux*t, B[1] - uy*t], cr = ux*vy - uy*vx, sg = cr > 0 ? 1 : -1, cx = p0[0] - uy*r*sg, cy = p0[1] + ux*r*sg;
    const a0 = Math.atan2(p0[1] - cy, p0[0] - cx), n = Math.max(2, Math.ceil(th/(8*D2R)));
    for (let k = 0; k <= n; k++){ const a = a0 + sg*th*k/n; out.push([cx + Math.cos(a)*r, cy + Math.sin(a)*r]); }
  }
  out.push(P[P.length - 1]);
  // drop near-duplicates
  const o2 = [out[0]]; for (let i = 1; i < out.length; i++){ const q = o2[o2.length - 1]; if (Math.hypot(out[i][0] - q[0], out[i][1] - q[1]) > 0.3 || i === out.length - 1) o2.push(out[i]); }
  return o2;
}
// path object: points, cumulative length, per-vertex speed limits (lateral acceleration + braking to the end speed)
function mkPath(P, o){
  o = o || {};
  const n = P.length, cum = new Float64Array(n); for (let i = 1; i < n; i++) cum[i] = cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
  const vmax = o.vmax || 11, alat = o.alat || 1.1, dec = o.dec || 1.0, lim = new Float64Array(n);
  for (let i = 0; i < n; i++){
    if (i === 0 || i === n - 1){ lim[i] = vmax; continue; }
    const ax = P[i][0] - P[i - 1][0], ay = P[i][1] - P[i - 1][1], bx = P[i + 1][0] - P[i][0], by = P[i + 1][1] - P[i][1], la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
    const th = Math.acos(clamp((ax*bx + ay*by)/((la*lb) || 1), -1, 1)), k = th/Math.max(0.5, (la + lb)/2);
    lim[i] = Math.min(vmax, k > 1e-5 ? Math.sqrt(alat/k) : vmax);
  }
  if (o.lim) for (const q of o.lim){ let i = 0; while (i < n - 1 && cum[i] < q[0]) i++; lim[i] = Math.min(lim[i], q[1]); }
  lim[n - 1] = o.vEnd ?? 0;
  for (let i = n - 2; i >= 0; i--) lim[i] = Math.min(lim[i], Math.sqrt(lim[i + 1]*lim[i + 1] + 2*dec*(cum[i + 1] - cum[i])));
  return {P, cum, L:cum[n - 1], lim, dec, i:0};
}
function pathAt(pa, s){
  const P = pa.P, cum = pa.cum, n = P.length; s = clamp(s, 0, pa.L);
  let i = pa.i; if (i >= n - 1) i = n - 2; while (i > 0 && cum[i] > s) i--; while (i < n - 2 && cum[i + 1] < s) i++; pa.i = i;
  const l = cum[i + 1] - cum[i], f = l > 1e-9 ? (s - cum[i])/l : 0;
  return [P[i][0] + (P[i + 1][0] - P[i][0])*f, P[i][1] + (P[i + 1][1] - P[i][1])*f, Math.atan2(P[i + 1][1] - P[i][1], P[i + 1][0] - P[i][0]), i];
}
function pathLim(pa, s){ const i = pa.i, cum = pa.cum; const d = Math.max(0, cum[i + 1] - s); return Math.sqrt(pa.lim[i + 1]*pa.lim[i + 1] + 2*pa.dec*d); }


/* ---------------------------------------------------------------- stands ------------------------------------------------ */
// Changi Airfreight Centre: freighter stands on the apron in front of the west face of the cargo terminals (from the real footprints)
function cargoStands(){ const F0 = [16517, 6558], u = [0.413, 0.911], n = [-0.911, 0.413], a = Math.atan2(-n[1], -n[0]), out = [];
  for (const t of [-290, -205, -120, -35, 50, 135, 220, 305, 400, 485, 570]) out.push({x:F0[0] + u[0]*t + n[0]*24, y:F0[1] + u[1]*t + n[1]*24, a, code:'F', bridges:0, kind:'cargo'});
  return out; }
// Seletar: the terminal apron and the apron inside the taxilane loop (static: business jets and turboprops)
function seletarStands(){ return [[2857, 11012, -0.513], [2881, 11053, -0.513], [2834, 10971, -0.513], [2700, 11002, -0.51 + PI], [2740, 11025, -0.51 + PI]]
  .map(q => ({x:q[0], y:q[1], a:q[2], code:'C', bridges:0, kind:'ga'})); }
function standList(){
  const out = [], SS = window.SG_STANDS;
  if (SS && SS.length){
    for (const s of SS) if (isFinite(s.x) && isFinite(s.y) && isFinite(s.a)) out.push({x:s.x, y:s.y, a:s.a, code:(s.code || 'E').toUpperCase(), bridges:s.bridges | 0, gate:s.gate || '', kind:'pax'});
  } else {
    // fallback: SGR.base.stands [x, y, rotY] = plane centre ~40 m out from the terminal, nose toward it; code from the spacing
    const B = SGR.base.stands || [];
    B.forEach((s, i) => { let dmin = 1e9; B.forEach((t, j) => { if (i !== j) dmin = Math.min(dmin, Math.hypot(t[0] - s[0], t[1] - s[1])); });
      const code = dmin > 84 ? 'F' : dmin > 60 ? 'E' : 'C', a = s[2];
      out.push({x:s[0] + Math.cos(a)*30, y:s[1] + Math.sin(a)*30, a, code, bridges:1, gate:'', kind:'pax'}); });
  }
  // freighter stands: the Changi module's list if it has one, else our own on the Airfreight Centre apron (minus any that collide)
  const CS = window.SG_CARGO_STANDS;
  let cargo = CS && CS.length ? CS.filter(s => isFinite(s.x) && isFinite(s.y) && isFinite(s.a)).map(s => ({x:s.x, y:s.y, a:s.a, code:(s.code || 'F').toUpperCase(), bridges:0, gate:s.gate || '', kind:'cargo'})) : cargoStands();
  const fus = S => [[S.x, S.y], [S.x - Math.cos(S.a)*CODE_LEN[S.code], S.y - Math.sin(S.a)*CODE_LEN[S.code]]];
  const segD = (a, b, c, d) => { const f = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = dx*dx + dy*dy || 1, t = clamp(((p[0] - a[0])*dx + (p[1] - a[1])*dy)/l, 0, 1); return Math.hypot(a[0] + dx*t - p[0], a[1] + dy*t - p[1]); }; return Math.min(f(a, c, d), f(b, c, d), f(c, a, b), f(d, a, b)); };
  if (!(CS && CS.length)) cargo = cargo.filter(c => !out.some(S => { const A = fus(c), B = fus(S); return segD(A[0], A[1], B[0], B[1]) < 40; }));
  return out.concat(cargo, seletarStands());
}
const CODE_LEN = {C:45, E:75, F:77};
// entry of a stand on the taxiway network: the first taxiway crossed by the stand axis behind the tail
function standEntry(G, S){
  const dx = -Math.cos(S.a), dy = -Math.sin(S.a), d0 = CODE_LEN[S.code] + 6, d1 = 300;
  let best = null;
  const seen = new Set();
  for (let d = d0; d <= d1; d += 40){
    const x = S.x + dx*(d + 20), y = S.y + dy*(d + 20);
    for (const k of gNearEdges(G, x, y, 32)){ if (seen.has(k)) continue; seen.add(k); const e = G.E[k]; if (e.rw >= 0) continue;
      const ax = G.NX[e.a], ay = G.NY[e.a], ex = G.NX[e.b] - ax, ey = G.NY[e.b] - ay, den = dx*ey - dy*ex; if (Math.abs(den) < 1e-6) continue;
      const qx = ax - S.x, qy = ay - S.y, t = (qx*ey - qy*ex)/den, u = (qx*dy - qy*dx)/den;
      if (t < d0 || t > d1 || u < 0 || u > 1) continue;
      const ang = Math.abs(dx*ex + dy*ey)/Math.hypot(ex, ey); if (ang > 0.85) continue;   // nearly parallel lines are not a crossing
      if (!best || t < best.t) best = {k, u, t, x:S.x + dx*t, y:S.y + dy*t};
    }
    if (best) break;
  }
  if (!best){ // fallback: the nearest taxiway point to a spot behind the tail
    const x = S.x + dx*(d0 + 30), y = S.y + dy*(d0 + 30); let bp = null;
    for (const k of gNearEdges(G, x, y, 120)){ if (G.E[k].rw >= 0) continue; const q = gProject(G, k, x, y); if (!bp || q.d < bp.d) bp = q; }
    if (!bp || bp.d > 120) return null;
    best = {k:bp.k, u:bp.t, t:Math.hypot(bp.x - S.x, bp.y - S.y), x:bp.x, y:bp.y, dog:true};
  }
  return best;
}

/* ---------------------------------------------------------------- aircraft simulation ---------------------------------- */
const FLEET_MIX = {C:[['a320', 0.36], ['b737', 0.30], ['a320', 0.22], ['atr', 0.06], ['biz', 0.06]], E:[['a350', 0.32], ['b777', 0.26], ['b787', 0.26], ['a330', 0.16]], F:[['a380', 0.75], ['b777', 0.13], ['a350', 0.12]],
  cargo:[['b747', 0.55], ['b777', 0.45]], ga:[['biz', 0.6], ['atr', 0.4]]};
function pickW(list, r){ let t = 0; for (const q of list) t += q[1]; let x = r()*t; for (const q of list){ x -= q[1]; if (x <= 0) return q[0]; } return list[list.length - 1][0]; }
function pickVar(F, r, freighter){ const vs = F.vars.filter(v => !!v.freighter === !!freighter && v.w > 0 || (freighter && v.freighter)); const L = vs.length ? vs : F.vars; let t = 0; for (const v of L) t += v.w || 0.01; let x = r()*t; for (const v of L){ x -= v.w || 0.01; if (x <= 0) return v; } return L[0]; }
const famLen = (F, v) => F.L + v.dF + v.dA;
function fitsStand(ac, S){ if (S.kind === 'ga') return false; if (S.kind === 'cargo') return !!ac.vr.freighter; if (ac.vr.freighter) return false;
  // contact stands only take aircraft whose doors match the aerobridges (same code); remote stands also take smaller types
  const c = ac.F.code; if (S.code === c) return S.bridges > 0 ? ac.F !== FAM.atr && ac.F !== FAM.biz : true;
  return !S.bridges && ((S.code === 'F' && c === 'E') || (S.code === 'E' && c === 'C' && SIM.rnd() < 0.3)); }



/* ---------------------------------------------------------------- ground crew ------------------------------------------- */
// vehicles are made of instanced unit boxes: [x, y, z (centre, vehicle frame: x forward, y up, z right), sx, sy, sz, colour, tag]
const VC = {yel:[0.93, 0.72, 0.12], wht:[0.9, 0.91, 0.92], dk:[0.16, 0.17, 0.19], gry:[0.45, 0.47, 0.5], alu:[0.74, 0.76, 0.79], blu:[0.2, 0.32, 0.55], win:[0.12, 0.15, 0.2], red:[0.72, 0.16, 0.14], grn:[0.3, 0.42, 0.32], org:[0.95, 0.5, 0.1]};
const VK = {
  tug:{len:6.4, b:[[0, 0.7, 0, 6.2, 1.0, 2.8, VC.yel], [-1.9, 1.65, -0.55, 1.6, 1.0, 1.4, VC.win], [-1.9, 2.2, -0.55, 1.7, 0.12, 1.5, VC.yel], [5.2, 0.55, 0, 4.0, 0.16, 0.22, VC.dk]], beacon:[-1.9, 2.4, -0.55]},
  tractor:{len:2.9, b:[[0, 0.62, 0, 2.8, 0.85, 1.45, VC.wht], [-0.35, 1.25, 0, 1.1, 0.5, 1.1, VC.dk], [-0.3, 1.95, 0, 1.5, 0.1, 1.45, VC.wht]], beacon:[-0.3, 2.1, 0]},
  dolly:{len:3.4, b:[[0, 0.48, 0, 3.1, 0.22, 1.7, VC.gry], [0, 1.45, 0, 1.56, 1.62, 1.53, VC.alu]]},
  belt:{len:7.6, b:[[0, 0.6, 0, 7.2, 0.6, 1.9, VC.yel], [-2.4, 1.45, 0.62, 1.3, 1.2, 0.7, VC.win], [0.4, 1.5, 0, 8.0, 0.32, 0.85, VC.dk, 'belt']], beacon:[-2.4, 2.15, 0.62]},
  cater:{len:8.0, b:[[3.0, 1.35, 0, 1.9, 2.3, 2.45, VC.wht], [-0.4, 0.75, 0, 7.4, 0.55, 2.45, VC.dk], [-0.9, 2.6, 0, 5.6, 2.6, 2.45, VC.wht, 'box'], [-0.9, 2.6, 0, 5.62, 0.35, 2.47, VC.blu, 'box'], [-0.9, 1.5, 0, 0.5, 1.0, 1.6, VC.gry, 'sc'], [3.1, 1.32, 0, 2.2, 0.12, 2.0, VC.gry, 'plat']], beacon:[3.0, 2.6, 0]},
  fuel:{len:7.2, b:[[0, 0.72, 0, 7.0, 0.8, 2.4, VC.wht], [2.6, 1.65, 0, 1.8, 1.6, 2.4, VC.wht], [-0.8, 1.55, 0, 3.6, 1.0, 2.2, VC.gry], [-1.6, 2.2, 0, 2.6, 0.14, 2.0, VC.yel, 'deck']], beacon:[2.6, 2.6, 0]},
  cload:{len:9.0, b:[[0, 0.6, 0, 9.0, 0.6, 3.2, VC.yel], [2.6, 0.9, 0, 3.6, 0.3, 3.2, VC.dk, 'deck'], [-2.3, 1.05, 0, 4.4, 0.3, 3.2, VC.dk], [-4.0, 1.8, 1.2, 1.1, 1.3, 0.9, VC.win]], beacon:[-4.0, 2.6, 1.2]},
  stairs:{len:7.4, b:[[0, 0.62, 0, 7.0, 0.7, 2.4, VC.wht], [2.6, 1.45, 0, 1.8, 1.3, 2.4, VC.win], [0, 2.0, 0, 7.0, 0.35, 1.6, VC.gry, 'stair'], [3.3, 3, 0, 1.6, 0.14, 1.7, VC.gry, 'top']], beacon:[2.6, 2.2, 0]},
  bus:{len:13.0, b:[[0, 1.5, 0, 13.0, 2.6, 2.9, VC.wht], [0, 2.1, 0, 12.4, 1.05, 2.94, VC.win], [0, 2.95, 0, 12.6, 0.14, 2.7, VC.blu]], beacon:[0, 3.1, 0]},
  gpu:{len:2.6, b:[[0, 0.8, 0, 2.5, 1.15, 1.4, VC.grn], [0, 1.45, 0, 2.3, 0.12, 1.3, VC.dk]]},
  follow:{len:4.6, b:[[0, 0.75, 0, 4.6, 0.85, 1.85, VC.yel], [-0.3, 1.42, 0, 2.6, 0.55, 1.75, VC.win], [-0.3, 1.8, 0, 0.45, 0.16, 1.5, VC.org]], beacon:[-0.3, 1.9, 0]},
  van:{len:5.2, b:[[0, 1.1, 0, 5.2, 1.9, 2.0, VC.wht], [2.1, 1.45, 0, 1.0, 0.9, 2.02, VC.win], [-0.3, 1.1, 0, 5.22, 0.25, 2.02, VC.org]], beacon:[0, 2.15, 0]}
};
// normalise the box records (fixed length, numeric tags: avoids out-of-bounds reads in the hot loop)
const VTAG = {belt:1, box:2, plat:3, sc:4, deck:5, stair:6, top:7};
for (const k in VK) VK[k].b = VK[k].b.map(b => [b[0], b[1], b[2], b[3], b[4], b[5], b[6], VTAG[b[7]] || 0]);
// local frame of a parked aircraft: u = metres aft of the nose, v = metres to the right; world point
function ac2w(S, u, v){ const c = Math.cos(S.a), sn = Math.sin(S.a); return [S.x - c*u + sn*v, S.y - sn*u - c*v]; }
function svcGeom(ac){
  const F = ac.F, dF = ac.vr.dF, w = F.W/2, L = ac.L, E = F.eng, ez = E.z[0], R = E.R;
  const le = F.wing.s + dF, te = le + F.wing.c0, quad = E.z.length > 1, vF = quad ? (w + ez - R)/2 + 0.6 : (E.kind === 'fan' || E.kind === 'prop' ? ez + R + 2.4 : w + 4.5);
  const lane = Math.max(w + 13, vF + 4.6, E.kind === 'fan' && !quad ? ez + R + 4 : 0);
  return {w, L, lane, vF, uF:F.wingLE(Math.max(F.wing.z0, vF)) + dF - 4.5, uL1:F.doors[0] || 5, uFC:Math.max((F.doors[0] || 5) + 4, le*0.6), uAC:te + 0.2*(L - te), uBK:te + 0.33*(L - te), uR4:L*0.86, uNG:F.xNG,
    sill:F.floor, cargoSill:F.yBot + (F.code === 'C' ? 0.45 : 0.7), wide:F.code !== 'C', remote:false};
}
// a visit: drive in along a path, dock, (animate), drive out (optional reverse first), vanish
function mkVisit(kind, slot, t0, inPts, dockT, outRev, outPts, o){
  const vin = mkPath(filletPath(dedupe(inPts), 7), {vmax:7, alat:1.5, dec:1.2, vEnd:0});
  const vrev = outRev ? mkPath(filletPath(dedupe(outRev), 6), {vmax:3, alat:1.2, dec:1.0, vEnd:0}) : null;
  const vout = mkPath(filletPath(dedupe(outPts), 7), {vmax:7, alat:1.5, dec:1.2, vEnd:7});
  const dIn = trapT(vin.L, 6.5), dRev = vrev ? trapT(vrev.L, 2.5) : 0, dOut = trapT(vout.L, 6.5);
  const t1 = t0 + dIn, t2 = t1 + dockT;
  return Object.assign({kind, slot, t0, t1, t2, t3:t2 + dRev, t4:t2 + dRev + dOut, vin, vrev, vout, last:-1}, o || {});
}
const trapT = (L, v) => L/v + v/1.2;
function trapS(L, v, tau){ const a = 1.2, ta = v/a, T = L/v + ta; if (L < v*ta){ const tm = Math.sqrt(L/a); if (tau < tm) return 0.5*a*tau*tau; return Math.min(L, L - 0.5*a*Math.max(0, 2*tm - tau)*Math.max(0, 2*tm - tau)); }
  if (tau < ta) return 0.5*a*tau*tau; if (tau < T - ta) return 0.5*a*ta*ta + v*(tau - ta); const r = Math.max(0, T - tau); return Math.min(L, L - 0.5*a*r*r); }
// path pose (extrapolated before the start for trailers)
function pPose(pa, s){ if (s >= 0) return pathAt(pa, s); const q = pathAt(pa, 0); return [q[0] + Math.cos(q[2])*s, q[1] + Math.sin(q[2])*s, q[2], 0]; }
// pose of a visit at time t: null (hidden) or {x, y, h, lift (0..1), moving}
function visitPose(V, t, k){
  if (t < V.t0 || t >= V.t4) return null;
  const off = k ? -(V.kind === 'train' || V.kind === 'train2' ? 3.4 + 3.6*(k - 1) : 0) : 0;
  if (t < V.t1){ const q = pPose(V.vin, trapS(V.vin.L, 6.5, t - V.t0) + off); return {x:q[0], y:q[1], h:q[2], lift:0, moving:true}; }
  if (t < V.t2){ const q = pPose(V.vin, V.vin.L + off), d = V.t2 - V.t1, f = Math.min(1, (t - V.t1)/14, (V.t2 - t)/14); return {x:q[0], y:q[1], h:q[2], lift:Math.max(0, f), moving:t - V.t1 < 15 || V.t2 - t < 15}; }
  if (t < V.t3){ const q = pPose(V.vrev, trapS(V.vrev.L, 2.5, t - V.t2)); return {x:q[0], y:q[1], h:q[2] + PI, lift:0, moving:true}; }
  const q = pPose(V.vout, trapS(V.vout.L, 6.5, t - V.t3) + off); return {x:q[0], y:q[1], h:q[2], lift:0, moving:true};
}


// vehicle slots of a stand (each slot runs one visit at a time) and their box counts
const SLOT_KIND = {belt:'belt', train:'train', train2:'train', cater:'cater', cater2:'cater', fuel:'fuel', cload:'cload', tug:'tug', stairs:'stairs', stairs2:'stairs', bus:'bus', bus2:'bus', gpu:'gpu'};
const slotBoxes = sl => SLOT_KIND[sl] === 'train' ? VK.tractor.b.length + 4*VK.dolly.b.length : VK[SLOT_KIND[sl]].b.length;
function standSlots(S){
  if (S.kind === 'ga') return ['fuel', 'gpu', 'stairs'];
  if (S.kind === 'cargo') return ['cload', 'train', 'train2', 'fuel', 'tug', 'belt'];
  const L = ['belt', 'train', 'cater', 'fuel', 'tug'];
  if (S.code !== 'C') L.push('cload', 'train2', 'cater2');
  if (!S.bridges) L.push('stairs', 'stairs2', 'bus', 'bus2', 'gpu');
  return L;
}
// the in / out paths of each kind of vehicle around a parked aircraft (local u = aft of the nose, v = right)
function visitFor(sl, S, ac, g, t0, dock){
  const W = (u, v) => ac2w(S, u, v), kind = SLOT_KIND[sl], L = g.L, w = g.w, ln = g.lane, rearOut = side => [W(L + 16, side*ln), W(L + 24, side*(ln + 40)), W(L + 24, side*(ln + 170))];
  const front = side => [W(-46, side*(w + 9)), W(-12, side*ln)];
  let inP, rev = null, outP, o = {};
  // perpendicular dock on side sd at station u (vehicle front dFront metres from the fuselage side)
  const perp = (u, sd, half) => { const vd = w + 0.5 + half; inP = front(sd).concat([W(u - 9, sd*ln), W(u, sd*(w + half + 6)), W(u, sd*(vd))]);
    rev = [W(u, sd*vd), W(u, sd*(vd + 3.5)), W(u - 6, sd*(vd + 7))]; outP = [W(u - 6, sd*(vd + 7)), W(u + 6, sd*ln)].concat([W(L + 16, sd*ln)], rearOut(sd).slice(1)); };
  switch (sl){
    case 'belt': perp(g.uBK, 1, 3.7); o.sill = g.cargoSill; break;
    case 'cater': perp(g.uL1 + 0.2, 1, 4.3); o.sill = g.sill; break;
    case 'cater2': perp(g.uR4, 1, 4.3); o.sill = g.sill; break;
    case 'cload': perp(g.uFC, 1, 4.6); o.sill = g.cargoSill + (S.kind === 'cargo' ? 0.6 : 0); break;
    case 'stairs': perp(g.uL1 + 0.3, -1, 3.5); o.sill = g.sill; break;
    case 'stairs2': perp(g.wide ? (ac.F.doors[1] || g.uR4) : g.uR4, -1, 3.5); o.sill = g.sill; break;
    case 'train': case 'train2': { const v = w + (sl === 'train2' ? 6.5 : 10.5), u = sl === 'train2' ? g.uFC + 6 : g.uBK + 9;
      inP = front(1).concat([W(u - 26, ln), W(u - 12, v), W(u, v)]); outP = [W(u, v), W(L + 14, v), W(L + 22, ln + 20)].concat(rearOut(1).slice(1)); o.uld = g.wide; break; }
    case 'fuel': inP = front(1).concat([W(g.uF - 20, g.vF + 2), W(g.uF, g.vF)]); outP = [W(g.uF, g.vF), W(g.uF + 30, g.vF), W(L + 16, ln)].concat(rearOut(1).slice(1)); o.lift = 1; break;
    case 'bus': case 'bus2': { const u = g.uL1 + (sl === 'bus2' ? -14 : 1), v = -(w + 11), vo = -(ac.semi + 9); inP = [W(-60, -(w + 30)), W(u - 22, v - 6), W(u, v)]; outP = [W(u, v), W(u + 14, vo), W(L + 14, vo)].concat(rearOut(-1).slice(1)); break; }
    case 'gpu': inP = front(1).concat([W(g.uNG - 14, 6), W(g.uNG - 3, 3.4)]); outP = [W(g.uNG - 3, 3.4), W(g.uNG + 3, 4), W(g.uNG + 14, ln)].concat([W(L + 16, ln)], rearOut(1).slice(1)); break;
    case 'tug': { const u = g.uNG - 7.2; inP = [W(-48, 14), W(-30, 12), W(u - 12, 0), W(u, 0)]; outP = [W(u, 0), W(u - 1, 30), W(u - 1, 150)]; o.tug = true; o.ac = ac; break; }
  }
  return mkVisit(sl, null, t0, inP, dock, rev, outP, o);
}
function turnStartImpl(S, ac, T, bg){
  if (!S.slots) return;
  const r = SIM.rnd, g = svcGeom(ac); g.remote = S.kind === 'pax' && !S.bridges;
  // a full turnaround after an arrival; lighter background cycles (about half of the vehicles) while an aircraft stays parked
  const V = S.visits, add = (sl, d, dock) => { if (bg && sl !== 'gpu' && sl !== 'stairs' && r() < 0.5) return; if (S.slots.includes(sl) && !(V[sl] && V[sl].t4 > T + d)) V[sl] = visitFor(sl, S, ac, g, T + d, dock); };
  add('belt', 20 + r()*25, 160 + r()*90); add('train', 38 + r()*25, 80 + r()*50); add('cater', 55 + r()*50, 110 + r()*70); add('fuel', 30 + r()*40, 140 + r()*80);
  if (g.wide || S.kind === 'cargo'){ add('cload', 25 + r()*20, 150 + r()*60); add('train2', 140 + r()*60, 70 + r()*40); add('cater2', 85 + r()*50, 110 + r()*60); }
  add('stairs', 6, 250 + r()*80); add('stairs2', 12, 240 + r()*80); add('bus', 20 + r()*10, 60 + r()*30); add('bus2', 210 + r()*40, 50 + r()*20); add('gpu', 4, 300 + r()*100);
  S.cycEnd = T + 330 + r()*200;
}
function turnTugImpl(S, ac, T){
  if (!S.slots) return;
  const r = SIM.rnd;
  for (const k in S.visits){ const V = S.visits[k]; if (V.tug) continue; if (V.t2 > T + 4){ const nt2 = Math.max(V.t1 + 2, T + 4 + r()*20), d = nt2 - V.t2; V.t2 += d; V.t3 += d; V.t4 += d; } }
  if (S.slots.includes('tug')){ const g = svcGeom(ac); S.visits.tug = visitFor('tug', S, ac, g, T + 2, 1e9); }
}

// ---- box instances
const VEH = {im:null, n:0, cap:0, follow:[], vans:[]};
function vehBuild(){
  let n = 0;
  for (const S of SIM.stands){ S.slots = standSlots(S); S.visits = {}; S.box = {}; for (const sl of S.slots){ S.box[sl] = n; n += slotBoxes(sl); } S.vis = false; S.st = {}; S.cache = {}; S.bc = {}; }
  VEH.followBase = n; n += 3*VK.follow.b.length;
  VEH.vanBase = n; n += 10*VK.van.b.length;
  VEH.cap = n;
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({color:0xffffff}), n);
  im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; im.castShadow = true; im.name = 'air_vehicles';
  const zero = new THREE.Matrix4().makeScale(0, 0, 0), c = new THREE.Color();
  for (let i = 0; i < n; i++){ im.setMatrixAt(i, zero); c.setRGB(1, 1, 1); im.setColorAt(i, c); }
  const colorize = (base, kind, trail) => { const K = VK[kind]; K.b.forEach((b, j) => { c.setRGB(b[6][0], b[6][1], b[6][2]); im.setColorAt(base + j, c); }); return base + K.b.length; };
  for (const S of SIM.stands) for (const sl of S.slots){ let b = S.box[sl]; const k = SLOT_KIND[sl]; if (k === 'train'){ b = colorize(b, 'tractor'); for (let d = 0; d < 4; d++) b = colorize(b, 'dolly'); } else colorize(b, k); }
  for (let i = 0; i < 3; i++) colorize(VEH.followBase + i*VK.follow.b.length, 'follow');
  for (let i = 0; i < 10; i++) colorize(VEH.vanBase + i*VK.van.b.length, 'van');
  im.instanceColor.needsUpdate = true;
  VEH.im = im; VEH.zero = zero;
  // maintenance vans on the airside service roads
  VEH.vans = [];
  if (SIM.G){ const cand = [];
    for (const l of SGR.lines){ if (l.c !== 11 || l.P[0] < 13000 || l.P[1] < 0 || l.P[1] > 9500) continue; let len = 0, ok = true; const P = [];
      for (let i = 0; i < l.P.length; i += 2){ P.push([l.P[i], l.P[i + 1]]); if (i) len += Math.hypot(l.P[i] - l.P[i - 2], l.P[i + 1] - l.P[i - 1]); }
      if (len < 380) continue; for (let i = 0; i < P.length && ok; i += 3){ if (!gNearEdges(SIM.G, P[i][0], P[i][1], 130).size) ok = false; } if (ok) cand.push({P, len}); }
    cand.sort((a, b) => b.len - a.len); const r = mulberry32(55);
    for (let i = 0; i < Math.min(10, cand.length); i++){ const q = cand[Math.floor(r()*Math.min(cand.length, 30))]; VEH.vans.push({pa:mkPath(q.P, {vmax:8, vEnd:8}), ph:r()*1000, base:VEH.vanBase + i*VK.van.b.length, vis:false}); } }
  return im;
}
// write one vehicle's boxes; anim: {lift, sill}
function vehWrite(base, kind, x, y, h, y0, V, lift){
  const K = VK[kind], ch = Math.cos(h), sh = Math.sin(h), e = VEH.im.instanceMatrix.array, B = K.b, sill = V && V.sill ? V.sill : 3, deckT = V && V.lift ? 3.4 : sill;
  for (let j = 0; j < B.length; j++){
    const b = B[j], tag = b[7]; let bx = b[0], by = b[1], bz = b[2], sx = b[3], sy = b[4], sz = b[5], cp = 1, sp = 0;
    if (tag !== 0){
      if (tag === 1){ const top = sill - 0.15, p = Math.asin(clamp((top - 0.9)/sx, -0.9, 0.9)); cp = Math.cos(p); sp = Math.sin(p); by = (top + 0.9)/2; }
      else if (tag === 2) by += lift*Math.max(0, sill - 1.3);
      else if (tag === 3) by = 1.32 + lift*Math.max(0, sill - 1.38);
      else if (tag === 4){ sy = Math.max(0.3, 1.3 + lift*Math.max(0, sill - 1.3) - 0.95); by = 0.95 + sy/2; }
      else if (tag === 5) by += lift*Math.max(0, deckT - by - 0.1);
      else if (tag === 6){ const top = sill - 0.1, p = Math.atan2(top - 1.0, 6.0); cp = Math.cos(p); sp = Math.sin(p); sx = Math.hypot(6.0, top - 1.0); by = (top + 1.0)/2; bx = 0.3; }
      else if (tag === 7) by = sill - 0.07;
    }
    // R_y(h)·R_z(pitch)·S at the box centre (three.js: x east, z = -north)
    const o = (base + j)*16;
    e[o] = ch*cp*sx; e[o + 1] = sp*sx; e[o + 2] = -sh*cp*sx; e[o + 3] = 0;
    e[o + 4] = -ch*sp*sy; e[o + 5] = cp*sy; e[o + 6] = sh*sp*sy; e[o + 7] = 0;
    e[o + 8] = sh*sz; e[o + 9] = 0; e[o + 10] = ch*sz; e[o + 11] = 0;
    e[o + 12] = x + ch*bx + sh*bz; e[o + 13] = y0 + by; e[o + 14] = -(y + sh*bx - ch*bz); e[o + 15] = 1;
  }
  return B.length;
}
function vehHide(base, n){ for (let j = 0; j < n; j++) VEH.im.setMatrixAt(base + j, VEH.zero); }


function tugPose(V, T){
  const ac = V.ac;
  if (V.released || T < V.t1) return visitPose(V, T, 0);
  if (ac.st === 'pushwait' || ac.st === 'park') return visitPose(V, Math.min(T, V.t1 + 1e3), 0);
  if (ac.st === 'push' || (ac.st === 'start' && T < ac.startT - 5)){ const c = Math.cos(ac.h), sn = Math.sin(ac.h); return {x:ac.N[0] + c*7.2, y:ac.N[1] + sn*7.2, h:ac.h + PI, lift:0, moving:true}; }
  // disconnect: back off 8 m, then drive away to the side
  const c = Math.cos(ac.h), sn = Math.sin(ac.h), p0 = [ac.N[0] + c*7.2, ac.N[1] + sn*7.2], p1 = [p0[0] + c*8, p0[1] + sn*8], hd = [-c, -sn], rt = [hd[1], -hd[0]];
  V.vrev = mkPath([p0, p1], {vmax:2.5, vEnd:0}); V.vout = mkPath(filletPath([p1, [p1[0] + hd[0]*5 + rt[0]*6, p1[1] + hd[1]*5 + rt[1]*6], [p1[0] + hd[0]*5 + rt[0]*130, p1[1] + hd[1]*5 + rt[1]*130]], 6), {vmax:7, vEnd:7});
  V.t2 = T; V.t3 = T + trapT(V.vrev.L, 2.5); V.t4 = V.t3 + trapT(V.vout.L, 6.5); V.released = true;
  return visitPose(V, T, 0);
}
const VIEW_R = 4000;
function vehUpdate(T, cx, cy, ch){
  const im = VEH.im; if (!im) return; let dirty = false; VEH.frame = (VEH.frame || 0) + 1;
  const night = nightF;
  for (const S of SIM.stands){
    const dx = S.x - cx, dy = S.y - cy, inR = dx*dx + dy*dy + ch*ch < VIEW_R*VIEW_R;
    if (!inR){ if (S.vis){ for (const sl of S.slots) vehHide(S.box[sl], slotBoxes(sl)); S.vis = false; S.st = {}; S.cache = {}; S.bc = {}; dirty = true; } continue; }
    S.vis = true;
    if (S.occ && S.occ.st === 'park' && T > (S.cycEnd || 0)) turnStartImpl(S, S.occ, T, true);
    const d2 = dx*dx + dy*dy + ch*ch, every = d2 < 450*450 ? 1 : d2 < 1100*1100 ? 2 : d2 < 2300*2300 ? 4 : 8;
    if (every > 1 && (VEH.frame + S.id) % every){ for (const sl of S.slots){ const bc = S.bc[sl]; if (bc && S.st[sl] !== 'h') ltPush(bc[0], bc[1], bc[2], 1, 0.55, 0.08, 3, bc[3], 0.9, 0.35); } continue; }
    for (let q = 0; q < S.slots.length; q++){
      const sl = S.slots[q], V = S.visits[sl], base = S.box[sl], kind = SLOT_KIND[sl], cc = S.cache[sl];
      if (cc && cc.V === V && T < cc.until && S.st[sl] === 'd'){ if (cc.bc) ltPush(cc.bc[0], cc.bc[1], cc.bc[2], 1, 0.55, 0.08, 3, cc.bc[3], 0.9, 0.35); continue; }
      const P = V ? (V.tug ? tugPose(V, T) : visitPose(V, T, 0)) : null;
      if (!P){ if (S.st[sl] !== 'h'){ vehHide(base, slotBoxes(sl)); S.st[sl] = 'h'; dirty = true; } if (V && T >= V.t4) delete S.visits[sl]; continue; }
      const y0 = S.y0;
      if (P.moving || S.st[sl] !== 'd'){
        if (kind === 'train'){ let b = base + vehWrite(base, 'tractor', P.x, P.y, P.h, y0, V, 0); for (let k = 1; k <= 4; k++){ const Q = visitPose(V, T, k); b += vehWrite(b, 'dolly', Q.x, Q.y, Q.h, y0, V, 0); if (!V.uld) im.setMatrixAt(b - 1, VEH.zero); } }
        else vehWrite(base, kind, P.x, P.y, P.h, y0, V, P.lift);
        S.st[sl] = P.moving ? 'm' : 'd'; dirty = true;
      }
      const K = VK[kind === 'train' ? 'tractor' : kind]; let bc = null;
      if (K.beacon && (P.moving || (q + S.id) % 3 === 0)){ const c = Math.cos(P.h), sn = Math.sin(P.h), b = K.beacon; bc = [P.x + c*b[0] + sn*b[2], y0 + b[1] + 0.15, -(P.y + sn*b[0] - c*b[2]), (S.id*7 + q)*0.137]; ltPush(bc[0], bc[1], bc[2], 1, 0.55, 0.08, 3, bc[3], 0.9, 0.35); }
      S.bc[sl] = bc;
      if (P.moving && nightF > 0.3){ const c = Math.cos(P.h), sn = Math.sin(P.h), fx = K.len*0.5 + 0.1; ltPush(P.x + c*fx, y0 + 1.0, -(P.y + sn*fx), 1, 0.92, 0.75, 0, 0, 0.9, 0); }
      S.cache[sl] = !P.moving && !V.tug ? {V, until:V.t2 - 15, bc} : null;
    }
  }
  // follow-me cars
  for (let i = 0; i < 3; i++){
    const ac = VEH.follow[i], base = VEH.followBase + i*VK.follow.b.length;
    let P = null;
    if (ac && ac.st === 'taxi' && !ac.dep && ac.path === ac.followPath && ac.s > ac.exitS + 60){ const sc = ac.s + 80; if (sc < ac.followEnd){ const q = pathAt(ac.path, sc); P = {x:q[0], y:q[1], h:q[2]}; pathAt(ac.path, ac.s); } }
    if (!P){ if (VEH.followVis & (1 << i)){ vehHide(base, VK.follow.b.length); VEH.followVis &= ~(1 << i); dirty = true; } if (ac && (ac.path !== ac.followPath || ac.s + 80 >= ac.followEnd || ac.st === 'park' || ac.st === 'gone')) VEH.follow[i] = null; continue; }
    const yy = Math.max(0, hC(P.x, P.y)); vehWrite(base, 'follow', P.x, P.y, P.h, yy, null, 0); VEH.followVis |= 1 << i; dirty = true;
    const c = Math.cos(P.h), sn = Math.sin(P.h); ltPush(P.x - c*0.3, yy + 2.05, -(P.y - sn*0.3), 1, 0.6, 0.1, 3, i*0.31, 1.0, 0.4);
  }
  // vans
  for (const vn of VEH.vans){
    const pa = vn.pa, dx = pa.P[0][0] - cx, dy = pa.P[0][1] - cy, inR = dx*dx + dy*dy + ch*ch < (VIEW_R + pa.L)*(VIEW_R + pa.L);
    if (!inR){ if (vn.vis){ vehHide(vn.base, VK.van.b.length); vn.vis = false; dirty = true; } continue; }
    const tl = pa.L/8, per = 2*(tl + 10), tau = (T + vn.ph) % per; let sp, back = false;
    if (tau < tl) sp = tau*8; else if (tau < tl + 10) sp = pa.L; else if (tau < 2*tl + 10){ sp = pa.L - (tau - tl - 10)*8; back = true; } else { sp = 0; back = true; }
    const q = pathAt(pa, sp), yy = Math.max(0, hC(q[0], q[1])), h = q[2] + (back ? PI : 0);
    vehWrite(vn.base, 'van', q[0], q[1], h, yy, null, 0); vn.vis = true; dirty = true;
    ltPush(q[0], yy + 2.3, -q[1], 1, 0.55, 0.08, 3, vn.ph, 0.9, 0.35);
  }
  if (dirty) im.instanceMatrix.needsUpdate = true;
}

/* ---------------------------------------------------------------- lights ------------------------------------------------ */
// one additive Points object; per point: colour, flash pattern (0 steady, 1 beacon, 2 strobe, 3 amber rotating), phase, size
const LT = {cap:6000, n:0, pts:null, uT:{value:0}};
const matAirLights = new THREE.PointsMaterial({size:4.5, map:lampTex, vertexColors:true, transparent:true, opacity:1, depthWrite:false, blending:THREE.AdditiveBlending, sizeAttenuation:true});
matAirLights.onBeforeCompile = sh => {
  sh.uniforms.uT = LT.uT;
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 fl;\nattribute float psz;\nuniform float uT;\n')
    .replace('#include <color_vertex>', '#include <color_vertex>\nfloat kf = 1.0, ph = 0.0;\n' +
      'if (fl.x > 0.5 && fl.x < 1.5){ ph = fract(uT*0.9 + fl.y); kf = 0.06 + (1.0 - smoothstep(0.0, 0.14, ph)); }\n' +
      'else if (fl.x > 1.5 && fl.x < 2.5){ ph = fract(uT/1.25 + fl.y); kf = step(ph, 0.03) + step(abs(ph - 0.09), 0.025); }\n' +
      'else if (fl.x > 2.5){ ph = fract(uT*1.25 + fl.y); kf = 0.12 + 0.88*pow(max(0.0, cos(ph*6.2832)), 6.0); }\nvColor *= kf;\n')
    .replace('#include <logdepthbuf_vertex>', 'gl_PointSize = max(gl_PointSize*psz, 2.6*sqrt(psz));\n#include <logdepthbuf_vertex>');
};
function ltBuild(){
  const g = new THREE.BufferGeometry(), n = LT.cap;
  LT.pos = new Float32Array(n*3); LT.col = new Float32Array(n*3); LT.fl = new Float32Array(n*2); LT.psz = new Float32Array(n);
  g.setAttribute('position', new THREE.BufferAttribute(LT.pos, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('color', new THREE.BufferAttribute(LT.col, 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('fl', new THREE.BufferAttribute(LT.fl, 2).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('psz', new THREE.BufferAttribute(LT.psz, 1).setUsage(THREE.DynamicDrawUsage));
  g.setDrawRange(0, 0);
  const p = new THREE.Points(g, matAirLights); p.frustumCulled = false; p.renderOrder = 6; p.name = 'air_lights';
  LT.pts = p; return p;
}
// push a light; dayK = brightness by day (relative to night)
function ltPush(x, y, z, r, g, b, pat, ph, sz, dayK){
  if (LT.n >= LT.cap) return; const i = LT.n++, k = dayK === undefined ? 1 : dayK + (1 - dayK)*nightF;
  LT.pos[i*3] = x; LT.pos[i*3 + 1] = y; LT.pos[i*3 + 2] = z; LT.col[i*3] = r*k; LT.col[i*3 + 1] = g*k; LT.col[i*3 + 2] = b*k; LT.fl[i*2] = pat; LT.fl[i*2 + 1] = ph; LT.psz[i] = sz;
}
// light positions of a family in the s frame
function famLights(F){
  const W = F.wing, w = F.W/2, zl = w + 1.8;
  return {navL:[F.tipPt[0], F.tipPt[1], -F.tipPt[2]], navR:[F.tipPt[0], F.tipPt[1], F.tipPt[2]], tail:[F.L + 0.1, F.c + F.tail.tipY, 0],
    bTop:[W.s + W.c0*0.4, F.top + 0.18, 0], bBot:[W.s + W.c0*0.7, F.yBot - 0.12, 0],
    landL:[F.wingLE(zl) + 0.3, F.wingY(zl) - 0.25, -zl], landR:[F.wingLE(zl) + 0.3, F.wingY(zl) - 0.25, zl], taxi:[F.xNG - 0.4, F.gear.nose.r*2 + 0.6, 0],
    logoL:[F.tp.s + F.tp.c0*0.45 + 1.0*Math.tan(F.tp.sweep*D2R), (F.tp.T ? F.finTop + 0.4 : F.c + F.tp.y + 0.35), -Math.min(1.6, F.tp.semi*0.3)], logoR:[F.tp.s + F.tp.c0*0.45 + 1.0*Math.tan(F.tp.sweep*D2R), (F.tp.T ? F.finTop + 0.4 : F.c + F.tp.y + 0.35), Math.min(1.6, F.tp.semi*0.3)],
    rtL:[F.wingLE(w + 0.6) + 0.2, F.wingY(w + 0.6) - 0.15, -(w + 0.6)], rtR:[F.wingLE(w + 0.6) + 0.2, F.wingY(w + 0.6) - 0.15, w + 0.6]};
}
const _lv = new THREE.Vector3();
function acLightsWorld(ac, m){
  const F = ac.F, LP = F._lp || (F._lp = famLights(F)), dF = ac.vr.dF, dA = ac.vr.dA, out = ac.lw || (ac.lw = {});
  for (const k in LP){ const q = LP[k], s = q[0] + (q[0] >= F.plugs[0] ? dF : 0) + (q[0] >= F.plugs[1] ? dA : 0); _lv.set(-s, q[1], q[2]).applyMatrix4(m); const o = out[k] || (out[k] = [0, 0, 0]); o[0] = _lv.x; o[1] = _lv.y; o[2] = _lv.z; }
}
function acLightsPush(ac){
  const L = ac.lw; if (!L || ac.st === 'gone') return;
  const ph = ac.id*0.173, st = ac.st, air = st === 'approach' || st === 'takeoff' || st === 'roll', moving = st !== 'park';
  const nv = moving ? 1 : 0.55;
  ltPush(L.navL[0], L.navL[1], L.navL[2], 1, 0.08, 0.06, 0, 0, moving ? 1.1 : 0.8, 0.15*nv);
  ltPush(L.navR[0], L.navR[1], L.navR[2], 0.08, 1, 0.25, 0, 0, moving ? 1.1 : 0.8, 0.15*nv);
  ltPush(L.tail[0], L.tail[1], L.tail[2], 0.9, 0.9, 0.9, 0, 0, moving ? 0.9 : 0.6, 0.1*nv);
  if (nightF > 0.15 && L.logoL){ ltPush(L.logoL[0], L.logoL[1], L.logoL[2], 1, 0.93, 0.8, 0, 0, 0.55, 0); ltPush(L.logoR[0], L.logoR[1], L.logoR[2], 1, 0.93, 0.8, 0, 0, 0.55, 0); }
  if (moving && st !== 'pushwait' || st === 'pushwait'){ ltPush(L.bTop[0], L.bTop[1], L.bTop[2], 1, 0.1, 0.05, 1, ph, 1.5, 0.55); ltPush(L.bBot[0], L.bBot[1], L.bBot[2], 1, 0.1, 0.05, 1, ph + 0.5, 1.5, 0.55); }
  if (air || st === 'hold' && ac.holds && ac.holds[0] && ac.holds[0].why === 'rw'){ ltPush(L.navL[0], L.navL[1], L.navL[2], 1, 1, 1, 2, ph, 2.4, 0.9); ltPush(L.navR[0], L.navR[1], L.navR[2], 1, 1, 1, 2, ph, 2.4, 0.9); ltPush(L.tail[0], L.tail[1], L.tail[2], 1, 1, 1, 2, ph + 0.02, 2.0, 0.9); }
  if (air && (st !== 'takeoff' || ac.alt < 600)){ ltPush(L.landL[0], L.landL[1], L.landL[2], 1, 0.96, 0.86, 0, 0, 7, 0.7); ltPush(L.landR[0], L.landR[1], L.landR[2], 1, 0.96, 0.86, 0, 0, 7, 0.7); }
  else if (st === 'taxi' || st === 'lineup'){ ltPush(L.taxi[0], L.taxi[1], L.taxi[2], 1, 0.95, 0.85, 0, 0, 4, 0.3); if (L.rtL){ ltPush(L.rtL[0], L.rtL[1], L.rtL[2], 1, 0.95, 0.85, 0, 0, 2.2, 0.25); ltPush(L.rtR[0], L.rtR[1], L.rtR[2], 1, 0.95, 0.85, 0, 0, 2.2, 0.25); } }
}

const SIM = {T:0, ac:[], stands:[], G:null, ARR:null, DEP:null, fam:{}, prio:1, log:[]};
const TAN3 = Math.tan(3*D2R), SIG_TD = 630, SIG_F = SIG_TD - 2*12/TAN3;
const glideAlt = sg => sg < SIG_F ? 12 + (SIG_F - sg)*TAN3 : sg < SIG_TD ? 12*Math.pow((SIG_TD - sg)/(SIG_TD - SIG_F), 2) : 0;
const GROUND = {taxi:1, push:1, start:1, roll:1, lineup:1};
function acInit(ac){
  const F = ac.F, v = ac.vr;
  ac.L = famLen(F, v); ac.xNG = F.xNG; ac.xMG = F.xMG + v.dF; ac.W = ac.xMG - ac.xNG; ac.semi = F.semi;
  ac.N = [0, 0]; ac.M = [0, 0]; ac.h = 0; ac.alt = 0; ac.pitch = 0; ac.spd = 0; ac.s = 0; ac.path = null; ac.route = null; ac.blockT = 0; ac.ghost = 0; ac.dirty = true;
}
function acPark(ac, S){
  const c = Math.cos(S.a), sn = Math.sin(S.a);
  ac.stand = S; S.occ = ac; S.res = null; ac.st = 'park'; ac.h = S.a; ac.alt = 0; ac.pitch = 0; ac.spd = 0;
  ac.N = [S.x - c*ac.xNG, S.y - sn*ac.xNG]; ac.M = [S.x - c*ac.xMG, S.y - sn*ac.xMG]; ac.dirty = true; ac.gear = 1; ac.run = 0; ac.liv_dirty = true;
}
// sample points of an aircraft (for the ground conflict test): nose, tail, wing tips, centre
function acPts(ac){ const c = Math.cos(ac.h), s = Math.sin(ac.h), nx = ac.M[0] + c*ac.xMG, ny = ac.M[1] + s*ac.xMG, wx = ac.M[0] + c*(ac.xMG - ac.F.wing.s - 4), wy = ac.M[1] + s*(ac.xMG - ac.F.wing.s - 4);
  return [[nx, ny], [nx - c*ac.L, ny - s*ac.L], [wx - s*ac.semi, wy + c*ac.semi], [wx + s*ac.semi, wy - c*ac.semi], [nx - c*ac.L*0.5, ny - s*ac.L*0.5]]; }
// ground conflicts: every moving aircraft looks along its own path ahead (nose for taxi, tail for pushback) for parts of
// other aircraft on the ground; mutual conflicts (crossings) give way by priority, head-on ones both stop (prevented by routing)
function corridor(a, Lc){
  const out = [], rev = a.st === 'push', pa = rev ? a.push : a.path, lead = rev ? a.L - a.xMG : a.xNG;
  const s0 = a.s + lead; let last = null;
  for (let d = 0; d <= Lc; d += 6){
    const ss = s0 + d; let q;
    if (ss <= pa.L){ q = pathAt(pa, ss); last = q; out.push([q[0], q[1], d, q[2]]); }
    else { if (!last) last = pathAt(pa, pa.L); const e = ss - pa.L; out.push([last[0] + Math.cos(last[2])*e, last[1] + Math.sin(last[2])*e, d, last[2]]); }
  }
  pathAt(pa, a.s);
  return out;
}
function conflicts(){
  const mv = SIM.ac.filter(a => GROUND[a.st] || a.st === 'hold' || (a.st === 'takeoff' && a.alt < 1));
  const act = [];
  for (const a of mv){ a.cf = null; a.xb = Infinity; a.xbBy = null; a.C = null; a.blkBy = null;
    if (a.st === 'taxi' || a.st === 'push' || a.st === 'roll'){ a.C = corridor(a, a.st === 'push' ? 16 + a.spd*a.spd/2.4 + 8 : Math.max(16 + a.spd*a.spd/2.4 + 26, 150)); act.push(a); } }
  for (const a of act){
    const C = a.C, hw = (a.st === 'push' ? a.semi + 3 : a.semi*0.75 + 4), Lc = a.st === 'push' ? C[C.length - 1][2] : 16 + a.spd*a.spd/2.4 + 26, Lmax = C[C.length - 1][2] + a.L + 80;
    for (const b of mv){ if (b === a || Math.hypot(b.M[0] - a.M[0], b.M[1] - a.M[1]) > Lmax + b.L + b.semi) continue;
      let dmin = Infinity; const P = acPts(b);
      for (let k = 0; k < P.length; k++){ const p = P[k], w = k >= 2 && k <= 3 ? hw - 2 : hw; for (const c of C){ if (c[2] >= dmin || c[2] > Lc) break; if (Math.abs(p[0] - c[0]) < w && Math.abs(p[1] - c[1]) < w && Math.hypot(p[0] - c[0], p[1] - c[1]) < w){ dmin = c[2]; break; } } }
      if (dmin < Infinity) (a.cf || (a.cf = [])).push([b, dmin]); }
  }
  // crossings ahead: both paths reach the same spot; the later one (or the lower priority) waits short of it
  for (let i = 0; i < act.length; i++) for (let j = i + 1; j < act.length; j++){
    const a = act[i], b = act[j]; if (a.st === 'push' || b.st === 'push' || Math.hypot(b.M[0] - a.M[0], b.M[1] - a.M[1]) > 420) continue;
    const r = (a.semi + b.semi)*0.5 + 6; let hit = null;
    for (const ca of a.C){ for (const cb of b.C){ if (Math.abs(ca[0] - cb[0]) < r && Math.abs(ca[1] - cb[1]) < r && Math.hypot(ca[0] - cb[0], ca[1] - cb[1]) < r){ const c = Math.abs(Math.cos(ca[3] - cb[3])); if (c < 0.87){ hit = [ca[2], cb[2]]; } break; } } if (hit) break; }
    if (!hit) continue;
    const ta = hit[0]/Math.max(a.spd, 3), tb = hit[1]/Math.max(b.spd, 3), aFirst = Math.abs(ta - tb) < 6 ? a.prio < b.prio : ta < tb;
    const w = aFirst ? b : a, dw = aFirst ? hit[1] : hit[0], other = aFirst ? a : b, v = Math.max(0, dw - (other.semi + w.semi*0.3 + 12));
    if (v < w.xb && !(w.ghost > SIM.T && w.ghostOf === other)){ w.xb = v; w.xbBy = other; }
  }
  for (const a of mv){ a.blk = a.xb; a.blkBy = a.xb < Infinity ? a.xbBy : null; if (!a.cf) continue;
    for (const [b, dd] of a.cf){ if (a.ghost > SIM.T && b === a.ghostOf) continue; const mutual = b.cf && b.cf.some(q => q[0] === a), head = Math.cos(a.h - b.h) < -0.5;
      if (mutual && !head && dd > 14 && (a.st === 'push' ? b.st !== 'push' || a.prio < b.prio : b.st !== 'push' && a.prio < b.prio)) continue; if (dd < a.blk){ a.blk = dd; a.blkBy = b; } } }
}
// ---- planning
function rwNodes(k){ const G = SIM.G, R = k === 0 ? SIM.ARR : SIM.DEP, out = [];
  for (let v = 0; v < G.NX.length; v++){ if (G.rwNode[v] !== SIM.rwIdx[k] || G.comp[v] !== G.main) continue; const tx = []; for (const e of G.adj[v]) if (G.E[e].rw < 0) tx.push(e); if (tx.length) out.push({v, sig:R.sig(gNodeP(G, v)), tx}); }
  return out.sort((a, b) => a.sig - b.sig); }
function routePts(route){ return route.nodes.map(v => gNodeP(SIM.G, v)); }
function planArrivalTaxi(ac){
  const G = SIM.G, R = SIM.ARR, S = ac.stand, sigN = R.sig(ac.N), minSig = sigN + 1050 + SIM.rnd()*500;
  let pick = null, route = null;
  for (const ex of SIM.exits){ if (ex.sig < minSig) continue;
    for (const k of ex.tx){ const w = gOther(G, k, ex.v), dx = G.NX[w] - G.NX[ex.v], dy = G.NY[w] - G.NY[ex.v], l = Math.hypot(dx, dy);
      const fw = (dx*R.u[0] + dy*R.u[1])/l, side = R.u[0]*dy - R.u[1]*dx; if (fw < -0.1 || side > 0) continue;
      const rt = gRoute(G, {v:w, hx:dx, hy:dy}, {k:S.entry.k, t:S.entry.u}, {noRw:true}); if (!rt) continue;
      pick = ex; route = rt; break; }
    if (pick) break; }
  if (!pick) return false;
  const c = Math.cos(S.a), sn = Math.sin(S.a), stop = [S.x - c*ac.xNG, S.y - sn*ac.xNG];
  const P = [ac.N.slice(), gNodeP(G, pick.v)].concat(routePts(route)).concat([[S.entry.x, S.entry.y], [S.x - c*(CODE_LEN[S.code] + 2), S.y - sn*(CODE_LEN[S.code] + 2)], stop]);
  const DP = dedupe(P), RR = DP.map((p, i) => i === 1 ? 170 : Math.hypot(p[0] - S.entry.x, p[1] - S.entry.y) < 0.6 ? 34 : 0);
  const FP = filletPath(DP, 46, RR);
  ac.path = mkPath(FP, {vmax:11, alat:1.3, dec:1.1, vEnd:0, lim:[]});
  // the runway part: allow roll-out speeds until the exit
  const ie = FP.findIndex(p => Math.hypot(p[0] - G.NX[pick.v], p[1] - G.NY[pick.v]) < 60);
  for (let i = 0; i < FP.length && (ie < 0 || i < ie); i++) ac.path.lim[i] = 80;
  rebrake(ac.path, 2.3);
  ac.route = route; ac.holds = []; const ho = gHeadOn(G, route, 0); gUse(G, route, 1); ac.ri = 0; ac.s = 0;
  if (ho >= 0) ac.holds.push({s:Math.max(ac.path.cum[ie > 0 ? ie : 0] + 20, pathSOf(ac.path, gNodeP(G, route.nodes[ho])) - 60 - ac.semi*0.5), why:'conf', i:ho});
  ac.exitS = ac.path.cum[ie > 0 ? ie : 0];
  if (SIM.rnd() < 0.35 && VEH.follow){ const i = VEH.follow.indexOf(null); if (i >= 0){ VEH.follow[i] = ac; ac.followPath = ac.path; ac.followEnd = pathSOf(ac.path, [S.entry.x, S.entry.y]) - 30; } }
  return true;
}
function pathSOf(pa, p){ let best = 0, bd = Infinity; for (let i = 0; i < pa.P.length; i++){ const d = Math.hypot(pa.P[i][0] - p[0], pa.P[i][1] - p[1]); if (d < bd){ bd = d; best = i; } } return pa.cum[best]; }
function dedupe(P){ const o = [P[0]]; for (let i = 1; i < P.length; i++){ const q = o[o.length - 1]; if (Math.hypot(P[i][0] - q[0], P[i][1] - q[1]) > 0.5) o.push(P[i]); } return o; }
function rebrake(pa, dec){ const n = pa.P.length, lim = pa.lim, cum = pa.cum; for (let i = n - 2; i >= 0; i--) lim[i] = Math.min(lim[i], Math.sqrt(lim[i + 1]*lim[i + 1] + 2*dec*(cum[i + 1] - cum[i]))); pa.dec = dec; }
function planDeparture(ac){
  // choose the taxi direction on the stand's taxilane (cheaper route to the departure runway), then build the pushback path
  const G = SIM.G, S = ac.stand, en = S.entry, e = G.E[en.k], best = {c:Infinity}, X = [en.x, en.y];
  for (const [v, w] of [[e.a, e.b], [e.b, e.a]]){
    const dx = G.NX[w] - G.NX[v], dy = G.NY[w] - G.NY[v], l = Math.hypot(dx, dy) || 1, D = [dx/l, dy/l];
    // room behind the pushback: the tail must stay clear of the other stands' parked aircraft
    let room = 34; for (const q of [34, 22, 12, 4]){ room = q; const T1 = [X[0] - D[0]*(ac.W + q + ac.L - ac.xMG + 6), X[1] - D[1]*(ac.W + q + ac.L - ac.xMG + 6)]; if (!SIM.stands.some(S2 => S2 !== S && standHit(S2, X, T1, ac.semi*0.35 + 6))) break; room = -1; }
    const rt = gRoute(G, {v:w, hx:dx, hy:dy}, {v:SIM.depNode.v}, {});
    if (!rt) continue; const c = rt.cost + (room < 0 ? 5000 : (34 - room)*20);
    if (c < best.c){ best.c = c; best.rt = rt; best.D = D; best.w = w; best.room = Math.max(4, room); }
  }
  if (!best.rt) return false;
  const D = best.D, c = Math.cos(S.a), sn = Math.sin(S.a), Mp = [S.x - c*ac.xMG, S.y - sn*ac.xMG];
  const Mend = [X[0] - D[0]*(ac.W + best.room), X[1] - D[1]*(ac.W + best.room)];
  ac.push = mkPath(filletPath([Mp, X, Mend], 30), {vmax:1.6, alat:0.5, dec:0.4, vEnd:0});
  ac.depPlan = best; return true;
}
// does segment A-B pass within r of the fuselage line of the aircraft parked (or parkable) at stand S2?
function standHit(S2, A, B, r){ if (Math.hypot(S2.x - A[0], S2.y - A[1]) > 260) return false; const L2 = CODE_LEN[S2.code] - 3, P = [S2.x, S2.y], Q = [S2.x - Math.cos(S2.a)*L2, S2.y - Math.sin(S2.a)*L2];
  const f = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = dx*dx + dy*dy || 1, t = clamp(((p[0] - a[0])*dx + (p[1] - a[1])*dy)/l, 0, 1); return Math.hypot(a[0] + dx*t - p[0], a[1] + dy*t - p[1]); };
  return Math.min(f(A, P, Q), f(B, P, Q), f(P, A, B), f(Q, A, B)) < r; }
// is the area swept by a pushback (stand lead-in + the taxilane behind) on the way of other ground traffic (now or on its path ahead)?
function pushBlocked(ac){
  const en = ac.stand.entry, D = ac.depPlan.D, X = [en.x, en.y], ext = ac.W + ac.depPlan.room + ac.L - ac.xMG + 6, B = [X[0] - D[0]*ext, X[1] - D[1]*ext], A0 = [ac.stand.x, ac.stand.y];
  const dseg = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = dx*dx + dy*dy || 1, t = clamp(((p[0] - a[0])*dx + (p[1] - a[1])*dy)/l, 0, 1); return Math.hypot(a[0] + dx*t - p[0], a[1] + dy*t - p[1]); };
  const near = (p, r) => dseg(p, X, B) < r || dseg(p, A0, X) < r;
  for (const b of SIM.ac){
    if (b === ac || !(GROUND[b.st] || b.st === 'hold')) continue; const r = b.semi + ac.semi*0.6 + 8;
    if (Math.hypot(b.M[0] - X[0], b.M[1] - X[1]) > 1400) continue;
    for (const p of acPts(b)) if (near(p, r)) return true;
    const pa = b.st === 'push' ? b.push : b.path; if (!pa) continue;
    for (let d = 0; d < 1200; d += 10){ const ss = b.s + d; if (ss > pa.L) break; const q = pathAt(pa, ss); if (near(q, r)){ pathAt(pa, b.s); return true; } }
    pathAt(pa, b.s);
  }
  return false;
}
function startTaxiOut(ac){
  const G = SIM.G, b = ac.depPlan, R = SIM.DEP, dn = SIM.depNode, X = gNodeP(G, dn.v);
  // re-route from the node ahead (traffic may have changed)
  if (ac.route){ gUse(G, ac.route, -1); ac.route = null; }
  const w = b.w, rt = gRoute(G, {v:w, hx:b.D[0], hy:b.D[1]}, {v:dn.v}, {}) || b.rt;
  const P = [ac.N.slice()].concat(routePts(rt)).concat([[X[0] + R.u[0]*70, X[1] + R.u[1]*70]]);
  const FP = filletPath(dedupe(P), 46);
  ac.path = mkPath(FP, {vmax:11, alat:1.2, dec:1.1, vEnd:0});
  // holding point 80 m before the runway centreline
  let iR = 0; for (let i = 0; i < FP.length; i++) if (Math.hypot(FP[i][0] - X[0], FP[i][1] - X[1]) < 45){ iR = i; break; }
  ac.holds = [];
  const ho = gHeadOn(G, rt, 0);
  if (ho >= 0) ac.holds.push({s:Math.max(5, pathSOf(ac.path, gNodeP(G, rt.nodes[ho])) - 60 - ac.semi*0.5), why:'conf', i:ho});
  ac.holds.push({s:Math.max(0, ac.path.cum[iR] - 45 - ac.semi*0.2), why:'rw'});
  ac.route = rt; gUse(G, rt, 1); ac.ri = 0; ac.s = 0; ac.st = 'taxi'; ac.dep = true; ac.prio = SIM.prio++;
}
function stepAc(ac, dt){
  const T = SIM.T;
  switch (ac.st){
    case 'approach': {
      const R = SIM.ARR; ac.sig += lerp(74, 69, clamp((ac.sig + 3000)/3000, 0, 1))*dt; ac.spd = 70;
      ac.alt = glideAlt(ac.sig); ac.pitch = (ac.sig < SIG_F ? 2.6 : lerp(2.6, 5.8, (ac.sig - SIG_F)/(SIG_TD - SIG_F)))*D2R;
      const p = R.at(ac.sig); ac.M = p; ac.N = R.at(ac.sig + ac.W); ac.h = R.hdg; ac.dirty = true;
      if (ac.sig >= SIG_TD){ ac.alt = 0; if (planArrivalTaxi(ac)){ ac.st = 'roll'; ac.spd = 68; ac.prio = 0; } else { acGone(ac); } }
      return;
    }
    case 'takeoff': {
      const R = SIM.DEP, big = ac.F.code !== 'C'; ac.tt = (ac.tt || 0) + dt;
      if (ac.alt <= 0 && ac.pitch < 8*D2R){ ac.spd += (big ? 1.75 : 2.1)*dt; if (ac.spd > (big ? 80 : 74)) ac.pitch = Math.min(11*D2R, ac.pitch + 3*D2R*dt); }
      else { ac.spd = Math.min(100, ac.spd + 1.0*dt); ac.lift = (ac.lift || 0) + dt; ac.alt += Math.min(13, 2 + ac.lift*2.2)*dt; ac.pitch = lerp(ac.pitch, (ac.alt > 400 ? 9 : 13)*D2R, Math.min(1, dt*0.6)); if (ac.lift > 6 && ac.gear){ ac.gear = 0; ac.liv_dirty = true; } }
      ac.sig += ac.spd*dt; ac.M = R.at(ac.sig); ac.N = R.at(ac.sig + ac.W); ac.h = R.hdg; ac.dirty = true;
      if (ac.alt > 35 && SIM.depBusy === ac) SIM.depBusy = null;
      if (ac.sig > R.L + 11000 || ac.alt > 1600){ if (SIM.depBusy === ac) SIM.depBusy = null; acGone(ac); }
      return;
    }
    case 'pushwait': if (T >= ac.pushT){
      const en = ac.stand.entry, G = SIM.G, waited = T - ac.pushReq;
      let busy = SIM.ac.some(b => b !== ac && (GROUND[b.st] || b.st === 'hold') && Math.hypot(b.M[0] - en.x, b.M[1] - en.y) < 170);
      if (!busy && ac.depPlan) busy = pushBlocked(ac);
      if (!busy && ac.depPlan && gHeadOn(G, ac.depPlan.rt, 0) >= 0){ busy = true; if (waited > 30 && ((waited | 0) % 30) < 5) planDeparture(ac); }
      if (busy && waited < 900){ ac.pushT = T + 5; return; }
      ac.st = 'push'; ac.s = 0; ac.spd = 0; ac.prio = SIM.prio++; ac.run = 1; ac.liv_dirty = true;
      if (ac.depPlan && ac.depPlan.rt){ ac.route = ac.depPlan.rt; gUse(G, ac.route, 1); ac.ri = 0; } } return;
    case 'start': if (T >= ac.startT){ startTaxiOut(ac); } return;
    case 'hold': {
      const h = ac.holds[0]; if (T < (ac.holdT || 0)) return;
      if (!h){ ac.st = 'taxi'; return; }
      if (h.why === 'rw'){ const clear = !SIM.depBusy && !SIM.ac.some(b => b.st === 'takeoff' && b.alt < 35); if (clear){ SIM.depBusy = ac; ac.holds.shift(); ac.st = 'taxi'; } }
      else { ac.holdT = T + 2; if (gHeadOn(SIM.G, ac.route, Math.max(h.i, ac.ri)) < 0 || T - ac.holdStart > 240){ ac.holds.shift(); ac.st = 'taxi'; if (T - ac.holdStart > 240) ac.ghost = T + 30; } }
      return;
    }
    case 'push': {
      const pa = ac.push, vt = Math.min(1.6, pathLim(pa, ac.s)), blk = ac.blk;
      let v2 = blk < Infinity ? Math.min(vt, Math.sqrt(Math.max(0, 2*0.4*(blk - 6)))) : vt;
      ac.spd = moveTo(ac.spd, v2, (v2 > ac.spd ? 0.25 : 0.6)*dt); ac.s += ac.spd*dt; deadlock(ac, dt);
      const q = pathAt(pa, ac.s); ac.M = [q[0], q[1]];
      const dx = ac.N[0] - ac.M[0], dy = ac.N[1] - ac.M[1], l = Math.hypot(dx, dy) || 1; ac.N = [ac.M[0] + dx/l*ac.W, ac.M[1] + dy/l*ac.W]; ac.h = Math.atan2(dy, dx); ac.dirty = true;
      if (ac.s >= pa.L - 0.05){ ac.spd = 0; ac.st = 'start'; ac.startT = T + 12; ac.pushDone = T; const S = ac.stand; if (S){ ac.lastStand = S; S.occ = null; S.leaving = ac; } }
      return;
    }
    case 'taxi': case 'roll': {
      const pa = ac.path; pathAt(pa, ac.s);
      let vt = Math.min(ac.st === 'roll' ? 80 : 11, pathLim(pa, ac.s));
      const hd = ac.holds && ac.holds[0]; if (hd) vt = Math.min(vt, Math.sqrt(Math.max(0, 2*1.1*(hd.s - ac.s))));
      if (ac.blk < Infinity) vt = Math.min(vt, Math.sqrt(Math.max(0, 2*1.3*(ac.blk - 14))));
      const dec = ac.st === 'roll' ? 2.4 : 1.5;
      ac.spd = moveTo(ac.spd, vt, (vt > ac.spd ? 0.7 : dec)*dt); ac.s += ac.spd*dt;
      if (ac.pitch > 0) ac.pitch = Math.max(0, ac.pitch - 1.6*D2R*dt);
      const q = pathAt(pa, ac.s); ac.N = [q[0], q[1]];
      const dx = ac.N[0] - ac.M[0], dy = ac.N[1] - ac.M[1], l = Math.hypot(dx, dy) || 1; ac.M = [ac.N[0] - dx/l*ac.W, ac.N[1] - dy/l*ac.W]; ac.h = Math.atan2(dy, dx); ac.dirty = true;
      if (ac.st === 'roll' && ac.spd < 14) ac.st = 'taxi';
      deadlock(ac, dt);
      if (ac.route){ const R = ac.route, G = SIM.G, c = Math.cos(ac.h), sn = Math.sin(ac.h); while (ac.ri < R.nodes.length){ const P = gNodeP(G, R.nodes[ac.ri]), dx = P[0] - ac.N[0], dy = P[1] - ac.N[1]; if (dx*c + dy*sn < 0 || Math.hypot(dx, dy) < 4){ ac.ri++; } else break; } if (ac.ri >= 2) gRelease(G, R, ac.ri - 1); }
      if (hd && ac.s >= hd.s - 0.6 && ac.spd < 0.3){ ac.st = 'hold'; ac.holdT = T + 2; ac.holdStart = T; return; }
      if (ac.s >= pa.L - 0.05 && ac.spd < 0.25){
        gUse(SIM.G, ac.route, -1); ac.route = null;
        if (ac.dep){ ac.st = 'takeoff'; ac.sig = SIM.DEP.sig(ac.M); ac.spd = 2; ac.tt = 0; ac.lift = 0; ac.dep = false; SIM.depBusy = ac; }
        else { const S = ac.stand; acPark(ac, S); ac.arrT = T; ac.readyT = T + 240 + SIM.rnd()*240; turnStart(S, ac, T); }
      }
      return;
    }
  }
}
const moveTo = (v, t, d) => v < t ? Math.min(t, v + d) : Math.max(t, v - d);
// deadlock breaker: an aircraft stopped for a long time by a chain of blockers that leads back to itself ignores its own blocker
// for a short while (never behind a runway queue or a departure lining up)
function deadlock(ac, dt){
  if (!(ac.spd < 0.3 && ac.blk < Infinity && ac.blkBy)){ ac.blockT = 0; return; }
  ac.blockT += dt; if (ac.blockT < 40) return;
  if (ac.blkBy.ghost > SIM.T && ac.blkBy.ghostOf === ac) return;   // the other one is already giving way through us
  let q = ac.blkBy, cyc = false;
  for (let k = 0; k < 8 && q && q.spd < 0.3 && q.st !== 'hold' && q.st !== 'takeoff'; k++){ if (q.blkBy === ac){ cyc = true; break; } q = q.blkBy; }
  if (!cyc) return;
  ac.ghost = SIM.T + 25; ac.ghostOf = ac.blkBy; ac.blockT = 0; SIM.log.push(['ghost', ac.id, Math.round(SIM.T)]);
}
function acGone(ac){ ac.st = 'gone'; ac.goneT = SIM.T; ac.dirty = true; if (ac.stand && ac.stand.res === ac) ac.stand.res = null; if (ac.stand && ac.stand.occ === ac) ac.stand.occ = null; ac.stand = null; if (ac.route){ gUse(SIM.G, ac.route, -1); ac.route = null; } }
function schedule(){
  const T = SIM.T, R = SIM.rnd;
  // free the stands left by departing aircraft once they are well clear
  for (const S of SIM.stands) if (S.leaving){ const a = S.leaving; if (a.st !== 'start' && (a.st === 'gone' || Math.hypot(a.M[0] - S.x, a.M[1] - S.y) > 130)) S.leaving = null; }
  if (T >= SIM.nextArr){
    SIM.nextArr = T + 8;
    const pool = SIM.ac.filter(a => a.st === 'gone' && T - a.goneT > 25);
    const busyApp = SIM.ac.some(a => a.st === 'approach' && a.sig < -15000 + 74*55);
    if (pool.length && !busyApp){
      pool.sort(() => R() - 0.5);
      for (const ac of pool){
        const free = SIM.stands.filter(S => S.entry && !S.occ && !S.res && !S.leaving && fitsStand(ac, S));
        if (!free.length) continue;
        const S = free[Math.floor(R()*free.length)];
        S.res = ac; ac.stand = S; ac.st = 'approach'; ac.sig = -15000; ac.gear = 1; ac.run = 1; ac.liv_dirty = true; ac.prio = SIM.prio++; ac.pitch = 2.6*D2R;
        SIM.nextArr = T + 72 + R()*40; break;
      }
    }
  }
  if (T >= SIM.nextDep){
    SIM.nextDep = T + 6;
    const cand = SIM.ac.filter(a => a.st === 'park' && a.stand && a.stand.entry && a.stand.kind !== 'ga' && T >= a.readyT).sort((a, b) => a.readyT - b.readyT);
    const nTaxiOut = SIM.ac.filter(a => a.dep || a.st === 'push' || a.st === 'pushwait' || a.st === 'start' || a.st === 'hold').length;
    if (nTaxiOut < 5) for (const ac of cand.slice(0, 6)){
      if (!planDeparture(ac)) { ac.readyT = T + 600; continue; }
      ac.st = 'pushwait'; ac.pushT = T + 45; ac.pushReq = T + 45; turnTug(ac.stand, ac, T);
      SIM.nextDep = T + 70 + R()*40; break;
    }
  }
}
function simStep(dt){
  SIM.T += dt; schedule(); SIM.cfAcc = (SIM.cfAcc || 0) + dt; if (SIM.cfAcc >= 0.2){ SIM.cfAcc = 0; conflicts(); }
  for (const ac of SIM.ac) if (ac.st !== 'park' && ac.st !== 'gone') stepAc(ac, dt);
}
// turnaround hooks (filled in by the ground-crew section)
const turnStart = (S, ac, T) => turnStartImpl(S, ac, T), turnTug = (S, ac, T) => turnTugImpl(S, ac, T);


function simBuild(){
  Object.assign(SIM, {T:0, ac:[], log:[], prio:1, depBusy:null, nextArr:0, nextDep:4, moves:false, G:null, rnd:mulberry32(window.SGAirSeed || 90210)});
  const r = mulberry32(4711);
  const rws = (SGR.base.runways || []).filter(q => q.len > 3500 && q.a[0] > 11000 && q.a[1] < 9500).map(rwInfo)
    .sort((a, b) => (a.S[0]*a.e[0] + a.S[1]*a.e[1]) - (b.S[0]*b.e[0] + b.S[1]*b.e[1]));
  if (rws.length >= 2 && SGR.lines){
    SIM.ARR = rws[0]; SIM.DEP = rws[1]; SIM.rwIdx = [0, 1];
    const tl = SGR.lines.filter(l => l.c === 14 && l.P[0] > 12500 && l.P[1] > -800 && l.P[1] < 10000);
    SIM.G = buildGraph(tl, rws);
    SIM.exits = rwNodes(0);
    const dn = rwNodes(1).filter(n => n.sig > -10 && n.sig < 1500); SIM.depNode = dn[0];
    SIM.moves = !!SIM.depNode && SIM.exits.length > 0;
    SIM.rwY = Math.max(0, hC(SIM.ARR.S[0], SIM.ARR.S[1])); SIM.rwYD = Math.max(0, hC(SIM.DEP.S[0], SIM.DEP.S[1]));
  }
  SIM.stands = standList();
  SIM.stands.forEach((S, i) => { S.id = i; S.occ = S.res = S.leaving = null; S.entry = SIM.moves && S.kind !== 'ga' ? standEntry(SIM.G, S) : null; S.y0 = Math.max(0, hC(S.x, S.y)); });
  // a stand whose lead-in line passes close to another stand's parked fuselage only keeps a parked aircraft (no movements)
  const segD = (a, b, c, d) => { const f = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = dx*dx + dy*dy || 1, t = clamp(((p[0] - a[0])*dx + (p[1] - a[1])*dy)/l, 0, 1); return Math.hypot(a[0] + dx*t - p[0], a[1] + dy*t - p[1]); }; return Math.min(f(a, c, d), f(b, c, d), f(c, a, b), f(d, a, b)); };
  for (const S of SIM.stands){ if (!S.entry) continue; const A0 = [S.x, S.y], A1 = [S.entry.x, S.entry.y];
    for (const S2 of SIM.stands){ if (S2 === S || Math.hypot(S2.x - S.x, S2.y - S.y) > 400) continue; const L2 = CODE_LEN[S2.code] - 3, B0 = [S2.x, S2.y], B1 = [S2.x - Math.cos(S2.a)*L2, S2.y - Math.sin(S2.a)*L2];
      if (segD(A0, A1, B0, B1) < 7){ S.entry = null; SIM.log.push(['static stand', S.id, S.gate || S.kind]); break; } } }
  const mk = (fk, freighter) => { const F = FAM[fk], ac = {id:SIM.ac.length, fk, F, vr:pickVar(F, r, freighter), liv:Math.floor(r()*LIVERIES.length)}; acInit(ac); SIM.ac.push(ac); return ac; };
  for (const S of SIM.stands){
    if (r() > (S.kind === 'ga' ? 1 : S.kind === 'cargo' ? 0.65 : 0.86)) continue;
    let fk;
    if (S.kind === 'cargo') fk = pickW(FLEET_MIX.cargo, r);
    else if (S.kind === 'ga') fk = pickW(FLEET_MIX.ga, r);
    else fk = pickW(S.code === 'F' && S.bridges > 0 ? [['a380', 1]] : FLEET_MIX[S.code] || FLEET_MIX.E, r);
    if (S.kind === 'pax' && S.bridges > 0 && (fk === 'atr' || fk === 'biz')) fk = 'a320';
    const ac = mk(fk, S.kind === 'cargo'); acPark(ac, S); ac.readyT = 30 + r()*1100; ac.arrT = 450 - r()*430;
  }
  if (SIM.moves) for (const fk of ['a320', 'b737', 'a320', 'b737', 'a320', 'a350', 'b777', 'b787', 'a330', 'a350', 'a380', 'b787']){ const ac = mk(fk, false); ac.st = 'gone'; ac.goneT = -100; }
  if (SIM.moves){ const ac = mk('b747', true); ac.st = 'gone'; ac.goneT = -100; }
  // instance lists per family (slots are packed per level of detail at run time)
  for (const k of FAM_KEYS) SIM.fam[k] = {n:0, m:[null, null, null], d:[false, false, false], list:[], repack:true};
  for (const ac of SIM.ac){ const f = SIM.fam[ac.fk]; f.n++; f.list.push(ac); ac.lod = -1; ac.slot = -1; }
}
const _m4 = new THREE.Matrix4(), _q4 = new THREE.Quaternion(), _e4 = new THREE.Euler(0, 0, 0, 'YZX'), _p4 = new THREE.Vector3(), _v4 = new THREE.Vector3(), _one = new THREE.Vector3(1, 1, 1), _zero4 = new THREE.Matrix4().makeScale(0, 0, 0);
function acGroundY(ac){ return ac.st === 'approach' ? SIM.rwY + ac.alt : ac.st === 'takeoff' ? (ac.alt > 0 ? SIM.rwYD : Math.max(0, hC(ac.M[0], ac.M[1]))) + ac.alt : Math.max(0, hC(ac.M[0], ac.M[1])); }
function acMatrix(ac){
  if (ac.st === 'gone') return _zero4;
  _e4.set(0, ac.h, ac.pitch); _q4.setFromEuler(_e4); _v4.set(ac.xMG, 0, 0).applyQuaternion(_q4);
  _p4.set(ac.M[0] + _v4.x, acGroundY(ac) + _v4.y, -ac.M[1] + _v4.z);
  return _m4.compose(_p4, _q4, _one);
}
// level of detail by the camera distance (full < 850 m < mid < 2600 m < far), as in the Bay Area / New York modules: each level is
// one InstancedMesh per family holding just the aircraft at that level (slots packed, count = what is drawn)
const LOD_D = [850, 2600];
function acLod(){
  const cp = camera.position;
  for (const ac of SIM.ac){
    let want = -1;
    if (ac.st !== 'gone'){ const dx = ac.M[0] - cp.x, dy = (ac.alt || 0) - cp.y, dz = -ac.M[1] - cp.z, d = Math.sqrt(dx*dx + dy*dy + dz*dz), l = ac.lod;
      want = d < LOD_D[0] + (l === 0 ? 120 : 0) ? 0 : d < LOD_D[1] + (l === 0 || l === 1 ? 250 : 0) ? 1 : 2; }
    if (want !== ac.lod){ ac.lod = want; SIM.fam[ac.fk].repack = true; }
  }
  for (const k of FAM_KEYS){ const f = SIM.fam[k]; if (!f.repack || !f.m[0]) continue; f.repack = false; const n = [0, 0, 0];
    for (const ac of f.list){ ac.slot = ac.lod >= 0 ? n[ac.lod]++ : -1; ac.dirty = ac.liv_dirty = true; }
    for (let l = 0; l < 3; l++){ f.m[l].count = n[l]; f.m[l].visible = n[l] > 0; f.d[l] = true; } }
}
function acSync(){
  acLod();
  for (const ac of SIM.ac){
    const f = SIM.fam[ac.fk]; if (!f.m[0]) continue;
    if (ac.slot < 0){ ac.dirty = false; continue; }
    const im = f.m[ac.lod];
    if (ac.dirty){ const m = acMatrix(ac); im.setMatrixAt(ac.slot, m); acLightsWorld(ac, m); f.d[ac.lod] = true; ac.dirty = false; }
    if (ac.liv_dirty){ setLivery(im, ac.slot, ac.liv, ac.vr, ac.gear !== 0, ac.run && ac.fk === 'atr'); ac.liv_dirty = false; }
  }
  for (const k of FAM_KEYS){ const f = SIM.fam[k]; if (!f.m[0]) continue; for (let l = 0; l < 3; l++) if (f.d[l]){ f.m[l].instanceMatrix.needsUpdate = true; f.d[l] = false; } }
}
function airBuild(){
  airDispose();
  const t0 = performance.now();
  simBuild();
  for (const k of FAM_KEYS){ const f = SIM.fam[k]; if (!f.n) continue; for (let l = 0; l < 3; l++){ f.m[l] = familyMesh(FAM[k], f.n, l); f.m[l].name = 'air_' + k + '_' + l; moverGroup.add(f.m[l]); } }
  for (const ac of SIM.ac){ ac.dirty = true; ac.liv_dirty = true; if (ac.gear === undefined) ac.gear = 1; }
  moverGroup.add(vehBuild()); moverGroup.add(ltBuild()); VEH.follow = [null, null, null]; VEH.followVis = 0;
  for (const S of SIM.stands) if (S.occ) turnStart(S, S.occ, S.occ.arrT || 0);
  // warm start: run the traffic for a while so that there is something moving everywhere
  if (SIM.moves) for (let i = 0; i < 900; i++) simStep(0.5);
  acSync();
  AIR.built = true; AIR.buildMs = performance.now() - t0;
}
function airDispose(){
  for (const k of FAM_KEYS){ const f = SIM.fam[k]; if (!f || !f.m) continue; for (let l = 0; l < 3; l++) if (f.m[l]){ f.m[l].parent && f.m[l].parent.remove(f.m[l]); f.m[l].geometry.dispose(); f.m[l] = null; } }
  if (VEH.im){ VEH.im.parent && VEH.im.parent.remove(VEH.im); VEH.im.geometry.dispose(); VEH.im.material.dispose(); VEH.im = null; }
  if (LT.pts){ LT.pts.parent && LT.pts.parent.remove(LT.pts); LT.pts.geometry.dispose(); LT.pts = null; }
  AIR.built = false;
}
// per frame: ground crew near the camera, all the lights
function airVisuals(t){
  LT.n = 0; LT.uT.value = t;
  for (const ac of SIM.ac) acLightsPush(ac);
  const cp = camera.position; vehUpdate(SIM.T, cp.x, -cp.z, Math.max(0, cp.y - 5));
  if (LT.pts){ const g = LT.pts.geometry; g.setDrawRange(0, LT.n); for (const k of ['position', 'color', 'fl', 'psz']){ const a = g.attributes[k]; a.updateRange.offset = 0; a.updateRange.count = LT.n*a.itemSize; a.needsUpdate = true; } }
}
HOOKS.net.push(() => { if (!SGR.on || !SGR.base) return; try { airBuild(); } catch (e){ console.error('air build', e); } });
HOOKS.frame.push((t, dt) => {
  if (!AIR.built || !SGR.on) return;
  let d = AIR.lastT < 0 ? 0 : t - AIR.lastT; AIR.lastT = t; d = clamp(d, 0, 0.25);
  if (!showNet || !moverGroup.visible) return;
  const t0 = performance.now();
  if (SIM.moves) while (d > 1e-4){ const h = Math.min(d, 0.125); simStep(h); d -= h; }
  acSync();
  airVisuals(t);
  AIR.stats.frameMs = (AIR.stats.frameMs || 0)*0.9 + (performance.now() - t0)*0.1;
});

window.SGAir = Object.assign(window.SGAir || {}, {FAM, FAM_KEYS, LIVERIES, buildFamily, familyMesh, setLivery, AIR, rwInfo, buildGraph, gRoute, gProject, gNearEdges, filletPath, mkPath, pathAt, standList, standEntry, SIM, simStep, simBuild, airBuild,
  ff(sec){ for (let i = 0; i < sec*4; i++) simStep(0.25); acSync(); airVisuals(AIR.lastT > 0 ? AIR.lastT : 0); return SIM.T; },
  VEH, LT, vehUpdate, airVisuals, turnStartImpl, turnTugImpl, visitPose, svcGeom, VK, SLOT_KIND,
  // test helper: put the camera on an aircraft (sel: 'park' | 'push' | 'taxi' | 'approach' | 'takeoff' | 'roll' | 'hold' | id number | {x, y})
  focus(sel, d, el, az, opt){
    opt = opt || {}; let ac = null, P = null, h = 0;
    if (typeof sel === 'number') ac = SIM.ac[sel];
    else if (sel && sel.x !== undefined){ P = [sel.x, sel.y]; }
    else if (sel === 'park'){ let best = -1; for (const S of SIM.stands){ if (!S.occ || S.occ.st !== 'park' || S.kind !== (opt.kind || 'pax')) continue; if (opt.code && S.code !== opt.code) continue; if (opt.remote !== undefined && !S.bridges !== opt.remote) continue; let n = 0; for (const k in S.visits){ const V = S.visits[k]; if (SIM.T >= V.t0 && SIM.T < V.t4) n++; } n += (S.id*0.618 + (opt.seed || 0)) % 1; if (n > best){ best = n; ac = S.occ; } } }
    else if (sel === 'follow'){ ac = VEH.follow.find(a => a && a.st === 'taxi' && a.s > a.exitS + 60 && a.s + 80 < a.followEnd) || null; }
    else if (sel === 'ga'){ const S = SIM.stands.filter(q => q.kind === 'ga' && q.occ)[opt.k || 0]; ac = S ? S.occ : null; }
    else { const L = SIM.ac.filter(a => a.st === sel && (sel !== 'approach' || a.sig > (opt.minSig ?? -6000))); L.sort((a, b) => (b.alt - a.alt)*(opt.high ? 1 : -1)); ac = L[opt.k || 0] || null; }
    if (ac){ const c = Math.cos(ac.h), sn = Math.sin(ac.h), f = opt.f ?? 0.45; P = [ac.M[0] + c*(ac.xMG - ac.L*f), ac.M[1] + sn*(ac.xMG - ac.L*f)]; h = acGroundY(ac) + (opt.dy ?? 4); }
    if (!P) return 'none';
    if (!ac) h = Math.max(0, hC(P[0], P[1]));
    const e = el*D2R, a = (az ?? 0)*D2R + (opt.rel && ac ? -ac.h + PI/2 : 0);
    camera.position.set(P[0] + Math.sin(a)*Math.cos(e)*d, h + Math.sin(e)*d, -P[1] + Math.cos(a)*Math.cos(e)*d); controls.target.set(P[0], h, -P[1]); controls.update();
    if (typeof lodTick === 'function') lodTick();
    acSync(); airVisuals(AIR.lastT > 0 ? AIR.lastT : 0);
    return ac ? {id:ac.id, t:ac.vr.name, st:ac.st, stand:ac.stand ? ac.stand.gate || ac.stand.id : null, x:Math.round(P[0]), y:Math.round(P[1]), alt:Math.round(ac.alt)} : {x:P[0], y:P[1]};
  },
  // draw calls / triangles of this module in the current view (renders twice: with and without our objects)
  dc(){ const objs = FAM_KEYS.flatMap(k => SIM.fam[k].m || []).filter(Boolean).concat([VEH.im, LT.pts]).filter(Boolean), vis = objs.map(o => o.visible); renderer.render(scene, camera); const a = renderer.info.render.calls, ta = renderer.info.render.triangles;
    objs.forEach(o => o.visible = false); renderer.render(scene, camera); const b = renderer.info.render.calls, tb = renderer.info.render.triangles; objs.forEach((o, i) => o.visible = vis[i]); return {calls:a - b, tris:ta - tb, meshes:objs.filter((o, i) => vis[i]).length}; },
  bench(n){ n = n || 300; const t0 = performance.now(); for (let i = 0; i < n; i++){ simStep(1/60); acSync(); airVisuals(AIR.lastT + i/60); } return +((performance.now() - t0)/n).toFixed(3); },
  tris(){ const t = [0, 0, 0], per = {}; for (const k of FAM_KEYS){ const f = SIM.fam[k]; if (!f.m || !f.m[0]) continue; for (let l = 0; l < 3; l++) if (f.m[l].count) t[l] += FAM[k].trisL[l]*f.m[l].count; per[k] = {tris:FAM[k].trisL, n:f.n, drawn:f.m.map(m => m.count)}; }
    return {fullTris:t[0], midTris:t[1], farTris:t[2], aircraftTris:t[0] + t[1] + t[2], vehicleBoxes:VEH.cap, lights:LT.n, perType:per}; },
  status(){ const c = {}; for (const a of SIM.ac) c[a.st] = (c[a.st] || 0) + 1; return {T:Math.round(SIM.T), states:c, stands:SIM.stands.length, buildMs:Math.round(AIR.buildMs || 0), frameMs:+(AIR.stats.frameMs || 0).toFixed(3), log:SIM.log.slice(-5)}; },
  moving(){ return SIM.ac.filter(a => a.st !== 'park' && a.st !== 'gone').map(a => ({id:a.id, t:a.vr.name, st:a.st, x:Math.round(a.M[0]), y:Math.round(a.M[1]), alt:Math.round(a.alt), v:+a.spd.toFixed(1), h:+a.h.toFixed(2)})); }});
}