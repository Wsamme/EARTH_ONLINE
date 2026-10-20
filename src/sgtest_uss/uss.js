// ===== Universal Studios Singapore (Resorts World Sentosa) — the theme park as a SITE =====
// Seven themed zones round the central lagoon, placed on the real OSM footprints (local metres round 1.2540 N
// 103.8223 E; +x east, +z south; y absolute, everything stands on ctx.gy). Architecture, rides, landscaping and
// colours only: no logos, wordmarks, text or characters. Nearly everything goes into a handful of batched meshes
// (one vertex-coloured mesh + a few glowing / translucent ones), so the helper-call count stays tiny.
{
const PI = Math.PI, TAU = PI*2, HP = PI/2;
const lerp = (a, b, t) => a + (b - a)*t, clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const sstep = (a, b, x) => { const t = clamp((x - a)/(b - a), 0, 1); return t*t*(3 - 2*t); };
// ---------- real data: keep outline, building footprints [name, h, ring], footpaths, lagoon, WaterWorld pool ----------
const USS_KEEP = [[-114,-266],[-98,-284],[-78,-292],[-40,-286],[28,-286],[86,-230],[140,-218],[172,-202],[198,-172],[232,-130],[254,-98],[268,-80],[300,-74],[316,-46],[344,-4],[370,38],[394,80],[396,114],[380,144],[348,160],[322,170],[306,200],[276,218],[236,214],[196,196],[166,166],[140,136],[100,129],[40,127],[-16,126],[-50,114],[-100,82],[-150,48],[-198,8],[-178,-12],[-160,-36],[-182,-80],[-180,-104],[-160,-128],[-120,-172],[-116,-188],[-106,-214],[-100,-232],[-104,-250]];
const USS_BLD = [["",17,[[267,185],[256,184],[253,182],[254,179],[250,176],[247,171],[247,166],[250,160],[262,151],[265,145],[265,137],[262,130],[267,128],[270,133],[270,139],[272,139],[273,142],[270,143],[270,148],[267,154],[261,161],[255,165],[254,167],[254,172],[258,174],[262,174],[265,171],[275,151],[279,147],[287,146],[292,137],[299,142],[295,149],[298,154],[298,159],[297,165],[292,170],[290,164],[292,161],[292,158],[290,154],[287,153],[283,153],[279,155]]],["",7,[[229,187],[233,182],[239,186],[234,191]]],["TRANSFORMERS The Ride: The Ultimate 3D Battle",11,[[-138,-27],[-110,-2],[-93,-24],[-69,-3],[-65,4],[-65,6],[-82,8],[-82,13],[-92,13],[-101,24],[-102,24],[-109,19],[-111,20],[-122,12],[-126,17],[-108,31],[-126,52],[-187,2],[-158,-31],[-152,-27]]],["",8,[[-174,-97],[-176,-99],[-159,-120],[-157,-118],[-161,-113],[-153,-106],[-164,-92],[-172,-99]]],["",8,[[-25,85],[-24,110],[-38,110],[-38,87],[-37,86]]],["Accelerator",11,[[-89,25],[-90,24],[-74,19],[-76,18],[-70,16],[-62,17],[-55,19],[-59,23],[-61,29],[-61,34],[-75,34],[-78,32],[-84,30],[-88,30],[-91,26]]],["",6,[[15,101],[16,84],[24,84],[24,101]]],["",7,[[-44,-126],[-46,-129],[-27,-146],[-25,-143]]],["Discovery Food Court",20,[[117,-24],[126,-35],[128,-39],[128,-44],[141,-46],[150,-43],[156,-36],[160,-28],[154,-26],[146,-21],[142,-15],[138,-8],[135,-2],[135,6],[123,1],[114,-6],[111,-13],[110,-21]]],["",4,[[-54,-261],[-8,-222],[16,-173],[11,-166],[-4,-158],[-18,-155],[-38,-196],[-79,-232],[-82,-228],[-101,-244],[-70,-280],[-51,-264]]],["Puss In Boots’ Giant Journey",11,[[286,-47],[274,-37],[254,-59],[265,-69]]],["",7,[[132,-200],[126,-203],[130,-212],[136,-209]]],["",4,[[-148,-59],[-117,-93],[-109,-86],[-76,-126],[-56,-109],[-89,-69],[-89,-52],[-80,-44],[-95,-28],[-103,-36],[-111,-27]]],["",4,[[-78,-272],[-98,-248],[-102,-251],[-100,-258],[-90,-269],[-82,-275]]],["",6,[[139,-114],[136,-118],[142,-124],[146,-120]]],["Goldilocks",16,[[179,-59],[181,-59],[181,-68],[183,-70],[229,-65],[227,-43],[217,-44],[218,-53],[178,-56]]],["",6,[[360,52],[356,56],[348,48],[352,43]]],["Revenge of the Mummy",14,[[141,59],[140,124],[44,123],[44,59]]],["",8,[[277,54],[274,48],[276,44],[278,42],[282,41],[288,45],[289,48],[288,52],[284,54],[281,55]]],["",6,[[185,144],[187,145],[185,137],[184,137],[181,130],[188,128],[190,135],[185,136],[188,146],[191,147],[188,153],[182,150]]],["King Julien's Beach Party-Go-Round",7,[[79,-140],[83,-138],[85,-134],[86,-130],[85,-126],[83,-122],[79,-120],[75,-119],[71,-120],[67,-123],[65,-126],[65,-134],[67,-138],[71,-140],[75,-141]]],["",8,[[313,157],[307,156],[308,144],[314,145]]],["",6,[[153,-132],[158,-124],[152,-124],[146,-120],[142,-124]]],["",18,[[221,-123],[246,-94],[244,-84],[239,-79],[183,-85],[184,-93]]],["Marty's Casa Del Wild",6,[[128,-155],[129,-152],[128,-148],[124,-147],[121,-148],[119,-152],[120,-155],[124,-156]]],["",14,[[270,126],[258,132],[257,129],[252,132],[247,121],[252,119],[246,108],[258,102],[263,112],[266,110],[272,121],[268,123]]],["",4,[[259,-6],[265,-6],[274,-3],[276,0],[289,1],[298,3],[301,5],[304,16],[308,20],[309,26],[304,29],[299,26],[294,27],[292,30],[299,33],[298,38],[292,36],[283,28],[287,24],[289,20],[280,13],[263,7],[260,7],[248,3],[248,-5],[253,-8],[256,-8]]],["",4,[[-38,-196],[-24,-168],[-53,-149],[-71,-148],[-112,-181],[-89,-207],[-101,-216],[-87,-233],[-82,-228],[-79,-232]]],["",4,[[-90,-269],[-100,-258],[-109,-266],[-99,-277]]],["",6,[[375,85],[381,86],[379,99],[373,98]]],["",6,[[138,24],[134,26],[128,16],[132,13]]],["",8,[[8,120],[8,118],[2,118],[2,108],[12,108],[12,105],[22,105],[22,112],[20,112],[20,120]]],["KT's Grill",15,[[-31,-110],[-27,-113],[-19,-105],[-17,-87],[-41,-86],[-60,-103],[-56,-109],[-58,-111],[-55,-114],[-52,-111],[-43,-121]]],["",10,[[-10,78],[-16,87],[-19,84],[-13,77],[-14,56],[-3,56],[-3,71],[-10,71]]],["Lights! Camera! Action!",12,[[-59,-92],[-62,-88],[-27,-58],[-40,-43],[-36,-40],[-52,-21],[-89,-52],[-89,-69],[-65,-98]]],["",11,[[145,-180],[147,-184],[172,-171],[177,-163],[175,-161],[177,-157],[151,-136],[144,-145],[139,-143],[135,-144],[130,-150],[130,-152],[126,-157],[123,-156],[120,-159],[119,-162],[124,-166],[120,-171],[130,-186]]],["Treasure Hunters",7,[[80,5],[92,-3],[101,9],[89,18]]],["",7,[[-108,48],[-98,37],[-92,42],[-102,53]]],["",5,[[167,-88],[163,-92],[166,-94],[163,-97],[171,-104],[181,-92],[172,-85],[169,-89]]],["",8,[[73,-13],[75,-3],[60,1],[57,-8]]],["Stage28",12,[[-76,-126],[-109,-86],[-117,-93],[-130,-78],[-141,-87],[-128,-100],[-126,-97],[-118,-106],[-124,-112],[-127,-108],[-153,-130],[-117,-170],[-73,-134],[-72,-123]]],["",4,[[-80,-44],[-50,-19],[-53,-5],[-65,0],[-96,-26],[-95,-28]]],["Battlestar Galactica",13,[[-57,66],[-34,81],[-38,87],[-38,106],[-47,107],[-50,110],[-76,93],[-74,91],[-79,81],[-61,72]]],["Gloria's Snack Shack",17,[[12,-159],[11,-165],[13,-169],[19,-172],[25,-172],[46,-164],[42,-149],[18,-155]]],["",10,[[-19,112],[-3,112],[-4,121],[-20,120]]],["",13,[[36,72],[31,55],[55,49],[53,45],[78,38],[80,43],[98,38],[102,53],[141,53],[141,59],[44,59],[44,72]]],["",10,[[164,-191],[138,-203],[141,-210],[167,-198]]],["",10,[[376,78],[361,63],[366,58],[381,73]]],["",10,[[153,29],[165,16],[170,22],[157,33]]],["Friar's",10,[[170,-57],[152,-59],[153,-67],[143,-79],[148,-82],[157,-73],[166,-72],[165,-60],[170,-60]]],["",7,[[342,122],[354,120],[355,127],[343,128]]],["",8,[[197,-13],[195,-7],[190,-4],[184,-6],[181,-11],[183,-17],[188,-20],[194,-18]]],["",12,[[19,11],[19,8],[24,7],[22,3],[30,1],[28,-2],[42,-5],[44,1],[42,2],[48,23],[41,24],[42,29],[25,33],[24,29],[21,30],[20,26],[13,28],[11,19],[13,18],[12,13]]],["",8,[[111,-76],[119,-83],[126,-75],[118,-68]]],["",4,[[2,-276],[25,-277],[77,-225],[80,-215],[57,-196],[44,-191],[32,-193],[33,-199],[9,-187],[-8,-222],[-54,-261],[-49,-270],[-38,-262],[-38,-258],[-27,-247]]],["A Crate Adventure",14,[[124,-194],[123,-185],[115,-172],[117,-171],[107,-158],[100,-164],[97,-161],[88,-170],[71,-170],[68,-177],[71,-179],[78,-180],[78,-181],[67,-180],[62,-181],[56,-188],[57,-194],[89,-220]]],["",4,[[157,-120],[167,-108],[158,-102],[149,-114]]],["",4,[[170,-57],[170,-60],[179,-59],[178,-56]]],["",10,[[80,20],[70,23],[65,9],[76,6]]],["WaterWorld",10,[[284,54],[288,52],[289,48],[288,45],[289,42],[314,29],[320,54],[308,62],[300,73],[298,84],[301,96],[309,108],[320,113],[335,113],[340,139],[313,139],[290,128],[277,109],[273,99],[271,86],[276,62],[281,55]]],["Canopy Flyer",14,[[210,20],[204,17],[210,6],[215,8],[219,0],[240,10],[232,28],[212,18]]],["Enchanted Airways",10,[[134,-110],[133,-101],[142,-91],[136,-87],[132,-92],[126,-91],[125,-95],[128,-95],[125,-104],[123,-104],[121,-110],[126,-111],[136,-118],[139,-114]]],["Jurassic Park Rapids Adventure",14,[[164,55],[168,58],[166,59],[173,66],[174,64],[179,70],[186,64],[191,68],[193,66],[203,75],[201,77],[205,82],[173,112],[156,93],[167,82],[161,76],[158,79],[145,65],[159,52],[162,54],[163,53]]],["",6,[[228,51],[224,50],[229,34],[233,36]]],["",8,[[-24,50],[-25,52],[-24,53],[-27,57],[-42,47],[-39,42],[-38,43],[-37,41]]],["",8,[[-108,54],[-95,65],[-101,72],[-114,61]]],["Mel's Drive-in",18,[[-12,-129],[-31,-110],[-43,-121],[-25,-141],[-20,-143],[-15,-142],[-12,-139],[-10,-134]]],["",11,[[145,132],[144,116],[152,116],[153,132]]],["Lord Farquaad's Castle",12,[[181,-161],[186,-165],[221,-123],[184,-93],[153,-132],[184,-156]]],["",16,[[162,49],[162,45],[165,40],[168,38],[172,37],[179,38],[183,42],[185,49],[183,55],[181,57],[177,59],[173,60],[170,59],[166,57],[163,53]]],["",7,[[346,46],[340,39],[346,34],[352,40]]],["",6,[[210,-5],[203,9],[194,4],[200,-9]]]];
const USS_PATHS = [[[-161,-38],[-157,-43],[-154,-67],[-148,-85]],[[111,-148],[118,-170],[132,-197]],[[81,-143],[84,-154]],[[62,-136],[41,-144],[26,-144],[14,-139],[-1,-126],[-10,-112],[-15,-96],[-15,-79]],[[-15,-79],[-13,-64],[-8,-53],[-8,-45],[-18,-22]],[[-18,-22],[-30,-12],[-43,-6],[-49,0]],[[-49,0],[-51,10]],[[-51,10],[-43,24],[-31,33],[-14,40],[4,42]],[[4,42],[22,42],[89,31],[127,36],[142,30]],[[142,30],[154,18]],[[154,18],[167,7]],[[167,7],[174,-2]],[[174,-2],[174,-30]],[[174,-30],[174,-37]],[[174,-37],[174,-45]],[[2,-157],[-2,-151],[-1,-143],[6,-140],[13,-141],[17,-147],[16,-154],[10,-158],[2,-157]],[[2,-157],[-6,-169]],[[-6,-169],[-26,-207],[-104,-271]],[[-119,-60],[-58,-130],[-20,-161],[-6,-169]],[[-6,-169],[15,-177],[36,-179],[48,-176],[84,-154]],[[84,-154],[111,-148]],[[111,-148],[132,-133],[140,-124]],[[140,-124],[148,-95],[152,-89],[176,-77]],[[176,-77],[232,-70]],[[232,-70],[235,-69],[241,-55],[257,-56]],[[-74,-111],[-43,-82],[-31,-79],[-15,-79]],[[-49,0],[-119,-60]],[[-119,-60],[-148,-85]],[[-148,-85],[-142,-96],[-142,-106],[-162,-126]],[[-123,59],[-95,23],[-85,16],[-51,10]],[[28,125],[28,96],[26,86],[21,76],[5,58],[4,42]],[[4,42],[8,14],[17,0]],[[17,0],[38,-23]],[[63,35],[57,7]],[[57,7],[54,-6],[51,-9],[45,-10],[17,0]],[[17,0],[-18,-22]],[[57,7],[108,-10]],[[68,-116],[79,-115],[88,-123],[89,-134],[81,-143]],[[81,-143],[70,-143],[62,-136]],[[62,-136],[61,-125],[68,-116]],[[68,-116],[74,-107],[75,-101],[73,-91],[75,-85],[98,-76],[97,-70],[106,-62],[112,-61],[122,-66]],[[122,-66],[126,-65],[134,-71],[132,-74]],[[132,-74],[129,-77],[122,-71],[122,-66]],[[150,-91],[132,-74]],[[174,-56],[176,-77]],[[191,21],[193,50],[195,56],[207,60],[247,61]],[[247,61],[251,61],[254,64],[250,71],[247,70],[244,67],[247,61]],[[247,61],[250,41],[249,32],[191,21]],[[191,21],[167,7]],[[167,7],[156,5],[151,-1],[151,-7]],[[151,-7],[142,-15]],[[197,-22],[210,-31],[220,-32],[226,-37],[229,-43],[232,-70]],[[174,-30],[185,-29],[197,-22]],[[197,-22],[260,15],[268,31],[269,58]],[[269,58],[268,91],[273,109],[287,127],[296,135],[318,143],[322,156]],[[174,-37],[145,-47],[130,-50],[127,-47],[121,-33],[110,-26],[107,-20],[108,-10]],[[108,-10],[118,3],[130,12],[154,18]],[[151,-7],[156,-10],[164,-10],[174,-2]],[[142,138],[142,30]],[[269,58],[277,61]],[[140,-124],[179,-156],[178,-162],[184,-168]],[[135,-70],[139,-65],[137,-52]],[[174,-45],[174,-56]],[[74,-22],[83,-11],[87,0],[103,24],[115,26],[120,22],[118,11],[105,4],[99,-6],[98,-22],[96,-26],[78,-27],[62,-16],[54,-16],[51,-19],[50,-24],[54,-32],[59,-33],[64,-32],[70,-23]]];
const USS_LAGOON = [[-2.7,-117.0],[1.8,-124.1],[7.5,-129.7],[11.4,-128.6],[15.5,-129.2],[19.4,-130.6],[22.1,-133.9],[23.9,-138.3],[35.8,-139.8],[50.2,-136.9],[57.9,-132.1],[56.7,-124.7],[57.3,-121.1],[63.6,-116.1],[70.2,-107.2],[72.9,-100.1],[70.2,-89.7],[72.6,-82.0],[81.2,-78.2],[90.8,-77.0],[94.9,-74.0],[96.1,-61.3],[107.5,-57.1],[110.5,-57.1],[117.3,-59.8],[118.5,-61.0],[122.1,-59.8],[125.4,-60.4],[129.0,-61.8],[130.5,-64.5],[129.9,-66.0],[137.3,-71.9],[148.7,-57.7],[216.7,-51.5],[216.7,-41.4],[166.6,-47.6],[160.6,-43.8],[147.8,-50.3],[132.8,-53.5],[119.1,-51.8],[117.0,-50.6],[116.4,-48.2],[109.0,-46.1],[104.8,-49.1],[100.0,-48.2],[90.5,-41.1],[92.9,-35.2],[92.3,-29.5],[83.6,-30.4],[78.5,-29.8],[71.1,-24.2],[64.5,-33.1],[58.8,-34.6],[55.5,-34.0],[51.4,-30.4],[47.8,-35.2],[46.0,-42.3],[36.1,-40.2],[31.1,-46.4],[20.6,-54.4],[9.9,-55.3],[1.8,-54.1],[-10.7,-63.0],[-11.0,-75.5],[-12.5,-75.8],[-12.8,-82.6],[-5.4,-84.4],[-6.0,-95.1],[-8.9,-95.1],[-9.2,-99.8],[-10.1,-99.8],[-10.1,-103.7],[-8.3,-103.7],[-8.3,-105.7],[-6.3,-105.1]];
const USS_POOL = [[325.4,61.8],[333.1,64.8],[338.5,82.3],[329.9,85.5],[326.3,85.2],[319.1,91.2],[322.1,94.1],[327.8,95.9],[327.5,99.5],[330.5,99.8],[334.0,98.9],[331.4,93.8],[334.3,90.6],[341.8,88.8],[350.2,90.0],[350.2,96.8],[347.5,97.1],[346.6,100.0],[354.0,101.2],[354.3,87.3],[351.4,83.7],[353.4,78.7],[360.9,74.0],[364.8,77.8],[365.1,86.7],[364.5,97.4],[360.3,118.7],[354.3,117.5],[349.6,106.9],[346.6,106.3],[342.1,114.6],[337.3,112.5],[309.0,103.0],[302.4,73.1],[325.7,54.1]];
let R = null, GY = null, CTX = null, M = null, WL = 1.7;   // per build: rng, ground height, ctx, batches, lagoon water level

// ---------- vector helpers ----------
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul3 = (a, k) => [a[0]*k, a[1]*k, a[2]*k];
const dot3 = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2], cross3 = (a, b) => [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
const nz3 = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0]/l, a[1]/l, a[2]/l]; };
const rotA = (U, T, a) => { const B = cross3(T, U), c = Math.cos(a), s = Math.sin(a); return [U[0]*c + B[0]*s, U[1]*c + B[1]*s, U[2]*c + B[2]*s]; };
const HX = new Map();
const hx = c => { if (typeof c !== 'string') return c; let v = HX.get(c); if (!v){ const n = parseInt(c.slice(1), 16); v = [(n >> 16 & 255)/255, (n >> 8 & 255)/255, (n & 255)/255]; HX.set(c, v); } return v; };
const pick = a => a[(R()*a.length) | 0];

