
// ---------------- crystal shell: faceted rings over a zig-zag outline (the Universiade "crystals") ----------------
// P: closed outline [x, z] with alternating outer tips / inner valleys; lv: [[scale toward the centre, y at tips, y at valleys], ...]
// G(x, z): ground; batches: skin (translucent panels) and frame (the folded steel edges)
function crystal(B, P, lv, G, SKIN, SKIN2, FRAME, capY){
  const c = cenP(P), n = P.length, rr = P.map(p => Math.hypot(p[0] - c[0], p[1] - c[1]));
  const tip = P.map((p, i) => rr[i] >= rr[(i + n - 1) % n] && rr[i] >= rr[(i + 1) % n]);
  const R = lv.map(([s, yt, yv], li) => P.map((p, i) => { const x = c[0] + (p[0] - c[0])*s, z = c[1] + (p[1] - c[1])*s; return [x, (li === 0 ? G(p[0], p[1]) : 0) + (tip[i] ? yt : yv), z]; }));
  for (let l = 0; l < R.length - 1; l++) for (let i = 0; i < n; i++){ const j = (i + 1) % n, a = R[l][i], b = R[l][j], cc = R[l + 1][j], d = R[l + 1][i], alt = (i + l) % 2;
    if (alt){ t3(B.p(SKIN), a, b, cc); t3(B.p(SKIN2), a, cc, d); } else { t3(B.p(SKIN2), a, b, d); t3(B.p(SKIN), b, cc, d); }
    seg(B.p(FRAME), a, d, 0.35, 4); seg(B.p(FRAME), alt ? a : b, alt ? cc : d, 0.25, 4); if (l > 0) seg(B.p(FRAME), a, b, 0.3, 4); }
  if (capY !== undefined){ const top = R[R.length - 1], cp = [c[0], capY, c[1]]; for (let i = 0; i < n; i++) t3(B.p(i % 2 ? SKIN : SKIN2), top[i], top[(i + 1) % n], cp); }
  return R;
}
// ray from c at angle t: distance to the outline P
function rayR(P, c, t){ const dx = Math.cos(t), dz = Math.sin(t); let best = 1e9;
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], ex = b[0] - a[0], ez = b[1] - a[1], den = dx*ez - dz*ex; if (Math.abs(den) < 1e-9) continue;
    const s = ((a[0] - c[0])*ez - (a[1] - c[1])*ex)/den, u = ((a[0] - c[0])*dz - (a[1] - c[1])*dx)/den; if (s > 0 && u >= 0 && u <= 1) best = Math.min(best, s); }
  return best; }
const UNI = {SKIN:{c:'#dfe7e6', m:0, lk:0.75, lc:'#f2fff8', glow:'#d9f5e6', gk:0.22, ds:true}, SKIN2:{c:'#cfdad9', m:0, lk:0.7, lc:'#f2fff8', glow:'#c8eedc', gk:0.2, ds:true},
  FRAME:{c:'#8e979b', m:0, lk:0.3}, SEAT:'#5d6f86', SEAT2:'#6e7f94', CONC:'#b4b1aa', LED:{c:'#f2fff6', glow:'#e9fff2', gk:1.4}};

