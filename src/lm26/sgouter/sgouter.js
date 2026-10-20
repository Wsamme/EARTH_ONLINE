// ===== City Brush v29 — group sgouter (Singapore, spread over the island): 7 new landmarks =====
// Fort Siloso Skywalk, Raffles Lighthouse, Haw Par Villa, Jurong Hill Lookout Tower, Science Centre Singapore (+ Omni-Theatre),
// Singapore Botanic Gardens (Bandstand + Burkill Hall + Swan Lake Gazebo) and the former Kallang Airport terminal.
// Real dimensions in metres; local +x east, +z south unless a key says otherwise (rot). No text, logos or brand colours.
{
const PI = Math.PI, HP = PI/2, TAU = PI*2;
const lerp = (a, b, t) => a + (b - a)*t;
const sgX = lon => (lon - 103.845)*111290.5, sgY = lat => (lat - 1.315)*110574;
// ref-local point (metres east / south of an anchor) -> lat / lon
const LL = (lat0, lon0, x, z) => [+(lat0 - z/110574).toFixed(6), +(lon0 + x/111290.5).toFixed(6)];
// triangle batches: many small parts of one colour become one LTris call
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const quad = (o, a, b, c, d) => o.push(...a, ...b, ...c, ...a, ...c, ...d);
const tri = (o, a, b, c) => o.push(...a, ...b, ...c);
// n-sided prism round the segment a-b (radius r)
function segP(o, a, b, r, n){
  n = n || 4; const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2], L = Math.hypot(dx, dy, dz); if (L < 1e-4) return;
  const d = [dx/L, dy/L, dz/L], up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let ux = d[1]*up[2]-d[2]*up[1], uy = d[2]*up[0]-d[0]*up[2], uz = d[0]*up[1]-d[1]*up[0]; const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
  const vx = d[1]*uz-d[2]*uy, vy = d[2]*ux-d[0]*uz, vz = d[0]*uy-d[1]*ux;
  const ring = p => { const R = []; for (let i = 0; i < n; i++){ const t = (i + 0.5)/n*TAU, c = Math.cos(t)*r, s = Math.sin(t)*r; R.push([p[0]+ux*c+vx*s, p[1]+uy*c+vy*s, p[2]+uz*c+vz*s]); } return R; };
  const A = ring(a), B = ring(b);
  for (let i = 0; i < n; i++){ const j = (i+1) % n; quad(o, A[i], A[j], B[j], B[i]); }
}
// oriented box (centre cx, cz, bottom y0) into a batch; ry = rotation about +y like LBox
function boxT(o, cx, y0, cz, w, h, d, ry){
  const c = Math.cos(ry || 0), s = Math.sin(ry || 0), P = (x, y, z) => [cx + x*c + z*s, y, cz - x*s + z*c];
  const hw = w/2, hd = d/2, y1 = y0 + h;
  const A = P(-hw, y0, -hd), B = P(hw, y0, -hd), C = P(hw, y0, hd), D = P(-hw, y0, hd), E = P(-hw, y1, -hd), F = P(hw, y1, -hd), G = P(hw, y1, hd), H = P(-hw, y1, hd);
  quad(o, E, H, G, F); quad(o, A, B, F, E); quad(o, B, C, G, F); quad(o, C, D, H, G); quad(o, D, A, E, H); quad(o, A, D, C, B);
}
// flat polygon [x, z] at height y (triangulated, any simple polygon)
function flatT(o, P, y, down){
  const tri2 = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
  for (const t of tri2){ const a = P[t[0]], b = P[t[1]], c = P[t[2]]; if (down) o.push(a[0], y, a[1], c[0], y, c[1], b[0], y, b[1]); else o.push(a[0], y, a[1], b[0], y, b[1], c[0], y, c[1]); }
}
// vertical walls round polygon P between y0 and y1 (y0/y1 may be functions of the point)
function wallT(o, P, y0, y1, open){
  const f = (v, p) => typeof v === 'function' ? v(p) : v;
  for (let i = 0; i < P.length - (open ? 1 : 0); i++){ const a = P[i], b = P[(i+1) % P.length]; quad(o, [a[0], f(y0, a), a[1]], [b[0], f(y0, b), b[1]], [b[0], f(y1, b), b[1]], [a[0], f(y1, a), a[1]]); }
}
// polygon offset (miter, clamped): d > 0 grows a counter-clockwise (x east, z south -> clockwise on screen) ring outwards
function offP(P, d){
  let A = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; A += a[0]*b[1] - b[0]*a[1]; }
  const sg = A > 0 ? 1 : -1, out = [];
  for (let i = 0; i < P.length; i++){
    const p0 = P[(i - 1 + P.length) % P.length], p1 = P[i], p2 = P[(i+1) % P.length];
    let ax = p1[0]-p0[0], az = p1[1]-p0[1], bx = p2[0]-p1[0], bz = p2[1]-p1[1]; const la = Math.hypot(ax, az) || 1, lb = Math.hypot(bx, bz) || 1; ax /= la; az /= la; bx /= lb; bz /= lb;
    const n1 = [-az*sg, ax*sg], n2 = [-bz*sg, bx*sg]; let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
    const k = d/Math.max(0.4, mx*n1[0] + mz*n1[1]); out.push([p1[0] - mx*k, p1[1] - mz*k]);
  }
  return out;
}
// prism: walls + top (+ optional bottom) of polygon P
const prismT = (ow, ot, P, y0, y1) => { wallT(ow, P, y0, y1); flatT(ot, P, y1); };
// regular n-gon / circle in the x-z plane
const ngon = (n, r, cx, cz, a0) => { const P = []; for (let i = 0; i < n; i++){ const a = (a0 || 0) + i/n*TAU; P.push([(cx || 0) + Math.cos(a)*r, (cz || 0) + Math.sin(a)*r]); } return P; };
// open polyline smoothing (Chaikin)
const chaikin = (P, it) => { for (let k = 0; k < it; k++){ const Q = [P[0]]; for (let i = 0; i < P.length - 1; i++){ const a = P[i], b = P[i+1]; Q.push([a[0]*0.75 + b[0]*0.25, a[1]*0.75 + b[1]*0.25], [a[0]*0.25 + b[0]*0.75, a[1]*0.25 + b[1]*0.75]); } Q.push(P[P.length-1]); P = Q; } return P; };
// app terrain baked round a site: the 70 m nodes (decimetres) -> h(x, y) = the app's hC, top(r, X, Y) = the app's model base
const terrK = T => {
  const hAtB = (x, y) => {
    const fx = Math.min(T.nx - 1.0001, Math.max(0, (x + 28000)/70 - T.i0)), fy = Math.min(T.ny - 1.0001, Math.max(0, (y + 28000)/70 - T.j0));
    const i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j, H = T.H, n = T.nx;
    return ((H[j*n+i]*(1-u) + H[j*n+i+1]*u)*(1-v) + (H[(j+1)*n+i]*(1-u) + H[(j+1)*n+i+1]*u)*v)/10;
  };
  const h = (x, y) => Math.max(-0.3, hAtB(x, y));
  const top = (r, X, Y) => { let hi = -1e9; for (let a = 0; a < 12; a++) for (const f of [0, 0.35, 0.7]) hi = Math.max(hi, h(X + Math.cos(a/12*TAU)*r*f, Y + Math.sin(a/12*TAU)*r*f)); return hi + 0.6; };
  return {h, top};
};
// a lathe (surface of revolution) into a batch: profile [[r, y], ...], n segments, centre cx, cz
function latheT(o, prof, n, cx, cz, a0, a1){
  a0 = a0 || 0; a1 = a1 === undefined ? TAU : a1;
  for (let i = 0; i < n; i++){ const t0 = a0 + (a1 - a0)*i/n, t1 = a0 + (a1 - a0)*(i+1)/n, c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
    for (let k = 0; k < prof.length - 1; k++){ const p = prof[k], q = prof[k+1];
      quad(o, [cx + p[0]*c0, p[1], cz + p[0]*s0], [cx + p[0]*c1, p[1], cz + p[0]*s1], [cx + q[0]*c1, q[1], cz + q[0]*s1], [cx + q[0]*c0, q[1], cz + q[0]*s0]); } }
}
// simple tree (trunk + two blobs) into batches
function treeT(Bt, Bl, x, y, z, s, r, n){
  segP(Bt, [x, y - 1, z], [x, y + 3.2*s, z], 0.28*s, 5);
  for (let k = 0; k < 2; k++){ const cx = x + (r() - 0.5)*1.6*s, cz = z + (r() - 0.5)*1.6*s, cy = y + (3.6 + k*1.5)*s, rr = (3.1 - k*0.7)*s;
    latheT(Bl, [[0.01, cy - rr*0.55], [rr*0.75, cy - rr*0.4], [rr, cy], [rr*0.75, cy + rr*0.38], [0.01, cy + rr*0.55]], n || 7, cx, cz, r()*TAU); }
}

