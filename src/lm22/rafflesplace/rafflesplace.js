// ===== lm22/rafflesplace: the Raffles Place / Marina Bay towers upgraded (City Brush v24, real Singapore 1:1):
// UOB Plaza One + Two, One Raffles Place, Republic Plaza, OCBC Centre, Marina Bay Financial Centre, Marina One.
// Remakes of the lm18/f2 and lm20/w2 models on the same real OSM footprints (FD tables copied from those files), with the real
// massing steps, crowns and facade systems (granite ribbon windows, aluminium grids, pink granite piers, fins, louvres,
// balconies, planted terraces) and a night look per building. Models in the real map frame: local +x east, +z south, rot 0.
// Block-scoped: only LANDMARKS and SG_PLACES are touched.

{
const PI = Math.PI, HP = PI/2, TAU = PI*2;
const FD = {"mbfc":{"T1":[[-28.7,-96.5],[-27.0,-100.7],[13.0,-85.9],[-1.9,-44.9],[-18.0,-39.0],[-53.2,-51.5],[-35.9,-98.9]],"T2":[[-50.2,24.4],[-93.8,-2.8],[-75.3,-31.9],[-31.7,-4.6]],"MBR":[[100.2,-3.4],[72.7,11.4],[59.6,-10.5],[82.3,-21.8],[97.2,-36.0],[116.3,-23.6]],"MBS":[[67.4,-43.8],[75.7,-37.8],[27.4,10.2],[18.4,4.3]],"T3":[[-21.6,33.3],[41.7,41.6],[33.9,98.6],[-4.9,93.8],[-3.7,87.9],[-21.0,85.5],[-19.2,73.1],[-27.0,71.9]],"T3a":[[13.6,77.2],[-27.0,71.9],[-21.6,33.3],[19.0,38.7]],"T3b":[[-3.7,87.9],[-21.0,85.5],[-19.2,73.1],[-2.5,75.4]],"T3c":[[-2.5,75.4],[13.6,77.2],[16.6,55.9],[39.3,58.8],[33.9,98.6],[-4.9,93.8]],"T3d":[[16.6,55.9],[19.0,38.7],[41.7,41.6],[39.3,58.8]],"POD":[[-111.1,27.4],[-93.8,-2.8],[-50.2,24.4],[-31.7,-4.6],[-75.3,-31.9],[-35.9,-98.9],[-53.2,-51.5],[-18.0,-39.0],[-1.9,-44.9],[13.0,-85.9],[97.2,-36.0],[82.3,-21.8],[59.6,-10.5],[72.7,11.4],[100.2,-3.4],[45.9,77.8],[36.9,77.2],[41.7,41.6],[-21.6,33.3],[-27.0,71.9],[-19.2,73.1],[-21.0,85.5]],"SITE":[[13.0,-85.9],[97.2,-36.0],[116.3,-23.6],[100.2,-3.4],[72.7,11.4],[41.7,41.6],[33.9,98.6],[-4.9,93.8],[-3.7,87.9],[-21.0,85.5],[-19.2,73.1],[-27.0,71.9],[-111.1,27.4],[-35.9,-98.9],[-28.7,-96.5],[-27.0,-100.7]],"_place":[1.27955,103.854394]},"marinaone":{"SITE6":[[-78.4,42.4],[-79.6,41.8],[-82.0,45.4],[-83.8,45.4],[-85.6,43.0],[-83.2,39.4],[-85.0,38.2],[-87.4,41.8],[-97.5,35.9],[-89.2,22.2],[-85.6,24.6],[-84.4,22.8],[-91.5,18.1],[-67.1,-21.1],[-63.5,-18.7],[-45.0,-48.3],[-48.0,-50.7],[-23.5,-89.9],[-16.9,-85.7],[-15.7,-87.5],[-19.3,-89.9],[-11.0,-103.5],[-0.2,-97.0],[-2.6,-92.8],[-0.8,-91.6],[1.6,-95.8],[4.0,-95.8],[4.6,-93.4],[2.8,-89.9],[4.0,-89.3],[8.2,-96.4],[57.1,-66.7],[49.9,-55.5],[51.1,-54.9],[55.3,-60.2],[58.3,-58.4],[58.3,-57.2],[54.1,-50.1],[52.3,-49.5],[49.9,-52.5],[50.5,-53.1],[49.3,-54.3],[40.4,-40.6],[26.1,-37.7],[14.1,-32.3],[5.8,-31.7],[-1.4,-30.6],[-5.6,-27.0],[-16.9,-6.8],[-24.1,3.2],[-27.1,9.2],[-27.1,19.9],[-25.3,29.9],[-17.5,45.9],[-17.5,51.3],[-27.1,67.3],[-25.9,67.9],[-22.3,67.3],[-21.1,69.7],[-25.3,76.8],[-27.1,77.4],[-29.5,75.0],[-26.5,69.7],[-27.7,68.5],[-34.8,79.2],[-83.2,49.5]],"OW":[[-25.3,5.0],[-27.1,9.2],[-27.1,19.9],[-25.3,29.9],[-17.5,45.9],[-17.5,51.3],[-34.8,79.2],[-83.2,49.5],[-72.4,32.3],[-85.6,24.6],[-84.4,22.8],[-91.5,18.1],[-67.1,-21.1]],"OE":[[-45.0,-48.3],[-48.0,-50.7],[-23.5,-89.9],[-16.9,-85.7],[-15.7,-87.5],[-2.0,-79.2],[8.2,-96.4],[57.1,-66.7],[40.4,-40.6],[26.1,-37.7],[14.1,-32.3],[5.8,-31.7],[-1.4,-30.6],[-6.8,-25.2]],"OWn":[[-27.1,67.3],[-25.9,67.9],[-22.3,67.3],[-21.1,69.7],[-25.3,76.8],[-27.1,77.4],[-29.5,75.0],[-26.5,69.7],[-27.7,68.5]],"OEn":[[49.9,-55.5],[51.1,-54.9],[55.3,-60.2],[58.3,-58.4],[58.3,-57.2],[54.1,-50.1],[52.3,-49.5],[49.9,-52.5],[50.5,-53.1],[49.3,-54.3]],"cW1":[[-85.0,38.2],[-79.0,28.2],[-72.4,32.3],[-78.4,42.4]],"cW2":[[-87.4,41.8],[-97.5,35.9],[-89.2,22.2],[-79.0,28.2]],"cW3":[[-83.2,39.4],[-81.4,37.6],[-80.2,37.6],[-79.0,39.4],[-81.4,44.8],[-83.2,45.9],[-85.0,45.4],[-85.6,43.0]],"cE1":[[-8.6,-83.3],[-2.6,-92.8],[4.0,-89.3],[-2.0,-79.2]],"cE2":[[-19.3,-89.9],[-11.0,-103.5],[-0.2,-97.0],[-8.6,-83.3]],"cE3":[[-2.6,-89.3],[1.6,-95.8],[2.8,-96.4],[4.6,-94.6],[4.6,-93.4],[0.4,-86.9],[-0.8,-87.5]],"RP":[[-1.4,95.8],[-5.6,93.4],[-2.0,87.5],[0.4,88.6],[2.2,85.7],[0.4,84.5],[5.2,76.8],[13.5,79.7],[23.7,86.3],[20.1,93.4],[17.7,91.6],[16.5,94.0],[33.2,103.5],[41.6,89.2],[38.6,87.5],[36.8,89.8],[29.6,85.7],[41.6,63.7],[46.4,56.6],[55.9,47.7],[61.9,51.3],[61.3,52.5],[60.1,51.9],[58.9,54.8],[60.1,55.4],[59.5,56.6],[61.3,57.8],[62.5,56.0],[64.3,57.8],[66.1,53.7],[70.2,56.0],[69.6,57.8],[75.0,60.8],[63.7,79.2],[57.1,75.6],[60.1,71.4],[57.7,70.3],[56.5,72.0],[53.5,70.3],[49.3,76.8],[52.3,79.2],[51.1,80.3],[53.5,81.5],[55.9,77.4],[62.5,81.5],[51.1,100.5],[45.8,97.5],[44.6,99.3],[49.9,102.9],[36.2,124.8],[23.7,117.1],[27.9,110.6],[26.1,109.4],[21.9,115.9],[12.9,110.0],[17.1,103.5],[21.3,105.8],[22.5,104.1],[20.1,102.9],[22.5,99.3],[15.9,95.8],[13.5,99.3],[11.7,98.1],[11.1,99.9],[15.3,102.3],[10.5,109.4],[-4.4,99.9]],"RG":[[99.5,-38.9],[95.3,-31.7],[91.1,-34.1],[90.5,-32.3],[92.3,-31.1],[89.9,-27.6],[96.5,-24.0],[98.3,-27.0],[100.7,-26.4],[101.9,-28.2],[97.7,-30.6],[101.3,-37.1],[110.8,-31.7],[106.7,-25.8],[108.5,-24.6],[112.6,-31.1],[125.2,-23.4],[112.0,-1.5],[107.3,-4.5],[106.1,-2.1],[110.8,0.9],[100.1,19.9],[92.9,15.7],[95.3,11.6],[93.5,10.4],[92.3,12.1],[89.3,10.4],[85.2,17.5],[88.2,19.3],[87.0,21.0],[89.3,22.2],[91.7,18.1],[98.3,21.6],[87.0,40.6],[81.6,37.1],[81.0,38.2],[76.2,35.9],[79.2,32.9],[76.8,31.7],[78.0,29.9],[76.2,28.7],[75.6,29.9],[73.8,29.3],[72.6,31.7],[73.2,32.3],[72.6,33.5],[66.1,29.9],[69.6,17.5],[73.8,9.8],[87.6,-11.0],[94.7,-6.2],[93.5,-3.9],[96.5,-2.1],[105.5,-16.3],[88.2,-25.8],[87.6,-24.6],[89.9,-22.8],[85.2,-16.3],[74.4,-22.3],[68.5,-28.2],[72.6,-35.9],[74.4,-34.7],[76.2,-38.3],[74.4,-39.4],[78.0,-45.4],[81.6,-43.0],[84.6,-47.2]],"PAV":[[86.4,64.9],[78.6,60.2],[87.0,47.1],[94.7,51.9]],"_place":[1.277352,103.852866]},"oneraffles":{"POD":[[24.8,-29.1],[24.2,-16.0],[27.8,-15.4],[27.2,-11.3],[31.9,-10.7],[31.3,-6.6],[35.5,-6.6],[28.4,76.5],[0.9,74.1],[3.9,42.1],[-11.0,40.9],[-6.9,-7.1],[-52.2,-11.3],[-48.1,-54.6],[-2.7,-49.8],[-3.3,-43.9],[38.5,-40.4]],"PODs":[[-7.5,-3.6],[23.0,-1.2],[24.2,-16.0],[27.8,-15.4],[27.2,-11.3],[31.9,-10.7],[31.3,-6.6],[35.5,-6.6],[28.4,76.5],[0.9,74.1],[3.9,42.1],[-11.0,40.9]],"T1a":[[38.5,-40.4],[-7.5,-3.6],[-3.3,-43.9]],"T1b":[[24.8,-29.1],[23.0,-1.2],[-7.5,-3.6]],"T2a":[[-2.7,-49.8],[-6.9,-7.1],[-52.2,-11.3]],"T2b":[[-2.7,-49.8],[-52.2,-11.3],[-48.1,-54.6]],"SIN":[[-55.8,-7.7],[-18.8,-5.4],[-20.0,10.6],[-57.0,8.3]],"BOS":[[-20.0,10.6],[-21.2,31.4],[-40.3,30.2],[-43.3,70.5],[-60.6,69.4],[-57.0,8.3]],"RBC":[[-0.3,74.1],[-24.8,72.3],[-23.0,48.0],[1.5,50.4]],"MAC":[[-24.8,72.3],[-35.5,71.1],[-33.7,49.2],[-31.3,47.4],[-23.0,48.0]],"_place":[1.284466,103.850951],"PODn":[[38.5,-40.4],[-3.3,-43.9],[-2.7,-49.8],[-48.1,-54.6],[-52.2,-11.3],[-6.9,-7.1],[-7.2,-3.9],[22.7,-1.5],[24.8,-29.1]]},"uob":{"P1":[[-32.7,-17.1],[-33.3,-10.6],[-30.3,-12.4],[-27.9,-10.0],[-28.5,-2.3],[-27.3,-1.1],[-28.5,0.1],[-29.1,7.2],[-32.1,9.6],[-34.5,6.6],[-35.7,16.1],[-42.9,15.5],[-41.1,18.5],[-43.5,20.8],[-51.8,20.2],[-53.0,20.8],[-53.6,19.7],[-60.2,19.1],[-62.6,16.1],[-60.2,13.7],[-67.9,13.1],[-67.3,6.0],[-70.3,7.8],[-72.7,5.4],[-72.1,-2.9],[-73.3,-4.1],[-72.1,-4.7],[-71.5,-11.2],[-67.9,-13.6],[-66.2,-11.2],[-65.0,-20.1],[-57.8,-19.5],[-59.6,-21.9],[-57.2,-24.2],[-50.6,-23.6],[-48.8,-24.8],[-47.1,-23.0],[-39.9,-22.5],[-38.1,-20.1],[-40.5,-17.7]],"HALL":[[-29.1,7.2],[-27.9,-10.0],[-25.0,-9.4],[-23.8,-20.1],[41.3,-14.7],[40.7,-10.0],[45.5,-8.8],[40.7,-5.3],[38.9,9.6],[48.5,20.8],[50.3,21.4],[49.7,25.6],[46.1,25.0],[45.5,29.1],[41.3,29.1],[40.7,33.3],[36.5,32.7],[35.9,36.8],[-29.1,30.3],[-26.8,7.8]],"P2":[[76.0,-1.1],[75.4,4.8],[76.0,6.0],[75.4,6.6],[74.8,13.1],[62.8,22.6],[56.3,22.0],[55.1,23.2],[54.5,22.0],[48.5,20.8],[39.0,9.6],[39.6,3.6],[38.4,1.8],[40.2,0.7],[40.8,-5.3],[52.1,-14.2],[57.5,-13.6],[59.3,-15.4],[61.1,-13.0],[67.0,-12.4]],"POD2":[[36.6,32.7],[40.8,33.3],[41.4,29.1],[45.5,29.1],[46.1,25.0],[49.7,25.6],[50.3,21.4],[62.8,22.6],[74.8,13.1],[70.6,42.8],[65.8,45.7],[45.5,43.4],[36.0,36.8]],"P1parts":[[260.0,280.0,[[-60.2,-5.8],[-60.8,-1.1],[-63.8,-3.5]]],[226.0,255.0,[[-42.3,-15.9],[-56.0,-17.1],[-57.2,-18.3],[-48.8,-24.8],[-41.7,-16.5]]],[260.0,280.0,[[-39.3,-3.5],[-36.3,-1.1],[-39.9,1.9],[-39.3,-1.1]]],[260.0,280.0,[[-47.1,-12.4],[-52.4,-12.4],[-48.8,-15.9]]],[190.0,226.0,[[-48.8,-24.8],[-42.9,-17.7],[-56.0,-18.9],[-50.6,-23.6]]],[0.0,190.0,[[-60.2,13.7],[-42.9,15.5],[-41.1,18.5],[-43.5,20.8],[-60.2,19.1],[-62.6,16.1]]],[226.0,255.0,[[-36.9,4.8],[-35.7,-8.2],[-34.5,-9.4],[-27.3,-1.1],[-36.3,5.4]]],[226.0,260.0,[[-35.1,-14.7],[-37.5,13.1],[-65.6,10.8],[-63.2,-17.7]]],[0.0,226.0,[[-32.7,-17.1],[-35.7,16.1],[-67.9,13.1],[-65.0,-20.1]]],[0.0,190.0,[[-66.2,-11.2],[-67.3,6.0],[-70.3,7.8],[-72.7,5.4],[-71.5,-11.2],[-67.9,-13.6]]],[226.0,255.0,[[-58.4,11.3],[-45.3,12.5],[-44.1,13.7],[-53.0,20.8],[-59.6,12.5]]],[190.0,226.0,[[-66.2,-8.8],[-67.3,3.6],[-73.3,-4.1]]],[226.0,255.0,[[-63.8,-8.8],[-65.0,3.6],[-66.2,4.8],[-73.3,-4.1],[-64.4,-10.6]]],[0.0,190.0,[[-40.5,-17.7],[-57.8,-19.5],[-59.6,-21.9],[-57.2,-24.2],[-39.9,-22.5],[-38.1,-20.1]]],[270.0,280.0,[[-51.2,8.4],[-56.0,7.2],[-58.4,4.8],[-60.2,1.9],[-60.8,-2.9],[-60.2,-5.8],[-57.2,-10.6],[-52.4,-12.4],[-49.4,-13.0],[-44.1,-11.2],[-41.7,-8.8],[-40.5,-6.4],[-39.3,-1.1],[-39.9,1.9],[-43.5,6.6],[-45.9,7.8]]],[0.0,190.0,[[-34.5,6.6],[-33.3,-10.6],[-30.3,-12.4],[-27.9,-10.0],[-29.1,7.2],[-32.1,9.6]]],[260.0,280.0,[[-53.0,8.4],[-48.8,8.4],[-51.2,11.3]]]],"_place":[1.28546,103.850663],"P2parts":[[156.0,162.0,[[52.7,15.0],[47.9,11.4],[44.9,5.5]]],[128.0,140.0,[[51.5,-8.7],[46.1,-3.4],[46.7,-9.3]]],[140.0,148.0,[[45.5,-1.0],[46.7,-9.3],[55.1,-8.1]]],[156.0,162.0,[[61.1,-7.5],[66.4,-4.0],[68.8,1.9]]],[140.0,148.0,[[52.7,15.0],[44.3,14.4],[44.9,5.5]]],[140.0,148.0,[[61.1,-7.5],[70.0,-6.4],[68.8,1.9]]],[128.0,140.0,[[44.9,9.7],[48.5,15.0],[44.3,14.4]]],[156.0,162.0,[[68.8,7.9],[64.6,13.2],[59.3,15.6]]],[140.0,148.0,[[68.8,7.9],[67.6,16.8],[59.3,15.6]]],[128.0,140.0,[[63.4,16.2],[68.2,12.6],[67.6,16.8]]],[128.0,140.0,[[46.1,-3.4],[45.5,-1.0],[42.0,1.9],[44.9,5.5],[44.9,9.7],[38.4,1.9]]],[128.0,140.0,[[63.4,16.2],[55.1,23.3],[48.5,15.0],[52.7,15.0],[55.7,18.5],[59.3,15.6]]],[128.0,140.0,[[51.5,-8.7],[59.3,-15.3],[65.8,-7.0],[61.1,-7.5],[58.1,-11.1],[55.1,-8.1]]],[128.0,140.0,[[65.8,-7.0],[70.0,-6.4],[69.4,-2.2]]],[128.0,162.0,[[55.7,18.5],[42.0,1.9],[58.1,-11.1],[71.8,5.5]]],[0.0,128.0,[[67.0,-12.3],[76.0,-1.0],[74.8,13.2],[62.8,22.7],[48.5,20.9],[39.0,9.7],[40.8,-5.2],[52.1,-14.1]]],[128.0,140.0,[[69.4,-2.2],[76.0,6.1],[68.2,12.6],[68.8,7.9],[71.8,5.5],[68.8,1.9]]],[156.0,162.0,[[45.5,-1.0],[49.1,-5.8],[55.1,-8.1]]]]},"republic":{"parts":[[0.0,83.0,[[12.7,22.0],[23.5,11.9],[23.5,15.5],[16.9,22.0]]],[0.0,263.0,[[23.5,7.2],[7.9,22.6],[3.8,22.6],[23.5,3.6]]],[0.0,83.0,[[-23.7,-17.2],[-18.9,-21.9],[-14.2,-21.9],[-23.7,-13.0]]],[0.0,280.0,[[-18.9,-3.5],[-3.4,-18.3],[3.2,-18.3],[18.7,-3.5],[18.7,3.0],[2.6,18.4],[-3.4,18.4],[-18.9,2.4]]],[0.0,181.0,[[13.3,-23.1],[22.9,-13.6],[22.9,-8.8],[9.1,-23.1]]],[0.0,181.0,[[-9.4,-22.5],[-23.1,-8.3],[-23.7,-13.0],[-14.2,-21.9]]],[0.0,280.0,[[-15.9,-2.9],[-2.8,-15.4],[2.6,-15.4],[15.7,-2.9],[15.7,2.4],[2.6,15.5],[-2.8,15.5],[-15.9,2.4]]],[0.0,83.0,[[-22.5,17.8],[-22.5,13.1],[-13.0,23.2],[-17.7,23.2]]],[0.0,263.0,[[9.1,-23.1],[22.9,-8.8],[22.9,-4.1],[3.8,-22.5]]],[0.0,263.0,[[-4.0,22.6],[-8.8,22.6],[-23.1,8.3],[-23.1,3.6]]],[0.0,181.0,[[23.5,11.9],[12.7,22.0],[7.9,22.6],[23.5,7.2]]],[0.0,181.0,[[-8.8,22.6],[-13.0,23.2],[-22.5,13.1],[-23.1,8.3]]],[0.0,83.0,[[17.5,-23.1],[22.3,-17.7],[22.9,-13.6],[13.3,-23.1]]],[0.0,263.0,[[-4.0,-22.5],[-23.1,-4.1],[-23.1,-8.3],[-9.4,-22.5]]],[0.0,280.0,[[-13.6,-2.9],[-2.2,-13.0],[2.0,-13.0],[12.7,-2.3],[12.7,1.8],[2.0,12.5],[-2.2,12.5],[-13.0,1.8]]],[0.0,275.0,[[-23.1,-4.1],[-4.0,-22.5],[3.8,-22.5],[22.9,-4.1],[23.5,3.6],[3.8,22.6],[-4.0,22.6],[-23.1,3.6]]]],"_place":[1.282992,103.85092]}};
// every material double-sided so that extrusions and triangle batches of one colour share one material
const dsS = c => typeof c === 'string' ? {c, ds:true} : Object.assign({ds:true}, c);
const LPolyD = (g, P, y0, h, col) => LPoly(g, P, y0, h, dsS(col)), LBoxD = (g, w, h, d, x, y, z, col, ry) => LBox(g, w, h, d, x, y, z, dsS(col), ry);
const LShapeD = (g, pts, depth, x, y, z, col, ry) => LShape(g, pts, depth, x, y, z, dsS(col), ry), LBeamD = (g, a, b, r, col, seg) => LBeam(g, a, b, r, dsS(col), seg);
const LCylD = (g, rt, rb, h, x, y, z, col, seg, ry) => LCyl(g, rt, rb, h, x, y, z, dsS(col), seg, ry), LSphD = (g, r, x, y, z, col, sy, seg) => LSph(g, r, x, y, z, dsS(col), sy, seg);
const lerp = (a, b, t) => a + (b - a)*t, cl01 = t => t < 0 ? 0 : t > 1 ? 1 : t, sm = t => { t = cl01(t); return t*t*(3 - 2*t); };
// ---- triangle batches: many small parts of one colour spec become one LTris call
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const quadP = (o, a, b, c, d) => o.push(...a, ...b, ...c, ...a, ...c, ...d);
const triP = (o, a, b, c) => o.push(...a, ...b, ...c);
function segP(o, a, b, r, n){
  n = n || 4; const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2], L = Math.hypot(dx, dy, dz); if (L < 1e-4) return;
  const d = [dx/L, dy/L, dz/L], up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let ux = d[1]*up[2]-d[2]*up[1], uy = d[2]*up[0]-d[0]*up[2], uz = d[0]*up[1]-d[1]*up[0]; const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
  const vx = d[1]*uz-d[2]*uy, vy = d[2]*ux-d[0]*uz, vz = d[0]*uy-d[1]*ux;
  const ring = p => { const R = []; for (let i = 0; i < n; i++){ const t = (i + 0.5)/n*TAU, c = Math.cos(t)*r, s = Math.sin(t)*r; R.push([p[0]+ux*c+vx*s, p[1]+uy*c+vy*s, p[2]+uz*c+vz*s]); } return R; };
  const A = ring(a), B = ring(b);
  for (let i = 0; i < n; i++){ const j = (i+1) % n; quadP(o, A[i], A[j], B[j], B[i]); }
}
const polyP = (o, pts, r, n, closed) => { for (let i = 0; i < pts.length - 1; i++) segP(o, pts[i], pts[i+1], r, n); if (closed) segP(o, pts[pts.length-1], pts[0], r, n); };
function boxP(o, w, h, d, x, y, z, ry){
  const R = rotP(x, z, ry || 0), hw = w/2, hd = d/2;
  const P = [R(-hw, y, -hd), R(hw, y, -hd), R(hw, y, hd), R(-hw, y, hd), R(-hw, y+h, -hd), R(hw, y+h, -hd), R(hw, y+h, hd), R(-hw, y+h, hd)];
  for (const [a, b, c, e] of [[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]) quadP(o, P[a], P[b], P[c], P[e]);
}
const capP = (o, L) => { const c = [0, 0, 0]; for (const p of L){ c[0] += p[0]/L.length; c[1] += p[1]/L.length; c[2] += p[2]/L.length; } for (let i = 0; i < L.length; i++) o.push(...c, ...L[i], ...L[(i+1) % L.length]); };
// ---- plan polygons ([x, z] points)
const area2 = P => { let s = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; s += a[0]*b[1] - b[0]*a[1]; } return s/2; };
const cenP = P => { let x = 0, z = 0; for (const p of P){ x += p[0]; z += p[1]; } return [x/P.length, z/P.length]; };
const rectP = (w, d, cx, cz, ry) => { const R = rotP(cx || 0, cz || 0, ry || 0); return [[-w/2, -d/2], [w/2, -d/2], [w/2, d/2], [-w/2, d/2]].map(p => { const q = R(p[0], 0, p[1]); return [q[0], q[2]]; }); };
const ngon = (n, r, cx, cz, a0) => { const P = []; for (let i = 0; i < n; i++){ const a = (a0 || 0) + i/n*TAU; P.push([(cx || 0) + Math.cos(a)*r, (cz || 0) + Math.sin(a)*r]); } return P; };
const scaleP = (P, s, c) => { c = c || cenP(P); return P.map(p => [c[0] + (p[0]-c[0])*s, c[1] + (p[1]-c[1])*s]); };
const shiftP = (P, dx, dz) => P.map(p => [p[0] + dx, p[1] + dz]);
// inward offset by d (negative grows), mitred and clamped
function offP(P, d){
  const n = P.length, s = area2(P) > 0 ? 1 : -1, L = [];
  for (let i = 0; i < n; i++){ const a = P[i], b = P[(i+1) % n], ex = b[0]-a[0], ez = b[1]-a[1], l = Math.hypot(ex, ez) || 1; L.push([a[0] - ez/l*s*d, a[1] + ex/l*s*d, ex, ez]); }
  const out = [];
  for (let i = 0; i < n; i++){ const p = L[(i + n - 1) % n], q = L[i], den = p[2]*q[3] - p[3]*q[2];
    if (Math.abs(den) < 1e-6){ out.push([q[0], q[1]]); continue; }
    const t = ((q[0]-p[0])*q[3] - (q[1]-p[1])*q[2])/den; let x = p[0] + p[2]*t, z = p[1] + p[3]*t;
    const ox = P[i][0], oz = P[i][1], dd = Math.hypot(x - ox, z - oz), mx = Math.abs(d)*2.5;
    if (dd > mx){ x = ox + (x - ox)/dd*mx; z = oz + (z - oz)/dd*mx; }
    out.push([x, z]); }
  return out;
}
// outward unit normal of edge i
const outN = (P, i) => { const s = area2(P) > 0 ? 1 : -1, a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], l = Math.hypot(ex, ez) || 1; return [ez/l*s, -ex/l*s]; };
const inPoly = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0]-a[0])*(z-a[1])/(b[1]-a[1]) + a[0]) c = !c; } return c; };
const dSeg = (x, z, a, b) => { const ex = b[0]-a[0], ez = b[1]-a[1], L2 = ex*ex + ez*ez || 1, t = cl01(((x-a[0])*ex + (z-a[1])*ez)/L2); return Math.hypot(x - a[0] - ex*t, z - a[1] - ez*t); };
const dPoly = (P, x, z) => { let d = 1e9; for (let i = 0; i < P.length; i++) d = Math.min(d, dSeg(x, z, P[i], P[(i+1) % P.length])); return d; };
const triang = P => THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
// walls of a plan polygon from y0 up to ytop (a number or f(x, z)) and its top, into a batch
function prismP(o, P, y0, ytop, noTop){
  const f = typeof ytop === 'function' ? ytop : () => ytop;
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; quadP(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], f(b[0], b[1]), b[1]], [a[0], f(a[0], a[1]), a[1]]); }
  if (!noTop) for (const t of triang(P)) for (const k of t){ const p = P[k]; o.push(p[0], f(p[0], p[1]), p[1]); }
}
const flatP = (o, P, y) => { for (const t of triang(P)) for (const k of t){ const p = P[k]; o.push(p[0], y, p[1]); } };
// a sloping roof plane over P rising from y0 to y1 along the plan direction (dx, dz)
const slopeF = (P, y0, y1, dx, dz) => { let a = 1e9, b = -1e9; for (const p of P){ const s = p[0]*dx + p[1]*dz; a = Math.min(a, s); b = Math.max(b, s); } return (x, z) => y0 + (y1 - y0)*((x*dx + z*dz) - a)/Math.max(0.01, b - a); };
// floor bands round a plan polygon every `step` m between y0 and y1 (vertical quads just proud of the wall)
function bandsP(o, P, y0, y1, step, bh, off, edges){
  off = off || 0.12;
  for (let i = 0; i < P.length; i++){ if (edges && !edges(i)) continue;
    const a = P[i], b = P[(i+1) % P.length]; if (Math.hypot(b[0]-a[0], b[1]-a[1]) < 0.3) continue; const [nx, nz] = outN(P, i);
    for (let y = y0 + step; y < y1 - 0.3; y += step) quadP(o, [a[0]+nx*off, y, a[1]+nz*off], [b[0]+nx*off, y, b[1]+nz*off], [b[0]+nx*off, y+bh, b[1]+nz*off], [a[0]+nx*off, y+bh, a[1]+nz*off]);
  }
}
// vertical strips (mullions / piers) standing `off` proud of the walls, about `sp` apart, `w` wide
function mullP(o, P, y0, y1, sp, w, off, edges){
  for (let i = 0; i < P.length; i++){ if (edges && !edges(i)) continue;
    const a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], L = Math.hypot(ex, ez); if (L < sp*0.6) continue;
    const [nx, nz] = outN(P, i), n = Math.max(1, Math.round(L/sp)), ux = ex/L, uz = ez/L, yy0 = typeof y0 === 'function' ? y0 : () => y0, yy1 = typeof y1 === 'function' ? y1 : () => y1;
    for (let k = 0; k <= n; k++){ const t = k/n, x = a[0] + ex*t + nx*off, z = a[1] + ez*t + nz*off, p = [x - ux*w/2, z - uz*w/2], q = [x + ux*w/2, z + uz*w/2];
      quadP(o, [p[0], yy0(x, z), p[1]], [q[0], yy0(x, z), q[1]], [q[0], yy1(x, z), q[1]], [p[0], yy1(x, z), p[1]]); }
  }
}
// deep fins (boxes) along the edges
function finsP(o, P, y0, y1, sp, w, d, edges){
  for (let i = 0; i < P.length; i++){ if (edges && !edges(i)) continue;
    const a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], L = Math.hypot(ex, ez); if (L < 2) continue;
    const [nx, nz] = outN(P, i), n = Math.max(1, Math.round(L/sp)), ry = Math.atan2(-ez, ex);
    for (let k = 0; k <= n; k++){ const t = k/n; boxP(o, w, y1 - y0, d, a[0] + ex*t + nx*d/2, y0, a[1] + ez*t + nz*d/2, ry); }
  }
}
// a lit line along the top edge of a polygon (crowns at night)
function edgeLineP(o, P, f, r){ for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; segP(o, [a[0], f(a[0], a[1]) + r, a[1]], [b[0], f(b[0], b[1]) + r, b[1]], r, 4); } }
// polygon with a hole (terrace rings), extruded
function ringPoly(g, outer, inner, y0, h, col){
  const sh = new THREE.Shape(outer.map(p => new THREE.Vector2(p[0], -p[1])));
  sh.holes.push(new THREE.Path(inner.map(p => new THREE.Vector2(p[0], -p[1]))));
  const m = lmAdd(g, new THREE.ExtrudeGeometry(sh, {depth:h, bevelEnabled:false}), dsS(col), 0, y0, 0); m.rotation.x = -HP; return m;
}
// trees into batches
function treeP(B, x, y, z, s, crown, trunk){
  segP(B.p(trunk || '#5d4a3a'), [x, y, z], [x, y + 3*s, z], 0.28*s, 4);
  const c = B.p(crown || '#4f7f3a'), R = 2.4*s, cy = y + 4.2*s, top = [x, cy + R*0.75, z], bot = [x, cy - R*0.55, z], ring = [];
  for (let i = 0; i < 6; i++){ const a = i/6*TAU; ring.push([x + Math.cos(a)*R, cy, z + Math.sin(a)*R]); }
  for (let i = 0; i < 6; i++){ const j = (i+1) % 6; triP(c, top, ring[j], ring[i]); triP(c, bot, ring[i], ring[j]); }
}
function palmP(B, x, y, z, s, r){
  const top = [x + (r() - 0.5)*1.2*s, y + 7*s, z + (r() - 0.5)*1.2*s];
  segP(B.p('#5d4a3a'), [x, y, z], top, 0.22*s, 4);
  const f = B.p('#4f7f3a');
  for (let i = 0; i < 7; i++){ const a = i/7*TAU + r(), c = Math.cos(a), sn = Math.sin(a), L = 3.2*s;
    triP(f, top, [top[0] + c*L - sn*0.5*s, top[1] - 1.2*s, top[2] + sn*L + c*0.5*s], [top[0] + c*L + sn*0.5*s, top[1] - 1.2*s, top[2] + sn*L - c*0.5*s]); }
}
// scatter trees inside a polygon (avoid: f(x, z) -> true to skip)
function treesIn(B, P, n, y, s, r, avoid, crown){
  let k = 0, xs = P.map(p => p[0]), zs = P.map(p => p[1]); const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
  for (let t = 0; t < n*12 && k < n; t++){ const x = lerp(x0, x1, r()), z = lerp(z0, z1, r()); if (!inPoly(P, x, z) || dPoly(P, x, z) < 2 || (avoid && avoid(x, z))) continue;
    treeP(B, x, typeof y === 'function' ? y(x, z) : y, z, s*(0.8 + 0.5*r()), crown); k++; }
}
// a glass curtain-wall tower body: extruded plan, spandrel bands, mullions
function glassBody(g, B, P, y0, y1, spec, o){
  LPolyD(g, P, y0, y1 - y0, spec);
  if (o.band) bandsP(B.p(o.band), P, y0, y1, o.fh || 4.2, o.bh || 0.55, 0.1);
  if (o.mull) mullP(B.p(o.mull), P, y0, y1, o.sp || 3, o.mw || 0.3, 0.14);
}
// ---- extra helpers (lm22)
// top surface of a polygon under a height function
function triPoly(o, P, f){ for (const t of triang(P)) for (const k of t){ const p = P[k]; o.push(p[0], f(p[0], p[1]), p[1]); } }
// a local plan frame: T(u, v) -> [x, z] with +u at plan angle a (x east, z south), +v = +u turned 90 deg towards +z
const frm = (cx, cz, a) => { const c = Math.cos(a), s = Math.sin(a); const f = (u, v) => [cx + u*c - v*s, cz + u*s + v*c]; f.a = a; f.c = [cx, cz]; return f; };
const mapP = (T, L) => L.map(p => T(p[0], p[1]));
// quarter turns of a local polygon (k = 0..3): N side -> E -> S -> W
const rotL = (L, k) => L.map(([u, v]) => k === 0 ? [u, v] : k === 1 ? [-v, u] : k === 2 ? [-u, -v] : [v, -u]);
// regular-ish polygon round a centre in a frame
const ngonT = (T, n, r, a0) => { const P = []; for (let i = 0; i < n; i++){ const a = (a0 || 0) + i/n*TAU; P.push(T(Math.cos(a)*r, Math.sin(a)*r)); } return P; };
// a facade of ribbon windows: dark glass body (lit windows at night) with stone spandrel bands and thin stone mullions
function ribbon(B, P, y0, y1, o){
  prismP(B.p(o.glass), P, o.yb === undefined ? y0 : o.yb, y1, o.noTop);
  const fh = o.fh || 4.2, s0 = o.base === undefined ? y0 + (o.ph || 0) : Math.ceil((y0 + o.base)/fh)*fh - o.base;
  bandsP(B.p(o.span), P, s0 - fh, y1, fh, o.bh || 1.9, o.off || 0.08, o.edges);
  if (o.mull) mullP(B.p(o.mull), P, y0, y1, o.sp || 1.6, o.mw || 0.18, (o.off || 0.08) + 0.04, o.edges);
}
// edges of a polygon that do not lie on (near) another polygon's boundary (hide faces buried in a neighbouring volume)
const freeE = (P, Qs) => i => { const a = P[i], b = P[(i+1) % P.length], [nx, nz] = outN(P, i), x = (a[0]+b[0])/2 + nx*0.8, z = (a[1]+b[1])/2 + nz*0.8; return !Qs.some(Q => inPoly(Q, x, z)); };
// aviation light
const redL = (g, x, y, z) => LSphD(g, 0.5, x, y, z, {c:'#c22', glow:'#ff2a1a', gk:2}, 1, 6);


