// ================= Maghain Aboth Synagogue (1878, national monument), Waterloo Street =================
// Verified (Wikipedia): neoclassical / colonial, symmetrical; single storey with a U-shaped women's gallery (1893) and a more solid
// gallery (1924-25) forming a second storey; a covered porch with steps up to a vestibule designed for horse carriages; arched
// doorways with classical keystones; pilasters with decorative capitals along the corners and sides; a repeating sequence of
// Palladian arcades and pedestals; mostly rectangular timber-louvred windows. Footprint w172596786 (its data height 40 m is wrong);
// the porch is the centred projection of the footprint towards Waterloo Street (SE). Wikipedia says the facade faces west - the
// footprint shows the porch on the Waterloo Street side, which this model follows. Colours (white, green louvres), the hipped roof
// and the heights (eaves 10.5 m) are estimates.
LANDMARKS.sgmaghain = {zh:'马海阿波犹太会堂', en:'Maghain Aboth Synagogue', cat:'old', r:30, h:13.5,
  lt:{m:0, c:'#fff0d8', k:0.6, e:0.7, anim:'breathe'},
  build(){
    const g = new THREE.Group(), B = mkB(), Fr = frm(38.5*PI/180), ry = -38.5*PI/180;
    const M = {WALL:'#f0ece2', TRIM:'#fbfaf5', LOUV:'#3f5f48', DARK:'#2b2a28', ROOF:'#7b7a76', BASE:'#a7a296', STEP:'#c9c4b8'};
    const U0 = -14.0, U1 = 12.4, V0 = -10.1, V1 = 10.1, Y0 = 0.9, Y1 = 5.6, Y2 = 10.5;
    rectPrism(B.p(M.BASE), Fr, U0, U1, V0, V1, -5, Y0);
    rectPrism(B.p(M.WALL), Fr, U0, U1, V0, V1, Y0, Y2);
    const P = Fr.rect(U0, U1, V0, V1);
    bandP(B.p(M.TRIM), P, Y1 - 0.25, 0.45, 0.18); bandP(B.p(M.TRIM), P, Y2 - 0.6, 0.6, 0.35);
    parP(B.p(M.TRIM), offP(P, -0.3), Y2, Y2 + 1.0, 0.3);
    // low hipped roof behind the parapet
    hipRoof(g, ...Fr.X((U0 + U1)/2, 0), U1 - U0 - 1.2, V1 - V0 - 1.2, Y2, 3.0, M.ROOF, ry);
    // pilasters at the bays, ground-floor arcade of round-arched openings with keystones, upper louvred windows
    for (const E of edgesF(P)){ const k = Math.max(2, Math.round(E.L/3.3));
      for (let j = 0; j <= k; j++){ const u = j*E.L/k; slabP(B.p(M.TRIM), rectO(u - 0.3, u + 0.3, Y0, Y2 - 0.6), E.F, 0, 0.22); slabP(B.p(M.TRIM), rectO(u - 0.42, u + 0.42, Y2 - 1.1, Y2 - 0.6), E.F, 0, 0.3); }
      for (let j = 0; j < k; j++){ const u = (j + 0.5)*E.L/k, hw = Math.min(1.0, E.L/k/2 - 0.55);
        shapeP(B.p(M.DARK), mv(rArchO(hw, 3.6, 8), u, Y0 + 0.2), E.F, 0.04);
        shapeP(B.p(M.LOUV), mv(rectO(-hw + 0.1, hw - 0.1, 0, 2.5), u, Y0 + 0.3), E.F, 0.06);
        slabP(B.p(M.TRIM), [[u - 0.22, Y0 + 3.55], [u + 0.22, Y0 + 3.55], [u + 0.3, Y0 + 4.1], [u - 0.3, Y0 + 4.1]], E.F, 0, 0.12);
        shapeP(B.p(M.DARK), rectO(u - hw*0.8, u + hw*0.8, Y1 + 0.7, Y1 + 3.6), E.F, 0.04);
        for (let i = 0; i < 6; i++) shapeP(B.p(M.LOUV), rectO(u - hw*0.8 + 0.05, u + hw*0.8 - 0.05, Y1 + 0.8 + i*0.47, Y1 + 1.05 + i*0.47), E.F, 0.06);
        slabP(B.p(M.TRIM), rectO(u - hw*0.8 - 0.15, u + hw*0.8 + 0.15, Y1 + 3.6, Y1 + 3.85), E.F, 0, 0.1); } }
    // the carriage porch on Waterloo Street: four columns, a flat roof with balustraded parapet, steps
    { const PU0 = U1, PU1 = 17.0, PV0 = -2.9, PV1 = 3.8;
      rectPrism(B.p(M.STEP), Fr, PU0, PU1, PV0, PV1, -5, 0.5);
      for (const [uu, vv] of [[PU1 - 0.5, PV0 + 0.5], [PU1 - 0.5, PV1 - 0.5], [PU0 + 0.6, PV0 + 0.5], [PU0 + 0.6, PV1 - 0.5]]){ const p = Fr.R(uu, 0, vv); LBox(g, 0.9, 0.6, 0.9, p[0], 0.5, p[2], M.TRIM, ry); LCyl(g, 0.32, 0.36, 4.0, p[0], 1.1, p[2], M.TRIM, 10); LBox(g, 0.85, 0.4, 0.85, p[0], 5.1, p[2], M.TRIM, ry); }
      rectPrism(B.p(M.TRIM), Fr, PU0, PU1 + 0.2, PV0 - 0.2, PV1 + 0.2, 5.5, 6.3);
      parP(B.p(M.TRIM), Fr.rect(PU0, PU1 + 0.2, PV0 - 0.2, PV1 + 0.2), 6.3, 7.2, 0.2);
      const F = (uu, vv, w) => Fr.R(U1 + (w || 0), vv, -uu);
      shapeP(B.p(M.DARK), mv(rArchO(1.4, 4.2, 10), -0.45, Y0), F, 0.06); slabP(B.p(M.TRIM), [[-0.75, Y0 + 3.9], [-0.15, Y0 + 3.9], [-0.05, Y0 + 4.6], [-0.85, Y0 + 4.6]], F, 0, 0.15); }
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'sgmaghain', lat:1.298228, lon:103.850701, rot:0});