// ======================================================================================================
// Fort Siloso Skywalk (Sentosa, 2015): an 11-storey steel stair tower with a glass "bubble" lift beside the Siloso Point
// cable-car station, and a 181 m treetop walkway on a triangulated steel truss and slender forked columns, ending at
// Fort Siloso; a widened viewing platform with a glass floor ~36 m above the ground. Placement rot 0 on the OSM line
// "Fort Siloso Skywalk" (ref anchor 1.2589, 103.81035; model origin at ref (-40, 58)). The app terrain here has a 28 m
// knoll at the tower (the real tower stands near beach level) falling to 0 m at the fort end, so the deck is set 36 m
// above the map ground at the tower and kept level; every column stands on the map ground (baked terrain).
// ======================================================================================================
{
const A0 = [1.2589, 103.81035], O = [-40, 58], RR = 114;
const [LAT, LON] = LL(A0[0], A0[1], O[0], O[1]);
const TER = {i0:341, j0:308, nx:7, ny:6, H:[-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,220,196,151,-3,-3,-3,311,330,291,213,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3]};
const LINE = [[49.7,91.8],[36.4,88.1],[23.1,84.4],[7.9,78.6],[-7.4,72.9],[-24.6,64.2],[-41.8,55.5],[-59.1,46.8],[-76.3,38.2],[-97.2,34.9],[-118.4,34.9],[-131.5,40.2]].map(p => [p[0] - O[0], p[1] - O[1]]);
const TW = [55.6 - O[0], 90.6 - O[1]], TWX = 10.8, TWZ = 13.0;      // tower centre (local) and plan
LANDMARKS.sgsiloso = {zh:'西乐索炮台空中步道', en:'Fort Siloso Skywalk', cat:'new', r:RR, h:37, lt:{m:0, c:'#fff1dc', k:0.4, e:0.7}, build(){
  const g = new THREE.Group(), B = mkB(), r = LMCTX.rng;
  const X = sgX(LON), Y = sgY(LAT), G = terrK(TER), TOP = G.top(RR, X, Y);
  const gl = (x, z) => G.h(X + x, Y - z) - TOP;
  const STEEL = {c:'#e6e8e5', ds:true}, GREY = {c:'#8f9292', ds:true}, DECKC = {c:'#a39a8c', ds:true}, CORE = {c:'#c9c5bb', ds:true};
  const GLASS = {c:'#b9d3d8', op:0.42, ds:true}, LIFT = {c:'#9fbfc9', op:0.55, ds:true, glow:'#fff0d0', gk:0.35}, FLOOR = {c:'#7fb2bf', op:0.6, ds:true};
  const RAIL = {c:'#d8dad6', ds:true, glow:'#ffe2b0', gk:0.45}, FOOT = {c:'#9c968a', ds:true};
  const DY = gl(TW[0], TW[1]) + 36;                                   // deck level: 36 m above the map ground at the tower
  // ---------- walkway centreline (smoothed OSM line), arc length
  const P = chaikin(LINE, 2), S = [0]; for (let i = 1; i < P.length; i++) S.push(S[i-1] + Math.hypot(P[i][0] - P[i-1][0], P[i][1] - P[i-1][1]));
  const LEN = S[S.length - 1];
  const at = s => { s = Math.max(0, Math.min(LEN - 1e-6, s)); let i = 0; while (i < P.length - 2 && S[i+1] < s) i++; const a = P[i], b = P[i+1], l = S[i+1] - S[i] || 1, t = (s - S[i])/l, tx = (b[0] - a[0])/l, tz = (b[1] - a[1])/l; return {x:a[0] + (b[0] - a[0])*t, z:a[1] + (b[1] - a[1])*t, tx, tz, nx:-tz, nz:tx}; };
  const s0 = Math.max(0, 0.5*TWX - 0.6 - 1.0);                          // walkway starts at the tower's west face
  const HW = 1.6, TD = 2.1;                                           // half width, truss depth
  const pt = (q, off, y) => [q.x + q.nx*off, y, q.z + q.nz*off];
  // deck slab, glass balustrades, handrails, under-deck triangulated truss
  const ds = 1.5, n = Math.ceil((LEN - s0)/ds);
  for (let i = 0; i < n; i++){
    const sa = s0 + i*ds, sb = Math.min(LEN, sa + ds), qa = at(sa), qb = at(sb), y = DY;
    const wa = sa > 34 && sa < 46 ? 3.4 : 0, wb = sb > 34 && sb < 46 ? 3.4 : 0;   // the viewing platform widens to the south-west
    const La = [pt(qa, -HW, y), pt(qa, HW + wa, y)], Lb = [pt(qb, -HW, y), pt(qb, HW + wb, y)];
    const plat = wa && wb, top = plat ? B.p(FLOOR) : B.p(DECKC);
    quad(top, La[0], Lb[0], Lb[1], La[1]);
    quad(B.p(GREY), [La[0][0], y - 0.35, La[0][2]], [La[1][0], y - 0.35, La[1][2]], [Lb[1][0], y - 0.35, Lb[1][2]], [Lb[0][0], y - 0.35, Lb[0][2]]);
    for (const k of [0, 1]){ const a = La[k], b = Lb[k];
      quad(B.p(GREY), [a[0], y - 0.35, a[2]], [b[0], y - 0.35, b[2]], [b[0], y, b[2]], [a[0], y, a[2]]);
      quad(B.p(GLASS), [a[0], y, a[2]], [b[0], y, b[2]], [b[0], y + 1.15, b[2]], [a[0], y + 1.15, a[2]]);
      segP(B.p(RAIL), [a[0], y + 1.2, a[2]], [b[0], y + 1.2, b[2]], 0.06, 4);
      if (i % 2 === 0) segP(B.p(STEEL), [a[0], y, a[2]], [a[0], y + 1.2, a[2]], 0.05, 4); }
    if (wa && !wb || !wa && wb){ const q = wa ? qa : qb, w = wa || wb; for (const yy of [0]) quad(B.p(GLASS), pt(q, HW, y), pt(q, HW + w, y), pt(q, HW + w, y + 1.15), pt(q, HW, y + 1.15)); }
  }
  // truss: top chords at the deck edges, bottom chord on the centreline, Warren diagonals every 3 m
  const tn = Math.ceil((LEN - s0)/3);
  for (let i = 0; i <= tn; i++){
    const sa = s0 + i*3, q = at(Math.min(sa, LEN)), qn = at(Math.min(sa + 3, LEN)), bot = pt(q, 0, DY - 0.35 - TD), botN = pt(qn, 0, DY - 0.35 - TD);
    if (i < tn) segP(B.p(STEEL), bot, botN, 0.16, 5);
    for (const off of [-HW + 0.1, HW - 0.1]){ const tp = pt(q, off, DY - 0.35), tpn = pt(qn, off, DY - 0.35), mid = pt(at(Math.min(sa + 1.5, LEN)), off, DY - 0.35);
      if (i < tn){ segP(B.p(STEEL), tp, tpn, 0.12, 4); segP(B.p(STEEL), bot, mid, 0.07, 4); segP(B.p(STEEL), mid, botN, 0.07, 4); } }
    if (i < tn) segP(B.p(STEEL), pt(q, -HW + 0.1, DY - 0.35), pt(q, HW - 0.1, DY - 0.35), 0.07, 4);
  }
  // forked columns on the map ground (~every 22 m), the tall ones on the low fort side thicker
  const colS = []; for (let s = s0 + 17; s < LEN - 4; s += 21.5) colS.push(s); colS.push(LEN - 2.0);
  for (const s of colS){
    const q = at(s), gx = q.x, gz = q.z, gy = gl(gx, gz), head = DY - 0.35 - TD - 1.6, H = head - gy, rr = Math.min(0.75, 0.32 + H*0.0075);
    segP(B.p(STEEL), [gx, gy - 1.5, gz], [gx, head, gz], rr, 8);
    for (const off of [-HW + 0.1, HW - 0.1]) segP(B.p(STEEL), [gx, head - 0.2, gz], pt(q, off, DY - 0.4), 0.2, 6);
    segP(B.p(STEEL), [gx, head, gz], pt(q, 0, DY - 0.35 - TD), 0.24, 6);
    boxT(B.p(FOOT), gx, gy - 2, gz, 2.6, 2.4, 2.6, Math.atan2(-q.tz, q.tx));
    if (H > 24){ const k = Math.floor(H/14); for (let j = 1; j <= k; j++){ const yy = gy + H*j/(k + 1); boxT(B.p(GREY), gx, yy - 0.3, gz, rr*2.6, 0.6, rr*2.6, Math.atan2(-q.tz, q.tx)); } }
  }
  // far end: landing platform with glass balustrade
  { const q = at(LEN), ang = Math.atan2(-q.tz, q.tx); boxT(B.p(DECKC), q.x + q.tx*1.5, DY - 0.35, q.z + q.tz*1.5, 5.2, 0.35, 5.2, ang);
    for (const [ox, oz, w, d] of [[2.6, 0, 0.08, 5.2], [0, 2.6, 5.2, 0.08], [0, -2.6, 5.2, 0.08]]){ const c = Math.cos(ang), s = Math.sin(ang), cx = q.x + q.tx*1.5 + ox*c + oz*s, cz = q.z + q.tz*1.5 - ox*s + oz*c; boxT(B.p(GLASS), cx, DY, cz, w, 1.15, d, ang); } }
  // ---------- the tower: steel frame, switch-back stairs, glass bubble lift, concrete core stub, roofed top landing
  { const cx = TW[0], cz = TW[1], g0 = gl(cx, cz) - 4, top = DY + 4.6, hx = TWX/2, hz = TWX/2 + 0.6;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) boxT(B.p(STEEL), cx + sx*(hx - 0.35), g0, cz + sz*(hz - 0.35), 0.6, top - g0, 0.6);
    const lev = []; for (let y = gl(cx, cz) + 3.3; y < DY - 0.5; y += 3.3) lev.push(y); lev.push(DY);
    for (const y of lev){
      for (const [ax, az, bx, bz] of [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]]) segP(B.p(STEEL), [cx + ax*(hx - 0.35), y, cz + az*(hz - 0.35)], [cx + bx*(hx - 0.35), y, cz + bz*(hz - 0.35)], 0.16, 4);
    }
    // X bracing on the north and south faces, every second storey
    const lv = [gl(cx, cz)].concat(lev);
    for (let i = 0; i < lv.length - 1; i++) for (const sz of [-1, 1]) if (i % 2 === 0){ const y0 = lv[i], y1 = lv[i+1];
      segP(B.p(STEEL), [cx - hx + 0.35, y0, cz + sz*(hz - 0.35)], [cx + hx - 0.35, y1, cz + sz*(hz - 0.35)], 0.1, 4);
      segP(B.p(STEEL), [cx + hx - 0.35, y0, cz + sz*(hz - 0.35)], [cx - hx + 0.35, y1, cz + sz*(hz - 0.35)], 0.1, 4); }
    // stair flights (west half): landings at each level and mid-level, flights zig-zag
    for (let i = 0; i < lv.length - 1; i++){ const y0 = lv[i], y1 = lv[i+1], ym = (y0 + y1)/2;
      boxT(B.p(GREY), cx - hx + 1.6, ym - 0.2, cz - hz + 1.3, 2.4, 0.2, 2.0); boxT(B.p(GREY), cx - hx + 1.6, y1 - 0.2, cz + hz - 1.3, 2.4, 0.2, 2.0);
      const f = (a, b, ya, yb) => { const o = B.p(GREY); quad(o, [a[0] - 0.6, ya, a[1]], [a[0] + 0.6, ya, a[1]], [b[0] + 0.6, yb, b[1]], [b[0] - 0.6, yb, b[1]]); };
      f([cx - hx + 1.0, cz + hz - 2.3], [cx - hx + 1.0, cz - hz + 2.3], y0, ym);
      f([cx - hx + 2.2, cz - hz + 2.3], [cx - hx + 2.2, cz + hz - 2.3], ym, y1);
      quad(B.p(GLASS), [cx - hx + 0.3, y0, cz - hz + 0.3], [cx - hx + 0.3, y0, cz + hz - 0.3], [cx - hx + 0.3, y0 + 1.1, cz + hz - 0.3], [cx - hx + 0.3, y0 + 1.1, cz - hz + 0.3]);
    }
    // glass lift shaft (east half) with its steel corners and the cab near the top
    const lx = cx + hx - 2.4; boxT(B.p(LIFT), lx, gl(cx, cz), cz, 3.0, top - 0.6 - gl(cx, cz), 3.0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) segP(B.p(STEEL), [lx + sx*1.5, gl(cx, cz), cz + sz*1.5], [lx + sx*1.5, top - 0.6, cz + sz*1.5], 0.09, 4);
    boxT(B.p(CORE), lx, DY - 2.4, cz, 2.6, 2.4, 2.6);
    boxT(B.p(CORE), cx, g0, cz, TWX - 0.4, gl(cx, cz) + 0.4 - g0, 2*hz - 0.4);           // plinth / ground hall base
    boxT(B.p(GLASS), cx - 1.2, gl(cx, cz) + 0.4, cz, TWX - 3.4, 3.0, 2*hz - 1.6);
    // top landing slab, its glass balustrade and the roof canopy
    boxT(B.p(DECKC), cx, DY - 0.35, cz, TWX + 1.2, 0.35, 2*hz + 1.2);
    for (const [ox, oz, w, d] of [[0, -(hz + 0.6), TWX + 1.2, 0.08], [0, hz + 0.6, TWX + 1.2, 0.08], [TWX/2 + 0.6, 0, 0.08, 2*hz + 1.2]]) boxT(B.p(GLASS), cx + ox, DY, cz + oz, w, 1.15, d);
    boxT(B.p(STEEL), cx, top, cz, TWX + 2.2, 0.45, 2*hz + 2.2);
    boxT(B.p(GREY), cx, top + 0.45, cz, TWX + 1.6, 0.25, 2*hz + 1.6);
  }
  B.flush(g); return g; }};
SG_PLACES.push({type:'sgsiloso', lat:LAT, lon:LON, rot:0});
}