// ===== UOB Plaza (Kenzo Tange, 1992-95). Plaza One (280 m, 66 storeys) at the river: a 32 m square shaft with a projecting
// six-sided bay on each face; above the bays (190 m) the faces sprout triangular points, the shaft steps in at 226 m and the
// points grow, so the top reads as a square turned against a square (the "rotated cubic volumes" diminishing towards the top);
// a plant drum and the flat roof disc close it at 270-280 m. Plaza Two (the 1974 UOB Building, 162 m, 38 storeys, re-clad
// in 1995 to match): an octagonal shaft whose crown steps up as a turned square with triangular steps (OSM parts). The
// six-storey banking-hall block between them stands on four columns over the open "city room" atrium (Raffles Place to the
// river) with the full-height glazed banking hall. Cladding: warm white-grey granite spandrels in horizontal bands with grey
// glass ribbon windows. Crown signs (lm20/crown) sit on the N and E bay faces at 182 m: those faces stay flat.
LANDMARKS.uob = {zh:'大华银行广场', en:'UOB Plaza', cat:'new', r:84, h:280, lt:{m:1, c:'#ffe6c4', k:0.75}, build(){
  const g = new THREE.Group(), B = mkB(), F = FD.uob;
  const GL = {c:'#3f474c', m:1, fh:4.24, cw:2.4}, GR = {c:'#bdb1a3', m:0, lk:0.14}, GRd = {c:'#968676', m:0, lk:0.2};
  const CR = {c:'#c9bcad', glow:'#ffe0b0', gk:0.32}, ROOF = '#8b857c', LOB = {c:'#46535a', glow:'#ffdcae', gk:0.6};
  const SKY = {c:'#a5b8c2', glow:'#ffe2b8', gk:0.35}, DISC = {c:'#d6cabb', glow:'#fff0d8', gk:1.0};
  const FH = 4.24, rib = (P, y0, y1, edges, noTop) => ribbon(B, P, y0, y1, {glass:GL, span:GR, mull:GR, fh:FH, bh:1.95, sp:1.55, mw:0.16, edges, noTop, base:2.0});
  // ---------------- Plaza One ----------------
  const T = frm(-50.25, -2.0, Math.atan2(3.0, 32.3)), S = 16.2, S2 = 14.0;
  const SQ = mapP(T, [[-S, -S], [S, -S], [S, S], [-S, S]]), SQ2 = mapP(T, [[-S2, -S2], [S2, -S2], [S2, S2], [-S2, S2]]);
  const BAYL = [[-8.7, -S + 0.05], [-10.8, -18.9], [-8.7, -21.5], [8.7, -21.5], [10.8, -18.9], [8.7, -S + 0.05]];
  const BAYS = [0, 1, 2, 3].map(k => mapP(T, rotL(BAYL, k)));
  const bayE = i => i !== 5;
  // base: dark granite plinth with the glazed lobby between granite piers (0-12 m)
  prismP(B.p(GRd), offP(SQ, -0.6), -5, 0.4);
  prismP(B.p(LOB), offP(SQ, 0.8), 0, 12.6, true);
  for (const P of BAYS) prismP(B.p(GRd), P, -5, 12.6, true);
  mullP(B.p(GRd), SQ, 0, 12.6, 5.4, 1.3, 0.05, i => true);
  for (const P of [SQ, ...BAYS]) bandsP(B.p(GRd), P, 11.0 - 1, 12.6, 1, 1.6, 0.2);
  // the shaft: square to 226 m, the bays to 190 m
  rib(SQ, 12.6, 226, null, true);
  for (const P of BAYS){ rib(P, 12.6, 190, bayE); flatP(B.p(ROOF), P, 190.02); }
  // 190-226: triangular points rise from the bay tops
  const PT1 = [[-6.5, -S + 0.05], [0, -21.5], [6.5, -S + 0.05]], PT2 = [[-7.0, -S2 + 0.05], [-0.4, -22.8], [7.0, -S2 + 0.05]];
  for (let k = 0; k < 4; k++){ const P = mapP(T, rotL(PT1, k)); rib(P, 190, 226, i => i !== 2); }
  // the step at 226 m: a ledge with a lit parapet, the inset square and the big points to 255 / 260 m (floodlit crown)
  flatP(B.p(ROOF), SQ, 226.02); bandsP(B.p(CR), SQ, 225, 227.4, 1, 1.4, 0.15);
  for (let k = 0; k < 4; k++){ const P = mapP(T, rotL(PT2, k)); prismP(B.p(GL), P, 226, 255); bandsP(B.p(CR), P, 226 - 3.6, 255, 3.6, 1.6, 0.08, i => i !== 2); mullP(B.p(CR), P, 226, 255, 1.55, 0.16, 0.12, i => i !== 2); flatP(B.p(CR), P, 255.02); }
  prismP(B.p(GL), SQ2, 226, 260, true); bandsP(B.p(CR), SQ2, 226 - 3.6, 260, 3.6, 1.6, 0.08); mullP(B.p(CR), SQ2, 226, 260, 1.55, 0.16, 0.12);
  flatP(B.p(ROOF), SQ2, 260.02); bandsP(B.p(CR), SQ2, 258.6, 261.2, 1, 1.4, 0.12);
  // the crown: plant drum, four fins and the roof disc with its overhanging lit rim
  const cx = T.c[0], cz = T.c[1];
  LCylD(g, 9.2, 10.4, 10, cx, 260, cz, CR, 16);
  for (let k = 0; k < 4; k++){ prismP(B.p(CR), mapP(T, rotL([[-0.5, -10.0], [0, -S2 + 0.4], [0.5, -10.0]], k)), 260, 274); }
  LCylD(g, 11.2, 10.6, 8.4, cx, 270, cz, GRd, 24);
  LCylD(g, 12.0, 11.6, 1.6, cx, 278.4, cz, DISC, 32);
  LCylD(g, 7.5, 9.0, 1.2, cx, 280, cz, ROOF, 16);
  LCylD(g, 0.35, 0.35, 8, cx, 281, cz, '#9a9a9a', 5); redL(g, cx, 289.4, cz);
  // ---------------- Plaza Two (from the OSM parts) ----------------
  const P2 = F.P2parts, shaft = P2.find(p => p[0] === 0)[2], core = P2.find(p => p[0] === 128 && p[1] === 162)[2];
  prismP(B.p(GRd), offP(shaft, -0.5), -5, 0.4);
  prismP(B.p(LOB), offP(shaft, 0.8), 0, 12.6, true); mullP(B.p(GRd), shaft, 0, 12.6, 4.6, 1.1, 0.05);
  bandsP(B.p(GRd), shaft, 10, 12.6, 1, 1.6, 0.2);
  rib(shaft, 12.6, 128);
  flatP(B.p(ROOF), shaft, 128.02); bandsP(B.p(CR), shaft, 126.8, 129.4, 1, 1.4, 0.15);
  prismP(B.p(GL), core, 128, 162, true); bandsP(B.p(CR), core, 128 - 3.6, 162, 3.6, 1.6, 0.08); mullP(B.p(CR), core, 128, 162, 1.55, 0.16, 0.12);
  flatP(B.p(ROOF), core, 162.02); bandsP(B.p(CR), core, 160.6, 163.2, 1, 1.4, 0.12);
  for (const [y0, y1, P] of P2){ if (P === shaft || P === core) continue;
    prismP(B.p(CR), P, y0, y1); bandsP(B.p(GL), P, y0 - 3.6 + 1.6, y1 - 0.4, 3.6, 1.6, 0.05, freeE(P, [core])); }
  { const c = cenP(core); LCylD(g, 0.3, 0.3, 6, c[0], 162, c[1], '#9a9a9a', 5); redL(g, c[0], 168.4, c[1]); }
  // ---------------- the banking-hall block on four columns over the city room ----------------
  const H = F.HALL;
  prismP(B.p('#c9c1b4'), H, -5, 0.3);                                         // the atrium floor
  const hallIn = offP(rectP(44, 34, 7, 8, 0.083), 0);                          // the glazed banking hall under the block
  prismP(B.p(LOB), hallIn, 0.3, 13.5, true); mullP(B.p(GRd), hallIn, 0.3, 13.5, 3.0, 0.25, 0.1);
  for (const [x, z] of [[-17, -11], [32, -6.5], [28, 26], [-22, 22]]) LCylD(g, 1.25, 1.25, 16.5, x, 0.3, z, GRd, 14);
  const Hb = H; prismP(B.p(GRd), Hb, 14.6, 16.4, true); flatP(B.p(GRd), Hb, 14.6);
  rib(Hb, 16.4, 33, freeE(Hb, [SQ, ...BAYS, shaft]));
  flatP(B.p(ROOF), offP(Hb, 0.4), 33.02); bandsP(B.p(GR), Hb, 32.4, 34.2, 1, 1.8, 0.14, freeE(Hb, [SQ, ...BAYS, shaft]));
  // the skylight over the city room and the roof garden
  { const c = [8, 8], P = rectP(30, 18, c[0], c[1], 0.083); prismP(B.p(SKY), P, 33, 34.2); const Rg = rectP(30, 18, c[0], c[1], 0.083);
    const a = Rg[0], b = Rg[1], cc = Rg[2], d = Rg[3], m1 = [(a[0]+d[0])/2, (a[1]+d[1])/2], m2 = [(b[0]+cc[0])/2, (b[1]+cc[1])/2];
    quadP(B.p(SKY), [a[0], 34.2, a[1]], [b[0], 34.2, b[1]], [m2[0], 38, m2[1]], [m1[0], 38, m1[1]]); quadP(B.p(SKY), [d[0], 34.2, d[1]], [cc[0], 34.2, cc[1]], [m2[0], 38, m2[1]], [m1[0], 38, m1[1]]); }
  // the south podium of Plaza Two
  const P2b = F.POD2; prismP(B.p(GRd), P2b, -5, 0.4); prismP(B.p(LOB), offP(P2b, 0.6), 0.4, 5, true);
  rib(P2b, 5, 16, freeE(P2b, [shaft, H])); flatP(B.p('#7d9a67'), offP(P2b, 0.5), 16.05);
  B.flush(g);
  return g; }};