// ---------- batches: triangles with a current colour; one helper call per batch at the end ----------
const mkV = spec => { const P = [], C = []; let cr = 1, cg = 1, cb = 1;
  const V = {spec, P, C,
    c(col, j){ if (col === undefined) return V; const v = hx(col), f = j ? 1 + (R() - 0.5)*j : 1; cr = Math.min(1, v[0]*f); cg = Math.min(1, v[1]*f); cb = Math.min(1, v[2]*f); return V; },
    t(a, b, c){ P.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); if (spec.vc) C.push(cr, cg, cb, cr, cg, cb, cr, cg, cb); },
    q(a, b, c, d){ V.t(a, b, c); V.t(a, c, d); }};
  return V; };
const flushV = (g, V) => { if (!V.P.length) return; const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(V.P, 3));
  if (V.spec.vc) geo.setAttribute('color', new THREE.Float32BufferAttribute(V.C, 3)); geo.computeVertexNormals(); lmAdd(g, geo, V.spec, 0, 0, 0); };
const mkMats = () => ({
  v:   mkV({c:'#ffffff', vc:true, ds:true}),                                  // most surfaces, site floodlight
  k:   mkV({c:'#ffffff', vc:true, ds:true, m:0, lc:'#ffe2c4', lk:1.0}),       // the castle: brighter warm floodlight
  red: mkV({c:'#c21c26', ds:true, glow:'#ff2a20', gk:0.42}),                  // Human track (sit-down)
  blu: mkV({c:'#2353c4', ds:true, glow:'#2c78ff', gk:0.48}),                  // Cylon track (inverted)
  gl:  mkV({c:'#e6eef1', ds:true, op:0.32, glow:'#fff0d6', gk:0.16}),          // translucent street roofs
  win: mkV({c:'#56616d', ds:true, glow:'#ffcd88', gk:0.8}),                   // windows: dark by day, lit at night
  nP:  mkV({c:'#ff78b8', ds:true, glow:'#ff3a98', gk:1.5}),                   // neon pink
  nB:  mkV({c:'#86d8ff', ds:true, glow:'#2fb2ff', gk:1.5}),                   // neon blue (sci-fi strips)
  nY:  mkV({c:'#ffe28c', ds:true, glow:'#ffc845', gk:1.4}),                   // bulbs, lamp heads, lanterns
  nR:  mkV({c:'#ff6a5a', ds:true, glow:'#ff3a22', gk:1.4}),                   // red neon, beacons
  nO:  mkV({c:'#ffad66', ds:true, glow:'#ff6a10', gk:1.7}),                   // torches, the volcano's glow
  wat: mkV({c:'#8fb5ca', ds:true, glow:'#7fc4ff', gk:0.1}),                   // modelled water (flumes)
  foam:mkV({c:'#eef6f8', ds:true, glow:'#bfe6ff', gk:0.35}),                  // waterfalls, splash
});

// ---------- primitives (all write into a batch V) ----------
const boxV = (V, w, h, d, x, y, z, ry) => { const c = Math.cos(ry || 0), s = Math.sin(ry || 0), a = w/2, b = d/2;
  const P = (u, yy, v) => [x + u*c + v*s, yy, z - u*s + v*c];
  const p0 = P(-a, y, -b), p1 = P(a, y, -b), p2 = P(a, y, b), p3 = P(-a, y, b), p4 = P(-a, y + h, -b), p5 = P(a, y + h, -b), p6 = P(a, y + h, b), p7 = P(-a, y + h, b);
  V.q(p4, p5, p6, p7); V.q(p0, p1, p5, p4); V.q(p1, p2, p6, p5); V.q(p2, p3, p7, p6); V.q(p3, p0, p4, p7); };
// oriented box: centre c, unit axes ex, ey, ez, sizes along them
const obox = (V, c, ex, ey, ez, L, Hh, Wd) => { const P = (a, b, d) => [c[0] + ex[0]*a + ey[0]*b + ez[0]*d, c[1] + ex[1]*a + ey[1]*b + ez[1]*d, c[2] + ex[2]*a + ey[2]*b + ez[2]*d], a = L/2, b = Hh/2, d = Wd/2;
  const p = [P(-a, -b, -d), P(a, -b, -d), P(a, -b, d), P(-a, -b, d), P(-a, b, -d), P(a, b, -d), P(a, b, d), P(-a, b, d)];
  V.q(p[4], p[5], p[6], p[7]); V.q(p[0], p[3], p[2], p[1]); V.q(p[0], p[1], p[5], p[4]); V.q(p[1], p[2], p[6], p[5]); V.q(p[2], p[3], p[7], p[6]); V.q(p[3], p[0], p[4], p[7]); };
// eight corners (bottom four, top four, same order) -> six faces
const hexV = (V, P) => { for (const [a, b, c, d] of [[0, 1, 2, 3], [4, 7, 6, 5], [0, 4, 5, 1], [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 4, 0]]) V.q(P[a], P[b], P[c], P[d]); };
const capV = (V, poly, y) => { const tr = THREE.ShapeUtils.triangulateShape(poly.map(p => new THREE.Vector2(p[0], p[1])), []);
  for (const f of tr){ const a = poly[f[0]], b = poly[f[1]], c = poly[f[2]]; V.t([a[0], y, a[1]], [b[0], y, b[1]], [c[0], y, c[1]]); } };
const prism = (V, poly, y0, y1, noTop) => { const n = poly.length;
  for (let i = 0; i < n; i++){ const a = poly[i], b = poly[(i + 1) % n]; V.q([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); }
  if (!noTop) capV(V, poly, y1); };
const lathe = (V, prof, x, y, z, n, a0) => { a0 = a0 || 0; const ring = []; for (let i = 0; i <= n; i++){ const a = a0 + i/n*TAU; ring.push([Math.cos(a), Math.sin(a)]); }
  for (let k = 0; k < prof.length - 1; k++){ const r0 = prof[k][0], h0 = prof[k][1], r1 = prof[k + 1][0], h1 = prof[k + 1][1];
    for (let i = 0; i < n; i++){ const c0 = ring[i], c1 = ring[i + 1];
      const A = [x + c0[0]*r0, y + h0, z + c0[1]*r0], B = [x + c1[0]*r0, y + h0, z + c1[1]*r0], C = [x + c1[0]*r1, y + h1, z + c1[1]*r1], D = [x + c0[0]*r1, y + h1, z + c0[1]*r1];
      if (r1 < 1e-4) V.t(A, B, C); else if (r0 < 1e-4) V.t(A, C, D); else V.q(A, B, C, D); } } };
const cyl = (V, rb, rt, h, x, y, z, n, top) => lathe(V, top ? [[rb, 0], [rt, h], [0, h]] : [[rb, 0], [rt, h]], x, y, z, n || 12);
const cone = (V, r, h, x, y, z, n) => lathe(V, [[r, 0], [0, h]], x, y, z, n || 12);
const sph = (V, r, x, y, z, n, sy) => { const m = Math.max(3, n >> 1), P = []; for (let i = 0; i <= m; i++){ const a = -HP + PI*i/m; P.push([i === 0 || i === m ? 0 : Math.cos(a)*r, Math.sin(a)*r*(sy || 1)]); } lathe(V, P, x, y, z, n); };
const seg = (V, a, b, r, n) => { n = n || 4; const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2], L = Math.hypot(dx, dy, dz); if (L < 1e-4) return;
  const d = [dx/L, dy/L, dz/L], up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let ux = d[1]*up[2]-d[2]*up[1], uy = d[2]*up[0]-d[0]*up[2], uz = d[0]*up[1]-d[1]*up[0]; const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
  const vx = d[1]*uz-d[2]*uy, vy = d[2]*ux-d[0]*uz, vz = d[0]*uy-d[1]*ux, A = [], B = [];
  for (let i = 0; i < n; i++){ const t = (i + 0.5)/n*TAU, c = Math.cos(t)*r, s = Math.sin(t)*r; A.push([a[0]+ux*c+vx*s, a[1]+uy*c+vy*s, a[2]+uz*c+vz*s]); B.push([b[0]+ux*c+vx*s, b[1]+uy*c+vy*s, b[2]+uz*c+vz*s]); }
  for (let i = 0; i < n; i++){ const j = (i + 1) % n; V.q(A[i], A[j], B[j], B[i]); } };
const polyLineV = (V, pts, r, n) => { for (let i = 0; i < pts.length - 1; i++) seg(V, pts[i], pts[i + 1], r, n); };
// lumpy rock (deformed icosahedron)
const ICO = (() => { const t = (1 + Math.sqrt(5))/2, v = [[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].map(p => { const l = Math.hypot(p[0], p[1], p[2]); return [p[0]/l, p[1]/l, p[2]/l]; });
  return {v, f:[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]]}; })();
const rock = (V, x, y, z, sx, sy, sz) => { const k = ICO.v.map(p => { const f = 0.72 + R()*0.56; return [x + p[0]*sx*f, y + p[1]*sy*f, z + p[2]*sz*f]; }); for (const f of ICO.f) V.t(k[f[0]], k[f[1]], k[f[2]]); };
// roofs (L along local x before turning by ry, rotP convention)
const hipV = (V, cx, cz, L, W, y, h, ry, over, gab) => { const Rp = rotP(cx, cz, ry), hl = L/2 + (over || 0), hw = W/2 + (over || 0), k = gab ? hl : Math.max(0, hl - hw);
  const A = Rp(-hl, y, -hw), B = Rp(hl, y, -hw), C = Rp(hl, y, hw), D = Rp(-hl, y, hw), r1 = Rp(-k, y + h, 0), r2 = Rp(k, y + h, 0);
  V.q(A, B, r2, r1); V.q(C, D, r1, r2); V.t(D, A, r1); V.t(B, C, r2); };
const polyRoof = (V, P, y, h, over) => { const c = cen(P), Q = over ? offsetPoly(P, over) : P, ap = [c[0], y + h, c[1]];
  for (let i = 0; i < Q.length; i++){ const a = Q[i], b = Q[(i + 1) % Q.length]; V.t([a[0], y, a[1]], [b[0], y, b[1]], ap); } };

// ---------- plan polygon helpers ----------
const sarea = P => { let a = 0; for (let i = 0; i < P.length; i++){ const p = P[i], q = P[(i + 1) % P.length]; a += p[0]*q[1] - q[0]*p[1]; } return a/2; };
const cen = P => { let a = 0, x = 0, z = 0; for (let i = 0; i < P.length; i++){ const p = P[i], q = P[(i + 1) % P.length], w = p[0]*q[1] - q[0]*p[1]; a += w; x += (p[0] + q[0])*w; z += (p[1] + q[1])*w; }
  if (Math.abs(a) < 1e-6){ let sx = 0, sz = 0; for (const p of P){ sx += p[0]; sz += p[1]; } return [sx/P.length, sz/P.length]; } return [x/(3*a), z/(3*a)]; };
const inPoly = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0])*(z - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; };
const nrm2 = (a, b, s) => { const ex = b[0] - a[0], ez = b[1] - a[1], l = Math.hypot(ex, ez) || 1; return s > 0 ? [ez/l, -ex/l] : [-ez/l, ex/l]; };   // outward normal
const offsetPoly = (P, d) => { const s = sarea(P) > 0 ? 1 : -1, n = P.length, out = [];
  for (let i = 0; i < n; i++){ const a = P[(i - 1 + n) % n], b = P[i], c = P[(i + 1) % n], n1 = nrm2(a, b, s), n2 = nrm2(b, c, s);
    let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml; const k = 1/Math.max(0.4, mx*n1[0] + mz*n1[1]);
    out.push([b[0] + mx*d*k, b[1] + mz*d*k]); } return out; };
const distSeg2 = (x, z, a, b) => { const ex = b[0] - a[0], ez = b[1] - a[1], L2 = ex*ex + ez*ez || 1, t = clamp(((x - a[0])*ex + (z - a[1])*ez)/L2, 0, 1); return Math.hypot(x - a[0] - ex*t, z - a[1] - ez*t); };
const obb = P => { const c = cen(P); let sxx = 0, szz = 0, sxz = 0; for (const p of P){ const dx = p[0] - c[0], dz = p[1] - c[1]; sxx += dx*dx; szz += dz*dz; sxz += dx*dz; }
  const th = 0.5*Math.atan2(2*sxz, sxx - szz), ux = Math.cos(th), uz = Math.sin(th); let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9;
  for (const p of P){ const dx = p[0] - c[0], dz = p[1] - c[1], a = dx*ux + dz*uz, b = -dx*uz + dz*ux; a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, b); b1 = Math.max(b1, b); }
  const am = (a0 + a1)/2, bm = (b0 + b1)/2; return {cx:c[0] + ux*am - uz*bm, cz:c[1] + uz*am + ux*bm, L:a1 - a0, W:b1 - b0, ry:-th}; };
const resample = (pl, n) => { const d = [0]; for (let i = 1; i < pl.length; i++) d.push(d[i - 1] + Math.hypot(pl[i][0] - pl[i - 1][0], pl[i][1] - pl[i - 1][1]));
  const out = []; for (let k = 0; k < n; k++){ const t = d[d.length - 1]*k/(n - 1); let i = 1; while (i < d.length - 1 && d[i] < t) i++; const u = (t - d[i - 1])/((d[i] - d[i - 1]) || 1); out.push([lerp(pl[i - 1][0], pl[i][0], u), lerp(pl[i - 1][1], pl[i][1], u)]); } return out; };
const gLo = P => { let lo = 1e9, hi = -1e9; for (const p of P){ const h = GY(p[0], p[1]); lo = Math.min(lo, h); hi = Math.max(hi, h); } const c = cen(P), hc = GY(c[0], c[1]); return [Math.min(lo, hc), Math.max(hi, hc)]; };
// base level of a structure on a slope: part of it sinks into the hill, the low side gets a plinth
const baseOf = (P, k) => { const [lo, hi] = gLo(P); return [lo, lo + (hi - lo)*(k === undefined ? 0.35 : k), hi]; };
// a straight front a->b whose outward side faces `toward`: P(u, y, w) = point u along, w out
const front = (a, b, toward) => { const ex = b[0] - a[0], ez = b[1] - a[1], L = Math.hypot(ex, ez), dx = ex/L, dz = ez/L; let nx = -dz, nz = dx;
  if ((toward[0] - a[0])*nx + (toward[1] - a[1])*nz < 0){ nx = -nx; nz = -nz; }
  return {L, dx, dz, nx, nz, ry:Math.atan2(-dz, dx), P:(u, y, w) => [a[0] + dx*u + nx*w, y, a[1] + dz*u + nz*w]}; };
const fbox = (V, F, u, y, w, wd, ht, dp) => { const p = F.P(u, 0, w); boxV(V, wd, ht, dp, p[0], y, p[2], F.ry); };            // box centred u along, w out
const fquad = (V, F, u0, u1, y0, y1, w) => V.q(F.P(u0, y0, w), F.P(u1, y0, w), F.P(u1, y1, w), F.P(u0, y1, w));

// ---------- zones ----------
const ZP = {
  HW:[[-114,-266],[-98,-284],[-78,-292],[-40,-286],[28,-286],[86,-230],[60,-190],[20,-160],[-10,-150],[-50,-145],[-120,-172],[-106,-214],[-100,-232],[-104,-250]],
  NY:[[-120,-172],[-50,-145],[-10,-150],[-12,-60],[-30,-25],[-60,-10],[-100,-25],[-160,-36],[-182,-80],[-180,-104],[-160,-128]],
  MG:[[-10,-150],[20,-160],[60,-190],[86,-230],[140,-218],[150,-182],[128,-140],[100,-112],[74,-104],[60,-135],[20,-140]],
  FF:[[150,-182],[172,-202],[198,-172],[232,-130],[254,-98],[268,-80],[300,-74],[306,-40],[220,-36],[150,-48],[137,-72],[100,-112],[128,-140]],
  EG:[[50,-20],[96,-30],[112,-20],[145,-10],[145,60],[141,128],[40,127],[42,60],[50,30]],
  SF:[[-160,-36],[-100,-25],[-60,-10],[-30,-25],[-12,-60],[10,-50],[42,-36],[50,-20],[50,30],[42,60],[40,127],[-16,126],[-50,114],[-100,82],[-150,48],[-198,8],[-178,-12]],
};
const zoneAt = (x, z) => { for (const k of ['HW', 'NY', 'MG', 'FF', 'EG', 'SF']) if (inPoly(ZP[k], x, z)) return k; return 'LW'; };
const PAL = {
  HW:{w:['#e2cfb4', '#dfbcaf', '#c9d8c4', '#e8d4a2', '#c6d1dc', '#e8c6b4', '#d8c6e0'], r:'#97918a'},
  NY:{w:['#9e5b47', '#8c4e3d', '#ae7858', '#806b5e', '#a88e72', '#b9a489'], r:'#69635d'},
  SF:{w:['#c9d0d8', '#b6bfc9', '#d8dde2', '#a9b5c1'], r:'#7f8993'},
  EG:{w:['#d2b98d', '#c7aa7c', '#dbc49a'], r:'#b39a70'},
  LW:{w:['#8b6f53', '#7c6c56', '#a08a6a', '#6f6a58'], r:'#55703f'},
  FF:{w:['#efe3cc', '#eadac2', '#f2e8d6', '#ecdcd2'], r:'#8d4b3a'},
  MG:{w:['#ba9d6d', '#aa8d5d', '#c4a979'], r:'#b39a5f'},
};

