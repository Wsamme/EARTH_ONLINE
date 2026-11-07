// ================= Singapore Management University (city campus, 2004-06; Connexion 2019) - SITE =================
// Verified (OSM / refs): the campus = the university land-use polygons between Stamford Road, Bras Basah Road, Fort Canning and
// Victoria Street, with its named buildings: Li Ka Shing Library, School of Economics / School of Computing and Information
// Systems 1 and 2, School of Accountancy, Lee Kong Chian School of Business, School of Law & Kwa Geok Choo Library, School of
// Social Sciences & College of Integrative Studies, SMU Connexion, Innovation Bridge; the Campus Green (recreation ground) and the
// pedestrian concourse areas. The keep polygon is the union of the two main university polygons (it leaves out the National
// Museum, SAM and the Cathedral of the Good Shepherd, which are separate landmark models). Building heights are the data values
// (mostly estimates); the facade treatment (glass between terracotta-toned fins and white floor bands) is an estimate. The
// Administration Building on Victoria Street (a separate university polygon) is the landmark key sgsmu2 (label:false).
const SMU = {"keep":[[-24.5,15.0],[-45.4,-5.8],[-85.4,-73.7],[-165.4,-148.1],[-168.9,-155.2],[-170.1,-165.6],[-167.2,-172.4],[-131.9,-211.3],[-126.9,-212.2],[-121.5,-210.4],[-46.9,-150.8],[130.5,-20.6],[187.3,24.8],[181.4,24.8],[136.1,-12.0],[98.9,24.8],[99.1,24.8],[56.4,67.2],[134.0,125.9],[68.7,196.7],[24.2,172.7],[4.2,155.8],[-3.0,167.4],[-2.1,169.2],[-3.6,171.2],[-22.1,161.7],[-46.3,202.7],[-68.6,191.4],[-81.5,211.3],[-111.9,195.2],[-157.6,277.1],[-164.2,279.5],[-169.8,265.5],[-177.9,220.7],[-178.5,202.7],[-167.2,135.9],[-94.3,79.6],[-80.6,55.9],[-60.9,42.0],[-41.1,24.8]],"green":[[-41.8,-7.6],[-56.7,-36.6],[-64.8,-48.8],[-22.1,-66.3],[1.8,-67.2],[25.4,-47.0],[-20.9,11.1]],"ped":[[40.6,-73.4],[40.6,-75.2],[49.3,-68.3],[54.0,-68.3],[64.2,-61.5],[33.4,-25.9],[26.0,-31.6],[16.1,-11.7],[0.3,-0.7],[-8.1,8.4],[-15.2,19.4],[-18.8,19.1],[-24.5,15.0],[25.4,-47.0],[1.8,-67.2],[-10.4,-66.0],[-9.2,-72.8],[-1.2,-72.8],[4.2,-76.1],[17.6,-90.9]],"bld":[["w46522841","Li Ka Shing Library",30.0,null,[[31.9,25.2],[42.6,11.6],[45.1,13.9],[50.4,8.6],[69.1,21.8],[32.5,63.4],[18.7,52.7],[11.6,43.8],[13.3,41.9],[12.1,35.5],[7.5,31.4],[0.9,37.3],[-5.7,34.9],[-2.9,31.3],[-8.7,29.6],[-14.7,26.0],[-15.3,19.4],[-8.1,8.1],[0.2,-0.8],[15.8,-12.1],[24.2,-13.9],[29.6,-13.9],[33.2,-10.3],[33.8,1.0],[32.1,8.8],[29.7,14.1],[24.9,18.8]]],["w46522839","School of Economics & School of Computing and Information Systems (2)",26.0,null,[[-155.5,-168.0],[-152.5,-170.3],[-144.2,-172.7],[-141.8,-179.2],[-138.2,-182.2],[-144.2,-187.5],[-141.2,-194.1],[-131.0,-205.3],[-61.8,-147.8],[-70.1,-136.0],[-76.7,-132.4],[-79.7,-134.8],[-82.1,-132.4],[-80.3,-130.0],[-86.9,-117.0],[-87.5,-117.6],[-91.0,-111.0],[-100.6,-99.8],[-151.3,-140.7],[-146.6,-146.6],[-147.8,-147.2],[-150.7,-144.3],[-155.5,-148.4],[-159.1,-153.1],[-159.1,-159.7]]],["w1094096441","School of Economics & School of Computing",17.1,null,[[-107.8,-140.1],[-109.5,-142.5],[-113.1,-138.9],[-111.3,-136.0],[-112.5,-134.2],[-134.0,-152.6],[-128.1,-160.3],[-106.0,-143.1]]],["w46522840","School of Computing and Information Systems 1",26.0,null,[[8.1,-90.9],[-0.9,-79.6],[1.5,-78.4],[-9.2,-76.6],[-12.2,-79.6],[-15.2,-76.1],[-34.3,-92.1],[-35.5,-90.9],[-34.3,-89.1],[-37.9,-85.5],[-39.7,-86.1],[-40.3,-84.4],[-37.9,-82.0],[-36.1,-78.4],[-35.5,-75.5],[-40.3,-71.9],[-46.9,-71.3],[-48.1,-70.1],[-50.4,-70.7],[-52.2,-69.5],[-54.6,-70.7],[-56.4,-69.5],[-58.2,-70.7],[-60.0,-70.1],[-67.8,-71.9],[-70.7,-79.0],[-70.7,-86.7],[-68.4,-92.1],[-72.5,-95.0],[-66.0,-99.8],[-63.0,-97.4],[-61.2,-99.8],[-63.0,-102.1],[-56.4,-115.2],[-55.2,-114.6],[-51.6,-121.7],[-51.0,-121.1],[-42.1,-132.4]]],["w783586378","",30.0,null,[[-52.2,61.5],[-46.3,62.7],[-43.9,71.6],[-45.7,74.0],[-40.9,91.8],[-39.1,91.2],[-38.5,93.0],[-28.9,82.3],[-17.0,91.2],[-31.3,107.8],[-28.9,113.7],[-32.5,118.5],[-43.3,98.9],[-48.6,80.5]]],["w175139008","School of Social Sciences & College of Integrative Studies",24.3,7,[[-169.8,165.3],[-119.7,193.2],[-162.1,269.1],[-168.6,265.5],[-175.8,222.8],[-176.4,202.1]]],["w719635727","Innovation Bridge",7.0,2,[[-61.2,123.2],[-75.5,147.5],[-92.2,136.8],[-77.3,113.1]]],["w719635726","SMU Connexion",30.0,null,[[-63.6,59.2],[-52.2,61.5],[-48.6,80.5],[-43.3,98.9],[-32.5,118.5],[-35.5,122.0],[-32.5,124.4],[-35.5,129.1],[-27.2,139.8],[-30.7,142.8],[-103.0,96.5],[-98.2,89.4],[-95.2,90.6],[-93.4,88.2],[-95.8,86.4],[-108.3,96.5],[-109.5,95.3],[-123.9,113.1],[-126.3,111.9],[-112.5,96.5],[-113.1,95.9],[-64.2,55.6]]],["w423797941","School of Law & Kwa Geok Choo Library",30.0,null,[[-52.2,195.5],[-85.7,176.6],[-97.6,196.7],[-143.0,169.5],[-138.2,162.3],[-146.6,157.0],[-148.9,152.8],[-149.5,146.9],[-148.3,141.6],[-146.0,136.2],[-139.4,129.7],[-128.6,126.8],[-122.7,128.5],[-118.5,131.5],[-112.5,123.2],[-75.5,147.5],[-37.9,175.4]]],["w136853818","Lee Kong Chian School of Business",30.0,null,[[68.4,108.4],[63.6,114.9],[77.9,125.0],[82.7,126.2],[86.9,124.4],[106.6,104.2],[116.7,111.3],[132.8,125.6],[70.8,191.4],[63.6,184.9],[51.1,170.0],[32.5,168.3],[12.8,154.6],[51.1,97.1]]],["w175146817","",8.0,null,[[83.9,109.0],[90.5,113.7],[86.3,119.6],[79.7,114.9]]],["w136853913","School of Accountancy",30.0,null,[[-40.9,39.0],[-34.9,40.8],[-24.2,48.5],[-17.6,53.8],[-12.2,62.1],[-11.0,60.3],[-5.1,68.0],[-3.9,66.3],[4.5,73.4],[3.3,75.2],[5.1,75.2],[8.7,76.9],[20.0,86.4],[-15.2,132.7],[-29.5,114.3],[-28.9,113.7],[-31.3,107.8],[-17.0,91.2],[-28.9,82.3],[-38.5,93.0],[-39.1,91.2],[-40.9,91.8],[-45.7,74.0],[-43.9,71.6],[-46.3,62.7],[-47.5,62.1],[-49.8,47.3],[-45.7,41.4]]],["w743764345","",5.0,null,[[66.0,39.0],[70.8,42.5],[63.0,52.0],[58.8,48.5]]]]};
function smuBlock(B, M, P, y0, top, fh, fin){
  prismP(B.p(M.BASE), P, y0 - 5, y0 + 0.4, false);
  prismP(B.p(M.GLS), P, y0 + 0.4, top, false); capP(B.p(M.ROOF), P, top);
  for (let y = y0 + fh; y < top - 1; y += fh) bandP(B.p(M.BAND), P, y - 0.4, 0.6, 0.25);
  if (fin) for (const E of edgesF(P)){ if (E.L < 4) continue; const k = Math.round(E.L/fin); for (let j = 1; j < k; j++) slabP(B.p(M.FIN), rectO(j*E.L/k - 0.18, j*E.L/k + 0.18, y0 + 4.5, top - 0.6), E.F, 0, 0.7); }
  parP(B.p(M.BAND), P, top, top + 1.0, 0.25);
}
Object.assign(SITES, {sgsmu:{zh:'新加坡管理大学', en:'Singapore Management University', lat:1.29650, lon:103.84990, r:240, keep:SMU.keep, keepRoads:[11, 12], h:34,
  lt:{m:1, c:'#e4ecf4', k:0.55},
  build(ctx){
    const g = new THREE.Group(), B = mkB();
    const M = {GLS:{c:'#55697a', m:1, fh:4.2, cw:3.2}, BAND:'#e9e6df', FIN:'#b06a45', ROOF:'#8e918f', BASE:'#9c968b', LIB:{c:'#6d7f8c', m:1, fh:4.4, cw:3.6}, TERR:'#a65a3a', DECK:'#c9c2b3', SKY:{c:'#b6cdd6', op:0.55}};
    // ground: paving over the campus, the Campus Green lawn, the pedestrian concourse
    ctx.paint(SMU.keep, [192, 188, 178]);
    ctx.paint(SMU.green, [118, 156, 88]);
    ctx.paint(SMU.ped, [206, 200, 188]);
    for (const [osm, name, h, fl, P] of SMU.bld){
      let lo = Infinity, hi = -Infinity; for (const p of P){ const y = ctx.gy(p[0], p[1]); lo = Math.min(lo, y); hi = Math.max(hi, y); }
      const c = ctr(P), yc = ctx.gy(c[0], c[1]), base = Math.min(lo, yc), top = (lo + hi)/2 + h;
      if (osm === 'w719635727'){   // Innovation Bridge: a two-storey link raised over the ground on columns
        prismP(B.p(M.GLS), P, base + 4.5, base + 11, true); capP(B.p(M.ROOF), P, base + 11); bandP(B.p(M.FIN), P, base + 4.5, 0.8, 0.2);
        for (const [x, z] of alongP(P, 8)) LCyl(g, 0.3, 0.3, 4.6, x, ctx.gy(x, z) - 0.5, z, M.BAND, 6);
        continue; }
      if (h < 10){ prismP(B.p(M.BASE), P, base - 2, base + 0.4, false); prismP(B.p(M.TERR), P, base + 0.4, base + h, false); capP(B.p(M.ROOF), P, base + h); continue; }
      smuBlock(B, /Library/.test(name) ? Object.assign({}, M, {GLS:M.LIB}) : M, P, base, top, 4.2, /Connexion/.test(name) ? 0 : 3.0);
      if (/Connexion/.test(name)) for (let y = base + 4.2; y < top - 1; y += 4.2) bandP(B.p(M.TERR), P, y - 0.2, 0.35, 1.2);
      // roof terraces with planters on the larger blocks
      if (P.length >= 4 && h >= 24){ const Q = offP(P, 3.5); prismP(B.p(M.DECK), Q, top, top + 0.15, false); }
    }
    // trees round the Campus Green and along the concourse; lamps
    for (const [x, z] of alongP(SMU.green, 11)) ctx.tree(x, z, 3.2 + ctx.rng()*1.2, 'raintree');
    for (const [x, z] of alongP(SMU.ped, 14)) ctx.tree(x, z, 2.6, 'd');
    for (const [x, z] of alongP(SMU.ped, 9)) ctx.lamp(x, ctx.gy(x, z) + 4, z, [255, 226, 180]);
    for (const [x, z] of alongP(SMU.green, 9)) ctx.lamp(x, ctx.gy(x, z) + 4, z, [255, 226, 180]);
    B.flush(g); return g;
  }}});