// ================= The Cathay (1939 Cathay Building facade; 2006 redevelopment), 2 Handy Road =================
// Verified (Wikipedia): Frank W. Brewer's 1939 Cathay Building (Singapore's first skyscraper, national monument 2003); only a portion
// of the main facade was revealed and preserved; the 2006 redevelopment by Tange Associates + RDC holds retail and a cineplex, with
// The Cathay Residences tower above. Real footprint w46503590 (8 floors, 27.6 m) and its tower part (26.4-53.4 m). Which face keeps
// the old front (here the Handy Road / Dhoby Ghaut face) and the stepped Art Deco tower piece (to 34 m) are estimates.
LANDMARKS.sgcathay = {zh:'国泰大厦', en:'The Cathay', cat:'new', r:58, h:53.4,
  lt:{m:1, c:'#e3ecf5', k:0.55},
  build(){
    const g = new THREE.Group(), B = mkB();
    const P = [[21.8,-47.3],[39.7,-20.6],[41.5,-8.2],[38.5,9.0],[42.1,10.8],[42.1,23.8],[38.0,26.2],[40.3,36.9],[36.2,44.6],[11.7,50.5],[2.1,46.4],[-3.2,39.2],[-21.2,41.6],[-24.7,29.8],[-23.5,26.2],[-54.6,12.0],[-51.0,6.6],[-39.7,-23.6],[-40.9,-37.8],[-21.2,-41.4]];
    const T = [[-42.6,8.3],[-43.8,0.0],[-42.6,0.0],[-43.8,-7.7],[-37.3,-8.9],[-36.7,-6.5],[-33.1,-7.7],[-36.1,-20.7],[-31.3,-21.3],[-33.7,-32.6],[-3.8,-38.5],[3.3,-0.6]];
    const M = {GLS:{c:'#5d7486', m:1, fh:4.2, cw:3.2}, GLR:{c:'#6c7f8c', m:1, fh:3.2, cw:2.6}, FRAME:'#c9ccd0', CREAM:{c:'#efe6cf', m:0, lc:'#fff0d0', lk:0.9}, FIN:{c:'#f6efdc', m:0, lc:'#fff0d0', lk:1.0}, DARK:'#2e3236', ROOF:'#8d9296', SHOP:{c:'#3d4448', glow:'#ffe2b0', gk:0.9}};
    prismP(B.p(M.ROOF), P, -5, 0.4, false);
    // 2006 podium: glass curtain wall in floor bands, shopfronts at the street
    prismP(B.p(M.GLS), P, 0.4, 27.6, false); capP(B.p(M.ROOF), P, 27.6);
    for (let f = 1; f <= 6; f++) bandP(B.p(M.FRAME), P, 4.6 + (f - 1)*3.85, 0.45, 0.2);
    for (const E of edgesF(P)){ if (E.L < 3) continue; shapeP(B.p(M.SHOP), rectO(0.4, E.L - 0.4, 0.6, 4.0), E.F, 0.05);
      const k = Math.round(E.L/1.6); for (let j = 1; j < k; j++) shapeP(B.p(M.FRAME), rectO(j*E.L/k - 0.06, j*E.L/k + 0.06, 4.6, 27.2), E.F, 0.06); }
    parP(B.p(M.FRAME), P, 27.6, 28.6, 0.25);
    // residential tower on the west part (26.4 - 53.4 m): glass with balcony slabs
    prismP(B.p(M.GLR), T, 27.6, 53.4, false); capP(B.p(M.ROOF), T, 53.4);
    for (let y = 30.6; y < 53; y += 3.2) bandP(B.p(M.FRAME), T, y, 0.25, 0.9);
    parP(B.p(M.FRAME), T, 53.4, 54.6, 0.3);
    // the preserved 1939 front on the Handy Road / Dhoby Ghaut face: cream wall with tall piers, stepped central tower piece
    { const a = [-54.6, 12.0], b = [-23.5, 26.2], L = Math.hypot(b[0] - a[0], b[1] - a[1]), ex = (b[0] - a[0])/L, ez = (b[1] - a[1])/L, nx = ez, nz = -ex;
      const sg = (nx*(a[0]) + nz*(a[1])) < 0 ? 1 : -1, F = (u, v, w) => [a[0] + ex*u - sg*nx*(w || 0), v, a[1] + ez*u - sg*nz*(w || 0)];
      slabP(B.p(M.CREAM), rectO(0, L, 0.4, 27.6), F, 0, 0.6);
      for (let j = 0; j <= 14; j++){ const u = 1 + j*(L - 2)/14; slabP(B.p(M.FIN), rectO(u - 0.35, u + 0.35, 4.4, 28.4), F, 0.6, 1.3); }
      for (let f = 0; f < 6; f++) for (let j = 0; j < 14; j++){ const u = 1 + (j + 0.5)*(L - 2)/14; shapeP(B.p(M.DARK), rectO(u - 0.6, u + 0.6, 6 + f*3.7, 8.4 + f*3.7), F, 0.65); }
      shapeP(B.p(M.SHOP), rectO(L/2 - 5, L/2 + 5, 0.6, 4.2), F, 0.65);
      // central stepped tower piece
      const cu = L/2; let w = 9, y = 27.6;
      for (const [dh, dw] of [[3.2, 0], [2.4, 2.2], [2.0, 4.0]]){ const ww = w - dw; slabP(B.p(M.CREAM), rectO(cu - ww/2, cu + ww/2, y, y + dh), F, -2.5, 1.0); y += dh; }
      for (const s of [-2.4, -0.8, 0.8, 2.4]) slabP(B.p(M.FIN), rectO(cu + s - 0.25, cu + s + 0.25, 20, 34.6), F, 1.0, 1.5); }
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'sgcathay', lat:1.299495, lon:103.847711, rot:0});

