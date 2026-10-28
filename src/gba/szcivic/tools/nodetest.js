// node smoke test: build every landmark / site of the module with the kit helpers (no browser), print tris / calls / ms / rmax / mats
const fs = require('fs'), path = require('path');
const SC = '/tmp/claude-0/-home-claude/bad1757d-5741-5c42-90f7-67ab565b955b/scratchpad';
global.THREE = require(SC + '/vend/package/build/three.min.js');
const base = fs.readFileSync(SC + '/lm16/kit/base.js', 'utf8'), mod = fs.readFileSync(process.argv[2], 'utf8');
const only = process.argv[3] ? process.argv[3].split(',') : null;
const run = new Function('only', base + '\n' + mod + `
let calls = 0; const wrap = n => { const f = eval(n); return f; };
const out = [];
for (const [k, d] of Object.entries(LANDMARKS)){ if (only && !only.includes(k)) continue;
  LMCTX = {mats:new Map(), fx:[], rng:mulberry32(7), u:{base:{value:0}, top:{value:d.h}, col:{value:new THREE.Color('#fff')}, k:{value:1}, mode:{value:0}, even:{value:0}}};
  const t0 = Date.now(); const g = d.build(); const ms = Date.now() - t0; let tris = 0, rmax = 0, meshes = 0, ymin = Infinity, ymax = -Infinity;
  g.updateMatrixWorld(true); const v = new THREE.Vector3();
  g.traverse(o => { if (!o.isMesh) return; meshes++; const a = o.geometry.attributes.position; tris += (o.geometry.index ? o.geometry.index.count : a.count)/3;
    for (let i = 0; i < a.count; i++){ v.fromBufferAttribute(a, i).applyMatrix4(o.matrixWorld); if (!isFinite(v.x + v.y + v.z)) throw new Error(k + ' NaN vertex'); rmax = Math.max(rmax, Math.hypot(v.x, v.z)); ymin = Math.min(ymin, v.y); ymax = Math.max(ymax, v.y); } });
  out.push([k, {tris:Math.round(tris), meshes, mats:LMCTX.mats.size, ms, rmax:Math.round(rmax), r:d.r, y:[+ymin.toFixed(1), +ymax.toFixed(1)], h:d.h}]);
}
for (const [k, S] of Object.entries(SITES)){ if (only && !only.includes(k)) continue;
  LMCTX = {mats:new Map(), fx:[], rng:mulberry32(7), u:{base:{value:0}, top:{value:50}, col:{value:new THREE.Color('#fff')}, k:{value:1}, mode:{value:0}, even:{value:0}}};
  let trees = 0, lamps = 0, paints = 0; const rng = mulberry32(3);
  const ctx = {gy:(x, z) => 2 + 0*x, rng, paint(){ paints++; }, line(){ paints++; }, tree(x, z, s, kd){ if (!isFinite(x + z + s)) throw new Error('tree NaN'); trees++; }, lamp(x, y, z){ if (!isFinite(x + y + z)) throw new Error('lamp NaN'); lamps++; }};
  const t0 = Date.now(); const g = S.build(ctx); const ms = Date.now() - t0; let tris = 0; g.traverse(o => { if (o.isMesh) tris += o.geometry.attributes.position.count/3; });
  out.push([k, {site:1, tris:Math.round(tris), mats:LMCTX.mats.size, ms, trees, lamps, paints, keep:(S.keep || []).length}]);
}
return {out, places:SG_PLACES};`);
const r = run(only);
for (const [k, s] of r.out) console.log(k, JSON.stringify(s));
console.log('places', JSON.stringify(r.places.map(p => [p.type, +p.lat.toFixed(6), +p.lon.toFixed(6), p.rot])));
