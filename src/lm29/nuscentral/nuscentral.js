// ===== NUS Kent Ridge — the centre and south-west of the campus (City Brush v32, NUSX module `nuscentral`) =====
// The University Cultural Centre, Yong Siew Toh Conservatory and Lee Kong Chian Natural History Museum on Conservatory Drive;
// the Central Library (+ annexe) and Yusof Ishak House; the Faculty of Arts and Social Sciences AS1-AS8 with their link blocks
// and lecture theatres LT8-LT15; NUS Business School (Mochtar Riady Building BIZ1, BIZ2, Hon Sui Sen Memorial Library); the
// School of Computing COM1-COM4 and LT16-LT19; i3 and Innovation 4.0; Shaw Foundation Alumni House, Kent Ridge Guild House (+
// extension) and The Deck; the Synchrotron, Ventus, ISEAS, ISS, TCOMS and the Central Water Tank.
// Every building stands on its real OSM footprint (b.P), foundations down to the lowest ground of the footprint, storeys on the
// site's 4 m office-window grid. Kent Ridge vocabulary: cream concrete frames, a deep sunshade ledge over a recessed dark window
// band on every floor, structural piers, face-brick plinths and the pale blue pitched roofs; 2000s-2020s blocks in white with
// glass, aluminium fins, floating roof blades and planted terraces. No logos, names or lettering. Everything goes into the
// site's own material batches (api.M) — no extra meshes.
{
const MINE = new Set([3, 6, 7, 12, 19, 28, 31, 35, 41, 49, 73, 75, 76, 77, 78, 79, 82, 84, 92, 98, 100, 107, 111, 116, 117, 127, 129, 130, 131, 144, 148, 170, 173, 232, 234,
  255, 296, 353, 354, 384, 385, 386, 387, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 400, 401, 402, 403, 404, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 419,
  420, 421, 422, 424, 426, 427, 428, 429, 430, 431, 433, 435, 438, 439, 440, 443, 444, 445, 446, 447, 449, 450, 453, 455, 456, 457, 458, 459, 460, 461, 462, 465, 466, 467, 468, 469,
  470, 471, 474, 476, 477, 478, 479, 480, 481, 483]);
(window.NUSX = window.NUSX || []).push({id:'nuscentral', claim(b){ return MINE.has(b.i); }, build(api, claimed){
const {M, R, GY, CTX, mixC, lerp, clamp, PI, TAU, HP, boxV, hexV, capV, capF, prism, lathe, cyl, seg, hipV, sarea, perim, cen, inPoly, offsetPoly, obb, gRange, rotP2, nrm2,
  frame, circOf, floorsOf, F_AC, SIGF, shed, roofPlant} = api;
const W = M.w, BY = new Map(), DONE = new Set();
for (const b of claimed) BY.set(b.i, b);
const run = (i, f) => { const b = BY.get(i); if (b && !DONE.has(i)){ DONE.add(i); f(b); return b; } return null; };

// ---------- small geometry ----------
const vq = (V, a, b, y0, y1) => V.q([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]);
const hq = (V, a, b, B, A, y) => V.q([a[0], y, a[1]], [b[0], y, b[1]], [B[0], y, B[1]], [A[0], y, A[1]]);
const eachEdge = (P, hole, fn) => { const n = P.length, s = sarea(P) > 0 ? 1 : -1;
  for (let i = 0; i < n; i++){ const a = P[i], b = P[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.05) continue;
    let nn = nrm2(a, b, s); if (hole) nn = [-nn[0], -nn[1]]; fn(a, b, L, (b[0] - a[0])/L, (b[1] - a[1])/L, nn, i); } };
const segX = (p, q, r, s) => { const d = (q[0] - p[0])*(s[1] - r[1]) - (q[1] - p[1])*(s[0] - r[0]); if (Math.abs(d) < 1e-9) return false;
  const t = ((r[0] - p[0])*(s[1] - r[1]) - (r[1] - p[1])*(s[0] - r[0]))/d, u = ((r[0] - p[0])*(q[1] - p[1]) - (r[1] - p[1])*(q[0] - p[0]))/d; return t > 1e-6 && t < 1 - 1e-6 && u > 1e-6 && u < 1 - 1e-6; };
// an inset ring is usable when it keeps its orientation, every edge keeps its direction, and no two edges cross
const insetOK = (P, I, d) => { const n = P.length; if (Math.sign(sarea(I)) !== Math.sign(sarea(P)) || Math.abs(sarea(I)) < 0.1*Math.abs(sarea(P))) return false;
  for (let i = 0; i < n; i++){ const j = (i + 1) % n; if (Math.hypot(I[i][0] - P[i][0], I[i][1] - P[i][1]) > 1.75*d || !inPoly(P, I[i][0], I[i][1])) return false;
    if ((I[j][0] - I[i][0])*(P[j][0] - P[i][0]) + (I[j][1] - I[i][1])*(P[j][1] - P[i][1]) <= 0) return false; }
  for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++){ if (i === 0 && j === n - 1) continue; if (segX(I[i], I[(i + 1) % n], I[j], I[(j + 1) % n])) return false; }
  return true; };
// Ramer-Douglas-Peucker on a closed ring (drops notches and jogs smaller than tol — for roofs and setbacks)
const dSeg = (p, a, b) => { const ex = b[0] - a[0], ez = b[1] - a[1], L2 = ex*ex + ez*ez || 1e-9, t = clamp(((p[0] - a[0])*ex + (p[1] - a[1])*ez)/L2, 0, 1); return Math.hypot(p[0] - a[0] - ex*t, p[1] - a[1] - ez*t); };
const simp = (P, tol) => { const n = P.length; if (n <= 4) return P; let i1 = 0, bd = -1;
  for (let i = 0; i < n; i++){ const d = Math.hypot(P[i][0] - P[0][0], P[i][1] - P[0][1]); if (d > bd){ bd = d; i1 = i; } }
  const keep = new Uint8Array(n); keep[0] = keep[i1] = 1;
  const rdp = (a, b) => { let md = -1, mi = -1; for (let k = (a + 1) % n; k !== b; k = (k + 1) % n){ const d = dSeg(P[k], P[a], P[b]); if (d > md){ md = d; mi = k; } } if (md > tol){ keep[mi] = 1; rdp(a, mi); rdp(mi, b); } };
  rdp(0, i1); rdp(i1, 0); const out = []; for (let i = 0; i < n; i++) if (keep[i]) out.push(P[i]); return out.length >= 3 && Math.sign(sarea(out)) === Math.sign(sarea(P)) ? out : P; };
// inset by d, dropping the vertices (reflex first) of edges that would flip — returns [inset ring, the reduced source ring]
const insetR = (P0, d) => { const Q = P0.slice(), sg = sarea(P0) > 0 ? 1 : -1;
  for (let it = 0; it < 60 && Q.length >= 3; it++){ const I = offsetPoly(Q, -d), n = Q.length; let bad = -1, worst = 1e18;
    for (let i = 0; i < n; i++){ const j = (i + 1) % n, ex = Q[j][0] - Q[i][0], ez = Q[j][1] - Q[i][1], L2 = ex*ex + ez*ez || 1e-9, r = ((I[j][0] - I[i][0])*ex + (I[j][1] - I[i][1])*ez)/L2;
      if ((r < 0.12 || Math.hypot(I[i][0] - Q[i][0], I[i][1] - Q[i][1]) > 1.75*d) && L2 < worst){ bad = i; worst = L2; } }
    if (bad < 0) return insetOK(Q, I, d) ? [I, Q] : [null, null];
    const refl = k => { const a = Q[(k - 1 + n) % n], b = Q[k], c = Q[(k + 1) % n]; return ((b[0] - a[0])*(c[1] - b[1]) - (b[1] - a[1])*(c[0] - b[0]))*sg < 0; };
    const j = (bad + 1) % n, k = refl(bad) && !refl(j) ? bad : j, a = Q[(k - 1 + n) % n], b = Q[k], c = Q[(k + 1) % n];
    // only small jogs may be dropped: removing a vertex that changes the outline a lot (an L's inner corner) fails this depth
    if (Math.abs((b[0] - a[0])*(c[1] - a[1]) - (b[1] - a[1])*(c[0] - a[0]))/2 > Math.max(12, 0.012*Math.abs(sarea(P0)), 1.2*d*d)) return [null, null];
    Q.splice(k, 1); }
  return [null, null]; };
const inset = (P, d0, dmin) => { let d = d0; for (let t = 0; t < 4; t++){ const [I, Q] = insetR(P, d); if (I) return [I, d, Q]; d *= 0.7; if (d < (dmin || 0.8)) break; } return [null, 0, null]; };
const longest = P => { let bi = 0, bl = 0; for (let i = 0; i < P.length; i++){ const a = P[i], c = P[(i + 1) % P.length], L = Math.hypot(c[0] - a[0], c[1] - a[1]); if (L > bl){ bl = L; bi = i; } } return bi; };
const along = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const ellipse = (F, A, B, n, a0, a1) => { const o = []; a0 = a0 || 0; a1 = a1 === undefined ? TAU : a1; const closed = a1 - a0 >= TAU - 1e-6;
  for (let i = 0; i < (closed ? n : n + 1); i++){ const t = a0 + (a1 - a0)*i/n, p = F(Math.cos(t)*A, 0, Math.sin(t)*B); o.push([p[0], p[2]]); } return o; };
// trellis rods across a ring roof's opening, clipped to the opening (runs sampled every metre)
const rodsIn = (I, y, sp, r) => { const f = frame(I); W.c('#d9dcdc');
  for (let u = -f.L/2 + sp; u < f.L/2 - 0.5; u += sp){ let run = null;
    for (let v = -f.W/2; v <= f.W/2 + 0.01; v += 1){ const p = f.F(u, y, v), ins = inPoly(I, p[0], p[2]);
      if (ins && !run) run = p; else if (!ins && run){ const q = f.F(u, y, v - 1); if (Math.hypot(q[0] - run[0], q[2] - run[2]) > 1.5) seg(W, run, q, r, 3); run = null; } }
    if (run){ const q = f.F(u, y, f.W/2); seg(W, run, q, r, 3); } } };
const tree = (x, z, s, k) => { if (api.free(x, z)) CTX.tree(x, z, s, k); };

// ---------- the Kent Ridge facade: wall, window bands, sunshade ledges, piers, plinth ----------
// o: wall band ledge ld (ledge depth) lt (ledge thickness) a b (band from / to, fraction of the floor) pier (spacing) pd pw pierC
//    brick brickH par (parapet) blank lobby mull mullC glassBand (curtain-like bands in M.gl) skip (no bands below lo + skip)
const fac = (P, hole, lo, top, o) => {
  const F = o.res ? api.F_RS : F_AC, Vb = o.glassBand ? M.gl : o.res ? M.wr : M.wb, ld = o.ld || 0, par = o.par || 0, ba = o.a ?? 0.26, bb = o.b ?? 0.84, fl = [];
  // every 4 m storey of the world grid whose window band fits between the footing and the roof
  if (!o.blank) for (let k = Math.floor((lo + (o.skip || 0))/F); k*F <= top; k++){ const y = k*F; if (y + F*ba >= lo + (o.skip || 0) + 0.25 && y + F*bb + (ld ? 0.3 : 0) <= top - (o.cut || 0) - 0.1) fl.push(y); }
  const O = ld ? offsetPoly(P, hole ? -ld : ld) : null, n = P.length;
  eachEdge(P, hole, (a, b, L, ux, uz, nn, i) => {
    W.c(o.wall); vq(W, a, b, lo - 1.6, top + par);
    if (o.brick && L > 1.5){ const ga = GY(a[0], a[1]), gb = GY(b[0], b[1]), e = 0.05, h = o.brickH || 1.2; W.c(o.brick);
      W.q([a[0] + nn[0]*e, ga - 0.4, a[1] + nn[1]*e], [b[0] + nn[0]*e, gb - 0.4, b[1] + nn[1]*e], [b[0] + nn[0]*e, gb + h, b[1] + nn[1]*e], [a[0] + nn[0]*e, ga + h, a[1] + nn[1]*e]); }
    if (o.cornice){ const e = 0.18; W.c(o.cornice); vq(W, [a[0] + nn[0]*e, a[1] + nn[1]*e], [b[0] + nn[0]*e, b[1] + nn[1]*e], top + par - 0.7, top + par); }
    if (!fl.length || L < 2.2) return;
    const e = Math.min(0.8, L*0.12), off = 0.07, A = [a[0] + ux*e + nn[0]*off, a[1] + uz*e + nn[1]*off], B = [b[0] - ux*e + nn[0]*off, b[1] - uz*e + nn[1]*off];
    Vb.c(o.band); for (let k = 0; k < fl.length; k++) vq(Vb, A, B, fl[k] + F*(k === 0 && o.lobby ? 0.05 : ba), fl[k] + F*bb);
    if (o.mull && L > 3){ const nm = Math.floor(L/o.mull), m0 = fl[0] + F*ba, m1 = fl[fl.length - 1] + F*bb; W.c(o.mullC || o.wall);
      for (let k = 1; k < nm; k++){ const u = k*L/nm, x = a[0] + ux*u + nn[0]*(off + 0.03), z = a[1] + uz*u + nn[1]*(off + 0.03);
        vq(W, [x - ux*0.07, z - uz*0.07], [x + ux*0.07, z + uz*0.07], m0, m1); } }
    if (O && L > 1.2){ const A2 = O[i], B2 = O[(i + 1) % n]; W.c(o.ledge || '#f1eee6');
      for (let k = 0; k < fl.length; k++){ const y0 = fl[k] + F*bb, y1 = y0 + (o.lt || 0.24);
        hq(W, a, b, B2, A2, y1); vq(W, A2, B2, y0, y1); hq(W, a, b, B2, A2, y0); } }
    if (o.pier && L > o.pier*0.9){ const np = Math.max(1, Math.round(L/o.pier)), d = o.pd || Math.max(0.45, ld*0.95), t = (o.pw || 0.5)/2, y0 = lo - 1.0, y1 = top + par*0.5; W.c(o.pierC || o.wall);
      for (let k = (o.pierEnds ? 0 : 1); k <= (o.pierEnds ? np : np - 1); k++){ const u = clamp(k*L/np, t, L - t), x = a[0] + ux*u, z = a[1] + uz*u;
        const p0 = [x - ux*t, z - uz*t], p1 = [x + ux*t, z + uz*t], q0 = [p0[0] + nn[0]*d, p0[1] + nn[1]*d], q1 = [p1[0] + nn[0]*d, p1[1] + nn[1]*d];
        vq(W, q0, q1, y0, y1); vq(W, p0, q0, y0, y1); vq(W, p1, q1, y0, y1); W.q([p0[0], y1, p0[1]], [p1[0], y1, p1[1]], [q1[0], y1, q1[1]], [q0[0], y1, q0[1]]); } }
  });
  return fl; };

// ---------- roofs ----------
// the Kent Ridge pitched roof: a deep eave (white fascia + soffit), a sloping band of pale blue metal up to an inset ring, flat crown
// outward offset with bevelled sharp convex corners (no long miter spikes on the eaves): one or two points per vertex
const offB = (P, d, lim) => { const s = sarea(P) > 0 ? 1 : -1, n = P.length, out = [];
  for (let i = 0; i < n; i++){ const a = P[(i - 1 + n) % n], b = P[i], c = P[(i + 1) % n], n1 = nrm2(a, b, s), n2 = nrm2(b, c, s);
    let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml; const cs = mx*n1[0] + mz*n1[1], convex = ((b[0] - a[0])*(c[1] - b[1]) - (b[1] - a[1])*(c[0] - b[0]))*s > 0;
    if (!convex || cs >= 1/(lim || 1.6)){ const k = 1/Math.max(0.45, cs); out.push([[b[0] + mx*d*k, b[1] + mz*d*k]]); }
    else out.push([[b[0] + n1[0]*d, b[1] + n1[1]*d], [b[0] + n2[0]*d, b[1] + n2[1]*d]]); }
  return out; };
const krRoof = (P0, top, o) => { o = o || {}; const P1 = simp(P0, o.tol ?? 1.25), over = o.over ?? 1.3, A = Math.abs(sarea(P1));
  const [I, d, Q] = inset(P1, o.d || clamp(0.85*A/perim(P1), 1.8, o.dmax || 7), 1.2), P = Q || P1, EB = offB(P, over), E = [].concat(...EB);
  W.c(o.fasc || '#eeece5'); prism(W, E, top - 0.5, top, true); capV(W, E, top - 0.5);
  if (!I){ W.c(o.col, 0.03); capV(W, E, top + 0.02); return top; }
  const yr = top + (d + over)*(o.pitch ?? 0.42), n = P.length; W.c(o.col, 0.03);
  for (let i = 0; i < n; i++){ const j = (i + 1) % n, Ei = EB[i], Ej = EB[j], e0 = Ei[Ei.length - 1], e1 = Ej[0];
    W.q([e0[0], top, e0[1]], [e1[0], top, e1[1]], [I[j][0], yr, I[j][1]], [I[i][0], yr, I[i][1]]);
    if (Ei.length > 1) W.t([Ei[0][0], top, Ei[0][1]], [Ei[1][0], top, Ei[1][1]], [I[i][0], yr, I[i][1]]); }
  const AI = Math.abs(sarea(I)); W.c(o.crown || (AI > 500 ? mixC(o.col, '#c3c7c5', 0.55) : o.col), 0.03); capV(W, I, yr);
  if (AI > 500 && o.plant !== 0) roofPlant(I, yr, Math.min(5, Math.round(AI/600)), 7, false);
  if (o.ridge){ W.c(o.ridge); prism(W, I, yr, yr + 0.25, true); }
  return yr; };
// pitched skirt round a courtyard block: sloping bands on the outer ring and round each courtyard, flat crown between
const courtRoof = (P, H, top, o) => { const over = 1.2, d = 3.2, pitch = 0.42, yr = top + (d + over)*pitch;
  const [I, , Q] = inset(simp(P, 1.0), d, d*0.99); if (!I){ W.c(o.col, 0.03); capV(W, offsetPoly(P, over), top, H); return; }
  const rings = [[offsetPoly(Q, over), I]], holesI = [];
  for (const h of H){ const Eh = offsetPoly(h, -over), Ih = offsetPoly(h, d); if (Math.sign(sarea(Ih)) !== Math.sign(sarea(h))) return; rings.push([Eh, Ih]); holesI.push(Ih); }
  for (const [E, J] of rings){ W.c('#eeece5'); prism(W, E, top - 0.5, top, true); W.c(o.col, 0.03); const n = E.length; for (let i = 0; i < n; i++){ const j = (i + 1) % n; W.q([E[i][0], top, E[i][1]], [E[j][0], top, E[j][1]], [J[j][0], yr, J[j][1]], [J[i][0], yr, J[i][1]]); } }
  W.c('#eeece5'); capV(W, rings[0][0], top - 0.5, H.map(h => offsetPoly(h, -over)));
  W.c(o.col, 0.03); capV(W, I, yr, holesI); };
// flat roof inside a parapet: membrane, plant, optional green bed / PV rows
const flatRoof = (b, P, top, o) => { o = o || {}; W.c(o.rc || '#a3a8a7', 0.03); capV(W, P, top + 0.1, o.H);
  const A = Math.abs(sarea(P)); if (o.green){ const [I] = inset(P, 2.2, 1.2); if (I){ M.veg.c(o.green, 0.1); capV(M.veg, I, top + 0.3); } }
  if (o.pv){ const f = frame(P); W.c('#3a4f66'); for (let v = -f.W/2 + 3; v < f.W/2 - 3; v += 3.4) for (let u = -f.L/2 + 3; u < f.L/2 - 5; u += 5.4){ const p = f.F(u + 2.4, 0, v + 0.8); if (!inPoly(P, p[0], p[2]) || R() > o.pv) continue;
    W.q(f.F(u, top + 0.5, v), f.F(u + 4.9, top + 0.5, v), f.F(u + 4.9, top + 1.2, v + 1.7), f.F(u, top + 1.2, v + 1.7)); } }
  if (o.plant !== 0 && A > 250) roofPlant(P, top + 0.1, o.plant || Math.min(7, Math.round(A/700) + 1), b.i, o.stacks); };

// ---------- building types ----------
const KR = {wall:['#e4ddcd', '#e1dacb', '#e8e2d5', '#ddd6c6'], band:['#43525d', '#3d4b55', '#4a5863'], roof:['#83a7bd', '#7c9fb6', '#8badc2', '#7898b0'], brick:'#8e5c45'};
const hp = (a, k) => a[((k*2654435761) >>> 0) % a.length];
// a 1970s-90s Kent Ridge block: cream frame, ledged window bands, piers, brick plinth, the pale blue pitched roof (or flat)
const FLAT = ['#94adbd', '#8aa5b7', '#a3a9a8', '#b2b5b0', '#8fa9ba', '#9fb5c3', '#a9adaa'];
const kr = (b, o) => { o = o || {}; if (!o.roof) o.roof = b.st === 'acadP' ? 'pitch' : 'flat'; const P = b.P, rings = [[P, false], ...b.H.map(h => [h, true])], [lo, hi] = gRange(P); let top = lo + (o.h ?? b.h); top = Math.max(top, hi + Math.max(3.2, 0.6*(o.h ?? b.h)));
  b.lo = lo; b.top = top; const k = b.i;
  const sty = Object.assign({wall:hp(KR.wall, k), band:hp(KR.band, k + 1), ledge:'#f2efe7', ld:1.05, pier:7.5, brick:KR.brick, brickH:1.3, par:o.roof === 'flat' || b.H.length ? 0.9 : 0.25, mull:1.9, mullC:'#aeb3b2'}, o.sty || {});
  for (const [Q, hole] of rings) fac(Q, hole, lo, top, sty);
  if (b.H.length && o.roof !== 'flat') courtRoof(P, b.H, top + 0.3, {col:o.rc || hp(KR.roof, k + 2)});
  else if (o.roof === 'flat' || b.H.length){ flatRoof(b, P, top, {H:b.H, rc:o.rc || hp(FLAT, k + 4), green:o.green, pv:o.pv, plant:o.plant}); W.c('#eeebe3'); prism(W, offsetPoly(P, 0.15), top + 0.6, top + 1.05, true); }
  else { b.ry = krRoof(P, top + 0.3, {col:o.rc || hp(KR.roof, k + 2), pitch:o.pitch, dmax:o.dmax, crown:o.crown});
    // lift / stair cores breaking through the roof near the ends of the long axis, each under its own little hipped cap
    if (Math.abs(sarea(P)) > 900 && o.cores !== false){ const f = frame(P); for (const su of [-0.36, 0.36]){ const p = f.F(su*f.L, 0, 0); if (!inPoly(P, p[0], p[2])) continue;
      W.c(sty.wall); boxV(W, 6.4, b.ry - top + 2.2, 4.6, p[0], top, p[2], f.ry); M.wb.c('#3e4b54'); boxV(M.wb, 6.5, 1.1, 1.2, p[0], b.ry + 0.2, p[2], f.ry); hipV(W.c(o.rc || hp(KR.roof, k + 2)), p[0], p[2], 6.4, 4.6, b.ry + 2.2, 1.4, f.ry, 0.6); } } }
  if (o.entry !== false && Math.abs(sarea(P)) > 400) entry(P, lo, top);
  return b; };
// lit lobby glazing + a canopy at the middle of the longest side
const entry = (P, lo, top, w) => { const i = longest(P), a = P[i], c = P[(i + 1) % P.length], L = Math.hypot(c[0] - a[0], c[1] - a[1]), s = sarea(P) > 0 ? 1 : -1, nn = nrm2(a, c, s);
  const t0 = 0.5 - Math.min(0.2, (w || 9)/L), t1 = 1 - t0, A0 = along(a, c, t0), A1 = along(a, c, t1), g0 = Math.max(GY(A0[0], A0[1]), GY(A1[0], A1[1]));
  if (g0 + 3.6 > top) return; const o = 0.14, P0 = [A0[0] + nn[0]*o, A0[1] + nn[1]*o], P1 = [A1[0] + nn[0]*o, A1[1] + nn[1]*o];
  vq(M.warm, P0, P1, g0 + 0.1, g0 + 3.3);
  const d = 3.2, Q0 = [P0[0] + nn[0]*d, P0[1] + nn[1]*d], Q1 = [P1[0] + nn[0]*d, P1[1] + nn[1]*d]; W.c('#f3f2ee'); hq(W, P0, P1, Q1, Q0, g0 + 3.7); vq(W, Q0, Q1, g0 + 3.45, g0 + 3.75); hq(W, P0, P1, Q1, Q0, g0 + 3.45);
  CTX.lamp((Q0[0] + Q1[0])/2, g0 + 3.2, (Q0[1] + Q1[1])/2, [255, 214, 160]); };
// 2000s+ white block: glass bands with mullions, aluminium fins, thin ledges, flat roof with a floating blade
const modern = (b, o) => { o = o || {}; const P = b.P, rings = [[P, false], ...b.H.map(h => [h, true])], [lo, hi] = gRange(P); let top = lo + (o.h ?? b.h); top = Math.max(top, hi + Math.max(3.2, 0.6*(o.h ?? b.h)));
  b.lo = lo; b.top = top;
  const sty = Object.assign({wall:o.wall || '#eeefec', band:o.band || '#4d6576', glassBand:o.glass !== false, ledge:'#f6f6f3', ld:0.7, lt:0.18, a:0.12, b:0.9, mull:1.6, mullC:'#d9dcdc',
    pier:o.fins ?? 3.2, pd:0.6, pw:0.16, pierC:o.finC || '#d3d7d8', par:1.2, lobby:true}, o.sty || {});
  for (const [Q, hole] of rings) fac(Q, hole, lo, top, sty);
  flatRoof(b, P, top, {H:b.H, rc:o.rc || '#a9adab', green:o.green ?? '#6d8e51', pv:o.pv, plant:o.plant ?? 2});
  if (o.blade !== false){ const E = offsetPoly(P, o.bladeOver ?? 2.2), yb = top + 3.2, [Ib] = inset(P, 4.5, 2.5); W.c(o.bladeC || '#f4f4f1'); prism(W, E, yb, yb + 0.45, true);
    if (Ib){ prism(W, Ib, yb, yb + 0.45, true); capV(W, E, yb + 0.45, [Ib]); capV(W, E, yb, [Ib]); rodsIn(Ib, yb + 0.3, 2.5, 0.12); }
    else { capV(W, E, yb + 0.45); capV(W, E, yb); }
    const ob = obb(P), F = rotP2(ob.cx, ob.cz, ob.ry); W.c('#c9cdce'); for (const su of [-0.4, -0.13, 0.13, 0.4]) for (const sv of [-0.3, 0.3]){ const p = F(su*ob.L, 0, sv*ob.W); if (inPoly(P, p[0], p[2])) seg(W, [p[0], top + 0.2, p[2]], [p[0], yb, p[2]], 0.14, 4); } }
  if (o.entry !== false && Math.abs(sarea(P)) > 400) entry(P, lo, top, 11);
  return b; };
// curtain-wall block (glass skin, white slab lines + optional sunshade blades)
const glassy = (b, o) => { o = o || {}; const P = b.P, [lo, hi] = gRange(P); let top = lo + (o.h ?? b.h); top = Math.max(top, hi + Math.max(3.2, 0.6*(o.h ?? b.h))); b.lo = lo; b.top = top;
  const fl = floorsOf(lo, top, F_AC), n = P.length, O = offsetPoly(P, o.bl ?? 1.3);
  eachEdge(P, false, (a, c, L, ux, uz, nn, i) => {
    M.gl.c(o.glass || '#5a7c8e'); vq(M.gl, a, c, lo - 1.6, top);
    W.c(o.wall || '#f1f1ee'); vq(W, a, c, top, top + (o.par ?? 1.3));
    const e = 0.08, A = [a[0] + nn[0]*e, a[1] + nn[1]*e], B = [c[0] + nn[0]*e, c[1] + nn[1]*e]; for (const y of fl) vq(W, A, B, y - 0.25, y + 0.3);
    if (L > 3){ const nm = Math.max(1, Math.round(L/(o.mull || 1.8))); W.c(o.mullC || '#dfe2e2'); for (let k = 1; k < nm; k++){ const u = k*L/nm, x = a[0] + ux*u + nn[0]*0.1, z = a[1] + uz*u + nn[1]*0.1; vq(W, [x - ux*0.06, z - uz*0.06], [x + ux*0.06, z + uz*0.06], lo + 0.2, top); } }
    if (o.blades && L > 1){ const A2 = O[i], B2 = O[(i + 1) % n]; W.c(o.bladeC || '#f5f5f2'); for (const y of fl){ if (y < lo + 3) continue; const y0 = y + F_AC*0.78, y1 = y0 + 0.14; hq(W, a, c, B2, A2, y1); vq(W, A2, B2, y0, y1); hq(W, a, c, B2, A2, y0); } }
  });
  flatRoof(b, P, top, {rc:o.rc || '#a6aaa9', plant:o.plant ?? 3, green:o.green});
  return b; };
// lecture theatre: blind brick-faced box with pilasters, a high clerestory slot, the pale blue roof
const ltBox = (b, o) => { o = o || {}; const P = b.P, [lo, hi] = gRange(P); let top = lo + (o.h ?? b.h); top = Math.max(top, hi + Math.max(4, 0.6*(o.h ?? b.h))); b.lo = lo; b.top = top;
  fac(P, false, lo, top, {wall:o.wall || '#d8cdb9', blank:true, brick:'#8a5a44', brickH:2.4, pier:4.6, pd:0.35, pw:0.7, pierC:o.pierC || '#cfc3ad', par:0.3, pierEnds:true});
  eachEdge(P, false, (a, c, L, ux, uz, nn) => { if (L < 6) return; const e = 0.1, A = [a[0] + nn[0]*e + ux*1.2, a[1] + nn[1]*e + uz*1.2], B = [c[0] + nn[0]*e - ux*1.2, c[1] + nn[1]*e - uz*1.2]; M.wb.c('#3f4c55'); vq(M.wb, A, B, top - 2.6, top - 1.2);
    const d = 0.9, A2 = [A[0] + nn[0]*d, A[1] + nn[1]*d], B2 = [B[0] + nn[0]*d, B[1] + nn[1]*d]; W.c('#efebe2'); hq(W, A, B, B2, A2, top - 1.05); vq(W, A2, B2, top - 1.25, top - 1.05); });
  W.c(o.rc || hp(['#94adbd', '#9fb5c3', '#a3a9a8'], b.i), 0.03); capV(W, P, top + 0.15); W.c('#e9e5dc'); prism(W, offsetPoly(P, 0.12), top - 0.2, top + 0.6, true);
  { const f = frame(P); W.c('#b9bcb8'); boxV(W, Math.min(8, f.L*0.4), 1.8, Math.min(5, f.W*0.35), f.cx, top + 0.15, f.cz, f.ry); }
  if (Math.abs(sarea(P)) > 300) entry(P, lo, top, 5);
  return b; };
// plant / utility block: blank walls, louvre bands, a flat roof with cooling plant
const util = (b, o) => { o = o || {}; const P = b.P, [lo, hi] = gRange(P); let top = lo + (o.h ?? b.h); if (top < hi + 2.6) top = hi + 2.6; b.lo = lo; b.top = top;
  fac(P, false, lo, top, {wall:o.wall || '#d3d0c6', blank:true, par:0.5, cornice:'#e2dfd6'});
  eachEdge(P, false, (a, c, L, ux, uz, nn) => { if (L < 3) return; const e = 0.08, A = [a[0] + nn[0]*e + ux*0.6, a[1] + nn[1]*e + uz*0.6], B = [c[0] + nn[0]*e - ux*0.6, c[1] + nn[1]*e - uz*0.6];
    W.c('#7f8a8f'); for (let y = lo + 1.2; y < Math.min(top - 1, lo + 5); y += 0.5) vq(W, A, B, y, y + 0.22); });
  flatRoof(b, P, top, {rc:'#a9aca8', plant:2});
  const c = cen(P); if (Math.abs(sarea(P)) > 60){ W.c('#c6cbcc'); cyl(W, 1.3, 1.3, 2.2, c[0], top + 0.1, c[1], 10, true); }
  return b; };
// multi-storey open link block between teaching blocks: slab edges with white parapets over dark corridors, columns, a roof
const link = (b, o) => { o = o || {}; const P = b.P, [lo, hi] = gRange(P); let top = lo + (o.h ?? b.h); if (top < hi + 3.4) top = hi + 3.4; b.lo = lo; b.top = top;
  const fl = floorsOf(lo, top, F_AC), [I] = inset(P, 1.1, 0.6);
  W.c('#5a6266'); if (I) prism(W, I, lo - 1, top, true); else prism(W, P, lo - 1, lo + 0.2, true);
  eachEdge(P, false, (a, c, L, ux, uz, nn) => {
    W.c(o.par || '#efece4'); for (const y of fl) if (y > GY((a[0] + c[0])/2, (a[1] + c[1])/2) + 1.5) vq(W, a, c, y - 0.4, y + 1.05);
    if (L > 2){ const np = Math.max(1, Math.round(L/4.2)); W.c('#e6e2d8'); for (let k = 0; k <= np; k++){ const u = clamp(k*L/np, 0.25, L - 0.25), x = a[0] + ux*u - nn[0]*0.25, z = a[1] + uz*u - nn[1]*0.25; boxV(W, 0.4, top - GY(x, z) + 1, 0.4, x, GY(x, z) - 1, z, -Math.atan2(uz, ux)); } }
  });
  const E = offsetPoly(P, 0.6); W.c('#eeebe3'); prism(W, E, top - 0.3, top + 0.4, true); W.c(o.rc || '#97afbf', 0.03); capV(W, E, top + 0.4); capV(W, E, top - 0.3);
  return b; };

// ======================================== signature buildings ========================================
const LAB = [];
const lab = (b, zh, en, ic, dy, x, z) => { const c = x === undefined ? (b.c || cen(b.P)) : [x, z]; LAB.push([c[0], c[1], (b.top || GY(c[0], c[1]) + 15) + (dy || 6), zh, en, ic]); };

// --- University Cultural Centre (2000): the 1,700-seat Hall and the Theatre under fly towers, a long glazed foyer under a white
//     flat canopy on slender columns facing the plaza, white wings with a green roof (the NUS Museum in the west wing)
const ucc = b => {
  const P = b.P, [lo, hi] = gRange(P), top = lo + 13; b.lo = lo; b.top = top;
  fac(P, false, lo, top, {wall:'#efefeb', band:'#40586a', glassBand:true, ld:0.6, lt:0.2, a:0.1, b:0.88, pier:6, pd:0.5, pw:0.35, pierC:'#f6f6f3', par:1.2, mull:2, mullC:'#e2e4e3', lobby:true});
  flatRoof(b, P, top, {rc:'#c9ccc9', green:'#6b8d4f', plant:0});
  const ry = 0.33, hc = [-438, -372], Rp = rotP2(hc[0], hc[1], ry), A = 31, B = 23, N = 32, V = W, ht = top + 9;
  // the Hall: an oval drum with vertical ribs and a low shell roof
  const ring = ellipse(Rp, A, B, N); V.c('#f2f2ee'); prism(V, ring, top - 1, ht, true);
  V.c('#e2e4e2'); for (let i = 0; i < N; i += 2){ const p = ring[i], q = [p[0] + (p[0] - hc[0])*0.03, p[1] + (p[1] - hc[1])*0.03]; vq(V, [lerp(p[0], q[0], 0), p[1]], q, top - 1, ht + 0.6); }
  M.wb.c('#3e5566'); { const r2 = ellipse(Rp, A + 0.08, B + 0.08, N); for (let i = 0; i < N; i++) if (i % 8 > 1) vq(M.wb, r2[i], r2[(i + 1) % N], top + 2.2, top + 4.8); }
  V.c('#cfd5d8'); for (let j = 0; j < 4; j++){ const s0 = 1.03 - j*0.26, s1 = 1.03 - (j + 1)*0.26, h0 = ht + 3.4*Math.sin(j/4*HP), h1 = ht + 3.4*Math.sin((j + 1)/4*HP);
    for (let i = 0; i < N; i++){ const a0 = i/N*TAU, a1 = (i + 1)/N*TAU, q = (a, s, h) => { const p = Rp(Math.cos(a)*A*s, 0, Math.sin(a)*B*s); return [p[0], h, p[2]]; };
      if (j < 3) V.q(q(a0, s0, h0), q(a1, s0, h0), q(a1, s1, h1), q(a0, s1, h1)); else V.t(q(a0, s0, h0), q(a1, s0, h0), q(0, 0, h1)); } }
  // fly tower of the Hall (west), of the Theatre (east part of the complex)
  const sh = Rp(-A - 9, 0, 0); V.c('#e9e9e4'); boxV(V, 20, lo + 29 - (lo - 1.5), 28, sh[0], lo - 1.5, sh[2], ry); V.c('#bfc4c4'); boxV(V, 20.8, 0.6, 28.8, sh[0], lo + 29, sh[2], ry);
  V.c('#dcdcd6'); for (const s of [-1, 1]){ const p = rotP2(sh[0], sh[2], ry)(0, 0, s*14.05); boxV(V, 20, 22, 0.25, p[0], lo + 6, p[2], ry); }
  // the 450-seat Theatre in the east wing: its auditorium box and a lower fly tower
  const th = [-398, -331];
  if (inPoly(P, th[0], th[1])){ V.c('#efefea'); boxV(V, 26, top + 4 - lo + 1.5, 22, th[0] + 6, lo - 1.5, th[1] - 2, ry); V.c('#c9cecf'); boxV(V, 26.6, 0.5, 22.6, th[0] + 6, top + 4, th[1] - 2, ry);
    V.c('#ecece7'); boxV(V, 15, 21 + 1.5, 19, th[0] - 13, lo - 1.5, th[1] + 4, ry); V.c('#bcc1c1'); boxV(V, 15.6, 0.5, 19.6, th[0] - 13, lo + 21, th[1] + 4, ry); }
  // the foyer: glass box under a big flat white canopy on tall slim columns, steps down to the plaza
  const fo = [-352, -322], Fo = rotP2(fo[0], fo[1], 0.36), gf = GY(fo[0], fo[1]);
  M.gl.c('#5b7b8b'); boxV(M.gl, 28, top - gf + 1.5 - 2.5, 14, fo[0], gf - 1.5, fo[1], 0.36); M.warm.c('#fff'); boxV(M.warm, 26, 0.12, 12, fo[0], gf + 4.2, fo[1], 0.36);
  V.c('#f6f6f3'); boxV(V, 40, 0.9, 26, Fo(2, 0, 3)[0], top + 0.3, Fo(2, 0, 3)[2], 0.36); boxV(M.cool, 36, 0.06, 22, Fo(2, 0, 3)[0], top + 0.25, Fo(2, 0, 3)[2], 0.36);
  V.c('#e4e6e5'); for (let u = -17; u <= 19; u += 6) for (const v of [14, -9]){ const p = Fo(u, 0, v); if (v < 0 && inPoly(P, p[0], p[2])) continue; seg(V, [p[0], GY(p[0], p[2]) - 0.3, p[2]], [p[0], top + 0.35, p[2]], 0.28, 8); }
  for (let k = 0; k < 4; k++){ const p = Fo(2, 0, 15 + k*1.6); V.c(k % 2 ? '#d9d6ce' : '#d2cfc6'); boxV(V, 34 - k*0.5, gf + 0.6 - k*0.18 - (gf - 2), 1.6, p[0], gf - 2, p[2], 0.36); }
  api.occupy([Fo(-19, 0, -10), Fo(23, 0, -10), Fo(23, 0, 22), Fo(-19, 0, 22)].map(p => [p[0], p[2]]), 0.5);
  CTX.lamp(fo[0], gf + 8, fo[1], [255, 214, 160]); CTX.lamp(Fo(2, 0, 10)[0], top - 0.5, Fo(2, 0, 10)[2], [255, 226, 180]);
  // the plaza: pale paving with a row of trees
  const pl = [Fo(-24, 0, 12), Fo(26, 0, 12), Fo(26, 0, 26), Fo(-24, 0, 26)].map(p => [p[0], p[2]]); W.c('#d6d1c5'); capF(W, pl, (x, z) => GY(x, z) + 0.12); api.occupy(pl, 0);
  for (let u = -20; u <= 22; u += 10.5){ const p = Fo(u, 0, 23.5); CTX.tree(p[0], p[2], 3.4, 'raintree'); }
  lab(b, '大学文化中心', 'University Cultural Centre', '🎭', 16, -420, -360);
};

// --- Yong Siew Toh Conservatory of Music (2006): practice-room wings with narrow vertical windows round the 600-seat
//     concert hall, whose stepped roof rises over the stalls; a two-storey glass foyer onto the plaza, timber-toned screens
const yst = b => {
  const P = b.P, [lo, hi] = gRange(P), top = lo + 17; b.lo = lo; b.top = top;
  fac(P, false, lo, top, {wall:'#ecebe5', band:'#3d4f5b', ld:0.35, lt:0.16, a:0.18, b:0.86, pier:2.4, pd:0.45, pw:0.7, pierC:'#f3f2ed', par:1.1, lobby:true});
  flatRoof(b, P, top, {rc:'#a0a6a6', plant:5});
  { const f = frame(P); M.gl.c('#7f9fae'); for (let v = -f.W/2 + 6; v < f.W/2 - 4; v += 9) for (let u = -f.L/2 + 4; u < f.L/2 - 4; u += 7){ const p = f.F(u, 0, v); if (!inPoly(P, p[0], p[2]) || Math.hypot(p[0] + 342, p[2] + 408) < 24) continue; W.c('#dfe2e1'); boxV(W, 5.2, 0.5, 1.6, p[0], top + 0.1, p[2], f.ry); boxV(M.gl, 4.8, 0.35, 1.2, p[0], top + 0.55, p[2], f.ry); } }
  const c = [-342, -408], ry = -1.25, Rp = rotP2(c[0], c[1], ry), V = W;
  // the hall: fan-shaped plan (stage narrow, rear wide), walls up to two roof steps
  const fan = [[-17, -10], [17, -15], [17, 15], [-17, 10]].map(([u, v]) => { const p = Rp(u, 0, v); return [p[0], p[2]]; });
  V.c('#e6e1d6'); prism(V, fan, lo - 1.5, top + 6, true); V.c('#c4ccd0'); capV(V, fan, top + 6);
  const fan2 = [[-4, -13], [17, -15], [17, 15], [-4, 13]].map(([u, v]) => { const p = Rp(u, 0, v); return [p[0], p[2]]; });
  V.c('#e9e4da'); prism(V, fan2, top + 6, top + 9.5, true); V.c('#b7c3c9'); capV(V, fan2, top + 9.5); prism(V, offsetPoly(fan2, 0.6), top + 9.5, top + 9.9, true); capV(V, offsetPoly(fan2, 0.6), top + 9.9);
  // timber-toned vertical screen on the hall's long faces, a glass clerestory between the steps
  V.c('#9b7350'); for (const s of [-1, 1]) for (let u = -15; u <= 15; u += 1.5){ const p = Rp(u, 0, s*(lerp(10, 15, (u + 17)/34) + 0.35)); boxV(V, 0.35, 6, 0.3, p[0], top, p[2], ry + s*0.15); }
  M.gl.c('#587888'); { const p = Rp(-4.2, 0, 0); boxV(M.gl, 0.3, 3.4, 25, p[0], top + 6, p[2], ry); }
  // the main front (south end, onto the plaza shared with the UCC): full-height glass held by paired bow trusses — "the strings of
  // a violin or cello" — under a deep white roof edge; the flanking ends of the long sides glazed the same way
  eachEdge(P, false, (a, c, L, ux, uz, nn) => { const mz = (a[1] + c[1])/2; if (mz < -395 || L < 10) return;
    const t0 = mz > -370 ? 0 : 0.0, t1 = mz > -370 ? 1 : 0.42, A0 = along(a, c, t0), A1 = along(a, c, t1), Ls = L*(t1 - t0), e = 0.12;
    const G0 = [A0[0] + nn[0]*e, A0[1] + nn[1]*e], G1 = [A1[0] + nn[0]*e, A1[1] + nn[1]*e]; M.gl.c('#5f8191'); vq(M.gl, G0, G1, lo + 0.2, top - 0.2); vq(M.warm, [G0[0] - nn[0]*0.6, G0[1] - nn[1]*0.6], [G1[0] - nn[0]*0.6, G1[1] - nn[1]*0.6], lo + 0.3, lo + 3.6);
    const np = Math.max(2, Math.round(Ls/4.6)); V.c('#e9ebea');
    for (let k = 0; k <= np; k++){ const u = Ls*k/np, x = A0[0] + ux*u, z = A0[1] + uz*u;
      for (const du of [-0.35, 0.35]){ const bx = x + ux*du, bz = z + uz*du, pts = []; for (let j = 0; j <= 4; j++){ const t = j/4, o = 0.45 + 1.1*Math.sin(t*PI); pts.push([bx + nn[0]*o, lo + 0.2 + (top - lo - 0.2)*t, bz + nn[1]*o]); }
        for (let j = 0; j < 4; j++) seg(V, pts[j], pts[j + 1], 0.09, 3); } }
    const E0 = [A0[0] + nn[0]*2.4, A0[1] + nn[1]*2.4], E1 = [A1[0] + nn[0]*2.4, A1[1] + nn[1]*2.4]; V.c('#f4f3ef'); hq(V, A0, A1, E1, E0, top + 1.1); vq(V, E0, E1, top + 0.4, top + 1.1); hq(V, A0, A1, E1, E0, top + 0.4);
    CTX.lamp((A0[0] + A1[0])/2 + nn[0]*3, lo + 6, (A0[1] + A1[1])/2 + nn[1]*3, [255, 214, 160]); });
  lab(b, '杨秀桃音乐学院', 'Yong Siew Toh Conservatory of Music', '🎭', 14, c[0], c[1]);
};

// --- Central Library: the stepped 1980s block — ledged window bands on six floors, upper floors stepping back, the roof-lit
//     atrium lantern; the 6-storey wing (19) and the Central Library Annexe (31) in the same frame
const clib = b => {
  const P = b.P, [lo, hi] = gRange(P), top = Math.max(lo + 21, hi + 6); b.lo = lo; b.top = top;
  const sty = {wall:'#e6dfd0', band:'#3e4c56', ledge:'#f3f0e8', ld:1.2, pier:6.2, pd:1.1, brick:KR.brick, brickH:3.6, par:0.3};
  const S = simp(P, 2.0), [I1] = inset(S, 3.2, 2.5), mid = Math.max(lo + 12.2, hi + 3.5);
  if (I1){ fac(P, false, lo, mid, sty); W.c('#d1cbc0'); capV(W, P, mid + 0.3); M.veg.c('#5f8a47', 0.1); prism(M.veg, offsetPoly(P, -0.5), mid + 0.3, mid + 1.1, true); fac(I1, false, mid, top, sty); flatRoof(b, I1, top, {rc:'#97afbf', plant:4}); }
  else { fac(P, false, lo, top, sty); flatRoof(b, P, top, {rc:'#97afbf', plant:4}); }
  const c = [-322, 212], y = top + 0.3 + 2.4; M.gl.c('#86a9b9'); W.c('#e9e7e1'); prism(W, [[c[0] - 9, c[1] - 9], [c[0] + 9, c[1] - 9], [c[0] + 9, c[1] + 9], [c[0] - 9, c[1] + 9]], top, y, true); lathe(M.gl, [[12.7, 0], [0, 6]], c[0], y, c[1], 4, PI/4);
  // the 2010s galleria entrance on the west front (Kent Ridge Crescent side): a double-height glass front leaning outwards
  // between square columns, under a thin canopy
  let be = -1, bl = 0; eachEdge(P, false, (a, c, L, ux, uz, nn, i) => { if (nn[0] < -0.6 && L > bl){ bl = L; be = i; } });
  if (be >= 0){ const a = P[be], c = P[(be + 1) % P.length], s = sarea(P) > 0 ? 1 : -1, nn = nrm2(a, c, s), A0 = along(a, c, 0.3), A1 = along(a, c, 0.7), g0 = Math.max(GY(A0[0], A0[1]), GY(A1[0], A1[1])), h = 8.6, d = 4.5, t = 1.6;
    const B0 = [A0[0] + nn[0]*d, A0[1] + nn[1]*d], B1 = [A1[0] + nn[0]*d, A1[1] + nn[1]*d], T0 = [B0[0] + nn[0]*t, B0[1] + nn[1]*t], T1 = [B1[0] + nn[0]*t, B1[1] + nn[1]*t];
    M.gl.c('#5d7f90'); M.gl.q([B0[0], g0 - 0.5, B0[1]], [B1[0], g0 - 0.5, B1[1]], [T1[0], g0 + h, T1[1]], [T0[0], g0 + h, T0[1]]);
    for (const [P0, Q0] of [[A0, B0], [A1, B1]]){ const Qt = [Q0[0] + nn[0]*t, Q0[1] + nn[1]*t]; M.gl.q([P0[0], g0 - 0.5, P0[1]], [Q0[0], g0 - 0.5, Q0[1]], [Qt[0], g0 + h, Qt[1]], [P0[0], g0 + h, P0[1]]); }
    vq(M.warm, [lerp(A0[0], B0[0], 0.7), lerp(A0[1], B0[1], 0.7)], [lerp(A1[0], B1[0], 0.7), lerp(A1[1], B1[1], 0.7)], g0 + 0.2, g0 + 7.5);
    W.c('#f2f0ea'); hq(W, [A0[0] - nn[0]*0.5, A0[1] - nn[1]*0.5], [A1[0] - nn[0]*0.5, A1[1] - nn[1]*0.5], [T1[0] + nn[0]*1.2, T1[1] + nn[1]*1.2], [T0[0] + nn[0]*1.2, T0[1] + nn[1]*1.2], g0 + h + 0.5);
    hq(W, [A0[0], A0[1]], [A1[0], A1[1]], [T1[0] + nn[0]*1.2, T1[1] + nn[1]*1.2], [T0[0] + nn[0]*1.2, T0[1] + nn[1]*1.2], g0 + h);
    vq(W, [T0[0] + nn[0]*1.2, T0[1] + nn[1]*1.2], [T1[0] + nn[0]*1.2, T1[1] + nn[1]*1.2], g0 + h, g0 + h + 0.5);
    W.c('#e3ded3'); const L2 = Math.hypot(A1[0] - A0[0], A1[1] - A0[1]), nc = Math.max(2, Math.round(L2/5.2)); for (let k = 0; k <= nc; k++){ const p = along(B0, B1, k/nc), q = [p[0] + nn[0]*(t + 0.9), p[1] + nn[1]*(t + 0.9)]; boxV(W, 0.85, h + 1.5, 0.85, q[0], g0 - 1, q[1], -Math.atan2(c[1] - a[1], c[0] - a[0])); }
    CTX.lamp((B0[0] + B1[0])/2, g0 + 6, (B0[1] + B1[1])/2, [255, 214, 160]); api.occupy([A0, A1, [T1[0] + nn[0]*2, T1[1] + nn[1]*2], [T0[0] + nn[0]*2, T0[1] + nn[1]*2]], 1); }
  lab(b, '中央图书馆', 'Central Library', '📚', 10, -322, 212);
};

// --- Yusof Ishak House: the 1970s student union on the ridge line, reborn (2020-25) as a net-zero building — the concrete frame
//     kept, fluted precast panels and perforated vertical fins on the facades, and its six original vaulted arches on the roof
//     now working as solar chimneys over a naturally ventilated atrium (glazed vault ends); a vaulted dining terrace
const yih = b => {
  const P = b.P, [lo, hi] = gRange(P), top = Math.max(lo + 12, hi + 7.5); b.lo = lo; b.top = top;
  fac(P, false, lo, top, {wall:'#e6e4dc', band:'#3b4850', ld:0.55, lt:0.2, a:0.2, b:0.86, pier:1.25, pd:0.5, pw:0.28, pierC:'#efeee8', par:1.1, cornice:'#f2f1ec'});
  flatRoof(b, P, top, {rc:'#9ea4a3', green:'#6a8c4e', plant:0});
  const f = frame(P), nV = 6, span = Math.min(14, f.L*0.72/nV);
  for (let k = 0; k < nV; k++){ const u = -f.L*0.36 + span/2 + k*(f.L*0.72 - span)/(nV - 1); let v0 = 0, v1 = 0;
    for (let v = 0; v < f.W/2; v += 1){ const p = f.F(u, 0, v), q = f.F(u - span/2 + 1, 0, v), r = f.F(u + span/2 - 1, 0, v); if (!inPoly(P, p[0], p[2]) || !inPoly(P, q[0], q[2]) || !inPoly(P, r[0], r[2])) break; v1 = v; }
    for (let v = 0; v > -f.W/2; v -= 1){ const p = f.F(u, 0, v), q = f.F(u - span/2 + 1, 0, v), r = f.F(u + span/2 - 1, 0, v); if (!inPoly(P, p[0], p[2]) || !inPoly(P, q[0], q[2]) || !inPoly(P, r[0], r[2])) break; v0 = v; }
    const len = v1 - v0 - 1.5; if (len < 8) continue; const cc = f.F(u, 0, (v0 + v1)/2);
    W.c('#eef0ee'); M.gl.c('#6d8c9a'); api.vaultV(W, M.gl, cc[0], cc[2], len, span - 0.6, top + 0.6, 5.4, f.ry + HP, 10);
    W.c('#d9dcdb'); prism(W, poly2r(f, u, (v0 + v1)/2, span - 0.6, len), top, top + 0.6, true);
    vq(M.warm, ...[f.F(u - span*0.3, 0, v1 - 0.6), f.F(u + span*0.3, 0, v1 - 0.6)].map(p => [p[0], p[2]]), top + 0.7, top + 3.2); }
  entry(P, lo, top, 12);
  lab(b, '尤索夫伊萨大厦', 'Yusof Ishak House', '🏛', 9); };
const poly2r = (f, u, v, du, dv) => [[u - du/2, v - dv/2], [u + du/2, v - dv/2], [u + du/2, v + dv/2], [u - du/2, v + dv/2]].map(([a, c]) => { const p = f.F(a, 0, c); return [p[0], p[2]]; });

// --- Faculty of Arts and Social Sciences AS1-AS7: four- and five-storey Kent Ridge blocks on the slope, brick ground floors,
//     egg-crate of piers and ledges, blue roofs; AS8 (2000s): seven storeys, white frame, glass, fins and a floating roof blade
const asBlk = (b, o) => kr(b, Object.assign({sty:{ld:1.15, pier:6.4, pd:1.05, brickH:3.4, wall:'#e5ddcc'}, rc:'#8fb0c3'}, o || {}));

// --- Mochtar Riady Building (BIZ1, 2005): the curved eight-storey glass lens, a white sunshade blade on every floor,
//     ground-floor colonnade, a thin white roof blade; BIZ2 and the Hon Sui Sen Memorial Library beside it
const biz1 = b => { glassy(b, {glass:'#4f7488', blades:true, bl:1.5, mull:1.5, par:1.6, plant:2, green:'#698a4e'});
  const E = offsetPoly(b.P, 3.0), y = b.top + 3.4, [Ib] = inset(b.P, 5, 3); W.c('#f6f6f3'); prism(W, E, y, y + 0.5, true);
  if (Ib){ prism(W, Ib, y, y + 0.5, true); capV(W, E, y + 0.5, [Ib]); capV(W, E, y, [Ib]); rodsIn(Ib, y + 0.35, 2.2, 0.1); W.c('#f6f6f3'); }
  else { capV(W, E, y + 0.5); capV(W, E, y); }
  const ob = obb(b.P), F = rotP2(ob.cx, ob.cz, ob.ry); W.c('#d0d4d5'); for (let u = -0.42; u <= 0.42; u += 0.14) for (const v of [-0.25, 0.25]){ const p = F(u*ob.L, 0, v*ob.W); if (inPoly(b.P, p[0], p[2])) seg(W, [p[0], b.top + 1, p[2]], [p[0], y, p[2]], 0.18, 4); }
  const O = offsetPoly(b.P, 1.2); W.c('#eef0ef'); for (let i = 0; i < O.length; i += 1){ const p = O[i]; seg(W, [p[0], GY(p[0], p[1]) - 0.5, p[1]], [p[0], b.lo + 4.6, p[1]], 0.3, 6); }
  lab(b, '李文正大楼（商学院）', 'Mochtar Riady Building (NUS Business School)', '🎓', 8); };

// --- School of Computing COM3 (2019): sweeping curved floor plates raised over the valley — white slab edges, recessed glass,
//     planted ledges on every floor, an open ground floor of columns over a bioswale, a roof garden
const com3 = b => {
  const P = b.P, [lo, hi] = gRange(P), top = Math.max(lo + 22, hi + 12); b.lo = lo; b.top = top;
  const fl = floorsOf(lo, top, F_AC), [Ii, , Qi] = inset(P, 1.6, 0.8), I = Ii || P, S = Ii ? Qi : P;
  W.c('#3c4449'); prism(W, offsetPoly(P, -3.2), lo - 1, Math.max(lo + 5.2, hi - 6), true);
  const g0 = Math.max(lo + 5.2, hi - 6); M.gl.c('#55788a'); prism(M.gl, I, g0, top, true);
  for (const y of fl){ if (y < g0 - 0.3) continue; W.c('#f4f4f1'); prism(W, P, y - 0.55, y + 0.25, true); hqRing(W, S, I, y + 0.25);
    M.veg.c(y % 8 ? '#5a8a44' : '#6a9850', 0.1); prism(M.veg, offsetPoly(P, -0.15), y + 0.25, y + 0.85, true); }
  W.c('#f4f4f1'); prism(W, P, top - 0.3, top + 0.9, true); capV(W, P, top + 0.15); M.veg.c('#6a8f4e', 0.1); const [Ig] = inset(P, 3, 1.2); if (Ig) capV(M.veg, Ig, top + 0.4);
  // columns of the raised ground floor, sun-shading fins on the glass
  W.c('#e8e8e4'); eachEdge(P, false, (a, c, L, ux, uz, nn) => { const np = Math.max(1, Math.round(L/7)); for (let k = 0; k < np; k++){ const u = (k + 0.5)*L/np, x = a[0] + ux*u - nn[0]*2.2, z = a[1] + uz*u - nn[1]*2.2; seg(W, [x, GY(x, z) - 0.5, z], [x, Math.max(lo + 5.2, hi - 6) + 0.2, z], 0.38, 8); }
    if (L > 3){ const nf = Math.floor(L/2.4); W.c('#dfe3e3'); for (let k = 1; k < nf; k++){ const u = k*L/nf, x = a[0] + ux*u - nn[0]*1.6, z = a[1] + uz*u - nn[1]*1.6; vq(W, [x, z], [x + nn[0]*0.7, z + nn[1]*0.7], Math.max(lo + 5.2, hi - 6), top - 0.3); } W.c('#e8e8e4'); } });
  // the bioswale under the building
  const [Ib] = inset(P, 8, 3); if (Ib){ M.veg.c('#4f7f3e', 0.12); capF(M.veg, Ib, (x, z) => GY(x, z) + 0.15); }
  lab(b, '计算机学院 COM3', 'School of Computing (COM3)', '💻', 6);
};
const hqRing = (V, P, I, y) => { const n = P.length; for (let i = 0; i < n; i++){ const j = (i + 1) % n; hq(V, P[i], P[j], I[j], I[i], y); } };

// --- Shaw Foundation Alumni House (2007): a glazed clubhouse under a broad curved metal roof on slender posts
const sfah = b => {
  const P = b.P, [lo, hi] = gRange(P), top = Math.max(lo + 12, hi + 5); b.lo = lo; b.top = top;
  fac(P, false, lo, top, {wall:'#eceeec', band:'#4f6b7a', glassBand:true, a:0.08, b:0.92, mull:1.8, mullC:'#dfe2e2', ld:0.5, lt:0.15, par:0.6, lobby:true});
  W.c('#c8ccca'); capV(W, P, top + 0.4);
  const f = frame(P), L = f.L + 6, Wd = f.W + 6, rise = 3.2, n = 14, y0 = top + 1.6;
  const pt = (u, t) => f.F(u, y0 + rise*Math.sin(t*PI), -Wd/2 + Wd*t);
  W.c('#a9b9c1'); for (let i = 0; i < n; i++){ const t0 = i/n, t1 = (i + 1)/n; W.q(pt(-L/2, t0), pt(L/2, t0), pt(L/2, t1), pt(-L/2, t1)); }
  W.c('#e9ebea'); for (let i = 0; i < n; i++){ const t0 = i/n, t1 = (i + 1)/n, a = pt(-L/2, t0), c = pt(-L/2, t1), d = pt(L/2, t0), e = pt(L/2, t1); a[1] -= 0.45; c[1] -= 0.45; d[1] -= 0.45; e[1] -= 0.45; W.q(a, d, e, c); }
  W.c('#c3c8c9'); for (let u = -L/2 + 2; u <= L/2 - 2; u += 6.5) for (const t of [0.04, 0.96]){ const p = pt(u, t); seg(W, [p[0], GY(p[0], p[2]) - 0.5, p[2]], [p[0], p[1] - 0.4, p[2]], 0.17, 6); }
  M.cool.c('#fff'); for (let u = -L/2 + 5; u < L/2 - 3; u += 8){ const p = pt(u, 0.5); boxV(M.cool, 1.2, 0.06, 0.4, p[0], p[1] - 0.6, p[2], f.ry); }
  entry(P, lo, top, 10);
  lab(b, '邵氏基金会校友会所', 'Shaw Foundation Alumni House', '🏛', 8);
};

// --- The Deck: the open-sided food court under a big two-tier blue roof with a clerestory lantern
const deck = b => {
  const P = b.P, [lo, hi] = gRange(P), top = Math.max(lo + 6.5, hi + 4.2); b.lo = lo; b.top = top;
  W.c('#d6d1c6'); prism(W, P, lo - 1.5, lo + 0.45, true); capV(W, P, lo + 0.45);
  W.c('#5c5f60'); const [Ic] = inset(P, 9, 3); if (Ic){ prism(W, Ic, lo + 0.4, top, true); M.warm.c('#fff'); prism(M.warm, offsetPoly(Ic, 0.1), lo + 0.6, lo + 3.4, true); }
  W.c('#e9e6de'); eachEdge(P, false, (a, c, L, ux, uz) => { const np = Math.max(1, Math.round(L/6)); for (let k = 0; k < np; k++){ const u = (k + 0.5)*L/np; seg(W, [a[0] + ux*u, lo, a[1] + uz*u], [a[0] + ux*u, top, a[1] + uz*u], 0.3, 6); } });
  W.c('#c9cdd0'); prism(W, offsetPoly(P, 0.1), lo + 0.4, lo + 1.1, true);
  const yr = krRoof(P, top, {col:'#8fb1c4', over:2.4, pitch:0.36, dmax:10});
  if (Ic){ const [J] = inset(Ic, 4, 2); if (J){ M.gl.c('#8fb0c0'); prism(M.gl, J, yr, yr + 1.6, true); krRoof(J, yr + 1.6, {col:'#8fb1c4', over:1.2, pitch:0.3, dmax:5}); } }
  for (let k = 0; k < 4; k++){ const c = cen(P); CTX.lamp(c[0] + (k - 1.5)*8, top - 1, c[1], [255, 220, 170]); }
  lab(b, 'The Deck 食阁', 'The Deck (canteen)', '🍜', 5);
};

// --- Kent Ridge Guild House (1990s clubhouse) + its extension: pale blue hipped roofs over shaded verandas
const krgh = b => { kr(b, {rc:'#86a8bc', pitch:0.48, sty:{ld:1.8, pier:5.5, pd:1.7, wall:'#ece6d8', brickH:1.0}}); lab(b, '肯特岗会所', 'Kent Ridge Guild House', '🏛', 6); };

// --- The Ridge (2026): the campus hotel for visiting academics on Computing Drive beside the Kent Ridge Guild House, on the site
//     OSM still calls the "Kent Ridge Guild House Extension" — eight storeys in a pi-shaped plan (three wings) over a planted
//     podium; room floors behind slim vertical fins, planted sky ledges, a roof garden (passive design: shading and greenery)
const ridgeH = b => {
  const P = b.P, [lo, hi] = gRange(P), f = frame(P), F = f.F, pTop = Math.max(lo + 5.2, hi + 1.0); b.lo = lo;
  fac(P, false, lo, pTop, {wall:'#e8e6df', band:'#44535c', glassBand:true, ld:0.7, lt:0.2, a:0.06, b:0.9, pier:6, pd:0.5, pw:0.4, pierC:'#f0efea', par:0.9, brick:KR.brick, brickH:1.0});
  flatRoof(b, P, pTop, {rc:'#a7aba9', green:'#678a4c', plant:0});
  const top = pTop + 3.2*7 + 0.8; b.top = top;
  for (const [u0, u1, v0, v1] of [[-58, 62, -6, 9], [-48, -33, 9, 30], [43, 58, 9, 30]]){
    const Q = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(([u, v]) => { const p = F(u, 0, v); return [p[0], p[2]]; });
    if (!Q.every(p => inPoly(P, p[0], p[1]))) continue;
    fac(Q, false, pTop - 0.4, top, {res:true, wall:'#eeede8', band:'#4a5861', ld:0.5, lt:0.16, a:0.22, b:0.88, pier:3.6, pd:0.75, pw:0.16, pierC:'#cdb9a0', par:1.3, pierEnds:true});
    for (let y = pTop + 3.2*3; y < top - 2; y += 3.2*3){ M.veg.c('#55853f', 0.12); prism(M.veg, offsetPoly(Q, 0.55), y - 0.1, y + 0.8, true); }
    W.c('#a9adab', 0.03); capV(W, Q, top + 0.15); const [Ig] = inset(Q, 2, 1); if (Ig){ M.veg.c('#6a8f4e', 0.1); capV(M.veg, Ig, top + 0.4); }
    W.c('#c4c8c9'); const c = cen(Q); boxV(W, 6, 2.6, 4, c[0], top + 0.2, c[1], f.ry); }
  entry(P, lo, pTop, 10);
  lab(b, 'The Ridge 校园酒店', 'The Ridge (NUS campus hotel)', '🏠', 6);
};
// --- Singapore Synchrotron Light Source: the round storage-ring hall with its low annex
const synch = b => {
  const P = b.P, [lo, hi] = gRange(P), [x, z, r] = circOf(P, P.length >= 18 ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] : undefined), g0 = lo;
  util(b, {h:Math.max(7, hi - lo + 4.5), wall:'#e4e4de'});
  const V = W, rr = Math.min(r, 24); V.c('#f0f0ec'); cyl(V, rr, rr, 13 + 1.6, x, g0 - 1.6, z, 32); M.wb.c('#46596a'); cyl(M.wb, rr + 0.05, rr + 0.05, 1.6, x, g0 + 8, z, 32);
  V.c('#dfe2e3'); lathe(V, [[rr + 0.9, 0], [rr*0.82, 2.4], [rr*0.4, 3.9], [0, 4.3]], x, g0 + 13, z, 32); V.c('#c8cccd'); cyl(V, rr + 0.95, rr + 0.95, 0.5, x, g0 + 12.6, z, 32);
  V.c('#d8dadb'); for (let k = 0; k < 16; k++){ const a = k/16*TAU; seg(V, [x + Math.cos(a)*(rr + 0.2), g0, z + Math.sin(a)*(rr + 0.2)], [x + Math.cos(a)*(rr + 0.2), g0 + 13, z + Math.sin(a)*(rr + 0.2)], 0.25, 4); }
  b.top = g0 + 17; lab(b, '新加坡同步辐射光源', 'Singapore Synchrotron Light Source', '🔬', 3, x, z);
};

// --- Central Water Tank: the white drum on the hill with its banding, domed lid, ladder cage and rail
const wtank = b => { SIGF.wtank(b); const [x, z, r] = circOf(b.P), g0 = gRange(b.P)[0], V = W; V.c('#9da3a5');
  for (let k = 0; k < 24; k++){ const a = k/24*TAU; seg(V, [x + Math.cos(a)*r*0.92, g0 + 14, z + Math.sin(a)*r*0.92], [x + Math.cos(a)*r*0.92, g0 + 15.1, z + Math.sin(a)*r*0.92], 0.05, 3); }
  const a = 0.7, lx = x + Math.cos(a)*(r + 0.6), lz = z + Math.sin(a)*(r + 0.6); seg(V, [lx, g0, lz], [lx, g0 + 15, lz], 0.06, 3); seg(V, [lx + 0.5, g0, lz], [lx + 0.5, g0 + 15, lz], 0.06, 3);
  b.top = g0 + 16.4; lab(b, '中央水塔', 'Central Water Tank', '🏛', 4); };

// --- TCOMS (2019): the deep-water ocean basin shed — ribbed metal walls, a shallow vaulted roof with a clerestory, offices on the side
const tcoms = b => {
  const P = b.P, [lo, hi] = gRange(P), top = Math.max(lo + 18, hi + 9); b.lo = lo; b.top = top;
  fac(P, false, lo, top, {wall:'#d9dddd', blank:true, pier:3.0, pd:0.25, pw:0.25, pierC:'#c8cdce', par:0.3, pierEnds:true});
  // the campus's largest solar roof: a shallow-pitched roof (white fascia) carpeted with PV rows
  const f = frame(P), rise = 2.6; W.c('#e9ecec'); prism(W, offsetPoly(P, 1.0), top - 0.6, top + 0.2, true); W.c('#b3b9bb'); capV(W, offsetPoly(P, 1.0), top + 0.2);
  for (const sg of [-1, 1]) W.q(f.F(-f.L/2, top + 0.2, sg*f.W/2), f.F(f.L/2, top + 0.2, sg*f.W/2), f.F(f.L/2, top + 0.2 + rise, 0), f.F(-f.L/2, top + 0.2 + rise, 0));
  W.c('#34495e'); for (let v = -f.W/2 + 2.5; v < f.W/2 - 2; v += 3.1) for (let u = -f.L/2 + 2.5; u < f.L/2 - 5; u += 5.3){ const y = top + 0.45 + rise*(1 - Math.abs(v + 0.8)/(f.W/2));
    W.q(f.F(u, y, v), f.F(u + 5, y, v), f.F(u + 5, y + 0.55, v + 1.9*Math.sign(-v || 1)*-1), f.F(u, y + 0.55, v + 1.9*Math.sign(-v || 1)*-1)); }
  // biophilic facade: planted vertical strips on the long walls
  eachEdge(P, false, (a, c, L, ux, uz, nn) => { if (L < 30) return; const nb = Math.floor(L/9); M.veg.c('#4f7f3c', 0.12); for (let k = 0; k < nb; k++){ const u = (k + 0.5)*L/nb, x = a[0] + ux*u + nn[0]*0.25, z = a[1] + uz*u + nn[1]*0.25; if (k % 2) vq(M.veg, [x - ux*1.6, z - uz*1.6], [x + ux*1.6, z + uz*1.6], GY(x, z), top - 4.2); } });
  eachEdge(P, false, (a, c, L, ux, uz, nn) => { if (L < 20) return; const e = 0.1, A = [a[0] + nn[0]*e + ux*2, a[1] + nn[1]*e + uz*2], B = [c[0] + nn[0]*e - ux*2, c[1] + nn[1]*e - uz*2]; M.gl.c('#6c8b99'); vq(M.gl, A, B, top - 3.2, top - 1.0); });
  // offices along the south-west long side: three floors of glass bands
  const oP = [f.F(-f.L/2 + 1, 0, f.W/2 - 1), f.F(f.L/2 - 1, 0, f.W/2 - 1), f.F(f.L/2 - 1, 0, f.W/2 + 0.6), f.F(-f.L/2 + 1, 0, f.W/2 + 0.6)].map(p => [p[0], p[2]]);
  fac(oP, false, lo, lo + 12, {wall:'#eef0ee', band:'#46616f', glassBand:true, ld:0.8, lt:0.18, a:0.12, b:0.88, mull:2, par:0.6});
  lab(b, '新加坡海洋与离岸技术中心', 'Technology Centre for Offshore and Marine, Singapore (TCOMS)', '🔬', 4);
};

// --- the greenhouses: white-framed glass gables (the tall OSM one: a lab block with its glasshouses on the roof)
const ghouse = b => { const P = b.P, [lo0, hi] = gRange(P), f = frame(P);
  let lo = lo0; if (b.h > 9){ kr(b, {roof:'flat', h:b.h - 3.5, plant:0, sty:{wall:'#e6e3da', ld:0.8, pier:6}}); lo = b.top + 0.1; }
  const top = Math.max(lo + 4.2, hi + 2.2); b.lo = lo0; b.top = top;
  M.gl.c('#a9c4c9'); prism(M.gl, P, lo - 1, top, true); W.c('#e2e6e4'); prism(W, P, lo - 1, lo + 0.8, true);
  const nb = Math.max(1, Math.round(f.L/9)), bw = f.L/nb; for (let k = 0; k < nb; k++){ const u = -f.L/2 + (k + 0.5)*bw; M.gl.c('#b4ccd0'); hipV(M.gl, ...[f.F(u, 0, 0)].map(p => [p[0], p[2]])[0], bw, f.W, top, Math.min(3, f.W*0.22), f.ry, 0.1, true); }
  W.c('#f1f3f2'); for (let u = -f.L/2; u <= f.L/2 + 0.01; u += 3) for (const s of [-1, 1]){ const p = f.F(u, 0, s*f.W/2); seg(W, [p[0], lo, p[2]], [p[0], top, p[2]], 0.07, 3); }
  return b; };

// ======================================== dispatch ========================================
// Conservatory Drive
run(6, ucc); run(117, yst);
run(107, b => { SIGF.lkc(b); lab(b, '李光前自然历史博物馆', 'Lee Kong Chian Natural History Museum', '🏛', 6); });
// Central Library + annexe, Yusof Ishak House
run(79, clib); run(19, b => kr(b, {sty:{wall:'#e6dfd0', ld:1.2, pier:6.2, pd:1.1, brickH:3.6}, rc:'#91b0c3'}));
run(31, b => kr(b, {sty:{wall:'#e6dfd0', ld:1.2, pier:6.2, pd:1.1, brickH:3.6}, rc:'#91b0c3'}));
run(84, yih);
// FASS
run(430, b => { asBlk(b); lab(b, '人文与社会科学学院 AS1', 'Faculty of Arts and Social Sciences (AS1)', '🎓', 5); });
run(406, b => asBlk(b)); run(446, b => asBlk(b)); run(396, b => asBlk(b)); run(427, b => asBlk(b)); run(439, b => asBlk(b));
run(440, b => { asBlk(b, {sty:{ld:1.2, pier:5.6, pd:1.1, brickH:3.4, wall:'#e9e2d3'}}); lab(b, '邵氏基金楼 AS7', 'AS7 — Shaw Foundation Building', '🎓', 5); });
run(12, b => { modern(b, {wall:'#eff0ed', band:'#48606f', fins:2.8, green:'#6a8a50'}); lab(b, '人文与社会科学学院 AS8', 'AS8 — Faculty of Arts and Social Sciences', '🎓', 6); });
// Business School
run(392, biz1);
run(390, b => { modern(b, {wall:'#eceeeb', band:'#3f5f74', fins:3.6, bladeOver:1.6}); lab(b, '商学院 BIZ2', 'NUS Business School (BIZ2)', '🎓', 6); });
run(426, b => { kr(b, {rc:'#8aaabd', pitch:0.5, sty:{ld:1.4, pier:5.2, pd:1.3, brickH:4, wall:'#e7dfcf'}}); lab(b, '韩瑞生纪念图书馆', 'Hon Sui Sen Memorial Library', '📚', 5); });
// School of Computing
run(420, com3);
run(480, b => { kr(b, {roof:'flat', rc:'#b8bebe', sty:{wall:'#e9e5db', band:'#3c5363', ld:1.0, pier:7.2, brickH:1.2}}); lab(b, '计算机学院 COM1', 'School of Computing (COM1)', '💻', 6); });
run(433, b => { kr(b, {rc:'#90afc1', sty:{wall:'#e7e2d6', ld:1.0, pier:6.8}}); });
run(481, b => modern(b, {wall:'#f1f2f0', band:'#3b5566', fins:1.8, finC:'#cfd4d6', pv:0.7, green:false}));
// i3, Innovation 4.0
run(384, b => { glassy(b, {glass:'#587a8b', blades:true, bl:1.1, mull:1.6, plant:4}); lab(b, 'i3 创新大楼', 'i3 Building', '🔬', 6); });
run(401, b => { modern(b, {wall:'#f2f3f1', band:'#435d6d', fins:1.4, finC:'#e3e6e6', green:'#6b8f50', pv:0.5}); lab(b, '创新4.0大楼', 'Innovation 4.0 (i4.0)', '🔬', 6); });
// alumni / guild house / The Deck
run(408, sfah); run(412, krgh);
run(449, ridgeH);
run(414, deck);
// research and institutes
run(415, synch); run(232, wtank); run(354, tcoms); run(255, ghouse);
run(391, b => { kr(b, {roof:'flat', pv:0.8, plant:1, sty:{wall:'#eceae2', band:'#3e5666', ld:1.3, pier:3.2, pd:1.0, pw:0.2, pierC:'#d8dcdc'}}); lab(b, 'Ventus 校园基础设施楼', 'Ventus (University Campus Infrastructure)', '🏛', 5); });
run(296, b => { kr(b, {rc:'#a3a9a8', sty:{wall:'#ebe4d6', band:'#4b4f52', ld:1.1, pier:5.4, brick:'#94573f', brickH:4}}); lab(b, '尤索夫伊萨东南亚研究院', 'ISEAS–Yusof Ishak Institute', '🏛', 5); });
run(234, b => { kr(b, {rc:'#b4bab9', sty:{wall:'#e8e3d8', band:'#3f5462', ld:1.1, pier:6.0, brickH:2.2}}); lab(b, '系统科学院', 'Institute of Systems Science', '💻', 5); });
run(92, b => kr(b, {rc:'#90b0c2', sty:{ld:1.0, pier:6.0, brickH:2.4}}));
run(173, b => kr(b, {sty:{ld:1.0, pier:6.0}}));

// the rest: lecture theatres, link blocks, plant rooms, sheds, small Kent Ridge blocks
for (const b of claimed){ if (DONE.has(b.i)) continue; DONE.add(b.i);
  const ob = obb(b.P), fill = b.area/(ob.L*ob.W);
  if (b.st === 'lt') ltBox(b);
  else if (b.st === 'shed') shed(b.P, gRange(b.P)[0], b.h, '#a5b4bb');
  else if (b.st === 'gh') ghouse(b);
  else if (ob.W < 9.5 && ob.L > 2.2*ob.W && b.area > 60) link(b);
  else if (b.st === 'util') util(b);
  else if (b.area < 420 && fill < 0.62) link(b);
  else if (b.st === 'new') modern(b);
  else if (b.st === 'glass') glassy(b);
  else kr(b, {roof:b.area < 260 ? 'flat' : undefined});
}
for (const [x, z, y, zh, en, ic] of LAB) api.label(x, z, y, zh, en, {ic});
}});
}