// SMU Administration Building (81 Victoria Street, w136854009) and the block behind it (w175325173) in the separate university
// polygon at Victoria Street / Bras Basah Road; data heights (67 m, 27 m) are estimates.
LANDMARKS.sgsmu2 = {zh:'新加坡管理大学行政楼', en:'SMU Administration Building', cat:'new', r:60, h:67, label:false,
  lt:{m:1, c:'#e4ecf4', k:0.55},
  build(){
    const g = new THREE.Group(), B = mkB();
    const M = {GLS:{c:'#55697a', m:1, fh:4.2, cw:3.2}, BAND:'#e9e6df', FIN:'#b06a45', ROOF:'#8e918f', BASE:'#9c968b'};
    smuBlock(B, M, [[-21.1, 43.4], [-24.7, 41.1], [-27.2, 44.0], [-43.4, 30.2], [-2.6, -18.5], [17.1, -2.4]], 0, 67, 4.2, 3.0);
    smuBlock(B, M, [[6.9, -43.9], [17.0, -55.8], [43.3, -33.8], [17.0, -2.4], [-2.7, -18.4], [14.0, -38.0]], 0, 27, 4.2, 3.0);
    B.flush(g); return g;
  }};
SG_PLACES.push({type:'sgsmu2', lat:1.296609, lon:103.852057, rot:0});
