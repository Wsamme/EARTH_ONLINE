
// ================= Hanking Center (汉京中心; Morphosis, 2018) =================
// OSM w925221226 (unnamed, no height; its building:parts give the office tower to 358.9 m and the core to 346 m) on the plot of
// the podium w707365790. 358.9 m, 65 floors, top floor 320 m (Wikipedia); the tallest "detached core" tower: the office slab faces
// south to Shenzhen University, its column-free floors indented on the east and west, contracting and expanding as it rises; the
// lift / service core stands apart on the north, rising straight, clad in anodised aluminium, linked to the tower by glass
// bridges (~3 x 10.7 m) at every floor and by steel braces, with bracing diaphragms every fourth level; the gap is 35 ft (10.7 m);
// a four-storey retail podium with angled, folded facets (Architectural Record, Dezeen, Metalocus). Night: lit office windows.
LANDMARKS.szhanking = {zh:'汉京中心', en:'Hanking Center', cat:'new', r:86, h:358.9, lt:{m:1, c:'#e4ecff', k:0.75},
  build(){
    const g = new THREE.Group(), B = Bt();
    const GL = {c:'#7f939f', m:1, fh:4.9, cw:3.0}, MUL = {c:'#c7ccce', m:0, lk:0.45}, CORE = {c:'#b8bec1', m:0, lk:0.6, lc:'#eaf2ff'}, STL = {c:'#878d90', m:0, lk:0.7, lc:'#eaf2ff'},
      BRG = {c:'#9fb3bf', m:1, fh:4.9, cw:2.0}, POD = {c:'#c9c3b8', m:0, lk:0.45, lc:'#ffe2bf'}, PGL = {c:'#55636b', m:1, fh:5.0, cw:3.0, lc:'#ffe2bf'}, ROOF = {c:'#8e9193'}, CROWN = {c:'#93a7b3', m:0, lk:0.8, glow:'#cfe0ff', gk:0.25};
    const YP = 21;                                              // podium roof (four storeys)
    // ---- podium: walls with a folded, faceted roof line ----
    const PP = D.hk.pod, n = PP.length, pc = cen(PP);
    const ry = i => YP - 3.5 + (i % 2)*5.5;
    for (let i = 0; i < n; i++){ const a = PP[i], b = PP[(i + 1) % n]; const ya = ry(i), yb = ry(i + 1);
      B.q(PGL, [a[0], -1, a[1]], [b[0], -1, b[1]], [b[0], 9, b[1]], [a[0], 9, a[1]]);
      B.q(POD, [a[0], 9, a[1]], [b[0], 9, b[1]], [b[0], yb, b[1]], [a[0], ya, a[1]]);
      B.t(POD, [a[0], ya, a[1]], [b[0], yb, b[1]], [pc[0], YP + 1, pc[1]]); }
    // ---- the office tower: plan from the OSM part, north face held back 10.7 m from the core; floors contract then expand ----
    const T0 = D.hk.parts[0][2];                                 // [-36.6,22.1] [-31.9,6] [-33.2,-11] [33.5,-6.6] [29.8,8.9] [31.7,27.1]
    const zN = -3.4, Hs = 358.9, Ytop = 320;
    const plan = y => { const t = y/Ytop, s = 1 - 0.07*t - 0.035*Math.sin(PI*Math.min(1, t*1.25)), ind = 3.5 + 3.0*Math.sin(PI*t);
      return T0.map((p, i) => { let x = p[0]*s, z = Math.max(zN, p[1]); if (i === 1) x += ind - 4.7; if (i === 4) x -= ind - 3.7; if (i === 0 || i === 5) z = lerp(z, 22, 0.25*t); return [x, z]; }); };
    const ys = []; for (let y = YP; y <= Ytop + 0.01; y += 24.5) ys.push(y); if (ys[ys.length - 1] < Ytop) ys.push(Ytop);
    const rings = ys.map(y => plan(y).map(p => [p[0], y, p[1]]));
    loft(B, GL, rings);
    // vertical mullions on the south, east and west faces
    for (let e = 0; e < 6; e++){ if (e === 2) continue; const k = e === 5 ? 22 : 4;
      for (let j = 1; j < k; j++){ const pts = [], outs = []; for (let i = 0; i < ys.length; i++){ const P = plan(ys[i]), a = P[e], b = P[(e + 1) % 6], t = j/k; pts.push([lerp(a[0], b[0], t), ys[i], lerp(a[1], b[1], t)]); outs.push(outN(P, a, b)); } rib(B, MUL, pts, outs.map(o => [o[0], o[1]]).map((o, i) => o), -0.45, 0.18); } }
    // the crown: the glass skin rises on as a lit screen above the top floor, sloping down towards the core
    const Pt = plan(Ytop), crownY = (x, z) => lerp(Hs, 347, clamp((-z + 24)/30, 0, 1));
    for (let i = 0; i < 6; i++){ const a = Pt[i], b = Pt[(i + 1) % 6]; B.q(CROWN, [a[0], Ytop, a[1]], [b[0], Ytop, b[1]], [b[0], crownY(b[0], b[1]), b[1]], [a[0], crownY(a[0], a[1]), a[1]]); }
    cap(B, ROOF, Pt, Ytop + 1);
    // ---- the detached core (OSM part 2, south face pulled to z = -14.1): aluminium shaft with its web of steel braces ----
    const C0 = D.hk.parts[1][2], cx0 = Math.min(...C0.map(p => p[0])), cx1 = Math.max(...C0.map(p => p[0])), cz0 = Math.min(...C0.map(p => p[1])), cz1 = -14.1, HC = 346;
    box(B, CORE, cx0, cx1, 0, HC, cz0, cz1);
    const Wf = [[[cx0, cz0], [cx1, cz0]], [[cx1, cz0], [cx1, cz1]], [[cx0, cz1], [cx0, cz0]]];
    for (const [a, b] of Wf){ const Nn = outN([[cx0, cz0], [cx1, cz0], [cx1, cz1], [cx0, cz1]], a, b), L = Math.hypot(b[0] - a[0], b[1] - a[1]), o = 0.6;
      const A = [a[0] + Nn[0]*o, a[1] + Nn[1]*o], Bp = [b[0] + Nn[0]*o, b[1] + Nn[1]*o], nd = Math.max(1, Math.round(L/10));
      for (let y = YP; y < HC - 1; y += 19.6){ const y2 = Math.min(HC, y + 19.6);
        for (let j = 0; j < nd; j++){ const p0 = [lerp(A[0], Bp[0], j/nd), lerp(A[1], Bp[1], j/nd)], p1 = [lerp(A[0], Bp[0], (j + 1)/nd), lerp(A[1], Bp[1], (j + 1)/nd)];
          beam(B, STL, [p0[0], y, p0[1]], [p1[0], y2, p1[1]], 0.45); beam(B, STL, [p1[0], y, p1[1]], [p0[0], y2, p0[1]], 0.45); }
        beam(B, STL, [A[0], y, A[1]], [Bp[0], y, Bp[1]], 0.5); } }
    // ---- the gap: glass bridges at every floor (two stacks), braces and diaphragms every fourth floor ----
    for (const bx of [-9, 12]){ box(B, BRG, bx - 1.5, bx + 1.5, YP, Ytop, cz1, zN + 0.3);
      for (let y = YP; y < Ytop; y += 4.9) box(B, STL, bx - 1.7, bx + 1.7, y, y + 0.35, cz1, zN + 0.3); }
    for (let y = YP + 19.6; y < Ytop; y += 19.6){ for (const [xa, xb] of [[cx0 + 1, -11], [cx1 - 1, 14]]){
      beam(B, STL, [xa, y, cz1 + 0.3], [xb, y + 9.8, zN], 0.5); beam(B, STL, [xa, y + 9.8, cz1 + 0.3], [xb, y, zN], 0.5); }
      box(B, STL, -11, 14, y - 0.4, y + 0.4, cz1, zN + 0.3); }
    cap(B, ROOF, [[cx0, cz0], [cx1, cz0], [cx1, cz1], [cx0, cz1]], HC);
    const AV = avia(B, g, [[0, Hs, 19], [0.5*(cx0 + cx1), HC, -22]]);
    B.flush(g); lights(g, AV, [1, 0.16, 0.1], 12);
    return g;
  }};
SG_PLACES.push({type:'szhanking', lat:22.543485, lon:113.931794, rot:0});