// ================= Shenzhen Universiade Sports Centre (gmp von Gerkan, Marg and Partners, 2011 Summer Universiade) =================
// Facts (dezeen 16 Aug 2011; metalocus): the main stadium (60 000 seats in three tiers; 60 334 in targets.json), the circular
// multifunctional arena to the north (~18 000), the rectangular swimming hall to the west (~3 000), joined by an artificial lake
// and a raised promenade to the central sports plaza; each wrapped in a "crystal": a steel prismatic shell of triangular facets,
// translucent glass / polycarbonate outside, a membrane inside; the stadium roof is 310 m long, 290 m across and rises up to 65 m;
// the facades are lit at night (white to green effects, Conceptlicht). Outlines: OSM stadium w166214606 (the zig-zag crown), its
// building r3220465 (hidden by the site), pitch w219051961, track r15692057; arena w219058187 and natatorium w238462822 are the
// sub-keys szuniversiade_arena / szuniversiade_pool. Fold heights between ground and 65 m, the tier split and the arena / pool
// heights are estimates. The lake is drawn by the map (OSM w238466886); the 2020s retail buildings on the plaza stay real.
Object.assign(SITES, {szuniversiade:{zh:'深圳大运中心', en:'Shenzhen Universiade Sports Centre', lat:PLC.szuniversiade.lat, lon:PLC.szuniversiade.lon,
  r:175, keep:S.uni.keep, h:66, keepRoads:[11, 12], lt:{m:0, c:'#effff6', k:0.6, anim:'cycle', c2:'#9df0c4'},
  build(ctx){
    const g = new THREE.Group(), B = mkB(), U = S.uni, ST = U.stad;
    let gmin = 1e9, gmax = -1e9; for (const p of ST){ const y = ctx.gy(p[0], p[1]); gmin = Math.min(gmin, y); gmax = Math.max(gmax, y); }
    const gc = ctx.gy(0, 0), yF = Math.min(gc, gmin) + 0.3;          // field level
    const G = (x, z) => Math.min(ctx.gy(x, z), yF + 3) - 1.5;
    // the crown: ground -> folded facade -> roof crest (65 m) -> inner roof edge over the stands
    const lv = [[1.0, 0, 0], [0.985, yF + 22, yF + 32], [0.955, yF + 47, yF + 41], [0.9, yF + 65, yF + 60], [0.8, yF + 60, yF + 63], [0.66, yF + 52, yF + 54]];
    const R = crystal(B, ST, lv, G, UNI.SKIN, UNI.SKIN2, UNI.FRAME);
    // underside of the roof ring (membrane) back down to the top of the upper tier
    const inner = R[R.length - 1], c0 = cenP(ST);
    const under = inner.map(p => [c0[0] + (p[0] - c0[0])*1.12, yF + 44, c0[1] + (p[2] - c0[1])*1.12]);
    for (let i = 0; i < inner.length; i++){ const j = (i + 1) % inner.length; q4(B.p('#e9eeee'), inner[i], inner[j], under[j], under[i]); }
    for (let i = 0; i < inner.length; i += 2){ const a = inner[i], b = inner[(i + 1) % inner.length]; q4(B.p(UNI.LED), [a[0], a[1] - 0.6, a[2]], [b[0], b[1] - 0.6, b[2]], [b[0], b[1] - 0.2, b[2]], [a[0], a[1] - 0.2, a[2]]); }
    // the bowl: three tiers from the track's edge out to the crown
    const TR = U.track, ct = cenP(TR), NS = 96;
    const ringAt = (k, y) => { const out = []; for (let i = 0; i < NS; i++){ const t = i/NS*TAU, r0 = rayR(TR, ct, t) + 4, r1 = rayR(ST, ct, t)*0.9; const r = lerp(r0, r1, k); out.push([ct[0] + Math.cos(t)*r, y, ct[1] + Math.sin(t)*r]); } return out; };
    const tiers = [[0.0, 0.36, 1.2, 15], [0.40, 0.70, 18, 31], [0.73, 0.98, 34, 45]];
    for (const [k0, k1, y0, y1] of tiers){ const rows = 8;
      for (let r = 0; r < rows; r++){ const a = ringAt(lerp(k0, k1, r/rows), yF + lerp(y0, y1, r/rows)), b = ringAt(lerp(k0, k1, (r + 1)/rows), yF + lerp(y0, y1, r/rows)), cc = ringAt(lerp(k0, k1, (r + 1)/rows), yF + lerp(y0, y1, (r + 1)/rows));
        for (let i = 0; i < NS; i++){ const j = (i + 1) % NS; q4(B.p(r % 2 ? UNI.SEAT : UNI.SEAT2), a[i], a[j], b[j], b[i]); q4(B.p(UNI.CONC), b[i], b[j], cc[j], cc[i]); } }
      const fr = ringAt(k0, yF + y0), bk = ringAt(k1, yF + y1);
      for (let i = 0; i < NS; i++){ const j = (i + 1) % NS; q4(B.p(UNI.CONC), [fr[i][0], yF, fr[i][2]], [fr[j][0], yF, fr[j][2]], fr[j], fr[i]); q4(B.p(UNI.CONC), bk[i], bk[j], [bk[j][0], yF + y1 + 2.5, bk[j][2]], [bk[i][0], yF + y1 + 2.5, bk[i][2]]); } }
    // field and track
    flat(B.p('#5f8a4a'), U.pitch, yF + 0.08); flat(B.p('#a0563f'), TR, yF + 0.04);
    const ap = ringAt(-0.05, yF); flat(B.p('#7f9a62'), ap.map(p => [p[0], p[2]]), yF + 0.02);
    // floodlight points under the roof edge
    const fl = []; for (let i = 0; i < inner.length; i += 2) fl.push(inner[i][0], inner[i][1] - 1, inner[i][2]); sprites(g, fl, [1, 1, 0.95], 9);
    B.flush(g);
    ctx.paint(offP(ST, -10), [176, 172, 164]);
    for (let i = 0; i < 40; i++){ const t = i/40*TAU, r = rayR(ST, c0, t) + 16; ctx.tree(c0[0] + Math.cos(t)*r, c0[1] + Math.sin(t)*r, 3.2, 'd'); }
    return g;
  }}});

