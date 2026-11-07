// ================= House of Tan Yeok Nee (1882-85, national monument), 101 Penang Road =================
// Verified: Teochew mansion in the sidianjin configuration with four double-pitched gable ends; halls symmetric along a central
// axis with side courtyards; front and back face east and west; single storey (a two-storey wing part from 1906); walls repainted
// yellow in the 2000 restoration; marble pillars at the front door; almost straight roof ridges, very colourful ornamented roofs
// (porcelain-inlay figures). Plan: the four real footprints r8409861 + w602071817/18/19 (the data maps the wings and halls as
// separate pieces; their 15 m data heights are wrong). Hall heights, roof tile colour and courtyard positions are estimates.
LANDMARKS.sgtanyeoknee = {zh:'陈旭年宅第', en:'House of Tan Yeok Nee', cat:'old', r:40, h:10,
  lt:{m:0, c:'#ffe2b0', k:0.55, e:0.6, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), V = mkV(), Fr = frm(-17*PI/180);
    const M = {WALL:'#d8b45c', WALL2:'#cfa64e', TILE:'#5e625c', RIDGE:'#e6e0d0', STONE:'#b8b3a8', COURT:'#a7a39a', DOOR:'#3b2a20', MARB:'#ece8de', WIN:'#2d2a26', TRIM:'#f1ecdf', RED:'#8e2e22'};
    // compound: plinth over the real pieces (frame u = ENE along the axis, v = SSE)
    const PIECES = [[[9.3,-13.4],[8.7,-16.3],[-30.1,-5.1],[-31.9,-11.6],[10.5,-24.6],[15.9,-27.0],[18.9,-24.0],[18.9,-20.5],[21.2,-21.1],[28.4,0.9],[0.9,9.2],[-3.8,-9.8]],
      [[-30.7,-2.1],[-11.0,-7.4],[-5.6,12.7],[-24.7,18.1]], [[0.3,14.5],[2.7,13.9],[0.9,9.2],[28.4,0.9],[31.4,11.0],[2.1,19.9]], [[2.7,13.9],[0.3,14.5],[2.1,19.9],[-20.6,25.8],[-22.3,19.3],[2.1,12.1]]];
    for (const Q of PIECES) prismP(B.p(M.STONE), Q, -5, 0.7, false);
    const WH = 4.6, Y0 = 0.7;
    // halls across the axis (ridge along v) and the two side wings (ridge along u); [u0,u1,v0,v1, eave, rise, ridge dir]
    const HALLS = [[17.5, 26.6, -13.4, 9.0, WH, 3.6, 'v'], [-1.6, 9.5, -13.4, 9.0, WH + 0.6, 4.2, 'v'], [-28.6, -17.5, -10.8, 10.2, WH, 3.4, 'v'],
      [-27.0, 26.6, -20.3, -13.4, WH - 0.5, 2.6, 'u'], [-27.0, 26.6, 10.0, 19.5, WH - 0.5, 3.0, 'u'], [-17.5, -8.6, -10.8, -6.0, WH - 0.8, 1.6, 'u'], [-17.5, -8.6, 5.4, 10.2, WH - 0.8, 1.6, 'u']];
    for (const [u0, u1, v0, v1, eh, rh, al] of HALLS){
      rectPrism(B.p(M.WALL), Fr, u0, u1, v0, v1, Y0, Y0 + eh);
      bandP(B.p(M.TRIM), Fr.rect(u0, u1, v0, v1), Y0 + eh - 0.5, 0.5, 0.12);
      gableR(B.p(M.TILE), Fr, u0, u1, v0, v1, Y0 + eh, rh, 0.6, B.p(M.WALL2), al, 0.05);
      // ridge roll with swept ends and colourful porcelain figures on it
      const ry = Y0 + eh + rh; const [a0, a1, b] = al === 'v' ? [v0, v1, (u0 + u1)/2] : [u0, u1, (v0 + v1)/2];
      const RP = (a, y) => al === 'v' ? Fr.R(b, y, a) : Fr.R(a, y, b);
      segP(B.p(M.RIDGE), RP(a0 - 0.7, ry + 0.15), RP(a1 + 0.7, ry + 0.15), 0.28, 4);
      for (const a of [a0 - 0.7, a1 + 0.7]){ const p = RP(a, ry + 0.15), q = RP(a + (a < (a0 + a1)/2 ? -0.6 : 0.6), ry + 0.9); segP(B.p(M.RIDGE), p, q, 0.22, 4); }
      const nfig = Math.max(2, Math.round((a1 - a0)/3.5));
      for (let j = 1; j < nfig; j++){ const p = RP(a0 + (a1 - a0)*j/nfig, ry + 0.4); const cols = ['#2f7d4f', '#d2a23a', '#b8432f', '#3a6fb0', '#e7d9b8'];
        vAdd(V, cols[j % 5], t => boxP(t, 0.5, 0.55 + 0.25*(j % 2), 0.5, p[0], ry + 0.35, p[2])); }
    }
    // gable-end walls (the four double-pitched gables seen at the corners): raised wall heads with a curved coping
    for (const [u, v0, v1] of [[26.6, -20.3, -13.4], [26.6, 10.0, 19.5], [-27.0, -20.3, -13.4], [-27.0, 10.0, 19.5]]){
      const vm = (v0 + v1)/2, hw = (v1 - v0)/2 + 0.2, F = (uu, vv, w) => Fr.R(u + (u > 0 ? 1 : -1)*(w || 0), vv, vm + (u > 0 ? -1 : 1)*uu);
      const O = []; for (let i = 0; i <= 10; i++){ const t = -1 + 2*i/10; O.push([t*hw, Y0 + 4.3 + 2.6*(1 - t*t) + 0.4*Math.cos(PI*t*2.5)*(1 - Math.abs(t))]); }
      slabP(B.p(M.WALL2), [[-hw, Y0], [hw, Y0], ...O.reverse()], F, 0, 0.35);
      slabP(B.p(M.TRIM), O.map(p => [p[0], p[1] + 0.25]).concat(O.slice().reverse().map(p => [p[0], p[1] - 0.05])), F, 0.3, 0.42); }
    // courtyards between the halls (granite paving) and the lane between the rear block and the main hall
    for (const [u0, u1, v0, v1] of [[9.5, 17.5, -13.4, 9.0], [-8.6, -1.6, -10.8, 10.0], [-17.5, -8.6, -6.0, 5.4]]) rectPrism(B.p(M.COURT), Fr, u0, u1, v0, v1, Y0, Y0 + 0.05);
    // front (east) facade: central doorway between marble pillars, timber doors, side windows with grilles
    { const F = (uu, vv, w) => Fr.R(26.6 + (w || 0), vv, -uu); // u along the facade (north -> south is -v), w outwards (east)
      const vc = -2.2;
      slabP(B.p(M.TRIM), rectO(-vc - 2.4, -vc + 2.4, Y0, Y0 + 3.9), F, 0, 0.1);
      shapeP(B.p(M.DOOR), rectO(-vc - 1.3, -vc + 1.3, Y0, Y0 + 3.3), F, 0.12);
      for (const s of [-1, 1]){ const p = Fr.R(27.6, 0, vc + s*1.9); LCyl(g, 0.22, 0.24, WH - 0.2, p[0], Y0, p[2], M.MARB, 8); }
      for (const s of [-1, 1]) for (const k of [5.2, 8.6]){ const uu = -vc + s*k; shapeP(B.p(M.WIN), rectO(uu - 0.7, uu + 0.7, Y0 + 1.2, Y0 + 2.8), F, 0.08);
        for (let i = 0; i < 4; i++) shapeP(B.p(M.TRIM), rectO(uu - 0.7 + 0.28 + i*0.28, uu - 0.7 + 0.36 + i*0.28, Y0 + 1.2, Y0 + 2.8), F, 0.11); }
      // stone steps up to the platform
      rectPrism(B.p(M.STONE), Fr, 26.6, 28.6, vc - 2.6, vc + 2.6, 0, 0.35); }
    // side and wing windows (small, timber-shuttered)
    winP(B.p(M.WIN), Fr.rect(-27.0, 26.6, -20.3, -13.4), Y0, 1, 4, 4.5, 1.0, 1.4, 1.2, 0.05, 5);
    winP(B.p(M.WIN), Fr.rect(-27.0, 26.6, 10.0, 19.5), Y0, 1, 4, 4.5, 1.0, 1.4, 1.2, 0.05, 5);
    B.flush(g); vFlush(g, V); return g;
  }};
SG_PLACES.push({type:'sgtanyeoknee', lat:1.298649, lon:103.843247, rot:0});