// ================= Tekka Centre (1979-82; renovated 2008-09), Buffalo Road / Serangoon Road =================
// Verified (Wikipedia): two floors, the hawker centre and wet market on the ground floor, basement parking; opened 1982, renovated
// 2008-09. Real footprint w47198835 (the HDB blocks beside it stay as data buildings). Colours, the open market frontage and the
// roof are estimates.
LANDMARKS.sgtekka = {zh:'竹脚中心', en:'Tekka Centre', cat:'new', r:100, h:83.1,
  lt:{m:0, c:'#ffe0b0', k:0.45, e:0.7},
  build(){
    const g = new THREE.Group(), B = mkB();
    const P = [[-55.9,-42.4],[-69.1,-39.4],[-79.8,-46.5],[-77.4,-50.7],[-73.2,-49.5],[-74.4,-45.3],[-64.9,-44.2],[-63.7,-47.1],[-57.1,-48.9],[-57.1,-50.1],[-53.5,-51.3],[-52.9,-48.3],[-44.0,-50.1],[-44.6,-53.6],[-39.8,-54.8],[-41.6,-63.1],[-38.0,-63.7],[-37.4,-60.8],[-29.7,-63.1],[-30.3,-67.3],[-29.7,-68.5],[-26.7,-65.5],[-21.9,-70.8],[34.8,-25.8],[16.3,-2.1],[42.6,18.1],[49.7,9.2],[59.9,16.9],[50.9,30.6],[65.9,40.1],[55.7,55.5],[38.4,44.2],[15.7,49.5],[6.2,60.8],[8.6,62.6],[7.4,64.4],[5.0,62.0],[0.8,66.7],[-41.0,26.4],[-41.6,18.1],[-36.2,18.1],[-35.0,19.3],[-23.7,17.5],[-24.3,13.4],[-23.1,10.4],[-11.1,-4.4],[-55.3,-40.6]];
    const M = {WALL:'#d9c7a6', UP:'#b8644a', TRIM:'#eee6d4', DARK:{c:'#3a3530', glow:'#ffd9a0', gk:0.7}, WIN:{c:'#3d4246', m:1, fh:4.4, cw:3.2}, ROOF:'#8a8a84', COL:'#cfc6b4', BASE:'#8d877c', HDB:{c:'#e6e0d2', m:1, fh:2.8, cw:2.4}, HBAND:'#c7bfae'};
    prismP(B.p(M.BASE), P, -5, 0.4, false);
    const P0 = offP(P, 2.2);
    prismP(B.p(M.DARK), P0, 0.4, 5.0, false);
    for (const [x, z, a] of alongP(P, 6)) boxP(B.p(M.COL), 0.6, 4.6, 0.6, x, 0.4, z);
    prismP(B.p(M.WALL), P, 5.0, 10.0, false); capP(B.p(M.ROOF), P, 10.0);
    bandP(B.p(M.UP), P, 5.0, 1.0, 0.15); bandP(B.p(M.UP), P, 9.2, 0.8, 0.2);
    winP(B.p(M.WIN), P, 6.0, 1, 4.4, 4.0, 2.8, 2.2, 0.4, 0.06, 3.5);
    parP(B.p(M.TRIM), P, 10.0, 11.0, 0.25);
    // the HDB blocks of the complex that rise beside the market podium (w178436578/79/80/81, heights = their OSM parts); they
    // stand inside this model's hull, so they are drawn here as plain slab blocks instead of being hidden
    const HDB = [[76.5,[[-49.4,-75.0],[-45.2,-76.2],[-44.6,-73.8],[-37.4,-75.6],[-39.2,-80.3],[-35.6,-81.5],[-35.0,-76.2],[-31.4,-76.8],[-26.7,-72.6],[-25.5,-73.8],[-21.9,-70.8],[-26.7,-65.5],[-29.7,-68.5],[-30.3,-67.3],[-29.7,-63.1],[-37.4,-60.8],[-38.0,-63.7],[-41.6,-63.1],[-39.8,-54.8],[-44.6,-53.6],[-47.0,-64.3],[-45.8,-64.3],[-47.0,-67.9],[-50.0,-67.9],[-50.5,-72.6]]],[76.5,[[-45.8,-64.9],[-47.0,-64.3],[-44.0,-50.1],[-52.9,-48.3],[-53.5,-51.3],[-57.1,-50.1],[-57.1,-48.9],[-63.7,-47.1],[-64.9,-44.2],[-74.4,-45.3],[-73.2,-49.5],[-77.4,-50.7],[-76.8,-51.9],[-77.4,-53.0],[-78.6,-51.9],[-79.8,-53.0],[-75.0,-61.4],[-69.1,-58.4],[-69.1,-61.4],[-65.5,-61.4],[-65.5,-59.0],[-62.5,-59.6],[-62.5,-60.8],[-52.9,-63.1],[-52.9,-63.7],[-54.1,-63.7],[-54.7,-65.5],[-50.5,-66.7],[-50.5,-63.7]]],[10.5,[[64.1,20.5],[63.5,14.0],[65.3,14.0],[65.9,11.0],[65.3,10.4],[62.9,13.4],[61.7,12.2],[59.9,14.6],[52.1,8.6],[53.9,6.8],[49.7,3.3],[48.0,5.1],[40.8,-0.9],[42.0,-2.1],[30.6,-11.5],[40.2,-22.8],[77.2,7.4],[78.4,20.5],[74.2,27.0],[77.2,29.4],[76.0,31.2],[73.0,29.4],[65.9,40.1],[55.7,33.5],[56.3,32.3],[54.5,31.2],[59.3,22.9],[61.1,24.0],[63.5,20.5]]],[69.9,[[28.3,65.0],[28.3,72.1],[27.7,73.3],[22.3,74.4],[21.7,72.1],[16.3,73.3],[16.3,78.6],[14.5,79.2],[12.7,78.0],[12.7,73.9],[9.7,75.0],[0.8,66.7],[5.0,62.0],[7.4,64.4],[8.6,62.6],[6.2,60.8],[8.6,58.4],[10.9,60.8],[15.7,59.6],[15.7,62.0],[20.5,60.8],[18.1,53.1],[22.3,51.9],[24.1,56.7],[27.1,56.1]]],[83.1,[[21.7,48.4],[31.2,46.0],[32.4,50.7],[45.0,53.1],[47.4,50.1],[55.1,55.5],[53.9,57.8],[56.9,60.2],[52.7,66.7],[47.4,63.2],[43.2,67.9],[41.4,67.3],[42.0,62.6],[31.8,60.8],[31.2,63.2],[28.3,65.0],[27.1,56.1],[24.1,56.7]]],[83.1,[[-44.0,-0.3],[-41.6,9.8],[-42.8,11.0],[-46.4,12.2],[-48.2,11.0],[-48.2,9.8],[-54.7,11.0],[-53.5,16.3],[-57.1,16.9],[-57.7,11.6],[-61.9,12.2],[-70.3,5.1],[-67.3,-1.5],[-64.9,0.3],[-63.7,-1.5],[-64.3,-2.1],[-61.9,-5.0],[-60.1,-3.2],[-55.3,-4.4],[-54.7,-0.3],[-50.5,-0.9],[-52.3,-9.8],[-47.6,-10.4],[-47.0,-3.2],[-45.8,-3.8]]],[83.1,[[-48.2,-14.5],[-39.2,-16.3],[-38.6,-13.3],[-23.7,-10.4],[-22.5,-11.5],[-15.9,-6.8],[-16.5,-5.0],[-12.9,-2.6],[-18.9,5.1],[-24.9,0.9],[-28.5,6.3],[-30.8,4.5],[-27.3,0.3],[-39.2,-2.1],[-38.6,1.5],[-41.6,2.7],[-42.2,-0.9],[-44.0,-0.3],[-45.8,-3.8],[-47.0,-3.2]]],[10.5,[[-88.2,-21.6],[-83.4,-28.7],[-86.4,-30.5],[-84.6,-32.9],[-82.2,-31.1],[-76.2,-40.6],[-65.5,-34.1],[-66.7,-32.9],[-64.3,-31.7],[-69.7,-23.4],[-71.4,-24.6],[-73.2,-22.2],[-76.8,-24.6],[-78.0,-23.4],[-75.6,-21.0],[-74.4,-21.6],[-73.2,-14.5],[-74.4,-14.5],[-74.4,-13.3],[-75.6,-11.5],[-75.0,-10.9],[-72.6,-13.9],[-71.4,-12.7],[-69.7,-14.5],[-61.9,-8.6],[-64.3,-5.6],[-65.5,-6.8],[-67.3,-4.4],[-63.7,-1.5],[-64.9,0.3],[-67.3,-1.5],[-70.3,5.1],[-87.0,-8.6]]]];
    for (const [top, Q] of HDB){ prismP(B.p(M.HDB), Q, -5, top, false); capP(B.p(M.ROOF), Q, top); for (let y = 6; y < top - 2; y += 8.4) bandP(B.p(M.HBAND), Q, y, 0.5, 0.15); parP(B.p(M.HBAND), Q, top, top + 1.0, 0.25); }
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'sgtekka', lat:1.306206, lon:103.850593, rot:0});