// ===== One Raffles Place. Tower 1 (the former OUB Centre, Kenzo Tange 1986, 280 m, 63 storeys): two right-triangular prisms
// of 280 m and 215 m standing back to back along the diagonal with a narrow slot between them, clad in a silver aluminium
// grid with small square dark windows; the eight-storey cut-away entrance at its foot. Tower 2 (Tange Associates 2012,
// 38 storeys): a glass tower split on its diagonal into two triangles whose roofs slope up to the split (179 / 209 m).
// The six-storey retail podium (re-clad 2014 in glass with white floor bands; the LED screen on its east face is drawn by
// lm20/crown at tw [20, 25], y 11, az 95: that face stays flat) and its lower wing to Malacca Street; the Sinsov Building,
// Bank of Singapore Centre, RB Capita Building and Malacca Centre inside the ground hull are plain office blocks.
LANDMARKS.oneraffles = {zh:'莱佛士坊一号', en:'One Raffles Place', cat:'new', r:95, h:280, lt:{m:1, c:'#e8eef6', k:0.7}, build(){
  const g = new THREE.Group(), B = mkB(), F = FD.oneraffles;
  const WIN = {c:'#353d45', m:1, fh:4.4, cw:2.2}, AL = {c:'#c4c7c8', m:0, lk:0.16}, ALd = {c:'#9da2a5', m:0, lk:0.2};
  const GL2 = {c:'#5a7186', m:1, fh:4.2, cw:3.0}, MUL2 = '#b9c2cb', ROOF2 = {c:'#7f93a8', glow:'#d4e0ff', gk:0.25};
  const LINE = {c:'#e6eef1', glow:'#d4e8ff', gk:1.1}, GLZ = {c:'#3e4c55', glow:'#ffe2b8', gk:0.55}, WHT = {c:'#e9e9e4', m:0, lk:0.35};
  const ROOF = '#8a8a86', GRN = {c:'#5f5a56', m:0, lk:0.3};
  // ---------------- Tower 1: the aluminium grid prisms and the slot ----------------
  const T1a = offP(F.T1a, 1.4), T1b = offP(F.T1b, 1.4);
  const grid = (P, y0, y1, edges) => { prismP(B.p(WIN), P, y0, y1, true); bandsP(B.p(AL), P, Math.ceil((y0 + 4.6)/4.4)*4.4 - 4.6 - 4.4, y1 - 0.3, 4.4, 2.15, 0.12, edges); mullP(B.p(AL), P, y0, y1 - 0.3, 2.2, 0.62, 0.12, edges); };
  // the eight-storey cut-away entrance: a tall recessed portal (glazed lobby behind) in the face of the 215 m prism to Raffles Place
  const notch = (() => { const a = T1b[0], b = T1b[1], ex = b[0]-a[0], ez = b[1]-a[1], [nx, nz] = outN(T1b, 0), d = 3.4;
    const p0 = [a[0] + ex*0.24, a[1] + ez*0.24], p1 = [a[0] + ex*0.76, a[1] + ez*0.76];
    return [a, p0, [p0[0] - nx*d, p0[1] - nz*d], [p1[0] - nx*d, p1[1] - nz*d], p1, b, T1b[2]]; })();
  for (const [P, H, LO] of [[T1a, 280, T1a], [T1b, 215, notch]]){
    prismP(B.p(GRN), offP(LO, -0.4), -5, 9.4);                                 // dark granite base
    if (LO !== P){ grid(LO, 9.4, 35.2, i => i !== 2); grid(P, 35.2, H - 2.2); quadP(B.p(AL), ...[LO[1], LO[4], LO[3], LO[2]].map(p => [p[0], 35.2, p[1]]));
      const q0 = LO[2], q1 = LO[3], [nx, nz] = outN(LO, 2), o = 0.06; quadP(B.p(GLZ), [q0[0] + nx*o, 0.2, q0[1] + nz*o], [q1[0] + nx*o, 0.2, q1[1] + nz*o], [q1[0] + nx*o, 35, q1[1] + nz*o], [q0[0] + nx*o, 35, q0[1] + nz*o]);
      for (let k = 1; k < 8; k++){ const x = lerp(q0[0], q1[0], k/8) + nx*0.3, z = lerp(q0[1], q1[1], k/8) + nz*0.3; segP(B.p(ALd), [x, 0, z], [x, 35, z], 0.16, 4); }
      for (let y = 4.4; y < 35; y += 4.4) segP(B.p(ALd), [q0[0] + nx*0.3, y, q0[1] + nz*0.3], [q1[0] + nx*0.3, y, q1[1] + nz*0.3], 0.12, 4); }
    else grid(P, 9.4, H - 2.2);
    prismP(B.p(AL), P, H - 2.2, H + 1.0, true); flatP(B.p(ROOF), offP(P, 0.6), H + 0.4);     // aluminium parapet
    bandsP(B.p(ALd), P, H - 2.2 - 4.4, H - 1.0, 4.4, 1.0, 0.16);
  }
  // the slot along the diagonal: recessed dark glass (stops 2 m short of each end) up to the lower prism, open above
  { const a = F.T1b[2], b = F.T1b[0], L = Math.hypot(b[0]-a[0], b[1]-a[1]) - 4, c = [(a[0]+b[0])/2, (a[1]+b[1])/2], ry = Math.atan2(-(b[1]-a[1]), b[0]-a[0]);
    prismP(B.p(WIN), rectP(L, 2.4, c[0], c[1], ry), 9.4, 214.5); }
  { const c = cenP(T1a); LCylD(g, 0.35, 0.35, 8, c[0], 281, c[1], '#a0a0a0', 5); redL(g, c[0], 289.4, c[1]); }
  // ---------------- Tower 2: two glass triangles, roofs sloping up to the split ----------------
  const tri = (P, apex, y0, y1) => { const d0 = P[(apex + 1) % 3], d1 = P[(apex + 2) % 3], m = [(d0[0]+d1[0])/2, (d0[1]+d1[1])/2], v = [m[0] - P[apex][0], m[1] - P[apex][1]], l = Math.hypot(...v);
    const f = slopeF(P, y0, y1, v[0]/l, v[1]/l);
    prismP(B.p(GL2), P, 26, f, true); triPoly(B.p(ROOF2), P, f);
    bandsP(B.p(MUL2), P, 26 - 4.2, y0, 4.2, 0.6, 0.12);
    mullP(B.p(MUL2), P, 26, (x, z) => f(x, z) + 1.2, 1.5, 0.22, 0.2);
    edgeLineP(B.p(LINE), P, f, 0.3); };
  tri(F.T2a, 1, 179, 209);
  tri(F.T2b, 2, 149, 179);
  // ---------------- the retail podium: glass with white floor bands, the 17 m wing and the 26 m block ----------------
  const pod = [[F.PODs, 17.1], [F.PODn, 26]];
  prismP(B.p(ROOF), F.POD, -5, 0.3);
  for (const [P, y1] of pod){
    prismP(B.p(GLZ), offP(P, 0.6), 0.3, 6, true);                                // shopfronts behind the canopy line
    prismP(B.p(GL2), P, 6, y1);
    bandsP(B.p(WHT), P, 6 - 4.3, y1 - 0.5, 4.3, 1.0, 0.18);
    mullP(B.p(WHT), P, 6, y1, 6.0, 0.35, 0.22);
    bandsP(B.p(WHT), P, 5.0, 6.4, 1, 1.4, 0.9);                                    // the canopy edge
    bandsP(B.p(WHT), P, y1 - 1.6, y1 + 0.6, 1, 2.2, 0.2);                          // parapet
    flatP(B.p(ROOF), offP(P, 0.3), y1 + 0.02);
  }
  // ---------------- neighbours inside the hull: plain office blocks ----------------
  for (const [P, H] of [[F.SIN, 56], [F.BOS, 76], [F.RBC, 65], [F.MAC, 65]]){
    prismP(B.p({c:'#a8a59e', m:1, fh:3.8, cw:3.0}), P, -3, H);
    bandsP(B.p(ALd), P, 2.2 - 3.8 + 2.0, H - 1.5, 3.8, 1.4, 0.06);
    prismP(B.p(ROOF), offP(P, 2), H, H + 3);
  }
  B.flush(g);
  return g; }};