// ---------- occupancy mask (2 m cells): 1 building, 2 water, 3 path, 4 low track / ride ----------
const MK = {x0:-216, z0:-300, c:2, n:316, m:266, a:null};
const mIdx = (x, z) => { const i = Math.floor((x - MK.x0)/MK.c), j = Math.floor((z - MK.z0)/MK.c); return i < 0 || j < 0 || i >= MK.n || j >= MK.m ? -1 : j*MK.n + i; };
const mGet = (x, z) => { const k = mIdx(x, z); return k < 0 ? 0 : MK.a[k]; };
const mPoly = (P, v) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of P){ x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
  for (let z = z0 - z0 % MK.c - MK.c; z <= z1 + MK.c; z += MK.c) for (let x = x0 - x0 % MK.c - MK.c; x <= x1 + MK.c; x += MK.c){ const cx = x + MK.c/2, cz = z + MK.c/2; if (inPoly(P, cx, cz)){ const k = mIdx(cx, cz); if (k >= 0 && !MK.a[k]) MK.a[k] = v; } } };
const mLine = (pts, r, v) => { for (let s = 0; s < pts.length - 1; s++){ const a = pts[s], b = pts[s + 1];
  for (let z = Math.min(a[1], b[1]) - r; z <= Math.max(a[1], b[1]) + r; z += MK.c) for (let x = Math.min(a[0], b[0]) - r; x <= Math.max(a[0], b[0]) + r; x += MK.c)
    if (distSeg2(x, z, a, b) <= r){ const k = mIdx(x, z); if (k >= 0 && !MK.a[k]) MK.a[k] = v; } } };
const mDisc = (x, z, r, v) => mLine([[x, z], [x + 0.01, z]], r, v);

// footprints by approximate centroid (the unnamed ones), marked as done once modelled
let BLD = null;
const findB = (x, z, name) => { let best = null, bd = 1e9; for (const b of BLD){ if (name && b.name !== name) continue; const d = Math.hypot(b.c[0] - x, b.c[1] - z); if (d < bd){ bd = d; best = b; } } if (!best || (!name && bd > 10)) return null; return best; };
const takeB = (x, z, name) => { const b = findB(x, z, name); if (b) b.done = true; return b; };

// rooftop plant: a few boxes on a flat roof
const roofUnits = (V, P, y, n) => { const ob = obb(P), Rp = rotP(ob.cx, ob.cz, ob.ry); for (let k = 0; k < n; k++){ const u = (R() - 0.5)*ob.L*0.7, v = (R() - 0.5)*ob.W*0.7, p = Rp(u, 0, v); if (!inPoly(P, p[0], p[2])) continue;
  V.c(pick(['#a9aba8', '#9a9c99', '#b7b6b0']), 0.05); boxV(V, 2 + R()*3, 1.2 + R()*1.6, 2 + R()*3, p[0], y, p[2], ob.ry); } };
// open shed: slab roof on posts round the outline (covered queues and walkways)
const shed = (b, col, h) => { if (!b) return; b.done = true; const P = b.ring, [lo] = gLo(P), V = M.v, n = P.length; V.c(col || '#e7e5df'); prism(V, P, lo + (h || 4.4), lo + (h || 4.4) + 0.45); V.c('#8d9298');
  for (let i = 0; i < n; i++){ const a = P[i], c = P[(i + 1) % n], L = Math.hypot(c[0] - a[0], c[1] - a[1]); for (let d = 0; d < L; d += 6){ const x = lerp(a[0], c[0], d/L), z = lerp(a[1], c[1], d/L); seg(V, [x, GY(x, z) - 0.3, z], [x, lo + (h || 4.4), z], 0.14, 4); } } };
// ---------- generic themed building on a footprint ----------
const building = (V, P, zk, hgt, opt) => {
  opt = opt || {}; const pal = PAL[zk] || PAL.SF, [lo, yb] = baseOf(P), top = yb + hgt, wc = opt.wall || pick(pal.w);
  V.c(wc, 0.07); prism(V, P, lo - 1.5, top, true);
  const pitched = opt.pitch !== undefined ? opt.pitch : (zk === 'LW' || zk === 'FF' || zk === 'MG');
  if (pitched){
    const ob = obb(P), rect = P.length <= 6 && Math.abs(sarea(P)) > 0.78*ob.L*ob.W, rc = opt.roof || pal.r;
    V.c(rc, 0.08); capV(V, P, top);
    const rh = Math.min(ob.W, ob.L)*(zk === 'FF' ? 0.7 : zk === 'MG' ? 0.55 : 0.4);
    if (rect) hipV(V, ob.cx, ob.cz, ob.L, ob.W, top, Math.min(rh, 8), ob.ry, 0.9, zk === 'FF' && ob.L > ob.W*1.3);
    else if (Math.abs(sarea(P)) < 260) polyRoof(V, P, top, Math.min(rh*0.7, 6), 0.9);
    else { V.c(opt.wall ? opt.wall : wc); prism(V, offsetPoly(P, 0.3), top - 0.2, top + 1.0, true); V.c(rc, 0.08); capV(V, P, top + 0.4); hipV(V, ob.cx, ob.cz, ob.L*0.62, ob.W*0.62, top + 0.4, Math.min(ob.W*0.32, 6.5), ob.ry, 0, zk === 'FF'); }
  } else {
    V.c(opt.roof || pal.r, 0.05); capV(V, P, top - 0.7);
    if (zk === 'NY' || zk === 'EG'){ V.c(zk === 'NY' ? '#c9bfae' : '#bfa679'); prism(V, offsetPoly(P, 0.45), top - 1.3, top - 0.5, true); }
    if (zk === 'SF'){ prism(M.nB, offsetPoly(P, 0.08), top - 2.0, top - 1.6, true); prism(M.win, offsetPoly(P, 0.06), yb + 2.4, yb + 4.2, true); V.c('#e9edf1'); prism(V, offsetPoly(P, 0.12), top - 1.6, top - 0.2, true);
      for (const p of P){ boxV(V, 0.7, top + 1.2 - (lo - 1), 0.7, p[0], lo - 1, p[1]); }
      if (Math.abs(sarea(P)) > 120){ const c = cen(P); V.c('#cfd6dd'); cyl(V, 0.25, 0.15, 6, c[0], top - 0.7, c[1], 6); cyl(V, 2.2, 2.2, 0.3, c[0], top + 3.2, c[1], 12, true); sph(M.nR, 0.3, c[0], top + 5.4, c[1], 6); } }
    if (zk === 'HW'){ V.c('#f4efe6'); prism(V, offsetPoly(P, 0.25), top - 1.0, top - 0.4, true); }
    if (Math.abs(sarea(P)) > 350) roofUnits(V, P, top - 0.7, Math.min(8, Math.abs(sarea(P))/250 | 0));
  }
  // windows
  const s = sarea(P) > 0 ? 1 : -1, rows = zk === 'SF' ? 0 : zk === 'LW' || zk === 'MG' || zk === 'FF' ? 1 : Math.max(1, Math.min(4, Math.floor((hgt - 2)/3.6)));
  if (!opt.noWin) for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 5) continue;
    const n = nrm2(a, b, s), F = {P:(u, y, w) => [a[0] + (b[0] - a[0])*u/L + n[0]*w, y, a[1] + (b[1] - a[1])*u/L + n[1]*w]}, k = Math.floor((L - 2)/3.2);
    for (let r = 0; r < rows; r++){ const y = yb + 1.7 + r*3.6; for (let j = 0; j < k; j++){ if (R() < 0.15) continue; const u = (L - (k - 1)*3.2)/2 + j*3.2; fquad(M.win, F, u - 0.65, u + 0.65, y, y + (zk === 'FF' ? 1.5 : 1.9), 0.07); } } }
  return {lo, yb, top};
};

// ---------- the lagoon: coping, rocks on the wild shores, railings on the town shores ----------
const lagoon = () => {
  const L = USS_LAGOON, n = L.length, O = offsetPoly(L, 1.3), V = M.v;
  const top = L.map(p => Math.max(GY(p[0], p[1]), WL + 0.25) + 0.5);
  for (let i = 0; i < n; i++){ const j = (i + 1) % n, a = L[i], b = L[j], oa = O[i], ob = O[j], m = [(a[0] + b[0])/2, (a[1] + b[1])/2];
    const wild = m[0] > 52 || m[1] < -118, len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    V.c(wild ? '#8d806b' : '#d2c9b6', 0.05);
    V.q([a[0], WL - 1.2, a[1]], [b[0], WL - 1.2, b[1]], [b[0], top[j], b[1]], [a[0], top[i], a[1]]);
    V.q([a[0], top[i], a[1]], [b[0], top[j], b[1]], [ob[0], top[j], ob[1]], [oa[0], top[i], oa[1]]);
    V.q([oa[0], top[i], oa[1]], [ob[0], top[j], ob[1]], [ob[0], GY(ob[0], ob[1]) - 0.6, ob[1]], [oa[0], GY(oa[0], oa[1]) - 0.6, oa[1]]);
    if (wild){ M.v.c('#7d725f', 0.25); for (let d = 0; d < len; d += 4.5){ const t = d/len, x = lerp(a[0], b[0], t), z = lerp(a[1], b[1], t), s = 0.9 + R()*1.4; rock(M.v, x + (R() - 0.5)*2, WL - 0.2, z + (R() - 0.5)*2, s*1.3, s*0.75, s*1.2); } }
    else { M.v.c('#3a3e43'); const ys = top[i], ye = top[j];
      for (let d = 0; d < len; d += 2.6){ const t = d/len, x = lerp(a[0], b[0], t), z = lerp(a[1], b[1], t); boxV(M.v, 0.12, 1.1, 0.12, x, lerp(ys, ye, t), z); }
      seg(M.v, [a[0], ys + 1.1, a[1]], [b[0], ye + 1.1, b[1]], 0.05, 3); seg(M.v, [a[0], ys + 0.55, a[1]], [b[0], ye + 0.55, b[1]], 0.03, 3); }
  }
};

// ---------- translucent street roof on arches between two eave lines ----------
const canopy = (Wl, El, n, hs, hc, lampEvery) => {
  const A = resample(Wl, n), B = resample(El, n), rows = [], K = 8;
  for (let i = 0; i < n; i++){ const a = A[i], b = B[i], g = (GY(a[0], a[1]) + GY(b[0], b[1]))/2 + 0.3*Math.abs(GY(a[0], a[1]) - GY(b[0], b[1])); const r = [];
    for (let k = 0; k <= K; k++){ const s = k/K; r.push([lerp(a[0], b[0], s), g + hs + (hc - hs)*Math.sin(PI*s), lerp(a[1], b[1], s)]); } rows.push(r); }
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < K; k++) M.gl.q(rows[i][k], rows[i][k + 1], rows[i + 1][k + 1], rows[i + 1][k]);
  M.v.c('#eceef0');
  rows.forEach((r, i) => { for (let k = 0; k < K; k++){ seg(M.v, r[k], r[k + 1], 0.22, 4); if (i % 2 === 0) seg(M.v, [r[k][0], r[k][1] - 1.1, r[k][2]], [r[k + 1][0], r[k + 1][1] - 1.1, r[k + 1][2]], 0.12, 3); }
    for (const k of [0, K]){ const p = r[k], g = GY(p[0], p[2]); if (i % 2 === 0) seg(M.v, [p[0], g - 0.5, p[2]], p, 0.24, 6); }
    if (lampEvery && i % lampEvery === 1) CTX.lamp(r[K >> 1][0], r[K >> 1][1] - 1.6, r[K >> 1][2], [255, 226, 180]); });
  for (const k of [0, K >> 1, K]) for (let i = 0; i < n - 1; i++) seg(M.v, rows[i][k], rows[i + 1][k], 0.14, 3);
};

// ---------- Hollywood: Art Deco boulevard under a translucent roof, the theatre, the diner, the gates ----------
const HW_PAL = ['#efe2c8', '#f0cfc2', '#d8e6d6', '#f3e3a8', '#d2dfe9', '#f4d2b8', '#e6d4ec', '#fbf3e4'];
const decoBay = (F, u, w, g0, H, kind) => {
  const V = M.v, col = pick(HW_PAL), trim = pick(['#c99f58', '#5f8f8a', '#b8665a', '#7d8db0', '#e9e6df']);
  V.c(col, 0.04); fbox(V, F, u + w/2, g0 - 1.2, 1.0, w - 0.15, H + 1.2, 2.0);
  if (kind % 3 === 0){ fbox(V, F, u + w/2, g0 + H, 1.0, w*0.56, 1.7, 1.8); fbox(V, F, u + w/2, g0 + H + 1.7, 1.0, w*0.28, 1.5, 1.6); }
  else if (kind % 3 === 1){ V.c(trim); for (const f of [-1.2, 0, 1.2]) fbox(V, F, u + w/2 + f, g0 + 4.6, 2.2, 0.42, H - 2.4 + (f ? 1.6 : 3.2), 0.5); }
  else { V.c(col); fbox(V, F, u + w/2, g0 + H, 1.0, w - 1.2, 0.9, 1.9); V.c(trim); fbox(V, F, u + w/2, g0 + H + 0.9, 1.0, w - 2.6, 0.5, 1.7); }
  V.c(trim); fbox(V, F, u + w/2, g0 + 4.2, 1.3, w - 0.1, 0.6, 2.6);                  // band over the shopfronts
  V.c('#f6f1e6'); for (const e of [0.45, w - 0.45]) fbox(V, F, u + e, g0 + 4.8, 1.15, 0.7, H - 4.2, 2.3); fbox(V, F, u + w/2, g0 + H - 0.9, 1.1, w - 0.3, 0.35, 2.3);
  fquad(M.win, F, u + 0.7, u + w - 0.7, g0 + 0.5, g0 + 3.7, 2.03);                    // shop glazing
  const nc = Math.max(2, Math.floor(w/2.6)); for (let r = 0; r < 2; r++){ const y = g0 + 5.6 + r*3.4; if (y > g0 + H - 2) break;
    for (let j = 0; j < nc; j++){ const c = u + w*(j + 0.5)/nc; fquad(M.win, F, c - 0.55, c + 0.55, y, y + 1.9, 2.03); } }
  if (kind % 2 === 0){ const cs = pick([['#c8423a', '#f3efe6'], ['#2f7f7a', '#f3efe6'], ['#2d4d8a', '#f1e7c8'], ['#d9a02a', '#7a3b2e']]);   // striped awning
    const k = Math.max(3, Math.round(w/1.4)); for (let i = 0; i < k; i++){ V.c(cs[i % 2]); const u0 = u + 0.5 + (w - 1)*i/k, u1 = u + 0.5 + (w - 1)*(i + 1)/k;
      V.q(F.P(u0, g0 + 4.0, 2.05), F.P(u1, g0 + 4.0, 2.05), F.P(u1, g0 + 3.3, 3.7), F.P(u0, g0 + 3.3, 3.7)); } }
  else fbox(M.nY, F, u + w/2, g0 + 4.0, 2.65, w - 1.0, 0.16, 0.16);                // bulb strip under the band
  if (kind % 4 === 1){ const N = [M.nP, M.nB, M.nR][kind % 3], p = F.P(u + 0.9, 0, 3.4), q = F.P(u + 0.9, 0, 4.7);   // blade sign with a neon edge, no lettering
    V.c(pick(['#2a3550', '#7a1f2a', '#f2ede2'])); boxV(V, 0.3, 6.2, 2.6, p[0], g0 + 5.2, p[2], F.ry + HP); boxV(N, 0.4, 6.4, 0.16, q[0], g0 + 5.1, q[2], F.ry + HP); }
};
const hollywood = () => {
  const V = M.v;
  // the two blocks behind the facades
  const bw = takeB(-74, -196), be = takeB(10, -232);
  for (const b of [bw, be]) if (b){ const [lo, yb] = baseOf(b.ring, 0.2); V.c('#cdbba6', 0.03); prism(V, b.ring, lo - 1.5, yb + 11.5, true); V.c('#8f8a83'); capV(V, b.ring, yb + 11); roofUnits(V, b.ring, yb + 11, 9); }
  // facade runs facing the boulevard
  const mid = [-40, -218];
  const runs = [[[-79, -232], [-38, -196]], [[-54, -261], [-8, -222]], [[-8, -222], [9, -187]], [[-101, -244], [-82, -229]]];
  let kind = 0;
  for (const [a, b] of runs){ const F = front(a, b, mid); let u = 0; while (u < F.L - 4){ let w = 9 + R()*6; if (F.L - u - w < 6) w = F.L - u; const p0 = F.P(u, 0, 0), p1 = F.P(u + w, 0, 0), g0 = Math.min(GY(p0[0], p0[2]), GY(p1[0], p1[2]));
    decoBay(F, u, w, g0, 10.5 + R()*4.5, kind++); u += w; } }
  // the theatre at the far end of the boulevard (Art Deco tower, marquee)
  { const F = front([-38, -196], [-24, -168], mid), u = F.L/2, p = F.P(u, 0, 0), g0 = GY(p[0], p[2]) - 0.3, cream = '#f1e6cf', gold = '#c9a35a', teal = '#2f5f66';
    V.c(cream); fbox(V, F, u, g0 - 1, 1.2, F.L, 19, 2.6); V.c(gold); fbox(V, F, u, g0 + 18, 1.2, F.L - 4, 1.2, 2.4);
    V.c(cream); fbox(V, F, u, g0, 2.0, 9, 27, 4); fbox(V, F, u, g0 + 27, 2.0, 7, 2.2, 3.6); fbox(V, F, u, g0 + 29.2, 2.0, 4.6, 2, 3.2); fbox(V, F, u, g0 + 31.2, 2.0, 2.2, 2.6, 2.6);
    V.c(teal); for (const f of [-3, -1.5, 0, 1.5, 3]) fbox(V, F, u + f, g0 + 8, 4.1, 0.5, 21 - Math.abs(f)*1.4, 0.5);
    V.c(gold); fbox(V, F, u, g0 + 6.0, 5.2, 17, 2.3, 5.6); fbox(M.nY, F, u, g0 + 5.85, 8.05, 17.2, 0.2, 0.2); fbox(M.nP, F, u, g0 + 8.3, 8.05, 17.2, 0.18, 0.18);
    for (const s of [-1, 1]) fbox(M.nY, F, u + s*8.6, g0 + 6.0, 5.2, 0.2, 2.3, 5.8);
    fquad(M.win, F, u - 7, u + 7, g0 + 0.3, g0 + 5.6, 2.62); fbox(M.nB, F, u, g0 + 33.6, 2.0, 0.5, 0.8, 0.5); CTX.lamp(p[0], g0 + 34, p[2], [150, 210, 255]); }
  // the translucent roof over the boulevard (its footprint is the roof, not a building)
  takeB(-40, -215);
  canopy([[-101, -244], [-80, -230], [-38, -196], [-20, -158]], [[-70, -280], [-52, -262], [-8, -222], [13, -172]], 17, 14.5, 20.5, 2);
  // turnstile canopies and the entrance gateway (plain arch, no lettering)
  for (const b of [takeB(-90, -263), takeB(-100, -267)]) if (b){ const g = gLo(b.ring)[0]; V.c('#f2f2ee'); prism(V, b.ring, g + 4.6, g + 5.2); V.c('#9aa1a8'); for (const p of b.ring) seg(V, [p[0], g - 0.3, p[1]], [p[0], g + 4.6, p[1]], 0.18, 5); }
  { const a = [-104, -246], b = [-72, -282], g = Math.min(GY(a[0], a[1]), GY(b[0], b[1])), P = [];
    for (const p of [a, b]){ V.c('#2e4a6e'); boxV(V, 3.2, 13, 3.2, p[0], g - 0.5, p[1], Math.atan2(-(b[1] - a[1]), b[0] - a[0])); V.c('#dfe3e8'); boxV(V, 3.8, 1.2, 3.8, p[0], g + 12.5, p[1], Math.atan2(-(b[1] - a[1]), b[0] - a[0])); }
    for (let k = 0; k <= 16; k++){ const t = k/16; P.push([lerp(a[0], b[0], t), g + 13.2 + 4.5*Math.sin(PI*t), lerp(a[1], b[1], t)]); }
    V.c('#2e4a6e'); polyLineV(V, P, 0.9, 6); polyLineV(M.nB, P.map(p => [p[0], p[1] - 1.05, p[2]]), 0.12, 4); }
  // the 1950s drive-in diner by the lagoon: white and turquoise, chrome bands, a tall finned sign pylon
  const md = takeB(0, 0, "Mel's Drive-in");
  if (md){ const P = md.ring, [lo] = gLo(P), y0 = lo;
    V.c('#f2f0ea'); prism(V, P, y0 - 1, y0 + 5.4, true); V.c('#3fb3ab'); prism(V, offsetPoly(P, 0.05), y0 + 4.2, y0 + 5.4, true);
    V.c('#c9cfd4'); prism(V, offsetPoly(P, 0.07), y0 + 0.9, y0 + 1.2, true); V.c('#c8352d'); const O = offsetPoly(P, 1.6); prism(V, O, y0 + 5.2, y0 + 5.9, true); V.c('#e9e6df'); capV(V, O, y0 + 5.9); capV(V, O, y0 + 5.2);
    prism(M.win, offsetPoly(P, 0.04), y0 + 1.4, y0 + 3.9, true); prism(M.nP, offsetPoly(P, 1.65), y0 + 5.42, y0 + 5.6, true);
    const c = [-12, -137], gg = GY(c[0], c[1]); V.c('#c8352d'); boxV(V, 1.1, 15, 3.6, c[0], gg, c[1], 0.8); V.c('#f2f0ea'); boxV(V, 1.2, 4, 3.0, c[0], gg + 9, c[1], 0.8);
    boxV(M.nR, 1.3, 0.25, 3.8, c[0], gg + 15, c[1], 0.8); boxV(M.nB, 1.3, 0.2, 3.2, c[0], gg + 8.8, c[1], 0.8); boxV(M.nY, 1.3, 0.2, 3.2, c[0], gg + 13.1, c[1], 0.8); CTX.lamp(c[0], gg + 15.5, c[1], [255, 110, 110]); }
  const sign = takeB(-36, -136); if (sign){ const [lo] = gLo(sign.ring); V.c('#2f5f66'); prism(V, sign.ring, lo - 0.5, lo + 6.5); prism(M.nY, offsetPoly(sign.ring, 0.05), lo + 5.6, lo + 5.9, true); }
};