// ======================================================================================================
// Raffles Lighthouse (1855, John Bennett): a 29 m round granite tower, painted white, with a corbelled gallery and a
// white lantern, attached to a two-storey keeper's house, on Pulau Satumu (1.3 ha), the southernmost islet of
// Singapore. A working light: three white flashes every 20 s (focal plane 32 m). Rot 0, origin = the OSM footprint
// "Raffles Lighthouse" (ref anchor 1.1602, 103.7406; origin at ref (20.8, 16.5)); the house wings follow that outline.
// ======================================================================================================
{
const A0 = [1.1602, 103.7406], O = [20.8, 16.5];
const [LAT, LON] = LL(A0[0], A0[1], O[0], O[1]);
LANDMARKS.sgrafflesltd = {zh:'莱佛士灯塔', en:'Raffles Lighthouse', cat:'old', r:26, h:30, lt:{m:0, c:'#fff4e2', k:0.35, e:0.6}, build(){
  const g = new THREE.Group(), B = mkB();
  const WH = {c:'#f2f0ea', ds:true}, TRIM = {c:'#dcd8ce', ds:true}, DARK = {c:'#3b4248', ds:true}, WIN = {c:'#4a5560', ds:true, glow:'#ffd9a0', gk:0.35};
  const ROCK = {c:'#8a8478', ds:true}, PAVE = {c:'#c4bdae', ds:true}, GRASS = {c:'#7f9a5a', ds:true}, RAILC = {c:'#2f3438', ds:true};
  const LANT = {c:'#dfe6e8', op:0.45, ds:true, glow:'#fff6dc', gk:1.2}, LAMP = {c:'#fffbe8', glow:'#fffbea', gk:3.0}, ROOFC = {c:'#e9e7e1', ds:true};
  const TX = 21.0 - O[0], TZ = 17.0 - O[1];                                   // tower centre (local)
  // ---- island rock and the walled compound (the islet is ~1 m above high water)
  const rk = ngon(20, 18.8, TX, TZ - 0.5, 0.1).map((p, i) => [p[0] + Math.sin(i*2.3)*1.6, p[1] + Math.cos(i*1.7)*1.4]);
  prismT(B.p(ROCK), B.p(GRASS), rk, -5, 0.15);
  const cmp = [[-8.2, -15.2], [7.6, -15.2], [9.2, 12.8], [-8.8, 12.8]];
  prismT(B.p(TRIM), B.p(PAVE), cmp, -0.5, 0.35);
  for (let i = 0; i < 4; i++){ const a = cmp[i], b = cmp[(i+1) % 4]; if (i === 2) continue; segP(B.p(WH), [a[0], 1.1, a[1]], [b[0], 1.1, b[1]], 0.18, 4); wallT(B.p(WH), [a, b], 0.35, 1.0, true); }
  // ---- keeper's house: north wing (7.2 x 6.5 m) and south wing (11 x 8 m), two storeys, flat roofs behind parapets, verandah
  const wings = [[[17.0, 4.0], [24.2, 4.0], [24.2, 10.6], [17.0, 10.6]], [[15.4, 20.6], [26.4, 20.6], [26.0, 27.6], [17.0, 28.3]]].map(P => P.map(p => [p[0] - O[0], p[1] - O[1]]));
  for (const P of wings){
    prismT(B.p(WH), B.p(ROOFC), P, -0.3, 7.6);
    wallT(B.p(TRIM), offP(P, 0.25), 3.6, 4.0); wallT(B.p(WH), offP(P, 0.1), 7.6, 8.4); flatT(B.p(TRIM), offP(P, 0.1), 8.4);
    // windows with dark frames on both floors
    for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.floor(L/2.6), tx = (b[0] - a[0])/L, tz = (b[1] - a[1])/L, nx = tz, nz = -tx;
      for (let k = 0; k < n; k++){ const u = (k + 0.5)*L/n, cx = a[0] + tx*u + nx*0.06, cz = a[1] + tz*u + nz*0.06;
        for (const y0 of [1.0, 4.8]) quad(B.p(WIN), [cx - tx*0.55, y0, cz - tz*0.55], [cx + tx*0.55, y0, cz + tz*0.55], [cx + tx*0.55, y0 + 1.7, cz + tz*0.55], [cx - tx*0.55, y0 + 1.7, cz - tz*0.55]); } }
  }
  boxT(B.p(WH), -0.3, -0.3, -5.2, 4.6, 4.2, 3.6); boxT(B.p(TRIM), -0.3, 3.9, -5.2, 5.0, 0.4, 4.0);      // link to the north wing
  // ---- the tower: a slightly tapering white masonry shaft, plinth, door, slit windows, corbelled gallery, lantern
  latheT(B.p(WH), [[5.3, -0.3], [5.3, 1.6], [4.35, 1.8], [4.15, 6], [3.75, 16], [3.35, 23.4], [3.35, 23.6], [0, 23.6]], 24, TX, TZ);
  latheT(B.p(TRIM), [[5.35, 1.55], [5.45, 1.75], [4.4, 1.85]], 24, TX, TZ);
  latheT(B.p(TRIM), [[3.36, 22.6], [3.9, 23.2], [4.35, 23.9], [4.35, 24.25], [0, 24.25]], 24, TX, TZ);              // corbel + gallery floor
  for (let i = 0; i < 16; i++){ const a = i/16*TAU; segP(B.p(RAILC), [TX + Math.cos(a)*4.2, 24.25, TZ + Math.sin(a)*4.2], [TX + Math.cos(a)*4.2, 25.35, TZ + Math.sin(a)*4.2], 0.04, 4); }
  latheT(B.p(RAILC), [[4.18, 25.3], [4.25, 25.3], [4.25, 25.42], [4.18, 25.42], [4.18, 25.3]], 24, TX, TZ);
  for (const [y, a] of [[3.0, 0.3], [8.5, 2.2], [13.5, 4.1], [18.5, 0.3], [21.2, 2.2]]){ const rr = lerp(4.17, 3.36, y/23.5) + 0.04; const c = Math.cos(a), s = Math.sin(a);
    quad(B.p(DARK), [TX + c*rr - s*0.35, y, TZ + s*rr + c*0.35], [TX + c*rr + s*0.35, y, TZ + s*rr - c*0.35], [TX + c*rr + s*0.35, y + 1.3, TZ + s*rr - c*0.35], [TX + c*rr - s*0.35, y + 1.3, TZ + s*rr + c*0.35]); }
  { const a = -HP, rr = 4.3, c = Math.cos(a), s = Math.sin(a); quad(B.p(DARK), [TX + c*rr - s*0.65, 1.85, TZ + s*rr + c*0.65], [TX + c*rr + s*0.65, 1.85, TZ + s*rr - c*0.65], [TX + c*rr + s*0.65, 4.1, TZ + s*rr - c*0.65], [TX + c*rr - s*0.65, 4.1, TZ + s*rr + c*0.65]); }
  // lantern: low pedestal, 12-sided glazing with astragals, dome, ventilator ball, vane rod
  latheT(B.p(WH), [[2.25, 24.25], [2.25, 25.2], [2.05, 25.25], [0, 25.25]], 16, TX, TZ);
  latheT(B.p(LANT), [[1.95, 25.25], [1.95, 28.0]], 12, TX, TZ);
  for (let i = 0; i < 12; i++){ const a = i/12*TAU; segP(B.p(ROOFC), [TX + Math.cos(a)*1.97, 25.25, TZ + Math.sin(a)*1.97], [TX + Math.cos(a + 0.52)*1.97, 28.0, TZ + Math.sin(a + 0.52)*1.97], 0.035, 3); }
  for (const y of [26.15, 27.05]) latheT(B.p(ROOFC), [[1.98, y], [1.98, y + 0.07]], 12, TX, TZ);
  latheT(B.p(ROOFC), [[2.25, 28.0], [2.25, 28.15], [1.9, 28.35], [1.4, 28.85], [0.6, 29.15], [0.25, 29.2], [0, 29.25]], 16, TX, TZ);
  LSph(g, 0.3, TX, 29.45, TZ, ROOFC, 1, 8);
  segP(B.p(RAILC), [TX, 29.6, TZ], [TX, 30.4, TZ], 0.03, 3);
  LSph(g, 0.55, TX, 26.6, TZ, LAMP, 1, 10);
  if (typeof lampTex !== 'undefined') lmSparkle(g, [TX, 26.6, TZ, TX + 0.25, 26.7, TZ, TX - 0.25, 26.5, TZ + 0.1], 28, 0.95);   // the flashing light
  B.flush(g); return g; }};
SG_PLACES.push({type:'sgrafflesltd', lat:LAT, lon:LON, rot:0});
}

// ======================================================================================================
// Jurong Hill Lookout Tower (1969–70, Jurong Town Corporation): an 18 m concrete spiral-ramp tower — no stairs — whose
// single ramp, carried on 18 columns, winds three turns up to a viewing deck and an enclosed top room with a skylight;
// a restaurant once filled the glazed base. White painted concrete. Rot 0 on the OSM footprint "Jurong Hill Tower"
// (ref sgouter_2 anchor 1.31742, 103.70786; origin at the footprint centre ref (-0.45, -0.3)).
// ======================================================================================================
{
const A0 = [1.31742, 103.70786], O = [-0.45, -0.3];
const [LAT, LON] = LL(A0[0], A0[1], O[0], O[1]);
LANDMARKS.sgjurongtower = {zh:'裕廊山瞭望塔', en:'Jurong Hill Lookout Tower', cat:'old', r:36, h:18.2, lt:{m:0, c:'#fff2de', k:0.6, e:0.65}, build(){
  const g = new THREE.Group(), B = mkB();
  const WH = {c:'#eeebe3', ds:true}, EDGE = {c:'#d3cfc4', ds:true}, SOFF = {c:'#c8c3b8', ds:true}, GL = {c:'#3c4952', ds:true, glow:'#ffd9a6', gk:0.45};
  const MUL = {c:'#e8e5dd', ds:true}, PAVE = {c:'#b9b2a4', ds:true}, RAILC = {c:'#6b6e70', ds:true};
  const RI = 5.3, RO = 8.35, Y0 = 0.25, YT = 13.2, TURNS = 3, NS = 36*TURNS;
  // plinth / terrace and the glazed base pavilion round a solid core
  latheT(B.p(PAVE), [[0, 0.25], [9.6, 0.25], [9.6, -4]], 28, 0, 0);
  latheT(B.p(GL), [[4.9, 0.25], [4.9, 3.4]], 24, 0, 0);
  latheT(B.p(WH), [[4.9, 3.4], [5.1, 3.4], [5.1, 3.9], [0, 3.9]], 24, 0, 0);
  latheT(B.p(WH), [[2.4, 3.9], [2.4, YT], [0, YT]], 20, 0, 0);
  for (let i = 0; i < 12; i++){ const a = i/12*TAU; segP(B.p(MUL), [Math.cos(a)*4.95, 0.25, Math.sin(a)*4.95], [Math.cos(a)*4.95, 3.4, Math.sin(a)*4.95], 0.07, 4); }
  // the spiral ramp: slab, solid outer parapet band, inner rail, soffit
  const yA = t => Y0 + (YT - Y0)*t, ang = t => -HP + t*TURNS*TAU;
  for (let i = 0; i < NS; i++){
    const t0 = i/NS, t1 = (i + 1)/NS, a0 = ang(t0), a1 = ang(t1), y0 = yA(t0), y1 = yA(t1), c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    const P = (r, a, y) => [Math.cos(a)*r, y, Math.sin(a)*r];
    quad(B.p(PAVE), P(RI, a0, y0), P(RO, a0, y0), P(RO, a1, y1), P(RI, a1, y1));
    quad(B.p(SOFF), P(RI, a0, y0 - 0.45), P(RI, a1, y1 - 0.45), P(RO, a1, y1 - 0.45), P(RO, a0, y0 - 0.45));
    quad(B.p(WH), P(RO + 0.15, a0, y0 - 0.6), P(RO + 0.15, a1, y1 - 0.6), P(RO + 0.15, a1, y1 + 1.05), P(RO + 0.15, a0, y0 + 1.05));
    quad(B.p(WH), P(RO - 0.05, a0, y0), P(RO - 0.05, a1, y1), P(RO - 0.05, a1, y1 + 1.05), P(RO - 0.05, a0, y0 + 1.05));
    quad(B.p(EDGE), P(RO - 0.05, a0, y0 + 1.05), P(RO - 0.05, a1, y1 + 1.05), P(RO + 0.15, a1, y1 + 1.05), P(RO + 0.15, a0, y0 + 1.05));
    quad(B.p(SOFF), P(RI, a0, y0 - 0.45), P(RI, a1, y1 - 0.45), P(RI, a1, y1), P(RI, a0, y0));
    segP(B.p(RAILC), P(RI + 0.1, a0, y0 + 0.95), P(RI + 0.1, a1, y1 + 0.95), 0.04, 3);
    if (i % 3 === 0) segP(B.p(RAILC), P(RI + 0.1, a0, y0), P(RI + 0.1, a0, y0 + 0.95), 0.03, 3);
  }
  // the 18 columns round the outside, from the terrace to the roof ring
  for (let i = 0; i < 18; i++){ const a = i/18*TAU + 0.09; segP(B.p(WH), [Math.cos(a)*8.75, -1.0, Math.sin(a)*8.75], [Math.cos(a)*8.75, 16.7, Math.sin(a)*8.75], 0.24, 6); }
  // top: viewing deck, the enclosed top room (glass band), roof ring on the columns, skylight
  latheT(B.p(PAVE), [[2.3, YT], [8.45, YT]], 36, 0, 0);
  latheT(B.p(SOFF), [[8.45, YT - 0.5], [2.3, YT - 0.5]], 36, 0, 0);
  latheT(B.p(WH), [[8.5, YT - 0.5], [8.5, YT + 1.05], [8.3, YT + 1.05], [8.3, YT]], 36, 0, 0);
  latheT(B.p(GL), [[4.9, YT], [4.9, 16.3]], 24, 0, 0);
  for (let i = 0; i < 16; i++){ const a = i/16*TAU; segP(B.p(MUL), [Math.cos(a)*4.95, YT, Math.sin(a)*4.95], [Math.cos(a)*4.95, 16.3, Math.sin(a)*4.95], 0.07, 4); }
  latheT(B.p(WH), [[0, 16.3], [9.2, 16.3], [9.2, 17.15], [2.6, 17.15]], 36, 0, 0);
  latheT(B.p(SOFF), [[9.2, 16.3], [0, 16.3]], 36, 0, 0);
  latheT(B.p(EDGE), [[2.6, 17.15], [2.6, 17.45], [2.2, 17.9], [1.2, 18.15], [0, 18.2]], 16, 0, 0);
  // the single-storey hilltop restaurant pavilion that hugs the tower on the east (OSM footprint; replaces its 17.6 m estimate)
  { const REST = [[13.5, 7.4], [17.7, 3.3], [19.5, -4.4], [33.2, -4.4], [31.5, 5.1], [27.9, 12.8], [20.1, 18.7], [15.3, 21.1], [7.6, 22.3], [7.0, 10.4]].map(p => [p[0] - O[0], p[1] - O[1]]);
    wallT(B.p(PAVE), REST, -3, 0.3); flatT(B.p(PAVE), REST, 0.3); wallT(B.p(GL), offP(REST, -0.6), 0.3, 3.3); wallT(B.p(WH), offP(REST, -0.6), 3.3, 4.2);
    for (const p of offP(REST, -0.2)) segP(B.p(WH), [p[0], 0.3, p[1]], [p[0], 4.2, p[1]], 0.16, 5);
    const E = offP(REST, 0.9); wallT(B.p(EDGE), E, 4.2, 4.7); flatT(B.p(WH), E, 4.7); flatT(B.p(SOFF), E, 4.2, true); }
  B.flush(g); return g; }};
SG_PLACES.push({type:'sgjurongtower', lat:LAT, lon:LON, rot:0});
}