// ===== Republic Plaza (Kisho Kurokawa, 1995, 280 m, 66 storeys; "inspired by a quartz crystal"). A square plan whose four
// corners are cut back in three diagonal strips that stop at 83, 181 and 263 m, each closed by a sloping roof (stone at the
// first step, glass above), so the shaft tapers from the street square to the octagon turned 45 degrees at the top, crowned by
// the stepped "ziggurat" that shines as a beacon at night. Pink polished granite piers with vertical strips of tinted glass,
// a lit glass lobby at the foot. Plan and step heights from the OSM parts.
LANDMARKS.republic = {zh:'共和大厦', en:'Republic Plaza', cat:'new', r:42, h:280, lt:{m:1, c:'#dceaff', k:0.75}, build(){
  const g = new THREE.Group(), B = mkB(), F = FD.republic;
  const GLS = {c:'#3c5568', m:1, fh:4.2, cw:1.4}, PG = {c:'#b8a09a', m:0, lk:0.12}, PGd = {c:'#9b847d', m:0, lk:0.2};
  const ROOFS = {c:'#a18c84', m:0, lk:0.3}, ROOFG = {c:'#557088', glow:'#d6e6ff', gk:0.55}, ZIG = {c:'#e3e8ee', glow:'#eef5ff', gk:1.15};
  const LOB = {c:'#4a5860', glow:'#ffe2b8', gk:0.6}, ROOF = '#8b8680';
  let big = F.parts[0]; for (const p of F.parts) if (Math.abs(area2(p[2])) > Math.abs(area2(big[2]))) big = p;
  const OCT = F.parts.filter(p => p[1] >= 270).sort((a, b) => Math.abs(area2(b[2])) - Math.abs(area2(a[2])));
  // plaza plinth, the lit lobby recessed behind granite columns (0-12 m)
  prismP(B.p('#c3bcb0'), offP(big[2], -6), -5, 0.3);
  const fac = (P, y0, y1, edges) => {           // pink granite piers with vertical strips of tinted glass, thin floor lines
    prismP(B.p(GLS), P, y0, y1, true);
    mullP(B.p(PG), P, y0, y1, 2.8, 1.45, 0.1, edges);
    bandsP(B.p(PG), P, y0 - 4.2 + 1.0, y1 - 0.2, 4.2, 0.32, 0.08, edges);
  };
  // the octagon core (to 275 m) with its lobby
  const core = OCT[0][2];
  prismP(B.p(LOB), offP(core, 1.0), 0.3, 12, true);
  // corner strips: walls up to (top - rh) at the outer corner, the roof sloping up to `top` at the face of the shaft
  for (const [y0, top, P] of F.parts){
    if (top >= 270) continue;
    const rh = top < 100 ? 7 : 4.5, c = cenP(P), l = Math.hypot(c[0], c[1]) || 1, f = slopeF(P, top, top - rh, c[0]/l, c[1]/l);
    const out = i => { const a = P[i], b = P[(i+1) % P.length], m = [(a[0]+b[0])/2, (a[1]+b[1])/2], [nx, nz] = outN(P, i); return !inPoly(core, m[0] + nx*0.6, m[1] + nz*0.6) && Math.hypot(m[0] + nx*0.6, m[1] + nz*0.6) > Math.hypot(m[0], m[1]); };
    prismP(B.p(PGd), offP(P, -0.3), -5, 12, true);
    prismP(B.p(GLS), P, 12, f, true); triPoly(B.p(top < 100 ? ROOFS : ROOFG), P, f);
    mullP(B.p(PG), P, 12, (x, z) => f(x, z) - 0.6, 2.8, 1.45, 0.1, out);
    bandsP(B.p(PG), P, 12 - 4.2 + 1.0, top - rh - 0.4, 4.2, 0.32, 0.08, out);
    edgeLineP(B.p(top < 100 ? PG : ZIG), P, f, 0.22);
  }
  // the core: granite base with columns, the shaft to 275 m
  mullP(B.p(PGd), core, 0.3, 12, 5.6, 1.6, 0.3);
  bandsP(B.p(PGd), core, 10.4 - 1, 12.6, 1, 2.2, 0.35);
  fac(core, 12, 270.5);
  // the ziggurat crown: the octagons step in to the top, every step edged in light
  const zs = [[270.5, 274], [274, 277.2], [277.2, 280.4]];
  flatP(B.p(ROOF), core, 270.52); edgeLineP(B.p(ZIG), core, () => 270.5, 0.3);
  OCT.slice(1).forEach((p, k) => { const [y0, y1] = zs[Math.min(k, 2)], P = p[2];
    prismP(B.p(k === 2 ? ZIG : PG), P, y0 - 0.02, y1); mullP(B.p(GLS), P, y0, y1 - 0.4, 2.8, 1.2, 0.06); bandsP(B.p(ZIG), P, y1 - 1.0, y1, 1, 0.75, 0.1); edgeLineP(B.p(ZIG), P, () => y1, 0.28); });
  bandsP(B.p(ZIG), core, 269.1, 270.5, 1, 1.0, 0.12);
  { const P = OCT[OCT.length - 1][2], c = cenP(P); LCylD(g, 0.5, 0.7, 6, c[0], 280.4, c[1], '#cfcfcf', 6); redL(g, c[0], 286.9, c[1]); }
  B.flush(g);
  return g; }};