// ================= Nanyang Academy of Fine Arts, Campus 1 (Bencoolen Street) =================
// Verified (Wikipedia): Campus 1 has two wings, A and B, joined by a linking bridge (not placed: its position is unknown); skylight studios with even daylight; the
// Tower Block (2017, S$40 m) sits on top of Bencoolen MRT station next to Campus 1. Real footprints w172596714 (7 floors, 24.3 m),
// w481661171 (6 floors, 21 m) and the Tower Block w380508304 (40 m in the data, estimate). Colours and the skylight form are estimates.
LANDMARKS.sgnafa = {zh:'南洋艺术学院', en:'Nanyang Academy of Fine Arts (Campus 1)', cat:'new', r:88, h:40,
  lt:{m:1, c:'#e6eef5', k:0.5},
  build(){
    const g = new THREE.Group(), B = mkB();
    const A = [[25.8,-32.2],[20.4,-25.1],[22.2,-23.3],[15.0,-15.0],[24.6,-7.3],[18.0,1.0],[12.0,-0.2],[12.6,-5.5],[9.6,-8.5],[-4.7,9.3],[7.3,9.9],[7.9,13.5],[-19.0,44.3],[-43.5,23.6],[27.6,-61.8],[34.1,-55.9],[40.1,-63.0],[71.7,-36.9],[50.8,-12.0]];
    const Bw = [[-19.0,44.3],[-32.1,60.3],[-56.0,39.6],[-43.5,23.6]], T = [[-32.1,60.3],[-42.3,71.6],[-66.8,51.4],[-56.0,39.6]];
    const M = {WALL:'#e4e2dc', WALL2:'#cfd2d4', BAND:'#b9bcbe', WIN:{c:'#46525a', m:1, fh:3.47, cw:3}, TRIM:'#f4f3ef', ROOF:'#9a9c9a', SKY:{c:'#b8d0dc', glow:'#e8f2ff', gk:0.5}, TWR:{c:'#55646e', m:1, fh:3.6, cw:3}, BASE:'#8f8f8a'};
    for (const Q of [A, Bw, T]) prismP(B.p(M.BASE), Q, -5, 0.4, false);
    blkP(B, A, 0.4, 7, 3.42, M, {bay:3.6, ww:2.6, wh:1.9, sill:0.8});
    blkP(B, Bw, 0.4, 6, 3.43, {WALL:M.WALL2, BAND:M.BAND, WIN:M.WIN, TRIM:M.TRIM, ROOF:M.ROOF}, {bay:3.6, ww:2.6, wh:1.9, sill:0.8});
    // skylight studios on the top of wing A: north-light monitors in rows
    { const d = [Math.cos(-0.876), Math.sin(-0.876)], n = [-d[1], d[0]];
      for (let t = -30; t <= 30; t += 6){ const Q = clipST(offP(A, 3), d, n, -60, 60, t, t + 3.4); if (Q.length < 3) continue;
        prismP(B.p(M.ROOF), Q, 24.4, 25.6, false); capP(B.p(M.SKY), Q, 25.6); } }
    // the Tower Block (2017): glass-and-panel tower with horizontal floor bands
    prismP(B.p(M.TWR), T, 0.4, 40, false); capP(B.p(M.ROOF), T, 40);
    for (let y = 4.0; y < 40; y += 3.6) bandP(B.p(M.TRIM), T, y, 0.5, 0.18);
    for (const E of edgesF(T)) for (let j = 1; j < 6; j++) slabP(B.p(M.TRIM), rectO(j*E.L/6 - 0.2, j*E.L/6 + 0.2, 4.0, 40), E.F, 0, 0.35);
    parP(B.p(M.TRIM), T, 40, 41.2, 0.3);
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'sgnafa', lat:1.299648, lon:103.851393, rot:0});