// ---------- New York: brownstone and brick street facades, fire escapes, water tanks, soundstages ----------
const nyBay = (F, u, w, g0, H, k) => {
  const V = M.v, brick = pick(PAL.NY.w), stone = pick(['#d8cdb8', '#c7bba4', '#e2d9c6']);
  V.c(brick, 0.05); fbox(V, F, u + w/2, g0 - 1.2, 0.8, w - 0.1, H + 1.2, 1.6);
  V.c(stone); fbox(V, F, u + w/2, g0 + H - 1.1, 1.2, w + 0.25, 1.1, 2.4); fbox(V, F, u + w/2, g0 + 4.4, 1.0, w, 0.55, 2.0);
  fquad(M.win, F, u + 0.6, u + w - 0.6, g0 + 0.5, g0 + 3.9, 1.63);
  const nc = Math.max(2, Math.floor(w/2.4)); let ys = [];
  for (let y = g0 + 6.0; y < g0 + H - 2.6; y += 3.4){ ys.push(y); for (let j = 0; j < nc; j++){ const c = u + w*(j + 0.5)/nc; fquad(M.win, F, c - 0.55, c + 0.55, y, y + 1.85, 1.63); V.c(stone); fbox(V, F, c, y + 1.85, 1.65, 1.4, 0.3, 0.2); } }
  if (k % 2 === 0){ V.c('#e9e2d2'); for (let i = 0; i < 4; i++){ const u0 = u + 0.5 + (w - 1)*i/4, u1 = u + 0.5 + (w - 1)*(i + 1)/4; V.c(i % 2 ? '#2b5b3d' : '#e9e2d2'); V.q(F.P(u0, g0 + 4.1, 1.62), F.P(u1, g0 + 4.1, 1.62), F.P(u1, g0 + 3.4, 3.0), F.P(u0, g0 + 3.4, 3.0)); } }
  if (k % 3 !== 2 && ys.length > 1){ const V2 = M.v, a = u + w*0.2, b = u + w*0.8; V2.c('#2c2c2e');           // fire escape
    ys.forEach((y, i) => { fbox(V2, F, (a + b)/2, y - 0.35, 2.3, b - a, 0.12, 1.3); fbox(V2, F, (a + b)/2, y - 0.2, 2.95, b - a, 0.9, 0.05);
      if (i < ys.length - 1){ const p = F.P(i % 2 ? a + 0.4 : b - 0.4, y - 0.3, 2.3), q = F.P(i % 2 ? b - 0.4 : a + 0.4, ys[i + 1] - 0.35, 2.3); seg(V2, p, q, 0.08, 3); } }); }
  if (k % 4 === 1){ const p = F.P(u + w/2, 0, -3.5), y = g0 + H, Vw = M.v; Vw.c('#2c2c2e'); for (const [dx, dz] of [[-1.2, -1.2], [1.2, -1.2], [1.2, 1.2], [-1.2, 1.2]]) seg(Vw, [p[0] + dx, y - 0.5, p[2] + dz], [p[0] + dx, y + 2.8, p[2] + dz], 0.1, 3);
    Vw.c('#76583f', 0.06); cyl(Vw, 1.8, 1.8, 3.4, p[0], y + 2.8, p[2], 12); Vw.c('#5b4433'); cone(Vw, 2.0, 1.4, p[0], y + 6.2, p[2], 12); }
};
const newyork = () => {
  const V = M.v, s28 = takeB(0, 0, 'Stage28'), lca = takeB(0, 0, 'Lights! Camera! Action!'), kt = takeB(0, 0, "KT's Grill");
  for (const [b, h] of [[s28, 16], [lca, 17]]) if (b){ const [lo, yb] = baseOf(b.ring, 0.3); V.c('#d3c9b4', 0.03); prism(V, b.ring, lo - 1.5, yb + h, true); V.c('#a8a294'); capV(V, b.ring, yb + h - 0.4);
    const s = sarea(b.ring) > 0 ? 1 : -1; for (let i = 0; i < b.ring.length; i++){ const a = b.ring[i], c = b.ring[(i + 1) % b.ring.length], L = Math.hypot(c[0] - a[0], c[1] - a[1]); if (L < 22) continue;
      const n = nrm2(a, c, s), m = [(a[0] + c[0])/2 + n[0]*0.1, (a[1] + c[1])/2 + n[1]*0.1], ry = Math.atan2(-(c[1] - a[1]), c[0] - a[0]); V.c('#8f8778'); boxV(V, Math.min(14, L*0.4), Math.min(11, h - 3), 0.25, m[0], GY(m[0], m[1]) - 0.2, m[1], ry); } }
  const mid = [-84, -96];
  const runs = [[[-76, -126], [-109, -86]], [[-65, -98], [-89, -69]], [[-117, -93], [-141, -87]], [[-89, -69], [-89, -52]]];
  let k = 0;
  for (const [a, b] of runs){ const F = front(a, b, a[1] < -90 && a[0] < -110 ? [-120, -70] : b[0] === -89 && b[1] === -52 ? [-100, -60] : mid); let u = 0;
    while (u < F.L - 3){ let w = 7 + R()*4; if (F.L - u - w < 5) w = F.L - u; const p0 = F.P(u, 0, 0), p1 = F.P(u + w, 0, 0), g0 = Math.min(GY(p0[0], p0[2]), GY(p1[0], p1[2])); nyBay(F, u, w, g0, 13 + R()*7, k++); u += w; } }
  if (kt){ const P = kt.ring, [lo, yb] = baseOf(P, 0.2); V.c('#8f4f3c', 0.04); prism(V, P, lo - 1.5, yb + 13, true); V.c('#7a726a'); capV(V, P, yb + 12.4); V.c('#d8cdb8'); prism(V, offsetPoly(P, 0.4), yb + 11.6, yb + 12.6, true);
    const c = [-24, -96], g = GY(c[0], c[1]); V.c('#8f4f3c'); cyl(V, 3.4, 3.4, 17, c[0], g - 1, c[1], 16); V.c('#d8cdb8'); cyl(V, 3.8, 3.8, 0.8, c[0], g + 15.5, c[1], 16); V.c('#5f6b6a'); lathe(V, [[3.6, 0], [3.2, 1.8], [2.0, 3.4], [0.6, 4.4], [0, 5.2]], c[0], g + 16.3, c[1], 16);
    for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 6) continue; const F = front(a, b, [-60, -60]);
      for (let y = yb + 1.2; y < yb + 11; y += 3.4) for (let u = 1.6; u < L - 1.2; u += 2.6) fquad(M.win, F, u - 0.6, u + 0.6, y, y + 1.9, -0.06); } }
  takeB(-97, -66); shed(findB(-73, -21), '#dfe3e6', 4.6);
  canopy([[-76, -126], [-109, -86]], [[-56, -109], [-89, -69]], 7, 16, 21, 2);
  canopy([[-117, -93], [-148, -59]], [[-89, -60], [-111, -27]], 6, 13, 18, 0);
};

// ---------- the dueling coasters: track spec (x, z, h above ground, roll deg), elements expand to points ----------
const LOOP_P = [[0,0,0],[9,0,0.6],[16,0.4,4.5],[19.5,0.9,11],[19,1.5,18],[15,2.1,23.5],[9,2.6,26],[4,3.1,23.5],[2.5,3.5,17],[4.5,4.0,10],[9.5,4.5,4.5],[17,4.9,1.2],[26,5.2,0]];
const COBRA_P = [[0,0,0,0],[8,0,2,0],[14,0,7,0],[18,0,15,0],[18.5,0,22,0],[16,0.4,27.5,0],[11,1.6,29.5,0],[7,4.5,27.5,90],[5.5,8,26,180],[7,11.5,27.5,270],[11,14.4,29.5,360],[16,15.6,27.5,360],[18.5,16,22,360],[18,16,15,360],[14,16,7,360],[8,16,2,360],[0,16,0,360]];
const expandTrack = spec => { const out = []; let base = 0;
  for (const e of spec){ const k = e[0];
    if (k === 'P'){ out.push([e[1], e[2], e[3], e[4] + base, 0]); continue; }
    if (k === 'A'){ out.push([e[1], e[2], e[3], base, 1]); continue; }
    const x0 = e[1], z0 = e[2], h0 = e[3], th = e[4]*PI/180, sd = e[5], dx = Math.cos(th), dz = Math.sin(th), rx = -dz, rz = dx;
    const Wp = (f, l, h, r) => out.push([x0 + dx*f + rx*l*sd, z0 + dz*f + rz*l*sd, h0 + h, base + r*sd, 0]);
    if (k === 'LOOP') for (const p of LOOP_P) Wp(p[0], p[1], p[2], 0);
    else if (k === 'ZG'){ const L = e[6], Hh = e[7]; for (const s of [0, 0.14, 0.28, 0.42, 0.5, 0.58, 0.72, 0.86, 1]){ const u = clamp((s - 0.12)/0.76, 0, 1); Wp(L*s, 0, Hh*Math.sin(PI*s), 360*u*u*(3 - 2*u)); } base += 360*sd; }
    else if (k === 'CORK'){ const L = e[6], Rr = e[7]; for (let i = 0; i <= 8; i++){ const s = i/8, a = TAU*s; Wp(L*s, -Rr*Math.sin(a), Rr - Rr*Math.cos(a), 360*s); } base += 360*sd; }
    else if (k === 'COBRA'){ const S = e[6] || 1; for (const p of COBRA_P) Wp(p[0]*S, p[1]*S, p[2], p[3]); base += 360*sd; }
  }
  return out; };
// Cylon (inverted): north line in the station, west launch / lift, fog-pit drop, vertical loop at the lagoon edge, zero-g roll over the
// water, cobra roll at the lagoon's east bay, corkscrew back over the water, a high swoop over New York and the show building
const CYLON = [
 ['A',-68.2,76.9,3],['P',-55.6,85.1,3,0],['A',-43.1,93.4,3],
 ['P',-33.5,98.8,3.5,-15],['P',-24.5,99,4,-30],['P',-17.5,93,4.5,-15],['P',-15,84,5,0],['A',-15,62,5],
 ['P',-15,51,10,0],['P',-15,39,22,0],['P',-15,27,35,0],['P',-14.6,18,41.8,0],['P',-14.2,12,42.5,0],['P',-13.9,6,40,0],
 ['P',-13.6,-2,31,0],['P',-13.3,-12,18,0],['P',-13.1,-22,8,0],['A',-13,-30,3],
 ['LOOP',-13,-36,3,-90,1],
 ['P',-7.5,-70,6,10],['P',-3,-80,10,30],['P',6,-89,12,40],['A',16,-94,11],
 ['ZG',22,-94,11,0,1,36,10],
 ['A',61,-94,8],
 ['COBRA',66,-94,6,0,1,1.25],
 ['A',62,-74,6],['P',56,-74,9,0],
 ['CORK',50,-74,10,180,1,30,5],
 ['A',10,-75,12],['P',2,-76,14,0],
 ['P',-16,-75,17,0],['P',-30,-72,22,-30],['P',-44,-64,26,-50],['P',-56,-50,27,-40],['P',-66,-36,26,-20],
 ['P',-73,-20,26,0],['P',-77,-4,30,0],['P',-79,12,28,10],['P',-78,28,20,20],['P',-75,42,13,15],['P',-73,54,8,5],['P',-72,64,5,0],['A',-71,71,4],
];
// Human (sit-down, no inversions): south line, east launch / lift, drop beside the lagoon, a long banked sweep along the shore, an
// overbanked turn above the Sci-Fi plaza, a low pass under both drops, a climbing helix and a low run back under the Cylon track
const HUMAN = [
 ['A',-72.6,83.6,3],['P',-60,91.8,3,0],['A',-47.5,100,3],
 ['P',-37,105.5,3.5,-15],['P',-24,107,4,-25],['P',-12,101,4.5,-20],['P',-7.5,92,5,-5],['P',-7,84,5,0],['A',-7,62,5],
 ['P',-7,51,10,0],['P',-7,39,22,0],['P',-7,27,35,0],['P',-6.6,18,41.8,0],['P',-6.2,12,42.5,0],['P',-5.9,6,40,0],
 ['P',-5.6,-2,31,0],['P',-5.3,-12,18,0],['P',-5.1,-22,8,0],['P',-4.8,-30,5,10],
 ['P',-1,-40,6,40],['P',8,-46,8,55],['P',20,-48.5,11,50],['P',32,-46,14,35],['P',44,-42,16,20],['P',55,-36,19,30],['P',62,-26,22,45],
 ['P',64,-14,25,60],['P',60,-2,27,75],['P',50,4,28,80],['P',38,4,27,70],['P',26,1,23,40],['P',14,-5,17,20],['P',4,-11,10,5],
 ['A',-4,-15,4],['P',-12,-16,3,0],['P',-22,-15,3,0],
 ['P',-34,-12,8,-20],['P',-44,-5,14,-45],['P',-49,7,18,-60],['P',-46,20,20,-70],['P',-34,26,20,-70],['P',-24,18,18,-70],['P',-24,5,16,-60],['P',-31,-3,14,-55],['P',-41,-1,12,-45],
 ['P',-47,10,10,-30],['P',-49,25,8,-10],['P',-52,38,5,10],['P',-60,46,4,20],['A',-73,47,3],['P',-86,50,4,-20],['P',-93,58,4,-40],['P',-91,68,4,-40],['A',-84,77,3.5],
];
// centripetal Catmull-Rom through closed control points [x, h, z, roll, anchor]
const crSample = (CP, step) => { const n = CP.length, out = [];
  for (let i = 0; i < n; i++){ const p0 = CP[(i - 1 + n) % n], p1 = CP[i], p2 = CP[(i + 1) % n], p3 = CP[(i + 2) % n];
    const dd = (a, b) => Math.max(1e-3, Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])));
    const t0 = 0, t1 = t0 + dd(p0, p1), t2 = t1 + dd(p1, p2), t3 = t2 + dd(p2, p3), L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]), m = Math.max(2, Math.round(L/step));
    for (let k = 0; k < m; k++){ const t = t1 + (t2 - t1)*k/m, P = [0, 0, 0];
      for (let c = 0; c < 3; c++){ const A1 = (t1 - t)/(t1 - t0)*p0[c] + (t - t0)/(t1 - t0)*p1[c], A2 = (t2 - t)/(t2 - t1)*p1[c] + (t - t1)/(t2 - t1)*p2[c], A3 = (t3 - t)/(t3 - t2)*p2[c] + (t - t2)/(t3 - t2)*p3[c];
        const B1 = (t2 - t)/(t2 - t0)*A1 + (t - t0)/(t2 - t0)*A2, B2 = (t3 - t)/(t3 - t1)*A2 + (t - t1)/(t3 - t1)*A3; P[c] = (t2 - t)/(t2 - t1)*B1 + (t - t1)/(t2 - t1)*B2; }
      out.push({p:P, roll:lerp(p1[3], p2[3], k/m), an:k === 0 && p1[4]}); } }
  return out; };