// ===== Marina Bay Financial Centre (KPF with DCA / Architects 61, 2010-13): Tower 1 (33 storeys, crown to 192 m) at the north
// corner on Marina Boulevard, Tower 2 (50 storeys, 245 m) on the west corner, Tower 3 (46 storeys, 239 m, its crown stepping in
// four slanted planes) at the south corner, Marina Bay Residences (55 storeys, 222 m) on the bay side and the slender Marina Bay
// Suites (66 storeys, 227 m) in the middle - all on the landscaped podium over the Marina Bay Link Mall (glazed street floor,
// the ground plaza with its alfresco terraces between Tower 1 and the Residences). Crystalline blue-green glass in a fine grid
// of light mullions and spandrel lines; each crown is a slanted plane of glass carried above the roof as a screen of fins with
// a lit edge. The residences carry continuous white balcony slabs with glass balustrades. Crown signs (lm20/crown) on Tower 1
// (tw [-17, -70], 160 m, az 20 / 110) and Tower 3 (tw [10, 65], 197 m, az 98 / 278): those faces stay flat (shallow mullions).
LANDMARKS.mbfc = {zh:'滨海湾金融中心', en:'Marina Bay Financial Centre', cat:'new', r:126, h:245, lt:{m:1, c:'#cfe6ff', k:0.75}, build(){
  const g = new THREE.Group(), B = mkB(), F = FD.mbfc, r = LMCTX.rng, BASE = 4.6;
  const glO = {c:'#6d8f9d', m:1, fh:4.2, cw:3.0}, glR = {c:'#86a0aa', m:1, fh:3.35, cw:2.6};
  const band = '#bcccd3', mull = '#dbe4e8', crown = {c:'#9fbac6', glow:'#d4e8ff', gk:0.3}, fin = {c:'#e4ecef', glow:'#d4e8ff', gk:0.55};
  const line = {c:'#eef4f6', glow:'#d4e8ff', gk:1.3}, bal = '#f0f1ec', rail = {c:'#b9cdd4', op:0.75};
  const pave = '#dedad1', podS = '#dedad1', podG = {c:'#4c6570', glow:'#ffe0b0', gk:0.55}, lawn = '#7ea067';
  // ---- plaza, the Link Mall street floor (glazed) and the podium with its landscaped roof
  LPolyD(g, F.SITE, -5, 5.15, pave);
  LPolyD(g, offP(F.POD, 0.6), 0, 6.2, podG);
  mullP(B.p(podS), F.POD, 0, 6.2, 3.0, 0.35, 0.08);
  bandsP(B.p(podS), F.POD, 5.6, 7.6, 1, 2.0, 0.9);                          // the canopy round the street floor
  LPolyD(g, F.POD, 6.2, 9.3, glR);
  bandsP(B.p(podS), F.POD, 6.2 - 3.3, 15.5, 3.3, 1.4, 0.1);
  mullP(B.p(podS), F.POD, 6.2, 15.5, 6.0, 0.5, 0.14);
  LPolyD(g, F.POD, 15.5, 0.6, lawn);
  bandsP(B.p(rail), F.POD, 15.5, 17.2, 1, 1.1, 0.05);
  const TW = [F.T1, F.T2, F.T3, F.MBR, F.MBS];
  treesIn(B, F.POD, 110, 16.1, 1.1, r, (x, z) => TW.some(P => inPoly(P, x, z) || dPoly(P, x, z) < 5));
  // ---- office towers
  const fhO = 4.2, s0 = y => Math.ceil((y + BASE)/fhO)*fhO - BASE;
  const shaft = (P, y1, edges) => {
    prismP(B.p(glO), P, -4, y1, true);
    bandsP(B.p(band), P, s0(9.5) - fhO, y1 - 0.4, fhO, 0.95, 0.1, edges);
    mullP(B.p(mull), P, 9.5, y1, 1.5, 0.14, 0.13, edges);
    mullP(B.p(mull), P, 9.5, y1, 9.0, 0.34, 0.22, edges);                         // stronger every sixth mullion
    bandsP(B.p(podG), P, 0, 9.4, 1, 9.0, 0.06, edges);   // lobby glazing (the podium wraps most of it)
  };
  const crownOn = (P, yb, f) => {
    prismP(B.p(crown), P, yb - 0.02, f, true); triPoly(B.p({c:'#6f8794'}), P, (x, z) => f(x, z) - 4.5);
    mullP(B.p(fin), P, yb, (x, z) => f(x, z) + 0.2, 1.5, 0.16, 0.18);              // the glass screen's fins, lit at night
    edgeLineP(B.p(line), P, f, 0.35);
  };
  const office = (P, yb, yt, dx, dz) => { shaft(P, yb); crownOn(P, yb, slopeF(P, yb, yt, dx, dz)); };
  office(F.T1, 172, 192, 0.71, -0.71);          // Tower 1: the crown rises towards the bay
  office(F.T2, 221, 245, 0.95, 0.3);            // Tower 2
  // Tower 3: one body, its crown stepping in four slanted parts (OSM: 239 / 238 / 218 / 218 m)
  shaft(F.T3, 206);
  for (const [P, yb, yt, dx, dz] of [[F.T3a, 206, 239, -0.3, -0.95], [F.T3c, 206, 238, 0.3, 0.95], [F.T3b, 206, 218, 0, -1], [F.T3d, 206, 218, 1, 0]]){
    const f = slopeF(P, yb + (yt - yb)*0.45, yt, dx, dz); prismP(B.p(crown), P, yb - 0.02, f, true); triPoly(B.p({c:'#6f8794'}), P, (x, z) => f(x, z) - 4.5);
    mullP(B.p(fin), P, yb, (x, z) => f(x, z) + 0.2, 1.5, 0.16, 0.18); edgeLineP(B.p(line), P, f, 0.35); }
  // ---- residential towers: glass with continuous white balcony slabs, glass balustrades, white fins, sloping glazed crowns
  const fhR = 3.35;
  const resi = (P, yb, yt, dx, dz) => {
    prismP(B.p(glR), P, -4, yb + 4, true);
    bandsP(B.p(bal), P, Math.ceil((6 + BASE)/fhR)*fhR - BASE - fhR, yb, fhR, 0.42, 1.1);
    bandsP(B.p(rail), P, Math.ceil((6 + BASE)/fhR)*fhR - BASE - fhR + 0.32, yb, fhR, 1.05, 1.05);
    mullP(B.p(bal), P, 6, yb, 7.0, 0.45, 0.6);
    mullP(B.p(mull), P, 6, yb, 1.6, 0.1, 0.1);
    const f = slopeF(P, yb, yt, dx, dz); prismP(B.p(crown), P, yb - 0.02, f, true); triPoly(B.p({c:'#6f8794'}), P, (x, z) => f(x, z) - 3.5);
    mullP(B.p(fin), P, yb, (x, z) => f(x, z) + 0.2, 1.6, 0.14, 0.18); edgeLineP(B.p(line), P, f, 0.3);
  };
  resi(F.MBR, 206, 222, 0.6, -0.8);
  resi(F.MBS, 212, 227, -0.7, 0.7);
  // aircraft warning lights on the tallest tops
  for (const [P, y] of [[F.T2, 245], [F.T3a, 239]]){ const c = cenP(P); redL(g, c[0], y + 0.5, c[1]); }
  B.flush(g);
  return g; }};

