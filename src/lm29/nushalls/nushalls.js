// ===== lm29/nushalls: NUS halls and residences in detail (City Brush v32, NUSX extension of lm20/nus/nus.js) =====
// Raffles Hall (19 Kent Ridge Crescent: walk-up Blocks 2-6, Kuok Foundation House = Blocks 7 & 8, Communal Hall / Block 1),
// Ridge View Residential College (Blocks A-E round two courts, Ridge View Tower, the 2017 Annexe), King Edward VII Hall
// (1A Kent Ridge Road: the long finger blocks A-H on the slope and the Communal Hall), Prince George's Park Residences
// (the ring of residence blocks round the PGP hill, Blocks 1-14 and Residences 4-6), Eusoff Hall and Temasek Hall (Kent Ridge
// Drive), Kent Ridge Hall and Sheares Hall (Heng Mui Keng Terrace). Real OSM footprints, storeys on the world-aligned 3.2 m
// residential window grid (lit at night), punched room windows with concrete hoods, slab string-courses, open access
// galleries, stair towers with glass-block slots, hipped terracotta / metal roofs with deep eaves and fascias, dining halls
// with tall glazing, entrance canopies, and a hard court per hall where there is free level ground.
// Everything goes into the site's own material batches (api.M) — no extra draw calls. No crests, names or lettering.
{
  // ---- which building is which (indices of lm29/nus_parts.json "nushalls") ----
  const HALL = {
    rh: [18, 43, 45, 72, 118, 125, 169],
    rv: [1, 25, 37, 89, 93, 108, 128],
    ke: [227, 246, 249, 282, 300, 301, 305, 325, 329, 337, 338, 355, 369, 370],
    pg: [233, 248, 269, 272, 278, 280, 286, 292, 303, 306, 309, 327, 328, 330, 333, 334, 339, 342, 343, 344, 360],
    eu: [388, 425, 434, 463],
    th: [418, 436, 441, 442, 464, 473],
    kr: [399, 405, 423, 437, 454, 472],
    sh: [432, 448, 451, 475, 482],
  };
  const OF = new Map(); for (const k in HALL) for (const i of HALL[k]) OF.set(i, k);
  // ---- per-hall palette and vocabulary ----
  const STY = {
    rh: {wall:'#ece3cf', trim:'#f8f4ea', roof:'#a4553a', acc:'#6f8a6a', win:'#4a5257', base:'#8f5d47', roofT:'hip', pitch:0.42, over:1.0, corr:[0.42, 0.9], bay:3.4},
    rv: {wall:'#efe8d9', trim:'#fbf8f1', roof:'#a05339', acc:'#c4925a', win:'#4b5459', base:'#9a6a52', roofT:'hip', pitch:0.40, over:1.0, corr:[-0.9, 0.42], bay:3.3},
    ke: {wall:'#f2ead8', trim:'#fcf9f2', roof:'#9e4d35', acc:'#d8c7a6', win:'#4d5458', base:'#8a5a45', roofT:'hip', pitch:0.45, over:1.1, corr:[-0.45, -0.9], bay:3.3, gal:true},
    pg: {wall:'#f0f0eb', trim:'#ffffff', roof:'#8a9aa3', acc:'#c4774a', win:'#45535c', base:'#a9a49a', roofT:'hip', pitch:0.22, over:1.3, corr:[0.6, 0.8], bay:3.2, gal:true,
         accs:['#c4774a', '#5f86a8', '#8ea468', '#d2a94e', '#b25e5e'], pil:'acc'},
    eu: {wall:'#f1e8d3', trim:'#fcf9f1', roof:'#b0603d', acc:'#c9a14a', win:'#4b5357', base:'#93624a', roofT:'hip', pitch:0.40, over:1.0, corr:[-0.45, -0.9], bay:3.4},
    th: {wall:'#ede6d6', trim:'#f9f6ee', roof:'#9a4631', acc:'#a6493a', win:'#4b5257', base:'#8c5944', roofT:'hip', pitch:0.42, over:1.0, corr:[-0.45, -0.9], bay:3.4},
    kr: {wall:'#eef0ee', trim:'#ffffff', roof:'#7b93a2', acc:'#a9533f', win:'#44525c', base:'#9c9a92', roofT:'hip', pitch:0.24, over:1.2, corr:[0.35, -0.94], bay:3.3, gal:true, pil:'trim'},
    sh: {wall:'#efe6d6', trim:'#faf6ee', roof:'#8e4933', acc:'#cf8a3e', win:'#4b5357', base:'#8f5d47', roofT:'hip', pitch:0.40, over:1.0, corr:[-0.35, 0.94], bay:3.4},
  };
  // special buildings
  const DINE = new Set([45, 227, 441, 454]);            // dining / communal halls: two tall storeys, big roofs, glazed ground floor
  const LABEL = {
    rh: ['莱佛士舍堂', 'Raffles Hall'], rv: ['岭景住宿学院', 'Ridge View Residential College'], ke: ['英皇爱德华七世舍堂', 'King Edward VII Hall'],
    pg: ['乔治王子公园宿舍', "Prince George's Park Residences"], eu: ['尤索夫舍堂', 'Eusoff Hall'], th: ['淡马锡舍堂', 'Temasek Hall'],
    kr: ['肯特岗舍堂', 'Kent Ridge Hall'], sh: ['薛尔思舍堂', 'Sheares Hall'],
  };
  (window.NUSX = window.NUSX || []).push({id:'nushalls',
    claim(b){ return OF.has(b.i); },
    build(api, claimed){
      const {M, GY, R, CTX, boxV, capV, capF, prism, cyl, seg, hipV, sarea, perim, cen, inPoly, offsetPoly, obb, gRange, rotP2, nrm2, floorsOf, F_RS, lerp, clamp} = api;
      const W = M.w, WR = M.wr;
      const FH = F_RS;
      const Q = (V, a, b, c, d) => V.q(a, b, c, d);
      const len2 = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
      const tops = {};      // per hall: highest roof and centroid sums for the label
      // ---------- roofs ----------
      // decompose a (nearly) rectilinear footprint into wing rectangles in its obb frame: [[u0, u1, v0, v1], ...] or null
      const rects = (P, ob) => { const c = Math.cos(ob.ry), s2 = Math.sin(ob.ry), U = P.map(p => { const dx = p[0] - ob.cx, dz = p[1] - ob.cz; return [dx*c - dz*s2, dx*s2 + dz*c]; });
        for (let i = 0; i < U.length; i++){ const a = U[i], b = U[(i + 1) % U.length], du = Math.abs(b[0] - a[0]), dv = Math.abs(b[1] - a[1]); if (Math.min(du, dv) > 0.9 && Math.min(du, dv) > 0.12*Math.max(du, dv)) return null; }
        const snap = vals => { vals.sort((x, y) => x - y); const out = []; for (const v of vals) if (!out.length || v - out[out.length - 1] > 1.2) out.push(v); return out; };
        const us = snap(U.map(p => p[0])), vs = snap(U.map(p => p[1])); if (us.length > 14 || vs.length > 14) return null;
        const nu = us.length - 1, nv = vs.length - 1, cell = []; for (let i = 0; i < nu; i++){ cell.push([]); for (let j = 0; j < nv; j++) cell[i].push(inPoly(U, (us[i] + us[i + 1])/2, (vs[j] + vs[j + 1])/2)); }
        const out = [];
        for (;;){ let best = null;
          for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++){ if (!cell[i][j]) continue;
            for (let i1 = i; i1 < nu && cell[i1][j]; i1++){ let j1 = j; for (;;){ let ok = j1 + 1 < nv; if (ok) for (let k = i; k <= i1; k++) if (!cell[k][j1 + 1]){ ok = false; break; } if (!ok) break; j1++; }
              const ar = (us[i1 + 1] - us[i])*(vs[j1 + 1] - vs[j]); if (!best || ar > best[4]) best = [i, i1, j, j1, ar]; } }
          if (!best) break; const [i0, i1, j0, j1] = best; for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) cell[i][j] = false;
          out.push([us[i0], us[i1 + 1], vs[j0], vs[j1 + 1]]); if (out.length > 12) return null; }
        return out.length ? out : null; };
      // darker tile courses across the four slopes of a hip roof (eave half-sizes hl, hw; ridge half-length k; frame G)
      const courses = (G, hl, hw, k, ye, h, rc) => { W.c(rc || '#8a4330'); const cr = [[G(-hl, ye, -hw), G(-k, ye + h, 0)], [G(hl, ye, -hw), G(k, ye + h, 0)], [G(hl, ye, hw), G(k, ye + h, 0)], [G(-hl, ye, hw), G(-k, ye + h, 0)]];
        const lp = (p, q, f) => [p[0] + (q[0] - p[0])*f, p[1] + (q[1] - p[1])*f + 0.07, p[2] + (q[2] - p[2])*f];
        for (const f of [0.3, 0.62]) for (let i = 0; i < 4; i++){ const [p0, q0] = cr[i], [p1, q1] = cr[(i + 1) % 4]; Q(W, lp(p0, q0, f), lp(p1, q1, f), lp(p1, q1, f + 0.04), lp(p0, q0, f + 0.04)); } };
      const roofHip = (P, top, S, o) => {
        const over = o.over || S.over, pitch = o.pitch || S.pitch, E = offsetPoly(P, over), n = P.length, s = sarea(P) > 0 ? 1 : -1, ye = top + 0.45;
        // fascia board and soffit
        W.c(S.trim);
        for (let i = 0; i < n; i++){ const a = E[i], b = E[(i + 1) % n], p = P[i], q = P[(i + 1) % n];
          Q(W, [a[0], top - 0.05, a[1]], [b[0], top - 0.05, b[1]], [b[0], ye, b[1]], [a[0], ye, a[1]]);
          Q(W, [p[0], top - 0.05, p[1]], [q[0], top - 0.05, q[1]], [b[0], top - 0.05, b[1]], [a[0], top - 0.05, a[1]]); }
        const ob = obb(P), A = Math.abs(sarea(P)), fill = A/(ob.L*ob.W);
        W.c(o.rc || S.roof, 0.05);
        if (fill > 0.86 && n <= 6){ const h = Math.min(ob.W*pitch*0.5 + 0.6, 8); hipV(W, ob.cx, ob.cz, ob.L, ob.W, ye, h, ob.ry, over);
          // ridge cap
          const F = rotP2(ob.cx, ob.cz, ob.ry), k = Math.max(0, (ob.L - ob.W)/2); W.c(o.ridge || '#7a3a28'); if (k > 0.5) seg(W, F(-k, ye + h + 0.05, 0), F(k, ye + h + 0.05, 0), 0.18, 4);
          courses(F, ob.L/2 + over, ob.W/2 + over, k, ye, h, o.ridge);
          return ye + h; }
        // rectilinear multi-wing plans: one hipped roof per wing (rectangles from a grid decomposition), meeting in valleys
        const rs = rects(P, ob);
        if (rs){ let yt = ye; const F = rotP2(ob.cx, ob.cz, ob.ry);
          for (const [u0, u1, v0, v1] of rs){ let Lr = u1 - u0, Wr = v1 - v0, ry = ob.ry; const c = F((u0 + u1)/2, 0, (v0 + v1)/2);
            if (Wr > Lr){ const t = Lr; Lr = Wr; Wr = t; ry += Math.PI/2; }
            if (Wr < 3.2){ W.c(o.rc || S.roof, 0.05); continue; }
            const h = Math.min(Wr*pitch*0.5 + 0.5, 8); W.c(o.rc || S.roof, 0.05); hipV(W, c[0], c[2], Lr, Wr, ye, h, ry, over);
            const G = rotP2(c[0], c[2], ry), k = Math.max(0, (Lr - Wr)/2); if (k > 0.5){ W.c(o.ridge || '#7a3a28'); seg(W, G(-k, ye + h + 0.05, 0), G(k, ye + h + 0.05, 0), 0.16, 4); }
            courses(G, Lr/2 + over, Wr/2 + over, k, ye, h, o.ridge);
            yt = Math.max(yt, ye + h); }
          return yt; }
        const dIn = clamp(0.92*A/perim(P), 1.5, 10) + over, I = offsetPoly(E, -dIn), yr = ye + dIn*pitch*0.5 + 0.3;
        if (Math.sign(sarea(I)) !== Math.sign(sarea(P)) || Math.abs(sarea(I)) < 1){ capV(W, E, ye + 0.3); return ye + 0.3; }
        for (let i = 0; i < n; i++){ const a = E[i], b = E[(i + 1) % n], c = I[(i + 1) % n], d = I[i]; Q(W, [a[0], ye, a[1]], [b[0], ye, b[1]], [c[0], yr, c[1]], [d[0], yr, d[1]]); }
        capV(W, I, yr);
        return yr; };
      const roofFlat = (P, top, S, o) => { W.c(o.rc || '#b9bebd', 0.04); capV(W, P, top + 0.05);
        const I = offsetPoly(P, -0.35); W.c(S.trim); for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], c = I[(i + 1) % P.length], d = I[i];
          Q(W, [a[0], top + 1.0, a[1]], [b[0], top + 1.0, b[1]], [c[0], top + 1.0, c[1]], [d[0], top + 1.0, d[1]]); Q(W, [d[0], top, d[1]], [c[0], top, c[1]], [c[0], top + 1.0, c[1]], [d[0], top + 1.0, d[1]]); }
        return top + 1.0; };
      // ---------- one residential block on its real footprint ----------
      const block = (b, S, o) => {
        o = o || {};
        const P = b.P, n = P.length, s = sarea(P) > 0 ? 1 : -1, [lo, hi] = gRange(P);
        const fh = o.fh || FH, nf = o.nf || Math.max(1, Math.round((b.h - 2)/3.2));
        const f0 = Math.ceil((lo + 0.4)/FH)*FH;
        let fl = []; for (let k = 0; k < nf; k++) fl.push(f0 + k*fh);
        let top = f0 + nf*fh + 0.25; if (top < hi + 3.0){ const add = Math.ceil((hi + 3.0 - top)/fh); for (let k = 0; k < add; k++) fl.push(f0 + (nf + k)*fh); top += add*fh; }
        const par = S.roofT === 'flat' || o.roof === 'flat' ? 1.0 : 0;
        const ob = obb(P), cd = o.corr || S.corr, cl = Math.hypot(cd[0], cd[1]);
        const dine = !!o.dine, win = o.win || S.win, acc = o.acc || S.acc;
        // string course ring (thin projecting slab edge at every floor)
        const SC = offsetPoly(P, 0.18);
        for (let i = 0; i < n; i++){
          const a = P[i], c = P[(i + 1) % n], L = len2(a, c); if (L < 0.05) continue;
          const nn = nrm2(a, c, s), ux = (c[0] - a[0])/L, uz = (c[1] - a[1])/L, ga = GY(a[0], a[1]), gc = GY(c[0], c[1]);
          // wall + base course
          W.c(o.wall || S.wall); Q(W, [a[0], lo - 1.8, a[1]], [c[0], lo - 1.8, c[1]], [c[0], top + par, c[1]], [a[0], top + par, a[1]]);
          if (L > 1){ W.c(S.base); Q(W, [a[0] + nn[0]*0.05, ga - 0.4, a[1] + nn[1]*0.05], [c[0] + nn[0]*0.05, gc - 0.4, c[1] + nn[1]*0.05], [c[0] + nn[0]*0.05, gc + 0.9, c[1] + nn[1]*0.05], [a[0] + nn[0]*0.05, ga + 0.9, a[1] + nn[1]*0.05]); }
          // string courses
          { const A2 = SC[i], C2 = SC[(i + 1) % n]; W.c(S.trim);
            for (let k = 1; k < fl.length; k++){ const y = fl[k] - 0.12; Q(W, [A2[0], y, A2[1]], [C2[0], y, C2[1]], [C2[0], y + 0.26, C2[1]], [A2[0], y + 0.26, A2[1]]); Q(W, [a[0], y + 0.26, a[1]], [c[0], y + 0.26, c[1]], [C2[0], y + 0.26, C2[1]], [A2[0], y + 0.26, A2[1]]); } }
          if (L < 2.6) continue;
          const isGal = (S.gal || o.gal) && !dine && L > 10 && (nn[0]*cd[0] + nn[1]*cd[1])/cl > 0.55;
          const e = Math.min(0.9, L*0.12), nb = Math.max(1, Math.round((L - 2*e)/(o.bay || S.bay))), bw = (L - 2*e)/nb;
          if (isGal){
            // open access gallery: solid parapet, dark recess behind, a column per bay
            for (let k = 0; k < fl.length; k++){ const y = fl[k]; const gm = Math.max(ga, gc); if (y + 2.6 < gm) continue;
              const off = 0.06, A0 = [a[0] + ux*e + nn[0]*off, a[1] + uz*e + nn[1]*off], B0 = [c[0] - ux*e + nn[0]*off, c[1] - uz*e + nn[1]*off];
              WR.c(win); Q(WR, [A0[0], y + 1.05, A0[1]], [B0[0], y + 1.05, B0[1]], [B0[0], y + 2.85, B0[1]], [A0[0], y + 2.85, A0[1]]);
              W.c(S.trim); const off2 = 0.14, A1 = [a[0] + ux*e + nn[0]*off2, a[1] + uz*e + nn[1]*off2], B1 = [c[0] - ux*e + nn[0]*off2, c[1] - uz*e + nn[1]*off2];
              Q(W, [A1[0], y + 0.1, A1[1]], [B1[0], y + 0.1, B1[1]], [B1[0], y + 1.05, B1[1]], [A1[0], y + 1.05, A1[1]]);
              Q(W, [A1[0], y + 1.05, A1[1]], [B1[0], y + 1.05, B1[1]], [B0[0], y + 1.05, B0[1]], [A0[0], y + 1.05, A0[1]]);
              for (let j = 0; j <= nb; j++){ const u = e + j*bw, x = a[0] + ux*u + nn[0]*0.16, z = a[1] + uz*u + nn[1]*0.16;
                Q(W, [x - ux*0.16, y + 1.05, z - uz*0.16], [x + ux*0.16, y + 1.05, z + uz*0.16], [x + ux*0.16, y + 3.1, z + uz*0.16], [x - ux*0.16, y + 3.1, z - uz*0.16]); } }
          } else {
            // pilasters every few bays (2000s blocks: accent-coloured on PGP, white elsewhere)
            if (S.pil && !dine && nb >= 4){ const pc = S.pil === 'acc' ? acc : S.trim, y0 = Math.max(lo - 1.0, Math.min(ga, gc) - 0.5);
              for (let j = 2; j < nb - 1; j += 3){ const u = e + j*bw, x = a[0] + ux*u, z = a[1] + uz*u, hw = 0.45, d = 0.28;
                const p0 = [x - ux*hw, z - uz*hw], p1 = [x + ux*hw, z + uz*hw], q0 = [p0[0] + nn[0]*d, p0[1] + nn[1]*d], q1 = [p1[0] + nn[0]*d, p1[1] + nn[1]*d];
                W.c(pc); Q(W, [q0[0], y0, q0[1]], [q1[0], y0, q1[1]], [q1[0], top + 0.3, q1[1]], [q0[0], top + 0.3, q0[1]]);
                Q(W, [p0[0], y0, p0[1]], [q0[0], y0, q0[1]], [q0[0], top + 0.3, q0[1]], [p0[0], top + 0.3, p0[1]]); Q(W, [p1[0], y0, p1[1]], [q1[0], y0, q1[1]], [q1[0], top + 0.3, q1[1]], [p1[0], top + 0.3, p1[1]]); } }
            // punched room windows with a concrete hood over each (dining halls: tall glazing)
            for (let k = 0; k < fl.length; k++){ const y = fl[k];
              const gf = k === 0 && (dine || o.gfGlass);
              const y0 = gf ? y + 0.35 : dine ? y + 0.7 : y + 0.85, y1 = gf ? y + 2.95 : dine ? y + 2.9 : y + 2.45;
              const ww = gf ? bw - 0.45 : Math.min(bw*(dine ? 0.7 : 0.5), dine ? 2.6 : 1.7);
              for (let j = 0; j < nb; j++){ const u = e + (j + 0.5)*bw, x = a[0] + ux*u, z = a[1] + uz*u; if (y1 < GY(x, z) + 0.5) continue;
                const p0 = [x - ux*ww/2 + nn[0]*0.05, z - uz*ww/2 + nn[1]*0.05], p1 = [x + ux*ww/2 + nn[0]*0.05, z + uz*ww/2 + nn[1]*0.05];
                const V = gf ? M.gl : WR; V.c(gf ? '#7f98a6' : win); Q(V, [p0[0], y0, p0[1]], [p1[0], y0, p1[1]], [p1[0], y1, p1[1]], [p0[0], y1, p0[1]]);
                if (!gf){ const h0 = [p0[0] - ux*0.15, p0[1] - uz*0.15], h1 = [p1[0] + ux*0.15, p1[1] + uz*0.15], d = dine ? 0.3 : 0.55, H0 = [h0[0] + nn[0]*d, h0[1] + nn[1]*d], H1 = [h1[0] + nn[0]*d, h1[1] + nn[1]*d];
                  W.c(S.trim); Q(W, [h0[0], y1 + 0.28, h0[1]], [h1[0], y1 + 0.28, h1[1]], [H1[0], y1 + 0.2, H1[1]], [H0[0], y1 + 0.2, H0[1]]); Q(W, [H0[0], y1 + 0.08, H0[1]], [H1[0], y1 + 0.08, H1[1]], [H1[0], y1 + 0.2, H1[1]], [H0[0], y1 + 0.2, H0[1]]);
                  if (dine) continue;
                  // sill
                  Q(W, [p0[0] + nn[0]*0.12, y0 - 0.1, p0[1] + nn[1]*0.12], [p1[0] + nn[0]*0.12, y0 - 0.1, p1[1] + nn[1]*0.12], [p1[0] + nn[0]*0.12, y0, p1[1] + nn[1]*0.12], [p0[0] + nn[0]*0.12, y0, p0[1] + nn[1]*0.12]); } } }
          }
        }
        // ---- stair towers at the wing ends: short end walls between two convex corners ----
        let nt = 0; const ends = [];
        for (let i = 0; i < n; i++){ const a = P[(i - 1 + n) % n], p = P[i], q = P[(i + 1) % n], r = P[(i + 2) % n], L = len2(p, q);
          if (L < 5 || L > 17 || len2(a, p) < 7 || len2(q, r) < 7) continue;
          const cr1 = (p[0] - a[0])*(q[1] - p[1]) - (p[1] - a[1])*(q[0] - p[0]), cr2 = (q[0] - p[0])*(r[1] - q[1]) - (q[1] - p[1])*(r[0] - q[0]);
          if (cr1*s <= 0 || cr2*s <= 0) continue; ends.push([i, L]); }
        ends.sort((u, v) => v[1] - u[1]);
        if (!dine && !o.noStair) for (const [i] of ends.slice(0, o.towers || 3)){
          const p = P[i], q = P[(i + 1) % n], L = len2(p, q), nn = nrm2(p, q, s), ux = (q[0] - p[0])/L, uz = (q[1] - p[1])/L, mx = (p[0] + q[0])/2, mz = (p[1] + q[1])/2;
          const w = Math.min(3.6, L*0.42), d0 = -2.2, d1 = 0.9, ry = -Math.atan2(uz, ux);
          const C = [mx + nn[0]*(d0 + d1)/2, mz + nn[1]*(d0 + d1)/2], gy = GY(mx + nn[0]*d1, mz + nn[1]*d1), tt = top + 1.9;
          W.c(acc); boxV(W, w, tt - (lo - 1.5), d1 - d0, C[0], lo - 1.5, C[1], ry);
          // glass-block slot down the face (lit softly at night)
          const fx = mx + nn[0]*(d1 + 0.04), fz = mz + nn[1]*(d1 + 0.04), hw = w*0.18;
          M.gl.c('#a9c0cb'); Q(M.gl, [fx - ux*hw, gy + 2.6, fz - uz*hw], [fx + ux*hw, gy + 2.6, fz + uz*hw], [fx + ux*hw, top - 0.4, fz + uz*hw], [fx - ux*hw, top - 0.4, fz - uz*hw]);
          // cap: a small hipped hood in the roof colour (flat slab on metal-roofed halls)
          W.c(S.trim); boxV(W, w + 0.5, 0.3, d1 - d0 + 0.5, C[0], tt, C[1], ry);
          if (S.roofT === 'hip'){ W.c(o.rc || S.roof, 0.04); hipV(W, C[0], C[1], w + 0.6, d1 - d0 + 0.6, tt + 0.3, 1.0, ry, 0); }
          nt++; }
        // ---- roof ----
        const rtop = (o.roof || S.roofT) === 'flat' ? roofFlat(P, top, S, o) : roofHip(P, top, S, o);
        // ---- entrance canopy on the longest edge (ground level there) ----
        { let bi = 0, bl = 0; for (let i = 0; i < n; i++){ const L = len2(P[i], P[(i + 1) % n]); if (L > bl){ bl = L; bi = i; } }
          const a = P[bi], c = P[(bi + 1) % n], nn = nrm2(a, c, s), ux = (c[0] - a[0])/bl, uz = (c[1] - a[1])/bl, t = dine ? 0.5 : 0.3 + ((b.i*7) % 5)*0.08;
          const mx = lerp(a[0], c[0], t), mz = lerp(a[1], c[1], t), g = GY(mx + nn[0]*1.5, mz + nn[1]*1.5), cw = dine ? 8 : 4.8, cdp = dine ? 3.6 : 2.6, ry = -Math.atan2(uz, ux);
          if (g + 3.4 < top && bl > 8){ const C = [mx + nn[0]*cdp/2, mz + nn[1]*cdp/2];
            W.c(S.trim); boxV(W, cw, 0.28, cdp, C[0], g + 3.05, C[1], ry);
            W.c('#6d7478'); for (const sg of [-1, 1]){ const x = mx + ux*sg*(cw/2 - 0.3) + nn[0]*(cdp - 0.3), z = mz + uz*sg*(cw/2 - 0.3) + nn[1]*(cdp - 0.3); boxV(W, 0.18, 3.1 - (GY(x, z) - g) + 0.4, 0.18, x, GY(x, z) - 0.4, z); }
            M.warm.c('#56646c'); boxV(M.warm, cw*0.8, 0.04, cdp*0.6, C[0], g + 3.0, C[1], ry);
            // the lobby behind it: glazed doors
            M.gl.c('#86a0ad'); const p0 = [mx - ux*cw*0.3 + nn[0]*0.07, mz - uz*cw*0.3 + nn[1]*0.07], p1 = [mx + ux*cw*0.3 + nn[0]*0.07, mz + uz*cw*0.3 + nn[1]*0.07];
            Q(M.gl, [p0[0], g + 0.05, p0[1]], [p1[0], g + 0.05, p1[1]], [p1[0], g + 2.7, p1[1]], [p0[0], g + 2.7, p0[1]]);
            CTX.lamp(C[0], g + 2.7, C[1], [255, 224, 176]); } }
        // rooftop: dining halls get a ventilated ridge lantern
        if (dine && (o.roof || S.roofT) !== 'flat'){ const F = rotP2(ob.cx, ob.cz, ob.ry), Lr = Math.max(4, ob.L*0.45);
          W.c(S.trim); boxV(W, Lr, 1.1, 2.4, ob.cx, rtop - 0.4, ob.cz, ob.ry); W.c(o.rc || S.roof); hipV(W, ob.cx, ob.cz, Lr + 0.8, 3.2, rtop + 0.7, 0.9, ob.ry, 0);
          M.wr.c(S.win); for (const sg of [-1, 1]){ const p = F(0, 0, sg*1.22); boxV(M.wr, Lr - 0.6, 0.6, 0.02, p[0], rtop - 0.15, p[2], ob.ry); } }
        return {lo, top, rtop, ob};
      };
      // ---------- modern Ridge View Annexe (2017): white blocks with timber-tone fins and a planted roof ----------
      const annexe = (b, S) => {
        const r = block(b, {...S, roofT:'flat', gal:false}, {nf:3, roof:'flat', rc:'#9aa49c', gfGlass:true, noStair:true, bay:2.6, win:'#3f5560'});
        const P = b.P, n = P.length, s = sarea(P) > 0 ? 1 : -1;
        // vertical fins (timber tone) on every long face
        W.c('#b48a5e');
        for (let i = 0; i < n; i++){ const a = P[i], c = P[(i + 1) % n], L = len2(a, c); if (L < 8) continue; const nn = nrm2(a, c, s), ux = (c[0] - a[0])/L, uz = (c[1] - a[1])/L, nf = Math.floor((L - 1)/1.3);
          for (let k = 1; k < nf; k++){ const u = (L - nf*1.3)/2 + k*1.3, x = a[0] + ux*u, z = a[1] + uz*u, d = 0.7, t = 0.08, y0 = r.lo + 3.6, y1 = r.top + 0.8;
            const p0 = [x - ux*t, z - uz*t], p1 = [x + ux*t, z + uz*t], q0 = [p0[0] + nn[0]*d, p0[1] + nn[1]*d], q1 = [p1[0] + nn[0]*d, p1[1] + nn[1]*d];
            Q(W, [q0[0], y0, q0[1]], [q1[0], y0, q1[1]], [q1[0], y1, q1[1]], [q0[0], y1, q0[1]]); Q(W, [p0[0], y0, p0[1]], [q0[0], y0, q0[1]], [q0[0], y1, q0[1]], [p0[0], y1, p0[1]]); } }
        const I = offsetPoly(P, -1.8); if (Math.sign(sarea(I)) === s && Math.abs(sarea(I)) > 40){ M.veg.c('#6f9150', 0.1); capV(M.veg, I, r.top + 0.25); }
        return r; };
      // ---------- Ridge View Tower: eight storeys, flat roof with a light crown frame ----------
      const rvTower = (b, S) => {
        const r = block(b, S, {nf:8, roof:'flat', rc:'#a9b0b0', towers:2});
        const ob = r.ob, F = rotP2(ob.cx, ob.cz, ob.ry); W.c(S.trim);
        for (const [u0, v0, u1, v1] of [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]]){
          const A = F(u0*ob.L*0.32, r.top + 3.2, v0*ob.W*0.28), B = F(u1*ob.L*0.32, r.top + 3.2, v1*ob.W*0.28); seg(W, A, B, 0.22, 4); }
        for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]){ const p = F(u*ob.L*0.32, 0, v*ob.W*0.28); seg(W, [p[0], r.top + 0.9, p[2]], [p[0], r.top + 3.3, p[2]], 0.2, 4); }
        W.c('#a6aeb0'); boxV(W, 6, 2.2, 4, ob.cx, r.top + 1.0, ob.cz, ob.ry);
        return r; };
      // ---------- a hard court (basketball / multi-purpose) on free, nearly level ground near a hall ----------
      const court = (cx, cz, ry) => {
        const Lc = 30, Wc = 17, F = rotP2(cx, cz, ry);
        const pts = []; for (let u = -Lc/2 - 2; u <= Lc/2 + 2; u += 4) for (let v = -Wc/2 - 2; v <= Wc/2 + 2; v += 4) pts.push(F(u, 0, v));
        let g0 = 1e9, g1 = -1e9; for (const p of pts){ if (!api.free(p[0], p[2])) return false; const g = GY(p[0], p[2]); g0 = Math.min(g0, g); g1 = Math.max(g1, g); }
        if (g1 - g0 > 2.6) return false;
        const y = g1 + 0.15, pad = [[-Lc/2 - 2, -Wc/2 - 2], [Lc/2 + 2, -Wc/2 - 2], [Lc/2 + 2, Wc/2 + 2], [-Lc/2 - 2, Wc/2 + 2]].map(([u, v]) => { const p = F(u, 0, v); return [p[0], p[2]]; });
        W.c('#9a9d98'); for (let i = 0; i < 4; i++){ const a = pad[i], c = pad[(i + 1) % 4]; Q(W, [a[0], g0 - 0.6, a[1]], [c[0], g0 - 0.6, c[1]], [c[0], y, c[1]], [a[0], y, a[1]]); }
        W.c('#4f7d63'); capV(W, pad, y);
        const inn = [[-Lc/2, -Wc/2], [Lc/2, -Wc/2], [Lc/2, Wc/2], [-Lc/2, Wc/2]].map(([u, v]) => { const p = F(u, 0, v); return [p[0], p[2]]; });
        W.c('#b5573f'); capV(W, inn, y + 0.02);
        // lines: boundary, centre line, keys
        W.c('#eeeeea'); const ln = (u0, v0, u1, v1) => { const A = F(u0, y + 0.04, v0), B = F(u1, y + 0.04, v1), dx = B[0] - A[0], dz = B[2] - A[2], L = Math.hypot(dx, dz) || 1, nx = -dz/L*0.06, nz = dx/L*0.06;
          Q(W, [A[0] - nx, A[1], A[2] - nz], [B[0] - nx, B[1], B[2] - nz], [B[0] + nx, B[1], B[2] + nz], [A[0] + nx, A[1], A[2] + nz]); };
        ln(-Lc/2 + 1, -Wc/2 + 1, Lc/2 - 1, -Wc/2 + 1); ln(-Lc/2 + 1, Wc/2 - 1, Lc/2 - 1, Wc/2 - 1); ln(-Lc/2 + 1, -Wc/2 + 1, -Lc/2 + 1, Wc/2 - 1); ln(Lc/2 - 1, -Wc/2 + 1, Lc/2 - 1, Wc/2 - 1); ln(0, -Wc/2 + 1, 0, Wc/2 - 1);
        for (const sg of [-1, 1]){ ln(sg*(Lc/2 - 1), -2.4, sg*(Lc/2 - 6.8), -2.4); ln(sg*(Lc/2 - 1), 2.4, sg*(Lc/2 - 6.8), 2.4); ln(sg*(Lc/2 - 6.8), -2.4, sg*(Lc/2 - 6.8), 2.4);
          // hoop: post, backboard
          const p = F(sg*(Lc/2 - 0.2), 0, 0); W.c('#5a6064'); seg(W, [p[0], y, p[2]], [p[0], y + 3.3, p[2]], 0.09, 4); const bb = F(sg*(Lc/2 - 1.1), 0, 0); W.c('#f4f4f2'); boxV(W, 0.06, 1.05, 1.8, bb[0], y + 2.9, bb[2], ry); W.c('#eeeeea'); }
        // floodlight masts at the four corners
        for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]){ const p = F(u*(Lc/2 + 1.5), 0, v*(Wc/2 + 1.5)); W.c('#6a7073'); seg(W, [p[0], y - 0.3, p[2]], [p[0], y + 9, p[2]], 0.12, 4);
          boxV(M.lamp, 0.8, 0.3, 0.5, p[0], y + 9, p[2], ry); CTX.lamp(p[0], y + 8.5, p[2], [240, 246, 255]); }
        // perimeter fence (low-poly mesh panels)
        W.c('#6f7a76'); for (let i = 0; i < 4; i++){ const a = pad[i], c = pad[(i + 1) % 4], L = len2(a, c), m = Math.ceil(L/3);
          seg(W, [a[0], y + 2.4, a[1]], [c[0], y + 2.4, c[1]], 0.04, 3); seg(W, [a[0], y + 1.2, a[1]], [c[0], y + 1.2, c[1]], 0.03, 3);
          for (let k = 0; k < m; k++){ const x = lerp(a[0], c[0], k/m), z = lerp(a[1], c[1], k/m); seg(W, [x, y - 0.2, z], [x, y + 2.45, z], 0.04, 3); } }
        api.occupy(pad, 1);
        return true; };
      // ---------- build every claimed block ----------
      const byHall = {}; for (const b of claimed){ const k = OF.get(b.i); (byHall[k] = byHall[k] || []).push(b); }
      const pgRes = i => [233, 286, 339, 360].includes(i) ? 0 : [248, 269, 292, 344].includes(i) ? 1 : [328, 330, 333, 342].includes(i) ? 2 : [272, 280, 334, 306, 309].includes(i) ? 3 : 4;
      for (const hk in byHall){
        const S = STY[hk], T = tops[hk] = {y:0, x:0, z:0, n:0, A:0};
        for (const b of byHall[hk]){
          let r;
          if (b.i === 1) r = annexe(b, S);
          else if (b.i === 128) r = rvTower(b, S);
          else if (DINE.has(b.i)) r = block(b, S, {nf:2, fh:3.2, dine:true, pitch:S.pitch*1.15, over:1.5, bay:4.2});
          else if (hk === 'pg') r = block(b, S, {acc:S.accs[pgRes(b.i)]});
          else if (hk === 'ke') r = block(b, S, {nf:4});
          else r = block(b, S, {});
          T.y = Math.max(T.y, r.rtop); const a = b.area; T.x += b.c[0]*a; T.z += b.c[1]*a; T.A += a; T.n++;
        }
      }
      // ---------- hall courts on free level ground near each hall ----------
      const courts = [];
      // positions found offline by a free-ground search near each hall (verified again here: skipped if the ground is taken)
      for (const [hk, x, z, ry] of [['rh', -364, -150, 1.9908], ['eu', -687.7, 616, 2.0208], ['th', -448, 710.1, 2.0208], ['kr', -120, 829.3, 0.45], ['sh', -94, 876.2, 0.35], ['rv', -22.4, 86, 0.35], ['pg', 400.7, 852, 0.3]])
        if (byHall[hk] && court(x, z, ry)) courts.push(hk);
      // ---------- labels: one per hall, over the tallest roof ----------
      for (const hk in tops){ const T = tops[hk]; if (!T.A) continue; const L = LABEL[hk]; api.label(T.x/T.A, T.z/T.A, T.y + 6, L[0], L[1], {ic:'🏠'}); }
      try { (window.__nusxStats = window.__nusxStats || {}).nushallsCourts = courts; } catch (e){}
      return undefined;
    }});
}