// ======================================================================================================
// Former Kallang Airport terminal (1937, Frank Dorrington Ward / PWD): the Art Deco / streamline terminal of Singapore's
// first civil airport — a long white two-storey block with a three-storey centre, rounded pavilions with curved
// balconies at both airside corners, continuous ribbon windows, and the cylindrical control tower with its glazed cab
// in the middle of the airside face (the old runway is now Nicoll Highway). Conserved; 9 Kallang Airport Way.
// Model frame: +x along the building to the north-east, +z = the airside face (south-east), rot 0.5515
// (ref sgouter_1 anchor 1.30742, 103.87360; origin at the OSM footprint centroid ref (-0.1, 0.1)).
// ======================================================================================================
{
const A0 = [1.30742, 103.87360], O = [-0.1, 0.1], ROT = 0.5515;
const [LAT, LON] = LL(A0[0], A0[1], O[0], O[1]);
LANDMARKS.sgkallangairport = {zh:'旧加冷机场大厦', en:'Former Kallang Airport Terminal', cat:'old', r:46, h:23, lt:{m:0, c:'#fff0da', k:0.55, e:0.6, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB();
  const WH = {c:'#f1efe8', ds:true}, TRIM = {c:'#d9d5ca', ds:true}, BASE = {c:'#b9b2a5', ds:true}, GL = {c:'#45535c', ds:true, glow:'#ffdcae', gk:0.6};
  const MUL = {c:'#e6e3da', ds:true}, ROOF = {c:'#bdb9b0', ds:true}, CAB = {c:'#5d7480', ds:true, glow:'#ffe8c0', gk:0.5}, RAILC = {c:'#55595b', ds:true}, PAVE = {c:'#c8c1b2', ds:true};
  // ---- plan pieces (model frame)
  const MAIN = [[-36.6, -14.8], [-25.4, -14.8], [-25.4, -18.2], [24.2, -18.2], [24.2, -14.6], [36.6, -14.6], [36.6, 15.2], [-36.6, 15.2]];
  const CEN = [[-13.5, -18.2], [13.5, -18.2], [13.5, 15.2], [-13.5, 15.2]];
  const H1 = 9.6, H2 = 13.8;
  // ribbon windows along a wall segment (a -> b, outward normal to the right of a->b for a clockwise-on-screen ring)
  const ribbon = (a, b, y0, y1, step) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 2) return; const tx = (b[0] - a[0])/L, tz = (b[1] - a[1])/L, nx = -tz, nz = tx, e = 0.07, m = 0.9;
    const p = u => [a[0] + tx*u + nx*e, a[1] + tz*u + nz*e];
    const A = p(m), Bp = p(L - m); quad(B.p(GL), [A[0], y0, A[1]], [Bp[0], y0, Bp[1]], [Bp[0], y1, Bp[1]], [A[0], y1, A[1]]);
    const n = Math.max(1, Math.round((L - 2*m)/(step || 1.6))); for (let k = 0; k <= n; k++){ const q = p(m + (L - 2*m)*k/n); boxT(B.p(MUL), q[0], y0, q[1], 0.12, y1 - y0, 0.12); }
    const s0 = p(0.2), s1 = p(L - 0.2); for (const y of [y0 - 0.25, y1]) quad(B.p(TRIM), [s0[0] + nx*0.25, y, s0[1] + nz*0.25], [s1[0] + nx*0.25, y, s1[1] + nz*0.25], [s1[0] + nx*0.25, y + 0.25, s1[1] + nz*0.25], [s0[0] + nx*0.25, y + 0.25, s0[1] + nz*0.25]); };
  // main two-storey block and the three-storey centre
  prismT(B.p(WH), B.p(ROOF), MAIN, -3, H1);
  wallT(B.p(WH), offP(MAIN, 0.15), H1, H1 + 1.0); flatT(B.p(TRIM), offP(MAIN, 0.15), H1 + 1.0);
  prismT(B.p(WH), B.p(ROOF), CEN, H1, H2); wallT(B.p(TRIM), offP(CEN, 0.2), H2, H2 + 0.9); flatT(B.p(TRIM), offP(CEN, 0.2), H2 + 0.9);
  // horizontal plinth band
  wallT(B.p(BASE), offP(MAIN, 0.12), -0.5, 0.9);
  // ribbon windows: ground and first floor on the long faces, second floor on the centre
  const segs = [];
  for (let i = 0; i < MAIN.length; i++){ const a = MAIN[i], b = MAIN[(i+1) % MAIN.length]; segs.push([a, b]); }
  for (const [a, b] of segs){
    // the airside face is interrupted by the tower and the corner pavilions
    if (Math.abs(a[1] - 15.2) < 0.01 && Math.abs(b[1] - 15.2) < 0.01){ for (const [x0, x1] of [[26.5, 7.5], [-7.5, -26.5]]){ ribbon([x0, 15.2], [x1, 15.2], 1.5, 3.4); ribbon([x0, 15.2], [x1, 15.2], 5.6, 7.9); } continue; }
    if (Math.abs(a[0] - 36.6) < 0.01 && Math.abs(b[0] - 36.6) < 0.01){ ribbon(a, [36.6, 6.5], 1.5, 3.4); ribbon(a, [36.6, 6.5], 5.6, 7.9); continue; }
    if (Math.abs(a[0] + 36.6) < 0.01 && Math.abs(b[0] + 36.6) < 0.01){ ribbon([-36.6, 6.5], b, 1.5, 3.4); ribbon([-36.6, 6.5], b, 5.6, 7.9); continue; }
    ribbon(a, b, 1.5, 3.4); ribbon(a, b, 5.6, 7.9);
  }
  ribbon([-13.5, -18.2], [13.5, -18.2], 10.4, 12.6); ribbon([13.5, 15.2], [7.5, 15.2], 10.4, 12.6); ribbon([-7.5, 15.2], [-13.5, 15.2], 10.4, 12.6);
  // landside entrance: tall glazed bay with fins, flat canopy on slim columns
  quad(B.p(GL), [-5, 0.9, -18.28], [5, 0.9, -18.28], [5, 12.8, -18.28], [-5, 12.8, -18.28]);
  for (let k = 0; k <= 6; k++){ const x = -5 + k*10/6; boxT(B.p(WH), x, 0.9, -18.6, 0.35, 12.4, 0.8); }
  boxT(B.p(TRIM), 0, 4.2, -20.8, 14, 0.45, 5.2);
  for (const x of [-6.6, 6.6]) segP(B.p(WH), [x, 0, -22.8], [x, 4.2, -22.8], 0.18, 6);
  // rounded corner pavilions (airside), two storeys with curved balconies and a roof terrace railing
  for (const sx of [-1, 1]){
    const cx = sx*32.3, cz = 12.6, R = 6.1;
    const arc = [], a0 = sx > 0 ? -HP : -HP, n = 14;
    for (let i = 0; i <= n; i++){ const a = sx > 0 ? -HP + PI*0.9*i/n : -HP - PI*0.9*i/n; arc.push([cx + Math.cos(a)*R, cz + Math.sin(a)*R]); }
    const pav = [[cx - sx*6.5, 3.0], ...arc, [cx - sx*6.5, cz + R*0.95]].map(p => [p[0], Math.min(p[1], 18.4)]);
    const ring = sx > 0 ? pav : pav.slice().reverse();
    prismT(B.p(WH), B.p(ROOF), ring, -3, H1 - 0.2);
    for (const [y0, y1] of [[1.5, 3.4], [5.6, 7.9]]){ const o = B.p(GL); for (let i = 1; i < arc.length - 2; i++){ const p = arc[i], q = arc[i+1], f = 1.012; quad(o, [cx + (p[0] - cx)*f, y0, cz + (p[1] - cz)*f], [cx + (q[0] - cx)*f, y0, cz + (q[1] - cz)*f], [cx + (q[0] - cx)*f, y1, cz + (q[1] - cz)*f], [cx + (p[0] - cx)*f, y1, cz + (p[1] - cz)*f]); } }
    for (const y of [4.3, H1 - 0.2]){ const sl = []; for (let i = 0; i < arc.length; i++){ const p = arc[i], f = (R + 1.3)/R; sl.push([cx + (p[0] - cx)*f, cz + (p[1] - cz)*f]); }
      const o = B.p(TRIM); for (let i = 0; i < arc.length - 1; i++){ const p = arc[i], q = arc[i+1], P1 = sl[i], Q1 = sl[i+1]; quad(o, [p[0], y + 0.3, p[1]], [q[0], y + 0.3, q[1]], [Q1[0], y + 0.3, Q1[1]], [P1[0], y + 0.3, P1[1]]); quad(o, [P1[0], y, P1[1]], [Q1[0], y, Q1[1]], [Q1[0], y + 0.3, Q1[1]], [P1[0], y + 0.3, P1[1]]);
        segP(B.p(RAILC), [P1[0], y + 1.35, P1[1]], [Q1[0], y + 1.35, Q1[1]], 0.04, 3); if (i % 2 === 0) segP(B.p(RAILC), [P1[0], y + 0.3, P1[1]], [P1[0], y + 1.35, P1[1]], 0.03, 3); } }
  }
  // the control tower: cylinder on the airside face, vertical glazing strip, balcony, glazed cab, roof disc, mast
  { const cx = -0.8, cz = 14.0, R = 6.0;
    latheT(B.p(WH), [[R, -3], [R, 17.6], [R + 0.5, 17.6], [R + 0.5, 18.2], [0, 18.2]], 28, cx, cz);
    for (const y of [4.6, 9.2, 13.6]) latheT(B.p(TRIM), [[R + 0.02, y], [R + 0.35, y], [R + 0.35, y + 0.3], [R + 0.02, y + 0.3]], 28, cx, cz, 0, PI);
    for (const [y0, y1] of [[1.5, 3.9], [5.6, 8.4], [10.2, 12.9], [14.4, 16.6]]){ const o = B.p(GL); for (let i = 0; i < 10; i++){ const a0 = 0.15 + (PI - 0.3)*i/10, a1 = 0.15 + (PI - 0.3)*(i + 1)/10, f = R + 0.04;
      quad(o, [cx + Math.cos(a0)*f, y0, cz + Math.sin(a0)*f], [cx + Math.cos(a1)*f, y0, cz + Math.sin(a1)*f], [cx + Math.cos(a1)*f, y1, cz + Math.sin(a1)*f], [cx + Math.cos(a0)*f, y1, cz + Math.sin(a0)*f]);
      const m = [cx + Math.cos(a0)*(f + 0.05), cz + Math.sin(a0)*(f + 0.05)]; boxT(B.p(MUL), m[0], y0, m[1], 0.12, y1 - y0, 0.12); } }
    for (let i = 0; i < 20; i++){ const a = i/20*TAU; segP(B.p(RAILC), [cx + Math.cos(a)*6.3, 18.2, cz + Math.sin(a)*6.3], [cx + Math.cos(a)*6.3, 19.25, cz + Math.sin(a)*6.3], 0.03, 3); }
    latheT(B.p(RAILC), [[6.27, 19.2], [6.33, 19.2], [6.33, 19.3], [6.27, 19.3]], 28, cx, cz);
    latheT(B.p(CAB), [[4.3, 18.2], [4.3, 21.4]], 16, cx, cz);
    for (let i = 0; i < 16; i++){ const a = i/16*TAU; segP(B.p(MUL), [cx + Math.cos(a)*4.33, 18.2, cz + Math.sin(a)*4.33], [cx + Math.cos(a)*4.33, 21.4, cz + Math.sin(a)*4.33], 0.06, 3); }
    latheT(B.p(WH), [[0, 21.4], [5.0, 21.4], [5.0, 21.95], [3.6, 22.15], [0, 22.2]], 28, cx, cz);
    segP(B.p(RAILC), [cx, 22.2, cz], [cx, 23.6, cz], 0.07, 4);
  }
  // forecourt paving on the landside
  flatT(B.p(PAVE), [[-16, -18.3], [16, -18.3], [16, -23.5], [-16, -23.5]], 0.06);
  B.flush(g); return g; }};