// ===== Marina One (Ingenhoven / Architects 61, 2017): two 30-storey office towers (roof 207 m, crowns to 225 m) on the north-west
// side and two 34-storey residential towers (141 m, zig-zag balcony plans) on Marina Way, all wrapped in undulating bronze-tone
// louvres, round the 'Green Heart': a terraced valley garden climbing from a pond to the planted podium roofs, with planting
// cascading down the inner faces of the towers. Footprints from OSM.
// undulating horizontal louvre blades round a plan polygon: every `step` m a blade whose depth swells and shrinks along the
// facade and with height (front strip + blade top); edges(i) filters edges
function louvreP(o, P, y0, y1, step, bh, d0, amp, edges, ph){
  ph = ph || 0; let arc = 0;
  for (let i = 0; i < P.length; i++){
    const a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], L = Math.hypot(ex, ez); if (L < 0.4){ arc += L; continue; }
    if (edges && !edges(i)){ arc += L; continue; }
    const [nx, nz] = outN(P, i), n = Math.max(1, Math.round(L/5)); let kk = 0;
    const X = [], Z = []; for (let k = 0; k <= n; k++){ X.push(a[0] + ex*k/n); Z.push(a[1] + ez*k/n); }
    for (let y = y0 + step; y < y1 - 0.3; y += step){ kk++; const yt = y + bh;
      let dp = d0 + amp*(0.5 + 0.5*Math.sin(arc*0.11 + y*0.045 + ph));
      for (let k = 0; k < n; k++){ const dq = d0 + amp*(0.5 + 0.5*Math.sin((arc + (k + 1)/n*L)*0.11 + y*0.045 + ph));
        const ax = X[k] + nx*dp, az = Z[k] + nz*dp, bx = X[k+1] + nx*dq, bz = Z[k+1] + nz*dq;
        o.push(ax, y, az, bx, y, bz, bx, yt, bz, ax, y, az, bx, yt, bz, ax, yt, az);
        if (kk % 2){ const cx = X[k] + nx*0.05, cz = Z[k] + nz*0.05, qx = X[k+1] + nx*0.05, qz = Z[k+1] + nz*0.05;
          o.push(cx, yt, cz, qx, yt, qz, bx, yt, bz, cx, yt, cz, bx, yt, bz, ax, yt, az); }
        dp = dq; }
    }
    arc += L;
  }
}
LANDMARKS.marinaone = {zh:'滨海盛景', en:'Marina One', cat:'new', r:132, h:225, lt:{m:1, c:'#d8f0d0', k:0.7}, build(){
  const g = new THREE.Group(), B = mkB(), F = FD.marinaone, r = LMCTX.rng;
  const glO = {c:'#5f7680', m:1, fh:4.4, cw:3.0}, glR = {c:'#7f9196', m:1, fh:3.4, cw:2.5};
  const louv = '#c8b394', grn = '#5f8f45', grn2 = '#7aa65c', pod = '#d0cbc0', pave = pod, bl = '#a9bcc4', lite = {c:'#cfe6ee', glow:'#e0f4ff', gk:0.7};
  const GH = [[-17.8, 53.2], [-25.8, 23.2], [-22.8, 1.2], [-4.8, -26.8], [27.2, -37.8], [42.2, -40.8], [67.2, -28.8], [67.2, 23.2], [72.2, 33.2], [57.2, 48.2], [32.2, 63.2], [7.2, 75.2]];
  const gc = cenP(GH), facesIn = P => i => { const [nx, nz] = outN(P, i), a = P[i], b = P[(i+1) % P.length], mx = (a[0] + b[0])/2, mz = (a[1] + b[1])/2, dx = gc[0] - mx, dz = gc[1] - mz, l = Math.hypot(dx, dz) || 1; return (nx*dx + nz*dz)/l > 0.35; };
  const fol = '#4d7f3c', fol2 = '#6f9f50', fol3 = '#86b062';
  const outE = P => { const f = facesIn(P); return i => !f(i); };
  // plinths, the office podium (16 m) with its planted roof
  for (const P of [F.SITE6, F.RP, F.RG]) LPolyD(g, P, -4, 4.2, pave);
  LPolyD(g, GH, -4, 4.3, pave);
  LPolyD(g, F.SITE6, 0, 15.4, {c:'#8fa6ae', m:1, fh:5.1, cw:3.0}); bandsP(B.p(louv), F.SITE6, -5.1 + 0.2, 15.4, 5.1, 1.3, 0.25);
  louvreP(B.p(louv), F.SITE6, 0, 15.4, 1.7, 0.22, 0.4, 0.5, outE(F.SITE6));
  LPolyD(g, F.SITE6, 15.4, 0.6, grn2);
  // ---- office towers: glass bodies wrapped in undulating louvres, the faces to the Green Heart planted floor by floor
  for (const P of [F.OW, F.OE, F.OWn, F.OEn]){
    LPolyD(g, P, 0, 207, glO);
    const big = P.length > 10;
    louvreP(B.p(louv), P, 15.4, 207, 2.2, 0.62, 0.35, 0.9, big ? outE(P) : null, P === F.OE ? 2 : 0);
    mullP(B.p(louv), P, 15.4, 207, 8.8, 0.4, 0.3, big ? outE(P) : null);
    if (big){ const fi = facesIn(P);
      bandsP(B.p(louv), P, 15.4, 207, 4.4, 0.35, 1.6, fi);                                 // terrace slab edges
      bandsP(B.p(fol), P, 15.4 + 0.35, 200, 4.4, 1.1, 1.7, fi);                            // planter troughs, every floor
      bandsP(B.p(fol2), P, 15.4 - 2.2, 150, 8.8, 2.6, 1.3, fi);                            // hanging greenery
      louvreP(B.p(fol3), P, 15.4, 120, 13.2, 3.2, 1.0, 1.4, fi, 1);                        // the green cascade, densest low down
    }
  }
  for (const [P, h, c] of [[F.cW1, 210, louv], [F.cW2, 216, louv], [F.cE1, 210, louv], [F.cE2, 216, louv], [F.cW3, 225, lite], [F.cE3, 225, lite]]){
    prismP(B.p(c), P, 206.8, h); }
  for (const P of [F.OW, F.OE]){ const c = offP(P, 3); prismP(B.p(pod), c, 207, 208.2); treesIn(B, offP(P, 5), 8, 208.2, 0.7, r, null, fol); }
  // ---- residential towers: zig-zag balcony plans, white slab edges, glass balustrades, planters; louvres on the outer faces
  for (const P of [F.RP, F.RG]){
    LPolyD(g, P, 0, 141, glR);
    bandsP(B.p(louv), P, 3.6, 141, 3.4, 0.38, 0.4);
    bandsP(B.p(bl), P, 3.98, 141, 3.4, 1.0, 0.36);
    louvreP(B.p(louv), P, 3.6, 141, 1.7, 0.45, 0.6, 0.8, outE(P));
    bandsP(B.p(fol), P, 6.8, 136, 6.8, 0.9, 0.62, facesIn(P));
    bandsP(B.p(fol2), P, 5.2, 120, 13.6, 2.2, 0.5, facesIn(P));
    prismP(B.p(pod), offP(P, 2.5), 141, 143.5);
    treesIn(B, offP(P, 3), 14, 143.6, 0.6, r, null, fol);
  }
  // ---- the Green Heart: organic terraces stepping down from the podium roof to the pond in the valley, dense planting
  const S = [1, 0.88, 0.76, 0.64, 0.53, 0.43, 0.34], Hs = [15.6, 13.1, 10.6, 8.2, 5.8, 3.6, 1.6];
  const wob = (k, u) => GH.map((p, j) => { const w = 1 + 0.07*Math.sin(j*1.7 + k*2.3) + 0.04*Math.sin(j*3.1 + k); return [gc[0] + (p[0] - gc[0])*u*w, gc[1] + (p[1] - gc[1])*u*w]; });
  const smooth = P => { const out = []; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; out.push([a[0]*0.75 + b[0]*0.25, a[1]*0.75 + b[1]*0.25], [a[0]*0.25 + b[0]*0.75, a[1]*0.25 + b[1]*0.75]); } return out; };
  const ring = k => smooth(smooth(wob(k, S[k])));
  for (let k = 0; k < S.length - 1; k++){
    const Po = k === 0 ? GH : ring(k), Pi = ring(k + 1);
    ringPoly(g, Po, Pi, 0, Hs[k], k % 2 ? grn : grn2);
    if (k){ bandsP(B.p(fol), Po, Hs[k] - 1.1, Hs[k] + 0.9, 1, 0.9, -0.5);                  // shrubs along each terrace edge
      bandsP(B.p({c:'#e8dcc0', glow:'#ffd890', gk:1.3}), Po, Hs[k - 1] - 1.0, Hs[k - 1], 1, 0.22, -0.05); }   // path lights along the terrace edges
    for (let t = 0; t < 34; t++){ const u = lerp(S[k+1], S[k], 0.25 + 0.55*r()), P0 = wob(k, u), j = Math.floor(r()*GH.length), p = P0[j], q = P0[(j+1) % GH.length], s = r();
      treeP(B, lerp(p[0], q[0], s), Hs[k], lerp(p[1], q[1], s), 0.9 + 0.6*r(), r() < 0.4 ? fol : r() < 0.6 ? grn : fol2); }
  }
  LPolyD(g, ring(S.length - 1), 0, 0.7, {c:'#6fb0c0', glow:'#1f4a5c', gk:0.4});
  // waterfall down the north terraces, garden lights along the paths
  { const p = scaleP(GH, 0.95, gc)[2], q = scaleP(GH, 0.36, gc)[2]; quadP(B.p(lite), [p[0] - 3, 15.6, p[1]], [p[0] + 3, 15.6, p[1]], [q[0] + 3, 0.8, q[1]], [q[0] - 3, 0.8, q[1]]); }
  for (let k = 1; k < S.length - 1; k++){ const P = ring(k); for (let j = 0; j < P.length; j += 3){ const p = P[j]; LSphD(g, 0.35, p[0], Hs[k - 1 < 0 ? 0 : k - 1] - 0.0 + 0.6 - (Hs[k-1] - Hs[k]), p[1], {c:'#fff3d6', glow:'#ffd890', gk:1.6}, 1, 4); } }
  // the glass pavilion in the garden (OSM) and trees on the podium roof
  LPolyD(g, F.PAV, 0, 10.4, {c:'#7b97a1', glow:'#ffe0b0', gk:0.5}); prismP(B.p(grn2), F.PAV, 10.4, 11.0);
  treesIn(B, F.SITE6, 60, 16.0, 1.0, r, (x, z) => [F.OW, F.OE].some(P => inPoly(P, x, z) || dPoly(P, x, z) < 3), fol);
  B.flush(g);
  return g; }};

// ---- OCBC Centre: its own block with the lm20/w2 helpers (different signatures from the ones above)
{
const FD = {"ocbc":{"ALL":[[-10.8,-22.0],[-8.5,-26.1],[-12.0,-27.9],[-14.4,-30.8],[-16.2,-36.2],[-15.6,-42.1],[-12.6,-45.7],[-7.3,-48.0],[-2.5,-48.0],[1.7,-46.3],[4.1,-51.0],[38.7,-34.4],[35.7,-28.5],[42.3,-24.9],[44.7,-20.2],[44.7,-15.4],[41.7,-11.3],[36.9,-7.1],[30.9,-7.1],[26.2,-8.9],[23.2,-4.2],[43.5,5.9],[45.3,1.8],[40.5,0.0],[45.3,-9.5],[51.8,-15.4],[60.8,-19.6],[72.7,-18.4],[70.9,-13.1],[75.1,-12.5],[56.0,50.4],[32.7,43.3],[42.9,9.5],[33.9,4.7],[19.0,33.8],[-30.5,8.3],[-32.9,13.0],[-12.0,25.5],[-9.1,28.5],[-7.9,35.0],[-9.1,40.9],[-13.2,44.5],[-19.8,46.2],[-25.8,45.7],[-65.2,23.7],[-69.3,19.6],[-71.1,13.6],[-70.5,8.9],[-67.0,3.5],[-61.0,1.2],[-55.6,1.8],[-52.6,-4.8],[-65.2,-11.3],[-49.1,-41.5]],"MAIN":[[1.7,-46.3],[42.3,-24.9],[44.7,-20.2],[44.7,-15.4],[41.7,-11.3],[36.9,-7.1],[30.9,-7.1],[-12.0,-27.9],[-14.4,-30.8],[-16.2,-36.2],[-15.6,-42.1],[-12.6,-45.7],[-7.3,-48.0],[-2.5,-48.0]],"SN":[[35.7,-28.5],[1.7,-46.3],[4.1,-51.0],[38.7,-34.4]],"SS":[[-8.5,-26.1],[26.2,-8.9],[23.2,-4.2],[-10.8,-22.0]],"SOUTH":[[-55.6,1.8],[-32.9,13.0],[-12.0,25.5],[-9.1,28.5],[-7.9,35.0],[-9.1,40.9],[-13.2,44.5],[-19.8,46.2],[-25.8,45.7],[-65.2,23.7],[-69.3,19.6],[-71.1,13.6],[-70.5,8.9],[-67.0,3.5],[-61.0,1.2]],"POD":[[-52.6,-4.8],[-65.2,-11.3],[-49.1,-41.5],[43.5,5.9],[42.9,9.5],[33.9,4.7],[19.0,33.8],[-30.5,8.3],[-32.9,13.0],[-55.6,1.8]],"EAST":[[43.5,5.9],[45.3,1.8],[40.5,0.0],[45.3,-9.5],[51.8,-15.4],[60.8,-19.6],[72.7,-18.4],[70.9,-13.1],[75.1,-12.5],[56.0,50.4],[32.7,43.3]]}};
// every material double-sided so that extrusions and triangle batches of one colour share one material
const dsS = c => typeof c === 'string' ? {c, ds:true} : Object.assign({ds:true}, c);
const LPolyD = (g, P, y0, h, col) => LPoly(g, P, y0, h, dsS(col)), LBoxD = (g, w, h, d, x, y, z, col, ry) => LBox(g, w, h, d, x, y, z, dsS(col), ry);
const LCylD = (g, rt, rb, h, x, y, z, col, seg, ry) => LCyl(g, rt, rb, h, x, y, z, dsS(col), seg, ry), LSphD = (g, r, x, y, z, col, sy, seg) => LSph(g, r, x, y, z, dsS(col), sy, seg);
const lerp = (a, b, t) => a + (b - a)*t, cl01 = t => t < 0 ? 0 : t > 1 ? 1 : t;
// ---- triangle batches: many small parts of one colour spec become one LTris call
const mkB = () => { const M = new Map(); return {
  p(col){ const k = typeof col === 'string' ? col : JSON.stringify(col); let e = M.get(k); if (!e){ e = {col, a:[]}; M.set(k, e); } return e.a; },
  flush(g){ for (const e of M.values()) if (e.a.length) LTris(g, e.a, e.col); M.clear(); } }; };
const Q = (o, a, b, c, d) => o.push(...a, ...b, ...c, ...a, ...c, ...d);
const T3 = (o, a, b, c) => o.push(...a, ...b, ...c);
// n-sided prism round a segment (columns, rails, members), optional end radius r1
function segP(o, a, b, r, n, r1){
  n = n || 6; const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2], L = Math.hypot(dx, dy, dz); if (L < 1e-4) return;
  const d = [dx/L, dy/L, dz/L], up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let ux = d[1]*up[2]-d[2]*up[1], uy = d[2]*up[0]-d[0]*up[2], uz = d[0]*up[1]-d[1]*up[0]; const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
  const vx = d[1]*uz-d[2]*uy, vy = d[2]*ux-d[0]*uz, vz = d[0]*uy-d[1]*ux;
  const ring = (p, rr) => { const R = []; for (let i = 0; i < n; i++){ const t = (i + 0.5)/n*TAU, c = Math.cos(t)*rr, s = Math.sin(t)*rr; R.push([p[0]+ux*c+vx*s, p[1]+uy*c+vy*s, p[2]+uz*c+vz*s]); } return R; };
  const A = ring(a, r), B2 = ring(b, r1 === undefined ? r : r1);
  for (let i = 0; i < n; i++){ const j = (i+1) % n; Q(o, A[i], A[j], B2[j], B2[i]); }
}
// solid of revolution into a batch: profile [[r, y], ...] round (cx, cz), n sides
function latheP(o, prof, cx, cz, n, a0){
  a0 = a0 || 0; const R = prof.map(([r, y]) => { const ring = []; for (let i = 0; i < n; i++){ const t = a0 + i/n*TAU; ring.push([cx + Math.cos(t)*r, y, cz + Math.sin(t)*r]); } return ring; });
  for (let k = 0; k < R.length - 1; k++) for (let i = 0; i < n; i++){ const j = (i+1) % n; Q(o, R[k][i], R[k][j], R[k+1][j], R[k+1][i]); }
}
// ---- local frames: F(u, y, v) -> [x, y, z]; +u at plan angle a (x east, z south), +v = +u turned 90 deg towards +z
const frame = (ox, oz, a) => { const c = Math.cos(a), s = Math.sin(a); const f = (u, y, v) => [ox + u*c - v*s, y, oz + u*s + v*c]; f.P = (u, v) => [ox + u*c - v*s, oz + u*s + v*c];
  f.L = (x, z) => [(x - ox)*c + (z - oz)*s, -(x - ox)*s + (z - oz)*c]; f.a = a; return f; };
