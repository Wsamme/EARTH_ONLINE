// ===== lm29/nussci — NUS Kent Ridge east (City Brush v32, NUSX extension of the `nus` site, lm20/nus/nus.js) =====
// The Faculty of Science (S1–S17, S1A Lee Wee Kheng Building, S9 Wet Science Building), the Yong Loo Lin School of Medicine
// (MD1 Tahir Foundation Building, MD2–MD11, MD6 Centre for Translational Medicine, MD11 Clinical Research Centre), the Centre
// for Life Sciences, the Medicine+Science Library, University Hall (Lee Kong Chian and Tan Chin Tuan wings), the Frontier
// canteen, LT20–LT34, NUS Enterprise / Heng Mui Keng Terrace, the Temasek Life Sciences Laboratory and the National University
// Hospital cluster (Main Building, Kent Ridge Wing, Tower Block, Medical Centre, Centre for Oral Health, Service Block).
// Every model stands on its real OSM footprint (b.P) with foundations to the lowest ground of the footprint.
// Vocabulary: 1970s–80s Kent Ridge teaching / lab blocks (cream concrete frames, a deep white sunshade ledge over a recessed dark
// window band on every floor, expressed column fins, brick plinth, pale blue roofs with plant rooms and lab fume stacks, upper
// floor link bridges between the S and MD blocks); 2000s blocks (white, aluminium fins, blue-grey glass, green / PV roofs);
// glass research towers (S9, MD1, MD6) and the white NUH blocks with blue-green ribbon windows. Signature models: S9 (16 storeys,
// 2019, glass behind white floor blades), MD1 (white vertical fin screen), MD6 (glass with white spandrel bands), CeLS (glass
// atrium drum, PV), the library's glazed curved end, University Hall (two wings, skylit atria, round tower at the joint), the
// Frontier food hall (hipped roof on columns), the raked LTs, NUH Main Building (6 storeys, 1986: south fingers round planted
// courtyards, porte-cochere, roof penthouses), the 3-storey louvred Service Block with cooling towers, NUH Medical Centre (2013:
// parking-deck podium + 20-storey glass tower), the NUHS Tower Block, the Centre for Oral Health (2019: twin towers over a podium,
// open atrium with link bridges, N/S sunshades, west cores, stepped planted terraces), the TLL entrance lantern.
// No logos, names or lettering. Everything goes into the site's batches (api.M) — no extra meshes.
{
const MINE = new Set([174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 228, 229, 230, 231, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 247, 250, 251, 252, 253, 254, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 270, 271, 273, 274, 275, 276, 277, 279, 281, 283, 284, 285, 287, 288, 289, 290, 291, 293, 294, 295, 297, 298, 299, 302, 304, 307, 308, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 321, 322, 323, 324, 326, 331, 332, 335, 336, 340, 341, 345, 346, 347, 348, 349, 350, 351, 352, 356, 357, 358, 359, 361, 362, 363, 364, 365, 366, 367, 368, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383]);
// ---- what each claimed building is (k = builder; h = height override, m; lab = fume stacks) ----
const KR = 'kr', NEW = 'new', HOS = 'hosp', LT = 'lt';
const CFG = {
  // Faculty of Science, the 1970s-80s Kent Ridge lab blocks round Science Drive 2/3
  307:{k:KR, lab:1}, 304:{k:KR, lab:1}, 268:{k:KR, lab:1}, 291:{k:KR, lab:1}, 335:{k:KR, h:12}, 297:{k:KR, lab:1}, 242:{k:KR, lab:1},
  204:{k:KR, lab:1}, 178:{k:KR, lab:1}, 203:{k:KR, lab:1}, 185:{k:KR, lab:1}, 183:{k:KR, lab:1}, 215:{k:KR, lab:1}, 175:{k:KR, h:20, lab:1},
  184:{k:KR, lab:1}, 174:{k:KR, h:16}, 179:{k:KR, h:16}, 294:{k:KR, h:12}, 352:{k:KR, h:8}, 177:{k:KR, h:12}, 194:{k:KR, h:12}, 190:{k:KR, h:16},
  // Medicine: the MD blocks
  245:{k:KR, lab:1}, 261:{k:KR, lab:1}, 252:{k:KR, lab:1}, 260:{k:KR, lab:1}, 377:{k:KR, lab:1}, 281:{k:KR, lab:1},
  // 2000s blocks
  208:{k:NEW, green:1}, 217:{k:NEW, res:1, pv:1}, 212:{k:NEW, green:1}, 205:{k:NEW, green:1}, 209:{k:NEW, pv:1}, 201:{k:NEW, plain:1}, 182:{k:NEW, lab:1, warm:1},
  326:{k:NEW, lab:1, h:16}, 323:{k:KR, h:18}, 379:{k:NEW, res:1}, 364:{k:'hip'},
  // lecture theatres
  368:{k:LT}, 331:{k:LT}, 206:{k:LT}, 210:{k:LT}, 197:{k:LT}, 200:{k:LT}, 216:{k:LT}, 176:{k:LT},
  // NUH cluster
  225:{k:HOS, main:1}, 221:{k:HOS, main:1}, 356:{k:HOS}, 276:{k:HOS}, 285:{k:HOS}, 287:{k:HOS}, 341:{k:HOS}, 345:{k:HOS}, 348:{k:HOS}, 347:{k:HOS},
  259:{k:HOS}, 273:{k:HOS}, 349:{k:HOS}, 228:{k:HOS}, 229:{k:HOS}, 299:{k:HOS}, 310:{k:HOS}, 187:{k:HOS, svc:1}, 262:{k:HOS, h:12}, 359:{k:HOS, h:9},
};
// old camp blocks at Heng Mui Keng Terrace / Kent Ridge Road (NUS Enterprise incubator etc.): two storeys under red hipped roofs
for (const i of [312, 313, 314, 315, 316, 317, 318, 223, 241, 243, 253, 254, 256, 308, 375, 357, 324]) CFG[i] = {k:'hip'};
// labels: [zh, en, icon, building index for position (+ dy above the roof)]
const LBL = [
  ['大学堂', 'University Hall', '🏛', 189, 8],
  ['杨潞龄医学院 MD1 大楼', 'MD1 – Tahir Foundation Building', '🏥', 350, 6],
  ['转化医学中心 (MD6)', 'Centre for Translational Medicine (MD6)', '🔬', 231, 6],
  ['临床研究中心 (MD11)', 'Clinical Research Centre (MD11)', '🔬', 209, 6],
  ['生命科学中心', 'Centre for Life Sciences', '🔬', 250, 6],
  ['医学与理学图书馆', 'Medicine+Science Library', '📚', 199, 6],
  ['理学院 S9 湿实验科学大楼', 'S9 Wet Science Building', '🔬', 237, 6],
  ['理学院 S16', 'Faculty of Science (S16)', '🎓', 208, 6],
  ['理学院 S17', 'Faculty of Science (S17)', '🎓', 217, 6],
  ['李伟庆大楼 (S1A)', 'Lee Wee Kheng Building (S1A)', '🔬', 182, 6],
  ['林生秩讲堂 (LT27)', 'Lim Seng Tjoe Lecture Theatre (LT27)', '🎓', 210, 6],
  ['Frontier 食阁', 'Frontier canteen', '🍜', 213, 6],
  ['国立大学医院', 'National University Hospital', '🏥', 225, 8],
  ['国大医院医疗中心', 'NUH Medical Centre', '🏥', 372, 6],
  ['国大卫生系统大楼', 'NUHS Tower Block', '🏥', 266, 6],
  ['肯特岗翼楼', 'Kent Ridge Wing (NUH)', '🏥', 356, 6],
  ['国大口腔健康中心', 'National University Centre for Oral Health', '🏥', 186, 6],
  ['淡马锡生命科学研究院', 'Temasek Life Sciences Laboratory', '🔬', 326, 6],
  ['国大企业孵化中心', 'NUS Enterprise Incubator', '💻', 313, 5],
  ['能源研究所', 'Energy Studies Institute', '🎓', 323, 5],
  ['亚欧基金会', 'Asia-Europe Foundation', '🏛', 364, 5],
];

(window.NUSX = window.NUSX || []).push({id:'nussci',
  claim(b){ return MINE.has(b.i); },
  build(api, claimed){
    const {M, GY, CTX, mixC, lerp, clamp, boxV, capV, capF, prism, lathe, cyl, seg, hipV, sarea, cen, inPoly, offsetPoly, frame, gRange, nrm2, floorsOf, F_AC, F_RS, pvRoof, greenRoof} = api;
    const W = M.w, PI = Math.PI, TAU = PI*2, HP = PI/2;
    const byI = new Map(claimed.map(b => [b.i, b]));
    // ---------- tiny helpers ----------
    let RS = 1; const rnd = () => (RS = (RS*16807) % 2147483647)/2147483647, seed = k => { RS = 1 + ((k*2654435761) >>> 0) % 2147483600; rnd(); rnd(); };
    const hp = (a, k) => Array.isArray(a) ? a[((k*2654435761) >>> 0) % a.length] : a;
    // edges of a ring with outward normals (hole rings: normals point into the courtyard)
    const EDG = (Q, hole) => { const n = Q.length, s = sarea(Q) > 0 ? 1 : -1, out = [];
      for (let i = 0; i < n; i++){ const a = Q[i], c = Q[(i + 1) % n], L = Math.hypot(c[0] - a[0], c[1] - a[1]); if (L < 0.05) continue;
        let nn = nrm2(a, c, s); if (hole) nn = [-nn[0], -nn[1]]; out.push({i, a, c, L, ux:(c[0] - a[0])/L, uz:(c[1] - a[1])/L, nn, ga:GY(a[0], a[1]), gc:GY(c[0], c[1])}); }
      // run = length of the chain of near-collinear edges an edge belongs to (curved facades are one run, not many short walls)
      const m = out.length, br = k => { const p = out[k], q = out[(k + 1) % m]; return p.ux*q.ux + p.uz*q.uz < 0.68; };
      for (let k = 0; k < m; k++){ let r = out[k].L; for (let j = k; j < k + m - 1 && !br(j % m); j++) r += out[(j + 1) % m].L; for (let j = k; j > k - m + 1 && !br((j - 1 + m) % m); j--) r += out[(j - 1 + m) % m].L; out[k].run = Math.min(r, 1e4); out[k].cont = r > out[k].L*1.05; }
      return out; };
    const EP = (e, t, off) => [e.a[0] + e.ux*t + e.nn[0]*off, e.a[1] + e.uz*t + e.nn[1]*off];
    const eq = (V, e, t0, t1, y0, y1, off) => { const A = EP(e, t0, off), B = EP(e, t1, off); V.q([A[0], y0, A[1]], [B[0], y0, B[1]], [B[0], y1, B[1]], [A[0], y1, A[1]]); };
    // a vertical fin standing off the facade (front + both sides)
    const efin = (V, e, t, w, d, y0, y1, off0) => { off0 = off0 || 0; const A0 = EP(e, t - w/2, off0), A1 = EP(e, t - w/2, off0 + d), B0 = EP(e, t + w/2, off0), B1 = EP(e, t + w/2, off0 + d);
      V.q([A1[0], y0, A1[1]], [B1[0], y0, B1[1]], [B1[0], y1, B1[1]], [A1[0], y1, A1[1]]); V.q([A0[0], y0, A0[1]], [A1[0], y0, A1[1]], [A1[0], y1, A1[1]], [A0[0], y1, A0[1]]); V.q([B1[0], y0, B1[1]], [B0[0], y0, B0[1]], [B0[0], y1, B0[1]], [B1[0], y1, B1[1]]); };
    // a horizontal blade along part of an edge (top, front, underside)
    const eblade = (V, e, t0, t1, y, th, d, off0) => { off0 = off0 || 0; const A0 = EP(e, t0, off0), B0 = EP(e, t1, off0), A1 = EP(e, t0, off0 + d), B1 = EP(e, t1, off0 + d);
      V.q([A0[0], y + th, A0[1]], [B0[0], y + th, B0[1]], [B1[0], y + th, B1[1]], [A1[0], y + th, A1[1]]); V.q([A1[0], y, A1[1]], [B1[0], y, B1[1]], [B1[0], y + th, B1[1]], [A1[0], y + th, A1[1]]); V.q([A0[0], y, A0[1]], [B0[0], y, B0[1]], [B1[0], y, B1[1]], [A1[0], y, A1[1]]); };
    // a continuous blade round a whole ring (mitred at the corners)
    const ringBlade = (V, Q, hole, y, th, d) => { const O = offsetPoly(Q, hole ? -d : d), n = Q.length;
      for (let i = 0; i < n; i++){ const a = Q[i], c = Q[(i + 1) % n], A = O[i], C = O[(i + 1) % n];
        V.q([a[0], y + th, a[1]], [c[0], y + th, c[1]], [C[0], y + th, C[1]], [A[0], y + th, A[1]]); V.q([A[0], y, A[1]], [C[0], y, C[1]], [C[0], y + th, C[1]], [A[0], y + th, A[1]]); V.q([a[0], y, a[1]], [c[0], y, c[1]], [C[0], y, C[1]], [A[0], y, A[1]]); } };
    const walls = (V, Q, y0, y1) => { const n = Q.length; for (let i = 0; i < n; i++){ const a = Q[i], c = Q[(i + 1) % n]; V.q([a[0], y0, a[1]], [c[0], y0, c[1]], [c[0], y1, c[1]], [a[0], y1, a[1]]); } };
    const lamp = (x, y, z, rgb) => CTX.lamp(x, y, z, rgb || [255, 222, 170]);
    // keep the part of a polygon where a*x + c*z <= d (Sutherland-Hodgman against one half-plane)
    const clipHP = (P, a, c, d) => { const out = []; for (let i = 0; i < P.length; i++){ const p = P[i], q = P[(i + 1) % P.length], fp = a*p[0] + c*p[1] - d, fq = a*q[0] + c*q[1] - d; if (fp <= 0) out.push(p);
      if ((fp < 0) !== (fq < 0) && fp !== fq){ const t = fp/(fp - fq); out.push([p[0] + (q[0] - p[0])*t, p[1] + (q[1] - p[1])*t]); } } return out; };

    // ---------- the facade: wall, window band + sunshade ledge per floor, column fins, plinth, lobby glazing ----------
    const fac = (Q, hole, lo, top, o) => {
      const F = o.F || F_AC, Vb = o.Vb || M.wb, par = o.par === undefined ? 1.0 : o.par, fl = o.fl || floorsOf(lo + (o.gf || 0), top, F);
      const E = EDG(Q, hole), O = o.ld ? offsetPoly(Q, hole ? -o.ld : o.ld) : null, n = Q.length;
      for (const e of E){
        const gmin = Math.min(e.ga, e.gc), gmax = Math.max(e.ga, e.gc);
        W.c(o.wall); W.q([e.a[0], lo - 1.6, e.a[1]], [e.c[0], lo - 1.6, e.c[1]], [e.c[0], top + par, e.c[1]], [e.a[0], top + par, e.a[1]]);
        if (o.cope && e.L > 1){ W.c(o.cope); eq(W, e, 0, e.L, top + par - 0.45, top + par, 0.08); }
        if (o.plinth && e.L > 1.5){ W.c(o.plinth); const A = EP(e, 0, 0.05), B = EP(e, e.L, 0.05); W.q([A[0], e.ga - 0.3, A[1]], [B[0], e.gc - 0.3, B[1]], [B[0], e.gc + o.plH, B[1]], [A[0], e.ga + o.plH, A[1]]); }
        const solid = o.blank || (o.endBlank && e.run < o.endBlank);
        if (!o.blank){
        // solid end walls (stair / service cores) with a narrow slit window up the middle
        if (solid){ if (e.L > 3){ Vb.c(o.band); const y0 = (fl[0] || lo) + F*o.a; eq(Vb, e, e.L/2 - 0.6, e.L/2 + 0.6, Math.max(y0, gmin + 0.4), top - 0.6, 0.06); W.c(o.ledge); eq(W, e, e.L/2 - 0.9, e.L/2 + 0.9, top - 0.6, top - 0.3, 0.12); } }
        else { if (e.L > 2.4 || e.cont){ const p0 = e.cont ? 0 : Math.min(o.pier || 0.7, e.L*0.12); Vb.c(o.band);
          for (const y of fl){ const y0 = y + F*o.a, y1 = y + F*o.b; if (y1 < gmin + 0.4) continue; eq(Vb, e, p0, e.L - p0, y0, y1, 0.06); }
          // window mullions inside the bands
          if (o.mull && e.L > o.mull*2){ const nm = Math.round((e.L - 2*p0)/o.mull); W.c(o.mullC || '#6c757a'); for (const y of fl){ const y0 = y + F*o.a, y1 = y + F*o.b; if (y1 < gmin + 0.4) continue; for (let k = 1; k < nm; k++){ const t = p0 + k*(e.L - 2*p0)/nm; eq(W, e, t - 0.06, t + 0.06, y0, y1, 0.1); } } } }
        if (O && e.L > 1.2){ const A = O[e.i], B = O[(e.i + 1) % n], a = e.a, c = e.c, th = o.lt || 0.22; W.c(o.ledge);
          for (const y of fl){ const y0 = y + F*o.b, y1 = y0 + th; if (y1 < gmin + 0.6) continue;
            W.q([a[0], y1, a[1]], [c[0], y1, c[1]], [B[0], y1, B[1]], [A[0], y1, A[1]]); W.q([A[0], y0, A[1]], [B[0], y0, B[1]], [B[0], y1, B[1]], [A[0], y1, A[1]]); W.q([a[0], y0, a[1]], [c[0], y0, c[1]], [B[0], y0, B[1]], [A[0], y0, A[1]]); } }
        } }
        if (o.fins && e.L > o.fins*1.5 && (!solid || o.blank)){ const nb = Math.round(e.L/o.fins); W.c(o.fin || o.ledge); const y0 = Math.max(gmin - 0.3, (fl[0] || lo) + (o.finLo || 0)), y1 = top + par*(o.finTop === undefined ? 0.5 : o.finTop);
          for (let k = 1; k < nb; k++) efin(W, e, k*e.L/nb, o.finW || 0.3, o.finD || 0.6, y0, y1); }
        if (o.lobby && e.L > 9 && gmax - gmin < 1.2){ M.gl.c(o.lobbyC || '#6d8794'); eq(M.gl, e, 1.5, e.L - 1.5, gmax + 0.15, gmax + 3.2, 0.08); }
      }
      return fl;
    };
    // roof slab + parapet coping
    const roofCap = (P, H, top, par, o) => { W.c(o.rc, 0.03); capV(W, P, top, H && H.length ? H : undefined);
      W.c(o.copeTop || o.ledge || '#efede6'); for (const [Q, hole] of [[P, false], ...(H || []).map(h => [h, true])]){ const I = offsetPoly(Q, hole ? 0.35 : -0.35), n = Q.length;
        for (let i = 0; i < n; i++){ const a = Q[i], c = Q[(i + 1) % n], A = I[i], C = I[(i + 1) % n]; W.q([a[0], top + par, a[1]], [c[0], top + par, c[1]], [C[0], top + par, C[1]], [A[0], top + par, A[1]]); } } };
    // rooftop: lift / stair overruns, air-handling units with louvres, lab fume stacks, green or PV roof
    const PLG = ['#aeb0ad', '#a2a5a3', '#b9bab5', '#c4c5c0'];
    const plant = (P, y, o, k) => { seed(k); const f = frame(P), A = Math.abs(sarea(P)), F = f.F;
      const ins = (u, v, w, d) => { for (const [du, dv] of [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, 0]]){ const p = F(u + du*w/2, 0, v + dv*d/2); if (!inPoly(P, p[0], p[2])) return false; } return true; };
      if (o.pv) pvRoof(P, y, 0.7); else if (o.green) greenRoof(P, y);
      if (o.cores !== false && f.L > 26) for (const s of [-1, 1]){ const u = s*(f.L/2 - 7); if (!ins(u, 0, 6, 7)) continue; const p = F(u, 0, 0); W.c(o.wall); boxV(W, 6, 3.6, 7, p[0], y, p[2], f.ry); W.c(o.rc); boxV(W, 6.6, 0.3, 7.6, p[0], y + 3.6, p[2], f.ry); }
      const nA = clamp(Math.round(A/(o.pd || 420)), 1, o.pmax || 8); let made = 0;
      for (let t = 0; t < nA*5 && made < nA; t++){ const w = 3.5 + rnd()*4.5, d = 2.4 + rnd()*2.2, u = (rnd() - 0.5)*Math.max(1, f.L - w - 6), v = (rnd() - 0.5)*Math.max(1, f.W - d - 6); if (!ins(u, v, w + 1, d + 1)) continue;
        const p = F(u, 0, v), hh = 1.8 + rnd()*1.0; W.c(PLG[(k + t) % 4], 0.03); boxV(W, w, hh, d, p[0], y, p[2], f.ry); W.c('#6a7175'); const q = F(u, 0, v + d/2 + 0.03); boxV(W, w*0.82, hh*0.45, 0.05, q[0], y + hh*0.3, q[2], f.ry); made++; }
      if (o.stacks){ const m = 3 + (k % 4); for (let r = 0; r < (o.stacks > 1 ? 2 : 1); r++){ const u0 = (rnd() - 0.5)*f.L*0.45, v0 = (rnd() - 0.5)*f.W*0.3; W.c('#d3d5d2');
        for (let j = 0; j < m; j++){ const u = u0 + (j - m/2)*1.7; if (!ins(u, v0, 1.2, 1.2)) continue; const p = F(u, 0, v0); cyl(W, 0.4, 0.34, 5.2 + (j % 2)*1.4, p[0], y, p[2], 6); } } } };
    // a lit entrance: canopy slab on two posts, warm glazing behind, on the longest level edge
    const entrance = (P, col, ce) => { const E = EDG(P, false); let best = null; for (const e of E) if (e.L > 10 && Math.abs(e.ga - e.gc) < 1.5 && (!best || e.L > best.L)) best = e; if (!best) return;
      const e = best, t = e.L*(ce || 0.5), g0 = Math.max(e.ga, e.gc), w = Math.min(9, e.L*0.4);
      W.c(col || '#f0eee8'); eblade(W, e, t - w/2, t + w/2, g0 + 3.7, 0.35, 3.4, 0);
      W.c('#c3c7c8'); for (const s of [-1, 1]){ const p = EP(e, t + s*(w/2 - 0.4), 3.1), gp = GY(p[0], p[1]); boxV(W, 0.28, g0 + 3.75 - gp + 0.5, 0.28, p[0], gp - 0.5, p[1]); }
      M.warm.c('#fff'); eq(M.warm, e, t - w/2 + 0.6, t + w/2 - 0.6, g0 + 0.2, g0 + 3.4, 0.1); boxV(M.lamp, w - 1.5, 0.06, 0.3, EP(e, t, 1.7)[0], g0 + 3.66, EP(e, t, 1.7)[1], Math.atan2(-e.uz, e.ux));
      const p = EP(e, t, 1.7); lamp(p[0], g0 + 3.2, p[1]); return e; };

    // ---------- palettes ----------
    const PAL = {
      kr:  {wall:['#e4ddce', '#ddd6c6', '#e7e2d6', '#d9d2c2', '#e1dbcd'], band:['#3f4d57', '#46545e', '#3b4952', '#44525c'], ledge:'#f2efe7', rc:['#a3bccb', '#9ab3c3', '#b0c3ce', '#c3c6c2', '#a9bfca'], plinth:'#8f5d47'},
      nw:  {wall:['#eef0ee', '#e9ecea', '#f3f3f0', '#e6e9e8'], band:['#4a6070', '#3f5868', '#526a7a', '#475e6e'], ledge:'#dfe2e2', fin:['#c9ced1', '#d4d8da', '#bfc5c9'], rc:['#c8cbca', '#bec2c1']},
      hos: {wall:['#f2f1eb', '#eeede6', '#f4f3ee', '#ebeae3'], band:['#4b6b78', '#466573', '#527582', '#4e6f7c'], ledge:'#e6e6e0', rc:['#bcbfbc', '#b0b4b2', '#c4c6c2']},
    };
    // generic detailed block on a footprint: the facade on every ring, roof cap, rooftop kit, a lit entrance
    const blk = (b, h, op, pk, ent) => { const P = b.P, H = b.H || [], [lo, hi] = gRange(P); let top = lo + (h || b.h); if (top < hi + 2.5) top = hi + 2.5; b.lo = lo; b.top = top;
      fac(P, false, lo, top, op); for (const q of H) fac(q, true, lo, top, op);
      roofCap(P, H, top, op.par === undefined ? 1 : op.par, op); if (pk) plant(P, top + 0.05, Object.assign({wall:op.wall, rc:op.rc}, pk), b.i);
      if (ent !== false && b.area > 350) entrance(P, op.ledge); return b; };
    // Kent Ridge 1970s-80s block
    const kr = (b, c) => { const pl = PAL.kr, k = b.i;
      const op = {wall:c.wall || hp(pl.wall, k), band:hp(pl.band, k + 1), ledge:pl.ledge, fin:pl.ledge, ld:1.05, a:0.25, b:0.83, lt:0.26, fins:c.fins === undefined ? 3.9 : c.fins, finW:0.4, finD:0.8, finLo:0.4,
        plinth:pl.plinth, plH:1.3, lobby:b.area > 400, lobbyC:'#5b7482', cope:'#f4f1ea', rc:c.rc || hp(pl.rc, k + 2), par:1.1, endBlank:c.endBlank === undefined ? 13 : c.endBlank, mull:1.95, mullC:'#5f686d'};
      return blk(b, c.h, op, {stacks:c.lab ? 1 : 0, pd:360}); };
    // 2000s block: white, aluminium fins, blue-grey glass bands, green / PV roof
    const nw = (b, c) => { const pl = PAL.nw, k = b.i, res = c.res;
      const op = {wall:c.wall || hp(pl.wall, k), band:c.band || hp(pl.band, k + 1), ledge:pl.ledge, fin:hp(pl.fin, k), ld:0.55, a:res ? 0.14 : 0.13, b:res ? 0.88 : 0.9, lt:0.18, fins:c.plain ? 0 : 2.6, finW:0.14, finD:0.55,
        plinth:'#7a7c7d', plH:0.7, lobby:true, lobbyC:'#66808d', cope:'#f5f5f2', rc:hp(pl.rc, k), par:1.0, F:res ? F_RS : F_AC, Vb:res ? M.wr : M.wb};
      return blk(b, c.h, op, {green:c.green, pv:c.pv, stacks:c.lab ? 1 : 0, pd:420}); };
    // NUH: white blocks, blue-green ribbon windows between deep white spandrels, slim sunshades
    const hos = (b, c) => { const pl = PAL.hos, k = b.i;
      const op = {wall:hp(pl.wall, k), band:hp(pl.band, k + 1), ledge:pl.ledge, fin:'#e9e9e4', ld:0.6, a:0.3, b:0.78, lt:0.16, fins:c.svc ? 0 : 7.6, finW:0.5, finD:0.45, finLo:0,
        plinth:'#9d9a92', plH:0.9, lobby:true, lobbyC:'#6e8b95', cope:'#f6f5f1', rc:hp(pl.rc, k), par:1.2, mull:c.svc ? 0 : 1.9, mullC:'#dfe1de'};
      return blk(b, c.h, op, {pd:c.svc ? 260 : 330, pmax:12}); };

    // ---------- lecture theatres: windowless raked halls, brick plinth, vertical ribs, a glazed foyer, the roof rising to the back ----------
    const ltB = (b, c) => { const P = b.P, [lo, hi] = gRange(P), k = b.i, f = frame(P); let top = lo + (c.h || b.h); if (top < hi + 2.5) top = hi + 2.5; b.lo = lo; b.top = top;
      const wall = hp(['#dcd3c2', '#e1d9ca', '#d6cdbb'], k), rise = Math.min(4.5, f.L*0.12);
      const op = {wall, ledge:'#efebe2', fin:'#ebe6db', blank:true, fins:3.2, finW:0.5, finD:0.45, plinth:'#8f5d47', plH:1.5, par:0, cope:'#efebe2'};
      fac(P, false, lo, top, op);
      for (const e of EDG(P, false)) if (e.L > 14){ M.wb.c('#3f4c55'); eq(M.wb, e, 1.2, e.L - 1.2, top - 2.6, top - 1.0, 0.06); W.c('#efebe2'); eblade(W, e, 0.6, e.L - 0.6, top - 1.0, 0.25, 0.7, 0); }
      // the raked roof: slopes up along the long axis, a parapet strip on the low side
      const ry = f.ry, cs = Math.cos(ry), sn = Math.sin(ry), uOf = (x, z) => (x - f.cx)*cs - (z - f.cz)*sn, yR = (x, z) => top + rise*clamp((uOf(x, z) + f.L/2)/f.L, 0, 1);
      W.c(wall); for (const e of EDG(P, false)) W.q([e.a[0], top, e.a[1]], [e.c[0], top, e.c[1]], [e.c[0], yR(e.c[0], e.c[1]) + 0.6, e.c[1]], [e.a[0], yR(e.a[0], e.a[1]) + 0.6, e.a[1]]);
      W.c(hp(['#a1b9c8', '#a9aeac', '#b4c4cc'], k), 0.03); capF(W, P, yR);
      // foyer: glazing + canopy on the longest level edge
      const e = entrance(P, '#efebe2', 0.5); if (e){ M.gl.c('#617b88'); eq(M.gl, e, 0.8, e.L - 0.8, Math.max(e.ga, e.gc) + 0.2, Math.max(e.ga, e.gc) + 3.5, 0.07); }
      return b; };
    // ---------- two-storey camp blocks with red hipped roofs (Heng Mui Keng Terrace) ----------
    const hipB = (b, c) => { api.building(b, {st:'hall', h:c.h || Math.max(7.5, b.h)}); return b; };

    // ---------- glass research towers ----------
    // glass skin (lit), white floor spandrels or blades, mullions, deep vertical fins, a louvred plant crown
    const gtower = (P, lo, y0, top, o) => {
      const E = EDG(P, false), fl = floorsOf(y0, top - (o.crown || 0), F_AC);
      for (const e of E){ M.gl.c(o.glass); M.gl.q([e.a[0], y0 - 0.2, e.a[1]], [e.c[0], y0 - 0.2, e.c[1]], [e.c[0], top, e.c[1]], [e.a[0], top, e.a[1]]);
        W.c(o.span); for (const y of fl){ if (o.blade) eblade(W, e, 0, e.L, y - 0.12, 0.3, o.blade, 0); else eq(W, e, 0, e.L, y - (o.sh || 0.45), y + (o.sh || 0.45), 0.06); }
        if (o.mull && e.L > o.mull*1.5){ const nm = Math.round(e.L/o.mull); W.c(o.mullC || o.span); for (let k = 1; k < nm; k++){ const t = k*e.L/nm; eq(W, e, t - 0.07, t + 0.07, y0, top - (o.crown || 0), 0.1); } }
        if (o.fin && e.L > o.fin*1.4 && (!o.finOn || o.finOn(e))){ const nf = Math.round(e.L/o.fin); W.c(o.finC || o.span); for (let k = 1; k < nf; k++) efin(W, e, k*e.L/nf, o.finW || 0.3, o.finD || 0.8, y0 + (o.finLo || 0), top + (o.finUp || 0)); }
        // the plant crown: white louvre screen with dark gaps
        if (o.crown){ const yc = top - o.crown; W.c(o.span); eq(W, e, 0, e.L, yc, top + 1.2, 0.12); W.c('#7f8a8f'); for (let y = yc + 0.6; y < top + 0.8; y += 0.9) eq(W, e, 0.4, e.L - 0.4, y, y + 0.35, 0.16);
          if (e.L > 3){ M.cool.c('#fff'); eq(M.cool, e, 0.2, e.L - 0.2, yc - 0.32, yc - 0.08, 0.2); } }
      }
      return fl; };

    // ---------- the signature buildings ----------
    const SIG = {
      // S9 Wet Science Building (2019): sixteen storeys of glass behind white floor blades, white fins, louvred plant crown, wet-lab exhausts
      237(b){ const P = b.P, [lo, hi] = gRange(P), top = lo + 66; b.lo = lo; b.top = top; const pod = lo + 8;
        // podium: stone base, recessed lobby glazing, white piers
        for (const e of EDG(P, false)){ W.c('#d9d7d0'); W.q([e.a[0], lo - 1.6, e.a[1]], [e.c[0], lo - 1.6, e.c[1]], [e.c[0], pod, e.c[1]], [e.a[0], pod, e.a[1]]);
          if (e.L > 6){ M.gl.c('#5d7c8a'); eq(M.gl, e, 0.8, e.L - 0.8, Math.max(e.ga, e.gc) + 0.15, pod - 0.6, 0.06); W.c('#f1f1ee'); const np = Math.round(e.L/7.2); for (let k = 1; k < np; k++) efin(W, e, k*e.L/np, 0.6, 0.5, lo - 0.5, pod); } }
        ringBlade(W, P, false, pod - 0.2, 0.5, 2.2);
        gtower(P, lo, pod, top, {glass:'#5c8091', span:'#f3f4f2', blade:1.0, mull:1.8, mullC:'#dfe3e4', fin:5.4, finC:'#f6f6f3', finW:0.35, finD:1.05, crown:7, finUp:1.2});
        roofCap(P, [], top + 1.2, 0.0, {rc:'#c3c6c4', ledge:'#eceeed'}); plant(offsetPoly(P, -2), top + 1.25, {wall:'#e8eae9', rc:'#c3c6c4', stacks:2, pd:300, cores:false}, b.i);
        W.c('#d8dad8'); for (const [x, z] of [[452, 285], [440, 278], [430, 290]]) cyl(W, 0.55, 0.5, 7.5, x, top + 1.2, z, 8);
        entrance(P, '#f1f1ee'); return b; },
      // MD1 Tahir Foundation Building: glass slab behind a dense screen of slim white vertical fins, white floor bands, crown frame
      350(b){ const P = b.P, [lo, hi] = gRange(P), top = lo + 74; b.lo = lo; b.top = top; const pod = lo + 8;
        for (const e of EDG(P, false)){ W.c('#dcdad3'); W.q([e.a[0], lo - 1.6, e.a[1]], [e.c[0], lo - 1.6, e.c[1]], [e.c[0], pod, e.c[1]], [e.a[0], pod, e.a[1]]); if (e.L > 6){ M.gl.c('#5a7887'); eq(M.gl, e, 0.6, e.L - 0.6, Math.max(e.ga, e.gc) + 0.15, pod - 0.5, 0.06); } }
        ringBlade(W, P, false, pod - 0.1, 0.45, 1.6);
        gtower(P, lo, pod, top, {glass:'#587a8b', span:'#f2f2ef', sh:0.38, fin:1.4, finC:'#f4f4f1', finW:0.18, finD:0.75, finUp:2.0, crown:5});
        roofCap(P, [], top + 1.2, 0, {rc:'#c4c7c6', ledge:'#eeeeeb'}); plant(offsetPoly(P, -2.5), top + 1.25, {wall:'#e6e8e7', rc:'#c4c7c6', stacks:1, pd:350, cores:false}, b.i);
        entrance(P, '#f2f2ef'); return b; },
      // MD6 Centre for Translational Medicine: blue glass tower ringed by white spandrel bands, white blades on the corners, crown frame
      231(b){ const P = b.P, [lo, hi] = gRange(P), top = lo + 62; b.lo = lo; b.top = top; const pod = lo + 8;
        for (const e of EDG(P, false)){ W.c('#e3e3de'); W.q([e.a[0], lo - 1.6, e.a[1]], [e.c[0], lo - 1.6, e.c[1]], [e.c[0], pod, e.c[1]], [e.a[0], pod, e.a[1]]); if (e.L > 6){ M.gl.c('#57798b'); eq(M.gl, e, 0.6, e.L - 0.6, Math.max(e.ga, e.gc) + 0.15, pod - 0.5, 0.06); } }
        ringBlade(W, P, false, pod - 0.1, 0.45, 1.8);
        gtower(P, lo, pod, top, {glass:'#4f7489', span:'#f1f2f0', sh:0.55, mull:1.6, mullC:'#d7dcde', fin:9, finC:'#f3f3f0', finW:0.5, finD:1.2, finUp:3.5, crown:4});
        for (const y of [top - 4, top + 1.0]) ringBlade(W, P, false, y, 0.45, 1.2);
        roofCap(P, [], top + 1.2, 0, {rc:'#c3c6c5', ledge:'#efefec'}); plant(offsetPoly(P, -2.5), top + 1.25, {wall:'#e8e9e8', rc:'#c3c6c5', stacks:1, pd:320, cores:false}, b.i);
        entrance(P, '#f1f2f0'); return b; },
      // University Hall: the two administration wings (cream frames, deep ledges, skylit atria) and the round stair tower at the joint
      189(b){ return SIG.uh(b, 0); }, 214(b){ return SIG.uh(b, 1); },
      uh(b, w){ const pl = PAL.kr; const op = {wall:'#e8e3d6', band:'#3e4c56', ledge:'#f4f1ea', fin:'#f4f1ea', ld:1.3, a:0.25, b:0.82, lt:0.3, fins:4.2, finW:0.45, finD:1.0, finLo:0.3, plinth:'#8f5d47', plH:1.4, lobby:true, lobbyC:'#5b7482', cope:'#f4f1ea', rc:'#aec3cf', par:1.2};
        blk(b, 17.7, op, {pd:520, cores:false});
        // the atrium skylight: a low glazed pyramid over the middle of each wing
        const f = frame(b.P), c = [f.cx, f.cz]; M.gl.c('#86a6b6'); lathe(M.gl, [[f.W*0.24, 0], [0, 4.2]], c[0], b.top + 0.1, c[1], 4, PI/4 - f.ry); W.c('#dfe3e3'); lathe(W, [[f.W*0.26, 0], [f.W*0.26, 0.5]], c[0], b.top, c[1], 4, PI/4 - f.ry);
        if (w === 0){ // the round tower where the wings meet (glazed slits, a shallow cap)
          const x = 176, z = 146, g0 = GY(x, z), tt = b.top + 6; W.c('#ece8de'); cyl(W, 7.5, 7.5, tt - g0 + 1.5, x, g0 - 1.5, z, 24);
          M.wb.c('#41505b'); for (const y of floorsOf(g0, tt, F_AC)) cyl(M.wb, 7.56, 7.56, F_AC*0.5, x, y + F_AC*0.28, z, 24);
          W.c('#f4f1ea'); for (const y of floorsOf(g0, tt, F_AC)) cyl(W, 8.1, 8.1, 0.25, x, y + F_AC*0.8, z, 24);
          W.c('#9dbccd'); lathe(W, [[8.6, 0], [6.5, 1.6], [0, 3.6]], x, tt, z, 24); M.cool.c('#fff'); cyl(M.cool, 6.6, 6.6, 0.9, x, tt + 0.3, z, 24); }
        return b; },
      // Medicine+Science Library: a glazed reading-room base, white upper floors with ledges and fins, the curved east end in glass
      199(b){ const P = b.P, [lo, hi] = gRange(P), top = lo + 22; b.lo = lo; b.top = top;
        const op = {wall:'#eceeec', band:'#4a6272', ledge:'#e2e5e5', fin:'#cfd4d6', ld:1.2, a:0.15, b:0.86, lt:0.25, fins:2.8, finW:0.16, finD:0.7, plinth:'#77797a', plH:0.6, cope:'#f4f5f3', rc:'#c6cac9', par:1.0, gf:4};
        fac(P, false, lo, top, op); const E = EDG(P, false);
        for (const e of E){ if (e.L > 3){ M.gl.c('#617f8e'); eq(M.gl, e, 0.4, e.L - 0.4, Math.max(e.ga, e.gc) + 0.15, lo + 4.6, 0.1); } }
        // the curved end: full-height glass between fins (vertices from the arc at the east)
        for (const e of E){ const mx = (e.a[0] + e.c[0])/2; if (mx < 655 || e.L > 12) continue; M.gl.c('#5f7f90'); eq(M.gl, e, 0, e.L, lo + 4.6, top - 0.3, 0.14); W.c('#e9ecec'); efin(W, e, 0.1, 0.3, 0.9, lo, top + 1); }
        ringBlade(W, P, false, lo + 4.6, 0.4, 2.0);
        roofCap(P, [], top, 1.0, op); plant(P, top + 0.05, {wall:'#eceeec', rc:'#c6cac9', pd:600, green:1}, b.i);
        const c = cen(P); M.gl.c('#8eb0c0'); lathe(M.gl, [[7, 0], [0, 3.2]], 640, top + 0.1, 177, 4, 0.36); return b; },
      // the Frontier canteen: an open food hall under a broad hipped metal roof on slim columns
      213(b){ const P = b.P, [lo, hi] = gRange(P), top = lo + 6.5; b.lo = lo; b.top = top; const f = frame(P);
        for (const e of EDG(P, false)){ W.c('#e2dbcc'); W.q([e.a[0], lo - 1.6, e.a[1]], [e.c[0], lo - 1.6, e.c[1]], [e.c[0], lo + 1.0, e.c[1]], [e.a[0], lo + 1.0, e.a[1]]);
          if (e.L > 3){ M.warm.c('#fff'); eq(M.warm, e, 0.6, e.L - 0.6, lo + 1.0, top - 1.2, 0.02); W.c('#e8e6df'); eq(W, e, 0, e.L, top - 1.2, top, 0); W.c('#c9ccce'); const np = Math.max(1, Math.round(e.L/6)); for (let k = 0; k <= np; k++){ const p = EP(e, k*e.L/np, 0.2); boxV(W, 0.35, top - lo + 1.5, 0.35, p[0], lo - 1.5, p[1]); } } }
        W.c('#dcdcd6'); capV(W, P, top); const E2 = offsetPoly(P, 2.4); W.c('#8fb0c4', 0.03);
        // roof: eave ring sloping up to an inset ring, then a low ridge cap (hipped "mansard" over the irregular plan)
        const I = offsetPoly(P, -9), n = P.length; for (let i = 0; i < n; i++){ const a = E2[i], c = E2[(i + 1) % n], C = I[(i + 1) % n], A = I[i]; W.q([a[0], top, a[1]], [c[0], top, c[1]], [C[0], top + 3.2, C[1]], [A[0], top + 3.2, A[1]]); }
        if (Math.sign(sarea(I)) === Math.sign(sarea(P))) capV(W, I, top + 3.2);
        W.c('#e6e6e0'); for (let i = 0; i < n; i++){ const a = E2[i], c = E2[(i + 1) % n]; W.q([a[0], top - 0.35, a[1]], [c[0], top - 0.35, c[1]], [c[0], top + 0.02, c[1]], [a[0], top + 0.02, a[1]]); }
        for (let k = 0; k < 4; k++){ const p = f.F((k - 1.5)*f.L/5, 0, 0); lamp(p[0], top - 0.8, p[2]); } return b; },
      // Centre for Life Sciences: white lab wings with aluminium fins and blue glass, the glazed atrium in the crook, PV roof
      250(b){ const pl = PAL.nw; const op = {wall:'#eef0ef', band:'#3f5d70', ledge:'#dfe2e2', fin:'#c6ccd0', ld:0.7, a:0.12, b:0.9, lt:0.2, fins:2.4, finW:0.14, finD:0.65, plinth:'#77797a', plH:0.7, lobby:true, lobbyC:'#66808d', cope:'#f5f5f2', rc:'#c3c7c6', par:1.0};
        blk(b, 31, op, {pv:1, stacks:2, pd:380});
        // the atrium: a glass drum at the curved north corner + a glazed roof light along the spine
        const t = b.top; M.gl.c('#5e8496'); const ax = 526, az = 410; cyl(M.gl, 6.5, 6.5, t + 2.5 - GY(ax, az) + 1, ax, GY(ax, az) - 1, az, 16); W.c('#eef0ef'); cyl(W, 7.2, 7.2, 0.6, ax, t + 2.5, az, 16, true);
        W.c('#dde1e1'); for (let k = 0; k < 6; k++){ const a = k/6*TAU, px = ax + Math.cos(a)*6.6, pz = az + Math.sin(a)*6.6; seg(W, [px, GY(px, pz) - 0.5, pz], [px, t + 2.5, pz], 0.15, 4); }
        M.gl.c('#86a8b8'); const f = frame(b.P); for (let k = -2; k <= 2; k++){ const p = f.F(k*f.L/6, 0, 0); if (inPoly(b.P, p[0], p[2])) lathe(M.gl, [[3.4, 0], [0, 2.2]], p[0], t + 0.1, p[2], 4, PI/4 - f.ry); }
        return b; },
      // NUH Medical Centre (2013): clinic podium and a glass tower with white fins and floor bands
      372(b){ const P = b.P, [lo, hi] = gRange(P), pl = PAL.hos, podT = lo + 22, top = lo + 67.2; b.lo = lo; b.top = top;
        const op = {wall:'#f1f1ec', band:'#4b6d7a', ledge:'#e6e6e0', fin:'#ebebe6', ld:0.8, a:0.28, b:0.8, lt:0.2, fins:7.5, finW:0.5, finD:0.5, plinth:'#9d9a92', plH:0.9, lobby:true, lobbyC:'#6e8b95', cope:'#f6f5f1', rc:'#bfc2bf', par:1.2};
        fac(P, false, lo, lo + 12.8, Object.assign({}, op, {Vb:W, band:'#2f373b', a:0.32, b:0.86, ld:0.35, lobby:false, par:0})); fac(P, false, lo + 12.8, podT, Object.assign({}, op, {plinth:null, lobby:false}));
        roofCap(P, [], podT, 1.2, op); M.veg.c('#6f9356', 0.1); capV(M.veg, offsetPoly(P, -3), podT + 0.15);
        const T = offsetPoly(P, -9); gtower(T, lo, podT, top, {glass:'#5c8296', span:'#eff1f0', sh:0.42, mull:1.5, mullC:'#dfe4e6', fin:4.8, finC:'#f3f4f2', finW:0.3, finD:0.9, crown:5, finUp:2.0});
        roofCap(T, [], top + 1.2, 0, {rc:'#c0c3c1', ledge:'#eeeeeb'}); plant(offsetPoly(T, -2), top + 1.25, {wall:'#e8e9e8', rc:'#c0c3c1', pd:300, cores:false}, b.i);
        entrance(P, '#f1f1ec'); return b; },
      // NUHS Tower Block: the elongated-octagon ward tower, white with long ribbon windows, glazed chamfers, a set-back plant crown
      266(b){ const op = {wall:'#f2f1ec', band:'#4c6e7c', ledge:'#e7e7e1', fin:'#ececE7', ld:0.75, a:0.3, b:0.78, lt:0.18, fins:0, plinth:'#9d9a92', plH:0.9, lobby:true, lobbyC:'#6e8b95', cope:'#f6f5f1', rc:'#bdc0bd', par:1.4};
        blk(b, 58, op, null); const t = b.top, I = offsetPoly(b.P, -4); W.c('#ecebe6'); walls(W, I, t, t + 5.5); W.c('#7c878c'); for (let y = t + 0.8; y < t + 5; y += 1.0) walls(W, offsetPoly(b.P, -3.92), y, y + 0.4);
        W.c('#c2c5c2'); capV(W, I, t + 5.5); plant(offsetPoly(I, -2), t + 5.55, {wall:'#ecebe6', rc:'#c2c5c2', pd:260, cores:false}, b.i);
        // glazed chamfered ends
        for (const e of EDG(b.P, false)) if (e.L < 25 && Math.abs(e.ux) > 0.2 && Math.abs(e.uz) > 0.2){ M.gl.c('#5f8292'); eq(M.gl, e, 0.8, e.L - 0.8, b.lo + 8, t - 1, 0.1); }
        return b; },
      // National University Centre for Oral Health (2019, RDC Architects): two white towers over a two-storey podium, joined by an
      // open atrium with link bridges; horizontal sunshades on the north and south faces, solid circulation cores on the west,
      // the east tower stepping back into planted terraces along the curved road frontage
      186(b){ const P = b.P, [lo, hi] = gRange(P), top = lo + 30.3, pod = lo + 9.6; b.lo = lo; b.top = top;
        const op = {wall:'#f1f2f0', band:'#4f6e7c', ledge:'#e4e7e7', fin:'#e8ebea', ld:0.5, a:0.14, b:0.88, lt:0.2, fins:0, plinth:'#7a7c7d', plH:0.7, lobby:true, lobbyC:'#6a8592', cope:'#f6f6f4', rc:'#c3c6c5', par:1.1};
        fac(P, false, lo, pod, Object.assign({}, op, {fins:3.6, finW:0.2, finD:0.5})); roofCap(P, [], pod, 1.1, op); M.veg.c('#6a924f', 0.1); capV(M.veg, offsetPoly(clipHP(P, 1, 0, 830), -2), pod + 0.15);
        const n = [0.812, -0.585], d0 = 0.812*812.3 - 0.585*236.3;
        const WT = clipHP(P, 1, 0, 812), ET = clipHP(clipHP(P, -1, 0, -826), n[0], n[1], d0 - 3), ET2 = clipHP(ET, n[0], n[1], d0 - 12);
        const tw = (Q, y0, y1) => { fac(Q, false, y0, y1, Object.assign({}, op, {lobby:false, plinth:null})); roofCap(Q, [], y1, 1.1, op);
          for (const e of EDG(Q, false)) if (Math.abs(e.nn[1]) > 0.6 && e.L > 4){ W.c('#f4f5f3'); for (const y of floorsOf(y0, y1, F_AC)) eblade(W, e, 0.3, e.L - 0.3, y + F_AC*0.88 + 0.22, 0.18, 1.2, 0); }
            else if (e.nn[0] > 0.3 && e.L > 4){ W.c('#e9ecec'); const nf = Math.round(e.L/1.6); for (let k = 1; k < nf; k++) efin(W, e, k*e.L/nf, 0.15, 0.7, y0, y1 + 0.6); } };
        tw(WT, pod - 0.2, top); tw(ET, pod - 0.2, lo + 21.4); tw(ET2, lo + 21.2, top);
        M.veg.c('#5f8c45', 0.12); const TR = offsetPoly(ET, -1.2); capV(M.veg, TR, lo + 21.4 + 1.25); greenRoof(WT, top); greenRoof(ET2, top);
        plant(offsetPoly(WT, -2), top + 0.05, {wall:'#eef0ef', rc:'#c3c6c5', pd:500, cores:false}, b.i);
        // the west circulation cores: solid white towers with slit windows
        for (const z of [248, 318]){ W.c('#e9ebea'); boxV(W, 7, top + 3 - lo + 1.6, 9, 787.5, lo - 1.6, z); M.wb.c('#41535e'); boxV(M.wb, 7.1, top - pod, 1.2, 787.5, pod, z); }
        // link bridges across the atrium and a pergola over it
        for (const [y, z] of [[lo + 13.8, 262], [lo + 21.8, 296], [lo + 17.8, 318]]){ W.c('#eef0ef'); boxV(W, 15, 0.6, 3.2, 819, y, z); M.gl.c('#6f8f9c'); boxV(M.gl, 15, 2.6, 3.0, 819, y + 0.6, z); W.c('#e2e5e5'); boxV(W, 15, 0.3, 3.4, 819, y + 3.2, z); }
        W.c('#e5e8e8'); for (let z = 238; z < 332; z += 2.4) boxV(W, 15, 0.35, 0.3, 819, top + 0.9, z); boxV(W, 0.4, 0.5, 96, 812.3, top + 0.8, 284); boxV(W, 0.4, 0.5, 96, 825.7, top + 0.8, 284);
        entrance(P, '#f1f2f0', 0.4); return b; },
      // NUH Main Building (1985): the long ward / clinic block with four south fingers round planted courtyards, closed by the
      // south bar (221); roof penthouses and skylights, the porte-cochere on the north side
      225(b){ hos(b, {pd:900}); const t = b.top + 0.05, f = frame(b.P);
        // roof membranes in slightly different greys over the structural bays
        for (const [x0, z0, x1, z1, c] of [[706, 367, 760, 412, '#c7cac7'], [770, 367, 846, 412, '#b5b9b7'], [651, 417, 700, 436, '#bfc3c0'], [710, 417, 760, 436, '#c9ccc9'], [770, 417, 818, 436, '#bbbfbc'], [826, 417, 893, 436, '#c4c7c4'], [650, 440, 664, 485, '#b9bdba'], [882, 442, 894, 486, '#c6c9c6']]){
          W.c(c); capV(W, [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], t + 0.04); }
        // plant penthouses along the spine and over the fingers
        W.c('#e9e8e2'); for (const [x, z, w, d] of [[735, 390, 46, 12], [812, 390, 46, 12], [676, 450, 10, 22], [857, 450, 10, 22]]){ boxV(W, w, 4.2, d, x, t, z); W.c('#7a868c'); for (let y = t + 0.8; y < t + 3.8; y += 1.0) boxV(W, w + 0.1, 0.4, d + 0.1, x, y, z); W.c('#c1c4c2'); boxV(W, w + 0.8, 0.3, d + 0.8, x, t + 4.2, z); W.c('#e9e8e2'); }
        M.gl.c('#87a9b9'); for (const [x, z] of [[718, 425], [772, 425], [830, 425], [688, 395], [868, 395]]) lathe(M.gl, [[4.5, 0], [0, 2.4]], x, t, z, 4, PI/4);
        // the porte-cochere: a deep white canopy on round columns over the drop-off, lit underneath
        const e = EDG(b.P, false).filter(e => e.nn[1] < -0.9).sort((p, q) => q.L - p.L)[0];
        if (e){ const tm = e.L*0.55, g0 = Math.max(e.ga, e.gc), w = 34; W.c('#f4f3ef'); eblade(W, e, tm - w/2, tm + w/2, g0 + 5.2, 0.7, 11, 0); W.c('#dcdcd6'); eq(W, e, tm - w/2, tm + w/2, g0 + 5.2, g0 + 5.9, 11);
          for (const s of [-1, -0.33, 0.33, 1]){ const p = EP(e, tm + s*(w/2 - 1.5), 9.5), gp = GY(p[0], p[1]); W.c('#e6e6e1'); cyl(W, 0.45, 0.45, g0 + 5.25 - gp + 0.6, p[0], gp - 0.6, p[1], 10); }
          M.warm.c('#fff'); eq(M.warm, e, tm - w/2 + 2, tm + w/2 - 2, g0 + 0.2, g0 + 4.6, 0.12); for (const s of [-1, 0, 1]){ const p = EP(e, tm + s*10, 6); boxV(M.lamp, 4, 0.08, 1.2, p[0], g0 + 5.1, p[1], Math.atan2(-e.uz, e.ux)); lamp(p[0], g0 + 4.6, p[1]); }
          api.occupyLine([EP(e, tm - w/2, 6), EP(e, tm + w/2, 6)], 6); }
        // the three planted courtyards between the fingers
        for (const C of [[[668.5, 441.5], [705.5, 441.5], [705.5, 464], [668.5, 464]], [[730, 440.3], [763, 440.3], [763, 464.3], [730, 440.3 + 24]], [[840, 441], [878, 441], [878, 465], [840, 465]]]){
          M.veg.c('#638f4c', 0.1); capF(M.veg, C, (x, z) => GY(x, z) + 0.12); W.c('#d6d1c4'); const c = cen(C); capF(W, [[c[0] - 12, c[1] - 1.2], [c[0] + 12, c[1] - 1.2], [c[0] + 12, c[1] + 1.2], [c[0] - 12, c[1] + 1.2]], (x, z) => GY(x, z) + 0.16);
          for (const [dx, dz] of [[-10, -6], [9, -6], [-9, 6], [10, 6], [0, -7]]) CTX.tree(c[0] + dx, c[1] + dz, 2.6, dx ? 'd' : 'palm'); api.occupy(C, 0); }
        return b; },
      // Temasek Life Sciences Laboratory (2002): white four-storey lab wings with aluminium fins and blue-grey glass, a glazed
      // lantern over the entrance hall at the elbow, lab exhausts and PV on the roofs (its research greenhouses stand alongside)
      326(b){ nw(b, {lab:1, h:16, pv:1}); const t = b.top, P = b.P;
        const ex = 168, ez = 470; if (inPoly(P, ex, ez)){ M.gl.c('#6d93a5'); boxV(M.gl, 12, 4.5, 12, ex, t - 0.5, ez, 0.33); W.c('#eef0ef'); boxV(W, 13, 0.5, 13, ex, t + 4.0, ez, 0.33); M.cool.c('#fff'); boxV(M.cool, 11, 0.12, 11, ex, t + 3.9, ez, 0.33); }
        return b; },
      // the hospital Service Block: plant floors behind louvres, cooling towers and a flue on the roof
      187(b){ const P = b.P, [lo, hi] = gRange(P), top = lo + 21.9; b.lo = lo; b.top = top;
        // three tall plant / support storeys: white walls, deep louvre bands, a glazed ground floor on the level sides
        fac(P, false, lo, top, {wall:'#eeede7', ledge:'#e2e2dc', fin:'#e6e6e0', blank:true, fins:7.2, finW:0.6, finD:0.5, plinth:'#9d9a92', plH:0.9, par:1.2, cope:'#f4f3ef', lobby:true, lobbyC:'#6e8b95'});
        for (const e of EDG(P, false)){ if (e.L < 4) continue; for (let k = 0; k < 3; k++){ const y = lo + 7.3*k + 2.6; if (y + 3 < Math.min(e.ga, e.gc)) continue; W.c('#5d676d'); eq(W, e, 0.8, e.L - 0.8, y - 0.2, y + 3.4, 0.08); W.c('#e3e3dd'); for (let j = 0; j < 6; j++) eq(W, e, 0.8, e.L - 0.8, y + j*0.55, y + j*0.55 + 0.28, 0.22); } }
        roofCap(P, [], top, 1.2, {rc:'#b6bab8', ledge:'#f4f3ef'}); const t = top + 0.05;
        W.c('#c9cdcf'); for (const [x, z] of [[740, 250], [752, 250], [740, 262], [752, 262], [740, 300], [752, 300]]){ boxV(W, 9, 4.2, 9, x + 1, t, z + 1); W.c('#59636a'); cyl(W, 3.2, 3.2, 1.3, x + 1, t + 4.2, z + 1, 10); W.c('#c9cdcf'); }
        W.c('#d4d6d4'); cyl(W, 1.1, 0.9, 16, 770, t, 300, 10); return b; },
    };

    // ---------- link bridges between the lab blocks (Science / Medicine): enclosed bridges on one or two upper floors ----------
    const BR = new Set([307, 304, 268, 291, 335, 297, 242, 204, 178, 203, 185, 183, 215, 175, 184, 174, 182, 245, 261, 252, 260, 377, 281, 350, 231, 212, 205, 209, 201, 208, 237, 225, 221, 356, 285, 341, 345, 299, 228, 372, 347, 287]);
    const EC = new Map(), edgesOf = b => { let r = EC.get(b.i); if (!r){ r = EDG(b.P, false).filter(e => e.L >= 7); EC.set(b.i, r); } return r; };
    const bridges = () => { const L = claimed.filter(b => BR.has(b.i) && b.top), out = [];
      for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++){ const A = L[i], B = L[j]; if (Math.hypot(A.c[0] - B.c[0], A.c[1] - B.c[1]) > 140) continue;
        let best = null; const EA = edgesOf(A), EB = edgesOf(B);
        for (const ea of EA){ if (ea.L < 7) continue; for (const eb of EB){ if (eb.L < 7) continue; if (Math.abs(ea.ux*eb.uz - ea.uz*eb.ux) > 0.2) continue;
          // gap along A's outward normal, overlap along A's edge
          const g1 = (eb.a[0] - ea.a[0])*ea.nn[0] + (eb.a[1] - ea.a[1])*ea.nn[1]; if (g1 < 2.5 || g1 > (A.st === 'hosp' && B.st === 'hosp' ? 21 : 16)) continue; if (ea.nn[0]*eb.nn[0] + ea.nn[1]*eb.nn[1] > -0.9) continue;
          const t1 = (eb.a[0] - ea.a[0])*ea.ux + (eb.a[1] - ea.a[1])*ea.uz, t2 = (eb.c[0] - ea.a[0])*ea.ux + (eb.c[1] - ea.a[1])*ea.uz, o0 = Math.max(2, Math.min(t1, t2)), o1 = Math.min(ea.L - 2, Math.max(t1, t2)); if (o1 - o0 < 5) continue;
          if (!best || g1 < best.g) best = {g:g1, ea, t:(o0 + o1)/2}; } }
        if (best) out.push([A, B, best]); }
      let n = 0;
      for (const [A, B, br] of out){ const e = br.ea, p0 = EP(e, br.t, -0.3), p1 = EP(e, br.t, br.g + 0.3), gmax = Math.max(GY(p0[0], p0[1]), GY(p1[0], p1[1]), GY((p0[0] + p1[0])/2, (p0[1] + p1[1])/2));
        const tt = Math.min(A.top, B.top) - 1.5, ry = Math.atan2(-(p1[1] - p0[1]), p1[0] - p0[0]), cx = (p0[0] + p1[0])/2, cz = (p0[1] + p1[1])/2, Lb = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
        const lv = []; for (let y = Math.ceil((gmax + 5.5)/F_AC)*F_AC; y + 4 <= tt; y += F_AC*2) lv.push(y); if (!lv.length) continue; if (lv.length > 2) lv.length = 2;
        for (const y of lv){ W.c('#e6e1d6'); boxV(W, Lb, 0.7, 3.6, cx, y - 0.2, cz, ry); boxV(W, Lb, 0.5, 3.8, cx, y + 3.3, cz, ry);
          M.wb.c('#41505b'); for (const s of [-1, 1]){ const F = api.rotP2(cx, cz, ry), a = F(-Lb/2, y + 0.5, s*1.75), c = F(Lb/2, y + 0.5, s*1.75); M.wb.q(a, c, [c[0], y + 3.3, c[2]], [a[0], y + 3.3, a[2]]); }
          W.c('#f2efe7'); for (const s of [-1, 1]){ const F = api.rotP2(cx, cz, ry), a = F(-Lb/2, y + 3.2, s*1.8), c = F(Lb/2, y + 3.2, s*1.8), a2 = F(-Lb/2, y + 3.2, s*2.6), c2 = F(Lb/2, y + 3.2, s*2.6); W.q(a, c, c2, a2); } }
        api.occupyLine([p0, p1], 2.5); n++; }
      return n; };

    // ---------- build ----------
    const t0 = Date.now();
    for (const b of claimed){ const c = CFG[b.i] || {};
      try {
        if (SIG[b.i]) SIG[b.i](b);
        else if (c.k === KR) kr(b, c);
        else if (c.k === NEW) nw(b, c);
        else if (c.k === HOS) hos(b, c);
        else if (c.k === LT) ltB(b, c);
        else if (c.k === 'hip') hipB(b, c);
        else if (b.st === 'acad' && b.area > 150) kr(b, {h:b.h});
        else if (b.st === 'hosp') hos(b, {});
        else if (b.st === 'lab') kr(b, {lab:1});
        else if (b.sig && api.SIGF[b.sig]) api.SIGF[b.sig](b);
        else api.building(b);
      } catch (err){ console.error('nussci ' + b.i, err); }
    }
    const nbr = bridges();
    // labels
    for (const [zh, en, ic, i, dy] of LBL){ const b = byI.get(i); if (!b) continue; const c = cen(b.P); api.label(c[0], c[1], (b.top || GY(c[0], c[1]) + b.h) + dy, zh, en, {ic}); }
    try { (window.__nussci = {bridges:nbr, ms:Date.now() - t0}); } catch (e){}
  }});
}
