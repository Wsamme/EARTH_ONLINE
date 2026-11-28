// ================= State Courts Towers, 1 Havelock Square (sgstatecourts, hero) =================
// Wikipedia (State Courts of Singapore) and BD+C ("Singapore's new courthouse set for all to see"): design competition 2011 won by
// Serie Architects + Multiply Architects (with CPG), completed 2019; 35 storeys, 178 m, 53 courtrooms and 54 hearing chambers.
// Two slender buildings - the Court Tower in front, the Office Tower behind - joined by 39 link bridges. The Court Tower is an open
// frame of "court trays" of varying heights with no glazed facade round it; on each tray stand courtroom boxes clad in pigmented
// precast panels 5-12 m high, coloured to match the tiled roofs of the Chinatown shophouses, with a garden terrace round them. The
// Office Tower has a horizontal grid facade, wider glazing in the middle and narrower over the service core; roof garden and sky
// terraces. Plans: OSM w699163979 "Court Tower", w699163978 "Office Tower", outline w699163980 (reref SC/lm50/sg50b/ref_sg50b_1.json;
// the target row's w44414588 is the conserved 1975 State Courts building 100 m to the south-west, left to the app). Tray levels,
// box sizes and the bridge positions follow the described system but are not surveyed (estimates). No signs or text.
{
const A0 = D.scall.A, C0 = [0.2, 2.7], AX = -49.87*PI/180;
K50('sgstatecourts', '国家法院', 'State Courts', A0, C0, {r:66, h:178, lt:{m:1, c:'#fff0d8', k:0.5}, build(){
  const g = new THREE.Group(), B = mkB(), f = frame(-C0[0], -C0[1], AX), R = LMCTX.rng;
  const FRM = {c:'#eceeec', m:0, lk:0.45}, TRAY = {c:'#e4e6e3', m:0, lk:0.4, glow:'#fff1d6', gk:0.25}, CORE = {c:'#dfe1df', m:0, lk:0.4},
    GL = GLs('#5d7480', 4.6, 1.6), GLL = {c:'#9fb2b8', m:0, glow:'#ffe8c6', gk:0.7}, GRN = {c:'#5f8a45', m:0, lk:0.1},
    BX = [{c:'#b5603f', m:0, lk:0.3}, {c:'#a3543a', m:0, lk:0.3}, {c:'#c47a52', m:0, lk:0.3}], RIB = {c:'#8f4a33', m:0, lk:0.25};
  const box = (o, u0, u1, y0, y1, v0, v1) => bxF(o, f, u0, u1, y0, y1, v0, v1);
  const CU0 = -52.0, CU1 = 41.2, CV0 = -26.4, CV1 = 3.0;      // court tower
  const OU0 = -39.3, OU1 = 50.0, OV0 = 18.6, OV1 = 31.7;      // office tower
  const YT = 178;
  foundP(B.p(FOUND50), polyF(f, rectO(CU0, CU1, CV0, CV1)), 0.3); foundP(B.p(FOUND50), polyF(f, rectO(OU0, OU1, OV0, OV1)), 0.3);
  foundP(B.p(FOUND50), polyF(f, rectO(30, CU1, CV1, OV0)), 0.3);
  // ---- Court Tower: glazed base, open frame, trays with courtroom boxes and gardens ----
  wallP(B.p(LOB50), polyF(f, rectO(CU0 + 3, CU1 - 2, CV0 + 3, CV1 - 1)), 0.3, 11.5);
  const TR = [11.5, 22.5, 33.5, 43.5, 55.5, 66.5, 77.0, 88.5, 99.5, 110.5, 121.0, 132.5, 143.5, 154.0, 165.5, 175.5];
  for (const y of TR){ box(B.p(TRAY), CU0, CU1, y, y + 0.9, CV0, CV1); }
  // perimeter frame: slender columns on both long faces and the ends
  for (let k = 0; k <= 10; k++){ const u = CU0 + 0.4 + k*(CU1 - CU0 - 0.8)/10; for (const v of [CV0 + 0.4, CV1 - 0.4]){ const p = f(u, 0, v); segP(B.p(FRM), [p[0], 0.3, p[2]], [p[0], YT, p[2]], 0.45, 6); } }
  for (const u of [CU0 + 0.4, CU1 - 0.4]) for (const v of [-19, -12.6, -5.8]){ const p = f(u, 0, v); segP(B.p(FRM), [p[0], 0.3, p[2]], [p[0], YT, p[2]], 0.4, 6); }
  // courtroom boxes: 3-4 per tray, 5-12 m tall, three precast tones, vertical ribs; garden strip and small trees on the tray edge
  for (let t = 0; t < TR.length - 1; t++){
    const y0 = TR[t] + 0.9, gap = TR[t + 1] - y0 - 0.6; let u = CU0 + 3 + R()*4;
    while (u < CU1 - 12){
      const w = 12 + R()*10, u1 = Math.min(u + w, CU1 - 3), h = Math.min(gap, 5 + R()*7), v0 = CV0 + 4 + R()*3, v1 = CV1 - 3 - R()*3;
      const P = polyF(f, rectO(u, u1, v0, v1)), C = BX[Math.floor(R()*3)];
      wallP(B.p(C), P, y0, y0 + h); capP(B.p(C), P, y0 + h);
      finsP(B.p(RIB), P, y0, y0 + h, 1.2, 0.18, 0.25);
      u = u1 + 4 + R()*6;
    }
    // planting along both long edges of the tray
    for (const v of [CV0 + 1.6, CV1 - 1.6]){ box(B.p(GRN), CU0 + 1, CU1 - 1, y0, y0 + 0.6, v - 0.9, v + 0.9);
      for (let k = 0; k < 4; k++){ const p = f(CU0 + 6 + R()*(CU1 - CU0 - 12), 0, v); treeP(B.p('#5b4a3a'), B.p(GRN), p[0], y0 + 0.6, p[2], 0.6, R); } }
  }
  // roof garden on the court tower
  box(B.p(GRN), CU0 + 2, CU1 - 2, TR[TR.length - 1] + 0.9, TR[TR.length - 1] + 1.4, CV0 + 2, CV1 - 2);
  box(B.p(FRM), CU0, CU1, YT - 0.8, YT, CV0, CV1 - 0.0);
  // ---- service core between the towers (east end) ----
  box(B.p(CORE), 30, CU1, 0.3, YT + 2, CV1, OV0);
  // ---- Office Tower: glass with a white horizontal grid; solid ends over the cores; wider glazing in the middle ----
  const OP = polyF(f, rectO(OU0, OU1, OV0, OV1));
  wallP(B.p(GL), OP, 0.3, YT); capP(B.p(ROOF50), OP, YT);
  wallP(B.p(LOB50), polyF(f, rectO(OU0 + 1, OU1 - 1, OV0 + 1, OV1 - 1)), 0.3, 6);
  ribP(B.p(FRM), OP, 6, YT, 4.6, 0.7, 0.12);
  for (const [v, s] of [[OV0, -1], [OV1, 1]]){ const F = (t, y, w) => f(t, y, v + s*(w || 0));
    // mullions: close over the ends, open in the middle
    for (let u = OU0 + 2; u < OU1 - 1.5; ){ slabP(B.p(FRM), rectO(u - 0.15, u + 0.15, 6, YT), F, 0, 0.5); const m = Math.abs(u - (OU0 + OU1)/2)/((OU1 - OU0)/2); u += m > 0.7 ? 1.6 : m > 0.4 ? 2.6 : 3.6; }
    for (const [a, b] of [[OU0, OU0 + 6], [OU1 - 6, OU1]]) slabP(B.p(CORE), rectO(a, b, 6, YT), F, 0, 0.55); }
  for (const [u, s] of [[OU0, -1], [OU1, 1]]) slabP(B.p(CORE), rectO(OV0, OV1, 0.3, YT), (t, y, w) => f(u + s*(w || 0), y, t), 0, 0.3);
  box(B.p(CORE), OU0, OU1, YT, YT + 2.2, OV0, OV1); box(B.p(GRN), OU0 + 1.5, OU1 - 1.5, YT + 2.2, YT + 2.6, OV0 + 1.5, OV1 - 1.5);
  // ---- 39 link bridges across the atrium ----
  for (let i = 0; i < 39; i++){ const y = 14 + i*4.15, u = CU0 + 18 + ((i*29) % 58), w = 3.2;
    box(B.p(FRM), u, u + w, y, y + 0.5, CV1, OV0); box(B.p(GLL), u + 0.1, u + w - 0.1, y + 0.5, y + 2.9, CV1 + 0.1, OV0 - 0.1); box(B.p(FRM), u, u + w, y + 2.9, y + 3.2, CV1, OV0); }
  lavP(B.p(LAV50), polyF(f, rectO(OU0, OU1, OV0, OV1)), YT + 2.2);
  B.flush(g); return g; }});
}