const F0 = frame(0, 0, 0);
// box from local min/max (u, y, v) corners in frame F (no bottom face unless bot)
function bxF(o, F, u0, u1, y0, y1, v0, v1, bot){
  const P = [F(u0,y0,v0), F(u1,y0,v0), F(u1,y0,v1), F(u0,y0,v1), F(u0,y1,v0), F(u1,y1,v0), F(u1,y1,v1), F(u0,y1,v1)];
  Q(o, P[4], P[7], P[6], P[5]); Q(o, P[0], P[4], P[5], P[1]); Q(o, P[1], P[5], P[6], P[2]); Q(o, P[2], P[6], P[7], P[3]); Q(o, P[3], P[7], P[4], P[0]); if (bot) Q(o, P[0], P[1], P[2], P[3]);
}
// box of size w x h x d centred at (x, z), base y, turned ry (rotP convention)
function boxP(o, w, h, d, x, y, z, ry){
  const R = rotP(x, z, ry || 0), hw = w/2, hd = d/2;
  const P = [R(-hw, y, -hd), R(hw, y, -hd), R(hw, y, hd), R(-hw, y, hd), R(-hw, y+h, -hd), R(hw, y+h, -hd), R(hw, y+h, hd), R(-hw, y+h, hd)];
  for (const [a, b, c, e] of [[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]) Q(o, P[a], P[b], P[c], P[e]);
}
// ---- plan polygons ([x, z] points)
const area2 = P => { let s = 0; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; s += a[0]*b[1] - b[0]*a[1]; } return s/2; };
const cenP = P => { let x = 0, z = 0; for (const p of P){ x += p[0]; z += p[1]; } return [x/P.length, z/P.length]; };
const rectP = (w, d, cx, cz, ry) => { const R = rotP(cx || 0, cz || 0, ry || 0); return [[-w/2, -d/2], [w/2, -d/2], [w/2, d/2], [-w/2, d/2]].map(p => { const q = R(p[0], 0, p[1]); return [q[0], q[2]]; }); };
const rectL = (F, u0, u1, v0, v1) => [F.P(u0, v0), F.P(u1, v0), F.P(u1, v1), F.P(u0, v1)];
const polyL = (F, P) => P.map(p => F.P(p[0], p[1]));
const ngon = (n, r, cx, cz, a0) => { const P = []; for (let i = 0; i < n; i++){ const a = (a0 || 0) + i/n*TAU; P.push([(cx || 0) + Math.cos(a)*r, (cz || 0) + Math.sin(a)*r]); } return P; };
// inward offset by d (negative grows), mitred and clamped
function offP(P, d){
  const n = P.length, s = area2(P) > 0 ? 1 : -1, L = [];
  for (let i = 0; i < n; i++){ const a = P[i], b = P[(i+1) % n], ex = b[0]-a[0], ez = b[1]-a[1], l = Math.hypot(ex, ez) || 1; L.push([a[0] - ez/l*s*d, a[1] + ex/l*s*d, ex, ez]); }
  const out = [];
  for (let i = 0; i < n; i++){ const p = L[(i + n - 1) % n], q = L[i], den = p[2]*q[3] - p[3]*q[2];
    if (Math.abs(den) < 1e-6){ out.push([q[0], q[1]]); continue; }
    const t = ((q[0]-p[0])*q[3] - (q[1]-p[1])*q[2])/den; let x = p[0] + p[2]*t, z = p[1] + p[3]*t;
    const ox = P[i][0], oz = P[i][1], dd = Math.hypot(x - ox, z - oz), mx = Math.abs(d)*2.5;
    if (dd > mx){ x = ox + (x - ox)/dd*mx; z = oz + (z - oz)/dd*mx; }
    out.push([x, z]); }
  return out;
}
// outward unit normal of edge i
const outN = (P, i) => { const s = area2(P) > 0 ? 1 : -1, a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], l = Math.hypot(ex, ez) || 1; return [ez/l*s, -ex/l*s]; };
const inPoly = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0]-a[0])*(z-a[1])/(b[1]-a[1]) + a[0]) c = !c; } return c; };
const dSeg = (x, z, a, b) => { const ex = b[0]-a[0], ez = b[1]-a[1], L2 = ex*ex + ez*ez || 1, t = cl01(((x-a[0])*ex + (z-a[1])*ez)/L2); return Math.hypot(x - a[0] - ex*t, z - a[1] - ez*t); };
const dPoly = (P, x, z) => { let d = 1e9; for (let i = 0; i < P.length; i++) d = Math.min(d, dSeg(x, z, P[i], P[(i+1) % P.length])); return d; };
const triang = P => THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
// walls of a plan polygon from y0 up to ytop (a number or f(x, z)) and its top, into a batch
function prismP(o, P, y0, ytop, noTop){
  const f = typeof ytop === 'function' ? ytop : () => ytop;
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; Q(o, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], f(b[0], b[1]), b[1]], [a[0], f(a[0], a[1]), a[1]]); }
  if (!noTop) for (const t of triang(P)) for (const k of t){ const p = P[k]; o.push(p[0], f(p[0], p[1]), p[1]); }
}
// walls of a plan polygon between two height functions (or numbers)
function wallP(o, P, y0, y1){ const f0 = typeof y0 === 'function' ? y0 : () => y0, f1 = typeof y1 === 'function' ? y1 : () => y1;
  for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; Q(o, [a[0], f0(a[0], a[1]), a[1]], [b[0], f0(b[0], b[1]), b[1]], [b[0], f1(b[0], b[1]), b[1]], [a[0], f1(a[0], a[1]), a[1]]); } }
const flatP = (o, P, y) => { for (const t of triang(P)) for (const k of t){ const p = P[k]; o.push(p[0], y, p[1]); } };
// floor bands round a plan polygon every `step` m between y0 and y1 (vertical quads just proud of the wall); edges(i) filters edges
function bandsP(o, P, y0, y1, step, bh, off, edges){
  off = off || 0.12;
  for (let i = 0; i < P.length; i++){ if (edges && !edges(i)) continue;
    const a = P[i], b = P[(i+1) % P.length]; if (Math.hypot(b[0]-a[0], b[1]-a[1]) < 0.3) continue; const [nx, nz] = outN(P, i);
    for (let y = y0 + step; y < y1 - 0.3; y += step) Q(o, [a[0]+nx*off, y, a[1]+nz*off], [b[0]+nx*off, y, b[1]+nz*off], [b[0]+nx*off, y+bh, b[1]+nz*off], [a[0]+nx*off, y+bh, a[1]+nz*off]);
  }
}
// one band round a plan polygon at y..y+h, `off` proud of the walls
function bandAt(o, P, y, h, off, edges){
  off = off || 0.1;
  for (let i = 0; i < P.length; i++){ if (edges && !edges(i)) continue; const a = P[i], b = P[(i+1) % P.length]; if (Math.hypot(b[0]-a[0], b[1]-a[1]) < 0.2) continue; const [nx, nz] = outN(P, i);
    Q(o, [a[0]+nx*off, y, a[1]+nz*off], [b[0]+nx*off, y, b[1]+nz*off], [b[0]+nx*off, y+h, b[1]+nz*off], [a[0]+nx*off, y+h, a[1]+nz*off]); }
}
// vertical strips (mullions / piers) standing `off` proud of the walls, about `sp` apart, `w` wide; y0, y1 numbers or f(x, z)
function mullP(o, P, y0, y1, sp, w, off, edges){
  for (let i = 0; i < P.length; i++){ if (edges && !edges(i)) continue;
    const a = P[i], b = P[(i+1) % P.length], ex = b[0]-a[0], ez = b[1]-a[1], L = Math.hypot(ex, ez); if (L < sp*0.6) continue;
    const [nx, nz] = outN(P, i), n = Math.max(1, Math.round(L/sp)), ux = ex/L, uz = ez/L, yy0 = typeof y0 === 'function' ? y0 : () => y0, yy1 = typeof y1 === 'function' ? y1 : () => y1;
    for (let k = 0; k <= n; k++){ const t = k/n, x = a[0] + ex*t + nx*off, z = a[1] + ez*t + nz*off, p = [x - ux*w/2, z - uz*w/2], q = [x + ux*w/2, z + uz*w/2];
      Q(o, [p[0], yy0(x, z), p[1]], [q[0], yy0(x, z), q[1]], [q[0], yy1(x, z), q[1]], [p[0], yy1(x, z), p[1]]); }
  }
}
// a lit line along the top edge of a polygon (crowns at night)
function edgeLineP(o, P, f, r, open){ const n = open ? P.length - 1 : P.length; for (let i = 0; i < n; i++){ const a = P[i], b = P[(i+1) % P.length]; segP(o, [a[0], f(a[0], a[1]) + r, a[1]], [b[0], f(b[0], b[1]) + r, b[1]], r, 4); } }
const triPoly = (o, P, f) => { for (const t of triang(P)) for (const k of t){ const p = P[k]; o.push(p[0], f(p[0], p[1]), p[1]); } };
// ---------- a "face": a vertical wall plane, u along it (from point A), d outwards, y up ----------
// fc(ax, az, bx, bz): wall from A to B; outward normal = the right-hand side walking A->B seen from above (+z drawn downwards)
const fc = function(ax, az, bx_, bz){ const L = Math.hypot(bx_ - ax, bz - az), tx = (bx_ - ax)/L, tz = (bz - az)/L; return {ax, az, tx, tz, nx:-tz, nz:tx, L}; };
const fcL = (F, u0, v0, u1, v1) => { const a = F.P(u0, v0), b = F.P(u1, v1); return fc(a[0], a[1], b[0], b[1]); };
// faces of a local rectangle, outside to the right: f (+v), r (+u), b (-v), l (-u)
const rectFL = (F, u0, u1, v0, v1) => ({f:fcL(F, u0, v1, u1, v1), r:fcL(F, u1, v1, u1, v0), b:fcL(F, u1, v0, u0, v0), l:fcL(F, u0, v0, u0, v1)});
// faces of a plan polygon with the outside to the right
const facesP = P => { const s = area2(P) > 0 ? 1 : -1, out = []; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length]; out.push(s < 0 ? fc(a[0], a[1], b[0], b[1]) : fc(b[0], b[1], a[0], a[1])); } return out; };
const fp = (F, u, y, d) => [F.ax + F.tx*u + F.nx*d, y, F.az + F.tz*u + F.nz*d];
// box in face coordinates
function fbx(o, F, u0, u1, y0, y1, d0, d1){
  const P = [fp(F,u0,y0,d0), fp(F,u1,y0,d0), fp(F,u1,y0,d1), fp(F,u0,y0,d1), fp(F,u0,y1,d0), fp(F,u1,y1,d0), fp(F,u1,y1,d1), fp(F,u0,y1,d1)];
  Q(o, P[4], P[7], P[6], P[5]); Q(o, P[0], P[4], P[5], P[1]); Q(o, P[1], P[5], P[6], P[2]); Q(o, P[2], P[6], P[7], P[3]); Q(o, P[3], P[7], P[4], P[0]); Q(o, P[0], P[1], P[2], P[3]);
}
// flat panel on the face at depth d
const frect = (o, F, u0, u1, y0, y1, d) => Q(o, fp(F,u0,y0,d), fp(F,u1,y0,d), fp(F,u1,y1,d), fp(F,u0,y1,d));
// round-headed panel: rectangle up to the springing ys, half circle above
function farch(o, F, uc, y0, w, ys, d, n){
  n = n || 6; const r = w/2; frect(o, F, uc - r, uc + r, y0, ys, d);
  for (let i = 0; i < n; i++){ const a = PI*i/n, b = PI*(i+1)/n; T3(o, fp(F, uc, ys, d), fp(F, uc + Math.cos(a)*r, ys + Math.sin(a)*r, d), fp(F, uc + Math.cos(b)*r, ys + Math.sin(b)*r, d)); }
}
// arch ring (voussoirs) round a round-headed opening: band of width bw outside radius r, springing ys
function farchRing(o, F, uc, ys, r, bw, d, n){
  n = n || 8; for (let i = 0; i < n; i++){ const a = PI*i/n, b = PI*(i+1)/n;
    Q(o, fp(F, uc + Math.cos(a)*r, ys + Math.sin(a)*r, d), fp(F, uc + Math.cos(a)*(r + bw), ys + Math.sin(a)*(r + bw), d), fp(F, uc + Math.cos(b)*(r + bw), ys + Math.sin(b)*(r + bw), d), fp(F, uc + Math.cos(b)*r, ys + Math.sin(b)*r, d)); }
}
// open arcade: n round arches between u0 and u1 on piers of width pw, springing at ys, wall up to yt, thickness d0..d1
function farcade(o, F, u0, u1, n, y0, ys, yt, pw, d0, d1, seg){
  seg = seg || 6; const bw = (u1 - u0)/n, r = (bw - pw)/2;
  for (let k = 0; k <= n; k++){ const u = u0 + k*bw; fbx(o, F, Math.max(u0, u - pw/2), Math.min(u1, u + pw/2), y0, yt, d0, d1); }
  for (let k = 0; k < n; k++){ const uc = u0 + (k + 0.5)*bw;
    for (let i = 0; i < seg; i++){ const a = PI - PI*i/seg, b = PI - PI*(i+1)/seg, ua = uc + Math.cos(a)*r, ub = uc + Math.cos(b)*r, ya = ys + Math.sin(a)*r, yb = ys + Math.sin(b)*r;
      for (const d of [d0, d1]) Q(o, fp(F, ua, ya, d), fp(F, ub, yb, d), fp(F, ub, yt, d), fp(F, ua, yt, d));
      Q(o, fp(F, ua, ya, d0), fp(F, ub, yb, d0), fp(F, ub, yb, d1), fp(F, ua, ya, d1)); }
  }
}
// round column at u, depth d on the face
function fcol(o, F, u, d, y0, y1, r, n){ const c = fp(F, u, 0, d); segP(o, [c[0], y0, c[2]], [c[0], y1, c[2]], r, n || 8); }
// balustrade / railing along the face
function frail(o, F, u0, u1, y, h, d, sp){ fbx(o, F, u0, u1, y + h - 0.12, y + h, d - 0.06, d + 0.06); const n = Math.max(1, Math.round((u1 - u0)/(sp || 1.2))); for (let i = 0; i <= n; i++){ const u = u0 + i*(u1 - u0)/n; fbx(o, F, u - 0.04, u + 0.04, y, y + h, d - 0.04, d + 0.04); } }
// triangular pediment on a face: base u0..u1 at y, apex height h, depth d0..d1
function fped(o, F, u0, u1, y, h, d0, d1){
  const um = (u0 + u1)/2;
  for (const d of [d0, d1]) T3(o, fp(F, u0, y, d), fp(F, u1, y, d), fp(F, um, y + h, d));
  Q(o, fp(F, u0, y, d0), fp(F, um, y + h, d0), fp(F, um, y + h, d1), fp(F, u0, y, d1)); Q(o, fp(F, um, y + h, d0), fp(F, u1, y, d0), fp(F, u1, y, d1), fp(F, um, y + h, d1));
}
// hipped roof on a local rectangle (frame F) at eaves height y, rise h, overhang ov; ridge along the longer side
function hipF(o, F, u0, u1, v0, v1, y, h, ov){
  ov = ov || 0; u0 -= ov; u1 += ov; v0 -= ov; v1 += ov; const L = u1 - u0, W = v1 - v0, cu = (u0 + u1)/2, cv = (v0 + v1)/2;
  if (L >= W){ const k = (L - W)/2, a = F(cu - k, y + h, cv), b = F(cu + k, y + h, cv);
    Q(o, F(u0, y, v1), F(u1, y, v1), b, a); Q(o, F(u1, y, v0), F(u0, y, v0), a, b); T3(o, F(u0, y, v0), F(u0, y, v1), a); T3(o, F(u1, y, v1), F(u1, y, v0), b); }
  else { const k = (W - L)/2, a = F(cu, y + h, cv - k), b = F(cu, y + h, cv + k);
    Q(o, F(u1, y, v1), F(u1, y, v0), a, b); Q(o, F(u0, y, v0), F(u0, y, v1), b, a); T3(o, F(u0, y, v1), F(u1, y, v1), b); T3(o, F(u1, y, v0), F(u0, y, v0), a); }
}
// gabled roof on a local rectangle, ridge along u (ax 'u') or v; gable triangles into ow
function gabF(o, ow, F, u0, u1, v0, v1, y, h, ax, ov){
  ov = ov || 0;
  if (ax === 'u'){ const cv = (v0 + v1)/2; Q(o, F(u0 - ov, y, v1 + ov), F(u1 + ov, y, v1 + ov), F(u1 + ov, y + h, cv), F(u0 - ov, y + h, cv)); Q(o, F(u1 + ov, y, v0 - ov), F(u0 - ov, y, v0 - ov), F(u0 - ov, y + h, cv), F(u1 + ov, y + h, cv));
    if (ow){ T3(ow, F(u0, y, v0), F(u0, y, v1), F(u0, y + h, cv)); T3(ow, F(u1, y, v1), F(u1, y, v0), F(u1, y + h, cv)); } }
  else { const cu = (u0 + u1)/2; Q(o, F(u1 + ov, y, v1 + ov), F(u1 + ov, y, v0 - ov), F(cu, y + h, v0 - ov), F(cu, y + h, v1 + ov)); Q(o, F(u0 - ov, y, v0 - ov), F(u0 - ov, y, v1 + ov), F(cu, y + h, v1 + ov), F(cu, y + h, v0 - ov));
    if (ow){ T3(ow, F(u0, y, v1), F(u1, y, v1), F(cu, y + h, v1)); T3(ow, F(u1, y, v0), F(u0, y, v0), F(cu, y + h, v0)); } }
}
// trees into batches
function treeP(B, x, y, z, s, crown, trunk){
  segP(B.p(trunk || '#5d4a3a'), [x, y - 1, z], [x, y + 3*s, z], 0.28*s, 4);
  const c = B.p(crown || '#4f7f3a'), R = 2.4*s, cy = y + 4.2*s, top = [x, cy + R*0.75, z], bot = [x, cy - R*0.55, z], ring = [];
  for (let i = 0; i < 6; i++){ const a = i/6*TAU; ring.push([x + Math.cos(a)*R, cy, z + Math.sin(a)*R]); }
  for (let i = 0; i < 6; i++){ const j = (i+1) % 6; T3(c, top, ring[j], ring[i]); T3(c, bot, ring[i], ring[j]); }
}
function palmP(B, x, y, z, s, r, crown){
  const top = [x + (r() - 0.5)*1.2*s, y + 7*s, z + (r() - 0.5)*1.2*s];
  segP(B.p('#5d4a3a'), [x, y - 1, z], top, 0.22*s, 4);
  const f = B.p(crown || '#4f7f3a');
  for (let i = 0; i < 7; i++){ const a = i/7*TAU + r(), c = Math.cos(a), sn = Math.sin(a), L = 3.2*s;
    T3(f, top, [top[0] + c*L - sn*0.5*s, top[1] - 1.2*s, top[2] + sn*L + c*0.5*s], [top[0] + c*L + sn*0.5*s, top[1] - 1.2*s, top[2] + sn*L - c*0.5*s]); }
}

