// ===== City Brush v32 · NUS Kent Ridge campus, west: the Faculty of Engineering / College of Design and Engineering (NUSX module `nuseng`) =====
// Replaces the generic blocks of the engineering quarter with researched models on their real OSM footprints:
//  · the 1970s-80s Kent Ridge teaching blocks E1-E5, E1A-E4A, E3A, CELC, the IT building, SDE2: off-white concrete frames with
//    structural piers, a deep sunshade ledge over a recessed dark window band on every floor, naturally ventilated open corridors
//    behind solid parapets, stair / lift penthouses, sectional water tanks and condensers on pale blue roofs, brick plinths;
//  · E4 (8 storeys) with AR43's 2014 retrofit: a skin of faceted aluminium screens over the corridors and the exposed services;
//  · SDE1 + SDE3 (1976, retrofitted 2023, Erik L'Heureux / CPG): a "deep veil" of folded aluminium louvres, closed near the top and
//    opening towards the ground, and the jungle courtyard enclosed by a gold-painted "crown" of vertical fins;
//  · SDE4 (Serie + Multiply, 2019, Singapore's first new-build net-zero-energy building): six storeys of "platforms and boxes"
//    under one great over-sailing PV roof (1,225 panels) on slender columns, a south portico with gardens, perforated wavy
//    aluminium screens on the east and west, terraces and planters, an open ground-floor plaza;
//  · E7 (Architects 61, 2019): shifted / subtracted volumes, white vertical fins all round, green walls and green pockets;
//    E6 (NanoFab) with horizontal blades and a glazed stair hall; E8; EA; the 10-storey T-Lab (Temasek Laboratories);
//  · EW1 / EW1A engineering workshops (high bays with north-light roofs), Techno Edge canteen (deep hipped roof on columns),
//    lecture theatres LT1, LT2, LT5, LT6, LT7 (blank raked drums), and the multi-level link bridges / covered links between
//    the blocks (open decks with parapets, columns, lit soffits).
// No logos, names or lettering. Everything goes into the site's batches (api.M) plus one window batch on a 3.5 m floor grid.
{
const MINE = new Set([8, 14, 15, 16, 17, 21, 22, 26, 30, 32, 33, 34, 36, 39, 40, 48, 50, 51, 52, 54, 55, 56, 57, 62, 63, 65, 66, 68, 74, 81, 83, 86, 88,
  102, 103, 104, 105, 106, 109, 110, 113, 114, 126, 135, 136, 137, 139, 140, 145, 146, 147, 150, 152, 155, 156, 158, 160, 167, 172, 452]);
(window.NUSX = window.NUSX || []).push({id:'nuseng', claim(b){ return MINE.has(b.i); }, build(api, claimed){
  const {M, GY, R, CTX, BLD, capV, capF, prism, boxV, cyl, seg, sarea, cen, inPoly, offsetPoly, gRange, nrm2, hipV, mixC, lerp, clamp, hpick} = api;
  const W = M.w, FH = 3.5, TAU = Math.PI*2;
  // own window batch: lit office windows on a 3.5 m world floor grid (the engineering blocks' real storey heights)
  const WN = api.mkV({c:'#ffffff', vc:true, ds:true, m:1, fh:FH, cw:1.8, lc:'#ffe4c4', lk:0.10});
  const ROADS = api.NUS_ROADS || [];
  for (const o of BLD){ let a = 1e9, c = 1e9, d = -1e9, e = -1e9; for (const p of o.P){ a = Math.min(a, p[0]); c = Math.min(c, p[1]); d = Math.max(d, p[0]); e = Math.max(e, p[1]); } o._bb = [a, c, d, e]; }
  const touch = (x, z, self) => { for (const o of BLD){ if (o === self || x < o._bb[0] || z < o._bb[1] || x > o._bb[2] || z > o._bb[3]) continue; if (inPoly(o.P, x, z)) return o; } return null; };
  const dSeg = (x, z, a, b) => { const ex = b[0] - a[0], ez = b[1] - a[1], L2 = ex*ex + ez*ez || 1, t = clamp(((x - a[0])*ex + (z - a[1])*ez)/L2, 0, 1); return Math.hypot(x - a[0] - ex*t, z - a[1] - ez*t); };
  const roadD = (x, z) => { let d = 1e9; for (const r of ROADS){ if (r.c >= 12) continue; for (let i = 0; i < r.p.length - 1; i++) d = Math.min(d, dSeg(x, z, r.p[i], r.p[i + 1])); } return d; };

  // ---------- geometry helpers ----------
  // floor levels on the world grid: s[0] = ground, s[1] = first upper slab (>= gf above the lowest ground), s[n] = roof
  const lev = (lo, n, gf) => { const s = [lo], s1 = Math.ceil((lo + (gf || 3.0))/FH)*FH; for (let k = 1; k <= n; k++) s.push(s1 + (k - 1)*FH); return s; };
  const mkE = (a, b, nx, nz, i) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-6; return {a, b, L, ux:(b[0] - a[0])/L, uz:(b[1] - a[1])/L, nx, nz, i}; };
  const EDG = (P, hole) => { const s = sarea(P) > 0 ? 1 : -1, n = P.length, out = [];
    for (let i = 0; i < n; i++){ const a = P[i], b = P[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.05) continue; let nn = nrm2(a, b, s); if (hole) nn = [-nn[0], -nn[1]]; out.push(mkE(a, b, nn[0], nn[1], i)); } return out; };
  const pt = (e, u, d) => [e.a[0] + e.ux*u + e.nx*d, e.a[1] + e.uz*u + e.nz*d];
  const vq = (V, e, u0, u1, d, y0, y1) => { const A = pt(e, u0, d), B = pt(e, u1, d); V.q([A[0], y0, A[1]], [B[0], y0, B[1]], [B[0], y1, B[1]], [A[0], y1, A[1]]); };
  const hq = (V, e, u0, u1, d0, d1, y) => { const A = pt(e, u0, d0), B = pt(e, u1, d0), C = pt(e, u1, d1), D = pt(e, u0, d1); V.q([A[0], y, A[1]], [B[0], y, B[1]], [C[0], y, C[1]], [D[0], y, D[1]]); };
  // a slab of depth d0..d1 between heights (top, front, bottom faces)
  const slabE = (V, e, u0, u1, d0, d1, y0, y1) => { hq(V, e, u0, u1, d0, d1, y1); vq(V, e, u0, u1, d1, y0, y1); hq(V, e, u0, u1, d0, d1, y0); };
  // pier / fin standing out of a face: front + two sides (+ top)
  const fin = (V, e, u, w, d, y0, y1, top) => { vq(V, e, u - w/2, u + w/2, d, y0, y1);
    const A0 = pt(e, u - w/2, 0), A1 = pt(e, u - w/2, d), B0 = pt(e, u + w/2, 0), B1 = pt(e, u + w/2, d);
    V.q([A0[0], y0, A0[1]], [A1[0], y0, A1[1]], [A1[0], y1, A1[1]], [A0[0], y1, A0[1]]); V.q([B1[0], y0, B1[1]], [B0[0], y0, B0[1]], [B0[0], y1, B0[1]], [B1[0], y1, B1[1]]);
    if (top) hq(V, e, u - w/2, u + w/2, 0, d, y1); };
  const frameOf = P => api.frame(P);
  const hull = P => { const Q = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0])*(b[1] - o[1]) - (a[1] - o[1])*(b[0] - o[0]), lo = [], up = [];
    for (const p of Q){ while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = Q.length - 1; i >= 0; i--){ const p = Q[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return lo.slice(0, -1).concat(up.slice(0, -1)); };
  const P2 = (F, pts) => pts.map(([u, v]) => { const p = F(u, 0, v); return [p[0], p[2]]; });
  const rectE = (F, u0, u1, v0, v1) => P2(F, [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
  const inAll = (P, Q) => Q.every(p => inPoly(P, p[0], p[1]));
  const rotP = (c, ry) => api.rotP2(c[0], c[1], ry);
  const uvOf = (f, x, z) => { const c = Math.cos(f.ry), s = Math.sin(f.ry), dx = x - f.cx, dz = z - f.cz; return [dx*c - dz*s, dx*s + dz*c]; };

  // ---------- roof furniture: parapet, stair / lift penthouses, sectional water tank on a steel stand, condenser rows ----------
  const roofKit = (P, top, o) => {
    const par = o.par === undefined ? 1.0 : o.par, I = offsetPoly(P, -0.3), n = P.length;
    W.c(o.rc, 0.03); capV(W, P, top + 0.02);
    if (par > 0){ W.c(o.parC || o.wall); prism(W, I, top, top + par, true); for (let i = 0; i < n; i++){ const a = P[i], b = P[(i + 1) % n], c = I[(i + 1) % n], d = I[i]; W.q([a[0], top + par, a[1]], [b[0], top + par, b[1]], [c[0], top + par, c[1]], [d[0], top + par, d[1]]); } }
    if (o.kit === false) return;
    const f = frameOf(P), F = f.F, ok = Q => inAll(P, Q);
    // penthouses near the ends of the long axis
    for (const t of [-0.34, 0.3]){ const u = t*f.L, Q = rectE(F, u - 3.5, u + 3.5, -3, 3); if (f.W < 9 || !ok(Q)) continue;
      W.c(o.wall); prism(W, Q, top, top + 3.4, true); W.c(o.rc2 || '#b9bcba'); capV(W, Q, top + 3.4); }
    // water tank on a stand
    if (o.tank !== false && f.W > 12){ const u = 0.05*f.L, Q = rectE(F, u - 3, u + 3, -2, 2); if (ok(Q)){ const c = F(u, 0, 0);
      W.c('#8b9aa0'); for (const [du, dv] of [[-2.6, -1.6], [2.6, -1.6], [2.6, 1.6], [-2.6, 1.6]]){ const p = F(u + du, 0, dv); boxV(W, 0.25, 1.2, 0.25, p[0], top, p[2], f.ry); }
      W.c(o.tankC || '#9fb3bd'); boxV(W, 6, 2.4, 4, c[0], top + 1.2, c[2], f.ry); W.c('#7f939c'); boxV(W, 6.1, 0.1, 4.1, c[0], top + 2.3, c[2], f.ry); } }
    // condenser rows
    if (f.W > 14){ const u0 = -0.2*f.L; for (let r = 0; r < 2; r++) for (let k = 0; k < 6; k++){ const p = F(u0 + k*1.5, 0, -f.W*0.25 + r*2.2); if (!inPoly(P, p[0], p[2])) continue; W.c('#cfd1cd'); boxV(W, 1.1, 0.9, 0.8, p[0], top, p[2], f.ry); W.c('#5d6468'); boxV(W, 0.7, 0.02, 0.5, p[0], top + 0.9, p[2], f.ry); } }
  };

  // ---------- the Kent Ridge block (and its modern variants): per-edge facades over world-grid floors ----------
  // o: n floors, gf ground-floor min height, wall / pier / ledge / band / mullC / rc colours, ld ledge depth, sill / head,
  //    psp pier spacing (0 = none), pd pier depth, mull mullion spacing, corr [x, z] world direction of the open-corridor faces,
  //    screen 'facet' (E4) | 'louvre' (SDE1/3), fins {sp, d, c} vertical fins, holes extra courtyard rings, roof false = no roof
  const kr = (b, o) => {
    const P = b.P, [lo] = gRange(P), n = o.n, s = lev(lo, n, o.gf), top = s[n], par = o.par === undefined ? 1.0 : o.par;
    b.lo = lo; b.top = top;
    const rings = [[P, false], ...(o.holes || []).map(h => [h, true])], fr = frameOf(P), cu = Math.cos(fr.ry), su = -Math.sin(fr.ry);
    for (const [Q, hole] of rings){
      const ed = EDG(Q, hole), O = o.ld ? offsetPoly(Q, hole ? -o.ld : o.ld) : null;
      for (const e of ed){
        const corr = o.corr && !hole && e.L > 6 && (e.nx*o.corr[0] + e.nz*o.corr[1]) > 0.5;
        const endE = o.ends && !hole && e.L > 6 && e.L < 26 && Math.abs(e.nx*cu + e.nz*su) > 0.85;   // blank stair end with a glazed slot
        W.c(o.wall); vq(W, e, 0, e.L, 0, lo - 1.6, top + par);
        if (o.plinth !== false && e.L > 1.5){ const ga = GY(e.a[0], e.a[1]), gb = GY(e.b[0], e.b[1]), A = pt(e, 0, 0.05), B = pt(e, e.L, 0.05); W.c(o.plinthC || '#8f5d47');
          W.q([A[0], ga - 0.3, A[1]], [B[0], gb - 0.3, B[1]], [B[0], gb + 1.1, B[1]], [A[0], ga + 1.1, A[1]]); }
        if (e.L < 1.5) continue;
        const m0 = Math.min(0.8, e.L*0.12);
        for (let k = 0; k < n; k++){
          const y0 = s[k], y1 = s[k + 1];
          if ((o.blank && o.blank(k, e)) || (endE && k > 0)) continue;
          if (corr && k > 0){
            // naturally ventilated corridor: dark void behind a solid parapet, the slab edge below
            WN.c(o.corrC || '#2e3539'); vq(WN, e, m0, e.L - m0, 0.03, y0 + 1.05, y1 - 0.3);
            W.c(o.parC || o.ledge); slabE(W, e, 0, e.L, 0, 0.14, y0 - 0.32, y0 + 1.05);
          } else {
            const yb0 = k === 0 ? Math.max(y0, GY(e.a[0], e.a[1]), GY(e.b[0], e.b[1])) + 0.5 : y0 + o.sill, yb1 = y1 - o.head;
            if (yb1 - yb0 > 0.6){ WN.c(k === 0 && o.gband ? o.gband : o.band); vq(WN, e, m0, e.L - m0, 0.05, yb0, yb1);
              if (o.mull){ const nm = Math.max(1, Math.round((e.L - 2*m0)/o.mull)); W.c(o.mullC || '#c8ccca'); for (let j = 1; j < nm; j++){ const u = m0 + j*(e.L - 2*m0)/nm; vq(W, e, u - 0.06, u + 0.06, 0.1, yb0, yb1); } } }
            if (O && e.L > 1.2){ const A = O[e.i], B = O[(e.i + 1) % Q.length], ya = y1 - o.head + 0.02, yc = ya + (o.lt || 0.22); W.c(o.ledge);
              W.q([e.a[0], yc, e.a[1]], [e.b[0], yc, e.b[1]], [B[0], yc, B[1]], [A[0], yc, A[1]]); W.q([A[0], ya, A[1]], [B[0], ya, B[1]], [B[0], yc, B[1]], [A[0], yc, A[1]]);
              W.q([e.a[0], ya, e.a[1]], [e.b[0], ya, e.b[1]], [B[0], ya, B[1]], [A[0], ya, A[1]]); }
          }
        }
        if (endE){ const w = Math.min(2.4, e.L*0.2), um = e.L/2; WN.c('#3a4650'); vq(WN, e, um - w/2, um + w/2, 0.05, s[1] - 0.6, top - 0.9);
          W.c(o.ledge); for (let k = 1; k < n; k++) slabE(W, e, um - w/2 - 0.25, um + w/2 + 0.25, 0, 0.3, s[k] - 0.12, s[k] + 0.1);
          W.c(o.pier || o.wall); for (const sg of [-1, 1]) fin(W, e, um + sg*(w/2 + 0.35), 0.5, 0.45, s[1] - 1, top + par, true); }
        // structural piers through the ledges (the egg-crate of the 1970s blocks)
        if (o.psp && !endE && e.L > o.psp*1.3){ const m = Math.round(e.L/o.psp); W.c(o.pier || o.wall); for (let j = 1; j < m; j++) fin(W, e, j*e.L/m, o.pw || 0.45, o.pd || ((o.ld || 0) + 0.06), lo - 0.4, top + par, true); }
        // vertical fins (modern blocks)
        if (o.fins && e.L > 4){ const m = Math.max(1, Math.round(e.L/o.fins.sp)); W.c(o.fins.c); for (let j = 0; j <= m; j++){ const u = clamp(j*e.L/m, 0.1, e.L - 0.1); fin(W, e, u, 0.1, o.fins.d, s[1] - 0.6, top + par*0.5, false); } }
        // E4: faceted aluminium screen over the corridor face
        if (o.screen === 'facet' && corr){ const p = 2.4, m = Math.floor(e.L/p);
          // faceted aluminium panels: each bay a shallow folded diamond (four triangles round a recessed / raised centre)
          for (let k = 1; k < n; k++) for (let j = 0; j < m; j++){ const ua = (e.L - m*p)/2 + j*p, ya = s[k] - 0.25, yb = s[k + 1] - 0.3, dm = (j + k) % 3 === 0 ? 0.35 : 0.85, ym = lerp(ya, yb, 0.35 + 0.3*((j*7 + k*3) % 3)/2);
            W.c('#d3d7d8', 0.05); const A = pt(e, ua, 0.6), B = pt(e, ua + p, 0.6), Cm = pt(e, ua + p/2, dm), a0 = [A[0], ya, A[1]], b0 = [B[0], ya, B[1]], b1 = [B[0], yb, B[1]], a1 = [A[0], yb, A[1]], c = [Cm[0], ym, Cm[1]];
            W.t(a0, b0, c); W.t(b0, b1, c); W.t(b1, a1, c); W.t(a1, a0, c); } }
        // SDE1/SDE3: deep veil of folded aluminium louvres, dense at the top, opening towards the ground
        if (o.screen === 'louvre' && !hole && e.L > 3){ const dl = 0.35, dd = 1.55;
          for (let k = 1; k < n; k++){ const nb = 2 + Math.round(4*(k - 1)/Math.max(1, n - 2)), y0 = s[k], y1 = s[k + 1];
            for (let j = 0; j < nb; j++){ const y = y0 + (j + 0.6)*(y1 - y0)/nb; W.c(j % 2 ? '#d6d8d5' : '#cfd2cf');
              const A = pt(e, 0.2, dl), B = pt(e, e.L - 0.2, dl), C = pt(e, e.L - 0.2, dd), D = pt(e, 0.2, dd), Am = pt(e, 0.2, (dl + dd)/2), Bm = pt(e, e.L - 0.2, (dl + dd)/2);
              W.q([A[0], y + 0.16, A[1]], [B[0], y + 0.16, B[1]], [Bm[0], y - 0.08, Bm[1]], [Am[0], y - 0.08, Am[1]]); W.q([Am[0], y - 0.08, Am[1]], [Bm[0], y - 0.08, Bm[1]], [C[0], y + 0.1, C[1]], [D[0], y + 0.1, D[1]]); } }
          const m = Math.max(1, Math.round(e.L/6.4)); W.c('#c8cbc8'); for (let j = 0; j <= m; j++) fin(W, e, clamp(j*e.L/m, 0.15, e.L - 0.15), 0.06, dd + 0.05, s[1] - 0.5, top + 0.4, false); }
      }
    }
    if (o.roof !== false) roofKit(P, top, Object.assign({par}, o));
    // lit lobby on the longest face
    if (n >= 3){ let eL = null; for (const e of EDG(P)) if (!eL || e.L > eL.L) eL = e; const g0 = Math.max(GY(eL.a[0], eL.a[1]), GY(eL.b[0], eL.b[1]));
      if (g0 + 3 < s[1]){ const A = pt(eL, eL.L*0.38, 0.12), B = pt(eL, eL.L*0.62, 0.12); M.warm.q([A[0], g0 + 0.2, A[1]], [B[0], g0 + 0.2, B[1]], [B[0], s[1] - 0.9, B[1]], [A[0], s[1] - 0.9, A[1]]); } }
    return {lo, top, s};
  };

  // ---------- link bridges and covered links: open decks with parapets on columns, lit roof soffit ----------
  const lampAx = (P, y) => { const f = frameOf(P), a = f.F(-f.L/2 + 0.6, 0, 0), c = f.F(f.L/2 - 0.6, 0, 0), w = 0.12, l = Math.max(0.1, f.L - 1.2), ux = (c[0] - a[0])/l, uz = (c[2] - a[2])/l;
    M.lamp.q([a[0] - uz*w, y, a[2] + ux*w], [c[0] - uz*w, y, c[2] + ux*w], [c[0] + uz*w, y, c[2] - ux*w], [a[0] + uz*w, y, a[2] - ux*w]); return f; };
  const link = (b, o) => {
    o = o || {}; const P = b.P, [lo] = gRange(P), ed = EDG(P), h = b.h;
    const nd = o.nd !== undefined ? o.nd : (h <= 6 ? 0 : Math.max(1, Math.floor((h - 3.4)/FH)));
    const s = lev(lo, nd + 1, 3.0), yr = nd ? s[nd] + 3.2 : lo + 3.4;
    const open = ed.map(e => { const m = pt(e, e.L/2, 1.3); return !!touch(m[0], m[1], b); });
    const EO = offsetPoly(P, 0.8), CI = offsetPoly(P, -0.35);
    for (let k = 1; k <= nd; k++){ const y = s[k];
      W.c('#e7e3d9'); prism(W, P, y - 0.5, y, true); W.c('#cfcabd'); capV(W, P, y + 0.01); W.c('#ece9e1'); capV(W, P, y - 0.5);
      ed.forEach((e, j) => { if (open[j] || e.L < 1) return; W.c(o.parC || '#ebe7dd'); vq(W, e, 0, e.L, 0, y, y + 1.1); W.c('#d9d5cb'); hq(W, e, 0, e.L, -0.18, 0.02, y + 1.1); });
      lampAx(P, y - 0.53); }
    // roof slab: grey-blue top, pale soffit with a lamp strip (the NUS linkway look)
    const RP = offsetPoly(P, 0.45); W.c('#9fb0b8'); prism(W, RP, yr, yr + 0.38, true); capV(W, RP, yr + 0.38); W.c(nd ? '#ece9e1' : '#d8b64e'); capV(W, RP, yr);
    { const f = lampAx(P, yr - 0.03); CTX.lamp(f.cx, yr - 0.4, f.cz, [255, 226, 180]); }
    // columns: free corners and along the long open-air edges
    W.c('#dedbd2');
    P.forEach((p, i) => { const q = EO[i], c = CI[i]; if (touch(q[0], q[1], b)) return; const g = GY(c[0], c[1]); boxV(W, 0.45, yr - g + 0.6, 0.45, c[0], g - 0.6, c[1]); });
    ed.forEach((e, j) => { if (open[j] || e.L < 14) return; const m = Math.round(e.L/9); for (let k = 1; k < m; k++){ const c = pt(e, k*e.L/m, -0.35), g = GY(c[0], c[1]); boxV(W, 0.4, yr - g + 0.6, 0.4, c[0], g - 0.6, c[1]); } });
    if (!nd){ W.c('#c9c4b8'); capF(W, P, (x, z) => GY(x, z) + 0.06); }
  };

  // ---------- lecture theatres: blank raked drums, pilasters, a white fascia, a monopitch metal roof, an entrance canopy ----------
  const lt = (b, o) => {
    const P = b.P, [lo] = gRange(P), f = frameOf(P), top = lo + o.h, ed = EDG(P), sg = o.flip ? -1 : 1;
    const yR = (x, z) => top + sg*o.rake*(uvOf(f, x, z)[0]/f.L);
    for (const e of ed){ const ya = yR(e.a[0], e.a[1]), yb = yR(e.b[0], e.b[1]);
      W.c(o.wall); W.q([e.a[0], lo - 1.6, e.a[1]], [e.b[0], lo - 1.6, e.b[1]], [e.b[0], yb + 0.6, e.b[1]], [e.a[0], ya + 0.6, e.a[1]]);
      const A = pt(e, 0, 0.32), B = pt(e, e.L, 0.32); W.c('#f1efe8'); W.q([A[0], ya - 1.4, A[1]], [B[0], yb - 1.4, B[1]], [B[0], yb + 0.7, B[1]], [A[0], ya + 0.7, A[1]]);
      hq(W, e, 0, e.L, 0, 0.32, Math.min(ya, yb) - 1.4);
      { const ga = GY(e.a[0], e.a[1]), gb = GY(e.b[0], e.b[1]), A2 = pt(e, 0, 0.05), B2 = pt(e, e.L, 0.05); W.c('#8f5d47'); W.q([A2[0], ga - 0.3, A2[1]], [B2[0], gb - 0.3, B2[1]], [B2[0], gb + 1.2, B2[1]], [A2[0], ga + 1.2, A2[1]]); }
      if (e.L > 6){ const m = Math.round(e.L/3.6); W.c(o.pier || '#d8d0c0'); for (let j = 1; j < m; j++){ const u = j*e.L/m, p = pt(e, u, 0); fin(W, e, u, 0.5, 0.35, lo - 0.3, yR(p[0], p[1]) - 1.4, true); } } }
    // entrance: glazed doors under a canopy on the longest face
    let eL = ed[0]; for (const e of ed) if (e.L > eL.L) eL = e;
    { const u0 = eL.L*0.3, u1 = eL.L*0.7, g = Math.max(GY(eL.a[0], eL.a[1]), GY(eL.b[0], eL.b[1])); WN.c('#34414a'); vq(WN, eL, u0, u1, 0.08, g + 0.1, g + 2.7); W.c('#eeece6'); slabE(W, eL, u0 - 1, u1 + 1, 0, 2.2, g + 2.9, g + 3.2); boxV(M.lamp, 0.4, 0.05, 0.4, ...(() => { const p = pt(eL, eL.L/2, 1.2); return [p[0], g + 2.85, p[1]]; })()); CTX.lamp(...(() => { const p = pt(eL, eL.L/2, 1.2); return [p[0], g + 2.5, p[1]]; })(), [255, 214, 160]); }
    const I = offsetPoly(P, -0.3); W.c(o.rc, 0.03); capF(W, I, (x, z) => yR(x, z) + 0.35);
    // standing seams
    W.c('#8ea7b5'); { const m = Math.max(2, Math.round(f.W/1.6)); for (let j = 1; j < m; j++){ const v = -f.W/2 + j*f.W/m, A = f.F(-f.L/2, 0, v), B = f.F(f.L/2, 0, v);
      const pts = []; for (const t of [0, 1]){ const x = lerp(A[0], B[0], t), z = lerp(A[2], B[2], t); pts.push([x, z]); }
      // clip to the footprint by sampling
      const N = 8; for (let k = 0; k < N; k++){ const x0 = lerp(pts[0][0], pts[1][0], k/N), z0 = lerp(pts[0][1], pts[1][1], k/N), x1 = lerp(pts[0][0], pts[1][0], (k + 1)/N), z1 = lerp(pts[0][1], pts[1][1], (k + 1)/N);
        if (!inPoly(I, x0, z0) || !inPoly(I, x1, z1)) continue; const ddx = -(z1 - z0), ddz = x1 - x0, l = Math.hypot(ddx, ddz) || 1, wx = ddx/l*0.05, wz = ddz/l*0.05;
        W.q([x0 - wx, yR(x0, z0) + 0.5, z0 - wz], [x1 - wx, yR(x1, z1) + 0.5, z1 - wz], [x1 + wx, yR(x1, z1) + 0.5, z1 + wz], [x0 + wx, yR(x0, z0) + 0.5, z0 + wz]); } } }
    b.lo = lo; b.top = top;
  };

  // ---------- cell massing for the modern blocks (E6, E7, E8, T-Lab): a grid of boxes, each face built from its neighbour's top up ----------
  // g = {f, U:[u breaks], V:[v breaks], H:[[floors per cell, rows = v, cols = u]], sty(face) -> style, lo, s}
  const face = (e, y0, y1, s, sty, k0, k1) => {
    // one face of a cell from floor k0 to k1 (y0 = s[k0] or ground, y1 = s[k1])
    const L = e.L; if (L < 0.5) return;
    W.c(sty.wall); vq(W, e, 0, L, 0, y0, y1 + (sty.par || 0));
    if (sty.kind === 'green'){ // green wall: planted panels in a frame
      for (let k = k0; k < k1; k++){ const ya = Math.max(y0, s_(sty, k)) + 0.25, yb = s_(sty, k + 1) - 0.25; const m = Math.max(1, Math.round(L/2.4));
        for (let j = 0; j < m; j++){ M.veg.c(hpick(['#4f7c3a', '#5b8a43', '#466f33', '#628f47'], j*7 + k*3), 0.1); vq(M.veg, e, j*L/m + 0.1, (j + 1)*L/m - 0.1, 0.15, ya, yb); } }
      return; }
    for (let k = k0; k < k1; k++){ const ya = (k === 0 ? sty.s[0] + 0.4 : sty.s[k] + (sty.sill || 0.15)), yb = sty.s[k + 1] - (sty.head || 0.55); if (yb - ya < 0.5) continue;
      const m0 = Math.min(0.5, L*0.1);
      WN.c(k === 0 && sty.gband ? sty.gband : sty.band); vq(WN, e, m0, L - m0, 0.05, ya, yb);
      if (sty.kind === 'band' || sty.kind === 'glass'){ // horizontal blades / spandrels
        W.c(sty.blade || '#d6dadb'); slabE(W, e, 0, L, 0, sty.bd || 0.8, yb + 0.05, yb + 0.25); if (sty.kind === 'band') slabE(W, e, 0, L, 0, 0.5, ya + (yb - ya)*0.55, ya + (yb - ya)*0.55 + 0.1); }
      if (sty.mull){ const nm = Math.max(1, Math.round((L - 2*m0)/sty.mull)); W.c(sty.mullC || '#c9cdcd'); for (let j = 1; j < nm; j++){ const u = m0 + j*(L - 2*m0)/nm; vq(W, e, u - 0.05, u + 0.05, 0.1, ya, yb); } } }
    if (sty.kind === 'fin'){ const m = Math.max(1, Math.round(L/(sty.sp || 1.2))); for (let j = 0; j <= m; j++){ const u = clamp(j*L/m, 0.1, L - 0.1); W.c(j % 5 === 2 && sty.finC2 ? sty.finC2 : sty.finC); fin(W, e, u, 0.12, sty.fd || 0.65, Math.max(y0, sty.s[Math.max(1, k0)] - 0.5), y1 + (sty.par || 0)*0.6, true); }
      W.c(sty.blade || '#e3e6e6'); for (let k = Math.max(1, k0); k <= k1; k++) slabE(W, e, 0, L, 0, 0.35, sty.s[k] - 0.45, sty.s[k] + 0.1); }
  };
  const s_ = (sty, k) => sty.s[k];
  const cells = (b, g) => {
    const P = b.P, f = g.f || frameOf(P), [lo] = gRange(P), nmax = Math.max(...g.H.flat()), s = lev(lo, nmax, g.gf || 3.6);
    const U = g.U, V = g.V, H = g.H, nu = U.length - 1, nv = V.length - 1, hAt = (i, j) => (i < 0 || j < 0 || i >= nu || j >= nv) ? 0 : H[j][i];
    const uD = [Math.cos(f.ry), -Math.sin(f.ry)], vD = [Math.sin(f.ry), Math.cos(f.ry)];
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++){ const n = H[j][i]; if (!n) continue;
      const u0 = U[i], u1 = U[i + 1], v0 = V[j], v1 = V[j + 1], y1 = s[n];
      const C = rectE(f.F, u0, u1, v0, v1); // C[0]=(u0,v0) C[1]=(u1,v0) C[2]=(u1,v1) C[3]=(u0,v1)
      const sides = [[C[1], C[0], -vD[0], -vD[1], hAt(i, j - 1), 'n'], [C[3], C[2], vD[0], vD[1], hAt(i, j + 1), 's'], [C[0], C[3], -uD[0], -uD[1], hAt(i - 1, j), 'w'], [C[2], C[1], uD[0], uD[1], hAt(i + 1, j), 'e']];
      for (const [A, B, nx, nz, nb, sd] of sides){ if (nb >= n) continue; const e = mkE(A, B, nx, nz), sty = Object.assign({s}, g.sty(i, j, sd, nb)), pr = sty.par || 0;
        face(e, nb ? s[nb] : lo - 1.6, y1, s, sty, nb, n);
        if (pr > 0){ W.c(g.parC || '#e9ebea'); vq(W, e, 0, e.L, -0.25, y1, y1 + pr); hq(W, e, 0, e.L, -0.25, 0, y1 + pr); } }
      // roof of the cell: parapet roof, or a planted terrace where a neighbour rises above
      const hiN = Math.max(hAt(i - 1, j), hAt(i + 1, j), hAt(i, j - 1), hAt(i, j + 1));
      W.c(g.rc || '#c3c7c5', 0.02); capV(W, C, y1 + 0.02);
      if ((g.terr && hiN > n) || (g.green && g.green(i, j))){ const I2 = offsetPoly(C, -1.2), c = cen(C); M.veg.c('#5f8b45', 0.12); prism(M.veg, I2, y1, y1 + 0.7, true); capV(M.veg, I2, y1 + 0.7);
        for (let t = 0; t < 5; t++){ const a = t*1.3 + 0.4, r = 2 + (t % 3); M.veg.c(t % 2 ? '#4c7a37' : '#5a8a40', 0.1); boxV(M.veg, 1.4 + (t % 2), 1.2 + (t % 3)*0.5, 1.4, c[0] + Math.cos(a)*r, y1 + 0.7, c[1] + Math.sin(a)*r, a); } }
    }
    b.lo = lo; b.top = s[nmax]; return {f, s, lo, top:s[nmax]};
  };

  // ---------- palettes ----------
  const KR = {ends:true, gf:3.2, wall:'#e4dfd3', pier:'#dbd5c7', ledge:'#efece4', band:'#3f4c56', corrC:'#2f363b', parC:'#ece8de', ld:0.95, lt:0.22, sill:0.95, head:0.55, psp:7.2, pw:0.5, mull:1.8, mullC:'#c6c9c6'};
  const ROOFS = ['#a5bccb', '#97b0c0', '#9cb5c4', '#aec3cf', '#a0b8c6'];
  const krB = (b, n, o) => kr(b, Object.assign({}, KR, {n, rc:hpick(ROOFS, b.i)}, o || {}));
  const NEW = {gf:3.6, wall:'#eef0ee', pier:'#e2e5e4', ledge:'#d9dddd', band:'#3d5363', ld:0.6, lt:0.18, sill:0.4, head:0.5, psp:0, mull:1.5, mullC:'#cfd3d4', rc:'#c4c8c6', plinth:false};
  const LAB = (b, x, z, y, zh, en, ic) => api.label(x, z, y, zh, en, {ic});

  // ---------- SDE4: platforms and boxes under the over-sailing PV roof ----------
  const sde4 = b => {
    const Q = [[-658.2, 157.5], [-670.8, 193.1], [-597.3, 218.0], [-586.0, 182.5]], f = frameOf(Q), F = f.F, L = f.L, Wd = f.W, [lo] = gRange(b.P), n = 6, s = lev(lo, n, 4.4), top = s[n];
    const sS = Math.cos(f.ry) > 0 ? 1 : -1, R4 = (u0, u1, v0, v1) => rectE(F, u0, u1, sS*v0, sS*v1);  // v > 0 = south in R4
    const hu = L/2, hv = Wd/2;
    // the link to SDE1 / SDE3 (the notch of the OSM ring)
    link({i:b.i, P:[[-632.5, 166.4], [-629.6, 157.5], [-632.0, 156.4], [-636.7, 165.3]], h:13}, {nd:2});
    // platforms (slabs) with white edges
    for (let k = 1; k <= n; k++){ const y = s[k], S = R4(-hu, hu, -hv, hv); W.c('#f3f3f0'); prism(W, S, y - 0.55, y, true); W.c('#cfd0ca'); capV(W, S, y + 0.01); W.c('#ecece8'); capV(W, S, y - 0.55); }
    W.c('#d9d9d3'); capF(W, R4(-hu, hu, -hv, hv), (x, z) => GY(x, z) + 0.08);
    // columns: round white columns on a 9 m grid through all floors
    W.c('#eeeeea'); for (let u = -hu + 2; u <= hu - 1.9; u += (L - 4)/8) for (let v = -hv + 2.5; v <= hv - 2.4; v += (Wd - 5)/4){ const p = F(u, 0, sS*v); cyl(W, 0.32, 0.32, top - GY(p[0], p[2]) + 0.5, p[0], GY(p[0], p[2]) - 0.5, p[2], 8); }
    // boxes: per level a porous arrangement of glazed and clad rooms, verandahs round them, a terrace void that shifts per level
    const lay = [[[-hu + 3, -14, -hv + 3, hv - 7, 'g'], [-6, 9, -hv + 4, -2, 's'], [16, hu - 3, -hv + 3, hv - 6, 'g']],
      [[-hu + 2.5, -8, -hv + 2.5, hv - 3, 'g'], [3, 20, -hv + 2.5, hv - 2.5, 's'], [24, hu - 2.5, -hv + 2.5, hv - 3.5, 'g']],
      [[-hu + 2.5, -18, -hv + 2.5, hv - 2.5, 'g'], [-14, 2, -hv + 2.5, hv - 6, 's'], [12, hu - 2.5, -hv + 2.5, hv - 3, 'g']],
      [[-hu + 2.5, -16, -hv + 2.5, hv - 3, 'g'], [-6, 14, -hv + 2.5, hv - 2.5, 'g'], [18, hu - 2.5, -hv + 2.5, hv - 4, 's']],
      [[-hu + 2.5, 6, -hv + 2.5, hv - 3, 'g'], [16, hu - 2.5, -hv + 2.5, hv - 3, 's']],
      [[-hu + 6, -4, -hv + 3, hv - 5, 'g'], [8, hu - 8, -hv + 3, hv - 6, 's']]];
    for (let k = 0; k < n; k++){ const y0 = k ? s[k] : lo - 1.0, y1 = s[k + 1] - 0.55;
      for (const [u0, u1, v0, v1, t] of lay[k]){ const C = R4(u0, u1, v0, v1), ed = EDG(C);
        for (const e of ed){ const g = t === 'g', endF = Math.abs(e.nx*Math.cos(f.ry) - e.nz*Math.sin(f.ry)) > 0.7;
          if (g){ WN.c(endF ? '#4d6573' : '#5d7b8a'); vq(WN, e, 0, e.L, 0, y0, y1); W.c('#d9dcdc'); const m = Math.max(1, Math.round(e.L/1.5)); for (let j = 1; j < m; j++) vq(W, e, j*e.L/m - 0.05, j*e.L/m + 0.05, 0.06, y0, y1);
            vq(W, e, 0, e.L, 0.06, y1 - 0.5, y1); }
          else { W.c(hpick(['#d4d6d3', '#cfd1ce', '#dadbd8'], k + e.i)); vq(W, e, 0, e.L, 0, y0, y1); WN.c('#3e5260'); const m = Math.max(1, Math.round(e.L/4)); for (let j = 0; j < m; j++){ const u = (j + 0.5)*e.L/m; vq(WN, e, u - 0.45, u + 0.45, 0.05, y0 + 0.4, y1 - 0.4); } } }
        if (k === 0){ /* ground boxes stand on the plaza */ } }
      // planters along the south and north slab edges (gardens on every platform), with trailing greenery
      if (k > 0) for (const sv of [1, -1]){ const u0 = -hu + 3 + (k % 2)*6, u1 = hu - 3 - ((k + 1) % 2)*8, v = sv*(hv - 0.9), C = R4(u0, u1, v - 0.5, v + 0.5);
        W.c('#bdbfba'); prism(W, C, s[k], s[k] + 0.75, true); M.veg.c('#57863f', 0.12); capV(M.veg, C, s[k] + 0.75);
        const A = F(u0, 0, sS*(v + sv*0.55)), B = F(u1, 0, sS*(v + sv*0.55)); M.veg.c('#4f7d39', 0.1); M.veg.q([A[0], s[k] + 0.8, A[2]], [B[0], s[k] + 0.8, B[2]], [B[0], s[k] - 0.45, B[2]], [A[0], s[k] - 0.45, A[2]]); } }
    // feature stair flights on the south side, linking the platforms
    for (let k = 1; k < n - 1; k++){ const u0 = -hu + 18 + (k % 2)*22, a = F(u0, 0, sS*(hv - 3.2)), c = F(u0 + 8, 0, sS*(hv - 3.2)), w = 0.9, dx = (c[0] - a[0])/8, dz = (c[2] - a[2])/8, nx = -dz*w, nz = dx*w;
      W.c('#e2e2dd'); W.q([a[0] - nx, s[k], a[2] - nz], [c[0] - nx, s[k + 1], c[2] - nz], [c[0] + nx, s[k + 1], c[2] + nz], [a[0] + nx, s[k], a[2] + nz]); W.c('#9da3a5'); W.q([a[0] + nx, s[k] + 1.0, a[2] + nz], [c[0] + nx, s[k + 1] + 1.0, c[2] + nz], [c[0] + nx, s[k + 1] + 0.95, c[2] + nz], [a[0] + nx, s[k] + 0.95, a[2] + nz]); }
    // east and west ends: perforated wavy aluminium outer skin
    for (const su of [-1, 1]){ const u = su*(hu + 1.3), N = 30;
      for (let k = 1; k < n; k++){ const ya = s[k] - 0.4, yb = s[k + 1] - 0.75;
        for (let j = 0; j < N; j++){ const v0 = -hv + 1 + j*(Wd - 2)/N, v1 = v0 + (Wd - 2)/N, w0 = 0.35*Math.sin(j*Math.PI/2.5), w1 = 0.35*Math.sin((j + 1)*Math.PI/2.5);
          const A = F(u + su*w0, 0, sS*v0), B = F(u + su*w1, 0, sS*v1); W.c(j % 2 ? '#cfd3d1' : '#c4c9c8'); W.q([A[0], ya, A[2]], [B[0], ya, B[2]], [B[0], yb, B[2]], [A[0], yb, A[2]]); } }
      for (const v of [-hv + 1, 0, hv - 1]){ const p = F(u - su*0.6, 0, sS*v); W.c('#a9aeae'); boxV(W, 0.25, top - s[1] + 0.4, 0.25, p[0], s[1] - 0.4, p[2], f.ry); } }
    // the over-sailing roof: deep south portico, PV array, white fascia and soffit, slender columns
    let vs = hv + 9.5; for (; vs > hv + 3; vs -= 0.5){ let ok = true; for (let u = -hu - 2.5; u <= hu + 2.5; u += 6){ const p = F(u, 0, sS*vs); if (roadD(p[0], p[2]) < 7) ok = false; } if (ok) break; }
    const yc = top + 2.6, CR = R4(-hu - 2.5, hu + 2.5, -hv - 2.5, vs);
    W.c('#f4f4f1'); prism(W, CR, yc, yc + 1.0, true); W.c('#eeeeea'); capV(W, CR, yc); W.c('#c9cbc8'); capV(W, CR, yc + 1.0);
    W.c('#2f4558'); for (let v = -hv - 1.6; v < vs - 1.2; v += 2.3) for (let u = -hu - 1.8; u < hu + 1.6; u += 4.3){ const A = F(u, 0, sS*v), B = F(u + 4.0, 0, sS*v), C = F(u + 4.0, 0, sS*(v + 1.9)), D = F(u, 0, sS*(v + 1.9));
      W.q([A[0], yc + 1.15, A[2]], [B[0], yc + 1.15, B[2]], [C[0], yc + 1.45, C[2]], [D[0], yc + 1.45, D[2]]); }
    M.lamp.c('#fff'); for (const v of [hv + 2.5, vs - 2]){ if (v > vs) continue; const A = F(-hu, 0, sS*v), B = F(hu, 0, sS*v); M.lamp.q([A[0], yc - 0.02, A[2]], [B[0], yc - 0.02, B[2]], [B[0], yc - 0.02, B[2] + 0.25], [A[0], yc - 0.02, A[2] + 0.25]); }
    W.c('#eeeeea'); for (let u = -hu - 1; u <= hu + 1.1; u += (L + 2)/8){ const p = F(u, 0, sS*(vs - 1.2)), g = GY(p[0], p[2]); cyl(W, 0.22, 0.22, yc - g + 0.5, p[0], g - 0.5, p[2], 6); CTX.lamp(p[0], g + 4, p[2], [255, 226, 180]); }
    for (const p of [...R4(-hu - 1.5, hu + 1.5, -hv - 1.5, hv + 0.5)]) cyl(W, 0.18, 0.18, yc - top, p[0], top, p[1], 6);
    // south gardens under the portico (rain gardens), young trees
    if (vs > hv + 4){ const G = R4(-hu + 4, hu - 4, hv + 1.2, vs - 2.5); M.veg.c('#5d8f45', 0.08); capF(M.veg, G, (x, z) => GY(x, z) + 0.12); M.wat.c('#fff'); capF(M.wat, R4(-hu + 10, hu - 20, hv + 2.2, hv + 3.0), (x, z) => GY(x, z) + 0.16);
      for (let u = -hu + 8; u < hu - 6; u += 9){ const p = F(u + (R() - 0.5)*3, 0, sS*(hv + 4.5 + R()*(vs - hv - 7))); CTX.tree(p[0], p[2], 1.6 + R()*0.5, 'd'); } }
    api.occupy(CR, 1);
    b.lo = lo; b.top = yc + 1.45; return {top:yc + 1.45, c:cen(Q)};
  };

  // ---------- SDE1 + SDE3 (retrofitted 1976 blocks): louvre veil, the gold-crowned jungle courtyard ----------
  const sdeVeil = (b, n, o) => krB(b, n, Object.assign({ends:false, wall:'#ecebe6', pier:'#e2e1dc', ledge:'#f2f1ec', band:'#34434d', ld:0.5, psp:7.2, pd:0.5, screen:'louvre', plinth:false, rc:'#bfc5c4', tank:false}, o || {}));
  // rooftop PV rows (the net-zero retrofit), kept off the parapet and out of courtyards
  const pv = (P, y, holes) => { const f = frameOf(P), I = offsetPoly(P, -1.6), V = W; V.c('#34495c');
    for (let v = -f.W/2 + 2; v < f.W/2 - 2; v += 3.0) for (let u = -f.L/2 + 2; u < f.L/2 - 2; u += 5.0){ const c = f.F(u + 2.3, 0, v + 0.8);
      if (!inPoly(I, c[0], c[2]) || (holes || []).some(h => inPoly(offsetPoly(h, 1.5), c[0], c[2]))) continue;
      const A = f.F(u, 0, v), B = f.F(u + 4.6, 0, v), C = f.F(u + 4.6, 0, v + 1.7), D = f.F(u, 0, v + 1.7); V.q([A[0], y + 0.4, A[2]], [B[0], y + 0.4, B[2]], [C[0], y + 0.9, C[2]], [D[0], y + 0.9, D[2]]); } };
  const goldCourt = (H, lo, top) => {
    const ed = EDG(H, true);
    for (const e of ed){ const m = Math.max(1, Math.round(e.L/0.9)); W.c('#c9a443'); for (let j = 0; j <= m; j++) fin(W, e, clamp(j*e.L/m, 0.08, e.L - 0.08), 0.1, 0.7, lo + 4, top + 2.2, true); }
    M.veg.c('#4d7d39', 0.1); capF(M.veg, offsetPoly(H, -0.8), (x, z) => GY(x, z) + 0.1); const c = cen(H); CTX.tree(c[0], c[1], 3.2, 'raintree'); CTX.tree(c[0] + 3, c[1] - 2, 2.2, 'palm'); CTX.tree(c[0] - 3, c[1] + 2, 2.0, 'd');
  };

  // ---------- EW1 / EW1A workshops: high bays, ribbon windows, north-light roofs ----------
  const workshop = (b, n, o) => {
    const r = kr(b, Object.assign({}, KR, {n, ends:false, gf:4.6, rc:'#b4bcbe', psp:6.0, pd:0.5, ld:0.6, mull:3.0, sill:1.6, head:0.7, tank:false, kit:false, wall:'#e2ded3'}, o || {}));
    const P = b.P, f = frameOf(P), F = f.F, top = r.top + 0.02, bay = 7.2;
    // north-light sawtooth bays over the main hall (glazed vertical faces lit at night)
    const nU = -Math.sin(f.ry) > 0 ? -1 : 1, hi = top + 2.4, Y = (p, y) => [p[0], y, p[2]];   // nU = +1 when +u points north
    for (let u = -f.L/2 + 2.5; u + bay <= f.L/2 - 2.5; u += bay){ let best = null, cur = null;
      for (let v = -f.W/2 + 1; v <= f.W/2 - 1 + 1e-6; v += 1.5){ const a = F(u + 0.4, 0, v), c = F(u + bay - 0.4, 0, v), ok = inPoly(P, a[0], a[2]) && inPoly(P, c[0], c[2]);
        if (ok){ if (!cur) cur = [v, v]; else cur[1] = v; } else if (cur){ if (!best || cur[1] - cur[0] > best[1] - best[0]) best = cur; cur = null; } }
      if (cur && (!best || cur[1] - cur[0] > best[1] - best[0])) best = cur;
      if (!best || best[1] - best[0] < 6) continue;
      const v0 = best[0] + 1.2, v1 = best[1] - 1.2, uL = nU > 0 ? u : u + bay, uH = nU > 0 ? u + bay : u, A = F(uL, 0, v0), B = F(uL, 0, v1), C = F(uH, 0, v1), D = F(uH, 0, v0);
      W.c('#a9b6bb', 0.03); W.q(Y(A, top), Y(B, top), Y(C, hi), Y(D, hi)); W.c('#dcd8ce'); W.t(Y(A, top), Y(D, top), Y(D, hi)); W.t(Y(B, top), Y(C, hi), Y(C, top));
      WN.c('#5f7784'); WN.q(Y(D, top), Y(C, top), Y(C, hi), Y(D, hi)); }
    return r;
  };

  // ---------- Techno Edge: the engineering canteen — open seating hall under a deep hipped roof on columns, glazed air-con room ----------
  const canteen = b => {
    const P = b.P, [lo] = gRange(P), ed = EDG(P), yr = lo + 6.4, I = offsetPoly(P, -0.4);
    W.c('#cfc9bc'); capF(W, P, (x, z) => GY(x, z) + 0.3); prism(W, P, lo - 1.5, lo + 0.3, true);
    for (const e of ed){ W.c('#e3ddd0'); vq(W, e, 0, e.L, 0.02, lo + 0.3, lo + 1.0); const m = Math.max(1, Math.round(e.L/6)); W.c('#e8e6e0');
      for (let j = 0; j <= m; j++){ const p = pt(e, clamp(j*e.L/m, 0.3, e.L - 0.3), -0.4); boxV(W, 0.5, yr - lo, 0.5, p[0], lo, p[1]); } }
    // the air-conditioned glass room on one side
    const f = frameOf(P), G = rectE(f.F, -f.L/2 + 3, -f.L/2 + 22, -f.W/2 + 4, f.W/2 - 10); if (inAll(P, G)){ for (const e of EDG(G)){ WN.c('#6a8896'); vq(WN, e, 0, e.L, 0, lo + 0.3, lo + 4.2); } W.c('#e0ddd5'); capV(W, G, lo + 4.2); }
    // tables and stools as low blocks, a stall counter row
    W.c('#b7a58b'); for (let u = -f.L/2 + 26; u < f.L/2 - 4; u += 3.6) for (let v = -f.W/2 + 4; v < f.W/2 - 4; v += 3.2){ const p = f.F(u, 0, v); if (inPoly(I, p[0], p[2])) boxV(W, 1.4, 0.75, 0.9, p[0], lo + 0.3, p[2], f.ry); }
    W.c('#ebe9e3'); prism(W, offsetPoly(P, -0.2), yr - 0.6, yr, true); WN.c('#3a4a54'); prism(WN, offsetPoly(P, -1.2), yr, yr + 1.4, true);
    const HU = hull(P); W.c('#f0eee8'); capV(W, offsetPoly(HU, 2.2), yr + 1.4);
    api.pitchRoof(HU, yr + 1.45, 0.24, '#8aa6b6', 2.2, b.i);
    M.warm.q(...[[-0.3, -0.3], [0.3, -0.3], [0.3, 0.3], [-0.3, 0.3]].map(([a, c]) => { const p = f.F(a*f.L, 0, c*f.W); return [p[0], yr - 0.65, p[2]]; }));
    CTX.lamp(f.cx, lo + 5, f.cz, [255, 214, 160]);
    b.lo = lo; b.top = yr + 6;
  };

  // ======================= the buildings =======================
  const BI = new Map(claimed.map(b => [b.i, b]));
  const done = new Set();
  const run = (i, fn) => { const b = BI.get(i); if (!b) return null; done.add(i); try { return fn(b); } catch (err){ console.error('nuseng ' + i, err); return null; } };
  const LABTOP = (b, zh, en, ic, dy) => { if (!b || b.top === undefined) return; const c = cen(b.P); LAB(b, c[0], c[1], b.top + (dy || 6), zh, en, ic); };

  // --- Kent Ridge teaching blocks ---
  const NE = [0.7, -0.7], E_ = [0.9, -0.43], W_ = [-0.9, 0.43], N_ = [0, -1], S_ = [0, 1];
  run(106, b => { krB(b, 8, {corr:E_}); LABTOP(b, '工程楼 E1', 'Engineering Block E1', '🎓'); });
  run(135, b => { krB(b, 8, {corr:E_}); LABTOP(b, '工程楼 E1A', 'Engineering Block E1A', '🎓'); });
  run(51, b => { krB(b, 5, {corr:E_}); LABTOP(b, '工程楼 E2', 'Engineering Block E2', '🎓'); });
  run(137, b => { krB(b, 5, {corr:N_}); });
  run(86, b => { krB(b, 5, {corr:W_}); LABTOP(b, '工程楼 E3', 'Engineering Block E3', '🎓'); });
  run(81, b => { krB(b, 6, {corr:N_}); LABTOP(b, '工程楼 E3A', 'Engineering Block E3A', '🎓'); });
  run(8, b => { krB(b, 8, {corr:NE, screen:'facet', wall:'#e6e2d8'}); LABTOP(b, '工程楼 E4', 'Engineering Block E4', '🎓'); });
  run(32, b => { krB(b, 7, {corr:[-0.33, 0.94]}); });
  run(22, b => { krB(b, 3, {corr:[0.35, -0.94]}); LABTOP(b, '工程楼 E5', 'Engineering Block E5', '🎓'); });
  run(62, b => { krB(b, 4, {corr:[0.33, -0.94], rc:'#9cb5c4'}); LABTOP(b, '信息技术大楼', 'Information Technology Building (Computer Centre)', '💻'); });
  run(33, b => { krB(b, 3, {corr:[-0.94, -0.33]}); LABTOP(b, '英语语言与传播中心', 'Centre for English Language Communication (CELC)', '📚'); });
  run(158, b => { krB(b, 4, {corr:[-0.94, -0.33]}); LABTOP(b, '设计与环境学院 SDE2', 'SDE2 (College of Design and Engineering)', '🎓'); });
  run(17, b => { sdeVeil(b, 4, {psp:0}); });
  run(52, b => { krB(b, 3, {psp:0, tank:false}); });

  // --- SDE1 / SDE3 retrofit ---
  run(152, b => { const r = sdeVeil(b, 5, {kit:false}); pv(b.P, r.top); LABTOP(b, '设计与环境学院 SDE1', 'SDE1 (College of Design and Engineering)', '🎓'); });
  run(105, b => { // the jungle courtyard: a 15 x 11 m void in the elbow of the boomerang block
    const f = frameOf(b.P), c = [-614.0, 47.0], ry = Math.atan2(59.7 - (-34.6), -592.0 - (-635.5)), ux = Math.cos(ry), uz = Math.sin(ry);
    const H = [[-7.5, -5], [7.5, -5], [7.5, 5], [-7.5, 5]].map(([u, v]) => [c[0] + ux*u - uz*v, c[1] + uz*u + ux*v]);
    const okH = inAll(offsetPoly(b.P, -2.5), H);
    const r = sdeVeil(b, 4, okH ? {holes:[H], roof:false} : {kit:false});
    if (okH){ const I = offsetPoly(b.P, -0.3); W.c('#bfc5c4'); capV(W, b.P, r.top + 0.02, [H]); W.c('#ecebe6'); prism(W, I, r.top, r.top + 1.0, true); goldCourt(H, r.lo, r.top); }
    for (const arm of [[[-592.0, 59.7], [-635.5, -34.6], [-661.2, -23.3], [-621.2, 60.9]], [[-592.0, 59.7], [-621.2, 60.9], [-646.9, 132.0], [-619.4, 135.6]]]) pv(arm, r.top, okH ? [H] : []);
    LABTOP(b, '设计与环境学院 SDE3', 'SDE3 (College of Design and Engineering)', '🎓'); });
  run(26, b => { const r = sde4(b); LAB(b, r.c[0], r.c[1], r.top + 6, '设计与环境学院 SDE4（零能耗大楼）', 'SDE4 — net-zero energy building', '🏛'); });

  // --- modern engineering blocks ---
  run(160, b => { // E7: shifted / subtracted volumes, white fins all round, green walls and green pockets, courtyard
    const f = frameOf(b.P), hu = f.L/2, hv = f.W/2;
    const fin7 = {kind:'fin', wall:'#eef0ef', band:'#3a4f5d', finC:'#f4f5f3', finC2:'#d9cdb8', sp:1.2, fd:0.7, sill:0.1, head:0.35, blade:'#e8eae9', par:1.0};
    const r = cells(b, {f, U:[-hu, -hu + 18, hu - 16, hu], V:[-hv, -hv + 16, hv - 17, hv], H:[[7, 7, 6], [7, 2, 7], [5, 7, 7]], gf:3.8, rc:'#c9cdcb', terr:true,
      green:(i, j) => i === 1 && j === 1, sty:(i, j, sd, nb) => (nb === 2 || (i === 0 && j === 2 && sd === 's') || (i === 2 && j === 0 && sd === 'e')) ? {kind:'green', wall:'#e3e6e4'} : fin7});
    LABTOP(b, '工程楼 E7', 'Engineering Block E7', '🔬'); });
  run(136, b => { // E6: horizontal aluminium blades, a glazed stair hall at the east end, a louvred plant screen on the roof (cleanroom AHUs)
    const f = frameOf(b.P), hu = f.L/2, hv = f.W/2;
    const bd = {kind:'band', wall:'#eff0ee', band:'#3c5262', blade:'#d3d8da', bd:0.9, mull:1.6, sill:0.3, head:0.55, par:1.0}, gl = {kind:'glass', wall:'#e8ebea', band:'#5b7a89', blade:'#e3e6e6', bd:0.3, mull:1.5, sill:0.05, head:0.3, par:1.4};
    const r = cells(b, {f, U:[-hu, -hu + 9, hu], V:[-hv, hv], H:[[8, 7]], gf:3.8, sty:(i) => i === 0 ? gl : bd});
    const Q = rectE(f.F, -hu + 16, hu - 8, -hv + 6, hv - 6); W.c('#c7cccd'); prism(W, Q, r.top, r.top + 4.6, true); W.c('#9ea6a9'); capV(W, Q, r.top + 4.6);
    for (const e of EDG(Q)) for (let y = r.top + 0.5; y < r.top + 4.5; y += 0.55){ W.c('#b5bcbf'); slabE(W, e, 0, e.L, 0, 0.25, y, y + 0.08); }
    W.c('#cfd2d0'); for (const u of [-6, 0, 6]){ const p = f.F(u, 0, 0); cyl(W, 0.6, 0.6, 3.5, p[0], r.top + 4.6, p[2], 8); }
    LABTOP(b, '工程楼 E6', 'Engineering Block E6 (NanoFab)', '🔬', 10); });
  run(113, b => { // E8: two wings, white fins with warm accents, a recessed roof terrace
    const f = frameOf(b.P), hu = f.L/2, hv = f.W/2;
    const st = {kind:'fin', wall:'#eceeed', band:'#3e5463', finC:'#e7e9e8', finC2:'#c9b79a', sp:1.5, fd:0.55, sill:0.2, head:0.45, blade:'#dfe2e2', par:1.0};
    cells(b, {f, U:[-hu, -4, 4, hu], V:[-hv, hv], H:[[6, 6, 5]], gf:3.8, green:(i) => i === 2, sty:(i, j, sd) => i === 1 && (sd === 'n' || sd === 's') ? {kind:'glass', wall:'#e6e9e9', band:'#56717f', blade:'#e3e6e6', bd:0.25, mull:1.4, sill:0.05, head:0.3, par:1.0} : st});
    LABTOP(b, '工程楼 E8', 'Engineering Block E8', '🎓'); });
  run(34, b => { // T-Lab (Temasek Laboratories): 10-storey slab, ribbon windows with slim ledges, glazed lift-lobby strip, plant crown
    const f = frameOf(b.P), hu = f.L/2, hv = f.W/2;
    const bd = {kind:'band', wall:'#e9ebea', band:'#3b4f5d', blade:'#d6dadb', bd:0.7, mull:1.8, sill:0.85, head:0.5, par:1.2}, gl = {kind:'glass', wall:'#e3e7e8', band:'#58788a', blade:'#e3e6e6', bd:0.3, mull:1.2, sill:0.05, head:0.3, par:1.2};
    const r = cells(b, {f, U:[-hu, -5, 5, hu], V:[-hv, hv], H:[[10, 11, 10]], gf:3.8, sty:(i) => i === 1 ? gl : bd});
    roofKit(rectE(f.F, -hu + 1, hu - 1, -hv + 1, hv - 1), r.s[10] + 0.05, {rc:'#c3c7c6', wall:'#e9ebea', par:0, tank:true});
    LABTOP(b, '淡马锡实验室大楼 T-Lab', 'T-Lab (Temasek Laboratories)', '🔬'); });
  run(126, b => { const r = krB(b, 7, Object.assign({}, NEW, {fins:{sp:2.4, d:0.55, c:'#d4d9db'}, rc:'#c1c6c5', ld:0.7}));
    // glazed atrium roof-light over the central hall
    const c = [-592.0, -199.0], ry = 0.5236; if (inAll(b.P, rectE(rotP(c, ry), -9, 9, -7, 7))){ W.c('#d7dbdb'); boxV(W, 15, 0.9, 11, c[0], r.top, c[1], ry); WN.c('#6f8f9e'); hipV(WN, c[0], c[1], 14, 10, r.top + 0.9, 2.6, ry, 0); }
    LABTOP(b, '工程楼 EA', 'Engineering Block EA', '🎓'); });

  // --- workshops, canteen, lecture theatres ---
  run(48, b => { workshop(b, 3); LABTOP(b, '工程工场 EW1', 'Engineering Workshop EW1', '🎓'); });
  run(109, b => { const r = kr(b, Object.assign({}, KR, {n:2, gf:4.2, rc:'#a9b8bd', psp:6, pd:0.4, ld:0.6, roof:false})); const f = frameOf(b.P); W.c('#e2ded3'); capV(W, b.P, r.top); W.c('#9fb6c2', 0.03); hipV(W, f.cx, f.cz, f.L, f.W, r.top, 3.0, f.ry, 0.9); });
  run(50, b => { canteen(b); LABTOP(b, '工程学院食堂 Techno Edge', 'Techno Edge (canteen)', '🍜', 3); });
  run(63, b => lt(b, {h:11.5, rake:3.0, wall:'#ddd5c6', rc:'#a3b9c6'}));
  run(150, b => lt(b, {h:11.5, rake:3.0, wall:'#e0d8c9', rc:'#9cb5c4', flip:true}));
  run(39, b => lt(b, {h:9.0, rake:2.5, wall:'#ddd5c6', rc:'#a3b9c6'}));
  run(155, b => lt(b, {h:7.5, rake:2.2, wall:'#e0d8c9', rc:'#a5bccb'}));
  run(145, b => { lt(b, {h:7.5, rake:2.4, wall:'#ddd5c6', rc:'#9cb5c4', flip:true}); });

  // --- link bridges and covered links ---
  const LINKS = {14:1, 15:1, 21:0, 30:1, 36:2, 54:1, 55:1, 56:1, 57:1, 65:1, 66:3, 68:3, 74:3, 102:1, 103:0, 104:1, 114:1, 139:0, 146:1, 147:1, 156:1, 167:1, 172:0, 16:0, 110:0, 40:0, 140:0, 83:0, 88:0, 452:0};
  for (const k of Object.keys(LINKS)) run(+k, b => link(b, {nd:LINKS[k]}));
  // anything left (should be nothing): the site's generic builder
  for (const b of claimed) if (!done.has(b.i)) api.building(b);

  const g = new THREE.Group(); api.flushV(g, WN); return g;
}});
}
