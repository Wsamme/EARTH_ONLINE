// offline check: build every key of szcbd.js in node (three.js r128 + the kit stubs), print tris / calls / ms / rmax / lowest y
const fs = require('fs'), vm = require('vm'), SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad/';
const ctx = {console, Math, JSON, Float32Array, Uint16Array, Uint32Array, Array, Object, Map, Set, Date};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(SC + 'vend/package/build/three.min.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync(SC + 'lm16/kit/base.js', 'utf8') + '\n;', ctx);
vm.runInContext('{' + fs.readFileSync(process.argv[2], 'utf8') + '}', ctx);
const LMS = vm.runInContext('LANDMARKS', ctx), SGP = vm.runInContext('SG_PLACES', ctx); ctx.THREE = vm.runInContext('THREE', ctx);
const only = process.argv[3] ? process.argv[3].split(',') : null;
for (const k of Object.keys(LMS)){
  if (only && !only.includes(k)) continue;
  const def = LMS[k], lt = def.lt;
  vm.runInContext(`LMCTX = {mats:new Map(), fx:[], rng:mulberry32(7919 + 13), u:{base:{value:0}, top:{value:${def.h}}, col:{value:new THREE.Color('${lt.c}')}, k:{value:${lt.k}}, mode:{value:${lt.m}}, even:{value:0}}};`, ctx);
  const t0 = Date.now(); let g;
  try { g = def.build(); } catch (e){ console.log(k, 'ERROR', e.stack.split('\n').slice(0, 3).join(' | ')); continue; }
  const ms = Date.now() - t0; let tris = 0, calls = 0, rmax = 0, ylo = 1e9, yhi = -1e9, low = [], nan = 0;
  g.traverse(o => { if (!o.geometry || !o.isMesh) return; calls++; o.updateMatrixWorld(true); const p = o.geometry.attributes.position, idx = o.geometry.index; tris += (idx ? idx.count : p.count)/3;
    const v = new ctx.THREE.Vector3(); for (let i = 0; i < p.count; i++){ v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); if (!isFinite(v.x + v.y + v.z)) { nan++; continue; } rmax = Math.max(rmax, Math.hypot(v.x, v.z)); ylo = Math.min(ylo, v.y); yhi = Math.max(yhi, v.y); } });
  const mats = vm.runInContext('LMCTX.mats.size', ctx);
  console.log(k, JSON.stringify({ms, calls, tris:Math.round(tris), mats, rmax:Math.round(rmax), r:def.r, ylo:+ylo.toFixed(1), yhi:+yhi.toFixed(1), h:def.h, nan}));
}
console.log('places', JSON.stringify(SGP));
// dump the lower-25 m vertices (in east / south metres around the placement point) for the offline overlay check
if (process.env.DUMP){ const out = {};
  for (const k of Object.keys(LMS)){ if (only && !only.includes(k)) continue; const def = LMS[k], lt = def.lt, pl = SGP.find(p => p.type === k); if (!pl) continue;
    vm.runInContext(`LMCTX = {mats:new Map(), fx:[], rng:mulberry32(7919 + 13), u:{base:{value:0}, top:{value:${def.h}}, col:{value:new THREE.Color('${lt.c}')}, k:{value:${lt.k}}, mode:{value:${lt.m}}, even:{value:0}}};`, ctx);
    const g = def.build(); g.rotation.y = pl.rot; g.updateMatrixWorld(true); const pts = [], seen = new Set();
    g.traverse(o => { if (!o.isMesh) return; const p = o.geometry.attributes.position, v = new ctx.THREE.Vector3();
      for (let i = 0; i < p.count; i++){ v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); if (v.y >= 25) continue; const key = Math.round(v.x) + ',' + Math.round(v.z); if (seen.has(key)) continue; seen.add(key); pts.push([+v.x.toFixed(1), +v.z.toFixed(1)]); } });
    out[k] = {lat:pl.lat, lon:pl.lon, pts}; }
  fs.writeFileSync(process.env.DUMP, JSON.stringify(out)); }