// frames: parallel transport (loops invert by themselves), plus the specified roll, plus a drift correction so every anchor is upright
const projUp = T => nz3([-T[1]*T[0], 1 - T[1]*T[1], -T[1]*T[2]]);
const frames = S => { const n = S.length;
  for (let i = 0; i < n; i++){ const a = S[(i - 1 + n) % n].p, b = S[(i + 1) % n].p; S[i].T = nz3(sub3(b, a)); }
  let U = projUp(S[0].T);
  for (let i = 0; i < n; i++){ const T = S[i].T, k = dot3(U, T); U = nz3([U[0] - k*T[0], U[1] - k*T[1], U[2] - k*T[2]]); S[i].U0 = U; }
  const an = []; for (let i = 0; i < n; i++) if (S[i].an){ const s = S[i], Ur = rotA(s.U0, s.T, s.roll*PI/180), Up = projUp(s.T); an.push([i, Math.atan2(dot3(cross3(Ur, Up), s.T), dot3(Ur, Up))]); }
  for (let q = 0; q < an.length; q++){ const i0 = an[q][0], f0 = an[q][1]; let i1 = an[(q + 1) % an.length][0], f1 = an[(q + 1) % an.length][1]; if (i1 <= i0) i1 += n;
    while (f1 - f0 > PI) f1 -= TAU; while (f1 - f0 < -PI) f1 += TAU; for (let i = i0; i < i1; i++) S[i % n].phi = lerp(f0, f1, (i - i0)/(i1 - i0)); }
  for (const s of S){ s.U = rotA(s.U0, s.T, s.roll*PI/180 + (s.phi || 0)); s.B = cross3(s.T, s.U); } };
const sweep = (V, S, ou, ob, r, n) => { const rings = S.map(s => { const c = [s.p[0] + s.U[0]*ou + s.B[0]*ob, s.p[1] + s.U[1]*ou + s.B[1]*ob, s.p[2] + s.U[2]*ou + s.B[2]*ob], ring = [];
    for (let i = 0; i < n; i++){ const t = (i + 0.5)/n*TAU, cu = Math.cos(t)*r, sb = Math.sin(t)*r; ring.push([c[0] + s.U[0]*cu + s.B[0]*sb, c[1] + s.U[1]*cu + s.B[1]*sb, c[2] + s.U[2]*cu + s.B[2]*sb]); } return ring; });
  for (let k = 0; k < rings.length; k++){ const A = rings[k], B = rings[(k + 1) % rings.length]; for (let i = 0; i < n; i++){ const j = (i + 1) % n; V.q(A[i], A[j], B[j], B[i]); } } };
const ST = [-57, 89]; let GST = 0;
const refY = (x, z) => { const s = (GY(x, z)*2 + GY(x + 14, z) + GY(x - 14, z) + GY(x, z + 14) + GY(x, z - 14))/6, w = 1 - sstep(30, 72, Math.hypot(x - ST[0], z - ST[1])); return lerp(s, GST, w); };
let TRACKS = [];
const coaster = (spec, inv, TV, lampC, carCol) => {
  const S = crSample(expandTrack(spec).map(p => [p[0], p[2], p[1], p[3], p[4]]), 1.0);
  for (const s of S){ const x = s.p[0], z = s.p[2]; s.h = s.p[1]; s.p = [x, Math.max(refY(x, z) + s.h, GY(x, z) + 2.4), z]; }
  frames(S);
  const ru = inv ? 1.3 : -1.05, su = inv ? 2.05 : -1.75;
  sweep(TV, S, ru, 0.62, 0.2, 6); sweep(TV, S, ru, -0.62, 0.2, 6); sweep(TV, S, su, 0, 0.42, 8);
  const at = (s, u, b) => [s.p[0] + s.U[0]*u + s.B[0]*b, s.p[1] + s.U[1]*u + s.B[1]*b, s.p[2] + s.U[2]*u + s.B[2]*b];
  S.forEach((s, i) => { if (i % 2 === 0) TV.t(at(s, ru, 0.62), at(s, ru, -0.62), at(s, su, 0)); });
  // supports
  const V = M.v, stP = findB(0, 0, 'Battlestar Galactica'), lb = findB(-11, 72);
  S.forEach((s, i) => {
    if (i % 10 !== 3) return;
    const sp = at(s, su, 0), x = sp[0], z = sp[2];
    if ((stP && inPoly(stP.ring, x, z)) || (lb && inPoly(lb.ring, x, z))) return;
    const g = GY(x, z), rl = at(s, ru, 0.62), rr = at(s, ru, -0.62), lowest = Math.min(rl[1], rr[1], sp[1]); if (sp[1] - g < 1.2) return;
    V.c(inv ? '#aab4c0' : '#cfd2d6');
    if (sp[1] <= lowest + 0.35){ const H = sp[1] - g, r = 0.3 + 0.011*H;
      if (H > 21){ let bx = s.B[0], bz = s.B[2]; const bl = Math.hypot(bx, bz) || 1; bx /= bl; bz /= bl; const o = H*0.2; seg(V, [x + bx*o, g - 0.5, z + bz*o], sp, r, 6); seg(V, [x - bx*o, g - 0.5, z - bz*o], sp, r, 6);
        const hb = g + H*0.45, ob = o*0.55; seg(V, [x + bx*ob, hb, z + bz*ob], [x - bx*ob, hb, z - bz*ob], r*0.6, 5); V.c('#b9b6ae'); boxV(V, 1.6, 0.7, 1.6, x + bx*o, g - 0.2, z + bz*o); boxV(V, 1.6, 0.7, 1.6, x - bx*o, g - 0.2, z - bz*o); }
      else { seg(V, [x, g - 0.5, z], sp, r, 6); V.c('#b9b6ae'); boxV(V, 1.4, 0.7, 1.4, x, g - 0.2, z); } }
    else { let bx = s.B[0], bz = s.B[2]; const bl = Math.hypot(bx, bz); if (bl < 0.3){ bx = -s.T[2]; bz = s.T[0]; } const b2 = Math.hypot(bx, bz); bx /= b2; bz /= b2;
      const sg = (sp[0] - s.p[0])*bx + (sp[2] - s.p[2])*bz >= 0 ? 1 : -1, qx = x + bx*3.6*sg, qz = z + bz*3.6*sg, gq = GY(qx, qz), yq = sp[1] + 0.9, H = yq - gq, r = 0.3 + 0.011*H;
      seg(V, [qx, gq - 0.5, qz], [qx, yq, qz], r, 6); seg(V, [qx, yq, qz], [x, yq, z], r*0.8, 5); seg(V, [x, yq, z], sp, r*0.7, 5); V.c('#b9b6ae'); boxV(V, 1.4, 0.7, 1.4, qx, gq - 0.2, qz); }
  });
  // service stairs beside the lift hill
  { const side = inv ? -1 : 1; V.c('#9aa1a8'); for (let i = 0; i < S.length - 1; i++){ const s = S[i], t = S[i + 1]; if (s.T[1] < 0.28 || s.p[2] < 8 || s.p[2] > 60) continue;
    const a0 = at(s, su, side*1.6), a1 = at(s, su, side*2.6), b0 = at(t, su, side*1.6), b1 = at(t, su, side*2.6); V.q(a0, a1, b1, b0); seg(V, [a1[0], a1[1] + 1.0, a1[2]], [b1[0], b1[1] + 1.0, b1[2]], 0.04, 3); } }
  // lights along the spine
  S.forEach((s, i) => { if (i % 13 === 5){ const p = at(s, su, 0); CTX.lamp(p[0], p[1], p[2], lampC); } });
  // trains: one waiting in the station, one on the lift
  const train = (x, z) => { let bi = 0, bd = 1e9; S.forEach((s, i) => { const d = Math.hypot(s.p[0] - x, s.p[2] - z); if (d < bd){ bd = d; bi = i; } });
    for (let c = 0; c < 8; c++){ const s = S[(bi - c*2.2 + S.length) % S.length | 0], cu = inv ? 0.55 : -0.35, ctr = at(s, cu, 0);
      V.c(c === 0 ? carCol[1] : carCol[0]); obox(V, ctr, s.T, s.U, s.B, 1.9, 1.0, 1.6); V.c('#26292e'); obox(V, at(s, inv ? -0.35 : 0.45, 0), s.T, s.U, s.B, 1.2, 0.5, 1.5); } };
  if (inv){ train(-56, 84); train(-15, 40); } else { train(-60, 91.8); train(-7, 30); }
  S.len = S.length;
  // keep trees off the low parts
  for (const s of S) if (s.p[1] - GY(s.p[0], s.p[2]) < 9) mDisc(s.p[0], s.p[2], 3.6, 4);
  TRACKS.push(S);
  return S;
};

// ---------- Sci-Fi City ----------
const trackClear = (x, z, r, ytop) => { for (const S of TRACKS) for (const s of S){ if (Math.hypot(s.p[0] - x, s.p[2] - z) < r && s.p[1] - 4 < ytop) return false; } return true; };
const scifi = () => {
  const V = M.v;
  // the show building for the 3D dark ride: big steel-grey box, ribbed walls, an angular portal with blue light strips
  const tf = takeB(0, 0, 'TRANSFORMERS The Ride: The Ultimate 3D Battle');
  if (tf){ const P = tf.ring, [lo, yb] = baseOf(P, 0.3), top = yb + 17; V.c('#717c88', 0.03); prism(V, P, lo - 1.5, top, true); V.c('#4a525b'); capV(V, P, top - 0.6);
    prism(M.nB, offsetPoly(P, 0.06), top - 2.4, top - 2.0, true);
    const s = sarea(P) > 0 ? 1 : -1; V.c('#8e99a5');
    for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 8) continue; const n = nrm2(a, b, s), ry = Math.atan2(-(b[1] - a[1]), b[0] - a[0]);
      for (let d = 3; d < L - 2; d += 4.2){ const x = a[0] + (b[0] - a[0])*d/L + n[0]*0.35, z = a[1] + (b[1] - a[1])*d/L + n[1]*0.35; boxV(V, 0.5, top - 1 - (GY(x, z) - 1), 0.7, x, GY(x, z) - 1, z, ry); } }
    // portal on the north-east front
    const F = front([-93, -24], [-69, -3], [-60, -30]), g0 = GY(-81, -14);
    V.c('#3c434b'); hexV(V, [F.P(2, g0, 0), F.P(F.L - 2, g0, 0), F.P(F.L - 4, g0, 7), F.P(4, g0, 7), F.P(4, g0 + 22, 0), F.P(F.L - 4, g0 + 22, 0), F.P(F.L - 7, g0 + 13, 9), F.P(7, g0 + 13, 9)]);
    V.c('#c8d0d8'); hexV(V, [F.P(9, g0, 7.2), F.P(F.L - 9, g0, 7.2), F.P(F.L - 9, g0, 7.6), F.P(9, g0, 7.6), F.P(10, g0 + 9, 7.2), F.P(F.L - 10, g0 + 9, 7.2), F.P(F.L - 10, g0 + 9, 7.6), F.P(10, g0 + 9, 7.6)]);
    polyLineV(M.nB, [F.P(4, g0 + 0.2, 7.1), F.P(7, g0 + 13, 9.1), F.P(F.L - 7, g0 + 13, 9.1), F.P(F.L - 4, g0 + 0.2, 7.1)], 0.16, 4);
    polyLineV(M.nB, [F.P(4, g0 + 22, 0.2), F.P(F.L - 4, g0 + 22, 0.2)], 0.16, 4);
    fquad(M.win, F, 11, F.L - 11, g0 + 0.4, g0 + 7.5, 7.7); }
  // station of the dueling coasters: open-sided hangar with a curved silver roof
  const bs = takeB(0, 0, 'Battlestar Galactica');
  if (bs){ const P = bs.ring, top = GST + 9; V.c('#8e9399'); prism(V, P, GY(cen(P)[0], cen(P)[1]) - 6, GST + 0.4); V.c('#9ea8b2'); for (const p of P) seg(V, [p[0], GST, p[1]], [p[0], top, p[1]], 0.35, 6);
    const ob = obb(P), Rp = rotP(ob.cx, ob.cz, ob.ry), K = 10, rows = []; for (let k = 0; k <= K; k++){ const t = k/K, b = (t - 0.5)*(ob.W + 3), y = top + 4.5*Math.sin(PI*t); rows.push([Rp(-ob.L/2 - 1.5, y, b), Rp(ob.L/2 + 1.5, y, b)]); }
    V.c('#aab3bd'); for (let k = 0; k < K; k++) V.q(rows[k][0], rows[k][1], rows[k + 1][1], rows[k + 1][0]);
    V.c('#c7ced6'); for (const e of [0, 1]) for (let k = 0; k < K; k++) V.t(rows[k][e], rows[k + 1][e], e ? Rp(ob.L/2 + 1.5, top, 0) : Rp(-ob.L/2 - 1.5, top, 0));
    polyLineV(M.nB, rows.map(r => r[0]), 0.14, 3); polyLineV(M.nB, rows.map(r => r[1]), 0.14, 3);
    V.c('#7c8690'); for (let q = 1; q < 6; q++){ const f = q/6, arc = rows.map(r => [lerp(r[0][0], r[1][0], f), r[0][1] + 0.25, lerp(r[0][2], r[1][2], f)]); polyLineV(V, arc, 0.22, 4); }
    V.c('#5d6670'); const fin = Rp(0, top + 4.5, 0); boxV(V, 1.0, 9, 6, fin[0], fin[1] - 1, fin[2], ob.ry); boxV(M.nR, 1.1, 0.4, 0.4, fin[0], fin[1] + 8, fin[2], ob.ry); }
  // launch tunnel for both trains (open ends)
  const lb = takeB(-11, 72); if (lb){ const P = lb.ring, [lo] = gLo(P), c = cen(P), top = refY(c[0], c[1]) + 11; V.c('#b4bcc5');
    for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length]; if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 12) continue; V.q([a[0], lo - 1, a[1]], [b[0], lo - 1, b[1]], [b[0], top, b[1]], [a[0], top, a[1]]); }
    capV(V, P, top); prism(M.nB, offsetPoly(P, 0.06), top - 1.5, top - 1.1, true); }
  // the spinning ride under a disc canopy
  { const c = [-74, 26], g = GY(c[0], c[1]); takeB(0, 0, 'Accelerator');
    V.c('#cfd5dc'); cyl(V, 12.5, 12.5, 1.0, c[0], g - 0.3, c[1], 28, true); V.c('#8a96a3'); cyl(V, 1.2, 1.2, 8, c[0], g + 0.7, c[1], 10);
    for (let k = 0; k < 6; k++){ const a = k/6*TAU + 0.3, x = c[0] + Math.cos(a)*7.5, z = c[1] + Math.sin(a)*7.5; V.c('#8a96a3'); seg(V, [c[0], g + 2.2, c[1]], [x, g + 2.0, z], 0.25, 4);
      V.c(['#e8eef4', '#ffcf3a', '#e8eef4'][k % 3]); sph(V, 1.9, x, g + 2.2, z, 10, 0.75); sph(M.win, 1.25, x, g + 2.9, z, 8, 0.6); }
    V.c('#b9c2cc'); for (let k = 0; k < 6; k++){ const a = k/6*TAU, x = c[0] + Math.cos(a)*13, z = c[1] + Math.sin(a)*13; seg(V, [x, g - 0.3, z], [x*0.92 + c[0]*0.08, g + 9.5, z*0.92 + c[1]*0.08], 0.3, 6); }
    V.c('#e9edf1'); lathe(V, [[0, 1.2], [8, 0.9], [14.5, 0], [14.5, -0.6], [0, -0.3]], c[0], g + 10, c[1], 28); lathe(M.nB, [[14.6, -0.05], [14.6, -0.45]], c[0], g + 10, c[1], 28);
    V.c('#8a96a3'); cone(V, 2.2, 4, c[0], g + 11, c[1], 10); sph(M.nB, 0.6, c[0], g + 15.2, c[1], 8); CTX.lamp(c[0], g + 15.4, c[1], [140, 210, 255]); }
  // silver spires with rings and glowing tips (placed clear of the tracks)
  for (const [x, z, H] of [[22, -24, 30], [-44, 34, 26], [34, 44, 24], [-100, -30, 32], [-20, 40, 22]]){ if (!trackClear(x, z, 7, H + 2)) continue; const g = GY(x, z);
    V.c('#dfe5eb'); lathe(V, [[1.6, 0], [1.3, H*0.4], [0.7, H*0.85], [0.25, H]], x, g - 0.5, z, 10); V.c('#aeb8c3'); cyl(V, 3.4, 3.4, 0.5, x, g + H*0.55, z, 16, true); cyl(V, 2.2, 2.2, 0.4, x, g + H*0.72, z, 14, true);
    lathe(M.nB, [[3.45, 0.05], [3.45, 0.45]], x, g + H*0.55, z, 16); sph(M.nB, 0.7, x, g + H - 0.2, z, 8); CTX.lamp(x, g + H, z, [140, 210, 255]); mDisc(x, z, 4, 1); }
  // the café by the lagoon gets a dome
  const cf = findB(27, 15); if (cf){ cf.done = true; const r = building(V, cf.ring, 'SF', 11); V.c('#e9eef2'); const c = cen(cf.ring); lathe(V, [[9, 0], [8, 3], [5.5, 5.5], [0, 7]], c[0], r.top - 0.7, c[1], 20); lathe(M.nB, [[9.05, 0.1], [9.05, 0.5]], c[0], r.top - 0.7, c[1], 20); }
};