SG_PLACES.push({type:'sgkallangairport', lat:LAT, lon:LON, rot:ROT});
}

// ======================================================================================================
// Singapore Botanic Gardens (UNESCO World Heritage): three heritage structures as three keys —
//   sgbotanic         the Bandstand (1930): white octagonal pavilion on its knoll in a ring of Yellow Flame trees
//   sgbotanic_burkill Burkill Hall (1868, label:false): the last two-storey Anglo-Malay plantation bungalow — white,
//                     broad upper verandahs, central projecting entrance porch, hipped clay-tile roofs
//   sgbotanic_swan    the Swan Lake Gazebo (label:false): a Victorian cast-iron shelter at the edge of Swan Lake
// Placements on the OSM footprints / POIs (ref sgouter anchor 1.3115, 103.8156; ref sgouter_3 anchor 1.30731, 103.81653).
// ======================================================================================================
{
const A0 = [1.3115, 103.8156];
// ---------------- Bandstand ----------------
{
const O = [85.05, 123.15], RR = 22;
const [LAT, LON] = LL(A0[0], A0[1], O[0], O[1]);
const TER = {i0:353, j0:391, nx:4, ny:4, H:[67,67,67,119,67,67,136,131,123,160,150,145,185,173,163,158]};
LANDMARKS.sgbotanic = {zh:'新加坡植物园 · 音乐台', en:'Singapore Botanic Gardens Bandstand', cat:'old', r:RR, h:10.5, lt:{m:0, c:'#fff3e0', k:0.7, e:0.6, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB(), r = LMCTX.rng;
  const X = sgX(LON), Y = sgY(LAT), G = terrK(TER), TOP = G.top(RR, X, Y), gl = (x, z) => G.h(X + x, Y - z) - TOP;
  const WH = {c:'#f3f1ea', ds:true}, TRIM = {c:'#dedad0', ds:true}, ROOF = {c:'#59625c', ds:true}, ROOF2 = {c:'#4c544f', ds:true}, FLOOR = {c:'#b8b0a2', ds:true};
  const GRASS = {c:'#7c9a55', ds:true}, LAWN = {c:'#86a35c', ds:true}, TRUNK = {c:'#5d4b3b', ds:true}, LEAF = {c:'#6f8f3e', ds:true}, LEAF2 = {c:'#c9a63a', ds:true}, LAMP = {c:'#fff4d8', glow:'#ffe2a8', gk:1.2};
  // the knoll: a grassy mound from the octagon down to the map ground
  { const N = 24, RS = [5.6, 8, 10.5, 13, 15.5, 17.5], o = B.p(GRASS);
    const yAt = (k, x, z) => k === 0 ? 0.25 : k === RS.length - 1 ? gl(x, z) - 0.25 : lerp(0.25, gl(x, z) - 0.2, Math.pow(k/(RS.length - 1), 1.6));
    for (let k = 0; k < RS.length - 1; k++) for (let i = 0; i < N; i++){ const a0 = i/N*TAU, a1 = (i + 1)/N*TAU, P = (rr, a, kk) => { const x = Math.cos(a)*rr, z = Math.sin(a)*rr; return [x, yAt(kk, x, z), z]; };
      quad(o, P(RS[k], a0, k), P(RS[k+1], a0, k + 1), P(RS[k+1], a1, k + 1), P(RS[k], a1, k)); }
    flatT(B.p(LAWN), ngon(N, 5.6), 0.25); }
  // stepped octagonal base, floor, eight columns with capitals and bases, frieze, octagonal roof and lantern
  const R8 = 4.6, oct = (rr, a0) => ngon(8, rr, 0, 0, PI/8 + (a0 || 0));
  for (const [rr, y0, y1] of [[5.3, -3.5, 0.35], [5.0, 0.35, 0.65], [4.75, 0.65, 0.95]]){ wallT(B.p(TRIM), oct(rr), y0, y1); flatT(B.p(FLOOR), oct(rr), y1); }
  const CR = 4.35;
  for (let i = 0; i < 8; i++){ const a = PI/8 + i/8*TAU, x = Math.cos(a)*CR, z = Math.sin(a)*CR;
    boxT(B.p(WH), x, 0.95, z, 0.6, 0.55, 0.6, -a); latheT(B.p(WH), [[0.2, 1.5], [0.17, 4.6]], 8, x, z); boxT(B.p(WH), x, 4.6, z, 0.55, 0.35, 0.55, -a); }
  // balustrade between the columns (open towards one entrance)
  for (let i = 0; i < 8; i++){ if (i === 1) continue; const a0 = PI/8 + i/8*TAU, a1 = PI/8 + (i + 1)/8*TAU, p = [Math.cos(a0)*CR, Math.sin(a0)*CR], q = [Math.cos(a1)*CR, Math.sin(a1)*CR];
    segP(B.p(WH), [p[0], 1.95, p[1]], [q[0], 1.95, q[1]], 0.07, 4); for (let k = 1; k < 8; k++){ const t = k/8; segP(B.p(WH), [lerp(p[0], q[0], t), 0.95, lerp(p[1], q[1], t)], [lerp(p[0], q[0], t), 1.95, lerp(p[1], q[1], t)], 0.045, 4); } }
  // steps on the open side
  { const a = PI/8 + 1.5/8*TAU, c = Math.cos(a), s = Math.sin(a); for (let k = 0; k < 3; k++) boxT(B.p(FLOOR), c*(5.6 + k*0.45), -0.6, s*(5.6 + k*0.45), 2.6, 0.95 - k*0.3 + 0.6, 0.6, -a + HP); }
  // frieze (entablature) and eaves
  wallT(B.p(WH), oct(4.75), 4.95, 5.7); flatT(B.p(TRIM), oct(4.75), 4.95, true);
  wallT(B.p(TRIM), oct(4.95), 5.7, 5.9); flatT(B.p(TRIM), oct(4.95), 5.7, true);
  // octagonal roof: flared eaves, pitched faces up to a small clerestory lantern with its own cap and finial
  const roofRing = (rr, y) => oct(rr).map(p => [p[0], y, p[1]]);
  const R0 = roofRing(5.65, 5.75), R1 = roofRing(4.4, 6.35), R2 = roofRing(1.45, 8.2);
  for (let i = 0; i < 8; i++){ const j = (i + 1) % 8; quad(B.p(ROOF), R0[i], R0[j], R1[j], R1[i]); quad(B.p(ROOF), R1[i], R1[j], R2[j], R2[i]); segP(B.p(ROOF2), R0[i], R2[i], 0.09, 4); }
  wallT(B.p(WH), oct(1.3), 8.2, 9.0); 
  const L0 = roofRing(1.75, 8.95), Lt = [0, 9.9, 0]; for (let i = 0; i < 8; i++) tri(B.p(ROOF), L0[i], L0[(i + 1) % 8], Lt);
  segP(B.p(ROOF2), [0, 9.85, 0], [0, 10.5, 0], 0.07, 4); LSph(g, 0.16, 0, 10.5, 0, ROOF2, 1, 6);
  flatT(B.p(TRIM), oct(4.75), 5.9, true);
  LSph(g, 0.45, 0, 5.25, 0, LAMP, 1, 8); for (let i = 0; i < 8; i++){ const a = PI/8 + i/8*TAU; LSph(g, 0.16, Math.cos(a)*4.6, 5.45, Math.sin(a)*4.6, LAMP, 1, 6); }
  // the ring of Yellow Flame trees round the knoll
  for (let i = 0; i < 9; i++){ const a = i/9*TAU + 0.3, rr = 15.5 + (r() - 0.5)*2, x = Math.cos(a)*rr, z = Math.sin(a)*rr;
    const Bl = B.p(i % 3 === 0 ? LEAF2 : LEAF); treeT(B.p(TRUNK), Bl, x, gl(x, z), z, 1.35, r, 7); }
  B.flush(g); return g; }};
SG_PLACES.push({type:'sgbotanic', lat:LAT, lon:LON, rot:0});
}
// ---------------- Burkill Hall ----------------
{
const O = [-212.85, -91.4], ROT = -0.2565;
const [LAT, LON] = LL(A0[0], A0[1], O[0], O[1]);
LANDMARKS.sgbotanic_burkill = {zh:'伯基尔楼', en:'Burkill Hall', cat:'old', label:false, r:22, h:13.2, lt:{m:0, c:'#fff0d8', k:0.65, e:0.6, anim:'breathe'}, build(){
  const g = new THREE.Group(), B = mkB();
  const WH = {c:'#f4f2ec', ds:true}, TRIM = {c:'#dcd6c9', ds:true}, ROOF = {c:'#93563f', ds:true}, RIDGE = {c:'#7e4834', ds:true}, LOUV = {c:'#6f6a5e', ds:true, glow:'#ffd9a0', gk:0.25};
  const FLOOR = {c:'#a99f8e', ds:true}, DARK = {c:'#4b4a44', ds:true}, PAVE = {c:'#c3bba9', ds:true}, RAILC = {c:'#f0eee8', ds:true};
  const L = 26.0, W = 23.3, hl = L/2, hw = W/2;              // model frame: +x along the north side (towards ESE), +z towards the porch side (SSW)
  // raised ground floor (masonry, arched openings), first floor with verandahs all round, main hipped roof, porch
  boxT(B.p(TRIM), 0, -3, 0, L - 0.2, 3.6, W - 0.2);
  boxT(B.p(WH), 0, 0.6, 0, L - 6.0, 4.4, W - 6.0);                       // ground-floor core
  for (const [sx, sz, along] of [[0, -1, 'x'], [0, 1, 'x'], [-1, 0, 'z'], [1, 0, 'z']]){       // ground-floor arcade piers
    const n = along === 'x' ? 7 : 6, len = along === 'x' ? L - 1.2 : W - 1.2;
    for (let k = 0; k <= n; k++){ const u = -len/2 + len*k/n, x = along === 'x' ? u : sx*(hl - 0.6), z = along === 'x' ? sz*(hw - 0.6) : u; boxT(B.p(WH), x, 0.6, z, 0.9, 4.4, 0.9); } }
  boxT(B.p(FLOOR), 0, 0.6, 0, L - 1.0, 0.12, W - 1.0);
  boxT(B.p(WH), 0, 4.6, 0, L, 0.7, W);                                          // first-floor slab band
  boxT(B.p(WH), 0, 5.3, 0, L - 6.6, 4.0, W - 6.6);                       // first-floor rooms behind the verandahs
  // ground-floor windows (louvred, dark) on the core
  for (const sz of [-1, 1]) for (let k = -3; k <= 3; k++) boxT(B.p(LOUV), k*2.9, 1.6, sz*(hw - 3.0 + 0.05), 1.3, 2.4, 0.1);
  for (const sx of [-1, 1]) for (let k = -2; k <= 2; k++) boxT(B.p(LOUV), sx*(hl - 3.0 + 0.05), 1.6, k*3.0, 0.1, 2.4, 1.3);
  // upper verandah: slim timber posts, balustrade, louvred doors on the inner walls
  for (const [sx, sz, along] of [[0, -1, 'x'], [0, 1, 'x'], [-1, 0, 'z'], [1, 0, 'z']]){
    const n = along === 'x' ? 10 : 9, len = along === 'x' ? L - 0.6 : W - 0.6;
    for (let k = 0; k <= n; k++){ const u = -len/2 + len*k/n, x = along === 'x' ? u : sx*(hl - 0.3), z = along === 'x' ? sz*(hw - 0.3) : u; boxT(B.p(WH), x, 5.3, z, 0.3, 3.9, 0.3); }
    const a = along === 'x' ? [-len/2, sz*(hw - 0.3)] : [sx*(hl - 0.3), -len/2], b = along === 'x' ? [len/2, sz*(hw - 0.3)] : [sx*(hl - 0.3), len/2];
    segP(B.p(RAILC), [a[0], 6.3, a[1]], [b[0], 6.3, b[1]], 0.07, 4);
    const m = 40; for (let k = 0; k <= m; k++){ const t = k/m; segP(B.p(RAILC), [lerp(a[0], b[0], t), 5.3, lerp(a[1], b[1], t)], [lerp(a[0], b[0], t), 6.3, lerp(a[1], b[1], t)], 0.035, 3); }
  }
  for (const sz of [-1, 1]) for (let k = -3; k <= 3; k++) boxT(B.p(LOUV), k*2.75, 5.6, sz*(hw - 3.3 + 0.05), 1.2, 2.8, 0.1);
  for (const sx of [-1, 1]) for (let k = -2; k <= 2; k++) boxT(B.p(LOUV), sx*(hl - 3.3 + 0.05), 5.6, k*2.75, 0.1, 2.8, 1.2);
  boxT(B.p(WH), 0, 9.2, 0, L + 0.3, 0.35, W + 0.3);                        // eaves plate
  hipRoof(g, 0, 0, L + 1.6, W + 1.6, 9.5, 3.7, ROOF, 0, 0);
  segP(B.p(RIDGE), [-(L - W)/2 - 0.0, 13.2, 0], [(L - W)/2, 13.2, 0], 0.12, 4);
  // central porch (porte-cochere) projecting on the +z side, with a balcony room above under its own hipped roof
  { const pz = hw + 3.6, pw = 7.6, pd = 7.2;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) boxT(B.p(WH), sx*(pw/2 - 0.45), 0.6, pz + sz*(pd/2 - 0.45) - 0.0, 0.9, 4.0, 0.9);
    boxT(B.p(WH), 0, 4.6, pz, pw, 0.7, pd); boxT(B.p(WH), 0, 5.3, pz - 0.6, pw - 1.4, 3.9, pd - 2.4);
    for (let k = -2; k <= 2; k++) boxT(B.p(LOUV), k*1.25, 5.6, pz - 0.6 + (pd - 2.4)/2 + 0.05, 0.9, 2.8, 0.1);
    boxT(B.p(WH), 0, 9.2, pz, pw + 0.4, 0.3, pd + 0.4); hipRoof(g, 0, pz + 0.5, pw + 1.4, pd + 1.6, 9.5, 2.5, ROOF, 0, 0);
    for (let k = 0; k < 3; k++) boxT(B.p(PAVE), 0, -0.6, pz + pd/2 + 0.5 + k*0.5, 4.0, 1.2 - k*0.4, 0.5); }
  B.flush(g); return g; }};
SG_PLACES.push({type:'sgbotanic_burkill', lat:LAT, lon:LON, rot:ROT});
}
// ---------------- Swan Lake Gazebo ----------------
{
const [LAT, LON] = [1.30731, 103.81653];
LANDMARKS.sgbotanic_swan = {zh:'天鹅湖凉亭', en:'Swan Lake Gazebo', cat:'old', label:false, r:7, h:7.2, lt:{m:0, c:'#fff4e4', k:0.6, e:0.7}, build(){
  const g = new THREE.Group(), B = mkB();
  const IRON = {c:'#f2f2ee', ds:true}, ROOF = {c:'#e9ebe6', ds:true}, FLOOR = {c:'#b4ab9b', ds:true}, STONE = {c:'#9d968a', ds:true};
  const R = 2.5, oct = rr => ngon(8, rr, 0, 0, PI/8);
  wallT(B.p(STONE), oct(3.3), -3, 0.45); flatT(B.p(FLOOR), oct(3.3), 0.45);
  for (let i = 0; i < 8; i++){ const a = PI/8 + i/8*TAU, x = Math.cos(a)*R, z = Math.sin(a)*R, a2 = PI/8 + (i + 1)/8*TAU, x2 = Math.cos(a2)*R, z2 = Math.sin(a2)*R;
    segP(B.p(IRON), [x, 0.45, z], [x, 3.3, z], 0.08, 6); LSph(g, 0.13, x, 3.35, z, IRON, 1, 6);
    // ornamental brackets (an arc of short members) and frieze rail between the columns
    const n = 6; for (let k = 0; k < n; k++){ const t0 = k/n, t1 = (k + 1)/n, y0 = 3.35 - 0.55*Math.sin(PI*t0), y1 = 3.35 - 0.55*Math.sin(PI*t1);
      segP(B.p(IRON), [lerp(x, x2, t0), y0, lerp(z, z2, t0)], [lerp(x, x2, t1), y1, lerp(z, z2, t1)], 0.035, 3); }
    segP(B.p(IRON), [x, 3.45, z], [x2, 3.45, z2], 0.05, 3);
    if (i !== 0){ segP(B.p(IRON), [x, 1.3, z], [x2, 1.3, z2], 0.035, 3); for (let k = 1; k < 6; k++){ const t = k/6; segP(B.p(IRON), [lerp(x, x2, t), 0.45, lerp(z, z2, t)], [lerp(x, x2, t), 1.3, lerp(z, z2, t)], 0.02, 3); } } }
  // bell-shaped (concave) cast-iron roof with a scalloped valance and a finial
  const prof = [[3.05, 3.4], [2.75, 3.75], [2.2, 4.4], [1.5, 5.2], [0.8, 5.95], [0.35, 6.4], [0.12, 6.6]];
  const RS = prof.map(([rr, y]) => oct(rr).map(p => [p[0], y, p[1]]));
  for (let k = 0; k < RS.length - 1; k++) for (let i = 0; i < 8; i++){ const j = (i + 1) % 8; quad(B.p(ROOF), RS[k][i], RS[k][j], RS[k+1][j], RS[k+1][i]); }
  wallT(B.p(IRON), oct(3.05), 3.15, 3.42);
  segP(B.p(IRON), [0, 6.55, 0], [0, 7.2, 0], 0.05, 4); LSph(g, 0.14, 0, 6.85, 0, IRON, 1, 6);
  B.flush(g); return g; }};
SG_PLACES.push({type:'sgbotanic_swan', lat:LAT, lon:LON, rot:0});
}
}

