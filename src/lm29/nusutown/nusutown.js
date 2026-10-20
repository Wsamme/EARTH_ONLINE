// ===== NUS University Town + the sports cluster (v32 group `nusutown`) — an extension of the NUS site (lm20/nus/nus.js) =====
// University Town on the former Warren golf course: Stephen Riady Centre (DP Architects: three storeys along a two-level pedestrian
// spine, central covered forum, vines on steel cables, vegetated roof, open-air pool, two sports halls, the 466-seat auditorium, the
// streamlined metallic disc over the drop-off), the Education Resource Centre (W Architects: stepped green-roof terraces round a
// central void with the old tembusu trees) with the Ngee Ann Kongsi Auditorium, CREATE (Perkins+Will: a 16-storey tower of three
// staggered 15 m bars + the five / six / seven-storey wet-lab bars round a plaza), Town Plaza, UTown Residence (two courtyard towers
// joined by a two-level atrium with a reflecting pool and water wall), the residential colleges (DPA: Tembusu, Cinnamon / USP,
// College of Alice & Peter Tan, RC4 — slab towers with sky terraces, learn lobes, dining halls, multi-purpose halls), the former
// Yale-NUS campus (Pelli Clarke Pelli + Forum: low blocks with deep eaves and bronze textile-pattern screens round courtyards, three
// college towers with a sky garden on every other floor, the entrance pavilion with its oculus roof), the district-cooling plant
// (thermal storage tank + cooling towers), the landscape (Town Green deck, Tembusu Hill stage, CAPT lawn steps, CREATE water garden)
// and the sports cluster (University Sports Centre, MPSH 1–6, the wind tunnel, University Health Centre, Staff Club). The NUS Link
// Bridge over the AYE is drawn by the app's road module (OSM bridge deck); it is only labelled here. Eight plain white campus shuttle
// buses (two instanced meshes, one frame hook) run the UTown loop and Kent Ridge Crescent. No logos, names or lettering. Everything
// else goes into the site batches (api.M).
{
const MINE = new Set([0, 2, 4, 5, 9, 10, 11, 13, 20, 23, 24, 27, 29, 38, 42, 44, 46, 47, 53, 58, 59, 60, 61, 64, 67, 69, 70, 71, 80, 85, 87, 90, 91, 94, 95, 96, 97, 99, 101, 112, 115, 119, 120, 121, 122, 123, 124, 132, 133, 134, 138, 141, 142, 143, 149, 151, 153, 154, 157, 159, 161, 162, 163, 164, 165, 166, 168, 171]);
// campus shuttle buses: one shared state, updated by a single frame hook (registered once even if the site is rebuilt)
const UTB = {buses:null, hooked:false};
(window.NUSX = window.NUSX || []).push({id:'nusutown',
  claim(b){ return MINE.has(b.i); },
  build(api, claimed){
    const {M, R, GY, CTX, PI, TAU, HP, lerp, clamp, hx, mixC, boxV, hexV, capV, capF, prism, lathe, cyl, seg, hipV, vaultV, sarea, perim, cen, inPoly, offsetPoly, obb,
      gRange, rotP2, nrm2, frame, circOf, facade, roofPlant, floorsOf, F_AC, F_RS, occupy, occupyLine} = api;
    const W = M.w, BY = {}; for (const b of claimed) BY[b.i] = b;
    const LBL = (x, z, y, zh, en, ic) => api.label(x, z, y, zh, en, ic ? {ic} : undefined);

    // ---------------- small geometry helpers ----------------
    const sgn = P => sarea(P) > 0 ? 1 : -1;
    // edges with their outward normal: fn(a, b, L, ux, uz, nn, i)
    const edges = (P, fn, hole) => { const n = P.length, s = sgn(P); for (let i = 0; i < n; i++){ const a = P[i], b = P[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.05) continue;
      let nn = nrm2(a, b, s); if (hole) nn = [-nn[0], -nn[1]]; fn(a, b, L, (b[0] - a[0])/L, (b[1] - a[1])/L, nn, i); } };
    const quadE = (V, a, b, y0, y1, off, nn) => { const ox = nn ? nn[0]*off : 0, oz = nn ? nn[1]*off : 0; V.q([a[0] + ox, y0, a[1] + oz], [b[0] + ox, y0, b[1] + oz], [b[0] + ox, y1, b[1] + oz], [a[0] + ox, y1, a[1] + oz]); };
    const walls = (V, P, y0, y1, col, hole) => { V.c(col); edges(P, (a, b) => quadE(V, a, b, y0, y1), hole); };
    // a horizontal ring band between P and its offset (d > 0 outward): top, bottom and front faces
    const ledge = (V, P, y, t, d, col, hole) => { const O = offsetPoly(P, hole ? -d : d), n = P.length; V.c(col);
      for (let i = 0; i < n; i++){ const j = (i + 1) % n, a = P[i], b = P[j], A = O[i], B = O[j];
        V.q([a[0], y + t, a[1]], [b[0], y + t, b[1]], [B[0], y + t, B[1]], [A[0], y + t, A[1]]); V.q([A[0], y, A[1]], [B[0], y, B[1]], [B[0], y + t, B[1]], [A[0], y + t, A[1]]);
        if (t > 0.05) V.q([a[0], y, a[1]], [b[0], y, b[1]], [B[0], y, B[1]], [A[0], y, A[1]]); } };
    // a roof slab with an overhang (eave) d: top, soffit and edge
    const slab = (V, P, y, t, d, col, holes) => { const O = d ? offsetPoly(P, d) : P; V.c(col); prism(V, O, y, y + t, true); capV(V, O, y + t, holes); capV(V, O, y, holes); return O; };
    const parapet = (P, y, h, col, holes) => { const I = offsetPoly(P, -0.3); W.c(col); prism(W, P, y, y + h, true); prism(W, I, y, y + h, true); edgesTop(P, I, y + h); for (const H of holes || []){ const J = offsetPoly(H, 0.3); prism(W, H, y, y + h, true); prism(W, J, y, y + h, true); edgesTop(H, J, y + h); } };
    const edgesTop = (P, I, y) => { const n = P.length; for (let i = 0; i < n; i++){ const j = (i + 1) % n; W.q([P[i][0], y, P[i][1]], [P[j][0], y, P[j][1]], [I[j][0], y, I[j][1]], [I[i][0], y, I[i][1]]); } };
    // window bands on the world floor grid: per floor a band from F*a to F*b, inset from the corners
    const bands = (V, P, lo, top, F, col, a, b, o) => { o = o || {}; const fl = floorsOf(lo, top, F), off = o.off === undefined ? 0.06 : o.off; V.c(col);
      edges(P, (p, q, L, ux, uz, nn) => { if (L < (o.minL || 2.4)) return; if (o.filt && !o.filt(nn, L)) return; const e = Math.min(o.e === undefined ? 0.7 : o.e, L*0.12), A = [p[0] + ux*e, p[1] + uz*e], B = [q[0] - ux*e, q[1] - uz*e];
        for (let k = o.skip0 ? 1 : 0; k < fl.length; k++){ if (o.skipF && o.skipF(k)) continue; quadE(V, A, B, fl[k] + F*a, fl[k] + F*b, off, nn); } }, o.hole);
      return fl; };
    // full-height glass between y0 and y1 (lit curtain material) with mullions every s metres (W)
    const glass = (P, y0, y1, col, s, mcol, o) => { o = o || {}; M.gl.c(col); edges(P, (a, b, L, ux, uz, nn) => { if (o.filt && !o.filt(nn, L)) return; quadE(M.gl, a, b, y0, y1, 0.02, nn);
      if (s && L > s){ W.c(mcol || '#d8dcdc'); const nm = Math.floor(L/s); for (let k = 1; k < nm; k++){ const u = k*L/nm, x = a[0] + ux*u + nn[0]*0.08, z = a[1] + uz*u + nn[1]*0.08; W.q([x - ux*0.1, y0, z - uz*0.1], [x + ux*0.1, y0, z + uz*0.1], [x + ux*0.1, y1, z + uz*0.1], [x - ux*0.1, y1, z - uz*0.1]); } } }, o.hole); };
    // horizontal sunshade blades (ring bands offset outward) at the given heights
    const louvres = (P, ys, d, col, t) => { for (const y of ys) ledge(W, P, y, t || 0.1, d, col); };
    // vertical fins every s metres along the edges that pass filt
    const fins = (P, y0, y1, s, d, col, filt, t) => { W.c(col); t = t || 0.1; edges(P, (a, b, L, ux, uz, nn) => { if (L < s*1.2) return; if (filt && !filt(nn, L)) return; const nf = Math.floor(L/s);
      for (let k = 0; k <= nf; k++){ const u = (L - nf*s)/2 + k*s, x = a[0] + ux*u, z = a[1] + uz*u, p0 = [x - ux*t, z - uz*t], p1 = [x + ux*t, z + uz*t], q0 = [p0[0] + nn[0]*d, p0[1] + nn[1]*d], q1 = [p1[0] + nn[0]*d, p1[1] + nn[1]*d];
        W.q([q0[0], y0, q0[1]], [q1[0], y0, q1[1]], [q1[0], y1, q1[1]], [q0[0], y1, q0[1]]); W.q([p0[0], y0, p0[1]], [q0[0], y0, q0[1]], [q0[0], y1, q0[1]], [p0[0], y1, p0[1]]); W.q([p1[0], y0, p1[1]], [q1[0], y0, q1[1]], [q1[0], y1, q1[1]], [p1[0], y1, p1[1]]); } }); };
    // vines on steel cables: green panels standing off the wall, with the cables between
    const vines = (P, y0, y1, s, w, filt, cov) => { cov = cov || 0.8; edges(P, (a, b, L, ux, uz, nn) => { if (L < 8) return; if (filt && !filt(nn, L)) return; const nf = Math.floor((L - 2)/s);
      for (let k = 0; k < nf; k++){ const u = 1 + (L - nf*s)/2 + k*s + (s - w)/2, x = a[0] + ux*u + nn[0]*0.55, z = a[1] + uz*u + nn[1]*0.55, top = lerp(y0, y1, cov + (1 - cov)*((k*7 + 3) % 5)/4);
        M.veg.c(k % 3 ? '#4f7f3a' : '#5d8f45', 0.12); M.veg.q([x, y0, z], [x + ux*w, y0, z + uz*w], [x + ux*w, top, z + uz*w], [x, top, z]);
        W.c('#9aa0a3'); W.q([x + ux*(w + 0.2), y0, z + uz*(w + 0.2)], [x + ux*(w + 0.3), y0, z + uz*(w + 0.3)], [x + ux*(w + 0.3), y1, z + uz*(w + 0.3)], [x + ux*(w + 0.2), y1, z + uz*(w + 0.2)]); } }); };
    // green roof: planted bed inset from the parapet
    // (the bed covers the whole roof inside a low kerb: inset rings of irregular footprints self-intersect and triangulate badly)
    const greenR = (P, y, d, col) => { if (Math.abs(sarea(P)) < 30) return; M.veg.c(col || '#6a8f4e', 0.1); capV(M.veg, P, y + 0.25); W.c('#e4e6e3'); const I = offsetPoly(P, -0.35); prism(W, P, y, y + 0.55, true); prism(W, I, y, y + 0.55, true); edgesTop(P, I, y + 0.55); };
    // polygon clipping to the half-plane n·p <= d (Sutherland–Hodgman)
    const clipH = (P, nx, nz, d) => { const out = []; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], fa = a[0]*nx + a[1]*nz - d, fb = b[0]*nx + b[1]*nz - d;
      if (fa <= 0) out.push(a); if ((fa < 0) !== (fb < 0) && fa !== fb){ const t = fa/(fa - fb); out.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t)]); } } return out; };
    const clean = P => { const o = []; for (const p of P){ const q = o[o.length - 1]; if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.3) o.push(p); } if (o.length > 2 && Math.hypot(o[0][0] - o[o.length - 1][0], o[0][1] - o[o.length - 1][1]) < 0.3) o.pop(); return o; };
    // strip of P between u0 and u1 along the unit direction (ux, uz) measured from origin o
    const strip = (P, o, ux, uz, u0, u1) => { const d0 = o[0]*ux + o[1]*uz; return clean(clipH(clipH(P, ux, uz, d0 + u1), -ux, -uz, -(d0 + u0))); };
    const rectP = (F, u0, u1, v0, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(([u, v]) => { const p = F(u, 0, v); return [p[0], p[2]]; });
    const L2 = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
    // inset ring without self-intersections (shrinks the inset until the offset ring is simple)
    const segX = (a, b, c, d) => { const d1 = (b[0] - a[0])*(c[1] - a[1]) - (b[1] - a[1])*(c[0] - a[0]), d2 = (b[0] - a[0])*(d[1] - a[1]) - (b[1] - a[1])*(d[0] - a[0]), d3 = (d[0] - c[0])*(a[1] - c[1]) - (d[1] - c[1])*(a[0] - c[0]), d4 = (d[0] - c[0])*(b[1] - c[1]) - (d[1] - c[1])*(b[0] - c[0]); return d1*d2 < 0 && d3*d4 < 0; };
    const simple = Q => { const n = Q.length; for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++){ if (i === 0 && j === n - 1) continue; if (segX(Q[i], Q[(i + 1) % n], Q[j], Q[(j + 1) % n])) return false; } return true; };
    const safeInset = (P, d) => { for (const f of [1, 0.8, 0.6, 0.4, 0.25]){ const Q = offsetPoly(P, -d*f); if (sgn(Q) === sgn(P) && simple(Q)) return Q; } return null; };
    const lamp = (x, y, z, c) => CTX.lamp(x, y, z, c || [255, 222, 176]);
    const tree = (x, z, s, k) => CTX.tree(x, z, s, k || 'raintree');
    const rooftop = (P, y, n, k, stacks) => roofPlant(P, y, n, k, stacks);
    // a drop-off / entrance canopy: thin slab on posts in front of edge (a, b) of the footprint
    const canopy = (a, b, nn, y, depth, col, lit) => { const P = [[a[0], a[1]], [b[0], b[1]], [b[0] + nn[0]*depth, b[1] + nn[1]*depth], [a[0] + nn[0]*depth, a[1] + nn[1]*depth]]; slab(W, P, y, 0.35, 0, col);
      W.c('#c9cdcf'); for (const t of [0.12, 0.88]){ const x = lerp(a[0], b[0], t) + nn[0]*(depth - 0.5), z = lerp(a[1], b[1], t) + nn[1]*(depth - 0.5), g = GY(x, z); boxV(W, 0.25, y - g + 0.5, 0.25, x, g - 0.5, z); }
      if (lit){ const c = cen(P); boxV(M.warm, L2(a, b)*0.7, 0.05, depth*0.5, c[0], y - 0.06, c[1], -Math.atan2(b[1] - a[1], b[0] - a[0])); lamp(c[0], y - 0.5, c[1]); } };
    const longest = P => { let bi = 0, bl = 0; for (let i = 0; i < P.length; i++){ const L = L2(P[i], P[(i + 1) % P.length]); if (L > bl){ bl = L; bi = i; } } return bi; };
    const edgeN = (P, i) => { const a = P[i], b = P[(i + 1) % P.length]; return [a, b, nrm2(a, b, sgn(P))]; };
    const dirF = (nx, nz) => (nn) => nn[0]*nx + nn[1]*nz > 0.35;      // edges facing a direction

    let built = 0;
    const T = {};    // per-building builders by index

    // ======================= UNIVERSITY TOWN =======================
    // ---------- Stephen Riady Centre (99): 3 storeys on a two-level spine; vines on cables; vegetated roof; sports halls; auditorium; pool ----------
    T[99] = b => { const P = b.P, [lo, hi] = gRange(P), top = lo + 14.4, sp = {F:'a', ld:0.9, a:0.2, b:0.9}, o = {wall:'#e2e4e1', band:'#3e5262', ledge:'#f1f1ee', par:1.0};
      facade([[P, false]], lo, top, sp, o);
      // the Town Green side (faces NE) is glazed and open; the expressway / road sides carry the vines on cables
      vines(P, lo + 3.2, top + 0.6, 3.4, 2.2, dirF(-0.75, 0.66));
      vines(P, lo + 3.2, top + 0.6, 3.4, 2.2, dirF(-0.6, -0.8), 0.6);
      M.gl.c('#5c7a88'); edges(P, (a, c, L, ux, uz, nn) => { if (nn[0]*0.6 + nn[1]*-0.8 > 0.4 || nn[0]*0.7 + nn[1]*0.7 > 0.4) quadE(M.gl, a, c, lo + 0.3, lo + 3.6, 0.1, nn); });
      W.c('#cfd3d4'); capV(W, P, top); parapet(P, top, 1.0, '#e9ebe8');
      greenR(P, top, 2.0, '#678c4b');
      // sports halls: two big volumes on the western wing under shallow curved metal roofs
      const f = frame(P), F = f.F;
      const halls = [[-440, -737, 0.09, 32, 24], [-441, -690, -1.0, 28, 22]];
      for (const [x, z, ry, Lh, Wh] of halls){ const Rp = rotP2(x, z, ry), Q = [[-Lh/2, -Wh/2], [Lh/2, -Wh/2], [Lh/2, Wh/2], [-Lh/2, Wh/2]].map(([u, v]) => { const p = Rp(u, 0, v); return [p[0], p[2]]; });
        if (!Q.every(p => inPoly(P, p[0], p[1]))) continue; const yh = lo + 19;
        walls(W, Q, top, yh, '#e6e8e6'); M.wb.c('#41586a'); edges(Q, (a, c, L, ux, uz, nn) => quadE(M.wb, a, c, yh - 3.0, yh - 0.8, 0.05, nn));
        W.c('#b9c3c8'); vaultV(W, W, x, z, Lh + 1.2, Wh + 1.2, yh, 2.4, ry, 10); W.c('#dfe3e5'); for (let k = -2; k <= 2; k++){ const p = Rp(k*Lh/5, 0, 0); boxV(W, 0.5, 0.35, Wh + 1.6, p[0], yh + 2.35, p[2], ry); } }
      // auditorium (466 seats): a solid box with a raked roof at the plaza end, its foyer glazed
      { const x = -330, z = -635, ry = 0.09, Rp = rotP2(x, z, ry), Q = [[-14, -11], [14, -11], [14, 11], [-14, 11]].map(([u, v]) => { const p = Rp(u, 0, v); return [p[0], p[2]]; });
        if (Q.every(p => inPoly(P, p[0], p[1]))){ walls(W, Q, top, lo + 20, '#d7d2c8'); W.c('#b7bec2'); const yy = lo + 20; hexV(W, [Rp(-14.6, top, -11.6), Rp(14.6, top, -11.6), Rp(14.6, top, 11.6), Rp(-14.6, top, 11.6), Rp(-14.6, yy + 1.8, -11.6), Rp(14.6, yy - 0.6, -11.6), Rp(14.6, yy - 0.6, 11.6), Rp(-14.6, yy + 1.8, 11.6)]);
          W.c('#c9a27a'); for (const sv of [-1, 1]) for (let k = -5; k <= 5; k++){ const p = Rp(k*2.5, 0, sv*11.15); boxV(W, 0.5, yy - top - 1.2, 0.35, p[0], top + 0.4, p[2], ry); } } }
      // open-air pool on the roof deck (east wing, over the forum side), timber deck and sun loungers
      { const x = -372, z = -651, ry = 0.62, Rp = rotP2(x, z, ry), deck = [[-17, -9], [17, -9], [17, 9], [-17, 9]].map(([u, v]) => { const p = Rp(u, 0, v); return [p[0], p[2]]; }), pool = [[-12.5, -5], [12.5, -5], [12.5, 5], [-12.5, 5]].map(([u, v]) => { const p = Rp(u, 0, v); return [p[0], p[2]]; });
        if (deck.every(p => inPoly(P, p[0], p[1]))){ W.c('#b79a76'); capV(W, deck, top + 0.4); W.c('#e6e8e6'); prism(W, offsetPoly(deck, 0.2), top, top + 1.4, true); M.wat.c('#fff'); capV(M.wat, pool, top + 0.55);
          W.c('#f4f4f0'); for (let k = 1; k < 5; k++){ const a = Rp(-12, top + 0.6, -5 + k*2), c = Rp(12, top + 0.6, -5 + k*2); W.q(a, c, [c[0] + 0.001, c[1], c[2] + 0.1], [a[0] + 0.001, a[1], a[2] + 0.1]); }
          W.c('#f2f2ee'); for (let k = -4; k <= 4; k++){ const p = Rp(k*3.2, 0, 7.4); boxV(W, 0.7, 0.35, 1.9, p[0], top + 0.4, p[2], ry); }
          lamp(x, top + 4, z, [235, 242, 255]); } }
      // central covered forum: a glazed lantern over the crossing of the four paths, the spine's skylights
      { const c = [-399, -690], Rp = rotP2(c[0], c[1], -0.63); M.gl.c('#9bb6c2'); const Q = [[-11, -9], [11, -9], [11, 9], [-11, 9]].map(([u, v]) => { const p = Rp(u, 0, v); return [p[0], p[2]]; });
        if (Q.every(p => inPoly(P, p[0], p[1]))){ walls(M.gl, Q, top, top + 2.2, '#7d9aa8'); ledge(W, Q, top + 2.2, 0.4, 0.5, '#e9ebea'); M.gl.c('#a9c4ce'); const rr = Math.hypot(11, 9); lathe(M.gl, [[rr, 0], [0, 3.6]], c[0], top + 2.6, c[1], 4, Math.atan2(9, 11) - 0.63 + 0.0); M.cool.c('#fff'); capV(M.cool, offsetPoly(Q, -2), top + 2.15); } }
      for (let k = 0; k < 6; k++){ const p = F(-f.L*0.35 + k*f.L*0.14, 0, -f.W*0.05); if (!inPoly(P, p[0], p[2])) continue; M.gl.c('#a6c0cb'); boxV(M.gl, 7, 0.9, 3, p[0], top, p[2], f.ry); }
      rooftop(offsetPoly(P, -6), top, 5, b.i);
      // ground plaza edge: lit shopfront strip toward the Town Green
      edges(P, (a, c, L, ux, uz, nn) => { if (L > 12 && nn[0]*0.7 + nn[1]*0.7 > 0.5) quadE(M.warm, [a[0] + ux*2, a[1] + uz*2], [c[0] - ux*2, c[1] - uz*2], lo + 0.4, lo + 3.2, 0.14, nn); });
      LBL(-405, -690, top + 14, '斯蒂芬·利雅迪中心', 'Stephen Riady Centre', '🏟');
    };
    // the streamlined metallic disc over the vehicular drop-off (27): an oval lens on raking columns with a glazed oculus
    T[27] = b => { const [x, z] = cen(b.P), g0 = GY(x, z), y = g0 + 16.5, ry = 0.35, A = 21, B = 15, N = 36, V = W;
      const ring = (s, yy) => { const o = []; for (let i = 0; i < N; i++){ const a = i/N*TAU, p = rotP2(x, z, ry)(Math.cos(a)*A*s, yy, Math.sin(a)*B*s); o.push(p); } return o; };
      const r0 = ring(1, y + 0.9), r1 = ring(0.93, y + 1.6), r2 = ring(0.93, y), r3 = ring(0.42, y + 2.0), r4 = ring(0.42, y + 0.2);
      V.c('#d3d9dd'); for (let i = 0; i < N; i++){ const j = (i + 1) % N; V.q(r0[i], r0[j], r1[j], r1[i]); V.q(r1[i], r1[j], r3[j], r3[i]); V.c('#c2c9ce'); V.q(r2[i], r2[j], r0[j], r0[i]); V.q(r4[i], r4[j], r2[j], r2[i]); V.c('#d3d9dd'); }
      M.gl.c('#bcd2dc'); const ce = [x, y + 1.9, z]; for (let i = 0; i < N; i++){ const j = (i + 1) % N; M.gl.t(r3[i], r3[j], ce); }
      M.cool.c('#fff'); for (let i = 0; i < N; i++){ const j = (i + 1) % N; M.cool.q(ring(0.88, y - 0.03)[i], ring(0.88, y - 0.03)[j], ring(0.5, y + 0.15)[j], ring(0.5, y + 0.15)[i]); }
      W.c('#c4c9cc'); for (let k = 0; k < 5; k++){ const a = k/5*TAU + 0.4, p = rotP2(x, z, ry)(Math.cos(a)*A*0.32, 0, Math.sin(a)*B*0.32), q = rotP2(x, z, ry)(Math.cos(a)*A*0.62, 0, Math.sin(a)*B*0.62); seg(W, [p[0], GY(p[0], p[2]) - 0.4, p[2]], [q[0], y + 0.3, q[2]], 0.32, 6); }
      lamp(x, y - 1.5, z, [225, 236, 255]); occupy(b.P, 1);
    };
    T[95] = b => { const [lo] = gRange(b.P); api.shed(b.P, lo, 3.4, '#d8dcdc'); };

    // ---------- Education Resource Centre (61): stepped planted terraces round a void with the tembusu trees ----------
    T[61] = b => { const P = b.P, [lo, hi] = gRange(P), c = [-347, -832], rv = 9;
      const tiers = [[0, lo + 5.2], [2.6, lo + 9.6], [6.0, lo + 14.4]];
      const voidC = []; for (let i = 0; i < 20; i++){ const a = i/20*TAU; voidC.push([c[0] + Math.cos(a)*rv, c[1] + Math.sin(a)*rv]); }
      let yb = lo - 1.6, prev = null;
      for (let t = 0; t < tiers.length; t++){ const [d, y1] = tiers[t], Q = d ? (safeInset(prev || P, d - (t > 1 ? tiers[t - 1][0] : 0)) || prev) : P; if (Math.abs(sarea(Q)) < 300) break;
        const y0 = t ? tiers[t - 1][1] : lo - 1.6;
        // glass storey band with white fascia at the slab
        M.gl.c(t === 0 ? '#567686' : '#5f7f8e'); edges(Q, (a, e, L, ux, uz, nn) => quadE(M.gl, a, e, y0, y1 - 0.9, 0.02, nn));
        W.c('#eef0ef'); edges(Q, (a, e, L, ux, uz, nn) => quadE(W, a, e, y1 - 0.9, y1 + 0.35, 0.05, nn));
        fins(Q, y0 + 0.3, y1 - 0.9, 2.4, 0.35, '#e3e6e5', null, 0.06);
        // planted terrace on what remains of the tier below
        if (prev && prev !== Q){ M.veg.c('#64904a', 0.1); capV(M.veg, prev, y0 + 0.3, [Q]); W.c('#e8ebe9'); prism(W, offsetPoly(prev, -0.25), y0, y0 + 1.0, true); }
        prev = Q; }
      // roof: green roof round the void, void glazed on its inner face
      // roof: planted all over (no hole: holes triangulate badly on these ragged rings); the central void as a glazed oculus over the courtyard
      const yT = tiers[2][1]; W.c('#d4d8d6'); capV(W, prev, yT + 0.35); M.veg.c('#5f8c45', 0.1); capV(M.veg, prev, yT + 0.6); parapet(prev, yT + 0.35, 0.9, '#e9ecea');
      M.gl.c('#3f5b68'); capV(M.gl, voidC, yT + 0.7); M.gl.c('#4f6f7e'); edges(voidC, (a, e, L, ux, uz, nn) => quadE(M.gl, a, e, lo, yT, -0.02, nn)); W.c('#e9ecea'); prism(W, offsetPoly(voidC, 0.4), yT, yT + 1.2, true); prism(W, voidC, yT + 0.6, yT + 1.2, true);
      M.veg.c('#557f3f'); capF(M.veg, offsetPoly(voidC, -0.3), () => lo + 0.3); tree(c[0], c[1], 5.2); tree(c[0] + 3, c[1] - 4, 3.6, 'd');
      // grass terraces stepping down to the Town Green (east / south-east face): low planted steps outside the glass
      edges(P, (a, e, L, ux, uz, nn) => { if (L < 8 || nn[0]*0.55 + nn[1]*0.83 < 0.45) return; for (let k = 0; k < 3; k++){ const d0 = 0.4 + k*2.4, d1 = d0 + 2.4, A = [a[0] + nn[0]*d0, a[1] + nn[1]*d0], B = [e[0] + nn[0]*d0, e[1] + nn[1]*d0], C = [e[0] + nn[0]*d1, e[1] + nn[1]*d1], D = [a[0] + nn[0]*d1, a[1] + nn[1]*d1];
        const g = Math.min(GY(A[0], A[1]), GY(C[0], C[1])), y = g + 1.6 - k*0.55; M.veg.c(k % 2 ? '#6c9a50' : '#78a55a'); capV(M.veg, [A, B, C, D], y); W.c('#d9d6cc'); quadE(W, D, C, g - 0.4, y, 0, null); } });
      rooftop(offsetPoly(prev, -3), tiers[2][1] + 0.35, 2, b.i);
      LBL(c[0] - 6, c[1] + 8, lo + 26, '教育资源中心', 'Education Resource Centre', '📚');
    };
    // Ngee Ann Kongsi Auditorium (154): the solid auditorium box at the ERC's southern tip, dark ribbed cladding, glazed foyer
    T[154] = b => { const P = b.P, [lo] = gRange(P), top = lo + 15.5, I = offsetPoly(P, -1.2);
      M.gl.c('#55727f'); edges(P, (a, e, L, ux, uz, nn) => quadE(M.gl, a, e, lo - 1.6, lo + 4.2, 0.02, nn)); W.c('#e9ebea'); ledge(W, P, lo + 4.2, 0.5, 0.8, '#eceeed');
      walls(W, I, lo + 4.2, top, '#6c6863'); W.c('#5d5a56'); edges(I, (a, e, L, ux, uz, nn) => { const n = Math.floor(L/1.6); for (let k = 1; k < n; k++){ const t = k/n, x = lerp(a[0], e[0], t) + nn[0]*0.12, z = lerp(a[1], e[1], t) + nn[1]*0.12; W.q([x - ux*0.15, lo + 4.7, z - uz*0.15], [x + ux*0.15, lo + 4.7, z + uz*0.15], [x + ux*0.15, top, z + uz*0.15], [x - ux*0.15, top, z - uz*0.15]); } });
      capV(W, P, lo + 4.2); W.c('#8d9396'); const f = frame(I); hexV(W, [f.F(-f.L/2, top, -f.W/2), f.F(f.L/2, top, -f.W/2), f.F(f.L/2, top, f.W/2), f.F(-f.L/2, top, f.W/2), f.F(-f.L/2, top + 0.5, -f.W/2), f.F(f.L/2, top + 2.2, -f.W/2), f.F(f.L/2, top + 2.2, f.W/2), f.F(-f.L/2, top + 0.5, f.W/2)]);
      LBL(-316, -778, top + 6, '义安公司礼堂', 'Ngee Ann Kongsi Auditorium', '🎭');
    };

    // ---------- CREATE (80 tower, 123 wet-lab bars, 60 Town Plaza) ----------
    const labFacade = (Q, lo, top, o) => { o = o || {}; const fl = floorsOf(lo, top, F_AC);
      walls(W, Q, lo - 1.6, top + 1.2, o.wall || '#eceeed'); bands(M.gl, Q, lo, top, F_AC, o.glass || '#4f6d7e', 0.12, 0.86, {e:0.4, off:0.05});
      // two aluminium sunshade blades per floor (the deep horizontal louvres of the lab bars)
      for (const y of fl){ ledge(W, Q, y + F_AC*0.86, 0.14, 1.1, o.blade || '#dfe3e5'); if (o.two !== false) ledge(W, Q, y + F_AC*0.5, 0.08, 0.7, o.blade || '#dfe3e5'); }
      if (o.fins) fins(Q, lo + 4, top, o.fins, 0.8, o.finC || '#d3d8da', null, 0.08);
      return fl; };
    T[80] = b => { const P = b.P, [lo, hi] = gRange(P), pod = lo + 8.6, top = lo + 64.0;
      // podium over the whole wedge
      walls(W, P, lo - 1.6, pod, '#e7e9e8'); bands(M.gl, P, lo, pod, F_AC, '#4b6879', 0.1, 0.88, {e:0.3}); ledge(W, P, pod - 0.4, 0.5, 1.6, '#f1f2f1');
      W.c('#cbd0cf'); capV(W, P, pod + 0.1); greenR(P, pod + 0.1, 1.8);
      // the tower: three staggered 15 m bars, each with its own crown, cut from the saw-tooth west side of the footprint
      const ux = 0.924, uz = -0.383, o = [-317.3, -597.4], tiers = [[0, 15.5, 64.0], [15.5, 31, 60.0], [31, 46.5, 56.0]];
      for (const [u0, u1, hh] of tiers){ let Q = strip(P, o, ux, uz, u0 + 0.6, u1 - 0.6); if (Q.length < 3 || Math.abs(sarea(Q)) < 80) continue;
        // keep the bar 40 m deep from its saw-tooth end
        const c0 = Q.reduce((m, p) => Math.min(m, p[0]*0.383 + p[1]*0.924), 1e9); Q = clean(clipH(Q, 0.383, 0.924, c0 + 40)); if (Q.length < 3) continue;
        const t2 = lo + hh; labFacade(Q, pod, t2, {fins:3.0});
        // the linear vegetative columns (bamboo / vine screens) running up the faces
        edges(Q, (a, e, L, ex, ez, nn) => { if (L < 12) return; const n = Math.max(1, Math.floor(L/13)); for (let k = 0; k < n; k++){ const u = (k + 0.5)*L/n, x = a[0] + ex*u + nn[0]*1.15, z = a[1] + ez*u + nn[1]*1.15;
          M.veg.c(k % 2 ? '#4d7f39' : '#5a8c43', 0.1); M.veg.q([x - ex*0.9, pod + 0.5, z - ez*0.9], [x + ex*0.9, pod + 0.5, z + ez*0.9], [x + ex*0.9, t2 - 2, z + ez*0.9], [x - ex*0.9, t2 - 2, z - ez*0.9]); } });
        // crown: roof garden, PV canopy and two small vertical-axis wind turbines
        W.c('#c6cbcc'); capV(W, Q, t2 + 1.2); W.c('#e9ecec'); prism(W, offsetPoly(Q, -0.6), t2 + 1.2, t2 + 4.2, true); greenR(Q, t2 + 1.2, 2.6, '#678f4b');
        { const ob = obb(Q), Rq = rotP2(ob.cx, ob.cz, ob.ry); W.c('#3f536a'); const pv = Rq(ob.L*0.2, 0, 0); boxV(W, ob.L*0.35, 0.25, ob.W*0.6, pv[0], t2 + 4.6, pv[2], ob.ry);
          W.c('#c9cdd0'); for (const s2 of [-1, 1]){ const p = Rq(-ob.L*0.25, 0, s2*ob.W*0.22); seg(W, [p[0], t2 + 1.2, p[2]], [p[0], t2 + 8.5, p[2]], 0.12, 5); cyl(W, 0.9, 0.9, 2.6, p[0], t2 + 6.4, p[2], 6); } }
        rooftop(offsetPoly(Q, -2), t2 + 1.2, 2, b.i + u0);
        // sky garden two-thirds up: a recessed planted floor
        const ys = floorsOf(pod, t2, F_AC), yk = ys[Math.floor(ys.length*0.55)]; if (yk){ W.c('#2f3639'); prism(W, offsetPoly(Q, 0.15), yk + 0.3, yk + F_AC - 0.3, true); M.veg.c('#5b8c44', 0.1); prism(M.veg, offsetPoly(Q, 0.4), yk, yk + 1.1, true); capV(M.veg, offsetPoly(Q, 0.4), yk + 1.1); } }
      LBL(-282, -592, lo + 72, '卓越研究与科技企业校园（CREATE）', 'CREATE — Campus for Research Excellence and Technological Enterprise', '🔬');
    };
    T[123] = b => { const P = b.P, [lo] = gRange(P), ux = 0.894, uz = 0.448, o = [-253, -639];
      // three wet-lab bars of five, six and seven storeys (west → east)
      const parts = [[-5, 40, 20.5], [40, 80, 24.5], [80, 160, 28.5]];
      for (const [u0, u1, h] of parts){ const Q = strip(P, o, ux, uz, u0, u1); if (Q.length < 3 || Math.abs(sarea(Q)) < 40) continue; const top = lo + h;
        labFacade(Q, lo, top, {fins:0}); W.c('#c3c8c9'); capV(W, Q, top + 1.2); parapet(Q, top + 1.2, 0.8, '#e6e9e8');
        // roof: a planted roof garden on the plaza half, the lab exhaust plant screened on the other
        const ob = obb(Q), Rq = rotP2(ob.cx, ob.cz, ob.ry);
        for (let sh = 1; sh > 0.4; sh -= 0.15){ const G = rectP(Rq, -ob.L/2 + 2.5, -ob.L*0.02, -ob.W/2*sh + 1.5, ob.W/2*sh - 1.5); if (!G.every(p => inPoly(Q, p[0], p[1]))) continue;
          W.c('#dcdfdc'); prism(W, offsetPoly(G, 0.35), top + 1.2, top + 1.75, true); capV(W, offsetPoly(G, 0.35), top + 1.2); M.veg.c('#668f4a', 0.08); capV(M.veg, G, top + 1.7);
          M.veg.c('#557f3e'); for (let k = 0; k < 5; k++){ const p = Rq(-ob.L/2 + 5 + k*(ob.L*0.45 - 6)/4, 0, (k % 2 - 0.5)*ob.W*0.25*sh); boxV(M.veg, 1.8, 1.1, 1.8, p[0], top + 1.7, p[2], ob.ry); } break; }
        if (u0 < 0) greenR(Q, top + 1.2, 2.2, '#668f4a'); else api.pvRoof(offsetPoly(Q, -1.5), top + 1.2, 0.75);
        const pp = Rq(ob.L*0.22, 0, 0); W.c('#cfd4d6'); boxV(W, Math.min(ob.L*0.35, 20), 3.2, Math.min(ob.W*0.55, 8), pp[0], top + 1.2, pp[2], ob.ry);
        W.c('#c9cbc8'); for (let k = 0; k < 4; k++){ const p = Rq(ob.L*(0.12 + k*0.07), 0, ob.W*0.32); if (inPoly(Q, p[0], p[2])) cyl(W, 0.5, 0.5, 6.5, p[0], top + 1.2, p[2], 6); } }
      // the plaza-side covered pathways: a canopy along the inner (north-west) faces at the first floor
      edges(P, (a, e, L, ex, ez, nn) => { if (L < 14 || nn[0]*-0.45 + nn[1]*-0.89 < 0.5) return; canopy([a[0] + ex*1, a[1] + ez*1], [e[0] - ex*1, e[1] - ez*1], nn, lo + 4.6, 3.2, '#eef0ef', true); });
    };
    // Town Plaza (60): the sheltered food & retail plaza between the CREATE buildings — a broad roof on slender columns, glass kiosks
    T[60] = b => { const P = b.P, [lo] = gRange(P), y = lo + 7.2;
      // the glass-covered pedestrian street: a glazed roof on a white steel grid over the whole footprint
      W.c('#eef0ef'); const E = offsetPoly(P, 0.4); prism(W, E, y, y + 0.7, true); M.gl.c('#b9d2db'); capV(M.gl, E, y + 0.55);
      const ob = obb(P), Rg = rotP2(ob.cx, ob.cz, ob.ry); W.c('#f2f3f2');
      edges(P, (a, e, L, ex, ez, nn) => { const n = Math.floor(L/4.5); for (let k = 1; k < n; k++){ const t = k/n, x = lerp(a[0], e[0], t), z = lerp(a[1], e[1], t); boxV(W, 0.3, 0.5, 0.3, x, y + 0.6, z); } });
      for (let v = -ob.W/2 + 4; v < ob.W/2; v += 6){ const a = Rg(-ob.L/2, 0, v), c = Rg(ob.L/2, 0, v);
        for (let t = 0; t < 1; t += 0.04){ const p = [lerp(a[0], c[0], t), lerp(a[2], c[2], t)], q = [lerp(a[0], c[0], t + 0.04), lerp(a[2], c[2], t + 0.04)]; if (inPoly(P, p[0], p[1]) && inPoly(P, q[0], q[1])) seg(W, [p[0], y + 0.75, p[1]], [q[0], y + 0.75, q[1]], 0.14, 4); } }
      M.cool.c('#fff'); for (let k = -3; k <= 3; k++){ const p = rotP2(ob.cx, ob.cz, ob.ry)(k*ob.L/8, 0, 0); if (inPoly(P, p[0], p[2])) boxV(M.cool, 1.0, 0.05, ob.W*0.6, p[0], y - 0.08, p[2], ob.ry); }
      M.gl.c('#9fc0cc'); for (let k = -2; k <= 2; k++){ const p = rotP2(ob.cx, ob.cz, ob.ry)(k*ob.L/6, 0, 0); if (inPoly(P, p[0], p[2])) boxV(M.gl, 5, 0.5, 2.4, p[0], y + 0.6, p[2], ob.ry); }
      W.c('#c7cbcd'); for (let u = -ob.L/2 + 4; u < ob.L/2 - 2; u += 9) for (let v = -ob.W/2 + 4; v < ob.W/2 - 2; v += 9){ const p = rotP2(ob.cx, ob.cz, ob.ry)(u, 0, v); if (!inPoly(offsetPoly(P, -1.5), p[0], p[2])) continue; const g = GY(p[0], p[2]); cyl(W, 0.22, 0.22, y - g + 0.5, p[0], g - 0.5, p[2], 6); }
      // kiosks / shopfronts along the building edges and a lit core
      for (const [x, z, ry] of [[-232, -604, 0.45], [-200, -590, -0.1], [-245, -625, 0.45], [-190, -610, 0.45]]){ if (!inPoly(P, x, z)) continue; const g = GY(x, z); M.gl.c('#6d8c98'); boxV(M.gl, 9, 3.6, 5, x, g - 0.3, z, ry); M.warm.c('#fff'); boxV(M.warm, 8.6, 0.6, 4.6, x, g + 3.3, z, ry); W.c('#e5e7e6'); boxV(W, 9.6, 0.4, 5.6, x, g + 3.9, z, ry); }
      lamp(ob.cx, y - 1, ob.cz);
      LBL(ob.cx, ob.cz, y + 8, '大学城广场', 'Town Plaza', '🍜');
    };
    T[151] = b => { const [lo] = gRange(b.P); api.shed(b.P, lo, 4.6, '#e2e6e6'); };

    // ---------- UTown Residence (163 north, 120 south): two courtyard towers, sky gardens, the two-level atrium link ----------
    const resTower = (b, o) => { const P = b.P, H = b.H, [lo] = gRange(P), top = lo + o.h, rings = [[P, false], ...H.map(h => [h, true])];
      walls(W, P, lo - 1.6, top + 1.2, o.wall); for (const h of H) walls(W, h, lo - 1.6, top + 1.2, o.wall, true);
      const sky = k => k % o.every === o.every - 1;
      bands(M.wr, P, lo, top, F_RS, o.band, 0.3, 0.8, {skip0:true, skipF:sky, e:0.5});
      for (const h of H) bands(M.wr, h, lo, top, F_RS, o.band, 0.3, 0.8, {skip0:true, skipF:sky, hole:true, e:0.5});
      // slab edges every floor (white lines), deeper ones every second floor; vertical frame fins
      const fl = floorsOf(lo, top, F_RS);
      for (let k = 1; k < fl.length; k++) if (!sky(k)) ledge(W, P, fl[k] - 0.12, 0.3, k % 2 ? 0.25 : 0.55, o.ledge);
      fins(P, lo + F_RS, top + 1.2, 3.4, 0.5, o.fin, null, 0.12);
      // sky gardens: recessed double-height floors with planters, accent soffit
      for (let k = o.every - 1; k < fl.length - 1; k += o.every){ const y = fl[k]; W.c('#2e3437'); prism(W, offsetPoly(P, 0.1), y + 0.3, y + F_RS - 0.2, true); M.veg.c('#5c8e45', 0.12); prism(M.veg, offsetPoly(P, 0.35), y, y + 1.2, true); capV(M.veg, offsetPoly(P, 0.35), y + 1.2, H.map(h => offsetPoly(h, -0.35))); }
      // courtyard: lobby glass, the reflecting pool, a water wall on the inner face
      M.gl.c('#57788a'); for (const h of H){ edges(h, (a, e, L, ux, uz, nn) => quadE(M.gl, a, e, lo, lo + 2*F_RS, 0.04, nn), true); M.wat.c('#fff'); capV(M.wat, offsetPoly(h, -3.0), lo + 0.35); W.c('#d9dcd8'); capV(W, h, lo + 0.25, [offsetPoly(h, -3.0)]); }
      M.gl.c('#57788a'); edges(P, (a, e, L, ux, uz, nn) => quadE(M.gl, a, e, lo - 1.6, lo + F_RS*0.95, 0.04, nn));
      // crown: roof terrace frame, plant, accent band
      W.c('#bfc5c7'); capV(W, P, top + 1.2, H); parapet(P, top + 1.2, 1.1, o.wall, H);
      W.c(o.crown); const I = offsetPoly(P, -1.2); prism(W, I, top + 1.2, top + 5.4, true); for (const h of H) prism(W, offsetPoly(h, 1.2), top + 1.2, top + 5.4, true);
      ledge(W, P, top - 2.6, 0.9, 0.5, o.accent);
      rooftop(offsetPoly(P, -4), top + 1.2, 3, b.i);
      return {lo, top}; };
    T[163] = b => { const r = resTower(b, {h:83.7, wall:'#f1f2ef', band:'#4a5c68', ledge:'#e0e4e5', fin:'#dfe3e4', crown:'#e3e7e8', accent:'#8fa8a0', every:6});
      LBL(-247, -730, r.top + 12, '大学城研究生公寓', 'UTown Residence', '🏠'); };
    T[120] = b => { resTower(b, {h:80.4, wall:'#f1f2ef', band:'#4a5c68', ledge:'#e0e4e5', fin:'#dfe3e4', crown:'#e3e7e8', accent:'#8fa8a0', every:6});
      // the two-level atrium link between the towers: glazed bridge block with a planted roof, the water wall cascading down its face
      const A = [-262, -727], B = [-214, -735], g = Math.min(GY(A[0], A[1]), GY(B[0], B[1])), ry = -Math.atan2(B[1] - A[1], B[0] - A[0]), c = [(A[0] + B[0])/2, (A[1] + B[1])/2], L = L2(A, B);
      M.gl.c('#5d7e8f'); boxV(M.gl, L*0.85, 7.4, 6, c[0], g - 0.5, c[1], ry); W.c('#eceeec'); boxV(W, L*0.9, 0.6, 7.2, c[0], g + 6.9, c[1], ry); M.veg.c('#5f8f47'); boxV(M.veg, L*0.8, 0.3, 6, c[0], g + 7.5, c[1], ry);
      M.wat.c('#fff'); const Rp = rotP2(c[0], c[1], ry); const w0 = Rp(-4, 0, -3.1); boxV(M.wat, 8, 6.4, 0.12, w0[0], g + 0.3, w0[2], ry); };

    // ---------- the district-cooling plant: thermal storage tank (159) and cooling towers ----------
    T[159] = b => { const [x, z, r] = circOf(b.P), g0 = gRange(b.P)[0], h = 21, V = W;
      V.c('#e3e6e6'); cyl(V, r, r, h + 1.6, x, g0 - 1.6, z, 30); V.c('#cdd2d3'); lathe(V, [[r + 0.25, 0], [r*0.6, 1.4], [0, 2.1]], x, g0 + h, z, 30);
      V.c('#b9c0c3'); for (let k = 0; k < 7; k++) cyl(V, r + 0.07, r + 0.07, 0.3, x, g0 + 2.4 + k*2.6, z, 30);
      // handrail ring + spiral stair round the shell
      V.c('#8f979a'); cyl(V, r + 0.9, r + 0.9, 1.0, x, g0 + h, z, 30); for (let k = 0; k < 18; k++){ const a0 = k/18*TAU*1.25 + 0.5, a1 = (k + 1)/18*TAU*1.25 + 0.5, y0 = g0 + 1 + k*(h - 1)/18, y1 = g0 + 1 + (k + 1)*(h - 1)/18;
        seg(V, [x + Math.cos(a0)*(r + 0.8), y0, z + Math.sin(a0)*(r + 0.8)], [x + Math.cos(a1)*(r + 0.8), y1, z + Math.sin(a1)*(r + 0.8)], 0.45, 4); }
      // pipe rack to the cooling-tower row
      V.c('#7f8a8f'); for (const dz of [-1.2, 0, 1.2]) seg(V, [x + 3, g0 + 4 + dz*0.3, z + r - 1], [x + 4, g0 + 4 + dz*0.3, z + r + 8], 0.35, 6);
      lamp(x, g0 + h + 2, z, [235, 242, 255]); };
    const coolT = b => { const P = b.P, [lo] = gRange(P), h = 6.2, ob = obb(P);
      W.c('#a6adaf'); prism(W, P, lo - 1, lo + 1.2, true); W.c('#59626a'); edges(P, (a, e, L, ux, uz, nn) => { quadE(W, a, e, lo + 1.2, lo + h, 0, nn); });
      W.c('#8c9599'); for (let y = lo + 1.6; y < lo + h; y += 0.7) ledge(W, P, y, 0.06, 0.12, '#8c9599');
      W.c('#c1c6c8'); capV(W, P, lo + h); const n = Math.max(1, Math.round(ob.L/6));
      for (let k = 0; k < n; k++){ const p = rotP2(ob.cx, ob.cz, ob.ry)((k - (n - 1)/2)*ob.L/n, 0, 0), rr = Math.min(ob.W, ob.L/n)*0.38; W.c('#b7bdc0'); cyl(W, rr, rr*0.92, 1.8, p[0], lo + h, p[2], 12); W.c('#353b3f'); cyl(W, rr*0.85, rr*0.85, 0.05, p[0], lo + h + 1.75, p[2], 12, true); } };
    for (const i of [0, 24, 67, 87, 122, 138]) T[i] = coolT;

    // ---------- the residential colleges: slab towers, sky terraces, learn lobes, dining halls, multi-purpose halls ----------
    const collegeTower = (b, o) => { const P = b.P, [lo] = gRange(P), top = lo + o.h, fl = floorsOf(lo, top, F_RS);
      walls(W, P, lo - 1.6, top + 1.4, o.wall);
      const sky = k => o.sky.includes(k);
      bands(M.wr, P, lo, top, F_RS, o.band, 0.24, 0.8, {skip0:true, skipF:sky, e:0.45});
      // slab lines and the window-surround frames on the long faces
      for (let k = 1; k < fl.length; k++) if (!sky(k)) ledge(W, P, fl[k] + F_RS*0.82, 0.16, 0.38, o.ledge);
      fins(P, lo + F_RS, top + 1.4, o.finS || 3.3, 0.5, o.fin, (nn, L) => L > 18, 0.09);
      // accent panels: coloured bay infills in a stepping pattern on the long faces
      edges(P, (a, e, L, ux, uz, nn) => { if (L < 18) return; const nb = Math.floor(L/(o.finS || 3.3)); W.c(o.accent);
        for (let k = 1; k < fl.length - 1; k++){ if (sky(k)) continue; const j = (k*5 + b.i) % nb; if ((k + j) % 3) continue; const u0 = j*(L/nb) + 0.3, u1 = u0 + L/nb - 0.6;
          W.q([a[0] + ux*u0 + nn[0]*0.12, fl[k] + 0.3, a[1] + uz*u0 + nn[1]*0.12], [a[0] + ux*u1 + nn[0]*0.12, fl[k] + 0.3, a[1] + uz*u1 + nn[1]*0.12], [a[0] + ux*u1 + nn[0]*0.12, fl[k] + F_RS - 0.3, a[1] + uz*u1 + nn[1]*0.12], [a[0] + ux*u0 + nn[0]*0.12, fl[k] + F_RS - 0.3, a[1] + uz*u0 + nn[1]*0.12]); } });
      // sky terraces: open double-height voids with planters and a lit soffit
      for (const k of o.sky){ const y = fl[k]; if (y === undefined) continue; W.c('#30373b'); prism(W, offsetPoly(P, 0.08), y + 0.2, y + F_RS*2 - 0.3, true);
        M.veg.c('#5a8c43', 0.12); prism(M.veg, offsetPoly(P, 0.4), y, y + 1.1, true); capV(M.veg, offsetPoly(P, 0.4), y + 1.1); M.warm.c('#fff'); prism(M.warm, offsetPoly(P, 0.1), y + F_RS*2 - 0.5, y + F_RS*2 - 0.3, true); }
      // ground: glazed common lounges, entrance canopy on the longest face
      M.gl.c('#57778a'); edges(P, (a, e, L, ux, uz, nn) => quadE(M.gl, a, e, lo - 1.6, lo + F_RS*0.92, 0.05, nn));
      { const [a, e, nn] = edgeN(P, longest(P)); const t0 = 0.35, t1 = 0.65; canopy([lerp(a[0], e[0], t0), lerp(a[1], e[1], t0)], [lerp(a[0], e[0], t1), lerp(a[1], e[1], t1)], nn, GY((a[0] + e[0])/2, (a[1] + e[1])/2) + 3.6, 3.5, '#eef0ef', true); }
      // crown: roof frame (pergola) over the roof terrace + plant
      W.c('#bcc2c4'); capV(W, P, top + 1.4); parapet(P, top + 1.4, 1.1, o.wall);
      const I = offsetPoly(P, -1.0); W.c(o.crown); prism(W, I, top + 1.4, top + 4.8, true); const ob = obb(P), Rp = rotP2(ob.cx, ob.cz, ob.ry);
      for (let u = -ob.L/2 + 3; u < ob.L/2 - 2; u += 3){ const p = Rp(u, 0, 0); if (inPoly(P, p[0], p[2])) boxV(W, 0.3, 0.35, ob.W*0.7, p[0], top + 4.8, p[2], ob.ry); }
      rooftop(offsetPoly(P, -3), top + 1.4, 3, b.i);
      return {lo, top}; };
    const hallMPH = (b, o) => { const P = b.P, [lo] = gRange(P), top = lo + o.h, f = frame(P);
      walls(W, P, lo - 1.6, top, o.wall); M.gl.c('#55768a'); edges(P, (a, e, L, ux, uz, nn) => quadE(M.gl, a, e, lo, lo + 3.6, 0.05, nn));
      ledge(W, P, lo + 3.6, 0.35, 1.6, '#eef0ef'); M.wb.c('#3f5566'); edges(P, (a, e, L, ux, uz, nn) => quadE(M.wb, a, e, top - 3.4, top - 1.0, 0.05, nn));
      fins(P, lo + 4.0, top - 3.6, 1.6, 0.35, o.fin, (nn, L) => L > 10, 0.06); if (o.vines) vines(P, lo + 4, top - 3.6, 3.2, 1.8, (nn, L) => L > 20, 0.7);
      W.c(o.roof); capV(W, P, top); vaultV(W, W, f.cx, f.cz, f.L + 1.6, f.W + 1.6, top, Math.min(f.W*0.09, 2.6), f.ry, 10);
      W.c('#dfe3e4'); for (let k = -2; k <= 2; k++){ const p = f.F(k*f.L/5, 0, 0); boxV(W, 0.5, 0.25, f.W + 2.2, p[0], top + Math.min(f.W*0.09, 2.6) - 0.05, p[2], f.ry); }
      lamp(f.cx, lo + 3, f.cz); return {lo, top}; };
    const dining = (b, o) => { const P = b.P, [lo] = gRange(P), top = lo + o.h;
      M.gl.c('#5a7b8b'); edges(P, (a, e, L, ux, uz, nn) => quadE(M.gl, a, e, lo - 1.6, lo + 5.6, 0.03, nn)); M.warm.c('#fff'); edges(P, (a, e, L, ux, uz, nn) => { if (L > 10) quadE(M.warm, [lerp(a[0], e[0], 0.2), lerp(a[1], e[1], 0.2)], [lerp(a[0], e[0], 0.8), lerp(a[1], e[1], 0.8)], lo + 4.6, lo + 5.4, 0.08, nn); });
      ledge(W, P, lo + 5.6, 0.5, 2.2, '#eff0ef'); walls(W, P, lo + 5.6, top + 1.0, o.wall); bands(M.wb, P, lo + 6, top, F_AC, '#3f5465', 0.15, 0.85, {e:0.6});
      louvres(P, floorsOf(lo + 6, top, F_AC).map(y => y + F_AC*0.88), 0.9, o.blade || '#d7dcde');
      W.c('#c7ccce'); capV(W, P, top + 1.0); greenR(P, top + 1.0, 1.4); W.c('#c8cdcf'); for (const p of offsetPoly(P, 1.6)){ const g = GY(p[0], p[1]); boxV(W, 0.3, lo + 5.6 - g + 0.5, 0.3, p[0], g - 0.5, p[1]); }
      return {lo, top}; };
    const lobe = (b, o) => { const P = b.P, [lo] = gRange(P), top = lo + (o.h || 7.6);
      M.gl.c('#57798a'); edges(P, (a, e, L, ux, uz, nn) => quadE(M.gl, a, e, lo - 1.6, top, 0.02, nn)); ledge(W, P, lo + 3.8, 0.4, 0.6, '#eceeed');
      fins(P, lo + 0.2, top, 1.2, 0.45, o.fin || '#b5936c', null, 0.06);
      slab(W, P, top, 0.6, 1.8, '#eef0ef'); greenR(P, top + 0.6, 1.0); return {lo, top}; };

    T[141] = b => { const r = collegeTower(b, {h:67.2, wall:'#f2f2ef', band:'#465865', ledge:'#e2e5e5', fin:'#dde1e2', accent:'#7fa36a', crown:'#e4e7e7', sky:[4, 9, 14]});
      LBL(-256, -852, r.top + 10, '坦布苏书院', 'Tembusu College', '🎓'); };
    T[5] = b => { const r = collegeTower(b, {h:67.2, wall:'#f2f1ec', band:'#475964', ledge:'#e3e5e4', fin:'#dde0e1', accent:'#c48a5c', crown:'#e5e6e4', sky:[5, 10, 15]});
      LBL(-282, -906, r.top + 10, '肉桂书院', 'Cinnamon College', '🎓'); };
    T[58] = b => { const r = collegeTower(b, {h:60.6, wall:'#f1f1ee', band:'#4a5966', ledge:'#e1e4e5', fin:'#dadfe0', accent:'#8e7bb0', crown:'#e3e6e7', sky:[4, 9, 13], finS:3.0});
      LBL(-318, -1006, r.top + 10, '爱丽丝与彼得·陈书院', 'College of Alice & Peter Tan', '🎓'); };
    T[85] = b => { const r = collegeTower(b, {h:60.6, wall:'#f1f1ee', band:'#4a5966', ledge:'#e1e4e5', fin:'#dadfe0', accent:'#d1a64e', crown:'#e3e6e7', sky:[5, 10, 14], finS:3.0});
      LBL(-302, -1077, r.top + 10, '第四住宿书院', 'Residential College 4 (RC4)', '🎓'); };
    T[69] = b => hallMPH(b, {h:15.5, wall:'#eceeec', fin:'#cfd5d7', roof:'#b3bfc6', vines:true});
    T[9] = b => hallMPH(b, {h:12.5, wall:'#eceeec', fin:'#cfd5d7', roof:'#b7c2c8'});
    T[164] = b => hallMPH(b, {h:12.5, wall:'#eceeec', fin:'#cfd5d7', roof:'#b7c2c8', vines:true});
    T[2] = b => hallMPH(b, {h:14.4, wall:'#efeee9', fin:'#c49a6c', roof:'#b5bfc3'});
    T[115] = b => dining(b, {h:11.1, wall:'#eff0ee'});
    T[94] = b => dining(b, {h:14.4, wall:'#eff0ee'});
    T[153] = b => lobe(b, {});
    T[166] = b => lobe(b, {});
    T[162] = b => lobe(b, {fin:'#c9cfd1'});
    T[124] = b => { const P = b.P, [lo] = gRange(P); walls(W, P, lo - 1.6, lo + 5.4, '#d9dcd8'); W.c('#5f676b'); edges(P, (a, e, L, ux, uz, nn) => { for (let y = lo + 1; y < lo + 5; y += 0.5) quadE(W, [lerp(a[0], e[0], 0.15), lerp(a[1], e[1], 0.15)], [lerp(a[0], e[0], 0.85), lerp(a[1], e[1], 0.85)], y, y + 0.12, 0.05, nn); }); slab(W, P, lo + 5.4, 0.4, 0.6, '#e9ebea'); };
    T[90] = b => { const [lo] = gRange(b.P); api.shed(b.P, lo, 3.6, '#a8b6bc'); };
    T[133] = b => { const [lo] = gRange(b.P); api.shed(b.P, lo, 3.2, '#e6e9e9'); };

    // ---------- the former Yale-NUS campus (now NUS College): low blocks with deep eaves and bronze screens, college towers ----------
    const BRONZE = ['#8a6847', '#7d5f42', '#94704c'];
    const screens = (P, y0, y1, k, frac) => { edges(P, (a, e, L, ux, uz, nn) => { if (L < 6) return; const nb = Math.max(1, Math.floor(L/3.6)), w = L/nb;
      for (let j = 0; j < nb; j++){ if (((j*7 + k*3) % 10)/10 >= frac) continue; const u0 = j*w + 0.25, u1 = (j + 1)*w - 0.25, x0 = a[0] + ux*u0 + nn[0]*0.45, z0 = a[1] + uz*u0 + nn[1]*0.45, x1 = a[0] + ux*u1 + nn[0]*0.45, z1 = a[1] + uz*u1 + nn[1]*0.45;
        W.c(BRONZE[(j + k) % 3]); W.q([x0, y0, z0], [x1, y0, z1], [x1, y1, z1], [x0, y1, z0]);
        // the textile-pattern perforation read as a darker diamond lattice line pair
        W.c('#5a4532'); W.q([x0 + nn[0]*0.03, lerp(y0, y1, 0.48), z0 + nn[1]*0.03], [x1 + nn[0]*0.03, lerp(y0, y1, 0.48), z1 + nn[1]*0.03], [x1 + nn[0]*0.03, lerp(y0, y1, 0.52), z1 + nn[1]*0.03], [x0 + nn[0]*0.03, lerp(y0, y1, 0.52), z0 + nn[1]*0.03]); } }); };
    const ncLow = (b, o) => { const P = b.P, [lo] = gRange(P), top = lo + (o.h || b.h);
      walls(W, P, lo - 1.6, top, o.wall || '#e9e3d6');
      bands(M.gl, P, lo, top, F_AC, '#4a5a60', 0.08, 0.9, {e:0.5});
      fins(P, lo + 0.2, top, 1.8, 0.3, '#5b5148', (nn, L) => L > 8, 0.05);
      for (const y of floorsOf(lo, top, F_AC).slice(1)) ledge(W, P, y - 0.1, 0.35, 0.35, '#ece6da');
      if (!o.noScreens) screens(P, lo + 4.2, top - 0.4, b.i, o.scr || 0.45);
      // the deep over-sailing flat roof (white soffit) with a green top
      const O = slab(W, P, top, 0.55, 2.0, '#f2efe7'); greenR(P, top + 0.55, 1.4, '#6b8a4c');
      W.c('#d0c7b8'); for (const p of O){ const g = GY(p[0], p[1]); seg(W, [p[0], g - 0.4, p[1]], [p[0], top, p[1]], 0.13, 4); }
      return {lo, top}; };
    const ncTower = (b, o) => { const P = b.P, [lo] = gRange(P), top = lo + b.h, fl = floorsOf(lo, top, F_RS);
      walls(W, P, lo - 1.6, top + 1.2, '#e7dfd0');
      // skygarden on every other floor: planted ledge + recessed dark band on the longer faces; ordinary floors: window bands + bronze fins
      bands(M.wr, P, lo, top, F_RS, '#3f4446', 0.16, 0.84, {skip0:true, e:0.5});
      for (let k = 2; k < fl.length - 1; k += 2){ const y = fl[k];
        edges(P, (a, e, L, ux, uz, nn) => { if (L < 7) return; const t0 = (k*3 + b.i) % 4 === 0 ? 0.05 : 0.3, t1 = t0 + 0.55, A = [lerp(a[0], e[0], t0), lerp(a[1], e[1], t0)], B = [lerp(a[0], e[0], t1), lerp(a[1], e[1], t1)];
          W.c('#2c3133'); quadE(W, A, B, y + 0.1, y + F_RS - 0.15, 0.1, nn); M.veg.c((k >> 1) % 2 ? '#4f8139' : '#5e8f45', 0.1);
          const C = [B[0] + nn[0]*1.0, B[1] + nn[1]*1.0], D = [A[0] + nn[0]*1.0, A[1] + nn[1]*1.0]; M.veg.q([A[0], y + 1.0, A[1]], [B[0], y + 1.0, B[1]], [C[0], y + 1.0, C[1]], [D[0], y + 1.0, D[1]]); quadE(M.veg, D, C, y, y + 1.0, 0, null);
          W.c('#e7dfd0'); quadE(W, D, C, y - 0.25, y, 0, null); }); }
      fins(P, lo + F_RS, top + 1.2, 2.6, 0.45, '#8a6847', (nn, L) => L > 9, 0.08);
      M.gl.c('#4f6670'); edges(P, (a, e, L, ux, uz, nn) => quadE(M.gl, a, e, lo - 1.6, lo + F_RS*0.95, 0.05, nn));
      // crown: a perforated bronze screen round the roof plant
      W.c('#c9bfae'); capV(W, P, top + 1.2); W.c('#a08260'); prism(W, offsetPoly(P, -0.6), top + 1.2, top + 4.4, true); ledge(W, offsetPoly(P, -0.6), top + 4.4, 0.3, 0.3, '#e7dfd0');
      W.c('#7d6347'); edges(offsetPoly(P, -0.6), (a, e, L, ux, uz, nn) => { const n2 = Math.floor(L/1.2); for (let k = 1; k < n2; k++){ const t = k/n2, x = lerp(a[0], e[0], t) + nn[0]*0.05, z = lerp(a[1], e[1], t) + nn[1]*0.05; W.q([x - ux*0.12, top + 1.3, z - uz*0.12], [x + ux*0.12, top + 1.3, z + uz*0.12], [x + ux*0.12, top + 4.3, z + uz*0.12], [x - ux*0.12, top + 4.3, z - uz*0.12]); } });
      return {lo, top}; };
    for (const i of [10, 13, 23, 38, 46, 47, 53, 71, 97, 134, 149, 165]) T[i] = b => ncLow(b, {});
    T[44] = b => ncLow(b, {scr:0.5});
    T[119] = b => { const r = ncLow(b, {scr:0.55}); LBL(-410, -960, r.top + 26, '国大书院（原耶鲁-国大学院校园）', 'NUS College (former Yale-NUS campus)', '🎓'); };
    T[29] = b => ncLow(b, {noScreens:true, h:8.9});
    T[11] = b => { const P = b.P, [lo] = gRange(P), top = lo + 5.4; M.gl.c('#59737c'); edges(P, (a, e, L, ux, uz, nn) => quadE(M.gl, a, e, lo - 1.6, top, 0.02, nn)); slab(W, P, top, 0.5, 2.2, '#f2efe7'); };
    for (const i of [4, 64, 70, 121, 161]) T[i] = b => ncTower(b, {});
    // the central green: the eco-pond (biofiltration) between the two long academic wings
    const ncPond = () => { const P0 = [[-7, -11], [4, -13], [8, -2], [5, 10], [-6, 9]]; let P = null;
      for (const [cx, cz] of [[-418, -948], [-418, -960], [-416, -975], [-418, -938], [-414, -990], [-425, -955], [-424, -970], [-411, -960], [-424, -985]]){ const Q = P0.map(([u, v]) => [cx + u*0.8, cz + v*0.8]); if (Q.concat([[cx, cz]]).every(p => api.free(p[0], p[1]))){ P = Q; break; } }
      if (!P) return; const g = Math.min(...P.map(p => GY(p[0], p[1])));
      M.wat.c('#fff'); capV(M.wat, P, g + 0.15); W.c('#a8a294'); prism(W, offsetPoly(P, 0.5), g - 0.3, g + 0.3, true); M.veg.c('#5b8a43'); for (const p of offsetPoly(P, 1.4)) boxV(M.veg, 1.0, 0.9, 1.0, p[0], g, p[1]); occupy(P, 1);
      for (const [x, z] of [[-420, -975], [-410, -995], [-428, -1010], [-405, -915]]) if (api.free(x, z)) tree(x, z, 4.6); };

    // ======================= THE SPORTS CLUSTER =======================
    // University Sports Centre (20): the main sports hall under a barrel vault, two-storey wings (gym, squash), viewing deck to the pool
    T[20] = b => { const P = b.P, [lo] = gRange(P), top = lo + 8.6, sp = {F:'a', ld:0.85, a:0.24, b:0.86, brick:true}, o = {wall:'#e2dccd', band:'#43525d', ledge:'#f0ede4', par:0.8};
      facade([[P, false]], lo, top, sp, o); W.c('#9fb6c4'); capV(W, P, top); parapet(P, top, 0.8, '#e6e0d3');
      // hall: rectangle inside the footprint, rising over the wings
      const x = -60, z = -136, ry = -0.08, Rp = rotP2(x, z, ry), Lh = 52, Wh = 34, Q = [[-Wh/2, -Lh/2], [Wh/2, -Lh/2], [Wh/2, Lh/2], [-Wh/2, Lh/2]].map(([u, v]) => { const p = Rp(u, 0, v); return [p[0], p[2]]; });
      const yh = lo + 14.5; walls(W, Q, top, yh, '#e4e2da'); M.wb.c('#3e5361'); edges(Q, (a, e, L, ux, uz, nn) => quadE(M.wb, a, e, top + 1.2, yh - 0.8, 0.05, nn));
      W.c('#d5d8d6'); edges(Q, (a, e, L, ux, uz, nn) => { const n = Math.floor(L/4.5); for (let k = 0; k <= n; k++){ const t = k/n, px = lerp(a[0], e[0], t) + nn[0]*0.2, pz = lerp(a[1], e[1], t) + nn[1]*0.2; boxV(W, 0.5, yh - top, 0.5, px, top, pz); } });
      W.c('#aebfca'); vaultV(W, W, x, z, Wh + 1.5, Lh + 1.5, yh, 4.2, ry + HP, 12); W.c('#dfe4e6'); for (let k = -4; k <= 4; k++){ const p = Rp(0, 0, k*Lh/9); boxV(W, Wh + 2, 0.3, 0.6, p[0], yh + 4.1, p[2], ry); }
      // viewing gallery & canopy along the pool (east) face
      edges(P, (a, e, L, ux, uz, nn) => { if (L > 25 && nn[0] > 0.8) canopy([lerp(a[0], e[0], 0.08), lerp(a[1], e[1], 0.08)], [lerp(a[0], e[0], 0.92), lerp(a[1], e[1], 0.92)], nn, lo + 4.2, 3.2, '#eceeed', true); });
      LBL(-60, -136, yh + 12, '大学体育中心', 'University Sports Centre', '🏟');
    };
    const sportHall = (b, o) => { const P = b.P, [lo] = gRange(P), top = lo + o.h, f = frame(P), A = Math.abs(sarea(P)), fill = A/(f.L*f.W);
      walls(W, P, lo - 1.6, top, o.wall);
      // ribbed metal cladding, a high translucent clerestory, glazed entrance zone at the base
      W.c(o.rib); edges(P, (a, e, L, ux, uz, nn) => { const n = Math.floor(L/2.4); for (let k = 1; k < n; k++){ const t = k/n, x = lerp(a[0], e[0], t) + nn[0]*0.1, z = lerp(a[1], e[1], t) + nn[1]*0.1; W.q([x - ux*0.12, lo + 4.2, z - uz*0.12], [x + ux*0.12, lo + 4.2, z + uz*0.12], [x + ux*0.12, top - 3.6, z + uz*0.12], [x - ux*0.12, top - 3.6, z - uz*0.12]); } });
      M.wb.c(o.clere || '#8ea4ae'); edges(P, (a, e, L, ux, uz, nn) => quadE(M.wb, a, e, top - 3.4, top - 0.6, 0.06, nn));
      M.gl.c('#55727f'); edges(P, (a, e, L, ux, uz, nn) => { if (L > 10) quadE(M.gl, [lerp(a[0], e[0], 0.1), lerp(a[1], e[1], 0.1)], [lerp(a[0], e[0], 0.9), lerp(a[1], e[1], 0.9)], lo, lo + 3.6, 0.06, nn); });
      ledge(W, P, lo + 3.8, 0.3, 1.4, '#eceeed'); if (o.brick) { W.c('#8f5d47'); edges(P, (a, e, L, ux, uz, nn) => quadE(W, a, e, lo - 0.3, lo + 1.0, 0.07, nn)); }
      W.c(o.roof); capV(W, P, top);
      if (fill > 0.75){ vaultV(W, W, f.cx, f.cz, f.L + 1.4, f.W + 1.4, top, Math.min(f.W*0.1, 4.2), f.ry, 12); M.gl.c('#cfe0e6'); boxV(M.gl, f.L*0.7, 0.4, 2.2, f.cx, top + Math.min(f.W*0.1, 4.2) - 0.1, f.cz, f.ry); }
      else { // irregular: flat roof with long ridge monitors
        W.c(o.roof); for (const v of [-0.22, 0.22]){ const p = f.F(0, 0, v*f.W); const L = f.L*0.6; boxV(W, L, 1.4, 3.0, p[0], top, p[2], f.ry); M.gl.c('#cfe0e6'); boxV(M.gl, L*0.95, 1.0, 3.05, p[0], top + 0.3, p[2], f.ry); W.c(o.roof); } }
      parapet(P, top, 0.6, o.wall); return {lo, top}; };
    T[91] = b => { const r = sportHall(b, {h:14.4, wall:'#e6e3d8', rib:'#d8d4c8', roof:'#93adbd', brick:true}); LBL(5, -250, r.top + 10, '多用途体育馆 1–4', 'MPSH 1–4 (Multi-Purpose Sports Halls)', '🏟'); };
    T[96] = b => sportHall(b, {h:17.0, wall:'#e1e4e3', rib:'#cdd2d2', roof:'#b9c3c8', clere:'#9fb6bf'});
    T[132] = b => { const r = sportHall(b, {h:17.0, wall:'#e1e4e3', rib:'#cdd2d2', roof:'#b9c3c8', clere:'#9fb6bf'}); LBL(38, -205, r.top + 9, '多用途体育馆 5、6', 'MPSH 5 & 6', '🏟'); };
    // Singapore Wind Tunnel Facility (101): tall clad shed round the closed-circuit tunnel; the fan stack and duct visible on the roof
    T[101] = b => { const P = b.P, [lo] = gRange(P), top = lo + 16, f = frame(P);
      walls(W, P, lo - 1.6, top, '#d7dbdc'); W.c('#c3c8ca'); edges(P, (a, e, L, ux, uz, nn) => { const n = Math.floor(L/1.8); for (let k = 1; k < n; k++){ const t = k/n, x = lerp(a[0], e[0], t) + nn[0]*0.08, z = lerp(a[1], e[1], t) + nn[1]*0.08; W.q([x - ux*0.1, lo + 0.5, z - uz*0.1], [x + ux*0.1, lo + 0.5, z + uz*0.1], [x + ux*0.1, top - 0.3, z + uz*0.1], [x - ux*0.1, top - 0.3, z - uz*0.1]); } });
      M.wb.c('#3e5361'); edges(P, (a, e, L, ux, uz, nn) => { if (L > 20) quadE(M.wb, [lerp(a[0], e[0], 0.05), lerp(a[1], e[1], 0.05)], [lerp(a[0], e[0], 0.45), lerp(a[1], e[1], 0.45)], lo + 1, lo + 7.6, 0.06, nn); });
      ledge(W, P, top - 1, 0.6, 0.4, '#e9ecec'); W.c('#a9b2b6'); capV(W, P, top);
      // roller doors
      W.c('#9aa3a7'); edges(P, (a, e, L, ux, uz, nn) => { if (L > 40) quadE(W, [lerp(a[0], e[0], 0.62), lerp(a[1], e[1], 0.62)], [lerp(a[0], e[0], 0.75), lerp(a[1], e[1], 0.75)], lo, lo + 7, 0.1, nn); });
      // long roof monitor (daylight to the test hall) and the air-handling plant
      const Rp = f.F; W.c('#c4cacc'); const mp = Rp(0, 0, 0); boxV(W, f.L*0.7, 1.6, 6, mp[0], top, mp[2], f.ry); M.gl.c('#9fb7c1'); boxV(M.gl, f.L*0.68, 1.1, 6.05, mp[0], top + 0.25, mp[2], f.ry);
      W.c('#9da7ab'); for (const u of [-0.3, 0.3]){ const p = Rp(u*f.L, 0, -f.W*0.3); boxV(W, 7, 2.6, 5, p[0], top, p[2], f.ry); cyl(W, 1.2, 1.2, 1.4, p[0], top + 2.6, p[2], 10); }
      LBL(-72, -282, top + 12, '新加坡风洞设施', 'Singapore Wind Tunnel Facility', '🔬'); };
    // two long sports annexes beside MPSH 6 (112, 171) and the small service buildings
    T[112] = T[171] = b => { const P = b.P, [lo] = gRange(P), top = lo + b.h; walls(W, P, lo - 1.6, top, '#e2ddd0');
      W.c('#cfc9bb'); edges(P, (a, e, L, ux, uz, nn) => { const n = Math.floor(L/3.6); for (let k = 1; k < n; k++){ const t = k/n, x = lerp(a[0], e[0], t) + nn[0]*0.12, z = lerp(a[1], e[1], t) + nn[1]*0.12; W.q([x - ux*0.2, lo, z - uz*0.2], [x + ux*0.2, lo, z + uz*0.2], [x + ux*0.2, top, z + uz*0.2], [x - ux*0.2, top, z - uz*0.2]); } });
      M.wb.c('#43525d'); edges(P, (a, e, L, ux, uz, nn) => { quadE(M.wb, a, e, top - 3.2, top - 1.0, 0.05, nn); if (L > 20) quadE(M.wb, [lerp(a[0], e[0], 0.05), lerp(a[1], e[1], 0.05)], [lerp(a[0], e[0], 0.95), lerp(a[1], e[1], 0.95)], lo + 1.0, lo + 3.4, 0.05, nn); });
      ledge(W, P, lo + 3.6, 0.25, 0.9, '#efece4'); W.c('#97afbf'); capV(W, P, top); const f = frame(P); hipV(W, f.cx, f.cz, f.L, f.W, top, 1.6, f.ry, 0.6); };
    const util = b => { const P = b.P, [lo] = gRange(P), top = lo + Math.max(4.5, b.h); walls(W, P, lo - 1.6, top, '#cbc8bf'); W.c('#6f777b'); edges(P, (a, e, L, ux, uz, nn) => { if (L > 6) for (let y = lo + 1.2; y < lo + 3.4; y += 0.45) quadE(W, [lerp(a[0], e[0], 0.25), lerp(a[1], e[1], 0.25)], [lerp(a[0], e[0], 0.75), lerp(a[1], e[1], 0.75)], y, y + 0.12, 0.05, nn); });
      ledge(W, P, top, 0.4, 0.4, '#d9d6ce'); W.c('#a3a6a2'); capV(W, P, top + 0.2); rooftop(P, top + 0.2, 1, b.i); };
    for (const i of [42, 59, 143, 168]) T[i] = util;
    // University Health Centre (142): the cross-shaped two-storey clinic, blue-grey hipped roofs, drop-off porch
    T[142] = b => { const P = b.P, [lo] = gRange(P), top = lo + 8.0;
      facade([[P, false]], lo, top, {F:'a', ld:0.8, a:0.24, b:0.86, brick:true}, {wall:'#efeee8', band:'#4b6b78', ledge:'#f6f6f2', par:0});
      W.c('#efeee8'); capV(W, P, top); api.pitchRoof(P, top, 0.28, '#8aa8bb', 1.0, b.i);
      { const [a, e, nn] = edgeN(P, longest(P)); canopy([lerp(a[0], e[0], 0.3), lerp(a[1], e[1], 0.3)], [lerp(a[0], e[0], 0.62), lerp(a[1], e[1], 0.62)], nn, lo + 3.8, 6, '#f1f2f0', true); }
      LBL(50, -62, top + 12, '大学保健中心', 'University Health Centre', '🏥'); };
    // NUS Staff Club (157): two storeys with a wide verandah under a hipped roof
    T[157] = b => { const P = b.P, [lo] = gRange(P), top = lo + 7.6;
      facade([[P, false]], lo, top, {F:'a', ld:0.6, a:0.18, b:0.9}, {wall:'#ece6d8', band:'#4f5a5f', ledge:'#f4f1ea', par:0});
      M.warm.c('#fff'); edges(P, (a, e, L, ux, uz, nn) => { if (L > 12) quadE(M.warm, [lerp(a[0], e[0], 0.2), lerp(a[1], e[1], 0.2)], [lerp(a[0], e[0], 0.8), lerp(a[1], e[1], 0.8)], lo + 0.6, lo + 3.2, 0.1, nn); });
      ledge(W, P, lo + 3.6, 0.3, 2.4, '#eeeae0'); W.c('#c8c3b6'); for (const p of offsetPoly(P, 2.2)){ const g = GY(p[0], p[1]); boxV(W, 0.3, lo + 3.6 - g + 0.5, 0.3, p[0], g - 0.5, p[1]); }
      W.c('#ece6d8'); capV(W, P, top); api.pitchRoof(P, top, 0.3, '#7f9fb3', 1.2, b.i);
      LBL(-24, -80, top + 10, '国大教职员俱乐部', 'NUS Staff Club', '🍜'); };

    // ---------- build every claimed building ----------
    for (const b of claimed){ const f = T[b.i]; try { if (f){ f(b); built++; } else api.building(b); } catch (e){ console.error('nusutown building ' + b.i, e); try { api.building(b); } catch (e2){} } }
    // former Yale-NUS: the entrance pavilion at the south end of the central courtyard — a large inward-sloping roof whose square oculus
    // drops the rain into a circular reflecting pool, on slender columns, with glass-box stair towers either side
    const inBld = (x, z) => api.BLD.some(B => Math.abs(B.c[0] - x) < 90 && Math.abs(B.c[1] - z) < 90 && inPoly(B.P, x, z));
    try { let at = null; for (const [x, z] of [[-418, -912], [-418, -917], [-418, -922]]){ if ([[0, 0], [-8.5, -8.5], [8.5, -8.5], [8.5, 8.5], [-8.5, 8.5], [-13, 0], [13, 0]].every(([u, v]) => !inBld(x + u, z + v))){ at = [x, z]; break; } }
      if (at){ const [x, z] = at, g = GY(x, z), y = g + 7.2, h = 8, o = 1.6, ry = 0.08, Rp = rotP2(x, z, ry);
        const C = [[-h, -h], [h, -h], [h, h], [-h, h]].map(([u, v]) => Rp(u, y, v)), I = [[-o, -o], [o, -o], [o, o], [-o, o]].map(([u, v]) => Rp(u, y - 1.6, v));
        W.c('#ece8de'); for (let i = 0; i < 4; i++){ const j = (i + 1) % 4; W.q(C[i], C[j], I[j], I[i]); W.q([C[i][0], C[i][1] + 0.5, C[i][2]], [C[j][0], C[j][1] + 0.5, C[j][2]], [I[j][0], I[j][1] + 0.4, I[j][2]], [I[i][0], I[i][1] + 0.4, I[i][2]]); W.q(C[i], C[j], [C[j][0], C[j][1] + 0.5, C[j][2]], [C[i][0], C[i][1] + 0.5, C[i][2]]); }
        W.c('#cfc8ba'); for (const [u, v] of [[-h + 1, -h + 1], [h - 1, -h + 1], [h - 1, h - 1], [-h + 1, h - 1], [0, -h + 1], [0, h - 1], [-h + 1, 0], [h - 1, 0]]){ const p = Rp(u, 0, v); seg(W, [p[0], GY(p[0], p[2]) - 0.3, p[2]], [p[0], y + 0.2, p[2]], 0.22, 6); }
        M.wat.c('#fff'); const pool = []; for (let i = 0; i < 24; i++){ const a = i/24*TAU; pool.push([x + Math.cos(a)*4.2, z + Math.sin(a)*4.2]); } capV(M.wat, pool, g + 0.3); W.c('#d9d3c4'); prism(W, offsetPoly(pool, 0.5), g - 0.3, g + 0.45, true);
        M.gl.c('#7f9aa6'); for (const s2 of [-1, 1]){ const p = Rp(s2*(h + 3), 0, 0); boxV(M.gl, 4.2, y + 2 - g, 5, p[0], g - 0.3, p[2], ry); W.c('#e9e4d8'); boxV(W, 4.6, 0.5, 5.4, p[0], y + 1.7, p[2], ry); }
        lamp(x, y - 2, z); occupy([[x - h, z - h], [x + h, z - h], [x + h, z + h], [x - h, z + h]], 0.5); } } catch (e){ console.error('nusutown entrance', e); }
    try { ncPond(); } catch (e){ console.error('nusutown pond', e); }
    // CREATE: a sinuous water garden on the ground terrace between the tower and the Town Green
    try { const pts = []; for (let k = 0; k <= 16; k++){ const t = k/16; pts.push([-266 + Math.sin(t*TAU*1.2)*3.2 + t*6, -638 - t*34]); }
      for (let k = 0; k < pts.length - 1; k++){ const a = pts[k], c = pts[k + 1], L = L2(a, c), nx = -(c[1] - a[1])/L*1.3, nz = (c[0] - a[0])/L*1.3;
        if (![a, c].every(p => api.free(p[0], p[1]))) continue; const g = Math.min(GY(a[0], a[1]), GY(c[0], c[1]));
        const Q = [[a[0] - nx, a[1] - nz], [c[0] - nx, c[1] - nz], [c[0] + nx, c[1] + nz], [a[0] + nx, a[1] + nz]]; M.wat.c('#fff'); capV(M.wat, Q, g + 0.18); W.c('#d6d0c2'); for (const s2 of [-1, 1]){ const A = [a[0] + nx*s2*1.25, a[1] + nz*s2*1.25], B = [c[0] + nx*s2*1.25, c[1] + nz*s2*1.25]; quadE(W, A, B, g - 0.3, g + 0.35, 0, null); }
        if (k % 4 === 2) tree(a[0] + nx*3, a[1] + nz*3, 2.0, 'palm'); occupyLine([a, c], 1.6); } } catch (e){ console.error('nusutown water garden', e); }
    // Tembusu Hill and Stage: grass seating terraces stepping up the lawn round a small stage
    try { const PK = [[-293, -776], [-276, -781], [-271, -800], [-298, -801]], cx = -284.5, cz = -800, g = GY(cx, cz);
      W.c('#d8d2c4'); const st = []; for (let i = 0; i <= 12; i++){ const a = i/12*PI; st.push([cx + Math.cos(a)*4.2, cz + Math.sin(a)*3.2]); } prism(W, st, g - 0.3, g + 0.6, true); capV(W, st, g + 0.6);
      for (let k = 0; k < 6; k++){ const r0 = 5 + k*2.4, r1 = r0 + 2.4, y = g + 0.45 + k*0.5;
        for (let i = 0; i < 10; i++){ const a0 = PI*0.16 + i/10*PI*0.68, a1 = PI*0.16 + (i + 1)/10*PI*0.68, A = [cx + Math.cos(a0)*r0, cz + Math.sin(a0)*r0], B = [cx + Math.cos(a1)*r0, cz + Math.sin(a1)*r0], C = [cx + Math.cos(a1)*r1, cz + Math.sin(a1)*r1], D = [cx + Math.cos(a0)*r1, cz + Math.sin(a0)*r1];
          if (![A, B, C, D].every(p => inPoly(PK, p[0], p[1]))) continue; M.veg.c(k % 2 ? '#75a457' : '#69984d'); M.veg.q([A[0], y, A[1]], [B[0], y, B[1]], [C[0], y, C[1]], [D[0], y, D[1]]); W.c('#cfc8b8'); quadE(W, A, B, g - 0.3, y, 0, null); } }
      occupy(PK, 0); lamp(cx, g + 4, cz); } catch (e){ console.error('nusutown stage', e); }
    // Town Green: the timber deck laid between the roots of one of the five preserved trees (hiding the services below)
    { const x = -332, z = -728, g = GY(x, z); W.c('#a88b66'); const N = 20; for (let i = 0; i < N; i++){ const a0 = i/N*TAU, a1 = (i + 1)/N*TAU, r0 = 3.2, r1 = 9.5;
        const p = (a, r) => [x + Math.cos(a)*r, g + 0.45, z + Math.sin(a)*r]; W.q(p(a0, r0), p(a1, r0), p(a1, r1), p(a0, r1)); const q0 = p(a0, r1), q1 = p(a1, r1); W.q([q0[0], g - 0.3, q0[2]], [q1[0], g - 0.3, q1[2]], q1, q0); } }
    // College of Alice & Peter Tan: the terraced "paddy-field" lawn steps with coconut palms on the west side
    { const steps = []; for (let k = 0; k < 5; k++){ const z0 = -1000 - k*9, P = [[-366, z0], [-352, z0], [-352, z0 - 8.2], [-366, z0 - 8.2]]; if (P.every(p => api.free(p[0], p[1]))) steps.push([P, k]); }
      for (const [P, k] of steps){ const g = Math.min(...P.map(p => GY(p[0], p[1]))), y = g + 0.35 + (k % 2)*0.45; M.veg.c(k % 2 ? '#79a85a' : '#6c9b4f'); capV(M.veg, P, y); W.c('#cbbf9f'); prism(W, P, g - 0.4, y, true); tree(P[1][0] - 1.5, P[1][1] - 4, 2.2, 'palm'); occupy(P, 0.5); } }

    // ======================= the NUS Link Bridge over the AYE (274 m, S-shaped, 100 m main span) =======================
    // The app's road module already draws this road as an elevated deck on piers (OSM bridge), so it is not modelled twice:
    // here only its alignment and rise are kept, for the map label and to keep the shuttle buses off the deck.
    let DECK = null;
    try { const road = [[-169, -312], [-172, -326], [-179, -347], [-216, -422], [-225, -450], [-228, -472], [-228, -485], [-224, -501], [-217, -515], [-205, -530], [-197, -537]];
      const Q = api.resample(road, 6), n = Q.length, s = [0]; for (let i = 1; i < n; i++) s.push(s[i - 1] + L2(Q[i - 1], Q[i])); const Lt = s[n - 1];
      // where the alignment crosses the expressway carriageways (class-0 roads): the mean of the crossings
      const xs = []; for (const r of api.NUS_ROADS){ if (r.c > 1) continue; for (let j = 0; j < r.p.length - 1; j++){ const p = r.p[j], q = r.p[j + 1];
        for (let i = 0; i < n - 1; i++){ const a = Q[i], c = Q[i + 1], d = (c[0] - a[0])*(q[1] - p[1]) - (c[1] - a[1])*(q[0] - p[0]); if (Math.abs(d) < 1e-9) continue;
          const t = ((p[0] - a[0])*(q[1] - p[1]) - (p[1] - a[1])*(q[0] - p[0]))/d, u = ((p[0] - a[0])*(c[1] - a[1]) - (p[1] - a[1])*(c[0] - a[0]))/d; if (t >= 0 && t <= 1 && u >= 0 && u <= 1) xs.push(s[i] + t*L2(a, c)); } } }
      const sc = xs.length ? xs.reduce((m, v) => m + v, 0)/xs.length : Lt*0.62;
      const H = 8.2, deckY = i => { const g = GY(Q[i][0], Q[i][1]), t = s[i] < sc ? s[i]/sc : (Lt - s[i])/(Lt - sc), e = t*t*(3 - 2*t); return Math.max(g + 0.15, lerp(g + 0.15, 1.1 + H, Math.min(1, e*1.25))); };
      const Y = Q.map((p, i) => deckY(i)); DECK = {Q, Y};
      const mid = (() => { let k = 0; while (k < n - 1 && s[k] < sc) k++; return k; })();
      LBL(Q[mid][0], Q[mid][1], Y[mid] + 9, '国大连接桥', 'NUS Link Bridge (over the AYE)', '🏛'); } catch (e){ console.error('nusutown bridge', e); }

    // ======================= campus shuttle buses (plain white, no text) on the campus loop roads =======================
    let busGroup;
    try { if (typeof THREE !== 'undefined'){
      let seed = 0x5eed1; const rnd = () => { seed = (seed*1664525 + 1013904223) >>> 0; return seed/4294967296; };
      const RD = api.NUS_ROADS.filter(r => r.c === 10), NXs = [], NZs = [], ADJ = [], key = new Map();
      const nodeOf = (x, z) => { const gx = Math.round(x/5), gz = Math.round(z/5); for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++){ const L = key.get((gx + dx) + ',' + (gz + dz)); if (L) for (const k of L) if (Math.hypot(NXs[k] - x, NZs[k] - z) < 4.0) return k; }
        const k = NXs.length; NXs.push(x); NZs.push(z); ADJ.push([]); const kk = gx + ',' + gz; if (!key.has(kk)) key.set(kk, []); key.get(kk).push(k); return k; };
      for (const r of RD){ let prev = -1; for (const p of r.p){ const k = nodeOf(p[0], p[1]); if (prev >= 0 && prev !== k && !ADJ[prev].includes(k)){ ADJ[prev].push(k); ADJ[k].push(prev); } prev = k; } }
      // close the small gaps between OSM ways (dead ends within 26 m of another way's vertex)
      for (let k = 0; k < NXs.length; k++){ if (ADJ[k].length !== 1) continue; let best = -1, bd = 26; for (let j = 0; j < NXs.length; j++){ if (j === k || ADJ[k].includes(j)) continue; const d = Math.hypot(NXs[j] - NXs[k], NZs[j] - NZs[k]); if (d < bd){ bd = d; best = j; } }
        if (best >= 0){ const a0 = ADJ[k][0], dx0 = NXs[k] - NXs[a0], dz0 = NZs[k] - NZs[a0], dx = NXs[best] - NXs[k], dz = NZs[best] - NZs[k]; if (dx*dx0 + dz*dz0 > -0.2*Math.hypot(dx0, dz0)*Math.hypot(dx, dz)){ ADJ[k].push(best); ADJ[best].push(k); } } }
      // height of the link bridge's deck along its alignment (null off it)
      const deckAt = (x, z) => { if (!DECK || x < -260 || x > -140 || z < -560 || z > -290) return null; let bd = 1e9, by = null; const {Q, Y} = DECK; for (let i = 0; i < Q.length - 1; i++){ const a = Q[i], c = Q[i + 1], ex = c[0] - a[0], ez = c[1] - a[1], L2q = ex*ex + ez*ez || 1, t = clamp(((x - a[0])*ex + (z - a[1])*ez)/L2q, 0, 1), d = Math.hypot(x - a[0] - ex*t, z - a[1] - ez*t); if (d < bd){ bd = d; by = lerp(Y[i], Y[i + 1], t); } } return bd < 7 ? by : null; };
      // the raised part of the link bridge is the app's own deck: the buses keep off it (its height is not known here)
      for (let k = 0; k < NXs.length; k++){ const dk = deckAt(NXs[k], NZs[k]); if (dk !== null && dk > GY(NXs[k], NZs[k]) + 0.8){ for (const j of ADJ[k]) ADJ[j] = ADJ[j].filter(q => q !== k); ADJ[k] = []; } }
      // starting nodes: well-connected nodes inside the campus
      const starts = []; for (let k = 0; k < NXs.length; k++) if (ADJ[k].length >= 2 && inPoly(api.NUS_KEEP, NXs[k], NZs[k])) starts.push(k);
      const NB = Math.min(8, starts.length ? 8 : 0), paths = [];
      for (let bI = 0; bI < NB; bI++){
        const pool = bI % 2 ? starts.filter(k => NZs[k] < -560) : starts, pl = pool.length ? pool : starts;
        let cur = pl[Math.floor(rnd()*pl.length)], prev = ADJ[cur][0], len = 0; const nodes = [prev, cur];
        for (let st = 0; st < 3000 && len < 12000; st++){ const cand = ADJ[cur].filter(k => k !== prev); let nxt;
          if (!cand.length) nxt = prev; else { const dx0 = NXs[cur] - NXs[prev], dz0 = NZs[cur] - NZs[prev], l0 = Math.hypot(dx0, dz0) || 1; let tot = 0; const w = cand.map(k => { const dx = NXs[k] - NXs[cur], dz = NZs[k] - NZs[cur], l = Math.hypot(dx, dz) || 1, c = (dx*dx0 + dz*dz0)/(l*l0); const v = (1 + c)*(1 + c) + 0.03; tot += v; return v; });
            let r = rnd()*tot; nxt = cand[cand.length - 1]; for (let i = 0; i < cand.length; i++){ if ((r -= w[i]) <= 0){ nxt = cand[i]; break; } } }
          len += Math.hypot(NXs[nxt] - NXs[cur], NZs[nxt] - NZs[cur]); nodes.push(nxt); prev = cur; cur = nxt; }
        // dense points, left-hand lane offset, heights on the ground or on the bridge deck
        const X = [], Yb = [], Z = [], S = []; let acc = 0;
        for (let i = 0; i < nodes.length - 1; i++){ const a = nodes[i], c = nodes[i + 1], ax = NXs[a], az = NZs[a], cx = NXs[c], cz = NZs[c], L = Math.hypot(cx - ax, cz - az); if (L < 0.5) continue; const n = Math.max(1, Math.ceil(L/6)), ox = (cz - az)/L*1.9, oz = -(cx - ax)/L*1.9;
          for (let k = (X.length ? 1 : 0); k <= n; k++){ const t = k/n, x = lerp(ax, cx, t) + ox, z = lerp(az, cz, t) + oz, g = GY(x, z); if (X.length) acc += Math.hypot(x - X[X.length - 1], z - Z[Z.length - 1]); X.push(x); Z.push(z); Yb.push(g); S.push(acc); } }
        if (X.length > 4) paths.push({X:new Float32Array(X), Y:new Float32Array(Yb), Z:new Float32Array(Z), S:new Float32Array(S), s:rnd()*acc*0.5, v:8 + rnd()*2.5, i:0}); }
      if (paths.length){
        // one bus: white body, dark skirt and wheels (vertex colours); glazing in a second mesh that glows at night
        const bp = [], bc = [], wp = [];
        const box = (A, w, h, l, x, y, z, col) => { const P = [[-w/2, 0, -l/2], [w/2, 0, -l/2], [w/2, 0, l/2], [-w/2, 0, l/2], [-w/2, h, -l/2], [w/2, h, -l/2], [w/2, h, l/2], [-w/2, h, l/2]].map(p => [p[0] + x, p[1] + y, p[2] + z]);
          for (const f of [[4, 7, 6, 5], [0, 1, 2, 3], [0, 4, 5, 1], [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 4, 0]]){ for (const t of [[f[0], f[1], f[2]], [f[0], f[2], f[3]]]) for (const k of t){ A.push(...P[k]); if (col) bc.push(...col); } } };
        box(bp, 2.5, 2.9, 11.8, 0, 0.55, 0, [0.95, 0.95, 0.94]); box(bp, 2.46, 0.25, 11.6, 0, 3.45, 0, [0.86, 0.87, 0.87]); box(bp, 2.52, 0.35, 11.9, 0, 0.35, 0, [0.25, 0.27, 0.29]);
        for (const zz of [-3.8, 3.6]) for (const xx of [-1.12, 1.12]) box(bp, 0.32, 0.9, 1.0, xx, 0.05, zz, [0.12, 0.12, 0.13]);
        box(wp, 2.54, 1.15, 9.6, 0, 1.75, -0.6, null); box(wp, 2.3, 1.5, 0.08, 0, 1.55, 5.93, null); box(wp, 2.2, 0.9, 0.08, 0, 2.0, -5.93, null);
        const mk = (A, C) => { const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(A, 3)); if (C) g2.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g2.computeVertexNormals(); return g2; };
        const bodyM = new THREE.MeshLambertMaterial({vertexColors:true}), winM = new THREE.MeshBasicMaterial({color:0x2c3a44});
        const n = paths.length, body = new THREE.InstancedMesh(mk(bp, bc), bodyM, n), win = new THREE.InstancedMesh(mk(wp), winM, n);
        for (const m of [body, win]){ m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; m.name = 'nusutown-bus'; }
        busGroup = new THREE.Group(); busGroup.add(body, win);
        const place = (k, B) => { const S = B.S, L = S[S.length - 1]; if (B.s >= L) { B.s -= L; B.i = 0; } while (B.i < S.length - 2 && S[B.i + 1] < B.s) B.i++; if (S[B.i] > B.s) B.i = 0;
            const i = B.i, t = clamp((B.s - S[i])/((S[i + 1] - S[i]) || 1), 0, 1), x = lerp(B.X[i], B.X[i + 1], t), y = lerp(B.Y[i], B.Y[i + 1], t), z = lerp(B.Z[i], B.Z[i + 1], t);
            const j = Math.min(S.length - 1, i + 2), hx2 = B.X[j] - B.X[i], hz2 = B.Z[j] - B.Z[i], hy = B.Y[j] - B.Y[i], hl = Math.hypot(hx2, hz2) || 1;
            // matrix = T · Ry(heading) · Rx(-pitch), written straight into both instance buffers
            const sa = hx2/hl, ca = hz2/hl, l3 = Math.hypot(hl, hy), cq = hl/l3, sq = -hy/l3;
            for (const e of [body.instanceMatrix.array, win.instanceMatrix.array]){ const o = k*16; e[o] = ca; e[o + 1] = 0; e[o + 2] = -sa; e[o + 3] = 0; e[o + 4] = sa*sq; e[o + 5] = cq; e[o + 6] = ca*sq; e[o + 7] = 0;
              e[o + 8] = sa*cq; e[o + 9] = -sq; e[o + 10] = ca*cq; e[o + 11] = 0; e[o + 12] = x; e[o + 13] = y; e[o + 14] = z; e[o + 15] = 1; } };
        paths.forEach((B, k) => place(k, B)); body.instanceMatrix.needsUpdate = win.instanceMatrix.needsUpdate = true;
        UTB.buses = {paths, body, win, place, winM, day:new THREE.Color(0x2c3a44), night:new THREE.Color(0xffe2b4)};
        if (!UTB.hooked && typeof HOOKS !== 'undefined' && HOOKS && HOOKS.frame){ UTB.hooked = true;
          HOOKS.frame.push((t, dt) => { const U = UTB.buses; if (!U || !U.body.parent) return;
            // glazing lit at night (the app's night factor), checked every frame at no cost
            const nf = (typeof NIGHT !== 'undefined' && NIGHT && NIGHT.uNight) ? +NIGHT.uNight.value : null; if (nf !== null && nf !== U.nf){ U.nf = nf; U.winM.color.copy(U.day).lerp(U.night, clamp(nf, 0, 1)); }
            dt = Math.min(0.1, Math.max(0, dt || 0)); if (!dt) return; U.paths.forEach((B, k) => { B.s += B.v*dt; U.place(k, B); }); U.body.instanceMatrix.needsUpdate = true; U.win.instanceMatrix.needsUpdate = true; });
          if (HOOKS.time) HOOKS.time.push((tod, nf) => { const U = UTB.buses; if (!U) return; U.winM.color.copy(U.day).lerp(U.night, clamp(+nf || 0, 0, 1)); }); }
      } } } catch (e){ console.error('nusutown buses', e); busGroup = undefined; }

    // Town Green label (the open bowl of lawn with the five preserved trees)
    LBL(-318, -712, GY(-318, -712) + 14, '大学城绿地', 'University Town — Town Green', '🎓');
    return busGroup;
  }});
}
