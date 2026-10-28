// ===== Shenzhen · Shekou, Chiwan, Nantou and Qianhai (City Brush, Greater Bay map, group szshekou) =====
// Landmarks: Sea World Culture and Arts Center (Design Society), Shekou Cruise Center, Chiwan Tin Hau Temple, the Tomb of the
// Last Song Emperor, Chiwan Left Fort, the Qianhai International Conference Center, Shimao Qianhai Centre.
// Sites: Sea World with the Minghua ship, Nantou Ancient City, Qianhai Stone Park, the Qianhai Youth Innovation Hub, the Shekou
// Container Terminal. Every model stands on its real OSM footprint (local metres round the anchor: +x east, +z south; rot 0
// everywhere, so the footprints are used as they are). Data in D (tools/gendata.py). No logos, wordmarks or text anywhere.
{
const PI = Math.PI, TAU = PI*2, HP = PI/2;
const lerp = (a, b, t) => a + (b - a)*t, clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const sstep = (a, b, x) => { const t = clamp((x - a)/(b - a), 0, 1); return t*t*(3 - 2*t); };
// ---------- world and ground ----------
// The Greater Bay frame: x = (lon - 114.0520475)·103014.2, y = (lat - 22.6560705)·110734.9 (the app's sgXY when it is there)
const WXY = (lat, lon) => typeof sgXY === 'function' ? sgXY(lat, lon) : [(lon - 114.0520475)*103014.2, (lat - 22.6560705)*110734.9];
const HASH = typeof hC === 'function';
// fallback ground for the model-alone kit: the ref terrain grid of a target (35 m, rows north -> south), local metres
function trLocal(T, x, z){
  const R = T.tr; if (!R) return 0;
  const c = (R.n - 1)/2, fx = clamp(x/R.s + c, 0, R.n - 1.001), fy = clamp(z/R.s + c, 0, R.n - 1.001), i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j, h = R.h, n = R.n;
  return (h[j*n + i]*(1 - u) + h[j*n + i + 1]*u)*(1 - v) + (h[(j + 1)*n + i]*(1 - u) + h[(j + 1)*n + i + 1]*u)*v;
}
// the app's landmark base: highest ground within r (0, 0.35 r, 0.7 r on 12 rays) + 0.6 m; gl(x, z) = ground relative to y = 0
function baseOf(T, r){
  const [X, Y] = WXY(T.lat, T.lon), G = HASH ? (x, z) => { const v = hC(X + x, Y - z); return isFinite(v) ? v : 0; } : (x, z) => trLocal(T, x, z);
  let hi = -Infinity; for (let a = 0; a < 12; a++) for (const f of [0, 0.35, 0.7]) hi = Math.max(hi, G(Math.cos(a/12*TAU)*r*f, -Math.sin(a/12*TAU)*r*f));
  const top = hi + 0.6; return {top, gl:(x, z) => G(x, z) - top};
}
// ---------- triangle batches: one LTris call per colour spec; VB = vertex-coloured batch (one material) ----------
function Batch(){ const m = new Map(); return {
  q(s, a, b, c, d){ let A = m.get(s); if (!A){ A = []; m.set(s, A); } A.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2]); },
  t(s, a, b, c){ let A = m.get(s); if (!A){ A = []; m.set(s, A); } A.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); },
  flush(g){ for (const [s, A] of m) if (A.length) LTris(g, A, s); m.clear(); } }; }
function VB(spec){ const P = [], C = []; let col = [1, 1, 1]; return {
  c(hex){ const v = parseInt(hex.slice(1), 16); col = [(v >> 16 & 255)/255, (v >> 8 & 255)/255, (v & 255)/255]; return this; },
  rgb(r, g, b){ col = [r, g, b]; return this; },
  q(s, a, b, c, d){ this.t(s, a, b, c); this.t(s, a, c, d); },
  t(s, a, b, c){ P.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); for (let i = 0; i < 3; i++) C.push(col[0], col[1], col[2]); },
  flush(g){ if (!P.length) return; const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); geo.computeVertexNormals(); lmAdd(g, geo, Object.assign({c:'#ffffff', vc:true, ds:true}, spec || {}), 0, 0, 0, 0); P.length = 0; C.length = 0; } }; }