// ===== OCBC Centre (I. M. Pei with BEP Akitek, 1976; 52 storeys, 197.7 m, "the calculator"): a granite-clad slab between two
// massive semicircular concrete cores. Post-tensioned transfer girders at floors 4, 20 and 35 span between the cores and
// each carries 14 office floors, so the office floors read as three blocks (OSM parts 16-76, 85-136, 142-188 m) that stand
// proud of the core-width slab, separated by recessed girder bands; their long faces carry the grid of square windows that
// gave the nickname. Round the foot: the glazed banking-hall podium (20 m), OCBC Centre South (rounded ends, 24 m) and
// OCBC Centre East (56 m) along Phillip Street - all one OSM footprint. Plan from the real footprint, slab turned 26.85 deg.
LANDMARKS.ocbc = {zh:'华侨银行大厦', en:'OCBC Centre', cat:'new', r:82, h:198, lt:{m:0, c:'#fff1dc', k:0.42, e:0.55}, build(){
  const g = new THREE.Group(), B = mkB(), D = FD.ocbc, rng = LMCTX.rng;
  const GR = '#a9a194', GRd = '#958d81', DK = '#2e3740', LIT = {c:'#3a4650', glow:'#ffe3b4', gk:0.8}, LOU = '#59606a', ROOF = '#8e8a83';
  const GLs = {c:'#3c4851', glow:'#ffe0b0', gk:0.5}, RED = {c:'#c22', glow:'#ff2a1a', gk:2};
  const a = 26.85*PI/180, Fl = frame(0, 0, a), c0 = Fl.P(0.25, -30.9), T = frame(c0[0], c0[1], a);
  const gr = B.p(GR), grd = B.p(GRd), dk = B.p(DK), lit = B.p(LIT), lou = B.p(LOU);
  // ---------------- the tower ----------------
  const R = 11.3, CU = 21.75, SL = 19.4, VN = -17.3, VS = 16.6, TOP = 196;
  const stadium = (r, cu, n) => { const P = []; for (let i = 0; i <= n; i++){ const t = -HP + PI*i/n; P.push(T.P(cu + Math.cos(t)*r, Math.sin(t)*r)); } for (let i = 0; i <= n; i++){ const t = HP + PI*i/n; P.push(T.P(-cu + Math.cos(t)*r, Math.sin(t)*r)); } return P; };
  const ST = stadium(R, CU, 14);
  LPolyD(g, ST, -5, TOP + 5, GR);
  // vertical joints on the cores, a slit of windows up each core end
  for (const s of [-1, 1]) for (let i = 1; i < 14; i++){ const t = -HP + PI*i/14, u = s*(CU + Math.cos(t)*(R + 0.04)), v = s*Math.sin(t)*(R + 0.04), p = T(u, 0, v);
    if (i % 2) segP(grd, [p[0], 20, p[2]], [p[0], TOP + 1.5, p[2]], 0.09, 3); }
  for (const s of [-1, 1]) { const Fc = fcL(T, s*(CU + R + 0.05), s*0.8, s*(CU + R + 0.05), -s*0.8); for (let y = 24; y < TOP - 4; y += 4.29) frect(rng() < 0.4 ? lit : dk, Fc, 0, 1.6, y, y + 1.5, 0.02); }
  // faces of the core-width slab (north -v, south +v), louvred where the office blocks do not cover it
  const Fn = fcL(T, SL, -R, -SL, -R), Fs = fcL(T, -SL, R, SL, R);
  const bands = [[16, 20.5], [76, 85], [136, 142], [188, TOP]];
  for (const Fa of [Fn, Fs]) for (const [y0, y1] of bands){ frect(dk, Fa, 0, Fa.L, y0, y1, 0.03); for (let y = y0 + 0.5; y < y1 - 0.2; y += 0.7) fbx(lou, Fa, 0, Fa.L, y, y + 0.12, 0, 0.3); fbx(grd, Fa, -0.2, Fa.L + 0.2, y1 - 0.6, y1, 0, 0.4); }
  // the three office blocks, each on its girder (a solid granite band at its foot)
  const secs = [[16, 76], [85, 136], [142, 188]];
  for (const [y0, y1] of secs){
    bxF(gr, T, -SL, SL, y0, y1, VN, -R + 0.2, true); bxF(gr, T, -SL, SL, y0, y1, R - 0.2, VS, true);
    const nF = 14, fh = (y1 - y0 - 3.2)/nF, faces = [[fcL(T, SL, VN, -SL, VN), 13], [fcL(T, -SL, VS, SL, VS), 13], [fcL(T, -SL, VN, -SL, -R), 2], [fcL(T, SL, -R, SL, VN), 2], [fcL(T, -SL, R, -SL, VS), 2], [fcL(T, SL, VS, SL, R), 2]];
    for (const [Fa, nc] of faces){
      const bw = Fa.L/nc, gy = y0 + 3.2;
      fbx(grd, Fa, -0.1, Fa.L + 0.1, y0, gy, 0, 0.45);                                     // the girder band
      frect(dk, Fa, 0, Fa.L, gy, y1, 0.02);
      for (let k = 0; k < nF; k++) for (let c = 0; c < nc; c++) if (rng() < 0.42) frect(lit, Fa, c*bw + 0.4, (c + 1)*bw - 0.4, gy + k*fh + 1.0, gy + (k + 1)*fh - 0.25, 0.05);
      for (let k = 0; k <= nF; k++){ const y = gy + k*fh; fbx(gr, Fa, -0.05, Fa.L + 0.05, Math.max(gy, y - 0.25), Math.min(y1, y + 1.0), 0, 0.38); }
      for (let c = 0; c <= nc; c++){ const u = c*bw; fbx(gr, Fa, Math.max(-0.05, u - 0.4), Math.min(Fa.L + 0.05, u + 0.4), gy, y1, 0, 0.38); }
    }
  }
  // roof: parapet, plant, the cores standing 2 m proud, aviation light
  flatP(B.p(ROOF), stadium(R - 0.6, CU, 10), TOP + 0.05);
  for (const s of [-1, 1]) { const C = []; for (let i = 0; i <= 10; i++){ const t = -HP + PI*i/10; C.push(T.P(s*CU + s*Math.cos(t)*R, s*Math.sin(t)*R)); } C.push(T.P(s*(CU - 4), s*R), T.P(s*(CU - 4), -s*R)); prismP(gr, C, TOP, TOP + 2.2); }
  bxF(B.p(ROOF), T, -12, 12, TOP, TOP + 3.5, -6, 6); bxF(lou, T, -11.5, 11.5, TOP + 0.6, TOP + 3.0, -6.05, 6.05);
  { const p = T(CU, 0, 0); LCylD(g, 0.1, 0.1, 3, p[0], TOP + 2.2, p[2], '#9a9a9a', 5); LSphD(g, 0.45, p[0], TOP + 5.4, p[2], RED, 1, 6); }
  // ---------------- banking-hall podium ----------------
  { const P = D.POD; LPolyD(g, P, -5, 21, GLs); LPolyD(g, offP(P, -0.2), 15.6, 4.8, GR); flatP(B.p(ROOF), offP(P, 0.6), 20.45);
    mullP(gr, P, 0, 15.6, 6.0, 1.1, 0.25); bandsP(grd, P, 15.4, 21, 2.4, 0.35, 0.25);
    for (const Fa of facesP(P)) if (Fa.L > 3) frail(B.p('#8d9196'), Fa, 0.3, Fa.L - 0.3, 20.4, 1.0, -0.3, 1.5); }
  // ---------------- OCBC Centre South: rounded ends, six floors of ribbon windows ----------------
  { const P = D.SOUTH; LPolyD(g, P, -5, 28.7, GR); flatP(B.p(ROOF), offP(P, 0.5), 23.75);
    for (let y = 1.2; y < 22; y += 3.75){ const o = y < 4 ? B.p(GLs) : (rng() < 0.5 ? lit : dk); bandAt(o, P, y, 2.1, 0.05); }
    bandAt(gr, P, 22.8, 1.4, 0.3); mullP(grd, P, 0, 22.6, 3.6, 0.35, 0.12); }
  // ---------------- OCBC Centre East: 13 floors on Phillip Street (its south end kept clear of Yueh Hai Ching Temple) ----------------
  { const P = D.EAST.map(p => p.slice()), ax = [0.172, 0.985];
    const loc = q => Fl.L(q[0], q[1]);
    for (const p of P){ const l = loc(p); if (l[1] > 15){ const m = Fl.P(l[0] - ax[0]*2.5, l[1] - ax[1]*2.5); p[0] = m[0]; p[1] = m[1]; } }
    LPolyD(g, P, -5, 61, GR); flatP(B.p(ROOF), offP(P, 0.5), 56.05);
    for (let y = 5.6; y < 54; y += 3.8) bandAt(rng() < 0.45 ? lit : dk, P, y, 2.0, 0.05);
    bandAt(B.p(GLs), P, 0.4, 4.2, 0.05); mullP(gr, P, 4.8, 54, 2.9, 0.55, 0.14); bandAt(grd, P, 54.4, 2.4, 0.3);
    bxF(B.p(ROOF), Fl, 50, 62, 56, 59.5, -10, 8); }
  B.flush(g);
  return g; }};

}
SG_PLACES.push(
  {type:'uob', lat:1.285460, lon:103.850663, rot:0},
  {type:'oneraffles', lat:1.284466, lon:103.850951, rot:0},
  {type:'republic', lat:1.282992, lon:103.850920, rot:0},
  {type:'ocbc', lat:1.285014, lon:103.849196, rot:0},
  {type:'mbfc', lat:1.279550, lon:103.854394, rot:0},
  {type:'marinaone', lat:1.277352, lon:103.852866, rot:0}
);

}
