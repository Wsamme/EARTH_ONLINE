// ================= Mustafa Centre (opened 1995), Syed Alwi Road =================
// Verified (Wikipedia): 24-hour department store, one main store and five wings, ~37,000 m2; the data maps the blocks on the NE side
// of Syed Alwi Road as 5-storey buildings (17.7 m): w178437071, w178437074, w178437070 (+ a small piece) here, w47198841 in
// sgmustafa2 and w178437069 in sgmustafa3 (secondary keys, label:false; split so that no hull reaches over the lanes between them).
// Facade colours and the ground-floor shopfront arcade are estimates; the link over the lane is not placed (position unknown).
const MUS = (rings, lowRing) => function(){
  const g = new THREE.Group(), B = mkB();
  const M = {WALL:'#ece9e1', BAND:'#c9c5bb', WIN:{c:'#3e4a55', m:1, fh:3.4, cw:3}, TRIM:'#f7f5f0', ROOF:'#8e8f8c', SHOP:{c:'#3b4044', glow:'#ffe4b8', gk:1.0}, BASE:'#8d897f', FIN:'#d4d0c6'};
  for (const P of rings){ prismP(B.p(M.BASE), P, -5, 0.4, false);
    prismP(B.p(M.SHOP), offP(P, 1.8), 0.4, 4.4, false); prismP(B.p(M.WALL), P, 4.4, 17.7, false); capP(B.p(M.ROOF), P, 17.7);
    for (const [x, z] of alongP(P, 4)) boxP(B.p(M.FIN), 0.5, 4.0, 0.5, x, 0.4, z);
    for (let f = 0; f < 4; f++) bandP(B.p(M.BAND), P, 4.4 + f*3.33, 0.4, 0.15);
    winP(B.p(M.WIN), P, 4.4, 4, 3.33, 2.4, 1.9, 1.9, 0.7, 0.05, 3);
    parP(B.p(M.TRIM), P, 17.7, 18.7, 0.25);
    // rooftop plant rooms
    const c = ctr(P); LBox(g, 6, 3, 6, c[0], 17.7, c[1], M.BAND); }
  if (lowRing){ prismP(B.p(M.BASE), lowRing, -5, 0.4, false); prismP(B.p(M.WALL), lowRing, 0.4, 5.2, false); capP(B.p(M.ROOF), lowRing, 5.2); }
  B.flush(g); return g; };
LANDMARKS.sgmustafa = {zh:'慕斯达法中心', en:'Mustafa Centre', cat:'new', r:50, h:20.7, lt:{m:1, c:'#e8eef5', k:0.5},
  build:MUS([[[25.3,35.5],[-9.4,2.9],[1.4,-8.3],[36.0,23.7]], [[-24.9,-37.4],[-11.7,-24.4],[-11.7,-21.4],[-13.5,-18.4],[-18.9,-12.5],[-21.3,-11.9],[-24.3,-12.5],[-37.4,-23.8]],
    [[-13.5,-18.4],[-0.4,-6.6],[-5.8,-0.6],[-18.9,-12.5]]], [[18.7, 7.0], [11.5, 1.0], [17.5, -5.5], [24.7, 0.4]])};
SG_PLACES.push({type:'sgmustafa', lat:1.309538, lon:103.855936, rot:0});
LANDMARKS.sgmustafa2 = {zh:'慕斯达法中心', en:'Mustafa Centre', cat:'new', r:58, h:20.7, label:false, lt:{m:1, c:'#e8eef5', k:0.5},
  build:MUS([[[31.2,40.8],[-44.0,-28.0],[-32.1,-41.0],[43.7,27.2]]])};
SG_PLACES.push({type:'sgmustafa2', lat:1.310123, lon:103.855320, rot:0});
LANDMARKS.sgmustafa3 = {zh:'慕斯达法中心', en:'Mustafa Centre', cat:'new', r:45, h:20.7, label:false, lt:{m:1, c:'#e8eef5', k:0.5},
  build:MUS([[[-19.4,-35.5],[37.3,16.1],[19.4,35.6],[-37.3,-16.0]]])};
SG_PLACES.push({type:'sgmustafa3', lat:1.309073, lon:103.856498, rot:0});