// oriented box: centre (cx, cz), unit axis (ux, uz) along L, width W across, y0..y1 (top / bottom spec optional)
function obox(B, s, cx, cz, ux, uz, L, W, y0, y1, o){
  const vx = -uz, vz = ux, hl = L/2, hw = W/2, P = (a, b, y) => [cx + ux*a + vx*b, y, cz + uz*a + vz*b];
  const a = P(-hl, -hw, y0), b = P(hl, -hw, y0), c = P(hl, hw, y0), d = P(-hl, hw, y0), e = P(-hl, -hw, y1), f = P(hl, -hw, y1), g = P(hl, hw, y1), h = P(-hl, hw, y1);
  const ts = o && o.top || s; B.q(ts, e, f, g, h); B.q(s, a, b, f, e); B.q(s, b, c, g, f); B.q(s, c, d, h, g); B.q(s, d, a, e, h); if (o && o.bot) B.q(o.bot, d, c, b, a);
}
const abox = (B, s, x0, x1, y0, y1, z0, z1, o) => obox(B, s, (x0 + x1)/2, (z0 + z1)/2, 1, 0, x1 - x0, z1 - z0, y0, y1, o);
// box between two plan points a, b of width W
function sbox(B, s, a, b, W, y0, y1, o){ const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz); if (L < 0.05) return; obox(B, s, (a[0] + b[0])/2, (a[1] + b[1])/2, dx/L, dz/L, L, W, y0, y1, o); }
// square-section beam between two 3-D points
function beam(B, s, a, b, r){
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(d[0], d[1], d[2]); if (L < 1e-3) return;
  const u = [d[0]/L, d[1]/L, d[2]/L], p = Math.abs(u[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let v = [u[1]*p[2] - u[2]*p[1], u[2]*p[0] - u[0]*p[2], u[0]*p[1] - u[1]*p[0]]; const lv = Math.hypot(...v); v = v.map(x => x/lv);
  const w = [u[1]*v[2] - u[2]*v[1], u[2]*v[0] - u[0]*v[2], u[0]*v[1] - u[1]*v[0]];
  const C = (o, s1, t) => [o[0] + v[0]*s1 + w[0]*t, o[1] + v[1]*s1 + w[1]*t, o[2] + v[2]*s1 + w[2]*t];
  const A = [C(a, -r, -r), C(a, r, -r), C(a, r, r), C(a, -r, r)], E = [C(b, -r, -r), C(b, r, -r), C(b, r, r), C(b, -r, r)];
  for (let i = 0; i < 4; i++){ const j = (i + 1) & 3; B.q(s, A[i], A[j], E[j], E[i]); }
}
const polyArea = P => { let a = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) a += (P[j][0] + P[i][0])*(P[j][1] - P[i][1]); return a/2; };
const centroid = P => { let x = 0, z = 0; for (const p of P){ x += p[0]; z += p[1]; } return [x/P.length, z/P.length]; };
const pip = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0])*(z - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; };
// triangulated cap of a plan polygon at height y (function of x, z allowed)
function cap(B, s, P, y, down){
  const Yf = typeof y === 'function' ? y : () => y;
  let idx; try { idx = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []); } catch (e){ idx = []; }
  for (const t of idx){ const a = P[t[0]], b = P[t[1]], c = P[t[2]], A = [a[0], Yf(a[0], a[1]), a[1]], Bv = [b[0], Yf(b[0], b[1]), b[1]], C = [c[0], Yf(c[0], c[1]), c[1]]; if (down) B.t(s, A, C, Bv); else B.t(s, A, Bv, C); }
}
// vertical prism over a plan polygon: walls y0..y1 (numbers or functions of (x, z)) and a top
function prism(B, s, P, y0, y1, o){
  const Y0 = typeof y0 === 'function' ? y0 : () => y0, Y1 = typeof y1 === 'function' ? y1 : () => y1;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[j], b = P[i];
    B.q(o && o.wall || s, [a[0], Y0(a[0], a[1]), a[1]], [b[0], Y0(b[0], b[1]), b[1]], [b[0], Y1(b[0], b[1]), b[1]], [a[0], Y1(a[0], a[1]), a[1]]); }
  if (!(o && o.noTop)) cap(B, o && o.top || s, P, Y1);
}
// offset a simple polygon by d (outward for d > 0), vertex-normal offset with a mitre limit
function grow(P, d){
  const n = P.length, sg = polyArea(P) > 0 ? 1 : -1, out = [];
  for (let i = 0; i < n; i++){ const a = P[(i + n - 1) % n], b = P[i], c = P[(i + 1) % n];
    const e1 = [b[0] - a[0], b[1] - a[1]], e2 = [c[0] - b[0], c[1] - b[1]], l1 = Math.hypot(...e1) || 1, l2 = Math.hypot(...e2) || 1;
    const n1 = [e1[1]/l1*sg, -e1[0]/l1*sg], n2 = [e2[1]/l2*sg, -e2[0]/l2*sg]; let m = [n1[0] + n2[0], n1[1] + n2[1]]; const lm = Math.hypot(...m) || 1; m = [m[0]/lm, m[1]/lm];
    const k = 1/Math.max(0.4, m[0]*n1[0] + m[1]*n1[1]); out.push([b[0] - m[0]*d*k, b[1] - m[1]*d*k]); }
  return out;
}
// minimum-area-ish oriented rectangle of a ring: the longest-edge direction -> {cx, cz, ux, uz, L, W}
function orect(P){
  let best = null;
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); if (l < 0.5) continue;
    const ux = dx/l, uz = dz/l; let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
    for (const p of P){ const u = p[0]*ux + p[1]*uz, v = -p[0]*uz + p[1]*ux; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
    const A = (u1 - u0)*(v1 - v0); if (!best || A < best.A) best = {A, ux, uz, u0, u1, v0, v1}; }
  const {ux, uz, u0, u1, v0, v1} = best, uc = (u0 + u1)/2, vc = (v0 + v1)/2;
  let r = {cx:ux*uc - uz*vc, cz:uz*uc + ux*vc, ux, uz, L:u1 - u0, W:v1 - v0};
  if (r.W > r.L) r = {cx:r.cx, cz:r.cz, ux:-uz, uz:ux, L:r.W, W:r.L};
  return r;
}
// small self-lit cube (lamps, aviation lights)
const lampBox = (B, s, x, y, z, w) => abox(B, s, x - w/2, x + w/2, y, y + w, z - w/2, z + w/2);
// hip roof over an oriented rectangle (eaves at y, ridge at y + h), with flared eave corners up by fl
function hipRoof2(B, s, cx, cz, ux, uz, L, W, y, h, fl, ridgeFrac){
  const vx = -uz, vz = ux, P = (a, b, yy) => [cx + ux*a + vx*b, yy, cz + uz*a + vz*b], hl = L/2, hw = W/2, rl = Math.max(0, hl - hw*(ridgeFrac === undefined ? 1 : ridgeFrac)), f = fl || 0;
  const A = P(-hl, -hw, y + f), Bc = P(hl, -hw, y + f), C = P(hl, hw, y + f), Dc = P(-hl, hw, y + f), m1 = P(-hl*0.5, -hw, y), m2 = P(hl*0.5, -hw, y), m3 = P(hl*0.5, hw, y), m4 = P(-hl*0.5, hw, y);
  const R1 = P(-rl, 0, y + h), R2 = P(rl, 0, y + h);
  // long slopes (split at the eave mid-points so the corners flare)
  B.q(s, A, m1, R1, R1); B.q(s, m1, m2, R2, R1); B.q(s, m2, Bc, R2, R2);
  B.q(s, C, m3, R2, R2); B.q(s, m3, m4, R1, R2); B.q(s, m4, Dc, R1, R1);
  B.t(s, Bc, C, R2); B.t(s, Dc, A, R1);
}
// gable roof over an oriented rectangle (ridge along u), gable walls in wallSpec
function gableRoof(B, s, ws, cx, cz, ux, uz, L, W, y, h, over){
  const vx = -uz, vz = ux, o = over || 0, P = (a, b, yy) => [cx + ux*a + vx*b, yy, cz + uz*a + vz*b], hl = L/2 + o, hw = W/2 + o;
  const k = h/(W/2), yo = y - o*k;
  B.q(s, P(-hl, -hw, yo), P(hl, -hw, yo), P(hl, 0, y + h), P(-hl, 0, y + h));
  B.q(s, P(hl, hw, yo), P(-hl, hw, yo), P(-hl, 0, y + h), P(hl, 0, y + h));
  if (ws){ B.t(ws, P(-L/2, -W/2, y), P(-L/2, W/2, y), P(-L/2, 0, y + h)); B.t(ws, P(L/2, W/2, y), P(L/2, -W/2, y), P(L/2, 0, y + h)); }
}
