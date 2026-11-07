global.fs = require('fs'); const vm = require('vm');
const SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/';
global.THREE = require(SC + 'vend/package/build/three.min.js'); global.navigator = {userAgent:'node'};
let src = fs.readFileSync(SC + 'sgreal/kit/lmbase.js', 'utf8').replace(/function lmAdd\(g, geo, spec, x, y, z, ry, ds\)\{/, 'function lmAdd(g, geo, spec, x, y, z, ry, ds){ __calls.n++;');
const key = process.argv[2];
const code = 'var __calls = {n:0};\n' + src + '\n' + fs.readFileSync(SC + 'lm40/sg40f/sg40f.js', 'utf8') + `
;(function(){ const S = SITES[${JSON.stringify(key)}]; const out = {paint:[], tree:[], lamp:[], low:[]};
  const ctx = {gy:(x, z) => 1.0 + 0.002*x, paint:(p, rgb) => out.paint.push([p, rgb]), line:() => {}, tree:(x, z, s, k) => out.tree.push([x, z, s, k]), lamp:(x, y, z) => out.lamp.push([x, z]), rng:mulberry32(9)};
  LMCTX = {mats:new Map(), fx:[], rng:ctx.rng, u:{base:{value:0}, top:{value:20}, col:{value:new THREE.Color('#fff')}, k:{value:0.5}, mode:{value:0}, even:{value:0}}};
  const t0 = Date.now(); const g = S.build(ctx); const ms = Date.now() - t0; let tris = 0; const mats = new Set(); const v = new THREE.Vector3(); g.updateMatrixWorld(true);
  g.traverse(o => { if (!o.isMesh) return; mats.add(o.material); const p = o.geometry.attributes.position; tris += o.geometry.index ? o.geometry.index.count/3 : p.count/3; for (let i = 0; i < p.count; i += 3){ v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); out.low.push([+v.x.toFixed(1), +v.z.toFixed(1)]); } });
  console.log(${JSON.stringify(key)}, JSON.stringify({calls:__calls.n, tris:Math.round(tris), ms, mats:mats.size, trees:out.tree.length, lamps:out.lamp.length, paints:out.paint.length, keepN:S.keep.length, r:S.r}));
  out.keep = S.keep; fs.writeFileSync(${JSON.stringify(SC + 'lm40/sg40f/')} + 'st_' + ${JSON.stringify(key)} + '.json', JSON.stringify(out));
})();`;
vm.runInThisContext(code);
