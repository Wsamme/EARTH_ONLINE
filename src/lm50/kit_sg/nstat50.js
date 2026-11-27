// lm50 (Singapore): offline module stats (replaces lm22/marina/nstat.js, which is gone). Uses the app's own helpers (lmbase.js,
// regenerated from site/app.js by mklmbase.sh).   node R/lm50/kit_sg/nstat50.js <module.js> [key1,key2,...]
// per key: calls (helper meshes before merge), tris, ms, mats (colour specs), rmax (plan radius m) vs r, ymin / ymax, h, label,
// and the SG_PLACES entries of the module. Without keys: every LANDMARKS key the module defines.
const fs = require('fs'), vm = require('vm');
const SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/';
const [file, keysArg] = process.argv.slice(2);
if (!file){ console.log('usage: node nstat50.js <module.js> [key1,key2]'); process.exit(1); }
global.window = global; global.THREE = require(SC + 'vend/package/build/three.min.js'); global.navigator = {userAgent:'node'};
vm.runInThisContext(fs.readFileSync(require('path').join(__dirname, 'lmbase.js'), 'utf8') + '\nglobal.__L = LANDMARKS; global.__P = SG_PLACES; global.__S = SITES; global.__mb = mulberry32; global.__mg = lmMerge; global.__ctx = v => { LMCTX = v; };', {filename:'lmbase.js'});
vm.runInThisContext(fs.readFileSync(file, 'utf8'), {filename:file});
const keys = keysArg ? keysArg.split(',') : Object.keys(__L);
let tot = 0;
for (const k of keys){
  const D = __L[k]; if (!D){ console.log(k, 'NOT DEFINED'); continue; }
  const lt = D.lt || {m:0, c:'#ffffff', k:0.5};
  const ctx = {mats:new Map(), fx:[], rng:__mb(7919 + 13), u:{base:{value:0}, top:{value:D.h}, col:{value:new THREE.Color(lt.c || '#fff')}, k:{value:lt.k || 0}, mode:{value:lt.m || 0}, even:{value:lt.e || 0}}};
  __ctx(ctx); const t0 = process.hrtime.bigint(); let g;
  try { g = D.build(); } catch (e){ console.log(k, 'BUILD ERROR', e.message); continue; }
  let calls = 0; g.traverse(o => { if (o.isMesh) calls++; });
  __mg(g); const ms = Number(process.hrtime.bigint() - t0)/1e6;
  let tris = 0, ymin = 1e9, ymax = -1e9, rmax = 0; g.updateMatrixWorld(true); const v = new THREE.Vector3();
  g.traverse(o => { if (!o.isMesh) return; const p = o.geometry.attributes.position; tris += (o.geometry.index ? o.geometry.index.count : p.count)/3;
    for (let i = 0; i < p.count; i++){ v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); ymin = Math.min(ymin, v.y); ymax = Math.max(ymax, v.y); rmax = Math.max(rmax, Math.hypot(v.x, v.z)); } });
  tot += tris; __ctx(null);
  console.log(JSON.stringify({k, calls, tris:Math.round(tris), ms:+ms.toFixed(0), mats:ctx.mats.size, rmax:+rmax.toFixed(1), r:D.r, ymin:+ymin.toFixed(1), ymax:+ymax.toFixed(1), h:D.h, label:D.label !== false}));
}
console.log('tris total', Math.round(tot), '| SG_PLACES', JSON.stringify(__P.filter(p => keys.includes(p.type))), '| SITES', Object.keys(__S).join(','));