// ---------- Ancient Egypt: temple pylons and colonnade, obelisks, a pyramid on the ride building ----------
const obelisk = (x, z, H, g) => { g = g === undefined ? GY(x, z) : g; const V = M.v, a = H*0.065, b = a*0.62;
  V.c('#dcc49a'); boxV(V, a*2.6, 1.4, a*2.6, x, g - 0.6, z); V.c('#e4cfa4'); hexV(V, [[x - a, g + 0.8, z - a], [x + a, g + 0.8, z - a], [x + a, g + 0.8, z + a], [x - a, g + 0.8, z + a], [x - b, g + H, z - b], [x + b, g + H, z - b], [x + b, g + H, z + b], [x - b, g + H, z + b]]);
  V.c('#d9b44a'); lathe(V, [[b*1.41, 0], [0, b*2.2]], x, g + H, z, 4, PI/4); };
const pylon = (F, u, w, d, H, g) => { const V = M.v, t = H*0.11; V.c('#d8c093', 0.03);
  hexV(V, [F.P(u - w/2, g, -d/2), F.P(u + w/2, g, -d/2), F.P(u + w/2, g, d/2), F.P(u - w/2, g, d/2), F.P(u - w/2 + t, g + H, -d/2 + t*0.6), F.P(u + w/2 - t, g + H, -d/2 + t*0.6), F.P(u + w/2 - t, g + H, d/2 - t*0.6), F.P(u - w/2 + t, g + H, d/2 - t*0.6)]);
  V.c('#c9ae7c'); hexV(V, [F.P(u - w/2 + t - 0.2, g + H, -d/2 + t*0.6 - 0.2), F.P(u + w/2 - t + 0.2, g + H, -d/2 + t*0.6 - 0.2), F.P(u + w/2 - t + 0.2, g + H, d/2 - t*0.6 + 0.2), F.P(u - w/2 + t - 0.2, g + H, d/2 - t*0.6 + 0.2),
    F.P(u - w/2 + t - 1.0, g + H + 1.6, -d/2 + t*0.6 - 1.0), F.P(u + w/2 - t + 1.0, g + H + 1.6, -d/2 + t*0.6 - 1.0), F.P(u + w/2 - t + 1.0, g + H + 1.6, d/2 - t*0.6 + 1.0), F.P(u - w/2 + t - 1.0, g + H + 1.6, d/2 - t*0.6 + 1.0)]);
  V.c('#b8965e'); for (let y = g + 3; y < g + H - 1; y += 3.2){ const f = (y - g)/H*t; V.q(F.P(u - w/2 + f + 1, y, d/2 - f*0.6 + 0.05), F.P(u + w/2 - f - 1, y, d/2 - f*0.6 + 0.05), F.P(u + w/2 - f - 1, y + 0.35, d/2 - f*0.6 + 0.05), F.P(u - w/2 + f + 1, y + 0.35, d/2 - f*0.6 + 0.05)); } };
const egypt = () => {
  const V = M.v, mu = takeB(0, 0, 'Revenge of the Mummy'), fr = takeB(75, 53);
  let roof = 0;
  if (mu){ const P = mu.ring, [lo, yb] = baseOf(P, 0.35); roof = yb + 18; V.c('#cfb68a', 0.02); prism(V, P, lo - 1.5, roof, true); V.c('#c4ab7f'); capV(V, P, roof);
    V.c('#bfa274'); prism(V, offsetPoly(P, 0.6), roof - 1.6, roof - 0.4, true); prism(V, offsetPoly(P, 0.25), roof - 0.4, roof, true);
    { const s = sarea(P) > 0 ? 1 : -1; for (let i = 0; i < P.length; i++){ const a = P[i], c = P[(i + 1) % P.length], L = Math.hypot(c[0] - a[0], c[1] - a[1]), n = nrm2(a, c, s), ry = Math.atan2(-(c[1] - a[1]), c[0] - a[0]);
      V.c('#d9c398'); for (let u = 4; u < L - 2; u += 7){ const x = a[0] + (c[0] - a[0])*u/L + n[0]*0.3, z = a[1] + (c[1] - a[1])*u/L + n[1]*0.3; boxV(V, 1.6, roof - 1.6 - (lo - 1), 0.6, x, lo - 1, z, ry); }
      V.c('#a98d5f'); const m = [(a[0] + c[0])/2 + n[0]*0.08, (a[1] + c[1])/2 + n[1]*0.08]; boxV(V, L, 0.6, 0.1, m[0], roof - 4.5, m[1], ry); boxV(V, L, 0.6, 0.1, m[0], roof - 6.2, m[1], ry); } }
    // pyramid on the roof, gilded cap
    const c = [114, 92], b = 19, ap = [c[0], roof + 24, c[1]], C4 = [[c[0] - b, roof, c[1] - b], [c[0] + b, roof, c[1] - b], [c[0] + b, roof, c[1] + b], [c[0] - b, roof, c[1] + b]];
    for (let i = 0; i < 4; i++){ V.c(['#dcc28f', '#d1b682', '#c9ad78', '#d6bc88'][i]); V.t(C4[i], C4[(i + 1) % 4], ap); }
    V.c('#d9b44a'); const cap = 2.6, cy = roof + 24 - cap*1.26; for (let i = 0; i < 4; i++){ const p = C4[i], q = C4[(i + 1) % 4], f = cap/b; V.t([c[0] + (p[0] - c[0])*f, cy, c[1] + (p[2] - c[1])*f], [c[0] + (q[0] - c[0])*f, cy, c[1] + (q[2] - c[1])*f], [ap[0], ap[1] + 0.05, ap[2]]); }
    CTX.lamp(c[0], roof + 24.5, c[1], [255, 200, 120]); }
  // the temple front: sandstone wing, two battered pylons, gateway with cavetto cornice, papyrus colonnade, obelisks
  if (fr){ const P = fr.ring, [lo, yb] = baseOf(P, 0.25); V.c('#d6be92', 0.03); prism(V, P, lo - 1.5, yb + 12, true); V.c('#c6ae84'); capV(V, P, yb + 11.5); V.c('#bfa274'); prism(V, offsetPoly(P, 0.5), yb + 10.6, yb + 12, true); }
  const F = front([53, 45], [98, 38], [75, 0]), g = Math.min(GY(...F.P(0, 0, 0).filter((_, i) => i !== 1)), GY(F.P(45, 0, 0)[0], F.P(45, 0, 0)[2])) - 0.2;
  V.c('#cdb68c'); fbox(V, F, 22.5, g - 1.5, 6, 50, 2.0, 16);  // podium and steps
  for (let k = 0; k < 4; k++){ V.c(k % 2 ? '#d7c299' : '#cbb487'); fbox(V, F, 22.5, g - 1 + k*0.4, 14.2 + k*0.6, 14, 0.4, 2.2); }
  const gp = g + 0.5;
  pylon(F, 9, 17, 8, 21, gp); pylon(F, 36, 17, 8, 21, gp);
  V.c('#cfb889'); fbox(V, F, 22.5, gp, 0, 10, 15, 6); V.c('#2f2a24'); fbox(V, F, 22.5, gp, 3.05, 5, 9.5, 0.2);
  V.c('#c9ae7c'); fbox(V, F, 22.5, gp + 15, 0, 11.5, 1.2, 7.5); V.c('#b89a64'); fbox(V, F, 22.5, gp + 16.2, 0, 12.5, 0.5, 8.3);
  V.c('#3a6e9a'); fbox(V, F, 22.5, gp + 13.2, 3.2, 9, 0.9, 0.3); V.c('#d9b44a'); fbox(V, F, 22.5, gp + 13.6, 3.4, 3.6, 1.5, 0.25);
  for (let i = 0; i < 6; i++){ const u = 12 + i*2.1*2.5, p = F.P(u, 0, 9.5); V.c('#dcc79f'); cyl(V, 1.0, 0.9, 8.6, p[0], gp, p[2], 10); V.c('#5f8f6a'); lathe(V, [[0.9, 0], [1.7, 1.1], [1.75, 1.4], [1.2, 1.55]], p[0], gp + 8.6, p[2], 10); }
  V.c('#cdb488'); fbox(V, F, 22.5, gp + 10.15, 9.5, 28, 1.3, 2.8); V.c('#3a6e9a'); fbox(V, F, 22.5, gp + 10.5, 10.95, 26, 0.5, 0.1);
  for (const [u, w, H] of [[3, 13, 19], [42, 13, 19], [-8, 11, 15], [53, 11, 15]]){ const p = F.P(u, 0, w); obelisk(p[0], p[2], H); }
  for (const u of [-14, 59]){ const p = F.P(u, 0, 6); cyl(M.v.c('#8a7a5e'), 0.6, 0.9, 3.6, p[0], GY(p[0], p[2]) - 0.2, p[2], 8); sph(M.nO, 0.75, p[0], GY(p[0], p[2]) + 4.1, p[2], 8, 1.4); CTX.lamp(p[0], GY(p[0], p[2]) + 4.4, p[2], [255, 150, 60]); }
  // treasure-hunt jeep ride: striped station canopy, sandy loop
  const th = takeB(0, 0, 'Treasure Hunters'); if (th){ const [lo] = gLo(th.ring); V.c('#cdb68c'); prism(V, th.ring, lo - 1, lo + 3.6, true); for (let k = 0; k < 6; k++){ const ob = obb(th.ring), Rp = rotP(ob.cx, ob.cz, ob.ry), u0 = -ob.L/2 - 1 + (ob.L + 2)*k/6, u1 = -ob.L/2 - 1 + (ob.L + 2)*(k + 1)/6;
    V.c(k % 2 ? '#f1e6cc' : '#b8443a'); V.q(Rp(u0, lo + 3.6, -ob.W/2 - 1), Rp(u1, lo + 3.6, -ob.W/2 - 1), Rp(u1, lo + 5.4, 0), Rp(u0, lo + 5.4, 0)); V.q(Rp(u0, lo + 3.6, ob.W/2 + 1), Rp(u1, lo + 3.6, ob.W/2 + 1), Rp(u1, lo + 5.4, 0), Rp(u0, lo + 5.4, 0)); } }
};