// ======================================================================================================
// Science Centre Singapore (1977, Raymond Woo & Associates; Jurong East): a brutalist "spaceship settled on earth" —
// a hexagonal central block with a four-storey void, on battered (truncated-pyramid) concrete bases, wrapped by lower
// exhibition halls; a long gallery arm runs north to the Omni-Theatre (1987, sgsciencecentre_omni, label:false): a
// round drum with the low dome of the OMNIMAX theatre and a wedge-shaped lobby. Exposed off-white concrete.
// Rot 0 on the OSM footprints (ref sgouter anchor 1.3329, 103.7359 = the main key's origin; Omni origin at ref (-77.5, -184.5)).
// ======================================================================================================
{
const A0 = [1.3329, 103.7359];
const MAINP = [[38,-22],[78,-3],[78,21],[71,24],[71,71],[65,75],[66,94],[45,105],[44,125],[27,136],[-13,113],[-13,106],[-7,98],[-7,88],[-18,82],[-15,71],[-46,86],[-64,75],[-64,27],[-46,16],[-46,10],[-57,4],[-58,-24],[-86,-26],[-87,-50],[-69,-50],[-69,-28],[-58,-28],[-58,-56],[-43,-65],[-3,-48],[-3,-41],[12,-34],[23,-41],[29,-38]];
const ARM = [[23,-41],[21,-88],[15,-85],[14,-94],[16,-96],[16,-117],[14,-116],[16,-128],[24,-121],[31,-63],[29,-38]];
const NEW = [[29,-38],[31,-63],[54,-47],[72,-60],[71,-83],[91,-71],[97,-60],[98,-40],[77,-50],[38,-22]];
LANDMARKS.sgsciencecentre = {zh:'新加坡科学馆', en:'Science Centre Singapore', cat:'new', r:146, h:26, lt:{m:0, c:'#fff0dc', k:0.5, e:0.6}, build(){
  const g = new THREE.Group(), B = mkB();
  const CON = {c:'#bdb6a8', ds:true}, CON2 = {c:'#aaa395', ds:true}, RIB = {c:'#cbc4b6', ds:true}, ROOF = {c:'#9c978d', ds:true}, GL = {c:'#3f4b53', ds:true, glow:'#ffd9a8', gk:0.6};
  const SKY = {c:'#8fb0bd', op:0.6, ds:true, glow:'#ffe6c0', gk:0.5}, PAVE = {c:'#c4bcac', ds:true}, CAN = {c:'#e3ddd0', ds:true}, DARK = {c:'#5b5952', ds:true};
  // ---- exhibition halls: concrete walls, a recessed glazed band, a battered fascia up to the roof
  // battered (truncated-pyramid) concrete skirt up from the footprint, a vertical glazed storey above, roof parapet
  const halls = (P, h0, h1, inset) => { const Q = offP(P, -inset);
    wallT(B.p(CON), P, -3, 0.6);
    for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], c = Q[(i+1) % P.length], d = Q[i]; quad(B.p(CON2), [a[0], 0.6, a[1]], [b[0], 0.6, b[1]], [c[0], h0, c[1]], [d[0], h0, d[1]]); }
    wallT(B.p(CON), Q, h0, h1); wallT(B.p(GL), offP(Q, 0.05), h0 + 0.9, h0 + 2.6); wallT(B.p(RIB), offP(Q, 0.12), h1 - 0.5, h1 + 0.6); flatT(B.p(ROOF), Q, h1); };
  halls(MAINP, 6.0, 12.0, 2.6);
  halls(NEW, 4.0, 7.5, 1.6);
  // concrete pilasters along the hall walls (every ~6 m)
  for (const [P0, ins, y0, y1] of [[MAINP, 2.6, 6.0, 11.5], [NEW, 1.6, 4.0, 7.0]]){ const P = offP(P0, -ins); for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.floor(L/5), tx = (b[0] - a[0])/L, tz = (b[1] - a[1])/L;
    for (let k = 1; k < n; k++){ const u = k*L/n; boxT(B.p(RIB), a[0] + tx*u, y0, a[1] + tz*u, 0.7, y1 - y0, 0.7, -Math.atan2(tz, tx)); } } }
  // the small amphitheatre shell
  { const Am = [[46,-68],[49,-75],[55,-72],[52,-65]], o = B.p(CAN); wallT(B.p(CON), Am, -1, 0.8); flatT(B.p(PAVE), Am, 0.8);
    const cx = 50.5, cz = -70, n = 8; for (let i = 0; i < n; i++){ const a0 = PI*0.15 + PI*0.7*i/n, a1 = PI*0.15 + PI*0.7*(i + 1)/n, P = (a, y, rr) => [cx + Math.cos(a)*rr, y, cz + Math.sin(a)*rr];
      quad(o, P(a0, 0.8, 4.6), P(a1, 0.8, 4.6), P(a1, 5.4, 2.6), P(a0, 5.4, 2.6)); } }
  // ---- the hexagonal central block on its truncated-pyramid base
  const HC = [5, 55], hex = rr => ngon(6, rr, HC[0], HC[1], 0);
  const H0 = hex(37.5), H1 = hex(32.5);
  for (let i = 0; i < 6; i++){ const j = (i + 1) % 6; quad(B.p(CON2), [H0[i][0], 11.8, H0[i][1]], [H0[j][0], 11.8, H0[j][1]], [H1[j][0], 16.5, H1[j][1]], [H1[i][0], 16.5, H1[i][1]]); }
  wallT(B.p(CON), H1, 16.5, 25.0); flatT(B.p(ROOF), offP(H1, -0.6), 25.0);
  wallT(B.p(RIB), offP(H1, 0.35), 25.0, 26.0); wallT(B.p(RIB), offP(H1, -0.6), 25.0, 26.0); flatT(B.p(RIB), offP(H1, 0.35), 26.0);
  wallT(B.p(GL), offP(H1, 0.06), 19.0, 21.2);                                        // the circular corridor bridge band
  for (let i = 0; i < 6; i++){ const a = H1[i], b = H1[(i+1) % 6], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(L/3.2), tx = (b[0] - a[0])/L, tz = (b[1] - a[1])/L;
    for (let k = 1; k < n; k++){ const u = k*L/n, x = a[0] + tx*u, z = a[1] + tz*u, nx = x - HC[0], nz = z - HC[1], nl = Math.hypot(nx, nz); boxT(B.p(RIB), x + nx/nl*0.35, 16.5, z + nz/nl*0.35, 0.55, 8.5, 0.7, -Math.atan2(tz, tx)); } }
  // roof: the central void's hexagonal skylight lantern and plant boxes
  const S0 = hex(11), S1 = hex(4.5);
  wallT(B.p(CON), S0, 25.0, 26.4);
  for (let i = 0; i < 6; i++){ const j = (i + 1) % 6; quad(B.p(SKY), [S0[i][0], 26.4, S0[i][1]], [S0[j][0], 26.4, S0[j][1]], [S1[j][0], 29.0, S1[j][1]], [S1[i][0], 29.0, S1[i][1]]); }
  flatT(B.p(SKY), S1, 29.0);
  for (const [x, z, w, d] of [[-14, 40, 6, 4], [24, 70, 5, 5], [18, 34, 4, 6]]) boxT(B.p(CON2), x, 25, z, w, 2.2, d);
  // ---- angular concrete crowns on the halls: three raking prisms (lit exhibition halls behind)
  for (const [cx, cz, L, W, h, ry] of [[-30, 50, 26, 18, 6, 0.0], [40, 105, 20, 16, 5.5, -0.5], [-60, -38, 18, 16, 4.5, 0.0]]){
    LFrust(g, L, W, L*0.55, W*0.35, h, cx, 11.6, cz, CON2, ry); }
  // ---- main entrance on Science Centre Road (east): raking canopy on angled piers, glazed lobby
  { const ex = 78.2; quad(B.p(GL), [ex, 0, -1], [ex, 0, 19], [ex, 6.5, 19], [ex, 6.5, -1]);
    const o = B.p(CAN); quad(o, [ex, 7.4, -4], [ex, 7.4, 22], [ex + 12, 5.6, 22], [ex + 12, 5.6, -4]); quad(o, [ex, 7.0, -4], [ex + 12, 5.2, -4], [ex + 12, 5.2, 22], [ex, 7.0, 22]);
    wallT(o, [[ex, -4], [ex + 12, -4], [ex + 12, 22], [ex, 22]], (p) => p[0] > ex + 1 ? 5.2 : 7.0, (p) => p[0] > ex + 1 ? 5.6 : 7.4, true);
    for (const z of [-2, 9, 20]) { segP(B.p(CON), [ex + 10.8, 0, z], [ex + 11.6, 5.4, z], 0.35, 6); }
    flatT(B.p(PAVE), [[ex, -6], [ex + 16, -6], [ex + 16, 24], [ex, 24]], 0.06); }
  B.flush(g); return g; }};