LANDMARKS.szuniversiade_arena = {zh:'大运中心体育馆', en:'Universiade Sports Centre Arena', cat:'new', r:82, h:40,
  lt:{m:0, c:'#effff6', k:0.6, anim:'cycle', c2:'#9df0c4'},
  build(){ const g = new THREE.Group(), B = mkB();
    crystal(B, D.uniA.fp, [[1.0, -1.5, -1.5], [0.97, 15, 21], [0.8, 30, 33], [0.5, 38, 38.5]], () => 0, UNI.SKIN, UNI.SKIN2, UNI.FRAME, 40);
    B.flush(g); return g; }};
SG_PLACES.push({type:'szuniversiade_arena', lat:PLC.szuniversiade_arena.lat, lon:PLC.szuniversiade_arena.lon, rot:0});
LANDMARKS.szuniversiade_pool = {zh:'大运中心游泳馆', en:'Universiade Sports Centre Natatorium', cat:'new', r:105, h:31,
  lt:{m:0, c:'#effff6', k:0.6, anim:'cycle', c2:'#9df0c4'},
  build(){ const g = new THREE.Group(), B = mkB();
    const P = D.uniP.fp, c = cenP(P);
    // scale toward the long axis (not the centre) so the roof stays a long faceted ridge
    const lv = [[1.0, -1.5, -1.5], [0.98, 13, 17], [0.75, 25, 27], [0.45, 30, 30.5]];
    const n = P.length, rr = P.map(p => Math.abs(p[1] - c[1]) + 0.3*Math.abs(p[0] - c[0]));
    const tip = P.map((p, i) => rr[i] >= rr[(i + n - 1) % n] && rr[i] >= rr[(i + 1) % n]);
    const R = lv.map(([s, yt, yv]) => P.map((p, i) => [p[0] - (p[0] - c[0])*(1 - s)*0.35, tip[i] ? yt : yv, c[1] + (p[1] - c[1])*s]));
    for (let l = 0; l < R.length - 1; l++) for (let i = 0; i < n; i++){ const j = (i + 1) % n, a = R[l][i], b = R[l][j], cc = R[l + 1][j], d = R[l + 1][i];
      if ((i + l) % 2){ t3(B.p(UNI.SKIN), a, b, cc); t3(B.p(UNI.SKIN2), a, cc, d); } else { t3(B.p(UNI.SKIN2), a, b, d); t3(B.p(UNI.SKIN), b, cc, d); }
      seg(B.p(UNI.FRAME), a, d, 0.3, 4); if (l) seg(B.p(UNI.FRAME), a, b, 0.25, 4); }
    const top = R[R.length - 1]; flat(B.p(UNI.SKIN), top.map(p => [p[0], p[2]]), 30.2);
    B.flush(g); return g; }};
SG_PLACES.push({type:'szuniversiade_pool', lat:PLC.szuniversiade_pool.lat, lon:PLC.szuniversiade_pool.lon, rot:PLC.szuniversiade_pool.rot});