// ---------- The Lost World: rapids river round a volcano, rock work, food lodge, flyer, WaterWorld ----------
const RIVER = [[176,68],[162,82],[154,104],[156,128],[172,146],[198,156],[226,150],[244,134],[246,110],[236,90],[216,78],[196,70]];
const volcano = (cx, cz, R0, Hh) => {
  const V = M.v, NI = 30, NJ = 11, rc = 6.5, base = [];
  for (let i = 0; i < NI; i++){ const a = i/NI*TAU; base.push(GY(cx + Math.cos(a)*R0, cz + Math.sin(a)*R0)); }
  const g0 = Math.min(...base), noise = []; for (let j = 0; j <= NJ; j++){ noise.push([]); for (let i = 0; i < NI; i++) noise[j].push(0.82 + R()*0.36); }
  const top = g0 + Hh, P = (i, j) => { const t = j/NJ, a = (i % NI)/NI*TAU, r = (rc + (R0 - rc)*Math.pow(1 - t, 1.7))*(j === 0 ? 1 : noise[j][i % NI]), y = j === 0 ? base[i % NI] - 0.8 : lerp(base[i % NI], top, t) + (j < NJ ? (noise[j][(i + 3) % NI] - 1)*3 : 0); return [cx + Math.cos(a)*r, y, cz + Math.sin(a)*r]; };
  for (let j = 0; j < NJ; j++) for (let i = 0; i < NI; i++){ const t = j/NJ; V.c(t < 0.3 ? (R() < 0.5 ? '#5c6b44' : '#6a6048') : t < 0.75 ? pick(['#6e6255', '#625a50', '#7a6a58']) : pick(['#4f4741', '#5a504a']), 0.1); V.q(P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)); }
  V.c('#3b3430'); for (let i = 0; i < NI; i++) V.t(P(i, NJ), P(i + 1, NJ), [cx, top - 5, cz]);
  lathe(M.nO, [[4.5, 0], [0, 0.1]], cx, top - 3.2, cz, 12); CTX.lamp(cx, top + 1, cz, [255, 120, 40]);
  // two waterfalls down the flank into the river
  for (const a0 of [0.9, 2.4]){ const pts = []; for (let j = NJ - 2; j >= 0; j--){ const p = P(Math.round(a0/TAU*NI), j), d = [Math.cos(a0), Math.sin(a0)]; pts.push([p[0] + d[0]*1.2, p[1], p[2] + d[1]*1.2]); }
    for (let k = 0; k < pts.length - 1; k++){ const a = pts[k], b = pts[k + 1], w = 2.2, tx = -Math.sin(a0)*w, tz = Math.cos(a0)*w; M.foam.q([a[0] - tx, a[1], a[2] - tz], [a[0] + tx, a[1], a[2] + tz], [b[0] + tx, b[1], b[2] + tz], [b[0] - tx, b[1], b[2] - tz]); } }
  mDisc(cx, cz, R0, 1);
};
const lostworld = () => {
  const V = M.v;
  // rapids: river (painted), rocky banks, round rafts
  const RV = [...RIVER, RIVER[0]];
  for (let i = 0; i < RV.length - 1; i++){ const a = RV[i], b = RV[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1])/L, nz = (b[0] - a[0])/L;
    for (let d = 0; d < L; d += 5.5) for (const sd of [-1, 1]){ const x = lerp(a[0], b[0], d/L) + nx*sd*(5.8 + R()*1.5), z = lerp(a[1], b[1], d/L) + nz*sd*(5.8 + R()*1.5), s = 0.9 + R()*1.6; V.c(pick(['#7d6e5a', '#8a7b66', '#6f6252']), 0.1); rock(V, x, GY(x, z) + 0.2, z, s*1.4, s*0.9, s*1.3); }
    if (i % 3 === 1){ const x = (a[0] + b[0])/2, z = (a[1] + b[1])/2, g = GY(x, z); V.c('#f0b62e'); cyl(V, 2.1, 2.1, 0.9, x, g + 0.1, z, 14, true); V.c('#2f6aa0'); cyl(V, 1.3, 1.3, 1.0, x, g + 0.2, z, 10, true); } }
  volcano(212, 112, 29, 34);
  { const c = [148, 38], g = GY(c[0], c[1]); for (const s of [-1, 1]){ const x = c[0], z = c[1] + s*8; V.c('#6b5034', 0.06);
      for (const [dx, dz] of [[-0.9, -0.9], [0.9, -0.9], [0.9, 0.9], [-0.9, 0.9], [0, 0]]) seg(V, [x + dx, g - 0.5, z + dz], [x + dx*0.8, g + 13 + (dx ? 0 : 1.2), z + dz*0.8], dx ? 0.55 : 0.7, 6);
      V.c('#3f3a30'); rock(V, x, g + 0.5, z, 2.6, 1.4, 2.6); sph(M.nO, 0.55, x, g + 14.6, z, 6, 1.5); CTX.lamp(x, g + 14.9, z, [255, 150, 60]); }
    V.c('#5e472f'); seg(V, [c[0], g + 11.5, c[1] - 10.5], [c[0], g + 11.5, c[1] + 10.5], 0.75, 6); seg(V, [c[0], g + 10.2, c[1] - 9.5], [c[0], g + 10.2, c[1] + 9.5], 0.5, 6);
    V.c('#3e3127'); for (const zz of [-6, 6]) seg(V, [c[0], g + 11.5, c[1] + zz], [c[0], g + 7.5, c[1] + zz*1.15], 0.12, 4); }
  // the raised rock flume (winding footprint) with water on top and a drop at its end
  const fl = takeB(272, 157); if (fl){ const P = fl.ring, [lo, yb] = baseOf(P, 0.5); V.c('#857561', 0.06); prism(V, P, lo - 1, yb + 9, true); capV(M.wat, P, yb + 8.2);
    const e = P[0]; for (let k = 0; k < 6; k++) M.foam.q([e[0] - 2, yb + 8.2 - k*1.4, e[1]], [e[0] + 2, yb + 8.2 - k*1.4, e[1]], [e[0] + 2, yb + 6.8 - k*1.4, e[1] + 1.2], [e[0] - 2, yb + 6.8 - k*1.4, e[1] + 1.2]);
    for (let k = 0; k < P.length; k += 3){ const p = P[k]; rock(V.c('#7d6e5a', 0.1), p[0], yb + 9.2, p[1], 1.8, 1.1, 1.8); } }
  const rk = takeB(259, 120); if (rk){ const P = rk.ring, [lo, yb] = baseOf(P, 0.4); V.c('#7f705d', 0.05); prism(V, P, lo - 1, yb + 11); for (const p of P) rock(V.c('#76695a', 0.1), p[0], yb + 10 + R()*2, p[1], 3, 2.4, 3); }
  // rapids station: open timber pavilion, deep thatched hip roof; round lodge with a conical roof
  const rs = takeB(0, 0, 'Jurassic Park Rapids Adventure'); if (rs){ const P = rs.ring, [lo, yb] = baseOf(P, 0.25); V.c('#6f5a43'); prism(V, P, lo - 1, yb + 2.2, true); for (const p of P) seg(V, [p[0], yb, p[1]], [p[0], yb + 6, p[1]], 0.35, 5);
    V.c('#7a6142'); capV(V, P, yb + 6); const ob = obb(P); V.c('#8f7547', 0.05); hipV(V, ob.cx, ob.cz, ob.L*0.92, ob.W*0.92, yb + 6, 7, ob.ry, 1.6); }
  const rl = takeB(172, 49); if (rl){ const P = rl.ring, [lo, yb] = baseOf(P, 0.3); V.c('#8b6f53'); prism(V, P, lo - 1, yb + 8, true); V.c('#8d7448', 0.05); polyRoof(V, P, yb + 8, 9, 1.6); prism(M.win, offsetPoly(P, 0.05), yb + 2.5, yb + 4.5, true); }
  // food lodge: timber walls, big green roof with a lantern
  const df = takeB(0, 0, 'Discovery Food Court'); if (df){ const P = df.ring, [lo, yb] = baseOf(P, 0.3); V.c('#7c6248'); prism(V, P, lo - 1, yb + 6.5, true); prism(M.win, offsetPoly(P, 0.05), yb + 1.2, yb + 4.8, true);
    V.c('#56703f', 0.04); polyRoof(V, P, yb + 6.5, 10, 2.2); const c = cen(P); V.c('#7c6248'); cyl(V, 2.6, 2.6, 3, c[0], yb + 14, c[1], 8); V.c('#56703f'); cone(V, 3.6, 3.4, c[0], yb + 17, c[1], 8); }
  // suspended flyer through the trees: single beam on timber posts, hanging pods
  const cfP = [[208,8],[236,-4],[262,-14],[290,-10],[312,4],[318,26],[304,44],[280,50],[256,46],[236,36],[220,26]], cps = [];
  for (let i = 0; i < cfP.length; i++){ const p = cfP[i], g = GY(p[0], p[1]); cps.push([p[0], g + 11 + 2.5*Math.sin(i*1.7), p[1]]); }
  const cfS = crSample(cps.map(p => [p[0], p[1], p[2], 0, 0]), 2); V.c('#5d6268'); for (let i = 0; i < cfS.length; i++){ const a = cfS[i].p, b = cfS[(i + 1) % cfS.length].p; seg(V, a, b, 0.4, 4); }
  cfS.forEach((s, i) => { const p = s.p, g = GY(p[0], p[2]); if (i % 6 === 0){ V.c('#6b5338'); seg(V, [p[0] + 2.4, g - 0.5, p[2]], [p[0] + 2.4, p[1] + 1.2, p[2]], 0.38, 5); seg(V, [p[0] + 2.4, p[1] + 1.2, p[2]], [p[0], p[1] + 0.4, p[2]], 0.25, 4); }
    if (i % 23 === 7){ V.c('#e6b422'); seg(V, p, [p[0], p[1] - 2.2, p[2]], 0.1, 3); boxV(V, 1.4, 1.3, 2.0, p[0], p[1] - 3.4, p[2], i); } });
  { const b = takeB(0, 0, 'Canopy Flyer'); if (b) building(V, b.ring, 'LW', 7, {wall:'#7c6248', roof:'#56703f'}); } shed(findB(282, 13), '#7a6142', 3.8);
  // spinning ride with eight arms
  { const c = [222, 38], g = GY(c[0], c[1]); takeB(229, 43); V.c('#7a5d3f'); cyl(V, 7, 7, 0.8, c[0], g - 0.3, c[1], 18, true); V.c('#4f6b3a'); cyl(V, 0.8, 0.6, 8, c[0], g, c[1], 8);
    for (let k = 0; k < 8; k++){ const a = k/8*TAU, x = c[0] + Math.cos(a)*6, z = c[1] + Math.sin(a)*6; V.c('#6a7d4a'); seg(V, [c[0], g + 7.2, c[1]], [x, g + 4.4, z], 0.16, 4); V.c(k % 2 ? '#d98a2b' : '#3f8a6a'); sph(V, 0.95, x, g + 3.7, z, 8, 0.8); } }
  // WaterWorld: crescent seating bowl round the show pool, the scrap-metal atoll set behind the water
  const ww = takeB(0, 0, 'WaterWorld'); if (ww){ const c = [338, 84], N = 26, a0 = 96*PI/180, a1 = 240*PI/180; mDisc(c[0], c[1], 64, 4);
    for (let i = 0; i < N; i++){ const t0 = a0 + (a1 - a0)*i/N, t1 = a0 + (a1 - a0)*(i + 1)/N, tm = (t0 + t1)/2, gb = GY(c[0] + Math.cos(tm)*50, c[1] + Math.sin(tm)*50), aisle = i % 6 === 2;
      const Pt = (t, r, y) => [c[0] + Math.cos(t)*r, y, c[1] + Math.sin(t)*r];
      for (let k = 0; k < 10; k++){ const r0 = 37 + k*2.4, r1 = r0 + 2.4, y = gb + 0.8 + k*0.85;
        V.c(aisle ? '#a6abad' : k % 2 ? '#3f6f8f' : '#36627f'); V.q(Pt(t0, r0, y), Pt(t1, r0, y), Pt(t1, r1, y), Pt(t0, r1, y)); V.c('#9ea3a6'); V.q(Pt(t0, r0, y - 0.85), Pt(t1, r0, y - 0.85), Pt(t1, r0, y), Pt(t0, r0, y)); }
      V.c('#8f9497'); V.q(Pt(t0, 37, gb - 1.5), Pt(t1, 37, gb - 1.5), Pt(t1, 37, gb + 0.8), Pt(t0, 37, gb + 0.8));
      V.c('#7d8286'); V.q(Pt(t0, 61, gb - 1.5), Pt(t1, 61, gb - 1.5), Pt(t1, 61, gb + 10.5), Pt(t0, 61, gb + 10.5));
      if (i === 0 || i === N - 1){ const t = i === 0 ? t0 : t1; V.q(Pt(t, 37, gb - 1.5), Pt(t, 61, gb - 1.5), Pt(t, 61, gb + 10.5), Pt(t, 37, gb + 0.8)); } }
    for (const t of [a0 + 0.05, a1 - 0.05]){ const x = c[0] + Math.cos(t)*63, z = c[1] + Math.sin(t)*63, g = GY(x, z); V.c('#5c6166'); seg(V, [x, g - 0.5, z], [x, g + 22, z], 0.5, 6); boxV(M.nY, 3, 1.4, 0.8, x, g + 22, z, -t); CTX.lamp(x, g + 22.5, z, [255, 240, 210]); }
    // set: rusty walls and towers on an arc behind the pool
    for (let i = 0; i < 9; i++){ const t = -0.75 + i*0.19, r = 46 + R()*5, x = c[0] + Math.cos(t)*r, z = c[1] + Math.sin(t)*r, g = GY(x, z), h = 6 + R()*7;
      V.c(pick(['#8a4b2e', '#6e5a48', '#5f8a8a', '#7a6a5a', '#9a6a3e']), 0.1); boxV(V, 6 + R()*3, h, 2.5 + R()*2, x, g - 0.5, z, -t + (R() - 0.5)*0.5);
      if (i % 3 === 1) boxV(V, 3, 4, 3, x + (R() - 0.5)*3, g + h - 0.5, z + (R() - 0.5)*3, R()); }
    { const x = c[0] + 52, z = c[1] - 4, g = GY(x, z); V.c('#5a5048'); for (const [dx, dz] of [[-2, -2], [2, -2], [2, 2], [-2, 2]]) seg(V, [x + dx, g - 0.5, z + dz], [x + dx*0.5, g + 18, z + dz*0.5], 0.35, 4);
      V.c('#8a4b2e'); boxV(V, 5, 3, 5, x, g + 18, z); V.c('#6e5a48'); seg(V, [x, g + 21, z], [x - 14, g + 25, z + 2], 0.4, 4); boxV(M.nR, 0.6, 0.6, 0.6, x, g + 21.2, z); CTX.lamp(x, g + 21.5, z, [255, 90, 60]); }
    V.c('#6e5a48'); for (let i = 0; i < 4; i++){ const x = 332 + i*7, z = 70 + (i % 2)*24; if (inPoly(USS_POOL, x, z)) boxV(V, 4, 1.2, 4, x, GY(x, z) + 0.2, z, i); } }
};

// ---------- Far Far Away: storybook castle, half-timbered houses, a family coaster round a giant beanstalk ----------
const towerK = (x, z, y0, r, h, ch, wall, roof, win) => { const V = M.k;
  V.c(wall, 0.03); cyl(V, r, r, h, x, y0, z, 18); V.c('#d9cbb6'); cyl(V, r + 0.5, r + 0.5, 1.0, x, y0 + h - 1.0, z, 18, true);
  V.c('#d4c3ad'); for (let yy = y0 + 4; yy < y0 + h - 3; yy += 6) cyl(V, r + 0.06, r + 0.06, 0.35, x, yy, z, 18);
  V.c(roof, 0.03); lathe(V, [[r + 1.0, 0], [r*0.92, ch*0.2], [r*0.5, ch*0.6], [0, ch]], x, y0 + h, z, 18); V.c('#d9b44a'); sph(V, 0.45, x, y0 + h + ch + 0.2, z, 6); seg(V, [x, y0 + h + ch, z], [x, y0 + h + ch + 2.6, z], 0.08, 3);
  V.c(R() < 0.5 ? '#b8322e' : '#2c5a9a'); V.t([x, y0 + h + ch + 2.6, z], [x, y0 + h + ch + 1.8, z], [x + 1.7, y0 + h + ch + 2.2, z + 0.4]);
  for (let k = 0; k < win; k++){ const a = k/win*TAU + 0.4, y = y0 + h*0.55; const p = (aa, yy) => [x + Math.cos(aa)*(r + 0.06), yy, z + Math.sin(aa)*(r + 0.06)];
    M.win.q(p(a - 0.11, y), p(a + 0.11, y), p(a + 0.11, y + 2.2), p(a - 0.11, y + 2.2)); M.win.t(p(a - 0.11, y + 2.2), p(a + 0.11, y + 2.2), p(a, y + 2.8)); } };
const castle = () => {
  const cs = takeB(0, 0, "Lord Farquaad's Castle"); if (!cs) return;
  const C = [186, -128], d = [0.622, 0.783], f = [-0.783, 0.622], W = (u, v) => [C[0] + d[0]*u + f[0]*v, C[1] + d[1]*u + f[1]*v], ry = Math.atan2(-d[1], d[0]);
  const g = gLo(cs.ring)[0] - 0.3, V = M.k, wall = '#ece0ce', wall2 = '#e7d5c6', roof = '#55697f', trim = '#d9cbb6';
  const Bx = (u, v, w, h, dp, y, col) => { const p = W(u, v); V.c(col || wall, 0.03); boxV(V, w, h, dp, p[0], y, p[1], ry); };
  // curtain walls with battlements
  Bx(0, 22.5, 44, 13.5, 3, g - 1); Bx(0, -22.5, 44, 13.5, 3, g - 1); Bx(22.5, 0, 3, 13.5, 44, g - 1); Bx(-22.5, 0, 3, 13.5, 44, g - 1);
  V.c(trim); for (let s = -21; s <= 21; s += 2.6) for (const [u, v] of [[s, 23.6], [s, -23.6], [23.6, s], [-23.6, s]]){ const p = W(u, v); boxV(V, 1.2, 1.3, 1.2, p[0], g + 12.5, p[1], ry); }
  for (let s = -18; s <= 18; s += 6){ const p0 = W(s - 1, 24.05), p1 = W(s + 1, 24.05); M.win.q([p0[0], g + 6, p0[1]], [p1[0], g + 6, p1[1]], [p1[0], g + 8.2, p1[1]], [p0[0], g + 8.2, p0[1]]); }
  // inner court, keep with a steep slate roof, the tall main tower
  Bx(0, -4, 26, 24, 22, g - 1, wall2); const kp = W(0, -4); V.c(roof); hipV(V, kp[0], kp[1], 27.5, 23.5, g + 23, 9, ry, 0, false);
  for (let s = -10; s <= 10; s += 4) for (const yy of [g + 8, g + 14.5]){ const a = W(s - 0.8, 7.05), b = W(s + 0.8, 7.05); M.win.q([a[0], yy, a[1]], [b[0], yy, b[1]], [b[0], yy + 2.6, b[1]], [a[0], yy + 2.6, a[1]]); }
  { const p = W(0, -2); towerK(p[0], p[1], g + 23, 5.6, 14, 15, wall, roof, 6); CTX.lamp(p[0], g + 53, p[1], [255, 220, 170]); }
  for (const [u, v, h, ch] of [[-12.5, 7.5, 31, 8], [12.5, 7.5, 33, 8.5], [-12.5, -15.5, 29, 7.5], [12.5, -15.5, 30, 8]]){ const p = W(u, v); towerK(p[0], p[1], g - 1, 2.6, h, ch, wall2, roof, 2); }
  // corner towers and the gatehouse
  for (const [u, v, r, h, ch] of [[-22, 22, 5.2, 23, 14], [22, 22, 5.2, 24, 14.5], [-22, -22, 4.6, 19, 11], [22, -22, 4.6, 20, 11.5]]){ const p = W(u, v); towerK(p[0], p[1], g - 1, r, h, ch, wall, roof, 3); CTX.lamp(p[0], g + h + ch*0.3, p[1], [255, 214, 170]); }
  Bx(0, 24.5, 13, 17.5, 7, g - 1, wall2); V.c(trim); for (let s = -5.5; s <= 5.5; s += 2.2){ const p = W(s, 27.6); boxV(V, 1.1, 1.3, 1.1, p[0], g + 16.5, p[1], ry); }
  { const a = W(-3, 28.1), b = W(3, 28.1), N = 8, P = [[a[0], g - 0.2, a[1]], [b[0], g - 0.2, b[1]]]; for (let k = 0; k <= N; k++){ const t = k/N, ang = PI*t, u = 3*Math.cos(ang), q = W(u, 28.1); P.push([q[0], g + 6 + 3*Math.sin(ang), q[1]]); }
    V.c('#3b2f26'); for (let k = 1; k < P.length - 1; k++) V.t(P[0], P[k], P[k + 1]); }
  for (const s of [-7.8, 7.8]){ const p = W(s, 26.5); towerK(p[0], p[1], g - 1, 3.4, 20.5, 9.5, wall, roof, 2); }
  for (const s of [-1, 1]){ const p = W(s*5, 31); cyl(M.v.c('#4a4038'), 0.15, 0.2, 3.4, p[0], g, p[1], 6); sph(M.nO, 0.45, p[0], g + 3.6, p[1], 6, 1.4); CTX.lamp(p[0], g + 3.8, p[1], [255, 160, 70]); }
  mPoly(cs.ring, 1);
};
const timberHouse = (b, zk) => { const r = building(M.v, b.ring, zk, Math.max(5, Math.min(9, b.h*0.6)), {pitch:true, roof:pick(['#8d4b3a', '#7a4636', '#5d6f86', '#9b5a3c']), noWin:false}), P = b.ring, s = sarea(P) > 0 ? 1 : -1;
  M.v.c('#5b3f2b'); for (let i = 0; i < P.length; i++){ const a = P[i], c = P[(i + 1) % P.length], L = Math.hypot(c[0] - a[0], c[1] - a[1]); if (L < 4) continue; const n = nrm2(a, c, s), ry = Math.atan2(-(c[1] - a[1]), c[0] - a[0]);
    for (let u = 0; u <= L; u += 2.4){ const x = a[0] + (c[0] - a[0])*u/L + n[0]*0.1, z = a[1] + (c[1] - a[1])*u/L + n[1]*0.1; boxV(M.v, 0.28, r.top - r.yb, 0.12, x, r.yb, z, ry); }
    const m = [(a[0] + c[0])/2 + n[0]*0.1, (a[1] + c[1])/2 + n[1]*0.1]; boxV(M.v, L, 0.3, 0.12, m[0], r.yb + (r.top - r.yb)*0.5, m[1], ry); boxV(M.v, L, 0.3, 0.12, m[0], r.top - 0.3, m[1], ry); } };
const farfaraway = () => {
  castle();
  // the show theatre behind the castle, dressed as its outer ward: stone walls, battlements, two squat towers
  const th = takeB(219, -93); if (th){ const P = th.ring, [lo, yb] = baseOf(P), V = M.v, s = sarea(P) > 0 ? 1 : -1; V.c('#d3c4ad', 0.03); prism(V, P, lo - 1, yb + 15, true); V.c('#8c8780'); capV(V, P, yb + 14.4);
    V.c('#c8b89f'); for (let i = 0; i < P.length; i++){ const a = P[i], c = P[(i + 1) % P.length], L = Math.hypot(c[0] - a[0], c[1] - a[1]), n = nrm2(a, c, s), ry = Math.atan2(-(c[1] - a[1]), c[0] - a[0]);
      for (let u = 1.2; u < L - 0.6; u += 2.6){ const x = a[0] + (c[0] - a[0])*u/L + n[0]*0.3, z = a[1] + (c[1] - a[1])*u/L + n[1]*0.3; boxV(V, 1.2, 1.3, 0.8, x, yb + 15, z, ry); }
      for (let u = 4; u < L - 3; u += 7){ const x = a[0] + (c[0] - a[0])*u/L, z = a[1] + (c[1] - a[1])*u/L; M.win.q([x - n[1]*0.6 + n[0]*0.05, yb + 8, z + n[0]*0.6 + n[1]*0.05], [x + n[1]*0.6 + n[0]*0.05, yb + 8, z - n[0]*0.6 + n[1]*0.05], [x + n[1]*0.6 + n[0]*0.05, yb + 10.4, z - n[0]*0.6 + n[1]*0.05], [x - n[1]*0.6 + n[0]*0.05, yb + 10.4, z + n[0]*0.6 + n[1]*0.05]); } }
    for (const k of [1, 2]){ const p = P[k]; V.c('#d3c4ad'); cyl(V, 4.2, 4.2, 19, p[0], lo - 1, p[1], 14); V.c('#55697f'); lathe(V, [[5, 0], [3.6, 2.4], [0, 9]], p[0], lo + 18, p[1], 14); } }
  // family coaster round a giant beanstalk
  const pb = takeB(0, 0, 'Puss In Boots’ Giant Journey'); if (pb){ const [lo] = gLo(pb.ring); M.k.c('#b98a5a'); prism(M.k, pb.ring, lo - 1, lo + 5); M.k.c('#7a4636'); const ob = obb(pb.ring); hipV(M.k, ob.cx, ob.cz, ob.L, ob.W, lo + 5, 4, ob.ry, 0.8); }
  { const c = [292, -52], g = GY(c[0], c[1]), V = M.v; V.c('#4f8a3a'); for (let s = 0; s < 2; s++){ const pts = []; for (let k = 0; k <= 24; k++){ const t = k/24, a = s*PI + t*5*PI, r = 1.4*(1 - t*0.5); pts.push([c[0] + Math.cos(a)*r, g - 0.5 + t*27, c[1] + Math.sin(a)*r]); } polyLineV(V, pts, 0.85*(1 - 0.3*s), 6); }
    V.c('#5fa040'); for (let k = 0; k < 14; k++){ const y = g + 3 + k*1.7, a = k*2.3, x = c[0] + Math.cos(a)*1.2, z = c[1] + Math.sin(a)*1.2, x2 = c[0] + Math.cos(a)*5.5, z2 = c[1] + Math.sin(a)*5.5; V.t([x, y, z], [x2, y + 1.6, z2 + 1.4], [x2 + 1.4, y - 0.2, z2]); }
    const pts = [[258,-66],[278,-76],[300,-72],[312,-56],[306,-36],[288,-28],[270,-34],[262,-48]], cps = pts.map((p, i) => [p[0], GY(p[0], p[1]) + 9 + 5*Math.sin(i*1.3), p[1], 0, 0]), S = crSample(cps, 1.6);
    V.c('#6a6f75'); S.forEach((s, i) => { const b = S[(i + 1) % S.length].p; seg(V, s.p, b, 0.32, 4); if (i % 7 === 0){ const g2 = GY(s.p[0], s.p[2]); seg(V, [s.p[0] + 2.6, g2 - 0.5, s.p[2]], [s.p[0] + 2.6, s.p[1] + 1, s.p[2]], 0.3, 5); seg(V, [s.p[0] + 2.6, s.p[1] + 1, s.p[2]], [s.p[0], s.p[1] + 0.3, s.p[2]], 0.22, 4); } });
    for (let c2 = 0; c2 < 5; c2++){ const s = S[(10 + c2*2) % S.length].p; V.c('#e07a2a'); boxV(V, 1.4, 1.2, 1.8, s[0], s[1] - 2.6, s[2], c2*0.2); } }
  // junior coaster by the lagoon
  { const pts = [[118,-112],[134,-118],[146,-108],[146,-92],[136,-84],[122,-88],[114,-98]], S = crSample(pts.map((p, i) => [p[0], GY(p[0], p[1]) + 3 + 3*Math.abs(Math.sin(i*1.1)), p[1], 0, 0]), 1.4), V = M.v;
    V.c('#c4402e'); S.forEach((s, i) => { const b = S[(i + 1) % S.length].p; seg(V, [s.p[0], s.p[1], s.p[2]], b, 0.25, 4); if (i % 6 === 0){ V.c('#e8c33a'); seg(V, [s.p[0], GY(s.p[0], s.p[2]) - 0.3, s.p[2]], s.p, 0.18, 4); V.c('#c4402e'); } }); }
};

