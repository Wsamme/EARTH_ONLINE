// node sitestat.js : build the three sites with a stub ctx (flat ground 3 m), print calls / tris / ms
const fs = require('fs'), vm = require('vm'), SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/';
global.THREE = require(SC + 'vend/package/build/three.min.js'); global.navigator = {userAgent:'node'};
let src = fs.readFileSync(SC + 'sgreal/kit/lmbase.js', 'utf8').replace(/function lmAdd\(g, geo, spec, x, y, z, ry, ds\)\{/, 'function lmAdd(g, geo, spec, x, y, z, ry, ds){ __calls.n++;');
const code = 'var __calls = {n:0};\n' + src + '\n' + fs.readFileSync('sg40h.js', 'utf8') + `
for (const k of ['sgsutd', 'sgchangivillage', 'sgchekjawa']){ const S = SITES[k]; const st = {paint:0, line:0, tree:0, lamp:0};
  const ctx = {gy:(x, z) => 3 + 0.002*x, paint:() => st.paint++, line:() => st.line++, tree:() => st.tree++, lamp:() => st.lamp++, rng:mulberry32(3)};
  LMCTX = {mats:new Map(), fx:[], rng:mulberry32(7), u:{base:{value:0}, top:{value:S.h}, col:{value:new THREE.Color(S.lt.c)}, k:{value:S.lt.k}, mode:{value:S.lt.m}, even:{value:0}}};
  __calls.n = 0; const t0 = Date.now(); const g = S.build(ctx); let tris = 0; const mats = new Set(); g.traverse(o => { if (o.isMesh){ tris += o.geometry.attributes.position.count/3; mats.add(o.material); } });
  console.log(k, JSON.stringify({calls:__calls.n, tris, ms:Date.now() - t0, mats:mats.size, r:S.r, keep:S.keep.length, ...st})); }`;
vm.runInThisContext(code);