SG_PLACES.push({type:'sgsciencecentre', lat:A0[0], lon:A0[1], rot:0});
// ---------------- The Marquee (the event pavilion in the courtyard between the wings) ----------------
LANDMARKS.sgsciencecentre_marquee = {zh:'新加坡科学馆 大帐篷馆', en:'The Marquee, Science Centre Singapore', cat:'new', label:false, r:24, h:15, lt:{m:0, c:'#fff0dc', k:0.5, e:0.6}, build(){
  const g = new THREE.Group(), B = mkB(), CAN = {c:'#e3ddd0', ds:true}, GL = {c:'#3f4b53', ds:true, glow:'#ffd9a8', gk:0.3}, DARK = {c:'#5b5952', ds:true};
  // The Marquee (event pavilion between the wings): glazed sides under a white tensile roof with three masts
  { const M = [[18,-75],[6,-53],[-25,-71],[-14,-93]].map(p => [p[0] + 3, p[1] + 73]), o = B.p(CAN);
    wallT(B.p(GL), M, -3, 4.5); wallT(o, M, 4.5, 5.2);
    const c = [[-9.5, -7.5], [0, 0], [9.5, 7.5]], mid = (p, q) => [(p[0] + q[0])/2, (p[1] + q[1])/2];
    const E = [M[3], mid(M[3], M[0]), M[0], M[1], mid(M[1], M[2]), M[2]];
    const peaks = c.map(p => [p[0], 14.3, p[1]]), e = E.map(p => [p[0], 5.2, p[1]]);
    tri(o, e[0], e[1], peaks[0]); tri(o, e[1], e[2], peaks[2]); tri(o, e[1], peaks[2], peaks[1]); tri(o, e[1], peaks[1], peaks[0]);
    tri(o, e[3], e[4], peaks[2]); tri(o, e[4], e[5], peaks[0]); tri(o, e[4], peaks[0], peaks[1]); tri(o, e[4], peaks[1], peaks[2]);
    tri(o, e[2], e[3], peaks[2]); tri(o, e[5], e[0], peaks[0]);
    for (const p of peaks) segP(B.p(DARK), [p[0], -0.5, p[2]], [p[0], 15.2, p[2]], 0.18, 6); }
  B.flush(g); return g; }};
{ const [la, lo] = LL(A0[0], A0[1], -3, -73); SG_PLACES.push({type:'sgsciencecentre_marquee', lat:la, lon:lo, rot:0}); }
// ---------------- gallery arm to the Omni-Theatre (part of the same building; own key keeps the plan hulls tight) ----------------
LANDMARKS.sgsciencecentre_arm = {zh:'新加坡科学馆 连廊', en:'Science Centre Singapore gallery arm', cat:'new', label:false, r:52, h:7, lt:{m:0, c:'#fff0dc', k:0.5, e:0.6}, build(){
  const g = new THREE.Group(), B = mkB(), CON = {c:'#bdb6a8', ds:true}, CON2 = {c:'#aaa395', ds:true}, ROOF = {c:'#9c978d', ds:true}, GL = {c:'#3f4b53', ds:true, glow:'#ffd9a8', gk:0.3};
  const P = ARM.map(p => [p[0] - 21, p[1] + 84]);
  wallT(B.p(CON), P, -3, 6.2); flatT(B.p(ROOF), P, 6.2); wallT(B.p(CON2), offP(P, 0.15), 6.2, 7.0); wallT(B.p(GL), offP(P, 0.05), 2.4, 4.6);
  B.flush(g); return g; }};
{ const [la, lo] = LL(A0[0], A0[1], 21, -84); SG_PLACES.push({type:'sgsciencecentre_arm', lat:la, lon:lo, rot:0}); }
// ---------------- Omni-Theatre ----------------
const OO = [-77.5, -184.5];
const [OLAT, OLON] = LL(A0[0], A0[1], OO[0], OO[1]);
LANDMARKS.sgsciencecentre_omni = {zh:'新加坡科学馆 全天域电影院', en:'Omni-Theatre, Science Centre Singapore', cat:'new', label:false, r:78, h:21, lt:{m:0, c:'#fff0dc', k:0.5, e:0.6}, build(){
  const g = new THREE.Group(), B = mkB();
  const CON = {c:'#c3bcae', ds:true}, CON2 = {c:'#aaa395', ds:true}, DOME = {c:'#d9dbd8', ds:true}, DOMEB = {c:'#b9bcbb', ds:true}, GL = {c:'#3f4b53', ds:true, glow:'#ffd9a8', gk:0.35}, ROOF = {c:'#9c978d', ds:true};
  const R = 24.2;
  // drum with two horizontal bands and a glazed foyer ring
  latheT(B.p(CON), [[R, -3], [R, 11.2], [R - 0.8, 11.2]], 40, 0, 0);
  for (const y of [4.6, 8.6]) latheT(B.p(CON2), [[R + 0.02, y], [R + 0.5, y], [R + 0.5, y + 0.45], [R + 0.02, y + 0.45]], 40, 0, 0);
  latheT(B.p(GL), [[R + 0.05, 1.2], [R + 0.05, 3.8]], 40, 0, 0, -0.9, 0.9);
  // the low OMNIMAX dome with ribs and a crown ring
  const dp = []; for (let i = 0; i <= 10; i++){ const t = i/10*HP; dp.push([Math.cos(t)*(R - 1.2), 11.2 + Math.sin(t)*9.6]); }
  latheT(B.p(DOME), dp, 40, 0, 0);
  for (let i = 0; i < 20; i++){ const a = i/20*TAU, pts = dp.map(([rr, y]) => [Math.cos(a)*(rr + 0.08), y + 0.06, Math.sin(a)*(rr + 0.08)]); for (let k = 0; k < pts.length - 2; k++) segP(B.p(DOMEB), pts[k], pts[k+1], 0.12, 3); }
  latheT(B.p(DOMEB), [[3.2, 20.5], [3.2, 20.95], [0, 21.0]], 16, 0, 0);
  // the wedge-shaped lobby pointing east towards the gallery arm
  const W = [[-68,-146],[-7,-161],[-47,-207],[-56,-201],[-53,-194]].map(p => [p[0] - OO[0], p[1] - OO[1]]);
  wallT(B.p(CON), W, -3, (p) => 9.5 - Math.max(0, p[0] - 10)*0.06);
  { const tr = THREE.ShapeUtils.triangulateShape(W.map(p => new THREE.Vector2(p[0], p[1])), []); const o = B.p(ROOF); for (const t of tr){ const q = t.map(k => W[k]); for (const p of q) o.push(p[0], 9.5 - Math.max(0, p[0] - 10)*0.06, p[1]); } }
  wallT(B.p(GL), offP(W, 0.06), 1.0, 4.2);
  B.flush(g); return g; }};
SG_PLACES.push({type:'sgsciencecentre_omni', lat:OLAT, lon:OLON, rot:0});
}

