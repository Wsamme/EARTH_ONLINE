const fs = require('fs'), vm = require('vm'); const SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/';
global.THREE = require(SC + 'vend/package/build/three.min.js'); global.navigator = {userAgent:'node'};
let src = fs.readFileSync(SC + 'sgreal/kit/lmbase.js', 'utf8').replace(/function lmAdd\(g, geo, spec, x, y, z, ry, ds\)\{/, 'function lmAdd(g, geo, spec, x, y, z, ry, ds){ __calls.n++;');
vm.runInThisContext('var __calls = {n:0};\n' + src + '\n' + fs.readFileSync(process.argv[2], 'utf8') + `
{ const S = SITES.sgsmu; let np = 0, nt = 0, nl = 0;
  LMCTX = {mats:new Map(), fx:[], rng:mulberry32(7), u:{base:{value:0}, top:{value:40}, col:{value:new THREE.Color('#fff')}, k:{value:1}, mode:{value:1}, even:{value:0}}};
  const ctx = {gy:(x, z) => 3 + 0.02*x, paint:() => np++, line:() => 0, tree:() => nt++, lamp:() => nl++, rng:mulberry32(3)};
  const t0 = Date.now(); const g = S.build(ctx); let tris = 0; g.traverse(o => { if (o.isMesh) tris += o.geometry.index ? o.geometry.index.count/3 : o.geometry.attributes.position.count/3; });
  console.log('sgsmu calls', __calls.n, 'tris', Math.round(tris), 'ms', Date.now() - t0, 'mats', LMCTX.mats.size, 'paint', np, 'trees', nt, 'lamps', nl, 'keep pts', S.keep.length); }`);