// ---------- Madagascar: jungle, crate-stacked ride building, thatched huts, beach carousel, a shipwreck in the lagoon ----------
const ship = (x, z, y, ry, heel, pitch) => {
  const V = M.v, Lh = 30, secs = [], N = 10, cr = Math.cos(heel), sr = Math.sin(heel), cp = Math.cos(pitch), sp = Math.sin(pitch), c = Math.cos(ry), s = Math.sin(ry);
  const T = (u, h, w) => { let h1 = h*cr - w*sr, w1 = h*sr + w*cr; const u2 = u*cp - h1*sp, h2 = u*sp + h1*cp; return [x + u2*c + w1*s, y + h2, z - u2*s + w1*c]; };
  for (let i = 0; i <= N; i++){ const t = i/N, u = (t - 0.5)*Lh, b = 4.6*Math.pow(Math.sin(PI*(0.04 + 0.9*t)), 0.55) + (t > 0.85 ? 0 : 0), dep = 5.2*Math.pow(Math.sin(PI*(0.02 + 0.96*t)), 0.35), top = t < 0.2 ? 6.2 : t > 0.82 ? 6.0 : 5.0;
    secs.push([T(u, top, -b), T(u, top*0.45, -b*0.98), T(u, -dep*0.2, -b*0.7), T(u, -dep*0.55, 0), T(u, -dep*0.2, b*0.7), T(u, top*0.45, b*0.98), T(u, top, b)]); }
  for (let i = 0; i < N; i++) for (let k = 0; k < 6; k++){ V.c(k === 0 || k === 5 ? '#6b4a30' : '#563a26', 0.08); V.q(secs[i][k], secs[i][k + 1], secs[i + 1][k + 1], secs[i + 1][k]); }
  V.c('#8a6a48'); for (let i = 0; i < N; i++) V.q(secs[i][0], secs[i + 1][0], secs[i + 1][6], secs[i][6]);
  V.c('#3c2a1c'); for (let i = 1; i < N - 1; i += 2) for (const k of [0, 6]){ const p = secs[i][k], q = secs[i][k === 0 ? 1 : 5]; seg(V, p, q, 0.12, 3); }
  V.c('#6b4a30'); const ca = T(-11, 6.2, 0); obox(V, [ca[0], ca[1] + 1.4, ca[2]], [c*cp, sp, -s*cp], [0, 1, 0], [s, 0, c], 6, 2.8, 6.5);
  V.c('#4a3424'); const m1 = T(2, 5.0, 0), m2 = T(-5, 5.0, 0); seg(V, m1, [m1[0] + 1.5, m1[1] + 16, m1[2] - 1], 0.35, 6); seg(V, m2, [m2[0] - 2.5, m2[1] + 8, m2[2] + 1.5], 0.3, 6);
  seg(V, [m1[0] - 4, m1[1] + 11, m1[2]], [m1[0] + 5, m1[1] + 12, m1[2] - 0.5], 0.14, 3);
  V.c('#e7dcc4'); V.q([m1[0] - 3.8, m1[1] + 10.8, m1[2] + 0.1], [m1[0] + 4.8, m1[1] + 11.8, m1[2] - 0.4], [m1[0] + 3.5, m1[1] + 5.5, m1[2] + 1.2], [m1[0] - 2.5, m1[1] + 6.5, m1[2] + 1.6]);
  V.c('#3a2a1d'); const bow = T(Lh/2, 5.5, 0); seg(V, bow, [bow[0] + 7*c*cp, bow[1] + 3.5, bow[2] - 7*s*cp], 0.18, 4);
};
const madagascar = () => {
  const V = M.v;
  // crate-stacked ride building: jungle-green roof, rock work and big shipping crates at the front
  const ca = takeB(0, 0, 'A Crate Adventure'); if (ca){ const P = ca.ring, [lo, yb] = baseOf(P, 0.3), ob = obb(P); V.c('#7a6a52', 0.04); prism(V, P, lo - 1.5, yb + 12, true); V.c('#6d6a4a'); capV(V, P, yb + 12);
    V.c('#9a8452', 0.05); hipV(V, ob.cx, ob.cz, ob.L*0.6, ob.W*0.55, yb + 12, 7, ob.ry, 0); V.c('#7a6a52'); prism(V, offsetPoly(P, 0.2), yb + 11.6, yb + 13, true);
    for (let i = 0; i < P.length; i++){ const p = P[i]; V.c(pick(['#5f7d3c', '#6d8a45', '#4f6e35']), 0.1); rock(V, p[0], yb + 12, p[1], 3.2, 2.0, 3.2); }
    for (const [x, z, k] of [[62, -172, 0], [70, -168, 1], [66, -166, 2], [96, -160, 0], [104, -164, 1]]){ const g = GY(x, z), sz = 3.2 + k*0.6; V.c(pick(['#b48a52', '#a67c48', '#c09660']), 0.06); boxV(V, sz, sz, sz, x, g - 0.2, z, k*0.4); if (k === 1){ boxV(V, 2.6, 2.6, 2.6, x + 0.4, g + sz - 0.2, z - 0.3, 0.9); }
      V.c('#6e5434'); boxV(V, sz + 0.1, 0.3, sz + 0.1, x, g + sz*0.5 - 0.2, z, k*0.4); } }
  // thatched huts
  for (const nm of ["Gloria's Snack Shack", "Marty's Casa Del Wild"]){ const b = takeB(0, 0, nm); if (!b) continue; const P = b.ring, [lo, yb] = baseOf(P, 0.3); V.c('#b49a68'); prism(V, P, lo - 1, yb + 3.8, true); prism(M.win, offsetPoly(P, 0.05), yb + 1.0, yb + 2.8, true);
    V.c('#a88a52', 0.06); polyRoof(V, P, yb + 3.8, nm[0] === 'G' ? 6 : 5, 1.6); }
  // beach carousel: striped tent roof on a round deck
  const kj = takeB(0, 0, "King Julien's Beach Party-Go-Round"); if (kj){ const c = cen(kj.ring), g = GY(c[0], c[1]), N = 16;
    V.c('#d9c8a0'); cyl(V, 10, 10, 1.2, c[0], g - 0.2, c[1], 24, true); V.c('#e9b23a'); for (let k = 0; k < 12; k++){ const a = k/12*TAU, x = c[0] + Math.cos(a)*8.6, z = c[1] + Math.sin(a)*8.6; seg(V, [x, g + 1, z], [x, g + 5.6, z], 0.12, 4); }
    V.c('#4f9a6a'); cyl(V, 1.4, 1.4, 6, c[0], g + 1, c[1], 10);
    for (let k = 0; k < 8; k++){ const a = k/8*TAU + 0.2, x = c[0] + Math.cos(a)*6, z = c[1] + Math.sin(a)*6; V.c(['#e04a3a', '#3a8ad0', '#f2c230', '#6ab04a'][k % 4]); boxV(V, 1.2, 1.4, 1.8, x, g + 1.4, z, a); }
    for (let k = 0; k < N; k++){ const a0 = k/N*TAU, a1 = (k + 1)/N*TAU, P0 = [c[0] + Math.cos(a0)*10.8, g + 6.4, c[1] + Math.sin(a0)*10.8], P1 = [c[0] + Math.cos(a1)*10.8, g + 6.4, c[1] + Math.sin(a1)*10.8];
      V.c(k % 2 ? '#f4ead2' : ['#e05a3a', '#2f8a7a', '#f0b22a', '#6a4aa0'][(k >> 1) % 4]); V.t(P0, P1, [c[0], g + 12, c[1]]); V.q(P0, P1, [P1[0], g + 5.4, P1[2]], [P0[0], g + 5.4, P0[2]]); }
    V.c('#e9b23a'); sph(V, 0.7, c[0], g + 12.3, c[1], 8); prism(M.nY, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(k => [c[0] + Math.cos(k/12*TAU)*10.85, c[1] + Math.sin(k/12*TAU)*10.85]), g + 5.4, g + 5.6, true); CTX.lamp(c[0], g + 12.6, c[1], [255, 214, 140]); }
  ship(34, -123, WL - 1.6, 0.42, 0.24, 0.07);
};

// ---------- ground paint ----------
const paintGround = () => {
  const P = (poly, c) => CTX.paint(poly, c);
  P(USS_KEEP, [176, 168, 154]);
  P(ZP.HW, [194, 176, 164]); P(ZP.NY, [136, 132, 127]); P(ZP.SF, [158, 164, 171]); P(ZP.EG, [204, 182, 138]); P(ZP.MG, [188, 174, 134]); P(ZP.FF, [182, 168, 148]);
  // jungle and planting beds
  for (const g of [[[150,88],[244,78],[262,140],[300,148],[300,206],[200,196],[150,150]], [[184,-40],[250,-30],[300,-14],[336,-2],[326,30],[258,22],[226,2],[190,-8]], [[20,-206],[60,-218],[84,-226],[110,-206],[60,-190],[30,-186]],
                   [[96,-150],[130,-140],[150,-176],[118,-196]], [[150,0],[200,-10],[205,30],[180,40],[150,30]], [[350,120],[388,112],[376,140],[350,152]], [[230,-120],[250,-100],[262,-84],[236,-90]]]) P(g, [90, 118, 68]);
  for (const p of USS_PATHS) CTX.line(p, 6.5, [192, 184, 170]);
  { const c = [338, 84], A = []; for (let k = 0; k <= 16; k++){ const t = (96 + 144*k/16)*PI/180; A.push([c[0] + Math.cos(t)*37, c[1] + Math.sin(t)*37]); } A.push([c[0] + 30, c[1] - 30], [c[0] + 34, c[1] + 26]); P(A, [150, 150, 146]); }
  P(USS_LAGOON, [143, 181, 202]); P(USS_POOL, [143, 181, 202]); CTX.line([...RIVER, RIVER[0]], 9.5, [143, 181, 202]);
  P([[60,-20],[110,-24],[112,16],[66,24]], [198, 172, 124]);    // sandy jeep-ride ground
};

// ---------- trees and lamps ----------
const plant = () => {
  let n = 0;
  for (let z = -288; z < 218; z += 6) for (let x = -196; x < 398; x += 6){
    const px = x + (R() - 0.5)*5, pz = z + (R() - 0.5)*5; if (!inPoly(USS_KEEP, px, pz) || mGet(px, pz)) continue;
    const zk = zoneAt(px, pz), dl = (() => { let d = 1e9; for (let i = 0; i < USS_LAGOON.length; i += 2){ const p = USS_LAGOON[i]; d = Math.min(d, Math.hypot(p[0] - px, p[1] - pz)); } return d; })();
    const shore = dl < 14 && dl > 4, dens = shore ? 0.5 : {LW:0.74, MG:0.76, FF:0.28, EG:0.16, SF:0.07, HW:0.1, NY:0.06}[zk];
    if (R() > dens) continue;
    let kind, s; const r = R();
    if (zk === 'LW' || zk === 'MG'){ kind = r < 0.45 ? 'raintree' : r < 0.78 ? 'palm' : 'd'; } else if (zk === 'FF'){ kind = r < 0.6 ? 'd' : 'raintree'; } else kind = r < 0.75 ? 'palm' : 'raintree';
    if (shore && R() < 0.6) kind = 'palm';
    s = kind === 'palm' ? 2.0 + R()*0.9 : kind === 'raintree' ? 3.0 + R()*1.6 : 2.4 + R()*1.2;
    CTX.tree(px, pz, s, kind); n++;
  }
  // lamp posts along the walks
  for (const p of USS_PATHS){ let acc = 9; for (let i = 0; i < p.length - 1; i++){ const a = p[i], b = p[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.1) continue; const nx = -(b[1] - a[1])/L, nz = (b[0] - a[0])/L;
    for (let d = acc; d < L; d += 22){ const x = lerp(a[0], b[0], d/L) + nx*3, z = lerp(a[1], b[1], d/L) + nz*3, m = mGet(x, z); if (m === 1 || m === 2) continue; const g = GY(x, z);
      const zk = zoneAt(x, z);
      if (zk === 'LW' || zk === 'MG'){ M.v.c('#5b4636'); seg(M.v, [x, g - 0.3, z], [x, g + 3.0, z], 0.12, 4); cone(M.v.c('#3b2f26'), 0.35, -0.6, x, g + 3.6, z, 6); sph(M.nO, 0.3, x, g + 3.4, z, 6, 1.5); CTX.lamp(x, g + 3.6, z, [255, 150, 70]); }
      else { M.v.c(zk === 'SF' ? '#c9d0d8' : '#2f3338'); seg(M.v, [x, g - 0.3, z], [x, g + 4.3, z], 0.08, 4); boxV(zk === 'SF' ? M.nB : M.nY, 0.45, 0.4, 0.45, x, g + 4.3, z); CTX.lamp(x, g + 4.6, z, zk === 'SF' ? [190, 225, 255] : [255, 214, 160]); } }
    acc = ((acc - L) % 22 + 22) % 22; } }
  return n;
};

Object.assign(SITES, {uss:{zh:'新加坡环球影城', en:'Universal Studios Singapore', lat:1.2540, lon:103.8223, r:420, keep:USS_KEEP, h:55,
  lt:{m:0, c:'#ffd9a8', k:0.5, e:0.3},
  build(ctx){
    const g = new THREE.Group(); R = ctx.rng; GY = ctx.gy; CTX = ctx; M = mkMats(); TRACKS = [];
    MK.a = new Uint8Array(MK.n*MK.m);
    BLD = USS_BLD.map(b => ({name:b[0], h:b[1], ring:b[2], c:cen(b[2]), done:false}));
    { const hs = USS_LAGOON.map(p => GY(p[0], p[1])).sort((a, b) => a - b); WL = Math.max(hs[Math.floor(hs.length*0.75)], -0.05) + 0.25; }
    // occupancy: buildings, water, paths
    for (const b of BLD) mPoly(offsetPoly(b.ring, 1.5), 1);
    mPoly(USS_LAGOON, 2); mPoly(USS_POOL, 2); mLine([...RIVER, RIVER[0]], 7, 2); for (const p of USS_PATHS) mLine(p, 3, 3);
    paintGround();
    lagoon();
    // the coasters first (other structures check their clearance)
    { let s = 0, k = 0; const st = findB(0, 0, 'Battlestar Galactica'); for (const p of [[-68.2, 76.9], [-43.1, 93.4], [-72.6, 83.6], [-47.5, 100], [-57, 89]]){ s = Math.max(s, GY(p[0], p[1])); k++; } GST = s + 0.4; }
    coaster(HUMAN, false, M.red, [255, 96, 80], ['#d8dce0', '#c21c26']);
    coaster(CYLON, true, M.blu, [96, 150, 255], ['#3a4048', '#2353c4']);
    hollywood(); newyork(); scifi(); egypt(); lostworld(); farfaraway(); madagascar();
    // every other real footprint inside the park: a themed building of its zone
    for (const b of BLD){ if (b.done) continue; const zk = zoneAt(b.c[0], b.c[1]), boh = b.c[1] < -195 && b.c[0] > 100;
      if (zk === 'FF' && !boh) timberHouse(b, zk); else building(M.v, b.ring, boh ? 'SF' : zk, clamp(b.h, 5, zk === 'HW' || zk === 'NY' ? 14 : 12), boh ? {wall:'#bdbeb9', roof:'#9c9d98', pitch:false} : {}); b.done = true; }
    const nTrees = plant();
    for (const k of Object.keys(M)) flushV(g, M[k]);
    g.userData.ussStats = {trees:nTrees, lenHuman:TRACKS[0].length, lenCylon:TRACKS[1].length, stationFloor:+GST.toFixed(1), lagoonLevel:+WL.toFixed(2)};
    R = GY = CTX = M = null; BLD = null; TRACKS = []; MK.a = null;
    return g; }}});
}