// ======================================================================================================
// Haw Par Villa (1937, Aw Boon Haw and Aw Boon Par; Pasir Panjang Road): the entrance of the hillside park of Chinese
// mythology — the main Tiger Balm archway (three bays, red columns, polychrome lintels, green-glazed upswept roofs,
// guardian lions), the Bearded Old Man and Tiger statues by the gate, the giant seated Laughing Buddha (Pot-Bellied
// Monk) just inside, and a rock-grotto diorama between them. No inscriptions (the boards carry plain colour fields).
// The 1937 villa itself was lost after the war, so only the park's surviving set pieces are modelled. Rot 0 around the
// OSM "Entrance portal" / statue POIs; the archway spans the park's entrance drive (ref anchor 1.28305, 103.78205;
// origin at ref (-70, -110)).
// ======================================================================================================
{
const A0 = [1.28305, 103.78205], O = [-70, -110];
const [LAT, LON] = LL(A0[0], A0[1], O[0], O[1]);
LANDMARKS.sghawpar = {zh:'虎豹别墅', en:'Haw Par Villa', cat:'old', r:30, h:12, lt:{m:0, c:'#ffdcb0', k:0.7, e:0.6}, build(){
  const g = new THREE.Group(), B = mkB(), r = LMCTX.rng;
  const RED = {c:'#a8322a', ds:true}, CREAM = {c:'#efe6cf', ds:true}, GREEN = {c:'#3f7a4e', ds:true}, GREEN2 = {c:'#2f5f3c', ds:true}, GOLD = {c:'#d1a33c', ds:true};
  const BLUE = {c:'#3c6f9c', ds:true}, STONE = {c:'#a69e90', ds:true}, ROCK = {c:'#8c8274', ds:true}, ORANGE = {c:'#d4782c', ds:true}, BLACK = {c:'#2d2b29', ds:true};
  const SKIN = {c:'#d9a77c', ds:true}, ROBE = {c:'#c8963a', ds:true}, PAVE = {c:'#c2b9a6', ds:true}, LANT = {c:'#d8442e', glow:'#ff9a4a', gk:1.2};
  const L = (x, z) => [x - O[0], z - O[1]];
  // ---------------- the main archway (plane along Pasir Panjang Road, passage towards the north-east) ----------------
  { const [cx, cz] = L(-77.2, -124.9), ry = 0.14, c = Math.cos(ry), s = Math.sin(ry), P = (x, y, z) => [cx + x*c + z*s, y, cz - x*s + z*c];
    const bx2 = (x, y, z, w, h, d, col) => { const p = P(x, 0, z); boxT(B.p(col), p[0], y, p[2], w, h, d, ry); };
    flatT(B.p(PAVE), [P(-11, 0, -7), P(11, 0, -7), P(11, 0, 7), P(-11, 0, 7)].map(p => [p[0], p[2]]), 0.08);
    bx2(0, -3, 0, 19, 3.3, 3.2, STONE);
    // four main columns on stone drums, the outer posts lower
    for (const x of [-3.0, 3.0]){ bx2(x, 0.3, 0, 1.25, 1.0, 1.25, STONE); bx2(x, 1.3, 0, 0.8, 7.2, 0.8, RED); }
    for (const x of [-8.2, 8.2]){ bx2(x, 0.3, 0, 1.15, 0.9, 1.15, STONE); bx2(x, 1.2, 0, 0.7, 5.0, 0.7, RED); }
    // lintels and boards: central (with the tiger panel field) and side bays
    bx2(0, 6.3, 0, 7.0, 0.7, 0.9, GREEN2); bx2(0, 7.0, 0, 5.2, 1.5, 0.7, CREAM); bx2(0, 7.25, -0.38, 2.4, 1.0, 0.05, ORANGE); bx2(-1.8, 7.3, -0.38, 0.9, 0.9, 0.05, BLUE); bx2(1.8, 7.3, -0.38, 0.9, 0.9, 0.05, BLUE);
    bx2(0, 7.25, 0.38, 2.4, 1.0, 0.05, ORANGE); bx2(0, 8.5, 0, 7.4, 0.5, 1.0, RED);
    for (const sx of [-1, 1]){ bx2(sx*5.6, 4.3, 0, 4.6, 0.6, 0.8, GREEN2); bx2(sx*5.6, 4.9, 0, 4.2, 1.2, 0.6, CREAM); bx2(sx*5.6, 5.05, -0.33, 2.6, 0.8, 0.05, GREEN); bx2(sx*5.6, 5.05, 0.33, 2.6, 0.8, 0.05, GREEN); bx2(sx*5.6, 6.1, 0, 5.0, 0.4, 0.9, RED); }
    // bracket sets (dougong) under the central roof: stacked gold blocks
    for (let k = -3; k <= 3; k++) for (const sz of [-0.42, 0.42]) bx2(k*0.95, 8.9, sz, 0.45, 0.45, 0.5, GOLD);
    // green-glazed hip-and-gable roofs with upswept corners and ridge ornaments
    const roof = (x0, y0, L2, D, h, up) => { const o = B.p(GREEN), hl = L2/2, hd = D/2;
      const e = [P(x0 - hl, y0 + up, -hd), P(x0 + hl, y0 + up, -hd), P(x0 + hl, y0 + up, hd), P(x0 - hl, y0 + up, hd)], m = [P(x0 - hl + 0.6, y0, -hd + 0.3), P(x0 + hl - 0.6, y0, -hd + 0.3), P(x0 + hl - 0.6, y0, hd - 0.3), P(x0 - hl + 0.6, y0, hd - 0.3)];
      const r1 = P(x0 - hl*0.55, y0 + h, 0), r2 = P(x0 + hl*0.55, y0 + h, 0);
      quad(o, m[0], m[1], r2, r1); quad(o, m[2], m[3], r1, r2); tri(o, m[1], m[2], r2); tri(o, m[3], m[0], r1);
      for (let i = 0; i < 4; i++){ const j = (i + 1) % 4; quad(o, e[i], e[j], m[j], m[i]); }
      segP(B.p(GREEN2), r1, r2, 0.18, 4); for (const rr of [r1, r2]){ segP(B.p(GOLD), rr, [rr[0], rr[1] + 0.7, rr[2]], 0.16, 4); }
      for (let i = 0; i < 4; i++) segP(B.p(GREEN2), m[i], i < 2 ? (i === 0 ? r1 : r2) : (i === 2 ? r2 : r1), 0.1, 3); };
    roof(0, 9.35, 8.6, 3.0, 2.3, 0.55);
    for (const sx of [-1, 1]) roof(sx*5.6, 6.5, 5.8, 2.4, 1.6, 0.45);
    // central finial (a pearl between the ridge ornaments) and lanterns hanging in the central bay
    { const p = P(0, 0, 0); LSph(g, 0.45, p[0], 12.1, p[2], GOLD, 1, 8); for (const sz of [-0.9, 0.9]){ const q = P(0, 0, sz); latheT(B.p(LANT), [[0.05, 5.4], [0.38, 5.6], [0.42, 5.95], [0.3, 6.2], [0.05, 6.25]], 8, q[0], q[2]); } }
    // guardian lions on plinths, outer (north) side
    for (const sx of [-1, 1]){ const q = P(sx*3.0, 0, -2.4); boxT(B.p(STONE), q[0], 0.05, q[2], 1.4, 1.1, 1.8, ry); LSph(g, 0.62, q[0], 1.85, q[2], STONE, 1.15, 10); LSph(g, 0.45, q[0], 2.75, q[2], STONE, 1, 8); }
  }
  // ---------------- the Tiger and the Bearded Old Man by the gate ----------------
  { const [tx, tz] = L(-66.5, -117.5); latheT(B.p(ROCK), [[3.2, -1.5], [3.0, 0.6], [2.2, 1.6], [0.8, 2.1], [0.01, 2.2]], 9, tx, tz);
    const ry = 0.5, c = Math.cos(ry), s = Math.sin(ry), P = (x, z) => [tx + x*c + z*s, 0, tz - x*s + z*c];
    let q = P(0, 0); LSph(g, 1.0, q[0], 3.0, q[2], ORANGE, 0.62, 10); q = P(-1.5, 0); LSph(g, 0.62, q[0], 3.35, q[2], ORANGE, 0.9, 10);
    for (const k of [-0.6, 0, 0.6]){ q = P(k, 0); boxT(B.p(BLACK), q[0], 2.6, q[2], 0.12, 0.9, 1.25, ry); }
    for (const [x, z] of [[-1.0, -0.45], [-1.0, 0.45], [0.9, -0.45], [0.9, 0.45]]){ q = P(x, z); segP(B.p(ORANGE), [q[0], 2.15, q[2]], [q[0], 2.75, q[2]], 0.17, 5); }
    q = P(1.2, 0); segP(B.p(ORANGE), [q[0], 3.0, q[2]], [P(2.0, 0.4)[0], 3.9, P(2.0, 0.4)[2]], 0.1, 4); }
  { const [mx, mz] = L(-87.0, -118.0); boxT(B.p(STONE), mx, -1, mz, 1.6, 1.6, 1.6, 0.4);
    latheT(B.p(CREAM), [[0.75, 0.6], [0.62, 1.8], [0.45, 2.6], [0.01, 2.65]], 8, mx, mz); LSph(g, 0.3, mx, 2.95, mz, SKIN, 1, 8);
    latheT(B.p(CREAM), [[0.01, 2.55], [0.22, 2.6], [0.12, 2.2], [0.01, 2.0]], 6, mx + 0.18, mz); segP(B.p({c:'#6b4a2b', ds:true}), [mx + 0.6, 0.6, mz + 0.3], [mx + 0.7, 3.4, mz + 0.35], 0.05, 4); }
  // ---------------- the giant seated Laughing Buddha on his plinth ----------------
  { const [bx, bz] = L(-65.9, -91.1), ry = -2.82;
    wallT(B.p(STONE), ngon(8, 4.2, bx, bz, PI/8), -2, 1.4); flatT(B.p(PAVE), ngon(8, 4.2, bx, bz, PI/8), 1.4);
    wallT(B.p(RED), ngon(8, 3.3, bx, bz, PI/8), 1.4, 2.1); flatT(B.p(RED), ngon(8, 3.3, bx, bz, PI/8), 2.1);
    const c = Math.cos(ry), s = Math.sin(ry), P = (x, z) => [bx + x*c + z*s, 0, bz - x*s + z*c];
    let q = P(0, 0.2); LSph(g, 2.6, q[0], 3.3, q[2], ROBE, 0.55, 14);                          // crossed legs / lap
    q = P(0, -0.1); LSph(g, 2.0, q[0], 4.9, q[2], ROBE, 1.0, 14);                                // body
    q = P(0, 0.75); LSph(g, 1.45, q[0], 4.6, q[2], SKIN, 0.95, 14);                             // the big bare belly
    q = P(0, 0.05); LSph(g, 1.05, q[0], 7.35, q[2], SKIN, 1.0, 14);                             // head
    for (const sx of [-1, 1]){ q = P(sx*1.0, 0.05); LSph(g, 0.25, q[0], 7.3, q[2], SKIN, 1.6, 6);
      const sh = P(sx*1.8, -0.1), el = P(sx*2.3, 0.8), hd = P(sx*1.6, 1.6); segP(B.p(ROBE), [sh[0], 6.2, sh[2]], [el[0], 4.9, el[2]], 0.6, 7); segP(B.p(SKIN), [el[0], 4.9, el[2]], [hd[0], 4.4, hd[2]], 0.38, 6); LSph(g, 0.42, hd[0], 4.35, hd[2], SKIN, 1, 8); }
    q = P(0, 0.95); LSph(g, 0.35, q[0], 7.25, q[2], SKIN, 0.8, 8);
  }
  // ---------------- a rock-grotto diorama with brightly painted figures ----------------
  { const [gx, gz] = L(-88.5, -100.5), o = B.p(ROCK);
    for (const [dx, dz, rr, hh] of [[0, 0, 4.2, 3.6], [3.4, 2.0, 2.6, 2.6], [-3.2, 1.6, 2.4, 2.2]]) latheT(o, [[rr, -1.5], [rr*0.95, hh*0.4], [rr*0.62, hh*0.85], [rr*0.25, hh], [0.01, hh*1.03]], 9, gx + dx, gz + dz, r()*TAU);
    const cols = [RED, BLUE, GREEN, GOLD, CREAM, ORANGE];
    for (let i = 0; i < 9; i++){ const a = -0.4 + i*0.32, rr = 5.6 + (i % 2)*0.8, x = gx + Math.cos(a)*rr, z = gz + Math.sin(a)*rr, hgt = 1.4 + r()*0.6;
      latheT(B.p(cols[i % cols.length]), [[0.42, 0], [0.38, hgt*0.7], [0.2, hgt*0.82], [0.01, hgt*0.85]], 6, x, z); LSph(g, 0.2, x, hgt + 0.05, z, SKIN, 1, 6); }
    flatT(B.p(PAVE), ngon(10, 7.6, gx, gz + 1.0), 0.05); }
  B.flush(g); return g; }};
SG_PLACES.push({type:'sghawpar', lat:LAT, lon:LON, rot:0});
}
}
